import { chromium } from "playwright";

async function quickProductionTest() {
  console.log("⚡ Quick production test...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Start game using CTA button (which should load engine and start)
    const ctaButton = page.locator("#mini-game-cta");
    const ctaVisible = await ctaButton.isVisible();

    if (ctaVisible) {
      await ctaButton.click();
      console.log("✅ Clicked CTA button");
    } else {
      // Try start button
      const startButton = page.locator("#mini-game-start");
      await startButton.click();
      console.log("✅ Clicked start button");
    }

    await page.waitForTimeout(1000);

    // Check if game is playing
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
      console.log("🎮 Game is playing, simulating jumps...");

      // Jump to increase score and potentially trigger gameover
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press(" ");
        await page.waitForTimeout(200);
      }

      // Check final state
      const finalState = await page.evaluate(() => {
        const overlay = document.getElementById("game-over-overlay");
        const scoreElement = document.getElementById("mini-game-score");
        const gameoverScore = document.getElementById("gameover-score");

        return {
          score: scoreElement?.textContent || "NO_SCORE",
          gameoverVisible: overlay
            ? !overlay.classList.contains("hidden")
            : false,
          gameoverScore: gameoverScore?.textContent || "NO_GAMEOVER_SCORE",
        };
      });

      console.log("Final state:", finalState);

      if (finalState.gameoverVisible) {
        console.log("🎯 Gameover triggered! Testing restart...");

        await page.click("#gameover-restart");
        await page.waitForTimeout(1000);

        const restartState = await page.evaluate(() => {
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

        console.log("Restart state:", restartState);
        console.log(
          `✅ Restart test: ${restartState.score.includes("0000") && restartState.overlayHidden ? "PASS" : "FAIL"}`,
        );
      } else {
        console.log("ℹ️ Gameover not triggered, but game is functional");
      }
    } else {
      console.log("❌ Game failed to start");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

quickProductionTest();
