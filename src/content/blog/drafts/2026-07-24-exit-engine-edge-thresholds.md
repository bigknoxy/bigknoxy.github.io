---
title: "The Exit Engine That Learned When to Walk Away"
description: "How jTrader's exit system evolved from a dumb timer to a dual-threshold edge detector — and why 'never guess' is the hardest design principle to follow."
pubDate: 2026-07-24
draft: true
tags: ["typescript", "trading", "risk-engineering", "fail-safe", "kalshi", "exit-strategy"]
heroImage: "/assets/images/blog/exit-engine-edge-thresholds.png"
---

# The Exit Engine That Learned When to Walk Away

*Or: How I Added Take-Profit and Stop-Loss Without Breaking the Only Thing That Worked*

Every trading system has an exit engine. Most of them are boring — "close after N hours." That's where [jTrader](https://github.com/bigknoxy/jTrader) started too. A single function, one rule, no edge awareness. It worked. It was safe. It was also leaving money on the table and nursing losers past their expiration date.

Last week, three commits changed that. Here's how the exit engine went from a timer to a dual-threshold system — and why the hardest part wasn't the math, it was making sure the new code couldn't break the old behavior.

## Phase 1: The Timer

The original `shouldForceExit` was almost comically simple:

```typescript
// Before: one rule, one reason
export type ExitReason = "time_based_close";

export function shouldForceExit(
  position: ExitCandidatePosition,
  nowIso: string,
  config: ExitEngineConfig,
): ShouldForceExitResult {
  if (!(position.contracts > 0)) return { exit: false };
  if (position.settledAt !== null) return { exit: false };

  const openedAtMs = parseIsoMs(position.openedAt);
  if (openedAtMs === null) return { exit: false };

  const nowMs = parseIsoMs(nowIso);
  if (nowMs === null) return { exit: false };

  const elapsedHours = (nowMs - openedAtMs) / 3_600_000;
  if (elapsedHours >= config.maxHoldHours) {
    return { exit: true, reason: "time_based_close" };
  }
  return { exit: false };
}
```

The entire contract fit in a sentence: *if you've held a position longer than the configured max, force-close it. If you can't confidently answer the question, don't exit.*

That second part — the fail-safe design — turned out to be the load-bearing wall.

## The Problem With Just a Timer

Time-based exits are blind. They don't know if you're up 40¢ per contract or down 40¢. They don't know if the market moved your way in the first minute and then reversed. They just count hours.

In paper trading, this manifested in two ways:

1. **Winners held too long.** A position would hit +$0.15/contract edge within an hour, then slowly bleed back toward zero as the market re-priced. The timer didn't care — it waited the full hold period.
2. **Losers held too long.** A position would immediately go negative and stay there. The timer still didn't care.

Both problems have the same fix: add edge-aware exit triggers. Take-profit for the winners, stop-loss for the losers. Obvious, right?

The non-obvious part was doing it without breaking the fail-safe contract.

## Phase 2: Edge-Threshold Exits

The new `shouldForceExit` adds two opt-in thresholds to `ExitEngineConfig`:

```typescript
export type ExitReason =
  | "time_based_close"
  | "edge_take_profit_close"
  | "edge_stop_loss_close";

export interface ExitEngineConfig {
  /** Force-close once a position has been held at least this many hours. */
  maxHoldHours: number;
  /**
   * Take-profit: force-close once unrealized edge >= this value.
   * Undefined = disabled (opt-in only).
   */
  minUnrealizedProfitToExit?: number;
  /**
   * Stop-loss: force-close once unrealized edge <= -this value.
   * Expressed as positive loss magnitude (0.05 = "close if down $0.05+").
   * Undefined = disabled (opt-in only).
   */
  maxUnrealizedLossToExit?: number;
}
```

The key design decision: **both thresholds are opt-in.** Leaving them `undefined` preserves byte-identical Phase 1 behavior. The test suite explicitly verifies this:

```typescript
it("(a) no-op / byte-identical time-based behavior when thresholds are unset (regression safety)", () => {
  // Even a large favorable or adverse price move must not trigger an exit
  // when minUnrealizedProfitToExit/maxUnrealizedLossToExit are both undefined.
  const favorable = shouldForceExit(
    pos({ avgEntryPrice: 0.3, currentClosingPrice: 0.1 }), // edge = 0.6
    NOW_WELL_WITHIN_HOLD,
    CONFIG,
  );
  expect(favorable).toEqual({ exit: false });

  const adverse = shouldForceExit(
    pos({ avgEntryPrice: 0.7, currentClosingPrice: 0.9 }), // edge = -0.6
    NOW_WELL_WITHIN_HOLD,
    CONFIG,
  );
  expect(adverse).toEqual({ exit: false });
});
```

That test is the design document in code form: undefined thresholds = no edge-based exits, period. Not even for a 60¢ adverse move.

## The Edge Calculation

The unrealized edge lives in `@jtrader/ledger`'s `PnLCalculator`, deliberately separated from the exit engine:

```typescript
export function calculateUnrealizedEdge(
  avgEntryPrice: number,
  closingPrice: number,
): number {
  const exitValue = 1 - closingPrice;
  return roundToCenticent(exitValue - avgEntryPrice);
}
```

This looks simple — and it is, once you internalize the sign convention. In Kalshi's binary options, yes + no prices sum to ~1. The `closingPrice` parameter is already the *opposite side's* taker-crossing price (what you'd actually pay to close), so your position's own exit value is `1 - closingPrice`. The edge is that exit value minus what you paid to enter.

Positive = you're in the green. Negative = you're underwater. No fees, no contract multiplier — a pure per-contract price differential, matching the `minEdge` convention the entry strategies already use.

## Fail-Safe by Construction

The `checkEdgeThreshold` function isolates the edge logic from the time-based branch's guards:

```typescript
function checkEdgeThreshold(
  position: ExitCandidatePosition,
  config: ExitEngineConfig,
): ShouldForceExitResult {
  // No thresholds configured? Skip entirely.
  if (config.minUnrealizedProfitToExit === undefined &&
      config.maxUnrealizedLossToExit === undefined) {
    return { exit: false };
  }
  // Missing or malformed prices? Never guess.
  if (!isFiniteNumber(position.avgEntryPrice)) return { exit: false };
  if (!isFiniteNumber(position.currentClosingPrice)) return { exit: false };
  if (!(position.currentClosingPrice > 0) || !(position.currentClosingPrice < 1)) {
    return { exit: false };
  }

  const edge = calculateUnrealizedEdge(position.avgEntryPrice, position.currentClosingPrice);

  if (config.minUnrealizedProfitToExit !== undefined &&
      isFiniteNumber(config.minUnrealizedProfitToExit) &&
      edge >= config.minUnrealizedProfitToExit) {
    return { exit: true, reason: "edge_take_profit_close" };
  }

  if (config.maxUnrealizedLossToExit !== undefined &&
      isFiniteNumber(config.maxUnrealizedLossToExit) &&
      edge <= -config.maxUnrealizedLossToExit) {
    return { exit: true, reason: "edge_stop_loss_close" };
  }

  return { exit: false };
}
```

Every possible path where information is incomplete returns `{ exit: false }`. Missing price? No exit. NaN entry price? No exit. Closing price outside [0,1]? No exit. The function literally cannot force an exit on incomplete data.

This mirrors the Phase 1 contract: `parseIsoMs` returning `null` for a malformed timestamp also produced `{ exit: false }`. The new code extends the same principle to a new domain.

## The Integration: Why Price Resolution Moved Up

The most subtle change was in `runExitEngineOnce`. Previously, the closing price was resolved *after* the exit decision — you only needed it to place the actual closing order. Now, it's resolved *before* `shouldForceExit` so the edge-threshold check has a live price to evaluate:

```typescript
// Resolved BEFORE shouldForceExit (not just after a time-based decision)
// so the edge-threshold check has a current mark price to evaluate for
// EVERY candidate, not only ones already flagged for time-based exit.
const price = deps.resolveClosingPrice(candidate.marketTicker, closingSide);

const decision = shouldForceExit(
  {
    ...position,
    avgEntryPrice: record.avgEntryPrice,
    currentClosingPrice: price,
  },
  deps.nowIso,
  deps.config,
);
```

If no cached quote exists (`price === undefined`), both paths fail safe: the edge-threshold check is skipped, and the existing no-price skip for time-based orders still applies.

## The Companion: Edge Decay Decomposition

The same day the exit engine shipped, a second commit added **fill quality edge-decay tracking** — decomposing "edge decayed before fill" from "edge was wrong at signal time." This is the diagnostic counterpart: the exit engine tells you *when* to close; edge decay tells you *how much of your claimed edge you lost between signal and fill*.

```typescript
// Panel Review #26 finding #2: edgeDecay = claimedGrossEdge - realizedEdge
// (how much of the claimed edge was lost between signal and fill)
let edgeDecay: number | null = null;
if (quality.claimedGrossEdge === undefined) {
  edgeDecayExcludedCount += 1;
} else if (realizedEdge !== null) {
  edgeDecay = roundTo4dp(quality.claimedGrossEdge - realizedEdge);
}
```

The same fail-safe principle applies: `edgeDecay` is `null` whenever either input is unavailable — never fabricated as zero. Exit-engine closing orders (which never claimed an edge) are excluded from the aggregate rather than distorting it.

Together, these two features form a feedback loop: the exit engine acts on edge, and edge-decay tracking diagnoses whether the strategy's claimed edges are real.

## What I Learned

1. **Opt-in is the only safe default for risk logic.** If the thresholds had defaulted to any value — even zero — the behavior change would have been invisible. `undefined` = off makes the upgrade path safe by default.

2. **Fail-safe isn't a phase, it's a contract.** The Phase 1 principle ("never exit on incomplete information") had to be extended, not replaced, when Phase 2 added new kinds of incomplete information (prices instead of timestamps). Writing the regression test first made this concrete.

3. **The `ExitReason` union type is documentation.** `time_based_close | edge_take_profit_close | edge_stop_loss_close` — every possible exit path is named, every audit log entry carries the reason, and you can grep the journal for any one of them.

4. **Edge decay fills the diagnostic gap.** An exit engine without edge-decay tracking is flying blind — you know *when* you exited, but not *how much edge you lost getting there*. The decomposition (claimed minus realized) separates adverse selection from signal miscalibration, which is actionable in a way that raw realized-edge alone isn't.

---

**Hero image suggestion:** A stylized cross-section of a Kalshi binary options order book at the moment a take-profit threshold fires — bid/ask ladder on the left, a glowing threshold line crossing the edge distribution on the right, with the "exit" arrow pointing to the close. Colors: Tokyo Night palette (deep blue background, cyan/purple accents) to match the blog theme.

## Fact-Check Checklist

- [ ] Commit `c17e59e` adds `checkEdgeThreshold` and `calculateUnrealizedEdge` — verified in git diff
- [ ] Commit `4d59629` adds `edgeDecay` decomposition and `claimedGrossEdge` tracking — verified in git diff
- [ ] `ExitReason` type expanded from `"time_based_close"` to three variants — verified in `shouldForceExit.ts` patch
- [ ] `calculateUnrealizedEdge` lives in `packages/ledger/src/PnLCalculator.ts` — verified in commit diff
- [ ] `minUnrealizedProfitToExit`/`maxUnrealizedLossToExit` are both optional (`?`) in `ExitEngineConfig` — verified in interface definition
- [ ] Regression test "(a) no-op when thresholds are unset" exists in `shouldForceExit.test.ts` — verified in test patch
- [ ] Price resolution moved before `shouldForceExit` call in `runExitEngineOnce.ts` — verified in commit diff
- [ ] Edge decay is `null` when either input is unavailable — verified in `compare.ts` patch
- [ ] `edgeDecayExcludedCount` tracks fills without `claimedGrossEdge` — verified in `compare.ts` patch
- [ ] All test files added: `shouldForceExit.test.ts` (+121), `runExitEngineOnce.test.ts` (+95), `fillCompare.test.ts` (+88), `promotionCheck.test.ts` (+45)
- [ ] No personal API keys, tokens, or credentials in code examples
- [ ] jTrader repo URL: `https://github.com/bigknoxy/jTrader` — verified via `gh repo view`
- [ ] "Panel Review #26 finding #2" references are from actual code comments — verified in diffs