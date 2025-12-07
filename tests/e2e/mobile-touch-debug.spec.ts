import { test, expect, devices } from "@playwright/test";

// Type declarations for window globals
declare global {
  interface Window {
    __TEST_MODE?: boolean;
    __miniGameReady?: boolean;
    __miniGameReadyPromise?: Promise<boolean>;
    __lastMiniGameEvent?: { name: string; detail: any; time: number };
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

test.describe("Mobile Touch Debug", () => {
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

  test("debug start button behavior", async ({ page }) => {
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

    // Check initial state
    const initialState = await page.evaluate(() => {
      return {
        buttonText: document.getElementById("mini-game-start")?.textContent,
        ariaPressed: document
          .getElementById("mini-game-start")
          ?.getAttribute("aria-pressed"),
        isPlaying: (window as any).miniGame?.isPlaying?.() || false,
        isPaused: (window as any).miniGame?.isPaused?.() || false,
        hasRaw: !!(window as any).miniGame?.raw,
        rawState: (window as any).miniGame?.raw?.state,
      };
    });

    console.log("Initial state:", initialState);

    // Tap Start button
    await startButton.tap();

    // Wait a moment for state change
    await page.waitForTimeout(500);

    // Check state after tap
    const afterTapState = await page.evaluate(() => {
      return {
        buttonText: document.getElementById("mini-game-start")?.textContent,
        ariaPressed: document
          .getElementById("mini-game-start")
          ?.getAttribute("aria-pressed"),
        isPlaying: (window as any).miniGame?.isPlaying?.() || false,
        isPaused: (window as any).miniGame?.isPaused?.() || false,
        rawState: (window as any).miniGame?.raw?.state,
      };
    });

    console.log("After tap state:", afterTapState);

    // Try to start game programmatically
    await page.evaluate(() => {
      console.log("Attempting to start game programmatically...");
      if (
        (window as any).miniGame &&
        typeof (window as any).miniGame.start === "function"
      ) {
        (window as any).miniGame.start();
        console.log("Game started programmatically");
      }
    });

    await page.waitForTimeout(500);

    // Check state after programmatic start
    const afterProgrammaticState = await page.evaluate(() => {
      return {
        buttonText: document.getElementById("mini-game-start")?.textContent,
        ariaPressed: document
          .getElementById("mini-game-start")
          ?.getAttribute("aria-pressed"),
        isPlaying: (window as any).miniGame?.isPlaying?.() || false,
        isPaused: (window as any).miniGame?.isPaused?.() || false,
        rawState: (window as any).miniGame?.raw?.state,
      };
    });

    console.log("After programmatic start:", afterProgrammaticState);
  });

  test("debug touch input", async ({ page }) => {
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

    // Start game programmatically
    await page.evaluate(() => {
      if (
        (window as any).miniGame &&
        typeof (window as any).miniGame.start === "function"
      ) {
        (window as any).miniGame.start();
      }
    });

    await page.waitForTimeout(500);

    // Check initial input state
    const initialInputState = await page.evaluate(() => {
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      return {
        hasInputHandler: !!inputHandler,
        inputState: inputHandler?.getInputState?.(),
        isJumping: inputHandler?.isJumping?.(),
        isMoving: inputHandler?.isMoving?.(),
      };
    });

    console.log("Initial input state:", initialInputState);

    // Tap canvas
    const canvas = page.locator("#mini-game-canvas");
    await canvas.tap();

    await page.waitForTimeout(200);

    // Check input state after tap
    const afterTapInputState = await page.evaluate(() => {
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      return {
        inputState: inputHandler?.getInputState?.(),
        isJumping: inputHandler?.isJumping?.(),
        isMoving: inputHandler?.isMoving?.(),
        lastEvent: (window as any).__lastMiniGameEvent,
      };
    });

    console.log("After tap input state:", afterTapInputState);

    // Try trigger input programmatically
    await page.evaluate(() => {
      console.log("Triggering jump programmatically...");
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      if (inputHandler && typeof inputHandler.trigger === "function") {
        inputHandler.trigger("space");
        console.log("Jump triggered programmatically");
      }
    });

    await page.waitForTimeout(200);

    // Check input state after programmatic trigger
    const afterProgrammaticInputState = await page.evaluate(() => {
      const inputHandler = (window as any).miniGame?.raw?.inputHandler;
      return {
        inputState: inputHandler?.getInputState?.(),
        isJumping: inputHandler?.isJumping?.(),
        isMoving: inputHandler?.isMoving?.(),
        lastEvent: (window as any).__lastMiniGameEvent,
      };
    });

    console.log("After programmatic trigger:", afterProgrammaticInputState);
  });
});
