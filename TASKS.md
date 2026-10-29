# SideScroll — Tasks

The single task list. Open work only: when something is done, delete it here and
add a line to `CHANGELOG.md`. Detail and history for older items:
`docs/archive/SIDESCROLL_TASKS.md` (search for the version number shown).

Last reviewed: 29 October 2026 (v1.1.27).

---

## Now

### Character Lab → actual game runtime (top priority, agreed 23 Oct)
Stage A (generalisation) shipped in 1.1.26–1.1.27. Next:
- [ ] **Stage B — authored Bipeds:** rig topology interface for authored Bipeds; deformable and rigid single-bone Parts attachment; Skin mapping; then game-runtime parity. No hard-coded Fox bone IDs in the generic renderer. Ship in small, separately testable drops.
- [ ] Finish isolating Fox-specific bone/vertex/attachment assumptions in shared modules; descriptor-driven bone/action-control mapping without changing saved IDs. *(Stage A continuation, 1.1.26)*
- [ ] Remaining CL1: custom characters built from original rigid pieces with edited Parts offsets, bundled `atlas-builtin-*` mesh sources, and a per-character status list in the chooser. *(1.1.23–1.1.25)*

### Repo clean-up
- [ ] Move the art the game uses into `assets/`, via a small path helper so saved data (which stores bare filenames) keeps working with no migration. Update `sw.js`, the `home.js` preload list, `asset-lab.js`, `puzzle-groups.js` and the JSON data files.
- [ ] Fix the splash preloader: it saves into cache `sidescroll-runtime-v23`, which the service worker never reads and deletes on update, and its `?v=` tags don't match what the game requests, so it rarely helps.
- [ ] Show the version number on the start page, read from one shared version constant.
- [ ] Use that one version constant for cache-busting instead of hand-edited `?v=` tags (currently inconsistent: `style.css` is 1.1.22 on some pages and 1.1.24 on others; `fox-rig.js` is 1.0.163 in play and 1.1.15 in walk-lab).
- [ ] Remove the ~345 KB of old GameHub game CSS (clock, sums, coding, laser, gravity, flight, snake, racer, tower attack, my house) from `style.css`, keeping the shared shell, orientation guard and install overlay.
- [ ] Remove unused GameHub code from `core.js` (`GameHubResults`/`GameHubProgress`, link to the missing `progress.html`); decide whether the v1.0.11 bridge-mirror save migration can go.
- [ ] Replace the 821 KB embedded copy of `walklab-rig-v4.png` in `walk-rig.js` with a reference to the file.
- [ ] Review ~30 functions in `sidescroll.js` (and a few in `world-lab.js`, `walk-lab.js`, `anim-lab-*`) that are never called: keep or delete each.
- [ ] Decide keep/delete for each item in `review/` (see `review/README.md`).
- [ ] Update Design Lab → Project Workflow to the GitHub/pull-request workflow. Its "READ FIRST" rules still describe patch ZIPs, and rule 10 still names World Lab as the top priority. Must be added as **new** entry IDs (Design Lab merge rule).
- [ ] Point Design Lab → Technical Roadmap at `TASKS.md` so there is one list (its phases A–D overlap with Later below).

---

## Needs iPhone testing
Everything below was checked only in desktop/headless browsers. Delete a line once
you've confirmed it on the phone; if it fails, move it to **Now** as a bug.

**Recent (most important):**
- [ ] **1.1.27** — character size/reference: Fox, heroes and New01 reference stays unchanged as the character is scaled up; numeric input, Undo, Save, reopen; in-game size and collider match; per-character references; touch zoom/fit.
- [ ] **1.1.26** — Hero 1, Hero 2, built-in Fox, new Biped and New01: Play button, touch movement/facing and jump, Idle stance, switching characters, speed sliders, Save/Discard, game speed matches Character Lab, offline reload.
- [ ] **1.1.25** — characters made from original Parts only, and mixed Parts: looks right, animates, faces correctly, frame rate OK; no Skin loss after Save/reload; Biped starter has Walk/Run/Jump.
- [ ] **1.1.24** — character chooser: pick New01 and check correct art/deformation; it stays selected after reload/offline; switch back to Hero 1, Hero 2, Fox; Load panel closes only on a successful switch.
- [ ] **1.1.23** — New01 playable in game: mesh deforms during walk/run/jump; draw order, facing, climbing fallback; no stale images after editing in Character Lab and reloading the game.
- [ ] **1.1.22** — Character Lab Load/Open bug: open New01, then Load → Open another character works (clean and unsaved states, Save/Discard/Cancel).
- [ ] **1.1.15–1.1.21** — Skin and IK: joint fit, rotated joint offsets, rectangles follow pose, knee/elbow bend direction in Idle/Walk/Run/Jump, drag responsiveness and playback speed with New01.
- [ ] **1.1.0–1.1.14** — Atlas/Parts/Skin editors: touch accuracy, pan/pinch, Undo/Redo/Save/Discard, PNG import survives reload, switching Atlas → Parts → Rig → Skin without drift.

**Older (may already be confirmed; delete if so):**
- [ ] **1.0.202–1.0.205** — Project Backup: Export to Files gives a non-empty `.json`; full restore tested on a spare browser/profile, *not* on the main phone.
- [ ] **1.0.141–1.0.169** — Fox animation: walk/run/jump seams at game scale, Walk↔Run transition, Paw IK, saved clips match in game, fox height vs heroes.
- [ ] **1.0.136–1.0.140** — Terrain Edit and World Lab surfaces: Follow Player, height/depth edits, surface blends look smooth in game, Undo/Save/Discard/reload.
- [ ] **1.0.131–1.0.135** — Puzzle editor: Fallen Tree / Stone Wall / Broken Bridge zones, entry/exit, reset, templates vs standalone, linked-template propagation.

---

## Next
- [ ] **Animation collection (CL2):** selected character's animation list instead of four fixed buttons; New/Duplicate/Rename/Assign to action slots; editable Biped Idle; versioned data with safe migration of `sparseClips`.
- [ ] **Climb as an editable clip (CL3):** convert the human climbing motion into a Biped starter clip and add a `climb` slot without changing climb paths or speed.
- [ ] **Pick Up / Put Down / Carry clips (CL4):** one-shot clips with grasp/release markers feeding existing interaction timing; carry as an overlay or locomotion variant.
- [ ] **Shared animations (CL5):** library with link/copy, Save as Template, Make Unique; compatibility checks; manual retargeting only.
- [ ] **Portable backups with art:** character/project export and restore that include PNG pixels from IndexedDB (JSON backups currently omit them); test on a second device.
- [ ] **Atlas tools:** better topology editing (connect vertices, split/merge edge paths, delete triangle ranges, boundary shaping) and spline control-node editing.

## Later
- **Puzzle Logic foundation:** small `Event → Conditions → Actions` model; re-express Fallen Tree, Stone Wall and Broken Bridge with it; fix Broken Bridge's incorrect "Socket Completion / Forest Key" migration labels. No visual Logic editor until the model is proven.
- **Environment Animation Path:** generalise the cart path into a reusable path that can move any object, with explicit trigger and settle state.
- **Terrain Features (Stage 4–5):** turn puzzle `worldModifier` into reusable Terrain Features; then retire/migrate legacy Test Hill/River modes.
- **Editor shell:** one editor context/state model; reusable drawer with route stack, fixed header/footer; scene outliner; context-sensitive inspector; asset default vs instance override.
- **Undo everywhere:** shared transaction history for World Lab (plus Redo) and Asset Lab.
- **Performance panel:** frame-time spikes, object/texture counts, rolling spike history; profile before changing renderer.
- **Streaming:** global preload/unload distances for authored content; texture manager with reference counting and WebGL texture release.
- **Audio:** SFX beyond background music, after profiling a low-stall path on iPhone Safari.
- **Store packaging:** iOS / Google Play / Steam wrap once gameplay length, performance and streaming are mature.

## Art & content
- Woodland artefact concepts: a series exploring forest/mechanism fusion, then shortlist and refine.
- Market stalls: find the earlier generated sources, process approved ones, add to the settlement library (or schedule regeneration).
- Terrain surface pack: after in-game use, flag any texture needing another pass (brightness, scale, tiling).

## Decisions waiting on you
- Should the Fox cut atlas be regenerated as a clean purpose-built puppet atlas, or is the current one good enough?
- Keep or drop the unfinished WebGL atlas compositor (`review/unused-code/anim-lab-assembly-gpu.js`)?
- Fox companion rules: should the fox be able to carry/push human-scale puzzle props?
- Skin softness (joint Blend Distance / falloff): parked until binary skinning is accepted on device.
