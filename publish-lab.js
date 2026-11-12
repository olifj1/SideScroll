/* SideScroll Publish Lab (step 3 of the publishing workflow, 3 Nov 2026).
 * Shows what this device has changed compared with the published game (the
 * built-in content, project-defaults-data.js), per content area and per
 * character, and makes a publish package for tools/bake_project.py.
 *
 * Areas come from storage-catalogue.json: every key scoped "content" or
 * "migration", grouped by its area, except each character's own pieces, which
 * are compared per character (character-packages.js compareWithPublished).
 * A key's status: Published (no copy of its own here, or one equal to the
 * built-in value), Changed (differs), New (no built-in value).
 * The design document is published as design-doc.json, so it is compared with
 * that file.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Packages = window.SideScrollCharacterPackages;
  const Defaults = window.SideScrollProjectDefaults;
  const published = window.SIDESCROLL_PROJECT_DEFAULTS?.storage || {};
  const PUBLISH_SCHEMA = 'sidescroll.publish-package.v1';
  const SETTINGS_SCHEMA = 'sidescroll.my-settings.v1';
  const DESIGN_KEY = 'sidescroll-design-doc-working-v2';
  // Each character's own pieces live in these keys; they are compared and
  // published per character, not as an area.
  const CHARACTER_KEYS = new Set([
    'sidescroll.characters.registry.v1', 'sidescroll.animlab.character-library.v1', 'sidescroll.animlab.atlas-docs.v1',
    'sidescroll.animlab.setup.v1', 'sidescroll.animlab.sparse.clips.v1', 'sidescroll.animlab.quadruped.clips.v1',
    'sidescroll.animlab.static-reference.v1', 'sidescroll.animlab.reference.settings.v1', 'sidescroll.animlab.character-clips.v1',
    'sidescroll.quadruped.rig.v3', 'sidescroll.quadruped.rig.v2', 'sidescroll.quadruped.rig.baseline-id',
    'sidescroll.quadruped.collider.v1', 'sidescroll.quadruped.collider.baseline-id', 'sidescroll.walklab.collider.v1',
    'gamehub.walklab.anim.v6', 'gamehub.walklab.anim.v5', 'gamehub.walklab.anim.v4'
  ]);
  const AREA_NAMES = { Characters: 'Character templates & actions' };
  const Registry = window.SideScrollCharacters || null;
  const AREA_DETAIL = {
    World: 'Terrain, biomes, journey elements, camera, fog',
    Story: 'Sequences and events',
    Puzzles: 'Puzzle and World Group templates, starts, collectables',
    'Puzzle Lab': 'Puzzle Lab test scene and templates',
    Assets: 'Imported assets and their art; asset behaviours, collisions, states, sockets',
    Characters: 'Rig and animation templates, action slots',
    CharacterRoles: 'Default player and other roles; categories (which are playable)',
    Design: 'Design Lab document, Concept Lab boards'
  };

  let catalogue = null, designDoc = null, areas = [], characters = [];
  const selected = { areas: new Set(), characters: new Set() };
  let preparedFile = null, downloadURL = null;

  // ---- reading -------------------------------------------------------------
  // This device's own copy of a key (null when it uses the built-in value).
  function ownValue(key) {
    if (Defaults?.isBuiltIn?.(key)) return null;
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  // Imported assets: art on this phone (IndexedDB) and the same art published as a
  // file count as the same when its size and byte count match.
  const ASSET_LIBRARY_KEY = 'sidescroll.asset-library.v1';
  const AssetLib = window.SideScrollAssetLibrary || null;
  function assetLibraryCanon(raw) {
    try {
      const lib = JSON.parse(raw);
      for (const e of lib?.assets || []) if (e?.art) e.art = { width: e.art.width, height: e.art.height, bytes: e.art.bytes };
      return JSON.stringify(lib);
    } catch (_) { return raw; }
  }
  const canonical = raw => { try { return JSON.stringify(sortKeys(JSON.parse(raw))); } catch (_) { return String(raw); } };
  const sortKeys = v => v && typeof v === 'object' ? (Array.isArray(v) ? v.map(sortKeys)
    : Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])]))) : v;
  function keyStatus(key) {
    const own = ownValue(key);
    if (key === DESIGN_KEY) {
      if (own === null) return 'published';
      if (!designDoc) return 'changed';
      try { const doc = JSON.parse(own); delete doc.workingUpdated; return canonical(JSON.stringify(doc)) === canonical(JSON.stringify(designDoc)) ? 'published' : 'changed'; }
      catch (_) { return 'changed'; }
    }
    const pub = Object.prototype.hasOwnProperty.call(published, key) ? published[key] : null;
    if (own === null) return pub === null ? 'empty' : 'published';
    if (pub === null) return 'new';
    if (key === ASSET_LIBRARY_KEY) return canonical(assetLibraryCanon(own)) === canonical(assetLibraryCanon(pub)) ? 'published' : 'changed';
    return canonical(own) === canonical(pub) ? 'published' : 'changed';
  }

  function buildAreas() {
    const groups = new Map();
    for (const [key, info] of Object.entries(catalogue.keys)) {
      if (!['content', 'migration'].includes(info.scope) || CHARACTER_KEYS.has(key)) continue;
      if (!groups.has(info.area)) groups.set(info.area, { id: info.area, name: AREA_NAMES[info.area] || info.area, keys: [], content: [] });
      groups.get(info.area).keys.push(key);
      if (info.scope === 'content') groups.get(info.area).content.push(key);
    }
    return [...groups.values()].map(area => {
      const states = area.content.map(keyStatus);
      const changed = states.filter(s => s === 'changed').length, added = states.filter(s => s === 'new').length;
      const status = changed ? 'changed' : added ? 'new' : states.every(s => s === 'empty') ? 'empty' : 'published';
      return { ...area, status, changed, added };
    }).concat(rolesArea());
  }
  // Character roles & categories: the registry's project-wide lists (Default player
  // and other roles; categories and which are playable). Character packages carry
  // only each character's own registry entry, so these publish as their own area.
  const REGISTRY_KEY = 'sidescroll.characters.registry.v1', ROLES_AREA = 'CharacterRoles';
  const sharedLists = reg => ({ roles: reg?.roles || [], categories: reg?.categories || [] });
  function publishedShared() {
    const text = window.SIDESCROLL_PROJECT_DEFAULTS?.storage?.[REGISTRY_KEY] ?? null;
    return sharedLists(Registry?.parse ? Registry.parse(text) : null);
  }
  function rolesArea() {
    if (!Registry?.parse) return [];
    const mine = ownValue(REGISTRY_KEY) === null ? null : sharedLists(Registry.parse(ownValue(REGISTRY_KEY)));
    const status = !mine || canonical(JSON.stringify(mine)) === canonical(JSON.stringify(publishedShared())) ? 'published' : 'changed';
    return [{ id: ROLES_AREA, name: 'Character roles & categories', keys: [], content: [], status, changed: status === 'changed' ? 1 : 0, added: 0 }];
  }

  // ---- rendering ------------------------------------------------------------
  const LABEL = { published: 'Published', changed: 'Changed', new: 'New', empty: 'Empty' };
  function row({ id, kind, name, detail, status, canPublish, canRevert }) {
    const el = document.createElement('div');
    el.className = 'row';
    const box = document.createElement('input');
    box.type = 'checkbox'; box.dataset.kind = kind; box.dataset.id = id;
    box.checked = selected[kind].has(id); box.disabled = !canPublish;
    box.setAttribute('aria-label', `Publish ${name}`);
    const text = document.createElement('div');
    text.innerHTML = '<span class="name"></span><span class="detail"></span>';
    text.querySelector('.name').textContent = name; text.querySelector('.detail').textContent = detail;
    const badge = document.createElement('span');
    badge.className = `badge ${status}`; badge.textContent = LABEL[status];
    const revert = document.createElement('button');
    revert.type = 'button'; revert.className = 'small secondary'; revert.textContent = 'Use published';
    revert.dataset.revert = kind; revert.dataset.id = id; revert.hidden = !canRevert;
    el.append(box, text, badge, revert);
    return el;
  }
  function render() {
    $('areas').replaceChildren(...areas.map(a => row({ id: a.id, kind: 'areas', name: a.name, status: a.status,
      detail: [AREA_DETAIL[a.id] || '', a.changed ? `${a.changed} changed` : '', a.added ? `${a.added} new` : ''].filter(Boolean).join(' · '),
      canPublish: a.status !== 'empty', canRevert: a.status === 'changed' || a.status === 'new' })));
    $('characters').replaceChildren(...characters.map(c => row({ id: c.id, kind: 'characters', name: c.name, status: c.status,
      detail: [c.builtIn ? 'Original character' : 'Library character', c.family === 'quadruped' ? 'Quadruped' : 'Biped',
        c.phoneOnlyArt ? 'artwork only on this phone' : ''].filter(Boolean).join(' · '),
      canPublish: true, canRevert: c.status === 'changed' })));
    updatePublishButton();
  }
  function refresh() {
    areas = buildAreas();
    characters = (Packages?.listCharacters?.() || []).map(c => Packages.compareWithPublished(c.id)).filter(Boolean);
    // Artwork published as a file: check (once) that this phone's picture is the
    // same one, then show the character's real status.
    const toCheck = characters.filter(c => c.artToCheck);
    if (toCheck.length) Promise.all(toCheck.map(c => Packages.checkPublishedArt(c.id))).then(() => refresh());
    // Anything changed or new is ticked to start with.
    for (const a of areas) if (a.status === 'changed' || a.status === 'new') selected.areas.add(a.id);
    for (const c of characters) if (c.status !== 'published') selected.characters.add(c.id); else selected.characters.delete(c.id);
    for (const a of areas) if (a.status === 'published' || a.status === 'empty') selected.areas.delete(a.id);
    render();
  }

  // ---- publish package --------------------------------------------------------
  const setStatus = (id, text, level = '') => { $(id).textContent = text; $(id).dataset.level = level; };
  function updatePublishButton() {
    $('prepare').disabled = !selected.areas.size && !selected.characters.size;
    preparedFile = null; $('share').disabled = true; $('download').hidden = true;
  }
  async function prepare() {
    $('prepare').disabled = true;
    setStatus('publish-status', 'Preparing…');
    try {
      const storage = {};
      for (const area of areas) if (selected.areas.has(area.id))
        for (const key of area.keys) { const value = localStorage.getItem(key); if (value !== null) storage[key] = value; }
      const chars = [];
      for (const c of characters) if (selected.characters.has(c.id)) chars.push(await Packages.exportCharacter(c.id, null));
      const pkg = { schema: PUBLISH_SCHEMA, app: 'SideScroll', exportedAt: new Date().toISOString(),
        areas: areas.filter(a => selected.areas.has(a.id)).map(a => a.id), storage, characters: chars };
      // Imported assets' art on this phone travels with the package; the bake tool
      // writes each to assets/ and points the asset at that file.
      if (storage[ASSET_LIBRARY_KEY] && AssetLib) {
        const missing = [];
        pkg.assetArt = {};
        for (const entry of AssetLib.list()) {
          if (entry.art.kind !== 'indexeddb') continue;
          const blob = await AssetLib.getArt(entry.art.id).catch(() => null);
          if (!blob) { missing.push(entry.label); continue; }
          pkg.assetArt[entry.art.id] = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || Error('Artwork could not be read'));
            reader.readAsDataURL(blob);
          });
        }
        if (missing.length) throw Error(`the artwork of ${missing.join(', ')} is not on this device. Publish from the device that imported it.`);
      }
      if (selected.areas.has(ROLES_AREA)) pkg.registryShared = sharedLists({ roles: Registry.roles(), categories: Registry.categories() });
      const text = JSON.stringify(pkg);
      if (JSON.parse(text).schema !== PUBLISH_SCHEMA) throw Error('Package failed validation.');
      preparedFile = new File([text], `SS-PUBLISH-${pkg.exportedAt.replace(/[:.]/g, '-')}.json`, { type: 'application/json' });
      $('share').disabled = false;
      setStatus('publish-status', `Ready · ${pkg.areas.length} area${pkg.areas.length === 1 ? '' : 's'}, ${chars.length} character${chars.length === 1 ? '' : 's'} · ${(preparedFile.size / 1024).toFixed(0)} KB. Tap Share package.`, 'success');
    } catch (err) {
      setStatus('publish-status', `Couldn't prepare the package: ${err?.message || err}`, 'error');
    } finally { $('prepare').disabled = false; }
  }
  // Share must run straight from the tap (iOS); falls back to a download.
  function shareFile(file, statusId, downloadId) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        navigator.share({ files: [file] }).then(() => setStatus(statusId, `Shared ${file.name}.`, 'success'))
          .catch(err => { if (err?.name !== 'AbortError') offerDownload(file, statusId, downloadId); });
        return;
      }
    } catch (_) {}
    offerDownload(file, statusId, downloadId, true);
  }
  function offerDownload(file, statusId, downloadId, autoStart) {
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = URL.createObjectURL(file);
    const link = $(downloadId); link.href = downloadURL; link.download = file.name; link.hidden = false;
    if (autoStart) link.click();
    setStatus(statusId, 'If it did not save, tap Download.', 'success');
  }

  // ---- use published -----------------------------------------------------------
  async function revert(kind, id) {
    if (kind === 'areas') {
      const area = areas.find(a => a.id === id);
      const fresh = area.content.filter(k => keyStatus(k) === 'new').length;
      if (!window.confirm(`Throw away this phone's changes to ${area.name} and use the published game's version?`
        + (fresh ? `\n\n${fresh} item${fresh === 1 ? '' : 's'} not in the published game will be removed.` : '')
        + '\n\nThis cannot be undone (make a Project Backup first if unsure).')) return;
      for (const key of area.keys) { try { localStorage.removeItem(key); } catch (_) {} }
      if (id === ROLES_AREA) {
        // Keep this phone's per-character entries; take the published lists.
        let reg = null; try { reg = JSON.parse(localStorage.getItem(REGISTRY_KEY) || 'null'); } catch (_) {}
        if (reg && typeof reg === 'object') {
          Object.assign(reg, publishedShared());
          try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg)); } catch (_) {}
        }
      }
    } else {
      const c = characters.find(x => x.id === id);
      if (!window.confirm(`Put ${c.name} back to its published version? Its changes on this phone are lost.`)) return;
      try { await Packages.usePublished(id); }
      catch (err) { window.alert(`Couldn't restore ${c.name}: ${err?.message || err}`); return; }
    }
    selected[kind].delete(id);
    refresh();
  }

  // ---- my settings -------------------------------------------------------------
  const localKeys = () => Object.entries(catalogue.keys).filter(([, info]) => info.scope === 'local').map(([key]) => key);
  function exportSettings() {
    const values = {};
    for (const key of localKeys()) {
      try { const v = localStorage.getItem(key) ?? sessionStorage.getItem(key); if (v !== null) values[key] = v; } catch (_) {}
    }
    const file = new File([JSON.stringify({ schema: SETTINGS_SCHEMA, exportedAt: new Date().toISOString(), values })],
      `SS-MY-SETTINGS-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, { type: 'application/json' });
    setStatus('settings-status', `${Object.keys(values).length} settings.`);
    shareFile(file, 'settings-status', 'settings-download');
  }
  async function importSettings(file) {
    try {
      const doc = JSON.parse(await file.text());
      if (doc?.schema !== SETTINGS_SCHEMA || !doc.values || typeof doc.values !== 'object') throw Error('Not a SideScroll settings file.');
      const allowed = new Set(localKeys());
      let n = 0;
      for (const [key, value] of Object.entries(doc.values)) if (allowed.has(key) && typeof value === 'string') { localStorage.setItem(key, value); n++; }
      setStatus('settings-status', `Imported ${n} setting${n === 1 ? '' : 's'}.`, 'success');
    } catch (err) { setStatus('settings-status', `Couldn't import: ${err?.message || err}`, 'error'); }
  }

  // ---- wiring ------------------------------------------------------------------
  document.addEventListener('change', ev => {
    const box = ev.target.closest('input[data-kind]');
    if (box) { if (box.checked) selected[box.dataset.kind].add(box.dataset.id); else selected[box.dataset.kind].delete(box.dataset.id); updatePublishButton(); }
    if (ev.target.id === 'settings-file' && ev.target.files?.[0]) importSettings(ev.target.files[0]).finally(() => { ev.target.value = ''; });
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-revert]');
    if (btn) revert(btn.dataset.revert, btn.dataset.id);
  });
  $('prepare').addEventListener('click', prepare);
  $('share').addEventListener('click', () => { if (preparedFile) shareFile(preparedFile, 'publish-status', 'download'); });
  $('settings-export').addEventListener('click', () => { if (catalogue) exportSettings(); });

  (async () => {
    try {
      catalogue = await (await fetch('storage-catalogue.json', { cache: 'no-cache' })).json();
      designDoc = await (await fetch('design-doc.json', { cache: 'no-cache' })).json().catch(() => null);
      if (designDoc) delete designDoc.workingUpdated;
    } catch (err) {
      setStatus('publish-status', `Couldn't load the storage catalogue: ${err?.message || err}`, 'error');
      return;
    }
    refresh();
  })();
  window.SideScrollPublishLab = Object.freeze({ refresh, keyStatus, areas: () => areas, characters: () => characters });
})();
