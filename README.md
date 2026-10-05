# SS-PATCH-1.0.116

Applies over `SS-PATCH-1.0.115` / the supplied latest project snapshot.

## Duplicate World Group
- Added `Duplicate Group` to the World Groups controls.
- Duplicates the selected group at its current position with a new group ID and new member IDs.
- Copies member layout, Ground/Free placement state, scale/flip, collision overrides, node settings and every exclusion zone.
- The copy is independent of the source and is selected immediately; drag its yellow origin dot to move it, or choose Edit Group to edit members.

## Relative depth dragging
- Confirmed authored-asset and locked-group direct dragging was already screen-space based, not ray/terrain-intersection based.
- Removed the iterative projection/Newton solve from the depth axis because shallow projection could amplify small vertical finger movement into large Z jumps.
- Each drag now snapshots current X/Z as its zero point. Horizontal movement keeps the existing local screen sensitivity; vertical movement maps to a conservative fixed scene-depth scale.
- Lift/reposition/touch again naturally starts a fresh drag from the object's current position.

## Persistent task backlog
- Added `SIDESCROLL_TASKS.md`.
- Includes Undo architecture, diagnostic performance tooling, World Lab/global authored-content streaming, later texture/GPU streaming, and the existing World Group/content-pipeline roadmap.
