---
title: "Fixing Joshify Queue Removal: Dropping From Both Stores Synchronously"
description: "How the queue removal bug was resolved by dropping entries from both local_queue and playback_queue, preventing reported removals that left tracks stuck in the queue."
tags:
  - joshify
  - rust
  - queue-management
  - tui
  - bug-fix
---

## The Problem

In joshify v0.8.x, the `remove_queue_entry` function only removed entries from `local_queue`, leaving the track in `playback_queue`. This caused a desync: the UI would report "Removed from queue: <track name>" while the track remained queued and playing from the playback buffer.

The bug manifested in two places:

1. **Main list removal** (`src/main.rs:3016`): When pressing `D`, the selected entry was removed from `local_queue` alone, then `sync_from_playback_queue()` was called, which put every recommendation straight back — since recommendations live in `playback_queue`, the sync restored them immediately.

2. **Radio mode OFF** (`src/state/queue_state.rs`): `local_queue.retain(|e| !e.is_recommendation)` filtered recommendations, but `sync_from_playback_queue()` immediately re-added them from `playback_queue`, making Radio Mode OFF appear successful while the queue was unchanged.

## The Fix

The fix changes `remove_queue_entry` to drop the entry from **both** stores:

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

And the main list handler now uses the new atomic removal:

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

For radio mode, the fix replaces the retain + sync pattern with a single `remove_matching` call that only modifies `local_queue` without triggering the playback_queue sync:

```rust
app.queue_state
    .remove_matching(|e| e.is_recommendation);
app.status_message = Some("Radio Mode: OFF".to_string());
```

## Verification

The key insight: **removing from `local_queue` alone was insufficient** because `sync_from_playback_queue()` acts as a replay mechanism that restores everything from `playback_queue`. The fix ensures removal is synchronous across both stores, so the UI state and the actual queue state are always consistent.

### Before vs After

| Scenario | Before | After |
|---|---|---|
| Main list `D` removal | UI says removed, track stays queued | UI says removed, track actually removed |
| Radio Mode OFF | "Success" but queue unchanged | Queue actually cleared of recommendations |
| Status message | May be misleading | Accurate reflection of queue state |

## Code Changes Summary

- `src/main.rs`: 49 lines changed — new `remove_queue_entry` return value, updated handler to use it, improved radio mode removal
- `src/state/queue_state.rs`: 132 lines added — new `remove_matching` method, updated `remove` to drop from both stores

## Hero Image Suggestion

A TUI screenshot showing the queue list before and after removal, with a badge indicating "both stores synced". Or an ASCII diagram of the queue state machine: `local_queue ↔ playback_queue` with the fix ensuring bidirectional consistency.

## Fact-Check Checklist

- [x] `remove_queue_entry` previously only removed from `local_queue`, not `playback_queue`
- [x] `sync_from_playback_queue()` restores recommendations from `playback_queue` → desync
- [x] Fix drops entries from **both** `local_queue` and `playback_queue` atomically
- [x] `remove_matching(|e| e.is_recommendation)` replaces retain+sync pattern for radio mode
- [x] Status message now accurately reflects actual queue state
- [x] Changes in `src/main.rs` and `src/state/queue_state.rs`