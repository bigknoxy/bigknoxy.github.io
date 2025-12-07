import { chromium } from "playwright";

async function debugConsoleErrors() {
  console.log("🔍 Debugging console errors...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error);
    console.log(`PAGE ERROR: ${error.message}`);
  });

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Try to load engine manually and capture any errors
    console.log("Attempting to load engine...");
    const loadResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.loadEngine) {
          window
            .loadEngine()
            .then(() => {
              resolve({ success: true, error: null });
            })
            .catch((err) => {
              resolve({ success: false, error: err.message || err.toString() });
            });
        } else {
          resolve({ success: false, error: "loadEngine not found" });
        }
      });
    });

    console.log("Load result:", loadResult);

    await page.waitForTimeout(2000);

    // Check final state
    const finalState = await page.evaluate(() => {
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

    console.log("Final state:", finalState);

    // Report all console messages
    console.log("\n📋 All console messages:");
    consoleMessages.forEach((msg) => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });

    if (pageErrors.length > 0) {
      console.log("\n❌ Page errors:");
      pageErrors.forEach((err) => console.log(`  ${err.message}`));
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugConsoleErrors();
