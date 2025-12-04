Context ➡ Decision ➡ Outcome

Context:
- Project plan requires the GitHub Pages repository name and site URL for deployment and canonical URLs.
- Owner has provided the Pages repository name and site URL for this project.

Decision:
- Use the GitHub Pages repository name: "bigknoxy.github.io" as the canonical Pages repo.
- Set canonical site URL to: https://bigknoxy.github.io

Where to replace the repo/site values (exact places to check and update):
1) astro.config.mjs
   - site property (e.g. site: "https://bigknoxy.github.io")
2) GitHub Actions workflow(s)
   - Any workflow referencing the repo name, site URL, or using the username in deployment steps. Example workflow file: .github/workflows/pages-deploy.yml
3) Documentation and README
   - Any canonical URLs, examples, or badges that reference the Pages domain.
4) Any scripts or config that form absolute URLs
   - Sitemaps, robots.txt generation, meta tags, or CI scripts that construct full URLs
5) Pages settings / CNAME (if used)
   - If a custom domain is later added, update references accordingly.

Outcome:
- Current canonical Pages repo: "bigknoxy.github.io"
- Current site URL: https://bigknoxy.github.io
- No branding assets provided yet; placeholders (initials SVG, placeholder images) will be used until owner supplies files.

TODO (Owner action):
1. If you want a different Pages repo name, provide it now; otherwise no action is required for the repo name.
2. Provide branding assets (logo, avatar, favicons, images) if available; otherwise placeholders will remain.
3. After any change, update astro.config.mjs (site property) and replace workflow placeholders in .github/workflows/pages-deploy.yml, then open a small PR to finalize.
4. Verify deployment and canonical links after merging the PR.

Notes:
- Using the provided Pages repo and site URL ensures correct canonical links and that GitHub Pages will publish to the intended domain.
- Branding is currently missing; placeholder assets should be treated as temporary and clearly labelled in the repo until final assets are supplied.

Saved path: /home/josh/projects/bigknoxy-gh/memory/001-github-username.md
