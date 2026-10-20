# SS-PATCH-1.0.200 — Unified Character Library and fixed sidebar

**Apply directly over v1.0.199.** Eight changed files only, no textures or game runtime. Keep your current v199 copy as rollback until iPhone approval. Do **not** clear Safari website data (character library and old Fox/Hero work are stored there).

## What is different

- Anim Lab now has **one Character Library** for *Hero 1, Hero 2, Fox and every locally created character*. The separate permanent Hero 1/Hero 2/Fox buttons are hidden, not removed from the underlying compatibility code.
- The opening library view has **New · Load · Save**, and always shows a clearly labelled **Loaded character: [name]** with Built-in/Local and Saved/Unsaved state. Only the chosen command expands its context.
- **New:** choose name and Quadruped/Biped starter. Saved new characters automatically appear in Load alongside the built-ins, without requiring any export/build rebuild.
- **Load:** Open from one list of built-in and local characters. Local-only secondary actions (Rename / Export JSON / Delete-with-confirmation) are behind `•••` so native characters cannot accidentally be deleted or renamed. Import JSON is also available. Unsaved switches still use Save / Discard / Cancel.
- **Save:** Save changes for whichever character is loaded using the existing Undo/checkpoint and Rebind+Save safeguards. Custom characters retain independent local documents; the original Fox/Hero continue using their established built-in storage (no silent migration). Existing duplicate Edit Session Save button is hidden; Undo/Redo/Discard remain accessible. Export JSON appears for a saved custom character; built-in Fox exposes its existing Fox Handoff export.
- Sidebar constrained to **vertical scrolling** with overflow/drift correction; menus closed by default. Does not intentionally alter native slider behaviour, rig/part/skin algorithms or animations.

## What is still NOT supported

A new custom character is saved in **this browser immediately**, but it is **not yet selectable in the normal game**. Export the saved character JSON to back it up or to share for future packaging. JSON export **does not contain artwork image bytes**. The separate native built-in Hero animation data still use their existing legacy family-level storage; this patch does not migrate or rework their internals. New artwork import, general biped Parts/Skin, named animation templates and a live in-game character selector remain follow-up stages.

## iPhone checks

1. Landscape open: no sideways scrolling sidebar; Loaded character label and only three primary Library actions. Side menu still scrolls vertically.
2. Load: see **Hero 1, Hero 2, Fox**. Select each and verify Loaded updates. No per-character buttons remain outside the Load list.
3. New: create a test quadruped; it opens and appears alongside the three originals in Load. Switch to Fox and back, without losing the custom character.
4. Edit custom setup; Save → Save changes; reopen and check persistence. Then edit the built-in Fox and Save to its original local data as before. Ensure unsaved switching shows the guard.
5. Rotate portrait→landscape, scroll the drawer and adjust a slider. Check it doesn't wander horizontally. Export a custom JSON backup before clearing website data.

## Verification

Node syntax checking passed. Headless Chromium tests with actual v199 SideScroll code and a mocked persistent storage API exercised both phone-like landscape viewport sizes (844×390 and 667×375), first screen, full list, native/custom Open, New, Save, unsaved-switch guard, local data isolation, and the no-horizontal-overflow sidebar. No JavaScript exceptions. Actual iPhone Safari elastic scrolling still requires your acceptance.

## Patch contents

`README.md`, `anim-lab-character-library.js`, `walk-lab.html`, `style.css`, `sw.js` (v200 cache), and the three canonical design/task documents. No atlas, image, animation clips, rig or game runtime changed.
