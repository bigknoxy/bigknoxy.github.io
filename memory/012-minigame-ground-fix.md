# Ground Alignment Fix

## Context

The mini-game had a visual alignment issue where:

- Visual ground was rendered at `height - 20` (y=196 for 216px canvas)
- Player physics ground was at `height - 60` (y=156)
- Obstacles spawned at `height - 60` (y=156)
- This created a 40-pixel gap where entities floated above the visual ground

## Decision

Implemented a unified ground Y coordinate system:

1. Added `GROUND_Y` constant in GameEngine set to `config.height - 20`
2. Updated player spawning to use `GROUND_Y` instead of `height - 60`
3. Updated obstacle spawning to use `GROUND_Y - obstacle.height` for proper bottom alignment
4. Updated ground rendering to use unified `GROUND_Y`
5. Modified Player bounding box to use full height for accurate collision

## Outcome

- Visual ground, player feet, and obstacle bottoms now align at same Y coordinate (196)
- Player collision box properly aligns with visual sprite
- Obstacles sit correctly on the ground line
- All collision detection works with unified ground reference
- Unit tests verify ground alignment consistency
- Manual testing confirms visual alignment fix

## Files Modified

- `src/game/GameEngine.ts` - Added GROUND_Y constant, updated spawn/render logic
- `src/game/entities/Player.ts` - Updated bounding box to full height
- `src/game/entities/Obstacle.ts` - No changes needed (uses spawn position correctly)
- `tests/unit/ground-alignment.test.ts` - New test file for ground alignment verification
- `tests/unit/collision.test.ts` - Updated bounding box expectations

## Test Results

- All 10 ground alignment tests pass
- All 13 collision tests pass
- Total: 32/33 unit tests pass (1 unrelated test failure)
- Manual verification confirms visual alignment
