import { test, expect } from "@playwright/test";

test.describe("Live Site Debug", () => {
  test("check live site content", async ({ page }) => {
    await page.goto("https://bigknoxy.github.io");
    await page.waitForLoadState("networkidle");

    // Check if search input exists by ID
    const searchInputById = page.locator("#search-input");
    console.log("Search input by ID exists:", await searchInputById.count());

    // Check if search input exists by label
    const searchInputByLabel = page.locator('input[aria-label="Search posts"]');
    console.log(
      "Search input by label exists:",
      await searchInputByLabel.count(),
    );

    // Check all inputs
    const allInputs = page.locator('input[type="search"]');
    console.log("All search inputs:", await allInputs.count());

    // Get page content
    const content = await page.content();
    console.log("Page contains SearchBar:", content.includes("search-input"));
  });
});
