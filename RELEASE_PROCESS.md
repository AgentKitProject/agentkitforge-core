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

AgentKitForge Core is published to npm as `@agentkitforge/core`. The scoped package must be published with public access:

```bash
npm publish --access public
```

The app consumes `@agentkitforge/core` from npm using SemVer ranges, not GitHub tarballs. GitHub tags and GitHub Releases are still created by Release Please.

Generated `dist/` output is not committed. `npm pack` and `npm publish` run `prepack`, which builds `dist/` from source before packaging.

## Automated npm Publishing

When Release Please publishes a GitHub Release, `.github/workflows/publish-npm.yml` runs on the `release: published` event and publishes `@agentkitforge/core` to npm.

The publish workflow:

1. Uses Node 24.
2. Runs `npm ci`.
3. Runs `npm run build`.
4. Runs `npm test`.
5. Runs `npm run smoke --if-present`.
6. Runs `npm pack --dry-run`.
7. Verifies the tarball includes `dist/`, `README.md`, `LICENSE`, `CLI.md`, and `SPEC.md`.
8. Runs `npm publish --access public`.

The workflow uses npm Trusted Publishing through GitHub Actions OIDC and does not use `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or checked-in `.npmrc` token auth. Configure npm Trusted Publishing for package `@agentkitforge/core` in npm settings before relying on this workflow. The trusted publisher configuration must match:

- Repository: `AgentKitProject/agentkitforge-core`
- Workflow file: `.github/workflows/publish-npm.yml`
- Package: `@agentkitforge/core`

The first npm publish may require npm org/package setup. If a token fallback is ever added, it must be clearly optional, documented, and reviewed as a release-security change. Prefer npm two-factor authentication for maintainers and npm Trusted Publishing for automation.

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
