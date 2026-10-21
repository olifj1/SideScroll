# SS-PATCH-1.1.11 — Spatial Skin envelopes + Animate performance

**Installation:** Overlay onto the current SideScroll v1.1.10 GitHub repo root. This is a *changed-files-only* patch, not a complete build. Prior patches through v1.1.10 must be present. README files in this ZIP describe **this drop only**.

## Skin controls

- **Bone strength** 0–100%: at **0% the selected bone receives exactly zero weight**; at 50% a vertex entirely within its full-influence region receives 50% of the motion, not 100% because of silent normalization.
- **Inner radius** (0–0.300 m) defines the end of the full-strength capsule around the selected rest-pose bone segment; **Outer radius** (0–0.500 m) defines the zero-influence boundary. Between them, a smooth cubic falloff makes gradual transitions. Outer is constrained to be no smaller than inner. The thin yellow/cyan outlines can be toggled via **Envelope**. The heatmap still paints over fully opaque source artwork.
- Multiple envelope influences sum; where overlap exceeds 100% they normalize against each other. Where the sum is below 100%, **the remainder is assigned to the undeformed rest pose**, deliberately allowing a bone at 0 to have no effect. This differs from traditional fully normalized skinning; widen another envelope for a fully moving limb, or use **Rigid bind** for 100% one-bone attachment. Readout reports actual min/max and average residual rest influence.
- **Auto-bind** selected/all now generates envelope-based initial weights. Reset Bone restores the selected envelope defaults. Reset Part restores all envelope defaults and removes manual overrides; Rigid Bind still assigns one bone to 100% of every vertex. After a whole-part Rigid Bind, moving a spatial slider returns to envelope weighting (undoable). Per-vertex manual edits override only their vertex. A zero per-vertex override does not leak into another bone.
- **Backwards compatibility:** v1.1.10 `boneProfiles` and normalized weights are **not** silently changed on open. First envelope-slider edit switches that part to new envelopes as one undoable Setup edit; Auto-bind also replaces the old distribution. Save/Discard and topology-signature checks remain intact. The schema stays `animlab.skin-binding.v1` with optional `envelopeMode:'capsule-v1'`, `envelopes:{boneIndex:{strength,inner,outer}}`; final `weights` continue to serve Animate/Play.

## Animate speed improvements

- Added `anim-lab-assembly-gpu.js` for WebGL 1 textured-triangle compositing during Animate/Quick Play. One GPU mesh draw per assembled part replaces hundreds of Canvas2D save/clip/transform/whole-image texture draws. When WebGL fails/is unavailable, automatically use Canvas2D.
- Canvas2D fallback now samples only each triangle's **small source-image rectangle** instead of sampling the whole atlas, reducing texture work and improving mobile fallback.
- A renderer-only read-only inspection path avoids cloning full character/setup JSON on every frame; throttled heavy UI/dirty checks and subscriber notifications while clips play (editing refreshes remain immediate). Clip phase uses actual frame elapsed time, with a capped 250-ms jump after long stalls rather than v1.1.10's 50-ms maximum.
- No game runtime integration or image-import/export changes in this patch.

## Checks performed

- Node syntax checks on modified JS, and independent mathematical tests for four front/rear limb groups: 100% centre, smoothly decreasing falloff, 50% selected strength causes 50% displacement in an isolated bone test, 0% causes no motion, all zero weights remain at rest.
- Headless Chromium end-to-end test: custom high-density 351-vertex / 624-triangle synthetic source Atlas, Auto-bind, change strength 0/50%, inspect actual weights, switch mode and redraw. No JavaScript exceptions. CPU fallback redraw benchmark with this synthetic mesh was roughly **15 ms (v1.1.10) vs 7–8 ms (v1.1.11)** when repeated in a six-instance, 624-triangle-per-instance fixture in this test environment; it is not an iPhone FPS guarantee.
- WebGL creation is unavailable in this container's headless Chromium, so GPU compositing has **not** been directly visually validated here. Software fallback works; GPU visuals and performance need real-device acceptance. Actual user's imported New01 Fox art/weights are not present in the test harness.

## iPhone acceptance

1. Open one problem leg in Skin and explicitly **Auto-bind part** to try the new envelope method. Enable Heatmap and Envelope. Move **Strength** through 0, 25, 50, 100 and verify gradual changes rather than on/off jumps. If using a saved v1.1.10 bind, the first slider edit also activates the new method; Undo should restore its old weights.
2. Try a narrow inner radius and wider outer radius around a joint. Ensure bone-weight colour gradients, smoothly bending movement and complete texture opacity. If the whole leg remains mostly static, inspect **Avg unassigned/rest** and extend another bone's outer envelope. Check Rigid Bind → slider edit → Undo → Reset Part.
3. Save, reload, and verify envelope settings and artwork persist. Test a manual vertex set to 0% and make sure it doesn't leak weight to a different bone. Recheck Undo/Redo/Discard.
4. Enter Animate and run the actual Walk/Run clips with the full multi-part fox at Fit and zoomed view. Observe frame responsiveness and art alignment on Safari. If still slow, measure approximately FPS and note whether WebGL is enabled. Compare preview vs actual saved binding, and confirm Quick Play still works.

**Boundaries:** This drop does not rebuild the skeleton/IK solver or include portable PNG art in JSON exports; the normal game renderer and Character Hierarchy/multi-atlas features remain future work.

**Changed/new files (15):** `anim-lab-assembly-skin.js`, `anim-lab-assembly-gpu.js` (new), `anim-lab-atlas.js`, `anim-lab-mesh.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.11.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
