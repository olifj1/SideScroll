# SideScroll — v1.1.1 Atlas display tidy-up

**Install over v1.1.0** (which itself requires v1.0.205). Changed-files-only ZIP: replace only the included files at the GitHub Pages repository root. Do not revert to v205 or replace any art images. Service-worker cache increments to `sidescroll-runtime-v111`.

## Changes

- Atlas → Transparent pixels has **Dark background** (new default) and **Checkerboard** preview settings; switching does not edit the image alpha, meshes or character Save state. Preference stored locally at `sidescroll.animlab.atlas-view.v1`.
- The shared **Display** panel is hidden only in Atlas, reinstated when switching to Parts/Rig/Skin/Animate/Play. Existing Display settings and listeners are preserved.
- Selected mesh uses a thin gold wireframe, without translucent face overlay or extra-thick edges; all mesh edges are drawn once. Vertex handles show only while the **Vertices** tool is active and are smaller. Legacy Fox geometry, vertices, rig and bind data remain unchanged.

## Art persistence caveat

The **PNG atlas** file chooser introduced in v1.1.0 still imports a PNG from the phone into local IndexedDB storage and persists it after Save on that device. Image bytes **do not** yet travel with character exports or global project backup, and the editor currently cannot load a new GitHub PNG by typing its path. Imported atlas images and newly authored meshes do not yet flow to Parts/Skin or game runtime. Keep the original PNG. This patch does not attempt to implement portable art export or GitHub texture selection; these remain tracked tasks.

## Checks

Node parser validation on Atlas/UI/SW and lightweight browser test for panel visibility, backdrop preference, selection stroke properties and unaffected character state. Safari/iPhone final acceptance remains for user testing.
