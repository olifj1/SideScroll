# SideScroll v1.0.16

River collision safety refinement.

- River sections no longer disable collision across the whole 10 m section.
- The normal bank/shoulder terrain remains collidable; only the actual river channel is cut out.
- Any generic Support Surface object can span that channel, so there is still no bridge-specific collision rule.
- Existing v1.0.15 river sections migrate back to bank collision automatically.
- Edit mode and Puzzle Focus cannot fall forever through an unsupported channel: authoring falls back to the river water plane.
- The full section Terrain Collision ON/OFF control remains available for deliberate custom setups.
