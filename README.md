# SideScroll Patch v1.0.95

Changed-files-only patch over **v1.0.94**.

## Scene selection pass
- Repeated taps on the same screen point now cycle exhaustively through the full selectable depth stack rather than getting trapped between the front-most objects.
- Environment edit mode has a **Select Filter**: All, World Objects, Climb Rocks, Rock Dressing, Grass, Trees and Ground.
- The tap filter removes non-matching asset categories before hit testing, making dense scenes much easier to target.
- Invisible World Objects use a larger editor hit target and now show a centre marker.

## Placed World Assets
- Environment edit mode now includes a grouped **Placed World Assets** list for manually placed world-owned assets.
- Rows are grouped by the same high-level environment categories used by selection filtering.
- Tapping a row selects that object and focuses the editor horizontally on it.
- Procedural biome dressing is intentionally excluded from this list so it remains manageable.

## Shared World Objects
- Thought Node and Camera Node now live in one **World Objects** asset category.
- Both are available from Environment and Puzzle authoring.
- Environment placements belong to the world; Puzzle placements belong to the selected puzzle and move/save/reset with it.
- Puzzle-owned Camera Node radius/offset values are now included in puzzle runtime/start/template persistence.
- World-owned Thought Node text/radius/once settings are now included in scene persistence and runtime triggering.

## Deferred
- Environment object Groups are not included in this patch; the new scene-list/category structure is intended to support that next.
