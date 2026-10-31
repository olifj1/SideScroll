# Characters, templates, actions and abilities — agreed design

Agreed in conversation, 30 October 2026. This is the target for Character Lab and
the game's character runtime. Task breakdown: `TASKS.md` → *Characters*.

## 1. One kind of character
Every character is built the same way. Nothing is "built-in" or "custom":
Hero 1, Hero 2 and the Fox become ordinary characters that can be renamed,
exported, copied and (if wanted) deleted. Each has a fixed internal **ID** that
never changes, so a display name can be anything ("Hero 1" is just today's name).

A character is a set of choices, each either **linked** to a shared template
(an *instance*) or the character's own **unique copy**:

| Part | Shared? | Notes |
|---|---|---|
| Rig | Template (instance) or unique copy | Bones and rest proportions; presets menu (Biped, Quadruped, …) |
| Atlas | Always the character's own | The artwork image |
| Drawing method | Character's own choice | **Multi-part** (rigid cut-out pieces) or **deformable mesh**; the same in Character Lab and the game. Both stay supported (30 Oct: bipeds multi-part, quadrupeds mesh). Built (C1c): Parts → *Drawing method*; Mesh = the Parts assembly is enabled |
| Mesh parts + skin | Always the character's own | Depend on that atlas and rig |
| Animations | Per action: template (instance) or unique copy | Only templates compatible with the character's rig are offered |
| Abilities | Chosen per character from the shared ability list | Rig template supplies defaults |
| Scale, speeds, collider | Character's own | |

Authoring flow for a new character: name → choose rig → choose atlas → create
mesh parts → skin → choose animations (instance or copy for each) → abilities →
play-test in the lab → save → see it in the game.

Today's state maps straight onto this: Hero 1 and Hero 2 are two characters that
are instances of the same Biped rig and animation set (currently hidden shared
storage, becomes an explicit, choosable link).

### Naming rule (agreed 30 Oct)
Nothing in the game, its data, its files or its screens is named after a
particular character; only a character's **display name** is. "Fox" is just the
name of one character. Rigs are named collections of bones held as data —
*Biped* and *Quadruped* are two such templates, with nothing special about them
and nothing hard-coded. Existing identifiers (`fox` / `human` families, the
`sidescroll.fox.*` keys, `fox-rig.js`, `fox-*.png`) are renamed with migrations
that still read the old names, so no saved data breaks. Done (30–31 Oct): files, keys,
code names, and saved values (original characters `char-1`–`char-3`, families
`biped` / `quadruped`; `saved-data-migrations.js`).

### Roles: protected tags
- A **role** is a tag such as *Default player* or *Default animal* (the animal you
  play as). Each role is on exactly one character.
- A character carrying a role **cannot be deleted**. To delete it, move the role
  to another character first.
- Roles can be **moved** but not removed (new roles can be added as the game
  needs more key characters). The game uses *Default player* as the starting
  character when the player hasn't chosen one.

### Categories and display order
- Characters belong to one **category** from an editable list with its own order
  (e.g. *Playable*, *Enemy*, *Interactive*), and have an order within it.
- Character Lab lists characters grouped by category in that order; the game's
  character picker lists the *Playable* category.

### Character Library actions
Toolbar **New · Open · Save · Share**; project-wide character settings (roles,
categories, later rig templates and the ability list) live in a **Settings**
dialog in the top bar. *Share* holds Export this character,
Export all characters and Import characters (previously hidden under Load).

## 2. Templates: linking, editing and splitting
Applies to rig templates and animation templates alike.
Rig templates built 31 Oct (C2b, `rig-templates.js`); 1 Nov: the Biped has an editable rest rig and works in Parts/Skin/Mesh like the Quadruped (C2c, first half); animation templates come with C3.

- **Save as template:** any character's current rig (or animation) can be turned
  into a template and added to the library.
- **Editing a linked part** warns that it affects other characters, lists them,
  and asks: *Edit the shared template* or *Split off and make it unique* (this
  character only).
- **Opening a character whose template changed since it was last saved** says so
  on load and asks: *Use the updated template* or *Keep what it had before and
  make it unique*.
  - Because a skin is bound to the rig's rest pose, using an updated rig needs
    the skin rebound: offer **Rebind skin** as part of that choice (with the
    usual preview / undo), never silently.
- Animation templates belong to a rig family; changing a rig template does not
  silently retarget animations (manual retarget only, as already agreed).

## 3. Actions, animations and abilities
Action slots built 31 Oct (C3b, `action-slots.js`): one project-wide list of named slots; each character picks an animation per slot. An action (C5) attaches a button label and behaviour to a slot; an action path (C6) names a slot.
- **Ability list:** one shared, editable list (e.g. walk, run, jump, climb, carry,
  push, squeeze/crawl, later swim). Editable from Character Lab and Asset Lab.
- **Action:** an ability made playable — a name, the **button label** shown to the
  player, the **animation slot** it plays, and its game behaviour.
- **New animations and new actions can be created** in Character Lab and assigned
  to characters. This lets the author set up the data first (e.g. a "Crawl"
  action with its animation), export it and hand it over for the gameplay side
  to be implemented.
- **Per character:** which abilities it has. A character without an ability has
  no slot to fill for it and the game never offers that action (a fox can't pick
  up logs or climb; it may squeeze under things a biped can't).
- **Asset side:** assets already declare behaviours (carryable, pushable,
  climbable…) and climb paths. These become "this asset offers action X", matched
  against the character's abilities.

## 4. Action paths (generalised climb path)
The climb path becomes a general **action path**: a path with an action name, a
button label, an animation bound to it, and the character following the path
while it plays. Example: copy the climb setup, call it *Crawl*, move it to where
the gap is, set the button text, bind the crawl animation.

Action paths can be:
- bound to an asset in Asset Lab (as climb paths are today), or
- placed as a **stand-alone node in the world**, shown and editable in World Lab.

This overlaps the planned reusable *Environment Animation Path* and *Puzzle Logic*
work (`TASKS.md` → Later); design them together.

## 5. Data and publishing implications
- Character packages (`character-packages.js`) must carry the templates a
  character links to (or reference them by ID and version); importing a template
  that others link to lists the affected characters before replacing.
- The Publish Lab lists templates, actions and the ability list alongside
  characters.
- Every new storage key gets a line in `storage-catalogue.json`.
