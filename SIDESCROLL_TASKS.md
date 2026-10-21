# SideScroll Tasks / Release Tracking


## v1.1.3 — Atlas topology and editability (20 October 2026; synthetic QA done, iPhone pending)

- [x] Live procedural preview for rectangle cells and outline/strip final triangulation, with numeric changes reflected before Commit, draggable outline/strip control handles during preview and Cancel leaving source data unchanged.
- [x] Regenerate any custom Atlas-authored rectangle, outline, spline strip using stored generator metadata; keep mesh identity, explicit Apply, warning if manually edited vertices/triangles would be replaced.
- [x] Outline topology quality pass: staggered interior spacing points and minimum-triangle-quality diagonal flips instead of the previous recursive triangle centroid fans. Boundary triangulation validity checks remain; cannot promise perfect topology for all silhouettes.
- [x] Manual editable mesh actions: Connect vertices across one pair of adjacent triangles via convex edge-flip, Split triangular face, Trim triangular face and prune unreferenced vertices; all Undo/Redo tracked. These tools do NOT currently support arbitrary cross-polygon new edges.
- [x] Add two-level Atlas editing: default top-level `Select / Move` selects by filled triangle and translates all vertices of an editable, unlocked source mesh; `Vertices` performs individual point edits. Duplicates can be independently repositioned. Whole-part moves also translate procedural generator origins/controls and are tracked as one undoable transaction; selection of locked/legacy source meshes is view-only.
- [x] Fix stale shared Undo/Redo enabled-state after Atlas participant edits, one history snapshot per completed vertex drag; pointercancel rolls back vertex drag.
- [x] Test synthetic transparent PNG/phone viewport Chromium Atlas harness: live grid settings, commit/undo/redo, regeneration, vertex drag+undo, split+undo, trim+undo, outline interior-density change, strip X/Y subdivisions, saved control-node drag+regeneration; no JS errors; Node syntax.
- [ ] **Device acceptance:** verify iPhone touch hit areas/longer sessions/dense outline performance, editor persistence, Undo/Redo/Save/Discard, switching Atlas–Parts–Rig, and no unintended Fox/New01 changes.
- [ ] **Next:** better topology primitives for arbitrary vertex connections, merging/splitting longer edge paths, deleting a triangle range, and boundary shaping; support a full user-controlled art mesh workflow before integration.
- [ ] **Separate stage:** explicit Atlas custom meshes → Parts/Skin/render adoption with reversible compatibility checks; preserve legacy Fox authoring. Add reliable PNG export/restore + GitHub-relative art paths before cross-device acceptance.

**Storage:** same `sidescroll.animlab.atlas-docs.v1` text map, with new outline `generator.fillSpacing` (reads old `fillDetail` when editing/re-generating). Texture blobs remain IndexedDB-only; global/character JSON still omit binary assets. No migration or silent autosave.


## October 19, 2026 — v1.0.200 unified Character Library and sidebar patch (iPhone acceptance pending)

## v1.1.2 — Atlas Stage B: constructors, management and inspector ergonomics (20 October 2026)

- [x] Remove short nested Source meshes scrollbar for <=14 meshes; retain scrolling via outer inspector and cap long lists when 15+ meshes.
- [x] Separate Navigate (Pan/Fit/zoom), Create mesh (Rectangle, Outline spline, Spline strip), and Edit selected mesh (Vertices/Rename/Duplicate/Delete), avoiding a mixed toolbar.
- [x] Explain Rectangle Across/Down as **columns/rows of grid cells**, not pixel size. Across 2 × Down 2 = 3 × 3 vertices / 8 triangles.
- [x] Make selected and nonselected wireframe strokes finer, darker and semitransparent; add All / Selected / Off mode (browser-local preference, never dirties an authored character).
- [x] Closed outline spline created from perimeter taps, interpolated curve, ear-clipping triangulation and optional interior triangle density; reject obvious self-intersections and oversized shapes.
- [x] Centreline spline-strip with per-vertex generated UV positions, width/tip taper and along/across cell density.
- [x] Rename, duplicate with fresh ID, delete confirmation for Atlas-authored meshes only; legacy Fox source meshes remain read-only; all operations use Atlas Undo/Redo/Save/Discard.
- [x] Chromium headless mobile landscape harness (844×390) covered existing legacy read-only entries, two rectangle cell counts, outline and strip geometry index bounds, management undo/redo, Save, no browser exceptions; Node syntax parsed.
- [ ] iPhone acceptance: outer scroll reveals entire six-region Fox list without an inner scroll; pan/pinch/zoom; tap outline path and finish; draw strip; edit vertices; verify Undo/Redo/Save/Discard and switching Parts/Rig without visual/data drift.
- [ ] Strong next stage: existing spline shape control-node editing + parameter regeneration; safely promote authored atlas sources to Parts/Skin with per-family capabilities and explicit (undoable) bind; do not convert or overwrite legacy Fox meshes implicitly.
- [ ] End-to-end art portability: iPhone PNG byte export/restore and GitHub-relative source selection; only then accept cross-device Custom Character roundtrip.

**Export/storage status:** new constructor metadata and mesh actions use existing `sidescroll.animlab.atlas-docs.v1` localStorage schema `animlab.atlas-document.v1`; exported saved text includes it, but original image bytes still reside only in device IndexedDB. No new input image files, character/bind conversions, or gameplay changes. iPhone Safari validation pending.


## October 20, 2026 — v1.1.1 Atlas preview polish (iPhone review pending)

- [x] Corrected v1.1.1 release packaging: refresh repository-root `README.md` (previously stuck at v1.0.205) and `README.txt` (previously 1.0.184), keep the versioned patch README, and formalise these requirements in the Engine UX Bible; no runtime/code changes for this documentation correction.
- [x] Dark solid transparent-pixel preview is now the default; optional checkerboard via Atlas-specific preference `sidescroll.animlab.atlas-view.v1`, with no alpha/image or character-data mutations.
- [x] Hide the shared assembled-character Display panel only while Atlas is active; restore its pre-existing control state on return to other stages.
- [x] Thin selected mesh edges, colour selected gold instead of increasing stroke weight, do not fill/obscure the image, draw shared triangle edges only once, small handles only while using Vertices tool.
- [ ] On-device iPhone check: solid/checker background while switching Fox/New01; selection visibility/legibility; Display preserved after switching modes; no unsaved character change.
- [ ] GitHub-source atlas path selection remains unimplemented. PNG import from Files is device-local IndexedDB; safe, portable binary art export and baked source promotion remain open.

## October 20, 2026 — v1.1.0 Atlas Stage A TEST PATCH (device acceptance pending)

- [x] Atlas nav before Parts; separate 2D source-image canvas with pan, pinch and wheel zoom; existing Parts inspector and transforms untouched.
- [x] Read-only overlays of six currently procedural Fox deform meshes remapped onto actual bundled 2048×1024 texture coordinates; named selection, temporary hide/solo/lock (no data writes).
- [x] First Atlas rectangle authoring: drag and preview, 1–24 X/Y subdivision grid, name and Apply; manually drag vertices; pixel-space vertices determine UVs; existing Save/Discard and Atlas Undo/Redo. Per-character `sidescroll.animlab.atlas-docs.v1` storage is explicit-Save only.
- [x] Import transparent PNG to preview; store bytes on this device in IndexedDB with ID metadata in Atlas JSON. Reject wrong file type/oversize/invalid alpha; missing saved bytes visibly reported.
- [x] Source-level validation: JS syntax, Chromium inline DOM with bundled Fox texture + supplied v205 snapshot; both Fox and `New01` show 6 legacy regions on Atlas, read-only visit stays clean, rectangle Apply/Undo/Redo/Save operates, original library/setup/sparse clips unchanged.
- [ ] iPhone acceptance: verify Safari orientation, touch accuracy, pan/pinch, Undo, Discard/Save, reload, PNG import and missing-image diagnostics.
- [ ] Implement outline spline and spline strip authoring, vertex/mesh rename/duplicate/delete, safe triangulation/weight migration.
- [ ] Bridge Atlas-created meshes to existing assembled **Parts**, Rig, Skin, Animate and Quick Play without Fox six-piece assumptions.
- [ ] Make image bytes portable through per-character, Anim Lab and global exports/restores, including integrity and rollback; second-device import.
- [ ] Confirm no old Fox atlas/rig/weights/clips, New01, or original art is ever silently migrated; user device verification remains open.

**Scope limitation:** This initial patch intentionally does **not** claim new rectangle meshes already deform in Parts/Skin, or that IndexedDB PNGs are captured by v205 backup formats. Legacy Fox mesh read-only editing is not yet convertible. Continue milestones B–D in `SIDESCROLL_CHARACTER_AUTHORING.md`.


- [x] Replace v199's always-expanded custom library and duplicate built-in buttons with **one** Character Library: persistent loaded-character name/status; New · Load · Save opens one contextual panel at a time.
- [x] **Load lists built-in Hero 1, Hero 2, Fox and local user-created characters together**, and switches using existing unsaved-change guard. Current row marked Loaded. Never allow rename/delete of built-ins.
- [x] **New** creates a local custom character, automatically appears alongside originals in the same Load list. **Save** uses existing session pipeline for any loaded character, retaining rig Rebind+Save confirmation; hide duplicate Edit Session Save button (Undo/Redo/Discard retained).
- [x] For saved custom entries, opt-in manage → Rename / Export / Delete. Import JSON remains duplicate-safe. Saved built-in Fox supports its established Handoff export via contextual Save. No image pixel inclusion in custom export.
- [x] Constrain Anim Lab sidebar horizontal overflow/drift; keep vertical scrolling. No effects on other editors.
- [x] **Do not migrate legacy saved Hero/Fox data.** Built-ins keep legacy storage, newly authored characters keep private `sidescroll.animlab.character-library.v1`. Regular-game custom selection and runtime skin/art parity not yet implemented.
- [x] JS syntax + Chromium real-code UI, Save, guarded-switch and small landscape width tests with simulated storage passed.
- [ ] **On iPhone:** confirm screen stability, side-scroll lock with native sliders, loaded status, all characters in Load, custom persistence, built-in Save, and unsaved guard. Keep v199 rollback until approval.


## October 12, 2026 — v1.0.148 Anim Lab native Scale final-value correction

**Current status:** the v1.0.147 pointer-cancel fix was incomplete. On the reported iPhone path the native range thumb could move without delivering the intermediate `input` callback, so there was still no authored Setup change to commit. v1.0.148 makes the end event itself authoritative.

- [x] On `pointerup`, `change`, `blur` and `pointercancel`, explicitly read the range control's final DOM value into the Setup working copy before committing the transaction.
- [x] Preserve one slider gesture as one bounded Undo transaction when normal `input` events are present.
- [x] Add a regression harness for the exact `change`-without-`input` path; Scale 1.00 -> 1.73 becomes dirty and commit-ready.
- [ ] iPhone regression: change Fox Scale only and confirm Saved -> Unsaved / Save enabled on finger release, then Save and verify the size in Play.
- [ ] Do not start Stage 4 until this on-device check passes.

## October 12, 2026 — v1.0.147 Anim Lab slider + editor safe-area corrective pass

**Current status:** on-device testing showed Safari could finish a native Setup range gesture with `pointercancel`. Stage 2 treated that as a custom-gesture cancellation, restoring the old setup value while the native thumb could remain visually moved. v1.0.147 commits native slider pointer-cancel/end values instead. Anim Lab and Asset Lab edge columns now also reserve the iPhone landscape safe-area insets, including track-width compensation so controls remain usable.

# SideScroll Development Tasks

## October 20, 2026 — v1.1.0 Atlas workspace (APPROVED DESIGN; STAGE A PARTIALLY IMPLEMENTED)

**Scope handoff:** v1.0.205 is the last delivered code patch. The user is deliberately beginning the next code release numbering at **v1.1.0**. The original handover was documentation-only. The current v1.1.0 test patch implements the first bounded Stage A portion described above. The primary specification is `SIDESCROLL_CHARACTER_AUTHORING.md` → **Approved next milestone — v1.1.0 Atlas-first 2D Mesh Authoring**. The UX/architecture invariant is in `SIDESCROLL_ENGINE_UX_BIBLE.md`. **Do not add a second Parts/Character Layout editor or independent UV editing mode.**

### New Atlas stage and minimal UX
- [ ] Extend existing Anim Lab workspace selector to **Atlas / Parts / Rig / Skin / Animate / Play**. Keep New · Load · Save and existing built-in/local character workflow; no duplicate layout editor or second Save implementation.
- [ ] New Character can choose/import a transparent atlas (or use placeholder), including asset load/preview/error handling on iPhone. Do not silently change built-in Fox, Hero saves, atlases or existing custom character settings.
- [ ] Show **all previously created parts/meshes in their actual atlas texture-space positions**, not assembled Parts positions; include saved Fox meshes, named selection, transient Show/Hide/Solo/Lock, pan/zoom, useful mesh/vertex display toggles. Opening/preview/selecting Atlas cannot dirty or write.
- [ ] Geometry editing is **directly over the source image**. Vertex position = sampled texture position. UV coordinates are automatically derived from 2D texture coordinates; **no separate UV editor, independent UV vertex handling or 3D geometry mode**.

### Geometry authoring
- [ ] Rectangle mesh create/draw/resize; X/Y subdivisions, editable vertices and triangles, preview/apply/cancel/undo.
- [ ] Closed outline spline tracing; safe interior triangulation/subdivision controls, invalid/self-crossing geometry detection.
- [ ] Centreline spline strip following leg/tail/neck; variable width/taper and subdivisions along/across curve; mesh follows the drawn artwork.
- [ ] Named part list with Rename / Duplicate / explicit Delete; stable IDs and part ownership independent of number/names of Fox's six pieces.
- [ ] Keep structural source mesh separate from existing **Parts** assembly transforms, which already support move X/Y, rotate, independent scale/pivot, draw order and copy/paste. A Parts drag never alters texture mapping and Atlas edits never cause Parts layout to teleport.

### Rig/Skin/Animate + storage
- [ ] Preserve existing rig family descriptors, part IDs, rest rig, skin bind, weight tuning and clips when Atlas is only inspected. Geometry edits with unchanged vertex topology preserve applicable weights; rebuild/subdivision changes warn and explicitly remap or rebind weights (never silently discard them).
- [ ] Persist the atlas image bytes safely and version the mesh schema; don't rely on temporary blob URLs, image filename or page memory as durable artwork storage. Ensure single-character, whole Anim Lab, and global backup **export and restore** the artwork as well as geometry. Update `SIDESCROLL_EXPORT_COVERAGE.md` when shipping.
- [ ] Link newly authored meshes to **existing** Parts, Rig, Skin, Animate and Quick Play without hardcoding Fox region count. Runtime game selector/packaged defaults and linked-vs-unique reusable clip library remain separate unimplemented milestones.

### Incremental release gates
- [ ] **v1.1.0 candidate A:** Atlas nav + imported atlas + legacy-mesh overlay + safe read-only selection/display + first rectangular mesh editing + explicit Save, if implementable as one stable mobile patch. If split further, report precisely what's working vs deferred, don't claim spline tools/portability finished.
- [ ] **Next increments:** outline/strip mesh tools; robust topology and skin handoff; binarily portable image exports; full rig family/Quick Play adoption.
- [ ] Source/unit test matrix: atlas coordinate → derived UV match, rectangular UV samples, silhouette triangulation, strip taper, undo/discard, reload, stale atlas references, legacy Fox/New01 roundtrip, no silent weight loss, cross-stage switch stability, iPhone screen size and touch performance.
- [ ] **Acceptance on user's iPhone:** import a new atlas; create and name meshes and see texture correctly in Atlas; switch to Parts and assemble without UV movement; Rig/Skin/Animate remain intact; Save/reload with identical data; export/import on test browser incl texture bytes. Do not present headless Chromium-only smoke tests as iPhone acceptance.

### Project safety and inherited incomplete work
- [x] v1.0.205 Project Backup: global JSON export and import preview/merge/restore with explicit safety export; per-Lab data exports. Last code state; independent-device restore still **not** tested by user.
- [ ] Imported image pixels / IndexedDB (if used) are **not protected** by v205 global snapshot; require complete portability as part of atlas milestone. Do not overwrite user localStorage/working save or claim baked GitHub game content promotion.
- [ ] Built-in Hero biped full custom Parts/Skin authoring, reusable linked animation templates/Make Unique, normal-game character selection and GitHub promotion remain work outside the initial Atlas view unless specifically scheduled.

## October 18, 2026 — Approved Character Authoring workflow redesign (P1 TEST PATCH 1.0.192; unaccepted on iPhone)

**Source of truth:** `SIDESCROLL_CHARACTER_AUTHORING.md` → **Approved next design — coherent character-authoring workflow**. **Cross-system rules:** `SIDESCROLL_ENGINE_UX_BIBLE.md` → **Authoring stages and unified Display**. This checklist tracks work/acceptance; do not reimplement it as a Fox-only tool. The user confirms v1.0.191 is installed and working; `SS-BASE-191-REVIEW` matches it and is frozen as the sole parent of test patch 1.0.192. Versions 174–190 are not an implicit approved chain; no new patch is approved merely because it has a higher number.

### Gate 0 — clean source / safety before any feature work
- [x] User confirms installed/working v1.0.191; source-hash comparison complete and `SS-BASE-191-REVIEW` frozen. **Safari local saved rig/layout/animations are not included in ZIP**; do not overwrite or clear them.
- [x] Source checksums, atlas rects and v1.0.191 code/storage-schema documented in `BASELINE_STATUS.md`; browser-local saved Part Layout/export still need user testing. No rejected patch chain used.
- [ ] Compare identity/neutral, Walk, Run and Jump renders to original reference on-device before changing rendering code. Separate visual target from baseline renderer.
- [x] v1.0.192 ZIP includes `README.md`, canonical docs and only files actually changed from frozen 191 source.

### v1.0.192 initial implementation (code and DOM checks passed; **NOT device accepted**)
- [x] Named Fox six-part selector remains active; bottom-right pad moves, rotates, scales on Free/X/Y and adjusts pivot (with stable-image translation compensation). Direct viewport part dragging stays off.
- [x] Numeric X/Y, angle, independent width/height and pivot fields. Older uniform `scale` layouts load with matching X/Y scale; no auto-save on open.
- [x] Persistent six-part order (forward/back/top/bottom) and reordered deform rendering in Anim Lab; **not yet consumed by gameplay**.
- [x] Copy part, Paste all/position/rotation/scale/pivot, and Copy to near/far pair, one Setup undoable action each.
- [x] Hide/Solo/Show All implemented as transient display state only; **never dirty/persist**. Hidden parts remain in selection list.
- [x] Parts renderer displays unskinned neutral vertices, leaving joint and animation data untouched by Parts edits.
- [x] Syntax checked + inlined headless Chromium DOM interaction tests; actual image/PWA and iPhone tests not yet completed.
- [ ] Accept visual consistency between legacy Setup, new neutral Parts and animated/Rig appearance on the device. P2 still required for true art-vs-rig independence on joint changes.
- [ ] Test Safari PWA Save/Discard/reload, numeric keyboard, pad/touch/pan/pinch, wireframe, dynamic draw order, all six cutout art regions, and rollback behaviour.

### P1 — Parts authoring is independently controllable (first implementation)
- [ ] Left-side named part selection for Body+Head, Tail, four independent legs; pad Move/Rotate/Scale, with optional non-destructive viewport selection and no accidental part drag.
- [ ] X/Y movement, linked/unlinked X/Y scale, rotation, numeric entry, pivot editor (no jump), individual reset and layout reset.
- [ ] Editable persistent **draw order** / reorder controls, deterministic render order, near/far ordering check.
- [ ] **Copy/Paste Transform** and position-only, rotation-only, scale-only paste; near/far counterpart operations; one undo per action.
- [ ] **Hide / Solo / Restore All** as view-only controls; hidden parts stay selectable; no runtime/editor-save side effects.
- [ ] During Part editing freeze skeleton/rest joints; allow artwork movement with no joint response. Identity view matches original unmodified neutral display.
- [ ] iPhone regression: Move/rotate/scale each leg and tail, reset, reorder, clipboard, solo/hide, Save/Discard/Undo/Redo/reload and safe-area/pinch tests. Mark acceptance **only after user approval**.

### P2 — independent structural Rig and trustworthy bind preview
- [ ] Rig mode rest joint drags move only joints; **artwork stays pixel-still**, regardless of skin or IK overlay.
- [ ] Rebind/preview uses explicitly recorded art layout + rest rig with inverse rest matrices; at neutral, art does not jump when leaving Rig.
- [ ] Existing keyframes, Paw IK targets, collider and game character choice are unchanged unless separate explicit authoring action; warn about altered posed appearance.
- [ ] Save/Discard/Undo round-trip, mode-switch, near/far legs, hip, shoulder, neck and tail-root tests on iPhone.

### P3a — v1.0.195 UX framework (code completed; Safari acceptance pending)
- [x] Five-stage Workspace navigation (Parts / Rig / Skin / Animate / Play) with existing guarded edit sessions and family support limits.
- [x] One collapsible Display: independent Art opacity/show, Static Reference opacity/show, Motion Reference opacity/show; bones/planes/collider/ground, outlines, difference, bind preview, mesh/wireframe and advanced alignment/reference timing.
- [x] Move original display sliders and toggles rather than duplicating state owners; editor-only display preference storage; motion reference display state auto-save, no character dirty/Undo coupling.
- [x] Mode-specific inspector first, animation Clip/timeline only in Animate, Setup scale/collider in Rig, default-collapsed Display and subpanels, same precision pad.
- [ ] iPhone landscape Safari sign-off for usability, touch, viewport, safe areas, reference loading, mesh controls, dirty prompts, loading/reloading and service-worker caching.
- [ ] P3b polish as indicated by user feedback; reduce any remaining nested-edit density and mode-inappropriate items before launching the new-character wizard.

### P3 — unified authoring navigation and Display
- [ ] Top-level **Character → Parts → Rig → Skin/Bind → Animate → Play** flow with mode-specific inspector. Do not duplicate competing ownership controls.
- [ ] Single collapsible Display area: art visibility/opacity, static red/source reference + opacity, motion reference, bones, part outlines, mesh/weights, ground/ruler, optional bind proof/difference. Default Bind Proof **off**.
- [ ] Retain one linked animation transport + optional unlinked motion-reference transport only where needed; hide timeline for layout/rig unless diagnostic playback is deliberately selected.
- [ ] Follow Asset Lab shared appearance, reusable inspector controls, safe areas, list-left/pad-right, collapse state, non-dirty display toggles.
- [ ] Touch/gesture, Save/Discard, pan/zoom and accidental-move regression on actual iPhone.

### P4 — Skin/Bind and global character authoring
- [ ] Explicit per-region mesh/UV/weight editing with view-only diagnostics; keep source pixels, rest rig, Part Layout and animation independent.
- [ ] Separate Preview Bound from explicit Rebind, back up edited weights and do not regenerate skin data silently.
- [ ] Generalise through rig-family/character descriptors; adopt Hero 1/Hero 2 without Fox-specific shortcuts.
- [ ] Continue the already-documented animation library / Character Library / template-vs-unique flow, then game selector and art replacement round-trip.
- [ ] Device performance, save/export/import/migration and play-runtime acceptance tests.

**Explicitly OUT of scope for the first next release:** texture repainting/repacking, new atlas crops, hidden rig/data migrations, new animations, unnecessary gameplay changes, full library system and a sweeping UI rewrite. Do P1 in bounded testable increments.



## October 12, 2026 — v1.0.146 Anim Lab Stage 2 corrective pass

**Current status:** on-device review exposed two Stage 2 regressions rather than a new feature need: per-character scale was capped too narrowly and saved only as editor metadata, so Play never consumed it; Anim Lab also drifted from the agreed Asset Lab visual grammar. v1.0.146 corrects those foundations before Stage 4.

- [x] Raise Anim Lab character Setup scale range from 0.55–1.55 to 0.55–2.25.
- [x] Keep scale as per-character Setup data under `sidescroll.animlab.setup.v1`, but make explicit Setup Save gameplay-facing: SideScroll now applies the saved multiplier to the established 2.31 base character scale for Hero 1, Hero 2 and Fox.
- [x] Refresh saved character scale on character swap and visibility return; collider world dimensions continue to scale coherently with character size.
- [x] Make Setup range gestures reliably dirty the current edit session and remain one Undo transaction on iOS (`input` previews, `change`/blur commits; pointer-cancel restores).
- [x] Restyle Anim Lab onto Asset Lab's dark editor palette, top header, button states, range styling and dark gradient/grid viewport with cyan ground datum.
- [ ] iPhone regression: change Fox scale only, confirm Save enables, Save, return to Play and confirm the Fox gameplay size changes; reload and repeat with Hero 1/Hero 2 independently.
- [ ] iPhone visual review: compare Anim Lab and Asset Lab side-by-side for header/panel/button/slider/viewport consistency and report any remaining layout differences that are functional rather than stylistic.

## October 12, 2026 — v1.0.145 Anim Lab Stage 3 sparse key-pose timeline

**Current status:** Stage 2 was reported working well enough on-device to continue. Stage 3 now makes sparse key poses the Anim Lab authoring workflow while deliberately compiling back to the existing 16-sample clip format on Save. No FK/IK, curve editor or Fox gameplay-runtime integration is included.

- [x] Import the current 16-sample human and Fox clips losslessly into a sparse-key working representation without writing storage on open.
- [x] Add a stable 16-slot key track with named markers and tap-to-scrub selection.
- [x] Add explicit Add Tween, Duplicate, Move Left/Right, Delete, Copy/Paste and Rename operations.
- [x] Make a Control Board edit on a tweened frame promote that frame to a key automatically, with one gesture remaining one Undo step.
- [x] Add per-rig mirror rules plus whole-clip mirror and cyclic phase offset / half-cycle operations.
- [x] Add non-destructive 8-key conversion preview with measured channel error, plus explicit Adopt / Exit Preview.
- [x] Compile sparse clips back to exactly 16 sampled poses on Save; keep Human on its established runtime bank and Fox on its isolated Anim Lab bank.
- [x] Preserve a sampled pre-Stage-3 backup before the first sparse Save for each family/clip.
- [x] Keep conversion preview, scrubbing, playback and marker inspection view-only; no persistence until Save.
- [ ] iPhone regression: scrub/tap all 16 slots, add a tween key, rename it, move it and Undo/Redo each operation.
- [ ] iPhone regression: edit a non-key human pose through the Control Board and confirm it becomes a key without a second Undo step.
- [ ] iPhone regression: Mirror Key / Mirror Clip on human and Fox; verify human hand/foot pairs and Fox near/far leg pairs swap predictably.
- [ ] iPhone regression: Phase −1 / +1 / Half Cycle should rotate the key layout without changing key count or creating seam pops.
- [ ] iPhone regression: Preview 8 Keys, scrub/play it, Exit Preview and confirm nothing became dirty; repeat and Adopt, then Discard and confirm the original key track returns.
- [ ] iPhone regression: Save an 8-key human walk, reload Anim Lab and confirm Contact/Down/Passing/Up-style markers and motion survive; repeat with Fox and confirm four-leg phasing remains distinct.
- [ ] iPhone regression: after Save, return to Play and confirm human runtime motion still uses the compiled 16-sample contract and Fox gameplay remains on its existing approved v1.0.141 clips.

## October 12, 2026 — v1.0.144 Anim Lab Stage 2 controls + setup

**Current status:** Stage 1's multi-rig shell is retained and Stage 2 adds the phone-first authoring surface: an anatomical Control Board, relative precision pad, control Details, common scale reference/ruler and protected character Setup. This remains sampled-pose editing; sparse key authoring belongs to Stage 3.

- [x] Add rig-family anatomical Control Boards with only channels the current rigs actually expose.
- [x] Add large selected-control Details plus Move/Rotate precision modes, Fine sensitivity and X/Y axis lock.
- [x] Group a whole precision drag as one Undo action; pointer cancel restores the transaction.
- [x] Add explicit near/far paired-control navigation where the rig has a counterpart.
- [x] Add Ground/Ruler and translucent Hero 1 reference overlays without dirtying authored data.
- [x] Add per-character editor scale plus collider sliders in Setup; human collider Save remains explicitly family-shared while fox collider storage stays separate.
- [x] Keep Fox sampled clips in their own editor storage until formal runtime integration; do not redirect gameplay to unapproved editor data yet.
- [ ] iPhone regression: select and adjust one human foot/hand and fox body/head/leg/tail control without touching the character artwork.
- [ ] iPhone regression: verify one continuous precision drag produces one Undo step, Fine is noticeably finer, and X/Y locks constrain movement.
- [ ] iPhone regression: compare Fox/Hero 2 against Hero 1 reference, change scale, Save, reload Anim Lab and confirm scale returns; Discard must restore the prior setup.
- [ ] iPhone regression: edit collider values with Ground/Ruler visible, Save/Discard, and verify the collider remains grounded/coherent.

## October 12, 2026 — v1.0.143 Anim Lab Stage 1 multi-rig shell

**Current status:** the old human-only Walk Lab route is now the first safe **Anim Lab** shell. Hero 1, Hero 2 and Fox preview through their own rig families; editor character selection is session-only and does not write the gameplay character preference. Existing sampled human clips remain in their current storage; fox editor clips use a separate Anim Lab key.

- [x] Relabel the existing `walk-lab.html` route as Anim Lab without breaking bookmarks/offline shell routing.
- [x] Load both human and fox rig families explicitly and fail visibly if either required family is missing.
- [x] Add explicit Character -> Clip -> Animate/Setup hierarchy for Hero 1, Hero 2 and Fox.
- [x] Keep Hero 1/Hero 2 on the shared human clip bank and keep fox editor clips isolated from the human persistence keys.
- [x] Add bounded working-copy semantics: checkpoint, Undo, Redo, Save, Discard and Save/Discard/Cancel guard when switching dirty contexts.
- [x] Ensure drawing, scrubbing, character inspection, view toggles and playback do not persist data.
- [x] Preserve pan/pinch/fit and use stable DOM/touch surfaces.
- [ ] iPhone regression: switch Hero 1 -> Hero 2 -> Fox in Anim Lab and confirm the correct art/rig/rest pose every time without changing the Play character selection.
- [ ] iPhone regression: scrub/play Walk, Run and Jump for all three characters; confirm viewing alone leaves Save/Discard disabled.
- [ ] iPhone regression: switch Character / Clip / Mode repeatedly and confirm no view-only action marks the context dirty; Stage 2 authoring gestures then exercise the Save / Discard / Cancel path.

## October 11, 2026 — v1.0.141 Fox first playable quadruped pass

**Current status:** the shortlisted B2 / Ember Reed fox is now available as a first-pass playable character using a dedicated quadruped rig family. The purpose of this drop is to get the approved source art moving at real gameplay scale before spending time on a final puppet-art refinement pass. Existing Hero 1 / Hero 2 rigs and Walk Lab data are not converted or overwritten.

- [x] Preserve the approved side-on alpha fox source as a local project asset and keep an authored rig guide/map beside the production atlas.
- [x] Build a dedicated 13-plane quadruped cutout: torso, head/neck, three tail segments and upper/lower segments for all four legs.
- [x] Partition the source artwork into independent atlas pieces with joint overlap so the neutral pose reconstructs the approved fox rather than substituting newly drawn parts.
- [x] Add a separate `GameHubFoxRig` family with its own atlas mapping, geometry, locomotion clips, stride lengths and collider.
- [x] Add first-pass **Idle / Walk / Run / Jump** motion with quadruped leg phasing plus restrained body/head/tail secondary motion.
- [x] Add Fox to the normal Play `Change character` cycle and persist the selected fox through the existing character-variant setting.
- [x] Keep the fox intentionally much smaller than the current humanoids; the shared world character scale renders the fox at roughly the requested half-height target without shrinking world movement speed.
- [x] Prevent the humanoid Walk Lab from trying to edit the quadruped by filtering rig families that are not supported by that specialist editor.
- [x] Keep humanoid-only carry/push pose deformation off the fox. Generic interaction can still function, but fox-specific prop interaction is not treated as final in this pass.
- [x] Use the fox Run cycle as a temporary climb/scramble visual while retaining the existing climb mechanics; author a true fox climb only if device testing shows it is necessary.
- [ ] iPhone regression: cycle Hero 1 -> Hero 2 -> Fox -> Hero 1 from the Play menu; confirm textures/colliders switch without a reload or black frame.
- [ ] iPhone regression: reload while Fox is selected and confirm the fox returns selected with the correct atlas and smaller collider.
- [ ] iPhone visual review: compare fox height against both humanoids and decide whether the current ~half-height target needs a small scale adjustment.
- [ ] iPhone animation review: walk slowly, run in both directions and jump; inspect shoulder, hip, knee/hock and tail-root seams at normal gameplay scale.
- [ ] iPhone terrain review: walk/run over slopes, section height changes and climbable surfaces; verify the smaller collider does not float, sink, snag or step through obstacles.
- [ ] Decide after gameplay review whether the exact cut atlas is good enough or should be passed back through ImageGen as a clean purpose-built puppet atlas while preserving the proven joints and silhouette.

## October 11, 2026 — v1.0.140 Surface blend preview + Group Template Free-height fix

**Current status:** the World Lab Terrain Surface timeline now previews the real A -> B material mix inside each authored blend range, and World Group reusable composition now preserves Free members against the terrain beneath each member rather than the terrain beneath the group anchor. This fixes roof/building separation when a wide Group Template is placed or moved across terrain whose height varies across the group's footprint.

- [x] Render the World Lab **Surface Blend** band from the real `from` texture with the real `to` texture crossfading from 0 -> 100% across the authored blend start/end range. Keep the selected outline, labels and start/end drag handles above the preview.
- [x] Keep Surface Regions as one source of truth: this is only a World Lab visualisation of the existing runtime blend, not new authored blend data.
- [x] Capture `freeLocalFloorOffset` for Free World Group members relative to the terrain beneath that member's own X/Z. Retain legacy `freeGroupFloorOffset` only as a backward-compatibility fallback.
- [x] Place Group Template Free members using `local terrain height + freeLocalFloorOffset`; Ground members retain their existing local terrain/floor-offset behaviour.
- [x] Make whole-World-Group moves use the same local terrain-relative Free-member height rule, so moving a composed building does not reintroduce the roof drift after a correct Template placement.
- [x] Add a conservative legacy migration: only when a linked source Group clearly predates an old Template, recover missing Free-member local offsets from that source and rebuild the other linked instances with the corrected placement rule. Templates without an identifiable pre-template linked source keep the old fallback until explicitly re-saved under the new build.
- [ ] iPhone regression: confirm the World Lab Woodland Dirt -> Village Cobble range visibly crossfades across the complete blend block while handles remain easy to grab.
- [ ] iPhone regression: reload the current VillageGroup02 scene and verify the older correctly aligned linked source remains unchanged while the second linked instance repairs its roof alignment.
- [ ] iPhone regression: place another VillageGroup02 Template Instance on terrain with a different local slope and verify each roof preserves the same building-relative visual height as the source composition.
- [ ] iPhone regression: move a placed World Group with Free roof members using the yellow group handle and verify roofs remain aligned rather than following only the group-anchor ground height.
- [ ] Regression: create a new Group Template containing both Ground and Free members, Save/propagate it, reload, and confirm the new `freeLocalFloorOffset` path remains deterministic.

## October 11, 2026 — v1.0.139 Terrain Surface art pack + World Lab previews

**Surface-library status:** Stage 3's placeholder surface visuals are now backed by a first reviewable Art-Bible-aligned terrain pack. Existing authored Surface Region IDs/ranges remain valid; `rocky-ground`, `pale-gravel` and `snow-ground` are upgraded in-place from prototype procedural colours to image textures, while the original Woodland Dirt remains the default to avoid silently restyling existing terrain.

- [x] Add generated tileable surface assets for **Woodland Soil**, **Village Cobble**, **Rocky Gravel**, **Mountain Trail**, **Wetland Mud**, **Pale Gravel** and **Snow Ground**.
- [x] Keep existing **Woodland Dirt** as the unchanged default/current dirt surface; add generated Woodland Soil as an explicit alternative rather than changing existing authored terrain on load.
- [x] Replace Stage 3 prototype visuals for `rocky-ground`, `pale-gravel` and `snow-ground` with the approved review textures while retaining their stable IDs so existing Surface Blends immediately pick up the real art.
- [x] Add all new surfaces to the World Lab Terrain Surface selectors and persist them through the existing stable-ID Surface Region data model.
- [x] Add a tappable **Surface Library** in World Lab with tiled thumbnails and short descriptions; tapping a card chooses the target for the next Surface Blend.
- [x] Add larger Default/Target material previews and preview From/To surfaces when editing an existing Surface Blend.
- [x] Show real texture previews in solid spans of the World Lab Terrain Surface timeline; keep transition blocks/handles readable over the visual material data.
- [x] Runtime continues to load one surface outside a blend and only the two participating textures inside a blend. New texture files are cached on demand by the existing service-worker asset path.
- [ ] iPhone regression: open World Lab and verify all eight choices are visible: current Woodland Dirt plus the seven generated surfaces, with no clipped cards or horizontal overflow.
- [ ] iPhone regression: tap each Surface Library card and verify the target selector, larger preview and Add Blend summary all follow the chosen surface.
- [ ] iPhone regression: confirm solid Surface timeline spans show the actual texture and remain readable at normal phone zoom.
- [ ] iPhone regression: use every new surface at least once in-game and confirm image loading, repeat scale, A -> B blending and offline reload behaviour are stable.
- [ ] Art review: after in-game use, identify any texture whose brightness, contrast, scale, tiling or biome character needs another ImageGen pass before treating the pack as final.

## October 10, 2026 — v1.0.138 Terrain Edit Stage 3 continuous Surface Regions

**Stage 3 status:** ground appearance is now authored independently of fixed 10 m Sections. World Lab owns a continuous Terrain Surface track using the same broad A -> B transition grammar as Biomes, while Terrain Edit exposes the same transition records as in-world start/end handles for visual fine-tuning. Runtime rendering uses one surface outside a blend and only the two participating surfaces inside it.

- [x] Add persistent **Terrain Surface** definitions and a default surface independently of numbered Terrain Sections.
- [x] Add four starter surfaces for immediate system testing: Woodland Dirt (the existing terrain texture), Rocky Ground, Pale Gravel and Snow Ground. The transition data stores surface IDs so these prototype visuals can later be replaced/expanded without changing region placement.
- [x] Add a **Terrain Surface** track to World Lab with solid surface spans plus explicit A -> B blend blocks.
- [x] Use continuous world-space blend start/end keys rather than snapping appearance changes to Section boundaries. Surface transitions are sorted and chained deterministically so each transition starts from the surface established by the previous transition.
- [x] Allow World Lab surface blend keys to be dragged/resized and edited numerically; include Surface Regions in World Lab Undo and complete project export/import.
- [x] Render the selected terrain surface across Path/Near/Far terrain geometry and smoothly mix A/B inside the authored blend range. Keep the runtime active set bounded to one surface normally and two inside a blend.
- [x] Expose the same Surface Blend records in Terrain Edit: show the surface under the character, select a blend, edit its numeric start/end positions, and drag cyan START / coral END handles directly in the world.
- [x] Include Terrain Surface state in Terrain Edit Undo/Redo/Save/Discard snapshots. One in-world handle drag is one shared-history transaction.
- [x] Avoid per-frame rebuilding of the Surface Blend selector; continuous player/blend readout updates without reconstructing stable editor DOM.
- [ ] iPhone regression: in World Lab, set a default surface, add two non-overlapping Surface Blends out of chronological creation order, and confirm they sort into world order and form the expected chained surfaces.
- [ ] iPhone regression: drag World Lab START/END keys and verify the visual blocks resize continuously without snapping to 10 m Section boundaries; Undo should restore the previous range.
- [ ] iPhone regression: enter Terrain Edit near a blend and verify the same range appears with cyan START / coral END handles, can be dragged in-world, and the World Lab range reflects the edited values after reopening it.
- [ ] iPhone regression: walk through Woodland Dirt -> Rocky Ground (or another pair) and confirm the terrain visually blends smoothly across the exact authored range on Path, Near and Far strips.
- [ ] iPhone regression: verify Terrain Undo/Redo, Save/Discard and reload persistence for Surface Blend handle edits, including moving a handle through Section boundaries.
- [ ] iPhone regression: verify Stage 1/2 terrain height, depth falloff, flattening, river/type, collision and Follow Player behaviour remain unchanged.

## October 10, 2026 — v1.0.137 Terrain Edit Stage 2 depth-shape controls

**Stage 2 status:** the hidden far-depth simplification is now an explicit authored master control and the selected Section can progressively flatten all depth strips toward its Path height. Existing v1.0.136 terrain data migrates visually unchanged because missing `depthDetailFalloff` defaults to `100%`, which reproduces the previous Far A/Far B behaviour exactly.

- [x] Add one master **Depth Detail Falloff** control. `100%` reproduces the old Far A/Far B averaging/follow values; `0%` makes Linked depth strips retain the authored Path profile before their normal offsets.
- [x] Persist/migrate the falloff setting and include it in Terrain Save/Discard/Undo/Redo snapshots.
- [x] Add selected-Section **Flatten Depth Toward Path** actions at 25 / 50 / 75 / 100%. Each action moves Near/Far A/Far B from their current resolved heights toward Path while preserving whether each strip is Linked or Explicit.
- [x] Keep flattening compatible with the existing sparse/inherited depth-layer data model: a new key is authored at the selected Section using the strip's current mode.
- [x] Preserve terrain-bound object floor offsets while falloff or flattening changes the supporting terrain.
- [x] Make one falloff drag or one flatten press a single shared-history transaction.
- [ ] iPhone regression: compare Depth Detail Falloff at 100% against v1.0.136 and confirm the terrain silhouette is unchanged.
- [ ] iPhone regression: reduce falloff toward 0% and confirm Far A/Far B increasingly retain the Path profile rather than losing smaller rises/falls.
- [ ] iPhone regression: exercise 25/50/75/100 flattening on Linked and Explicit depth strips and verify the selected Section moves toward Path without changing strip mode.
- [ ] iPhone regression: verify Undo/Redo, Save/Discard and reload persistence for falloff and flattening, including terrain-bound dressing/support offsets.

## October 9, 2026 — v1.0.136 Terrain Edit foundation and staged terrain-authoring plan

**Feature direction:** Terrain is a first-class authoring context rather than a standalone settings/debug popup. The existing fixed 10 m Sections remain the base structural ground units, but Terrain Edit becomes the in-world authoring workspace for them. The normal fast workflow is **Follow Player**: the character remains centred as usual, walking stays available, and the active Section automatically follows the Section the character occupies. Manual previous/next selection remains available and temporarily locks the active Section until Follow Player is re-enabled.

### Durable ownership split

- **Base Terrain Sections** own physical ground shape and section-local structural properties: path height, depth-strip height/mode, collision, visibility and existing legacy section type/settings while those still exist.
- **Depth detail falloff** is the current smoothing behaviour across the near/mid/far depth strips. It reduces smaller vertical changes at greater depth; it is **not** smoothing between neighbouring Sections. A later pass will expose this so it can be minimised rather than remaining a hidden rendering decision.
- **Terrain Surface Regions** will own ground texture/material choice and A -> B blending in continuous world space. They are not bound to 10 m Section edges. Their authoring grammar should parallel Biome Regions/Transitions: broad start/end/blend placement in World Lab, with the same underlying transition handles visible and adjustable in Terrain Edit.
- **Terrain Features** are local terrain modifications such as rivers. They may be standalone world features or owner-relative features attached to another authored object such as a Puzzle. Do not make fixed world Sections travel with a Puzzle. The current Broken Bridge river already follows this direction through its puzzle-owned `worldModifier`; the later feature stage should generalise that proven mechanism.
- **World Lab remains the macro view.** It owns broad region/transition planning. Terrain Edit is the in-world fine-authoring view. Where both expose the same Surface Region/transition, they edit the same record rather than maintaining duplicate systems.
- Terrain Sections are world structure, not Templates/Template Instances. Reusable terrain shapes can become presets later if useful, without making a numbered world Section itself a reusable instance.

### Stage 1 — Terrain Edit foundation — IMPLEMENTED IN v1.0.136

- [x] Move Terrain/Sections into the shared editor drawer as a dedicated **Terrain** scope/context; the Tools -> Terrain shortcut enters that context rather than opening an unrelated floating panel.
- [x] Preserve the proven terrain generation/height/layer algorithms in this structural pass; do not combine the editor migration with a terrain rewrite.
- [x] Make **Follow Player** the default Section navigation mode. Walking through the world automatically changes the active Section to the one occupied by the character.
- [x] Keep manual previous/next Section navigation. Using it disables Follow Player until the author explicitly returns to Player/Follow mode.
- [x] Keep horizontal character movement available during Terrain Edit while normal world objects remain non-pickable/protected from unrelated editing.
- [x] Put authored Terrain changes inside a bounded Terrain edit session with shared **Undo / Redo / Save / Discard** semantics. Save checkpoints the current terrain and stays in Terrain Edit; Done Editing exits once the session is clean.
- [x] Treat one slider/height/type/collision/visibility interaction as one shared-history transaction.
- [x] Prevent specialist-tool switches or procedural scene rebuilds from silently abandoning dirty Terrain edits.
- [ ] iPhone regression: Tools -> Terrain enters the new Terrain drawer, keeps the character controls available and does not expose the old standalone Sections popup.
- [ ] iPhone regression: with Follow Player ON, walk across several 10 m boundaries and confirm the highlighted/active Section follows the character without manual selection.
- [ ] iPhone regression: use previous/next, confirm Follow Player turns OFF and the chosen Section remains active while walking; press Player/Follow and confirm automatic selection resumes.
- [ ] iPhone regression: edit path height and each depth strip, verify Undo/Redo is one step per interaction, Discard restores the entry/save checkpoint, and Save establishes a new checkpoint without leaving Terrain Edit.
- [ ] iPhone regression: verify Terrain Edit cannot accidentally select/move environment objects, Puzzles or Groups, and Done/Camera/tool switching refuses to abandon unsaved Terrain changes.
- [ ] iPhone regression: verify existing River/Test Hill/visibility/collision controls still produce the same underlying terrain behaviour as v1.0.135.

### Stage 2 — depth-shape controls — IMPLEMENTED IN v1.0.137

- [x] Expose the existing **depth detail falloff/smoothing strength** so the far strips can retain more of the authored path profile when desired. `0` means no legacy detail reduction; `100%` preserves the pre-v1.0.137 behaviour exactly.
- [x] Start with one clear master strength; only split Near / Mid / Far controls if real use shows one slider is too blunt.
- [x] Add **Flatten Depth Toward Path** as a reversible selected-Section operation at 25 / 50 / 75 / 100%.
- [x] Make falloff and flatten operations shared-history transactions and preserve terrain-bound object support offsets correctly.

### Stage 3 — Terrain Surface Regions and texture blending — IMPLEMENTED IN v1.0.138

- [x] Introduce Terrain Surface definitions/choices independently of numbered Sections.
- [x] Reuse the Biome Region/Transition spatial grammar: a default state followed by ordered continuous A -> B blend ranges, while keeping Surface data separate from Biome ownership.
- [x] Add a **Terrain Surface** track to World Lab for macro placement and resizing of texture regions/blend ranges.
- [x] Support continuous A -> B texture blending between explicit world-space start/end handles; do not snap transition boundaries to Section edges.
- [x] Show the same Surface Region/blend handles in Terrain Edit so the author can stand in the world and fine-tune start/end positions while viewing the result.
- [x] Keep the runtime bounded to the minimum useful active surface set: one surface outside transitions and the two participating surfaces inside a blend.

### Stage 4 — reusable Terrain Features

- [ ] Formalise the existing puzzle `worldModifier` mechanism into a reusable **Terrain Feature** abstraction without breaking current Broken Bridge river behaviour.
- [ ] Support standalone world Terrain Features and owner-relative Terrain Features that move with their Puzzle/owner.
- [ ] Migrate/generalise the legacy manual River Section path only where this improves ownership; do not regress existing authored river data.
- [ ] Keep base Section identity fixed in world space. A moved Puzzle/Feature should affect the Sections now beneath it rather than dragging numbered Sections through the world.
- [ ] Give Terrain Edit appropriate Feature visibility/selection without turning every Feature into a Section property.

### Stage 5 — terrain authoring consolidation / QA

- [ ] Review legacy Test Hill/River section modes after Terrain Features exist and retire or migrate only the parts genuinely superseded.
- [ ] Validate Save/Discard/Undo across height, depth, Surface Regions and Terrain Features, including reload persistence and schema migration.
- [ ] Check touch ergonomics/performance on iPhone with guides, Surface blend handles and terrain geometry updates active.
- [ ] Keep World Lab macro editing and Terrain Edit fine editing as two views over shared data, with no duplicate source of truth.

## October 9, 2026 — v1.0.135 explicit Standalone / Template Instance architecture

**Current status:** template ownership is being made explicit and scene-first. All previously placed Puzzles and World Groups migrate to **Standalone** because there are currently no intentionally duplicated live instances. Reuse begins only when the author explicitly creates or places a Template. Puzzle and Group workflows now share the same relationship grammar rather than exposing the older inferred Linked/Unique model.

- [x] Make new scene Puzzles **Standalone** by default; creating a scene Puzzle no longer implicitly creates/uses a Template.
- [x] Make new World Groups **Standalone** by default.
- [x] One-time migrate all currently placed Puzzles and Groups to Standalone; do not infer reuse from old `instance/copy` metadata.
- [x] Add explicit `Create Template` for Standalone Puzzles and Groups, with a clear choice to link the current object to the new Template or keep it Standalone.
- [x] Make Puzzle `Create Template` deterministic: capture the saved authored **Start State**, never incidental runtime/solved gameplay; use Set Start State first when a different setup should become the reusable source.
- [x] Add explicit `Make Standalone` for Template Instances; preserve the current authored setup/composition while severing the source link.
- [x] Label management rows and selected-object status as `STANDALONE` or `TEMPLATE INSTANCE · <source>`.
- [x] Keep world placement instance-owned: Template updates change reusable internal Puzzle/Group content without moving every placed instance to one source position.
- [x] Keep `Set Start State` as one consistent action name. Standalone affects only that puzzle; a Template Instance prompts before updating the Template and linked instances.
- [x] Prevent silent local internal overrides on Template Instances: Save warns before propagating; cancelling leaves the edit session open so the author can choose Make Standalone.
- [x] Add explicit **Puzzle Templates** placement through the shared right-side picker; placement always creates a linked Template Instance.
- [x] Add explicit **Group Templates** placement through the same shared right-side picker grammar.
- [x] Bring World Group Template Instances up to Puzzle parity: editing and saving a linked Group updates its source Template and linked Group instances after confirmation.
- [x] Update `SIDESCROLL_ENGINE_UX_BIBLE.md` with the authoritative Standalone / Template / Template Instance rules and the shared Puzzle/Group relationship grammar.
- [ ] iPhone regression: existing Fallen Tree, Stone Wall and Broken Bridge appear as Standalone after first v1.0.135 load and keep their current authored Start/Zones/Logic data.
- [ ] iPhone regression: create a Puzzle Template from a Standalone puzzle with a recognisable saved Start State, choose **keep Standalone**, then place the Template and verify the new placement is clearly a Template Instance and uses that saved Start State rather than current runtime progress.
- [ ] iPhone regression: repeat Create Template while choosing **link current**, edit/save the Template Instance, confirm propagation warning, and verify linked instances update without changing their world marker positions.
- [ ] iPhone regression: Make Standalone on a Puzzle Template Instance and confirm later Template changes no longer affect it.
- [ ] iPhone regression: repeat the same Create / Place / Save-propagate / Make Standalone workflow for World Groups.
- [ ] iPhone regression: `Set Start State` on Standalone stays local; on a Puzzle Template Instance it warns and updates linked instances.

**Superseded terminology:** older task entries that refer to `Linked Template`, `Unique Copy`, `Make Unique`, or `Set Start State + Apply Template` describe historical implementations. The Engine/UX Bible and this v1.0.135 section now define the current relationship model.

## October 9, 2026 — Engine / UX Bible established

**Current status:** SideScroll now has an evergreen `SIDESCROLL_ENGINE_UX_BIBLE.md` to separate durable engineering/editor rules from the historical/active task backlog. The Bible consolidates the Management -> Edit model, authoritative collection UX, shared Add-picker grammar, state/ownership boundaries, Undo/Save/Reset/Test/template semantics, migration rules, touch/performance discipline, reusable Logic direction and release validation.

- [x] Create `SIDESCROLL_ENGINE_UX_BIBLE.md` as the authoritative living reference for engine/editor architecture and UX rules.
- [x] Add a documentation map clarifying the roles of Design Lab, Art Bible/pipeline, Concept Lab, Asset Lab, World Lab, Engine/UX Bible, task list and release README.
- [x] Add a required new-feature checklist covering ownership, reusable systems, editor workflow, transactions, Reset/Test, Templates, migration, touch UX, performance and validation.
- [x] Record the shared collection UX rule: authoritative applied list + one Add button + shared right-side picker.
- [x] Record current reusable Logic direction: Event -> Conditions -> Actions, Asset State transitions and reusable Animation Path separation.
- [x] Record migration rule that missing legacy fields are not equivalent to explicit modern empty fields, and audit all snapshot/template pathways when schemas evolve.
- [x] Record release discipline: inspect current code first, bounded patches, static validation, documentation updates and no claims of on-device testing without user testing.
- [ ] Keep the Bible current whenever a durable architecture/UX rule changes; do not leave new permanent rules only in historical task entries.
- [ ] When permanent regression coverage outgrows release/task checklists, create `SIDESCROLL_TEST_MATRIX.md` for evergreen QA expectations.

## October 9, 2026 — v1.0.134e shared Add picker workflow

**Current status:** follow-up phone review showed the first v1.0.134d `+ Add Zone` picker was functionally correct but nested awkwardly inside the left Puzzle drawer, while Logic still used the older permanent type-select + Add button pattern. Zones, Logic and asset placement now use one consistent authoring grammar: the main drawer contains only the authoritative applied list plus one Add button; Add opens the existing separate right-hand editor palette; choosing an item creates it, closes the palette and selects the new record.

- [x] Remove the nested Add Zone choice block from the Puzzle drawer.
- [x] `+ Add Zone` opens the shared right-side editor palette, using the same surface and close behaviour as Add Asset.
- [x] Remove the permanent Logic type selector; `+ Add Logic` now uses the same right-side picker workflow.
- [x] Zone and Logic pickers list only types that can actually be added; existing/applied records remain solely in the authoritative main lists.
- [x] Choosing a Zone or Logic type closes the picker automatically and selects the newly created record.
- [x] Re-tapping the active Add button or pressing the palette close button dismisses the picker without mutation; switching away from Zones/Logic also closes its picker.
- [x] Keep Add Asset highlighting separate from Zone/Logic picker state even though all three reuse the same palette shell.
- [ ] iPhone regression: Add Zone opens on the right, closes after choice, and creates exactly one selected record.
- [ ] iPhone regression: Add Logic mirrors the same workflow and shows only compatible unapplied systems.
- [ ] UX rule going forward: collection authoring uses **authoritative applied list + one Add button + shared right-side picker** unless a tool has a concrete reason to diverge.

## October 9, 2026 — v1.0.134d authoritative Puzzle Zones list / Add Zone picker

**Current status:** phone testing showed the Zones screen still mixed available zone types with applied zones, and some puzzles could display a disabled Respawn Trigger that had never genuinely been authored. The cause was legacy pre-Zones respawn scaffolding: v1.0.131 lazily generated a complete disabled respawn configuration for every puzzle, and earlier migration could mistake a stale calculated default for authored data.

- [x] Make the Zones list authoritative: only zone records genuinely attached to the puzzle appear in the list.
- [x] Remove the permanently visible zone-type select beside `+ Add Zone`.
- [x] Make `+ Add Zone` the sole zone-creation entry point. The initial nested choice menu from v1.0.134d is superseded by the shared right-side picker in v1.0.134e.
- [x] Migrate legacy respawn data only when the old respawn was actually enabled. A disabled old default is not evidence of an authored zone.
- [x] Filter already-migrated disabled synthetic respawn records that use the old sequential `zone-respawn-N` migration IDs. Modern explicitly-added respawn zones use unique IDs and remain real even if later disabled.
- [x] Number zone labels per type (`Procedural Exclusion 1`, `Respawn Trigger 1`) rather than by their mixed-list position.
- [ ] iPhone regression: a puzzle that never used respawn shows no Respawn Trigger at all after reload.
- [ ] iPhone regression: Broken Bridge keeps its genuinely authored/enabled Respawn Trigger through migration/reset/reload.
- [ ] iPhone regression: add a new Respawn Trigger, switch it OFF, save/reload and confirm it remains in the list as an explicitly-authored disabled zone.
- [ ] iPhone usability: verify the v1.0.134e shared right-side `+ Add Zone` picker opens/closes cleanly and each type creates exactly one selectable zone with no placeholder/type-selector row.

## October 8, 2026 — v1.0.134c cumulative workflow / migration audit

**Current status:** cumulative roll-up of v1.0.134a + v1.0.134b plus a follow-up audit of the recently added Puzzle workflow actions. The audit distinguishes two different legacy-snapshot semantics: ordinary Reset preserves newer migrated authoring fields that an old Start snapshot could not express, while an explicit Revert to Template upgrades and applies the template itself authoritatively.

- [x] Package v1.0.134a + v1.0.134b as one patch over v1.0.134.
- [x] Trace Management Reset, Setup Reset, Set Start / Apply Template, Test, Test Reset, Back to Setup, Save, Discard, Revert to Template, Zone add/remove, Logic add/remove and Cart Path authoring through snapshot/migration/persistence paths.
- [x] Make `Reset to Start State` a real one-step Undo transaction inside Puzzle Edit.
- [x] Give `Revert to Template` an explicit current-schema materialisation path so a legacy template cannot accidentally preserve scene-only migrated Zones/Logic/Cart Path data.
- [x] Clear stale in-memory Cart Path drafts when linked templates replace instance data and when puzzle instances/templates are removed.
- [x] Make reward reset provenance-safe: do not delete an unrelated same-type legacy inventory item when puzzle ownership cannot be established.
- [x] Keep Test Reset inventory restoration provenance-safe; ambiguous legacy same-item inventory is preserved rather than guessed away.
- [x] Confirm Save/Discard, Test/Back, Zone add/remove and Logic add/remove already operate on current-schema snapshots/drafts and do not show the same missing-field migration failure.
- [ ] iPhone regression: Reset to Start -> Undo restores the exact pre-reset authored setup.
- [ ] iPhone regression: Management Reset and Test Reset do not remove unrelated inventory items of the same collectible type.
- [ ] iPhone regression: Revert to Template on a legacy/migrated linked puzzle removes scene-only overrides and uses the actual shared template.
- [ ] iPhone regression: Set Start State + Apply Template followed by reload/revisit uses the newly applied Cart Path on every linked instance.

## October 8, 2026 — v1.0.134b Reset / legacy Start-State safety

**Current status:** phone testing showed `Reset to Start State` could remove a migrated Procedural Exclusion and immediately allow procedural grass to render again. The cause was a schema gap: historical Start snapshots pre-dated `zones[]`, while the migrated zone lived only in the newer working/runtime draft. Reset interpreted the missing field as no zones. v1.0.134b treats absence of newer fields as legacy/unknown rather than explicit deletion.

- [x] Preserve the last saved/checkpointed Puzzle Zones when Reset reads a legacy Start snapshot with no `zones` field.
- [x] Keep explicit modern `zones: []` authoritative so intentionally deleting all zones remains valid.
- [x] Apply the same compatibility rule to Applied Logic when a legacy Start snapshot has no `logic[]` field.
- [x] Tighten legacy Cart Path Reset fallback to the edit checkpoint / saved runtime path rather than an arbitrary current in-memory path.
- [x] Keep modern Start snapshots fully authoritative once `Set Start State` has saved the newer schema.
- [ ] iPhone regression: Reset a legacy/migrated puzzle and confirm Procedural Exclusion remains present and dressing remains suppressed.
- [ ] iPhone regression: Reset legacy Logic/Cart Path puzzles and confirm systems remain intact; then explicitly Set Start and confirm subsequent Reset restores that exact modern snapshot.

Persistent working backlog for the SideScroll / Aureli project. Keep this file in future builds and update it as tasks are completed, split, reprioritised or discovered.

## October 8, 2026 — v1.0.134a Puzzle workflow polish

**Current status:** focused on-device workflow testing of v1.0.134 exposed three small authoring issues. v1.0.134a adds a quick Reset action to Puzzle Management, makes the Set Start State semantics explicit in Setup, and restores visible Reset / Back to Setup controls during Puzzle Test.

- [x] Add `Reset Puzzle` to the selected-puzzle Management actions so a scene puzzle can be returned to its saved Start State without entering Edit Puzzle.
- [x] Rename Setup wording so `Reset to Start State` clearly means restore, while `Set Start State` clearly means record the current setup as the Reset/Test start.
- [x] Keep linked-template consequences explicit: `Set Start State + Apply Template` updates the reusable Template and linked instances; a Unique copy can use `Set Start State` locally.
- [x] Restore the compact Puzzle Test HUD actions so `Reset` and `Back to Setup` are always available while testing.
- [ ] iPhone regression: Management Reset returns the selected puzzle to Start without unexpectedly leaving Puzzle Management.
- [ ] iPhone regression: Test Current shows both Reset and Back to Setup; Back returns to the same editable session setup.

## Next architecture target — reusable Puzzle Logic foundation

The current puzzles now expose enough repeated behaviour to justify a small reusable runtime logic vocabulary. Build this **incrementally underneath the existing Logic tab** before attempting a visual/node editor. The future editor should present real reusable data/components rather than becoming another bespoke runtime.

- [ ] Define a small `Event -> Conditions -> Actions` representation with stable IDs and explicit references to puzzle objects, inventory items, Asset Lab states, paths and puzzle lifecycle state.
- [ ] Add reusable event sources for the behaviours already proven by current puzzles: Entry crossed, Exit crossed, sockets complete, item/object interaction, item combination, Animation Path start/complete, and puzzle complete.
- [ ] Add reusable conditions such as asset state equals, inventory contains item, source/target object identity, puzzle started/completed state, and other conditions only as current behaviour requires them.
- [ ] Add reusable actions such as Set Asset State, consume/remove item, create/replace combined item, start Animation Path, mark puzzle started, complete puzzle and spawn/enable a reward.
- [ ] Formalise **Asset State Transition** as Logic which changes an object's Asset Lab-authored state rather than redefining appearance/collision/pushability in Puzzle Logic. Broken Handcart should be able to express Broken -> Repaired -> Landed/Bridge using its existing Asset Lab states.
- [ ] Formalise the Broken Bridge axle + wheel combination and use-on-cart/attachment requirement as reusable pieces rather than hard-coded bridge steps.
- [ ] Make the existing Cart Path / future Environment Animation Path participate through explicit activation and completion events so path playback can be triggered by reusable Logic and can trigger later actions/state transitions.
- [ ] Re-express **Fallen Tree**, **Stone Wall** and **Broken Bridge** using the same underlying primitives while preserving their current gameplay exactly.
- [ ] Correct the current Broken Bridge Logic migration: it must not claim `Socket Completion` or a `Forest Key` completion reward when those are not its actual completion semantics.
- [ ] Keep the visible Logic UI human-readable: it may group several primitive records into a meaningful rule such as `Repair Handcart` rather than forcing authors to manage every low-level action separately.
- [ ] Do **not** build the visual Logic editor yet. Once several real puzzles are faithfully represented by the reusable data/runtime, design an editor on top of that proven model.

## October 8, 2026 — v1.0.134 Puzzle Entry / Exit Logic

**Current status:** v1.0.134 replaces the Fallen Tree's opaque legacy `cross-x` completion with a reusable applied `Puzzle Entry / Exit` Logic system. The system defaults to puzzle-bound markers, supports independent manual Entry/Exit placement, participates in the existing Puzzle transaction/session model, and preserves the exact old Fallen Tree completion point during migration. On-device regression testing is still required.

### v1.0.134 — Puzzle Entry / Exit

- [x] Add `Puzzle Entry / Exit` as a reusable applied Logic system.
- [x] Entry marks a puzzle as started; Exit marks it complete.
- [x] Default new Entry / Exit Logic to AUTO markers derived from the current puzzle bounds.
- [x] Allow Entry and Exit to be moved independently; moving a marker changes only that marker to MANUAL.
- [x] Provide `Entry = Bounds`, `Exit = Bounds` and `Use Puzzle Bounds` actions to return manual markers to automatic bounds-following placement.
- [x] Draw labelled Entry / Exit markers in the viewport while this Logic item is selected; Move Entry / Move Exit use the same relative screen-space drag pattern as stable Puzzle Zones.
- [x] Preserve the Fallen Tree's old `cross-x` threshold as a manual Exit during migration, while its Entry follows the near puzzle bound.
- [x] Migrate v1.0.133 explicit `logic[]` saves safely with a Logic schema version so an older empty list cannot erase legacy `cross-x`, while an intentionally removed Entry / Exit in v1.0.134 stays removed.
- [x] Keep Socket Completion and Puzzle Entry / Exit mutually exclusive as completion rules in `+ Add Logic`; Completion Reward remains independent and can coexist with either.
- [x] Integrate Entry / Exit edits with Puzzle Undo/Redo, Save/Discard, recovery, Reset/Test and template/start snapshots.
- [ ] Focused iPhone regression: Fallen Tree should show Puzzle Entry / Exit in Logic, show/move both markers, start on crossing Entry and complete on crossing Exit.
- [ ] Regression-test AUTO markers after resizing puzzle bounds, then MANUAL marker placement, Undo/Redo, Save/Discard and Reset to Start.
- [ ] Confirm removing Puzzle Entry / Exit from a disposable puzzle remains removed after reload/reset rather than reviving legacy metadata.

## October 8, 2026 — v1.0.133 Applied Puzzle Logic

**Current status:** v1.0.133 formalises the first three existing puzzle behaviours as an applied Logic registry while preserving the v1.0.132 Management → Edit / Zones architecture. Only attached systems appear in the Logic tab; `+ Add Logic` attaches a compatible system. Legacy Stone Wall and Cart Path data are migrated when read, but an explicit `logic[]` list becomes authoritative once authored. On-device regression testing is still required before this slice is device-verified.

### v1.0.133 — Applied Puzzle Logic systems

- [x] Replace the permanent Cart Path feature panel with an applied Logic collection/registry.
- [x] Show only systems actually attached to a puzzle, plus `+ Add Logic` for compatible systems not already present.
- [x] Formalise the existing `Cart Path`, `Socket Completion` and `Completion Reward` behaviours first.
- [x] Migrate legacy Stone Wall semantics into explicit Socket Completion + Completion Reward without requiring a destructive data rewrite on load.
- [x] Migrate existing authored Cart Path use into an applied Cart Path record while keeping the established spline/path data and runtime behaviour.
- [x] Keep physical socket placement/matching under Contents; placing a socket no longer silently creates completion semantics.
- [x] Make explicit `logic[]` authoritative so removing a Logic system does not reappear from legacy metadata on the next render/reset.
- [x] Integrate Logic additions/removals/reward changes with the existing Puzzle Save/Discard, recovery and Undo/Redo snapshots.
- [x] v1.0.133 preserved the older Fallen Tree `cross-x` rule temporarily; this was superseded in v1.0.134 by reusable Puzzle Entry / Exit Logic.
- [x] Do not introduce a generic visual-scripting/node-graph system.
- [ ] Focused iPhone regression: Stone Wall should list Socket Completion + Completion Reward, complete from its existing sockets, and still spawn/collect its reward.
- [ ] Focused iPhone regression: Broken Bridge Cart Path editing, ghost preview, reset/test and repaired-cart takeover should behave exactly as before. **Known Logic-list issue:** current migration can also infer Socket Completion / Completion Reward incorrectly; fix this through the reusable Logic foundation above rather than treating those labels as correct.
- [ ] Regression-test `+ Add Logic`, Remove Logic, Undo/Redo, Save/Discard, Reset to Start, linked Template apply/revert and Make Unique on at least one disposable/user puzzle.

### Future — reusable Environment Animation Path system

The existing Cart Path is now treated as the first specialised consumer of a more general motion-path technique. **Do not fold this larger system into v1.0.133.** When the need is proven, generalise the underlying path model rather than building another one-off path editor.

- [ ] Promote the reusable spline/path data and preview tooling out of cart-specific semantics.
- [ ] Create an Animation Path that can target an authored Environment/Puzzle object rather than assuming a handcart.
- [ ] Make target-object assignment explicit and visible.
- [ ] Add an explicit activation source/condition (for example a trigger zone, interaction or another Logic event) rather than hard-coding “cart reaches path start”.
- [ ] Define playback/takeover behaviour and what happens to normal object physics/interaction while the path owns the object.
- [ ] Define an explicit end/settle state so the object can become ordinary world geometry/gameplay again after animation.
- [ ] Reuse the current START / CURVE / LAND shaping, whole-path movement, speed profile and ghost/scrub preview where they remain appropriate.
- [ ] Keep the reusable animation system separate from the higher-level puzzle Logic that decides *when* and *why* it runs.

## October 8, 2026 — v1.0.132 Management/Edit + stable Puzzle Zones

**Current status:** v1.0.132b implements the bounded Management/Edit separation and stable Puzzle Zones refactor identified by the v1.0.131 on-device review, plus the focused iPhone interaction corrections from v1.0.132a and two small editor-shell polish fixes: the Environment Selection Filter strip now keeps stable DOM/scroll state during refreshes, and the drawer collapse arrow is permanently anchored at the far-left of the header. Functionality has looked broadly correct during follow-up use, but focused Stone Wall/Broken Bridge regression remains part of the combined v1.0.132/v1.0.133 device pass.

### v1.0.132 — Management/Edit separation + stable Puzzle Zones

- [x] Make Puzzle first-level UI management-only; no internal puzzle authoring before `Edit Puzzle`.
- [x] Apply the same management-only boundary to World Groups; child/exclusion editing only inside `Edit Group`.
- [x] Replace legacy Puzzle exclusion/respawn special cases with a stable ID-bearing zone collection.
- [x] Initial zone types: Procedural Exclusion and Respawn Trigger.
- [x] Provide authoritative Add/List/Select/Focus/Move/Width/Length/Enabled/Delete zone workflow.
- [x] Fix iPhone zone-row selection by keeping list rows stable between render frames instead of recreating them every frame.
- [x] Give Respawn Trigger a distinct editable Spawn Point with `Move Spawn`, visible coordinates and `Spawn = Player`, separate from `Move Trigger`.
- [x] Make Respawn use the same stable zone interaction; retire the crash-prone viewport edge-handle route.
- [x] Safely migrate existing puzzle/template exclusion and Broken Bridge respawn data.
- [x] Integrate zone mutations with Puzzle Save/Discard and Undo/Redo.
- [x] Move/rename destructive `Clear Stage` to an explicit Advanced/Workshop utility.
- [x] Keep Environment Selection Filter chips stable across forced refreshes so iPhone horizontal scrolling is not interrupted/reset.
- [x] Anchor the drawer collapse arrow at the far-left of the header in every editor route.
- [ ] Complete focused iPhone regression testing of Stone Wall and Broken Bridge before closing the slice; specifically verify Respawn Trigger selection, Move Trigger, Move Spawn, Spawn = Player, Save/Discard and Undo/Redo.

## Editor architecture / workflow system update — October 2026

**Status:** approved architecture; **Stage 1 started in v1.0.117; Stage 2A Puzzle workspace started in v1.0.123; Stage 2B Puzzle sessions/history started in v1.0.125; v1.0.132b adds the Management/Edit correction and stable Puzzle Zones migration, including the iPhone list-selection and independent Respawn Spawn Point correction plus the Selection Filter/drawer-header polish**. World Group and Puzzle editing now share the production drawer/session/history grammar, with internal authoring gated behind explicit Edit sessions. v1.0.132 is awaiting focused on-device QA; Applied Puzzle Logic is the deliberately separate v1.0.133 slice. The general Environment Outliner/Inspector remains a later tooling stage.

### Stage 1 implementation progress — v1.0.117

Implemented in the first Stage 1 code pass:

- Persistent left-side Editor Drawer with fixed header, one scrolling body, fixed footer and a collapsed rail state.
- Tap and horizontal swipe collapse/expand from SideScroll-owned drawer surfaces rather than the iOS screen edge.
- Stable Back/context/collapse positions and fixed Undo/Redo + Save/Discard/Done footer positions.
- A bounded World Group edit session that holds scene persistence until Save.
- `Save` commits the session; `Discard` restores the full entry checkpoint. A newly created unsaved group is also removed by Discard.
- Dirty-session guards prevent scope/Play exit from silently abandoning or committing Group changes.
- Shared `beginEditorTransaction` / `commitEditorTransaction` / `cancelEditorTransaction` foundation with bounded Undo/Redo history.
- Pointer drag transactions for group-member movement, whole-group movement, exclusion movement and collision-handle editing: one drag becomes one history action. Exclusion width/length slider gestures also commit as one history action.
- Dedicated World Group workspace with `Contents / Exclusions / Group` tabs.
- Authoritative group child list including ordinary assets, Thought Nodes and Camera Nodes.
- Authoritative exclusion list with stable exclusion IDs; old previous/next zone navigation removed from the UI.
- Add / toggle / fit / duplicate / delete exclusion actions are contained inside Group Edit.
- Surrounding authored objects remain visible but cannot be picked while Group Edit owns the viewport.
- New assets placed during Group Edit automatically belong to the group and each placement is one Undo action.
- Explicit Detach vs Delete member actions.
- Existing Position, Collision, Thought and Camera inspectors remain reusable sub-tools; opening them does not end the Group session.
- Normal Environment mode now exposes only group-instance operations such as Edit, Move, Rename, Duplicate, Dissolve and Delete.

### Stage 1 drawer-position correction — v1.0.120

The first Group Add Asset phone test exposed a legacy CSS collision between the old centred placement HUD and the new persistent Editor Drawer. The unified drawer now explicitly owns its screen transform/left anchor in every authoring sub-tool, including placement. Entering Add Asset / placement must never inherit an old panel transform or move the drawer to an arbitrary intermediate position.

Editor-shell invariant: the drawer has only two intentional horizontal states — **fully anchored open** or **collapsed to its fixed rail**. Sub-tools may change drawer contents or deliberately collapse it, but may not directly reposition the shell.

### Stage 1 same-slot sub-tool correction — v1.0.121

Focused authoring tools must not appear on a different side of the viewport and force the user to reframe the scene. World Group `Position` is the first converted sub-tool: opening it records the current drawer route/scroll state, temporarily replaces the drawer at the **same left/top/width workspace anchor**, and uses `Back` rather than a dismiss-style `×`. Closing Position automatically restores the Group drawer to the route and scroll position it came from.

This is the reusable rule for later Collision / Thought / Camera / Puzzle / Terrain focused tools: **drill in within the same workspace slot; Back restores the parent workspace; never make the user chase editor panels around the screen.**

### Stage 1 selected-object Quick Tools correction — v1.0.122

On-device Group editing showed that Stage 1 accidentally removed a fast workflow that was already working well: the contextual object-action strip. The strip is therefore retained deliberately as **Quick Tools** rather than treated as obsolete UI. The drawer owns hierarchy/context/session navigation; Quick Tools owns immediate manipulation of the currently selected object.

- Selecting a World Group member restores the contextual Quick Tools strip: Duplicate, Flip, Scale −/+, Floor Line, Position, Collision and the applicable deeper collision/socket actions.
- Quick Tools disappears when no Group child is selected, while placing assets, or when an action does not apply to the selected child.
- Thought/Camera Nodes suppress irrelevant Scale/Flip/Floor/Collision actions but retain positioning, duplication and deletion controls.
- Add an explicit **Move** tool for World Group members. When armed, a drag can begin anywhere in the free viewport: the touch location is only a relative zero point for the selected object's current position. Lifting and touching elsewhere continues from the new position. This is the intended mouse-style mobile movement model.
- The Quick Tools strip has one stable bottom/free-workspace location and reclaims the space beside the collapsed drawer rather than leaving an invisible full-drawer gap.
- `Floor Line` now follows the same same-slot drill-in rule as `Position` during Group Edit: it replaces the drawer at the left workspace anchor and Back restores the Group workspace.
- Architectural clarification: the unified drawer does not need to absorb every high-frequency action. A stable context-sensitive Quick Tools strip is useful on iPhone landscape and should be reused consistently where it speeds repeated authoring.

### Stage 1 performance correction — v1.0.119

The first on-device Stage 1 test exposed two performance-sensitive implementation details that must remain part of the editor-shell rules:

- The persistent drawer must **not** use live `backdrop-filter` blur over the WebGL viewport. The Stage 1 drawer is much larger than the old compact panel, so continuously blurring the live scene is an avoidable iPhone/Safari compositor cost. Use a sufficiently opaque panel surface instead.
- Read-only render queries must never perform schema migration/normalisation. World Group exclusion IDs are now normalised once per group object rather than rebuilding exclusion records in the per-object draw path.
- Procedural dressing exclusion bounds are flattened once per rendered frame and reused by every dressing object rather than rescanning/rebuilding all World Group zones for every object.
- Treat this as a general engine rule: **migration, validation, deep-copy/history work and DOM rebuilding belong at load/edit/transaction boundaries, not inside per-frame or per-object render paths.**

### Stage 2A — first bounded Puzzle workspace migration (v1.0.123)

**This is a deliberately smaller first increment, not Puzzle Editor v2 completion.** The overnight draft had new HTML controls but no implementation behind them, and its documentation prematurely claimed that Save/Discard, central Undo and linked-instance overrides were finished. Those claims were withdrawn. This tested-for-static-integrity slice starts from the verified v1.0.122 build rather than shipping that incomplete draft.

Stage 2A delivered:

- [x] `Edit Puzzle` now enters a distinct Puzzle workspace in the **same left-hand drawer**, with stable `Contents / Zones / Logic / Setup` tab navigation and a fixed `Back` to the scene puzzle list.
- [x] `Contents` has a directly selectable list of the current puzzle's active pieces or dressing assets. List selection drives the **existing object selection and Quick Tools**, not a duplicate transform implementation.
- [x] `Zones` groups the existing procedural exclusion and respawn entry/actions; `Logic` groups the existing cart-path entry/basic actions. These are **delegated to existing handlers**, so the runtime puzzle algorithms are unchanged. Detailed cart speed/curve controls remain a later migration.
- [x] `Setup` keeps existing `Test Current`, `Reset`, `Save Unique` and `Set Start` actions. Linked-instance `Set Start` now asks for explicit confirmation because the *legacy* action also overwrites the shared template and updates its linked scene instances.
- [x] Puzzle Position / Floor Line use the same left-side replacement position as the drawer and return via Back. Returning from Test restores the current workspace; switching tabs deactivates irrelevant viewport zone/path edit tools.
- [x] No new per-frame loops, DOM reconstruction in drawing, or heavy blur. List rebuilding is signature-guarded and happens on editor updates.
- [x] **v1.0.124 exclusion interaction cleanup:** World Group and Puzzle procedural exclusions no longer use perspective-sensitive centre/edge drag dots. A selected zone can enter explicit `Move` mode and then uses the same relative screen-space/mouse-style X/Z mapping as authored assets: drag anywhere in the free viewport, lift/reposition the finger, and continue from the zone's current position. Width and Length are edited with stable UI sliders instead of four scene resize handles. World Group slider drags are one Undo transaction; Puzzle slider gestures join the shared transaction history from v1.0.125 onward.

### Stage 2B — Puzzle edit sessions + shared history (v1.0.125)

Stage 2B deliberately reuses the transaction/session machinery proven by World Groups rather than creating a second Undo model.

Delivered in v1.0.125:

- [x] `Edit Puzzle` now opens a **bounded Puzzle edit session**. The entry state becomes the session checkpoint; ordinary puzzle-authoring persistence is held in memory until the session is committed.
- [x] The drawer footer now exposes the same fixed **Undo / Redo / Discard / Save** grammar used by World Groups. Back cannot silently abandon a dirty Puzzle session.
- [x] `Save` commits the current **scene-instance working edits** and exits Puzzle Edit. `Discard` restores the complete Puzzle session checkpoint and exits without flushing the held changes.
- [x] The first central Undo/Redo coverage includes normal puzzle-object transforms/placement, Scale/Flip/Delete/Duplicate through the existing Quick Tools, collision/floor-line/object-property edits, puzzle marker/bounds drags, procedural exclusion move/resize/toggle, respawn edits, cart-path edits, sockets and authoring-safe Reset. One pointer drag / slider gesture is one history action where the tool has a continuous interaction.
- [x] Puzzle bounds now have a persisted scene-instance draft (`boundsDraft`) so session Save does not silently lose bounds on reload.
- [x] `Test Current` remains disposable and outside the authoring history. Returning from Test restores the current edit-session setup.
- [x] In an active Puzzle edit session, `Reset to Saved` now resets only the authored setup rather than mutating player inventory/reward state; the reset itself is Undoable.
- [x] `Set Start` and `Save Unique` are explicit **commit boundaries**. They force their intended template/start-state persistence, clear the session history/checkpoint to the newly committed state, and cannot later be undone by session Discard. Linked-template `Set Start` still requires explicit confirmation.
- [x] Working scene-instance edits and shared template start-state edits now have clearer semantics: **Save = current scene instance working overrides; Set Start = Reset/Test start state (and shared template for linked instances); Save Unique = detach this scene instance from the shared template.**

### Stage 2C — Puzzle Editor v2 completion candidate (v1.0.131)

Delivered in the completion pass:

- [x] **Explicit relationship UX:** Setup now distinguishes Linked Template vs Unique Copy, shows whether the scene matches its reference or carries a local scene override, and keeps ordinary `Save` scene-local.
- [x] **Revert Scene to Template:** linked instances can explicitly discard their local setup override and return to the reusable Template without moving the scene marker. The revert is an ordinary Undoable session action until Save.
- [x] **Make Unique:** the detach action is named explicitly and requires confirmation. It preserves the current scene setup, then stops future Template propagation to that scene copy.
- [x] **Apply as Template + Start:** the consequential shared action is named explicitly, confirms before changing shared content, and continues to update every linked scene instance intentionally. Unique copies instead expose `Set Start for Unique`.
- [x] **Detailed cart-path migration:** duration, landing angle, start/mid/end speed profile, Match Push, ghost replay and scrub now live inside the Puzzle `Logic` drawer route; only the spline/handles remain in the viewport.
- [x] **Selected-child Inspector:** Puzzle `Contents` now has an authoritative selected-child action block for Position, Ground/Free placement, Collision, Duplicate/Delete, socket Set/Clear and node Settings.
- [x] **Thought / Camera child drill-in:** node settings no longer open merely because a node is selected during Puzzle Edit. They open deliberately from the child Inspector and return to Puzzle Contents with Back while keeping the child selected.
- [x] **Socket workflow integration:** socket pieces expose Set/Move/Clear from the Puzzle child Inspector while retaining the existing viewport host-placement mechanic and transaction history.
- [x] **History audit:** marker text-entry moves now join the shared Puzzle transaction history; detailed cart controls, node edits, sockets, object edits, bounds, zones, respawn and path handles all participate through the central transaction/implicit-mutation paths. Destructive Template/Unique operations remain deliberate commit boundaries rather than misleading Undo entries.
- [x] **Recovery draft:** dirty Puzzle edit sessions write a separate recovery snapshot at authoring transaction boundaries and on page hide. Re-entering the same puzzle after an interrupted session offers Recover vs discard-recovery, while normal Save/Discard/commit boundaries clear the draft.
- [ ] **On-device iPhone QA:** exercise Save/Discard/Undo/Redo/Test, relationship actions, cart path, sockets, Thought/Camera nodes and recovery across several puzzle types before formally declaring Stage 2 complete.

**Current Puzzle navigation rule:** Back from a clean Puzzle session returns to the scene puzzle list. Back from a dirty session stays in Puzzle Edit and directs the author to the fixed Save/Discard controls. Save commits working scene-instance edits; Discard restores the session entry checkpoint. `Apply as Template + Start` (linked) or `Set Start for Unique` remains a separate, more consequential commit action.



### Camera/support-surface consistency — v1.0.130

- [x] Edit-camera vertical baseline now follows the currently resolved authored walk/Support Surface (the mint walk surface), not terrain underneath it. Follow Height only affects extra character displacement above that support.
- [x] Ground-positioned gameplay authoring objects such as Camera Nodes, Thought Nodes and collectibles now use the authored placement Support Surface resolver instead of being re-grounded to gameplay terrain after placement/movement.
- [x] Camera Node preview therefore inherits the same support-aware camera baseline while authoring.
- [x] Procedural biome placement remains terrain-only; this change is confined to authored/manual editor placement and camera framing.
- [x] No hidden support-parent relationship is created.

### Edit-mode / startup support preservation — v1.0.128–1.0.129

- [x] Entering Edit mode while the player is standing on an authored Support Surface preserves that support instead of snapping the character/camera down to terrain.
- [x] v1.0.128 corrected the one-time `setEditMode(true)` transition, but phone testing exposed an older per-frame Edit branch that immediately reset `jumpOffset = 0` and cleared `standingOnObject` on the following render. v1.0.129 removes that terrain-only per-frame override and resolves the current authored/editor-safe Support Surface every Edit frame.
- [x] Edit entry still resolves `editorSafeSupportAt(...)` with a ceiling based on the player's current feet height, so entering Edit cannot jump the player upward onto a higher overlapping platform.
- [x] Player-position restore now resolves the real walk/support surface before display instead of restoring terrain Y first and relying on the next gameplay tick to lift the character.
- [x] The launch fade performs one final support resolve after initial streaming/loading and before reveal, preventing a visible terrain-to-rock/platform pop at game start.
- [x] This remains an editor/player grounding correction only: procedural biome placement stays terrain-only and no hidden support parenting is introduced.

### Shared walk-surface placement correction — v1.0.127

Manual/authored Ground placement now deliberately shares the same authored **Support Surface** collision concept used by player walking, instead of treating `Ground` as terrain-only.

- [x] Manual standalone assets, World Group members and Puzzle-authored objects in Ground mode can rest on valid walk/support collision such as climbable-rock tops, bridge/platform collision and other existing `Support Surface` assets.
- [x] The support query chooses the highest valid support at the authored X/Z position, with terrain remaining the normal fallback.
- [x] The object being edited is excluded from its own support query.
- [x] Relative/mouse-style asset dragging remains screen-space. Only the resulting Ground height is resolved from the shared support system; depth dragging does **not** revert to ray/terrain-intersection movement.
- [x] Initial manual placement can resolve a tap near a visible support top onto that authored collision instead of always shooting through to the terrain behind it.
- [x] Ground/Free toggling, Position X/Z edits, Scale, Floor Line and Duplicate preserve their local floor offset relative to the current manual placement surface.
- [x] Authored `Follow Surface Normal` dressing can use the local authored support profile; procedural dressing keeps its terrain-normal behaviour.
- [x] **Procedural biome placement remains terrain-only.** Authored/climbable rocks, bridges and other Support Surfaces must never become procedural spawn surfaces merely because the player can walk on them.
- [x] No hidden support-parent/attachment relationship is created. Placement asks “where is the valid surface now?” only. If we later need one authored object to follow another independently, make that an explicit visible `Attach/Parent to Support`-style feature rather than secret coupling.

Current deliberate limitation: whole-World-Group relocation/template semantics retain their existing independent member re-grounding rules. Do not infer a persistent rock→dressing parent relationship from a one-time placement. Revisit only if a concrete grouped-support use case proves it is needed.

Still pending within the wider Stage 1 shell work:

- General-purpose drawer route stack/navigation service; v1.0.117 has the first Environment -> World Group context transition but not the fully reusable route stack yet.
- Physical drawer-follow animation while the finger is moving; v1.0.117 supports deliberate horizontal swipe/tap collapse with intent thresholding.
- Broader route scroll-position restoration beyond the persistent current drawer body.
- Central Undo coverage outside World Group Edit.
- On-device iPhone/A2HS ergonomics pass after this build is tested.

### Why this update exists

SideScroll now has capable local authoring tools, but the Play editor has grown incrementally. Selection, editing, placement, movement and persistence are sometimes represented by independent booleans or tool-specific mini-modes. That makes it possible to mutate authored data without entering a clearly bounded edit context, and it makes Save / Discard / Undo behaviour inconsistent between systems.

The redesign borrows the **workflow principles** of Unity Prefab Mode / Hierarchy / Inspector and Unreal Level Instance Edit Mode / Outliner / Details / specialised Editor Modes, while keeping the UI phone-first rather than copying a desktop editor literally.

Reference patterns researched for this design:

- Unity 6 Prefab Mode in Context: edit a prefab while retaining scene context.
- Unity Hierarchy + Inspector: one authoritative object list linked to one context-sensitive property editor.
- Unity Prefab overrides: explicit apply/revert semantics for instance changes.
- Unity Undo grouping: interaction boundaries such as pointer-down / pointer-up naturally form one Undo action.
- Unreal Level Instances: selecting an instance is separate from entering Edit; surrounding content is visually de-emphasised/locked; editing ends with Commit or leaving without committing.
- Unreal Outliner + Details: scene hierarchy/selection is separated from selected-object properties.
- Unreal Level Editor Modes / Actor Editor Context: specialist tasks have an explicit active context rather than overlapping global toggles.

### Core SideScroll editor rules

These are the rules future editor systems should converge on.

1. **Select is not Edit.** Selecting an authored unit lets us inspect, focus, move the whole instance where appropriate, duplicate it, or delete it. Editing its internals requires an explicit edit context.
2. **One active authoring context.** At any moment the editor should know which context owns edits: Environment, World Group, Puzzle, Terrain, Asset Definition, etc. Do not combine unrelated edit-mode booleans into accidental states.
3. **One selected thing.** Viewport taps and list taps should resolve to the same selection model. A selected thing drives one context-sensitive Inspector/Details area.
4. **Lists/hierarchies are authoritative; viewport manipulation is complementary.** Dense scenes must never require repeated tapping to rediscover a hidden asset/node/zone.
5. **One active sub-tool.** Transform, Collision, Exclusion, Path, Respawn, Placement etc. are tools *inside* the current context, not independent top-level editing modes.
6. **Authored edits are transactional.** Meaningful authoring contexts support Undo. Bounded edit sessions support Save/Discard where abandoning the whole set of changes is useful.
7. **One drag = one Undo action.** Begin the transaction on pointer-down, update live while dragging, commit on pointer-up only if persistent state changed.
8. **Ownership must always be visible.** The UI should make clear whether something belongs to the World, a World Group, a Puzzle, a reusable Template, or global Asset Defaults.
9. **Outside-context content is protected.** When editing a group/puzzle, unrelated authored content remains visible for context but is non-pickable/non-editable and may be visually de-emphasised.
10. **Global settings are separate from authored content.** Camera defaults, Fog, Post, Debug and future Streaming settings should not be mixed into object/group editing controls.
11. **Dangerous/destructive actions are explicit.** Delete, dissolve/detach, reset and template-application actions must be visually and semantically distinct.
12. **Phone-first navigation uses drill-in rather than desktop clutter.** Prefer a single workspace that swaps between List → Details → focused sub-tool, with breadcrumbs/back controls, rather than trying to display Outliner + Inspector + viewport side-by-side.

---

## Unified editor shell / swipe-drawer navigation — approved direction

**Status:** approved design direction; should be implemented as part of the shared editor foundation rather than as a cosmetic pass after individual tools are rebuilt.

### Why this needs to be a system, not a styling pass

The current Play editor uses several different UI geometries at once:

- The main Environment/Puzzle editor is a large panel on the **left**.
- Camera, Fog, Post, Sections and Sound open as independent panels on the **right**.
- Selected-object actions live in a separate **bottom horizontal strip**.
- Thought, Camera Node, Transform and Ground-Line editing use their own focused popovers/panels.
- The global Tools launcher is a compact panel at the **top-right**.
- Different panels use different combinations of `×`, `Done`, `Back`, panel replacement, auto-close and direct mode toggles.
- Some panels scroll themselves, some contain nested scrolling regions, and some rely on the overall available viewport height.

The result is that controls can appear in different places for conceptually similar actions, opening one panel may close another for implementation reasons rather than workflow reasons, and it is not always obvious whether `×`, `Done`, a scope button or another menu button is the correct way out.

The future editor should therefore have one reusable **Editor Drawer shell** and one consistent navigation grammar. World Group Editor v2, Puzzle Editor v2, Terrain Edit, the Environment hierarchy/Inspector, World/Look settings and Diagnostics should all be pages/contexts hosted by that shell rather than each inventing their own screen position and exit rules.

### Reference pattern and SideScroll adaptation

Useful Unreal patterns:

- The Level Editor keeps stable conceptual regions: Viewport, Outliner, Details, toolbar and Content Browser/Drawer.
- The Content Drawer is a temporary browser that can be opened when needed; a Content Browser can also be moved to a sidebar where it collapses to a persistent tab rather than being destroyed.
- Editor Modes change the active toolset while preserving the overall editor layout.
- Details remain a predictable place for the selected object's properties.

SideScroll should borrow the **predictability and persistence**, not the desktop layout. On iPhone landscape we cannot permanently show Outliner + Details + Content Browser simultaneously, so they become routes within one drawer.

### Primary layout

Use one **left-side Editor Drawer** as the default authoring surface.

Why left by default:

- It matches the current Environment/Puzzle panel position, so the biggest existing workflow does not jump sides.
- It leaves the upper-right global `Menu` control and the right side of the world view visually distinct.
- In Play, the player's right-side interaction controls already establish that side as gameplay/action territory.
- It gives Group/Puzzle/Terrain editing one stable home instead of inheriting whichever side the legacy panel used.

The exact expanded width should be tuned on-device, but the target is roughly the current authoring-panel footprint: enough for readable lists/controls without consuming most of the landscape viewport.

### Drawer states

The drawer should have three conceptual states:

1. **Absent** — only when the editor is not active, for example normal Play.
2. **Expanded** — full authoring panel visible.
3. **Collapsed to rail** — the editor remains active, but only a narrow persistent rail/grip remains visible at the left edge of the app's own safe area.

Important rule: **collapsing the drawer is not leaving the mode.**

If Group Edit is active and the drawer is collapsed, Group Edit remains active, outside-group content remains protected, the edit session remains dirty if applicable, and Undo history remains intact. The rail should show enough state to remind the user where they are, for example a compact mode mark plus a dirty indicator.

The drawer should only disappear completely when leaving Edit/authoring mode altogether.

### Swipe / drag behaviour

The SideScroll drawer should feel like a physical panel that can be pushed aside and pulled back.

- Dragging the drawer's exposed **grip/rail** horizontally should move the drawer with the finger.
- Releasing past a distance/velocity threshold snaps to expanded or collapsed.
- Tapping the rail/chevron is the non-gesture fallback and performs the same expand/collapse action.
- Use a transform-based slide where practical rather than continuously re-laying out the whole viewport.
- Start the drawer gesture only from the drawer/header/grip region. Do **not** depend on swiping from the extreme screen edge, because iOS owns edge gestures and SideScroll should not compete with them.
- Once a gesture has moved far enough to determine intent, axis-lock it: horizontal movement controls drawer collapse/expand; vertical movement remains panel scrolling.
- A drawer gesture must never leak through and move/select an authored world object underneath it.

This gives the requested Unreal-like ability to get the UI mostly out of the way without losing the current editing context.

### One fixed header grammar

Every authoring drawer page should use the same pinned header geometry.

Recommended structure:

```text
[ Back ]   WORLD GROUP > Fallen Tree Area     [ ‹ Collapse ]
```

Rules:

- **Back is always in the same top-left position** when there is a parent route.
- The centre/remaining area always identifies the current context/selection.
- The drawer collapse control is always in the same outer-edge position.
- Do not use `×` for navigating out of authoring modes or sub-tools.
- `×` is reserved for genuinely transient overlays/dialogs where closing means dismissing that overlay, not changing editing context.
- Breadcrumb text can be shortened on narrow screens, but the physical button positions should not move.

Examples:

```text
ENVIRONMENT
WORLD GROUP > Fallen Tree Area
PUZZLE > Broken Bridge
TERRAIN > Section 18
WORLD / LOOK > Fog
DIAGNOSTICS > Performance
```

### Entering and leaving modes consistently

The editor needs predictable semantics for three different actions that are currently blurred together:

**Enter**

- `Menu > Edit` enters Environment editing and opens the drawer.
- `Edit Group`, `Edit Puzzle`, `Terrain Edit`, etc. change the active editor context **inside the same drawer shell**.
- Entering a focused child/tool changes drawer route/content; it does not spawn a panel elsewhere on screen.

**Back**

- Goes up one navigation level inside the current context.
- Example: Group child Inspector -> Group Contents.
- Back does not silently abandon a dirty edit session.

**Exit / commit**

- Transactional edit contexts use a fixed bottom action area with `Save` / `Discard` semantics.
- Non-transactional focused tools use a consistent `Done` or Back action rather than an arbitrary close button.
- Leaving top-level Environment editing returns to Play through one clearly named `Done Editing` action in a consistent place.

For example:

```text
Group child Inspector
[ Undo ] [ Redo ]                 [ Back ]

Group Edit root — dirty
[ Undo ] [ Redo ]          [ Discard ] [ Save ]

Environment Edit root
[ Undo ] [ Redo ]                         [ Done Editing ]
```

Exact button packing can be tuned, but the meaning and placement should remain stable.

### Pinned header, pinned footer, one scroll body

The default drawer layout should be:

```text
┌─────────────────────────────┐
│ fixed header                │
├─────────────────────────────┤
│ optional fixed tabs         │
├─────────────────────────────┤
│                             │
│ ONE vertical scroll body    │
│                             │
├─────────────────────────────┤
│ fixed action/footer area    │
└─────────────────────────────┘
```

Scrolling rules:

- The drawer shell itself owns the primary vertical scroll region.
- Header and primary exit/commit controls should not scroll away.
- Avoid nested vertical scrolling wherever possible; long Contents/Outliner lists should normally be part of the drawer body.
- If a sub-list genuinely needs independent scrolling later, it must be visually obvious and should not create competing swipe regions by default.
- Preserve the current drawer route's scroll position when the drawer is collapsed and reopened.
- Preserve useful scroll position when returning Back to a parent list.
- Entering a different selected entity/details page can start at the top unless there is a strong workflow reason to restore its previous position.
- Continue the existing deliberate-tap-vs-scroll protection: controls should activate after a tap/release that did not become a drag, so vertical scrolling remains safe on touch.
- Use `overscroll-behavior`/touch containment so reaching the end of a drawer does not pan/manipulate the world underneath.

### Tabs and drill-in pages

Tabs are appropriate only for a small number of stable peer categories within one context, for example Group Editor:

```text
CONTENTS | EXCLUSIONS | GROUP
```

Rules:

- Tabs stay directly under the fixed header and remain visible while the body scrolls.
- A selected child should normally **drill into Details/Inspector** rather than trying to append an enormous property form below a long list.
- Back returns to the same tab/list and preferably the same scroll position.
- Focused sub-tools such as Collision, Exclusion Shape or Cart Path should remain within the drawer route hierarchy, even if the viewport gains specialist handles/overlays.

### Collapsed rail behaviour

The collapsed rail is important enough to be a first-class UI state rather than a mostly hidden chevron.

It should provide:

- A reliable grab/tap target within the safe area.
- An expand chevron.
- A compact indication of active context, e.g. `EDIT`, `GROUP`, `PUZZLE`, `TERRAIN` or a simple consistent icon/badge.
- A visible dirty dot/mark when the active transactional context has unsaved changes.
- Optional Undo availability indicator later, but do not overload the rail with many action buttons.

The rail should **not** become a second toolbar. Its job is orientation and drawer recovery.

### Global Menu vs Editor Drawer

Keep the global `Menu` launcher at one fixed viewport position. It should not jump when entering Edit.

Longer-term behaviour:

- In Play, `Menu` opens the normal global launcher/settings route.
- `Edit` from that launcher enters Environment Edit and opens the persistent Editor Drawer.
- While an authoring context owns the drawer, opening another authoring context must go through the central context-transition/dirty guard rather than simply hiding the current panel.
- Non-authoring quick toggles such as view/debug visibility may remain direct actions where useful.
- Camera/Fog/Post/Sections should eventually stop spawning independent right-side panels and become routes under the shared shell (`World / Look`, `Terrain`, `Diagnostics`, etc.).
- Sound and Inventory are player/global utilities rather than authored scene contexts; they may remain transient overlays, but they should still adopt the same visual header/close conventions if they remain separate.

### No more button teleporting

Future UI reviews should reject workflows where the same conceptual action appears in unrelated positions depending on mode.

Standard positions:

- Global `Menu`: fixed viewport position.
- Drawer Back: fixed top-left inside drawer.
- Drawer context/title: fixed header area.
- Drawer collapse/expand: fixed outer edge/header/rail.
- Undo/Redo: fixed footer area when available.
- Save/Discard/Done Editing: fixed footer area according to context.
- Destructive entity actions: inside Details/Group/Puzzle pages, visually separated from navigation.

Do not put `Delete`, `Save`, `Done`, `Back` and panel-close controls into whichever gap happens to be available in a specific feature.

### Proposed reusable UI/state model

The central editor model should eventually include drawer/navigation state alongside authoring context. Conceptually:

```js
editor = {
  mode: 'play' | 'environment' | 'world-group' | 'puzzle' | 'terrain',
  ownerId: null,
  selection: { type:null, id:null },
  tool: 'select',
  session: null,
  history: null,
  ui: {
    drawer: 'expanded', // expanded | collapsed
    route: ['environment'],
    scrollByRoute: {}
  }
};
```

The exact data shape is not important. The important architectural services are:

- `enterEditorContext(...)`
- `requestLeaveEditorContext(...)` with dirty/session guard
- `pushEditorRoute(...)`
- `popEditorRoute(...)`
- `setEditorDrawerCollapsed(...)`
- one central place that decides what the drawer renders

This prevents feature code from individually setting `panel.hidden`, closing three unrelated panels and toggling body classes every time a mode changes.

### Migration strategy

Do not attempt to restyle every legacy panel at once.

**Stage 1 — shell foundation + World Group Editor v2**

- Build the reusable drawer shell, rail, pinned header/body/footer and route stack.
- Environment root and World Group Editor v2 become the first real users.
- Add consistent Back, collapse, Save/Discard, Undo/Redo positions.

**Stage 2 — Puzzle Editor v2**

- Reuse the exact shell/navigation model.
- Puzzle Contents/Zones/Logic/Paths become drawer routes/tabs.

**Stage 3 — general Environment / Inspector / placement**

- Keep the selected-object Quick Tools strip as a stable high-frequency transform/action surface; move hierarchy/Inspector/library/context navigation into the drawer rather than duplicating those responsibilities in the strip.
- Asset placement can temporarily collapse the drawer automatically to give viewport space, but the rail remains present and placement status remains visible.

**Stage 4 — Terrain, World/Look, Diagnostics**

- Sections/Terrain becomes Terrain Edit in the drawer.
- Camera/Fog/Post move into World/Look routes rather than separate right-side windows.
- Performance/debug/streaming visualisation use Diagnostics routes.

**Stage 5 — consistency pass**

- Remove obsolete independent panel-open booleans/functions where the shared shell has replaced them.
- Review all remaining `×`, `Done`, Back, Save, Reset and Delete controls against the common grammar.
- Verify touch/scroll/rail behaviour on iPhone landscape and A2HS/PWA safe areas.

### Unified drawer implementation tasks

- [x] Build one reusable phone-first Editor Drawer shell. *(v1.0.117 first production shell)*
- [x] Anchor authoring drawer consistently on the left. **On-device width tuning remains.**
- [x] Add persistent collapsed rail/grip; collapsed is not closed.
- [x] Add horizontal swipe collapse/expand with tap fallback. *(Finger-follow animation can be refined later.)*
- [x] Keep gestures away from the OS-owned extreme screen edge.
- [ ] Add gesture axis locking so vertical scroll and horizontal drawer movement do not fight.
- [x] Create fixed header positions for Back/context/collapse controls.
- [x] Create fixed footer positions for Undo/Redo and Save/Discard/Done according to context.
- [ ] Use one primary vertical scroll body with pinned header/footer and preserved route scroll positions.
- [ ] Create a drawer route stack / navigation service rather than feature-specific panel visibility toggles.
- [x] Make dirty-session guards run before context/route changes that would abandon work. *(World Group first production integration.)*
- [x] Keep global `Menu` in one fixed viewport position.
- [x] Migrate World Group Editor v2 into the drawer first. *(v1.0.117)*
- [x] Migrate Puzzle Editor v2 second. *(v1.0.123–v1.0.131; final on-device QA still required.)*
- [ ] Migrate Environment Outliner/Inspector/asset placement as the general editor shell matures.
- [ ] Migrate Terrain, Camera/Fog/Post and Diagnostics away from floating independent panels.
- [ ] Reserve `×` for transient overlays/dialogs, not authoring navigation.
- [ ] Audit all menu/button positions after migration so equivalent actions no longer jump around between workflows.

---

## World Group Editor v2 — approved specification

### Problem in the current implementation

The current World Group system has separate `worldGroupEditMode`, `worldGroupMoveMode` and `worldGroupExclusionEditMode` states. Exclusion editing actually turns normal Group Edit off. Several group mutations—including exclusion add/toggle/fit/delete and membership changes—write directly to scene persistence even when a proper Group Edit session was never entered.

The exclusion accessor also normalises/rebuilds the exclusion array while reading it. That is acceptable for migration/validation but is a poor basis for holding UI identity on a selected exclusion. The new workflow should give each editable child/zone stable editor identity rather than navigating a mutable array only by a global previous/next index.

The solution is **not** to add more buttons to the existing World Groups block. World Groups need a dedicated editing context.

### Normal Environment mode — group instance selected, not opened

A selected World Group behaves as one authored spatial instance. Allowed instance-level operations:

- Focus/select the group.
- Move the whole group from its origin handle / transform control.
- Duplicate Group.
- Rename Group.
- Delete Group.
- Dissolve Group into standalone world objects, with clear confirmation.
- Enter **Edit Group**.

Not allowed outside Group Edit:

- Editing individual member transforms/settings.
- Adding/removing group membership.
- Editing exclusions.
- Editing group-owned Thought/Camera Nodes.
- Adding internal assets directly to the group.
- Mutating internal member collision/placement behaviour.

This creates the essential prefab/instance distinction: moving the whole instance is not the same operation as editing its contents.

### Entering Group Edit

Pressing **Edit Group** should:

- End/cancel incompatible placement or focused tools cleanly.
- Create a `worldGroupEditSession` checkpoint containing all persistent state needed to restore the group exactly.
- Set one explicit editor context such as `context = { type:'world-group', id:<groupId> }`.
- Replace the normal Environment workspace with the dedicated Group Editor.
- Keep the surrounding world visible **in context**, but make non-group authored content non-pickable/non-editable. Optional visual dim/desaturation can reinforce the boundary.
- Select no child initially, or restore the last child selection only if it still exists.
- Show a persistent header/breadcrumb indicating the active group and dirty state.

Suggested phone-first header:

```text
EDIT > WORLD GROUP > Fallen Tree Area
Unsaved changes

[ CONTENTS ] [ EXCLUSIONS ] [ GROUP ]
```

The exact visual styling can follow the existing focused Thought/Camera workspace replacement pattern.

### Contents tab — authoritative child list

The Contents list should enumerate **everything owned by the group**, not only environment sprites.

Examples:

- Environment assets.
- Gameplay-capable environment assets that are still world-owned.
- Thought Nodes.
- Camera Nodes.
- Future group-owned nodes/tools.

Each row should show enough state to identify it quickly, for example:

```text
Tree 03                 Ground
Rock 02                 Follow Normal
Broken Branch           Free
Thought: bridge edge    Thought
Camera: reveal          Camera
```

Behaviour:

- Tapping a row selects exactly that child in the viewport.
- Viewport selection selects/highlights the corresponding row.
- Selection is never dependent on repeated tap-cycling alone.
- The selected child opens the correct context-sensitive inspector/tool.
- `+ Add` opens the asset/node picker and new placements automatically belong to the currently edited group.
- `Add Existing` / `Attach Selected` may be provided where useful, but must be an explicit Group Edit action.

For removing ownership, distinguish:

- **Detach from Group** — object remains in the world as standalone authored content.
- **Delete** — object is removed from the world.

Do not use one ambiguous button for both meanings.

### Exclusions tab — replace previous/next zone buttons with a list

Exclusions should become named/stable child entries inside the Group Editor.

Example:

```text
EXCLUSIONS
+ ADD EXCLUSION

Exclusion 1       ON      4.8 × 3.2 m
Exclusion 2       ON      2.4 × 5.1 m
Exclusion 3       OFF     3.0 × 2.5 m
```

Selecting a row highlights only that exact exclusion and exposes its controls:

- Enabled ON/OFF.
- Edit Shape / direct handles.
- Fit to Group.
- Duplicate Exclusion.
- Delete Exclusion.
- Optional Rename later if real projects make numbered zones unclear.

Rules:

- Adding an exclusion creates a **new** entry and selects it. Existing exclusions cannot be replaced or silently lost.
- The old `← Zone` / `Zone →` workflow should be removed.
- Exclusion editing is a sub-tool inside Group Edit, not a separate top-level mode that disables Group Edit.
- Each exclusion should have a stable ID for UI selection/history rather than relying only on array position.
- World Group duplicate/template serialization must preserve all exclusion IDs/content appropriately; duplicated groups should receive new exclusion IDs if IDs are treated as entity identity.

### Group tab

Group-level information/actions should live separately from child editing:

- Group name.
- Origin position / optional explicit X/Z fields.
- Bounds/extent summary.
- Member count by type.
- Exclusion count.
- Template/source information if that relationship grows later.
- Dangerous actions such as Dissolve/Delete should be separated visually from normal editing and normally remain instance-level operations outside the active session unless a clear reason emerges.

### Child Inspector / Details pattern

When a child is selected, controls should be context-sensitive rather than exposing every possible editor button at once.

Possible sections:

- Transform / placement.
- Ground / Free / Follow Surface Normal status.
- Scale / flip / visual placement.
- Collision override.
- Gameplay behaviour where applicable.
- Thought settings if a Thought Node.
- Camera settings if a Camera Node.

The existing focused Thought/Camera workspace replacement is a useful prototype for this drill-in model and should be integrated rather than discarded.

### Save / Discard session behaviour

Entering Group Edit creates an edit-session checkpoint.

**Save**:

- Commits the current working group state.
- Clears the edit-session dirty flag/history scope as appropriate.
- Exits Group Edit back to Environment selection with the group still selected.

**Discard**:

- Restores the complete checkpoint: member transforms, new/deleted members, membership, exclusions, Thought/Camera nodes, collision/settings and any other persistent group-owned state.
- Exits Group Edit back to the original instance state.

Trying to leave Group Edit with unsaved changes should offer:

```text
Unsaved Group Changes
Save
Discard
Continue Editing
```

A simple accidental panel change or scope switch must never silently commit or abandon the session.

### Undo / Redo inside Group Edit

Group Edit should be the first consumer of the shared central authoring-history service.

Minimum meaningful transactions:

- Move child.
- Scale/flip/transform child.
- Duplicate child.
- Delete child.
- Add/detach membership.
- Add/duplicate/delete exclusion.
- Move/resize exclusion.
- Change exclusion enabled state.
- Edit Thought Node.
- Edit Camera Node.
- Add/remove node.
- Collision/property edits where those are allowed at instance level.

`Discard` is not a replacement for Undo: Undo reverses one operation; Discard reverses the entire edit session.

### Group movement outside edit

Keep whole-group movement available outside Group Edit. It is an instance transform, not an internal edit. The existing relative screen-space dragging model is appropriate; it should eventually participate in the shared Undo history as one transaction per drag.

### Templates and Duplicate Group

Keep the conceptual distinction:

- **Duplicate Group** = make one independent scene copy with fresh group/member/entity IDs.
- **Save Template / Place Template** = reusable authored source for repeated placement.

Do not force one-off duplication through template creation.

Future template work may adopt explicit instance override/apply/revert concepts similar to prefab workflows, but that should not complicate World Group Editor v2 unless a real requirement appears.

### World Group Editor v2 implementation tasks

- [x] Introduce a single explicit World Group edit-session object/checkpoint.
- [x] Add stable IDs to group exclusions and migration for existing array-only zones.
- [ ] Replace separate World Group edit/move/exclusion booleans with a clearer editor context + sub-tool model where practical.
- [x] Build a dedicated Group Editor workspace that replaces the normal Environment panel while active.
- [x] Add Contents / Exclusions / Group navigation.
- [x] Build authoritative group child list including assets, Thought Nodes and Camera Nodes.
- [x] Replace exclusion previous/next controls with selectable exclusion rows.
- [x] Lock/non-pick surrounding authored content while editing the group.
- [x] Make placements inside Group Edit automatically owned by the group.
- [x] Add explicit Detach vs Delete semantics.
- [x] Add Save / Discard with unsaved-change interception on exit/scope change.
- [x] Make Group Edit the first production consumer of shared transaction Undo/Redo.
- [x] Remove normal-UI group-internal mutation paths that can run outside Group Edit; internal controls now live in the session.
- [x] Keep whole-group Move / Duplicate / Rename / Delete as instance operations outside Group Edit.
- [ ] Regression-test group duplicate/template serialization after exclusion IDs/session changes.

---

## Engine-wide editor workflow audit — October 2026

This audit reviews the current Play editor plus World Lab, Asset Lab, Puzzle Lab, Design Lab and Walk Lab. The aim is not to recreate Unity/Unreal; it is to reuse the interaction patterns that remain valuable on a phone-sized editor.

### Current structural observations from the build

- The Play editor currently has many independent mode flags: global Edit, Puzzle Test, Puzzle Respawn, Puzzle Cart Path, Puzzle Exclusion, Puzzle Environment Placement, World Group Edit, World Group Move, World Group Exclusion, World Group Template Placement, Camera Edit, Transform Edit, Collision Edit and Ground-Line Edit.
- Several of those flags are mutually exclusive only because individual functions manually turn other flags off. This makes illegal/awkward combinations easy to introduce as features grow.
- Scene persistence is currently called directly from many feature-specific paths. This made fast incremental development possible, but it prevents one coherent Save/Discard/Undo model.
- The Environment panel mixes World Group management, Group Templates, world-object selection/filtering and asset placement in one long workspace.
- Puzzle editing mixes template browsing, scene instance selection, marker movement, instance editing, test mode, start-state persistence, exclusions, respawn and cart path tools in one panel/state machine.
- Thought/Camera Node focused workspaces are already moving toward the better pattern: selecting a special object replaces the broad panel with a context-specific editor.
- World Lab already follows a healthier `timeline selection -> context-sensitive Selection panel` pattern, but its local Undo stack is separate and coverage depends on each operation remembering to call `pushHistory`.
- Asset Lab has a good Library -> Viewport -> property-controls shape, but many changes persist immediately and it has no undo/session safety despite editing reusable defaults that can affect many instances.
- Design Lab already has a useful edit-session pattern: enter Edit, capture a snapshot, edit live/autosave, and Cancel restores the snapshot. This is a strong internal precedent for Group/Puzzle session semantics.

### Recommended editor ownership map

Each tool should have a clearly defined job so the same concept is not edited in multiple places without explicit handoff.

**Play / Environment Editor**

- Local authored scene composition.
- Standalone object placement and transforms.
- World Group instance placement and dedicated Group Edit.
- Puzzle instance placement and dedicated Puzzle Edit.
- Local nodes and direct in-world manipulation.

**World Lab**

- Macro world pacing/composition along distance.
- Biome/profile transitions.
- Terrain section overview and coarse planning.
- Puzzle/World Group authored spatial blocks and extents.
- Global streaming policy.
- Play-from-here / world navigation.
- It should not become the detailed child editor for groups/puzzles.

**Asset Lab**

- Reusable asset-definition defaults: visual layout, collision, behaviours, climb paths, sockets, mechanisms and named states.
- It should clearly distinguish global Asset Defaults from per-instance overrides authored in Play.

**Puzzle Lab**

- Isolated puzzle test harness / project launcher.
- Eventually a puzzle-library browser and validation workflow, while detailed spatial authoring can reuse the same Puzzle Edit context used in Play.

**Design Lab**

- Design-document content only. Its current explicit edit/cancel pattern should be preserved.

**Walk Lab**

- Character rig/animation/collider authoring only.

### 1. Main Play Editor shell — HIGH priority architecture

The Play editor should move from `many independent booleans + controls hidden/shown conditionally` toward one explicit editor context.

Recommended conceptual state:

```js
editor = {
  mode: 'play' | 'environment' | 'world-group' | 'puzzle' | 'terrain',
  ownerId: null,
  selection: { type:null, id:null },
  tool: 'select' | 'place' | 'transform' | 'collision' | 'exclusion' | 'respawn' | 'path',
  session: null
};
```

The exact implementation can remain pragmatic/vanilla JS; the important point is that state combinations become explicit rather than emergent.

Tasks:

- [ ] Define one central editor context/state model and migration plan from current mode booleans.
- [ ] Build the reusable Editor Drawer shell/route stack described in the Unified editor shell specification.
- [ ] Add standard enter/leave hooks so every context can clean up tools/pointers/selection consistently.
- [ ] Add the fixed phone-friendly header: Back/context/collapse positions remain stable across routes.
- [ ] Add the fixed footer/action grammar for Undo/Redo and Save/Discard/Done where applicable.
- [ ] Establish common `selection`, `tool`, `dirty`, `session`, `undo/redo` concepts before expanding more authoring features.

### 2. Scene hierarchy / Outliner pattern — HIGH priority usability

The current separate World Group list, world-object list and puzzle-object list solve pieces of the problem, but dense authoring needs one predictable list grammar.

Do **not** build a permanent desktop-style side panel. On iPhone landscape, use a drill-in hierarchy appropriate to the active context.

Environment example:

```text
ENVIRONMENT
World Groups (4)
  Fallen Tree Area
  Bridge Approach
Standalone Objects (12)
Thought / Camera Nodes (3)
Puzzles (5)   -> switches/focuses Puzzle context
```

Group/Puzzle edit then replaces this with its owned child hierarchy.

Desired behaviour:

- Viewport selection and list selection stay synchronised.
- Search/filter can be added only when real list size requires it.
- Expandable ownership groups reduce tap-cycling pressure.
- Visibility/pick-lock controls are possible later, borrowing the useful parts of Unity Scene Visibility/Picking.

Tasks:

- [ ] Design a reusable list-row/entity model for authored scene entities.
- [ ] Synchronise viewport and list selection through the central selection service.
- [ ] Reduce repeated-tap cycling to a fallback rather than the primary dense-scene workflow.
- [ ] Consider optional `hide in editor` / `lock picking` only after the hierarchy is stable.

### 3. Context-sensitive Inspector / Details pattern — HIGH priority usability

The bottom editor toolbar currently exposes action buttons based on many state checks. Over time this should become a selected-object Inspector with collapsible categories and a smaller transform/tool strip.

Possible per-instance categories:

- Transform.
- Placement (Ground / Free / Follow Surface Normal).
- Visual (scale/flip).
- Collision.
- Gameplay behaviour.
- Node-specific settings.
- Ownership / source.

Important rule: **Asset Defaults vs Instance Overrides must be visually distinct.** Asset Lab edits reusable defaults; Play edits this placed copy. If a placed copy overrides collision/visual behaviour, show that it is an override and provide explicit `Revert to Asset` / `Apply to Asset` only where safe and intentional.

Tasks:

- [ ] Define reusable Inspector sections driven by selected entity type.
- [ ] Move special-node editing into the same Details grammar while preserving focused drill-in views where useful.
- [ ] Formalise Asset Default vs Instance Override metadata/UI.
- [ ] Revisit `Save to Asset` / `Use Asset` collision wording under that model.

### 4. Puzzle Editor v2 — HIGH priority after World Groups

Puzzle editing is the strongest candidate to reuse the World Group Editor pattern.

Outside Puzzle Edit, a scene puzzle should act as one authored/stateful instance:

- Select/focus.
- Move whole puzzle marker/extent where appropriate.
- Duplicate/place another instance.
- Delete/remove.
- Test.
- Enter **Edit Puzzle**.

Inside Puzzle Edit, use a dedicated workspace with tabs such as:

- **Contents** — puzzle pieces and dressing.
- **Zones** — exclusions/respawn volumes/other regions.
- **Logic / Paths** — sockets, cart path, future puzzle-specific rails/nodes.
- **Puzzle** — bounds, instance/template source, start state, metadata.

Session behaviour:

- Checkpoint on entry.
- Undo/Redo transactions while editing.
- Save/Discard on exit.
- Test uses the current working session state without requiring a premature permanent save, similar to the current useful behaviour where Puzzle Test can exercise what is on screen.

Template/instance semantics should become clearer and closer to prefab overrides:

- A **Puzzle Template** is reusable library content.
- A **Scene Puzzle** is an instance.
- Instance edits can remain local/unique.
- If linked-template workflows are retained, expose explicit actions such as `Apply to Template`, `Revert to Template`, or `Make Unique` rather than making `Set Start` / `Save Unique` carry too many meanings.
- Never apply a scene-instance change to every linked puzzle implicitly.

Tasks:

- [x] Begin Puzzle Editor v2 with the shared drawer/list/inspector navigation pattern. *(v1.0.123 Stage 2A; persistence/Undo not yet migrated.)*
- [x] Separate scene-instance operations from internal puzzle editing.
- [x] Convert exclusion, respawn and cart path into sub-tools inside Puzzle Edit rather than independent editor modes.
- [x] Complete authoritative Contents list and selected-child Inspector for puzzle-owned asset/node child types. *(v1.0.131)*
- [x] Replace persistence wording/actions with explicit Linked Template vs Unique Copy semantics, including Revert / Make Unique / Apply as Template + Start. *(v1.0.131)*
- [x] Preserve fast current-state Test workflow in the Puzzle drawer. *(v1.0.123; edit-session checkpoint still pending.)*
- [x] Reuse central Undo/Redo and Save/Discard. *(v1.0.125 onward)*

### 5. Terrain / Sections — SUPERSEDED BY v1.0.136 TERRAIN EDIT PLAN ABOVE

**Historical note:** the newer staged Terrain Edit feature at the top of this file is authoritative.

Terrain Sections currently live as a standalone panel reachable beside other game/debug settings. Conceptually this is a specialist authoring mode, closer to Unreal Landscape Mode than to a generic settings popup.

Recommended direction:

- Enter **Terrain Edit** from the main Edit workspace.
- The world remains visible; authored objects are non-pickable unless a terrain tool explicitly needs them.
- Section list/navigation and selected-section Details live in one workspace.
- Height, linked subsequent sections, depth-layer modes, river parameters and procedural reset are properties/sub-tools of the selected section.
- Terrain drags/sliders participate in central Undo transactions.
- Consider a session-level Discard only if terrain editing proves risky enough; Undo may be sufficient for routine section editing once history is reliable.

Tasks:

- [ ] Move Sections conceptually under Edit rather than treating it as an unrelated stage popup.
- [ ] Define Terrain as an explicit editor context.
- [ ] Make selected section the central selection object with context-sensitive Details.
- [ ] Route terrain height/type/layer/reset edits through shared history.
- [ ] Keep World Lab as macro overview; avoid duplicating low-level terrain editing in both tools.

### 6. Global World / Look settings — MEDIUM priority cleanup

Camera defaults, Fog and Post are global scene/look settings, not object editing modes. Unreal's World Settings pattern is a useful conceptual reference.

Recommended consolidation:

```text
WORLD / LOOK
Camera
Fog
Post
Audio (or keep Sound separate as player-facing)
```

This does **not** mean one enormous panel. On phone, `World / Look` can be a short category menu that drills into Camera/Fog/Post using the same panel shell.

Tasks:

- [ ] Consolidate Camera/Fog/Post navigation under a coherent World/Look settings category.
- [ ] Keep Camera Nodes as authored objects separate from global camera defaults.
- [ ] Preserve fast access where it materially helps iteration.

### 7. Debug / Diagnostics workspace — MEDIUM priority, pairs with Performance work

Depth view, collision view, future Performance metrics, streaming state and diagnostic counts belong together conceptually.

Suggested Debug workspace:

- View modes: Normal / Depth.
- Collision overlay.
- Performance panel/capture.
- Streaming active-window visualisation later.
- Current section / biome / active authored units.
- Developer quick navigation.

Player-facing Hints should not be treated as a rendering diagnostic even if it remains reachable from the same top-level menu for convenience.

Tasks:

- [ ] Create one Debug/Diagnostics category instead of accumulating independent top-level debug toggles.
- [ ] Put the planned Performance diagnostic tool here.
- [ ] Add streaming visualisation here when authored-content streaming exists.
- [ ] Consider moving developer `Go to` navigation here while keeping editing focus actions inside each authored context.

### 8. World Lab workflow — MEDIUM priority refinement

World Lab already has several good architectural traits:

- Timeline as the primary world overview.
- A single selected item.
- A context-sensitive Selection panel.
- Direct Play From Here.

Keep that overall shape.

Improvements:

- Selection should remain inspection/macro placement; detailed group/puzzle internals should open the appropriate Play editor context rather than being reimplemented in World Lab.
- Add a true World Settings/Streaming panel for global authored-content streaming policy.
- Unify Undo semantics with the central transaction model. The current 30-snapshot local stack is useful but should not remain a separate mental model, and every edit path must participate consistently.
- Add Redo once shared history exists.
- Keep biome/profile management as a dedicated library/details flow rather than allowing it to crowd the timeline selection panel.

Tasks:

- [ ] Preserve timeline -> Selection panel architecture as the World Lab baseline.
- [ ] Add explicit `Edit in Game` handoff for World Groups/Puzzles where appropriate.
- [ ] Move global streaming policy into a World Lab settings panel.
- [ ] Replace/bridge the local history stack with shared transaction semantics and add Redo.
- [ ] Audit all World Lab mutations for Undo coverage before expanding features.

### 9. Asset Lab workflow — MEDIUM priority

Asset Lab is already close to a specialised asset editor: Library, viewport and asset-specific controls. The main missing safety is transactional editing of **reusable defaults**.

Recommended direction:

- Treat selecting an asset as opening its **Asset Definition**.
- Organise controls into clear components/categories: Visual, Collision, Placement Behaviours, Climb Paths, Sockets, Mechanism, States.
- Add per-asset Undo/Redo.
- Consider an edit-session snapshot with Save/Discard, especially for collision/mechanism/state changes that affect every placed instance.
- Clearly surface that changes affect Asset Defaults globally.
- Use the same Instance Override language in Play so the relationship is obvious.

Tasks:

- [ ] Add Asset Lab Undo/Redo using the shared transaction conventions.
- [ ] Evaluate Save/Discard per selected asset rather than unconditional immediate persistence for all changes.
- [ ] Reorganise controls into collapsible asset-component categories.
- [ ] Formalise Asset Defaults / State Defaults / Instance Overrides terminology.

### 10. Thought Nodes / Camera Nodes — LOW architectural risk, integrate rather than rewrite

The existing focused editor replacement is already a good phone-first pattern.

Tasks:

- [~] Thought/Camera Nodes are normal owned children in World Group and Puzzle lists; general Environment Outliner integration remains for Stage 3.
- [~] World Group/Puzzle contexts now enter focused node Details through their selected-child workflow; general Environment integration remains.
- [x] Include node edits in shared Undo and owner-session Save/Discard for World Group and Puzzle Edit.

### 11. Design Lab — KEEP current direction

Design Lab already demonstrates the desired high-level safety pattern: explicit Edit, snapshot, Done, Cancel restores the snapshot. Do not rewrite this simply for consistency.

Possible later polish:

- [ ] Add Undo/Redo inside a long document-edit session if needed.
- [ ] Reuse common Save/Discard wording/styling if a shared editor shell emerges.

### 12. Walk Lab — LOWER priority specialist cleanup

Walk Lab is a specialist animation authoring tool and should remain separate. Its highest-value workflow improvements are not a full shell rewrite but history and clearer tool grouping.

Tasks:

- [x] Add frame/joint Undo/Redo. *(superseded/completed by Anim Lab bounded history)*
- [x] Group viewport overlays separately from editing operations. *(superseded/completed by Anim Lab View / Motion Reference / Ground Motion separation)*
- [x] Keep Clip selection (Walk/Run/Jump) as the primary context and selected joint/frame as the local selection. *(Anim Lab Character → Clip → Mode hierarchy)*
- [x] Consider Save/Discard only for larger rig/collider sessions if accidental global edits become a real problem. *(Anim Lab now uses Save/Discard across bounded Rig and Animate contexts)*

---

## Shared authoring transaction / Undo architecture — revised direction

The earlier Undo assessment remains valid, but the editor audit clarifies the required abstraction.

Recommended service responsibilities:

- Central bounded Undo and Redo stacks for the active editor page.
- `beginTransaction(label, owner)` captures the minimum relevant persistent state.
- Live interaction modifies the working model.
- `commitTransaction()` records one before/after entry only if state changed.
- `cancelTransaction()` restores the before state for an aborted interaction.
- Pointer-down begins a drag transaction; pointer-up commits it.
- Button actions such as Delete/Duplicate/Add Exclusion use one immediate transaction.
- Sliders can either commit on pointer-up/change or collapse a continuous adjustment into one transaction.
- Each history entry knows what persistence/render refresh hooks must run after Undo/Redo.
- The service must not snapshot large WebGL/runtime collections; capture persistent authoring models or the smallest owned rows/records.
- Memory must remain bounded and measured on iPhone Safari.

Important distinction:

- **Undo/Redo** operates on individual authoring actions.
- **Save/Discard session** operates on the entire bounded Group/Puzzle/Asset editing session.

Unity's current Undo design is a useful reference because it groups actions around user interaction boundaries and records only changed object/property state; Unreal likewise uses named transactions representing a set of undoable changes. SideScroll does not need their implementation complexity, only the same transaction semantics.

### Shared Undo implementation tasks

- [x] Define the first common history entry shape and owner refresh hooks. *(World Group integration)*
- [x] Implement begin/commit/cancel transaction API.
- [~] Bounded Undo + Redo stacks are implemented for active editor sessions; memory accounting/debug instrumentation remains pending.
- [ ] Integrate pointer drag lifecycle once centrally rather than separately per tool.
- [x] First production integration: World Group Editor v2.
- [x] Second integration: Puzzle Editor v2. *(v1.0.123–v1.0.131)*
- [ ] Then migrate standalone Environment transforms, Terrain, World Lab and Asset Lab.

---

## Recommended editor architecture implementation order

### Phase A — foundation + unified drawer + World Groups

- [x] Add central editor context/session foundation with minimal disruption to existing runtime. *(World Group is first owner; broader generic routing remains.)*
- [ ] Build the reusable persistent Editor Drawer: expanded/collapsed rail states, route stack, fixed header/footer and safe touch scrolling.
- [x] Keep global `Menu` fixed and establish consistent Enter / Back / Save-Discard / Done Editing navigation semantics for the first migrated workflow.
- [x] Add shared transaction Undo/Redo core. *(World Group first consumer)*
- [x] Build World Group Editor v2 Contents/Exclusions/Group workspace inside the drawer.
- [x] Add Save/Discard and outside-context picking lock.
- [x] Remove old exclusion previous/next workflow and direct normal-panel group-internal mutation controls.

**Success test:** it should be difficult to damage a World Group accidentally, and it should always be obvious where editor navigation lives. Every internal change happens inside an obvious group-edit session, every child/zone is discoverable in a list, Undo or Discard can recover mistakes, and collapsing the drawer gives viewport room without leaving the active mode.

### Phase B — Puzzle Editor v2

- [x] Reuse the proven Group shell/list/inspector/session machinery. *(v1.0.123 workspace; v1.0.125 session/history)*
- [x] Make puzzle exclusion/respawn/cart path sub-tools of Puzzle Edit. *(detailed cart controls migrated in v1.0.131)**
- [x] Clarify Puzzle Template vs Scene Instance vs Unique/Override semantics. *(v1.0.131 explicit Revert / Make Unique / Apply-as-Template UX)**
- [x] Keep Test tightly integrated. *(Test remains disposable and returns to the active session)*

### Phase C — general Environment editor

- [ ] Introduce unified scene hierarchy/list grammar for groups, standalone objects and nodes.
- [ ] Introduce context-sensitive instance Inspector.
- [ ] Formalise Asset Default vs Instance Override behaviour.
- [ ] Move direct manipulation tools under the selected entity rather than a growing global button bar.

### Phase D — Terrain / World Settings / Debug

- [ ] Terrain becomes a specialist Edit context.
- [ ] Camera/Fog/Post become coherent World/Look settings.
- [ ] Debug/Performance/Streaming visualisation become one Diagnostics workspace.

### Phase E — cross-tool consistency

- [ ] Migrate World Lab history to shared transaction conventions.
- [ ] Add Asset Lab history/session safety.
- [ ] Add Walk Lab history where valuable.
- [ ] Keep Design Lab's existing snapshot/Cancel behaviour unless a concrete problem appears.


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
- [ ] Continue checking selection/tap cycling in dense authored scenes; long-term make hierarchy/list selection authoritative so tap cycling is only a fallback.
- [ ] Keep legacy editor menus mutually exclusive while the new central editor-context/navigation model is introduced.
- [ ] Replace jumping/independent editor panels progressively with the unified persistent swipe-drawer shell; do not add new one-off panel positions meanwhile.

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

See **Shared authoring transaction / Undo architecture — revised direction** above. The central requirement is unchanged: one bounded transaction service, one pointer drag = one history action, persistent authoring state rather than runtime/WebGL collections, and measured memory limits suitable for iPhone Safari.

## Streaming / performance

- [x] Remove the v1.0.117 Stage 1 performance regression: no live backdrop blur on the full-height Editor Drawer; exclusion normalisation moved out of the per-object draw hot path; World Group exclusion bounds reused per frame. (v1.0.119)
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
- [x] Proper Undo coverage for Puzzle Edit through the shared history architecture. *(v1.0.125–v1.0.131 audit; on-device QA pending)*
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

---

## Additional cross-cutting engine foundations — October 2026 final audit

**Status:** architectural considerations approved for the backlog/audit. These do not all need to be implemented before World Group Editor v2, but the high-priority boundaries should be defined while the shared editor foundation is being built so later systems do not create new incompatible state models.

The editor audit identified several concerns that sit *under* Groups, Puzzles, Terrain and the unified drawer. Mature engines generally centralise these concerns rather than letting each tool invent its own behaviour. SideScroll should adopt the principles without attempting to reproduce desktop-engine complexity.

### 1. Authored state vs runtime/test state vs editor-only state — HIGH priority

SideScroll should explicitly distinguish three kinds of state:

**Authored persistent state**

- World placement and transforms.
- World Group membership, exclusions and authored child settings.
- Puzzle definitions/instances and explicit authored start state.
- Terrain/section values.
- Thought/Camera Node authored settings.
- Asset instance overrides and other values intentionally saved into the project.

**Runtime/test state**

- Current player position/inventory.
- Puzzle progress after play begins.
- Collected/moved gameplay objects.
- Triggered Thought Nodes.
- Respawn/runtime checkpoint state.
- Cart/bridge/socket/log state produced by gameplay.
- Temporary streamed-in/out runtime objects.

**Editor-only state**

- Current selection.
- Active editor context/tool.
- Drawer route/collapse state and scroll positions.
- Viewport pan/zoom used only for authoring.
- Hover/highlight/debug visual state.
- Active edit-session checkpoint and Undo bookkeeping.

The current engine sometimes edits and plays the same object model directly. As Puzzle systems become more stateful this boundary becomes increasingly important.

Recommended rule:

- Entering a Test/Play-from-here session should establish a clean runtime state derived from authored data.
- Gameplay mutations must not silently become authored changes.
- Stopping Test should restore the authored state exactly unless the user invokes an explicit future `Keep Test Changes`/`Capture as Start State` action.
- `Set Start` is an authoring command and should copy an intentional subset of runtime/current state into the authored puzzle start state; it should not make arbitrary runtime state persistent.
- Undo history for authoring should not be polluted by ordinary gameplay events.

A full duplicate WebGL world is not required. A lightweight authored-state snapshot/runtime overlay may be sufficient, but the ownership boundary must be explicit.

### 2. Save/commit semantics, durable persistence and crash recovery — HIGH priority

The new editor introduces `Save`, `Discard`, Undo and transactional edit sessions, so SideScroll needs precise meanings for each layer of persistence.

Recommended separation:

- **Transaction commit** — one authoring action becomes part of Undo history.
- **Edit-session Save** — working changes become the committed authored scene state and the edit context closes/clears its session checkpoint.
- **Discard** — restore the edit-session checkpoint.
- **Durable project persistence** — serialize the committed authored state to browser storage/project data.

Do not let individual controls call persistent storage independently after the shared transaction system exists. Route durable saves through one project persistence service.

Phone/PWA resilience requirements:

- Persist committed authoring changes at safe transaction/session boundaries, not every pointer-move frame.
- On `visibilitychange`/app suspension, flush already committed state where practical because iOS may terminate the PWA without a normal unload sequence.
- During a dirty Group/Puzzle/etc. edit session, consider maintaining a **separate recovery draft** rather than overwriting the committed project. After an unexpected reload, offer `Recover unsaved edit` or discard the draft.
- Keep a small rolling set of last-known-good project snapshots before risky schema migrations or large destructive operations.
- Retain explicit JSON/project export as a human-controlled backup path.
- Assess IndexedDB later if project size/reliability outgrows the current storage approach; do not migrate storage merely for architectural neatness.

### 3. Stable entity identity, ownership and references — HIGH priority

Undo, lists/Outliner selection, streaming, duplication, templates and validation all depend on stable identity.

Every authored entity that can be independently selected/referenced should have a stable editor ID where practical, including:

- World Groups and members.
- Standalone authored objects.
- Group exclusions.
- Thought Nodes and Camera Nodes.
- Puzzle instances and persistent puzzle-owned children/zones/paths.
- Other future authored nodes that can be referenced by another system.

Ownership should be explicit rather than inferred only from which array currently contains an item. Conceptually an entity belongs to one of:

- World/root.
- World Group `<id>`.
- Puzzle `<id>`.
- Asset/template definition where relevant.

Rules:

- Duplication creates new entity IDs and remaps internal references to the new IDs.
- Detach changes ownership without changing identity unless there is a concrete reason to do so.
- Delete checks/removes dependent references transactionally and remains recoverable through Undo.
- Streaming may create/destroy runtime render objects, but authored identity remains stable while unloaded.
- Load/migration code validates IDs and repairs legacy records deliberately rather than UI accessors silently rebuilding identity-bearing arrays.

This does **not** require rewriting the whole project into one giant scene graph immediately. Introduce stable identity/ownership incrementally at the persistence-model boundary used by new editor work.

### 4. Reusable Inspector/property controls — MEDIUM/HIGH priority

Once Hierarchy/List -> Selection -> Inspector becomes the common workflow, avoid rebuilding every Details page from unrelated handcrafted DOM controls.

Create a small reusable set of phone-first property components/patterns for:

- Number + slider pairs with units and sensible ranges.
- Toggle.
- Enum/segmented selection.
- Text/name field.
- Read-only status/ID/type rows where useful.
- Reset/Revert-to-default/override indication.
- Dangerous actions separated from ordinary properties.

Properties should route mutations through the central transaction/session API rather than each UI control persisting data directly.

This is intentionally a lightweight SideScroll Inspector framework, not a reflection/component system. Its purpose is consistent behaviour, touch sizing, Undo integration and future Asset Default vs Instance Override visuals.

### 5. Central touch/input and viewport-manipulation policy — HIGH usability priority

The unified drawer solves only one part of mobile interaction. The viewport itself also needs one consistent gesture ownership policy so new tools do not reintroduce conflicting pointer logic.

Define centrally:

- Drawer drag vs drawer vertical scroll.
- Viewport camera pan.
- Pinch zoom where enabled.
- Tap/select vs drag threshold.
- Object/group relative transform dragging.
- Specialist handles such as collision points, exclusion corners, terrain controls and path nodes.
- Gameplay controls when testing/playing.

Rules:

- One active pointer owner after gesture intent has been resolved.
- Pointer capture should prevent gestures leaking into another tool/world object.
- Screen-space transform sensitivity should be predictable across authored asset/group tools.
- Handles/dots should remain a usable screen size as camera scale changes.
- Selected object highlighting should clearly show what will move/edit before the drag begins.
- Add `Frame/Focus Selected` where useful so list selection can reliably bring an off-screen item into view.
- Tap cycling remains a fallback for overlapping viewport objects; authoritative list selection is the reliable path.
- Multi-selection is a future option, not a requirement for the current architecture.

### 6. Project validation / Problems workflow — MEDIUM priority

As editor complexity increases, silent malformed data will become harder to diagnose than rendering bugs. Add a lightweight validation layer and eventually expose it under `Diagnostics > Problems`.

Potential checks:

- Duplicate/missing entity IDs.
- Orphaned group/puzzle ownership.
- Dangling Thought/Camera/Puzzle references.
- Missing asset definitions/textures.
- Non-finite/invalid transforms or exclusion extents.
- Invalid puzzle socket/host/path references.
- Broken authored streaming bounds.
- Legacy schema records that failed migration.
- Impossible collision/control data where deterministic checks are available.

A Problem row should identify the entity and, when possible, offer `Select`/`Go to` rather than only logging text.

Validation should run after project load/migration and may also run on demand. Keep it separate from the Performance profiler: `Problems` explains invalid authoring data; `Performance` explains runtime cost/stalls.

### 7. Template / instance semantics must be explicit — MEDIUM priority

Do not accidentally drift into half-linked prefab behaviour.

For each reusable system, explicitly decide whether placement creates:

- an **independent stamped copy**, or
- a **linked instance** with a source definition and instance overrides.

Current `Duplicate Group` is intentionally independent. If World Group Templates also remain simple stamped copies, label/document them that way and avoid showing Apply/Revert controls that imply a live link.

Puzzle templates may eventually benefit more from linked Template/Instance semantics. If linked instances are introduced, expose source/override state deliberately and support explicit Apply/Revert rather than silently propagating edits.

### 8. Schema/version migration and release compatibility — HIGH engineering priority

Editor architecture changes will add IDs, ownership metadata, session-safe puzzle data and potentially revised serialization shapes. Treat project data migration as a first-class release concern.

- Store a project/schema version separately from the app release version.
- Migrations should be explicit, deterministic and one-way per schema step.
- Take a recovery/backup snapshot before destructive migrations where practical.
- Never make ordinary read/accessor functions repeatedly mutate data merely to normalise it.
- Validate after migration.
- Regression-test old representative projects when changing group/puzzle/terrain serialization.
- Keep duplicate/template/export/import code using the same canonical serialization rules rather than parallel ad-hoc copies.

### What not to add yet

Do **not** expand this redesign into desktop-engine features SideScroll does not currently need. In particular, defer nested prefabs/groups, arbitrary docking layouts, a general component/entity framework, node-graph authoring, heavy multi-selection tooling, a command palette, and live collaborative editing. The goal is a coherent small engine, not a miniature Unreal Editor.

### Impact on implementation order

Phase A remains **shared editor foundation + unified drawer + World Group Editor v2**, but the following should be designed into that foundation from the start:

- explicit authored/editor state ownership;
- stable IDs/ownership for newly touched group entities;
- one central mutation/transaction path;
- one central durable persistence hook rather than tool-specific saves;
- shared touch/gesture ownership;
- schema migration hooks for new stored fields.

The full Test/runtime-state separation, Problems UI and richer recovery workflow can follow after Group Editor v2, but the new architecture should not make them harder to add.


## Content / character / concept art backlog additions — October 2026

### Fox companion playable character pipeline — HIGH priority

**v1.0.141 first playable pass:** B2 / Ember Reed is now implemented as a separate quadruped rig family rather than being forced through the humanoid Walk Lab skeleton. It is intentionally an in-game test character first; proportions, cut boundaries and clips should be judged at gameplay scale before a final art/atlas refinement pass.

- [x] Generate a usable **side-on fox reference image** from the shortlisted B2 direction, with native alpha and the tail held above foot level.
- [x] Build a dedicated fox rig matched to that image: torso + head/neck + three-piece tail + two-bone chains for all four legs.
- [x] Cut the exact reference artwork into rig parts and apply the pieces to independent planes/meshes.
- [x] Assemble a first-pass fox atlas from those source-image cuts, with an authored joint guide/map retained for later tuning.
- [ ] After gameplay review, decide whether to pass the cut atlas back through image generation for a cleaner purpose-built puppet atlas. Do not refine blindly before seeing the current cutout at game scale.
- [ ] Complete on-device pivot/seam/scale validation and tune any joints that visibly separate or distort in motion.
- [x] Create first-pass fox **walk, run and jump** clips with independent leg cycles plus body/head/tail secondary motion. Further animation tuning remains expected after phone testing.
- [x] Add Fox to the normal playable character swap cycle with its own smaller collider and approximately half-height visual target. Validate the complete swap/reload flow on-device.
- [ ] Add a dedicated fox climbing clip only if the current first-pass run/scramble treatment looks inadequate during real climb gameplay.
- [ ] Decide companion-specific interaction rules later (for example whether the fox should be allowed to carry/push human-scale puzzle props when used as a playable test character).

### Woodland artefact concept exploration — HIGH priority

- [ ] Generate a **series of woodland artefact concepts** rather than committing to the first design.
- [ ] Explore several balances of forest/natural growth and visible technical structure.
- [ ] Target a visual language that feels woodland, ancient/mythical, magical/mysterious and technologically purposeful without becoming clean generic sci-fi.
- [ ] Favour designs where the forest and mechanism appear to have grown/fused together over time rather than a machine merely placed in a forest.
- [ ] Review the concept set, shortlist the strongest direction(s), then refine the preferred artefact family toward game-ready production assets.

### Market stall asset processing — MEDIUM priority

- [ ] Locate the previously generated **market stall source images** in accessible project/work storage.
- [ ] Review the variants and identify which are production-ready for the settlement.
- [ ] Process approved stalls through the normal SideScroll asset/background/alpha workflow.
- [ ] Add the finished market stalls to the settlement asset library for in-game placement/testing.
- [ ] If the original sources cannot be recovered or are not production-ready, explicitly schedule regeneration/refinement rather than silently dropping the set.

### v1.0.149 Anim Lab corrective pass
- [x] Harden Anim Lab `[hidden]` handling so Setup controls cannot remain visible in Animate mode.
- [x] Confirm Scale is edited only inside the Setup transaction/checkpoint context and therefore enables Save when changed.

### v1.0.150 Anim Lab Motion Reference — inserted before Stage 4
- [x] Add a reusable editor-only Motion Reference underlay to Anim Lab.
- [x] Install a lean quadruped starter pack with Walk (35 frames / 10 selected poses) and Run/Gallop (15 frames / 8 selected poses) only.
- [x] Reuse the same full-cycle PNGs for selected-pose mode; do not ship duplicate key-pose images/atlases/sheets.
- [x] Link reference playback by normalised cycle phase and support saved phase offset.
- [x] Add Show, source mode, opacity, scale, X/Y, lock, play/pause, previous/next and cycle scrub controls.
- [x] Save reference/alignment settings per character + clip without changing gameplay rendering or authored Fox clips.
- [x] Keep large reference PNGs out of install-time service-worker CORE_SHELL; cache them on demand.
- [x] Make reference packs rig-family-aware so a future biped Walk/Run pack can use the same system.
- [ ] On-device: align Fox Walk to the reference and review leg phasing / body rise-fall before beginning Stage 4 paw-contact IK.
- [ ] Later: build a small biped reference pack (initially Walk + Run) and register it for the human rig family.


## v1.0.151 — Anim Lab Rig Designer v1

Implemented before Stage 4 after Motion Reference exposed structural Fox issues.

- [x] Promote Fox rest proportions from baked constants into persisted rig-family character-definition data.
- [x] Preserve v1.0.150 Fox geometry exactly at the new default rig so installation alone does not reshape the character.
- [x] Add Rear Body -> Mid Root -> Front Body -> Neck -> Head structural spine.
- [x] Add explicit Front/Rear Near/Far Socket -> Knee/Hock -> Paw rest joints.
- [x] Preserve and expose the tail rest chain.
- [x] Add descriptor-driven Rig Designer UI with large joint controls and direct viewport joint dragging.
- [x] Add live joint coordinates / connected bone-length readouts.
- [x] Add Free/X/Y, Fine, per-joint reset, paired copy, Near/Far symmetry, Paws to Ground and Reset Rig.
- [x] Keep all rig manipulation inside Anim Lab Undo/Redo/Save/Discard transactions.
- [x] Keep unsaved rest-rig preview inside Anim Lab; Play reads only the last saved rig.
- [x] Keep Motion Reference usable in Rig mode with independent reference playback.
- [x] Add independent Front Body and Rear Body lift channels to the Fox Animate control board while retaining Mid Root and whole-body pitch.
- [x] Route direct Play and seamless Home -> Play through the v1.0.151 Fox rig code.
- [x] Add new rig editor script to the service-worker core shell and bump shell cache revision.
- [x] Keep current Fox clips, reference images and production artwork unchanged.

On-device acceptance still required:

- [ ] Joint viewport hit areas and precision pad feel comfortable on iPhone landscape.
- [ ] One joint drag = one Undo step; pointer-cancel restores cleanly.
- [ ] Rig-only edit immediately enables Save and persists after reopen.
- [ ] Discard restores the previous saved rig exactly.
- [ ] Saved sockets/limb lengths visibly affect Fox in direct Play and seamless Home -> Play.
- [ ] Motion Reference remains useful while constructing the rest rig.
- [ ] Existing one-piece torso limitation is understood/acceptable until the art-refit pass.
- [ ] A2HS/offline relaunch receives `anim-lab-rig.js` after service-worker upgrade.

Next after approval:

- [ ] Use Walk reference to establish/approve Fox rest proportions with Rig Designer.
- [ ] Refit/split Fox artwork over the approved rest rig where the body requires true spine articulation.
- [ ] Then proceed to Stage 4 planted-paw/contact FK/IK tooling against the approved structure.
- [ ] Later add a biped Rig Designer descriptor/reference pack through the same shared systems rather than creating a parallel editor.

## v1.0.152 — Anim Lab workflow/UI consolidation + Fox runtime clips

Follow-up to Rig Designer v1. This pass improves the phone animation workflow before Stage 4 rather than adding IK.

- [x] Move the authoritative 16-sample character playback/scrub timeline directly below the viewport.
- [x] Move the Key Pose lane beneath the main timeline and keep frame/key selection locked to the same 0-15 sample positions.
- [x] Clarify Motion Reference transport ownership: linked reference follows the main timeline; independent Reference Cycle/Play is shown only while Unlinked (or in Rig mode where animation link is unavailable).
- [x] Move the large relative precision `Drag anywhere` surface to the bottom-right of the viewport for left-thumb selection / right-thumb posing.
- [x] Add reusable collapsible Anim Lab inspector sections with remembered editor-only collapse state.
- [x] Add the collapsible-section interaction rule to the Engine/UX Bible for progressive adoption by other editor panels.
- [x] Enable deliberate Fox Anim Lab clip runtime integration: Play loads the last explicitly saved 16-sample Fox Walk/Run/Jump bank.
- [x] Keep safe per-clip fallback to built-in Fox defaults when no valid saved Anim Lab clip exists.
- [ ] iPhone: confirm timeline + key lane remain comfortable at landscape height and no important viewport space is lost.
- [ ] iPhone: select bones/control rows with left thumb and manipulate the viewport pad with right thumb without accidental pan/pinch.
- [ ] iPhone: collapse/reopen every Anim Lab section; confirm scroll burden is reduced and no state/Undo/dirty data changes.
- [ ] iPhone: save a deliberately obvious temporary Fox Walk edit, launch Play, confirm the saved clip is visible in-game, then restore/Save the desired animation.
- [ ] After the above workflow pass is approved, proceed to Stage 4 planted-paw/contact FK/IK tools.



## v1.0.153 — Anim Lab Stage 4 paw-contact FK/IK v1

Bounded Stage 4 implementation. This adds useful quadruped contact authoring without turning Anim Lab into a general-purpose constraint/curve package.

- [x] Add four Fox paw IK target channels with **zero default weight**, so installation or loading old clips cannot alter existing motion.
- [x] Add Front Near / Front Far / Rear Near / Rear Far **Paw IK Target** controls to the existing Control Board and reuse the viewport right-thumb precision pad.
- [x] Add a two-bone quadruped solver that keeps authored upper/lower bone lengths and chooses the knee/hock solution nearest the FK pose to avoid unexpected limb flips.
- [x] Add **Capture FK → IK** so switching a paw to 100% IK can begin with no visual pop.
- [x] Add per-key **FK / IK blend**, **Plant from Here**, **Release Here** and **Target to Ground** authoring tools.
- [x] Keep the sparse-key authored ground anchor separate from the phase-resolved local IK target so creating/editing a key during stance cannot double-apply root/ground motion.
- [x] While a planted sparse key owns the interval, counter the expected gameplay stride so the paw target moves backwards in rig-local space as the body advances through the cycle.
- [x] Compile the resolved IK targets back into the existing 16-sample Fox runtime bank; Play continues to consume one normal Fox clip bank and the runtime solver interpolates those resolved targets continuously.
- [x] Extend Fox near/far mirror and clip phase tools to carry IK/contact metadata safely; disable 8-key reduction while contact data exists rather than flattening plant ownership accidentally.
- [x] Add an editor-only **Ground Motion** datum with repeated marks, normalised timeline motion, current gameplay stride at ×1, and a temporary 0.5–1.5× display-speed diagnostic.
- [x] Keep Ground Motion visibility/speed as editor preference only; it must not dirty animation data or affect gameplay.
- [x] Add Stage 4 script to the offline shell and bump the service-worker cache.

On-device acceptance required:

- [ ] Select each Paw IK Target with the left thumb and move it using the viewport pad with the right thumb; confirm the limb does not flip unexpectedly near normal reachable poses.
- [x] **Superseded by v1.0.156:** first Paw Target drag/capture activates persistent IK automatically; no author-facing blend switch remains.
- [x] **Superseded by v1.0.156:** stance is now one continuous Paw Target trajectory against Ground Motion; there is no Plant/Release state to author.
- [ ] v1.0.156 on-device: move Front Body / Rear Body / Mid Root while a reachable Paw Target is held; confirm the paw stays at the target and the limb solves underneath it.
- [x] **Superseded by v1.0.156:** ordinary Fox locomotion no longer exposes a per-key FK/IK blend. Test Paw Target Undo/Redo, Discard and Save/reload instead.
- [ ] Save a deliberately obvious IK/contact Walk, enter Play as Fox and confirm the same planted-contact behaviour is visible in gameplay.
- [ ] v1.0.156 on-device: verify near/far Mirror Key / Mirror Clip and phase-shift tools remain predictable with persistent Paw Target trajectories.
- [ ] Confirm Ground Motion speed/visibility changes never enable Save or alter Undo history.
- [ ] A2HS/offline relaunch receives `anim-lab-stage4.js` after the service-worker upgrade.

After Stage 4 review:

- [ ] Finish/approve Fox rest proportions against Motion Reference before treating contact tuning as final.
- [ ] Refit/split torso/limb artwork where the approved articulated rig exposes real cut/overlap limits.
- [ ] Use the contact system to refine body rise/fall and weight transfer, then head/ears/tail secondary motion.
- [ ] Refine Run/Gallop with the reference pack and the same contact tools.
- [ ] Build the later biped Motion Reference / Rig Designer descriptor through the shared systems rather than a parallel editor.
- [ ] Add a dedicated fox climbing clip only if real gameplay review shows the current run/scramble treatment is inadequate.

## v1.0.154 — Fox example Walk / Stage 4 teaching pass

This pass deliberately replaces the previous experimental Fox Walk with a complete readable example so the Stage 4 workflow can be learned by inspection rather than from empty controls. Run/Jump are not reset.

- [x] Author an eight-key Fox Walk example on frames 1/3/5/7/9/11/13/15.
- [x] Use a four-beat Rear Near -> Front Near -> Rear Far -> Front Far walking order.
- [x] Historical v1.0.154 teaching model; **superseded in v1.0.156** by persistent Paw Targets for both stance and swing.
- [x] Historical v1.0.154 contact model; **superseded in v1.0.156** by directly authored backwards Paw Target motion against Ground Motion.
- [x] Add visible Mid Root bob, independent Front/Rear Body lift, subtle Whole Body Tilt, Head/Neck counter-motion and three-part tail follow-through.
- [x] Regenerate the example against the currently saved Fox rest rig and Fox Scale rather than assuming only the legacy proportions.
- [x] Add **Reload Example Walk** as one normal Undoable Anim Lab transaction inside Save/Discard ownership.
- [x] Intentionally ignore pre-v1.0.154 saved Fox Walk banks that lack the new walk-foundation marker; preserve saved Run/Jump independently.
- [x] Make Play use the regenerated example as the built-in Walk fallback until a v1.0.154-derived Walk is explicitly saved.
- [x] Keep the runtime contract at 16 compiled samples; no new gameplay animation format.

On-device review:

- [ ] Watch the complete example in Anim Lab with Art + Bones + Ground Motion and judge overall gait readability at iPhone landscape size.
- [ ] Confirm stance Paw Targets track the ×1 moving-ground marks cleanly while swing targets move forwards/up without any IK mode switch.
- [x] **Superseded by v1.0.156:** the example no longer alternates IK/FK status; all four legs are persistent IK targets throughout the cycle.
- [ ] Judge whether body rise/fall, chest/pelvis transfer, head counter-motion and tail lag are too subtle, too strong or about right.
- [ ] Enter Play as Fox and confirm the example remains readable at real gameplay scale and locomotion speed.
- [ ] After changing/approving Fox Rig proportions, use Reload Example Walk and confirm the regenerated leg poses remain sensible before doing final polish.

After the example is understood/approved:

- [ ] Tune the Walk against the Motion Reference rather than adding more Anim Lab systems.
- [ ] Refit/split torso/limb artwork only where the approved rig motion exposes real overlap/cut limitations.
- [ ] Apply the same contact workflow to Run/Gallop after Walk is convincing.
- [ ] Continue with head/ears/tail polish and any dedicated climbing animation only where gameplay review demonstrates a need.


## v1.0.155 — Anim Lab IK bend-branch stability correction

v1.0.154 on-device testing found that Front Near, Front Far and Rear Far could snap between the two mathematically valid two-bone IK solutions. Rear Near happened to remain stable and therefore looked sensible.

- [x] Replace per-sample “nearest FK knee” IK branch choice with an explicit rig-family bend branch.
- [x] Store Fox quadruped bend ownership in the Rig Designer descriptor (front knees one branch; rear hocks the opposite branch).
- [x] Regenerate the example Walk so unstable v1.0.154 branch choices are not retained in FK swing keys.
- [x] Bump the example foundation marker so v1.0.154 saved teaching Walk data cannot silently override the correction.
- [x] Verify all four limbs retain one bend side across all 16 example Walk samples.
- [ ] On-device: confirm all four knees/hocks now solve smoothly during Walk playback and scrubbing.
- [ ] On-device: confirm corrected Walk in Play after Save.

## v1.0.156 — Anim Lab persistent Paw IK + Rig two-thumb UI simplification

On-device use of Stage 4 showed that the Plant/Release + FK/IK blend model added friction when the actual goal is straightforward reference matching: animate a paw trajectory, then move the body without taking that paw with it. This pass simplifies the authoring model rather than adding another system.

- [x] Remove Plant/Release and author-facing FK/IK blend from the normal Fox workflow.
- [x] Make **Paw Target** the primary visible control for each Fox leg; retain legacy upper/lower FK channels internally for compatibility rather than presenting them as the everyday locomotion controls.
- [x] Make moving a Paw Target automatically activate IK. When an older FK-only pose is first manipulated, capture its current endpoint before movement so activation does not pop.
- [x] Interpolate Paw Target X/Y directly through sparse keys; remove stride/contact ownership compensation from authoring and compiled-sample evaluation.
- [x] Rebuild the example Walk so all four legs use persistent IK through both stance and swing; stance travels backwards along the ground and swing travels forwards/up.
- [x] Bump the Walk foundation marker so the old mixed FK/IK teaching cycle cannot override the simplified example.
- [x] Keep the explicit stable bend branch introduced in v1.0.155.
- [x] Move the Rig Designer precision pad into the viewport bottom-right so Rig matches Animate: left-thumb selection, right-thumb manipulation.
- [x] Differentiate near/far limbs consistently in Anim Lab: near-side controls/bones use the stronger accent; far-side controls/bones/IK targets use lighter neutral grey.
- [x] Keep Ground Motion as the slip diagnostic; it remains preference-only and does not enter animation data/history.
- [x] Update Engine/UX Bible so persistent Paw IK and the shared two-thumb layout are the current rules, superseding the earlier Plant/Release model.

On-device acceptance:

- [ ] Fox → Walk: select each Paw Target from the left drawer and move it immediately with the bottom-right viewport pad; confirm no scrolling is needed between selection and manipulation.
- [ ] Rig mode: select sockets/knees/paws from the left drawer and use the same bottom-right viewport pad; confirm this feels equivalent to Animate.
- [ ] Confirm near and far limbs remain immediately distinguishable when bones overlap: near = stronger accent, far = lighter grey, active selection still obvious.
- [ ] With a Paw Target in a normal reachable position, alter Mid Root / Front Body / Rear Body and confirm the paw does not follow the torso.
- [ ] Scrub/play the rebuilt example Walk with Ground Motion ×1 and judge foot slip by matching the target/paw movement directly to the ground marks.
- [ ] Save the Walk, enter Play as Fox and confirm the same persistent-IK cycle is used in gameplay.
- [ ] Confirm Undo/Redo/Discard/Save work for Paw Target and Rig-joint drags, with one continuous drag producing one history step.


## v1.0.157 — Anim Lab anatomy, cadence + smooth playback correction

On-device reference matching in v1.0.156 exposed four remaining structural/editor issues: the neck only had a head-local pivot, the Fox limb chain was one joint short for quadruped anatomy, Fox preview cadence did not match distance-driven gameplay, and Anim Lab playback displayed only stepped 16-sample frames.

- [x] Split Fox neck animation into **Neck** and **Head** channels. Neck rotates the whole frontBody → neck → head chain; Head remains a local head pivot.
- [x] Extend each Fox leg from two to three articulated segments while preserving existing socket/knee/paw positions during rig migration.
- [x] Front legs now expose Socket → Elbow → Wrist → Paw; rear legs expose Socket → Knee → Hock → Paw in Rig Designer.
- [x] Keep Paw Target as the primary persistent IK position control. Add only one optional direct shape channel per limb: Wrist Angle on front legs / Hock Angle on rear legs.
- [x] Split the existing lower-leg atlas art non-destructively into proximal/distal masked pieces so the new wrist/hock joint can visibly bend without inventing replacement art.
- [x] Migrate saved v2 Fox rest rigs to v3 by deriving the new Wrist/Hock on the authored old lower-leg segment; do not move existing authored joints merely because the patch is installed.
- [x] Match Fox Anim Lab Walk/Run preview cadence to gameplay's distance-driven cycle: Walk ≈ 539 ms at 1.15 m/s over 0.62 m stride; Run ≈ 323 ms at 2.85 m/s over 0.92 m stride.
- [x] During Play in Anim Lab, render the continuous interpolated phase rather than visibly stepping only when the selected 1–16 sample changes.
- [x] Add a lightweight clip-wide **Smooth / Linear** tween choice. Fox clips default to Smooth; the runtime bank remains 16 samples and no graph editor is introduced.
- [ ] iPhone: confirm Neck can lower the whole head/neck silhouette to match the gait reference while Head can counter-rotate independently.
- [ ] iPhone: inspect all four new wrist/hock joints in Bones + Art and verify the split lower-leg artwork bends cleanly enough for this production pass.
- [ ] iPhone: compare Anim Lab Run directly with full-speed Fox Run in Play and confirm the cycle cadence now matches perceptually.
- [ ] iPhone: compare Smooth vs Linear on the same sparse Walk and verify Smooth removes the obvious key-to-key velocity corners without unwanted paw-ground overshoot.


### v1.0.158 Fox proportion reference / authoring handoff
- [x] Process the selected charcoal fox reference as a right-facing, alpha-trimmed single-image Rig reference without replacing production Fox art.
- [x] Add a Static Reference selector to Anim Lab for Hero 1, Hero 2 / Hair and the new Fox Shape image.
- [x] Add editor-only opacity / scale / X / Y alignment for the static reference; this must never dirty rig or animation data.
- [x] Default the Fox static-reference context to Fox Shape while preserving separate reference preferences per rig family.
- [x] Add a one-file Fox handoff export containing current scale/collider/rest rig plus sparse and compiled Walk/Run/Jump data.
- [x] On device: proportion the Fox rest rig to the new Fox Shape reference and Save it.
- [ ] On device: retune Walk/Run as needed against the new proportions and verify Play.
- [x] Export the resulting Fox handoff JSON; v1.0.159 promotes that exact rig/animation state into the built-in baseline before the later mesh-deformation art pass.
- [ ] After the rig is approved, prototype the proposed hybrid 2D deform setup: deformable body/head mesh, deformable shoulder/leg meshes, and separate deformable tail, before replacing current plane art.

## v1.0.159 — Fox Authoring Baseline stage marker

Purpose: stop extending Anim Lab long enough to promote the Fox the user has actually authored into a self-contained game/editor baseline that can be judged visually in motion.

- [x] Promote `SS-FOX-RIG-ANIM-1.0.158.json` as the built-in Fox authoring source rather than relying on one browser's localStorage.
- [x] Preserve the supplied scale 1.71, collider and v3 quadruped rest rig as the new default Fox setup.
- [x] Preserve the supplied sparse Walk / Run / Jump keys and compiled 16-sample banks without retuning them during promotion.
- [x] Add **Idle** as a first-class fourth Fox clip in Anim Lab/runtime architecture.
- [x] Keep first Idle deliberately static/rest-pose only; secondary breathing/head/ear/tail motion is later polish.
- [x] Add a baseline marker for Fox setup/rig/collider/clip storage so older test experiments cannot silently override the promoted v1.0.159 authoring state.
- [x] Replace the animated orange Fox skin with temporary charcoal cutout evaluation art built from the approved right-facing Fox Shape reference.
- [x] Reuse the visible near-side leg artwork for temporary far-side planes where necessary; this is evaluation art, not a final asset decomposition.
- [x] Keep the newly authored v3 rig authoritative; do not reshape the skeleton merely to make rigid cutout seams easier.
- [x] Make Fox Handoff share/export one JSON file only and include Idle / Walk / Run / Jump sparse + runtime data.
- [x] Bump service-worker/cache references for the new baseline script and charcoal atlas.
- [x] Document the end of the initial Fox Rig/Animation Authoring architecture stage.

On-device acceptance before approving this stage:

- [ ] Fox Rig opens at the promoted authored proportions and scale 1.71 after update/relaunch.
- [ ] Fox clip row shows Idle / Walk / Run / Jump; human characters remain Walk / Run / Jump.
- [ ] Idle stands correctly and does not disturb the saved rest rig.
- [ ] Walk / Run / Jump match the user's exported v1.0.158 authored motion.
- [ ] New charcoal cutout is usable enough to judge silhouette/proportions/motion in Anim Lab.
- [ ] New charcoal cutout is visible in Play and saved Fox clips match Anim Lab.
- [ ] Wrist/hock articulation still works with the new temporary art; record only genuinely blocking seam/attachment failures for this rigid-plane stage.
- [ ] Fox Handoff produces only `SS-FOX-RIG-ANIM-1.0.159.json` on iOS share/export.
- [ ] A2HS/offline relaunch receives the new baseline script and atlas after cache upgrade.

### v1.0.160 — Anim Lab Quick Play + Motion Fidelity

Goal: shorten the authoring loop and remove the two motion-review problems exposed by the v1.0.159 charcoal Fox: coarse-looking Smooth playback and ground speed that cannot be balanced independently from gait cadence.

Implemented in code:

- [x] Add a third Fox Anim Lab context: **Animate | Rig | Play**.
- [x] Keep Play inside the Anim Lab viewport; do not navigate out to the game page.
- [x] Hide authoring manipulation UI while Play is active and replace the bottom-right precision pad with a horizontal movement control plus Jump.
- [x] Test the **current working copy**, including unsaved sparse clip edits and unsaved Rig changes where applicable.
- [x] Return from Play without resetting the prior Animate/Rig working-copy checkpoint or Undo/Redo history.
- [x] Keep Play test state disposable; entering/exiting it performs no implicit persistence write.
- [x] Add Fox **Walk Speed** and **Run Speed** as independently authored character Setup properties.
- [x] Save those speeds through the existing explicit Save boundary and consume the same saved values in gameplay.
- [x] Decouple Fox locomotion cadence from ground speed at full Walk/Run so animation timing can be judged independently from metres/second.
- [x] Preserve partial-thumb cadence scaling so easing the movement control in from centre does not look like full-cadence foot skating.
- [x] Add scrolling metre markers plus speed / ms-per-cycle / metres-per-cycle diagnostic readout to Quick Play.
- [x] Replace 16-sample Smooth playback quantisation with direct fractional sparse-key evaluation for Fox clips.
- [x] Route Anim Lab and gameplay Fox playback through the same sparse evaluator; retain 16-sample banks only as compatibility/fallback/export data.
- [x] Preserve exact authored key poses while evaluating fractional poses between keys.
- [x] Keep the 16-frame timeline as the simple authoring/key layout rather than introducing a graph editor.
- [x] Correct Quick Play left-facing cutout mirroring.
- [x] Extend Fox handoff Setup with Walk/Run speed and bump the one-file handoff to v1.0.160.

On-device acceptance before approving this stage:

- [ ] iPhone: compare Smooth and Linear on the same sparse Walk and confirm Smooth now reads as visibly continuous rather than coarse key-to-key linear motion.
- [ ] iPhone: scrub authored keys and confirm v1.0.160 has not altered the user's key poses.
- [ ] iPhone: make an unsaved pose tweak → Play → walk/run/jump → Animate and confirm the working-copy tweak survives without Save.
- [ ] iPhone: repeat the edit → Play loop several times and verify Undo/Redo ownership remains predictable.
- [ ] iPhone: tune Walk Speed and confirm ground travel changes without changing full-walk cycle timing.
- [ ] iPhone: tune Run Speed until the current fast run cadence can cover a visually appropriate amount of ground.
- [ ] iPhone: confirm partial movement input still eases cadence naturally rather than foot-skating at full cycle speed.
- [ ] iPhone: confirm left/right Quick Play direction mirrors the Fox correctly.
- [ ] iPhone: Save speed values, launch normal Play and confirm gameplay matches Anim Lab Quick Play closely.
- [ ] iPhone: Discard restores speed/clip working data to the checkpoint.
- [ ] iPhone: Fox Handoff produces one `SS-FOX-RIG-ANIM-1.0.160.json` containing Walk/Run speed plus all four Fox clips.
- [ ] iPhone/A2HS: relaunch receives cache v14 and retains saved motion settings.

### Following art stage — hybrid deformable Fox prototype

Only after the v1.0.159 proportions/animations have been judged through the v1.0.160 Quick Play/motion-fidelity loop:

- [ ] Prototype a silhouette-fitted skinned 2D mesh around the approved v3 rig; do not redesign the skeleton to serve the mesh.
- [ ] First candidate regions: continuous body/head mesh, deformable shoulder/leg regions, separate tail mesh.
- [ ] Investigate subdivision density, bone weights, neck/shoulder/hip deformation, texture stretch, paw/lower-limb islands and iPhone Safari/PWA runtime cost.
- [ ] Preserve the painterly charcoal texture and avoid solving mesh problems by adding unnecessary animation controls.
- [ ] Decide whether rigid paws/distal limbs remain separate only after seeing the weighted prototype.

Later animation polish after these stage markers:

- [ ] Refine Walk against Motion Reference.
- [ ] Refine Run/Gallop against Motion Reference.
- [ ] Tune Jump timing/shape.
- [ ] Add subtle Idle breathing/head/ear/tail life.
- [ ] Reassess neck/head and wrist/hock shaping against the charcoal silhouette.
- [ ] Refine key spacing/poses against the v1.0.160 direct Smooth evaluator; add no graph editor unless this simpler curve model proves insufficient in real use.

### v1.0.161 — Full-chain Fox Paw IK

Goal: remove the distal-joint reach limitation exposed while authoring new Fox locomotion without reopening the wider Anim Lab architecture.

Implemented in code:

- [x] Replace the old socket → knee → wrist/hock two-bone solve + fixed distal vector with a complete Paw Target endpoint solve.
- [x] Preserve Socket → Knee/Elbow → Wrist/Hock → Paw bone lengths from the active v3 rest rig.
- [x] Allow Wrist/Hock Angle to remain the preferred distal shaping direction while letting that preference yield when it blocks outward Paw Target reach.
- [x] Progressively relax the preferred Wrist/Hock bend as the target approaches full reach so all three limb sections can become effectively straight.
- [x] Preserve explicit front/rear bend branches so the earlier knee/hock flip problem is not reintroduced.
- [x] Keep the v1.0.159 authoring baseline marker unchanged so installing the solver correction does not reset current authored Fox clips/rig data.
- [x] Leave Quick Play, direct Smooth evaluation, Walk/Run speed tuning and charcoal evaluation art otherwise unchanged.

On-device acceptance:

- [ ] iPhone: extend each front Paw Target and confirm Elbow + Wrist can open into an effectively straight leg.
- [ ] iPhone: extend each rear Paw Target and confirm Knee + Hock can open into an effectively straight leg.
- [ ] iPhone: sweep Paw Targets through bent → extended → bent poses and confirm there is no distal snap or knee/hock branch flip.
- [ ] iPhone: verify Wrist/Hock Angle still provides useful shaping away from full extension.
- [ ] iPhone: inspect existing Walk/Run/Jump keys for any pose that needs a small animator retune now that the distal joint participates honestly in reach.
- [ ] iPhone: Quick Play and normal gameplay still use the current saved animation/speed data with no reset after update/relaunch.

### v1.0.162 — Fox joint constraints + phase-aware gait transition

Goal: stop extreme full-chain IK from switching to the mirror lower-chain solution and remove the permanent same-phase Walk/Run hybrid that produced a suspended paw during acceleration/deceleration.

Implemented in code:

- [x] Keep the existing explicit primary knee/elbow branch deterministic.
- [x] Lock the released Wrist/Hock circle-intersection solution to the anatomical side established by the active rest rig so the lower chain cannot swap mirror branches at extreme Paw Target positions.
- [x] Preserve full-chain reach and the existing Wrist/Hock preferred-angle behaviour away from the constrained branch boundary.
- [x] Replace Fox's permanent same-phase Walk/Run pose blend with a discrete Walk or Run gait plus a short transition state.
- [x] Select the destination gait phase by comparing current Paw Target/contact configuration against the target gait rather than assuming phase X in Walk corresponds to phase X in Run.
- [x] Advance source and destination cycles at their own authored cadence during the hand-off.
- [x] Make the short hand-off contact-aware so source-planted paws do not sit at a half-airborne height for the entire transition.
- [x] Keep ground speed analogue/continuous and separate from gait selection.
- [x] Use the same transition logic in Anim Lab Quick Play and normal gameplay.
- [x] Promote the user's supplied v1.0.161 Fox handoff into fresh-install built-in data without changing the persistent v1.0.159 authoring-baseline ID or overwriting existing saved work.

On-device acceptance:

- [ ] iPhone: accelerate slowly through Walk → Run and confirm the formerly floating leg no longer hangs in a permanent hybrid pose.
- [ ] iPhone: decelerate Run → Walk and confirm the reverse hand-off is similarly short and coherent.
- [ ] iPhone: compare Quick Play and normal Play transition timing/phase behaviour.
- [ ] iPhone: sweep all four Paw Targets through the v1.0.161 extreme-extension problem area and confirm no knee/elbow or released wrist/hock mirror-branch pop.
- [ ] iPhone: confirm current saved Walk/Run/Jump/Idle and movement speeds survive patch/relaunch unchanged.


### v1.0.163 — Jump authoring cleanup

Goal: separate Jump pose authoring from physical jump trajectory so the animator works in a stable coordinate system and airborne Paw Targets are not forced back to the ground between keys.

Implemented in code:

- [x] Remove the synthetic sine-wave vertical lift from Animate/Jump viewport projection.
- [x] Keep the real Ground / Ruler datum fixed at local `Y = 0` during Jump authoring.
- [x] Hide the moving Ground Motion diagnostic for Jump; retain it for Walk/Run.
- [x] Allow Smooth Jump interpolation to carry Paw Target Y below local `Y = 0` instead of clamping it to the ground plane.
- [x] Keep physical vertical trajectory in Quick Play/gameplay, where the whole character moves through world space and the Jump clip contributes pose only.
- [x] Preserve current Walk/Run transition, speed tuning, IK constraint and authored animation data.

On-device acceptance:

- [ ] iPhone: Jump authoring ground/ruler remains visually fixed while scrubbing and playback.
- [ ] iPhone: Ground Motion controls are hidden for Jump and still available for Walk/Run.
- [ ] iPhone: author neighbouring Jump keys with a paw below local ground and confirm interpolation no longer flicks/snaps the paw upward between them.
- [ ] iPhone: body and paws can be posed independently without a moving editor origin compressing the limbs.
- [ ] iPhone: Quick Play Jump still follows its physical arc and uses the current working-copy Jump pose.
- [ ] iPhone: saved Walk/Run/Jump/Idle and speed data survive patch/relaunch unchanged.

## v1.0.165 — Deformable mesh / skinning proof Stage M1

Priority changed: prove the deformable skinning direction before the larger Anim Lab/Character Library generalisation.

Completed in this drop:
- Add a Fox-only, editor-only Rigid / Deform comparison in Anim Lab.
- Recompose the existing rigid atlas at bind pose into six temporary deformable regions: Body+Head, Tail, four complete legs.
- Generate low-poly triangle meshes and automatic two-influence weights from the approved Fox bones.
- Evaluate current working rig/animation poses through the skinned renderer in Animate, Rig and Quick Play.
- Add optional mesh wireframe.
- Preserve all existing rig, clip and gameplay data; do not save prototype weights/topology yet.

Acceptance questions before Stage M2:
- Is joint bending materially better than the rigid cutout?
- Do shoulder/hip transitions improve enough to justify final continuous artwork?
- Is texture stretching acceptable across the current Walk/Run/Jump extremes?
- Does Anim Lab remain responsive on iPhone with the low-poly triangle budget?
- Are two influences per vertex sufficient for this art style?

If accepted, Stage M2 adds persistent topology/weights and touch-friendly correction tools. If rejected, revisit region topology/rendering before generalising Character Lab around it.

## v1.0.166 — Deformable mesh topology cleanup Stage M1.1

Goal: keep the promising Stage M1 deform result while replacing the unreadable transparent source-plane topology and removing the main cause of visible leg twisting before Stage M2 weight authoring.

Implemented in code:
- [x] Crop temporary mesh textures to their visible alpha before topology generation.
- [x] Replace the Body + Head full rectangle with an alpha-culled compact grid.
- [x] Replace Tail and four limb rectangular grids with bone-chain-aligned strip topology.
- [x] Sample strip width from the actual composited artwork so mesh boundaries follow the visible region.
- [x] Use stable chain cross-sections for limbs/tail so left/right strip vertices cannot swap because of non-adjacent proximity weights.
- [x] De-duplicate wireframe edges.
- [x] Add per-region wireframe inspection cycling.
- [x] Preserve current rig, clips, setup and gameplay renderer unchanged.

On-device acceptance:
- [ ] iPhone: full Mesh Wireframe hugs the Fox and no longer fills the viewport with transparent source-plane triangles.
- [ ] iPhone: isolate each of the six regions and confirm its topology is understandable.
- [ ] iPhone: Walk and Run legs no longer visibly twist/flip through the stride.
- [ ] iPhone: extreme Paw Target poses remain usable without strip collapse becoming worse than the original rigid cutout.
- [ ] iPhone: Deform mode remains smooth enough for the phone-first authoring workflow.
- [ ] Compare Rigid ↔ Deform with wireframe off and decide whether to proceed to persistent topology/weight editing (Stage M2).

## v1.0.168 — Dedicated deformable Fox source-art pass (Stage M1.2)

Goal: prove the current six-region skin with artwork made for deformation instead of reconstructed rigid cutout planes, without changing topology, rig or animation data.

Implemented in code/art:
- [x] Add dedicated transparent Body + Head source art.
- [x] Add dedicated transparent Tail source art with no bright white tail-tip requirement.
- [x] Add complete Front Near/Far and Rear Near/Far leg/shoulder source pieces.
- [x] Preserve near/far visual differentiation.
- [x] Load the dedicated region art inside the existing deform renderer and fit it to the approved bind-space region.
- [x] Keep the M1.1 alpha-tight body grid and twist-safe chain strips unchanged.
- [x] Keep the rigid atlas as a safe loading/failure fallback.
- [x] Version/cache the new source images for the offline PWA.
- [x] Do not rewrite current rig, animation clips, topology or saved authoring data.

On-device acceptance:
- [ ] iPhone: Walk / Run with Deform should retain the stable M1.1 motion while showing cleaner continuous artwork.
- [ ] iPhone: inspect Body + Head / Tail / all four legs with Wireframe and confirm topology remains compact/readable.
- [ ] iPhone: compare Rigid ↔ Deform around neck, shoulder, hip and tail root for seam reduction.
- [ ] iPhone: confirm pan/pinch performance from 1.0.167 is unchanged.
- [ ] Identify the exact shoulder/hip weight corrections for the planned v1.0.169 bespoke Fox weighting pass.

## v1.0.169 — Approved charcoal Fox deform atlas (Stage M1.3)

Goal: replace the exploratory six-image M1.2 input with one clean atlas derived directly from the approved charcoal Fox, while keeping topology, rig and animation data fixed.

Implemented:
- [x] Build a single transparent 2048 × 1024 deform atlas from `fox-reference-charcoal.png`.
- [x] Pack Body + Head, Tail, Front Near/Far and Rear Near/Far with clear non-overlapping source rectangles.
- [x] Reuse the approved near-leg source for far limbs with a restrained depth/value adjustment rather than generating a different character design.
- [x] Give shoulder/hip roots intentional overlap/falloff for the later bespoke weighting pass.
- [x] Change Anim Lab mesh loading from six independent images to one atlas + region rectangles.
- [x] Keep M1.1 mesh topology and chain binding unchanged.
- [x] Keep rigid atlas fallback.
- [x] Preload/cache the single deform atlas and align preload/runtime cache names.
- [x] Do not rewrite rig, sparse clips or saved authoring data.

On-device acceptance:
- [ ] Confirm the deform character now reads as the approved charcoal Fox rather than the exploratory M1.2 source sheet.
- [ ] Check for source-art artefacts/foreign fragments around every isolated region.
- [ ] Check shoulder/hip attachment during Walk/Run and record the exact areas to tune in the bespoke weighting pass.
- [ ] Confirm 1.0.167 pinch/pan performance remains intact.

Next: bespoke Fox shoulder/hip/tail/neck weighting pass, then use the lessons from that pass to specify the generic weight-authoring workflow.


Update 1.0.171
- Applied a live deform-art scale/alignment correction so the fox body sits closer to the approved reference image in Rig mode.
- Still to do: expose weight tuning controls, shoulder weighting refinement, and any final rig-side paw/contact polish.

### 2026-10-19 · P2a test patch v1.0.193 (acceptance pending)

- [x] **Code implementation**: isolate the fixed source-art rig from the editable structural rig and committed inverse-bind rig in current Setup storage; preserve existing user rig when first anchoring legacy data.
- [x] **Code implementation**: neutral unskinned Rig/Parts preview, pre-skin part transforms, identity-at-rest skin mapping for grid and chain regions, cached source-art mesh unaffected by Rig edits.
- [x] **Code implementation**: non-saving preview of previous/candidate Walk binding; explicit Undo/Redo/Discard-able Rebind; block saving modified rest joints with stale bind rig; fix Rig viewport projection error.
- [x] **Synthetic QA**: Node checks, Chromium DOM/atlas tests of rig manipulation, unchanged neutral canvas before/after socket edit, preview cycle, rebind undo, Save guard and persistence in mocked storage.
- [ ] **User iPhone acceptance for v1.0.192 + v1.0.193**: near/far front and rear joints, tail, neck/body, Parts transforms/ordering, pixel-stable neutral and cross-mode transitions, animation continuity, Save/reload/Undo/Discard and app navigation.
- [ ] **P2b**: dedicated Skin/Bind mode and per-vertex weighting/mesh controls; preview deformed art before committing topology changes; runtime uses the same stored skin bind data.
- [ ] **P3/P4**: reusable rig/part descriptor pipeline, new-character creation, character/art library, custom and template animation clips, and actual dynamic in-game character selection.

### 2026-10-19 · P2b Skin/Weight authoring test v1.0.194 (device acceptance pending)

User accepted v1.0.193's rig-art independence on iPhone and requested the next stage. v1.0.194 is a changed-files-only patch directly over v1.0.193.

- [x] Character Setup navigation now Rig / Parts / Skin with no change to existing Fox reference textures/clip data.
- [x] Add per-character `skinTuning` normalisation/Setup Undo/Redo/Discard/Save and include in Fox handoff JSON; absent legacy values preserve approved defaults.
- [x] In Skin show all six regions. Near/far legs and tail: editable body-root influence and blending distance; Copy to Pair and Reset Region.
- [x] Body + Head grid: choose bone and vertex, selectively edit that one vertex's weights (re-normalise), explicitly arm canvas Pick Vertex, Auto Vertex / Reset Region. Wireframe + coloured weight dots.
- [x] Non-saving Rest/Walk/Run phase comparisons; leave source pixels/UVs/topology/animation keys unchanged. Neutral art pixel-stable with or without skin tuning.
- [x] On Skin entry temporarily disable default skeleton overlay (return previous setting on exit). Pan/pinch remains default until Pick Vertex is armed.
- [x] Automated Chromium DOM/real-atlas/mocked-storage tests: slider effect on Walk renderer, Rest unchanged; Save/Undo/Redo, copy/restore, no JS page exceptions. Node syntax checks.
- [ ] **User iPhone review**: Skin tab visible; Body vertex selection, weight change, auto restoration, near/far copying, Save/reload/Discard; inspect shoulder/root leg deformation at multiple Walk/Run phases, normal pan/pinch, small-device safe areas, performance.
- [ ] **Topology/rig-family follow-up**: contour/vertex editor and optional bone influence authoring for *all* region topologies; deterministic IDs/schema migration when topology changes; typed cross-family descriptor source, not Fox-only REGION_DEFS.
- [ ] **Runtime integration**: skin tuning + inverse bind must be consumed by in-game renderer and Quick Play; compare rendered frames to Anim Lab and performance-test on iPhone before enabling globally.
- [ ] **Later agreed goal**: new Character wizard (name/family/art/rig/skin), template and unique clip libraries, export/import and save to Character Library, dynamic in-game character chooser. Maintain this as the primary project goal—Skin is only one milestone.


### P3b implementation — v1.0.196 (19 Oct 2026; awaiting iPhone acceptance)

User confirmed v1.0.195 layout broadly usable, then requested interactive editor polish before character/library authoring. Implemented changed-files-only patch over v1.0.195:

- Primary Skin interaction is **Region → Bone → Influence Gain & Falloff** for the six existing Fox deform regions. A selected-bone gradient heatmap (blue lowest, cyan, green, yellow, orange, red strongest) is painted in texture UV and alpha-masked to the actual opaque art. The selected bone is highlighted; the skeleton follows neutral/walk/run preview phase along with the mesh. Optional per-vertex editing remains secondary under Advanced, with separate Reset Bone, Auto Vertex and Reset Region actions. Limb root attachment controls retained.
- New optional `skinTuning.regions[regionId].boneProfiles[boneIndex]` `{gain,spread}` survives Setup normalisation, Undo/Redo and Save; default/legacy data keeps old deformation. Grid uses adjusted weights; chain retains current strip algorithm until an explicit per-bone/vertex edit, then blends a weighted-bone deformation. Tuning is **still preview/editor-only**, not consumed by Quick Play or game runtime.
- Neutral Parts/Rig draws are accelerated by directly projecting each region texture with the same authored pre-skin layout transform, instead of drawing mesh triangles. Right-pad movement samples coalesce per animation frame and flush before commit. Bone lines/joints are subtler in Rig/Animate; selected Skin bone remains visible. ResizeObserver, visualViewport and rotation delays remeasure iPhone canvas aspect and retain world-centre framing.
- Do not assume all region topology is generic yet: six Fox mesh regions are hard-coded descriptors for the proving ground. **Next** complete device QA, then general Character Create/Assets and descriptor-driven skin region registration; connect skin tuning into playable render only when stable. Continue to preserve the single-file Fox JSON export and working legacy clips.


### P3c / v1.0.197 — Paired copy, explicit save/rebind, chain-skin stability (19 October 2026)

**User/device state:** v1.0.196 Skin UX was reported significantly improved, but distorted/twisting legs, inconsistent symmetry-copy granularity and confusing rebind/save remained. v197 is a *candidate* patch over v196; test it on iPhone before promotion. Preserve v196 as rollback. The user supplied a Fox JSON export dated 19 Oct (filename `SS-FOX-RIG-ANIM-1.0.175.json`, exporter still writes legacy `animLabVersion:1.0.164`): `restRig` and `skinBindRig` are equal; `artRestRig` is intentionally distinct. Extreme limb bone gains (`frontNear` 2/2.95/2.4, `frontFar` distal 3) and spreads down to .55 were present. This does not prove the user set weights incorrectly; the old weighted-mode switching algorithm is a plausible mechanical cause of twisting under wide IK poses.

**A. Symmetry controls** (same language across authoring modes, descriptor-aware for the current quadruped proof):
- **Parts:** Copy Selected Part → Pair, Both Legs Near → Far, Both Legs Far → Near. Only layout transform fields X/Y/rotation/scales/pivots copy, never atlas pixels, draw order, or transient solo/visibility.
- **Rig:** Copy Joint → Pair; Copy Segment → Pair (two adjacent joints, endpoint selects last segment); Copy Limb → Pair (all joints in selected front/rear limb); Both Legs Near → Far / Far → Near. Membership and near/far pairing are resolved from rig-family `jointGroups` + `symmetryPairs` metadata; no copied animation keys. Body/spine/tail have no symmetry pair.
- **Skin:** Copy Selected Bone → Pair copies only the selected bone's gain/spread profile; Copy Whole Part → Pair duplicates attachment, all bone profiles and any manual vertex weights; Both Legs Near → Far / Far → Near copies front and rear in a single undoable transaction. This is a skin-region proof, not generic arbitrary limb topology.
All copy operations run through Setup transactions and Undo/Redo/Save/Discard. The destination is overwritten; users should verify direction before applying.

**B. Rebind behavior:** A changed structural rest rig must never be persisted with old inverse-bind coordinates. Save now *asks* whether to Rebind + Save when the rig differs from `skinBindRig`; Cancel leaves the working session unchanged and unsaved. Manual Rebind stays available as an Undoable action and proposed/previous bind previews remain under Display. Rebind affects only `skinBindRig`, not neutral art, UV/atlas, manual tuning, or animation clips. `artRestRig` is not overwritten. Test with rig edits, cancel and accept, reload to verify no stale bind.

**C. Chain deformation correction:** v196 changed a tuned chain vertex to a **constant 85% blend into unrelated linear-blend skinning** whenever any bone profile changed; this can visibly shear/invert quads when IK makes large limb rotations. Preserve the established baseline chain deformation. Instead compute `tunedWeighted - automaticWeighted` as a *weight-edit delta* and apply a bounded 0.78× correction to chain output (maximum .024 character-local units per vertex). This is neutral-pose invariant, continuous at identity tuning, and bounds extreme gain/spread displacements. Existing weight values/heatmap, mesh topology, rig, atlas, poses and clip keys remain untouched. This is a mitigation, not a guarantee against all artifacts from extreme IK or nonrigid geometry; test walk/run multiple phases with the user's actual saved data. No silent reset of authored skin weights.

**Integration boundary:** Gameplay and Quick Play still DO NOT consume Skin tuning. No new-character wizard, general rig descriptor authoring, arbitrary new part creation, or runtime selector implemented. The overarching goal remains Character → Parts → Rig → Skin → Animate → Save/Library → select in-game. Follow-up may require better bone-weight painting/IK limits once iPhone tests identify any remaining folds.


### P3d / v1.0.198 — Normalised Skin influence UI (19 October 2026)

- [x] Replace `Bone Influence` 5–300% *legacy relative gain* slider with **Peak Bone Weight 0–100%**, prominent numeric output, and explanatory automatic/actual peak readout.
- [x] Implement per-bone normalised peak influence envelope across the whole part; Falloff shapes its taper, all vertex bone sums remain 100%, manual per-vertex overrides retain priority, and the heatmap shows actual influence.
- [x] Keep legacy `{gain,spread}` untouched until user edits its selected bone. Explicit one-bone migration to `{peakWeight,spread}` is undoable and Save/export-compatible; copy operations carry both types without forced migration. Support exact 0%, do not confuse legacy 2.95× with true 295% bone weight.
- [x] Update Setup normalisation for optional finite `peakWeight`, without changing `animlab.skin-tuning.v1` schema or saved user rig/animations/artwork.
- [x] Node syntax + headless Chromium inlined real-atlas/browser state QA: 0/15/75/100% target, displayed actual, legacy 2.95×/3× preservation, one-bone conversion to 42%, Setup Save and no browser exceptions.
- [ ] **iPhone acceptance for v198**: slider readability in landscape; inspect actual heatmap at 0/50/100%; confirm old Fox skin remains exactly as in v197 until one bone is edited; Undo and save/reopen; compare Walk/Run limbs in motion, root blends and any remaining twisting. V197 remains user working fallback.
- [ ] **Generalised character-authoring next stage**: descriptor-based Create Character → Parts / Rig / Skin / Animate → persistent Character Library, template vs unique animation clips and in-game selection; runtime mesh + tuning parity still not implemented.

### Character Library P5a / Stage C1a — v1.0.199 (19 Oct 2026)

- [x] Add dedicated versioned character registry to Anim Lab (`sidescroll.animlab.character-library.v1`), independent of existing Fox/Hero runtime keys. Create named quadruped and biped starter records, and reopen on return to the editor.
- [x] Supply independent per-entry working Setup and sparse clip banks; prevent Save/Discard from touching Fox/Hero global rest-rig/collider/clip storage when editing a library character.
- [x] Character Library phone-facing UI: Create, Open, Rename, Delete-with-confirmation, JSON Export, JSON Import with new ID and schema validation. Keep built-in characters separate, starter-art disclaimer visible.
- [x] Reuse Fox-family Parts/Rig/Skin/Animate/Quick Play with a library quadruped, with existing six-part artwork as a **placeholder**, no changes to pixels or rig-family topology.
- [x] Biped creation with installed human Setup and isolated animation bank, accurately labelled **not yet supporting independent Parts/Skin**.
- [x] Node syntax and Chromium inline-DOM with real bundled atlases and simulated storage smoke checked; source rollback remains v198. Do **not** mark iPhone acceptance yet.
- [ ] **Device test** v199: create quadruped; edit/save Parts, Rig, Skin, one animation key; switch between original and new characters; relaunch; import/export; test Biped limitations; check responsive layout and Safari share/download flow.
- [ ] **P5b**: Art Kit/replace-atlas/imported transparent parts, generic descriptor mesh topology (not just Fox), and true Biped independent Parts/Skin authoring.
- [ ] **P6**: named, per-rig-family reusable animation asset library with linked-template vs unique ownership, duplicate/Make Unique, Save as Template and slot assignment.
- [ ] **P7**: gameplay runtime registry and explicit game character selector; consume saved mesh/bind/skin/art/animations at runtime with safe defaults/fallback for existing Hero/Fox.



### Anim Lab v1.0.201 patch checkpoint (20 October 2026)

- [x] Bundle the current user-supplied Fox export as the source for **future** new quadrupeds only, preserving all Setup/rest-art-bind data plus four sparse clips and existing built-in/local documents. Versioned standalone JS module loaded before core, unchanged Fox art assets.
- [x] Put unposed setup workspaces on one neutral Fox rest pose; Skin defaults to Rest on entry, explicit Walk/Run still work. No workspace transition allowed to edit the Part/Layout saved transforms. Automated Parts-return screenshot regression passed.
- [x] Add separate Display buttons for legacy Rigid Planes and actual Deform Planes boundary edges (independent of wireframe).
- [ ] iPhone Safari test: repeat Parts → Rig → Skin → Animate several times with existing New01 and new seeded quadruped. Validate art returns exactly after cycles, portrait rotation and both plane toggles. **Exact user-reported progressive drift has not yet been reproduced in desktop tests**; investigate with iPhone capture if still present.
- [ ] Next authoring milestones remain custom art import, general biped Parts/Skin, template/unique clips, and game-time character selection/runtime skin parity.

### Project Data, Export & Recovery — v1.0.202 diagnostic snapshot (20 October 2026)

- [x] Add Home → Menu → **Project Backup** global entry separate from World Lab and Anim Lab; offline SW includes new page and JS under `sidescroll-runtime-v202`.
- [x] Read-only **Preview data** and **Export Snapshot**. JSON `sidescroll.project-snapshot.v1` preserves raw values of SideScroll-prefixed local/session storage and enumerated SideScroll legacy keys (`gameHubProgress`, `gamehub.walklab.anim.v*`, `ss-concept-lab-state-v1`). Include manifest categories, bytes, SHA-256 where available, skipped same-origin keys by name, errors, IndexedDB/cache names diagnostic only.
- [x] Deliberately exclude other GitHub Pages origin data and credential-like keys, offline cache/game binary files, any unsaved in-memory changes; provide explicit UI warning that this is **not yet a verified recovery backup**. No restore writes, no automatic upload, no existing game/source/storage mutation.
- [x] Synthetic Node + Chromium test at 844×390 and 390×844: extract raw/malformed/legacy/character/scene/puzzle keys, actual JSON download, verify no writes, avoid unrelated/credential data and no JS exceptions.
- [ ] **iPhone device test:** save work in each Lab, Project Backup → Export Snapshot to Files/iCloud, attach JSON for storage/individual export audit; check iOS PWA/Safari download and share fallback. Keep existing individual exports as redundancy.
- [ ] **Audit actual snapshot:** compare every included key, schema, type and content size to code-defined persistence; verify World Lab/Puzzle Lab/Asset Lab/Anim Lab/Concept/Design Lab export and re-import completeness. Investigate excluded/unrecognised key names, any browser IndexedDB records or non-persisted user uploads.
- [ ] **Individual export coverage:** fill all gaps, including complete character artwork when applicable, editable animation templates, biped/hero clips, puzzle/group templates and any local design assets; add counterpart import/version checks and round-trip tests for each Lab.
- [ ] **Verified global export/restore:** define versioned app manifest and GitHub data promotion workflow, package binary resources as required, dry-run summary, conflict resolution, compatibility/migration checks, undo/restore safeguards and real-device round-trip acceptance. A snapshot is not automatically a valid distributable game build.
- [ ] **Future persistence rule:** every new Lab feature must document persisted keys/schema, exports/imports, binary assets, compatibility and coverage in global backup *at the same time the feature ships*.


### Project Export iPhone usability — v1.0.203 (20 October 2026)

- [x] Fix v202 diagnostic export flow: prebuild real JSON File with raw snapshot and manifest while page loads; direct click-handler native file share with only `files:[file]` (no title/text); only one Export Project button; download fallback on unsupported browsers or share failure.
- [x] Keep v202 coverage, raw values and SHA checks where available, avoid storage writes; bump service worker cache to v203.
- [ ] **Required iPhone Safari/PWA verification**: tap Home → Menu → Project Backup → Export Project, choose Save to Files, verify saved `.json` is non-empty and includes `schema=sidescroll.project-snapshot.v1`, attach it in chat. Prior text-only `text(3).txt` is not a backup.
- [ ] Continue raw storage audit, individual lab export fixes, complete project restore and bundled-game-data promotion once a valid project JSON is received.


## 20 Oct 2026 — v1.0.204 Lab Data Export / Import coverage (Stage A)

- New `lab-data.js` offers scoped exact-string Lab exports for Puzzle Lab, Asset Lab and the **whole** Anim Lab (in Character Library → Load; top-level New / Load / Save unchanged). Payload `sidescroll.lab-data.v1`; all current and legacy saved keys in the selected Lab, manifest of count/UTF-8 bytes. Import validates scope, duplicate keys and sizes; explicit add/overwrite preview; rollback attempt if any localStorage write fails; unspecified keys preserved. Imports should only follow off-device exports and user intent.
- World Lab **Game Design export v3** extends v2 with isolated Puzzle Lab saved keys and player puzzle runtime, plus the active v2 Design Lab working document and an explicit v1 legacy copy. v1/v2 import compatibility is maintained. The World's format is NOT identical to Global Snapshot or the new lab-scoped format.
- Global Snapshot exporter v204 also recognises legacy `gamehub.sidescroll.scene.v2` and `gamehub.walklab.character.v1` (if present). Do not auto-migrate these raw values.
- The saved-data exports **do not embed art PNGs, imported image pixels, bundled resources or IndexedDB**. Save current edits before export. Project Backup is still read-only, **not an approved full restore**. GitHub packaged baseline defaults will need a deliberate promotion/migration pipeline; local work must not be silently overwritten.
- Machine-readable key/source mapping and exact test outcomes live in `SIDESCROLL_EXPORT_COVERAGE.md`. iPhone Safari approval pending. Next: verified global restore with preview/rollbacks, artwork packaging and per-character export parity.


### v1.0.205 — Global Project Restore / Backups (20 Oct 2026)

- Home → Menu → Project Backup now offers one-button Export Project and **Import Project**. Import is deliberately a separate, opt-in view: select a JSON, validate schema/hash/manifest/key scope, review categories and add/replace/skip counts, choose Merge missing (default) or Restore from file. Session/editor-only data is disabled by default.
- Safety workflow: capture all currently saved project keys (not just affected keys), **Save safety JSON to Files/iCloud first**, acknowledge success, recheck that current storage has not changed since preview, then final confirmation and selective writes. Verify readback and attempt rollback on failure; do not claim atomicity across browser termination. Old extra keys are never deleted; foreign same-origin keys and credentials are never imported.
- This is saved **browser data** recovery, not a complete art/image/IndexedDB backup and not a GitHub baked-defaults promotion. Single-Lab data scopes remain available for smaller imports/exports. Export/import are companion responsibilities for every new editor storage key.
- Keep the running iPhone state safe: UI/preview test only on production phone until restore has been roundtrip-verified separately. See `SIDESCROLL_EXPORT_COVERAGE.md` for detailed formats, gaps and device QA.

#### v1.0.205 Global Restore status

- [x] Snapshot v1 parser/manifest and SHA-256 verification, independent from Lab-specific exporters.
- [x] Non-destructive import preview with changed/unchanged/missing counts and category/session filters; Merge or Restore semantics (non-deleting).
- [x] Must save and acknowledge a separate complete pre-restore snapshot before Apply; stale-data check, final confirmation, selective writes, readback and best-effort rollback.
- [x] Automated validation with user's real snapshot; UI layout/chooser headless tests at 390×844 and 844×390.
- [ ] **Critical iPhone QA:** share pre-restore JSON to Files, import preview, test genuine full restore on spare/test browser/profile/device, verify actual editor/runtime state, interruption handling, and save roundtrip. Do not trial destructive restore on main phone.
- [ ] Asset/pixel packaging for image-backed authoring, DB records where used, build promotion into GitHub baked defaults without overwriting local edits.


## v1.1.4 — Atlas → Parts inventory foundation (21 October 2026)

**Delivered code / in-device acceptance still open:** a separate, *opt-in* per-character Parts assembly starts by selecting **Use Atlas parts** in the existing Parts workspace. It reads currently authored meshes from that character's `sidescroll.animlab.atlas-docs.v1` Atlas document. Individual **Add**, **Add all unused**, **Duplicate selected**, **Remove selected**, **Clear all** (confirm), draw-order back/forward, selected X/Y/rotation/scale fields and a dedicated move/rotate/scale thumb pad produce undoable **Setup** transactions. The user's original six Fox Parts, their transforms, and the existing Parts workspace controls remain intact and can be restored by choosing **Show original Parts**. Clear/remove modify assembled *instances*, never the original Atlas mesh source, rig or clips. Every instance refers to a stable source `meshId`; multiple instances may share one mesh. Part order is array order (rear → front).

**Storage:** the existing `artLayout` gains optional `{assembly:{schema:'animlab.parts-assembly.v1',enabled,instances:[{id,meshId,label,x,y,rotation,scaleX,scaleY,boneTarget}]}}`. The existing `normaliseArtLayout` validates these fields and permits 64 instances; absent assembly remains the pre-v1.1.4 layout, without mutation. It is saved through the existing per-character `setup` working copy and Undo/Redo/Save/Discard, not through the Atlas source key. No legacy part is destroyed on switching either way. An Atlas source ID is resolved only against the current character's local Atlas document. A missing/deleted source receives a visible inventory warning. Character export/restore coverage remains **incomplete**: image bytes live in IndexedDB and are not in current JSON snapshots.

**Preview and binding boundary:** the custom assembly draws its actual authored **triangle topology** with atlas pixel coordinates as texture UVs (no parallel UV data) in neutral/rest **Parts** and **Rig** view. Existing Fox six-region deform renderer yields to this preview only in those two stages when the Atlas assembly is enabled. Rig remains independently editable. A **Suggested joint** choice, target-count diagnostics and optional **Position at target joint** provide *intent metadata* for later Skin binding; they do not create or move bones, generate weights, install bind matrices, attach images to animated joints, or affect gameplay. Skin/Animate/Play still use their existing legacy render path. There is no claim of an end-to-end new-character runtime pipeline in this patch. The chosen target is not a Skin influence list. Rendered custom mesh geometry remains static until later stage work.

**Pipeline priorities following this increment:** (1) generalise Skin to arbitrary `{part instance,source mesh,source image}` and arbitrary rig links, with explicit reversible auto-weights and manual controls; (2) bridge the bound assembly to Animate/Quick Play and then runtime and guard against dangling atlas sources, changed topology, incompatible rig and unbound vertices; (3) portable full character art+mesh+rig+animation export and safe restore, with eventual repository-relative texture paths. No Fox-source data or saved animation clips should be rewritten by any of these tasks without explicit opt-in.

### FUTURE — Character Hierarchy / Graph Inspector (approved concept, not delivered)

Provide a dedicated inspect/edit stage showing the graph of **character → atlas image/page(s) → reusable source meshes → assembled part instances (transforms and draw order) → rig/bones/joints → Skin weights and bind references → animation clips → game/play selection**. Selecting a node should open its owning editor or a narrowly scoped property inspector rather than silently altering other domains. Edges should distinguish instance-of, uses-texture, targeted-for-bind, weighted-to, and clip-uses-rig. Include validation for missing source pages/images, duplicate/conflicting IDs, orphaned part references, zero/un-normalised weights, rig joint deletion, stale skin topology, nonportable PNG bytes and runtime missing assets. Show **ready / warning / broken** per stage, plus a targeted fix link and one full-character verification view. Safe edit transactions, Undo and provenance are required; opening/inspecting is never a write operation.

**FUTURE — Multiple/Shared Atlas pages and reusable items:** a character may eventually reference several atlas pages, including a wardrobe/clothing/supplies page shared by different characters. Use stable page/mesh asset IDs separate from each *part instance* ID; an instance links to its page, mesh and optional version, never copies geometry just to be reusable. Define ownership (local vs shared/library), version/pinning, explicit propagation/rebind rules and broken-dependency reporting in the Hierarchy graph. The current single per-character `atlas` field and `meshId` references **do not implement this**; introduce page IDs and migration only as a later deliberate schema upgrade with tests. Never silently apply edits to a shared garment in every character.

## v1.1.5 — Single Parts inventory, authoring usability correction (21 October 2026)

The separate v1.1.4 **Use Atlas Parts / Show original Parts** panel has been retired from the user-facing workflow. In Parts there is one normal part list with **Add**, **Delete selected**, **Select all** and **Clear all**. Add opens a modal with selectable saved Atlas meshes. Clicking existing part entries can mark multiple for deletion; the most recently clicked remains the transform target. The existing Part Layout numeric inputs, thumb pad, move/rotate/scale/pivot, draw-order and clipboard commands now operate on either a legacy pre-migration layout or an Atlas assembly. Rig joint suggestion/snap controls are hidden; binding is still the responsibility of the later Skin stage. Remove/Clear deletes assembly instances only, never the Atlas source document. Save/Discard/Undo remain Setup transactions.

**Compatibility:** `artLayout.assembly` keeps its v1 schema and stable instance IDs. Existing v1.1.4 saved assemblies and transforms survive; old workspaces without assemblies show their original six pieces until the first structural Add/Delete/Clear, which converts them to `atlas-builtin-<partId>` source-linked instances (read-only source geometry). The old artLayout fields remain persisted for backwards compatibility but are not a second user-facing switch. Missing custom sources are clearly labelled as missing. Assembly transforms now include `pivotX/pivotY` in normalisation and previews. A multi-instance label displays the current source name resolved by stable Atlas `meshId`; repeated references are numbered rather than appending `copy`. Atlas's separate *Duplicate source* operation still creates a distinct source with a deliberate `copy` suffix; source rename is not equivalent to instance duplication. These controls do **not** establish Skin bone assignments, deformation, animation or runtime use.

**Future Hierarchy/Shared Atlas:** preserve the already proposed Character Hierarchy, linked atlas pages, shared outfits and validation work; do not implement them in the inventory editor. Subsequent Skin generalisation should consume stable instances from this streamlined list, not restore a competing part inventory panel.



## 21 October 2026 — v1.1.6 Parts list / inspector consistency

- [x] Replace the old compact two-column button board with an Atlas-like one-row-per-part list: Select, Hide, Solo and Lock.
- [x] Group the active selected part's Transform, numeric values, Layer order and Manage controls in one contained editor; move clipboard/reference to Advanced without removing functions.
- [x] Preserve Add modal, multi-select Delete, Select all, Clear all, undo and normal Save/Discard; support individual assembled-instance Rename and Duplicate without changing the Atlas source; normalise/save the optional override.
- [x] Browser-level/Node checks on selection, Lock, Delete/Undo, Clear/Undo, multi-source Add, Duplicate, Rename/Undo, Save. Browser localStorage shim used; live iPhone PWA validation pending.
- [ ] iPhone acceptance: visually inspect narrow landscape inspector, list hit areas/scroll confinement; Save/reload instance alias, hide/solo/lock transient behaviour, no original Fox data regressions.
- [ ] Next architecture gate: Atlas-sourced assembled instances still require generic Skin bone weights/rest-bind and Animate/Play/game render; then portable imported-PNG bundle and future Character Hierarchy/graph with multiple atlas pages/shared clothing parts.

## 21 October 2026 — v1.1.7 Parts move-distance regression

- [x] Reproduce Atlas-backed Parts move jump on v1.1.6: +26,+13 CSS-pixel thumb drag on DPR-2 canvas saturated to x=3,y=-2 because the hidden legacy overlay no longer provided `lastRender.view.scale`.
- [x] Source the live view from read-only AnimLab Core viewport API, apply correct pixel-to-local conversion for Move/Pivot in legacy and Atlas-backed Parts, and guard invalid projection and range.
- [x] Chromium landscape regression and Setup Undo/Redo round trip, plus syntax checks; no JS errors.
- [ ] Verify normal/fine Move/Pivot at multiple zooms and after orientation changes on target iPhone, including restoring any saved displaced part with numeric X/Y.
- [ ] Continue planned dynamic Skin / Animate / Play pipeline and portable PNG project export; unchanged in this hotfix.


## 2026-10-21 · v1.1.8 Atlas → Skin vertical slice

- [x] Replace confusing multiple active highlights in Parts with normal single-select + explicit multi-select, and batch Move/Scale in one undoable transaction (with consistent numeric inputs).
- [x] Display assembled Atlas instances in Skin instead of fixed legacy Fox regions; bind/unbind using rig-descriptor bone groups, per-vertex weights, topology-signature protection and diagnostic pose/vertex preview.
- [x] Route bound Atlas meshes to Anim Lab Animate and Quick Play, preserving actual imported PNG sampling and Setup Save/Undo, and do not require original legacy Fox sprite to load.
- [ ] **Device acceptance:** actual iPhone/Safari touch tests, high-vertex-count performance, rest↔posed deformation and local IndexedDB source-image restoration after reload; revisit auto bone weighting and manual painting UX based on results.
- [ ] **Next essential integration:** publish/bake assembled characters and skins to normal gameplay renderer, not just Anim Lab previews. Validate runtime rig/weights/clips and choose character without overwriting Fox.
- [ ] **Portability:** binary PNG payloads in portable character export/restore and optional GitHub-relative source texture URLs; linked multi-page/shared atlases remain separate future design.
- [ ] **Hierarchy:** inspect/validate graph of atlas pages, parts, bones, weights, clips and runtime dependencies, with missing/stale warnings. Existing future design remains in force.
