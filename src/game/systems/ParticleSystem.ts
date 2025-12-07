/**
 * Particle System - Manages particle effects with object pooling and LOD
 */

import type {
  ParticleSystemConfig,
  Vector2D,
  CollectibleVisualConfig,
} from "../types/GameTypes";

interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
  dead?: boolean; // Mark for deferred removal
}

export class ParticleSystem {
  private config: ParticleSystemConfig;
  private particles: Particle[] = [];
  private activeCount: number = 0;
  private currentFPS: number = 60;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  // Performance LOD
  private currentLOD: "low" | "medium" | "high" = "high";
  private maxParticlesCurrent: number;
  private readonly DEFAULT_MAX_PARTICLES = 48;

  constructor(config: ParticleSystemConfig) {
    this.config = config;
    this.maxParticlesCurrent = Math.min(
      config.maxParticles,
      this.DEFAULT_MAX_PARTICLES,
    );

    // Initialize particle pool
    for (let i = 0; i < this.maxParticlesCurrent; i++) {
      this.particles.push({
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        life: 0,
        maxLife: config.particleLife,
        color: "#9bbc0f",
        size: 2,
        active: false,
        dead: false,
      });
    }
  }

  /**
   * Emit particles for collectible collection
   */
  public emitCollect(
    position: Vector2D,
    visualConfig: CollectibleVisualConfig,
  ): void {
    if (!visualConfig.particleEnabled) return;

    // Respect maxParticles limit and remaining capacity
    const particleCount = Math.min(
      this.config.emitCount,
      this.maxParticlesCurrent - this.activeCount,
    );
    if (particleCount <= 0) return;

    const colors = this.config.colors.collect;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 2;

      this.createParticle(
        {
          x: position.x,
          y: position.y,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 1, // Slight upward bias
        },
        colors[Math.floor(Math.random() * colors.length)],
      );
    }
  }

  /**
   * Emit particles for jump effect
   */
  public emitJump(position: Vector2D): void {
    const particleCount = Math.min(
      4,
      this.maxParticlesCurrent - this.activeCount,
    );
    if (particleCount <= 0) return;

    const colors = this.config.colors.jump;

    for (let i = 0; i < particleCount; i++) {
      this.createParticle(
        {
          x: position.x + (Math.random() - 0.5) * 10,
          y: position.y,
        },
        {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * -2,
        },
        colors[Math.floor(Math.random() * colors.length)],
      );
    }
  }

  /**
   * Emit particles for game over effect
   */
  public emitGameOver(position: Vector2D): void {
    const particleCount = Math.min(
      12,
      this.maxParticlesCurrent - this.activeCount,
    );
    if (particleCount <= 0) return;

    const colors = this.config.colors.gameover;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      this.createParticle(
        {
          x: position.x,
          y: position.y,
        },
        {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        colors[Math.floor(Math.random() * colors.length)],
      );
    }
  }

  /**
   * Update particle system
   */
  public update(deltaMs: number): void {
    const deltaTime = deltaMs / 1000; // Convert to seconds

    // Update FPS counter
    this.updateFPS(deltaMs);

    // Update LOD based on performance
    this.updateLOD();

    // Update active particles - mark dead but don't remove during iteration
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (!particle.active) continue;

      // Update physics
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.velocity.y += this.config.gravity;

      // Update life
      particle.life -= deltaTime;

      // Mark dead particles for deferred removal
      if (particle.life <= 0) {
        particle.dead = true;
      }
    }

    // Compact array - remove dead particles in-place
    this.compactParticles();
  }

  /**
   * Render particles
   */
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const particle of this.particles) {
      if (!particle.active) continue;

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      const size = particle.size * (0.5 + alpha * 0.5); // Shrink as life decreases
      ctx.fillRect(
        Math.round(particle.position.x - size / 2),
        Math.round(particle.position.y - size / 2),
        size,
        size,
      );
    }

    ctx.restore();
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
    this.activeCount = 0;
  }

  /**
   * Destroy particle system
   */
  public destroy(): void {
    this.clear();
    this.particles = [];
  }

  /**
   * Get current particle count
   */
  public getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get current LOD level
   */
  public getCurrentLOD(): "low" | "medium" | "high" {
    return this.currentLOD;
  }

  /**
   * Create a single particle
   */
  private createParticle(
    position: Vector2D,
    velocity: Vector2D,
    color: string,
  ): void {
    // Find inactive particle
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle.active && !particle.dead) {
        particle.position = { ...position };
        particle.velocity = { ...velocity };
        particle.life = this.config.particleLife;
        particle.maxLife = this.config.particleLife;
        particle.color = color;
        particle.size = 2 + Math.random() * 2;
        particle.active = true;
        particle.dead = false;
        this.activeCount++;
        return;
      }
    }
  }

  /**
   * Update FPS counter
   */
  private updateFPS(_deltaMs: number): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.fpsUpdateTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  /**
   * Compact particles array - remove dead particles in-place
   */
  private compactParticles(): void {
    let writeIndex = 0;

    // First pass: compact active particles
    for (let readIndex = 0; readIndex < this.particles.length; readIndex++) {
      const particle = this.particles[readIndex];

      if (particle.active && !particle.dead) {
        // Move particle to write position if needed
        if (readIndex !== writeIndex) {
          this.particles[writeIndex] = particle;
        }
        writeIndex++;
      } else if (particle.dead || (particle.active && particle.life <= 0)) {
        // Reclaim dead particle
        particle.active = false;
        particle.dead = false;
        this.activeCount--;
      }
    }

    // Clear remaining slots
    for (let i = writeIndex; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle.active) {
        particle.active = false;
        particle.dead = false;
        this.activeCount--;
      }
    }
  }

  /**
   * Update Level of Detail based on performance
   */
  private updateLOD(): void {
    // Determine LOD based on FPS and hardware
    if (
      this.currentFPS < this.config.performanceThreshold ||
      (typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 2)
    ) {
      this.currentLOD = "low";
      this.maxParticlesCurrent = Math.floor(this.DEFAULT_MAX_PARTICLES * 0.25);
    } else if (this.currentFPS < this.config.performanceThreshold * 1.5) {
      this.currentLOD = "medium";
      this.maxParticlesCurrent = Math.floor(this.DEFAULT_MAX_PARTICLES * 0.6);
    } else {
      this.currentLOD = "high";
      this.maxParticlesCurrent = this.DEFAULT_MAX_PARTICLES;
    }

    // Safe LOD reduction - only affect new emissions, don't kill active particles
    // Active particles will expire naturally through the compaction system
  }
}
