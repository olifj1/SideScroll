# SideScroll patch 1.0.174 — Fox reference bind foundation

Apply this patch after 1.0.173. This ZIP contains only files changed/new for 1.0.174.

## What this stage does

This deliberately resets the Fox skin workflow around the authoritative `fox-reference-charcoal.png` rather than trying to repair the generated deform atlas.

- Adds a reference-pixel bind definition (`fox-reference-bind-v1.js`).
- Fits the Anim Lab Fox rest rig directly to the reference image.
- Mechanically cuts the *existing reference pixels* into four visible planes:
  - body + head
  - tail
  - rear near leg
  - front near leg
- No image generation or repainting is used in these planes.
- The four planes retain their original reference-image coordinates.
- Their neutral reconstruction has **0 changed visible pixels** versus the source reference.
- Anim Lab Skin Prototype now starts with **Bind Proof: On**. In this mode the cut planes are reassembled in source-pixel space, so the viewport shows the exact reference silhouette while the fitted rig can be inspected over it.
- Turning Bind Proof off enters the current deform-mesh experiment using these exact source planes instead of the old redrawn/fitted deform atlas.
- The old `fit:{scaleX,scaleY,...}` deform-atlas resizing path is no longer used for the reference planes.

## Intentionally not done yet

This is the exact-reference foundation only.

- Hidden pixels behind the leg/tail cuts have not been painted yet.
- Far-leg art has not been generated/duplicated into the deform skin yet.
- Existing Walk / Run / Jump animation keys have not yet been retargeted to the new bind rig.
- The gameplay Fox is not switched to this bind yet; the change is isolated to Anim Lab so the current game build is not destabilised while the new skin is proven.
- No production atlas has been made yet. That comes *after* the bind reconstruction is accepted.

## Next intended stage

1. Approve/tweak plane boundaries and fitted joints against Bind Proof.
2. Pack these exact pieces into the final atlas layout without resizing them.
3. Mark protected source pixels vs missing/repair pixels.
4. Use Image Gen only to fill missing hidden material / produce the far-leg variants, then composite generated pixels only into the allowed repair areas.
5. Re-run the reference reconstruction check before mesh weighting and animation retargeting.
