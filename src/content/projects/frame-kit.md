---
title: "frame-kit"
description: "Shell-based agentic FRAME loop implementation. Run the Focus-Requirements-Automate-Measure-Evaluate cycle directly from your terminal."
pubDate: 2026-04-01
heroImage: "/assets/images/projects/frame-kit-hero.svg"
tags:
  - "Shell"
  - "Bash"
  - "Agentic"
  - "FRAME"
  - "CLI"
repoUrl: "https://github.com/bigknoxy/frame-kit"
featured: true
---

# frame-kit

**frame-kit** is a Claude Code plugin that implements the agentic FRAME loop — Focus, Requirements, Automate, Multi-agent, Evaluate — right inside your Claude Code sessions.

## The FRAME Loop in Claude Code

frame-kit brings structured agentic development to Claude Code with chat commands:

- **F**ocus: `/focus` — Define what you're building with a clear prompt
- **R**equirements: `/spec` — Auto-gather and document project requirements
- **A**utomate: Dispatch AI agents to handle implementation
- **M**ulti-agent: `/handoff` — Pass context between specialized agents
- **E**valuate: Review results and decide — ship it or iterate

## Why Claude Code?

Claude Code is your terminal-based AI coding partner. frame-kit layers structure on top:

- **FRAME commands**: `/frame-init`, `/spec`, `/handoff` for guided development
- **Checkpointing**: Save and resume FRAME sessions within Claude Code
- **Templates**: Reusable project templates for common workflows
- **Skills**: Composable agent skills for specialized tasks

## Key Features

- **Chat commands**: `/frame-init` starts a new FRAME session
- **Spec generation**: `/spec` creates structured requirements documents
- **Agent handoff**: `/handoff` passes context between agents cleanly
- **Checkpointing**: Save progress and resume later
- **Lightweight**: Pure shell scripts, integrates with existing Claude Code setup

## Getting Started

Install via Claude Code plugin marketplace:
```bash
/plugin marketplace add bigknoxy/frame-kit
```

Then start a session:
```bash
/frame-init
```

## Philosophy

The best tools get out of your way. frame-kit doesn't try to be an IDE, a framework, or a platform. It's just a loop — a really useful one that happens to fit perfectly in your terminal workflow.

Source Code: [GitHub (frame-kit)](https://github.com/bigknoxy/frame-kit)
