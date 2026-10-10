# SideScroll patch 1.0.136

**Changed-files-only patch over v1.0.135.** This is Stage 1 of the new Terrain Edit feature. It deliberately restructures the Sections authoring workflow without rewriting the proven terrain generation algorithms.

## v1.0.136 — Terrain Edit foundation

- Terrain/Sections is now a first-class **Terrain** scope inside the shared Edit drawer instead of a separate floating settings panel.
- Tools -> **Terrain** enters the Terrain Edit context directly.
- **Follow Player** is the default selection mode: as the character walks across the world, the active 10 m Section follows the Section occupied by the character.
- Previous/next Section navigation remains available. Using it switches Follow Player off so the chosen Section stays locked; **Player** returns to automatic following.
- Horizontal character movement remains available while Terrain Edit is active, allowing the intended edit-as-you-walk workflow. Environment objects, Puzzles and Groups remain protected/non-pickable in this context.
- Terrain authoring now uses the shared **Undo / Redo / Save / Discard** session model. Save establishes a new Terrain checkpoint without leaving Terrain Edit; Done Editing exits once there are no unsaved terrain changes.
- Path height, depth-strip mode/height, section type, terrain collision and terrain visibility changes are routed through shared history. Continuous strip slider movement is grouped into one Undo action per gesture.
- Switching out of Terrain Edit or opening another specialist tool cannot silently abandon dirty terrain changes. Procedural-placement rebuilds are also blocked until Terrain changes are saved or discarded.
- Existing section height/layer/type/river/collision algorithms are retained in Stage 1. The feature plan explicitly defers depth-detail falloff controls, depth flattening, Surface Regions/texture blending and general Terrain Features to later stages.

## Terrain architecture recorded for later stages

- **Base Sections** remain fixed world-space structural ground units.
- Existing far-depth "smoothing" is defined correctly as **depth detail falloff across near/mid/far strips**, not smoothing between Section boundaries; Stage 2 will expose control over its strength.
- **Terrain Surface Regions** will be continuous world-space ranges parallel to the Biome Region/Transition workflow, authored broadly in World Lab and fine-tuned with the same handles in Terrain Edit. Texture blends will not be tied to Section boundaries.
- **Terrain Features** will generalise local terrain modifiers such as rivers. The Broken Bridge already uses the correct ownership direction through its puzzle-owned `worldModifier`, so that mechanism will be generalised rather than replaced.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Open Tools -> Terrain. Confirm the shared Terrain Edit drawer appears and the old standalone Sections popup does not.
2. With Follow Player ON, walk through several Section boundaries. Confirm **PLAYER IS IN** and **EDITING** advance together automatically.
3. Tap previous/next. Confirm Follow Player turns OFF and the selected Section remains fixed while you walk. Tap **Player** and confirm automatic following resumes.
4. Change Path Height and each depth-strip control. Confirm Undo/Redo treats one adjustment/slider gesture as one action.
5. Make a recognisable terrain change, press Discard and confirm the last entry/save checkpoint is restored. Make another change, Save it, make a third change, then Discard and confirm it returns to the newly saved checkpoint.
6. While terrain is dirty, try Done Editing or Camera. Confirm Terrain Edit remains open and asks for Save/Discard rather than silently losing the change.
7. Confirm environment assets/Puzzles/Groups cannot be accidentally selected or moved while Terrain Edit is active.
8. Regression-check existing section type, legacy river width, collision and visibility controls against v1.0.135 behaviour.

## Not device-tested here

The patch has static/syntax validation only. The iPhone/Safari/PWA interaction checks above still need real-device verification.
