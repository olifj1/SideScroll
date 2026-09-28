# SideScroll v1.0.60

Broken Bridge portability + technical design queue.

- Adds a new **Technical Design & Development Queue** section to Design Lab, ordered by dependency/importance and seeded with the major tasks discussed on 28 Sep 2026.
- Broken Bridge now owns a relative **river world modifier** rather than relying on an externally prepared absolute River section.
- Existing saved bridge River-section width/position is migrated into the puzzle on first load, then the old section override is released.
- Puzzle-owned river geometry, water, depth and collision gap follow the puzzle marker and can cross 10 m section boundaries.
- Removing/moving the puzzle removes/moves the owned river requirement with it.
- Puzzle start/template snapshots now retain `worldModifiers` for linked and unique puzzle instances.
- This is the architectural precursor to Puzzle Lab, World Elements, World Lab and biome-transition work.
