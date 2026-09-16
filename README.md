# SideScroll v0.2.1

- Splits authoring into Environment and Puzzle edit scopes; each scope can only select its own assets.
- Adds a puzzle selector and Focus control so a specific puzzle group is explicitly chosen for editing.
- Reworks editor gestures: drag anywhere to pan, tap/release to select, and only a drag beginning inside the already-selected asset can move it.
- Makes puzzle bounds editable using the yellow end handles; bounds are included when Set Start is saved.
- Keeps puzzle textures resident for the page lifetime to avoid intermittent black WebGL quads during editor/test streaming.
- Makes log pickup range use distance to the log edge rather than its centre, improving pickup beside longer logs.
- Expands the default fallen-tree collision width and allows collision points to extend much farther beyond the sprite's base collision rectangle.
- Puzzle-added props are now associated with the selected puzzle and included in its saved starting state.
