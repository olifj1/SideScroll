/* Character Lab · actions and animations (C3b). Replaces the four fixed clip
 * buttons with two lists:
 *  - Actions: the project-wide action slots (action-slots.js), each with the
 *    animation it plays for this character. Idle/Walk/Run/Jump are played by the
 *    game; added slots are data until game code (C5) or an action path (C6)
 *    uses them. Add or rename slots in Settings.
 *  - Animations: the character's own animations (tap one to edit it), with New,
 *    Duplicate, Rename and Delete.
 *  Each action's menu also lists the Library (shared animations of this body
 *  type): picking one gives the character that animation, linked, and plays it
 *  for the action. Manage animations opens the Animation manager.
 * Slot choices and list changes are saved straight away (walk-lab.js);
 * editing an animation's keys uses Save as before.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  const clipRow = document.getElementById('animlab-clip-row');
  if (!core?.animationList || !core.slotList || !clipRow) return;
  const section = clipRow.closest('section');
  section.querySelector('.animlab-section-title').textContent = 'Actions & animations';
  clipRow.hidden = true;

  const host = document.createElement('div');
  host.className = 'animlab-animation-list';
  host.innerHTML = `
    <div class="animlab-animation-group-label">Actions</div>
    <div class="animlab-slot-rows" data-slot-rows></div>
    <div class="animlab-animation-group-label">Animations</div>
    <div class="animlab-animation-rows" data-animation-rows></div>
    <div class="animlab-animation-actions">
      <button type="button" class="animlab-library-action" data-anim="new">New</button>
      <button type="button" class="animlab-library-action" data-anim="duplicate">Duplicate</button>
      <button type="button" class="animlab-library-action" data-anim="rename">Rename</button>
      <button type="button" class="animlab-library-action" data-anim="delete">Delete</button>
    </div>
    <button type="button" class="animlab-library-action animlab-manage-animations" data-anim="manage">Manage animations…</button>
    <p class="animlab-setup-note" data-anim-note></p>`;
  clipRow.insertAdjacentElement('afterend', host);
  const slotRows = host.querySelector('[data-slot-rows]'), animationRows = host.querySelector('[data-animation-rows]');
  const note = host.querySelector('[data-anim-note]');
  const button = id => host.querySelector(`[data-anim="${id}"]`);
  // New: a name and where its first pose comes from (Idle by default).
  const newDialog = document.createElement('dialog');
  newDialog.className = 'animlab-parts-add-dialog animlab-new-animation-dialog';
  newDialog.setAttribute('aria-label', 'New animation');
  newDialog.innerHTML = `<form method="dialog" class="animlab-parts-add-content">
    <div class="animlab-section-title">New animation</div>
    <label class="animlab-new-animation-field">Name <input type="text" data-new-name maxlength="40"></label>
    <label class="animlab-new-animation-field">Start from <select data-new-start></select></label>
    <p data-new-help>It starts as one key holding that pose; add keys from there.</p>
    <div class="animlab-parts-add-actions"><button type="button" data-new-action="create">Create</button><button type="button" data-new-action="cancel">Cancel</button></div>
  </form>`;
  document.body.appendChild(newDialog);
  const newName = newDialog.querySelector('[data-new-name]'), newStart = newDialog.querySelector('[data-new-start]');
  function openNewDialog() {
    newStart.replaceChildren(...(core.newAnimationStarts?.() || [{ value: 'current', label: 'The pose on screen now' }]).map(o => {
      const option = document.createElement('option'); option.value = o.value; option.textContent = o.label;
      if (o.value.startsWith('library:')) option.dataset.name = o.label.replace(/^Library: /, '').replace(/ \(all keys.*$/, '');
      return option;
    }));
    newStart.value = newStart.querySelector('option[value="idle"]') ? 'idle' : newStart.options[0]?.value || 'current';
    newName.value = 'New animation';
    const help = newDialog.querySelector('[data-new-help]');
    newStart.onchange = () => {
      const opt = newStart.selectedOptions[0];
      if (newStart.value === 'climb' && newName.value === 'New animation') newName.value = 'Climb';
      if (newStart.value.startsWith('library:') && (newName.value === 'New animation' || newName.dataset.auto === '1')) { newName.value = opt.dataset.name || newName.value; newName.dataset.auto = '1'; }
      help.textContent = newStart.value.startsWith('library:') ? 'A copy of every key of that library animation, as this character’s own (changes to it stay here).'
        : newStart.value === 'climb' ? 'Every key of the game’s climbing, ready to edit.' : 'It starts as one key holding that pose; add keys from there.';
    };
    newName.dataset.auto = ''; newStart.onchange();
    newDialog.showModal(); newName.select();
  }
  function createFromDialog() {
    newDialog.close();
    core.createAnimation('blank', newName.value, newStart.value);
    signature = ''; render();
  }
  newDialog.addEventListener('click', event => {
    const action = event.target.closest('[data-new-action]')?.dataset.newAction;
    if (action === 'cancel') newDialog.close();
    if (action === 'create') createFromDialog();
  });
  newName.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); createFromDialog(); } });
  let signature = '';

  function slotRow(slot, animations, locked) {
    const row = document.createElement('label');
    row.className = 'animlab-slot-row';
    const name = document.createElement('span');
    name.textContent = slot.name;
    if (!slot.hookedUp) { const tag = document.createElement('small'); tag.textContent = 'not hooked up yet'; name.appendChild(tag); }
    const select = document.createElement('select');
    select.dataset.slotId = slot.id; select.disabled = locked;
    select.setAttribute('aria-label', `Animation for ${slot.name}`);
    const options = [...(slot.builtIn && !slot.optional ? [] : [['', slot.optional ? 'The game’s own climbing' : '— none —']]), ...animations.map(a => [a.key, a.name])];
    const own = document.createElement('optgroup'); own.label = 'This character';
    for (const [value, label] of options) { const o = document.createElement('option'); o.value = value; o.textContent = label; own.appendChild(o); }
    select.appendChild(own);
    // Library animations the character doesn't have yet (ones it has are listed above).
    const library = (core.libraryAnimations?.() || []).filter(t => !animations.some(a => a.library === t.id));
    if (library.length) {
      const group = document.createElement('optgroup'); group.label = 'Library (shared)';
      for (const t of library) { const o = document.createElement('option'); o.value = `lib:${t.id}`; o.textContent = `${t.name} ⧉`; group.appendChild(o); }
      select.appendChild(group);
    }
    select.value = slot.animation || '';
    row.append(name, select);
    return row;
  }
  function animationRow(item, selected, locked) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'animlab-animation-row'; b.dataset.clipKey = item.key;
    b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); b.disabled = locked;
    const name = document.createElement('span'); name.textContent = item.name; b.appendChild(name);
    if (item.slots.length) { const tag = document.createElement('small'); tag.textContent = item.slots.join(', '); b.appendChild(tag); }
    return b;
  }
  function render() {
    const s = core.getState(), animations = core.animationList(), slots = core.slotList();
    const locked = s.mode === 'play';
    const digest = JSON.stringify([s.characterId, s.clip, locked, animations, slots, core.libraryAnimations?.()]);
    if (digest !== signature) {
      signature = digest;
      slotRows.replaceChildren(...slots.map(slot => slotRow(slot, animations, locked)));
      animationRows.replaceChildren(...animations.map(a => animationRow(a, a.key === s.clip, locked)));
    }
    const current = animations.find(a => a.key === s.clip), structural = s.mode === 'animate' && !s.dirty;
    button('new').disabled = button('duplicate').disabled = !structural;
    button('rename').disabled = locked || !current;
    const playedByGame = slots.some(slot => slot.builtIn && slot.animation === current?.key);
    button('delete').disabled = !structural || !current || current.original || playedByGame;
    note.textContent = s.mode !== 'animate' ? 'Open Animate to add or change animations.'
      : s.dirty ? 'Save or discard your key edits before adding or deleting animations.'
      : !current ? ''
      : current.slots.length ? `Editing ${current.name} · played for ${current.slots.join(', ')}. Add action slots in Settings.`
      : `Editing ${current.name} · not used by an action yet: pick it for a slot above.`;
  }

  host.addEventListener('change', event => {
    const select = event.target.closest('select[data-slot-id]');
    if (select) {
      if (select.value.startsWith('lib:')) core.addLibraryAnimation(select.value.slice(4), select.dataset.slotId);
      else core.setSlotAnimation(select.dataset.slotId, select.value || null);
      signature = ''; render();
    }
  });
  host.addEventListener('click', event => {
    const pickRow = event.target.closest('[data-clip-key]');
    if (pickRow) { core.selectClip(pickRow.dataset.clipKey); return; }
    const action = event.target.closest('[data-anim]')?.dataset.anim;
    if (!action) return;
    const s = core.getState(), current = core.animationList().find(a => a.key === s.clip);
    if (action === 'new') { openNewDialog(); return; }
    if (action === 'manage') { window.AnimLabAnimationManager?.open(); return; }
    if (action === 'duplicate') { const name = window.prompt('Name for the copy:', `${current?.name || 'Animation'} copy`); if (name !== null) core.createAnimation('duplicate', name); }
    if (action === 'rename' && current) { const name = window.prompt('Animation name:', current.name); if (name !== null) core.renameAnimation(current.key, name); }
    if (action === 'delete' && current && window.confirm(`Delete ${current.name}? This can't be undone.`)) core.deleteAnimation(current.key);
    signature = ''; render();
  });
  core.subscribe(render);
  render();
})();
