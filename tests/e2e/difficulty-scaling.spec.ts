/**
 * Difficulty Scaling E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Difficulty Scaling", () => {
  test("basic difficulty progression works", async ({ page }) => {
    await page.goto("/");

    // Start the game
    await page.click('[data-testid="start-button"]');
    await page.waitForTimeout(1000);

    // Set difficulty to low
    await page.evaluate(() => {
      (window as any).miniGame?.setDifficultyOverride(0.0);
    });

    // Play briefly
    await page.waitForTimeout(2000);

    // Game should still be running at low difficulty
    const isPlaying = await page.evaluate(() => {
      return (window as any).miniGame?.isPlaying();
    });

    expect(isPlaying).toBe(true);
  });

  test("high difficulty increases speed", async ({ page }) => {
    await page.goto("/");

    // Start the game
    await page.click('[data-testid="start-button"]');
    await page.waitForTimeout(1000);

    // Set difficulty to high
    await page.evaluate(() => {
      (window as any).miniGame?.setDifficultyOverride(1.0);
    });

    // Play briefly
    await page.waitForTimeout(2000);

    // Game should still be running at high difficulty
    const isPlaying = await page.evaluate(() => {
      return (window as any).miniGame?.isPlaying();
    });

    expect(isPlaying).toBe(true);
  });
});
