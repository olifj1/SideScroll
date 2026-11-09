# Story sequences — design (agreed 8 Nov 2026)

Goal: drop short pieces of story between gameplay — an opening camera move that
lands on Aureli and hands control over, the father chopping wood as she walks out,
a scene that plays when she reaches a place — authored on the phone, with no code
per scene, and seamless in and out of play.

This builds on what exists: the game camera (follows the player along the path; a
tuned height, distance and tilt), characters that play any Character Lab animation,
action slots (Walk, Run, …), thought triggers and thought bubbles, fog. It is the
same idea as the character system: a few data pieces, authored in the editor, read
by the game.

**Decisions (8 Nov):** author in the game editor; side-on camera only (no angled
shots); dialogue is a speech bubble, a version of the thought bubble that looks
different and closer to a subtitle (agreed 8 Nov); every sequence can be skipped; world
characters can stand at any depth and block the player when they're on the path,
with blocking switchable per character; triggers can change what an existing
character is doing; World Lab shows triggers and other placed story items along the
journey with their details; characters move between marks with an animation tagged
for the move (start at A at 0 s, walk to B by 60 s).

---

## 1. The pieces

### 1.1 World characters (actors placed in the world)
A character placed at a spot in the world, independent of the player:
- **character** (any character from the registry), **position** (x along the
  journey, **depth** — on the path or anywhere in front of / behind it — facing),
  **scale** (default its own);
- **behaviour**: what it does when nothing else is directing it (§1.3) — loop an
  animation (chop wood, idle, sweep) with a speed and a start offset so two villagers
  don't move in step, or walk a route of marks;
- **blocks the player**: *Auto* (blocks when it stands within the path band, using its
  own collider, like a solid object; doesn't when it's off the path), *Always* or
  *Never* — so a character standing in the way can be walked through when a scene
  needs it;
- **visible when**: always, or only while a story flag is / isn't set (the father is
  chopping wood until the Darkness, gone after).

The game draws them like the player (same mesh or parts drawing, same held-item
rules, same depth sorting as scenery), and only loads a character's art when a world
character or sequence needs it.

### 1.2 Marks and moves
A **mark** is a named spot in the world (x, depth, facing) — *Father's block*,
*Gate*, *Doorway*. Marks are placed in the editor and listed in World Lab; anything
that moves a character refers to marks, so moving a mark moves every route through it.

A **move** takes a character from one mark to another:
- **from / to** marks (from = wherever it stands, by default);
- **timing**: *arrive at* a time (start at A at 0 s, reach B at 60 s — the speed
  follows from the distance) or *at speed* (its normal walk speed);
- **animation**: an action slot or animation tagged for the move — Walk by default,
  Run, Sneak, Carry… The animation plays at a rate matched to the speed so the feet
  don't slide (as the game already does for the player);
- **on arrival**: face a direction, then play an animation (loop or once) or hold.

The same move is used everywhere: in a world character's route (behaviour), in a
trigger's reaction (§1.4) and as a clip on a sequence's actor track (§1.3).

### 1.3 Sequences (timelines)
A named timeline of a few seconds to a couple of minutes. Tracks:

| Track | Keys / clips |
|---|---|
| **Camera** | Side-on shots: position along the path (world x), height, distance, tilt, field of view; each key has an ease (linear, ease in/out, hold). A key can be *relative to an actor* (frame Aureli wherever she stands). The last key can be **Gameplay camera**: blend back into the normal follow camera. |
| **Actors** | One row per actor (the player or any character): **move** clips (§1.2, drawn as a bar from start time to arrival), face, play an animation for a time or once, appear / disappear. The player is just another actor while a sequence runs. |
| **Look** | Fog colour and amount, colour grade (tint, brightness, saturation), vignette, fade to / from black — keyed and eased like the camera. |
| **Screen** | Hide / show the controls, letterbox bars in / out, **speech bubbles** (attached to an actor, with text and timing) and thought bubbles. |
| **Events** | At a time: set / clear a story flag, show / hide an object or world character, change a world character's behaviour, start / finish a puzzle state, play a sound (later), start another sequence. |

A sequence ends either by **handing back** (camera blends to gameplay over ~1 s,
controls fade in, the player stands where the sequence left her) or by leading
straight into another sequence. World characters the sequence moved stay where it
left them, doing what it last told them to.

### 1.4 Triggers (what starts something)
Placed in the world (shown in the editor like thought triggers, and in World Lab):
- **New game** — fires once on a fresh start (the opening);
- **Enter area** — the player walks into a zone (x range, optional depth);
- **Action** — the player presses Action near a spot, object or character;
- **After** — a story flag is set or a puzzle is solved (e.g. a short reveal when the
  Stone Wall opens).

A trigger does one or more **reactions**, in order or together:
- **play a sequence** (the player loses control until it hands back);
- **direct a character** without taking control: make an existing world character
  react — play an animation once (looks up, waves) then go back to what it was doing,
  switch to a new behaviour (stop chopping, sit down), make a move to a mark, turn to
  face the player — and optionally show a speech bubble. The player keeps playing;
- **set / clear a flag**, show / hide an object.

Each trigger: **once** (default) or **every time**, an optional *only if* flag
condition, and an optional delay.

### 1.5 Story flags
A small saved list of facts — `intro-seen`, `met-father`, `darkness-came` — set by
sequence events, triggers (and later puzzle logic), read by triggers and world
characters. Saved with play progress (each player has their own), so a sequence
doesn't replay after a reload and the world remembers what has happened.

---

## 2. How it fits with what's planned
- **Puzzle logic** (in `TASKS.md` → Later) is *Event → Conditions → Actions*. Triggers
  are events, flags are conditions, and reactions are actions. Build both on one small
  model so puzzles and story share it (solving a puzzle can play a sequence; a
  sequence can open a route).
- **Actions and action paths (C5/C6)** stay later: sequences only need *play this
  animation* and *move between marks*, which characters already support. Moves name
  action slots, so a new slot (Sneak) works in moves as soon as a character has an
  animation for it.
- **Atmosphere**: the *Look* settings can also be placed as **atmosphere zones**
  (the muted, misty "after" forest) that blend as you walk in — the same values, so
  the post-process layer serves both.

---

## 3. Authoring (phone-first)

### 3.1 In the game editor — a **Story** scope
Next to Environment / Terrain / Puzzle; shots are composed in the real world with the
real camera and characters:
- **World characters**: *Add character* → pick → place with a tap (depth by drag or
  slider) → behaviour, speed, facing, blocks the player, visible-when.
- **Marks**: *Add mark* at the tap point; name, facing; drag to move.
- **Sequences**: a list (new, rename, duplicate, delete); opening one shows a
  **timeline dock** at the bottom (like Character Lab's: scrub bar, play / pause,
  the tracks as rows). *Key camera here* stores the current view (flown with the
  existing camera controls); tapping a key edits it (ease, hold, relative to).
  *Add move* on an actor row: pick the to-mark and the animation, drag the bar's end
  to set the arrival time. **Preview** plays it in place; **Play from start** runs it
  as the player would see it.
- **Triggers**: *Add trigger* → type → place / size the zone → reactions → once /
  every time, only-if flag.

Saving uses the editor's normal Save / Discard (an edit session like world groups).

### 3.2 In World Lab — **story tracks** along the journey
World Lab already lays out the journey by world position. Under it, a set of
**tracks** (rows that share its x axis and zoom), each switchable on / off:
- **Triggers** — each a block spanning its zone (a tick for point triggers), labelled
  with its type and what it does (*Enter area → Intro pan*, *Action → Father waves*);
- **Characters** — world characters at their x, with their routes drawn as lines
  between marks;
- **Marks**, **Sequences** (where each is triggered, and the x range its camera
  covers), and the things already placed by world position: thought triggers,
  puzzles, atmosphere zones (stage 4).

Tapping an item opens its **details** (type, zone, reactions, conditions, once / every
time, flags it sets and reads) without going into the game; small edits (rename, move
the zone, change once / every time, change a reaction's sequence) are made there.
A **list view** shows the same items in journey order as a table, and *Open in game*
jumps the editor to that spot. World Lab and the game editor edit the same stored
data (no copies); the composing of shots and moves stays in the game editor.

---

## 4. Running it in the game
- While a sequence runs the player's input is ignored except **Skip**: shown after a
  moment on every sequence (hold to skip, so a stray tap doesn't), and at once while
  editing. Skipping jumps to the end state: flags set, characters at their final
  marks and behaviours, camera handed back.
- **Hand-back**: the camera eases from its last key into the follow camera, the
  controls fade in, normal physics resumes from where she stands.
- **Directed characters** (trigger reactions) run alongside play; the player keeps
  control.
- **Interrupted** (app closed mid-sequence): on the next launch the sequence is
  treated as finished — the same end state as Skip — so the player is never stuck in
  a half-played scene.
- **Blocking**: a blocking world character is a solid box from its collider for the
  player's movement (no pushing; jumping onto it is off by default).
- **Performance**: world characters are drawn and updated only near the camera; each
  extra on-screen character costs about one character's drawing.

---

## 5. Storage (new keys, catalogued when built)
| Key | Scope | Holds |
|---|---|---|
| `sidescroll.story.world-characters.v1` | content | placed world characters and their behaviours |
| `sidescroll.story.marks.v1` | content | named marks |
| `sidescroll.story.sequences.v1` | content | sequences and their tracks |
| `sidescroll.story.triggers.v1` | content | triggers and their reactions |
| `sidescroll.story.look.v1` | content | atmosphere zones (stage 4) |
| `sidescroll.player.story-progress.v1` | progress | each player's story flags, fired triggers and lasting changes to world characters |

Content keys publish with a new Publish Lab area **Story**; flags are play progress
(never published). All go in Project Backup automatically (catalogue).

---

## 6. Build order (each stage usable on its own)
1. **World characters and marks** *(done 8 Nov: `story-world.js`, `story-editor.js`;
   *visible when* is stored but waits for stage 2's flags)* — place a character at any depth with a looping
   animation (the father chopping wood), facing, scale, blocks the player
   (Auto / Always / Never), visible-when; marks; a route of moves between marks
   (walk A → B by time t, tagged animation); Story scope in the editor.
2. **Triggers that direct characters** (Enter area / Action → play once, switch
   behaviour, move to a mark, face the player), story flags, and **World Lab story
   tracks** with details and the list view. *(2a — triggers, reactions (incl. a simple
   Say line), flags, visible-when, routes from a trigger — done 9 Nov; 2b — World Lab
   tracks — next.)*
3. **First sequences** — camera track (keys, eases, relative-to-player, blend back to
   gameplay), fades and letterbox, hide/show controls, **New game** trigger, Skip.
   *Your opening pan that lands on Aureli.*
4. **Actor tracks** (moves, face, animate, appear, the player as an actor) and
   **speech bubbles**.
5. **Look track** with a colour grade + vignette layer, and **atmosphere zones**.
6. **Events and flags shared with puzzle logic** (After triggers, show/hide objects,
   puzzle states, sequence chaining).

---

## 7. Still to decide
- The speech bubble's exact look (agreed: like the thought bubble, but subtitle-like),
  and whether lines are text only, or with sound later.
- *Decided 8 Nov:* a blocking character can't be walked, jumped or pushed past.
