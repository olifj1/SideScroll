# SideScroll — Tasks

The single task list. Open work only: when something is done, delete it here and
add a line to `CHANGELOG.md`. Detail and history for older items:
`docs/archive/SIDESCROLL_TASKS.md` (search for the version number shown).

Last reviewed: 30 October 2026 (character system agreed).

---

## Now
Proposed order: characters C1c, C2, C3 → Publish Lab (step 3) →
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
- [ ] **C1c — remaining:** Parts drawing for characters made from imported artwork, and Mesh for bipeds (both need the Parts assembly to draw rigidly / a biped Skin). *(The original characters' neutral internal IDs moved into C2, which migrates the same saved data.)*
- [ ] **Skin workflow — fewer steps (your UX decision first):** today Skin is part → bone group → bone → joint → sliders. Ideas: show the bone group as a label decided by the part (changing it moves to Advanced, as it rebinds); one row of joint buttons (Socket · Knee · Wrist · Paw) instead of separate bone and joint pickers, with the bone picker kept for per-vertex weights; remember the joint when switching parts (compare near/far legs in one tap). No tapping small things in the viewport (phone-first: small targets are hard to hit).
- [ ] **Template follow-ups:** importing a character whose rig or animation template already exists on the device keeps the device's version today — offer to replace it, listing the characters that follow it.
- [ ] **C2c — Rest of the generic skeleton engine:** body plans defined entirely as data (a bird, a snake) so a new rig needs no code — bones, IK chains and animation channels as data; Biped and Quadruped then become two such definitions. *(Done 1 Nov: the Biped got an editable rest rig, and Parts, Skin and game mesh drawing work for any rig with a RIG_DESIGNER.)*
- [ ] **C4 — New Character flow:** name → rig → atlas → mesh parts → skin → animations (instance / copy each) → abilities → play-test in the lab → save → in game.
- [ ] **C5 — Actions and abilities:** one shared ability list, editable in Character Lab and Asset Lab; **create new actions** (name, button label, animation slot) and assign them to characters; rig templates give default abilities; the game only offers actions a character has. Asset behaviours (carryable, pushable, climbable) become "this asset offers action X". First real actions: Climb as an editable Biped clip (keep current climb paths/speed), Pick Up / Put Down / Carry (grasp/release markers driving existing interaction timing). **Builds on the action slots (Settings → Action slots):** an action = a slot plus its button label and game behaviour; slots added in Settings start as "not hooked up yet" and get their behaviour here (or from an action path, C6); a character with no animation in a slot doesn't have that action.
- [ ] **C6 — Action paths:** generalise the climb path into an action path (action name, button label, bound animation, character follows the path), bound to an asset in Asset Lab or placed as a stand-alone node in the world and shown in World Lab. Example: *Crawl* through a gap. Design together with Environment Animation Path and Puzzle Logic (Later). An action path names an **action slot**, so one path works for every character with an animation in that slot.
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
Changes checked only in desktop/headless browsers, as one walkthrough (1 Nov). Tick
or delete steps once confirmed on the phone; if one fails, tell Claude the section and
step and move it to **Now** as a bug. Before starting: close/reopen the Home Screen
app and make a Project Backup.

**0. Character Lab top bar** (1 Nov)
- [ ] Undo, Redo and Discard sit in the top bar beside the Saved badge, nothing overlaps (portrait and landscape), and the floating "i" button is gone.
- [ ] Make an edit: Undo/Discard light up and the badge says Unsaved; Undo, Redo and Discard behave as before.

**1. The game — nothing should look different** (Home Screen app)
- [ ] Hero 1, Hero 2, the Fox (mesh) and New01 look, animate and play as before; the character you last played is still selected.
- [ ] The picker lists playable categories with your names and shows *Fox · Quadruped · Mesh*.
- [ ] **PLAY** on the splash screen, open the picker: New01 is listed and Ready.
- [ ] Offline: once loaded, turn on Airplane Mode and relaunch — splash, PLAY and the labs still work.

**2. Character Lab basics**
- [ ] Toolbar **New · Open · Save · Share**; Open lists characters by category with roles (Hero 1 · Default player, Fox · Default animal).
- [ ] A character's **•••**: Rename, category, ↑/↓, Export, Delete (disabled while it has a role).
- [ ] **Settings**: move/add a role, add/rename/reorder a category, tick *Playable* — the game picker follows.

**3. Fox — drawing method and skin**
- [ ] Rig, skin, collider and animations as you left them (rig **not** back to default).
- [ ] **Parts**: *Drawing method* box, Mesh selected. **Parts** + Save → game draws it rigid; **Mesh** + Save → mesh and skin are still there.
- [ ] **Skin**: joint sections only (no rectangles); status shows *Unassigned N* (Front Far Leg 3, Body + Head 10). New01 shows Mesh with Parts greyed out.
- [ ] **Animate** and **Play** on the Fox run smoothly (the 1 Nov freeze is fixed).

**4. Rigs and rig templates**
- [ ] **Rig** box: Fox "Linked to Quadruped"; New01 "Own rig (started from Quadruped)".
- [ ] New01 → *Quadruped* → **Use this template** (skin rebound; Undo goes back) → Save.
- [ ] Fox: move a joint → *Edit the shared rig?* lists New01 → Edit template → Save. Open New01 in Setup → *The Quadruped rig has changed* → Use updated / Keep previous.
- [ ] **Hero 1 → Rig**: Rig Designer shows the biped joints, hero standing on its rest rig. Raise the pelvis → *Edit the shared rig?* lists Hero 2 → Edit template → Save → game draws Hero 1 taller. Open Hero 2 → *The Biped rig has changed*.
- [ ] Name → **Save as template**; Settings → *Rig templates* lists them with users; Remove only unused.

**5. Animations, slots and animation templates**
- [ ] **Animate**: *Actions* (Idle/Walk/Run/Jump, each with a menu) and *Animations*. Biped **Idle** looks as before until edited.
- [ ] **Duplicate** Run (name it), edit a key, Save, pick it in the **Run** menu → the game runs with it. **New**, **Rename**, **Delete** (only yours, not while a game slot plays it).
- [ ] **Settings → Action slots → Add action slot…** (e.g. Crawl): "not hooked up yet" with *— none —*; pick an animation.
- [ ] *Animation template* box: Hero 1 Run "follows Biped run · also used by Hero 2". Edit Hero 1's Walk → *Edit the shared animation?* → Edit template → Save; Hero 2's Walk → *Biped walk has changed* → Use updated → Save; both walk with it in the game.
- [ ] Name → **Save as template**; use it on Hero 2's Run → Save; try **Make unique**. Settings → *Animation templates*: built-ins stay, yours removable once unused.

**6. A new biped from your own art**
- [ ] New → Biped → **Atlas**: import a PNG, cut meshes → **Parts**: Add, arrange on the skeleton (Drawing method → Mesh) → **Skin**: Auto-bind all (every part binds), tune → Save → plays in the game as a mesh.

**7. Export and import**
- [ ] Export one character and *Export all* to Files (a few MB with artwork).
- [ ] Rename New01, Import its file → *Replace* → old name and art back.
- [ ] Import Hero 2's export → *Add as a copy* → copy has Hero 2's art (lab and game); Fox file → *Add as a copy* → plays in the game.
- [ ] An older export (e.g. 31 Oct Fox) → *Replace* works.

**8. Safari as a fresh device** (separate storage)
- [ ] Game and all labs show your content; the game starts at the beginning.
- [ ] New01 Ready with its art (Atlas "Published PNG · 1448 × 1240"); *Fox · Quadruped · Mesh*; Fox → Skin *6 of 6 parts bound*.
- [ ] Import the export-all file → *Replace* New01 → plays with its art.

---

## Next
- [ ] **Character Lab overlays follow the drawing method (view only, small):** the Display *Rigid Planes* button draws the rig's original cut-out frames whatever the drawing method, so on a Mesh character (the Fox) it outlines frames nothing uses. For Mesh characters, replace it with a *Mesh* overlay showing every piece's wireframe, deforming live with the pose (useful in Animate); Parts characters keep *Rigid Planes*. In Skin, change *Wireframe: On/Off* to *Off / Selected / All* (selected piece stays highlighted), like the Atlas tool's *Wireframes* choice. Nothing saved changes; the game is unaffected.
- [ ] **Atlas tools:** better topology editing (connect vertices, split/merge edge paths, delete triangle ranges, boundary shaping) and spline control-node editing.

## Later
- **Rigid pieces as a supported drawing option (after the skinned Mesh path):** a character can be drawn as rigid cut-outs, each following one bone (how the heroes are drawn today), as well as a skinned, deforming Mesh. Today the heroes' 13 sprite-sheet squares (upper/lower leg, foot, arms, torso, dress, head), each with two pin points, are hard-coded in `biped-rig.js` (`partsForPose`, `atlasRect`), so Parts lists nothing for bipeds (`ART_LAYOUT_DESIGNER.parts` is empty). Upgrade: describe them as data like the quadruped's original parts (atlas area, bone, pins, group) so Parts lists and edits them, any rig can use rigid pieces, and they can seed a Mesh from the heroes' existing art. The game must draw the heroes identically until the author changes something. Consider clearer UI names: *Pieces (rigid)* vs *Mesh (skinned)*.
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
