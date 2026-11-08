# Story sequences — design (proposed 8 Nov 2026, for agreement)

Goal: drop short pieces of story between gameplay — an opening camera move that
lands on Aureli and hands control over, the father chopping wood as she walks out,
a scene that plays when she reaches a place — authored on the phone, with no code
per scene, and seamless in and out of play.

This builds on what exists: the game camera (follows the player along the path; a
tuned height, distance and tilt), characters that play any Character Lab animation,
thought triggers (a placed object with a radius), fog. It is the same idea as the
character system: a few data pieces, authored in the editor, read by the game.

---

## 1. The pieces

### 1.1 World characters (actors placed in the world)
A character placed at a spot in the world, independent of the player:
- **character** (any character from the registry), **position** (x, depth, facing),
  **scale** (default its own);
- **animation**: any of its animations, looping (chop wood, idle, sweep), with a
  speed and a start offset so two villagers don't move in step;
- optional **walk path**: a few points it walks between (walk animation while
  moving, its loop animation when stopped), looping or once;
- **visible when**: always, or only while a story flag is / isn't set (the father is
  chopping wood until the Darkness, gone after).

The game draws them like the player (same mesh or parts drawing, same held-item
rules), with no collision at first (decoration and story), and only loads a
character's art when a world character or sequence needs it.

### 1.2 Sequences (timelines)
A named timeline of a few seconds to a couple of minutes. Tracks:

| Track | Keys / clips |
|---|---|
| **Camera** | Shots: position along the path (world x), height, distance, tilt, field of view, look offset; each key has an ease (linear, ease in/out, hold). A key can be *relative to an actor* (frame Aureli wherever she stands). The last key can be **Gameplay camera**: blend back into the normal follow camera. |
| **Actors** | Per actor (the player or any character): move to a point (walk/run), face, play an animation for a time or once, appear / disappear. The player is just another actor while a sequence runs. |
| **Look** | Fog colour and amount, colour grade (tint, brightness, saturation), vignette, fade to / from black — keyed and eased like the camera. |
| **Screen** | Hide / show the controls, letterbox bars in / out, subtitle or thought text with timing. |
| **Events** | At a time: set / clear a story flag, show / hide an object or world character, start / finish a puzzle state, play a sound (later), start another sequence. |

A sequence ends either by **handing back** (camera blends to gameplay over ~1 s,
controls fade in, the player stands where the sequence left her) or by leading
straight into another sequence.

### 1.3 Triggers (what starts a sequence)
Placed in the world (shown in the editor like thought triggers):
- **New game** — plays once on a fresh start (the opening);
- **Enter area** — the player walks into a zone (x range, optional depth);
- **Action** — the player presses Action near a spot or object;
- **After** — a story flag is set or a puzzle is solved (e.g. play a short reveal when
  the Stone Wall opens).

Each trigger: **once** (default) or **every time**, an optional *only if* flag
condition, and the sequence to play.

### 1.4 Story flags
A small saved list of facts — `intro-seen`, `met-father`, `darkness-came` — set by
sequence events (and later puzzle logic), read by triggers and world characters.
Saved with play progress (each player has their own), so a sequence doesn't replay
after a reload and the world remembers what has happened.

---

## 2. How it fits with what's planned
- **Puzzle logic** (in `TASKS.md` → Later) is *Event → Conditions → Actions*. Triggers
  are events, flags are conditions, and *play sequence / set flag / show object* are
  actions. Build both on one small model so puzzles and story share it (solving a
  puzzle can play a sequence; a sequence can open a route).
- **Actions and action paths (C5/C6)** stay later: sequences only need *play this
  animation*, which characters already have.
- **Atmosphere**: the *Look* settings can also be placed as **atmosphere zones**
  (the muted, misty "after" forest) that blend as you walk in — the same values, so
  the post-process layer serves both.

---

## 3. Authoring (phone-first)
A **Story** scope in the game editor, next to Environment / Terrain / Puzzle — shots
are composed in the real world with the real camera and characters:
- **World characters**: *Add character* → pick → place with a tap → animation,
  speed, facing, path points, visible-when.
- **Sequences**: a list (new, rename, duplicate, delete); opening one shows a
  **timeline dock** at the bottom (like Character Lab's: scrub bar, play / pause,
  the tracks as rows of keys). *Key camera here* stores the current view (flown with
  the existing camera controls); tapping a key edits it (ease, hold, relative to).
  Actor keys are added with *Add actor key* at the playhead. **Preview** plays it in
  place; **Play from start** runs it as the player would see it.
- **Triggers**: *Add trigger* → type → place / size the zone → choose the sequence,
  once / every time, only-if flag.
- A separate list page (a *Story Lab*) can come later if the list grows.

Saving uses the editor's normal Save / Discard (an edit session like world groups).

---

## 4. Running it in the game
- While a sequence runs the player's input is ignored (except **Skip**, shown after a
  moment for sequences already seen, or always while editing); the player character
  is driven like any actor.
- **Hand-back**: the camera eases from its last key into the follow camera, the
  controls fade in, normal physics resumes from where she stands.
- **Interrupted** (app closed mid-sequence): on the next launch the sequence is
  treated as finished — its end state and flags are applied — so the player is never
  stuck in a half-played scene.
- **Performance**: world characters are drawn only near the camera; each extra
  on-screen character costs about one character's drawing.

---

## 5. Storage (new keys, catalogued when built)
| Key | Scope | Holds |
|---|---|---|
| `sidescroll.story.world-characters.v1` | content | placed world characters |
| `sidescroll.story.sequences.v1` | content | sequences and their tracks |
| `sidescroll.story.triggers.v1` | content | triggers in the world |
| `sidescroll.story.look.v1` | content | atmosphere zones (stage 4) |
| `sidescroll.player.story-flags.v1` | progress | each player's story flags |

Content keys publish with a new Publish Lab area **Story**; flags are play progress
(never published). All go in Project Backup automatically (catalogue).

---

## 6. Build order (each stage usable on its own)
1. **World characters** — place a character with a looping animation (the father
   chopping wood), facing, scale, optional walk path; Story scope in the editor.
2. **First sequences** — camera track (keys, eases, relative-to-player, blend back to
   gameplay), fades and letterbox, hide/show controls, **New game** and **Enter area**
   triggers, story flags (once-only), Skip. *Your opening pan that lands on Aureli.*
3. **Actor tracks** (move / face / animate / appear, the player as an actor) and
   **subtitles / thought text** in the Screen track.
4. **Look track** with a real colour grade + vignette layer, and **atmosphere zones**.
5. **Events and flags shared with puzzle logic** (Action / After triggers, show/hide
   objects, puzzle states, sequence chaining).

---

## 7. Questions for you
1. **Where to author**: the Story scope in the game editor as above, or a separate
   Sequence Lab page that opens the game? (I recommend the editor scope.)
2. **Camera freedom**: the game camera is side-on along the path (move, height,
   distance, tilt, zoom). Is that enough for the cutscenes you picture, or do you
   want to swing round (look along the path / angled shots)? Side-on first is much
   simpler and matches the game; angled shots can come later.
3. **Dialogue style**: subtitles at the bottom, thought/speech bubbles above heads, or
   both? Any spoken lines at all, or wordless (gesture, music, sound)?
4. **Skipping**: allow skipping a sequence the first time, or only once seen?
5. **World characters and collision**: purely visual at first (she walks through
   them) — OK, or should some block her?
