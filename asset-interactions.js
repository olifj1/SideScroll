/* SideScroll · asset interactions (what the player can do to an asset)
 * Per asset name, in sidescroll.asset-interactions.v1 (content, Assets area):
 *   { [asset name]: { inspect: { title, text, large, flag }, collect: { label, description, flag },
 *                     wear: { holdsInventory, refuse, flag } } }
 * Inspect: Action near any placed copy (or sequence object) of the asset shows
 * the title and text; `large` shows the asset's picture big on screen (a note to
 * read). Collect: it can be picked up (Pick up in the Inspect view, or straight
 * away when it has no Inspect) into the inventory as an item named `label`.
 * Wear: picking it up puts it on the player instead (a character part marked with
 * this asset in Character Lab → Skin → Worn item shows while it is worn); never in
 * the inventory. `holdsInventory`: while any such asset exists, nothing can be
 * collected until one is worn (`refuse` is what she says).
 * `flag`: a story flag set when it is inspected / picked up (sequence lines can
 * react). Later actions (use…) are further keys beside these.
 * Hold (26 Nov): `hold: { flag }` — she picks it up into her hand (Pick up in the Inspect view, or
 * straight away) and carries it, drawn with her grip from Character Lab → Props; Action puts it down
 * on the floor in front of her. One thing at a time (no box while holding); not the inventory.
 * Light (26 Nov, not an action — what the asset *is*): `light: { color [r,g,b] 0–1, strength 0–3,
 * radius m, flicker 0–1, flickerSpeed, u, v }` makes every copy glow like a placed Light node, from
 * the point (u across, v up, 0–1) on its picture: placed copies, sequence objects, dropped props and
 * props held in a hand.
 * Asset Lab edits it (Interactions section); the game reads it.
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.asset-interactions.v1';
  const ACTIONS = Object.freeze({ inspect: 'Inspect', collect: 'Collect', wear: 'Wear', hold: 'Hold' });
  // Story flags as sequence-data.js names them.
  const flagName = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/;
  const text = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').slice(0, max) : '');

  function cleanInspect(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = { title: text(raw.title, 80).trim(), text: text(raw.text, 2000), large: !!raw.large };
    const flag = flagName(raw.flag); if (flag) out.flag = flag;
    return out;
  }
  function cleanCollect(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = { label: text(raw.label, 60).trim(), description: text(raw.description, 400) };
    const flag = flagName(raw.flag); if (flag) out.flag = flag;
    return out;
  }
  function cleanWear(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = { holdsInventory: !!raw.holdsInventory, refuse: text(raw.refuse, 120).trim() };
    const flag = flagName(raw.flag); if (flag) out.flag = flag;
    return out;
  }
  function cleanHold(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    const flag = flagName(raw.flag); if (flag) out.flag = flag;
    return out;
  }
  const LIGHT_DEFAULT = Object.freeze({ color: [1, 0.78, 0.45], strength: 1.2, radius: 4, flicker: 0.15, flickerSpeed: 3, u: 0.5, v: 0.5 });
  function cleanLight(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const n = (x, lo, hi, f) => { const k = Number(x); return Number.isFinite(k) ? Math.min(hi, Math.max(lo, k)) : f; };
    const d = LIGHT_DEFAULT;
    const color = Array.isArray(raw.color) && raw.color.length >= 3 ? raw.color.slice(0, 3).map((c, i) => n(c, 0, 1, d.color[i])) : [...d.color];
    return { color, strength: n(raw.strength, 0, 3, d.strength), radius: n(raw.radius, 0.5, 20, d.radius),
      flicker: n(raw.flicker, 0, 1, d.flicker), flickerSpeed: n(raw.flickerSpeed, 0.2, 8, d.flickerSpeed),
      u: n(raw.u, 0, 1, d.u), v: n(raw.v, 0, 1, d.v) };
  }
  function cleanEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    const inspect = cleanInspect(raw.inspect);
    if (inspect) out.inspect = inspect;
    const collect = cleanCollect(raw.collect);
    if (collect) out.collect = collect;
    const wear = cleanWear(raw.wear);
    if (wear) out.wear = wear;
    const hold = cleanHold(raw.hold);
    if (hold) out.hold = hold;
    const light = cleanLight(raw.light);
    if (light) out.light = light;
    return Object.keys(out).length ? out : null;
  }
  function load() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { raw = {}; }
    const out = {};
    for (const [name, entry] of Object.entries(raw)) {
      if (!NAME.test(name)) continue;
      const clean = cleanEntry(entry);
      if (clean) out[name] = clean;
    }
    return out;
  }
  function get(name) { return load()[name] || null; }
  // Replace one asset's interactions (null / nothing set removes it). Returns the whole map.
  function set(name, entry) {
    if (!NAME.test(String(name || ''))) return load();
    const all = load(), clean = cleanEntry(entry);
    if (clean) all[name] = clean; else delete all[name];
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (_) {}
    return all;
  }
  window.SideScrollInteractions = Object.freeze({ KEY, ACTIONS, LIGHT_DEFAULT, load, get, set, cleanEntry, cleanLight, flagName });
})();
