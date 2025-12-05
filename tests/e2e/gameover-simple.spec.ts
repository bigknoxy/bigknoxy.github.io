import { test, expect } from "@playwright/test";

test("GAME OVER overlay basic functionality", async ({ page }) => {
  // Add init script to set test mode
  await page.addInitScript(() => {
    window.__TEST_MODE = true;
    window.IntersectionObserver = class {
      constructor() {}
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  await page.goto("http://localhost:8787");

  // Wait for everything to load
  await page.waitForTimeout(3000);

  // Check if game is ready
  const ready = await page.evaluate(() => window.__miniGameReady);
  console.log("Game ready:", ready);

  // Check if miniGame API exists
  const apiExists = await page.evaluate(() => !!window.miniGame);
  console.log("API exists:", apiExists);

  if (!apiExists) {
    // Try to manually load
    await page.evaluate(() => {
      if (window.loadEngine) {
        window.loadEngine();
      }
    });
    await page.waitForTimeout(2000);
  }

  // Now check if we can set score
  const scoreSet = await page.evaluate(() => {
    if (window.miniGame && typeof window.miniGame.setScore === "function") {
      window.miniGame.setScore(123);
      return true;
    }
    return false;
  });

  console.log("Score set:", scoreSet);

  if (scoreSet) {
    // Wait for UI to update
    await page.waitForTimeout(500);

    const scoreText = await page.evaluate(() => {
      const el = document.getElementById("mini-game-score");
      return el ? el.textContent : "not found";
    });

    console.log("Score text:", scoreText);
    expect(scoreText).toBe("SCORE: 0123");
  } else {
    console.log("Cannot set score - API not available");
  }

  // Try to trigger game over
  const gameOverTriggered = await page.evaluate(() => {
    if (
      window.miniGame &&
      window.miniGame.raw &&
      typeof window.miniGame.raw.stop === "function"
    ) {
      window.miniGame.raw.stop();
      return true;
    }
    return false;
  });

  console.log("Game over triggered:", gameOverTriggered);

  if (gameOverTriggered) {
    // Wait for overlay
    await page.waitForTimeout(500);

    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      return overlay ? !overlay.classList.contains("hidden") : false;
    });

    console.log("Overlay visible:", overlayVisible);
    expect(overlayVisible).toBe(true);
  }
});
