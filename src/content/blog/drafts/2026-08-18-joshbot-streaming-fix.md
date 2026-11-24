---
title: "Fixing JoshBot's Streaming Replies and Persistence: A Deep Dive into Timeout Handling"
description: "A detailed look at the recent fix for JoshBot's agent loop that ensures timeout and max-iteration replies are delivered correctly, even during streaming, and that session state is properly persisted after a timeout."
pubDate: 2026-08-18
heroImage: "/assets/images/blog/joshbot-streaming-fix.png"
tags: ["joshbot", "ai-agent", "streaming", "persistence", "bugfix"]
---
# Fixing JoshBot's Streaming Replies and Persistence: A Deep Dive into Timeout Handling

*Or: How Three Subtle Broke the Agent Loop (and How We Fixed Them)*

In the world of AI agent frameworks, few things are as critical as ensuring the agent's responses are reliably delivered and that its internal state remains consistent, especially under error conditions like timeouts or hitting iteration limits. Recently, while dogfooding JoshBot (our personal AI assistant), we uncovered three interconnected bugs that broke exactly these guarantees. This post walks through the diagnosis, the fix, and the lessons learned.

## The Symptoms: Where Did the Replies Go?

During a routine dogfooding session on August 15, 2026, we noticed two specific failures:

1.  **Missing Timeout/Limit Messages:** When the agent hit its maximum iteration limit (20 turns) or a tool call timed out, the system would generate a helpful reply (e.g., "I've hit my limit; try `/resume` to continue" or "This request timed out"). However, these replies were **never shown to the user** if they occurred *after* a streaming response had begun.
2.  **State Corruption After Timeout:** Following a pure timeout (where no tools were executed), subsequent operations like saving the session history or checkpointing would fail with a `context cancelled` error, leading to lost conversation history and inconsistent state.

The root cause? A combination of how replies were emitted, how context was managed, and a subtle violation of our own prompt discipline.

## Diagnosis: Tracing the Agent Loop

JoshBot's core is a ReAct (Reasoning and Acting) loop implemented in `internal/agent/agent.go`. The loop processes user messages, decides on tool use, executes tools, and streams results back to the user.

### Bug A: Reply Delivery Failure

The agent loop has two paths for generating a final reply when no more tool use is needed:
*   A **max-iteration reply** (when the loop exits after 20 iterations).
*   A **timeout reply** (when the overall process context times out).

Both paths returned a plain string. However, the rest of the system (specifically, the stream sink that handles incremental responses) determined whether an answer had been shown *only* by checking if *anything* had been streamed during the turn. If a streaming response had already occurred (e.g., from a tool call), these plain-text replies were swallowed because the system thought, "We already showed something this turn."

**The Fix:** Instead of returning plain text, these synthesized replies now **emit through the stream sink** *before* the loop function returns. This ensures they are treated as part of the turn's output and are delivered to the user, regardless of whether other streaming happened.

### Bug B: Persistence Failure After Timeout

When a timeout occurred, the agent loop exited early using the cancelled context. Crucially, **the session save step was skipped entirely** because it was part of the post-loop cleanup that assumed a successful loop run. Furthermore, even when the save *was* attempted later, it inherited the original, cancelled context, causing it to fail immediately with `context cancelled`.

**The Fix:** We introduced a new `persistenceCtx` – a fresh, short-lived (10-second) context – that is used *exclusively* for all post-loop write operations (session save, history compaction, checkpointing, etc.). This context is immune to the cancellation that ended the agent's main work. The checkpoint save, which needs to be faster, retains its own 5-second bound.

### Bug C: Prompt Discipline Violation

The final bug was more subtle: during a timeout, the agent was sometimes generating a reply *intention* (e.g., "I will now report the timeout") without actually performing the corresponding action (emitting the reply via the stream sink). This violated our core prompt principle: **"run the tools, then report; never reply with an intention instead of doing it."**

**The Fix:** We added a prompt-lint test (`TestCoreIdentityActDontAnnounce`) that enforces this discipline. The test ensures that the agent's final action in a turn is always to perform the reporting (via the stream sink), not merely to intend it.

## The Fix in Code

The changes spanned several files, but the core logic lives in `agent.go`:

```go
// Inside reactLoop, before returning from timeout/max-iteration paths:
// Emit the reply through the stream sink so it's delivered.
if err := s.streamSink(ctx, StreamChunk{Text: reply}); err != nil {
    return fmt.Errorf("failed to send stream reply: %w", err)
}
return nil // Return normally after sending the reply

// Later, for persistence:
persistenceCtx, cancelPersistence := context.WithTimeout(context.Background(), 10*time.Second)
defer cancelPersistence()
// Use persistenceCtx for session.Save(), history.Compact(), etc.
```

## Verification: Test-Driven to Confidence

We followed a test-driven approach:
1.  Wrote five failing tests first:
    *   `stream_reply_swallow_test.go`: Verifies timeout/max-iteration replies are streamed.
    *   `TestCoreIdentityActDontAnnounce`: Enforces the act-then-report discipline.
2.  Implemented the fixes.
3.  All new tests passed, and the full `internal/agent` test suite went green.

## Lessons Learned

This investigation reinforced several key principles for building reliable agent systems:

*   **Streaming State is Tricky:** The act of streaming a response changes the contract of the agent loop. Any synchronous reply mechanism must be integrated into the streaming path to avoid being lost.
*   **Context Cancellation is Viral:** A cancelled context doesn't just stop the current operation; it can poison any subsequent operation that inherits it. Critical cleanup operations (like saving state) need their own, independent context.
*   **Discipline Beats Cleverness:** Adhering to a strict "act, then report" principle, enforced by tests, prevents a whole class of bugs where the agent confuses intention with action. It makes the system's behavior predictable and auditable.
*   **Dogfooding is Essential:** These bugs only surfaced under real-world usage patterns (streaming responses followed by timeouts). There's no substitute for using your own tools extensively.

## What This Means for Users

For JoshBot users, this fix means:
*   **Reliable Feedback:** You will always see timeout or iteration-limit notices, even if the agent was in the middle of streaming a long response from a tool.
*   **Robust State:** Your conversation history, checkpoints, and learned skills are now safely persisted even after a timeout, preventing frustrating data loss.
*   **Consistent Behavior:** The agent's internal loop now adheres more strictly to its designed contract, making its behavior easier to predict and reason about.

## Looking Ahead

While these bugs were critical, they were also localized. The agent loop's overall architecture proved resilient. Moving forward, we're applying the same scrutiny to other edge cases:
*   What happens if the stream sink itself fails mid-stream?
*   How do we handle partial persistence failures (e.g., disk full) without corrupting the session?
*   Can we make the timeout values more dynamic based on the complexity of the requested task?

The journey of building a reliable AI agent is paved with these small, vital corrections. Each one makes the system not just more correct, but more trustworthy—a crucial trait when delegating increasingly complex tasks to our digital partners.

---
*Want to see the fix in action? Check out the full PR [#283](https://github.com/bigknoxy/joshbot/pull/283) on the JoshBot repository.*