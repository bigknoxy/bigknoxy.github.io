---
title: "Auto Portfolio"
description: "Zero-input portfolio generator that mines your git history across all local repos, extracts tech stacks and quality signals, then builds and deploys a static Astro site automatically."
pubDate: 2026-05-07
tags: ["Python", "Astro", "CLI", "Git", "Static Site"]
repoUrl: "https://github.com/bigknoxy/auto-portfolio"
featured: false
---

## Your Code Writes Your Portfolio

Auto Portfolio scans all your git repositories, analyzes commit history and tech stacks, and generates a polished static Astro site — with zero manual input required.

## How It Works

1. **Scan** — Finds all git repos in your configured paths
2. **Extract** — Pulls tech stack, commit history, quality signals (test coverage, CI, docs)
3. **Generate** — Writes `site/src/data/projects.json` with ranked project data
4. **Build** — Compiles the Astro site with project cards, stats, and detail pages
5. **Preview** — Serves locally for review before publishing

## Usage

```bash
auto-portfolio setup    # Interactive first-run configuration
auto-portfolio generate # Scan repos and build site
auto-portfolio preview  # Preview locally
```

## Tech Stack

- **CLI**: Python with `uv` for dependency management
- **Site**: Astro static site generator
- **Config**: `config.toml` for name, scan paths, and theme
- **Testing**: pytest
