# SideScroll patch 1.0.128

Edit-mode authored-support grounding hotfix.

## Changes

- Fixes a terrain-only snap that still ran when entering Edit mode.
- If the player is standing on a climbable rock, bridge/platform, or other authored Support Surface, entering Edit now preserves that support instead of dropping the character and camera to terrain below.
- The support lookup is capped to the player's current feet height, so Edit entry will not jump the player upward onto a higher overlapping platform.
- Manual Ground placement remains on the shared Support Surface resolver introduced in 1.0.127.
- Procedural biome placement remains terrain-only.
- No hidden object-to-support parenting is introduced.

## Apply

Changed-files-only patch. Apply over SideScroll 1.0.127.
