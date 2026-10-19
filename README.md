# SS-PATCH-1.0.196 — Anim Lab P3b: Skin Workflow & Editor Responsiveness

**Install directly over working v1.0.195.** ZIP contains changed files only; keep v1.0.195 as your approved rollback. Do not clear Safari storage or reapply unrelated experimental ZIPs.

## Changed

1. **Skin main workflow**: choose one of the current six Fox mesh regions, then a bone within it. Edit Bone Influence (5–300%) and Influence Spread/Falloff (0.5–2.5×). One selected-bone heatmap uses blue → cyan → green → yellow → orange → red (0→100%), clipped to the region artwork's real alpha. The corresponding bone is highlighted and the *full rig matches the selected Rest/Walk/Run preview pose and phase*. For chain regions, explicit per-bone edits enable a weighted deformation blend; their unchanged binding retains the v195 chain behavior.
2. **Fine editing**: per-vertex controls now live in an optional Advanced details panel and can target the current selected bone. The existing root-to-body attachment controls for legs/tail are retained. Reset Bone restores only the selected per-bone profile; Auto Vertex and Reset Region are independent undoable edits. Copy near/far includes tuned bone profiles. Save/Undo/Redo/Discard, Fox single-file export and normalised stored character Setup now preserve `skinTuning.regions[regionId].boneProfiles[index] = {gain,spread}`. Old saves without this field keep their original weights.
3. **Parts responsiveness**: neutral artwork in Parts and non-preview Rig draws once per source region rather than repeatedly warping its texture over all triangles. Pad pointer samples coalesce to one per animation frame and the last drag sample is flushed before transaction commit. In a Chromium inline desktop smoke test, repeated neutral Parts draws averaged roughly 10.9 ms (v195) vs 3.8 ms (v196); this is not an iPhone benchmark.
4. **Legible rig overlay**: thinner bone strokes and smaller joint circles in Rig, Animate and Skin previews; selected joints/bones remain highlighted.
5. **Orientation**: canvas backing pixels are sized from actual rendered bounds. ResizeObserver and iOS visualViewport/orientation follow-up passes recover canvas size, recompute projection, preserve the centre-framed world position and clear transient gesture snapshots. Refit should no longer be necessary after portrait → landscape.

## iPhone acceptance path

- In **Parts**, drag a body/leg/tail part with the right pad: check lag, artwork continuity, and Undo / Save / Discard.
- In **Rig**, verify fine bone/joint overlays are readable over the fox and artwork stays anchored while moving joints.
- In **Skin**, select Body + Head, then different bones. Check alpha-clipped heatmap and visible selected bone. Move the Influence and Falloff sliders; try Walk/Run at different phases and confirm rig moves with skin. Select Near Front Leg, change its second bone, compare before/after, reset and Undo. Expand Advanced to try single-vertex editing.
- Rotate portrait then landscape while zoomed/panned; verify the viewport doesn't squash or lose the character and pinch/pan still work.
- Save changes, refresh Safari, verify selected region bone strength/falloff persists. If testing changes, use Undo/Discard to avoid altering a preferred Fox binding.

## Scope and limitations

- Existing Fox artwork PNGs, UV/mesh topology, clip keys, rig data and game renderer **are not changed**. This is still an editor-only tuning stage; Quick Play and actual gameplay do **not** yet use new skin tuning.
- Region selection currently represents the six existing Fox deform mesh regions (Body + Head, Tail, four complete legs), *not* arbitrary newly created art parts. Full descriptor-driven generic regions/weights, add/remove parts, and runtime skin consumption are future milestones.
- Node syntax and headless Chromium tests passed: Fox Skin region/bone selection, heatmap, edit/Save, initial/rest vs run pose, before/after tuned render, portrait-to-landscape redraw and zero browser errors. Native iPhone Safari/persistent PWA cache remains unverified until user's QA.

## Files

`README.md`, `walk-lab.js`, `anim-lab-art-layout.js`, `anim-lab-mesh.js`, `anim-lab-rig.js`, `anim-lab-stage2.js`, `walk-lab.html`, `style.css`, `sw.js`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
