# SideScroll — SS-PATCH-1.1.6

**Changed-files-only release.** Install directly over v1.1.5 (with its ordinary code patch). This README covers **only v1.1.6**.

The **Parts** workspace now follows the Atlas editor's interaction pattern:

- One expanded **Assembled parts** list with a name/select button plus **Hide, Solo, Lock** controls on every row. It grows naturally through 14 parts; longer lists are capped at 520px.
- **Add**, **Delete selected**, **Select all** and **Clear all** remain directly above that same list. Tapping names marks multiple parts for deletion; the most recently tapped part is the individual transform target.
- A **contained Edit selected part** section groups Move/Rotate/Scale/Pivot, numeric controls, layer order and **Rename / Duplicate / Delete** with existing Reset actions. The original right-side thumb pad still drives transforms, and canvas dragging remains pan/zoom.
- **Rename** gives a particular assembled instance its own optional name. Its underlying Atlas mesh name and geometry do **not** change. Unrenamed instances continue to follow their source mesh's name. Duplicate creates another positioned **instance**, not a new Atlas mesh.
- Existing clipboard, reference and specialised near/far transfer commands remain available in a collapsed **Advanced** group, keeping the common workflow short. Hide/Solo/Lock are temporary editor view/tool controls, not exported character data; Lock blocks transform and deletion while set.

All changes to assembled inventory, instance names, transforms and order use existing Setup Undo/Redo/Save/Discard. Neither the Fox source atlas nor Rig/Skin data is migrated by merely visiting Parts. v1.1.5 assemblies remain readable.

**Limitations:** The Atlas-backed Parts preview is still rigid; arbitrary source meshes are not yet weighted in Skin or rendered through Animate/Play. PNG image bytes remain device-local in IndexedDB and absent from JSON exports. iPhone Safari acceptance remains outstanding.

See `README-PATCH-1.1.6.md` for installation and test notes specific to this release.
