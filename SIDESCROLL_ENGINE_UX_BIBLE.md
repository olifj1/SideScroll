# SideScroll Engine & UX Bible

**Project:** SideScroll / Aureli  
**Status:** Authoritative living engineering and editor-design reference  
**Established:** October 2026  
**Scope:** Runtime architecture, authoring architecture, data ownership, persistence, migration, editor UX, touch interaction, performance discipline, testing and release workflow.

---

## 1. Purpose

This document defines **how SideScroll should be built**.

It is not a backlog and it is not a release history. Its job is to capture the durable engineering, editor and UX rules that new systems should follow so the project becomes more coherent as it grows rather than accumulating isolated solutions.

Use it when:

- adding a new engine or gameplay feature;
- adding or restructuring an editor tool;
- adding a new authored collection such as Zones, Logic, nodes or paths;
- changing save/reset/test/template behaviour;
- changing data schemas or migrating existing content;
- adding touch/viewport manipulation;
- generalising a one-off feature into a reusable system;
- reviewing a patch before release.

If a new implementation decision is likely to matter again, record the **rule** here and the **work item** in `SIDESCROLL_TASKS.md`.

### Authority rule

When documentation disagrees:

1. The user's latest explicit design decision takes priority.
2. This Bible should represent the current durable architecture and UX rules.
3. `SIDESCROLL_TASKS.md` represents current work, known issues and historical implementation context; stale task text must not override a newer Bible rule.
4. The actual current code/data must always be inspected before editing. If code and documentation disagree, do not guess: determine the real current behaviour, then correct whichever side is stale.

---

## 2. Documentation map

SideScroll now has separate places for separate kinds of truth.

### Game / Design Lab — **what the game is**

Owns story, characters, progression, locations, puzzles, abilities, world structure, gameplay intent and higher-level design decisions.

### Art Bible + art/asset pipeline — **what the game looks like and how art becomes game-ready**

Owns visual language, rendering style, value/saturation rules, asset families, texture processing, alpha/fringing workflow, consistency rules and source-to-game art preparation.

### Concept Lab — **visual exploration**

Owns exploratory visual references, location concepts and comparisons. It informs the Art Bible and production asset work but is not itself the final art specification.

### Asset Lab — **what an asset is**

Owns authored asset definitions such as collision, state variants, support/collision behaviour and other asset-level properties. Puzzle Logic should reference these definitions rather than re-describing them.

### World Lab — **where authored content lives in the game world**

Owns world/layout planning, sections, regions, puzzle/location placement and world-scale structure.

### `SIDESCROLL_ENGINE_UX_BIBLE.md` — **how the engine and authoring tools are built**

Owns architecture, data ownership, state separation, editor workflow, UX grammar, persistence, migration, input, performance, reuse and release discipline.

### `SIDESCROLL_TASKS.md` — **what we are doing next**

Owns active tasks, known bugs, regression checks, implementation stages and remaining work. Completed historical entries may remain useful, but the file must not become the source of truth for permanent architecture when a rule belongs here.

### Release README — **what changed in this drop**

Owns the bounded release summary, changed files, compatibility notes and focused device checks.

---

## 3. Core engineering principles

### 3.1 Inspect before changing

Never implement from labels, assumptions or remembered behaviour alone.

Before changing a system:

- inspect the current implementation;
- trace the real read/write path for the affected data;
- identify runtime, editor and persisted representations;
- identify templates/instances or legacy migration paths;
- identify existing reusable systems that solve the same class of problem;
- identify phone/touch behaviour and any per-frame hot paths.

A UI control that appears simple may sit on top of older runtime or migration behaviour. Trace it before editing.

### 3.2 Preserve proven behaviour unless the task intentionally changes it

A refactor is not permission to redesign unrelated working systems.

When introducing a new representation, preserve current gameplay and authoring behaviour first, then improve it deliberately in a separate bounded change when appropriate.

### 3.3 Prefer reusable systems over puzzle-specific code

When a behaviour appears more than once, or clearly belongs to a wider class, favour a reusable engine primitive.

Examples:

- Cart Path should evolve toward reusable **Environment Animation Path** rather than becoming more cart-specific.
- Broken / Repaired / Landed belong to **Asset States**; puzzle code should transition between them rather than duplicate state behaviour.
- Fallen Tree `cross-x` became reusable **Puzzle Entry / Exit**.
- Puzzle behaviours should evolve toward reusable **Event -> Conditions -> Actions** rather than named hard-coded puzzle scripts.

Do not generalise prematurely into an enormous framework. Generalise **from proven behaviour**, incrementally.

### 3.4 Bounded changes beat giant rewrites

Split architectural work into coherent, testable slices.

A patch should have a clear responsibility and preserve the ability to identify which change caused a regression. Avoid combining several risky data-model migrations and UX rewrites simply because they are related conceptually.

---

## 4. State and ownership model

Every important piece of data must have a clear owner and a clear state layer.

### 4.1 Separate authored state, runtime/test state and editor-only state

**Authored state** is durable content the creator intends to save: object placement, zones, paths, logic, asset states, puzzle setup, etc.

**Runtime/test state** is temporary gameplay state: player inventory during a test, puzzle solved/started flags, active carry/push interaction, path playback progress, spawned runtime reward objects, etc.

**Editor-only state** is transient UI/tool state: selected row, active tab, open picker, active Move tool, collapsed drawer, scroll position, hover/highlight state.

Never persist editor-only state as authored data merely because it is convenient. Never let Test/runtime state silently overwrite authored state.

### 4.2 Ownership must be explicit

An authored thing should clearly belong to one of the relevant scopes, for example:

- World / scene
- World Group
- Puzzle instance
- Puzzle template
- Asset definition
- Global world/look setting

The UI and data model should agree about ownership.

### 4.3 Stable identity is mandatory for authored collections

Zones, Logic components, nodes, paths, groups and other editable records require stable IDs.

Do not rely on list position as identity. Reordering, migration or insertion must not retarget references accidentally.

### 4.4 References must target identity, not coincidence

Do not infer relationships from "the first object of this type", nearest matching item, same collectible type, list order or current selection when a durable ID/reference can exist.

If a referenced target is missing, report it as missing rather than silently attaching to a different object.

---

## 5. Select -> Management -> Edit

### 5.1 Select is not Edit

Selecting an authored unit may allow:

- inspect;
- focus;
- move the whole instance where appropriate;
- duplicate;
- delete;
- enter its explicit edit context.

Selecting it must not automatically expose or make editable all of its internal children, zones, paths or logic.

### 5.2 Management screens operate on whole instances

Puzzle Management and Group Management are for whole-instance operations.

Internal authoring begins only after `Edit Puzzle`, `Edit Group`, or the equivalent explicit context is entered.

### 5.3 One active authoring context

At any moment the editor should know which context owns authoring input, for example:

- Environment
- World Group
- Puzzle
- Terrain
- Asset Definition

Do not create accidental combinations of independent edit booleans that allow two unrelated systems to believe they own the viewport.

### 5.4 Outside-context content is protected

When editing a Puzzle or Group, unrelated world content may remain visible for context but should not be accidentally selectable or editable.

---

## 6. Puzzle Editor responsibilities

Inside Puzzle Edit, keep the conceptual separation:

### Contents

Physical puzzle pieces, dressing and object-level properties.

Examples:

- position/scale/flip;
- collision;
- sockets as physical attachment points;
- Thought/Camera child nodes where owned by content;
- target asset identity.

### Zones

Spatial volumes owned by the puzzle.

Current examples:

- Procedural Exclusion
- Respawn Trigger + associated Spawn Point

Zones are not a catalogue of possible zone types. The list shows **only attached zones**.

### Logic

Applied gameplay systems/rules owned by the puzzle.

The list shows **only applied logic**. Potential systems appear only in the Add picker.

Physical geometry belongs in Contents; gameplay semantics belong in Logic.

### Setup

Puzzle lifecycle and authoring-session controls, including:

- Test;
- Reset to Start State;
- Set Start State;
- template/instance relationship;
- explicit Create Template / Reload from Template / Make Standalone relationship controls where appropriate.

Setup controls must use wording that clearly distinguishes **restoring** a state from **recording** a new state.

---

## 7. Shared editor UX grammar

Comparable systems must use comparable interaction patterns.

### 7.1 Authoritative applied list

A collection list shows what actually exists, not what could exist.

Do not mix:

- real records;
- disabled placeholder records;
- type selectors;
- absent feature rows;
- inferred "you could add this" entries.

Examples:

- A puzzle with no Respawn Trigger shows no Respawn Trigger row.
- A puzzle with no Cart Path shows no `Cart Path — absent` row.
- An explicitly-authored Respawn Trigger may remain in the list while disabled because it is still a real authored record.

### 7.2 Add workflow

For comparable authored collections use:

**authoritative applied list -> one `+ Add` button -> shared right-side picker**

The picker:

- is separate from the main drawer;
- shows only available/compatible types;
- does not masquerade as an attached item;
- closes without mutation on cancel/X/re-tap where appropriate;
- closes automatically after a selection;
- creates exactly one item;
- returns focus to the main editor;
- selects the newly-created item.

Zones, Logic and asset placement should share this authoring grammar unless there is a concrete reason to diverge.

### 7.3 Reuse existing shells and controls

Do not create a visually similar but independently-behaving picker, inspector, drawer or transform control when the shared one can serve the same role.

Consistency is functional, not cosmetic: shared components reduce gesture bugs, state divergence and future maintenance.

### 7.4 One selected thing

Viewport selection and list selection should resolve to the same selected record. The selected thing drives one context-sensitive inspector/details area.

### 7.5 One active sub-tool

Move, Collision, Exclusion movement, Spawn movement, Path editing, etc. are sub-tools inside the active authoring context.

Activating one should deactivate incompatible sub-tools.

### 7.6 Lists beat repeated viewport tapping

The viewport is complementary to an authoritative list/hierarchy. Dense scenes must never require repeated tapping to rediscover hidden or overlapping authored records.

---

## 8. Editor drawer and navigation rules

### 8.1 One stable authoring home

The main authoring surface is the left Editor Drawer. Specialist temporary browsers/pickers may appear separately, such as the shared right-side Add picker.

### 8.2 Collapse is not exit

Collapsing the drawer keeps the current authoring context, dirty state and history alive.

### 8.3 Stable header geometry

The drawer collapse arrow remains permanently at the far-left of the header.

When a Back control is required, the order is:

**Collapse -> Back -> context/title**

Controls should not move sides depending on route depth.

### 8.4 Back means hierarchy navigation

Use Back to return to the parent authoring route.

Reserve `×` for transient overlays/pickers/dialogs where closing dismisses only that temporary surface.

### 8.5 Do not teleport equivalent controls

Equivalent actions should remain in predictable places across systems. If two tools have the same workflow responsibility, prefer the same UI element and location.

---

## 9. Touch and viewport interaction

SideScroll is iPhone-first. Touch behaviour is an architectural requirement, not post-release polish.

### 9.1 Stable DOM during gestures

Do not rebuild or replace a touched control between `pointerdown` and `pointerup`.

If a UI list/chip strip can remain stable and update only changed state, do that. Per-frame DOM reconstruction can cancel iPhone taps/swipes even when desktop mouse interaction appears fine.

### 9.2 Relative drag for spatial authoring

For awkward perspective-space positioning, prefer stable relative screen-space movement that allows the user to lift and continue dragging from the current location.

Do not default to tiny world-space edge/resize handles on a phone.

### 9.3 Sliders for stable dimensions

Where appropriate, width/length/height are better edited with touch-stable sliders than fragile scene handles.

### 9.4 One gesture = one history action

Pointer/slider gestures begin one transaction, update live, and commit once on release if authored state changed.

### 9.5 Gesture ownership

Drawer gestures, scrolling and viewport manipulation must not leak into each other.

Do not depend on the extreme iOS screen edge for app-owned gestures.

---

## 10. Undo, Save, Discard and transaction semantics

### 10.1 Authored edits are transactional

Meaningful authoring changes should participate in Undo/Redo unless they are an explicitly documented commit boundary.

### 10.2 One interaction = one Undo step

Examples:

- one drag;
- one slider gesture;
- one Add;
- one Delete;
- one Reset action;
- one state transition authored through the editor.

### 10.3 Bounded edit sessions

Puzzle and Group internal editing use bounded sessions where useful:

- entering edit captures a checkpoint;
- changes remain authoring work-in-progress;
- Save commits;
- Discard restores the checkpoint;
- leaving dirty work must not silently discard or silently commit.

### 10.4 Commit boundaries must be explicit

Actions such as Set Start State, updating a Template, Create Template or Make Standalone may intentionally change persistence/relationship semantics. Treat them as explicit commit boundaries and explain their scope in the UI.

### 10.5 Rendering/opening UI must not author data

Opening a tab, drawing a panel, selecting a list or rendering a frame must not silently create a Zone, Logic record, template override or other persistent authored record.

Authored mutation comes from an explicit user action or explicit migration/upgrade boundary.

---

## 11. Reset and Test semantics

Every Reset/Test button must have a defined scope. Do not use vague "reset" behaviour that changes different layers opportunistically.

### 11.1 Reset to Start State

Restores the puzzle's authored Start State while preserving fields that an older legacy snapshot could not express unless a modern snapshot explicitly says otherwise.

Inside authoring, Reset should be one Undoable authoring action.

### 11.2 Set Start State

Records the current authored setup as the future Reset/Test starting state.

The control remains named **Set Start State** in every relationship state. Scope comes from the object relationship: Standalone updates only that scene object; a Template Instance updates its source Template and linked instances only after an explicit impact confirmation. Do not encode propagation mechanics into a compound button label.

### 11.3 Test

Test is disposable runtime state layered over the current authored setup.

Test must:

- not corrupt the authoring checkpoint/history;
- offer visible Reset and Back to Setup controls;
- restore the correct test setup on Reset;
- restore the authoring session on Back to Setup.

### 11.4 Runtime cleanup must prove ownership

When Reset/Test cleanup removes inventory, rewards or spawned objects, do not delete a same-type item merely because it looks related. Use puzzle/object provenance when available; preserve ambiguous legacy data rather than guessing destructively.

---

## 12. Standalone content, Templates and Template Instances

Reuse is explicit. Scene authoring does not silently create or imply a Template relationship.

### 12.1 Three concepts, with only two scene-object states

**Standalone** — a Puzzle or Group owned only by this scene. This is the default for anything created directly in the scene.

**Template** — a reusable Library/source definition. A Template is not itself a placed scene object.

**Template Instance** — a placed scene Puzzle/Group explicitly linked to one Template source.

Do not expose old `copy`, `instance`, `unique` or inferred-library terminology in author-facing UI.

### 12.2 Scene-first authoring is Standalone by default

`New Puzzle` and `New Group` create Standalone scene content.

A Standalone object must not show template-only controls such as Reload from Template or Make Standalone. It may offer **Create Template** as an explicit reuse action.

Never create a Template merely because a scene object exists or because two objects happen to share a definition.

### 12.3 Creating reuse is explicit

`Create Template` creates a reusable source deliberately and asks whether the current scene object should:

- become a linked Template Instance; or
- remain Standalone.

For **Puzzles**, the reusable source is created from the puzzle's explicit saved **Start State**, not whatever incidental gameplay state happens to be visible when Create Template is pressed. If the current setup should become the reusable source, the author uses **Set Start State** first. This prevents solved/intermediate runtime states from leaking into a Template.

For **Groups**, which do not have puzzle runtime progression, Create Template captures the current authored member composition and exclusions.

Neither choice changes the object's world placement.

### 12.4 Placing a Template is explicit

Puzzle Templates and Group Templates are distinct placement categories.

Use the shared right-side picker pattern:

- **Place Puzzle Template -> Puzzle Templates**;
- **Place Group Template -> Group Templates**.

Choosing a Template enters placement mode. Tapping the scene creates a clearly-labelled **Template Instance**. There is no implicit Library mode hidden inside ordinary scene creation.

### 12.5 Template ownership vs instance ownership

A Template owns reusable internal authored content: relative composition, object setup, Zones/Logic/paths, Start State and equivalent Group composition data.

Each placed Template Instance owns scene placement such as its world anchor/marker position. Updating the Template must not move all instances to the source object's world position.

Only properties deliberately designed as per-instance overrides may diverge while the object remains linked. Do not allow arbitrary silent local overrides to accumulate under a Template Instance relationship.

### 12.6 Editing a Template Instance

The UI must clearly label `TEMPLATE INSTANCE · <source>`.

Normal internal edits may be worked on in the bounded edit session, but **Save** must warn that committing will update the source Template and linked instances. If the author wants this scene object to diverge, they choose **Make Standalone** first.

A cancelled propagation confirmation keeps the edit session open; it never silently saves a local override.

### 12.7 Make Standalone

`Make Standalone` preserves the current authored appearance/setup/composition, severs the Template relationship and prevents future source changes from affecting it.

For Puzzles, the detached object receives its own Standalone definition/Start State. For Groups, the current placed member composition remains in the scene and the source link is cleared.

### 12.8 Start State wording follows relationship, not button naming

The action is always called **Set Start State**.

- Standalone -> updates this scene puzzle only.
- Template Instance -> updates the Template Start State after an explicit impact confirmation and propagates to linked instances.

Do not use labels such as `Set Start State + Apply Template`; relationship scope is already known by the system.

### 12.9 Reloading from Template is authoritative

`Reload from Template` exists only for a genuine Template Instance. It intentionally restores reusable authored content from the source Template after current-schema migration. Do not preserve scene-only internal data through a compatibility fallback intended for legacy Reset.

### 12.10 Groups and Puzzles use the same relationship grammar

Where applicable, Puzzle and Group reuse must share the same terms and workflow:

**Standalone -> Create Template -> optional current link -> Template Instance -> Make Standalone**

Do not let Puzzle and Group template systems drift into different meanings for the same controls.

### 12.11 Legacy relationship migration is conservative

When adopting the explicit relationship model, old automatically-linked/inferred scene data must not be treated as proof that the author intended reuse.

For the v1.0.135 migration, all previously placed Puzzles and Groups become **Standalone**. Legacy puzzle definitions that were only *implicitly* treated as templates are not exposed as reusable Templates. A Group Template that was explicitly saved through the old Group Template workflow may remain a reusable Template record, but no placed Group stays linked to it unless the author explicitly places/links one under the new model.

---

## 13. Schema and migration rules

Migration is a first-class engineering concern because the game is being authored continuously while the engine evolves.

### 13.1 Missing is not the same as empty

For modern fields:

- **missing field** may mean "this snapshot predates the feature";
- **explicit empty collection** means "the author intentionally has none".

Do not collapse these meanings.

Example:

- old Start snapshot with no `zones` field -> preserve/migrate known authored Zones;
- modern `zones: []` -> intentionally no Zones.

### 13.2 Migration should be non-destructive

Prefer reading/upgrading legacy data safely rather than destructive one-time rewrites on UI open/render.

### 13.3 Migration must not manufacture authored content from scaffolding

Legacy defaults, disabled placeholders or lazily-created runtime configs are not automatically evidence that the author created a real record.

Example: pre-Zones disabled default respawn configs must not become real Respawn Trigger zones.

### 13.4 New authored records need distinguishable identity

Where legacy synthetic IDs are used for migration, modern explicitly-created records should have stable unique IDs so compatibility filters can distinguish them safely.

### 13.5 Audit all snapshot pathways when adding schema fields

When a durable field is added, inspect at least:

- scene save/load;
- edit checkpoint;
- Undo/Redo snapshot;
- recovery draft;
- Start State;
- Test setup;
- Template;
- linked instance propagation;
- Reload from Template;
- Make Standalone;
- deletion/recreation caches.

Do not fix only the visible Save path.

---

## 14. Puzzle Logic direction

### 14.1 Applied list, not feature catalogue

The Logic tab shows systems/rules actually applied to the puzzle.

`+ Add Logic` presents compatible unapplied systems in the shared picker.

### 14.2 Build toward small reusable primitives

The target runtime model is incrementally moving toward:

**Event -> Conditions -> Actions**

Examples of reusable Events:

- Entry crossed;
- Exit crossed;
- sockets complete;
- object/item interaction;
- item combination;
- Animation Path start/completion.

Examples of reusable Conditions:

- Asset State equals X;
- inventory contains item;
- source/target object matches;
- puzzle has started;
- required interaction/state is satisfied.

Examples of reusable Actions:

- change Asset State;
- consume/remove item;
- create/replace combined item;
- start Animation Path;
- mark puzzle started;
- complete puzzle;
- spawn/enable reward.

### 14.3 Human-readable rules may group primitives

The underlying runtime may use several primitives, but the editor does not need to expose every micro-action separately.

A meaningful rule such as `Repair Handcart` may present a readable grouped configuration backed by reusable Event/Condition/Action records.

### 14.4 No visual node editor yet

Do not build a node graph until several real puzzles are faithfully represented by the reusable data/runtime. The future editor should visualise a proven logic model rather than invent the model through UI.

---

## 15. Asset States and Puzzle Logic

Asset Lab defines **what a state is**. Puzzle Logic defines **when state changes happen**.

For example, Handcart Asset States may define:

- Broken;
- Repaired / Pushable;
- Landed / Bridge.

Those states own their visual/collision/push/support behaviour.

Puzzle Logic should express transitions such as:

- use repaired wheel on cart -> Broken to Repaired;
- Animation Path completes -> Repaired to Landed.

Do not duplicate the state's appearance/collision/pushability inside Puzzle Logic.

This same system should later support gates, machines, bridges and other stateful environment objects.

---

## 16. Animation Path direction

The current Cart Path is treated as the first specialised consumer of a future reusable **Environment Animation Path**.

A reusable Animation Path should eventually have:

- explicit target object;
- authored path/spline;
- activation Event/Condition;
- playback/takeover behaviour;
- speed/profile/curve controls where appropriate;
- explicit completion Event;
- explicit end/settle state.

Path authoring and higher-level puzzle Logic remain separate: the path defines **how the object moves**; Logic defines **when and why it runs**.

---

## 17. Spatial systems and support rules

### 17.1 Authored support vs procedural placement

Manual/authored Ground placement may use authored Support Surfaces.

Procedural biome placement remains terrain-only unless the architecture is deliberately changed later. Procedural dressing must not unexpectedly climb onto authored puzzle/support geometry.

### 17.2 Spatial collections use stable records

Zones, exclusions, triggers and similar volumes use stable IDs, authoritative lists and selected-record inspectors.

Avoid hidden special-case spatial data living separately from the collection merely because an older implementation did so.

---

### 17.3 Terrain is a first-class authoring context

Terrain authoring belongs inside the shared Edit workspace, not in an unrelated settings/debug popup. It should reuse the editor drawer, bounded authoring session, shared Undo/Redo and explicit Save/Discard grammar.

The Terrain context is allowed one deliberate exception to the normal edit-mode input lockdown: **horizontal character locomotion remains available** because the character is the most useful terrain-authoring cursor. Outside-context scene objects remain protected and non-pickable while Terrain Edit is active.

### 17.4 Follow Player is the default Terrain Section selection model

SideScroll's camera keeps the character centred during normal traversal, so the efficient terrain workflow is to edit while walking. With **Follow Player** enabled, the active fixed 10 m Section is derived from the character's world position and updates as the character crosses Section boundaries.

Manual Section navigation remains available for targeted work. Manually choosing previous/next locks the selected Section by disabling Follow Player until the author explicitly returns to Player/Follow mode. Selection/navigation preferences are editor state; they are not authored terrain dirtiness.

### 17.5 Base Sections own shape, not every terrain concept

Fixed Terrain Sections are world-space structural units. They own base physical terrain properties such as path height, depth-strip heights/modes, collision/visibility and other truly section-local shape data.

Do not make numbered Sections into Templates, and do not move a numbered Section with a Puzzle. Reusable terrain presets may be added later without changing Section identity.

The existing depth "smoothing" behaviour is specifically **depth detail falloff across the near/mid/far strips**: farther strips receive progressively less small-scale vertical variation. It is not interpolation/smoothing between neighbouring Sections. This effect must be explicit and author-controllable rather than treated as an invisible aesthetic rule.

The Stage 2 control is one global **Depth Detail Falloff** master. `100%` reproduces the historical Far A/Far B averaging and follow attenuation exactly; `0%` keeps Linked depth layers on the authored Path profile before their authored offsets. Missing legacy data migrates to `100%` so loading an older scene cannot silently change its terrain silhouette. Split per-layer controls should only be added if real authoring proves the master control insufficient.

**Flatten Depth Toward Path** is a Section-local authoring operation, not another smoothing algorithm. It moves the selected Section's Near/Far A/Far B resolved heights part-way toward the Path height while retaining each strip's existing Linked/Explicit mode. It must be reversible through shared history and must preserve the support offsets of terrain-bound authored objects.

### 17.6 Terrain Surface Regions are continuous world-space data

Ground texture/material transitions must not be constrained to 10 m Section boundaries. Terrain Surface Regions should use the same broad spatial grammar as Biome Regions/Transitions: explicit world-space ranges with an authored blend span between surface A and surface B.

World Lab is the macro placement/overview for these regions. Terrain Edit may expose the same start/end/blend handles in-world for visual fine-tuning. Both tools must edit the **same underlying Surface Region records**, never duplicate transition data.

Prefer a shared/general region-transition foundation with Biomes where practical rather than copying two independent implementations. Runtime blending should keep the active surface set bounded; normally only the two surfaces participating in the current blend are needed.

### 17.7 Terrain Features are local modifiers with explicit ownership

Rivers and future local terrain variations that need to move with authored content are **Terrain Features / modifiers**, not travelling Terrain Sections. A Terrain Feature can be standalone in the world or owner-relative to another authored object such as a Puzzle.

The current Broken Bridge river already demonstrates the correct ownership direction through a puzzle-owned `worldModifier`: its position is relative to the Puzzle marker and therefore follows the Puzzle. Generalise that proven mechanism rather than replacing it with puzzle-specific section mutation.

Moving/removing an owner-relative Terrain Feature should reveal the unaffected base terrain underneath. Ownership and precedence between base terrain and modifiers must remain explicit and deterministic.

### 17.8 World Lab and Terrain Edit are two scales over shared truth

World Lab answers **where broad world structures and transitions live**. Terrain Edit answers **how the ground looks/behaves here while standing in it**. Low-level terrain editing should not be duplicated independently in World Lab, and macro region planning should not be reimplemented as separate Terrain-only data.

When both tools expose a concept such as a Surface Region transition, they are alternate views/controllers for one shared authored record.

## 18. Performance rules

Phone performance and stability must shape implementation.

### 18.1 Keep heavy work out of hot render loops

Migration, validation, deep-copy/history creation and DOM rebuilding belong at load/edit/transaction boundaries, not per rendered frame or per rendered object.

### 18.2 Cache frame-level derived data

If many objects consume the same derived data, compute/flatten it once per frame or once per relevant authoring change rather than rescanning collections for every object.

### 18.3 UI rebuilds are state-driven, not frame-driven

Use signatures/dirty flags/stable DOM where practical. Do not reconstruct editor lists every frame.

### 18.4 Avoid unnecessary expensive visual effects

Prefer predictable mobile-safe UI/rendering costs over desktop-style heavy blur/effects.

---

## 19. Dangerous actions

Delete, clear, reset, detach, dissolve, template application and other destructive/high-impact actions must be explicit.

Rules:

- name the scope clearly;
- separate destructive utilities from normal authoring controls;
- confirm irreversible or wide-propagation actions when appropriate;
- do not use an innocent label for a much larger operation;
- preserve Undo when feasible;
- do not place workshop/destructive utilities as though they are everyday puzzle actions.

Example: `Clear Puzzle Workshop` is intentionally named as an advanced destructive utility rather than ordinary `Clear Stage`.

---

## 20. New feature checklist

Before implementing a new engine/editor feature, answer these questions.

### Purpose / reuse

- What problem does this solve?
- Is there already a system with the same workflow or data responsibility?
- Is this genuinely puzzle-specific, or a reusable engine primitive?
- Are we generalising from proven behaviour or inventing a framework prematurely?

### Ownership / data

- Who owns the authored data: World, Group, Puzzle, Template, Asset or Global setting?
- Does every authored record have a stable ID?
- How are references represented?
- What is authored state vs runtime/test state vs editor-only state?

### Editor workflow

- Is this Management or internal Edit functionality?
- What is the authoritative list/hierarchy?
- What is selected?
- What inspector/details surface edits it?
- Is there one active sub-tool?
- If it is a collection, does it use the shared **applied list + Add button + right-side picker** pattern?
- Are equivalent controls consistent with existing tools?

### Transactions / persistence

- What constitutes one Undo action?
- Does it participate in Save/Discard?
- What does Reset do to it?
- What does Set Start State do to it?
- What does Test do to it and how does Back to Setup restore authoring state?
- How does it behave as Standalone content versus a Template Instance? What belongs to the Template and what remains per-instance?
- Does recovery/crash draft include it?

### Migration

- What happens to existing projects that predate this field?
- Does missing mean legacy/unknown while explicit empty means intentional none?
- Could an old default/scaffolding record be mistaken for authored content?
- Have all snapshot/template paths been audited?

### Touch / UX

- Can it be operated comfortably on an iPhone in landscape?
- Does any gesture depend on DOM being rebuilt during the gesture?
- Are targets large enough?
- Can a stable slider/relative drag replace tiny perspective handles?
- Does scrolling conflict with drawer/viewport movement?

### Performance

- Did this add work to a per-frame/per-object hot path?
- Can data be precomputed at edit/load boundaries?
- Is UI rebuilding dirty/signature driven?

### Validation

- Which existing puzzles/features are the regression cases?
- Which legacy save/template case must be tested?
- Which iPhone interaction is most likely to fail?
- Has JS syntax/static validation run?
- Has documentation been updated?

A feature is not finished merely because its happy-path UI works.

---

## 21. Release discipline

### 21.1 Phone-first patch workflow

SideScroll releases remain flat changed-files-only patches suitable for the phone-only GitHub Pages workflow.

Use short names such as:

`SS-PATCH-<version>.zip`

Include a short README describing:

- scope;
- changed files;
- compatibility/migration notes;
- focused iPhone checks.

### 21.2 Validate before release

At minimum:

- syntax-check every JavaScript file;
- check HTML control IDs/wiring when UI changed;
- check for duplicate IDs;
- check archive integrity;
- inspect the exact changed-file set;
- review the final diff for semantic regressions.

Use additional static checks where useful, but do not mistake static validation for device testing.

### 21.3 Never claim device testing that did not happen

ChatGPT can statically validate code, but only the user's real device testing verifies the actual iPhone/Safari/PWA interaction.

Release notes must say so plainly.

### 21.4 Update documentation with the same change

When a patch establishes a durable rule, update this Bible in the same workstream.

When a patch creates/fixes/removes work, update `SIDESCROLL_TASKS.md` so the backlog describes reality.

---

## 22. Testing / regression policy

For now, focused regression checks live in `SIDESCROLL_TASKS.md` and release READMEs.

As the number of permanent regression cases grows, create a dedicated `SIDESCROLL_TEST_MATRIX.md` rather than allowing evergreen tests to disappear into historical task entries.

Threshold for splitting it out: when recurring checks span enough systems that a release can no longer answer "what must always still work?" from a short checklist.

Likely permanent regression families will include:

- editor drawer/touch interaction;
- Save/Discard/Undo;
- Start State/Test/Reset;
- Standalone / Template Instance semantics;
- schema migration;
- Fallen Tree;
- Stone Wall;
- Broken Bridge;
- World Groups;
- support-surface placement;
- procedural dressing exclusions;
- PWA/cache/update behaviour.

---

## 23. Future documentation thresholds

The documentation set is intentionally kept small. Create a new Bible/reference only when a discipline becomes large enough to deserve its own durable rules.

### QA / Test Matrix — likely next documentation split

Not required immediately, but likely useful as permanent regression coverage grows. This should contain evergreen expected behaviour, not active bug tasks.

### Audio Bible — only when audio becomes a real production discipline

If music, ambience, SFX, mixing, ducking, spatialisation and asset-delivery rules become substantial, create a dedicated Audio Bible. Until then, audio engineering rules can live here and creative direction can live in Design/Art documentation as appropriate.

### Data / Schema Reference — split only if the schema becomes difficult to understand from code + this Bible

Current ownership/migration rules belong here. If persisted project schemas become numerous or externally authored, create a concise schema/reference document rather than turning this Bible into field-by-field API documentation.

Do not create extra documents merely to make the project look organised. Split only when the information has a distinct audience, lifecycle or maintenance need.

---

## 24. Current documentation completeness assessment

With this Bible added, SideScroll has a coherent documentation layer for:

- **Game intent / story / progression** — Design Lab;
- **Visual direction / production art** — Art Bible and asset pipeline;
- **Visual exploration** — Concept Lab;
- **Asset definitions / states / collision** — Asset Lab;
- **World structure / placement planning** — World Lab;
- **Engine / editor / UX architecture** — this Bible;
- **Active development and known issues** — `SIDESCROLL_TASKS.md`;
- **Per-release change record** — release README.

That is enough documentation to continue building the game coherently without adding another major document now.

The main future gap to watch is **evergreen QA/regression coverage**. When it outgrows the task list, promote it into `SIDESCROLL_TEST_MATRIX.md`.

---

## 25. Rule for evolving this Bible

This is a living standard, not a frozen specification.

When real development proves a rule wrong:

1. change the implementation deliberately;
2. update the rule here;
3. update active tasks/release notes;
4. remove or supersede stale conflicting guidance.

Do not keep obsolete rules for historical interest. History belongs in releases/tasks; this Bible should describe the **current way SideScroll is built**.
