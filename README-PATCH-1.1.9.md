# SS-PATCH-1.1.9 — Skin editor controls and artwork opacity

**Install over:** v1.1.8 (changed-files-only overlay on repository root, not a full game build). This release note describes only v1.1.9.

## Changed this drop

- **Unified Skin interface:** One assembled-parts list with Select, Hide, Solo and Lock; contained Edit selected part with bone group and per-bone controls; Rest/Walk/Run preview. Advanced has individual vertex selection/editing, reset and copy-to-compatible-part. Hide/Solo/Lock are local to Skin, not saved Parts changes.
- **Restored automatic/manual controls:** Bone Peak (0–100%), Influence Spread/Falloff (0.5–2.5×), selected bone heatmap and legend, measured automatic/actual peak, Reset Bone, Reset Part, Auto Vertex, Pick Vertex in the viewport, and manually assigned individual vertex weight. Spread works on an untouched peak. Slider movement previews live; change commits a single Setup Undo/Redo transaction.
- **Opaque mesh rendering:** Previously v1.1.8 drew nonselected source triangles at `globalAlpha=0.18`. All source texture triangles now draw at full normal alpha, regardless of selection. Heatmap is **Off by default**; when enabled it is a separate diagnostic overlay, not mesh transparency. Selected wireframe is optional and thin.
- **Saving / backward compatibility:** Existing `animlab.skin-binding.v1` keeps its final `weights` array and source signature. Optional `baseWeights`, `boneProfiles`, `manualWeights` now round-trip through the existing Setup normaliser; old bindings remain readable without an automatic migration. Original six-region Fox Skin remains active when an assembly is absent.
- **Caching/docs:** Anim Lab script/CSS versions and offline service-worker cache updated; project root READMEs cover this release only and canonical character, UX, task and export docs remain cumulative.

## Suggested device checks

1. Enter Skin on a character with saved Atlas → Parts meshes. Verify all source artwork is **fully opaque** even when only one part is selected. Switch Hide/Solo on/off and verify they do not permanently modify Parts.
2. Auto-bind a part, select a bone, move Peak 0% → 100%, adjust Spread and toggle heatmap. Select the viewport Pick Vertex mode and tap a point; edit just that vertex weight. Test Reset Bone and Auto Vertex.
3. Check Undo/Redo, Save/Discard and reload (including an existing v1.1.8 bound part); preview Rest, Walk and Run, then Animate and Quick Play. Test original Fox without a custom assembly.

**Automated checks:** Node syntax checks and an inline Chromium test using two synthetic Atlas-textured instances passed: actual texture draws at alpha 1, auto-bind both, Peak 80% with correct measured peak, Spread 2×, heatmap toggle, per-vertex overrides/reset, Run/Walk preview and alternate part selection. The real iPhone/Safari workflow and external PNG load are not yet device tested.

**Limitations unchanged:** normal game runtime does not yet consume assembled art; local imported PNG bytes live in IndexedDB and are not in portable JSON exports; Character Hierarchy, reusable linked atlases, non-Fox rig families and high-density iPhone performance validation remain future stages.

**Changed/new files in this ZIP (12):** `anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.9.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
