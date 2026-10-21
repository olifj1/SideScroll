# SideScroll — SS-PATCH-1.1.7

**Changed-files-only hotfix.** Install directly over **v1.1.6**. This README describes **only this drop**.

**Fix — Parts Move/Pivot thumb pad:** Moving an assembled Atlas part could jump it to the extreme end of its position range. The Atlas-backed renderer correctly disables the old procedural layout outline, but the precision-pad handler was mistakenly reading that disabled outline's missing viewport scale. It fell back to scale `1` instead of the actual canvas-pixels-per-character-unit scale, multiplying drag distance enormously.

The Parts editor now reads the current viewport projection directly from AnimLab Core, whether the selected part is a legacy Fox region or an Atlas-assembled instance. Move/Pivot use the correct canvas-to-CSS pixel ratio and honour normal coordinate bounds. Existing transforms, saves, rigs, meshes, and art are **not migrated or reset**.

**Recover an already displaced part:** While still unsaved, use Undo. If saved, select the part and set **X / Y** to their previous values in **Edit selected part** (normally `0 / 0` when first added); **Reset part** is an option if you want to reset its other transforms too. Save once the part is back in place.

**Tests:** Reproduced the bug on v1.1.6 in a 2×-pixel-density landscape Chromium harness (`26px` pad movement drove `X=3, Y=-2`, i.e. hard limits). With v1.1.7 the same movement generated `X=0.07393, Y=-0.03696`, consistent with the actual viewport scale. Undo/Redo preserved the move, and no browser JavaScript errors were observed. Actual iPhone Safari/PWA verification remains pending.

**Unchanged boundaries:** Atlas-authored meshes still need generic Skin binding and Animate/Play integration; phone-imported PNG bytes are still local to IndexedDB and excluded from portable JSON backup. This drop does not modify those systems.
