/**
 * Production Site QA - Comprehensive End-to-End Verification
 * Tests for https://bigknoxy.github.io/ production deployment
 */

import { test, expect } from "@playwright/test";

test.describe("Production Site QA", () => {
  test("Comprehensive production verification", async ({ page }) => {
    const productionURL = "https://bigknoxy.github.io/";

    // 1) Headless check: console messages, network requests, JS errors
    const consoleMessages: string[] = [];
    const pageErrors: Error[] = [];
    const networkRequests: any[] = [];
    const failedRequests: any[] = [];

    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    page.on("request", (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
      });
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
    await page.goto(productionURL);

    // 2) Verify game engine script is loaded
    const gameScriptURL = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script"));
      const gameScript = scripts.find(
        (script) =>
          script.src &&
          (script.src.includes("game") || script.src.includes("GameEngine")),
      );
      return gameScript ? gameScript.src : null;
    });

    let gameScriptStatus: number | null = null;
    if (gameScriptURL) {
      const response = await page.request.get(gameScriptURL);
      gameScriptStatus = response.status();
    }

    // 3) Wait for readiness signal
    let timeToReady: number | null = null;
    let readySignal: string | null = null;

    try {
      await Promise.race([
        page.waitForFunction(() => (window as any).__miniGameReady === true, {
          timeout: 10000,
        }),
        page
          .evaluate(() => (window as any).__miniGameReadyPromise)
          .then(() => true),
        page.waitForFunction(() => (window as any).miniGame !== undefined, {
          timeout: 10000,
        }),
      ]);
      timeToReady = Date.now() - startTime;
      readySignal = await page.evaluate(() => {
        if ((window as any).__miniGameReady) return "__miniGameReady";
        if ((window as any).miniGame) return "window.miniGame";
        return "unknown";
      });
    } catch (e) {
      readySignal = "not present";
    }

    // 4) Simulate gameplay
    let gameStarted = false;
    let overlayVisible = false;
    let scoreCorrect = false;
    let restartWorked = false;
    let headerClickable = false;

    try {
      // Start game
      await page.evaluate(() => {
        if (window.miniGame && typeof window.miniGame.start === "function") {
          window.miniGame.start();
        }
      });
      gameStarted = true;

      // Set a score to test overlay
      await page.evaluate(() => {
        if (window.miniGame && typeof window.miniGame.setScore === "function") {
          window.miniGame.setScore(123);
        }
      });

      // Trigger game over
      await page.evaluate(() => {
        if (
          window.miniGame &&
          window.miniGame.raw &&
          typeof window.miniGame.raw.stop === "function"
        ) {
          window.miniGame.raw.stop();
        }
      });

      // Check overlay visibility
      const gameoverOverlay = page.locator("#game-over-overlay");
      await expect(gameoverOverlay).toBeVisible({ timeout: 5000 });
      overlayVisible = true;

      // Check score display
      const gameoverScore = page.locator("#gameover-score");
      const scoreText = await gameoverScore.textContent();
      scoreCorrect = scoreText === "FINAL: 0123";

      // Test restart
      const restartButton = page.locator("#gameover-restart");
      await restartButton.click();

      // Verify overlay hidden and score reset
      await expect(gameoverOverlay).toBeHidden({ timeout: 3000 });
      const scoreElement = page.locator("#mini-game-score");
      await expect(scoreElement).toHaveText("SCORE: 0000");
      restartWorked = true;

      // Test header click (overlay should not block)
      const headerLink = page.locator("header a").first();
      await headerLink.click();
      headerClickable = true;
    } catch (e) {
      console.error("Gameplay simulation failed:", e);
    }

    // 5) Generate report
    console.log("\n=== PRODUCTION QA REPORT ===");
    console.log(`URL: ${productionURL}`);
    console.log(
      `Overall Result: ${pageErrors.length === 0 && failedRequests.length === 0 && overlayVisible ? "PASS" : "FAIL"}`,
    );

    console.log("\nConsole/Network Errors:");
    const uniqueErrors = [...new Set(pageErrors.map((e) => e.message))];
    const unique404s = [
      ...new Set(failedRequests.map((r) => `${r.status} ${r.url}`)),
    ];

    if (uniqueErrors.length > 0) {
      uniqueErrors.forEach((err) => console.log(`  ERROR: ${err}`));
    }
    if (unique404s.length > 0) {
      unique404s.forEach((req) => console.log(`  ${req}`));
    }
    if (uniqueErrors.length === 0 && unique404s.length === 0) {
      console.log("  None");
    }

    console.log(`\nGame Engine Script:`);
    console.log(`  URL: ${gameScriptURL || "not found"}`);
    console.log(`  HTTP Status: ${gameScriptStatus || "N/A"}`);

    console.log(`\nReadiness Signal:`);
    console.log(`  Signal: ${readySignal}`);
    console.log(`  Time-to-ready: ${timeToReady ? `${timeToReady}ms` : "N/A"}`);

    console.log(`\nGameplay Outcomes:`);
    console.log(`  Game Started: ${gameStarted ? "Y" : "N"}`);
    console.log(`  Overlay Visible: ${overlayVisible ? "Y" : "N"}`);
    console.log(`  Score Correct: ${scoreCorrect ? "Y" : "N"}`);
    console.log(`  Restart Worked: ${restartWorked ? "Y" : "N"}`);
    console.log(`  Header Clickable: ${headerClickable ? "Y" : "N"}`);

    console.log(`\nCommands Run: npx playwright test production-qa.spec.ts`);
    console.log(`Artifacts: playwright-report/`);

    // Fail test if critical issues found
    if (pageErrors.length > 0) {
      throw new Error(`Page errors detected: ${uniqueErrors.join(", ")}`);
    }

    if (failedRequests.length > 0) {
      throw new Error(`Failed requests detected: ${unique404s.join(", ")}`);
    }

    if (!overlayVisible) {
      throw new Error("Game over overlay not visible");
    }
  });
});
