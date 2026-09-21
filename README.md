# SideScroll v0.2.69

Ground-dressing scale and baseline correction.

- reprocessed the new grassy rock set with a stricter magenta-key soft-alpha pass
- removed the large residual magenta canvas that was making the visible artwork tiny inside each plane
- colour-dilated RGB under the transparent edge to avoid magenta fringes
- rebuilt each dressing atlas rectangle to match the real aspect ratio of its artwork
- anchored visible pixels flush to the billboard baseline so rocks and grass no longer hover
- retained all eight new art variants, with four mirrored variants filling the existing 12 procedural slots
- no tree, fog, puzzle or control changes in this build
