### Mobile touch responsiveness fix

Changelog:

- Fixed touch/pointer listener wiring and passive listener issues.
- Added defensive fallbacks for empty touch lists and debounced programmatic triggers.
- Ensured input handler lifecycle (initialize/destroy/reset) avoids stale state.

Files changed:

- src/game/utils/InputHandler.ts
- src/game/GameEngine.ts
- src/components/game/MiniGame.astro

Manual test steps (reproduce on a phone):

1. Start dev server: bun run dev and open the site on a mobile device (or use browser device emulation).
2. Navigate to the page with the mini-game and tap Start.
3. Tap center to jump — should trigger immediately.
4. Tap left 30% of screen to move left; tap right 30% to move right.
5. Long-press canvas: context menu should not appear and input must remain responsive.
6. Verify pause (P) and resume via UI buttons.

Commands (tests & build):

- Run unit tests: bun test
- Run e2e (Playwright Chromium project): npx playwright test --project=chromium (also available via npm script: bun test:e2e)
- Build production site: bun run build

Relevant tests & files:

- tests/unit/input-handler.trigger.test.js
- tests/e2e/mobile-touch.spec.ts
- tests/e2e/mobile-touch-final.spec.ts
- Implementation: src/game/utils/InputHandler.ts, src/game/GameEngine.ts, src/components/game/MiniGame.astro

Notes:

- CI should include the Playwright mobile emulation job to prevent regressions.
- See mobile-touch-test-results.md for manual device verification notes.
