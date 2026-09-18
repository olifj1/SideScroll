# SideScroll v0.2.44

- Baked the supplied complete game-design export into the main build.
- Fresh installs use the exported environment edits, puzzle placements/setups, asset behaviour settings, collectable settings, and camera tuning as their defaults.
- Existing editor localStorage still takes priority so an upgrade does not overwrite newer work on that device.
- The compact baked authoring data lives in `baked-game-design.js`; deterministic procedural scenery is regenerated and the authored edits are applied over it.
