# SS-PATCH-1.0.105

Applies over `SS-PATCH-1.0.104`.

## World Groups v2

### Terrain-aware group movement
- Ground-bound members now re-sample the terrain at their own new X/Z after the group moves.
- Each ground-bound member preserves its authored floor offset.
- Assets with `Follow Surface Normal` continue to tilt to the new local slope.
- Ground-bound assets without that behaviour stay upright (useful for houses, walls and similar architecture).
- Free-placement members keep their vertical offset relative to the group's local ground height.

### Reusable group templates
- `Save Group` stores the selected World Group as a reusable template.
- Templates keep member layout, scale, flip, collision state, ground/free placement rules, Thought Node data and Camera Node data.
- Select a template and use `Place Template`, then tap the scene to create a new independent World Group.
- Ground-bound members are re-grounded individually at the new location when a template is placed.
- Templates can be deleted without affecting groups already placed from them.

### Storage
Scene edit storage is migrated to v6 and now includes `worldGroupTemplates`.

Streaming remains deliberately separate and will be handled later as a global World Lab policy for standalone objects, World Groups and puzzles.
