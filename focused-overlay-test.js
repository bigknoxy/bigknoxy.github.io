import { chromium } from "playwright";

async function focusedOverlayVerification() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable test mode
  await page.addInitScript(() => {
    window.__TEST_MODE = true;
  });

  const results = {
    timeToReady: null,
    timeToVisible: null,
    boundingBoxCheck: "FAIL",
    pointerEventsCheck: "FAIL",
    focusRestartResult: "FAIL",
    headerClickResult: "FAIL",
    errors: [],
  };

  try {
    console.log("Navigating to http://localhost:8787");
    await page.goto("http://localhost:8787");

    // Wait for mini game ready
    const readyStart = Date.now();
    await page.waitForFunction(() => window.__miniGameReady === true, {
      timeout: 15000,
    });
    results.timeToReady = Date.now() - readyStart;
    console.log(`Time to ready: ${results.timeToReady}ms`);

    // Check initial overlay state
    const overlayExists = await page
      .locator("#mini-game-root #game-screen #game-over-overlay")
      .isVisible();
    if (!overlayExists) {
      results.errors.push("Overlay element not found in DOM");
    }

    const ariaHidden = await page
      .locator("#mini-game-root #game-screen #game-over-overlay")
      .getAttribute("aria-hidden");
    if (ariaHidden !== "true") {
      results.errors.push(`Expected aria-hidden='true', got '${ariaHidden}'`);
    }

    // Dispatch game over event
    console.log("Dispatching game:gameover event");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("game:gameover", { detail: { score: 1234 } }),
      );
    });

    // Wait for overlay to be visible
    const visibleStart = Date.now();
    await page
      .locator("#mini-game-root #game-screen #game-over-overlay")
      .waitFor({ state: "visible", timeout: 5000 });
    results.timeToVisible = Date.now() - visibleStart;
    console.log(`Time to visible: ${results.timeToVisible}ms`);

    // Check pointer events
    const wrapperPointerEvents = await page
      .locator("#game-over-overlay")
      .evaluate((el) => window.getComputedStyle(el).pointerEvents);
    const panelPointerEvents = await page
      .locator("#game-over-overlay .gameover-panel")
      .evaluate((el) => window.getComputedStyle(el).pointerEvents);

    if (wrapperPointerEvents === "none" && panelPointerEvents === "auto") {
      results.pointerEventsCheck = "PASS";
    } else {
      results.errors.push(
        `Pointer events: wrapper=${wrapperPointerEvents}, panel=${panelPointerEvents}`,
      );
    }

    // Check bounding box containment
    const gameScreenBox = await page.locator("#game-screen").boundingBox();
    const overlayPanelBox = await page
      .locator("#game-over-overlay .gameover-panel")
      .boundingBox();

    if (gameScreenBox && overlayPanelBox) {
      const contained =
        overlayPanelBox.x >= gameScreenBox.x &&
        overlayPanelBox.y >= gameScreenBox.y &&
        overlayPanelBox.x + overlayPanelBox.width <=
          gameScreenBox.x + gameScreenBox.width &&
        overlayPanelBox.y + overlayPanelBox.height <=
          gameScreenBox.y + gameScreenBox.height;

      if (contained) {
        results.boundingBoxCheck = "PASS";
      } else {
        results.errors.push(
          `Overlay not contained: gameScreen=${JSON.stringify(gameScreenBox)}, overlay=${JSON.stringify(overlayPanelBox)}`,
        );
      }
    } else {
      results.errors.push("Could not get bounding boxes");
    }

    // Test restart functionality
    console.log("Testing restart functionality");
    await page.click("#gameover-restart");

    // Wait a moment for restart to process
    await page.waitForTimeout(1000);

    // Check if game state is PLAY and score reset
    const gameState = await page.evaluate(() => {
      const engine = window.gameEngine;
      return engine ? engine.getState() : null;
    });

    const score = await page.evaluate(() => {
      const engine = window.gameEngine;
      return engine ? engine.getScore() : null;
    });

    const canvasFocused = await page
      .locator("#mini-game-canvas")
      .evaluate((el) => document.activeElement === el);

    if (gameState === "PLAY" && score === 0 && canvasFocused) {
      results.focusRestartResult = "PASS";
    } else {
      results.errors.push(
        `Restart check: state=${gameState}, score=${score}, canvasFocused=${canvasFocused}`,
      );
    }

    // Test header click while overlay visible
    console.log("Testing header click while overlay visible");
    // Trigger game over again to show overlay
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("game:gameover", { detail: { score: 1234 } }),
      );
    });
    await page.waitForTimeout(500);

    // Try to click header link
    let headerClicked = false;
    page.on("request", (request) => {
      if (
        request.url().includes("/projects") ||
        request.url().includes("/blog")
      ) {
        headerClicked = true;
      }
    });

    await page.click('a[href*="/projects"], a[href*="/blog"]');
    await page.waitForTimeout(500);

    if (headerClicked) {
      results.headerClickResult = "PASS";
    } else {
      results.errors.push("Header click was blocked or not detected");
    }

    // Accessibility checks
    const role = await page.locator("#game-over-overlay").getAttribute("role");
    const ariaModal = await page
      .locator("#game-over-overlay")
      .getAttribute("aria-modal");
    const scoreAriaLive = await page
      .locator("#game-score")
      .getAttribute("aria-live");

    if (role !== "dialog" || ariaModal !== "true") {
      results.errors.push(
        `Accessibility: role=${role}, aria-modal=${ariaModal}`,
      );
    }

    if (scoreAriaLive !== "assertive") {
      results.errors.push(
        `Score aria-live=${scoreAriaLive}, expected 'assertive'`,
      );
    }
  } catch (error) {
    results.errors.push(`Test execution error: ${error.message}`);
  }

  await browser.close();
  return results;
}

focusedOverlayVerification()
  .then((results) => {
    console.log("\n=== FOCUSED OVERLAY VERIFICATION RESULTS ===");
    console.log(`Time to ready: ${results.timeToReady}ms`);
    console.log(`Time to visible: ${results.timeToVisible}ms`);
    console.log(`Bounding box check: ${results.boundingBoxCheck}`);
    console.log(`Pointer events check: ${results.pointerEventsCheck}`);
    console.log(`Focus/Restart result: ${results.focusRestartResult}`);
    console.log(`Header click result: ${results.headerClickResult}`);

    if (results.errors.length > 0) {
      console.log("\nErrors:");
      results.errors.forEach((error) => console.log(`- ${error}`));
    }

    process.exit(results.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
