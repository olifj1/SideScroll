# SideScroll — SS-PATCH-1.1.9

**Changed-files-only release. Install over v1.1.8.** This README covers **only v1.1.9**.

## Skin interface and controls

The Skin workspace for Atlas-assembled characters now uses the same **Parts list → Edit selected part** pattern as Atlas and Parts. Each part has Select, Hide, Solo and Lock; those visibility/lock choices are editor-only. A selected part exposes rig-descriptor bone groups and bones, **Peak Bone Weight (0–100%)**, **Influence Spread/Falloff**, the optional selected-bone heatmap, and reset controls. Rest, Walk and Run previews remain available. Advanced controls include viewport **Pick vertex**, per-vertex weight adjustment/auto-reset, reset part weights, and copying a binding to another instance of the *same* source mesh.

**Texture transparency fix:** Every assembled mesh is rendered at its original texture opacity in Skin. Unselected parts are no longer artificially faded to 18%. Heatmap is Off by default and overlays a colour diagnostic without making texture pixels see-through.

## Data and compatibility

The existing Skin binding schema is extended with optional automatic baseline, per-bone peak/spread profiles and sparse manual vertex overrides. The final normalized weights remain the data used by Animate and Quick Play. Existing v1.1.8 bindings load without migration; edits remain Undoable and saved in normal character Setup. Neither the original Fox art/clips nor Atlas source geometry is changed by this patch.

**Not included:** normal gameplay renderer integration, cross-device transfer of imported PNG bytes, multi-atlas/shared clothing and Character Hierarchy. iPhone Safari validation is still required.
