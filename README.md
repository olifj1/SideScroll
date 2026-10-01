# SideScroll Patch v1.0.93

Changed-files-only patch over **v1.0.92**.

## Fix
- Forces the newly repainted `mountain-climb-rock-01.png` to replace the cached original in the installed/PWA game.
- Updates the runtime texture request from the old `?v=1.0.67` URL to `?v=1.0.93`.
- Rotates the PWA runtime cache and preload version so iOS/Safari cannot continue serving the old rock from the previous cache.
- Adds the climb-rock texture to the splash preload set.

No gameplay, collision, Asset Lab setup, scale, climb paths, or biome ownership have changed.
