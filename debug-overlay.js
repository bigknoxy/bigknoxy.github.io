import { chromium } from "playwright";

async function debugOverlay() {
  console.log("🔍 Debugging overlay visibility...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Check overlay visibility in detail
    const overlayDebug = await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      const cta = document.getElementById("mini-game-cta");

      return {
        overlayExists: !!overlay,
        overlayDisplay: overlay
          ? window.getComputedStyle(overlay).display
          : "NO_OVERLAY",
        overlayVisibility: overlay
          ? window.getComputedStyle(overlay).visibility
          : "NO_OVERLAY",
        overlayPointerEvents: overlay
          ? window.getComputedStyle(overlay).pointerEvents
          : "NO_OVERLAY",
        ctaExists: !!cta,
        ctaDisplay: cta ? window.getComputedStyle(cta).display : "NO_CTA",
        ctaVisibility: cta ? window.getComputedStyle(cta).visibility : "NO_CTA",
        ctaPointerEvents: cta
          ? window.getComputedStyle(cta).pointerEvents
          : "NO_CTA",
        ctaParent: cta ? cta.parentElement?.tagName : "NO_PARENT",
        ctaParentDisplay:
          cta && cta.parentElement
            ? window.getComputedStyle(cta.parentElement).display
            : "NO_PARENT",
      };
    });

    console.log("Overlay debug:", overlayDebug);

    // Try to manually hide overlay and start game
    console.log("Manually hiding overlay...");
    await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      if (overlay) overlay.style.display = "none";
    });

    await page.waitForTimeout(1000);

    // Now try CTA button
    console.log("Trying CTA button after hiding overlay...");
    await page.click("#mini-game-cta");
    await page.waitForTimeout(2000);

    const afterCTA = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        score:
          document.getElementById("mini-game-score")?.textContent || "NO_SCORE",
      };
    });

    console.log("After CTA:", afterCTA);

    if (afterCTA.hasMiniGame && !afterCTA.isPlaying) {
      console.log("Manually starting game...");
      await page.evaluate(() => {
        if (window.miniGame && typeof window.miniGame.start === "function") {
          window.miniGame.start();
        }
      });

      await page.waitForTimeout(1000);

      const afterManual = await page.evaluate(() => {
        return {
          isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
          score:
            document.getElementById("mini-game-score")?.textContent ||
            "NO_SCORE",
        };
      });

      console.log("After manual start:", afterManual);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

debugOverlay();
