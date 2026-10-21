# SS-PATCH-1.1.6 — Parts editor organisation

**Install:** Extract this ZIP directly over v1.1.5. It contains changed/new files only, not the complete game. Do not replace unrelated assets or remove local browser data. Publish to GitHub Pages and refresh the PWA after the updated service worker cache (`sidescroll-runtime-v116`) activates.

## Changes in this drop

- Parts now uses an Atlas-like, single **Assembled parts** list. Each row has a name selector and Hide, Solo, Lock. The list does not trap ordinary 6-part assemblies in a short inner scroll; 15+ parts use a bounded 520px list.
- Retained **Add** (multi-source picker), **Delete selected** (multiple marked rows), **Select all**, **Clear all** (confirmation), without another assembly panel or Original/New switch.
- **Edit selected part** is a contained group for Move/Rotate/Scale/Pivot, Free/X/Y/Fine, editable numeric properties, layer order, Rename, Duplicate, Delete and resets. The original viewport thumb pad remains the movement surface; dragging the image remains pan/zoom.
- **Advanced** collapsible group holds clipboard paste/copy, legacy near/far copying, static reference and difference tools instead of cluttering the primary inspector. Only compatible legacy near/far tools are shown for legacy layouts.
- Assembled-instance **Rename** persists a `nameOverride` in its existing `artLayout.assembly.instances` record; source mesh IDs and names are untouched. Without an override the list still reflects current Atlas source renames. **Duplicate** adds another instance of the same mesh/source with independently editable transforms and no automatic `copy` name. Normaliser safely preserves the optional override on Save, Undo/Redo, and reload. No new separate storage key.
- Hide, Solo and Lock are display/edit-session-only, do not dirty or export character data. Locked instances cannot be dragged, numerically edited, reordered, renamed, duplicated, or removed until unlocked. Lock is reset on character switch, consistent with Atlas's editor lock semantics.

## Device verification

1. Open Fox → Parts. Confirm the ordinary Parts list displays one row per assembled part with working Hide, Solo, Lock; the list scrolls only with 15+ rows.
2. Select a name; use X/Y or the original right thumb pad. Lock that row and verify numeric/pad actions disable; unlock to edit.
3. Select several names; Delete selected; Undo. Clear all (confirm), Undo; add multiple meshes via Add and Create.
4. Duplicate one assembled part and move it; Rename that instance, Save; return and check the name. Rename its original source in Atlas; check the instance **without** an override updates while the independently named instance keeps its override.
5. Test layer order and optional Advanced clipboard/reference tools. Confirm switching to Rig/Skin/Animate/Play never silently changes stored geometry or weights.

**Automated validation:** Node syntax checks and isolated inline-resource Chromium tests covered the live six-part UI, selection/locking, multi-select delete/undo, clear/undo, Atlas Add multi-create, instance duplicate and rename/undo, Hide/Solo, and core Save (using a browser-storage stub). No page JavaScript exceptions were seen. **Actual hosted iPhone/PWA testing is still pending.** The test environment did not prove Skin or game rendering.

**Unchanged limitations:** Imported PNG bytes remain device-local, and newly assembled Atlas meshes are not yet weighted/animated by Skin, Animate, Play or gameplay.

**Files included (11):** `anim-lab-art-layout.js`, `walk-lab.js`, `walk-lab.html`, `style.css`, `sw.js`, `README.md`, `README.txt`, `README-PATCH-1.1.6.md`, `SIDESCROLL_CHARACTER_AUTHORING.md`, `SIDESCROLL_ENGINE_UX_BIBLE.md`, `SIDESCROLL_TASKS.md`.
