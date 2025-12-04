# Minigame Collision Fix

## Context

The player could stand above obstacles and walk over them without colliding - effectively the player's collision box was not aligned with obstacles/ground. Players appeared to float over obstacles visually, but the collision detection was not working as expected.

## Root Cause Analysis

The issue was caused by coordinate system misalignment between visual sprites and collision bounding boxes:

1. **Player Position**: Player spawned at `y: height - 60` with size `20x20`
2. **Player Ground**: Player's `groundY` was set to `height - 60`
3. **Obstacle Position**: Obstacles spawned at `y: height - 40` (20 pixels lower)
4. **Collision Box**: Player's bounding box used full entity size without visual alignment
5. **Visual vs Physics**: Player's visual feet were at bottom of sprite, but collision box included full height

This created a 20-pixel vertical gap where player collision box aligned with obstacle top edge, allowing player to "stand over" obstacles without proper collision.

## Decision

Implement minimal, focused fixes to align collision boxes with visual sprites:

1. **Player Bounding Box**: Add 4-pixel Y offset and reduce height by 4 pixels to align with visual sprite body
2. **Obstacle Spawning**: Change obstacle Y position from `height - 40` to `height - 60` to align with player ground level
3. **Collision Tests**: Add comprehensive unit tests to prevent regression

## Outcome

- ✅ Player collision box now aligns with visual sprite
- ✅ Obstacles spawn at correct ground level
- ✅ Collision detection works as expected - player can no longer stand over obstacles
- ✅ All 13 unit tests pass, covering edge cases and collision scenarios
- ✅ Minimal changes maintain API compatibility
- ✅ Game physics feel natural and responsive

### Files Modified

- `src/game/entities/Player.ts`: Added bounding box offset to align with visual sprite
- `src/game/GameEngine.ts`: Fixed obstacle spawning Y position to align with player ground
- `tests/unit/collision.test.ts`: Added comprehensive collision detection tests

### Test Results

```
bun test v1.2.21
13 pass
0 fail
19 expect() calls
Ran 13 tests across 1 file. [61.00ms]
```

The collision system now properly detects when player intersects with obstacles, ending the game as expected. Players can no longer exploit the collision misalignment to walk over obstacles.
