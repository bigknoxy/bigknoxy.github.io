---
title: "Rewriting a Portfolio Game in One Sitting (The Bugs Were Spectacular)"
description: "How a simple 'center the game' request turned into a complete rewrite, a canvas rendering bug I'd missed for months, and a lesson in agentic debugging."
pubDate: 2026-05-15
heroImage: "/assets/images/blog/terminal-runner.png"
tags: ["games", "canvas", "debugging", "agentic", "typescript", "javascript"]
---

# Rewriting a Portfolio Game in One Sitting (The Bugs Were Spectacular)

*Or: Why [object Object] Is My New Least Favorite String*

It started with a suspicion.

"I feel like the game should be centered, but get an expert opinion."

That was the prompt. Innocent enough. What followed was a four-hour session that turned into a complete game rewrite, surfaced a canvas rendering bug I'd been shipping to production for months, and taught me something specific about how agentic debugging works differently than doing it yourself.

## The Game

If you haven't seen the homepage: there's a canvas game called Terminal Runner embedded in the portfolio. It's an infinite runner — jump over obstacles, collect coins — but skinned to match the phosphor terminal aesthetic. Green on black, pixelated, looks like something you'd find on a Game Boy running DOS.

The original version loaded an external game bundle from `/game/game-engine.js`. This was fine in theory. In practice, the bundle was 404ing in production. The game was broken and I hadn't noticed because the terminal chrome around it still rendered. Visually: fine. Functionally: a very nice-looking broken thing.

## The Centering Problem (That Wasn't Actually the Problem)

The design review confirmed the centering issue immediately. The game was left-aligned because the homepage was wrapping `<MiniGame />` in an `inline-block` div with no centering parent. Easy fix.

But then the review found the real problem: **double terminal chrome**.

The `MiniGame` component already renders its own terminal window — title bar, dots, the whole thing. The homepage was wrapping it in *another* terminal window. So there were two stacked frames: one with a title, one inside it with a slightly different title. Like a browser window inside a browser window.

I'd built this. I'd looked at it for weeks. I thought it was intentional.

It was not intentional.

## The Rewrite Decision

Fixing the broken bundle path meant making a choice: patch the build pipeline to correctly output the bundle, or go self-contained.

Self-contained won. The reasoning was simple: a portfolio homepage game should not have an external dependency that can 404. Better to be 719 lines of inline script that always works than a clean architecture that breaks silently in production.

So the game got rewritten as a self-contained `<script>` block inside `MiniGame.astro`. No external imports. No bundle. Just canvas, `requestAnimationFrame`, and the Web Audio API.

The rewrite itself went fast. ECS-style: entities (Player, Obstacle, Collectible), systems (physics, render, input), object pool for performance. Fixed 60fps loop with delta accumulator. The interesting part came during review.

## The Bugs (Ranked by How Long I'd Been Shipping Them)

### Bug 1: `[object Object]` Rendering to Canvas (Champion: Several Months)

```javascript
// What was there:
ctx.fillText(line, line.x, line.y);

// What it should have been:
ctx.fillText(line.text, line.x, line.y);
```

The variable `line` is a background particle object: `{text, x, y, speed}`. Passing the whole object to `ctx.fillText()` converts it to a string automatically. In JavaScript, that string is `[object Object]`.

So: every frame, for every background text particle, the game was rendering `[object Object]` floating across the screen. At 60 frames per second.

I had played this game dozens of times while building it. Zero users mentioned it. I had screenshots of the game in this very blog's commit history, with `[object Object]` probably visible if you zoomed in enough.

The agent caught this on first read of the render function. It took approximately three seconds to identify and one line to fix.

The lesson here isn't "AI is smarter than me." It's that agentic code review doesn't get fatigued. It doesn't skim. It reads every call site. When you've looked at code a hundred times, your brain starts pattern-matching and stops actually reading it. Fresh eyes — even synthetic ones — see what you've stopped seeing.

### Bug 2: RAF Loop That Never Stopped (Runtime: Since Initial Commit)

```javascript
// Broken:
requestAnimationFrame(loop);

// Fixed:
rafId = requestAnimationFrame(loop);
// ...
document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(rafId);
}, { once: true });
```

Astro uses View Transitions. When you navigate away from the homepage, the page content swaps. But the old `requestAnimationFrame` loop keeps running — there's nothing to stop it. You navigate to `/projects`, the game loop is still ticking. You navigate to `/blog`, it's still there. Every navigation stacks another ghost loop.

Eventually: memory leak, performance degradation, browser getting warm for no apparent reason.

The fix is `astro:before-swap` — an event Astro fires right before a transition. Store the RAF ID, cancel it there. One event listener, `{ once: true }` so it self-removes.

### Bug 3: Keydown Handler That Accumulated On Every Visit

Same pattern as the RAF bug. `window.addEventListener('keydown', handler)` added on page load, never removed. Navigate away and back: two handlers. Do it ten times: ten handlers, ten jump responses per keypress.

The game would become increasingly... enthusiastic about space bar presses.

Fix: name the handler, remove it in the same `astro:before-swap` cleanup block. One teardown function handles both.

### Bug 4: High Score Updating During a Run

This one's subtle. The high score display was updating live during gameplay:

```javascript
// In the game loop, every frame:
if (score > highScore) highScore = Math.floor(score);
```

So `BEST: 0193` wouldn't stay at 0193 while you were running. It would track upward in real time, matching the current score, making it indistinguishable from the score counter. You'd die, the screen would show SCORE: 0193, BEST: 0193 — and you'd have no idea if you'd actually set a new record.

The fix: only update `highScore` on death, not every frame. The best score now correctly holds the previous session's peak until you beat it.

### Bug 5: Collected Coins Not Actually Removed

```javascript
// Broken:
coin.collected = true;  // marked, but still in array

// Fixed:
collectibles.splice(i, 1);  // removed immediately
```

Coins that were collected were being flagged with `collected = true` but left in the array. The render loop would skip them (`if (coin.collected) continue;`), but they were still being iterated every frame. Over a long run, you'd accumulate hundreds of invisible "ghost coins" eating CPU.

The fix: backward iteration + splice on collect. Clean.

## What Made This Session Different

The traditional debugging workflow: run the game, observe weird behavior, form a hypothesis, add console logs, narrow it down, fix it.

What actually happened here: agent read the source cold, identified five distinct bugs in one pass, categorized them by severity, fixed them in a single commit, then ran a build to verify. No console logs. No hypothesis formation. Just: "I read your code, here's what's wrong."

The difference matters. When I debug something I wrote, I have a mental model of how it *should* work that actively interferes with seeing how it *does* work. I'm not reading the code — I'm reading my memory of writing it. Those are different things.

An agent doesn't have that memory. It sees the actual code.

This isn't magic. It fails at things that require understanding intent, domain context, or user experience. But for "read this function and tell me what's wrong mechanically" — it's genuinely better than my tired second-pass eyes.

## The Aesthetic Part (Because It Matters)

After the bugs, we fixed the centering, removed the double chrome, bumped the max width from `max-w-2xl` to `max-w-3xl` (the game felt cramped), and updated the terminal title from `terminal-runner.exe` to `TERMINAL-RUNNER.EXE` (lowercase in a CRT terminal always felt slightly wrong).

The result: centered, correctly-framed, 640px wide, green-on-black, with a blinking cursor and CRT scanlines from the global CSS. It looks exactly like it should look. It took most of this session to get there.

Sometimes the "simple" design fix is a load-bearing investigation.

## The Numbers

- **Lines of inline game code**: 719
- **External dependencies removed**: 1 (the bundle that was 404ing)
- **Bugs shipped to production**: at minimum 5, discovered in one review
- **Time the `[object Object]` bug had been live**: months, conservatively
- **Time to find it in review**: ~3 seconds
- **Score I got while playtesting the fixed build**: 0193
- **Score the automated browser got in the same playtesting**: also 0193 (the space bar timing is hard)

## One More Thing

After all the fixes, I used the headless browser to actually play the game as part of production validation. It navigated to the homepage, focused the canvas, pressed space, and took screenshots at intervals.

The game ran. Score ticked up. GAME OVER appeared. BEST persisted correctly to the next run.

It's a small thing. But shipping something that works correctly in production, verified by a browser that actually loaded and played it — that's the kind of closure that makes a session feel complete.

The game is on the [homepage](https://bigknoxy.github.io) if you want to check. The `[object Object]` is gone. The RAF loop cleans up. The high score persists.

Go beat 193.

---

*Source is at [github.com/bigknoxy/bigknoxy.github.io](https://github.com/bigknoxy/bigknoxy.github.io). The game is in `src/components/game/MiniGame.astro`. Read the render function. You'll see where the object-Object bug was.*
