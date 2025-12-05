import { chromium } from "playwright";

async function fullProductionTest() {
  console.log("🎮 Full production test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
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

    // Check game elements
    const gameContainer = await page.$("#mini-game-root");
    const gameCanvas = await page.$("#mini-game-canvas");
    const startButton = await page.$("#mini-game-cta");

    console.log(`Game container: ${gameContainer ? "FOUND" : "MISSING"}`);
    console.log(`Game canvas: ${gameCanvas ? "FOUND" : "MISSING"}`);
    console.log(`Start button: ${startButton ? "FOUND" : "MISSING"}`);

    // Click start button to load the game
    if (startButton) {
      await startButton.click();
      console.log("Clicked start button");
    }

    // Wait for game engine to load
    await page.waitForTimeout(2000);

    const engineExists = await page.evaluate(() => {
      return typeof window.GameEngine !== "undefined";
    });
    console.log(`GameEngine exists after click: ${engineExists}`);

    // Wait for miniGame:ready event
    await page.waitForEvent("miniGame:ready", { timeout: 10000 });
    const readyTime = Date.now() - startTime;
    console.log(`⚡ Time-to-ready: ${readyTime}ms`);

    // Check if game is ready
    const gameReady = await page.evaluate(() => {
      return window.__miniGameReady === true;
    });
    console.log(`Game ready state: ${gameReady}`);

    // Start the game
    await page.click("#mini-game-start");
    await page.waitForTimeout(1000);

    // Play for a few seconds
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(" ");
      await page.waitForTimeout(500);
    }

    // Check if gameover overlay appears
    await page.waitForTimeout(3000);
    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      return (
        overlay &&
        overlay.style.display !== "none" &&
        !overlay.classList.contains("hidden")
      );
    });
    console.log(
      `🎯 Gameover overlay visible: ${overlayVisible ? "PASS" : "FAIL"}`,
    );

    // Test restart
    if (overlayVisible) {
      await page.click("#gameover-restart");
      await page.waitForTimeout(1000);

      const scoreReset = await page.evaluate(() => {
        const scoreElement = document.getElementById("mini-game-score");
        return scoreElement && scoreElement.textContent.includes("SCORE: 0000");
      });
      console.log(`🔄 Restart behavior: ${scoreReset ? "PASS" : "FAIL"}`);
    }

    // Report errors
    if (consoleLogs.length > 0) {
      console.log("📝 Console errors/warnings:");
      consoleLogs.forEach((log) => {
        console.log(`  ${log.type.toUpperCase()}: ${log.text}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log("🚫 Network errors:");
      networkErrors.forEach((error) => {
        console.log(`  ${error.url}: ${error.status}`);
      });
    }

    console.log("✅ Full production test completed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

fullProductionTest();
