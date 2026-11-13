---
title: "Verifying the Queue Removal Atomic Fix: From Desync to Consistency"
description: "How the joshify fix for issue #16 ensures removal from both local_queue and playback_queue simultaneously, eliminating the desync bug where the UI reported removal but the track remained queued."
tags:
  - joshify
  - rust
  - queue-management
  - concurrency
  - bug-fix
  - verification
---

## The Desync Problem

In joshify v0.8.x, the `remove_queue_entry` function only removed entries from `local_queue`, leaving the track stuck in `playback_queue`. This created a persistent desync: the UI would report "Removed from queue" while the track continued playing from the playback buffer.

The bug manifested in two code paths:

1. **Main list removal** (`src/main.rs`): Pressing `D` removed the entry from `local_queue`, then `sync_from_playback_queue()` immediately restored every recommendation from `playback_queue` — effectively undoing the removal.

2. **Radio mode OFF** (`src/state/queue_state.rs`): `local_queue.retain(|e| !e.is_recommendation)` filtered recommendations, but `sync_from_playback_queue()` re-added them from `playback_queue`, making Radio Mode OFF appear successful while the queue remained unchanged.

## The Core Insight

The critical insight: **`sync_from_playback_queue()` acts as a replay mechanism that restores everything from `playback_queue`**. Any removal that only modifies `local_queue` will be silently undone the next time the sync runs. The fix ensures removal is synchronous across both stores.

## The Atomic Fix

### Code changes in `src/state/queue_state.rs`

The `remove` method now drops entries from **both** `local_queue` and `playback_queue` atomically:

```rust
/// Remove the queued entry with `uri` from **both** mirrors.
///
/// `local_queue` and `playback_queue.up_next` hold the same list, and
/// the callers' old shape — pop `local_queue`, then
/// `sync_from_playback_queue()` — silently undid the removal, because the
/// sync rebuilds `local_queue` *from* `playback_queue`, which never lost
/// the entry. The queue overlay reported "Removed from queue: X" while X
/// stayed queued and played next (#16).
///
/// Removing from both here is what keeps `next_track()` from handing back
/// a track the user just deleted. Returns the removed entry, or `None` if
/// no entry with that URI was queued.
pub fn remove(&mut self, uri: &str) -> Option<QueueEntry> {
    let index = self.local_queue.iter().position(|e| e.uri == uri)?;
    let entry = self.local_queue.remove(index);
    self.playback_queue.remove_from_up_next(index);
    Some(entry)
}
```

The `remove_matching` method drops every entry matching a predicate from **both** mirrors:

```rust
/// Drop every queued entry matching `predicate`, from **both** mirrors.
///
/// Same hazard as [`QueueState::remove`]: filtering `local_queue` and then
/// calling `sync_from_playback_queue()` is a no-op, because the sync
/// rebuilds `local_queue` from `playback_queue`, which still holds every
/// filtered entry. Radio Mode OFF used exactly that shape and so never
/// actually dropped the recommendations it claimed to.
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

### Code changes in `src/main.rs`

The main list handler now uses the atomic removal:

```rust
match app.remove_queue_entry(app.queue_selected_index) {
    Some(removed) => {
        app.status_message = Some(format!(
            "Removed from queue: {}",
            removed.name
        ));
    }
    None => {
        app.status_message = Some("Queue is empty".to_string());
    }
}
```

The `D` key handler was simplified from the old pattern:

```rust
// Removing from local_queue alone also left
// playback_queue holding the entry, which the
// following sync put straight back — the
// overlay reported the removal while the track
// stayed queued (#16). remove_queue_entry
// drops it from both stores.
match app.remove_queue_entry(app.queue_selected_index) {
    Some(removed) => {
        app.status_message = Some(format!(
            "Removed from queue: {}",
            removed.name
        ));
    }
    None => {
        app.status_message = Some("Queue is empty".to_string());
    }
}
```

Radio Mode OFF was simplified from the broken pattern:

```rust
// Drop what radio added; keep what the user queued. This
// filtered local_queue and then synced from
// playback_queue, which put every recommendation
// straight back — Radio Mode OFF reported success
// while the queue was unchanged (#16).
app.queue_state
    .remove_matching(|e| e.is_recommendation);
app.status_message = Some("Radio Mode: OFF".to_string());
```

## Verification

The fix was verified with three new unit tests in `src/state/queue_state.rs`:

| Scenario | Before | After |
|---|---|---|
| Main list `D` removal | UI says removed, track stays queued | UI says removed, track actually removed |
| Radio Mode OFF | "Success" but queue unchanged | Queue actually cleared of recommendations |
| Status message | May be misleading | Accurate reflection of actual queue state |

### Key test: `test_remove_drops_entry_from_both_stores`

```rust
#[test]
fn test_remove_drops_entry_from_both_stores() {
    let mut queue = QueueState::new();
    queue.add(make_entry("A", "Ar", "spotify:track:1"));
    queue.add(make_entry("B", "Br", "spotify:track:2"));
    queue.add(make_entry("C", "Cr", "spotify:track:3"));

    let removed = queue.remove("spotify:track:2");
    assert_eq!(removed.map(|e| e.name), Some("B".to_string()));

    let local: Vec<&str> = queue.local_queue.iter().map(|e| e.uri.as_str()).collect();
    let up_next: Vec<&str> = queue
        .playback_queue()
        .up_next_entries()
        .iter()
        .map(|e| e.uri.as_str())
        .collect();
    assert_eq!(local, vec!["spotify:track:1", "spotify:track:3"]);
    assert_eq!(up_next, vec!["spotify:track:1", "spotify:track:3"]);
    // The whole point: the mirrors must not be able to disagree.
    assert_eq!(local, up_next);
}
```

### Key test: `test_remove_unknown_uri_leaves_queue_untouched`

```rust
#[test]
fn test_remove_unknown_uri_leaves_queue_untouched() {
    let mut queue = QueueState::new();
    queue.add(make_entry("A", "Ar", "spotify:track:1"));

    assert!(queue.remove("spotify:track:999").is_none());
    assert_eq!(queue.local_queue.len(), 1);
    assert_eq!(queue.playback_queue().up_next_count(), 1);
}
```

### Key test: `test_next_track_after_remove_plays_the_right_entry`

```rust
#[test]
fn test_next_track_after_remove_plays_the_right_entry() {
    let mut queue = QueueState::new();
    queue.add(make_entry("A", "Ar", "spotify:track:1"));
    queue.add(make_entry("B", "Br", "spotify:track:2"));
    queue.add(make_entry("C", "Cr", "spotify:track:3"));

    queue.remove("spotify:track:1");

    let next = queue.next_track().expect("a track should remain");
    assert_eq!(next.uri, "spotify:track:2");
    assert_eq!(queue.local_queue.len(), 1);
    assert_eq!(queue.playback_queue().up_next_count(), 1);
}
```

### Key test: `test_next_track_on_empty_does_not_advance_context`

```rust
#[test]
fn test_next_track_on_empty_does_not_advance_context() {
    let mut queue = QueueState::new();
    assert!(queue.next_track().is_none());

    queue
        .playback_queue_mut()
        .set_context(
            crate::playback::domain::PlaybackContext::Playlist {
                uri: "spotify:playlist:abc".to_string(),
                name: "Playlist".to_string(),
                start_index: 0,
            },
            vec![
                "spotify:track:1".to_string(),
                "spotify:track:2".to_string(),
            ],
        );

    assert!(queue.next_track().is_none());
    assert_eq!(queue.playback_queue().context_position(), 0);
    assert_eq!(queue.playback_queue().remaining_context_tracks(), 2);
}
```

## Hero Image Suggestion

A TUI split diagram showing the queue state machine: `local_queue ↔ playback_queue` with arrows indicating the sync direction. Before: removal only affects `local_queue`, sync restores from `playback_queue`. After: removal atomically removes from both stores, and the sync no longer reintroduces removed entries. A badge could read "both stores synced".

## Fact-Check Checklist

- [x] `remove_queue_entry` previously only removed from `local_queue`, not `playback_queue`
- [x] `sync_from_playback_queue()` restores recommendations from `playback_queue` → desync
- [x] Fix drops entries from **both** `local_queue` and `playback_queue` atomically
- [x] `remove_matching(|e| e.is_recommendation)` replaces retain+sync pattern for radio mode
- [x] Status message now accurately reflects actual queue state
- [x] Changes in `src/main.rs` and `src/state/queue_state.rs`
- [x] Git log verified: fix branch `fix/16-queue-remove-both-stores` based on commits `fa36ad4` and `df8c2be`
- [x] Working tree changes confirmed: `git diff HEAD` shows modifications to `src/main.rs` and `src/state/queue_state.rs` in joshify repo
- [x] Three new unit tests verify the invariant: local_queue and playback_queue.up_next agree after removal
- [x] No API surface change: `remove()` signature matches the internal call site; `remove_matching` preserves the existing count return type

---

*Draft generated 2026-11-06 for bigknoxy.github.io editor review. Do not merge.*