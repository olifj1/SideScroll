# SS-PATCH-1.0.193 — P2a Rig / Artwork Separation

**Install:** Overlay onto **v1.0.192**, not onto v1.0.191. This ZIP contains only the files changed in v1.0.193. Retain the confirmed working v1.0.191 rollback. v1.0.192 and v1.0.193 have **not yet been accepted in Safari on iPhone**. Do not clear Safari site data or localStorage.

## What changed

- Fox uses two independent, internally authored rest snapshots in Setup: `artRestRig` anchors the six existing source artwork regions; `skinBindRig` anchors the current inverse-bind geometry. Both initially inherit **the user's current Fox rig**, never a hardcoded default, when opening an existing v191/v192 save. They persist only when Save is clicked.
- Rig mode now displays fixed, *unskinned* neutral artwork while structural joints move. Parts mode remains fixed/unskinned; its transforms are now evaluated in source/bind space, *before* skinning. Animations are evaluated with the authored rest rig and the explicitly selected binding rest rig. At neutral rest, bind and pose yield identity; joint edits do not shift the neutral assembled pixels.
- Rig Designer adds **Walk Preview: Off → Previous Binding → Proposed Rebind**. This compares the same walk pose using the last committed binding vs the candidate new rig, without saving anything. Turn it Off while arranging joints for the stationary neutral preview.
- **Rebind to Rig** updates only the editable `skinBindRig` snapshot. This is a Setup undo step; Discard reverses it; Save commits it with the edited rig. If a Fox rig differs from its saved bind snapshot, Save is blocked with a clear message until Rebind is chosen. This avoids accidentally storing an inconsistent rig/bind pair.
- Corrected an existing Rig overlay projection call: clicking/selecting joints in the viewport no longer triggers a missing-viewport error.
- Atlas PNGs, six atlas crop rectangles, all animation clip keys, game runtime and full rig/mesh topology remain unmodified. No files outside this ZIP should be overwritten.

## Try on iPhone (landscape)

1. Select **Fox → Rig → Joints**. With **Walk Preview: Off**, move a Front Near Socket, Rear Near Socket, Body joint, Neck and Tail Root. The *art pixels should stay put*, while skeleton lines/joints move. Use the bottom-right pad or joint selectors.
2. Tap **Walk Preview** to compare **Previous Binding** against **Proposed Rebind**. The preview can move with the posed skeleton; that is deliberate, not a structural art move. Turn Preview Off.
3. Press **Save** before rebinding: it should block with a useful message. Then choose **Rebind to Rig**. Undo/Redo it and inspect. Save, refresh, return to Rig and inspect again.
4. Check **Parts** editing remains independent, then Animate Walk/Run/Jump and Quick Play. Verify foot/shoulder deformation and that the saved art does not jump between Parts/Rig and neutral. Check pinch/pan and iPhone safe-area touch controls.
5. Test **Discard** to recover a trial edit. Preserve your v191 rollback and any Fox handoff export if unsure.

## Validation

Passed: Node syntax checks and a headless Chromium DOM+atlas smoke test (inlined assets because local web/file navigation was blocked). The test verified a joint edit leaves the entire neutral canvas pixel-identical with overlays disabled, that Pre-rebind Save is blocked, that Rebind remains undoable, that the neutral canvas remains identical after Rebind, and that explicit Save persists both snapshots. The reference-manifest fetch failed only in the synthetic inline test environment; this is not a game functionality claim. **Actual Safari/PWA, animation deformation, iPhone ergonomics and game-runtime integration remain unverified.**

## Known constraints / further stages

This is the first P2 increment, **not** a final editable Skin mode. Rebind updates inverse rest geometry only. It does not regenerate weights or topology; extreme joint reshaping may need later weight editing. Six-region Fox assets are still the sole art/mesh implementation; current Hero rigs and the runtime character selection have not been changed. The broader generic character, rig families, clip template library and in-game selection workflow remains scheduled after this gate. In-game Fox deformation uses its existing runtime renderer; do not assume this new editor-specific bind snapshot is already consumed by the gameplay renderer.
