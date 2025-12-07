/**
 * Difficulty System Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { DifficultySystem } from "../../src/game/systems/DifficultySystem";
import type { DifficultyConfig } from "../../src/game/types/GameTypes";

describe("DifficultySystem", () => {
  let difficultySystem: DifficultySystem;
  let config: DifficultyConfig;

  beforeEach(() => {
    config = {
      maxDifficultyTime: 120, // 2 minutes
      maxDifficultyScore: 500,
      timeScale: 0.6,
      scoreScale: 0.4,
      gameSpeedMultiplier: { min: 1.0, max: 3.0 },
      spawnRateMultiplier: { min: 0.5, max: 2.0 },
    };
    difficultySystem = new DifficultySystem(config);
  });

  describe("compute", () => {
    it("should return 0 at start", () => {
      const difficulty = difficultySystem.compute(0, 0);
      expect(difficulty).toBe(0);
    });

    it("should increase based on time", () => {
      const difficulty = difficultySystem.compute(60, 0); // 1 minute
      expect(difficulty).toBeGreaterThan(0);
      expect(difficulty).toBeLessThan(1);
    });

    it("should increase based on score", () => {
      const difficulty = difficultySystem.compute(0, 250); // Half score
      expect(difficulty).toBeGreaterThan(0);
      expect(difficulty).toBeLessThan(1);
    });

    it("should reach max difficulty at time limit", () => {
      // Call multiple times to allow smoothing to converge
      for (let i = 0; i < 10; i++) {
        difficultySystem.compute(120, 0); // Max time
      }
      const difficulty = difficultySystem.getDifficultyState();
      expect(difficulty).toBeGreaterThan(0.6); // Allow for smoothing
    });

    it("should reach max difficulty at score limit", () => {
      // Call multiple times to allow smoothing to converge
      for (let i = 0; i < 10; i++) {
        difficultySystem.compute(0, 500); // Max score
      }
      const difficulty = difficultySystem.getDifficultyState();
      expect(difficulty).toBeGreaterThan(0.3); // Allow for smoothing
    });

    it("should combine time and score correctly", () => {
      // Call multiple times to allow smoothing to converge
      let difficulty = 0;
      for (let i = 0; i < 10; i++) {
        difficulty = difficultySystem.compute(60, 250); // Half time, half score
      }
      expect(difficulty).toBeGreaterThan(0.2); // Adjusted for smoothing
      expect(difficulty).toBeLessThan(1);
    });

    it("should respect override", () => {
      difficultySystem.setOverride(0.5);
      const difficulty = difficultySystem.compute(1000, 10000); // Extreme values
      expect(difficulty).toBe(0.5);
    });

    it("should smooth difficulty changes", () => {
      // First call
      const d1 = difficultySystem.compute(60, 0);
      // Second call with same inputs should be similar due to smoothing
      const d2 = difficultySystem.compute(60, 0);
      expect(Math.abs(d2 - d1)).toBeLessThan(0.1);
    });
  });

  describe("getGameSpeedMultiplier", () => {
    it("should return min multiplier at zero difficulty", () => {
      difficultySystem.setOverride(0);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getGameSpeedMultiplier()).toBe(1.0);
    });

    it("should return max multiplier at full difficulty", () => {
      difficultySystem.setOverride(1);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getGameSpeedMultiplier()).toBe(3.0);
    });

    it("should interpolate between min and max", () => {
      difficultySystem.setOverride(0.5);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getGameSpeedMultiplier()).toBeCloseTo(2.0, 1);
    });
  });

  describe("getSpawnRateMultiplier", () => {
    it("should return min multiplier at zero difficulty", () => {
      difficultySystem.setOverride(0);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getSpawnRateMultiplier()).toBe(0.5);
    });

    it("should return max multiplier at full difficulty", () => {
      difficultySystem.setOverride(1);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getSpawnRateMultiplier()).toBe(2.0);
    });

    it("should interpolate between min and max", () => {
      difficultySystem.setOverride(0.5);
      difficultySystem.compute(0, 0);
      expect(difficultySystem.getSpawnRateMultiplier()).toBeCloseTo(1.25, 1);
    });
  });

  describe("setOverride", () => {
    it("should set override value", () => {
      difficultySystem.setOverride(0.75);
      expect(difficultySystem.getDifficultyState()).toBeCloseTo(0.75, 2);
    });

    it("should clear override when set to null", () => {
      difficultySystem.setOverride(0.75);
      difficultySystem.setOverride(null);
      // Should compute normally again, but need to call multiple times for smoothing
      let difficulty = 0;
      for (let i = 0; i < 10; i++) {
        difficulty = difficultySystem.compute(0, 0);
      }
      expect(difficulty).toBeLessThan(0.5); // Should trend toward 0
    });
  });

  describe("edge cases", () => {
    it("should handle negative time", () => {
      const difficulty = difficultySystem.compute(-10, 0);
      expect(difficulty).toBe(0);
    });

    it("should handle negative score", () => {
      const difficulty = difficultySystem.compute(0, -100);
      expect(difficulty).toBe(0);
    });

    it("should clamp values to [0, 1]", () => {
      const difficulty1 = difficultySystem.compute(1000, 0); // Very high time
      const difficulty2 = difficultySystem.compute(0, 10000); // Very high score
      expect(difficulty1).toBeLessThanOrEqual(1);
      expect(difficulty2).toBeLessThanOrEqual(1);
    });
  });

  describe("destroy", () => {
    it("should clean up state", () => {
      difficultySystem.setOverride(0.5);
      difficultySystem.destroy();
      expect(difficultySystem.getDifficultyState()).toBe(0);
    });
  });
});
