# SideScroll — SS-PATCH-1.1.5

**Changed-files-only patch.** Install over v1.1.4. This README describes **only v1.1.5**.

- Parts now uses its existing part list and transform tools with **Add**, multi-select **Delete selected**, **Select all** and **Clear all**; no second inventory panel or original/new assembly switch.
- **Add** opens a multi-select list of source meshes saved in Atlas. Select any combination and **Create** assembled part instances; adding/removing never changes or deletes the source mesh.
- The existing position, rotation, size, pivot, layer, visibility, clipboard and thumb-pad controls work on the assembled Atlas parts.
- Source names are resolved by stable Atlas mesh ID so subsequent Atlas renames update the Parts list; adding the same source multiple times does not silently append “copy” to a saved source name.
- No suggested joint controls in Parts. Initial structural edits migrate the visible built-in parts to inventory entries when necessary. Prior v1.1.4 assemblies are read without resetting their positions.

**Limitations:** custom Parts are rigid previews in Parts/Rig. Skin weighting, animation deformation, Quick Play/runtime for new meshes, and portable PNG/export/restore are not implemented in this drop. Imported PNGs remain local to the device. iPhone Safari testing is pending.

See `README-PATCH-1.1.5.md` for detailed installation/verification notes for this patch only.
