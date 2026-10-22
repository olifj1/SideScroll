SideScroll v1.1.13 — CPU performance improvement for Atlas character animation.
Install over v1.1.12. Changed files only.
Batches adjacent triangles with near-identical texture transforms and computes each pose's bone transforms once. Keeps Skin/Animate/Play on the proven Canvas2D path; GPU remains off. Saved weights and character setup unchanged.
Actual iPhone performance and New01 artwork still need validation. See README-PATCH-1.1.13.md for this drop's details.
