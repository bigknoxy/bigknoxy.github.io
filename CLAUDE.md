# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # install deps
bun run dev          # dev server (localhost:4321)
bun run build        # production build → dist/
bun run preview      # serve dist/ locally
bun run lint         # format with Prettier
bun run typecheck    # Astro type check

# After build, generate search index:
bunx pagefind --site dist --output-subdir _pagefind

# Tests
bun test                          # all unit tests
bun test tests/unit/foo.test.ts   # single unit test
npx playwright test --project=chromium  # e2e tests (requires bun run preview running)

# Game bundle (built separately from main Astro build)
bun run build:game   # outputs to dist/game/game-engine.js
```

## Architecture

**Astro static site** deployed to GitHub Pages (`bigknoxy.github.io`). Two separate build pipelines:

1. **Astro build** (`bun run build`) — generates all pages, components, styles
2. **Vite game build** (`bun run build:game`) — bundles `src/game/` as a standalone ES library (`dist/game/game-engine.js`)

### Content layer

`src/content/` uses Astro content collections:
- `blog/` — markdown posts (title, description, pubDate, tags, heroImage)
- `projects/` — markdown project entries (same + demoUrl, repoUrl, featured)

Schema defined in `src/content/config.ts`. Pages are generated via dynamic routes: `src/pages/blog/[...slug].astro` and `src/pages/projects/[slug].astro`.

### Game engine (`src/game/`)

ECS-style Canvas game. Entry: `src/game/index.js` → `GameEngine.ts`.

- `entities/` — Player, Obstacle, Collectible (extend Entity base)
- `systems/` — PhysicsSystem, RenderSystem, AudioSystem (Web Audio API)
- `utils/` — InputHandler (keyboard + touch), ObjectPool (entity reuse)
- `types/GameTypes.ts` — shared interfaces (GameState, GameEvent, etc.)

`GameEngine` runs a fixed 60 FPS loop with delta accumulator. Uses a unified `GROUND_Y` constant shared between physics and render to prevent collision/visual misalignment. Entities managed via `EntityPool` for perf.

The game is embedded via `src/components/game/MiniGame.astro`, which loads the game bundle dynamically.

### Theme

Two palettes defined in `tailwind.config.js`:
- `gameboy-*` — darkest/dark/light/lightest (green LCD tones)
- `tokyo-*` — bg/surface/border/text/accent/muted (Tokyo Night)

Fonts: `font-pixel` (Press Start 2P) for game UI, `font-mono` (JetBrains Mono) for code, `font-sans` (Outfit) for body.

### Search

Powered by `astro-pagefind`. Index must be generated post-build via `bunx pagefind`. `SearchBar.astro` provides the UI; search results link back to the production URL.

### Testing

- **Unit tests** (`tests/unit/`) — run with Bun's built-in test runner; preload `tests/test-setup.ts`
- **E2e tests** (`tests/e2e/`) — Playwright, chromium only; `baseURL` points to `https://bigknoxy.github.io` (production) unless `webServer` is active

### Deployment

GitHub Actions workflow at `.github/workflows/deploy.yml` deploys `main` → GitHub Pages. Static output only (`output: "static"` in `astro.config.mjs`).

## Style conventions

- `.astro` components, PascalCase filenames
- Tailwind classes only — no custom CSS unless unavoidable
- Use `@` alias for `src/` imports
- Astro `<Image>` component for all images (sharp optimization)
- Scan `./memory/` for relevant prior decisions before starting non-trivial tasks
