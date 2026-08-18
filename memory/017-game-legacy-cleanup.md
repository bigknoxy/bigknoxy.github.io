# 017 — Remove legacy game-engine code + align tests with current game

Context ➡️ Decision ➡️ Outcome

## Context

- The homepage game was rewritten from an external Vite bundle (`/game/game-engine.js`, window.miniGame API) into a self-contained inline canvas game in `src/components/game/MiniGame.astro` (see `src/content/blog/terminal-runner-rewrite.md`).
- The legacy artifacts were never deleted: `src/game/` (GameEngine + entities/systems), `vite.game.config.js`, `public/game/game-engine.js`, the `game-engine` rollup entry in `astro.config.mjs`, `build:game` script, `src/types/minigame.d.ts`.
- The test suite pre-dated the rewrite and was broken in two silent ways:
  - `bun run test` glob `tests/unit/**/*.test.*` only matched `tests/unit/components/*` in POSIX sh, so 12 top-level unit test files (all testing the dead engine) never ran — 12 dead files shipping as "tests".
  - e2e specs for the old architecture (`mobile-touch`, `scoring`, `game.core`, `gameover-simple`) either failed or vacuously passed.

## Decision

- Delete all legacy engine code and its build config (single Astrо pipeline remains).
- Delete all tests that exercise the dead engine (12 unit files + 4 e2e specs).
- Fix the test script to a recursive directory form (`bun test tests/unit`) so future tests are always discovered.
- Rewrite `tests/e2e/search.spec.ts` against the real current behavior (Pagefind fuzzy-matches "jeet" to 3 pages; lowercase `searching...` UI text; the pagefind-404 fallback spec must route-404 before page load).
- Add `tests/e2e/terminal-runner.spec.ts`: real browser E2E for the current inline game, driven by user inputs (Space/click) and observed through the only persisted signals (`localStorage['termRunHS']`, `#tr-hiscore-display`). No test API added to production code.
- Fix real `SearchBar.astro` bug found while debugging: `loadingPagefind` was never reset on load failure, so after one failed pagefind load every subsequent search hung 10s. Also removed leftover debug console.logs and dead code (unused `escapeHtml`, no-op listener).
- Update stale docs: README architecture section, `games.astro` teaser (Code Runner → Terminal Runner), AGENTS.md.

## Outcome

- `bun run build` clean; `bun run typecheck` 0 errors; unit 65/65 (component tests); e2e 12/12 (~40s).
- The game now has real automated browser coverage (idle render, start-by-keyboard, start-by-click, death → high-score persistence, restart after game over).
