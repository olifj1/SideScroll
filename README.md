# SideScroll v0.2.0

- Adds a dedicated puzzle-authoring workflow with Setup, Set Start, Test, Reset and Back to Setup states.
- Separates the authored puzzle start from disposable test state, so testing cannot overwrite the saved starting arrangement.
- Adds an in-game puzzle panel showing the nearby puzzle, current mode and authoring instructions.
- Puzzle Reset now restores the current puzzle to its saved start (or its code-defined default if no custom start has been saved).
- Edit mode hides character movement controls; horizontal scene swipes pan the world while puzzle props remain directly selectable/draggable.
- Editor object tools now only appear when they are relevant to the current selection, reducing overlapping controls.
