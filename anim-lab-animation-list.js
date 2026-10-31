/* Character Lab · animation list (C3b). Replaces the four fixed clip buttons with
 * the character's animations: the ones in the game's action slots (Idle, Walk,
 * Run, Jump) and its other animations, kept for later actions (C5). New,
 * Duplicate, Rename, Delete and "Use for slot" are saved straight away
 * (walk-lab.js: createAnimation / renameAnimation / deleteAnimation /
 * assignAnimation); editing an animation's keys uses Save as before.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  const clipRow = document.getElementById('animlab-clip-row');
  if (!core?.animationList || !clipRow) return;
  const section = clipRow.closest('section');
  section.querySelector('.animlab-section-title').textContent = 'Animations';
  clipRow.hidden = true;

  const host = document.createElement('div');
  host.className = 'animlab-animation-list';
  host.innerHTML = `
    <div class="animlab-animation-group-label">In the game</div>
    <div class="animlab-animation-rows" data-slot-rows></div>
    <div class="animlab-animation-group-label">Other animations</div>
    <div class="animlab-animation-rows" data-extra-rows></div>
    <div class="animlab-animation-actions">
      <button type="button" class="animlab-library-action" data-anim="new">New</button>
      <button type="button" class="animlab-library-action" data-anim="duplicate">Duplicate</button>
      <button type="button" class="animlab-library-action" data-anim="rename">Rename</button>
      <button type="button" class="animlab-library-action" data-anim="delete">Delete</button>
    </div>
    <div class="animlab-animation-assign animlab-library-field" hidden>
      <select data-anim-slot aria-label="Action slot for this animation"></select>
      <button type="button" class="animlab-library-action" data-anim="assign">Use in game</button>
    </div>
    <p class="animlab-setup-note" data-anim-note></p>`;
  clipRow.insertAdjacentElement('afterend', host);
  const slotRows = host.querySelector('[data-slot-rows]'), extraRows = host.querySelector('[data-extra-rows]');
  const assignRow = host.querySelector('.animlab-animation-assign'), slotSelect = host.querySelector('[data-anim-slot]');
  const note = host.querySelector('[data-anim-note]');
  const button = id => host.querySelector(`[data-anim="${id}"]`);
  const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1);
  let signature = '';

  function row(item, selected, locked) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'animlab-animation-row'; b.dataset.clipKey = item.key;
    b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); b.disabled = locked;
    const name = document.createElement('span'); name.textContent = item.name;
    b.appendChild(name);
    if (item.slot && item.name !== titleCase(item.slot)) { const tag = document.createElement('small'); tag.textContent = titleCase(item.slot); b.appendChild(tag); }
    return b;
  }
  function render() {
    const s = core.getState(), list = core.animationList();
    const locked = s.mode === 'play';
    const digest = JSON.stringify([s.characterId, s.clip, locked, list]);
    if (digest !== signature) {
      signature = digest;
      slotRows.replaceChildren(...list.filter(a => a.slot).map(a => row(a, a.key === s.clip, locked)));
      const extras = list.filter(a => !a.slot);
      if (extras.length) extraRows.replaceChildren(...extras.map(a => row(a, a.key === s.clip, locked)));
      else { const empty = document.createElement('p'); empty.className = 'animlab-setup-note'; empty.textContent = 'None yet. New or Duplicate makes one.'; extraRows.replaceChildren(empty); }
      const slots = list.filter(a => a.slot);
      slotSelect.replaceChildren(...slots.map(a => { const o = document.createElement('option'); o.value = a.slot; o.textContent = `Use for ${titleCase(a.slot)} (replaces ${a.name})`; return o; }));
    }
    const current = list.find(a => a.key === s.clip), structural = s.mode === 'animate' && !s.dirty;
    button('new').disabled = button('duplicate').disabled = !structural;
    button('rename').disabled = locked || !current;
    button('delete').disabled = !structural || !current || !!current.slot;
    assignRow.hidden = !current || !!current.slot;
    button('assign').disabled = !structural;
    if (current && !current.slot && document.activeElement !== slotSelect && current.basedOn) slotSelect.value = current.basedOn;
    note.textContent = s.mode !== 'animate' ? 'Open Animate to add or change animations.'
      : s.dirty ? 'Save or discard your key edits before adding, deleting or moving animations.'
      : current?.slot ? `The game plays this for ${titleCase(current.slot)}.`
      : 'Not played in the game yet: put it in a slot with “Use in game”, or keep it for later actions.';
  }

  host.addEventListener('click', event => {
    const pickRow = event.target.closest('[data-clip-key]');
    if (pickRow) { core.selectClip(pickRow.dataset.clipKey); return; }
    const action = event.target.closest('[data-anim]')?.dataset.anim;
    if (!action) return;
    const s = core.getState(), current = core.animationList().find(a => a.key === s.clip);
    if (action === 'new') { const name = window.prompt('Name for the new animation:', 'New animation'); if (name !== null) core.createAnimation('blank', name); }
    if (action === 'duplicate') { const name = window.prompt('Name for the copy:', `${current?.name || 'Animation'} copy`); if (name !== null) core.createAnimation('duplicate', name); }
    if (action === 'rename' && current) { const name = window.prompt('Animation name:', current.name); if (name !== null) core.renameAnimation(current.key, name); }
    if (action === 'delete' && current && !current.slot && window.confirm(`Delete ${current.name}? This can't be undone.`)) core.deleteAnimation(current.key);
    if (action === 'assign' && current && !current.slot) core.assignAnimation(current.key, slotSelect.value);
    signature = ''; render();
  });
  core.subscribe(render);
  render();
})();
