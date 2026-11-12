# Sequences — design (agreed 10 Nov 2026)

Story moments and world behaviour — the father who stops chopping and greets Aureli,
a deer that sees her and bolts, the opening pan — are **sequences**: things placed in
the world like puzzles and world groups, built from **components** and a **logic**
list of *When → run event* lines, where each **event** comes from one game-wide
library.

This replaces the earlier authoring model (8–9 Nov: world characters, marks and
triggers, each with their own options and cross-links), which is retired — we start
fresh. The game-side pieces built then are reused underneath: drawing a library
character anywhere, walking between points with the feet matched to the speed,
blocking, zones that fire, the subtitle speech strip, story flags, ▶ Play in the
editor and the TEST bar.

## Each system has one job
| System | Its job | Where it lives |
|---|---|---|
| **Characters** | What a character *is* (art, rig, animations, collider). One of each for the whole game: one Father. | Character Lab (exists) |
| **Events** | A reusable chain of steps written with **roles** — *"Greet and leave"*, *"Flee from the player"*. | Events library |
| **Sequences** | What is placed where (components) and what happens when (logic). Unique, or a template placed as instances. | Sequences library, placed in the world |
| **Story flags** | What has happened for this player. Set by steps, read by logic and sequences. | Play progress |

Nothing else holds behaviour. A component only says what it is and where it stands; a
character never knows which sequences use it; an event never knows where it is used.

## Sequences
- **Anchor** — x along the journey, like a puzzle marker. Components are placed
  relative to it, so moving the anchor moves the whole sequence.
- **Bounds** — the stretch its components and zones cover (worked out; shown in the
  editor and World Lab), plus a preload distance for streaming.
- **Components** — each has a name inside the sequence and a place:
  - **Character** — a reference to a library character, *or* a random pick from a list
    (person, deer, fox), chosen afresh each time a logic line runs. To always get the
    same one, make a bespoke version that names it. Its standing animation, facing,
    depth, blocks the player (Auto / Always / Never).
  - **Mark** — a named spot (x, depth, facing).
  - **Zone** — a stretch of path the player can walk into, or press Action in (with the
    button's label).
  - **Thought** — a thought-bubble line shown when the player comes near (today's
    thought triggers, owned by the sequence).
  - **Dressing** — assets from the asset list, as in a world group.
- **Logic** — lines, in order:
  - **When** — the sequence loads · the player walks into *zone* · presses Action in
    *zone* · another line's event finishes · a flag is set.
  - **Run** — an event from the library, each of its roles filled from this sequence's
    components (*Actor* = Father, *Exit* = Woodpile).
  - **Only if** (optional) — a flag is / isn't set. **Once** or **every time**.
- **Active while** (optional) — the sequence exists only while a flag is / isn't set
  (the intro's Father is gone once `intro-done` is set; the home sequence's Father
  appears). The editor warns if two active sequences place the same character in
  overlapping bounds.
- **Unique or template** — as puzzles and world groups. A template is placed as
  linked instances (each with its own anchor; components and logic shared); an
  instance can be made unique.

The player keeps control while a sequence plays, unless an event's steps take it away
(see **Control** below).

## Events
- A **name**, its **roles** (each a kind: Character, Mark, Zone), and **steps** in
  order. Each step runs *after the previous one* or *with the previous one*.
- **Steps** (first set):
  - **Move** — *role* walks / runs / any animation to *mark role* (or N m in a
    direction), at its own speed or arriving after N s.
  - **Animate** — *role* plays an animation once (N times) and goes back, or switches
    to a new looping animation.
  - **Face** — *role* faces the player / left / right / another role.
  - **Say** — *role* (or no one) says a line, shown as the subtitle strip, for N s.
  - **Think** — the player thinks a line (thought bubble).
  - **Wait** — N s.
  - **Flag** — set or clear a story flag.
  - **Show / Hide** — a component appears or disappears.
  - **Control** — take control from the player, or give it back (also given back when
    the event ends, so a player is never left stuck).
  - **Camera** — *shot*: frame a placeholder (a mark placed where the shot centres, or a
    character) or the player, shifted along the journey, raised, moved back and aimed
    up / down, eased over N s and held; *back*: blend back to following the player.
    Height follows the ground under the target. Released (back over 1 s) when the event ends.
  - **Screen** — fade to / from black, letterbox bars in / out, over N s; cleared when the
    event ends.
  - **Wait for Action** — the event waits until the player presses Action (even while
    control is taken); the button shows the step's label. A Camera shot may **keep** after
    its event ends, until a later *back* step. Logic can also start **when the player
    leaves a zone** (added 11 Nov).
  - **Item** — give the player an item (with a count), or take one (added 12 Nov). Items a
    sequence gives are removed, and ones it took returned, when the sequence is reset.
  - Later: **Look** (colour grade, vignette, fog) and **Skip** (see *Later* below).
- Events are game-wide: any sequence can run any event. Changing an event changes it
  everywhere it is used; its page lists where.

## Editing — one consistent pattern
Everything is a **list → open → edit** page, and things are added only with
**+ Add *thing*** choosing from a list. No option is hidden in another thing's menu,
and each thing is edited in exactly one place.
- In the game editor, the **Story** scope becomes **Sequences**, with two lists:
  **Sequences** (templates and placed ones) and **Events**.
- **Sequence page** — *Placement* (anchor, unique / template, active while),
  *Components* (+ Add character / mark / zone / thought / dressing, each placed by tap
  and shown in the world while the sequence is open), *Logic* (+ Add line: When → Run
  event → fill its roles).
- **Event page** — *Roles* (+ Add role) and *Steps* (+ Add step from the step list;
  each step picks its roles from a list).
- **Testing** — the TEST bar (▶ Play, ↺ Restart, Reset story, **⚑ Progress**: complete or
  reset any puzzle or sequence, toggle flags — added 12 Nov) plus **Play from here**
  on a sequence (Play starts just before its bounds, story reset). A **Sequence Lab**
  page to test one in isolation comes later.
- The lists are the source of truth; a **node graph** could later be another view of
  the same logic and events.

## Streaming
Sequences stream like puzzles and world groups: within the preload distance of its
bounds a sequence's data and its characters' artwork are loaded and its logic starts
listening; once the player has passed it by the unload distance it is unloaded (its
progress is kept). Only what is near stays loaded.

## World Lab
A **Sequences** track along the journey shows each placed sequence's bounds and name
(instances marked). Tapping one shows its details — components, logic lines, flags it
reads and sets — with **Open in game** and **Play from here**.

## Storage (new keys, catalogued when built)
| Key | Scope | Holds |
|---|---|---|
| `sidescroll.story.events.v1` | content | the events library |
| `sidescroll.story.sequences.v1` | content | sequence templates and placed sequences (anchor, components, logic) |
| `sidescroll.player.story-progress.v1` | progress | flags, fired lines per placed sequence, lasting changes per component |

The 8–9 Nov keys (`sidescroll.story.world-characters.v1`, `…marks.v1`,
`…triggers.v1`) are retired and marked stale.

## Build order (each step usable on its own)
1. **Events** *(done 10 Nov, with step 2)* — the events library and its page (roles,
   steps), and the game running an event's steps (reusing the existing runtime).
2. **Sequences** *(done 10 Nov)* — library, unique / template, anchor, components (characters, marks,
   zones), logic lines (When → Run with roles, Only if, Once), Play from here. Replaces
   the Story scope's Characters / Marks / Triggers tabs.
3. **More components and streaming** — thoughts, dressing, random character picks,
   Active while; sequences load and unload by distance.
4. **World Lab sequences track** — bounds, details, Open in game, Play from here.
5. **Camera and look steps** *(Camera and Screen — fade, letterbox — done 11 Nov; Look and
   Skip next)*, Sequence Lab, node graph view.

## Later: camera and look steps (from the 8 Nov design)
- **Camera** — side-on only (agreed): position along the path, height, distance, tilt,
  field of view; eased keys (linear, ease in / out, hold); a key can frame a role
  wherever it stands; the last can blend back into the normal follow camera.
- **Look** — fog colour and amount, colour grade (tint, brightness, saturation),
  vignette, fade to / from black; the same values as placeable atmosphere zones.
- **Screen** — letterbox bars in / out, hide / show the controls.
- **Skip** — every sequence that takes control can be skipped (hold to skip), jumping
  to its end state; an interrupted one (app closed) counts as finished.
- **Speech** — like the thought bubble but subtitle-style (in use); its exact look and
  whether lines get sound are still to decide.
