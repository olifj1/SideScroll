# SideScroll v1.0.62

## Broken Bridge world-modifier follow-up
- River-bank grass/rock dressing is now owned by the Broken Bridge river modifier instead of an absolute terrain section.
- Modifier bank dressing streams, moves and deletes with the puzzle and is regenerated deterministically at the correct river-bank heights.
- Legacy section-owned bridge bank dressing is migrated away automatically.
- Procedural trees now anchor to the actual terrain surface rather than the old global ground baseline.
- Moving a puzzle re-anchors its grounded props and nearby environment dressing to the terrain at the new location while preserving authored offsets.
- Non-puzzle dressing inside the active river channel is suppressed so trees/foliage cannot remain embedded in the river bed.

## Design Lab
- Adds Technical Queue item 01A for the river-bank dressing / terrain-grounding portability test.

## Test focus
- Move Broken Bridge across several positions and a section boundary.
- Confirm river, bank dressing and bridge move together.
- Check nearby trees/foliage sit on the visible terrain surface.
- Confirm the old river location restores cleanly.
