import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export type SemverBumpLevel = "major" | "minor" | "patch";

export interface SetAgentKitVersionResult {
  previous: string;
  next: string;
}

// Semantic Versioning 2.0.0 (https://semver.org). Matches the `version`
// field semantics already required by the Agent Kit manifest schema, where
// `version` is the kit's published semver (e.g. "0.1.0").
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * True when `value` is a valid Semantic Versioning 2.0.0 version string.
 */
export function isValidAgentKitVersion(value: string): boolean {
  return typeof value === "string" && SEMVER_PATTERN.test(value);
}

function manifestPathFor(rootPath: string): string {
  return path.join(path.resolve(rootPath), "agentkit.yaml");
}

function extractVersion(doc: YAML.Document.Parsed): string {
  const value = doc.get("version");
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      "Agent Kit manifest is missing a string `version` field in agentkit.yaml."
    );
  }

  return value;
}

/**
 * Read the current `version` from a kit's `agentkit.yaml` manifest.
 */
export async function getAgentKitVersion(rootPath: string): Promise<string> {
  const manifestPath = manifestPathFor(rootPath);
  const rawText = await readFile(manifestPath, "utf8");
  const doc = YAML.parseDocument(rawText);
  if (doc.errors.length > 0) {
    throw new Error(`Could not parse agentkit.yaml: ${doc.errors[0]?.message}`);
  }

  return extractVersion(doc);
}

/**
 * Update the `version` field of a kit's `agentkit.yaml` manifest in place.
 *
 * `nextVersion` must be a valid Semantic Versioning 2.0.0 string. The rest of
 * the manifest (comments, key order, formatting) is preserved by editing the
 * parsed YAML document rather than reserializing a plain object.
 */
export async function setAgentKitVersion(
  rootPath: string,
  nextVersion: string
): Promise<SetAgentKitVersionResult> {
  if (!isValidAgentKitVersion(nextVersion)) {
    throw new Error(
      `Invalid version "${nextVersion}". Expected a Semantic Versioning 2.0.0 value (for example "1.2.3").`
    );
  }

  const manifestPath = manifestPathFor(rootPath);
  const rawText = await readFile(manifestPath, "utf8");
  const doc = YAML.parseDocument(rawText);
  if (doc.errors.length > 0) {
    throw new Error(`Could not parse agentkit.yaml: ${doc.errors[0]?.message}`);
  }

  const previous = extractVersion(doc);
  // Mutate the existing scalar node in place so any comment attached to the
  // version line (and the rest of the document) is preserved. Force a
  // double-quoted style so versions like "0.1.0" stay strings rather than
  // being re-emitted as YAML numbers/floats.
  const versionNode = doc.get("version", true) as YAML.Scalar;
  versionNode.value = nextVersion;
  versionNode.type = YAML.Scalar.QUOTE_DOUBLE;

  await writeFile(manifestPath, String(doc), "utf8");

  return { previous, next: nextVersion };
}

/**
 * Bump the manifest version by a semver level and write it back.
 *
 * Only supports plain `major.minor.patch` versions; pre-release/build
 * metadata is rejected to keep the bump unambiguous.
 */
export async function bumpAgentKitVersion(
  rootPath: string,
  level: SemverBumpLevel
): Promise<SetAgentKitVersionResult> {
  const current = await getAgentKitVersion(rootPath);
  const core = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!core) {
    throw new Error(
      `Cannot bump version "${current}": expected a plain major.minor.patch value.`
    );
  }

  let [major, minor, patch] = [Number(core[1]), Number(core[2]), Number(core[3])];
  if (level === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (level === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return setAgentKitVersion(rootPath, `${major}.${minor}.${patch}`);
}
