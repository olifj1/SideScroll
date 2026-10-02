# SideScroll Patch v1.0.98

Changed-files-only patch over **v1.0.97**.

## Fix
- Restores constant horizontal movement speed when walking/running down sloped support surfaces such as the fallen tree.
- The post-move capsule penetration safety pass no longer pushes the character away from the same sloped support they are currently standing on.
- Normal swept collision against that support remains active, so real side walls and taller faces still block the character.
- No change to walk/run speed values, slope height, jump, climb, or authored collision data.
