import { test, expect } from "@playwright/test";

/**
 * Terminal Runner — the inline canvas game on the home page.
 *
 * The game deliberately exposes no test API, so these tests drive it like a
 * real user (keyboard/canvas clicks) and assert through the only persisted
 * signals: the high-score footer (#tr-hiscore-display) and localStorage.
 *
 * Deterministic collision: a player that never jumps must hit the first
 * spawned obstacle (~3s after start), which ends the run and — on a new
 * record — writes localStorage['termRunHS'].
 */

const HS_KEY = "termRunHS";

async function readHighScore(page: any): Promise<number | null> {
  return page.evaluate((key: string) => {
    const v = localStorage.getItem(key);
    return v === null ? null : parseInt(v, 10);
  }, HS_KEY);
}

async function waitUntilGameEnded(page: any): Promise<void> {
  await page.waitForFunction(
    (key: string) => localStorage.getItem(key) !== null,
    HS_KEY,
    { timeout: 20000 },
  );
}

test.describe("Terminal Runner game", () => {
  let pageErrors: string[];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await page.goto("/");
    await page.waitForSelector("#terminal-runner-canvas");
    await page.evaluate((key: string) => localStorage.removeItem(key), HS_KEY);
  });

  test("renders an animated idle canvas without errors", async ({ page }) => {
    const canvas = page.locator("#terminal-runner-canvas");
    await expect(canvas).toBeVisible();

    const size = await canvas.evaluate((c) => ({
      width: c.width,
      height: c.height,
    }));
    expect(size).toEqual({ width: 480, height: 270 });

    // Idle screen animates (blinking prompt) — frames must differ
    const frame1 = await canvas.evaluate((c) => c.toDataURL());
    await page.waitForTimeout(800);
    const frame2 = await canvas.evaluate((c) => c.toDataURL());
    expect(frame2).not.toBe(frame1);

    // High-score footer starts at the (cleared) stored best
    await expect(page.locator("#tr-hiscore-display")).toHaveText("BEST: 0000");

    expect(pageErrors).toEqual([]);
  });

  test("space starts the game; a grounded run dies and persists the high score", async ({
    page,
  }) => {
    const canvas = page.locator("#terminal-runner-canvas");
    await canvas.focus();
    await page.keyboard.press("Space");

    await waitUntilGameEnded(page);

    const hs = await readHighScore(page);
    expect(hs).not.toBeNull();
    expect(hs as number).toBeGreaterThan(0);

    // Footer display stays in sync with the persisted best
    await expect(page.locator("#tr-hiscore-display")).toHaveText(
      "BEST: " + String(hs).padStart(4, "0"),
    );

    expect(pageErrors).toEqual([]);
  });

  test("canvas click starts the game; space restarts after game over", async ({
    page,
  }) => {
    const canvas = page.locator("#terminal-runner-canvas");

    // Mouse/tap path starts the run
    await canvas.click();
    await waitUntilGameEnded(page);

    const firstHs = (await readHighScore(page)) as number;
    expect(firstHs).toBeGreaterThan(0);

    // Space on the GAME OVER screen starts a fresh run
    await canvas.focus();
    await page.keyboard.press("Space");

    // Let the second run play out (player never jumps -> dies again)
    await page.waitForTimeout(10000);

    // Restart must not crash; the record is only ever raised, never raised then lost
    const secondHs = (await readHighScore(page)) as number;
    expect(secondHs).toBeGreaterThanOrEqual(firstHs);
    await expect(page.locator("#tr-hiscore-display")).toHaveText(
      "BEST: " + String(secondHs).padStart(4, "0"),
    );

    expect(pageErrors).toEqual([]);
  });
});
