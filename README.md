# SideScroll v0.1.6

- Stabilises character facing at obstacles so pushing against collision no longer causes rapid left/right flicking.
- Gives the character a real horizontal collision footprint instead of treating her as a near-point, preventing entry into gaps that are visually too narrow.
- Collision resolution now preserves the player's approach direction and never pushes the character backwards on alternating frames.
- Fixes the editor's puzzle-asset pack reference so the woodland puzzle props remain available reliably in Edit mode.
- No art, layout or audio changes in this release.
