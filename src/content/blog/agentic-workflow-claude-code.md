---
title: "I Gave Claude Code a Task and Told It Not to Ask Permission"
description: "What happens when you hand an agentic coding tool a real production codebase, say 'go until completion,' and actually mean it."
pubDate: 2026-05-13
heroImage: "/assets/images/blog/claude-code-session.png"
tags: ["ai", "agentic", "claude-code", "workflow", "productivity"]
---

# I Gave Claude Code a Task and Told It Not to Ask Permission

*Or: The Day I Stopped Being a Babysitter and Started Being a Product Manager*

Here's a sentence I typed into Claude Code recently that I'm still thinking about:

> "don't ask for permission just do this until completion"

I was handing it a full production workflow: frontend design review, mobile QA, code review, fix findings, merge PRs, validate production. For my portfolio site. Which has a live game on the homepage.

The thing actually did it.

## The Setup

I've been building [bigknoxy.github.io](https://bigknoxy.github.io) as a kind of personal laboratory. Not just a portfolio, but a place to experiment. The site runs Astro, Tailwind, a self-built ECS canvas game, Pagefind search — more moving parts than a portfolio strictly needs. That's intentional.

I'd just finished a phosphor terminal redesign: the site now looks like a 1982 Game Boy display, green-on-black, CRT scanlines, the whole bit. I wanted to QA it. I wanted to know if it held up on mobile. I wanted the code reviewed. And honestly? I was curious what would happen if I just... let the agent run.

So I did.

## What Agentic Actually Means in Practice

The word "agentic" gets thrown around a lot. In the context of developer tooling, it usually means one of two things:

1. **Autocomplete that runs multiple steps** (impressive, but not that different from a macro)
2. **An agent that reasons about a goal, plans, executes, evaluates, and retries** (genuinely different)

Claude Code leans hard into the second. When I gave it the task, it didn't just start editing files. It:

- Spawned a subagent to do the frontend design review in parallel
- Spawned a separate subagent to do mobile QA at 375px/768px/1280px viewports using a headless browser
- Read the existing code, identified seven specific issues from the code review, then cross-referenced them with the mobile QA findings
- Fixed all twelve findings
- Verified the build passed
- Created PRs, waited for CI, merged with admin override, waited for GitHub Actions to deploy
- Validated production using the headless browser

All while reporting back only at key moments, not every step.

This is what "agentic" actually looks like when it's working.

## The Part Where I Wanted to Grab the Wheel

I'll be honest: there were moments I wanted to intervene.

The agent was merging PRs. To production. Without me reviewing the diff. For a brief few minutes, I understood exactly how a tech lead feels when they've told a junior dev "just handle it" and then watched them open a terminal.

But I'd set the parameters. The work was scoped. The agent had the context. So I watched.

What came back:

- Homepage game centered properly (it had been left-aligned — embarrassing in hindsight)
- Double terminal chrome removed (the game component was wrapped in *another* terminal window div on top of its own built-in one)
- Blog post h1 text no longer overflowing on 375px mobile
- Search bar rethemed from the old color palette to the new one
- Touch targets fixed across nav and footer (they were 14px tall — criminal)
- Canvas rendering bug fixed (more on this in a minute)

The builds were green. Production was green. I'd done basically nothing except write the original prompt.

## The Bug That Made Me Feel Validated

The most satisfying finding from the whole session was a canvas rendering bug I'd missed for weeks.

Inside the game's background drawing function, there was this:

```javascript
ctx.fillText(line, line.x, line.y);
```

The variable `line` was an object `{text, x, y, speed}`. Passing an object to `fillText` renders `[object Object]` to the canvas. So my game had been quietly rendering `[object Object]` strings floating across the background the entire time, at 60fps.

I had not noticed. Zero users had mentioned it. The agent caught it in a code review, fixed it in the same commit, and moved on.

That's the thing about agentic code review: it doesn't get tired. It doesn't skim. It reads the actual call sites.

## What Actually Changed About How I Work

Running a session like this shifts your mental model in a useful way.

When you're writing code yourself, you think in terms of **what to build**. When you're directing an agent through a complex task, you think in terms of **what to verify** and **what can go wrong**. It's closer to being a tech lead than a developer. You're defining success criteria, not implementation details.

That's not a demotion. That's a different and arguably more valuable skill.

The failure mode of bad agentic work isn't "the agent wrote wrong code." It's "I gave the agent a bad goal." If the goal is fuzzy, the output is fuzzy. If the success criteria are clear, you get green builds and correct behavior.

"Don't ask for permission, go until completion" works when:
- The scope is defined
- The risk is bounded (it's my portfolio, not a payments API)
- The agent has enough context to make judgment calls
- You've built enough trust through smaller tasks first

That last one matters more than people admit.

## The Workflow I've Settled Into

After a few months of running Claude Code on real projects, here's what actually works for me:

**1. Front-load the context.** Read the CLAUDE.md, scan the architecture, understand the patterns before touching anything. The agent does this naturally when you don't rush it.

**2. Let parallel subagents handle independent research.** Code review and mobile QA can run simultaneously. Don't serialize things that don't need to be serial.

**3. Review PRs, not diffs.** When the agent creates a PR, review the PR description first. If it can't articulate what it changed and why, the code probably has the same problem.

**4. Keep "don't ask permission" scoped.** Autonomous operation is great for bounded tasks. "Refactor the auth system and don't ask me anything" is how you end up with a production incident.

**5. Validate production, not just CI.** CI tells you the code compiles. Actually loading the site in a browser at 375px tells you if users can read the nav.

## The Part I Still Don't Fully Trust

Multi-step agentic workflows are genuinely impressive, but they have a failure mode that's subtle: **confident wrongness**.

An agent that's stuck on something will sometimes generate a plausible-looking fix that doesn't actually address the root cause. It looks like it worked. The build passes. But you've replaced a bug with a different bug that manifests in a slightly different way.

I've been burned by this once or twice. The defense is good test coverage and real validation (browser, not just unit tests). Which, ironically, the agent is also good at helping you write.

## Is This the Future?

I don't know if "give the AI a goal and walk away" is the right model long-term. But as a working pattern for bounded, well-scoped tasks on codebases you understand?

It's already my default.

The economics are obvious: tasks that would have taken me a full afternoon — code review, mobile QA pass, PR creation, CI validation, production smoke test — took a single prompt and about forty minutes of wall clock time. I used that time to think about what to build next instead of how to build what I already knew.

That's the trade. You give up some control. You get back time and a cleaner codebase.

For personal projects, that's an easy call.

---

*The portfolio is at [bigknoxy.github.io](https://bigknoxy.github.io). The game on the homepage actually renders text correctly now. The nav links have proper touch targets. The search bar matches the color scheme. The build is green. I shipped all of that in a conversation.*

*Code is at [github.com/bigknoxy](https://github.com/bigknoxy).*
