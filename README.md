# SideScroll patch 1.0.168 — Dedicated deformable Fox art

Apply this patch **after 1.0.167**. This ZIP contains only files changed/new for 1.0.168.

## Purpose

Stage M1.2 keeps the clean M1.1 topology and replaces the temporary rigid-atlas reconstruction with source artwork made as complete deformable regions. This is the visual-art proof before the bespoke Fox weighting pass.

## What changed

- Added six new transparent deform source images:
  - `fox-deform-body.png`
  - `fox-deform-tail.png`
  - `fox-deform-front-near.png`
  - `fox-deform-front-far.png`
  - `fox-deform-rear-near.png`
  - `fox-deform-rear-far.png`
- The new source pieces were derived from a continuous generated Fox art pass and brought back to the approved charcoal/cream direction. The tail remains dark rather than using a bright white tip.
- Anim Lab Deform now loads these dedicated pieces and fits them to the existing approved bind-space regions.
- The topology itself is unchanged from 1.0.166: alpha-aware Body + Head grid plus twist-safe Tail/leg chain strips.
- The rigid atlas remains an automatic fallback while the dedicated art is loading or if an image fails.
- New art is versioned/preloaded for the offline PWA.
- No rig, animation keys, movement settings, topology or saved authoring data are rewritten.

## Why this stage is separate from weighting

This drop isolates the **source-art** variable. If the joins still need improvement after the continuous pieces are in place, v1.0.169 can tune the Fox's shoulder/hip/body weighting without us wondering whether a visual problem came from the texture split or the weights.

## iPhone test

1. Apply over 1.0.167 and reload the PWA.
2. Anim Lab → Fox → Walk → Deform.
3. Compare Rigid ↔ Deform with Bones/Wireframe off first; judge the actual silhouette and joins.
4. Play Walk and Run and watch neck/body, shoulder, hip and tail root.
5. Turn Wireframe on and isolate each region to confirm the clean 1.0.166 topology is unchanged.
6. Pinch/pan while zoomed in and confirm the 1.0.167 camera optimisation still feels good.
7. Note any shoulder/hip areas that still look detached; those are the targets for the bespoke weighting pass next.

## Validation performed here

- JavaScript syntax checks on changed JS.
- HTML duplicate-ID check.
- New PNG alpha/size validation.
- Service-worker/preload references checked.
- ZIP integrity checked.

No claim is made that the final visual result has been validated on iPhone Safari/A2HS; that remains the acceptance test.
