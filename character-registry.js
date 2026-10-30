/* SideScroll character registry.
 * One list of every character for Character Lab and the game: display names,
 * categories (with display order), order within a category, and roles.
 *
 * - Library characters keep their name in their library entry (Character Lab
 *   writes it); every other character's name lives here.
 * - Roles are protected tags (e.g. Default player). Each role is on exactly one
 *   character; a character with a role cannot be deleted; roles can be moved and
 *   added, never removed.
 * - Categories group and order characters; the game's picker lists characters in
 *   categories marked playable.
 * Nothing is saved until the author changes something, so published registry
 * updates still reach devices that never edited it (see project-defaults.js).
 */
(() => {
  'use strict';
  const KEY = 'sidescroll.characters.registry.v1';
  const SCHEMA = 'sidescroll.character-registry.v1';
  const LIBRARY_KEY = 'sidescroll.animlab.character-library.v1';
  // Characters whose data predates the library. Only their display names and
  // families are listed here; nothing else about them is special.
  const ORIGINAL = Object.freeze({
    original: { name: 'Hero 1', family: 'human' },
    alternate: { name: 'Hero 2', family: 'human' },
    fox: { name: 'Fox', family: 'fox' }
  });
  const DEFAULTS = () => ({
    schema: SCHEMA,
    categories: [
      { id: 'playable', name: 'Playable', playable: true },
      { id: 'enemy', name: 'Enemy', playable: false },
      { id: 'interactive', name: 'Interactive', playable: false }
    ],
    roles: [
      { id: 'default-player', name: 'Default player', character: 'original' },
      { id: 'default-animal', name: 'Default animal', character: 'fox' }
    ],
    characters: {}
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const cleanName = value => String(value || '').trim().replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 42);
  const slug = value => cleanName(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    const reg = DEFAULTS();
    if (raw?.schema !== SCHEMA) return reg;
    if (Array.isArray(raw.categories) && raw.categories.length) {
      reg.categories = raw.categories.filter(c => c && typeof c.id === 'string' && cleanName(c.name))
        .map(c => ({ id: c.id, name: cleanName(c.name), playable: !!c.playable }));
    }
    if (Array.isArray(raw.roles)) {
      const byId = new Map(reg.roles.map(r => [r.id, r]));
      for (const r of raw.roles) {
        if (!r || typeof r.id !== 'string' || !cleanName(r.name)) continue;
        byId.set(r.id, { id: r.id, name: cleanName(r.name), character: String(r.character || '') });
      }
      reg.roles = [...byId.values()];
    }
    if (raw.characters && typeof raw.characters === 'object') reg.characters = clone(raw.characters);
    return reg;
  }
  function save(reg) {
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, categories: reg.categories, roles: reg.roles, characters: reg.characters }));
  }
  function libraryEntries() {
    try {
      const lib = JSON.parse(localStorage.getItem(LIBRARY_KEY) || 'null');
      return Array.isArray(lib?.entries) ? lib.entries.filter(e => /^user-[a-z0-9-]{5,40}$/.test(e?.id)) : [];
    } catch (_) { return []; }
  }

  // Every character, in display order: category order, then order within the
  // category, then creation order.
  function list({ includeHidden = false } = {}) {
    const reg = load();
    const categoryIndex = new Map(reg.categories.map((c, i) => [c.id, i]));
    const fallbackCategory = reg.categories[0]?.id || 'playable';
    const rows = [
      ...Object.entries(ORIGINAL).map(([id, c], i) => ({ id, name: c.name, family: c.family, library: false, seq: i })),
      ...libraryEntries().map((e, i) => ({ id: e.id, name: cleanName(e.name) || e.id, family: e.family === 'fox' ? 'fox' : 'human', library: true, seq: 100 + i }))
    ].map(row => {
      const meta = reg.characters[row.id] || {};
      const category = categoryIndex.has(meta.category) ? meta.category : fallbackCategory;
      return {
        ...row,
        name: (!row.library && cleanName(meta.name)) || row.name,
        category,
        order: Number.isFinite(meta.order) ? meta.order : row.seq,
        hidden: !!meta.hidden && !row.library,
        roles: reg.roles.filter(r => r.character === row.id).map(r => ({ id: r.id, name: r.name }))
      };
    });
    return rows
      .filter(row => includeHidden || !row.hidden)
      .sort((a, b) => (categoryIndex.get(a.category) - categoryIndex.get(b.category)) || (a.order - b.order) || (a.seq - b.seq));
  }
  const find = id => list({ includeHidden: true }).find(c => c.id === id) || null;
  const name = id => find(id)?.name || null;

  function update(work) { const reg = load(); work(reg); save(reg); return true; }
  function meta(reg, id) { return (reg.characters[id] ||= {}); }

  // Renames a non-library character. Library characters are renamed through
  // Character Lab, which owns their library entry.
  function renameOriginal(id, value) {
    const clean = cleanName(value);
    if (!clean || !has(ORIGINAL, id)) return false;
    return update(reg => { meta(reg, id).name = clean; });
  }
  function setCategory(id, categoryId) {
    return update(reg => {
      if (!reg.categories.some(c => c.id === categoryId)) throw Error('Unknown category');
      const m = meta(reg, id); m.category = categoryId; m.order = Date.now();
    });
  }
  // Swap with the neighbour above (-1) or below (+1) in the same category.
  function move(id, delta) {
    const rows = list(), me = rows.find(r => r.id === id);
    if (!me) return false;
    const peers = rows.filter(r => r.category === me.category);
    const index = peers.findIndex(r => r.id === id), other = peers[index + delta];
    if (!other) return false;
    return update(reg => {
      peers.forEach((r, i) => { meta(reg, r.id).order = i; meta(reg, r.id).category = r.category; });
      meta(reg, id).order = index + delta; meta(reg, other.id).order = index;
    });
  }
  const rolesOf = id => load().roles.filter(r => r.character === id);
  const canDelete = id => rolesOf(id).length === 0;
  function assignRole(roleId, characterId) {
    if (!find(characterId)) return false;
    return update(reg => { const role = reg.roles.find(r => r.id === roleId); if (!role) throw Error('Unknown role'); role.character = characterId; });
  }
  function addRole(roleName, characterId) {
    const clean = cleanName(roleName);
    if (!clean || !find(characterId)) return false;
    return update(reg => { reg.roles.push({ id: `role-${slug(clean) || 'role'}-${Date.now().toString(36)}`, name: clean, character: characterId }); });
  }
  function renameRole(roleId, value) {
    const clean = cleanName(value);
    return !!clean && update(reg => { const role = reg.roles.find(r => r.id === roleId); if (role) role.name = clean; });
  }
  function addCategory(categoryName) {
    const clean = cleanName(categoryName);
    return !!clean && update(reg => { reg.categories.push({ id: `category-${slug(clean) || 'new'}-${Date.now().toString(36)}`, name: clean, playable: false }); });
  }
  function renameCategory(categoryId, value) {
    const clean = cleanName(value);
    return !!clean && update(reg => { const c = reg.categories.find(x => x.id === categoryId); if (c) c.name = clean; });
  }
  function setCategoryPlayable(categoryId, playable) {
    return update(reg => { const c = reg.categories.find(x => x.id === categoryId); if (c) c.playable = !!playable; });
  }
  function moveCategory(categoryId, delta) {
    return update(reg => {
      const i = reg.categories.findIndex(c => c.id === categoryId), j = i + delta;
      if (i < 0 || j < 0 || j >= reg.categories.length) return;
      [reg.categories[i], reg.categories[j]] = [reg.categories[j], reg.categories[i]];
    });
  }
  // Categories can be removed only when empty; the last category always stays.
  function removeCategory(categoryId) {
    const reg = load();
    if (reg.categories.length <= 1 || list({ includeHidden: true }).some(c => c.category === categoryId)) return false;
    return update(r => { r.categories = r.categories.filter(c => c.id !== categoryId); });
  }
  // Non-library characters are hidden rather than deleted (their data is shared
  // storage); library characters are removed by Character Lab, then forgotten here.
  function hideOriginal(id) {
    if (!has(ORIGINAL, id) || !canDelete(id)) return false;
    return update(reg => { meta(reg, id).hidden = true; });
  }
  function forget(id) {
    if (!canDelete(id)) return false;
    return update(reg => { delete reg.characters[id]; });
  }
  // The character a new player starts as: the Default player role, if that
  // character still exists.
  function defaultPlayer() {
    const role = load().roles.find(r => r.id === 'default-player');
    const target = role && find(role.character);
    return target && !target.hidden ? target.id : null;
  }
  const isPlayable = id => {
    const c = find(id), reg = load();
    return !!c && !c.hidden && !!reg.categories.find(x => x.id === c.category)?.playable;
  };

  window.SideScrollCharacters = Object.freeze({
    KEY, ORIGINAL_IDS: Object.freeze(Object.keys(ORIGINAL)),
    isOriginal: id => has(ORIGINAL, id),
    load, list, find, name, renameOriginal, setCategory, move,
    rolesOf, canDelete, assignRole, addRole, renameRole,
    addCategory, renameCategory, setCategoryPlayable, moveCategory, removeCategory,
    hideOriginal, forget, defaultPlayer, isPlayable,
    categories: () => load().categories, roles: () => load().roles
  });
})();
