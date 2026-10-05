# SideScroll Development Tasks

Persistent working backlog for the SideScroll / Aureli project. Keep this file in future builds and update it as tasks are completed, split, reprioritised or discovered.

## Immediate editor polish

- [x] Stabilise World Group membership persistence through scene reconstruction. (`1.0.108`)
- [x] Lock World Groups by default and require explicit Edit Group mode for member editing. (`1.0.107`)
- [x] Restrict locked-group movement to the yellow group origin dot. (`1.0.109`)
- [x] Keep authored/manual assets spatially unique rather than wrapping around the world tile. (`1.0.113`)
- [x] Refresh Asset Lab behaviour/config changes when returning to Play. (`1.0.114`)
- [x] Add multiple procedural exclusion zones per World Group. (`1.0.115`)
- [x] Add per-section and global procedural reset controls. (`1.0.115`)
- [x] Add climb-entry interaction/action dots. (`1.0.115`)
- [x] Add direct Duplicate Group with new group/member IDs and copied layout/settings/exclusions. (`1.0.116`)
- [x] Replace projection-inversion depth dragging with stable relative screen-space depth deltas for authored assets and the locked-group move dot. (`1.0.116`)
- [ ] Continue checking selection/tap cycling in dense authored scenes and fix any remaining ambiguous picks.
- [ ] Keep editor menus mutually exclusive and restore the previous menu cleanly where appropriate.

## World Groups

- [x] Basic World Group creation, membership, rename, dissolve and deletion.
- [x] Reusable Save Group / Place Template workflow.
- [x] Terrain-aware whole-group movement preserving each member's Ground / Free behaviour.
- [x] World Group exclusion zones suppress procedural biome dressing.
- [x] Multiple exclusion zones with add/select/edit/fit/delete controls.
- [x] Direct one-off Duplicate Group workflow independent of templates. (`1.0.116`)
- [ ] Review whether any additional per-member authored state should be captured by both Duplicate Group and Group Templates as new asset behaviours are added.
- [ ] Represent World Groups consistently as authored spatial blocks/extents across Play and World Lab.
- [ ] Further World Group / World Lab integration and polish as authoring usage exposes gaps.

## World Lab

- [x] Timeline view with sections, puzzles, World Groups and biome/profile transitions.
- [x] World Group timeline movement queues terrain-aware moves back to Play.
- [ ] Continue improving direct timeline placement and pacing workflow.
- [ ] Refine authored spatial-block display, selection and extent editing for World Groups / puzzles / standalone authored content.
- [ ] Add a global Streaming panel to World Lab rather than per-object load/unload markers.
- [ ] Keep direct “Play from here” and metre snapping coherent as streaming is introduced.

## Undo / editor history

- [ ] Assess and define Undo architecture before implementation; avoid bolting isolated undo buttons onto individual tools.
- [ ] Use transaction-style history so one pointer drag records one undo action, not every pointer-move frame.
- [ ] Cover meaningful authored actions: move asset, duplicate/delete asset, group membership changes, move/duplicate/delete group, exclusion edits, terrain/section edits and procedural reset where practical.
- [ ] Decide snapshot vs command/diff granularity for scene data, terrain data and puzzle-owned state, with memory limits suitable for iPhone Safari.
- [ ] Add redo only after Undo semantics are stable.

### Undo architecture assessment

Recommended direction: add one central bounded authoring-history service rather than separate undo implementations per editor. Tools begin a transaction when a meaningful edit starts, capture the minimum persistent state they own, and commit a single before/after history entry when the interaction finishes. Pointer drags therefore begin on pointer-down and commit on pointer-up only if state changed. Scene edits should snapshot the relevant `sceneData` rows/groups; terrain edits should snapshot the affected terrain-section state; puzzle tools should use the puzzle instance/library persistence layer rather than raw runtime objects. Avoid cloning full render/runtime collections every frame. Start with a modest bounded history (for example tens of actions) suitable for iPhone Safari, then measure memory before expanding it.

## Streaming / performance

- [ ] Build a diagnostic Performance panel aimed at finding intermittent stutter rather than only displaying FPS.
- [ ] Show FPS and current/average frame time plus recent/worst frame spikes.
- [ ] Show active/rendered object totals broken down into procedural biome objects, authored loose objects, World Group members and puzzle objects.
- [ ] Add useful collision/update counts and JS update/render timing where instrumentation cost stays low.
- [ ] Report loaded image/texture/resource counts where available.
- [ ] Add a short rolling spike history or capture mode so a bad frame can be correlated with object/update counts.
- [ ] Profile the same-looking scene in smooth vs stuttering runs before changing rendering architecture.

### Global authored-content streaming policy

Do **not** add individual load/unload markers to every group, puzzle or object. World Lab should own a global policy, initially including:

- [ ] Preload distance ahead of the player/camera.
- [ ] Retention / unload distance behind.
- [ ] Potential platform-specific values later if iPhone/iPad/desktop need different budgets.
- [ ] Apply the active window to World Groups, puzzles and standalone/manual authored objects.
- [ ] Use each authored unit's spatial bounds to decide when it enters/leaves the active window.
- [ ] Treat a standalone authored object automatically as a one-object streaming unit; grouping must never be required purely for streaming.
- [ ] Restore unloaded authored content correctly when backtracking re-enters its active window.
- [ ] Keep biome procedural dressing under the existing biome / two-biome transition system rather than the authored-content streamer.

Conceptual ownership stays:

- **Biomes** = continuous procedural landscape.
- **World Groups** = authored environmental places.
- **Puzzles** = authored/stateful gameplay set-pieces.
- **Standalone objects** = authored exceptions.

## Asset / texture streaming

Later, separate from authored-object activation:

- [ ] Add a real asset/texture manager.
- [ ] Active group/puzzle/object requests the textures/assets it needs.
- [ ] Shared textures use reference counts.
- [ ] Leaving the active window releases references.
- [ ] When no active content references a texture, delete/release the WebGL texture.
- [ ] Keep the browser/service-worker cached source available for fast reload and offline use.
- [ ] Measure texture memory/re-upload cost before selecting unload thresholds.

## Puzzle / editor systems

- [x] Puzzle instances own their authored/stateful objects rather than leaking them into loose scene storage.
- [x] Puzzle exclusion, respawn and cart-path editing tools are integrated into Play.
- [x] Thought Nodes and Camera Nodes can be authored as placeable objects.
- [x] Asset Lab supports collision editing and reusable asset behaviour configuration.
- [ ] Proper Undo coverage for puzzle editing once the shared history architecture exists.
- [ ] Continue puzzle authoring workflow polish before reviving a larger standalone Puzzle Lab redesign.
- [ ] Continue validating stack/socket/support behaviours on complex puzzle set-pieces.

## Art / content pipeline

- [x] Maintain the documented art/texture processing workflow and Art Bible conventions.
- [x] Soft-alpha extraction / colour dilation workflow established for generated foliage/tree assets.
- [ ] Keep source-to-game texture audits documented whenever a new texture set is processed.
- [ ] Continue biome/location asset production with consistent three-tone cel shading, restrained saturation and grounded silhouettes.
- [ ] Package/atlas assets only when the library and runtime trade-offs justify it; preserve editable sources.

## Longer-term polish

- [ ] Continue camera-node and cutscene-camera authoring polish.
- [ ] Expand audio beyond background music only after profiling a robust low-stall SFX path on iPhone Safari.
- [ ] Continue movement/climbing/contact polish as new terrain and puzzle cases appear.
- [ ] Revisit character designer / character variant workflow after the core world-authoring pipeline is stable.
- [ ] Store packaging pass for Steam / iOS / Google Play after gameplay length, performance and content streaming are mature enough.
