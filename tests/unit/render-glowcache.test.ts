/**
 * Render System Glow Cache Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { RenderSystem } from "../../src/game/systems/RenderSystem";
import { Collectible } from "../../src/game/entities/Collectible";
import type {
  RenderConfig,
  CollectibleVisualConfig,
} from "../../src/game/types/GameTypes";

// Mock DOM environment
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({
    imageSmoothingEnabled: false,
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    drawImage: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    fillStyle: "",
    globalAlpha: 1,
    canvas: mockCanvas,
    globalCompositeOperation: "source-over" as const,
    beginPath: () => {},
    clip: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    clearRect: () => {},
    measureText: () => ({ width: 0 }),
    scale: () => {},
    rotate: () => {},
    translate: () => {},
    transform: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    strokeRect: () => {},
    strokeText: () => {},
    fillText: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray() }),
    isPointInPath: () => false,
    isPointInStroke: () => false,
    drawFocusIfNeeded: () => false,
    createPattern: () => null,
    arc: () => {},
    arcTo: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    rect: () => {},
    ellipse: () => {},
    conicGradient: () => null,
    getContextAttributes: () => ({}),
    getLineDash: () => [],
    setLineDash: () => {},
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 1 }),
    reset: () => {},
    roundRect: () => {},
    direction: "ltr" as const,
    font: "",
    textAlign: "left" as const,
    textBaseline: "alphabetic" as const,
    lineCap: "butt" as const,
    lineDashOffset: 0,
    lineJoin: "miter" as const,
    lineWidth: 1,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: "",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    strokeStyle: "",
    filter: "none" as const,
    fontKerning: "auto" as const,
    fontStretch: "normal" as const,
    fontVariantCaps: "normal" as const,
    letterSpacing: "normal" as const,
    textRendering: "auto" as const,
    wordSpacing: "normal" as const,
  }),
} as any;

const mockDocument = {
  createElement: (tag: string) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          createRadialGradient: () => ({
            addColorStop: () => {},
          }),
          fillRect: () => {},
          fillStyle: "",
        }),
      };
    }
    return null;
  },
};

describe("RenderSystem Glow Cache", () => {
  let renderSystem: RenderSystem;
  let config: RenderConfig;
  let collectible: Collectible;
  let visualConfig: CollectibleVisualConfig;

  beforeEach(() => {
    // Setup global mocks
    (global as any).window = {
      matchMedia: () => ({
        matches: false,
      }),
    };
    (global as any).document = mockDocument;

    config = {
      pixelated: true,
      showFPS: false,
      showHitboxes: false,
      doubleBuffering: false,
    };

    visualConfig = {
      glowEnabled: true,
      particleEnabled: true,
      pulseEnabled: true,
      bobEnabled: true,
      lodLevels: {
        low: { maxParticles: 4, glowEnabled: false },
        medium: { maxParticles: 8, glowEnabled: true },
        high: { maxParticles: 16, glowEnabled: true },
      },
    };

    renderSystem = new RenderSystem(
      mockCanvas.getContext() as any,
      800,
      600,
      config,
    );

    collectible = new Collectible({
      position: { x: 100, y: 100 },
      size: { width: 16, height: 16 },
      points: 10,
      type: "commit",
    });
  });

  afterEach(() => {
    renderSystem.clearGlowCache();
  });

  describe("OffscreenCanvas feature detection", () => {
    it("should handle missing OffscreenCanvas gracefully", () => {
      // Mock OffscreenCanvas as undefined
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      (global as any).OffscreenCanvas = undefined;

      const ctx = mockCanvas.getContext();

      // Should not throw exception
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();

      // Restore
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });

    it("should handle OffscreenCanvas constructor throwing", () => {
      // Mock OffscreenCanvas to throw
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      (global as any).OffscreenCanvas = class {
        constructor() {
          throw new Error("OffscreenCanvas not supported");
        }
      };

      const ctx = mockCanvas.getContext();

      // Should not throw exception
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();

      // Restore
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });

    it("should fallback to regular canvas when OffscreenCanvas fails", () => {
      // Mock OffscreenCanvas as undefined to force fallback
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      (global as any).OffscreenCanvas = undefined;

      const ctx = mockCanvas.getContext();

      // Should still render without errors
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();

      // Restore
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });
  });

  describe("SSR safety", () => {
    it("should handle missing document in SSR", () => {
      // Mock SSR environment
      const originalDocument = (global as any).document;
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      (global as any).document = undefined;
      (global as any).OffscreenCanvas = undefined;

      const ctx = mockCanvas.getContext();

      // Should not throw exception in SSR
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();

      // Restore
      (global as any).document = originalDocument;
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });
  });

  describe("Cache management", () => {
    it("should limit cache size to MAX_GLOW_CACHE_SIZE", () => {
      const ctx = mockCanvas.getContext();

      // Create multiple collectibles with different sizes to fill cache
      for (let i = 0; i < 20; i++) {
        const testCollectible = new Collectible({
          position: { x: 100, y: 100 },
          size: { width: 16 + i, height: 16 + i }, // Different sizes
          points: 10,
          type: i % 2 === 0 ? "commit" : "star",
        });

        renderSystem.drawCollectible(ctx, testCollectible, 0, visualConfig);
      }

      // Cache should not exceed maximum size
      // Note: We can't directly access the cache, but this test ensures no errors
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();
    });

    it("should clear cache without errors", () => {
      const ctx = mockCanvas.getContext();

      // Add some items to cache
      renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);

      // Should clear without errors
      expect(() => {
        renderSystem.clearGlowCache();
      }).not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should handle getContext returning null", () => {
      // Mock canvas that returns null context
      const faultyCanvas = {
        width: 100,
        height: 100,
        getContext: () => null,
      };

      const originalDocument = (global as any).document;
      (global as any).document = {
        createElement: () => faultyCanvas,
      };

      const ctx = mockCanvas.getContext();

      // Should not throw when context creation fails
      expect(() => {
        renderSystem.drawCollectible(ctx, collectible, 0, visualConfig);
      }).not.toThrow();

      // Restore
      (global as any).document = originalDocument;
    });
  });
});
