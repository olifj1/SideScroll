# SS-PATCH-1.0.113

Applies over `SS-PATCH-1.0.112`.

## Critical fix: authored assets no longer wrap

The old scenery system wraps procedural objects by one world-tile width so the
forest can repeat around the camera. Authored objects were accidentally allowed
to inherit that behaviour after reload, which could make a manually placed
house/fence/group member appear again roughly one world width later.

That phantom copy was not a second World Group, so deleting it could actually
delete the real authored object.

### New rule

- Procedural/generated biome scenery may wrap.
- Manually placed world assets never wrap.
- World Group members never wrap.
- World Group template instances never wrap.
- Puzzle-owned objects never wrap.
- Auto-authored river-bank dressing is local to its section and never wraps.

### Migration / safety

- Existing `sceneData.added` rows are migrated to `wrap:false` on load.
- `wrap:false` is now persisted explicitly on authored scene rows.
- `addObject()` contains a safety guard so `userAdded` or puzzle-owned content
  cannot wrap even if an older call path mistakenly requests it.
- Existing World Group membership/position data is not changed.

This should remove phantom authored assets without deleting or relocating the
real placements.
