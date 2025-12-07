import { chromium } from "playwright";

async function debugStartButton() {
  console.log("🔍 Debugging start button issue...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Check initial state
    const initialState = await page.evaluate(() => {
      return {
        ctaVisible:
          !!document.getElementById("mini-game-cta") &&
          document.getElementById("mini-game-cta").style.display !== "none",
        startButtonExists: !!document.getElementById("mini-game-start"),
        overlayVisible:
          !!document.getElementById("mini-game-overlay") &&
          document.getElementById("mini-game-overlay").style.display !== "none",
        hasMiniGame: !!window.miniGame,
        hasLoadEngine: !!window.loadEngine,
        engineReady: window.__miniGameReady,
      };
    });

    console.log("Initial state:", initialState);

    // Try CTA button first
    if (initialState.ctaVisible) {
      console.log("Clicking CTA button...");
      await page.click("#mini-game-cta");
      await page.waitForTimeout(2000);

      const afterCTA = await page.evaluate(() => {
        return {
          hasMiniGame: !!window.miniGame,
          isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
          score:
            document.getElementById("mini-game-score")?.textContent ||
            "NO_SCORE",
          ctaVisible:
            !!document.getElementById("mini-game-cta") &&
            document.getElementById("mini-game-cta").style.display !== "none",
        };
      });

      console.log("After CTA:", afterCTA);
    }

    // Try start button
    console.log("Clicking start button...");
    await page.click("#mini-game-start");
    await page.waitForTimeout(1000);

    const afterStart = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        score:
          document.getElementById("mini-game-score")?.textContent || "NO_SCORE",
        startButtonText:
          document.getElementById("mini-game-start")?.textContent ||
          "NO_BUTTON",
        startPressed: document
          .getElementById("mini-game-start")
          ?.getAttribute("aria-pressed"),
      };
    });

    console.log("After start:", afterStart);

    // Try manual start
    console.log("Trying manual start...");
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    await page.waitForTimeout(1000);

    const afterManual = await page.evaluate(() => {
      return {
        isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        score:
          document.getElementById("mini-game-score")?.textContent || "NO_SCORE",
      };
    });

    console.log("After manual start:", afterManual);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugStartButton();
