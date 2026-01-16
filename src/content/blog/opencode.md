---
title: "OpenCode: My Terminal-Based AI Coding Agent for Agentic Development"
description: "Why I'm moving my AI workflow to the terminal with OpenCode, a privacy-first, open-source coding agent."
pubDate: 2026-01-15
heroImage: "/assets/images/opencode-hero.png"
tags: ["ai", "coding", "agentic", "typescript", "python", ".net"]
---

Over the last couple of decades, I’ve lived in the C#/.NET world, building everything from monoliths to microservices, APIs, and cloud-native apps. These days, I’m just as happy in a TypeScript/Node.js project or a Python script as I am in a `.csproj` file, and I’m especially excited about the new wave of **agentic development tools** that let AI act like a real coding partner.

One tool that’s quickly become a daily driver in my terminal is [OpenCode](https://opencode.ai/) — an open-source AI coding agent built specifically for the terminal. It’s not just another chat-with-your-code tool; it’s a full-fledged agent that can plan, build, debug, and even share sessions with teammates, all from inside my shell.

## What is OpenCode?

OpenCode is an open-source AI coding agent that runs as a terminal UI (TUI), giving you a responsive, themeable interface right where you already live: the command line. It’s designed to be your AI teammate, helping you write and run code directly in your project directory, with deep integration into your editor and language servers.

Key features that stood out to me:

- **Native TUI** – A polished, keyboard-driven terminal interface that feels like a real IDE panel, not a web app in a tab.  
- **LSP enabled** – It automatically loads the right language server for your stack, so it understands C#, TypeScript, Python, and more in context.  
- **Multi-session support** – You can run multiple OpenCode agents in parallel on the same project, which is great for exploring different approaches at once.  
- **Any model, any provider** – It supports 75+ LLM providers (OpenAI, Anthropic, local models, etc.) through Models.dev, so you’re not locked into one vendor.  
- **Privacy-first** – OpenCode doesn’t store your code or context, which matters a lot when working in sensitive environments or on personal projects.

It’s also fully open source, with over 30,000 GitHub stars and used by hundreds of thousands of developers monthly, so it’s clearly solving a real pain point.

## Agentic workflows in the terminal

What really excites me about OpenCode is how it enables **agentic coding workflows** — treating the AI not as a chatbot, but as an autonomous agent that can reason about your codebase, plan changes, and execute them safely.

Instead of just asking “write a function,” I can:

1. Ask OpenCode to **analyze** my existing code and explain how a feature is currently implemented.  
2. Have it **plan** a new feature or refactor, describing the steps it would take.  
3. Then, once I’m happy with the plan, let it **build** the changes directly in the codebase.  

This “plan → build” loop feels a lot like pairing with a very capable junior developer who reads the docs, follows patterns, and asks clarifying questions when needed.

## Getting started: install and config

Installation is straightforward and fits right into a modern dev setup. On macOS/Linux, the quick path is:

```bash
curl -fsSL https://opencode.ai/install | bash
```

You can also use Homebrew, npm, or grab a binary from releases, depending on your preference. Windows users can run it via WSL2 or use npm/bun.

Once installed, you configure it with your LLM provider of choice. OpenCode supports:

*   Cloud providers (OpenAI, Anthropic, Gemini, etc.)
*   Local models (via Ollama, llama.cpp, etc.)
*   And curated “Zen” models optimized specifically for coding tasks

In the TUI, you run `/connect` and paste your API key, or set it up globally in `~/.config/opencode/config.json`.

### Initializing a project

After config, you `cd` into your project and launch OpenCode:

```bash
cd my-awesome-project
opencode
```

The first thing I do is run `/init` to initialize the project. OpenCode analyzes the codebase and creates an `AGENTS.md` file in the root, which helps it understand:

*   Project structure (folders, entry points, config files)
*   Coding patterns and conventions used in the repo
*   Any framework-specific quirks (ASP.NET, Express, FastAPI, etc.)

From that point on, OpenCode “knows” the context of your app, so prompts like “add a new API endpoint for user profiles” or “refactor this Python module to use async/await” are much more effective.

## Plan mode vs. Build mode

The killer feature for me is the built-in Plan and Build modes, which let you separate thinking from doing.

### Plan mode: think before you code

In **Plan mode** (switch with Tab), OpenCode can:

*   Read and analyze your code
*   Suggest architectural changes or refactorings
*   Generate detailed implementation plans in `.opencode/plans/*.md`

But it **cannot**:

*   Create or modify existing source files
*   Run arbitrary shell commands
*   Apply patches or make any destructive changes

This is perfect when I’m:

*   Adding a new feature and want to sketch out the design first
*   Refactoring a complex C# service and want to validate the approach
*   Exploring how to integrate a new Python library into a TypeScript backend

For example, I might ask:

> “Plan how to add a new /api/users/export endpoint in this ASP.NET Core app that returns a CSV of all users, with pagination and filtering by role.”

OpenCode will walk through the controllers, services, and DTOs, propose a plan, and I can refine it before moving to Build mode.

### Build mode: execute with confidence

Once the plan looks good, I hit Tab again to switch to **Build mode** — the default mode where OpenCode can:

*   Create new files (write)
*   Edit existing files (edit)
*   Run shell commands (bash)
*   Apply patches and manage todos

Now I can say:

> “Now build the /api/users/export endpoint using the plan we just discussed.”

OpenCode generates the controller, service, and any DTOs, and I can review the diff in my editor before committing.

If something goes sideways, `/undo` and `/redo` make it trivial to roll back and try again, which is a huge win for safety and experimentation.

## Why this fits my workflow

As someone who’s spent years in Visual Studio and Rider, I was skeptical about moving more of my coding into the terminal. But OpenCode has become a natural extension of my existing workflow, especially as I build more polyglot systems:

1.  **Homelab & agentic experiments** – I use it heavily in my homelab when building agentic systems that coordinate between C# services, TypeScript frontends, and Python data/ML scripts. OpenCode helps me quickly prototype integrations and glue code without context-switching between IDEs.
2.  **Cross-language comfort** – Whether I’m writing a new Python script for data processing or a TypeScript API client, OpenCode’s LSP support and project awareness make it feel like a consistent coding partner across languages.
3.  **Privacy and control** – Because OpenCode is open source and doesn’t store your code, I can use it confidently on personal projects, internal tools, and even in environments where sending code to a third-party cloud service is a no-go.
4.  **Agentic mindset** – It reinforces the idea that AI isn’t just a chatbot, but an agent that can own tasks, follow patterns, and be guided through a workflow (plan → build → review → share).

## Sharing and collaboration

Another neat touch is the ability to share a session with teammates. OpenCode generates a link to the current conversation, which is great for:

*   Pairing on a tricky bug or feature
*   Getting feedback on a plan before building
*   Onboarding new team members by walking them through a codebase

It’s like sharing a live coding session, but with an AI agent in the middle, which feels like the future of remote collaboration.

## Wrapping up: agentic development is here

OpenCode is more than just a terminal-based AI assistant; it’s a glimpse into the future of autonomous software engineering. By combining a powerful TUI, deep language understanding, and a clear plan/build workflow, it lets me treat AI as a true coding partner, not just a glorified autocomplete.

For long-time .NET devs like me who are now comfortable across TypeScript, Python, and beyond, tools like OpenCode make it easier than ever to build agentic systems that design and build applications with minimal friction.

If you’re exploring agentic development and want a privacy-respecting, open-source agent that lives in your terminal, I’d highly recommend giving OpenCode a try. It’s quickly become one of my favorite tools for turning ideas into working code, one agent at a time.
