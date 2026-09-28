(() => {
  'use strict';
  const STORAGE = {
    elements:'sidescroll.world-elements.v1',
    pending:'sidescroll.world-lab.pending-puzzle-moves.v1',
    puzzleState:'sidescroll.puzzle-groups.state.v1',
    puzzleStarts:'sidescroll.puzzle-groups.starts.v1',
    puzzleLibrary:'sidescroll.puzzle-groups.library.v1',
    terrain:'sidescroll.terrain-sections.v1',
    player:'sidescroll.player.position.v1'
  };
  const SECTION_LENGTH = 10;
  const baked = window.SIDESCROLL_BAKED_GAME_DESIGN || {};
  const puzzleConfig = window.SideScrollPuzzleConfig || { groups:{}, markers:[] };
  const RANGE_TYPES = new Set(['biome-region','biome-transition','dressing-group','audio-zone','vfx-zone']);
  const TYPE_TRACK = {
    'biome-region':'biome', 'biome-transition':'transition', 'dressing-group':'dressing', 'explicit-dressing':'dressing',
    'landmark':'other', 'story-node':'other', 'camera-node':'other', 'checkpoint':'other', 'audio-zone':'other', 'vfx-zone':'other'
  };
  const TYPE_LABEL = {
    'biome-region':'Biome Region','biome-transition':'Biome Transition','dressing-group':'Dressing Group','explicit-dressing':'Explicit Dressing',
    'landmark':'Terraform Machine / Landmark','story-node':'Story Trigger','camera-node':'Camera Sequence Node','checkpoint':'Spawn / Checkpoint',
    'audio-zone':'Audio Zone','vfx-zone':'VFX / Anomaly Zone'
  };
  const state = {
    minX:-20,maxX:120,scale:10,selected:null,drag:null,
    elements:loadElements(),pending:loadJson(STORAGE.pending,{}),userLibrary:null,puzzleState:null,puzzleStarts:null,terrain:null,puzzles:[]
  };
  const $ = id => document.getElementById(id);
  const els = {
    status:$('wl-status'), world:$('wl-world'), scroll:$('wl-scroll'), sectionGrid:$('wl-section-grid'), ruler:$('wl-ruler'),
    trackBiome:$('wl-track-biome'),trackTransition:$('wl-track-transition'),trackPuzzle:$('wl-track-puzzle'),trackDressing:$('wl-track-dressing'),trackOther:$('wl-track-other'),
    playerLine:$('wl-player-line'), selection:$('wl-selection'), zoom:$('wl-zoom'),zoomValue:$('wl-zoom-value'),min:$('wl-min'),max:$('wl-max'),
    fit:$('wl-fit'),refresh:$('wl-refresh'),dataToggle:$('wl-data-toggle'),dataMenu:$('wl-data-menu'),exportBtn:$('wl-export'),importBtn:$('wl-import'),resetWorld:$('wl-reset-world'),importFile:$('wl-import-file'),
    newType:$('wl-new-type'),newLabel:$('wl-new-label'),newStart:$('wl-new-start'),newEnd:$('wl-new-end'),newOwner:$('wl-new-owner'),addElement:$('wl-add-element'),toast:$('wl-toast')
  };

  init();

  function init(){
    bindUi();
    refreshGameData();
    fitWorld(true);
    render();
    window.addEventListener('pageshow',()=>{refreshGameData();render();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshGameData();render();}});
  }

  function bindUi(){
    els.zoom.addEventListener('input',()=>{state.scale=Number(els.zoom.value)||10;render();});
    els.min.addEventListener('change',()=>{state.minX=number(els.min.value,state.minX);if(state.maxX<=state.minX+20)state.maxX=state.minX+20;syncViewInputs();render();});
    els.max.addEventListener('change',()=>{state.maxX=number(els.max.value,state.maxX);if(state.maxX<=state.minX+20)state.maxX=state.minX+20;syncViewInputs();render();});
    els.fit.addEventListener('click',()=>fitWorld(false));
    els.refresh.addEventListener('click',()=>{refreshGameData();fitWorld(false);toast('Game data refreshed.');});
    els.dataToggle.addEventListener('click',()=>{els.dataMenu.hidden=!els.dataMenu.hidden;});
    els.exportBtn.addEventListener('click',exportElements);
    els.importBtn.addEventListener('click',()=>els.importFile.click());
    els.importFile.addEventListener('change',importElements);
    els.resetWorld.addEventListener('click',()=>{if(confirm('Clear all World Elements? Puzzle placement is not affected.')){state.elements=[];saveElements();state.selected=null;render();}});
    els.addElement.addEventListener('click',addElement);
  }

  function refreshGameData(){
    state.userLibrary = normaliseLibrary(loadJson(STORAGE.puzzleLibrary, baked?.puzzles?.localLibrary || {groups:{},templates:{},markers:[]}));
    state.puzzleState = loadJson(STORAGE.puzzleState,{});
    state.puzzleStarts = loadJson(STORAGE.puzzleStarts,baked?.puzzles?.savedStarts || {});
    state.pending = loadJson(STORAGE.pending,{});
    state.terrain = loadJson(STORAGE.terrain,{});
    state.puzzles = buildPuzzleMarkers();
    const pendingCount=Object.keys(state.pending||{}).length;
    els.status.textContent=`${state.puzzles.length} puzzles · ${state.elements.length} World Elements${pendingCount?` · ${pendingCount} queued move${pendingCount===1?'':'s'}`:''}`;
  }

  function normaliseLibrary(raw){
    const lib=clone(raw)||{};lib.groups||={};lib.templates||={};lib.markers||=[];
    const seen=new Set(),out=[];
    for(const m of lib.markers){if(!m?.id||!m?.group||!Number.isFinite(Number(m.x))||seen.has(m.id))continue;seen.add(m.id);out.push({...m,x:Number(m.x),local:true});}
    lib.markers=out;return lib;
  }

  function buildPuzzleMarkers(){
    const localLabels=new Set(state.userLibrary.markers.map(m=>(state.userLibrary.groups?.[m.group]?.label||'').trim().toLowerCase()).filter(Boolean));
    const builtIns=(puzzleConfig.markers||[]).filter(m=>!localLabels.has((puzzleConfig.groups?.[m.group]?.label||'').trim().toLowerCase()));
    return [...builtIns,...state.userLibrary.markers].map(marker=>{
      const local=state.userLibrary.markers.some(m=>m.id===marker.id);
      const def=state.userLibrary.groups?.[marker.group]||puzzleConfig.groups?.[marker.group]||{};
      const actualX=local?Number(marker.x):number(state.puzzleState?.[marker.id]?.markerX,Number(marker.x)||0);
      const queued=state.pending?.[marker.id];
      const x=Number.isFinite(Number(queued?.x))?Number(queued.x):actualX;
      const start=marker.linkMode==='copy'?state.puzzleStarts?.[marker.id]:(state.userLibrary.templates?.[marker.group]||state.puzzleStarts?.[marker.id]);
      const bounds=start?.bounds||def.bounds||null;
      const minLocal=Number.isFinite(Number(bounds?.minX))?Number(bounds.minX):-(Number(def.width)||8)/2;
      const maxLocal=Number.isFinite(Number(bounds?.maxX))?Number(bounds.maxX):(Number(def.width)||8)/2;
      const mods=Array.isArray(start?.worldModifiers)?start.worldModifiers:[];
      return {kind:'puzzle',id:marker.id,group:marker.group,label:def.label||marker.group,x,actualX,local,minX:x+minLocal,maxX:x+maxLocal,minLocal,maxLocal,pending:!!queued,worldModifiers:mods};
    });
  }

  function fitWorld(initial){
    const values=[];
    for(const p of state.puzzles){values.push(p.minX,p.maxX,p.x);}
    for(const e of state.elements){values.push(number(e.startX,0),number(e.endX,e.startX));}
    const player=loadJson(STORAGE.player,null); if(Number.isFinite(Number(player?.x))) values.push(Number(player.x));
    const lo=values.length?Math.min(...values):-10, hi=values.length?Math.max(...values):100;
    state.minX=Math.floor((lo-15)/10)*10; state.maxX=Math.ceil((hi+20)/10)*10;
    if(state.maxX-state.minX<80) state.maxX=state.minX+80;
    if(initial && state.maxX<120)state.maxX=120;
    syncViewInputs();render();
  }

  function syncViewInputs(){els.min.value=round(state.minX,1);els.max.value=round(state.maxX,1);els.zoom.value=String(state.scale);els.zoomValue.textContent=`${state.scale} px/m`;}
  function worldWidth(){return Math.max(500,(state.maxX-state.minX)*state.scale);}
  function xToPx(x){return (Number(x)-state.minX)*state.scale;}
  function pxToX(px){return state.minX+px/state.scale;}

  function render(){
    syncViewInputs();
    const width=worldWidth(); els.world.style.width=`${width+104}px`;
    renderGrid(width);renderElements();renderPuzzles();renderPlayer();renderSelection();
  }

  function renderGrid(width){
    els.sectionGrid.innerHTML='';els.ruler.innerHTML='';
    const first=Math.floor((state.minX+5)/SECTION_LENGTH),last=Math.ceil((state.maxX+5)/SECTION_LENGTH);
    for(let index=first;index<=last;index++){
      const center=index*SECTION_LENGTH,min=center-5,max=center+5;
      const cell=document.createElement('div');cell.className='wl-section-cell';cell.style.left=`${xToPx(min)}px`;cell.style.width=`${SECTION_LENGTH*state.scale}px`;
      const type=state.terrain?.types?.[String(index)]||'normal';if(type!=='normal')cell.classList.add('special');
      const lab=document.createElement('span');lab.textContent=type==='normal'?`S${index}`:`S${index} · ${type}`;cell.appendChild(lab);els.sectionGrid.appendChild(cell);
    }
    const majorStep=state.scale>=14?10:(state.scale>=8?20:40);
    for(let x=Math.ceil(state.minX/majorStep)*majorStep;x<=state.maxX;x+=majorStep){const tick=document.createElement('div');tick.className='wl-ruler-tick';tick.style.left=`${xToPx(x)}px`;const b=document.createElement('b');b.textContent=`${round(x,0)}m`;tick.appendChild(b);els.ruler.appendChild(tick);}
  }

  function renderElements(){
    for(const el of [els.trackBiome,els.trackTransition,els.trackDressing,els.trackOther])el.innerHTML='';
    for(const item of state.elements){
      const track=TYPE_TRACK[item.type]||'other';const host=track==='biome'?els.trackBiome:track==='transition'?els.trackTransition:track==='dressing'?els.trackDressing:els.trackOther;
      host.appendChild(makeWorldElementNode(item,track));
    }
  }

  function makeWorldElementNode(item,track){
    const node=document.createElement('div');const range=RANGE_TYPES.has(item.type);node.className=`wl-item ${track}${range?'':' point'}${isSelected('element',item.id)?' selected':''}`;node.dataset.kind='element';node.dataset.id=item.id;
    const start=number(item.startX,0),end=range?Math.max(start+0.2,number(item.endX,start+1)):start;
    node.style.left=`${xToPx(start)}px`;if(range)node.style.width=`${Math.max(12,(end-start)*state.scale)}px`;else node.dataset.short=item.label||TYPE_LABEL[item.type]||item.type;
    if(range)node.textContent=item.label||TYPE_LABEL[item.type]||item.type;node.title=`${item.label||item.type} · ${round(start,1)}m${range?` → ${round(end,1)}m`:''}`;
    bindDraggable(node,{kind:'element',id:item.id});node.addEventListener('click',e=>{if(state.drag?.moved)return;select('element',item.id);e.stopPropagation();});return node;
  }

  function renderPuzzles(){
    els.trackPuzzle.innerHTML='';
    for(const puzzle of state.puzzles){
      const width=Math.max(14,(puzzle.maxX-puzzle.minX)*state.scale);const node=document.createElement('div');
      node.className=`wl-item puzzle${puzzle.pending?' pending':''}${isSelected('puzzle',puzzle.id)?' selected':''}`;node.dataset.kind='puzzle';node.dataset.id=puzzle.id;node.style.left=`${xToPx(puzzle.minX)}px`;node.style.width=`${width}px`;node.textContent=puzzle.label;node.title=`${puzzle.label} · marker ${round(puzzle.x,2)}m`;
      bindDraggable(node,{kind:'puzzle',id:puzzle.id});node.addEventListener('click',e=>{if(state.drag?.moved)return;select('puzzle',puzzle.id);e.stopPropagation();});els.trackPuzzle.appendChild(node);
      for(const mod of puzzle.worldModifiers||[]){if(mod?.type!=='river')continue;const w=Math.max(.5,number(mod.width,number(mod.settings?.width,4.8)));const centre=puzzle.x+number(mod.centerX,0);const band=document.createElement('div');band.className='wl-modifier-band';band.style.left=`${xToPx(centre-w/2)}px`;band.style.width=`${Math.max(8,w*state.scale)}px`;band.title='Puzzle-owned river modifier';els.trackPuzzle.appendChild(band);}
    }
  }

  function renderPlayer(){
    const saved=loadJson(STORAGE.player,null);const x=Number(saved?.x);if(!Number.isFinite(x)||x<state.minX||x>state.maxX){els.playerLine.hidden=true;return;}els.playerLine.hidden=false;els.playerLine.style.left=`calc(var(--track-label) + ${xToPx(x)}px)`;
  }

  function bindDraggable(node,ref){
    node.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;event.preventDefault();event.stopPropagation();node.setPointerCapture?.(event.pointerId);
      const rect=els.world.getBoundingClientRect();const startClient=event.clientX;let startX,startEnd;
      if(ref.kind==='puzzle'){const p=findPuzzle(ref.id);startX=p.x;startEnd=null;}else{const item=findElement(ref.id);startX=number(item.startX,0);startEnd=number(item.endX,startX);}
      state.drag={...ref,startClient,startX,startEnd,rect,moved:false};select(ref.kind,ref.id,false);
      const move=e=>{
        if(!state.drag)return;
        const delta=(e.clientX-startClient)/state.scale;
        if(Math.abs(e.clientX-startClient)>3)state.drag.moved=true;
        if(ref.kind==='puzzle'){
          const p=findPuzzle(ref.id);
          if(p){
            p.x=round(startX+delta,3);p.minX=p.x+p.minLocal;p.maxX=p.x+p.maxLocal;
            node.style.left=`${xToPx(p.minX)}px`;
            renderSelection();
          }
        }else{
          const item=findElement(ref.id);
          if(item){
            item.startX=round(startX+delta,3);
            if(RANGE_TYPES.has(item.type))item.endX=round(startEnd+delta,3);
            node.style.left=`${xToPx(item.startX)}px`;
            if(RANGE_TYPES.has(item.type))node.style.width=`${Math.max(12,(item.endX-item.startX)*state.scale)}px`;
            renderSelection();
          }
        }
      };
      const end=()=>{node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',end);node.removeEventListener('pointercancel',end);if(!state.drag)return;const moved=state.drag.moved;if(moved){if(ref.kind==='puzzle'){const p=findPuzzle(ref.id);queuePuzzleMove(p.id,p.x);}else saveElements();}state.drag=null;render();};
      node.addEventListener('pointermove',move);node.addEventListener('pointerup',end);node.addEventListener('pointercancel',end);
    });
  }

  function select(kind,id,rerender=true){state.selected={kind,id};if(rerender)render();}
  function isSelected(kind,id){return state.selected?.kind===kind&&state.selected?.id===id;}

  function renderSelection(){
    if(!state.selected){els.selection.innerHTML='<h2>Selection</h2><p class="muted">Tap a puzzle marker or World Element above.</p>';return;}
    if(state.selected.kind==='puzzle'){const p=findPuzzle(state.selected.id);if(!p){state.selected=null;return renderSelection();}renderPuzzleSelection(p);}
    else {const item=findElement(state.selected.id);if(!item){state.selected=null;return renderSelection();}renderElementSelection(item);}
  }

  function renderPuzzleSelection(p){
    const mods=(p.worldModifiers||[]).map(mod=>`<span class="wl-pill">${escapeHtml(mod.type||'modifier')}</span>`).join('')||'<span class="muted">No owned modifier recorded in the current start snapshot.</span>';
    els.selection.innerHTML=`<h2>${escapeHtml(p.label)}</h2><p class="muted">Puzzle Instance · ${escapeHtml(p.id)}</p><div>${mods}</div>
      <div class="wl-selection-form"><label>Marker X<input id="wl-puzzle-x" type="number" step="0.1" value="${round(p.x,3)}"></label><label>Extent<input type="text" readonly value="${round(p.minX,1)} → ${round(p.maxX,1)} m"></label></div>
      ${p.pending?`<p class="muted">Move queued from ${round(p.actualX,2)} m to ${round(p.x,2)} m. The game applies it through its normal puzzle-move system on next load.</p>`:''}
      <div class="wl-actions"><button class="primary" id="wl-queue-puzzle">${p.pending?'Update queued move':'Queue move'}</button><button id="wl-open-game">Jump to Game</button>${p.pending?'<button id="wl-cancel-move">Cancel queued move</button>':''}</div>`;
    $('wl-queue-puzzle').addEventListener('click',()=>{const x=number($('wl-puzzle-x').value,p.x);queuePuzzleMove(p.id,x);refreshGameData();select('puzzle',p.id);toast('Puzzle move queued.');});
    $('wl-open-game').addEventListener('click',()=>{const x=number($('wl-puzzle-x').value,p.x);if(Math.abs(x-p.actualX)>.0001)queuePuzzleMove(p.id,x);location.href=`play.html?worldX=${encodeURIComponent(x)}&from=world-lab`;});
    $('wl-cancel-move')?.addEventListener('click',()=>{delete state.pending[p.id];saveJson(STORAGE.pending,state.pending);refreshGameData();select('puzzle',p.id);toast('Queued move cancelled.');});
  }

  function renderElementSelection(item){
    const range=RANGE_TYPES.has(item.type);els.selection.innerHTML=`<h2>${escapeHtml(item.label||TYPE_LABEL[item.type]||item.type)}</h2><p class="muted">${escapeHtml(TYPE_LABEL[item.type]||item.type)} · ${escapeHtml(item.id)}</p>
      <div class="wl-selection-form"><label>Label<input id="wl-el-label" value="${escapeAttr(item.label||'')}"></label><label>Type<select id="wl-el-type">${Object.entries(TYPE_LABEL).map(([v,l])=>`<option value="${v}"${v===item.type?' selected':''}>${escapeHtml(l)}</option>`).join('')}</select></label><label>Start / X<input id="wl-el-start" type="number" step="0.1" value="${round(item.startX,3)}"></label><label>End / X<input id="wl-el-end" type="number" step="0.1" value="${round(item.endX,3)}"${range?'':' disabled'}></label><label>Owner<input id="wl-el-owner" value="${escapeAttr(item.owner||'world')}"></label><label class="wide">Notes<textarea id="wl-el-notes">${escapeHtml(item.notes||'')}</textarea></label></div>
      <div class="wl-actions"><button class="primary" id="wl-save-element">Save</button><button id="wl-jump-element">Jump to Game</button><button class="danger" id="wl-delete-element">Delete</button></div>`;
    $('wl-save-element').addEventListener('click',()=>{item.label=$('wl-el-label').value.trim()||TYPE_LABEL[item.type]||item.type;item.type=$('wl-el-type').value;item.startX=number($('wl-el-start').value,item.startX);item.endX=RANGE_TYPES.has(item.type)?Math.max(item.startX+.2,number($('wl-el-end').value,item.endX)):item.startX;item.owner=$('wl-el-owner').value.trim()||'world';item.notes=$('wl-el-notes').value;saveElements();render();toast('World Element saved.');});
    $('wl-jump-element').addEventListener('click',()=>{location.href=`play.html?worldX=${encodeURIComponent(item.startX)}&from=world-lab`;});
    $('wl-delete-element').addEventListener('click',()=>{if(!confirm(`Delete ${item.label||TYPE_LABEL[item.type]||item.type}?`))return;state.elements=state.elements.filter(e=>e.id!==item.id);state.selected=null;saveElements();render();});
  }

  function queuePuzzleMove(id,x){if(!Number.isFinite(Number(x)))return;state.pending[id]={x:Number(x),queuedAt:Date.now()};saveJson(STORAGE.pending,state.pending);const p=findPuzzle(id);if(p){p.x=Number(x);p.minX=p.x+p.minLocal;p.maxX=p.x+p.maxLocal;p.pending=true;}render();}

  function addElement(){const type=els.newType.value,label=els.newLabel.value.trim()||TYPE_LABEL[type]||type,start=number(els.newStart.value,0),range=RANGE_TYPES.has(type),end=range?Math.max(start+.2,number(els.newEnd.value,start+10)):start;const item={id:uniqueId('world'),type,label,startX:start,endX:end,owner:els.newOwner.value.trim()||'world',notes:'',createdAt:Date.now()};state.elements.push(item);saveElements();state.selected={kind:'element',id:item.id};render();toast('World Element added.');}

  function loadElements(){const raw=loadJson(STORAGE.elements,null);const list=Array.isArray(raw)?raw:(Array.isArray(raw?.elements)?raw.elements:[]);return list.filter(e=>e&&e.id&&e.type).map(e=>({...e,startX:number(e.startX,0),endX:number(e.endX,e.startX)}));}
  function saveElements(){saveJson(STORAGE.elements,{version:1,updatedAt:Date.now(),elements:state.elements});els.status.textContent=`${state.puzzles.length} puzzles · ${state.elements.length} World Elements`;}
  function exportElements(){const blob=new Blob([JSON.stringify({format:'SideScrollWorldElements',version:1,exportedAt:new Date().toISOString(),elements:state.elements},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='SideScroll-World-Elements.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('World Elements exported.');}
  async function importElements(event){const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const list=Array.isArray(parsed)?parsed:parsed.elements;if(!Array.isArray(list))throw new Error();state.elements=list.filter(e=>e&&e.id&&e.type);saveElements();fitWorld(false);toast('World Elements imported.');}catch(_){toast('Import failed.');}event.target.value='';}

  function findPuzzle(id){return state.puzzles.find(p=>p.id===id)||null;}function findElement(id){return state.elements.find(e=>e.id===id)||null;}
  function loadJson(key,fallback){try{const raw=localStorage.getItem(key);return raw==null?clone(fallback):(JSON.parse(raw)||clone(fallback));}catch(_){return clone(fallback);}}
  function saveJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}function number(v,f=0){const n=Number(v);return Number.isFinite(n)?n:Number(f)||0;}function round(v,p=2){const m=10**p;return Math.round(number(v)*m)/m;}
  function uniqueId(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random()*65535).toString(36)}`;}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}function escapeAttr(v){return escapeHtml(v);}
  let toastTimer=0;function toast(msg){els.toast.textContent=msg;els.toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.hidden=true,1800);}
})();
