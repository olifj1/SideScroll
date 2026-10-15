# SS-PATCH-1.0.157

Cumulative changed-files patch against the approved v1.0.150 baseline. v1.0.157 remains a test patch until approved on iPhone.

## Anim Lab changes

- Separate Fox Neck and Head animation controls so the whole neck can bend down independently of the head.
- Add the missing distal leg joint: front limbs are Socket → Elbow → Wrist → Paw; rear limbs are Socket → Knee → Hock → Paw.
- Paw Target remains the main IK control. Each leg gains only one optional shape control: Wrist Angle or Hock Angle.
- Existing lower-leg artwork is split non-destructively inside a new `fox-rig-atlas-v2.png`; no replacement production art is invented.
- Saved v2 Fox rest rigs migrate to v3 with the new joint inserted on the old authored lower segment, so existing socket/knee/paw positions are preserved.
- Fox Anim Lab playback cadence now matches gameplay locomotion distance/speed: Walk ~539 ms/cycle, Run ~323 ms/cycle at full gameplay speeds.
- Anim Lab playback renders continuously between the 16 runtime samples instead of appearing as a 16 fps step preview.
- Key Pose Tools adds clip-wide `Smooth` / `Linear` tweening. Fox clips default to Smooth; no graph editor is added.

## iPhone test

1. Open Anim Lab → Fox → Walk. Select **Neck**, Rotate, and drag left/right on the bottom-right pad. Confirm the whole neck/head chain can lower; then select **Head** and counter-rotate it independently.
2. Turn on Bones and inspect each limb. Front legs should show Elbow + Wrist; rear legs should show Knee + Hock. In Rig mode each joint should be selectable on the left and movable with the same viewport pad.
3. In Animate, select a Paw Target and move it, then select the matching Wrist/Hock Angle and rotate the final short segment. Confirm this gives useful extra leg shape without any IK mode switching.
4. Play Fox → Run in Anim Lab, then launch Play and run at full speed. Compare cadence rather than pose detail; the cycle rate should now be substantially closer/matched.
5. On Walk, toggle Key Pose Tools → Tween between **Smooth** and **Linear**. Smooth should remove obvious key-to-key velocity corners while authored keys remain exact.
6. Check the split lower-leg art at wrist/hock bends for visible seams/gaps. Report any specific limb/pose where the split is objectionable.
7. Save an edited Walk and verify Play uses it. Undo/Redo/Discard/Save should remain normal.

## Static validation

- JavaScript syntax checks pass for modified scripts.
- v2→v3 rest-rig migration preserves existing authored socket/knee/paw points and derives only the new distal joint.
- Three-segment IK preserves all three authored segment lengths in numerical tests.
- New atlas is 2048×2048 and contains masked proximal/distal copies of the existing four lower-leg sprites.
- Final patch should be replayed over a clean v1.0.150 tree before release.
