/* SideScroll · asset interactions (what the player can do to an asset)
 * Per asset name, in sidescroll.asset-interactions.v1 (content, Assets area):
 *   { [asset name]: { inspect: { title, text, large, flag }, collect: { label, description, flag } } }
 * Inspect: Action near any placed copy (or sequence object) of the asset shows
 * the title and text; `large` shows the asset's picture big on screen (a note to
 * read). Collect: it can be picked up (Pick up in the Inspect view, or straight
 * away when it has no Inspect) into the inventory as an item named `label`.
 * `flag`: a story flag set when it is inspected / picked up (sequence lines can
 * react). Later actions (use…) are further keys beside these.
 * Asset Lab edits it (Interactions section); the game reads it.
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.asset-interactions.v1';
  const ACTIONS = Object.freeze({ inspect: 'Inspect', collect: 'Collect' });
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
  function cleanEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    const inspect = cleanInspect(raw.inspect);
    if (inspect) out.inspect = inspect;
    const collect = cleanCollect(raw.collect);
    if (collect) out.collect = collect;
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
  window.SideScrollInteractions = Object.freeze({ KEY, ACTIONS, load, get, set, cleanEntry, flagName });
})();
