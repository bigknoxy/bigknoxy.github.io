/**
 * Integration Test: MiniGame HUD Updates and DOM Events
 * Tests the complete scoring flow from GameEngine -> MiniGame.astro HUD
 */

/// <reference path="../../src/types/minigame.d.ts" />

import { test, expect } from "@playwright/test";

test.describe("MiniGame Scoring Integration", () => {
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

    await page.goto("/");
  });

  test("HUD updates immediately when collectibles are gathered", async ({
    page,
  }) => {
    // Wait for game to be ready
    await page.waitForSelector("#mini-game-root", { state: "visible" });

    // Wait for game engine to load
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

    // Get initial score
    const scoreElement = page.locator("#mini-game-score");
    await expect(scoreElement).toBeVisible();
    await expect(scoreElement).toHaveText("SCORE: 0000");

    // Listen for game:score events
    let scoreEvents = [];
    page.on("console", (msg) => {
      if (msg.type() === "debug" && msg.text().includes("game:score")) {
        scoreEvents.push(msg.text());
      }
    });

    // Set up event listener on the page
    await page.evaluate(() => {
      const root = document.getElementById("mini-game-root");
      if (root) {
        root.addEventListener("game:score", (e) => {
          console.log(
            `game:score event received with score: ${e.detail.score}`,
          );
        });
      }
    });

    // Add score programmatically to test HUD update
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.addScore) {
        window.miniGame.addScore(10);
      }
    });

    // Check HUD updated immediately
    await expect(scoreElement).toHaveText("SCORE: 0010");

    // Add more points (special collectible = 25 points)
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.addScore) {
        window.miniGame.addScore(25);
      }
    });

    await expect(scoreElement).toHaveText("SCORE: 0035");

    // Test score formatting with 4-digit padding
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.setScore) {
        window.miniGame.setScore(5);
      }
    });

    await expect(scoreElement).toHaveText("SCORE: 0005");

    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.setScore) {
        window.miniGame.setScore(150);
      }
    });

    await expect(scoreElement).toHaveText("SCORE: 0150");
  });

  test("game:score DOM events fire with correct payload", async ({ page }) => {
    // Wait for game to be ready
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

    // Set up event listener to capture events
    const events = await page.evaluate(() => {
      return new Promise((resolve) => {
        const events = [];
        const root = document.getElementById("mini-game-root");

        if (root) {
          const handler = (e) => {
            events.push({
              type: e.type,
              detail: e.detail,
              timestamp: Date.now(),
            });

            // Resolve after 3 events to capture the sequence
            if (events.length >= 3) {
              root.removeEventListener("game:score", handler);
              resolve(events);
            }
          };

          root.addEventListener("game:score", handler);

          // Trigger score changes
          setTimeout(() => {
            if (window.miniGame && window.miniGame.addScore) {
              window.miniGame.addScore(10);
              window.miniGame.addScore(25);
              window.miniGame.setScore(100);
            }
          }, 50);
        }
      });
    });

    // Verify events were fired with correct payloads
    expect(events).toHaveLength(3);
    expect(events[0].detail.score).toBe(10);
    expect(events[1].detail.score).toBe(35); // 10 + 25
    expect(events[2].detail.score).toBe(100);
  });

  test("high score persistence works via localStorage", async ({ page }) => {
    // Wait for game to be ready
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

    // Clear existing high score
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.resetHighScore) {
        window.miniGame.resetHighScore();
      }
    });

    // Check initial high score
    const initialHighScore = await page.evaluate(() => {
      return window.miniGame && window.miniGame.getHighScore
        ? window.miniGame.getHighScore()
        : 0;
    });
    expect(initialHighScore).toBe(0);

    // Set a high score
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.setScore) {
        window.miniGame.setScore(150);
        // Simulate game over to save high score
        if (window.miniGame.raw && window.miniGame.raw.stop) {
          window.miniGame.raw.stop();
        }
      }
    });

    // Check high score was saved
    const highScore = await page.evaluate(() => {
      return window.miniGame && window.miniGame.getHighScore
        ? window.miniGame.getHighScore()
        : 0;
    });
    expect(highScore).toBe(150);

    // Check localStorage directly
    const localStorageValue = await page.evaluate(() => {
      return localStorage.getItem("miniGameHighScore");
    });
    expect(localStorageValue).toBe("150");

    // Test reset high score
    await page.evaluate(() => {
      if (window.miniGame && window.miniGame.resetHighScore) {
        window.miniGame.resetHighScore();
      }
    });

    const resetHighScore = await page.evaluate(() => {
      return window.miniGame && window.miniGame.getHighScore
        ? window.miniGame.getHighScore()
        : 0;
    });
    expect(resetHighScore).toBe(0);

    const localStorageAfterReset = await page.evaluate(() => {
      return localStorage.getItem("miniGameHighScore");
    });
    expect(localStorageAfterReset).toBeNull();
  });

  test("API methods are available on window.miniGame", async ({ page }) => {
    // Wait for game to be ready
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

    // Check all required API methods are available
    const apiMethods = await page.evaluate(() => {
      const methods = [
        "getScore",
        "setScore",
        "addScore",
        "getHighScore",
        "resetHighScore",
        "setScoreChangeCallback",
      ];

      return methods.map((method) => ({
        method,
        available:
          window.miniGame && typeof window.miniGame[method] === "function",
      }));
    });

    for (const { method, available } of apiMethods) {
      expect(available).toBe(true);
    }
  });

  test("score updates are atomic without race conditions", async ({ page }) => {
    // Wait for game to be ready
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

    // Set up callback to track score changes
    const scoreChanges = await page.evaluate(() => {
      return new Promise((resolve) => {
        const changes = [];

        if (window.miniGame && window.miniGame.setScoreChangeCallback) {
          window.miniGame.setScoreChangeCallback((score) => {
            changes.push({ score, timestamp: Date.now() });

            // Resolve after multiple rapid changes
            if (changes.length >= 5) {
              resolve(changes);
            }
          });

          // Trigger rapid score changes (simulating race conditions)
          setTimeout(() => {
            if (window.miniGame) {
              window.miniGame.setScore(0);
              window.miniGame.addScore(10);
              window.miniGame.addScore(25);
              window.miniGame.setScore(50);
              window.miniGame.addScore(5);
            }
          }, 50);
        }
      });
    });

    // Verify all score changes were captured in sequence
    expect(scoreChanges).toHaveLength(5);
    expect(scoreChanges[0].score).toBe(0);
    expect(scoreChanges[1].score).toBe(10);
    expect(scoreChanges[2].score).toBe(35);
    expect(scoreChanges[3].score).toBe(50);
    expect(scoreChanges[4].score).toBe(55);

    // Verify final HUD state
    const finalScore = await page.locator("#mini-game-score");
    await expect(finalScore).toHaveText("SCORE: 0055");
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

    // Wait for game to be ready
    await page.waitForFunction(() => window.miniGame && window.miniGame.raw);

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

    const scoreElement = page.locator("#mini-game-score");
    await expect(scoreElement).toHaveText("SCORE: 0075");

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

    // Assert final score is displayed
    const gameoverScore = page.locator("#gameover-score");
    await expect(gameoverScore).toHaveText("FINAL: 0075");

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
});
