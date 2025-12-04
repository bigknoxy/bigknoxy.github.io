# GameBoy/Tokyo Night portfolio

A GameBoy-styled personal portfolio with a Tokyo Night aesthetic built with Bun + Astro.

## Tech stack

- Bun (runtime & package manager)
- Astro v4+ (framework)
- Tailwind CSS
- pagefind (static site search)
- @astrojs/rss (RSS generation)
- sharp (image processing)

## Reproduce locally

Prerequisites: install Bun (https://bun.sh). This project expects a recent Bun release (>=1.0); if you run into native build issues, upgrade Bun.

Install and run:

```
bun install
bun run dev
```

Build and generate pagefind index:

```
bun run build
# run pagefind against the built site (requires pagefind CLI available via bunx or npm)
# this example uses bunx (bundled with Bun). Output will be written into dist/_pagefind
bunx pagefind --site dist --output-subdir _pagefind
bun run preview
```

Notes on compatibility:

- Use a current Bun release to avoid native dependency issues (Bun 1.x+ recommended).
- pagefind CLI versions change output paths/flags occasionally — if the command above fails, run `bunx pagefind --help` or `bunx pagefind --version` and adapt flags accordingly.

## File overview

Root files and key directories (created by the scaffold):

- .astro/
  - astro/content.d.ts
  - astro/settings.json
  - astro/types.d.ts
- .github/workflows/deploy.yml
- .opencode/
  - agent/ (agent instructions and roles)
  - node_modules/
  - .gitignore, bun.lock, package.json (inside .opencode)
- docs/project_plan.md
- memory/
  - 001-github-username.md
  - 002-architecture.md
  - 003-deploy-notes.md
  - README.md
- public/assets/icons/.gitkeep
- public/assets/sounds/.gitkeep
- src/
  - components/
    - game/MiniGame.astro
    - layout/Footer.astro
    - layout/Header.astro
    - ui/OptimizedImage.astro
    - ui/SearchBar.astro
  - content/
    - blog/welcome.md
    - projects/jeetSocial.md
    - config.ts
  - layouts/BaseLayout.astro
  - pages/
    - blog/[...slug].astro
    - blog/index.astro
    - projects/index.astro
    - index.astro
    - rss.xml.js
  - styles/global.css
  - env.d.ts
- AGENTS.md
- astro.config.mjs
- bun.lock
- bunfig.toml
- package.json
- tailwind.config.js

(If you add files, update this section accordingly.)

## Deployment notes

- Intended GitHub Pages repo: bigknoxy.github.io
- Branch: main
- A skeleton workflow exists at `.github/workflows/deploy.yml` but repository secrets (for authentication/deployment) are not configured yet. Configure secrets (GH_TOKEN or equivalent) before enabling automated deploys.

## Next steps / TODOs

- Add sample content (more blog posts, project pages)
- Add assets (images, icons, sound effects)
- Implement MiniGame logic in src/components/game/MiniGame.astro
- Wire CI secrets for GitHub Pages deployment
- Add analytics (privacy-first options recommended)
- Optimize images (AVIF/WebP, use sharp in build pipeline)

## Verification steps

1. Install & dev server

```
bun install
bun run dev
```

Expected: dev server starts without errors and site is available at the printed local URL (usually http://localhost:3000 or a Bun-provided port).

2. Production build

```
bun run build
```

Expected: a `dist/` directory is created containing the compiled site (index.html and asset files). Build completes with exit code 0.

3. Pagefind index

```
bunx pagefind --site dist --output-subdir _pagefind
```

Expected: a `dist/_pagefind/` directory is created containing pagefind index files (search index JSON and assets). If the CLI flags differ for your pagefind version, consult `bunx pagefind --help`.

4. Preview

```
bun run preview
```

Expected: the production build is served locally. Visit the printed URL and verify the site loads and search (if wired) can access files under `_pagefind`.

## Troubleshooting

- If native modules (sharp, etc.) fail to build, ensure Bun is up to date and check the module's installation docs.
- If pagefind fails, confirm the CLI version and update flags or install a compatible release.

---

If you want, I can also add a short CONTRIBUTING or DEVELOPMENT guide and wire a minimal GitHub Actions deploy workflow (secrets still required).
