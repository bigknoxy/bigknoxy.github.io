/**
 * Player entity - The main character controlled by the user
 */

import { Entity } from "./Entity";
import type { PlayerConfig, Vector2D } from "../types/GameTypes";

export class Player extends Entity {
  public jumpPower: number;
  public groundY: number;
  public isJumping: boolean = false;
  public animationFrame: number = 0;
  public animationTimer: number = 0;

  constructor(config: PlayerConfig) {
    super(config, "player");
    this.jumpPower = config.jumpPower;
    this.groundY = config.groundY;
    this.position.y = this.groundY;
  }

  /**
   * Update player physics and animation
   */
  public update(deltaTime: number, _gameSpeed: number): void {
    // Apply gravity
    this.velocity.y += 0.8; // Gravity constant
    this.position.y += this.velocity.y;

    // Ground collision
    if (this.position.y >= this.groundY) {
      this.position.y = this.groundY;
      this.velocity.y = 0;
      this.isJumping = false;
    }

    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 100) {
      this.animationFrame = (this.animationFrame + 1) % 2;
      this.animationTimer = 0;
    }
  }

  /**
   * Render player as pixel art character
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Use GameBoy palette colors
    ctx.fillStyle = "#0f380f"; // Darkest green

    // Body (16x8 rectangle)
    ctx.fillRect(this.position.x + 4, this.position.y + 8, 12, 8);

    // Head (12x6 rectangle)
    ctx.fillRect(this.position.x + 6, this.position.y + 2, 8, 6);

    // Legs with running animation
    if (this.isJumping) {
      // Jump pose - legs together
      ctx.fillRect(this.position.x + 6, this.position.y + 16, 3, 4);
      ctx.fillRect(this.position.x + 11, this.position.y + 16, 3, 4);
    } else {
      // Running animation
      if (this.animationFrame === 0) {
        // Frame 1: normal stance
        ctx.fillRect(this.position.x + 6, this.position.y + 16, 3, 4);
        ctx.fillRect(this.position.x + 11, this.position.y + 16, 3, 4);
      } else {
        // Frame 2: running stance
        ctx.fillRect(this.position.x + 5, this.position.y + 16, 3, 4);
        ctx.fillRect(this.position.x + 12, this.position.y + 16, 3, 4);
      }
    }

    // Eyes (2x1 pixels)
    ctx.fillStyle = "#9bbc0f"; // Lightest green
    ctx.fillRect(this.position.x + 7, this.position.y + 4, 2, 1);
    ctx.fillRect(this.position.x + 11, this.position.y + 4, 2, 1);
  }

  /**
   * Make the player jump
   */
  public jump(): void {
    if (!this.isJumping) {
      this.velocity.y = this.jumpPower;
      this.isJumping = true;
    }
  }

  /**
   * Check if player can jump
   */
  public canJump(): boolean {
    return !this.isJumping;
  }

  /**
   * Move player horizontally
   */
  public moveLeft(): void {
    this.velocity.x = -3;
  }

  public moveRight(): void {
    this.velocity.x = 3;
  }

  public stopHorizontalMovement(): void {
    this.velocity.x = 0;
  }

  /**
   * Reset player to initial state
   */
  public reset(): void {
    super.reset();
    this.position.y = this.groundY;
    this.velocity = { x: 0, y: 0 };
    this.isJumping = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
  }

  /**
   * Get player center position
   */
  public getCenter(): Vector2D {
    return {
      x: this.position.x + this.size.width / 2,
      y: this.position.y + this.size.height / 2,
    };
  }

  /**
   * Check if player is on ground
   */
  public isOnGround(): boolean {
    return this.position.y >= this.groundY;
  }
}
