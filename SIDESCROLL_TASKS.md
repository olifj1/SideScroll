# SideScroll Development Tasks

Persistent working backlog for the SideScroll / Aureli project. Keep this file in future builds and update it as tasks are completed, split, reprioritised or discovered.

## Editor architecture / workflow system update — October 2026

**Status:** approved architecture; **Stage 1 implementation started in v1.0.117**. The reusable drawer/session/history foundation and World Group Editor v2 are now the first production implementation. On-device workflow tuning and the remaining generic route-stack work are still pending before Stage 1 is considered fully closed. The same principles should then be reused for Puzzle editing and other authoring systems where appropriate.

### Stage 1 implementation progress — v1.0.117

Implemented in the first Stage 1 code pass:

- Persistent left-side Editor Drawer with fixed header, one scrolling body, fixed footer and a collapsed rail state.
- Tap and horizontal swipe collapse/expand from SideScroll-owned drawer surfaces rather than the iOS screen edge.
- Stable Back/context/collapse positions and fixed Undo/Redo + Save/Discard/Done footer positions.
- A bounded World Group edit session that holds scene persistence until Save.
- `Save` commits the session; `Discard` restores the full entry checkpoint. A newly created unsaved group is also removed by Discard.
- Dirty-session guards prevent scope/Play exit from silently abandoning or committing Group changes.
- Shared `beginEditorTransaction` / `commitEditorTransaction` / `cancelEditorTransaction` foundation with bounded Undo/Redo history.
- Pointer drag transactions for group-member movement, whole-group movement, exclusion-shape editing and collision-handle editing: one drag becomes one history action.
- Dedicated World Group workspace with `Contents / Exclusions / Group` tabs.
- Authoritative group child list including ordinary assets, Thought Nodes and Camera Nodes.
- Authoritative exclusion list with stable exclusion IDs; old previous/next zone navigation removed from the UI.
- Add / toggle / fit / duplicate / delete exclusion actions are contained inside Group Edit.
- Surrounding authored objects remain visible but cannot be picked while Group Edit owns the viewport.
- New assets placed during Group Edit automatically belong to the group and each placement is one Undo action.
- Explicit Detach vs Delete member actions.
- Existing Position, Collision, Thought and Camera inspectors remain reusable sub-tools; opening them does not end the Group session.
- Normal Environment mode now exposes only group-instance operations such as Edit, Move, Rename, Duplicate, Dissolve and Delete.

### Stage 1 performance correction — v1.0.119

The first on-device Stage 1 test exposed two performance-sensitive implementation details that must remain part of the editor-shell rules:

- The persistent drawer must **not** use live `backdrop-filter` blur over the WebGL viewport. The Stage 1 drawer is much larger than the old compact panel, so continuously blurring the live scene is an avoidable iPhone/Safari compositor cost. Use a sufficiently opaque panel surface instead.
- Read-only render queries must never perform schema migration/normalisation. World Group exclusion IDs are now normalised once per group object rather than rebuilding exclusion records in the per-object draw path.
- Procedural dressing exclusion bounds are flattened once per rendered frame and reused by every dressing object rather than rescanning/rebuilding all World Group zones for every object.
- Treat this as a general engine rule: **migration, validation, deep-copy/history work and DOM rebuilding belong at load/edit/transaction boundaries, not inside per-frame or per-object render paths.**

Still pending within the wider Stage 1 shell work:

- General-purpose drawer route stack/navigation service; v1.0.117 has the first Environment -> World Group context transition but not the fully reusable route stack yet.
- Physical drawer-follow animation while the finger is moving; v1.0.117 supports deliberate horizontal swipe/tap collapse with intent thresholding.
- Broader route scroll-position restoration beyond the persistent current drawer body.
- Central Undo coverage outside World Group Edit.
- On-device iPhone/A2HS ergonomics pass after this build is tested.

### Why this update exists

SideScroll now has capable local authoring tools, but the Play editor has grown incrementally. Selection, editing, placement, movement and persistence are sometimes represented by independent booleans or tool-specific mini-modes. That makes it possible to mutate authored data without entering a clearly bounded edit context, and it makes Save / Discard / Undo behaviour inconsistent between systems.

The redesign borrows the **workflow principles** of Unity Prefab Mode / Hierarchy / Inspector and Unreal Level Instance Edit Mode / Outliner / Details / specialised Editor Modes, while keeping the UI phone-first rather than copying a desktop editor literally.

Reference patterns researched for this design:

- Unity 6 Prefab Mode in Context: edit a prefab while retaining scene context.
- Unity Hierarchy + Inspector: one authoritative object list linked to one context-sensitive property editor.
- Unity Prefab overrides: explicit apply/revert semantics for instance changes.
- Unity Undo grouping: interaction boundaries such as pointer-down / pointer-up naturally form one Undo action.
- Unreal Level Instances: selecting an instance is separate from entering Edit; surrounding content is visually de-emphasised/locked; editing ends with Commit or leaving without committing.
- Unreal Outliner + Details: scene hierarchy/selection is separated from selected-object properties.
- Unreal Level Editor Modes / Actor Editor Context: specialist tasks have an explicit active context rather than overlapping global toggles.

### Core SideScroll editor rules

These are the rules future editor systems should converge on.

1. **Select is not Edit.** Selecting an authored unit lets us inspect, focus, move the whole instance where appropriate, duplicate it, or delete it. Editing its internals requires an explicit edit context.
2. **One active authoring context.** At any moment the editor should know which context owns edits: Environment, World Group, Puzzle, Terrain, Asset Definition, etc. Do not combine unrelated edit-mode booleans into accidental states.
3. **One selected thing.** Viewport taps and list taps should resolve to the same selection model. A selected thing drives one context-sensitive Inspector/Details area.
4. **Lists/hierarchies are authoritative; viewport manipulation is complementary.** Dense scenes must never require repeated tapping to rediscover a hidden asset/node/zone.
5. **One active sub-tool.** Transform, Collision, Exclusion, Path, Respawn, Placement etc. are tools *inside* the current context, not independent top-level editing modes.
6. **Authored edits are transactional.** Meaningful authoring contexts support Undo. Bounded edit sessions support Save/Discard where abandoning the whole set of changes is useful.
7. **One drag = one Undo action.** Begin the transaction on pointer-down, update live while dragging, commit on pointer-up only if persistent state changed.
8. **Ownership must always be visible.** The UI should make clear whether something belongs to the World, a World Group, a Puzzle, a reusable Template, or global Asset Defaults.
9. **Outside-context content is protected.** When editing a group/puzzle, unrelated authored content remains visible for context but is non-pickable/non-editable and may be visually de-emphasised.
10. **Global settings are separate from authored content.** Camera defaults, Fog, Post, Debug and future Streaming settings should not be mixed into object/group editing controls.
11. **Dangerous/destructive actions are explicit.** Delete, dissolve/detach, reset and template-application actions must be visually and semantically distinct.
12. **Phone-first navigation uses drill-in rather than desktop clutter.** Prefer a single workspace that swaps between List → Details → focused sub-tool, with breadcrumbs/back controls, rather than trying to display Outliner + Inspector + viewport side-by-side.

---

## Unified editor shell / swipe-drawer navigation — approved direction

**Status:** approved design direction; should be implemented as part of the shared editor foundation rather than as a cosmetic pass after individual tools are rebuilt.

### Why this needs to be a system, not a styling pass

The current Play editor uses several different UI geometries at once:

- The main Environment/Puzzle editor is a large panel on the **left**.
- Camera, Fog, Post, Sections and Sound open as independent panels on the **right**.
- Selected-object actions live in a separate **bottom horizontal strip**.
- Thought, Camera Node, Transform and Ground-Line editing use their own focused popovers/panels.
- The global Tools launcher is a compact panel at the **top-right**.
- Different panels use different combinations of `×`, `Done`, `Back`, panel replacement, auto-close and direct mode toggles.
- Some panels scroll themselves, some contain nested scrolling regions, and some rely on the overall available viewport height.

The result is that controls can appear in different places for conceptually similar actions, opening one panel may close another for implementation reasons rather than workflow reasons, and it is not always obvious whether `×`, `Done`, a scope button or another menu button is the correct way out.

The future editor should therefore have one reusable **Editor Drawer shell** and one consistent navigation grammar. World Group Editor v2, Puzzle Editor v2, Terrain Edit, the Environment hierarchy/Inspector, World/Look settings and Diagnostics should all be pages/contexts hosted by that shell rather than each inventing their own screen position and exit rules.

### Reference pattern and SideScroll adaptation

Useful Unreal patterns:

- The Level Editor keeps stable conceptual regions: Viewport, Outliner, Details, toolbar and Content Browser/Drawer.
- The Content Drawer is a temporary browser that can be opened when needed; a Content Browser can also be moved to a sidebar where it collapses to a persistent tab rather than being destroyed.
- Editor Modes change the active toolset while preserving the overall editor layout.
- Details remain a predictable place for the selected object's properties.

SideScroll should borrow the **predictability and persistence**, not the desktop layout. On iPhone landscape we cannot permanently show Outliner + Details + Content Browser simultaneously, so they become routes within one drawer.

### Primary layout

Use one **left-side Editor Drawer** as the default authoring surface.

Why left by default:

- It matches the current Environment/Puzzle panel position, so the biggest existing workflow does not jump sides.
- It leaves the upper-right global `Menu` control and the right side of the world view visually distinct.
- In Play, the player's right-side interaction controls already establish that side as gameplay/action territory.
- It gives Group/Puzzle/Terrain editing one stable home instead of inheriting whichever side the legacy panel used.

The exact expanded width should be tuned on-device, but the target is roughly the current authoring-panel footprint: enough for readable lists/controls without consuming most of the landscape viewport.

### Drawer states

The drawer should have three conceptual states:

1. **Absent** — only when the editor is not active, for example normal Play.
2. **Expanded** — full authoring panel visible.
3. **Collapsed to rail** — the editor remains active, but only a narrow persistent rail/grip remains visible at the left edge of the app's own safe area.

Important rule: **collapsing the drawer is not leaving the mode.**

If Group Edit is active and the drawer is collapsed, Group Edit remains active, outside-group content remains protected, the edit session remains dirty if applicable, and Undo history remains intact. The rail should show enough state to remind the user where they are, for example a compact mode mark plus a dirty indicator.

The drawer should only disappear completely when leaving Edit/authoring mode altogether.

### Swipe / drag behaviour

The SideScroll drawer should feel like a physical panel that can be pushed aside and pulled back.

- Dragging the drawer's exposed **grip/rail** horizontally should move the drawer with the finger.
- Releasing past a distance/velocity threshold snaps to expanded or collapsed.
- Tapping the rail/chevron is the non-gesture fallback and performs the same expand/collapse action.
- Use a transform-based slide where practical rather than continuously re-laying out the whole viewport.
- Start the drawer gesture only from the drawer/header/grip region. Do **not** depend on swiping from the extreme screen edge, because iOS owns edge gestures and SideScroll should not compete with them.
- Once a gesture has moved far enough to determine intent, axis-lock it: horizontal movement controls drawer collapse/expand; vertical movement remains panel scrolling.
- A drawer gesture must never leak through and move/select an authored world object underneath it.

This gives the requested Unreal-like ability to get the UI mostly out of the way without losing the current editing context.

### One fixed header grammar

Every authoring drawer page should use the same pinned header geometry.

Recommended structure:

```text
[ Back ]   WORLD GROUP > Fallen Tree Area     [ ‹ Collapse ]
```

Rules:

- **Back is always in the same top-left position** when there is a parent route.
- The centre/remaining area always identifies the current context/selection.
- The drawer collapse control is always in the same outer-edge position.
- Do not use `×` for navigating out of authoring modes or sub-tools.
- `×` is reserved for genuinely transient overlays/dialogs where closing means dismissing that overlay, not changing editing context.
- Breadcrumb text can be shortened on narrow screens, but the physical button positions should not move.

Examples:

```text
ENVIRONMENT
WORLD GROUP > Fallen Tree Area
PUZZLE > Broken Bridge
TERRAIN > Section 18
WORLD / LOOK > Fog
DIAGNOSTICS > Performance
```

### Entering and leaving modes consistently

The editor needs predictable semantics for three different actions that are currently blurred together:

**Enter**

- `Menu > Edit` enters Environment editing and opens the drawer.
- `Edit Group`, `Edit Puzzle`, `Terrain Edit`, etc. change the active editor context **inside the same drawer shell**.
- Entering a focused child/tool changes drawer route/content; it does not spawn a panel elsewhere on screen.

**Back**

- Goes up one navigation level inside the current context.
- Example: Group child Inspector -> Group Contents.
- Back does not silently abandon a dirty edit session.

**Exit / commit**

- Transactional edit contexts use a fixed bottom action area with `Save` / `Discard` semantics.
- Non-transactional focused tools use a consistent `Done` or Back action rather than an arbitrary close button.
- Leaving top-level Environment editing returns to Play through one clearly named `Done Editing` action in a consistent place.

For example:

```text
Group child Inspector
[ Undo ] [ Redo ]                 [ Back ]

Group Edit root — dirty
[ Undo ] [ Redo ]          [ Discard ] [ Save ]

Environment Edit root
[ Undo ] [ Redo ]                         [ Done Editing ]
```

Exact button packing can be tuned, but the meaning and placement should remain stable.

### Pinned header, pinned footer, one scroll body

The default drawer layout should be:

```text
┌─────────────────────────────┐
│ fixed header                │
├─────────────────────────────┤
│ optional fixed tabs         │
├─────────────────────────────┤
│                             │
│ ONE vertical scroll body    │
│                             │
├─────────────────────────────┤
│ fixed action/footer area    │
└─────────────────────────────┘
```

Scrolling rules:

- The drawer shell itself owns the primary vertical scroll region.
- Header and primary exit/commit controls should not scroll away.
- Avoid nested vertical scrolling wherever possible; long Contents/Outliner lists should normally be part of the drawer body.
- If a sub-list genuinely needs independent scrolling later, it must be visually obvious and should not create competing swipe regions by default.
- Preserve the current drawer route's scroll position when the drawer is collapsed and reopened.
- Preserve useful scroll position when returning Back to a parent list.
- Entering a different selected entity/details page can start at the top unless there is a strong workflow reason to restore its previous position.
- Continue the existing deliberate-tap-vs-scroll protection: controls should activate after a tap/release that did not become a drag, so vertical scrolling remains safe on touch.
- Use `overscroll-behavior`/touch containment so reaching the end of a drawer does not pan/manipulate the world underneath.

### Tabs and drill-in pages

Tabs are appropriate only for a small number of stable peer categories within one context, for example Group Editor:

```text
CONTENTS | EXCLUSIONS | GROUP
```

Rules:

- Tabs stay directly under the fixed header and remain visible while the body scrolls.
- A selected child should normally **drill into Details/Inspector** rather than trying to append an enormous property form below a long list.
- Back returns to the same tab/list and preferably the same scroll position.
- Focused sub-tools such as Collision, Exclusion Shape or Cart Path should remain within the drawer route hierarchy, even if the viewport gains specialist handles/overlays.

### Collapsed rail behaviour

The collapsed rail is important enough to be a first-class UI state rather than a mostly hidden chevron.

It should provide:

- A reliable grab/tap target within the safe area.
- An expand chevron.
- A compact indication of active context, e.g. `EDIT`, `GROUP`, `PUZZLE`, `TERRAIN` or a simple consistent icon/badge.
- A visible dirty dot/mark when the active transactional context has unsaved changes.
- Optional Undo availability indicator later, but do not overload the rail with many action buttons.

The rail should **not** become a second toolbar. Its job is orientation and drawer recovery.

### Global Menu vs Editor Drawer

Keep the global `Menu` launcher at one fixed viewport position. It should not jump when entering Edit.

Longer-term behaviour:

- In Play, `Menu` opens the normal global launcher/settings route.
- `Edit` from that launcher enters Environment Edit and opens the persistent Editor Drawer.
- While an authoring context owns the drawer, opening another authoring context must go through the central context-transition/dirty guard rather than simply hiding the current panel.
- Non-authoring quick toggles such as view/debug visibility may remain direct actions where useful.
- Camera/Fog/Post/Sections should eventually stop spawning independent right-side panels and become routes under the shared shell (`World / Look`, `Terrain`, `Diagnostics`, etc.).
- Sound and Inventory are player/global utilities rather than authored scene contexts; they may remain transient overlays, but they should still adopt the same visual header/close conventions if they remain separate.

### No more button teleporting

Future UI reviews should reject workflows where the same conceptual action appears in unrelated positions depending on mode.

Standard positions:

- Global `Menu`: fixed viewport position.
- Drawer Back: fixed top-left inside drawer.
- Drawer context/title: fixed header area.
- Drawer collapse/expand: fixed outer edge/header/rail.
- Undo/Redo: fixed footer area when available.
- Save/Discard/Done Editing: fixed footer area according to context.
- Destructive entity actions: inside Details/Group/Puzzle pages, visually separated from navigation.

Do not put `Delete`, `Save`, `Done`, `Back` and panel-close controls into whichever gap happens to be available in a specific feature.

### Proposed reusable UI/state model

The central editor model should eventually include drawer/navigation state alongside authoring context. Conceptually:

```js
editor = {
  mode: 'play' | 'environment' | 'world-group' | 'puzzle' | 'terrain',
  ownerId: null,
  selection: { type:null, id:null },
  tool: 'select',
  session: null,
  history: null,
  ui: {
    drawer: 'expanded', // expanded | collapsed
    route: ['environment'],
    scrollByRoute: {}
  }
};
```

The exact data shape is not important. The important architectural services are:

- `enterEditorContext(...)`
- `requestLeaveEditorContext(...)` with dirty/session guard
- `pushEditorRoute(...)`
- `popEditorRoute(...)`
- `setEditorDrawerCollapsed(...)`
- one central place that decides what the drawer renders

This prevents feature code from individually setting `panel.hidden`, closing three unrelated panels and toggling body classes every time a mode changes.

### Migration strategy

Do not attempt to restyle every legacy panel at once.

**Stage 1 — shell foundation + World Group Editor v2**

- Build the reusable drawer shell, rail, pinned header/body/footer and route stack.
- Environment root and World Group Editor v2 become the first real users.
- Add consistent Back, collapse, Save/Discard, Undo/Redo positions.

**Stage 2 — Puzzle Editor v2**

- Reuse the exact shell/navigation model.
- Puzzle Contents/Zones/Logic/Paths become drawer routes/tabs.

**Stage 3 — general Environment / Inspector / placement**

- Replace the legacy bottom action strip and asset palette with drawer-hosted selection/Inspector/library flows where appropriate.
- Asset placement can temporarily collapse the drawer automatically to give viewport space, but the rail remains present and placement status remains visible.

**Stage 4 — Terrain, World/Look, Diagnostics**

- Sections/Terrain becomes Terrain Edit in the drawer.
- Camera/Fog/Post move into World/Look routes rather than separate right-side windows.
- Performance/debug/streaming visualisation use Diagnostics routes.

**Stage 5 — consistency pass**

- Remove obsolete independent panel-open booleans/functions where the shared shell has replaced them.
- Review all remaining `×`, `Done`, Back, Save, Reset and Delete controls against the common grammar.
- Verify touch/scroll/rail behaviour on iPhone landscape and A2HS/PWA safe areas.

### Unified drawer implementation tasks

- [x] Build one reusable phone-first Editor Drawer shell. *(v1.0.117 first production shell)*
- [x] Anchor authoring drawer consistently on the left. **On-device width tuning remains.**
- [x] Add persistent collapsed rail/grip; collapsed is not closed.
- [x] Add horizontal swipe collapse/expand with tap fallback. *(Finger-follow animation can be refined later.)*
- [x] Keep gestures away from the OS-owned extreme screen edge.
- [ ] Add gesture axis locking so vertical scroll and horizontal drawer movement do not fight.
- [x] Create fixed header positions for Back/context/collapse controls.
- [x] Create fixed footer positions for Undo/Redo and Save/Discard/Done according to context.
- [ ] Use one primary vertical scroll body with pinned header/footer and preserved route scroll positions.
- [ ] Create a drawer route stack / navigation service rather than feature-specific panel visibility toggles.
- [x] Make dirty-session guards run before context/route changes that would abandon work. *(World Group first production integration.)*
- [x] Keep global `Menu` in one fixed viewport position.
- [x] Migrate World Group Editor v2 into the drawer first. *(v1.0.117)*
- [ ] Migrate Puzzle Editor v2 second.
- [ ] Migrate Environment Outliner/Inspector/asset placement as the general editor shell matures.
- [ ] Migrate Terrain, Camera/Fog/Post and Diagnostics away from floating independent panels.
- [ ] Reserve `×` for transient overlays/dialogs, not authoring navigation.
- [ ] Audit all menu/button positions after migration so equivalent actions no longer jump around between workflows.

---

## World Group Editor v2 — approved specification

### Problem in the current implementation

The current World Group system has separate `worldGroupEditMode`, `worldGroupMoveMode` and `worldGroupExclusionEditMode` states. Exclusion editing actually turns normal Group Edit off. Several group mutations—including exclusion add/toggle/fit/delete and membership changes—write directly to scene persistence even when a proper Group Edit session was never entered.

The exclusion accessor also normalises/rebuilds the exclusion array while reading it. That is acceptable for migration/validation but is a poor basis for holding UI identity on a selected exclusion. The new workflow should give each editable child/zone stable editor identity rather than navigating a mutable array only by a global previous/next index.

The solution is **not** to add more buttons to the existing World Groups block. World Groups need a dedicated editing context.

### Normal Environment mode — group instance selected, not opened

A selected World Group behaves as one authored spatial instance. Allowed instance-level operations:

- Focus/select the group.
- Move the whole group from its origin handle / transform control.
- Duplicate Group.
- Rename Group.
- Delete Group.
- Dissolve Group into standalone world objects, with clear confirmation.
- Enter **Edit Group**.

Not allowed outside Group Edit:

- Editing individual member transforms/settings.
- Adding/removing group membership.
- Editing exclusions.
- Editing group-owned Thought/Camera Nodes.
- Adding internal assets directly to the group.
- Mutating internal member collision/placement behaviour.

This creates the essential prefab/instance distinction: moving the whole instance is not the same operation as editing its contents.

### Entering Group Edit

Pressing **Edit Group** should:

- End/cancel incompatible placement or focused tools cleanly.
- Create a `worldGroupEditSession` checkpoint containing all persistent state needed to restore the group exactly.
- Set one explicit editor context such as `context = { type:'world-group', id:<groupId> }`.
- Replace the normal Environment workspace with the dedicated Group Editor.
- Keep the surrounding world visible **in context**, but make non-group authored content non-pickable/non-editable. Optional visual dim/desaturation can reinforce the boundary.
- Select no child initially, or restore the last child selection only if it still exists.
- Show a persistent header/breadcrumb indicating the active group and dirty state.

Suggested phone-first header:

```text
EDIT > WORLD GROUP > Fallen Tree Area
Unsaved changes

[ CONTENTS ] [ EXCLUSIONS ] [ GROUP ]
```

The exact visual styling can follow the existing focused Thought/Camera workspace replacement pattern.

### Contents tab — authoritative child list

The Contents list should enumerate **everything owned by the group**, not only environment sprites.

Examples:

- Environment assets.
- Gameplay-capable environment assets that are still world-owned.
- Thought Nodes.
- Camera Nodes.
- Future group-owned nodes/tools.

Each row should show enough state to identify it quickly, for example:

```text
Tree 03                 Ground
Rock 02                 Follow Normal
Broken Branch           Free
Thought: bridge edge    Thought
Camera: reveal          Camera
```

Behaviour:

- Tapping a row selects exactly that child in the viewport.
- Viewport selection selects/highlights the corresponding row.
- Selection is never dependent on repeated tap-cycling alone.
- The selected child opens the correct context-sensitive inspector/tool.
- `+ Add` opens the asset/node picker and new placements automatically belong to the currently edited group.
- `Add Existing` / `Attach Selected` may be provided where useful, but must be an explicit Group Edit action.

For removing ownership, distinguish:

- **Detach from Group** — object remains in the world as standalone authored content.
- **Delete** — object is removed from the world.

Do not use one ambiguous button for both meanings.

### Exclusions tab — replace previous/next zone buttons with a list

Exclusions should become named/stable child entries inside the Group Editor.

Example:

```text
EXCLUSIONS
+ ADD EXCLUSION

Exclusion 1       ON      4.8 × 3.2 m
Exclusion 2       ON      2.4 × 5.1 m
Exclusion 3       OFF     3.0 × 2.5 m
```

Selecting a row highlights only that exact exclusion and exposes its controls:

- Enabled ON/OFF.
- Edit Shape / direct handles.
- Fit to Group.
- Duplicate Exclusion.
- Delete Exclusion.
- Optional Rename later if real projects make numbered zones unclear.

Rules:

- Adding an exclusion creates a **new** entry and selects it. Existing exclusions cannot be replaced or silently lost.
- The old `← Zone` / `Zone →` workflow should be removed.
- Exclusion editing is a sub-tool inside Group Edit, not a separate top-level mode that disables Group Edit.
- Each exclusion should have a stable ID for UI selection/history rather than relying only on array position.
- World Group duplicate/template serialization must preserve all exclusion IDs/content appropriately; duplicated groups should receive new exclusion IDs if IDs are treated as entity identity.

### Group tab

Group-level information/actions should live separately from child editing:

- Group name.
- Origin position / optional explicit X/Z fields.
- Bounds/extent summary.
- Member count by type.
- Exclusion count.
- Template/source information if that relationship grows later.
- Dangerous actions such as Dissolve/Delete should be separated visually from normal editing and normally remain instance-level operations outside the active session unless a clear reason emerges.

### Child Inspector / Details pattern

When a child is selected, controls should be context-sensitive rather than exposing every possible editor button at once.

Possible sections:

- Transform / placement.
- Ground / Free / Follow Surface Normal status.
- Scale / flip / visual placement.
- Collision override.
- Gameplay behaviour where applicable.
- Thought settings if a Thought Node.
- Camera settings if a Camera Node.

The existing focused Thought/Camera workspace replacement is a useful prototype for this drill-in model and should be integrated rather than discarded.

### Save / Discard session behaviour

Entering Group Edit creates an edit-session checkpoint.

**Save**:

- Commits the current working group state.
- Clears the edit-session dirty flag/history scope as appropriate.
- Exits Group Edit back to Environment selection with the group still selected.

**Discard**:

- Restores the complete checkpoint: member transforms, new/deleted members, membership, exclusions, Thought/Camera nodes, collision/settings and any other persistent group-owned state.
- Exits Group Edit back to the original instance state.

Trying to leave Group Edit with unsaved changes should offer:

```text
Unsaved Group Changes
Save
Discard
Continue Editing
```

A simple accidental panel change or scope switch must never silently commit or abandon the session.

### Undo / Redo inside Group Edit

Group Edit should be the first consumer of the shared central authoring-history service.

Minimum meaningful transactions:

- Move child.
- Scale/flip/transform child.
- Duplicate child.
- Delete child.
- Add/detach membership.
- Add/duplicate/delete exclusion.
- Move/resize exclusion.
- Change exclusion enabled state.
- Edit Thought Node.
- Edit Camera Node.
- Add/remove node.
- Collision/property edits where those are allowed at instance level.

`Discard` is not a replacement for Undo: Undo reverses one operation; Discard reverses the entire edit session.

### Group movement outside edit

Keep whole-group movement available outside Group Edit. It is an instance transform, not an internal edit. The existing relative screen-space dragging model is appropriate; it should eventually participate in the shared Undo history as one transaction per drag.

### Templates and Duplicate Group

Keep the conceptual distinction:

- **Duplicate Group** = make one independent scene copy with fresh group/member/entity IDs.
- **Save Template / Place Template** = reusable authored source for repeated placement.

Do not force one-off duplication through template creation.

Future template work may adopt explicit instance override/apply/revert concepts similar to prefab workflows, but that should not complicate World Group Editor v2 unless a real requirement appears.

### World Group Editor v2 implementation tasks

- [x] Introduce a single explicit World Group edit-session object/checkpoint.
- [x] Add stable IDs to group exclusions and migration for existing array-only zones.
- [ ] Replace separate World Group edit/move/exclusion booleans with a clearer editor context + sub-tool model where practical.
- [x] Build a dedicated Group Editor workspace that replaces the normal Environment panel while active.
- [x] Add Contents / Exclusions / Group navigation.
- [x] Build authoritative group child list including assets, Thought Nodes and Camera Nodes.
- [x] Replace exclusion previous/next controls with selectable exclusion rows.
- [x] Lock/non-pick surrounding authored content while editing the group.
- [x] Make placements inside Group Edit automatically owned by the group.
- [x] Add explicit Detach vs Delete semantics.
- [x] Add Save / Discard with unsaved-change interception on exit/scope change.
- [x] Make Group Edit the first production consumer of shared transaction Undo/Redo.
- [x] Remove normal-UI group-internal mutation paths that can run outside Group Edit; internal controls now live in the session.
- [x] Keep whole-group Move / Duplicate / Rename / Delete as instance operations outside Group Edit.
- [ ] Regression-test group duplicate/template serialization after exclusion IDs/session changes.

---

## Engine-wide editor workflow audit — October 2026

This audit reviews the current Play editor plus World Lab, Asset Lab, Puzzle Lab, Design Lab and Walk Lab. The aim is not to recreate Unity/Unreal; it is to reuse the interaction patterns that remain valuable on a phone-sized editor.

### Current structural observations from the build

- The Play editor currently has many independent mode flags: global Edit, Puzzle Test, Puzzle Respawn, Puzzle Cart Path, Puzzle Exclusion, Puzzle Environment Placement, World Group Edit, World Group Move, World Group Exclusion, World Group Template Placement, Camera Edit, Transform Edit, Collision Edit and Ground-Line Edit.
- Several of those flags are mutually exclusive only because individual functions manually turn other flags off. This makes illegal/awkward combinations easy to introduce as features grow.
- Scene persistence is currently called directly from many feature-specific paths. This made fast incremental development possible, but it prevents one coherent Save/Discard/Undo model.
- The Environment panel mixes World Group management, Group Templates, world-object selection/filtering and asset placement in one long workspace.
- Puzzle editing mixes template browsing, scene instance selection, marker movement, instance editing, test mode, start-state persistence, exclusions, respawn and cart path tools in one panel/state machine.
- Thought/Camera Node focused workspaces are already moving toward the better pattern: selecting a special object replaces the broad panel with a context-specific editor.
- World Lab already follows a healthier `timeline selection -> context-sensitive Selection panel` pattern, but its local Undo stack is separate and coverage depends on each operation remembering to call `pushHistory`.
- Asset Lab has a good Library -> Viewport -> property-controls shape, but many changes persist immediately and it has no undo/session safety despite editing reusable defaults that can affect many instances.
- Design Lab already has a useful edit-session pattern: enter Edit, capture a snapshot, edit live/autosave, and Cancel restores the snapshot. This is a strong internal precedent for Group/Puzzle session semantics.

### Recommended editor ownership map

Each tool should have a clearly defined job so the same concept is not edited in multiple places without explicit handoff.

**Play / Environment Editor**

- Local authored scene composition.
- Standalone object placement and transforms.
- World Group instance placement and dedicated Group Edit.
- Puzzle instance placement and dedicated Puzzle Edit.
- Local nodes and direct in-world manipulation.

**World Lab**

- Macro world pacing/composition along distance.
- Biome/profile transitions.
- Terrain section overview and coarse planning.
- Puzzle/World Group authored spatial blocks and extents.
- Global streaming policy.
- Play-from-here / world navigation.
- It should not become the detailed child editor for groups/puzzles.

**Asset Lab**

- Reusable asset-definition defaults: visual layout, collision, behaviours, climb paths, sockets, mechanisms and named states.
- It should clearly distinguish global Asset Defaults from per-instance overrides authored in Play.

**Puzzle Lab**

- Isolated puzzle test harness / project launcher.
- Eventually a puzzle-library browser and validation workflow, while detailed spatial authoring can reuse the same Puzzle Edit context used in Play.

**Design Lab**

- Design-document content only. Its current explicit edit/cancel pattern should be preserved.

**Walk Lab**

- Character rig/animation/collider authoring only.

### 1. Main Play Editor shell — HIGH priority architecture

The Play editor should move from `many independent booleans + controls hidden/shown conditionally` toward one explicit editor context.

Recommended conceptual state:

```js
editor = {
  mode: 'play' | 'environment' | 'world-group' | 'puzzle' | 'terrain',
  ownerId: null,
  selection: { type:null, id:null },
  tool: 'select' | 'place' | 'transform' | 'collision' | 'exclusion' | 'respawn' | 'path',
  session: null
};
```

The exact implementation can remain pragmatic/vanilla JS; the important point is that state combinations become explicit rather than emergent.

Tasks:

- [ ] Define one central editor context/state model and migration plan from current mode booleans.
- [ ] Build the reusable Editor Drawer shell/route stack described in the Unified editor shell specification.
- [ ] Add standard enter/leave hooks so every context can clean up tools/pointers/selection consistently.
- [ ] Add the fixed phone-friendly header: Back/context/collapse positions remain stable across routes.
- [ ] Add the fixed footer/action grammar for Undo/Redo and Save/Discard/Done where applicable.
- [ ] Establish common `selection`, `tool`, `dirty`, `session`, `undo/redo` concepts before expanding more authoring features.

### 2. Scene hierarchy / Outliner pattern — HIGH priority usability

The current separate World Group list, world-object list and puzzle-object list solve pieces of the problem, but dense authoring needs one predictable list grammar.

Do **not** build a permanent desktop-style side panel. On iPhone landscape, use a drill-in hierarchy appropriate to the active context.

Environment example:

```text
ENVIRONMENT
World Groups (4)
  Fallen Tree Area
  Bridge Approach
Standalone Objects (12)
Thought / Camera Nodes (3)
Puzzles (5)   -> switches/focuses Puzzle context
```

Group/Puzzle edit then replaces this with its owned child hierarchy.

Desired behaviour:

- Viewport selection and list selection stay synchronised.
- Search/filter can be added only when real list size requires it.
- Expandable ownership groups reduce tap-cycling pressure.
- Visibility/pick-lock controls are possible later, borrowing the useful parts of Unity Scene Visibility/Picking.

Tasks:

- [ ] Design a reusable list-row/entity model for authored scene entities.
- [ ] Synchronise viewport and list selection through the central selection service.
- [ ] Reduce repeated-tap cycling to a fallback rather than the primary dense-scene workflow.
- [ ] Consider optional `hide in editor` / `lock picking` only after the hierarchy is stable.

### 3. Context-sensitive Inspector / Details pattern — HIGH priority usability

The bottom editor toolbar currently exposes action buttons based on many state checks. Over time this should become a selected-object Inspector with collapsible categories and a smaller transform/tool strip.

Possible per-instance categories:

- Transform.
- Placement (Ground / Free / Follow Surface Normal).
- Visual (scale/flip).
- Collision.
- Gameplay behaviour.
- Node-specific settings.
- Ownership / source.

Important rule: **Asset Defaults vs Instance Overrides must be visually distinct.** Asset Lab edits reusable defaults; Play edits this placed copy. If a placed copy overrides collision/visual behaviour, show that it is an override and provide explicit `Revert to Asset` / `Apply to Asset` only where safe and intentional.

Tasks:

- [ ] Define reusable Inspector sections driven by selected entity type.
- [ ] Move special-node editing into the same Details grammar while preserving focused drill-in views where useful.
- [ ] Formalise Asset Default vs Instance Override metadata/UI.
- [ ] Revisit `Save to Asset` / `Use Asset` collision wording under that model.

### 4. Puzzle Editor v2 — HIGH priority after World Groups

Puzzle editing is the strongest candidate to reuse the World Group Editor pattern.

Outside Puzzle Edit, a scene puzzle should act as one authored/stateful instance:

- Select/focus.
- Move whole puzzle marker/extent where appropriate.
- Duplicate/place another instance.
- Delete/remove.
- Test.
- Enter **Edit Puzzle**.

Inside Puzzle Edit, use a dedicated workspace with tabs such as:

- **Contents** — puzzle pieces and dressing.
- **Zones** — exclusions/respawn volumes/other regions.
- **Logic / Paths** — sockets, cart path, future puzzle-specific rails/nodes.
- **Puzzle** — bounds, instance/template source, start state, metadata.

Session behaviour:

- Checkpoint on entry.
- Undo/Redo transactions while editing.
- Save/Discard on exit.
- Test uses the current working session state without requiring a premature permanent save, similar to the current useful behaviour where Puzzle Test can exercise what is on screen.

Template/instance semantics should become clearer and closer to prefab overrides:

- A **Puzzle Template** is reusable library content.
- A **Scene Puzzle** is an instance.
- Instance edits can remain local/unique.
- If linked-template workflows are retained, expose explicit actions such as `Apply to Template`, `Revert to Template`, or `Make Unique` rather than making `Set Start` / `Save Unique` carry too many meanings.
- Never apply a scene-instance change to every linked puzzle implicitly.

Tasks:

- [ ] Design Puzzle Editor v2 after World Group Editor v2 proves the shared session/list/inspector pattern.
- [ ] Separate scene-instance operations from internal puzzle editing.
- [ ] Convert exclusion, respawn and cart path into sub-tools inside Puzzle Edit rather than independent editor modes.
- [ ] Add owned Contents list for puzzle pieces, dressing, Thought/Camera Nodes and future logic objects.
- [ ] Replace current persistence wording with explicit Instance vs Template semantics.
- [ ] Preserve fast current-state Test workflow inside the edit session.
- [ ] Reuse central Undo/Redo and Save/Discard.

### 5. Terrain / Sections — HIGH/MEDIUM priority

Terrain Sections currently live as a standalone panel reachable beside other game/debug settings. Conceptually this is a specialist authoring mode, closer to Unreal Landscape Mode than to a generic settings popup.

Recommended direction:

- Enter **Terrain Edit** from the main Edit workspace.
- The world remains visible; authored objects are non-pickable unless a terrain tool explicitly needs them.
- Section list/navigation and selected-section Details live in one workspace.
- Height, linked subsequent sections, depth-layer modes, river parameters and procedural reset are properties/sub-tools of the selected section.
- Terrain drags/sliders participate in central Undo transactions.
- Consider a session-level Discard only if terrain editing proves risky enough; Undo may be sufficient for routine section editing once history is reliable.

Tasks:

- [ ] Move Sections conceptually under Edit rather than treating it as an unrelated stage popup.
- [ ] Define Terrain as an explicit editor context.
- [ ] Make selected section the central selection object with context-sensitive Details.
- [ ] Route terrain height/type/layer/reset edits through shared history.
- [ ] Keep World Lab as macro overview; avoid duplicating low-level terrain editing in both tools.

### 6. Global World / Look settings — MEDIUM priority cleanup

Camera defaults, Fog and Post are global scene/look settings, not object editing modes. Unreal's World Settings pattern is a useful conceptual reference.

Recommended consolidation:

```text
WORLD / LOOK
Camera
Fog
Post
Audio (or keep Sound separate as player-facing)
```

This does **not** mean one enormous panel. On phone, `World / Look` can be a short category menu that drills into Camera/Fog/Post using the same panel shell.

Tasks:

- [ ] Consolidate Camera/Fog/Post navigation under a coherent World/Look settings category.
- [ ] Keep Camera Nodes as authored objects separate from global camera defaults.
- [ ] Preserve fast access where it materially helps iteration.

### 7. Debug / Diagnostics workspace — MEDIUM priority, pairs with Performance work

Depth view, collision view, future Performance metrics, streaming state and diagnostic counts belong together conceptually.

Suggested Debug workspace:

- View modes: Normal / Depth.
- Collision overlay.
- Performance panel/capture.
- Streaming active-window visualisation later.
- Current section / biome / active authored units.
- Developer quick navigation.

Player-facing Hints should not be treated as a rendering diagnostic even if it remains reachable from the same top-level menu for convenience.

Tasks:

- [ ] Create one Debug/Diagnostics category instead of accumulating independent top-level debug toggles.
- [ ] Put the planned Performance diagnostic tool here.
- [ ] Add streaming visualisation here when authored-content streaming exists.
- [ ] Consider moving developer `Go to` navigation here while keeping editing focus actions inside each authored context.

### 8. World Lab workflow — MEDIUM priority refinement

World Lab already has several good architectural traits:

- Timeline as the primary world overview.
- A single selected item.
- A context-sensitive Selection panel.
- Direct Play From Here.

Keep that overall shape.

Improvements:

- Selection should remain inspection/macro placement; detailed group/puzzle internals should open the appropriate Play editor context rather than being reimplemented in World Lab.
- Add a true World Settings/Streaming panel for global authored-content streaming policy.
- Unify Undo semantics with the central transaction model. The current 30-snapshot local stack is useful but should not remain a separate mental model, and every edit path must participate consistently.
- Add Redo once shared history exists.
- Keep biome/profile management as a dedicated library/details flow rather than allowing it to crowd the timeline selection panel.

Tasks:

- [ ] Preserve timeline -> Selection panel architecture as the World Lab baseline.
- [ ] Add explicit `Edit in Game` handoff for World Groups/Puzzles where appropriate.
- [ ] Move global streaming policy into a World Lab settings panel.
- [ ] Replace/bridge the local history stack with shared transaction semantics and add Redo.
- [ ] Audit all World Lab mutations for Undo coverage before expanding features.

### 9. Asset Lab workflow — MEDIUM priority

Asset Lab is already close to a specialised asset editor: Library, viewport and asset-specific controls. The main missing safety is transactional editing of **reusable defaults**.

Recommended direction:

- Treat selecting an asset as opening its **Asset Definition**.
- Organise controls into clear components/categories: Visual, Collision, Placement Behaviours, Climb Paths, Sockets, Mechanism, States.
- Add per-asset Undo/Redo.
- Consider an edit-session snapshot with Save/Discard, especially for collision/mechanism/state changes that affect every placed instance.
- Clearly surface that changes affect Asset Defaults globally.
- Use the same Instance Override language in Play so the relationship is obvious.

Tasks:

- [ ] Add Asset Lab Undo/Redo using the shared transaction conventions.
- [ ] Evaluate Save/Discard per selected asset rather than unconditional immediate persistence for all changes.
- [ ] Reorganise controls into collapsible asset-component categories.
- [ ] Formalise Asset Defaults / State Defaults / Instance Overrides terminology.

### 10. Thought Nodes / Camera Nodes — LOW architectural risk, integrate rather than rewrite

The existing focused editor replacement is already a good phone-first pattern.

Tasks:

- [ ] Make nodes normal owned children in Environment/World Group/Puzzle lists.
- [ ] Keep their focused Details UI but enter it through central selection/context rather than special-case navigation.
- [ ] Include node edits in shared Undo and owner-session Save/Discard.

### 11. Design Lab — KEEP current direction

Design Lab already demonstrates the desired high-level safety pattern: explicit Edit, snapshot, Done, Cancel restores the snapshot. Do not rewrite this simply for consistency.

Possible later polish:

- [ ] Add Undo/Redo inside a long document-edit session if needed.
- [ ] Reuse common Save/Discard wording/styling if a shared editor shell emerges.

### 12. Walk Lab — LOWER priority specialist cleanup

Walk Lab is a specialist animation authoring tool and should remain separate. Its highest-value workflow improvements are not a full shell rewrite but history and clearer tool grouping.

Tasks:

- [ ] Add frame/joint Undo/Redo.
- [ ] Group viewport overlays separately from editing operations.
- [ ] Keep Clip selection (Walk/Run/Jump) as the primary context and selected joint/frame as the local selection.
- [ ] Consider Save/Discard only for larger rig/collider sessions if accidental global edits become a real problem.

---

## Shared authoring transaction / Undo architecture — revised direction

The earlier Undo assessment remains valid, but the editor audit clarifies the required abstraction.

Recommended service responsibilities:

- Central bounded Undo and Redo stacks for the active editor page.
- `beginTransaction(label, owner)` captures the minimum relevant persistent state.
- Live interaction modifies the working model.
- `commitTransaction()` records one before/after entry only if state changed.
- `cancelTransaction()` restores the before state for an aborted interaction.
- Pointer-down begins a drag transaction; pointer-up commits it.
- Button actions such as Delete/Duplicate/Add Exclusion use one immediate transaction.
- Sliders can either commit on pointer-up/change or collapse a continuous adjustment into one transaction.
- Each history entry knows what persistence/render refresh hooks must run after Undo/Redo.
- The service must not snapshot large WebGL/runtime collections; capture persistent authoring models or the smallest owned rows/records.
- Memory must remain bounded and measured on iPhone Safari.

Important distinction:

- **Undo/Redo** operates on individual authoring actions.
- **Save/Discard session** operates on the entire bounded Group/Puzzle/Asset editing session.

Unity's current Undo design is a useful reference because it groups actions around user interaction boundaries and records only changed object/property state; Unreal likewise uses named transactions representing a set of undoable changes. SideScroll does not need their implementation complexity, only the same transaction semantics.

### Shared Undo implementation tasks

- [x] Define the first common history entry shape and owner refresh hooks. *(World Group integration)*
- [x] Implement begin/commit/cancel transaction API.
- [ ] Implement bounded Undo + Redo stacks and memory accounting/debug information.
- [ ] Integrate pointer drag lifecycle once centrally rather than separately per tool.
- [x] First production integration: World Group Editor v2.
- [ ] Second integration: Puzzle Editor v2.
- [ ] Then migrate standalone Environment transforms, Terrain, World Lab and Asset Lab.

---

## Recommended editor architecture implementation order

### Phase A — foundation + unified drawer + World Groups

- [x] Add central editor context/session foundation with minimal disruption to existing runtime. *(World Group is first owner; broader generic routing remains.)*
- [ ] Build the reusable persistent Editor Drawer: expanded/collapsed rail states, route stack, fixed header/footer and safe touch scrolling.
- [x] Keep global `Menu` fixed and establish consistent Enter / Back / Save-Discard / Done Editing navigation semantics for the first migrated workflow.
- [x] Add shared transaction Undo/Redo core. *(World Group first consumer)*
- [x] Build World Group Editor v2 Contents/Exclusions/Group workspace inside the drawer.
- [x] Add Save/Discard and outside-context picking lock.
- [x] Remove old exclusion previous/next workflow and direct normal-panel group-internal mutation controls.

**Success test:** it should be difficult to damage a World Group accidentally, and it should always be obvious where editor navigation lives. Every internal change happens inside an obvious group-edit session, every child/zone is discoverable in a list, Undo or Discard can recover mistakes, and collapsing the drawer gives viewport room without leaving the active mode.

### Phase B — Puzzle Editor v2

- [ ] Reuse the proven Group shell/list/inspector/session machinery.
- [ ] Make puzzle exclusion/respawn/cart path sub-tools of Puzzle Edit.
- [ ] Clarify Puzzle Template vs Scene Instance vs Unique/Override semantics.
- [ ] Keep Test tightly integrated.

### Phase C — general Environment editor

- [ ] Introduce unified scene hierarchy/list grammar for groups, standalone objects and nodes.
- [ ] Introduce context-sensitive instance Inspector.
- [ ] Formalise Asset Default vs Instance Override behaviour.
- [ ] Move direct manipulation tools under the selected entity rather than a growing global button bar.

### Phase D — Terrain / World Settings / Debug

- [ ] Terrain becomes a specialist Edit context.
- [ ] Camera/Fog/Post become coherent World/Look settings.
- [ ] Debug/Performance/Streaming visualisation become one Diagnostics workspace.

### Phase E — cross-tool consistency

- [ ] Migrate World Lab history to shared transaction conventions.
- [ ] Add Asset Lab history/session safety.
- [ ] Add Walk Lab history where valuable.
- [ ] Keep Design Lab's existing snapshot/Cancel behaviour unless a concrete problem appears.


## Immediate editor polish

- [x] Stabilise World Group membership persistence through scene reconstruction. (`1.0.108`)
- [x] Lock World Groups by default and require explicit Edit Group mode for member editing. (`1.0.107`)
- [x] Restrict locked-group movement to the yellow group origin dot. (`1.0.109`)
- [x] Keep authored/manual assets spatially unique rather than wrapping around the world tile. (`1.0.113`)
- [x] Refresh Asset Lab behaviour/config changes when returning to Play. (`1.0.114`)
- [x] Add multiple procedural exclusion zones per World Group. (`1.0.115`)
- [x] Add per-section and global procedural reset controls. (`1.0.115`)
- [x] Add climb-entry interaction/action dots. (`1.0.115`)
- [x] Add direct Duplicate Group with new group/member IDs and copied layout/settings/exclusions. (`1.0.116`)
- [x] Replace projection-inversion depth dragging with stable relative screen-space depth deltas for authored assets and the locked-group move dot. (`1.0.116`)
- [ ] Continue checking selection/tap cycling in dense authored scenes; long-term make hierarchy/list selection authoritative so tap cycling is only a fallback.
- [ ] Keep legacy editor menus mutually exclusive while the new central editor-context/navigation model is introduced.
- [ ] Replace jumping/independent editor panels progressively with the unified persistent swipe-drawer shell; do not add new one-off panel positions meanwhile.

## World Groups

- [x] Basic World Group creation, membership, rename, dissolve and deletion.
- [x] Reusable Save Group / Place Template workflow.
- [x] Terrain-aware whole-group movement preserving each member's Ground / Free behaviour.
- [x] World Group exclusion zones suppress procedural biome dressing.
- [x] Multiple exclusion zones with add/select/edit/fit/delete controls.
- [x] Direct one-off Duplicate Group workflow independent of templates. (`1.0.116`)
- [ ] Review whether any additional per-member authored state should be captured by both Duplicate Group and Group Templates as new asset behaviours are added.
- [ ] Represent World Groups consistently as authored spatial blocks/extents across Play and World Lab.
- [ ] Further World Group / World Lab integration and polish as authoring usage exposes gaps.

## World Lab

- [x] Timeline view with sections, puzzles, World Groups and biome/profile transitions.
- [x] World Group timeline movement queues terrain-aware moves back to Play.
- [ ] Continue improving direct timeline placement and pacing workflow.
- [ ] Refine authored spatial-block display, selection and extent editing for World Groups / puzzles / standalone authored content.
- [ ] Add a global Streaming panel to World Lab rather than per-object load/unload markers.
- [ ] Keep direct “Play from here” and metre snapping coherent as streaming is introduced.

## Undo / editor history

- [ ] Assess and define Undo architecture before implementation; avoid bolting isolated undo buttons onto individual tools.
- [ ] Use transaction-style history so one pointer drag records one undo action, not every pointer-move frame.
- [ ] Cover meaningful authored actions: move asset, duplicate/delete asset, group membership changes, move/duplicate/delete group, exclusion edits, terrain/section edits and procedural reset where practical.
- [ ] Decide snapshot vs command/diff granularity for scene data, terrain data and puzzle-owned state, with memory limits suitable for iPhone Safari.
- [ ] Add redo only after Undo semantics are stable.

### Undo architecture assessment

See **Shared authoring transaction / Undo architecture — revised direction** above. The central requirement is unchanged: one bounded transaction service, one pointer drag = one history action, persistent authoring state rather than runtime/WebGL collections, and measured memory limits suitable for iPhone Safari.

## Streaming / performance

- [x] Remove the v1.0.117 Stage 1 performance regression: no live backdrop blur on the full-height Editor Drawer; exclusion normalisation moved out of the per-object draw hot path; World Group exclusion bounds reused per frame. (v1.0.119)
- [ ] Build a diagnostic Performance panel aimed at finding intermittent stutter rather than only displaying FPS.
- [ ] Show FPS and current/average frame time plus recent/worst frame spikes.
- [ ] Show active/rendered object totals broken down into procedural biome objects, authored loose objects, World Group members and puzzle objects.
- [ ] Add useful collision/update counts and JS update/render timing where instrumentation cost stays low.
- [ ] Report loaded image/texture/resource counts where available.
- [ ] Add a short rolling spike history or capture mode so a bad frame can be correlated with object/update counts.
- [ ] Profile the same-looking scene in smooth vs stuttering runs before changing rendering architecture.

### Global authored-content streaming policy

Do **not** add individual load/unload markers to every group, puzzle or object. World Lab should own a global policy, initially including:

- [ ] Preload distance ahead of the player/camera.
- [ ] Retention / unload distance behind.
- [ ] Potential platform-specific values later if iPhone/iPad/desktop need different budgets.
- [ ] Apply the active window to World Groups, puzzles and standalone/manual authored objects.
- [ ] Use each authored unit's spatial bounds to decide when it enters/leaves the active window.
- [ ] Treat a standalone authored object automatically as a one-object streaming unit; grouping must never be required purely for streaming.
- [ ] Restore unloaded authored content correctly when backtracking re-enters its active window.
- [ ] Keep biome procedural dressing under the existing biome / two-biome transition system rather than the authored-content streamer.

Conceptual ownership stays:

- **Biomes** = continuous procedural landscape.
- **World Groups** = authored environmental places.
- **Puzzles** = authored/stateful gameplay set-pieces.
- **Standalone objects** = authored exceptions.

## Asset / texture streaming

Later, separate from authored-object activation:

- [ ] Add a real asset/texture manager.
- [ ] Active group/puzzle/object requests the textures/assets it needs.
- [ ] Shared textures use reference counts.
- [ ] Leaving the active window releases references.
- [ ] When no active content references a texture, delete/release the WebGL texture.
- [ ] Keep the browser/service-worker cached source available for fast reload and offline use.
- [ ] Measure texture memory/re-upload cost before selecting unload thresholds.

## Puzzle / editor systems

- [x] Puzzle instances own their authored/stateful objects rather than leaking them into loose scene storage.
- [x] Puzzle exclusion, respawn and cart-path editing tools are integrated into Play.
- [x] Thought Nodes and Camera Nodes can be authored as placeable objects.
- [x] Asset Lab supports collision editing and reusable asset behaviour configuration.
- [ ] Proper Undo coverage for puzzle editing once the shared history architecture exists.
- [ ] Continue puzzle authoring workflow polish before reviving a larger standalone Puzzle Lab redesign.
- [ ] Continue validating stack/socket/support behaviours on complex puzzle set-pieces.

## Art / content pipeline

- [x] Maintain the documented art/texture processing workflow and Art Bible conventions.
- [x] Soft-alpha extraction / colour dilation workflow established for generated foliage/tree assets.
- [ ] Keep source-to-game texture audits documented whenever a new texture set is processed.
- [ ] Continue biome/location asset production with consistent three-tone cel shading, restrained saturation and grounded silhouettes.
- [ ] Package/atlas assets only when the library and runtime trade-offs justify it; preserve editable sources.

## Longer-term polish

- [ ] Continue camera-node and cutscene-camera authoring polish.
- [ ] Expand audio beyond background music only after profiling a robust low-stall SFX path on iPhone Safari.
- [ ] Continue movement/climbing/contact polish as new terrain and puzzle cases appear.
- [ ] Revisit character designer / character variant workflow after the core world-authoring pipeline is stable.
- [ ] Store packaging pass for Steam / iOS / Google Play after gameplay length, performance and content streaming are mature enough.

---

## Additional cross-cutting engine foundations — October 2026 final audit

**Status:** architectural considerations approved for the backlog/audit. These do not all need to be implemented before World Group Editor v2, but the high-priority boundaries should be defined while the shared editor foundation is being built so later systems do not create new incompatible state models.

The editor audit identified several concerns that sit *under* Groups, Puzzles, Terrain and the unified drawer. Mature engines generally centralise these concerns rather than letting each tool invent its own behaviour. SideScroll should adopt the principles without attempting to reproduce desktop-engine complexity.

### 1. Authored state vs runtime/test state vs editor-only state — HIGH priority

SideScroll should explicitly distinguish three kinds of state:

**Authored persistent state**

- World placement and transforms.
- World Group membership, exclusions and authored child settings.
- Puzzle definitions/instances and explicit authored start state.
- Terrain/section values.
- Thought/Camera Node authored settings.
- Asset instance overrides and other values intentionally saved into the project.

**Runtime/test state**

- Current player position/inventory.
- Puzzle progress after play begins.
- Collected/moved gameplay objects.
- Triggered Thought Nodes.
- Respawn/runtime checkpoint state.
- Cart/bridge/socket/log state produced by gameplay.
- Temporary streamed-in/out runtime objects.

**Editor-only state**

- Current selection.
- Active editor context/tool.
- Drawer route/collapse state and scroll positions.
- Viewport pan/zoom used only for authoring.
- Hover/highlight/debug visual state.
- Active edit-session checkpoint and Undo bookkeeping.

The current engine sometimes edits and plays the same object model directly. As Puzzle systems become more stateful this boundary becomes increasingly important.

Recommended rule:

- Entering a Test/Play-from-here session should establish a clean runtime state derived from authored data.
- Gameplay mutations must not silently become authored changes.
- Stopping Test should restore the authored state exactly unless the user invokes an explicit future `Keep Test Changes`/`Capture as Start State` action.
- `Set Start` is an authoring command and should copy an intentional subset of runtime/current state into the authored puzzle start state; it should not make arbitrary runtime state persistent.
- Undo history for authoring should not be polluted by ordinary gameplay events.

A full duplicate WebGL world is not required. A lightweight authored-state snapshot/runtime overlay may be sufficient, but the ownership boundary must be explicit.

### 2. Save/commit semantics, durable persistence and crash recovery — HIGH priority

The new editor introduces `Save`, `Discard`, Undo and transactional edit sessions, so SideScroll needs precise meanings for each layer of persistence.

Recommended separation:

- **Transaction commit** — one authoring action becomes part of Undo history.
- **Edit-session Save** — working changes become the committed authored scene state and the edit context closes/clears its session checkpoint.
- **Discard** — restore the edit-session checkpoint.
- **Durable project persistence** — serialize the committed authored state to browser storage/project data.

Do not let individual controls call persistent storage independently after the shared transaction system exists. Route durable saves through one project persistence service.

Phone/PWA resilience requirements:

- Persist committed authoring changes at safe transaction/session boundaries, not every pointer-move frame.
- On `visibilitychange`/app suspension, flush already committed state where practical because iOS may terminate the PWA without a normal unload sequence.
- During a dirty Group/Puzzle/etc. edit session, consider maintaining a **separate recovery draft** rather than overwriting the committed project. After an unexpected reload, offer `Recover unsaved edit` or discard the draft.
- Keep a small rolling set of last-known-good project snapshots before risky schema migrations or large destructive operations.
- Retain explicit JSON/project export as a human-controlled backup path.
- Assess IndexedDB later if project size/reliability outgrows the current storage approach; do not migrate storage merely for architectural neatness.

### 3. Stable entity identity, ownership and references — HIGH priority

Undo, lists/Outliner selection, streaming, duplication, templates and validation all depend on stable identity.

Every authored entity that can be independently selected/referenced should have a stable editor ID where practical, including:

- World Groups and members.
- Standalone authored objects.
- Group exclusions.
- Thought Nodes and Camera Nodes.
- Puzzle instances and persistent puzzle-owned children/zones/paths.
- Other future authored nodes that can be referenced by another system.

Ownership should be explicit rather than inferred only from which array currently contains an item. Conceptually an entity belongs to one of:

- World/root.
- World Group `<id>`.
- Puzzle `<id>`.
- Asset/template definition where relevant.

Rules:

- Duplication creates new entity IDs and remaps internal references to the new IDs.
- Detach changes ownership without changing identity unless there is a concrete reason to do so.
- Delete checks/removes dependent references transactionally and remains recoverable through Undo.
- Streaming may create/destroy runtime render objects, but authored identity remains stable while unloaded.
- Load/migration code validates IDs and repairs legacy records deliberately rather than UI accessors silently rebuilding identity-bearing arrays.

This does **not** require rewriting the whole project into one giant scene graph immediately. Introduce stable identity/ownership incrementally at the persistence-model boundary used by new editor work.

### 4. Reusable Inspector/property controls — MEDIUM/HIGH priority

Once Hierarchy/List -> Selection -> Inspector becomes the common workflow, avoid rebuilding every Details page from unrelated handcrafted DOM controls.

Create a small reusable set of phone-first property components/patterns for:

- Number + slider pairs with units and sensible ranges.
- Toggle.
- Enum/segmented selection.
- Text/name field.
- Read-only status/ID/type rows where useful.
- Reset/Revert-to-default/override indication.
- Dangerous actions separated from ordinary properties.

Properties should route mutations through the central transaction/session API rather than each UI control persisting data directly.

This is intentionally a lightweight SideScroll Inspector framework, not a reflection/component system. Its purpose is consistent behaviour, touch sizing, Undo integration and future Asset Default vs Instance Override visuals.

### 5. Central touch/input and viewport-manipulation policy — HIGH usability priority

The unified drawer solves only one part of mobile interaction. The viewport itself also needs one consistent gesture ownership policy so new tools do not reintroduce conflicting pointer logic.

Define centrally:

- Drawer drag vs drawer vertical scroll.
- Viewport camera pan.
- Pinch zoom where enabled.
- Tap/select vs drag threshold.
- Object/group relative transform dragging.
- Specialist handles such as collision points, exclusion corners, terrain controls and path nodes.
- Gameplay controls when testing/playing.

Rules:

- One active pointer owner after gesture intent has been resolved.
- Pointer capture should prevent gestures leaking into another tool/world object.
- Screen-space transform sensitivity should be predictable across authored asset/group tools.
- Handles/dots should remain a usable screen size as camera scale changes.
- Selected object highlighting should clearly show what will move/edit before the drag begins.
- Add `Frame/Focus Selected` where useful so list selection can reliably bring an off-screen item into view.
- Tap cycling remains a fallback for overlapping viewport objects; authoritative list selection is the reliable path.
- Multi-selection is a future option, not a requirement for the current architecture.

### 6. Project validation / Problems workflow — MEDIUM priority

As editor complexity increases, silent malformed data will become harder to diagnose than rendering bugs. Add a lightweight validation layer and eventually expose it under `Diagnostics > Problems`.

Potential checks:

- Duplicate/missing entity IDs.
- Orphaned group/puzzle ownership.
- Dangling Thought/Camera/Puzzle references.
- Missing asset definitions/textures.
- Non-finite/invalid transforms or exclusion extents.
- Invalid puzzle socket/host/path references.
- Broken authored streaming bounds.
- Legacy schema records that failed migration.
- Impossible collision/control data where deterministic checks are available.

A Problem row should identify the entity and, when possible, offer `Select`/`Go to` rather than only logging text.

Validation should run after project load/migration and may also run on demand. Keep it separate from the Performance profiler: `Problems` explains invalid authoring data; `Performance` explains runtime cost/stalls.

### 7. Template / instance semantics must be explicit — MEDIUM priority

Do not accidentally drift into half-linked prefab behaviour.

For each reusable system, explicitly decide whether placement creates:

- an **independent stamped copy**, or
- a **linked instance** with a source definition and instance overrides.

Current `Duplicate Group` is intentionally independent. If World Group Templates also remain simple stamped copies, label/document them that way and avoid showing Apply/Revert controls that imply a live link.

Puzzle templates may eventually benefit more from linked Template/Instance semantics. If linked instances are introduced, expose source/override state deliberately and support explicit Apply/Revert rather than silently propagating edits.

### 8. Schema/version migration and release compatibility — HIGH engineering priority

Editor architecture changes will add IDs, ownership metadata, session-safe puzzle data and potentially revised serialization shapes. Treat project data migration as a first-class release concern.

- Store a project/schema version separately from the app release version.
- Migrations should be explicit, deterministic and one-way per schema step.
- Take a recovery/backup snapshot before destructive migrations where practical.
- Never make ordinary read/accessor functions repeatedly mutate data merely to normalise it.
- Validate after migration.
- Regression-test old representative projects when changing group/puzzle/terrain serialization.
- Keep duplicate/template/export/import code using the same canonical serialization rules rather than parallel ad-hoc copies.

### What not to add yet

Do **not** expand this redesign into desktop-engine features SideScroll does not currently need. In particular, defer nested prefabs/groups, arbitrary docking layouts, a general component/entity framework, node-graph authoring, heavy multi-selection tooling, a command palette, and live collaborative editing. The goal is a coherent small engine, not a miniature Unreal Editor.

### Impact on implementation order

Phase A remains **shared editor foundation + unified drawer + World Group Editor v2**, but the following should be designed into that foundation from the start:

- explicit authored/editor state ownership;
- stable IDs/ownership for newly touched group entities;
- one central mutation/transaction path;
- one central durable persistence hook rather than tool-specific saves;
- shared touch/gesture ownership;
- schema migration hooks for new stored fields.

The full Test/runtime-state separation, Problems UI and richer recovery workflow can follow after Group Editor v2, but the new architecture should not make them harder to add.
