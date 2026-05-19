---
title: "joshbot"
description: "A lightweight personal AI assistant with self-learning, long-term memory, and terminal-native interface. Built in Go."
pubDate: 2026-04-15
tags: ["Go", "AI/LLM", "CLI"]
repoUrl: "https://github.com/bigknoxy/joshbot"
heroImage: "/assets/images/projects/joshbot-hero.svg"
featured: false
---

## Your Terminal-Based AI Companion

joshbot lives in your terminal, ready to help with:

- **Code debugging**: Knows your tech stack and preferences
- **Task management**: Reminders, timers, and todo lists
- **Knowledge base**: Remembers things you tell it
- **Tool integration**: Works with your existing workflow

## Self-Learning Memory

Unlike cloud-based assistants, joshbot:
- Stores everything locally
- Learns your preferences over time
- Never sends your data to third parties
- Integrates with your notes and documents

## Why Go?

Go was chosen for:
- Fast startup time
- Efficient resource usage
- Excellent standard library
- Easy deployment (single binary)

## Getting Started

```bash
go install github.com/bigknoxy/joshbot/cmd/joshbot@latest
joshbot init
joshbot chat
```

