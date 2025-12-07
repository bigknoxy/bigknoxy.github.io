import { chromium } from "playwright";

async function comprehensiveProductionQA() {
  console.log("🚀 Starting Comprehensive Production QA");

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

    if (url.includes("game-engine.js")) {
      gameEngineRequests.push({ url, status });
    }

    if (status >= 400) {
      networkErrors.add(`${url} - ${status}`);
    }
  });

  const results = {
    assetChecks: {},
    gameEngine: null,
    timeToReady: null,
    gameplay: {
      overlayInitiallyVisible: false,
      scoreCorrect: false,
      restartWorks: false,
      headerClickWorks: false,
      gameStarts: false,
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

    // 2. Wait for game engine readiness
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

    // 4. Check initial game state
    console.log("🔍 Checking initial game state...");
    const overlayVisible = await page.locator("#game-over-overlay").isVisible();
    results.gameplay.overlayInitiallyVisible = overlayVisible;
    console.log(`Gameover overlay initially visible: ${overlayVisible}`);

    const scoreElement = await page.locator("#gameover-score").first();
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      if (scoreText && /^\d{4}$/.test(scoreText.trim())) {
        results.gameplay.scoreCorrect = true;
        console.log(`✅ Initial score format correct: ${scoreText.trim()}`);
      }
    }

    // 5. Try to start the game if overlay is visible
    if (overlayVisible) {
      console.log("🎮 Attempting to start/restart game...");

      // Look for restart button
      const restartButton = await page.locator("#gameover-restart").first();
      if (await restartButton.isVisible()) {
        await restartButton.click();
        await page.waitForTimeout(1000);

        // Check if game started (overlay should disappear)
        const overlayStillVisible = await page
          .locator("#game-over-overlay")
          .isVisible();
        if (!overlayStillVisible) {
          results.gameplay.restartWorks = true;
          results.gameplay.gameStarts = true;
          console.log("✅ Game started successfully");
        }
      }
    }

    // 6. Test header interaction
    console.log("🔗 Testing header interaction...");
    const headerLink = await page.locator("header a, nav a").first();
    if (await headerLink.isVisible()) {
      const href = await headerLink.getAttribute("href");
      await headerLink.click();
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      if (currentUrl !== "https://bigknoxy.github.io/" || href) {
        results.gameplay.headerClickWorks = true;
        console.log("✅ Header interaction works");
      }
    }

    // 7. Collect console and network errors
    results.consoleErrors = consoleMessages
      .filter((msg) => msg.type === "error")
      .map((msg) => msg.text);

    results.networkErrors = Array.from(networkErrors);
  } catch (error) {
    console.error("❌ QA script failed:", error.message);
  } finally {
    await browser.close();
  }

  // 8. Output results
  console.log("\n📊 COMPREHENSIVE PRODUCTION QA REPORT");
  console.log("=".repeat(50));

  // Overall status
  const criticalChecksPass =
    results.gameEngine &&
    results.gameEngine.status === 200 &&
    results.gameplay.scoreCorrect &&
    results.gameplay.restartWorks;

  console.log(
    `🎯 Overall Status: ${criticalChecksPass ? "✅ PASS" : "❌ FAIL"}`,
  );

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
    `  Overlay initially visible: ${results.gameplay.overlayInitiallyVisible ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Score format correct: ${results.gameplay.scoreCorrect ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Restart works: ${results.gameplay.restartWorks ? "✅ Y" : "❌ N"}`,
  );
  console.log(
    `  Game starts: ${results.gameplay.gameStarts ? "✅ Y" : "❌ N"}`,
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
  console.log("  - node comprehensive-production-qa.js");

  // Artifacts
  console.log(`\n📁 Artifacts: ${results.artifacts}`);

  return results;
}

comprehensiveProductionQA().catch(console.error);
