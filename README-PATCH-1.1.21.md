# SS-PATCH-1.1.21 — Joint offset, guides and precision fixes

## Install

Install directly over SideScroll v1.1.20, replacing only the files in this ZIP. As usual, this is a **single release / changed-files-only** patch, not a new complete build and not a cumulative chain. After publishing, reopen Anim Lab. The service worker uses `sidescroll-runtime-v131`.

## Changes in this release only

1. **Rotated local joint offsets no longer silently snap back when the resulting quadrilateral is concave but non-crossing.** The polygon ownership test already handles simple concave outlines, so they are now permitted. Truly crossing/inverted shapes remain rejected. If a slider requests an out-of-bounds cap, the editor searches between the last valid position and the request and stops at the nearest valid position rather than resetting to the saved zero point. This works for rotation, width and Local X/Y. Rest-pose binary weight recalculation remains tied to the accepted edit.
2. **Show all influence regions for the selected Part.** The `Influence guide` toggle now draws every bound bone region of that selected Atlas part, in both joint-boundary mode and old rectangle mode. The selected bone has a brighter cyan outline, all other part regions have muted cyan outlines, and the currently edited joint boundary remains orange. These are visual guides, not extra weights or per-frame rebinds. They follow their respective bones in preview.
3. **Remove Free-end extension slider.** Moving the first/last joint's Local X offset can already extend beyond a bone endpoint. The old v120 terminal extension is merged into mathematically equivalent rotated X/Y offsets on the first subsequent joint edit (preserving its existing shape), then removed from that binding. Older saved data remains readable before editing. New joint boundaries have no end-extension property.
4. **Finer offsets on phone.** Local X/Y range slider steps are now 0.001 m (1 mm) rather than 0.005 m (5 mm). Each offset has dedicated **±1 mm** nudge buttons, each a single undoable Setup edit, to provide precise control without needing pixel-perfect dragging. The broad ±0.6 m slider range remains for extending chain ends.
5. Updated styling, version queries and service worker cache for the changed components. Three release README files document *only* this drop; four canonical documentation files remain cumulative.

## Deliberately unchanged

Weighting is still **100%/0% binary** per mesh vertex, with a maximum of one bone's weight per automatically claimed vertex. No Blend Distance, soft transition, joint rig changes, automatic mesh subdivisions, GPU renderer, IK changes, animation retiming or FPS refactoring.

## Checks performed

- `node --check` passed for modified JavaScript files.
- Synthetic mobile-landscape Chromium UI: convert rear leg to joint-boundaries, rotate knee by 16°, widen to 1.6×, set X=0.010m and Y=-0.025m, vary rotated local Y, edit and retain saved data, press ±1mm nudges, and verify precisely one bright and two muted region guides for the three-bone chain. All with no page errors.
- An extreme 0.6m local Y request stopped at a still-valid cap, rather than resetting to zero.
- Real imported New01 artwork and iPhone Safari visual behaviour **not** tested in this environment. Some deliberately extreme edits can still be bounded by the geometry safety checks.

## Files changed this drop

`anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.21.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_EXPORT_COVERAGE.md`, `SIDESCROLL_TASKS.md`.
