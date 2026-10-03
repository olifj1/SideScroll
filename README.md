# SS-PATCH-1.0.107

Applies over `SS-PATCH-1.0.106`.

## World Group interaction correction

### Groups are locked by default
- In normal Environment Edit mode, assets that belong to a World Group can no longer be selected or moved individually.
- Tapping a grouped asset selects its World Group instead.
- Other World Groups stay locked while you work elsewhere.

### Edit Group now has a clear purpose
- `Edit Group` unlocks only the selected group's members.
- Individual members can then be selected, moved and edited normally.
- New assets placed while Group Edit is active automatically join the selected group.
- `Lock Group` exits member editing and returns the composition to locked whole-group behaviour.
- Standalone assets remain selectable while editing a group so they can be added with `Add Selected`.

### Direct whole-group movement
- Once a group is selected, drag any of its grouped assets, the yellow bounds, or the yellow origin dot to move the complete group.
- The group follows the existing terrain-aware movement rules:
  - Ground + Upright re-grounds but stays vertical.
  - Ground + Follow Surface Normal re-grounds and follows slope.
  - Free assets keep their group-relative vertical offset.
- The existing `Move Group` button remains available as an alternate tap-to-destination workflow.

This patch does not change World Lab or streaming behaviour.
