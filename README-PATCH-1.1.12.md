# SS-PATCH-1.1.12 — Skin/Animate render parity hotfix

**Install over v1.1.11.** Changed-files-only; previous 1.1.x code must already be installed. This does not require reverting any existing files or resetting character data.

## Change

Skin pose preview has continued to appear coherent on the user's device, but all Animate poses use badly broken artwork. The significant rendering-only difference introduced in v1.1.11 was a GPU/WebGL compositing branch in Animate and Quick Play, while Skin stayed on Canvas2D. WebGL compositing was not testable in our headless browser. To isolate this safely, this drop:

- Removes the WebGL script tag, excludes its file from the service-worker shell and unconditionally draws the same per-triangle Canvas2D path in **Skin, Animate and Quick Play**.
- Preserves cropped-source-rectangle triangle rasterisation, lightweight read-only renderer state, reduced animation UI refresh, and elapsed-time clip timing from v1.1.11.
- Preserves **all** skin binding data, capsule envelope sliders, artist-authored weights and character setup. No migration, Auto Bind, rest pose adjustment or destructive cleanup runs.
- Bumps the worker cache to `sidescroll-runtime-v122` and the skin renderer's script URL to `v=1.1.12` to prevent mixed versions.

The previous `anim-lab-assembly-gpu.js` may remain on GitHub after overlaying: it is inert because it is no longer loaded. It is not included in this changed-files-only ZIP. Do not manually delete user files to apply the hotfix.

## Test in the actual character

1. Keep New01 and its saved rig/skin data as-is. Hard-refresh or restart the iPhone PWA after uploading the patch.
2. In **Skin**, choose Walk preview and note the overall artwork and leg joints at one phase.
3. In **Animate**, select Walk and look at several key frames including the previously corrupted Frame 5. Do not rebind parts or move weighting sliders for this comparison.
4. If the gross deformation is gone, compare matching phases and check playback responsiveness plus Quick Play. If the distortion persists, stop: the next investigation is the calculated vertex positions/pose differences, not the texture compositor; v1.1.12 does not prove the GPU was at fault.

## Verification/limitations

- JS syntax and patch-diff checks passed.
- In a synthetic Chromium atlas mesh, the same source image, mesh, and stored binding rendered in both Skin and Animate without browser exceptions; the GPU module was not loaded. Synthetic artwork cannot replace a test on the actual iPhone/New01 atlas.
- WebGL visual output remains untested in this environment; therefore it is deliberately disabled. Performance on Safari may be slower than a working GPU compositor but retains v1.1.11's cropped Canvas2D and UI optimisations.
- This hotfix does not implement normal-game rendering or portable PNG export.

**Files (9):** `anim-lab-assembly-skin.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.12.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
