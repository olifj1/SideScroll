/* SideScroll v1.0.205 — safe, opt-in global project snapshot restore.
 * A Project Snapshot is an origin-scoped *data* file, not an art/game-build ZIP.
 * No stored value is touched until file validation, review, a safety export,
 * explicit acknowledgement, a final recheck, and a destructive confirmation.
 */
(() => {
  'use strict';
  const snap = window.SideScrollProjectSnapshot;
  if (!snap) return;
  const SCHEMA = 'sidescroll.project-snapshot.v1';
  const MAX_FILE_BYTES = 32 * 1024 * 1024;
  const MAX_ENTRIES = 1000;
  const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 24 * 1024 * 1024;
  const SECRET_KEY = /(?:password|passwd|private.?key|api.?key|api.?token|access.?token|refresh.?token|auth.?token|credential|bearer|secret)/i;
  const enc = new TextEncoder();
  const $ = id => document.getElementById(id);
  const input = $('restore-file');
  const status = $('restore-status');
  const preview = $('restore-preview');
  const categoryList = $('restore-categories');
  const modeInputs = document.querySelectorAll('input[name="restore-mode"]');
  const sessionOpt = $('restore-session');
  const backupButton = $('restore-backup');
  const backupDownload = $('restore-backup-download');
  const backupSaved = $('restore-backup-saved');
  const commitButton = $('restore-apply');
  const countsEl = $('restore-counts');
  const notesEl = $('restore-notes');
  const sourceEl = $('restore-source');
  let fileData = null;
  let baseline = null;
  let backupFile = null;
  let backupURL = null;
  let approvedBackup = false;
  let running = false;
  let applied = false;

  const bytes = value => enc.encode(value).byteLength;
  const errorText = error => String(error?.message || error || 'Unexpected error');
  const fileDate = () => new Date().toISOString().replace(/[:.]/g, '-');
  function setStatus(message, level = '') {
    if (status) { status.textContent = message; status.dataset.level = level; }
  }
  function resetReview() {
    fileData = baseline = backupFile = null;
    approvedBackup = false;
    if (preview) preview.hidden = true;
    if (backupSaved) { backupSaved.checked = false; backupSaved.disabled = true; }
    if (backupButton) backupButton.disabled = true;
    if (commitButton) commitButton.disabled = true;
    if (backupDownload) { backupDownload.hidden = true; backupDownload.removeAttribute('href'); }
    if (backupURL) { URL.revokeObjectURL(backupURL); backupURL = null; }
    if (categoryList) categoryList.textContent = '';
  }
  function shareFile(file, fallback) {
    // File-only share must be invoked *within* the synchronous click handler
    // on iOS; no awaits preceding navigator.share().
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        return Promise.resolve(navigator.share({ files: [file] }));
      }
    } catch (_) { /* ordinary file download fallback */ }
    fallback(true);
    return Promise.resolve();
  }
  async function digest(text) {
    if (!globalThis.crypto?.subtle?.digest) throw new Error('Secure SHA-256 validation is unavailable. Open the game via HTTPS.');
    const raw = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(raw), x => x.toString(16).padStart(2, '0')).join('');
  }
  async function validateFile(payload) {
    if (!payload || payload.schema !== SCHEMA || payload.app !== 'SideScroll')
      throw new Error('This is not a SideScroll Project Snapshot JSON.');
    if (!payload.storage || !payload.manifest || !Array.isArray(payload.storage.localStorage)
      || !Array.isArray(payload.storage.sessionStorage))
      throw new Error('The snapshot is missing saved storage records or its manifest.');
    if (payload.manifest.localStorage?.status !== 'captured'
      || payload.manifest.sessionStorage?.status !== 'captured'
      || (payload.manifest.errors || []).length)
      throw new Error('The snapshot recorded storage read errors. Use a complete export.');
    if (!Number.isFinite(Date.parse(payload.exportedAt))) throw new Error('Missing or invalid export timestamp.');
    if (typeof payload.origin !== 'string' || !/^https?:\/\//i.test(payload.origin))
      throw new Error('The export origin is missing or invalid.');
    const totals = new Map();
    const validated = [];
    const seen = new Set();
    let allBytes = 0;
    let withoutHashes = 0;
    for (const storageName of ['localStorage', 'sessionStorage']) {
      const sourceEntries = payload.storage[storageName];
      if (sourceEntries.length > MAX_ENTRIES) throw new Error('Snapshot contains too many storage entries.');
      if (payload.manifest[storageName].keysCaptured !== sourceEntries.length)
        throw new Error(`Manifest count does not match ${storageName}.`);
      for (const entry of sourceEntries) {
        if (!entry || typeof entry.key !== 'string' || typeof entry.value !== 'string'
          || entry.key.length > 256 || !snap.isProjectKey(entry.key) || SECRET_KEY.test(entry.key))
          throw new Error('Snapshot contains an invalid, unrelated or sensitive storage key.');
        const token = storageName + ':' + entry.key;
        if (seen.has(token)) throw new Error('Duplicate storage key in snapshot.');
        seen.add(token);
        const n = bytes(entry.value);
        if (n > MAX_ENTRY_BYTES || n !== entry.bytes || !Number.isSafeInteger(entry.bytes))
          throw new Error(`Invalid data size for ${entry.key}.`);
        allBytes += n;
        if (validated.length >= MAX_ENTRIES || allBytes > MAX_TOTAL_BYTES)
          throw new Error('Snapshot exceeds the safe restore size limit.');
        if (entry.sha256 == null) withoutHashes++;
        else {
          if (!/^[a-f\d]{64}$/i.test(entry.sha256) || await digest(entry.value) !== entry.sha256.toLowerCase())
            throw new Error(`Integrity check failed for ${entry.key}. The file may be damaged.`);
        }
        const category = snap.categoryFor(entry.key);
        const current = totals.get(category) || { keys: 0, bytes: 0 };
        current.keys++; current.bytes += n;
        totals.set(category, current);
        validated.push({ key: entry.key, value: entry.value, storageName, category });
      }
    }
    if (!validated.length) throw new Error('Snapshot contains no saved items.');
    const listed = payload.manifest.categories || {};
    const manifestCategories = Object.keys(listed).sort();
    const actualCategories = Array.from(totals.keys()).sort();
    if (JSON.stringify(manifestCategories) !== JSON.stringify(actualCategories)
      || actualCategories.some(k => listed[k]?.keys !== totals.get(k).keys || listed[k]?.bytes !== totals.get(k).bytes))
      throw new Error('The category manifest does not match the snapshot entries.');
    return { source: payload, entries: validated, categories: actualCategories, withoutHashes };
  }
  function captureCurrent() {
    const captured = new Map();
    for (const [name, store] of [['localStorage', localStorage], ['sessionStorage', sessionStorage]]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && snap.isProjectKey(key) && !SECRET_KEY.test(key)) {
          const value = store.getItem(key);
          if (value === null) throw new Error('Saved data changed while reading.');
          captured.set(`${name}:${key}`, value);
        }
      }
    }
    return captured;
  }
  function stateStillMatches(baselineState) {
    const now = captureCurrent();
    if (now.size !== baselineState.size) return false;
    for (const [key, value] of baselineState) if (now.get(key) !== value) return false;
    return true;
  }
  function options() {
    const chosen = new Set(Array.from(categoryList?.querySelectorAll('input[type="checkbox"]:checked') || [], el => el.value));
    const selectedMode = Array.from(modeInputs).find(el => el.checked)?.value || 'merge';
    return { chosen, mode: selectedMode, session: !!sessionOpt?.checked };
  }
  function planChanges(source = fileData, opts = options()) {
    const list = [];
    const counts = { newItems: 0, replaced: 0, same: 0, skipped: 0, selected: 0 };
    for (const entry of source.entries) {
      if (!opts.chosen.has(entry.category) || (entry.storageName === 'sessionStorage' && !opts.session)) {
        counts.skipped++; continue;
      }
      counts.selected++;
      const store = entry.storageName === 'localStorage' ? localStorage : sessionStorage;
      const current = store.getItem(entry.key);
      if (current === entry.value) counts.same++;
      else if (current === null) { counts.newItems++; list.push({ ...entry, before: null }); }
      else if (opts.mode === 'replace') { counts.replaced++; list.push({ ...entry, before: current }); }
      else counts.skipped++;
    }
    return { list, counts };
  }
  function refreshPlan() {
    if (!fileData || running || applied) return;
    try {
      const { counts } = planChanges();
      if (countsEl) countsEl.textContent = `${counts.newItems} new · ${counts.replaced} overwritten · ${counts.same} unchanged · ${counts.skipped} skipped`;
      if (notesEl) notesEl.textContent = options().mode === 'merge'
        ? 'Merge only adds missing keys. It does not replace your existing work.'
        : 'Restore replaces the selected keys from this file. Newer local changes may be lost. Extra local keys are retained.';
      if (commitButton) commitButton.disabled = !approvedBackup || !(counts.newItems + counts.replaced);
    } catch (error) {
      if (commitButton) commitButton.disabled = true;
      setStatus(`Cannot compare saved data: ${errorText(error)}`, 'error');
    }
  }
  function presentPreview(validated) {
    const data = validated.source;
    if (sourceEl) sourceEl.textContent = `${validated.entries.length} items · ${new Date(data.exportedAt).toLocaleString()} · ${data.origin}`;
    if (categoryList) {
      categoryList.textContent = '';
      for (const category of validated.categories) {
        const row = document.createElement('label');
        row.className = 'restore-category';
        const check = document.createElement('input'); check.type = 'checkbox'; check.checked = true; check.value = category;
        row.append(check, document.createTextNode(' ' + category));
        categoryList.appendChild(row);
      }
    }
    if (preview) preview.hidden = false;
    let warning = 'Preview only — no stored data has changed.';
    if (data.origin !== location.origin) warning += ' Different website origin: verify this is the correct SideScroll project.';
    if (validated.withoutHashes) warning += ` ${validated.withoutHashes} items have no SHA-256 and were checked by size only.`;
    setStatus(warning);
    refreshPlan();
  }
  async function pickFile(file) {
    if (!file || running || applied) return;
    resetReview();
    setStatus('Checking the snapshot and verifying its contents…');
    if (file.size > MAX_FILE_BYTES || !file.size) { setStatus('File is empty or too large (32 MB maximum).', 'error'); return; }
    try {
      const payload = JSON.parse(await file.text());
      const result = await validateFile(payload);
      // Pre-capture the complete *current* project, not just the entries we
      // might overwrite, so rollback/safety export includes all original work.
      const currentSnap = await snap.buildSnapshot();
      if (currentSnap.manifest.localStorage.status !== 'captured'
        || currentSnap.manifest.sessionStorage.status !== 'captured'
        || currentSnap.manifest.errors.length) throw new Error('Cannot make a complete safety backup of current data.');
      baseline = captureCurrent();
      backupFile = new File([JSON.stringify(currentSnap, null, 2) + '\n'],
        `SS-BEFORE-RESTORE-${fileDate()}.json`, { type: 'application/json' });
      if (backupButton) backupButton.disabled = false;
      fileData = result;
      presentPreview(result);
    } catch (error) {
      resetReview();
      setStatus(`Import refused: ${errorText(error)}`, 'error');
    }
  }
  function showBackupDownload(autoStart = false) {
    if (!backupFile || !backupDownload) return;
    if (backupURL) URL.revokeObjectURL(backupURL);
    backupURL = URL.createObjectURL(backupFile);
    backupDownload.href = backupURL;
    backupDownload.download = backupFile.name;
    backupDownload.hidden = false;
    if (autoStart) backupDownload.click();
  }
  function saveBackup() {
    if (!backupFile || running || applied) return;
    // A safety backup is NOT proof of being saved on device; require user
    // acknowledgement separately after Save to Files has succeeded.
    shareFile(backupFile, showBackupDownload).then(() => {
      if (backupSaved) backupSaved.disabled = false;
      setStatus('Save the pre-restore JSON to Files/iCloud, then tick the confirmation below.');
    }).catch(error => {
      if (error?.name === 'AbortError') setStatus('Backup sharing cancelled; save it before restoring.');
      else { showBackupDownload(false); if (backupSaved) backupSaved.disabled = false;
        setStatus('Could not share the backup. Use Download safety JSON and save it before restoring.', 'error'); }
    });
  }
  function acknowledgeBackup() {
    approvedBackup = !!backupSaved?.checked;
    refreshPlan();
  }
  function applyRestore() {
    if (!fileData || !backupFile || !baseline || !approvedBackup || running || applied) return;
    // All storage checks/writes here are synchronous, so no editor can change
    // the origin storage between the last comparison and writes on this page.
    running = true;
    if (commitButton) commitButton.disabled = true;
    const opts = options();
    try {
      if (!stateStillMatches(baseline)) {
        setStatus('Your saved data changed since the safety export. No changes made. Reload this page and restart the import.', 'error');
        approvedBackup = false; if (backupSaved) backupSaved.checked = false;
        return;
      }
      const { list, counts } = planChanges(fileData, opts);
      if (!list.length) { setStatus('Nothing needs restoring with these settings.'); return; }
      const answer = window.confirm(
        `Apply ${opts.mode === 'merge' ? 'MERGE' : 'RESTORE'} from this snapshot?\n\n` +
        `${counts.newItems} new saved entries.\n${counts.replaced} existing entries OVERWRITTEN.\n` +
        `${counts.same} unchanged. ${counts.skipped} skipped.\n\n` +
        `Entries missing from the snapshot are never deleted.\n` +
        `You confirmed saving the pre-restore backup. Continue?`
      );
      if (!answer) { setStatus('Restore cancelled. Nothing changed.'); return; }
      const written = [];
      try {
        for (const entry of list) {
          const store = entry.storageName === 'localStorage' ? localStorage : sessionStorage;
          store.setItem(entry.key, entry.value);
          written.push(entry);
          if (store.getItem(entry.key) !== entry.value)
            throw new Error(`Readback mismatch for ${entry.key}.`);
        }
      } catch (error) {
        let rollbackOK = true;
        for (const entry of written.reverse()) {
          const store = entry.storageName === 'localStorage' ? localStorage : sessionStorage;
          try { if (entry.before === null) store.removeItem(entry.key); else store.setItem(entry.key, entry.before); }
          catch (_) { rollbackOK = false; }
        }
        setStatus(rollbackOK
          ? `Restore failed (${errorText(error)}). Previous data was restored automatically.`
          : 'Restore interrupted. Automatic rollback was incomplete! Keep the safety JSON and do not edit until recovery.', 'error');
        return;
      }
      applied = true;
      if (input) input.disabled = true;
      if (backupButton) backupButton.disabled = true;
      if (backupSaved) backupSaved.disabled = true;
      if (categoryList) categoryList.querySelectorAll('input').forEach(el => { el.disabled = true; });
      modeInputs.forEach(el => { el.disabled = true; });
      if (sessionOpt) sessionOpt.disabled = true;
      setStatus(`Restored ${counts.newItems} new and ${counts.replaced} overwritten entries. Reload the game or Labs to use them. Keep both JSON files.`, 'success');
    } catch (error) {
      setStatus(`Restore cancelled without changes: ${errorText(error)}`, 'error');
    } finally { running = false; if (!applied) refreshPlan(); }
  }
  if (input) input.addEventListener('change', () => { const file = input.files?.[0]; input.value = ''; pickFile(file); });
  if (backupButton) backupButton.addEventListener('click', saveBackup);
  if (backupSaved) backupSaved.addEventListener('change', acknowledgeBackup);
  if (commitButton) commitButton.addEventListener('click', applyRestore);
  for (const el of modeInputs) el.addEventListener('change', refreshPlan);
  if (sessionOpt) sessionOpt.addEventListener('change', refreshPlan);
  categoryList?.addEventListener('change', refreshPlan);
  window.SideScrollProjectRestore = Object.freeze({ validateFile, captureCurrent, planChanges, stateStillMatches, pickFile });
})();
