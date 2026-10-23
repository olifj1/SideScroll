/* SideScroll Character Lab — unified Character Library (v1.1.24).
   Built-ins and locally-authored characters have one Open / Edit / Save workflow.
   Legacy built-in storage and custom character library remain intentionally
   separate under the hood; do not migrate saved data during a UI tidy-up. */
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
      <label class="animlab-library-import">Import character JSON
        <input id="animlab-library-import" type="file" accept=".json,application/json" aria-label="Import character JSON">
      </label>
      <small class="animlab-library-footnote">Built-in characters remain part of the game. Your new characters save in this browser; export a JSON backup before clearing website data.</small>
      <div data-ss-lab="characters" class="animlab-library-import" style="border-top:1px solid rgba(150,200,190,.3);padding-top:9px;margin-top:8px">
        <strong>All Character Lab data</strong>
        <small>Backup all saved characters, built-in edits, animation clips, rigs and editor settings together. Image pixels are not included.</small>
        <button type="button" data-ss-export class="animlab-library-action">Export All Character Lab Data</button>
        <button type="button" data-ss-import class="animlab-library-action">Import All Character Lab Data</button>
        <input type="file" data-ss-import-file accept=".json,application/json" hidden>
        <small data-ss-status role="status" aria-live="polite"></small>
      </div>
    </div>
    <div class="animlab-library-panel" id="animlab-library-save" hidden>
      <div class="animlab-library-panel-heading"><strong>Save character</strong><button type="button" data-library-close aria-label="Close Save character">×</button></div>
      <div id="animlab-library-save-caption" class="animlab-library-footnote"></div>
      <button id="animlab-library-save-changes" type="button" class="animlab-library-create">Save changes</button>
      <button id="animlab-library-export-current" type="button" class="animlab-library-action" hidden>Export character JSON</button>
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
  const exportCurrent=$('animlab-library-export-current');
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
    // Custom entries and shipped Fox can both export from the Save context.
    exportCurrent.hidden=!(state.character?.library || state.characterId==='fox');
    exportCurrent.textContent=state.characterId==='fox'?'Export Fox handoff JSON':'Export character JSON';
    exportCurrent.disabled=!!state.dirty;
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
    importInput.disabled=dirty||state.mode==='play'||customCount>=24;
    const importAll=section.querySelector('[data-ss-lab=characters] [data-ss-import]');
    if(importAll)importAll.disabled=dirty||state.mode==='play';
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
      actions.append(open);
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
        const exported=makeButton('Export','export',entry);
        rename.disabled=dirty||state.mode==='play';remove.disabled=dirty||state.mode==='play';
        management.append(exported,rename,remove);row.append(management);
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

  async function exportEntry(id){
    const data=core.exportLibraryCharacterDocument(id);
    if(!data){setStatus('Could not export this character.');return;}
    const json=JSON.stringify(data,null,2),filename=`SS-CHAR-${id}.json`;
    const file=typeof File==='function'?new File([json],filename,{type:'application/json'}):null;
    try{
      if(file && navigator.share && navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file]});
      }else{
        const blob=new Blob([json],{type:'application/json'});
        const url=URL.createObjectURL(blob),link=document.createElement('a');
        link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),5000);
      }
      setStatus('Exported saved character data (artwork pixels are not included).');
    }catch(err){if(err?.name!=='AbortError')setStatus('Export failed. Please try again.');}
  }
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
    if(file.size>1024*1024){setStatus('File too large (maximum 1 MB).');return;}
    try{
      const data=JSON.parse(await file.text());
      const id=core.importLibraryCharacterDocument(data);
      setStatus(id?'Character imported with a separate library ID.':'Unable to import. Save edits first or check the file.');
    }catch(err){setStatus('Could not read the character JSON file.');}
    listSignature='';refresh();
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
  exportCurrent.addEventListener('click',async()=>{
    const state=core.getState();
    if(state.dirty)return;
    if(state.character?.library) await exportEntry(state.characterId);
    else if(state.characterId==='fox') await core.exportFoxHandoffBundle?.();
  });
  core.subscribe(refresh);
  refresh();
})();
