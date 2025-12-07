/**
 * Particle System Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { ParticleSystem } from "../../src/game/systems/ParticleSystem";
import type {
  ParticleSystemConfig,
  CollectibleVisualConfig,
} from "../../src/game/types/GameTypes";

describe("ParticleSystem", () => {
  let particleSystem: ParticleSystem;
  let config: ParticleSystemConfig;
  let visualConfig: CollectibleVisualConfig;

  beforeEach(() => {
    config = {
      maxParticles: 32,
      performanceThreshold: 30,
      gravity: 0.2,
      particleLife: 1.0,
      emitCount: 8,
      colors: {
        collect: ["#9bbc0f", "#8bac0f", "#306230"],
        jump: ["#8bac0f", "#306230"],
        gameover: ["#306230", "#0f380f"],
      },
    };

    visualConfig = {
      glowEnabled: true,
      particleEnabled: true,
      pulseEnabled: true,
      bobEnabled: true,
      lodLevels: {
        low: { maxParticles: 8, glowEnabled: false },
        medium: { maxParticles: 16, glowEnabled: true },
        high: { maxParticles: 32, glowEnabled: true },
      },
    };

    particleSystem = new ParticleSystem(config);
  });

  describe("emitCollect", () => {
    it("should emit particles when enabled", () => {
      const position = { x: 100, y: 100 };
      const initialCount = particleSystem.getActiveCount();

      particleSystem.emitCollect(position, visualConfig);

      expect(particleSystem.getActiveCount()).toBeGreaterThan(initialCount);
    });

    it("should not emit particles when disabled", () => {
      const disabledConfig = { ...visualConfig, particleEnabled: false };
      const position = { x: 100, y: 100 };
      const initialCount = particleSystem.getActiveCount();

      particleSystem.emitCollect(position, disabledConfig);

      expect(particleSystem.getActiveCount()).toBe(initialCount);
    });

    it("should respect particle limit", () => {
      const position = { x: 100, y: 100 };

      // Fill up to near max
      for (let i = 0; i < 30; i++) {
        particleSystem.emitCollect(position, visualConfig);
      }

      const countBefore = particleSystem.getActiveCount();
      particleSystem.emitCollect(position, visualConfig);
      const countAfter = particleSystem.getActiveCount();

      expect(countAfter).toBeLessThanOrEqual(config.maxParticles);
    });
  });

  describe("emitJump", () => {
    it("should emit jump particles", () => {
      const position = { x: 100, y: 100 };
      const initialCount = particleSystem.getActiveCount();

      particleSystem.emitJump(position);

      expect(particleSystem.getActiveCount()).toBe(initialCount + 4);
    });
  });

  describe("emitGameOver", () => {
    it("should emit game over particles", () => {
      const position = { x: 100, y: 100 };
      const initialCount = particleSystem.getActiveCount();

      particleSystem.emitGameOver(position);

      expect(particleSystem.getActiveCount()).toBe(initialCount + 12);
    });
  });

  describe("update", () => {
    it("should update particle positions", () => {
      const position = { x: 100, y: 100 };
      particleSystem.emitCollect(position, visualConfig);

      particleSystem.update(100); // 100ms

      // Particles should move and age
      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);
    });

    it("should remove dead particles", () => {
      const position = { x: 100, y: 100 };
      particleSystem.emitCollect(position, visualConfig);

      // Update for longer than particle life
      particleSystem.update(2000); // 2 seconds

      // All particles should be dead
      expect(particleSystem.getActiveCount()).toBe(0);
    });
  });

  describe("LOD", () => {
    it("should detect low performance hardware", () => {
      // Mock low hardware concurrency before creating system
      const originalHardwareConcurrency = (navigator as any)
        .hardwareConcurrency;
      (navigator as any).hardwareConcurrency = 2;

      const lowConfig = { ...config };
      const lowParticleSystem = new ParticleSystem(lowConfig);

      // Call update to trigger LOD detection
      lowParticleSystem.update(16); // 16ms

      // Should detect low LOD
      expect(lowParticleSystem.getCurrentLOD()).toBe("low");

      // Restore
      (navigator as any).hardwareConcurrency = originalHardwareConcurrency;
    });

    it("should adjust particle count based on LOD", () => {
      // This is tested indirectly through emit limits
      const position = { x: 100, y: 100 };

      // Try to emit more particles than low LOD allows
      for (let i = 0; i < 20; i++) {
        particleSystem.emitCollect(position, visualConfig);
      }

      // Should be limited by LOD
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(
        config.maxParticles,
      );
    });
  });

  describe("utility methods", () => {
    it("should return active count", () => {
      expect(particleSystem.getActiveCount()).toBe(0);

      const position = { x: 100, y: 100 };
      particleSystem.emitJump(position);

      expect(particleSystem.getActiveCount()).toBe(4);
    });

    it("should clear all particles", () => {
      const position = { x: 100, y: 100 };
      particleSystem.emitCollect(position, visualConfig);

      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);

      particleSystem.clear();

      expect(particleSystem.getActiveCount()).toBe(0);
    });

    it("should destroy cleanly", () => {
      particleSystem.emitCollect({ x: 100, y: 100 }, visualConfig);

      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);

      particleSystem.destroy();

      expect(particleSystem.getActiveCount()).toBe(0);
    });
  });
});
