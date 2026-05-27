import { cp, lstat, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AgentKitManifest, AgentKitSkillManifest } from "../types.js";
import { readAgentKit } from "../package/reader.js";

export interface ClaudeCodeExportOptions {
  force?: boolean;
}

export interface ClaudeCodeExportResult {
  destinationDir: string;
  pluginFolder: string;
  exportedSkillFolders: string[];
  pluginManifestPath: string;
  warnings: string[];
}

const MARKER_FILE = ".agentkitforge-export.json";
const SUPPORTING_DIRECTORIES = ["policies", "templates", "workflows", "references"] as const;

export async function exportAgentKitToClaudeCode(
  kitPath: string,
  destinationDir: string,
  options: ClaudeCodeExportOptions = {}
): Promise<ClaudeCodeExportResult> {
  const kit = await readAgentKit(kitPath);
  if (!kit.manifest) {
    throw new Error("Unable to export to Claude Code because agentkit.yaml is invalid.");
  }

  const resolvedDestination = path.resolve(destinationDir);
  await assertSafeDestination(resolvedDestination);
  await mkdir(resolvedDestination, { recursive: true });

  const pluginFolder = path.join(resolvedDestination, pluginFolderName(kit.manifest));
  await preparePluginFolder(pluginFolder, options.force === true);
  await mkdir(pluginFolder, { recursive: true });

  await writePluginManifest(pluginFolder, kit.manifest);
  await writeMarker(pluginFolder, kit.manifest);
  await copyIfPresent(path.join(kit.rootPath, "AGENTKIT.md"), path.join(pluginFolder, "AGENTKIT.md"));
  await copyIfPresent(path.join(kit.rootPath, "README.md"), path.join(pluginFolder, "README.md"));

  const exportedSkillFolders: string[] = [];
  for (const skill of [...kit.manifest.skills].sort((left, right) => left.id.localeCompare(right.id))) {
    const sourceSkillDir = path.dirname(path.join(kit.rootPath, skill.path));
    const destinationSkillDir = path.join(pluginFolder, "skills", skill.id);
    await mkdir(path.dirname(destinationSkillDir), { recursive: true });
    await cp(sourceSkillDir, destinationSkillDir, { recursive: true });
    exportedSkillFolders.push(destinationSkillDir);
  }

  for (const directory of SUPPORTING_DIRECTORIES) {
    await copyDirectoryIfPresent(path.join(kit.rootPath, directory), path.join(pluginFolder, directory));
  }

  return {
    destinationDir: resolvedDestination,
    pluginFolder,
    exportedSkillFolders,
    pluginManifestPath: path.join(pluginFolder, ".claude-plugin", "plugin.json"),
    warnings: [
      "Claude Code plugin schema support is an initial AgentKitForge adapter; verify loading behavior with your Claude Code version."
    ]
  };
}

async function preparePluginFolder(pluginFolder: string, force: boolean): Promise<void> {
  if (!(await exists(pluginFolder))) {
    return;
  }

  if (!force) {
    throw new Error(
      `Refusing to overwrite existing Claude Code plugin folder: ${pluginFolder}. Use --force to replace the AgentKitForge-generated plugin folder.`
    );
  }

  await assertAgentKitForgeGeneratedPlugin(pluginFolder);
  await rm(pluginFolder, { recursive: true, force: true });
}

async function assertAgentKitForgeGeneratedPlugin(pluginFolder: string): Promise<void> {
  const markerPath = path.join(pluginFolder, MARKER_FILE);
  if (!(await exists(markerPath))) {
    throw new Error(`Refusing to remove non-AgentKitForge plugin folder: ${pluginFolder}`);
  }

  const marker = JSON.parse(await readFile(markerPath, "utf8")) as {
    generatedBy?: string;
    target?: string;
  };
  if (marker.generatedBy !== "agentkitforge" || marker.target !== "claude-code") {
    throw new Error(`Refusing to remove plugin folder without Claude Code AgentKitForge marker: ${pluginFolder}`);
  }
}

async function writePluginManifest(pluginFolder: string, manifest: AgentKitManifest): Promise<void> {
  const pluginManifestPath = path.join(pluginFolder, ".claude-plugin", "plugin.json");
  await mkdir(path.dirname(pluginManifestPath), { recursive: true });
  await writeFile(
    pluginManifestPath,
    `${JSON.stringify(
      {
        generatedBy: "agentkitforge",
        target: "claude-code",
        schemaVersion: "0.1",
        name: manifest.name,
        id: manifest.id,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author?.name,
        skills: manifest.skills.map((skill) => ({
          id: skill.id,
          path: `skills/${skill.id}/SKILL.md`,
          description: skill.description,
          triggers: skill.triggers
        }))
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function writeMarker(pluginFolder: string, manifest: AgentKitManifest): Promise<void> {
  await writeFile(
    path.join(pluginFolder, MARKER_FILE),
    `${JSON.stringify(
      {
        generatedBy: "agentkitforge",
        target: "claude-code",
        kitId: manifest.id
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function copyIfPresent(source: string, destination: string): Promise<void> {
  if (!(await exists(source))) {
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function copyDirectoryIfPresent(source: string, destination: string): Promise<void> {
  if (!(await exists(source))) {
    return;
  }

  await cp(source, destination, { recursive: true });
}

async function assertSafeDestination(destinationRoot: string): Promise<void> {
  const resolved = path.resolve(destinationRoot);
  const parsed = path.parse(resolved);
  const home = path.resolve(os.homedir());
  const key = comparablePath(resolved);

  if (key === comparablePath(parsed.root)) {
    throw new Error(`Refusing to export to filesystem root: ${resolved}`);
  }

  if (key === comparablePath(home)) {
    throw new Error(`Refusing to export to user home directory: ${resolved}`);
  }

  if (await exists(resolved)) {
    const stats = await lstat(resolved);
    if (!stats.isDirectory()) {
      throw new Error(`Refusing to export to non-directory path: ${resolved}`);
    }

    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing to export to symbolic link: ${resolved}`);
    }
  }
}

function pluginFolderName(manifest: AgentKitManifest): string {
  return `${manifest.id}-claude-code-plugin`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function comparablePath(input: string): string {
  const normalized = path.resolve(input);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
