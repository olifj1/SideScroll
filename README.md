# SideScroll v1.0.18

Asset positioning / bridge authoring pass.

- Bridge halves now default to **Free placement**, so moving them in X or depth does not make them ride up/down the terrain underneath.
- Selected assets have a new **Position** panel with independent X, floor-Y and Z values plus fine/normal/coarse nudge steps.
- Free/Ground can be switched per placed object. Free placement stores an absolute floor/deck height and persists through puzzle starts and scene saves.
- **Floor = walk** aligns the artwork floor line to normal walking height.
- **Collision top = walk** moves a Support Surface so the top of its collision exactly matches normal walking height.
- **Align fixed supports** aligns non-carryable support surfaces in the current puzzle to the selected support's height and depth, useful for paired bridge pieces without adding bridge-specific physics.
