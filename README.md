# SideScroll patch 1.0.122

Stage 1 selected-object control correction. Apply over **1.0.121**.

## Changes

- Restores the contextual horizontal **Quick Tools** strip while editing a selected World Group member. The useful existing controls are available again instead of disappearing during the new Group Edit session: Duplicate, Flip, Scale −/+, Floor Line, Position, Collision and the applicable deeper collision/socket actions.
- Adds an explicit **Move** tool for World Group members. Once armed, the drag may start anywhere in the free viewport; horizontal finger movement moves along the journey and vertical movement changes scene depth relative to the member's current position. Lift/reposition/touch again to continue from the new position.
- Move is disarmed when selection changes, another focused tool is entered, or the editor leaves the Group `Contents` tab, preventing a stale Move mode from stealing later gestures.
- The Quick Tools strip is only shown for a selected Group child and remains hidden during placement or on Group/Exclusion pages.
- Thought and Camera Nodes hide irrelevant Flip / Scale / Floor Line / Collision controls while retaining relevant positioning/duplicate/delete actions.
- Restores meaningful World Group Undo transactions for Quick Tool Duplicate, Flip, Scale, Collision and Delete operations. Floor Line slider adjustment is grouped into one pointer gesture rather than one history entry per input frame.
- `Floor Line` now follows the same **same-slot** navigation rule as `Position`: during Group Edit it replaces the drawer at the left workspace anchor and Back restores the Group workspace.
- The Quick Tools strip now anchors from the actual Stage 1 drawer width and reclaims horizontal room when the drawer is collapsed.
- Updates `SIDESCROLL_TASKS.md` to retain Quick Tools as an intentional high-frequency authoring surface alongside the unified drawer.
- Cache-busts `style.css` and `sidescroll.js` to `1.0.122`.

## Changed project files

- `play.html`
- `style.css`
- `sidescroll.js`
- `SIDESCROLL_TASKS.md`

## Validation

- All 14 JavaScript files pass `node --check`.
- `play.html` contains no duplicate IDs.
- The set of optional/missing legacy DOM bindings is unchanged from 1.0.121; the new Move binding resolves correctly.
- CSS brace counts balance.
- Only the four intended project files differ from 1.0.121.
