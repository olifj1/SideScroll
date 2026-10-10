# SideScroll patch 1.0.137

**Changed-files-only patch over v1.0.136.** This is Stage 2 of Terrain Edit: depth-detail control and progressive flattening. It does not begin the Surface Region/texture system or the general Terrain Feature work.

## v1.0.137 — Terrain Edit Stage 2

- Added one master **Depth Detail Falloff** slider inside Terrain -> Depth Layers.
- `100%` is deliberately the migration/default value and reproduces the exact pre-v1.0.137 Far A/Far B behaviour: Far A uses the existing one-section neighbourhood with 88% follow and Far B uses the wider two-section neighbourhood with 62% follow.
- Reducing the slider progressively blends those derived far-layer profiles back toward the authored Path profile. At `0%`, Linked depth strips retain the Path's rises/falls before their normal authored offsets. Near remains effectively unchanged because it already follows Path directly.
- Added **Flatten Depth Toward Path** for the currently selected Section with 25%, 50%, 75% and 100% actions. Each press moves Near, Far A and Far B from their current resolved heights toward the selected Section's Path height.
- Flattening preserves each strip's current **Linked / Explicit** mode. Linked strips receive a new offset key at the selected Section; Explicit strips receive a new explicit-height key there, matching the existing inherited depth-layer authoring model.
- Falloff and flattening preserve terrain-bound object floor offsets while the underlying terrain updates.
- One falloff slider gesture and one flatten press are each one shared **Undo / Redo** transaction and both participate in Terrain **Save / Discard**.
- `depthDetailFalloff` is persisted with terrain state and included in Terrain edit snapshots. Existing saves without the field migrate to `100%`, so the old look is retained until deliberately changed.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Open Terrain -> Depth Layers and first leave **Depth Detail Falloff at 100%**. Compare a section with noticeable Path height variation against v1.0.136; the far terrain should look unchanged.
2. Drag Falloff from 100% toward 0%. Confirm Far A/Far B increasingly retain the Path rises/falls instead of becoming progressively simplified with depth. Undo once and confirm the whole slider gesture reverses as one action; Redo should restore it.
3. On a section where the depth strips differ from Path, press **25%** and confirm all three strips move part-way toward Path. Undo it. Repeat 50%, 75% and 100%; 100% should make the selected Section's three resolved strip heights equal Path.
4. Repeat flattening with a mixture of **Linked** and **Explicit** strips. Confirm their mode labels do not change after flattening.
5. Place/inspect terrain-bound dressing on affected ground and verify it remains seated rather than floating or sinking when Falloff/Flatten updates terrain.
6. Change Falloff and/or flatten a section, then test Undo/Redo, Discard, Save, reload and re-enter Terrain Edit. Confirm the saved values survive and Discard returns to the last Terrain checkpoint.
7. Regression-check Stage 1 Follow Player/manual lock, Path Height, river/type, collision and visibility controls.

## Not device-tested here

The patch has static/syntax validation only. The iPhone/Safari/PWA interaction and visual checks above still need real-device verification.
