/**
 * Collectible entity - Items the player can collect for points
 */

import { Entity } from "./Entity";
import type { CollectibleConfig, CollectibleType } from "../types/GameTypes";

export class Collectible extends Entity {
  public collectibleType: CollectibleType;
  public points: number;
  public animationFrame: number = 0;
  public animationTimer: number = 0;
  public collected: boolean = false;

  constructor(config: CollectibleConfig) {
    super(config, "collectible");
    this.collectibleType = config.type;
    this.points = config.points;
  }

  /**
   * Update collectible animation and movement
   */
  public update(deltaTime: number, gameSpeed: number): void {
    // Move collectible from right to left
    this.position.x -= gameSpeed;

    // Floating animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 100) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }

    // Add floating effect
    const floatOffset = Math.sin((this.animationFrame * Math.PI) / 2) * 2;
    this.position.y += floatOffset * 0.1;

    // Deactivate if off screen
    if (this.position.x + this.size.width < 0) {
      this.active = false;
    }
  }

  /**
   * Render collectible based on type
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    // Use GameBoy palette colors
    if (this.collectibleType === "commit") {
      this.renderCommit(ctx);
    } else {
      this.renderStar(ctx);
    }
  }

  /**
   * Render commit icon (git commit symbol)
   */
  private renderCommit(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Main circle
    ctx.fillStyle = "#8bac0f"; // Light green
    ctx.fillRect(x + 4, y + 4, 8, 8);

    // Inner circle (animated)
    ctx.fillStyle = "#9bbc0f"; // Lightest green
    if (this.animationFrame % 2 === 0) {
      ctx.fillRect(x + 6, y + 6, 4, 4);
    } else {
      ctx.fillRect(x + 7, y + 7, 2, 2);
    }

    // Commit lines
    ctx.fillStyle = "#306230"; // Dark green
    ctx.fillRect(x + 2, y + 7, 2, 2); // Left line
    ctx.fillRect(x + 12, y + 7, 2, 2); // Right line
    ctx.fillRect(x + 7, y + 2, 2, 2); // Top line
    ctx.fillRect(x + 7, y + 12, 2, 2); // Bottom line

    // Sparkle effect
    if (this.animationFrame === 0 || this.animationFrame === 2) {
      ctx.fillStyle = "#9bbc0f"; // Lightest green
      ctx.fillRect(x + 14, y + 2, 1, 1); // Top right sparkle
      ctx.fillRect(x + 1, y + 13, 1, 1); // Bottom left sparkle
    }
  }

  /**
   * Render star icon
   */
  private renderStar(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Star shape using pixels
    ctx.fillStyle = "#8bac0f"; // Light green

    // Center
    ctx.fillRect(x + 7, y + 7, 2, 2);

    // Points (animated)
    if (this.animationFrame % 2 === 0) {
      // Extended star
      ctx.fillRect(x + 7, y + 2, 2, 3); // Top point
      ctx.fillRect(x + 7, y + 11, 2, 3); // Bottom point
      ctx.fillRect(x + 2, y + 7, 3, 2); // Left point
      ctx.fillRect(x + 11, y + 7, 3, 2); // Right point
    } else {
      // Compact star
      ctx.fillRect(x + 7, y + 3, 2, 2); // Top point
      ctx.fillRect(x + 7, y + 11, 2, 2); // Bottom point
      ctx.fillRect(x + 3, y + 7, 2, 2); // Left point
      ctx.fillRect(x + 11, y + 7, 2, 2); // Right point
    }

    // Diagonal points
    ctx.fillRect(x + 4, y + 4, 2, 2); // Top-left
    ctx.fillRect(x + 10, y + 4, 2, 2); // Top-right
    ctx.fillRect(x + 4, y + 10, 2, 2); // Bottom-left
    ctx.fillRect(x + 10, y + 10, 2, 2); // Bottom-right

    // Glow effect
    if (this.animationFrame === 1 || this.animationFrame === 3) {
      ctx.fillStyle = "#9bbc0f"; // Lightest green
      ctx.fillRect(x + 6, y + 6, 4, 4); // Inner glow
    }
  }

  /**
   * Mark collectible as collected
   */
  public collect(): void {
    this.collected = true;
    this.active = false;
  }

  /**
   * Reset collectible to initial state
   */
  public reset(): void {
    super.reset();
    this.collected = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
  }

  /**
   * Set collectible position (for spawning)
   */
  public setSpawnPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.active = true;
    this.collected = false;
  }

  /**
   * Get collectible value
   */
  public getValue(): number {
    return this.points;
  }

  /**
   * Check if collectible can be collected
   */
  public canCollect(): boolean {
    return this.active && !this.collected;
  }
}
