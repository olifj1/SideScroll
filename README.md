# SideScroll patch 1.0.144

**Cumulative changed-files-only Anim Lab Stage 1 + Stage 2 patch over v1.0.142.**

Apply this ZIP directly over a working **v1.0.142** tree. You do **not** need to apply v1.0.143 first.

## What this cumulative drop contains

### Stage 1 — multi-rig Anim Lab shell

- Replaces the old human-specific Walk Lab workflow with the new multi-rig Anim Lab shell.
- Explicit Hero 1 / Hero 2 / Fox rig-family adapters.
- Character -> Clip -> Animate / Setup workflow.
- Editor-only character selection: inspecting Fox in Anim Lab does not change the gameplay-selected character.
- Bounded working-copy transactions with Undo / Redo / Save / Discard.
- Dirty-edit guards when changing Character, Clip, Mode or leaving for Home.
- Existing human animation storage is preserved; Fox editor animation data remains isolated.

### Stage 2 — Control Board, precision editing and setup references

- Large-tap anatomical Control Board instead of relying on tiny viewport bone picking.
- Human controls expose the channels authored by the current human clips.
- Fox controls expose body/root, body tilt, head/neck, all four upper/lower leg pairs, and tail base/mid/tip.
- Details panel, Near/Far Pair navigation, and Reset Selected Control.
- Precision touch pad with Move / Rotate, Fine mode and Free / X / Y constraints.
- One complete pointer drag is one Undo transaction; pointer cancellation restores the starting pose.
- Setup mode adds per-character editor scale and collider editing.
- Ground/ruler and Hero 1 ghost-reference overlays support scale comparison.
- Art / Bones / Planes / Collider views remain non-persistent reference tools.

## Runtime boundary

Fox clip edits remain in the isolated Anim Lab editor bank and are **not** consumed by gameplay yet. Sparse key poses/tweening, IK, curves and runtime animation integration are later stages.

## Files in this cumulative patch

- `index.html`
- `walk-lab.html`
- `walk-lab.js`
- `anim-lab-stage2.js`
- `style.css`
- `sw.js`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

These are the only files that differ between the supplied v1.0.142 baseline and the validated Stage 2 tree.

## Validation performed here

- Cumulative diff generated directly against the supplied v1.0.142 baseline.
- ZIP replayed over a clean copy of v1.0.142; the resulting tree matches the validated v1.0.144 tree byte-for-byte.
- JavaScript syntax checked across the complete resulting project tree.
- Static verification of multi-rig load order, rig/channel mappings, bounded drag transactions, editor/runtime character separation and offline shell inclusion.

Actual Safari touch feel, landscape layout and A2HS/offline behaviour still require the on-device pass below.

## Practical iPhone checks

1. Apply this single ZIP over v1.0.142 and launch SideScroll normally once online.
2. Open Anim Lab in landscape. Confirm Hero 1, Hero 2 and Fox can all be selected without changing the character selected in Play.
3. On Hero 1 Walk, select a hand or foot and use Move. Test Free / X / Y and Fine. Undo once: the whole drag should revert in one step; Redo should restore it.
4. Switch to Fox and test one front-leg segment, the head and one tail segment. Confirm the Control Board selection and highlight follow correctly.
5. Test Pair and Reset Selected Control.
6. Enter Setup. Adjust Scale and collider values, then test Undo / Redo / Discard. Repeat a small edit, Save, reload Anim Lab and confirm it returns.
7. Toggle Ground/Ruler, Hero 1 reference, Art, Bones, Planes and Collider. View-only changes should not make the document dirty.
8. Return to Play and confirm gameplay still uses the previously selected character.
9. After the online launch, reopen the installed A2HS version offline and confirm Anim Lab loads with the Stage 2 Control Board.

Stop at Stage 2 after this device review. Do not begin Stage 3 sparse key poses/tween/mirror/loop until the Control Board and precision-touch workflow are agreed on-device.
