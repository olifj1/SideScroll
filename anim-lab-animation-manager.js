/* Character Lab · Animation manager (25 Nov 2026). One window for every
 * animation in the project, one body type at a time (two-legged / four-legged):
 *  - Characters: each character with all its action slots and the animation in
 *    each; every slot has a menu of every animation it could play (the
 *    character's own, then the Library) to swap it on the spot, and Go to.
 *  - Animations: where animations are managed. Library (shared) animations:
 *    every character using each one (Go to, Make it <name>'s own), Rename,
 *    Duplicate, Delete (when unused, not built in). Characters' own animations:
 *    whose, what plays them; Go to, Rename, Duplicate, Add to library, Delete.
 * Opened from Animate → Manage animations… and Settings → Animations. All data
 * and changes go through window.AnimLabCore (walk-lab.js), saved straight away
 * (Go to asks Save / Discard first if the open animation has unsaved keys).
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
      <button type="button" data-tab="characters">Characters</button>
      <button type="button" data-tab="animations">Animations &amp; library</button>
    </div>
    <p class="animlab-setup-note" data-am-note></p>
    <div class="animlab-anim-manager-body" data-am-body></div>`;
  document.body.appendChild(dialog);
  const body = dialog.querySelector('[data-am-body]'), note = dialog.querySelector('[data-am-note]');
  let tab = 'characters', family = null;

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (text, data, disabled = false, title = '') => {
    const b = el('button', 'animlab-library-action', text); b.type = 'button';
    Object.assign(b.dataset, data); b.disabled = !!disabled; if (title) b.title = title; return b;
  };
  const option = (value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; return o; };
  const ref = (characterId, key) => `${characterId}|${key}`;
  const split = v => { const i = v.indexOf('|'); return [v.slice(0, i), v.slice(i + 1)]; };

  // ---- Characters: slots and the animation in each -----------------------------
  function slotSelect(c, slot) {
    const select = document.createElement('select');
    select.dataset.amSlot = ref(c.id, slot.id);
    select.setAttribute('aria-label', `${c.name}: animation for ${slot.name}`);
    if (!slot.builtIn || slot.optional) select.append(option('', slot.optional ? 'The game’s own climbing' : '— none —'));
    const own = document.createElement('optgroup'); own.label = `${c.name}’s animations`;
    for (const a of c.choices.own) own.append(option(a.key, a.library ? `${a.name} ⧉` : a.name));
    select.append(own);
    if (c.choices.library.length) {
      const lib = document.createElement('optgroup'); lib.label = 'Library (shared) — add';
      for (const t of c.choices.library) lib.append(option(`lib:${t.id}`, `${t.name} ⧉`));
      select.append(lib);
    }
    select.value = slot.animation || '';
    return select;
  }
  function renderCharacters(data) {
    note.textContent = 'Each character’s actions and the animation each plays. Pick from the menu to swap it: the character’s own animations, or one from the Library (⧉ shared — added to the character, linked).';
    for (const c of data.characters.filter(c => c.family === family)) {
      const card = el('section', 'animlab-anim-manager-card');
      const head = el('div', 'animlab-anim-manager-card-head');
      const name = el('strong', null, c.name);
      if (c.current) name.append(el('small', 'animlab-anim-manager-badge', 'open'));
      head.append(name);
      card.append(head);
      for (const slot of c.slots) {
        const row = el('div', 'animlab-anim-manager-slot');
        const label = el('span', 'animlab-anim-manager-slot-name', slot.name);
        if (!slot.hookedUp) label.append(el('small', null, 'not hooked up yet'));
        const current = c.animations.find(a => a.key === slot.animation);
        const status = el('span', 'animlab-anim-manager-status', !current ? '' : current.status === 'linked' ? '⧉ shared' : 'own');
        row.append(label, slotSelect(c, slot), status,
          btn('Go to', {amOpen:ref(c.id, slot.animation || '')}, !slot.animation, slot.animation ? `Open ${current?.name} in Animate` : 'Nothing to open'));
        card.append(row);
      }
      body.append(card);
    }
  }

  // ---- Animations & library: managing ------------------------------------------
  function renderAnimations(data) {
    note.textContent = '⧉ Library animations are shared: characters using one follow it (changing it can update them all). Own animations belong to one character.';
    const characters = data.characters.filter(c => c.family === family);
    const library = data.library.filter(t => t.family === family);
    body.append(el('div', 'animlab-anim-manager-section', 'Library (shared)'));
    if (!library.length) body.append(el('p', 'animlab-setup-note', 'Nothing in the library yet: use “Add to library” on an animation below.'));
    for (const t of library) {
      const card = el('section', 'animlab-anim-manager-card');
      const head = el('div', 'animlab-anim-manager-card-head');
      const name = el('strong', null, `⧉ ${t.name}`);
      if (t.builtIn) name.append(el('small', 'animlab-anim-manager-badge', 'built in'));
      const actions = el('div', 'animlab-anim-manager-actions');
      actions.append(btn('Rename', {amRenameLib:t.id}), btn('Duplicate', {amDupLib:t.id}),
        btn('Delete', {amRemoveLib:t.id}, !t.removable, t.builtIn ? 'Built-in animations always stay' : t.users.length ? 'Still used: make it each character’s own first' : ''));
      head.append(name, actions);
      card.append(head);
      if (!t.users.length) card.append(el('p', 'animlab-anim-manager-empty', 'Not used by any character.'));
      for (const u of t.users) {
        const row = el('div', 'animlab-anim-manager-user');
        row.append(el('span', null, `${u.character} · ${u.animation}${u.slots.length ? ` — plays for ${u.slots.join(', ')}` : ' — not used by an action'}`),
          btn('Go to', {amOpen:ref(u.characterId, u.key)}),
          btn(`Make it ${u.character}’s own`, {amOwn:ref(u.characterId, u.key)}, false, 'Stops following the library; changes then stay with this character'));
        card.append(row);
      }
      body.append(card);
    }
    body.append(el('div', 'animlab-anim-manager-section', 'Characters’ own animations'));
    for (const c of characters) {
      const own = c.animations.filter(a => a.status !== 'linked');
      if (!own.length) continue;
      for (const a of own) {
        const row = el('div', 'animlab-anim-manager-row');
        const text = el('div', 'animlab-anim-manager-text');
        text.append(el('strong', null, a.name),
          el('span', null, `${c.name}’s own${a.status === 'started' ? ` · started from ${a.library.name}` : ''} · ${a.slots.length ? `plays for ${a.slots.join(', ')}` : 'not used by an action'}`));
        const actions = el('div', 'animlab-anim-manager-actions');
        const blocked = c.current && data.dirty, why = blocked ? 'Save or discard your key edits first' : '';
        actions.append(btn('Go to', {amOpen:ref(c.id, a.key)}), btn('Rename', {amRename:ref(c.id, a.key)}),
          btn('Duplicate', {amDup:ref(c.id, a.key)}, blocked, why), btn('Add to library', {amAddLib:ref(c.id, a.key)}, blocked, why),
          btn('Delete', {amDelete:ref(c.id, a.key)}, !a.deletable || blocked,
            a.original ? 'A character’s built-in animations stay' : !a.deletable ? 'Played by Idle / Walk / Run / Jump / Climb: pick another there first' : why));
        row.append(text, actions);
        body.append(row);
      }
    }
  }

  function render() {
    const data = core.animationManagerData(), st = core.getState();
    family ||= st.family || 'biped';
    dialog.querySelectorAll('[data-family]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.family === family)));
    dialog.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    const scroll = body.scrollTop;
    body.replaceChildren();
    if (tab === 'characters') renderCharacters(data); else renderAnimations(data);
    body.scrollTop = scroll;
  }

  dialog.addEventListener('change', event => {
    const select = event.target.closest('select[data-am-slot]');
    if (!select) return;
    const [cid, slot] = split(select.dataset.amSlot);
    if (select.value.startsWith('lib:')) core.addLibraryAnimationFor(cid, select.value.slice(4), slot);
    else core.setSlotAnimationFor(cid, slot, select.value || null);
    render();
  });
  dialog.addEventListener('click', event => {
    const t = event.target.closest('button');
    if (!t) { if (event.target === dialog) dialog.close(); return; }
    const d = t.dataset, data = core.animationManagerData();
    const anim = v => { const [cid, key] = split(v); return {cid, key, a:data.characters.find(c => c.id === cid)?.animations.find(x => x.key === key)}; };
    if ('amClose' in d) { dialog.close(); return; }
    if (d.family) { family = d.family; body.scrollTop = 0; }
    if (d.tab) { tab = d.tab; body.scrollTop = 0; }
    if (d.amOpen) { const {cid, key} = anim(d.amOpen); if (key) { dialog.close(); core.openAnimation(cid, key); } return; }
    if (d.amRenameLib) {
      const lib = data.library.find(x => x.id === d.amRenameLib), name = window.prompt('Name in the library:', lib?.name || '');
      if (name !== null) core.renameLibraryAnimation(d.amRenameLib, name);
    }
    if (d.amDupLib) core.duplicateLibraryAnimation(d.amDupLib);
    if (d.amRemoveLib) {
      const lib = data.library.find(x => x.id === d.amRemoveLib);
      if (window.confirm(`Delete ${lib?.name || 'this animation'} from the library?`)) core.removeLibraryAnimation(d.amRemoveLib);
    }
    if (d.amOwn) { const {cid, key} = anim(d.amOwn); core.makeAnimationOwn(cid, key); }
    if (d.amRename) { const {cid, key, a} = anim(d.amRename); const name = window.prompt('Animation name:', a?.name || ''); if (name !== null) core.renameCharacterAnimation(cid, key, name); }
    if (d.amDup) { const {cid, key} = anim(d.amDup); core.duplicateCharacterAnimation(cid, key); }
    if (d.amAddLib) { const {cid, key, a} = anim(d.amAddLib); const name = window.prompt('Name in the library:', a?.name || ''); if (name && name.trim()) core.addAnimationToLibrary(cid, key, name.trim()); }
    if (d.amDelete) { const {cid, key, a} = anim(d.amDelete); if (window.confirm(`Delete ${a?.name || 'this animation'}? This can't be undone.`)) core.deleteCharacterAnimation(cid, key); }
    render();
  });
  core.subscribe(() => { if (dialog.open) render(); });

  window.AnimLabAnimationManager = Object.freeze({
    open(options = {}) { if (options.tab) tab = options.tab; family = null; render(); if (!dialog.open) dialog.showModal(); },
    close() { dialog.close(); }
  });
})();
