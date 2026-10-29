# SideScroll — v1.1.0 Atlas Stage A TEST PATCH

Install **over your working v1.0.205 repo only**. This ZIP contains **only the files changed by this patch**, flat at repository root. Copy/overwrite those files in GitHub Pages; preserve all other files (including existing atlases, characters, stored data and assets). The new `anim-lab-atlas.js` file must be added alongside `walk-lab.js`. The service worker cache ID advances to `sidescroll-runtime-v110` so the new script and styles refresh.

## Delivered

- Atlas is the leftmost stage in **Atlas → Parts → Rig → Skin → Animate → Play**, and New/Imported characters now open at Atlas. The existing Parts workspace is unchanged.
- Standalone 2D source-image view, pan/zoom/pinch, named list with temporary Hide/Solo/Lock, and actual *source atlas pixel-space* overlays for all six Fox legacy deform regions. Legacy mesh topology stays **read-only** and is never automatically migrated; the original approved `fox-deform-atlas-v2.png` is untouched.
- Draw a rectangle on the atlas, set Across/Down subdivisions, Apply with a name, edit source vertices by dragging in **Vertices** mode. Atlas position = UV sampling position, no separate UV tool. New source meshes are stored by character ID only when **Save** is pressed. Undo/Redo/Discard are integrated with the existing Edit Session.
- Import an alpha PNG (up to 16 MB / 8192 px each side). PNG bytes are stored *on this device* in IndexedDB; the new Atlas JSON holds a stable ID. Imported images are **Atlas-editor-only for now**, do not overwrite the source PNG or force rebind or mutate normal-game art.

## Not delivered / safety

The rectangle meshes are **not yet displayed/bound by Parts, Skin or game runtime**. Outline spline and spline strip, mesh renaming/duplication/deletion, legacy mesh conversion, weights, full character integration and second-device restore remain upcoming tasks. Image binary data **is not included in the existing single character, full Anim Lab, or global v205 JSON exports**. Keep original PNG files; don't clear this device's browser storage or attempt a destructive cross-device restore believing those images are backed up. The project snapshot the user supplied is a read-only diagnostic, not an image backup.

## Quick phone smoke test

1. Open Anim Lab → existing **Fox** → **Atlas**. Verify the unchanged 2048×1024 charcoal atlas with **six blue legacy mesh overlays**, select/solo an overlay, leave/reenter (no unsaved badge).
2. Choose **Rectangle**, drag over some empty atlas space, edit subdivisions, Apply/name it, select **Vertices** and move one point. Check Undo/Redo; use Discard then repeat and Save; reload to verify the saved source mesh.
3. New character → Atlas, optionally import an alpha PNG and Save; reload on this same iPhone to verify its atlas is still present. Leave **Parts** and gameplay art untouched. Keep original PNG for future portable-export implementation.
4. If offline PWA shows stale UI after GitHub upload, ensure service worker has fetched v1.1.0 (reload and reopen) before diagnosing feature problems.

## Source audit and automated checks

Audited `walk-lab.js` workspace/save boundaries, `anim-lab-ui.js` stage controls, `anim-lab-mesh.js` procedural Fox six-piece region generator and crop-to-texture coordinates, `anim-lab-art-layout.js` pre-existing character transform editor, `anim-lab-character-library.js`, `lab-data.js`, `sw.js`, and the four current canonical docs. The Fox renderer is procedural/cropped and not a generic user-editable mesh database; this patch adds *read-only source mapping*, rather than replacing it or silently rewriting bind weights.

Node syntax checks pass on changed JavaScript. Chromium **inline DOM harness** with the supplied 2026-10-20 v205 project snapshot and real bundled Fox atlas confirmed Fox/New01 both show six legacy overlays, opening Atlas does not mark them dirty, a rectangle supports Apply/Undo/Redo/Save, and the original Fox setup, character library and sparse clip strings remain identical. This is **not** an iPhone pass and does not certify imported-PNG persistence/export or downstream Parts/Skin parity.
