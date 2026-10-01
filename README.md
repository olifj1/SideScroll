# SS-PATCH-1.0.89

Base: SS-PATCH-1.0.88

Environment placement reliability fix.

- Gameplay-layer environment assets now calculate tap X directly on the gameplay plane before placement, so large mountain cliffs appear where tapped instead of being projected from a distant terrain-depth hit.
- Free-depth dressing keeps terrain/depth placement.
- Added a safety fallback for near-horizon taps so invalid or extreme ground-ray intersections cannot spawn dressing far offscreen.
- No environment object-list UI added in this patch; placement remains the lightweight paint-style workflow.

Changed files:
- sidescroll.js
- play.html
