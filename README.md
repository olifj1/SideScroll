# SS-PATCH-1.0.110

Applies over `SS-PATCH-1.0.109`.

## World Group recovery / selection controls

A selected locked World Group now exposes editor controls even when no child
asset is selected.

### POSITION
- The normal `POSITION` button appears for a selected locked group.
- Group mode exposes X and Z numerically with the same step/nudge controls used
  for individual assets.
- X/Z changes move the complete group through the terrain-aware group movement
  system, preserving member layout and each child's Ground/Free rules.
- Y and the asset Free/Ground toggle are hidden because vertical placement is
  still resolved per member.
- `Depth = Path` is an emergency/recovery action that moves the group anchor back
  to normal gameplay depth. This is specifically useful if the yellow movement
  dot has been dragged too close to the camera or off-screen.

### DELETE GROUP
- Added an explicit `Delete Group` button beside `Dissolve`.
- Delete Group removes the group and all of its placed member assets.
- Dissolve remains the non-destructive option: it removes only the grouping and
  leaves the assets in place.
- When a locked group is selected, the normal bottom DELETE control also changes
  to `DELETE GROUP`.

This means an off-screen or badly positioned group can always be recovered or
deleted by selecting it from the World Groups list; access to the yellow dot is
no longer required.
