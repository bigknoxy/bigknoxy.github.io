Context → Decision → Outcome

Context

- Repository contains Playwright E2E tests under tests/e2e and a test suite that currently runs locally and in developer CI experiments (see test-results/ and playwright-report/).
- There is no dedicated CI job that launches a production-like preview of the site and runs the full Playwright E2E suite as part of PR validation.
- Team goals: reduce regressions in interactive mini-game, input handling, audio subsystems and search functionality by exercising real browser interactions in CI.

Decision

- Add a GitHub Actions job to run Playwright E2E tests on every PR targeting the main integration branch (or on a scheduled subset) once Task 3 (integration work) and test stabilization are complete.
- Job will build the site, launch a preview server for the built output, run Playwright with browsers installed, collect artifacts (report, traces, videos, screenshots) and fail the job on E2E failures.

Outcome (what this note captures)

- Rationale for the job, a concrete job outline, prerequisites and operational risks.
- Recommendation to schedule this work after Task 3 integration and test stabilization.

Why it's needed

- Catch regressions that unit/unit-like tests miss: real browser behavior, audio and input timing, rendering edge-cases, third-party integrations (search, assets).
- Improve confidence for PR merges: automated emulation of user flows prevents shipping interactive bugs.
- Provide reproducible artifacts (reports, screenshots, videos) to speed debugging when tests fail.

Exact CI job outline (GitHub Actions job)

- Job name: e2e-playwright
- Runs-on: ubuntu-latest (or a self-hosted runner with necessary GPU/audio capabilities if audio requires it)
- Environment: node or bun environment consistent with repo (use Bun in steps or Node if Playwright tooling needs it)
- Steps:
  1. Checkout repository (actions/checkout@v4)
  2. Cache dependencies (actions/cache) for bun/npm/node_modules keyed by lockfile
  3. Install runtime and dependencies
     - If using Bun: install Bun runtime (or use preinstalled), run `bun install`
     - If using Node: set up Node, run `npm ci`
  4. Build the site for preview
     - `bun run build` (or `npm run build`) — create production assets
  5. Start a preview server on a known port (background process)
     - Option A: use `bun run preview --port 8787` or `npm run preview` and background it
     - Option B: use a lightweight static server `npx serve ./dist -l 8787`
     - Wait for the server to respond on the health URL (retry/poll with timeout)
  6. Install Playwright browsers and dependencies
     - `npx playwright install --with-deps` or `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright && npx playwright install` (ensure browsers are available in CI)
  7. Run Playwright tests
     - `npx playwright test --project=chromium --config=playwright.config.ts --reporter=html` (adjust flags: workers=1 for stability, retries as desired)
     - Optionally run `npx playwright install-deps` beforehand for system libs
  8. Collect and upload artifacts
     - Upload `playwright-report/`, `test-results/`, screenshots, traces and videos as job artifacts (actions/upload-artifact)
     - Persist test exit code (fail CI on non-zero)
  9. Teardown: stop preview server (ensure background job is killed)

Suggested YAML snippet (concise) — adapt to repo tooling

- name: E2E Playwright
  runs-on: ubuntu-latest
  steps:
  - uses: actions/checkout@v4
  - name: Cache dependencies
    uses: actions/cache@v4
    with:
    path: .bun or node_modules (adjust)
    key: ${{ runner.os }}-deps-${{ hashFiles('**/bun.lock', '**/package.json') }}
  - name: Install runtime & deps
    run: |
    # install bun or setup node
    bun install
  - name: Build
    run: bun run build
  - name: Start preview server
    run: |
    bun run preview --port 8787 &
    n=0; until curl -sSf http://localhost:8787 || [ $n -ge 30 ]; do n=$((n+1)); sleep 1; done
  - name: Install Playwright browsers
    run: npx playwright install --with-deps
  - name: Run Playwright tests
    run: npx playwright test --workers=1 --reporter=html
  - name: Upload artifacts
    uses: actions/upload-artifact@v4
    with:
    name: playwright-report
    path: playwright-report/

Prerequisites

- Preview server: CI must be able to serve the built site during the job. Either use the repository's preview command (bun run preview) or a simple static server pointed at the build output. The server must be reachable at http://localhost:<port> from the runner.
- Browsers: Playwright browsers must be installed in the CI environment (`npx playwright install`). On ubuntu-latest that usually works; some distros might require `npx playwright install-deps`.
- Secrets: None strictly required for basic E2E if tests only exercise the public frontend. Possible optional secrets:
  - PREVIEW_SECRET or API tokens if the preview build needs authenticated access to external APIs or feature flags
  - DATABASE_URL, SERVICE_ACCOUNT keys if tests run against a backend requiring auth
  - GITHUB_TOKEN (provided by Actions) for uploading artifacts or commenting results — no extra secret required for typical uses
- Test stability: stabilize flaky tests first (use retries, reduce concurrency, deterministic timing in tests). Ensure tests pass consistently locally before enabling CI gating.

Risks

- Flaky tests may block merges if retries/configuration are not tuned. Initial run may produce false negatives.
- CI runner environment differences (timing, fonts, audio stack) may cause tests to fail only in CI.
- Running audio and input timing-sensitive tests in headless CI can be brittle. Some audio behaviors rely on real audio hardware or focused windows.
- Increased CI runtime and cost (browsers and preview server add time). E2E job may be slow (1–6 minutes or more depending on tests).
- If the job uses secrets to reach external services, leaking or misconfiguring them could expose sensitive data; keep secrets in Actions secrets and limit scope.

Mitigations

- Start with a limited smoke subset of E2E tests in CI, expand after stability confirmed.
- Use Playwright retries for CI (e.g. retries: 1–2) and run with single worker (--workers=1) initially.
- Collect and publish artifacts (HTML report, screenshots, videos, traces) to debug flakiness.
- Run the job initially on a non-blocking branch (optional) or as a check run (not gating) until stable.

Estimated effort

- Initial implementation: 4–8 hours (create job, wiring build & preview, install browsers, basic artifacts)
- Test stabilization and tuning: 1–3 days (flaky test fixes, retries, CI-specific adjustments)
- Ongoing maintenance: small incremental time per flaky failure (30–60 minutes per incident on average)

Recommended time to schedule

- Schedule this work after Task 3 integration and the test stabilization effort are complete. The job is most valuable and least disruptive once the major integration points are merged and unit/integration tests are stable.
- Suggested milestone: "After Task 3 integration and test stabilization" — implement E2E CI as the next sprint item.

Notes / Next steps

- Validate a minimal smoke E2E run in CI with a small set of critical scenarios (homepage load, mini-game start, basic input flow).
- Iterate by increasing coverage after artifacts demonstrate stable CI runs.
- Add a follow-up memory file when the job is deployed with concrete links to the workflow file and any troubleshooting notes.
