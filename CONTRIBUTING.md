# Contributing to AgentKitForge Core

Thanks for helping improve AgentKitForge Core. This repository is the public contribution target for the core Agent Kit toolkit: package/spec validation, CLI workflows, packaging, prompt rendering, context building, and target exports.

## Local Setup

```bash
npm install
npm run build
npm test
npm run smoke
```

Use Node 26 for CI parity.

## Contribution Scope

Good contribution areas include:

- Core Agent Kit validation
- Agent Kit package structure and specification docs
- CLI commands and command behavior
- Exporters and target adapters
- Prepared Prompts
- Context Builder
- Draft/session data models that do not call providers
- Tests and fixtures
- Documentation

Out of scope for this repository:

- AgentKitForge Marketplace
- Backend services
- Cloud infrastructure
- Desktop app UI
- Provider network clients or API key handling

## Open an Issue or Discussion First

Please open an issue or discussion before starting work on:

- Breaking Agent Kit schema changes
- New canonical package sections
- Security-sensitive filesystem, import, packaging, or export behavior
- Major CLI changes
- New target adapters with uncertain install semantics

## Development Guidelines

- Keep core provider-neutral. Do not add OpenAI, Anthropic, Gemini, Ollama, or other provider calls here.
- Treat Agent Kits as untrusted input.
- Keep generated outputs deterministic where practical.
- Add or update tests for validation, packaging, rendering, and CLI behavior.
- Update documentation when public APIs, CLI commands, package structure, or security behavior changes.

## Pull Request Checklist

Before opening a pull request, run:

```bash
npm run build
npm test
npm run smoke
```

Also confirm:

- No secrets or local credentials are included.
- Security-sensitive path or filesystem changes have tests.
- Agent Kit schema changes are documented in `SPEC.md` and `VERSIONING.md` if applicable.
- CLI changes are documented in `CLI.md` and `README.md` if user-facing.
