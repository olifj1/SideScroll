# SS-PATCH-1.0.86

Revised combined climb-animation patch over SideScroll v1.0.85. This supersedes the earlier 1.0.86 drop.

- Fixes the climbing rig when the character faces left.
- Planted hand/foot world targets now convert back to mirrored rig-local coordinates using positive character scale with facing applied separately.
- Prevents left-facing limb offsets from exploding sideways.
- Makes traversal along the authored climb path constant-speed instead of smoothstep-eased.
- Because the planted-limb cycle is driven by world distance, the hand/foot cadence is now consistent rather than starting slowly and accelerating through the middle of a climb.
- Keeps only the short approach onto the climb line eased; the climb cycle remains held until that settle is complete.
- Includes a fresh script cache key so this revised 1.0.86 replaces the earlier drop cleanly.
