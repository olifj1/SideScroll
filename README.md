# SideScroll — SS-PATCH-1.1.13

**CPU animation performance patch.** Install directly over v1.1.12. This archive contains **only files changed in v1.1.13**, not a complete build.

- Replaces hundreds or thousands of redundant Canvas2D atlas draws with consecutive subpixel-compatible triangle batches. All original posed triangle boundaries are retained; the atlas sampling for a batched run differs by at most 0.18 canvas pixel at its vertices.
- Precomputes bone-to-bone affine transforms once per rendered pose, rather than recalculating them for every influence of every vertex; reuses stable bind geometries and source-mesh signatures.
- Keeps exactly one shared Canvas2D rendering path for Skin, Animate and Quick Play. **The experimental WebGL renderer remains disabled.** No change to envelope sliders, saved bone weights, rig, Atlas, Parts, or existing character data.
- Provides read-only renderer counters through `AnimLabAssemblySkinInspect.performance()` (triangles, draws, batched triangles, last paint time) for later diagnosis.
- Bumps the Anim Lab script version and service-worker cache to prevent mixed code.

**Synthetic browser test:** In headless Chromium with five mesh instances, each containing 800 triangles, 25 redraws at a fixed Walk pose averaged around 39 ms (v1.1.12) vs 11 ms (v1.1.13) with uniform weights, and 53 ms vs 13 ms with gradient weights. This is not a measurement on the user's iPhone or actual New01 character; heavily overlapping meshes, extreme zoom or different topology can behave differently.

**Acceptance test:** Open your saved New01 character, compare Skin's Walk preview to Animate Walk, then play the full clip. Check image stability, joints, and responsiveness. Do not rebind or regenerate meshes for this test. Compare to the original Fox separately; its six-region renderer is intrinsically cheaper than fully deformable custom Atlas meshes.

**Still open:** Safari/iPhone frame-rate measurement; fully device-validated GPU path; runtime-game integration and portable imported PNG data in exports.
