/* SideScroll Character Lab — unified Character Library.
   Every character (Hero 1, Hero 2, Fox and library characters) has the same
   Open / Export workflow; Export all and Import (Replace / Add as copy / Skip)
   cover backups, rollback and duplicates. Packaging lives in
   character-packages.js. Built-in and library storage remain separate under the
   hood; do not migrate saved data during a UI change. */
(() => {
  'use strict';
  const core=window.AnimLabCore;
  const drawer=document.querySelector('.animlab-drawer');
  const builtin=document.getElementById('animlab-character-row')?.closest('.animlab-section');
  if(!core?.getLibraryCharacters || !drawer || !builtin)return;
  // Retain the original buttons and event handlers for compatibility, but
  // remove their duplicate entry point: all characters now open via Load.
  builtin.hidden=true;
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
    <div class="animlab-library-toolbar" role="group" aria-label="Character Library actions">
      <button type="button" data-library-panel="new" aria-controls="animlab-library-new" aria-expanded="false">New</button>
      <button type="button" data-library-panel="load" aria-controls="animlab-library-load" aria-expanded="false">Load</button>
      <button type="button" data-library-panel="save" aria-controls="animlab-library-save" aria-expanded="false">Save</button>
    </div>
    <div class="animlab-library-status" id="animlab-library-status" role="status" hidden></div>
    <div class="animlab-library-panel" id="animlab-library-new" hidden>
      <div class="animlab-library-panel-heading"><strong>New character</strong><button type="button" data-library-close aria-label="Close New character">×</button></div>
      <label class="animlab-library-field">Name
        <input id="animlab-library-name" type="text" placeholder="Character name" maxlength="42" autocomplete="off" aria-label="New character name">
      </label>
      <label class="animlab-library-field">Starter rig
        <select id="animlab-library-family" aria-label="Starter rig family">
          <option value="fox">Quadruped — 20 Oct Fox starter</option>
          <option value="original">Biped — Setup / Animate</option>
        </select>
      </label>
      <button class="animlab-library-create" id="animlab-library-create" type="button">Create Character</button>
      <small class="animlab-library-footnote">Quadrupeds begin with the current Fox setup, rig, artwork placement, skin and clips. Characters can be selected in the game once their art and rig are playable on this device.</small>
    </div>
    <div class="animlab-library-panel" id="animlab-library-load" hidden>
      <div class="animlab-library-panel-heading"><strong>Open character</strong><button type="button" data-library-close aria-label="Close Load character">×</button></div>
      <div class="animlab-library-list" id="animlab-library-list" aria-label="Available characters"></div>
      <div class="animlab-library-transfer">
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
    </div>
    <div class="animlab-library-panel" id="animlab-library-save" hidden>
      <div class="animlab-library-panel-heading"><strong>Save character</strong><button type="button" data-library-close aria-label="Close Save character">×</button></div>
      <div id="animlab-library-save-caption" class="animlab-library-footnote"></div>
      <button id="animlab-library-save-changes" type="button" class="animlab-library-create">Save changes</button>
    </div>`;
  drawer.insertBefore(section,builtin);
  // iOS can give a vertically scrolling sidebar a few pixels of horizontal
  // overscroll when nested controls resize. Keep the drawer's X origin fixed.
  drawer.addEventListener('scroll',()=>{if(drawer.scrollLeft!==0)drawer.scrollLeft=0;},{passive:true});

  const $=id=>section.querySelector('#'+id);
  const name=$('animlab-library-name'),family=$('animlab-library-family');
  const create=$('animlab-library-create'),status=$('animlab-library-status');
  const list=$('animlab-library-list'),importInput=$('animlab-library-import');
  const saveChanges=$('animlab-library-save-changes');
  const exportAllButton=$('animlab-library-export-all'),importButton=$('animlab-library-import-button');
  const review=$('animlab-library-review'),reviewList=$('animlab-library-review-list');
  const reviewApply=$('animlab-library-review-apply'),reviewCancel=$('animlab-library-review-cancel');
  const packages=window.SideScrollCharacterPackages;
  let pendingImport=null;
  const saveCaption=$('animlab-library-save-caption');
  const currentName=$('animlab-library-current-name');
  const currentKind=$('animlab-library-current-kind');
  const BUILTINS=Object.freeze([
    {id:'original',name:'Hero 1',family:'human',builtIn:true},
    {id:'alternate',name:'Hero 2',family:'human',builtIn:true},
    {id:'fox',name:'Fox',family:'fox',builtIn:true}
  ]);
  function allCharacters(){return [...BUILTINS,...core.getLibraryCharacters()];}
  const toolbar=[...section.querySelectorAll('[data-library-panel]')];
  const panels=Object.fromEntries(['new','load','save'].map(key=>[key,$('animlab-library-'+key)]));
  let openPanel=null,manageId=null,listSignature='',lastCharacterId=null;

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
    if(openPanel==='load') {listSignature='';refresh();}
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
  function makeButton(label,action,entry){
    const b=document.createElement('button');b.type='button';
    b.textContent=label;b.className='animlab-library-action';
    b.dataset.action=action;b.dataset.characterId=entry.id;
    return b;
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
    const entries=allCharacters();
    const customCount=core.getLibraryCharacters().length;
    const dirty=!!state.dirty;
    currentName.textContent=state.character?.label||'Unknown character';
    currentKind.textContent=(state.character?.library?'Local character':'Built-in character')+(dirty?' · Unsaved changes':' · Saved');
    // Close Load only AFTER the selection really changed. This also handles
    // the asynchronous Save/Discard guard path; Cancel must leave Load open.
    if(lastCharacterId!==null && lastCharacterId!==state.characterId && openPanel) {
      setPanel(null);
      setStatus(`${state.character?.label||'Character'} is now loaded.`);
    }
    lastCharacterId=state.characterId;
    create.disabled=dirty||state.mode==='play'||customCount>=24;
    // Exports read saved data, so unsaved edits must be saved or discarded first.
    exportAllButton.disabled=dirty||state.mode==='play'||!packages;
    importButton.disabled=dirty||state.mode==='play'||!packages;
    reviewApply.disabled=dirty||state.mode==='play'||!reviewComplete();
    refreshSave(state);
    // The list is intentionally populated only when Load is opened, rather
    // than rebuilding buttons during animated viewport redraws.
    if(openPanel!=='load')return;
    const signature=JSON.stringify({id:state.characterId,mode:state.mode,dirty,manageId,
      entries:entries.map(e=>[e.id,e.name,e.family,e.builtIn])});
    if(signature===listSignature)return;
    listSignature=signature;
    list.replaceChildren();
    for(const entry of entries){
      const row=document.createElement('div');row.className='animlab-library-entry';
      if(state.characterId===entry.id)row.classList.add('is-selected');
      const title=document.createElement('div');title.className='animlab-library-entry-name';
      title.textContent=entry.name;
      const sub=document.createElement('small');sub.textContent=(entry.builtIn?'Built-in · ':'Local · ')+(entry.family==='fox'?'Quadruped':'Biped');
      title.appendChild(sub);row.appendChild(title);
      const actions=document.createElement('div');actions.className='animlab-library-actions';
      const open=makeButton(state.characterId===entry.id?'Loaded':'Open','open',entry);
      open.disabled=state.characterId===entry.id;
      const exported=makeButton('Export','export',entry);
      exported.disabled=dirty||state.mode==='play'||!packages;
      exported.setAttribute('aria-label',`Export ${entry.name}`);
      actions.append(open,exported);
      if(!entry.builtIn){
        const manage=makeButton('•••','manage',entry);
        manage.setAttribute('aria-label',`Manage ${entry.name}`);
        manage.setAttribute('aria-expanded',String(manageId===entry.id));
        actions.append(manage);
      }
      row.append(actions);
      if(!entry.builtIn && manageId===entry.id){
        const management=document.createElement('div');management.className='animlab-library-management';
        const rename=makeButton('Rename','rename',entry),remove=makeButton('Delete','delete',entry);
        rename.disabled=dirty||state.mode==='play';remove.disabled=dirty||state.mode==='play';
        management.append(rename,remove);row.append(management);
      }
      list.appendChild(row);
    }
  }
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
    const entry=allCharacters().find(item=>item.id===id);
    return runExport(entry?.name||'character',()=>packages.exportCharacter(id,core.characterCopySource),
      ()=>`SS-CHARACTER-${slug(entry?.name)}-${stamp()}.json`);
  };
  exportAllButton.addEventListener('click',()=>runExport('all characters',
    ()=>packages.exportAll(core.characterCopySource),data=>`SS-CHARACTERS-ALL-${data.characters.length}-${stamp()}.json`));

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
      const parts=[item.exists?'Already on this device':'Not on this device',item.family==='fox'?'Quadruped':'Biped'];
      if(item.sharedWith?.length)parts.push(`replacing also changes ${item.sharedWith.map(id=>allCharacters().find(c=>c.id===id)?.name||id).join(', ')} (shared animations and collider)`);
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
  list.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');if(!button)return;
    const id=button.dataset.characterId;
    const entry=allCharacters().find(item=>item.id===id);if(!entry)return;
    const action=button.dataset.action;
    if(action==='manage'){
      manageId=manageId===id?null:id;listSignature='';refresh();return;
    }
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
    if(action==='export')await exportEntry(id);
    if(action==='rename'){
      const proposed=window.prompt('Character name:',entry.name);
      if(proposed!==null){
        if(!core.renameLibraryCharacter(id,proposed))setStatus('Save other edits before renaming.');
        else setStatus('Character renamed.');
      }
    }
    if(action==='delete'){
      if(window.confirm(`Delete “${entry.name}” from this device? This cannot be undone.`)){
        if(!core.deleteLibraryCharacter(id))setStatus('Save other edits before deleting.');
        else setStatus('Character deleted. Built-in characters are unchanged.');
      }
    }
    listSignature='';refresh();
  });
  importInput.addEventListener('change',async()=>{
    const file=importInput.files?.[0];importInput.value='';if(!file)return;
    if(file.size>80*1024*1024){setStatus('File too large (maximum 80 MB).');return;}
    try{showReview(packages.readFile(JSON.parse(await file.text())));}
    catch(err){closeReview();setStatus(`Could not import: ${err.message||'unreadable file'}`);}
  });
  saveChanges.addEventListener('click',()=>{
    const original=document.getElementById('animlab-save');
    if(!original || original.disabled){refreshSave();return;}
    // Route through the existing Save transaction, including the important
    // Rebind+Save confirmation when the rig differs from its skin bind pose.
    original.click();
    refreshSave();
    if(!core.getState().dirty){setPanel(null);setStatus('Changes saved.');}
  });
  core.subscribe(refresh);
  refresh();
})();
