import { test, expect } from "@playwright/test";

test.describe("Pagefind Direct Test", () => {
  test("test pagefind import directly", async ({ page }) => {
    await page.goto("http://localhost:4321");
    await page.waitForLoadState("networkidle");

    // Try to import pagefind directly in the page context
    const result = await page.evaluate(async () => {
      try {
        const pagefind = await import("/pagefind/pagefind.js");
        await pagefind.init();
        const search = await pagefind.search("jeet");
        return { success: true, resultCount: search.results?.length || 0 };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log("Direct import result:", result);
  });
});
