/**
 * Audio System Unit Tests - Fixed Version
 */

// Import AudioSystem
const { AudioSystem } = await import("../../src/game/systems/AudioSystem");

console.log("Testing AudioSystem fixes...");

// Test 1: Unmute callback functionality
const audioSystem = new AudioSystem({
  enabled: true,
  volume: 0.3,
  frequencies: {
    jump: 400,
    collect: 800,
    gameOver: 200,
    background: [261, 293, 329],
  },
});

await audioSystem.initialize();

let unmuteCallbackCalled = false;
audioSystem.setUnmuteCallback(() => {
  unmuteCallbackCalled = true;
});

audioSystem.mute();
audioSystem.unmute();
console.log("✓ Unmute callback fired:", unmuteCallbackCalled);

// Test 2: Volume control still works
audioSystem.setVolume(0.7);
console.log("✓ Volume set to 0.7:", audioSystem.getVolume() === 0.7);

// Test 3: Mute/unmute state
audioSystem.mute();
console.log("✓ Muted state:", !audioSystem.isEnabled());
audioSystem.unmute();
console.log("✓ Unmuted state:", audioSystem.isEnabled());

// Cleanup
audioSystem.destroy();
console.log("✓ AudioSystem destroyed");

console.log("AudioSystem fixes tests completed!");
