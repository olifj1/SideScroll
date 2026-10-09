# SideScroll patch 1.0.134e

**Cumulative changed-files-only patch over v1.0.134.** This roll-up includes v1.0.134a/b/c/d plus the shared Add-picker consistency pass below. Apply this ZIP directly over v1.0.134; the earlier lettered patches are not required separately.

## v1.0.134e — shared Add picker workflow

- Standardises Puzzle collection authoring on the same interaction pattern as Add Asset: the left drawer shows the authoritative applied list plus one Add button; the available choices open in the existing separate right-hand editor palette.
- `+ Add Zone` no longer nests a second menu inside the Puzzle drawer. It opens the right-side palette with `Procedural Exclusion` and `Respawn Trigger` choices.
- `+ Add Logic` now mirrors the same workflow. The permanent Logic type selector has been removed; the picker contains only compatible Logic systems that are not already applied.
- Choosing a Zone or Logic type creates it, closes the right-side picker automatically, and selects the newly-created record in the main drawer.
- Re-tapping the active Add button, pressing the palette `×`, switching away from that Puzzle tab, or leaving Puzzle Edit dismisses the picker without creating anything.
- The ordinary Add Puzzle Piece / Add Environment Asset buttons no longer appear active merely because the shared palette is being used as a Zone/Logic picker.
- Records the shared UX rule in `SIDESCROLL_TASKS.md`: **authoritative applied list + one Add button + shared right-side picker** for comparable collection editors.

## Included from v1.0.134d

- Zones lists are authoritative: only genuinely attached zone records appear.
- False disabled Respawn Triggers originating from pre-Zones default scaffolding are filtered out, while genuinely enabled legacy respawn data and explicitly-created modern disabled respawns remain valid.
- Zone numbering is per type (`Procedural Exclusion 1`, `Respawn Trigger 1`).

## Included from v1.0.134c/b/a

- Adds quick Puzzle Management `Reset Puzzle`, clearer Set/Reset Start State wording and visible Test `Reset` / `Back to Setup` controls.
- Protects migrated Zones / Logic / Cart Path data when old Start snapshots do not contain modern schema fields, while keeping explicit modern empty fields authoritative.
- Makes Setup Reset a real one-step Undo transaction and gives explicit Revert to Template the correct authoritative migration semantics.
- Clears stale Cart Path drafts when authoritative puzzle/template data is replaced or removed.
- Makes reward cleanup provenance-safe rather than deleting an unrelated same-type collectible.

## Known open Logic work

Broken Bridge can still be described incorrectly by the current legacy Logic inference (for example Socket Completion / Forest Key). This remains intentionally open for the planned reusable `Event -> Conditions -> Actions` Logic-foundation pass, including Asset Lab state transitions and reusable Animation Path triggering.

## Changed files

- `sidescroll.js`
- `play.html`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Fallen Tree → Zones → `+ Add Zone`: picker appears separately on the right, not nested in the left drawer; selecting a type closes it and selects the new zone.
2. Tap `+ Add Zone` again while its picker is open: it should dismiss without mutation. Repeat using the palette `×`.
3. Fallen Tree / disposable puzzle → Logic → `+ Add Logic`: same right-side picker pattern, showing only compatible systems that are not already applied.
4. Choose a Logic system: picker closes, the new system appears selected in the authoritative Logic list, and Undo removes it in one step.
5. Switch from Zones/Logic to another Puzzle tab while the picker is open: the picker should close.
6. Confirm Add Puzzle Piece / Add Environment Asset still use their normal right-side asset browser and are not highlighted while a Zone/Logic picker is open.
7. Continue the v1.0.134d migration checks: puzzles that never used respawn show no ghost Respawn Trigger; Broken Bridge keeps its genuine respawn.

This patch has been statically validated but has **not** been tested on-device by ChatGPT.
