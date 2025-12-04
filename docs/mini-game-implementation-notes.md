# Mini Game Implementation Notes

## Overview

The "Code Runner" mini-game is a fully functional endless runner game built with TypeScript and Canvas API. It features a GameBoy-style aesthetic with Tokyo Night theme integration.

## Architecture

### Core Components

- **GameEngine**: Main game loop and entity management
- **Entities**: Player, Obstacle, Collectible classes
- **Systems**: PhysicsSystem, RenderSystem for separation of concerns
- **Utils**: InputHandler, ObjectPool for performance optimization

### Key Features

- **Deterministic game loop** using fixed timestep (60 FPS target)
- **Object pooling** for memory efficiency
- **AABB collision detection** for accurate physics
- **Double-buffered rendering** for smooth graphics
- **SSR-safe** with proper window/document guards

## Running the Game

### Development

```bash
# Start development server
bun run dev

# Navigate to the page with the game
# The game will be available at http://localhost:4321
```

### Production Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Game Controls

- **Arrow Keys / A,D**: Move left/right
- **Space / J**: Jump
- **P / Escape**: Pause/Resume
- **Touch**: Mobile-friendly touch controls
- **Mouse Click**: Alternative jump control

## Game Mechanics

### Player Movement

- Gravity-based physics with jump mechanics
- Horizontal movement with friction
- Ground collision detection

### Obstacles

- Two types: Bugs and Error blocks
- Spawn at configurable rates
- Move from right to left
- Collision ends the game

### Collectibles

- Two types: Commits (10 points) and Stars (25 points)
- Floating animation effects
- Particle effects on collection

### Difficulty Progression

- Game speed increases every 50 points
- Maximum speed capped for playability

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/game.core.spec.ts

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **GameEngine Core**: State management, lifecycle, events
- **Physics System**: Collision detection, movement calculations
- **Entity System**: Spawning, updates, rendering
- **Input Handling**: Keyboard, touch, mouse input
- **Performance**: Object pooling, memory management

## Performance Optimizations

### Object Pooling

- Reuses entity objects to reduce garbage collection
- Configurable pool sizes for different entity types
- Automatic cleanup of off-screen entities

### Rendering

- Double buffering for smooth animation
- Pixelated scaling for authentic GameBoy look
- Efficient canvas operations

### Physics

- Fixed timestep for deterministic behavior
- Spatial partitioning for collision detection
- Optimized bounding box calculations

## Configuration

### Game Config

```typescript
const config = {
  width: 240, // Game width (GameBoy resolution)
  height: 216, // Game height (scaled GameBoy)
  targetFPS: 60, // Target frame rate
  gravity: 0.8, // Gravity strength
  jumpPower: -12, // Jump velocity
  gameSpeed: 4, // Initial game speed
  spawnRate: 0.02, // Obstacle spawn probability
};
```

### Audio Config

```typescript
const audio = {
  enabled: true, // Enable sound effects
  volume: 0.3, // Master volume
  frequencies: {
    jump: 400, // Jump sound frequency
    collect: 800, // Collection sound frequency
    gameOver: 200, // Game over sound frequency
    background: [261, 293, 329, 261, 329, 392], // Background music notes
  },
};
```

### Audio System Implementation

The game now includes a complete Web Audio API implementation:

- **AudioSystem**: Manages Web Audio API context and sound synthesis
- **8-bit Sound Effects**: Synthesized using oscillators and gain nodes
- **User Gesture Compliance**: Audio context resumes only after user interaction
- **Graceful Fallback**: No-ops when Web Audio API is unavailable
- **Volume Control**: Master volume with mute/unmute functionality

#### Audio Features

- **Jump Sound**: Rising pitch square wave (400Hz → 600Hz)
- **Collect Sound**: C-E-G arpeggio (523Hz, 659Hz, 784Hz)
- **Game Over Sound**: Descending pitch sequence (400Hz → 200Hz)
- **Background Music**: Simple 8-bit melody loop (planned)

#### Audio API

```typescript
// Get audio system
const audio = gameEngine.getAudioSystem();

// Control audio
audio.setVolume(0.5);
audio.mute();
audio.unmute();
audio.isEnabled();

// Play sounds (automatically called by game)
await audio.playJump();
await audio.playCollect();
await audio.playGameOver();
```

### Render Config

```typescript
const render = {
  pixelated: true, // Pixel-perfect rendering
  showFPS: false, // Show FPS counter
  showHitboxes: false, // Show collision boxes
  doubleBuffering: true, // Enable double buffering
};
```

## Integration Points

### Astro Component Integration

The game integrates with Astro through the `MiniGame.astro` component:

```astro
<canvas id="game-canvas" width="240" height="216"></canvas>

<script>
  // Dynamic import to avoid SSR issues
  const { GameEngine } = await import('../game/GameEngine');
  const gameEngine = new GameEngine(config);
  gameEngine.initialize();
</script>
```

### Event System

The game emits events for external integration:

```typescript
gameEngine.addEventListener("gamestart", (event) => {
  // Handle game start
});

gameEngine.addEventListener("collect", (event) => {
  // Handle item collection
  console.log(`Score: ${event.data.points}`);
});

gameEngine.addEventListener("gameover", (event) => {
  // Handle game over
});
```

## Debugging

### Debug Mode

Enable debug features in the render config:

```typescript
const render = {
  showFPS: true, // Show FPS counter
  showHitboxes: true, // Show collision boxes
};
```

### Console Commands

Access game state through browser console:

```javascript
// Get game engine instance
const gameEngine = window.gameEngine;

// Get current state
console.log(gameEngine.getGameState());

// Set score
gameEngine.setScore(100);

// Pause game
gameEngine.pause();
```

## Browser Compatibility

### Supported Browsers

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features

- Canvas 2D context
- RequestAnimationFrame
- ES6 modules
- TypedArrays

## Mobile Support

### Touch Controls

- Single touch zones for movement
- Tap to jump
- Responsive canvas scaling

### Performance

- Optimized for 60fps on mobile devices
- Reduced particle effects on low-end devices
- Adaptive quality settings

## High Score System

The game includes persistent high score functionality:

- **localStorage Storage**: High scores saved to 'miniGameHighScore' key
- **Automatic Updates**: High score updates when game ends with new record
- **Reset Functionality**: Players can reset high score via API
- **Error Handling**: Graceful fallback when localStorage unavailable
- **Score Change Callbacks**: Callbacks fire on all score changes (setScore, collect, etc.)
- **Event System**: Score change events emitted for external integration

#### High Score API

```typescript
// Get current high score
const highScore = gameEngine.getHighScore();

// Reset high score
gameEngine.resetHighScore();

// Score change callback (fires on all score changes)
gameEngine.setScoreChangeCallback((score) => {
  console.log(`New score: ${score}`);
});

// Listen for score change events
gameEngine.addEventListener("score", (event) => {
  console.log(`Score changed to: ${event.data.score}`);
});
```

#### Recent Fixes (Task 2)

**Audio System Fixes:**

- Added unmute callback functionality to AudioSystem
- Fixed callback registration with `setUnmuteCallback()` method
- Callback fires when `unmute()` is called

**Scoring System Fixes:**

- Fixed score change callback to fire on `setScore()` calls
- Added event emission for score changes
- Fixed high score persistence to trigger on `stop()` method
- All score change paths now properly trigger callbacks and events

## Future Enhancements

### Planned Features

- Multiple game modes
- Power-ups and abilities
- Background music implementation
- Leaderboard integration

### Extensibility

- Plugin system for custom entities
- Level editor
- Theme system
- Mod support

## Troubleshooting

### Common Issues

**Game doesn't start**

- Check browser console for errors
- Ensure canvas element exists
- Verify dynamic import is working

**Poor performance**

- Disable double buffering
- Reduce particle effects
- Lower target FPS

**Input not working**

- Check event listener setup
- Verify focus on canvas
- Test with different input methods

### Debug Steps

1. Open browser developer tools
2. Check console for error messages
3. Verify game engine initialization
4. Test individual components
5. Monitor performance metrics

## Contributing

### Development Workflow

1. Run `bun run dev` for development
2. Make changes to game components
3. Test with `bun test`
4. Update documentation
5. Submit pull request

### Code Style

- TypeScript for type safety
- JSDoc comments for documentation
- Modular architecture
- Performance-first approach

## License

This game implementation follows the project's main license terms.

## Astro Component Integration (Updated)

Added a robust SSR-safe Astro component: src/components/game/MiniGame.astro.
Key integration details:

- Renders a lightweight SSR placeholder (LOADING + CTA) so no heavy JS runs server-side.
- Lazy-loads the GameEngine via dynamic import('/src/game/GameEngine') triggered by IntersectionObserver visibility or explicit user gesture (Start CTA).
- Creates a 240x216 canvas and attaches the engine on the client only.
- Exposes UI controls: Start, Pause, Mute, Volume wired to GameEngine API.
- Dispatches custom DOM events from the component root: 'game:ready', 'game:start', 'game:pause', 'game:gameover', 'game:score', 'game:collect'.
- Exposes programmatic API at window.miniGame with documented methods (start, pause, reset, getScore, setScore, setSoundEnabled, getHighScore, resetHighScore, isPlaying, isPaused, setGameSpeed, setScoreChangeCallback, raw).
- Guards all window/document usage with runtime checks so component is SSR-safe.
- Accessibility: ARIA attributes, keyboard handlers (Space => jump, P => pause), touch handlers (tap to jump), and canvas set as role="application" with tabindex for keyboard focus.
- Styling respects Tailwind tokens and uses pixelated scaling for authentic GameBoy feel.

Bundle & Performance Notes:

- GameEngine is dynamically imported in its own chunk to keep initial page bundle small.
- IntersectionObserver prevents loading until near viewport; user gesture (CTA) also triggers load to comply with audio policies.
- Minimal DOM updates: score text updated via a single callback, no canvas re-creation on state changes.
- Techniques used to keep dynamic chunk small: dynamic import, minimal runtime glue in component, reliance on existing game modules (no additional libraries), tree-shakable systems, and no heavy third-party assets in the chunk.

Usage examples:

Programmatic start:

```js
await window.__miniGameReady; // resolves when engine loaded
window.miniGame.start();
```

Listen for score events:

```js
document
  .getElementById("mini-game-root")
  .addEventListener("game:score", (e) => {
    console.log("score", e.detail.score);
  });
```

Development:

- Start dev server: bun run dev
- Visit the page and click the Start Game CTA or scroll the component into view to lazy-load.
