/**
 * Simple Audio System Test
 */

// Import AudioSystem
const { AudioSystem } = await import("../../src/game/systems/AudioSystem");

console.log("Testing AudioSystem...");

// Test 1: Initialization
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
console.log("✓ AudioSystem initialized successfully");

// Test 2: Volume control
audioSystem.setVolume(0.5);
console.log("✓ Volume set to 0.5:", audioSystem.getVolume() === 0.5);

audioSystem.setVolume(1.5); // Should clamp to 1
console.log("✓ Volume clamped to 1:", audioSystem.getVolume() === 1);

audioSystem.setVolume(-0.5); // Should clamp to 0
console.log("✓ Volume clamped to 0:", audioSystem.getVolume() === 0);

// Test 3: Mute/Unmute
audioSystem.mute();
console.log("✓ Muted:", !audioSystem.isEnabled());

audioSystem.unmute();
console.log("✓ Unmuted:", audioSystem.isEnabled());

// Test 4: Sound playback (should not throw)
try {
  await audioSystem.resume();
  await audioSystem.playJump();
  console.log("✓ Jump sound played without error");
} catch (error) {
  console.log("✗ Jump sound failed:", error);
}

try {
  await audioSystem.playCollect();
  console.log("✓ Collect sound played without error");
} catch (error) {
  console.log("✗ Collect sound failed:", error);
}

try {
  await audioSystem.playGameOver();
  console.log("✓ Game over sound played without error");
} catch (error) {
  console.log("✗ Game over sound failed:", error);
}

// Test 5: Context management
console.log("✓ Is ready:", audioSystem.isReady());
console.log("✓ Is suspended:", audioSystem.isAudioSuspended());

// Test 6: Destroy
audioSystem.destroy();
console.log("✓ AudioSystem destroyed");

console.log("AudioSystem tests completed!");
