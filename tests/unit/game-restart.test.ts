import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "../../src/game/GameEngine";

// Mock DOM environment
import "../test-setup";

describe("GameEngine restart functionality", () => {
  let engine: GameEngine;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = document.createElement("canvas") as HTMLCanvasElement;
    mockCanvas.width = 240;
    mockCanvas.height = 216;

    // Mock canvas context
    mockContext = {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Array(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    } as any;

    // Mock getContext
    mockCanvas.getContext = () => mockContext;

    // Create engine with minimal config
    const config = {
      width: 240,
      height: 216,
      targetFPS: 60,
      gravity: 0.8,
      jumpPower: -12,
      gameSpeed: 4,
      spawnRate: 0.02,
      canvas: mockCanvas,
      audio: {
        enabled: false, // Disable audio for tests
        volume: 0,
        frequencies: {
          jump: 400,
          collect: 800,
          gameOver: 200,
          background: [100, 150, 200],
        },
      },
      render: {
        pixelated: true,
        doubleBuffering: true,
        showFPS: false,
        showHitboxes: false,
      },
    };

    engine = new GameEngine(config);
    engine.initialize();
  });

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
  });

  it("restart() should reset score to 0 and start the game", () => {
    // Set initial score
    engine.setScore(100);
    expect(engine.getScore()).toBe(100);

    // Call restart
    engine.restart();

    // Verify score is reset and game is playing
    expect(engine.getScore()).toBe(0);
    expect(engine.isPlaying()).toBe(true);
  });

  it("restart() should work when game is already running", () => {
    // Start the game first
    engine.start();
    expect(engine.isPlaying()).toBe(true);

    // Set a score
    engine.setScore(50);
    expect(engine.getScore()).toBe(50);

    // Call restart
    engine.restart();

    // Should still be playing with reset score
    expect(engine.isPlaying()).toBe(true);
    expect(engine.getScore()).toBe(0);
  });

  it("restart() should work when game is stopped", () => {
    // Game should be stopped initially
    expect(engine.isPlaying()).toBe(false);

    // Set a score
    engine.setScore(75);
    expect(engine.getScore()).toBe(75);

    // Call restart
    engine.restart();

    // Should be playing with reset score
    expect(engine.isPlaying()).toBe(true);
    expect(engine.getScore()).toBe(0);
  });

  it("restart() should reset game speed to initial config", () => {
    // Start game and change speed
    engine.start();
    engine.setGameSpeed(10);
    expect(engine.getGameState().gameSpeed).toBe(10);

    // Call restart
    engine.restart();

    // Speed should be reset to initial config value
    expect(engine.getGameState().gameSpeed).toBe(4);
  });

  it("restart() should emit reset and start events", () => {
    const events: string[] = [];

    // Add event listeners
    engine.addEventListener("reset", () => events.push("reset"));
    engine.addEventListener("gamestart", () => events.push("gamestart"));

    // Call restart
    engine.restart();

    // Should have emitted both events
    expect(events).toContain("reset");
    expect(events).toContain("gamestart");
  });
});
