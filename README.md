# SS-PATCH-1.0.114

Applies over `SS-PATCH-1.0.113`.

## Asset Lab live refresh

Asset Lab settings are now reloaded whenever Play is restored or becomes
visible again.

This fixes the case where an asset is changed in Asset Lab — for example
enabling `Follow Surface Normal` — but Play returns from iOS back/forward cache
with its old in-memory behaviour table.

The refresh covers:
- behaviours, including Follow Surface Normal, Solid, Climbable, Support etc.;
- inherited collision defaults;
- climb paths;
- mechanisms;
- asset-level sockets;
- asset state profiles;
- existing Asset Lab layout/size refresh.

Existing objects are not recreated. Inherited behaviour/collision is refreshed
in place, while per-instance collision overrides remain protected.

Placement remains separate from gameplay-layer locking:
- Ground = follows terrain height and may follow its normal if the asset enables it.
- Free = keeps authored world height/orientation.
- Gameplay-layer lock = constrains the object to the gameplay/path depth.
So an Environment asset can be Ground-attached without being gameplay-layer locked.
