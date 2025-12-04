/**
 * Collision Tests - Unit tests for collision detection
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Player } from "../../src/game/entities/Player";
import { Obstacle } from "../../src/game/entities/Obstacle";
import { PhysicsSystem } from "../../src/game/systems/PhysicsSystem";

describe("Collision Detection", () => {
  let physicsSystem: PhysicsSystem;
  let player: Player;
  let obstacle: Obstacle;

  beforeEach(() => {
    physicsSystem = new PhysicsSystem();

    // Create player at ground level (y = 156 for 216px height canvas)
    player = new Player({
      position: { x: 50, y: 156 }, // Feet at ground level
      size: { width: 20, height: 20 },
      jumpPower: -12,
      groundY: 156, // Player's ground reference is feet position
    });

    // Create obstacle at same ground level
    obstacle = new Obstacle({
      position: { x: 70, y: 156 },
      size: { width: 16, height: 20 },
      type: "bug",
    });
  });

  describe("Player and Obstacle Collision", () => {
    it("should detect collision when player and obstacle overlap on ground", () => {
      // Player at x: 50-70, Obstacle at x: 65-81 (overlapping)
      player.position.x = 50;
      obstacle.position.x = 65;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(true);
    });

    it("should detect collision when player is inside obstacle bounds", () => {
      // Player completely overlapping obstacle
      player.position.x = 75;
      obstacle.position.x = 70;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(true);
    });

    it("should not detect collision when player is far from obstacle", () => {
      player.position.x = 20;
      obstacle.position.x = 100;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(false);
    });

    it("should not detect collision when player is jumping above obstacle", () => {
      // Player jumping high above obstacle
      player.position.x = 75;
      player.position.y = 100; // High in the air
      obstacle.position.x = 70;
      obstacle.position.y = 156;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(false);
    });

    it("should detect collision when player is descending onto obstacle", () => {
      // Player falling onto obstacle
      player.position.x = 75;
      player.position.y = 140; // Just above obstacle
      obstacle.position.x = 70;
      obstacle.position.y = 156;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(true);
    });
  });

  describe("Player Bounding Box Alignment", () => {
    it("should have bounding box that aligns with visual sprite", () => {
      const playerBox = player.getBoundingBox();

      // Player position y: 156, size height: 20
      // Bounding box should match full sprite for accurate ground collision
      expect(playerBox.x).toBe(50);
      expect(playerBox.y).toBe(156); // Full height position
      expect(playerBox.width).toBe(20);
      expect(playerBox.height).toBe(20); // Full height
    });

    it("should have feet at ground level when positioned at groundY", () => {
      // Player at ground level should have collision box bottom at ground line
      const playerBox = player.getBoundingBox();
      const boxBottom = playerBox.y + playerBox.height;

      // Should be at ground level for accurate collision
      expect(boxBottom).toBe(176); // 156 + 20 = 176 (ground line)
    });
  });

  describe("Obstacle Bounding Box", () => {
    it("should have correct bounding box dimensions", () => {
      const obstacleBox = obstacle.getBoundingBox();

      expect(obstacleBox.x).toBe(70);
      expect(obstacleBox.y).toBe(156);
      expect(obstacleBox.width).toBe(16);
      expect(obstacleBox.height).toBe(20);
    });
  });

  describe("Edge Cases", () => {
    it("should handle edge touching as collision", () => {
      // Player right edge overlapping obstacle left edge
      player.position.x = 55; // Player spans 55-75
      obstacle.position.x = 74; // Obstacle spans 74-90

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(true);
    });

    it("should handle vertical edge touching", () => {
      // Player bottom edge overlapping obstacle top edge
      player.position.x = 75;
      player.position.y = 137; // Player spans 137-153 (with offset)
      obstacle.position.x = 70;
      obstacle.position.y = 156; // Obstacle spans 156-176

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(true);
    });

    it("should not collide when entities are diagonally separated", () => {
      player.position.x = 30;
      player.position.y = 120;
      obstacle.position.x = 80;
      obstacle.position.y = 156;

      const hasCollision = physicsSystem.checkCollision(player, obstacle);
      expect(hasCollision).toBe(false);
    });
  });

  describe("Physics System Collision Methods", () => {
    it("should provide correct collision side detection", () => {
      player.position.x = 50;
      obstacle.position.x = 65; // Overlapping for collision detection

      const side = physicsSystem.getCollisionSide(player, obstacle);
      expect(side).toBe("left");
    });

    it("should detect top collision when player is above obstacle", () => {
      player.position.x = 75;
      player.position.y = 140;
      obstacle.position.x = 70;
      obstacle.position.y = 156;

      const side = physicsSystem.getCollisionSide(player, obstacle);
      expect(side).toBe("top");
    });
  });
});
