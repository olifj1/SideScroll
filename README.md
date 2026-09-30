# SideScroll v1.0.79 — Terrain depth groundwork

Base expected: current v1.0.78 code.

This is a flat changed-files-only patch. Upload every file in this ZIP to the repository root, replacing matching files. No images or audio are included. Do not clear local storage.

## Changed files
- asset-lab.html
- asset-lab.js
- design-doc.json
- play.html
- sidescroll.js
- style.css
- world-lab.css
- world-lab.html
- world-lab.js

## What changed

### Terrain depth strips
- Path remains the master authored elevation spine.
- Near, Far A and Far B stay linked to Path by default.
- Each depth strip now supports a sparse authored **Offset**. Set it once at a section and that offset carries forward.
- Each depth strip can switch to **Explicit** at a section. Explicit mode holds its own world-height profile independently of Path until a later section switches it back to Linked.
- This allows the walkable path to continue climbing while distant terrain stays low / falls away to open a mountain vista.
- Both World Lab and the in-game Section editor expose Linked / Explicit plus Offset / Height controls.
- World Lab marks explicit terrain profile points with an `E`.

### Terrain seam treatment
- Terrain depth bands now use a tiny render-only vertical stagger (2 cm per depth step) so adjacent strips overlap visually instead of exposing hairline seams.
- Path collision / player ground height is unchanged.

### Surface-normal dressing
- Asset Lab has a new **Follow Surface Normal** behaviour.
- When enabled on a terrain-bound dressing asset, the asset visually tilts to match the local terrain slope.
- Intended for grasses, scrub and small rocks. Leave trees / major props upright unless deliberately wanted.

### Artwork workflow
- No runtime brightness / contrast / saturation controls were added. Source textures remain authoritative.
- If needed later, an Asset Lab "bake appearance to exported PNG" workflow can be added, but it would export a replacement texture for GitHub rather than silently altering the repo.

## Test focus
1. Raise Path across several sections and confirm existing terrain behaviour still works.
2. Open Sections in-game, expand Depth Layers, set Far B to Explicit at the start of a climb, then keep raising Path. Far B should remain independent.
3. Switch Far B back to Linked at a later section and confirm it resumes following the Path-derived profile.
4. In World Lab, expand Terrain and confirm Near / Far A / Far B profiles reflect Offset / Explicit changes.
5. Check the Near → Path / Far strip boundaries for the previous micro seam.
6. In Asset Lab, enable Follow Surface Normal on one grass asset, place it on a slope and confirm it tilts with the ground while an ordinary tree remains upright.

Not included in this pass: climb animation v2, mountain art generation, biome/location asset pools, biome transition probability blending.
