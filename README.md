# SideScroll — Patch v1.1.16

**Install this changed-files-only patch over v1.1.15.** Replace the files from `SS-PATCH-1.1.16.zip` in the flat GitHub repository and refresh the PWA after deployment.

This drop adds an **opt-in, bone-local rectangular Skin influence** for Atlas-assembled characters. Each rectangle has independent local X/Y scale and offset, and assigns vertices **100% to one bone or 0%**. Overlapping rectangles select just one bone; there is **no smoothing or blending** at this stage. A 100%-weighted vertex uses a rigid translation/rotation bone transform, without inherited bone-length scaling. The Skin viewport displays the selected rectangle and vertex-coverage count.

Existing saved capsule and manual bindings remain in place until **Use binary rectangles** or **Auto-bind** is selected. Changes use the existing Setup Undo/Redo/Save/Discard workflow. No Atlas, Parts, Rig or clip migration is performed.

**Important:** Vertices outside every rectangle remain in the rest position. If part of a mesh is uncovered, that region may stretch when animating; enlarge/move rectangles to cover it, or use Rigid Bind for a whole-piece test. Soft edges, secondary falloff rectangles and automatic coverage repair are **not** part of this release.

Verification: Node geometry checks for all four Fox limbs, body and tail, plus a synthetic Chromium Skin UI smoke test passed. The user's actual New01 atlas and iPhone Safari remain untested.

For detailed change notes and checks, see `README-PATCH-1.1.16.md`.
