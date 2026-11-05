# SideScroll — Changelog

Newest first. One or two lines per release. Detailed notes for 1.1.0–1.1.27 are in
`docs/patch-notes/`; history before that is in `docs/archive/SIDESCROLL_TASKS.md`.

## Unreleased
- **Default player** (Character Lab → Settings → Roles): the character a new game
  starts with — library characters (e.g. Character01) included — and the character
  Character Lab opens on (unless that session was already editing one). Moving the
  role also clears this device's own game choice so your next game starts with it;
  players elsewhere keep a character they picked. Publish the change (Character
  templates & actions / registry) for it to reach everyone.
- Fixed: picking a library character in the game was forgotten on the next launch
  (start-up saved the built-in character over it before library characters had
  loaded), and a library Default player only applied to a new player's first launch.
- **Performance:** every wrapped grass/rock/tree re-measured the terrain height under
  it twice per frame (its home spot and where it's drawn), plus twice more for slope
  tilt, which made terrain lookups the biggest per-frame cost and grew with every item
  (so denser near-side rows slowed the game). In play these are now kept per item and
  drawn position until the terrain changes (not cached while editing). Asset behaviour
  settings are likewise kept instead of re-merged for every item every frame.
  Measured (4× CPU throttle): rows off 185 → 162 ms/frame, default rows 189 → 154,
  dense rows (0.4 m spacing) 258 → 199; the picture is pixel-identical.
- **Near-side rows** (game editor → Environment → *Near-side rows*): a woodland biome
  profile can replace the scattered grass/rocks between the camera and the path with
  three rows (Edge, Middle, Outer) that follow the path. Each row: on/off, **depth**
  from the path ± spread, **scale** ± amount, **spacing** ± amount, and which ground
  textures it uses (thumbnails). Changes rebuild the near side live; **Save rows**
  stores them in the biome profile (`sidescroll.biomes.v1`, World content, so it
  publishes and blends at profile transitions), **Revert** goes back. Profiles that
  never use rows keep today's scatter. World Lab keeps the rows when it saves.
- Quick Play controls are half the height (Jump / Pick up and the move pad), giving
  the space back to the view.
- Character Lab → Quick Play controls laid out like the game: **Jump** and **Pick up**
  bottom-left, a wider move pad bottom-right. Jump / Pick up act on touch-down, so
  they work while the other thumb holds the move pad (taps were lost before because
  iOS drops clicks while another finger is down). Quick Play's view sits a little
  higher and smaller so the character, boxes and markers stay clear of the controls.
- Character Lab → Display → **Centre** (on by default): a dashed vertical line and
  ◆ *Centre* at the character's origin (where the game places it and centres its
  collider), and an amber ▲ *Body ±x* under the body whenever the body is off it.
- Animate → Key Pose Tools → **Centre body** (bipeds): moves the whole animation
  (body and both feet together, so every pose is unchanged) so the body sits over
  the centre on average (*Keep sway*), or exactly on every key (*Remove sway*).
  Character01's animations had the body 10–13 cm forward of her centre (Body / Root
  left–right), so in the game she was drawn ahead of her collider.
- Character Lab → Quick Play: the test boxes use the character's own **collider**
  (Rig → Collider, sized as the game sizes it: × 2.31 × scale) for where it stops
  against a box, its height, step-up and reach; *Add box* places the box 0.8 m clear
  of the collider.
- Collider **Height** can go higher: up to 2.00 for bipeds (was 1.15) and 1.20 for
  quadrupeds (was 0.72), so the capsule can cover a tall character's head. Saved
  colliders are unchanged.
- Animate → Jump: the character's own floor on each frame (where a foot at lift 0
  sits, lifted by the game's jump arc) is now a clear amber line labelled with its
  height in game metres, with a faint line at the top of the jump (the Jump height).
  It was drawn at 18% opacity before. Quick Play shows the same floor line whenever
  the character is off the ground (jumping, or standing on a box).
- **Character Lab → Quick Play → Test box:** a box the game's size (0.96 × 0.68 m,
  one stack layer) to try gameplay with a character's animations. **Add box** /
  **Stack box** / **Clear**; walk into it (it blocks), jump onto it, walk off it
  (she falls), and **Pick up** / **Put down** on the pad (or E): it is carried with
  the game's carry pose at her hands and put down in front, stacking on a column
  there. **Held item drawn** chooses where a held item sits among the character's
  parts (Auto = behind the near arm, in front, behind, or behind any one part);
  it is saved with the character and the game uses it too.
- The carry pose and the held-item draw-order rule now live in `biped-rig.js`
  (`carryPose`, `heldItemIndex`), shared by the game and Quick Play. Quick Play
  also keeps feet above the real ground, as the game does.
- Fixed (game, mesh characters such as Character01): a carried log sat at a fixed
  spot in front of the whole character, covering both arms. It now follows the
  hands (as with the original characters) and is drawn between the body and the
  near arm, so the near arm wraps round the front.
- Fixed (game): landing early on something higher than the take-off point (a log)
  showed the Jump animation's reach-down frames with the feet inside it for a
  moment. Feet keyed below the floor now go no lower than the ground actually
  under the character.
- **Performance:** the game re-read and re-parsed the whole character library
  (130 KB+, every library character's animations) about 19 times a frame, just to
  look up names and families: ~2.5 MB of JSON per frame, growing as characters
  were added. The character registry now keeps its parsed list until the saved
  data changes, and the game parses the character setup only when it changes
  (per-frame parsing ~2.5 MB → ~8 KB). Affects every character and every Lab
  that lists characters.
- **Published** (first Publish Lab package, 4 Nov): Puzzles area, Aureli (Hero 1, with
  the shared hero animations), Fox, Character01 and Character02 with their artwork.
- **Full backup:** Project Backup now includes every character artwork image
  imported in Character Lab, so one file holds everything on the phone. Import
  checks each image (SHA-256), lists *Character artwork* as its own area (merge
  adds missing images, restore overwrites), includes artwork in the safety backup
  and rolls back on failure. Backups made before this still import (artwork left
  as it is).
- **Publish Lab** (menu → Publish Lab, new page): every game-content area (World,
  Puzzles, Puzzle Lab, Assets, Character templates & actions, Design) and every
  character shows **Published / Changed / New** compared with the game everyone
  plays. Changed and new items are ticked; **Prepare package** makes one
  `SS-PUBLISH-….json` with the ticked areas and characters (imported artwork
  included) for `tools/bake_project.py`. **Use published** throws away this phone's
  changes to one area or character. **My settings** exports/imports your own
  settings (never published). Artwork already published reads as Published once its
  picture on the phone matches the published file.
- `tools/bake_project.py` accepts publish packages: builds in only the areas and
  characters in the package (Design also rewrites `design-doc.json`).
- **Jump timing** (Animate → Key Pose Tools, shown on the Jump animation): **Lift-off
  here** / **Landing here** / Reset. Frames before lift-off play on the ground
  (crouch / anticipation), the jump arc runs from lift-off to landing, frames after
  landing play on the ground (landing / recovery; cut short if you walk off). Every
  frame lasts the same time, set by the Jump height. The Animate preview lifts the
  character only between those frames, and the timeline marks them. Defaults (frame
  1, end) keep the original instant jump.
- **Jump height per character** (Character Lab → Quick Play, 0.3–2.5 m; default 1.49 m =
  the original jump). The game launches the jump to reach that height (gravity, and
  so falling, unchanged) and plays the Jump animation over the actual time in the air.
- Fixed: Animate's Jump preview lifted the character along its own 0.40 arc, while the
  game lifted it by the real jump (≈60% higher on a scale-1 biped), so a jump that
  looked right in Animate floated in play. The preview now uses the exact game arc
  for the character's Jump height and scale.
- Bipeds ease between standing, moving and jumping in the game and Quick Play (a
  0.22 s cross-fade when starting or stopping, 0.15 s on take-off and landing), so
  stopping a run or starting a walk no longer flicks to the new pose. Walk ↔ run keeps
  its existing blend.
- Animate (bipeds): foot height can go **below the character's floor** (−60 to +60 cm;
  it stopped at 0). In Jump, Animate lifts the whole character along the preview jump
  arc, so feet were stuck at that raised level; now they can reach the real ground and
  below (leg length still limits reach).
- Animate (bipeds): **Ground Motion** — the moving floor the Fox had, now for bipeds,
  with denser markers (a tick every 2.5 cm, a taller one every 10 cm). It scrolls at the
  speed Quick Play walks or runs (Walk / Run speed × cycle time), during playback and
  frame by frame, so a planted foot should stay over one marker; on/off and a ×0.5–1.5
  display speed in the Ground Motion section.
- Animate (bipeds): Key Pose Tools → **Copy a limb to the other side** — Legs / Arms,
  Near → Far or Far → Near, **half a cycle later** (the opposite step of a walk or run)
  or same timing. Copies that limb's keyed controls (foot position, height, angle, toe
  bend; or hand position and angle), replacing the other side's; nothing else changes.
- Animate (bipeds): **Neck** and **Head** controls (new neck bend and head tilt
  channels). Neck turns the neck and everything above it about the chest; Head tilts
  the head about the top of the neck; the hair turns with the head. At 0 every pose is
  unchanged.
- Animate (bipeds): Foot contact **Off** (Key Pose Tools, per clip) — no foot is ever
  pinned to the floor, so feet move and rotate freely and the pelvis isn't held by leg
  reach. From keys (Planted foot per frame) and Automatic remain.
- Animate (bipeds): **Foot contact: Automatic** (Key Pose Tools, per clip): a foot is
  planted while its lowest point touches the floor, so a foot with few keys follows
  its smooth curve instead of snapping down where a keyed contact starts. From keys
  (the default) is unchanged.
- Biped **toes**: a Ball joint in each foot (on the sole, 70% heel → toe on rigs
  saved before), Sole and Toes bones for Skin, and Near / Far Toes in Animate (toe
  bend). The one-piece foot bones stay as Whole Foot for older skins; no bend = poses
  unchanged.
- Animate: **Motion Path** moved to the Display section. Simplify keys and Foot
  contact buttons styled like the other tools.
- Fixed: a skin bound before the Spine joint (or now the Ball joints) would have lost
  its Whole Back / foot bone the first time it was edited; older skins now always keep
  the bones their saved shape describes.
- Character Lab draws mesh artwork (skinned parts, the Fox) with **WebGL** like the
  game, instead of one clipped Canvas triangle at a time, which Safari renders very
  slowly — the cause of the poor Animate / Quick Play frame rate (worse with Blend
  at joints), which also made Smooth look no smoother. Same picture (minus the
  Canvas method's faint triangle seams). Display → **GPU mesh** switches back to
  the old method; it is also used automatically if WebGL isn't available. A
  readout under Display shows which method drew the mesh and how long it took.
- Animate (bipeds): wider control ranges — hands from well above the head to below
  the hips (they stopped at chest height), feet lift 60 cm, lean and spine ±60°, root
  ±50 cm and 0.15–1.2 m high, hand angle ±120°, hair wider. Arm and leg length still
  limit reach.
- Fixed: the selected control's handle used the default biped's proportions, so on
  another character it sat in the wrong place (the "root dot stuck at a fixed
  height"); it now follows the character's own rig.
- Animate (bipeds): **Planted foot** (Near / Far / Neither) from the current frame on
  the Root and Foot controls — a planted foot stops the pelvis rising above that
  leg's reach; Neither frees it.
- Animate: **Motion path** for the selected control: its path over the whole clip,
  with the frames where it is keyed marked.
- Fixed: in Character Lab, playback and Quick Play of a biped clip with per-control
  keys or Smooth tweening jumped from frame to frame (the position was rounded to
  whole frames), so Smooth looked no different; they now play every in-between.
  The sampler prepares each clip once instead of rebuilding every key per sample
  (about 20× faster), so Smooth no longer costs frame rate.
- Animate (bipeds): **keys per control.** A key can hold just some controls; an
  edit now keys only the controls you changed, and each control moves between its
  own keys. The control panel shows the frames the selected control is keyed on
  (bright dots on the timeline) with **Delete key here** and **Keep only this key**
  (holds the control still for the whole clip). Key Pose Tools → **Simplify keys**
  turns a key-on-every-frame clip into the few keys each control needs (motion kept
  within 1.5 mm / 0.6°, foot contacts kept). Older clips play exactly as before.
- Animate (bipeds): the Root control moves **left/right** as well as up/down (new
  root X), with a wider height range; **Smooth** tweening now sticks for bipeds
  (it was reset to Linear on load) and the game plays it too.
- Skin: **Copy to the other side** (same layout as the Rig Designer's): Selected part
  → any part, plus Arms / Legs / All limbs, Near → Far or Far → Near. Bones switch
  side, joint lines, blend and shape settings come along, and the weights are worked
  out again on the partner's own mesh (per-point edits too when both parts share a
  mesh). Partners are found by name (NearArm ↔ FarArm, LegNear ↔ LegFar); the message
  says if any points end up uncovered.
- Skin: **choose any bones for a part.** *Bones this part follows* lists every bone
  of the rig under its group; tap to add or remove, start from a *Preset* (the old
  groups), then **Bind to these bones** (e.g. a head mesh on Neck + Head only, a
  body on the back bones only). A new binding's joint lines are fitted to the part,
  so it covers the whole part instead of a narrow strip along the bones.
- Skin: **Blend at joints** (0–12 cm) shares points near each joint line between
  its two bones, easing from one to the other, so artwork bends smoothly instead of
  hinging (joint-boundary bindings; the game already blends shared points).
- Biped **spine**: a Spine joint (halfway between Pelvis and Chest on rigs saved
  before) with **Lower Back** and **Upper Back** bones, and **Spine Bend** in
  Animate (bends the upper body above the spine). The old pelvis-to-chest bone is
  kept as **Whole Back**, so skins bound before still use it; with no spine bend
  everything moves exactly as before (heroes checked frame by frame; a skin bound
  before draws pixel-identical).
- Skin: binding a part by hand is clear again. *Auto-bind part* is renamed **Bind to
  group** (it always bound to the group chosen in Bone group), and the bone list
  plus **Bind whole part to selected bone** (was "Rigid bind") now work on a part
  that isn't bound yet, or bound to another group — choose a group, pick a bone,
  bind. Choosing another group only previews its bones until you bind.
- Fixed: a second "ghost" knee (or elbow) next to the joint in Rig on a nearly
  straight leg or arm, jumping about as the joint moved. The skeleton never let a
  limb straighten fully, forcing a ~1–1.5 cm bend that flipped front/back as the
  knee crossed the hip–ankle line. The rest pose (Rig, Skin binding) now lets a
  limb straighten, so every joint sits exactly on the rig; animation keeps its soft
  bend at full reach, so the heroes' walk, run and jump are unchanged (checked
  frame by frame). A biped skin bound on a straight leg follows the corrected
  knee, a difference of about 1 cm.
- Rig Designer: the copy buttons are now one clear *Copy to the other side* box —
  Selected joint / Selected limb (labelled with what they copy), then Arms, Legs
  (Fox: Front legs, Rear legs) and All limbs, each Near → Far or Far → Near.
  Previously "Both Legs" actually copied arms too, and Copy Segment is gone. The
  biped's leg now includes the Heel joint. Choosing a joint by its button also
  highlights it in the viewport straight away.
- Biped hands: the arm now runs shoulder → elbow → wrist → **hand**. Rig has a
  Hand joint per side (placed straight on from the forearm on rigs saved before);
  the hand keeps its rest angle to the forearm and Animate's Near/Far Hand control
  can turn it (new *hand angle* channel, mirrored with the other side; older clips
  keep the hand straight). Skin can weight artwork to the new Near/Far Hand bones.
  Existing joints, skins and the heroes' animation are unchanged (checked frame by
  frame, and a skin bound before the change draws pixel-identical).
- Removed test screenshots (`undefined/`) committed by mistake with PR #29.
- Fixed: on a biped whose rig leans, is offset or has bent arms/legs, the animated
  skeleton only took bone *lengths* from the rig: it stood the spine straight up and
  re-solved elbows/knees with a fixed bend, so moving a shoulder swung the arms the
  other way and moving one elbow moved bones elsewhere. It now follows the rig's
  directions, pelvis position and bend sides, so at rest it sits exactly on the
  rig's joints. The default (straight) rig is unchanged, so Hero 1 and Hero 2 look
  and animate exactly as before (checked frame by frame).
- Rig Designer: where near and far joints sit on top of each other, a tap now keeps
  the selected joint, otherwise takes the near one (it used to grab the far one);
  tapping again without dragging switches to the next joint there. Viewport labels
  say which side (e.g. "Elbow · far").
- Character Lab: far limbs are now lavender (near stays teal) in the viewport bones,
  the Rig Designer and the joint buttons; *Near side* / *Far side* switches (Display
  panel, and at the top of the Rig Designer) hide a side's bones and joints so they
  can't be tapped. View only; both sides show again whenever Character Lab opens.
- Character Lab: Undo, Redo and Discard now sit in the top bar next to the
  Saved/Unsaved badge, so they are always to hand. The small "i" help button (which
  had wrapped out of the top bar and floated over the left panel) is removed.
- Fixed: Character Lab froze ("Loading…") on the iPhone when the Fox (drawn as a
  Mesh) was on screen — a mistake in the 1 Nov Skin change made the quadruped's rest
  geometry call itself endlessly, every frame. Biped skins were not affected.
- Biped rig, Parts and Skin (C2c, first half): the Biped has an editable rest rig
  (joints for pelvis, chest, head, hair, arms and legs) in the Rig Designer; bone
  lengths and foot shape come from it, while animation still drives it the same way,
  so the heroes look and animate exactly as before until edited. Every biped keeps
  its own rig (original bipeds in their setup). Parts, Skin and the game's mesh
  drawing now work for any rig, so a biped can go new atlas → parts → rig → skin →
  game. The Biped rig template is editable like the Quadruped. Auto-bind picks a
  part's bone group by name only when that group exists on the rig.
- Animation template box (C3c): Animate shows the template the selected animation
  follows, with **Use this template** (only the character's rig family), **Make
  unique** and **Save as template**; animations a character created can follow
  templates too. A chosen template is kept on Save and dropped by Discard. Settings
  lists animation templates (rename; remove ones nothing follows). Exports carry
  every template a character's animations follow.
- Actions & animations (C3b): Character Lab → Animate lists the **action slots**
  (Idle, Walk, Run, Jump, plus any added in Settings → Action slots) with the
  animation each plays for the character, and the character's **animations** (New,
  Duplicate, Rename, Delete). Slots are project-wide; added ones are "not hooked up
  yet" until game code (C5) or an action path (C6) uses them. Bipeds get an editable
  Idle (starts as the standing pose the game always used). The game plays whatever
  each built-in slot is set to. Exports carry animations, slot choices and custom
  slots (`action-slots.js`).
- Animation templates (C3a): every character now keeps its own copy of each clip,
  linked to an animation template (the heroes share the *Biped* set as before) or
  its own. Editing a linked clip asks *Edit template* (listing the other characters)
  or *Make unique*; opening a clip whose template changed offers *Use updated* or
  *Keep previous*. Animate shows which template a clip follows. The game plays each
  character's own saved clips (unchanged until you edit), so Hero 2 can now have
  its own walk. Exports carry the character's clips and linked templates.
- Rig templates (C2b): Character Lab → Rig shows the character's rig template —
  linked (instance) or its own copy — with **Use this template**, **Make unique** and
  **Save as template**. Editing a linked rig asks *Edit template* (listing the other
  characters) or *Make unique*; opening a character whose template changed offers
  *Use updated* (skin rebound, undoable) or *Keep previous*. Settings lists templates
  (rename; remove when unused). Characters keep their own saved rig, so the game only
  changes when you Save. Exports carry the linked template (`rig-templates.js`).
- Neutral internal names (C2a): the original characters' IDs are now `char-1` /
  `char-2` / `char-3` (were `original` / `alternate` / `fox`), rig families `biped` /
  `quadruped` (were `human` / `fox`), plus the quadruped baseline marker, rest-rig
  schema and clip source IDs. Saved data on devices is migrated on load
  (`saved-data-migrations.js`); old export files are upgraded on import and by the
  bake tool; built-in content is re-baked in the new format. Nothing looks different.
- Copies of Hero 2 keep Hero 2's art (they started with Hero 1's). A biped library
  character now records which original biped artwork it uses (`art` in its library
  entry), carried by character exports.
- Removed the retired Skin Prototype from `anim-lab-mesh.js` (about 800 lines);
  the file now only builds the original parts' meshes for Mesh drawing, identical
  to before.
- Published the Mesh Fox exactly as exported on 31 Oct: every device now gets the Fox
  drawn as a mesh with your tuned skin.
- Skin: **joint boundaries are the one envelope method**. Auto-bind and Mesh now
  create joint boundaries; the rectangle controls are gone (older rectangle
  bindings keep working and offer "Use joint boundaries on this part"). A point
  outside every section has no bone and stays where it is; the Skin status line
  counts these (Unassigned).
- Fixed: on another device (or browser) a Mesh character's original parts showed
  "Rebind needed" in Character Lab, because the lab rebuilt their meshes by
  calculation and got very slightly different numbers. It now uses the meshes saved
  with the character, as the game does.
- Drawing method per character (C1c): Character Lab → Parts has **Parts / Mesh**. Mesh
  builds the character's Parts assembly from its original pieces (placed exactly
  where Parts drew them) with automatic skin weights, to tune in Skin; Parts draws
  rigid pieces and keeps the mesh for switching back. The game draws each
  character the same way, including the Fox (falls back to Parts if its mesh
  can't load); the picker shows Parts / Mesh. The old Skin Prototype deform view
  is retired, so Character Lab and the game no longer disagree. Copies of a Mesh
  Fox now play in the game.
- Neutral names in code: every variable, function and global that was named after a
  character is renamed (e.g. `FoxRig` → `QuadrupedRig`, `HumanRig` → `BipedRig`,
  `window.GameHubFoxRig` → `window.SideScrollQuadrupedRig`), and comments and
  console messages reworded. Saved-data values (`fox`/`human` families,
  `foxBaselineId`, schemas) are unchanged until C2 / C1c. No behaviour change.
- Neutral file and storage names: `fox-rig.js` → `quadruped-rig.js`, `walk-rig.js` →
  `biped-rig.js`, `fox-authoring-baseline.js` → `quadruped-baseline.js`,
  `anim-lab-fox-starter.js` → `anim-lab-quadruped-starter.js`, `fox-*.png` →
  `quadruped-*.png`, `…-alt-hero2.png` → `…-alt-b.png`, and the six `sidescroll.fox.*`
  / `animlab.fox.clips` keys → `quadruped` keys. Old names keep working (art alias,
  one-time key migration, import/bake mapping). Fixed: starting the game with PLAY
  on the splash screen skipped two game scripts, so library characters (New01)
  were unavailable and the Fox lacked its baseline; PLAY now loads `play.html`'s
  own script list.
- Character Lab: roles and categories moved out of Open into a **Settings** dialog
  (top bar), the future home of rig templates and abilities.
- Character registry: every character can be renamed, ordered, put in a category
  (Playable, Enemy, Interactive, or your own; the game's picker lists playable
  ones) and deleted, except characters holding a role (Default player, Default
  animal, or roles you add), which move but can't be removed. New players start as
  the Default player. Character Lab toolbar is now New · Open · Save · Share. No
  character-specific wording on screen apart from names (`character-registry.js`).
- Published New01 with its artwork (`assets/char-user-mvfqd1f9-cpjpp1-b28a05c2c7.png`):
  it now works on every device, not only the phone it was made on.
- Publishing characters with their artwork: `tools/bake_project.py` now also takes
  character exports and writes imported artwork to `assets/char-<id>-<hash>.png`;
  the game and Character Lab load published character art, so a published
  character works on every device without importing anything.
- Characters: every character (Hero 1, Hero 2, Fox and library characters) now has
  **Export** in Character Lab → Load, plus **Export all characters** and **Import
  characters…**. Files include everything for each character, including imported
  artwork; import offers Replace (exact rollback / update), Add as a copy, or Skip.
  Removed the legacy Fox Handoff, the Save-panel export, the old JSON import and
  "All Character Lab Data" (`character-packages.js`).
- Publishing foundation: `storage-catalogue.json` classifies all 95 storage keys
  (content, migration, local, progress, transient, backup, stale) and now drives
  the bake tool. Players' devices no longer save copies of built-in content when
  the game merely re-saves it, so future published updates reach them. Fixed: the
  hero collider (`sidescroll.walklab.collider.v1`) is now built in.
- Built-in content: the authored world, puzzles, assets, characters (rigs, skins,
  animations) and Design Lab document from the 30 October project export now ship
  with the game (`project-defaults-data.js`, `design-doc.json`), so a fresh install
  starts with the full project instead of a September snapshot. Saved data on a
  device always takes priority. Play progress and view preferences are not built in.
- Faster loading: every art file now has one version in `asset-paths.js`, so the
  splash preload, the game and the labs request identical URLs and share one cached
  copy (no more duplicate downloads). The preload now covers everything the game
  loads at startup, including the settlement art, and no longer stores a second
  copy in an unused cache. The service-worker cache name is kept, so nothing
  already downloaded is thrown away.
- Moved all art and audio into `assets/` (icons stay in the root). New `asset-paths.js`
  resolves bare filenames at load time, so saved characters and lab data need no
  migration. Service-worker cache bumped to v138; players re-download art once.
- Added `CLAUDE.md` (session orientation), `TASKS.md` (the single task list) and
  this changelog; archived the old task log to `docs/archive/`.
- Signed off all outstanding iPhone acceptance tests up to 1.1.27.
- Organised the repo into `docs/`, `assets/unplaced/` and `review/`; nothing
  deleted, no loaded files moved. Removed the unused 6.4 MB tree atlas from the
  splash preload.

## 1.1.x — Character Lab
- **1.1.27** (24 Oct) — Scale/reference isolation; numeric scale up to 8; per-character reference settings; rig-family metadata and descriptor-ready animation control mapping (generalisation stage A2).
- **1.1.26** (24 Oct) — Generalisation stage A1: first step towards characters not tied to Fox assumptions.
- **1.1.25** (23 Oct) — Original Parts sources for custom characters; Biped startup fix.
- **1.1.24** (23 Oct) — In-game character chooser; Load panel closes on switch; first Biped starter.
- **1.1.23** (23 Oct) — First playable custom (local) quadruped in the game from Character Lab data.
- **1.1.22** (23 Oct) — Anim Lab renamed Character Lab; Load/Open reliability fix.
- **1.1.21** (22 Oct) — Joint offset, guides and precision fixes.
- **1.1.20** (22 Oct) — Rotated joint offsets and free-end influence reach.
- **1.1.19** (22 Oct) — Joint-authored binary influence regions.
- **1.1.18** (22 Oct) — Optional joint-fit binary bone shapes.
- **1.1.17** (22 Oct) — Skin rectangle follows the previewed pose.
- **1.1.16** (22 Oct) — Rectangular binary Skin regions (stage 1).
- **1.1.15** (22 Oct) — Fox IK bend direction follows the authored rest rig.
- **1.1.14** (22 Oct) — Animate paw-IK drag responsiveness.
- **1.1.13** (21 Oct) — Atlas assembly playback CPU speed-up.
- **1.1.12** (21 Oct) — Skin/Animate render parity hotfix.
- **1.1.11** (21 Oct) — Spatial Skin envelopes; Animate performance; experimental WebGL compositor (later disabled).
- **1.1.10** (21 Oct) — Skin one-bone integrity, compact list and zoom.
- **1.1.9** (21 Oct) — Skin editor controls and artwork opacity.
- **1.1.8** (21 Oct) — Parts multi-selection; Atlas → Skin bridge.
- **1.1.7** (21 Oct) — Parts precision-move hotfix.
- **1.1.6** (21 Oct) — Parts editor organisation.
- **1.1.5** (20 Oct) — Simplified Parts inventory.
- **1.1.4** (20 Oct) — Atlas → Parts assembly inventory.
- **1.1.3** (20 Oct) — Atlas topology controls and regeneration.
- **1.1.2** (20 Oct) — Atlas stage B: mesh constructors, management, inspector.
- **1.1.1** (20 Oct) — Atlas display tidy-up.
- **1.1.0** (20 Oct) — Atlas workspace stage A.

## 1.0.x — summary
- **1.0.199–1.0.205** (19–20 Oct) — Character Library; Project Backup export, lab data export/import, global restore.
- **1.0.192–1.0.198** (18–19 Oct) — Character authoring redesign: Parts, Rig, Skin/weight authoring, unified navigation.
- **1.0.165–1.0.169** (Oct) — Deformable mesh Fox; approved charcoal Fox deform atlas.
- **1.0.143–1.0.163** (12 Oct onwards) — Anim Lab: multi-rig shell, key-pose timeline, Motion Reference, Rig Designer, paw IK, Quick Play, jump authoring.
- **1.0.141** (11 Oct) — Fox first playable quadruped.
- **1.0.136–1.0.140** (9–11 Oct) — Terrain Edit stages 1–3, terrain surface art pack, World Lab surface previews.
- **1.0.131–1.0.135** (8–9 Oct) — Puzzle Editor v2: zones, applied logic, entry/exit, standalone vs template instances.
- **1.0.117–1.0.130** — Unified editor drawer, puzzle edit sessions with shared history, support-surface fixes.
- **1.0.100–1.0.102** — Settlement art test library.
- **1.0.83** — Mountain art test library.
