# SideScroll v1.0.91 — Asset Lab → Biome Scale Sync

Code-only patch. Apply over `SS-PATCH-1.0.90`.

## What changed

- Asset Lab `Default Height` is now the source of truth for procedural Mountain asset size.
- Mountain rocks, scrub trees and dry grasses keep their deterministic procedural size variation, but that variation is centred/scaled from the height authored in Asset Lab rather than a separate hard-coded biome value.
- The same authored-height rule is wired into existing procedural Woodland trees and ground dressing without changing their established sizes unless an explicit Asset Lab height has been saved.
- Returning to Play from Asset Lab through iOS back/forward cache refreshes the authored layout data and rebuilds an active Mountain candidate set automatically.
- No Apply button or biome-profile resave is required after changing an asset height.

## Files

- `sidescroll.js`
- `play.html`
- `README.md`
