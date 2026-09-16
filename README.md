# SideScroll v0.1.9

- Adds a shared capsule-style character collider that scales with the SideScroll character.
- Adds a Collider mode to Walk Lab with draggable handles for capsule position, height, radius and foot-probe reach.
- Saves the Walk Lab collider separately and includes it in Walk Lab JSON save/load files.
- Reworks SideScroll ground following so reachable collision polygons act as walkable surfaces, allowing the character to follow gentle authored slopes.
- Keeps larger rises as blocking obstacles and converts larger downward changes into normal gravity falls.
- Establishes the same walkable-surface query as the basis for future variable-height terrain.
