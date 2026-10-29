# Review folder

Files here are **not loaded by any page, script or data file** in the current
build (checked against v1.1.27). Nothing has been deleted: decide per item,
then either delete it or move it back to the project root.

## old-fox-art/
Earlier fox iterations superseded by `fox-deform-atlas-v2.png` (the atlas the
game and Character Lab use) and `fox-rig-atlas-v3.png`.

- `fox-deform-atlas-v1.png`, `fox-deform-body/front-*/rear-*/tail.png` — v1 deform atlas and its separate part images
- `fox-deform-bind-atlas-v181.png` / `-v182.png` + `-map.json` — v1.81/v1.82 bind atlas experiments
- `fox-bind-*-v1.png`, `fox-bind-*-v182.png` — older per-part bind images
- `fox-rig-atlas-v2.png`, `fox-rig-atlas-v5.png`, `fox-rig-guide-v1.png`, `fox-rig-map-v1.json`
- `fox-atlas-source-charcoal-v2.png` — source sheet; may be worth keeping as reference art

## unused-code/
- `anim-lab-assembly-gpu.js` — WebGL atlas compositor (v1.1.11). Not included by
  `walk-lab.html` and `window.AnimLabGpuAtlas` is never called. Keep if you plan
  to wire up GPU rendering for phone performance.
- `fox-reference-bind-v1.js` + `fox-bind-*-v3.png`, `fox-bind-v3-preview.png` —
  reference-bind data and the images it points to. The script is not included
  by any page, so the v3 images are only reachable through it.

## To restore a file
Move it back to the project root (same filename). No code paths were changed
for anything in this folder.
