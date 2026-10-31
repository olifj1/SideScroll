/* Character Lab · actions and animations (C3b). Replaces the four fixed clip
 * buttons with two lists:
 *  - Actions: the project-wide action slots (action-slots.js), each with the
 *    animation it plays for this character. Idle/Walk/Run/Jump are played by the
 *    game; added slots are data until game code (C5) or an action path (C6)
 *    uses them. Add or rename slots in Settings.
 *  - Animations: the character's own animations (tap one to edit it), with New,
 *    Duplicate, Rename and Delete.
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
    <p class="animlab-setup-note" data-anim-note></p>`;
  clipRow.insertAdjacentElement('afterend', host);
  const slotRows = host.querySelector('[data-slot-rows]'), animationRows = host.querySelector('[data-animation-rows]');
  const note = host.querySelector('[data-anim-note]');
  const button = id => host.querySelector(`[data-anim="${id}"]`);
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
    const options = [...(slot.builtIn ? [] : [['', '— none —']]), ...animations.map(a => [a.key, a.name])];
    for (const [value, label] of options) { const o = document.createElement('option'); o.value = value; o.textContent = label; select.appendChild(o); }
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
    const digest = JSON.stringify([s.characterId, s.clip, locked, animations, slots]);
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
    if (select) { core.setSlotAnimation(select.dataset.slotId, select.value || null); signature = ''; render(); }
  });
  host.addEventListener('click', event => {
    const pickRow = event.target.closest('[data-clip-key]');
    if (pickRow) { core.selectClip(pickRow.dataset.clipKey); return; }
    const action = event.target.closest('[data-anim]')?.dataset.anim;
    if (!action) return;
    const s = core.getState(), current = core.animationList().find(a => a.key === s.clip);
    if (action === 'new') { const name = window.prompt('Name for the new animation:', 'New animation'); if (name !== null) core.createAnimation('blank', name); }
    if (action === 'duplicate') { const name = window.prompt('Name for the copy:', `${current?.name || 'Animation'} copy`); if (name !== null) core.createAnimation('duplicate', name); }
    if (action === 'rename' && current) { const name = window.prompt('Animation name:', current.name); if (name !== null) core.renameAnimation(current.key, name); }
    if (action === 'delete' && current && window.confirm(`Delete ${current.name}? This can't be undone.`)) core.deleteAnimation(current.key);
    signature = ''; render();
  });
  core.subscribe(render);
  render();
})();
