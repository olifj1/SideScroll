# SideScroll — Tasks

The single task list. Open work only: when something is done, delete it here and
add a line to `CHANGELOG.md`. Detail and history for older items:
`docs/archive/SIDESCROLL_TASKS.md` (search for the version number shown).

Last reviewed: 30 October 2026 (character system agreed).

---

## Now
Proposed order: characters C1b-2, C1c, C2, C3 → Publish Lab (step 3) →
characters C4–C6. Clean-up items are small and slot in between.

### Publishing workflow (agreed 30 Oct)
Author on the phone, then publish chosen content into the game for every player.
Until the Publish Lab exists, publishing works by giving Claude a Project Backup
export (`tools/bake_project.py`). Design: three kinds of data — published game
content, your working copy (overrides published on your phone only), local only
(settings, progress, test state) — classified in `storage-catalogue.json`.
- [ ] **Step 3 — Publish Lab** (grown from the Project Backup page): every content area and each character with a status (Published / Changed / New / Local only); tick-list publish package; separate "My settings" export; full backup including artwork; restore; "discard my changes, use published" per area; exports and backups driven by the catalogue (replacing the lists in `lab-data.js` and `project-snapshot.js`). Bake tool supports publishing selected areas / single characters. Then retire World Lab's "Complete Game Design" export and `baked-game-design.js` (now shadowed by `project-defaults-data.js`).
- [ ] **Step 4 (optional) — Automatic publishing:** upload a publish package to GitHub from the phone; a GitHub Action bakes it and opens the pull request.
- [ ] **Decide:** make the repository private? (GitHub Pages from a private repo needs a paid plan, and the site itself stays public; alternative is a private repo + Cloudflare Pages with login.)

### Characters: templates, actions and abilities (agreed 30 Oct — top priority)
Design: `docs/CHARACTER_SYSTEM_DESIGN.md`. Every character is built the same
way: rig and animations are shared templates (instances) or unique copies; atlas,
mesh parts and skin are the character's own; abilities come from a shared list.
- [ ] **C1b-2 — Neutral names in code:** identifiers (`FoxRig`, `HumanRig`, `GameHubFoxRig`, `foxPoseForClip`, adapter ids…), comments and console messages. File names, art names and storage keys are already neutral (C1b-1).
- [ ] **C1c — Drawing method per character** (also gives the original characters neutral internal IDs instead of `original` / `alternate` / `fox`, with migration): each character has one drawing method, **multi-part** (rigid cut-out pieces) or **deformable mesh**, chosen in Character Lab and used identically in the game. Agreed 30 Oct: the two bipeds stay multi-part, the two quadrupeds (Fox, New01) use the deformable mesh — so the Fox moves to its deformable mesh in the game (today the game draws it multi-part while Character Lab shows the mesh). Multi-part must stay available to any character (bipeds may move to mesh later); a proper multi-part setup tool comes later. Fixes: a copy of the Fox needs Parts assembled before it plays; a copy of Hero 2 starts with Hero 1's art; per-character status in the game picker.
- [ ] **C2 — Rig templates:** rigs become named collections of bones held as **data** — this also replaces the stored rig families `fox`/`human` and the baseline marker `fox-authoring-baseline-1.0.159` with rig-template references (one migration of saved characters instead of two) (Biped and Quadruped are just two templates; no rig hard-coded in code); presets menu; instance or unique copy; **Save as template**; editing a shared rig warns, lists affected characters and offers *edit template* / *make unique*; opening a character whose template changed offers *use updated* (with **Rebind skin**) / *keep previous and make unique*. Absorbs Stage B and the remaining Stage A work: any template fully authorable (rig topology, Parts attachment, Skin mapping, game parity), no bone IDs hard-coded in shared modules.
- [ ] **C3 — Animation library and templates:** per-character animation list instead of four fixed buttons; **create new animations**; assign to action slots as instance or unique copy; make unique; save as template; only rig-compatible templates offered; editable Biped Idle; safe migration of today's `sparseClips`. Manual retargeting only.
- [ ] **C4 — New Character flow:** name → rig → atlas → mesh parts → skin → animations (instance / copy each) → abilities → play-test in the lab → save → in game.
- [ ] **C5 — Actions and abilities:** one shared ability list, editable in Character Lab and Asset Lab; **create new actions** (name, button label, animation slot) and assign them to characters; rig templates give default abilities; the game only offers actions a character has. Asset behaviours (carryable, pushable, climbable) become "this asset offers action X". First real actions: Climb as an editable Biped clip (keep current climb paths/speed), Pick Up / Put Down / Carry (grasp/release markers driving existing interaction timing).
- [ ] **C6 — Action paths:** generalise the climb path into an action path (action name, button label, bound animation, character follows the path), bound to an asset in Asset Lab or placed as a stand-alone node in the world and shown in World Lab. Example: *Crawl* through a gap. Design together with Environment Animation Path and Puzzle Logic (Later).
- [ ] **Character packages for templates:** exports carry (or reference) linked templates; importing a shared template lists the characters it affects. *(with C2/C3)*

### Repo clean-up
- [ ] Show the version number on the start page, read from one shared version constant.
- [ ] Use that one version constant for script/CSS cache-busting instead of hand-edited `?v=` tags (currently inconsistent: `style.css` is 1.1.22 on some pages and 1.1.24 on others; `fox-rig.js` is 1.0.163 in play and 1.1.15 in walk-lab). Art versions are already centralised in `asset-paths.js`.
- [ ] Remove the ~345 KB of old GameHub game CSS (clock, sums, coding, laser, gravity, flight, snake, racer, tower attack, my house) from `style.css`, keeping the shared shell, orientation guard and install overlay.
- [ ] Remove unused GameHub code from `core.js` (`GameHubResults`/`GameHubProgress`, link to the missing `progress.html`); decide whether the v1.0.11 bridge-mirror save migration can go.
- [ ] Replace the 821 KB embedded copy of `walklab-rig-v4.png` in `walk-rig.js` with a reference to the file.
- [ ] Review ~30 functions in `sidescroll.js` (and a few in `world-lab.js`, `walk-lab.js`, `anim-lab-*`) that are never called: keep or delete each.
- [ ] Decide keep/delete for each item in `review/` (see `review/README.md`).
- [ ] Update Design Lab → Project Workflow to the GitHub/pull-request workflow. Its "READ FIRST" rules still describe patch ZIPs, and rule 10 still names World Lab as the top priority. Must be added as **new** entry IDs (Design Lab merge rule).
- [ ] Point Design Lab → Technical Roadmap at `TASKS.md` so there is one list (its phases A–D overlap with Later below).

---

## Needs iPhone testing
Changes checked only in desktop/headless browsers. Delete a line once you've
confirmed it on the phone; if it fails, move it to **Now** as a bug.

- [ ] **Offline** — once everything has loaded, turn on Airplane Mode and launch the Home Screen app: splash, PLAY and the labs should all still work.
- [ ] **Character export / import** — Character Lab → Load: every character has **Export**; also **Export all characters** and **Import characters…**. Check on iPhone: (1) Export New01 and Export all share/save to Files (expect a few MB with artwork). (2) Rename New01, then Import the New01 file → *Replace* → it comes back with its old name and art. (3) Import the Fox file → *Add as a copy* → "Fox copy" appears. (4) In Safari (separate storage), Import the export-all file → *Replace* New01 → New01 plays in the game with its art. Fox Handoff and "All Character Lab Data" are gone.
- [ ] **Renamed files and keys (C1b-1)** — after merging, open the Home Screen app: the Fox, Hero 2 and New01 look and play as before (art loads under new file names, a few MB downloads once); press **PLAY** on the splash screen and open the character picker: New01 is listed and Ready (it was missing when starting from PLAY before). Character Lab: Fox rig, collider and clips are as before.
- [ ] **Character registry (C1a)** — Character Lab: toolbar is **New · Open · Save · Share**. Open lists characters under category headings with roles shown (Hero 1 · Default player, Fox · Default animal). Try on a character's •••: Rename, change category, ↑/↓, Export, Delete (disabled while it has a role). **Settings** (top bar, next to ⓘ): move a role, add a role, add / rename / reorder a category, tick *Playable*. In the game, the character picker shows only playable categories in that order and uses the new names. Share has Export this character / Export all / Import.
- [ ] **Published New01** — open the site in **Safari** (separate storage, like a new device): New01 should appear in the game's character picker as Ready and play with its artwork; in Character Lab its Atlas shows "Published PNG · 1448 × 1240". In the Home Screen app nothing changes (it still uses your own copy).
- [ ] **Built-in content** — (1) In the Home Screen app nothing should change: your world, puzzles, characters and Design Lab are exactly as before. (2) Open the site in Safari itself (not the Home Screen app — Safari keeps separate storage, so it behaves like a brand-new device): the game, World Lab, Asset Lab, Puzzle Lab, Character Lab and Design Lab should all show your content. Expected differences there: the game starts at the beginning, Character Lab opens on Hero 1, and New01 shows "Imported PNG missing from this device" (its art isn't built in yet).

---

## Next
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
- Skin softness (joint Blend Distance / falloff): parked until binary skinning is accepted on device.
