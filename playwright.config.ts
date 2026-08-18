import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Unit tests under tests/unit run with the bun:test runner
  // (see "test" script + bunfig.toml); keep Playwright scoped to browser E2E.
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    // Test against the locally built site (served by the webServer below),
    // not the production deployment, so PRs verify exactly what ships.
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run preview",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
