# SideScroll patch 1.0.133

Changed-files-only patch over v1.0.132b. This is the bounded **Applied Puzzle Logic** slice; it does not build the wider reusable Environment Animation Path system yet.

## Applied Puzzle Logic

- The Puzzle `Logic` tab is now an authoritative applied-systems list. Puzzles show only Logic they actually use; `+ Add Logic` offers compatible systems that are not already attached.
- First formalised systems are `Cart Path`, `Socket Completion` and `Completion Reward`.
- Existing Stone Wall semantics migrate to explicit Socket Completion + Completion Reward. Existing authored Cart Path use migrates to an applied Cart Path record while retaining its current spline/timing data and behaviour.
- An explicit `logic[]` list is authoritative. Removing a system does not cause legacy metadata to silently add it back during ordinary rendering/reset.
- Physical socket placement remains a Contents/child property. Creating or moving a socket no longer silently enables socket-completion semantics.
- Completion Reward currently exposes its collectible choice through the existing inventory/collectable definitions.
- Cart Path remains the existing cart-specific authoring/runtime tool in this release. Its applied Logic record carries a target-object identity and activation metadata so later generalisation does not require more cart assumptions to be added to the registry.
- The older Fallen Tree `cross-x` completion rule remains supported as legacy runtime behaviour; it is intentionally outside this first Logic formalisation pass.
- Logic edits participate in the existing Puzzle session Save/Discard, recovery snapshots and Undo/Redo model.

## Future Animation Path note

The current Cart Path should later become a reusable Environment Animation Path system: author a path, assign an object, assign an activation trigger/condition, define playback/takeover behaviour, and define the end/settle state. v1.0.133 records that direction in `SIDESCROLL_TASKS.md` but deliberately does not expand scope into that system.

## Changed files

- `sidescroll.js`
- `play.html`
- `style.css`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Validation / device test

Static validation includes project-wide `node --check`, HTML duplicate-ID/control-target checks, CSS brace balance, and a changed-file diff against v1.0.132b. This build has **not** been tested on-device.

On iPhone, prioritise:

1. Stone Wall → Edit Puzzle → Logic: confirm Socket Completion + Completion Reward appear, select/edit cleanly, and the existing socket-completion/reward gameplay still works in Test Current.
2. Broken Bridge → Logic: confirm Cart Path appears, Edit Path/ghost preview still work, and repaired-cart takeover/landing behaves as before.
3. On a disposable/user puzzle, exercise `+ Add Logic`, Remove Logic, Undo/Redo, Save/Discard and Reset to Start. If testing linked-template controls, verify Revert and Apply as Template + Start deliberately affect the expected scope.
