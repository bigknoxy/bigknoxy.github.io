Context ➡️ Decision ➡️ Outcome

Context:

- Mobile users reported unreliable touch controls (taps ignored, long-press opening context menu, inconsistent left/right detection).
- Root cause: Input listeners were not consistently handling touch/pointer events and passive listeners prevented preventDefault. Wiring to the engine UI sometimes reset input state incorrectly on init/reset.

Decision:

- Update InputHandler to: use pre-bound handlers, register touch/pointer listeners with passive: false, add robust fallbacks for empty touch lists, debounce programmatic triggers and auto-reset jump flag.
- Wire InputHandler lifecycle more defensibly in GameEngine/MiniGame so initialize/destroy/reset flow doesn't leave stale listeners or input state.

Key changes (files modified):

- src/game/utils/InputHandler.ts
- src/game/GameEngine.ts
- src/components/game/MiniGame.astro (wiring / lifecycle guards)

Tests added / updated (exact paths):

- tests/e2e/mobile-touch-final.spec.ts
- tests/e2e/mobile-touch.spec.ts
- tests/unit/input-handler.trigger.test.js

Verification:

- Automated: Playwright e2e (iPhone 12 emulation) and unit tests pass locally (see tests above). Run: bun test (unit) and npx playwright test --project=chromium (e2e).
- Manual: Verified on iPhone 12/Android devices — taps trigger jump, left/right zones recognized, long-press no context menu, smooth responsiveness.

Outcome:

- Mobile touch responsiveness restored across devices; input reliably maps taps to actions and no stuck-jump states observed.

Recommended follow-ups:

- Add a small MRT (mobile regression) Playwright job to CI using --project=chromium.
- Add analytics for dropped touch events to capture regressions.
- Consider virtual gamepad visual toggle for accessibility.
