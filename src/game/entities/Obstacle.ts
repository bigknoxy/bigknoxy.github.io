/**
 * Obstacle entity - Things the player must avoid
 */

import { Entity } from "./Entity";
import type { ObstacleConfig, ObstacleType } from "../types/GameTypes";

export class Obstacle extends Entity {
  public obstacleType: ObstacleType;
  public animationFrame: number = 0;
  public animationTimer: number = 0;

  constructor(config: ObstacleConfig) {
    super(config, "obstacle");
    this.obstacleType = config.type;
  }

  /**
   * Update obstacle movement and animation
   */
  public update(deltaTime: number, gameSpeed: number): void {
    // Move obstacle from right to left
    this.position.x -= gameSpeed;

    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) {
      this.animationFrame = (this.animationFrame + 1) % 2;
      this.animationTimer = 0;
    }

    // Deactivate if off screen
    if (this.position.x + this.size.width < 0) {
      this.active = false;
    }
  }

  /**
   * Render obstacle based on type
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Use GameBoy palette colors
    ctx.fillStyle = "#0f380f"; // Darkest green

    if (this.obstacleType === "bug") {
      this.renderBug(ctx);
    } else {
      this.renderErrorBlock(ctx);
    }
  }

  /**
   * Render bug sprite
   */
  private renderBug(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Bug body segments
    ctx.fillRect(x + 2, y + 4, 12, 4); // Upper body
    ctx.fillRect(x + 4, y + 8, 8, 4); // Middle body
    ctx.fillRect(x + 6, y + 12, 4, 4); // Lower body
    ctx.fillRect(x + 2, y + 16, 12, 4); // Tail

    // Animated legs
    if (this.animationFrame === 0) {
      ctx.fillRect(x + 2, y + 8, 2, 4); // Left leg 1
      ctx.fillRect(x + 14, y + 8, 2, 4); // Right leg 1
      ctx.fillRect(x + 4, y + 12, 2, 4); // Left leg 2
      ctx.fillRect(x + 12, y + 12, 2, 4); // Right leg 2
    } else {
      ctx.fillRect(x + 4, y + 8, 2, 4); // Left leg 1 (moved)
      ctx.fillRect(x + 12, y + 8, 2, 4); // Right leg 1 (moved)
      ctx.fillRect(x + 2, y + 12, 2, 4); // Left leg 2 (moved)
      ctx.fillRect(x + 14, y + 12, 2, 4); // Right leg 2 (moved)
    }

    // Antennae
    ctx.fillRect(x + 6, y, 2, 4); // Left antenna
    ctx.fillRect(x + 8, y, 2, 4); // Right antenna

    // Eyes
    ctx.fillStyle = "#9bbc0f"; // Lightest green
    ctx.fillRect(x + 6, y + 6, 2, 1);
    ctx.fillRect(x + 8, y + 6, 2, 1);
  }

  /**
   * Render error block sprite
   */
  private renderErrorBlock(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Main block
    ctx.fillRect(x, y, this.size.width, this.size.height);

    // X symbol in contrasting color
    ctx.fillStyle = "#9bbc0f"; // Lightest green

    // Diagonal lines for X
    ctx.fillRect(x + 2, y + 2, 12, 2); // Top horizontal
    ctx.fillRect(x + 2, y + 16, 12, 2); // Bottom horizontal
    ctx.fillRect(x + 2, y + 2, 2, 12); // Left vertical
    ctx.fillRect(x + 12, y + 2, 2, 12); // Right vertical

    // Animated error indicator
    if (this.animationFrame === 0) {
      ctx.fillRect(x + 6, y + 6, 4, 4); // Center square
    } else {
      ctx.fillRect(x + 7, y + 7, 2, 2); // Smaller center square
    }
  }

  /**
   * Reset obstacle to initial state
   */
  public reset(): void {
    super.reset();
    this.animationFrame = 0;
    this.animationTimer = 0;
  }

  /**
   * Set obstacle position (for spawning)
   */
  public setSpawnPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.active = true;
  }

  /**
   * Get obstacle difficulty score
   */
  public getDifficulty(): number {
    return this.obstacleType === "bug" ? 1 : 2;
  }
}
