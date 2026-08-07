---
title: "Building a Trader P&L Writer for the Briefing Hub: Paper Trading, Safety, and Kalshi Integration"
description: "A technical deep dive into how we added a daily trader P&L section to the Briefing Hub, integrating paper trading audit logs with Kalshi's public API, while enforcing strict safety rules and COI blocklists."
date: 2026-08-07
tags:
  - trading
  - briefing-hub
  - python
  - kalshi
  - paper-trading
  - safety
---

## Introduction

The Briefing Hub is our household's daily digest, aggregating news, weather, schedules, and now, trading activity. In Phase 2C of the Briefing Hub's development, we added a new section: **Trader P&L**. This section provides a daily summary of paper trading activity, safety metrics, and a glance at relevant markets via Kalshi's public API.

This post walks through the technical implementation, highlighting the design decisions around safety, compliance, and integration.

## The Writer Script: `scripts/trader_writer.py`

The core of the new section is a Python script that runs daily via cron. It reads the trader's audit log, fetches market data from Kalshi (no auth required for Phase 1 endpoints), and outputs a Markdown report along with a manifest entry for the Briefing Hub's sections.json.

### Key Functions

#### 1. Reading Trading Mode
The script first determines the trading mode (paper, live, public) from the trader profile's `.env` file. This is crucial for safety messaging.

```python
def read_trading_mode() -> str:
    """Read TRADING_MODE from trader .env; default 'paper'."""
    env_path = TRADER_PROFILE_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith("TRADING_MODE="):
                return line.split("=", 1)[1].strip()
    return "paper"
```

#### 2. Loading the Audit Log
The audit log (`trades.jsonl`) is a JSONL file where each line is a trading event. We load entries from the last 7 days.

```python
def load_audit_log(days: int = 7) -> list[dict]:
    """Load recent audit log entries (filtered to `days` window)."""
    if not AUDIT_LOG.exists():
        return []
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    entries = []
    for line in AUDIT_LOG.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        try:
            ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
            if ts >= cutoff:
                entries.append(entry)
        except (KeyError, ValueError):
            continue
    return entries
```

#### 3. Fetching Markets from Kalshi
We use Kalshi's public API (no authentication) to get a list of recent markets. This is read-only and provides market titles, tickers, and bid/ask prices.

```python
def fetch_kalshi_markets() -> list[dict]:
    """Fetch recent markets from Kalshi public API (no auth, Phase 1)."""
    url = f"{KALSHI_PUBLIC_BASE}/markets?limit=50"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("markets", [])
    except (urllib.error.URLError, json.JSONDecodeError, KeyError):
        return []
```

#### 4. COI Blocklist Enforcement
To comply with conflict-of-interest policies, we filter out any markets related to blocked entities (FHLB, FHFA, Fannie Mae, Freddie Mac, GSEs). This is a defensive measure; the audit log should not contain these, but we apply the filter to the public API display as well.

```python
BLOCKLIST_KEYWORDS = [
    "fhlb", "fhfa", "federal home loan bank",
    "federal housing finance agency", "fannie mae", "freddie mac",
    "gse", "government sponsored enterprise",
]

def is_blocked(title: str, subtitle: str = "") -> bool:
    text = f"{title} {subtitle}".lower()
    return any(kw in text for kw in BLOCKLIST_KEYWORDS)
```

#### 5. Building the Report
The report is assembled in Markdown, including:
- A header with the date and trading mode badge.
- A safety & mode section showing kill switch activations, blocked orders, and real orders executed.
- A recent markets section (up to 5 non-blocked markets from Kalshi).
- An audit trail of the last 3 events from the audit log.

### Manifest Integration
After writing the Markdown file (`briefings/YYYY/MM/DD/trader.md`), the script updates the `sections.json` manifest in the same directory. It ensures the trader section is added (or updated) without overwriting other sections.

```python
manifest[\"sections\"] = [
    s for s in manifest.get(\"sections\", []) if s.get(\"id\") != \"trader\"
]
manifest[\"sections\"].append({
    \"id\": \"trader\",
    \"path\": \"trader.md\",
    \"items\": count,
    \"bytes\": len(md),
    \"tier\": \"secondary\",
})
```

## Safety and Compliance Features

1. **Paper Trading by Default**: The `TRADING_MODE` defaults to `paper`, ensuring no real capital is at risk unless explicitly changed.
2. **Live Mode Gate**: Live trading requires an explicit `/confirm-live` command (handled elsewhere in the trader skill) and is never auto-enabled by the Briefing Hub.
3. **COI Blocklist**: Any market display is checked against a blocklist of prohibited entities.
4. **Kill Switch Tracking**: The audit log tracks kill switch activations, which are reported in the safety section.
5. **Order Blocking**: Orders blocked by safety rails (e.g., COI, invalid parameters) are counted and displayed.

## Cron Integration

The writer is scheduled to run every day at 08:00 UTC via a wrapper script:

```bash
# trader_writer_wrapper.sh
#!/bin/bash
cd /root/projects/briefing-hub && python3 scripts/trader_writer.py
```

This is added to the trader's cron tab (or system timer) to ensure the briefing is generated before the household's morning routine.

## Dogfood Verification

Before merging, we ran the script manually and verified:
- The Markdown output is correctly formatted.
- The sections.json is updated without breaking other sections.
- The briefing page renders the new section correctly (vision QA confirmed).
- Safety messages appear as expected based on the trading mode.

## Fact-Check Checklist

- [ ] The script reads the correct audit log path: `~/.hermes/profiles/trader/logs/trades.jsonl`
- [ ] The Kalshi public API endpoint is correct: `https://external-api.kalshi.com/trade-api/v2/markets?limit=50`
- [ ] The COI blocklist matches the trader skill's blocklist.
- [ ] The trading mode is read from the trader profile's `.env` file.
- [ ] The script writes to `briefings/YYYY/MM/DD/trader.md` and updates `sections.json`.
- [ ] The cron schedule is set to `0 8 * * * UTC` via `trader_writer_wrapper.sh`.
- [ ] The script handles missing audit log or API errors gracefully (returns empty lists).
- [ ] The Markdown output includes all required sections: header, safety, recent markets, audit trail.
- [ ] The manifest entry for the trader section has the correct `id`, `path`, `items`, `bytes`, and `tier`.

## Conclusion

Adding the Trader P&L writer was a step toward making the Briefing Hub a truly personalized dashboard for the household. By integrating paper trading activity with public market data and enforcing strict safety measures, we've created a section that is both informative and compliant.

The implementation leverages the Briefing Hub's existing manifest system and follows the same pattern as other writers (AI News, GitHub), making it easy to maintain and extend.

*Stay tuned for future phases where we may add live trading capabilities (with explicit user confirmation) and deeper analytics.*
