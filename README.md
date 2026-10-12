# SideScroll patch 1.0.145

**Changed-files-only Anim Lab Stage 3 patch over the agreed v1.0.144 baseline.**

Apply this ZIP directly over a working **v1.0.144** tree. It is one cumulative drop for everything added since that agreed baseline; there is no intermediate patch to apply.

## Stage 3 — sparse key-pose timeline and mirror/tween workflow

- Adds a stable 16-slot **Key Pose Timeline** above the Stage 2 Control Board.
- Existing Human and Fox 16-sample clips import losslessly into the Stage 3 working representation; opening Anim Lab does not write or convert stored animation data.
- Named key markers can be selected by tapping the timeline and renamed in-place.
- Adds **Add Tween**, Duplicate, Move Left/Right, Delete, Copy/Paste and Rename operations.
- Editing a tweened frame through the existing Stage 2 Control Board automatically promotes that frame to a key; the complete precision drag remains one Undo step.
- Adds rig-owned **Mirror Key** and **Mirror Clip** operations:
  - Human swaps the established A/B hand/foot channels and planted-foot label.
  - Fox swaps near/far front and rear limb channels while retaining the Fox rig.
- Adds cyclic **Phase -1 / +1 / Half Cycle** operations without changing world movement or clip duration architecture.
- Adds a non-destructive **Preview 8 Keys** conversion. Preview can be scrubbed and played, reports the measured deviation from the current 16 samples, and cannot be edited or persisted until **Adopt Preview** is pressed.
- On Save, sparse keys compile back to exactly **16 sampled poses**, preserving the existing gameplay animation contract.
- Before the first Stage 3 Save for a family/clip, Anim Lab stores a sampled backup under `sidescroll.animlab.legacy.samples.backup.v1`.
- Human Save continues to write the established human sampled runtime bank. Fox Save continues to write only the isolated Anim Lab Fox bank; Fox gameplay runtime integration remains deferred.

## Deliberately not included

Stage 4 FK/IK planted-foot/paw targets, contact tracks, bend-direction controls, curve editing and Fox runtime integration are **not** part of this patch.

## Files in this patch

- `walk-lab.html`
- `walk-lab.js`
- `anim-lab-stage3.js` **(new)**
- `style.css`
- `sw.js`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

These are the only files intended to differ from the agreed v1.0.144 baseline.

## Validation performed here

- JavaScript syntax validation on every JS file in the resulting full project tree.
- Core Stage 3 regression harness using the real Human/Fox rig modules and the real Anim Lab core:
  - exact 16/16 legacy sampled import for Human;
  - exact 16/16 legacy sampled import for Fox;
  - sparse reduction still compiles exactly 16 valid samples;
  - editing a tween frame promotes it to a key;
  - conversion preview leaves the authored sparse clip untouched until adoption;
  - Save persists sparse data and creates the legacy sampled backup.
- Static validation of timeline DOM IDs, Stage 2 -> Stage 3 script order, service-worker shell inclusion, key-operation wiring and Stage 3 storage ownership.
- Patch replay over a clean v1.0.144 tree before packaging.

A real Safari/A2HS interaction pass is still required for touch feel, scrolling and visual layout.

## Practical iPhone checks

1. Apply this ZIP over **v1.0.144**, launch once online, then open Anim Lab in landscape.
2. Hero 1 / Walk should initially show all 16 samples as keys. Tap several timeline cells; the character should scrub to those frames without making the session dirty.
3. Use **Preview 8 Keys**. Scrub and Play it. Save/Discard should remain unchanged because preview itself is view-only. Tap **Exit Preview** and confirm the 16-key authored track returns.
4. Preview 8 Keys again and choose **Adopt Preview**. The track should now show 8 keys and the session should become unsaved. Use **Discard** first and confirm the original 16-key track returns.
5. Adopt 8 Keys again. Tap an empty/tween frame and move a hand/foot through the Stage 2 precision pad. That frame should become a new key. One Undo should remove the whole drag/key promotion.
6. Test Rename, Duplicate, Move Left/Right, Delete, Copy and Paste on a key. Undo/Redo each operation at least once.
7. On Human, test **Mirror Key** on a Contact/Down/Passing/Up-type pose, then **Mirror Clip**. Check the opposite hand/foot pair becomes the corresponding pose rather than the character flipping geometry.
8. On Fox, adopt the 8-key preview and test Mirror Key/Clip. Near/Far front and rear legs should swap while body/head/tail remain coherent and the four-leg gait stays recognisable.
9. Test **Phase -1**, **Phase +1** and **Half Cycle**, then Play several loops. Key count should stay constant and Walk/Run should not visibly pop at the loop seam.
10. Save one Human sparse clip, reload Anim Lab and confirm the sparse key layout returns. Return to Play and confirm Human movement still behaves normally.
11. Save one Fox sparse clip, reload Anim Lab and confirm it returns in the editor. Return to Play and verify Fox gameplay is still using the existing approved runtime clip rather than the editor-only Stage 3 data.
12. After the online launch, reopen the A2HS copy offline and confirm Anim Lab loads with the Stage 3 timeline.

Stop after the Stage 3 review. Stage 4 should begin only after the key-pose/tween/mirror workflow feels sound on the phone.
