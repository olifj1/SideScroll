# SideScroll — working notes for Claude sessions

Read this first, then `TASKS.md`. Keep both current as part of any change.

## What this is
SideScroll is a 2.5D side-scrolling woodland adventure built as an offline PWA,
plus a set of in-browser authoring tools ("Labs"). It is plain HTML/JS/CSS with
**no build step**, hosted on GitHub Pages from `main`, installed to an iPhone
Home Screen and developed phone-first. It will later be wrapped for app stores.

Current version: **1.1.27** (see `CHANGELOG.md`).

## How a change ships
1. Work on the session's branch; commit and push.
2. Open a pull request into `main` (only when the user asks).
3. The user merges on their phone. GitHub Pages redeploys `main` automatically
   ("pages build and deployment" action, ~1 minute). Nothing else to do.

**Publishing content** needs no session: the user uploads a Publish Lab package (or
character export / Project Backup) to `publish/` on github.com; the *Publish uploaded
package* Action (`.github/workflows/publish.yml`) runs `tools/bake_project.py` and
`tools/test_migrations.js`, removes the upload and opens a pull request
(`auto-publish/…` branch) to merge. A session can still bake files the user attaches.
4. The user tests the installed app on iPhone; close/reopen if it looks stale.

The old "flat changed-files-only patch ZIP + README per patch" workflow is
**retired**. Do not produce patch ZIPs or per-patch `README-PATCH-*.md` files;
record changes in `CHANGELOG.md` and the PR description instead.

## Tasks
- `TASKS.md` is the **only** task list. Add, reorder and remove items there in the
  same PR as the work. Finished items leave `TASKS.md` and get a line in
  `CHANGELOG.md`.
- `docs/archive/SIDESCROLL_TASKS.md` is the historical log up to 1.1.27. Read it
  for background on a feature; never add to it.
- The Design Lab (`design-doc.json`) is for game design (story, locations,
  mechanics), not for tasks.

## Layout
- Root — the live app: pages, scripts and data, plus the two app icons
  (`icon-192.png`, `icon-512.png`, which the Home Screen install expects here).
- `assets/` — all art and audio the game and labs load (see **Art and audio paths**).
- `docs/` — design and engine docs. `docs/patch-notes/` old per-patch notes,
  `docs/audits/` one-off audit JSON, `docs/archive/` the old task log.
- `assets/unplaced/` — art kept for future use, not referenced by code yet.
- `review/` — unreferenced files awaiting a keep/delete decision (`review/README.md`).

## Art and audio paths
Code, bundled data and saved data refer to art by **bare filename**
(`'quadruped-deform-atlas-v2.png?v=1.1.25'`). `asset-paths.js` defines
`window.SideScrollAssetPath(name)`, which turns a bare art/audio filename into
`assets/<name>` at the moment it loads, and leaves data:/blob:/http URLs and
anything with a folder unchanged. So:
- New art goes in `assets/` and is referenced by bare filename as before.
- `ASSET_VERSIONS` in `asset-paths.js` is the **only** place an art file's `?v=`
  is set; for listed files any `?v=` written at a call site is ignored. Add new
  art there, and bump a file's version there when its artwork changes. Every page
  then requests the same URL, so one cached copy serves the game, the splash
  preload and the labs.
- If the game loads a file at startup, add it to `GAME_PRELOAD` in `home.js` too,
  or it will pop in during play on a first launch.
- Files renamed so nothing is named after a character keep their old names as
  aliases (`RENAMED` in `asset-paths.js`), because saved data and older exports
  still use them; compare file names through `SideScrollAssetRename()`.
- Every place that sets an image `src`, CSS `background-image` or fetches audio
  must pass the URL through `assetPath(...)`. Each script takes a local
  `const assetPath = window.SideScrollAssetPath || (url => url);`.
- Any page that loads art must include `asset-paths.js` before its other scripts.
- Plain `<img src>` in static HTML (splash, concept overview) uses `assets/...` directly.

## Built-in content (project defaults)
The authored project ships as built-in defaults so a fresh install has it:
- `project-defaults-data.js` is **generated** by `python3 tools/bake_project.py
  FILE [FILE ...]` from files the user exports on the phone: a Project Backup
  (rebuilds everything, also rewrites `design-doc.json`) and/or character exports
  (publishes those characters on top; with only character files the current
  built-in content is the starting point), and/or a **publish package** from the
  Publish Lab (`sidescroll.publish-package.v1`: the ticked areas' content keys plus
  character packages, and `registryShared` {roles, categories} when *Character roles
  & categories* is ticked; only those are built in). Never edit it by hand.
- **Publishing character art:** the tool writes a character's imported PNG to
  `assets/char-<character id>-<content hash>.png` and switches its atlas document
  to `{kind:'bundled', file}`; the game and Character Lab load that pattern only
  (plus `quadruped-deform-atlas-v2.png`). A new hash means a new file name, so changed
  art is fetched fresh; older files for that character are removed. The bake tool
  ignores the artwork inside a Project Backup (the tool says which characters stay
  phone-only); art is published through character exports or a publish package.
- `storage-catalogue.json` lists **every** storage key with its scope (content,
  migration, local, progress, transient, backup, stale). Its `renamed` map lists
  old key → new key: devices migrate once on load (`project-defaults.js`), and the
  bake tool and character imports map old names, so a key can be renamed safely. The bake tool builds in
  content + migration keys only and warns about any key it doesn't know. **Add a
  catalogue line whenever code introduces a new storage key.**
- `project-defaults.js` makes `localStorage.getItem(key)` return the built-in
  value when the device has no saved value for that key. Saved data always wins;
  removing a key (a lab's Reset) falls back to built-in content. A save of a value
  identical to the built-in one, on a device without its own copy, is skipped, so
  devices only hold copies of content they have genuinely changed (otherwise the
  game's on-load re-saves would pin players to an old version).
- Both load before any other script on index, play, walk-lab, asset-lab,
  puzzle-lab, world-lab and publish-lab. New pages that read saved data must include them.
- Left out on purpose: everything not scoped content/migration in the catalogue.
- `baked-game-design.js` (an older baked export) was retired on 7 Nov 2026; code still
  reading `BAKED_GAME_DESIGN` / `SIDESCROLL_BAKED_GAME_DESIGN` gets nothing and falls
  back to the built-in content through localStorage.
- **Project Backup** (`project-snapshot.js` / `project-restore.js`) is the one full
  device backup: every SideScroll storage key plus every IndexedDB artwork image
  (`storage.artwork.images`: id, type, bytes, sha256, dataUrl). Restore checks each
  item's SHA-256, offers artwork as its own area (merge adds missing ids, restore
  overwrites), and rolls back on failure.
- Changing a stored format? The built-in data is in the *old* format until it is
  re-baked, so migrations must handle it exactly as they handle a device's data.

## Saved-data migrations
`saved-data-migrations.js` (`window.SideScrollMigrations`) changes values *inside*
saved data when a stored format changes (storage keys that are renamed go in the
catalogue's `renamed` map instead). It loads just before `project-defaults.js`,
which runs it over this device's own copies on every load (each step only maps
old → new, so re-running is harmless and a restored old backup is upgraded next
load). Character imports upgrade old export files with it, and
`tools/saved_data_migrations.py` mirrors it for the bake tool, which also writes
JSON exactly as the browser does (`js_json`). After changing either, run
`node tools/test_migrations.js [exports…]` — it checks the two agree. Any page that
loads `project-defaults.js` must load `saved-data-migrations.js` first.

## Imported assets
`asset-library.js` (`window.SideScrollAssetLibrary`, key `sidescroll.asset-library.v1`) is the
list of assets the author imported in Asset Lab (**+ Import asset**): `{name 'asset-<time>-<rand>'
(permanent; everything is keyed by it), label, group, scope 'environment'|'puzzle', category
'dressing'|'gameplay', height, groundLine, art}`. Art is `{kind:'indexeddb', id 'asset-art-…'}` in
Character Lab's image store (so Project Backup carries it) until published, then
`{kind:'bundled', file 'asset-…-<hash>.png'}` in `assets/` (Publish Lab adds `assetArt` to the
package; `bake_project.py` `publish_asset_art` / `tidy_asset_art`). Art is used exactly as
imported — no trimming or clean-up. Height, floor line, collision, behaviours and states are
Asset Lab's usual per-name stores. The game (`sidescroll.js`: `importedAssets`, after
`editorAssetGroups`) adds them to the editor library under their group heading and creates
their textures at start-up (`createImageTexture` accepts a promised URL); a placed copy whose
asset is missing draws nothing (`missingAssetTexture`). Asset Lab refuses to delete an asset
that any `sidescroll.` key still mentions (`usedIn`). Replace Art with a different aspect calls
`rescalePlaced(name, newAspect/oldAspect)`, which walks those keys and scales every placed copy's
`sx` / `baseSx` / `width` and collision `halfWidth` (copies keep their height). Any page that lists or draws imported
assets loads `asset-library.js` (play, asset-lab, publish-lab). The built-in assets are still
listed separately in `sidescroll.js` (`editorAssetGroups`) and in `builtin-assets.js`
(`window.SideScrollBuiltInAssets`: `list()` a fresh copy, `get(name)`; Asset Lab's `ASSETS` and
Character Lab's scene objects).

**Asset interactions** (`asset-interactions.js`, `window.SideScrollInteractions`, key
`sidescroll.asset-interactions.v1`, Assets area): what the player can do to an asset, per asset name —
`{inspect: {title, text, large, flag?}, collect: {label, description, flag?}, wear: {holdsInventory,
refuse, flag?}}`; later actions (use…) sit beside them. Asset Lab → **Interactions** (`syncInteractions` / `saveAction`). Game (`sidescroll.js`):
`assetInteractions` / `assetInspect` / `assetCollect` are read beside `INVENTORY_ITEM_DEFS` (reloaded on
`storage` / visibility); `nearestInspectable()` (placed copies via `allSceneObjects()` and visible
sequence objects with either action, within the player's radius + 0.45 m and 2.5 m of the path) draws
the dot and is tried in `performAction` after story Action lines: `openInspect` if it has Inspect, else
`collectTarget` straight away. The Inspect view (`.sidescroll-inspect`, `.large` = the asset's picture via
`assetPictureUrl`) has **Pick up** when collectable; from the inventory (`fromInventory`) it always shows
the picture, with Close. `inspectOpen` is part of `storyControlLocked()`. **Collect:** `inventoryDef(id)`
= a built-in item or a collectable asset (id = asset name), so `addInventoryItem`, the Item step and the
story editor's item list take any collectable; inventory cards for them are buttons that reopen the view.
A picked-up placed copy is recorded in progress `sidescroll.player.collected.v1` (`sidescroll.collected.v1`
outside player mode) `{objects: {object id: asset}}` with inventory source `collect:<id>`;
`syncCollectedObjects()` (each frame, after `updatePuzzleRewards`) takes such copies out of the scene
lists while not `editLocked()` and puts scene copies back while editing (puzzle copies are rebuilt when
they stream). A sequence object picked up is hidden in its story progress, with source `seq:<id>`, so
that sequence's Reset gives it back. Progress → Reset all calls `resetCollected()`. Flags: Inspect /
Collect `flag` is set in story progress when inspected / picked up (`setInteractionFlag`) and listed by
both flag pickers. **Wear** (wins over Collect; the view's button says *Put on*): `wearTarget` takes the copy
out like a collect but records `collectedState.worn[asset] = source` (same key) instead of an inventory
item; parts whose assembly instance has `wornWith` (Character Lab → Skin → **Worn item**, kept by
walk-lab's setup cleaner, copied to `part.wornWith` by `character-game-runtime.js` `makePart`) are skipped
in `drawLocalMeshCharacter` unless `isWorn(asset)` (player's state, also for sequence copies). While any
asset has `wear.holdsInventory`, `canCarry()` is false until one is worn: collecting says `refuse`, the
view hides Pick up, and `syncInventoryAvailable()` hides the Items button (unless items are already held).
Event step `wear` (`{action 'on'|'off', asset}`, Player row) → `setWorn` with source `story:<sequence id>`;
`seqResetSequence` takes off what that sequence put on; Reset all clears `worn`. Loaded by play, asset-lab
and walk-lab (the Worn item list).
**Hold** (same store, `hold: {flag}`; Asset Lab → Interactions → Hold): Wear wins over Hold, Hold over Collect
(`collectTarget` → `holdTarget`). The placed copy leaves the scene like a collected one; progress (same
collected key) `held: {asset, from}` and `dropped: [{id, asset, x, y (her floor), z, flip}]`. The player
draws it through `playerHeldItems` → `storyHeldProps` (her grip, `Props.holdFor`), in `drawRigCharacter`
(mesh and parts paths); `putDownHeld` (Action while holding, unless an Inspect is in reach; not mid-jump);
`drawPlayerDroppedProps` stands put-down things on the floor and `nearestInspectable` offers them again
(`target.drop`). One thing at a time (`handsFullText`; box pick-up is never reached while holding).
Biped only; not while `editLocked()`; `resetCollected` clears held and dropped. **Arm pose:** `hold.layer` (a
custom action slot) → `applyHoldLayer(pose)` in `drawRigCharacter` (after the base / climb pose, before
push / carry): the character's animation for that slot (`GameCharacters.slotAnimation` / `clipFor` /
`sampleBipedClip`, looping on its own clock) replaces the holding hand's channels (grip hand near → `aHand*`,
far → `bHand*`), blended over `HOLD_LAYER_BLEND`; no animation for the slot = unchanged. `ActionSlots.isHookedUp`
counts a slot used by any Hold.
**Asset light** (same store, `light: {color, strength, radius, flicker, flickerSpeed, u, v}`; `cleanLight`,
`LIGHT_DEFAULT`; Asset Lab → **Light**, `syncAssetLight` / `saveAssetLight`, stage marker `drawAssetLight`):
in the game `collectPointLights` adds a light for every placed copy (point `u` across / `v` up the picture,
mirrored when flipped) and for props drawn by `drawPropAt` (`notePropLight` → used the next frame:
sequence objects, dropped and held props; faint editor ghosts don't light).

**Shader effects** (`effects.js`, `window.SideScrollEffects`): an imported-asset entry with
`art: {kind:'effect', shader:'darkness'|'fire'|'light'|'dissolve', width, height (the plane's shape), params}`; params are
the shader's controls (`SHADERS[shader].params`: number ranges and [r,g,b] colours; `clean()`
clamps them). Asset Lab: **+ Add ▾ → New darkness effect** (or **New light**, **New fire effect**, **New character effect**), the *Effect* section (sliders; Shape rescales placed
copies), the shared canvas renderer animates the stage (`tickEffects`); thumbnails are still
frames (`thumbnail`, also what `artUrl` returns). The game (`renderEffectTextures`, called at the
start of each frame before the scene framebuffer is bound) renders each visible copy into its own
384-px-high texture with `createRenderer(gl)` and sets `obj.texture`, so the normal object path
draws it; `obj.effectParams` overrides settings per copy (for sequences). `render(params, time, aspect,
shader)`; **Fire** (`FIRE_FRAGMENT`, flames on the plane's bottom edge) is the first of the generic plane
shaders: listed in `PLANE_FRAGMENTS`, its program built on first use, each param passed as uniform
`p_<key>` (colours vec3). New plane shaders: add a fragment shader with `p_` uniforms + params to
`SHADERS` and `PLANE_FRAGMENTS` (Asset Lab builds the sliders from the params; add a **+ Add** button). Effect **states**
(`art.states: [{id st-…, name, params}]`, Asset Lab → States) are what the **Effect on a character**
event step (`effect`: `{actor, asset, delay, size, hideAt, keys:[{state 'gone'|st-…, seconds}]}`)
blends between: `seqEffects` in sidescroll.js (`updateSeqEffects` after `updateWorldCharacters`,
`drawSeqEffects` after the characters) attaches a transient object to the character's frame and
hides it at `hideAt`. Hidden sequence characters still get a frame (`frame.hidden`) and keep
moving; they are just not drawn or blocking.
**Character effects** (`SHADERS[s].target: 'character'`; today `dissolve`): no plane. The step's
blended params go in `seqCharacterEffects` (key → {entry, params}) and `drawWorldCharacters` calls
`drawDissolvedCharacter`, which draws that character (`drawStoryCharacter`) into `charFx`'s
framebuffer with `projection` squeezed to its screen box (snapped to whole scene pixels so it maps back 1:1 without resampling; up to `charFxMaxSize()`, 4096 px; sized from how tall the character was
last drawn, props included — `storyDrawnTop`, noted by `drawStoryCharacter` — or its collider if
taller; colliders are only rough), then draws the image back through
`createDissolveRenderer` (`uBody` = feet/head in the image, measured from the image's alpha by
`measureCharFxBody`, since colliders are only rough; `uDepth` = the character's middle in NDC z, drawn depth-tested without writing, so scenery in front still covers it). Each shader's `start` / `gone` params are
what a step blends from / to for *Gone*; a character effect that ends gone hides the character
(that same frame too: `hideStoryFrameNow`, so it never flashes back for a frame).
Asset Lab previews character effects on `quadruped-reference.png`, or on a real character:
*Preview on* / *Holding* / *Pose* (sessionStorage `sidescroll.assetlab.effect-preview`) —
`character-preview.js` (`window.SideScrollCharacterPreview`) draws any character — Mesh ones (two- or
four-legged, via `character-game-runtime.js` `load` / `poseParts`) and parts-drawn originals (the rig's
`drawCanvas` into a 2D canvas) — posed as the game's `storyPose` would, holding one of its props, into a
texture on the effect renderer's context (`canvasRenderer().gl`); `render(art, time, sample)` dissolves
that instead of the picture. The sample carries `metres` / `ground` (2.31 × the game's scale, the game's
sole lift: 0 for library characters), and Asset Lab's `computeRender` draws the effect at that size.

## Character registry
`character-registry.js` (`window.SideScrollCharacters`) is the one list of
characters for Character Lab and the game: display names (library characters keep
theirs in their library entry), categories with display order (the game picker
shows categories marked playable), order within a category, roles (protected tags
such as Default player: each on one character, movable, never removed; a character
with a role can't be deleted) and deleted original characters (hidden, since their
data is shared storage). Stored in `sidescroll.characters.registry.v1`, written only
when the author changes something. Load it on any page that lists characters.
Character Lab edits roles and categories in its **Settings** dialog (top bar).
The **Default player** role is the character a new game starts with (any playable
character, library ones included; the game applies it when the device has no character
choice saved) and the one Character Lab opens on (unless sessionStorage holds the
session's selection). Moving it clears this device's saved game choice. The game's
start-up apply uses `applyCharacterVariant(id,false,false)` (show, don't save), so a
saved library-character choice survives until the library characters load.

## Rig templates
`rig-templates.js` (`window.SideScrollRigTemplates`, key `sidescroll.rig-templates.v1`):
named rigs (family + rest proportions). A character's setup holds
`rigTemplate: {id, mode: 'instance'|'unique', revision}`; with none saved, bipeds are
instances of Biped, the original quadruped an instance of Quadruped and library
quadrupeds unique copies. Every character keeps its **own saved copy** of its rig
(the game reads only that), so a template change reaches a character only when the
author accepts *Use updated* in Character Lab (`anim-lab-rig-templates.js`, which also
asks *Edit template / Make unique* on the first edit of a linked rig). Templates are
managed in Settings; character packages carry the linked template and imports add it
only if missing (never overwrite a shared one).

## Animation templates
`animation-templates.js` (`window.SideScrollAnimationTemplates`, key
`sidescroll.animation-templates.v1`): named clips per rig family and slot, the same
model as rig templates. `list()` / `get()` share one parsed store until the saved text changes (`read`;
Character Lab asks per animation per character on every update) — never change what they return;
changes go through `load()` (fresh) and `save()`. Every character keeps its **own saved copy** of each clip —
original characters in `sidescroll.animlab.character-clips.v1` (`characters[id]` =
`{sparseClips, links}`), library characters in their entry (`sparseClips`,
`animationLinks`) — and the game plays only that (a slot with no saved copy plays the
shared family set, which is also where the built-in templates *Biped walk* etc. start
from). Without saved links, original characters are instances of their family's
built-in templates (the heroes share the Biped set), library characters unique.
**Action slots** (`action-slots.js`, key `sidescroll.action-slots.v1`) are one
project-wide list: Idle/Walk/Run/Jump/Climb built in (played by the game; `OPTIONAL` = Climb, which may
play nothing: then the game's coded climbing `poseForClimbing`; a missing built-in slot is inserted
after the built-in before it in a saved order), others added in
Settings ("not hooked up yet" until C5 code or a C6 action path uses them). Each
character maps slots to its animations (`slotAnimations`; no entry = a built-in slot
plays the animation of the same name). Animations the character made (`extraClips`,
key `clip-…`) and names (`animationNames`) sit next to its clips; the game and Quick
Play resolve a slot through the map (`slotClips` in `character-game-runtime.js`,
`evaluateClip` in `walk-lab.js`). `anim-lab-animation-list.js` is the Animate list
(Actions with an animation menu each; Animations with New, Duplicate, Rename,
Delete), saved straight away. **New** asks for a name and a start pose
(`newAnimationStarts` / `newAnimationStartPose`: its Idle slot's first frame by default, the pose
on screen, the rig's rest pose, or another animation's first frame) and creates two keys (frames 0
and 15) holding it — `normaliseSparseClip` replaces any clip with fewer than two keys by the
built-in frames. Bipeds have an `idle` slot (default: the standing pose
the game always used).
Biped keys may set only some controls (`key.channels`, from `GameHubWalkRig.KEY_CHANNELS`;
absent = all): such clips, and Smooth ones, are sampled by `GameHubWalkRig.sampleSparse`
in both Character Lab and the game; others keep the original whole-key path.
`simplifySparse` is Key Pose Tools → Simplify keys. **All keys** (Key Pose Tools toggle, `setOffsetAllKeys`,
session only): `commitPoseDrag` / `commitTransaction` call `offsetOtherKeys(tx.before, frame)`, which adds
every numeric change of the edited frame's pose (`poseDeltas`, nested fields too) to every other key, as
one Undo step.
**Climb animation:** `character-game-runtime.js` `slotClips` includes `climb` (no clip unless the slot
map names one; `ANIMATIONS` is the four built-in animations). The game (`climbClipFor` / `climbClipPose`
in sidescroll.js, tried first in `drawRigCharacter` while `climbState`) samples it at phase = distance
along the climb path / `CLIMB_ANIM_CYCLE_WORLD` (0.92 m; negated going down), blended from standing over
the entry. Character Lab: **New → Today's climbing, converted** (`newAnimationStarts` value `'climb'`,
bipeds) builds 16 keys with `convertedClimbKeys()` (the coded climb's maths on a vertical path at the
setup's scale, from the shared biped walk's standing pose) and fills an empty Climb slot; `clipDuration`
of the Climb slot's animation is `CLIMB_CYCLE_MS` (0.92 m at 1.45 m/s); `anim-lab-stage4.js` Ground Motion
treats Climb as a gait and draws `drawClimbWall`. Slanted climb paths play the same (vertical) animation.
**Scene objects** (`anim-lab-scene-objects.js`, Animate and Play): any asset — every built-in one
(`builtin-assets.js`, grouped as in Asset Lab) and every imported one — stood beside the
character at game size (asset height × Size, its `groundLine` on the ground; both read through
Asset Lab's `sidescroll.asset-layout.v1` overrides), Distance from the
character (in Play, world metres from `AnimLabQuickPlay.state().x`), drawn behind (underlay
renderer) or in front (plugin renderer); session only, nothing saved; test hook
`window.AnimLabSceneObjects.list()`.
**Quick Play test box** (`anim-lab-play.js`): game-sized boxes (0.96 × 0.68 m) to walk
into, jump on, pick up, put down and stack — the body is the character's collider in world
metres (collider × 2.31 × scale, as `colliderWorld()` in the game) — using the game's carry pose
(`GameHubWalkRig.carryPose`). A character's `setup.heldItemLayer` ('auto' | 'front' |
'back' | 'part:<part id or original part name>'; stored only when not auto) says where a
held item is drawn among its parts (`GameHubWalkRig.heldItemIndex`); the game and
Character Lab both use it (Character Lab: `core.setHeldItemDrawer`, the Skin module draws
the parts in two passes around it). `window.AnimLabQuickPlay.state()` is a read-only test hook.
**Animation library (UI name for animation templates, 25 Nov):** shared animations per rig family.
Each action menu (`anim-lab-animation-list.js`) lists the character's animations, then an optgroup
*Library (shared)* (`core.libraryAnimations()`, ones it doesn't already follow; value `lib:<id>`) →
`addLibraryAnimation(id, slot)`: reuses the character's animation already linked to it, else creates an
extra `{name, basedOn, clip, link:{id, mode:'instance', revision}}`, and sets the slot. `animationList`
items carry `library` (linked template id). **New** start `library:<id>` = a full copy, link mode
`unique` ("started from"). `anim-lab-animation-templates.js` is the **This animation** box (status, *Use
library update*, *Make it <name>'s own* = `makeClipUnique`, *Add to library* = `saveClipAsTemplate`;
links of created animations live in `extraClips[key].link`; a pending link waits in `pendingClipLinks`
until Save) and asks *Change for everyone / Make it own* on the first edit of a linked clip and *Use
updated / Keep previous* when its library animation changed. **Animation manager**
(`anim-lab-animation-manager.js`, `window.AnimLabAnimationManager.open()`; from Animate → *Manage
animations…* and Settings → Animations) reads `core.animationManagerData()` (library with
`libraryUsers`; every character with `slots`, `choices` {own, library} and its animations with status
linked / started / own and `deletable`). Tabs: **Characters** (slots with a menu each →
`setSlotAnimationFor` / `addLibraryAnimationFor`, Go to) and **Animations & library** (library: users with
Go to / `makeAnimationOwn`, `renameLibraryAnimation`, `duplicateLibraryAnimation`, `removeLibraryAnimation`;
own: `renameCharacterAnimation`, `duplicateCharacterAnimation`, `addAnimationToLibrary`,
`deleteCharacterAnimation`). These work on any character (`addExtraClip` writes another character's saved
animations directly; the open one goes through the usual paths). `openAnimation(characterId, key)` is
guarded by Save / Discard.

## Props (held assets)
`character-props.js` (`window.SideScrollProps`; loaded by play and walk-lab): any asset can be
held. A character's **grip** for an asset is `setup.holds[asset name]` = `{hand 'near'|'far', x, y
(prop centre from the wrist, along / across the wrist→hand bone, rig units), angle (°, from the
hand bone), size (height, rig units; metres = × 2.31 × setup scale), flip, layer 'hand'|'front'|
'back'|'part:…'}` (`place(geometry, hold)` → centre / angle in character space; `holdFor` gives a
default grip when none is saved). Saved with the setup (Save), so packages, publishing and backup
carry it. Character Lab → **Props** stage (`anim-lab-props.js`, setupTool `'props'`, bipeds):
add a prop (built-in `Props.BUILT_IN` + imported assets), Move / Turn / Size on the viewport pad,
numbers, Mirror, hand, *Drawn*; preview in any animation (`core.setSetupPoseProvider`) and
optionally in Animate / Play (`core.setPropItemsProvider` → items drawn among the parts). Held
things are drawn among a character's parts as a list `[{layer, draw}]` (`heldItems` in
`GameHubWalkRig.drawCanvas`, the Skin mesh renderer and the game's `drawLocalMeshCharacter`, each
placed by `heldItemIndex`). Game: a sequence character component's `holding` (asset names) and
the **Prop** step (`{actor, action 'give'|'take'|'drop', asset}`) decide what is held;
`storyHeldProps` draws each with `drawPropAt` (centred billboard, follows the hand); a drop
(`seqDropProp`) falls and lies on the ground (progress `components["sq:c"].dropped`, drawn by
`drawSeqDroppedProps`); progress `holding` overrides the component's. Story editor: component
*Holds*, Prop step, picker from `host.props()`. Player pick-up / use is the planned next step
(`docs/CHARACTER_SYSTEM_DESIGN.md` → Props).

## Character packages
`character-packages.js` exports one character or all characters to a file and
imports them. A package holds the character's raw saved pieces ("slices", used
for **Replace** — an exact restore) plus a library-entry copy (used for **Add as
copy**), and embeds imported artwork from IndexedDB as PNG data. Built-in
characters (Hero 1 / Hero 2 / Fox) and library characters use the same format;
the heroes share one animation set and collider, so both heroes' packages carry
those. Packages also carry the character's registry entry (name, category, order). Import validates that a file only touches that character's own keys.
Any new per-character storage must be added to `slicesFor()` there.

## Pages and what they load
| Page | Purpose | Main scripts |
|---|---|---|
| `index.html` | Splash/launcher, preloads game assets | `project-defaults-data.js`, `project-defaults.js`, `asset-paths.js`, `site-config.js`, `core.js`, `audio.js`, `home.js` |
| `play.html` | The game + in-game scene/puzzle/sequences editor (`?mode=player` = play only) | `biped-rig.js`, `quadruped-baseline.js`, `quadruped-rig.js`, `puzzle-groups.js`, `character-game-runtime.js`, `near-rows.js`, `action-slots.js`, `sequence-data.js`, `asset-interactions.js`, `character-props.js`, `sidescroll.js`, `sequence-editor.js`, `editor-layout.js`, `colour-picker.js` |
| `walk-lab.html` | Character Lab (atlas, parts, rig, skin, props, animate, scene objects, animation manager) | `walk-lab.js`, `anim-lab-*.js`, `asset-library.js`, `character-props.js`, `rig-templates.js`, `animation-templates.js`, `action-slots.js`, `character-packages.js` (export/import, see below) |
| `asset-lab.html` | Asset collision/states; **+ Import asset** | `asset-library.js`, `builtin-assets.js`, `asset-interactions.js`, `asset-lab.js`, `effects.js`; for the character effect preview `biped-rig.js`, `character-game-runtime.js`, `character-props.js`, `character-preview.js` |
| `puzzle-lab.html` | Reusable puzzle groups | `puzzle-lab.js`, `puzzle-groups.js` |
| `world-lab.html` | Journey layout / placement; Sequences track; player start | `world-lab.js`, `sequence-data.js`, `asset-library.js` |
| `design-lab.html` | Living game design doc | `design-lab.js`, `design-doc.json` |
| `concept-lab.html` | Concept art boards | inline + `concept-lab-data.json` |
| `publish-lab.html` | Status of each area/character vs published; publish package; Use published; My settings | `publish-lab.js`, `character-packages.js` (+ registry/templates/slots) |
| `project-snapshot.html` | Backup / restore of all local data | `project-snapshot.js`, `project-restore.js` |

**Editor screen zones** (`editor-layout.js`, `window.SideScrollEditorLayout`; rules in the UX bible →
Screen zones): every panel you edit in opens in one **dock** on the left (`DOCK_IDS`, CSS block at the end
of `style.css` keyed by panel id; `--ss-dock-w`, `--ss-top`): the last one opened is on top (`ss-dock-top`),
the others stay open but hidden (`ss-dock-under`), the editor drawer is always the bottom. `--ss-dock-right`
(the top panel's right edge) places the object toolbar and status line; `clearLeft()` keeps canvas labels
off the dock. New panels go in `DOCK_IDS`, never on the right. The object toolbar never scrolls:
`fitToolbar()` (same file) moves tools that don't fit behind a **More** button (`OVERFLOW_FIRST`, then from
the end, Delete last; `ss-overflowed`, a second row above when open). **Move pad** (`#sidescroll-move-pad`,
sidescroll.js `setMovePadOpen` / `syncMovePad` from `updateEditorButtons`): relative drags of the selected
object or locked World Group, X·Y / X·Depth, Fine (sessionStorage `sidescroll.editor.move-pad`), through
`moveSelectedTransformAxis(axis, value, {live:true})` per frame and one `recordObjectEdit` when the drag
ends (`movePadCommit`). **Colour picker** (`colour-picker.js`, `window.SideScrollColourPicker`): every
`input[type=color]` on the game page gets a swatch and an inline picker under its row (hue / saturation /
brightness bars, recent colours in localStorage `sidescroll.editor.recent-colours`, hex, Done) instead of
iPhone's full-screen one. The input keeps the value: the picker fires `input` (once a frame while
dragging) and `change` (on release); values set by code reach the swatch through a per-input `value`
setter, ignored while a bar is held. New colour fields need nothing extra. **Tuck:** while the body has
`sidescroll-placement-mode` or `ss-pad-open` (not in puzzle testing or with the story timeline open), or
`ss-framing` (Frame it, `seqFrameShot`: also hides the touch controls unless `ss-framing-controls`, the
framing bar's Controls button),
`editor-layout.js` adds `ss-dock-tucked` (the dock slides off the left edge) and shows `#sidescroll-dock-tab`;
the tab sets a peek (dock back), a tap on the canvas or pad surface clears it; `--ss-dock-right` is then the
tab's edge. Other modes that need the whole scene can join `tuckState()`.

`sw.js` is the service worker. `style.css` is shared by index/play/walk-lab/asset-lab.

**Sequences and events** (`sequence-data.js`, `window.SideScrollSequences`; `sequence-editor.js`;
design `docs/SEQUENCE_SYSTEM_DESIGN.md`, steps 1–2 done). Content keys `sidescroll.story.events.v1`
(`events:[{id ev-…, name, roles:[{id r-…, name, kind 'character'|'mark'}], steps:[{type
(Seq.STEPS: move, animate, face, say, think, wait, flag, show, control, camera, screen, prompt, item,
effect, look, prop, object, wear), with (run with the
previous step), background (don't wait: the next beat starts while it runs; the run ends only when
it has finished too — `run.background` in `advanceSequenceRuns`), actor/to/target (role ids; a
Say step's actor may be `Seq.PLAYER` = the player, named by `storyPlayerName()`), …}]}]`) and `sidescroll.story.sequences.v1`
(`{templates:[{id sqt-…, name, body}], placed:[{id sq-…, name, x (anchor), template | body}]}`,
body = `{components:[{id c-…, kind 'character'|'mark'|'zone'|'object', name, dx (from the anchor), depth,
facing, character, animation (action slot), scale, blocks, holding? | width | asset, size, lift (m), rotate (°, + clockwise), startHidden}], logic:[{id l-…, when:{type
(Seq.WHEN: load, enter, action, finish, flag), zone, label, line, flag}, event, roles:{role id:
component id}, condition?, once}]}`; `Seq.bodyOf` gives a placed sequence's body). A **condition**
(a line's `condition`, a barrier's `active`) is `{flag, when 'set'|'unset'}` or, for several flags,
`{flags:[…], match 'all'|'any', when}` (`Seq.normaliseCondition` / `conditionMet` / `conditionFlags`;
unset + any = "until all are set"). **Barrier** components (kind `barrier`, `dx`, `active?`, `say?`)
are invisible walls (an Object component's `takeWhen` condition + `notYet` text gate taking it: `seqTakeRefusal`, checked in `openInspect` and `collectTarget`); barriers: `resolveSequenceBarriers` (after `resolveWorldCharacterBlocking`) keeps the player
on her side while `active` holds and shows `say` as a thought (throttled 4 s). Editor: `conditionField`. Animations in
events and components are **action slots**: each character plays its own animation for the slot.
The game's runtime (`sidescroll.js`: `updateWorldCharacters`, `drawWorldCharacters`,
`resolveWorldCharacterBlocking`, `updateStoryTriggers` → `seqFireLine` / `advanceSequenceRuns` /
`seqStartStep`) draws sequence characters with the player's drawing code (`drawLocalMeshCharacter`
and `drawRigPartWebGL` take a `body`), keeps the player out of blocking ones, fires lines outside
edit mode (and in ▶ Play), runs events as beats, and `storyControlLocked()` pauses the player while
a Control step holds it (released when the event ends). Camera steps set `seqCamera` (a shot
eases from the current view: deltas dx/dy/dz/dt added to the view in `render`, height following
the ground under the target via `legacyPathGroundYAt`); Screen steps drive `.sidescroll-seq-fade` /
`.sidescroll-seq-bars` (a Camera step with 0 s is a cut; the editor's **Frame it** calls
`host.frameShot` → `seqFrameShot`: a held shot plus a gesture overlay, values back through
`onChange`, released on Done / Cancel; shot `distance` −20…30 m, negative = closer, so a shot can pass the path); `seqReleaseRun` lets go of camera, fade and bars when the owning event ends (a shot with `keep`
stays until a Camera *back* step). A *Wait for Action* step (`prompt`) parks its run until Action
is pressed (`seqPromptRun` / `answerSeqPrompt`; works while control is taken); logic `leave` lines
fire when the player's body leaves a zone. Progress `sidescroll.player.story-progress.v2`
(`Seq.loadProgress/saveProgress`: flags, `fired["sq:l"]`, `components["sq:c"]` {x, depth, facing,
animation, hidden, asset}). **Objects** (kind `object`, role kind `object`): any asset drawn by
`drawSeqObjects` (after `drawSeqDroppedProps`; billboard at game height × size, floor line from
`groundLine`, `seqObjectBox` for hit-tests and the editor outline; hidden ones faint while editing);
the **Object** step (`{actor, action 'show'|'hide'|'swap', asset}`) sets progress `hidden` / `asset`. The editor (the **Story** tab) talks to the game through `window.SideScrollSequenceHost` (pick-lists use
its `openPicker`, the asset browser's right-hand window); taps arrive as `sidescroll:story-tap`; the scope id is `'story'`. Zones the player already stands
in fire only once she has left them. The 8–9 Nov world characters / marks / triggers are retired.
**Timed events** (`event.timed`): steps carry `at` (seconds from the event's start) instead of
`with` / `background`; the game's `advanceTimedRun` keeps a clock per run and starts each step
when it reaches `at` (`seqStepOrder`); a *Wait for Action* step stops the clock (`run.pauseFrom`)
until answered; the run ends when every step has finished. Untimed events (older saves) still run
beat by beat, but the editor converts every event on load (`timeAll` / `makeTimed`, keeping each
step's start; saved with the next Save). **Story editor:** an event is made on its **⤢ Timeline**
(`openTimeline(step?)` / `renderTimeline`, a full-screen layer on `document.body`, z 1005, hidden
while a pick-list is open); the event page shows only a summary in time order (`summaryRow`, tap →
the timeline on that step). Rows are by subject (`timelineRows`: one per character role, Player,
Camera, Screen, Look, Game; `rowKeyOf(step)` decides a step's row, nothing about rows is stored;
overlapping steps get extra lines). Tap an empty spot on a row → that row's `ADD` choices at that
time (`createStep`); drag ⋮⋮ or press-and-hold to move (snap 0.1 s, magnet to other steps' edges;
to another row only where `canMoveTo` allows — a line changes speaker, a character step changes
character — `putOnRow`); drag the right edge (`resizable` / `setLength`) to set a length; instant
steps (`isInstant`) are diamonds; tap → side sheet (`stepEditor`, Duplicate / Remove / Done);
pinch / ctrl + wheel zoom (`zoomTimeline`); ↶ ↷ (`history`, snapshots of the whole Story draft;
typing within 1 s is one step), + Add, + Character, Discard, Save. **Docked with the game:** sizes
`timeline.size` 'bar' | 'half' | 'full' (▁ ▄ █, or the top-edge handle: `bindHandle`) and
`timeline.aside` (‹ / swipe left on the handle → `.sidescroll-tl-rail`, a copy of the editor panel's
collapsed rail placed over the panel's box; tap or swipe right to expand), kept in
sessionStorage `sidescroll.story.timeline-view` (with `focus` and `opacity`). Body class `sidescroll-tl-open`
hides the editor drawer only: the TEST bar stays (z 1012; Full starts 64 px down, below it);
`sidescroll-tl-shown` (open and not collapsed) is what hides the touch controls in timeline focus.
**Focus** (🎮 / ✎, `timeline.focus`): on the timeline, the touch controls are hidden under it; on
the game (`.focus-game`, body `sidescroll-tl-focus-game`) the timeline lets taps through (only its
top line, handle and side sheet stay live), the controls sit above it, and a playing Bar is
raised above them. ▶ gives the game the focus and ■ hands it back (`focusBeforePlay`). **◐**
cycles `--tl-alpha` (100 / 75 / 50 / 25 %). The timeline only overlays the game: the game view
never changes size.
Bar shows a strip of the whole event (`.sidescroll-tl-mini`: a line per row, tap = edit) instead of
rows; at Bar / Half the side sheet is fixed at the right over the game.
**Story clock** (`storyNow()` in sidescroll.js): wall time, but `setStoryPaused(on)` freezes it
(`storyPausedAt`; resuming shifts it by the pause, `storyClockShift`) and seeking moves it. Walks,
animation phases, effects, the sequence camera, speech (`storySpeechUntil` / `updateStorySpeech`)
and looks (`lookState.t0` in story ms) all read it, so they pause and seek with it; while paused
the player can't move (`storyControlLocked`), Action is ignored and the follow camera holds.
Think bubbles (puzzle thoughts, a timer) and CSS fades still run on wall time. **Animation
blending:** `storyBlendedPose` (in `drawStoryCharacter`) eases a sequence character from the pose
it was last drawn in to its new animation over `STORY_BLEND` (0.3 s of story time) via the rig's
`interpolatePose`; `seqSeekEvent` clears `storyBlends`. Any new
sequence timing must use `storyNow()`. TEST bar **❚❚ Pause / ▶ Resume** (`#sidescroll-test-pause`,
while playing); editor play stopping, ↺ Restart and leaving edit mode unpause.
**Transport, shared by the TEST bar and the timeline:** `host.transport(eventId)` → `{playing
(editor play), paused, clock (seconds into the open event's run, or null), prompt}`; the timeline
polls it every frame (`syncTransport`), so its playhead, clock and ▶ / ❚❚ follow the event however
it started (▶ here, TEST bar ▶ Play / ↺ Restart and walking into the zone, …), and focus follows
the game (`followFocus`: playing → 🎮, paused or stopped → back). **▶** (`togglePlay`) resumes a paused
run, or plays from the playhead (or the start) via `seekTo`; **❚❚** → `host.setPaused`; **⏮**
(`toStart`) → seek 0, paused. **Scrubbing:** drag or tap the ruler or the playhead itself (Half / Full) or the Bar's strip
(`bindStripScrub`; a tap on a step's line still opens it) → `scrubTo` → `host.seekEvent(eventId,
placedId, t)` = `seqSeekEvent` (stop every sequence, reset the one whose line runs the event, turn on
editor play if off, player on the line's zone, fire the line paused, then advance the story clock
in 1/30 s ticks of the sequence updates until the event's clock (`seqEventClock`) reaches *t*,
answering Wait for Action on the way; fades and bars land without their transitions); scrubbing
lands paused and resumes if it was playing. **Edits replay to the playhead:** `preview()` calls
`replayAtPlayhead` (paused or playing as before). `host.playEvent` = seek 0 then resume;
`host.stopEvent` remains. **📷 Frame it** pauses and pushes the timeline aside, restoring it on Done.
Next: a sequence-level node graph.
**Editor TEST bar** (`#sidescroll-test-bar`, every scope): ▶ Play sets `editorPlayTest` — the game
runs inside edit mode (`setEditorPlayTest`; body class `sidescroll-edit-playing` shows the game
controls). Gameplay code tests `editLocked()` (= editing and not playing) where Play must work;
`editMode` alone still means "the editor is open". New test controls belong in this bar.
**⚑ Progress** (TEST bar, `renderProgressWindow`, palette mode `'progress'`): puzzles and placed
sequences by x with Go / Complete / Reset, flag chips, Complete all / Reset all. Puzzles:
`progressCompletePuzzle` applies the **Solved State** (`sidescroll.puzzle-groups.solved.v1`, keyed
like starts: `tpl:<group>` for instances, set by *Set Solved State*), marks solved, adds the reward;
`progressResetPuzzle` reverses it. Sequences: `seqCompleteSequence` runs each line's steps instantly
(moves land), `seqResetSequence` undoes its components, fired lines, flags, and items (given items
carry inventory source `seq:<id>`; the **Item** step's takes are recorded in progress `taken`).
**Skip** (`seqSkip`, button `#sidescroll-seq-skip` made by `seqSkipButton`, top centre, z 1011): shown
by `syncSeqSkip` (in `advanceSequenceRuns`) while `seqCanSkip()` — not `editLocked()`, not paused, and a
run holds control (`seqControlLocks`); held for `SEQ_SKIP_HOLD_MS` (or Escape) → `seqFinishRunNow` on
each such run: its characters' walks land, its effects end (`seqEffectEndsHidden`; effects carry `run`),
its remaining steps go through **`seqApplyStepInstant`** (the one place a step's lasting result is
defined — also used by `seqCompleteSequence` and recovery; with `run.instant` a Look is set without a
blend and a dropped prop doesn't fall), fade / bars / camera cut back (a kept shot lands), then
`seqEndRun(run, true)` (quiet: the skip fires its *finish* lines itself and skips those runs too).
A Control *take* records progress `running["sq:l"]`; `seqEndRun` / `seqStopSequence` / preview clear it
(`seqForgetRunning`). On the first unlocked `updateStoryTriggers`, `seqFinishInterrupted` applies the
end state of any line still `running` (the game closed mid-event) and feeds them to the *finish* lines.

**World Lab sequences and player start:** the SEQUENCES track (`renderSequences`,
`renderSequenceSelection`) draws each placed sequence over its components' extent and moves its
anchor by drag or Anchor X, saving `sidescroll.story.sequences.v1` straight away (`saveSequenceX`,
which also shifts this device's story-progress component positions by the same amount; Undo
restores anchors). **Player start** (`sidescroll.world.player-start.v1`, content, World area:
`{x, facing}`; World Lab's START flag) is where the game begins when the device has no saved
position (`restorePlayerPosition`, player mode); the editor opens there too (`editorOpenStart`)
unless World Lab sent a `worldX`.

**Looks** (`looks.js`, `window.SideScrollLooks`, key `sidescroll.looks.v1`, World area):
`{looks:[{id look-…, name, fog:{enabled, color, near, far, amount, curve}, post:{brightness,
contrast, saturation, tintColor, tintAmount}, light:{color, strength}}]}`. The saved Fog / Post /
Light settings are the **base look** (`baseFog` / `basePost` / `baseLight`); `fogSettings` /
`postSettings` / `lightSettings` are the live values the renderer reads. **Global light** (Menu →
**Light**, key `sidescroll.render.light.v1`, `DEFAULT_LIGHT` white × 1, strength 0–1.5, `points` 0–2 =
scale for every point light, applied in `collectPointLights`, blended with looks): the scene
shader's `uLight` (= `lightRgb`, colour × strength, refreshed by `syncLightRgb`) multiplies every
object's colour before fog (`tex.rgb * uTint * uLight`), uploaded next to `uFogColor` at each draw
setup; `saveLightSettings` writes the active look or the base. **Point lights:** the built-in **Light** node
(`light-node`, editor library → WORLD OBJECTS, an editor node like Thought / Camera Nodes:
`isEditorNodeObject`, hidden in play in `drawObject`). Each placed copy keeps its own
`obj.pointLight` `{color, strength 0–3, radius 0.5–20 m, flicker 0–1, flickerSpeed}` (`cleanPointLight`;
carried by `pointLightField(src)` on every save / copy / puzzle / World Group path beside the camera-node
fields — a new path that copies node fields must carry it too). Selecting one opens the Light panel
(`#sidescroll-light-node-editor`, `syncLightNodeEditor`, called from `syncCameraNodeEditor`; inputs live,
`change` = `recordObjectEdit`); the editor overlay draws its reach circle. Older lights made in Asset Lab
(effect entries with `SHADERS.light`, `Effects.isLight`, `lightAssets`) still light the scene; Asset Lab
no longer offers *New light*.
`collectPointLights` (each frame, after `renderEffectTextures`) takes the 8 lights nearest the camera
(position = the marker's centre, flicker applied) and `uploadPointLights` sets `uPointPos[8]` (xyz +
radius) / `uPointCol[8]` / `uPointCount` once per frame after `gl.useProgram(program)`; the shader adds
`colour × (1 − d/r)²` (world distance via `vWorld`) to `uLight`. `liveLook()` is the live {fog, post,
light}; looks saved before light have none (`cleanLight` → white 1). `setWorldLook(id|null, seconds)` blends the live values (`updateWorldLook` in `render`);
while a look is active `saveFogSettings` / `savePostSettings` write into that look
(`saveLiveLookEdit`), else into base. Menu → Looks (`syncLookUi`). Event step `look` (`{look,
seconds}`) sets it and records `progress.look {id, by}` (applied on load in player mode;
cleared by Reset story / that sequence's reset). New look parameters: add them to looks.js
`clean…`, `copyFog` / `copyPost`, `writeLiveLook` and the blend in `updateWorldLook`.

**Environment list and search** (`renderEnvironmentSelectionTools`): the Select Filter (chips
from `environmentSelectionCategories`; items may carry their own `selectionKey`, e.g. Thought /
Camera Nodes) limits scene taps and the list; `environmentSearchQuery` matches label, asset name,
group and thought text, and also lists puzzle contents (`puzzleSearchEntries`: live copies, else
the Start State); `openPuzzleObject` moves the player there (puzzles stream by player x), opens
the puzzle's edit session and selects the object (node settings open).

**Near-side rows** (`near-rows.js`, `window.SideScrollNearRows`, loaded by play and
world-lab): a biome profile's optional `nearRows` (`{enabled, rows:[3 × {on, depth,
depthJitter, scale, scaleJitter, spacing, spacingJitter, textures}]}` in
`sidescroll.biomes.v1`). The game builds row items (`nearrow-<profile>-<row>-<n>`,
seeded per profile and row) in `buildNearRows()`; `proceduralBiomeVisibleAt` shows a
profile's rows where its rows are on and the old scattered near side (`nearClassic`)
elsewhere. Edited in the game editor (Environment → Near-side rows, live rebuild, own
Save/Revert). World Lab's `normaliseBiomeState` must keep `nearRows`.

## Rules (carried over from Design Lab → Project Workflow)
1. **Phone-first.** No package manager, bundler or desktop-only toolchain unless
   the user agrees. Every change must work by merging to `main`.
2. **Protect local authoring data.** Players' and the user's work lives in
   `localStorage` and IndexedDB on the device. Never require clearing site data;
   prefer migrations and fix-forward. Saved data references art by **bare
   filename** (e.g. `quadruped-deform-atlas-v2.png`, or its old name
   `fox-deform-atlas-v2.png`, checked in `character-game-runtime.js`), so renaming/moving art needs a path resolver,
   not a find-and-replace.
3. **Design Lab merge rule.** On load, Design Lab only adds *missing IDs* from
   `design-doc.json`; it never overwrites an existing ID. To get new design
   content to an existing user, add a new entry with a new stable ID.
4. **Service worker / caching.** `sw.js` has one cache name (`CACHE`). **Do not
   change it for normal releases**: a new name deletes every cached file on
   players' devices and forces a full (~70 MB) re-download, which is what made the
   first launch after the `assets/` move take minutes. HTML/JS/CSS/JSON are
   network-first, so code updates arrive without it. **Images/audio are
   cache-first by exact URL**, so changed art needs a new version in
   `asset-paths.js` (see below). Don't add parallel cache strategies.
5. **Small blast radius.** Smallest safe change; identify data ownership before
   adding a system; never duplicate authoritative state between labs and runtime.
6. **Ownership model.** Asset = what an object is. Puzzle = how objects/rules
   combine (puzzle-owned elements are relative to the puzzle marker). World
   Element = where content sits in the journey. Section = runtime/streaming chunk.
7. **Persistence changes** must update `docs/SIDESCROLL_EXPORT_COVERAGE.md` and
   the Project Backup export/restore in the same change, and every new storage key
   needs a line in `storage-catalogue.json`.
8. **Durable architecture/UX rules** go in `docs/SIDESCROLL_ENGINE_UX_BIBLE.md`.

## Testing
- Serve locally: `python3 -m http.server 8765` in the repo root, then drive pages
  with Playwright (pre-installed). Check for 404s and page errors on every page
  you touched; `serviceWorkers:'block'` avoids stale caches.
- Headless Chromium is **not** iPhone acceptance. Always tell the user exactly
  what to check on the device, and add it to `TASKS.md` → Needs iPhone testing.

## Gotchas
- `sidescroll.js` is ~24k lines and `style.css` ~16k; grep, don't read whole.
- `biped-rig.js` line 79 is an 821 KB base64 image — never print it.
- Rigs: any rig with a `RIG_DESIGNER` (joints, bones, groups) and rest-rig functions
  works in the Rig Designer, Parts, Skin and game mesh drawing. The Biped
  (`biped-rig.js`) measures its bone lengths, spine directions, pelvis X and elbow/knee
  bend sides from a rest rig (`restLengths`) while its animation channels still drive
  it (so `geometry(restPose(rig),rig)` lands on the rig's joints); `restPose(restRig)` stands it on its rest
  rig and its geometry also reports joints by rig name (`kneeNear`, …). Every biped
  keeps its own rest rig in its setup (original bipeds in `sidescroll.animlab.setup.v1`);
  the game reads it via `bipedRestRig()`. Bipeds have no original parts meshes, so a
  biped's Mesh is built from Atlas meshes only.
- Skin weights refer to a rig's bones by their **position** in `RIG_DESIGNER.boneLinks`,
  so new bones are only ever appended at the end (biped hands, then Lower/Upper Back, then
  Sole/Toes; bone 0 stays the pelvis-to-chest *Whole Back* and the ankle-to-toe *Whole Foot*
  bones stay for older skins, which keep the bones their saved shape describes). A binding's `bones`
  list (Skin → *Bones this part follows*) wins over its `group`; a jointGroup may list
  its `bones` explicitly. `blend` (metres) shares points near joint lines. `pin`
  ({bone, strength, fade, curve}; Skin → *Pin to body*) adds a body bone's influence to
  points by their place along the part's own bone chain from its root joint (hip/shoulder):
  `strength` there, fading over `fade` of the chain (`curve` −1 gentle … 1 sharp; older
  pins have a radius `reach`, read along the chain), applied after the mode's weights
  (`applyPin` in `anim-lab-assembly-skin.js`) and baked into `weights` — the game reads
  only `weights`. walk-lab's skin binding cleaner must keep each new binding field.
- Character Lab draws posed meshes with WebGL (`gpuDrawMeshes` in `anim-lab-assembly-skin.js`,
  one offscreen canvas composited per frame); the clipped-triangle Canvas path
  (`rasterTriangles`) is the fallback and Display → GPU mesh off. Safari is very
  slow at the Canvas path, so keep heavy per-triangle Canvas work out of playback.
- A character's drawing method (Parts / Mesh) is its Parts assembly's `enabled` flag.
  `anim-lab-mesh.js`'s old Skin Prototype is retired; the file only still builds the
  original parts' mesh (`window.AnimLabLegacyAtlas`) that Mesh drawing uses.
- PLAY on the splash screen loads the game into the splash page using the script
  list in `play.html` (`home.js`), so a script added to `play.html` is picked up
  automatically.
- About the first 10,000 lines of `style.css` are leftover styles from older
  GameHub games (clock, sums, laser, racer…); cleanup is a planned task.
- Script/CSS `?v=` numbers in the HTML pages are still hand-maintained and
  inconsistent (art versions are centralised in `asset-paths.js`).
- Text is UK English (colour, behaviour, centre).
- Nothing is named after a character except display names (agreed design). The
  original characters' IDs are `char-1` (Hero 1), `char-2` (Hero 2), `char-3` (Fox);
  rig families are `biped` / `quadruped`. Code that means "the original quadruped"
  finds it by rig (`isOriginalQuadruped`, `ORIGINAL_QUADRUPED_ID`), never by ID.
  Older saved data (`original` / `alternate` / `fox`, families `human` / `fox`,
  `fox-authoring-baseline-…`) is migrated by `saved-data-migrations.js` (see
  **Saved-data migrations**). Globals: `SideScrollQuadrupedRig`, `GameHubWalkRig`
  (biped), `SideScrollQuadrupedBaseline`, `AnimLabQuadrupedStarter`.

## Docs index (`docs/`)
- `SIDESCROLL_ENGINE_UX_BIBLE.md` — architecture and UX rules (authoritative).
- `CHARACTER_SYSTEM_DESIGN.md` — **agreed target** for characters: templates (instance / unique copy), actions, abilities, action paths. Read before any Character Lab work.
- `STORY_EDITOR_UX_PLAN.md` — **proposed** (27 Nov) review and staged plan for the sequence page, Asset Lab interactions and an ⓘ Info system.
- `SEQUENCE_SYSTEM_DESIGN.md` — **agreed target** (10 Nov) for story and world behaviour: sequences placed like puzzles (components + logic of *When → run event*), a game-wide events library with roles. The 8–9 Nov world characters / marks / triggers model is retired.
- `SIDESCROLL_CHARACTER_AUTHORING.md` — Character Lab / rig / skin / animation system.
- `SIDESCROLL_EXPORT_COVERAGE.md` — what is persisted and exported, per lab.
- `ART_ASSET_PIPELINE.md`, `SETTLEMENT_TEXTURE_PROCESSING_WORKFLOW.md` — art processing checklists.
- `CONCEPT_ART_BRIEF.md` — brief for concept-art generation sessions.
- `ART_GEN_PROMPT.md` — the short style prompt to paste into an image generator for new game assets (with reference images).
- `TEXTURE_COMPRESSION_PLAN.md` — parked plan: texture streaming, then KTX2 / Basis compressed textures.
- `SETTLEMENT_STAGE1_SOURCE_AUDIT.md`, `TEXEL_AUDIT.md` — past art audits.
