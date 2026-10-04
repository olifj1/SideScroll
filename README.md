# SS-PATCH-1.0.109

Applies over `SS-PATCH-1.0.108`.

## Group movement correction

- A locked World Group can now be moved **only from its yellow origin dot**.
- Group assets and the yellow bounds remain selection aids, but dragging them no
  longer moves the group.
- The origin dot is slightly larger and its label explicitly says `DRAG DOT TO MOVE`.

## Precise screen-space dragging

The old movement path used ground-ray intersections for scene depth. Near the
horizon that could turn a small finger movement into a very large world-space
jump.

Asset and World Group dragging now solve movement from the projected screen
position instead:
- horizontal finger movement tracks horizontal screen movement;
- vertical finger movement controls scene depth;
- no horizon ray-pick is used during the drag;
- path-locked gameplay assets remain depth-locked.

## Stable group composition

Direct group movement now captures a snapshot of every member at drag start.
Each preview frame is rebuilt from that snapshot rather than accumulating
incremental transforms. This preserves the group's internal X/Z layout exactly
while still allowing each member to obey its Ground/Free and Follow Normal rules.

## Membership integrity

On every scene restore the game validates saved `worldGroupId` ownership against
the reconstructed runtime objects and repairs any mismatch. Membership continues
to be stored on each authored scene object, with the World Group record storing
the group-level transform/settings.
