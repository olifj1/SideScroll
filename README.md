# SideScroll v1.0.11

Bridge matching and Asset Lab stability pass.

- Rebuilt `bridge-right.png` as an exact horizontal mirror of the approved left bridge piece, with matching dimensions and floor-line defaults.
- Existing bridge-right Asset Lab layout/collision defaults are migrated from the left piece once, so older saved setup does not preserve the mismatch.
- Asset Lab now remeasures through iOS orientation changes using dynamic viewport sizing, Visual Viewport updates and a stage ResizeObserver.
- Increased the smallest Asset Lab UI, collision-editor and viewport label text for better phone legibility.
