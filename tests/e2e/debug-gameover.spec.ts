import { test, expect } from "@playwright/test";

test.describe("Game Over Debug", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept requests to serve correct game engine file from local dist
    await page.route("**/game/game-engine.js", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/game/game-engine.js");
      const content = fs.readFileSync(filePath, "utf8");
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: content,
      });
    });

    // Also intercept wrong path that component is actually trying to use
    await page.route("**/src/game/GameEngine", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/game/game-engine.js");
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

  test("debug game over overlay", async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on("console", (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(text);
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

    // Start the game
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    // Set a score
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.setScore === "function") {
        window.miniGame.setScore(75);
      }
    });

    // Check if game over overlay exists initially
    const initialOverlay = await page.locator("#game-over-overlay");
    const isInitiallyHidden = await initialOverlay.isHidden();
    console.log("Initial overlay hidden:", isInitiallyHidden);

    // Try different ways to trigger game over
    await page.evaluate(() => {
      console.log("=== Attempting game over ===");

      // Method 1: Call stop on raw engine
      if (
        window.miniGame &&
        window.miniGame.raw &&
        typeof window.miniGame.raw.stop === "function"
      ) {
        console.log("Method 1: Calling raw.stop()");
        window.miniGame.raw.stop();
      }
    });

    // Wait longer for event to propagate
    await page.waitForTimeout(2000);

    // Check if last event was captured
    const lastEvent = await page.evaluate(
      () => (window as any).__lastMiniGameEvent,
    );
    console.log("Last mini game event:", lastEvent);

    // Check if event listeners are properly attached
    const eventListenerDebug = await page.evaluate(() => {
      const root = document.getElementById("mini-game-root");
      return {
        rootExists: !!root,
        rootAddEventListener: !!root.addEventListener,
        documentAddEventListener: !!document.addEventListener,
        gameoverElement: !!document.getElementById("game-over-overlay"),
        gameoverScoreElement: !!document.getElementById("gameover-score"),
        restartButtonElement: !!document.getElementById("gameover-restart"),
      };
    });
    console.log("Event listener debug:", eventListenerDebug);

    // Manually call showGameOver to test if it works
    await page.evaluate(() => {
      console.log("Manually calling showGameOver...");
      // Try to access and call showGameOver function from the closure
      const gameoverEl = document.getElementById("game-over-overlay");
      const scoreEl = document.getElementById("gameover-score");
      if (gameoverEl && scoreEl) {
        gameoverEl.classList.remove("hidden");
        gameoverEl.setAttribute("aria-hidden", "false");
        scoreEl.textContent = "FINAL: 0075";
        console.log("Manual showGameOver completed");
      }
    });

    // Wait and check overlay
    await page.waitForTimeout(2000);

    const gameoverOverlay = page.locator("#game-over-overlay");
    const isVisible = await gameoverOverlay.isVisible();
    console.log("Overlay visible after manual show:", isVisible);

    // Check overlay attributes
    const hasHiddenClass = await gameoverOverlay.evaluate((el) =>
      el.classList.contains("hidden"),
    );
    const ariaHidden = await gameoverOverlay.getAttribute("aria-hidden");
    console.log("Has hidden class:", hasHiddenClass);
    console.log("Aria hidden:", ariaHidden);

    // Check if score is displayed
    const gameoverScore = page.locator("#gameover-score");
    const scoreText = await gameoverScore.textContent();
    console.log("Game over score text:", scoreText);

    // Take screenshot for debugging
    await page.screenshot({ path: "debug-gameover.png", fullPage: true });
  });
});
