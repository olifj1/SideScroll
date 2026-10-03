(() => {
  'use strict';

  const STORAGE = {
    elements:'sidescroll.world-elements.v1',
    pending:'sidescroll.world-lab.pending-puzzle-moves.v1',
    groupMoves:'sidescroll.world-lab.pending-world-group-moves.v1',
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
    animWalk:'gamehub.walklab.anim.v4',
    biomes:'sidescroll.biomes.v1'
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
    'biome-region':'legacy',
    'biome-transition':'legacy',
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


  // v1.0.90: continuous biome system.  Environmental assets have exactly one
  // biome owner or are Global / Unbound.  Only two biome datasets may be active
  // at a time; transition weights are complementary and always sum to 100%.
  const BIOME_DEFS = {
    woodland:{id:'woodland',label:'Woodland',colour:'#799c72'},
    mountain:{id:'mountain',label:'Mountain',colour:'#9a8669'}
  };
  const BIOME_IDS = Object.keys(BIOME_DEFS);
  const GLOBAL_BIOME_OWNER = 'global';
  const BIOME_ASSET_CATALOG = [
    ...['tree01','tree02','tree03','tree04','tree05','tree06','tree07','tree08'].map((name,i)=>({name,label:`Tree ${i+1}`,category:'Large tree',owner:'woodland',density:1.42,max:3})),
    ...['ground01','ground02','ground03','ground04','ground05','ground06','ground07','ground08','ground09','ground10','ground11','ground12'].map((name,i)=>({name,label:`Ground ${i+1}`,category:i===8||i===9?'Rock / ground':'Grass / foliage',owner:'woodland',density:[5.6,4.7,4.5,4.3,3.0,4.5,3.0,2.2,3.4,1.5,4.9,3.9][i],max:[9,8,8,8,5,8,5,4,6,3,8,7][i]})),
    {name:'mountain-climb-rock-01',label:'Climb Rock · Prototype',category:'Climbable feature',owner:'global',density:0,max:0},
    ...['mountain-cliff-01','mountain-cliff-02','mountain-cliff-03','mountain-cliff-04'].map((name,i)=>({name,label:`Cliff ${String(i+1).padStart(2,'0')}`,category:'Climbable feature',owner:'global',density:0,max:0})),
    ...['mountain-rock-01','mountain-rock-02','mountain-rock-03','mountain-rock-04'].map((name,i)=>({name,label:`Mountain Rock ${i+1}`,category:'Rock dressing',owner:'mountain',density:[3.0,2.5,1.8,2.4][i],max:[5,4,3,4][i]})),
    ...['mountain-tree-01','mountain-tree-02'].map((name,i)=>({name,label:`Scrub Tree ${i+1}`,category:'Small tree',owner:'mountain',density:[0.8,0.6][i],max:2})),
    ...['mountain-grass-01','mountain-grass-02','mountain-grass-03'].map((name,i)=>({name,label:`Dry Grass ${i+1}`,category:'Dry grass',owner:'mountain',density:[5.0,3.5,3.0][i],max:[8,6,5][i]}))
  ];
  const BIOME_ASSET_BY_NAME = new Map(BIOME_ASSET_CATALOG.map(item=>[item.name,item]));
  const DEFAULT_BIOME_CURVE = {y1:1/3,y2:2/3};
  const DEFAULT_STREAM_PADDING = {preload:12,unload:12};

  const state = {
    minX:-20,
    maxX:300,
    scale:10,
    selected:null,
    drag:null,
    playheadX:null,
    elements:loadElements(),
    biomes:loadBiomeState(),
    pending:loadJson(STORAGE.pending,{}),
    groupMoves:loadJson(STORAGE.groupMoves,{}),
    userLibrary:null,
    puzzleState:null,
    puzzleStarts:null,
    terrain:null,
    scene:null,
    terrainExpanded:false,
    history:[],
    puzzles:[],
    worldGroups:[]
  };

  const $ = id => document.getElementById(id);
  const els = {
    status:$('wl-status'),
    world:$('wl-world'),
    scroll:$('wl-scroll'),
    sectionGrid:$('wl-section-grid'),
    ruler:$('wl-ruler'),
    trackBiome:$('wl-track-biome'),
    trackSection:$('wl-track-section'),
    trackTerrainNear:$('wl-track-terrain-near'),
    trackTerrainFarA:$('wl-track-terrain-far-a'),
    trackTerrainFarB:$('wl-track-terrain-far-b'),
    terrainToggle:$('wl-terrain-toggle'),
    terrainLinkHeight:$('wl-link-height'),
    trackPuzzle:$('wl-track-puzzle'),
    trackGroups:$('wl-track-groups'),
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
    biomeFrom:$('wl-biome-from'),
    biomeTo:$('wl-biome-to'),
    biomeStart:$('wl-biome-start'),
    biomeEnd:$('wl-biome-end'),
    biomeAdd:$('wl-add-biome-transition'),
    biomeSummary:$('wl-biome-summary'),
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
    els.biomeStart?.addEventListener('input',syncBiomeAddPreview);
    els.biomeTo?.addEventListener('change',syncBiomeAddPreview);
    els.biomeAdd?.addEventListener('click',addBiomeTransition);
    document.querySelectorAll('[data-biome-profile]').forEach(button=>button.addEventListener('click',()=>select('biome-profile',button.dataset.biomeProfile)));
    syncBiomeAddPreview();
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
    state.biomes = loadBiomeState();
    state.userLibrary = normaliseLibrary(loadJson(STORAGE.puzzleLibrary, baked?.puzzles?.localLibrary || {groups:{},templates:{},markers:[]}));
    state.puzzleState = loadJson(STORAGE.puzzleState,{});
    state.puzzleStarts = loadJson(STORAGE.puzzleStarts,baked?.puzzles?.savedStarts || {});
    state.pending = loadJson(STORAGE.pending,{});
    state.groupMoves = loadJson(STORAGE.groupMoves,{});
    state.terrain = normaliseTerrainState(loadJson(STORAGE.terrain,{}));
    state.scene = normaliseSceneState(loadJson(STORAGE.scene,{added:[],overrides:{},worldGroups:[],worldGroupTemplates:[]}));
    state.puzzles = buildPuzzleMarkers();
    state.worldGroups = buildWorldGroupEntries();

    if(!Number.isFinite(state.playheadX)){
      const savedPlayer=loadJson(STORAGE.player,null);
      state.playheadX=Number.isFinite(Number(savedPlayer?.x))?Number(savedPlayer.x):0;
    }

    if(els.terrainLinkHeight)els.terrainLinkHeight.checked=state.terrain.linkSubsequent!==false;
    const pendingCount=Object.keys(state.pending||{}).length;
    const assetCount=sceneDressingEntries().length;
    const groupCount=state.worldGroups.length;
    const groupMoveCount=Object.keys(state.groupMoves||{}).length;
    const transitionCount=state.biomes?.transitions?.length||0;
    els.status.textContent=`${state.puzzles.length} puzzles · ${groupCount} World Group${groupCount===1?'':'s'} · ${transitionCount} biome transition${transitionCount===1?'':'s'} · ${state.elements.filter(e=>TYPE_TRACK[e.type]!=='legacy').length} World Elements${assetCount?` · ${assetCount} standalone world asset${assetCount===1?'':'s'}`:''}${pendingCount||groupMoveCount?` · ${pendingCount+groupMoveCount} queued move${pendingCount+groupMoveCount===1?'':'s'}`:''}`;
    syncBiomeAddPreview();
    syncUndoUi();
  }


  function defaultBiomeState(){
    const assetOwners={};
    const profiles={};
    for(const id of BIOME_IDS)profiles[id]={id,label:BIOME_DEFS[id].label,assets:{}};
    for(const asset of BIOME_ASSET_CATALOG){
      assetOwners[asset.name]=asset.owner;
      if(BIOME_DEFS[asset.owner])profiles[asset.owner].assets[asset.name]={density:Number(asset.density)||0,max:Math.max(0,Math.round(Number(asset.max)||0))};
    }
    return {
      version:1,
      defaultBiome:'woodland',
      maxActiveBiomes:2,
      stream:{...DEFAULT_STREAM_PADDING},
      transitions:[],
      assetOwners,
      profiles
    };
  }

  function normaliseBiomeState(raw){
    const defaults=defaultBiomeState();
    const src=raw&&typeof raw==='object'?clone(raw):{};
    const out={
      version:1,
      defaultBiome:BIOME_DEFS[src.defaultBiome]?src.defaultBiome:defaults.defaultBiome,
      maxActiveBiomes:2,
      stream:{
        preload:RigClamp(number(src?.stream?.preload,defaults.stream.preload),0,80),
        unload:RigClamp(number(src?.stream?.unload,defaults.stream.unload),0,80)
      },
      transitions:[],
      assetOwners:{...defaults.assetOwners,...(src.assetOwners&&typeof src.assetOwners==='object'?src.assetOwners:{})},
      profiles:clone(defaults.profiles)
    };
    for(const asset of BIOME_ASSET_CATALOG){
      const owner=out.assetOwners[asset.name];
      if(owner!==GLOBAL_BIOME_OWNER&&!BIOME_DEFS[owner])out.assetOwners[asset.name]=asset.owner;
    }
    for(const id of BIOME_IDS){
      const saved=src?.profiles?.[id];
      if(saved?.assets&&typeof saved.assets==='object'){
        for(const [name,entry] of Object.entries(saved.assets)){
          if(!BIOME_ASSET_BY_NAME.has(name))continue;
          out.profiles[id].assets[name]={
            density:RigClamp(number(entry?.density,out.profiles[id].assets[name]?.density||0),0,100),
            max:Math.max(0,Math.round(number(entry?.max,out.profiles[id].assets[name]?.max||0)))
          };
        }
      }
    }
    // Ownership is authoritative.  Keep density settings only on the owning biome.
    for(const id of BIOME_IDS){
      for(const name of Object.keys(out.profiles[id].assets))if(out.assetOwners[name]!==id)delete out.profiles[id].assets[name];
    }
    for(const asset of BIOME_ASSET_CATALOG){
      const owner=out.assetOwners[asset.name];
      if(BIOME_DEFS[owner]&&!out.profiles[owner].assets[asset.name]){
        out.profiles[owner].assets[asset.name]={density:Number(asset.density)||0,max:Math.max(0,Math.round(Number(asset.max)||0))};
      }
    }
    const rawTransitions=Array.isArray(src.transitions)?src.transitions:[];
    const transitions=rawTransitions.map((item,index)=>{
      const start=snapTo(number(item?.startX,100+index*80),RANGE_SNAP);
      const end=Math.max(start+RANGE_SNAP,snapTo(number(item?.endX,start+30),RANGE_SNAP));
      const to=BIOME_DEFS[item?.to]?item.to:'mountain';
      return {
        id:String(item?.id||uniqueId('biome')),
        from:BIOME_DEFS[item?.from]?item.from:out.defaultBiome,
        to,
        startX:start,
        endX:end,
        curve:{
          y1:RigClamp(number(item?.curve?.y1,DEFAULT_BIOME_CURVE.y1),0,1),
          y2:RigClamp(number(item?.curve?.y2,DEFAULT_BIOME_CURVE.y2),0,1)
        }
      };
    }).sort((a,b)=>a.startX-b.startX);
    let current=out.defaultBiome;
    let previousEnd=-Infinity;
    for(const item of transitions){
      if(item.startX<previousEnd+RANGE_SNAP)item.startX=previousEnd+RANGE_SNAP;
      if(item.endX<item.startX+RANGE_SNAP)item.endX=item.startX+Math.max(20,RANGE_SNAP);
      item.from=current;
      if(item.to===current)item.to=BIOME_IDS.find(id=>id!==current)||current;
      current=item.to;
      previousEnd=item.endX;
      out.transitions.push(item);
    }
    return out;
  }

  function loadBiomeState(){return normaliseBiomeState(loadJson(STORAGE.biomes,null));}
  function saveBiomeState(){
    state.biomes=normaliseBiomeState(state.biomes);
    saveJson(STORAGE.biomes,state.biomes);
    const assetCount=sceneDressingEntries().length,transitionCount=state.biomes?.transitions?.length||0;
    if(els.status)els.status.textContent=`${state.puzzles.length} puzzles · ${transitionCount} biome transition${transitionCount===1?'':'s'} · ${state.elements.filter(e=>TYPE_TRACK[e.type]!=='legacy').length} World Elements${assetCount?` · ${assetCount} placed world asset${assetCount===1?'':'s'}`:''}`;
    syncBiomeAddPreview();
    syncUndoUi();
  }

  function biomeLabel(id){return id===GLOBAL_BIOME_OWNER?'Global / Unbound':(BIOME_DEFS[id]?.label||id||'Biome');}
  function biomeColour(id){return BIOME_DEFS[id]?.colour||'#7d8b91';}
  function transitionProgress(item,x){
    if(x<=item.startX)return 0;if(x>=item.endX)return 1;
    const t=RigClamp((x-item.startX)/Math.max(.001,item.endX-item.startX),0,1);
    const u=1-t;
    // Cubic Bezier with fixed time handles at 1/3 and 2/3.  y1/y2 are the
    // editable transfer percentages; 1/3 + 2/3 produces a straight blend.
    return RigClamp(3*u*u*t*item.curve.y1+3*u*t*t*item.curve.y2+t*t*t,0,1);
  }
  function biomeTransitionAt(x){return (state.biomes?.transitions||[]).find(item=>x>=item.startX&&x<=item.endX)||null;}
  function biomeWeightsAt(x){
    let current=state.biomes?.defaultBiome||'woodland';
    for(const item of state.biomes?.transitions||[]){
      if(x<item.startX)return {[current]:1};
      if(x<=item.endX){const t=transitionProgress(item,x);return {[item.from]:1-t,[item.to]:t};}
      current=item.to;
    }
    return {[current]:1};
  }
  function dominantBiomeAt(x){
    const weights=biomeWeightsAt(x);let best=state.biomes?.defaultBiome||'woodland',value=-1;
    for(const [id,w] of Object.entries(weights))if(w>value){best=id;value=w;}
    return best;
  }
  function dominantBiomeBefore(x){
    const trans=biomeTransitionAt(x);
    if(trans)return trans.from;
    return dominantBiomeAt(x-0.001);
  }
  function streamWindowForTransition(index){
    const list=state.biomes?.transitions||[];const item=list[index];if(!item)return null;
    const prev=list[index-1]||null,next=list[index+1]||null;
    const gapBefore=prev?Math.max(0,item.startX-prev.endX):Infinity;
    const gapAfter=next?Math.max(0,next.startX-item.endX):Infinity;
    const splitBefore=prev?prev.endX+gapBefore*.5:-Infinity;
    const splitAfter=next?item.endX+gapAfter*.5:Infinity;
    return {
      loadX:Math.max(item.startX-number(state.biomes?.stream?.preload,12),splitBefore),
      unloadX:Math.min(item.endX+number(state.biomes?.stream?.unload,12),splitAfter)
    };
  }
  function loadedBiomesAt(x){
    const list=state.biomes?.transitions||[];
    for(let i=0;i<list.length;i++){
      const item=list[i];
      if(x>=item.startX&&x<=item.endX)return [item.from,item.to];
    }
    const current=dominantBiomeAt(x);
    for(let i=0;i<list.length;i++){
      const item=list[i],win=streamWindowForTransition(i);
      if(x>=win.loadX&&x<item.startX&&current===item.from)return [item.from,item.to];
      if(x>item.endX&&x<=win.unloadX&&current===item.to)return [item.from,item.to];
    }
    return [current];
  }
  function biomeOwnerForAsset(name){return state.biomes?.assetOwners?.[name]||BIOME_ASSET_BY_NAME.get(name)?.owner||GLOBAL_BIOME_OWNER;}
  function profileEntry(id,name){
    const profile=state.biomes?.profiles?.[id];
    if(!profile)return null;
    profile.assets||={};
    if(!profile.assets[name]){
      const def=BIOME_ASSET_BY_NAME.get(name);
      profile.assets[name]={density:Number(def?.density)||0,max:Math.max(0,Math.round(Number(def?.max)||0))};
    }
    return profile.assets[name];
  }

  function syncBiomeAddPreview(){
    if(!els.biomeStart)return;
    const x=number(els.biomeStart.value,100);
    const inside=biomeTransitionAt(x);
    const from=inside?inside.from:dominantBiomeBefore(x);
    if(els.biomeFrom)els.biomeFrom.value=inside?'Inside an existing transition':biomeLabel(from);
    if(els.biomeTo){
      for(const option of els.biomeTo.options)option.disabled=option.value===from;
      if(els.biomeTo.value===from)els.biomeTo.value=BIOME_IDS.find(id=>id!==from)||from;
    }
    if(els.biomeSummary){
      const loaded=loadedBiomesAt(x).map(biomeLabel).join(' + ');
      els.biomeSummary.textContent=inside
        ? `That start point is already inside ${biomeLabel(inside.from)} → ${biomeLabel(inside.to)}. Move it outside the existing transition.`
        : `${biomeLabel(from)} is 100% at ${round(x,1)} m · logically loaded: ${loaded}.`;
    }
  }

  function addBiomeTransition(){
    const start=snapTo(number(els.biomeStart?.value,100),RANGE_SNAP);
    const end=Math.max(start+RANGE_SNAP,snapTo(number(els.biomeEnd?.value,start+30),RANGE_SNAP));
    if(biomeTransitionAt(start)||biomeTransitionAt(end-0.001)||(state.biomes.transitions||[]).some(t=>start<t.endX&&end>t.startX)){
      toast('Biome transitions cannot overlap.');return;
    }
    const from=dominantBiomeBefore(start);
    const to=els.biomeTo?.value;
    if(!BIOME_DEFS[to]||to===from){toast('Choose the other biome as the transition target.');return;}
    pushHistory('Add biome transition');
    const item={id:uniqueId('biome'),from,to,startX:start,endX:end,curve:{...DEFAULT_BIOME_CURVE}};
    state.biomes.transitions.push(item);
    state.biomes=normaliseBiomeState(state.biomes);
    saveBiomeState();
    state.selected={kind:'biome-transition',id:item.id};
    render();toast(`${biomeLabel(from)} → ${biomeLabel(to)} transition added.`);
  }

  function findBiomeTransition(id){return state.biomes?.transitions?.find(item=>item.id===id)||null;}
  function RigClamp(v,min,max){return Math.max(min,Math.min(max,number(v,min)));}

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
    scene.worldGroups=Array.isArray(scene.worldGroups)?scene.worldGroups:[];
    scene.worldGroupTemplates=Array.isArray(scene.worldGroupTemplates)?scene.worldGroupTemplates:[];
    return scene;
  }

  function buildWorldGroupEntries(){
    const scene=state.scene||{added:[],worldGroups:[]},members=scene.added||[];
    return (scene.worldGroups||[]).filter(group=>group?.id).map(group=>{
      const owned=members.filter(item=>item&&!item.deleted&&!item.puzzleInstanceId&&item.worldGroupId===group.id&&Number.isFinite(Number(item.x)));
      let minX=Infinity,maxX=-Infinity;
      for(const item of owned){const half=Math.max(.1,Math.abs(number(item.sx,1)))*.5;minX=Math.min(minX,Number(item.x)-half);maxX=Math.max(maxX,Number(item.x)+half);}
      const actualX=number(group.x,Number.isFinite(minX)?(minX+maxX)*.5:0);
      if(!Number.isFinite(minX)){minX=actualX-.6;maxX=actualX+.6;}
      const queued=state.groupMoves?.[group.id],x=Number.isFinite(Number(queued?.x))?Number(queued.x):actualX,dx=x-actualX;
      const exclusion=group.exclusion&&typeof group.exclusion==='object'?group.exclusion:null;
      return{kind:'world-group',id:String(group.id),label:String(group.label||'World Group'),x,actualX,z:number(group.z,0),minX:minX+dx,maxX:maxX+dx,minLocal:minX-actualX,maxLocal:maxX-actualX,memberCount:owned.length,pending:!!queued,exclusion,templateId:group.templateId||null,raw:group};
    });
  }

  function findWorldGroup(id){return state.worldGroups.find(group=>group.id===id)||null;}

  function sceneDressingEntries(){
    // World ownership is independent of gameplay capability. A climbable rock,
    // ladder or other interactive environment asset still belongs on the World
    // Lab timeline when it is not owned by a puzzle instance.
    return (state.scene?.added||[])
      .filter(item=>item&&!item.deleted&&!item.puzzleInstanceId&&!item.worldGroupId&&Number.isFinite(Number(item.x)))
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
    for(const g of state.worldGroups)values.push(g.minX,g.maxX,g.x);
    for(const e of state.elements)if(TYPE_TRACK[e.type]!=='legacy')values.push(number(e.startX,0),number(e.endX,e.startX));
    for(const t of state.biomes?.transitions||[])values.push(number(t.startX,0),number(t.endX,t.startX));
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
    renderBiomeTrack();
    renderElements();
    renderSections();
    renderPuzzles();
    renderWorldGroups();
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


  function renderBiomeTrack(){
    const host=els.trackBiome;if(!host)return;host.innerHTML='';
    const trackHeight=116,topY=16,bottomY=101,usable=bottomY-topY;
    const yFor=w=>topY+(1-RigClamp(w,0,1))*usable;
    const list=state.biomes?.transitions||[];

    // Continuous solid-biome bands make it explicit that there is no undefined
    // space between authored transitions.
    let cursor=state.minX,current=state.biomes?.defaultBiome||'woodland';
    const addBand=(from,to,id)=>{
      const a=Math.max(state.minX,from),b=Math.min(state.maxX,to);if(!(b>a))return;
      const node=document.createElement('button');node.type='button';node.className='wl-biome-band';
      node.style.left=`${xToPx(a)}px`;node.style.width=`${Math.max(1,(b-a)*state.scale)}px`;
      node.style.background=`${biomeColour(id)}22`;node.innerHTML=`<span>${escapeHtml(biomeLabel(id))} 100%</span>`;
      node.title=`${biomeLabel(id)} · 100% · ${round(a,1)} → ${round(b,1)} m`;
      node.addEventListener('click',event=>{event.stopPropagation();select('biome-profile',id);});host.appendChild(node);
    };
    for(const item of list){
      addBand(cursor,item.startX,current);
      const a=Math.max(state.minX,item.startX),b=Math.min(state.maxX,item.endX);
      if(b>a){
        const band=document.createElement('button');band.type='button';band.className=`wl-biome-transition-band${isSelected('biome-transition',item.id)?' selected':''}`;
        band.style.left=`${xToPx(a)}px`;band.style.width=`${Math.max(2,(b-a)*state.scale)}px`;
        band.style.background=`linear-gradient(90deg,${biomeColour(item.from)}22,${biomeColour(item.to)}22)`;
        band.innerHTML=`<span>${escapeHtml(biomeLabel(item.from))} → ${escapeHtml(biomeLabel(item.to))}</span>`;
        band.title=`${biomeLabel(item.from)} → ${biomeLabel(item.to)} · ${round(item.startX,1)} → ${round(item.endX,1)} m`;
        band.addEventListener('click',event=>{event.stopPropagation();select('biome-transition',item.id);});host.appendChild(band);
        const index=list.indexOf(item),win=streamWindowForTransition(index);
        for(const marker of [{x:win.loadX,label:`LOAD ${biomeLabel(item.to).toUpperCase()}`},{x:win.unloadX,label:`DROP ${biomeLabel(item.from).toUpperCase()}`}]){
          if(marker.x<state.minX||marker.x>state.maxX)continue;
          const line=document.createElement('div');line.className='wl-biome-stream-marker';line.style.left=`${xToPx(marker.x)}px`;line.dataset.label=marker.label;host.appendChild(line);
        }
        const startKey=document.createElement('button');startKey.type='button';startKey.className='wl-biome-key start';startKey.style.left=`${xToPx(item.startX)}px`;startKey.title='Transition start key · drag horizontally';
        const endKey=document.createElement('button');endKey.type='button';endKey.className='wl-biome-key end';endKey.style.left=`${xToPx(item.endX)}px`;endKey.title='Transition end key · drag horizontally';
        bindBiomeKeyDrag(startKey,item,'start');bindBiomeKeyDrag(endKey,item,'end');
        startKey.addEventListener('click',event=>{event.stopPropagation();select('biome-transition',item.id);});
        endKey.addEventListener('click',event=>{event.stopPropagation();select('biome-transition',item.id);});
        host.append(startKey,endKey);
      }
      current=item.to;cursor=item.endX;
    }
    addBand(cursor,state.maxX,current);

    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','wl-biome-svg');svg.setAttribute('viewBox',`0 0 ${worldWidth()} ${trackHeight}`);svg.setAttribute('preserveAspectRatio','none');
    for(const w of [1,.5,0]){
      const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('class','wl-biome-gridline');line.setAttribute('x1','0');line.setAttribute('x2',String(worldWidth()));line.setAttribute('y1',String(yFor(w)));line.setAttribute('y2',String(yFor(w)));svg.appendChild(line);
    }
    const sampleStep=Math.max(.5,Math.min(2,8/state.scale));
    for(const id of BIOME_IDS){
      let d='',first=true;
      for(let x=state.minX;x<=state.maxX+sampleStep*.5;x+=sampleStep){
        const xx=Math.min(state.maxX,x),w=biomeWeightsAt(xx)[id]||0;d+=`${first?'M':'L'} ${xToPx(xx).toFixed(2)} ${yFor(w).toFixed(2)} `;first=false;
      }
      const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('class',`wl-biome-line ${id}`);path.setAttribute('d',d.trim());svg.appendChild(path);
    }
    host.appendChild(svg);
    const top=document.createElement('span');top.className='wl-biome-axis-label top';top.textContent='100%';
    const bottom=document.createElement('span');bottom.className='wl-biome-axis-label bottom';bottom.textContent='0%';host.append(top,bottom);
  }

  function bindBiomeKeyDrag(handle,item,side){
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==undefined&&event.button!==0)return;
      event.preventDefault();event.stopPropagation();handle.setPointerCapture?.(event.pointerId);
      pushHistory(`Move biome ${side} key`);select('biome-transition',item.id,false);
      const startClient=event.clientX,origStart=item.startX,origEnd=item.endX,list=state.biomes.transitions,index=list.indexOf(item),prev=list[index-1]||null,next=list[index+1]||null;
      let moved=false;
      const move=e=>{
        const delta=(e.clientX-startClient)/state.scale;if(Math.abs(e.clientX-startClient)>2)moved=true;
        if(side==='start')item.startX=RigClamp(snapTo(origStart+delta,RANGE_SNAP),prev?prev.endX+RANGE_SNAP:-99999,item.endX-RANGE_SNAP);
        else item.endX=RigClamp(snapTo(origEnd+delta,RANGE_SNAP),item.startX+RANGE_SNAP,next?next.startX-RANGE_SNAP:99999);
        handle.style.left=`${xToPx(side==='start'?item.startX:item.endX)}px`;
      };
      const end=()=>{
        handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);
        if(moved){state.biomes=normaliseBiomeState(state.biomes);saveBiomeState();toast(`Biome key moved to ${round(side==='start'?item.startX:item.endX,1)} m.`);}render();
      };
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    });
  }

  function renderElements(){
    for(const el of [els.trackDressing,els.trackOther])el.innerHTML='';
    for(const item of state.elements){
      const track=TYPE_TRACK[item.type]||'other';
      // Legacy finite biome blocks are preserved in storage/export for safety,
      // but the continuous biome track supersedes them from v1.0.90 onward.
      if(track==='legacy')continue;
      const host=track==='dressing'?els.trackDressing:els.trackOther;
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

  function renderWorldGroups(){
    if(!els.trackGroups)return;els.trackGroups.innerHTML='';
    for(const group of state.worldGroups){
      const node=document.createElement('button');node.type='button';
      node.className=`wl-item world-group range${group.pending?' pending':''}${isSelected('world-group',group.id)?' selected':''}`;
      node.dataset.kind='world-group';node.dataset.id=group.id;
      node.style.left=`${xToPx(group.minX)}px`;node.style.width=`${Math.max(18,(group.maxX-group.minX)*state.scale)}px`;
      node.textContent=group.label;node.title=`World Group · ${group.label} · ${group.memberCount} assets · ${round(group.minX,1)} → ${round(group.maxX,1)} m`;
      bindDraggable(node,{kind:'world-group',id:group.id});
      node.addEventListener('click',event=>{if(state.drag?.moved)return;select('world-group',group.id);event.stopPropagation();});
      els.trackGroups.appendChild(node);
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
      pushHistory(ref.kind==='puzzle'?'Move puzzle':(ref.kind==='world-group'?'Move World Group':'Move world element'));
      event.preventDefault();event.stopPropagation();
      node.setPointerCapture?.(event.pointerId);
      const startClient=event.clientX;
      let startX,startEnd;
      if(ref.kind==='puzzle'){
        const p=findPuzzle(ref.id);startX=p.x;startEnd=null;
      }else if(ref.kind==='world-group'){
        const group=findWorldGroup(ref.id);startX=group.x;startEnd=null;
      }else{
        const item=findElement(ref.id);startX=number(item.startX,0);startEnd=number(item.endX,startX);
      }
      const groupStart=ref.kind==='world-group'?findWorldGroup(ref.id):null;
      state.drag={...ref,startClient,startX,startEnd,startMin:groupStart?.minX,startMax:groupStart?.maxX,moved:false};
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
        }else if(ref.kind==='world-group'){
          const group=findWorldGroup(ref.id);
          if(group){group.x=round(startX+delta,3);group.minX=round(state.drag.startMin+delta,3);group.maxX=round(state.drag.startMax+delta,3);node.style.left=`${xToPx(group.minX)}px`;renderSelection();}
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
          }else if(ref.kind==='world-group'){
            const group=findWorldGroup(ref.id);queueWorldGroupMove(group.id,group.x);
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
      els.selection.innerHTML='<h2>Selection</h2><p class="muted">Tap a section, terrain modifier, puzzle, World Group or World Element above.</p>';
      return;
    }
    if(state.selected.kind==='biome-transition'){
      const item=findBiomeTransition(state.selected.id);
      if(!item){state.selected=null;return renderSelection();}
      return renderBiomeTransitionSelection(item);
    }
    if(state.selected.kind==='biome-profile')return renderBiomeProfileSelection(state.selected.id);
    if(state.selected.kind==='puzzle'){
      const p=findPuzzle(state.selected.id);
      if(!p){state.selected=null;return renderSelection();}
      return renderPuzzleSelection(p);
    }
    if(state.selected.kind==='world-group'){
      const group=findWorldGroup(state.selected.id);
      if(!group){state.selected=null;return renderSelection();}
      return renderWorldGroupSelection(group);
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


  function curvePreviewSvg(item){
    const y1=RigClamp(item?.curve?.y1,0,1),y2=RigClamp(item?.curve?.y2,0,1);
    const points=[];
    for(let i=0;i<=40;i++){
      const t=i/40,u=1-t,v=3*u*u*t*y1+3*u*t*t*y2+t*t*t;
      points.push([8+t*184,72-v*62]);
    }
    const d=points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const inv=points.map((p,i)=>{const v=(72-p[1])/62;return `${i?'L':'M'}${p[0].toFixed(1)},${(10+v*62).toFixed(1)}`;}).join(' ');
    return `<svg viewBox="0 0 200 82" preserveAspectRatio="none"><line x1="8" y1="72" x2="192" y2="10"></line><line x1="8" y1="41" x2="192" y2="41"></line><path d="${d}"></path><path class="inverse" d="${inv}"></path></svg>`;
  }

  function renderBiomeTransitionSelection(item){
    const index=state.biomes.transitions.indexOf(item),win=streamWindowForTransition(index);
    els.selection.innerHTML=`<h2>${escapeHtml(biomeLabel(item.from))} → ${escapeHtml(biomeLabel(item.to))}</h2>
      <p class="muted">Continuous two-biome transition · percentages are coupled and always total 100%.</p>
      <div class="wl-biome-status-pills"><span class="wl-pill">Load ${escapeHtml(biomeLabel(item.to))} ${round(win.loadX,1)} m</span><span class="wl-pill">Blend ${round(item.startX,1)} → ${round(item.endX,1)} m</span><span class="wl-pill">Drop ${escapeHtml(biomeLabel(item.from))} ${round(win.unloadX,1)} m</span></div>
      <div class="wl-selection-form">
        <label>From<input value="${escapeAttr(biomeLabel(item.from))}" readonly></label>
        <label>To<select id="wl-biome-edit-to">${BIOME_IDS.map(id=>`<option value="${id}"${id===item.to?' selected':''}${id===item.from?' disabled':''}>${escapeHtml(biomeLabel(id))}</option>`).join('')}</select></label>
        <label>Start / X<input id="wl-biome-edit-start" type="number" step="1" value="${round(item.startX,2)}"></label>
        <label>End / X<input id="wl-biome-edit-end" type="number" step="1" value="${round(item.endX,2)}"></label>
        <label class="wide">Start Bezier handle <b id="wl-biome-y1-label">${round(item.curve.y1*100,0)}%</b><input id="wl-biome-y1" type="range" min="0" max="100" step="1" value="${round(item.curve.y1*100,0)}"></label>
        <label class="wide">End Bezier handle <b id="wl-biome-y2-label">${round(item.curve.y2*100,0)}%</b><input id="wl-biome-y2" type="range" min="0" max="100" step="1" value="${round(item.curve.y2*100,0)}"></label>
        <label>Preload incoming before start<input id="wl-biome-preload" type="number" min="0" max="80" step="1" value="${round(state.biomes.stream.preload,1)}"></label>
        <label>Keep outgoing after end<input id="wl-biome-unload" type="number" min="0" max="80" step="1" value="${round(state.biomes.stream.unload,1)}"></label>
      </div>
      <div class="wl-biome-curve-preview" id="wl-biome-curve-preview">${curvePreviewSvg(item)}</div>
      <p class="muted">A straight transfer uses roughly 33% / 67%. Lower the first handle for a slower start; raise the second for a stronger finish. Stream markers are automatically squeezed between neighbouring transitions so a third biome is never active.</p>
      <div class="wl-actions"><button class="primary" id="wl-save-biome-transition">Save Transition</button><button id="wl-biome-playhead">Move playhead to start</button><button class="danger" id="wl-delete-biome-transition">Delete</button></div>`;
    const preview=()=>{
      const y1=number($('wl-biome-y1').value,33)/100,y2=number($('wl-biome-y2').value,67)/100;
      $('wl-biome-y1-label').textContent=`${round(y1*100,0)}%`;$('wl-biome-y2-label').textContent=`${round(y2*100,0)}%`;
      $('wl-biome-curve-preview').innerHTML=curvePreviewSvg({...item,curve:{y1,y2}});
    };
    $('wl-biome-y1').addEventListener('input',preview);$('wl-biome-y2').addEventListener('input',preview);
    $('wl-save-biome-transition').addEventListener('click',()=>{
      pushHistory('Edit biome transition');
      const start=snapTo(number($('wl-biome-edit-start').value,item.startX),RANGE_SNAP),end=snapTo(number($('wl-biome-edit-end').value,item.endX),RANGE_SNAP);
      const list=state.biomes.transitions,index=list.indexOf(item),prev=list[index-1],next=list[index+1];
      if(end<=start||(prev&&start<=prev.endX)||(next&&end>=next.startX)){toast('Transition must stay between its neighbours and have a positive length.');return;}
      item.startX=start;item.endX=end;item.to=$('wl-biome-edit-to').value;
      item.curve={y1:number($('wl-biome-y1').value,33)/100,y2:number($('wl-biome-y2').value,67)/100};
      state.biomes.stream.preload=RigClamp(number($('wl-biome-preload').value,12),0,80);
      state.biomes.stream.unload=RigClamp(number($('wl-biome-unload').value,12),0,80);
      state.biomes=normaliseBiomeState(state.biomes);saveBiomeState();render();toast('Biome transition saved.');
    });
    $('wl-biome-playhead').addEventListener('click',()=>{state.playheadX=item.startX;select('playhead','player');});
    $('wl-delete-biome-transition').addEventListener('click',()=>{
      if(!confirm(`Delete ${biomeLabel(item.from)} → ${biomeLabel(item.to)} transition?`))return;
      pushHistory('Delete biome transition');state.biomes.transitions=state.biomes.transitions.filter(t=>t.id!==item.id);state.biomes=normaliseBiomeState(state.biomes);state.selected=null;saveBiomeState();render();toast('Biome transition deleted.');
    });
  }

  function renderBiomeProfileSelection(id){
    if(id==='global')return renderGlobalBiomeAssetsSelection();
    if(!BIOME_DEFS[id]){state.selected=null;return renderSelection();}
    const owned=BIOME_ASSET_CATALOG.filter(asset=>biomeOwnerForAsset(asset.name)===id);
    const totalDensity=owned.reduce((sum,asset)=>sum+number(profileEntry(id,asset.name)?.density,0),0);
    const assignable=BIOME_ASSET_CATALOG.filter(asset=>biomeOwnerForAsset(asset.name)!==id);
    els.selection.innerHTML=`<h2>${escapeHtml(biomeLabel(id))} Profile</h2>
      <p class="muted">This table defines what 100% ${escapeHtml(biomeLabel(id))} means. Density is the target placements per 10 m; Max is the per-10 m cap. An asset can belong to only one biome, or be Global / Unbound.</p>
      <div class="wl-biome-status-pills"><span class="wl-pill">${owned.length} assigned assets</span><span class="wl-pill">${round(totalDensity,1)} target placements / 10 m</span></div>
      <div class="wl-selection-form"><label class="wide">Assign / move asset<select id="wl-biome-assign"><option value="">Choose an asset…</option>${assignable.map(asset=>`<option value="${escapeAttr(asset.name)}">${escapeHtml(asset.label)} · ${escapeHtml(biomeLabel(biomeOwnerForAsset(asset.name))||'Global')}</option>`).join('')}</select></label></div>
      <div class="wl-actions"><button id="wl-biome-assign-btn">Assign to ${escapeHtml(biomeLabel(id))}</button><button data-profile-open="global">Global / Unbound</button></div>
      <div class="wl-biome-asset-table">${owned.map(asset=>biomeAssetRowHtml(asset,id)).join('')||'<p class="muted">No assets assigned.</p>'}</div>
      <p class="muted">These values are live in the first transition pass. Woodland keeps its existing deterministic layout and thins as its percentage/density falls; Mountain uses a deterministic streamed candidate pool driven by Density and Max. Manual placements are never regenerated.</p>`;
    bindBiomeAssetRows();
    $('wl-biome-assign-btn').addEventListener('click',()=>{
      const name=$('wl-biome-assign').value;if(!name)return;pushHistory('Assign biome asset');assignAssetOwner(name,id);saveBiomeState();renderSelection();renderBiomeTrack();toast(`${BIOME_ASSET_BY_NAME.get(name)?.label||name} → ${biomeLabel(id)}.`);
    });
    els.selection.querySelectorAll('[data-profile-open]').forEach(button=>button.addEventListener('click',()=>select('biome-profile',button.dataset.profileOpen)));
  }

  function biomeAssetRowHtml(asset,owner){
    const entry=BIOME_DEFS[owner]?profileEntry(owner,asset.name):null;
    return `<div class="wl-biome-asset-row" data-biome-asset="${escapeAttr(asset.name)}">
      <div><strong>${escapeHtml(asset.label)}</strong><small>${escapeHtml(asset.category)} · ${escapeHtml(asset.name)}</small></div>
      <label class="owner">Owner<select data-asset-owner>${[...BIOME_IDS,GLOBAL_BIOME_OWNER].map(id=>`<option value="${id}"${id===owner?' selected':''}>${id===GLOBAL_BIOME_OWNER?'Global':biomeLabel(id)}</option>`).join('')}</select></label>
      ${entry?`<label>Density / 10m<input data-asset-density type="number" min="0" max="100" step="0.1" value="${round(entry.density,2)}"></label><label>Max / 10m<input data-asset-max type="number" min="0" max="100" step="1" value="${Math.round(entry.max)}"></label>`:'<span></span><span></span>'}
    </div>`;
  }

  function renderGlobalBiomeAssetsSelection(){
    const owned=BIOME_ASSET_CATALOG.filter(asset=>biomeOwnerForAsset(asset.name)===GLOBAL_BIOME_OWNER);
    const assignable=BIOME_ASSET_CATALOG.filter(asset=>biomeOwnerForAsset(asset.name)!==GLOBAL_BIOME_OWNER);
    els.selection.innerHTML=`<h2>Global / Unbound Environment</h2>
      <p class="muted">These assets are deliberately outside biome density profiles and remain available for manual placement everywhere. Climbable rock features live here by default.</p>
      <div class="wl-biome-status-pills"><span class="wl-pill">${owned.length} global assets</span><span class="wl-pill">No procedural density</span></div>
      <div class="wl-selection-form"><label class="wide">Make asset Global / Unbound<select id="wl-biome-assign"><option value="">Choose an asset…</option>${assignable.map(asset=>`<option value="${escapeAttr(asset.name)}">${escapeHtml(asset.label)} · ${escapeHtml(biomeLabel(biomeOwnerForAsset(asset.name)))}</option>`).join('')}</select></label></div>
      <div class="wl-actions"><button id="wl-biome-assign-btn">Make Global / Unbound</button><button data-profile-open="woodland">Woodland profile</button><button data-profile-open="mountain">Mountain profile</button></div>
      <div class="wl-biome-asset-table">${owned.map(asset=>biomeAssetRowHtml(asset,GLOBAL_BIOME_OWNER)).join('')||'<p class="muted">No global assets.</p>'}</div>`;
    bindBiomeAssetRows();
    $('wl-biome-assign-btn').addEventListener('click',()=>{const name=$('wl-biome-assign').value;if(!name)return;pushHistory('Make environment asset global');assignAssetOwner(name,GLOBAL_BIOME_OWNER);saveBiomeState();renderSelection();toast(`${BIOME_ASSET_BY_NAME.get(name)?.label||name} is Global / Unbound.`);});
    els.selection.querySelectorAll('[data-profile-open]').forEach(button=>button.addEventListener('click',()=>select('biome-profile',button.dataset.profileOpen)));
  }

  function assignAssetOwner(name,owner){
    if(!BIOME_ASSET_BY_NAME.has(name))return;
    for(const id of BIOME_IDS)delete state.biomes.profiles[id].assets[name];
    state.biomes.assetOwners[name]=owner;
    if(BIOME_DEFS[owner]){
      const def=BIOME_ASSET_BY_NAME.get(name);state.biomes.profiles[owner].assets[name]={density:Number(def.density)||0,max:Math.max(0,Math.round(Number(def.max)||0))};
    }
  }

  function bindBiomeAssetRows(){
    els.selection.querySelectorAll('[data-biome-asset]').forEach(row=>{
      const name=row.dataset.biomeAsset,ownerSelect=row.querySelector('[data-asset-owner]'),density=row.querySelector('[data-asset-density]'),max=row.querySelector('[data-asset-max]');
      ownerSelect?.addEventListener('change',()=>{pushHistory('Change biome asset owner');assignAssetOwner(name,ownerSelect.value);saveBiomeState();renderSelection();toast(`${BIOME_ASSET_BY_NAME.get(name)?.label||name} ownership updated.`);});
      density?.addEventListener('change',()=>{const owner=biomeOwnerForAsset(name),entry=profileEntry(owner,name);if(!entry)return;pushHistory('Change biome density');entry.density=RigClamp(number(density.value,entry.density),0,100);saveBiomeState();renderSelection();});
      max?.addEventListener('change',()=>{const owner=biomeOwnerForAsset(name),entry=profileEntry(owner,name);if(!entry)return;pushHistory('Change biome cap');entry.max=Math.max(0,Math.round(number(max.value,entry.max)));saveBiomeState();renderSelection();});
    });
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

  function renderWorldGroupSelection(group){
    const ex=group.exclusion&&typeof group.exclusion==='object'?group.exclusion:null;
    const exclusionText=ex?.enabled!==false&&ex?`${round(number(ex.width,0),1)} × ${round(number(ex.depth,0),1)} m`:'Off';
    els.selection.innerHTML=`<h2>${escapeHtml(group.label)}</h2><p class="muted">World Group · ${escapeHtml(group.id)}</p>
      <div class="wl-biome-status-pills"><span class="wl-pill">${group.memberCount} ${group.memberCount===1?'asset':'assets'}</span><span class="wl-pill">Exclusion ${escapeHtml(exclusionText)}</span>${group.templateId?'<span class="wl-pill">Template instance</span>':''}</div>
      <div class="wl-selection-form"><label>Anchor X<input id="wl-world-group-x" type="number" step="0.1" value="${round(group.x,3)}"></label><label>Extent<input type="text" readonly value="${round(group.minX,1)} → ${round(group.maxX,1)} m"></label><label>Depth Z<input type="text" readonly value="${round(group.z,2)}"></label><label>Status<input type="text" readonly value="${group.pending?'Move queued':'Placed'}"></label></div>
      ${group.pending?`<p class="muted">Move queued from ${round(group.actualX,2)} m to ${round(group.x,2)} m. The game applies it using the normal terrain-aware World Group move on next load.</p>`:'<p class="muted">Drag the selected group block horizontally to adjust pacing. The move is queued so the game can re-ground every child correctly when it loads.</p>'}
      <div class="wl-actions"><button class="primary" id="wl-queue-world-group">${group.pending?'Update queued move':'Queue move'}</button><button id="wl-open-world-group">Jump to Game</button><button id="wl-playhead-world-group">Move playhead here</button>${group.pending?'<button id="wl-cancel-world-group">Cancel queued move</button>':''}</div>`;
    $('wl-queue-world-group').addEventListener('click',()=>{pushHistory('Queue World Group move');const x=number($('wl-world-group-x').value,group.x);queueWorldGroupMove(group.id,x);refreshGameData();select('world-group',group.id);toast('World Group move queued.');});
    $('wl-open-world-group').addEventListener('click',()=>{const x=number($('wl-world-group-x').value,group.x);if(Math.abs(x-group.actualX)>.0001)queueWorldGroupMove(group.id,x);location.href=`play.html?worldX=${encodeURIComponent(x)}&from=world-lab`;});
    $('wl-playhead-world-group').addEventListener('click',()=>{state.playheadX=group.x;select('playhead','player');});
    $('wl-cancel-world-group')?.addEventListener('click',()=>{pushHistory('Cancel World Group move');cancelWorldGroupMove(group.id);select('world-group',group.id);toast('Queued World Group move cancelled.');});
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


  function queueWorldGroupMove(groupId,x){
    state.groupMoves||={};state.groupMoves[groupId]={x:round(number(x,0),3),updatedAt:Date.now()};saveJson(STORAGE.groupMoves,state.groupMoves);
    const group=findWorldGroup(groupId);if(group){group.pending=true;group.x=state.groupMoves[groupId].x;group.minX=group.x+group.minLocal;group.maxX=group.x+group.maxLocal;}
  }

  function cancelWorldGroupMove(groupId){
    if(!state.groupMoves?.[groupId])return;
    delete state.groupMoves[groupId];saveJson(STORAGE.groupMoves,state.groupMoves);refreshGameData();
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
    const assetCount=sceneDressingEntries().length,groupCount=state.worldGroups.length,transitionCount=state.biomes?.transitions?.length||0;
    els.status.textContent=`${state.puzzles.length} puzzles · ${groupCount} World Group${groupCount===1?'':'s'} · ${transitionCount} biome transition${transitionCount===1?'':'s'} · ${state.elements.filter(e=>TYPE_TRACK[e.type]!=='legacy').length} World Elements${assetCount?` · ${assetCount} standalone world asset${assetCount===1?'':'s'}`:''}`;
    syncUndoUi();
  }

  function exportStore(key,fallback=null){
    return loadJson(key,fallback);
  }

  function completeGameDesignExportPayload(){
    refreshGameData();
    const bakedWorld=clone(baked?.world||{});
    const placedWorldAssets=(state.scene?.added||[]).filter(item=>item&&!item.deleted&&!item.puzzleInstanceId).map(item=>clone(item));
    const puzzleMarkers=state.puzzles.map(item=>({
      id:item.id,group:item.group,label:item.label,x:item.x,actualX:item.actualX,local:!!item.local,
      minX:item.minX,maxX:item.maxX,pending:!!item.pending
    }));
    return {
      format:'SideScrollGameDesign',
      formatVersion:2,
      appVersion:'1.0.106',
      exportedAt:new Date().toISOString(),
      purpose:'Complete SideScroll authoring handoff and restore snapshot. Exported from World Lab.',
      world:{
        ...bakedWorld,
        elements:clone(state.elements),
        biomes:clone(state.biomes),
        terrain:clone(state.terrain),
        pendingPuzzleMoves:clone(state.pending),
        pendingWorldGroupMoves:clone(state.groupMoves),
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
        if(parsed?.world?.biomes!==undefined)writeImportedStore(STORAGE.biomes,parsed.world.biomes);
        if(parsed?.world?.terrain!==undefined)writeImportedStore(STORAGE.terrain,parsed.world.terrain);
        if(parsed?.world?.pendingPuzzleMoves!==undefined)writeImportedStore(STORAGE.pending,parsed.world.pendingPuzzleMoves);
        if(parsed?.world?.pendingWorldGroupMoves!==undefined)writeImportedStore(STORAGE.groupMoves,parsed.world.pendingWorldGroupMoves);
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
    const biomeOwner=biomeOwnerForAsset(item.raw?.assetName||item.label);
    els.selection.innerHTML=`<h2>${escapeHtml(item.label)}</h2><p class="muted">World-owned placed asset · ${escapeHtml(item.id)}</p>
      <div class="wl-selection-form"><label>World X<input readonly value="${round(item.x,3)} m"></label><label>Depth Z<input readonly value="${round(item.z,3)}"></label><label>Width<input readonly value="${round(item.sx,2)} m"></label><label>Height<input readonly value="${round(item.sy,2)} m"></label><label>Category<input readonly value="${escapeAttr(category)}"></label><label>Gameplay<input readonly value="${escapeAttr(gameplay)}"></label><label>Biome owner<input readonly value="${escapeAttr(biomeOwner===GLOBAL_BIOME_OWNER?'Global / Unbound':biomeLabel(biomeOwner))}"></label></div>
      <p class="muted">World ownership is determined separately from gameplay behaviour, so interactive environment assets such as climbable rocks appear here too. Transform it in the in-game editor.</p>
      <div class="wl-actions"><button class="primary" id="wl-scene-dressing-jump">Jump to Game</button><button id="wl-scene-dressing-playhead">Move playhead here</button></div>`;
    $('wl-scene-dressing-jump').addEventListener('click',()=>{location.href=`play.html?worldX=${encodeURIComponent(item.x)}&from=world-lab`;});
    $('wl-scene-dressing-playhead').addEventListener('click',()=>{state.playheadX=item.x;select('playhead','player');});
  }

  function historySnapshot(label='World Lab change'){
    return {label,elements:clone(state.elements),biomes:clone(state.biomes),pending:clone(state.pending),groupMoves:clone(state.groupMoves),terrain:clone(state.terrain),playheadX:state.playheadX,selected:clone(state.selected)};
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
    state.biomes=normaliseBiomeState(snap.biomes||defaultBiomeState());
    state.pending=clone(snap.pending)||{};
    state.groupMoves=clone(snap.groupMoves)||{};
    state.terrain=normaliseTerrainState(snap.terrain||{});
    state.playheadX=number(snap.playheadX,state.playheadX);
    state.selected=clone(snap.selected);
    saveElements();
    saveBiomeState();
    saveJson(STORAGE.pending,state.pending);
    saveJson(STORAGE.groupMoves,state.groupMoves);
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
