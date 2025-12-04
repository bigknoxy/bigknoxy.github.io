import { test, expect } from "@playwright/test";

test.describe("SearchBar Debug", () => {
  test("debug pagefind loading", async ({ page }) => {
    // Listen for console messages
    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push(msg.text());
    });

    page.on("pageerror", (error) => {
      console.log("Page error:", error.message);
    });

    await page.goto("http://localhost:4321");
    await page.waitForLoadState("networkidle");

    // Check if search input exists
    const searchInput = page.locator("#search-input");
    await expect(searchInput).toBeVisible();

    // Wait a bit for scripts to load
    await page.waitForTimeout(2000);

    // Check if pagefind is loaded
    const pagefindLoaded = await page.evaluate(() => {
      return typeof (window as any).pagefind !== "undefined";
    });
    console.log("Pagefind loaded:", pagefindLoaded);
    console.log("Console messages:", consoleMessages);

    // Try to manually trigger pagefind load
    const pagefindLoadResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "/pagefind/pagefind.js";
        script.onload = () => {
          resolve({
            success: true,
            pagefindExists: typeof (window as any).pagefind !== "undefined",
          });
        };
        script.onerror = (error) => {
          resolve({ success: false, error: error.toString() });
        };
        document.head.appendChild(script);
      });
    });

    console.log("Manual pagefind load result:", pagefindLoadResult);

    // Now check if pagefind is loaded
    const pagefindLoadedAfter = await page.evaluate(() => {
      return typeof (window as any).pagefind !== "undefined";
    });
    console.log("Pagefind loaded after manual load:", pagefindLoadedAfter);
  });
});
