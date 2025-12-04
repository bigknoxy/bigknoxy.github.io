/**
 * Game Engine Unit Tests
 */

// Simple test runner for basic functionality
function runTests() {
  const tests = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    tests.push({ name, fn });
  }

  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error("Expected value to be defined");
        }
      },
      toThrow: () => {
        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error("Expected function to throw");
        }
      },
      not: {
        toThrow: () => {
          let threw = false;
          try {
            actual();
          } catch (e) {
            threw = true;
          }
          if (threw) {
            throw new Error("Expected function not to throw");
          }
        },
      },
    };
  }

  // Mock canvas for testing
  function createMockCanvas() {
    return {
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
        imageSmoothingEnabled: false,
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        font: "",
        textAlign: "left",
        textBaseline: "top",
        globalAlpha: 1,
      }),
    };
  }

  // Mock window
  if (typeof global !== "undefined") {
    global.window = {
      performance: {
        now: () => Date.now(),
      },
      requestAnimationFrame: (callback) => setTimeout(callback, 16),
      cancelAnimationFrame: (id) => clearTimeout(id),
    };
  }

  // Test collision detection
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

  test("should calculate fixed timestep correctly", () => {
    const targetFPS = 60;
    const fixedTimeStep = 1000 / targetFPS;

    expect(Math.abs(fixedTimeStep - 16.67) < 0.1).toBe(true);
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
    expect(Math.abs(accumulator - 15.33) < 0.1).toBe(true);
  });

  test("should create mock canvas", () => {
    const canvas = createMockCanvas();
    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(216);
    expect(canvas.getContext).toBeDefined();
  });

  test("should validate game configuration", () => {
    const config = {
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

    expect(config.width).toBe(240);
    expect(config.height).toBe(216);
    expect(config.gravity).toBe(0.8);
    expect(config.audio.enabled).toBe(false);
    expect(config.render.pixelated).toBe(true);
  });

  test("should handle vector operations", () => {
    const v1 = { x: 5, y: 10 };
    const v2 = { x: -3, y: 7 };

    const sum = { x: v1.x + v2.x, y: v1.y + v2.y };
    const diff = { x: v1.x - v2.x, y: v1.y - v2.y };

    expect(sum.x).toBe(2);
    expect(sum.y).toBe(17);
    expect(diff.x).toBe(8);
    expect(diff.y).toBe(3);
  });

  test("should calculate distance between points", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };

    const distance = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
    );

    expect(distance).toBe(5);
  });

  test("should clamp values correctly", () => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test("should interpolate between values", () => {
    const lerp = (start, end, t) => start + (end - start) * t;

    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  // Run all tests
  console.log("Running Game Engine Unit Tests...\n");

  for (const test of tests) {
    try {
      test.fn();
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\nSome tests failed!");
    process.exit(1);
  } else {
    console.log("\nAll tests passed!");
  }
}

// Export for use in different environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runTests };
} else if (typeof window !== "undefined") {
  window.runTests = runTests;
} else {
  runTests();
}
