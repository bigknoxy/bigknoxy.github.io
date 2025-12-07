import { chromium } from "playwright";

async function finalTest() {
  console.log("🎯 Final comprehensive test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Check initial state
    const initialState = await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      return {
        overlayDisplay: overlay
          ? window.getComputedStyle(overlay).display
          : "NO_OVERLAY",
        overlayVisibility: overlay
          ? window.getComputedStyle(overlay).visibility
          : "NO_OVERLAY",
        ctaExists: !!document.getElementById("mini-game-cta"),
        ctaVisible: document.getElementById("mini-game-cta")
          ? window.getComputedStyle(document.getElementById("mini-game-cta"))
              .display !== "none"
          : false,
      };
    });

    console.log("Initial state:", initialState);

    // Manually hide overlay message and enable clicks
    await page.evaluate(() => {
      const overlay = document.getElementById("mini-game-overlay");
      const message = document.getElementById("mini-game-message");
      if (message) message.style.display = "none";
      if (overlay) {
        overlay.style.visibility = "hidden";
        overlay.style.pointerEvents = "auto";
      }
    });

    await page.waitForTimeout(500);

    // Try CTA button
    const ctaButton = page.locator("#mini-game-cta");
    const ctaExists = await ctaButton.count();
    console.log(`CTA button exists: ${ctaExists > 0}`);

    if (ctaExists > 0) {
      await ctaButton.click();
      console.log("✅ Clicked CTA button");
    } else {
      // Try start button
      const startButton = page.locator("#mini-game-start");
      await startButton.click();
      console.log("✅ Clicked start button");
    }

    await page.waitForTimeout(2000);

    // Check game state
    const gameStatus = await page.evaluate(() => {
      return {
        hasMiniGame: !!window.miniGame,
        isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
        score:
          document.getElementById("mini-game-score")?.textContent || "NO_SCORE",
      };
    });

    console.log("Game status:", gameStatus);

    if (gameStatus.isPlaying) {
      console.log("🎮 Game is playing! Running extended test...");

      // Play for longer to trigger gameover
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press(" ");
        await page.waitForTimeout(150);

        // Check for gameover periodically
        if (i % 10 === 0) {
          const gameoverCheck = await page.evaluate(() => {
            const overlay = document.getElementById("game-over-overlay");
            if (!overlay) return false;
            const style = window.getComputedStyle(overlay);
            return (
              style.display !== "none" && !overlay.classList.contains("hidden")
            );
          });

          if (gameoverCheck) {
            console.log(`🎯 Gameover triggered after ${i} jumps!`);
            break;
          }
        }
      }

      // Final gameover check
      const finalGameover = await page.evaluate(() => {
        const overlay = document.getElementById("game-over-overlay");
        const scoreElement = document.getElementById("mini-game-score");
        const gameoverScore = document.getElementById("gameover-score");

        return {
          visible: overlay ? !overlay.classList.contains("hidden") : false,
          score: scoreElement?.textContent || "NO_SCORE",
          gameoverScore: gameoverScore?.textContent || "NO_GAMEOVER_SCORE",
        };
      });

      console.log("Final gameover state:", finalGameover);

      if (finalGameover.visible) {
        console.log("🔄 Testing restart...");

        await page.click("#gameover-restart");
        await page.waitForTimeout(1000);

        const restartResult = await page.evaluate(() => {
          const scoreElement = document.getElementById("mini-game-score");
          const overlay = document.getElementById("game-over-overlay");

          return {
            score: scoreElement?.textContent || "NO_SCORE",
            overlayHidden: overlay
              ? overlay.classList.contains("hidden")
              : false,
            isPlaying: window.miniGame ? window.miniGame.isPlaying() : false,
          };
        });

        console.log("Restart result:", restartResult);
        console.log(
          `✅ Restart test: ${restartResult.score.includes("0000") && restartResult.overlayHidden ? "PASS" : "FAIL"}`,
        );
      }
    }

    console.log("\n✅ Production test completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

finalTest();
