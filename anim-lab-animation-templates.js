/* Character Lab · animation templates (C3a, C3c). In Animate, an "Animation
 * template" box for the animation being edited: which template it follows (or
 * that it is the character's own), with Use this template, Make unique and Save
 * as template. Also asks the two template questions: editing a linked
 * animation (Edit template or Make unique) and opening one whose template
 * changed since it was saved (Use updated or Keep previous).
 * Data: animation-templates.js; clips, links and Save: walk-lab.js.
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
    <div class="animlab-animation-group-label">Animation template</div>
    <p class="animlab-setup-note" data-at-status></p>
    <label class="animlab-library-field">Template <select data-at-select aria-label="Animation template"></select></label>
    <div class="animlab-rig-template-actions">
      <button type="button" class="animlab-library-action" data-at="use">Use this template</button>
      <button type="button" class="animlab-library-action" data-at="unique">Make unique</button>
    </div>
    <div class="animlab-rig-template-new animlab-library-field">
      <input type="text" data-at-name maxlength="42" placeholder="New template name" aria-label="New animation template name" autocomplete="off">
      <button type="button" class="animlab-library-action" data-at="save-as">Save as template</button>
    </div>`;
  clipRow.insertAdjacentElement('afterend', box);
  const status = box.querySelector('[data-at-status]'), select = box.querySelector('[data-at-select]');
  const nameInput = box.querySelector('[data-at-name]');
  const button = id => box.querySelector(`[data-at="${id}"]`);
  const listNames = names => names.length <= 3 ? names.join(', ') : `${names.slice(0,3).join(', ')} and ${names.length-3} more`;
  // The animation list (anim-lab-animation-list.js) also sits under the clip
  // row; keep this box below it.
  const placeBelowList = () => { const list = document.querySelector('.animlab-animation-list'); if (list && list.nextElementSibling !== box) list.insertAdjacentElement('afterend', box); };

  function render() {
    placeBelowList();
    const st = core.clipTemplateState();
    const show = !!st && st.mode === 'animate';
    box.hidden = !show; if (!show) return;
    const t = st.template;
    status.textContent = !t ? `${st.name} is ${st.characterName}'s own animation and follows no template.`
      : st.link.mode === 'unique' ? `${st.name} · ${st.characterName}'s own (started from ${t.name}).`
      : `${st.name} · follows ${t.name}${st.users.length ? ` · also used by ${listNames(st.users)}` : ''}${st.stale ? ' · template updated' : ''}${st.pending ? ' · Save to keep' : ''}.`;
    const digest = JSON.stringify(st.templates);
    if (select.dataset.signature !== digest) {
      select.dataset.signature = digest; select.replaceChildren();
      for (const o of st.templates) { const opt = document.createElement('option'); opt.value = o.id; opt.textContent = o.name; select.appendChild(opt); }
    }
    const owner = `${st.characterId}|${st.slot}|${t?.id || ''}`;
    if (document.activeElement !== select && select.dataset.owner !== owner) { select.value = t?.id || st.templates[0]?.id || ''; select.dataset.owner = owner; }
    const chosen = select.value;
    const following = !!t && st.link.mode === 'instance' && chosen === t.id;
    button('use').disabled = !chosen || (following && !st.stale);
    button('use').textContent = following && st.stale ? 'Use updated template' : 'Use this template';
    button('unique').disabled = !t || st.link.mode === 'unique';
    maybeAskAboutUpdate(st);
  }

  // An animation whose linked template changed since this character saved it.
  const asked = new Set();
  async function maybeAskAboutUpdate(st) {
    if (!st.stale || st.mode !== 'animate' || st.dirty) return;
    const key = `${st.characterId}:${st.slot}:${st.link.id}:${st.template.revision}`;
    if (asked.has(key)) return;
    asked.add(key);
    const answer = await core.choose({kicker:'TEMPLATE UPDATED', title:`${st.template.name} has changed`,
      text:`The ${st.template.name} animation changed since ${st.characterName}'s ${st.name} was last saved. Use the updated animation (Undo restores the previous one), or keep the previous one as ${st.characterName}'s own?`,
      choices:[{id:'use',label:'Use updated',primary:true},{id:'keep',label:'Keep previous'},{id:'later',label:'Later'}]});
    if (answer === 'use') core.useClipTemplate();
    else if (answer === 'keep') core.makeClipUnique();
    render();
  }

  // The first edit of a linked animation asks where the edit goes.
  let asking = false;
  core.setClipEditListener(async () => {
    const st = core.clipTemplateState();
    if (asking || !st?.template || st.link.mode !== 'instance' || st.editChoice) return;
    asking = true;
    const answer = await core.choose({kicker:'SHARED ANIMATION', title:'Edit the shared animation?',
      text:`${st.characterName}'s ${st.name} follows the ${st.template.name} template. ${st.users.length
        ? `Also used by ${listNames(st.users)}: editing the template offers them the change next time they are opened.`
        : 'No other character uses it; characters linked to it later get the change.'} Or make it ${st.characterName}'s own.`,
      choices:[{id:'template',label:'Edit template',primary:true},{id:'unique',label:'Make unique'},{id:'undo',label:'Undo'}]});
    asking = false;
    if (answer === 'template') core.setClipEditChoice('template');
    else if (answer === 'unique') core.makeClipUnique();
    else core.undo();
    render();
  });

  select.addEventListener('change', render);
  box.addEventListener('click', event => {
    const action = event.target.closest('[data-at]')?.dataset.at;
    if (action === 'use') core.useClipTemplate(select.value);
    if (action === 'unique') core.makeClipUnique();
    if (action === 'save-as') {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); core.setHint?.('Type a name for the new animation template first.'); return; }
      if (core.saveClipAsTemplate(name)) nameInput.value = '';
    }
    render();
  });
  core.subscribe(render);
  render();
})();
