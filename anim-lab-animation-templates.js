/* Character Lab · animation templates (C3a). In Animate, shows which template
 * the current clip links to (or that it is the character's own), and asks the
 * two template questions: editing a linked clip (Edit template or Make unique)
 * and opening a clip whose template changed since it was saved (Use updated or
 * Keep previous). Data: animation-templates.js; clips and Save: walk-lab.js.
 */
(function(){
  'use strict';
  const core = window.AnimLabCore;
  const clipRow = document.getElementById('animlab-clip-row');
  if (!core?.clipTemplateState || !clipRow) return;

  const note = document.createElement('p');
  note.className = 'animlab-setup-note animlab-clip-template-note';
  note.hidden = true;
  clipRow.insertAdjacentElement('afterend', note);
  const listNames = names => names.length <= 3 ? names.join(', ') : `${names.slice(0,3).join(', ')} and ${names.length-3} more`;
  const slotName = slot => slot.charAt(0).toUpperCase() + slot.slice(1);

  function render() {
    const st = core.clipTemplateState();
    const show = !!st?.template && st.mode === 'animate';
    note.hidden = !show; if (!show) return;
    note.textContent = st.link.mode === 'unique'
      ? `${slotName(st.slot)} · this character's own animation (started from ${st.template.name}).`
      : `${slotName(st.slot)} · linked to ${st.template.name}${st.users.length ? ` · also used by ${listNames(st.users)}` : ''}${st.stale ? ' · template updated' : ''}.`;
    maybeAskAboutUpdate(st);
  }

  // A clip whose linked template changed since this character saved it.
  const asked = new Set();
  async function maybeAskAboutUpdate(st) {
    if (!st.stale || st.mode !== 'animate' || st.dirty) return;
    const key = `${st.characterId}:${st.slot}:${st.link.id}:${st.template.revision}`;
    if (asked.has(key)) return;
    asked.add(key);
    const answer = await core.choose({kicker:'TEMPLATE UPDATED', title:`${st.template.name} has changed`,
      text:`The ${st.template.name} animation changed since ${st.characterName}'s ${st.slot} was last saved. Use the updated animation (Undo restores the previous one), or keep the previous one as ${st.characterName}'s own?`,
      choices:[{id:'use',label:'Use updated',primary:true},{id:'keep',label:'Keep previous'},{id:'later',label:'Later'}]});
    if (answer === 'use') core.useClipTemplate();
    else if (answer === 'keep') core.makeClipUnique();
    render();
  }

  // The first edit of a linked clip asks where the edit goes.
  let asking = false;
  core.setClipEditListener(async () => {
    const st = core.clipTemplateState();
    if (asking || !st?.template || st.link.mode !== 'instance' || st.editChoice) return;
    asking = true;
    const answer = await core.choose({kicker:'SHARED ANIMATION', title:'Edit the shared animation?',
      text:`${st.characterName}'s ${st.slot} is linked to the ${st.template.name} template. ${st.users.length
        ? `Also used by ${listNames(st.users)}: editing the template offers them the change next time they are opened.`
        : 'No other character uses it; characters linked to it later get the change.'} Or make it ${st.characterName}'s own.`,
      choices:[{id:'template',label:'Edit template',primary:true},{id:'unique',label:'Make unique'},{id:'undo',label:'Undo'}]});
    asking = false;
    if (answer === 'template') core.setClipEditChoice('template');
    else if (answer === 'unique') core.makeClipUnique();
    else core.undo();
    render();
  });

  core.subscribe(render);
  render();
})();
