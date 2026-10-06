# SideScroll patch 1.0.126

Stage 2 editor interaction-isolation polish.

## Changes

- World Group and Puzzle workspace tabs now act as real editing filters, not just different panel views.
- World Group members are selectable/manipulable only from `Contents` while a Group Edit session is active.
- Puzzle objects are selectable/manipulable only from `Contents` while the Puzzle workspace is active.
- Entering World Group `Exclusions` / `Group`, or Puzzle `Zones` / `Logic` / `Setup`, clears any live asset selection and therefore removes its Quick Tools until returning to `Contents`.
- Puzzle/Group assets stay visible in specialist tabs for visual context; they simply cannot steal taps or drags.
- Tapping a World Group exclusion row now selects that exact zone and recentres the authoring camera on its world position.
- `SIDESCROLL_TASKS.md` documents the new tab interaction-ownership rule for reuse by later editor contexts.

## Apply

Changed-files-only patch. Apply over SideScroll 1.0.125.
