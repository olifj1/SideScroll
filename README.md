# SS-PATCH-1.0.201 — Current Fox starter & workspace stability

**Install directly over v1.0.200.** Contains only files changed by this release. Keep your v200 files as a rollback. Do not clear Safari website data; that holds existing Fox and custom-character saves.

## Updates

- **New quadrupeds now copy the user's current Fox export (20 Oct 2026, 06:47 UTC)** instead of the old shipped starter. The new file `anim-lab-fox-starter.js` stores that versioned authoring snapshot: rest rig, art rest rig, skin bind rig, artwork transforms/order, weights, scale/collider/speeds and the exact sparse Idle, Walk, Run and Jump clips. A newly created character has its own independent local saved copy. Built-in Fox, the previous `New01`, and all other existing local characters stay unchanged. Biped starter unchanged. The image textures remain the shipped Fox textures and are NOT part of the exported JSON.
- **Mode consistency:** Parts/Rig/Skin Rest use the same zero-motion neutral pose rather than mixing the Fox Idle pose with the mesh bind pose. Skin enters in Rest instead of automatically showing Walk; Walk/Run remain available for pose tests. This removes a mode-dependent visual shift without altering any saved authoring data. The user's exact cumulative drift was not reproduced in the desktop harness, so on-iPhone confirmation is still needed.
- **Two planes layers in Display:** the existing **Planes** button is renamed **Rigid Planes** and the new **Deform Planes** button outlines the actual deforming mesh regions. Both toggle independently and leave the detailed Mesh Wireframe available under advanced controls. These are view-only and don't dirty the character.

## iPhone test

1. Install on top of v200, open **New01**, toggle Parts/Rig/Skin/Animate repeatedly and return to Parts; artwork should return to exactly the same places. Skin opens at Rest; select Walk/Run to test deformation.
2. Expand Display; enable **Deform Planes**. The orange dashed boundaries should follow the deformable part shapes; **Rigid Planes** is independent and can be switched off.
3. Create **a new test quadruped**. Unlike the older `New01`, this should start with the current saved Fox's layout/rig/skin and animation clips. Load the built-in Fox and back. Verify neither is overwritten. Save/reopen the new test character.

## Verification & boundaries

Node syntax checks passed. Chromium with real Fox texture and current Fox export verified matching Setup and all 4 sparse clip keys in the newly created character, no dirty/rig/layout mutation, byte-identical Parts canvas screenshots after 3 full workspace cycles, and Deform Planes toggle and on-canvas boundaries. The exact iPhone issue may still require follow-up if it persists. No gameplay character chooser or runtime skin integration in this patch.

**Changed files:** README.md, walk-lab.js, anim-lab-fox-starter.js (new), anim-lab-mesh.js, anim-lab-character-library.js, walk-lab.html, sw.js, and the three canonical documentation files. No PNG, atlas, existing game engine or clip asset modifications.
