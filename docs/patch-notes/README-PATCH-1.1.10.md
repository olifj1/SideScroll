# SS-PATCH-1.1.10 — Skin one-bone integrity, compact list and zoom

**Install directly over v1.1.9.** Overlay the files at repository root. Contains only files changed for v1.1.10. No earlier corrected documentation patch required.

## Fixed in this release

1. **Single-bone assignment was not truly single-bone.** The `boneProfiles` normalization had a remainder branch that, when every group bone had been explicitly profiled, sent residual weight to the first bone in the group — even if the artist had set that bone to 0. This distorted lower legs when the middle/shin bone was the only intended influence. The remainder now goes to a bone with positive requested weight, or chooses a well-defined safe fallback. Existing saved values are preserved; the corrected result is applied when weights are next rebuilt (use the slider, Reset Bone then reapply, or Auto-bind). No silent rewriting of stored characters.
2. **Explicit rigid binding.** After selecting the desired bone, press `Rigid bind: 100% selected bone (all vertices)`. This gives every vertex exactly one influence of 1.00 from that bone. Result survives Save and supports Undo/Redo. `Reset part to automatic weights` in Advanced restores the original automatic distribution. The status line now reports actual selected-bone minimum/maximum weight across the part. A Peak setting of 100% is a *maximum*, not automatically a full-mesh rigid bind.
3. **More useful Skin Parts list.** Each part is a single 46px-high row with ellipsized name, its Bound/Unbound status beneath the name *inside the selection button*, and Hide/Solo/Lock beside it; large lists still scroll. The full name remains accessible in the button title.
4. **Zoom limit.** Normal canvas pinch zoom can now reach 900% (previously 320%); lower limit is 35%. Fit still resets the view. No change to mesh UVs or saved character coordinates.

## Regression tests

- Verified v1.1.9's faulty rebuild with Front Near Forearm as sole intended bone: a vertex retained **36.09% unwanted upper-bone influence**. v1.1.10 assigns **100% Forearm** at every test vertex, likewise for both front and both rear lower segments.
- For all four limb groups, computed posed-vs-rest vertex pair distances with single-shin/forearm weights: maximum relative distance error was < `6e-16`, confirming a rigid single-bone transform rather than deformation/shear.
- Headless Chromium inline browser: original Fox → Skin custom assembly → auto-bind → select second bone → Rigid bind, observed 100% at all four vertices, no JavaScript exceptions; compact row measured 46px.
- `node --check` passed on changed scripts. **iPhone Safari has not been directly tested.**

## Device acceptance

1. Select a problem leg in **Skin** and choose the troublesome **middle/shin or forearm** bone. Use **Rigid bind** and enable Heatmap. The entire leg should display the maximum-weight colour and move as one intact piece in Walk/Run; it will pivot around that bone, which is expected. The 100–100% min/max readout verifies this.
2. Use **Reset part to automatic weights** if you need smooth bending rather than rigid motion. Rework Peak/Spread with Heatmap on, checking min/max readout. Other bones set to 0 must not unexpectedly retain influence after reapplying the edited sliders.
3. Inspect full list in Skin, pinch beyond 320%, use Fit, and confirm the artwork never goes semi-transparent.
4. Check Undo/Redo, Save, reload. Unchanged character setups should open normally.

**Limitations:** Rigid binding is for debugging or intentionally rigid parts; it does not create a smooth multi-joint deformation. Some auto-generated weights may require manual tuning. This drop does not implement runtime/game integration or portable atlas PNG exports.

**Files (12):** `anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.10.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
