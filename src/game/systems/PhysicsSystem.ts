/**
 * Physics System - Handles collision detection and physics calculations
 */

import type { BoundingBox, Vector2D } from "../types/GameTypes";
import { Entity } from "../entities/Entity";

export class PhysicsSystem {
  private gravity: number;
  private friction: number;

  constructor(gravity: number = 0.8, friction: number = 0.9) {
    this.gravity = gravity;
    this.friction = friction;
  }

  /**
   * Check AABB collision between two entities
   */
  public checkCollision(entity1: Entity, entity2: Entity): boolean {
    const box1 = entity1.getBoundingBox();
    const box2 = entity2.getBoundingBox();

    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Check collision between bounding boxes
   */
  public checkBoxCollision(box1: BoundingBox, box2: BoundingBox): boolean {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  /**
   * Get collision side information
   */
  public getCollisionSide(
    entity1: Entity,
    entity2: Entity,
  ): "top" | "bottom" | "left" | "right" | "none" {
    const box1 = entity1.getBoundingBox();
    const box2 = entity2.getBoundingBox();

    // Calculate overlap on each axis
    const overlapX = Math.min(
      box1.x + box1.width - box2.x,
      box2.x + box2.width - box1.x,
    );
    const overlapY = Math.min(
      box1.y + box1.height - box2.y,
      box2.y + box2.height - box1.y,
    );

    // No collision
    if (overlapX <= 0 || overlapY <= 0) {
      return "none";
    }

    // Determine collision side based on minimum overlap
    if (overlapX < overlapY) {
      // Horizontal collision
      return box1.x < box2.x ? "left" : "right";
    } else {
      // Vertical collision
      return box1.y < box2.y ? "top" : "bottom";
    }
  }

  /**
   * Apply gravity to an entity
   */
  public applyGravity(entity: Entity, deltaTime: number): void {
    entity.velocity.y += this.gravity * (deltaTime / 16.67); // Normalize to 60 FPS
  }

  /**
   * Apply friction to an entity's velocity
   */
  public applyFriction(entity: Entity): void {
    entity.velocity.x *= this.friction;
    entity.velocity.y *= this.friction;
  }

  /**
   * Clamp velocity to maximum values
   */
  public clampVelocity(entity: Entity, maxVelocity: Vector2D): void {
    entity.velocity.x = Math.max(
      -maxVelocity.x,
      Math.min(maxVelocity.x, entity.velocity.x),
    );
    entity.velocity.y = Math.max(
      -maxVelocity.y,
      Math.min(maxVelocity.y, entity.velocity.y),
    );
  }

  /**
   * Check if entity is grounded (on top of another entity)
   */
  public isGrounded(entity: Entity, ground: Entity): boolean {
    const entityBox = entity.getBoundingBox();
    const groundBox = ground.getBoundingBox();

    // Check if entity is directly above ground and touching
    return (
      entityBox.y + entityBox.height >= groundBox.y - 1 &&
      entityBox.y + entityBox.height <= groundBox.y + 5 &&
      entityBox.x + entityBox.width > groundBox.x &&
      entityBox.x < groundBox.x + groundBox.width
    );
  }

  /**
   * Check if entity is grounded on a Y coordinate
   */
  public isGroundedOnY(entity: Entity, groundY: number): boolean {
    return entity.position.y + entity.size.height >= groundY - 1;
  }

  /**
   * Resolve collision by separating entities
   */
  public resolveCollision(entity1: Entity, entity2: Entity): void {
    const side = this.getCollisionSide(entity1, entity2);
    const box1 = entity1.getBoundingBox();
    const box2 = entity2.getBoundingBox();

    switch (side) {
      case "left":
        entity1.position.x = box2.x - box1.width;
        entity1.velocity.x = 0;
        break;
      case "right":
        entity1.position.x = box2.x + box2.width;
        entity1.velocity.x = 0;
        break;
      case "top":
        entity1.position.y = box2.y - box1.height;
        entity1.velocity.y = 0;
        break;
      case "bottom":
        entity1.position.y = box2.y + box2.height;
        entity1.velocity.y = 0;
        break;
    }
  }

  /**
   * Calculate distance between two entities
   */
  public getDistance(entity1: Entity, entity2: Entity): number {
    const dx = entity1.position.x - entity2.position.x;
    const dy = entity1.position.y - entity2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if entities are within a certain distance
   */
  public isWithinRange(
    entity1: Entity,
    entity2: Entity,
    range: number,
  ): boolean {
    return this.getDistance(entity1, entity2) <= range;
  }

  /**
   * Get the center point of an entity
   */
  public getCenter(entity: Entity): Vector2D {
    return {
      x: entity.position.x + entity.size.width / 2,
      y: entity.position.y + entity.size.height / 2,
    };
  }

  /**
   * Check if a point is inside an entity
   */
  public isPointInside(entity: Entity, point: Vector2D): boolean {
    const box = entity.getBoundingBox();
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }

  /**
   * Raycast from a point in a direction
   */
  public raycast(
    origin: Vector2D,
    direction: Vector2D,
    maxDistance: number,
    entities: Entity[],
  ): { entity: Entity | null; distance: number; point: Vector2D } {
    const normalizedDir = this.normalize(direction);
    let closestEntity: Entity | null = null;
    let closestDistance = maxDistance;
    let closestPoint: Vector2D = {
      x: origin.x + normalizedDir.x * maxDistance,
      y: origin.y + normalizedDir.y * maxDistance,
    };

    for (const entity of entities) {
      if (!entity.active) continue;

      // Simple ray-box intersection
      const intersection = this.rayBoxIntersection(
        origin,
        normalizedDir,
        entity,
      );
      if (intersection && intersection.distance < closestDistance) {
        closestEntity = entity;
        closestDistance = intersection.distance;
        closestPoint = intersection.point;
      }
    }

    return {
      entity: closestEntity,
      distance: closestDistance,
      point: closestPoint,
    };
  }

  /**
   * Normalize a vector
   */
  private normalize(vector: Vector2D): Vector2D {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
    };
  }

  /**
   * Simple ray-box intersection
   */
  private rayBoxIntersection(
    rayOrigin: Vector2D,
    rayDir: Vector2D,
    entity: Entity,
  ): { distance: number; point: Vector2D } | null {
    const box = entity.getBoundingBox();

    // This is a simplified implementation
    // In a real game, you'd want a more robust ray-box intersection algorithm
    const center = this.getCenter(entity);
    const toCenter = {
      x: center.x - rayOrigin.x,
      y: center.y - rayOrigin.y,
    };

    const projection = toCenter.x * rayDir.x + toCenter.y * rayDir.y;

    if (projection < 0) return null;

    const closestPoint = {
      x: rayOrigin.x + rayDir.x * projection,
      y: rayOrigin.y + rayDir.y * projection,
    };

    if (this.isPointInside(entity, closestPoint)) {
      return {
        distance: projection,
        point: closestPoint,
      };
    }

    return null;
  }
}
