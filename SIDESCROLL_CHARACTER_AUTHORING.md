# SideScroll Character Authoring & Animation System

Status: original mesh proof recorded historically; **coherent authoring workflow approved 18 Oct 2026. v1.0.192 is the first P1 editor-tools test patch, not yet accepted on iPhone; P2/Character Library remain unimplemented**.

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
