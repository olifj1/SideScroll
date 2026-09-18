# SideScroll v0.2.29

This drop makes puzzle setup stacking work in Edit mode and restores an explicit start-state control.

Changes in this version:
- Moving a stackable gameplay asset near another stack now snaps it to the stack centre and next standard layer.
- Newly placed stackable assets can start directly on an existing stack.
- Puzzle start snapshots now preserve vertical stack state, so Reset and Test recreate authored stacks.
- The puzzle action is labelled **Set Start** again; it saves the current setup as the puzzle/template starting state.
- Wide-on-narrow and narrow-on-wide stacks use the same standard stack rule during editor settling.
