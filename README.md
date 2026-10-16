# SS-PATCH-1.0.162

Cumulative changed-files patch intended to apply over the approved v1.0.150 baseline. v1.0.162 is a focused **Fox joint constraint + phase-aware Walk/Run transition** pass built forward from v1.0.161.

## What changed

- The v1.0.161 full-chain Paw IK keeps its existing primary knee/elbow branch lock, and the released Wrist/Hock solution now also keeps a deterministic anatomical side at extreme reach. The two valid release-circle solutions are no longer allowed to swap merely because the other one becomes fractionally closer to the preferred distal angle.
- Walk and Run are no longer permanently blended at the same normalized phase for the Fox.
- Crossing from Walk into Run now starts a short 170 ms gait hand-off. The target gait phase is selected by comparing the four current Paw Targets/contact heights against the target cycle, then both cycles advance at their own cadence during the hand-off.
- The short hand-off is contact-aware: a planted paw leaving the ground is held toward the source gait for the early part of the transition, while a landing paw commits toward the target gait earlier. This avoids the long-lived "half-height" foot produced by the previous permanent blend.
- Once the hand-off completes, the Fox plays the real authored Walk or real authored Run with no ongoing hybrid pose. Ground speed remains continuously analogue between the saved Walk/Run speeds.
- Anim Lab Quick Play uses the same gait-selection, phase-match and transition rules as normal gameplay.
- The supplied `SS-FOX-RIG-ANIM-1.0.161.json` has been promoted into the built-in fresh-install Fox data (including the user's current 1.71 rig, Walk/Run/Jump/Idle and 1.15 / 5.75 m/s movement settings), while the authoring baseline ID deliberately remains `fox-authoring-baseline-1.0.159` so an existing browser's newer saved work is not reset by installing this patch.
- Fox Handoff remains one JSON file and is versioned `SS-FOX-RIG-ANIM-1.0.162.json`.
- Service-worker/preload cache generation is now `sidescroll-runtime-v16`.

## First iPhone test

1. Apply this cumulative patch over the approved v1.0.150 baseline and launch once online so cache v16 is installed.
2. Open **Anim Lab → Fox → Play**.
3. Start at a normal walk, then drag progressively farther into the run range. Confirm the Fox changes gait in one short hand-off rather than living in a 30/50/70% Walk+Run hybrid.
4. Pay particular attention to the leg that previously appeared to hang in the air. It may move through a brief transition pose, but it should not remain suspended while speed sits between Walk and Run.
5. Ease back down into Walk and check the reverse transition is similarly brief and coherent.
6. Repeat the same acceleration/deceleration in normal **Play** and compare it with Anim Lab Quick Play.
7. In Animate, pull each Paw Target through the extreme positions that previously made the lower chain pop onto the mirror solution. Confirm the knee/elbow branch remains stable and the released wrist/hock does not suddenly swap sides.
8. Confirm existing authored animation edits and the saved 5.75 m/s Run Speed are still present after update/relaunch.
9. Export **Fox Handoff** and confirm a single `SS-FOX-RIG-ANIM-1.0.162.json` is produced.

## Validation performed here

- JavaScript syntax checks on all changed JS.
- Latest v1.0.161 handoff parsed and promoted without changing the persistent baseline ID.
- Sparse Walk/Run phase matcher exercised across the authored cycle.
- Contact-aware transition output checked at multiple blend positions with all locomotion IK weights held at 1 during the hand-off.
- Primary knee/elbow signed bend branch swept across a broad Paw Target grid with no branch-sign violations.
- HTML script/style dependency and duplicate-ID checks.
- Service-worker/core-shell/cache-version consistency checks.

A real iPhone Safari/A2HS touch test has **not** been performed here. On-device acceptance is required before treating v1.0.162 as approved.
