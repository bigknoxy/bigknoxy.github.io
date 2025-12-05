import { test, expect } from "@playwright/test";

test.describe("MiniGame Debug", () => {
  test("should load page and find game elements", async ({ page }) => {
    await page.goto("http://localhost:8787");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if basic elements exist
    const root = await page.$("#mini-game-root");
    expect(root).not.toBeNull();

    const cta = await page.$("#mini-game-cta");
    expect(cta).not.toBeNull();

    const canvas = await page.$("#mini-game-canvas");
    expect(canvas).not.toBeNull();

    // Click CTA and wait a bit
    if (cta) {
      await cta.click();
    }

    // Wait for any potential loading
    await page.waitForTimeout(3000);

    // Check console for errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      logs.push(msg.text());
    });

    // Wait a bit more
    await page.waitForTimeout(2000);

    console.log("Console logs:", logs);

    // Take screenshot
    await page.screenshot({
      path: "test-results/debug-screenshot.png",
      fullPage: true,
    });

    // Check if window.miniGame exists
    const miniGameExists = await page.evaluate(() => {
      return typeof (window as any).miniGame !== "undefined";
    });

    console.log("miniGame exists:", miniGameExists);

    // Check if __miniGameReady exists
    const readyExists = await page.evaluate(() => {
      return typeof (window as any).__miniGameReady !== "undefined";
    });

    console.log("__miniGameReady exists:", readyExists);

    if (readyExists) {
      const readyValue = await page.evaluate(() => {
        return (window as any).__miniGameReady;
      });
      console.log("__miniGameReady value:", readyValue);
    }
  });
});
