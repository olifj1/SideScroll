# SS-PATCH-1.0.80

Base expected: SideScroll v1.0.79.

## Changed files
- `world-lab.html`
- `world-lab.js`
- `play.html`
- `README.md`

## What changed

### One authoritative project export
World Lab > Data is now the normal project handoff location.

- `Export Complete Game` replaces the old World Elements-only export.
- It uses the same iPhone-friendly Share Sheet flow as the original complete-game export, with a download fallback.
- The export now includes World Elements, terrain height/depth-layer authoring, pending World Lab puzzle moves, scene edits and placed world assets, puzzle library/runtime/starts/workshop/exclusions, reusable asset behaviours/collision/climb paths/mechanisms/sockets/states/layout, collectables/inventory, camera, render, audio, Concept Lab state, Design Lab working state, animation state and player position/settings.
- `Import Complete Game` restores the v2 complete export and remains backward compatible with the older `SideScrollGameDesign` and World Elements-only files where possible.
- The old `Export All` button has been removed from the buried puzzle Stage panel, leaving World Lab as the single user-facing complete export location.

### World Lab world assets
World Lab no longer assumes that a world-owned asset must have `category: dressing`.

Any non-deleted object in the main scene `added` list with no `puzzleInstanceId` is treated as a world-owned placed asset. This means interactive environment assets such as `mountain-climb-rock-01` appear on the World Assets track even though they use gameplay behaviours such as `climb-rock`.

The existing Dressing track is labelled `WORLD ASSETS` and still also carries authored Dressing Group / Explicit Dressing World Elements.

## Test focus
1. Open World Lab. Confirm both placed Mountain Climb Rock assets now appear on WORLD ASSETS, along with the existing manually placed ground asset.
2. Confirm puzzle markers, terrain profiles and the Woodland biome region still appear normally.
3. World Lab > Data > Export Complete Game. On iPhone this should open the same Share Sheet-style save flow used by the original complete exporter.
4. Inspect/export the JSON if desired: `format` should be `SideScrollGameDesign`, `formatVersion` should be `2`, and the new `world.elements` / `world.terrain` sections should be present.
5. The puzzle Stage panel should no longer show the old `Export All` button.

No image/audio files are included in this patch.
