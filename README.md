# SideScroll v0.2.84

Puzzle art integration pass.

- replaced the fallen tree, stone wall, triangle stone, arch stone and hexagon stone with the approved unified art
- replaced the carryable log set with the two approved log designs
- all new puzzle art uses the image generator native alpha; the alpha is preserved exactly
- RGB colour is dilated underneath transparent pixels to protect linear-filtered edges without magenta keying or fringe contamination
- updated puzzle texture aspect ratios and fresh-placement scales
- added a one-time migration that removes old non-uniform stretching from existing authored puzzle layouts and disables flips on the new directional art
- fallen tree is scaled up uniformly to remain a substantial gameplay obstacle
- stone wall remains a large puzzle feature while using its native proportions
