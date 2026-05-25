# AgentKitForge Core

AgentKitForge Core is the initial TypeScript engine for validating, exporting, and packaging portable Agent Kits. This package intentionally contains only core package/spec/validation/export logic. It does not include a desktop app, AWS infrastructure, or Agent Kit Market integration.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## CLI

Create a blank Agent Kit:

```bash
npm run build
node dist/cli/index.js init ./my-agentkit \
  --template blank \
  --id my-agentkit \
  --name "My Agent Kit" \
  --description "A starter Agent Kit."
```

Create a trusted financial review starter kit:

```bash
node dist/cli/index.js init ./financial-review-kit \
  --template financial-review \
  --id financial-review-kit \
  --name "Financial Review Kit" \
  --description "Review financial workbooks for structure, formulas, and follow-up risks."
```

Use `--force` to initialize into a non-empty directory and overwrite generated template files.

Validate an Agent Kit:

```bash
node dist/cli/index.js validate ./path/to/agentkit --profile local-valid
```

Supported validation profiles:

- `local-valid`
- `publishable`
- `trusted`
- `verified`

Export a one-file Markdown bundle:

```bash
node dist/cli/index.js export-onefile ./path/to/agentkit --out ./bundle.md
```

Create a `.agentkit.zip` package:

```bash
node dist/cli/index.js package ./path/to/agentkit --out ./agentkit.agentkit.zip
```

After this package is installed globally or linked, the same commands are available through `agentkitforge`.

## Agent Kit Structure

```text
agentkit.yaml
AGENTKIT.md
START_HERE.md
README.md
LICENSE
CHANGELOG.md
skills/<skill-id>/SKILL.md
workflows/
policies/
references/
templates/
examples/
evals/
adapters/
scripts/
assets/
exports/
```

## Validation Profiles

`local-valid` requires `agentkit.yaml`, `AGENTKIT.md`, `START_HERE.md`, `skills/`, and at least one `skills/<skill-id>/SKILL.md`.

`publishable` adds `README.md` and `LICENSE`.

`trusted` adds `CHANGELOG.md`, `policies/`, and `examples/`.

`verified` adds `evals/`.
