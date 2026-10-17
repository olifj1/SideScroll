# SideScroll patch 1.0.173 — clean Fox deform atlas rebuild

Apply this patch after 1.0.172. This ZIP contains only files changed/new for 1.0.173.

## What changed

- Added a completely rebuilt `fox-deform-atlas-v2.png` made only from the approved modular charcoal Fox sheet already produced in this chat.
- No pixels from the old rough deform atlas are reused in atlas v2.
- Body + head now come from the clean modular source, preserving the fuller snout and natural fur silhouette.
- Tail now comes from the clean standalone tail source only; the stray leg/stump contamination is gone.
- Front Near and Front Far are identical copies of the selected front leg (leg 2).
- Rear Near and Rear Far are identical copies of the selected rear leg (leg 3).
- Near/far copies are not darkened yet; that remains an optional later depth pass.
- Removed the temporary chain alpha-hardening step so the new source's natural feathered fur alpha is retained.
- Updated Anim Lab atlas rectangles for the new layout and bumped asset/script cache versions.
- Updated splash/service-worker preload references from atlas v1 to atlas v2.

## Files

- README.md
- fox-deform-atlas-v2.png
- anim-lab-mesh.js
- walk-lab.html
- home.js
- index.html
- sw.js

## Suggested check

1. Anim Lab → Fox → Deform.
2. Check Rig mode against Fox Shape reference: body/head should now be the clean modular source with the fuller snout.
3. Check the tail: it should be a clean standalone tail with no leg or hard old crop inside it.
4. Check all four legs: front pair should match each other exactly; rear pair should match each other exactly.
5. Run Walk and Run and judge registration/weights separately from art quality.

No rig keys or animation clips are changed by this patch.
