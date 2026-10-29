# SS-PATCH-1.1.20 — Rotated joint offsets and free-end reach

## Installation

Apply this **changed-files-only** patch directly over **v1.1.19** in the flat SideScroll repository. Replace only the included files; reload Anim Lab after publishing. Service-worker cache: `sidescroll-runtime-v130`.

## Changes in this drop

1. **Joint line Local X/Y offsets now follow the joint's rotated axes.** Previously, rotating the mitre rotated the visible line but offsets still moved in the unrotated rest-bone coordinate frame. Local Y now travels *along the rotated joint line*; local X travels perpendicular to it. Both axes are evaluated in the resting/bind pose. The UI labels clarify this behaviour. X/Y range is ±0.60 m to accommodate equivalent rotated coordinates.
2. **Free-end extension** in **Skin → Joint boundaries → Edit joint**. This additional slider is shown **only at terminal chain ends** (e.g. leg Socket and Paw; not Knee/Hock). Positive metres extend the influence cap beyond the physical bone endpoint in the outward rest-chain direction; negative values retract it. Valid range is -0.25 to +0.65 m. Terminal extension is independent of mitre rotation and X/Y offset. Select the Socket at the *top* of the hind leg from the user's screenshot to extend its coverage upward, then adjust line width as needed.
3. **v1.1.19 saved-boundary compatibility.** Previous joint-boundary bindings (missing `jointOffsetFrame`) continue drawing and using their **unchanged baked weights** with legacy unrotated offsets until explicitly edited. The UI shows equivalent offsets in the new rotated frame. The first edit converts *all* existing offsets to rotated-frame coordinates without moving the visible caps, recalculates the final binary weights, and writes `jointOffsetFrame:'rotated-v1'`. Fresh conversions directly use rotated-frame coordinates. The optional `endExtension` field defaults to zero.
4. Live changes use the existing Setup transaction, Save/Discard, Undo/Redo, coverage counts and invalid-polygon refusal. Neither extra reach nor offset changes touch any other joint's cap.

## Unchanged

Joint regions remain **strictly binary** (100% single bone / unassigned outside). No new blending, soft falloff, mesh subdivision, rig node, IK adjustment, per-frame rebind or render-performance change. Existing bone-rectangle and older capsule modes remain untouched. Rest/bind ownership is computed on deliberate authoring edits only.

## Tests

- Node JS syntax checks on modified scripts.
- Synthetic geometry: local X and Y follow rotated directions at 30°; terminal extension expands root/tip outwards but does nothing to middle joint; adjoining regions reuse the identical shared knee cap.
- Migration test: existing v1.1.19 offsets/rotation retain all cap endpoints to within 1e-8 m after conversion, with no initial rebinding.
- Real Fox rig: all six unbranched chains (body, four legs, tail) produce valid convex bone regions with both terminal caps extended +0.06 m.
- Headless Chromium, synthetic 896×414 DPR2 touch UI: Fox Skin assembled part → bind → joint mode → select hind Socket → extend 0.15 m and commit → switch to Knee; extension slider appears only for Socket, persisted Setup field round-trips, no page JavaScript exceptions.
- **Not verified:** the user's private New01 source PNG/data or real iPhone Safari. Skin deformation results still depend on adequate Atlas mesh vertices in the newly covered region; extending a shape does not add vertices.

## Files in this release only

`anim-lab-assembly-skin.js`, `walk-lab.js`, `walk-lab.html`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.20.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `SIDESCROLL_EXPORT_COVERAGE.md`.
