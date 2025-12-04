import { test, expect } from "@playwright/test";

test.describe("SearchBar Component", () => {
  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    page.on("console", (msg) => {
      console.log("CONSOLE:", msg.type(), msg.text());
    });

    await page.goto("/");
    // Wait for page to fully load including scripts
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test('should show results for query "jeet"', async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await expect(searchInput).toBeVisible();

    // Check if pagefind is loaded
    const pagefindLoaded = await page.evaluate(() => {
      return typeof (window as any).pagefind !== "undefined";
    });
    console.log("Pagefind loaded:", pagefindLoaded);

    await searchInput.fill("jeet");

    // Wait for debounce and search results
    await page.waitForTimeout(1000);

    // Debug: check results container content
    const resultsContent = await page.locator("#search-results").textContent();
    console.log("Results content:", resultsContent);

    // Check that results container is visible
    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    // Check that results contain "jeet" related content
    const results = page.locator('[role="listitem"]');
    await expect(results).toHaveCount(1);

    const resultLink = page.locator('a[data-index="0"]');
    await expect(resultLink).toBeVisible();
    const title = await resultLink.locator("div").first().textContent();
    expect(title?.toLowerCase()).toContain("projects");
  });

  test("should handle ArrowDown/ArrowUp navigation and Enter activation", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");

    // Wait for results
    await page.waitForTimeout(1000);

    // ArrowDown should focus first result
    await searchInput.press("ArrowDown");
    const firstResult = page.locator('a[data-index="0"]');
    await expect(firstResult).toBeFocused();

    // ArrowDown again should stay on first result (only one result)
    await firstResult.press("ArrowDown");
    await expect(firstResult).toBeFocused();

    // ArrowUp should return to input
    await firstResult.press("ArrowUp");
    await expect(searchInput).toBeFocused();

    // ArrowDown to focus result again
    await searchInput.press("ArrowDown");
    await expect(firstResult).toBeFocused();

    // Enter should navigate (we'll check href exists)
    const href = await firstResult.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("/projects/");
  });

  test("should clear results on Escape", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify results are visible
    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    // Press Escape to clear
    await searchInput.press("Escape");

    // Results should be hidden
    await expect(resultsContainer).toBeHidden();

    // Input should be focused and cleared
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue("");
  });

  test("should show fallback when pagefind.js returns 404", async ({
    page,
  }) => {
    // Intercept pagefind.js request and make it fail
    await page.route("**/pagefind/pagefind.js", (route) => {
      route.fulfill({
        status: 404,
        contentType: "text/plain",
        body: "Not Found",
      });
    });

    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("test");

    // Wait for error state
    await page.waitForTimeout(1000);

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    // Should show error message with reload button
    await expect(resultsContainer).toContainText(
      "Search unavailable — try reloading.",
    );

    const reloadButton = page.locator("#search-reload");
    await expect(reloadButton).toBeVisible();
  });

  test('should show "Searching..." indicator during query', async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search posts");

    // Slow down the search response to see the loading state
    await page.route("**/pagefind/**", (route) => {
      setTimeout(() => route.continue(), 200);
    });

    await searchInput.fill("jeet");

    // Should show searching state immediately
    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toContainText("Searching...");

    // Wait for results to replace searching state
    await page.waitForTimeout(500);
    await expect(resultsContainer).not.toContainText("Searching...");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await expect(searchInput).toHaveAttribute("aria-label", "Search posts");

    await searchInput.fill("jeet");
    await page.waitForTimeout(1000);

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toHaveAttribute("aria-live", "polite");

    const list = page.locator('[role="list"]');
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute("aria-label", "Search results");

    const listItems = page.locator('[role="listitem"]');
    await expect(listItems).toHaveCount(1);
  });

  test("should not search for queries shorter than 2 characters", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("j");

    // Wait for debounce
    await page.waitForTimeout(500);

    // Results should remain hidden
    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeHidden();
  });

  test("should hide results when clicking outside", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");

    // Wait for results
    await page.waitForTimeout(1000);

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    // Click outside the search component
    await page.click("body", { position: { x: 10, y: 10 } });

    // Results should be hidden
    await expect(resultsContainer).toBeHidden();
  });
});
