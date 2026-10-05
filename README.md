# SideScroll v1.0.117 — Stage 1 editor foundation

Apply this changed-files-only patch over SideScroll v1.0.116.

## Included

- Unified persistent Editor Drawer foundation with fixed header/body/footer layout.
- Drawer can collapse to a persistent rail and reopen by tap or horizontal swipe.
- World Group Editor v2 with dedicated Contents, Exclusions and Group tabs.
- Group internals are only editable inside a World Group edit session.
- Explicit Save and Discard for a whole Group edit session.
- Bounded Undo/Redo history inside Group Edit; pointer drags are recorded as one action.
- Unsaved Group edits are held out of persistent scene storage until Save.
- Creating a new Group is session-scoped: Discard removes the unsaved Group entirely.
- Contents list for exact selection of assets, Thought Nodes and Camera Nodes.
- Explicit Detach vs Delete for Group members.
- Exclusion zones are listed directly with stable IDs; add, select, enable, edit, fit, duplicate and delete are contained inside Group Edit.
- Duplicate/missing exclusion IDs are repaired during normalization.
- Existing Position, Collision, Thought and Camera editors are reused as Group sub-tools without ending the Group session.
- Surrounding authored content is locked from selection while editing a Group.
- Normal Environment mode retains only Group instance operations such as Edit, Move, Rename, Duplicate, Dissolve and Delete.
- SIDESCROLL_TASKS.md updated with Stage 1 implementation progress and remaining architecture work.

## Stage 1 follow-ups still documented

- Generalise the drawer route/navigation stack beyond World Groups.
- Add fuller finger-follow drawer animation / final gesture tuning if useful on-device.
- Extend transaction Undo/Redo to Puzzle, Terrain and other editor contexts.
- Continue iPhone/A2HS ergonomics testing and tuning.

## Validation

- All 14 JavaScript files syntax-checked with Node.
- No duplicate HTML IDs.
- No new missing DOM bindings versus v1.0.116.
- CSS brace balance checked.

This release has not been browser-runtime tested in the build environment, so please exercise the Group Save/Discard/Undo flow and drawer gestures on-device before treating Stage 1 as closed.
