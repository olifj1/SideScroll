# SideScroll patch 1.0.129

Support-surface lifecycle correction.

## Changes

- Fixes the remaining Edit-mode terrain drop found after 1.0.128.
- The main frame loop no longer clears authored support every Edit frame. The editor character/scale reference now remains on the same walk/support collision used by Play.
- Restoring the saved player position now resolves authored Support Surfaces immediately instead of starting at terrain height and lifting on the next gameplay frame.
- The player launch path performs a final support resolve after initial streaming/loading and before the entry fade is revealed.
- World Lab jump positions use the same support-aware initial grounding.
- Manual Ground placement remains support-aware; procedural biome placement remains terrain-only.
- No hidden object-to-support parenting is introduced.

## Apply

Changed-files-only patch. Apply over SideScroll 1.0.128.
