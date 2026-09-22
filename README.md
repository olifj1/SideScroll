# SideScroll v1.0.14

Bridge / terrain support fix.

- Bridge support surfaces now override the river-bank terrain inside the bridge collider footprint, so a flat bridge collider stays flat as the underlying bank drops away.
- Bridge entry/exit transitions get a slightly larger snap allowance so the player does not briefly fall or climb at the river lip.
- Collision debug now shows **TERRAIN** as a dashed cyan line and the final **WALK SURFACE** as a solid mint line, including bridge/platform support.
- Includes the river-bank auto-dressing tools from v1.0.13.
