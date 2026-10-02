# SideScroll Patch v1.0.99

Changed-files-only patch over **v1.0.98**.

## Design Lab — GDD v1.0 restructure
- Reorders the Design Lab into a reader-first sequence:
  1. player-facing story;
  2. underlying universe / hidden canon;
  3. working location stages;
  4. characters;
  5. gameplay, movement and puzzles;
  6. artefact reactions / possible player progression;
  7. experience, art and presentation;
  8. world structure / biome systems;
  9. tools, engine and production;
  10. open questions / next decisions.
- Replaces the older five-chapter sketch with the current working route: Home Forest → Deep Forest/Fox/first artefact → Settlement → Rocky Mountain → Snow/Summit → Mine descent → Caves → Wetlands → Underwater → Barren approach → Control finale.
- Adds proposed swimming/diving, swinging/hanging and breath/endurance mechanics.
- Records the current artefact-progression principle: artefacts can matter without every one granting a broad permanent power.
- Documents the current continuous two-biome profile/transition architecture, deterministic density blending, preload/unload rule and Global/Unbound environment assets.
- Updates World Lab, Mountain, climbing and Camera Node implementation notes to reflect the current build.
- Updates workflow baseline references to v1.0.99.

## Local Design Lab data
The restructured GDD uses a new local working-document key (`v2`) so the new bundled reading order appears immediately. Any previous local Design Lab document stored under the old `v1` key is **left untouched** rather than overwritten.

## Files
- `design-doc.json`
- `design-lab.js`
- `design-lab.html`
- `README.md`
