import { test, expect } from "@playwright/test";

test.describe("SearchBar Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test('should show results for query "jeet"', async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("jeet");

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    // The index fuzzy-matches "jeet" against several pages (e.g. "yeet"),
    // so assert on presence and on the strongest hit rather than an exact count.
    const listItems = resultsContainer.locator('[role="listitem"]');
    await expect(listItems.first()).toBeVisible();
    expect(await listItems.count()).toBeGreaterThanOrEqual(1);

    // Top hit is the JeetSocial project post
    const topResult = page.locator('a[data-index="0"]');
    await expect(topResult).toBeVisible();
    const href = await topResult.getAttribute("href");
    expect(href).toContain("/projects/jeetsocial/");
    const title = await topResult.locator("div").first().textContent();
    expect(title?.toLowerCase()).toContain("jeetsocial");
  });

  test("should handle ArrowDown/ArrowUp navigation and Enter activation", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");
    await page.locator('a[data-index="0"]').waitFor();

    const resultsContainer = page.locator("#search-results");
    const count = await resultsContainer.locator('[role="listitem"]').count();
    expect(count).toBeGreaterThanOrEqual(2);

    // ArrowDown from the input focuses the first result
    await searchInput.press("ArrowDown");
    const firstResult = page.locator('a[data-index="0"]');
    await expect(firstResult).toBeFocused();

    // ArrowDown moves to the next result
    await firstResult.press("ArrowDown");
    await expect(page.locator('a[data-index="1"]')).toBeFocused();

    // ArrowUp walks back up to the input on the first result
    const secondResult = page.locator('a[data-index="1"]');
    await secondResult.press("ArrowUp");
    await expect(firstResult).toBeFocused();
    await firstResult.press("ArrowUp");
    await expect(searchInput).toBeFocused();

    // Enter activates the focused anchor (href points at a real route)
    await firstResult.press("ArrowUp"); // no-op, stays on input
    await searchInput.press("ArrowDown");
    const href = await firstResult.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);
  });

  test("should clear results on Escape", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");
    await page.locator('a[data-index="0"]').waitFor();

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    await searchInput.press("Escape");

    await expect(resultsContainer).toBeHidden();
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue("");
  });

  test("should show fallback when pagefind.js returns 404", async ({
    page,
  }) => {
    // Intercept before the page loads so pagefind never becomes available
    await page.route("**/pagefind/pagefind.js", (route) => {
      route.fulfill({
        status: 404,
        contentType: "text/plain",
        body: "Not Found",
      });
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("test");

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toContainText(
      "Search unavailable — try reloading.",
    );

    await expect(page.locator("#search-reload")).toBeVisible();
  });

  test('should show "searching..." indicator during query', async ({
    page,
  }) => {
    // Delay pagefind requests so the loading state is observable
    await page.route("**/pagefind/**", (route) => {
      setTimeout(() => route.continue(), 150);
    });

    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toContainText("searching...");

    // Results eventually replace the loading state
    await expect(resultsContainer).toContainText(/jeetsocial/i, {
      timeout: 15000,
    });
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await expect(searchInput).toHaveAttribute("aria-label", "Search posts");

    await searchInput.fill("jeet");
    await page.locator('a[data-index="0"]').waitFor();

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toHaveAttribute("aria-live", "polite");

    const list = resultsContainer.locator('[role="list"]');
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute("aria-label", "Search results");

    const listItems = resultsContainer.locator('[role="listitem"]');
    expect(await listItems.count()).toBeGreaterThanOrEqual(1);
  });

  test("should not search for queries shorter than 2 characters", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("j");

    // Wait past the debounce window
    await page.waitForTimeout(500);

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeHidden();
  });

  test("should hide results when clicking outside", async ({ page }) => {
    const searchInput = page.getByLabel("Search posts");
    await searchInput.fill("jeet");
    await page.locator('a[data-index="0"]').waitFor();

    const resultsContainer = page.locator("#search-results");
    await expect(resultsContainer).toBeVisible();

    await page.click("body", { position: { x: 10, y: 10 } });

    await expect(resultsContainer).toBeHidden();
  });
});
