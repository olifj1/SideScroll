# SideScroll v0.2.43

- Added an Export All button to the editor Stage section.
- Export All creates one `SideScroll-Complete-Game-Design.json` handoff file.
- The file contains resolved environment placement, raw scene edits, every puzzle marker and setup, local puzzle templates, asset behaviour/collision defaults, collectable setup, and camera tuning.
- Unsaved current puzzle edits are included as `currentSetup` and used as `effectiveSetup`, so the handoff does not silently lose work that has not yet been Set Start.
