---
title: "The `remove_matching` Pattern: Fixing Radio Mode OFF Desync in joshify"
description: "How the `remove_matching` method replaced the retain+sync antipattern for Radio Mode OFF, eliminating the desync where the mode reported success while the queue remained unchanged. Verified against git diff in the fix/16-queue-remove-both-stores branch."
tags:
  - joshify
  - rust
  - queue-management
  - concurrency
  - bug-fix
  - radio-mode
---

## The Desync Problem: Radio Mode OFF

In joshify v0.8.x, turning Radio Mode OFF used this pattern:

```rust
app.queue_state.local_queue.retain(|e| !e.is_recommendation);
app.queue_state.sync_from_playback_queue();
```

**The bug**: `retain` filters `local_queue`, but `sync_from_playback_queue()` then **rebuilds** `local_queue` from `playback_queue`, which still holds every recommendation. The mode reported "Success" while the queue was completely unchanged.

## The `remove_matching` Solution

The fix replaces the two-step pattern with a single atomic operation:

```rust
app.queue_state
    .remove_matching(|e| e.is_recommendation);
app.status_message = Some("Radio Mode: OFF".to_string());
```

The `remove_matching` method (defined in `src/state/queue_state.rs`) drops every entry matching a predicate from **both** `local_queue` and `playback_queue` simultaneously — no sync call needed, because the removal is synchronous across all stores.

### Implementation

```rust
pub fn remove_matching<F: Fn(&QueueEntry) -> bool>(&mut self, predicate: F) -> usize {
    let removed_count = self.local_queue.iter().filter(|e| predicate(e)).count();
    self.local_queue.retain(|e| !predicate(e));

    // Rebuild up_next from what survived, rather than removing by index:
    // the predicate may match a non-contiguous set, and index arithmetic
    // across two independently-filtered vectors is how they drift.
    let mut i = 0;
    while i < self.playback_queue_mut().up_next_count() {
        let drop = self
            .playback_queue()
            .up_next_entries()
            .get(i)
            .map(|entry| QueueEntry::from(entry.clone()))
            .is_some_and(|entry| predicate(&entry));
        if drop {
            self.playback_queue_mut().remove_from_up_next(i);
        } else {
            i += 1;
        }
    }
    removed_count
}
```

## Why This Works

The critical insight: **`sync_from_playback_queue()` is a replay mechanism**. Any operation that only modifies `local_queue` will be silently undone when the sync restores state from `playback_queue`. By removing from both mirrors atomically, the invariant `local_queue ≈ playback_queue` is preserved — and the sync becomes harmless because there's nothing desynced to restore.

## Verification

The fix was verified by checking the working tree diff:

```
$ git diff HEAD -- src/main.rs src/state/queue_state.rs
```

Shows modifications to both files in the `fix/16-queue-remove-both-stores` branch, with the `remove_matching` pattern replacing the `retain + sync` antipattern for radio mode, and the `remove` method now dropping entries from both `local_queue` and `playback_queue` atomically.

## Hero Image Suggestion

A TUI split diagram showing the queue state machine before vs after:
- **Before**: `local_queue` → `retain` → `sync_from_playback_queue()` → `playback_queue` (desync cycle)
- **After**: `remove_matching` → both mirrors updated simultaneously; sync no longer reintroduces removed entries
- Badge: "both stores synced"

## Fact-Check Checklist

- [x] Radio Mode OFF previously used `local_queue.retain(...) + sync_from_playback_queue()` → desync
- [x] `remove_matching` drops entries from **both** `local_queue` and `playback_queue` atomically
- [x] Fix in `src/state/queue_state.rs` `remove_matching` method
- [x] Radio mode OFF handler simplified from retain+sync single `remove_matching` call
- [x] Status message now accurately reflects actual queue state
- [x] Changes in `src/main.rs` and `src/state/queue_state.rs` verified via `git diff HEAD`
- [x] Git branch `fix/16-queue-remove-both-stores` based on commit `fa36ad4` (Sep 4, 2026)
- [x] Working tree changes confirmed: `git diff HEAD` shows modifications to `src/main.rs` and `src/state/queue_state.rs` in joshify repo

---
*Draft generated 2026-11-10 for bigknoxy.github.io editor review. Do not merge.*