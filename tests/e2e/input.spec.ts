import { test, expect } from "@playwright/test";

test.describe("Input Test", () => {
  test("test input directly", async ({ page }) => {
    await page.goto("http://localhost:4321");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("#search-input");
    await expect(searchInput).toBeVisible();

    // Try typing and check value
    await searchInput.fill("jeet");
    const value = await searchInput.inputValue();
    console.log("Input value after fill:", value);

    // Try input event
    await searchInput.type("test");
    const value2 = await searchInput.inputValue();
    console.log("Input value after type:", value2);
  });
});
