# SS-PATCH-1.1.16 — Stage 1: rectangular binary Skin regions

## Install

Upload the files from this ZIP over **SideScroll v1.1.15** in the flat GitHub repository. This is a changed-files-only patch, not a complete game. Reload Anim Lab and let the new service-worker cache `v126` take effect. Keep a copy of your existing saved character data before experimenting with new bindings.

## Scope of this drop

- **Skin — rectangular influence:** The current Atlas-assembly Skin editor now offers four independent per-bone controls: **Local X Scale**, **Local Y Scale**, **Local X Offset** and **Local Y Offset**. The box rotates with the selected **rest bone**; local X follows its A→B axis, local Y is perpendicular. X scale `1.0` spans one rest bone length; Y scale `1.0` spans a 0.12 m width. Offsets are in rest-local metres.
- **Simple binary weights:** Each vertex within an enabled bone rectangle is weighted **100%** to that bone; vertices outside it receive **0%** from that bone. Overlapping rectangles select the bone whose rectangle centre is closest in normalised local coordinates. No partial blend or falloff is generated. Vertices outside *all* rectangles receive no weight and remain at rest; this is displayed in the coverage count rather than silently reallocating the weight.
- **Rigid motion for binary weights:** Once assigned to one bone, vertices use the bone's rotation and translation **without scaling with small bone-length changes**. The pose calculation remains shared between Skin, Animate and Quick Play. The legacy capsule/weighted renderer path is unchanged.
- **Authoring preview:** The selected cyan rectangle with a small local-axis cross can be shown/hidden. The four controls update its geometry and weights live, then commit through Setup history. `Reset rectangle` restores that bone's defaults; `Reset part` restores all default rectangles. The heatmap, wireframe, rigid part-bind diagnostic and individual vertex controls remain available; the manual slider becomes hard 0%/100% in binary mode.
- **Existing bindings preserved:** Existing capsule or legacy bindings are **not silently converted**. Click **Use binary rectangles on this part** to opt in, or run **Auto-bind part/all** for fresh rectangular bindings. Setup Undo/Redo/Save/Discard applies. Character setup normalisation now round-trips `envelopeMode:'rect-binary-v1'` and per-bone `rectangles` fields under `animlab.skin-binding.v1`.

## Stage-1 limitation

A hard boundary between bones can create a crease, and a partially uncovered mesh can still stretch against vertices that remain in rest space. Use rectangles to encompass the relevant geometry, and use **Rigid Bind** to prove a full part follows one bone exactly. There are **no** softened edges, inner/outer falloff layers, or automatic blending in this version. Future blending should be evaluated only after binary controls pass real-device tests. No change to the normal game's runtime or portable texture export.

## Verification performed

- Node checks on the actual rig geometry for `frontNear`, `frontFar`, `rearNear`, `rearFar`, `body`, `tail`: fully covered vertices bound exclusively to a selected bone; moving the selected rectangle away removed influence; 100% weights preserved vertex-pair distances under posed bones (rigid rotation/translation).
- Overlap geometry test: rows contain either `[[bone, 1]]` or `[]`, never blended fractional entries.
- Chromium synthetic Atlas-assembly Skin test with mobile landscape viewport: create one sourced part, Auto-bind, store the optional rectangle schema through Core setup normalisation, change Local Y Scale and re-read the saved field; no JavaScript page errors. Synthetic imported atlas and bindings only; **not** a test on the user's real New01 PNG or iPhone Safari.

## iPhone acceptance check

In **Skin** select a newly assembled leg and **Auto-bind part** (or use the conversion button for an existing binding). Enable **Rectangle** and **Heatmap**. Pick a lower-leg bone and adjust its X/Y scale and local offsets. Confirm its rectangular coverage expands/moves and that selected vertices are 0% or 100%, with no unintended weights from nearby bones. Compare **Skin → Walk** with **Animate → Walk**. Verify the same mesh remains rigid if all its vertices are claimed by a single bone. If coverage reports unassigned vertices, expand the rectangle(s) before using an animated pose. Save only after you are happy with the result.

## Included files

`anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.16.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
