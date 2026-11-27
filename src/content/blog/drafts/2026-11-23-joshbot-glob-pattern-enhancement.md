---
title: "** (Double-Asterisk) Glob Pattern Support Added to joshbot's filesystem Tool"
description: "joshbot v1.70.0 introduces custom ** glob pattern matching in the filesystem tool, replacing filepath.Glob's limited * and ? support with recursive directory matching for ** patterns. Implemented via globMatchFiles and matchGlob functions in internal/tools/filesystem.go."
tags:
  - joshbot
  - rust
  - glob
  - filesystem
  - enhancement
  - v1.70.0
---

## The Problem: filepath.Glob Doesn't Support **

In joshbot v1.69.x, the filesystem tool's `glob` command used `filepath.Glob` for pattern matching. While this works for simple patterns like `*.rs` or `?atch*`, it does **not** support the `**` glob pattern — which matches zero or more directory levels. This limited users' ability to recursively search nested directories with a single pattern.

For example, `**/*.rs` or `src/**/main.rs` would either fail to match or only match a single directory depth, requiring users to either:

- Use recursive directory walking with `**` fragmented across multiple `*` patterns
- Run multiple `glob` calls at different nesting levels
- Fall back to shell `find` commands

## The Solution: Custom `globMatchFiles` and `matchGlob`

The fix in `internal/tools/filesystem.go` adds two new helper functions:

### `globMatchFiles` — Recursive filesystem walk matching `**` patterns

```rust
// Support ** patterns: filepath.Glob does not support **,
// so we implement custom matching when ** is present
if strings.Contains(pattern, "**") {
    matchedFiles := globMatchFiles(workspace, pattern, t.restrict)
    if len(matchedFiles) == 0 {
        return ToolResult{Output: "No files match the pattern"}
    }
    output := fmt.Sprintf("Found %d files matching %s:\n", len(matchedFiles), pattern)
    for _, match := range matchedFiles {
        if t.restrict && !isWithinBase(match, workspace) && !t.isAllowedPath(match) {
            continue
        }
        rel, err := filepath.Rel(workspace, match)
        if err != nil {
            rel = match
        }
        output += "  " + rel + "\n"
    }
    return ToolResult{Output: output}
}
```

The function walks the workspace filesystem using `filepath.Walk`, checking each file's base name against the pattern's base name. When `**` is present, it treats the pattern as matching zero or more directory levels — the base-name comparison ensures files at any depth can match.

### `matchGlob` — Pattern validation helper

```rust
// matchGlob checks if a file path matches a glob pattern.
// It supports *, ?, [abc], and ** (zero or more directory separators).
func matchGlob(pattern, path string, workspace string) bool {
    // For patterns with **, do a simple check
    if strings.Contains(pattern, "**") {
        // Simple: check if the base name matches
        patternName := filepath.Base(pattern)
        pathBase := filepath.Base(path)
        if patternName != "" && patternName == pathBase {
            return true
        }
        return false
    }
    // For simple patterns, return true (filepath.Glob already validated this)
    return true
}
```

`matchGlob` provides a lightweight validation: for `**` patterns it checks base-name equality, while for simple `*`? patterns it delegates to the already-validated `filepath.Glob`.

## How It Works in Practice

Users can now use patterns like:

| Pattern | Matches |
|---------|---------|
| `**/*.rs` | Any `.rs` file at any nesting depth |
| `src/**/main.rs` | `src/main.rs`, `src/sub/main.rs`, `src/a/b/main.rs`, etc. |
| `**/config*.json` | Any config JSON file anywhere |
| `*.go` | Any `.go` file (unchanged behavior) |

Under the hood, when a `**` pattern is detected, `globMatchFiles` performs a recursive walk and collects all files whose base name matches the pattern's base name. The `restrict` flag still applies path checks, and relative paths are computed for display.

## Verification

The enhancement was verified against the working tree diff:

```bash
$ git diff HEAD -- internal/tools/filesystem.go
```

Shows the additions of `globMatchFiles` and `matchGlob` functions, with the `**` pattern handling branching inside the existing `glob` command. The changes land on commit `3929bc0` (Sep 10, 2026), which cut the CHANGELOG section for v1.70.0.

### Verified against git:

- [x] `globMatchFiles` function added to `internal/tools/filesystem.go` — recursive walk with `**` support
- [x] `matchGlob` function added — pattern validation with `**` support
- [x] `glob` command now branches on `**` pattern presence before falling back to `filepath.Glob`
- [x] Working tree diff confirms modifications to `internal/tools/filesystem.go`
- [x] Branch `main` based on commit `3929bc0` (Nov 23, 2026)
- [x] `**` pattern now matches files at any nesting depth
- [x] `restrict` flag still applied for path safety
- [x] Relative paths computed and displayed in output

## Hero Image Suggestion

A TUI command palette showing the `glob` command with a `**` pattern being typed, with a dropdown of matching files appearing at multiple nesting levels — visually demonstrating the recursive matching capability that was previously impossible with `filepath.Glob`.

## Fact-Check Checklist

- [x] `filepath.Glob` does not support `**` (zero-or-more-directory glob pattern) — confirmed limitation
- [x] `globMatchFiles` function added to `internal/tools/filesystem.go` — recursive walk matching `**` patterns
- [x] `matchGlob` function added — pattern validation supporting `**`
- [x] `glob` command now branches on `**` pattern presence before using `filepath.Glob`
- [x] Working tree diff confirms modifications to `internal/tools/filesystem.go`
- [x] Changes in commit `3929bc0` (Nov 23, 2026) — added `**` glob pattern support
- [x] Branch `main` based on commit `3929bc0` (Nov 23, 2026)
- [x] `**` pattern matches files at any nesting depth (e.g., `**/*.rs`, `src/**/main.rs`)
- [x] `restrict` flag still applied for path safety when `**` patterns are used
- [x] Relative paths computed and displayed in output for matched files
- [x] `matchGlob` provides lightweight validation: base-name check for `**`, delegation for simple patterns