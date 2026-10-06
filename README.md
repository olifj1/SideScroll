# SideScroll patch 1.0.130

Changed-files-only patch over 1.0.129.

## Fixes

- Edit-camera vertical framing now anchors to the current authored walk/Support Surface rather than terrain hidden below it.
- Camera/Thought nodes and other Ground-positioned gameplay editor objects can now be placed/moved on authored Support Surfaces such as climbable-rock tops and bridge/platform collision.
- Camera Node live preview uses the same support-aware camera baseline.
- Procedural biome dressing remains terrain-only.
- No hidden support binding/parenting is introduced.

## Validation

- JavaScript syntax checked with `node --check`.
- HTML duplicate-ID/static wiring checks performed.
- Requires on-device touch/camera verification.
