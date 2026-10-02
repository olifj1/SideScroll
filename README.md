# SideScroll Patch v1.0.94

Changed-files-only patch over **v1.0.93**.

## Camera Node v1
- Adds **Camera Node** under Environment Assets → World Tools.
- Global / Unbound world node; it is not tied to Woodland or Mountain.
- Author a trigger radius plus X, Y and Z camera offsets.
- Entering the radius softly eases toward the offset; leaving softly eases back to the normal camera.
- Selecting a Camera Node in Edit mode previews its framing live while you adjust the sliders.
- X and Y pan the framing; positive Z moves the camera farther back.
- Existing jump/climb height follow continues underneath the node.
- Camera Node offsets are render-only: player position, collision, streaming and saves remain on the normal logical camera/player root.
- Overlapping nodes choose the nearest node relative to its radius.
- Camera Nodes show a purple radius/offset guide in Edit mode and are invisible in play.

## Files
- `sidescroll.js`
- `play.html`
- `style.css`
