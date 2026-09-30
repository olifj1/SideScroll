# SS-PATCH-1.0.77

Base expected: SideScroll v1.0.76.

## Fixes

### World Lab renders again
- Fixes the blank World Lab where static track labels appeared but puzzle markers, terrain profiles, section data and dynamic content did not.
- Root cause: World Lab called `init()` before the terrain-layer constant had been initialised. The first render therefore stopped on a JavaScript temporal-dead-zone error.
- Initialisation now happens after all module constants/functions are defined.
- Verified with a local DOM harness: puzzle markers and terrain/section profile elements are generated after startup.

### Raised terrain no longer separates into chunks
- Fixes visible gaps between neighbouring 10 m terrain sections after changing section heights.
- Root cause: the new terrain meshes already baked the interpolated elevation into their vertices, but the generic wrapped-scenery draw path then added the terrain-height offset a second time to each section object.
- Ground/path terrain meshes now keep their authored model Y; only wrapped scenery/dressing is re-grounded against its drawn world position.
- Section edge geometry continues to use the same interpolated height function on both sides of each boundary.

## Changed files
- `world-lab.html`
- `world-lab.js`
- `play.html`
- `sidescroll.js`
- `README.md`

## Test focus
1. Open World Lab. Puzzle markers should be visible again.
2. The Sections / Terrain track should show section boxes and the Path height profile.
3. Expand TERRAIN and confirm Near / Far A / Far B profiles appear.
4. Return to the game and raise several neighbouring sections.
5. Confirm the dirt/path terrain remains physically joined with no open seams between 10 m chunks.
6. Confirm wrapped trees/grass still follow the raised terrain rather than sinking into it.

No local-storage reset is required.
