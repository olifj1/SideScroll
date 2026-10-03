# SideScroll Patch v1.0.104

Changed files only over **v1.0.103**.

## World Groups v1

Adds optional grouping for manually authored Environment objects. Standalone objects remain fully supported.

### Workflows
- **New Group** creates a group and immediately enters Group Edit mode.
- While Group Edit is active, every newly placed Environment asset automatically joins the selected group.
- Select a manually placed world asset and use **Add Selected / Remove Selected** to change its membership.
- Select a group from the World Groups list, then **Edit Group / Finish Group** to control automatic ownership.
- **Move Group** then tap a new world position to translate the whole composition together.
- **Rename** changes the group label.
- **Dissolve** removes only the grouping; all child assets remain in place as standalone world objects.

### Editor feedback
- Automatic group bounds are shown in the scene.
- The active group shows an origin marker/name and member count.
- Placed World Assets rows display their group name.

### Storage/export
- Scene edit data migrates to version 5 with `worldGroups` and per-object `worldGroupId`.
- Existing v2–v4 saves migrate without changing their authored objects.
- Complete design export includes group ownership.

### Not in v1
- reusable group templates / group library
- group duplication
- group-owned exclusion zones or manual bounds
- streaming. A later World Lab Streaming panel will apply universal load/unload margins to groups, puzzles and standalone authored objects.
