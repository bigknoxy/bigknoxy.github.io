---
title: "OpenCode Skill Evolution"
description: "Published npm plugin for OpenCode that learns from your skill usage patterns and proactively suggests relevant skills at session start. Uses local embeddings for semantic matching — no cloud required."
pubDate: 2026-04-05
tags: ["TypeScript", "OpenCode", "npm", "AI Tooling", "Machine Learning", "Developer Tools"]
repoUrl: "https://github.com/bigknoxy/opencode-skill-evolution"
featured: false
---

## OpenCode That Gets Smarter With Use

OpenCode Skill Evolution is a published npm plugin that tracks which skills you use in which contexts, learns from your patterns, and suggests the right skill at session start — reducing the cognitive overhead of remembering dozens of commands.

## How It Works

1. **Session start** — Plugin loads and prepares recommendations based on task context
2. **During session** — Skill invocations are logged automatically
3. **Session end** — Patterns extracted, stale learnings pruned
4. **Next session** — Recommendations improve based on accumulated history

## Features

| Feature | Description |
|---------|-------------|
| Proactive Recommendations | Suggests skills at session start |
| Usage Telemetry | Tracks invocations, success rates, and patterns |
| Learning Engine | Extracts patterns from corrections and approvals |
| Semantic Search | k-NN matching using local embeddings |
| Auto-Update Descriptions | Improves skill descriptions based on learning |

## Install

```bash
opencode plugin opencode-skill-evolution@latest --global
```

Zero configuration required. Published on npm with CI badges and full test coverage.
