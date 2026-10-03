# SS-PATCH-1.0.106

Applies over `SS-PATCH-1.0.105`.

## World Groups v3 — exclusion zones
- Selected World Groups can now own a procedural-dressing exclusion zone.
- Enable/disable, edit and `Fit Exclusion` controls live with the World Group tools.
- The exclusion is stored relative to the group, so it moves with the group automatically.
- Exclusions suppress procedural biome dressing only; deliberately placed world assets are preserved.
- Group templates carry their exclusion setup into new instances.

## Stage 3 — World Lab integration
- Adds a dedicated `WORLD GROUPS` timeline track.
- Group members no longer clutter the standalone `WORLD ASSETS` track; loose individual objects remain there.
- World Group blocks show their authored extent and member count.
- Select a group, then drag its timeline block horizontally to adjust pacing.
- World Lab queues the new X position rather than duplicating terrain logic. On the next game load, SideScroll consumes the request through the normal terrain-aware World Group move, so Ground/Upright, Ground/Follow Normal and Free members retain their correct behaviour.
- Group selection supports numeric X entry, Jump to Game, Move Playhead and Cancel Queued Move.
- Complete World Lab export/import now includes queued World Group moves.

Streaming is intentionally not implemented here; Stage 4 remains the later global World Lab streaming policy for puzzles, World Groups and standalone objects.
