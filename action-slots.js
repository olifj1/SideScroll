/* SideScroll action slots (C3b). One project-wide list of named slots that a
 * character's animations are assigned to: Idle, Walk, Run, Jump and Climb are
 * built in and played by the game (Climb may be left empty: the game's coded
 * climbing then plays — OPTIONAL); slots the author adds (Crawl, Sniff…) are data until
 * something uses them — game code (C5 actions) or an action path placed in the
 * scene (C6). Each character maps slots to its own animations
 * (slotAnimations: { slotId: animationKey | null }); with no entry a built-in
 * slot plays the character's animation of the same name.
 * Stored in sidescroll.action-slots.v1, written only when the author adds,
 * renames or removes a slot.
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.action-slots.v1';
  const SCHEMA = 'sidescroll.action-slots.v1';
  const BUILT_IN = Object.freeze(['idle', 'walk', 'run', 'jump', 'climb']);
  // Built-in slots that may play no animation: the game has its own behaviour.
  const OPTIONAL = Object.freeze(['climb']);
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const cleanName = value => String(value || '').trim().replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 42);
  const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);
  const SLOT_ID = /^slot-[a-z0-9-]{3,60}$/;

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    const store = { schema: SCHEMA, slots: {}, order: [...BUILT_IN] };
    for (const id of BUILT_IN) store.slots[id] = { id, name: titleCase(id), builtIn: true };
    if (raw?.schema !== SCHEMA || !raw.slots || typeof raw.slots !== 'object') return store;
    for (const [id, slot] of Object.entries(raw.slots)) {
      const name = cleanName(slot?.name);
      if (BUILT_IN.includes(id)) { if (name) store.slots[id].name = name; continue; }
      if (SLOT_ID.test(id) && name) store.slots[id] = { id, name, builtIn: false };
    }
    // Built-in slots the saved order doesn't place yet go straight after the
    // built-in slot before them (Climb, added later, lands after Jump).
    const order = Array.isArray(raw.order) ? raw.order.filter(id => has(store.slots, id)) : [];
    BUILT_IN.forEach((id, i) => {
      if (order.includes(id)) return;
      const before = BUILT_IN.slice(0, i).reverse().find(x => order.includes(x));
      order.splice(before ? order.indexOf(before) + 1 : 0, 0, id);
    });
    store.order = [...new Set([...order, ...Object.keys(store.slots)])];
    return store;
  }
  function save(store) {
    const slots = {};
    for (const id of store.order) slots[id] = { name: store.slots[id].name };
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, slots, order: store.order }));
  }
  const list = () => { const s = load(); return s.order.map(id => s.slots[id]); };
  const get = id => load().slots[id] || null;
  // Built-in slots are played by the game; a custom slot is in the game once an asset's Hold
  // uses it as its arm pose (asset-interactions.js); others wait for C5 / C6.
  function isHookedUp(id) {
    if (BUILT_IN.includes(id)) return true;
    const all = window.SideScrollInteractions?.load?.() || {};
    return Object.values(all).some(entry => entry?.hold?.layer === id);
  }

  function add(name) {
    const clean = cleanName(name);
    if (!clean) return null;
    const store = load();
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'action';
    const id = `slot-${slug}-${Date.now().toString(36)}`;
    store.slots[id] = { id, name: clean, builtIn: false };
    store.order.push(id);
    save(store);
    return store.slots[id];
  }
  function rename(id, name) {
    const clean = cleanName(name), store = load();
    if (!clean || !store.slots[id]) return false;
    store.slots[id].name = clean;
    save(store);
    return true;
  }
  // Custom slots only; characters' assignments to it are simply ignored after.
  function remove(id) {
    const store = load();
    if (!store.slots[id] || store.slots[id].builtIn) return false;
    delete store.slots[id];
    store.order = store.order.filter(x => x !== id);
    save(store);
    return true;
  }
  function move(id, delta) {
    const store = load(), i = store.order.indexOf(id), j = i + delta;
    if (i < 0 || j < 0 || j >= store.order.length) return false;
    [store.order[i], store.order[j]] = [store.order[j], store.order[i]];
    save(store);
    return true;
  }

  window.SideScrollActionSlots = Object.freeze({ KEY, BUILT_IN, OPTIONAL, SLOT_ID, list, get, isHookedUp, add, rename, remove, move });
})();
