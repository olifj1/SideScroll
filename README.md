# SideScroll patch v1.1.21

Install this **changed-files-only** ZIP over v1.1.20 in your flat SideScroll repository.

This release makes joint-boundary Local X/Y more reliable after mitre rotation, allows safe concave (non-crossing) regions, clamps invalid slides to the last valid boundary rather than snapping to zero, and shows **all bound bone influence areas of the selected Part** simultaneously. The selected bone is highlighted; the edited joint is orange.

The redundant **Free-end extension** slider is removed; use a chain-end joint's Local X offset instead. Previously stored nonzero extensions convert to equivalent offsets on next edit without moving the cap. Offset sliders now work at 1 mm steps and also have ±1 mm nudge buttons.

Weights remain strictly binary, with **no blending** in this release. See `README-PATCH-1.1.21.md` for this release's details and test limitations. The `SIDESCROLL_*.md` files remain cumulative references.
