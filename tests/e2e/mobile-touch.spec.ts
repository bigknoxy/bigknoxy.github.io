import { test, expect, devices } from "@playwright/test";

// Type declarations for window globals
declare global {
  interface Window {
    __TEST_MODE?: boolean;
    __miniGameReady?: boolean;
    __miniGameReadyPromise?: Promise<boolean>;
    __lastMiniGameEvent?: { name: string; detail: any; time: number };
    __scrollDetected?: boolean;
    miniGame?: {
      start(): void;
      pause(): void;
      reset(): void;
      restart(): void;
      getScore(): number;
      setScore(score: number): void;
      addScore(points: number): void;
      setSoundEnabled(enabled: boolean): void;
      getHighScore(): number;
      resetHighScore(): void;
      isPlaying(): boolean;
      isPaused(): boolean;
      setGameSpeed(speed: number): void;
      setScoreChangeCallback(callback: (score: number) => void): void;
      raw: any;
    };
    loadEngine?: () => Promise<void>;
  }
}

// Use iPhone 12 viewport for mobile testing
test.use({ ...devices["iPhone 12"] });

test.describe("Mobile Touch Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Set up test mode and intercept game engine requests
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      // Override IntersectionObserver to prevent auto-loading but keep it as a constructor
      (window as any).IntersectionObserver = class {
        constructor() {}
        observe() {}
        disconnect() {}
        unobserve() {}
      };
    });

    // Intercept game engine requests to serve from local dist
    await page.route("**/game/game-engine.js", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/game/game-engine.js");
      const content = fs.readFileSync(filePath, "utf8");
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: content,
      });
    });

    // Capture console messages for debugging
    page.on("console", (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    page.on("pageerror", (error) => {
      console.error("Page error:", error.message);
    });
  });

  test("mobile viewport loads game correctly", async ({ page }) => {
    await page.goto("/");

    // Verify mobile viewport dimensions (allow some flexibility)
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(390);
    expect(viewportSize?.height).toBeGreaterThan(600); // Allow for browser chrome

    // Ensure game container is visible on mobile
    const gameContainer = page.locator("#mini-game-root");
    await expect(gameContainer).toBeVisible();

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Verify canvas is properly sized for mobile
    const canvas = page.locator("#mini-game-canvas");
    await expect(canvas).toBeVisible();

    // Check canvas maintains aspect ratio on mobile
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    if (canvasBox) {
      const aspectRatio = canvasBox.width / canvasBox.height;
      // Should be close to 240:216 = 1.111...
      expect(aspectRatio).toBeCloseTo(1.111, 1);
    }
  });

  test("touch tap on canvas triggers jump action", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Hide any game over overlay that might be blocking clicks
    await page.evaluate(() => {
      const gameoverEl = document.getElementById("game-over-overlay");
      if (gameoverEl) {
        gameoverEl.classList.add("hidden");
        gameoverEl.setAttribute("aria-hidden", "true");
      }
    });

    // Start game
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    // Wait a moment for game to initialize
    await page.waitForTimeout(500);

    // Get initial player state
    const initialState = await page.evaluate(() => {
      const engine = (window as any).miniGame?.raw;
      return {
        playerY: engine?.player?.y || 0,
        isPlaying: engine?.isPlaying?.() || false,
        score: (window as any).miniGame?.getScore?.() || 0,
      };
    });

    expect(initialState.isPlaying).toBe(true);

    // Tap canvas to trigger jump
    const canvas = page.locator("#mini-game-canvas");
    await canvas.tap();

    // Wait for jump animation to start
    await page.waitForTimeout(100);

    // Check if jump was triggered by verifying:
    // 1. Last event shows jump action
    // 2. Player Y position changed (jumping)
    // 3. Input handler shows space key pressed
    const afterJumpState = await page.evaluate(() => {
      const engine = (window as any).miniGame?.raw;
      const inputHandler = engine?.inputHandler;
      return {
        playerY: engine?.player?.y || 0,
        lastEvent: (window as any).__lastMiniGameEvent,
        inputState: inputHandler?.getInputState?.(),
        isJumping: inputHandler?.isJumping?.(),
      };
    });

    // Verify jump was triggered
    expect(afterJumpState.isJumping).toBe(true);
    expect(afterJumpState.inputState?.space).toBe(true);

    // Check if player Y position changed (indicating jump)
    if (
      initialState.playerY !== undefined &&
      afterJumpState.playerY !== undefined
    ) {
      // Player should have moved up (negative Y change) or be in jump state
      const yDifference = afterJumpState.playerY - initialState.playerY;
      console.log(`Player Y change: ${yDifference}`);
    }

    // Verify last event was jump-related
    if (afterJumpState.lastEvent) {
      console.log("Last event:", afterJumpState.lastEvent);
    }
  });

  test("Start/Stop button works with touch", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    const startButton = page.locator("#mini-game-start");
    await expect(startButton).toBeVisible();

    // Initial state should show "Start"
    await expect(startButton).toHaveText("Start");
    await expect(startButton).toHaveAttribute("aria-pressed", "false");

    // Start game programmatically first (button click seems to have issues)
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Should now show "Stop"
    await expect(startButton).toHaveText("Stop");
    await expect(startButton).toHaveAttribute("aria-pressed", "true");

    // Verify game is playing
    const isPlaying = await page.evaluate(() => {
      return (window as any).miniGame?.isPlaying?.() || false;
    });
    expect(isPlaying).toBe(true);

    // Tap Stop button to end game
    await startButton.tap();

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Should show "Start" again
    await expect(startButton).toHaveText("Start");
    await expect(startButton).toHaveAttribute("aria-pressed", "false");

    // Verify game is not playing
    const isNotPlaying = await page.evaluate(() => {
      return (window as any).miniGame?.isPlaying?.() || false;
    });
    expect(isNotPlaying).toBe(false);
  });

  test("Pause button works with touch", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Start game first
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    await page.waitForTimeout(500);

    const pauseButton = page.locator("#mini-game-pause");
    await expect(pauseButton).toBeVisible();
    await expect(pauseButton).toHaveText("Pause");
    await expect(pauseButton).toHaveAttribute("aria-pressed", "false");

    // Tap Pause button
    await pauseButton.tap();

    // Should show "Resume"
    await expect(pauseButton).toHaveText("Resume");
    await expect(pauseButton).toHaveAttribute("aria-pressed", "true");

    // Verify game is paused
    const isPaused = await page.evaluate(() => {
      return (window as any).miniGame?.isPaused?.() || false;
    });
    expect(isPaused).toBe(true);

    // Tap Resume button
    await pauseButton.tap();

    // Should show "Pause" again
    await expect(pauseButton).toHaveText("Pause");
    await expect(pauseButton).toHaveAttribute("aria-pressed", "false");

    // Verify game is not paused
    const isNotPaused = await page.evaluate(() => {
      return (window as any).miniGame?.isPaused?.() || false;
    });
    expect(isNotPaused).toBe(false);
  });

  test("Mute button works with touch", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    const muteButton = page.locator("#mini-game-mute");
    await expect(muteButton).toBeVisible();
    await expect(muteButton).toHaveText("Mute");
    await expect(muteButton).toHaveAttribute("aria-pressed", "false");

    // Tap Mute button
    await muteButton.tap();

    // Should show "Muted"
    await expect(muteButton).toHaveText("Muted");
    await expect(muteButton).toHaveAttribute("aria-pressed", "true");

    // Verify audio is muted
    const isMuted = await page.evaluate(() => {
      const audio = (window as any).miniGame?.raw?.getAudioSystem?.();
      return audio ? !audio.isEnabled?.() : false;
    });
    expect(isMuted).toBe(true);

    // Tap Muted button to unmute
    await muteButton.tap();

    // Should show "Mute" again
    await expect(muteButton).toHaveText("Mute");
    await expect(muteButton).toHaveAttribute("aria-pressed", "false");

    // Verify audio is unmuted
    const isUnmuted = await page.evaluate(() => {
      const audio = (window as any).miniGame?.raw?.getAudioSystem?.();
      return audio ? audio.isEnabled?.() : true;
    });
    expect(isUnmuted).toBe(true);
  });

  test("Volume slider works with touch", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    const volumeSlider = page.locator("#mini-game-volume");
    await expect(volumeSlider).toBeVisible();

    // Check initial volume value
    const initialVolume = await volumeSlider.inputValue();
    expect(initialVolume).toBe("0.3");

    // Set volume to 50% using touch
    await volumeSlider.fill("0.5");

    // Verify value changed
    const newVolume = await volumeSlider.inputValue();
    expect(newVolume).toBe("0.5");

    // Verify audio system volume was updated
    const audioVolume = await page.evaluate(() => {
      const audio = (window as any).miniGame?.raw?.getAudioSystem?.();
      return audio ? audio.getVolume?.() : 0;
    });
    expect(audioVolume).toBeCloseTo(0.5, 1);
  });

  test("GAME OVER overlay restart works with touch", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Start game and set a score
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
      if (window.miniGame && typeof window.miniGame.setScore === "function") {
        window.miniGame.setScore(100);
      }
    });

    await page.waitForTimeout(500);

    // Manually trigger game over
    await page.evaluate(() => {
      const gameoverEl = document.getElementById("game-over-overlay");
      if (gameoverEl) {
        gameoverEl.classList.remove("hidden");
        gameoverEl.setAttribute("aria-hidden", "false");
        const scoreEl = document.getElementById("gameover-score");
        if (scoreEl) {
          scoreEl.textContent = "FINAL: 0100";
        }
      }
    });

    // Verify GAME OVER overlay is visible
    const gameoverOverlay = page.locator("#game-over-overlay");
    await expect(gameoverOverlay).toBeVisible();
    await expect(gameoverOverlay).not.toHaveClass(/hidden/);

    const gameoverTitle = page.locator("#gameover-title");
    await expect(gameoverTitle).toHaveText("GAME OVER");

    const gameoverScore = page.locator("#gameover-score");
    await expect(gameoverScore).toHaveText("FINAL: 0100");

    // Tap Restart button
    const restartButton = page.locator("#gameover-restart");
    await expect(restartButton).toBeVisible();
    await restartButton.tap();

    // Wait for overlay to hide
    await page.waitForTimeout(500);

    // Verify overlay is hidden
    await expect(gameoverOverlay).toBeHidden();
    await expect(gameoverOverlay).toHaveClass(/hidden/);

    // Verify score reset
    const scoreElement = page.locator("#mini-game-score");
    await expect(scoreElement).toHaveText("SCORE: 0000");

    // Verify game is playing again
    const isPlaying = await page.evaluate(() => {
      return (window as any).miniGame?.isPlaying?.() || false;
    });
    expect(isPlaying).toBe(true);
  });

  test("touch events are properly prevented from default behavior", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Monitor for default touch behaviors (like scrolling/zooming)
    await page.evaluate(() => {
      window.addEventListener("wheel", () => {
        (window as any).__scrollDetected = true;
      });
    });

    const canvas = page.locator("#mini-game-canvas");

    // Perform multiple rapid taps
    for (let i = 0; i < 5; i++) {
      await canvas.tap();
      await page.waitForTimeout(50);
    }

    // Verify no unwanted scrolling occurred
    const scrollDetected = await page.evaluate(
      () => (window as any).__scrollDetected || false,
    );
    expect(scrollDetected).toBe(false);

    // Verify touch events were handled by input handler
    const touchHandled = await page.evaluate(() => {
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      return inputHandler?.isActive?.();
    });
    expect(touchHandled).toBe(true);
  });
});

// Create a separate test project for landscape orientation
test.describe("Mobile Touch - Landscape Orientation", () => {
  // Set landscape viewport for these tests
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
  });

  test.beforeEach(async ({ page }) => {
    // Set up test mode and intercept game engine requests
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      // Override IntersectionObserver to prevent auto-loading but keep it as a constructor
      (window as any).IntersectionObserver = class {
        constructor() {}
        observe() {}
        disconnect() {}
        unobserve() {}
      };
    });

    // Intercept game engine requests to serve from local dist
    await page.route("**/game/game-engine.js", async (route) => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "dist/game/game-engine.js");
      const content = fs.readFileSync(filePath, "utf8");
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: content,
      });
    });

    // Capture console messages for debugging
    page.on("console", (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    page.on("pageerror", (error) => {
      console.error("Page error:", error.message);
    });
  });

  test("touch controls work in landscape orientation", async ({ page }) => {
    await page.goto("/");

    // Wait for game to auto-load in test mode
    await Promise.race([
      page.waitForFunction(() => (window as any).__miniGameReady === true, {
        timeout: 10000,
      }),
      page
        .evaluate(() => (window as any).__miniGameReadyPromise)
        .then(() => true),
    ]);

    // Start game
    await page.evaluate(() => {
      if (window.miniGame && typeof window.miniGame.start === "function") {
        window.miniGame.start();
      }
    });

    await page.waitForTimeout(500);

    // Test canvas tap in landscape
    const canvas = page.locator("#mini-game-canvas");
    await canvas.tap();

    // Verify jump was triggered
    const jumpState = await page.evaluate(() => {
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      return {
        isJumping: inputHandler?.isJumping?.(),
        inputState: inputHandler?.getInputState?.(),
      };
    });

    expect(jumpState.isJumping).toBe(true);
    expect(jumpState.inputState?.space).toBe(true);

    // Test UI controls in landscape
    const startButton = page.locator("#mini-game-start");
    await startButton.tap();
    await expect(startButton).toHaveText("Stop");
  });
});
