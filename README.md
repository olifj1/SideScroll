# SideScroll patch 1.0.134c

**Cumulative changed-files-only patch over v1.0.134.** This roll-up includes all v1.0.134a and v1.0.134b changes plus the follow-up workflow/migration audit fixes below. You do not need to apply 134a or 134b separately if you apply this ZIP to v1.0.134.

## Included from v1.0.134a

- Adds `Reset Puzzle` to Puzzle Management for a quick reset without entering Edit Puzzle.
- Clarifies Setup wording: `Reset to Start State` restores the saved Reset/Test start; `Set Start State` records the current setup as that start. Linked instances use `Set Start State + Apply Template` because the action updates the reusable template and linked instances.
- Restores visible Puzzle Test controls: `Reset` and `Back to Setup`.
- Records the next Logic architecture target in `SIDESCROLL_TASKS.md`: small reusable `Event -> Conditions -> Actions` pieces, Asset Lab state transitions, item combination/use, Animation Path activation/completion, then a later editor built on the proven runtime.

## Included from v1.0.134b

- Fixes legacy Start snapshots removing migrated Puzzle Zones during `Reset to Start State`.
- Missing legacy `zones[]` now preserves the last saved/checkpointed migrated Zones; explicit modern `zones: []` remains authoritative.
- Applies the same compatibility rule to Applied Logic when an old Start snapshot has no `logic[]`.
- Tightens legacy Cart Path reset fallback to the edit checkpoint/saved runtime path instead of an arbitrary unsaved in-memory path.

## v1.0.134c follow-up audit fixes

The recent Puzzle workflow buttons were traced through their snapshot, migration and persistence paths: Management Reset, Setup Reset, Set Start / Apply Template, Test, Test Reset, Back to Setup, Save, Discard, Revert to Template, Zone add/remove, Logic add/remove and Cart Path authoring.

- `Reset to Start State` inside Puzzle Edit is now one real editor transaction. The previous UI said Undo could restore the pre-reset setup, but the reset was not actually being entered into Undo history.
- `Revert to Template` now upgrades an older template into the current Zones / Logic / Cart Path schema *before* applying it. Reset needs to preserve scene-side migrated data when an old Start snapshot lacks a field; explicit Revert has the opposite semantic and must not accidentally preserve scene-only Zones/Logic/Path data.
- Applying a Start State to all linked instances, clearing/removing puzzle instances, and deleting a puzzle template now also clears the in-memory Cart Path draft cache. This prevents an old path from surviving after the authoritative puzzle/template data has been replaced or removed.
- Puzzle reward cleanup no longer blindly deletes an unrelated same-type legacy inventory item when there is no evidence that the item came from the puzzle being reset. Modern source/provenance data remains authoritative; legacy fallback is used only when that puzzle still has collected-reward metadata.
- Test Reset restores the captured pre-test inventory and only removes a reward explicitly provenance-tagged to the tested puzzle; it no longer uses an ambiguous same-item legacy fallback.

## Audit result

No equivalent schema-loss issue was found in Test / Back to Setup, Save / Discard, Zone add/remove or Logic add/remove. Those paths operate on current-schema editor snapshots/drafts, and explicit empty `zones[]` / `logic[]` remain meaningful rather than being repopulated by migration.

The separate known Logic-model problem remains intentionally open: Broken Bridge can still be described incorrectly by the current legacy Logic inference (for example Socket Completion / Forest Key). That belongs to the planned reusable Logic-foundation pass rather than this workflow-safety patch.

## Changed files

- `sidescroll.js`
- `play.html`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Fallen Tree / another migrated puzzle: `Reset to Start State` keeps its Procedural Exclusion and suppressed grass; Undo restores the exact pre-reset edit.
2. Puzzle Management: `Reset Puzzle` restores the saved Start State without leaving Management and does not remove unrelated inventory collectibles.
3. Puzzle Test: `Reset` restarts the captured test setup and `Back to Setup` returns to the same editable setup/session.
4. A legacy linked puzzle: `Revert to Template` actually follows the shared template rather than retaining scene-only Zones/Logic/Cart Path data.
5. A linked puzzle with an authored Cart Path: use `Set Start State + Apply Template`, then revisit/reload another linked instance and confirm the current template path is used rather than an older cached path.

This patch has been statically validated but has **not** been tested on-device by ChatGPT.
