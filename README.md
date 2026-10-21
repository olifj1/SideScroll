# SideScroll Anim Lab — v1.1.10 Skin deformation hotfix

Changed-files-only overlay. **Install directly over v1.1.9.** This README describes this drop only.

- Corrected Skin's profile-weight normalization: when all but one bone are explicitly set to 0, residual weight now belongs to the active bone instead of leaking onto an unrelated first bone (the cause of the lower-leg collapse).
- Added **Rigid bind: 100% selected bone (all vertices)** for reliable one-bone testing. This is undoable and survives Save; **Reset part** restores the prior automatic weights.
- Skin now reports the **minimum and maximum actual weight across vertices**, rather than only the peak; its heatmap remains an optional overlay on fully opaque artwork.
- Skin's Parts list is compact, single-row and legible, with status below the name inside the same selection button.
- Increased Anim Lab's pinch-zoom limit from 320% to 900% and minimum from 55% to 35%.

See `README-PATCH-1.1.10.md` for device tests and caveats. No legacy asset/character data is migrated or cleared.
