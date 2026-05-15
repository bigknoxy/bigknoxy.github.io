---
title: "ideavault"
description: "A fast, local-first CLI idea manager built with Rust. Capture, organize, and retrieve your ideas without ever leaving the terminal."
pubDate: 2026-04-10
heroImage: "/assets/images/projects/ideavault-hero.svg"
tags:
  - "Rust"
  - "CLI"
  - "SQLite"
  - "Productivity"
  - "Local-First"
repoUrl: "https://github.com/bigknoxy/ideavault"
featured: false
---

# ideavault

**ideavault** is a terminal-based idea manager for developers who have more project ideas than free time (so, all of us). Capture ideas fast, organize them later, and actually find them when you need them.

## Your Ideas, Organized

ideavault handles the full idea lifecycle:

- **Quick capture**: Jot down ideas in seconds — no context switching required
- **Tag and categorize**: Organize with tags, priorities, and status markers
- **Full-text search**: Find that idea you had three months ago in milliseconds
- **Link ideas together**: Connect related thoughts into bigger pictures
- **Export anywhere**: Markdown, JSON, or pipe it into whatever you want

## Why Rust?

Because your ideas deserve speed:

- Instant search across thousands of entries
- SQLite storage — local-first, no cloud dependency
- Memory-safe — your ideas won't get corrupted
- Single binary, zero config — just install and go

## Key Features

- **Vault-based organization**: Group ideas by project, topic, or whim
- **Markdown support**: Write ideas in markdown, view them rendered
- **Templates**: Pre-defined structures for common idea types (project, blog post, feature)
- **Statistics**: See how many ideas you've captured, which tags you use most
- **Git-friendly**: Plain text storage plays nice with version control

## Getting Started

```bash
cargo install ideavault
ideavault init
ideavault add "Build a compiler for emoji" --tags "crazy,side-project"
ideavault search "emoji"
```

## Philosophy

The best ideas come at the worst times. ideavault is designed to capture them fast — two seconds from thought to stored — so you can get back to whatever you were doing and revisit the idea later.

Source Code: [GitHub (ideavault)](https://github.com/bigknoxy/ideavault)
