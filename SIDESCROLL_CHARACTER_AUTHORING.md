# SideScroll Character Authoring & Animation System

Status: design direction, mesh-first staging begun in v1.0.165.

## Goal

Character authoring should ultimately let a user create a playable character without adding character-specific game code: create/name a character, choose a rig family, start from placeholder art/mesh, tune the rig and collider, assign or create reusable animations, replace the art, test in Quick Play, save to a Character Library, then select that character from the normal game.

The system should not be designed around Fox-specific ownership. Fox is the current quadruped proof character; Hero 1/Hero 2 are the current biped examples.

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
