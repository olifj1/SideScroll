# SS-PATCH-1.1.2 — Atlas Stage B

**Install on top of v1.1.1** (v1.1.1 on top of v1.1.0, all based on v1.0.205). Changed-files-only update, no atlas PNG/audio or game runtime replacement. Service-worker cache `sidescroll-runtime-v112`. `walk-lab.html` asset URLs updated to fetch v1.1.2 Atlas JS/CSS.

## Changes

- Source meshes list expands normally for up to 14 meshes, with no separate small scroll; more than 14 meshes can scroll in the list up to 520px. The outer inspector remains the phone scroll for ordinary six-mesh Fox.
- Reorganized Atlas controls into **Navigate** (Pan, Fit, zoom –/+), **Create mesh** (Rectangle, Outline spline, Spline strip), and **Edit selected mesh** (Vertices, Rename, Duplicate, Delete).
- Muted, semitransparent wireframes (0.58px unselected, 0.75px selected). Atlas-only **Wireframes: All meshes / Selected only / Off** setting; independently persisted as `sidescroll.animlab.atlas-wires.v1`; does not dirty authored data. Dark/Checker alpha preference unchanged.
- Reworded rectangular subdivision settings **Across (columns)** and **Down (rows)**. They specify *number of grid cells*, not number of points or atlas pixel dimensions: 2 Across × 2 Down = 9 vertex positions / 8 triangular faces.
- **Outline spline:** tap outline points on source atlas, choose curve interpolation and fill refinement, then Close outline. New polygon is checked for obvious self-intersections and triangulated. Keep drawing until accepted or Cancel drawing; source points and creator settings are stored in `generator`. Geometry vertices may be edited later (creator handles not yet directly re-editable).
- **Spline strip:** tap 2+ centreline points, choose width (px), Tip % (end vs start width), Across width cells, Along segments per path span, then Create strip. New geometry and generator settings are saved.
- Atlas-authored meshes can be **renamed, duplicated or deleted** with Undo/Redo; delete is confirmed. Existing legacy Fox regions are deliberately read-only (not convertible/renamable/deletable in this stage).

## Data/compatibility

`animlab.atlas-document.v1` and `sidescroll.animlab.atlas-docs.v1` are unchanged; new generator types `outline-spline` and `spline-strip` are optional backward-compatible mesh entries with pixel-space `{vertices,triangles}`. No changes to Parts/Rig/Skin/Animate, older saved Fox/New01 data, asset PNGs or game runtime. **Custom Atlas meshes still aren't wired into Parts/Skin/render**. Phone-imported PNG image blobs remain IndexedDB-local and are **not** in any JSON export/restore. A GitHub-uploaded PNG is not yet selectable by path. Do not clear device storage; keep original source images.

## Tests/acceptance

`node --check` passed on changed JS/SW; headless Chromium (844×390 touch-size synthetic shell) exercised read-only Fox regions, list CSS max-height, rectangle 2×2, outline mesh, strip mesh, name/duplicate/delete, Undo/Redo, Save and integrity of vertex/triangle indices with no browser exceptions. Safari/iPhone touch gestures, final layout and true game end-to-end acceptance remain **unverified**.

## Files changed

`anim-lab-atlas.js`, `style.css`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.2.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
