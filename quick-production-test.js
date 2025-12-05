import { chromium } from "playwright";

async function quickProductionTest() {
  console.log("⚡ Quick production test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleLogs.push({ text: msg.text() });
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkErrors.push({ url: response.url(), status: response.status() });
    }
  });

  try {
    const startTime = Date.now();

    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Manually trigger game load
    await page.evaluate(async () => {
      // Hide overlay
      const overlay = document.getElementById("mini-game-overlay");
      if (overlay) overlay.style.display = "none";

      // Load game engine
      const module = await import("/game/game-engine.js");
      const GameEngine = module.GameEngine;

      const canvas = document.getElementById("mini-game-canvas");
      const config = {
        width: 240,
        height: 216,
        targetFPS: 60,
        gravity: 0.8,
        jumpPower: -12,
        gameSpeed: 4,
        spawnRate: 0.02,
        canvas: canvas,
        audio: { enabled: true, volume: 0.3 },
        render: { pixelated: true, doubleBuffering: true },
      };

      const engine = new GameEngine(config);
      if (typeof engine.initialize === "function") engine.initialize();

      window.GameEngine = engine;
      window.__miniGameReady = true;

      // Dispatch ready event
      window.dispatchEvent(
        new CustomEvent("miniGame:ready", { detail: { ready: true } }),
      );
    });

    const readyTime = Date.now() - startTime;
    console.log(`⚡ Time-to-ready: ${readyTime}ms`);

    // Start the game
    await page.evaluate(() => {
      if (window.GameEngine && typeof window.GameEngine.start === "function") {
        window.GameEngine.start();
      }
    });

    await page.waitForTimeout(1000);

    // Simulate jumping
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(" ");
      await page.waitForTimeout(400);
    }

    // Wait for potential gameover
    await page.waitForTimeout(3000);

    // Check gameover overlay
    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      if (!overlay) return false;
      const style = window.getComputedStyle(overlay);
      return style.display !== "none" && !overlay.classList.contains("hidden");
    });

    console.log(`🎯 Gameover overlay: ${overlayVisible ? "PASS" : "FAIL"}`);

    // Test restart if overlay is visible
    if (overlayVisible) {
      await page.click("#gameover-restart");
      await page.waitForTimeout(1000);

      const scoreReset = await page.evaluate(() => {
        const scoreElement = document.getElementById("mini-game-score");
        return scoreElement && scoreElement.textContent.includes("SCORE: 0000");
      });

      console.log(`🔄 Restart: ${scoreReset ? "PASS" : "FAIL"}`);
    } else {
      console.log("🔄 Restart: SKIPPED (no gameover)");
    }

    // Report any errors
    if (consoleLogs.length > 0) {
      console.log("📝 Console errors:");
      consoleLogs.forEach((log) => console.log(`  ${log.text}`));
    }

    if (networkErrors.length > 0) {
      console.log("🚫 Network errors:");
      networkErrors.forEach((error) =>
        console.log(`  ${error.url}: ${error.status}`),
      );
    }

    console.log("✅ Quick test completed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

quickProductionTest();
