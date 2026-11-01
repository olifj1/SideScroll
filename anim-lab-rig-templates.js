/* Character Lab · rig templates (C2b). Shows which rig template the current
 * character links to (instance) or started from (unique copy), and offers Use
 * template / Make unique / Save as template. Also asks the two template
 * questions: editing a linked rig (Edit template or Make unique) and opening a
 * character whose template changed (Use updated, with the skin rebound, or
 * Keep previous). Data: rig-templates.js; working copy and Save: walk-lab.js.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  const setupSection = document.getElementById('animlab-setup-section');
  if (!core?.rigTemplateState || !setupSection) return;

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-rig-template';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Rig template</div>
    <p class="animlab-setup-note" data-rt-status></p>
    <label class="animlab-library-field">Template <select data-rt-select aria-label="Rig template"></select></label>
    <div class="animlab-rig-template-actions">
      <button type="button" class="animlab-library-action" data-rt="use">Use this template</button>
      <button type="button" class="animlab-library-action" data-rt="unique">Make unique</button>
    </div>
    <div class="animlab-rig-template-new animlab-library-field">
      <input type="text" data-rt-name maxlength="42" placeholder="New template name" aria-label="New template name" autocomplete="off">
      <button type="button" class="animlab-library-action" data-rt="save-as">Save as template</button>
    </div>`;
  setupSection.insertAdjacentElement('afterend', section);
  const status = section.querySelector('[data-rt-status]');
  const select = section.querySelector('[data-rt-select]');
  const nameInput = section.querySelector('[data-rt-name]');
  const button = id => section.querySelector(`[data-rt="${id}"]`);
  const listNames = names => names.length <= 3 ? names.join(', ') : `${names.slice(0,3).join(', ')} and ${names.length-3} more`;

  function render() {
    const s = core.getState(), rt = core.rigTemplateState();
    const show = !!rt && s.mode === 'setup' && s.setupTool === 'rig';
    section.hidden = !show; if (!show) return;
    const name = rt.template?.name || 'unknown template';
    const others = rt.users.length ? `Also used by ${listNames(rt.users)}.` : 'No other character uses it.';
    status.textContent = !rt.editable
      ? `Linked to ${name}. ${others} This rig's proportions can't be edited.`
      : rt.link.mode === 'unique'
        ? `Own rig (started from ${name}). Rig edits change this character only.`
        : `Linked to ${name}. ${others}${rt.stale ? ' The template has changed since this character was saved.' : ''}`;
    const digest = JSON.stringify(rt.templates);
    if (select.dataset.signature !== digest) {
      select.dataset.signature = digest; select.replaceChildren();
      for (const t of rt.templates) { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; select.appendChild(o); }
    }
    if (document.activeElement !== select && select.dataset.character !== rt.characterId + rt.link.id) {
      select.value = rt.link.id; select.dataset.character = rt.characterId + rt.link.id;
    }
    const chosen = select.value || rt.link.id;
    button('use').disabled = !(chosen !== rt.link.id || rt.link.mode === 'unique' || rt.stale);
    button('use').textContent = chosen === rt.link.id && rt.stale ? 'Use updated template' : 'Use this template';
    button('unique').disabled = !rt.editable || rt.link.mode === 'unique';
    button('save-as').disabled = !rt.editable;
    nameInput.disabled = !rt.editable;
    maybeAskAboutUpdate(rt, s);
  }

  // Opening a character (in Setup) whose linked template changed since it was saved.
  const asked = new Set();
  async function maybeAskAboutUpdate(rt, s) {
    if (!rt.stale || s.mode !== 'setup' || s.dirty) return;
    const key = `${rt.characterId}:${rt.link.id}:${rt.template.revision}`;
    if (asked.has(key)) return;
    asked.add(key);
    const answer = await core.choose({kicker:'TEMPLATE UPDATED', title:`The ${rt.template.name} rig has changed`,
      text:`It changed since ${rt.characterName} was last saved. Use the updated rig (the skin is rebound to it; Undo restores the previous one), or keep the previous rig as ${rt.characterName}'s own?`,
      choices:[{id:'use',label:'Use updated',primary:true},{id:'keep',label:'Keep previous'},{id:'later',label:'Later'}]});
    if (answer === 'use') core.useRigTemplate(rt.link.id);
    else if (answer === 'keep') core.makeRigUnique();
    render();
  }

  // The first rig edit on a linked rig asks where the edit goes.
  let asking = false;
  core.setRigEditListener(async () => {
    const rt = core.rigTemplateState();
    if (asking || !rt?.editable || rt.link.mode !== 'instance' || rt.editChoice) return;
    asking = true;
    const name = rt.template?.name || 'shared';
    const answer = await core.choose({kicker:'SHARED RIG', title:'Edit the shared rig?',
      text:`${rt.characterName}'s rig is linked to the ${name} template. ${rt.users.length
        ? `Also used by ${listNames(rt.users)}: editing the template offers them the change next time they are opened.`
        : 'No other character uses it; characters linked to it later get the change.'} Or give ${rt.characterName} its own rig.`,
      choices:[{id:'template',label:'Edit template',primary:true},{id:'unique',label:'Make unique'},{id:'undo',label:'Undo'}]});
    asking = false;
    if (answer === 'template') core.setRigEditChoice('template');
    else if (answer === 'unique') core.makeRigUnique();
    else core.undo();
    render();
  });

  select.addEventListener('change', render);
  section.addEventListener('click', event => {
    const action = event.target.closest('[data-rt]')?.dataset.rt;
    if (action === 'use') core.useRigTemplate(select.value);
    if (action === 'unique') core.makeRigUnique();
    if (action === 'save-as') {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); core.setHint?.('Type a name for the new rig template first.'); return; }
      if (core.saveRigAsTemplate(name)) nameInput.value = '';
    }
    render();
  });
  core.subscribe(render);
  render();
})();
