# SideScroll patch 1.0.166 — Deformable mesh topology cleanup

Apply this patch **after 1.0.165**. This ZIP contains only files changed for 1.0.166.

## Purpose

Stage M1.1 keeps the encouraging deformable Fox result from 1.0.165 but replaces the prototype's broad source-plane topology with geometry that follows the visible artwork. It also addresses the leg twisting seen during locomotion before any weight-editing UI is built.

## What changed

- Mesh source textures are now cropped to their actual opaque artwork before topology is generated. Transparent atlas margins no longer create huge invisible planes.
- **Body + Head** uses a tighter low-poly grid and discards cells that contain no visible pixels.
- **Tail and all four legs** now use narrow chain-aligned strip meshes following their existing bone chains rather than rectangular grids over the whole part bounds.
- Limb/tail cross-sections are sampled from the actual composited texture, so the strip follows the artwork width instead of an arbitrary rectangle.
- Long appendages use a twist-safe chain binding: each cross-section keeps a consistent left/right order while the bone chain bends. This removes the main source of the visible leg twisting in the Stage M1 generic two-weight grid.
- Wireframe rendering draws unique mesh edges once rather than repeatedly outlining every triangle.
- Added **Inspect: All / region** cycling beside Mesh Wireframe so a single body, tail or leg mesh can be isolated when checking deformation.
- Rigid/Deform remains an editor-only comparison. No current rig, animation keys or gameplay rendering are changed.

## What this stage is testing

The question is now whether a small number of clean, purpose-shaped meshes are a better foundation than the original broad auto-weighted planes. If the result remains visually good and the limbs no longer twist, Stage M2 can build persistent topology and skin-weight editing on top of this cleaner representation.

## iPhone test

1. Apply over 1.0.165 and reload the PWA.
2. Anim Lab → Fox → Walk, switch to **Deform**.
3. Enable **Mesh Wireframe**. The mesh should hug the Fox instead of exploding across the viewport.
4. Tap **Inspect: ...** to cycle through Body + Head, Tail and each leg individually.
5. Play Walk and Run and watch the legs around the shoulder/hip, knee/elbow and wrist/hock. The strip should bend without visibly twisting/flipping its texture.
6. Try exaggerated Paw Target positions and Jump as a stress test.
7. Compare Rigid ↔ Deform with wireframe off for the actual visual result and check iPhone responsiveness.
