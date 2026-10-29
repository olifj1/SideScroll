# SS-PATCH-1.0.191 — Part Layout restoration

Target: the original full build (v1.0.173) or its rollback (v1.0.186).

Restores the Part Layout tool from the early authoring patches, fitted to the original six-region deform renderer.
The old atlas and rig are left intact. The editor's default identity layout must reproduce the base visual exactly.

Anim Lab > Fox > Rig > Character Setup > Part Layout. Select a part on the left, then use bottom-right pad for move/rotate/uniform scale.
Transforms are stored in Setup, applied ONLY to the six deform regions after skinning. Save/Discard/Undo share Anim Lab's edit session.
No texture PNG files included. Rigid mode is intentionally unchanged; this stage adjusts deform regions only.

Files: fox-rig.js, walk-lab.js, anim-lab-stage2.js, anim-lab-mesh.js, anim-lab-rig.js, anim-lab-art-layout.js, walk-lab.html, style.css, sw.js.

Follow-up: verify the fox in Deform, then tackle documented Asset Lab authoring improvements as a separate stage.
