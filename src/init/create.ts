import { lstat, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { templates, renderTemplate, type AgentKitTemplateName } from "./templates.js";

export interface CreateAgentKitOptions {
  template: AgentKitTemplateName;
  id: string;
  name: string;
  description: string;
  force?: boolean;
}

export interface CreateAgentKitResult {
  rootPath: string;
  template: AgentKitTemplateName;
  files: string[];
}

export async function createAgentKit(
  targetPath: string,
  options: CreateAgentKitOptions
): Promise<CreateAgentKitResult> {
  const template = templates[options.template];
  if (!template) {
    throw new Error(`Unknown Agent Kit template: ${options.template}`);
  }

  const resolvedRoot = path.resolve(targetPath);
  await assertCanWriteTarget(resolvedRoot, options.force === true);

  const files = Object.entries(template.files);
  for (const [relativePath, content] of files) {
    const filePath = path.join(resolvedRoot, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, renderTemplate(content, options), "utf8");
  }

  return {
    rootPath: resolvedRoot,
    template: options.template,
    files: files.map(([relativePath]) => relativePath)
  };
}

async function assertCanWriteTarget(targetPath: string, force: boolean): Promise<void> {
  try {
    const entries = await readdir(targetPath);
    if (entries.length > 0 && !force) {
      throw new Error(
        `Refusing to initialize Agent Kit in non-empty directory: ${targetPath}. Use --force to overwrite template files.`
      );
    }

    if (entries.length > 0) {
      await cleanTargetDirectory(targetPath);
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      await mkdir(targetPath, { recursive: true });
      return;
    }

    throw error;
  }
}

async function cleanTargetDirectory(targetPath: string): Promise<void> {
  await assertSafeCleanTarget(targetPath);

  for (const entry of await readdir(targetPath)) {
    await rm(path.join(targetPath, entry), { recursive: true, force: true });
  }
}

async function assertSafeCleanTarget(targetPath: string): Promise<void> {
  const resolvedTarget = path.resolve(targetPath);
  const parsed = path.parse(resolvedTarget);
  const home = path.resolve(os.homedir());
  const repoRoot = path.resolve(process.cwd());
  const targetKey = comparablePath(resolvedTarget);

  if (targetKey === comparablePath(parsed.root)) {
    throw new Error(`Refusing to clean filesystem root: ${resolvedTarget}`);
  }

  if (targetKey === comparablePath(home)) {
    throw new Error(`Refusing to clean user home directory: ${resolvedTarget}`);
  }

  if (targetKey === comparablePath(repoRoot)) {
    throw new Error(`Refusing to clean current repository root: ${resolvedTarget}`);
  }

  const stats = await lstat(resolvedTarget);
  if (!stats.isDirectory()) {
    throw new Error(`Refusing to clean non-directory path: ${resolvedTarget}`);
  }

  if (stats.isSymbolicLink()) {
    throw new Error(`Refusing to clean symbolic link: ${resolvedTarget}`);
  }
}

function comparablePath(input: string): string {
  const normalized = path.resolve(input);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
