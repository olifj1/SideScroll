/* SideScroll character packages.
 * One file per character, or one file with every character, holding everything
 * needed to:
 *   - Replace: restore a character exactly as it was when exported (rollback,
 *     or update with a newer version). Stored as the raw saved pieces ("slices").
 *   - Add as copy: start a new character from it, with its own ID ("copy").
 * Imported artwork (PNG pixels in IndexedDB) travels inside the file. Art that
 * ships with the game is referenced, not copied.
 * Built-in characters (Hero 1, Hero 2, Fox) and library characters use the same
 * format. Hero 1 and Hero 2 share one animation set and collider in storage, so
 * each hero's package carries those shared pieces.
 */
(() => {
  'use strict';
  const PACKAGE_SCHEMA = 'sidescroll.character-package.v1';
  const COLLECTION_SCHEMA = 'sidescroll.character-collection.v1';
  const OLD_CHARACTER_SCHEMA = 'animlab.character-handoff.v1';
  const KEY = Object.freeze({
    library: 'sidescroll.animlab.character-library.v1',
    atlas: 'sidescroll.animlab.atlas-docs.v1',
    setup: 'sidescroll.animlab.setup.v1',
    sparse: 'sidescroll.animlab.sparse.clips.v1',
    staticRef: 'sidescroll.animlab.static-reference.v1',
    motionRef: 'sidescroll.animlab.reference.settings.v1',
    registry: 'sidescroll.characters.registry.v1'
  });
  const EMPTY = Object.freeze({
    [KEY.library]: () => ({ schema: 'animlab.character-library.v1', entries: [] }),
    [KEY.atlas]: () => ({ schema: 'animlab.atlas-map.v1', characters: {} }),
    [KEY.setup]: () => ({}),
    [KEY.sparse]: () => ({ schema: 'animlab.sparse.v1', sampleCount: 16, families: {} }),
    [KEY.staticRef]: () => ({ schema: 'animlab.static-reference.v1', contexts: {} }),
    [KEY.motionRef]: () => ({ schema: 'animlab.reference.settings.v1', contexts: {} }),
    [KEY.registry]: () => ({ schema: 'sidescroll.character-registry.v1', characters: {} })
  });
  const BUILT_IN = Object.freeze({
    original: { name: 'Hero 1', family: 'human' },
    alternate: { name: 'Hero 2', family: 'human' },
    fox: { name: 'Fox', family: 'fox' }
  });
  // Whole storage keys owned by a built-in rig family.
  const FAMILY_KEYS = Object.freeze({
    human: ['gamehub.walklab.anim.v6', 'gamehub.walklab.anim.v5', 'gamehub.walklab.anim.v4', 'sidescroll.walklab.collider.v1'],
    fox: ['sidescroll.animlab.fox.clips.v1', 'sidescroll.fox.rig.v3', 'sidescroll.fox.rig.v2', 'sidescroll.fox.rig.baseline-id',
      'sidescroll.fox.collider.v1', 'sidescroll.fox.collider.baseline-id']
  });
  const USER_ID = /^user-[a-z0-9-]{5,40}$/;
  const IMAGE_ID = /^image-[a-z0-9-]{4,60}$/;
  const MAX_LIBRARY = 24;
  const DB_NAME = 'sidescroll-animlab-art-v1';
  const DB_STORE = 'atlas-images';

  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const has = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const isBuiltIn = id => has(BUILT_IN, id);
  const newId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function libraryEntries() {
    const lib = readJSON(KEY.library);
    return Array.isArray(lib?.entries) ? lib.entries : [];
  }

  // ---- IndexedDB artwork --------------------------------------------------
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Image database unavailable'));
    });
  }
  async function withStore(mode, work) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, mode);
        const request = work(tx.objectStore(DB_STORE));
        tx.oncomplete = () => resolve(request.result ?? null);
        tx.onerror = () => reject(tx.error || Error('Image database error'));
        tx.onabort = () => reject(tx.error || Error('Image database cancelled'));
      });
    } finally { db.close(); }
  }
  const getImage = key => withStore('readonly', store => store.get(key));
  const putImage = (key, blob) => withStore('readwrite', store => store.put(blob, key));
  const blobToDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || Error('Artwork could not be read'));
    reader.readAsDataURL(blob);
  });
  async function dataUrlToBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
  }

  // ---- Listing --------------------------------------------------------------
  // Names, order and deletions come from the character registry when present.
  function listCharacters() {
    const registry = window.SideScrollCharacters;
    if (registry) return registry.list().map(c => ({ id: c.id, name: c.name, family: c.family, builtIn: !c.library }));
    return [
      ...Object.entries(BUILT_IN).map(([id, c]) => ({ id, name: c.name, family: c.family, builtIn: true })),
      ...libraryEntries().filter(e => USER_ID.test(e?.id)).map(e => ({ id: e.id, name: String(e.name || e.id), family: e.family === 'fox' ? 'fox' : 'human', builtIn: false }))
    ];
  }
  const findCharacter = id => listCharacters().find(c => c.id === id) || null;

  // ---- Export ----------------------------------------------------------------
  // A slice is one saved piece: a whole key (path null), a value inside a key
  // (path), a library entry, or every context whose name starts with a prefix.
  function sliceAt(key, path) {
    const root = readJSON(key);
    let node = root;
    for (const part of path) {
      if (!has(node, part)) return { key, path, present: false };
      node = node[part];
    }
    return { key, path, present: true, value: clone(node) };
  }
  function wholeKey(key) {
    const value = localStorage.getItem(key);
    return value === null ? { key, path: null, present: false } : { key, path: null, present: true, value };
  }
  function contextPrefix(key, prefix) {
    const contexts = readJSON(key)?.contexts || {};
    const value = {};
    for (const [name, ctx] of Object.entries(contexts)) if (name.startsWith(prefix)) value[name] = ctx;
    return { key, prefix, value: clone(value) };
  }

  function slicesFor(character) {
    const { id, family, builtIn } = character;
    const slices = [];
    if (builtIn) {
      slices.push(sliceAt(KEY.setup, [id]));
      slices.push(sliceAt(KEY.sparse, ['families', family]));
      if (family === 'fox') slices.push(sliceAt(KEY.sparse, ['foxBaselineId']));
      for (const key of FAMILY_KEYS[family]) slices.push(wholeKey(key));
    } else {
      const entry = libraryEntries().find(e => e.id === id);
      slices.push({ key: KEY.library, entry: id, present: !!entry, value: clone(entry) });
    }
    slices.push(sliceAt(KEY.atlas, ['characters', id]));
    slices.push(sliceAt(KEY.staticRef, ['contexts', id]));
    slices.push(sliceAt(KEY.staticRef, ['contexts', `character:${id}`]));
    slices.push(contextPrefix(KEY.motionRef, `${id}|`));
    slices.push(sliceAt(KEY.registry, ['characters', id]));
    return slices;
  }

  async function artworkFor(slices) {
    const artwork = {};
    const atlas = slices.find(s => s.key === KEY.atlas)?.value?.atlas;
    if (atlas?.kind === 'indexeddb' && IMAGE_ID.test(String(atlas.id))) {
      const blob = await getImage(atlas.id);
      if (!blob) throw Error(`The artwork for this character is missing on this device (${atlas.name || atlas.id}).`);
      artwork[atlas.id] = { name: String(atlas.name || ''), type: blob.type || 'image/png', dataUrl: await blobToDataUrl(blob) };
    }
    return artwork;
  }

  async function exportCharacter(id, copySource) {
    const character = findCharacter(id);
    if (!character) throw Error('Unknown character.');
    const slices = slicesFor(character);
    return {
      schema: PACKAGE_SCHEMA,
      app: 'SideScroll',
      exportedAt: new Date().toISOString(),
      character: { id: character.id, name: character.name, family: character.family, builtIn: character.builtIn,
        sharedWith: character.family === 'human' && character.builtIn ? Object.keys(BUILT_IN).filter(k => k !== id && BUILT_IN[k].family === 'human') : [] },
      slices,
      copy: copySource ? clone(copySource(id)) : null,
      artwork: await artworkFor(slices)
    };
  }

  async function exportAll(copySource) {
    const characters = [];
    for (const c of listCharacters()) characters.push(await exportCharacter(c.id, copySource));
    return { schema: COLLECTION_SCHEMA, app: 'SideScroll', exportedAt: new Date().toISOString(), characters };
  }

  // ---- Reading a file --------------------------------------------------------
  const BAD = message => { throw Error(message); };
  function validatePackage(p) {
    if (p?.schema !== PACKAGE_SCHEMA) BAD('Not a SideScroll character file.');
    const c = p.character || {};
    const builtIn = isBuiltIn(c.id);
    if (!builtIn && !USER_ID.test(String(c.id))) BAD('Character file has an invalid character ID.');
    const family = builtIn ? BUILT_IN[c.id].family : (c.family === 'fox' ? 'fox' : 'human');
    const allowedPaths = new Set([
      JSON.stringify([KEY.atlas, 'characters', c.id]),
      JSON.stringify([KEY.staticRef, 'contexts', c.id]),
      JSON.stringify([KEY.staticRef, 'contexts', `character:${c.id}`]),
      JSON.stringify([KEY.registry, 'characters', c.id])
    ]);
    if (builtIn) {
      allowedPaths.add(JSON.stringify([KEY.setup, c.id]));
      allowedPaths.add(JSON.stringify([KEY.sparse, 'families', family]));
      if (family === 'fox') allowedPaths.add(JSON.stringify([KEY.sparse, 'foxBaselineId']));
    }
    for (const s of Array.isArray(p.slices) ? p.slices : BAD('Character file has no saved data.')) {
      if (s.entry !== undefined) {
        if (builtIn || s.key !== KEY.library || s.entry !== c.id) BAD('Character file contains data for another character.');
        if (s.present && (s.value?.id !== c.id || !s.value?.name)) BAD('Character file entry is damaged.');
      } else if (s.prefix !== undefined) {
        if (s.key !== KEY.motionRef || s.prefix !== `${c.id}|`) BAD('Character file contains data for another character.');
        if (Object.keys(s.value || {}).some(name => !name.startsWith(s.prefix))) BAD('Character file contains data for another character.');
      } else if (s.path === null) {
        if (!builtIn || !FAMILY_KEYS[family].includes(s.key)) BAD('Character file contains data it is not allowed to change.');
        if (s.present && typeof s.value !== 'string') BAD('Character file data is damaged.');
      } else if (!Array.isArray(s.path) || !allowedPaths.has(JSON.stringify([s.key, ...s.path]))) {
        BAD('Character file contains data for another character.');
      }
    }
    for (const [key, art] of Object.entries(p.artwork || {})) {
      if (!IMAGE_ID.test(key) || !/^data:image\/png;base64,/.test(String(art?.dataUrl))) BAD('Character file artwork is damaged.');
    }
    return { pkg: p, id: c.id, name: String(c.name || c.id), family, builtIn, replaceable: true,
      sharedWith: Array.isArray(c.sharedWith) ? c.sharedWith.filter(isBuiltIn) : [] };
  }
  // Files exported before character packages existed: custom characters only,
  // no artwork. They can only be added as a copy.
  function fromOldCharacterFile(doc) {
    const entry = doc.character || {};
    if (!entry.name || !entry.setup || !entry.sparseClips) BAD('This older character file is incomplete.');
    return { pkg: { copy: { name: entry.name, starter: entry.starter, setup: entry.setup, sparseClips: entry.sparseClips,
      legacyAtlasSource: entry.legacyAtlasSource || null }, artwork: {}, slices: [] },
      id: String(entry.id || ''), name: String(entry.name), family: entry.starter === 'fox' ? 'fox' : 'human',
      builtIn: false, replaceable: false, sharedWith: [], old: true };
  }

  // Returns [{id, name, family, builtIn, exists, replaceable, sharedWith, ...}]
  function readFile(json) {
    if (json?.schema === COLLECTION_SCHEMA) {
      if (!Array.isArray(json.characters) || !json.characters.length) BAD('This file contains no characters.');
      return json.characters.map(validatePackage).map(withExists);
    }
    if (json?.schema === PACKAGE_SCHEMA) return [withExists(validatePackage(json))];
    if (json?.schema === OLD_CHARACTER_SCHEMA) return [withExists(fromOldCharacterFile(json))];
    BAD('Not a SideScroll character file.');
  }
  function withExists(item) {
    return { ...item, exists: !!(item.id && findCharacter(item.id)) };
  }

  // ---- Applying an import ----------------------------------------------------
  function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function setPath(key, path, present, value) {
    // Removing something from a key the device doesn't have is a no-op; writing
    // an empty copy would stop later published updates reaching this device.
    if (!present && readJSON(key) === null) return;
    const root = readJSON(key) || EMPTY[key]();
    let node = root;
    for (const part of path.slice(0, -1)) {
      if (!node[part] || typeof node[part] !== 'object') node[part] = {};
      node = node[part];
    }
    const last = path[path.length - 1];
    if (present) node[last] = clone(value); else delete node[last];
    writeJSON(key, root);
  }
  function setLibraryEntry(id, present, value) {
    const root = readJSON(KEY.library) || EMPTY[KEY.library]();
    const entries = Array.isArray(root.entries) ? root.entries.filter(e => e?.id !== id) : [];
    if (present) {
      const index = (root.entries || []).findIndex(e => e?.id === id);
      if (index < 0 && entries.length >= MAX_LIBRARY) BAD(`The character library is full (${MAX_LIBRARY}).`);
      entries.splice(index < 0 ? entries.length : index, 0, clone(value));
    }
    root.entries = entries;
    writeJSON(KEY.library, root);
  }
  function setContextPrefix(key, prefix, value) {
    const root = readJSON(key) || EMPTY[key]();
    root.contexts = Object.fromEntries(Object.entries(root.contexts || {}).filter(([name]) => !name.startsWith(prefix)));
    Object.assign(root.contexts, clone(value || {}));
    writeJSON(key, root);
  }

  async function restoreArtwork(artwork, renames = {}) {
    for (const [key, art] of Object.entries(artwork || {})) {
      await putImage(renames[key] || key, await dataUrlToBlob(art.dataUrl));
    }
  }

  // Replace (or add with the same ID): write every slice back exactly.
  async function replaceCharacter(item) {
    await restoreArtwork(item.pkg.artwork);
    for (const s of item.pkg.slices) {
      if (s.entry !== undefined) setLibraryEntry(s.entry, s.present, s.value);
      else if (s.prefix !== undefined) setContextPrefix(s.key, s.prefix, s.value);
      else if (s.path === null) { if (s.present) localStorage.setItem(s.key, s.value); else localStorage.removeItem(s.key); }
      else setPath(s.key, s.path, s.present, s.value);
    }
  }

  // Add as copy: addLibraryCharacter (Character Lab core) validates the setup and
  // clips and creates the new entry; then the atlas, artwork and reference
  // alignment are copied across under the new ID.
  async function copyCharacter(item, name, addLibraryCharacter) {
    const copy = item.pkg.copy;
    if (!copy) BAD(`${item.name} cannot be copied from this file.`);
    const id = addLibraryCharacter({ schema: OLD_CHARACTER_SCHEMA, character: { ...clone(copy), name } });
    if (!id) BAD(`Could not add ${name}. Save or discard edits first, or the library may be full.`);
    const atlas = item.pkg.slices.find(s => s.key === KEY.atlas && s.present)?.value;
    if (atlas) {
      const doc = clone(atlas), renames = {};
      if (doc.atlas?.kind === 'indexeddb' && item.pkg.artwork?.[doc.atlas.id]) {
        renames[doc.atlas.id] = newId('image');
        doc.atlas.id = renames[doc.atlas.id];
      }
      await restoreArtwork(Object.fromEntries(Object.entries(item.pkg.artwork || {}).filter(([k]) => renames[k])), renames);
      setPath(KEY.atlas, ['characters', id], true, doc);
    }
    const staticRef = item.pkg.slices.find(s => s.key === KEY.staticRef && s.present && s.path?.[1] === `character:${item.id}`)
      || item.pkg.slices.find(s => s.key === KEY.staticRef && s.present);
    if (staticRef) setPath(KEY.staticRef, ['contexts', `character:${id}`], true, staticRef.value);
    const motion = item.pkg.slices.find(s => s.prefix !== undefined)?.value || {};
    const renamed = Object.fromEntries(Object.entries(motion).map(([k, v]) => [`${id}|${k.slice(k.indexOf('|') + 1)}`, v]));
    if (Object.keys(renamed).length) setContextPrefix(KEY.motionRef, `${id}|`, renamed);
    return id;
  }

  // choices: [{item, action:'replace'|'add'|'copy'|'skip', name?}]
  async function applyImport(choices, addLibraryCharacter) {
    const done = [];
    // Copies go first: they are created through the Character Lab core, which
    // writes its in-memory library list. Raw replacements then read storage fresh.
    for (const c of choices.filter(c => c.action === 'copy')) {
      await copyCharacter(c.item, c.name || `${c.item.name} copy`, addLibraryCharacter);
      done.push(`${c.name || c.item.name + ' copy'} added`);
    }
    for (const c of choices.filter(c => c.action === 'replace' || c.action === 'add')) {
      if (!c.item.replaceable) BAD(`${c.item.name} can only be added as a copy from this file.`);
      await replaceCharacter(c.item);
      done.push(`${c.item.name} ${c.action === 'replace' ? 'replaced' : 'added'}`);
    }
    return done;
  }

  window.SideScrollCharacterPackages = Object.freeze({
    PACKAGE_SCHEMA, COLLECTION_SCHEMA,
    listCharacters, exportCharacter, exportAll, readFile, applyImport
  });
})();
