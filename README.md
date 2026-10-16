# SideScroll patch 1.0.165 — Deformable skin prototype Stage 1

Apply this patch **after 1.0.164**. This ZIP contains only files changed for 1.0.165.

## Purpose

This is deliberately a proof-of-concept before the wider Character/Anim Lab generalisation. The goal is to find out whether low-poly 2D skinning is the right visual/runtime direction on the current Fox before building character creation, reusable skin assets or a weight editor around it.

## What changed

- Added an Anim Lab **Skin Prototype** section for the Fox.
- **Rigid / Deform** switches between the existing cutout renderer and the new skinned preview.
- Deform mode rebuilds the current atlas at bind pose into six temporary regions:
  - Body + Head
  - Tail
  - Front Near leg
  - Front Far leg
  - Rear Near leg
  - Rear Far leg
- Each region is a deliberately low-poly triangle mesh.
- Initial vertex weights are generated automatically from distance to the approved bones and limited to the two strongest influences.
- Limb regions use complete Socket→Knee/Elbow→Wrist/Hock→Paw chains, so the texture can bend through joints rather than rotating three separate rigid planes.
- The Body + Head region is influenced by Rear Body→Mid Root→Front Body→Neck→Head.
- The Tail is influenced by its three existing tail segments.
- **Mesh Wireframe** can be enabled to see the actual topology moving.
- The mesh preview uses the current working rig/animation pose, so it can be evaluated in Animate, Rig and Quick Play.
- No animation keys, rig data, atlas files or gameplay character rendering are changed by this prototype.

## Important Stage 1 limitations

- This is **automatic weighting only**. There is no weight editor yet.
- It reuses/composites the current rigid Fox atlas, so old cut seams are still baked into the source art. The purpose is to evaluate deformation, not final artwork quality.
- Gameplay outside Anim Lab still uses the rigid renderer. Runtime integration comes only if the prototype proves worthwhile.
- Body/Head is one skinned region, tail is separate, and each complete leg is a separate skinned region. This matches the intended hybrid layout without prematurely building a general skin-authoring UI.

## iPhone test

1. Apply over 1.0.164 and reload the PWA.
2. Open Anim Lab → Fox.
3. In **Skin Prototype**, switch between **Rigid** and **Deform** while playing Walk and Run.
4. Turn **Mesh Wireframe** on briefly and check that vertices bend around the shoulder/hip, knee/elbow and wrist/hock rather than behaving as rigid rectangles.
5. Check Jump and extreme Paw Target poses too.
6. Try Quick Play and watch for performance/flicker as well as visual quality.

The main decision after this drop is whether the approach is visually promising and fast enough to justify Stage 2: editable mesh topology + skin weights.
