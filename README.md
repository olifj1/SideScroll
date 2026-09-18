# SideScroll v0.2.24

This drop adds the new stone-wall puzzle art as reusable assets only; it does not place them in the scene or create a puzzle template.

It also begins the reusable asset setup system. Puzzle assets now have a **Setup** control in the asset browser with persistent behaviour tags for Solid, Carryable, Placeable, Support Surface, Stackable, Socket Host and Socket Piece. Carryable/support/stacking tags already feed the existing interaction and collision systems; socket tags are stored ready for the next socket-authoring pass.

New assets:
- stone-wall.png
- stone-piece-a.png
- stone-piece-b.png
- stone-piece-c.png
