# SideScroll v0.2.7

- Enlarges the puzzle-authoring UI text and makes the main panel vertically scrollable.
- Moves the Add Asset palette to a separate scrollable panel on the right side.
- Test now uses the current on-screen puzzle setup, including unsaved collision edits; Reset in Test returns to that test snapshot.
- Keeps Clear Stage isolation active through Test and Done, with a new Restore Game action to return to normal marker streaming.
- Starts puzzle tests just before the current left puzzle bound so the character approaches the puzzle naturally.
- Bakes the exported fallen-tree authored layout, bounds and collision polygon into the code-defined default.
- Removes legacy free-standing puzzle props from old scene storage so stale black/orphan logs no longer reappear.
