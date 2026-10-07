# SideScroll patch 1.0.131

Changed-files-only patch over 1.0.130.

## Puzzle Editor v2 completion candidate

- Setup now presents explicit **Linked Template** vs **Unique Copy** semantics.
- Ordinary drawer **Save** remains scene-instance-only.
- Added **Revert Scene to Template** for linked instances; it is Undoable until the session is saved.
- Renamed/deliberately separated the broader actions: **Make Unique**, **Apply as Template + Start**, and **Set Start for Unique**. Shared-template changes require confirmation.
- Moved the full cart-path timing, landing angle, speed-profile, Match Push, ghost replay and scrub controls into the Puzzle **Logic** route.
- Added a selected-child Inspector in **Contents** for Position, Ground/Free placement, Collision, Duplicate/Delete, sockets and Thought/Camera Node settings.
- Thought/Camera editors now open deliberately from the child Inspector during Puzzle Edit and Back returns to Contents with the child still selected.
- Added interrupted Puzzle-session recovery drafts. Dirty authoring state is snapshotted at transaction boundaries/page hide and can be recovered when the same puzzle is edited again.
- Audited Puzzle transaction coverage; marker numeric-position edits now join the shared history as well.
- Persisted linked scene-override status so the Template/scene relationship remains clear after reload for saves made with this version.
- Reconciled `SIDESCROLL_TASKS.md` so completed Puzzle/Undo work is no longer shown as outstanding, and restored the fox / woodland artefact / market-stall backlog items.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Validation

- All project JavaScript files syntax checked with `node --check`.
- `sidescroll.js` unresolved-name TypeScript check performed.
- HTML duplicate-ID/static control wiring checked; only the same three pre-existing optional/unbound IDs remain absent from `play.html`.
- Puzzle workspace proxy targets checked.
- CSS brace balance checked.
- Final on-device iPhone QA is still required before Stage 2 is formally closed.
