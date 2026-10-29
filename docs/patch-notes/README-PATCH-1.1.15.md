# SS-PATCH-1.1.15 — Fox IK bend direction follows the authored rest rig

**Prerequisite:** Install over SideScroll v1.1.14. This ZIP contains only changed files for this drop; upload them over the existing flat GitHub repository. Refresh the page/PWA after GitHub publishes the update so the new script query and service-worker cache are loaded.

## Problem addressed

In Rig, the Fox's resting foreleg elbow bends toward the rear and hind-leg knee toward the front, but when a Paw Target is activated in Animate the IK solver used the opposite mirrored two-bone solution. Merely capturing the paw at its *existing* rest position could move its knee/elbow to the other side, causing the crossing/twisting seen when raising a paw. This is an IK geometry problem, separate from Atlas meshes, Skin weights, and FPS.

## Changes in this drop

- **`fox-rig.js`:** solve the limb's knee/elbow on the signed side defined by its *current saved rest rig*: Socket → Wrist/Hock versus Socket → Knee. The bend side is fixed for that rest setup during all authored/played frames, preventing frame-by-frame flipping. The descriptor's nominal Fox fallback is corrected (front backward, rear forward) if the rest shape is degenerate/straight. No rig or clip migration, no edits to stored poses/weights, and no change to the wrist/hock distal angle or target channels.
- **`walk-lab.html`:** bust `fox-rig.js` browser cache for this release.
- **`sw.js`:** increment service-worker cache to `v125`.

This changes the evaluated pose of **existing saved Fox IK animations** where the prior hardcoded branch was wrong. It does *not* rewrite their frames or rig. Review your Walk/Run/Jump and authored clips after installing. You can revert the version if a previously hand-corrected pose needs a deliberate re-authoring pass.

## Verification

- Regression using the actual bundled Fox authoring rest rig: activation of IK at the unchanged paw target used to move the front elbow ~0.035 m and rear knee ~0.054 m. Now the FK → IK knee difference is below `4e-17 m` for each of the four limbs.
- Raised each paw by 0–0.085 m over six target positions; all 24 evaluated targets retain the expected rest-rig bend side and preserve upper/middle segment lengths.
- Reflected the authored knee points across each limb's Socket → Wrist/Hock line; the branch direction follows this *newly authored* rest rig rather than static front/rear assumptions.
- JavaScript syntax checked. **Actual iPhone Safari touch and appearance, and the user's saved Fox/New01 clips, are not yet device-tested.**

## Acceptance check

Open **Fox → Rig**, inspect the elbow/knee directions; go to **Animate → Idle** and choose a Paw Target, then raise it. The knee should stay on the anatomical side established by the rest rig rather than crossing over. Repeat for front and rear, and test Walk/Run. On **New01**, verify that changing Paw Targets now matches the same edited rest rig. Save is not required just to preview this correction.

## Included files

`fox-rig.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.15.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
