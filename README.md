# SideScroll v0.1.3

- Introduces reusable puzzle groups: authored props are placed relative to a marker rather than hard-wired into a full level.
- Adds distance-based group streaming, puzzle-specific scenery exclusion zones, completion state and per-group object state.
- Adds a generated greybox puzzle asset pack with three crate variants, fallen tree, short/long logs and barrel placeholders.
- Adds the first `FALLEN_TREE_TEST` group at a world marker. The intended route is one crate -> two-crate stack -> fallen tree.
- Puzzle props can be selected/moved in Edit mode; group bounds and marker are shown there for tuning.
- Crates softly snap to a nearby crate centre when stacking, making the first puzzle more forgiving on touch.
- Final puzzle art is deliberately deferred until scale/collision/layout are proven.
- Uses a SideScroll-owned scene storage key, so old GameHub editor data no longer leaks into the standalone repo.
- No audio.
