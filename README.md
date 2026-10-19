# SideScroll — SS-PATCH-1.0.192 (18 October 2026)

**Test patch for the first Parts editor stage.** Apply **directly over the installed working v1.0.191 source** by copying these files into the existing flat repository and replacing files of the same name. It is **NOT** a full game build. You do **not** need `SS-BASE-191-REVIEW.zip` or any rejected 174–190 patch as an installation prerequisite. This release has not yet passed iPhone/Safari approval; keep your current 191 files as a rollback.

## What changed

In Anim Lab select **Fox → Rig → Part Layout**. The six independent deform-art regions now have editable render order, a right-side Move/Rotate/Scale/Pivot pad with Free/X/Y and Fine choices, plus numeric transform entry. Width and height scale independently. Pivot adjustment compensates translation so it does not shift the part. You can Copy Part and Paste All/Position/Rotation/Scale/Pivot to another part, or Copy to the near/far pair. Each authored action is Undo/Redo/Save/Discard aware.

Hide Part, Solo and Show All affect **only the temporary editor view** (no dirty indicator, Save or gameplay change). The Parts viewport displays neutral unskinned deform art while authoring, even if Rigid was selected before opening Parts. The skeleton, clip keys, source textures, UVs and current runtime game renderer are not changed. The left Setup panel hides unrelated Scale/Collider sliders when Part Layout is active so the named six-part list is accessible sooner.

Existing `animlab.art-layout.v1` setup is backward compatible: old scalar `scale` initializes both `scaleX` and `scaleY`, and absent pivot/order fields use the existing defaults. Nothing is saved on launch, only when you deliberately press Save. **No image/atlas files are included.**

## Known limit — next stage

This is a bounded **P1 editor-tools test**, not the complete new-character creator or a full independent skin bind. The current deformed mesh is still tied to rest joints when entering Rig/Animate; changing structural Rig joints can still affect art appearance. Full separation, explicit rebind, global character creation, reusable clips and dynamic in-game character selection are subsequent stages. The new Part Layout ordering is an Anim Lab deform-preview feature, not yet applied in gameplay.

## iPhone acceptance check (please test before further work)

1. In Parts, select Tail / one Near and one Far leg. Move, Rotate, change **Width only** and **Height only**, change Pivot. Confirm artwork changes while the joint markers do not; Reset Part and Undo/Redo. Compare the default identity against your accepted 191 fox.
2. Hide a leg, Solo another, Show All. Confirm the **Saved** indicator does not change. Change order using Bring Forward/Send Back; check overlap and Undo.
3. Copy a leg, Paste Position then Scale onto its pair. Test a numeric edit. Save, reload the PWA and confirm the authored layout and draw order survive; edit again and Discard.
4. Switch from Parts to Joints, Animate Walk/Run/Jump and Quick Play. Please report any neutral appearance jump, fringing, unexpected skin deformation, loss of rig/animation settings, or screen/pad/pinch usability issue. Do not reset existing browser data.

**Validation here:** all JS passes Node syntax checks; headless Chromium DOM tests pass editor actions, pivot math, Undo/Redo, Save/Discard and same-session setup storage. **Actual six-piece atlas display and installed iPhone Safari have not been tested here.**

## Files in this changed-files-only patch

`README.md`, `walk-lab.js`, `anim-lab-art-layout.js`, `anim-lab-mesh.js`, `walk-lab.html`, `style.css`, `sw.js`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.

---

## Previous frozen source README (historic, not 192 install instructions)

# SideScroll — v1.0.191 source review baseline (18 October 2026)

**Frozen review snapshot, not a new implementation release or iPhone-accepted build.** It is the single source of truth for the next development pass, replacing the need to apply a chain of historic patches. It can serve as a complete asset+code source archive; do not deploy it over a preferred installed version without checking browser-saved data and agreeing that this is the best starting state.

## Exactly what was packaged

- All 240 original files from the user-provided `SideScroll-main(5).zip` are retained; **all JS, HTML, CSS, JSON runtime configuration, images, and audio bytes are unchanged**.
- The three canonical design documents are replaced by the 18-Oct versions from `SS-HANDOVER-CODE-191(1).zip`.
- `CLEAN_CHAT_HANDOVER.md`, `BASELINE_STATUS.md`, and `BASELINE_FILE_MANIFEST.json` are included; this README is re-labelled to avoid treating the historic v1.0.173 patch note as current instructions.
- Historic unused images/audit artifacts already present in the full build are retained solely to avoid unintended deletions. They have not been promoted to live sources; in particular, `fox-deform-atlas-v2.png` is the active six-region deform source and `fox-rig-atlas-v3.png` is the rigid fallback. No previous rollback/patch chain was applied.

## Work to do next

Audit details, current risks and checks are in `BASELINE_STATUS.md`. Follow `SIDESCROLL_CHARACTER_AUTHORING.md` as the design authority, `SIDESCROLL_ENGINE_UX_BIBLE.md` for cross-editor rules, and `SIDESCROLL_TASKS.md` for P0–P4 implementation gates. Next code change is P1 only, as a **changed-files-only** `SS-PATCH-<version>.zip` with a normal README and updated relevant docs. Browser localStorage is not included and must not be cleared or reset.

---

## Archived original README (historic v1.0.173 patch note, not an install instruction for this snapshot)

# SideScroll patch 1.0.173 — clean Fox deform atlas rebuild

Apply this patch after 1.0.172. This ZIP contains only files changed/new for 1.0.173.

## What changed

- Added a completely rebuilt `fox-deform-atlas-v2.png` made only from the approved modular charcoal Fox sheet already produced in this chat.
- No pixels from the old rough deform atlas are reused in atlas v2.
- Body + head now come from the clean modular source, preserving the fuller snout and natural fur silhouette.
- Tail now comes from the clean standalone tail source only; the stray leg/stump contamination is gone.
- Front Near and Front Far are identical copies of the selected front leg (leg 2).
- Rear Near and Rear Far are identical copies of the selected rear leg (leg 3).
- Near/far copies are not darkened yet; that remains an optional later depth pass.
- Removed the temporary chain alpha-hardening step so the new source's natural feathered fur alpha is retained.
- Updated Anim Lab atlas rectangles for the new layout and bumped asset/script cache versions.
- Updated splash/service-worker preload references from atlas v1 to atlas v2.

## Files

- README.md
- fox-deform-atlas-v2.png
- anim-lab-mesh.js
- walk-lab.html
- home.js
- index.html
- sw.js

## Suggested check

1. Anim Lab → Fox → Deform.
2. Check Rig mode against Fox Shape reference: body/head should now be the clean modular source with the fuller snout.
3. Check the tail: it should be a clean standalone tail with no leg or hard old crop inside it.
4. Check all four legs: front pair should match each other exactly; rear pair should match each other exactly.
5. Run Walk and Run and judge registration/weights separately from art quality.

No rig keys or animation clips are changed by this patch.
