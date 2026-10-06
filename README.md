# SideScroll patch 1.0.125

Apply over **v1.0.124**.

## Stage 2B — Puzzle edit sessions and Undo/Redo

- `Edit Puzzle` now starts a bounded edit session with a checkpoint.
- The shared drawer footer now provides Puzzle `Undo`, `Redo`, `Discard` and `Save`.
- Ordinary Puzzle authoring writes are held during the session; `Save` commits the current scene-instance working edits, while `Discard` restores the session-entry state.
- Common Puzzle authoring actions now use the shared transaction history: object transforms/placement, Quick Tools edits, marker/bounds moves, exclusion move/resize/toggle, respawn edits, cart-path edits, sockets and authoring Reset. Continuous drags/sliders become one history action.
- Puzzle bounds now persist as a scene-instance working draft when the session is saved.
- `Test Current` stays disposable and returns to the active edit session.
- `Reset to Saved` inside Puzzle Edit now resets authored setup only, avoiding player inventory/reward mutations, and can be undone.
- `Set Start` and `Save Unique` remain explicit commit boundaries. They persist immediately, reset the session checkpoint/history, and are not reverted by later session Discard.
- Semantics are now explicit: `Save` = current scene-instance working overrides; `Set Start` = Reset/Test start state (and shared template for linked instances); `Save Unique` = detach the scene copy from its shared template.

## Validation

- `sidescroll.js` syntax checked after the Stage 2B changes.
- Full v1.0.125 tree reconstructed from the v1.0.115 baseline plus released patches for project-wide JavaScript syntax checks before packaging.
- HTML ID and external-script reference checks performed.

This is still Stage 2 work, not the final Puzzle Editor v2 pass. Detailed cart-path controls, richer template Apply/Revert presentation, rare puzzle-type action audit and crash-recovery drafts remain on the backlog.
