# SS-PATCH-1.1.17 — Skin rectangle follows pose

## Install

Upload the changed files from this ZIP into the flat SideScroll GitHub repository **over v1.1.16**. The new service-worker cache is `sidescroll-runtime-v127`; reload/reopen the PWA to activate it. This is not a cumulative patch or a full game build.

## Bug and fix

With `rect-binary-v1` active and **Rectangle: On** in Skin, changing the pose preview to Walk or Run moved the rig and skinned vertices but left the cyan rectangle and local X/Y axis guides behind in the rest pose. The preview incorrectly implied that the influence box had lost its bone-local relationship.

The rectangle's corners, centre and local-axis guides now use the **same rest-to-pose rigid translation/rotation** as the assigned vertices on the selected bone. The authored local offsets remain relative to that bone: translation, rotation and offsets are preserved while rectangle width and height do not stretch if posed segment length varies.

**Deliberate separation:** Binary influence is calculated from rest/bind-pose vertex locations and authored rectangles. Switching poses only changes the *visual placement of the guide*. It does **not** recompute ownership from posed vertices, modify any weight, edit the stored rectangle, alter a pose, or perform an implicit Save. Rest preview still shows the original rest-space rectangle.

## Not in this drop

No changes to bone IK, rectangular influence overlap ownership, 0/100 weighting, blending, falloff, animation renderer, runtime, portably exporting imported PNGs, character data schemas or saved part/rig/skin/animation data.

## Verification

- Browser scripts parsed and Anim Lab loaded without page JavaScript errors in the available synthetic Chromium harness.
- Evaluated four Fox upper-leg bone rectangles with nonzero local X/Y offsets and non-uniform scale under an altered pose; each transformed corner coincided with the same `mapBoneRigid` movement used by rect-bound vertices (maximum floating-point error < 1e-15 m), and preview box widths/heights did not change.
- Rest-to-rest guide mapping leaves the rectangle unchanged.
- The real New01 atlas, bind settings and actual iPhone Safari visual experience were **not** directly exercised.

## Device acceptance

Open an Atlas-assembled character → **Skin** → select a leg bone → enable **Rectangle**. Set a visible nonzero Local X Offset and Y Offset. Toggle Rest and Walk/Run preview while moving between poses. The box and its axis cross should now translate and rotate with the selected segment, maintaining its relative offset. Return to Rest to confirm the original layout is unchanged; verify there are no newly unsaved changes merely from previewing.

## Included files

`anim-lab-assembly-skin.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.17.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
