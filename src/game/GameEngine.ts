/**
 * Game Engine - Core game loop and entity management
 */

import { Player } from "./entities/Player";
import { Obstacle } from "./entities/Obstacle";
import { Collectible } from "./entities/Collectible";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { AudioSystem } from "./systems/AudioSystem";
import { InputHandler } from "./utils/InputHandler";
import { EntityPool } from "./utils/ObjectPool";
import type {
  GameEngineConfig,
  GameState,
  GameEvent,
  Vector2D,
  ParticleConfig,
  ObstacleConfig,
  CollectibleConfig,
} from "./types/GameTypes";

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private config: GameEngineConfig;
  private state: GameState;
  private inputHandler: InputHandler;
  private physicsSystem: PhysicsSystem;
  private renderSystem: RenderSystem;
  private audioSystem: AudioSystem;

  // Unified ground Y coordinate - aligns visual ground with physics
  private readonly GROUND_Y: number;

  // Game entities
  private player: Player | null = null;
  private obstacles: EntityPool<Obstacle>;
  private collectibles: EntityPool<Collectible>;
  private particles: ParticleConfig[] = [];

  // Game loop
  private animationId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private fixedTimeStep: number = 1000 / 60; // 60 FPS

  // Events
  private eventListeners: Map<string, ((event: GameEvent) => void)[]> =
    new Map();

  // High score
  private highScoreKey: string = "miniGameHighScore";
  private onScoreChangeCallback?: (score: number) => void;

  constructor(config: GameEngineConfig) {
    this.ctx = config.canvas.getContext("2d")!;
    this.config = config;
    this.onScoreChangeCallback = config.onScoreChange;

    // Initialize unified ground Y - 20px from bottom for visual ground alignment
    this.GROUND_Y = config.height - 20;

    // Initialize game state
    this.state = {
      isRunning: false,
      isPaused: false,
      score: 0,
      gameSpeed: config.gameSpeed,
      frameCount: 0,
    };

    // Initialize systems
    this.inputHandler = new InputHandler();
    this.physicsSystem = new PhysicsSystem(config.gravity);
    this.renderSystem = new RenderSystem(
      this.ctx,
      config.width,
      config.height,
      config.render,
    );
    this.audioSystem = new AudioSystem(config.audio);

    // Initialize object pools
    this.obstacles = new EntityPool<Obstacle>(
      () =>
        new Obstacle({
          position: { x: 0, y: 0 },
          size: { width: 16, height: 20 },
          type: "bug",
        }),
      10,
      50,
    );

    this.collectibles = new EntityPool<Collectible>(
      () =>
        new Collectible({
          position: { x: 0, y: 0 },
          size: { width: 16, height: 16 },
          points: 10,
          type: "commit",
        }),
      5,
      25,
    );

    // Setup input callbacks
    this.setupInputCallbacks();
  }

  /**
   * Initialize the game engine
   */
  public initialize(): void {
    if (typeof window === "undefined") {
      console.warn("GameEngine: Cannot initialize in SSR environment");
      return;
    }

    // Initialize input handler
    this.inputHandler.initialize();

    // Initialize audio system (will be fully activated after user gesture)
    this.audioSystem.initialize();

    // Create player - position so feet align with ground line
    this.player = new Player({
      position: { x: 50, y: this.GROUND_Y - 20 }, // 20px = player height
      size: { width: 20, height: 20 },
      jumpPower: this.config.jumpPower,
      groundY: this.GROUND_Y - 20, // Player's ground reference is their feet position
    });

    console.log("GameEngine: Initialized successfully");
  }

  /**
   * Start the game
   */
  public start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.score = 0;
    this.state.gameSpeed = this.config.gameSpeed;
    this.state.frameCount = 0;

    // Reset entities
    this.resetGame();

    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);

    // Resume audio context on first user interaction
    this.audioSystem.resume();

    this.emitEvent({ type: "gamestart", timestamp: Date.now() });
  }

  /**
   * Pause the game
   */
  public pause(): void {
    if (!this.state.isRunning) return;
    this.state.isPaused = !this.state.isPaused;
    this.emitEvent({ type: "pause", timestamp: Date.now() });
  }

  /**
   * Reset the game
   */
  public reset(): void {
    this.state.score = 0;
    this.state.gameSpeed = this.config.gameSpeed;
    this.state.frameCount = 0;
    this.resetGame();
    this.emitEvent({ type: "reset", timestamp: Date.now() });
  }

  /**
   * Restart the game - reset and start playing
   */
  public restart(): void {
    // Stop if currently running
    if (this.state.isRunning) {
      this.stop();
    }

    // Reset game state
    this.reset();

    // Start the game again
    this.start();
  }

  /**
   * Stop the game
   */
  public stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Update high score when game stops
    this.updateHighScore();

    this.emitEvent({ type: "gameover", timestamp: Date.now() });
  }

  /**
   * Destroy the game engine
   */
  public destroy(): void {
    this.stop();
    this.inputHandler.destroy();
    this.audioSystem.destroy();
    this.obstacles.clear();
    this.collectibles.clear();
    this.particles = [];
    this.eventListeners.clear();
  }

  /**
   * Main game loop
   */
  private gameLoop(currentTime: number): void {
    if (!this.state.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Fixed timestep with accumulator
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      if (!this.state.isPaused) {
        this.update(this.fixedTimeStep);
      }
      this.accumulator -= this.fixedTimeStep;
    }

    // Render with interpolation
    const alpha = this.accumulator / this.fixedTimeStep;
    this.render(alpha);

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * Update game logic
   */
  private update(deltaTime: number): void {
    if (!this.player) return;

    this.state.frameCount++;

    // Update player
    this.handlePlayerInput();
    this.player.update(deltaTime, this.state.gameSpeed);

    // Spawn entities
    this.spawnEntities();

    // Update obstacles
    this.obstacles.updateAll(deltaTime, this.state.gameSpeed);

    // Update collectibles
    this.collectibles.updateAll(deltaTime, this.state.gameSpeed);

    // Update particles
    this.updateParticles(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Clean up off-screen entities
    this.obstacles.cleanupOffScreen(this.config.width, this.config.height);
    this.collectibles.cleanupOffScreen(this.config.width, this.config.height);

    // Increase difficulty
    this.increaseDifficulty();
  }

  /**
   * Render the game
   */
  private render(_alpha: number): void {
    this.renderSystem.beginFrame();

    // Draw background
    this.renderSystem.drawBackground(this.state.frameCount);

    // Draw ground
    this.renderSystem.drawGround(this.GROUND_Y);

    // Render entities
    if (this.player) {
      this.renderSystem.renderEntity(this.player);
    }

    this.renderSystem.renderEntities(this.obstacles.getActive());
    this.renderSystem.renderEntities(this.collectibles.getActive());

    // Render particles
    this.renderSystem.drawParticles(this.particles);

    // Draw UI
    this.renderSystem.drawScore(this.state.score);
    this.renderSystem.drawFPS(1000 / this.fixedTimeStep);

    // Draw overlays
    if (this.state.isPaused) {
      this.renderSystem.drawPause();
    }

    if (!this.state.isRunning && this.player) {
      this.renderSystem.drawGameOver(this.state.score);
    }

    this.renderSystem.endFrame();
  }

  /**
   * Handle player input
   */
  private handlePlayerInput(): void {
    if (!this.player) return;

    const input = this.inputHandler.getInputState();

    // Horizontal movement
    if (input.left) {
      this.player.moveLeft();
    } else if (input.right) {
      this.player.moveRight();
    } else {
      this.player.stopHorizontalMovement();
    }

    // Jump
    if (input.space && this.player.canJump()) {
      this.player.jump();
      this.audioSystem.playJump();
      this.createJumpParticles();
    }

    // Pause
    if (input.pause) {
      this.pause();
    }
  }

  /**
   * Spawn new entities
   */
  private spawnEntities(): void {
    // Spawn obstacles
    if (Math.random() < this.config.spawnRate) {
      const obstacle = this.obstacles.acquire();
      const type = Math.random() > 0.5 ? "bug" : "error";
      const config: ObstacleConfig = {
        position: { x: this.config.width, y: this.GROUND_Y - 20 }, // 20px = obstacle height
        size: { width: 16, height: 20 },
        type,
      };

      obstacle.setSpawnPosition(config.position.x, config.position.y);
      (obstacle as any).obstacleType = type;
    }

    // Spawn collectibles
    if (Math.random() < this.config.spawnRate * 0.5) {
      const collectible = this.collectibles.acquire();
      const type = Math.random() > 0.5 ? "commit" : "star";
      const config: CollectibleConfig = {
        position: {
          x: this.config.width,
          y: this.config.height - 80 - Math.random() * 40,
        },
        size: { width: 16, height: 16 },
        points: type === "commit" ? 10 : 25,
        type,
      };

      collectible.setSpawnPosition(config.position.x, config.position.y);
      (collectible as any).collectibleType = type;
      (collectible as any).points = config.points;
    }
  }

  /**
   * Check collisions
   */
  private checkCollisions(): void {
    if (!this.player) return;

    // Check obstacle collisions
    for (const obstacle of this.obstacles.getActive()) {
      if (this.physicsSystem.checkCollision(this.player, obstacle)) {
        this.gameOver();
        return;
      }
    }

    // Check collectible collisions
    for (const collectible of this.collectibles.getActive()) {
      if (this.physicsSystem.checkCollision(this.player, collectible)) {
        this.collectItem(collectible);
      }
    }
  }

  /**
   * Handle item collection
   */
  private collectItem(collectible: Collectible): void {
    const points = (collectible as any).points || 10;

    // Play collect sound
    this.audioSystem.playCollect();

    // Create particle effect
    this.createCollectParticles(collectible.position);
    this.collectibles.release(collectible);

    // Emit collect event
    this.emitEvent({
      type: "collect",
      data: { points, position: collectible.position },
      timestamp: Date.now(),
    });

    // Update score atomically
    this.addScore(points);
  }

  /**
   * Game over
   */
  private gameOver(): void {
    // Play game over sound
    this.audioSystem.playGameOver();

    // Update high score
    this.updateHighScore();

    // Create game over effects
    this.createGameOverParticles();
    this.renderSystem.triggerFlash("#306230", 0.6);

    this.stop();
  }

  /**
   * Increase game difficulty
   */
  private increaseDifficulty(): void {
    if (this.state.score > 0 && this.state.score % 50 === 0) {
      this.state.gameSpeed = Math.min(this.state.gameSpeed + 0.5, 12);
    }
  }

  /**
   * Create particle effects
   */
  private createJumpParticles(): void {
    if (!this.player) return;

    for (let i = 0; i < 4; i++) {
      this.particles.push({
        position: {
          x: this.player.position.x + this.player.size.width / 2,
          y: this.player.position.y + this.player.size.height,
        },
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * -2,
        },
        life: 1,
        color: "#8bac0f",
        size: 2,
      });
    }
  }

  private createCollectParticles(position: Vector2D): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * 3,
          y: Math.sin(angle) * 3,
        },
        life: 1,
        color: "#9bbc0f",
        size: 3,
      });
    }
  }

  private createGameOverParticles(): void {
    if (!this.player) return;

    for (let i = 0; i < 12; i++) {
      this.particles.push({
        position: {
          x: this.player.position.x + this.player.size.width / 2,
          y: this.player.position.y + this.player.size.height / 2,
        },
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        },
        life: 1,
        color: "#306230",
        size: 4,
      });
    }
  }

  /**
   * Update particles
   */
  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.velocity.y += 0.2; // Gravity
      particle.life -= deltaTime / 1000;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Reset game state
   */
  private resetGame(): void {
    if (this.player) {
      this.player.reset();
    }

    this.obstacles.releaseAll();
    this.collectibles.releaseAll();
    this.particles = [];
    this.inputHandler.reset();
  }

  /**
   * Setup input callbacks
   */
  private setupInputCallbacks(): void {
    this.inputHandler.onCallback("jump", () => {
      // Jump sound is now played in handlePlayerInput
    });

    this.inputHandler.onCallback("pause", () => {
      // Pause sound could be added here if needed
    });
  }

  /**
   * Emit game event
   */
  private emitEvent(event: GameEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("GameEngine: Error in event listener:", error);
        }
      });
    }
  }

  /**
   * Update high score in localStorage
   */
  private updateHighScore(): void {
    if (typeof window === "undefined") return;

    try {
      const currentHighScore = this.getHighScore();
      if (this.state.score > currentHighScore) {
        localStorage.setItem(this.highScoreKey, this.state.score.toString());
      }
    } catch (error) {
      console.warn("GameEngine: Failed to update high score:", error);
    }
  }

  /**
   * Public API methods
   */

  public getScore(): number {
    return this.state.score;
  }

  public getHighScore(): number {
    if (typeof window === "undefined") return 0;

    try {
      const stored = localStorage.getItem(this.highScoreKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.warn("GameEngine: Failed to read high score:", error);
      return 0;
    }
  }

  public resetHighScore(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.highScoreKey);
    } catch (error) {
      console.warn("GameEngine: Failed to reset high score:", error);
    }
  }

  public setScoreChangeCallback(callback: (score: number) => void): void {
    this.onScoreChangeCallback = callback;
  }

  public getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  public isPlaying(): boolean {
    return this.state.isRunning && !this.state.isPaused;
  }

  public isPaused(): boolean {
    return this.state.isPaused;
  }

  public getGameState(): GameState {
    return { ...this.state };
  }

  public addEventListener(
    eventType: string,
    listener: (event: GameEvent) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(
    eventType: string,
    listener: (event: GameEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public setGameSpeed(speed: number): void {
    this.state.gameSpeed = Math.max(1, Math.min(speed, 20));
  }

  public setScore(score: number): void {
    this.state.score = Math.max(0, score);
    this.notifyScoreChange();
  }

  /**
   * Add points to current score (atomic operation)
   */
  public addScore(points: number): void {
    this.state.score = Math.max(0, this.state.score + points);
    this.notifyScoreChange();
  }

  /**
   * Notify about score changes (single synchronized method)
   */
  private notifyScoreChange(): void {
    // Call score change callback
    if (this.onScoreChangeCallback) {
      this.onScoreChangeCallback(this.state.score);
    }
    // Emit score change event
    this.emitEvent({
      type: "score",
      data: { score: this.state.score },
      timestamp: Date.now(),
    });
  }
}
