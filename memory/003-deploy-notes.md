Context ➡ Decision ➡ Outcome

Context:
- Deployment plan recommends deploying to a GitHub Pages repository (username.github.io) via GitHub Pages and using a GitHub Actions workflow to build and publish.
- Owner provided the Pages repository name and confirmed no third-party integrations at this time; analytics are deferred.

Decision:
- Default deployment target: GitHub Pages repository "bigknoxy.github.io" with site URL: https://bigknoxy.github.io
- Branch for publishing: main
- Build output: ./dist directory (Astro static output)
- Workflow approach: Use a GitHub Actions workflow that builds the site with Bun and publishes the ./dist output to Pages using the modern Pages actions.

Outcome (finalized deployment notes and exact steps):
1) Workflow file (example): .github/workflows/pages-deploy.yml
   - This workflow should:
     - Checkout repository
     - Install Bun (if CI runner doesn't have it) or run bun install
     - Run bun install and bun run build
     - Ensure the build outputs into ./dist
     - Option A: Use actions/upload-pages-artifact to upload ./dist and actions/deploy-pages to publish (recommended GitHub Pages modern flow)
     - Option B: Use a deploy action that pushes to gh-pages branch (if preferred)
   - Replace placeholders in the workflow: any occurrences of the repo name or site URL must be replaced with the real values before final release.

2) Site URL and astro.config.mjs
   - astro.config.mjs -> site: "https://bigknoxy.github.io"

3) Pagefind / search index
   - Pagefind should run as part of the build; ensure its output (search index JSON) is placed in ./dist (for example ./dist/search-index.json) and referenced by the custom search UI.

4) Steps to finalize deployment once assets/confirmation are available:
   - Update memory/001-github-username.md with any refined repo name or username if different from provided.
   - Replace placeholders in astro.config.mjs site and any basePath settings.
   - Update .github/workflows/pages-deploy.yml: replace repo name and site URL placeholders with the real values.
   - Update README/docs with the final site URL and any badges or links.
   - In GitHub repository settings -> Pages: verify the source (GitHub Pages) and confirm site is published to https://bigknoxy.github.io
   - If using Actions-based Pages deployment, ensure the workflow has pages:write permission and the repo settings allow GitHub Actions to manage Pages.

5) Secrets / permissions / analytics notes:
   - GITHUB_TOKEN (provided automatically) will be used by upload/deploy actions; no extra secrets required for standard Pages deployment.
   - Repository Actions permission for Pages must be enabled (Settings → Pages → Actions permissions).
   - No third-party integrations now; analytics are deferred to a future phase.
   - Instructions for enabling analytics later:
     - Add analytics provider IDs (e.g., GA_MEASUREMENT_ID, PLAUSIBLE_DOMAIN) to the environment as repository secrets or use runtime environment variables depending on provider.
     - For Google Analytics / gtag or GA4: add the measurement ID to a config file or astro.config.mjs, and inject the tracking snippet conditionally in the site layout when the ID is present.
     - For Plausible or other privacy-focused providers: add the site ID or domain in config and include the provider's script conditionally.
     - Store secrets/IDs in GitHub Actions repository secrets (Settings → Secrets → Actions) and reference them in the workflow using ${{ secrets.NAME }}. Do NOT commit keys to the repo.
     - Example (workflow):
       - name: Deploy
         env:
           GA_ID: ${{ secrets.GA_MEASUREMENT_ID }}
         run: |
           # During build, the site can read GA_ID from env and render tracking code only when present
           bun run build

6) Example workflow placeholders to replace and finalization commands:
   - Filename: .github/workflows/pages-deploy.yml
   - Replace occurrences of:
     - repo: owner/repo or username.github.io -> bigknoxy.github.io
     - site URL placeholders -> https://bigknoxy.github.io
   - Finalizing deployment (commands to run locally before creating PR):
     - bun install
     - bun run build
     - bun run preview (optional local check)
     - git add . && git commit -m "chore: set site to bigknoxy.github.io and finalize Pages config" && git push
     - Create PR to merge into main and let Actions publish via configured workflow

Notes:
- This flow targets GitHub Pages because it is simple and meets the project's static hosting needs. If later we switch to another host (Netlify, Vercel), update memory accordingly and create a migration checklist.

Saved path: /home/josh/projects/bigknoxy-gh/memory/003-deploy-notes.md
