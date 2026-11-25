/* Character Lab · Animation manager (25 Nov 2026). One window listing every
 * animation in the project, for one body type at a time (two-legged /
 * four-legged):
 *  - Library: the shared animations (animation-templates.js), who uses each and
 *    for which action; Rename, Remove (when no one uses it), Give to the open
 *    character.
 *  - By character: each character's animations — shared from the library
 *    (linked), its own (perhaps started from a library one), or its own — with
 *    the actions that play them; Open, Rename, Add to library.
 * Opened from Animate → Manage animations… and Settings. All data and changes
 * go through window.AnimLabCore (walk-lab.js); changes are saved straight away.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  if (!core?.animationManagerData) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'animlab-anim-manager';
  dialog.setAttribute('aria-label', 'Animation manager');
  dialog.innerHTML = `
    <div class="animlab-anim-manager-head">
      <strong>Animations</strong>
      <div class="animlab-segmented animlab-two" data-am-family>
        <button type="button" data-family="biped">Two-legged</button>
        <button type="button" data-family="quadruped">Four-legged</button>
      </div>
      <button type="button" class="animlab-library-action" data-am-close>Close</button>
    </div>
    <div class="animlab-segmented animlab-two animlab-anim-manager-tabs" data-am-tabs>
      <button type="button" data-tab="library">Library (shared)</button>
      <button type="button" data-tab="characters">By character</button>
    </div>
    <p class="animlab-setup-note" data-am-note></p>
    <div class="animlab-anim-manager-body" data-am-body></div>`;
  document.body.appendChild(dialog);
  const body = dialog.querySelector('[data-am-body]'), note = dialog.querySelector('[data-am-note]');
  let tab = 'library', family = null;

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (text, data, disabled = false, title = '') => {
    const b = el('button', 'animlab-library-action', text); b.type = 'button';
    Object.assign(b.dataset, data); b.disabled = !!disabled; if (title) b.title = title; return b;
  };
  const usesText = users => users.length
    ? users.map(u => `${u.character}${u.slots.length ? ` (${u.slots.join(', ')})` : ''}`).join(' · ')
    : 'Not used by any character';

  function render() {
    const data = core.animationManagerData(), st = core.getState();
    family ||= st.family || 'biped';
    dialog.querySelectorAll('[data-family]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.family === family)));
    dialog.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    const open = data.characters.find(c => c.current);
    body.replaceChildren();
    if (tab === 'library') {
      const items = data.library.filter(t => t.family === family);
      note.textContent = `Shared animations for ${family === 'quadruped' ? 'four' : 'two'}-legged characters. Pick one from any action menu in Animate to use it (linked: improving it can update everyone). Add your own with “Add to library”.`;
      if (!items.length) body.append(el('p', 'animlab-setup-note', 'Nothing in the library yet.'));
      for (const t of items) {
        const row = el('div', 'animlab-anim-manager-row');
        const text = el('div', 'animlab-anim-manager-text');
        const title = el('strong', null, t.name);
        if (t.builtIn) title.append(el('small', 'animlab-anim-manager-badge', 'built in'));
        text.append(title, el('span', null, usesText(t.users)));
        const actions = el('div', 'animlab-anim-manager-actions');
        const has = open && t.users.some(u => u.characterId === open.id);
        if (open && open.family === family) actions.append(btn(has ? `${open.name} has it` : `Give to ${open.name}`, {amGive:t.id}, has || data.dirty,
          data.dirty ? 'Save or discard your key edits first' : ''));
        actions.append(btn('Rename', {amRenameLib:t.id}),
          btn('Remove', {amRemoveLib:t.id}, !t.removable, t.builtIn ? 'Built-in animations always stay' : t.users.length ? 'Still used by a character' : ''));
        row.append(text, actions);
        body.append(row);
      }
      return;
    }
    note.textContent = '⧉ shared from the library (linked) · own: this character’s alone. Open takes you to it in Animate.';
    for (const c of data.characters.filter(c => c.family === family)) {
      const head = el('div', 'animlab-anim-manager-character', c.name);
      if (c.current) head.append(el('small', 'animlab-anim-manager-badge', 'open'));
      body.append(head);
      for (const a of c.animations) {
        const row = el('div', 'animlab-anim-manager-row');
        const text = el('div', 'animlab-anim-manager-text');
        const status = a.status === 'linked' ? `⧉ Library: ${a.library.name}` : a.status === 'started' ? `Own · started from ${a.library.name}` : 'Own';
        text.append(el('strong', null, a.name), el('span', null, `${status} · ${a.slots.length ? `plays for ${a.slots.join(', ')}` : 'not used by an action'}`));
        const actions = el('div', 'animlab-anim-manager-actions');
        actions.append(btn('Open', {amOpen:`${c.id}|${a.key}`}), btn('Rename', {amRename:`${c.id}|${a.key}`}));
        if (a.status !== 'linked') actions.append(btn('Add to library', {amAddLib:`${c.id}|${a.key}`}, c.current && data.dirty, c.current && data.dirty ? 'Save or discard your key edits first' : ''));
        row.append(text, actions);
        body.append(row);
      }
    }
  }

  const split = v => { const i = v.indexOf('|'); return [v.slice(0, i), v.slice(i + 1)]; };
  dialog.addEventListener('click', event => {
    const t = event.target.closest('button');
    if (!t) { if (event.target === dialog) dialog.close(); return; }
    const d = t.dataset, data = core.animationManagerData();
    if ('amClose' in d) { dialog.close(); return; }
    if (d.family) family = d.family;
    if (d.tab) tab = d.tab;
    if (d.amGive) core.addLibraryAnimation(d.amGive);
    if (d.amRenameLib) {
      const lib = data.library.find(x => x.id === d.amRenameLib);
      const name = window.prompt('Name in the library:', lib?.name || '');
      if (name !== null) core.renameLibraryAnimation(d.amRenameLib, name);
    }
    if (d.amRemoveLib) {
      const lib = data.library.find(x => x.id === d.amRemoveLib);
      if (window.confirm(`Remove ${lib?.name || 'this animation'} from the library? Characters keep their own animations.`)) core.removeLibraryAnimation(d.amRemoveLib);
    }
    if (d.amRename) {
      const [cid, key] = split(d.amRename), a = data.characters.find(c => c.id === cid)?.animations.find(x => x.key === key);
      const name = window.prompt('Animation name:', a?.name || '');
      if (name !== null) core.renameCharacterAnimation(cid, key, name);
    }
    if (d.amAddLib) {
      const [cid, key] = split(d.amAddLib), a = data.characters.find(c => c.id === cid)?.animations.find(x => x.key === key);
      const name = window.prompt('Name in the library:', a?.name || '');
      if (name && name.trim()) core.addAnimationToLibrary(cid, key, name.trim());
    }
    if (d.amOpen) { const [cid, key] = split(d.amOpen); dialog.close(); core.openAnimation(cid, key); return; }
    render();
  });
  core.subscribe(() => { if (dialog.open) render(); });

  window.AnimLabAnimationManager = Object.freeze({
    open(options = {}) { if (options.tab) tab = options.tab; family = null; render(); if (!dialog.open) dialog.showModal(); },
    close() { dialog.close(); }
  });
})();
