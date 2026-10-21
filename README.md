# SideScroll — SS-PATCH-1.1.11

**Changed-files-only patch. Install over v1.1.10.** This README describes **v1.1.11 only**.

- **Skin:** Spatial capsule envelopes replace the confusing new-assembly Peak/Spread tuning controls. Each bone now has **Strength (0–100%)**, **Inner radius (full influence)** and **Outer radius (zero influence)** with live adjustment, a visible envelope outline, heatmap, Undo/Redo and Save/Discard.
- **Meaningful zero:** Strength 0 means *no influence from that bone*. At less than full total influence, remaining weight stays at rest rather than being secretly reassigned to a different bone. Two active overlapping envelopes blend smoothly. Rigid Bind, manual vertex edits and existing bone-group selection remain available.
- **Existing character safety:** Previously saved v1.1.10 weights are preserved until the artist moves an envelope control or deliberately Auto-binds. The new spatial-envelope data is optional in the existing binding schema; no automatic migrations or imported art changes.
- **Animate performance:** Reduced per-triangle CPU texture sampling, reduced costly full-panel refreshes during playback, and added an optional GPU atlas-triangle compositor (Canvas2D fallback when WebGL isn't available). Real clip timing now follows elapsed wall time rather than artificially slowing after long frames.

See `README-PATCH-1.1.11.md` for this patch's exact files, caveats and acceptance checks. **On-device Safari/real New01 performance remains unverified.**
