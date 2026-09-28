# SideScroll v1.0.63 — Concept Lab + World Lab — FLAT PATCH

## Important phone upload rule
This patch is deliberately **physically flat**. There are no subfolders inside the ZIP.

That is now a project rule for normal patches because the iPhone Files → GitHub workflow uses **Select All**, and nested folders make that impossible in one upload.

Concept Lab still organises images by location, but it does so virtually. Concept images use descriptive root filenames such as `concept-woodland-01.png`.

## What this patch contains
- Concept Lab
- World Lab v1
- Current environment concept images
- World Lab / Concept Lab navigation
- World Lab runtime integration changes
- Updated Design Lab guidance recording the flat-patch rule
- Updated README

## Concept image root files
- `concept-shared-game-view-reference.png`
- `concept-woodland-01.png`
- `concept-mountain-trail-01.png`
- `concept-mountain-transition-01.png`
- `concept-snowy-pass-01.png`
- `concept-wetlands-01.png`
- `concept-caves-01.png`
- `concept-settlement-01.png`
- `concept-barren-wastes-01.png`

## Other changed/new files
- `README.md`
- `index.html`
- `sw.js`
- `sidescroll.js`
- `design-doc.json`
- `concept-lab.html`
- `concept-lab-data.json`
- `world-lab.html`
- `world-lab.css`
- `world-lab.js`

## Upload instructions
1. Unzip this patch in the iOS Files app.
2. Open the unzipped patch folder.
3. Use **Select All**. Every item is directly in that folder.
4. Upload the selected files to the root of the SideScroll GitHub repository, replacing matching files.
5. Do not delete repo files that are not represented in the patch.
6. Wait for GitHub Pages to publish, then close/reopen the installed PWA once if needed.

## Test focus
### Concept Lab
- Confirm Concept Lab opens from the home menu.
- Confirm all location groups and concept images appear.
- Add a note and confirm it survives leaving/reopening the lab.

### World Lab
- Confirm World Lab opens and shows section/puzzle layout.
- Select Broken Bridge, move it, then use Jump to Game.
- Confirm the actual game applies the move through the normal puzzle-movement path.
