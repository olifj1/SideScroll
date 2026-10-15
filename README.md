# SS-PATCH-1.0.160

Cumulative changed-files patch intended to apply over the approved v1.0.150 baseline. v1.0.160 is the **Anim Lab Quick Play + Motion Fidelity** development stage and remains a test patch until reviewed on iPhone. It was built forward from the supplied cumulative v1.0.159 patch.

## What changed

- Adds a third Fox Anim Lab context: **Animate | Rig | Play**.
- Quick Play stays inside the Anim Lab viewport and tests the **current working copy** of Idle / Walk / Run / Jump; you do not have to Save, leave Anim Lab and reload Play simply to judge a tweak.
- Quick Play replaces the precision manipulation pad with a phone-first horizontal movement control plus Jump. Drag to walk; drag into the outer range to blend into run.
- Adds authored **Walk Speed** and **Run Speed** controls for the Fox. These are character Setup properties, remain a working copy until Save, and are then used by gameplay.
- Animation cadence and ground travel are now deliberately separate for the Fox. At full Walk/Run the authored cycle timing remains fixed while Walk/Run Speed controls metres travelled per second. This allows foot cadence and character travel to be balanced visually instead of forcing one to determine the other.
- Quick Play draws scrolling half/metre ground marks and reports current speed, cycle time and approximate metres per cycle to make tuning readable without leaving Anim Lab.
- Fox **Smooth** clips are now evaluated directly from the sparse authored keys at fractional timeline positions. The old path baked Smooth to 16 poses and then linearly interpolated those poses, which could make a cubic clip still look almost linear.
- Gameplay now uses the same direct sparse Fox evaluator as Anim Lab for Idle / Walk / Run / Jump when a valid sparse clip is available. The 16-sample runtime bank remains as compatibility/fallback data and in handoff exports, not as the primary Smooth playback path.
- The 16-frame timeline remains the simple key-layout/editing surface; it is no longer the playback resolution limit.
- Quick Play preserves working-copy Undo/Redo/Save/Discard ownership. Entering and leaving Play does not implicitly Save, discard or reset history.
- Fox handoff is now versioned `SS-FOX-RIG-ANIM-1.0.160.json` and includes Walk/Run movement speeds alongside scale/collider/rest rig and Idle/Walk/Run/Jump data.
- The temporary charcoal rigid cutout is intentionally unchanged apart from correct left/right mirroring in Quick Play. Deformable/skinned art remains a later stage.

## Deliberately not in this drop

- No deformable/skinned Fox mesh.
- No creative retune of the user's Walk / Run / Jump poses. This stage improves evaluation and gives the user a better test/tuning loop; animation polish comes after on-device judgement.
- No full animation graph/curve editor. Smooth and Linear remain the bounded interpolation choices.
- No attempt to make the temporary rigid charcoal cutout production-final.

## iPhone test

1. Apply the patch, fully close SideScroll, then reopen it so the new service-worker/cache revision can activate.
2. Open **Anim Lab → Fox → Animate → Walk** and play the clip. Compare **Smooth** and **Linear** on the same authored keys. Smooth should now read as continuous motion between sparse keys rather than obvious straight key-to-key stepping.
3. Scrub directly onto several authored keys and confirm the exact poses have not changed. The motion fidelity change must alter only the path *between* keys.
4. Make one obvious temporary unsaved pose edit, then press **Play** in the Mode row. Confirm Quick Play immediately reflects that working-copy edit without requiring Save.
5. Use the bottom-right movement control. Inner travel should walk; farther travel should blend toward run; Jump should exercise the current Jump clip.
6. Move left and right. Confirm the Fox faces both directions correctly rather than rotating/flipping individual cutout pieces incorrectly.
7. In Quick Play, adjust **Walk Speed** until the walk cadence and ground travel look believable. Adjust **Run Speed** separately until the run no longer looks like frantic legs moving at jogging pace.
8. Watch the scrolling metre marks/readout while tuning. Speed should change ground travel without changing the full-speed authored Walk/Run cycle duration.
9. Return to **Animate**. Confirm the unsaved animation edit and Undo history are still present. Re-enter Play and verify the edit can be iterated repeatedly.
10. Press **Discard** and verify the temporary animation/speed edits return to the checkpoint. Repeat with a small change and **Save**; leave Anim Lab and launch normal **Play** as Fox. Confirm gameplay uses the saved Walk/Run speeds and the same Smooth motion.
11. Export **Fox Handoff** and confirm it remains one JSON file named `SS-FOX-RIG-ANIM-1.0.160.json`.
12. Relaunch the A2HS/offline app and confirm the saved Fox speed settings and clips survive.

## Validation performed in this build environment

- JavaScript syntax checks for all modified scripts.
- CSS parse check.
- HTML parse, duplicate-ID and patch-owned dependency/version checks; unchanged baseline dependencies are intentionally not duplicated into this changed-files patch.
- Service-worker shell/cache reference checks.
- Fox sparse evaluator tests across fractional phases, including exact-key preservation and finite 64-sample motion.
- Setup baseline checks for Walk/Run speed defaults.
- Static checks that Anim Lab and gameplay both route Fox Smooth playback through the same sparse evaluator.
- Static Quick Play state/Save/Discard wiring checks.

A real Safari/A2HS touch test has **not** been performed here. On-device acceptance is required before treating v1.0.160 as approved.

## Release boundary

If Quick Play, Smooth motion and speed balancing are solid on device, the next useful work is to refine the actual Walk/Run/Jump using this shorter iteration loop, then prototype the hybrid deformable charcoal Fox around the approved rig rather than spending more time hiding seams in the temporary rigid cutout.
