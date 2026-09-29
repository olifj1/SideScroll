# SideScroll v1.0.68 — Puzzle Lab foundation + Mountain Climb prototype

## Base expected
Apply this patch over the current **SideScroll v1.0.66** repository state (World Lab Snap + Resize).

This patch is cumulative with the untested v1.0.67 Mountain Climb patch. **You do not need to apply v1.0.67 separately.** If you already did, v1.0.68 safely overwrites the same files and adds Puzzle Lab.

## Added files
- `puzzle-lab.html`
- `puzzle-lab.css`
- `puzzle-lab.js`
- `mountain-climb-rock-01.png`

## Changed files
- `README.md`
- `index.html`
- `sw.js`
- `puzzle-groups.js`
- `sidescroll.js`
- `play.html`
- `asset-lab.html`
- `asset-lab.js`
- `design-doc.json`

## Deleted / renamed files
None.

## What this patch does

### Puzzle Lab v1
Adds a first-class **Puzzle Lab** entry to the SideScroll launcher.

Puzzle Lab is a dedicated reusable-puzzle sandbox rather than another copy of the game runtime. The dashboard chooses a puzzle project, environment and test position, then launches the existing game renderer/editor in an isolated Puzzle Lab mode.

Puzzle Lab mode uses its own local storage for:
- puzzle runtime state;
- authored Set Start state;
- temporary puzzle library/workshop state;
- inventory;
- exclusion setup;
- scene edits/dressing;
- terrain-section edits.

This means sandbox testing does **not** move the main game puzzle instances, rewrite World Lab placement or overwrite the normal scene layout.

Asset-level authoring remains shared intentionally. If Asset Lab / in-game asset setup changes the rock's collision, ground line or **Climbable** behaviour, that remains the reusable definition used everywhere.

The dashboard can open:
- built-in puzzle definitions;
- reusable puzzles already stored in the user's main Puzzle Library.

A local-library puzzle is copied into the isolated lab launch as a test definition/template; the main template is not modified by Lab Set Start.

### Sandbox controls
- Environment: **Blank / Woodland / Mountain**.
  - Woodland uses current procedural forest dressing.
  - Blank and Mountain currently use a clean stage without woodland dressing. Mountain rendering/biomes will connect later.
- Marker placement presets:
  - **Section centre** = 0 m
  - **Boundary** = 5 m
  - **Offset** = 2.3 m
- Optional collision overlay.
- **Open Setup** opens the isolated puzzle in the existing puzzle editor.
- **Run Test** immediately enters the existing disposable Test/Reset flow.
- Returning from the game uses **← Puzzle Lab** rather than Home.
- Puzzle Lab-specific Reset clears only Lab test data.

### Mountain Climb Prototype
Includes the v1.0.67 climb prototype work:
- processed/dilated `mountain-climb-rock-01.png`;
- placeable Mountain Climb Rock asset;
- solid/support collision aligned to the painted upper path;
- reusable **Climbable** asset behaviour;
- ACTION-driven climb / mantle / climb-down prototype;
- procedural placeholder climb pose;
- normal walking/jumping support once Aureli reaches the top.

A new built-in **Mountain Climb Prototype** puzzle definition contains one climb rock and is the default first Puzzle Lab project. It is **not placed in the main world automatically**.

### Design Lab
Adds a merge-safe new Puzzle Lab implementation entry documenting the isolation/storage contract and next steps.

## Test focus
1. Upload all files in this patch to the repo root.
2. Let GitHub Pages update, then fully close/reopen the installed PWA once because `sw.js` adds the new Lab shell files to the existing stable cache.
3. Open Menu → **Puzzle Lab**.
4. Confirm **Mountain Climb Prototype** is selected by default.
5. Leave Environment on **Mountain**, marker at **0 m**, collision overlay ON.
6. Tap **Open Setup**.
   - The game should open directly in puzzle-edit mode.
   - Only the isolated climb puzzle should be present; normal world puzzle placement should not be edited.
   - The top-left back link should read **← Puzzle Lab**.
7. Return to Puzzle Lab and tap **Run Test**.
   - Aureli should begin at the puzzle entry point.
   - Approach the rock, use CLIMB, mantle to the top, walk across the painted top and try CLIMB DOWN.
8. Repeat at **5 m Boundary** and **2.3 m Offset** to confirm the prototype is not dependent on one section centre.
9. Open normal **Edit / Test** or **World Lab** afterward and confirm existing main-world puzzle positions are unchanged.
10. If a local reusable puzzle exists, confirm it also appears in Puzzle Lab with a **LIBRARY** badge.

## Known scope / deliberately deferred
- This is Puzzle Lab v1, not the final portability harness.
- Automatic move/reload/delete/recreate/stream-out-in test sequences are still to come.
- Mountain currently means a clean test stage; the real mountain biome renderer is not connected yet.
- Climbing currently derives its route from the rock's collision side. Explicit authored climb zones and proper Anim Lab climb/hang/mantle clips come next if the spatial prototype works.
- Sloped terrain remains deliberately deferred until this single-rock climb/walk test is proven.

## Workflow reminder
Normal SideScroll patches remain physically flat for the iPhone GitHub upload workflow. Every patch includes this README. Do not clear normal PWA/local authoring storage to install this patch.
