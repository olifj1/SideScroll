# SS-PATCH-1.0.195 — Anim Lab workspace & unified Display (P3a)

**Install directly over v1.0.194.** Contains only files changed in this release. v1.0.193 is the last build the user explicitly confirmed on-device; keep an installable backup. Do not reapply old experimental patches, replace atlases, or clear Safari site data.

## What changed

- One prominent **Workspace** selector: Parts, Rig, Skin, Animate, Play. It uses the existing edit guards: if there are unsaved changes when leaving an edit stage, Save / Discard / Cancel appears. The previously duplicated top-level Animate/Rig/Play and nested Rig/Parts/Skin rows are hidden, not removed from the underlying modules.
- A single **Display** panel, collapsed by default on first use (user collapse choice retained): Artwork Show + opacity (0–100%), Static Reference Show + opacity, Motion Reference Show + opacity, Bones, Planes, Collider, Ground/Ruler, Part outlines, and context-specific Rig binding preview / Parts difference. Source choice, alignment, motion-reference timing and Fox mesh/wireframe/inspect controls remain in collapsible *subsections of Display*. Existing inputs/handlers are reparented, not replaced by disconnected duplicate sliders.
- Selection tools appear first under each workspace: Parts Layout, Rig Designer, Skin Weight Editor, Animate controls; collider and character scale now appear below Rig rather than before its joint board. Clip chooser and frame timeline are hidden outside Animate. Viewport pad and pan/zoom remain unchanged.
- Art opacity, show/hide layers and part-outline visibility are **editor-display preferences**, stored separately from character data. Switching to Rig no longer silently forces ghost opacity, collider, ground or Static Reference visibility. Motion Reference preferences are auto-saved per character+clip without marking character edits dirty; they do not enter Undo.
- No source artwork, meshes, clip keys, rigs, gameplay renderer or library schema altered. This release is a UI framework improvement; it does not deliver new character creation/library functionality.

## Suggested iPhone acceptance test

1. Open Anim Lab and select **Fox**. Use top Workspace selector to visit Parts, Rig, Skin, Animate and Play. In each stage, confirm its inspector appears first and the irrelevant ones are hidden. Character and clip contents should remain intact.
2. Expand **Display**. Change Artwork to 25% and back to 100%. Toggle Static Reference Show, choose Fox Shape in its advanced source section, vary opacity, then hide it. Change Bones, Ground, Part outlines and optional Mesh wireframe. These actions should not enable Save or affect Undo.
3. In Parts move a part slightly with the right pad, then select Rig: the unsaved guard must appear. Cancel must preserve the change; Save and Discard should work. Repeat from Skin. With Rig open, artwork must stay in place when you move joints; previous confirmed 193 behaviour must remain.
4. Try Rig bind preview and Parts difference from **Display**, which must both remain off until chosen. Check Motion Reference Show/opacity and source/timing in Display (when a reference pack exists). Motion controls must not dirty the rig/animation working copy.
5. Reload; ensure Display preferences survive. Enter Quick Play and return; the prior Display settings must return. Verify portrait/landscape safe areas, left-thumb selection/right-thumb pad, pan and pinch zoom.

## Checks done

Node syntax verification and automated Chromium landscape/touch-mode tests on the actual Fox atlas and inlined application scripts passed: five-stage navigation, screen visibility, collapsible Display, independent art/reference opacity, no-dirty display updates, skin-weight edit + Save, unsaved guard + Cancel, Quick Play return, initial and stored display state, and Motion Reference settings with a compatible reference manifest. This is **not** a Safari/iPhone sign-off. P3b follow-up should use actual iPhone feedback to refine panel density/visual hierarchy and any remaining duplicate or mode-inappropriate controls.

## Files

`README.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`, `walk-lab.html`, `walk-lab.js`, `anim-lab-stage2.js`, `anim-lab-reference.js`, `anim-lab-rig.js`, `anim-lab-art-layout.js`, `anim-lab-ui.js` (new), `style.css`, `sw.js`.
