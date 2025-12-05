import { chromium } from "playwright";

async function quickTest() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === "error") {
      console.log("ERROR:", msg.text());
    }
  });

  // Set test mode before any scripts run
  await page.addInitScript(() => {
    window.__TEST_MODE = true;
    console.log("TEST_MODE set to true");
  });

  const startTime = Date.now();

  // Navigate to the page
  await page.goto("http://localhost:4321");

  // Wait a bit and check what's available
  await page.waitForTimeout(3000);

  const diagnostics = await page.evaluate(() => {
    return {
      testMode: window.__TEST_MODE,
      miniGameReady: window.__miniGameReady,
      hasMiniGame: typeof window.miniGame !== "undefined",
      hasReadyPromise: typeof window.__miniGameReadyPromise !== "undefined",
      lastEvent: window.__lastMiniGameEvent || null,
      gameEngineExists: typeof window.GameEngine !== "undefined",
      canvasExists: !!document.getElementById("mini-game-canvas"),
      rootExists: !!document.getElementById("mini-game-root"),
    };
  });

  console.log("Diagnostics after 3s:", diagnostics);
  console.log("Console messages:", consoleMessages.slice(-10));

  await browser.close();

  return diagnostics;
}

quickTest()
  .then((result) => {
    console.log("\n=== QUICK TEST RESULTS ===");
    console.log("TEST_MODE:", result.testMode);
    console.log("miniGameReady:", result.miniGameReady);
    console.log("hasMiniGame:", result.hasMiniGame);
    console.log("hasReadyPromise:", result.hasReadyPromise);
    console.log("lastEvent:", result.lastEvent);
    console.log("gameEngineExists:", result.gameEngineExists);
    console.log("canvasExists:", result.canvasExists);
    console.log("rootExists:", result.rootExists);
  })
  .catch((error) => {
    console.error("Quick test failed:", error);
  });
