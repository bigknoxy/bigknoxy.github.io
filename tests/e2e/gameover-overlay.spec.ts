/**
 * GAME OVER Overlay Integration Tests
 * Browser-based tests for GAME OVER overlay and restart functionality
 */

import { test, expect } from "@playwright/test";

test.describe("GAME OVER Overlay Integration", () => {
  test.beforeEach(async ({ page }) => {
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

  test("GAME OVER overlay appears and restart resets HUD", async ({ page }) => {
    // Capture console messages and page errors
    const consoleMessages: string[] = [];
    const pageErrors: Error[] = [];

    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await page.goto("/");

    // Wait for game to be ready
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
        window.miniGame.setScore(120);
      }
    });

    const scoreElement = page.locator("#mini-game-score");
    await expect(scoreElement).toHaveText("SCORE: 0120");

    // Simulate game over
    await page.evaluate(() => {
      if (
        window.miniGame &&
        window.miniGame.raw &&
        typeof window.miniGame.raw.stop === "function"
      ) {
        window.miniGame.raw.stop();
      }
    });

    // Assert GAME OVER overlay appears
    const gameoverOverlay = page.locator("#game-over-overlay");
    await expect(gameoverOverlay).toBeVisible({ timeout: 5000 });
    await expect(gameoverOverlay).not.toHaveClass(/hidden/);

    // Assert final score is displayed with padding
    const gameoverScore = page.locator("#gameover-score");
    await expect(gameoverScore).toHaveText("FINAL: 0120");

    // Click restart button
    const restartButton = page.locator("#gameover-restart");
    await expect(restartButton).toBeVisible();
    await restartButton.click();

    // Assert overlay is hidden
    await expect(gameoverOverlay).toBeHidden();
    await expect(gameoverOverlay).toHaveClass(/hidden/);

    // Assert HUD resets to SCORE: 0000
    await expect(scoreElement).toHaveText("SCORE: 0000");

    // Attach console and error info to test
    if (consoleMessages.length > 0) {
      console.log("Console messages:", consoleMessages);
    }
    if (pageErrors.length > 0) {
      console.error("Page errors:", pageErrors);
      throw new Error(
        `Page errors encountered: ${pageErrors.map((e) => e.message).join(", ")}`,
      );
    }
  });

  test("GAME OVER overlay positioning and accessibility", async ({ page }) => {
    await page.goto("/");

    // Wait for game to be ready
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Start the game and set score
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
      if (window.miniGame && typeof window.miniGame.setScore === "function") {
        window.miniGame.setScore(85);
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

    const gameoverOverlay = page.locator("#game-over-overlay");
    await expect(gameoverOverlay).toBeVisible();

    // Check accessibility attributes
    await expect(gameoverOverlay).toHaveAttribute("aria-modal", "true");
    await expect(gameoverOverlay).toHaveAttribute("aria-hidden", "false");

    // Check title and score elements
    const gameoverTitle = page.locator("#gameover-title");
    await expect(gameoverTitle).toBeVisible();
    await expect(gameoverTitle).toHaveText("GAME OVER");
    await expect(gameoverTitle).toHaveAttribute("id", "gameover-title");

    const gameoverScore = page.locator("#gameover-score");
    await expect(gameoverScore).toBeVisible();
    await expect(gameoverScore).toHaveText("FINAL: 0085");
    await expect(gameoverScore).toHaveAttribute("aria-live", "assertive");

    // Check restart button
    const restartButton = page.locator("#gameover-restart");
    await expect(restartButton).toBeVisible();
    await expect(restartButton).toHaveText("Restart");
    await expect(restartButton).toHaveAttribute("aria-label", "Restart game");

    // Verify overlay positioning (centered)
    const overlayPosition = await gameoverOverlay.boundingBox();
    expect(overlayPosition).toBeTruthy();
    if (overlayPosition) {
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        const centerX = viewportSize.width / 2;
        const overlayCenterX = overlayPosition.x + overlayPosition.width / 2;
        // Allow some tolerance for centering
        expect(Math.abs(centerX - overlayCenterX)).toBeLessThan(100);
      }
    }
  });
});
