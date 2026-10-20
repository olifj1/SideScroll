/* SideScroll v1.0.202 — read-only project snapshot / data coverage audit.
 * No local or remote writes, no restore, no Cache Storage purge.
 * Storage on GitHub Pages is ORIGIN-scoped, not repository-path-scoped.
 */
(() => {
  'use strict';

  const SCHEMA = 'sidescroll.project-snapshot.v1';
  const APP_VERSION = '1.0.202';
  const RELATED_EXACT_KEYS = new Set([
    'gameHubProgress',
    'ss-concept-lab-state-v1',
    'gamehub.walklab.anim.v4',
    'gamehub.walklab.anim.v5',
    'gamehub.walklab.anim.v6'
  ]);
  const SECRET_KEY = /(?:password|passwd|private.?key|api.?key|api.?token|access.?token|refresh.?token|auth.?token|credential|bearer|secret)/i;

  function isProjectKey(key) {
    return /^sidescroll(?:[.\-_]|$)/i.test(key)
      || RELATED_EXACT_KEYS.has(key)
      || /^gamehub\.walklab\.anim\.v\d+$/i.test(key);
  }

  function categoryFor(key) {
    const k = String(key).toLowerCase();
    if (/animlab|walklab|fox\.(?:rig|collider)|character/.test(k)) return 'Characters & Animations';
    if (/puzzle|group|inventory|collectib|player/.test(k)) return 'Puzzles & Gameplay';
    if (/asset[.\-_]|^sidescroll\.asset/.test(k)) return 'Assets';
    if (/design-doc|concept-lab/.test(k)) return 'Design & Concept';
    if (/world|scene|terrain|biome|camera|render/.test(k)) return 'World & Environment';
    return 'Settings & Other';
  }

  function utf8Size(text) {
    return new TextEncoder().encode(text).byteLength;
  }

  async function hashValue(value) {
    if (!globalThis.crypto || !crypto.subtle || !crypto.subtle.digest) return null;
    try {
      const bytes = new TextEncoder().encode(value);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      return Array.from(hash, n => n.toString(16).padStart(2, '0')).join('');
    } catch (_) { return null; }
  }

  async function snapshotStore(storage, storageName, errors, skipped) {
    const entries = [];
    let allKeys = [];
    try {
      const length = storage.length;
      for (let i = 0; i < length; i++) {
        const key = storage.key(i);
        if (typeof key === 'string') allKeys.push(key);
      }
      allKeys = [...new Set(allKeys)].sort((a, b) => a.localeCompare(b));
    } catch (error) {
      errors.push(`${storageName}: cannot enumerate keys (${String(error && error.message || error)}).`);
      return { status: 'error', entries, keysSeen: 0 };
    }

    for (const key of allKeys) {
      if (SECRET_KEY.test(key)) {
        skipped.push({ storage: storageName, key, reason: 'possible credential (never exported)' });
        continue;
      }
      if (!isProjectKey(key)) {
        skipped.push({ storage: storageName, key, reason: 'not identified as SideScroll data' });
        continue;
      }
      let value;
      try { value = storage.getItem(key); }
      catch (error) {
        errors.push(`${storageName}: could not read '${key}' (${String(error && error.message || error)}).`);
        continue;
      }
      if (value === null) {
        errors.push(`${storageName}: '${key}' disappeared during export.`);
        continue;
      }
      entries.push({
        key,
        category: categoryFor(key),
        value, // Preserve exact original string; don't parse, reformat or migrate it.
        bytes: utf8Size(value),
        sha256: await hashValue(value)
      });
    }
    return { status: 'captured', entries, keysSeen: allKeys.length };
  }

  // The current game does not call IndexedDB. List any databases present on
  // this origin without exporting unrelated data or inventing restore support.
  async function inspectIndexedDB() {
    if (!('indexedDB' in window) || typeof indexedDB.databases !== 'function') {
      return { status: 'not-enumerable', databases: [], note: 'Browser does not expose IndexedDB database enumeration.' };
    }
    try {
      const all = await indexedDB.databases();
      return {
        status: 'enumerated',
        databases: (all || []).filter(x => x && typeof x.name === 'string')
          .map(x => ({ name: x.name, version: x.version == null ? null : x.version })),
        note: 'Database names only; records are NOT included in this initial audit snapshot.'
      };
    } catch (error) {
      return { status: 'error', databases: [], note: String(error && error.message || error) };
    }
  }

  async function inspectCacheStorage() {
    if (!('caches' in window) || typeof caches.keys !== 'function') {
      return { status: 'unavailable', names: [] };
    }
    try {
      const all = await caches.keys();
      return { status: 'enumerated', names: all.filter(n => /^sidescroll[-.]/i.test(n)) };
    } catch (error) {
      return { status: 'error', names: [], note: String(error && error.message || error) };
    }
  }

  function groupSummary(...arrays) {
    const totals = Object.create(null);
    for (const entries of arrays) for (const entry of entries) {
      const total = totals[entry.category] || (totals[entry.category] = { keys: 0, bytes: 0 });
      total.keys++;
      total.bytes += entry.bytes;
    }
    return Object.fromEntries(Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)));
  }

  async function buildSnapshot() {
    const errors = [], skipped = [];
    let local, session;
    try { local = await snapshotStore(window.localStorage, 'localStorage', errors, skipped); }
    catch (error) {
      errors.push(`localStorage could not be accessed (${String(error && error.message || error)}).`);
      local = { status: 'error', entries: [], keysSeen: 0 };
    }
    try { session = await snapshotStore(window.sessionStorage, 'sessionStorage', errors, skipped); }
    catch (error) {
      errors.push(`sessionStorage could not be accessed (${String(error && error.message || error)}).`);
      session = { status: 'error', entries: [], keysSeen: 0 };
    }
    const [indexedDBInfo, cacheInfo] = await Promise.all([inspectIndexedDB(), inspectCacheStorage()]);
    const warnings = [
      'Read-only diagnostic snapshot, NOT a tested/restorable full backup.',
      'Save changes inside each Lab first. In-memory unsaved edits are not captured.',
      'Bundled game assets, offline caches, IndexedDB records and files outside browser storage are not included.',
      'Browser storage is origin-wide: unknown keys are listed by name but their values are excluded.'
    ];
    if (indexedDBInfo.databases.length) warnings.push(`${indexedDBInfo.databases.length} IndexedDB database(s) detected; records were NOT exported.`);
    if (indexedDBInfo.status !== 'enumerated') warnings.push('IndexedDB could not be fully enumerated in this browser.');
    if (errors.length) warnings.push('One or more storage reads failed; this export is incomplete.');
    return {
      schema: SCHEMA,
      app: 'SideScroll',
      snapshotToolVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      pagePath: location.pathname,
      manifest: {
        categories: groupSummary(local.entries, session.entries),
        localStorage: { status: local.status, keysSeen: local.keysSeen, keysCaptured: local.entries.length },
        sessionStorage: { status: session.status, keysSeen: session.keysSeen, keysCaptured: session.entries.length },
        skippedKeys: skipped, // Names/reasons only; no values for unrelated keys.
        errors,
        warnings,
        binaryAssetsIncluded: false,
        verifiedRestorable: false
      },
      storage: {
        localStorage: local.entries,
        sessionStorage: session.entries,
        indexedDB: indexedDBInfo,
        cacheStorage: cacheInfo
      }
    };
  }

  const $ = id => document.getElementById(id);
  const previewButton = $('snapshot-preview');
  const exportButton = $('snapshot-export');
  const download = $('snapshot-download');
  const shareButton = $('snapshot-share');
  const status = $('snapshot-status');
  const preview = $('snapshot-preview-panel');
  let currentURL = null, currentFile = null;

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  function setStatus(message, level = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.level = level;
  }

  function setBusy(busy) {
    if (previewButton) previewButton.disabled = busy;
    if (exportButton) exportButton.disabled = busy;
  }

  function renderPreview(data) {
    if (!preview) return;
    preview.replaceChildren();
    const count = data.manifest.localStorage.keysCaptured + data.manifest.sessionStorage.keysCaptured;
    const sum = [...data.storage.localStorage, ...data.storage.sessionStorage]
      .reduce((n, x) => n + x.bytes, 0);
    const info = document.createElement('p');
    info.className = 'snapshot-totals';
    info.textContent = `${count} SideScroll storage entries · ${formatBytes(sum)} of stored values`;
    preview.appendChild(info);
    const list = document.createElement('ul');
    list.className = 'snapshot-categories';
    for (const [category, item] of Object.entries(data.manifest.categories)) {
      const row = document.createElement('li');
      row.textContent = `${category}: ${item.keys} keys (${formatBytes(item.bytes)})`;
      list.appendChild(row);
    }
    preview.appendChild(list);
    const excluded = data.manifest.skippedKeys;
    const note = document.createElement('p');
    note.className = 'snapshot-note';
    note.textContent = `${excluded.length} same-origin keys excluded (unrelated or potentially sensitive).`;
    preview.appendChild(note);
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'View included and excluded key names';
    detail.appendChild(summary);
    const names = document.createElement('pre');
    names.textContent = [
      'Included localStorage:',
      ...data.storage.localStorage.map(x => `  ${x.key} (${formatBytes(x.bytes)})`),
      'Included sessionStorage:',
      ...data.storage.sessionStorage.map(x => `  ${x.key} (${formatBytes(x.bytes)})`),
      'Excluded (names only, no values):',
      ...excluded.map(x => `  ${x.storage}: ${x.key} — ${x.reason}`)
    ].join('\n');
    detail.appendChild(names);
    preview.appendChild(detail);
    if (data.manifest.errors.length || data.storage.indexedDB.databases.length) {
      const warn = document.createElement('p');
      warn.className = 'snapshot-warning';
      warn.textContent = `${data.manifest.errors.length} read error(s), ${data.storage.indexedDB.databases.length} IndexedDB database(s) detected but not backed up. See snapshot manifest.`;
      preview.appendChild(warn);
    }
    preview.hidden = false;
  }

  async function withSnapshot(save) {
    setBusy(true);
    setStatus('Reading SideScroll browser storage…');
    try {
      const data = await buildSnapshot();
      renderPreview(data);
      if (data.manifest.localStorage.status !== 'captured') {
        setStatus('Local storage could not be read. Snapshot not created.', 'error');
        return;
      }
      if (!save) {
        setStatus('Preview ready. This did not alter your game data.', 'success');
        return;
      }
      const json = JSON.stringify(data, null, 2) + '\n';
      const filename = `SS-PROJECT-SNAPSHOT-${data.exportedAt.replace(/[:.]/g, '-').replace('Z', 'Z')}.json`;
      const file = new File([json], filename, { type: 'application/json' });
      const url = URL.createObjectURL(file);
      if (currentURL) URL.revokeObjectURL(currentURL);
      currentURL = url;
      currentFile = file;
      download.href = url;
      download.download = filename;
      download.hidden = false;
      if (shareButton && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        try { shareButton.hidden = !navigator.canShare({ files: [file] }); }
        catch (_) { shareButton.hidden = true; }
      }
      // A visible link remains available when Safari/PWA blocks automatic downloads.
      download.click();
      setStatus(`Snapshot prepared (${formatBytes(file.size)}). Save it in Files/iCloud Drive and send it here for the audit.`, 'success');
    } catch (error) {
      setStatus(`Export failed: ${String(error && error.message || error)}`, 'error');
    } finally { setBusy(false); }
  }

  if (previewButton) previewButton.addEventListener('click', () => withSnapshot(false));
  if (exportButton) exportButton.addEventListener('click', () => withSnapshot(true));
  if (shareButton) shareButton.addEventListener('click', async () => {
    if (!currentFile || typeof navigator.share !== 'function') return;
    try { await navigator.share({ files: [currentFile], title: 'SideScroll Project Snapshot' }); }
    catch (error) { if (error && error.name !== 'AbortError') setStatus('Sharing failed. Use the Download link instead.', 'error'); }
  });
  window.SideScrollProjectSnapshot = Object.freeze({ buildSnapshot, isProjectKey, categoryFor });
})();
