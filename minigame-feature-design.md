# MiniGame Feature Design: Coin Visibility & Progressive Difficulty

## Executive Summary

This document outlines the architectural design for two critical enhancements to the Code Runner mini-game: (A) Coin visibility improvements and (B) Progressive difficulty scaling. Both features are designed to enhance player engagement while maintaining the GameBoy/Tokyo Night aesthetic and performance constraints.

## A) Coin Visibility Improvements

### 1. Visual Design Specifications

#### 1.1 Core Visual Effects

- **Pulse Animation**: Scale 1.0 → 1.15 over 700ms ease-in-out, then reverse
- **Glow Effect**: 6px radius radial gradient with additive blending
- **Rotation**: Continuous 360° rotation over 4 seconds (linear)
- **Floating Motion**: Sinusoidal vertical movement with 8px amplitude, 2-second period
- **Outline**: 2px stroke with high contrast for accessibility

#### 1.2 Color Palette

```typescript
const coinColors = {
  // GameBoy palette (primary)
  commit: {
    primary: "#8bac0f", // Light green
    glow: "#9bbc0f", // Lightest green
    outline: "#306230", // Dark green
    particle: "#9bbc0f", // Lightest green
  },
  star: {
    primary: "#FFD166", // Tokyo accent yellow
    glow: "#FFE66D", // Lighter yellow
    outline: "#F77F49", // Tokyo orange
    particle: "#FFE66D", // Lighter yellow
  },
  // High contrast mode
  highContrast: {
    primary: "#FFFFFF", // White
    glow: "#FFFF00", // Yellow
    outline: "#000000", // Black
    particle: "#FFFF00", // Yellow
  },
};
```

#### 1.3 Animation Timing

```typescript
const animationConfig = {
  pulse: {
    period: 700, // ms
    amplitude: 0.15, // 15% scale increase
    easing: "ease-in-out",
  },
  rotation: {
    period: 4000, // ms for full rotation
    easing: "linear",
  },
  floating: {
    period: 2000, // ms
    amplitude: 8, // pixels
    easing: "ease-in-out",
  },
  glow: {
    radius: 6, // pixels
    alpha: 0.9, // additive blend alpha
    pulsePeriod: 1000, // ms
  },
};
```

### 2. Rendering Architecture

#### 2.1 Implementation Location

**Primary**: `Collectible.render()` method in `src/game/entities/Collectible.ts`
**Secondary**: `RenderSystem.drawCollectible()` for advanced effects and fallback

#### 2.2 Rendering Strategy

```typescript
// Performance-based rendering levels
enum RenderQuality {
  LOW = 0, // Basic pixel art only
  MEDIUM = 1, // Pulse + outline
  HIGH = 2, // Full effects + particles
  ULTRA = 3, // All effects + additive blending
}

// Auto-detect based on device capabilities
const detectRenderQuality = (): RenderQuality => {
  if (window.devicePixelRatio > 2) return RenderQuality.HIGH;
  if (navigator.hardwareConcurrency < 4) return RenderQuality.LOW;
  return RenderQuality.MEDIUM;
};
```

#### 2.3 Z-Order Strategy

- Background: Layer 0
- Ground: Layer 1
- Collectibles: Layer 2 (with glow effects rendered first)
- Player: Layer 3
- Particles: Layer 4 (front-most)
- UI Overlay: Layer 5

#### 2.4 Double Buffering Integration

- Glow effects rendered to back buffer first
- Main coin sprite rendered on top
- Particles rendered in separate pass to avoid overdraw

### 3. Particle System Design

#### 3.1 Particle Configuration

```typescript
const particleConfig = {
  spawn: {
    count: 12, // Max particles per event
    burst: true, // All spawn at once
    spread: Math.PI * 2, // Full circle
  },
  lifetime: {
    min: 800, // ms
    max: 1200, // ms
  },
  physics: {
    velocity: {
      min: 2, // pixels/second
      max: 5, // pixels/second
    },
    gravity: 0.1, // pixels/second²
    damping: 0.98, // velocity damping
  },
  visual: {
    size: {
      start: 3, // pixels
      end: 1, // pixels
    },
    alpha: {
      start: 1.0,
      end: 0.0,
    },
  },
};
```

#### 3.2 Particle Budget Management

- Global particle limit: 50 active particles
- Per-event limit: 12 particles
- Priority system: Collect > Jump > GameOver
- Automatic cleanup based on lifetime

### 4. Audio Integration

#### 4.1 Audio Triggers

```typescript
const audioTriggers = {
  collect: {
    frequency: 880, // A5 note
    duration: 150, // ms
    envelope: {
      attack: 10, // ms
      decay: 50, // ms
      sustain: 0.3, // amplitude
      release: 90, // ms
    },
  },
  nearby: {
    frequency: 440, // A4 note (subtle)
    duration: 50, // ms
    volume: 0.3, // 30% volume
  },
};
```

### 5. Accessibility Requirements

#### 5.1 Visual Accessibility

```typescript
const accessibilityConfig = {
  prefersReducedMotion: {
    disableAnimations: true,
    staticOutline: true,
    increasedContrast: true,
  },
  prefersContrast: {
    highContrastMode: true,
    outlineWidth: 3, // pixels
    glowDisabled: false, // Keep glow for visibility
  },
  screenReader: {
    ariaLiveRegion: true,
    announcements: {
      nearby: "Coin nearby",
      collected: "Collected {points} points",
      highValue: "High value coin nearby",
    },
  },
};
```

#### 5.2 ARIA Implementation

```html
<div role="application" aria-label="Code Runner mini-game" aria-live="polite">
  <canvas role="img" aria-label="Game canvas" tabindex="0"></canvas>
  <div
    id="game-announcements"
    aria-live="assertive"
    aria-atomic="true"
    class="sr-only"
  ></div>
</div>
```

### 6. Configuration System

#### 6.1 Collectible Visual Config

```typescript
interface CollectibleVisualConfig {
  enabled: boolean;
  quality: RenderQuality;
  animations: {
    pulse: boolean;
    rotation: boolean;
    floating: boolean;
    glow: boolean;
  };
  particles: {
    enabled: boolean;
    count: number;
    colors: string[];
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
  performance: {
    maxParticles: number;
    renderDistance: number;
    lodEnabled: boolean;
  };
}
```

#### 6.2 Default Configuration

```typescript
const defaultCollectibleConfig: CollectibleVisualConfig = {
  enabled: true,
  quality: RenderQuality.MEDIUM,
  animations: {
    pulse: true,
    rotation: true,
    floating: true,
    glow: true,
  },
  particles: {
    enabled: true,
    count: 12,
    colors: ["#9bbc0f", "#FFD166", "#FFE66D"],
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: true,
  },
  performance: {
    maxParticles: 50,
    renderDistance: 200,
    lodEnabled: true,
  },
};
```

## B) Progressive Difficulty Design

### 1. Mathematical Progression Model

#### 1.1 Core Difficulty Function

```typescript
interface DifficultyState {
  time: number; // seconds since start
  score: number; // current score
  level: number; // difficulty level (1-10)
}

// Exponential approach to maximum with score influence
const calculateDifficulty = (state: DifficultyState): DifficultyConfig => {
  const { time, score } = state;

  // Time-based progression (exponential approach)
  const timeFactor = 1 - Math.exp(-time / 60); // 60s time constant

  // Score-based progression (linear with diminishing returns)
  const scoreFactor = Math.min(score / 1000, 1.0); // Cap at 1000 points

  // Combined difficulty (0.0 to 1.0)
  const difficulty = Math.max(timeFactor, scoreFactor * 0.7);

  return {
    level: Math.floor(difficulty * 10) + 1,
    spawnRate: calculateSpawnRate(difficulty),
    gameSpeed: calculateGameSpeed(difficulty),
    obstacleConfig: calculateObstacleConfig(difficulty),
    collectibleConfig: calculateCollectibleConfig(difficulty),
  };
};
```

#### 1.2 Spawn Rate Calculation

```typescript
const calculateSpawnRate = (difficulty: number): number => {
  const baseSpawnRate = 0.02; // 2% base chance per frame
  const maxSpawnRate = 0.08; // 8% max chance per frame

  // Smooth exponential curve
  const spawnRate =
    baseSpawnRate + (maxSpawnRate - baseSpawnRate) * Math.pow(difficulty, 1.5);

  return Math.min(spawnRate, maxSpawnRate);
};
```

#### 1.3 Game Speed Calculation

```typescript
const calculateGameSpeed = (difficulty: number): number => {
  const baseSpeed = 3.0; // Base game speed
  const maxSpeed = 12.0; // Maximum game speed

  // Logarithmic progression for smoother feel
  const speed =
    baseSpeed +
    ((maxSpeed - baseSpeed) * Math.log(1 + difficulty * 9)) / Math.log(10);

  return Math.min(speed, maxSpeed);
};
```

#### 1.4 Obstacle Configuration

```typescript
const calculateObstacleConfig = (difficulty: number) => {
  // Size probability (smaller obstacles at higher difficulty)
  const smallObstacleChance = 0.2 + difficulty * 0.6; // 20% to 80%

  // Type probability (more 'error' type at higher difficulty)
  const errorTypeChance = 0.3 + difficulty * 0.5; // 30% to 80%

  // Height variation (taller obstacles at higher difficulty)
  const heightMultiplier = 1.0 + difficulty * 0.5; // 1.0x to 1.5x

  return {
    smallChance: smallObstacleChance,
    errorTypeChance: errorTypeChance,
    heightMultiplier: heightMultiplier,
    speedVariation: difficulty * 0.3, // 0% to 30% speed variation
  };
};
```

#### 1.5 Collectible Configuration

```typescript
const calculateCollectibleConfig = (difficulty: number) => {
  // Spawn rate decreases with difficulty (inverse relationship)
  const spawnMultiplier = Math.max(0.3, 1.0 - difficulty * 0.5); // 100% to 30%

  // Higher value collectibles more common at higher difficulty
  const highValueChance = 0.1 + difficulty * 0.4; // 10% to 50%

  // Vertical spawn range increases with difficulty
  const heightRange = 40 + difficulty * 60; // 40px to 100px range

  return {
    spawnMultiplier,
    highValueChance,
    heightRange,
    pointMultiplier: 1.0 + difficulty * 0.5, // 1.0x to 1.5x points
  };
};
```

### 2. Integration Architecture

#### 2.1 GameEngine Integration Points

```typescript
class GameEngine {
  private difficultyState: DifficultyState;
  private difficultyConfig: DifficultyConfig;
  private lastDifficultyUpdate: number = 0;

  // Update difficulty every second or on score milestones
  private updateDifficulty(): void {
    const now = Date.now();
    if (now - this.lastDifficultyUpdate < 1000) return; // Max once per second

    this.difficultyState = {
      time: (now - this.gameStartTime) / 1000,
      score: this.state.score,
      level: this.difficultyConfig.level,
    };

    const newConfig = calculateDifficulty(this.difficultyState);

    // Emit change event if level increased
    if (newConfig.level > this.difficultyConfig.level) {
      this.emitEvent({
        type: "difficulty:change",
        data: {
          from: this.difficultyConfig.level,
          to: newConfig.level,
          config: newConfig,
        },
        timestamp: now,
      });
    }

    this.difficultyConfig = newConfig;
    this.lastDifficultyUpdate = now;
  }
}
```

#### 2.2 Spawn System Integration

```typescript
private spawnEntities(): void {
  const difficulty = this.difficultyConfig;

  // Use difficulty-adjusted spawn rates
  if (Math.random() < difficulty.spawnRate) {
    this.spawnObstacle(difficulty.obstacleConfig);
  }

  if (Math.random() < difficulty.spawnRate * 0.5 * difficulty.collectibleConfig.spawnMultiplier) {
    this.spawnCollectible(difficulty.collectibleConfig);
  }
}
```

### 3. Test Mode & Configuration

#### 3.1 Test Mode Override

```typescript
interface TestModeConfig {
  enabled: boolean;
  fixedDifficulty?: number; // 0.0 to 1.0
  deterministicSpawning?: boolean; // Fixed seed for RNG
  logDifficultyChanges?: boolean; // Console logging
}

// Global test mode detection
const isTestMode = (): boolean => {
  return (
    typeof window !== "undefined" &&
    (window.__TEST_MODE === true ||
      window.location.search.includes("test=true"))
  );
};
```

#### 3.2 Configuration Override System

```typescript
interface DifficultyOverrideConfig {
  enabled: boolean;
  fixedLevel?: number; // Pin to specific level (1-10)
  customCurve?: (difficulty: number) => DifficultyConfig;
  disableProgression?: boolean; // Stay at initial difficulty
}

const applyDifficultyOverride = (
  baseConfig: DifficultyConfig,
  override: DifficultyOverrideConfig,
): DifficultyConfig => {
  if (!override.enabled) return baseConfig;

  if (override.fixedLevel) {
    return calculateDifficulty({
      time: (override.fixedLevel - 1) * 6, // Approximate time for level
      score: (override.fixedLevel - 1) * 100,
      level: override.fixedLevel,
    });
  }

  if (override.customCurve) {
    const difficulty = (baseConfig.level - 1) / 9; // Normalize to 0-1
    return override.customCurve(difficulty);
  }

  return baseConfig;
};
```

### 4. Telemetry & Analytics

#### 4.1 Event System

```typescript
interface DifficultyEvent {
  type: "difficulty:level" | "difficulty:change" | "difficulty:cap";
  data: {
    level: number;
    time: number;
    score: number;
    config: DifficultyConfig;
  };
  timestamp: number;
}

// Emit events for analytics
private emitDifficultyEvent(type: string, data: any): void {
  this.emitEvent({
    type,
    data: {
      ...data,
      sessionTime: (Date.now() - this.gameStartTime) / 1000,
      score: this.state.score
    },
    timestamp: Date.now()
  });
}
```

#### 4.2 Performance Monitoring

```typescript
interface DifficultyMetrics {
  averageSessionTime: number;
  averageScoreAtLevel: Map<number, number>;
  dropoutRate: Map<number, number>; // Players quitting at each level
  difficultyProgression: Array<{ time: number; level: number }>;
}

const collectDifficultyMetrics = (
  events: DifficultyEvent[],
): DifficultyMetrics => {
  // Analytics implementation
  // This would be sent to analytics service
};
```

## Implementation Plan

### File-Level Changes

#### Core Files to Modify:

1. **`src/game/entities/Collectible.ts`**
   - Add visual animation state management
   - Implement enhanced render() method
   - Add particle effect triggers
   - Add accessibility support

2. **`src/game/GameEngine.ts`**
   - Add difficulty system integration
   - Implement progressive spawning logic
   - Add telemetry event emission
   - Add test mode support

3. **`src/game/systems/RenderSystem.ts`**
   - Add glow effect rendering methods
   - Implement particle system enhancements
   - Add performance-based LOD system
   - Add accessibility rendering modes

4. **`src/game/types/GameTypes.ts`**
   - Add new interfaces for visual config
   - Add difficulty system types
   - Extend existing interfaces

#### New Files to Create:

1. **`src/game/systems/ParticleSystem.ts`**
   - Dedicated particle management
   - Performance optimization
   - Effect presets

2. **`src/game/systems/DifficultySystem.ts`**
   - Progressive difficulty calculations
   - Configuration management
   - Test mode overrides

3. **`src/game/config/CollectibleConfig.ts`**
   - Default visual configurations
   - Animation presets
   - Accessibility settings

4. **`src/game/config/DifficultyConfig.ts`**
   - Difficulty curve definitions
   - Progression parameters
   - Test configurations

### Acceptance Criteria

#### Coin Visibility:

- [ ] Pulse animation visible with correct timing (700ms period)
- [ ] Glow effect renders with 6px radius and additive blending
- [ ] Particle system spawns exactly 12 particles on collection
- [ ] High contrast mode activates when `prefers-contrast: high`
- [ ] Reduced motion mode disables animations when `prefers-reduced-motion`
- [ ] Screen reader announcements work correctly
- [ ] Performance maintains 60fps on medium-tier devices
- [ ] LOD system reduces effects on low-end devices

#### Progressive Difficulty:

- [ ] Difficulty increases smoothly from level 1 to 10
- [ ] Spawn rate follows exponential curve (2% to 8%)
- [ ] Game speed follows logarithmic progression (3.0 to 12.0)
- [ ] Obstacle configuration changes based on difficulty
- [ ] Collectible spawn rate decreases with difficulty
- [ ] Test mode override works with `window.__TEST_MODE`
- [ ] Difficulty change events emit correctly
- [ ] Configuration override system functions properly

#### Integration:

- [ ] Both features work together without conflicts
- [ ] Existing game functionality remains unchanged
- [ ] All existing tests continue to pass
- [ ] New tests cover all new functionality
- [ ] Performance impact is minimal (<5% overhead)
- [ ] Memory usage remains within acceptable limits

### Test Cases

#### Unit Tests:

1. **Collectible Animation Tests**
   - Pulse animation timing verification
   - Glow effect rendering validation
   - Particle system behavior
   - Accessibility mode switching

2. **Difficulty System Tests**
   - Mathematical function verification
   - Level progression validation
   - Configuration override testing
   - Test mode functionality

3. **Integration Tests**
   - GameEngine with both systems
   - Performance under load
   - Memory leak detection
   - Cross-browser compatibility

#### E2E Tests:

1. **Visual Regression Tests**
   - Screenshot comparison for each animation state
   - High contrast mode verification
   - Reduced motion mode testing

2. **Gameplay Tests**
   - Full gameplay session with difficulty progression
   - Coin collection with visual effects
   - Performance monitoring during extended play

### Effort Estimation

#### Development Effort: 24 Story Points

- **Coin Visibility**: 13 points
  - Animation system: 5 points
  - Particle effects: 4 points
  - Accessibility: 3 points
  - Performance optimization: 1 point

- **Progressive Difficulty**: 11 points
  - Mathematical modeling: 4 points
  - Integration system: 3 points
  - Test mode: 2 points
  - Telemetry: 2 points

#### QA Effort: 12 Story Points

- **Functional Testing**: 5 points
- **Performance Testing**: 3 points
- **Accessibility Testing**: 2 points
- **Cross-browser Testing**: 2 points

#### Total Effort: 36 Story Points (~3-4 weeks)

### Risk Assessment & Mitigation

#### High Risk:

1. **Performance Impact**: Complex animations could affect frame rate
   - **Mitigation**: LOD system with performance monitoring
2. **Mobile Compatibility**: Touch interactions with new visual effects
   - **Mitigation**: Extensive mobile testing and performance profiling

#### Medium Risk:

1. **Accessibility Compliance**: Screen reader integration complexity
   - **Mitigation**: Early accessibility testing and user feedback

2. **Browser Compatibility**: Additive blending support varies
   - **Mitigation**: Feature detection with graceful fallbacks

#### Low Risk:

1. **Test Coverage**: New functionality requires comprehensive tests
   - **Mitigation**: Test-driven development approach

## Conclusion

This design provides a comprehensive solution for enhancing the Code Runner mini-game with improved coin visibility and progressive difficulty. The architecture prioritizes performance, accessibility, and maintainability while preserving the existing GameBoy/Tokyo Night aesthetic.

The modular design allows for incremental implementation and easy configuration adjustments. The mathematical progression model ensures smooth difficulty curves that keep players engaged without creating frustration spikes.

The extensive test coverage and performance monitoring ensure the features will work reliably across all target devices and browsers while maintaining the game's core performance requirements.
