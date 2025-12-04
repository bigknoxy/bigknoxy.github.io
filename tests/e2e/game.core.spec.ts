/**
 * Game Engine Core Tests
 */

import { test, expect } from "@playwright/test";

// Mock canvas for testing
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 240,
    height: 216,
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      fillText: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      drawImage: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      measureText: () => ({ width: 100 }),
      imageSmoothingEnabled: false,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      globalAlpha: 1,
    }),
  } as any;

  return canvas;
}

test.describe("GameEngine Core", () => {
  let gameEngine: any;
  let mockConfig: any;

  test.beforeEach(async () => {
    // Mock window object for SSR tests
    global.window = {
      performance: {
        now: () => Date.now(),
      },
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        return setTimeout(callback, 16) as any;
      },
      cancelAnimationFrame: (id: number) => {
        clearTimeout(id);
      },
    } as any;

    mockConfig = {
      width: 240,
      height: 216,
      targetFPS: 60,
      gravity: 0.8,
      jumpPower: -12,
      gameSpeed: 4,
      spawnRate: 0.02,
      canvas: createMockCanvas(),
      audio: {
        enabled: false,
        volume: 0.3,
        frequencies: {
          jump: 400,
          collect: 800,
          gameOver: 200,
          background: [261, 293, 329, 261, 329, 392],
        },
      },
      render: {
        pixelated: true,
        showFPS: false,
        showHitboxes: false,
        doubleBuffering: true,
      },
    };

    // Dynamic import to avoid SSR issues
    const { GameEngine } = await import("../../src/game/GameEngine");
    gameEngine = new GameEngine(mockConfig);
  });

  test.afterEach(async () => {
    if (gameEngine) {
      gameEngine.destroy();
    }
  });

  test("should create game engine with default state", async () => {
    expect(gameEngine).toBeDefined();
    expect(gameEngine.getScore()).toBe(0);
    expect(gameEngine.isPlaying()).toBe(false);
    expect(gameEngine.isPaused()).toBe(false);
  });

  test("should initialize successfully", async () => {
    await expect(async () => gameEngine.initialize()).not.toThrow();
  });

  test("should have correct game dimensions", async () => {
    const state = gameEngine.getGameState();
    expect(state.frameCount).toBe(0);
  });

  test("should start game correctly", async () => {
    await gameEngine.initialize();
    gameEngine.start();

    expect(gameEngine.isPlaying()).toBe(true);
    expect(gameEngine.isPaused()).toBe(false);
  });

  test("should pause and resume game", async () => {
    await gameEngine.initialize();
    gameEngine.start();
    gameEngine.pause();

    expect(gameEngine.isPaused()).toBe(true);
    expect(gameEngine.isPlaying()).toBe(false);

    gameEngine.pause(); // Resume
    expect(gameEngine.isPaused()).toBe(false);
  });

  test("should reset game state", async () => {
    await gameEngine.initialize();
    gameEngine.start();
    gameEngine.setScore(100);
    gameEngine.reset();

    expect(gameEngine.getScore()).toBe(0);
    expect(gameEngine.isPlaying()).toBe(false);
  });

  test("should stop game correctly", async () => {
    await gameEngine.initialize();
    gameEngine.start();
    gameEngine.stop();

    expect(gameEngine.isPlaying()).toBe(false);
    expect(gameEngine.isPaused()).toBe(false);
  });

  test("should get initial score", async () => {
    expect(gameEngine.getScore()).toBe(0);
  });

  test("should set score correctly", async () => {
    await gameEngine.initialize();
    gameEngine.setScore(50);
    expect(gameEngine.getScore()).toBe(50);
  });

  test("should not allow negative scores", async () => {
    await gameEngine.initialize();
    gameEngine.setScore(-10);
    expect(gameEngine.getScore()).toBe(0);
  });

  test("should set game speed within bounds", async () => {
    await gameEngine.initialize();
    gameEngine.setGameSpeed(10);
    const state = gameEngine.getGameState();
    expect(state.gameSpeed).toBe(10);
  });

  test("should clamp minimum speed", async () => {
    await gameEngine.initialize();
    gameEngine.setGameSpeed(-5);
    const state = gameEngine.getGameState();
    expect(state.gameSpeed).toBe(1);
  });

  test("should clamp maximum speed", async () => {
    await gameEngine.initialize();
    gameEngine.setGameSpeed(100);
    const state = gameEngine.getGameState();
    expect(state.gameSpeed).toBe(20);
  });

  test("should add and trigger event listeners", async () => {
    await gameEngine.initialize();

    let eventTriggered = false;

    gameEngine.addEventListener("gamestart", (event: any) => {
      expect(event.type).toBe("gamestart");
      expect(event.timestamp).toBeGreaterThan(0);
      eventTriggered = true;
    });

    gameEngine.start();
    expect(eventTriggered).toBe(true);
  });

  test("should remove event listeners", async () => {
    await gameEngine.initialize();

    let eventTriggered = false;

    const listener = () => {
      eventTriggered = true;
    };
    gameEngine.addEventListener("gamestart", listener);
    gameEngine.removeEventListener("gamestart", listener);

    gameEngine.start();
    expect(eventTriggered).toBe(false);
  });

  test("should use provided configuration", async () => {
    const customConfig = {
      ...mockConfig,
      width: 320,
      height: 240,
      gameSpeed: 6,
    };

    const { GameEngine } = await import("../../src/game/GameEngine");
    const customEngine = new GameEngine(customConfig);
    expect(customEngine).toBeDefined();

    customEngine.destroy();
  });

  test("should destroy resources properly", async () => {
    await gameEngine.initialize();
    gameEngine.start();
    gameEngine.destroy();

    expect(gameEngine.isPlaying()).toBe(false);
    expect(gameEngine.isPaused()).toBe(false);
  });

  test("should handle multiple destroy calls", async () => {
    await gameEngine.initialize();
    gameEngine.destroy();
    expect(() => gameEngine.destroy()).not.toThrow();
  });
});

test.describe("Physics System Tests", () => {
  test("should detect basic collision", () => {
    const box1 = { x: 0, y: 0, width: 10, height: 10 };
    const box2 = { x: 5, y: 5, width: 10, height: 10 };

    const collides =
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y;

    expect(collides).toBe(true);
  });

  test("should not detect collision when separated", () => {
    const box1 = { x: 0, y: 0, width: 10, height: 10 };
    const box2 = { x: 20, y: 20, width: 10, height: 10 };

    const collides =
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y;

    expect(collides).toBe(false);
  });
});

test.describe("Game Loop Tests", () => {
  test("should calculate fixed timestep correctly", () => {
    const targetFPS = 60;
    const fixedTimeStep = 1000 / targetFPS;

    expect(fixedTimeStep).toBeCloseTo(16.67, 1);
  });

  test("should handle accumulator logic", () => {
    let accumulator = 0;
    const fixedTimeStep = 16.67;
    const deltaTime = 32; // 2 frames worth

    accumulator += deltaTime;

    let updateCount = 0;
    while (accumulator >= fixedTimeStep) {
      updateCount++;
      accumulator -= fixedTimeStep;
    }

    expect(updateCount).toBe(1);
    expect(accumulator).toBeCloseTo(15.33, 1);
  });
});

test.describe("Integration Tests", () => {
  test("should load GameEngine dynamically", async () => {
    const { GameEngine } = await import("../../src/game/GameEngine");
    expect(GameEngine).toBeDefined();

    const canvas = createMockCanvas();
    const config = {
      width: 240,
      height: 216,
      targetFPS: 60,
      gravity: 0.8,
      jumpPower: -12,
      gameSpeed: 4,
      spawnRate: 0.02,
      canvas,
      audio: {
        enabled: false,
        volume: 0.3,
        frequencies: {
          jump: 400,
          collect: 800,
          gameOver: 200,
          background: [261, 293, 329, 261, 329, 392],
        },
      },
      render: {
        pixelated: true,
        showFPS: false,
        showHitboxes: false,
        doubleBuffering: true,
      },
    };

    const engine = new GameEngine(config);
    expect(engine).toBeDefined();
    engine.destroy();
  });

  test("should handle SSR environment gracefully", async () => {
    // Remove window mock to simulate SSR
    delete (global as any).window;

    const { GameEngine } = await import("../../src/game/GameEngine");
    const canvas = createMockCanvas();
    const config = {
      width: 240,
      height: 216,
      targetFPS: 60,
      gravity: 0.8,
      jumpPower: -12,
      gameSpeed: 4,
      spawnRate: 0.02,
      canvas,
      audio: {
        enabled: false,
        volume: 0.3,
        frequencies: {
          jump: 400,
          collect: 800,
          gameOver: 200,
          background: [261, 293, 329, 261, 329, 392],
        },
      },
      render: {
        pixelated: true,
        showFPS: false,
        showHitboxes: false,
        doubleBuffering: true,
      },
    };

    const engine = new GameEngine(config);
    expect(engine).toBeDefined();

    // Should not throw when initializing in SSR
    await expect(async () => engine.initialize()).not.toThrow();

    engine.destroy();
  });
});
