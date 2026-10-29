# SS-PATCH-1.1.13 — Atlas assembly playback CPU speed

**Prerequisite:** v1.1.12. Install changed files directly over it. Do not install this alone on an earlier build, and do not reset or rebind characters.

## Why

The built-in Fox draws a small number of transformed atlas regions per frame. A newly authored Atlas assembly uses deformable textured triangles, each of which v1.1.12 clips and draws separately. An author-created 800-face mesh repeated five times therefore requires 4,000 separate Canvas2D draw operations per frame. Envelope weights are *not* recalculated on every animation frame; the main extra cost comes from rendering and repeatedly mapping each weighted vertex through all relevant bones. v1.1.12 deliberately removed the much faster but visually incorrect/untested WebGL path. This drop improves the verified Canvas2D method instead.

## Changes in this drop

- **Consecutive affine face batching:** When neighbouring triangles share sufficiently similar posed UV-to-screen transforms (maximum 0.18 canvas pixel error at candidate vertices), render a single union clip and cropped atlas draw. Preserve all deformed vertices and mesh edges, source UV coordinates, artwork opacity, triangle stacking order, and every Skin weight. No irreversible mesh simplification or changes to stored topology.
- **Bone matrix precomputation:** Compute each bone's affine rest-to-posed transformation once per frame. Apply weighted combinations to each vertex; equivalent to the prior `mapBone` calculations to floating-point precision.
- **Cache safe immutable reads:** Reuse neutral bind geometry while the rig reference is unchanged; reuse mesh signatures between animation frames. Signatures are invalidated while editing Atlas geometry.
- **Skin/Animate/Play parity:** All use the *same* Canvas2D path. Do not reload v1.1.11's WebGL module. No changes to saved binding schemas or capsule-envelope controls.
- **Diagnostics:** `window.AnimLabAssemblySkinInspect.performance()` returns `{triangles,drawCalls,batched,ms}` for the most recent Atlas assembly paint, to help diagnose real-device performance without adding another editor panel.

## Verification

- Node syntax passed. Headless Chromium with 5 instances × 800 triangles, synthetic coloured atlas, fixed posed Walk frame, and 25 redraws:
  - Single-bone rigid: approximately **38.6 ms → 11.3 ms** per total page redraw.
  - Smooth cross-body gradient: approximately **52.7 ms → 13.1 ms** per total page redraw.
  - In those tests, draw operations fell from 4,000 to 15 rigid / 1,000 gradient, with no JavaScript exceptions.
- Screenshots retained matching character placement and silhouette, with minor sampling and internal triangle-seam differences. No stored geometry changed.
- These results use synthetic meshes, not the user's imported New01 PNG, actual 3ds Max-style weighting setup, Safari graphics driver, or zoomed phone viewport. They are not guaranteed iPhone FPS results.

## What to test

1. Install over v1.1.12; reload/restart the PWA so the new cache takes effect.
2. Open **New01 → Animate → Walk** and assess playback speed at Fit, then higher zoom. Compare with Skin's Walk preview without altering bindings.
3. Check leg texture stability during bending and Quick Play. Select the built-in Fox and note that its fixed-region drawing will still be substantially lighter.
4. If poor, preserve your current setup. We need your actual draw statistics/topology and a separately validated GPU compositing implementation, not more changes to skin envelopes to compensate for frame-rate issues.

## Not part of this drop

No WebGL reintroduction, no new skin weighting model, no change to imported texture storage/export, no normal-game rendering integration.

**Changed files:** `anim-lab-assembly-skin.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.13.md`, and the four cumulative authoring/UX/task/export documents.
