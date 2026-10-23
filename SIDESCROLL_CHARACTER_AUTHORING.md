# SideScroll Character Authoring & Animation System

## v1.1.18 — Optional rest-joint mitred binary envelopes (22 October 2026; iPhone acceptance pending)

**Joint Fit is opt-in per assembled Part binding**, toggled in Skin when `envelopeMode:'rect-binary-v1'` is active and persisted as `jointFit:true` inside `animlab.skin-binding.v1` (absent/false = original independent rectangles). Consecutive connected rest-bone links inside the current assigned group have one shared cap, computed from the normal of their segment-angle bisector; each envelope reuses the same cap endpoints exactly. Its side edges taper from the free rectangular end to this joint edge. Joint width is derived from neighbouring local Y scales, limited to a safe mitre ratio to avoid spikes at tight bends. Ambiguous branches/nearly reversed joint directions and invalid inverted quads fall back to their unmitred geometry. This deliberately doesn't switch on globally or migrate saved bindings.

**Ownership contract:** rectangles and fitted quadrilaterals are tested using source vertices transformed to Parts/rest space. When multiple fitted regions contain a vertex, select exactly one bone using deterministic normalised-distance ownership. Retain `[[bone,1]]` or `[]` and the existing rigid translation+rotation skin deformation; do not blend or reassign during a posed preview. In Rest the fitted caps coincide exactly; in Walk/Run the visible guides are each rigidly carried by their respective bone, so once those bones rotate their cap outlines need not coincide. This correctly reflects the already-bound vertices rather than pretending the bind region dynamically morphs/rebinds. X scale/offset mostly control **free** ends because joined ends are constrained to shared rest joints; Y scale changes join width. No softness or fill of unclaimed vertices is implemented. Test with real New01 before revisiting smoother bending.

Automated test coverage: six Fox chains including both near/far front and rear legs, exact seam equality, bone-midpoint coverage, 100/0 ownership, unequal widths; synthetic browser toggle → Save/preview. Actual iPhone visual acceptance pending.

## v1.1.17 — Bone-local rectangle guide tracks posed bone (22 October 2026; device validation pending)

**Preview/render contract:** Author hard-edge rectangle envelopes in the bind/rest pose and calculate vertex ownership there; never repick influenced vertices from a *posed* preview. When a Skin preview shows a non-rest pose, visualise the selected rectangle, its authored local X/Y offset and axis cross by applying the selected bone's same `mapBoneRigid` bind-to-posed transform as used for rigid binary skin vertices. Do not recompute its size from the posed segment length: preserve dimensions and local offset. In Rest preview, show the unchanged authored rectangle. This is visual-only and does not touch stored `animlab.skin-binding.v1` weights/rectangles, clipboard or keys.

Automated test: four upper leg bones under changed pose, nonzero local offsets and unequal X/Y scale; transformed guide corners agree with independent per-corner rigid map to floating-point precision, and box dimensions stay constant. iPhone/New01 visual validation pending.

## v1.1.3 — Atlas live preview, saved-generator regeneration, topology control (20 October 2026; iPhone acceptance pending)

This patch expands the unified source Atlas editor, **not** assembled Parts. A shape is built in its source pixel coordinates; UVs still follow source `(x/w,y/h)` directly. There is no separate UV workspace and no new Skin/Parts/rig binding. All three constructors show the **actual generated triangles** in preview before the user commits. Rectangle recomputes the grid as Across/Down change after drawing a box. Outline and strip first capture a control path, then `Preview topology`; editing controls or dragging the path handles re-generates the mesh in the preview without touching the saved document. `Commit mesh` stores a new named mesh, and `Cancel preview` abandons it. Selecting `Regenerate` for an Atlas-authored mesh reloads the generator data (rectangle box and X/Y subdivisions, outline source path/curve detail/interior spacing, or strip path/width/taper/Across/Along), previews a replacement, and `Apply changes` commits an undoable in-place replacement preserving mesh identity. Existing v1.1.2 generators are backwards-compatible; old `outline-spline.fillDetail` values seed the new `fillSpacing` UI when reopening but the geometry is not migrated until explicitly applied.

**Outline triangulation:** former triangle-centroid fan subdivision replaced with staggered interior spacing points, constrained ear clipping for the boundary and iterative interior edge swaps choosing improvements in minimum triangle quality. It is a safer starting point, not a guarantee of uniform quadrangulation/production topology for all shapes. `Connect verts` taps two opposite vertices across an edge shared by exactly two triangles, replacing the diagonal if the quad is convex. `Split face` inserts a centroid and forms three triangles, and `Trim face` deletes one selected triangle/remaps unreferenced vertices. Manual vertex/face edits mark `generator.edited`, requiring an explicit warning/confirmation before regeneration overwrites them. One committed face edit or completed vertex drag is one Atlas Undo/Redo record; undo buttons refresh immediately after edits. Canceled vertex gestures revert instead of committing an incomplete drag. **Atlas selection granularity:** `Select / Move` is the default top-level interaction: triangle-area hit selection and full-mesh translation (only editable, unlocked custom source meshes), retaining the same topology, moving all pixel-space vertex/UV positions and synchronising generator box/path controls so future regeneration stays at the new position. This is separate from `Vertices`, where individual source points are draggable, and separate again from the untouched assembled Parts workspace. Duplicated source meshes can be independently repositioned; legacy Fox source meshes can be selected but not translated. Entire moves are image-bounds constrained and one Undo/Redo record, with pointer cancellation rolling back the in-progress translation. In preview, construction control points can be moved, and changes remain transient until Apply. No free-form polygon deletion beyond triangular face trimming and no multi-face connect tool yet.

**Limits:** legacy Fox meshes are still read-only; custom Atlas source meshes still have no Parts/Skin/runtime bridge. There is no art-byte export/restore, GitHub path texture loading, or second-device support. Device-local IndexedDB imports must not be treated as a portable backup. Keep original PNGs. Tests were Node syntax + synthetic Chromium editor harness; actual iPhone performance/touch acceptance still pending.


## v1.1.2 — Atlas Stage B: mesh constructors and editing controls (20 October 2026; iPhone acceptance pending)

**Shipped candidate features:** Atlas inspector now separates **Navigate** (Pan/Fit/zoom), **Create mesh** (Rectangle, Outline spline, Spline strip) and **Edit selected mesh** (Vertices/Rename/Duplicate/Delete). The source mesh list does **not** impose an inner scroll at small counts; a long document uses the regular inspector scroll, and a dedicated list scroll begins only beyond 14 meshes. Rectangle **Across/Down are cell counts**, not pixel sizes: across=2 and down=2 yield a 3 × 3 grid of 9 editable vertices, 8 triangles. Their labels are now explicit: Across (columns), Down (rows).

- **Outline spline:** tap at least three source-image points around a closed region, set curve detail (Catmull–Rom subdivisions per control-point span) and optional fill detail (interior triangle refinement), then Close outline; checked for clear self-intersections, limited for vertex count, triangulated by ear clipping. The source control points and parameters are recorded under `generator:{type:'outline-spline',controls,curveDetail,fillDetail,edited?}` while the actual saved/UV-authoritative topology is the editable `{vertices,triangles}`. After creation, edit the generated vertices using Vertices mode (not the spline control handles; those are construction-only at this stage).
- **Spline strip:** tap two or more centreline points, choose full width in atlas pixels, end-tip width percentage, across cell count and interpolated along-span cell count, then Create strip. Generates oriented cross sections, tapered across the path; topology is saved with `generator:{type:'spline-strip',controls,width,taper,across,along,edited?}`. Source geometry and UVs share the same pixel-space vertex positions; no separate UV editor.
- **Actions:** newly authored meshes can be renamed, duplicated with fresh stable ID, or deleted after confirmation, each as one Atlas Undo step. Existing Fox-derived source meshes remain **read-only**, and all legacy saved layout/binding/weights/animation/gameplay data stay untouched. Source-list visibility, solo and lock remain transient.
- **Preview:** wireframe colours have lower opacity, ~0.58px unselected and 0.75px selected CSS-pixel stroke; an Atlas-only `Wireframes: All meshes / Selected only / Off` preference allows texture inspection without touching saved geometry. Alpha backdrop still offers Dark or Checkerboard. These view preferences never dirty Character Save.

**Still not delivered:** editable legacy mesh topology, editable *spline control points after creation* (generated vertex edits work), regeneration of existing spline meshes, integration of authored Atlas meshes into Parts / Skin / runtime, GitHub-relative image source pickers, and portable binary image export/restore. iPhone device review is outstanding. The local `animlab.atlas-document.v1` schema is extended with optional generator types but not migrated or version-bumped; existing v1.1.0/1.1.1 rectangles and PNG associations continue to load unchanged. No implicit writes during viewing.


## v1.1.1 — Atlas display polish (20 October 2026; iPhone review pending)

Atlas uses **Dark background** by default for transparent image pixels, with an optional **Checkerboard** preview. This only changes the canvas backdrop; PNG alpha/UV data are not modified. The Atlas-specific toggle persists per browser independently of Character Save/Undo. Selected meshes now draw a *thin, single-pass gold wireframe* without face tint, and their small edit handles appear only under **Vertices**. Atlas hides the shared Display panel, but exiting to Parts/Rig/Skin/Animate/Play restores the existing panel and prior state; Parts itself remains unmodified.

**Art source limitation (still open):** phone PNG import is locally persistent in IndexedDB, not automatically exported as image bytes; no GitHub-relative texture-path picker exists. Upcoming image packaging / optional repo-asset selection must preserve a portable art source while avoiding silent overwrites of baked assets. A GitHub-uploaded PNG is not discoverable by Atlas solely because it is in the repository.

## v1.1.0 implementation note — Atlas Stage A (20 October 2026)

**DELIVERED AS A TEST PATCH; iPHONE ACCEPTANCE PENDING.** v1.1.0 adds the sixth Atlas tab ahead of existing Parts. The Atlas view uses an isolated 2D canvas displaying the current character's bundled atlas (Fox uses the approved `fox-deform-atlas-v2.png`) or an explicitly imported transparent PNG. The six legacy Fox deform regions are projected from their procedural bind textures back to the *source atlas* for blue, read-only overlay/selection; their renderer geometry/weights are not converted, migrated, written, or changed by opening Atlas. Transient hide/solo/lock affect only the Atlas view.

**First editable geometry:** drag a rectangle directly over image pixels, select X/Y subdivisions (1–24 cells per axis), Apply with a name, drag its vertices, and use existing Undo/Redo/Save/Discard. Vertices are stored as `{x,y}` **pixel-space positions**. UVs are derived on read as `(x / atlasWidth, y / atlasHeight)`; triangles reference vertex indices. `generator:{type:'rectangle',x,y,w,h,cols,rows,edited?}` retains constructor metadata. No independent UV channel/editor exists. Source rectangles are saved under `sidescroll.animlab.atlas-docs.v1` → `{schema:'animlab.atlas-map.v1',characters:{characterId:{schema:'animlab.atlas-document.v1',atlas,meshes}}}`. Each mesh has stable generated `id`, `name`, `kind`, `vertices`, `triangles` and `generator`. Only an explicit Save creates/writes the key. This Atlas-owned map does **not** replace the legacy Fox procedural mesh definition or the character-library setup document. Creating a rectangle does **not yet produce a Parts-region / Skin binding / animation-renderable mesh**: that handoff is a separate task.

**Imported PNGs:** image bytes are stored in IndexedDB database `sidescroll-animlab-art-v1`, object store `atlas-images`, keyed by an immutable generated image ID. The Atlas JSON references `{kind:'indexeddb',id,name,width,height,bytes}`. A newly selected image is confirmed only through Save; existing Fox source PNG and runtime references are never overwritten. File validation currently requires PNG, <16 MB, dimensions 8–8192 and sampled alpha. Missing local binary bytes yield a visible error, not an invisible reassignment. Stored artwork persists locally across ordinary reload, but **does NOT accompany v205 single-character, Anim Lab, or global JSON backup/import**. Do not use this first version for sole-copy artwork or cross-device moves; portability and complete end-to-end editing are still acceptance gates. IndexedDB restore and iPhone device behaviour are not yet verified on-device.

**Baseline protection / source audit:** `walk-lab.js` handles stages/working copy, `anim-lab-ui.js` stage selection, `anim-lab-mesh.js` computes the Fox six-region procedural geometry from `fox-deform-atlas-v2.png` and cropped per-region textures; `anim-lab-art-layout.js` owns the existing assembled part transforms. `anim-lab-character-library.js` persists named/custom character setup and clips; `lab-data.js`/project snapshot currently capture localStorage strings but not image bytes. Geometry mapping is Fox-specific and read-only in this first step. Atlas document schema and UI are family-neutral, yet bridging authored mesh geometry to existing family renderers is not delivered. Tests: Node syntax; local Chromium inline-script DOM harness using original v205 snapshot Fox and `New01`, bundled fox atlas pixels; visit/no-dirty; 6 projected regions; create/Undo/Redo/Save rectangle; existing setup/library/sparse clip keys unchanged. Chromium/iPhone binary-import save/reload and global restored binaries are **not verified**.


Status: **character-authoring system under staged development.** v1.0.205 was the preceding delivered code milestone (Project Export/Restore Stage 1; second-device restore not yet accepted); v1.1.0 Stage A is a device-acceptance-pending test patch. v1.0.191 was the user-confirmed clean baseline; v1.0.192–201 delivered successive Parts/Rig/Skin/library refinements. **v1.1.0 Atlas Stage A is now a test patch (not iPhone accepted); further outline/strip, Parts/Skin parity and export portability remain planned.** User-imported character atlas/mesh authoring, animation template library and normal-game custom character selection remain outstanding.

## v1.0.200 — unified Character Library UI (19 Oct 2026, iPhone review pending)

All characters must use the **same visible opening workflow**: a fixed, compact **New · Load · Save** toolbar with a persistent `Loaded character: <name>` indicator and built-in/local saved/unsaved label. Do not permanently display old Hero 1/Hero 2/Fox buttons or make new characters use a different way of loading. **Load** lists Hero 1, Hero 2, Fox, then browser-local authored entries, in one list with Open. Only custom rows allow management (Rename, Export, Delete confirmation) behind an additional request; built-ins cannot be deleted. **New** asks for name and rig family; creates a local library document and opens it, automatically surfacing alongside built-ins on the next Load. **Save** saves the currently loaded character through the existing authoring session/checkpoint and Rig Rebind confirmation; no parallel persistence layer. The old separate Edit Session Save remains in DOM for integration but is hidden visually to avoid duplicate Save entry points; Undo/Redo/Discard remain. Built-in Fox may use its established Fox Handoff export; new characters can export saved JSON (not image pixels).

**Critical data contract:** This is a *unified UX*, **not** a migration of older character data. Legacy built-ins retain their current Hero/Fox save keys and gameplay identity (Hero 1/2's existing family-level clip behaviour remains). User-created `user-*` characters retain independent library documents under `sidescroll.animlab.character-library.v1` and existing `animlab.character-handoff.v1` JSON format. Import is still duplicate-safe. Only work the user explicitly Saves is committed; no switching/inspection can silently write. Local entries are editor-only until runtime character selection is developed; exporting is for backup or later packaging. The left inspector remains fixed horizontally with vertical-only scrolling, including iPhone rotation. Tests are desktop Chromium simulations; iPhone confirmation remains the acceptance gate.

## Goal

Character authoring should ultimately let a user create a playable character without adding character-specific game code: create/name a character, choose a rig family, start from placeholder art/mesh, tune the rig and collider, assign or create reusable animations, replace the art, test in Quick Play, save to a Character Library, then select that character from the normal game.

The system should not be designed around Fox-specific ownership. Fox is the current quadruped proof character; Hero 1/Hero 2 are the current biped examples.


## Approved next milestone — v1.1.0 Atlas-first 2D Mesh Authoring (20 October 2026)

**Status: APPROVED DESIGN; Stage A partially implemented in v1.1.0, remaining stages not yet delivered.** This is the authoritative new Atlas workspace specification; the earlier October 18 Parts/Rig/Skin design remains authoritative for its existing functions. v1.0.205 is the last delivered runtime milestone (global export/restore, not yet separately device-restore tested). The game/code implementation begins with v1.1.0 Stage A. The former documentation-only handover did not itself implement Atlas; refer to the v1.1.0 delivery note above for what is actually present.

### Purpose and visible workflow

After an ImageGen or artist-made transparent character atlas is supplied, the user must be able to author the character entirely inside Anim Lab rather than requiring ChatGPT to hand-create mesh/UV data for every new character. Add **one** new workspace before the existing Parts workspace:

**New / Load Character → Atlas → Parts → Rig → Skin → Animate → Play**.

The **existing Parts editor already moves/scales/rotates/reorders positioned artwork without affecting atlas coordinates**. Preserve it as-is. Do **not** create a second Character Layout editor, copy its controls into Atlas, or introduce a separate UV editor. The existing New · Load · Save Character Library remains the entry point; during New, a character may choose/import an atlas (or use a placeholder and assign one later). Biped and quadruped are current rig examples, not hardcoded limits on part labels/count.

### One unified 2D Atlas / mesh editor — no separate UV mode

The atlas image is the workspace background. Meshes are authored directly on top of it, **in atlas/texture coordinates**. For each vertex, its location over the atlas determines the sampled UV automatically (`u = atlasX / atlasWidth`, `v = atlasY / atlasHeight`, adjusted only for actual renderer coordinate conventions). Moving an authored mesh vertex over the atlas changes its shape **and its texture sample together**, just like editing vertices in a 2D UV-unwrapped image plane. These are **not independently editable UVs**; there is no separate Unwrap/UV-adjustment tab, duplicate UV transform, or 3D-like geometry/UV split. Storage/renderer may retain derived UV values for compatibility, but the user authors only the single 2D vertex position.

The atlas displays **all existing part meshes** in their real saved source-image/UV positions, including meshes of a loaded Fox/legacy character, not merely newly created parts. The part list allows named selection, Show/Hide, Solo, optional Lock, Rename, Duplicate and explicit Delete. Visibility/Solo/Lock are **editor display/control state**, not a hidden runtime change. Selecting or merely opening Atlas must never reconstruct, move, save or rebind meshes. Legacy meshes must initially be visualised without conversion; if some legacy topology cannot be edited safely, label that capability clearly and keep it read-only until an explicit, tested conversion is available.

### Mesh creation tools (all work directly over the atlas)

1. **Rectangle** — create a quad aligned to a drawn atlas rectangle; move corners/edges or change width/height, then select X and Y subdivision counts. New points and triangles remain mapped to the pixels beneath them. Suitable for simple rectangular/rigid cutouts.
2. **Outline spline** — place/edit points to follow the silhouette of a head, body or other irregular shape (close the outline), then generate a filled non-self-intersecting triangular mesh inside that boundary. Offer controllable subdivisions/internal density and regenerate/preview. Avoid triangles outside the outline or degenerate/self-crossing geometry; invalid outlines get understandable feedback.
3. **Spline strip** — place/edit a centreline along a limb, tail, neck etc.; set widths at points/ends, generate a ribbon mesh following the curve. Controls for subdivisions **along** and **across** the strip; allow tapering/width adjustment and eventually extra density at bends. Generated vertices use the atlas beneath their positions automatically.

Selection and tool editing should work with phone-sized hit targets, zoom/pan, numeric or pad-assisted precision where helpful, and clear Apply/Cancel/Undo. Start with the simplest usable tool if needed; **do not claim all three are delivered in the first increment until genuinely implemented**. Manual mesh vertex editing is part of the Atlas workspace, again not a distinct UV tool.

### Atlas-to-character semantics — the non-negotiable separation

- **Atlas owns:** image selection/identity, part identity/name, source-region mesh vertices/topology/triangles, subdivision/shape generator settings, and derived texture mapping. Geometry changes appear only after explicit edits.
- **Parts owns:** existing assembled-character placement X/Y, rotation, X/Y scale, pivot, draw order and neutral layout. These transforms are completely independent from the atlas-space authoring vertices. Moving a leg on the assembled character must not move its atlas sampling, and adjusting an atlas mesh must not teleport it in the character layout.
- **Rig owns:** rest bones/joints; **Skin owns:** bone influences/weight tuning/bind and pose-test diagnostics; **Animate owns:** clips/pose keys. Do not accidentally reintroduce the old Fox-specific assumption that Skin creates or repositions source topology. Atlas mesh shape edits must not implicitly move joints, pose keys, part layout, or the game-selected character.
- **Existing part identities, rig attachment names, rest sources and skin weights** must be retained on a safe no-topology-change edit. Topology changes add/remove vertices and cannot blindly preserve one-to-one weights: interpolate/remap weights where demonstrably safe, otherwise warn and require an intentional regenerate/rebind action. No silent destruction of authored skin or clips.
- Atlas import/replacement must be deliberate: validate PNG transparency/dimensions and ensure no existing character/art/UV/bind data is overwritten solely by browsing for an image. Preserve all Fox approved atlas PNGs and existing authored assets unchanged until explicitly replaced.

### Data / export / restore requirement (part of the feature)

A new character document must reference an actual durable imported atlas image and complete per-part mesh/texture mapping. **A file name, ephemeral File/Blob URL, browser-tab memory image or bundled-atlas path alone is not a portable custom-character export.** Design binary art storage deliberately (large images may need IndexedDB or durable equivalents), make **Single Character Export**, **All Anim Lab Data**, and **Global Project Backup/Restore** include/recover the necessary image bytes or an explicit self-contained companion package. Record storage ownership/schema/version/migration in `SIDESCROLL_EXPORT_COVERAGE.md`; cross-version imports must validate referenced bytes and notify about missing artwork. Keep the existing v205 JSON snapshot compatibility; don't promise imported pixels are backed up by the current system.

### Delivery / acceptance gates

- **A — Atlas workspace foundation:** new stage visible beside existing workspaces; select/import an atlas with safe preview; draw all loaded legacy meshes correctly over atlas; select/show/solo/lock without dirtying storage; reliable pan/zoom/rotation on iPhone. Parts/Rig/Skin/Animate/Play remain unchanged by entering/leaving Atlas.
- **B — Author geometry:** rectangle creation/subdivisions and explicit edits; outline-spline and centreline-strip tools with inspectable topology; name/duplicate/delete parts; saved, undoable edits surviving reload. UVs always follow atlas-coordinate vertices; no independent UV editor.
- **C — Downstream parity:** newly created named meshes show in **existing** Parts assembled layout; bind correctly in Rig/Skin; animate and Quick Play without Fox-specific code or six-part assumptions; no mode-switch drift. Existing Fox and Hero saves/animations unchanged.
- **D — Portability:** full character art bytes + mesh + rig + skin + clips travel in an export and restore on a second browser/device; Global Project Backup covers new storage. Game-runtime selection and baked GitHub defaults remain **separate future work** unless explicitly scoped into a later release.

**Regression minimum:** existing Fox and New01 part IDs/layout/rig/skin/animations round-trip unchanged when the new Atlas workspace is merely visited; new rectangle/outline/strip survives explicit Save/reopen; returning to Parts does not alter UV mapping; Atlas edits not saved are correctly Discarded; no cross-workspace silent writes or wrong texture; no unusable left drawer/safe-area/drag performance on actual iPhone. Browser tests alone are not device acceptance.

## Approved next design — coherent character-authoring workflow (18 October 2026)

**Status: APPROVED TARGET / PARTLY IMPLEMENTED.** v1.0.192 adds initial P1 controls; this table is still the *target* workflow, not an implemented feature list. v1.0.191 is the user-confirmed working source. Do not describe P2 separation or a new-character workflow as delivered. This section is the **single authoritative detailed specification** for new character authoring. The Engine UX Bible records only general invariants; Tasks records implementation and acceptance. Refer here instead of duplicating divergent versions of this design.

### The problem this solves

Fox artwork updates repeatedly entangled source pixels, atlas rectangles, rigid-vs-deform rendering, part transforms, rest joints and saved animations. The practical user goal is to arrange the artwork visually, place the rig to match the arranged artwork, then adjust skinning separately. Editing one layer must never silently reshape another. Work is phone-first (iPhone landscape Safari/PWA), with named left-side selection, stable right-side manipulation and explicit Save/Discard.

This is a **global system**, descriptor-driven for quadruped, biped and future rig families. Fox is the first six-region acceptance character, not an ownership boundary. Hero 1/Hero 2 become adopters, not parallel implementations.

### One visible end-to-end workflow

**Character → Atlas → Parts → Rig → Skin/Bind → Animate → Play** (Atlas is the approved v1.1.0 planned addition, not yet shipped; Character is accessed through New/Load and Play is an existing stage). Persistent top-level stage selection replaces competing Mode, View and Setup tabs whose scope is unclear. A stage shows only the inspector, controls and timeline relevant to that stage; optional display overlays never change which data is being edited. Do not change the existing `walk-lab.html` route just to rename navigation.

| Stage | Edits | Holds fixed / disabled while authoring | Leave-stage preview |
| --- | --- | --- | --- |
| **Character** | name/id, family, source art selection, movement/collider, animation slots/library links | all transform layers unless explicitly entering an editor | read-only summary / definition preview |
| **Atlas (planned v1.1.0)** | imported atlas and meshes authored directly in atlas space; texture mapping follows the same vertices | character placement, rig, skin weights and clips locked | meshes overlay source texture; entering is read-only until explicitly editing |
| **Parts** | art part X/Y, rotation, independent width/height scale, pivot, draw order | rest joints, animation keys, skinning/IK/deformation | posed skin preview recomputed from the current rest layout, with no visible snap in neutral rest |
| **Rig** | structural joints, bone lengths where applicable, hierarchy/semantic sockets | **artwork stays absolutely stationary in character space**; no skinning-driven part movement during joint drag | preview of newly matched skeleton + artwork with updated bind relationship |
| **Skin / Bind** | per-bone weights, attachment and bind controls; pose/deformation diagnostics | atlas mesh topology/texture coordinates, art layout and rest joints locked | compare rest/pose deformation and wireframe without changing anatomy |
| **Animate** | key poses, paw/IK targets, interpolation, clip editing | authored part layout, rest rig and mesh bind locked | normal skinned/rigged evaluation |
| **Play** | no structural authoring; use current working data for test | editing gestures and control overlays off | playable, return without erasing editor working copy |

**Rig mode and Part mode are rest-configuration editing, not animation posing.** They must present a neutral, unskinned authoring display while adjustments occur. If a user drags a joint in Rig, joint overlays move and the picture stays pixel-still; if a user moves a part in Parts, the skeleton stays pixel-still. Only Skin/Bind and Animate enable active deformation as appropriate. A bind-test overlay may be deliberately enabled for diagnosis, but it cannot change the stored data or hijack drag ownership.

### Parts — independent artwork assembly

Minimum per-part operations (including the Fox's Body+Head, Tail, Front Near/Far, Rear Near/Far):

- Select by an explicit named **part list** and optionally by a non-destructive viewport tap; do not start transforming artwork merely by touching it. The active drag pad operates only on the selected part.
- Move X/Y (Free, X-only, Y-only, Fine), rotate, **scale X and Y independently** plus linked/uniform scale. Display editable numbers and allow Reset Part / Reset Layout.
- **Draw order** is an explicit saved ordered list with Move Forward / Back (or accessible reorder controls), not an accidental result of mesh generation or part index. Provide a clear default far/back → near/front order, and show the stack in the list.
- **Copy/Paste** selected part transform; independently **Paste Position**, **Paste Rotation**, **Paste Scale**. Support near↔far counterparts where compatible. Operations are Undoable; clipboard itself is editor session state, not a persisted character change.
- Per-part **Show/Hide** and **Solo**, with Restore All; normal Hide/Solo is strictly an *editor visibility setting*, not saved character visibility or a removal from export/play. Selected part remains selectable in the list even when hidden. The reference image never becomes a part.
- Edit pivot/anchor separately (draw crosshair + numerical control), without surprising artwork jumps; transform pivot movement compensates translation so the visual part does not move until a later intentional transform.
- Preserve supplied transparent pixels, mesh region/UV coordinates and approved part identity during layout. Art import/replace is a separate explicitly confirmed operation; never regenerate atlases or paste old renderer files just to move a part.

Identity transforms must recreate the pre-editor display exactly. Move/rotate/scale and z-order must remain separate from bone pose and mesh weight data. Per-part visibility is a viewport preference; per-part render order is authored data.

### Rig — joints are independent of the artwork

- Enter Rig from the current arranged **rest artwork**. Freeze art in absolute character-local space. Structural joint handles, numeric joint positions, connected bones and bone-length diagnostics move freely *without moving the texture*.
- Use the same left named Control Board and bottom-right relative drag pad; preserve Free/X/Y/Fine, symmetric pair/copy aids and grounded-foot utilities where compatible with the rig descriptor.
- Distinguish **rest-rig joint edits** from **animated pose edits**. A structural edit modifies only the rest joint definition. It never writes keys, paw targets, collider, artwork transforms, mesh UVs or runtime character choice.
- On leaving Rig (or using **Preview Bound**) compute a *candidate* bind from the current art layout + current rest joints. Neutral rest must visually preserve the just-arranged artwork; preview should not snap pieces or change their sizes. Make the operation explicit/reversible with Undo/Discard rather than a hidden destructive rebake.
- If new rest proportions change how existing clips look, **warn and offer before/after preview**; retain the original animation data by default. Retargeting is a separate requested action, not an automatic side effect of moving rest joints.

### Skin/Bind — deliberate binding and diagnostics

- Mesh/skin uses character-space rest artwork, rest-bone matrices and UV coordinates as separate inputs. On bind, recompute inverse rest transforms so a rest pose has no incidental displacement: `poseBone * inverseBindBone` is identity at rest. Define part-local versus character-local coordinates explicitly; never silently treat atlas pixel offsets as rig/world coordinates.
- Editing a mesh vertex, changing weight influence or adjusting the bind pose happens only in Skin mode. Source art rectangle, art layout and rest joints are locked there, avoiding circular edits.
- Expose **Bind Preview** and **Difference / Reference** as opt-in diagnostics, **off by default**. Wireframe, per-part isolation, selected-bone weight overlay and neutral/pose A/B preview all share a consistent Display panel.
- On explicit Rebind, preserve region/part IDs and assigned source image rectangles; only update the intended bind-space relationships. If topology/weights must be regenerated, ask explicitly and retain a restorable snapshot. Never silently replace approved skin weights, animation keys or source imagery.
- Rigid-vs-deform comparison is a rendering diagnostic: it must not substitute the rigid 13-piece atlas for the six-piece deform atlas, swap rig families or rewrite authored data.

### Common interface grammar and display controls

Separate **WHAT I EDIT** (stage + inspector) from **WHAT I SEE** (Display). Display is one consistent collapsible section/drawer available from every stage, with the same labels and state, rather than opacity toggles scattered through Character, Rig, Parts and Motion Reference:

| Display channel | Required controls |
| --- | --- |
| Character artwork | Show/Hide; opacity 0–100% |
| Static silhouette/reference (e.g. Fox Shape / red overlay) | Show/Hide; source selector; opacity; fit/alignment; optional difference diagnostic |
| Motion reference | Show/Hide; opacity; linked/unlinked reference timing only while relevant |
| Bones / joint handles | Show/Hide; rig-family near/far visual distinction |
| Part boundaries / pivots | Show/Hide; selected part highlight; optional isolated part |
| Mesh / wireframe | Show/Hide; part/region selector; weight overlay |
| Ground / grid / ruler | Show/Hide; static ground separate from optional motion diagnostic |
| Rest/bind comparison | Optional Bind Preview, before/after or difference; defaults off |

Display settings should be editor preferences stored separately from character data, never add Undo entries or mark the character unsaved. Hide irrelevant controls rather than display disabled duplicate controls in multiple panels. Motion-reference transport remains subordinate to the authoritative animation timeline (the existing linked/unlinked contract still applies).

General viewport interaction: **named selection on the left, precision pad bottom-right, swipe/pan empty space, pinch zoom**; no unintended part/joint dragging by grabbing the sprite. Keep hardware safe areas, collapsible sections, consistent buttons/sliders and a stable view/pad while editing. The animation timeline is shown only where needed (Animate and optional playback reference) rather than occupying Parts/Rig authoring space.

### Transactions, preservation and migrations

- Each stage uses its own bounded working-copy edit session, checkpoint and Undo/Redo; a continuous pad gesture is one step. Save and Discard are explicit. Leaving dirty Parts/Rig/Skin must offer Save / Discard / Cancel, not silently auto-save/rebind or discard.
- Temporary stage preview may calculate derived bind/pose in memory, but only an explicit Save commits authoritative data. Switching view, Solo/Hide, scrubbing, Fit and difference overlays are view-only.
- Define stable independent data ownership: `CharacterDefinition` (ids/family), `PartLayout` (part id, rest transform, pivot, drawOrder), `RestRig` (semantic joints), `SkinBinding` (topology/UVs/influences/inverse bind), `AnimationAssets` (clips/templates), and `EditorDisplayState` (visibility/opacity/selection). Schema names here are conceptual until code is audited; **do not change persisted keys on assumption**.
- Legacy data must load non-destructively, with identity/default transforms and preserved atlas dimensions where appropriate. Any migration must be versioned, reversible or backed up; never write storage merely because the editor opened. Export should capture all authored layers and distinguish linked templates from bespoke assets.
- Do not conflate a local browser save with shipped repository defaults. Test reload, switching mode/character and gameplay consumption separately.

### Acceptance gates and implementation sequencing

**P0 — freeze a trustworthy source snapshot**: name the single exact working code baseline; confirm current app code/atlas files and known rig export. No previous speculative patch chain or unreconciled file references in the next session. Record checksums. This is not an invitation to redesign or repack textures.

**P1 — Parts editor finish**: draw order, copy/paste variants, solo/hide, independent X/Y scale and stable pivots; Move/Rotate/Scale per-part; no skeleton influence in Parts mode; identity = original rest preview; Undo/Save/Discard/reload all pass on iPhone. Use original six-piece atlas with no texture changes.

**P2 — Rig independence + rebind correctness**: joint drags must leave visible art fixed; neutral pose remains fixed on mode exit/rebind; animation data unchanged; clear before/after warning for poses that will look different. Test all four legs, tail root, neck and body.

**P3 — unified navigation/Display**: move scattered art/ref/red/transparency/mesh/ground controls into one panel and eliminate duplicate/conflicting toggles. Keep the expected thumb-pad and safe-area grammar.

**P4 — Skin/weight controls (then general Character/Animation Library)**: controlled mesh/weights/rebind tests, followed by global descriptor-driven character creation and reusable animation assets. Do not skip P1/P2 and jump straight to automatic re-authoring.

Minimum device regression on each stage: edit one near/far leg and tail; hide/solo and restore; copy position/scale; reorder front/far; adjust rig socket while art stays still; compare neutral before/after binding and Animate Walk/Run/Jump; Save/reload/Discard/Undo; switch to Play and back; pan/pinch at high zoom without accidental artwork changes; check iPhone landscape safe areas. **Only mark acceptance after user checks on device.**

### v1.0.191 status / why the next session must not assume completion

The supplied v1.0.191 ZIP was a **Part Layout restoration candidate**, aimed at the v1.0.173 code base. Its `PART_LAYOUT_README.md` explicitly lists six-region Move/Rotate/**uniform** Scale and Setup persistence; its experimental editor module has no completed draw-order, clipboard, solo/hide, independent XY scale or full independent-rest-rig/rebind workflow. User reports joint manipulation still drags the art and the display/transparency controls are fragmented. Thus P1–P4 above are **not implemented/accepted**; do not mistake code presence for workflow completion.

## P1 progress — v1.0.192 changed-files-only test patch (18 October 2026)

**Starting point:** user explicitly confirmed v1.0.191 was installed, working and ready for new features. `SS-BASE-191-REVIEW` is the frozen matching source and the sole parent of 192. The active six-piece `fox-deform-atlas-v2.png`, rigid atlas, clip banks, rig defaults and gameplay sources are unmodified.

Implemented for the *Fox descriptor as first adopter*, using existing Anim Lab Setup working copies: named selection; bottom-right Move / Rotate / Scale / Pivot; independent X/Y scaling (Free scales both); Fine/axis modifiers; numeric X/Y/Rotation/Width/Height/Pivot X/Pivot Y; stable pivot editing that compensates translation; adjustable **saved draw order**; Copy All, Paste All, Paste Position, Rotation, Scale and Pivot; Copy to near/far counterpart (position/rotation/scale only); Undo/Redo/Save/Discard through existing Setup machinery. Source shapes and animation keys are not edited. Hide, Solo and Show All are **transient, display-only**, do not dirty or save character data, and hidden part names remain selectable. Viewport drag remains pan/zoom only.

**Storage evolution:** Existing `animlab.art-layout.v1` under the Fox Setup key remains readable. Legacy `scale` values become defaults for new `scaleX`, `scaleY`; new optional `pivotX`, `pivotY` default to descriptor pivots; new `order` array defaults to the established six-region rendering sequence. Legacy data are normalised in memory; no localStorage write occurs simply by opening the editor. On explicit Save extended fields persist in Setup. The original scalar `scale` field is retained for backward compatibility, but the current mesh renderer uses scaleX/Y when present.

**Preview:** In Parts, the deform renderer shows the *unskinned* neutral bind vertices with authored transforms, even if the editor previously selected Rigid. This prevents pose-driven part movement during Parts operations; the skeleton and animation controls are unchanged. On leaving Parts, the **existing v191 skinning relationship is still in use**; the artwork can still move when structural Rig joints change and the neutral may not yet stay exactly fixed at a mode boundary. Part art bound geometry is still built from the current rest rig. Proper decoupled part-source/bind storage, independent Rig mode, inverse-bind/rebind and game-runtime use of layer ordering/transforms are **P2/later**, not provided by 192. No assertion of pixel-stable cross-mode reference or of full P1 acceptance until tested on the actual saved Fox in Safari.

**Validation:** JavaScript syntax and a headless Chromium DOM harness (scripts inlined because local host navigation is restricted) passed initial selection, view-only hide/solo, reordering Undo/Redo, transform paste variants, independently changed width, pivot no-jump math, numeric entry, pair copy and no mutation of rig/clip draft. Image loading on the actual PWA, drawing of the live deform atlas, iPhone touch/pinch and Save/reload in installed Safari **remain unverified**. Keep v1.0.191 safe for rollback. This test patch should be applied directly over 191, not over historical rejected patch experiments.

**Next gate:** user tests v1.0.192 on iPhone; repair any regression, then P2 rest-source/art/bind separation. This is an incremental P1 test, not a launch of Character creation or a completed generalised library.

## Core asset layers

A character is an assembly of reusable data rather than one indivisible blob:

1. Character definition — id/name, rig family, capabilities and references to the assets below.
2. Rig family — e.g. Biped or Quadruped; semantic joints, solver rules and default topology.
3. Rest rig — character-specific joint positions/proportions.
4. Skin/art — atlas/source imagery.
5. Mesh binding — vertices, UVs, triangles and bone weights.
6. Animation set — slots such as Idle/Walk/Run/Jump referencing templates or unique clips.
7. Movement setup — scale, walk/run speed, jump behaviour and collider.
8. Runtime capabilities — later character-specific gameplay actions where genuinely required.

## Animation library direction

Animation **type** and animation **asset** are separate concepts. `Walk` is a type; `biped_walk_01` is an asset.

Animation assets are compatible with a rig family and may be:

- linked template — reusable by multiple compatible characters;
- unique/bespoke — owned by one character;
- created from a template using **Make Unique**;
- promoted with **Save as Template**.

The existing Group/Puzzle Template vs Bespoke workflow is the behavioural model: editing a linked template is deliberate and potentially affects all users; Make Unique breaks the link before character-specific tailoring.

## Intended new-character workflow

**Updated v1.1.0 target workflow (not an implemented release):**

1. Character Library → New Character; name it and choose a rig family (Biped / Quadruped starters are examples).
2. Choose/import an atlas or continue with a placeholder; enter the **new Atlas workspace**.
3. Create or edit named part meshes **directly over the atlas** using rectangle, outline spline or centreline spline-strip; vertices determine the texture mapping automatically.
4. Use the **existing Parts workspace** to assemble the part meshes without changing their atlas mapping.
5. Match the rest rig and collider in Rig; bind and tune weights in Skin.
6. Assign/Create animation assets (reusable templates or Make Unique once the planned animation library is implemented).
7. Animate and Quick Play using current working data.
8. Explicitly Save to the Character Library; export complete data **and imported image bytes** once binary packaging is delivered.
9. In a later independent runtime milestone, choose the saved character in normal gameplay and promote approved content to GitHub build defaults.

Do not confuse an approved user workflow with delivered code. See the v1.1.0 Atlas specification above for data separation and acceptance.

## Deformable 2D skin model

The preferred direction is a hybrid of a few large deformable regions rather than one rigid plane per bone.

### Quadruped starting topology

- Body + head/neck: one continuous skinned region where practical.
- Tail: one separate long skinned region, visually overlapping the body at the root.
- Four complete leg regions, each extending into the shoulder/hip sufficiently to soften the socket transition.
- Near/far render ordering remains explicit.

The tail stays separate even if its artwork visually joins the body: its large independent curvature is easier to control and less likely to drag/stretch body triangles.

### Biped starting topology

- Torso/pelvis/head region initially kept relatively large; exact head split should be decided by motion/art tests rather than assumed.
- Complete arm regions with shoulder overlap.
- Complete leg regions with hip overlap.
- Hair/secondary layers remain separate where their motion requires independent control.

## Skin weights

First-pass weights should be generated automatically from semantic bones, not hand painted from zero.

- Each mesh vertex stores bind position, UV and bone influences.
- Start with at most **two bone influences per vertex**.
- Generate initial weights from proximity to bone segments/capsules and normalise automatically.
- Later Skin mode may allow selecting a bone/region and biasing weight toward/away from that bone, with a visual weight overlay.
- Do not build a miniature desktop DCC weight-paint application unless simpler correction tools prove insufficient.

## Runtime deformation

Stage 1 uses low-poly CPU-evaluated 2D linear skinning in Canvas as a proof. Each influenced vertex is transformed from bind-space bone coordinates into the current posed bone coordinates and the strongest influences are blended. Texture mapping is triangle-based.

The experiment must answer:

- Does the result materially reduce rigid joint/seam behaviour?
- Do shoulders/hips/knees/hocks bend convincingly with a low triangle count?
- Is texture stretching acceptable for the stylised art?
- Does it remain smooth on the target iPhone/PWA workflow?
- Can topology/weights remain simple enough for a touch editor?

Do not commit the whole character architecture to this rendering model until these questions are answered.

## Staged implementation

### Stage M1 — Fox deformable preview (v1.0.165)

- Anim Lab only.
- Recompose the existing rigid atlas into Body+Head, Tail and four complete leg textures at bind pose.
- Generate low-poly topology and two-influence automatic weights.
- Rigid/Deform comparison toggle and optional wireframe.
- No saved mesh authoring yet.
- No gameplay renderer change.

### Stage M2 — Mesh/weight authoring

Only if M1 is promising:

- Persist mesh definitions independently from animation clips.
- Mesh vertex/edge/triangle editing appropriate for touch.
- Auto-bind/rebind from current rest rig.
- Weight visualisation and simple correction controls.
- Save/Discard/Undo integration.
- Export mesh/binding with character data.

### Stage M3 — Runtime proof

- Consume saved skinned Fox in normal gameplay.
- Profile real movement, jump and camera conditions.
- Establish practical triangle/region budget for iPhone.
- Keep rigid fallback until the deform renderer is proven stable.

### Stage G1 — General character architecture

After mesh direction is known:

- Character descriptors instead of hard-coded Fox branches.
- Biped/Quadruped rig-family capability descriptors.
- Generic Quick Play.
- Generic animation export/import naming/schema with migration for Fox handoff v1.

### Stage A1 — Animation Library

- Named animation assets (`biped_walk_01`, `quadruped_run_01`, etc.).
- Add Animation, Use Template, Make Unique, Save as Template.
- Rig-family compatibility/retargeting through semantic controls.

### Stage C1 — Character Create + Library

- New Character flow.
- Starter rig/skin/animation package.
- Save to dynamic Character Library.
- Game character selector reads the same registry.
- Art Kit export / Replace Atlas round-trip.

## Architectural rule

Rig/animation/mesh/art ownership must remain separate enough that replacing one layer does not silently rewrite the others. In particular, final art should fit the approved rig/mesh binding workflow; image processing must not force a structurally sound rig to be redesigned merely to hide texture problems.

### Stage M1.1 — topology cleanup / twist check (v1.0.166)

The first M1 render proved deformation itself was promising, but its diagnostic topology exposed the transparent rectangular planes used to composite the old cut atlas and the generic distance-weighted limb grids could visibly twist during locomotion.

M1.1 therefore keeps the same six-region hybrid skin layout while changing how those regions are represented:

- crop temporary region textures to visible alpha before building geometry;
- Body + Head uses an alpha-culled grid rather than a full source rectangle;
- Tail and complete limbs use chain-aligned strips sampled against the visible texture width;
- strip cross-sections preserve a consistent side ordering through the posed bone chain to avoid the left/right crossing that produced leg twists;
- diagnostic wireframe may isolate one region at a time.

This does **not** yet define the final authoring representation. Stage M2 should preserve the principle that topology follows visible art and anatomy, but it may convert chain binding into explicit editable weights/vertices where that gives artists useful control. Do not build the weight editor around transparent atlas rectangles or non-adjacent automatic influences.

### Stage M1.2 — dedicated deformable source art (v1.0.168)

M1.1 proved that the cleaner chain/grid topology is readable and that the deformable approach is visually promising. M1.2 therefore stops rebuilding the skin from the rigid cutout atlas and gives the six deform regions their own continuous source art.

- Body + Head, Tail, Front Near/Far and Rear Near/Far are independent transparent source images.
- The source pieces are authored from a continuous side-profile Fox rather than assembled from one plane per bone.
- Far limbs remain visually distinguishable from near limbs, but both use the same deformation model.
- Dedicated source art is fitted to the already-approved bind-space region. Art replacement must not silently change rest-rig proportions or animation keys.
- The old rigid atlas remains a loading/failure fallback inside Anim Lab so the comparison tool cannot disappear because one new image failed to load.
- This stage deliberately does **not** add general weight-painting UI. The next bespoke Fox pass should tune shoulder/hip/body influence first, then use that experience to design the generic weighting workflow.

Acceptance focus:

- continuous regions should remove most of the visible rigid-atlas seams;
- neck/body, shoulder/hip and tail-root joins should be judged during Walk/Run rather than from a static bind pose alone;
- topology and source-art replacement should remain independent layers;
- iPhone performance should remain comparable to M1.1 because topology/triangle count is unchanged.

### Stage M1.3 — approved-source deform atlas (v1.0.169)

The exploratory six-image art pass established that dedicated deform source art works, but the production direction is one coherent atlas derived from the approved character source rather than six independently prepared images.

- `fox-reference-charcoal.png` is the visual authority for this Fox pass.
- `fox-deform-atlas-v1.png` packs Body + Head, Tail, Front Near/Far and Rear Near/Far into one transparent 2048 × 1024 texture.
- Near/far limbs derive from the same source; far variants may receive a restrained depth/value adjustment but must not drift into a different design.
- Region rectangles are explicit metadata in the mesh renderer; topology/weights remain separate from texture packing.
- Shoulder/hip source pieces deliberately overlap the torso enough to support smooth weighting. Visible attachment quality is solved primarily by skin weights, not by cutting a fake hard seam into the art.
- The six loose M1.2 images are now legacy exploratory assets and are no longer the runtime deform source.

The next pass should tune Fox-specific weights against this stable atlas before general weight-painting UI is designed.


Update 1.0.171
- Deform Fox body/head fit reduced and lowered slightly to better match the approved Fox Shape reference in Rig mode.

### Incremental P2a delivery — v1.0.193 (19 October 2026; developer test only)

**Stage status: IMPLEMENTED FOR FOX EDITOR; ON-DEVICE ACCEPTANCE OPEN.** Installed working v1.0.191 remains the user's accepted rollback; v1.0.192 was the preceding P1 test and must be installed before this changed-files-only patch.

P2a establishes independent `artRestRig` and `skinBindRig` snapshots inside the existing per-character Setup document, retaining all legacy storage keys and Fox mesh/art identifiers. On migration both snapshots derive from the **user's current rig**; merely loading or previewing does not write to localStorage. Parts/Rig are shown in stationary unskinned source-art coordinates. Art layout is now applied before deformation, around a rest-space pivot. In Animate, vertices deform relative to `skinBindRig`; the current rest rig drives the pose. Matching rest/bind gives identity at neutral. Chain vertices transfer offsets in the bind-chain tangent frame, and grid vertices use inverse rest bone mapping. No UV, topology, influence weights, atlas pixels or clip keys are regenerated.

Rig Designer now exposes transient off/saved/candidate walk deformation previews and explicit Undoable `Rebind to Rig` (changing the bind rest snapshot only). Prevent Save if the draft rest rig differs from its explicit binding; prompt the author to Rebind. Rebind leaves the fixed original art geometry unchanged, including while returned to Rig view. Snapshot ownership is capability-driven via rig adapter + art descriptor, despite Fox being the only current adopter.

**Unfinished:** device test on Safari; full before/after mesh difference and Skin weighting editor; runtime renderer reading stored binding; family-independent mesh definition and character creation; per-character animation libraries and in-game chooser. Current artwork may require weight tuning after extreme joint moves. Future stages must not label this first P2 editor increment a general character creation system. Do not silently regenerate approved Fox art or data.

### Incremental P2b — v1.0.194 Skin/Weight Editor (19 October 2026; Safari acceptance open)

**Device state:** v1.0.193 Rig/Parts separation was reported working as expected on the user's phone. v1.0.194 is a new test patch installed directly over v1.0.193, not a new approved stable rollback until verified.

The Character Setup tabs are now **Rig / Parts / Skin**. Skin is exposed for a family only when its adapter has editable rest/bind artwork support; Fox is the current adopter, with six existing regions. This is an *incremental skin-tuning editor*, not a general new-character builder or a new topology editor.

**Skin author's data contract:** Extend the *same* per-character Setup working copy with a separate optional `skinTuning` object: `{schema:'animlab.skin-tuning.v1',regions:{regionId:{attachStrength?,attachBlendDistance?,vertexWeights?}}}`. For chain/strip limbs and tail, `attachStrength` is the root-to-body blend (0–0.85) and `attachBlendDistance` is the distance along the chain over which it fades (0.025–0.35 local units). Default to each region descriptor's approved procedural values if not authored. For grid topology (Body + Head in the proof), `vertexWeights` holds sparse manual overrides keyed by stable vertex index; each override contains the full vector of influences in region bone order, normalised to 1. Existing procedural weights fill every non-overridden vertex. Never regenerate or reorder the 6 regions, atlas crops, UVs, bone list, mesh triangles, source art or clip keys when adjusting Skin. Rest art remains unchanged at Neutral, regardless of weights. All edits use Setup checkpoint, Undo/Redo, Save and Discard; merely entering Skin and switching previews is display-only. Legacy data without `skinTuning` remains valid and renders with previous default weights.

**Touch workflow:** pick a region from a button grid; Walk or Run preview a fixed phase (0/25/50/75%), or inspect Rest. For a chain part, tune root influence and fade along the strip, and copy tuning to its paired near/far region or reset the region. For the Body+Head grid, select a specific vertex with previous/next buttons or explicitly arm **Pick Vertex** before tapping its displayed dot; choose a bone from the region bone list and set that single vertex's weight while other influences re-normalise. Auto Vertex resets just that vertex. Selected region wireframe, vertex markers and selected-bone weight colour are transient. Skin mode temporarily hides global Bones visualisation, restoring the previous Bones View setting on exit; a user can show bones manually using View. Normal pan/pinch must not select or alter vertices unless Pick Vertex has been armed.

**Current integration boundary:** The authored values are interpreted by the Anim Lab Fox deform renderer and are included in the single Fox handoff JSON export. Existing **gameplay still uses its prior renderer**, so do *not* claim that edited skin is already reflected in Quick Play or Play mode. Runtime consumption, editable topology/UVs, non-Fox family descriptors, dynamic character creation and the clip/template/game character libraries remain planned. Keep Rebind-to-Rig's explicit Save gate. A structural Rebind updates the inverse-bind snapshot but never silently replaces manual weights; the user should review deformation on Walk/Run after rebind.

**Code test:** Node syntax; headless Chromium inlined DOM+actual four Fox/Hero atlases, mocked storage; Skin navigation, vertex weight edit, Auto Vertex, leg-root slider, near-to-far copy, Undo/Redo, save persistence, fixed neutral pixels under different weights, visibly different Walk rendering for 0.02 vs 0.85 influence, and temporary bone-overlay restoration passed. Actual iPhone Safari, pointer picking and normal gameplay deformation after saving have not been independently validated.

## Incremental P3a delivery — v1.0.195 (19 October 2026; device review pending)

**Status:** code-level UX framework delivered for iPhone testing, not yet approved on device. v1.0.193 was the last explicitly user-accepted test. v1.0.194 Skin must be installed before applying v1.0.195. This subsection records implementation; the Common Interface Grammar above remains the normative design target.

- One **Workspace** row selects Parts, Rig, Skin, Animate and Play through the existing character Setup, animation and play internals. Valid stage choices depend on the installed rig-family adapter. Editing tools are ordered before character-scale/collider utilities and the Clip chooser/timeline are visible only for Animate. Dirty transitions between editor stages are guarded by Save/Discard/Cancel.
- One collapsible **Display** row owns visible Art, Static Reference and Motion Reference channel controls and their individual opacities. Bones, Planes, Collider, Ground, Part outlines, Rig bind comparison, Parts difference, Mesh/Wireframe and source/alignment/reference timing are grouped under the same Display area. The original Static/Motion/reference input elements are physically moved, retaining original listeners and source-specific settings; duplicative art Ghost and Part reference opacity controls are hidden.
- Saved editor-only preference record: `sidescroll.animlab.editor-display.v1` (visibility of the six core display layers, artwork opacity and part-outline visibility). It never dirties or changes the character/clip data. Existing static-reference record remains `sidescroll.animlab.static-reference.v1`. Existing motion-reference record remains `sidescroll.animlab.reference.settings.v1`, now saved immediately as an editor preference; no additional Save/Discard requirement. Legacy saved settings are read in place, no migration that changes character data.
- Display/advanced subsections are collapsed on first use, preserving subsequent explicit collapse choices. Entering Rig no longer forcibly sets Art Ghost (opacity) or switches Static Reference, Ground, Collider on. Quick Play can temporarily use its normal internal overlay snapshot without overwriting stored Display choices. The iPhone thumb-pad remains on the bottom-right; neutral artwork/rest-rig, stored clips, binding and character renderer remain otherwise unchanged.
- **Known limits:** Fox is still the only Parts/Skin authoring adapter, Hero 1/2 continue with existing Animate/Rig tools; the Character Library, per-character templates and runtime skin consumption are future stages. Full cross-character menu flow, inspection overlays, reference-group defaults and panel density should be checked on Safari. The full P3 acceptance checklist stays open until the user approves the layout on device.


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


### P3d / v1.0.198 — Actual percentage Skin weights (19 October 2026; device candidate)

**Reason:** During v197 testing the small `Bone Influence` label made the author reasonably read a `295%` gain as if it were a vertex's actual bone weight. It was instead an *unnormalised relative multiplier*, applied before each vertex's weights were redistributed to total 100%. Capping that legacy gain slider at 1.0 would have silently changed saved results and would **not** make it an actual-weight slider. The new primary control changes its meaning rather than just changing the maximum.

**Authoring contract:** Skin remains **Region → Bone → Peak Bone Weight (0–100%) → Influence Spread/Falloff**. A `Peak Bone Weight` is the intended maximum **normalised per-vertex share** assigned to the selected bone over its part; it is *not* a 1–3× multiplier and not an instruction to set all vertices uniformly. Its influence envelope is derived from the region's existing automatic base weights and shaped by falloff. Other bones take the remaining influence and all vertices remain normalised to 1. The selected-bone heatmap shows actual weights, not slider targets. Display **Automatic peak** and **Actual peak** next to a large 0–100% readout so overlapping edits/advanced manual vertex weights can be understood. If several bones request impossible simultaneous peaks (or all bones are constrained), normalisation still wins: the displayed Actual peak can differ from the requested target. Manual vertex overrides remain authoritative at their vertices.

**Storage/migration:** Existing `skinTuning.regions[id].boneProfiles[index]` `{gain: number, spread: number}` are **not rewritten on load, Save or export**. They keep their v197 rendering and legacy multiplier semantics until the user deliberately moves that specific bone's new Peak Weight slider. The UI reports a legacy multiplier explicitly and shows the currently measured actual peak as its 0–100% starting position. On edit, that one profile is converted to `{peakWeight: 0..1, spread}` (removing `gain`) through the normal undoable Setup transaction; no other bones, copies or regions are changed. Zero peak must survive normalisation; the storage normaliser must use finite-number checks rather than `Number(x)||default` for this property. Mixed legacy/new profiles are supported. Copy selected Bone / Part / Both Legs mirrors either representation unchanged. `Reset Bone` removes either type of profile, reverting to automatic weights. Export keeps the existing one-file schema `animlab.skin-tuning.v1` with an optional `peakWeight` field — no global data migration and no clip, artwork, atlas, topology or bind changes.

**Testing boundary:** Chromium inline real-atlas/manual storage testing covers 0/15/75/100% peak, live heatmap and actual-peak readout, preservation of a user-supplied 2.95× gain until explicit conversion, conversion to 42% while far-leg 3× remains untouched, and Save checkpoint. iPhone Safari/touch and animation aesthetics are still for user review. Both Quick Play and game runtime continue to **ignore** Skin tuning. Follow this with descriptor-driven Character Creation/Library work only after validation.

## Stage C1a — Character Library foundation, v1.0.199 (19 Oct 2026)

**Implementation, pending device acceptance.** Implements the first safe, independently persisted character-definition documents, **not** a complete generalized editor/runtime. This supersedes any older header/status in this document claiming Character Library has no implementation; the full approved end-to-end target above remains authoritative.

- The Character Library now supports Create, Open, Rename, Delete (confirmation), and JSON Export/Import. User-created IDs are unique `user-*` IDs, independent of reserved Hero 1/2/Fox IDs. Records are versioned (`animlab.character-library.v1`) and saved under a dedicated localStorage key, separate from existing legacy Fox/Hero storage. Import creates a new ID rather than overwriting the saved original.
- New Character creation chooses an installed starter adapter (`fox` quadruped or `human` biped). A new quadruped clones **baseline/rest rig and default art layout + empty skin tuning**, along with **independent copies** of the shipped matching rig-family starter clips, into the new independent record. The existing bundled Fox art is a *placeholder*; this step does **not** generate new artwork or replace the atlas. New bipeds use the installed human animation/Setup adapter and a bundled Hero placeholder; biped Parts/Skin editing is unavailable until their own descriptor/mesh capability is provided. The build must label this limitation prominently rather than imply biped authoring parity.
- A custom character's working `setupDraft` and clips are isolated from shared runtime keys: Save on a custom entry persists only its library document, and does **not** call `FoxRig.saveRestRig`, `FoxRig.saveCollider`, `HumanRig.saveCollider`, `saveSparseBanks`, nor any family's legacy sampled animation write. Normalizer, renderer and inspector are still selected using the matching **rig-family adapter**, not a hard-coded new branch per character ID. The built-in Fox/Hero workflow retains its existing persistence and gameplay behaviour.
- Saved character documents include named metadata, rig family/starter, normalized Setup (rig/bind/art layout/skin tuning, movement & collider where implemented), and per-character sparse clips. Export `animlab.character-handoff.v1` includes this data but **not image bytes**; the starter atlas is referenced from the installed game. Import checks schema, starter, required clip objects, storage capacity and normalizes imported setup/clips. Character Library entries are local to the current browser until exported or otherwise backed up.
- Existing Fox Handoff remains a separate built-in-Fox tool and is deliberately refused for library entries to avoid accidentally combining custom setup with Fox's original clip bank. Only library Export is valid for custom entry backup.
- Runtime selection, artwork import, generic biped mesh+skin adapter, independent named linked animation templates / Make Unique, gameplay skin-tuning consumption, and game selection **remain open**. v199 is an acceptance gate for data separation and Character workspace before starting those features.


### C1c / P3e — v1.0.201 neutral workspace and current Fox starter (20 Oct 2026)

**Stage status: coded and desktop-smoke-tested; iPhone review outstanding.** On 20 Oct the user approved v200 New/Load/Save, but reported that artwork visually moved/drifted while switching workspaces and could not toggle deformable-plane outlines separately from the old rigid ones. Both exported samples were inspected: the unedited local `New01` uses a Fox-family `fox-authoring-baseline-1.0.159` starter, while the user's *current saved Fox* (`SS-FOX-RIG-ANIM-1.0.175(1).json`, export time `2026-10-20T06:47:08.643Z`) has a different full rig, art transforms, skin tuning and clips. The exporter legacy `animLabVersion` stamp is **not** the app release.

- For every **new** quadruped, `anim-lab-fox-starter.js` now provides an immutable **bundled data snapshot derived from that current Fox export**: scale, speed, collider, rest rig, *independent* art rest rig, binding rig, six-part layout/order, Skin tuning, and independently saved sparse Idle/Walk/Run/Jump clips. The new character receives deep copies and unique local ID; the built-in Fox and older local characters (including `New01`) are untouched. Biped starter is unchanged. No art PNGs are modified; all editor-created quads still use the current shipped Fox source textures. The starter is versioned with timestamp/source SHA-256 and loaded before `walk-lab.js`, with the previous shipped baseline as a defensive fallback if the starter module is absent. This is **not** a template-link system or live copy of the built-in Fox.
- Unposed Parts, Rig and Skin-Rest now share the same zero-motion Fox bind pose. Skin opens in Rest by default; Walk and Run remain opt-in pose previews. This removes an avoidable mode-dependent skeleton offset that could *look* like artwork drifting when changing workspaces. Do not write transforms or skin data during view changes. The exact on-device cumulative drift was **not** recreated in desktop automation; keep a repro test open if the user still sees it.
- Display has two **independent** toggles: legacy **Rigid Planes** (old pose/atlas rectangles) and **Deform Planes** (boundary edges of the six actual deformable mesh regions). Deformable boundary outlines are calculated from triangle edges used only once, follow neutral transforms or posed vertices, and can be enabled without the full wireframe. Neither toggle modifies character data. Mesh Wireframe remains the full triangle grid in advanced Display.

**Verification:** Source Fox JSON vs newly-created character: all `restRig/artRestRig/skinBindRig`, art layout/order, skin tuning, Idle/Walk/Run/Jump sparse keys matched after normalisation. In headless Chromium with real Fox art, repeated Parts → Rig → Skin → Animate → Parts returned byte-identical canvas screenshots across 3 cycles and no dirty/rig/part changes; Deform Planes toggle displayed actual region silhouettes. These are developer tests, *not* proof the user's iPhone drift is fixed. No gameplay/runtime selection/skin wiring.

### Global Project Snapshot & local character coverage — v1.0.202 (20 Oct 2026)

Project Backup is a **read-only, snapshot/audit tool** accessible from Home → Menu, not a Character Library Save/Export replacement. It serialises `sidescroll.animlab.character-library.v1` (all saved custom documents), all SideScroll-prefixed authoring entries including built-in Fox/Hero setup, rig/bind, clips, reference and display preferences, and the older `gamehub.walklab.anim.v*` animation keys. Both `localStorage` and the matching `sessionStorage` keys are scanned in raw form; no preflight migration or record normalisation is allowed during the export. Snapshot manifests explain exclusions and limitations.

**Important:** Custom character handoff JSON still does not package its referenced art PNG bytes, and in-flight unsaved edits are not part of localStorage. `v202` does NOT restore snapshots, promote characters into bundled runtime data, alter Fox/Hero storage keys, or replace per-character JSON handoff. Subsequent individual export-completeness audit must cover artwork payloads, templates and runtime parity before announcing portable character backups.

**Rule for future persisted features:** list storage owner/key, schema/version, whether it is authored or transient, scope of individual Export/Import, scope of global Export/Restore, binary asset dependencies, and migration strategy as part of the feature's acceptance criteria. Global inclusion is necessary but not sufficient: each appropriate Lab-level export must be independently complete and test-restorable.


### Project export handoff UX correction — v1.0.203 (20 October 2026)

The v202 Project Snapshot's captured data schema and scope are unchanged. In v203, `project-snapshot.js` prepares a real `.json` `File` **before** the user's export tap so `navigator.share({files:[file]})` is called synchronously from that tap, with no `title`/`text` field. This matches the working Lab export path and avoids the report of `text(3).txt` containing only the share title. The manual preview, redundant secondary Share action and automatic-click-on-prepared-file were removed in favour of one **Export Project** button, a status/count/size indication and a real JSON download fallback. No restoration, uncommitted data capture, asset embedding or character data mutation was added.


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



## v1.1.6 — unified Parts inspector and assembled-instance naming (21 Oct 2026)

- **Atlas** owns editable source meshes and the source texture; **Parts** owns instances referencing stable source mesh IDs. The Parts inspector is one list with per-row Select/Hide/Solo/Lock followed by the grouped Edit selected part controls. Selection has two aspects: checked rows are a multi-selection for inventory deletion; the most recently tapped row is the individual transform target. The latter cannot silently transform other marked rows.
- **Parts list tools** are Add (modal choose one or many saved Atlas meshes), Delete selected, Select all, Clear all (confirmation). Part inventory mutations are Setup edits, undoable, saveable, and never delete meshes/PNG from Atlas.
- **Per-instance name override** (`nameOverride`, optional) is the label assigned through Parts → Rename. It is stored on the assembled instance only; if empty, the display follows the Atlas mesh's current name by `meshId`. Adding/duplicating another instance does not clone a new source mesh or add `copy` to the source's name. Rename the source in Atlas when you intend to change all unoverridden instances.
- All normal transform/pivot/order controls remain under **Edit selected part**; legacy clipboard and reference controls move to the optional Advanced group. Hide/Solo/Lock are ephemeral and cannot change what is saved/exported. Lock blocks authoring changes while active.
- The path **Atlas → Parts → Rig** is still rigid preview. Arbitrary custom atlas-mesh Skin bind/deform, Animate/Play runtime integration, full portable image export and future Character Hierarchy/multi-atlas/shared clothing are separate incomplete stages; do not present v1.1.6 as solving them.

## v1.1.7 — Parts translation projection safety (21 Oct 2026)

Regression identified in v1.1.6: Atlas-backed inventory rendering disables legacy `art-layout-designer` overlays, which also means that plugin's `lastRender.view` is null. The legacy pad logic used `Math.max(1, view?.scale||1)` for sensitivity, accidentally dividing canvas pixel deltas by **1** instead of hundreds of canvas pixels per authored local unit. A short touch move therefore saturated the assembly instance's x/y normaliser ranges (-3…3, -2…3). This was a **UI transform error**, not deleted source mesh data.

The core now exposes `getPreviewView()` as a read-only snapshot of the active preview's `scale,cx,groundY,flipX`. `anim-lab-art-layout.js` uses it for Move/Pivot's CSS-to-canvas-to-local conversion in both assembly and legacy Parts modes. A missing/invalid scale suppresses the gesture instead of moving arbitrarily. Drag movement is clamped to the same normalisation limits. Installing the patch does not rewrite already saved offsets; users may Undo or restore X/Y manually in Parts. A DPR-2 Chromium regression reproduced pre-fix saturation and verified v1.1.7 movement, Undo and Redo; Safari/PWA checks pending.


## v1.1.8 — Assembled-parts multi-selection + dynamic Skin bridge (21 October 2026)

**Parts editing:** There is precisely one active current part in the inspector; ordinary tapping selects it exclusively. A separate explicit Multi-select mode collects a set of marked parts and uses a secondary highlight. Both pad and numeric inputs now operate group Move/Scale as one Undo transaction, applying identical *proportional X/Y scale factors* to each instance, without changing instance spacing or introducing a group pivot. Other inspector actions remain single-target. Hide, Solo and Lock are unchanged display state. Selecting several must not imply several simultaneously active inspector targets.

**Skin owner and pipeline:** Atlas still owns source pixel vertices/triangle topology/texture reference; Parts owns placed instance transforms; Rig owns bone links/joints. Skin now consumes dynamic `artLayout.assembly.instances` and current source mesh geometry (same character only), not the fixed six Fox `REGION_DEFS`. When assembly exists, dynamic Skin replaces the legacy panel/renderer. A per-instance optional `skinBinding` in the Setup art layout contains `{schema:'animlab.skin-binding.v1',meshSignature,group,weights}`, with `weights[vertexIndex]` holding up to four validated `[rigBoneLinkIndex,weight]` influences. Bone links are supplied by the active rig descriptor (`GameHubFoxRig.RIG_DESIGNER.boneLinks` currently); the UI exposes its joint-group choices. Auto-bind selected/all is explicit and undoable. Per-vertex weight edits, Rest/Walk/Run preview and selected group bone overlays are editor tooling, not topology creation. No implicit rebind occurs on entry to Skin or after Atlas changes.

**Stale binding guard:** the signature includes vertex order/positions and triangle list, but excludes mesh name. A signature mismatch or vertex-count mismatch labels the part **Needs rebind** and renders that part at the placed rest position in Skin/Animate/Quick Play rather than deforming with untrusted indices. Binding arrays survive renames and safe instance transformations (a moved/rotated part might merit an artist-initiated rebind for improved nearest-bone weights). The source atlas may be missing from the current device; a warning identifies absent image bytes, without deleting weights.

**Rendering:** The existing fox-deform renderer yields when Atlas assembly enabled; an Atlas source texture/UV triangles renderer takes over in Skin, Animate and Quick Play, and still uses the same separate neutral assembly renderer in Parts/Rig. Its skeletal deformation uses normalized per-vertex influence weights and explicit rest/posed bone segment mappings. The Anim Lab original-sprite load is no longer a prerequisite for showing imported assembled art. This is **Anim Lab preview parity only**; normal world/gameplay renderer integration, portable PNG bundles, multi-atlas references, other rig families and performance acceptance on iPhone remain future tasks. No automatic global changes to built-in Fox source or existing clip keys occur merely from opening the UI.

## v1.1.9 — Unified Atlas-assembly Skin weighting (21 October 2026)

**No parallel simplified Skin editor:** The v1.1.8 dynamic assembly bridge now presents the same interaction hierarchy established in Atlas and Parts: one current part list (Select/Hide/Solo/Lock, editor-local), followed by one contained **Edit selected part** inspector and a separate Rest/Walk/Run pose preview. Bones are the actual rig-descriptor `boneLinks` within an explicitly selected joint group. All skinning operations continue to consume live per-character source mesh IDs/vertices/UV triangles and Parts assembly instances; they never regenerate artwork or change the Parts/Rig/Animate documents on inspection.

**Restored weight controls:** Select a bone; Peak Bone Weight sets the actual maximum normalized weight for that bone (0–100%, including 0), and Influence Spread/Falloff shapes the spatial distribution relative to automatic weights (0.5–2.5×). A spread-only edit derives the unchanged automatic peak; it must work without requiring the user to move Peak first. Changes preview on slider input and commit as *one* Undoable Setup operation on change. Reset Bone removes the selected bone profile, Reset Part restores generated base weights, Auto Vertex removes one per-vertex override, and individual Vertex Weight edits redistribute the remainder among other bones to keep normalized influence rows. A Pick Vertex mode temporarily captures a tap on the primary viewport and otherwise does not interfere with pan/zoom. Matching part-instance bindings can be copied **only** when they reference the identical source mesh; do not blindly mirror indices to unrelated topology.

**Binding schema and backwards compatibility:** `setup.artLayout.assembly.instances[].skinBinding` retains schema `animlab.skin-binding.v1` and the existing final `weights` rows used for deformation in Skin/Animate/Quick Play. Its optional new fields are `baseWeights` (original automatic rows, same vertex order), `boneProfiles` (indexed by *rig bone link index*, each with optional `peakWeight:0..1`, `spread:.5..2.5`), and `manualWeights` (sparse overrides indexed by mesh vertex). `walk-lab.js` validates/round-trips the new fields in Setup normalization; existing v1.1.8 `{meshSignature,group,weights}` data loads unchanged, and an existing row becomes its fallback base only when explicitly first tuned. No bulk data rewrite on navigation or loading. Source topology/position signature invalidation remains strict; the user must explicitly Auto-bind after topology edits. All entries remain per assembled part-instance, not per source mesh.

**Alpha safety:** Never fade unselected texture triangles in Skin. All assembled source PNG triangles are rendered at full authored opacity, whether selected or not, and whether the weight heatmap is on or off. Heatmap is a separate optional *translucent colour annotation on top of fully opaque artwork*, not a reduction of sprite/mesh opacity. Default heatmap Off; optional thin selected wireframe. The original six-region Skin stays active only for legacy characters with no Atlas assembly. Global game render, portable IndexedDB image packaging, other rig-family support, future Character Hierarchy/multiple atlas/shared clothing remain unresolved.


### v1.1.10 — Skin rigid-bone weight integrity and diagnostics

- Skin profile-weight regeneration MUST never assign normalized residual influence to a bone that the artist explicitly set to zero when an intended nonzero bone remains. Regression: set both upper and paw profiles to 0 and shin/forearm to 100%; every vertex must resolve to the intended bone, not the first bone in the group.
- `Peak Bone Weight` only represents the maximum vertex influence, not universal vertex weighting; expose actual vertex minimum/maximum. For an unambiguous rigid test, `Rigid bind` writes one manual 100% influence for the selected bone to **each vertex** while retaining the automatic base. `Reset part` restores automatic weights.
- Single-bone skinning must preserve vertex pair distances and triangle area through pose changes (barring explicit length scaling by the rig); confirm the same on upper/middle/distal leg links. If rigid works but auto weights fold, investigate distribution rather than artwork or rig pose.
- Never reduce actual atlas artwork opacity for Skin visualisation; draw heatmap annotations over fully opaque triangles.


## v1.1.11 — Spatial Skin envelope semantics and performance architecture (21 October 2026)

**New optional binding mode:** Existing `animlab.skin-binding.v1` rows remain preserved. New Auto-bind emits `envelopeMode: 'capsule-v1'` and `envelopes` keyed by rig link index, each `{strength:0..1, inner:0..0.5 metres, outer:0..0.5 metres}`. An inner capsule covers the rest bone segment plus radius and yields full configured strength; from inner to outer radius strength tapers by `1-smoothstep` to zero. Two bone envelopes can overlap. Per-vertex effective sums are divided by `max(1,sum)`: overlaps above 1 normalize between active bones; residual below 1 is a **rest-space contribution**, not automatically another bone. This makes an isolated 0% bone truly zero and 50% halfway to deformation. The renderer uses `sum(weight_i * boneTransform(restVertex)) + (1-sum(weight_i))*restVertex`, divided by `max(1,sum)` for safety. Heatmap shows effective absolute selected-bone weights and does not reduce original texture alpha. Legacy normalized row data remains supported without conversion until an envelope control is edited or Auto-bind is explicitly run. Rig/IK solve itself is unchanged.

**Editor controls:** one selected bone, Strength 0–100%, full-influence Inner Radius and zero-influence Outer Radius, optionally visible drawn outlines around the **bind-pose** bone. Sliders update live, commit one Setup transaction on release; Radius controls stay ordered. Reset Bone/Part, manual vertex weights, rigid bind and topology safeguards remain. A whole-part rigid override is replaced when the artist next intentionally edits an envelope. Manually overridden individual vertices retain priority until removed; warn in the inspector. Bind data persists through existing Setup normalization, not a separate parallel Skin store.

**Performance:** the default Canvas2D triangle path draws only cropped source-image bounds; an optional WebGL compositor batches authored vertices/UV into GPU texture draws in Animate/Quick Play, while the fixed Fox renderer and legacy Atlas snapshot skip expensive state reads when the custom assembly has no builtin legacy parts, reusing atlas textures and falling back to Canvas2D when unavailable/context-lost. This is renderer-only: Atlas source geometry, Parts transforms, saved rig/bind arrays and clips do not change. `peekArtRenderState` / `getRenderDocument` are *read-only hot-path references*; never mutate them. Playback uses true elapsed clock time (250ms cap), throttles heavy editor UI checks/notifications, and preserves full refresh on actual edit. On-device test for imported 1448×1240 art and 6-part Fox remains mandatory.

## v1.1.12 — Single validated drawing path for Skin/Animate/Quick Play (21 October 2026)

The user confirmed that Skin can display changed poses without the dramatic corruption seen in all Animate poses. v1.1.11 introduced a **WebGL-only animated render branch** (Skin continued on Canvas2D); that GPU output was never validated because the automated browser could not create a WebGL context. v1.1.12 disables the experimental GPU branch without changing either skin weights or deformation maths. All three stages now draw the atlas source mesh via the same clipped per-triangle Canvas2D method, keeping cropped atlas-source sub-rectangle sampling for lower CPU cost.

**Investigation policy:** compare the same saved character and same clip pose in Skin and Animate with no intervening Auto Bind or weight edits. If this restores parity, investigate the WebGL compositor separately with pixel comparisons and a real Safari test before restoring a GPU option. If problems persist with one renderer, inspect pose/rig evaluation and final projected vertices next; do not guess or reset the artist's stored weights. Performance optimisation must be subordinate to correct geometry and identical UV mapping. The installed `anim-lab-assembly-gpu.js` is an inactive unused file after this changed-files-only release; its HTML script tag and SW precache entry were removed.

### v1.1.13 — CPU Atlas deformation/render cost (2026-10-21)

The legacy built-in Fox uses a small number of affine-transformed region draws, whereas an assembled Atlas character needs vertex deformation and textured triangle rasterisation. Therefore a custom Atlas assembly is heavier even with the same number of visible body parts. Capsule influence coefficients are prepared when binding/editing; *per-frame* costs are bone mapping, vertex transformation and rasterisation. After the v1.1.12 Canvas2D parity hotfix, v1.1.13 conservatively batches consecutive triangles with matching posed UV-to-screen affine mapping (within 0.18 canvas pixel at vertices) into shared Canvas2D clip+atlas draw calls. Deformed vertex coordinates and stored geometry/weight rows remain unchanged; rendering in Skin, Animate and Play uses the identical code path. Per-pose affine bone maps and immutable rest-rig / mesh checksums are reused. The public read-only `AnimLabAssemblySkinInspect.performance()` exposes triangle/draw-call diagnostics for future device profiling. This is a CPU improvement, **not** proof of production frame rate on iPhone or final skinning quality. WebGL remains disabled pending a pixel-parity implementation that works with real imported PNGs.


## v1.1.14 — Animate pose drag fast preview (22 October 2026)

The Animate precision/IK pad now holds a **transient, normalised per-frame pose** while dragging. Preview is applied to the viewport only; no sparse-clip recompile or authored pose/weight change occurs until pointer release. The selected IK target is interpreted using family/clip/phase and optional capture state from pointerdown. Pointer samples are coalesced to one `requestAnimationFrame` redraw; the last position is flushed on pointerup. Commit persists one sparse key and one Undo history transaction, while cancellation simply discards the temporary pose. Other setup editors continue using their established Setup transactions. `draw(...,skipEditorUi)` exists only to avoid full update/dirty/notify on this transient preview, not to change the animation renderer. If authoring begins during playback, stop playback so pose preview is visible. The actual atlas raster cost remains unchanged and needs iPhone acceptance.

## v1.1.15 — IK anatomy must agree with the saved rest rig (22 October 2026)

The Fox Rig editor and Animate share the same `GameHubFoxRig.geometry(...)` evaluation. The former IK implementation took a hardcoded side of the Socket → Wrist/Hock line: `frontNear/frontFar:+1`, `rearNear/rearFar:-1`. These signs were reversed relative to the current Fox authoring rest rig. IK activation at a paw position identical to FK/Rest generated the *mirror* elbow/knee, even without moving the paw, visibly twisting the legs during animation.

`GameHubFoxRig.ikBendSideForRest(restRig, prefix)` now derives branch side from the signed 2D cross product of `(Wrist/Hock - Socket)` and `(Knee - Socket)` in the saved rest rig; near and far follow their respective authored joints. A degenerate straight rest rig falls back to the corrected nominal Fox signs (foreleg -1, hind leg +1). It is **rest-dependent, not animated-target-dependent**. Both the preferred two-section IK solver and the overextension three-section fallback use this same branch. Do not separately hardcode a pole vector in Animate or Skin; they must read the common posed skeleton.

**Compatibility:** no storage schema change, no automatic rig or clip rewrite, no Atlas/Parts/Skin weight change. Existing saved IK poses may visually change because the old side was anatomically wrong. For completely straight limb rest setups, authored pole/branch editing may be a future feature; do not silently invent a dynamic frame-dependent branch. Regression: all 4 default limb FK→IK rest knees match within ~3e-17m, 24 lifted targets maintain segment lengths/side, and edited opposite rest configurations follow their newly authored side. Actual New01 iPhone acceptance remains pending.


## v1.1.16 Skin Stage 1 — binary rest-bone rectangles (IMPLEMENTED; opt-in)

The Atlas-assembly Skin editor has an additional binding representation under the existing `animlab.skin-binding.v1` schema: `envelopeMode: "rect-binary-v1"` with `rectangles: { [boneIndex]: {scaleX,scaleY,offsetX,offsetY} }`. These values are per assembled part. Rectangles are centred on each rest-bone midpoint: local X points along the bone's A→B vector, local Y perpendicular; X width = bone length × scaleX, Y width = 0.12 m × scaleY, offsets in local metres. The UI shows the selected rectangle; its four properties live-preview and commit via Setup history.

Binary coverage: a vertex contained by a rectangle is assigned only that bone at exactly 1.0. Multiple containing rectangles resolve exclusively to the smallest squared normalised local distance; outside all rectangles the vertex gets the empty row `[]` and stays in rest space. No soft falloff, no implicit weight redistribution, no blend across seams. Covered/unassigned vertex counts must be visible and can reveal why a partially bound part stretches. Fully covered by ONE selected bone => all vertices transform rigidly using translation+rotation only, not bone-length scaling. In Skin, Animate and Quick Play, `rect-binary-v1` uses this rigid path. The older capsule and legacy weighting calculation is untouched until the artist explicitly selects **Use binary rectangles** / **Auto-bind**; metadata is normalised and exported alongside the character's existing setup.

**Future stage, NOT implemented:** after validating rest-pose placement, complete-coverage controls and full-piece rigid behaviour on iPhone, consider a *separate opt-in* global border softening or secondary inner/outer rectangular falloff shape. Never add a smooth system before binary correctness is accepted. A hard seam can crease, and uncovered mesh triangles can stretch against rest-space vertices. No automatic claim-filling in Stage 1.


## v1.1.19 Skin Stage 2a — joint-owned influence shapes (IMPLEMENTED, opt-in; 22 October 2026)

The alternative per-assembled-part `envelopeMode:'joint-boundaries-v1'` is stored under **existing** `animlab.skin-binding.v1`. Each named rig joint in the selected link group owns one REST-space line in `jointBoundaries:{jointId:{width,rotation,offsetX,offsetY}}` (width dimensionless × 0.12 m full, rotation in degrees **relative to the rest-angle bisector**, offsets in metres in the averaged incoming/outgoing bone basis). An endpoint uses its only incident link direction. The line endpoints are calculated ONCE per joint, and each bone influence polygon is formed from its two endpoint lines. Thus the thigh and shin literally reference the same elbow cap in the bind pose. This is a separate authoring mode; **it does not silently replace** `rect-binary-v1`, its optional v118 Joint Fit, or old `capsule-v1` bindings.

`jointBoundaryGeometry()` forms one convex, oriented quadrilateral per bone and refuses inverted/self-crossing/too-short configurations rather than silently falling back to independent rectangles. Joint editor controls update a transient binding/preview and commit on release through Setup history. Manual vertex overrides remain in existing `manualWeights`, are dropped only on explicit conversion/reset/whole-part rigid replacement, and default rest coverage is recalculated from the authored lines. Rest-space region membership produces exactly one `[[boneIndex,1]]` row or `[]` (unassigned). The live pose still uses rigid bone transforms and the unchanged Canvas2D rasteriser. Posed guides transform their selected polygon with the owning bone: its shared REST seam will not necessarily meet after a rigid articulated bend. This must not be misrepresented as watertight animation geometry.

**Next stage NOT implemented:** a joint-owned per-seam blend distance yielding weights for only the two incident bones, preferably centred on the authored line with a normalized sum of 1; no dynamics/posed-frame rebinding. Stage 2a intentionally has no soft transition, no extra blend UI, no mesh subdivision, no rig/IK changes and no claim of improved animated knee volume. Live imported-art validation on iPhone remains required.


## v1.1.20 — joint-line rotated coordinates and terminal coverage (22 October 2026)

The `joint-boundaries-v1` system retains its **binary** rest-space ownership. A cap's local X/Y offsets are now applied **after** its rest-angle mitre rotation: X follows the rotated averaged chain tangent, Y follows the rotated joint-line normal. Rotating the mitre then moving Y therefore moves directly along the *visible line*. Separate per-chain **terminal** cap `endExtension` (metres) pushes the root outward opposite its only outgoing bone or pushes the tip outward along its only incoming bone; it does not affect internal shared joint lines or create new rig joints. End coverage supports artwork that extends above the hip/socket or below a paw; polygon validity constraints still refuse inverted regions, and no vertices are created automatically. A terminal extension of zero gives the previous cap length.

Backwards compatibility matters because a v1.1.19 saved binding already contains final computed weights from *pre-rotation* X/Y coordinates. Missing `jointOffsetFrame` means **legacy rest-axis display and exact original baked weights**, not an implicit rebinding. The UI shows equivalent post-rotation coordinates via a 2D inverse rotation. On the first deliberate joint edit, all authored X/Y values are transformed by `R(-mitreRotation)` with no net movement of any cap, `jointOffsetFrame:'rotated-v1'` is persisted, and weights are recalculated by the normal authoring operation. Newly converted parts start with that flag. `endExtension` defaults to zero. No blend distance is added in this release; that remains a separate future stage.

## v1.1.21 — Joint offset and whole-part guide refinements (22 Oct 2026)

Joint-boundary hard ownership `envelopeMode: 'joint-boundaries-v1'` is unchanged. All the bone influence regions belonging to the selected Atlas Part are now drawn concurrently in Skin when Influence guide is enabled; only the selected bone is highlighted. The selected joint cap remains orange, with rest-authored regions previewed rigidly under each bone as before. The guide is not authoritative for additional weights.

A rest-space joint cap can be moved after rotation in its rotated local frame. Non-self-crossing, non-inverted **concave** bone-region quadrilaterals are now valid (the existing winding hit-test supports them). User movement is bounded to the nearest valid cap location if the requested move crosses/inverts an adjacent polygon. Offset slider granularity is 0.001 m and ±0.001 m nudge buttons produce one Setup edit each. A separate terminal extension control is removed: adjust first/last joint Local X instead. Historic nonzero `endExtension` fields are folded into equivalent local X/Y coordinates during the first subsequent edit and omitted thereafter. Saved binary weights are not touched by patch installation alone. No interpolation or blend weights have been introduced.


## NEXT MILESTONE — Complete Character → Game workflow (agreed 23 October 2026; NOT YET IMPLEMENTED)

**Priority decision:** v1.1.21 is a sufficiently usable authoring checkpoint. Suspend further Skin smoothing, joint-blend distances, automatic remeshing, performance polish and removal of experimental Skin methods until a player can complete **New → Atlas → Parts → Rig → Skin → Animate → Save → select/use the authored character in the actual SideScroll game**. This is an end-to-end implementation target, not a request for another editor-only preview. Report progress stage-by-stage with real runtime tests.

**Two distinct rendering/authoring techniques MUST coexist.** (A) The original **individual rigid part technique**, where rigged sprite/atlas pieces transform individually (`Rig/FoxRig.partsForPose` and existing game-side part texture transforms); the built-in Fox/Hero workflows must keep functioning. (B) The newer **deformable Atlas mesh assembly**, where saved `artLayout.assembly.instances[]` reference stable Atlas mesh sources, their authored texture pixels/UV coordinates and `skinBinding` per-vertex bone weights, deformed through their saved rig/pose. Treat these as separate but supported character render paths, possibly allowing a per-part distinction in future. Do not silently convert all users to technique B, eliminate the classic technique, or mislabel legacy rigid pieces as if they have new mesh skin weights. A visible, explicit authoring-technique/status readout is desirable after the game handoff is working; preserve source-of-truth detection in the interim and document it now.

**Character Library blocking issue (user observed at v1.1.21):** after opening their custom `New01`, subsequent **Load → Open** row buttons no longer seem to work, preventing opening Fox/other characters. Diagnose with both clean and dirty Setup/Atlas sessions and on iPhone. `anim-lab-character-library.js` delegates to `core.selectCharacter(id)`; `walk-lab.js` `switchCharacter()` is behind `guardNavigation()`, which can require Save/Discard. This is a *hypothesis*, not a proven root cause; investigate whether the confirmation is hidden/covered, whether event listeners/actions run, and whether `isDirty()` is stale. Fix reliable switching, cancellation, Save/Discard, label updates and preserved unsaved work before expanding game integration.

**Source-of-truth / persistence currently in use (check exact live code first):** custom character metadata, Setup, animation clip banks are saved under `sidescroll.animlab.character-library.v1`. Authored mesh layout/topology lives in the separate `sidescroll.animlab.atlas-docs.v1` localStorage Atlas map, identified by stable character ID. Imported PNG bytes are in IndexedDB database `sidescroll-animlab-art-v1`, store `atlas-images`, not in character JSON export or global JSON snapshot. New joint-owned Skin mode is `joint-boundaries-v1` with rest-sampled exclusive 0/100 weights (no blend), alongside `rect-binary-v1`, legacy capsule, and legacy rigid-part pipelines. The game's `sidescroll.js` currently owns a separate built-in runtime character selection and WebGL atlas-part renderer; it does NOT yet use custom assembled mesh skinning or select New01. Preserve all original fallback paths. Same-origin device-local game consumption is a valid first test; it is not portable across devices / new installs.

**Suggested incremental delivery plan (new session may adapt after code audit):**

1. **Library reliability first:** reproduce and fix Load/Open after New01, including dirty guard semantics; establish browser tests and device checks. Keep data read-only until explicitly saved.
2. **Read-only saved-character resolver:** game discovers built-ins plus valid custom saved character IDs; loads rig family, Setup, clips, Atlas sources/instances and image assets, with diagnostics for missing IDs, image bytes, stale mesh signatures, unbound vertices or unsupported family. Add game character selection without breaking built-ins. Do not treat a custom character as a duplicate built-in texture.
3. **Runtime renderer parity for both techniques:** dispatch original rigid-part draw as-is when appropriate; provide deformable triangle mesh path with correct UVs/part transforms, bind/rest geometry, 0/100 or legacy weights, pose deformation, draw order, facing and camera/game scaling. Avoid importing editor UI into the game. The Anim Lab experimental GPU compositor was deliberately disabled in v1.1.12 due to distorted output; any WebGL runtime mesh renderer MUST be checked for pixel/geometry parity against the correct Skin/Animate path and tested on mobile Safari.
4. **Gameplay pose driver:** saved custom idle/walk/run/jump clips drive the runtime rig; match authored timing/phase, safe fallback for absent clips, correct IK branch and no abrupt texture/scale jumps. Integrate with existing movement, camera/grounding/collision; do not change game physics just to accommodate new character graphics.
5. **End-to-end roundtrip:** New01 edits Save → game select New01 → actual movement/run/jump through world → return to Anim Lab, adjust and save → reload game and see revisions; test switching back to Fox/Hero, reload/offline and corrupt/missing art handling. Classify initial success as **same-device local browser**. Cross-device portable atlas-image export and GitHub-repo promotion are future deliverables, not silently assumed complete.

**Explicitly deferred:** per-joint Blend Distance/soft transitions; cleanup/migration of capsule and other experimental Skin implementations; a prominently labelled rigid-vs-mesh selector if unnecessary for MVP; Character Hierarchy; shared/multi-atlas wardrobe; an unvalidated GPU renderer; full automatic image-inclusive export. Record these, do not remove saved fields or legacy rendering. Consider technique label as a low-risk UI polish once runtime works.

**Release discipline:** latest accepted target v1.1.21; each subsequent `SS-PATCH-<version>.zip` contains ONLY files changed in that release, installs directly over the immediately previous accepted version. Root `README.md`, `README.txt`, and `README-PATCH-<version>.md` must cover **that drop only**. Canonical technical docs are cumulative. Use actual latest user's deployed full build as baseline if supplied, not an inferred reconstruction; do not assume New01's actual imported PNG is inside repository ZIP or JSON export. Automated Chromium checks are not proof of iPhone Safari behaviour.


## Character Lab naming + extendable animation architecture (23 October 2026; AGREED DESIGN, NOT IMPLEMENTED)

### Scope and branding

**Anim Lab becomes Character Lab in the user-facing product** because it owns character creation, Atlas, Parts, Rig, Skin, Animate, the Character Library and Play. Retain existing file URLs (notably `walk-lab.html`), `anim-lab-*` source modules, `animlab-*` DOM/class identifiers, browser-storage keys and exported schema names until a separately audited migration is necessary. Naming-only UI edits must not alter saved character IDs or invalidate offline/PWA links. Existing documentation history keeps its original names; future UI descriptions use **Character Lab**. The workspace still includes **Animate**; the name change does not erase animation authoring.

### Actual current functionality — verified against v1.1.21 source

- The Character Lab clip strip and `walk-lab.js` clip sets are fixed: **Biped/Human:** Walk, Run, Jump; **Quadruped/Fox:** Idle, Walk, Run, Jump. Biped Idle is presently a runtime rest/walk-derived pose, not a separately editable clip. Custom character sparse clips currently inherit their rig family's fixed keys, each with a 16-frame sampled/evaluated authoring path. There is no dynamic **New Animation** entry.
- **Climb already has a gameplay animation, but not an editable clip**: `sidescroll.js` computes humanoid climbing poses from climb-path world movement (`poseForClimbing`); on Fox, climb currently reuses a Run/scramble clip. Do **not** mistake a procedural gameplay pose for a saved Character Lab clip.
- **Pick Up**, **Put Down**, and **Carry** already have gameplay behaviour/visual posing, but not Character Lab assets: the humanoid uses procedural `poseForCarrying()` mixed over its regular pose, with reach and timing curves; object pickup/putdown transform is controlled separately by interaction state and `interactionCrateTransform()`. The Fox deliberately does not receive humanoid arm transforms. Push also uses a procedural humanoid pose, and remains a potential later animation category.
- Existing editor-saved characters, source Atlas documents, rig/skin assembly, game runtime rigs and gameplay object-state machines are separate owners. **No claim is made that an arbitrary new animation currently plays in the game**.

### Separate the three things we need

1. **Animation Asset Library** — named, reusable authored clip definitions with stable asset IDs, semantic rig family and compatibility requirements; e.g. `biped_climb_01`, `quadruped_walk_01`. Assets are independent of any one character by default and can later be linked or copied.
2. **Character Animation Set** — a per-character list mapping **gameplay action slots** (`idle`, `walk`, `run`, `jump`, `climb`, `pick_up`, `put_down`, `carry`, eventually `push`) to an animation asset or character-owned clip. It is also allowed to hold extra named custom actions; **having a clip in the library is not equivalent to binding it to a gameplay action**. Optional or incompatible slots may remain unassigned and use explicit safe fallback behaviours.
3. **Runtime action/pose controller** — game state selects the action and drives phase, transitions, blending, facing, movement constraints and held-object placement. The game owns collision/trajectory/climb-path/pickup state; the animation describes the pose, not the puzzle result or physics motion. Never copy a whole editor UI module into `sidescroll.js` just to get a clip.

**Proposed asset fields, subject to an explicit versioned schema design:** stable ID, display name, semantic action/type, rig family/required semantic joints, interpolation/looping, authoring keys and sample-rate/frame-count assumptions, effective cycle timing or distance-based stride, ownership/link status, optional contact/handhold/event markers, and optional body-region/channel mask. Preserve the current `animlab.sparse.v1` 16-sample clips and both original rigid-part and deformable-mesh character formats; any new schema must have an explicit reader and migration, not reinterpret existing `sparseClips` silently. A shared asset should not become corrupted when one linked character changes rig proportions.

### Expected Character Lab Animate UI (design, not currently shipped)

The hard-coded four-button strip becomes a **scrollable/list-based Animation collection** for the selected character, exposing the **assigned action slot**, chosen animation asset/name, compatibility and local/linked ownership. Actions: **New Animation**, **Duplicate**, **Rename**, **Edit**, **Assign/Replace**, **Unassign** (where safe), **Make Unique**, and **Save as Template** when library stage ships. Creating an animation offers **Empty/Rest Pose**, **Duplicate current**, or **From compatible Template**; asks for name and whether it should be assigned to a gameplay action; opens the existing Animate key-pose editor. The animation is in the *working copy* until explicit Save. Create and delete must participate in Undo/Redo, dirty guard, Discard and export coverage. Editing a linked template must warn about affected characters, while Make Unique isolates the selected character. The user must be able to inspect unassigned custom animations without damaging standard locomotion slots.

### Gameplay action requirements and compatibility

| Action slot | Runtime truth now | Proposed authoring/trigger contract |
| --- | --- | --- |
| Idle | Fox editable; Biped not individually editable | Every supported family should expose a proper editable idle or explicit rest-pose fallback. |
| Walk / Run / Jump | Fixed editable clips | First runtime milestone consumes existing saved clips unchanged. Moving in world and jumping remain game-owned. |
| Climb | Human path-driven procedural; Fox Run/scramble fallback | Convert the **visual motion** into an editable family-compatible Climb animation seed; game climbing path owns height, speed, entry/exit and foot/handhold anchors. Phase follows path distance where required. Provide family-specific fallback or disable invalid assignment visibly. |
| Pick Up / Put Down | Timed gameplay interaction with procedural human reach pose | Make two editable **one-shot** clips with event markers for grasp/release and sensible transition timing. Game maintains object ownership, snap/settle and interruption rules. Do not replace item-state logic with keyframes. |
| Carry | Humanoid arm pose applied on top of walk/run; Fox not humanoid-posed | Model as optional **pose overlay/upper-body mask** (where rig supports it) or full-body carry locomotion variant. Retain locomotion lower body and held-object anchor for walking and stopping. Capability/rig family governs availability; no mandatory human-arm data on quadrupeds. |
| Push (later) | Procedural human pose | Record as candidate future overlay/action; not required for first expanded-clip delivery. |

**Retargeting/reuse**: a biped clip is *not* automatically valid on a quadruped merely because they both have a `walk` slot. First share clips with matching rig family and semantic control mapping; offer explicit **Copy/Retarget** only when the required joints, IK goals, contact markers and pose channels can be mapped. Preview mismatch and retain source. No automatic retarget when the user selects a different character, switches rigs or edits rest proportions. A clip may be stored unused/incompatible, but cannot be assigned to an action without a warning/disabled state. Rig family is distinct from rendering technique: an animation can apply to rigid parts and deformable meshes **if both are driven by a compatible pose rig**.

### Full pipeline and staged acceptance

Keep the existing agreed first milestone **New → Atlas → Parts → Rig → Skin → Animate → Save → select/play in the actual Game**. Avoid inserting a universal animation-library migration ahead of the first working runtime round-trip. However, design the runtime resolver as `character → animation-slot map → clip data → family pose → rigid/deformable draw` so adding actions will not require a second character architecture.

- **Gate 0 — Reliability and brand:** fix New01 Load/Open problem and unsaved-change guard; change **visible** Anim Lab labels, home tile, help and accessibility text to Character Lab. Keep storage keys/URLs/module names stable. This is the next low-risk code drop; code has not yet been changed by this document update.
- **Gate 1 — Actual game MVP:** resolve local saved characters/IndexedDB art, support both rigid and deformable render paths, apply their current Idle/Walk/Run/Jump clips, and prove New01 round-trip in normal gameplay on the user's phone. Built-ins, collisions, puzzles and old storage remain intact. An existing action-slot adaptor may initially bind the four known clips.
- **Gate 2 — Expandable clip foundation:** replace hard-coded Animate clip buttons with dynamic per-character clip list; add New/Duplicate/Rename and per-action assignment, custom/unassigned clip support, explicit defaults and versioned saved-data compatibility. Biped Idle becomes a visible/editable asset. First allow **unique local** animations; shared links can be introduced after unique clips are stable.
- **Gate 3 — Climb editable in lab and used in game:** bridge current procedural climbing movement/pose to a saved Climb action slot with world-distance phase/contact handling, including graceful biped/quadruped differences. Test climb up/down, entry/exit, left/right and reload without breaking the climbing system.
- **Gate 4 — Pick Up / Put Down / Carry:** author one-shot grab/release clips, upper-body or full-body carry variants, and rig-specific affordances; separate animation events from object ownership/placement. Test locomotion while carrying, facing changes, cancel/putdown and character switching.
- **Gate 5 — Reusable Animation Library:** templates, browse/apply, link vs Make Unique, ownership and propagation confirmation, family compatibility and *explicit* preview-based retargeting. Promote proven clips into starter packs for biped/quadruped. Cross-device asset-inclusive export/restore follows as separately testable packaging work.

**Proof gates:** New01 must display matching authored pose in editor and game; generated animations must persist after Save/reload; a new named clip must be assignable to a compatible character and its selected gameplay action; incompatible rig must be explained rather than crash; linked-template edits must never silently rewrite other characters; both rigid/deformable character types must continue rendering and old projects must still load. Testing on real iPhone Safari and offline PWA is distinct from automated Chromium checks. Until runtime acceptance, do not polish Skin or clean up historic experimental weights.

### Character Lab v1.1.22 (23 Oct 2026; release candidate, DEVICE TEST PENDING)

Gate 0 code changes: visible Character Lab rename; Load panel stays open after selection, can open a different character from Quick Play and safely returns to authoring; dirty Save/Discard/Cancel remains authoritative. The pending-confirmation result is explicit rather than reporting an immediately successful open. The guard remains visible if Save/rebind is rejected. `walk-lab.html`, `anim-lab-*` files, old storage keys and exported schemas are NOT renamed. **On-phone New01 switching tests still required.** Runtime custom playable characters and additional animation authoring remain later gates.
