import { chromium } from "playwright";

async function verifyTestMode() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set test mode before any scripts run
  await page.addInitScript(() => {
    window.__TEST_MODE = true;
    // Listen for the ready event and log it
    window.addEventListener("miniGame:ready", (e) => {
      console.log("miniGame:ready event received:", e.detail);
    });
  });

  const startTime = Date.now();
  let readyEventFired = false;
  let timeToReady = 0;

  // Navigate to the page
  await page.goto("http://localhost:4321");

  // Wait for the custom event directly
  try {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 10000);
        window.addEventListener(
          "miniGame:ready",
          (e) => {
            clearTimeout(timeout);
            resolve(true);
          },
          { once: true },
        );
      });
    });
    timeToReady = Date.now() - startTime;
    readyEventFired = true;
    console.log(`miniGame:ready event fired after ${timeToReady}ms`);
  } catch (error) {
    console.log("miniGame:ready event not fired within 10s:", error.message);
  }

  // Check if engine loaded by checking window.miniGame
  const engineLoaded = await page.evaluate(() => {
    return typeof window.miniGame !== "undefined" && window.miniGame !== null;
  });

  console.log("Engine loaded via window.miniGame:", engineLoaded);

  // Check overlay visibility (it should be hidden by default)
  const overlay = await page.locator("#game-over-overlay").first();
  let overlayExists = false;
  let overlayHidden = false;

  if ((await overlay.count()) > 0) {
    overlayExists = true;
    const computedStyle = await overlay.evaluate((el) => {
      return window.getComputedStyle(el);
    });
    overlayHidden = computedStyle.display === "none";

    console.log("Overlay state:", {
      exists: overlayExists,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      hiddenByDefault: overlayHidden,
    });
  } else {
    console.log("Overlay element not found");
  }

  await browser.close();

  return {
    readyEventFired,
    timeToReady,
    engineLoaded,
    overlayExists,
    overlayHidden,
  };
}

verifyTestMode()
  .then((result) => {
    console.log("\n=== VERIFICATION RESULTS ===");
    console.log("Ready event fired:", result.readyEventFired);
    console.log("Time to ready (ms):", result.timeToReady);
    console.log("Engine loaded:", result.engineLoaded);
    console.log("Overlay exists:", result.overlayExists);
    console.log("Overlay hidden by default:", result.overlayHidden);

    // Success criteria: ready event fires, engine loads, overlay exists and is hidden by default
    const success =
      result.readyEventFired &&
      result.engineLoaded &&
      result.overlayExists &&
      result.overlayHidden;
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
