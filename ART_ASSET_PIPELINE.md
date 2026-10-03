# SideScroll — Art Asset Pipeline Checklist

Read this before starting every new texture/image asset batch.

## A. Plan
- Define the exact asset list and why each asset exists.
- Decide: biome/procedural, Global/Unbound manual art, puzzle-owned, or group/world-object owned.
- Define intended scale, perspective, modular-fit requirements and any collision/climb/socket needs.
- Generate small subsets rather than uncontrolled asset sheets.

## B. ImageGen request
- Reference approved existing art when matching a family.
- Carry forward the current Art Bible: rendering language, light direction, values/contrast, saturation, silhouette/detail rules.
- Ask for the correct side/front perspective.
- Ask for sufficient resolution.
- For cutout art request **native transparent background/alpha**.
- For open structures require intended holes/open spaces to be transparent.
- When revising approved art, explicitly preserve silhouette, proportions, perspective and colour/contrast unless those are the requested change.

## C. Bank source
- Save approved raw ImageGen output unchanged.
- Record source filename -> runtime filename mapping.
- Record category, native-alpha status, intended height/use and special behaviour.

## D. Alpha decision
- Clean native alpha: reprocess non-destructively.
- White/matte contaminated edge: regenerate through ImageGen with native alpha.
- Do not make white-background extraction the production solution when it causes fringe.

## E. Process
- No accidental brightness/contrast/saturation restyle.
- Normalize meaningless ghost alpha only if needed.
- Dilate RGB beneath alpha from nearby **real asset colour**, never white/background.
- Tight crop.
- Ground-contact asset: visible floor contact at texture bottom unless an intentional groundLine offset is authored.
- Preserve source resolution unless there is a deliberate texel-density reason not to.
- Compare processed result to the original on light and dark backgrounds.

## F. Runtime integration
- Use stable semantic filename/name.
- Record actual final crop pixel dimensions and aspect ratio.
- Add to Environment asset library with correct group/category/defaultHeight.
- Add to Asset Lab with same stable name/image, useful group, height and groundLine.
- Set ownership deliberately: biome / Global-Unbound / puzzle / group.
- Author collision/support/climb/socket behaviour where required.

## G. Cache/version deployment
When replacing image contents under an existing filename:
- change the image version query in runtime (`?v=...`);
- change editor thumbnail query;
- update Asset Lab VERSION/query;
- update final dimension/aspect tables after crop changes.

Large art is cache-first in the service worker; a new exact URL is required to reliably replace it on Safari/A2HS.

## H. In-game validation
Place it in the real scene and check:
- colour/contrast fit;
- no white/dark fringe;
- no floating;
- default scale;
- sharpness/resolution;
- perspective;
- layering/modular fit;
- editor category/selection;
- collision/interactions if applicable.

## I. Sign-off
Mark each asset: approved / reprocess / regenerate / superseded.
Never repair a bad downstream intermediate repeatedly: return to the last known-good source/stage.
