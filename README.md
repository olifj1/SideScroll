# SideScroll v0.2.21

- Fixes Scene puzzle rows so they can be reliably tapped and selected on iPhone; the list is no longer rebuilt every animation frame.
- Scene selection is now passive: tapping a row highlights it and shows contextual details without moving the camera or instantiating the puzzle.
- Adds an explicit **Edit Puzzle** action for the selected Scene puzzle.
- Restores **Focus**, **Test**, **Export**, save relationship controls, and **Remove from Scene** where applicable as contextual actions for the selected marker.
- Selected Scene rows clearly show their `INSTANCE` / `COPY` type and marker X position, while the details panel shows whether the puzzle is merely selected or actively being edited.
- Focus can now move directly to a selected marker even before that puzzle has been activated for editing.
