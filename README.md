# SideScroll patch 1.0.139

**Changed-files-only patch over v1.0.138.** This is a focused Terrain Surface art/library pass. It does not begin the Terrain Feature/river Stage 4 work.

## v1.0.139 — Terrain Surface texture pack + previews

- Adds seven Art-Bible-aligned tileable terrain surface images: **Woodland Soil**, **Village Cobble**, **Rocky Gravel**, **Mountain Trail**, **Wetland Mud**, **Pale Gravel** and **Snow Ground**.
- Keeps the existing **Woodland Dirt** texture as the default/current surface so installing the patch does not silently restyle already-authored terrain.
- Existing Stage 3 IDs for Rocky Ground, Pale Gravel and Snow Ground are preserved. Their prototype procedural visuals are replaced in-place by the new image textures, so existing blends using those IDs automatically gain the real art without moving or rewriting ranges.
- World Lab Terrain Surfaces now includes a tappable **Surface Library** with tiled material thumbnails and short descriptions. Tapping a card chooses it as the target for the next blend.
- Default and target surfaces have larger material previews; editing an existing Surface Blend shows its From/To previews as well.
- Solid spans on the World Lab Terrain Surface timeline display the actual active texture rather than only a flat representative colour.
- Runtime remains bounded to one active surface outside a blend and the two participating surface textures inside a blend.

## Included surfaces

1. Woodland Dirt — existing SideScroll dirt; unchanged default.
2. Woodland Soil — new painterly woodland alternative.
3. Village Cobble — worn irregular settlement paving.
4. Rocky Gravel — dense stony/gravel trail surface.
5. Mountain Trail — warmer dry ochre upland path.
6. Wetland Mud — dark soft marsh/wetland ground.
7. Pale Gravel — sparse pale barren/moonlike ground.
8. Snow Ground — muted trampled snow with exposed grit.

## Changed files

- `sidescroll.js`
- `play.html`
- `world-lab.js`
- `world-lab.html`
- `world-lab.css`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`
- `terrain-surface-woodland-soil.png`
- `terrain-surface-village-cobble.png`
- `terrain-surface-rocky-gravel.png`
- `terrain-surface-mountain-trail.png`
- `terrain-surface-wetland-mud.png`
- `terrain-surface-pale-gravel.png`
- `terrain-surface-snow-ground.png`

## Suggested iPhone checks

1. Open World Lab -> Terrain Surfaces and confirm all eight materials appear with thumbnails and no panel overflow.
2. Tap several Surface Library cards. Confirm the Blend Target preview, `To surface` selector and summary update together.
3. Change the Default Surface temporarily and confirm its larger preview updates; Undo/reload behaviour should remain as before.
4. Add a short Woodland Dirt -> Village Cobble blend and a second Cobble -> Rocky Gravel blend. Confirm the solid timeline spans show the real textures and the blend handles still drag normally.
5. Enter Play/Terrain Edit and walk through each new surface. Check texture scale/repetition, brightness/contrast against existing art, and smooth A -> B blending.
6. Reload once after the textures have been viewed and verify they remain available/offline through the existing on-demand asset cache.

These textures are intentionally a **first reviewable production pack**, not locked final art. Use the in-game result to decide which need another ImageGen pass for scale, tiling, value or biome character.
