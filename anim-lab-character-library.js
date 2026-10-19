/* SideScroll Anim Lab — Character Library editor surface (v1.0.199).
   Entries are independent authoring documents stored locally. Only bundled
   starter atlases are referenced; no uploaded artwork/runtime promotion yet. */
(() => {
  'use strict';
  const core=window.AnimLabCore;
  const drawer=document.querySelector('.animlab-drawer');
  const builtin=document.getElementById('animlab-character-row')?.closest('.animlab-section');
  if(!core?.getLibraryCharacters || !drawer || !builtin)return;
  const section=document.createElement('section');
  section.className='animlab-section animlab-character-library';
  section.id='animlab-character-library';
  section.setAttribute('aria-labelledby','animlab-library-title');
  section.innerHTML=`
    <div class="animlab-section-title" id="animlab-library-title">Character Library</div>
    <div class="animlab-library-body">
      <div class="animlab-library-intro">Create an independent character using a starter rig and temporary artwork. Your Fox and Hero originals are protected.</div>
      <label class="animlab-library-field">Name
        <input id="animlab-library-name" type="text" placeholder="New character name" maxlength="42" autocomplete="off" aria-label="New character name">
      </label>
      <label class="animlab-library-field">Starter rig
        <select id="animlab-library-family" aria-label="Starter rig family">
          <option value="fox">Quadruped — Parts / Rig / Skin / Animate / Play</option>
          <option value="original">Biped — Setup / Animate (Parts/Skin pending)</option>
        </select>
      </label>
      <button class="animlab-library-create" id="animlab-library-create" type="button">Create Character</button>
      <div class="animlab-library-status" id="animlab-library-status" role="status"></div>
      <div class="animlab-library-list" id="animlab-library-list" aria-label="Saved characters"></div>
      <label class="animlab-library-import">Import character JSON (previously exported)
        <input id="animlab-library-import" type="file" accept=".json,application/json" aria-label="Import character JSON">
      </label>
      <small class="animlab-library-footnote">Stored on this device only. A new character is not selectable in the game yet; export/import and new artwork follow in later stages.</small>
    </div>`;
  drawer.insertBefore(section,builtin);
  const name=section.querySelector('#animlab-library-name');
  const family=section.querySelector('#animlab-library-family');
  const create=section.querySelector('#animlab-library-create');
  const status=section.querySelector('#animlab-library-status');
  const list=section.querySelector('#animlab-library-list');
  const setStatus=t=>{status.textContent=t;};

  function makeButton(label,action,entry){
    const b=document.createElement('button');
    b.type='button';b.textContent=label;b.className='animlab-library-action';
    b.dataset.action=action;b.dataset.characterId=entry.id;
    return b;
  }
  let listSignature='';
  function refresh(state=core.getState()) {
    const entries=core.getLibraryCharacters();
    const dirty=!!state.dirty;
    // Called during animation redraws: avoid rebuilding buttons/DOM at 60fps.
    const signature=JSON.stringify({id:state.characterId,mode:state.mode,dirty,
      entries:entries.map(e=>[e.id,e.name,e.family])});
    if(signature===listSignature)return;
    listSignature=signature;
    create.disabled=dirty || state.mode==='play' || entries.length>=24;
    section.querySelector('#animlab-library-import').disabled=dirty||state.mode==='play'||entries.length>=24;
    list.replaceChildren();
    if(!entries.length){
      const empty=document.createElement('div');empty.className='animlab-library-empty';
      empty.textContent='No custom characters yet.';list.appendChild(empty);
    }
    for(const entry of entries){
      const row=document.createElement('div');row.className='animlab-library-entry';
      if(state.characterId===entry.id)row.classList.add('is-selected');
      const title=document.createElement('div');title.className='animlab-library-entry-name';
      title.textContent=entry.name;
      const sub=document.createElement('small');sub.textContent=entry.family==='fox'?'Quadruped':'Biped';
      title.appendChild(sub);row.appendChild(title);
      const actions=document.createElement('div');actions.className='animlab-library-actions';
      const open=makeButton(state.characterId===entry.id?'Editing':'Open','open',entry);
      open.disabled=state.mode==='play'||state.characterId===entry.id;
      actions.appendChild(open);
      const rename=makeButton('Rename','rename',entry),remove=makeButton('Delete','delete',entry);
      rename.disabled=dirty||state.mode==='play';remove.disabled=dirty||state.mode==='play';
      const exported=makeButton('Export','export',entry);
      actions.append(exported,rename,remove);row.appendChild(actions);list.appendChild(row);
    }
    if(!status.textContent){
      setStatus(dirty?'Save or Discard before creating, renaming or deleting a character.':
        state.character.library?'Editing an independent library character.':'Editing a built-in character.');
    }
  }
  create.addEventListener('click',()=>{
    const id=core.createLibraryCharacter(name.value,family.value);
    if(!id){setStatus('Enter a name, and Save or Discard other edits first.');return;}
    name.value='';setStatus('Character created and opened. Parts, rig and clips are separate from built-in characters.');
    refresh();
  });
  name.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();create.click();}
  });
  list.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');if(!button)return;
    const id=button.dataset.characterId;
    const entry=core.getLibraryCharacters().find(item=>item.id===id);if(!entry)return;
    const action=button.dataset.action;
    if(action==='open')core.selectCharacter(id);
    if(action==='export'){
      const data=core.exportLibraryCharacterDocument(id);
      if(data){
        const text=JSON.stringify(data,null,2);
        const filename=`SS-CHAR-${id}.json`;
        const file=typeof File==='function'?new File([text],filename,{type:'application/json'}):null;
        try{
          if(file && navigator.share && navigator.canShare?.({files:[file]})){
            await navigator.share({files:[file]});
          }else{
            const blob=new Blob([text],{type:'application/json'});
            const url=URL.createObjectURL(blob);
            const link=document.createElement('a');link.href=url;
            link.download=filename;document.body.appendChild(link);link.click();link.remove();
            setTimeout(()=>URL.revokeObjectURL(url),5000);
          }
          setStatus('Exported saved character data (no artwork pixels).');
        }catch(err){if(err?.name!=='AbortError')setStatus('Export failed. Please try again.');}
      }
    }
    if(action==='rename'){
      const proposed=window.prompt('Character name:',entry.name);
      if(proposed!==null){
        if(!core.renameLibraryCharacter(id,proposed))setStatus('Could not rename. Save other edits first.');
        else setStatus('Character renamed.');
      }
    }
    if(action==='delete'){
      if(window.confirm(`Delete “${entry.name}” from this device? This cannot be undone.`)){
        if(!core.deleteLibraryCharacter(id))setStatus('Could not delete. Save other edits first.');
        else setStatus('Character deleted. Built-in characters are unchanged.');
      }
    }
    refresh();
  });
  const importInput=section.querySelector('#animlab-library-import');
  importInput.addEventListener('change',async()=>{
    const file=importInput.files?.[0];
    importInput.value='';
    if(!file)return;
    if(file.size>1024*1024){setStatus('File too large (maximum 1 MB).');return;}
    try{
      const data=JSON.parse(await file.text());
      const id=core.importLibraryCharacterDocument(data);
      setStatus(id?'Character imported as a separate library entry.':'Unable to import. Save edits first, or check that this is a character export.');
    }catch(err){setStatus('Could not read the character JSON file.');}
    refresh();
  });
  core.subscribe(refresh);
  refresh();
})();
