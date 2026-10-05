# SS-PATCH-1.0.115

Applies over `SS-PATCH-1.0.114`.

## Multiple World Group exclusion zones
- A World Group can now own any number of rectangular procedural exclusion zones.
- Existing single exclusions migrate automatically to Zone 1.
- Added `+ Add Exclusion`, previous/next zone navigation and `Delete Exclusion`.
- Enable/Disable, Edit and Fit operate on the currently selected zone.
- All enabled zones suppress procedural biome dressing.
- Group templates save/restore every exclusion zone.

## Procedural placement reset
Added to the Section panel:
- `Reset procedural changes · this section`
- `Reset procedural changes · ALL`

Reset affects only editor overrides on deterministic biome-generated trees,
grass/foliage and rocks. It does not reset:
- manually placed world assets;
- World Groups;
- puzzles;
- terrain height/type/layers;
- river-bank authored dressing.

Per-section reset checks both the object's original deterministic X position and
its current edited X position, so a procedural object moved into or out of the
selected section is still recoverable. The scene reloads after a successful
reset so the deterministic procedural layout is rebuilt cleanly.

## Climb-path interaction dot
When the player is close enough to enter an authored Climb Path, the same small
interaction dot used by logs/actionable objects now appears at the valid climb
entry point. For a path usable from either end, the currently valid/nearest end
is indicated. The dot disappears once climbing begins.
