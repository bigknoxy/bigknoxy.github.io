---
title: "Building AI Assistants in Languages I Barely Knew"
description: "How I learned Go and Rust by building personal AI tools, made a lot of mistakes, and somehow ended up with working software."
pubDate: 2026-07-08
heroImage: "/assets/images/blog/ai-assistants.png"
tags: ["go", "rust", "ai", "learning", "joshbot", "joshify"]
---

# Building AI Assistants in Languages I Barely Knew

*Or: How I Learned to Stop Worrying and Love the Compiler Errors*

So here's the thing: I'm primarily a C#/.NET developer. Have been for years. It's comfortable. It's familiar. It's like that old hoodie you can't throw away.

But I kept hearing about these other languages. Go. Rust. People on the internet wouldn't shut up about them. "Memory safety!" "Concurrency!" "Zero-cost abstractions!"

I figured the best way to learn was to build something real. Something I'd actually use. And because I'm apparently incapable of doing anything the easy way, I decided to build AI assistants.

In both languages.

At the same time.

*This is the story of how that went.*

## joshbot: My Go Experiment

### The Idea

I wanted a personal AI assistant that:
- Lives in my terminal
- Remembers things about me
- Can help with coding tasks
- Doesn't send my data to random cloud services

Go seemed like a good fit. Fast, simple, great for CLI tools. Plus, I heard the error handling was... character-building.

### Day 1: "Hello, World!" But Make It Chat

I started with the basics. Can I make a Go program that talks to an LLM API?

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    fmt.Println("Hello, joshbot!")
    // TODO: Make it actually do AI things
}
```

Spoiler: It took me way longer than I'd like to admit to get HTTP requests working. Go's HTTP client is powerful but... verbose.

### Week 1: The Learning Curve

**What I Learned About Go:**

**1. Error Handling is Explicit (And That's Good, Actually)**

In C#, I'd write:
```csharp
var result = await GetDataAsync();
// If it throws, catch it somewhere
```

In Go:
```go
result, err := getData()
if err != nil {
    return fmt.Errorf("failed to get data: %w", err)
}
```

At first, I hated it. So much repetition! But then I realized: I was actually handling errors. Not just hoping they wouldn't happen. Actually thinking about failure cases.

**2. Goroutines Are Magic (Until They're Not)**

Go makes concurrency easy. *Too* easy.

```go
go func() {
    // This runs in the background!
    doSomething()
}()
```

I got so excited about goroutines that I accidentally created 500 of them. My laptop fan sounded like a jet engine.

**3. The Standard Library is Incredible**

Need HTTP? Built-in. Need JSON? Built-in. Need a web server? Built-in.

Coming from .NET where I'd NuGet-package everything, this was refreshing.

### The "I Have No Idea What I'm Doing" Moments

**The Time I Forgot to Close HTTP Responses**

I was leaking connections like a sieve. Every API call opened a new connection that never closed. Eventually, the OS ran out of file descriptors.

The fix? One line:
```go
defer resp.Body.Close()
```

I now type `defer resp.Body.Close()` in my sleep.

**The Time I Tried to Be Clever with Channels**

I thought: "I'll use channels for everything! It's the Go way!"

I ended up with a deadlock that took me three hours to debug. Turns out, channels are great, but you need to understand buffering and blocking.

**The Time I Misunderstood Interfaces**

Go interfaces are implicit. If a type has the methods, it implements the interface. No `implements` keyword needed.

I spent an hour trying to figure out why my struct wasn't implementing my interface. Turns out I had a typo in one method name.

### What Actually Worked

After all the struggles, joshbot actually became useful:

- **Self-learning memory**: It remembers things I tell it
- **Context-aware**: It knows about my projects, my preferences
- **Terminal-native**: Lives where I already am
- **Privacy-first**: Local storage, no cloud dependencies

The code is... not pretty. But it works. And I learned Go.

## joshify: My Rust Experiment

### The Idea

After Go, I thought: "How hard could Rust be?"

*Famous last words, part 2.*

I wanted a terminal Spotify client. Something beautiful. Something fast. Something that wouldn't make me open the Spotify app just to skip a track.

### Day 1: The Borrow Checker Says No

I tried to write Rust like I wrote Go. The borrow checker had other plans.

```rust
let data = get_data();
process_data(&data);
// Can't use data here anymore!
// The borrow checker has spoken.
```

**The Learning Curve (Cliff):**

**1. Ownership is Real**

In Rust, every value has an owner. When the owner goes out of scope, the value is dropped. No garbage collector. No reference counting (unless you want it).

At first, I fought it. "Just let me use the variable!" 

Then I realized: the compiler was preventing bugs. Race conditions? Impossible. Use-after-free? Impossible. Double-free? Impossible.

**2. The Compiler is Your Friend (A Strict One)**

Rust's error messages are actually helpful:

```
error[E0382]: borrow of moved value: `data`
  --> src/main.rs:15:14
   |
14 |     let data = get_data();
   |         ---- move occurs because `data` has type `String`, 
   |                which does not implement the `Copy` trait
15 |     process_data(&data);
   |                ^^^^^ value borrowed here after move
```

It tells you *why* and *how to fix it*. After a while, you start writing code that compiles on the first try.

**3. Pattern Matching is Addictive**

```rust
match result {
    Ok(data) => process(data),
    Err(Error::NotFound) => println!("Not found!"),
    Err(e) => println!("Error: {}", e),
}
```

It's like a switch statement but... better. Exhaustive checking means you can't forget a case.

### The "I Have No Idea What I'm Doing" Moments (Rust Edition)

**The Time I Tried to Share State Between Threads**

I wanted multiple threads to access shared state. In Go, I'd use channels. In Rust...

```rust
let data = Arc::new(Mutex::new(Vec::new()));
// Arc for shared ownership
// Mutex for exclusive access
// This is... a lot.
```

I spent a day just understanding `Arc<Mutex<T>>`. But when it worked, it was *bulletproof*. No data races. No deadlocks (if you're careful).

**The Time I Fought the Async Runtime**

Rust's async is powerful but complex. You need an executor. You need to choose between `tokio` and `async-std`. You need to understand `Pin` and `Unpin`.

I picked `tokio` because it seemed popular. It took me a week to understand why my async functions weren't running.

**The Time I Misunderstood Lifetimes**

```rust
fn process<'a>(data: &'a str) -> &'a str {
    // What does 'a mean? 
    // Where am I? 
    // What year is it?
}
```

Lifetimes are Rust's way of tracking how long references are valid. They're confusing at first. Then they're obvious. Then you can't imagine programming without them.

### What Actually Worked

joshify became my daily driver:

- **Beautiful TUI**: Built with `ratatui`, it's actually pleasant to look at
- **Fast**: Starts instantly, responds instantly
- **Feature-complete**: Play, pause, skip, search, playlists
- **Resource-light**: Uses barely any CPU or memory

The code is... actually pretty good? Rust forces you to write correct code. After the initial pain, everything just works.

## Comparing the Journeys

| Aspect | Go (joshbot) | Rust (joshify) |
|--------|--------------|----------------|
| Learning curve | Steep | Cliff |
| Time to "it works" | 2 weeks | 4 weeks |
| Time to "it's good" | 1 month | 2 months |
| Runtime bugs | Few | Almost none |
| Compile-time frustration | Moderate | High |
| Pride in final product | High | Very high |

## What I Learned About Learning

**1. Build Real Things, Not Tutorials**

I tried tutorials for both languages. They were fine. But I didn't *learn* until I was trying to solve real problems.

"How do I make an HTTP request?" is different from "How do I build a Spotify client that handles token refresh, rate limiting, and network errors gracefully?"

**2. Embrace the Struggle**

The first week with Rust was brutal. Everything I wrote was wrong. The compiler was constantly yelling at me.

But each error taught me something. And slowly, the errors became less frequent. And then they became rare. And then I was writing code that just worked.

**3. It's Okay to Write Bad Code**

joshbot has some *ugly* code. Global state. Long functions. Weird abstractions.

But it works. And I learned from it. And the next project was better.

**4. Community Matters**

Both Go and Rust have amazing communities. When I was stuck, I'd:
- Read the official docs
- Search Stack Overflow
- Ask in Discord
- Read other people's code

Never underestimate the value of `cargo add some-crate` and having a working solution in 5 minutes.

## The Proud Wins

**joshbot can now:**
- Remember things I tell it (locally stored)
- Help me debug code (it knows my tech stack)
- Set reminders and timers
- Search my notes
- Integrate with my other tools

**joshify can now:**
- Control Spotify playback
- Show beautiful album art in the terminal
- Search songs, albums, artists
- Manage playlists
- Display lyrics (when available)
- Use less memory than the official Spotify app

## The Ugly Code

I'm not going to pretend these are examples of perfect Go or Rust. They're not.

joshbot has:
- A 500-line main function (I know, I know)
- Global configuration (it seemed like a good idea at the time)
- Error handling that's... inconsistent

joshify has:
- Lifetime annotations that I'm not 100% sure about
- A UI state machine that's grown... complex
- Async code that probably could be cleaner

But they work. And I use them every day. And I learned two new languages.

## Would I Do It Again?

Absolutely.

Learning Go and Rust by building real projects was one of the best decisions I've made. It was painful. It was frustrating. It was occasionally rage-inducing.

But it was also incredibly rewarding. I now have two working tools I use daily. I can read and write Go and Rust with confidence. I understand concepts (concurrency, memory management, type systems) that I only vaguely understood before.

And I have a new appreciation for C#'s garbage collector. Never leave me, GC.

## Advice for Future Me (And You)

If you're thinking about learning a new language:

1. **Build something you'd actually use**
2. **Expect to be frustrated**
3. **Read error messages carefully**
4. **Ask for help**
5. **It's okay if your first attempt is messy**
6. **Keep going**

The struggle is the learning. The frustration is the growth. The working software at the end is the reward.

Now if you'll excuse me, I have a Rust program to optimize. I think I can get the memory usage down another 2MB...

---

*Want to see the code? It's open source:*
- [joshbot (Go)](https://github.com/bigknoxy/joshbot)
- [joshify (Rust)](https://github.com/bigknoxy/joshify)

*Fair warning: The code is a snapshot of my learning journey. It's not perfect. But it works, and I'm proud of it.*
