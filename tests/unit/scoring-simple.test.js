/**
 * Simple Scoring System Test
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

console.log("Testing Scoring System...");

// Test 1: Basic scoring
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

// Test initial score
console.log("✓ Initial score is 0:", gameEngine.getScore() === 0);

// Test score change callback
let callbackScore = 0;
gameEngine.setScoreChangeCallback((score) => {
  callbackScore = score;
});

gameEngine.setScore(100);
console.log("✓ Score set to 100:", gameEngine.getScore() === 100);
console.log("✓ Callback called with 100:", callbackScore === 100);

// Test 2: High score persistence
console.log("✓ Initial high score is 0:", gameEngine.getHighScore() === 0);

gameEngine.setScore(150);
gameEngine.stop(); // Trigger game over to save high score (no need to start)

console.log("✓ High score updated to 150:", gameEngine.getHighScore() === 150);

// Test reset high score
gameEngine.resetHighScore();
console.log("✓ High score reset to 0:", gameEngine.getHighScore() === 0);

// Test 3: Game speed control
gameEngine.setGameSpeed(5);
const gameState = gameEngine.getGameState();
console.log("✓ Game speed set to 5:", gameState.gameSpeed === 5);

// Test bounds
gameEngine.setGameSpeed(25); // Should clamp to 20
const clampedState = gameEngine.getGameState();
console.log("✓ Game speed clamped to 20:", clampedState.gameSpeed === 20);

gameEngine.setGameSpeed(-5); // Should clamp to 1
const minState = gameEngine.getGameState();
console.log("✓ Game speed clamped to 1:", minState.gameSpeed === 1);

// Test 4: localStorage error handling
const originalSetItem = global.window.localStorage.setItem;
global.window.localStorage.setItem = () => {
  throw new Error("Storage quota exceeded");
};

try {
  gameEngine.setScore(200);
  gameEngine.start();
  gameEngine.stop();
  console.log("✓ localStorage errors handled gracefully");
} catch (error) {
  console.log("✗ localStorage errors not handled:", error);
}

// Restore original localStorage
global.window.localStorage.setItem = originalSetItem;

// Cleanup
gameEngine.destroy();
console.log("✓ GameEngine destroyed");

console.log("Scoring System tests completed!");
