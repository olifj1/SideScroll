# SS-PATCH-1.0.161

Cumulative changed-files patch intended to apply over the approved v1.0.150 baseline. v1.0.161 is a deliberately narrow **Full-chain Fox IK** correction built forward from the supplied cumulative v1.0.160 patch.

## What changed

- Fox Paw Target IK now solves the complete Socket → Knee/Elbow → Wrist/Hock → Paw chain.
- The final Wrist/Hock → Paw section is no longer re-attached as a fixed pre-rotated vector after a two-bone solve.
- Wrist/Hock Angle remains the preferred distal shaping/orientation control, but it now yields when that locked direction would prevent the Paw Target reaching farther.
- As a Paw Target approaches maximum reach, the preferred Wrist/Hock bend progressively relaxes toward zero, allowing the whole leg to become effectively straight.
- The existing explicit near/far anatomical knee branch is retained to avoid reintroducing knee/hock solution flipping.
- Bone lengths, promoted v1.0.159 rest rig, current authored animation keys, Quick Play and Walk/Run speed settings are not migrated or rewritten by this patch.
- Fox handoff remains one JSON file and is versioned `SS-FOX-RIG-ANIM-1.0.161.json`.
- Service-worker cache is bumped to `sidescroll-runtime-v15`.

## Important authoring behaviour

This is a solver change, so existing Fox animations may look slightly different wherever Paw Target IK is active. That is intentional: the distal joint now participates in reach instead of keeping its previous fixed orientation. Authored key/channel values themselves are not modified.

The v1.0.159 authoring baseline ID is intentionally unchanged. Applying v1.0.161 must not reset or replace Fox animations already saved in the browser.

## Suggested iPhone test

1. Apply this cumulative patch over the normal SideScroll baseline/repository and reload/A2HS relaunch.
2. Open **Anim Lab → Fox → Animate** and choose a Walk or Run pose with Paw Target IK active.
3. Select **Front Near → Paw Target** and drag the target outward along the leg direction.
4. Confirm Elbow and Wrist both open progressively and the complete front leg can become almost straight at full reach.
5. Repeat with **Rear Near → Paw Target** and confirm Knee and Hock both open progressively.
6. Repeat on far-side limbs and confirm no knee/hock suddenly flips to the opposite solution.
7. Move a Paw Target back inward and confirm the preferred Wrist/Hock bend returns smoothly rather than snapping.
8. Adjust **Wrist Angle / Hock Angle** and confirm it still shapes the lower limb when there is room, while a near-max-reach Paw Target can still straighten the chain.
9. Enter **Play** and verify existing Walk/Run/Jump animations, Quick Play movement and saved Walk/Run speeds still work.
10. Save an animation change, relaunch, and confirm the current authored Fox data has not been reset by the patch.
11. Export **Fox Handoff** and confirm it remains a single `SS-FOX-RIG-ANIM-1.0.161.json` file.

## Validation performed here

- JavaScript syntax checks on all modified runtime/editor JS.
- Analytic IK extension test for all four Fox legs.
- Full extension preserves all three rest-rig bone lengths and reaches essentially zero distal bend.
- Reach sweep from 55% to 100% confirms progressive Wrist/Hock straightening.
- Reach sweep confirms front and rear anatomical knee branches retain their configured side with no branch flip.
- Existing Fox authoring baseline data file was not changed.
- HTML dependency/cache-version and duplicate-ID checks are included in release validation.

A real iPhone Safari/A2HS touch test has **not** been performed here. On-device acceptance is required before treating v1.0.161 as approved.
