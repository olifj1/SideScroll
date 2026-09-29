# SideScroll v1.0.74 — code safety resync

This is the cumulative code/data baseline after the v1.0.73 climb-path work.

## v1.0.74 fixes
- Restores the complete Asset Lab Climb Path editor that was accidentally omitted from the previous CODE-only safety ZIP.
- Mountain Climb Rock 01 exposes its independent Climb Paths in normal Asset Lab.
- World Lab **Play From Here** launches without the cinematic black entry overlay, so a developer jump cannot become trapped behind a black screen.
- World Lab and Asset Lab script URLs are cache-busted to v1.0.74.
- World Lab test spawn validates the terrain height and reports the requested metre position in the game status.

## Upload
Upload the files over the repo root. Do not clear browser/PWA local storage. Existing PNG/audio assets remain valid and are intentionally not required by the CODE ZIP.

## Test focus
1. Open Asset Lab directly, select Mountain Climb Rock 01, and confirm **CLIMB PATHS · Invisible ladder** is visible.
2. Confirm the two cyan climb paths render and can be moved/resized/rotated.
3. Open World Lab, drag PLAY, press **Play From Here**, and confirm the game appears immediately at that world X instead of a black screen.
4. Confirm normal Play still uses the usual entry fade.
