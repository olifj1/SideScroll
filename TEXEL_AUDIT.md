# Texel Audit – SideScroll woodland dressing

This audit is based on the original approved v0.2.45 atlas (restored in v0.2.51). The aim is to compare source-pixel density against the world heights used by the procedural dressing system, so we can make the next art pass more consistent.

## Key takeaways

- The original atlas remains the visual baseline for style.
- Tall trees are relatively soft for how large they are displayed in the main far-side forest band.
- Ground dressing is much denser per world unit than the trees, especially in the near strips, so it can read sharper / busier than the larger trees.
- New mid-size trees should target the original atlas style, but their pixel height should be chosen against an explicit world-height range rather than guessed by eye.

## Asset source sizes

| Asset | Pixels (w×h) | Aspect |
|---|---:|---:|
| tree01 | 237×955 | 0.248 |
| tree02 | 382×990 | 0.386 |
| tree03 | 230×899 | 0.256 |
| tree04 | 248×929 | 0.267 |
| tree05 | 240×837 | 0.287 |
| tree06 | 293×1018 | 0.288 |
| ground01 | 351×297 | 1.182 |
| ground02 | 360×308 | 1.169 |
| ground03 | 394×204 | 1.931 |
| ground04 | 276×281 | 0.982 |
| ground05 | 389×273 | 1.425 |
| ground06 | 304×294 | 1.034 |
| ground07 | 267×275 | 0.971 |
| ground08 | 394×207 | 1.903 |
| ground09 | 353×267 | 1.322 |
| ground10 | 309×171 | 1.807 |
| ground11 | 343×276 | 1.243 |
| ground12 | 398×228 | 1.746 |

## Procedural world-height bands currently used

| Band | Height range (world units) | Mean | Typical assets |
|---|---:|---:|---|
| Far trees – main wall | 9.80–16.90 | 13.35 | tree01–06 |
| Far trees – tall accents | 14.00–21.50 | 17.75 | tree01–06 |
| Near trees – occasional accents | 5.20–10.00 | 7.60 | tree01–06 |
| Far edge undergrowth | 0.72–2.12 | 1.42 | ground / scrub |
| Far mid undergrowth | 0.72–2.22 | 1.47 | ground / rocks / bushes |
| Near edge strip | 0.48–1.06 | 0.77 | ground / scrub |
| Near mid strip | 0.55–1.27 | 0.91 | ground / scrub / rocks |
| Near close strip | 0.48–1.26 | 0.87 | ground / scrub / rocks |
| Near large ground accents | 1.05–2.20 | 1.62 | ground / bushes / rocks |

## Approximate source pixel density by asset class

- Average tree source height: **938.0px**
- Average ground source height: **256.8px**

| Class / band | Approx px per world unit | Comment |
|---|---:|---|
| Tall trees - main far band | 70.3 px/unit | Soft / moderate |
| Tall trees - deep far accents | 52.8 px/unit | Soft / moderate |
| Tall trees - occasional near accents | 123.4 px/unit | Sharper |
| Ground dressing - far edge band | 180.8 px/unit | Moderate |
| Ground dressing - far mid band | 174.7 px/unit | Moderate |
| Ground dressing - near edge band | 333.4 px/unit | Quite dense |
| Ground dressing - near mid band | 282.1 px/unit | Quite dense |
| Ground dressing - near close band | 295.1 px/unit | Quite dense |
| Ground dressing - occasional near large accents | 158.0 px/unit | Moderate |

## Why the mismatch is noticeable

- The trees average roughly **53–123 px/unit** depending on where they are placed.
- The ground dressing often lands around **150–340 px/unit**.
- So low ground assets can look crisper and more detailed than the taller trees, even though the trees dominate the scene.

## Practical targets for the next pass

| Asset class | Suggested displayed world height | Suggested source height target | Notes |
|---|---:|---:|---|
| Tall trees | ~10–18 units | keep roughly 900–1100px | Original trees are in the right ballpark stylistically; only minor density tuning if needed. |
| Mid trees / large shrubs | ~2.5–4.0 units | ~220–380px | Generate these in the old style. Keep a few clean variants rather than many noisy ones. |
| Low dressing clumps | ~0.5–1.3 units | ~140–240px | Existing ground assets are a little dense in some placements, so placement/scale matters. |
| Fixed puzzle obstacles | depends on object | match environment class | Use bottom feathering and grounded bases. |
| Moveable puzzle props | depends on object | moderate / clean | No baked ground feathering. Keep silhouettes cleaner. |

## Recommended next implementation steps

1. Keep this restored original atlas as the environment baseline.
2. Generate only a small set of new mid-size trees / large shrubs using the original atlas as the style master.
3. Import those as separate PNGs first (safer than disturbing the atlas).
4. Place them tentatively and sparsely so the fog windows remain visible.
5. Once the environment style is approved, apply the same style rules to fixed puzzle texture packs, keeping moveable props cleaner.

## v0.2.52 action

The six original tall-tree PNGs are now packed at full native resolution into a dedicated 2048×2048 `sidescroll-tree-atlas.png`. The original mixed dressing atlas is still used for the twelve ground assets. This removes the previous ~25% tree downsampling inside the mixed atlas without increasing the tree source files themselves. The unused lower half of the new tree atlas is intentionally reserved for approved mid-height trees later.
