import { cp, lstat, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AgentKitManifest, AgentKitSkillManifest } from "../types.js";
import { readAgentKit } from "../package/reader.js";

export type AgentKitTarget = "codex";

export interface CodexExportOptions {
  force?: boolean;
  createIndexSkill?: boolean;
}

export interface CodexExportResult {
  destinationSkillsDir: string;
  exportedSkillFolders: string[];
  generatedIndexFolder?: string;
  warnings: string[];
}

const MARKER_FILE = ".agentkitforge-export.json";

export async function exportAgentKitToCodex(
  kitPath: string,
  destinationSkillsDir: string,
  options: CodexExportOptions = {}
): Promise<CodexExportResult> {
  const kit = await readAgentKit(kitPath);
  if (!kit.manifest) {
    throw new Error("Unable to export to Codex because agentkit.yaml is invalid.");
  }

  const destinationRoot = path.resolve(destinationSkillsDir);
  await assertSafeDestination(destinationRoot);
  await mkdir(destinationRoot, { recursive: true });

  const createIndexSkill = options.createIndexSkill !== false;
  const plannedFolders = [
    ...kit.manifest.skills.map((skill) => folderNameForSkill(kit.manifest as AgentKitManifest, skill)),
    ...(createIndexSkill ? [folderNameForIndex(kit.manifest)] : [])
  ];

  await prepareDestinationFolders(destinationRoot, plannedFolders, options.force === true);

  const exportedSkillFolders: string[] = [];
  for (const skill of [...kit.manifest.skills].sort((left, right) => left.id.localeCompare(right.id))) {
    const folderName = folderNameForSkill(kit.manifest, skill);
    const destinationFolder = path.join(destinationRoot, folderName);
    await mkdir(destinationFolder, { recursive: true });
    await exportSkillFolder(kit.rootPath, kit.manifest, skill, destinationFolder);
    exportedSkillFolders.push(destinationFolder);
  }

  let generatedIndexFolder: string | undefined;
  if (createIndexSkill) {
    const folderName = folderNameForIndex(kit.manifest);
    const destinationFolder = path.join(destinationRoot, folderName);
    await mkdir(destinationFolder, { recursive: true });
    await writeFile(path.join(destinationFolder, "SKILL.md"), renderIndexSkill(kit.manifest), "utf8");
    await writeMarker(destinationFolder, kit.manifest, "index");
    generatedIndexFolder = destinationFolder;
  }

  return {
    destinationSkillsDir: destinationRoot,
    exportedSkillFolders,
    generatedIndexFolder,
    warnings: []
  };
}

async function exportSkillFolder(
  kitRoot: string,
  manifest: AgentKitManifest,
  skill: AgentKitSkillManifest,
  destinationFolder: string
): Promise<void> {
  const sourceSkillFile = path.join(kitRoot, skill.path);
  const sourceSkillDir = path.dirname(sourceSkillFile);
  const entries = await readdir(sourceSkillDir, { withFileTypes: true });

  for (const entry of entries) {
    const source = path.join(sourceSkillDir, entry.name);
    const destination = path.join(destinationFolder, entry.name);
    if (entry.isDirectory()) {
      await cp(source, destination, { recursive: true });
    } else if (entry.isFile()) {
      await cp(source, destination);
    }
  }

  await writeFile(path.join(destinationFolder, "AGENTKIT.md"), renderSkillAgentKitReadme(manifest, skill), "utf8");
  await writeMarker(destinationFolder, manifest, skill.id);
}

async function prepareDestinationFolders(
  destinationRoot: string,
  plannedFolders: string[],
  force: boolean
): Promise<void> {
  const existingFolders = [];
  for (const folderName of plannedFolders) {
    const folderPath = path.join(destinationRoot, folderName);
    if (await exists(folderPath)) {
      existingFolders.push(folderPath);
    }
  }

  if (existingFolders.length > 0 && !force) {
    throw new Error(
      `Refusing to overwrite existing Codex skill export folders: ${existingFolders.join(", ")}. Use --force to replace AgentKitForge-generated folders.`
    );
  }

  for (const folderPath of existingFolders) {
    await assertAgentKitForgeGeneratedFolder(folderPath);
    await rm(folderPath, { recursive: true, force: true });
  }
}

async function assertAgentKitForgeGeneratedFolder(folderPath: string): Promise<void> {
  const markerPath = path.join(folderPath, MARKER_FILE);
  if (!(await exists(markerPath))) {
    throw new Error(`Refusing to remove non-AgentKitForge folder: ${folderPath}`);
  }

  const marker = JSON.parse(await readFile(markerPath, "utf8")) as { generatedBy?: string };
  if (marker.generatedBy !== "agentkitforge") {
    throw new Error(`Refusing to remove folder without AgentKitForge marker: ${folderPath}`);
  }
}

async function writeMarker(
  destinationFolder: string,
  manifest: AgentKitManifest,
  skillId: string
): Promise<void> {
  await writeFile(
    path.join(destinationFolder, MARKER_FILE),
    `${JSON.stringify(
      {
        generatedBy: "agentkitforge",
        target: "codex",
        kitId: manifest.id,
        skillId
      },
      null,
      2
    )}\n`,
    "utf8"
  );
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

function renderSkillAgentKitReadme(manifest: AgentKitManifest, skill: AgentKitSkillManifest): string {
  return `# ${manifest.name}: ${skill.id}

This Codex skill was exported from Agent Kit \`${manifest.id}\`.

${skill.description}
`;
}

function renderIndexSkill(manifest: AgentKitManifest): string {
  return `---
id: ${manifest.id}-index
name: ${manifest.name} Index
description: Overview of the ${manifest.name} Agent Kit and its exported Codex skills.
triggers:
  - ${manifest.name}
  - ${manifest.id}
riskLevel: ${manifest.risk.level}
---

# ${manifest.name} Index

## Use when

Use this skill when a user asks what the ${manifest.name} Agent Kit contains or which exported skill to use.

## Procedure

Review the Agent Kit description and choose the most relevant exported skill.

Included skills:
${manifest.skills.map((skill) => `- ${skill.id}: ${skill.description}`).join("\n")}

## Output

Return the recommended skill and a short reason.
`;
}

function folderNameForSkill(manifest: AgentKitManifest, skill: AgentKitSkillManifest): string {
  return `${manifest.id}-${skill.id}`;
}

function folderNameForIndex(manifest: AgentKitManifest): string {
  return `${manifest.id}-index`;
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
