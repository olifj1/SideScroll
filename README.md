# SS-PATCH-1.0.108

Applies over `SS-PATCH-1.0.107`.

## Fix: World Group membership survives reload

The group ID was already being written correctly to scene storage, but the
runtime `addObject()` constructor did not copy `worldGroupId` from its options.
As a result, restored objects came back as standalone even though their saved
scene row still contained the correct group ownership.

This patch:
- copies `worldGroupId` during all object construction;
- explicitly reconciles restored runtime ownership from the saved scene row;
- therefore fixes normal grouped objects, newly placed members and objects
  created from World Group templates.

Existing saved memberships should recover automatically if their scene rows
still contain the group ID.
