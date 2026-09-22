# SideScroll v1.0.12

Placement, river and collision-debug refinement.

- Placement mode is now paint-only: tapping lays the active asset onto the ground even when another asset is visually in front; dragging pans.
- Environment and puzzle editing now filter selection to the active scope. Puzzle Dressing only exposes environment-scope dressing attached to that puzzle; normal Puzzle mode excludes that dressing.
- Collision view now draws a cyan dashed **PLAY SURFACE** line showing the exact terrain height used by the character controller, including river sections.
- River beds and water are lowered slightly so crossings read as deeper and less casually walkable.
