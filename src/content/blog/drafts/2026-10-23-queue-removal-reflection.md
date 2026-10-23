---
title: "Lesson Learned: Removing From One Queue Is Never Enough"
description: "Why joshify's queue removal bug taught us that synchronous removal across all queue stores is essential — and how the atomic fix prevents desync between UI and playback state."
tags:
  - joshify
  - rust
  - queue-management
  - concurrency
  - bug-fix
  - lesson-learned
---

## The Desync Problem

In joshify v0.8.x, the `remove_queue_entry` function only removed entries from `local_queue`, leaving the track stuck in `playback_queue`. This created a persistent desync: the UI would report "Removed from queue" while the track continued playing from the playback buffer.

The bug manifested in two code paths:

1. **Main list removal** (`src/main.rs`): Pressing `D` removed the entry from `local_queue`, then `sync_from_playback_queue()` immediately restored every recommendation from `playback_queue` — effectively undoing the removal.

2. **Radio mode OFF** (`src/state/queue_state.rs`): `local_queue.retain(|e| !e.is_recommendation)` filtered recommendations, but `sync_from_playback_queue()` re-added them from `playback_queue`, making Radio Mode OFF appear successful while the queue remained unchanged.

## The Atomic Fix

The core insight: **removing from `local_queue` alone is insufficient** because `sync_from_playback_queue()` acts as a replay mechanism that restores everything from `playback_queue`. The fix ensures removal is synchronous across both stores.

### Code changes in `src/main.rs`:

```rust
fn remove_queue_entry(&mut self, index: usize) -> Option<QueueEntry> {
    let removed = self.queue_state.local_queue.get(index).map(|e| e.uri.clone())?;
    let removed = self.queue_state.remove(&removed);
    self.queue_selected_index = self
        .queue_selected_index
        .min(self.queue_state.local_queue.len().saturating_sub(1));
    removed
}
```

The main list handler now uses this atomic removal:

```rust
match app.remove_queue_entry(app.queue_selected_index) {
    Some(removed) => {
        app.status_message = Some(format!("Removed from queue: {}", removed.name));
    }
    None => {
        app.status_message = Some("Queue is empty".to_string());
    }
}
```

### Code changes in `src/state/queue_state.rs`:

The `remove` method now drops entries from **both** `local_queue` and `playback_queue` atomically, eliminating the need for a separate sync call that would reintroduce desync.

For radio mode, the pattern was simplified from `retain + sync` to a single `remove_matching` call:

```rust
app.queue_state
    .remove_matching(|e| e.is_recommendation);
app.status_message = Some("Radio Mode: OFF".to_string());
```

## Verification

| Scenario | Before | After |
|---|---|---|
| Main list `D` removal | UI says removed, track stays queued | UI says removed, track actually removed |
| Radio Mode OFF | "Success" but queue unchanged | Queue actually cleared of recommendations |
| Status message | May be misleading | Accurate reflection of queue state |

### Key takeaway

Queue management requires atomic operations across all state stores. A removal that only modifies one store will inevitably fall out of sync with the others — especially when replay/sync mechanisms exist that restore state from other stores. The fix isn't just about adding another `remove` call; it's about redesigning the removal logic to be consciously synchronous.

## Hero Image Suggestion

A TUI split diagram showing the queue state machine: `local_queue ↔ playback_queue` with arrows indicating the sync direction. Before: removal only affects `local_queue`, sync restores from `playback_queue`. After: removal atomically removes from both stores, and the sync no longer reintroduces removed entries. A badge could read "both stores synced".

## Fact-Check Checklist

- [x] `remove_queue_entry` previously only removed from `local_queue`, not `playback_queue`
- [x] `sync_from_playback_queue()` restores recommendations from `playback_queue` → desync
- [x] Fix drops entries from **both** `local_queue` and `playback_queue` atomically
- [x] `remove_matching(|e| e.is_recommendation)` replaces retain+sync pattern for radio mode
- [x] Status message now accurately reflects actual queue state
- [x] Changes in `src/main.rs` and `src/state/queue_state.rs`
- [x] Git log verified: commit fa36ad4 (2026-09-04) migrated to org security workflow; commit d25dd0b (2026-10-16) added draft blog post; inline code diff verified via `git diff HEAD`
- [x] Working tree changes confirmed: `git diff` shows modifications to `src/main.rs` and `src/state/queue_state.rs` in joshify repo