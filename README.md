# SideScroll patch 1.0.132

Changed-files-only patch over v1.0.131.

## Management/Edit separation + stable Puzzle Zones

- Puzzle Management is now management-only. Puzzle child objects are not selectable/editable until `Edit Puzzle`, and only `Contents` owns child manipulation.
- World Group children stay locked outside an explicit `Edit Group` session, including viewport and Environment-list selection paths.
- Puzzle exclusion and respawn authoring now share one stable `zones[]` collection with stable IDs and typed `procedural-exclusion` / `respawn-trigger` records.
- The Zones tab now provides Add, authoritative List/Select/Focus, Enabled, relative-screen Move, Width/Length sliders and Delete. Respawn zones also expose Trigger Height and `Spawn = Player`.
- Legacy puzzle exclusion and respawn data is read as migration input and becomes the new zone representation without creating new records merely by rendering the UI.
- The old perspective/edge-handle respawn editing path has been retired. Respawn uses the same stable relative Move interaction as other zones.
- Zone edits participate in the existing Puzzle session Save/Discard and central Undo/Redo model; one drag/slider gesture is one history action.
- Runtime procedural exclusion and respawn checks now consume the typed zone collection. Puzzle exclusion bounds are flattened once per rendered frame rather than rebuilt per dressing object.
- `Clear Stage` is now the explicitly destructive `Clear Puzzle Workshop` utility under `Advanced / Workshop`.
- Applied Puzzle Logic remains intentionally deferred to v1.0.133.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Validation

- All project JavaScript files syntax checked with `node --check`.
- HTML duplicate-ID/static control wiring checked.
- Puzzle workspace proxy targets checked.
- CSS brace balance checked.
- Source scan confirms the legacy puzzle exclusion/respawn viewport-handle editor is no longer present.
- This patch has **not** been tested on-device. Focused iPhone regression testing of Stone Wall and Broken Bridge remains required.
