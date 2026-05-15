---
title: "Self-Evolving Dev Ecosystem"
description: "Local Rust daemon that watches terminal commands and file changes, classifies dev failures using regex pattern engines, and builds a personal knowledge store. Integrates with Ollama for AI-powered fix suggestions — fully offline."
pubDate: 2026-05-07
tags: ["Rust", "Ollama", "Local AI", "Daemon", "Developer Tools", "Tokio"]
repoUrl: "https://github.com/bigknoxy/self-evolving-dev-ecosystem"
featured: false
---

## A Dev Environment That Learns From Your Failures

Organism is a local Rust daemon that observes your development activity — terminal commands, file changes — classifies what goes wrong, and builds a personal knowledge store under `~/.organism/`. No cloud, no telemetry, all local.

## Architecture

5-crate Cargo workspace with a clean separation of concerns:

| Crate | Role |
|-------|------|
| `organism-protocol` | Event/envelope types, IPC message schema (serde) |
| `organism-knowledge` | File-backed KV store under `$ORGANISM_HOME` |
| `organism-cortex` | Pattern engine + error classifier (rustc/npm/python/shell regex) |
| `organism-daemon` | Event bus, IPC server, file + terminal sensors, error subscriber |
| `organism-client` | CLI that talks to the daemon over Unix socket |

- **IPC**: Unix domain socket, newline-delimited JSON envelopes
- **Bus**: `tokio::sync::broadcast` — producers (sensors, IPC) post events; subscribers (error classifier) react

## Evolution Levels

| Level | Scope | Status |
|-------|-------|--------|
| L0 Observer | Event bus, knowledge store, pattern engine | Done |
| L1 Sensor wiring | Bidirectional IPC, zsh hook → emit-terminal | Done |
| L2 Watcher + classifier | `notify` file watcher, regex error classifier, LaunchAgent | Done |
| L3 Ollama integration | HTTP client, `suggest` module, `organism-cli suggest` | Done |
| L3.5 Effector seed | `apply` IPC, patch/shell/note plans, `--stage` writes to `/tmp` | Done |
| L4 Digital twin | Codes alongside you in your style | Planned |

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/bigknoxy/self-evolving-dev-ecosystem/main/scripts/quick-install.sh | bash
exec zsh
organism-cli status
```
