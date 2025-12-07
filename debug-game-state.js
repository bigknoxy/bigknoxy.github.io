import { chromium } from "playwright";

async function debugGameState() {
  const browser = await chromium.launch({ headless: false }); // Use visible for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://bigknoxy.github.io/");

  // Wait for game to load
  await page.waitForTimeout(2000);

  // Check game elements
  const gameRoot = await page.locator("#mini-game-root").count();
  const gameScreen = await page.locator("#game-screen").count();
  const overlay = await page.locator("#game-over-overlay").count();
  const scoreDisplay = await page
    .locator("#mini-game-score, #game-score")
    .count();

  console.log("Game Elements:");
  console.log(`  Game Root: ${gameRoot > 0 ? "✅" : "❌"}`);
  console.log(`  Game Screen: ${gameScreen > 0 ? "✅" : "❌"}`);
  console.log(`  Game Over Overlay: ${overlay > 0 ? "✅" : "❌"}`);
  console.log(`  Score Display: ${scoreDisplay > 0 ? "✅" : "❌"}`);

  // Try to find and click start button
  const startButtons = [
    "#start-game",
    "#mini-game-root button",
    '[data-action="start"]',
    'button:has-text("Start")',
    'button:has-text("Play")',
  ];

  for (const selector of startButtons) {
    const button = page.locator(selector).first();
    if (await button.isVisible()) {
      console.log(`Found start button: ${selector}`);
      await button.click();
      break;
    }
  }

  await page.waitForTimeout(1000);

  // Check if game is running by looking for score changes
  let initialScore = "0000";
  try {
    const scoreElement = page
      .locator("#mini-game-score, #game-score, #score-display")
      .first();
    if (await scoreElement.isVisible()) {
      initialScore = (await scoreElement.textContent()) || "0000";
      console.log(`Initial score: ${initialScore}`);
    }
  } catch (error) {
    console.log("Could not read score");
  }

  // Try to trigger gameover by calling game methods directly
  try {
    await page.evaluate(() => {
      if (window.miniGame) {
        console.log("Found miniGame object:", Object.keys(window.miniGame));
        // Try to trigger gameover
        if (window.miniGame.gameOver) {
          window.miniGame.gameOver();
        } else if (window.miniGame.raw && window.miniGame.raw.gameOver) {
          window.miniGame.raw.gameOver();
        }
      }
    });
  } catch (error) {
    console.log("Could not trigger gameover:", error.message);
  }

  await page.waitForTimeout(2000);

  // Check if overlay appeared
  const overlayVisible = await page.locator("#game-over-overlay").isVisible();
  console.log(`Game Over Overlay visible: ${overlayVisible}`);

  if (overlayVisible) {
    const finalScore = await page.locator("#gameover-score").textContent();
    console.log(`Final Score: ${finalScore}`);
  }

  await browser.close();
}

debugGameState().catch(console.error);
