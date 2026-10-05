# SideScroll patch 1.0.118

Hotfix for the 1.0.117 startup regression.

## Fixed
- Corrected the World Group Editor Add Asset button binding. 1.0.117 declared `worldGroupAddAssetBtn` but attempted to bind `worldGroupEditorAddAssetBtn`, causing a runtime ReferenceError during game initialisation before the render loop/entry fade release.
- Bumped the SideScroll script query version in `play.html` to `1.0.118` so the corrected JS is fetched cleanly.

## Validation
- All 14 project JavaScript files pass `node --check`.
- TypeScript/JS checking reports no unresolved identifier / TS2552 errors in `sidescroll.js`.

Apply this patch over the existing project, including 1.0.117.
