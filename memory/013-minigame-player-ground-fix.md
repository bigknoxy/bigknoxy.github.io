# Player Ground Alignment Fix

## Context

After recent ground/obstacle alignment fixes, a regression was introduced where the player character was rendering below the ground line. The player's visual sprite and collision box were not aligned with the visual ground, causing the player's feet to appear underneath the ground.

## Root Cause Analysis

The issue was in the coordinate system interpretation:

1. **Ground Line**: `GROUND_Y = 196` (216 - 20) represents the visual ground line
2. **Player Spawning**: Player was spawned at `position.y = GROUND_Y` (196)
3. **Visual Sprite**: Player sprite renders legs from `y+16` to `y+20`, so feet were at `216`
4. **Ground Rendering**: Ground renders from `y = 196` to `y = 216`
5. **Result**: Player's feet were 20px below the visual ground line

The problem was that `player.position.y` represented the top of the sprite, but the game logic was treating it as if it represented the feet position.

## Decision

Implement a minimal fix that:

1. Spawns player at `GROUND_Y - player.height` so feet align with ground line
2. Updates player's `groundY` reference to match this coordinate system
3. Preserves all existing collision detection logic
4. Maintains obstacle alignment (which was already correct)

## Implementation

### Files Changed:

1. **src/game/GameEngine.ts**:
   - Changed player spawn position from `y: this.GROUND_Y` to `y: this.GROUND_Y - 20`
   - Updated player's groundY reference to `this.GROUND_Y - 20`

2. **src/game/entities/Player.ts**:
   - Removed override of `position.y` in constructor (let config set correct position)
   - Updated reset() method to preserve correct positioning
   - Ground collision logic unchanged (still works correctly)

3. **tests/unit/ground-alignment.test.ts**:
   - Updated test expectations to match correct coordinate system
   - Player now spawns at `GROUND_Y - 20` with feet at `GROUND_Y`

4. **tests/unit/collision.test.ts**:
   - Updated test comments to clarify coordinate system
   - No functional changes needed (collision logic preserved)

## Outcome

✅ **Fixed**: Player's visual feet now align exactly with ground line
✅ **Preserved**: All collision detection logic remains intact
✅ **Maintained**: Obstacle ground alignment unchanged
✅ **Verified**: All unit tests pass (23/23)
✅ **Minimal**: Only essential changes made, no refactoring

### Key Metrics:

- Player position: `y = GROUND_Y - 20` (176)
- Player feet: `y + 20 = GROUND_Y` (196)
- Ground line: `y = GROUND_Y` (196)
- Perfect alignment achieved

## Verification

- Unit tests: All 23 tests passing
- Manual verification: Player stands on ground line in browser
- Collision detection: Unchanged and working correctly
- No regressions introduced

This fix ensures the player character appears to stand exactly on the ground while maintaining all existing game mechanics.
