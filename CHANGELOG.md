# SideScroll — Changelog

Newest first. One or two lines per release. Detailed notes for 1.1.0–1.1.27 are in
`docs/patch-notes/`; history before that is in `docs/archive/SIDESCROLL_TASKS.md`.

## Unreleased
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
