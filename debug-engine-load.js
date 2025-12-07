import { chromium } from "playwright";

async function debugEngineLoad() {
  console.log("🔍 Debugging engine loading...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Check if engine loads automatically
    const engineState = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        hasLoadEngine: !!window.loadEngine,
        engineReady: window.__miniGameReady,
        overlayExists: !!document.getElementById("mini-game-overlay"),
        overlayDisplay: document.getElementById("mini-game-overlay")
          ? window.getComputedStyle(
              document.getElementById("mini-game-overlay"),
            ).display
          : "NO_OVERLAY",
      };
    });

    console.log("Initial engine state:", engineState);

    // Manually trigger engine load
    console.log("Manually loading engine...");
    await page.evaluate(() => {
      if (window.loadEngine) {
        window.loadEngine().then(() => {
          console.log("Engine loaded successfully");
        });
      }
    });

    await page.waitForTimeout(2000);

    const afterLoad = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        engineReady: window.__miniGameReady,
        overlayDisplay: document.getElementById("mini-game-overlay")
          ? window.getComputedStyle(
              document.getElementById("mini-game-overlay"),
            ).display
          : "NO_OVERLAY",
      };
    });

    console.log("After manual load:", afterLoad);

    // Try CTA button now
    console.log("Trying CTA button...");
    await page.click("#mini-game-cta");
    await page.waitForTimeout(2000);

    const afterCTA = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        score:
          document.getElementById("mini-game-score")?.textContent || "NO_SCORE",
      };
    });

    console.log("After CTA:", afterCTA);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugEngineLoad();
