---
title: "Aligning Search Result Counts: One Constant to Rule Them All"
description: "How joshify fixed inconsistent search result counts across the API, live search loop, and TUI overlay — by collapsing three magic numbers into a single constant."
tags:
  - joshify
  - rust
  - spotify
  - tui
  - search
---

## The Problem: Three Disagreeing Numbers

During a recent code review of joshify's search feature, three different numbers were silently disagreeing about how many search results to show:

1. **The live search loop** requested 15 tracks
2. **`SpotifyClient::search`** silently clamped that to 10
3. **The TUI overlay** rendered up to 15 rows, then built its `... and N more` line by subtracting a hardcoded 10

The result? A 20-result page would render 15 rows and claim "and 10 more" — when only 5 were actually hidden. Three magic numbers creating confusion and bugs.

## The Fix: A Single Source of Truth

The fix collapsed all three numbers onto one constant: `SPOTIFY_SEARCH_TRACKS_MAX_LIMIT`.

### Code changes across 4 files:

**`src/api/library.rs`** — Added the constant and used it everywhere:

```rust
/// Largest `limit` Joshify sends for a track search.
/// The search overlay asks for a page of results and shows them inline, so this
/// is the page size the UI is built around rather than a hard API ceiling. It
/// is the single source of truth: the overlay renders
/// `SEARCH_VISIBLE_ROWS` rows and the live search loop requests this many, so
/// the two cannot drift apart again.
pub const SPOTIFY_SEARCH_TRACKS_MAX_LIMIT: u32 = 10;
```

Then updated all three call sites to use `SPOTIFY_SEARCH_TRACKS_MAX_LIMIT` instead of inline `15` or `10`.

**`src/ui/overlays.rs`** — Rewrote the overlay to:

- Render `SEARCH_VISIBLE_ROWS` rows (aliased to the constant)
- Compute hidden count from rows actually rendered using `saturating_sub`:
  ```rust
  pub fn hidden_result_count(total: usize) -> usize {
      total.saturating_sub(SEARCH_VISIBLE_ROWS)
  }
  ```
- Updated the `... and N more` line to use `hidden_result_count()` instead of hardcoded `10`

## Verification

Three new unit tests confirm the alignment:

- `test_visible_rows_matches_the_api_page_limit` — overlay must not promise more rows than the API page limit
- `test_hidden_count_is_zero_when_everything_fits` — no hidden results when total fits in visible rows
- `test_hidden_count_subtracts_the_rows_actually_rendered` — verifies the old buggy behavior (hardcoded 10 while rendering 15 would claim "and 10 more" on a 20-result page, whereas the new code correctly reports "and 10 more")
- `test_hidden_count_never_underflows` — safeguard against underflow

## Key Takeaway

Don't let magic numbers drift. When the UI asks for X, the API receives X, and the overlay displays X, collapsing them into a single constant eliminates entire classes of bugs — and the `saturating_sub` pattern ensures the "N more" line is always mathematically consistent with what's actually rendered.

### Hero Image Suggestion

A TUI screenshot showing the search overlay with results inline, labeled to highlight the consistent result count — or an abstract diagram of three converging arrows labeled "API," "Live Loop," and "Overlay" meeting at one number.

### Fact-Check Checklist

- [x] Commit `e853e4e` aligns search result counts across API, live search, and overlay
- [x] New constant `SPOTIFY_SEARCH_TRACKS_MAX_LIMIT = 10` defined in `src/api/library.rs`
- [x] All three call sites updated to use the constant
- [x] `hidden_result_count()` uses `saturating_sub` to prevent underflow
- [x] Three new unit tests verify the alignment
- [x] Overlay renders `SEARCH_VISIBLE_ROWS` rows (equal to the constant)
- [x] `... and N more` line derives N from actually rendered rows, not hardcoded values