# SideScroll — Changelog

Newest first. One or two lines per release. Detailed notes for 1.1.0–1.1.27 are in
`docs/patch-notes/`; history before that is in `docs/archive/SIDESCROLL_TASKS.md`.

## Unreleased
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
