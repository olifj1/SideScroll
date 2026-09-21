# SideScroll v0.2.86

Ground-dressing alpha cleanup and replacement.

- replaces all 12 `sidescroll-ground` textures with the newly approved grass-and-rock set
- keeps the image-generator native soft alpha and removes the old magenta-derived edge contamination
- dilates RGB only beneath fully transparent pixels, then tight-crops transparent padding for clean in-game edges
- updates ground-asset aspect metadata to the processed texture dimensions and cache-busts the new textures
- removes the obsolete missing dressing-atlas precache entry; no gameplay, puzzle, tree, character or placement-system changes
