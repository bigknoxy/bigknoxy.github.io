import { test, expect } from "@playwright/test";

test.describe("MiniGame integration", () => {
  test("loads placeholder and lazy-loads engine on interaction", async ({
    page,
  }) => {
    await page.goto("/");
    // Ensure placeholder exists
    const root = await page.$("#mini-game-root");
    expect(root).not.toBeNull();

    // Click CTA to load engine
    const cta = await page.$("#mini-game-cta");
    expect(cta).not.toBeNull();
    await cta!.click();

    // Wait for ready event
    await page.waitForFunction(() => (window as any).__miniGameReady === true, {
      timeout: 5000,
    });

    // Start the game programmatically
    await page.evaluate(() => {
      return (window as any).miniGame.start();
    });

    // Wait for some score events
    await page.waitForFunction(
      () =>
        (window as any).__lastMiniGameEvent &&
        (window as any).__lastMiniGameEvent.name === "game:score",
      { timeout: 5000 },
    );

    const scoreText = await page.textContent("#mini-game-score");
    expect(scoreText).toMatch(/SCORE: \d{4}/);
  });
});
