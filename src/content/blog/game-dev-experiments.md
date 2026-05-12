---
title: "I Made Silly Games and Learned Things"
description: "From chicken mobs to chopping vegetables at alarming speeds - my journey into making games that probably shouldn't exist."
pubDate: 2026-05-20
heroImage: "/assets/images/blog/game-dev.png"
tags: ["games", "typescript", "fun", "experiments"]
---

# I Made Silly Games and Learned Things

*Or: Why I Spent Three Weeks Making Chickens Run in Lanes*

Look, I'll be honest with you. I made some games. They're weird. They're probably not "good" by traditional standards. But dang it, they were *fun* to build.

## Chicken Mob: The Game That Started It All

It started innocently enough. I was watching a nature documentary about chickens (as one does), and I thought: "What if there was a game where you herd chickens?"

Not farm chickens. *Mob* chickens. Like, hundreds of them. Running in lanes. Like some kind of poultry-based rhythm game.

### The Concept

You're a chicken herder. Chickens are running at you in lanes. You have to... do something with them? I never really nailed down the "why," but the "how" was crystal clear:

- TypeScript
- Canvas rendering
- Web Audio API for chicken sounds (yes, I recorded actual chickens)
- Probably too many chickens

### The Development Journey

**Day 1**: "This is going to be amazing!"

**Day 3**: "Why are the chickens vibrating?"

**Day 7**: "I have 47 different chicken sprites and I can't stop drawing them."

**Day 12**: "The collision detection is making me question my life choices."

**Day 15**: "IT WORKS! The chickens are mobbing!"

### What I Learned

**1. Object Pooling is Your Friend**

When you're rendering 500 chickens at 60fps, garbage collection becomes... noticeable. Like, "why is my browser frozen" noticeable.

Enter object pooling. Instead of creating and destroying chicken objects, you reuse them. A chicken dies? It goes back in the pool. A new chicken spawns? Grab one from the pool.

Simple concept. Took me way too long to implement correctly.

**2. Canvas Performance is a Dark Art**

I learned about:
- `requestAnimationFrame` (use it)
- Offscreen canvases (double buffering is real)
- Dirty rectangles (only redraw what changed)
- The sheer terror of debugging why your game runs at 12fps on mobile

**3. Sound Design is Underrated**

I spent *hours* tweaking chicken sounds. Too high-pitched? Sounds like a squeaky toy. Too low? Sounds like a turkey with a cold.

The final chicken sound is a masterpiece. I'm not saying I should win an award, but... actually, no, that's exactly what I'm saying.

## Chop It Like It's Hawt: The Clicker Game

After Chicken Mob, I thought: "What if I made something simpler?"

So naturally, I made an incremental clicker game about chopping vegetables.

### The Premise

You chop vegetables. That's it. That's the game.

But here's the twist: the vegetables get increasingly absurd.

- Level 1: Carrots
- Level 5: Potatoes  
- Level 10: Pumpkins
- Level 25: Watermelons
- Level 50: *A whole durian*
- Level 100: *A log cabin made of vegetables (don't ask)*

### The Mechanics

It's your standard incremental game:
- Click to chop
- Earn "chop points"
- Buy upgrades (sharper knives, faster chopping, "auto-choppers")
- Watch numbers go up
- Feel a strange sense of accomplishment

### The Art Style

I went with "deliberately terrible pixel art." Every vegetable looks like it was drawn in MS Paint by someone who's never seen a vegetable.

The carrots are orange rectangles with green lines on top. The potatoes are brown blobs. The durian looks like a spiky green ball of regret.

I love them all.

### What I Learned

**1. Big Numbers Are Satisfying**

There's something deeply satisfying about seeing "1.2M chops/sec" on screen. I don't know why. It just is.

**2. Progress Bars Are Psychological Crack**

I added a progress bar for "chopping mastery." It fills up as you chop. People (okay, me) will sit there watching that bar fill for *way* too long.

**3. Prestige Systems Are Genius**

At some point, you can "prestige" and reset everything for a permanent bonus. It's the gaming equivalent of "the journey is the destination." You know you're going to do it all again, but it'll be *slightly faster* this time.

## The Code Runner Mini-Game

The latest addition is a mini-game right here on my portfolio homepage. It's a simple runner game where you... well, you run.

Jump over obstacles. Collect coins. Try not to die.

It's deliberately simple because:
1. It runs on a portfolio site (performance matters)
2. It shouldn't distract from the actual content
3. It's surprisingly fun to play while procrastinating

## Why Make Games?

You might be wondering: "Why spend time on silly games when you could be building Serious Enterprise Software?"

Fair question. Here's my answer:

**1. Games Are Pure**

There's no "business logic" in Chicken Mob. No "stakeholder requirements." Just chickens and lanes and the eternal question: "What if?"

**2. Constraints Breed Creativity**

When you're making a game in a browser, you have constraints:
- Performance (60fps or bust)
- Bundle size (no one wants to download 50MB of chicken assets)
- Compatibility (it needs to work on phones)

These constraints force you to be creative in ways that "just use React and call an API" doesn't.

**3. It's Okay to Be Silly**

Not everything needs to be a SaaS product. Not everything needs to scale. Sometimes you just want to make chickens run in lanes because it's *fun*.

## The Technical Bits (For the Nerds)

**Stack:**
- TypeScript (because types are good, actually)
- Canvas API (for rendering)
- Web Audio API (for the chicken sounds)
- Vite (for bundling)
- No frameworks (because sometimes vanilla is better)

**Performance Tricks:**
- Object pooling for entities
- Dirty rectangle rendering
- Audio sprites (one file, multiple sounds)
- RequestAnimationFrame for the game loop
- Throttled input handling

**What I'd Do Differently:**
- Start with a game engine? Nah, where's the fun in that?
- Use WebGL for better performance? Maybe for the next one
- Write more tests? ...let's not get crazy

## What's Next?

I'm currently working on:
- A dedicated games page (coming soon!)
- Maybe a multiplayer chicken herding game? (WebRTC?)
- A roguelike about... something. I haven't decided yet.

## Final Thoughts

If you're a developer who's never made a game, I highly recommend it. Not because it'll make you money (it won't). Not because it'll look good on your resume (debatable). 

Do it because it's *fun*. Because it reminds you why you got into coding in the first place. Because watching 500 chickens run in lanes at 60fps is genuinely satisfying in a way that REST APIs never will be.

Now if you'll excuse me, I have some vegetables to chop.

---

*Want to play these games? Check out the [games page](/games) or my [GitHub](https://github.com/bigknoxy). Just don't blame me if you spend way too much time chopping virtual vegetables.*
