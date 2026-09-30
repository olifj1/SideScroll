# SideScroll v1.0.76 patch

Base expected: v1.0.75 (or the v1.0.74 code safety build with v1.0.75 applied).

## What this fixes

### Terrain elevation grounding
- Wrapped/procedural trees, grasses and rocks now resolve their displayed height against the terrain at the world position where they are actually being drawn.
- This fixes forest dressing sinking beneath raised/sloped terrain while preserving the repeating forest system.
- Authored terrain-bound scene objects continue to retain their local floor offset when terrain heights change.

### Vertical camera follow
- Camera follow now tracks signed world-height change rather than only a partial upward rise.
- The untouched legacy 55% follow default migrates to 100% so tall climbs and raised terrain keep the character framed consistently.
- Downward terrain is supported too for future cave/descent work.

### World Lab recovery
- Fixes a v1.0.75 JavaScript parse error that left only the static track labels visible.
- Terrain elevation profiles and puzzle markers render again.
- Path / Near / Far A / Far B height tracks read the same terrain-section storage as the game.

### Safer World Lab editing
- First tap/release selects a movable puzzle/world block.
- Only a subsequent drag of the already-selected block moves it.
- Resize handles are inactive until their world element is selected.
- Added an Undo button for World Lab layout/terrain edits and queued puzzle moves.
- Added two-finger pinch zoom to the timeline.

### Play From Here
- World Lab playhead launches now use the lightweight authoring/test game route rather than Player Mode's cinematic/save-state launch path.
- The requested world X is still applied, but this avoids the incomplete/black Player Mode launch path during world-layout testing.

### Persistent environment dressing
- A reusable puzzle asset is no longer deleted from normal scene storage just because that same asset also belongs to a puzzle asset pack.
- This specifically fixes Mountain Climb Rock 01 disappearing when placed as ordinary Environment dressing.
- Persistent user-placed environment dressing now appears on World Lab's DRESSING track and can be inspected/jumped to there.

### In-game asset scaling
- The general level-editor scale cap has been raised substantially so editing a large asset no longer snaps it back to the old 5 m ceiling.

## Files in this patch
- README.md
- sidescroll.js
- play.html
- world-lab.js
- world-lab.css
- world-lab.html

## Test focus
1. Raise a terrain section around the current forest and confirm nearby trees/grass remain planted on the visible slope.
2. Walk/climb several metres upward and confirm the camera keeps the character at a stable screen height.
3. Open World Lab: terrain profiles and puzzle boxes should be visible again.
4. Tap a World Lab block once, then pan elsewhere: it should not move. Drag it only after it is selected.
5. Pinch the World Lab timeline to zoom.
6. Test Undo after moving/resizing a World Element or changing a terrain height in World Lab.
7. Use Play From Here and confirm the normal world renders at the chosen X.
8. Place Mountain Climb Rock 01 as Environment dressing, leave/re-enter the game, and confirm it persists. Then confirm it appears on World Lab's DRESSING track.
9. Scale the rock beyond the previous in-game cap and confirm it retains the larger size.

No local-storage reset is required or desired.
