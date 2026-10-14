# SideScroll patch 1.0.155 — Fox IK bend-branch stability fix

Cumulative changed-files-only patch over the approved v1.0.150 baseline. v1.0.151–1.0.154 remain unapproved test steps.

## What v1.0.155 fixes

The v1.0.154 teaching Walk exposed a two-bone IK ambiguity on three Fox legs. The solver was choosing whichever of the two valid knee/hock solutions happened to be nearest to the current FK joint on each sample. Near straight/ambiguous poses that choice could alternate from frame to frame, producing violent backwards/forwards knee flicking.

v1.0.155 makes bend ownership explicit in the quadruped rig-family descriptor:

- Front Near / Front Far use one stable front-knee branch.
- Rear Near / Rear Far use one stable rear-hock branch.
- IK no longer re-decides the branch independently on every sample.
- The worked example Walk has been regenerated using the stable solver so bad branch choices are not left baked into its FK swing poses.
- The example foundation marker is bumped to `fox-walk-example-v2`, so a saved v1.0.154 example Walk is ignored automatically until the corrected Walk is edited/saved. Run and Jump are unaffected.

## Focused iPhone test

1. Install over your current v1.0.154 test copy (or cumulatively over v1.0.150).
2. Fully relaunch the PWA so the new service-worker shell/cache is active.
3. Open Anim Lab → Fox → Walk → Animate and press `Reload Example Walk` if needed.
4. Play and scrub all 16 samples. Front knees should keep the same bend direction throughout; rear hocks should keep the same rear bend direction throughout. There should be no frame-to-frame backwards/forwards snapping.
5. Turn on Ground Motion and confirm planted paws remain stable while the knees/hocks solve smoothly above them.
6. Save, enter Play, and confirm the corrected Walk is used in gameplay.

## Programmatic validation

- All Fox Walk samples retain one bend branch per limb across all 16 runtime samples.
- Front Near: + branch for 16/16 samples.
- Front Far: + branch for 16/16 samples.
- Rear Near: - branch for 16/16 samples.
- Rear Far: - branch for 16/16 samples.
- Segment lengths remain fixed by the authored rest rig.
- Existing Run/Jump data paths are unchanged.

## v1.0.154 foundation — Fox example Walk / IK teaching pass

Changed-files-only cumulative patch over the agreed **v1.0.150** baseline. v1.0.150 remains the approved baseline until the later Anim Lab patches are tested and accepted. This patch therefore includes v1.0.151 Rig Designer, v1.0.152 workflow/runtime integration and v1.0.153 paw-contact FK/IK, plus the new authored Fox Walk example.

## What changes in v1.0.154

The Fox Walk is deliberately replaced with a complete working example built around the new Stage 4 workflow. Preserving the previous experimental Fox Walk was explicitly not a goal for this pass.

The example uses **8 sparse key poses** over the existing 16-sample runtime:

- four-beat walking order: Rear Near -> Front Near -> Rear Far -> Front Far;
- stance paws are held by planted IK;
- swing paws are authored in FK;
- tween samples blend smoothly toward the next contact;
- the Mid Root bobs subtly;
- Front Body and Rear Body lift independently to give the torso weight transfer;
- Whole Body Tilt adds a small pitch change;
- Head / Neck counter-moves so the head is steadier than the torso;
- Tail Base / Mid / Tip form a delayed three-part follow-through wave.

The default example is generated against the **currently saved Fox rest rig and Fox scale** when Anim Lab needs to seed/reload it. The built-in runtime fallback also regenerates the example against the saved rest rig/scale, so the teaching cycle is not tied only to legacy proportions.

## Intentional Walk reset

v1.0.154 treats pre-example Fox Walk data as disposable.

- Old saved Fox **Walk** banks that do not carry the new example-foundation marker are ignored.
- Saved Fox **Run** and **Jump** are left alone.
- The new Walk becomes the safe fallback in Play immediately after the patch.
- Once this Walk (or an edit derived from it) is explicitly saved in Anim Lab, that saved Walk becomes authoritative again.

This is a one-time foundation change for the Fox Walk, not a general policy of overwriting authored animation.

## Reading the example

Anim Lab's visible frame numbers are 1-16. The eight authored keys are therefore on frames **1, 3, 5, 7, 9, 11, 13 and 15**.

Key names describe the most useful event at each point:

1. **Rear near contact**
2. **Rear far lift**
3. **Front near contact**
4. **Front far lift**
5. **Rear far contact**
6. **Rear near lift**
7. **Front far contact**
8. **Front near lift**

A paw whose status says **PLANTED** is using the Stage 4 contact anchor. A swing paw is FK-led. At contact keys the planted paw uses 100% IK; release/swing keys return it to FK. This makes the distinction between the two systems visible while still producing one continuous animation.

At ×1 Ground Motion, a planted paw should remain fixed against one ground mark while the body moves past it.

## Reload Example Walk

Fox -> Walk -> Animate now includes **Reload Example Walk** in Paw Contact / IK.

It rebuilds the same eight-key example against the **current working rest rig** and current Fox Scale. The operation is one normal Anim Lab history action, so it is Undoable and remains inside Save / Discard ownership.

This is useful after changing Fox proportions, or whenever the example has been edited heavily and a clean teaching version is wanted again.

## Existing Stage 4 behaviour retained

- Four paw IK targets in the normal Control Board.
- Bottom-right viewport drag pad for two-thumb posing.
- FK / IK blend.
- Capture FK -> IK.
- Plant from Here / Release Here / Target to Ground.
- Phase-resolved planted contacts compiled into the normal 16-sample Fox runtime.
- Moving Ground diagnostic tied to actual Walk/Run stride.
- Play consumes saved Fox clips with safe fallback.

No terrain-aware procedural foot placement, full-body IK, graph editor or generalized constraint system is added here.

## Practical iPhone test

1. Apply this cumulative patch over v1.0.150 and relaunch/refresh the PWA.
2. Open **Anim Lab -> Fox -> Walk -> Animate**.
3. Confirm the key-pose lane contains eight keys on frames 1,3,5,7,9,11,13,15 and that the key names match the example events above.
4. Turn on Art + Bones + Moving Ground and press Play. Confirm all four legs cycle, the torso moves subtly, the head counter-moves and the three tail sections follow through.
5. With Ground Motion at ×1, watch one paw through a planted interval. It should remain fixed against a ground mark while the body passes over it.
6. Scrub key-by-key and select each paw in **Paw Contact / IK**. Confirm planted keys show PLANTED / 100% IK and swing/release keys return toward FK.
7. Select **Mid Root**, **Front Body**, **Rear Body**, **Head / Neck**, **Tail Base**, **Tail Mid** and **Tail Tip** to see that those channels have authored motion in the example.
8. Press **Reload Example Walk**. Confirm it is one Undo step, the eight example keys return, and Save becomes available because this is an explicit edit.
9. Undo the reload, Redo it, then Discard; confirm normal transaction behaviour.
10. Save the desired Walk and enter **Play** as Fox. Confirm the same walk appears in gameplay.
11. Change the Fox rest rig proportions, Save the Rig, return to Walk and press **Reload Example Walk**. Confirm the legs rebuild around the new proportions rather than assuming the old skeleton.
12. Relaunch from A2HS/offline and confirm the v1.0.154 code is active.

## Validation performed off-device

- All changed JavaScript parses with `node --check`.
- The example contains exactly 8 sparse authored keys and compiles to exactly 16 runtime samples.
- All four paws use a 0.625-cycle stance / 0.375-cycle swing pattern with quarter-cycle footfall offsets.
- During every full-IK planted runtime sample, paw world-space X is invariant after applying the expected Walk stride (within floating-point tolerance).
- Planted paw Y remains on the ground datum.
- The example's FK solve is generated from the saved rest-rig bone lengths, not hard-coded limb lengths.
- Reload Example Walk can regenerate FK channels for a changed saved rest rig.
- Run and Jump saved-bank loading remains independent of the intentional Walk reset.
- Pre-v1.0.154 Fox Walk banks are ignored unless re-saved on the new foundation marker.
- Stage 4 runtime still uses the existing 16-sample clip contract.

Physical iPhone testing is still required for the final visual judgement: whether the amount of paw lift, chest/pelvis movement, head counter-motion and tail follow-through feels natural at gameplay scale, and whether any hock/knee direction needs tuning after your chosen final Fox proportions.
