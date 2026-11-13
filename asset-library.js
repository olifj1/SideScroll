/* SideScroll — imported assets (window.SideScrollAssetLibrary).
 *
 * Art the author imports in Asset Lab becomes a game asset like the built-in
 * ones. This module is the one list of imported assets that the game and
 * Asset Lab both read.
 *
 *   sidescroll.asset-library.v1 = { assets: [{
 *     name      'asset-<base36 time>-<random>' — permanent id; placed copies,
 *               behaviours, collision and layout are all keyed by it
 *     label     display name (renaming never changes `name`)
 *     group     library heading, e.g. 'HOME FOREST'
 *     scope     'environment' | 'puzzle' — which editor library lists it
 *     category  'dressing' (scenery, any depth) | 'gameplay' (on the path)
 *     height    starting height in metres (Asset Lab's Height takes over once set)
 *     groundLine starting floor line, 0–1 from the bottom
 *     art       { kind:'indexeddb', id, width, height, bytes, name }   on this device
 *             | { kind:'bundled', file, width, height, bytes, name }   published in assets/
 *     createdAt
 *   }] }
 *
 * IndexedDB art shares Character Lab's image store (sidescroll-animlab-art-v1 /
 * atlas-images), so Project Backup and restore already carry it. Art is used
 * exactly as imported: no trimming or clean-up.
 */
(function () {
  'use strict';
  const KEY = 'sidescroll.asset-library.v1';
  const DB_NAME = 'sidescroll-animlab-art-v1';
  const DB_STORE = 'atlas-images';
  const assetPath = window.SideScrollAssetPath || (url => url);
  const NAME_RE = /^asset-[a-z0-9]+-[a-z0-9]+$/;

  const clampNum = (v, lo, hi, fallback) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };
  const text = (v, fallback, max = 80) => { const s = String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max); return s || fallback; };

  function cleanArt(art) {
    if (!art || typeof art !== 'object') return null;
    const base = { width: clampNum(art.width, 1, 16384, 1), height: clampNum(art.height, 1, 16384, 1),
      bytes: clampNum(art.bytes, 0, 1e9, 0), name: text(art.name, '', 120) };
    if (art.kind === 'indexeddb' && typeof art.id === 'string' && art.id) return { kind: 'indexeddb', id: art.id, ...base };
    if (art.kind === 'bundled' && typeof art.file === 'string' && /^[\w.-]+\.png$/.test(art.file)) return { kind: 'bundled', file: art.file, ...base };
    return null;
  }

  function clean(entry) {
    if (!entry || typeof entry !== 'object' || !NAME_RE.test(entry.name || '')) return null;
    const art = cleanArt(entry.art);
    if (!art) return null;
    return {
      name: entry.name,
      label: text(entry.label, 'Imported asset'),
      group: text(entry.group, 'IMPORTED', 48).toUpperCase(),
      scope: entry.scope === 'puzzle' ? 'puzzle' : 'environment',
      category: entry.category === 'gameplay' ? 'gameplay' : 'dressing',
      height: clampNum(entry.height, 0.25, 12, 1),
      groundLine: clampNum(entry.groundLine, 0, 1, 0),
      art,
      createdAt: clampNum(entry.createdAt, 0, 1e15, 0)
    };
  }

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      const list = Array.isArray(raw?.assets) ? raw.assets : [];
      const seen = new Set();
      return list.map(clean).filter(e => e && !seen.has(e.name) && seen.add(e.name));
    } catch (_) { return []; }
  }
  function write(list) {
    const assets = list.map(clean).filter(Boolean);
    if (assets.length) localStorage.setItem(KEY, JSON.stringify({ assets }));
    else localStorage.removeItem(KEY);
    return assets;
  }

  const list = () => read();
  const get = name => read().find(e => e.name === name) || null;
  const isImportedName = name => NAME_RE.test(String(name || ''));
  const aspect = entry => (entry?.art ? entry.art.width / Math.max(1, entry.art.height) : 1);
  const newName = () => `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const newArtId = () => `asset-art-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  function add(entry) {
    const all = read();
    const made = clean({ createdAt: Date.now(), ...entry, name: entry.name || newName() });
    if (!made) throw Error('That asset could not be saved.');
    all.push(made);
    write(all);
    return made;
  }
  function update(name, patch) {
    const all = read();
    const i = all.findIndex(e => e.name === name);
    if (i < 0) return null;
    const next = clean({ ...all[i], ...patch, name });
    if (!next) return null;
    all[i] = next;
    write(all);
    return next;
  }
  function remove(name) { write(read().filter(e => e.name !== name)); }

  // --- art storage (IndexedDB) -------------------------------------------
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Artwork storage unavailable'));
    });
  }
  async function withStore(mode, fn) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, mode);
        const result = fn(tx.objectStore(DB_STORE));
        tx.oncomplete = () => resolve(result?.result);
        tx.onerror = () => reject(tx.error || Error('Artwork storage failed'));
        tx.onabort = () => reject(tx.error || Error('Artwork storage cancelled'));
      });
    } finally { db.close(); }
  }
  async function putArt(blob) {
    const id = newArtId();
    await withStore('readwrite', store => store.put(blob, id));
    return id;
  }
  const getArt = id => withStore('readonly', store => store.get(id));
  const deleteArt = id => withStore('readwrite', store => store.delete(id));

  // One object URL per art id for the life of the page.
  const urlCache = new Map();
  function artUrl(entry) {
    const art = entry?.art;
    if (!art) return Promise.reject(Error('No artwork'));
    if (art.kind === 'bundled') return Promise.resolve(assetPath(art.file));
    if (!urlCache.has(art.id)) {
      urlCache.set(art.id, getArt(art.id).then(blob => {
        if (!blob) throw Error('This asset’s artwork is not on this device.');
        return URL.createObjectURL(blob);
      }));
      urlCache.get(art.id).catch(() => urlCache.delete(art.id));
    }
    return urlCache.get(art.id);
  }

  // Reads a PNG the author picked: its size, and whether any pixel is transparent
  // (a hint only — the art is never changed).
  function inspectFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\/png$/i.test(file.type || '') && !/\.png$/i.test(file.name || '')) {
        reject(Error('Choose a PNG file (with a transparent background).'));
        return;
      }
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        let transparent = false;
        try {
          const c = document.createElement('canvas');
          const w = Math.min(256, image.naturalWidth), h = Math.min(256, image.naturalHeight);
          c.width = w; c.height = h;
          const cx = c.getContext('2d', { willReadFrequently: true });
          cx.drawImage(image, 0, 0, w, h);
          const data = cx.getImageData(0, 0, w, h).data;
          for (let i = 3; i < data.length; i += 4) if (data[i] < 250) { transparent = true; break; }
        } catch (_) { transparent = true; }
        URL.revokeObjectURL(url);
        resolve({ width: image.naturalWidth, height: image.naturalHeight, bytes: file.size, name: file.name, transparent });
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(Error('That file could not be read as an image.')); };
      image.src = url;
    });
  }

  // Storage keys (other than the asset setup stores) that mention this asset:
  // a placed copy anywhere means it is in use.
  const SETUP_KEYS = ['sidescroll.asset-behaviours.v1', 'sidescroll.asset-collisions.v1', 'sidescroll.asset-layout.v1',
    'sidescroll.asset-mechanisms.v3', 'sidescroll.asset-sockets.v1', 'sidescroll.asset-states.v1', 'sidescroll.asset-climb-paths.v1'];
  function usedIn(name) {
    const found = [];
    const keys = new Set();
    for (let i = 0; i < localStorage.length; i++) keys.add(localStorage.key(i));
    // Built-in content counts too (project-defaults answers getItem for it).
    for (const k of Object.keys(window.SIDESCROLL_PROJECT_DEFAULTS?.storage || {})) keys.add(k);
    for (const key of keys) {
      if (!key || !key.startsWith('sidescroll.') || key === KEY || SETUP_KEYS.includes(key)) continue;
      const value = localStorage.getItem(key);
      if (value && value.includes(name)) found.push(key);
    }
    return found;
  }
  // New art with a different shape: every placed copy (scene, puzzles, world groups,
  // templates…) keeps its height and takes the new width. Widths are metres, so a
  // copy's sx / baseSx / width and its collision half-width scale by `factor`
  // (new aspect ÷ old aspect). Returns how many copies changed.
  function rescalePlaced(name, factor) {
    if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.002) return 0;
    let count = 0;
    const scale = node => {
      if (Array.isArray(node)) { node.forEach(scale); return; }
      if (!node || typeof node !== 'object') return;
      if (node.assetName === name || node.asset === name) {
        let changed = false;
        for (const k of ['sx', 'baseSx', 'width']) if (typeof node[k] === 'number' && Number.isFinite(node[k])) { node[k] *= factor; changed = true; }
        if (node.collision && typeof node.collision.halfWidth === 'number') node.collision.halfWidth *= factor;
        if (changed) count++;
      }
      for (const value of Object.values(node)) if (value && typeof value === 'object') scale(value);
    };
    for (const key of usedIn(name)) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        const before = count;
        scale(value);
        if (count !== before) localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    }
    return count;
  }

  // Removes this asset's setup (height, collision, behaviours…) from Asset Lab's stores.
  function removeSetup(name) {
    for (const key of SETUP_KEYS) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, name)) {
          delete value[name];
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (_) {}
    }
  }

  window.SideScrollAssetLibrary = {
    KEY, list, get, add, update, remove, isImportedName, aspect,
    putArt, getArt, deleteArt, artUrl, inspectFile, usedIn, removeSetup, rescalePlaced
  };
})();
