# SideScroll v1.0.90 — Biome Transition Foundation

Code-only patch. Apply over `SS-PATCH-1.0.89`.

## What changed

- Replaces the old finite Biome/Transition region model in World Lab with one continuous **Biome Blend** track.
- Woodland is the default biome and continues at 100% until a transition says otherwise; there are no undefined biome gaps.
- Adds authored Woodland → Mountain transition keys with a paired percentage graph. The two biome weights are coupled and always total 100%.
- Adds editable Bezier-style transfer controls, plus preload and unload padding.
- Hardens the runtime model to a maximum of **two logically active biome datasets**. Adjacent streaming windows hand off halfway between transitions so a third biome is never required simultaneously.
- Adds **Biome Profiles** for Woodland and Mountain. Each assigned asset has a target Density / 10 m and Max / 10 m value describing what 100% of that biome means.
- Adds **Global / Unbound** environment ownership. Global assets do not contribute to procedural biome density and remain available for manual placement everywhere. The mountain climb prototype and four climbable cliff assets default to Global.
- Environment placement palette now shows the currently loaded biome pack(s) plus Global / Unbound assets.
- Existing Woodland procedural scenery is tagged deterministically and thins as Woodland percentage/density falls.
- Mountain rock, scrub-tree and dry-grass dressing uses a deterministic candidate pool that appears as Mountain percentage rises.
- Mountain procedural candidate objects are created in the preload window and removed after the unload window; backtracking regenerates the same deterministic pool.
- Manual scene placements are not regenerated, hidden, or moved by biome percentages.
- Complete World Lab export/import now carries the biome system data.
- Runtime/edit HUD shows the current biome blend percentage.
- Woodland trees now use the existing individual `sidescroll-tree-01.png` … `sidescroll-tree-08.png` files instead of `sidescroll-tree-atlas.png`, making tree art iteration independent of atlas repacking.

## First-pass limits

- This pass implements Woodland and Mountain only; the data model is intended to extend to later locations without changing the two-biome rule.
- The existing Woodland layout remains the established deterministic forest candidate set. Lowering its profile density or transitioning away from Woodland thins that set; values above the established Woodland baseline do not yet create extra Woodland candidates.
- Mountain procedural objects are genuinely loaded/unloaded by the biome streaming window. Image textures are still created by the existing texture loader at page startup; texture-memory streaming can be added later if profiling shows it is needed.
- Old saved finite `biome-region` / `biome-transition` World Elements are preserved in stored/exported data for safety but are ignored by the new continuous biome track.

## Files

- `world-lab.html`
- `world-lab.css`
- `world-lab.js`
- `sidescroll.js`
- `play.html`
