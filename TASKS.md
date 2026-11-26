# SideScroll — Tasks

The single task list. Open work only: when something is done, delete it here and
add a line to `CHANGELOG.md`. Detail and history for older items:
`docs/archive/SIDESCROLL_TASKS.md` (search for the version number shown).

Last reviewed: 24 November 2026 (intro sequence is the current focus; objects, Inspect / Collect / Wear, the bag and Skip done this week).

---

## Now
Current focus: the **intro sequence** (its stages below, in order). Then the character
work (C1c, skin workflow, C4–C6). Clean-up items are small and slot in between.

### Publishing workflow (agreed 30 Oct)
Author on the phone, then publish chosen content into the game for every player.
Publishing: Publish Lab → package → upload it to `publish/` on github.com → the
Action bakes it and opens a pull request → merge (`publish/README.md`). Design: three kinds of data — published game
content, your working copy (overrides published on your phone only), local only
(settings, progress, test state) — classified in `storage-catalogue.json`.
- [ ] **Decide:** make the repository private? (GitHub Pages from a private repo needs a paid plan, and the site itself stays public; alternative is a private repo + Cloudflare Pages with login.)

### Intro sequence (agreed 14 Nov — current focus)
The opening, built with sequences. Aureli wakes in the cabin (birdsong, distant chopping),
reads Father's note on the fireplace (food and water on the table, backpack mended), eats,
inspects the backpack, and walks out to say good morning. Father stops chopping and they
talk; then the sound falls away, the light dims and the colour drains. Deer and other
animals run past; a darkness follows, catches the last animal, and both vanish. Father
shouts her name, is wrapped in swirling shadow and is gone. A shadow covers Aureli, all goes
black, then the light returns and she is alone in the silence. With control back, she walks
into the cabin, packs what she can and sets off after him. (The cabin is the one already in
the scene: she walks out of it and back in; no separate interior.)
Stages (engine work in order; art and sound in parallel):
- **1 — The player does it herself** (decided 14 Nov, nothing to build): she walks into zones and uses Inspect / Action, which fire events. Steps that move or animate the player only if needed later.
- [ ] **2 — Darkness effect:** *(effect asset done 14 Nov; effect states and the **Effect on a character** step (was *Darkness / effect*) — attached to a character, blending through states, hiding it, the dust travelling on — prototype done 17 Nov; a second kind, **character effects** (Dissolve: the character itself breaks up, no plane), 19 Nov)* still to do: make Asset Lab match the game (keep faint wisps in the game, effects don't clip what's behind them, a fog option per effect, a backdrop choice in Asset Lab); "start when it reaches a mark"; the player as a target. Dissolve: its default edge colour is violet, which the art brief avoids ("no purple magic") — consider a dark ink / smoke default; noise looks coarse close up (raise Noise size) — maybe scale it to the body's size.
- [ ] **3 — Sound:** looping ambience (birdsong, distant chopping) and one-off sounds; a **Sound** step to play, stop or fade them ("the sounds fall away"); sound files in `assets/`. Later: sounds attached to animation frames (axe hits on the swing).
- [ ] **4 — Held props for characters:** *(done 20 Nov: Character Lab → Props grips, a component's Holds, the Prop step — hold / put away / drop)* still to do: import the axe and set Father's grip; check it through his Chop animation once that exists.
- [ ] **7 — Objects in sequences** (agreed 23 Nov; *done 23–24 Nov: Object components, object roles, the Object step — appear / disappear / change to; sequence objects take Asset Lab's Inspect / Collect / Wear like placed copies*; still to do, only when a case needs it: collision and Layer / Sort for sequence objects (static dressing is placed in the scene instead, agreed 23 Nov)): an **Object** component — any asset placed relative to the sequence (moves with it in World Lab), with event steps to show / hide / swap it (the chopping block, logs, the woodpile, the note and food in the cabin).
- [ ] **8 — Outfit parts** (agreed 23 Nov; *done 24 Nov for the bag: Skin → Worn item, Asset Lab → Wear (Holds the inventory), Put on, the Wear step, saved state*) — still to do: a cloak / coat the same way once its art is in the atlas; worn parts on a sequence copy of the player follow the player's own worn state (fine while she is the only wearer; revisit if story characters need their own).
- [ ] **9 — Inventory:** *(done 24 Nov: Inspect and Collect in Asset Lab, Pick up, any collectable asset in the inventory, tap to look again, story flags)* — still to do: **combine** two items (designed before building), *use* an item on something in the world, and a fuller inventory screen if the panel feels small.
- [ ] **Aureli's far leg (author, 24 Nov):** in the 24 Nov 20:22 package LegFar carries LegNear's skin (group Near leg, the near bones), so she walks with one leg. Character Lab → Skin → LegFar → Far leg + far bones → bind → Save, then re-export before publishing (the bag part in that package is fine: Worn item = the hook bag).
- [ ] **Art and sound (parallel):** Father (biped parts sheet + Chop, Idle, Talk animations); deer (quadruped, Run) and variants (duplicates with different art / scale); other running animals; axe, woodpile, chopping block, note, food / water, backpack; sounds (birdsong, chopping, gasp, shadow).
- [ ] **6 — Build the intro** in the Story editor (zones: note, table, backpack, door, Father; events with Say, Wait for Action, Look, Screen, Camera, Effect, Sound, Item steps), then tune with ▶ Play and Skip.

### Sequences (agreed 10 Nov)
Design: `docs/SEQUENCE_SYSTEM_DESIGN.md` — sequences placed like puzzles / world groups
(anchor, bounds, components: library characters, marks, zones, thoughts, dressing),
a logic list of *When → run event* lines, and a game-wide events library whose events
use roles. Steps 1–2 (events library, sequences with characters / marks / zones and logic) done 10 Nov.
- [ ] **3 — More components and streaming:** thoughts, dressing, random character picks (per run), Active while; load / unload by distance.
- [ ] **Play from here:** complete every puzzle and sequence before a chosen point (via ⚑ Progress), then play from there. *(⚑ Progress, Solved State and the Item step done 12 Nov.)*
- [ ] **4 — World Lab sequences track:** *(track, details, drag / type to move, Open in game done 13 Nov)* still to do: show where each component stands within the bar, and a template's other instances.
- [ ] **Timeline, next stages** *(21 Nov: every event is a timeline with a row per subject, done)*: (2) *(22 Nov, done: docked Bar / Half / Full, push aside, ▶ with a playhead)*; (3) *(23 Nov, done: pause, scrubbing, edits replay at the playhead)* scrub to any moment (the scene jumps there: positions, camera, dissolve, lines, bars, look) and edit while paused, replaying from the playhead — without touching play progress.
- [ ] **5 — More look controls** (colour grading, vignette, bloom; looks per stretch of the journey, e.g. atmosphere zones), Sequence Lab, node graph view. *(Skip done 24 Nov.)* *(Camera and Screen steps done 11 Nov; Looks (fog + post sets) and the Look step done 14 Nov.)*

### Characters: templates, actions and abilities (agreed 30 Oct — next after the intro)
Design: `docs/CHARACTER_SYSTEM_DESIGN.md`. Every character is built the same
way: rig and animations are shared templates (instances) or unique copies; atlas,
mesh parts and skin are the character's own; abilities come from a shared list.
- [ ] **C1c — remaining:** Parts drawing for characters made from imported artwork, and Mesh for bipeds (both need the Parts assembly to draw rigidly / a biped Skin). *(The original characters' neutral internal IDs moved into C2, which migrates the same saved data.)*
- [ ] **Skin workflow — fewer steps (your UX decision first):** today Skin is part → bone group → bone → joint → sliders. Ideas: show the bone group as a label decided by the part (changing it moves to Advanced, as it rebinds); one row of joint buttons (Socket · Knee · Wrist · Paw) instead of separate bone and joint pickers, with the bone picker kept for per-vertex weights; remember the joint when switching parts (compare near/far legs in one tap). No tapping small things in the viewport (phone-first: small targets are hard to hit).
- [ ] **Template follow-ups:** importing a character whose rig template or library animation already exists on the device keeps the device's version today — offer to replace it, listing the characters that follow it.
- [ ] **C2c — Rest of the generic skeleton engine:** body plans defined entirely as data (a bird, a snake) so a new rig needs no code — bones, IK chains and animation channels as data; Biped and Quadruped then become two such definitions. *(Done 1 Nov: the Biped got an editable rest rig, and Parts, Skin and game mesh drawing work for any rig with a RIG_DESIGNER.)*
- [ ] **C4 — New Character flow:** name → rig → atlas → mesh parts → skin → animations (instance / copy each) → abilities → play-test in the lab → save → in game.
- [ ] **C5 — Actions and abilities:** one shared ability list, editable in Character Lab and Asset Lab; **create new actions** (name, button label, animation slot) and assign them to characters; rig templates give default abilities; the game only offers actions a character has. Asset behaviours (carryable, pushable, climbable) become "this asset offers action X". First real actions: Pick Up / Put Down / Carry (grasp/release markers driving existing interaction timing). **Builds on the action slots (Settings → Action slots):** an action = a slot plus its button label and game behaviour; slots added in Settings start as "not hooked up yet" and get their behaviour here (or from an action path, C6); a character with no animation in a slot doesn't have that action. *(Climb as an editable animation done 24 Nov: the Climb action slot.)*
- [ ] **C6 — Action paths (next, agreed 24 Nov):** generalise the climb path into an action path — action name, button label, the **action slot** it plays (so one path works for every character with an animation in that slot), and **several points** (bends: crawl into a gap and along a low tunnel; today's two-point climb paths keep working) — bound to an asset in Asset Lab or placed as a stand-alone path in the world and shown in World Lab. Example: *Crawl* through a gap. Design together with Environment Animation Path and Puzzle Logic (Later). *(Stage A, the Climb animation, done 24 Nov.)*
- [ ] **Story node graph:** a sequence's logic as nodes and arrows (zones / Action / flags / finished events → events → flags), loops included; each event box opens its ⤢ Timeline. Later a **Choice** step (a fork at the end of an event).
- [ ] **Props — next steps** (design: `docs/CHARACTER_SYSTEM_DESIGN.md` → Props): the **player** picks up and uses items with the same grips (an asset offers *Pick up*, a held item offers actions such as *Chop*; fits C5); the far hand following a two-handed grip; more attachment points (back, belt, a quadruped's mouth); Character Lab's Props list shows only a few built-in assets (plus every imported one) — list all built-in assets if needed.
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

**0ch. Hold a prop (26 Nov)** — Asset Lab and game
- [ ] Asset Lab → the lantern → Interactions → **Hold (carry in hand)** (and Gives light). Place it on the building in the game editor.
- [ ] Play: walk up to it, Action (or Inspect → Pick up): it is in her hand, placed by her grip (Character Lab → Props; set one there if it sits wrong), glowing as she walks, runs, jumps and climbs. The Action button says PUT DOWN.
- [ ] Action: it stands on the floor in front of her (on a deck too, not under it), still glowing; walk back and Action picks it up again.
- [ ] While holding it, Action near a box puts the lantern down (no box pick-up); while carrying a box, the lantern's Inspect says her hands are full. Near something with Inspect, Action still opens it (Leave, then step away to put the lantern down).
- [ ] Close and reopen the game: she is still holding it (or it is still where she put it). Progress → Reset all: it is back on its hook.

**0cg. Assets give light (26 Nov)** — Asset Lab and game
- [ ] Asset Lab → pick an asset (e.g. a lantern) → **Gives light**: a glow, a white cross and a dashed reach circle appear on the picture. Across / Up move the cross; Reach changes the circle; Colour opens the small in-panel picker (also for effect colours).
- [ ] In the game, every placed copy of that asset lights its surroundings from the cross (dim Menu → Light to see it), flickering if Flicker is up; Point lights at 0 % turns it off.
- [ ] A flipped copy lights from the mirrored point. Turning Gives light off in Asset Lab stops the light (after returning to the game).

**0cf. Dock tucks away (26 Nov)** — game editor
- [ ] + Add Environment Asset → pick an asset: the left panel slides away and a **PANEL** tab sits on the left edge; the toolbar / status line start next to the tab.
- [ ] Tap PANEL: the placing card comes back (Change Asset / Done Placing). Tap the scene to place another: the card tucks away again. Done Placing: the panel comes back and the tab goes.
- [ ] Select something → Move pad: the panel tucks away; PANEL brings it back (e.g. the Light settings); dragging on the pad tucks it again; × on the pad brings it back for good.
- [ ] Nothing tucks in puzzle test mode or with the story timeline open.

**0ce. In-panel colour picker (26 Nov)** — game, Menu panels and Light node
- [ ] Menu → Light → tap the colour swatch: no iPhone picker; a small picker opens inside the panel (hue, saturation, brightness bars, hex box, Done). Dragging a bar changes the scene's light live; the panel and the scene stay visible.
- [ ] Done (or closing the panel) closes it; the colour is kept after a reload. Recent colours appear as small squares next time; tapping one uses it.
- [ ] The same in Fog (colour), Post (tint) and on a selected Light node; for the Light node the new colour is kept after Done Editing and a reload.
- [ ] Tapping the word COLOUR in a row opens the same picker (not iPhone's). Typing a hex value (e.g. FFAA33) works.

**0cd. Move pad and toolbar (26 Nov)** — game editor
- [ ] The object toolbar looks like the panels (dark, teal edge, white bold labels) and is easy to read. If the tools don't fit, the last button is **More (n)**; it opens a second row above, and using a tool there closes it.
- [ ] Select the Light by the fireplace → **Move pad**: a pad in the bottom right above the toolbar. **X·Y**: drag left/right moves it along, up/down lifts / lowers it (a small wobble at the start of a sideways drag doesn't lift it). **X·Depth** says *depth locked* for the light. **Fine** moves it slowly. **To ground** puts it back on the floor. Position's numbers follow while you drag.
- [ ] Select a dressing asset (e.g. the dining table) → Move pad → **X·Depth**: dragging up moves it further away, down nearer. Lift your finger, Done Editing, reload: it stays where you left it.
- [ ] In a World Group edit (a member selected) and in a puzzle edit: the pad moves the member; one Undo puts it back.
- [ ] Selecting nothing hides the pad; selecting something else keeps it open for that thing. × closes it. Dragging on the scene still works as before.

**0cc. Editor screen zones (26 Nov)** — game editor and Menu, phone in landscape
- [ ] Edit: the drawer is narrower (about a third of the screen). Environment / Terrain / Puzzle / Story tabs read in full; the Story tab no longer shows a stray "null".
- [ ] **+ Add Environment Asset**: the asset browser opens *in the drawer's place* (left), not on the right; × brings the drawer back. Pick Light: the placing card is short (name on its own line, Change Asset / Done Placing below) and the scene behind it is clear.
- [ ] Select a placed Light: its panel fills the left; the toolbar is one row of small buttons to its right, nothing hidden behind the panel. **Position** opens on top of the Light panel (same place); ‹ Back / × returns to the Light panel. The name label over the object never sits under the TEST bar or the panel.
- [ ] Menu → Light / Fog / Post / Looks / Sound / Camera / Go to, in play and in edit: each opens on the left, the Menu list closes, and the right side of the scene stays clear.
- [ ] World Group: Edit Group → select a member → Position: still opens in the drawer's place with ‹ Back. Puzzle and Story tabs, the story timeline and its pick-lists still work.

**0cb. Point lights slider (25 Nov)**
- [ ] Menu → **Light → Point lights**: dragging it dims / brightens every placed Light together; 0 % turns them off. It is kept after a reload.
- [ ] Save a night look with Point lights 100 % and a day look with 0 %: a Look step (or Menu → Looks) from night to day fades the lights out along with the global light.

**0ca. Point lights (25 Nov)** — game editor
- [ ] Edit → **+ Add → WORLD OBJECTS → Light**: place it in the cabin (e.g. in front of the fireplace, at about knee height). A glowing marker shows while editing; it disappears when you press Done Editing or ▶ Play… and in player mode.
- [ ] Selecting the light opens the **Light** panel (where the Thought / Camera Node panels go): Colour, Strength, Radius, Flicker, Flicker speed change the light live, and the dashed circle shows its reach. × closes it; the settings are kept after Done Editing and a reload. Inside a puzzle or World Group edit, Undo undoes a slider change.
- [ ] Set the **Light** menu (global) to about 30 % blue: around the placed light, the floor, walls, fireplace and Aureli walking past are lit warmly, fading out over its radius; elsewhere stays dark.
- [ ] Two lights with different colours keep their own settings; Duplicate copies a light with its settings. The Select Filter has a **Lights** chip. With 2–3 lights placed the game stays smooth.
- [ ] Note: light goes through walls and has no shadows; a light placed under the floor still lights the floor from below.

**0bz. Global light (25 Nov)** — game editor
- [ ] Menu → **Light**: a panel like Post with COLOUR and STRENGTH. Lower the strength: the whole scene (trees, cabin, Aureli, the fire effect, the sky) darkens evenly; pick a blue colour for moonlight. 100 % white looks exactly as before.
- [ ] The far fog keeps its colour: set a dark blue fog in **Fog** for a full night. 
- [ ] **Looks → New** while it's dark saves the light with the look; switch between looks (the light blends with the fog and post); a story **Look** step to the night look fades the light down over its seconds.
- [ ] While a look is showing, the Light panel header says its name and edits that look; Base look edits the world's own light. Close and reopen the game: both are kept.
- [ ] Player mode (the game from the splash): no Light button in Menu; a published night look still shows.

**0by. Character Lab speed (25 Nov)**
- [ ] Open Character Lab: it should load as quickly as it did a few days ago, and ▶ playing an animation, scrubbing frames and dragging handles should feel smooth again (as before the animation library change).
- [ ] The animation library still behaves: Add to library on an animation, pick it for another character, rename it in the Animation manager — each shows straight away.

**0bx. Animation library and manager (25 Nov)** — Character Lab
- [ ] Aureli → Animate → open her Climb → under the list, **This animation** says whether it's shared or *Aureli's own*. Type a name (e.g. *Climb*) → **Add to library**: it now says *⧉ Climb is shared from the library*.
- [ ] Open **Father** → Animate → the **Climb** menu shows his own animations, then **Library (shared)** with *Climb ⧉*. Pick it: he gets a *Climb* animation, the Climb row plays it, and the box says *also used by Aureli*.
- [ ] Change a key on Father's Climb: it asks **Change Climb for everyone?** — *Change for everyone* (Save, then open Aureli: she's offered the update) or *Make it Father's own* (Aureli unaffected).
- [ ] **New** → *Start from* lists *Library: …* entries: picking one makes a full copy as the character's own (the name fills in).
- [ ] **Manage animations…** (under the animation buttons, and Settings → Animations) → **Characters** tab: every character (Two-legged / Four-legged) with all its action slots and the animation in each. Change Father's Climb from the menu to *Climb ⧉* (Library group) without opening him: it shows *⧉ shared*. **Go to** opens that animation in Animate.
- [ ] **Animations & library** tab: each library animation lists the characters using it, each with **Go to** and **Make it …'s own** (try it on Father's Climb: it moves down to *Characters' own*). Rename / Duplicate on a library animation; Delete only when no one uses it (built-in ones never).
- [ ] Characters' own animations: Rename, Duplicate (a "… copy" appears), Add to library (it moves up to the Library, still used by that character), Delete (asks first; greyed out for built-in ones and ones Idle / Walk / Run / Jump / Climb play).
- [ ] Nothing changed in the game: each character still plays the same animations.

**0bw. All keys (25 Nov)** — Character Lab → Aureli → Animate (e.g. her Climb)
- [ ] Key Pose Tools → tap **All keys**: it turns amber (*On · edits move all 16 keys…*) and the key lane's keys get an amber outline.
- [ ] Drag the body (root) up a little on one key, let go, then step through the other keys: each is higher by the same amount, and ▶ plays the same motion, just higher. **Undo** once puts every key back.
- [ ] Also try a hand handle and a slider: the same change lands on every key.
- [ ] Tap **All keys** again (off): an edit changes only the current key. Reopen Character Lab: it starts off.

**0bv. Climb animation (24 Nov)** — Character Lab → Aureli
- [ ] Animate → Actions lists **Climb** after Jump, set to *The game’s own climbing*. In the game, climbing (Action at a climb rock) looks exactly as before.
- [ ] **New** → *Start from* → **Today’s climbing, converted** (the name becomes *Climb*) → Create: a 16-key animation opens and the Climb row now plays it. ▶ plays it: arms and legs reach in diagonal pairs.
- [ ] The **Ground Motion** panel says *Climb · … cm per cycle*; **Moving Ground** shows a wall of rungs in front of her moving down as she climbs. A hand or foot that holds should stay on one rung.
- [ ] Game: climb up a rock — it looks the same as before (now from her animation). Climb back down: the animation runs backwards and the hands and feet don't slide.
- [ ] Back in Character Lab, change a key (e.g. raise a hand higher), **Save**: the game's climb shows the change. Climb up and down facing left as well as right.
- [ ] Set Climb back to *The game’s own climbing*: the game uses the coded climb again. A four-legged character can pick any of its animations (e.g. Run) for Climb; it then plays by distance climbed instead of the old run cycle.

**0bu. Fire effect (24 Nov)**
- [ ] Asset Lab → **+ Add ▾ → New fire effect**: a fire burns on the stage. Drag each slider (Flame height, Width, Speed, Flicker, Tongues, Lean, Soft base, colours, Glow, Smoke, Embers): it changes live. Set Height so it suits the fireplace (about 0.6–0.8 m).
- [ ] Game → Edit → **+ Add environment asset → EFFECTS → Fire**: place it in the cabin's fireplace (in front of the painted fire). It flickers smoothly on the phone; with two or three placed it is still smooth.
- [ ] It sits behind things in front of it (the hearth's stones if it is placed behind them) like any asset.
- [ ] Optional: Save as state *Low* (small, slow) and use an **Effect on a character** step with the fire to see it blend in and out.

**0bt. Skip (24 Nov)** — e.g. your *Taken* sequence (any event with a *Take control* step)
- [ ] Walk into the zone (or TEST bar ▶ Play then walk in): as soon as control is taken, **Hold to skip ⏭** appears at the top centre (on the letterbox bar if there is one).
- [ ] A quick tap does nothing. Hold it: it fills in about ¾ s, then the event jumps to its end — Father is gone (dissolved), anyone walking stands at their mark, the bars, black and the line vanish at once, the camera cuts back to Aureli and you can move straight away. The button goes.
- [ ] Anything the event sets still happens: flags (a *When: flag* line elsewhere fires), objects shown / hidden, items, the look it changes to.
- [ ] An event that follows it in the same sequence (*When: an event finishes*) is skipped with it. One started by a flag shows Skip again if it takes control.
- [ ] While paused (❚❚) Skip is hidden; it is back on ▶ Resume. It never shows while just editing.
- [ ] **Closing mid-scene:** in the game (not the editor) start the event, then close the app (swipe it away) while control is taken. Reopen: the scene is in its finished state (Father gone, flags set), control is yours, and what follows it plays. ⚑ Progress → Reset on the sequence still brings everything back.
- [ ] ⚑ Progress → **Complete** on a sequence now also applies its *Object* (appear / disappear / change) and *Put on / Take off* steps.

**0bs. Wear the bag (24 Nov)**
- [ ] Asset Lab → the hook bag → Interactions → **Wear**, tick **Holds the inventory**, set *Nothing to carry it in* and the flag `has-bag`.
- [ ] Character Lab → Aureli → Skin: select the bag part → **Worn item** → the hook bag. Save. (It still shows in Character Lab.)
- [ ] Game, fresh progress (Progress → Reset all): no bag on her and no Items button. Try the note: its view says your "nothing to carry it in" line and has no Pick up; the apple says it too.
- [ ] Walk to the bag on the hook: Action (or the view's **Put on**) — it leaves the hook and appears on her, skinned, moving with her; the Items button appears. Now the note and apple can be picked up.
- [ ] Close and reopen: still wearing it. Reset all: bag back on the hook, off her, Items hidden.
- [ ] Story: Player row → **Put on (the bag…)** / **Take off** steps work; that sequence's Reset takes it off again.

**0br. Collect (24 Nov)**
- [ ] Asset Lab → *FathersNote* → Interactions: tap **Collect**, give it a name and description; set Inspect's *Sets story flag* to `read-note`.
- [ ] *Apple*: Collect only (no Inspect), flag `took-apple`.
- [ ] Game: the note's view now has **Pick up** and **Leave**. Pick up: the note disappears and the Items count goes up. The apple is picked up straight away with Action ("Picked up Apple").
- [ ] Items: both show with their pictures; tap the note → it opens large with Close.
- [ ] Close the game and reopen: the note and apple are still gone and still in Items.
- [ ] Editor: the picked-up note is back on the mantel while editing; ▶ Play hides it again. TEST bar → ⚑ Progress → Reset all brings it back and takes it out of Items.
- [ ] Story: a sequence line *When: flag* → `read-note` is offered in the flag list and fires after reading the note.

**0bq. Inspect (24 Nov)**
- [ ] Asset Lab → pick *FathersNote* → **Interactions** → tap **Inspect**: Title, Text and *Show large on screen* appear. Give it a title and the note's words, and turn on Show large.
- [ ] Do the same for the apple with Show large off.
- [ ] Game: walk Aureli up to the note. A dot appears on it; Action shows the note big with the title and text underneath and **Leave**. She can't walk while it is open; Leave (or Action again) closes it.
- [ ] The apple shows a small card with its text and Leave, without the picture.
- [ ] Turn Inspect off in Asset Lab: back in the game (reopen it) the dot has gone.

**0bp. Objects in sequences (23 Nov)**
- [ ] Story → Sequences → *Taken* → Components → **+ Object**: pick an asset (e.g. a log). It stands on the ground beside the sequence at game size, labelled ▢. Its settings: Asset (Change…), Size, Lift, Facing, Depth, *Hidden at the start*.
- [ ] World Lab: drag the *Taken* sequence along the track; back in the game the object has moved with it.
- [ ] Events → *Taken* → Roles: add an **Object** role and map it to the log in the sequence's line. On the timeline it has its own ▢ row; tap the row to add *Disappears* / *Appears* / *Changes to…*.
- [ ] Put *Disappears* at 2 s and press ▶: the log vanishes at 2 s; scrub back before 2 s and it is there again. Try *Changes to…* another asset.
- [ ] Tick *Hidden at the start* on an object: in the editor it shows faintly; in ▶ Play it is invisible until an *Appears* step.

**0bo. Scene objects in Character Lab (23 Nov)**
- [ ] The asset list has every built-in asset under group headings (Puzzle · Bridge, Environment · Trees, …) plus *Imported*. Add a tree stump or fence: it stands at the size it is in the game. Asset Lab still lists and edits all its assets as before.
- [ ] Character Lab → Father → Animate: **Scene objects** under Actions & animations. Pick an asset (e.g. the log or the chopping block once imported) and **Add**: it stands on the ground in front of him at game size.
- [ ] Slide **Distance** and **Size**; **Behind / In front** swaps which side of him it is drawn; ✕ removes it; **Clear all**.
- [ ] Switch to **Play**: the object stays put in the world as you walk past it. Reload the page: it is gone (nothing saved).

**0bn. Animation blending in sequences; Actions list width (23 Nov)**
- [ ] Father loops his chop (component Animation: Chop); walk into the zone so the event's Animate step changes him to Idle: he eases into it over about a third of a second instead of popping.
- [ ] Character Lab → Father → Animate: with a custom slot set to a long-named animation, the Actions list and its buttons stay inside the panel.

**0bm. New animation start pose (23 Nov)**
- [ ] Character Lab → Father → Animate → **New**: a dialog asks for a name and **Start from** (default *Its Idle pose*). Create: the new animation shows him standing exactly as in his Idle (not hunched), with keys on frames 1 and 16.
- [ ] Try *Its rig's rest pose* (straight) and *First pose of …* another animation: each starts from that pose.

**0bl. Playhead drag, controls when collapsed (23 Nov)**
- [ ] Grab the red playhead line itself (anywhere down the timeline, not just the seconds ruler) and drag it: the scene scrubs with it.
- [ ] Press ▶ Play on the TEST bar, then collapse the timeline (‹): Jump, Action and the move control are there, so you can walk into the trigger; the playhead still follows the event when you expand it again.

**0bk. One transport, pause and scrubbing (23 Nov)**
- [ ] Open *Taken*'s timeline and press **▶**: it plays; press **❚❚**: everything stops where it is (Father, the dissolve, the camera, a speech bubble), the clock stops and you can't move Aureli; **▶** carries on from the same moment (not from the start).
- [ ] The TEST bar shows **❚❚ Pause / ▶ Resume** while playing and it is the same switch: pausing on either changes both.
- [ ] TEST bar **■ Stop** / **↺ Restart** / **▶ Play** then walking into the zone: the timeline's playhead and clock follow the event whichever way it started.
- [ ] **Scrub:** drag along the ruler (the seconds at the top) at Half or Full: the scene jumps to that moment (Father's dissolve, the camera shot, the line that is showing); let go: it stays paused there. Tap the ruler at 5 s: it jumps to 5 s. At Bar, drag along the strip; tapping a coloured line still opens that step.
- [ ] While paused at a moment, move or resize a block: the scene updates at once at the same moment. Press ▶: it plays on from there.
- [ ] **⏮**: back to 0 s, paused.
- [ ] Stop playing (■ Stop) and leave the editor: the game runs normally (nothing left paused).

**0bj. Timeline with the game: TEST bar, focus, opacity (22 Nov)**
- [ ] With the timeline open (any size) the TEST bar stays at the top right and works (▶ Play, ■ Stop, ↺ Restart, Reset story, ⚑ Progress); at Full the timeline starts just below it.
- [ ] ✎ (timeline focus): taps edit the timeline; the Jump / Action / move controls are hidden.
- [ ] 🎮 (game focus): the timeline shows through and taps on it reach the game; Jump, Action and the move control sit on top and work; the timeline's top line (▶, sizes, ◐, ‹) and an open step panel still work.
- [ ] ▶ on the timeline switches to 🎮 by itself: in a sequence that asks for Action you can press Action without collapsing anything; ■ returns to ✎. At Bar while playing, the bar sits just above the controls.
- [ ] ◐ cycles 100 / 75 / 50 / 25 %: the timeline gets more see-through over the game; it is remembered when you close and reopen it.

**0bi. Timeline docked with the game (22 Nov)**
- [ ] Story → Events → *Taken* → *Open the timeline*: it opens at **Half** over the game (the game view itself does not change size or move) with the editor panel, TEST bar and Jump / Action controls out of the way.
- [ ] ▁ ▄ █ switch Bar / Half / Full; tapping the handle on the top edge goes to the next size; dragging it up or down makes it bigger or smaller. The size is kept when you close and reopen it.
- [ ] **‹** (or swiping left on the handle) collapses it to a rail on the left that looks and sits exactly like the editor panel's collapsed rail (TIMELINE ›, a dot when there are unsaved changes); tap it (or swipe right on it) to bring the timeline back.
- [ ] **▶**: Aureli is placed on the zone and *Taken* plays from the start; the clock counts and the red playhead moves (the view follows it at Half / Full; the strip shows it at Bar). ■ stops it and editing returns. Press ▶ again: Father is back and it plays again.
- [ ] At **Bar**, tap a coloured line in the strip: that step's settings open at the top right over the game; change its start time, then ▶ to see the difference.
- [ ] Open the camera shot and press **📷 Frame it**: the timeline goes aside, you frame in the full game view; **Done** brings the timeline back at the same size with the shot saved to the step.
- [ ] Close: the editor panel, TEST bar and controls come back; the game view is full height again.

**0bh. Event page width (22 Nov)**
- [ ] Story → Events → an event with a long line: the page fits the panel (placeholders, *Open the timeline*, the summary); long lines end in "…".

**0bg. Dissolve start (22 Nov)**
- [ ] Play *Taken* and watch Father as the dissolve starts (in the close-up shot): he should not pop, soften or shift by a pixel when it begins.

**0bf. Timeline-first events, a row per subject (21 Nov)** — replaces 0bd / 0be
- [ ] Story → Events → *Taken*: the page shows a summary in time order (start time, row, what, length). Tap Father's line: the timeline opens on it with its settings on the right.
- [ ] Rows down the left: **Father**, **Player**, **Camera**, **Screen**, **Look**, **Game**; they stay at the left edge while you scroll the time, and the seconds ruler stays at the top when you scroll down.
- [ ] The event kept its timing when it was converted (dissolve, lines, camera and bars start where they did before).
- [ ] Tap an empty spot on the **Player** row at about 5 s: a list (Say a line / Think) opens; choose Say: a line appears there, open on the right. Tap the **Camera** row: Frame a shot / Back to the player. Tap **Look**: a Look step is added straight away.
- [ ] Drag the new line by ⋮⋮ (or press and hold) up to Father's row at about 8 s: the yellow label reads the time and *Father*; it lands there and its Who is now Father. Try dragging a camera block to another row: it stays on Camera ("stays on its row").
- [ ] Drag a block's **right edge** (the small bar): the label shows its length; it changes when you let go (lines, waits, fades, looks, camera moves, walks — a walk then takes that long; the dissolve stretches its states).
- [ ] Instant steps (take control, hold the axe, flags) are **diamonds**; drag and tap them the same way. Overlapping steps on one row get an extra line.
- [ ] **+ Character** (bottom left) adds a character row; **+ Add** lists everything and puts it at the end. Sheet: **Duplicate**, **Remove**, **Done**. ↶ / ↷, pinch zoom, Discard and Save still work.
- [ ] Save, then walk into the zone: everything happens at its time (the lines over the dissolve, Wait for Action still stops the clock).
**0bc. Lines during the dissolve; the player speaks (20 Nov)**
- [ ] Story → Events → *Taken*: on the **Effect** step tick *Don’t wait for it to finish*. Keep the Wait 3 s step *at the same time* as it, then Father’s Say step (not at the same time).
- [ ] Add a **Say** step with *Who* = **The player**, line “Father?”, then another Father line. Play it: the dissolve starts, after 3 s Father speaks, then Aureli, then Father, while he is still dissolving; the player’s line shows Aureli’s name.
- [ ] Control and the camera come back only once the dissolve has finished (not straight after the last line). Older events without the tick behave as before.

**0bb. Dissolve: whole head, no flash (20 Nov)**
- [ ] Game → your *Taken* test: walk into the zone. Father dissolves from the feet up with his **whole head** visible (nothing cut off at the top), also as the close camera shot moves in.
- [ ] When the dissolve finishes he is gone for good: no flash of him back for an instant.
- [ ] ⚑ Progress → Reset on *Taken*, walk in again: same result. If he holds a prop (Holds → + Prop), it dissolves with him and is not cut off either.

**0ba. Dissolve preview: all characters, true size (20 Nov)**
- [ ] Asset Lab → Dissolve: *Preview on* lists all your characters (Aureli, Hero 2, Fox, New01, Character01–03) and opens on Aureli, not the fox picture.
- [ ] Each one stands on the ground line at its game size: Aureli about the player reference's height, the Fox clearly smaller, Father a little taller.
- [ ] Four-legged characters play their animations under *Pose*; *Holding* is greyed out for them (only two-legged characters hold props).
- [ ] *Sample picture (not to scale)* at the bottom still shows the old fox picture.

**0az. Dissolve preview on a character (20 Nov)**
- [ ] Asset Lab → your **Dissolve** effect: under EFFECT there are *Preview on*, *Holding* and *Pose*. Choose Father (Character03): the stage shows him instead of the fox (if the effect's settings are fully dissolved, drag *Progress* down to see him).
- [ ] *Holding* lists the props you set up for him in Character Lab → Props (after Save); choose one: he holds it on the stage and it dissolves with him.
- [ ] *Pose* → Walk (or any animation): he plays it on the spot. Standing still: rest pose.
- [ ] Back to *Sample picture (fox)*: the fox is back. Reload the page: your choice is still there (this session).

**0ay. Props: Father holds something (20 Nov)**
- [ ] Character Lab → Father (Character03) → **Props** (new button between Skin and Animate): *Add a prop* → Broken Branch (or your axe once imported): it appears at his near hand with a dashed outline.
- [ ] Use the pad bottom-right: **Move** drags it, **Turn** turns it, **Size** grows / shrinks it, **Fine** slows them; the four number boxes match and can be typed into. **Mirror**, **Far hand** and *Drawn* change it as expected; Undo works.
- [ ] *Try it in an animation*: pick WalkFather → **▶ Play**: he walks with it in his hand and it swings with the arm. Tick *Show it in Animate and Play too*, open Animate and Play: it is still in his hand.
- [ ] **Save**, close and reopen Character Lab: the prop and its grip are still there.
- [ ] Game editor → Story → a sequence with Father → his component → *Holds* → **+ Prop** → choose it: he holds it in the game exactly as in Character Lab (facing left too).
- [ ] An event with a **Prop** step on him: *Drop it* → ▶ Play: it falls from his hand and lies on the ground. ⚑ Progress → Reset on that sequence: it is back in his hand. Try *Put it away* and *Hold it* too.

**0ax. Dissolve behind scenery; closer shots (19 Nov)**
- [ ] The fox set further back than the path, dissolving: ferns and plants in front of it still cover it (as when it isn't dissolving).
- [ ] A Camera step on the fox with *Move back* about −14 and *Height* about −1.8 (or 📷 Frame it, pinching in): the view passes the path and shows the fox close up; the dissolve stays sharp.

**0aw. Character effect: Dissolve (19 Nov)**
- [ ] Asset Lab → **+ Add ▾ → New character effect**: the stage shows the fox half dissolved, with a glowing edge and flecks. Move **Dissolve** from 0 to 1: it breaks up from the feet and is gone at 1; *From feet ↔ head* below 0 makes it go from the head down. Save two states, e.g. *Half* (0.5) and *Most* (0.8).
- [ ] Story → an event with **Effect on a character** on an animal: effect Dissolve; states Half 1 s → Most 1 s → Gone 1 s. ▶ Play: the animal dissolves in place (or while running a Move run *with* it) and stays gone. Check it is smooth on the phone and the animal sits exactly where it did before (no jump when the effect starts).

**0av. Camera Cut and Frame it (19 Nov)**
- [ ] Story → open your event from its sequence (the logic line's *Open*) → a Camera step → **Cut to it**: ▶ Play: the view jumps to the shot instantly.
- [ ] **📷 Frame it**: the view looks at the character; drag with one finger (the world follows it), pinch to move closer / further, Aim to tilt; **Done**: the sliders show the new values; ▶ Play shows that framing. **Cancel** leaves the old values.

**0au. Asset Lab layout (18 Nov)**
- [ ] Asset Lab: the library shows **+ Add ▾** (tap: Import image asset / New darkness effect) and a **Show** dropdown; pick *Trees*: only trees are listed. The list has more room than before.
- [ ] **Hide panel ›** folds the right-hand settings to a thin rail and the asset view widens; **‹** brings it back; close and reopen Asset Lab: it stays as you left it.

**0at. Darkness on a character (17 Nov)**
- [ ] Asset Lab → your effect → set sliders and **Save as state** three times (e.g. *Grab*: narrow, fast; *Cover*: wide, dense; *Dust*: thin, slow, more flecks). Tap a state: the sliders load it; change one and **Update state**.
- [ ] Story → a sequence with an animal character and a mark ahead of it; an event with **Move** (Animal runs to the mark) and **Darkness / effect** run *with* it (On: Animal; start after ~1 s; states Grab 0.25 s → Cover 0.3 s → Dust 0.7 s → Gone 1 s; Hide the character at 0.5 s). ▶ Play: the animal runs, the darkness grabs it, it vanishes, and the dust carries on along its path and fades.

**0as. Darkness effect (14 Nov)**
- [ ] Asset Lab → **+ New effect**: a Darkness whirlwind appears and swirls on the stage; *Effect* has Shape, Opacity, Swirl speed, Twist, Rise, Density, Edge softness, widths, Turbulence, colours and Flecks; each slider changes it live. Set Height to about 3 m.
- [ ] Game editor → + Add environment asset → EFFECTS → place it: it swirls in the world (check it stays smooth on the phone, and with two or three placed).

**0ar. Looks (14 Nov)**
- [ ] Edit → Menu → **Looks**: *+ Save current as a new look*, name it (e.g. Cold and grey). Open **Post**: its header reads POST · COLD AND GREY; lower Saturation and add a blue tint. Looks → **Base look**: the normal colours come back (Base unchanged). Tap your look again: it returns.
- [ ] Story → an event with a **Look** step (Change to: your look, blend 2 s), on a sequence line: ▶ Play into it: the world fades to the look over 2 s. Close and reopen the game (player mode): still that look. TEST bar → Reset story: back to base.

**0aq. Environment filter and search (14 Nov)**
- [ ] Edit → Environment: the Select Filter chips sit on several lines; tap **Thought Nodes**: the list shows only thought nodes, each with what it says.
- [ ] Type *wrong way* in the search box: "I think I'm going the wrong way" appears under *Inside puzzles* (Fallen Tree); tap it: the Fallen Tree puzzle opens for editing with that thought's settings open. Change it, Save the puzzle.

**0ap. Group node editing, editor at the player start (13 Nov)**
- [ ] Edit → Environment: tap the "Home Sweet Home" thought node inside HomeGroup01: its text box opens straight away (header GROUP NODE). Change the text, then Save the group; Done Editing; walk into it: the new thought shows.
- [ ] With a START flag set in World Lab, open the game editor: the player stands at the flag, facing its way.

**0ao. Replace Art with a different shape (13 Nov)**
- [ ] Place an imported asset a couple of times (one in a puzzle if you can), then Asset Lab → Replace Art with a PNG of different proportions: the top right says how many copies were reshaped; in the game they stand at the same height with the new width, not stretched.

**0an. World Lab sequences, player start, texture info (13 Nov)**
- [ ] World Lab: the **SEQUENCES** row shows your sequences as purple bars. Tap one: its components, logic and flags appear below. Tap it again and drag it, or type an Anchor X; open the game: the sequence (characters, zones) has moved. Undo puts it back.
- [ ] World Lab: tap the green **START** flag, drag it (or type / *Set to the playhead*) and choose Facing. In the game: Menu → Delete save: you begin at the flag, facing that way.
- [ ] World Lab: an imported asset placed on its own shows its name in WORLD ASSETS.
- [ ] Asset Lab: **Texture** (top of the right column) shows the pixel size, size in the game and px per metre; changing Height updates it.

**0am. Import an asset (12 Nov)** — needs a transparent PNG in Files (Photos may hand over a JPEG)
- [ ] Asset Lab → **+ Import asset** → pick the PNG from Files: it appears at the bottom of the list (IMPORTED) and is selected; *Asset details* shows its name ready to type. Name it, choose Library / Group / Kind.
- [ ] Set **Height** and **Floor line** with Player Reference on; add collision and a behaviour (e.g. Solid + Support Surface) if it needs one.
- [ ] Open the game → Edit → **+ Add environment asset** (or the Puzzle list): it is under its group heading with its picture; place a few. Close and reopen the app: they are still there.
- [ ] **Replace Art** with another PNG: placed copies change picture, keep their place. **Delete Asset** while placed: refused with where it is used.
- [ ] Publish Lab: **Assets** shows New; Prepare package → upload to `publish/` → merge the Action's pull request. After it deploys, Publish Lab shows Assets as Published.

**0al. Progress window, Solved State, Item step (12 Nov)**
- [ ] ⚑ Progress looks like the other editor menus: light text, rows as cards with Go / Complete / Reset across the bottom, green edge on done ones.
- [ ] Edit → TEST bar **⚑ Progress**: the right-hand window lists puzzles and sequences in journey order with their state. **Go** jumps there; **Complete** / **Reset** change the state and the row updates.
- [ ] Puzzle editor: lay a puzzle out solved, tap **Set Solved State**, put it back to its start. In ⚑ Progress, **Complete** that puzzle: the pieces jump to the solved layout and its reward is in the inventory; **Reset**: back to the start, item gone.
- [ ] An event with **Item → Give** forest key: run it, the key appears; ⚑ Progress → Reset the sequence removes it. **Item → Take** removes one; Reset gives it back.
- [ ] Story flags show as chips; tapping one sets / clears it. **Complete all** then **Reset all** returns everything to the start.

**0ak. Story tab, side pick-lists, swap a character (12 Nov)**
- [ ] The editor tab reads **Story**. **+ Character** and **+ Add step** open the right-hand window (like Environment → assets); tapping a card picks it, × closes it.
- [ ] Open a character component → **Character: … Change…** → pick another: it swaps in place, keeping its logic.

**0aj. Sequences editor layout (11 Nov)**
- [ ] Open a sequence: a small **‹ Back** top left with its name; Components has **+ Character / + Mark / + Zone** across the top; **+ Character** shows a list of characters — pick one, then tap the ground. Each component row has a **×** on the right. Add several without scrolling to the bottom.
- [ ] Logic **+ Add line** at the top; the new line scrolls into view. An event (from *Open* or *+ New event…*): **+ Add step** sits under the last step and shows the list of steps; **‹ Back** returns to the sequence.

**0ai. Blocked path (11 Nov)** — the full test: Edit → Sequences
- [ ] Sequence *Blocked path*: **Zone** *Approach* on the path; **Character** *Guard* just past it on the path (Blocks: Auto, facing left); **Mark** *Aside* a step off the path (depth about −2.5); **Mark** *Shot* between them.
- [ ] Event *Blocked and stepping aside* (placeholders Actor, Aside, Shot): Control take → Screen bars in → Camera frame *Shot*, Move back −2, over 1.5 s, **Keep after the event** → Face the player → Say "You can't pass… not yet." → **Wait for Action** (*Talk*) → Say "Very well." → Move Actor to Aside → Screen bars out → Control give back.
- [ ] Event *Camera back*: Camera Back to the player, 1.5 s.
- [ ] Lines: When the player walks into *Approach* → Blocked and stepping aside (fill Actor = Guard, Aside, Shot), once; When the player **leaves** *Approach* → Camera back, every time.
- [ ] ▶ Play: she stops, bars, the camera closes in, he speaks, the **TALK** button glows above the bar (everything else dim); press it: he steps aside, bars go, control returns, the camera stays close until she walks out of the zone, then returns.

**0ah. Camera and screen steps (11 Nov)** — Edit → Sequences
- [ ] Make an *Intro* sequence near the start with two marks (*Far*, ahead along the path; *Near*, by Aureli) and an event with two mark placeholders: **Control** take → **Screen** Fade to black (0 s) → **Screen** Letterbox bars in (tick *at the same time*) → **Camera** Frame a shot: Far, Raise 3, Move back 10, over 0 s → **Screen** Fade in (1.5 s) → **Camera** Near, over 4 s → **Wait** 1 s → **Camera** Back to the player (1.5 s) → **Screen** Bars out → **Control** give back. Logic line *When the sequence starts* → this event, placeholders filled. **Save**, then TEST bar **Reset story** and **▶ Play**: it plays from black, pans, returns; the controls are dim until it ends.
- [ ] Take the last three steps away and play again: when the event ends the camera still returns, the bars go and control comes back.

**0ag. Carrying (11 Nov)** — Menu → Collision on
- [ ] Character01 picks up a log: the blue carried box sits on the log in her arms (not below it). Walk up to a log on the floor: she gets right up to it, and Put Down stacks it on top. Same with Aureli.

**0af. Sequences and events (10 Nov)** — game → Edit → **Sequences** (the old Story tabs are gone; start fresh)
- [ ] Scope row reads Environment · Terrain · Puzzle · Sequences on one line.
- [ ] On a logic line, **Run event → + New event…** opens a new event; **+ Mark placeholder** (type a name in the box, e.g. *Exit*), add a **Move** step (Who = Actor, To = Exit), then **‹ Back to** your sequence: the line shows **Fill in the event's placeholders** — choose your character for Actor and your mark for Exit.
- [ ] Scroll down a sequence, Done Editing, Menu → Edit: the editor reopens on **Sequences**, at the top.
- [ ] **Events → + New event** (it has an *Actor* role) → **+ Mark role** (*Exit*) → steps **+ Face** (the player), **+ Say** (a line), **+ Control** (take), **+ Move** (Actor to Exit, Walk), **+ Control** (give back), **+ Flag** (`met-father`). Tick *At the same time as the step before* on one to see two run together.
- [ ] **Sequences → + New sequence**, tap the ground: a green post with its name appears. **+ Character** (pick one) tap; **+ Mark** tap; **+ Zone** tap the path before the character. **+ Add line**: When *The player walks into a zone* (your zone) → Run your event → Actor = the character, Exit = the mark. **Save**.
- [ ] **▶ Play from here**: walk into the zone — the character turns, speaks (subtitle strip), you can't move while it walks to the mark, then control returns. ↺ Restart (TEST bar) to try again. **Test now** on a line runs it without walking in.
- [ ] Sequence page → **Save as template**, then Sequences list → **+ Place** the template elsewhere: both copies behave the same; **Make unique** on one and change it: the other is unchanged.
- [ ] TEST bar ▶ Play / ↺ Restart / Reset story / ■ Stop still work; Done Editing with unsaved changes asks to save; reopening the editor shows the drawer at the top.
- [ ] Publish Lab → **Story** area (Sequences and events) shows as New.

**0ac. Automatic publishing (7 Nov)** — first use
- [ ] One-off: GitHub → repo **Settings → Actions → General → Workflow permissions** → *Read and write permissions* + *Allow GitHub Actions to create and approve pull requests* → Save.
- [ ] Publish Lab → Prepare package → Share → save to Files. In Safari open the repo's `publish` folder → *Add file → Upload files* (Request Desktop Website if needed) → choose the file → Commit. About a minute later a pull request *Publish: SS-PUBLISH-….json* appears (repo **Actions** tab shows progress/errors); merge it, then the Publish Lab rows read *Published*.
- [ ] World Lab → Data: only *Import older Complete Game file*; Puzzle Lab test stage shows just the puzzle (no old world assets).

**0ab. Pin to body along the limb (8 Nov)** — Character Lab → Character01 → Skin
- [ ] Select LegNear → *Pin to body* → **Lower Back (suggested)**: a red band runs down the leg's bones from the hip. Drag **Strength at the top**, **Fade along limb** and **Curve**: the band and the top of the leg respond; check in Animate → Walk/Run at a big stride. Save.
- [ ] NearArm suggests **Upper Back**. Copy to the other side carries the pin to the far limb.
- [ ] In the game the pinned limbs look the same as in Animate.

**0aa. Puzzle Lab start and clean-up (5 Nov)** — Puzzle Lab
- [ ] Pick one of your templates → **Run Test**: you start just left of the puzzle's left edge.
- [ ] A library puzzle that isn't placed in the world → **Delete puzzle** (confirm): it's gone from the list. One that is placed: Delete is greyed out and says where it's placed.
- [ ] Mountain Climb Prototype → **Hide this built-in puzzle**: gone from the list; *Show 1 hidden built-in puzzle* brings it back to view / unhide.
- [ ] Your world still has all its puzzles (the old built-in Stone Wall / Fallen tree test definitions are gone from code).

**0z. Default player (5 Nov)**
- [ ] Character Lab → Settings → Roles → **Default player** → Character01: the status confirms it. Close and reopen the app: the game starts as Character01, and Character Lab opens on Character01.
- [ ] In the game pick Character02, close and reopen: still Character02 (it used to go back to Hero 1).
- [ ] Publish Lab: **Character roles & categories** shows *Changed* and is ticked; include it in your next publish package.

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
- [ ] **Editor screen zones, last decision (steps 1–4 done 26 Nov):** decide whether dragging on the scene should still move things now that the move pad exists, once the pad has been used for a while.
- [ ] **Carryable lantern (agreed 26 Nov; asset light and Hold done; story objects can't be held yet):** (3) **Arm layers** — an animation marked as a layer drives only the controls it keys (e.g. the holding arm) over walk / run / idle / climb; each asset's Hold names its layer; later the box carry can move onto it.
- [ ] **Lighting, next steps (agreed 25 Nov; start simple and add; placeable point lights and asset lights done):** **Fire gives light** (flickering with the flames), a per-Look **Local lights** amount (lanterns only glow at night; per-light *Always on*), and maybe a story **Light** step (switch one on / off). No shadows; light passes through walls (keep radii sensible).
- [ ] **Falling leaves effect** (idea, 24 Nov): a plane effect (like Fire) with leaves drifting down and spinning, for life in the forest — leaf colours, amount, size, fall speed, wind / sway; maybe a variant for single leaves dropping now and then. Possibly placed along the near side of the path or as a "region" overlay.
- [ ] **Wearable props (attached assets)** (agreed 24 Nov): wear an asset rigidly on a body bone instead of skinning it into the atlas — the Props system with a bone anchor (back, chest, hips, head) instead of a hand, placed in Character Lab → Props, layered among the parts. Uses the same asset as the one in the world (no atlas work); for hats, swords, satchels. Skinned *Worn item* parts stay for things that must bend (the bag, a cloak).
- [ ] **Animation length** (polish, agreed 23 Nov): a Length (s) per animation in Character Lab, used by Character Lab, the game and sequences (today every clip is 16 key positions over its base clip's time: Idle 1.4 s, Walk 1.05 s, Run 0.65 s, Jump 0.94 s).
- [ ] **Rows for the far side:** once near-side rows are settled on the phone, the same row model (depth ±, scale ±, spacing ±, textures) for the dressing beyond the path; later *strip* rows (a long, short grass texture repeated continuously along a row) when those textures exist.
- [ ] **Carry pose per character:** the game's carry arms (`carryPose` in `biped-rig.js`) are one set of hand targets tuned for Hero 1, so Character01 holds things lower. Let each character set its carry (a *Carry* action slot with an animation, or carry hand targets in Quick Play next to the test box), used by the game and Quick Play. Pick-up/put-down reach likewise.
- [ ] **Performance audit (game and Labs):** look for work repeated every frame that only needs doing when something changes, like the character-library re-parsing fixed on 4 Nov (`localStorage` reads + `JSON.parse` in per-frame paths, rebuilding lists/meshes/geometry that haven't changed, DOM updates during playback). Done so far: character-library parsing (4 Nov), per-item terrain re-grounding and asset behaviour merging (5 Nov). Next candidates: the number of draw calls (one per grass/rock item; batching dressing that shares a texture), and terrain lookups outside drawing (`terrainSparseNumberAt` still shows). Measure first (CPU-throttled profile while running), fix the largest, keep a short before/after table in the PR.
- [ ] **Character Lab overlays follow the drawing method (view only, small):** the Display *Rigid Planes* button draws the rig's original cut-out frames whatever the drawing method, so on a Mesh character (the Fox) it outlines frames nothing uses. For Mesh characters, replace it with a *Mesh* overlay showing every piece's wireframe, deforming live with the pose (useful in Animate); Parts characters keep *Rigid Planes*. In Skin, change *Wireframe: On/Off* to *Off / Selected / All* (selected piece stays highlighted), like the Atlas tool's *Wireframes* choice. Nothing saved changes; the game is unaffected.
- [ ] **Imported assets, next steps:** a **crop** option in Asset Lab; let World Lab biome profiles **scatter** imported dressing (they are placed by hand for now); then move the built-in asset list out of `sidescroll.js` / `asset-lab.js` into the same shared library, so built-in and imported assets are defined in one place.
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
- **Texture memory and compressed textures (plan: `docs/TEXTURE_COMPRESSION_PLAN.md`):** today about 290 MB of textures are unpacked at start-up. First load only nearby textures (the streaming item above), then KTX2 / Basis Universal files (ASTC on iPhone, BC7 on desktop, about a quarter of the memory) encoded by a GitHub Action, PNGs kept as masters and fallback. Measure and compare quality on the phone before switching.
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
