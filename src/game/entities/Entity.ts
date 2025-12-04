/**
 * Base Entity class - All game objects inherit from this
 */

import type {
  Vector2D,
  Size2D,
  BoundingBox,
  EntityConfig,
  EntityType,
} from "../types/GameTypes";

export abstract class Entity {
  public position: Vector2D;
  public size: Size2D;
  public velocity: Vector2D;
  public active: boolean = true;
  public type: EntityType;
  public id: string;

  constructor(config: EntityConfig, type: EntityType) {
    this.position = { ...config.position };
    this.size = { ...config.size };
    this.velocity = config.velocity ? { ...config.velocity } : { x: 0, y: 0 };
    this.active = config.active !== undefined ? config.active : true;
    this.type = type;
    this.id = this.generateId();
  }

  /**
   * Generate unique ID for entity
   */
  private generateId(): string {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Update entity state - called every frame
   */
  public abstract update(deltaTime: number, gameSpeed: number): void;

  /**
   * Render entity - called every frame
   */
  public abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Get bounding box for collision detection
   */
  public getBoundingBox(): BoundingBox {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  /**
   * Check if this entity collides with another
   */
  public collidesWith(other: Entity): boolean {
    const box1 = this.getBoundingBox();
    const box2 = other.getBoundingBox();

    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Check if entity is visible on screen
   */
  public isVisible(screenWidth: number, screenHeight: number): boolean {
    return (
      this.position.x + this.size.width >= 0 &&
      this.position.x <= screenWidth &&
      this.position.y + this.size.height >= 0 &&
      this.position.y <= screenHeight
    );
  }

  /**
   * Reset entity state
   */
  public reset(): void {
    this.active = true;
    this.velocity = { x: 0, y: 0 };
  }

  /**
   * Destroy entity - mark as inactive
   */
  public destroy(): void {
    this.active = false;
  }

  /**
   * Get distance to another entity
   */
  public distanceTo(other: Entity): number {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Move entity by given amount
   */
  public move(dx: number, dy: number): void {
    this.position.x += dx;
    this.position.y += dy;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Set velocity
   */
  public setVelocity(vx: number, vy: number): void {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }
}
