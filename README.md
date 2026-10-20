# SS-PATCH-1.0.204 — Lab Export Coverage (Stage A)

**Install directly over v1.0.203.** This patch contains only changed files. It **does not** reset or migrate existing SideScroll browser data or alter any PNGs, playable world code, characters or animation keys.

## What's new

- **Puzzle Lab → Lab Data:** Export Puzzle Data / Import Puzzle Data (reusable puzzle definitions, groups, puzzle sandbox state, player puzzle state and other saved puzzle keys).
- **Asset Lab → Data (bottom of inspector):** Export Asset Data / Import Asset Data (all saved asset settings).
- **Anim Lab → Character Library → Load → All Anim Lab data:** Export All Anim Lab Data / Import All Anim Lab Data (library and built-ins, clips, rigs, skin, editor settings). No extra buttons in the primary New / Load / Save toolbar. Bulk import is disabled while a character has unsaved edits or Play is active.
- Each exported file is a **real `.json` attachment**, handled with the native iPhone Share → Save to Files flow like Project Backup. Download fallback if file sharing unavailable. Exports do not modify saved work.
- **Import** validates matching Lab, supported keys, entry sizes and manifest, gives a preview of new/overwritten entries, requires confirmation, and attempts rollback on any write failure. Existing keys absent from an import are **not** deleted. Do **not** run imports during ordinary export testing; they can overwrite newer work.
- **World Lab's Complete Game export format v3** includes independently saved Puzzle Lab sandbox keys, player puzzle state, and the live Design Lab v2 working document (also preserving v1 legacy data). World Lab still accepts older v1/v2 exports.
- **Project Backup** now includes two older SideScroll/WalkLab-prefixed keys that the previous filter listed as excluded, *if* they are still stored on your phone.
- New `SIDESCROLL_EXPORT_COVERAGE.md` tracks which Lab owns each dataset and remaining gaps; all three canonical docs updated.

## What to test

1. Keep your v203 Global Snapshot in iCloud Drive.
2. Patch v204, then **save current work in your Labs**. Open Puzzle Lab, Asset Lab, Anim Lab (Load menu) and try each *Export* button. Each should produce one file: `SS-LAB-PUZZLES-...json`, `SS-LAB-ASSETS-...json`, `SS-LAB-CHARACTERS-...json`.
3. Export World Lab → Complete Game. Export Project Backup once more if you want the additional older keys captured.
4. For now **do not press Import** on your working iPhone unless intentionally restoring. Share the files if you want a cross-check of the resulting Lab formats.

## Scope/limits

This is **Stage A**, not yet Global Restore. The Global Snapshot remains audit/export-only. Lab data files capture **browser-stored values**, not source PNG pixels or files stored outside the browser; **unsaved edits are never included**. New character artwork uses bundled placeholder files. Independent Hero 1/Hero 2 handoffs, imported-art packaging, IndexedDB review, full global restore and GitHub build promotion are outstanding.

## Automated checks

- Node syntax checks for touched JavaScript.
- Headless Chromium with the exact uploaded v203 Snapshot values: Puzzle (32 entries), Assets (7), Anim (18), all with byte-preserving export → import roundtrip and out-of-scope import rejection.
- Headless Chromium running real World Lab JS: v3 JSON has 15 independent Puzzle Lab keys plus live v2/legacy v1 design documents; importing v3 restores sandbox and v2 Design Lab values.
- **Still requires device approval:** actual iPhone PWA share sheet, import review UI, and preservation of local app state after reload.
