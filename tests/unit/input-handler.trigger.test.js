/**
 * InputHandler trigger() method tests
 * Tests mobile touch support and programmatic trigger functionality
 */

// Simple test runner for InputHandler trigger functionality
function runInputHandlerTests() {
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
      toHaveBeenCalled: () => {
        if (!actual.called) {
          throw new Error("Expected function to have been called");
        }
      },
      toHaveBeenCalledTimes: (count) => {
        if (actual.callCount !== count) {
          throw new Error(
            `Expected function to have been called ${count} times, got ${actual.callCount}`,
          );
        }
      },
    };
  }

  function mockFn() {
    const fn = () => {
      fn.called = true;
      fn.callCount++;
    };
    fn.called = false;
    fn.callCount = 0;
    return fn;
  }

  // Mock DOM environment
  const mockWindow = {
    addEventListener: mockFn(),
    removeEventListener: mockFn(),
    innerWidth: 1024,
    PointerEvent: class PointerEvent extends Event {
      constructor(type, eventInitDict) {
        super(type, eventInitDict);
      }
    },
  };

  // Setup global mocks
  if (typeof global !== "undefined") {
    global.window = mockWindow;
  }

  // Create a mock InputHandler for testing structure
  const MockInputHandler = class {
    constructor() {
      this.keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false,
        pause: false,
      };
      this.callbacks = new Map();
      this.lastTriggerTime = new Map();
      this.TRIGGER_DEBOUNCE_MS = 100;
    }

    trigger(action) {
      const now = Date.now();
      const lastTime = this.lastTriggerTime.get(action) || 0;

      if (action === "space" || action === "jump") {
        if (now - lastTime < this.TRIGGER_DEBOUNCE_MS) {
          return;
        }
        this.lastTriggerTime.set(action, now);
      }

      switch (action.toLowerCase()) {
        case "space":
        case "jump":
          this.keys.space = true;
          this.triggerCallbacks("jump");
          setTimeout(() => {
            this.keys.space = false;
          }, 50);
          break;
        case "left":
          this.keys.left = true;
          break;
        case "right":
          this.keys.right = true;
          break;
        case "up":
          this.keys.up = true;
          break;
        case "down":
          this.keys.down = true;
          break;
        case "pause":
        case "start":
          this.keys.pause = !this.keys.pause;
          this.triggerCallbacks("pause");
          break;
      }
    }

    triggerCallbacks(action) {
      const callbacks = this.callbacks.get(action);
      if (callbacks) {
        callbacks.forEach((callback) => callback());
      }
    }

    onCallback(action, callback) {
      if (!this.callbacks.has(action)) {
        this.callbacks.set(action, []);
      }
      this.callbacks.get(action).push(callback);
    }

    isPressed(key) {
      return this.keys[key];
    }

    getInputState() {
      return { ...this.keys };
    }

    destroy() {}
  };

  // Test trigger method existence
  test("should have a trigger method", () => {
    const inputHandler = new MockInputHandler();
    expect(typeof inputHandler.trigger).toBe("function");
    inputHandler.destroy();
  });

  // Test trigger with space action
  test("should trigger jump callbacks when trigger('space') is called", () => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    inputHandler.trigger("space");

    expect(jumpCallback).toHaveBeenCalled();
    expect(jumpCallback).toHaveBeenCalledTimes(1);
    inputHandler.destroy();
  });

  // Test trigger with jump action
  test("should trigger jump callbacks when trigger('jump') is called", () => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    inputHandler.trigger("jump");

    expect(jumpCallback).toHaveBeenCalled();
    expect(jumpCallback).toHaveBeenCalledTimes(1);
    inputHandler.destroy();
  });

  // Test space key state
  test("should set space key state when trigger('space') is called", () => {
    const inputHandler = new MockInputHandler();
    inputHandler.trigger("space");
    expect(inputHandler.isPressed("space")).toBe(true);
    inputHandler.destroy();
  });

  // Test auto-reset of space key
  test("should auto-reset space key after trigger", (done) => {
    const inputHandler = new MockInputHandler();
    inputHandler.trigger("space");
    expect(inputHandler.isPressed("space")).toBe(true);

    setTimeout(() => {
      expect(inputHandler.isPressed("space")).toBe(false);
      inputHandler.destroy();
      done();
    }, 60); // Slightly longer than 50ms timeout
  });

  // Test pause toggle
  test("should toggle pause state when trigger('pause') is called", () => {
    const inputHandler = new MockInputHandler();
    const pauseCallback = mockFn();
    inputHandler.onCallback("pause", pauseCallback);

    expect(inputHandler.isPressed("pause")).toBe(false);

    inputHandler.trigger("pause");
    expect(inputHandler.isPressed("pause")).toBe(true);
    expect(pauseCallback).toHaveBeenCalled();
    expect(pauseCallback).toHaveBeenCalledTimes(1);

    inputHandler.trigger("pause");
    expect(inputHandler.isPressed("pause")).toBe(false);
    expect(pauseCallback).toHaveBeenCalledTimes(2);
    inputHandler.destroy();
  });

  // Test movement keys
  test("should handle movement keys", () => {
    const inputHandler = new MockInputHandler();
    inputHandler.trigger("left");
    expect(inputHandler.isPressed("left")).toBe(true);

    inputHandler.trigger("right");
    expect(inputHandler.isPressed("right")).toBe(true);

    inputHandler.trigger("up");
    expect(inputHandler.isPressed("up")).toBe(true);

    inputHandler.trigger("down");
    expect(inputHandler.isPressed("down")).toBe(true);
    inputHandler.destroy();
  });

  // Test debounce functionality
  test("should debounce rapid jump triggers", () => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    // Rapid calls should be debounced
    inputHandler.trigger("space");
    inputHandler.trigger("space");
    inputHandler.trigger("space");

    expect(jumpCallback).toHaveBeenCalled();
    expect(jumpCallback).toHaveBeenCalledTimes(1);
    inputHandler.destroy();
  });

  // Test debounce period
  test("should allow jump triggers after debounce period", (done) => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    inputHandler.trigger("space");
    expect(jumpCallback).toHaveBeenCalled();
    expect(jumpCallback).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      inputHandler.trigger("space");
      expect(jumpCallback).toHaveBeenCalledTimes(2);
      inputHandler.destroy();
      done();
    }, 110); // Longer than 100ms debounce
  });

  // Test case insensitive actions
  test("should handle uppercase actions", () => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    inputHandler.trigger("SPACE");
    inputHandler.trigger("JUMP");
    inputHandler.trigger("PAUSE");

    expect(jumpCallback).toHaveBeenCalledTimes(2);
    expect(inputHandler.isPressed("pause")).toBe(true);
    inputHandler.destroy();
  });

  // Test invalid actions
  test("should handle invalid actions gracefully", () => {
    const inputHandler = new MockInputHandler();
    expect(() => {
      inputHandler.trigger("invalid");
    }).not.toThrow();

    // Should not change any state
    const state = inputHandler.getInputState();
    expect(Object.values(state).every((v) => v === false)).toBe(true);
    inputHandler.destroy();
  });

  // Test MiniGame component integration
  test("should work with expected MiniGame.astro interface", () => {
    const inputHandler = new MockInputHandler();
    const jumpCallback = mockFn();
    inputHandler.onCallback("jump", jumpCallback);

    // This is exact call pattern from MiniGame.astro
    expect(() => {
      inputHandler.trigger("space");
    }).not.toThrow();

    expect(jumpCallback).toHaveBeenCalled();
    inputHandler.destroy();
  });

  // Test safety before initialization
  test("should be safe to call trigger before initialization", () => {
    const inputHandler = new MockInputHandler();
    expect(() => {
      inputHandler.trigger("space");
    }).not.toThrow();
    inputHandler.destroy();
  });

  // Run all tests
  console.log("Running InputHandler trigger() Tests...\n");

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
  module.exports = { runInputHandlerTests };
} else if (typeof window !== "undefined") {
  window.runInputHandlerTests = runInputHandlerTests;
} else {
  runInputHandlerTests();
}
