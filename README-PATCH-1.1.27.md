# SS-PATCH-1.1.27 — Character Lab scale/reference isolation + generalisation stage A2

**Install:** Apply this changed-files-only patch directly over accepted **v1.1.26**. It is not cumulative; do not skip prior accepted releases. Do not clear site storage, IndexedDB, saved rig/skin/animation data, or offline site data. Service worker cache advances to `sidescroll-runtime-v137`; reopen Character Lab and Play after updating.

## This drop
- Character Setup Scale now supports **0.55–8.00** (previous maximum 2.25) for Biped and Quadruped. The slider has an exact numeric entry for precise larger values. The game loader accepts the same range for built-in and saved local characters; the world collider scales along with the artwork, as previously.
- **Static Reference no longer scales when Character Scale changes.** It is drawn in the unchanged editor/world view. Reference Scale/X/Y/Opacity remain separate editor-only preferences. View zoom and pan intentionally still affect both.
- Each character can now keep its own Static Reference alignment. Legacy per-family reference preferences are still read as defaults and never destroyed. Save/Discard for the character does not modify editor reference preferences.
- Fit View handles enlarged characters. Pinch-out minimum zoom is reduced to 10% so giant characters can be inspected; the editor does not silently shrink the saved character.
- A rig adapter may now supply `POSE_CONTROL_DESIGNER.controls` (semantic authorable controls); existing Hero/Fox controls remain the fallback. This introduces an opt-in descriptor boundary for other rigs without changing the current pose codecs.
- New custom character records include semantic `rigFamily` (`biped` / `quadruped`) in addition to legacy `family` (`human` / `fox`) and `starter`. Older saved data and exports remain valid; no automatic rewrite is triggered by loading. The game's local character resolver exposes semantic family alongside the legacy runtime ID.

## Test on iPhone
1. In Character Lab, open built-in Fox and switch to Rig. Enable Static Reference, set source Hero 1, observe size. Change Character Scale 2.25 → 4 → 6 via slider and exact input. The reference must remain unchanged on screen while the Fox enlarges. The ground ruler should stay fixed. Test Save, reload and game selection. Repeat on Hero 1 and local New01.
2. Adjust the reference X/Scale for Fox, switch to New01 and adjust differently. Switch back; the saved per-character references should not overwrite each other. Original legacy family defaults should still show for characters without an override.
3. Fit View on a large character. Confirm it fits, with normal pinch/pan available. Save size, load in the game, check character drawing *and collision*. At large scales the character may be too tall to traverse existing puzzles; that is expected and not a physics fix.
4. Quick Play with Hero 1, Hero 2, Fox and New01. Confirm selection, save/undo/discard, atlas/rig controls and animations remain functional. Confirm game on/offline after cache updates.

## Verification and limits
Static code/syntax validation passed. Browser smoke tests should be repeated on iPhone Safari because native slider touch, imported IndexedDB PNG rendering and the game WebGL path have not been verified on-device. **This is Stage A2, not completion of Stage B.** Biped fully authored Parts/Rig/Skin, arbitrary-skeleton deformer, custom rigid bone attachments, animation asset collection/Climb/Carry and portable PNG-inclusive exports remain on the roadmap. Legacy Fox Handoff is retained solely for compatibility.
