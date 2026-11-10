# Cutscenes — design (proposed 10 Nov 2026, for agreement)

Replaces the authoring model of `SEQUENCE_SYSTEM_DESIGN.md` stages 1–2a (world
characters, marks and triggers each with their own options and cross-links). The
game-side pieces built for those stages are kept and reused underneath: drawing a
library character anywhere, walking between points, blocking, zones that fire,
speech, story flags, ▶ Play in the editor and the TEST bar.

## The idea in one paragraph
A **cutscene** is placed in the world like a puzzle or a world group: it has an
anchor, bounds and a list of **components** (characters from the library, marks,
trigger zones, thought bubbles, scene dressing). Its **sequence** is a short list of
lines — *When* something happens → *run* an **event**. An event is a reusable chain of
**steps** (walk, animate, face, say, wait, set a flag…) written with **roles**
(*Actor*, *Exit*) that each sequence line fills in from the cutscene's components. So
the same event works anywhere in the game, with any character.

## Each system has one job
| System | Its job | Where it lives |
|---|---|---|
| **Characters** | What a character *is* (art, rig, animations, collider). One Father for the whole game. | Character Lab (exists) |
| **Events** | A reusable chain of steps, written with roles. *"Greet and leave"*, *"Flee from the player"*. | Events library |
| **Cutscenes** | What is placed where, and what happens when: components + sequence. Unique, or a template placed as instances. | Cutscenes library, placed in the world |
| **Story flags** | What has happened for this player. Read by sequences and cutscenes, set by steps. | Play progress |

Nothing else holds behaviour: a component only says what it is and where it stands; a
character's library entry never knows about cutscenes; an event never knows where it
is used.

## Cutscenes
- **Anchor** (x along the journey, like a puzzle marker). Components are placed
  relative to it, so moving the anchor moves the whole cutscene.
- **Bounds**: the x range its components and zones cover (worked out, shown in the
  editor and World Lab), plus a preload distance for streaming.
- **Components** — each has a name inside the cutscene and a place:
  - **Character**: a reference to a library character, *or* a random pick from a list
    (person, deer, fox) chosen when the cutscene loads; its standing animation,
    facing, depth, blocks the player (Auto / Always / Never).
  - **Mark**: a named spot (x, depth, facing).
  - **Zone**: a stretch of path the player can walk into, or press Action in (with the
    button's label).
  - **Thought**: a thought-bubble line shown when the player is near (today's thought
    triggers, owned by the cutscene).
  - **Dressing**: assets from the asset list, as in a world group.
- **Sequence** — lines, in order:
  - **When** — the cutscene loads · the player walks into *zone* · presses Action in
    *zone* · another line's event finishes · a flag is set.
  - **Run** — an event from the library, with each of its roles filled from this
    cutscene's components (*Actor* = Father, *Exit* = Woodpile).
  - **Only if** (optional) — a flag is / isn't set. **Once** or **every time**.
  - **Takes control** (optional) — the player's controls pause while the event runs
    (a true cut-scene); otherwise it plays alongside play.
- **Active while** (optional) — the whole cutscene exists only while a flag is / isn't
  set (the intro's Father is gone once `intro-done` is set; the home cutscene's Father
  appears). The editor warns if two active cutscenes place the same character in
  overlapping bounds.
- **Unique or template** — the same choice as puzzles and world groups. A template is
  placed as linked instances (all share components and sequence; each has its own
  anchor and its own random picks); an instance can be made unique.

## Events
- A **name**, its **roles** (each a kind: Character, Mark, Zone), and **steps** in
  order. A step runs *after the previous one* or *with the previous one*.
- **Steps** (first set):
  - **Move** — *role* walks / runs / any animation to *mark role* (or turns away and
    walks off N m), at its speed or arriving after N s.
  - **Animate** — *role* plays an animation once (N times) and goes back, or switches
    to a new looping animation.
  - **Face** — *role* faces the player / left / right / another role.
  - **Say** — *role* (or no one) says a line, shown as the subtitle strip, for N s.
  - **Think** — the player thinks a line (thought bubble).
  - **Wait** — N s.
  - **Flag** — set or clear a story flag.
  - **Show / Hide** — a component appears or disappears.
  - Later: **Camera**, **Fade**, **Letterbox**, **Look** (the old stages 3–4).
- Events are game-wide: any cutscene can run any event. Renaming or changing an event
  changes it everywhere it is used (the editor lists where).

## Editing — one consistent pattern
Everything is a **list → open → edit** page, and things are added only with
**+ Add *thing*** choosing from a list. No option is hidden in another thing's menu,
and each thing is edited in exactly one place.
- In the game editor, the **Story** scope becomes **Cutscenes** with two lists:
  **Cutscenes** (templates and placed ones) and **Events**.
- **Cutscene editor** — three sections: *Placement* (anchor, unique/template, active
  while), *Components* (+ Add character / mark / zone / thought / dressing; each placed
  by tap and shown in the world while this cutscene is open), *Sequence* (+ Add line:
  When → Run event → fill roles).
- **Event editor** — *Roles* (+ Add role) and *Steps* (+ Add step from the step list;
  each step picks its roles from a list).
- **Testing** — the TEST bar as now, plus **Play from here** on a cutscene (Play starts
  just before its bounds with its flags reset). A **Cutscene Lab** page to test one in
  isolation comes later.
- The list form is the source of truth; a **node graph** could later be another view
  of the same sequence and events.

## Streaming
Cutscenes stream like puzzles and world groups: within the preload distance of its
bounds a cutscene's data and its characters' artwork are loaded and its sequence
starts listening; once the player has passed it by the unload distance it is
unloaded (its progress is kept). Loaded data stays limited to what is near.

## World Lab
A **Cutscenes** track along the journey shows each placed cutscene's bounds and name
(templates marked as instances). Tapping one shows its details — components, sequence
lines, flags it reads and sets — with **Open in game** and **Play from here**.

## Storage (new keys, catalogued when built)
| Key | Scope | Holds |
|---|---|---|
| `sidescroll.story.events.v1` | content | the events library |
| `sidescroll.story.cutscenes.v1` | content | cutscene templates and placed cutscenes (anchor, components, sequence) |
| `sidescroll.player.story-progress.v1` | progress | flags, fired lines per placed cutscene, lasting changes per component |

The stage 1–2a keys (`sidescroll.story.world-characters.v1`, `…marks.v1`,
`…triggers.v1`) are retired (start fresh, agreed 10 Nov) and marked stale.

## Build order (each step usable on its own)
1. **Events** — the events library and editor (roles, steps), and the game running an
   event's steps (reusing the stage 1–2a runtime).
2. **Cutscenes** — library, unique/template, placing an anchor, components (characters,
   marks, zones), sequence lines (When → Run with roles, Only if, Once, Takes control),
   Play from here. Replaces the Story scope's Characters / Marks / Triggers tabs.
3. **More components and streaming** — thoughts, dressing, random character picks,
   Active while; cutscenes load and unload by distance.
4. **World Lab cutscene track** — bounds, details, Open in game, Play from here.
5. **Camera and look steps**, Cutscene Lab, node graph view.

## Questions
1. **Name** — *Cutscene* also covers ambient behaviour (a deer that runs away). Keep
   *Cutscene*, or *Scene* / *Encounter*?
2. **Takes control** — off by default (events play alongside play) and switched on per
   sequence line for true cut-scenes. Right default?
3. **Random picks** — chosen once per placed instance when it loads (so the same deer
   each visit until reload), or freshly each time it loads?
