# SS-PATCH-1.1.14 — Animate IK drag responsiveness

**Prerequisite:** v1.1.13. Copy this ZIP's changed files into the GitHub build. Do not delete or recreate existing local character documents, source meshes, textures, weights or animation clips. Reload the PWA after publication so its v124 service worker and v1.1.14 script URLs take effect.

## Problem addressed

Walk/Run playback was tolerable, but dragging a paw IK target in the Animate precision pad was disproportionately slow. The existing pointermove handler invoked `core.previewTransaction()` for every touch sample. Unlike playback, that operation repeatedly restored and normalised a sparse clip, compiled its frames, computed save/dirty state and ran a complete UI/subscriber refresh. `applyPrecision()` also used `core.getState()` (which deep clones the setup including potentially large Atlas mesh bindings) for every move.

## Code changes in this drop

1. `walk-lab.js`: add `previewPoseDrag`, `commitPoseDrag` and `cancelPoseDrag` for *Animate pose* transactions only. A drag is shown with a temporary normalised pose but does not alter the stored sparse clip. Suppress expensive editor-wide refresh on these preview redraws. Commit the final pose to the sparse clip once and write one undo history entry; cancellation has no data mutation.
2. `anim-lab-stage2.js`: coalesce pointermove samples via `requestAnimationFrame`; always flush the final pointerup location; update only the selected channel readout during drag. Capture rig-family/clip/phase once on pointerdown rather than calling cloned `getState()` on each sample. Pause playing animation before authoring a drag.
3. Bump affected script query strings in `walk-lab.html` and the service-worker cache identifier in `sw.js`.

These changes do **not** alter how IK is solved, how weights are generated, how textured triangles are rasterised, the bone/rig setup or any saved data schema. The normal `previewTransaction()` remains available unchanged for Rig/Parts/Skin and other editors.

## Verification

- Node syntax checks passed on the two edited JavaScript files.
- Headless Chromium with synthetic DPR2 landscape touch-size viewport: select Fox Front Near Paw Target, drag, verify final FK/IK pose channel changes, saved dirty status, Undo restores original channels, Redo reapplies channels, and pointercancel leaves the sparse clip unchanged. No page exceptions (the test manually stubbed pointer capture only for a synthetic event that did not create an actual browser pointer).
- Tests did not load the user's current imported New01 image or simulate full iPhone Safari raster costs. No measured on-device FPS improvement is claimed.

## Acceptance check

On the actual iPhone, enter **New01 → Animate → Walk**; select a Paw Target and drag using the right-hand pad. Confirm the paw follows continuously; release and Undo/Redo; Save and reopen the clip. Compare dragging with Walk playback and at multiple zoom levels. If redraw remains slow, inspect `AnimLabAssemblySkinInspect.performance()` for CPU triangle/draw-call cost before changing any Skin envelopes.

**Only files included:** `walk-lab.js`, `anim-lab-stage2.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.14.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
