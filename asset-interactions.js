/* SideScroll · asset interactions (what the player can do to an asset)
 * Per asset name, in sidescroll.asset-interactions.v1 (content, Assets area):
 *   { [asset name]: { inspect: { title, text, large } } }
 * Inspect: Action near any placed copy (or sequence object) of the asset shows
 * the title and text; `large` shows the asset's picture big on screen (a note to
 * read). Later actions (collect, use…) are further keys beside `inspect`.
 * Asset Lab edits it (Interactions section); the game reads it.
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.asset-interactions.v1';
  const ACTIONS = Object.freeze({ inspect: 'Inspect' });
  const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/;
  const text = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').slice(0, max) : '');

  function cleanInspect(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return { title: text(raw.title, 80).trim(), text: text(raw.text, 2000), large: !!raw.large };
  }
  function cleanEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    const inspect = cleanInspect(raw.inspect);
    if (inspect) out.inspect = inspect;
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
  window.SideScrollInteractions = Object.freeze({ KEY, ACTIONS, load, get, set, cleanEntry });
})();
