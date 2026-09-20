# SideScroll v0.2.63

This build brings the new foliage / rock dressing set into game and turns the procedural dressing pass back on.

Changes in this version:
- replaced the ground dressing atlas with the new cel-shaded bushes, grasses and rocks
- processed the new dressing sprites to soft alpha + dilated edges for cleaner in-game compositing
- re-enabled procedural path-edge dressing using the updated asset set
- tuned procedural dressing placement to stay reasonably large, avoid tight repeats and fill both near-side and far-side path edges more densely
- kept the existing tree pass and fog behaviour from the previous build
