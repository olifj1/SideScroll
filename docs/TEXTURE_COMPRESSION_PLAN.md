# Texture memory and GPU-compressed textures — plan (13 Nov 2026, not started)

**Status:** parked on purpose; nothing is broken today. Recorded so it can be picked up
when we want faster loads, lower memory, and one approach for every platform (iPhone,
Android, desktop, the later app-store wraps).

## Why
- A PNG is compressed only on disk. To draw it, the GPU needs it unpacked: **4 bytes per
  pixel**, whatever the file size (Fallen Tree: 1.6 MB file → about 6 MB in memory).
- Measured 13 Nov: the game creates about **79 textures at start-up, about 290 MB
  unpacked**, including mountain and settlement art while the player is in the woodland.
- Asset Lab → Texture shows each asset's pixel size, size in the game, px per metre and
  memory, so oversized art is easy to spot meanwhile.

## The plan, in order
1. **Load only what is near (biggest win, no quality loss).** A texture manager with
   reference counts: a biome's / group's / puzzle's textures load when the player comes
   within the preload distance and are released (`gl.deleteTexture`) once passed by the
   unload distance, using the same distances as biome and puzzle streaming. Placed copies
   keep a texture *handle*; the image fills in when loaded. (Same item as *Streaming:
   texture manager* in TASKS → Later.)
2. **GPU-compressed textures for the game** (keep PNGs as the masters and the fallback):
   - Format: **KTX2 with Basis Universal** (UASTC for quality-critical art, ETC1S where
     size matters). One file per texture; the browser transcodes it at load to what the
     device's GPU reads: **ASTC** on iPhone/iPad and most Android, **BC7/BC3** on desktop,
     ETC2 as a fallback. About **1 byte per pixel** (ASTC 4×4) — a quarter of today — or
     less with larger blocks.
   - Mipmaps generated at encode time: sharper, less shimmering small/distant art (about
     +33 % memory, still far below today).
   - **Not DDS**: DDS holds BC/DXT formats, which iPhone GPUs do not support.
   - Runtime: the Basis transcoder (JS + WASM, a few hundred KB, cached once) and a loader
     beside `createImageTexture` that picks `<name>.ktx2` when the device supports it and
     the PNG otherwise. Only the game's WebGL renderer uses KTX2; the Labs (Canvas 2D:
     Asset Lab, World Lab, Character Lab overlays) keep using the PNGs.
3. **Build step with no desktop tooling:** the encoder (`basisu` or `toktx`) runs in a
   GitHub Action — the publish Action for published art, plus an Action on pushes that
   change `assets/*.png` for built-in art — writing `assets/<name>.ktx2` next to each PNG.
   Versioning follows `asset-paths.js` (`ASSET_VERSIONS`) / content hashes as PNGs do, so
   the service worker's cache-first-by-URL rule still holds.

## Before building: measure and compare
- Log real texture memory per biome at start-up and after streaming (step 1 changes the
  numbers a lot).
- Encode 3–4 representative assets (a tree, ground grass with soft alpha, a puzzle prop, a
  terrain surface) at UASTC and ETC1S; compare side by side on the iPhone, especially
  soft alpha edges (grass tips, foliage), which block compression can make blocky.
- Then decide per asset family; terrain surfaces and opaque art compress best.

## Costs / risks
- Some quality loss (block artefacts), mainly on soft transparent edges.
- A second file per texture in the repo and the cache (KTX2 files are usually smaller
  than the PNGs, so downloads also shrink).
- More moving parts: the transcoder, a fallback path, and the Action step.
