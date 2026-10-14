# SideScroll patch 1.0.152 — Anim Lab workflow consolidation

Changed-files-only cumulative patch over the agreed **v1.0.150** baseline. v1.0.150 remains the approved baseline until this patch is tested and accepted. This patch includes all v1.0.151 Rig Designer work plus the v1.0.152 workflow/runtime changes below.

## What changes in v1.0.152

Anim Lab now uses one clear animation timeline directly below the viewport. The main scrub/play row is the authoritative 16-sample character timeline. The Key Pose lane sits immediately beneath it and uses the same frame selection, so key markers are no longer presented as a second independent timeline.

Motion Reference keeps its own cycle transport only when it is intentionally **Unlinked** (or while in Rig mode, where animation linking is unavailable). When linked, it explicitly follows the main animation timeline and its duplicate transport is hidden.

The large relative **Drag anywhere** precision surface now lives in the bottom-right of the viewport. The intended phone workflow is left-thumb selection from the Control Board and right-thumb posing on the viewport pad without repeatedly scrolling between the two.

All Anim Lab drawer sections now use a shared collapsible category pattern. Collapse state is editor-only preference data and does not alter selection, authored data, Undo/Redo, dirty state or Save/Discard. The Engine/UX Bible now defines this as the general pattern to migrate progressively into other long editor inspectors.

## Fox animation now runs in Play

Fox Anim Lab clips are no longer editor-only after Save.

- Fox Animate Save still compiles sparse keys to the existing 16-sample runtime format.
- Play now reads the saved Fox Walk / Run / Jump bank from `sidescroll.animlab.fox.clips.v1`.
- Each clip is validated independently.
- Missing or invalid saved clips fall back independently to the built-in `FoxRig` defaults.
- Previewing, scrubbing or editing without Save cannot change gameplay.
- Saved rest-rig proportions remain a separate character-definition layer and continue to be read through `FoxRig`.

This does **not** add planted-paw FK/IK/contact solving. Stage 4 remains the next animation-system milestone after this workflow pass is approved.

## v1.0.151 Rig Designer remains included

The cumulative patch still includes the descriptor-driven Fox Rig Designer from v1.0.151: 21 structural joints, Rear Body → Mid Root → Front Body spine, four explicit socket/knee/paw limb chains, tail chain, direct joint dragging, precision controls, measurements, symmetry/pair tools, ground reset, legacy reset, Undo/Redo/Save/Discard and safe persisted rest-rig playback.

The default rest rig still reproduces the v1.0.150 Fox geometry to floating-point equivalence and installing the patch alone does not reshape the Fox.

## Practical iPhone test

1. Open **Anim Lab → Fox → Animate**. Confirm the main Timeline sits directly below the viewport and the Key Poses lane sits directly under it.
2. Scrub the main timeline. Confirm both the character and highlighted key-pose sample stay synchronised.
3. Play/pause from the timeline below the viewport. Confirm no second character playback control is needed in the drawer.
4. Open **Motion Reference** with Link on. Confirm it says it is linked to the main timeline and does not show a second reference transport.
5. Turn Link off. Confirm Reference Cycle / Play Reference appears and can be scrubbed independently for alignment.
6. Select a Fox control from the left Control Board with your left thumb, then manipulate **Drag anywhere** in the viewport bottom-right with your right thumb. Confirm viewport pan/pinch does not steal the pad gesture.
7. Collapse and reopen Character, Clip, Mode, View, Key Pose Tools, Control Board, Motion Reference, Rig/Setup and Edit Session sections. Confirm collapse does not change dirty state, selection or Undo history.
8. Make an obvious temporary Fox Walk edit and **Save** it. Enter Play as Fox and confirm the saved walk is visible in gameplay.
9. Repeat with Run or Jump if useful. Confirm unsaved Anim Lab changes never affect Play.
10. Restore/author the desired Fox clip and Save it before continuing production work.
11. Re-check Rig mode: saved proportions still drive Play and Rig Designer behaviour remains unchanged.
12. Close/relaunch the A2HS PWA and confirm the updated shell and UI are present offline after the service-worker upgrade.

## Validation performed off-device

- All modified JavaScript parses with `node --check`.
- Modified HTML has no duplicate IDs.
- Main timeline retains the existing `animlab-prev`, `animlab-scrub`, `animlab-next`, `animlab-play` and `animlab-fit` ownership; only its layout moved.
- The Key Pose lane still uses `core.setFrame(frame)` and therefore remains synchronised to the same 0–15 sample selection.
- Motion Reference still derives linked playback from normalised Anim Lab phase; its independent transport is only hidden while linked, not removed.
- Precision pad keeps the same bounded pointer transaction code; only its DOM location moves into the viewport overlay host.
- Fox runtime loading validates 16-sample saved clips and resets to built-in defaults before applying saved data, providing safe fallback.
- Stage 4 FK/IK/contact solving has not been started.

Physical iPhone testing is still required for ergonomics, touch ownership, compact landscape layout, Safari native-range behaviour and A2HS/service-worker refresh behaviour.
