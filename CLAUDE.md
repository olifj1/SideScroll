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
- Root — the live app: pages, scripts, data, and all art the game/labs load.
  (Art is still flat in the root; moving it into `assets/` is a planned task.)
- `docs/` — design and engine docs. `docs/patch-notes/` old per-patch notes,
  `docs/audits/` one-off audit JSON, `docs/archive/` the old task log.
- `assets/unplaced/` — art kept for future use, not referenced by code yet.
- `review/` — unreferenced files awaiting a keep/delete decision (`review/README.md`).

## Pages and what they load
| Page | Purpose | Main scripts |
|---|---|---|
| `index.html` | Splash/launcher, preloads game assets | `site-config.js`, `core.js`, `audio.js`, `home.js` |
| `play.html` | The game + in-game scene/puzzle editor (`?mode=player` = play only) | `walk-rig.js`, `fox-authoring-baseline.js`, `fox-rig.js`, `puzzle-groups.js`, `baked-game-design.js`, `character-game-runtime.js`, `sidescroll.js` |
| `walk-lab.html` | Character Lab (atlas, parts, rig, skin, animate) | `walk-lab.js`, `anim-lab-*.js`, `lab-data.js` |
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
   filename** (e.g. `fox-deform-atlas-v2.png`, checked exactly in
   `character-game-runtime.js`), so renaming/moving art needs a path resolver,
   not a find-and-replace.
3. **Design Lab merge rule.** On load, Design Lab only adds *missing IDs* from
   `design-doc.json`; it never overwrites an existing ID. To get new design
   content to an existing user, add a new entry with a new stable ID.
4. **Service worker / caching.** `sw.js` has one cache name (`CACHE`); bump it when
   shipping. HTML/JS/CSS/JSON are network-first, **images/audio are cache-first**,
   so changed art under the same filename needs a new `?v=` query where it is
   referenced or players keep the old image. Don't add parallel cache strategies.
5. **Small blast radius.** Smallest safe change; identify data ownership before
   adding a system; never duplicate authoritative state between labs and runtime.
6. **Ownership model.** Asset = what an object is. Puzzle = how objects/rules
   combine (puzzle-owned elements are relative to the puzzle marker). World
   Element = where content sits in the journey. Section = runtime/streaming chunk.
7. **Persistence changes** must update `docs/SIDESCROLL_EXPORT_COVERAGE.md` and
   the Project Backup export/restore in the same change.
8. **Durable architecture/UX rules** go in `docs/SIDESCROLL_ENGINE_UX_BIBLE.md`.

## Testing
- Serve locally: `python3 -m http.server 8765` in the repo root, then drive pages
  with Playwright (pre-installed). Check for 404s and page errors on every page
  you touched; `serviceWorkers:'block'` avoids stale caches.
- Headless Chromium is **not** iPhone acceptance. Always tell the user exactly
  what to check on the device, and add it to `TASKS.md` → Needs iPhone testing.

## Gotchas
- `sidescroll.js` is ~21k lines and `style.css` ~15k; grep, don't read whole.
- `walk-rig.js` line 79 is an 821 KB base64 image — never print it.
- About the first 10,000 lines of `style.css` are leftover styles from older
  GameHub games (clock, sums, laser, racer…); cleanup is a planned task.
- Asset `?v=` numbers are hand-maintained and inconsistent across pages.
- Text is UK English (colour, behaviour, centre).

## Docs index (`docs/`)
- `SIDESCROLL_ENGINE_UX_BIBLE.md` — architecture and UX rules (authoritative).
- `SIDESCROLL_CHARACTER_AUTHORING.md` — Character Lab / rig / skin / animation system.
- `SIDESCROLL_EXPORT_COVERAGE.md` — what is persisted and exported, per lab.
- `ART_ASSET_PIPELINE.md`, `SETTLEMENT_TEXTURE_PROCESSING_WORKFLOW.md` — art processing checklists.
- `CONCEPT_ART_BRIEF.md` — brief for concept-art generation sessions.
- `SETTLEMENT_STAGE1_SOURCE_AUDIT.md`, `TEXEL_AUDIT.md` — past art audits.
