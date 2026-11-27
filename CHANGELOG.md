# SideScroll — Changelog

Newest first. One or two lines per release. Detailed notes for 1.1.0–1.1.27 are in
`docs/patch-notes/`; history before that is in `docs/archive/SIDESCROLL_TASKS.md`.

## Unreleased
- **Sequence flow view.** ⤢ Flow on a sequence shows it as nodes in the order things happen: what the
  player does → one box per logic line (its event, length and a strip of its timeline) → the flags it sets
  → the lines those set off; loops are return arrows, *only while* and things waiting for a flag dashed.
  Docked over the game like the timeline (same sizes, focus, opacity). Tap an event box for its timeline
  (‹ Flow back), ✎ for its line, + to add a line after a trigger, event or flag (its event chosen there).
  Live during ▶ Play: the running event glows with its playhead, flags light up, fired lines dim.
- **Flags overview.** Story tab → Flags: every flag with what sets it and what waits for it, each a link;
  also from ⚑ Progress → *Where each flag is used…*.
- **Story map.** Sequences → ⤢ Story map: every sequence along the journey, linked by the flags between them.
- **Asset Lab → Interactions** is Inspect plus one *When taken* choice (Can't / Into the bag / In the hand /
  Worn) with one *Sets story flag*; explanations behind ⓘ. Saved data format unchanged.
- **Story tab, sequence page restructured.** A header with the name, **▶ Play** and **⋯** (anchor, move,
  show, template, delete). Tapping a component or a logic line opens it as its own page (‹ Back names the
  sequence; an event opened from a line goes back to that line). Logic lines read as sentences, e.g.
  *When the player enters Zone 1 → Taken (Father)*, with anything still to choose in amber. Event
  placeholders fill themselves with the same-named or only component of their kind (never replacing a
  choice). New lines start with no event chosen.
- **Tidier Story tab, ⓘ Info.** The sequence page's add buttons wrap three to a row instead of squeezing
  into one; the component list is full height (no inner scroll), with name-only rows, and Components and
  Logic fold (▾ / ▸). The Story editor's grey explanation paragraphs moved behind small **ⓘ** buttons
  (`editor-help.js`, one dictionary for every editor's explanations): tap for a card under the row. Wording
  is neutral everywhere ("the player", not she / her), also in Asset Lab and Character Lab notes. An event
  opened from a sequence shows that sequence's name on its ‹ Back button.
- **Rotate for sequence objects.** A sequence Object has a **Rotate** slider (−180…180°, about its centre, + = clockwise).
- **Objects that can be taken later (sequences).** A sequence Object has **Can be taken** (always / while
  flags are set / while not set) and *Until then she thinks*. Until then, Inspect shows it without Pick up /
  Put on and adds that line; without Inspect she just thinks it. E.g. a broken bag on a hook, taken once
  Father sets `bag-fixed`.
- **Thought bubbles keep their size in editor ▶ Play** (they were stretched to fill the screen).
- **Barriers and conditions on several flags (sequences).** Story → **+ Barrier** places an invisible
  wall on the path that stops the player while its *Blocks* condition holds (always, while flags are set,
  or until they are set), with an optional thought when she walks into it. A line's *Only* and a barrier's
  *Blocks* can now name several flags: *all of them* or *any of them* (for "until", *until all are set* /
  *until any is set*). Older single-flag conditions are unchanged.
- **Frame it clears the screen.** While framing a story camera shot, the editor panel tucks behind the
  PANEL tab and the Jump / Action / movement controls hide, so the shot is all you see. PANEL brings the
  panel back; the framing bar's new **Controls** button brings the controls back. Done / Cancel restore both.
- **Arm pose for held props (lantern step 3).** Asset Lab → Hold → **Arm pose** picks an action slot
  (make one in Character Lab → Settings → Actions, e.g. *Hold lantern*, and give each character an
  animation for it). While she holds that prop, her animation for the slot drives the holding arm (the
  hand her grip uses) on top of whatever else she's doing — idle, walk, run, jump or climb — blending in
  and out over a quarter of a second. A slot used by a Hold now shows as *in the game* in Character Lab.
- **Hold: carry a prop in her hand (lantern step 2).** Asset Lab → Interactions → **Hold (carry in
  hand)**. In the game, Action (or Pick up in the Inspect view) puts the placed copy in her hand,
  drawn with her grip from Character Lab → Props, so it follows the hand through walk, run, jump and
  climb; a lantern with a light glows as she carries it. Action puts it down on the floor in front of
  her (it stands there, glowing, and can be picked up again). One thing at a time: no box while
  holding, and holding something says her hands are full. Not the inventory. Saved in progress;
  Progress → Reset all puts it back where it started. Two-legged characters only for now.
- **Assets can give light.** Asset Lab → **Light → Gives light**: colour, strength, reach, flicker and
  the point on the picture the light comes from (a cross and its reach drawn on the stage). Every copy
  then glows like a placed Light — placed in the scene, as a story object, dropped, and (next) held in a
  hand — and fades with Menu → Light → Point lights. Asset Lab's colour fields use the in-panel picker
  too. First step of the carryable lantern.
- **The dock tucks away (editor screen zones step 4).** While you place assets or use the move pad,
  the left panel slides off the edge and leaves a small **PANEL** tab, so nearly the whole screen is
  scene. Tap the tab to bring the panel back (e.g. for Done Placing); your next tap in the scene or on
  the pad tucks it again. Finishing placing or closing the pad brings it back for good.
- **In-panel colour picker (editor screen zones step 3).** Colour boxes in the game (Menu → Light,
  Fog, Post tint and the Light node panel) no longer open iPhone's full-screen picker: tapping the
  swatch opens a small picker inside the panel — hue, saturation and brightness bars, your recent
  colours, a hex box and Done — so the scene stays in view and changes as you drag. The move pad's
  depth lock now says *turn off Game Layer*.
- **Move pad and a new toolbar (editor screen zones step 2).** Select something and tap **Move pad**:
  a trackpad appears in the bottom right, above the toolbar. Drag on it to move the selection from where
  it is — **X·Y** (along the journey and up/down; up makes it Free) or **X·Depth** (along and
  nearer/further; locked on the game layer) — with **Fine** for small steps and **To ground** / **To
  path**; it moves live and saves when you lift your finger (one Undo step in puzzle / group edits).
  Works for a selected World Group too (X·Depth). The object toolbar now matches the panels (dark,
  teal edge, bold white labels, larger text), and tools that don't fit wait behind **More** (a second
  row above).
- **Editor screen zones (step 1).** On the phone the scene stays visible: every panel you edit in
  — the asset browser, Position, Floor line, Thought / Camera / Light node panels and Menu → Light,
  Fog, Post, Looks, Sound, Camera, Go to — now opens in one dock on the left (about a third of the
  screen), one at a time: a panel opened on top of another goes back to it when closed. The object
  toolbar is one slim row to the right of the dock; the placing card is short; labels stay clear of
  the dock and the TEST bar. Fixed a stray "null" in the Story tab. Rules in the UX bible → Screen zones.
- **Point lights fade with the look.** Menu → **Light** has a **Point lights** slider (0–200 %, default
  100 %) that scales every placed Light at once — 0 % turns them all off. It is part of the base look
  and of every Look, so a Look step from night to day fades the lights out along with the global light. At 0 % the
  game skips point lights entirely (no per-frame search for them, no shader work).
- **Lighting, step 2: point lights.** Game → Edit → **+ Add → WORLD OBJECTS → Light** places a light
  in the world (a glowing marker while editing, hidden in play). Select it and the **Light** panel opens
  beside the game: **colour**, **strength**, **radius** (m), **flicker** and **flicker speed**, all live,
  with the light's reach drawn as a dashed circle in its colour. Each placed light keeps its own settings
  (puzzles and World Groups — with their Undo — duplicates and copies carry them). It lights everything within its
  radius — scenery, characters, effects — fading to nothing at the edge, added on top of the global
  light (so it shows best at night). The 8 lights nearest the camera are used. No shadows; light passes
  through walls. (Asset Lab's *New light* from the first try is gone; lights already made there still work.)
- **Lighting, step 1: global light.** Menu → **Light** (beside Fog and Post): a **colour** and a
  **strength** (0–150 %) that light everything evenly — scenery, characters, effects and the sky —
  before fog is added, so a night is a dim blue light with its own fog colour. White at 100 % is the
  game as painted (the default; nothing changes until you use it). Like Fog and Post it is part of
  the **base look** and of every **Look** (new looks save it; Look steps blend it; older looks get
  white 100 %); while a look is showing, the Light panel edits that look.
- **Character Lab is fast again.** The animation library work made Character Lab slow to load (≈2.8 s
  headless, was 1 s) and choppy (each update ≈145 ms, was 40 ms): every library lookup re-read and
  re-parsed the whole animation-template store, rebuilding the built-in sets and copying every clip,
  and the *This animation* box asks once per animation per character on every update. The store is
  now parsed once and re-read only when its saved text changes (`animation-templates.js` `read`), so
  loading is back to ≈1 s and an update takes ≈26 ms. Nothing saved changes.
- **Animation manager, reorganised.** **Characters** tab: every character with all its action slots
  and the animation in each — a menu per slot lists every animation it could play (the character's
  own, then the Library) to swap it on the spot, with *⧉ shared* / *own* beside it and **Go to**.
  Works for any character, not only the open one. **Animations & library** tab is where animations
  are managed: each Library (shared) animation with every character using it (**Go to**, **Make it
  <name>'s own**) and Rename / Duplicate / Delete (when unused, not built in); then every character's
  own animations with Go to / Rename / Duplicate / Add to library / Delete.
- **Animation library and Animation manager (Character Lab).** Animation templates are now the
  **Library**: shared animations per body type (two-legged / four-legged). Every action menu in
  Animate lists the character's own animations and then **Library (shared)** — picking a library
  animation gives the character that animation, linked, and plays it for the action in one step (no
  more "Use this template" replacing whatever was open). **New → Start from** can take a whole library
  animation as the character's own copy. The box under the list now says plainly whether the open
  animation is shared (and who else uses it) or the character's own, with **Add to library** and
  **Make it <name>'s own**; editing a shared one asks *Change for everyone?* or *Make it own*.
  **Manage animations…** (Animate, and Settings) opens the **Animation manager**: Library tab (every
  shared animation, who uses it for which action; Give to the open character, Rename, Remove when
  unused) and By character tab (every character's animations, shared or own, what plays them; Open,
  Rename, Add to library). Saved data unchanged.
- **All keys (Character Lab → Animate → Key Pose Tools).** A toggle: while it is on, whatever you
  move or change on the current key (a handle in the viewport, a slider or a number) moves **every
  key** of the animation by the same amount — e.g. raise the body 10 cm on one key and it is 10 cm
  higher on all of them. Each control keeps its own motion; only the change is added. One Undo
  step. The key lane is outlined in amber while it is on; it is off each time Character Lab opens.
- **Climb is an animation you can edit.** Character Lab → Animate → Actions has a new built-in
  **Climb** slot (after Jump). Left on *The game’s own climbing*, nothing changes. **New → Start from →
  Today’s climbing, converted** makes a 16-key animation that reproduces the game's coded climb at the
  character's scale and puts it in the Climb slot; edit it like any animation and Save. The game plays
  a character's Climb animation by the distance climbed (one cycle per 0.92 m, backwards when
  climbing down so held hands and feet stay put), easing in from standing. Ground Motion shows a
  **moving wall** of rungs for Climb, so holds can be lined up. Four-legged characters can put any
  animation in Climb too (otherwise they keep the old run cycle).
- **Fire effect.** Asset Lab → **+ Add ▾ → New fire effect**: a plane with flames standing on its
  bottom edge (a hearth, campfire or torch) — several tongues of different heights that break off
  at the tips, hot core, glow, a little smoke and rising embers. Settings: flame height, width,
  speed, flicker, tongues, lean (wind), soft base, three flame colours, glow, smoke, embers. Place
  it like any asset; it can have states, and the **Effect on a character** step can attach it to a
  character (blending from nothing, *Gone* fades it out).
- **Skip.** While a story event has taken control, **Hold to skip ⏭** shows at the top of the
  screen; hold it for about ¾ s (or hold Escape on a keyboard) and the event jumps to its end:
  walks land, effects finish (a dissolved character stays gone), its remaining steps are applied
  at once (flags, objects, items, looks, props, worn items), and the camera, black, letterbox and
  line cut back so control returns straight away. Events that follow it in the same sequence (*When:
  an event finishes*) are skipped with it. Works in the game and in the editor's ▶ Play (hidden while
  paused). **If the game is closed while an event holds control**, the next start counts it as
  finished: its end state is applied and what follows it runs. ⚑ Progress → **Complete** now uses the
  same end state, so it also applies Object and Put on / Take off steps (it skipped them before).
- **Wearing the bag.** Asset Lab → Interactions → **Wear**: picking the asset up puts it on her
  instead (its Inspect view says **Put on**); it never goes in the inventory. In Character Lab →
  Skin, any part can be given a **Worn item** — the bag cut into Aureli's atlas, skinned like
  any part — and in the game it shows only while she wears that asset. **Holds the inventory**:
  until she wears such an asset nothing can be picked up (she says your line instead) and the
  Items button is hidden. A **Put on / Take off** step on the timeline's Player row lets a story do
  it. Worn state is saved with her progress; Progress → Reset all (or the sequence's Reset) undoes it.
- **Collect and the inventory.** Asset Lab → Interactions now has **Collect** (name in the
  inventory, description). A collectable asset's Inspect view has **Pick up** beside Leave; one
  without Inspect is picked up straight away with Action. Picked up, it leaves the world (and stays
  gone; it is back while you edit the scene) and goes in the inventory with its own picture; tap it
  there to look at it again, large. Inspect and Collect can each **set a story flag** (e.g.
  `read-note`), so a sequence line set to *When: flag* can react. Item steps and the story editor's
  item list take collectable assets too. Progress → Reset all puts picked-up things back.
- **Inspect.** Asset Lab has a new **Interactions** section: tick **Inspect** on any asset and
  give it a title, some text and, if you like, **Show large on screen**. In the game every placed
  copy of that asset (and any sequence object using it) shows the little dot when Aureli is near;
  Action opens the Inspect view: the text in a small card, or with Show large the picture big on
  screen with the text under it, and **Leave**. Aureli stands still while it is open. Picking up
  and the inventory follow next.
- **Character Lab: scene objects can be any asset.** The list now has every built-in asset (puzzle
  props, buildings, fences, rocks, trees, ground pieces…) under the same group headings as Asset
  Lab, plus every imported one, at the height and floor line Asset Lab has saved for it. Asset
  Lab's built-in list moved to `builtin-assets.js`, shared by both labs.
- **Objects in sequences.** A sequence can hold **Objects** — any asset (built-in or imported)
  placed relative to it, so it moves with the sequence in World Lab: the chopping block, the
  logs, the note and food in the cabin. Settings: asset, size, lift above the ground, facing,
  *Hidden at the start*. Events get **object roles** (a row each on the timeline) and an
  **Object** step: *Appears*, *Disappears* or *Changes to…* another asset (the bowl emptied, the
  note taken). What happened is kept in play progress; the editor shows hidden objects faintly.
- **Character Lab: scene objects.** Animate and Play get a **Scene objects** section: stand any
  asset (built-in props and every imported picture) on the ground beside the character at game
  size to animate against — Distance, Size, Behind / In front, remove, Clear all. Session only:
  nothing is saved. In Play they stay put in the world while the character walks.
- **Story characters blend between animations.** When a sequence character's animation changes
  (its looping animation giving way to an event's Animate step, a walk starting or stopping) it
  now blends over 0.3 s from the pose it was in instead of popping. The blend runs on the story
  clock, so it pauses and scrubs with everything else.
- **Fix: Character Lab's Actions list could run off the side** on iPhone once a slot had an
  animation with a long name (a drop-down sized itself to its longest option).
- **Character Lab: new animations start from a pose you choose.** **New** opens a small dialog —
  a name and **Start from**: its Idle pose (the default: the animation in its Idle slot), the
  pose on screen now, its rig's rest pose, or the first pose of any of its animations. **Fix:** a
  new animation used to be one key, and a clip with fewer than two keys was replaced by the
  built-in generic frames (made for the original heroes' rig), so it came out hunched and
  bent-legged on other characters; it now starts with two keys (first and last frame) holding
  the chosen pose.
- **Timeline fixes.** The red playhead can now be dragged anywhere along it to scrub (not only
  the seconds ruler). Collapsing the timeline to its rail brings the game's touch controls back,
  so walking into a trigger can be tested with the timeline out of the way.
- **Story: one transport for the TEST bar and the timeline, pause, and scrubbing.** The story now
  runs on its own clock, so it can **pause**: TEST bar **❚❚ Pause / ▶ Resume** (while playing) and the
  timeline's **▶ / ❚❚** are the same switch — walks, animations, the dissolve, the camera, speech and
  looks stop where they are (the player can't move and the view holds) and carry on from there. The
  timeline's playhead now follows its event however it started (▶ on the timeline, ▶ Play or ↺
  Restart on the TEST bar and walking into the zone), and focus follows the game (playing → 🎮,
  paused or stopped → ✎). **⏮** goes back to the start, paused. **Scrubbing:** drag or tap the ruler
  (Half / Full) or the Bar's strip to show the event at that moment (the sequence is reset and fast-
  forwarded, Wait for Action answered on the way); it lands paused, and resumes if it was playing.
  **An edit while paused shows its result straight away** at the playhead. ▶ plays from the
  playhead. (Think bubbles and screen fades don't pause yet.)
- **Story timeline and the game together.** The TEST bar (Play / Stop / Restart / Reset story /
  Progress) stays while the timeline is open (Full now starts below it). A **focus** switch on the
  timeline's top line — 🎮 game / ✎ timeline — says where taps go: with the game focused the
  timeline lets taps through to the game, Jump / Action / moving sit on top of it (a Bar lifts
  above them), and only its top line and the step panel still work. **▶** hands the game the
  focus and ■ gives it back. **◐** sets how solid the timeline is (100 / 75 / 50 / 25 %).
  The − / + zoom buttons are gone (pinch to zoom).
- **Story: the timeline docks with the game.** Three sizes — **Bar** (a slim strip with ▶, the
  clock and a strip of the whole event), **Half** and **Full** —
  chosen with ▁ ▄ █ or the handle on its top edge (tap for the next size, drag up / down); it
  overlays the game, whose view never changes. **‹** (or a swipe left on the handle) collapses it
  to the same rail as the editor panel's, in the same place (TIMELINE ›). **▶** plays the event in the game from its start (that sequence is reset and the
  player stands on its zone) with a playhead following its clock; ■ stops it. **📷 Frame it**
  pushes the timeline aside and brings it back after Done. A step's settings open at the right,
  over the game, at Bar and Half. While the timeline shows, the editor panel, the TEST bar and
  the game's touch controls step out of its way.
- **Fix: an event page wider than the Story panel.** A long line in the step summary stretched the
  whole page past the panel's right edge; summary rows now cut long text with "…".
- **Fix: a small pop when a dissolve starts.** The character is drawn through the effect from a
  picture of itself; that picture is now lined up with the screen's pixels (and may be up to
  4096 px instead of 1024), so it no longer turns slightly softer and shifts when the effect begins,
  even in close-ups.
- **Story: the timeline is the event editor, with a row per subject.** Each event is now a
  timeline with a row for each character, then Player, Camera, Screen, Look and Game, so all of
  Father's lines sit on his row and all letterboxing on Screen. Where a step sits is when it
  starts. Tap an empty spot on a row to add something there; drag ⋮⋮ (or press and hold) to move
  it in time or to another character (a line changes speaker); drag a block's right edge to
  change how long it lasts; instant steps are diamonds; overlapping steps get an extra line.
  The event page shows a summary in time order (tap a step to open the timeline on it). Events
  saved step by step become timed on opening, keeping their timing (saved as such with the next
  Save); numbered tracks are gone.
- **Story: timed events, undo, pinch zoom.** On the ⤢ Timeline a step now goes exactly where you
  drop it, at any time and on any track, and starts then, whatever else is running. Nothing else
  moves; a taken spot puts it on the next free track. The first drag turns the event into a
  *timed* event, with every step keeping the time it already started at. *Wait for Action* stops
  the clock until pressed. Steps can also be given a start time and track in their settings.
  **Undo / Redo** for all Story edits (timeline and panel), **Discard** in the timeline, and
  **pinch to zoom** the timeline. In the step list, opening a step keeps its line and shows the
  settings underneath.
- **Story: event timeline and a tidier step list.** An event's steps now fold to one line each
  (tap to open, drag ⋮⋮ to reorder). **⤢ Timeline** opens the event full screen with time running
  left to right. Each step is a block as long as it takes, steps that start together stack, and
  "don't wait" steps run on dashed under the next ones. Drag a block (by ⋮⋮ or press and hold) onto
  another to run them together, or between two moments to give it its own; tap a block to edit it
  beside the timeline. You can add steps and Save from there too.
- **Story: lines during a long step, and the player can speak.** Any event step can be ticked
  **Don't wait for it to finish**, so the next steps carry on while it runs. For example, the
  dissolve plays while Father and Aureli speak, and the event still holds control and the camera
  until the dissolve is done. A **Say** step's *Who* can now be **The player** (shown with the
  played character's name).
- **Fix: character dissolve cut off the head and flashed at the end.** The dissolve's image was
  framed from the character's collider, which can be much shorter than its art (Father's collider
  is about half his drawn height), so the top of the head was cut off. It is now framed from how
  tall the character is actually drawn, prop in hand included. And when a dissolve finished (or
  reached *Hide at*), the character was drawn once more without the effect for a single frame
  before disappearing; it now disappears straight away.
- **Asset Lab character effect preview: every character, at game scale.** *Preview on* now lists
  every character (Aureli and Hero 2 drawn with their parts, the Fox and the other four-legged
  characters, as well as the Mesh two-legged ones) and opens on a real character rather than the
  fox picture (still at the end of the list, marked *not to scale*). The character is drawn at its
  game size (2.31 × its scale) with its feet on the ground line, so it compares properly with the
  player reference.
- **Asset Lab: preview a character effect on a real character.** A character effect (Dissolve)
  now has *Preview on* (the fox picture or any character drawn as a Mesh, e.g. Father),
  *Holding* (one of that character's props from Character Lab → Props) and *Pose* (standing
  still or any of its animations, played). The character is drawn from its own mesh, so the
  preview shows the dissolve on him and the prop in his hand, as in the game.
- **Props: characters can hold things.** Any asset can be held. Character Lab has a new
  **Props** stage (bipeds): add a prop, then move, turn and size it against the hand with
  the viewport pad (or type the numbers), mirror it, choose the near or far hand and where
  it is drawn among the parts; ▶ play any animation to watch it follow the hand, and
  optionally keep it shown in Animate and Play. The grip is saved with the character (so it
  publishes and backs up with it). In the Story editor a character can **hold** props from
  the start (*Holds*), and a new **Prop** step makes a character hold one, put it away or
  **drop** it (it falls and lies on the ground; Progress → Reset puts it back). In the game
  the prop follows the hand through every animation. Built so the player can later pick up
  and use items with the same grips.
- **Dissolve fixes and closer camera shots.** A dissolving character standing further back
  than the path is now covered by the scenery in front of it, as it is when not dissolving
  (the effect image is drawn at the character's own depth), and stays sharp close up. A
  Camera step's *Move back (− closer)* now goes to −20 m (was −8), so a shot can pass the
  path and frame a character further back on its own (lower *Height* too; Frame it allows
  the same range).
- **Character effects — Dissolve.** Asset Lab → **+ Add ▾ → New character effect** makes an
  effect that works on the character itself rather than a plane: the character is drawn into
  its own image, then drawn back through the effect, so it breaks apart from the feet up (or
  the head down) along a noisy edge that glows, darkens as it goes, smears upward and sheds
  flecks that rise and fade. Sliders: Dissolve (0 whole … 1 gone), From feet ↔ head, Noise
  size, Edge width / glow / colour, Darken / colour, Drift, Flecks amount / size / rise /
  colour; the Asset Lab stage previews it on the fox. Save states as before (e.g. *Half*).
  The event step is now **Effect on a character**: choose the Dissolve effect and blend through
  its states (*Gone* = fully dissolved); a character that ends fully dissolved stays hidden.
- **Camera steps: Cut and Frame it.** A Camera step now chooses **Cut to it** (instant) or
  **Move there** over N s (Back to the player: *Cut back* / *Blend back*). **📷 Frame it**
  looks through the shot in the game, on the character or mark the step looks at (through
  the sequence the event was opened from): drag to move the framing, pinch (or scroll) to
  move closer / further, *Aim* to tilt, then **Done** writes the values into the step
  (**Cancel** leaves them). The sliders stay for fine-tuning.
- **Asset Lab tidy-up for the phone:** one **+ Add ▾** button (Import image asset, New
  darkness effect; more can join it later) instead of two big buttons; the three filter
  buttons are now a **Show** dropdown with more choices (Puzzle / Environment assets,
  Imported, Effects, and every group, e.g. Trees, Cliffs, Settlement roofs); the settings
  panel is a little narrower and folds away with **Hide panel ›** to a thin rail (‹ brings it
  back; remembered on this device), so the asset view gets the room.
- **Darkness on a character (prototype).** Effects get **states** in Asset Lab (*Save as
  state*, tap to load into the sliders, *Update state*, Rename, Delete). New event step
  **Darkness / effect**: attaches an effect to a character (sized to its height, centred on
  it, in front), starts invisible and blends through a list of states with times
  (*Gone* = invisible), can hide the character N s in, and is removed when its last state is
  done. A hidden character keeps moving along a Move it was making, so the dust travels on
  after the animal has vanished. Progress → Complete leaves the character hidden.
- **Shader effects — Darkness whirlwind.** Asset Lab → **+ New effect** makes an asset
  drawn by a shader instead of an image: a dark twisting funnel of smoke with flecks
  orbiting, drifting and spinning inside. Its settings (shape, opacity, swirl speed, twist,
  rise, density, edge softness, width at base / top, turbulence, core / edge colours,
  flecks amount / speed / size / colour) are live sliders, and it is set up and placed like
  any asset (height, floor line, groups, publishing). In the game each visible copy is drawn
  every frame. Animating the settings from sequences comes next.
- **Looks:** named sets of Fog and Post values (Menu → **Looks**): *+ Save current as a new
  look*, tap a look to show it (the Fog and Post panels then edit that look; their headers
  say which), Rename, Delete, and **Base look** (the world's normal Fog / Post settings).
  New event step **Look**: changes the world to a look (or back to base), blended over N s;
  it stays until another Look step changes it and is kept when the game is reopened
  (story progress). Reset story, and Progress → Reset on the sequence that set it, return
  to base. More controls (grading, vignette, bloom) can be added to looks later.
- **Environment: find things in the scene.** The Select Filter chips wrap onto several
  lines (no sideways sliding), **Thought Nodes** and **Camera Nodes** are filters of their
  own, and the filter now narrows the Placed World Assets list too. A **search box** above
  the list matches names, groups and what thoughts say; thought rows show their text. A
  search also finds things **inside puzzles** (listed under *Inside puzzles*): tapping one
  opens that puzzle for editing with it selected, and a node's settings open.
- **Edit a thought or camera node inside a World Group with one tap:** tapping it in the
  game editor opens the group for editing with that node selected and its settings
  (text, radius, one shot) open, instead of only selecting the group. It saves with the
  group as usual. The node editor now says whether the node belongs to a puzzle, a group or
  the scene.
- **The editor opens at the player start** (World Lab → START), facing its way, unless
  World Lab sent it somewhere else.
- **Plan written** for loading only nearby textures and GPU-compressed (KTX2 / Basis)
  textures: `docs/TEXTURE_COMPRESSION_PLAN.md` (in TASKS → Later).
- **Replace Art handles a new shape:** if the new PNG's proportions differ (image
  generators often change the canvas size), every placed copy — in the scene, puzzles,
  world groups and templates — keeps its height and takes the new width, and its
  collision narrows or widens with it. A different pixel size with the same shape changes
  nothing (sizes are in metres). Asset Lab says how many copies it reshaped.
- **World Lab: Sequences track.** Every placed story sequence shows as a bar over the
  stretch it covers (its components and zones). Tap it for its details (components with
  their positions, logic lines, flags it reads and sets) and an Anchor X box; tap again and
  drag to move the whole sequence (Undo works). Characters your play progress has already
  moved go with it. *Open in game* and *Move playhead here* as for puzzles.
- **Player start (World Lab → START flag):** where a new game, or Delete save, begins
  (position and facing). Drag it, type a position or use *Set to the playhead*. Built-in
  content (World area), so it publishes with the World area.
- **Asset Lab: Texture section** for every asset: file, pixel size, aspect, size in the
  game at its height, pixels per metre (with what the existing art uses for comparison),
  memory once loaded, file size and where it comes from.
- **World Lab shows imported assets by their name** (not their internal id).
- **Fix:** the game could stop at start-up with a placed imported asset whose floor line
  was never set in Asset Lab.
- **Asset Lab: + Import asset.** Pick a PNG (with its transparency already done) and it
  becomes a game asset: give it a name, a library (Environment / Puzzle), a group heading
  and a kind (scenery at any depth, or gameplay on the path), then set its height, floor
  line, collision and behaviour with Asset Lab's usual controls. It appears in the game
  editor's asset list straight away on that phone. **Replace Art** swaps the picture and
  keeps the setup; **Delete Asset** is refused while a copy is placed. The art is used
  exactly as imported (no clean-up). **Publishing:** Publish Lab's **Assets** area now
  carries the imported art; the publish Action writes it to `assets/asset-…-<hash>.png`
  so every device gets it (changed art gets a new file name, so it is never stale).
- **⚑ Progress window restyled** to match the editor's other menus: light text, the
  editor's own buttons (capitals, soft fill), each row a card with its name and status on
  top and Go / Complete / Reset across the width; done rows have a green edge and status.
- **⚑ Progress (TEST bar):** opens the right-hand window listing every puzzle and
  sequence in journey order, each with its state and **Go** / **Complete** / **Reset**,
  plus the story flags (tap to set / clear) and **Complete all** / **Reset all**.
  Completing a puzzle applies its Solved State, marks it solved and gives its reward;
  resetting returns it to its Start State and removes its items. Completing a sequence
  runs its lines' end results at once (moves land, flags, items, Show / Hide); resetting
  undoes them, removing items it gave and returning ones it took. Reset story now resets
  each sequence this way.
- **Puzzle Set Solved State:** the Puzzle editor can store a puzzle's solved layout
  (*Set Solved State*, next to Start State), used by ⚑ Progress → Complete.
- **Event step Item:** gives the player an item (with a count) or takes one.
- **Story editor:** the editor tab is now **Story** (Sequences and Events inside it).
  Pick-lists (+ Character, + Add step, + Place a template, Change character) open in
  the asset browser's window on the right, like adding assets. A character component
  can be **swapped** (Character → **Change…**): its place, animation and logic stay, and
  its name follows if it hadn't been renamed.
- **Sequences editor:** an event's **+ Add step** sits after the last step again (steps
  are added one after another), the one exception to add buttons at the top.
- **Sequences editor tidy-up (one pattern):** a small **‹ Back** at the top left of each
  inner page (returns to where you came from) with the page's name beside it; each
  section's add buttons pinned at its top at equal widths (Components: + Character,
  + Mark, + Zone; Logic: + Add line; Placeholders; Steps: + Add step; lists: + New
  sequence, + Place a template, + New event); **+ Character**, **+ Add step** and
  **+ Place a template** open a choose-from-a-list box; rows have a small **×** on the
  right instead of Remove buttons; new items scroll into view. Recorded in the UX bible.
- **Sequences: Wait for Action, leaving a zone, kept camera.** New step **Wait for
  Action**: the event pauses until the player presses Action — even while control is
  taken — and the button lights up with its label (*Talk*), above the letterbox. New
  logic **When the player leaves a zone** (her whole body out of it). A Camera shot can
  **Keep after the event**, until a later *Back to the player* step (e.g. on a leave line).
- **Sequence Camera and Screen steps.** *Camera → Frame a shot*: look at a placeholder
  (a mark placed where the shot centres, or a character) or the player, with *Shift
  along the journey*, *Raise*, *Move back* and *Aim up*, moving there over N s
  (Smooth / Steady) and holding; *Back to the player* blends home. *Screen*: fade to /
  from black, letterbox bars in / out. When the event ends the camera blends back,
  fades and bars clear, and control returns, so nothing is left stuck. The on-screen
  controls dim while a sequence holds control.
- **Carried object collision follows the character's hands:** the carried log's
  collision box, drop point and resting position now use each biped's own standing
  carry pose (`carryHold()`), the same hands the drawn log follows, instead of a fixed
  0.64 m / 0.48 m set for the original characters. Character01's box sits on the log
  she holds (0.91 m), so she can walk up to a log on the floor; Aureli's is 0.77 m.
- **Sequences editor clearer:** an event's roles are now **Placeholders** (with hint
  text: "Name it, e.g. Exit"), steps ask for a "character / mark placeholder", and a
  logic line says **Fill in the event's placeholders** with "Choose this sequence's
  mark…". A logic line's *Run event* list has **+ New event…**, which makes the event
  and opens it with *‹ Back to* the sequence. Fixed: reopening the editor could land
  in Environment scrolled down; it now reopens on Sequences (or Puzzle) at the top.
- **Sequences and events (steps 1–2 of `docs/SEQUENCE_SYSTEM_DESIGN.md`).** The game
  editor's **Sequences** scope (was Story) has two lists. **Events**: reusable chains
  of steps — Move, Animate, Face, Say, Think, Wait, Flag, Show / Hide, Control —
  written with roles (Actor, Exit); a step runs after the previous one or with it;
  animations are action slots, so each character plays its own. **Sequences**:
  placed like puzzles (an anchor post; unique, or a template placed as instances),
  with components (library characters, marks, zones) and logic lines *When* (starts /
  walks into a zone / presses Action / another line finishes / a flag is set) → *run
  event* with its roles filled, *Only if* a flag, once or every time. Control steps
  pause the player (always given back when the event ends). ▶ Play from here and
  Test now on a line. New `sequence-data.js` / `sequence-editor.js`; content keys
  `sidescroll.story.events.v1` and `sidescroll.story.sequences.v1` (Story area),
  progress `sidescroll.player.story-progress.v2`. The 8–9 Nov world characters /
  marks / triggers (`story-world.js`, `story-editor.js` and their keys) are retired.
- **Sequence system design** (`docs/SEQUENCE_SYSTEM_DESIGN.md`, agreed 10 Nov):
  sequences placed like puzzles, built from components and a logic list of *When →
  run event* lines, with a game-wide events library using roles (steps include taking
  and giving back control; random character picks per run). Retires the story
  authoring model of 8–9 Nov; replaces the story stages in `TASKS.md`.
- **Story: characters and triggers connected.** A world character's panel has *When
  the player reaches a trigger*: every trigger reaction aimed at it, editable there
  (mark, animation…), and *+ Add* to an existing trigger or a new trigger placed
  just before it. A route set to start *From a trigger* shows which trigger starts
  it, or warns that none does with a one-tap fix. Triggers list their reactions as
  clear buttons (*+ Character walks to a mark*, *+ Character starts its route*, …)
  instead of a menu plus *+ Add*.
- **Editor TEST bar and Play in the editor:** a TEST bar at the top right in every
  editor scope: **▶ Play / ■ Stop** runs the game in place (the editor, guides and
  zones stay; the drawer folds to its rail; game controls, physics, triggers,
  Action and blocking work), **↺ Restart** returns the player to where Play began
  with story progress reset, **Reset story** resets story progress. A trigger's
  *Test as player* (which left the editor) became **Play from before it**. Triggers
  now fire when the player's body touches the zone. Fixed: reopening the editor
  could show the drawer scrolled down with the scope buttons out of view.
- **Story triggers — testing:** each trigger has **Test as player** (resets story
  progress, puts the player 2.5 m before the zone and leaves the editor, so you walk
  in as a new player would). **Fire now** no longer uses up a once-only trigger.
  Done Editing asks to save unsaved Story changes.
- **Story stage 2a — triggers and story flags** (`docs/SEQUENCE_SYSTEM_DESIGN.md`): a
  **Triggers** tab in the Story scope. A trigger is a zone along the path that fires
  when the player walks in or presses Action in it (the button reads its label, e.g.
  TALK), once per player or every time, optionally only while a story flag is / isn't
  set. Its reactions run after their own delays: play an animation once, switch a
  character's animation, start its route, walk to a mark, turn to face the player,
  say a line (a subtitle strip with the speaker's name) and set / clear a flag. World
  characters can be *Shown* only while a flag is / isn't set, and routes can start
  *From a trigger*. Flags, fired triggers and lasting changes to characters are play
  progress (`sidescroll.player.story-progress.v1`, cleared by Delete save and the
  editor's **Reset story progress**); triggers are content
  (`sidescroll.story.triggers.v1`, Story area). *Fire now* tests a trigger in the editor.
- **Story stage 1 — world characters and marks** (`docs/SEQUENCE_SYSTEM_DESIGN.md`): a
  **Story** scope in the game editor places any character in the world at any depth,
  looping one of its animations (speed, start offset, size, facing), and builds
  routes of moves between named **marks** (walk / run / any animation, at walking
  speed or *arrives after N s*, then wait, face, and an animation while there;
  repeat; start when play starts or when the player comes near), with a timeline of
  the route. Characters on the path block the player (Auto / Always / Never; no
  walking or jumping past). New `story-world.js` (data and route maths) and
  `story-editor.js` (panel); new content keys `sidescroll.story.world-characters.v1`
  and `sidescroll.story.marks.v1` publish as the Publish Lab **Story** area. The
  game's character drawing now takes a position, so the same code draws the player
  and world characters; `character-game-runtime.js` gives any animation of a
  character (`clipFor`, `slotAnimation`, `animationsFor`).
- **Story sequences design** (`docs/SEQUENCE_SYSTEM_DESIGN.md`, agreed 8 Nov): world
  characters, marks and moves, sequence timelines, triggers, story flags and World Lab
  story tracks, with a build order.
- **Automatic publishing:** upload a Publish Lab package (or a character export /
  Project Backup) into the repo's `publish/` folder on github.com; the *Publish
  uploaded package* Action (`.github/workflows/publish.yml`) bakes it with
  `tools/bake_project.py`, removes the uploaded file and opens a pull request. Merge
  it as usual. See `publish/README.md` (one-off repo setting there).
- Retired `baked-game-design.js` (an old export the game and World Lab fell back to;
  every key it covered is in the built-in content) and World Lab's *Export Complete
  Game* (Project Backup and the Publish Lab replace it; *Import older Complete Game
  file* still restores old files). Puzzle Lab's test stage no longer starts with the
  old main-world scene edits from that file.
- Puzzle Lab / Asset Lab data exports take their key lists from
  `storage-catalogue.json` (by area) as well as the old name patterns, so new keys
  are included (e.g. the collectibles setup now travels with Puzzle data).
- Skin → **Pin to body** now runs along the limb's own bones instead of a circle:
  **Strength at the top** (the hip / shoulder), **Fade along limb** (% of the part's
  bone chain over which the body share fades out) and **Curve** (gentle … linear …
  sharp). A red band on the bones shows it, ending with a dot where the fade ends.
  Pins saved with the 7 Nov radius read as the same distance along the limb.
- Character Lab → Skin → **Pin to body** (per part): the top of a limb also follows a
  body bone, so a thigh or upper arm stays attached at the hip / shoulder instead of
  swinging rigidly with the limb. Choose the bone (Lower Back is suggested for legs,
  Upper Back for arms), **strength** at the joint and **reach** down the part; a red
  ring shows the reach. Works with joint lines, rectangles and envelopes; points
  set by hand are left as set; Copy to the other side carries it. Baked into the
  part's weights, so the game draws it with no change. Tip: the more mesh points
  near the top of a limb, the smoother the pin.
- Puzzle Lab: **Run Test starts at the puzzle's left edge** — the test copy now uses
  the bounds of the template it was launched with (it fell back to the puzzle's
  original default width, so templates started the player in the wrong place).
- Puzzle Lab: **Delete puzzle** for library puzzles (refused while the puzzle is placed
  in the world, saying where), **Hide** for built-in puzzles (saved in the library as
  `hiddenBuiltIns`, so it publishes), and *Show hidden*. The *Puzzle marker* section
  is renamed *Puzzle position in the test stage* and explains itself.
- Removed the original built-in *Stone Wall* and *Fallen tree test* puzzles and their
  code placements: the project's library/templates carry the versions in the world,
  and the built-in Stone Wall could reappear beside a renamed template.
- **Default player** (Character Lab → Settings → Roles): the character a new game
  starts with — library characters (e.g. Character01) included — and the character
  Character Lab opens on (unless that session was already editing one). Moving the
  role also clears this device's own game choice so your next game starts with it;
  players elsewhere keep a character they picked. Publish it with the Publish Lab's
  new **Character roles & categories** row for it to reach everyone (roles and
  categories travelled with neither character files nor any area before).
- Fixed: picking a library character in the game was forgotten on the next launch
  (start-up saved the built-in character over it before library characters had
  loaded), and a library Default player only applied to a new player's first launch.
- **Performance:** every wrapped grass/rock/tree re-measured the terrain height under
  it twice per frame (its home spot and where it's drawn), plus twice more for slope
  tilt, which made terrain lookups the biggest per-frame cost and grew with every item
  (so denser near-side rows slowed the game). In play these are now kept per item and
  drawn position until the terrain changes (not cached while editing). Asset behaviour
  settings are likewise kept instead of re-merged for every item every frame.
  Measured (4× CPU throttle): rows off 185 → 162 ms/frame, default rows 189 → 154,
  dense rows (0.4 m spacing) 258 → 199; the picture is pixel-identical.
- **Near-side rows** (game editor → Environment → *Near-side rows*): a woodland biome
  profile can replace the scattered grass/rocks between the camera and the path with
  three rows (Edge, Middle, Outer) that follow the path. Each row: on/off, **depth**
  from the path ± spread, **scale** ± amount, **spacing** ± amount, and which ground
  textures it uses (thumbnails). Changes rebuild the near side live; **Save rows**
  stores them in the biome profile (`sidescroll.biomes.v1`, World content, so it
  publishes and blends at profile transitions), **Revert** goes back. Profiles that
  never use rows keep today's scatter. World Lab keeps the rows when it saves.
- Quick Play controls are half the height (Jump / Pick up and the move pad), giving
  the space back to the view.
- Character Lab → Quick Play controls laid out like the game: **Jump** and **Pick up**
  bottom-left, a wider move pad bottom-right. Jump / Pick up act on touch-down, so
  they work while the other thumb holds the move pad (taps were lost before because
  iOS drops clicks while another finger is down). Quick Play's view sits a little
  higher and smaller so the character, boxes and markers stay clear of the controls.
- Character Lab → Display → **Centre** (on by default): a dashed vertical line and
  ◆ *Centre* at the character's origin (where the game places it and centres its
  collider), and an amber ▲ *Body ±x* under the body whenever the body is off it.
- Animate → Key Pose Tools → **Centre body** (bipeds): moves the whole animation
  (body and both feet together, so every pose is unchanged) so the body sits over
  the centre on average (*Keep sway*), or exactly on every key (*Remove sway*).
  Character01's animations had the body 10–13 cm forward of her centre (Body / Root
  left–right), so in the game she was drawn ahead of her collider.
- Character Lab → Quick Play: the test boxes use the character's own **collider**
  (Rig → Collider, sized as the game sizes it: × 2.31 × scale) for where it stops
  against a box, its height, step-up and reach; *Add box* places the box 0.8 m clear
  of the collider.
- Collider **Height** can go higher: up to 2.00 for bipeds (was 1.15) and 1.20 for
  quadrupeds (was 0.72), so the capsule can cover a tall character's head. Saved
  colliders are unchanged.
- Animate → Jump: the character's own floor on each frame (where a foot at lift 0
  sits, lifted by the game's jump arc) is now a clear amber line labelled with its
  height in game metres, with a faint line at the top of the jump (the Jump height).
  It was drawn at 18% opacity before. Quick Play shows the same floor line whenever
  the character is off the ground (jumping, or standing on a box).
- **Character Lab → Quick Play → Test box:** a box the game's size (0.96 × 0.68 m,
  one stack layer) to try gameplay with a character's animations. **Add box** /
  **Stack box** / **Clear**; walk into it (it blocks), jump onto it, walk off it
  (she falls), and **Pick up** / **Put down** on the pad (or E): it is carried with
  the game's carry pose at her hands and put down in front, stacking on a column
  there. **Held item drawn** chooses where a held item sits among the character's
  parts (Auto = behind the near arm, in front, behind, or behind any one part);
  it is saved with the character and the game uses it too.
- The carry pose and the held-item draw-order rule now live in `biped-rig.js`
  (`carryPose`, `heldItemIndex`), shared by the game and Quick Play. Quick Play
  also keeps feet above the real ground, as the game does.
- Fixed (game, mesh characters such as Character01): a carried log sat at a fixed
  spot in front of the whole character, covering both arms. It now follows the
  hands (as with the original characters) and is drawn between the body and the
  near arm, so the near arm wraps round the front.
- Fixed (game): landing early on something higher than the take-off point (a log)
  showed the Jump animation's reach-down frames with the feet inside it for a
  moment. Feet keyed below the floor now go no lower than the ground actually
  under the character.
- **Performance:** the game re-read and re-parsed the whole character library
  (130 KB+, every library character's animations) about 19 times a frame, just to
  look up names and families: ~2.5 MB of JSON per frame, growing as characters
  were added. The character registry now keeps its parsed list until the saved
  data changes, and the game parses the character setup only when it changes
  (per-frame parsing ~2.5 MB → ~8 KB). Affects every character and every Lab
  that lists characters.
- **Published** (first Publish Lab package, 4 Nov): Puzzles area, Aureli (Hero 1, with
  the shared hero animations), Fox, Character01 and Character02 with their artwork.
- **Full backup:** Project Backup now includes every character artwork image
  imported in Character Lab, so one file holds everything on the phone. Import
  checks each image (SHA-256), lists *Character artwork* as its own area (merge
  adds missing images, restore overwrites), includes artwork in the safety backup
  and rolls back on failure. Backups made before this still import (artwork left
  as it is).
- **Publish Lab** (menu → Publish Lab, new page): every game-content area (World,
  Puzzles, Puzzle Lab, Assets, Character templates & actions, Design) and every
  character shows **Published / Changed / New** compared with the game everyone
  plays. Changed and new items are ticked; **Prepare package** makes one
  `SS-PUBLISH-….json` with the ticked areas and characters (imported artwork
  included) for `tools/bake_project.py`. **Use published** throws away this phone's
  changes to one area or character. **My settings** exports/imports your own
  settings (never published). Artwork already published reads as Published once its
  picture on the phone matches the published file.
- `tools/bake_project.py` accepts publish packages: builds in only the areas and
  characters in the package (Design also rewrites `design-doc.json`).
- **Jump timing** (Animate → Key Pose Tools, shown on the Jump animation): **Lift-off
  here** / **Landing here** / Reset. Frames before lift-off play on the ground
  (crouch / anticipation), the jump arc runs from lift-off to landing, frames after
  landing play on the ground (landing / recovery; cut short if you walk off). Every
  frame lasts the same time, set by the Jump height. The Animate preview lifts the
  character only between those frames, and the timeline marks them. Defaults (frame
  1, end) keep the original instant jump.
- **Jump height per character** (Character Lab → Quick Play, 0.3–2.5 m; default 1.49 m =
  the original jump). The game launches the jump to reach that height (gravity, and
  so falling, unchanged) and plays the Jump animation over the actual time in the air.
- Fixed: Animate's Jump preview lifted the character along its own 0.40 arc, while the
  game lifted it by the real jump (≈60% higher on a scale-1 biped), so a jump that
  looked right in Animate floated in play. The preview now uses the exact game arc
  for the character's Jump height and scale.
- Bipeds ease between standing, moving and jumping in the game and Quick Play (a
  0.22 s cross-fade when starting or stopping, 0.15 s on take-off and landing), so
  stopping a run or starting a walk no longer flicks to the new pose. Walk ↔ run keeps
  its existing blend.
- Animate (bipeds): foot height can go **below the character's floor** (−60 to +60 cm;
  it stopped at 0). In Jump, Animate lifts the whole character along the preview jump
  arc, so feet were stuck at that raised level; now they can reach the real ground and
  below (leg length still limits reach).
- Animate (bipeds): **Ground Motion** — the moving floor the Fox had, now for bipeds,
  with denser markers (a tick every 2.5 cm, a taller one every 10 cm). It scrolls at the
  speed Quick Play walks or runs (Walk / Run speed × cycle time), during playback and
  frame by frame, so a planted foot should stay over one marker; on/off and a ×0.5–1.5
  display speed in the Ground Motion section.
- Animate (bipeds): Key Pose Tools → **Copy a limb to the other side** — Legs / Arms,
  Near → Far or Far → Near, **half a cycle later** (the opposite step of a walk or run)
  or same timing. Copies that limb's keyed controls (foot position, height, angle, toe
  bend; or hand position and angle), replacing the other side's; nothing else changes.
- Animate (bipeds): **Neck** and **Head** controls (new neck bend and head tilt
  channels). Neck turns the neck and everything above it about the chest; Head tilts
  the head about the top of the neck; the hair turns with the head. At 0 every pose is
  unchanged.
- Animate (bipeds): Foot contact **Off** (Key Pose Tools, per clip) — no foot is ever
  pinned to the floor, so feet move and rotate freely and the pelvis isn't held by leg
  reach. From keys (Planted foot per frame) and Automatic remain.
- Animate (bipeds): **Foot contact: Automatic** (Key Pose Tools, per clip): a foot is
  planted while its lowest point touches the floor, so a foot with few keys follows
  its smooth curve instead of snapping down where a keyed contact starts. From keys
  (the default) is unchanged.
- Biped **toes**: a Ball joint in each foot (on the sole, 70% heel → toe on rigs
  saved before), Sole and Toes bones for Skin, and Near / Far Toes in Animate (toe
  bend). The one-piece foot bones stay as Whole Foot for older skins; no bend = poses
  unchanged.
- Animate: **Motion Path** moved to the Display section. Simplify keys and Foot
  contact buttons styled like the other tools.
- Fixed: a skin bound before the Spine joint (or now the Ball joints) would have lost
  its Whole Back / foot bone the first time it was edited; older skins now always keep
  the bones their saved shape describes.
- Character Lab draws mesh artwork (skinned parts, the Fox) with **WebGL** like the
  game, instead of one clipped Canvas triangle at a time, which Safari renders very
  slowly — the cause of the poor Animate / Quick Play frame rate (worse with Blend
  at joints), which also made Smooth look no smoother. Same picture (minus the
  Canvas method's faint triangle seams). Display → **GPU mesh** switches back to
  the old method; it is also used automatically if WebGL isn't available. A
  readout under Display shows which method drew the mesh and how long it took.
- Animate (bipeds): wider control ranges — hands from well above the head to below
  the hips (they stopped at chest height), feet lift 60 cm, lean and spine ±60°, root
  ±50 cm and 0.15–1.2 m high, hand angle ±120°, hair wider. Arm and leg length still
  limit reach.
- Fixed: the selected control's handle used the default biped's proportions, so on
  another character it sat in the wrong place (the "root dot stuck at a fixed
  height"); it now follows the character's own rig.
- Animate (bipeds): **Planted foot** (Near / Far / Neither) from the current frame on
  the Root and Foot controls — a planted foot stops the pelvis rising above that
  leg's reach; Neither frees it.
- Animate: **Motion path** for the selected control: its path over the whole clip,
  with the frames where it is keyed marked.
- Fixed: in Character Lab, playback and Quick Play of a biped clip with per-control
  keys or Smooth tweening jumped from frame to frame (the position was rounded to
  whole frames), so Smooth looked no different; they now play every in-between.
  The sampler prepares each clip once instead of rebuilding every key per sample
  (about 20× faster), so Smooth no longer costs frame rate.
- Animate (bipeds): **keys per control.** A key can hold just some controls; an
  edit now keys only the controls you changed, and each control moves between its
  own keys. The control panel shows the frames the selected control is keyed on
  (bright dots on the timeline) with **Delete key here** and **Keep only this key**
  (holds the control still for the whole clip). Key Pose Tools → **Simplify keys**
  turns a key-on-every-frame clip into the few keys each control needs (motion kept
  within 1.5 mm / 0.6°, foot contacts kept). Older clips play exactly as before.
- Animate (bipeds): the Root control moves **left/right** as well as up/down (new
  root X), with a wider height range; **Smooth** tweening now sticks for bipeds
  (it was reset to Linear on load) and the game plays it too.
- Skin: **Copy to the other side** (same layout as the Rig Designer's): Selected part
  → any part, plus Arms / Legs / All limbs, Near → Far or Far → Near. Bones switch
  side, joint lines, blend and shape settings come along, and the weights are worked
  out again on the partner's own mesh (per-point edits too when both parts share a
  mesh). Partners are found by name (NearArm ↔ FarArm, LegNear ↔ LegFar); the message
  says if any points end up uncovered.
- Skin: **choose any bones for a part.** *Bones this part follows* lists every bone
  of the rig under its group; tap to add or remove, start from a *Preset* (the old
  groups), then **Bind to these bones** (e.g. a head mesh on Neck + Head only, a
  body on the back bones only). A new binding's joint lines are fitted to the part,
  so it covers the whole part instead of a narrow strip along the bones.
- Skin: **Blend at joints** (0–12 cm) shares points near each joint line between
  its two bones, easing from one to the other, so artwork bends smoothly instead of
  hinging (joint-boundary bindings; the game already blends shared points).
- Biped **spine**: a Spine joint (halfway between Pelvis and Chest on rigs saved
  before) with **Lower Back** and **Upper Back** bones, and **Spine Bend** in
  Animate (bends the upper body above the spine). The old pelvis-to-chest bone is
  kept as **Whole Back**, so skins bound before still use it; with no spine bend
  everything moves exactly as before (heroes checked frame by frame; a skin bound
  before draws pixel-identical).
- Skin: binding a part by hand is clear again. *Auto-bind part* is renamed **Bind to
  group** (it always bound to the group chosen in Bone group), and the bone list
  plus **Bind whole part to selected bone** (was "Rigid bind") now work on a part
  that isn't bound yet, or bound to another group — choose a group, pick a bone,
  bind. Choosing another group only previews its bones until you bind.
- Fixed: a second "ghost" knee (or elbow) next to the joint in Rig on a nearly
  straight leg or arm, jumping about as the joint moved. The skeleton never let a
  limb straighten fully, forcing a ~1–1.5 cm bend that flipped front/back as the
  knee crossed the hip–ankle line. The rest pose (Rig, Skin binding) now lets a
  limb straighten, so every joint sits exactly on the rig; animation keeps its soft
  bend at full reach, so the heroes' walk, run and jump are unchanged (checked
  frame by frame). A biped skin bound on a straight leg follows the corrected
  knee, a difference of about 1 cm.
- Rig Designer: the copy buttons are now one clear *Copy to the other side* box —
  Selected joint / Selected limb (labelled with what they copy), then Arms, Legs
  (Fox: Front legs, Rear legs) and All limbs, each Near → Far or Far → Near.
  Previously "Both Legs" actually copied arms too, and Copy Segment is gone. The
  biped's leg now includes the Heel joint. Choosing a joint by its button also
  highlights it in the viewport straight away.
- Biped hands: the arm now runs shoulder → elbow → wrist → **hand**. Rig has a
  Hand joint per side (placed straight on from the forearm on rigs saved before);
  the hand keeps its rest angle to the forearm and Animate's Near/Far Hand control
  can turn it (new *hand angle* channel, mirrored with the other side; older clips
  keep the hand straight). Skin can weight artwork to the new Near/Far Hand bones.
  Existing joints, skins and the heroes' animation are unchanged (checked frame by
  frame, and a skin bound before the change draws pixel-identical).
- Removed test screenshots (`undefined/`) committed by mistake with PR #29.
- Fixed: on a biped whose rig leans, is offset or has bent arms/legs, the animated
  skeleton only took bone *lengths* from the rig: it stood the spine straight up and
  re-solved elbows/knees with a fixed bend, so moving a shoulder swung the arms the
  other way and moving one elbow moved bones elsewhere. It now follows the rig's
  directions, pelvis position and bend sides, so at rest it sits exactly on the
  rig's joints. The default (straight) rig is unchanged, so Hero 1 and Hero 2 look
  and animate exactly as before (checked frame by frame).
- Rig Designer: where near and far joints sit on top of each other, a tap now keeps
  the selected joint, otherwise takes the near one (it used to grab the far one);
  tapping again without dragging switches to the next joint there. Viewport labels
  say which side (e.g. "Elbow · far").
- Character Lab: far limbs are now lavender (near stays teal) in the viewport bones,
  the Rig Designer and the joint buttons; *Near side* / *Far side* switches (Display
  panel, and at the top of the Rig Designer) hide a side's bones and joints so they
  can't be tapped. View only; both sides show again whenever Character Lab opens.
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
