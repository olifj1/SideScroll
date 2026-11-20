/* SideScroll — props held by characters (window.SideScrollProps).
 *
 * Any asset can be held. How a character holds one is its **hold** for that asset,
 * kept in the character's own setup (saved with Character Lab → Save, carried by
 * character packages, publishing and Project Backup like the rest of the setup):
 *
 *   setup.holds = { <asset name>: {
 *     hand   'near' | 'far'           which hand it follows
 *     x, y   the prop's centre from the wrist, along / across the hand bone
 *            (rig units, so it scales with the character)
 *     angle  degrees, turned from the hand bone (0 = the picture's top points
 *            across the hand, to its left)
 *     size   the prop's height in rig units (metres = size × 2.31 × the character's scale)
 *     flip   mirror the picture
 *     layer  'hand' (default: near hand → behind the near arm, far hand → behind
 *            the body) | 'front' | 'back' | 'part:<part id>'
 *   } }
 *
 * Who holds what is not a character setting: a sequence component's `holding`
 * (asset names, sequence-data.js) and the Prop event step decide it. Later the
 * player can pick up / use assets with the same holds (see TASKS → Props).
 *
 * Shared by Character Lab (anim-lab-props.js) and the game (sidescroll.js).
 */
(() => {
  'use strict';
  const HANDS = Object.freeze({
    near: Object.freeze({ label: 'Near hand', wrist: 'wristNear', hand: 'handNear' }),
    far: Object.freeze({ label: 'Far hand', wrist: 'wristFar', hand: 'handFar' })
  });
  // Families with somewhere to hold things (quadrupeds: later, e.g. the mouth).
  const FAMILIES = Object.freeze({ biped: Object.keys(HANDS) });
  const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const LAYER = /^(hand|front|back|part:[A-Za-z0-9_.:-]{1,80})$/;
  const BASE_SCALE = 2.31; // rig units → metres at scale 1 (as the game's BASE_CHARACTER_SCALE)
  const MAX_HOLDS = 60;
  // Built-in assets small enough to hold (Character Lab's list also has every
  // imported asset). The game can hold any asset by name.
  const BUILT_IN = Object.freeze([
    { name: 'broken-branch', label: 'Broken Branch', image: 'broken-branch.png', height: 0.78 },
    { name: 'axle-pin', label: 'Axle Pin', image: 'axle-pin.png', height: 0.72 },
    { name: 'stone-piece-a', label: 'Triangle Stone', image: 'stone-piece-a.png', height: 1.0 },
    { name: 'puzzle-log-b', label: 'Moveable Log B', image: 'puzzle-log-b.png', height: 0.72 }
  ]);

  const num = (v, lo, hi, fallback) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };
  const round = (v, step = 10000) => Math.round(v * step) / step;
  const validName = name => typeof name === 'string' && NAME.test(name);

  function normaliseHold(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    return {
      hand: HANDS[r.hand] ? r.hand : 'near',
      x: round(num(r.x, -1.5, 1.5, 0.03)),
      y: round(num(r.y, -1.5, 1.5, 0)),
      angle: round(num(r.angle, -360, 360, 0), 100),
      size: round(num(r.size, 0.02, 3, 0.3)),
      flip: !!r.flip,
      layer: typeof r.layer === 'string' && LAYER.test(r.layer) ? r.layer : 'hand'
    };
  }
  // A setup's holds (unknown names dropped); {} when none.
  function normaliseHolds(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [name, hold] of Object.entries(raw).slice(0, MAX_HOLDS)) if (validName(name)) out[name] = normaliseHold(hold);
    return out;
  }
  // A new hold for an asset `height` metres tall on a character of `scale`.
  function defaultHold(height, scale = 1, hand = 'near') {
    return normaliseHold({ hand, size: num(height, 0.05, 12, 0.8) / (BASE_SCALE * num(scale, 0.05, 20, 1)) });
  }
  // The character's hold for an asset; a default one when it has none (so a
  // prop is never invisible just because nobody set it up in Character Lab).
  function holdFor(setup, name, height = 0.8, scale = 1) {
    const saved = setup?.holds?.[name];
    return saved ? normaliseHold(saved) : defaultHold(height, scale);
  }
  // The draw-order layer for heldItemIndex ('auto' | 'front' | 'back' | 'part:…').
  const layerFor = hold => (hold.layer === 'hand' ? (hold.hand === 'far' ? 'back' : 'auto') : hold.layer);

  // Where the prop is in the character's own space (rig units, y up, facing
  // right) for a posed geometry: {x, y} = centre, angle (radians, the picture's
  // turn), size (height), flip. null when the geometry has no such hand.
  function place(geometry, hold) {
    const h = HANDS[hold.hand] || HANDS.near;
    const w = geometry?.[h.wrist], k = geometry?.[h.hand];
    if (!w || !k) return null;
    const a = Math.atan2(k.y - w.y, k.x - w.x), c = Math.cos(a), s = Math.sin(a);
    return { x: w.x + c * hold.x - s * hold.y, y: w.y + s * hold.x + c * hold.y,
      angle: a + hold.angle * Math.PI / 180, size: hold.size, flip: hold.flip, handAngle: a, wrist: { x: w.x, y: w.y } };
  }
  // Inverse of the offset part of place(): a point in character space → {x, y}
  // along / across the hand (for dragging the prop).
  function toHand(geometry, handId, point) {
    const h = HANDS[handId] || HANDS.near;
    const w = geometry?.[h.wrist], k = geometry?.[h.hand];
    if (!w || !k) return null;
    const a = Math.atan2(k.y - w.y, k.x - w.x), c = Math.cos(a), s = Math.sin(a);
    const dx = point.x - w.x, dy = point.y - w.y;
    return { x: c * dx + s * dy, y: -s * dx + c * dy };
  }

  window.SideScrollProps = Object.freeze({
    HANDS, FAMILIES, BUILT_IN, BASE_SCALE, validName, normaliseHold, normaliseHolds, defaultHold, holdFor, layerFor, place, toHand
  });
})();
