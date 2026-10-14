# SideScroll patch 1.0.153 — Anim Lab Stage 4 paw-contact IK

Changed-files-only cumulative patch over the agreed **v1.0.150** baseline. v1.0.150 remains the approved baseline until the later Anim Lab patches are tested and accepted. This patch therefore includes the v1.0.151 Rig Designer and v1.0.152 Anim Lab workflow/Fox-runtime work as well as the new v1.0.153 Stage 4 changes.

## What changes in v1.0.153

Anim Lab now has a bounded first quadruped FK/IK contact workflow for the Fox.

- Each of the four paws has a **Paw IK Target** in the normal Control Board.
- Paw targets use the existing bottom-right viewport precision pad, preserving the left-thumb select / right-thumb pose workflow.
- Each paw has a per-key **FK / IK blend** from 0–100%.
- **Capture FK → IK** captures the current FK endpoint and enables full IK without a visual jump.
- **Plant from Here** creates/continues a sparse-key ground anchor.
- **Release Here** ends the planted contact at that key; the prior planted interval stays held until the release boundary.
- **Target to Ground** is a quick flat-ground positioning helper.
- Moving a key that owns a plant start moves that plant phase with the key; continuation anchors retain their original contact phase.
- The two-bone solver preserves the saved rest-rig upper/lower limb lengths and chooses the knee/hock solution closest to the current FK pose.

All new IK weights default to zero. Existing v1.0.152 Fox clips therefore reproduce exactly until IK/contact is explicitly authored.

## Planted-paw behaviour

The sparse authored plant anchor is kept separate from the moving local target used to solve the leg. During a planted Walk/Run interval, Anim Lab counters the expected gameplay stride in rig-local X while retaining the authored contact height. This lets the body move/bob over a planted paw rather than dragging the paw with the torso.

On Save, Anim Lab still compiles to the existing **16-sample Fox runtime bank**. The compiled samples contain the phase-resolved IK target and blend values, and the Fox runtime geometry solves them continuously between samples. There is no second gameplay animation format.

Changing Fox Scale changes the local distance required to counter the fixed world stride. Anim Lab refreshes its preview after a Rig Scale Save; explicitly Save the affected animation again before judging the updated contact in Play.

## Ground Motion diagnostic

A new editor-only **Ground Motion** plane appears for Fox Animate mode.

- At **×1.00**, the moving datum represents the current Walk/Run gameplay stride at the saved Fox scale.
- Repeated ground marks make paw sliding easy to see while scrubbing or playing.
- A temporary **0.5–1.5×** display multiplier is available for diagnosis/comparison.
- Ground Motion visibility and speed are editor preferences only. They do not dirty animation data, enter Undo history or affect gameplay.
- Jump has no locomotion stride, so the datum remains static there.

## Existing Anim Lab features retained

The cumulative patch still contains:

- v1.0.151 descriptor-driven Fox Rig Designer and safe persisted rest rig;
- v1.0.152 unified viewport timeline + Key Pose lane;
- viewport right-thumb precision pad;
- collapsible Anim Lab sections;
- Motion Reference with linked/unlinked timing;
- sparse key poses, tweening, mirror/phase tools and 16-sample compilation;
- saved Fox Walk/Run/Jump playback in the real game with independent built-in fallback.

The 8-key reduction preview is intentionally disabled on a Fox clip once authored IK/contact data exists. That safeguard avoids silently flattening plant ownership.

## Practical iPhone test

1. Apply this cumulative patch over the v1.0.150 baseline and refresh/relaunch the PWA.
2. Open **Anim Lab → Fox → Walk → Animate**.
3. In the Control Board choose **Front Near → Paw IK Target**. Confirm you can select with the left thumb and move the target using the bottom-right viewport pad with the right thumb.
4. At any key pose, press **Capture FK → IK**. Confirm the FK/IK blend becomes 100% with no visible paw jump.
5. Drag the IK target. Confirm the upper/lower leg follows without changing the authored bone lengths or unexpectedly flipping the knee/hock in normal reachable positions.
6. Set the target where wanted and press **Plant from Here**. On the next stance key, Plant again to continue the same contact; later press **Release Here**.
7. Play/scrub the cycle with **Ground Motion** at ×1.00. A well-planted paw should remain visually fixed against the moving ground marks while the body passes over it.
8. While that paw is planted, adjust **Mid Root / Front Body / Rear Body** on a stance key. Confirm the torso can move while the paw remains constrained.
9. Test FK/IK blend at roughly 0%, 50% and 100%.
10. Test Undo/Redo, then Discard. Confirm the plant/target/blend state restores correctly.
11. Re-author a simple contact, **Save**, reload Anim Lab and confirm it returns.
12. Enter **Play** as Fox. Confirm the saved contact/IK animation is visible in the real game.
13. Test Mirror Key / Mirror Clip and phase-shift on a Fox clip containing contacts.
14. Change Ground Motion visibility/speed and confirm Save does not become enabled from those view changes alone.
15. Close/relaunch the A2HS PWA and confirm `anim-lab-stage4.js` is available offline after the service-worker update.

## Validation performed off-device

- All project JavaScript parses with `node --check`.
- With IK weights at zero, the new Fox rig reproduces every geometry point of all 48 v1.0.152 Walk/Run/Jump samples exactly.
- Capturing the current FK paw as a 100% IK target produces zero endpoint displacement.
- Moving an IK target preserves both upper and lower rest-bone lengths to floating-point precision.
- New IK/contact channels normalise to safe zero-weight defaults for legacy/built-in poses.
- Runtime clips remain 16 samples and retain independent built-in fallback.
- Authoring plant anchors and resolved local targets are stored/evaluated separately.
- Ground Motion is editor preference state only.
- Stage 4 does **not** add terrain-aware foot placement, full-body IK, graph curves or generalized constraints.

Physical iPhone testing is still required for touch feel, limb-flip edge cases, contact quality against the moving datum, Safari range gestures and final in-game visual judgement.
