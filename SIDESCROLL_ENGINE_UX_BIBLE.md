# SideScroll Engine & UX Bible

## v1.1.18 — Skin Joint Fit remains a *single opt-in step*

Do not change the accepted rectangular binary weighting model while testing joint seams. Add **Joint Fit: On/Off** inside the existing Skin bone-influence controls instead of another skinning workspace. Rest-linked sequential bones must calculate **one common** mitred boundary using their authored rest joint angle, rather than each side having an independently moved square cap. Remain 100%/0% ownership, with at most one bone controlling each vertex and unclaimed vertices staying at rest; no automatic blending, smoothing or posed-frame reassignment. A connected cap stays anchored to the joint: explain that Local X size/offset controls free ends while Local Y scale affects the shared mitre width. Allow Undo/Redo, Save/Discard, explicit opt-in and a reliable Off comparison with previously saved independent rectangles. When posed, guide shape moves rigidly with its selected bone, as do vertices; it is not dynamically fitted again using posed anatomy. Preserve original Fox and never alter the asset/source mesh. Do not proceed to Stage 2 soften without iPhone validation.

## Skin influence guides must follow the previewed rig pose (v1.1.17)

Skin authoring controls belong in **rest/bind-local coordinates** even while users preview Walk/Run deformation. Draw their viewport gizmos in the **currently shown pose** using the same geometric transform as skinned vertices: a selected bone's local rectangular guide must follow that bone's translation and rotation, including nonzero authored X/Y offsets, without changing its width or height when IK changes limb length. Do not use preview pose coordinates to **recompute** bind-pose influence, or silently alter saved weights. Ensure a Rest → Walk/Run → Rest preview round-trip leaves both the binding and original rest-space region unchanged. Validate guide geometry and actual deformed geometry together.

## v1.1.3 Atlas topology UX rules (20 October 2026)

- **Preview before committing** any procedural source mesh. Mesh generation uses the same final vertices/triangles in the preview; numeric settings and spline control handles must update immediately and remain unsaved until an explicit Commit. Users can cancel without changing the character. Reopen procedural settings on an authored mesh through a safe Regenerate action, never force Delete/Recreate merely to change subdivisions. Warn if regeneration will replace manually modified source vertices/faces; preserve mesh ID/name, storage separation, and explicit Save.
- **Shape creation and topology editing are separate concerns**: create a rectangle, closed outline or strip; then edit generated source vertices or use explicit Connect (shared-diagonal flip of adjacent faces only), Split face, Trim face. Do not imply Connect works across arbitrary mesh spans or that auto triangulation always produces production-clean topology.
- **Selection hierarchy:** The default Atlas editing level is `Select / Move`, selecting any visible mesh by its actual filled triangles (not only its bounding rectangle) and allowing source-wide translation of editable unlocked meshes, including duplicates. `Vertices` is an explicit detail mode for manipulating individual source vertices. Never confuse Atlas source-pixel movement (moves UVs with source geometry) with assembled-character transform controls in Parts. Repositioning an authored source mesh must translate its saved generator controls as well so reopening Regenerate does not snap it back. A completed whole-piece drag is one Undo/Redo transaction; cancel/pinch interrupts must revert uncommitted changes.
- **Undo correctness**: one completed vertex drag/face edit/Regenerate must be one actual history entry and immediately update enabled controls. A canceled pointer gesture must not leave an uncommitted vertex move. Temporary previews should never become dirty data or be exported before explicit Commit.
- No Atlas change may alter or migrate the existing assembled Parts workspace, legacy Fox deform/skin structures, animation clips, or external gameplay. Source geometry and UV coordinates are still one pixel-space representation; keep skin/render conversion an explicit later stage.


## v1.1.2 Atlas UI + release maintenance checkpoint (20 October 2026)

- Atlas-specific inspector groups are **Navigate**, **Create mesh**, **Edit selected mesh**, followed by Source meshes; the global Display panel remains suppressed only for Atlas and keeps its existing controls untouched elsewhere. The mesh list grows in the normal inspector flow for 1–14 entries, avoiding the separate 96/140px scroll trap; with 15+ entries it can scroll independently within a bounded 520px height. Mobile external inspector scrolling remains the responsibility of the existing layout.
- Alpha backdrop and new All/Selected/Off wireframe visibility are **browser-local view preferences**; do not write the authored Atlas document, part layout, legacy geometry, rig or animation when toggling them. Selected mesh wireframes are muted/thinner, never texture-tinted.
- Source geometry can be authored with rectangle cell subdivisions, smoothed closed-outline triangulation, or tapered centreline strip; topology stays `{vertices,triangles}` over source-image pixels and **there is no separate UV editor**. Selection is deliberately different from editing (tap name then choose Vertices). Rename/duplicate/delete are Atlas-only operations with Atlas Undo; legacy Fox meshes remain read-only.
- **Required release workflow:** update repository-root `README.md`, `README.txt`, versioned `README-PATCH-<version>.md`, and all affected canonical docs in every changed-files-only ZIP. **Every README shipped in a patch must cover only that particular drop — never accumulate summaries or instructions from older releases.** Earlier versions may be named only where necessary to explain prerequisites or compatibility. Bump the SW cache and HTML asset query for changed JS/CSS. Do not add unchanged files as padding.


## Atlas preview separation — v1.1.1 (20 October 2026)

For Atlas mesh authoring, default transparent pixels to a **dark, solid preview background** and offer checkerboard as an optional view preference. **Never flatten or replace the underlying PNG alpha.** Keep thin wireframes and use distinct colour for selection, without opaque/semitransparent mesh faces hiding art; show edit handles only in vertex-edit mode. The character-assembly **Display** panel is not applicable in Atlas: hide it in Atlas and restore unchanged in other stages. Atlas view settings must remain independent of editable character data, Save, Undo and export.

### v1.1.0 Atlas Stage A — implemented boundaries (20 October 2026)

Atlas is now the leftmost stage, before untouched Parts. It renders on its own texture-space 2D canvas; assembled layout remains the existing Parts system. Inspecting image/legacy Fox meshes, hide/solo/lock and viewport pan/pinch should never change a character working copy. Only explicit Apply/vertex changes create an undoable Atlas document edit; core Save/Discard handles its independent session participant. The UI's legacy Fox mesh overlay is read-only and calculated from the existing deform renderer without writing back its bind/skin data. Source rectangles store only pixel positions and triangle indices and derive UVs from image dimensions; there is no second UV manipulation mode. This is test-only initial Atlas authoring, not general Parts/Skin integration. IndexedDB PNG bytes currently lack portable export/restore: users must retain original PNG files until this is completed.


**Project:** SideScroll / Aureli  
**Status:** Authoritative living engineering and editor-design reference  
**Established:** October 2026  
**Scope:** Runtime architecture, authoring architecture, data ownership, persistence, migration, editor UX, touch interaction, performance discipline, testing and release workflow.

---

## Editor primary actions and scroll confinement (19 Oct 2026 / v200)

Dense feature menus must open in response to deliberate actions, not occupy the first screen of the editor. Character Library presents New, Load and Save before opening their secondary forms/lists/management options. **All characters must be opened and saved through these same controls** (built-in Hero 1/2/Fox and locally authored), with a persistent visible loaded-character name/status. Do not maintain a separate permanent set of native-character buttons alongside a new custom-character picker. Underlying storage remains separate until an explicitly planned migration; do not rewrite native saved data merely to unify its menu. Keep one visible contextual panel at a time. Reuse existing session-saving, undo and dirty guards rather than creating parallel state. An editor's vertically scrolling inspector must be horizontally fixed; nested content should not create sideways panning or document-level movement on iPhone. Context changes must not silently alter saved authoring data. v200's phone gesture behaviour remains to be validated on-device.

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

### 8.6 Collapsible inspector sections

Long editor drawers and inspectors should use one reusable collapsible-section pattern so phone users do not have to scroll past controls that are irrelevant to the current task.

Rules:

- the section heading is the stable expand/collapse target and exposes `aria-expanded`;
- collapsing a section is editor-only view state: it must not exit the authoring context, alter selection, dirty authored data, clear Undo/Redo or trigger Save/Discard;
- the control DOM inside a collapsed section remains owned by that context and should not be destructively rebuilt merely because the section is hidden;
- collapse state may be remembered as editor preference, but authored game data must never depend on whether a section was open;
- use the same visual affordance and interaction grammar across Anim Lab, Asset Lab, Puzzle/Group inspectors, Terrain and later migrated editor panels rather than inventing feature-specific accordions;
- do not collapse the primary continuous work surface itself (for example an active viewport or authoritative animation timeline) merely to satisfy this rule. The pattern is for inspector/categories around that work surface.

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

For reusable **World Group** composition, member height semantics are part of the reusable authored setup. Ground members re-sample terrain at their own placed X/Z while preserving their authored floor offset. Free members likewise preserve their authored **local terrain-relative floor offset at that member's own X/Z**; do not reference Free-member height only to the Group anchor's ground height. A wide building group may span changing terrain, and group-anchor height would make roofs/platform-like dressing drift away from the member beneath them. This remains a placement rule, not a persistent child/parent support relationship. Legacy group-anchor offsets may be read only as a compatibility fallback when no local offset exists.

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

Ground texture/material transitions are not constrained to 10 m Section boundaries. Terrain Surface Regions use the same broad spatial grammar as Biome Regions/Transitions: a default surface followed by ordered world-space A -> B blend ranges with explicit start/end keys. Surface data remains its own authored collection rather than becoming a property of Biome or Section records.

World Lab is the macro placement/overview for these regions. Terrain Edit exposes the **same stored transition records** as in-world start/end handles for visual fine-tuning. Both tools edit one source of truth; never copy a World Lab surface transition into separate Terrain-only data.

The transition chain is deterministic: records are ordered by world X, the `from` surface of each transition is derived from the surface established before it, and blend ranges may not overlap. This allows a sequence such as Dirt -> Rock -> Snow while leaving arbitrary solid spans between blends.

Runtime rendering must keep the active surface set bounded: use one surface outside a transition and only the two participating surfaces while blending. Surface definitions are referenced by stable IDs so their visual texture implementation can be replaced or expanded without rewriting authored range data.

Surface definitions should own author-facing visual metadata as well as the runtime asset reference: a stable ID, label, representative colour, preview/runtime texture and short description where useful. **Do not encode texture filenames into Surface Region records.** World Lab should provide visual material previews when the library contains multiple similar surfaces; names alone are not sufficient for fast phone authoring. Preview UI is a view over the Surface definition library and does not create separate authored material state.

The World Lab Surface timeline should visualise the **actual blend** inside an A -> B transition, not only label it or substitute representative colours. Display the `from` texture as the base and progressively reveal the `to` texture from 0% at Blend Start to 100% at Blend End, while keeping handles/selection affordances readable above it. This is presentation only; the authored transition remains the same start/end record used by Terrain Edit and runtime rendering.

Changing/replacing the art behind an existing stable Surface ID is allowed when the semantic material remains the same (for example upgrading a placeholder `rocky-ground` implementation to production Rocky Gravel art). Add a new Surface ID when the material is meaningfully different or when replacing it would silently restyle existing authored terrain in an undesirable way.

World Lab owns creation/deletion and broad arrangement of Surface Blends. Terrain Edit is the in-world fine-tuning view: it may move the same start/end keys and must include those edits in the normal Terrain Undo/Redo/Save/Discard transaction model.

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

Release documentation is a **required changed-file deliverable**, not a separate optional handover:

- **Always update the repository-root `README.md`** as a concise summary **solely of the current drop**: its changes, installation parent, directly relevant compatibility/safety notes and immediate limitations. **Replace**, do not append to, the previous release summary.
- Update the repository-root `README.txt` as a short **current-drop-only** pointer (version, purpose and versioned notes link). Do not roll earlier patch summaries into it.
- Include a **versioned** `README-PATCH-<version>.md` documenting **only that release**: its changes, actual changed-file list, relevant migration/compatibility notes, and focused iPhone checks.
- The only references to older releases in any release README should be **required installation prerequisites or directly relevant compatibility context**. Do not duplicate historical release notes, past feature catalogues or unrelated old instructions. Keep ongoing design, tasks and persistent technical rules in their canonical documents instead.
- Include these updated readmes in that release's flat changed-files-only ZIP. Historical `PART_LAYOUT_README.md` and `ROLLBACK-README.md` are specialised records; update them only when their instructions actually change.

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
### Multiple playable rig families

Playable character variants may use different skeleton/rig families. A variant declares its rig type; SideScroll selects the matching geometry, atlas, locomotion clips and collider rather than assuming every playable character is a texture swap on the humanoid skeleton.

Rules:

- shared character selection/persistence may list variants from multiple rig families;
- each rig family owns its own atlas part map, geometry, clips and default collider;
- gameplay movement remains shared unless a character explicitly needs different mechanics;
- humanoid-only pose helpers such as hand carry/push posing must not be applied to quadrupeds;
- a specialist editor may intentionally support only the rig families it can actually author, and should filter unsupported variants rather than loading them incorrectly;
- first-pass cutout art should retain an authoring source/joint map so pivots and cut seams can be revised without re-deriving the rig from scratch.

### Anim Lab ownership and edit-session rules

`walk-lab.html` remains the stable route for bookmark/offline compatibility, but the tool is now **Anim Lab** and may host more than one rig family.

Rules:

- editor character selection is editor/session state and must not silently change the character selected in Play;
- rig-family adapters own atlas drawing, geometry, default poses, clip storage and collider ownership; the editor must never mix one family's geometry with another family's atlas;
- Hero 1 and Hero 2 retain the established shared human animation bank unless a later migration is explicitly designed; Fox clips retain their own rig-family namespace; from v1.0.152, an explicit Anim Lab Save compiles the Fox Walk/Run/Jump working copy into that runtime-readable bank, while Play falls back to built-in Fox clips if the bank is absent or invalid;
- opening, scrubbing, playing, fitting, panning, pinching, switching view overlays or inspecting a control must not persist authored data;
- every Character -> Clip -> Mode context has a bounded working copy with an explicit checkpoint; Undo/Redo operate on that working copy and Save/Discard are the only intentional commit/restore actions;
- leaving a dirty context, including leaving Anim Lab for Home, must offer Save / Discard / Cancel rather than relying on accidental navigation;
- editor touch surfaces and control DOM remain stable while a gesture is active; no control panel should be rebuilt per animation frame.



### Atlas-first 2D mesh authoring invariant — approved v1.1.0 target (20 Oct 2026)

The character workflow becomes **New / Load → Atlas → Parts → Rig → Skin → Animate → Play**. **Atlas** is a new stage; **Parts already exists and must not be duplicated or redesigned**. Atlas is a single 2D texture-background/mesh-overlay editor, **not** a second independent UV editor. Vertex positions over the atlas define both mesh topology/shape and sampled UV locations; derived UV values may be stored/rendered internally, but there must not be an author-facing separate UV mode or adjustment layer. Rectangle, silhouette/outline-spline and centreline/spline-strip tools are candidate geometry constructors in this same view.

All previously authored meshes (including loaded Fox meshes) must appear in atlas-space with named selection and temporary Show/Hide/Solo. Mere inspection, switching stage, pan/zoom, and temporary display toggles must not mutate the authored mesh or storage. **Atlas edits source geometry/texture mapping; existing Parts edits assembled-character placement/pivot/order; Rig edits rest joints; Skin edits weights/binding; Animate edits clips**. Do not silently couple or migrate these layers. Topology rebuilds may require explicit weight remapping/rebind with safety preview; no implicit loss of custom weights, identity, clips or accepted source pixels.

Imported atlas **image bytes** are part of the project, not just a file name/path: new binary persistence must also be covered by single-character export, All Anim Lab Data and global export/restore before claiming a portable custom character. See `SIDESCROLL_CHARACTER_AUTHORING.md` for the complete design and `SIDESCROLL_TASKS.md` for delivery gates. **Design approved; unimplemented at v1.0.205.**

### Authoring stages and unified Display — global UI rule (18 Oct 2026; design, not implementation)

**Full canonical design:** `SIDESCROLL_CHARACTER_AUTHORING.md` → **Approved next design — coherent character-authoring workflow**. This Bible defines only the cross-editor invariant; do not duplicate part-by-part specifications here.

- Every authoring surface distinguishes **editing target** (Character / Atlas [planned v1.1.0] / Parts / Rig / Skin / Animate / Play) from **Display** (art/opacity, static red reference/opacity, motion ref, bones, mesh, ground, bind proof). Display controls share one consistent location and never dirty authored character data.
- Different editing modes own distinct data. **Parts** may arrange/scalе/rotate artwork without joint changes; **Rig** moves rest joints while displayed artwork remains frozen; **Atlas** edits source 2D mesh/texture-space geometry while all assembled transforms remain fixed; **Skin** edits weights/bind without altering atlas geometry; **Animate** evaluates completed binding but does not alter structural rest data. Leaving a stage can preview re-enabled skinning; publishing/rebinding a new rest state is an explicit reversible Save decision.
- Named selectable list left; pad bottom-right; pan/pinch independent; touch selection must not unintentionally drag parts or joints. Stage inspector is context-sensitive; the animation timeline belongs with Animate rather than crowding layout work.
- Draw order is character authoring data; editor-only Solo/Hide, opacity, comparison references and overlays are view state. One gesture is one Undo action; Save/Discard/Cancel applies at all editing stage boundaries.
- Existing documented Asset Lab principles (shared dark grammar, collapsible sections, reusable property controls, template/bespoke ownership) should be applied as reusable UI/system primitives, not copied ad hoc into a Fox-only editor.
- For any art/atlas change, **never change rig, mesh bind, part layout or animation as an implicit dependency**. Validate the source texture, destination rectangles/alpha and one-to-one intended file changes before packaging. No historical fallback atlas/renderer should become authoritative unless the user explicitly approves it.
- **Implementation status:** v1.0.191 is the **user-confirmed working baseline**. v1.0.192 is a bounded P1 Parts tools test patch (not yet iPhone accepted). Its Hide/Solo remain temporary display state, order and transforms are authored Setup data, and Parts uses neutral unskinned mesh vertices. v1.0.192 does **not** yet freeze art while editing joints in Rig, rebind skin, implement Character creation, or provide a unified Display panel. See Character Authoring and Tasks for gates.

### Anim Lab Control Board and precision-edit rules

Stage 2 adds rig-provided anatomical controls without changing the edit-session ownership above.

For phone ergonomics, selection and manipulation may deliberately occupy opposite thumbs: the labelled Control Board remains in the left drawer while the large relative precision drag surface may sit as a stable bottom-right viewport overlay. Moving that pad does not change gesture ownership: one pad drag is still one edit transaction and viewport pan/pinch must not steal an active pad gesture.

Rules:

- the Control Board exposes named anatomical controls supplied by the active rig family; large tap targets are the primary selection path, so precise viewport bone picking is not required on phone;
- one precision-pad drag is one bounded edit transaction: pointer-down captures the original value, pointer-move previews only, pointer-up commits one Undo step, and pointer-cancel restores the original snapshot;
- Move / Rotate, Fine and X/Y axis constraints change how the selected control is edited but do not create independent persisted state;
- Rig owns per-character scale/reference data, rig-family collider setup and (where supported) structural rest-rig data. The legacy internal mode key may still be `setup`. Character scale is gameplay-facing character-definition data: explicit Rig Save must persist it for the selected character and Play must apply it without changing animation channels;
- Hero 1 ghost, ruler/ground, Bones, Art, Planes and Collider are view/reference overlays only and must never dirty authored data; Anim Lab should use the same dark panel/button/range/viewport visual grammar as Asset Lab so specialist tools feel like one editor family;
- Rig values use the same Save/Discard/Undo transaction model as animation edits. Collider and structural-rig persistence may use family-owned keys only on explicit Save;
- Stage 2 does not introduce sparse key poses, tweening, mirroring, IK or curve editing. Those belong to later stages and must not be smuggled into the Control Board implementation.

### Anim Lab sparse key-pose timeline rules

Stage 3 makes sparse authored key poses the Anim Lab editing source while preserving the existing sampled runtime contract.

The Anim Lab timeline presentation follows one authoritative transport model:

- the main 16-sample animation scrub/play transport lives directly below the viewport and is the authoritative character timeline;
- the Key Pose lane sits immediately below that transport, uses the same 0-15 sample positions and selection, and is a marker/editing lane rather than a second playback clock;
- Motion Reference has its own cycle transport only while explicitly **Unlinked**, because independent source scrubbing is required for alignment. When Linked, the separate reference transport is hidden and the reference follows the main normalised cycle phase;
- timeline controls should remain visible while the drawer scrolls so playback/scrubbing does not require leaving the viewport work area.

Rules:

- existing 16-sample human/Fox clips import losslessly into an in-memory sparse-key representation; merely opening or previewing that import must not write storage;
- a pose edit on a tweened sample explicitly promotes that sample into a key pose, and the complete gesture remains one Undo transaction;
- key markers own an integer sample position (0–15), a short editable name and a full rig-family pose; the editor may tween between fewer keys, but Save still compiles exactly 16 samples for the current runtime architecture;
- add/duplicate/move/delete/copy/paste/mirror/phase operations edit the bounded working copy only and participate in the same Save/Discard/Undo/Redo rules as Control Board edits;
- mirror behaviour is rig-family-owned: human mirror swaps the paired A/B hand/foot channels and planted label, while Fox mirror swaps near/far limb channels without substituting another rig family;
- phase offset/cycle operations move key positions around the 16-sample loop without changing world movement architecture;
- conversion/reduction previews are view-only: they may be scrubbed and played but cannot be edited or persisted until explicitly Adopted; exiting preview restores the authored key track untouched;
- before the first Stage 3 Save of a family/clip, retain a sampled backup so legacy data can be recovered;
- Stage 3 does not introduce FK/IK planted targets, contact-track solvers or graph curves. Fox runtime clip consumption was enabled later in v1.0.152 without changing the sparse-key authoring contract.

### Native range controls on iPhone
- With `viewport-fit=cover`, edge editor columns must reserve `env(safe-area-inset-left/right)` in the column/panel layout, not only in the top bar. Preserve the normal visual gutter in addition to the hardware inset.
- Do not apply custom drag-cancel semantics to native `<input type="range">` controls. Mobile Safari may report `pointercancel` as part of an otherwise intentional native range interaction; the native value is authoritative and should be committed. Custom precision surfaces may retain cancel/restore behaviour because the app owns those gestures.
- Do not assume Mobile Safari will always deliver an intermediate `input` callback before a native slider gesture ends. Every normal end path (`pointerup`, `change`, `blur`, or `pointercancel`) must explicitly read the control's current DOM value into the authored working copy before the edit transaction is committed. A slider thumb must never be able to move visually while authored state remains unchanged.

### Anim Lab active-context visibility (v1.0.149)
Anim Lab must have one visible editing context at a time. Elements marked `hidden` by the Animate/Setup state machine must remain `display:none` regardless of generic section layout rules. Do not allow author CSS such as `.animlab-section { display:flex; }` to override the semantic `hidden` attribute; the active mode owns both visibility and dirty-state scope.

### Anim Lab motion-reference packs (v1.0.150)

Motion Reference is an editor-only Anim Lab facility, not character artwork and not runtime rendering data.

Rules:

- reference packs are data-driven and declare which rig families they support; the first pack supplies quadruped Walk and Run/Gallop, while future biped packs must plug into the same interface rather than creating a second reference system;
- source images in one sequence keep one fixed crop/alignment. Do not individually recrop or rescale poses to make them appear to line up;
- linked comparison is driven by normalised cycle phase `[0,1)`, never by key number or source-image count;
- selected reference poses retain their source phases/holds and must not be redistributed to equal timing merely because there are fewer selected images;
- phase zero may be arbitrary. A saved Phase Offset aligns a useful source event to the authored character cycle without rewriting either sequence;
- the reference is rendered in a dedicated underlay layer behind character art/bones and uses the world/grid view transform, so viewport zoom/pan remain coherent and character Rig scale does not silently rescale the source reference;
- opacity, reference scale, X/Y placement, gait/source selection, link state, lock state and phase offset are editor working data saved per character + clip through Anim Lab's explicit Save/Discard guard;
- reference playback position itself is transient preview state and does not dirty or persist;
- reference settings live in their own storage namespace and must never be read by gameplay rendering;
- large reference PNGs are cache-on-demand assets, not service-worker install-shell assets. Code/manifest remain available offline; individual gait imagery becomes offline-capable after it has been fetched once;
- the old Hero 1 ghost is a **Scale Reference**, not a motion reference. Keep these concepts visually and architecturally distinct;
- changes to a reference overlay and changes to authored animation should remain separately reviewable. Adding or tuning a reference pack must not modify character clips implicitly.

### Anim Lab structural Rig Designer (v1.0.151)

Anim Lab now distinguishes **character construction** from **animation posing**. The visible editor mode is `Rig`; the legacy internal mode key may remain `setup` for storage/compatibility, but UI and ownership should describe it as Rig.

Rules:

- a rest rig is gameplay-facing character-definition data. Joint/socket positions and derived bone lengths belong to the rig family and change the character globally only after explicit Rig Save;
- animation keys never own rest-joint positions or bone lengths. Animate transforms the saved rest rig; Rig edits the structure that every clip is evaluated against;
- the first quadruped topology is Rear Body -> Mid Root -> Front Body -> Neck -> Head, with explicit four limb sockets, knee/hock joints, paws and tail-chain points. Mid Root is a structural spine/root point, not merely an artwork pivot;
- front and rear torso sections must remain separately poseable in Animate so chest/pelvis motion can be authored independently before IK/contact solving is added;
- installing a structural-rig migration must preserve the previous visible/runtime geometry by default. New capability must not silently reshape an existing character before the user authors and Saves a new rest rig;
- Rig Designer edits participate in the normal bounded working copy: pointer-down captures the pre-edit rig, move previews, pointer-up commits one Undo step, pointer-cancel restores, and Save/Discard are the only persistence boundary;
- direct viewport joint dragging is allowed in Rig Designer, but joint hit targets stay large in screen space and the labelled Control Board remains the authoritative selection route on phone;
- precision movement supports Free/X/Y and Fine modes. Measurement/readout values are inspection only and do not persist separately from joint positions;
- symmetry, pair-copy, ground-contact and reset operations are explicit authored transactions and must be Undoable;
- Motion Reference may be visible in Rig mode to help establish proportions. Its playback is independent there; linked animation playback is an Animate concept and must not rewrite or drive rig construction;
- persisted rig preview must be editor-safe: an unsaved working rig may be shown inside Anim Lab, but Play reads the last explicitly saved rig definition;
- Rig Designer is descriptor-driven. Each future rig family (including a biped rig) should provide joint groups, geometry point names, measured links, symmetry pairs, ground-contact points and editing bounds to the shared designer rather than forking a new tool;
- art is a skin over the authored rig, not the source of structural truth. Existing cutout art may temporarily stretch/rotate over revised bones, but final art attachment/splitting should be performed after the rest rig is approved;
- do not fake a mid-spine visual bend by duplicating or distorting an unsuitable single torso sprite. If the approved rig requires articulated torso bending, refit/split the artwork deliberately in the later art pass;
- Stage 4 planted-paw FK/IK/contact solving remains separate from Rig Designer. Do not add hidden solver behaviour while structural proportions are still being established.

### Anim Lab Fox runtime clip integration (v1.0.152)

The editor/runtime boundary for the Fox is now deliberately enabled.

Rules:

- Save in Fox Animate mode remains the only authoring commit boundary; merely previewing/scrubbing does not change gameplay;
- Save compiles the sparse Fox clip back to the existing 16-sample format and writes the Fox family clip bank;
- Play loads saved Fox Walk, Run and Jump independently and validates each as a 16-sample clip before use;
- any missing/invalid saved Fox clip falls back independently to the built-in `FoxRig` default for that clip, so installing the feature or clearing editor data cannot break gameplay;
- runtime continues to use the saved Fox rest rig separately from clip poses, preserving the rest-rig/animation ownership split;
- v1.0.153 adds the bounded Stage 4 paw-contact layer described below; the v1.0.152 fallback/Save boundary remains unchanged.


### Anim Lab paw IK authoring (v1.0.156 current rule)

The first Stage 4 contact pass introduced FK/IK blend plus Plant/Release ownership. On-device use showed that this added too much state for the actual production goal: match a paw trajectory to reference, then animate the body independently without dragging the paw with it. v1.0.156 therefore supersedes the Plant/Release authoring model with persistent paw IK.

Rules:

- for Fox locomotion authoring, the normal leg control is a **persistent Paw Target**; authors do not key an FK/IK mode switch, Plant flag, Release flag or blend value during ordinary posing;
- moving a Paw Target automatically enables IK for that pose. If an older pose is still FK-only, the first Paw Target drag captures the current FK endpoint before movement so the limb does not pop;
- the Paw Target lives independently from Front Body / Mid Root / Rear Body motion. Moving the torso should solve the limb back to the same target while it remains reachable; if the target exceeds the two-bone reach, the solver clamps only to the nearest reachable point rather than stretching bone lengths;
- stance is authored by moving the Paw Target backwards along the ground at the same apparent rate as the ×1 Ground Motion datum; swing is authored by moving that same target forwards and upward. This is one continuous target trajectory, not a contact-state machine;
- **Ground Motion** remains editor-only diagnostic UI. At ×1 it represents the current Walk/Run gameplay stride relative to saved Fox scale; its visibility and temporary speed multiplier never dirty animation data, enter Undo history or affect gameplay;
- two-bone IK preserves saved rest-rig upper/lower bone lengths and uses an explicit rig-family bend branch for each limb so front knees and rear hocks do not switch between the two mathematical solutions from sample to sample;
- the old upper/lower FK channels remain in saved/runtime data for compatibility, but the normal Fox Control Board no longer presents them as the primary locomotion workflow. The visible limb-authoring control is the Paw Target;
- sparse keys interpolate Paw Target X/Y like ordinary animation channels and compile into the existing 16-sample Fox runtime bank. Play consumes the same saved bank/fallback contract as before;
- near/far readability is part of the rig-family visual language: near-side limb controls/bones use the stronger accent, far-side limbs use a lighter neutral grey, and selection highlight sits on top of that distinction;
- Rig mode uses the same phone interaction grammar as Animate: select a labelled joint in the left drawer and manipulate it immediately with the bottom-right viewport drag pad. Do not place the primary precision pad below a long scrolling inspector;
- one continuous Paw Target or Rig-joint drag is one Undo action; pointer-cancel restores the pre-drag value and Save/Discard remain the persistence boundary;
- v1.0.156 deliberately stops at four paw targets plus the moving-ground diagnostic. Do not reintroduce Plant/Release, graph curves, generalized constraints, terrain-aware automatic foot placement or full-body IK unless a concrete production problem demonstrates the need.


### Anim Lab locomotion authoring — anatomy, timing and interpolation (v1.0.157)

- **Reference-first anatomy:** if a reference clearly requires an articulated joint, represent that joint in the rest rig instead of hiding the discrepancy inside pose offsets. Quadruped front limbs use Socket → Elbow → Wrist → Paw; rear limbs use Socket → Knee → Hock → Paw.
- **Simple IK ownership:** Paw Target remains the everyday locomotion endpoint control. Additional anatomy should add the minimum direct shape control required for believable matching (currently Wrist/Hock Angle), not mode switches or plant-state bookkeeping.
- **Hierarchical neck:** Neck motion owns the frontBody → neck → head chain; Head motion is local on top. Do not collapse both actions into one head pivot.
- **Gameplay cadence in preview:** locomotion preview speed must be derived from the same stride-distance/speed relationship used by Play wherever practical. A lab preview that is visibly slower/faster than gameplay is not an acceptable animation-review surface.
- **Continuous playback:** the authored/runtime bank may remain a compact fixed sample count, but editor playback should evaluate between samples continuously at display refresh rather than visibly stepping sample-to-sample.
- **Curves without a DCC graph editor:** prefer a small, predictable interpolation choice such as Smooth/Linear over introducing a general curve graph. Smooth interpolation must preserve authored key poses and must not allow paw targets to dip materially below the ground datum through overshoot.


## Static art references and authoring handoff (v1.0.158)

Anim Lab may expose **static art references** separately from Motion Reference. Static references are editor-only images used to establish silhouette, scale, proportions or palette. Their source, visibility, opacity, scale and alignment are editor preferences: changing them must not dirty character Setup/Rig, clip data, Undo history or gameplay state. A static image reference may be shown in either Rig or Animate where useful, while Motion Reference remains the time-based gait/reference system.

When character authoring must be handed between devices/sessions or returned for art processing, prefer a **versioned JSON handoff bundle** over screenshots or manual transcription. The Fox handoff bundle owns the current rest rig, setup scale/collider and sparse authored clips, and may include compiled runtime samples as a convenience. Sparse keys + rest rig remain the authoritative editable source. Exporting must not implicitly Save or mutate the working copy.

Future mesh-deformation artwork must consume an approved rig/handoff rather than forcing the rig to fit newly processed artwork after the fact. For the Fox, the intended experiment is a hybrid 2D deformation model: body/head mesh, leg/shoulder mesh regions and tail mesh authored separately, each skinned to the established rig.

## Fox promoted authoring baseline + Idle contract (v1.0.159)

v1.0.159 closes the first Fox rig/animation-authoring stage by promoting an explicit exported handoff into the code baseline. A browser's historic localStorage is no longer allowed to define what a fresh copy of the Fox is.

Rules:

- the promoted versioned Fox handoff is the default character-definition source for scale, collider, v3 rest rig, sparse authored clips and compiled runtime samples;
- promotion must preserve authored Walk / Run / Jump data rather than regenerating or aesthetically retuning it during integration;
- **Idle is a first-class Fox clip** beside Walk / Run / Jump. A static rest-pose Idle is a valid first implementation and keeps the architecture ready for later secondary life without requiring it now;
- gameplay and Anim Lab share the same four Fox clip bank names and independent fallback behaviour;
- pre-baseline Fox test storage may be migrated once onto the promoted baseline. After that boundary, explicit Anim Lab Save is authoritative again. Persist a baseline/version marker rather than guessing whether an unmarked historic value is current;
- character Setup scale is part of the promoted Fox definition. Do not let an unmarked old per-character scale silently undo a newly approved proportion baseline;
- the temporary charcoal rigid atlas is an **evaluation skin** over the approved rig. Source-art limitations (including one visible side of the legs) may be handled by duplicated/reused temporary planes where needed. Do not distort the approved skeleton merely to hide temporary cutout seams;
- the later deformable/skinned 2D experiment consumes this approved rig/handoff. It does not become a reason to reopen topology unless the rig itself proves structurally wrong in motion;
- Fox Handoff is one versioned JSON artifact. Sharing must not attach decorative title/metadata as a second text file. The JSON contains Setup/rest rig plus Idle / Walk / Run / Jump sparse clips and may include compiled runtime samples;
- export remains read-only with respect to authoring state: exporting the working copy must not silently Save it;
- the next interaction stage is Quick Play inside Anim Lab. Do not mix that feature into the baseline promotion drop once the four-clip authoring/runtime contract is stable.

## Anim Lab Quick Play + Fox motion fidelity (v1.0.160)

v1.0.160 supersedes the earlier assumption that a 16-sample Fox runtime bank is also an adequate Smooth playback surface. The 16-position timeline remains useful as a compact authoring/key layout, but it must not quantise a sparse cubic clip back into visibly coarse movement.

Rules:

- Fox **Smooth** playback is evaluated directly from the sparse authored keys at the current fractional phase. Exact key values are preserved; interpolation changes only the path between those keys.
- Anim Lab and gameplay must use the same Fox sparse evaluator wherever a valid saved sparse clip exists. Compiled 16-sample banks remain useful for compatibility, fallback and interchange, not as a second visual truth.
- Linear remains a deliberate diagnostic/authoring choice. Do not silently smooth a clip marked Linear.
- The 16-frame timeline is an authoring coordinate system, not a playback framerate or output-sample limit.
- **Quick Play** is a non-destructive view of the current working copy. Entering or leaving it must not implicitly Save, Discard, reset the checkpoint, clear Undo/Redo history or require a navigation guard.
- Quick Play should use unsaved current clip/Rig data where possible so the intended loop is edit → Play → tweak → Play. Persist only through the existing explicit Save action.
- Quick Play is part of the Anim Lab viewport and follows the established phone-first two-thumb grammar. Replace authoring precision controls with the minimum gameplay-style movement controls needed to judge locomotion; do not create a second miniature game/editor.
- Fox **Walk Speed** and **Run Speed** are character Setup properties, not temporary preview multipliers. They are independently tuneable, versioned through the Fox handoff, and consumed by normal gameplay after Save.
- For the Fox, full-speed locomotion cadence and ground speed are intentionally separable. Walk/Run cycle timing expresses the authored gait; Walk/Run speed expresses metres travelled per second. Tuning one must not secretly rewrite the other.
- Partial analog input may scale cadence down as movement eases in so low-speed input does not produce full-cadence foot skating. At full walk and full run, however, the authored cycle timing remains stable while speed tuning alters ground travel.
- Quick Play should provide a simple spatial diagnostic (currently scrolling metre marks plus speed/cycle readout) so an animator can judge travel per cycle without leaving the tool. Diagnostic UI does not become animation data.
- Left/right preview must mirror the character art correctly. A facing change is a reflection of the rigged result, not a 180-degree rotation of individual sprite planes.
- Do not respond to motion-fidelity problems by adding a general graph editor pre-emptively. First judge direct sparse Smooth evaluation, sensible key spacing and the Quick Play speed/cadence loop on device.
- Temporary charcoal cutout seams remain art-stage debt. Motion tooling must not reshape the approved rig merely to hide those rigid-plane limitations.


## Full-chain quadruped Paw IK (v1.0.161)

Paw Target is the endpoint owner for the complete quadruped limb. A three-section leg must not be implemented as a two-bone IK solve followed by re-attaching a distal segment at a fixed world rotation; that prevents natural extension and makes the final joint visually rigid.

Rules:

- active Fox IK solves Socket → Knee/Elbow → Wrist/Hock → Paw as one endpoint problem while preserving all authored rest-rig segment lengths;
- the existing front/rear anatomical bend branch remains explicit and deterministic so extension cannot reintroduce frame-to-frame knee/hock solution flipping;
- Wrist/Hock Angle defines the **preferred distal shaping direction** under IK, but that preference must yield when retaining it would block outward Paw Target reach;
- once the preferred distal direction can no longer reach the requested endpoint, the distal joint yields progressively and converges toward a straight lower chain at physical maximum reach;
- at maximum reach the complete leg may become effectively straight. Do not retain an artificial wrist/hock bend merely to preserve the rest-pose angle;
- moving the Paw Target inward should restore the preferred lower-chain bend continuously, without a mode switch or Plant/Release-style state;
- solver upgrades must not rewrite authored animation keys or bump the Fox authoring-baseline marker merely because geometry evaluation changed;
- keep this analytic/simple enough for deterministic iPhone editor/runtime use. Do not introduce a general full-body IK package unless later production requirements genuinely need it.

## Phase-aware quadruped gait transitions + joint-side constraints (v1.0.162)

Walk and Run are authored as distinct gait structures. They are not required to share equivalent foot contacts at the same normalized phase, so a quadruped must not be held indefinitely at `blend(Walk[phase], Run[phase], speedMix)`. That produces physically ambiguous half-contact poses when one gait says a paw is planted and the other says it is airborne.

Rules:

- ground speed may remain continuously analogue between the character's authored Walk Speed and Run Speed, but gait identity is discrete: the character is in Walk, Run, or a short transition between them;
- when changing gait, choose a destination phase from the target cycle by comparing the current paw-target/contact configuration with candidate target phases. Do not assume equal normalized phase means equivalent footfall;
- during the short transition, source and destination gait phases continue to advance at their own authored cadences. The transition is a hand-off, not a frozen source pose morph;
- contact-aware blending may hold a source-planted paw toward the source gait until release and may commit an incoming landing paw toward the target gait earlier. Its purpose is to avoid a visible paw lingering at an arbitrary half-height;
- once the hand-off ends, render the target gait directly. Do not retain a permanent 30/50/70% Walk+Run pose simply because ground speed lies numerically between the two speed settings;
- Anim Lab Quick Play and normal gameplay must use the same gait-transition rules so animation review remains representative of runtime.

For quadruped IK, a deterministic branch is part of the rig contract, not merely a numerical solver preference. The primary knee/elbow branch remains fixed. When the three-section reach solver releases Wrist/Hock Angle near an extreme target and obtains two valid lower-chain circle intersections, choose the intersection on the anatomical side established by the active rest rig. The lower chain may approach straight, but it must not jump onto the mirror solution because that branch becomes fractionally closer to a preferred angle.


## Jump authoring coordinate contract (v1.0.163)

Jump animation authoring and physical jump trajectory are separate concerns. Anim Lab Animate mode authors the **pose in a stable character-local coordinate system**; Quick Play/gameplay owns the character's world-space vertical trajectory.

Rules:

- the Animate/Jump viewport must not move its local origin or ground datum through a synthetic jump arc; local `Y = 0` stays fixed while scrubbing and editing;
- Paw Targets in Jump are airborne animation controls and may move below local `Y = 0`. Do not apply the Walk/Run ground-floor clamp to their interpolated Y values;
- the Ground Motion/slip diagnostic is a locomotion tool for Walk/Run and should not be presented as active Jump behaviour;
- a fixed Ground / Ruler may remain as a spatial reference for take-off/landing poses, but it must not drive or constrain airborne IK;
- Quick Play/gameplay may translate the whole rendered Fox vertically using jump physics while evaluating the Jump clip for body/limb shape;
- do not bake physical jump height into the animation clip merely to preview trajectory. Animation owns pose; gameplay owns trajectory.

## Deformable 2D character skinning contract (v1.0.165)

The deformable-character experiment is intentionally mesh-first before the broader Character Lab generalisation.

- Skinning consumes the approved rest rig and animation pose; it must not rewrite animation keys or rest-rig topology as a side effect of rendering.
- Prefer a small number of larger deformable regions over one rigid texture plane per bone. The quadruped starting model is Body+Head, separate Tail, and four complete leg/shoulder regions.
- Tail may visually join the body but remains an independent mesh so large tail curvature cannot drag/stretch the body region.
- Initial binding is automatic and low-complexity: low-poly triangles and at most two strongest bone influences per vertex. Build weight-editing UI only after the automatic proof demonstrates that the rendering model is worthwhile.
- A mesh preview must be directly comparable against the rigid renderer and must have an optional wireframe/topology diagnostic.
- Stage 1 is editor-only. Normal gameplay keeps the proven rigid fallback until the deform renderer has survived visual and performance testing on the target phone workflow.
- Existing atlas seams in a prototype are source-art debt, not evidence that the approved skeleton should be reshaped. Final deformable art should be produced against the approved rig/binding after the deformation model is proven.

### Deformable mesh topology readability rule (v1.0.166)

Character skin topology must describe the visible character, not the rectangular texture containers used to store artwork. Transparent atlas margins must be cropped/cancelled before topology generation and fully transparent mesh cells should not survive merely because they lie inside a source rectangle.

For long narrow articulated regions such as limbs and tails, default topology should follow the anatomical bone chain as a subdivided strip. Cross-sections must preserve a stable left/right ordering as the chain bends; generic proximity weighting must not be allowed to pair non-adjacent bones in a way that flips or twists the strip. Body/torso regions may use a compact alpha-aware grid or contour topology.

Wireframe diagnostics must remain readable on-phone: draw unique edges once and allow the author to isolate a single mesh region when overlap makes the full character difficult to inspect.

### Dedicated deformable source-art rule (v1.0.168)

Once deformation has been proven, character skin regions should use artwork authored as continuous deformable pieces rather than permanently recompositing the old rigid per-bone atlas.

- Source art, topology, rig and animation are separate layers. Replacing source art must not rewrite the rest rig, mesh topology or animation keys.
- Quadruped default region ownership remains Body + Head, independent Tail, and four complete leg/shoulder regions unless motion testing proves another split is necessary.
- Shoulder/hip source pieces should overlap the body sufficiently for weighting to create an attached soft transition; do not cut the texture exactly on the joint pivot.
- Dedicated art should load independently and may fall back to proven rigid-source reconstruction if unavailable, but fallback is recovery behaviour rather than the desired final look.
- Art generation/processing must preserve transparent backgrounds, clean alpha and enough overlap for skinning. Do not bake diagnostic wireframes, labels or rig controls into production textures.

### Anim Lab P2a rest-space invariant (implemented editor test v1.0.193; acceptance pending)

In neutral **Parts** and **Rig** authoring, six-piece art is assembled independently of moving structural joints. Source art coordinates and the explicit inverse-bind rest rig are separate; editor-only walk previews may deliberately show deformation but never write state. Rebinding is a named Setup edit with normal Undo/Redo/Discard; saving structural rig changes with an out-of-date skin binding is blocked. Display previews and Art Ghost remain transient. Cross-mode game renderer integration and fully separate Skin authoring still await later work. Preserve the user's saved rig and atlases when upgrading a v1.0.191/192 workspace.

## Anim Lab Skin authoring — v1.0.194 incremental touch contract (device acceptance pending)

- Setup has three distinct authoring stages: **Rig** positions semantic joints, **Parts** composes the unchanged source image pieces, **Skin** adjusts how existing mesh parts deform. Switching tabs must never alter saved artwork, rest rig, UVs or animation keys.
- The Skin editor uses a part/region selector and contextual controls rather than turning the entire canvas into a paint brush. Non-selected parts remain visible as dim context; selected part shows an optional diagnostic wireframe/vertex dots. These overlays are editor-only and are not stored in the authored character.
- **Walk/Run fixed-phase previews** are view-only and do not write clip keys. Neutral/Rest must remain visually stable under all weight changes. Temporarily hide Bones on entering Skin and restore the user's previous Bones visibility on exit. The standard View control may still be used during Skin inspection.
- On a grid mesh, **Pick Vertex** must be explicitly armed to make one canvas tap into a selection. Otherwise viewport touches continue to mean Pan/Pinch. Provide adjacent vertex buttons for precision/touch fallback. The user edits one selected bone's proportion on one selected vertex, with remaining influences normalised to 100%. Auto Vertex removes only this vertex's override; Reset Region removes all local overrides. For chain meshes show meaningful root carry/falloff sliders instead of pretending there are the same independent grid weights.
- Continuous slider interaction should count as one undo step. Save, Undo, Redo and Discard remain in the shared Edit Session. No Skin action should regenerate anatomy, topology, art, atlas crops or animation samples as a side effect.
- This is currently a six-region **Fox adopter/editor-only** implementation, not a global production character creation feature. Future families should expose topology and semantic influence descriptors, reusing this workflow without Fox-specific UI names. Production/runtime bindings must explicitly consume the stored skin tuning before any promise of in-game equivalence.

## Anim Lab v1.0.195 — P3a navigation & Display integration (device acceptance pending)

Shared UX invariant: distinguish the **Workspace** being edited from the **Display** being inspected. The five existing character editing destinations are presented together (Parts, Rig, Skin, Animate, Play), without parallel hidden ownership of opacity or reference overlays. Collapsible Display contains Art/Static/Motion show/opacity channels, rig and mesh diagnostics, boundaries and ground; references retain their source/timing/alignment controls inside Display. Moving existing input elements must preserve their original event handlers and per-character context; display choices are editor-only, persist separately and never dirty Undo/Save state. Inspector list left and thumb-pad bottom-right remain unchanged. Clip/timeline belongs to Animate; structural authoring gets full viewport height. First-use collapses privilege active edit tools but users can expand panels and their choices persist. v1.0.195 is the first integrated implementation; refine based on real-device review, do not assume a finished character-authoring UI or general library.


### P3b implementation — v1.0.196 (19 Oct 2026; awaiting iPhone acceptance)

User confirmed v1.0.195 layout broadly usable, then requested interactive editor polish before character/library authoring. Implemented changed-files-only patch over v1.0.195:

- Primary Skin interaction is **Region → Bone → Influence Gain & Falloff** for the six existing Fox deform regions. A selected-bone gradient heatmap (blue lowest, cyan, green, yellow, orange, red strongest) is painted in texture UV and alpha-masked to the actual opaque art. The selected bone is highlighted; the skeleton follows neutral/walk/run preview phase along with the mesh. Optional per-vertex editing remains secondary under Advanced, with separate Reset Bone, Auto Vertex and Reset Region actions. Limb root attachment controls retained.
- New optional `skinTuning.regions[regionId].boneProfiles[boneIndex]` `{gain,spread}` survives Setup normalisation, Undo/Redo and Save; default/legacy data keeps old deformation. Grid uses adjusted weights; chain retains current strip algorithm until an explicit per-bone/vertex edit, then blends a weighted-bone deformation. Tuning is **still preview/editor-only**, not consumed by Quick Play or game runtime.
- Neutral Parts/Rig draws are accelerated by directly projecting each region texture with the same authored pre-skin layout transform, instead of drawing mesh triangles. Right-pad movement samples coalesce per animation frame and flush before commit. Bone lines/joints are subtler in Rig/Animate; selected Skin bone remains visible. ResizeObserver, visualViewport and rotation delays remeasure iPhone canvas aspect and retain world-centre framing.
- Do not assume all region topology is generic yet: six Fox mesh regions are hard-coded descriptors for the proving ground. **Next** complete device QA, then general Character Create/Assets and descriptor-driven skin region registration; connect skin tuning into playable render only when stable. Continue to preserve the single-file Fox JSON export and working legacy clips.


### P3c / v1.0.197 — Paired copy, explicit save/rebind, chain-skin stability (19 October 2026)

**User/device state:** v1.0.196 Skin UX was reported significantly improved, but distorted/twisting legs, inconsistent symmetry-copy granularity and confusing rebind/save remained. v197 is a *candidate* patch over v196; test it on iPhone before promotion. Preserve v196 as rollback. The user supplied a Fox JSON export dated 19 Oct (filename `SS-FOX-RIG-ANIM-1.0.175.json`, exporter still writes legacy `animLabVersion:1.0.164`): `restRig` and `skinBindRig` are equal; `artRestRig` is intentionally distinct. Extreme limb bone gains (`frontNear` 2/2.95/2.4, `frontFar` distal 3) and spreads down to .55 were present. This does not prove the user set weights incorrectly; the old weighted-mode switching algorithm is a plausible mechanical cause of twisting under wide IK poses.

**A. Symmetry controls** (same language across authoring modes, descriptor-aware for the current quadruped proof):
- **Parts:** Copy Selected Part → Pair, Both Legs Near → Far, Both Legs Far → Near. Only layout transform fields X/Y/rotation/scales/pivots copy, never atlas pixels, draw order, or transient solo/visibility.
- **Rig:** Copy Joint → Pair; Copy Segment → Pair (two adjacent joints, endpoint selects last segment); Copy Limb → Pair (all joints in selected front/rear limb); Both Legs Near → Far / Far → Near. Membership and near/far pairing are resolved from rig-family `jointGroups` + `symmetryPairs` metadata; no copied animation keys. Body/spine/tail have no symmetry pair.
- **Skin:** Copy Selected Bone → Pair copies only the selected bone's gain/spread profile; Copy Whole Part → Pair duplicates attachment, all bone profiles and any manual vertex weights; Both Legs Near → Far / Far → Near copies front and rear in a single undoable transaction. This is a skin-region proof, not generic arbitrary limb topology.
All copy operations run through Setup transactions and Undo/Redo/Save/Discard. The destination is overwritten; users should verify direction before applying.

**B. Rebind behavior:** A changed structural rest rig must never be persisted with old inverse-bind coordinates. Save now *asks* whether to Rebind + Save when the rig differs from `skinBindRig`; Cancel leaves the working session unchanged and unsaved. Manual Rebind stays available as an Undoable action and proposed/previous bind previews remain under Display. Rebind affects only `skinBindRig`, not neutral art, UV/atlas, manual tuning, or animation clips. `artRestRig` is not overwritten. Test with rig edits, cancel and accept, reload to verify no stale bind.

**C. Chain deformation correction:** v196 changed a tuned chain vertex to a **constant 85% blend into unrelated linear-blend skinning** whenever any bone profile changed; this can visibly shear/invert quads when IK makes large limb rotations. Preserve the established baseline chain deformation. Instead compute `tunedWeighted - automaticWeighted` as a *weight-edit delta* and apply a bounded 0.78× correction to chain output (maximum .024 character-local units per vertex). This is neutral-pose invariant, continuous at identity tuning, and bounds extreme gain/spread displacements. Existing weight values/heatmap, mesh topology, rig, atlas, poses and clip keys remain untouched. This is a mitigation, not a guarantee against all artifacts from extreme IK or nonrigid geometry; test walk/run multiple phases with the user's actual saved data. No silent reset of authored skin weights.

**Integration boundary:** Gameplay and Quick Play still DO NOT consume Skin tuning. No new-character wizard, general rig descriptor authoring, arbitrary new part creation, or runtime selector implemented. The overarching goal remains Character → Parts → Rig → Skin → Animate → Save/Library → select in-game. Follow-up may require better bone-weight painting/IK limits once iPhone tests identify any remaining folds.


### Authoring weight UI rule — v1.0.198 (19 October 2026)

A UI labelled **percentage** must denote a real normalised value in the 0–100% range, not an internal gain or multiplier. In Skin, make Region → Bone → **Peak Bone Weight** the primary, large-readout control, with Falloff second and per-vertex controls Advanced. Pair an authored target with both **Automatic** and **Actual** measured peak weights; explain cases where other influences compete. The colour heatmap depicts actual per-vertex weights. Preserve older multiplier-bearing character saves without rewriting them until a deliberate per-bone conversion, and label that state explicitly. Numeric weight readouts must be comfortably legible on an iPhone in landscape (at least primary 19px). Keep Undo/Redo and Save/Discard scope intact. Do not use relative multipliers disguised as 100%-capped influence percentages elsewhere in the future character-authoring tools.

### Anim Lab Character Library — v1.0.199 UI contract (19 Oct 2026)

Provide a visible Character Library at the start of the existing Anim Lab drawer, with Create (name + installed starter rig), saved named characters, Open/Rename/Delete/Export and Import JSON. **Historical v199-only requirement superseded by v200:** all built-in Hero 1, Hero 2 and Fox appear in the same Load list as locally authored characters. Distinguish them with Built-in/Local labels; legacy storage remains separate. Do not show a duplicate native-character button row. Name fields and actions must work on iPhone Safari without requiring code or external tools; avoid rebuilding the library list every animation frame. Creation and destructive changes are disabled while another editor context is dirty (Save/Discard first). Delete requires a named confirmation; import is duplicate-safe and must not overwrite an existing character. Show explicit notices that starter art is temporary and custom character selection remains editor-only.

Quad starts with the existing Fox-family Parts/Rig/Skin/Animate/Play workspaces. Biped in v199 is a documented partial adapter (Setup/Animate) and must not show non-functional Parts/Skin as delivered. Export/import are *data* backups, not texture-pixel transfers. Preserve the single Display panel, stable left selection/right pad, saved stage state, and all existing built-in editor flows. The longer approved end-to-end workflow above remains unchanged.



### Anim Lab v1.0.201 — stable authoring view and plane-layer names (20 October 2026)

When entering Parts, Rig or Skin, preview the same neutral/rest coordinate space unless the user explicitly selects a named Skin Walk/Run preview or Animate playback. A workspace navigation action must never apply a transform to the saved part layout. Skin starts at Rest, retaining explicit Walk/Run and phase controls for weight review. In Display expose separately **Rigid Planes** (legacy rectangular planes) and **Deform Planes** (true deforming mesh-region boundaries); Mesh Wireframe remains an optional more detailed diagnostic. These are visibility-only overlays and cannot dirty authored state. Always label which character is loaded. New Quadruped uses the bundled 20-Oct saved-Fox authoring snapshot; older local characters are not replaced. This fix is subject to iPhone rotation/mode-cycle validation; if visual drift persists, collect a canvas capture before and after a repeated mode cycle.

### Global Project Backup entry point — v1.0.202 (20 Oct 2026)

- Put the one-project **Project Backup** action in Home → Menu, at the same navigation hierarchy as World Lab/Anim Lab, not in any character's New/Load/Save panel.
- First-pass workflow: **Save work in each Lab → Project Backup → Preview data (summary and key names) → Export Snapshot → Files/iCloud Drive / Share**. Export has no side effects on save state and should work without a GitHub rebuild beyond installing the patch.
- `sidescroll.project-snapshot.v1` is a JSON diagnostic snapshot of raw `localStorage`/`sessionStorage` SideScroll and known legacy keys, plus manifest/counts/byte sizes/checksums/skips/errors. **No Import/Restore yet.** Preserve browser-source raw text exactly and do not auto-write back to storage.
- Never silently sweep unrelated same-origin keys into a shared export; list excluded key names without values, exclude credential-like keys, and make coverage gaps explicit. Cache Storage and IndexedDB names are diagnostics only in v202 (not binary backups).
- Once source/real-device audit is done, implement **per-Lab complete exports and imports**, then a verified global restore with dry-run/conflict review, source-version checks, imported media dependencies and idempotent testing. The global export must be a superset of all *authored* items supported by the individual Labs, not a substitute for them.


### One-tap project export UX — v1.0.203 (20 October 2026)

Project Backup is a Home → Menu action with one primary **Export Project** button. As the page loads it prepares a named JSON File from the same read-only v202 snapshot data. Tapping the button must **directly** open iOS's native file-sharing sheet via `navigator.share({files:[file]})` when available, exactly as individual Lab exports do. Do not pass a text/title-only payload and do not programmatically click a Blob download link after awaiting storage/hash reads: both confuse iPhone handoff and can produce a text file with only the share title. Expose a normal **Download JSON** link only when native file-sharing is unavailable or fails. Keep validation/status and a compact details disclosure, not multiple Preview/Share/Download buttons visible by default. No restore or storage writes.


## 20 Oct 2026 — v1.0.204 Lab Data Export / Import coverage (Stage A)

- New `lab-data.js` offers scoped exact-string Lab exports for Puzzle Lab, Asset Lab and the **whole** Anim Lab (in Character Library → Load; top-level New / Load / Save unchanged). Payload `sidescroll.lab-data.v1`; all current and legacy saved keys in the selected Lab, manifest of count/UTF-8 bytes. Import validates scope, duplicate keys and sizes; explicit add/overwrite preview; rollback attempt if any localStorage write fails; unspecified keys preserved. Imports should only follow off-device exports and user intent.
- World Lab **Game Design export v3** extends v2 with isolated Puzzle Lab saved keys and player puzzle runtime, plus the active v2 Design Lab working document and an explicit v1 legacy copy. v1/v2 import compatibility is maintained. The World's format is NOT identical to Global Snapshot or the new lab-scoped format.
- Global Snapshot exporter v204 also recognises legacy `gamehub.sidescroll.scene.v2` and `gamehub.walklab.character.v1` (if present). Do not auto-migrate these raw values.
- The saved-data exports **do not embed art PNGs, imported image pixels, bundled resources or IndexedDB**. Save current edits before export. Project Backup is still read-only, **not an approved full restore**. GitHub packaged baseline defaults will need a deliberate promotion/migration pipeline; local work must not be silently overwritten.
- Machine-readable key/source mapping and exact test outcomes live in `SIDESCROLL_EXPORT_COVERAGE.md`. iPhone Safari approval pending. Next: verified global restore with preview/rollbacks, artwork packaging and per-character export parity.


### v1.0.205 — Global Project Restore / Backups (20 Oct 2026)

- Home → Menu → Project Backup now offers one-button Export Project and **Import Project**. Import is deliberately a separate, opt-in view: select a JSON, validate schema/hash/manifest/key scope, review categories and add/replace/skip counts, choose Merge missing (default) or Restore from file. Session/editor-only data is disabled by default.
- Safety workflow: capture all currently saved project keys (not just affected keys), **Save safety JSON to Files/iCloud first**, acknowledge success, recheck that current storage has not changed since preview, then final confirmation and selective writes. Verify readback and attempt rollback on failure; do not claim atomicity across browser termination. Old extra keys are never deleted; foreign same-origin keys and credentials are never imported.
- This is saved **browser data** recovery, not a complete art/image/IndexedDB backup and not a GitHub baked-defaults promotion. Single-Lab data scopes remain available for smaller imports/exports. Export/import are companion responsibilities for every new editor storage key.
- Keep the running iPhone state safe: UI/preview test only on production phone until restore has been roundtrip-verified separately. See `SIDESCROLL_EXPORT_COVERAGE.md` for detailed formats, gaps and device QA.


## v1.1.4 — Atlas → Parts inventory foundation (21 October 2026)

**Delivered code / in-device acceptance still open:** a separate, *opt-in* per-character Parts assembly starts by selecting **Use Atlas parts** in the existing Parts workspace. It reads currently authored meshes from that character's `sidescroll.animlab.atlas-docs.v1` Atlas document. Individual **Add**, **Add all unused**, **Duplicate selected**, **Remove selected**, **Clear all** (confirm), draw-order back/forward, selected X/Y/rotation/scale fields and a dedicated move/rotate/scale thumb pad produce undoable **Setup** transactions. The user's original six Fox Parts, their transforms, and the existing Parts workspace controls remain intact and can be restored by choosing **Show original Parts**. Clear/remove modify assembled *instances*, never the original Atlas mesh source, rig or clips. Every instance refers to a stable source `meshId`; multiple instances may share one mesh. Part order is array order (rear → front).

**Storage:** the existing `artLayout` gains optional `{assembly:{schema:'animlab.parts-assembly.v1',enabled,instances:[{id,meshId,label,x,y,rotation,scaleX,scaleY,boneTarget}]}}`. The existing `normaliseArtLayout` validates these fields and permits 64 instances; absent assembly remains the pre-v1.1.4 layout, without mutation. It is saved through the existing per-character `setup` working copy and Undo/Redo/Save/Discard, not through the Atlas source key. No legacy part is destroyed on switching either way. An Atlas source ID is resolved only against the current character's local Atlas document. A missing/deleted source receives a visible inventory warning. Character export/restore coverage remains **incomplete**: image bytes live in IndexedDB and are not in current JSON snapshots.

**Preview and binding boundary:** the custom assembly draws its actual authored **triangle topology** with atlas pixel coordinates as texture UVs (no parallel UV data) in neutral/rest **Parts** and **Rig** view. Existing Fox six-region deform renderer yields to this preview only in those two stages when the Atlas assembly is enabled. Rig remains independently editable. A **Suggested joint** choice, target-count diagnostics and optional **Position at target joint** provide *intent metadata* for later Skin binding; they do not create or move bones, generate weights, install bind matrices, attach images to animated joints, or affect gameplay. Skin/Animate/Play still use their existing legacy render path. There is no claim of an end-to-end new-character runtime pipeline in this patch. The chosen target is not a Skin influence list. Rendered custom mesh geometry remains static until later stage work.

**Pipeline priorities following this increment:** (1) generalise Skin to arbitrary `{part instance,source mesh,source image}` and arbitrary rig links, with explicit reversible auto-weights and manual controls; (2) bridge the bound assembly to Animate/Quick Play and then runtime and guard against dangling atlas sources, changed topology, incompatible rig and unbound vertices; (3) portable full character art+mesh+rig+animation export and safe restore, with eventual repository-relative texture paths. No Fox-source data or saved animation clips should be rewritten by any of these tasks without explicit opt-in.

### FUTURE — Character Hierarchy / Graph Inspector (approved concept, not delivered)

Provide a dedicated inspect/edit stage showing the graph of **character → atlas image/page(s) → reusable source meshes → assembled part instances (transforms and draw order) → rig/bones/joints → Skin weights and bind references → animation clips → game/play selection**. Selecting a node should open its owning editor or a narrowly scoped property inspector rather than silently altering other domains. Edges should distinguish instance-of, uses-texture, targeted-for-bind, weighted-to, and clip-uses-rig. Include validation for missing source pages/images, duplicate/conflicting IDs, orphaned part references, zero/un-normalised weights, rig joint deletion, stale skin topology, nonportable PNG bytes and runtime missing assets. Show **ready / warning / broken** per stage, plus a targeted fix link and one full-character verification view. Safe edit transactions, Undo and provenance are required; opening/inspecting is never a write operation.

**FUTURE — Multiple/Shared Atlas pages and reusable items:** a character may eventually reference several atlas pages, including a wardrobe/clothing/supplies page shared by different characters. Use stable page/mesh asset IDs separate from each *part instance* ID; an instance links to its page, mesh and optional version, never copies geometry just to be reusable. Define ownership (local vs shared/library), version/pinning, explicit propagation/rebind rules and broken-dependency reporting in the Hierarchy graph. The current single per-character `atlas` field and `meshId` references **do not implement this**; introduce page IDs and migration only as a later deliberate schema upgrade with tests. Never silently apply edits to a shared garment in every character.

## v1.1.5 — Single Parts inventory, authoring usability correction (21 October 2026)

The separate v1.1.4 **Use Atlas Parts / Show original Parts** panel has been retired from the user-facing workflow. In Parts there is one normal part list with **Add**, **Delete selected**, **Select all** and **Clear all**. Add opens a modal with selectable saved Atlas meshes. Clicking existing part entries can mark multiple for deletion; the most recently clicked remains the transform target. The existing Part Layout numeric inputs, thumb pad, move/rotate/scale/pivot, draw-order and clipboard commands now operate on either a legacy pre-migration layout or an Atlas assembly. Rig joint suggestion/snap controls are hidden; binding is still the responsibility of the later Skin stage. Remove/Clear deletes assembly instances only, never the Atlas source document. Save/Discard/Undo remain Setup transactions.

**Compatibility:** `artLayout.assembly` keeps its v1 schema and stable instance IDs. Existing v1.1.4 saved assemblies and transforms survive; old workspaces without assemblies show their original six pieces until the first structural Add/Delete/Clear, which converts them to `atlas-builtin-<partId>` source-linked instances (read-only source geometry). The old artLayout fields remain persisted for backwards compatibility but are not a second user-facing switch. Missing custom sources are clearly labelled as missing. Assembly transforms now include `pivotX/pivotY` in normalisation and previews. A multi-instance label displays the current source name resolved by stable Atlas `meshId`; repeated references are numbered rather than appending `copy`. Atlas's separate *Duplicate source* operation still creates a distinct source with a deliberate `copy` suffix; source rename is not equivalent to instance duplication. These controls do **not** establish Skin bone assignments, deformation, animation or runtime use.

**Future Hierarchy/Shared Atlas:** preserve the already proposed Character Hierarchy, linked atlas pages, shared outfits and validation work; do not implement them in the inventory editor. Subsequent Skin generalisation should consume stable instances from this streamlined list, not restore a competing part inventory panel.



## Parts visual/tool consistency contract — v1.1.6 (21 Oct 2026)

Use the existing Atlas editor as the Parts editor interaction convention: a plainly labelled **single assembled-parts list**, one row per part with explicit Hide, Solo and Lock, and a **contained Edit selected part** area that groups Transform, Layer order and Manage commands. Do not add an extra permanently expanded inventory panel, duplicate transform pad, or original/new switch. Keep the Add picker modal; multiple marked names represent inventory selection while one active name drives individual transforms. The list grows with content for small inventories (up to 14 entries) and bounds its own scrolling only when large. Move less-used legacy clipboard/reference commands into optional Advanced, without deleting their functionality. Hide/Solo/Lock must be nondirty editor state, not silent rig/mesh/animation data edits.

**Source versus instance naming:** In Atlas, Rename modifies the *source mesh*; in Parts, Rename only gives one instance a non-destructive override. All instances without an override follow their stable source mesh ID/name. Copy/duplicate of an assembled instance does not duplicate the Atlas source, and must not invent a `copy` name; this distinction must remain visible in UI/docs. A part Lock must disable editing that instance until unlocked. Keep existing Save/Discard/Undo rather than adding an independent persistence path.

## v1.1.7 — Part manipulation coordinate contract (21 Oct 2026)

The precision thumb pad in Parts edits **authored local character coordinates**, never image pixels or viewport CSS coordinates. Translation and pivot motion must convert pointer deltas by `(canvas.width / CSS_canvas_width) / current_preview_view.scale`, including Retina device-pixel-density, pinch zoom and setup scale. The active view belongs to `AnimLabCore.getPreviewView()` and must remain accessible when legacy art overlays yield to the Atlas-assembled renderer; do not use the legacy plugin's sometimes-null `lastRender` as the sole projection source. On unknown/invalid projection, do not move the selected part. Clamp to the existing setup normalisation limits and preserve transaction Undo/Redo and Save/Discard. Viewport gestures remain panning, not part translation. This hotfix changes no authored data on page load.


## v1.1.8 — Unambiguous selection and Skin handoff

A list must distinguish the **one active inspector target** from an explicit set of **marked multiple items**. Ordinary tap selects one (and clears previous marks). Multi-select mode is discoverable via an explicit toggle; only while enabled do repeated taps accumulate/toggle membership. The additional marks must have less prominent styling than the active target. Multi-target edits should be clearly identified by supported tool type, perform as a single reversible transaction, and never silently spill into unrelated single-target commands. Parts v1.1.8 supports batch Move, proportional Scale and corresponding numeric fields; group pivot/rotation and spacing transforms are not implied.

Skin always previews the current character's assembled source instances and associated art if assembly exists. Do not show a competing legacy six-mesh character beneath or in place of that. The binding UI should show ready / missing / stale statuses, provenance, deliberate auto-bind actions, and actual weighted deformation before Save. Exiting Skin or entering Animate/Quick Play must continue to show that same saved assembly (editor-preview scope). Separate Atlas source edits, Parts instance transforms, Rig rest skeleton and Skin binding ownership; validation warns instead of silently regenerating weights. Neither source PNG packaging nor normal-game runtime integration is implied by Anim Lab editor-preview success.

## v1.1.9 — Unified Skin interaction and full-opacity rule

When a character has Atlas-authored Parts, Skin must follow **the same list → Edit selected part → Advanced** convention as Atlas/Parts. Show one selectable Parts inventory with per-row Hide/Solo/Lock, and a contained editor for bone group, bone link, peak weight, falloff, heatmap, reset, and advanced vertex adjustment. Hide/Solo/Lock are *local preview/editor flags*, not persisted edits to Parts. Selecting another part changes the inspector target only; it never silently Auto-binds or overwrites weights. Do not show a separate competing legacy panel when assembled Atlas sources are present; preserve the legacy controls when no assembly is present.

**Opacity/diagnostics:** Skin must draw all assembled texture triangles at 100% authored sprite opacity. Selection may use a thin wireframe, skeleton emphasis, or optional separate heatmap colour wash, but must never make unselected art see-through. Heatmap Off is the starting state. Selection overlays are editor-only. Pan/zoom is unaffected unless the explicitly armed Pick Vertex action captures one tap. Sliders should live-preview while dragging and commit a single Undo history step on release/change; Cancel/Discard restores only the editable Setup transaction.


### v1.1.10 — Compact Skin rows, diagnostic weight feedback and zoom

- Skin list uses the Atlas/Parts grammar: a single clean row per part; a one-line name (ellipsized only if necessary) with a small binding-status caption **within** that name button; Hide/Solo/Lock aligned in the row. Never allow two-row grid auto-placement to make the list needlessly tall or wrap a whole part name through multiple lines.
- Bone Peak/Falloff controls must clearly distinguish local/maximum influence from rigid, whole-mesh assignment. The inspector displays selected bone's **actual minimum and maximum** across vertices, and offers an explicit undoable Rigid bind command for mechanical verification.
- Anim Lab normal viewport pinch zoom is permitted from 35% to 900%, with Fit always restoring 100%. Zoom changes are a local editor view, not a UV or mesh edit.


## v1.1.11 — Skin envelope controls and predictable influence UX

For a bone slider, **0 must mean no contribution from that bone**. Do not secretly redistribute its weight onto a disabled/zeroed bone. The new assembly Skin inspector exposes a selected bone's Strength and two clearly identified capsule boundaries: **Inner radius (100% of configured Strength)** and **Outer radius (0%)**. Show thin, non-obscuring outlines via an explicit Envelope toggle and the real 0–100% heatmap over opaque artwork. Show actual effective min/max and residual rest weight. Bound envelope radii must never cross silently; manual overrides and legacy-weight activation must be explained, reversible and Undo-friendly. Skin should reuse Atlas/Parts pattern (parts list, one edit inspector, advanced vertices) rather than reinstate a second heavyweight mode. When a user edits a diagnostic whole-part Rigid Bind via envelope sliders, return to soft binding rather than silently ignoring the new input.

Animation should run at usable phone speed without requiring reduced artwork opacity. Cache/reuse texture resources and keep frame rendering separate from full editor dirty/UI refresh. Avoid per-vertex JSON clones during each animation frame. WebGL may be unavailable; always retain a tested 2D fallback. The original Fox art, source Atlas PNG and rig/clips are not modified by preview acceleration.

## v1.1.12 — Skin / Animate parity guard (21 Oct 2026)

When adjacent character workspaces show the same authored parts with different geometric appearance, do not present the deformation controls as the first suspect without comparing render pathways. This release uses a **single Canvas2D atlas triangle compositor** in Skin, Animate and Quick Play and turns off v1.1.11's unverified WebGL animation-only branch. No authoring controls or saved setup records are altered. GPU reintroduction must be optional and must pass a same-pose **pixel/geometry comparison on the target device** (all triangle UVs, alpha and layering). Do not introduce a new compositor and a new skinning model in the same release without isolating both.

### v1.1.13 — Animation authoring performance guardrail (2026-10-21)

Do not alter an artist's rig, skin envelopes or binding values to compensate for slow preview rasterisation. Keep Skin, Animate and Quick Play geometrically consistent through one tested renderer; a new GPU backend must be independently validated against Canvas2D on actual iOS/Safari before being enabled. Optimize CPU draw calls without removing topology or changing authoring data. For phone testing, compare frames at identical animation poses, inspect draw-call statistics and note zoom/display resolution. Every README in a patch ZIP continues to describe **only that drop**; cumulative engine and task documents can include long-term plans.


### v1.1.14 — Continuous IK direct manipulation

A dragged IK handle/precision pad should move visually every rendered frame, not rebuild the entire character document and tool UI per touch event. Keep an ephemeral working pose until release, and coalesce pointer samples to the browser's visual refresh. Update the selected control's numeric readout during manipulation, then update the full inspector/Save state once committed. The last pointer position **must** be applied on pointerup even if a preceding frame was skipped. Cancellation must neither write a sparse key nor add Undo history. Pausing playback at drag start prevents competing pose evaluation. Do not suppress full updates for actual committed edits, or mask slow textured renderer performance as a weighting issue.

## v1.1.15 — IK pole/bend authoring contract (22 October 2026)

In quadruped rigs, a Paw Target must never silently flip the elbow/knee compared with its authored Rest pose. In the Fox family the elbow/knee branch is calculated once from current rig geometry (Socket, Knee, Wrist/Hock) and held consistent across pose evaluation: foreleg bends backwards and hind knee forwards on the current authored rest layout. If the rig is edited to another anatomical branch, IK follows *that* rest branch. An ambiguous straight rest rig uses the documented nominal fallback and may eventually need an explicit pole-control tool. Avoid a second independent bend decision in Animate versus Rig, and do not equate this bend-branch correction with Skin weights or animation playback performance. No new UI is added in this drop.


## v1.1.16 — Skin shape editing convention

Stage 1 binary rectangles follow the existing select part → select bone → edit controls pattern. The four local bone-space Scale X/Y and Offset X/Y properties are grouped together. Live input previews should only redraw and the completed gesture commits one Setup edit (Undo/Redo/Save/Discard). An unobtrusive rectangle gizmo, heatmap and covered/unassigned count make actual assignment understandable. Preserve existing saved capsule weights until explicit opt-in; no automatic data rewrite on entering the workspace. Do not claim a whole mesh will move rigidly unless its vertices have 100% ownership by the same bone. Release README files describe the specific release only; canonical docs are cumulative.


## v1.1.19 — Joint-owned Skin boundaries (first stage, 22 October 2026)

In an Atlas-assembled part's Skin editor, keep the prior bone rectangle/Joint Fit mode accessible for regression comparison; **convert only on a deliberate per-part button press**. New binary joint mode shows one **Edit joint** picker (e.g. Socket/Elbow/Wrist/Paw or Hip/Knee/Hock/Paw) followed by four related authoring controls: shared line Width, rest-mitre Rotation and line Local X/Y Offset. Joint controls, unlike the original rectangles, are responsible for both endpoints of neighbouring bone regions; never make the artist adjust both bone edges independently. Show an outline for the selected bone influence polygon plus a clear active joint line. A single Save/Undo operation records each completed slider gesture, not every `input` event. Invalid crossing/inversion should show a concise warning and preserve last valid binding.

The controller is on the **Skin joint property within the selected part**, not a new animated rig joint or IK target. It is recomputed from the saved rest skeleton and only authors rest-pose vertex ownership. Switching preview poses must never repick owner bones. Remain 100% binary in this drop. Subsequent per-joint blend-distance/falloff controls must be separately implemented and acceptance-tested; do not sneak them into a shape-only patch. Existing legacy Fox mode and previous rect/capsule bindings remain valid.
