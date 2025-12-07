/**
 * Difficulty System - Manages game difficulty progression over time and score
 */

import type { DifficultyConfig } from "../types/GameTypes";

export class DifficultySystem {
  private config: DifficultyConfig;
  private difficultyState: number = 0;
  private override: number | null = null;

  constructor(config: DifficultyConfig) {
    this.config = config;
  }

  /**
   * Compute difficulty based on time and score
   * Returns difficulty in range [0, 1]
   */
  public compute(currentTimeSeconds: number, score: number): number {
    if (this.override !== null) {
      return this.override;
    }

    // Calculate time-based difficulty
    const D_time = this.clamp(
      currentTimeSeconds / this.config.maxDifficultyTime,
      0,
      1,
    );

    // Calculate score-based difficulty
    const D_score = this.clamp(score / this.config.maxDifficultyScore, 0, 1);

    // Combine using configured weights
    const combined =
      D_time * this.config.timeScale + D_score * this.config.scoreScale;

    // Apply easing function for smooth progression
    const output = this.easeInOutQuad(this.clamp(combined, 0, 1));

    // Apply smoothing to avoid jarring difficulty changes (less laggy)
    this.difficultyState = this.lerp(this.difficultyState, output, 0.1);

    return this.difficultyState;
  }

  /**
   * Set difficulty override (for testing)
   */
  public setOverride(override: number | null): void {
    this.override = override;
    if (override !== null) {
      this.difficultyState = this.clamp(override, 0, 1);
    }
  }

  /**
   * Get current difficulty state
   */
  public getDifficultyState(): number {
    return this.difficultyState;
  }

  /**
   * Get game speed multiplier based on difficulty
   */
  public getGameSpeedMultiplier(): number {
    const { min, max } = this.config.gameSpeedMultiplier;
    return this.lerp(min, max, this.difficultyState);
  }

  /**
   * Get spawn rate multiplier based on difficulty
   */
  public getSpawnRateMultiplier(): number {
    const { min, max } = this.config.spawnRateMultiplier;
    return this.lerp(min, max, this.difficultyState);
  }

  /**
   * Clean up system
   */
  public destroy(): void {
    this.override = null;
    this.difficultyState = 0;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation between a and b
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Ease-in-out quad function for smooth difficulty progression
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
