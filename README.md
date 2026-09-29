# SideScroll v1.0.70 — Asset Lab direct-edit patch

Base expected: v1.0.69 (v1.0.68 Puzzle Lab + Mountain Climb, then compact/scrollable menu patch).

Changed files:
- asset-lab.html
- asset-lab.js
- puzzle-lab.html
- puzzle-lab.js
- README.md

What changed:
- Asset Lab now accepts `?asset=<asset-name>` and automatically opens the correct library filter with that asset selected.
- Puzzle Lab now has **Edit Asset** for the selected puzzle's primary reusable asset.
- Mountain Climb Prototype therefore opens directly to **Environment → Mountain → Mountain Climb Rock 01**.
- Asset Lab script/cache version bumped to v1.0.70 to avoid a stale pre-climb Asset Lab in the installed PWA.

Test focus:
1. Open Puzzle Lab and select Mountain Climb Prototype.
2. Tap **Edit Asset**.
3. Asset Lab should open on Environment with Mountain Climb Rock 01 selected.
4. Confirm its collision and Climbable behaviour are editable.
5. Confirm Puzzle/Environment filter buttons still work normally.

No local authored data is cleared or migrated by this patch.
