# SideScroll — SS-PATCH-1.1.8

**Changed-files-only patch.** Apply directly over **v1.1.7**. This README describes **only v1.1.8**.

## Parts selection and group transforms

A single tap now selects exactly one assembled part, with one obvious active edit target. A dedicated **Multi-select** toggle lets you mark several parts deliberately; **Select all** also enables it. The inactive additional selections use a quieter highlight, rather than looking like multiple active transform targets. Turning Multi-select off returns to single selection.

With two or more parts marked, **Move** and **Scale** via the existing thumb pad act on every unlocked selection together, as one Setup Undo operation. Scale applies the **same proportional X/Y scale factor to each part**, keeping their individual proportions and positions; it does not resize their shared layout around an overall selection pivot. Numeric X/Y and Width/Height edits also apply to all marked parts. Rotate, Pivot, Rename and ordering remain single-part operations.

## Atlas Parts → Skin

Skin now displays the assembled Atlas meshes instead of the old six-piece Fox image whenever an Atlas assembly exists. It lists each assembled instance with its binding status. Select a part, choose a rig bone group, then **Auto-bind selected**, or **Auto-bind all**. These assign weight influences to the **existing authored vertices**, keyed by stable part-instance ID and saved in the current character Setup (Undo / Redo / Save / Discard). The bone-group skeleton is visualised while editing, with Rest/Walk/Run diagnostic poses and an Advanced per-vertex weight control. Existing imported PNG texture and topology are preserved.

The bound assemblies also render in **Anim Lab Animate and Quick Play** using those same saved weights. This stage adds *Anim Lab preview integration only*, **not normal in-game runtime deployment**. The legacy Skin renderer remains available for characters that have no Atlas Parts assembly. If Atlas topology or vertex locations change, bindings report **Needs rebind** rather than silently applying stale weights. No source meshes, pre-existing clips or rig positions are rewritten by installing this patch.

**Important remaining limitation:** imported PNG bytes still live locally in IndexedDB and are not packed into portable JSON export/backup. Keep the original image. Native iPhone Safari acceptance and full game/runtime parity remain outstanding.

**Checks:** Syntax checks passed. In a headless Chromium inline-resource harness using the v1.0.205 project snapshot and synthetic two-part saved Atlas setup: Skin showed the correct two parts instead of the old fixed regions; automatic bone groups and weights populated; Saved Setup retained two per-vertex influence arrays; group thumb-pad scaling updated both parts proportionally in one transaction; the new renderer sampled an emulated loaded PNG. External image/reference URLs could not load in this sandbox; real iPhone/Safari verification is still required.
