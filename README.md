# SideScroll — v1.1.14 interactive IK drag responsiveness

**Install over:** v1.1.13. This ZIP contains only files changed for v1.1.14; it is not a complete game build. Keep existing project files and saved browser data.

## This drop

- Paw/foot IK precision-pad dragging in **Animate** now previews a temporary pose without recompiling a sparse animation clip for every touch movement, repeatedly scanning save state, updating the whole editor or notifying all Lab listeners.
- Multiple touch samples are coalesced into one redraw per animation frame. A final pointer position is applied at release even if that frame was not rendered.
- On release, the final pose is written to the clip once, as a single Undo/Redo action. Pointer cancellation leaves the authored clip unchanged.
- Dragging an IK target pauses animation playback, so the preview is the pose being edited. Channel values still display while dragging.
- No changes to Atlas art, mesh triangles, Skin weights/envelopes, Parts, Rig, stored binding format or the shared Canvas2D renderer.

**Status:** JavaScript checks and synthetic DPR2 landscape Chromium drag/Undo/Redo/Cancel tests passed. Performance and usability against the actual New01 Atlas character in iPhone Safari remain unverified; drawing its textured, deformable meshes may still be the limiting cost. Test the same paw drag at Fit and at ~225% zoom, including a short drag followed by Undo and Save.

See `README-PATCH-1.1.14.md` for release-specific implementation and test notes.
