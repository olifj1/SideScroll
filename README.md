# SideScroll patch 1.0.141

**Changed-files-only patch over v1.0.140.** This is the first playable production pass for the shortlisted B2 / Ember Reed fox. It deliberately gets the approved fox source art into the real game with a separate quadruped rig before committing to a final art/animation polish pass.

## v1.0.141 — Fox playable character, dedicated quadruped rig

### New playable Fox

- `Fox` is added to the normal Play **Change character** cycle after Hero 1 and Hero 2.
- The selected Fox uses the existing character-variant persistence, so reloading while Fox is selected should restore it.
- Hero 1 and Hero 2 remain on the existing humanoid rig. Their atlas, saved Walk Lab clips and collider data are not migrated or replaced.
- The fox is intentionally much smaller than the existing characters. The first-pass target is roughly **half human visual height**, as requested; final scale should be judged on-device in the actual world.

### Dedicated fox rig

The approved side-on alpha source has been cut into a separate 13-plane quadruped puppet rather than being forced through the humanoid skeleton:

- torso;
- head / neck;
- tail base / mid / tip;
- near rear upper / lower leg;
- far rear upper / lower leg;
- near front upper / lower leg;
- far front upper / lower leg.

The atlas is built from the supplied source artwork itself. A rig guide and JSON joint/atlas map are included so pivots and cuts can be tuned later without rediscovering the anatomy.

### First-pass animation

- Fox Idle preserves the approved neutral silhouette.
- Walk and Run use independent quadruped leg phasing with restrained torso/head/tail secondary motion.
- Jump has its own compact launch/tuck/open/land cycle.
- Fox stride lengths are shorter than the humanoid animation strides, while actual world movement speed remains controlled by the existing gameplay system.
- Climbing currently uses the fox Run cycle as a temporary **scramble** visual. The climb path/mechanics are unchanged; a dedicated fox climb clip is deferred until the in-game proportions are proven.

### Collider and interactions

- Fox has its own smaller collider rather than inheriting the human capsule.
- Humanoid-specific carry/push arm posing is not applied to the fox.
- Generic prop interaction remains available as a first-pass test, but fox-specific rules for human-scale carrying/pushing are intentionally not considered final yet.
- Walk Lab remains the humanoid animation editor for now and filters out the fox rig family rather than attempting to open a quadruped in a human skeleton UI.

## New / changed files

- `sidescroll.js`
- `play.html`
- `walk-rig.js`
- `walk-lab.js`
- `fox-rig.js` — dedicated quadruped rig/animation/collider definition
- `home.js`
- `sw.js`
- `fox-character-source-v1.png` — cleaned approved alpha source
- `fox-rig-atlas-v1.png` — 13-part production cutout atlas
- `fox-rig-guide-v1.png` — source/joint authoring guide
- `fox-rig-map-v1.json` — source boxes, atlas locations and part anchors
- `SIDESCROLL_ENGINE_UX_BIBLE.md`
- `SIDESCROLL_TASKS.md`
- `README.md`

## Suggested iPhone checks

1. Install over **v1.0.140**, open Play and use Menu -> **Change character** until Fox appears. Cycle all the way through Hero 1 -> Hero 2 -> Fox -> Hero 1 once.
2. With Fox selected, walk slowly in both directions. Check that the neutral/slow gait stays connected at the shoulders, hips, knees/hocks and tail root and that flipping left/right remains clean.
3. Push the speed toward Run. Check foot rhythm, body bob and tail motion; note any joint where the source cut becomes obvious at normal gameplay scale.
4. Jump several times while stationary and moving. Check launch, airborne tuck/open and landing rather than only the single apex frame.
5. Compare the fox directly with Hero 1/2 beside the same scenery. The fox should read at around half their height; report if it feels too large or too small in-world.
6. Walk across slopes and edited terrain sections, onto walkable rocks and against walls. Watch for floating/sinking feet or a collider that feels too wide/tall.
7. Try one climbable surface. The fox currently uses a Run/scramble animation during climb; judge whether that is acceptable for the prototype or needs a true climb clip.
8. Reload the page while Fox is selected. Confirm Fox remains selected and renders immediately with the correct atlas/collider.
9. Optionally try a push/carry interaction, but treat visual prop handling as diagnostic only in this release; no final fox-specific interaction design has been chosen yet.

The next pass should be driven by these gameplay observations. In particular, do not redraw/refine the atlas until the scale, pivot placement and motion have been proven in the real scene.
