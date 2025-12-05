/**
 * Obstacle Render Tests - Unit tests for obstacle rendering
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Obstacle } from "../../src/game/entities/Obstacle";

// Mock CanvasRenderingContext2D for testing
class MockCanvasRenderingContext2D {
  fillRectCalls: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    fillStyle: string;
  }> = [];
  fillStyle: string = "";

  fillRect(x: number, y: number, width: number, height: number) {
    this.fillRectCalls.push({ x, y, width, height, fillStyle: this.fillStyle });
  }
}

describe("Obstacle Rendering", () => {
  let mockCtx: MockCanvasRenderingContext2D;
  let obstacle: Obstacle;

  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();

    // Create obstacle for testing
    obstacle = new Obstacle({
      position: { x: 100, y: 150 },
      size: { width: 16, height: 20 },
      type: "bug",
    });
  });

  describe("Obstacle Bounds and Size", () => {
    it("should have correct bounding box dimensions matching size configuration", () => {
      const bounds = obstacle.getBoundingBox();

      expect(bounds.width).toBe(16);
      expect(bounds.height).toBe(20);
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(150);
    });

    it("should maintain consistent size across obstacle types", () => {
      const gameboyObstacle = new Obstacle({
        position: { x: 100, y: 150 },
        size: { width: 16, height: 20 },
        type: "bug",
      });

      const deviceObstacle = new Obstacle({
        position: { x: 100, y: 150 },
        size: { width: 16, height: 20 },
        type: "error",
      });

      const gameboyBounds = gameboyObstacle.getBoundingBox();
      const deviceBounds = deviceObstacle.getBoundingBox();

      expect(gameboyBounds.width).toBe(deviceBounds.width);
      expect(gameboyBounds.height).toBe(deviceBounds.height);
    });
  });

  describe("GameBoy Obstacle Rendering", () => {
    it("should render GameBoy sprite without throwing errors", () => {
      expect(() => obstacle.render(mockCtx as any)).not.toThrow();
    });

    it("should use GameBoy palette colors for GameBoy sprite", () => {
      obstacle.render(mockCtx as any);

      // Check that GameBoy colors are used
      const fillStyles = mockCtx.fillRectCalls.map((call) => call.fillStyle);
      expect(fillStyles).toContain("#8bac0f"); // Light green
      expect(fillStyles).toContain("#306230"); // Dark green
      expect(fillStyles).toContain("#0f380f"); // Darkest green
      expect(fillStyles).toContain("#9bbc0f"); // Lightest green
    });

    it("should draw GameBoy console structure with fillRect calls", () => {
      obstacle.render(mockCtx as any);

      // Should have multiple fillRect calls for GameBoy components
      expect(mockCtx.fillRectCalls.length).toBeGreaterThan(10);

      // Check for main screen area
      const screenArea = mockCtx.fillRectCalls.find(
        (call) =>
          call.x === 104 &&
          call.y === 154 &&
          call.width === 8 &&
          call.height === 6,
      );
      expect(screenArea).toBeDefined();
    });

    it("should animate GameBoy screen content", () => {
      // Test animation frame 0
      obstacle.animationFrame = 0;
      obstacle.render(mockCtx as any);
      const frame0Calls = [...mockCtx.fillRectCalls];
      mockCtx.fillRectCalls = [];

      // Test animation frame 1
      obstacle.animationFrame = 1;
      obstacle.render(mockCtx as any);
      const frame1Calls = [...mockCtx.fillRectCalls];

      // Should have different rendering for animation frames
      expect(frame0Calls.length).toBeGreaterThan(0);
      expect(frame1Calls.length).toBeGreaterThan(0);
    });
  });

  describe("Computer Device Obstacle Rendering", () => {
    beforeEach(() => {
      obstacle = new Obstacle({
        position: { x: 100, y: 150 },
        size: { width: 16, height: 20 },
        type: "error",
      });
    });

    it("should render computer device sprite without throwing errors", () => {
      expect(() => obstacle.render(mockCtx as any)).not.toThrow();
    });

    it("should use GameBoy palette colors for device sprite", () => {
      obstacle.render(mockCtx as any);

      // Check that GameBoy colors are used
      const fillStyles = mockCtx.fillRectCalls.map((call) => call.fillStyle);
      expect(fillStyles).toContain("#0f380f"); // Darkest green
      expect(fillStyles).toContain("#9bbc0f"); // Lightest green
      expect(fillStyles).toContain("#8bac0f"); // Light green
    });

    it("should draw computer monitor structure with fillRect calls", () => {
      obstacle.render(mockCtx as any);

      // Should have multiple fillRect calls for computer components
      expect(mockCtx.fillRectCalls.length).toBeGreaterThan(8);

      // Check for monitor screen area
      const screenArea = mockCtx.fillRectCalls.find(
        (call) =>
          call.x === 104 &&
          call.y === 152 &&
          call.width === 8 &&
          call.height === 6,
      );
      expect(screenArea).toBeDefined();
    });

    it("should animate computer screen content", () => {
      // Test animation frame 0
      obstacle.animationFrame = 0;
      obstacle.render(mockCtx as any);
      const frame0Calls = [...mockCtx.fillRectCalls];
      mockCtx.fillRectCalls = [];

      // Test animation frame 1
      obstacle.animationFrame = 1;
      obstacle.render(mockCtx as any);
      const frame1Calls = [...mockCtx.fillRectCalls];

      // Should have different rendering for animation frames
      expect(frame0Calls.length).toBeGreaterThan(0);
      expect(frame1Calls.length).toBeGreaterThan(0);
    });
  });

  describe("Animation System", () => {
    it("should update animation frame based on timer", () => {
      const initialFrame = obstacle.animationFrame;

      // Simulate time passing
      obstacle.animationTimer = 250; // Above 200ms threshold
      obstacle.update(16, 4); // deltaTime and gameSpeed

      expect(obstacle.animationFrame).toBe((initialFrame + 1) % 2);
      expect(obstacle.animationTimer).toBe(0); // Timer resets to 0 after threshold
    });

    it("should reset animation timer when threshold reached", () => {
      obstacle.animationTimer = 200;
      obstacle.update(16, 4);

      expect(obstacle.animationTimer).toBe(0);
    });
  });

  describe("Performance and Efficiency", () => {
    it("should use reasonable number of fillRect calls for performance", () => {
      obstacle.render(mockCtx as any);

      // Should not use excessive draw calls (keep it efficient)
      expect(mockCtx.fillRectCalls.length).toBeLessThan(30);
    });

    it("should maintain consistent draw call count across animation frames", () => {
      // Test frame 0
      obstacle.animationFrame = 0;
      obstacle.render(mockCtx as any);
      const frame0Count = mockCtx.fillRectCalls.length;
      mockCtx.fillRectCalls = [];

      // Test frame 1
      obstacle.animationFrame = 1;
      obstacle.render(mockCtx as any);
      const frame1Count = mockCtx.fillRectCalls.length;

      // Should have similar number of draw calls for consistent performance
      expect(Math.abs(frame0Count - frame1Count)).toBeLessThan(5);
    });
  });
});
