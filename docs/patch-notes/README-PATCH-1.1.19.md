# SS-PATCH-1.1.19 — Joint-authored binary influence regions

## Install

Apply **this changed-files-only ZIP over v1.1.18** in the flat SideScroll GitHub Pages repository. Replace only the included files. The service-worker cache is `sidescroll-runtime-v129`; reload Anim Lab after deployment.

## What changed *in this drop*

- **Skin → Edit selected part → Joint boundaries → Use joint boundaries on this part** introduces an **optional** per-part influence representation. The existing bone rectangles / v1.1.18 Joint Fit continue to work and remain unchanged until explicitly converted.
- Choose a rig joint (e.g. Elbow, Wrist or Hock), not a bone. Each joint **owns exactly one line** in the character's REST skeleton. Four rest-local controls are available: **line Width**, **Mitre rotation** relative to the automatic rest angle, **Local X offset** (along the averaged bone directions) and **Local Y offset** (perpendicular). Endpoint joints use their one incident bone direction; internal joints use the bisector of the incoming/outgoing bone directions.
- **Bone polygons are derived between joint lines**: thigh = socket→knee; shin = knee→hock, etc. Both adjacent regions use precisely the same joint-line endpoints, preventing independent end-cap gaps/overlaps in rest space. This works for the Fox body, all four three-bone legs, and tail chains. Branched/fully reversed/invalid chains are not silently assigned incorrect regions.
- Remains **strictly binary**: vertex in a region = exactly one bone weight 1.0; outside all regions = `[]` (rest/unassigned). No blend, softened weights, extra falloff shape, topology changes or added rig nodes. Rest-space weights recompute **only on a deliberate authoring change**, not while evaluating a posed frame.
- The selected bone's polygon outline and active joint line display in the Skin viewport. During Walk/Run, outlines move with their owning bone using rigid mapping; shared rest boundaries may visibly separate under a bent pose because this drop does **not** blend deformation.
- Invalid edits (inverted, crossing, degenerate or overextended regions) are refused, preserving the last valid shape. The four controls live-preview and commit through existing Setup Save/Discard/Undo/Redo. **Reset selected joint** restores its default joint line.
- Joint mode is stored in the existing `animlab.skin-binding.v1` data as `envelopeMode:'joint-boundaries-v1'` and `jointBoundaries:{ jointId: {width,rotation,offsetX,offsetY} }`; the authoritative final `weights`/`baseWeights` arrays are retained and normalized. The original rectangle settings remain in the binding so **Return to previous bone rectangles** can recover them without auto-migrating other parts.

## Intentionally NOT changed

No softness or blend distance yet — that is the **next independent stage after this binary construction is accepted**. No change to IK, rig animation, legacy Fox artwork, atlas mesh vertices/UVs, the Canvas2D renderer, Draw/Playback performance, normal-game runtime, or imported PNG packaging. Imported user artwork remains outside JSON-only character export (IndexedDB).

## Verification and acceptance

- Node syntax checks passed for both changed JS files.
- Headless Chromium mathematical checks passed for all six Fox joint chains (body, front near/far, rear near/far, tail): valid polygons, shared joint lines, 100% single-bone ownership at bone midpoints, and offset/rotation/width changes without invalid polygons.
- Synthetic mobile-size browser test: Auto-bind a new assembled leg → convert to joint boundaries → select an Elbow joint → adjust its rotation → persist Setup transaction → render posed Walk in Skin. No browser page errors. **Not verified on the user's imported New01 PNG or real iPhone Safari.**

**Try on iPhone:** Select the assembled leg part in Skin, choose **Use joint boundaries**, then edit **Elbow**. Adjust Width, Angle and X/Y offsets one at a time in Rest, switch to Walk, and return. Select thigh and shin consecutively: the cap should be identical in Rest. If the shape folds over on an extreme setting, its last valid position should remain. Check covered/unassigned vertex count and preserve your original binding with Undo if needed.

## Included files (this release only)

`anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.19.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
