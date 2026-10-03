# Settlement Texture Processing Workflow

Purpose: a repeatable workflow for taking generated settlement art and turning it into clean, game-ready SideScroll assets without colour drift, white fringes, incorrect floor alignment, or source mix-ups.

This document should be used every time new settlement textures are created or existing ones are reprocessed.

---

## Core principles

1. **Always preserve the approved source first.**
   - Keep the raw generated image as the banked source.
   - Never overwrite the approved source with a processed version.

2. **Do not trust a processed export without comparison.**
   - Every processed asset must be checked against the original source before it goes into a build.

3. **Prefer native transparency where possible.**
   - If an asset can be generated with a clean alpha channel, prefer that over extracting alpha later from a white background.

4. **Do not apply destructive colour changes during processing.**
   - Processing should not brighten, flatten, wash out, or otherwise restyle the asset.
   - If the processed asset looks different in colour/contrast from the source, stop and inspect.

5. **Treat floor contact as a technical requirement.**
   - Assets should sit on the floor correctly and consistently.
   - Cropping and anchoring are part of the asset-prep pass, not optional cleanup.

---

## Full workflow

## Stage 0 — Bank and name the source assets

For each approved source asset:
- save the original file into the source bank
- give it a clear descriptive filename
- do not crop, resize, brighten, or repaint at this stage

Record:
- asset category
- intended gameplay use
- whether the source already contains transparency
- any known concerns (perspective, scale, style, background)

---

## Stage 1 — Source audit and mapping

Before any processing:

For every runtime target asset, create a one-to-one mapping table:
- runtime filename
- intended source filename
- category
- source has alpha? yes/no
- approved for use? yes/no
- current issues
- next action

Checks:
- confirm there are no source swaps or naming mistakes
- confirm runtime assets point to the correct original source
- confirm no duplicate asset has been assigned to the wrong slot

Output:
- a source audit file for the current batch

---

## Stage 2 — Alpha assessment

Classify each source asset into one of these buckets:

### A. Native alpha source
- source already has clean transparency
- preferred case
- do not flatten it accidentally

### B. Non-alpha source but clean separable background
- alpha can be extracted
- requires edge inspection
- higher risk of fringing

### C. Poor source for extraction
- background contamination
- weak edge separation
- too much white halo or soft contamination
- candidate for regeneration with built-in alpha

Checks:
- inspect semi-transparent edge pixels
- check whether fringe colour is white/grey instead of local asset colour
- verify holes, gaps and open areas are truly transparent

If alpha quality is poor, do **not** continue to final export.

---

## Stage 3 — Regenerate if needed

Regenerate an asset when any of the following are true:
- alpha extraction is producing unacceptable fringe
- the source is too low resolution for clean in-game use
- the cropable silhouette is unclear or contaminated
- perspective/style does not match the approved set

When regenerating:
- request transparent background directly where possible
- preserve approved silhouette, form and perspective
- explicitly preserve the approved colour/contrast range

---

## Stage 4 — Non-destructive cleanup

For assets that pass source and alpha checks:
- isolate the visible asset
- remove background cleanly
- preserve colour and contrast from the original
- do not brighten or repaint during cleanup

Checks:
- compare processed image next to source
- verify no obvious style drift
- verify no loss of fine silhouette detail

---

## Stage 5 — Crop and floor-line alignment

Crop each asset tightly but sensibly.

Rules:
- remove unnecessary empty space
- preserve enough breathing room for overhanging forms where needed
- bottom edge should sit correctly on the implied floor line
- avoid floating assets caused by extra bottom padding
- avoid clipping grass tufts, posts, roof edges or chimneys

Checks:
- bottom contact should be visually consistent across the category
- side padding should not be wildly different between similar assets
- roof pieces and facades should align sensibly for assembly

---

## Stage 6 — Dilation / edge padding

After alpha is correct and cropping is correct:
- apply colour-safe edge dilation into transparent pixels
- dilation colour must come from the nearby opaque asset colours
- do **not** dilate white or background colours into the edge

Purpose:
- reduce fringe during filtering/scaling in-game
- keep edges clean against varied backgrounds

Checks:
- inspect semi-transparent boundary pixels
- ensure no white halo remains
- ensure dilation has not expanded the visible silhouette incorrectly

---

## Stage 7 — Resolution and scale normalisation

For each asset category:
- keep relative texel density consistent
- ensure similar assets are not accidentally exported too small
- preserve intended gameplay scale

Checks:
- compare assets within category side-by-side
- compare against character height where relevant
- look for sudden drops in detail or texture resolution

---

## Stage 8 — Runtime export

Only export runtime-ready assets after passing all earlier stages.

For each export, verify:
- correct filename
- correct source mapping
- correct transparency
- correct crop
- correct floor line
- correct scale
- correct category placement

---

## Stage 9 — In-game validation

After import to build, inspect assets in scene for:
- colour/contrast match
- white fringe
- floor contact / floating
- apparent scale
- resolution sharpness
- perspective fit
- assembly fit with related pieces

If issues appear in game:
- trace back to the stage where the issue entered
- correct at that stage rather than patching blindly downstream

---

## Stage 10 — Batch sign-off checklist

Before a batch is considered ready, confirm all items below:

- [ ] Every runtime asset is mapped to the correct source.
- [ ] Original source files are banked and unchanged.
- [ ] Alpha is clean.
- [ ] No white fringe remains.
- [ ] No unintended colour or contrast drift.
- [ ] Cropping is correct.
- [ ] Floor contact is correct.
- [ ] Resolution/scale is consistent.
- [ ] In-game test has been performed.
- [ ] Any assets that still fail are marked for regeneration.

---

## Fast triage rules

### Reprocess
Use reprocessing when:
- source art is good
- runtime export is wrong
- issue is fringe, crop, floor alignment, or accidental brightening

### Regenerate
Use regeneration when:
- source art is fundamentally weak
- transparency cannot be cleaned properly
- resolution is not strong enough
- perspective or style is off from the approved set

---

## Recommended files per batch

For each new settlement batch, create:
- `*_SOURCE_AUDIT.md`
- `*_PROCESS_NOTES.md` (optional)
- `*_REGEN_LIST.md` (if needed)
- preview sheet showing source vs processed if the batch is large

---

## Current settlement correction priority

1. Source audit and mapping
2. White-alpha triage on front-facing buildings and roofs
3. Reprocess style-drift assets from the original source
4. Regenerate only the assets that still fail after correct reprocessing
5. Re-export and test in-game


## Native-alpha correction rule

For production assets with white-matte contamination, regenerate the approved image with native transparency rather than trying to derive the final alpha from the white background. When a clean native-alpha source already exists, return to that source and reprocess it; do not flatten and re-extract it.
