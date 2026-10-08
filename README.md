# SideScroll patch 1.0.134

Changed-files-only patch over v1.0.133. This is the bounded **Puzzle Entry / Exit Logic** pass. It does not start the wider Environment Animation Path work.

## Puzzle Entry / Exit Logic

- Adds `Puzzle Entry / Exit` as a reusable applied Logic system.
- Entry marks a puzzle as started; Exit marks it complete.
- New instances default to AUTO placement from the puzzle bounds: Entry at the near bound and Exit at the far bound.
- `Move Entry` and `Move Exit` use the same stable relative screen-space drag pattern as Puzzle Zones. Moving a marker changes only that marker to MANUAL.
- `Entry = Bounds`, `Exit = Bounds` and `Use Puzzle Bounds` return markers to automatic bounds-following placement.
- Entry / Exit markers are drawn and labelled in the viewport while this Logic item is selected.
- Socket Completion and Puzzle Entry / Exit are treated as alternative completion rules; Completion Reward remains a separate event and can coexist with either.

## Fallen Tree migration

- Fallen Tree's old `cross-x` completion now migrates into Puzzle Entry / Exit Logic.
- Its Entry follows the near puzzle bound.
- Its legacy completion threshold is preserved exactly as the initial MANUAL Exit, so this refactor does not subtly move the point at which the existing puzzle completes.
- v1.0.133 could already have written an explicit `logic[]` before Entry / Exit existed. v1.0.134 adds a Logic schema version so those saves still receive the migration, while deliberately removing Entry / Exit in v1.0.134 remains authoritative and does not resurrect `cross-x`.

## Runtime / session behaviour

- Crossing Entry records the puzzle as started; crossing Exit after that records it complete and continues to drive the existing Completion Reward system when attached.
- Entry / Exit data is included in the existing Puzzle Undo/Redo, Save/Discard, recovery, Reset/Test, Set Start and template snapshots.
- The old `cross-x` runtime check remains only as a safety fallback for genuinely old/unmigrated schema data.

## Changed files

- `sidescroll.js`
- `play.html`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Validation / device test

Static validation includes `node --check` for the changed JavaScript, HTML duplicate-ID/control-target checks, CSS/HTML structure checks, and ZIP integrity. This build has **not** been tested on-device.

On iPhone, prioritise:

1. Fallen Tree → Edit Puzzle → Logic: confirm `Puzzle Entry / Exit` appears and both labelled markers are visible.
2. Move Entry and Move Exit, use the individual Bounds buttons and `Use Puzzle Bounds`, then exercise Undo/Redo and Save/Discard.
3. Test Current: approach from the left, confirm Entry starts the puzzle and the preserved Exit completes it. Reset and repeat.
4. Resize puzzle bounds while Entry/Exit are AUTO and confirm they follow the new bounds. A MANUAL marker should stay where authored.
5. Re-check Stone Wall Socket Completion + Completion Reward and Broken Bridge Cart Path to ensure the new completion-rule type did not disturb the v1.0.133 systems.
