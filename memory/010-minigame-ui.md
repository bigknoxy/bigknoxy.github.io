Context:

- Task 3 required integrating the existing GameEngine into an Astro component with SSR-safety, lazy-loading, accessibility, and a small runtime API.

Decision:

- Implemented src/components/game/MiniGame.astro as an SSR-friendly component that renders a placeholder on the server and runs client-only bootstrap code.
- Use dynamic import('/src/game/GameEngine') to guarantee the GameEngine is split into a separate chunk and only loaded on demand.
- Lazy-loading triggered by IntersectionObserver (when near viewport) and explicit user gesture (Start CTA) for immediate load and to satisfy Web Audio user gesture resume requirements.
- Expose programmatic API at window.miniGame and emit DOM events from the component root for external integrations.
- Accessibility: canvas gets role="application", tabindex, aria-labels; controls have aria-pressed and aria-live for score updates; keyboard and touch handlers implemented.
- Keep runtime JS minimal by writing plain ES module script inline (is:inline) to avoid bundling heavy toolchains into the initial page.

Outcome:

- Component renders safely in SSR and defers heavy code.
- GameEngine remains unchanged; integration performed via runtime glue only.
- Tests and Playwright integration added to exercise lazy-loading and a start/collect flow (integration test under tests/game.integration.spec.ts).
- Documentation updated (docs/mini-game-implementation-notes.md) to describe integration and usage.

Notes:

- Some pre-existing test files in repo contain TypeScript hints/errors unrelated to this change; test run may still show unrelated failures.
- If there are CI failures around Playwright config, ensure consistent versions of @playwright/test and playwright dependencies.
