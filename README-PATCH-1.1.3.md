# SS-PATCH-1.1.3 — Atlas topology controls and regeneration

**Install on v1.1.2** (applied after v1.1.1 → v1.1.0 → v1.0.205). Flat changed-files-only ZIP; do not remove existing assets or clear iPhone website data. Cache `sidescroll-runtime-v113`. HTML Atlas JS/CSS URLs v1.1.3. Parts/Rig/Skin/Animate/Play behaviour and all game media remain untouched.

## User-visible changes

- All three generators now have **live mesh-layout preview**. Rectangle subdivision controls redraw while the drag-box is active. Outline and strip require `Preview topology` before `Commit mesh`. Inputs can be adjusted repeatedly before committing, without making unwanted Undo entries; drag the gold source-path control points during preview. `Cancel preview` discards the temporary shape; selecting another tool also cancels it. A preview is not a saved mesh.
- **Regenerate** any already authored rectangle, outline-spline or spline-strip from its saved generator parameters/controls, with a live preview and explicit `Apply changes`. Existing v1.1.2 saved generator metadata is compatible. Manually edited vertex/topology data triggers a reset warning because regeneration intentionally replaces it. The source mesh retains its ID/name, but its manually adjusted topology/vertices will be replaced if regeneration is approved.
- **Rectangle** Across and Down always count grid cells (e.g. 7 × 8 → 72 vertices and 112 triangles). Regenerate to increase/decrease subdivisions after creating.
- **Spline strip** has live width, taper, Across (cross-section width divisions), and Along (centreline subdivisions per segment). Preview and Regenerate allow changing either axis without deleting the existing mesh.
- **Outline spline** replaces centroid-split fan triangles with an editable target **Interior spacing px**, interior staggered points, and local quality-improving edge swaps. The new triangulation is a better starting topology but cannot automatically guarantee good results for every highly concave or tightly curved silhouette. Regenerate existing outlines to use the new algorithm.
- **Topology tools** work on selected, unlocked custom meshes only: `Connect verts` taps two opposite vertices across two adjacent triangles to change the internal diagonal; `Split face` taps inside a triangle to create three; `Trim face` taps inside a triangle to remove it (reclaims unused vertices). Each valid operation is one Undo step. This is not a free-form poly/knife or universal multi-triangle edge connection tool yet. All manual topology edits flag generator.edited and cause the reset warning on future regeneration.
- **Mesh/vertex hierarchy:** The Atlas `Edit selected mesh` group now has a top-level `Select / Move` mode (default), and a separate `Vertices` mode. Tap a mesh face to select (including protected read-only legacy meshes); drag a custom unlocked face to translate the whole mesh, preserving its triangulation and relative vertex locations. Duplicated meshes can now be moved independently. Whole-mesh moves update rectangle origins or saved spline control points, so future Regenerate opens at the moved position, and a single completed drag makes one Undo/Redo history entry. Atlas-source moves shift pixel-space vertices/UVs; they do **not** move an assembled character Part. Empty-space dragging pans, and moving is blocked on locked/legacy meshes. The move is constrained to the atlas image area.
- **Undo correction:** Atlas edits, especially completed vertex drags, now refresh the shared Undo/Redo button enabled state immediately through the Anim Lab session UI. One completed vertex drag = one undoable transaction. Canceled vertex drags revert. Existing global session Save/Discard remains authoritative.
- Dense-mesh vertex handles are reduced; source mesh display and independent atlas/character ownership remain unchanged.

## Storage and boundaries

No schema migration: same per-character `sidescroll.animlab.atlas-docs.v1` map, mesh `{vertices,triangles,generator}`, same pixel-space UV derivation. New outline generators store `fillSpacing` in pixels; old `fillDetail` entries are read via a mapped initial spacing on regeneration and replaced only after explicit Apply/Save. Changes remain local until Save, Undo/Redo/Discard. Reopening old v1.1.2 layouts preserves their currently saved triangles unless the user chooses to regenerate. Source Fox legacy geometry remains read-only. New source meshes do **not** yet create Parts regions, weights, or runtime rendering.

Imported PNG blobs remain IndexedDB-local, excluded from all existing JSON export/restore files. Github repository texture path selection, portable image backups and full cross-device authoring are still pending. Keep the original PNG. A local mesh JSON/snapshot is not an image backup.

## Tests / caution

- Node syntax check passed for changed JS/SW.
- Headless Chromium synthetic phone-size Atlas core/UI harness: Mesh select/duplicate/whole-piece move, no mutation of original mesh, Undo/Redo and generator position preservation were also exercised; imported transparent PNG, live rectangle subdivisions, explicit Commit/Undo/Redo, source rectangle Regenerate, drag vertex then Undo, face Split/Undo, face Trim/Undo, outline preview+interior density adjustment, strip Across/Along refinement, saved strip control-node regeneration, and no browser page errors. This was an **isolated harness**, not a complete game-loading or real iPhone Safari test.
- Validate actual touch hit testing, performance on dense outlines, Undo/Redo/Save/Discard, switching Atlas↔Parts and both built-in Fox and New01 locally before trusting this as an accepted device release.

## Changed files

`anim-lab-atlas.js`, `walk-lab.js`, `style.css`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.3.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
