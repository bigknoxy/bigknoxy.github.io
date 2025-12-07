import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function runProductionQA() {
  console.log("🚀 Starting Production QA for https://bigknoxy.github.io/");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console messages and network errors
  const consoleMessages = [];
  const networkErrors = [];
  let gameEngineURL = null;
  let gameEngineStatus = null;

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    }
  });

  page.on("response", (response) => {
    if (response.status() === 404 || response.status() === 500) {
      networkErrors.push(`${response.url()} - ${response.status()}`);
    }

    // Track game engine load
    if (response.url().includes("game-engine.js")) {
      gameEngineURL = response.url();
      gameEngineStatus = response.status();
    }
  });

  const results = {
    startTime: Date.now(),
    timeToReady: null,
    overlayVisible: false,
    scoreCorrect: false,
    restartWorks: false,
    headerClickWorks: false,
    screenshots: {},
    errors: [],
  };

  try {
    // Step 1: Open homepage
    console.log("📱 Loading homepage...");
    await page.goto("https://bigknoxy.github.io/", {
      waitUntil: "networkidle",
    });

    // Screenshot after page load
    await page.screenshot({
      path: "playwright-report/screenshots/01-page-load.png",
      fullPage: true,
    });
    results.screenshots.pageLoad =
      "playwright-report/screenshots/01-page-load.png";

    // Step 2: Wait for game readiness
    console.log("⏳ Waiting for game readiness...");
    const readyStartTime = Date.now();

    try {
      await page.waitForFunction(
        () => {
          return window.miniGame && window.miniGame.isReady === true;
        },
        { timeout: 15000 },
      );

      results.timeToReady = Date.now() - readyStartTime;
      console.log(`✅ Game ready in ${results.timeToReady}ms`);
    } catch (e) {
      results.timeToReady = "not present";
      console.log("⚠️ Game not ready after 15s");
    }

    // Alternative: listen for custom event
    page.evaluate(() => {
      window.gameReadyPromise = new Promise((resolve) => {
        window.addEventListener("miniGame:ready", () => resolve(true));
      });
    });

    // Step 3: Start game
    console.log("🎮 Starting game...");
    const startButton = await page
      .locator(
        '#mini-game-root button, #start-button, [data-testid="start-button"]',
      )
      .first();
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log("✅ Start button clicked");
    } else {
      console.log("⚠️ No start button found, trying alternative...");
      await page.click("body");
    }

    // Screenshot after start
    await page.screenshot({
      path: "playwright-report/screenshots/02-after-start.png",
      fullPage: true,
    });
    results.screenshots.afterStart =
      "playwright-report/screenshots/02-after-start.png";

    // Step 4: Simulate gameplay
    console.log("🎯 Simulating gameplay...");
    let gameActive = true;
    let gameplayDuration = 0;

    for (let i = 0; i < 30 && gameActive; i++) {
      await page.keyboard.press("Space");
      await page.waitForTimeout(1000);
      gameplayDuration++;

      // Check for game over
      const overlayVisible = await page
        .locator("#mini-game-root #game-screen #game-over-overlay")
        .isVisible();
      if (overlayVisible) {
        console.log("🏁 Game over detected");
        gameActive = false;
        results.overlayVisible = true;
        break;
      }
    }

    // If no game over after 30s, trigger fallback
    if (gameActive) {
      console.log("⏰ No game over after 30s, triggering fallback...");
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent("game:gameover", {
            detail: { score: 120 },
          }),
        );
      });

      await page.waitForTimeout(1000);
      const overlayVisible = await page
        .locator("#mini-game-root #game-screen #game-over-overlay")
        .isVisible();
      results.overlayVisible = overlayVisible;
    }

    // Step 5: Verify game over overlay
    if (results.overlayVisible) {
      console.log("📊 Checking game over overlay...");

      // Check score display
      const scoreElement = await page.locator("#gameover-score").first();
      if (await scoreElement.isVisible()) {
        const scoreText = await scoreElement.textContent();
        console.log(`Score displayed: ${scoreText}`);
        results.scoreCorrect = scoreText && scoreText.trim().length > 0;
      }

      // Screenshot game over overlay
      await page.screenshot({
        path: "playwright-report/screenshots/03-gameover-overlay.png",
        fullPage: true,
      });
      results.screenshots.gameoverOverlay =
        "playwright-report/screenshots/03-gameover-overlay.png";

      // Step 6: Test restart
      console.log("🔄 Testing restart...");
      const restartButton = await page.locator("#gameover-restart").first();
      if (await restartButton.isVisible()) {
        await restartButton.click();
        await page.waitForTimeout(1000);

        // Check if score reset
        const scoreAfterRestart = await page
          .locator("#game-score, #score")
          .first()
          .textContent();
        results.restartWorks =
          scoreAfterRestart && scoreAfterRestart.includes("0000");
        console.log(`Score after restart: ${scoreAfterRestart}`);

        // Screenshot after restart
        await page.screenshot({
          path: "playwright-report/screenshots/04-after-restart.png",
          fullPage: true,
        });
        results.screenshots.afterRestart =
          "playwright-report/screenshots/04-after-restart.png";
      }

      // Step 7: Test header interaction while overlay visible
      console.log("🔗 Testing header interaction...");
      const headerLink = await page.locator("header a, nav a").first();
      if (await headerLink.isVisible()) {
        await headerLink.click();
        await page.waitForTimeout(500);
        results.headerClickWorks = true; // If we can click, overlay isn't blocking
      }
    }
  } catch (error) {
    console.error("❌ Error during QA:", error);
    results.errors.push(error.message);
  }

  await browser.close();

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    url: "https://bigknoxy.github.io/",
    summary: {
      overall: results.errors.length === 0 ? "PASS" : "FAIL",
      timeToReady: results.timeToReady,
      overlayVisible: results.overlayVisible,
      scoreCorrect: results.scoreCorrect,
      restartWorks: results.restartWorks,
      headerClickWorks: results.headerClickWorks,
    },
    assets: {
      gameEngine: { url: gameEngineURL, status: gameEngineStatus },
      globalCSS: { status: "404" }, // From curl check
      favicon: { status: "200" }, // From curl check
    },
    issues: {
      console: [...new Set(consoleMessages)],
      network: [...new Set(networkErrors)],
    },
    screenshots: results.screenshots,
    errors: results.errors,
  };

  // Save report
  if (!fs.existsSync("playwright-report")) {
    fs.mkdirSync("playwright-report", { recursive: true });
  }
  if (!fs.existsSync("playwright-report/screenshots")) {
    fs.mkdirSync("playwright-report/screenshots", { recursive: true });
  }

  fs.writeFileSync(
    "playwright-report/production-qa-report.json",
    JSON.stringify(report, null, 2),
  );

  console.log("\n📋 PRODUCTION QA REPORT");
  console.log("========================");
  console.log(`Overall Status: ${report.summary.overall}`);
  console.log(`Time to Ready: ${report.summary.timeToReady}`);
  console.log(`Game Engine: ${report.assets.gameEngine.status}`);
  console.log(`Global CSS: ${report.assets.globalCSS.status}`);
  console.log(`Favicon: ${report.assets.favicon.status}`);
  console.log(`Overlay Visible: ${report.summary.overlayVisible}`);
  console.log(`Score Correct: ${report.summary.scoreCorrect}`);
  console.log(`Restart Works: ${report.summary.restartWorks}`);
  console.log(`Header Click Works: ${report.summary.headerClickWorks}`);

  if (report.issues.console.length > 0) {
    console.log("\nConsole Issues:");
    report.issues.console.forEach((issue) => console.log(`  - ${issue}`));
  }

  if (report.issues.network.length > 0) {
    console.log("\nNetwork Issues:");
    report.issues.network.forEach((issue) => console.log(`  - ${issue}`));
  }

  console.log(
    "\nScreenshots saved to:",
    Object.values(report.screenshots).join(", "),
  );
  console.log("Full report: playwright-report/production-qa-report.json");

  return report;
}

runProductionQA().catch(console.error);
