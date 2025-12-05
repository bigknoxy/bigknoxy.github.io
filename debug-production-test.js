import { chromium } from "playwright";

async function debugProductionTest() {
  console.log("🔍 Debug production test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Check page content
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for game elements
    const gameContainer = await page.$("#mini-game-root");
    const gameCanvas = await page.$("#mini-game-canvas");
    const gameScript = await page.$('script[src*="game"]');

    console.log(`Game container: ${gameContainer ? "FOUND" : "MISSING"}`);
    console.log(`Game canvas: ${gameCanvas ? "FOUND" : "MISSING"}`);

    if (gameScript) {
      const src = await gameScript.getAttribute("src");
      console.log(`Game script src: ${src}`);

      // Check if script loads
      const response = await page.goto(`http://localhost:8787${src}`);
      console.log(`Game script status: ${response.status()}`);
    }

    // Check for GameEngine
    const engineExists = await page.evaluate(() => {
      return typeof window.GameEngine !== "undefined";
    });
    console.log(`GameEngine exists: ${engineExists}`);

    // Wait a bit and check again
    await page.waitForTimeout(3000);

    const engineExistsAfter = await page.evaluate(() => {
      return typeof window.GameEngine !== "undefined";
    });
    console.log(`GameEngine exists after 3s: ${engineExistsAfter}`);

    // Check console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    // Try to manually load game engine
    await page.evaluate(() => {
      if (window.loadEngine) {
        window.loadEngine();
      }
    });

    await page.waitForTimeout(2000);

    const finalEngineCheck = await page.evaluate(() => {
      return typeof window.GameEngine !== "undefined";
    });
    console.log(`Final GameEngine check: ${finalEngineCheck}`);
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugProductionTest();
