# SS-PATCH-1.0.163

Cumulative changed-files patch intended to apply over the approved v1.0.150 baseline. v1.0.163 is a focused **Jump authoring cleanup** built forward from v1.0.162.

## What changed

- Jump authoring no longer applies a synthetic sine-wave vertical lift to the Anim Lab viewport. The Fox now stays in one stable local coordinate system while you pose the Jump clip.
- The real Ground / Ruler datum therefore stays fixed at local `Y = 0` while authoring Jump instead of travelling up and down with the preview.
- The moving **Ground Motion** diagnostic is now Walk/Run-only and is hidden for Jump. It remains available for checking locomotion paw slip where it is useful.
- Smooth Jump interpolation no longer clamps Paw Target Y back to the local ground plane between authored keys. Airborne paws may pass below local `Y = 0`, eliminating the previous key-to-key paw snap/flick caused by the clamp.
- Quick Play still owns the physical jump trajectory. When you press Jump in Quick Play, gameplay-style vertical motion lifts the whole Fox while the Jump clip supplies only the body/limb pose.
- Walk, Run, gait transitions, speed tuning, full-chain IK constraints, charcoal artwork and authored Fox animation keys are otherwise unchanged.
- The persistent Fox authoring-baseline ID remains `fox-authoring-baseline-1.0.159`, so installing this solver/editor patch does not intentionally reset saved animation work.
- Fox Handoff remains one JSON file and is versioned `SS-FOX-RIG-ANIM-1.0.163.json`.
- Service-worker cache generation is `sidescroll-runtime-v17`.

## First iPhone test

1. Apply this cumulative patch and launch once online so cache v17 is installed.
2. Open **Anim Lab → Fox → Jump → Animate**.
3. Scrub/play the Jump. Confirm the ground/ruler line remains fixed instead of rising and falling with the Fox.
4. Confirm the separate **Ground Motion** section/diagnostic is absent while Jump is selected, but still appears for Walk and Run.
5. Pull one or more Paw Targets below local `Y = 0` on two neighbouring Jump keys, then play/scrub between them. Confirm the paw remains below the datum smoothly instead of snapping back to ground between keys.
6. Move the body independently through the Jump keys and confirm Paw Target editing no longer feels compressed by a moving coordinate origin.
7. Enter **Play**, trigger Jump and confirm the Fox still travels vertically through the Quick Play physics while using the authored Jump pose.
8. Recheck Walk and Run briefly to ensure Ground Motion and the v1.0.162 gait transition still behave as before.
9. Relaunch Anim Lab and confirm your saved animation work remains present.

## Validation performed here

- JavaScript syntax checks on the cumulative patch JS files.
- Direct Fox sparse-evaluator test confirming Jump `IkY` may remain below local ground between keys while the Walk/Run floor clamp is retained.
- Static check confirming Animate/Jump no longer offsets `groundY`; Quick Play remains the only path that applies physical `localLift`.
- Static check confirming Ground Motion rendering/UI is restricted to Walk/Run.
- HTML dependency and duplicate-ID checks.
- Service-worker/cache/version-reference consistency checks.

A real iPhone Safari/A2HS touch test has **not** been performed here. On-device acceptance is required before treating v1.0.163 as approved.
