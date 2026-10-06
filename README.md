# SideScroll patch 1.0.124

Cumulative Stage 2A + exclusion interaction patch.

Apply over **v1.0.122 or v1.0.123**. This patch includes the v1.0.123 Puzzle Editor workspace plus the v1.0.124 exclusion-zone changes.

## Included

- Puzzle Editor v2 Stage 2A workspace: Contents / Zones / Logic / Setup in the unified left drawer.
- Puzzle contents list drives the existing Quick Tools and existing puzzle mechanics.
- World Group and Puzzle procedural exclusions no longer use perspective-sensitive centre/edge drag handles.
- Exclusion **Move** uses the same relative mouse-style screen-space mapping as authored assets:
  - drag anywhere in the free viewport;
  - horizontal finger movement moves along world X;
  - vertical finger movement changes scene depth;
  - lift/reposition the finger and continue from the zone's current position.
- Exclusion resizing moved to stable **Width** and **Length** sliders in the editor UI.
- World Group exclusion Move is one Undo action per drag; Width/Length slider gestures are one Undo action each.
- Puzzle exclusions use the same Move/slider interaction while retaining the current Stage 2A persistence model.
- Style and script cache-busters bumped to 1.0.124.

## Not yet included

- Full Puzzle Save / Discard edit sessions.
- Puzzle-wide central Undo / Redo.
- Final template / linked-instance Apply / Revert semantics.

## Validation

- All 14 JavaScript files syntax-checked with Node.
- No duplicate IDs in play.html.
- New exclusion slider IDs are present and wired.
- CSS brace structure validated.

Changed project files only: `play.html`, `style.css`, `sidescroll.js`, `SIDESCROLL_TASKS.md` plus this README.
