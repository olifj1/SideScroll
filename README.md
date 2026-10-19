# SS-PATCH-1.0.194 — Skin/Weight Editor (P2b preview)

**Apply this ZIP directly over installed v1.0.193.** It contains only files changed for v1.0.194, plus this README and three updated canonical project documents. Do not apply rejected patches or clear Safari website data. User confirmed v1.0.193 currently works as expected; retain it as the rollback until this patch passes iPhone checks.

## What is new

In Anim Lab choose **Fox → Rig (top-level mode) → Skin (Setup tab)**. The three Setup tabs are now **Rig / Parts / Skin**.

Skin lets you select one of six existing Fox deform regions. For **Front/Rear Near/Far Leg** and **Tail**, adjust how much the top follows the torso (**Body / Root Influence**) and how far down the mesh that influence fades (**Blend Along Part**). Copy those adjustments to the corresponding near/far side or Reset Region. For **Body + Head**, select a mesh vertex with ◀/▶ or arm **Pick Vertex** and tap a dot in the viewport; choose one of its bones, adjust its weight and automatically normalise all the others. **Auto Vertex** restores automatic weighting for that vertex.

Use **Rest / Walk / Run** and **Phase** to compare deformation. The selected mesh is highlighted; other regions are dimmed. Skeleton lines hide when entering Skin and the previous View preference restores when leaving. View settings and preview are never saved. Changes are part of normal **Undo, Redo, Save and Discard**. Skin tuning persists in Fox character Setup and is also included in the single Fox handoff JSON.

**Scope:** This is an incremental **editor-only Skin tuning system** for the existing Fox six-region mesh. It does not yet edit mesh topology, create characters, or apply changes to the in-game/Quick Play renderer. Nothing replaces your existing Fox atlas, rig, motion clips or mesh topology. Entering the editor alone does not write data. Existing saved Setup without `skinTuning` uses its previous default skinning.

## Suggested iPhone test

1. Open **Fox → Rig → Skin**. Tap **Front Near Leg**, Walk preview at 25%, and vary Body / Root Influence between 0 and ~0.7; observe how the upper leg follows the body while the lower paw keeps moving with the leg chain. Repeat in Run and Reset Region.
2. Try **Copy To Matching Side**; choose Front Far Leg and check the same value is carried over. Undo/Redo; confirm both near and far values are restored as expected.
3. Choose **Body + Head**. Use Next/Previous Vertex and choose a bone; change **Selected Bone Weight**. Inspect coloured vertex dots and the local deformation. Tap **Auto Vertex**. Arm **Pick Vertex** and choose a dot. Without arming Pick, canvas touch should still pan/zoom as before.
4. Choose **Rest** then vary the weights: the neutral artwork should **not jump or change shape**. Switch back to Walk/Run. Save and refresh; verify tuning persisted, then try a new edit and Discard. Switch to Parts/Rig and ensure the prior skeleton, art and clips are intact.
5. Check the iPhone landscape controls and frame rate. If any regression occurs, revert only the **files from v1.0.193** that this patch changed, or restore your known good working copy.

## Files and constraints

Changed files: `README.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `walk-lab.js`, `anim-lab-stage2.js`, `anim-lab-mesh.js`, `anim-lab-rig.js`, `walk-lab.html`, `style.css`, `sw.js` (11 total). No media/artwork/atlas changes; no cumulative prior patch payloads.

Passed static JS checks and synthetic Chromium iPhone-layout/inlined-atlas interactions with mocked storage: Skin mode navigation, per-vertex/body bone control, root slider, near→far copy, Undo/Redo, Save, fixed Rest canvas pixels and different Walk canvas pixels at low vs high root weight, restoring Bones View on leaving. **Live Safari/device performance and real gameplay integration have not yet been tested**.

Remaining work and stage boundaries are recorded in `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md` and `SIDESCROLL_TASKS.md`.
