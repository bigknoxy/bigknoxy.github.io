/**
 * Object Pool - Reuses objects to improve performance
 */

export interface PoolableObject {
  reset(): void;
  active: boolean;
}

export class ObjectPool<T extends PoolableObject> {
  private pool: T[] = [];
  private createFn: () => T;
  private maxSize: number;
  private activeCount: number = 0;

  constructor(
    createFn: () => T,
    initialSize: number = 10,
    maxSize: number = 100,
  ) {
    this.createFn = createFn;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Get an object from the pool
   */
  public acquire(): T {
    // Try to find inactive object
    for (const obj of this.pool) {
      if (!obj.active) {
        obj.reset();
        obj.active = true;
        this.activeCount++;
        return obj;
      }
    }

    // Create new object if pool not at max size
    if (this.pool.length < this.maxSize) {
      const newObj = this.createFn();
      newObj.active = true;
      this.pool.push(newObj);
      this.activeCount++;
      return newObj;
    }

    // Pool is full, return first inactive object (force reuse)
    console.warn("ObjectPool: Pool at maximum size, forcing reuse");
    const obj = this.pool[0];
    obj.reset();
    obj.active = true;
    return obj;
  }

  /**
   * Return an object to the pool
   */
  public release(obj: T): void {
    if (obj.active) {
      obj.active = false;
      this.activeCount--;
    }
  }

  /**
   * Release all active objects
   */
  public releaseAll(): void {
    for (const obj of this.pool) {
      obj.active = false;
    }
    this.activeCount = 0;
  }

  /**
   * Get all active objects
   */
  public getActive(): T[] {
    return this.pool.filter((obj) => obj.active);
  }

  /**
   * Get all inactive objects
   */
  public getInactive(): T[] {
    return this.pool.filter((obj) => !obj.active);
  }

  /**
   * Get total pool size
   */
  public getSize(): number {
    return this.pool.length;
  }

  /**
   * Get number of active objects
   */
  public getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get number of inactive objects
   */
  public getInactiveCount(): number {
    return this.pool.length - this.activeCount;
  }

  /**
   * Check if pool is at maximum capacity
   */
  public isFull(): boolean {
    return this.pool.length >= this.maxSize;
  }

  /**
   * Clear pool (remove all objects)
   */
  public clear(): void {
    this.pool.length = 0;
    this.activeCount = 0;
  }

  /**
   * Shrink pool to specified size
   */
  public shrink(newSize: number): void {
    if (newSize >= this.pool.length) return;

    // Keep only the first newSize objects
    this.pool = this.pool.slice(0, newSize);

    // Recalculate active count
    this.activeCount = this.pool.filter((obj) => obj.active).length;
  }

  /**
   * Expand pool to specified size
   */
  public expand(newSize: number): void {
    if (newSize <= this.pool.length) return;

    const targetSize = Math.min(newSize, this.maxSize);
    while (this.pool.length < targetSize) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    total: number;
    active: number;
    inactive: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      total: this.pool.length,
      active: this.activeCount,
      inactive: this.pool.length - this.activeCount,
      maxSize: this.maxSize,
      utilization:
        this.pool.length > 0 ? this.activeCount / this.pool.length : 0,
    };
  }

  /**
   * Iterate over all objects in pool
   */
  public forEach(callback: (obj: T, index: number) => void): void {
    this.pool.forEach(callback);
  }

  /**
   * Find first object matching predicate
   */
  public find(predicate: (obj: T) => boolean): T | undefined {
    return this.pool.find(predicate);
  }

  /**
   * Find all objects matching predicate
   */
  public filter(predicate: (obj: T) => boolean): T[] {
    return this.pool.filter(predicate);
  }

  /**
   * Map over all objects in pool
   */
  public map<U>(callback: (obj: T, index: number) => U): U[] {
    return this.pool.map(callback);
  }

  /**
   * Reduce over all objects in pool
   */
  public reduce<U>(
    callback: (accumulator: U, obj: T, index: number) => U,
    initialValue: U,
  ): U {
    return this.pool.reduce(callback, initialValue);
  }
}

/**
 * Specialized pool for game entities
 */
export class EntityPool<T extends PoolableObject> extends ObjectPool<T> {
  constructor(
    createFn: () => T,
    initialSize: number = 20,
    maxSize: number = 200,
  ) {
    super(createFn, initialSize, maxSize);
  }

  /**
   * Get active entities within screen bounds
   */
  public getVisible(screenWidth: number, screenHeight: number): T[] {
    return this.getActive().filter((ent) => {
      // This assumes entities have position and size properties
      const entity = ent as any;
      return (
        entity.position &&
        entity.size &&
        entity.position.x + entity.size.width >= 0 &&
        entity.position.x <= screenWidth &&
        entity.position.y + entity.size.height >= 0 &&
        entity.position.y <= screenHeight
      );
    });
  }

  /**
   * Update all active entities
   */
  public updateAll(deltaTime: number, gameSpeed: number): void {
    this.getActive().forEach((entity) => {
      if ((entity as any).update) {
        (entity as any).update(deltaTime, gameSpeed);
      }
    });
  }

  /**
   * Render all active entities
   */
  public renderAll(ctx: CanvasRenderingContext2D): void {
    this.getActive().forEach((entity) => {
      if ((entity as any).render) {
        (entity as any).render(ctx);
      }
    });
  }

  /**
   * Clean up off-screen entities
   */
  public cleanupOffScreen(screenWidth: number, screenHeight: number): void {
    this.getActive().forEach((ent) => {
      const entityObj = ent as any;
      if (entityObj.position && entityObj.size) {
        const isOffScreen =
          entityObj.position.x + entityObj.size.width < -50 ||
          entityObj.position.x > screenWidth + 50 ||
          entityObj.position.y > screenHeight + 50;

        if (isOffScreen) {
          this.release(ent);
        }
      }
    });
  }
}
