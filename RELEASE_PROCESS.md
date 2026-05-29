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

## Release Branch and Tag Flow

1. Confirm `main` contains the intended release changes.
2. Create a release branch if final stabilization is needed, for example `release/v0.1.0`.
3. Update `CHANGELOG.md` with release notes.
4. Confirm `package.json` version matches the release.
5. Run required checks locally and in GitHub Actions.
6. Create an annotated tag, for example `v0.1.0`.
7. Publish a GitHub Release from the tag.

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
