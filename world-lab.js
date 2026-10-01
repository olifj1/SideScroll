(() => {
  'use strict';

  const STORAGE = {
    elements:'sidescroll.world-elements.v1',
    pending:'sidescroll.world-lab.pending-puzzle-moves.v1',
    puzzleState:'sidescroll.puzzle-groups.state.v1',
    puzzleStarts:'sidescroll.puzzle-groups.starts.v1',
    puzzleLibrary:'sidescroll.puzzle-groups.library.v1',
    puzzleWorkshop:'sidescroll.puzzle-groups.workshop.v1',
    puzzleExclusions:'sidescroll-puzzle-exclusions-v1',
    inventory:'sidescroll.inventory.v1',
    collectables:'sidescroll.collectibles.setup.v1',
    terrain:'sidescroll.terrain-sections.v1',
    player:'sidescroll.player.position.v1',
    playerHints:'sidescroll-player-hints-v1',
    scene:'sidescroll.scene.v1',
    assetBehaviours:'sidescroll.asset-behaviours.v1',
    assetCollisions:'sidescroll.asset-collisions.v1',
    assetClimbPaths:'sidescroll.asset-climb-paths.v1',
    assetMechanisms:'sidescroll.asset-mechanisms.v3',
    assetSockets:'sidescroll.asset-sockets.v1',
    assetStates:'sidescroll.asset-states.v1',
    assetLayout:'sidescroll.asset-layout.v1',
    cameraTune:'sidescroll-camera-tune-v1',
    cameraFollow:'sidescroll-camera-follow-v1',
    renderFog:'sidescroll.render.fog.v1',
    renderPost:'sidescroll.render.post.v1',
    audio:'sidescroll.audio.settings.v1',
    conceptLab:'ss-concept-lab-state-v1',
    designLab:'sidescroll-design-doc-working-v1',
    animClips:'gamehub.walklab.anim.v6',
    animWalk:'gamehub.walklab.anim.v4'
  };

  const SECTION_LENGTH = 10;
  const RANGE_SNAP = 1;
  // v1.0.78: World Lab is an authoring canvas, not a view clipped to current content.
  // Keep a generous future runway and extend it automatically as the user pans right.
  const WORLD_MIN_SPAN = 300;
  const WORLD_EXTEND_STEP = 200;
  const baked = window.SIDESCROLL_BAKED_GAME_DESIGN || {};
  const puzzleConfig = window.SideScrollPuzzleConfig || { groups:{}, markers:[] };
  const RANGE_TYPES = new Set(['biome-region','biome-transition','dressing-group','audio-zone','vfx-zone']);
  const TYPE_TRACK = {
    'biome-region':'biome',
    'biome-transition':'transition',
    'dressing-group':'dressing',
    'explicit-dressing':'dressing',
    'landmark':'other',
    'story-node':'other',
    'camera-node':'other',
    'checkpoint':'other',
    'audio-zone':'other',
    'vfx-zone':'other'
  };
  const TYPE_LABEL = {
    'biome-region':'Biome Region',
    'biome-transition':'Biome Transition',
    'dressing-group':'Dressing Group',
    'explicit-dressing':'Explicit Dressing',
    'landmark':'Terraform Machine / Landmark',
    'story-node':'Story Trigger',
    'camera-node':'Camera Sequence Node',
    'checkpoint':'Spawn / Checkpoint',
    'audio-zone':'Audio Zone',
    'vfx-zone':'VFX / Anomaly Zone'
  };

  const state = {
    minX:-20,
    maxX:300,
    scale:10,
    selected:null,
    drag:null,
    playheadX:null,
    elements:loadElements(),
    pending:loadJson(STORAGE.pending,{}),
    userLibrary:null,
    puzzleState:null,
    puzzleStarts:null,
    terrain:null,
    scene:null,
    terrainExpanded:false,
    history:[],
    puzzles:[]
  };

  const $ = id => document.getElementById(id);
  const els = {
    status:$('wl-status'),
    world:$('wl-world'),
    scroll:$('wl-scroll'),
    sectionGrid:$('wl-section-grid'),
    ruler:$('wl-ruler'),
    trackBiome:$('wl-track-biome'),
    trackTransition:$('wl-track-transition'),
    trackSection:$('wl-track-section'),
    trackTerrainNear:$('wl-track-terrain-near'),
    trackTerrainFarA:$('wl-track-terrain-far-a'),
    trackTerrainFarB:$('wl-track-terrain-far-b'),
    terrainToggle:$('wl-terrain-toggle'),
    terrainLinkHeight:$('wl-link-height'),
    trackPuzzle:$('wl-track-puzzle'),
    trackDressing:$('wl-track-dressing'),
    trackOther:$('wl-track-other'),
    playerLine:$('wl-player-line'),
    playhead:$('wl-playhead'),
    playheadPosition:$('wl-playhead-position'),
    playFromHere:$('wl-play-from-here'),
    selection:$('wl-selection'),
    zoom:$('wl-zoom'),
    zoomValue:$('wl-zoom-value'),
    min:$('wl-min'),
    max:$('wl-max'),
    fit:$('wl-fit'),
    undo:$('wl-undo'),
    refresh:$('wl-refresh'),
    dataToggle:$('wl-data-toggle'),
    dataMenu:$('wl-data-menu'),
    dataClose:$('wl-data-close'),
    dataScrim:$('wl-data-scrim'),
    exportBtn:$('wl-export'),
    importBtn:$('wl-import'),
    resetWorld:$('wl-reset-world'),
    importFile:$('wl-import-file'),
    newType:$('wl-new-type'),
    newLabel:$('wl-new-label'),
    newStart:$('wl-new-start'),
    newEnd:$('wl-new-end'),
    newOwner:$('wl-new-owner'),
    addElement:$('wl-add-element'),
    toast:$('wl-toast')
  };


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
    els.min.addEventListener('change',()=>{
      state.minX=number(els.min.value,state.minX);
      if(state.maxX<=state.minX+20)state.maxX=state.minX+20;
      syncViewInputs();render();
    });
    els.max.addEventListener('change',()=>{
      state.maxX=number(els.max.value,state.maxX);
      if(state.maxX<=state.minX+20)state.maxX=state.minX+20;
      syncViewInputs();render();
    });
    els.fit.addEventListener('click',()=>fitWorld(false));
    els.undo?.addEventListener('click',undoLast);
    bindPinchZoom();
    els.scroll.addEventListener('scroll', maybeExtendWorldOnScroll, {passive:true});
    els.refresh.addEventListener('click',()=>{refreshGameData();fitWorld(false);toast('Game data refreshed.');});
    els.terrainToggle?.addEventListener('click',()=>{state.terrainExpanded=!state.terrainExpanded;render();});
    els.terrainLinkHeight?.addEventListener('change',()=>{
      const terrain=normaliseTerrainState(state.terrain);
      terrain.linkSubsequent=!!els.terrainLinkHeight.checked;
      state.terrain=terrain;
      saveJson(STORAGE.terrain,terrain);
      renderSelection();
    });
    els.playFromHere.addEventListener('click',playFromHere);
    bindPlayheadDrag();

    els.dataToggle.addEventListener('click',()=>{els.dataMenu.hidden?openDataMenu():closeDataMenu();});
    els.dataClose.addEventListener('click',closeDataMenu);
    els.dataScrim.addEventListener('click',closeDataMenu);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDataMenu();});
    els.exportBtn.addEventListener('click',exportCompleteGameDesign);
    els.importBtn.addEventListener('click',()=>els.importFile.click());
    els.importFile.addEventListener('change',importCompleteGameDesign);
    els.resetWorld.addEventListener('click',()=>{
      if(confirm('Clear all World Elements? Puzzle placement is not affected.')){
        state.elements=[];
        saveElements();
        state.selected=null;
        render();
      }
    });
    els.addElement.addEventListener('click',addElement);
  }

  function openDataMenu(){
    els.dataMenu.hidden=false;
    els.dataScrim.hidden=false;
    els.dataToggle.setAttribute('aria-expanded','true');
  }

  function closeDataMenu(){
    els.dataMenu.hidden=true;
    els.dataScrim.hidden=true;
    els.dataToggle.setAttribute('aria-expanded','false');
  }

  function refreshGameData(){
    state.elements = loadElements();
    state.userLibrary = normaliseLibrary(loadJson(STORAGE.puzzleLibrary, baked?.puzzles?.localLibrary || {groups:{},templates:{},markers:[]}));
    state.puzzleState = loadJson(STORAGE.puzzleState,{});
    state.puzzleStarts = loadJson(STORAGE.puzzleStarts,baked?.puzzles?.savedStarts || {});
    state.pending = loadJson(STORAGE.pending,{});
    state.terrain = normaliseTerrainState(loadJson(STORAGE.terrain,{}));
    state.scene = normaliseSceneState(loadJson(STORAGE.scene,{added:[],overrides:{}}));
    state.puzzles = buildPuzzleMarkers();

    if(!Number.isFinite(state.playheadX)){
      const savedPlayer=loadJson(STORAGE.player,null);
      state.playheadX=Number.isFinite(Number(savedPlayer?.x))?Number(savedPlayer.x):0;
    }

    if(els.terrainLinkHeight)els.terrainLinkHeight.checked=state.terrain.linkSubsequent!==false;
    const pendingCount=Object.keys(state.pending||{}).length;
    const assetCount=sceneDressingEntries().length;
    els.status.textContent=`${state.puzzles.length} puzzles · ${state.elements.length} World Elements${assetCount?` · ${assetCount} placed world asset${assetCount===1?'':'s'}`:''}${pendingCount?` · ${pendingCount} queued move${pendingCount===1?'':'s'}`:''}`;
    syncUndoUi();
  }

  function normaliseLibrary(raw){
    const lib=clone(raw)||{};
    lib.groups||={};lib.templates||={};lib.markers||=[];
    const seen=new Set(),out=[];
    for(const m of lib.markers){
      if(!m?.id||!m?.group||!Number.isFinite(Number(m.x))||seen.has(m.id))continue;
      seen.add(m.id);
      out.push({...m,x:Number(m.x),local:true});
    }
    lib.markers=out;
    return lib;
  }

  function normaliseSceneState(raw){
    const scene=raw&&typeof raw==='object'?clone(raw):{};
    scene.added=Array.isArray(scene.added)?scene.added:[];
    scene.overrides=scene.overrides&&typeof scene.overrides==='object'?scene.overrides:{};
    return scene;
  }

  function sceneDressingEntries(){
    // World ownership is independent of gameplay capability. A climbable rock,
    // ladder or other interactive environment asset still belongs on the World
    // Lab timeline when it is not owned by a puzzle instance.
    return (state.scene?.added||[])
      .filter(item=>item&&!item.deleted&&!item.puzzleInstanceId&&Number.isFinite(Number(item.x)))
      .map(item=>({
        kind:'scene-dressing',
        id:String(item.id||`scene-${item.assetName||'asset'}-${item.x}`),
        label:item.assetName||'World asset',
        x:Number(item.x),
        z:number(item.z,0),
        sx:Math.max(.1,Math.abs(number(item.sx,1))),
        sy:Math.max(.1,Math.abs(number(item.sy,1))),
        raw:item
      }));
  }

  function buildPuzzleMarkers(){
    const localLabels=new Set(
      state.userLibrary.markers
        .map(m=>(state.userLibrary.groups?.[m.group]?.label||'').trim().toLowerCase())
        .filter(Boolean)
    );
    const builtIns=(puzzleConfig.markers||[]).filter(m=>!localLabels.has((puzzleConfig.groups?.[m.group]?.label||'').trim().toLowerCase()));
    return [...builtIns,...state.userLibrary.markers].map(marker=>{
      const local=state.userLibrary.markers.some(m=>m.id===marker.id);
      const def=state.userLibrary.groups?.[marker.group]||puzzleConfig.groups?.[marker.group]||{};
      const actualX=local?Number(marker.x):number(state.puzzleState?.[marker.id]?.markerX,Number(marker.x)||0);
      const queued=state.pending?.[marker.id];
      const x=Number.isFinite(Number(queued?.x))?Number(queued.x):actualX;
      const start=marker.linkMode==='copy'
        ? state.puzzleStarts?.[marker.id]
        : (state.userLibrary.templates?.[marker.group]||state.puzzleStarts?.[marker.id]);
      const bounds=start?.bounds||def.bounds||null;
      const minLocal=Number.isFinite(Number(bounds?.minX))?Number(bounds.minX):-(Number(def.width)||8)/2;
      const maxLocal=Number.isFinite(Number(bounds?.maxX))?Number(bounds.maxX):(Number(def.width)||8)/2;
      const mods=Array.isArray(start?.worldModifiers)?start.worldModifiers:[];
      return {
        kind:'puzzle',id:marker.id,group:marker.group,label:def.label||marker.group,
        x,actualX,local,minX:x+minLocal,maxX:x+maxLocal,minLocal,maxLocal,pending:!!queued,worldModifiers:mods
      };
    });
  }

  function modifierEntries(){
    const list=[];
    for(const puzzle of state.puzzles){
      (puzzle.worldModifiers||[]).forEach((mod,index)=>{
        if(!mod||typeof mod!=='object')return;
        const type=String(mod.type||'modifier');
        const centre=puzzle.x+number(mod.centerX,number(mod.x,0));
        const width=Math.max(0.2,number(mod.width,number(mod.settings?.width,type==='river'?4.8:0.8)));
        const startX=centre-width/2;
        const endX=centre+width/2;
        list.push({
          id:`${puzzle.id}:${index}`,
          kind:'modifier',
          index,
          type,
          puzzleId:puzzle.id,
          puzzleLabel:puzzle.label,
          ownerRole:mod.ownerRole||'',
          centre,
          width,
          startX,
          endX,
          relativeCenter:number(mod.centerX,number(mod.x,0)),
          raw:mod
        });
      });
    }
    return list;
  }

  function fitWorld(initial){
    const values=[];
    for(const p of state.puzzles)values.push(p.minX,p.maxX,p.x);
    for(const e of state.elements)values.push(number(e.startX,0),number(e.endX,e.startX));
    for(const d of sceneDressingEntries())values.push(d.x-d.sx*.5,d.x+d.sx*.5);
    for(const m of modifierEntries())values.push(m.startX,m.endX);
    if(Number.isFinite(state.playheadX))values.push(state.playheadX);
    const lo=values.length?Math.min(...values):-10;
    const hi=values.length?Math.max(...values):100;
    state.minX=Math.floor((lo-15)/10)*10;
    state.maxX=Math.ceil((hi+20)/10)*10;
    // Always leave enough empty world ahead to keep authoring beyond the last
    // existing puzzle/section. More runway is appended when the scroll nears it.
    if(state.maxX-state.minX<WORLD_MIN_SPAN)state.maxX=state.minX+WORLD_MIN_SPAN;
    syncViewInputs();
    render();
  }

  function syncViewInputs(){
    els.min.value=round(state.minX,1);
    els.max.value=round(state.maxX,1);
    els.zoom.value=String(state.scale);
    els.zoomValue.textContent=`${state.scale} px/m`;
    els.playheadPosition.textContent=`${round(state.playheadX,1)} m`;
  }

  function maybeExtendWorldOnScroll(){
    const scroller=els.scroll;
    if(!scroller)return;
    const remaining=scroller.scrollWidth-scroller.clientWidth-scroller.scrollLeft;
    const threshold=Math.max(180,scroller.clientWidth*.22);
    if(remaining>threshold)return;
    const keepLeft=scroller.scrollLeft;
    state.maxX+=WORLD_EXTEND_STEP;
    render();
    scroller.scrollLeft=keepLeft;
  }

  function worldWidth(){return Math.max(500,(state.maxX-state.minX)*state.scale);}
  function xToPx(x){return (Number(x)-state.minX)*state.scale;}
  function pxToX(px){return state.minX+px/state.scale;}
  function sectionIndexAt(x){return Math.floor((number(x,0)+SECTION_LENGTH/2)/SECTION_LENGTH);}
  function sectionBounds(index){const center=Number(index)*SECTION_LENGTH;return {index:Number(index),center,min:center-SECTION_LENGTH/2,max:center+SECTION_LENGTH/2};}

  const TERRAIN_LAYERS={
    path:{id:'path',label:'Path',follow:1,radius:0},
    near:{id:'near',label:'Near Strip',follow:1,radius:0},
    farA:{id:'farA',label:'Far Strip A',follow:.88,radius:1},
    farB:{id:'farB',label:'Far Strip B',follow:.62,radius:2}
  };
  const TERRAIN_DETAIL_IDS=['near','farA','farB'];

  function normaliseTerrainLayers(raw){
    const source=raw&&typeof raw==='object'?raw:{};
    const out={};
    for(const id of TERRAIN_DETAIL_IDS){
      const item=source[id]&&typeof source[id]==='object'?source[id]:{};
      out[id]={
        offsets:item.offsets&&typeof item.offsets==='object'?{...item.offsets}:{},
        modes:item.modes&&typeof item.modes==='object'?{...item.modes}:{},
        heights:item.heights&&typeof item.heights==='object'?{...item.heights}:{}
      };
    }
    return out;
  }

  function sparseNumberAt(map,index,fallback=0,min=-80,max=100){
    const target=Math.trunc(number(index,0));let best=-Infinity,value=fallback;
    for(const [keyRaw,valueRaw] of Object.entries(map||{})){
      const key=Math.trunc(number(keyRaw,NaN)),next=number(valueRaw,NaN);
      if(Number.isFinite(key)&&Number.isFinite(next)&&key<=target&&key>best){best=key;value=Math.max(min,Math.min(max,next));}
    }
    return value;
  }

  function terrainLayerModeInfo(index,layerId,terrain=state.terrain){
    const target=Math.trunc(number(index,0)),settings=terrain?.layers?.[layerId]||{};
    let best=-Infinity,mode='derived';
    for(const [keyRaw,modeRaw] of Object.entries(settings.modes||{})){
      const key=Math.trunc(number(keyRaw,NaN));
      if(Number.isFinite(key)&&key<=target&&key>best){best=key;mode=modeRaw==='explicit'?'explicit':'derived';}
    }
    return {mode,startIndex:best};
  }

  function terrainLayerOffsetAt(index,layerId,terrain=state.terrain){return sparseNumberAt(terrain?.layers?.[layerId]?.offsets,index,0,-40,40);}

  function terrainLayerDerivedHeight(index,layerId,terrain=state.terrain){
    const layer=TERRAIN_LAYERS[layerId]||TERRAIN_LAYERS.path;
    if(layer.id==='path')return terrainSectionHeight(index,terrain);
    const radius=Math.max(0,Math.trunc(layer.radius||0));let weighted=0,total=0;
    for(let d=-radius;d<=radius;d++){const w=radius?radius+1-Math.abs(d):1;weighted+=terrainSectionHeight(index+d,terrain)*w;total+=w;}
    return (total?weighted/total:terrainSectionHeight(index,terrain))*number(layer.follow,1)+terrainLayerOffsetAt(index,layerId,terrain);
  }

  function terrainLayerExplicitHeight(index,layerId,modeStart,terrain=state.terrain){
    const target=Math.trunc(number(index,0)),settings=terrain?.layers?.[layerId]||{};let best=-Infinity,value=null;
    for(const [keyRaw,valueRaw] of Object.entries(settings.heights||{})){
      const key=Math.trunc(number(keyRaw,NaN)),next=number(valueRaw,NaN);
      if(Number.isFinite(key)&&Number.isFinite(next)&&key>=modeStart&&key<=target&&key>best){best=key;value=Math.max(-80,Math.min(100,next));}
    }
    return value===null?terrainLayerDerivedHeight(Number.isFinite(modeStart)?modeStart:target,layerId,terrain):value;
  }


  function normaliseTerrainState(raw){
    const terrain=raw&&typeof raw==='object'?clone(raw):{};
    terrain.hidden=Array.isArray(terrain.hidden)?terrain.hidden:[];
    terrain.collisionDisabled=Array.isArray(terrain.collisionDisabled)?terrain.collisionDisabled:[];
    terrain.types=terrain.types&&typeof terrain.types==='object'?terrain.types:{};
    terrain.settings=terrain.settings&&typeof terrain.settings==='object'?terrain.settings:{};
    terrain.heights=terrain.heights&&typeof terrain.heights==='object'?terrain.heights:{};
    terrain.layers=normaliseTerrainLayers(terrain.layers);
    terrain.linkSubsequent=terrain.linkSubsequent!==false;
    return terrain;
  }

  function terrainSectionHeight(index,terrain=state.terrain){
    const target=Math.trunc(number(index,0));
    let best=-Infinity,value=0;
    for(const [key,raw] of Object.entries(terrain?.heights||{})){
      const i=Math.trunc(number(key,NaN));
      const h=number(raw,NaN);
      if(Number.isFinite(i)&&Number.isFinite(h)&&i<=target&&i>best){best=i;value=h;}
    }
    return Math.max(-50,Math.min(80,value));
  }

  function terrainLayerSectionHeight(index,layerId='path',terrain=state.terrain){
    const layer=TERRAIN_LAYERS[layerId]||TERRAIN_LAYERS.path;
    if(layer.id==='path')return terrainSectionHeight(index,terrain);
    const info=terrainLayerModeInfo(index,layer.id,terrain);
    return info.mode==='explicit'?terrainLayerExplicitHeight(index,layer.id,info.startIndex,terrain):terrainLayerDerivedHeight(index,layer.id,terrain);
  }

  function setTerrainLayerMode(index,layerId,mode){
    if(!TERRAIN_DETAIL_IDS.includes(layerId))return false;
    const i=Math.trunc(number(index,0));const terrain=normaliseTerrainState(state.terrain);const current=terrainLayerSectionHeight(i,layerId,terrain);const layer=terrain.layers[layerId];
    layer.modes[String(i)]=mode==='explicit'?'explicit':'derived';
    if(mode==='explicit'&&!(String(i) in layer.heights))layer.heights[String(i)]=round(current,3);
    state.terrain=terrain;saveJson(STORAGE.terrain,terrain);return true;
  }

  function setTerrainLayerOffset(index,layerId,offset){
    if(!TERRAIN_DETAIL_IDS.includes(layerId))return false;
    const i=Math.trunc(number(index,0));const terrain=normaliseTerrainState(state.terrain);terrain.layers[layerId].offsets[String(i)]=round(Math.max(-40,Math.min(40,number(offset,0))),3);state.terrain=terrain;saveJson(STORAGE.terrain,terrain);return true;
  }

  function setTerrainLayerExplicitHeight(index,layerId,height){
    if(!TERRAIN_DETAIL_IDS.includes(layerId))return false;
    const i=Math.trunc(number(index,0));const terrain=normaliseTerrainState(state.terrain);const layer=terrain.layers[layerId];layer.modes[String(i)]='explicit';layer.heights[String(i)]=round(Math.max(-80,Math.min(100,number(height,0))),3);state.terrain=terrain;saveJson(STORAGE.terrain,terrain);return true;
  }

  function setTerrainSectionHeight(index,nextHeight,linkSubsequent=state.terrain?.linkSubsequent!==false){
    const i=Math.trunc(number(index,0));
    const terrain=normaliseTerrainState(state.terrain);
    const old=terrainSectionHeight(i,terrain);
    const oldNext=terrainSectionHeight(i+1,terrain);
    const target=Math.max(-50,Math.min(80,number(nextHeight,old)));
    const delta=target-old;
    if(Math.abs(delta)<.0001)return false;
    const heights={...(terrain.heights||{})};
    if(linkSubsequent){
      for(const key of Object.keys(heights)){const k=Math.trunc(number(key,NaN));if(Number.isFinite(k)&&k>i)heights[String(k)]=round(number(heights[key],0)+delta,3);}
      heights[String(i)]=round(target,3);
    }else{
      heights[String(i)]=round(target,3);
      if(!(String(i+1) in heights))heights[String(i+1)]=round(oldNext,3);
    }
    terrain.heights=heights;
    terrain.linkSubsequent=!!linkSubsequent;
    state.terrain=terrain;
    saveJson(STORAGE.terrain,terrain);
    return true;
  }

  function render(){
    syncViewInputs();
    document.body.classList.toggle('wl-terrain-expanded',!!state.terrainExpanded);
    if(els.terrainToggle){els.terrainToggle.setAttribute('aria-expanded',String(!!state.terrainExpanded));const icon=els.terrainToggle.querySelector('i');if(icon)icon.textContent=state.terrainExpanded?'▴':'▾';}
    if(els.terrainLinkHeight)els.terrainLinkHeight.checked=state.terrain?.linkSubsequent!==false;
    const width=worldWidth();
    els.world.style.width=`${width}px`;
    renderGrid();
    renderElements();
    renderSections();
    renderPuzzles();
    renderPlayhead();
    renderSelection();
  }

  function renderGrid(){
    els.sectionGrid.innerHTML='';
    els.ruler.innerHTML='';
    const first=Math.floor((state.minX+5)/SECTION_LENGTH);
    const last=Math.ceil((state.maxX+5)/SECTION_LENGTH);
    for(let index=first;index<=last;index++){
      const {min}=sectionBounds(index);
      const cell=document.createElement('div');
      cell.className='wl-section-grid-cell';
      cell.style.left=`${xToPx(min)}px`;
      cell.style.width=`${SECTION_LENGTH*state.scale}px`;
      els.sectionGrid.appendChild(cell);
    }
    const majorStep=state.scale>=14?10:(state.scale>=8?20:40);
    for(let x=Math.ceil(state.minX/majorStep)*majorStep;x<=state.maxX;x+=majorStep){
      const tick=document.createElement('div');
      tick.className='wl-ruler-tick';
      tick.style.left=`${xToPx(x)}px`;
      const b=document.createElement('b');
      b.textContent=`${round(x,0)}m`;
      tick.appendChild(b);
      els.ruler.appendChild(tick);
    }
  }

  function renderElements(){
    for(const el of [els.trackBiome,els.trackTransition,els.trackDressing,els.trackOther])el.innerHTML='';
    for(const item of state.elements){
      const track=TYPE_TRACK[item.type]||'other';
      const host=track==='biome'?els.trackBiome:track==='transition'?els.trackTransition:track==='dressing'?els.trackDressing:els.trackOther;
      host.appendChild(makeWorldElementNode(item,track));
    }
    for(const item of sceneDressingEntries()) els.trackDressing.appendChild(makeSceneDressingNode(item));
  }

  function makeSceneDressingNode(item){
    const node=document.createElement('button');
    node.type='button';
    node.className=`wl-item dressing scene-dressing${isSelected('scene-dressing',item.id)?' selected':''}`;
    node.style.left=`${xToPx(item.x-item.sx*.5)}px`;
    node.style.width=`${Math.max(14,item.sx*state.scale)}px`;
    node.textContent=item.label;
    node.title=`World asset · ${item.label} · ${round(item.x,2)} m${item.raw?.gameplayType?` · ${item.raw.gameplayType}`:''}`;
    node.addEventListener('click',event=>{event.stopPropagation();select('scene-dressing',item.id);});
    return node;
  }

  function makeWorldElementNode(item,track){
    const node=document.createElement('div');
    const range=RANGE_TYPES.has(item.type);
    node.className=`wl-item ${track}${range?' range':' point'}${isSelected('element',item.id)?' selected':''}`;
    node.dataset.kind='element';
    node.dataset.id=item.id;
    if(range){
      const left=makeResizeHandle(item,'left');
      const label=document.createElement('span');
      label.className='wl-item-label';
      label.textContent=item.label||TYPE_LABEL[item.type]||item.type;
      const right=makeResizeHandle(item,'right');
      node.append(left,label,right);
    }else{
      node.dataset.short=item.label||TYPE_LABEL[item.type]||item.type;
    }
    positionWorldElementNode(node,item);
    bindDraggable(node,{kind:'element',id:item.id});
    node.addEventListener('click',e=>{if(state.drag?.moved)return;select('element',item.id);e.stopPropagation();});
    return node;
  }

  function positionWorldElementNode(node,item){
    const range=RANGE_TYPES.has(item.type);
    const start=number(item.startX,0);
    const end=range?Math.max(start+RANGE_SNAP,number(item.endX,start+RANGE_SNAP)):start;
    node.style.left=`${xToPx(start)}px`;
    if(range)node.style.width=`${Math.max(12,(end-start)*state.scale)}px`;
    node.title=`${item.label||item.type} · ${round(start,1)}m${range?` → ${round(end,1)}m · ${round(end-start,1)}m long`:''}`;
  }

  function makeResizeHandle(item,side){
    const handle=document.createElement('button');
    handle.type='button';
    handle.className=`wl-resize-handle ${side}`;
    handle.setAttribute('aria-label',`${side==='left'?'Move start':'Move end'} of ${item.label||TYPE_LABEL[item.type]||item.type}`);
    handle.title=side==='left'?'Drag to resize start':'Drag to resize end';
    bindRangeResize(handle,item,side);
    handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();select('element',item.id);});
    return handle;
  }

  function bindRangeResize(handle,item,side){
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;
      if(!isSelected('element',item.id))return;
      pushHistory('Resize world element');
      event.preventDefault();event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      const startClient=event.clientX;
      const originalStart=number(item.startX,0);
      const originalEnd=Math.max(originalStart+RANGE_SNAP,number(item.endX,originalStart+RANGE_SNAP));
      state.drag={kind:'element-resize',id:item.id,side,startClient,startX:originalStart,startEnd:originalEnd,moved:false};
      select('element',item.id,false);
      const node=handle.closest('.wl-item');
      const move=e=>{
        if(!state.drag)return;
        const rawDelta=(e.clientX-startClient)/state.scale;
        if(Math.abs(e.clientX-startClient)>2)state.drag.moved=true;
        if(side==='left'){
          item.startX=Math.min(originalEnd-RANGE_SNAP,snapTo(originalStart+rawDelta,RANGE_SNAP));
          item.endX=originalEnd;
        }else{
          item.startX=originalStart;
          item.endX=Math.max(originalStart+RANGE_SNAP,snapTo(originalEnd+rawDelta,RANGE_SNAP));
        }
        if(node)positionWorldElementNode(node,item);
        renderSelection();
      };
      const end=()=>{
        handle.removeEventListener('pointermove',move);
        handle.removeEventListener('pointerup',end);
        handle.removeEventListener('pointercancel',end);
        const moved=state.drag?.moved;
        state.drag=null;
        if(moved){saveElements();toast(`Range ${round(item.startX,0)}–${round(item.endX,0)} m.`);}
        render();
      };
      handle.addEventListener('pointermove',move);
      handle.addEventListener('pointerup',end);
      handle.addEventListener('pointercancel',end);
    });
  }

  function renderTerrainProfile(host,layerId,first,last,minHeight,maxHeight,{showSections=false}={}){
    if(!host)return;
    const rowHeight=showSections?90:72;
    const topPad=10,bottomPad=10;
    const usable=Math.max(12,rowHeight-topPad-bottomPad);
    const lo=minHeight,hi=maxHeight;
    const span=Math.max(2,hi-lo);
    const yFor=h=>topPad+(hi-h)/span*usable;
    const points=[];
    for(let index=first-1;index<=last+1;index++){
      const x=sectionBounds(index).center;
      const h=terrainLayerSectionHeight(index,layerId);
      points.push({index,x,h,px:xToPx(x),py:yFor(h)});
    }
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      const dx=b.px-a.px,dy=b.py-a.py;
      const line=document.createElement('div');
      line.className=`wl-terrain-profile-line ${layerId}`;
      line.style.left=`${a.px}px`;line.style.top=`${a.py}px`;line.style.width=`${Math.hypot(dx,dy)}px`;line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
      host.appendChild(line);
    }
    for(const point of points.filter(p=>p.index>=first&&p.index<=last)){
      const dot=document.createElement('button');
      dot.type='button';
      const modeInfo=layerId==='path'?{mode:'derived'}:terrainLayerModeInfo(point.index,layerId);
      const explicit=modeInfo.mode==='explicit';
      dot.className=`wl-terrain-height-point ${layerId}${explicit?' explicit':''}${showSections&&isSelected('section',String(point.index))?' selected':''}`;
      dot.style.left=`${point.px}px`;dot.style.top=`${point.py}px`;
      dot.title=`${TERRAIN_LAYERS[layerId]?.label||layerId} · S${point.index} · ${point.h>=0?'+':''}${round(point.h,2)} m${explicit?' · explicit':''}`;
      dot.innerHTML=`<span>${point.h>=0?'+':''}${round(point.h,1)}${explicit?' E':''}</span>`;
      if(showSections)dot.addEventListener('click',event=>{event.stopPropagation();select('section',String(point.index));});
      else dot.tabIndex=-1;
      host.appendChild(dot);
    }
  }

  function renderSections(){
    els.trackSection.innerHTML='';
    if(els.trackTerrainNear)els.trackTerrainNear.innerHTML='';
    if(els.trackTerrainFarA)els.trackTerrainFarA.innerHTML='';
    if(els.trackTerrainFarB)els.trackTerrainFarB.innerHTML='';
    const modifiers=modifierEntries();
    const first=Math.floor((state.minX+5)/SECTION_LENGTH);
    const last=Math.ceil((state.maxX+5)/SECTION_LENGTH);

    const layerIds=state.terrainExpanded?['path','near','farA','farB']:['path'];
    const visibleHeights=[];
    for(const layerId of layerIds)for(let i=first-1;i<=last+1;i++)visibleHeights.push(terrainLayerSectionHeight(i,layerId));
    let minHeight=visibleHeights.length?Math.min(...visibleHeights):-1;
    let maxHeight=visibleHeights.length?Math.max(...visibleHeights):1;
    if(maxHeight-minHeight<2){const mid=(maxHeight+minHeight)*.5;minHeight=mid-1;maxHeight=mid+1;}else{minHeight-=.75;maxHeight+=.75;}

    for(let index=first;index<=last;index++){
      const bounds=sectionBounds(index);
      const type=state.terrain?.types?.[String(index)]||'normal';
      const hidden=Array.isArray(state.terrain?.hidden)&&state.terrain.hidden.map(Number).includes(index);
      const collisionDisabled=Array.isArray(state.terrain?.collisionDisabled)&&state.terrain.collisionDisabled.map(Number).includes(index);
      const modified=modifiers.some(mod=>mod.endX>bounds.min&&mod.startX<bounds.max);
      const height=terrainSectionHeight(index);
      const node=document.createElement('button');
      node.type='button';
      node.className=`wl-section-box${type!=='normal'?' special':''}${modified?' modified':''}${hidden?' hidden-section':''}${collisionDisabled?' no-collision':''}${isSelected('section',String(index))?' selected':''}`;
      node.style.left=`${xToPx(bounds.min)}px`;
      node.style.width=`${SECTION_LENGTH*state.scale}px`;
      node.innerHTML=`<strong>S${index}</strong><small>${height>=0?'+':''}${round(height,1)} m${modified?' · MOD':''}</small>`;
      node.title=`Section ${index} · ${round(bounds.min,1)} to ${round(bounds.max,1)} m · path ${height>=0?'+':''}${round(height,2)} m`;
      node.addEventListener('click',e=>{select('section',String(index));e.stopPropagation();});
      els.trackSection.appendChild(node);
    }

    renderTerrainProfile(els.trackSection,'path',first,last,minHeight,maxHeight,{showSections:true});
    if(state.terrainExpanded){
      renderTerrainProfile(els.trackTerrainNear,'near',first,last,minHeight,maxHeight);
      renderTerrainProfile(els.trackTerrainFarA,'farA',first,last,minHeight,maxHeight);
      renderTerrainProfile(els.trackTerrainFarB,'farB',first,last,minHeight,maxHeight);
    }

    for(const modifier of modifiers){
      const node=document.createElement('button');
      node.type='button';
      node.className=`wl-section-modifier ${modifier.type==='river'?'river':'generic'}${isSelected('modifier',modifier.id)?' selected':''}`;
      node.style.left=`${xToPx(modifier.startX)}px`;
      node.style.width=`${Math.max(22,modifier.width*state.scale)}px`;
      node.textContent=`${modifier.type.toUpperCase()} · ${modifier.puzzleLabel}`;
      node.title=`${modifier.puzzleLabel} ${modifier.type} · ${round(modifier.startX,1)} → ${round(modifier.endX,1)} m`;
      node.addEventListener('click',e=>{select('modifier',modifier.id);e.stopPropagation();});
      els.trackSection.appendChild(node);
    }
  }

  function renderPuzzles(){
    els.trackPuzzle.innerHTML='';
    for(const puzzle of state.puzzles){
      const width=Math.max(14,(puzzle.maxX-puzzle.minX)*state.scale);
      const node=document.createElement('div');
      node.className=`wl-item puzzle${puzzle.pending?' pending':''}${isSelected('puzzle',puzzle.id)?' selected':''}`;
      node.dataset.kind='puzzle';
      node.dataset.id=puzzle.id;
      node.style.left=`${xToPx(puzzle.minX)}px`;
      node.style.width=`${width}px`;
      node.textContent=puzzle.label;
      node.title=`${puzzle.label} · marker ${round(puzzle.x,2)}m`;
      bindDraggable(node,{kind:'puzzle',id:puzzle.id});
      node.addEventListener('click',e=>{if(state.drag?.moved)return;select('puzzle',puzzle.id);e.stopPropagation();});
      els.trackPuzzle.appendChild(node);
    }
  }

  function renderPlayhead(){
    const x=number(state.playheadX,0);
    els.playheadPosition.textContent=`${round(x,1)} m`;
    if(x<state.minX||x>state.maxX){
      els.playerLine.hidden=true;
      return;
    }
    els.playerLine.hidden=false;
    els.playerLine.style.left=`${xToPx(x)}px`;
    els.playhead.classList.toggle('selected',isSelected('playhead','player'));
    els.playhead.title=`Play from ${round(x,2)} m`;
  }

  function bindPlayheadDrag(){
    const node=els.playhead;
    node.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;
      event.preventDefault();event.stopPropagation();
      node.setPointerCapture?.(event.pointerId);
      const startClient=event.clientX;
      const startX=number(state.playheadX,0);
      let moved=false;
      const move=e=>{
        const delta=(e.clientX-startClient)/state.scale;
        if(Math.abs(e.clientX-startClient)>2)moved=true;
        state.playheadX=round(Math.max(state.minX,Math.min(state.maxX,startX+delta)),2);
        renderPlayhead();
        if(isSelected('playhead','player'))renderSelection();
      };
      const end=()=>{
        node.removeEventListener('pointermove',move);
        node.removeEventListener('pointerup',end);
        node.removeEventListener('pointercancel',end);
        state.selected={kind:'playhead',id:'player'};
        renderSelection();
        if(moved)toast(`Playhead set to ${round(state.playheadX,1)} m.`);
      };
      node.addEventListener('pointermove',move);
      node.addEventListener('pointerup',end);
      node.addEventListener('pointercancel',end);
    });
    node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();select('playhead','player');});
  }

  function playFromHere(){
    const x=round(state.playheadX,3);
    if(!Number.isFinite(x)){toast('Choose a valid playhead position first.');return;}
    const saved=loadJson(STORAGE.player,{});
    saveJson(STORAGE.player,{...saved,x,facing:saved?.facing===-1?-1:1,savedAt:Date.now(),source:'world-lab'});
    // replace() avoids leaving a broken transient launch URL in the back stack.
    location.href=`play.html?worldX=${encodeURIComponent(x)}&from=world-lab`;
  }

  function bindDraggable(node,ref){
    node.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;
      // First tap/release only selects. This deliberately leaves native timeline
      // panning untouched until a second gesture begins on the selected block.
      if(!isSelected(ref.kind,ref.id))return;
      pushHistory(ref.kind==='puzzle'?'Move puzzle':'Move world element');
      event.preventDefault();event.stopPropagation();
      node.setPointerCapture?.(event.pointerId);
      const startClient=event.clientX;
      let startX,startEnd;
      if(ref.kind==='puzzle'){
        const p=findPuzzle(ref.id);startX=p.x;startEnd=null;
      }else{
        const item=findElement(ref.id);startX=number(item.startX,0);startEnd=number(item.endX,startX);
      }
      state.drag={...ref,startClient,startX,startEnd,moved:false};
      const move=e=>{
        if(!state.drag)return;
        const delta=(e.clientX-startClient)/state.scale;
        if(Math.abs(e.clientX-startClient)>3)state.drag.moved=true;
        if(ref.kind==='puzzle'){
          const p=findPuzzle(ref.id);
          if(p){
            p.x=round(startX+delta,3);
            p.minX=p.x+p.minLocal;
            p.maxX=p.x+p.maxLocal;
            node.style.left=`${xToPx(p.minX)}px`;
            renderSections();
            renderSelection();
          }
        }else{
          const item=findElement(ref.id);
          if(item){
            if(RANGE_TYPES.has(item.type)){
              const snappedStart=snapTo(startX+delta,RANGE_SNAP);
              const snappedLength=Math.max(RANGE_SNAP,snapTo(startEnd-startX,RANGE_SNAP));
              item.startX=snappedStart;
              item.endX=round(snappedStart+snappedLength,3);
            }else{
              item.startX=round(startX+delta,3);
              item.endX=item.startX;
            }
            positionWorldElementNode(node,item);
            renderSelection();
          }
        }
      };
      const end=()=>{
        node.removeEventListener('pointermove',move);
        node.removeEventListener('pointerup',end);
        node.removeEventListener('pointercancel',end);
        if(!state.drag)return;
        const moved=state.drag.moved;
        if(moved){
          if(ref.kind==='puzzle'){
            const p=findPuzzle(ref.id);queuePuzzleMove(p.id,p.x);
          }else saveElements();
        }
        state.drag=null;
        render();
      };
      node.addEventListener('pointermove',move);
      node.addEventListener('pointerup',end);
      node.addEventListener('pointercancel',end);
    });
  }

  function select(kind,id,rerender=true){state.selected={kind,id};if(rerender)render();}
  function isSelected(kind,id){return state.selected?.kind===kind&&String(state.selected?.id)===String(id);}

  function renderSelection(){
    if(!state.selected){
      els.selection.innerHTML='<h2>Selection</h2><p class="muted">Tap a section, terrain modifier, puzzle marker or World Element above.</p>';
      return;
    }
    if(state.selected.kind==='puzzle'){
      const p=findPuzzle(state.selected.id);
      if(!p){state.selected=null;return renderSelection();}
      return renderPuzzleSelection(p);
    }
    if(state.selected.kind==='element'){
      const item=findElement(state.selected.id);
      if(!item){state.selected=null;return renderSelection();}
      return renderElementSelection(item);
    }
    if(state.selected.kind==='scene-dressing'){
      const item=sceneDressingEntries().find(entry=>entry.id===state.selected.id);
      if(!item){state.selected=null;return renderSelection();}
      return renderSceneDressingSelection(item);
    }
    if(state.selected.kind==='section')return renderSectionSelection(Number(state.selected.id));
    if(state.selected.kind==='modifier'){
      const mod=findModifier(state.selected.id);
      if(!mod){state.selected=null;return renderSelection();}
      return renderModifierSelection(mod);
    }
    if(state.selected.kind==='playhead')return renderPlayheadSelection();
  }

  function renderPuzzleSelection(p){
    const mods=(p.worldModifiers||[]).map(mod=>`<span class="wl-pill">${escapeHtml(mod.type||'modifier')}</span>`).join('')||'<span class="muted">No owned modifier recorded in the current start snapshot.</span>';
    els.selection.innerHTML=`<h2>${escapeHtml(p.label)}</h2><p class="muted">Puzzle Instance · ${escapeHtml(p.id)}</p><div>${mods}</div>
      <div class="wl-selection-form"><label>Marker X<input id="wl-puzzle-x" type="number" step="0.1" value="${round(p.x,3)}"></label><label>Extent<input type="text" readonly value="${round(p.minX,1)} → ${round(p.maxX,1)} m"></label></div>
      ${p.pending?`<p class="muted">Move queued from ${round(p.actualX,2)} m to ${round(p.x,2)} m. The game applies it through its normal puzzle-move system on next load.</p>`:''}
      <div class="wl-actions"><button class="primary" id="wl-queue-puzzle">${p.pending?'Update queued move':'Queue move'}</button><button id="wl-open-game">Jump to Game</button><button id="wl-playhead-to-puzzle">Move playhead here</button>${p.pending?'<button id="wl-cancel-move">Cancel queued move</button>':''}</div>`;
    $('wl-queue-puzzle').addEventListener('click',()=>{
      pushHistory('Queue puzzle move');
      const x=number($('wl-puzzle-x').value,p.x);
      queuePuzzleMove(p.id,x);refreshGameData();select('puzzle',p.id);toast('Puzzle move queued.');
    });
    $('wl-open-game').addEventListener('click',()=>{
      const x=number($('wl-puzzle-x').value,p.x);
      if(Math.abs(x-p.actualX)>.0001)queuePuzzleMove(p.id,x);
      location.href=`play.html?worldX=${encodeURIComponent(x)}&from=world-lab`;
    });
    $('wl-playhead-to-puzzle').addEventListener('click',()=>{state.playheadX=p.x;select('playhead','player');});
    $('wl-cancel-move')?.addEventListener('click',()=>{
      pushHistory('Cancel puzzle move');
      delete state.pending[p.id];saveJson(STORAGE.pending,state.pending);refreshGameData();select('puzzle',p.id);toast('Queued move cancelled.');
    });
  }

  function terrainLayerControlHtml(index,layerId){
    const info=terrainLayerModeInfo(index,layerId);
    const explicit=info.mode==='explicit';
    const offset=terrainLayerOffsetAt(index,layerId);
    const height=terrainLayerSectionHeight(index,layerId);
    const label=TERRAIN_LAYERS[layerId]?.label||layerId;
    const sliderValue=explicit?height:offset;
    return `<div class="wl-layer-control" data-layer="${layerId}">
      <div class="wl-layer-control-head"><strong>${escapeHtml(label)}</strong><span>${explicit?'Explicit':'Linked'} · ${height>=0?'+':''}${round(height,2)} m</span></div>
      <div class="wl-selection-form compact">
        <label>Mode<select data-layer-mode="${layerId}"><option value="derived"${explicit?'':' selected'}>Linked to Path</option><option value="explicit"${explicit?' selected':''}>Explicit</option></select></label>
        <label class="wl-layer-slider"><span>${explicit?'Height':'Offset'} <b data-layer-live="${layerId}">${sliderValue>=0?'+':''}${round(sliderValue,2)} m</b></span><input data-layer-value="${layerId}" type="range" step="${explicit?'0.1':'0.05'}" min="${explicit?'-50':'-6'}" max="${explicit?'80':'6'}" value="${round(sliderValue,2)}"></label>
      </div>
      <small>${explicit?'Holds its own world height from this section until you link it again.':'Offset is held from this section forward while the strip follows the Path profile.'}</small>
    </div>`;
  }

  function renderSectionSelection(index){
    const bounds=sectionBounds(index);
    const type=state.terrain?.types?.[String(index)]||'normal';
    const settings=state.terrain?.settings?.[String(index)]||{};
    const hidden=Array.isArray(state.terrain?.hidden)&&state.terrain.hidden.map(Number).includes(index);
    const collisionDisabled=Array.isArray(state.terrain?.collisionDisabled)&&state.terrain.collisionDisabled.map(Number).includes(index);
    const mods=modifierEntries().filter(mod=>mod.endX>bounds.min&&mod.startX<bounds.max);
    const modRows=mods.length?mods.map(mod=>`<button class="wl-mod-row" type="button" data-mod-id="${escapeAttr(mod.id)}"><strong>${escapeHtml(mod.type.toUpperCase())}</strong><span>${escapeHtml(mod.puzzleLabel)} · ${round(mod.startX,1)} → ${round(mod.endX,1)} m</span></button>`).join(''):'<p class="muted">No puzzle-owned terrain modifiers intersect this section.</p>';
    const height=terrainSectionHeight(index);
    const linked=state.terrain?.linkSubsequent!==false;
    els.selection.innerHTML=`<h2>Section ${index}</h2><p class="muted">Runtime terrain chunk · master path-height point</p>
      <div class="wl-selection-form">
        <label>Centre<input readonly value="${round(bounds.center,1)} m"></label>
        <label>Range<input readonly value="${round(bounds.min,1)} → ${round(bounds.max,1)} m"></label>
        <label>Path height<input id="wl-section-height" type="number" step="0.1" min="-50" max="80" value="${round(height,2)}"></label>
        <label>Link later sections<select id="wl-section-link"><option value="1"${linked?' selected':''}>On</option><option value="0"${linked?'':' selected'}>Off</option></select></label>
        <label>Base terrain<input readonly value="${escapeAttr(type)}"></label>
        <label>Hidden<input readonly value="${hidden?'Yes':'No'}"></label>
        <label>Collision disabled<input readonly value="${collisionDisabled?'Yes':'No'}"></label>
      </div>
      <h3>Depth layers</h3>
      <p class="muted">Linked strips follow the Path using their normal smoothing plus an authored offset. Switch a strip to Explicit when you want it to stop following the climb and hold its own elevation.</p>
      <div class="wl-layer-controls">${TERRAIN_DETAIL_IDS.map(id=>terrainLayerControlHtml(index,id)).join('')}</div>
      <h3>Active modifiers</h3><div class="wl-mod-list">${modRows}</div>
      <div class="wl-actions"><button class="primary" id="wl-section-height-apply">Apply height</button><button id="wl-section-playhead">Move playhead to centre</button></div>`;
    els.selection.querySelectorAll('[data-mod-id]').forEach(button=>button.addEventListener('click',()=>select('modifier',button.dataset.modId)));
    $('wl-section-height-apply').addEventListener('click',()=>{
      pushHistory('Change terrain height');
      const link=$('wl-section-link').value!=='0';
      state.terrain.linkSubsequent=link;
      if(els.terrainLinkHeight)els.terrainLinkHeight.checked=link;
      const changed=setTerrainSectionHeight(index,number($('wl-section-height').value,height),link);
      if(changed){render();toast(link?'Height changed · later sections shifted.':'Height changed locally.');}else renderSelection();
    });
    $('wl-section-link').addEventListener('change',()=>{state.terrain.linkSubsequent=$('wl-section-link').value!=='0';saveJson(STORAGE.terrain,state.terrain);if(els.terrainLinkHeight)els.terrainLinkHeight.checked=state.terrain.linkSubsequent;});
    els.selection.querySelectorAll('[data-layer-mode]').forEach(selectEl=>selectEl.addEventListener('change',()=>{
      const layerId=selectEl.dataset.layerMode;pushHistory(`Change ${TERRAIN_LAYERS[layerId]?.label||layerId} mode`);setTerrainLayerMode(index,layerId,selectEl.value);render();toast(`${TERRAIN_LAYERS[layerId]?.label||layerId} → ${selectEl.value==='explicit'?'Explicit':'Linked'}.`);
    }));
    els.selection.querySelectorAll('[data-layer-value]').forEach(input=>{
      input.addEventListener('input',()=>{
        const layerId=input.dataset.layerValue;const live=els.selection.querySelector(`[data-layer-live="${layerId}"]`);const value=number(input.value,0);
        if(live)live.textContent=`${value>=0?'+':''}${round(value,2)} m`;
      });
      input.addEventListener('change',()=>{
        const layerId=input.dataset.layerValue;const info=terrainLayerModeInfo(index,layerId);pushHistory(`Change ${TERRAIN_LAYERS[layerId]?.label||layerId}`);
        if(info.mode==='explicit')setTerrainLayerExplicitHeight(index,layerId,number(input.value,terrainLayerSectionHeight(index,layerId)));
        else setTerrainLayerOffset(index,layerId,number(input.value,terrainLayerOffsetAt(index,layerId)));
        render();toast(`${TERRAIN_LAYERS[layerId]?.label||layerId} updated.`);
      });
    });
    $('wl-section-playhead').addEventListener('click',()=>{state.playheadX=bounds.center;select('playhead','player');});
  }

  function renderModifierSelection(mod){
    const raw=mod.raw||{};
    const first=sectionIndexAt(mod.startX+0.0001);
    const last=sectionIndexAt(mod.endX-0.0001);
    const affected=first===last?`S${first}`:`S${first} → S${last}`;
    const detail=[];
    if(Number.isFinite(Number(raw.bedDepth)))detail.push(`<span class="wl-pill">Bed depth ${round(raw.bedDepth,2)} m</span>`);
    if(Number.isFinite(Number(raw.waterAboveBed)))detail.push(`<span class="wl-pill">Water above bed ${round(raw.waterAboveBed,2)} m</span>`);
    if(Number.isFinite(Number(raw.bankMargin)))detail.push(`<span class="wl-pill">Bank margin ${round(raw.bankMargin,2)} m</span>`);
    if(raw.collisionGap!==undefined)detail.push(`<span class="wl-pill">Collision gap ${raw.collisionGap?'Yes':'No'}</span>`);
    if(raw.bankDressing?.enabled)detail.push(`<span class="wl-pill">Bank dressing ${escapeHtml(raw.bankDressing.style||'enabled')}</span>`);
    els.selection.innerHTML=`<h2>${escapeHtml(mod.type.toUpperCase())} Modifier</h2><p class="muted">Owned by ${escapeHtml(mod.puzzleLabel)}</p>
      <div class="wl-selection-form">
        <label>World centre<input readonly value="${round(mod.centre,3)} m"></label>
        <label>Relative centre<input readonly value="${round(mod.relativeCenter,3)} m"></label>
        <label>World range<input readonly value="${round(mod.startX,2)} → ${round(mod.endX,2)} m"></label>
        <label>Width<input readonly value="${round(mod.width,2)} m"></label>
        <label>Affected sections<input readonly value="${affected}"></label>
        <label>Owner role<input readonly value="${escapeAttr(mod.ownerRole||'—')}"></label>
      </div>
      <div>${detail.join('')||'<span class="muted">No additional modifier properties.</span>'}</div>
      <div class="wl-actions"><button class="primary" id="wl-mod-owner">Select owner puzzle</button><button id="wl-mod-playhead">Move playhead here</button></div>`;
    $('wl-mod-owner').addEventListener('click',()=>select('puzzle',mod.puzzleId));
    $('wl-mod-playhead').addEventListener('click',()=>{state.playheadX=mod.centre;select('playhead','player');});
  }

  function renderPlayheadSelection(){
    els.selection.innerHTML=`<h2>Playhead</h2><p class="muted">Temporary test-start position for player mode.</p>
      <div class="wl-selection-form"><label>World X<input id="wl-playhead-x" type="number" step="0.1" value="${round(state.playheadX,2)}"></label></div>
      <div class="wl-actions"><button class="primary" id="wl-playhead-go">Play From Here</button><button id="wl-playhead-set">Set position</button></div>`;
    $('wl-playhead-set').addEventListener('click',()=>{state.playheadX=number($('wl-playhead-x').value,state.playheadX);render();toast('Playhead moved.');});
    $('wl-playhead-go').addEventListener('click',()=>{state.playheadX=number($('wl-playhead-x').value,state.playheadX);playFromHere();});
  }

  function renderElementSelection(item){
    const range=RANGE_TYPES.has(item.type);
    els.selection.innerHTML=`<h2>${escapeHtml(item.label||TYPE_LABEL[item.type]||item.type)}</h2><p class="muted">${escapeHtml(TYPE_LABEL[item.type]||item.type)} · ${escapeHtml(item.id)}</p>
      <div class="wl-selection-form"><label>Label<input id="wl-el-label" value="${escapeAttr(item.label||'')}"></label><label>Type<select id="wl-el-type">${Object.entries(TYPE_LABEL).map(([v,l])=>`<option value="${v}"${v===item.type?' selected':''}>${escapeHtml(l)}</option>`).join('')}</select></label><label>Start / X<input id="wl-el-start" type="number" step="${range?RANGE_SNAP:0.1}" value="${round(item.startX,3)}"></label><label>End / X<input id="wl-el-end" type="number" step="${range?RANGE_SNAP:0.1}" value="${round(item.endX,3)}"${range?'':' disabled'}></label><label>Owner<input id="wl-el-owner" value="${escapeAttr(item.owner||'world')}"></label><label class="wide">Notes<textarea id="wl-el-notes">${escapeHtml(item.notes||'')}</textarea></label></div>
      <div class="wl-actions"><button class="primary" id="wl-save-element">Save</button><button id="wl-jump-element">Jump to Game</button><button id="wl-element-playhead">Move playhead here</button><button class="danger" id="wl-delete-element">Delete</button></div>`;
    $('wl-save-element').addEventListener('click',()=>{
      pushHistory('Edit world element');
      item.label=$('wl-el-label').value.trim()||TYPE_LABEL[item.type]||item.type;
      item.type=$('wl-el-type').value;
      if(RANGE_TYPES.has(item.type)){
        item.startX=snapTo(number($('wl-el-start').value,item.startX),RANGE_SNAP);
        item.endX=Math.max(item.startX+RANGE_SNAP,snapTo(number($('wl-el-end').value,item.endX),RANGE_SNAP));
      }else{
        item.startX=number($('wl-el-start').value,item.startX);
        item.endX=item.startX;
      }
      item.owner=$('wl-el-owner').value.trim()||'world';
      item.notes=$('wl-el-notes').value;
      saveElements();render();toast('World Element saved.');
    });
    $('wl-jump-element').addEventListener('click',()=>{location.href=`play.html?worldX=${encodeURIComponent(item.startX)}&from=world-lab`;});
    $('wl-element-playhead').addEventListener('click',()=>{state.playheadX=item.startX;select('playhead','player');});
    $('wl-delete-element').addEventListener('click',()=>{
      if(!confirm(`Delete ${item.label||TYPE_LABEL[item.type]||item.type}?`))return;
      pushHistory('Delete world element');
      state.elements=state.elements.filter(e=>e.id!==item.id);
      state.selected=null;
      saveElements();render();
    });
  }

  function queuePuzzleMove(id,x){
    if(!Number.isFinite(Number(x)))return;
    state.pending[id]={x:Number(x),queuedAt:Date.now()};
    saveJson(STORAGE.pending,state.pending);
    const p=findPuzzle(id);
    if(p){p.x=Number(x);p.minX=p.x+p.minLocal;p.maxX=p.x+p.maxLocal;p.pending=true;}
    render();
  }

  function addElement(){
    pushHistory('Add world element');
    const type=els.newType.value;
    const label=els.newLabel.value.trim()||TYPE_LABEL[type]||type;
    const range=RANGE_TYPES.has(type);
    const rawStart=number(els.newStart.value,0);
    const start=range?snapTo(rawStart,RANGE_SNAP):rawStart;
    const end=range?Math.max(start+RANGE_SNAP,snapTo(number(els.newEnd.value,start+10),RANGE_SNAP)):start;
    const item={id:uniqueId('world'),type,label,startX:start,endX:end,owner:els.newOwner.value.trim()||'world',notes:'',createdAt:Date.now()};
    state.elements.push(item);
    saveElements();
    state.selected={kind:'element',id:item.id};
    render();toast('World Element added.');
  }

  function loadElements(){
    const raw=loadJson(STORAGE.elements,null);
    const list=Array.isArray(raw)?raw:(Array.isArray(raw?.elements)?raw.elements:[]);
    return list.filter(e=>e&&e.id&&e.type).map(e=>({...e,startX:number(e.startX,0),endX:number(e.endX,e.startX)}));
  }

  function saveElements(){
    saveJson(STORAGE.elements,{version:1,updatedAt:Date.now(),elements:state.elements});
    const assetCount=sceneDressingEntries().length;
    els.status.textContent=`${state.puzzles.length} puzzles · ${state.elements.length} World Elements${assetCount?` · ${assetCount} placed world asset${assetCount===1?'':'s'}`:''}`;
    syncUndoUi();
  }

  function exportStore(key,fallback=null){
    return loadJson(key,fallback);
  }

  function completeGameDesignExportPayload(){
    refreshGameData();
    const bakedWorld=clone(baked?.world||{});
    const placedWorldAssets=sceneDressingEntries().map(item=>clone(item.raw));
    const puzzleMarkers=state.puzzles.map(item=>({
      id:item.id,group:item.group,label:item.label,x:item.x,actualX:item.actualX,local:!!item.local,
      minX:item.minX,maxX:item.maxX,pending:!!item.pending
    }));
    return {
      format:'SideScrollGameDesign',
      formatVersion:2,
      appVersion:'1.0.82',
      exportedAt:new Date().toISOString(),
      purpose:'Complete SideScroll authoring handoff and restore snapshot. Exported from World Lab.',
      world:{
        ...bakedWorld,
        elements:clone(state.elements),
        terrain:clone(state.terrain),
        pendingPuzzleMoves:clone(state.pending),
        playerPosition:exportStore(STORAGE.player,null)
      },
      scene:{
        edits:clone(state.scene),
        placedWorldAssets
      },
      puzzles:{
        markers:puzzleMarkers,
        localLibrary:clone(state.userLibrary),
        runtimeState:clone(state.puzzleState),
        savedStarts:clone(state.puzzleStarts),
        workshop:exportStore(STORAGE.puzzleWorkshop,{}),
        exclusions:exportStore(STORAGE.puzzleExclusions,{})
      },
      assets:{
        behaviourOverrides:exportStore(STORAGE.assetBehaviours,{}),
        collisionDefaults:exportStore(STORAGE.assetCollisions,{}),
        climbPaths:exportStore(STORAGE.assetClimbPaths,{}),
        mechanisms:exportStore(STORAGE.assetMechanisms,{}),
        sockets:exportStore(STORAGE.assetSockets,{}),
        states:exportStore(STORAGE.assetStates,{}),
        layout:exportStore(STORAGE.assetLayout,{})
      },
      collectables:{
        setup:exportStore(STORAGE.collectables,{}),
        inventory:exportStore(STORAGE.inventory,{})
      },
      camera:{
        tune:exportStore(STORAGE.cameraTune,null),
        follow:exportStore(STORAGE.cameraFollow,null)
      },
      render:{
        fog:exportStore(STORAGE.renderFog,null),
        post:exportStore(STORAGE.renderPost,null)
      },
      audio:exportStore(STORAGE.audio,null),
      labs:{
        concept:exportStore(STORAGE.conceptLab,null),
        design:exportStore(STORAGE.designLab,null),
        animationClips:exportStore(STORAGE.animClips,null),
        animationWalk:exportStore(STORAGE.animWalk,null)
      },
      player:{
        position:exportStore(STORAGE.player,null),
        hints:localStorage.getItem(STORAGE.playerHints)
      }
    };
  }

  async function exportCompleteGameDesign(){
    const payload=completeGameDesignExportPayload();
    const text=JSON.stringify(payload,null,2);
    const filename='SideScroll-Complete-Game-Design.json';
    const blob=new Blob([text],{type:'application/json'});
    try{
      const file=new File([blob],filename,{type:'application/json'});
      if(navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file]});
        toast('Complete game exported.');
        return;
      }
    }catch(err){
      if(err?.name==='AbortError')return;
    }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('Complete game exported.');
  }

  function writeImportedStore(key,value){
    if(value===undefined)return;
    try{
      if(value===null)localStorage.removeItem(key);
      else localStorage.setItem(key,JSON.stringify(value));
    }catch(_){}
  }

  async function importCompleteGameDesign(event){
    const file=event.target.files?.[0];
    if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(parsed?.format==='SideScrollWorldElements'){
        const list=Array.isArray(parsed.elements)?parsed.elements:[];
        if(!confirm('This is an older World Elements-only export. Import its World Elements into the current project?'))return;
        writeImportedStore(STORAGE.elements,{version:1,updatedAt:Date.now(),elements:list});
      }else if(parsed?.format==='SideScrollGameDesign'){
        if(!confirm('Import this complete SideScroll game snapshot? Current local authored data will be replaced where the export contains data.'))return;
        const worldElements=Array.isArray(parsed?.world?.elements)?parsed.world.elements:null;
        if(worldElements)writeImportedStore(STORAGE.elements,{version:1,updatedAt:Date.now(),elements:worldElements});
        if(parsed?.world?.terrain!==undefined)writeImportedStore(STORAGE.terrain,parsed.world.terrain);
        if(parsed?.world?.pendingPuzzleMoves!==undefined)writeImportedStore(STORAGE.pending,parsed.world.pendingPuzzleMoves);
        if(parsed?.scene?.edits!==undefined)writeImportedStore(STORAGE.scene,parsed.scene.edits);
        if(parsed?.puzzles?.localLibrary!==undefined)writeImportedStore(STORAGE.puzzleLibrary,parsed.puzzles.localLibrary);
        if(parsed?.puzzles?.runtimeState!==undefined)writeImportedStore(STORAGE.puzzleState,parsed.puzzles.runtimeState);
        if(parsed?.puzzles?.savedStarts!==undefined)writeImportedStore(STORAGE.puzzleStarts,parsed.puzzles.savedStarts);
        if(parsed?.puzzles?.workshop!==undefined)writeImportedStore(STORAGE.puzzleWorkshop,parsed.puzzles.workshop);
        if(parsed?.puzzles?.exclusions!==undefined)writeImportedStore(STORAGE.puzzleExclusions,parsed.puzzles.exclusions);
        if(parsed?.assets?.behaviourOverrides!==undefined)writeImportedStore(STORAGE.assetBehaviours,parsed.assets.behaviourOverrides);
        if(parsed?.assets?.collisionDefaults!==undefined)writeImportedStore(STORAGE.assetCollisions,parsed.assets.collisionDefaults);
        if(parsed?.assets?.climbPaths!==undefined)writeImportedStore(STORAGE.assetClimbPaths,parsed.assets.climbPaths);
        if(parsed?.assets?.mechanisms!==undefined)writeImportedStore(STORAGE.assetMechanisms,parsed.assets.mechanisms);
        if(parsed?.assets?.sockets!==undefined)writeImportedStore(STORAGE.assetSockets,parsed.assets.sockets);
        if(parsed?.assets?.states!==undefined)writeImportedStore(STORAGE.assetStates,parsed.assets.states);
        if(parsed?.assets?.layout!==undefined)writeImportedStore(STORAGE.assetLayout,parsed.assets.layout);
        if(parsed?.collectables?.setup!==undefined)writeImportedStore(STORAGE.collectables,parsed.collectables.setup);
        if(parsed?.collectables?.inventory!==undefined)writeImportedStore(STORAGE.inventory,parsed.collectables.inventory);
        // v1 exports stored the camera tune directly in `camera`; v2 stores tune/follow.
        if(parsed?.camera?.tune!==undefined)writeImportedStore(STORAGE.cameraTune,parsed.camera.tune);
        else if(parsed?.camera && ('y' in parsed.camera || 'z' in parsed.camera || 'tilt' in parsed.camera))writeImportedStore(STORAGE.cameraTune,parsed.camera);
        if(parsed?.camera?.follow!==undefined)writeImportedStore(STORAGE.cameraFollow,parsed.camera.follow);
        if(parsed?.render?.fog!==undefined)writeImportedStore(STORAGE.renderFog,parsed.render.fog);
        if(parsed?.render?.post!==undefined)writeImportedStore(STORAGE.renderPost,parsed.render.post);
        if(parsed?.audio!==undefined)writeImportedStore(STORAGE.audio,parsed.audio);
        if(parsed?.labs?.concept!==undefined)writeImportedStore(STORAGE.conceptLab,parsed.labs.concept);
        if(parsed?.labs?.design!==undefined)writeImportedStore(STORAGE.designLab,parsed.labs.design);
        if(parsed?.labs?.animationClips!==undefined)writeImportedStore(STORAGE.animClips,parsed.labs.animationClips);
        if(parsed?.labs?.animationWalk!==undefined)writeImportedStore(STORAGE.animWalk,parsed.labs.animationWalk);
        if(parsed?.player?.position!==undefined)writeImportedStore(STORAGE.player,parsed.player.position);
        else if(parsed?.world?.playerPosition!==undefined)writeImportedStore(STORAGE.player,parsed.world.playerPosition);
        if(parsed?.player?.hints!==undefined && parsed.player.hints!==null)localStorage.setItem(STORAGE.playerHints,String(parsed.player.hints));
      }else{
        throw new Error('Unsupported export format');
      }
      state.elements=loadElements();
      refreshGameData();
      fitWorld(false);
      render();
      toast('Game data imported.');
    }catch(err){
      console.error(err);
      toast('Import failed.');
    }
    event.target.value='';
  }

  function renderSceneDressingSelection(item){
    const category=item.raw?.category||'dressing';
    const gameplay=item.raw?.gameplayType||'none';
    els.selection.innerHTML=`<h2>${escapeHtml(item.label)}</h2><p class="muted">World-owned placed asset · ${escapeHtml(item.id)}</p>
      <div class="wl-selection-form"><label>World X<input readonly value="${round(item.x,3)} m"></label><label>Depth Z<input readonly value="${round(item.z,3)}"></label><label>Width<input readonly value="${round(item.sx,2)} m"></label><label>Height<input readonly value="${round(item.sy,2)} m"></label><label>Category<input readonly value="${escapeAttr(category)}"></label><label>Gameplay<input readonly value="${escapeAttr(gameplay)}"></label></div>
      <p class="muted">World ownership is determined separately from gameplay behaviour, so interactive environment assets such as climbable rocks appear here too. Transform it in the in-game editor.</p>
      <div class="wl-actions"><button class="primary" id="wl-scene-dressing-jump">Jump to Game</button><button id="wl-scene-dressing-playhead">Move playhead here</button></div>`;
    $('wl-scene-dressing-jump').addEventListener('click',()=>{location.href=`play.html?worldX=${encodeURIComponent(item.x)}&from=world-lab`;});
    $('wl-scene-dressing-playhead').addEventListener('click',()=>{state.playheadX=item.x;select('playhead','player');});
  }

  function historySnapshot(label='World Lab change'){
    return {label,elements:clone(state.elements),pending:clone(state.pending),terrain:clone(state.terrain),playheadX:state.playheadX,selected:clone(state.selected)};
  }
  function pushHistory(label){
    state.history.push(historySnapshot(label));
    if(state.history.length>30)state.history.shift();
    syncUndoUi();
  }
  function syncUndoUi(){
    if(!els.undo)return;
    const last=state.history[state.history.length-1];
    els.undo.disabled=!last;
    els.undo.textContent=last?`Undo`:'Undo';
    els.undo.title=last?`Undo: ${last.label}`:'Nothing to undo';
  }
  function undoLast(){
    const snap=state.history.pop();
    if(!snap)return;
    state.elements=clone(snap.elements)||[];
    state.pending=clone(snap.pending)||{};
    state.terrain=normaliseTerrainState(snap.terrain||{});
    state.playheadX=number(snap.playheadX,state.playheadX);
    state.selected=clone(snap.selected);
    saveElements();
    saveJson(STORAGE.pending,state.pending);
    saveJson(STORAGE.terrain,state.terrain);
    refreshGameData();
    render();
    toast(`Undid ${snap.label}.`);
  }

  function bindPinchZoom(){
    const host=els.scroll;
    if(!host)return;
    let pinch=null;
    const touchDistance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
    const midpointX=touches=>(touches[0].clientX+touches[1].clientX)*.5;
    host.addEventListener('touchstart',event=>{
      if(event.touches.length!==2)return;
      const rect=host.getBoundingClientRect();
      const mid=midpointX(event.touches)-rect.left;
      pinch={distance:Math.max(1,touchDistance(event.touches)),scale:state.scale,worldX:pxToX(host.scrollLeft+mid),mid};
    },{passive:true});
    host.addEventListener('touchmove',event=>{
      if(!pinch||event.touches.length!==2)return;
      event.preventDefault();
      const ratio=touchDistance(event.touches)/pinch.distance;
      const min=number(els.zoom.min,5),max=number(els.zoom.max,20);
      state.scale=Math.max(min,Math.min(max,pinch.scale*ratio));
      render();
      const rect=host.getBoundingClientRect();
      const mid=midpointX(event.touches)-rect.left;
      host.scrollLeft=Math.max(0,xToPx(pinch.worldX)-mid);
    },{passive:false});
    const end=event=>{if(event.touches.length<2)pinch=null;};
    host.addEventListener('touchend',end,{passive:true});
    host.addEventListener('touchcancel',()=>{pinch=null;},{passive:true});
  }

  function findPuzzle(id){return state.puzzles.find(p=>p.id===id)||null;}
  function findElement(id){return state.elements.find(e=>e.id===id)||null;}
  function findModifier(id){return modifierEntries().find(mod=>mod.id===id)||null;}
  function loadJson(key,fallback){try{const raw=localStorage.getItem(key);return raw==null?clone(fallback):(JSON.parse(raw)||clone(fallback));}catch(_){return clone(fallback);}}
  function saveJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function number(v,f=0){const n=Number(v);return Number.isFinite(n)?n:Number(f)||0;}
  function round(v,p=2){const m=10**p;return Math.round(number(v)*m)/m;}
  function snapTo(v,step=1){const s=Math.max(0.0001,number(step,1));return round(Math.round(number(v)/s)*s,6);}
  function uniqueId(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random()*65535).toString(36)}`;}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function escapeAttr(v){return escapeHtml(v);}

  let toastTimer=0;
  function toast(msg){
    els.toast.textContent=msg;els.toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.hidden=true,1800);
  }
  // Initialise only after all module constants (including terrain layer definitions)
  // have been created. Calling init earlier can hit the JavaScript temporal-dead-zone
  // when the first render asks for terrain profile data.
  init();
})();
