# SideScroll patch 1.0.140

**Changed-files-only patch over v1.0.139.** This is a focused polish/fix drop: true World Lab Terrain Surface blend previews plus corrected Free-member vertical placement for World Group Templates and whole-group moves.

## v1.0.140 — Surface blend preview + Group Template roof-height fix

### World Lab Terrain Surface blend preview

- Solid Terrain Surface spans continue to show their real material textures.
- Each A -> B blend block now shows the **actual visual crossfade**: the From material is the base and the To material fades from 0% at Blend Start to 100% at Blend End.
- The preview uses the existing authored start/end range only; it does not create a second blend system or new data.
- Selection outline, label and START/END drag handles remain above the material preview.

### World Group Template Free-member height correction

The older Group Template code stored Free members such as manually raised roofs relative to the **Group anchor's** terrain height. On terrain whose height changes across a wide group, Ground buildings re-sampled their own local terrain while the roof followed the centre of the group, which could create a vertical gap.

v1.0.140 changes the reusable rule:

- Ground members keep their existing local terrain + authored floor-offset behaviour.
- Free members now preserve their authored floor offset relative to the terrain beneath **that member's own X/Z position**.
- Whole-World-Group movement uses the same rule, so moving a correct building group does not reintroduce the roof drift.
- New/updated Group Templates save `freeLocalFloorOffset`. The previous `freeGroupFloorOffset` remains only as a legacy fallback.

### Existing v1.0.139 templates

A conservative migration is included. If an old Template has no local Free-member offset and there is a linked source Group that clearly existed **before the Template was created**, the patch recovers the correct local offsets from that source and rebuilds the other linked instances with the corrected rule. It deliberately does not guess when no unambiguous pre-template source exists.

For the current `VillageGroup02` export, the original linked group predates the Template and therefore qualifies for this repair path; the later `VillageGroup02 2` instance should be rebuilt using the original roof offsets after the first v1.0.140 load.

## Changed files

- `sidescroll.js`
- `play.html`
- `world-lab.js`
- `world-lab.html`
- `world-lab.css`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

No terrain texture PNGs are repeated in this patch; v1.0.140 uses the surface art already installed by v1.0.139.

## Suggested iPhone checks

1. Reload Play once after installing v1.0.140. Inspect the original `VillageGroup02` and `VillageGroup02 2`. The original should remain visually unchanged and the second linked instance should no longer have the raised/floating roof gap.
2. Place a new `VillageGroup02` Template Instance in another settlement position. Confirm the roofs remain aligned with their buildings even where terrain height changes across the width of the group.
3. Move a placed building group using its yellow whole-group handle. Confirm Free roof pieces remain aligned throughout the move.
4. In World Lab, inspect the current Woodland Dirt -> Village Cobble Terrain Surface transition. The blend block should visibly crossfade from dirt to cobble from its START handle to END handle.
5. Drag either Surface Blend handle and confirm the visual crossfade stretches/compresses with the same authored range and Undo remains functional.
6. Reload and verify both the Group repair and Surface Blend positions persist.

If a different legacy Group Template has no identifiable linked source that predates the Template, v1.0.140 intentionally leaves its old height fallback intact. Re-saving that Template from a correctly aligned instance under v1.0.140 captures the new local offsets permanently.
