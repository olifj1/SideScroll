# SideScroll patch 1.0.119

Performance correction for the Stage 1 editor architecture introduced in 1.0.117/1.0.118.

## Changes

- Removed live `backdrop-filter` blur from the large persistent Editor Drawer and Puzzle Test drawer. The old compact panel blur became expensive once the drawer expanded to a large portion of the live WebGL viewport on iPhone Safari.
- Moved World Group exclusion normalisation / stable-ID repair out of the per-object render hot path. Exclusions are now normalised once per group object.
- Added a per-frame flattened World Group exclusion-bounds cache. Procedural dressing now tests against that list instead of rebuilding/scanning every group's exclusions for every rendered dressing object.
- Simplified exclusion bounds-list generation so it reads the normalised zone array once.
- Updated `SIDESCROLL_TASKS.md` with the Stage 1 performance rules discovered by the on-device test.
- Cache-busted `style.css` and `sidescroll.js` to `1.0.119`.

## Validation

- All 14 JavaScript files pass `node --check`.
- `play.html` contains no duplicate IDs.
- No Stage 1 Group Editor workflow behaviour was intentionally changed by this patch.

Apply over the existing project including 1.0.118.
