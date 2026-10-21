# SideScroll — SS-PATCH-1.1.12

**Renderer-parity hotfix for Anim Lab.** Install over v1.1.11. This ZIP includes only files changed in v1.1.12, not a full build.

- Disables the **untested WebGL compositor** that was introduced for Animate and Quick Play in v1.1.11. Skin, Animate and Quick Play now draw source-textured triangles through the *same* Canvas2D renderer. The WebGL file already installed by v1.1.11 remains on disk but is not loaded or pre-cached.
- Retains v1.1.11 capsule-envelope weights, vertex bindings, per-part transforms, previews, and performance improvements unrelated to GPU drawing. This hotfix does not rewrite saved data or reset binding values.
- Keeps the cropped-source Canvas2D triangle drawing optimisation. Playback FPS on iPhone remains to be measured; correct geometry has priority over speculative GPU speed-ups.
- Updates the service-worker cache name and the script query version to avoid mixing old and new rendering code.

**Why:** User observation: changing poses in Skin gives a reasonable character, while every Animate pose is badly distorted. This isolates a strong **render-path suspicion**, not a confirmed root cause. Our headless browser cannot initialise WebGL, so it could not reproduce the iPhone GPU failure. The safe response is to remove the divergent renderer and recheck the same saved character without adjusting weights.

**Test:** Open New01 → Skin and preview Walk → Animate Walk. If Animate now matches Skin (except for differences in frame/phase), the GPU renderer was responsible. If it remains broken, preserve your saved data and compare pose/geometry evaluation next. Also check Walk playback speed and Quick Play.

**Checks:** JavaScript syntax checks passed. A headless Chromium synthetic atlas-mesh test navigated Skin → Animate with the WebGL module absent, displayed textured triangles in both and had no page exceptions. This does **not** validate the actual imported Fox on iPhone.

Changed files are: `anim-lab-assembly-skin.js`, `walk-lab.html`, `sw.js`, the three current-drop READMEs, and the three cumulative design/UX/task documents. Existing PNGs and rig/skin data are unchanged.
