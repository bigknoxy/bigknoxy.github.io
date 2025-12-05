import { chromium } from "playwright";

async function checkOverlayTest() {
  console.log("🔍 Checking overlay state...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Check overlay visibility
    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      if (!overlay) return "MISSING";
      return {
        display: window.getComputedStyle(overlay).display,
        visible: overlay.offsetParent !== null,
      };
    });

    console.log("Overlay state:", overlayVisible);

    // Check button visibility
    const buttonVisible = await page.evaluate(() => {
      const button = document.getElementById("mini-game-cta");
      if (!button) return "MISSING";
      return {
        display: window.getComputedStyle(button).display,
        visible: button.offsetParent !== null,
        pointerEvents: window.getComputedStyle(button).pointerEvents,
      };
    });

    console.log("Button state:", buttonVisible);

    // Try to manually trigger game load
    await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    });

    // Now check if we can load the game
    const gameLoaded = await page.evaluate(async () => {
      try {
        const module = await import("/game/game-engine.js");
        return module.GameEngine ? "SUCCESS" : "NO_ENGINE";
      } catch (e) {
        return `ERROR: ${e.message}`;
      }
    });

    console.log("Game load result:", gameLoaded);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

checkOverlayTest();
