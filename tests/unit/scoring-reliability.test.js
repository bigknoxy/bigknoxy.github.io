/**
 * Scoring System Reliability Tests
 * Tests for atomic score updates, HUD synchronization, and high score persistence
 */

// Mock localStorage
const mockLocalStorage = {};

// Mock window and globals
global.window = {
  localStorage: {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, value) => {
      mockLocalStorage[key] = value;
    },
    removeItem: (key) => {
      delete mockLocalStorage[key];
    },
    clear: () => {
      Object.keys(mockLocalStorage).forEach(
        (key) => delete mockLocalStorage[key],
      );
    },
  },
  performance: {
    now: () => Date.now(),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, value) => {
    mockLocalStorage[key] = value;
  },
  removeItem: (key) => {
    delete mockLocalStorage[key];
  },
  clear: () => {
    Object.keys(mockLocalStorage).forEach(
      (key) => delete mockLocalStorage[key],
    );
  },
};

// Mock canvas
const mockCanvas = {
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
    closePath: () => {},
    save: () => {},
    restore: () => {},
    drawImage: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "",
    textAlign: "left",
    textBaseline: "top",
    imageSmoothingEnabled: false,
  }),
};

// Import GameEngine
const { GameEngine } = await import("../../src/game/GameEngine");

console.log("Testing Scoring System Reliability...");

// Test 1: Atomic score updates via addScore
const gameEngine = new GameEngine({
  width: 240,
  height: 216,
  targetFPS: 60,
  gravity: 0.8,
  jumpPower: -12,
  gameSpeed: 4,
  spawnRate: 0.02,
  audio: {
    enabled: false,
    volume: 0.3,
    frequencies: {
      jump: 400,
      collect: 800,
      gameOver: 200,
      background: [261, 293, 329],
    },
  },
  render: {
    pixelated: true,
    showFPS: false,
    showHitboxes: false,
    doubleBuffering: false,
  },
  canvas: mockCanvas,
});

gameEngine.initialize();

// Test 1: addScore method works atomically
let callbackScore = 0;
let eventFired = false;
let eventData = null;

gameEngine.setScoreChangeCallback((score) => {
  callbackScore = score;
});

gameEngine.addEventListener("score", (event) => {
  eventFired = true;
  eventData = event.data;
});

// Test adding points
gameEngine.addScore(10);
console.log("✓ addScore(10) - Score is 10:", gameEngine.getScore() === 10);
console.log("✓ addScore(10) - Callback called with 10:", callbackScore === 10);
console.log("✓ addScore(10) - Event fired:", eventFired);
console.log(
  "✓ addScore(10) - Event data correct:",
  eventData && eventData.score === 10,
);

// Reset for next test
callbackScore = 0;
eventFired = false;
eventData = null;

// Test adding more points
gameEngine.addScore(25);
console.log("✓ addScore(25) - Score is 35:", gameEngine.getScore() === 35);
console.log("✓ addScore(25) - Callback called with 35:", callbackScore === 35);
console.log("✓ addScore(25) - Event fired:", eventFired);
console.log(
  "✓ addScore(25) - Event data correct:",
  eventData && eventData.score === 35,
);

// Test 2: Score formatting (4-digit padding)
function formatScore(score) {
  return "SCORE: " + String(score).padStart(4, "0");
}

console.log(
  "✓ Score formatting - 0 ->",
  formatScore(0) === "SCORE: 0000" ? "SCORE: 0000" : "FAILED",
);
console.log(
  "✓ Score formatting - 5 ->",
  formatScore(5) === "SCORE: 0005" ? "SCORE: 0005" : "FAILED",
);
console.log(
  "✓ Score formatting - 42 ->",
  formatScore(42) === "SCORE: 0042" ? "SCORE: 0042" : "FAILED",
);
console.log(
  "✓ Score formatting - 150 ->",
  formatScore(150) === "SCORE: 0150" ? "SCORE: 0150" : "FAILED",
);
console.log(
  "✓ Score formatting - 9999 ->",
  formatScore(9999) === "SCORE: 9999" ? "SCORE: 9999" : "FAILED",
);

// Test 3: High score persistence
gameEngine.resetHighScore();
console.log("✓ High score reset to 0:", gameEngine.getHighScore() === 0);

// Set a score and stop game to trigger high score save
gameEngine.setScore(100);
gameEngine.stop(); // This should save high score
console.log("✓ High score saved as 100:", gameEngine.getHighScore() === 100);

// Test higher score
gameEngine.setScore(250);
gameEngine.stop();
console.log("✓ High score updated to 250:", gameEngine.getHighScore() === 250);

// Test lower score (should not update high score)
gameEngine.setScore(150);
gameEngine.stop();
console.log("✓ High score remains 250:", gameEngine.getHighScore() === 250);

// Test 4: Race condition prevention
let callbackCount = 0;
let eventCount = 0;
let finalCallbackScore = 0;
let finalEventScore = 0;

gameEngine.setScoreChangeCallback((score) => {
  callbackCount++;
  finalCallbackScore = score;
});

gameEngine.addEventListener("score", (event) => {
  eventCount++;
  finalEventScore = event.data.score;
});

// Rapid score changes (simulating race conditions)
gameEngine.setScore(0);
gameEngine.addScore(10);
gameEngine.addScore(25);
gameEngine.setScore(50);

console.log(
  "✓ Race condition - Callback count:",
  callbackCount === 4 ? "4 (correct)" : `${callbackCount} (wrong)`,
);
console.log(
  "✓ Race condition - Event count:",
  eventCount === 4 ? "4 (correct)" : `${eventCount} (wrong)`,
);
console.log(
  "✓ Race condition - Final callback score:",
  finalCallbackScore === 50 ? "50 (correct)" : `${finalCallbackScore} (wrong)`,
);
console.log(
  "✓ Race condition - Final event score:",
  finalEventScore === 50 ? "50 (correct)" : `${finalEventScore} (wrong)`,
);

// Test 5: localStorage error handling
const originalSetItem = global.window.localStorage.setItem;
global.window.localStorage.setItem = () => {
  throw new Error("Storage quota exceeded");
};

try {
  gameEngine.setScore(300);
  gameEngine.stop();
  console.log("✓ localStorage errors handled gracefully");
} catch (error) {
  console.log("✗ localStorage errors not handled:", error);
}

// Restore original localStorage
global.window.localStorage.setItem = originalSetItem;

// Test 6: API methods available on window.miniGame (simulated)
// In real scenario, these would be available via MiniGame.astro
const apiMethods = [
  "getScore",
  "setScore",
  "addScore",
  "getHighScore",
  "resetHighScore",
  "setScoreChangeCallback",
];

console.log("✓ GameEngine has required API methods:");
apiMethods.forEach((method) => {
  const hasMethod = typeof gameEngine[method] === "function";
  console.log(`  - ${method}: ${hasMethod ? "✓" : "✗"}`);
});

// Test 7: Score clamping in addScore
gameEngine.setScore(0);
gameEngine.addScore(-10); // Should not go below 0
console.log(
  "✓ addScore with negative points clamps to 0:",
  gameEngine.getScore() === 0,
);

// Cleanup
gameEngine.destroy();
console.log("✓ GameEngine destroyed");

console.log("Scoring System Reliability tests completed!");
