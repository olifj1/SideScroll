/* SideScroll v1.0.204 — scoped Lab data exports/imports.
 * Raw storage values are kept byte-for-byte: don't silently migrate or re-serialize
 * a saved character, puzzle, or asset when moving it between devices.
 * Scope is a strict allow-list; an imported file never writes outside its Lab.
 */
(() => {
  'use strict';
  const SCHEMA = 'sidescroll.lab-data.v1';
  const LABS = Object.freeze({
    puzzles: {
      label: 'Puzzle Lab',
      name: 'PUZZLES',
      owns: k => /^sidescroll\.puzzle[-.]/i.test(k) || /^sidescroll-puzzle-/i.test(k)
        || /^sidescroll\.world-group-/i.test(k) || /^sidescroll\.player\.puzzle-state\./i.test(k)
        || /^sidescroll\.player\.inventory\./i.test(k) || /^sidescroll\.inventory\./i.test(k)
        || /^sidescroll-player-hints-/i.test(k)
    },
    assets: {
      label: 'Asset Lab',
      name: 'ASSETS',
      owns: k => /^sidescroll\.asset[-.]/i.test(k)
    },
    characters: {
      label: 'Character Lab',
      name: 'CHARACTERS',
      owns: k => /^sidescroll\.animlab\./i.test(k) || /^sidescroll\.fox\./i.test(k)
        || /^sidescroll\.walklab\./i.test(k) || /^gamehub\.walklab\./i.test(k)
    }
  });
  const SECRET_KEY = /(?:password|passwd|private.?key|api.?key|api.?token|access.?token|refresh.?token|auth.?token|credential|bearer|secret)/i;
  const UTF8 = new TextEncoder();
  const size = value => UTF8.encode(value).byteLength;
  const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

  function capture(lab) {
    const desc = LABS[lab];
    if (!desc) throw new Error('Unknown Lab export scope.');
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !desc.owns(key) || SECRET_KEY.test(key)) continue;
      const value = localStorage.getItem(key);
      if (value === null) throw new Error(`Storage key disappeared: ${key}`);
      entries.push({ key, value, bytes: size(value) });
    }
    entries.sort((a,b) => a.key.localeCompare(b.key));
    return {
      schema: SCHEMA, app: 'SideScroll', lab, exportedAt: new Date().toISOString(),
      sourcePath: location.pathname,
      manifest: { entries: entries.length, bytes: entries.reduce((sum,entry) => sum + entry.bytes,0),
        binaryAssetsIncluded: false,
        note: 'Saved browser data, including current and legacy keys for this Lab. Bundled art, image files and unsaved edits are not included.' },
      entries
    };
  }

  function validate(data, expectedLab) {
    if (!data || data.schema !== SCHEMA || data.app !== 'SideScroll' || data.lab !== expectedLab || !Array.isArray(data.entries))
      throw new Error('This file is not an export for this Lab.');
    if (data.entries.length > 500 || data.entries.length === 0)
      throw new Error('The export contains no entries or an unexpectedly large number of entries.');
    const seen = new Set(), desc = LABS[expectedLab];
    let bytes = 0;
    for (const entry of data.entries) {
      if (!entry || typeof entry.key !== 'string' || typeof entry.value !== 'string' || !desc.owns(entry.key)
          || SECRET_KEY.test(entry.key) || seen.has(entry.key) || entry.key.length > 256)
        throw new Error('The file contains an invalid, duplicated or out-of-scope storage key.');
      const actualBytes = size(entry.value);
      if (!Number.isSafeInteger(entry.bytes) || entry.bytes !== actualBytes)
        throw new Error(`The saved data size does not match for ${entry.key}.`);
      seen.add(entry.key); bytes += actualBytes;
    }
    if (data.manifest && (data.manifest.entries !== data.entries.length || data.manifest.bytes !== bytes))
      throw new Error('The export manifest does not match the saved entries.');
    return data.entries;
  }

  async function exportLab(lab, setStatus) {
    const data = capture(lab);
    if (!data.entries.length) {
      setStatus('No saved data found for this Lab. Nothing was exported.');
      return;
    }
    const json = JSON.stringify(data, null, 2);
    const filename = `SS-LAB-${LABS[lab].name}-${stamp()}.json`;
    const file = new File([json], filename, { type: 'application/json' });
    // Call navigator.share synchronously within the button's original tap;
    // no async preflight/hash that would lose the iOS user gesture.
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(file), a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setStatus(`${data.entries.length} saved entries exported. Keep this file somewhere safe.`);
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus('Export failed. Please try again.');
    }
  }

  async function importLab(lab, file, setStatus) {
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { setStatus('File too large (16 MB limit).'); return; }
    let entries;
    try {
      entries = validate(JSON.parse(await file.text()), lab);
    } catch (error) { setStatus(`Import refused: ${error.message}`); return; }
    let replacing = 0, adding = 0, unchanged = 0;
    try {
      for (const entry of entries) {
        const existing = localStorage.getItem(entry.key);
        if (existing === entry.value) unchanged++;
        else if (existing === null) adding++;
        else replacing++;
      }
    } catch (error) { setStatus('Cannot read current data; import cancelled.'); return; }
    if (!adding && !replacing) { setStatus('All saved entries already match this file.'); return; }
    const approved = confirm(`Import ${LABS[lab].label} data from ${file.name}?\n\n` +
      `${adding} new entries, ${replacing} existing entries will be OVERWRITTEN, ${unchanged} unchanged.\n\n` +
      `Other Labs are untouched. Entries absent from this file are retained.\n` +
      `This can replace newer work. Keep an Export of your current data first.\n\nContinue?`);
    if (!approved) { setStatus('Import cancelled. Nothing changed.'); return; }
    const before = new Map();
    try {
      // Read every original value before writing anything; rollback all changes
      // if storage quota or a browser restriction interrupts the operation.
      for (const entry of entries) before.set(entry.key, localStorage.getItem(entry.key));
      for (const entry of entries) localStorage.setItem(entry.key, entry.value);
    } catch (error) {
      let rollbackOK = true;
      for (const [key,value] of before) {
        try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value); }
        catch (_) { rollbackOK = false; }
      }
      setStatus(rollbackOK ? 'Import failed. Previous entries restored.' : 'Import failed; automatic rollback incomplete. Keep your backup and avoid further edits.');
      return;
    }
    setStatus('Import successful. Reloading to apply the saved data…');
    setTimeout(() => location.reload(), 300);
  }

  function attach() {
    for (const section of document.querySelectorAll('[data-ss-lab]')) {
      const lab = section.dataset.ssLab;
      if (!LABS[lab]) continue;
      const exportButton = section.querySelector('[data-ss-export]');
      const importButton = section.querySelector('[data-ss-import]');
      const input = section.querySelector('[data-ss-import-file]');
      const status = section.querySelector('[data-ss-status]');
      const setStatus = message => { if (status) status.textContent = message; };
      exportButton?.addEventListener('click', () => {
        try { exportLab(lab,setStatus); } catch (error) { setStatus(`Export failed: ${error.message}`); }
      });
      importButton?.addEventListener('click', () => input?.click());
      input?.addEventListener('change', async () => {
        const file = input.files?.[0]; input.value = '';
        await importLab(lab,file,setStatus);
      });
    }
  }
  window.SideScrollLabData = { capture, validate, importLab };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
