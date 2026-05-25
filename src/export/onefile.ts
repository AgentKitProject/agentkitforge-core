import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const TOP_LEVEL_FILES = ["START_HERE.md", "AGENTKIT.md"] as const;
const OPTIONAL_DIRECTORIES = ["workflows", "policies", "templates"] as const;

export async function exportOneFile(rootPath: string, outFile: string): Promise<string> {
  const resolvedRoot = path.resolve(rootPath);
  const sections: string[] = [];

  for (const file of TOP_LEVEL_FILES) {
    await appendFileSection(sections, resolvedRoot, file);
  }

  for (const skillFile of await listSkillFiles(path.join(resolvedRoot, "skills"))) {
    await appendFileSection(sections, resolvedRoot, path.relative(resolvedRoot, skillFile));
  }

  for (const directory of OPTIONAL_DIRECTORIES) {
    await appendDirectorySections(sections, resolvedRoot, directory);
  }

  const resolvedOut = path.resolve(outFile);
  await writeFile(resolvedOut, sections.join("\n\n"), "utf8");
  return resolvedOut;
}

async function appendDirectorySections(
  sections: string[],
  rootPath: string,
  relativeDirectory: string
): Promise<void> {
  const directoryPath = path.join(rootPath, relativeDirectory);
  if (!(await exists(directoryPath))) {
    return;
  }

  for (const file of await listMarkdownFiles(directoryPath)) {
    await appendFileSection(sections, rootPath, path.relative(rootPath, file));
  }
}

async function appendFileSection(
  sections: string[],
  rootPath: string,
  relativePath: string
): Promise<void> {
  const normalizedRelativePath = relativePath.replaceAll("\\", "/");
  const content = await readFile(path.join(rootPath, relativePath), "utf8");
  sections.push(`<!-- BEGIN ${normalizedRelativePath} -->\n\n${content.trim()}\n\n<!-- END ${normalizedRelativePath} -->`);
}

async function listSkillFiles(skillsRoot: string): Promise<string[]> {
  if (!(await exists(skillsRoot))) {
    return [];
  }

  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const skillFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
      if (await exists(skillFile)) {
        skillFiles.push(skillFile);
      }
    }
  }

  return skillFiles.sort();
}

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await readdir(filePath);
    return true;
  } catch {
    try {
      await readFile(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
