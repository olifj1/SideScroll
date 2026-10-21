/* SideScroll v1.1.4 — opt-in per-character Atlas → Parts assembly foundation.
 * Part instances reference local Atlas mesh IDs; legacy Part Layout remains
 * untouched. Rig targets are planning metadata, never generated skin weights.
 * Preview is rigid in Parts / Rig only; it is NOT gameplay/animation binding.
 */
(() => {
  'use strict';
  const core=window.AnimLabCore;
  const extension=document.getElementById('animlab-extension');
  const padHost=document.getElementById('animlab-viewport-pad-host');
  if(!core||!extension||!padHost)return;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const state=()=>core.getState();
  const layout=s=>s?.setup?.artLayout||null;
  const assembly=s=>layout(s)?.assembly||null;
  const atlas=()=>window.AnimLabAtlasInspect;
  const doc=()=>atlas()?.getDocument?.()||null;
  const meshMap=()=>new Map((doc()?.meshes||[]).map(m=>[m.id,m]));
  const managed=s=>assembly(s)?.enabled===true;
  const active=s=>s.mode==='setup'&&s.setupTool==='art'&&!!s.rig?.ART_LAYOUT_DESIGNER;
  const selected=s=>(assembly(s)?.instances||[]).find(v=>v.id===selectedId)||null;
  const newId=()=>`atlas-part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  let selectedId=null,drag=null,queued=null,raf=0;
  const panel=document.createElement('section');
  panel.className='animlab-section animlab-assembly-panel';
  panel.hidden=true;
  panel.innerHTML=`
    <div class="animlab-section-title">Part inventory · Atlas assembly</div>
    <p class="animlab-assembly-note">The six built-in Fox parts are preserved. Choose <b>Use Atlas parts</b> to start a separate assembly with your own meshes; switching back never erases it.</p>
    <div class="animlab-view-grid animlab-assembly-switch">
      <button type="button" data-assembly="enable">Use Atlas parts</button>
      <button type="button" data-assembly="legacy">Show original Parts</button>
    </div>
    <div class="animlab-assembly-edit" hidden>
      <div class="animlab-section-title">Add source mesh</div>
      <div class="animlab-assembly-source"><select data-assembly-source aria-label="Source mesh from Atlas"></select><button type="button" data-assembly="add">Add</button></div>
      <button type="button" data-assembly="add-all">Add all unused Atlas meshes</button>
      <p class="animlab-assembly-status" role="status" aria-live="polite"></p>
      <div class="animlab-section-title">Assembled parts · rear to front</div>
      <div class="animlab-assembly-list" aria-label="Assembled parts"></div>
      <div class="animlab-assembly-actions">
        <button type="button" data-assembly="duplicate">Duplicate selected</button>
        <button type="button" data-assembly="remove">Remove selected</button>
        <button type="button" data-assembly="clear">Clear all</button>
        <button type="button" data-assembly="back">Send back</button>
        <button type="button" data-assembly="forward">Bring forward</button>
      </div>
      <div class="animlab-section-title">Selected part · assembly transform</div>
      <div class="animlab-assembly-values">
        <label>X <input data-assembly-number="x" type="number" step="0.01" inputmode="decimal"></label>
        <label>Y <input data-assembly-number="y" type="number" step="0.01" inputmode="decimal"></label>
        <label>Rotation ° <input data-assembly-number="rotation" type="number" step="1" inputmode="decimal"></label>
        <label>Width <input data-assembly-number="scaleX" type="number" min="0.05" max="8" step="0.05" inputmode="decimal"></label>
        <label>Height <input data-assembly-number="scaleY" type="number" min="0.05" max="8" step="0.05" inputmode="decimal"></label>
      </div>
      <div class="animlab-assembly-pad-modes"><button type="button" data-assembly-mode="move">Move</button><button type="button" data-assembly-mode="rotate">Rotate</button><button type="button" data-assembly-mode="scale">Scale</button></div>
      <div class="animlab-section-title">Rig handoff · target joint</div>
      <label class="animlab-assembly-target">Suggested joint <select data-assembly-target></select></label>
      <button type="button" data-assembly="snap">Position at target joint</button>
      <p class="animlab-assembly-note"><strong>Not bound yet.</strong> A target records the intended connection and can snap this part into place. Skin weights and animation deformation are not generated here. Rig shows the static assembly for alignment; Skin still operates on the legacy Fox topology.</p>
    </div>`;
  // Above the original Part Layout: switch is available even before opting in.
  const original=document.querySelector('.animlab-art-layout-controls');
  if(original)original.insertAdjacentElement('beforebegin',panel);
  else extension.appendChild(panel);
  const grab=sel=>panel.querySelector(sel);
  const editRegion=grab('.animlab-assembly-edit');
  const inventory=grab('.animlab-assembly-list');
  const source=grab('[data-assembly-source]');
  const target=grab('[data-assembly-target]');
  const status=grab('.animlab-assembly-status');
  const pad=document.createElement('div');
  pad.className='animlab-precision-pad animlab-viewport-precision-pad animlab-assembly-pad';
  pad.hidden=true;pad.setAttribute('aria-label','Transform selected Atlas part');
  pad.innerHTML='<i class="animlab-pad-x"></i><i class="animlab-pad-y"></i><span>Drag to move the selected part</span>';
  padHost.appendChild(pad);
  let mode='move';

  function edit(label,update){
    if(!managed(state()))return;
    core.edit('setup',label,setup=>{
      const a=setup.artLayout?.assembly;
      if(a?.enabled && Array.isArray(a.instances))update(a.instances,a);
      return setup;
    });
  }
  function setEnabled(value){
    const s=state();if(!active(s))return;
    if(value && !doc()?.meshes?.length){
      status.textContent='First create and Save at least one source mesh in Atlas.';
      return;
    }
    if(value&&!managed(s) && !window.confirm('Start a new Atlas Parts assembly? The original six parts remain available through Show original Parts.'))return;
    core.edit('setup',value?'Use Atlas Parts assembly':'Show legacy Parts',setup=>{
      if(!setup.artLayout) return setup;
      const old=setup.artLayout.assembly||{schema:'animlab.parts-assembly.v1',enabled:false,instances:[]};
      setup.artLayout.assembly={...old,enabled:value};return setup;
    });
  }
  function getBounds(mesh){
    const vs=mesh?.vertices||[];
    if(!vs.length)return null;
    return {cx:(Math.min(...vs.map(v=>v.x))+Math.max(...vs.map(v=>v.x)))/2,
      ymax:Math.max(...vs.map(v=>v.y))};
  }
  function options(select,items,selectedValue){
    const marker=JSON.stringify(items);
    if(select.dataset.marker!==marker){
      select.dataset.marker=marker;select.replaceChildren();
      for(const {value,label} of items){const op=document.createElement('option');op.value=value;op.textContent=label;select.appendChild(op);}
    }
    if(items.some(x=>x.value===selectedValue))select.value=selectedValue;
  }
  function jointItems(s){
    const desc=s?.rig?.RIG_DESIGNER;
    return [{value:'',label:'Not assigned'}].concat((desc?.jointGroups||[]).flatMap(g=>(g.joints||[]).map(j=>({value:j,label:`${g.label} · ${desc.labels?.[j]||j}`}))));
  }
  function render(){
    const s=state();panel.hidden=!active(s);if(panel.hidden){pad.hidden=true;return;}
    const use=managed(s),a=assembly(s);
    editRegion.hidden=!use;
    grab('[data-assembly="enable"]').hidden=use;
    grab('[data-assembly="legacy"]').hidden=!use;
    if(!use){pad.hidden=true;return;}
    pad.hidden=false;
    const all=doc()?.meshes||[],valid=new Set(all.map(m=>m.id));
    const prev=source.value;
    options(source,all.map(m=>({value:m.id,label:m.name||m.id})),prev);
    const items=a?.instances||[];
    if(!items.some(x=>x.id===selectedId))selectedId=items[0]?.id||null;
    inventory.replaceChildren();
    for(const [index,item] of items.entries()){
      const b=document.createElement('button');b.type='button';b.dataset.assemblyInstance=item.id;
      b.textContent=`${index+1}. ${item.label}${valid.has(item.meshId)?'':' · missing source'}${item.boneTarget?' · joint target':''}`;
      b.classList.toggle('is-active',item.id===selectedId);
      b.addEventListener('click',()=>{selectedId=item.id;render();core.redrawOnly?.();});
      inventory.appendChild(b);
    }
    const current=selected(s),index=items.findIndex(v=>v.id===selectedId);
    grab('[data-assembly="add"]').disabled=!all.length || items.length>=64;
    grab('[data-assembly="add-all"]').disabled=!all.some(m=>!items.some(v=>v.meshId===m.id)) || items.length>=64;
    for(const k of ['duplicate','remove','back','forward','snap'])grab(`[data-assembly="${k}"]`).disabled=!current || (k==='back'&&index<=0) || (k==='forward'&&index===items.length-1) || (k==='snap'&&!current?.boneTarget);
    grab('[data-assembly="clear"]').disabled=!items.length;
    status.textContent=`${items.length} assembled · ${items.filter(x=>!!x.boneTarget).length} target(s) assigned · ${items.filter(x=>!valid.has(x.meshId)).length} missing source(s) · 0 Skin bindings`;
    for(const inp of panel.querySelectorAll('[data-assembly-number]')){
      const key=inp.dataset.assemblyNumber,v=current?.[key];
      if(document.activeElement!==inp)inp.value=v===undefined?'':(key==='rotation'?String(Math.round(v*180/Math.PI*100)/100):String(v));
      inp.disabled=!current;
    }
    options(target,jointItems(s),current?.boneTarget||'');target.disabled=!current;
    for(const b of panel.querySelectorAll('[data-assembly-mode]')){b.classList.toggle('active',b.dataset.assemblyMode===mode);b.setAttribute('aria-pressed',String(b.dataset.assemblyMode===mode));}
    pad.querySelector('span').textContent=current?`${mode} · ${current.label}`:'Select a part to move';
  }
  panel.addEventListener('click',e=>{
    const action=e.target.closest('[data-assembly]')?.dataset.assembly;
    const m=e.target.closest('[data-assembly-mode]')?.dataset.assemblyMode;
    if(m){mode=m;render();return;}
    if(!action)return;
    if(action==='enable'||action==='legacy'){setEnabled(action==='enable');return;}
    const s=state(),item=selected(s),items=assembly(s)?.instances||[];
    if(action==='add-all'){
      const unused=[...meshMap().values()].filter(m=>!items.some(v=>v.meshId===m.id)).slice(0,Math.max(0,64-items.length));
      if(!unused.length)return;
      edit(`Add ${unused.length} source meshes from Atlas`,list=>{
        for(const m of unused)list.push({id:newId(),meshId:m.id,label:m.name||'Atlas part',x:0,y:0,rotation:0,scaleX:1,scaleY:1,boneTarget:''});
      });return;
    }
    if(action==='add'){
      const m=meshMap().get(source.value);if(!m)return;
      const id=newId();
      edit(`Add ${m.name} from Atlas`,list=>list.push({id,meshId:m.id,label:m.name||'Atlas part',x:0,y:0,rotation:0,scaleX:1,scaleY:1,boneTarget:''}));
      selectedId=id;render();return;
    }
    if(action==='clear'){
      if(items.length&&!window.confirm(`Remove all ${items.length} assembled parts? Original Atlas source meshes are preserved and Undo is available.`))return;
      edit('Clear assembled parts',list=>{list.length=0;});selectedId=null;render();return;
    }
    if(!item)return;
    if(action==='remove'){edit(`Remove ${item.label}`,list=>{const i=list.findIndex(v=>v.id===item.id);if(i>=0)list.splice(i,1);});selectedId=null;render();}
    if(action==='duplicate'){
      const id=newId();edit(`Duplicate ${item.label}`,list=>{const i=list.findIndex(v=>v.id===item.id);list.splice(i+1,0,{...clone(item),id,label:`${item.label} copy`});});selectedId=id;render();
    }
    if(action==='back'||action==='forward'){
      edit('Reorder Atlas part',list=>{const i=list.findIndex(v=>v.id===item.id),t=i+(action==='back'?-1:1);if(i>=0&&t>=0&&t<list.length){const [v]=list.splice(i,1);list.splice(t,0,v);}});
    }
    if(action==='snap'){
      const pt=s.setup?.rig?.joints?.[item.boneTarget];
      if(!pt){status.textContent='Selected target has no corresponding joint in this rig.';return;}
      edit('Place part at selected joint',list=>{const it=list.find(v=>v.id===item.id);if(it){it.x=pt.x;it.y=pt.y;}});
    }
  });
  panel.addEventListener('change',e=>{
    const num=e.target.closest('[data-assembly-number]');
    if(num){const s=state(),item=selected(s);if(!item)return;
      const raw=num.value.trim(),v=Number(raw);if(!raw||!Number.isFinite(v)){render();return;}
      const k=num.dataset.assemblyNumber,lo=k==='x'?-3:k==='y'?-2:k==='rotation'?-180:.05,hi=k==='x'?3:k==='y'?3:k==='rotation'?180:8;
      const value=clamp(v,lo,hi)*(k==='rotation'?Math.PI/180:1);
      edit(`Set ${k} of ${item.label}`,list=>{const it=list.find(x=>x.id===item.id);if(it)it[k]=value;});render();
    }
    if(e.target===target){const item=selected(state());if(!item)return;
      const choice=target.value;
      edit(`Set ${item.label} target joint`,list=>{const it=list.find(x=>x.id===item.id);if(it)it.boneTarget=choice;});
    }
  });
  pad.addEventListener('pointerdown',e=>{
    const s=state(),item=selected(s);if(!active(s)||!managed(s)||!item)return;
    e.preventDefault();
    drag={id:e.pointerId,part:item.id,mode,startX:e.clientX,startY:e.clientY,initial:clone(item),
      tx:core.beginTransaction('setup',`${mode} ${item.label}`)};
    pad.setPointerCapture?.(e.pointerId);
  });
  function sample(x,y){
    if(!drag)return;
    const dx=x-drag.startX,dy=y-drag.startY;
    const {initial,mode:tool,part}=drag;
    const delta={};
    if(tool==='move'){delta.x=clamp(initial.x+dx*.0025,-3,3);delta.y=clamp(initial.y-dy*.0025,-2,3);}
    else if(tool==='rotate')delta.rotation=clamp(initial.rotation+dx*.005,-Math.PI,Math.PI);
    else{const factor=clamp(1+dx*.008,.05,8);delta.scaleX=clamp(initial.scaleX*factor,.05,8);delta.scaleY=clamp(initial.scaleY*factor,.05,8);}
    core.previewTransaction(drag.tx,setup=>{
      const item=setup.artLayout?.assembly?.instances?.find(x=>x.id===part);
      if(item)Object.assign(item,delta);
      return setup;
    });
  }
  pad.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;e.preventDefault();
    queued=[e.clientX,e.clientY];if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;if(drag&&queued)sample(queued[0],queued[1]);queued=null;});
  });
  function end(e,cancel){
    if(!drag||e.pointerId!==drag.id)return;e.preventDefault();
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(!cancel)sample(...(queued||[e.clientX,e.clientY]));queued=null;
    const d=drag;drag=null;
    if(cancel)core.cancelTransaction(d.tx);else core.commitTransaction(d.tx);
    pad.releasePointerCapture?.(e.pointerId);render();
  }
  pad.addEventListener('pointerup',e=>end(e,false));
  pad.addEventListener('pointercancel',e=>end(e,true));

  // Clip to the exact source triangles. UVs are by identity: atlas-space (px,py)
  // maps to the imported PNG (px,py) with no UV editor or duplicate texture.
  // Geometry here is REST-POSE and rigid; Skin binding is a later milestone.
  function drawMesh(args,part,mesh,image){
    const {ctx,view,project}=args,verts=mesh.vertices||[],tris=mesh.triangles||[];
    if(!verts.length||!tris.length)return;
    const imageWidth=image?.naturalWidth||image?.width||doc()?.atlas?.width||1;
    const bound=getBounds(mesh);if(!bound)return;
    const pixelsToLocal=.95/imageWidth;
    const c=Math.cos(part.rotation||0),s=Math.sin(part.rotation||0);
    const transform=(x,y)=>{
      const px=(x-bound.cx)*pixelsToLocal*part.scaleX;
      const py=(bound.ymax-y)*pixelsToLocal*part.scaleY;
      return project({x:part.x+c*px-s*py,y:part.y+s*px+c*py},view);
    };
    const points=verts.map(p=>transform(p.x,p.y));
    ctx.save();ctx.beginPath();
    let count=0;
    for(const t of tris){
      if(!Array.isArray(t)||t.length<3)continue;
      const a=points[t[0]],b=points[t[1]],c=points[t[2]];
      if(!a||!b||!c)continue;
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();count++;
    }
    if(!count){ctx.restore();return;}
    if(image && (image.naturalWidth||image.width)){
      ctx.clip();
      const p0=transform(0,0),px=transform(1,0),py=transform(0,1);
      ctx.transform(px.x-p0.x,px.y-p0.y,py.x-p0.x,py.y-p0.y,p0.x,p0.y);
      ctx.drawImage(image,0,0);
      ctx.restore();
    } else {
      ctx.strokeStyle='rgba(244,167,112,.75)';ctx.lineWidth=1.3;ctx.stroke();ctx.restore();
    }
    if(args.character.id===state().characterId && active(state()) && part.id===selectedId){
      ctx.save();ctx.beginPath();
      for(const t of tris){const a=points[t[0]],b=points[t[1]],c=points[t[2]];if(!a||!b||!c)continue;
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();}
      ctx.strokeStyle='rgba(241,191,100,.58)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
  }
  core.registerArtRenderer?.('atlas-part-assembly',args=>{
    const s=state(),a=assembly(s),visible=(active(s)|| (s.mode==='setup'&&s.setupTool==='rig'));
    if(!a?.enabled||!visible||!doc())return false;
    // Only preview the character we are editing; never allow another atlas's
    // image or mesh IDs to bleed across a character switch.
    if(atlas()?.getCharacterId?.()!==s.characterId)return false;
    const meshes=meshMap(),image=atlas()?.getImage?.();
    for(const part of a.instances){const mesh=meshes.get(part.meshId);if(mesh)drawMesh(args,part,mesh,image);}
    return true; // replaces built-in six rigid regions only in Parts / Rig.
  });
  core.subscribe?.(render);render();
  // Read-only debugging surface, no mutations outside core transactions.
  window.AnimLabPartAssemblyInspect=Object.freeze({getInventory:()=>clone(assembly(state())||{}),getSelectedId:()=>selectedId});
})();
