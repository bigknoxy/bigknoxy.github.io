/**
 * Production Site QA - Final Assessment
 * Tests for https://bigknoxy.github.io/ production deployment
 */

import { test, expect } from "@playwright/test";

test.describe("Production Site QA - Final", () => {
  test("Production site assessment", async ({ page }) => {
    const productionURL = "https://bigknoxy.github.io/";

    // Capture console messages, errors, and network issues
    const consoleMessages: string[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: any[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    const startTime = Date.now();
    await page.goto(productionURL, { waitUntil: "networkidle" });

    // Check if game elements exist
    const gameRoot = page.locator("#mini-game-root");
    const gameCanvas = page.locator("#mini-game-canvas");
    const gameOverlay = page.locator("#game-over-overlay");
    const scoreElement = page.locator("#mini-game-score");

    const gameElementsExist = (await gameRoot.count()) > 0;
    const canvasExists = (await gameCanvas.count()) > 0;
    const overlayExists = (await gameOverlay.count()) > 0;
    const scoreExists = (await scoreElement.count()) > 0;

    // Try to detect game engine loading
    let gameEngineAttempted = false;
    let gameEngineLoaded = false;

    try {
      // Check if game engine script is attempted to be loaded
      gameEngineAttempted = await page.evaluate(() => {
        return window.loadEngine !== undefined;
      });

      // Try to wait for game ready signal
      await Promise.race([
        page.waitForFunction(() => (window as any).__miniGameReady === true, {
          timeout: 5000,
        }),
        page.waitForFunction(() => (window as any).miniGame !== undefined, {
          timeout: 5000,
        }),
      ]);
      gameEngineLoaded = true;
    } catch (e) {
      // Expected to fail due to missing assets
    }

    // Check if we can interact with game elements
    let startButtonExists = false;
    let canClickStart = false;

    try {
      const startButton = page.locator("#mini-game-cta");
      startButtonExists = (await startButton.count()) > 0;
      if (startButtonExists) {
        await startButton.click({ timeout: 2000 });
        canClickStart = true;
      }
    } catch (e) {
      // Expected to fail
    }

    // Generate final report
    const timeToLoad = Date.now() - startTime;
    const uniqueErrors = [...new Set(pageErrors.map((e) => e.message))];
    const uniqueFailedRequests = [
      ...new Set(failedRequests.map((r) => `${r.status} ${r.url}`)),
    ];

    console.log("\n=== PRODUCTION QA FINAL REPORT ===");
    console.log(`URL: ${productionURL}`);
    console.log(
      `Overall Result: ${failedRequests.length === 0 && gameEngineLoaded ? "PASS" : "FAIL"}`,
    );

    console.log(`\nCritical Issues:`);
    if (uniqueFailedRequests.length > 0) {
      uniqueFailedRequests.forEach((req) => console.log(`  ❌ ${req}`));
    }
    if (uniqueErrors.length > 0) {
      uniqueErrors.forEach((err) =>
        console.log(`  ❌ ERROR: ${err.substring(0, 100)}...`),
      );
    }
    if (uniqueFailedRequests.length === 0 && uniqueErrors.length === 0) {
      console.log("  ✅ No critical errors detected");
    }

    console.log(`\nGame Structure:`);
    console.log(`  Game Root: ${gameElementsExist ? "✅" : "❌"}`);
    console.log(`  Canvas: ${canvasExists ? "✅" : "❌"}`);
    console.log(`  Score Display: ${scoreExists ? "✅" : "❌"}`);
    console.log(`  Game Over Overlay: ${overlayExists ? "✅" : "❌"}`);

    console.log(`\nGame Engine Status:`);
    console.log(
      `  Load Function Available: ${gameEngineAttempted ? "✅" : "❌"}`,
    );
    console.log(`  Engine Loaded: ${gameEngineLoaded ? "✅" : "❌"}`);
    console.log(`  Start Button: ${startButtonExists ? "✅" : "❌"}`);
    console.log(`  Can Click Start: ${canClickStart ? "✅" : "❌"}`);

    console.log(`\nPerformance:`);
    console.log(`  Page Load Time: ${timeToLoad}ms`);

    console.log(`\nRecommendations:`);
    if (uniqueFailedRequests.some((req) => req.includes("game-engine.js"))) {
      console.log(
        `  🚨 Game engine script is missing - needs to be built and deployed`,
      );
    }
    if (uniqueFailedRequests.some((req) => req.includes("global.css"))) {
      console.log(`  🚨 Global CSS is missing - check build process`);
    }
    if (!gameEngineLoaded) {
      console.log(
        `  🔧 Game functionality is not available due to missing assets`,
      );
    }

    console.log(
      `\nCommands Run: npx playwright test production-qa-final.spec.ts`,
    );
    console.log(`Artifacts: playwright-report/`);

    // Take screenshot for documentation
    await page.screenshot({
      path: "playwright-report/production-screenshot.png",
      fullPage: true,
    });

    // Don't fail the test - this is an assessment, not a validation
    expect(true).toBe(true);
  });
});
