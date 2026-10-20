/* SideScroll v1.0.202 — read-only project snapshot / data coverage audit.
 * No local or remote writes, no restore, no Cache Storage purge.
 * Storage on GitHub Pages is ORIGIN-scoped, not repository-path-scoped.
 */
(() => {
  'use strict';

  const SCHEMA = 'sidescroll.project-snapshot.v1';
  const APP_VERSION = '1.0.205';
  const RELATED_EXACT_KEYS = new Set([
    'gameHubProgress',
    'gamehub.sidescroll.scene.v2',
    'gamehub.walklab.character.v1',
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

  // v203 — Match the existing World/Anim/Design Lab one-tap file-export flow.
  // Prepare the actual JSON file *before* the tap so navigator.share() can be
  // invoked synchronously from the user's click. Do not send a text/title
  // payload: on some iOS share targets that produces a tiny text(3).txt
  // containing the title instead of the JSON attachment.
  const $ = id => document.getElementById(id);
  const exportButton = $('snapshot-export');
  const download = $('snapshot-download');
  const status = $('snapshot-status');
  let preparedFile = null;
  let downloadURL = null;
  let preparing = null;

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

  async function prepareExport() {
    if (preparing) return preparing;
    if (exportButton) exportButton.disabled = true;
    preparedFile = null;
    if (download) download.hidden = true;
    setStatus('Preparing project data…');
    preparing = (async () => {
      try {
        const snapshot = await buildSnapshot();
        if (snapshot.manifest.localStorage.status !== 'captured') {
          setStatus('Cannot read saved project data on this device.', 'error');
          return;
        }
        const total = snapshot.manifest.localStorage.keysCaptured
          + snapshot.manifest.sessionStorage.keysCaptured;
        if (!total) {
          setStatus('No saved SideScroll data found in this browser. Nothing exported.', 'error');
          return;
        }
        const contents = JSON.stringify(snapshot, null, 2) + '\n';
        // Validate the real payload before offering it to the iOS Share Sheet.
        if (JSON.parse(contents).schema !== SCHEMA) {
          throw new Error('Project data failed validation.');
        }
        const filename = `SS-PROJECT-SNAPSHOT-${snapshot.exportedAt.replace(/[:.]/g, '-')}.json`;
        preparedFile = new File([contents], filename, { type: 'application/json' });
        if (!preparedFile.size || preparedFile.size < 100) {
          throw new Error('Export file is empty.');
        }
        if (exportButton) exportButton.disabled = false;
        setStatus(`Ready · ${total} saved items · ${formatBytes(preparedFile.size)}`, 'success');
      } catch (error) {
        setStatus(`Couldn't prepare export: ${String(error?.message || error)}`, 'error');
      } finally {
        preparing = null;
      }
    })();
    return preparing;
  }

  function showDownloadLink(autoStart) {
    if (!preparedFile || !download) return;
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = URL.createObjectURL(preparedFile);
    download.href = downloadURL;
    download.download = preparedFile.name;
    download.hidden = false;
    if (autoStart) download.click();
  }

  function exportOnTap() {
    if (!preparedFile) {
      setStatus('Project data is not ready yet. Try again in a moment.', 'error');
      return;
    }

    // This call must be made directly in the tap handler — NOT after an
    // awaited snapshot, hash operation, IndexedDB query or simulated click.
    try {
      if (typeof navigator.share === 'function'
          && typeof navigator.canShare === 'function'
          && navigator.canShare({ files: [preparedFile] })) {
        const promise = navigator.share({ files: [preparedFile] });
        Promise.resolve(promise).then(() => {
          setStatus(`Project JSON shared (${formatBytes(preparedFile.size)}).`, 'success');
        }).catch(error => {
          if (error?.name === 'AbortError') {
            setStatus('Export cancelled. Tap Export Project to try again.');
            return;
          }
          showDownloadLink(false);
          setStatus('Sharing was unavailable. Tap Download JSON instead.', 'error');
        });
        return;
      }
    } catch (_) {
      // Use a standard JSON file download when Web Share is unavailable.
    }
    showDownloadLink(true);
    setStatus('JSON export requested. If it did not save, tap Download JSON.', 'success');
  }

  if (exportButton) exportButton.addEventListener('click', exportOnTap);
  // One click in the same iPhone share flow as the existing Lab exports.
  // No Share title/text, preview controls, clipboard copying or editable text.
  prepareExport();

  window.SideScrollProjectSnapshot = Object.freeze({
    buildSnapshot, isProjectKey, categoryFor, prepareExport
  });
})();
