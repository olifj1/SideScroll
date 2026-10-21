# SS-PATCH-1.1.5 — Simplified Parts inventory

**Install:** Unzip the changed/new files directly over v1.1.4. Retain your existing assets, Atlas source docs, PNGs, and browser storage. No separately corrected 1.1.3 README patch is necessary. Refresh GitHub Pages/PWA after publishing; the service worker cache is `sidescroll-runtime-v115`.

## This release only

- Removed the separate Atlas assembly switch, oversized inventory panel, secondary transformation pad, rig-joint suggestion and snap controls from Parts. **There is one visible Parts inventory**, and it uses the usual native Parts transform/numeric/layer/clipboard/thumb-pad tools.
- Add opens a touch-friendly multi-select modal listing the **current character's saved Atlas source meshes**. Tick one, several or all, then press Create. A source can be instantiated more than once. Missing sources are visibly flagged rather than accidentally showing another mesh.
- Tap part buttons to mark multiple for deletion and set the most recently tapped part as the transform target. Delete selected and Clear all affect *assembled instances only*; Clear all confirms. Select all toggles the current selection. Changes are undoable via existing Setup history and require the usual Save.
- On the first structural edit of an older character with no new inventory, its existing built-in pieces are converted to inventory entries, so specific pieces or all pieces can be removed. Previously saved v1.1.4 Atlas instances are reused if present. The old original/new toggle is no longer necessary.
- Assembled part labels follow the source mesh's stable `meshId` and current name. Duplicating via Add creates a separate transform instance, not a renamed source or a mysterious `copy` label. The existing Atlas Duplicate tool still deliberately creates a separate source mesh named `… copy` until you rename that source.
- The assembly preview respects standard Parts visibility and solo display settings and supports pivot transforms. No rig-joint intent UI is presented; source and instance data are not silently rebound to bones.

## Verify on device

Open Parts on the Fox and check the existing six entries. Mark some or Select all, Delete selected, Undo, then Clear all with confirmation. Open Add, tick several saved source meshes and Create. Change X/Y and drag the usual Parts pad; check layer order, Hide/Solo, Undo/Redo, Save/Discard and transition Parts → Rig → Parts. Rename a source in Atlas and Save, return to Parts and verify the correct label follows without changing source identity. Check existing v1.1.4 assemblies retain their source links and placement.

**Automated checks:** Node syntax checks and inline-resource Chromium UI tests covered initial six, select-all/delete/Undo, the add-source dialog and multi-create, numeric transform/Undo, Save and Atlas rename propagation. Browser harness had no page errors; actual hosted and iPhone Safari acceptance remain outstanding.

**Limitations:** the rendered Atlas assembly is still rigid Parts/Rig preview, not dynamic Skin weights, Animate, Play or game selection. Imported PNG blobs remain in IndexedDB and are not covered by JSON exports/global backups. There is no multi-page or shared atlas UI yet.

**Files in this patch (14):** `anim-lab-art-layout.js`, `anim-lab-assembly.js`, `anim-lab-atlas.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.5.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
