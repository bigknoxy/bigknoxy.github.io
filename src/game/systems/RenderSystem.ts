/**
 * Render System - Handles all rendering operations
 */

import type {
  Vector2D,
  RenderConfig,
  CollectibleVisualConfig,
} from "../types/GameTypes";
import { Entity } from "../entities/Entity";
import { Collectible } from "../entities/Collectible";

export class RenderSystem {
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private width: number;
  private height: number;
  private backBuffer: CanvasRenderingContext2D | null = null;
  private backBufferCanvas: HTMLCanvasElement | null = null;
  private flashAlpha: number = 0;
  private flashColor: string = "#ff0000";

  // Glow cache for collectibles
  private glowCache: Map<string, OffscreenCanvas> = new Map();
  private readonly maxGlowCacheSize = 20;

  constructor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: RenderConfig,
  ) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.config = config;

    // Setup double buffering if enabled
    if (config.doubleBuffering) {
      this.setupDoubleBuffering();
    }

    // Configure rendering context
    this.setupContext();
  }

  /**
   * Setup double buffering for smoother rendering
   */
  private setupDoubleBuffering(): void {
    if (typeof window === "undefined" || typeof document === "undefined")
      return; // SSR guard

    this.backBufferCanvas = document.createElement("canvas");
    this.backBufferCanvas.width = this.width;
    this.backBufferCanvas.height = this.height;
    this.backBuffer = this.backBufferCanvas.getContext("2d");

    if (this.backBuffer) {
      this.setupContext(this.backBuffer);
    }
  }

  /**
   * Setup rendering context with pixelated scaling
   */
  private setupContext(context?: CanvasRenderingContext2D): void {
    const ctx = context || this.ctx;

    // Disable image smoothing for pixelated rendering
    ctx.imageSmoothingEnabled = false;
    (ctx as any).imageRendering = "pixelated";
    (ctx as any).imageRendering = "-moz-crisp-edges";
    (ctx as any).imageRendering = "crisp-edges";
  }

  /**
   * Begin rendering frame
   */
  public beginFrame(): void {
    const ctx = this.backBuffer || this.ctx;

    // Clear screen with GameBoy lightest color
    ctx.fillStyle = "#9bbc0f";
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * End rendering frame and swap buffers if needed
   */
  public endFrame(): void {
    // Apply flash effect if active
    if (this.flashAlpha > 0) {
      const ctx = this.backBuffer || this.ctx;
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();

      // Decay flash
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.05);
    }

    if (this.backBuffer && this.backBufferCanvas) {
      // Copy back buffer to main canvas
      this.ctx.drawImage(this.backBufferCanvas, 0, 0);
    }
  }

  /**
   * Render an entity
   */
  public renderEntity(entity: Entity): void {
    if (!entity.active) return;

    const ctx = this.backBuffer || this.ctx;
    entity.render(ctx);

    // Draw hitbox if enabled
    if (this.config.showHitboxes) {
      this.drawHitbox(entity);
    }
  }

  /**
   * Render multiple entities
   */
  public renderEntities(entities: Entity[]): void {
    for (const entity of entities) {
      this.renderEntity(entity);
    }
  }

  /**
   * Draw entity hitbox for debugging
   */
  private drawHitbox(entity: Entity): void {
    const ctx = this.backBuffer || this.ctx;
    const box = entity.getBoundingBox();

    ctx.strokeStyle = "#f7768e"; // Tokyo highlight color
    ctx.lineWidth = 1;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw center point
    ctx.fillStyle = "#f7768e";
    const center = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
    ctx.fillRect(center.x - 1, center.y - 1, 2, 2);
  }

  /**
   * Draw ground
   */
  public drawGround(groundY: number): void {
    const ctx = this.backBuffer || this.ctx;

    // Ground in GameBoy dark color
    ctx.fillStyle = "#306230";
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // Ground texture lines
    ctx.strokeStyle = "#0f380f"; // Darkest green
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 8, groundY + 8);
      ctx.stroke();
    }
  }

  /**
   * Draw UI text
   */
  public drawText(
    text: string,
    x: number,
    y: number,
    options?: {
      color?: string;
      font?: string;
      size?: number;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    },
  ): void {
    const ctx = this.backBuffer || this.ctx;

    ctx.fillStyle = options?.color || "#0f380f";
    ctx.font =
      options?.font || `${options?.size || 12}px "Press Start 2P", monospace`;
    ctx.textAlign = options?.align || "left";
    ctx.textBaseline = options?.baseline || "top";

    ctx.fillText(text, x, y);
  }

  /**
   * Draw score display
   */
  public drawScore(score: number, x: number = 10, y: number = 25): void {
    this.drawText(`SCORE: ${score.toString().padStart(4, "0")}`, x, y, {
      color: "#0f380f",
      size: 16,
    });
  }

  /**
   * Draw FPS counter
   */
  public drawFPS(fps: number): void {
    if (!this.config.showFPS) return;

    this.drawText(`FPS: ${Math.round(fps)}`, this.width - 80, 10, {
      color: "#306230",
      size: 10,
      align: "right",
    });
  }

  /**
   * Draw game over overlay
   */
  public drawGameOver(score: number): void {
    const ctx = this.backBuffer || this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(15, 56, 15, 0.8)";
    ctx.fillRect(0, 0, this.width, this.height);

    // Calculate responsive font sizes based on canvas size
    const titleSize = Math.max(12, Math.min(24, this.width / 12));
    const scoreSize = Math.max(8, Math.min(16, this.width / 20));
    const instructionSize = Math.max(6, Math.min(12, this.width / 24));

    // Game Over text - properly centered
    this.drawText("GAME OVER", this.width / 2, this.height / 2 - 20, {
      color: "#9bbc0f",
      size: titleSize,
      align: "center",
    });

    // Final score - properly centered
    this.drawText(
      `FINAL: ${score.toString().padStart(4, "0")}`,
      this.width / 2,
      this.height / 2 + 10,
      {
        color: "#9bbc0f",
        size: scoreSize,
        align: "center",
      },
    );

    // Restart instruction - properly centered
    this.drawText("CLICK TO RESTART", this.width / 2, this.height / 2 + 40, {
      color: "#9bbc0f",
      size: instructionSize,
      align: "center",
    });
  }

  /**
   * Draw pause overlay
   */
  public drawPause(): void {
    const ctx = this.backBuffer || this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(15, 56, 15, 0.6)";
    ctx.fillRect(0, 0, this.width, this.height);

    // Pause text
    this.drawText("PAUSED", this.width / 2 - 40, this.height / 2, {
      color: "#9bbc0f",
      size: 16,
      align: "center",
    });
  }

  /**
   * Draw particle effects
   */
  public drawParticles(
    particles: Array<{
      position: Vector2D;
      velocity: Vector2D;
      life: number;
      color: string;
      size: number;
    }>,
  ): void {
    const ctx = this.backBuffer || this.ctx;

    for (const particle of particles) {
      if (particle.life <= 0) continue;

      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        Math.round(particle.position.x),
        Math.round(particle.position.y),
        particle.size,
        particle.size,
      );
    }

    ctx.globalAlpha = 1; // Reset alpha
  }

  /**
   * Draw background elements
   */
  public drawBackground(frameCount: number): void {
    const ctx = this.backBuffer || this.ctx;

    // Simple parallax background
    ctx.fillStyle = "#8bac0f";
    for (let i = 0; i < 5; i++) {
      const x = ((frameCount * 0.5 + i * 100) % (this.width + 20)) - 20;
      const y = 20 + i * 15;

      // Draw simple cloud shapes
      ctx.fillRect(x, y, 20, 8);
      ctx.fillRect(x - 5, y + 3, 8, 5);
      ctx.fillRect(x + 17, y + 3, 8, 5);
    }
  }

  /**
   * Resize render system
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    if (this.backBufferCanvas) {
      this.backBufferCanvas.width = width;
      this.backBufferCanvas.height = height;
    }
  }

  /**
   * Get render context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Get back buffer context (if available)
   */
  public getBackBuffer(): CanvasRenderingContext2D | null {
    return this.backBuffer;
  }

  /**
   * Trigger a flash effect
   */
  public triggerFlash(color: string = "#ff0000", alpha: number = 0.8): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  /**
   * Clear entire screen
   */
  public clear(): void {
    const ctx = this.backBuffer || this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Set pixel for pixel-perfect rendering
   */
  public setPixel(x: number, y: number, color: string): void {
    const ctx = this.backBuffer || this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  /**
   * Draw line for debugging
   */
  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = "#f7768e",
  ): void {
    const ctx = this.backBuffer || this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  /**
   * Draw collectible with enhanced visuals
   */
  public drawCollectible(
    ctx: CanvasRenderingContext2D,
    collectible: Collectible,
    _deltaMs: number,
    visualsConfig: CollectibleVisualConfig,
  ): void {
    const now = performance.now();
    const spawnTime = (collectible as any).spawnTime || now;
    const age = now - spawnTime;

    // Calculate animations
    let pulseScale = 1.0;
    let bobOffset = 0;

    // Respect user preferences
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      // Pulse animation (sine wave, 1.0 -> 1.15, 700ms period)
      if (visualsConfig.pulseEnabled) {
        const pulsePhase = ((age % 700) / 700) * Math.PI * 2;
        pulseScale = 1.0 + Math.sin(pulsePhase) * 0.075; // 1.0 -> 1.075 -> 1.0
      }

      // Bob animation (±4px over 2000ms)
      if (visualsConfig.bobEnabled) {
        const bobPhase = ((age % 2000) / 2000) * Math.PI * 2;
        bobOffset = Math.sin(bobPhase) * 4;
      }
    }

    // Apply LOD settings
    const lodLevel = this.getLODLevel();
    const lodConfig = visualsConfig.lodLevels[lodLevel];

    // Draw glow if enabled and LOD allows
    if (visualsConfig.glowEnabled && lodConfig.glowEnabled) {
      this.drawCollectibleGlow(ctx, collectible, pulseScale);
    }

    // Apply transformations
    ctx.save();
    ctx.translate(
      collectible.position.x + collectible.size.width / 2,
      collectible.position.y + collectible.size.height / 2 + bobOffset,
    );
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(
      -(collectible.position.x + collectible.size.width / 2),
      -(collectible.position.y + collectible.size.height / 2 + bobOffset),
    );

    // Draw the collectible
    collectible.render(ctx);

    ctx.restore();
  }

  /**
   * Draw glow effect for collectible
   */
  private drawCollectibleGlow(
    ctx: CanvasRenderingContext2D,
    collectible: Collectible,
    scale: number,
  ): void {
    const type = ((collectible as any).collectibleType as string) || "commit";
    const size = Math.round(collectible.size.width * scale);
    const cacheKey = `${type}_${size}`;

    // Check cache first
    let glowCanvas = this.glowCache.get(cacheKey);

    if (!glowCanvas) {
      // Create new glow canvas
      glowCanvas = new OffscreenCanvas(size + 8, size + 8);
      const glowCtx = glowCanvas.getContext("2d")!;

      // Draw glow
      const gradient = glowCtx.createRadialGradient(
        size / 2 + 4,
        size / 2 + 4,
        0,
        size / 2 + 4,
        size / 2 + 4,
        size / 2 + 4,
      );

      if (type === "commit") {
        gradient.addColorStop(0, "rgba(155, 188, 15, 0.3)");
        gradient.addColorStop(1, "rgba(155, 188, 15, 0)");
      } else {
        gradient.addColorStop(0, "rgba(139, 172, 15, 0.3)");
        gradient.addColorStop(1, "rgba(139, 172, 15, 0)");
      }

      glowCtx.fillStyle = gradient;
      glowCtx.fillRect(0, 0, size + 8, size + 8);

      // Manage cache size
      if (this.glowCache.size >= this.maxGlowCacheSize) {
        const firstKey = this.glowCache.keys().next().value;
        if (firstKey) {
          this.glowCache.delete(firstKey);
        }
      }

      this.glowCache.set(cacheKey, glowCanvas);
    }

    // Draw the cached glow
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(
      glowCanvas,
      collectible.position.x - 4,
      collectible.position.y - 4,
    );
    ctx.restore();
  }

  /**
   * Get current LOD level based on performance
   */
  private getLODLevel(): "low" | "medium" | "high" {
    // Simple LOD detection - could be enhanced with actual FPS monitoring
    if (
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency <= 2
    ) {
      return "low";
    }
    return "high";
  }

  /**
   * Clear glow cache (call when destroying render system)
   */
  public clearGlowCache(): void {
    this.glowCache.clear();
  }
}
