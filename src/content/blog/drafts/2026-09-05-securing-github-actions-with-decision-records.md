---
title: "Securing GitHub Actions: Pinning Dependencies and Using Decision Records for Supply Chain Safety"
description: "How HashPilot addressed critical security findings B69, B70, B71, B79 by pinning exact versions, switching to GITHUB_TOKEN, pinning actions via commit SHA, and adding decision records for transparency."
date: 2026-09-05
tags:
  - github-actions
  - security
  - supply-chain
  - devops
  - decision-records
---

## Addressing Security Audit Findings in HashPilot

During a recent security audit of the HashPilot project, four findings (B69, B70, B71, B79) were identified in the GitHub Actions workflows. These findings highlighted supply-chain risks and permission scoping issues. This post details the fixes applied in commit [`4f871c8`](https://github.com/bigknoxy/HashPilot/commit/4f871c877bb7e192b5615658f931048e83853810) and the accompanying decision records.

### The Findings

- **B69**: Unpinned npm installs with write-scoped tokens pose a supply-chain risk.
- **B70**: Using a PAT (GH_TOKEN) in `gh-pages.yml` when a default scoped token suffices.
- **B71**: Floating version tags for first-party actions (e.g., `peaceiris/actions-gh-pages@v4`) can introduce unexpected changes.
- **B79**: Missing `bun.lock` in `package.json` files array prevents lockfile distribution with published packages.

### The Fixes

#### 1. Pinning Exact Versions (B69, B71)

In `.github/workflows/gh-pages.yml`:
- Changed `agent-browser` from `@latest` to exact version `0.36.0`.
- Pinned `peaceiris/actions-gh-pages` to a specific commit SHA (`329bcc8f12caed2cefe5a5b80781499a6f3b361b`) instead of the floating `v4` tag.

#### 2. Switching to GITHUB_TOKEN (B70)

- Updated `gh-pages.yml` to use `github.token` (which resolves to the default `GITHUB_TOKEN`) for the `gh-pages` workflow.
- Kept `release.yml` using `GH_TOKEN` (a PAT) because `semantic-release` needs to push to `main` and trigger downstream workflows, which `GITHUB_TOKEN` cannot do due to security restrictions (see Decision Record D005).

#### 3. Including Lockfile in Published Package (B79)

- Added `bun.lock` to the `files` array in `package.json` so that when the package is published to npm, the lockfile is included, ensuring consumers install exactly the dependencies tested in CI.
- The existing `install.sh` script already uses `--frozen-lockfile` when `bun.lock` is present, so this change aligns publishing with CI.

#### 4. Adding Decision Records

- Created `docs/decisions/README.md` and added records D005-D008 documenting the rationale and alternatives considered for each fix.
- This promotes transparency and helps future contributors understand the trade-offs.

### Code Examples

#### Before (gh-pages.yml snippet)
```yaml
- uses: agent-browser/@latest
- uses: peaceiris/actions-gh-pages@v4
```

#### After (gh-pages.yml snippet)
```yaml
- uses: agent-browser@0.36.0
- uses: peaceiris/actions-gh-pages@329bcc8f12caed2cefe5a5b80781499a6f3b361b
```

#### Before (package.json snippet)
```json
{
  "files": [
    "dist/",
    "README.md"
  ]
}
```

#### After (package.json snippet)
```json
{
  "files": [
    "dist/",
    "README.md",
    "bun.lock"
  ]
}
```

### Hero Image Suggestion

A visual of a lock shield over a GitHub Actions workflow diagram, with labels for "Pinned Versions", "GITHUB_TOKEN", and "Decision Records".

### Fact-Check Checklist

- [x] Verify commit `4f871c8` contains the changes described.
- [x] Confirm B69 fix: `agent-browser` pinned to `0.36.0` in `gh-pages.yml`.
- [x] Confirm B70 fix: `gh-pages.yml` uses `github.token` (GITHUB_TOKEN).
- [x] Confirm B71 fix: `peaceiris/actions-gh-pages` uses commit SHA.
- [x] Confirm B79 fix: `bun.lock` added to `package.json` files array.
- [x] Check that decision records D005-D008 exist in `docs/decisions/README.md`.
- [x] Ensure `release.yml` still uses `GH_TOKEN` (PAT) for semantic-release.

### Lessons Learned

- Regularly audit workflows for unpinned actions and over-permissive tokens.
- Use decision records to document security trade-offs, especially when workflow requirements diverge (e.g., needing a PAT for certain triggers).
- Include lockfiles in published packages to guarantee reproducible installs for consumers.

By addressing these findings, HashPilot strengthens its supply-chain security while maintaining the necessary automation for releases.

---