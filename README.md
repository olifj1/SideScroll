# SideScroll patch 1.0.167 — Anim Lab viewport performance pass

Apply this patch **after 1.0.166**. This ZIP contains only files changed for 1.0.167.

## Purpose

The deformable Fox mesh from 1.0.166 is performing well during ordinary animation, but viewport pinch-zoom and pan in Anim Lab can feel heavy on iPhone because every pointer event was forcing a full mesh redraw immediately.

## What changed

- Viewport pan/pinch interaction no longer triggers a complete redraw on every raw pointer event. Camera interaction is now throttled to **one visual update per animation frame**.
- Added a lightweight **gesture snapshot** path for viewport camera moves. When you begin panning or pinching, Anim Lab captures the current canvas once and transforms that flattened snapshot during the gesture instead of re-rendering the full deformable Fox mesh every time your fingers move.
- When the gesture ends, Anim Lab performs one normal high-quality redraw at the final camera position/zoom.
- This optimisation only affects **viewport navigation**. Normal editing, scrubbing, pose changes, animation playback and deform rendering still use the full renderer.
- No rig, animation, weighting or mesh topology data has been changed.

## Why this is safe

Pinch/pan changes only the camera, not the Fox pose. Re-using a flattened snapshot while fingers are moving is therefore a cheap approximation that should feel much smoother on the phone, while the final redraw preserves the real mesh result once the gesture ends.

## iPhone test

1. Apply over 1.0.166 and reload the PWA.
2. Anim Lab → Fox → Walk → Deform.
3. Try pinch-zooming in and out repeatedly with Wireframe off, then on.
4. Try panning around while zoomed in.
5. The gesture should feel noticeably lighter/smoother, and the final settled image should still redraw cleanly at gesture end.
6. Check that normal Play / scrubbing / Paw Target editing still looks unchanged.
