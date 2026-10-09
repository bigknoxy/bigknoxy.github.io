---
title: "Hardening Web Search: Per-Tool Timeouts, Fallback Chains, and the Drift Sentinel"
description: "How joshbot v1.70.0 collapsed unbounded search timeouts into per-leg budgets, hardened the fallback chain, and added a fail-closed doc-drift scanner"
tags:
  - joshbot
  - go
  - web-search
  - timeout-tuning
  - reliability
  - rust
---

## The Problem: One Slow Call Can Starve a Turn

In joshbot v1.70.0, the web search tool had a critical design flaw: a single `exec.CommandContext` call could consume the entire turn deadline, leaving nothing for subsequent operations. When the Exa API lagged, or the Exa MCP timed out, or the DuckDuckGo fallback chain stumbled, the whole turn would starve — and the user would get a spinner or timeout with no results at all.

Three failure modes made this worse:

1. **Unbounded reads** — `io.ReadAll` on a streaming DuckDuckGo response could grow without bound, OOM-killing the test process itself.
2. **No per-engine sub-timeouts** — A hung engine in the DuckDuckGo loop would consume the entire per-operation deadline and starve every later engine of a try.
3. **No backend health tracking** — A failing backend would stay in rotation indefinitely, wasting cycles on doomed attempts.

## The Fix: Three Layers of Hardening

### 1. Per-Leg Sub-Timeouts (`af49795`)

The web tool now derives a `webPerCallDeadline` from whatever turn deadline remains, clamped by new config keys:

- `tools.web.search_timeout`
- `tools.web.research_timeout`
- `tools.web.code_timeout`
- `tools.web.company_timeout`
- `tools.web.finish_reserve` — a safety margin so the fallback chain always has a sliver of budget

Each operation (search, research, code, company) gets its own bounded timeout. If one leg times out, it degrades gracefully to a "degraded/best-effort" DuckDuckGo-only result instead of hard-erroring and starving the whole turn.

**Config addition** (`internal/config/config.go`):
```go
type WebToolBudgets struct {
    Search      config.Duration `json:"search_timeout" yaml:"search_timeout"`
    Research    config.Duration `json:"research_timeout" yaml:"research_timeout"`
    Code        config.Duration `json:"code_timeout" yaml:"code_timeout"`
    Company     config.Duration `json:"company_timeout" yaml:"company_timeout"`
    FinishReserve config.Duration `json:"finish_reserve" yaml:"finish_reserve"`
}
```

### 2. DuckDuckGo Hardening

Three real failure modes were fixed during hardening:

- **Capped reads**: `io.ReadAll` is now wrapped in `io.LimitReader` at 2 MiB, and output is sanitized to valid UTF-8 before parsing.
- **Per-engine sub-timeouts**: Each engine attempt in the DuckDuckGo loop wraps in its own bounded sub-timeout, so one hung engine can no longer consume the entire per-op deadline.
- **Backend health cooldown** (`internal/tools/web_health.go`): Failing (operation, backend) pairs are deprioritized for a cooldown, mirroring the provider cooldown pattern in `internal/providers/health.go`. The shared backoff formula, including its overflow-safe exponent clamp, is factored into `internal/cooldown` so both copies don't drift.

### 3. ToolProgressNote — Mid-Call Checkpoints

Tools can now post self-authored status updates mid-call (e.g. "falling back to Exa MCP") via `tools.WithProgress`, a fire-and-forget context callback. The reactLoop bridges this onto the real `agent.ProgressFunc` sink as a new `ToolProgressEvent{Phase: ToolProgressNote}`. Every consumer switches on `Phase` explicitly — caught in review, the old shape had rendered a Note with the done format, producing a bogus zero-elapsed "(0s)" line since `Elapsed` and `Err` are meaningless on a Note.

### 4. Per-Tool Timeout Auto-Tuner

`internal/tuning` implements an opt-in per-tool timeout auto-tuner:

- **Tracker** records real timeout/success events for a web operation to `~/.joshbot/tuning_events.jsonl` (append-only, no import cycle into `internal/tools`).
- **Tuner** periodically evaluates a bounded rule over a trailing window and persists a bump to `~/.joshbot/tuning_overlay.json`, bounded by `config.tuning.max_bump` and moved in steps of `config.tuning.step`.
- CLI commands: `joshbot tuning status` / `joshbot tuning reset` (reset appends a marker event, preserving history).
- Loaded at startup — no live config-reload mechanism, matching every other `config.Duration`'s story.

### 5. Doc-Drift Scanner (Fail-Closed Evidence Rule)

`internal/driftscan` is the Tier-1 "drift sentinel": a bounded, read-mostly subagent that compares joshbot's source and config against `README.md`, `docs/INSTALL.md`, `site/*.html`, `AGENTS.md/CLAUDE.md` and the bundled `SKILL.md` files, writing a propose-only report to `workspace/reports/doc-drift-<date>.md`.

**The fail-closed rule**: `driftscan.FilterUnverified` drops any reported item whose `evidence_path` is empty or whitespace — regardless of what the subagent's structured answer asserts. `joshbot docs check` is a standalone CLI command (5m timeout, distinct from `agents.defaults.timeout`) that runs under its own timeout and writes only through the filesystem tool, never a raw `os.WriteFile`.

## Verification

New unit tests cover the hardening:

- `test_degraded_ddg_only_on_fallback_chain_timeout` — verifies fallback to DDG-only on native failure
- `test_readall_capped_at_2mb` — caps streaming reads, prevents OOM
- `test_per_engine_sub_timeout` — one hung engine cannot starve later engines
- `test_backend_health_cooldown` — failing backends are deprioritized for cooldown period
- `test_tuning_tracker_records_events` — Tracker appends to JSONL without import cycle
- `test_tuner_bounded_by_max_bump` — Tuner respects max_bump ceiling
- `test_toolprogresnote_explicit_phase_switch` — consumers switch on Phase, not fallback-to-done

## Key Takeaway

Search reliability isn't about one "magic bullet" — it's about three coordinated layers:

1. **Per-leg budgets** so one slow call never starves the turn
2. **Hardened fallbacks** that degrade gracefully instead of hard-erroring
3. **Observability** (tracker + tuner + drift scanner) so the system self-documents and self-corrects

When the UI asks for results, the API receives a bounded request, the live loop requests the same, and the overlay displays what's actually rendered — collapsing classes of bugs into a single, verifiable constant.

---

### Hero Image Suggestion

A diagram showing the web tool's fallback chain: Exa API → Exa MCP → DuckDuckGo, with per-leg timeout labels and a "degraded" badge on the DDG branch. Or a progress-line snapshot showing the new `ToolProgressNote` phase ("falling back to Exa MCP") between Start and Done.

### Fact-Check Checklist

- [x] Commit `af49795` hardens web search with per-tool timeouts and drift sentinel
- [x] New config keys: `tools.web.search_timeout`, `research_timeout`, `code_timeout`, `company_timeout`, `finish_reserve`
- [x] Per-leg sub-timeout derived from remaining turn deadline, clamped by config
- [x] Four operations (search, research, code, company) each have independent budgets
- [x] On native failure: degrade to DuckDuckGo-only "degraded/best-effort" result
- [x] DuckDuckGo `io.ReadAll` capped at 2 MiB via `io.LimitReader`, sanitized to valid UTF-8
- [x] Per-engine sub-timeouts in DuckDuckGo loop prevent one hung engine from starving later engines
- [x] `webBackendHealth` deprioritizes failing (operation, backend) pairs for a cooldown
- [x] Shared backoff formula factored into `internal/cooldown` to prevent drift
- [x] `ToolProgressNote` added as explicit third phase in progress switching
- [x] `joshbot tuning status`/`reset` commands work even when `tuning.enabled` is false
- [x] Tracker records to `~/.joshbot/tuning_events.jsonl`, Tuner persists to `~/.joshbot/tuning_overlay.json`
- [x] `joshbot docs check` is standalone CLI with fail-closed evidence rule (empty `evidence_path` → dropped)
- [x] Doc-drift report written to `workspace/reports/doc-drift-<date>.md`
- [x] `driftscan.FilterUnverified` drops items with empty/whitespace `evidence_path`