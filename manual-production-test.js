import { chromium } from "playwright";

async function manualProductionTest() {
  console.log("🎮 Starting manual production test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs and network errors
  const consoleLogs = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkErrors.push({ url: response.url(), status: response.status() });
    }
  });

  page.on("requestfailed", (request) => {
    networkErrors.push({
      url: request.url(),
      error: request.failure().errorText,
    });
  });

  try {
    const startTime = Date.now();

    // Navigate to production site
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game engine to load and initialize
    await page.waitForFunction(
      () => {
        return (
          window.GameEngine || document.querySelector('script[src*="game"]')
        );
      },
      { timeout: 10000 },
    );

    const readyTime = Date.now() - startTime;
    console.log(`⚡ Time-to-ready: ${readyTime}ms`);

    // Check for game engine script
    const gameScript = await page.$('script[src*="game"]');
    if (gameScript) {
      const src = await gameScript.getAttribute("src");
      const response = await page.goto(`http://localhost:8787${src}`);
      console.log(`📦 Game engine script status: ${response.status()}`);
    }

    // Wait for miniGame:ready event or GameEngine initialization
    await page.waitForFunction(
      () => {
        return (
          window.miniGameReady ||
          (window.GameEngine && window.GameEngine.initialized)
        );
      },
      { timeout: 15000 },
    );

    console.log("✅ Game engine initialized");

    // Start the game
    await page.click("#game-start-button");
    await page.waitForTimeout(1000);

    // Play until gameover (simulate for 10 seconds or until gameover)
    let gameOver = false;
    const gameOverCheck = setInterval(async () => {
      const overlay = await page.$("#game-over-overlay");
      if (overlay && (await overlay.isVisible())) {
        gameOver = true;
        clearInterval(gameOverCheck);
      }
    }, 500);

    // Simulate jumping
    for (let i = 0; i < 20 && !gameOver; i++) {
      await page.keyboard.press(" ");
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);

    // Check gameover overlay
    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      const gameScreen = document.querySelector(".game-screen");
      return (
        overlay &&
        overlay.style.display !== "none" &&
        gameScreen &&
        gameScreen.contains(overlay)
      );
    });

    console.log(
      `🎯 Gameover overlay visible: ${overlayVisible ? "PASS" : "FAIL"}`,
    );

    // Test restart functionality
    await page.click("#restart-button");
    await page.waitForTimeout(1000);

    const scoreReset = await page.evaluate(() => {
      const scoreElement = document.getElementById("game-score");
      return scoreElement && scoreElement.textContent === "0";
    });

    console.log(`🔄 Restart behavior: ${scoreReset ? "PASS" : "FAIL"}`);

    // Test header/footer interactions while overlay visible
    await page.click("#game-start-button");
    await page.waitForTimeout(2000);

    // Trigger gameover again
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(" ");
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(2000);

    // Try to click header link while overlay is visible
    const headerClickable = await page.evaluate(() => {
      const overlay = document.getElementById("game-over-overlay");
      if (overlay && overlay.style.display !== "none") {
        const headerLink = document.querySelector("header a");
        return headerLink && !headerLink.style.pointerEvents.includes("none");
      }
      return true;
    });

    console.log(`🔗 Header interactions: ${headerClickable ? "PASS" : "FAIL"}`);

    // Report console and network issues
    if (consoleLogs.length > 0) {
      console.log("📝 Console logs:");
      consoleLogs
        .filter((log) => log.type === "error" || log.type === "warning")
        .forEach((log) => {
          console.log(`  ${log.type.toUpperCase()}: ${log.text}`);
        });
    }

    if (networkErrors.length > 0) {
      console.log("🚫 Network errors:");
      networkErrors.forEach((error) => {
        console.log(`  ${error.url}: ${error.status || error.error}`);
      });
    }

    console.log("✅ Manual production test completed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

manualProductionTest();
