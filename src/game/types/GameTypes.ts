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

export interface GameEngineConfig extends GameConfig {
  audio: AudioConfig;
  render: RenderConfig;
  canvas: HTMLCanvasElement;
  onScoreChange?: (score: number) => void;
}
