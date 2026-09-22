# SideScroll v1.0.3

- Adds a new **River** terrain-section type.
- River geometry is built in code as three reusable meshes: **left bank**, **right bank**, and a separate **water plane**.
- Bank tops reuse the existing `terrain-dirt.png` texture; descending bank walls use local UV mapping to avoid stretched top-down texture projection.
- River edges meander along scene depth instead of remaining perfectly parallel.
- Adds a per-section **River Width** control (3.4–6.6 m).
- River sections replace the normal ground/path meshes rather than covering them, leaving a real lowered river bed beneath the water.
- Procedural forest dressing is automatically cleared from the water channel; manually placed dressing remains available for rocks, reeds and grasses.
- Grounded environment/puzzle objects continue to re-anchor to the local terrain surface when a section becomes a river or its width changes.
