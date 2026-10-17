# SideScroll patch 1.0.169 — Approved charcoal Fox deform atlas

Apply this patch **after 1.0.168**. This ZIP contains only files changed for 1.0.169.

## Purpose

1.0.168 proved the six-piece deform-art path, but the source pieces came from an exploratory intermediate sheet. This pass replaces that with one clean, deliberately packed atlas cut directly from the already-approved charcoal Fox reference.

## What changed

- Added **`fox-deform-atlas-v1.png`**: a 2048 × 1024 transparent deform atlas built directly from `fox-reference-charcoal.png`.
- The atlas contains six clearly separated regions: Body + Head, Tail, Front Near, Front Far, Rear Near and Rear Far.
- Front/rear far limbs are derived from the same approved source and slightly darkened for depth rather than being independently regenerated artwork.
- Near-leg roots use a soft overlap into the shoulder/hip so the next weighting pass can blend them into the body without exposing a hard rectangular cap.
- `anim-lab-mesh.js` now loads **one atlas** and uses explicit source rectangles for all six meshes instead of loading six unrelated PNGs.
- The M1.1 topology, twist-safe chain binding, 1.0.167 gesture-performance work, rig and animation clips are unchanged.
- The rigid Fox atlas remains the loading/failure fallback.
- Splash preload/service-worker caching now warms the single deform atlas and the preload cache name matches the current runtime cache.

## Why this is the cleaner foundation

The deform art now comes from one approved character source, so colour, fur treatment, scale and silhouette cannot drift independently between six generated images. The atlas is also the format we ultimately want for a reusable skinned-character asset: one texture plus region/mesh metadata.

## Next

The planned next pass is the bespoke Fox weighting pass: front shoulder into Front Body/Neck as appropriate, rear hip into Rear Body/Mid Root, plus tail-root and neck/body tuning. That remains deliberately separate so art problems and weighting problems can be judged independently.

## iPhone check

1. Anim Lab → Fox → Deform.
2. Check Idle/Walk/Run with Bones and Wireframe off first.
3. Compare the charcoal appearance with `fox-reference-charcoal.png` / the Rigid view.
4. Turn Wireframe on and isolate each region; geometry should be unchanged from 1.0.166.
5. Pay particular attention to the shoulder and hip joins. They are expected to improve further in the bespoke weighting pass, but there should be no stray source-sheet artefacts or unrelated artwork in any region.
