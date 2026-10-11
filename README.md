# SideScroll patch 1.0.138

**Changed-files-only patch over v1.0.137.** This is Stage 3 of Terrain Edit: continuous Terrain Surface Regions and texture blending. It keeps the fixed 10 m Section system for physical terrain shape; surface appearance is authored independently in world space.

## v1.0.138 — Terrain Surface Regions

- Added persistent **Terrain Surface** data with a default surface followed by ordered A → B blend ranges.
- Added four starter surfaces so the system can be tested immediately:
  - Woodland Dirt — the existing terrain dirt texture.
  - Rocky Ground — prototype generated surface.
  - Pale Gravel — prototype generated surface.
  - Snow Ground — prototype generated surface.
- Surface records use stable IDs, so these prototype visuals can later be replaced or expanded without changing authored blend positions.
- Added a dedicated **Terrain Surface** track to World Lab beneath the Biome track.
- World Lab shows solid surface spans plus gradient blend blocks with draggable start/end keys. Blend positions are world-space metres and are not tied to 10 m Section boundaries.
- Surface transitions are normalised into world order and chained deterministically. Adding a transition earlier in the journey correctly rebuilds the later `from` surfaces rather than depending on creation order.
- World Lab supports default-surface choice, creation/deletion, target-surface choice, numeric blend range editing, draggable range keys, Undo, and complete project export/import.
- The game renderer now applies Surface Regions to Path, Near, Far A and Far B terrain. Outside a blend it samples one surface; inside a blend it samples only the two surfaces involved and mixes them across the authored world-space range.
- Legacy/manual river banks and puzzle-owned river banks also consume the active Surface Region blend where their geometry intersects one.
- Terrain Edit now includes a **Terrain Surface** panel showing the surface under the character and the active blend percentage/range.
- The same World Lab Surface Blend can be selected in Terrain Edit and fine-tuned numerically or by dragging the in-world **cyan START** and **coral END** handles.
- Terrain-side Surface edits participate in the existing Terrain **Undo / Redo / Save / Discard** session. One handle drag is one history transaction.
- The Surface selector avoids per-frame DOM reconstruction while the character moves; only the changing readout/values update continuously.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `world-lab.js`
- `world-lab.html`
- `world-lab.css`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Open **World Lab**. Confirm the new Terrain Surface track appears directly below Biome and the default surface is Woodland Dirt.
2. Add a blend such as **Woodland Dirt → Rocky Ground** from e.g. 50 m to 70 m. Confirm the track shows Woodland Dirt before 50 m, a gradient block from 50–70 m, then Rocky Ground afterward.
3. Add a second transition further along, then add another transition earlier than both. Confirm World Lab orders them by world position and the A → B chain remains logical rather than following creation order.
4. Drag the World Lab START/END keys. Confirm they move in metre increments, cannot cross/overlap neighbouring transitions, and are not snapped to Section boundaries. Test World Lab Undo.
5. Enter the game and walk through a blend. Confirm Path and depth strips visibly cross-fade between the two surfaces over the exact authored range without a hard Section-boundary switch.
6. Enter **Edit → Terrain** near the blend. Confirm Terrain Surface reports the current A → B blend and percentage, with cyan START and coral END handles visible in the world.
7. Drag either in-world handle across a Section boundary. Confirm the blend updates live. Undo/Redo should treat the whole drag as one step; Discard should restore the Terrain checkpoint; Save + reload should retain it.
8. Re-open World Lab and confirm the handle position changed in Terrain Edit is reflected on the Terrain Surface track. This verifies both tools are editing the same stored record.
9. If a surface blend crosses the Broken Bridge river or a manual River Section, confirm its bank terrain follows the ground surface blend while the water remains unchanged.
10. Regression-check Stage 1/2: Follow Player/manual lock, Path Height, Depth Detail Falloff, Flatten Depth Toward Path, terrain type/river, collision and visibility.

## Notes

The three new non-dirt surfaces are intentionally lightweight prototype textures generated in code for system validation. This drop establishes the authoring, persistence and rendering architecture; final production surface art can be introduced later without changing the Surface Region data model.

## Not device-tested here

Static/syntax, wiring, migration/snapshot and package-integrity checks are performed here. This environment blocks local browser-page loading, so the iPhone/Safari/PWA interaction, WebGL visual blend quality and touch dragging still need real-device verification.
