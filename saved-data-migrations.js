/* SideScroll saved-data migrations (value level).
 * Storage keys that were renamed are handled by project-defaults.js; this file
 * changes values *inside* saved data. Every step only maps old values to new
 * ones, so running it again changes nothing: it runs on every load (a restored
 * old backup is migrated the next time a page opens) and is also used by
 * character imports (old export files) and mirrored in tools/bake_project.py.
 *
 * C2a (31 Oct 2026) — nothing named after a character:
 *  - original character IDs  original / alternate / fox → char-1 / char-2 / char-3
 *  - rig families            human / fox                → biped / quadruped
 *  - library starters        original / fox             → biped / quadruped
 *  - identifiers such as the quadruped baseline marker and rest-rig schema
 *    (STRINGS below), which code compares against saved data.
 * Must load before project-defaults.js.
 */
(() => {
  'use strict';
  const IDS = Object.freeze({ original: 'char-1', alternate: 'char-2', fox: 'char-3' });
  const FAMILY = Object.freeze({ human: 'biped', fox: 'quadruped' });
  const STARTER = Object.freeze({ original: 'biped', fox: 'quadruped' });
  const STRINGS = Object.freeze({
    'sidescroll.fox.rest-rig.v3': 'sidescroll.quadruped.rest-rig.v3',
    'sidescroll.fox-authoring-baseline.v1': 'sidescroll.quadruped-baseline.v1',
    'fox-idle-static-v1': 'quadruped-idle-static-v1',
    'fox-walk-example-v3': 'quadruped-walk-example-v3',
    'fox-example-walk': 'quadruped-example-walk',
    foxShape: 'quadruped-shape'
  });
  const BASELINE = /^fox-authoring-baseline-/;
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const map = (table, value) => (typeof value === 'string' && has(table, value) ? table[value] : value);
  const string = value => {
    if (has(STRINGS, value)) return STRINGS[value];
    return BASELINE.test(value) ? value.replace(BASELINE, 'quadruped-baseline-') : value;
  };

  // Identifiers, family/starter fields and family-keyed maps, anywhere in a value.
  function deep(value, parentKey = '') {
    if (typeof value === 'string') return string(value);
    if (Array.isArray(value)) return value.map(item => deep(item));
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [rawKey, item] of Object.entries(value)) {
      const key = rawKey === 'foxBaselineId' ? 'quadrupedBaselineId'
        : parentKey === 'families' ? map(FAMILY, rawKey) : rawKey;
      out[key] = key === 'family' ? map(FAMILY, item)
        : key === 'starter' ? map(STARTER, item) : deep(item, key);
    }
    return out;
  }
  const renameKeys = (obj, rename) => (obj && typeof obj === 'object' && !Array.isArray(obj)
    ? Object.fromEntries(Object.entries(obj).map(([k, v]) => [rename(k), v])) : obj);
  const idKeys = obj => renameKeys(obj, k => map(IDS, k));

  // Places that hold a character ID, per storage key (after deep()).
  const BY_KEY = {
    'sidescroll.characters.registry.v1': v => ({
      ...v, characters: idKeys(v.characters),
      roles: Array.isArray(v.roles) ? v.roles.map(r => (r && typeof r === 'object' ? { ...r, character: map(IDS, r.character) } : r)) : v.roles
    }),
    'sidescroll.animlab.setup.v1': idKeys,
    'sidescroll.animlab.atlas-docs.v1': v => ({ ...v, characters: idKeys(v.characters) }),
    'sidescroll.animlab.static-reference.v1': v => ({
      ...v, contexts: v.contexts && typeof v.contexts === 'object' ? Object.fromEntries(Object.entries(v.contexts).map(([k, c]) => [
        k.startsWith('character:') ? `character:${map(IDS, k.slice(10))}` : map(FAMILY, k),
        c && typeof c === 'object' ? { ...c, source: map(IDS, c.source) } : c
      ])) : v.contexts
    }),
    'sidescroll.animlab.reference.settings.v1': v => ({
      ...v, contexts: renameKeys(v.contexts, k => {
        const bar = k.indexOf('|');
        return bar < 0 ? k : `${map(IDS, k.slice(0, bar))}${k.slice(bar)}`;
      })
    })
  };
  // Keys whose value is a plain string rather than JSON.
  const PLAIN = {
    'gamehub.walklab.character.v1': v => map(IDS, v),
    'sidescroll.quadruped.rig.baseline-id': string,
    'sidescroll.quadruped.collider.baseline-id': string
  };
  const DEEP_ONLY = ['sidescroll.animlab.sparse.clips.v1', 'sidescroll.animlab.quadruped.clips.v1',
    'sidescroll.animlab.character-library.v1', 'sidescroll.quadruped.rig.v3', 'sidescroll.quadruped.rig.v2',
    'sidescroll.quadruped.collider.v1', 'sidescroll.animlab.legacy.samples.backup.v1'];
  const KEYS = Object.freeze([...Object.keys(BY_KEY), ...Object.keys(PLAIN), ...DEEP_ONLY]);

  // A parsed value of `key`, migrated (returns the same value if untouched).
  function migrateValue(key, value) {
    if (has(PLAIN, key)) return typeof value === 'string' ? PLAIN[key](value) : value;
    if (!KEYS.includes(key) || !value || typeof value !== 'object') return value;
    const out = deep(value);
    return has(BY_KEY, key) ? BY_KEY[key](out) : out;
  }
  // A raw stored string of `key`, migrated; null/unparseable values unchanged.
  function migrateRaw(key, raw) {
    if (raw === null || raw === undefined || !KEYS.includes(key)) return raw;
    if (has(PLAIN, key)) return migrateValue(key, raw);
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { return raw; }
    const next = JSON.stringify(migrateValue(key, parsed));
    return next === JSON.stringify(parsed) ? raw : next;
  }

  window.SideScrollMigrations = Object.freeze({
    KEYS, IDS, FAMILY, STARTER,
    migrateValue, migrateRaw,
    characterId: id => map(IDS, id),
    family: family => map(FAMILY, family),
    starter: starter => map(STARTER, starter)
  });
})();
