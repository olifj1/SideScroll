# SideScroll patch 1.0.150 — Anim Lab Motion Reference

Changed-files-only patch over the agreed **v1.0.149** baseline. This is a reference-integration pass inserted before Stage 4 / FK-IK contact work. It does **not** change the authored Fox walk/run/jump clips.

## What this adds

Anim Lab now has a reusable **Motion Reference** panel for editor-only gait overlays.

Initial installed reference pack:
- **Walk** — 35 source frames, 10 selected reference poses.
- **Run / Gallop** — 15 source frames, 8 selected reference poses.

Only the 50 full-cycle PNGs are deployed. Selected-pose mode reuses those same images through the supplied phase/index metadata, so no duplicate pose PNGs, atlases or comparison sheets are shipped.

The reference system supports:
- Key Poses / All Frames source modes.
- Show / hide behind the rig.
- Opacity, uniform scale, horizontal and vertical alignment.
- Locking alignment controls while animating.
- Independent Play/Pause, Previous/Next and cycle scrub.
- Linked playback against Anim Lab's normalised character cycle phase.
- Phase Offset for aligning arbitrary source phase-zero to the authored character cycle.
- Per-character / per-clip saved reference settings through the existing Anim Lab Save/Discard workflow.
- On-demand image loading/caching rather than adding the reference PNGs to the service worker's install-time core shell.

## Future-proofing

Reference packs declare compatible rig families. The included Animal Gaits pack is registered for the Fox/quadruped family. Hero 1 / Hero 2 currently show that no biped pack is installed; a later biped Walk/Run pack can use the same panel, persistence, phase linking and underlay renderer without redesigning Anim Lab.

## Files changed / added

Code / UI:
- `walk-lab.js`
- `anim-lab-stage2.js`
- `anim-lab-reference.js` (new)
- `anim-reference-packs.json` (new)
- `walk-lab.html`
- `style.css`
- `sw.js`

Docs:
- `README.md`
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`

Reference assets:
- `animref-animal-walk-001.png` … `animref-animal-walk-035.png`
- `animref-animal-run-001.png` … `animref-animal-run-015.png`

The PNGs remain the supplied fixed **600 × 330** crops. They are not individually recropped or resized.

## Install

Apply this ZIP directly over **v1.0.149**, preserving the flat repository layout. All files in the ZIP belong at repository root; there are no subfolders to create.

## First iPhone test

1. Open Anim Lab -> Fox -> Walk -> Animate.
2. Confirm the old Hero 1 scale ghost is not shown by default.
3. In **Motion Reference**, choose Walk -> Key Poses -> Show.
4. Adjust Opacity / Scale / Horizontal / Vertical until the source animal sits sensibly behind the Fox.
5. Tap Lock.
6. With **Linked** enabled, scrub the normal character timeline and confirm the reference follows by cycle percentage rather than by pose number.
7. Adjust Phase Offset until a useful contact/reach moment aligns.
8. Press Play. Reference and Fox should loop together even though the reference has 35 images and the character runtime still has 16 samples.
9. Switch to All Frames and confirm the motion becomes denser without changing alignment.
10. Change only a reference setting and confirm Anim Lab becomes Unsaved. Save, leave/reopen the Fox Walk context, and confirm the reference settings return.
11. Switch to Fox Run and confirm Run / Gallop is the suggested reference.
12. Switch to Hero 1. The panel should state that no biped reference pack is installed yet; gameplay/animation data should remain unchanged.

## Offline / A2HS note

`anim-lab-reference.js` and the reference manifest are part of the normal service-worker shell. The larger PNGs intentionally cache **on demand** when viewed. A gait that has never been opened online cannot magically appear on a first-ever offline launch; once its images have been viewed/cached, normal cache-first asset behaviour supports offline reuse.

## Validation performed here

- All project JavaScript files pass syntax validation.
- Manifest contains exactly 35 Walk + 15 Run/Gallop frames and only those two installed gaits.
- All 50 deployed reference PNGs are 600 × 330.
- Selected reference entries point to deployed full-cycle frames; no selected-pose image duplicates are required.
- Phase selection uses “last reference phase <= current normalised phase, then wrap”, preserving the uneven selected-pose timing.
- Reference draw scale uses Anim Lab's world/grid view, not character Setup scale, so reference alignment does not drift merely because the Fox scale is edited.
- Reference settings are stored in their own editor namespace and are not read by `play.html` / gameplay runtime.
- Reference image files are excluded from the service worker CORE_SHELL and therefore do not inflate install-time cache warmup.
- Clean patch replay over v1.0.149 is required before release packaging.

## Source/reference note

The supplied images are editor reference material extracted from the user's recording of Stephen Cunnane's *Animal Gaits for Animators*. They are not game artwork and should not be baked into exported character art or gameplay rendering.
