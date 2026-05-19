---
title: "Five Bugs That Hid in Plain Sight for Months"
description: "A canvas game, five production bugs, and what each one reveals about why certain failures are invisible to the person who wrote the code."
pubDate: 2026-05-19
tags: ["debugging", "javascript", "canvas", "games", "devex"]
---

# Five Bugs That Hid in Plain Sight for Months

*Or: A Taxonomy of Things You Stop Seeing*

I've been thinking about why these five bugs survived for so long.

Not how they were found — that part's simple, a code review caught them in one pass. Not what they were — I wrote about that already. The interesting question is *why* they were invisible. Each one was invisible for a different reason. That's worth pulling apart.

The bugs were in Terminal Runner, the canvas game on my homepage. An agentic code review pass found all five in one read of the render loop. I had shipped this game with a broken canvas renderer, a memory leak, an event listener that multiplied itself, a score display bug disguised as a feature, and a data structure antipattern I'd used intentionally in a previous version but never cleaned up.

Five bugs. Five different mechanisms for staying hidden. Here's the taxonomy.

---

## Bug 1: The [object Object] Renderer

```javascript
// what was there
ctx.fillText(line, line.x, line.y);

// what it should have been
ctx.fillText(line.text, line.x, line.y);
```

**Why it hid:** JavaScript's implicit coercion.

`ctx.fillText()` calls `.toString()` on whatever you pass as the first argument. For a plain object, `.toString()` returns `[object Object]`. This is correct JavaScript behavior — not an error, not a warning, not a crash. The function ran successfully. Every frame.

The background particles in the game are small objects: `{ text, x, y, speed }`. I passed the whole object. The canvas dutifully rendered `[object Object]` floating across the background, at 60 frames per second, for months.

Here's why I didn't catch it: at arm's length, the code looks right. `fillText(line, line.x, line.y)` — the variable is named `line`, you're filling text, you're passing `line`. The structural shape of the call matches what you'd expect. Your brain pattern-matches the shape and moves on.

This is the most insidious class of bug: **the code reads like it should work.** The semantics are wrong but the syntax is plausible. You're not reading the code, you're reading your model of the code. Those are different documents.

The fix took one character. The oversight took five months to surface.

---

## Bug 2: The RAF Loop That Ghosted

```javascript
// broken: no way to cancel it
requestAnimationFrame(loop);

// fixed: store the ID
rafId = requestAnimationFrame(loop);

document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(rafId);
}, { once: true });
```

**Why it hid:** resource exhaustion is invisible until it isn't.

Astro uses View Transitions. When you navigate away from the homepage, the page content swaps. The `requestAnimationFrame` loop doesn't know this happened. There's nothing to tell it to stop. So it keeps running — on the next page, and the next, and the one after that.

Navigate to `/blog` and back. Navigate to `/projects` and back. Do this ten times. Now you have eleven game loops running simultaneously. They're all invisible because there's no visible symptom until the browser gets warm, tabs start slowing down, and eventually something crashes.

I'd used the game for months on a fast machine with fast navigation. The degradation wasn't perceptible on a laptop with 16GB of RAM and an M-series chip. On a phone, on a lower-end machine, navigating back and forth a few times would have eventually made the issue obvious.

This is the **resource exhaustion class:** the bug exists, it's accumulating, but the symptom threshold is higher than your typical test path hits. Fast hardware masks it. Clean navigation patterns mask it. It only surfaces in adverse conditions you're not testing.

The pattern: `addEventListener` without a corresponding `removeEventListener`, `setInterval` without `clearInterval`, `requestAnimationFrame` without `cancelAnimationFrame`. They're all the same shape. They all hide the same way.

---

## Bug 3: The Keydown Handler That Multiplied

Same pattern as the RAF bug, different symptom — and the symptom is significantly funnier.

```javascript
// broken: new handler added on every page visit
window.addEventListener('keydown', handler);

// fixed: named handler, removed on cleanup
window.addEventListener('keydown', onKeyDown);

document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('keydown', onKeyDown);
}, { once: true });
```

Navigate to the homepage. A keydown handler is added. Navigate away, navigate back. Another handler is added. The first one is still there. Navigate away, navigate back again. Three handlers.

Press space: three jumps trigger simultaneously. Somehow more responsive than before. Keep visiting the homepage enough times and space bar becomes a turbo button that fires the jump handler a dozen times per keypress.

**Why it hid:** the bug makes the game *more* responsive, not less. If you're testing by playing the game, extra jump sensitivity on the space bar doesn't break anything — it might even feel snappier. The failure mode is invisible because it presents as a feature.

Same root cause as the RAF leak (event listener never removed, Astro navigation adds another), different experience. The RAF leak is silent degradation. This one is overt — but it looks fine until the count gets high enough to be absurd.

---

## Bug 4: The High Score That Wasn't

```javascript
// broken: updates every frame during the run
if (score > highScore) highScore = Math.floor(score);

// fixed: only update on death
// (moved to the game-over state transition)
```

**Why it hid:** it looked like a working feature.

The score counter ticks up during a run. The high score display was also ticking up during a run — tracking the current score in real time. SCORE: 0142. BEST: 0142. They moved in lockstep.

When you die and the game shows SCORE: 0193, BEST: 0193, you can't tell if you set a new record. The whole point of a persistent high score is to give you something to beat. But if the high score updates mid-run, it's just a second score counter with a different label.

Here's why I didn't catch it: **I knew what the high score was supposed to do, so I read the display as if it was doing it.** I saw BEST: 0193 and my brain registered "high score working." The question I wasn't asking was "is that value correct?" I was only checking that the label and number were both present.

This is confirmation bias as a debugging antipattern. The feature looked right to me because I wrote it expecting it to look right. A fresh reader — or a code review — asks a different question: what is this value actually tracking?

---

## Bug 5: The Ghost Coins

```javascript
// broken: marked but left in array
coin.collected = true;

// fixed: removed immediately
collectibles.splice(i, 1);
```

**Why it hid:** it was the right pattern in a previous version.

In an earlier implementation, the collectibles array was iterated and rendered in a single pass. Marking `coin.collected = true` and skipping collected coins on render was the correct approach — you couldn't splice mid-iteration without breaking the loop index.

By the time I rewrote the game to use backward iteration + splice, I kept the guard. Old habit. The `if (coin.collected) continue;` line didn't cause visible problems — spliced coins are gone from the array, so the guard never evaluates to true. It's dead code that presents as defensive code.

Over a long run, you'd accumulate hundreds of collected coins in the array, all marked `collected: true`, none of them rendering, all of them being iterated every frame. Silent performance leak, invisible to the player.

**This is survivor bias from a refactor.** The pattern made sense in the old architecture. The refactor made it obsolete without making it wrong-looking. Defensive-looking dead code is some of the hardest to remove — it feels like you're removing a safety net, not cleaning up a relic.

---

## The Common Thread

Five bugs. Five different reasons they survived:

1. **Implicit coercion** — code reads like it should work; your model substitutes for the actual semantics
2. **Resource exhaustion** — accumulates silently until it crosses a threshold you don't hit in normal testing
3. **Beneficial-looking failure** — the bug presents as a feature, so you read it as one
4. **Confirmation bias** — you know what the feature should do, so you see it doing that
5. **Refactor artifact** — the pattern was correct once; the code looks defensive even though it's inert

What connects them: I wrote all five. I knew the codebase. I'd played the game dozens of times. And I missed every one.

The agent that found them didn't have my context. It read the actual code, not my memory of writing it. It didn't know the high score was "supposed" to persist — it just saw that the variable was being updated every frame. It didn't know the backward iteration was intentional — it just saw that `if (coin.collected)` would always be false.

Fresh reads see what's there. Author reads see what was intended. Those aren't the same thing. The diff between them is your bug list.

---

*Terminal Runner is on the [homepage](https://bigknoxy.github.io) if you want to try to beat 193. All five bugs are gone. The RAF loop cleans up. The high score holds. The [object Object] is gone.*

*Source: [github.com/bigknoxy/bigknoxy.github.io](https://github.com/bigknoxy/bigknoxy.github.io). The render function is in `src/components/game/MiniGame.astro`. The ghost coin guard is gone.*
