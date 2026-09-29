# SideScroll v1.0.75 — Terrain Elevation Spine

Base expected: v1.0.74 code state.

## Changed files
- play.html
- sidescroll.js
- style.css
- world-lab.html
- world-lab.js
- world-lab.css
- design-doc.json
- README.md

## What this patch adds
- A persistent Path-height point at every 10 m section centre.
- Linear interpolation between section-centre heights, so normal terrain can rise/fall continuously.
- In-game Section Editor controls for Path Height, numeric fine tuning, +/-0.25 m nudges, and Link Subsequent Sections.
- Link Subsequent ON shifts the selected point and all later authored terrain heights by the same delta; OFF changes the selected point locally and preserves the following terrain.
- Terrain-bound scene objects are re-grounded when terrain elevation changes; free-placement objects remain where they were authored.
- Terrain rendering is now split conceptually and visually into four depth layers: Path, Near Strip, Far Strip A and Far Strip B.
- Near currently follows Path directly. Far A and Far B are derived from progressively smoother/reduced versions of the Path profile so distant terrain can fall away during mountain climbs.
- World Lab now has a collapsible TERRAIN group. Collapsed shows the Path profile; expanded shows Near / Far A / Far B tracks too.
- Clicking a section in World Lab exposes its Path height and Link Later Sections setting.
- Camera vertical follow can now accommodate larger authored elevation changes instead of being capped at the old small scenic-rise range.
- Design Lab documents the first-pass terrain-elevation architecture.

## First-pass limits
- Path is the only independently authored height profile in v1.0.75.
- Near / Far A / Far B are derived profiles; per-layer height/visibility overrides come later if the mountain prototype proves they are useful.
- Existing section visibility still hides the whole terrain group for that section.

## Test focus
1. Open Edit/Test > Sections.
2. Select a section and raise Path Height by several metres with Link Subsequent ON. Later terrain should rise with it while keeping its relative shape.
3. Turn Link Subsequent OFF and fine-tune one section. Only the local profile should change.
4. Walk across the result and check the path interpolates smoothly between section centres.
5. Check terrain-bound dressing follows the raised terrain.
6. Open World Lab. TERRAIN should show the Path elevation profile; expand it to inspect Near / Far A / Far B.
7. Select a section in World Lab and edit its Path height; reload/enter the game and confirm the same terrain profile is used.

Do not clear local storage. Existing authored data is preserved and the terrain state format is backward-compatible.
