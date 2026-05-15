# bigknoxy.github.io

Personal portfolio, blog, and playground — live at [bigknoxy.github.io](https://bigknoxy.github.io). Built with Astro, styled with a phosphor terminal aesthetic (dark green on near-black, CRT scanlines, pixel font), and ships a self-contained canvas game on the homepage.

## Running locally

Requires [Bun](https://bun.sh) (1.x+).

```bash
bun install
bun run dev        # dev server at localhost:4321
```

Build for production:

```bash
bun run build
bunx pagefind --site dist --output-subdir _pagefind  # generate search index
bun run preview    # serve the built site locally
```

Other useful commands:

```bash
bun run lint       # format with Prettier
bun run typecheck  # Astro type check
bun test           # unit tests (Bun test runner)
npx playwright test --project=chromium  # e2e tests (needs preview running)
```

## Architecture

Two build pipelines:

- **Astro build** (`bun run build`) — all pages, components, styles
- **Vite game build** (`bun run build:game`) — bundles `src/game/` as a standalone ES library at `dist/game/game-engine.js`

Content is managed through Astro content collections (`src/content/`):

- `blog/` — markdown posts
- `projects/` — markdown project entries with optional `demoUrl`, `repoUrl`, and `featured` flag

The canvas game (Terminal Runner) lives in `src/components/game/MiniGame.astro` and is embedded directly on the homepage. It's a 60fps ECS-style game with Web Audio — no external dependencies.

Search is powered by [pagefind](https://pagefind.app). The index is generated as a post-build step and isn't part of the Astro build itself.

## Tech stack

Bun · Astro v4 · Tailwind CSS v3 · TypeScript · pagefind · Playwright · Bun test

## Deployment

GitHub Actions deploys to GitHub Pages on every push to `main`. Workflow is at `.github/workflows/deploy.yml`.
