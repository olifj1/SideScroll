# SS-PATCH-1.0.81

Base expected: SideScroll v1.0.80 / current GitHub mainline snapshot.

## Changed files
- `home.js`
- `index.html`
- `play.html`
- `sidescroll.js`
- `style.css`
- `world-lab.css`
- `world-lab.html`
- `world-lab.js`
- `README.md`

## What changed

### Terrain seam
- Near/Far ground bands now tuck 0.12 m underneath the path edge instead of terminating exactly on it.
- The near strip receives a tiny additional render-only lift to remove the remaining hairline gap without changing collision or authored terrain heights.

### Smoother path height changes
- Terrain sections now use 32 longitudinal subdivisions per 10 m section instead of 12.
- Section-centre heights use monotone cubic interpolation rather than straight linear joins. This keeps authored section heights exact, prevents overshoot, and gives the path and depth strips a smooth continuous slope.
- Gameplay terrain queries use the same smoothed profile as the rendered mesh, so feet/collision continue to match the visible path.

### Climbing animation pass
- Replaced the temporary sine-wave climb with world-space hold locking.
- Planted hands/feet counter the character's climb translation so they remain fixed on a hold until release.
- Diagonal limb pairs alternate, with broader reach, longer hold spacing, body compression/lean and a clearer weight transfer.
- The short climb-entry movement settles into the first pose before the locked cycle begins to avoid a visible pop.

### Depth-layer sliders
- Near Strip, Far Strip A and Far Strip B controls are sliders in both the in-game Sections panel and World Lab.
- Linked mode gives a fine offset slider; Explicit mode automatically switches to a wider absolute-height range.
- In-game sliders update the terrain live while dragging.

### Launch/cache versioning
- Code is cache-busted to v1.0.81 for the seamless PLAY path.
- Large image/audio assets retain their existing asset version so this code patch does not force a full art/audio re-download.

## Test focus
1. Check the near edge of the path at several camera positions: the thin gap should be gone without visible flicker.
2. Give adjacent sections noticeably different Path heights. The transition should now curve smoothly instead of forming obvious straight/kinked joins.
3. Climb the prototype rock in both directions. Watch hands and feet during the planted half of each step: they should hold their world position while the body moves past them, then reach to a new hold.
4. Open Sections > Depth Layers and drag Near/Far offsets. Confirm the terrain responds live and the displayed values track the slider.
5. Open World Lab, select a section, and confirm its three Depth Layer controls are sliders rather than number-entry fields.

No image or audio files are included in this patch.
