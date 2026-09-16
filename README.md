# SideScroll v0.2.6

- Reworks Edit-mode controls to activate directly on pointer-down instead of relying on iOS synthetic click events.
- Removes the editor-container pointer suppression that could leave visible controls unresponsive on iPhone.
- Applies the same touch-first input path to puzzle controls, object tools, asset buttons and puzzle object-list actions.
- Keeps the existing canvas guard so touches beginning inside editor UI cannot start a world pan.
