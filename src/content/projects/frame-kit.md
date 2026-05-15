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

**frame-kit** is a shell-native implementation of the agentic FRAME loop — Focus, Requirements, Automate, Measure, Evaluate — designed for developers who live in the terminal and want AI-assisted development without leaving their workflow.

## The FRAME Loop, Terminal-Native

frame-kit brings the structured agentic development cycle straight to your shell:

- **F**ocus: Define what you're building with a simple prompt
- **R**equirements: Auto-gather and document what the project needs
- **A**utomate: Dispatch AI agents to handle the implementation
- **M**easure: Run tests, checks, and validation automatically
- **E**valuate: Review results and decide — ship it or iterate

## Why Shell?

Because your terminal is home. frame-kit:

- Works with any POSIX-compatible shell
- Zero runtime dependencies — just bash and curl
- Integrates with your existing aliases, scripts, and tooling
- Pipes everywhere — compose with grep, jq, fzf, whatever you want
- Fast. Like, *really* fast. No Node_modules in sight.

## Key Features

- **Interactive mode**: Step through each FRAME phase with guided prompts
- **Automated mode**: Run the full loop hands-free for well-defined tasks
- **Checkpointing**: Save and resume FRAME sessions
- **Composable**: Pipe FRAME outputs into other tools
- **Lightweight**: The whole thing is shell scripts. Seriously.

## Getting Started

```bash
git clone https://github.com/bigknoxy/frame-kit.git
cd frame-kit
chmod +x frame
./frame init
./frame start --interactive
```

## Philosophy

The best tools get out of your way. frame-kit doesn't try to be an IDE, a framework, or a platform. It's just a loop — a really useful one that happens to fit perfectly in your terminal.

Source Code: [GitHub (frame-kit)](https://github.com/bigknoxy/frame-kit)
