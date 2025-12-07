import { chromium } from "playwright";

async function testGameplay() {
  console.log("🎮 Testing extended gameplay to trigger gameover...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:8787", { waitUntil: "networkidle" });

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Start the game using CTA button
    const ctaButton = page.locator("#mini-game-cta");
    const ctaVisible = await ctaButton.isVisible();

    if (ctaVisible) {
      await ctaButton.click();
      console.log("Clicked CTA button to start game");
    } else {
      // Try start button
      const startButton = page.locator("#mini-game-start");
      await startButton.click();
      console.log("Clicked start button to start game");
    }

    await page.waitForTimeout(1000);

    // Check if game is playing
    const isPlaying = await page.evaluate(() => {
      return window.miniGame ? window.miniGame.isPlaying() : false;
    });
    console.log(`Game is playing: ${isPlaying}`);

    if (isPlaying) {
      console.log("Starting extended gameplay...");

      // Play for longer to trigger gameover
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press(" ");
        await page.waitForTimeout(200);

        // Check if gameover occurred every 10 jumps
        if (i % 10 === 0) {
          const gameoverVisible = await page.evaluate(() => {
            const overlay = document.getElementById("game-over-overlay");
            if (!overlay) return false;
            const style = window.getComputedStyle(overlay);
            return (
              style.display !== "none" && !overlay.classList.contains("hidden")
            );
          });

          if (gameoverVisible) {
            console.log(`Gameover triggered after ${i} jumps!`);
            break;
          }
        }
      }

      // Final check for gameover
      const finalGameover = await page.evaluate(() => {
        const overlay = document.getElementById("game-over-overlay");
        if (!overlay) return { visible: false, reason: "MISSING_OVERLAY" };

        const style = window.getComputedStyle(overlay);
        const visible =
          style.display !== "none" && !overlay.classList.contains("hidden");

        return {
          visible,
          hasScore: !!document.getElementById("gameover-score"),
          hasRestartBtn: !!document.getElementById("gameover-restart"),
          scoreText: document.getElementById("gameover-score")?.textContent,
        };
      });

      console.log("Final gameover check:", finalGameover);

      if (finalGameover.visible) {
        console.log("Testing restart button...");

        // Click restart button
        await page.click("#gameover-restart");
        await page.waitForTimeout(1000);

        const restartResult = await page.evaluate(() => {
          const scoreElement = document.getElementById("mini-game-score");
          const scoreReset =
            scoreElement && scoreElement.textContent.includes("SCORE: 0000");
          const overlayHidden = document
            .getElementById("game-over-overlay")
            .classList.contains("hidden");
          const isPlaying = window.miniGame
            ? window.miniGame.isPlaying()
            : false;

          return { scoreReset, overlayHidden, isPlaying };
        });

        console.log("Restart result:", restartResult);
        console.log(
          `✅ Restart test: ${restartResult.scoreReset && restartResult.overlayHidden ? "PASS" : "FAIL"}`,
        );
      } else {
        console.log("❌ Gameover was not triggered");
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

testGameplay();
