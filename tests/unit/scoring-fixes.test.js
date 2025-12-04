/**
 * Scoring System Unit Tests - Fixed Version
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

console.log("Testing Scoring System fixes...");

// Test 1: Score change callback fires on setScore
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

// Test score change callback fires on setScore
let callbackScore = 0;
gameEngine.setScoreChangeCallback((score) => {
  callbackScore = score;
});

gameEngine.setScore(100);
console.log("✓ Score set to 100:", gameEngine.getScore() === 100);
console.log("✓ Callback called with 100:", callbackScore === 100);

// Test 2: Score change callback fires on setScore with different values
callbackScore = 0;
gameEngine.setScore(250);
console.log("✓ Score set to 250:", gameEngine.getScore() === 250);
console.log("✓ Callback called with 250:", callbackScore === 250);

// Test 3: Score change callback fires on setScore with zero
callbackScore = 999;
gameEngine.setScore(0);
console.log("✓ Score set to 0:", gameEngine.getScore() === 0);
console.log("✓ Callback called with 0:", callbackScore === 0);

// Test 4: Score clamping works with callback
callbackScore = 0;
gameEngine.setScore(-50); // Should clamp to 0
console.log("✓ Score clamped to 0:", gameEngine.getScore() === 0);
console.log("✓ Callback called with 0:", callbackScore === 0);

// Test 5: Event emission on setScore
let eventFired = false;
let eventData = null;
gameEngine.addEventListener("score", (event) => {
  eventFired = true;
  eventData = event.data;
});

gameEngine.setScore(150);
console.log("✓ Score event fired:", eventFired);
console.log(
  "✓ Score event data correct:",
  eventData && eventData.score === 150,
);

// Cleanup
gameEngine.destroy();
console.log("✓ GameEngine destroyed");

console.log("Scoring System fixes tests completed!");
