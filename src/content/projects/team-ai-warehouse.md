---
title: "Team AI Warehouse"
description: "Universal AI Agent Standardization Platform (UAASP) — a central skill registry that syncs AI agent skills across Claude Code, OpenCode, Codex, and Pi with a CLI for management, versioning, and team contributions."
pubDate: 2026-05-15
tags: ["Python", "AI Tooling", "Claude Code", "OpenCode", "Developer Tools"]
repoUrl: "https://github.com/bigknoxy/team-ai-warehouse"
featured: false
---

## Universal AI Skill Registry

Team AI Warehouse is a centralized repository for AI agent skills that syncs across multiple coding tools — Claude Code, OpenCode, Codex, and Pi. One source of truth for all AI-assisted development workflows.

## What It Solves

AI coding tools each have their own skill/command systems. Team AI Warehouse standardizes them into a single warehouse with CLI tooling to sync, validate, version, and contribute skills across all tools at once.

## Key Commands

| Command | Description |
|---------|-------------|
| `uaa init` | Initialize warehouse |
| `uaa sync --all` | Sync skills to all 4 tools |
| `uaa status` | Show skill counts per tool |
| `uaa list` | List all available skills |
| `uaa validate` | Validate SKILL.md files |
| `uaa tag v1.0.0` | Create version tag |
| `uaa contrib <skill>` | Create PR for a new skill |

## Structure

- **skills/gstack/** — ~34 migrated upstream skills
- **skills/team/** — Team-specific shared skills
- **skills/personal/** — Personal workflow skills
- **contexts/** — Universal startup instructions for each tool
- **training/** — Learning materials for skill authors
- **CI/CD** — GitHub Actions validates SKILL.md files and runs Python tests on every PR

## One-Line Install

```bash
curl -sSL https://raw.githubusercontent.com/bigknoxy/team-ai-warehouse/main/scripts/setup.sh | bash
```
