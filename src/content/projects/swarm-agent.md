---
title: "Swarm Agent"
description: "A local AI coding agent built on the ReAct+TDD architecture. Implements a Code → Verify → Reflect loop using Ollama, with long-term memory, tool execution, and a role-based Architect → Developer → Utility workflow."
pubDate: 2026-05-07
tags: ["Go", "Ollama", "AI Agent", "ReAct", "Local AI", "TDD"]
repoUrl: "https://github.com/bigknoxy/swarm-agent"
featured: false
---

## A Self-Verifying Local AI Coding Agent

Swarm Agent implements a **Code → Verify → Reflect** loop — it never outputs code it hasn't proven correct through execution. Built in Go, powered by Ollama (qwen2.5-coder:32b), and installable in 30 seconds.

## Key Features

- **Verified Output** — Executes and tests code before returning results
- **Self-Learning** — Long-Term Memory (LTM) persists lessons across sessions
- **Tool Ecosystem** — Python REPL, Performance Checker, FileTool
- **Role System** — Architect → Developer → Utility with specialized model prompts per role
- **Zero-Config** — Works out of the box, fully customizable via config

## Architecture

Built on the **ReAct** (Reasoning + Acting) pattern extended with TDD verification:

1. **Think** — Architect role plans the approach
2. **Code** — Developer role writes the implementation
3. **Verify** — Executes code through Python REPL or test runner
4. **Reflect** — On failure, LTM records the lesson and retries

## Quick Start

```bash
curl -sSL https://swarm.sh | sh
swarm "Write a Python function that calculates fibonacci numbers"
```

The agent thinks, codes, verifies, and returns working code.
