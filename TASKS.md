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
Publishing works by giving Claude a publish package from the Publish Lab (or a
Project Backup / character exports) for `tools/bake_project.py`. Design: three kinds of data — published game
content, your working copy (overrides published on your phone only), local only
(settings, progress, test state) — classified in `storage-catalogue.json`.
- [x] **Step 3a — Publish Lab** (`publish-lab.html`): status per area and character, tick-list publish package (bake tool builds selected areas / characters), Use published per area / character, My settings export/import.
- [x] **Step 3b — Full backup:** Project Backup now includes character artwork and restores it (linked from the Publish Lab).
- [ ] **Step 3c:** drive the per-lab export lists in `lab-data.js` from the catalogue (Project Backup already covers every catalogue key). Then retire World Lab's "Complete Game Design" export and `baked-game-design.js` (now shadowed by `project-defaults-data.js`).
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

**0y. Game speed with rows (5 Nov)**
- [ ] With your near-side rows on, running feels as smooth as before rows. Dressing still sits on the ground on slopes and hills; after editing terrain, grass follows the new ground.

**0x. Near-side rows (4 Nov)** — game → Edit → Environment → *Near-side rows*
- [ ] Tick **Use rows here**: the near side becomes three rows; the scattered near-side grass goes.
- [ ] Edge / Middle / Outer: drag Depth, Scale, Spacing and their ± sliders — the scene updates as you drag; tap textures to include/exclude; turn a row off.
- [ ] **Save rows**, close and reopen the game: the same layout. **Revert** before saving restores the saved rows. *Done Editing* with unsaved rows asks to save.
- [ ] Walk the level: rows follow the path, and at a transition to another profile they blend like other dressing.
- [ ] Open World Lab and change a biome value: back in the game the rows are still there.

**0w. Quick Play controls (4 Nov)** — Character Lab → Quick Play
- [ ] Jump and Pick up are bottom-left, the move pad bottom-right; the character and ground sit above them.
- [ ] Hold the move pad with the right thumb and tap Jump with the left: she jumps while still moving. Same for Pick up next to a box.

**0v. Centre marker and Centre body (4 Nov)** — Character Lab → Character01 → Animate
- [ ] Display → Centre is on: a dashed line and ◆ *Centre* under her, and ▲ *Body +0.135* (Idle) to the right.
- [ ] Key Pose Tools → **Centre body → Keep sway** on Idle: she moves back over the line, the label goes, the pose looks identical; Save. Repeat for Walk, Run, Jump (and any other animations).
- [ ] In the game she's drawn over her collider (Display → Collider in Character Lab shows where that is) — picking up, landing on logs and stopping at walls look centred.

**0u. Collider, jump floor line (4 Nov)** — Character Lab → Character01
- [ ] Rig → *Height* goes up to 2.00; raise it until Display → Collider covers her head, Save. In the game she still walks, jumps and climbs normally.
- [ ] Quick Play: she stops where her collider (Display → Collider) touches a box.
- [ ] Animate → Jump: an amber *Character floor* line rises and falls with the jump (labelled in game metres), and a faint *Top of jump* line sits at her Jump height; her feet can be judged against it. In Quick Play the line shows while jumping and on top of a box.

**0t. Quick Play test box (4 Nov)** — Character Lab → Character01 → Quick Play
- [ ] **Add box**: a box appears ahead on the ground. Walk into it: she stops at its side. Jump, steer onto it: she lands on top; walk off: she drops down.
- [ ] Walk up to it, **Pick up** (pad, right): she bends, lifts it to her hands, her near arm in front of it; walk/run/jump while carrying. **Put down** sets it in front; next to a box it stacks on top.
- [ ] **Stack box** puts one on the nearest box ahead. Pick up takes the top one.
- [ ] **Held item drawn** → *In front of the character*: the box covers her arm; Save, then in the game pick up a log — same. Set back to *Auto* and Save.
- [ ] Hero 1 and Fox: boxes and pick up work (Fox carries it in front, no carry pose).

**0s. Carrying and landing (4 Nov)** — Play as Character01
- [ ] Pick up a log: it sits at her hands and her near arm is in front of it (as Hero 1); it moves with her walk.
- [ ] Jump onto a log: her feet land on top and don't sink in for a moment. Normal jumps on flat ground look the same as before.

**0r. Game speed (4 Nov)** — Play as Character01
- [ ] Running and jumping feel as smooth as they used to (no sluggishness or small hitches); same with Hero 1 and Fox.
- [ ] Character Lab → Settings: rename a character; the new name shows in the character list and in the game's picker straight away.

**0q. Full backup (4 Nov)** — menu → Project Backup
- [ ] **Export Project** says "Ready · N saved items · N artwork images"; the share sheet saves one `SS-PROJECT-SNAPSHOT-….json` (a few MB with artwork).
- [ ] **Choose Project JSON** with that file: the areas list includes *Character artwork (N images)*; counts show artwork unchanged. (Optional, a real restore test: install the app on another device or browser, restore there, open Character Lab: Character01 shows its artwork.)

**0p. Publish Lab (3 Nov)** — menu → Publish Lab
- [ ] Areas and characters show sensible badges (things you've edited = Changed, Character01 = New or Published); nothing horizontal-scrolls.
- [ ] Changed/new rows are ticked. **Prepare package**, then **Share package**: the share sheet offers the `SS-PUBLISH-….json` file (save it to Files).
- [ ] **Export my settings** shares a small file; **Import my settings** with that file says "Imported N settings".
- [ ] Optional (after a backup): **Use published** on a changed area or character asks first, then that row reads Published.

**0h. Animate keys (2 Nov)** — Character01
- [ ] Body / Root moves left/right and up/down.
- [ ] Key Pose Tools → **Simplify keys**: far fewer keys, the walk looks the same; Undo restores.
- [ ] Select Spine Bend, change it on one frame: only that control gets a key there (bright dot). **Keep only this key**: the spine holds that bend for the whole clip. **Delete key here** removes just that control's key.
- [ ] Tween → **Smooth**: playback is smooth (no frame-to-frame stepping) and visibly eases compared with Linear, without slowing down; Save, reopen, still Smooth; same in Quick Play and the game.

**0r. Jump height (3 Nov)** — Character01
- [ ] Animate → Jump: the body rises as high as it does in the game (check side by side with Quick Play / the game).
- [ ] Animate → Jump → Key Pose Tools → **Jump timing**: set Lift-off a few frames in and Landing a few frames before the end; the preview stays on the ground before / after; in Quick Play and the game the character crouches on the ground first, then jumps, then plays the landing frames (walking off cuts the landing short).
- [ ] Quick Play → **Jump Height**: lower it; the jump is lower and quicker in Quick Play, the Animate preview and the game; Save, reopen, still set. Hero 1 / Hero 2 / Fox jump exactly as before. (Lower jumps may not reach some ledges.)

**0q. Start / stop blending (2 Nov)** — Character01 in the game and Quick Play
- [ ] Standing → walking, running → stopping, and jump take-off / landing ease into the new pose (no flick); walk ↔ run as before.

**0p. Jump: feet below the raised floor (2 Nov)** — Character01 Jump
- [ ] In the middle of the jump, Near / Far Foot can be moved down past the old fixed level towards the real ground (until the leg is straight). Note: with Foot contact Automatic a foot below the floor counts as planted — use From keys or Off for jumps.

**0o. Moving ground for bipeds (2 Nov)** — Character01 walk / run in Animate
- [ ] The floor markers scroll during playback and step with the frames; a planted foot stays over one marker (or shows how far it slips); the Ground Motion section toggles it and sets the display speed.

**0n. Copy a limb to the other side (2 Nov)** — Character01
- [ ] Animate the near leg (few keys), Foot contact Automatic or Off, then Key Pose Tools → Copy a limb → **Half a cycle later** → Legs **Near → Far**: the far leg steps the same way on the opposite beat. Same timing and Arms work too; Undo restores.

**0m. Head and neck (2 Nov)** — Character01
- [ ] Animate → Control Board → **Neck** and **Head**: rotating turns the neck / head (and the hair with it) and the skinned head artwork follows; keys, Smooth and the game play it.

**0l. Foot contact Off (2 Nov)** — Character01
- [ ] Key Pose Tools → Foot contact → **Off**: rotating a foot turns it freely (it no longer rolls to stay on the floor); Save, reopen, still Off; plays the same in Quick Play and the game.

**0k. Foot contact, toes, motion path in Display (2 Nov)** — Character01
- [ ] Key Pose Tools → Foot contact → **Automatic**: with few keys on a foot and Smooth, the foot no longer snaps to the floor; Planted foot buttons say contact is automatic.
- [ ] Rig → each leg has a **Ball** joint; Animate → **Near / Far Toes** bend the toes; Skin offers Sole / Toes bones.
- [ ] Display → **Motion Path** shows the selected control's path.

**0j. GPU mesh drawing (2 Nov)** — Character01 and the Fox in Animate
- [ ] Artwork looks right (no missing, shifted or dark parts) with Display → **GPU mesh** on; compare with it off.
- [ ] Playback and Quick Play are smooth; Smooth vs Linear now visibly differ. Note the Display readout ("Mesh drawn by GPU · … ms") with GPU mesh on and off and tell Claude both numbers.

**0i. Animate limits, planted foot, motion path (2 Nov)** — Character01
- [ ] A hand can be raised above the head; the Root handle sits on the pelvis and moves with it.
- [ ] Root very high with a foot planted stops at leg reach; Planted foot → **Neither** lets it rise; Near / Far switches which foot holds.
- [ ] **Motion path: On** shows the selected control's path over the clip with its keyed frames marked; Smooth vs Linear visibly changes the path's shape.

**0g. Skin copy to the other side (2 Nov)** — Character01
- [ ] Bind and tune the near arm and leg, then Skin → *Copy to the other side* → Arms / Legs Near → Far: the far parts get far bones, the same blend and joint lines, and bend the same way in the Walk preview. Far → Near and *Selected part → Copy skin* work too; Undo puts it back.

**0f. Free binding, blend, spine (2 Nov)** — Character01
- [ ] Skin → *Bones this part follows*: tap bones on/off (or a Preset), **Bind to these bones**. Head on Neck + Head; Body on Lower Back + Upper Back; whole part covered (status shows no unassigned points).
- [ ] **Blend at joints**: raise it on an arm and the body; in the Walk preview the elbow and waist bend smoothly instead of hinging. Save, reopen, still there; same in Quick Play and the game.
- [ ] Rig → Body / Head has a **Spine** joint; Animate → **Spine Bend** bends the upper body; the heroes still look and animate as before.

**0e. Manual skin binding (2 Nov)** — Character01 in Skin
- [ ] On an unbound part: choose a Bone group, pick a bone, **Bind whole part to selected bone** — the part follows only that bone. **Bind to group** splits it across the group's bones. Undo works.

**0d. Straight-leg knee (2 Nov)** — Character01 in Rig
- [ ] Only one knee dot per leg; dragging the knee across the straight line no longer makes a second dot appear or jump. Same for elbows.

**0c. Rig copy buttons (2 Nov)**
- [ ] Rig → *Copy to the other side*: Arms / Legs / All limbs Near → Far and Far → Near copy just that (Fox: Front legs / Rear legs); Selected joint / limb say what they copy and are off for Chest / Shoulder and Pelvis; Undo puts it back.

**0b. Biped hands (2 Nov)** — Character01
- [ ] Rig → Near Arm / Far Arm each list Hand; the hand joint starts just past the wrist and moves on its own.
- [ ] Animate → Near Hand / Far Hand: moving still moves the wrist; rotating turns the hand; Save, reopen, still there; plays in Quick Play and the game.
- [ ] Skin: an arm or hand mesh can be weighted to Near Hand / Far Hand.

**0a. Biped rig (2 Nov)** — Character01 (your new biped)
- [ ] In Rig, move Chest / Shoulder, an elbow and a wrist: only the bones attached to that joint move; nothing swings the opposite way.
- [ ] Where near and far joints overlap (knees, feet), dragging moves the near one; tap (no drag) again to switch to the far one; the label above it says near/far.
- [ ] Hero 1 / Hero 2 still look and animate exactly as before, in Character Lab and the game.
- [ ] Far limbs are lavender, near teal (viewport and joint buttons). *Show: Near side / Far side* (top of Rig Designer, also in Display) hides a side and its joints can't be grabbed; works on the Fox too.

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
- [ ] **Rows for the far side:** once near-side rows are settled on the phone, the same row model (depth ±, scale ±, spacing ±, textures) for the dressing beyond the path; later *strip* rows (a long, short grass texture repeated continuously along a row) when those textures exist.
- [ ] **Carry pose per character:** the game's carry arms (`carryPose` in `biped-rig.js`) are one set of hand targets tuned for Hero 1, so Character01 holds things lower. Let each character set its carry (a *Carry* action slot with an animation, or carry hand targets in Quick Play next to the test box), used by the game and Quick Play. Pick-up/put-down reach likewise.
- [ ] **Performance audit (game and Labs):** look for work repeated every frame that only needs doing when something changes, like the character-library re-parsing fixed on 4 Nov (`localStorage` reads + `JSON.parse` in per-frame paths, rebuilding lists/meshes/geometry that haven't changed, DOM updates during playback). Done so far: character-library parsing (4 Nov), per-item terrain re-grounding and asset behaviour merging (5 Nov). Next candidates: the number of draw calls (one per grass/rock item; batching dressing that shares a texture), and terrain lookups outside drawing (`terrainSparseNumberAt` still shows). Measure first (CPU-throttled profile while running), fix the largest, keep a short before/after table in the PR.
- [ ] **Character Lab overlays follow the drawing method (view only, small):** the Display *Rigid Planes* button draws the rig's original cut-out frames whatever the drawing method, so on a Mesh character (the Fox) it outlines frames nothing uses. For Mesh characters, replace it with a *Mesh* overlay showing every piece's wireframe, deforming live with the pose (useful in Animate); Parts characters keep *Rigid Planes*. In Skin, change *Wireframe: On/Off* to *Off / Selected / All* (selected piece stays highlighted), like the Atlas tool's *Wireframes* choice. Nothing saved changes; the game is unaffected.
- [ ] **Atlas tools:** better topology editing (connect vertices, split/merge edge paths, delete triangle ranges, boundary shaping) and spline control-node editing.

## Later
- **Custom bones (design first — see `docs/CHARACTER_SYSTEM_DESIGN.md` §6):** step 1 *extra bone chains* hung from any joint (skirt, cloak, ponytail, tail), each posed by an angle in Animate; step 2 *fully custom skeletons* (the author lays out, names and parents every bone) on a general rotate-every-bone animation model with foot/hand IK helpers, replacing the biped/quadruped special cases. Do when the fixed rigs plus free binding stop being enough.
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
