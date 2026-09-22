# SideScroll v1.0.15

Section collision / bridge architecture update.

- Every terrain section now has a **Terrain collision ON/OFF** toggle. Visual terrain remains unchanged when collision is off.
- River sections default to terrain collision off; existing river sections migrate to off once, so authored support objects define the crossing.
- Removed the bridge-name-specific collision override from v1.0.14. Any support-surface collision object can now replace terrain in a collision-disabled section.
- Jump physics now preserve world-space height while moving across changing/disabled terrain, preventing boosted or warped jumps.
- Camera jump follow now uses real character height above the jump start, so crossing a bridge over a deep river does not move the camera by itself.
- Collision debug: dashed cyan is raw terrain; solid mint is the actual walk surface and has gaps where terrain collision is disabled with no supporting collider.
- Includes river-bank auto dressing from v1.0.13.
