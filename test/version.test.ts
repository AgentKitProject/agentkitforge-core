import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  bumpAgentKitVersion,
  getAgentKitVersion,
  isValidAgentKitVersion,
  setAgentKitVersion
} from "../src/package/version.js";

const MANIFEST_WITH_COMMENTS = `# Agent Kit manifest
schemaVersion: "0.1"
kind: AgentKit
id: commented-kit
name: Commented Kit
version: "0.1.0" # current published version
description: A kit with comments and varied fields.
author:
  name: AgentKitForge Test # the author
license: MIT
entrypoints:
  human: START_HERE.md
  agent: AGENTKIT.md
userExperience:
  setupLevel: low
compatibility:
  targets:
    - codex # only codex for now
risk:
  level: low
skills:
  - id: summarize
    path: skills/summarize/SKILL.md
    description: Summarize provided text.
    triggers:
      - summarize text
`;

async function tempKitWith(manifest: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "agentkit-version-"));
  await writeFile(path.join(dir, "agentkit.yaml"), manifest, "utf8");
  return dir;
}

describe("Agent Kit version API", () => {
  test("getAgentKitVersion returns the current version", async () => {
    const kit = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await expect(getAgentKitVersion(kit)).resolves.toBe("0.1.0");
  });

  test("setAgentKitVersion updates the version and returns previous/next", async () => {
    const kit = await tempKitWith(MANIFEST_WITH_COMMENTS);
    const result = await setAgentKitVersion(kit, "1.2.3");
    expect(result).toEqual({ previous: "0.1.0", next: "1.2.3" });
    await expect(getAgentKitVersion(kit)).resolves.toBe("1.2.3");
  });

  test("setAgentKitVersion rejects invalid semver with a clear error", async () => {
    const kit = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await expect(setAgentKitVersion(kit, "not-a-version")).rejects.toThrow(
      /Semantic Versioning/
    );
    // Manifest unchanged on rejection.
    await expect(getAgentKitVersion(kit)).resolves.toBe("0.1.0");
  });

  test("round-trip preserves comments, key order, and other fields", async () => {
    const kit = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await setAgentKitVersion(kit, "2.0.0");
    const updated = await readFile(path.join(kit, "agentkit.yaml"), "utf8");

    // Version was changed (and stays a quoted string).
    expect(updated).toContain('version: "2.0.0"');
    expect(updated).not.toContain('version: "0.1.0"');

    // Comments preserved.
    expect(updated).toContain("# Agent Kit manifest");
    expect(updated).toContain("# current published version");
    expect(updated).toContain("# the author");
    expect(updated).toContain("# only codex for now");

    // Key order preserved.
    const idx = (needle: string) => updated.indexOf(needle);
    expect(idx("schemaVersion:")).toBeLessThan(idx("kind:"));
    expect(idx("kind:")).toBeLessThan(idx("id:"));
    expect(idx("version:")).toBeLessThan(idx("description:"));
    expect(idx("description:")).toBeLessThan(idx("author:"));

    // Other fields untouched.
    expect(updated).toContain("id: commented-kit");
    expect(updated).toContain("setupLevel: low");
    expect(updated).toContain("- summarize text");
  });

  test("getAgentKitVersion errors cleanly when manifest is missing", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agentkit-version-"));
    await expect(getAgentKitVersion(dir)).rejects.toThrow();
  });

  test("getAgentKitVersion errors cleanly when version field is absent", async () => {
    const kit = await tempKitWith("schemaVersion: \"0.1\"\nname: No Version\n");
    await expect(getAgentKitVersion(kit)).rejects.toThrow(/missing a string `version`/);
  });

  test("isValidAgentKitVersion accepts and rejects per semver", () => {
    expect(isValidAgentKitVersion("1.2.3")).toBe(true);
    expect(isValidAgentKitVersion("0.0.0")).toBe(true);
    expect(isValidAgentKitVersion("1.2.3-rc.1+build.5")).toBe(true);
    expect(isValidAgentKitVersion("1.2")).toBe(false);
    expect(isValidAgentKitVersion("01.2.3")).toBe(false);
    expect(isValidAgentKitVersion("v1.2.3")).toBe(false);
  });

  test("bumpAgentKitVersion increments each level", async () => {
    const major = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await expect(bumpAgentKitVersion(major, "major")).resolves.toEqual({
      previous: "0.1.0",
      next: "1.0.0"
    });

    const minor = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await expect(bumpAgentKitVersion(minor, "minor")).resolves.toEqual({
      previous: "0.1.0",
      next: "0.2.0"
    });

    const patch = await tempKitWith(MANIFEST_WITH_COMMENTS);
    await expect(bumpAgentKitVersion(patch, "patch")).resolves.toEqual({
      previous: "0.1.0",
      next: "0.1.1"
    });
  });
});
