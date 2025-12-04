/**
 * Ground Alignment Tests
 * Tests that visual ground, player feet, and obstacle tops all align at same groundY
 */

import { test, expect, describe, beforeEach } from "bun:test";
import { Player } from "../../src/game/entities/Player";
import { Obstacle } from "../../src/game/entities/Obstacle";
import type {
  PlayerConfig,
  ObstacleConfig,
} from "../../src/game/types/GameTypes";

describe("Ground Alignment", () => {
  const CANVAS_HEIGHT = 216;
  const GROUND_Y = CANVAS_HEIGHT - 20; // 196

  describe("Player Ground Alignment", () => {
    let player: Player;

    beforeEach(() => {
      const config: PlayerConfig = {
        position: { x: 50, y: GROUND_Y - 20 }, // Feet at ground level
        size: { width: 20, height: 20 },
        jumpPower: -12,
        groundY: GROUND_Y - 20, // Player's ground reference is feet position
      };
      player = new Player(config);
    });

    test("should spawn at ground level", () => {
      expect(player.position.y).toBe(GROUND_Y - 20);
    });

    test("should have groundY set correctly", () => {
      expect(player.groundY).toBe(GROUND_Y - 20);
    });

    test("should have bounding box bottom at ground level", () => {
      const box = player.getBoundingBox();
      expect(box.y + box.height).toBe(GROUND_Y); // Bottom of collision box at ground line
    });

    test("should align visual feet with ground when on ground", () => {
      // Player sprite renders legs from y+16 to y+20 (4px tall)
      // So visual feet bottom should be at position.y + 20
      const visualFeetBottom = player.position.y + 20;
      expect(visualFeetBottom).toBe(GROUND_Y); // Feet exactly on ground line
    });

    test("should report being on ground when at groundY", () => {
      expect(player.isOnGround()).toBe(true);
    });
  });

  describe("Obstacle Ground Alignment", () => {
    let obstacle: Obstacle;

    beforeEach(() => {
      const config: ObstacleConfig = {
        position: { x: 100, y: GROUND_Y - 20 }, // Positioned so bottom aligns with ground
        size: { width: 16, height: 20 },
        type: "bug",
      };
      obstacle = new Obstacle(config);
    });

    test("should have bottom at ground level", () => {
      const box = obstacle.getBoundingBox();
      expect(box.y + box.height).toBe(GROUND_Y);
    });

    test("should spawn at correct height above ground", () => {
      expect(obstacle.position.y).toBe(GROUND_Y - 20);
    });

    test("should maintain ground alignment after setSpawnPosition", () => {
      obstacle.setSpawnPosition(200, GROUND_Y - 20);
      const box = obstacle.getBoundingBox();
      expect(box.y + box.height).toBe(GROUND_Y);
    });
  });

  describe("Ground Y Consistency", () => {
    test("should use consistent ground Y value", () => {
      expect(GROUND_Y).toBe(196); // 216 - 20
    });

    test("should align player and obstacle collision boxes with same ground", () => {
      const playerConfig: PlayerConfig = {
        position: { x: 50, y: GROUND_Y - 20 }, // Feet at ground level
        size: { width: 20, height: 20 },
        jumpPower: -12,
        groundY: GROUND_Y - 20, // Player's ground reference is feet position
      };
      const player = new Player(playerConfig);

      const obstacleConfig: ObstacleConfig = {
        position: { x: 100, y: GROUND_Y - 20 },
        size: { width: 16, height: 20 },
        type: "error",
      };
      const obstacle = new Obstacle(obstacleConfig);

      const playerBox = player.getBoundingBox();
      const obstacleBox = obstacle.getBoundingBox();

      // Both should align with the same ground line
      expect(playerBox.y + playerBox.height).toBe(GROUND_Y); // Player feet
      expect(obstacleBox.y + obstacleBox.height).toBe(GROUND_Y); // Obstacle bottom
    });
  });
});
