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
  built-in content is the starting point). Never edit it by hand.
- **Publishing character art:** the tool writes a character's imported PNG to
  `assets/char-<character id>-<content hash>.png` and switches its atlas document
  to `{kind:'bundled', file}`; the game and Character Lab load that pattern only
  (plus `quadruped-deform-atlas-v2.png`). A new hash means a new file name, so changed
  art is fetched fresh; older files for that character are removed. A Project
  Backup alone cannot carry art (the tool says which characters stay phone-only).
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
  puzzle-lab and world-lab. New pages that read saved data must include them.
- Left out on purpose: everything not scoped content/migration in the catalogue.
- IndexedDB images are not in a Project Backup; they reach the game through
  character exports (see above).
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
model as rig templates. Every character keeps its **own saved copy** of each clip —
original characters in `sidescroll.animlab.character-clips.v1` (`characters[id]` =
`{sparseClips, links}`), library characters in their entry (`sparseClips`,
`animationLinks`) — and the game plays only that (a slot with no saved copy plays the
shared family set, which is also where the built-in templates *Biped walk* etc. start
from). Without saved links, original characters are instances of their family's
built-in templates (the heroes share the Biped set), library characters unique.
**Action slots** (`action-slots.js`, key `sidescroll.action-slots.v1`) are one
project-wide list: Idle/Walk/Run/Jump built in (played by the game), others added in
Settings ("not hooked up yet" until C5 code or a C6 action path uses them). Each
character maps slots to its animations (`slotAnimations`; no entry = a built-in slot
plays the animation of the same name). Animations the character made (`extraClips`,
key `clip-…`) and names (`animationNames`) sit next to its clips; the game and Quick
Play resolve a slot through the map (`slotClips` in `character-game-runtime.js`,
`evaluateClip` in `walk-lab.js`). `anim-lab-animation-list.js` is the Animate list
(Actions with an animation menu each; Animations with New, Duplicate, Rename,
Delete), saved straight away. Bipeds have an `idle` slot (default: the standing pose
the game always used).
`anim-lab-animation-templates.js` asks *Edit template / Make unique* on the first
edit of a linked clip and *Use updated / Keep previous* when its template changed.

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
| `play.html` | The game + in-game scene/puzzle editor (`?mode=player` = play only) | `biped-rig.js`, `quadruped-baseline.js`, `quadruped-rig.js`, `puzzle-groups.js`, `baked-game-design.js`, `character-game-runtime.js`, `sidescroll.js` |
| `walk-lab.html` | Character Lab (atlas, parts, rig, skin, animate) | `walk-lab.js`, `anim-lab-*.js`, `rig-templates.js`, `animation-templates.js`, `action-slots.js`, `character-packages.js` (export/import, see below) |
| `asset-lab.html` | Asset collision/states | `asset-lab.js` |
| `puzzle-lab.html` | Reusable puzzle groups | `puzzle-lab.js`, `puzzle-groups.js` |
| `world-lab.html` | Journey layout / placement | `world-lab.js` |
| `design-lab.html` | Living game design doc | `design-lab.js`, `design-doc.json` |
| `concept-lab.html` | Concept art boards | inline + `concept-lab-data.json` |
| `project-snapshot.html` | Backup / restore of all local data | `project-snapshot.js`, `project-restore.js` |

`sw.js` is the service worker. `style.css` is shared by index/play/walk-lab/asset-lab.

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
- `sidescroll.js` is ~21k lines and `style.css` ~15k; grep, don't read whole.
- `biped-rig.js` line 79 is an 821 KB base64 image — never print it.
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
- `SIDESCROLL_CHARACTER_AUTHORING.md` — Character Lab / rig / skin / animation system.
- `SIDESCROLL_EXPORT_COVERAGE.md` — what is persisted and exported, per lab.
- `ART_ASSET_PIPELINE.md`, `SETTLEMENT_TEXTURE_PROCESSING_WORKFLOW.md` — art processing checklists.
- `CONCEPT_ART_BRIEF.md` — brief for concept-art generation sessions.
- `SETTLEMENT_STAGE1_SOURCE_AUDIT.md`, `TEXEL_AUDIT.md` — past art audits.
