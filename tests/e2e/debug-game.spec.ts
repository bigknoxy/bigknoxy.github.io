import { test, expect } from "@playwright/test";

test.describe("Game Debug", () => {
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

  test("debug game loading", async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto("/");

    // Click CTA to load engine
    const cta = await page.locator("#mini-game-cta");
    await expect(cta).toBeVisible();
    await cta.click();

    // Wait for engine ready
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Debug: Check what's available on window
    const debugInfo = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        miniGameType: typeof window.miniGame,
        miniGameKeys: window.miniGame ? Object.keys(window.miniGame) : [],
        hasRaw: !!(window.miniGame && window.miniGame.raw),
        rawType:
          window.miniGame && window.miniGame.raw
            ? typeof window.miniGame.raw
            : "undefined",
        hasAddScore: !!(
          window.miniGame && typeof window.miniGame.addScore === "function"
        ),
        hasSetScore: !!(
          window.miniGame && typeof window.miniGame.setScore === "function"
        ),
        hasGetScore: !!(
          window.miniGame && typeof window.miniGame.getScore === "function"
        ),
        currentScore:
          window.miniGame && typeof window.miniGame.getScore === "function"
            ? window.miniGame.getScore()
            : "N/A",
      };
    });

    console.log("Debug info:", debugInfo);
    console.log("Console messages:", consoleMessages);

    // Try to set score
    await page.evaluate(() => {
      console.log("Attempting to set score to 50...");
      if (window.miniGame && typeof window.miniGame.setScore === "function") {
        window.miniGame.setScore(50);
        console.log("Score set to:", window.miniGame.getScore());
      } else {
        console.log("setScore not available");
      }
    });

    await page.waitForTimeout(2000);

    const scoreElement = page.locator("#mini-game-score");
    const scoreText = await scoreElement.textContent();
    console.log("Score element text:", scoreText);
  });
});
