import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export async function packageAgentKit(rootPath: string, outFile: string): Promise<string> {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedOut = path.resolve(outFile);
  const zip = new JSZip();

  for (const filePath of await listFilesRecursive(resolvedRoot)) {
    const relativePath = path.relative(resolvedRoot, filePath).replaceAll("\\", "/");
    if (shouldSkip(relativePath, resolvedOut, filePath)) {
      continue;
    }

    zip.file(relativePath, await readFile(filePath));
  }

  const output = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });

  await mkdir(path.dirname(resolvedOut), { recursive: true });
  await writeFile(resolvedOut, output);
  return resolvedOut;
}

async function listFilesRecursive(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function shouldSkip(relativePath: string, outFile: string, filePath: string): boolean {
  const normalizedOut = path.resolve(outFile);
  const normalizedFile = path.resolve(filePath);

  return (
    normalizedFile === normalizedOut ||
    relativePath.startsWith("exports/") ||
    relativePath === ".DS_Store"
  );
}
