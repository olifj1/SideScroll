# SideScroll patch 1.0.156 — Anim Lab persistent Paw IK simplification

Cumulative changed-files-only patch against the approved v1.0.150 baseline. v1.0.156 remains a test patch until approved on iPhone.

## Why this pass exists

The first Stage 4 contact workflow made each leg swap between FK and IK and added per-key blend, Plant and Release ownership. On-device reference matching showed that this created more friction than value.

v1.0.156 simplifies the Fox workflow to the intended animation model:

- each leg is normally animated by one persistent **Paw Target**;
- move the Paw Target to create stance/swing motion;
- animate Mid Root / Front Body / Rear Body independently without dragging the Paw Target with them while the target remains reachable;
- no Plant / Release buttons and no author-facing FK/IK blend are required for normal Fox locomotion;
- old FK upper/lower channels remain internally for compatibility, but they are no longer the primary Control Board workflow.

## UI changes

- Fox Control Board now exposes one **Paw Target** per leg rather than Upper / Lower / IK controls.
- First drag of an older FK-only pose captures the current paw endpoint and enables IK automatically, avoiding a pop.
- Rig Designer now uses the same phone layout as Animate: select a joint in the left drawer and manipulate it with the bottom-right viewport drag pad.
- Near-side limb controls/bones use the stronger teal accent; far-side limbs use lighter grey. The distinction is applied in Animate, Rig Designer and Paw Target overlays.
- Ground Motion remains the editor-only stride/slip diagnostic.

## Example Walk

The teaching Walk foundation is bumped to `fox-walk-example-v3` and is rebuilt as persistent IK throughout all four legs. Stance Paw Targets travel backwards along the ground; swing Paw Targets move forwards and upward. Body/head/tail motion from the teaching example remains.

The old mixed FK/IK teaching Walk is intentionally not retained.

## Static/programmatic validation

- all project JavaScript parses;
- modified HTML local dependencies resolve;
- example Walk contains eight sparse keys and compiles to 16 runtime samples;
- all four example Paw Targets are IK-active on every key;
- all four knees/hocks remain on their explicit anatomical bend branch through all 16 samples;
- solved paw endpoints match their IK targets to floating-point precision for the example cycle;
- modest Front Body movement leaves a reachable Paw Target fixed while the leg re-solves underneath it;
- Plant/Release/contact compensation is no longer used by sparse evaluation;
- service-worker/runtime cache is bumped for the changed editor/runtime files.

## iPhone test

1. Install the patch over v1.0.150 and fully reload/A2HS relaunch if needed.
2. Open Anim Lab → Fox → Walk → Animate. Press **Reload Example Walk** once if the new example is not already shown.
3. Confirm each leg now has a single **Paw Target** in the left Control Board. Select one with the left thumb and move it immediately with the bottom-right viewport pad using the right thumb.
4. Confirm near limbs are the stronger accent and far limbs are lighter grey in both the list and skeleton.
5. Hold a Paw Target in a normal reachable position, then move Mid Root / Front Body / Rear Body. The paw should remain at its target while the knee/hock solves underneath it. Very large body moves can legitimately hit the limb reach limit.
6. Turn on Ground Motion at ×1. During stance, compare the backwards Paw Target movement with the ground marks; during swing, move the same target forwards/up. There is no Plant/Release step.
7. Switch to Rig. Select a socket/knee/paw in the left joint list and confirm the same bottom-right viewport drag pad is immediately usable without scrolling down the drawer.
8. Test Undo/Redo, Discard, Save/reload, then Save Walk and confirm Play uses it for the Fox.

Do not begin additional IK/constraint features until this simpler workflow has been judged on-device.
