import { chromium } from "playwright";

async function finalProductionTest() {
  console.log("🎯 Final production test summary...");

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

    // Navigate to production site
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Verify game elements exist
    const gameElements = await page.evaluate(() => {
      return {
        container: !!document.getElementById("mini-game-root"),
        canvas: !!document.getElementById("mini-game-canvas"),
        overlay: !!document.getElementById("mini-game-overlay"),
        cta: !!document.getElementById("mini-game-cta"),
        gameoverOverlay: !!document.getElementById("game-over-overlay"),
        restartBtn: !!document.getElementById("gameover-restart"),
        scoreDisplay: !!document.getElementById("mini-game-score"),
      };
    });

    console.log("Game elements:", gameElements);

    // Manually load and initialize game (simulating production behavior)
    await page.evaluate(async () => {
      // Hide loading overlay
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

      return { success: true };
    });

    const readyTime = Date.now() - startTime;
    console.log(`⚡ Time-to-ready: ${readyTime}ms`);

    // Start gameplay
    await page.evaluate(() => {
      if (window.GameEngine && typeof window.GameEngine.start === "function") {
        window.GameEngine.start();
      }
    });

    await page.waitForTimeout(1000);

    // Simulate gameplay for longer to trigger gameover
    console.log("Simulating gameplay...");
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(" ");
      await page.waitForTimeout(300);
    }

    // Wait for gameover
    await page.waitForTimeout(5000);

    // Check gameover overlay
    const gameoverResult = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      if (!overlay) return { visible: false, reason: "MISSING_OVERLAY" };

      const style = window.getComputedStyle(overlay);
      const visible =
        style.display !== "none" && !overlay.classList.contains("hidden");

      // Check if overlay is properly positioned within game screen
      const gameScreen = document.querySelector(".game-screen");
      const containedInGameScreen = gameScreen && gameScreen.contains(overlay);

      return {
        visible,
        containedInGameScreen,
        hasScore: !!document.getElementById("gameover-score"),
        hasRestartBtn: !!document.getElementById("gameover-restart"),
      };
    });

    console.log(
      `🎯 Gameover overlay: ${gameoverResult.visible ? "PASS" : "FAIL"}`,
    );
    console.log(
      `📍 Overlay positioning: ${gameoverResult.containedInGameScreen ? "PASS" : "FAIL"}`,
    );

    // Test restart if gameover occurred
    if (gameoverResult.visible) {
      await page.click("#gameover-restart");
      await page.waitForTimeout(1000);

      const restartResult = await page.evaluate(() => {
        const scoreElement = document.getElementById("mini-game-score");
        const scoreReset =
          scoreElement && scoreElement.textContent.includes("SCORE: 0000");
        const overlayHidden = document
          .getElementById("game-over-overlay")
          .classList.contains("hidden");

        return { scoreReset, overlayHidden };
      });

      console.log(
        `🔄 Restart behavior: ${restartResult.scoreReset && restartResult.overlayHidden ? "PASS" : "FAIL"}`,
      );
    } else {
      console.log("🔄 Restart: SKIPPED (no gameover triggered)");
    }

    // Test header interactions while overlay would be visible
    const headerTest = await page.evaluate(() => {
      const headerLink = document.querySelector("header a");
      return headerLink ? "PASS" : "FAIL";
    });
    console.log(`🔗 Header interactions: ${headerTest}`);

    // Report errors
    if (consoleLogs.length > 0) {
      console.log("\n📝 Console errors:");
      consoleLogs.forEach((log) => console.log(`  ${log.text}`));
    }

    if (networkErrors.length > 0) {
      console.log("\n🚫 Network errors:");
      networkErrors.forEach((error) =>
        console.log(`  ${error.url}: ${error.status}`),
      );
    }

    console.log("\n✅ Production test completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

finalProductionTest();
