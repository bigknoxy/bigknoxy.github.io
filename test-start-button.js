import { chromium } from "playwright";

async function testStartButton() {
  console.log("🎮 Testing Start/Restart button functionality...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    console.log(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === "error") {
      consoleLogs.push({ text: msg.text() });
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkErrors.push({ url: response.url(), status: response.status() });
      console.log(`❌ ${response.url()}: ${response.status()}`);
    }
  });

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Check if start button exists and is clickable
    const startButton = page.locator("#mini-game-start");
    const startExists = await startButton.count();
    console.log(`Start button exists: ${startExists > 0}`);

    if (startExists > 0) {
      // Check if button is visible and enabled
      const isVisible = await startButton.isVisible();
      const isEnabled = await startButton.isEnabled();
      console.log(`Start button visible: ${isVisible}`);
      console.log(`Start button enabled: ${isEnabled}`);

      // Try to click start button
      await startButton.click();
      console.log("Clicked start button");

      // Wait a bit and check if game started
      await page.waitForTimeout(1000);

      // Check if miniGame API is available
      const apiCheck = await page.evaluate(() => {
        return {
          hasMiniGame: !!window.miniGame,
          hasLoadEngine: !!window.loadEngine,
          hasEngine: !!window.GameEngine,
          isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        };
      });

      console.log("API Check:", apiCheck);

      // Try to manually start game if API exists
      if (apiCheck.hasMiniGame) {
        await page.evaluate(() => {
          if (window.miniGame && typeof window.miniGame.start === "function") {
            window.miniGame.start();
          }
        });
        console.log("Manually called miniGame.start()");

        await page.waitForTimeout(1000);

        // Check if game is now playing
        const isPlaying = await page.evaluate(() => {
          return window.miniGame ? window.miniGame.isPlaying() : false;
        });
        console.log(`Game is playing: ${isPlaying}`);
      }
    }

    // Check for CTA button as well
    const ctaButton = page.locator("#mini-game-cta");
    const ctaExists = await ctaButton.count();
    console.log(`CTA button exists: ${ctaExists > 0}`);

    if (ctaExists > 0) {
      const ctaVisible = await ctaButton.isVisible();
      console.log(`CTA button visible: ${ctaVisible}`);

      if (ctaVisible) {
        await ctaButton.click();
        console.log("Clicked CTA button");
        await page.waitForTimeout(2000);

        // Check again after CTA click
        const apiCheckAfterCTA = await page.evaluate(() => {
          return {
            hasMiniGame: !!window.miniGame,
            hasLoadEngine: !!window.loadEngine,
            hasEngine: !!window.GameEngine,
            isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
          };
        });
        console.log("API Check after CTA:", apiCheckAfterCTA);
      }
    }

    // Report network errors
    if (networkErrors.length > 0) {
      console.log("\n🚫 Network errors:");
      networkErrors.forEach((error) =>
        console.log(`  ${error.url}: ${error.status}`),
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

testStartButton();
