import { test, expect } from "@playwright/test";

test.describe("MiniGame Debug Detailed", () => {
  test("debug ready state", async ({ page }) => {
    // Listen for console messages
    const logs: string[] = [];
    page.on("console", (msg) => {
      logs.push(msg.text());
      console.log("CONSOLE:", msg.text());
    });

    page.on("pageerror", (error) => {
      console.log("PAGE ERROR:", error.message);
    });

    await page.goto("http://localhost:8787");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check initial state
    const initialReady = await page.evaluate(() => {
      return (window as any).__miniGameReady;
    });
    console.log("Initial __miniGameReady:", initialReady);

    // Check if CTA exists
    const cta = await page.$("#mini-game-cta");
    console.log("CTA exists:", !!cta);

    if (cta) {
      // Check if CTA is visible
      const isVisible = await cta.isVisible();
      console.log("CTA is visible:", isVisible);

      if (isVisible) {
        // Click CTA
        console.log("Clicking CTA...");
        await cta.click();

        // Wait and check state multiple times
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(1000);
          const ready = await page.evaluate(() => {
            return (window as any).__miniGameReady;
          });
          const miniGameExists = await page.evaluate(() => {
            return typeof (window as any).miniGame !== "undefined";
          });
          console.log(
            `After ${i + 1}s: ready=${ready}, miniGameExists=${miniGameExists}`,
          );

          if (ready) break;
        }
      }
    }

    console.log("Final console logs:", logs);
  });
});
