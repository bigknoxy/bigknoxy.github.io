/**
 * Quick Production Test - Game Overlay Verification
 */

import { test, expect } from "@playwright/test";

test("Production overlay test", async ({ page }) => {
  const consoleMessages: string[] = [];
  const pageErrors: Error[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error);
  });

  await page.goto("https://bigknoxy.github.io/");

  // Check if game elements exist
  const gameRoot = page.locator("#mini-game-root");
  const gameOverlay = page.locator("#game-over-overlay");
  const scoreElement = page.locator("#mini-game-score");

  console.log("Game elements check:");
  console.log(`  Game Root exists: ${(await gameRoot.count()) > 0}`);
  console.log(`  Game Over Overlay exists: ${(await gameOverlay.count()) > 0}`);
  console.log(`  Score element exists: ${(await scoreElement.count()) > 0}`);

  // Try to check if overlay is initially hidden
  const overlayVisible = await gameOverlay.isVisible();
  console.log(`  Overlay initially visible: ${overlayVisible}`);

  // Check score display
  const scoreText = await scoreElement.textContent();
  console.log(`  Initial score: ${scoreText}`);

  console.log(`Console errors: ${consoleMessages.length}`);
  console.log(`Page errors: ${pageErrors.length}`);

  if (consoleMessages.length > 0) {
    consoleMessages.forEach((msg) => console.log(`  ${msg}`));
  }
  if (pageErrors.length > 0) {
    pageErrors.forEach((err) => console.log(`  ERROR: ${err.message}`));
  }

  expect(await gameRoot.count()).toBeGreaterThan(0);
});
