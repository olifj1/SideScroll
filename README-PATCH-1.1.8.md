# SS-PATCH-1.1.8 — Parts multi-selection and Atlas-to-Skin bridge

**Prerequisite:** a working v1.1.7 checkout. Extract these changed/new files into the repository root. Do not use as a standalone/full-build ZIP.

## Changes in this drop

1. **Parts selection:** Normal tapping shows one selected/active part. Multi-select toggle adds/removes marked parts. Select all marks the inventory. Clear and Delete selected keep confirmation/lock checks. Selected editing target and additional marked rows now have different highlights.
2. **Group operations:** Move and Scale (including the existing precision pad) modify all marked, unlocked parts in a **single undoable transaction**. Scale uses proportional per-part X/Y factors (no group-pivot/spacing adjustment); X/Y and Width/Height numeric fields support batch edits. Other inspector tools remain single-part only.
3. **Skin stage:** The original fixed-region Fox Skin no longer appears on top of a custom Atlas assembly. Skin lists real assembled meshes with per-part binding status, groups from the active Fox rig descriptor, Auto-bind selected/all, Unbind and one-vertex weight editing. Bind weights are stored per instance, not in the Atlas source. Changing source vertex geometry/topology invalidates that signature until intentional rebind.
4. **Rigged Art previews:** The same assembled atlas triangles/UVs and saved bone influences now draw in Skin, Animate and Quick Play. A local source PNG can render without the old fixed Fox sprite successfully loading. Legacy Fox Skin is unchanged when there is no assembly. This does not install a new character into normal gameplay or make exports portable.
5. **Storage:** Existing `artLayout.assembly.instances` adds optional `skinBinding:{schema:'animlab.skin-binding.v1',meshSignature,group,weights}`, where each vertex's weights are pairs `[boneIndex,weight]`. Data is validated by Setup normalization and included in its current Save/Discard/Undo, not a new localStorage key. The source mesh's vertex-order/coordinate/topology signature is verified on every use. Auto-bind is explicitly requested, not performed simply by opening Skin.
6. **Cache and docs:** New module in the Anim Lab page + service worker shell, stylesheet/query versions v1.1.8 and runtime cache v118. Main README.md/README.txt and this patch README cover **only this drop**, while the canon technical documents remain cumulative.

## Suggested device checks

- In Parts, tap A then B: only B should be highlighted as the active edit target. Enable Multi-select, tap A, set Scale, drag the thumb pad; both selected parts should scale proportionally and Undo should restore both.
- Enter Skin after assembling meshes. It should show the same parts, **not the six original Fox regions**. Use Auto-bind all, preview Walk/Run, select a bone group on one part, adjust one vertex weight, Undo and Redo, then Save.
- Move to Animate and Quick Play to verify the bound mesh uses your texture. Return to Skin and check the saved status. Edit the source topology in Atlas; Skin must say *Needs rebind* rather than silently transferring old weights.
- On the actual iPhone, verify that the source PNG loads after app restart, that saving works, and that play-preview performance is acceptable. Keep the original PNG separately (still not exported inside JSON).

## Checks performed and boundaries

Node syntax checks passed. Headless Chromium inlined all source scripts using the supplied v1.0.205 storage snapshot plus a synthetic two-source/two-instance assembly. It confirmed Skin replacement, automatic binding to body/tail descriptors, Saved Setup round trip, simultaneous group pad scaling, and triangle sampling from a decoded in-memory canvas standing in for an IndexedDB PNG. Network-loaded artwork/reference content is blocked in the test harness, so production URL loading and Safari touch testing remain unverified.

**Files included (14):** `anim-lab-art-layout.js`, `anim-lab-mesh.js`, `anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.8.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
