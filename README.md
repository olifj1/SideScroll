# SS-PATCH-1.0.159

Cumulative changed-files patch against the approved v1.0.150 baseline. v1.0.159 is the **Fox Authoring Baseline** stage marker and remains a test patch until reviewed on iPhone.

## What this stage locks in

- Promotes the user's `SS-FOX-RIG-ANIM-1.0.158.json` handoff into the built-in Fox authoring baseline.
- Fresh installs now start from the authored Fox scale **1.71**, authored collider and authored v3 quadruped rest rig rather than the older default proportions.
- The user's exported sparse **Walk / Run / Jump** clips and their compiled 16-sample runtime banks are preserved exactly in `fox-authoring-baseline.js`.
- Adds **Idle** as a proper fourth Fox clip in Anim Lab and gameplay. The first Idle is intentionally just the standing/rest pose; later breathing/head/ear/tail life is deferred.
- Replaces the animated orange Fox skin with temporary charcoal cutout evaluation art in `fox-rig-atlas-v3.png`.
- The charcoal atlas is deliberately a rigid-plane test skin. Because the source reference contains only the near-side legs, the temporary far-side limbs reuse that source leg art behind the torso.
- Keeps the approved v3 skeleton as the structural authority. The temporary atlas fits the rig; the rig is not redesigned around the artwork.
- Fox Handoff now exports/shares **one JSON file only**: `SS-FOX-RIG-ANIM-1.0.159.json`. The iOS share title payload that could appear as a companion text attachment has been removed.
- The handoff now contains **Idle / Walk / Run / Jump** sparse clips plus compiled runtime samples.
- Pre-v1.0.159 Fox rig/collider/scale/clip experiment storage is migrated onto this promoted baseline once. Future explicit Anim Lab Saves become authoritative through the new baseline marker.

## Explicitly NOT in this drop

- Anim Lab Quick Play (`Animate | Rig | Play`) is not included; it is the next planned coherent stage.
- No deformable/skinned 2D mesh implementation is included.
- No attempt has been made to perfect rigid cutout seams that are expected to disappear/change in the later deformable-art experiment.
- Walk / Run / Jump remain the user's current WIP authored clips; this release preserves them rather than creatively retuning them.

## iPhone test

1. Install/update the patch, fully close SideScroll, then reopen it so the new service worker/cache revision activates.
2. Open **Anim Lab → Fox → Rig**. Confirm the rig opens at the newly authored proportions (Fox scale 1.71) rather than the earlier long-leg/default Fox.
3. Turn **Static Reference → Fox Shape** on/off and compare the saved skeleton against the charcoal reference. The promoted rig should remain the same when the reference is hidden.
4. Switch to **Animate** and confirm the clip row is **Idle / Walk / Run / Jump** for Fox. Hero 1 / Hero 2 should still show only Walk / Run / Jump.
5. Play **Idle**. It should be a stable standing pose with no deliberate secondary motion yet.
6. Play the authored **Walk**, **Run** and **Jump**. Confirm the user's current animations survived the stage promotion and still use the v3 wrist/hock rig.
7. Toggle Art/Bones and inspect the new charcoal cutout while scrubbing all four clips. Judge silhouette/proportion/motion first; note any especially objectionable seam or overlap, but do not treat ordinary rigid-plane seams as a blocker for the later mesh prototype.
8. Launch **Play** as Fox. Confirm the charcoal Fox appears in gameplay and uses the same Idle / Walk / Run / Jump banks as Anim Lab after Save.
9. In Anim Lab, make one obvious temporary edit to a clip, **Save**, launch Play and confirm that saved clip is used. Return and use Undo/Discard as normal.
10. Use **Fox Handoff → Export / Share Rig + Animations**. Confirm iOS offers a single `SS-FOX-RIG-ANIM-1.0.159.json` file and does not create a companion text file.
11. Relaunch from A2HS/offline after the new cache has warmed and confirm Anim Lab and Play still load the Fox baseline and charcoal atlas.

## Static validation performed for this package

- JavaScript syntax checks pass for all modified/new scripts.
- The promoted setup/rest rig and Walk/Run/Jump sparse/runtime data compare exactly as parsed data with the supplied v1.0.158 Fox handoff; only Idle and v1.0.159 baseline metadata are added.
- Rest-rig and collider one-time baseline migration was exercised with stale localStorage values and resolved to the authored v1.0.159 values.
- Fox runtime exports four 16-sample banks: Idle / Walk / Run / Jump.
- `fox-rig-atlas-v3.png` is 2048×2048 RGBA and contains all 17 runtime atlas part names required by the v3 Fox renderer.
- Gameplay texture resolution now uses `FoxRig.ATLAS` for the Fox, avoiding the stale legacy Fox atlas URL still present in the generic human variant metadata.
- HTML script/dependency checks confirm `fox-authoring-baseline.js` loads before `fox-rig.js` in Anim Lab and Play.
- Duplicate HTML ID scan passes on the modified HTML pages.
- Service worker cache revision is bumped and the new authoring baseline script is part of the core shell.
- This package is assembled as a cumulative patch by starting from `SS-PATCH-1.0.158` (itself documented as cumulative over v1.0.150), then applying the v1.0.159 changed files. No on-device/browser validation is claimed here.

## Next stage

**v1.0.160 — Anim Lab Quick Play** is documented in `SIDESCROLL_TASKS.md`: remain inside Anim Lab, switch into Play context, drive the current Fox with gameplay-style movement/jump controls, then return directly to Animate/Rig. The later hybrid deformable Fox remains a separate following art stage.
