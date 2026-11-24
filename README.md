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
bunx playwright test                    # e2e tests (auto-starts preview on :4321)
```

## Architecture

Everything is built by Astro (`bun run build`): pages, components, styles, and the pagefind search index — no separate build step.

Content is managed through Astro content collections (`src/content/`):

- `blog/` — markdown posts
- `projects/` — markdown project entries with optional `demoUrl`, `repoUrl`, and `featured` flag

The canvas game (Terminal Runner) lives in `src/components/game/MiniGame.astro` and is embedded directly on the homepage. It's a self-contained 60fps canvas loop — no external bundle, no dependencies.

Search is powered by [pagefind](https://pagefind.app); the index is generated during the Astro build via the `astro-pagefind` integration.

## Tech stack

Bun · Astro v4 · Tailwind CSS v3 · TypeScript · pagefind · Playwright · Bun test

## Deployment

GitHub Actions deploys to GitHub Pages on every push to `main`. Workflow is at `.github/workflows/deploy.yml`.
