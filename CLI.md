# AgentKitForge CLI

Build first:

```bash
npm run build
```

Then run commands through:

```bash
node dist/cli/index.js <command>
```

After global install or linking, use `agentkitforge <command>`.

## validate

Validate an Agent Kit.

```bash
agentkitforge validate ./my-kit --profile local-valid
agentkitforge validate ./my-kit --profile publishable
agentkitforge validate ./my-kit --profile trusted
agentkitforge validate ./my-kit --profile verified
```

## inspect

Inspect whether a folder looks like an Agent Kit candidate.

```bash
agentkitforge inspect ./repo-or-folder
```

## summarize

Return a display-friendly Agent Kit summary without full raw file contents.

```bash
agentkitforge summarize ./my-kit
```

## init

Create a new kit from a built-in template.

```bash
agentkitforge init ./my-kit \
  --template blank \
  --id my-kit \
  --name "My Kit" \
  --description "A starter Agent Kit."
```

Financial review starter:

```bash
agentkitforge init ./financial-review \
  --template financial-review \
  --id financial-review \
  --name "Financial Review" \
  --description "Review financial workbooks."
```

Use `--force` to clean and recreate the target directory safely.

## package

Create a `.agentkit.zip` package.

```bash
agentkitforge package ./my-kit --out ./my-kit.agentkit.zip
```

## export-onefile

Create a one-file Markdown bundle.

```bash
agentkitforge export-onefile ./my-kit --out ./my-kit.onefile.md
```

## Prepared Prompts

List prepared prompts:

```bash
agentkitforge list-prompts ./my-kit
```

Render a prepared prompt:

```bash
agentkitforge render-prompt ./my-kit financial-review --inputs inputs.json --out rendered-prompt.md
```

Validate prepared prompt inputs:

```bash
agentkitforge validate-prompt-inputs ./my-kit financial-review --inputs inputs.json
```

## build-context

Build AI-ready context without calling an AI provider.

```bash
agentkitforge build-context ./my-kit \
  --task "Audit formulas in this workbook." \
  --mode triggered \
  --target generic \
  --out context.json
```

Modes:

- `all`: include all skills.
- `triggered`: include matching skills by deterministic trigger/description matching, with fallback to all skills.

Targets:

- `openai`
- `chatgpt`
- `claude`
- `generic`

## Draft Workflows

Create a provider-neutral draft request:

```bash
agentkitforge draft-request \
  --request "Build a financial review kit." \
  --level trusted \
  --out draft-request.json
```

Render a draft:

```bash
agentkitforge render-draft draft.json ./my-kit --force
```

Create a revision request:

```bash
agentkitforge draft-revision-request draft.json \
  --change "Add a prepared prompt for monthly review." \
  --out draft-revision-request.json
```

Load an existing kit as a draft:

```bash
agentkitforge load-as-draft ./my-kit --out draft.json
```

## export-codex

Export manifest skills into a Codex-compatible skills directory.

```bash
agentkitforge export-codex ./financial-review --dest ~/.codex/skills --force
```

This creates namespaced skill folders and a generated index skill. It does not call Codex.

## export-claude-code

Export an Agent Kit into an initial Claude Code plugin-style folder.

```bash
agentkitforge export-claude-code ./financial-review --dest ./claude-code-plugins --force
```

This creates `<kit-id>-claude-code-plugin/` with `.claude-plugin/plugin.json`, skills, and supporting kit files. Verify loading behavior with your Claude Code version.
