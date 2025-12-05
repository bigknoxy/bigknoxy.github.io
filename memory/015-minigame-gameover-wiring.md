Context:

- MiniGame.astro had a DOM-based Game Over overlay but wasn't wired to GameEngine events.
- Window.miniGame API exists once engine is loaded; component dispatches 'game:gameover' etc from root.

Decision:

- Implement lightweight client-side wiring inside MiniGame.astro (client script) to listen for 'game:gameover', 'game:reset', 'game:start' events on both root and document.
- Show/hide DOM overlay (#game-over-overlay), update #gameover-score with padded 4-digit final score, manage aria-hidden, focus restart button, return focus to canvas on hide, and dispatch 'ui:gameover-shown' analytics-safe event from root.
- Restart button calls window.miniGame.reset() then window.miniGame.start(), with a pending queue if window.miniGame not yet available.

Outcome:

- Overlay is accessible (role=dialog, aria-modal) and keyboard-friendly (Enter/Space triggers restart, Escape closes overlay and resets engine).
- HUD resets to 0000 on reset/start.
- Tests added to validate integration.
