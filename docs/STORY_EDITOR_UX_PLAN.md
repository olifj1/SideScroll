# Story editor and interactions: UX review and plan (27 Nov)

Stage 1 **done** (27 Nov: wrapping add buttons, full-height foldable name-only component list, ⓘ Info in
`editor-help.js`, neutral wording). Stage 2 **done** (27 Nov: header + ⋯, component and line pages, sentence
lines, placeholders that fill themselves). Stages 3–6 **built** 27 Nov in one PR for a single review (the user asked for every stage before feedback): the
**sequence flow view** (3a–3c, design below), Asset Lab → Interactions, the flags overview and the story map.
As built: 3c adds lines with **+** buttons (on triggers, event boxes and flags) rather than by dragging from a box;
Inspect keeps its own flag beside the one *When taken* flag; the story map is a mode of the same docked layer. Covers the Story tab's sequence page, Asset Lab → Interactions,
and a shared Info (ⓘ) system. Each stage is a separate PR; get the user's go-ahead per stage.

## What's wrong today

**Sequence page** (`sequence-editor.js` `sequencePage`, `componentEditor`, `lineEditor`)
- One long scroll: Name, Placement (nudges, Move by tap, Show, To view centre), Save as template,
  Play / Delete, Components, the open component's whole editor *inside the list*, then Logic.
  The things you edit most (components, logic) sit below rarely used placement buttons.
- *+ Character / + Mark / + Zone / + Object / + Barrier* are squeezed onto one row; labels spill.
- Component rows mix icons, names and differently sized summaries ("Boy", "−51.0 m",
  "2.0 m wide", "Blocks until …"), so rows are uneven. The list can become its own scroll area.
- Logic lines are long forms (When ▾, zone ▾, Run event ▾, Open…, then one menu per event
  placeholder). A line doesn't read as a sentence, so it's hard to see what a sequence *does*.
- Events got a visual timeline; sequences have nothing equivalent.

**Asset Lab → Interactions** (`asset-lab.js` `syncInteractions`)
- Inspect, Collect, Hold and Wear are four independent on/off toggles, but the game applies a
  hidden order (Wear beats Hold beats Collect). Turning on two of them looks valid and silently
  isn't. "Taking it" is really **one choice**: can't / into the bag / carried in the hand / worn.
- Each action repeats its own "sets story flag" field.

**Help text**
- 35+ inline grey `help()` paragraphs in the Story editor, more in Asset Lab and the game's
  panels. They push controls down, vary in length and tone, and several say "she" / "her"
  although the player character can be anyone.

## Principles (to add to the UX bible once agreed)
1. Most-used first: what a thing *is and does*, then where it sits, then rare actions in a ⋯ menu.
2. Lists are full height, uniform rows (name only, optional short right-hand detail), in
   collapsible sections. Never a scroll area inside the panel.
3. Add buttons wrap onto as many rows as needed, two or three per row, never shrinking text.
4. One thing open at a time: selecting an item opens its editor as the panel's next page (‹ back),
   not inline in the list.
5. Explanations live behind **ⓘ**, never as inline paragraphs; labels and placeholders stay short.
6. Neutral wording: "the player", never "she" / "her" / a character's name.

## Info (ⓘ) system
- `editor-help.js`: one dictionary `{id: {title, text}}` with every explanation, in neutral wording.
- `Help.button(id)`: a small ⓘ next to any section title or field label. Tap → a popover under
  the row with the text (tap again or elsewhere to close). The same look in the game editor, the
  timeline, Asset Lab and the Labs.
- Inline `help()` paragraphs become ⓘ ids; empty states keep one short line.

## Stages
1. **Tidy the sequence page** (the explicit asks): add buttons wrap; component list full height,
   collapsible, name-only rows; the ⓘ system, with the Story editor's help moved into it; neutral
   wording everywhere.
2. **Restructure the sequence page**: header (name, ▶ Play from here, ⋯ for Move / Show / Template
   / Delete); sections Components and Logic; the component editor and line editor open as their
   own page. Logic lines shown as sentence cards: *When the player enters Cabin door · only if
   bag-fixed is set → Father leaves for town (Father, Door mark)*. Event placeholders fill
   themselves from same-named / only-matching components.
3. **Sequence flow view** (agreed 27 Nov; the user's main ask): one sequence shown as nodes and arrows,
   laid out in the order things happen, each event a distinct box that opens its ⤢ Timeline. Design in
   **Sequence flow view** below. Phases: 3a read-only flow with navigation, 3b live during play,
   3c editing in the flow.
4. **Asset Lab → Interactions**: Inspect (on/off) + one *When taken* choice (can't / into the bag
   / in the hand / worn) with that choice's options, one *Sets flag*, ⓘ on each. Data format
   unchanged (`inspect` / `collect` / `hold` / `wear`); the UI writes only the chosen one.
5. **Flags overview**: every flag with where it's set (Flag steps, Inspect / take) and where it's
   read (lines, barriers, objects); tap to go there. In the Story tab and ⚑ Progress.
6. **Story map**: every sequence along the journey with the flag links *between* sequences, so the
   order of the whole story is visible at a glance (the flow view of stage 3, one level up).

## Sequence flow view (stage 3, agreed 27 Nov)

**Why.** An event is a timeline because it runs in time. A sequence mixes three things: *where* (its
zones and components sit along the path, World Lab's view), *what order* (lines fire on zones, Action,
flags and other lines finishing, not necessarily in path order) and *time* (each event it runs). So its
view is a **flow**: nodes laid out in the order things happen, looping back where they loop, with each
event a distinct box that opens its timeline. It is another view of the same logic lines: **no saved data
changes** (only view settings, sessionStorage `sidescroll.story.flow-view`, catalogued).

**Nodes**
- **Triggers** (grey): *Sequence starts*; *Enters / Leaves Zone 1*; *Presses Talk at Cabin door*, each
  with its zone's place on the path (−8 m).
- **Events** (purple): one box per logic line (the same event on two lines = two boxes): the event's name,
  its length, and a mini strip of its timeline rows (as the timeline's Bar). Amber edge when a placeholder
  is unfilled or no event is chosen; *every time* badge for repeating lines. **Tap → its ⤢ Timeline** (‹ back
  returns to the flow); ⋯ on the box → the line's page.
- **Flags** (teal): each flag a Flag step in one of these events sets (and the Inspect / take flags of this
  sequence's objects), one node per flag.
- **Waiters** (dashed): barriers and objects whose condition reads a flag (*Barrier 1 · opens*).

**Arrows**
- trigger → event (the line's When); event → flag (*sets*); flag → event (a line *When flag is set*);
  event → event (a line *When line n finishes*).
- Dashed: flag ⇢ event for a line's *Only* condition; flag ⇢ barrier / object for what waits on it.
- A flag set or read **outside** this sequence gets a small stub (*from elsewhere* / *read elsewhere*);
  tapping it lists where (this is where stage 5's flags overview plugs in).

**Layout: order of action** (deterministic, recomputed on every change, nothing about positions stored)
- **Columns = order.** Triggers that need nothing else (start, zones, Action) are column 0. Every other node
  goes one column after the latest node that feeds it (longest path).
- **Loops** don't decide columns: edges that point back (found by a depth-first walk from column 0, in row
  order) are drawn as **return arrows** routed under the rows, back to their target.
- **Rows = threads.** Column-0 triggers are ordered *Sequence starts* first, then by their zone's place
  along the path (left to right of the journey), so path distance still reads top to bottom. A node stays
  in the row of the first thread that reaches it; a node fed by two threads sits in the first and takes a
  second arrow in.
- Nodes are fixed sizes (trigger 150, event 190, flag 90 px wide); columns and rows have fixed gaps; arrows
  are straight within a row and L-shaped between rows, never through a box.

**Where and how**
- **⤢ Flow** on the sequence page header (beside ▶ Play) opens a layer docked with the game **exactly like the
  timeline**: Bar / Half / Full, aside, 🎮 / ✎ focus and ◐ opacity, sharing that code where possible. Pan by
  dragging, pinch / ctrl + wheel to zoom. At Bar: a strip of the event boxes in column order.
- Tapping a trigger selects its zone in the scene and offers *Edit line*; tapping a flag or waiter offers
  its line / component page.
- **3b, live:** during ▶ Play (or the TEST bar's Play) the running event's box glows with its playhead in
  the mini strip, set flags light up, fired once-only lines dim; polled each frame like `host.transport`.
- **3c, editing:** *+* on a trigger or flag adds a line from it (opens the line page); drag from an event's
  edge to an empty spot adds a *When line n finishes* line. Later a **Choice** step forks an event's box.

**Out of scope here:** links *between* sequences (stage 6, Story map) and the project-wide flag list (stage 5).
