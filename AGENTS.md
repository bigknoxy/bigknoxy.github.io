# 🎮 AGENTS.md — Phosphor Terminal Portfolio

Astro + Bun + Tailwind static portfolio. Theme: phosphor-green terminal
aesthetic (Press Start 2P for pixel elements, JetBrains Mono for code).

## 🧠 Memory Protocol (do this first)

- **Read** `./memory/` before any task — it records prior decisions
  (Context ➡️ Decision ➡️ Outcome). `memory/README.md` has the index.
- **Write** a new `memory/NNN-topic.md` whenever you solve a tricky bug,
  make an architectural pivot, or lock in a tech-stack decision.

## 🚀 Commands

```bash
bun run dev          # dev server
bun run build        # production build (also generates the pagefind index)
bun run preview      # preview production build on :4321
bun run lint         # format with Prettier
bun run typecheck    # Astro type checking
bun test             # unit tests (Bun test runner, tests/unit)
bunx playwright test # e2e tests (auto-starts preview on :4321)
```

There is a single build pipeline (Astro). Do **not** reintroduce a separate
Vite/game build — the homepage game is inline (see below).

## 🎨 Theme & code style

- Tailwind classes only; custom CSS only when there's no Tailwind equivalent.
- Colors come from the `phosphor-*` theme tokens.
- Pixel text: Press Start 2P (`.font-pixel`). Body/code: JetBrains Mono.
- Components are `.astro`, PascalCase, in `src/components/`.
- Interactive elements get hover/focus states.

## 🕹️ The homepage game (Terminal Runner)

- Lives entirely in `src/components/game/MiniGame.astro` — a self-contained
  canvas game, **no external bundle, no dependencies, no Web Audio**.
- It exposes **no test API** by design. Browser tests
  (`tests/e2e/terminal-runner.spec.ts`) drive it with real inputs (Space,
  click) and assert via `localStorage['termRunHS']` and
  `#tr-hiscore-display`.
- The old external engine (`src/game/`, `vite.game.config.js`,
  `build:game`) was removed — see `memory/017-game-legacy-cleanup.md` and
  `src/content/blog/terminal-runner-rewrite.md`. Do not resurrect it.

## 📚 Documentation

Keep `README.md` in sync with the codebase: every change that affects the
public surface (commands, architecture, the game, search) must update the
README in the same change.

## ⚡ Performance rules

- Static generation; optimize images (WebP/AVIF) where possible.
- Lazy-load non-critical assets; keep the JS bundle small.
