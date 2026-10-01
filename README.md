# SideScroll v1.0.82

Code-only patch for v1.0.81.

## Changes
- Natural scenery (trees, foliage, grass and rocks) now grounds against the visible terrain surface rather than the collision/mathematical surface.
- Visible grounding matches the depth-band overlap, render-only layer offsets and ground-band render offset introduced for seam hiding.
- Wrapped procedural scenery re-grounds against the visible surface as it repeats across the world.
- Existing user-placed natural scenery keeps its authored floor offset while being re-anchored to the visible terrain.
- Gameplay floor, character movement, collisions, bridge/support objects and puzzle geometry remain on the existing gameplay terrain surface.

Base: SS-PATCH-1.0.81
