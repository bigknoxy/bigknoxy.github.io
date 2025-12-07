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

  constructor(config: ParticleSystemConfig) {
    this.config = config;
    this.maxParticlesCurrent = config.maxParticles;

    // Initialize particle pool
    for (let i = 0; i < config.maxParticles; i++) {
      this.particles.push({
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        life: 0,
        maxLife: config.particleLife,
        color: "#9bbc0f",
        size: 2,
        active: false,
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

    // Update active particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (!particle.active) continue;

      // Update physics
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.velocity.y += this.config.gravity;

      // Update life
      particle.life -= deltaTime;

      // Deactivate dead particles
      if (particle.life <= 0) {
        particle.active = false;
        this.activeCount--;
      }
    }
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
      if (!particle.active) {
        particle.position = { ...position };
        particle.velocity = { ...velocity };
        particle.life = this.config.particleLife;
        particle.maxLife = this.config.particleLife;
        particle.color = color;
        particle.size = 2 + Math.random() * 2;
        particle.active = true;
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
   * Update Level of Detail based on performance
   */
  private updateLOD(): void {
    // Determine LOD based on FPS and hardware
    if (
      this.currentFPS < this.config.performanceThreshold ||
      (typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 2)
    ) {
      this.currentLOD = "low";
      this.maxParticlesCurrent = Math.floor(this.config.maxParticles * 0.25);
    } else if (this.currentFPS < this.config.performanceThreshold * 1.5) {
      this.currentLOD = "medium";
      this.maxParticlesCurrent = Math.floor(this.config.maxParticles * 0.6);
    } else {
      this.currentLOD = "high";
      this.maxParticlesCurrent = this.config.maxParticles;
    }

    // Clean up excess particles if LOD decreased
    if (this.maxParticlesCurrent < this.activeCount) {
      let excess = this.activeCount - this.maxParticlesCurrent;
      for (let i = this.particles.length - 1; i >= 0 && excess > 0; i--) {
        const particle = this.particles[i];
        if (particle.active) {
          particle.active = false;
          this.activeCount--;
          excess--;
        }
      }
    }
  }
}
