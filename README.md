# SideScroll v0.2.19

- Splits puzzle authoring into **Library** and **Scene** views.
- Library lists reusable puzzle templates; Scene lists puzzle markers currently placed in the world.
- **Spawn Here** creates a linked scene instance from the selected Library template.
- **New Puzzle** creates a blank reusable Library template first, ready to spawn wherever you want to build it.
- Scene puzzles are clearly labelled **INSTANCE** or **COPY**.
- Linked instances offer **Save to Template** to update every linked instance, or **Save Unique** to detach only that scene puzzle.
- Detached copies use **Save Copy** and no longer inherit later template changes.
- Older locally authored puzzle starts are migrated into the reusable template store so existing work remains available.
