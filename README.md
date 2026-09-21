# SideScroll v0.2.73

Tree rendering and fog inspection pass.

- stopped horizontal mirroring for all tree planes so authored lighting direction is preserved
- removed the green-biased runtime tint from environment art so texture colours stay closer to the source files
- added a live Fog panel: enable/disable, colour, start distance, curve and amount, plus reset
- rebuilt the tree atlas at 4096×4096 with 992×1318 pixels per tree instead of 486×646
- the atlas now retains roughly twice the linear tree resolution while keeping the same eight source trees
- no placement or gameplay changes in this build
