/**
 * Manual Integration Test: Scoring System
 * Run this in the browser console to verify the complete scoring flow
 */

// Test 1: Check if window.miniGame API is available
console.log("=== Test 1: API Availability ===");
if (window.miniGame) {
  console.log("✓ window.miniGame API is available");

  const requiredMethods = [
    "getScore",
    "setScore",
    "addScore",
    "getHighScore",
    "resetHighScore",
    "setScoreChangeCallback",
  ];
  requiredMethods.forEach((method) => {
    const available = typeof window.miniGame[method] === "function";
    console.log(`  - ${method}: ${available ? "✓" : "✗"}`);
  });
} else {
  console.log("✗ window.miniGame API not available - wait for game to load");
}

// Test 2: Score updates and HUD synchronization
console.log("\n=== Test 2: Score Updates & HUD ===");
if (window.miniGame) {
  // Get initial HUD score
  const scoreElement = document.getElementById("mini-game-score");
  const initialHUDScore = scoreElement ? scoreElement.textContent : "NOT FOUND";
  console.log("Initial HUD score:", initialHUDScore);

  // Set up event listener
  let eventCount = 0;
  const root = document.getElementById("mini-game-root");
  if (root) {
    root.addEventListener("game:score", (e) => {
      eventCount++;
      console.log(`game:score event #${eventCount}:`, e.detail.score);
    });
  }

  // Test score changes
  console.log("Testing score changes...");

  // Add 10 points (regular collectible)
  window.miniGame.addScore(10);

  // Add 25 points (special collectible)
  window.miniGame.addScore(25);

  // Set specific score
  window.miniGame.setScore(5);

  // Check final HUD score
  setTimeout(() => {
    const finalHUDScore = scoreElement ? scoreElement.textContent : "NOT FOUND";
    console.log("Final HUD score:", finalHUDScore);
    console.log("Total game:score events:", eventCount);
  }, 100);
}

// Test 3: High score persistence
console.log("\n=== Test 3: High Score Persistence ===");
if (window.miniGame) {
  // Reset high score
  window.miniGame.resetHighScore();
  console.log("High score after reset:", window.miniGame.getHighScore());

  // Set a score and stop game to save high score
  window.miniGame.setScore(150);
  if (window.miniGame.raw && window.miniGame.raw.stop) {
    window.miniGame.raw.stop();
  }

  console.log("High score after game over:", window.miniGame.getHighScore());
  console.log("localStorage value:", localStorage.getItem("miniGameHighScore"));
}

// Test 4: Score formatting
console.log("\n=== Test 4: Score Formatting ===");
const testScores = [0, 5, 42, 150, 9999];
testScores.forEach((score) => {
  const formatted = "SCORE: " + String(score).padStart(4, "0");
  console.log(`Score ${score} -> ${formatted}`);
});

console.log("\n=== Manual Test Complete ===");
console.log("Check the browser console output above for results.");
