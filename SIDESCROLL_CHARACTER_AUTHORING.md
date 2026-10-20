# SideScroll Character Authoring & Animation System

Status: **approved end-to-end workflow (18 Oct 2026), under staged development.** v1.0.191 is the user-confirmed clean stable baseline. Parts, independent rig/bind, skin and UX refinements have been delivered incrementally in v192–v198; user acceptance is per-drop. v1.0.199 adds the first editor-only Character Library/data isolation stage; v1.0.200 unifies built-in/custom character access under a compact toolbar and corrects sidebar drift, **pending iPhone acceptance**. Artwork import, shared animation templates and normal-game custom-character selection are not implemented.

## v1.0.200 — unified Character Library UI (19 Oct 2026, iPhone review pending)

All characters must use the **same visible opening workflow**: a fixed, compact **New · Load · Save** toolbar with a persistent `Loaded character: <name>` indicator and built-in/local saved/unsaved label. Do not permanently display old Hero 1/Hero 2/Fox buttons or make new characters use a different way of loading. **Load** lists Hero 1, Hero 2, Fox, then browser-local authored entries, in one list with Open. Only custom rows allow management (Rename, Export, Delete confirmation) behind an additional request; built-ins cannot be deleted. **New** asks for name and rig family; creates a local library document and opens it, automatically surfacing alongside built-ins on the next Load. **Save** saves the currently loaded character through the existing authoring session/checkpoint and Rig Rebind confirmation; no parallel persistence layer. The old separate Edit Session Save remains in DOM for integration but is hidden visually to avoid duplicate Save entry points; Undo/Redo/Discard remain. Built-in Fox may use its established Fox Handoff export; new characters can export saved JSON (not image pixels).

**Critical data contract:** This is a *unified UX*, **not** a migration of older character data. Legacy built-ins retain their current Hero/Fox save keys and gameplay identity (Hero 1/2's existing family-level clip behaviour remains). User-created `user-*` characters retain independent library documents under `sidescroll.animlab.character-library.v1` and existing `animlab.character-handoff.v1` JSON format. Import is still duplicate-safe. Only work the user explicitly Saves is committed; no switching/inspection can silently write. Local entries are editor-only until runtime character selection is developed; exporting is for backup or later packaging. The left inspector remains fixed horizontally with vertical-only scrolling, including iPhone rotation. Tests are desktop Chromium simulations; iPhone confirmation remains the acceptance gate.

## Goal

Character authoring should ultimately let a user create a playable character without adding character-specific game code: create/name a character, choose a rig family, start from placeholder art/mesh, tune the rig and collider, assign or create reusable animations, replace the art, test in Quick Play, save to a Character Library, then select that character from the normal game.

The system should not be designed around Fox-specific ownership. Fox is the current quadruped proof character; Hero 1/Hero 2 are the current biped examples.


## Approved next design — coherent character-authoring workflow (18 October 2026)

**Status: APPROVED TARGET / PARTLY IMPLEMENTED.** v1.0.192 adds initial P1 controls; this table is still the *target* workflow, not an implemented feature list. v1.0.191 is the user-confirmed working source. Do not describe P2 separation or a new-character workflow as delivered. This section is the **single authoritative detailed specification** for new character authoring. The Engine UX Bible records only general invariants; Tasks records implementation and acceptance. Refer here instead of duplicating divergent versions of this design.

### The problem this solves

Fox artwork updates repeatedly entangled source pixels, atlas rectangles, rigid-vs-deform rendering, part transforms, rest joints and saved animations. The practical user goal is to arrange the artwork visually, place the rig to match the arranged artwork, then adjust skinning separately. Editing one layer must never silently reshape another. Work is phone-first (iPhone landscape Safari/PWA), with named left-side selection, stable right-side manipulation and explicit Save/Discard.

This is a **global system**, descriptor-driven for quadruped, biped and future rig families. Fox is the first six-region acceptance character, not an ownership boundary. Hero 1/Hero 2 become adopters, not parallel implementations.

### One visible end-to-end workflow

**Character → Parts → Rig → Skin/Bind → Animate → Play** (the Character and Play stages may open as workspaces rather than a transient subtool). Persistent top-level stage selection replaces competing Mode, View and Setup tabs whose scope is unclear. A stage shows only the inspector, controls and timeline relevant to that stage; optional display overlays never change which data is being edited. Do not change the existing `walk-lab.html` route just to rename navigation.

| Stage | Edits | Holds fixed / disabled while authoring | Leave-stage preview |
| --- | --- | --- | --- |
| **Character** | name/id, family, source art selection, movement/collider, animation slots/library links | all transform layers unless explicitly entering an editor | read-only summary / definition preview |
| **Parts** | art part X/Y, rotation, independent width/height scale, pivot, draw order | rest joints, animation keys, skinning/IK/deformation | posed skin preview recomputed from the current rest layout, with no visible snap in neutral rest |
| **Rig** | structural joints, bone lengths where applicable, hierarchy/semantic sockets | **artwork stays absolutely stationary in character space**; no skinning-driven part movement during joint drag | preview of newly matched skeleton + artwork with updated bind relationship |
| **Skin / Bind** | mesh vertices/topology, UV placement where expressly intended, per-bone weights, bind controls | art layout and rest joint positions locked | compare rest/pose deformation and wireframe without changing anatomy |
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

Later visible workflow:

1. Character Library → New Character.
2. Name character.
3. Choose Biped / Quadruped starter rig.
4. Receive a generic placeholder atlas + starter mesh/binding.
5. Adjust rest rig and collider.
6. Assign animation templates or Add Animation.
7. Make selected animations unique where character-specific tailoring is needed.
8. Tune skin mesh/weights.
9. Quick Play using current working data.
10. Save to Character Library.
11. Normal game character selector discovers the saved definition dynamically.
12. Export an Art Kit / atlas guide, replace artwork later without destroying rig, weights or animations.

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
