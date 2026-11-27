# Story editor and interactions: UX review and plan (27 Nov)

Proposed, **not yet agreed**. Covers the Story tab's sequence page, Asset Lab → Interactions,
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
3. **Asset Lab → Interactions**: Inspect (on/off) + one *When taken* choice (can't / into the bag
   / in the hand / worn) with that choice's options, one *Sets flag*, ⓘ on each. Data format
   unchanged (`inspect` / `collect` / `hold` / `wear`); the UI writes only the chosen one.
4. **Flags overview**: every flag with where it's set (Flag steps, Inspect / take) and where it's
   read (lines, barriers, objects); tap to go there. In the Story tab and ⚑ Progress.
5. **Story map** (the planned sequence-level node graph): sequences along the journey with flag
   links between them, so the order of the story is visible at a glance.
