# SideScroll patch 1.0.147

Corrective patch over v1.0.146. No Stage 4/IK work is included.

## Fixes
- iPhone native range controls in Anim Lab now commit an intentional value when Safari ends the gesture with `pointercancel`; scale-only edits therefore become Unsaved and enable Save instead of visually moving while silently reverting.
- Adds `pointerup` commit handling for Setup sliders as an explicit native-slider end path.
- Anim Lab landscape edge columns now reserve `env(safe-area-inset-left/right)` plus the normal UI gutter, so controls do not sit under the iPhone sensor/earpiece area.
- Asset Lab receives the same left/right safe-area treatment, including wider edge grid tracks so the safe inset does not steal usable panel width.
- Cache-busts the affected Anim Lab script/CSS and Asset Lab CSS reference.

## iPhone checks
1. Open Anim Lab in landscape with the hardware cutout/earpiece on the left. `Scale` and the full left drawer should be visible with a small gutter.
2. Rotate 180 degrees. Right-edge UI/viewport should remain clear of the hardware inset.
3. Fox > Setup: move only Scale. Confirm Saved changes to Unsaved and Save enables before touching any other setting.
4. Tap Save, return to Play, select Fox and confirm the saved size is used.
5. Reload Anim Lab and confirm the saved Fox scale reloads.
6. Open Asset Lab in both landscape orientations and confirm the library/control columns remain fully readable.

## Validation performed here
- JavaScript syntax checks for the complete project.
- Static event-wiring check confirms Setup sliders commit on pointerup, change, blur and pointercancel.
- CSS/HTML wiring checks for `viewport-fit=cover`, safe-area environment variables and updated cache-busting URLs.
- Patch replay over a clean v1.0.146 tree.

Physical iPhone safe-area geometry and Safari's native range event sequence still require the on-device checks above.
