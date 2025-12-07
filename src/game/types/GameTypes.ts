/**
 * Game Types - Core interfaces and types for the Code Runner game
 */

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  gameSpeed: number;
  frameCount: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameConfig {
  width: number;
  height: number;
  targetFPS: number;
  gravity: number;
  jumpPower: number;
  gameSpeed: number;
  spawnRate: number;
}

export interface EntityConfig {
  position: Vector2D;
  size: Size2D;
  velocity?: Vector2D;
  active?: boolean;
}

export interface PlayerConfig extends EntityConfig {
  jumpPower: number;
  groundY: number;
}

export interface ObstacleConfig extends EntityConfig {
  type: ObstacleType;
}

export interface CollectibleConfig extends EntityConfig {
  points: number;
  type: CollectibleType;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  space: boolean;
  pause: boolean;
}

export interface ParticleConfig {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  color: string;
  size: number;
}

export type EntityType = "player" | "obstacle" | "collectible" | "particle";
export type ObstacleType = "bug" | "error";
export type CollectibleType = "commit" | "star";

export interface GameEvent {
  type:
    | "collision"
    | "collect"
    | "gameover"
    | "score"
    | "spawn"
    | "gamestart"
    | "pause"
    | "reset";
  data?: any;
  timestamp: number;
}

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  frequencies: {
    jump: number;
    collect: number;
    gameOver: number;
    background: number[];
  };
}

export interface RenderConfig {
  pixelated: boolean;
  showFPS: boolean;
  showHitboxes: boolean;
  doubleBuffering: boolean;
}

export interface CollectibleVisualConfig {
  glowEnabled: boolean;
  particleEnabled: boolean;
  pulseEnabled: boolean;
  bobEnabled: boolean;
  lodLevels: {
    low: { maxParticles: number; glowEnabled: boolean };
    medium: { maxParticles: number; glowEnabled: boolean };
    high: { maxParticles: number; glowEnabled: boolean };
  };
}

export interface DifficultyConfig {
  maxDifficultyTime: number; // seconds to reach max difficulty
  maxDifficultyScore: number; // score to reach max difficulty
  timeScale: number; // weight of time-based difficulty (0-1)
  scoreScale: number; // weight of score-based difficulty (0-1)
  gameSpeedMultiplier: { min: number; max: number };
  spawnRateMultiplier: { min: number; max: number };
}

export interface ParticleSystemConfig {
  maxParticles: number;
  performanceThreshold: number; // FPS below which to reduce particles
  gravity: number;
  particleLife: number; // seconds
  emitCount: number;
  colors: {
    collect: string[];
    jump: string[];
    gameover: string[];
  };
}

export interface GameEngineConfig extends GameConfig {
  audio: AudioConfig;
  render: RenderConfig;
  canvas: HTMLCanvasElement;
  onScoreChange?: (score: number) => void;
  difficultyConfig?: DifficultyConfig;
  particleSystemConfig?: ParticleSystemConfig;
  collectibleVisualConfig?: CollectibleVisualConfig;
}

// Default configurations
export const DEFAULT_COLLECTIBLE_VISUALS: CollectibleVisualConfig = {
  glowEnabled: true,
  particleEnabled: true,
  pulseEnabled: true,
  bobEnabled: true,
  lodLevels: {
    low: { maxParticles: 4, glowEnabled: false },
    medium: { maxParticles: 8, glowEnabled: true },
    high: { maxParticles: 16, glowEnabled: true },
  },
};

export const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  maxDifficultyTime: 120, // 2 minutes to max difficulty
  maxDifficultyScore: 500, // 500 points to max difficulty
  timeScale: 0.6, // Time has 60% weight
  scoreScale: 0.4, // Score has 40% weight
  gameSpeedMultiplier: { min: 1.0, max: 3.0 },
  spawnRateMultiplier: { min: 0.5, max: 2.0 },
};

export const DEFAULT_PARTICLE_SYSTEM_CONFIG: ParticleSystemConfig = {
  maxParticles: 64,
  performanceThreshold: 30, // Reduce particles below 30 FPS
  gravity: 0.2,
  particleLife: 1.0, // 1 second
  emitCount: 8,
  colors: {
    collect: ["#9bbc0f", "#8bac0f", "#306230"],
    jump: ["#8bac0f", "#306230"],
    gameover: ["#306230", "#0f380f"],
  },
};
