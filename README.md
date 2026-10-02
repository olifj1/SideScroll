# SideScroll Patch v1.0.96

Changed-files-only patch over **v1.0.95**. This revised build supersedes the earlier v1.0.96 drop.

## Focused object editor workspace

- Camera Node settings replace the main Environment/Puzzle panel instead of opening as a second floating panel.
- Thought Node settings use the same drill-in behaviour for consistency.
- Closing the focused node editor restores the previous Environment/Puzzle authoring panel.

## Camera Node easing

- Added per-node **Ease In** and **Ease Out** sliders.
- Range: 0.2–8.0 seconds; existing nodes default to 2.0 s in / 2.0 s out.
- Ease In controls how gently the node takes over the camera after entering its radius.
- Ease Out controls how gently the camera returns to normal after leaving the radius.
- Values are saved for both world-owned and puzzle-owned Camera Nodes and survive duplicate/save/reset workflows.
- Camera Node movement remains an additive render-only offset, so player position, collision, normal follow, streaming and saves are unaffected.
