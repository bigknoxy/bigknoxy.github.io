import { test } from "@playwright/test";

test.describe("MiniGame Simple Debug", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept requests to serve the correct game engine file from local dist
    await page.route("**/assets/game-engine.js", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/assets/game-engine.js");
      const content = fs.readFileSync(filePath, "utf8");
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: content,
      });
    });

    // Also intercept the wrong path that the component is actually trying to use
    await page.route("**/src/game/GameEngine", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/assets/game-engine.js");
      const content = fs.readFileSync(filePath, "utf8");
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: content,
      });
    });

    // Add init script to set test mode and disable IntersectionObserver
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      // Override IntersectionObserver to prevent auto-loading but keep it as a constructor
      (window as any).IntersectionObserver = class {
        constructor() {}
        observe() {}
        disconnect() {}
        unobserve() {}
      };
    });
  });

  test("should check console errors", async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click CTA to load engine deterministically
    const cta = await page.$("#mini-game-cta");
    if (cta) {
      await cta.click();

      // Wait for engine to load using Promise.race
      await Promise.race([
        page.waitForFunction(() => (window as any).__miniGameReady === true, {
          timeout: 10000,
        }),
        page
          .evaluate(() => (window as any).__miniGameReadyPromise)
          .then(() => true),
      ]);
    }

    // Wait a bit more for any additional loading
    await page.waitForTimeout(2000);

    console.log("=== Console Messages ===");
    consoleMessages.forEach((msg) => console.log(msg));

    console.log("=== Page Errors ===");
    pageErrors.forEach((error) => console.log(error));

    // Take screenshot
    await page.screenshot({
      path: "test-results/simple-debug-screenshot.png",
      fullPage: true,
    });

    // Check if GameEngine import failed
    const hasImportError = consoleMessages.some((msg) =>
      msg.includes("Failed to load GameEngine"),
    );
    console.log("Has import error:", hasImportError);
  });
});
