# SideScroll v0.1.7

- Widens the character traversal footprint so visually tiny gaps are treated as blocked rather than squeeze-through spaces.
- Fixes abrupt downward snapping on steep parts of a custom platform collider: sharp drops now become normal gravity falls.
- Collision polygon handles can now extend roughly 30% beyond the base collision width and 25% above its base height for better sprite matching.
- Keeps the stable approach-side collision behaviour from the previous pass.
