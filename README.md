# SideScroll 1.0.71 — cumulative UI + camera follow patch

Base expected: SideScroll v1.0.68 Puzzle Lab build.

This patch is deliberately cumulative so it is safe whether or not v1.0.69 and v1.0.70 were uploaded. Upload every file in this ZIP over the repo root.

## Includes the missed v1.0.69 launcher-menu fix
- Slightly tighter launcher menu spacing.
- Launcher menu is bounded to the visible viewport/safe areas.
- Vertical touch scrolling, iOS momentum scrolling and contained overscroll are enabled when the menu grows beyond the screen.

## Includes v1.0.70 Asset Lab direct editing
- Puzzle Lab has Edit Asset for the selected prototype asset.
- Asset Lab accepts a direct `?asset=` link and opens the requested asset selected/editable.
- Mountain Climb Prototype opens Mountain Climb Rock 01 directly.

## New in v1.0.71 — vertical camera follow during climbing
- Camera height follow now reacts to meaningful character elevation, not only the jump flag.
- The camera rises while Aureli climbs the rock, remains raised while she walks on the elevated top, and settles as she climbs back down.
- Uses the stable normal-path reference rather than river-bed terrain, so bridge/river terrain should not create a false vertical camera lift.
- Existing camera follow Enabled/Amount settings still control the effect.

## Changed files
- `README.md`
- `style.css`
- `index.html`
- `play.html`
- `sidescroll.js`
- `asset-lab.html`
- `asset-lab.js`
- `puzzle-lab.html`
- `puzzle-lab.js`

## Test focus
1. Upload all files in this patch; do not separately apply v1.0.69 afterward.
2. Open the launcher Menu in landscape and confirm it fits more tightly and scrolls vertically if required.
3. Open Puzzle Lab > Mountain Climb Prototype and test climbing up.
4. Confirm the camera smoothly follows Aureli upward during the climb and stays appropriately raised while walking on top.
5. Climb down and confirm the camera settles smoothly back to the normal framing.
6. In Puzzle Lab, use Edit Asset and confirm Asset Lab opens Mountain Climb Rock 01 selected.

No local game/puzzle/world data is cleared or reset by this patch.
