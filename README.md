# SideScroll v1.0.5

- Adds a reusable **Floor Line** editor for placed billboard assets.
- The floor line is stored as a normalised height inside each asset and remains anchored to the terrain while the artwork moves around it.
- A cyan in-scene guide shows the current floor line while editing, with a live slider and reset control.
- Ground-line values persist for environment assets and puzzle-owned dressing, and are preserved when objects move, scale, reload, or terrain sections change height.
- Existing assets still default to bottom-on-ground behaviour. The two broken bridge halves now use built-in floor-line defaults matching their deck height instead of hard-coded negative Y offsets.
- Existing v1.0.4 placements migrate without jumping: legacy terrain offsets are respected until the object is next saved with the new floor-line data.
