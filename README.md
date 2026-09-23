# SideScroll v1.0.24

Counterweight plank palette fix.

- Fixes the **Counterweight Plank · Prototype** not appearing under **Puzzle Pieces → Place Puzzle Piece**.
- The plank had already been registered with the editor and runtime in v1.0.23, but the Puzzle Pieces palette is also filtered by the puzzle's allowed asset pack.
- The plank is now registered in `woodland-puzzle-atlas-v1`, so existing user-created bridge puzzles using that pack can place it normally.
- Keeps the v1.0.23 pivot, counterweight-zone and tipping prototype unchanged.
