/* Character Lab · the open animation and the Animation library (C3a, C3c;
 * reworded 25 Nov 2026). In Animate, a box under the animation list says
 * whether the animation being edited is shared from the library (and who else
 * uses it) or this character's own, with Add to library and Make it <name>'s
 * own. Also asks the two library questions: editing a shared animation (change
 * it for everyone, or make it this character's own) and opening one whose
 * library animation changed since it was saved (Use updated or Keep previous).
 * Data: animation-templates.js (the library = animation templates); clips,
 * links and Save: walk-lab.js. The Animation manager is anim-lab-animation-manager.js.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  const clipRow = document.getElementById('animlab-clip-row');
  if (!core?.clipTemplateState || !clipRow) return;

  const box = document.createElement('div');
  box.className = 'animlab-animation-template';
  box.hidden = true;
  box.innerHTML = `
    <div class="animlab-animation-group-label">This animation</div>
    <p class="animlab-setup-note" data-at-status></p>
    <div class="animlab-rig-template-actions">
      <button type="button" class="animlab-library-action" data-at="update">Use library update</button>
      <button type="button" class="animlab-library-action" data-at="unique">Make it own</button>
    </div>
    <div class="animlab-rig-template-new animlab-library-field" data-at-add>
      <input type="text" data-at-name maxlength="42" placeholder="Name in the library" aria-label="Name in the animation library" autocomplete="off">
      <button type="button" class="animlab-library-action" data-at="save-as">Add to library</button>
    </div>`;
  clipRow.insertAdjacentElement('afterend', box);
  const status = box.querySelector('[data-at-status]'), addRow = box.querySelector('[data-at-add]');
  const nameInput = box.querySelector('[data-at-name]');
  const button = id => box.querySelector(`[data-at="${id}"]`);
  const listNames = names => names.length <= 3 ? names.join(', ') : `${names.slice(0,3).join(', ')} and ${names.length-3} more`;
  // The animation list (anim-lab-animation-list.js) also sits under the clip
  // row; keep this box below it.
  const placeBelowList = () => { const list = document.querySelector('.animlab-animation-list'); if (list && list.nextElementSibling !== box) list.insertAdjacentElement('afterend', box); };

  let namedFor = '';
  function render() {
    placeBelowList();
    const st = core.clipTemplateState();
    const show = !!st && st.mode === 'animate';
    box.hidden = !show; if (!show) return;
    const t = st.template, linked = !!t && st.link.mode === 'instance';
    status.textContent = linked
      ? `⧉ ${st.name} is shared from the library (${t.name})${st.users.length ? ` · also used by ${listNames(st.users)}` : ' · no one else uses it yet'}${st.stale ? ' · the library version has changed' : ''}${st.pending ? ' · Save to keep' : ''}.`
      : t ? `${st.name} is ${st.characterName}'s own (started from ${t.name} in the library).`
      : `${st.name} is ${st.characterName}'s own.`;
    button('update').hidden = !(linked && st.stale);
    button('unique').hidden = !linked;
    button('unique').textContent = `Make it ${st.characterName}'s own`;
    addRow.hidden = linked;
    const owner = `${st.characterId}|${st.slot}`;
    if (namedFor !== owner && document.activeElement !== nameInput) { nameInput.value = st.name; namedFor = owner; }
    maybeAskAboutUpdate(st);
  }

  // An animation whose library animation changed since this character saved it.
  const asked = new Set();
  async function maybeAskAboutUpdate(st) {
    if (!st.stale || st.mode !== 'animate' || st.dirty) return;
    const key = `${st.characterId}:${st.slot}:${st.link.id}:${st.template.revision}`;
    if (asked.has(key)) return;
    asked.add(key);
    const answer = await core.choose({kicker:'LIBRARY UPDATED', title:`${st.template.name} has changed`,
      text:`${st.template.name} in the library changed since ${st.characterName}'s ${st.name} was last saved. Use the updated animation (Undo restores the previous one), or keep the previous one as ${st.characterName}'s own?`,
      choices:[{id:'use',label:'Use updated',primary:true},{id:'keep',label:'Keep previous'},{id:'later',label:'Later'}]});
    if (answer === 'use') core.useClipTemplate();
    else if (answer === 'keep') core.makeClipUnique();
    render();
  }

  // The first edit of a shared animation asks where the edit goes.
  let asking = false;
  core.setClipEditListener(async () => {
    const st = core.clipTemplateState();
    if (asking || !st?.template || st.link.mode !== 'instance' || st.editChoice) return;
    asking = true;
    const answer = await core.choose({kicker:'SHARED ANIMATION', title:`Change ${st.template.name} for everyone?`,
      text:`${st.characterName}'s ${st.name} is shared from the library. ${st.users.length
        ? `${listNames(st.users)} also use${st.users.length === 1 ? 's' : ''} it: changing the library version offers them the change next time they are opened.`
        : 'No other character uses it yet; characters who pick it later get the change.'} Or make it ${st.characterName}'s own, so the change stays here.`,
      choices:[{id:'template',label:'Change for everyone',primary:true},{id:'unique',label:`Make it ${st.characterName}'s own`},{id:'undo',label:'Undo'}]});
    asking = false;
    if (answer === 'template') core.setClipEditChoice('template');
    else if (answer === 'unique') core.makeClipUnique();
    else core.undo();
    render();
  });

  box.addEventListener('click', event => {
    const action = event.target.closest('[data-at]')?.dataset.at;
    if (action === 'update') core.useClipTemplate();
    if (action === 'unique') core.makeClipUnique();
    if (action === 'save-as') {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); core.setHint?.('Type the name it should have in the library first.'); return; }
      if (core.saveClipAsTemplate(name)) core.setHint?.(`${name} is in the library · pick it from any ${core.getState().family === 'quadruped' ? 'four' : 'two'}-legged character's action menu`);
    }
    render();
  });
  core.subscribe(render);
  render();
})();
