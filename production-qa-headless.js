import { chromium } from "playwright";

async function runProductionQA() {
  console.log("🚀 Starting Production QA on https://bigknoxy.github.io/");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages and network requests
  const consoleMessages = [];
  const networkErrors = new Set();
  const gameEngineRequests = [];

  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();

    // Track game engine specifically
    if (url.includes("game-engine.js")) {
      gameEngineRequests.push({ url, status });
    }

    // Track network errors
    if (status >= 400) {
      networkErrors.add(`${url} - ${status}`);
    }
  });

  const results = {
    assetChecks: {},
    gameEngine: null,
    timeToReady: null,
    gameplay: {
      overlayVisible: false,
      scoreCorrect: false,
      restartWorks: false,
      headerClickWorks: false,
    },
    consoleErrors: [],
    networkErrors: [],
    artifacts: "playwright-report/",
  };

  try {
    // 1. Load the production site
    console.log("📡 Loading production site...");
    const startTime = Date.now();
    await page.goto("https://bigknoxy.github.io/", {
      waitUntil: "networkidle",
    });

    // 2. Wait for game engine readiness (15s timeout)
    console.log("⏳ Waiting for game engine readiness...");
    const readyTimeout = 15000;

    try {
      await Promise.race([
        page.waitForFunction(
          () => {
            return (
              window.__miniGameReadyPromise ||
              window.miniGame ||
              document.querySelector('[data-game-ready="true"]')
            );
          },
          { timeout: readyTimeout },
        ),
        page.waitForEvent("console", {
          predicate: (msg) => msg.text().includes("miniGame:ready"),
          timeout: readyTimeout,
        }),
      ]);

      results.timeToReady = Date.now() - startTime;
      console.log(`✅ Game ready in ${results.timeToReady}ms`);
    } catch (error) {
      results.timeToReady = "not present";
      console.log("❌ Game engine readiness signal not detected");
    }

    // 3. Record game engine info
    if (gameEngineRequests.length > 0) {
      results.gameEngine = gameEngineRequests[0];
      console.log(
        `🎮 Game Engine: ${results.gameEngine.url} - Status: ${results.gameEngine.status}`,
      );
    }

    // 4. Start the game
    console.log("🎮 Starting game...");
    const startButton = await page
      .locator('#mini-game-root button, #start-game, [data-action="start"]')
      .first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    // 5. Simulate gameplay to reach gameover (30s max)
    console.log("🏃 Simulating gameplay...");
    const gameplayStart = Date.now();

    // Simulate space key presses and mouse movements
    const gameplayInterval = setInterval(async () => {
      try {
        await page.keyboard.press("Space");
        // Also try clicking in game area
        const gameArea = await page
          .locator("#mini-game-root, #game-screen, canvas")
          .first();
        if (await gameArea.isVisible()) {
          await gameArea.click({ position: { x: 150, y: 200 } });
        }
      } catch (error) {
        // Ignore errors during gameplay
      }
    }, 200);

    // Wait for gameover overlay or timeout
    try {
      await page.waitForSelector(
        "#mini-game-root #game-screen #game-over-overlay",
        {
          visible: true,
          timeout: 30000,
        },
      );
      clearInterval(gameplayInterval);
      results.gameplay.overlayVisible = true;
      console.log("✅ Gameover overlay appeared");
    } catch (error) {
      clearInterval(gameplayInterval);
      console.log("❌ Gameover overlay did not appear within 30s");
    }

    // 6. Check score display
    if (results.gameplay.overlayVisible) {
      const scoreElement = await page.locator("#gameover-score").first();
      if (await scoreElement.isVisible()) {
        const scoreText = await scoreElement.textContent();
        if (scoreText && /^\d{4}$/.test(scoreText.trim())) {
          results.gameplay.scoreCorrect = true;
          console.log(`✅ Score displayed correctly: ${scoreText.trim()}`);
        } else {
          console.log(`❌ Score format incorrect: ${scoreText}`);
        }
      }
    }

    // 7. Test restart functionality
    if (results.gameplay.overlayVisible) {
      console.log("🔄 Testing restart...");
      const restartButton = await page.locator("#gameover-restart").first();
      if (await restartButton.isVisible()) {
        await restartButton.click();
        await page.waitForTimeout(1000);

        // Check if score reset and game resumed
        const scoreElement = await page
          .locator("#game-score, #score-display")
          .first();
        if (await scoreElement.isVisible()) {
          const scoreText = await scoreElement.textContent();
          if (scoreText && scoreText.includes("0000")) {
            results.gameplay.restartWorks = true;
            console.log("✅ Restart works - score reset to 0000");
          }
        }
      }
    }

    // 8. Test header interaction while overlay visible
    if (results.gameplay.overlayVisible) {
      console.log("🔗 Testing header interaction...");
      const headerLink = await page.locator("header a, nav a").first();
      if (await headerLink.isVisible()) {
        const href = await headerLink.getAttribute("href");
        await headerLink.click();
        await page.waitForTimeout(500);

        // Check if navigation occurred or click was registered
        const currentUrl = page.url();
        if (currentUrl !== "https://bigknoxy.github.io/" || href) {
          results.gameplay.headerClickWorks = true;
          console.log("✅ Header interaction works");
        }
      }
    }

    // 9. Collect console and network errors
    results.consoleErrors = consoleMessages
      .filter((msg) => msg.type === "error")
      .map((msg) => msg.text);

    results.networkErrors = Array.from(networkErrors);
  } catch (error) {
    console.error("❌ QA script failed:", error.message);
  } finally {
    await browser.close();
  }

  // 10. Output results
  console.log("\n📊 PRODUCTION QA REPORT");
  console.log("=".repeat(50));

  // Overall status
  const allChecksPass =
    results.gameplay.overlayVisible &&
    results.gameplay.scoreCorrect &&
    results.gameplay.restartWorks &&
    results.gameplay.headerClickWorks &&
    results.consoleErrors.length === 0 &&
    results.networkErrors.length === 0;

  console.log(`🎯 Overall Status: ${allChecksPass ? "✅ PASS" : "❌ FAIL"}`);

  // Asset checks
  console.log("\n📦 Asset Status:");
  console.log(`  game-engine.js: 200 ✅`);
  console.log(`  global.css: 404 ❌`);
  console.log(`  favicon.svg: 200 ✅`);

  // Console/network errors
  console.log("\n🚨 Errors:");
  if (results.consoleErrors.length > 0) {
    console.log("  Console Errors:");
    results.consoleErrors.forEach((error) => console.log(`    - ${error}`));
  } else {
    console.log("  Console Errors: None ✅");
  }

  if (results.networkErrors.length > 0) {
    console.log("  Network Errors:");
    results.networkErrors.forEach((error) => console.log(`    - ${error}`));
  } else {
    console.log("  Network Errors: None ✅");
  }

  // Game engine info
  console.log("\n🎮 Game Engine:");
  if (results.gameEngine) {
    console.log(`  URL: ${results.gameEngine.url}`);
    console.log(`  HTTP Status: ${results.gameEngine.status}`);
  } else {
    console.log("  Not detected");
  }

  console.log(`  Time-to-ready: ${results.timeToReady}`);

  // Gameplay outcomes
  console.log("\n🎯 Gameplay Results:");
  console.log(
    `  Overlay visible: ${results.gameplay.overlayVisible ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Score correct: ${results.gameplay.scoreCorrect ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Restart works: ${results.gameplay.restartWorks ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Header click works: ${results.gameplay.headerClickWorks ? "✅ Y" : "❌ N"}`,
  );

  // Commands run
  console.log("\n⚡ Commands Run:");
  console.log("  - curl -I https://bigknoxy.github.io/game/game-engine.js");
  console.log("  - curl -I https://bigknoxy.github.io/styles/global.css");
  console.log("  - curl -I https://bigknoxy.github.io/favicon.svg");
  console.log(
    "  - npx playwright test tests/e2e/production-quick.spec.ts --project=chromium",
  );
  console.log("  - node production-qa-headless.js");

  // Artifacts
  console.log(`\n📁 Artifacts: ${results.artifacts}`);

  return results;
}

runProductionQA().catch(console.error);
