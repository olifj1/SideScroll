# SS-PATCH-1.1.24 — Character chooser, Load close, Biped starter

**Install:** Apply this drop directly over **v1.1.23**. This ZIP contains only the files changed in v1.1.24, not cumulative prior patches. Publish to the same GitHub Pages repository; reload/reopen SideScroll and Character Lab to activate service worker `sidescroll-runtime-v134`. Your saves, image records, file routes, schemas and original character assets are not migrated or cleared.

**Delivered**

- Game **Menu → Change character** opens a separate scrolling **Choose character** panel instead of rotating blindly through IDs. Built-in and My characters groups display names, Biped/Quadruped, artwork technique, current selection, loading/error/ready state. Unavailable local characters remain visible with the actual error but cannot be selected. One tap selects and closes; Close/backdrop/Escape cancels without changing. A Character Lab link is present.
- Character Lab **Load** closes immediately following a completed clean selection or after a dirty-state Save/Discard guard succeeds. **Cancel does not close** the Load list or alter your unsaved work. Current character readout persists.
- Local **Biped starter** characters (saved in Character Lab with Human Walk/Run/Jump clips) can now play using the shipped Hero 1 rigid artwork/rig with each saved character's own clips, scale, collider and separate selection. The menu says **Hero starter art**. Human Idle and Climb/Carry/Pick Up/Put Down remain old fallbacks. This is *not* custom biped mesh artwork/Skin rendering.

**Phone checks:** Game → Menu → Change character: choose New01; ensure dialog closes and the saved selection survives reload. Open again: choose Hero 1, Hero 2, Fox; choose a local Biped if available, and check Walk/Run/Jump. Verify correct appearance, facing, collisions and FPS. If an atlas PNG is missing, its character should show an unavailable reason rather than selecting default Fox under its name. In Character Lab, Load a clean character and confirm the list closes; make a dirty edit and try Open → Cancel (list stays, edit kept), Open → Discard or Save (switch completes, list closes). Test phone landscape and PWA offline after updating worker.

**Still outstanding:** Atlas-deform Fox New01 in-game *visual parity* is not yet device accepted; `atlas-builtin-*` custom rigid-piece assemblies and genuinely user-authored biped Atlas/Rig/Skin remain unsupported. Imported PNG bytes are still device-local IndexedDB, outside JSON backup/restore. Character Lab updates require game reload. Dynamic animation list/New Animation/assignment, editable Biped Idle, Climb/Pick Up/Put Down/Carry clips and reusable templates remain subsequent stages.

**Checks performed:** `node --check` on changed JavaScript, a synthetic custom-Biped resolver and sparse-clip evaluation smoke test, and static source/HTML assertions. Full browser/WebGL navigation testing timed out in this environment; iPhone test is required before final acceptance.
