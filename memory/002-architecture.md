Context ➡ Decision ➡ Outcome

Context:
- Project plan (docs/project_plan.md) specifies an Astro site using Bun, Tailwind, Pagefind, and a Game component (GameBoy / Tokyo Night theme).
- Memory is currently empty; we need a single-source record of architecture decisions before work begins.

Decision (final architecture choices):
- Runtime: Bun (use Bun-first toolchain and scripts)
- Output: static/site output (dist directory) suitable for GitHub Pages deployment
- Image service: sharp via Astro's image integration (server-side image optimization during build)
- Search: Pagefind integration with ui: false (we will build a custom search UI rather than using Pagefind's default UI)
- Deployment target: GitHub Pages (username.github.io) optimized for static output
- CSS: Tailwind CSS with custom theme tokens for `gameboy-*` and `tokyo-*` palettes
- Fonts: Use Google Fonts for Press Start 2P (pixel/GameBoy feel) and JetBrains Mono (code blocks and UI)
- Content collections: blog (posts) and projects (project entries) with explicit schema (title, date, tags, summary, image, slug, draft boolean)
- Build optimizations: Prefer static generation, lazy-load heavy assets, optimize images to WebP/AVIF where possible, and minimize JS bundle size

Rationale (why these choices):
- Bun: Fast install/build times and aligns with project guidelines (Bun-first). Good for local dev speed and CI builds.
- Static output (dist): GitHub Pages requires static assets; static output allows predictable deploy steps and caching.
- sharp/Astro image: Provides fast, high-quality image transforms during build and integrates with Astro Image component.
- Pagefind (ui:false): Custom UI ensures the site matches GameBoy/Tokyo Night aesthetic and keeps control over markup/UX.
- Tailwind with design tokens: Tailwind keeps styles consistent and small; tokens make theme tuning easy.
- Google Fonts: Easy to load and consistent across environments; Press Start 2P matches pixel aesthetic.
- Collections: blog + projects align with the portfolio/site content model and make content-driven pages easy.

Risks & Mitigations:
- Bun compatibility risks with certain Node-only packages: mitigate by testing in CI and pinning compatible versions or polyfills.
- Pagefind index size/performance: mitigate by limiting indexed fields, compressing the index, and evaluating search bundle size in the build.
- Image build time with sharp on CI: mitigate by caching node_modules and using CI runners with sufficient memory; consider using remote image generation only if needed.
- GitHub Pages path base issues (if site served from user.github.io vs repo.github.io/<repo>): ensure astro.config.mjs site and base path are correct and test in preview.

Developer checklist (initial implementation tasks with estimated hours):
1) Initialize repository and Bun project + package.json scripts (1.0h)
   - bun init, add scripts: dev, build, preview, lint, typecheck
2) Install dependencies (Astro, Tailwind, Pagefind, sharp, fonts, etc.) (1.0h)
3) Create src/ structure and content collections (blog, projects) (2.0h)
   - src/pages, src/components, src/layouts, src/content/collections
4) Add tailwind.config.js with theme tokens for gameboy/tokyo palettes and font families (1.5h)
5) Add astro.config.mjs with runtime/bundler config, image integration (sharp), and static output set to ./dist (1.5h)
6) Implement core layouts and components (MainLayout, Header, Footer, SEO component) (3.0h)
7) Implement OptimizedImage component that wraps Astro Image with presets for sizes/formats (2.0h)
8) Integrate Pagefind into build (generate index during build) and scaffold custom search UI (ui:false) (2.5h)
9) Create Game component skeleton and assets (canvas or WebAudio hooks) (4.0h)
10) Add SEO and canonical URL handling (read from astro.config.mjs site) (1.0h)
11) Add initial content (1-3 blog posts and 2-3 project entries) (2.0h)
12) Write basic tests and linting (1.5h)

Estimated total initial implementation time: ~23 hours (spread across team or sprints)

Notes for developers:
- Keep base URLs and canonical site value in astro.config.mjs (refer to memory/001-github-username.md for placeholder usage).
- When implementing Pagefind, set ui: false in its integration and expose a JSON index artifact in ./dist/search-index.json for the custom UI to consume.
- Use the Tailwind tokens for color utilities and document tokens in tailwind.config.js for reuse.

Saved path: /home/josh/projects/bigknoxy-gh/memory/002-architecture.md
