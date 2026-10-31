/* SideScroll rig templates (C2b).
 * A rig template is a named rig: a family (biped / quadruped) plus rest
 * proportions held as data. Each character either links to a template (an
 * *instance*) or has a *unique copy*; either way the character keeps its own
 * saved copy of the rig, so the game never changes until the author accepts a
 * template update in Character Lab.
 *
 * A character's link lives in its setup as
 *   rigTemplate: { id, mode: 'instance' | 'unique', revision }
 * (revision = the template revision the character's copy was taken from).
 * Without a saved link: bipeds are instances of Biped, the original quadruped
 * is an instance of Quadruped, library quadrupeds are unique copies of it —
 * exactly how rigs were shared before templates existed.
 *
 * Stored in sidescroll.rig-templates.v1, written only when templates change.
 * Until then the Quadruped template's proportions are the original quadruped
 * character's current rig. Bipeds have fixed proportions (no Rig workspace yet).
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.rig-templates.v1';
  const SCHEMA = 'sidescroll.rig-templates.v1';
  const SETUP_KEY = 'sidescroll.animlab.setup.v1';
  const LIBRARY_KEY = 'sidescroll.animlab.character-library.v1';
  const BIPED = 'rig-biped', QUADRUPED = 'rig-quadruped';
  const clone = value => JSON.parse(JSON.stringify(value));
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const cleanName = value => String(value || '').trim().replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 42);
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const Quadruped = () => window.SideScrollQuadrupedRig || null;

  function builtIns() {
    const q = Quadruped();
    return {
      [BIPED]: { id: BIPED, name: 'Biped', family: 'biped', restRig: null, revision: 1, builtIn: true },
      [QUADRUPED]: { id: QUADRUPED, name: 'Quadruped', family: 'quadruped', revision: 1, builtIn: true,
        restRig: q ? clone(q.loadRestRig?.() || q.DEFAULT_REST_RIG) : null }
    };
  }
  function normaliseRig(family, rig) {
    if (family !== 'quadruped' || !rig) return null;
    return Quadruped()?.normalizedRestRig ? Quadruped().normalizedRestRig(rig) : clone(rig);
  }
  function load() {
    const raw = read(KEY), store = { schema: SCHEMA, templates: builtIns(), order: [BIPED, QUADRUPED] };
    if (raw?.schema !== SCHEMA || !raw.templates || typeof raw.templates !== 'object') return store;
    for (const [id, t] of Object.entries(raw.templates)) {
      if (!/^rig-[a-z0-9-]{3,60}$/.test(id) || !t || !['biped', 'quadruped'].includes(t.family)) continue;
      store.templates[id] = { id, name: cleanName(t.name) || id, family: t.family,
        restRig: normaliseRig(t.family, t.restRig), revision: Math.max(1, Math.floor(Number(t.revision) || 1)),
        builtIn: id === BIPED || id === QUADRUPED, updatedAt: String(t.updatedAt || '') };
    }
    const order = Array.isArray(raw.order) ? raw.order.filter(id => has(store.templates, id)) : [];
    store.order = [...new Set([...order, ...Object.keys(store.templates)])];
    return store;
  }
  function save(store) {
    const templates = {};
    for (const id of store.order) {
      const t = store.templates[id];
      templates[id] = { name: t.name, family: t.family, restRig: t.restRig, revision: t.revision, updatedAt: t.updatedAt || '' };
    }
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, templates, order: store.order }));
  }
  const list = family => { const s = load(); return s.order.map(id => s.templates[id]).filter(t => !family || t.family === family); };
  const get = id => load().templates[id] || null;

  // ---- characters and their links -------------------------------------------
  // Every character with its saved setup (originals: setup map; library: entry).
  function characters() {
    const registry = window.SideScrollCharacters;
    const setupMap = read(SETUP_KEY) || {};
    const library = read(LIBRARY_KEY);
    const entries = new Map((Array.isArray(library?.entries) ? library.entries : []).map(e => [e.id, e]));
    return (registry ? registry.list() : []).map(c => ({
      id: c.id, name: c.name, family: c.family, library: !!c.library,
      setup: c.library ? entries.get(c.id)?.setup || null : setupMap[c.id] || null
    }));
  }
  function defaultLink(character) {
    if (character.family === 'biped') return { id: BIPED, mode: 'instance', revision: 1 };
    return character.library ? { id: QUADRUPED, mode: 'unique', revision: 1 } : { id: QUADRUPED, mode: 'instance', revision: 1 };
  }
  // The link of a character (a saved link wins; it must name a template of the
  // character's family, otherwise the default applies).
  function linkFor(character, setup = character.setup) {
    const saved = setup?.rigTemplate, template = saved && get(saved.id);
    if (template && template.family === character.family && ['instance', 'unique'].includes(saved.mode))
      return { id: saved.id, mode: saved.mode, revision: Math.max(1, Math.floor(Number(saved.revision) || 1)) };
    return defaultLink(character);
  }
  // Characters linked to a template as instances (optionally excluding one).
  function usersOf(templateId, exceptId = null) {
    return characters().filter(c => c.id !== exceptId && !(window.SideScrollCharacters?.find(c.id)?.hidden))
      .filter(c => { const link = linkFor(c); return link.mode === 'instance' && link.id === templateId; });
  }
  const isStale = (link, template = get(link?.id)) => !!template && link.mode === 'instance' && template.revision > link.revision;

  // ---- editing templates ------------------------------------------------------
  function create(name, family, restRig) {
    const clean = cleanName(name);
    if (!clean || !['biped', 'quadruped'].includes(family)) return null;
    const store = load();
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'rig';
    const id = `rig-${slug}-${Date.now().toString(36)}`;
    store.templates[id] = { id, name: clean, family, restRig: normaliseRig(family, restRig), revision: 1, updatedAt: new Date().toISOString() };
    store.order.push(id);
    save(store);
    return store.templates[id];
  }
  // New proportions for a template; returns the new revision.
  function update(id, restRig) {
    const store = load(), t = store.templates[id];
    if (!t || t.family !== 'quadruped') return null;
    t.restRig = normaliseRig(t.family, restRig);
    t.revision += 1;
    t.updatedAt = new Date().toISOString();
    save(store);
    return t.revision;
  }
  function rename(id, name) {
    const clean = cleanName(name), store = load();
    if (!clean || !store.templates[id]) return false;
    store.templates[id].name = clean;
    save(store);
    return true;
  }
  // Only templates nobody links to (instances or unique copies' source) and not built in.
  function canRemove(id) {
    const t = get(id);
    return !!t && !t.builtIn && !characters().some(c => linkFor(c).id === id);
  }
  function remove(id) {
    if (!canRemove(id)) return false;
    const store = load();
    delete store.templates[id];
    store.order = store.order.filter(x => x !== id);
    save(store);
    return true;
  }

  window.SideScrollRigTemplates = Object.freeze({
    KEY, BIPED, QUADRUPED, list, get, characters, linkFor, defaultLink, usersOf, isStale,
    create, update, rename, canRemove, remove
  });
})();
