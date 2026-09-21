# SideScroll v0.2.85

Fallen-tree silhouette/footprint correction.

- replaces the v0.2.84 fallen-tree art with the latest approved wide-silhouette version
- preserves the image-generator native soft alpha
- dilates RGB underneath transparent pixels only; the alpha channel is not regenerated or hardened
- removes transparent bottom padding so the visible asset is genuinely floor-aligned
- restores the proven pre-art-pass fallen-tree dimensions: 6.029 wide × 2.55 high
- migrates existing authored starts, puzzle templates and runtime puzzle state back to that footprint
- keeps the existing fallen-tree collision data unchanged
- no log, wall, stone, environment, fog or gameplay-system changes
