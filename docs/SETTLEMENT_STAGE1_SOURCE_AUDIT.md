# Settlement Stage 1 — Source Audit

Purpose: map the current runtime settlement assets to their intended original source files, identify the main failures, and decide whether each asset should be reprocessed or regenerated.

Batch under review: settlement buildings / roofs / fences / walls used in the first in-game settlement test.

---

## Audit legend

- **White alpha** = visible white fringe / poor transparency edges
- **Style drift** = processed asset looks brighter/flatter/different from approved source
- **Swap risk** = runtime file may not correspond to intended source
- **Crop/floor** = runtime crop or bottom alignment is wrong
- **Reprocess** = reuse original source and rebuild correctly
- **Regenerate** = make a new source asset, ideally with built-in alpha

---

| Runtime file | Intended source | Category | Source alpha | Current issues | Recommended action |
|---|---|---:|---:|---|---|
| `settlement-house-01.png` | `rustic_timber_cottage_wall_asset.png` | building facade | no | white alpha | reprocess from source, regenerate if edge quality still fails |
| `settlement-house-02.png` | `roofless_timber_frame_cottage_façade.png` | building facade | no | white alpha | reprocess from source, regenerate if edge quality still fails |
| `settlement-house-03.png` | `medieval_timber_frame_house_facade.png` | building facade | no | white alpha, swap risk | verify mapping, then reprocess |
| `settlement-house-04.png` | `medieval_timber_framed_guildhall_facade.png` | building facade | no | white alpha, swap risk | verify mapping, then reprocess |
| `settlement-house-05.png` | `rustic_medieval_timber_cottage_facade.png` | cottage | yes | runtime style/crop drift | rebuilt from original native-alpha source |
| `settlement-house-06.png` | `rustic_medieval_hut_game_asset.png` | ramshackle hut | yes | runtime style/crop drift | rebuilt from original native-alpha source |
| `settlement-roof-01.png` | `Settlement-Alpha-Processed/roof-01-terracotta-gable.png` | roof | yes | white alpha | reprocess from alpha source |
| `settlement-roof-02.png` | `Settlement-Alpha-Processed/roof-02-timber-double-chimney.png` | roof | yes | white alpha | reprocess from alpha source |
| `settlement-roof-03.png` | `Settlement-Alpha-Processed/roof-03-terracotta-low-chimney.png` | roof | yes | white alpha | reprocess from alpha source |
| `settlement-roof-04.png` | `Settlement-Alpha-Processed/roof-04-rustic-shingle.png` | roof | yes | white alpha | reprocess from alpha source |
| `settlement-fence-01.png` | `rustic_bolted_wooden_fence_prop.png` | fence | yes | style drift, possible crop/floor, possible small size | compare to source and reprocess |
| `settlement-fence-02.png` | `broken_rustic_medieval_fence_sprite.png` | fence | yes | style drift, possible crop/floor, possible small size | compare to source and reprocess |
| `settlement-fence-03.png` | `rustic_fantasy_fence_with_gate.png` | fence | yes | style drift, possible crop/floor, possible small size | compare to source and reprocess |
| `settlement-wall-01.png` | `mossy_stone_wall_game_asset.png` | wall | yes | style drift, possible crop/floor | compare to source and reprocess |
| `settlement-wall-02.png` | `medieval_timber_framed_stone_wall.png` | wall | yes | style drift, possible crop/floor | compare to source and reprocess |
| `settlement-wall-03.png` | `mossy_medieval_stone_wall_corner.png` | wall | yes | style drift, possible crop/floor | compare to source and reprocess |

---

## High-priority shortlist

### White-alpha shortlist
These are the first assets to inspect and rebuild:
- `settlement-house-01.png`
- `settlement-house-02.png`
- `settlement-house-03.png`
- `settlement-house-04.png`
- `settlement-roof-01.png`
- `settlement-roof-02.png`
- `settlement-roof-03.png`
- `settlement-roof-04.png`

### Style-drift shortlist
These should be compared source-vs-runtime and rebuilt from the source without unwanted restyling:
- `settlement-house-05.png`
- `settlement-house-06.png`
- `settlement-fence-01.png`
- `settlement-fence-02.png`
- `settlement-fence-03.png`
- `settlement-wall-01.png`
- `settlement-wall-02.png`
- `settlement-wall-03.png`

---

## Stage 1 outcome

Confirmed outcomes so far:
- the current runtime batch is not reliable enough to keep as-is
- the underlying source art is often better than the runtime export
- the biggest current failures are white fringe, style drift, and inconsistent crop/floor alignment
- the next task is to run a clean reprocess pass starting from the correct source files

---

## Next stage

Proceed to:
- Stage 2 — alpha assessment on the white-alpha shortlist
- Stage 3 — source-vs-runtime comparison on style-drift shortlist


---

## Stage 2 completed outcome

- Houses 01–04 were regenerated from the approved frontage direction with native transparency, then processed with colour-safe dilation and zero bottom floor gap.
- Roofs 01–04 were rebuilt from the earlier clean-alpha roof sources rather than the contaminated runtime exports.
- Houses 05–06, fences 01–03 and walls 01–03 were rebuilt directly from their original native-alpha sources.
- No resizing was applied during cleanup; source resolution was retained.
- Ground-contact assets were cropped to zero transparent pixels below their visible floor contact.
- Automated fringe audit reports zero very-light/white semi-transparent edge pixels across the corrected core set.
