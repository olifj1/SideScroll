# SS-PATCH-1.1.18 — Optional joint-fit binary bone shapes

## Install

Apply this **changed-files-only** ZIP over SideScroll **v1.1.17**. Replace listed files in the flat GitHub repository. Reload Anim Lab after publishing to activate service-worker cache `sidescroll-runtime-v128`. Do not treat this ZIP as a full game build.

## What changed in this drop

- **Skin → Bone influence → Joint Fit: Off / On** for Atlas-assembled characters using rectangular binary skinning. Off is the default for existing bindings. Enabling changes only the selected part and is one undoable Setup edit.
- For each ordinary two-bone rest joint, calculate a *single shared mitred cap* from the angle bisector of its consecutive bone directions. Both polygons reuse the exact same two cap endpoints. Their side edges taper to meet at the seam without independent rectangular end overlaps/gaps.
- The joint cap uses a shared width derived from adjacent bone Y scales. Unconnected free ends retain the usual rectangle shape and local offsets. X scale/offset cannot independently shift a connected cap away from its joint while Joint Fit is on. Very sharp U-turns and extreme invalid user offsets fall back to safe unfitted rectangles rather than corrupting the shape.
- Recompute rest-pose vertex ownership **only when explicitly toggling or editing a shape**, never while previewing an animation. Test both Rest and Walk/Run: guide polygons follow their own bones using the same rigid rest-to-pose rotation/translation as assigned vertices.
- Preserve full binary semantics: at most one bone per vertex at 100%; uncovered vertices remain unbound. This is **not** feathering, a deform-smoothing fix, or the proposed future secondary falloff shape.
- Save the optional `jointFit:true` in the existing `animlab.skin-binding.v1` document alongside `rect-binary-v1` / `rectangles`; it roundtrips through existing Setup Save, Discard, Undo and Redo.

## What's intentionally not in this drop

No edits to rig IK, bone pose maths, shared mesh source, Atlas layout, animation rendering/performance, normal game runtime, or imported PNG portability. Legacy Fox's original Skin remains untouched. No blend, falloff, joint weight smoothing, automatic migration of old saved bindings, additional atlas pages, or hierarchy tooling.

**A limit of rigid binary skinning:** In a posed bend, the two formerly shared rest-space cap edges can separate visually when each is transformed by its own bone. The ownership is still based on a watertight **rest-pose** shell. A soft joint transition would be a different future stage. The guides must show the actual rigidly moved influence region; they must never dynamically repick weights from the posed knee angle.

## Verification and iPhone acceptance

- Node syntax checks passed.
- Synthetic Chromium geometry tests: six Fox bone chains (body, all four legs, tail) show identical shared seam vertices, valid bone-midpoint coverage and strictly single-bone 100% assignments with toggle on and off. Unequal bone Y widths and a local offset also tested.
- Synthetic touch-viewport browser: Auto-bind part → Joint Fit On → Rest/Walk → Off persisted as explicit Setup edit, with no page exceptions.
- Real imported New01 PNG, Safari performance and visual behaviour on the user's iPhone were **not** directly tested.

**On device:** Open your Atlas-assembled New01 → Skin → select a leg → Auto-bind it to the leg group if needed. Enable **Joint Fit**. Look at Rest pose with Rectangle On and select adjacent thigh/shin bones in turn. Their mitred edges should join without the previous acute overlap / outside gap. Adjust Local Y Scale and verify the two caps still meet. Switch to Walk and back; geometry should rigidly follow assigned bones without changing vertex ownership. Turn Joint Fit Off and Undo/Redo to compare with old boxes. Save only if the result is useful.

## Changed or new files

`anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.18.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
