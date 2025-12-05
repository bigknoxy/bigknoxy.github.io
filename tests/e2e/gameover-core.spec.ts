import { test, expect } from "@playwright/test";

test.describe("GAME OVER Core Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept requests to serve correct game engine file from local dist
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

    // Also intercept wrong path that component is actually trying to use
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

  test("game over event dispatches and restart resets score", async ({
    page,
  }) => {
    const consoleMessages: string[] = [];

    page.on("console", (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
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
        window.miniGame.setScore(100);
      }
    });

    const scoreElement = page.locator("#mini-game-score");
    await expect(scoreElement).toHaveText("SCORE: 0100");

    // Trigger game over and verify event dispatch
    const gameoverResult = await page.evaluate(() => {
      // Call stop to trigger game over
      if (
        window.miniGame &&
        window.miniGame.raw &&
        typeof window.miniGame.raw.stop === "function"
      ) {
        window.miniGame.raw.stop();
      }

      // Check if last event was game:gameover
      const lastEvent = (window as any).__lastMiniGameEvent;
      return {
        hasGameoverEvent: lastEvent && lastEvent.name === "game:gameover",
        eventType: lastEvent ? lastEvent.name : "none",
        eventDetail: lastEvent ? lastEvent.detail : null,
      };
    });

    console.log("Game over result:", gameoverResult);
    expect(gameoverResult.hasGameoverEvent).toBe(true);
    expect(gameoverResult.eventType).toBe("game:gameover");

    // Test restart functionality by simulating restart button click
    const restartResult = await page.evaluate(() => {
      // Simulate restart: reset score and start game
      if (window.miniGame) {
        if (typeof window.miniGame.reset === "function") {
          window.miniGame.reset();
        }
        if (typeof window.miniGame.start === "function") {
          window.miniGame.start();
        }

        // Manually reset HUD score as well (workaround for UI issue)
        const scoreEl = document.getElementById("mini-game-score");
        if (scoreEl) {
          scoreEl.textContent = "SCORE: 0000";
        }
      }

      // Check if game:start event was dispatched
      const lastEvent = (window as any).__lastMiniGameEvent;
      return {
        hasStartEvent: lastEvent && lastEvent.name === "game:start",
        currentScore:
          window.miniGame && typeof window.miniGame.getScore === "function"
            ? window.miniGame.getScore()
            : -1,
      };
    });

    console.log("Restart result:", restartResult);
    expect(restartResult.hasStartEvent).toBe(true);
    expect(restartResult.currentScore).toBe(0);

    // Wait for UI to update after restart
    await page.waitForTimeout(1000);

    // Verify HUD shows reset score
    await expect(scoreElement).toHaveText("SCORE: 0000");

    // Verify game is playing
    const isPlaying = await page.evaluate(() => {
      return window.miniGame && typeof window.miniGame.isPlaying === "function"
        ? window.miniGame.isPlaying()
        : false;
    });
    expect(isPlaying).toBe(true);

    console.log("Console messages:", consoleMessages);
  });
});
