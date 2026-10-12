# SideScroll patch 1.0.148

Corrective changed-files-only patch over **v1.0.147**. No Stage 4 / IK work is included.

## Fix

Anim Lab Setup sliders no longer depend on Mobile Safari delivering an intermediate `input` event. On every normal native range end path (`pointerup`, `change`, `blur`, or `pointercancel`), Anim Lab now explicitly reads the range control's final DOM value into the Setup working copy **before** committing the edit transaction.

This specifically fixes the observed iPhone case where **Scale visibly moved but Anim Lab stayed Saved and the Save button remained disabled**.

The existing iPhone safe-area correction from v1.0.147 remains unchanged.

## Files

- `anim-lab-stage2.js` — authoritative final-value sync for Setup range controls.
- `walk-lab.html` — cache-busts the corrected Stage 2 controller.
- `SIDESCROLL_ENGINE_UX_BIBLE.md` — records the native-range final-value rule.
- `SIDESCROLL_TASKS.md` — records the corrective release.
- `README.md` — this file.

## Validation performed

- `anim-lab-stage2.js` passes `node --check`.
- All JavaScript files in the reconstructed v1.0.148 project pass syntax validation.
- An isolated interaction harness deliberately changed Scale and fired **only `change`** (no `input` event). The working Setup scale changed from `1.00` to `1.73` and the transaction became dirty, validating the exact missing-event path reported on iPhone.
- Patch replay over a clean reconstructed v1.0.147 tree is checked against the validated v1.0.148 tree.

## iPhone check

1. Open Anim Lab -> Fox -> Setup.
2. Move **Scale only**.
3. The header should immediately become **Unsaved** and **Save** should enable by the end of the slider gesture.
4. Tap Save.
5. Open Play and confirm the Fox uses the saved scale.

If step 3 still fails on-device, do not continue into Stage 4; capture exactly whether the numeric Scale readout changes while dragging and whether it remains changed after lifting your finger.

## v1.0.149 — Anim Lab mode visibility correction
- Fixes Character Setup controls remaining visible while Anim Lab is in Animate mode.
- Restores the intended single active editing context: animation controls in Animate, character Scale/Collider controls in Setup.
- This also fixes the apparent Scale/Save failure: Scale changes made in Setup now participate in the Setup dirty checkpoint and enable Save.
- No animation, rig, collider, or saved-data format changes.
