/* SideScroll Character Lab — Character Library.
   Every character has the same workflow. Toolbar: New · Open · Save · Share.
   - Open lists every character grouped by category (character-registry.js), with
     Rename, category, order and Delete for each. A character holding a role
     (e.g. Default player) can't be deleted until the role is moved.
   - Settings (top bar) holds project-wide character settings: roles and
     categories (later rig templates and abilities).
   - Share exports the open character or all characters, and imports characters
     (Replace / Add / Add as a copy / Skip). Packaging is character-packages.js.
   Library and original character storage remain separate under the hood; do not
   migrate saved data during a UI change. */
(() => {
  'use strict';
  const core=window.AnimLabCore;
  const registry=window.SideScrollCharacters;
  const packages=window.SideScrollCharacterPackages;
  const drawer=document.querySelector('.animlab-drawer');
  const original=document.getElementById('animlab-character-row')?.closest('.animlab-section');
  if(!core?.getLibraryCharacters || !registry || !drawer || !original)return;
  // The original character buttons stay for compatibility; Open replaces them.
  original.hidden=true;
  const legacySave=document.getElementById('animlab-save');
  if(legacySave) legacySave.hidden=true;

  const section=document.createElement('section');
  section.className='animlab-section animlab-character-library';
  section.id='animlab-character-library';
  section.setAttribute('aria-labelledby','animlab-library-title');
  section.innerHTML=`
    <div class="animlab-section-title" id="animlab-library-title">Character Library</div>
    <div class="animlab-library-current" id="animlab-library-current" aria-live="polite">
      <span>Loaded character</span><strong id="animlab-library-current-name"></strong>
      <small id="animlab-library-current-kind"></small>
    </div>
    <div class="animlab-library-toolbar animlab-library-toolbar-4" role="group" aria-label="Character Library actions">
      <button type="button" data-library-panel="new" aria-controls="animlab-library-new" aria-expanded="false">New</button>
      <button type="button" data-library-panel="open" aria-controls="animlab-library-open" aria-expanded="false">Open</button>
      <button type="button" data-library-panel="save" aria-controls="animlab-library-save" aria-expanded="false">Save</button>
      <button type="button" data-library-panel="share" aria-controls="animlab-library-share" aria-expanded="false">Share</button>
    </div>
    <div class="animlab-library-status" id="animlab-library-status" role="status" hidden></div>
    <div class="animlab-library-panel" id="animlab-library-new" hidden>
      <div class="animlab-library-panel-heading"><strong>New character</strong><button type="button" data-library-close aria-label="Close New character">×</button></div>
      <label class="animlab-library-field">Name
        <input id="animlab-library-name" type="text" placeholder="Character name" maxlength="42" autocomplete="off" aria-label="New character name">
      </label>
      <label class="animlab-library-field">Starter rig
        <select id="animlab-library-family" aria-label="Starter rig">
          <option value="quadruped">Quadruped</option>
          <option value="biped">Biped</option>
        </select>
      </label>
      <button class="animlab-library-create" id="animlab-library-create" type="button">Create Character</button>
      <small class="animlab-library-footnote">A new character starts from the chosen rig's starter setup, artwork placement, skin and clips. It can be chosen in the game once its art and rig are playable and it is in a playable category.</small>
    </div>
    <div class="animlab-library-panel" id="animlab-library-open" hidden>
      <div class="animlab-library-panel-heading"><strong>Open character</strong><button type="button" data-library-close aria-label="Close Open character">×</button></div>
      <div class="animlab-library-list" id="animlab-library-list" aria-label="Characters by category"></div>
      <small class="animlab-library-footnote">Roles and categories are in Settings (top bar).</small>
    </div>
    <div class="animlab-library-panel" id="animlab-library-save" hidden>
      <div class="animlab-library-panel-heading"><strong>Save character</strong><button type="button" data-library-close aria-label="Close Save character">×</button></div>
      <div id="animlab-library-save-caption" class="animlab-library-footnote"></div>
      <button id="animlab-library-save-changes" type="button" class="animlab-library-create">Save changes</button>
    </div>
    <div class="animlab-library-panel" id="animlab-library-share" hidden>
      <div class="animlab-library-panel-heading"><strong>Share characters</strong><button type="button" data-library-close aria-label="Close Share characters">×</button></div>
      <div class="animlab-library-transfer">
        <button type="button" id="animlab-library-export-current" class="animlab-library-action">Export this character</button>
        <button type="button" id="animlab-library-export-all" class="animlab-library-action">Export all characters</button>
        <button type="button" id="animlab-library-import-button" class="animlab-library-action">Import characters…</button>
        <input id="animlab-library-import" type="file" accept=".json,application/json" hidden aria-label="Import character file">
        <small class="animlab-library-footnote">An export holds everything for each character: setup, rig, skin, animations, reference alignment and imported artwork. Import lets you replace a character (roll back or update), add it as a copy, or skip it.</small>
      </div>
      <div class="animlab-library-review" id="animlab-library-review" hidden>
        <strong>Import characters</strong>
        <div id="animlab-library-review-list"></div>
        <div class="animlab-library-review-actions">
          <button type="button" id="animlab-library-review-apply" class="animlab-library-create">Import</button>
          <button type="button" id="animlab-library-review-cancel" class="animlab-library-action">Cancel</button>
        </div>
      </div>
    </div>`;
  drawer.insertBefore(section,original);
  // Settings: a top-bar button opening a dialog with project-wide character
  // settings, kept out of the Open list.
  const settingsButton=document.createElement('button');
  settingsButton.type='button';settingsButton.className='animlab-settings-button';
  settingsButton.textContent='Settings';settingsButton.setAttribute('aria-haspopup','dialog');settingsButton.setAttribute('aria-expanded','false');
  document.querySelector('.animlab-topbar .animlab-info')?.before(settingsButton);
  const settings=document.createElement('div');
  settings.className='animlab-settings-overlay';settings.hidden=true;
  settings.innerHTML=`
    <section class="animlab-settings-card" role="dialog" aria-modal="true" aria-labelledby="animlab-settings-title">
      <div class="animlab-library-panel-heading"><strong id="animlab-settings-title">Character settings</strong><button type="button" data-settings-close aria-label="Close settings">×</button></div>
      <div class="animlab-library-organise" id="animlab-library-organise">
        <strong>Roles</strong>
        <small class="animlab-library-footnote">Each role is on one character. A character with a role can't be deleted; move the role first.</small>
        <div id="animlab-library-roles"></div>
        <button type="button" id="animlab-library-add-role" class="animlab-library-action">Add role…</button>
        <strong>Categories</strong>
        <small class="animlab-library-footnote">Characters are listed in this order. The game's character picker shows playable categories.</small>
        <div id="animlab-library-categories"></div>
        <button type="button" id="animlab-library-add-category" class="animlab-library-action">Add category…</button>
        <strong>Rig templates</strong>
        <small class="animlab-library-footnote">Named rigs characters link to. Create one with Rig → Save as template. A template can be removed when no character uses it.</small>
        <div id="animlab-library-rig-templates"></div>
      </div>
    </section>`;
  document.body.appendChild(settings);
  // iOS can give a vertically scrolling sidebar a few pixels of horizontal
  // overscroll when nested controls resize. Keep the drawer's X origin fixed.
  drawer.addEventListener('scroll',()=>{if(drawer.scrollLeft!==0)drawer.scrollLeft=0;},{passive:true});

  const $=id=>section.querySelector('#'+id);
  const name=$('animlab-library-name'),family=$('animlab-library-family');
  const create=$('animlab-library-create'),status=$('animlab-library-status');
  const list=$('animlab-library-list'),importInput=$('animlab-library-import');
  const saveChanges=$('animlab-library-save-changes'),saveCaption=$('animlab-library-save-caption');
  const currentName=$('animlab-library-current-name'),currentKind=$('animlab-library-current-kind');
  const exportCurrentButton=$('animlab-library-export-current');
  const exportAllButton=$('animlab-library-export-all'),importButton=$('animlab-library-import-button');
  const review=$('animlab-library-review'),reviewList=$('animlab-library-review-list');
  const reviewApply=$('animlab-library-review-apply'),reviewCancel=$('animlab-library-review-cancel');
  const organise=settings.querySelector('#animlab-library-organise');
  const rolesList=settings.querySelector('#animlab-library-roles'),categoriesList=settings.querySelector('#animlab-library-categories');
  const templatesList=settings.querySelector('#animlab-library-rig-templates');
  const rigTemplates=window.SideScrollRigTemplates||null;
  const toolbar=[...section.querySelectorAll('[data-library-panel]')];
  const panels=Object.fromEntries(['new','open','save','share'].map(key=>[key,$('animlab-library-'+key)]));
  let openPanel=null,manageId=null,listSignature='',lastCharacterId=null,pendingImport=null;

  const allCharacters=()=>registry.list();
  const familyLabel=f=>f==='quadruped'?'Quadruped':'Biped';
  const editingBlocked=state=>!!state.dirty||state.mode==='play';
  function setStatus(value){status.textContent=value||'';status.hidden=!value;}
  function setPanel(which){
    openPanel=which===openPanel?null:which;
    manageId=null;
    for(const key of Object.keys(panels)) panels[key].hidden=key!==openPanel;
    for(const button of toolbar){
      const active=button.dataset.libraryPanel===openPanel;
      button.setAttribute('aria-expanded',String(active));
      button.classList.toggle('active',active);
    }
    // Do not auto-focus New's text field on iPhone: opening the keyboard can
    // shift the visual viewport before the user chooses to type.
    if(openPanel==='open') {listSignature='';refresh();}
    if(openPanel==='save') refreshSave();
    delete status.dataset.pendingCharacter;
    setStatus('');
  }
  function refreshSave(state=core.getState()){
    if(openPanel!=='save')return;
    const label=state.character?.label||'current character';
    saveCaption.textContent=state.dirty?`Unsaved changes in ${label}.`:`${label} has no unsaved changes.`;
    saveChanges.disabled=!state.dirty;
  }
  function makeButton(label,action,id){
    const b=document.createElement('button');b.type='button';
    b.textContent=label;b.className='animlab-library-action';
    b.dataset.action=action;b.dataset.characterId=id;
    return b;
  }

  // ---- Open: characters grouped by category ---------------------------------
  function renderList(state){
    const blocked=editingBlocked(state);
    const categories=registry.categories();
    list.replaceChildren();
    for(const category of categories){
      const members=allCharacters().filter(c=>c.category===category.id);
      if(!members.length)continue;
      const heading=document.createElement('div');heading.className='animlab-library-category';
      heading.textContent=category.name+(category.playable?' · playable':'');
      list.appendChild(heading);
      members.forEach((entry,index)=>{
        const row=document.createElement('div');row.className='animlab-library-entry';
        if(state.characterId===entry.id)row.classList.add('is-selected');
        const title=document.createElement('div');title.className='animlab-library-entry-name';
        title.textContent=entry.name;
        const sub=document.createElement('small');
        sub.textContent=[familyLabel(entry.family),...entry.roles.map(r=>r.name)].join(' · ');
        title.appendChild(sub);row.appendChild(title);
        const actions=document.createElement('div');actions.className='animlab-library-actions';
        const open=makeButton(state.characterId===entry.id?'Loaded':'Open','open',entry.id);
        open.disabled=state.characterId===entry.id;
        const manage=makeButton('•••','manage',entry.id);
        manage.setAttribute('aria-label',`Manage ${entry.name}`);
        manage.setAttribute('aria-expanded',String(manageId===entry.id));
        actions.append(open,manage);row.append(actions);
        if(manageId===entry.id){
          const m=document.createElement('div');m.className='animlab-library-management';
          const rename=makeButton('Rename','rename',entry.id);
          const up=makeButton('↑','up',entry.id),down=makeButton('↓','down',entry.id);
          up.setAttribute('aria-label',`Move ${entry.name} up`);down.setAttribute('aria-label',`Move ${entry.name} down`);
          up.disabled=index===0;down.disabled=index===members.length-1;
          const exported=makeButton('Export','export',entry.id);
          const remove=makeButton('Delete','delete',entry.id);
          const select=document.createElement('select');select.dataset.action='category';select.dataset.characterId=entry.id;
          select.setAttribute('aria-label',`Category for ${entry.name}`);
          for(const c of categories){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.appendChild(o);}
          select.value=entry.category;
          rename.disabled=blocked;exported.disabled=blocked||!packages;
          remove.disabled=blocked||entry.roles.length>0;
          m.append(rename,select,up,down,exported,remove);
          if(entry.roles.length){
            const note=document.createElement('small');note.className='animlab-library-footnote';
            note.textContent=`${entry.roles.map(r=>r.name).join(', ')}: move ${entry.roles.length===1?'this role':'these roles'} to another character before deleting.`;
            m.appendChild(note);
          }
          row.append(m);
        }
        list.appendChild(row);
      });
    }
  }
  // ---- Settings: roles and categories ----------------------------------------
  function renderOrganise(){
    if(settings.hidden)return;
    const characters=allCharacters();
    rolesList.replaceChildren();
    for(const role of registry.roles()){
      const row=document.createElement('div');row.className='animlab-library-organise-row';
      const label=document.createElement('span');label.textContent=role.name;
      const select=document.createElement('select');select.dataset.roleId=role.id;
      select.setAttribute('aria-label',`Character with the ${role.name} role`);
      for(const c of characters){const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.appendChild(o);}
      select.value=role.character;
      const rename=document.createElement('button');rename.type='button';rename.className='animlab-library-action';
      rename.textContent='Rename';rename.dataset.renameRole=role.id;
      row.append(label,select,rename);rolesList.appendChild(row);
    }
    categoriesList.replaceChildren();
    const categories=registry.categories();
    categories.forEach((category,index)=>{
      const row=document.createElement('div');row.className='animlab-library-organise-row';
      const label=document.createElement('span');label.textContent=category.name;
      const playable=document.createElement('label');playable.className='animlab-library-check';
      const box=document.createElement('input');box.type='checkbox';box.checked=category.playable;box.dataset.playableCategory=category.id;
      playable.append(box,document.createTextNode(' Playable'));
      const button=(text,data,disabled,aria)=>{const b=document.createElement('button');b.type='button';b.className='animlab-library-action';
        b.textContent=text;Object.assign(b.dataset,data);b.disabled=!!disabled;if(aria)b.setAttribute('aria-label',aria);return b;};
      const empty=!characters.some(c=>c.category===category.id);
      row.append(label,playable,
        button('↑',{categoryUp:category.id},index===0,`Move ${category.name} up`),
        button('↓',{categoryDown:category.id},index===categories.length-1,`Move ${category.name} down`),
        button('Rename',{renameCategory:category.id}),
        button('Remove',{removeCategory:category.id},!empty||categories.length<=1,`Remove ${category.name}`));
      categoriesList.appendChild(row);
    });
    templatesList.replaceChildren();
    for(const t of rigTemplates?.list()||[]){
      const users=rigTemplates.usersOf(t.id).map(c=>c.name);
      const row=document.createElement('div');row.className='animlab-library-organise-row';
      const label=document.createElement('span');
      label.textContent=`${t.name} · ${t.family==='quadruped'?'Quadruped':'Biped'}${users.length?` · ${users.join(', ')}`:''}`;
      const button=(text,data,disabled)=>{const b=document.createElement('button');b.type='button';b.className='animlab-library-action';
        b.textContent=text;Object.assign(b.dataset,data);b.disabled=!!disabled;return b;};
      row.append(label,button('Rename',{renameTemplate:t.id}),button('Remove',{removeTemplate:t.id},!rigTemplates.canRemove(t.id)));
      templatesList.appendChild(row);
    }
  }

  function refresh(state=core.getState()){
    const pendingId=status.dataset.pendingCharacter;
    if(pendingId && document.getElementById('animlab-guard')?.hidden){
      delete status.dataset.pendingCharacter;
      const target=allCharacters().find(item=>item.id===pendingId);
      setStatus(state.characterId===pendingId
        ? `${target?.name||'Character'} is now loaded.`
        : 'Character switch cancelled. Your working edits are unchanged.');
    }
    const dirty=!!state.dirty;
    const current=registry.find(state.characterId);
    currentName.textContent=state.character?.label||'Unknown character';
    currentKind.textContent=[familyLabel(state.family),...(current?.roles||[]).map(r=>r.name)].join(' · ')+(dirty?' · Unsaved changes':' · Saved');
    // Close Open only AFTER the selection really changed. This also handles
    // the asynchronous Save/Discard guard path; Cancel must leave Open visible.
    if(lastCharacterId!==null && lastCharacterId!==state.characterId && openPanel==='open') {
      setPanel(null);
      setStatus(`${state.character?.label||'Character'} is now loaded.`);
    }
    lastCharacterId=state.characterId;
    create.disabled=editingBlocked(state)||core.getLibraryCharacters().length>=24;
    // Exports read saved data, so unsaved edits must be saved or discarded first.
    exportCurrentButton.disabled=editingBlocked(state)||!packages;
    exportAllButton.disabled=editingBlocked(state)||!packages;
    importButton.disabled=editingBlocked(state)||!packages;
    reviewApply.disabled=editingBlocked(state)||!reviewComplete();
    refreshSave(state);
    // The list is populated only while Open is shown, rather than rebuilding
    // buttons during animated viewport redraws.
    if(openPanel!=='open')return;
    const signature=JSON.stringify({id:state.characterId,mode:state.mode,dirty,manageId,
      reg:registry.load(),entries:allCharacters().map(e=>[e.id,e.name])});
    if(signature===listSignature)return;
    listSignature=signature;
    renderList(state);
  }
  const rerender=()=>{listSignature='';refresh();renderOrganise();};
  toolbar.forEach(button=>button.addEventListener('click',()=>setPanel(button.dataset.libraryPanel)));
  section.querySelectorAll('[data-library-close]').forEach(button=>button.addEventListener('click',()=>setPanel(null)));
  create.addEventListener('click',()=>{
    const id=core.createLibraryCharacter(name.value,family.value);
    if(!id){setStatus('Enter a name and Save or Discard edits before creating.');return;}
    name.value='';setPanel(null);
    setStatus('New character created and opened.');
    refresh();
  });
  name.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();create.click();}});
  const setSettingsOpen=open=>{
    settings.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open));
    if(open){renderOrganise();settings.querySelector('[data-settings-close]')?.focus({preventScroll:true});}
    else settingsButton.focus({preventScroll:true});
  };
  settingsButton.addEventListener('click',()=>setSettingsOpen(settings.hidden));
  settings.addEventListener('click',event=>{
    if(event.target===settings||event.target.closest('[data-settings-close]'))setSettingsOpen(false);
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!settings.hidden)setSettingsOpen(false);});

  // ---- Export ---------------------------------------------------------------
  const slug=value=>String(value||'character').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'character';
  const stamp=()=>new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
  async function shareFile(data,filename){
    const json=JSON.stringify(data);
    const file=typeof File==='function'?new File([json],filename,{type:'application/json'}):null;
    if(file && navigator.share && navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file]});
    }else{
      const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),link=document.createElement('a');
      link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }
  }
  async function runExport(label,build,filename){
    if(core.getState().dirty){setStatus('Save or discard your edits first: exports contain saved data.');return;}
    setStatus(`Preparing ${label}…`);
    try{
      const data=await build();
      await shareFile(data,filename(data));
      setStatus(`Exported ${label}, including artwork.`);
    }catch(err){
      if(err?.name==='AbortError'){setStatus('');return;}
      console.error('[Character Library] Export failed.',err);
      setStatus(`Export failed: ${err.message||err}`);
    }
  }
  const exportEntry=id=>{
    const entry=registry.find(id);
    return runExport(entry?.name||'character',()=>packages.exportCharacter(id,core.characterCopySource),
      ()=>`SS-CHARACTER-${slug(entry?.name)}-${stamp()}.json`);
  };
  exportCurrentButton.addEventListener('click',()=>exportEntry(core.getState().characterId));
  exportAllButton.addEventListener('click',()=>runExport('all characters',
    ()=>packages.exportAll(core.characterCopySource),data=>`SS-CHARACTERS-ALL-${data.characters.length}-${stamp()}.json`));

  // ---- Open list actions ----------------------------------------------------
  list.addEventListener('change',event=>{
    const select=event.target.closest('select[data-action=category]');if(!select)return;
    registry.setCategory(select.dataset.characterId,select.value);
    setStatus('Category changed.');rerender();
  });
  list.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');if(!button)return;
    const id=button.dataset.characterId;
    const entry=allCharacters().find(item=>item.id===id);if(!entry)return;
    const action=button.dataset.action;
    if(action==='manage'){manageId=manageId===id?null:id;rerender();return;}
    if(action==='open'){
      // Distinguish a successful selection from a guarded (still-pending)
      // selection; a true return value previously hid that distinction.
      const result=core.selectCharacter(id);
      if(result==='pending'){
        status.dataset.pendingCharacter=id;
        setStatus(`Unsaved changes in ${core.getState().character.label}. Choose Save, Discard or Cancel to open ${entry.name}.`);
      }else if(result==='opened'){setPanel(null);setStatus(`${entry.name} is now loaded.`);}
      else if(result===false)setStatus(`Could not open ${entry.name}.`);
      refresh();return;
    }
    if(action==='up'||action==='down'){registry.move(id,action==='up'?-1:1);rerender();return;}
    if(action==='export'){await exportEntry(id);return;}
    if(action==='rename'){
      const proposed=window.prompt('Character name:',entry.name);
      if(proposed!==null)setStatus(core.renameCharacter(id,proposed)?'Character renamed.':'Save other edits before renaming.');
    }
    if(action==='delete'){
      if(entry.roles.length){setStatus(`Move the ${entry.roles.map(r=>r.name).join(' and ')} role to another character first.`);return;}
      if(window.confirm(`Delete “${entry.name}” from this device? This cannot be undone (an exported file can bring it back).`)){
        setStatus(core.deleteCharacter(id)?'Character deleted.':'Save other edits before deleting.');
      }
    }
    rerender();
  });
  // ---- Roles and categories actions ----------------------------------------
  organise.addEventListener('change',event=>{
    const role=event.target.closest('select[data-role-id]');
    if(role){registry.assignRole(role.dataset.roleId,role.value);setStatus('Role moved.');rerender();return;}
    const playable=event.target.closest('input[data-playable-category]');
    if(playable){registry.setCategoryPlayable(playable.dataset.playableCategory,playable.checked);rerender();}
  });
  organise.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    const ask=(label,value)=>{const v=window.prompt(label,value||'');return v===null?null:v;};
    if(b.id==='animlab-library-add-role'){
      const roleName=ask('New role name:');if(roleName===null)return;
      setStatus(registry.addRole(roleName,core.getState().characterId)?`Role added to ${core.getState().character.label}; move it with the list above.`:'Enter a role name.');
    }else if(b.dataset.renameRole){
      const role=registry.roles().find(r=>r.id===b.dataset.renameRole);
      const v=ask('Role name:',role?.name);if(v!==null)registry.renameRole(b.dataset.renameRole,v);
    }else if(b.id==='animlab-library-add-category'){
      const v=ask('New category name:');if(v!==null&&!registry.addCategory(v))setStatus('Enter a category name.');
    }else if(b.dataset.renameCategory){
      const c=registry.categories().find(x=>x.id===b.dataset.renameCategory);
      const v=ask('Category name:',c?.name);if(v!==null)registry.renameCategory(b.dataset.renameCategory,v);
    }else if(b.dataset.categoryUp)registry.moveCategory(b.dataset.categoryUp,-1);
    else if(b.dataset.categoryDown)registry.moveCategory(b.dataset.categoryDown,1);
    else if(b.dataset.removeCategory){
      if(!registry.removeCategory(b.dataset.removeCategory))setStatus('Only an empty category can be removed.');
    }else if(b.dataset.renameTemplate){
      const t=rigTemplates?.get(b.dataset.renameTemplate);
      const v=ask('Rig template name:',t?.name);if(v!==null)rigTemplates.rename(b.dataset.renameTemplate,v);
      core.redraw?.();
    }else if(b.dataset.removeTemplate){
      if(!rigTemplates?.remove(b.dataset.removeTemplate))setStatus('Only a template no character uses can be removed.');
    }
    rerender();
  });

  // ---- Import review: one choice per character in the file -----------------
  function reviewComplete(){
    return !!pendingImport && pendingImport.every(item=>item.choice) && pendingImport.some(item=>item.choice!=='skip');
  }
  function closeReview(){pendingImport=null;review.hidden=true;reviewList.replaceChildren();refresh();}
  function optionsFor(item){
    if(item.exists && item.replaceable)return [['','Choose…'],['replace','Replace the existing one'],['copy','Add as a copy'],['skip','Skip']];
    if(item.exists)return [['','Choose…'],['copy','Add as a copy'],['skip','Skip']];
    if(item.replaceable)return [['add','Add'],['copy','Add as a copy'],['skip','Skip']];
    return [['copy','Add as a copy'],['skip','Skip']];
  }
  function showReview(items){
    pendingImport=items.map(item=>({...item,choice:optionsFor(item)[0][0]}));
    reviewList.replaceChildren();
    pendingImport.forEach((item,index)=>{
      const row=document.createElement('label');row.className='animlab-library-review-row';
      const title=document.createElement('span');title.className='animlab-library-entry-name';title.textContent=item.name;
      const note=document.createElement('small');
      const parts=[item.exists?'Already on this device':'Not on this device',familyLabel(item.family)];
      if(item.sharedWith?.length)parts.push(`replacing also changes ${item.sharedWith.map(id=>registry.name(id)||id).join(', ')} (shared animations and collider)`);
      if(item.old)parts.push('older file without artwork: copy only');
      note.textContent=parts.join(' · ');title.appendChild(note);
      const select=document.createElement('select');select.setAttribute('aria-label',`Import choice for ${item.name}`);
      for(const [value,label] of optionsFor(item)){const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);}
      select.value=item.choice;
      select.addEventListener('change',()=>{pendingImport[index].choice=select.value;refresh();});
      row.append(title,select);reviewList.appendChild(row);
    });
    review.hidden=false;
    setStatus(`${items.length} character${items.length===1?'':'s'} in this file. Choose what to do with each, then Import.`);
    refresh();
  }
  importButton.addEventListener('click',()=>{if(!importButton.disabled)importInput.click();});
  importInput.addEventListener('change',async()=>{
    const file=importInput.files?.[0];importInput.value='';if(!file)return;
    if(file.size>80*1024*1024){setStatus('File too large (maximum 80 MB).');return;}
    try{showReview(packages.readFile(JSON.parse(await file.text())));}
    catch(err){closeReview();setStatus(`Could not import: ${err.message||'unreadable file'}`);}
  });
  reviewCancel.addEventListener('click',()=>{closeReview();setStatus('Import cancelled. Nothing was changed.');});
  reviewApply.addEventListener('click',async()=>{
    if(!reviewComplete()||core.getState().dirty)return;
    const replacing=pendingImport.filter(item=>item.choice==='replace');
    if(replacing.length && !window.confirm(`Replace ${replacing.map(item=>item.name).join(', ')} with the version in this file? The current saved version on this device will be overwritten. Export it first if you might want it back.`))return;
    reviewApply.disabled=true;
    try{
      const done=await packages.applyImport(pendingImport.map(item=>({item,action:item.choice})),core.importLibraryCharacterDocument);
      setStatus(`${done.join(' · ')}. Reloading Character Lab…`);
      // Every Character Lab module read its data at start-up; reload so they all
      // see the imported characters.
      setTimeout(()=>location.reload(),900);
    }catch(err){
      console.error('[Character Library] Import failed.',err);
      setStatus(`Import stopped: ${err.message||err}`);
      reviewApply.disabled=false;
    }
  });

  saveChanges.addEventListener('click',()=>{
    const legacy=document.getElementById('animlab-save');
    if(!legacy || legacy.disabled){refreshSave();return;}
    // Route through the existing Save transaction, including the important
    // Rebind+Save confirmation when the rig differs from its skin bind pose.
    legacy.click();
    refreshSave();
    if(!core.getState().dirty){setPanel(null);setStatus('Changes saved.');}
  });
  core.subscribe(refresh);
  refresh();
})();
