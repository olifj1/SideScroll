/* SideScroll animation templates (C3a).
 * An animation template is a named clip for one rig family and action slot.
 * Each character's animation for a slot either links to a template (an
 * *instance*) or is a *unique copy*; either way the character keeps its own
 * saved copy of the clip, so the game never changes until the author accepts a
 * template update in Character Lab. Same model as rig templates.
 *
 * A character's links: { slot: { id, mode: 'instance' | 'unique', revision } },
 * kept with its clips (original characters: sidescroll.animlab.character-clips.v1;
 * library characters: their library entry's animationLinks).
 * Without a saved link: original characters are instances of their family's
 * built-in template for the slot (the two heroes share the Biped set, as they
 * always have); library characters are unique copies.
 *
 * Stored in sidescroll.animation-templates.v1, written only when templates
 * change. Until then a built-in template's clip is the family's original clip,
 * supplied by Character Lab (setDefaultSource).
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.animation-templates.v1';
  const SCHEMA = 'sidescroll.animation-templates.v1';
  const SLOTS = Object.freeze({ biped: ['idle', 'walk', 'run', 'jump'], quadruped: ['idle', 'walk', 'run', 'jump'] });
  const clone = value => JSON.parse(JSON.stringify(value));
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const cleanName = value => String(value || '').trim().replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 42);
  const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);
  let defaultSource = () => null;

  const builtInId = (family, slot) => `anim-${family}-${slot}`;
  function builtIns() {
    const out = {};
    for (const [family, slots] of Object.entries(SLOTS)) for (const slot of slots) {
      const id = builtInId(family, slot), clip = defaultSource(family, slot);
      out[id] = { id, name: `${titleCase(family)} ${slot}`, family, slot, clip: clip ? clone(clip) : null, revision: 1, builtIn: true };
    }
    return out;
  }
  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    const store = { schema: SCHEMA, templates: builtIns() };
    store.order = Object.keys(store.templates);
    if (raw?.schema !== SCHEMA || !raw.templates || typeof raw.templates !== 'object') return store;
    for (const [id, t] of Object.entries(raw.templates)) {
      if (!/^anim-[a-z0-9-]{3,60}$/.test(id) || !t || !has(SLOTS, t.family) || !t.clip || typeof t.clip !== 'object') continue;
      store.templates[id] = { id, name: cleanName(t.name) || id, family: t.family, slot: String(t.slot || ''),
        clip: clone(t.clip), revision: Math.max(1, Math.floor(Number(t.revision) || 1)),
        builtIn: has(store.templates, id) && !!store.templates[id].builtIn, updatedAt: String(t.updatedAt || '') };
    }
    const order = Array.isArray(raw.order) ? raw.order.filter(id => has(store.templates, id)) : [];
    store.order = [...new Set([...order, ...Object.keys(store.templates)])];
    return store;
  }
  function save(store) {
    const templates = {};
    for (const id of store.order) {
      const t = store.templates[id];
      if (!t.clip) continue;
      templates[id] = { name: t.name, family: t.family, slot: t.slot, clip: t.clip, revision: t.revision, updatedAt: t.updatedAt || '' };
    }
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, templates, order: store.order.filter(id => templates[id]) }));
  }
  const list = (family, slot) => { const s = load(); return s.order.map(id => s.templates[id]).filter(t => (!family || t.family === family) && (!slot || t.slot === slot)); };
  const get = id => load().templates[id] || null;

  // character: { id, family, library }; links: the character's saved links.
  function defaultLink(character, slot) {
    return { id: builtInId(character.family, slot), mode: character.library ? 'unique' : 'instance', revision: 1 };
  }
  function linkFor(character, slot, links) {
    const saved = links?.[slot], template = saved && get(saved.id);
    if (template && template.family === character.family && ['instance', 'unique'].includes(saved.mode))
      return { id: saved.id, mode: saved.mode, revision: Math.max(1, Math.floor(Number(saved.revision) || 1)) };
    return defaultLink(character, slot);
  }
  const isStale = (link, template = get(link?.id)) => !!template && link.mode === 'instance' && template.revision > link.revision;

  // New clip for a template; returns the new revision.
  function update(id, clip) {
    const store = load(), t = store.templates[id];
    if (!t || !clip) return null;
    t.clip = clone(clip);
    t.revision += 1;
    t.updatedAt = new Date().toISOString();
    save(store);
    return t.revision;
  }
  function create(name, family, slot, clip) {
    const clean = cleanName(name);
    if (!clean || !has(SLOTS, family) || !clip) return null;
    const store = load();
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'clip';
    const id = `anim-${slug}-${Date.now().toString(36)}`;
    store.templates[id] = { id, name: clean, family, slot, clip: clone(clip), revision: 1, updatedAt: new Date().toISOString() };
    store.order.push(id);
    save(store);
    return store.templates[id];
  }

  function rename(id, name) {
    const clean = cleanName(name), store = load();
    if (!clean || !store.templates[id]?.clip) return false;
    store.templates[id].name = clean;
    save(store);
    return true;
  }
  // Every saved link to a template, across characters (original characters'
  // clip store and library entries; slot animations and ones they created).
  function savedLinkIds() {
    const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
    const ids = new Set(), add = links => { for (const link of Object.values(links || {})) if (link?.id) ids.add(link.id); };
    const addExtras = extras => { for (const extra of Object.values(extras || {})) if (extra?.link?.id) ids.add(extra.link.id); };
    for (const record of Object.values(read('sidescroll.animlab.character-clips.v1')?.characters || {})) { add(record?.links); addExtras(record?.extraClips); }
    for (const entry of read('sidescroll.animlab.character-library.v1')?.entries || []) { add(entry?.animationLinks); addExtras(entry?.extraClips); }
    return ids;
  }
  // Built-in templates always stay (characters follow them by default).
  const canRemove = id => { const t = get(id); return !!t && !t.builtIn && !savedLinkIds().has(id); };
  function remove(id) {
    if (!canRemove(id)) return false;
    const store = load();
    delete store.templates[id];
    store.order = store.order.filter(x => x !== id);
    save(store);
    return true;
  }

  window.SideScrollAnimationTemplates = Object.freeze({
    KEY, SLOTS, builtInId, list, get, linkFor, defaultLink, isStale, update, create, rename, canRemove, remove,
    // Character Lab supplies the original clip of each family slot.
    setDefaultSource: fn => { if (typeof fn === 'function') defaultSource = fn; }
  });
})();
