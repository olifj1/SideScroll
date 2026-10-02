# SideScroll Patch v1.0.97

Changed-files-only patch over **v1.0.96**.

## Camera Node curve controls
- Replaces the separate Ease In / Ease Out duration controls with **Start** and **End** curve controls.
- Both entering and leaving a Camera Node use the same two-ended transition curve.
- **Start** controls how quickly the move leaves its current framing.
- **End** controls how quickly the move arrives and settles at its destination.
- Centre is approximately linear; moving toward **Slow** softens that end, while moving toward **Fast** makes that end more immediate.
- Camera transitions remain monotonic and do not overshoot.
- Existing Camera Nodes without the new curve values fall back to neutral / linear endpoints.
- Keeps the v1.0.96 drill-in editor-panel behaviour.
