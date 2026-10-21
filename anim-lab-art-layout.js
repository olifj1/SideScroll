(function(){
  'use strict';

  const core=window.AnimLabCore;
  const canvas=document.getElementById('animlab-canvas');
  const setupSection=document.getElementById('animlab-setup-section');
  if(!core||!canvas||!setupSection)return;

  const section=document.createElement('section');
  section.className='animlab-section animlab-art-layout-controls';
  section.hidden=true;
  section.innerHTML=`
    <div class="animlab-section-title">Parts · character assembly</div>
    <div class="animlab-parts-caption">Assembled parts <span class="animlab-parts-selection-count" aria-live="polite"></span></div>
    <div class="animlab-part-inventory-actions">
      <button type="button" data-part-manage="add">Add</button>
      <button type="button" data-part-manage="multi" aria-pressed="false">Multi-select: Off</button>
      <button type="button" data-part-manage="delete">Delete selected</button>
      <button type="button" data-part-manage="all">Select all</button>
      <button type="button" data-part-manage="clear">Clear all</button>
    </div>
    <div class="animlab-art-part-board" aria-label="Assembled parts (name to select; Hide, Solo and Lock affect display and editing)"></div>
    <div class="animlab-atlas-control-group animlab-parts-editor">
      <div class="animlab-atlas-group-label">Edit selected part</div>
      <div class="animlab-rig-selected animlab-art-selected">
        <div class="animlab-rig-selected-title">No part selected</div>
        <div class="animlab-rig-selected-pos"></div>
      </div>
      <p class="animlab-parts-multi-hint" aria-live="polite">Tap a part to edit it. Enable Multi-select to build a group.</p>
      <div class="animlab-parts-subgroup-label">Transform</div>
      <div class="animlab-segmented animlab-art-transform-row">
        <button type="button" data-art-transform="move">Move</button>
        <button type="button" data-art-transform="rotate">Rotate</button>
        <button type="button" data-art-transform="scale">Scale</button>
        <button type="button" data-art-transform="pivot">Pivot</button>
      </div>
      <div class="animlab-precision-row animlab-rig-axis animlab-art-axis">
        <button type="button" data-art-axis="free">Free</button>
        <button type="button" data-art-axis="x">X only</button>
        <button type="button" data-art-axis="y">Y only</button>
        <button type="button" data-art-fine="1">Fine</button>
      </div>
      <div class="animlab-art-numeric-grid" aria-label="Selected part transform values">
        <label>X <input type="number" data-art-number="x" inputmode="decimal" step="0.01"></label>
        <label>Y <input type="number" data-art-number="y" inputmode="decimal" step="0.01"></label>
        <label>Rotation ° <input type="number" data-art-number="rotation" inputmode="decimal" step="0.5"></label>
        <label>Width <input type="number" data-art-number="scaleX" inputmode="decimal" min="0.25" max="3" step="0.01"></label>
        <label>Height <input type="number" data-art-number="scaleY" inputmode="decimal" min="0.25" max="3" step="0.01"></label>
        <label>Pivot X <input type="number" data-art-number="pivotX" inputmode="decimal" step="0.01"></label>
        <label>Pivot Y <input type="number" data-art-number="pivotY" inputmode="decimal" step="0.01"></label>
      </div>
      <p class="animlab-art-layout-note">Drag the existing right thumb pad to edit. The viewport pans and zooms without moving parts.</p>
      <div class="animlab-parts-subgroup-label">Layer order</div>
      <div class="animlab-view-grid animlab-art-order-buttons">
        <button type="button" data-art-action="back">Send Back</button>
        <button type="button" data-art-action="forward">Bring Forward</button>
        <button type="button" data-art-action="bottom">To Back</button>
        <button type="button" data-art-action="top">To Front</button>
      </div>
      <div class="animlab-parts-subgroup-label">Manage</div>
      <div class="animlab-atlas-tools three animlab-parts-manage-buttons">
        <button type="button" data-part-edit="rename">Rename</button>
        <button type="button" data-part-edit="duplicate">Duplicate</button>
        <button type="button" data-part-edit="remove">Delete</button>
        <button type="button" data-art-action="reset-part">Reset part</button>
        <button type="button" data-art-action="reset-layout">Reset layout</button>
        <button type="button" data-art-action="show-all">Show all</button>
      </div>
    </div>
    <details class="animlab-atlas-control-group animlab-parts-advanced">
      <summary class="animlab-atlas-group-label">Advanced · transform clipboard and reference</summary>
      <div class="animlab-art-clipboard-tools">
        <div class="animlab-view-grid animlab-art-clipboard-buttons">
          <button type="button" data-art-action="copy">Copy Part</button>
          <button type="button" data-art-action="paste">Paste All</button>
          <button type="button" data-art-action="paste-position">Paste Position</button>
          <button type="button" data-art-action="paste-rotation">Paste Rotation</button>
          <button type="button" data-art-action="paste-scale">Paste Scale</button>
          <button type="button" data-art-action="paste-pivot">Paste Pivot</button>
          <button type="button" data-art-action="copy-pair">Copy Selected Part → Pair</button>
          <button type="button" data-art-action="copy-both-near-far">Both Legs Near → Far</button>
          <button type="button" data-art-action="copy-both-far-near">Both Legs Far → Near</button>
        </div>
      </div>
      <div class="animlab-art-reference-tools">
        <div class="animlab-view-grid animlab-art-reference-buttons">
          <button type="button" data-art-action="reference">Show Reference</button>
          <button type="button" data-art-action="difference">Difference: Off</button>
        </div>
        <label class="animlab-slider"><span>Reference opacity</span><input type="range" data-art-reference-opacity min="0.05" max="1" step="0.01"><output></output></label>
        <button type="button" data-art-action="align-reference">Align Reference</button>
      </div>
      <div class="animlab-art-layer-tools" hidden>
        <div class="animlab-view-grid animlab-art-visibility-buttons">
          <button type="button" data-art-action="toggle-visible">Hide Part</button>
          <button type="button" data-art-action="solo">Solo: Off</button>
        </div>
      </div>
    </details>
  `;
  const rigSection=document.querySelector('.animlab-rig-controls');
  (rigSection||setupSection).insertAdjacentElement('afterend',section);

  const board=section.querySelector('.animlab-art-part-board');
  const addDialog=document.createElement('dialog');
  addDialog.className='animlab-parts-add-dialog';
  addDialog.setAttribute('aria-label','Add Atlas parts');
  addDialog.innerHTML=`<form method="dialog" class="animlab-parts-add-content">
    <div class="animlab-section-title">Add parts from Atlas</div>
    <p>Choose one, several, or all saved source meshes. Source meshes are not copied or deleted.</p>
    <div class="animlab-parts-add-options"></div>
    <div class="animlab-parts-add-actions"><button type="button" data-add-action="all">Select all</button><button type="button" data-add-action="none">None</button></div>
    <div class="animlab-parts-add-actions"><button type="button" data-add-action="create">Create</button><button type="button" data-add-action="cancel">Cancel</button></div>
  </form>`;
  document.body.appendChild(addDialog);
  const addOptions=addDialog.querySelector('.animlab-parts-add-options');
  const selectedTitle=section.querySelector('.animlab-rig-selected-title');
  const selectedPos=section.querySelector('.animlab-rig-selected-pos');
  const transformButtons=[...section.querySelectorAll('[data-art-transform]')];
  const axisButtons=[...section.querySelectorAll('[data-art-axis]')];
  const fineButton=section.querySelector('[data-art-fine]');
  const referenceButton=section.querySelector('[data-art-action="reference"]');
  const differenceButton=section.querySelector('[data-art-action="difference"]');
  const referenceOpacity=section.querySelector('[data-art-reference-opacity]');
  const viewportPadHost=document.getElementById('animlab-viewport-pad-host');
  const pad=document.createElement('div');
  pad.className='animlab-precision-pad animlab-viewport-precision-pad animlab-art-layout-pad';
  pad.setAttribute('role','application');
  pad.setAttribute('aria-label','Precision bind art transform');
  pad.innerHTML='<i class="animlab-pad-x"></i><i class="animlab-pad-y"></i><span>Move selected part</span>';
  if(viewportPadHost)viewportPadHost.appendChild(pad);
  pad.hidden=true;

  let selectedPart=null;
  const markedParts=new Set();
  let multiSelect=false;
  let boardSignature='';
  let displayCharacter=null;
  let transformMode='move';
  let axis='free';
  let fine=false;
  let lastDescriptor=null;
  let lastRender=null;
  let viewportDrag=null;
  let precisionDrag=null;
  let queuedDragPoint=null,queuedDragFrame=0;
  let soloPart=null; // display-only: never written into Setup or exported
  const hiddenParts=new Set(); // display-only: Hide/Show never dirty authored data
  const lockedParts=new Set(); // editor-only, like Atlas locks; never affects exports
  let showOutlines = true;
  let clipboard=null; // editor-only, available between part selections

  const clone=v=>JSON.parse(JSON.stringify(v));
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const DEG=Math.PI/180;

  function state(){return core.getState();}
  function rawDescriptor(s){return s?.mode==='setup'&&s?.setupTool==='art'&&s?.rig?.ART_LAYOUT_DESIGNER||null;}
  function isAssembly(s){return s?.setup?.artLayout?.assembly?.enabled===true;}
  function instances(s){return s?.setup?.artLayout?.assembly?.instances||[];}
  function meshNames(){return new Map((window.AnimLabAtlasInspect?.getDocument?.()?.meshes||[]).map(m=>[m.id,m.name]));}
  function instanceName(item){
    const legacy=item.meshId.startsWith('atlas-builtin-');
    if(item.nameOverride)return item.nameOverride;
    return legacy?item.label:(meshNames().get(item.meshId)||`Missing: ${item.label||item.meshId}`);
  }
  function descriptorFor(s){
    const base=rawDescriptor(s);if(!base||!isAssembly(s))return base;
    return {...base,parts:instances(s).map(item=>({id:item.id,label:instanceName(item),pivot:{x:0,y:0},sourceRect:null}))};
  }
  function layoutFor(s){return s?.setup?.artLayout?.parts?s.setup.artLayout:null;}
  function isActive(s){return !!(descriptorFor(s)&&layoutFor(s));}
  function partById(desc,id){return desc?.parts?.find(part=>part.id===id)||null;}
  function transformFor(s,id){
    const raw=(isAssembly(s)?instances(s).find(v=>v.id===id):layoutFor(s)?.parts?.[id])||{};
    const scale=Number(raw.scale)||1;
    return {x:Number(raw.x)||0,y:Number(raw.y)||0,rotation:Number(raw.rotation)||0,
      scaleX:Number(raw.scaleX)||scale,scaleY:Number(raw.scaleY)||scale,
      pivotX:Number.isFinite(Number(raw.pivotX))?Number(raw.pivotX):0,
      pivotY:Number.isFinite(Number(raw.pivotY))?Number(raw.pivotY):0};
  }

  function ensureSelection(s,desc){
    const valid=new Set((desc?.parts||[]).map(p=>p.id));
    for(const id of markedParts)if(!valid.has(id))markedParts.delete(id);
    for(const id of lockedParts)if(!valid.has(id))lockedParts.delete(id);
    for(const id of hiddenParts)if(!valid.has(id))hiddenParts.delete(id);
    if(soloPart&&!valid.has(soloPart))soloPart=null;
    if(selectedPart&&valid.has(selectedPart))return;
    selectedPart=desc?.parts?.[0]?.id||null;
    if(!multiSelect){markedParts.clear();if(selectedPart)markedParts.add(selectedPart);}
  }

  function renderBoard(desc){
    const signature=JSON.stringify((desc?.parts||[]).map(p=>[p.id,p.label]));
    if(boardSignature===signature&&board.childElementCount===(desc?.parts||[]).length)return;
    boardSignature=signature;board.replaceChildren();
    for(const part of desc?.parts||[]){
      const row=document.createElement('div');row.className='animlab-parts-row';row.dataset.partRow=part.id;
      const name=document.createElement('button');name.type='button';name.dataset.artPart=part.id;
      name.className='animlab-parts-name';name.setAttribute('aria-label',`Select ${part.label}`);
      name.addEventListener('click',()=>{
        selectedPart=part.id;
        if(multiSelect){
          if(markedParts.has(part.id))markedParts.delete(part.id);else markedParts.add(part.id);
          if(!markedParts.size){selectedPart=null;}
          else if(!markedParts.has(selectedPart))selectedPart=[...markedParts][markedParts.size-1];
        }else{markedParts.clear();markedParts.add(part.id);}
        renderUI();core.redrawOnly?.();
      });
      row.appendChild(name);
      for(const kind of ['hide','solo','lock']){
        const button=document.createElement('button');button.type='button';button.dataset.partRowAction=kind;
        button.setAttribute('aria-label',`${kind} ${part.label}`);
        button.textContent=kind[0].toUpperCase()+kind.slice(1);
        button.addEventListener('click',()=>{
          const id=part.id;
          if(kind==='hide'){
            if(hiddenParts.has(id))hiddenParts.delete(id);else hiddenParts.add(id);
          }else if(kind==='solo'){
            if(soloPart!==id)hiddenParts.delete(id);
            soloPart=soloPart===id?null:id;
          }else{
            if(lockedParts.has(id))lockedParts.delete(id);else lockedParts.add(id);
          }
          renderUI();core.redrawOnly?.();
        });
        row.appendChild(button);
      }
      board.appendChild(row);
    }
  }

  const assemblyId=()=>`atlas-part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  // On first structural edit, convert the visible original six into normal
  // inventory entries. The old layout is kept only for backwards data reading;
  // there is no competing 'Use Atlas / Show originals' mode in the UI.
  function ensureInventory(setup){
    if(!setup.artLayout)return null;
    const previous=setup.artLayout.assembly;
    if(previous?.enabled)return previous;
    if(previous?.instances?.length){previous.enabled=true;return previous;}
    const base=rawDescriptor(state());
    const instances=(base?.parts||[]).map(part=>{
      const tr=setup.artLayout.parts?.[part.id]||{};
      return {id:`atlas-part-builtin-${part.id}`,meshId:`atlas-builtin-${part.id}`,
        label:part.label||part.id,x:tr.x||0,y:tr.y||0,rotation:tr.rotation||0,
        scaleX:tr.scaleX||1,scaleY:tr.scaleY||1,
        pivotX:tr.pivotX||0,pivotY:tr.pivotY||0};
    });
    setup.artLayout.assembly={schema:'animlab.parts-assembly.v1',enabled:true,instances};
    return setup.artLayout.assembly;
  }
  function inventoryEdit(label,update){
    core.edit('setup',label,setup=>{
      const group=ensureInventory(setup);if(group)update(group.instances);
      return setup;
    });
  }
  function openAdd(){
    const available=window.AnimLabAtlasInspect?.getDocument?.()?.meshes||[];
    addOptions.replaceChildren();
    for(const mesh of available){
      const label=document.createElement('label');
      const check=document.createElement('input');check.type='checkbox';check.value=mesh.id;
      const caption=document.createElement('span');caption.textContent=mesh.name||mesh.id;
      label.append(check,caption);addOptions.append(label);
    }
    if(!available.length){
      const msg=document.createElement('p');msg.textContent='No saved Atlas meshes available. Create and save meshes in Atlas first.';
      addOptions.append(msg);
    }
    addDialog.dataset.characterId=state().characterId;
    addDialog.showModal();
  }
  addDialog.addEventListener('click',e=>{
    const action=e.target.closest('[data-add-action]')?.dataset.addAction;if(!action)return;
    if(action==='cancel'){addDialog.close();return;}
    const inputs=[...addOptions.querySelectorAll('input[type="checkbox"]')];
    if(action==='all'||action==='none'){inputs.forEach(c=>c.checked=action==='all');return;}
    if(action==='create'){
      const selected=new Set(inputs.filter(c=>c.checked).map(c=>c.value));
      const meshes=(window.AnimLabAtlasInspect?.getDocument?.()?.meshes||[]).filter(m=>selected.has(m.id));
      if(!meshes.length)return;
      const ids=meshes.map(()=>assemblyId());
      inventoryEdit(`Add ${meshes.length} Atlas parts`,items=>{
        meshes.forEach((m,i)=>{
          if(items.length>=64)return;
          items.push({id:ids[i],meshId:m.id,label:m.name||'Atlas part',x:0,y:0,rotation:0,scaleX:1,scaleY:1,pivotX:0,pivotY:0});
        });
      });
      markedParts.clear();selectedPart=ids[0];markedParts.add(ids[0]);
      addDialog.close();renderUI();
    }
  });
  function editSelectedPart(name){
    const s=state(),desc=descriptorFor(s),part=partById(desc,selectedPart);
    if(!part||lockedParts.has(selectedPart))return;
    if(name==='rename'){
      const old=part.label;
      const proposed=window.prompt('Name this assembled part (Atlas source is unchanged):',old);
      if(proposed===null)return;
      const renamed=proposed.trim().replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,70);
      if(!renamed||renamed===old)return;
      inventoryEdit(`Rename assembled part ${old}`,items=>{
        const item=items.find(p=>p.id===selectedPart||p.meshId===`atlas-builtin-${selectedPart}`);
        if(item)item.nameOverride=renamed;
      });
      renderUI();return;
    }
    if(name==='duplicate'){
      const id=assemblyId();
      const source=isAssembly(s)?instances(s).find(p=>p.id===selectedPart):null;
      inventoryEdit(`Duplicate assembled part ${part.label}`,items=>{
        const original=source||items.find(p=>p.meshId===`atlas-builtin-${selectedPart}`);
        if(!original||items.length>=64)return;
        const at=items.findIndex(p=>p.id===original.id);
        const copy=clone(original);copy.id=id;copy.x=clamp(copy.x+.045,-3,3);
        items.splice(at+1,0,copy);
      });
      selectedPart=id;markedParts.clear();markedParts.add(id);renderUI();return;
    }
    if(name==='remove'){
      const id=selectedPart;
      inventoryEdit(`Delete assembled part ${part.label}`,items=>{
        const idx=items.findIndex(p=>p.id===id||p.meshId===`atlas-builtin-${id}`);
        if(idx>=0)items.splice(idx,1);
      });
      markedParts.delete(id);selectedPart=null;hiddenParts.delete(id);lockedParts.delete(id);
      if(soloPart===id)soloPart=null;
      renderUI();return;
    }
  }
  section.querySelectorAll('[data-part-edit]').forEach(button=>button.addEventListener('click',()=>editSelectedPart(button.dataset.partEdit)));
  section.querySelectorAll('[data-part-manage]').forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.partManage,desc=descriptorFor(state());
    if(name==='add'){openAdd();return;}
    if(name==='multi'){
      multiSelect=!multiSelect;
      if(!multiSelect){markedParts.clear();if(selectedPart)markedParts.add(selectedPart);}
      renderUI();return;
    }
    if(name==='all'){
      const all=(desc?.parts||[]).map(p=>p.id);
      multiSelect=true;
      if(all.every(id=>markedParts.has(id)))markedParts.clear();
      else all.forEach(id=>markedParts.add(id));
      selectedPart=markedParts.size?[...markedParts][0]:null;renderUI();return;
    }
    if(name==='delete'){
      if(!markedParts.size)return;
      if([...markedParts].some(id=>lockedParts.has(id))){window.alert('Unlock selected parts before deleting them.');return;}
      const removed=new Set(markedParts);
      inventoryEdit(`Delete ${removed.size} assembled parts`,items=>{
        for(let i=items.length-1;i>=0;i--){
          const oldId=items[i].meshId.replace(/^atlas-builtin-/, '');
          if(removed.has(items[i].id)||removed.has(oldId))items.splice(i,1);
        }
      });
      markedParts.clear();selectedPart=null;renderUI();return;
    }
    if(name==='clear'){
      if(!desc?.parts?.length)return;
      if(desc.parts.some(p=>lockedParts.has(p.id))){window.alert('Unlock the parts before clearing the assembly.');return;}
      if(!window.confirm(`Clear all ${desc.parts.length} assembled parts? Atlas source meshes are not deleted. Undo is available.`))return;
      inventoryEdit('Clear all assembled parts',items=>{items.length=0;});
      markedParts.clear();selectedPart=null;renderUI();
    }
  }));

  function sourcePixelToLocal(desc,px,py){
    const source=desc?.source||{};const ppu=Number(source.pixelsPerLocal)||1;
    return {x:(px-(Number(source.originX)||0))/ppu,y:((Number(source.groundY)||0)-py)/ppu};
  }

  function applyTransform(point,part,transform){
    const pivot={x:Number.isFinite(transform.pivotX)?transform.pivotX:(part?.pivot?.x||0),
      y:Number.isFinite(transform.pivotY)?transform.pivotY:(part?.pivot?.y||0)};
    const dx=point.x-pivot.x,dy=point.y-pivot.y;
    const c=Math.cos(Number(transform.rotation)||0),sn=Math.sin(Number(transform.rotation)||0);
    const sx=Number(transform.scaleX)||1,sy=Number(transform.scaleY)||1;
    return {
      x:pivot.x+(Number(transform.x)||0)+dx*sx*c-dy*sy*sn,
      y:pivot.y+(Number(transform.y)||0)+dx*sx*sn+dy*sy*c
    };
  }

  function partCornersLocal(desc,part,transform){
    const r=part.sourceRect||{};const x=Number(r.x)||0,y=Number(r.y)||0,w=Number(r.width)||0,h=Number(r.height)||0;
    return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>applyTransform(sourcePixelToLocal(desc,px,py),part,transform));
  }

  function project(point,view){return{x:view.cx+point.x*view.scale*(view.flipX||1),y:view.groundY-point.y*view.scale};}

  function renderUI(){
    const s=state(),desc=descriptorFor(s),active=isActive(s);
    if(displayCharacter!==s.characterId){displayCharacter=s.characterId;selectedPart=null;markedParts.clear();multiSelect=false;hiddenParts.clear();lockedParts.clear();soloPart=null;boardSignature='';}
    if(addDialog.open&&state().characterId!==addDialog.dataset.characterId)addDialog.close();
    section.hidden=!active;
    // Keep the Setup Joints / Part Layout switch visible, but put Part tools
    // directly beneath it instead of forcing a scroll past collider sliders.
    setupSection.classList.toggle('animlab-setup-art-active',active);
    if(!active){pad.hidden=true;lastRender=null;return;}
    if(viewportPadHost)viewportPadHost.hidden=false;
    pad.hidden=false;
    renderBoard(desc);ensureSelection(s,desc);
    board.classList.toggle('many',desc.parts.length>14);
    const layout=layoutFor(s);
    const order=isAssembly(s)?instances(s).map(p=>p.id):(layout?.order||desc.parts.map(p=>p.id));
    board.querySelectorAll('[data-part-row]').forEach(row=>{
      const id=row.dataset.partRow,part=partById(desc,id);
      const selected=id===selectedPart,marked=markedParts.has(id),hidden=hiddenParts.has(id),locked=lockedParts.has(id);
      row.classList.toggle('is-active',selected);
      row.classList.toggle('is-multi-selected',marked);
      row.classList.toggle('is-hidden-part',hidden);
      row.classList.toggle('is-locked-part',locked);
      const name=row.querySelector('[data-art-part]');
      const repeated=desc.parts.slice(0,order.indexOf(id)).filter(p=>p.label===part?.label).length;
      name.textContent=`${multiSelect?(marked?'☑ ':'□ '):''}${part?.label||id}${repeated?' · '+(repeated+1):''}`;
      name.setAttribute('aria-pressed',String(marked));
      for(const kind of ['hide','solo','lock']){
        const button=row.querySelector(`[data-part-row-action="${kind}"]`);
        const on=kind==='hide'?hidden:kind==='solo'?soloPart===id:locked;
        button.textContent=kind==='hide'?(on?'Show':'Hide'):kind==='solo'?(on?'Unsolo':'Solo'):(on?'Unlock':'Lock');
        button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));
      }
    });
    section.querySelector('.animlab-parts-selection-count').textContent=`${markedParts.size} selected · ${desc.parts.length} total`;
    const multiButton=section.querySelector('[data-part-manage="multi"]');
    multiButton.textContent=`Multi-select: ${multiSelect?'On':'Off'}`;
    multiButton.classList.toggle('is-active',multiSelect);
    multiButton.setAttribute('aria-pressed',String(multiSelect));
    const grouped=markedParts.size>1;
    section.querySelector('.animlab-parts-multi-hint').textContent=grouped
      ?`${markedParts.size} parts selected. Move or Scale applies to the group in one Undo step; individual Rotate/Pivot, Rename and layering require one selection.`
      :multiSelect?'Tap part names to add or remove them from the selection; turn Multi-select off to edit one part.':'Tap a part to edit it. Enable Multi-select to build a group.';
    transformButtons.forEach(button=>{const on=button.dataset.artTransform===transformMode;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
    axisButtons.forEach(button=>{const on=button.dataset.artAxis===axis;button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));button.disabled=!(transformMode==='move'||transformMode==='scale'||transformMode==='pivot');});
    fineButton.classList.toggle('is-active',fine);fineButton.setAttribute('aria-pressed',String(fine));
    const part=partById(desc,selectedPart),tr=transformFor(s,selectedPart);
    const editLocked=!part||lockedParts.has(selectedPart)||[...markedParts].some(id=>lockedParts.has(id));
    selectedTitle.textContent=grouped?`${markedParts.size} parts selected`:part?.label||'No part selected';
    selectedPos.textContent=part?`X ${tr.x.toFixed(3)} Y ${tr.y.toFixed(3)}  Rot ${(tr.rotation/DEG).toFixed(1)}°  Width ${tr.scaleX.toFixed(2)} Height ${tr.scaleY.toFixed(2)}  Pivot ${tr.pivotX.toFixed(3)}, ${tr.pivotY.toFixed(3)}`:'';
    for(const input of section.querySelectorAll('[data-art-number]')){
      const property=input.dataset.artNumber,display=property==='rotation'?tr.rotation/DEG:tr[property];
      if(document.activeElement!==input)input.value=part?String(Number(display.toFixed(4))):'';
      input.disabled=editLocked||(grouped&&!['scaleX','scaleY','x','y'].includes(property));
    }
    section.querySelector('[data-art-action="copy-pair"]').disabled=isAssembly(s)||!pairFor(selectedPart);
    for(const b of section.querySelectorAll('[data-art-transform],[data-art-axis],[data-art-fine],[data-part-edit],.animlab-art-order-buttons button,[data-art-action="reset-part"]')) b.disabled=editLocked||(grouped&&(b.dataset.artTransform==='rotate'||b.dataset.artTransform==='pivot'||b.hasAttribute('data-part-edit')||b.hasAttribute('data-art-action')));
    section.querySelectorAll('[data-art-action="copy-pair"],[data-art-action="copy-both-near-far"],[data-art-action="copy-both-far-near"]').forEach(b=>b.hidden=isAssembly(s));
    for(const action of section.querySelectorAll('[data-part-manage]')){
      action.disabled=(action.dataset.partManage==='delete'&&!markedParts.size)||(action.dataset.partManage==='clear'&&!desc.parts.length)||(action.dataset.partManage==='all'&&!desc.parts.length);
    }
    const visibility=section.querySelector('[data-art-action="toggle-visible"]');
    visibility.textContent=hiddenParts.has(selectedPart)?'Show Part':'Hide Part';
    const soloBtn=section.querySelector('[data-art-action="solo"]');
    soloBtn.textContent=soloPart===selectedPart?'Solo: On':'Solo: Off';soloBtn.classList.toggle('is-active',soloPart===selectedPart);
    section.querySelectorAll('[data-art-action^="paste"]').forEach(btn=>btn.disabled=!clipboard||editLocked);
    const status=section.querySelector('.animlab-rig-selected-pos');
    if(editLocked&&part)status.textContent+=' · Locked (unlock from the list to edit)';
    const index=order.indexOf(selectedPart);
    for(const name of ['back','bottom'])section.querySelector(`[data-art-action="${name}"]`).disabled=editLocked||index<1;
    for(const name of ['forward','top'])section.querySelector(`[data-art-action="${name}"]`).disabled=editLocked||index<0||index===order.length-1;
    pad.querySelector('span').textContent=`${transformMode[0].toUpperCase()+transformMode.slice(1)} ${grouped?markedParts.size+' selected parts':'selected part'}`;
    pad.classList.toggle('is-disabled',editLocked||(grouped&&!['scale','move'].includes(transformMode)));
    section.querySelector('[data-art-action="reset-layout"]').disabled=lockedParts.size>0;
    const ref=core.getStaticReference?.()||{opacity:.38};
    if(document.activeElement!==referenceOpacity)referenceOpacity.value=String(ref.opacity);
    const output=referenceOpacity.parentElement.querySelector('output');if(output)output.textContent=Number(ref.opacity).toFixed(2);
    const shown=core.getOverlay?.('reference');
    referenceButton.classList.toggle('active',!!shown);referenceButton.textContent=shown?'Reference Shown':'Show Reference';
    const skin=window.AnimLabSkinSurface;
    const diff=!!skin?.getDifference?.();
    differenceButton.classList.toggle('active',diff);differenceButton.textContent=`Difference: ${diff?'On':'Off'}`;differenceButton.disabled=!skin;
  }

  function editLayout(label,mutator){
    const s=state();if(!isActive(s))return;
    core.edit('setup',label,setup=>{
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      if(!setup.artLayout)return setup;
      if(setup.artLayout.assembly?.enabled){
        const items=setup.artLayout.assembly.instances;
        const proxy={parts:Object.fromEntries(items.map(p=>[p.id,{...p}])),order:items.map(p=>p.id)};
        mutator(proxy,descriptorFor(s));
        const byId=new Map(items.map(p=>[p.id,p]));
        const order=[...new Set(proxy.order)].filter(id=>byId.has(id));
        for(const id of byId.keys())if(!order.includes(id))order.push(id);
        setup.artLayout.assembly.instances=order.map(id=>({
          ...byId.get(id),...proxy.parts[id],id,meshId:byId.get(id).meshId
        }));
      }else if(setup.artLayout.parts){
        mutator(setup.artLayout,descriptorFor(s));
      }
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      return setup;
    });
  }

  function setPartInTransaction(tx,id,next){
    if(!tx||!id)return;
    core.previewTransaction(tx,setup=>{
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      if(setup.artLayout?.assembly?.enabled){
        const part=setup.artLayout.assembly.instances.find(p=>p.id===id);
        if(part)Object.assign(part,next);
      }else if(setup.artLayout?.parts?.[id]){
        Object.assign(setup.artLayout.parts[id],next);
      }
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      return setup;
    });
  }

  function defaults(){return core.normaliseArtLayout?.(null)||null;}

  function pairFor(id){
    return {rearNear:'rearFar',rearFar:'rearNear',frontNear:'frontFar',frontFar:'frontNear'}[id]||null;
  }

  // Preserve the exact mapped artwork when its transform origin changes.
  function shiftPivotKeepingArt(start,newPivotX,newPivotY){
    const vx=start.pivotX-newPivotX,vy=start.pivotY-newPivotY;
    const c=Math.cos(start.rotation),sn=Math.sin(start.rotation);
    return {pivotX:newPivotX,pivotY:newPivotY,
      x:start.x+vx-(c*start.scaleX*vx-sn*start.scaleY*vy),
      y:start.y+vy-(sn*start.scaleX*vx+c*start.scaleY*vy)};
  }

  function action(name){
    const s=state(),desc=descriptorFor(s);if(!desc)return;
    if(lockedParts.has(selectedPart)&&!['show-all','reference','difference','align-reference','copy'].includes(name))return;
    if(name==='reference'){
      core.setOverlay?.('reference',!core.getOverlay?.('reference'));return;
    }
    if(name==='difference'){
      const skin=window.AnimLabSkinSurface;if(!skin)return;
      skin.setBindProof?.(true);skin.setDifference?.(!skin.getDifference?.());renderUI();return;
    }
    if(name==='align-reference'){
      const source=desc.referenceSource||core.getStaticReference?.()?.source||'original';
      core.setStaticReference?.({source,scale:1,offsetX:0,offsetY:0});
      if(!core.getOverlay?.('reference'))core.setOverlay?.('reference',true);
      return;
    }
    if(name==='solo'){
      if(soloPart!==selectedPart)hiddenParts.delete(selectedPart);
      soloPart=soloPart===selectedPart?null:selectedPart;
      renderUI();core.redrawOnly?.();return;
    }
    if(name==='show-all'){
      soloPart=null;hiddenParts.clear();renderUI();core.redrawOnly?.();return;
    }
    if(name==='toggle-visible'&&selectedPart){
      if(hiddenParts.has(selectedPart))hiddenParts.delete(selectedPart);
      else hiddenParts.add(selectedPart);
      renderUI();core.redrawOnly?.();return;
    }
    if(['back','forward','bottom','top'].includes(name)&&selectedPart){
      editLayout(`Reorder ${partById(desc,selectedPart)?.label||selectedPart}`,layout=>{
        const order=layout.order,at=order.indexOf(selectedPart);if(at<0)return;
        const target=name==='bottom'?0:name==='top'?order.length-1:at+(name==='back'?-1:1);
        if(target<0||target>=order.length)return;
        order.splice(at,1);order.splice(target,0,selectedPart);
      });return;
    }
    // Part copy always copies *transforms* (including pivot), never the source
    // image, draw order or hidden/solo editor state. Thus near/far artwork is
    // still independent even when their placement is paired.
    if(name==='copy-pair'&&selectedPart&&pairFor(selectedPart)){
      const source=transformFor(s,selectedPart),pair=pairFor(selectedPart);
      editLayout('Copy part transform to matching side',layout=>{
        for(const key of ['x','y','rotation','scaleX','scaleY','pivotX','pivotY'])layout.parts[pair][key]=source[key];
      });return;
    }
    if(name==='copy-both-near-far'||name==='copy-both-far-near'){
      const nearToFar=name==='copy-both-near-far',side=nearToFar?'Near':'Far';
      editLayout(`Copy both ${side.toLowerCase()} leg part transforms to opposite side`,layout=>{
        for(const dst of ['front','rear']){
          const from=dst+side,other=pairFor(from);
          if(!layout.parts[from]||!layout.parts[other])continue;
          const source=transformFor(s,from);
          for(const key of ['x','y','rotation','scaleX','scaleY','pivotX','pivotY'])layout.parts[other][key]=source[key];
        }
      });return;
    }
    if(name==='copy'&&selectedPart){
      clipboard=clone(transformFor(s,selectedPart));renderUI();return;
    }
    if(name.startsWith('paste')&&selectedPart&&clipboard){
      const properties=name==='paste-position'?['x','y']:
        name==='paste-rotation'?['rotation']:
        name==='paste-scale'?['scaleX','scaleY']:
        name==='paste-pivot'?['pivotX','pivotY']:
        ['x','y','rotation','scaleX','scaleY','pivotX','pivotY'];
      editLayout(`Paste ${name.slice(6)||'all'} transform`,layout=>{
        for(const prop of properties)layout.parts[selectedPart][prop]=clipboard[prop];
      });return;
    }
    if(name==='reset-part'&&selectedPart){
      const base=isAssembly(s)?{x:0,y:0,rotation:0,scaleX:1,scaleY:1,pivotX:0,pivotY:0}:defaults()?.parts?.[selectedPart];if(!base)return;
      editLayout(`Reset ${partById(desc,selectedPart)?.label||selectedPart} layout`,layout=>{layout.parts[selectedPart]=clone(base);});
      return;
    }
    if(name==='reset-layout'){
      if(lockedParts.size)return;
      if(isAssembly(s)){
        editLayout('Reset assembled part transforms',layout=>{
          for(const part of Object.values(layout.parts))Object.assign(part,{x:0,y:0,rotation:0,scaleX:1,scaleY:1,pivotX:0,pivotY:0});
        });return;
      }
      const base=defaults();if(!base)return;
      core.edit('setup','Reset part layout',setup=>{setup.artLayout=clone(base);return setup;});
    }
  }

  section.addEventListener('click',event=>{
    const t=event.target.closest('[data-art-transform]');if(t){transformMode=t.dataset.artTransform;renderUI();return;}
    const a=event.target.closest('[data-art-axis]');if(a){axis=a.dataset.artAxis;renderUI();return;}
    if(event.target.closest('[data-art-fine]')){fine=!fine;renderUI();return;}
    const actionButton=event.target.closest('[data-art-action]');if(actionButton)action(actionButton.dataset.artAction);
  });

  section.querySelector('.animlab-art-numeric-grid').addEventListener('change',event=>{
    const input=event.target.closest('[data-art-number]');if(!input||!selectedPart||lockedParts.has(selectedPart))return;
    const property=input.dataset.artNumber,entered=Number(input.value);
    if(!Number.isFinite(entered)||input.value.trim()===''){renderUI();return;}
    if(markedParts.size>1){
      if(!['x','y','scaleX','scaleY'].includes(property))return;
      const active=transformFor(state(),selectedPart),delta=entered-active[property];
      const ratio=['scaleX','scaleY'].includes(property)?entered/Math.max(.000001,active[property]):1;
      const ids=[...markedParts];
      if(ids.some(id=>lockedParts.has(id))){renderUI();return;}
      editLayout(`Group ${property} (${ids.length} parts)`,layout=>{
        for(const id of ids){const tr=layout.parts[id];if(!tr)continue;
          if(property==='x'||property==='y')tr[property]=clamp(tr[property]+delta,property==='x'?-3:-2,3);
          else tr[property]=clamp(tr[property]*ratio,.25,3);
        }
      });renderUI();return;
    }
    const s=state(),current=transformFor(s,selectedPart);
    let next={};
    if(property==='rotation')next.rotation=clamp(entered*DEG,-Math.PI,Math.PI);
    else if(property==='scaleX'||property==='scaleY')next[property]=clamp(entered,.25,3);
    else if(property==='pivotX'||property==='pivotY'){
      const px=property==='pivotX'?clamp(entered,-2,2):current.pivotX;
      const py=property==='pivotY'?clamp(entered,-2,2):current.pivotY;
      next=shiftPivotKeepingArt(current,px,py);
    }else next[property]=clamp(entered,property==='x'?-1.5:-1,property==='x'?1.5:1);
    editLayout(`Set ${property} for ${partById(descriptorFor(s),selectedPart)?.label||selectedPart}`,
      layout=>Object.assign(layout.parts[selectedPart],next));
    renderUI();
  });

  referenceOpacity.addEventListener('input',()=>{const value=Number(referenceOpacity.value);if(Number.isFinite(value))core.setStaticReference?.({opacity:value});});

  function pointInPolygon(point,poly){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      const hit=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/((b.y-a.y)||1e-9)+a.x);
      if(hit)inside=!inside;
    }
    return inside;
  }

  function canvasPoint(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    return{x:(clientX-rect.left)*(canvas.width/rect.width),y:(clientY-rect.top)*(canvas.height/rect.height)};
  }

  function unproject(render,clientX,clientY){
    if(!render?.view)return null;const p=canvasPoint(clientX,clientY),v=render.view,flip=v.flipX||1;
    return{x:(p.x-v.cx)/(v.scale*flip),y:(v.groundY-p.y)/v.scale};
  }

  function hitPart(render,clientX,clientY){
    const p=canvasPoint(clientX,clientY);
    if(selectedPart&&pointInPolygon(p,render.polygons[selectedPart]||[]))return selectedPart;
    const ids=[...(render.order||[])].reverse();
    return ids.find(id=>pointInPolygon(p,render.polygons[id]||[]))||null;
  }

  function viewportDown(event){
    const s=state();if(!isActive(s)||!lastRender)return;
    const id=hitPart(lastRender,event.clientX,event.clientY);if(!id)return;
    event.preventDefault();event.stopImmediatePropagation();selectedPart=id;
    const model=unproject(lastRender,event.clientX,event.clientY),start=transformFor(s,id);
    viewportDrag={pointerId:event.pointerId,part:id,start,model,tx:core.beginTransaction('setup',`Move ${partById(descriptorFor(s),id)?.label||id}`)};
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
    renderUI();core.redrawOnly?.();
  }

  function viewportMove(event){
    if(!viewportDrag||viewportDrag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const model=unproject(lastRender,event.clientX,event.clientY);if(!model||!viewportDrag.model)return;
    setPartInTransaction(viewportDrag.tx,viewportDrag.part,{x:viewportDrag.start.x+(model.x-viewportDrag.model.x),y:viewportDrag.start.y+(model.y-viewportDrag.model.y)});
  }

  function finishViewport(event,cancel){
    if(!viewportDrag||viewportDrag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();const drag=viewportDrag;viewportDrag=null;
    if(cancel)core.cancelTransaction(drag.tx);else core.commitTransaction(drag.tx);
    try{canvas.releasePointerCapture(event.pointerId);}catch(_){}renderUI();
  }

  // Viewport dragging stays pan/zoom only to prevent accidental part moves.
  // canvas.addEventListener('pointerdown',viewportDown,true);
  // canvas.addEventListener('pointermove',viewportMove,true);
  // canvas.addEventListener('pointerup',event=>finishViewport(event,false),true);
  // canvas.addEventListener('pointercancel',event=>finishViewport(event,true),true);

  function precisionDown(event){
    const s=state();if(!isActive(s)||!selectedPart||lockedParts.has(selectedPart))return;
    const ids=markedParts.size>1?[...markedParts]:[selectedPart];
    if(ids.some(id=>lockedParts.has(id))||(ids.length>1&&!['scale','move'].includes(transformMode)))return;
    event.preventDefault();precisionDrag={pointerId:event.pointerId,part:selectedPart,ids,startX:event.clientX,startY:event.clientY,
      starts:Object.fromEntries(ids.map(id=>[id,transformFor(s,id)])),start:transformFor(s,selectedPart),
      tx:core.beginTransaction('setup',`${transformMode} ${ids.length} part(s)`)};
    try{pad.setPointerCapture(event.pointerId);}catch(_){}
  }

  function applyPrecisionPoint(clientX,clientY){
    if(!precisionDrag)return;
    const dx=clientX-precisionDrag.startX,dy=clientY-precisionDrag.startY;
    const next={};
    // Always use the active preview's real projection. Atlas-backed assembly
    // intentionally suppresses the old procedural overlay, so `lastRender`
    // is null; using scale=1 here once caused a few pixels of pad movement
    // to translate a part across the entire character canvas.
    const rect=canvas.getBoundingClientRect();
    const view=core.getPreviewView?.()||lastRender?.view;
    const viewScale=Number(view?.scale);
    if(!Number.isFinite(viewScale)||viewScale<=0||rect.width<=0)return;
    const pxScale=canvas.width/rect.width;
    const sensitivity=(fine ? .25 : 1)*pxScale/viewScale;
    if(transformMode==='move'||transformMode==='pivot'){
      let mx=dx*sensitivity,my=-dy*sensitivity;
      if(axis==='x')my=0;if(axis==='y')mx=0;
      if(transformMode==='move'){
        // The same authored-coordinate bounds as normaliseArtLayout are a
        // defensive stop for invalid gesture deltas or an unusual resize.
        next.x=clamp(precisionDrag.start.x+mx,isAssembly(state())?-3:-1.5,isAssembly(state())?3:1.5);
        next.y=clamp(precisionDrag.start.y+my,isAssembly(state())?-2:-1,isAssembly(state())?3:1);
      }else{
        // Rebase translation so moving a pivot cannot shift existing artwork.
        const start=precisionDrag.start;
        next.pivotX=clamp(start.pivotX+mx,-2,2);
        next.pivotY=clamp(start.pivotY+my,-2,2);
        Object.assign(next,shiftPivotKeepingArt(start,next.pivotX,next.pivotY));
      }
    }else if(transformMode==='rotate'){
      next.rotation=precisionDrag.start.rotation+dx*(fine ? .10 : .35)*DEG;
    }else{
      const start=precisionDrag.start,amount=dx*(fine ? .001 : .0035);
      if(axis!=='y')next.scaleX=clamp(start.scaleX+amount,.25,3);
      if(axis!=='x')next.scaleY=clamp(start.scaleY+amount,.25,3);
    }
    if(precisionDrag.ids.length>1){
      const changes={};const drag=precisionDrag;
      for(const id of drag.ids){
        const start=drag.starts[id];
        if(transformMode==='move'){
          changes[id]={x:clamp(start.x+(next.x-drag.start.x),-3,3),
            y:clamp(start.y+(next.y-drag.start.y),-2,3)};
        }else if(transformMode==='scale'){
          // Proportional scaling preserves each part's non-uniform proportions.
          // Translation is unchanged: artwork remains aligned to the rig as
          // individual body components rather than zooming away from its bones.
          changes[id]={};
          if(axis!=='y')changes[id].scaleX=clamp(start.scaleX*(next.scaleX/drag.start.scaleX),.25,3);
          if(axis!=='x')changes[id].scaleY=clamp(start.scaleY*(next.scaleY/drag.start.scaleY),.25,3);
        }
      }
      core.previewTransaction(drag.tx,setup=>{
        const layout=setup.artLayout;
        if(layout?.assembly?.enabled){for(const part of layout.assembly.instances){if(changes[part.id])Object.assign(part,changes[part.id]);}}
        else if(layout?.parts){for(const [id,change] of Object.entries(changes)){if(layout.parts[id])Object.assign(layout.parts[id],change);}}
        return setup;
      });
    }else setPartInTransaction(precisionDrag.tx,precisionDrag.part,next);
  }
  function precisionMove(event){
    if(!precisionDrag||precisionDrag.pointerId!==event.pointerId)return;
    event.preventDefault();queuedDragPoint=[event.clientX,event.clientY];
    if(queuedDragFrame)return;
    queuedDragFrame=requestAnimationFrame(()=>{
      queuedDragFrame=0;const pt=queuedDragPoint;queuedDragPoint=null;
      if(precisionDrag&&pt)applyPrecisionPoint(pt[0],pt[1]);
    });
  }

  function finishPrecision(event,cancel){
    if(!precisionDrag||precisionDrag.pointerId!==event.pointerId)return;
    event.preventDefault();
    if(queuedDragFrame){cancelAnimationFrame(queuedDragFrame);queuedDragFrame=0;}
    if(!cancel){const pt=queuedDragPoint||[event.clientX,event.clientY];applyPrecisionPoint(pt[0],pt[1]);}
    queuedDragPoint=null;const drag=precisionDrag;precisionDrag=null;
    if(cancel)core.cancelTransaction(drag.tx);else core.commitTransaction(drag.tx);
    try{pad.releasePointerCapture(event.pointerId);}catch(_){}renderUI();
  }

  pad.addEventListener('pointerdown',precisionDown);
  pad.addEventListener('pointermove',precisionMove);
  pad.addEventListener('pointerup',event=>finishPrecision(event,false));
  pad.addEventListener('pointercancel',event=>finishPrecision(event,true));

  function renderer(args){
    const s=state(),desc=descriptorFor(s);if(!desc||!layoutFor(s)||isAssembly(s)){lastRender=null;return;}
    const {ctx,view}=args,polygons={},pivots={};
    const order=layoutFor(s)?.order||desc.parts.map(p=>p.id);
    if(soloPart&&!partById(desc,soloPart))soloPart=null;
    for(const part of desc.parts||[]){
      const tr=transformFor(s,part.id),corners=partCornersLocal(desc,part,tr),screen=corners.map(p=>project(p,view));
      polygons[part.id]=screen;pivots[part.id]=project(applyTransform(part.pivot,part,tr),view);
    }
    lastRender={view,polygons,pivots,order};
    ctx.save();ctx.lineJoin='round';ctx.lineWidth=Math.max(1.5,canvas.width/650);
    for(const part of desc.parts||[]){
      if (!showOutlines) break;
      const poly=polygons[part.id];if(!poly?.length)continue;const active=part.id===selectedPart;
      const hidden=hiddenParts.has(part.id);
      ctx.strokeStyle=active?'rgba(255,196,92,.98)':hidden?'rgba(241,132,128,.28)':'rgba(126,216,199,.34)';ctx.setLineDash(active?[]:[7,6]);
      ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.stroke();
      if(active){const p=pivots[part.id],r=Math.max(6,canvas.width/180);ctx.setLineDash([]);ctx.fillStyle='rgba(255,196,92,.92)';ctx.strokeStyle='rgba(255,239,195,.98)';ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
    }
    ctx.restore();
  }

  // Read-only display state consumed by compatible renderers. Solo is ephemeral.
  window.AnimLabPartLayoutDisplay=Object.freeze({
    getSelected:()=>selectedPart,
    getSolo:()=>isActive(state())?soloPart:null,
    isHidden:id=>isActive(state())&&hiddenParts.has(id),
    getOutlines:()=>showOutlines,
    setOutlines:value=>{showOutlines=!!value;core.redrawOnly?.();}
  });
  core.registerPluginRenderer?.('art-layout-designer',renderer);
  core.subscribe?.(()=>renderUI());
  renderUI();
})();
