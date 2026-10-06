# SideScroll patch 1.0.127

Shared walk-surface placement correction.

## Changes

- Manual/authored Ground placement now uses the same authored Support Surface collision concept as player walking instead of terrain height only.
- Grounded standalone assets, World Group members and Puzzle-authored objects can therefore sit on climbable-rock tops, bridge/platform collision and other valid Support Surfaces.
- Initial manual placement can resolve a tap near a visible support top onto that collision rather than always shooting through to terrain behind it.
- Relative mouse-style dragging is unchanged: finger movement still controls X/Z in screen space; only the resolved Ground height changes.
- Ground/Free, Position, Scale, Floor Line and Duplicate preserve local floor offset relative to the current manual placement surface.
- Authored Follow Surface Normal can follow an authored support profile.
- Procedural biome placement remains strictly terrain-only. Authored rocks/platforms do not become procedural spawn surfaces.
- No implicit parent/support binding is created; this is a placement query only.
- `SIDESCROLL_TASKS.md` documents the authored-vs-procedural surface split and the deliberate no-hidden-parenting rule.

## Apply

Changed-files-only patch. Apply over SideScroll 1.0.126.
