# SideScroll v1.0.178 — original-alpha charcoal atlas correction

Apply over v1.0.177.

Changed-files-only patch.

## What changed
- Rebuilds the current Fox bind art from the original transparent `charcoal_fox_sprite_atlas.png` generated in chat, not from the later white-background/copied screenshot.
- No background-removal or synthetic alpha pass is used. The source transparency is retained through the six bind parts.
- Replaces Body + Head, Tail, Front Near/Far and Rear Near/Far with v3 bind planes derived from that clean source.
- Rebuilds the runtime segmented Fox atlas as `fox-rig-atlas-v5.png` from the same clean-alpha planes.
- Keeps the existing reference coordinate system, Part Layout defaults, rest-rig positions and `fox-reference-bind-1.0.174` authoring baseline ID so saved rig/animation work is not intentionally reset.
- Bumps cache/version references so devices do not keep the v1.0.177 screenshot-derived textures.

## Expected result
The character should sit in essentially the same initial layout as v1.0.177, but without the white fringe introduced when the copied image was converted back to transparency.

## QA
- Six bind planes extracted from the original RGBA atlas and resized in premultiplied-alpha space only; no alpha matting/background removal performed.
- Runtime v5 atlas regenerated from those planes with the existing rig anchors/segment rectangles.
- JavaScript syntax checked for changed JS files.
- Existing authoring baseline ID preserved.
