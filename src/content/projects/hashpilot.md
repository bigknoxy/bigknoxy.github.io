---
title: "HashPilot"
description: "Global, tool-agnostic structured editing core for AI coding agents. Provides syntax-aware editing via tree-sitter, hash-anchored content replacement, and batched verification — integrated with Claude Code, OpenCode, and Pi."
pubDate: 2026-05-05
tags: ["TypeScript", "Bun", "tree-sitter", "AST", "AI Tooling", "Developer Tools"]
repoUrl: ""
featured: false
---

## Structured Editing for AI Coding Agents

HashPilot provides a universal `structured-edit` CLI that AI agents can use for safe, syntax-aware file edits. Instead of naive string replacement, it uses tree-sitter for AST operations and SHA-256 hashes to anchor replacements — preventing stale-edit bugs.

## Key Commands

| Command | Description |
|---------|-------------|
| `read-many` | Read files with SHA-256 content hashes |
| `grep-many` | Search across files with context |
| `replace-hash` | Hash-anchored replacement (fails if content changed) |
| `ast rename-symbol` | Syntax-aware symbol rename via tree-sitter |
| `ast replace-body` | Replace a function/method body |
| `ast add/remove-import` | Import management |
| `ast insert-before/after` | Insert code relative to AST nodes |
| `verify-changes` | Run formatter + linter + tests after edits |
| `route` | Show routing decision (AST → hash → fallback) |

## Why Hash-Anchored?

When AI agents edit files in multi-step workflows, earlier edits shift line numbers and invalidate later references. HashPilot anchors replacements to a SHA-256 hash of the target content — if the content has changed, the replacement fails loudly rather than silently corrupting the wrong lines.

## Integrations

Adapters for Claude Code, OpenCode, and Pi are included in the local install.
