# Image-generation prompt for game assets

Paste the text below into an image generator, attaching 3–6 reference images of existing
game art (e.g. trees, the cabin, ground plants, a stone wall from `assets/`). Full style
background: `CONCEPT_ART_BRIEF.md` and `ART_ASSET_PIPELINE.md`. New art comes into the game
through Asset Lab → **+ Add ▾ → Import image asset** (used exactly as imported).

```text
You are making art assets for SideScroll, a quiet, atmospheric 2.5D side-scrolling adventure game. Match the attached reference images exactly in style; where my words and the references disagree, follow the references.

THE WORLD
A girl, Aureli (small, red bob, cream tunic, brown sleeves and boots), follows a mysterious Darkness through one continuous journey: home forest, deep forest, a settlement (huts to town to keep), rocky mountain, snowy summit, a mine, caves, wetlands, underwater, barren wastes. Ancient terraforming machines have run for thousands of years and become overgrown parts of the landscape; locals think they are natural or sacred. Mood: beautiful, calm, slightly uncanny. Never cute or cartoon-bright, never overt horror.

STYLE
- Hand-painted stylised game art: clean readable shapes, soft painted texture inside forms, crisp silhouettes, thin darker contour where forms meet.
- Three tones per form (light, base, shadow), softly blended. Not photoreal. No sharpening noise or scratchy detail.
- Light from camera-right, high and soft. Highlights restrained (never chalky white), shadows never crushed black. Values mostly mid-range.
- Palette: warm mid-brown bark and wood with ochre highlights; natural yellow-green / olive foliage with lighter lime-yellow tops; warm grey stone with moss and ivy; warm orange-brown earth; distance fades to pale mist. Settlement: cream plaster, dark timber frames, terracotta or brown shingle roofs. Mountain: ochre-grey rock, straw-yellow dry grass.
- Avoid: neon or saturated cartoon greens, glowing fantasy colours, purple magic, heavy olive wash, generic fantasy crystals.
- Trees tall and slender with mostly straight trunks and airy foliage clumps with gaps. Rocks irregular with broad calm planes. Man-made things sturdy, hand-built, worn, mossy when old. Strong silhouettes that read at small size.
- Machines: precise ancient geometry (triangles, arches, hexagons) in stone, ceramic or dark metal, half-buried under roots, vines, rock or sediment, with restrained light veins. No screens, spaceships, shiny panels or steampunk.

VIEW AND FORMAT (for every game asset)
- Straight side-on view, no 3/4 perspective.
- Transparent background (real alpha) PNG. One object per image, centred, small margin. No text, labels, frame, checkerboard or backdrop.
- Holes in open structures (fences, arches, branches) are transparent.
- Objects that stand on the ground: the bottom edge is the floor line, with grass, ferns, moss or small stones breaking the base. No cast shadow, no floor plane.
- About 1000–1500 px on the long side (trees about 1100x1460). Ground textures: 1024x1024, seamless, flat even lighting.
- When making variants, keep scale, perspective, lighting and palette identical and change only what I ask.

SCALE (in-game heights): woodland trees 10–17 m; ground plants 0.5–1.3 m; bushes 1–2 m; moveable log 0.8 m; stone shape piece 1 m; fallen tree 2.5 m; stone wall 3.75 m; houses 3.6–5 m; fences 1.3–1.5 m; cart wheel 1 m; climb rocks about 3.5 m.

Reply to each request with the image only, unless I ask a question.
```
