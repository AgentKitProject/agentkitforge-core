# Release Process

This document describes the release process for AgentKitForge Core.

## Versioning

Releases use Semantic Versioning. Tags use the `v` prefix:

```text
v0.1.0
v0.1.1
v0.2.0
```

The current target is `v0.1.0 Public Preview`.

## Automated Release Flow

Release Please creates release PRs automatically from Conventional Commits merged to `main`.

The release PR updates:

- `package.json`
- `package-lock.json`
- `CHANGELOG.md`

Release happens when the release PR is merged. Release Please then creates the GitHub tag and GitHub Release.

GitHub Release titles use:

```text
AgentKitForge Core vX.Y.Z
```

The app consumes `agentkitforge-core` by Git tag for now, for example `github:BillBoardApp/agentkitforge-core#v0.1.0`. Git installs run the package `prepare` script, which builds `dist/` from source during install. Generated `dist/` output is not committed in this phase.

There is no npm publishing in this phase, and this repository must not add `NPM_TOKEN` or an npm publish workflow until npm release ownership and permissions are intentionally configured.

## Conventional Commits

Release Please uses Conventional Commits:

- `feat:` creates a minor release.
- `fix:` creates a patch release.
- `security:` creates a patch release.
- Breaking changes use `!` or a `BREAKING CHANGE:` footer.
- Before `1.0.0`, breaking changes are minor releases but must be documented.

Examples:

```text
feat: add Cursor export adapter
fix: prevent path traversal in kit validation
docs: update CLI guide
security: harden zip extraction
```

## Release Branch and Tag Flow

Use a release branch only when final stabilization is needed, for example `release/v0.1.0`. Tags are created by Release Please after the release PR is merged.

## Required Checks

Before publishing:

```bash
npm run build
npm test
npm run smoke
```

Security checks:

- `npm audit --audit-level=critical` must pass.
- Non-blocking audit reports should be reviewed.
- Security-sensitive filesystem, package import/export, prompt rendering, and target export changes should have tests.

## Release Notes

GitHub Release notes should include:

- Release status, such as `Public Preview`.
- Major features.
- Breaking changes or schema changes.
- Security fixes or hardening.
- Known limitations.
- Upgrade notes.

## Artifacts

Core does not require release artifact uploads unless a future package distribution flow needs them. Generated `.agentkit.zip` files are user outputs, not release artifacts for this repository.

## App Coordination

AgentKitForge app releases are coordinated separately. Core releases may be consumed by the app, but this repository does not publish desktop app builds.
