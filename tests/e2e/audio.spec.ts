/**
 * Audio System Tests
 */

import { test, expect } from "@playwright/test";

test.describe("AudioSystem", () => {
  let AudioSystem: any;
  let mockAudioContext: any;

  test.beforeEach(async () => {
    // Mock Web Audio API
    mockAudioContext = {
      createOscillator: () => ({
        connect: () => {},
        type: "square",
        frequency: { setValueAtTime: () => {} },
        start: () => {},
        stop: () => {},
      }),
      createGain: () => ({
        connect: () => {},
        gain: { value: 0 },
      }),
      destination: {},
      resume: async () => {},
      close: () => {},
      state: "suspended",
      currentTime: 0,
    };

    // Mock window.AudioContext
    (global as any).AudioContext = () => mockAudioContext;

    // Dynamic import to avoid SSR issues
    const audioModule = await import("../../src/game/systems/AudioSystem");
    AudioSystem = audioModule.AudioSystem;
  });

  test("should initialize successfully", async () => {
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
    expect(audioSystem.isReady()).toBe(true);

    audioSystem.destroy();
  });

  test("should control volume within bounds", async () => {
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

    // Test volume setting within bounds
    audioSystem.setVolume(0.5);
    expect(audioSystem.getVolume()).toBe(0.5);

    audioSystem.setVolume(1.5); // Should clamp to 1
    expect(audioSystem.getVolume()).toBe(1);

    audioSystem.setVolume(-0.5); // Should clamp to 0
    expect(audioSystem.getVolume()).toBe(0);

    // Test mute/unmute
    expect(audioSystem.isEnabled()).toBe(true);

    audioSystem.mute();
    expect(audioSystem.isEnabled()).toBe(false);

    audioSystem.unmute();
    expect(audioSystem.isEnabled()).toBe(true);

    audioSystem.destroy();
  });

  test("should play sounds without errors", async () => {
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
    await audioSystem.resume(); // Resume suspended context

    // Test sound methods don't throw errors
    await expect(audioSystem.playJump()).resolves.not.toThrow();
    await expect(audioSystem.playCollect()).resolves.not.toThrow();
    await expect(audioSystem.playGameOver()).resolves.not.toThrow();

    audioSystem.destroy();
  });

  test("should handle missing AudioContext gracefully", async () => {
    const originalAudioContext = (global as any).AudioContext;
    delete (global as any).AudioContext;

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
    expect(audioSystem.isReady()).toBe(false);

    audioSystem.destroy();

    // Restore mock
    (global as any).AudioContext = originalAudioContext;
  });

  test("should manage audio context state", async () => {
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

    // Test suspended state
    mockAudioContext.state = "suspended";
    expect(audioSystem.isAudioSuspended()).toBe(true);

    await audioSystem.resume();
    expect(audioSystem.isAudioSuspended()).toBe(false);

    // Test destroy
    audioSystem.destroy();
    expect(audioSystem.isReady()).toBe(false);
  });
});
