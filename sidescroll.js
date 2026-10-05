(() => {
  'use strict';

  // SideScroll v1.0.114: refresh Asset Lab behaviour/config changes when returning to Play.
  // SideScroll v1.0.113: authored world/puzzle assets never wrap across the world tile.
  // SideScroll v1.0.112: dynamic user-created biomes + explicit biome/profile library.
  // SideScroll v1.0.111: reusable Biome Profiles + same-biome profile transitions.
  // SideScroll v1.0.110: World Group recovery controls · Position panel + Delete Group.
  // SideScroll v1.0.109: precise screen-space asset/group dragging + dot-only group move handle.
  // SideScroll v1.0.108: persist World Group ownership through scene reconstruction.
  // SideScroll v1.0.107: World Group lock/edit semantics + direct whole-group dragging.
  // SideScroll v1.0.106: World Groups v3 · group-owned exclusion zones + World Lab group timeline moves.
  // SideScroll v1.0.105: World Groups v2 · reusable templates + terrain-aware group moves.
  // SideScroll v1.0.104: World Groups v1 · optional authored environment grouping/edit/move workflow.
  // SideScroll v1.0.102: settlement cache-bust + corrected cropped asset dimensions.
  // SideScroll v1.0.100: settlement building test library (global/manual placement + Asset Lab registration).
  // SideScroll v1.0.95: editor selection filters + placed-world list + exhaustive tap cycling + shared World Objects.
  // SideScroll v1.0.93: refresh climb-rock texture URL after art replacement; retains v1.0.91 biome sizing sync.
  // SideScroll v1.0.86: left-facing climb fix + constant-rate climb traversal/animation.
  // SideScroll v1.0.84: mountain Asset Lab registration + terrain-relative edit camera.
  // v1.0.83 introduced the first individual-asset mountain art test library.
  // Mountain cliffs, rock dressing, scrub trees and dry grasses remain separate PNGs until atlas packing is approved.

  const queryParams = new URLSearchParams(window.location.search);
  const PLAYER_MODE = queryParams.get('mode') === 'player';
  const PUZZLE_LAB_MODE = queryParams.get('lab') === 'puzzle';
  const PUZZLE_LAB_GROUP_ID = queryParams.get('group') || 'MOUNTAIN_CLIMB_PROTO';
  const PUZZLE_LAB_ENV_RAW = queryParams.get('environment') || 'mountain';
  const PUZZLE_LAB_ENVIRONMENT = ['blank','woodland','mountain'].includes(PUZZLE_LAB_ENV_RAW) ? PUZZLE_LAB_ENV_RAW : 'blank';
  const PUZZLE_LAB_MARKER_X_RAW = Number(queryParams.get('markerX'));
  const PUZZLE_LAB_MARKER_X = Number.isFinite(PUZZLE_LAB_MARKER_X_RAW) ? PUZZLE_LAB_MARKER_X_RAW : 0;
  const PUZZLE_LAB_AUTO_TEST = queryParams.get('autotest') === '1';
  const PUZZLE_LAB_COLLISION = queryParams.get('collision') === '1';
  const PUZZLE_LAB_LAUNCH = (() => {
    if (!PUZZLE_LAB_MODE) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem('sidescroll.puzzle-lab.launch.v1') || 'null');
      return parsed && parsed.groupId === PUZZLE_LAB_GROUP_ID ? parsed : null;
    } catch (_) { return null; }
  })();
  const PUZZLE_LAB_MARKER_ID = `puzzle-lab-${String(PUZZLE_LAB_GROUP_ID).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'puzzle'}`;
  const puzzleLabMarker = { id:PUZZLE_LAB_MARKER_ID, group:PUZZLE_LAB_GROUP_ID, x:PUZZLE_LAB_MARKER_X, lab:true, linkMode:'copy' };
  const WORLD_LAB_JUMP_RAW = queryParams.get('worldX');
  const WORLD_LAB_JUMP_X = WORLD_LAB_JUMP_RAW === null || WORLD_LAB_JUMP_RAW === '' ? NaN : Number(WORLD_LAB_JUMP_RAW);
  const WORLD_LAB_LAUNCH = queryParams.get('from') === 'world-lab' && Number.isFinite(WORLD_LAB_JUMP_X);
  const WORLD_LAB_PENDING_MOVES_STORAGE_KEY = 'sidescroll.world-lab.pending-puzzle-moves.v1';
  const WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY = 'sidescroll.world-lab.pending-world-group-moves.v1';
  const BAKED_GAME_DESIGN = window.SIDESCROLL_BAKED_GAME_DESIGN || null;

  const BIOME_STORAGE_KEY = 'sidescroll.biomes.v1';
  const BIOME_RUNTIME_DEFS = {
    woodland:{id:'woodland',label:'Woodland'},
    mountain:{id:'mountain',label:'Mountain'}
  };
  const BIOME_RUNTIME_BUILTIN_IDS = Object.keys(BIOME_RUNTIME_DEFS);
  const BIOME_GLOBAL_OWNER = 'global';
  const BIOME_RUNTIME_PROFILE_DEFAULTS = {
    woodland:{
      tree01:{density:1.42,max:3},tree02:{density:1.42,max:3},tree03:{density:1.42,max:3},tree04:{density:1.42,max:3},
      tree05:{density:1.42,max:3},tree06:{density:1.42,max:3},tree07:{density:1.42,max:3},tree08:{density:1.42,max:3},
      ground01:{density:5.6,max:9},ground02:{density:4.7,max:8},ground03:{density:4.5,max:8},ground04:{density:4.3,max:8},
      ground05:{density:3.0,max:5},ground06:{density:4.5,max:8},ground07:{density:3.0,max:5},ground08:{density:2.2,max:4},
      ground09:{density:3.4,max:6},ground10:{density:1.5,max:3},ground11:{density:4.9,max:8},ground12:{density:3.9,max:7}
    },
    mountain:{
      'mountain-rock-01':{density:3.0,max:5},'mountain-rock-02':{density:2.5,max:4},'mountain-rock-03':{density:1.8,max:3},'mountain-rock-04':{density:2.4,max:4},
      'mountain-tree-01':{density:.8,max:2},'mountain-tree-02':{density:.6,max:2},
      'mountain-grass-01':{density:5.0,max:8},'mountain-grass-02':{density:3.5,max:6},'mountain-grass-03':{density:3.0,max:5}
    }
  };
  const MOUNTAIN_PROCEDURAL_ASSET_NAMES = Object.keys(BIOME_RUNTIME_PROFILE_DEFAULTS.mountain||{});

  function defaultRuntimeBiomeOwner(assetName){
    const name=String(assetName||'');
    if(/^tree(?:0[1-8])$/.test(name)||/^ground(?:0[1-9]|1[0-2])$/.test(name))return 'woodland';
    if(/^mountain-(?:rock|tree|grass)-/.test(name))return 'mountain';
    if(name==='mountain-climb-rock-01'||/^mountain-cliff-/.test(name))return BIOME_GLOBAL_OWNER;
    return BIOME_GLOBAL_OWNER;
  }
  function runtimeProfileDefaults(biome){
    const assets={};
    for(const [name,entry] of Object.entries(BIOME_RUNTIME_PROFILE_DEFAULTS[biome]||{}))assets[name]={density:Number(entry.density)||0,max:Math.max(0,Math.round(Number(entry.max)||0))};
    return{id:'default',label:'Default',assets};
  }
  function normaliseRuntimeProfiles(rawProfiles,defs){
    const out={};
    for(const biome of Object.keys(defs)){
      out[biome]={};
      const rawBiome=rawProfiles?.[biome];
      if(rawBiome?.assets&&typeof rawBiome.assets==='object'){
        out[biome].default={id:'default',label:String(rawBiome.label||'Default'),assets:{...runtimeProfileDefaults(biome).assets,...rawBiome.assets}};
      }else if(rawBiome&&typeof rawBiome==='object'){
        for(const [pid,profile] of Object.entries(rawBiome)){
          if(!profile||typeof profile!=='object')continue;
          out[biome][pid]={id:pid,label:String(profile.label||pid),assets:{...runtimeProfileDefaults(biome).assets,...(profile.assets||{})}};
        }
      }
      if(!out[biome].default)out[biome].default=runtimeProfileDefaults(biome);
    }
    return out;
  }
  function loadRuntimeBiomeState(){
    let raw=null;try{raw=JSON.parse(localStorage.getItem(BIOME_STORAGE_KEY)||'null');}catch(_){}
    const state=raw&&typeof raw==='object'?raw:{};
    const defs=Object.fromEntries(Object.entries(BIOME_RUNTIME_DEFS).map(([id,def])=>[id,{...def,builtIn:true}]));
    for(const [rawId,rawDef] of Object.entries(state.defs&&typeof state.defs==='object'?state.defs:{})){
      if(!rawDef||typeof rawDef!=='object')continue;
      const id=String(rawDef.id||rawId||'').trim();
      if(!id||BIOME_RUNTIME_DEFS[id])continue;
      defs[id]={id,label:String(rawDef.label||id),colour:String(rawDef.colour||'#7d8b91'),builtIn:false};
    }
    const biomeIds=Object.keys(defs);
    const profiles=normaliseRuntimeProfiles(state.profiles,defs);
    const defaultBiome=defs[state.defaultBiome]?state.defaultBiome:'woodland';
    const defaultProfile=profiles[defaultBiome]?.[state.defaultProfile]?state.defaultProfile:'default';
    const transitions=(Array.isArray(state.transitions)?state.transitions:[]).map((item,index)=>{
      const start=Number.isFinite(Number(item?.startX))?Number(item.startX):100+index*80;
      const end=Math.max(start+1,Number.isFinite(Number(item?.endX))?Number(item.endX):start+30);
      const fallbackTo=biomeIds.find(id=>id!==defaultBiome)||defaultBiome;
      const to=defs[item?.to]?item.to:fallbackTo;
      const toProfile=profiles[to]?.[item?.toProfile]?item.toProfile:'default';
      return{
        id:String(item?.id||`biome-${index}`),
        from:defs[item?.from]?item.from:defaultBiome,
        fromProfile:String(item?.fromProfile||'default'),
        to,toProfile,startX:start,endX:end,
        curve:{
          y1:Number.isFinite(Number(item?.curve?.y1))?Math.max(0,Math.min(1,Number(item.curve.y1))):1/3,
          y2:Number.isFinite(Number(item?.curve?.y2))?Math.max(0,Math.min(1,Number(item.curve.y2))):2/3
        }
      };
    }).sort((a,b)=>a.startX-b.startX);
    let current={biome:defaultBiome,profile:defaultProfile};
    for(const item of transitions){
      item.from=current.biome;
      item.fromProfile=profiles[current.biome]?.[current.profile]?current.profile:'default';
      if(!profiles[item.to]?.[item.toProfile])item.toProfile='default';
      if(item.to===item.from&&item.toProfile===item.fromProfile){
        const alt=Object.keys(profiles[item.to]||{}).find(pid=>pid!==item.fromProfile);
        if(alt)item.toProfile=alt;
        else{item.to=biomeIds.find(id=>id!==item.from)||item.from;item.toProfile='default';}
      }
      current={biome:item.to,profile:item.toProfile};
    }
    return{
      version:3,defs,defaultBiome,defaultProfile,maxActiveBiomes:2,
      stream:{
        preload:Number.isFinite(Number(state?.stream?.preload))?Math.max(0,Number(state.stream.preload)):12,
        unload:Number.isFinite(Number(state?.stream?.unload))?Math.max(0,Number(state.stream.unload)):12
      },
      transitions,
      assetOwners:state.assetOwners&&typeof state.assetOwners==='object'?state.assetOwners:{},
      profiles
    };
  }

  let runtimeBiomeState=loadRuntimeBiomeState();
  function runtimeBiomeTransitionAt(x){return runtimeBiomeState.transitions.find(item=>x>=item.startX&&x<=item.endX)||null;}
  function runtimeBiomeProgress(item,x){
    if(x<=item.startX)return 0;if(x>=item.endX)return 1;
    const t=Math.max(0,Math.min(1,(x-item.startX)/Math.max(.001,item.endX-item.startX))),u=1-t;
    return Math.max(0,Math.min(1,3*u*u*t*item.curve.y1+3*u*t*t*item.curve.y2+t*t*t));
  }
  function runtimeBiomeStatesAt(x){
    let current={biome:runtimeBiomeState.defaultBiome,profile:runtimeBiomeState.defaultProfile||'default'};
    for(const item of runtimeBiomeState.transitions){
      if(x<item.startX)return[{...current,weight:1}];
      if(x<=item.endX){
        const t=runtimeBiomeProgress(item,x);
        return[
          {biome:item.from,profile:item.fromProfile||'default',weight:1-t},
          {biome:item.to,profile:item.toProfile||'default',weight:t}
        ];
      }
      current={biome:item.to,profile:item.toProfile||'default'};
    }
    return[{...current,weight:1}];
  }
  function runtimeBiomeWeightsAt(x){
    const out={};
    for(const stateAt of runtimeBiomeStatesAt(x))out[stateAt.biome]=(out[stateAt.biome]||0)+stateAt.weight;
    return out;
  }
  function runtimeDominantBiomeAt(x){
    const states=runtimeBiomeStatesAt(x);let best=states[0]||{biome:runtimeBiomeState.defaultBiome,weight:1};
    for(const item of states)if(item.weight>best.weight)best=item;
    return best.biome;
  }
  function runtimeDominantBiomeStateAt(x){
    const states=runtimeBiomeStatesAt(x);let best=states[0]||{biome:runtimeBiomeState.defaultBiome,profile:runtimeBiomeState.defaultProfile,weight:1};
    for(const item of states)if(item.weight>best.weight)best=item;
    return best;
  }
  function runtimeStreamWindow(index){
    const list=runtimeBiomeState.transitions,item=list[index];if(!item)return null;const prev=list[index-1]||null,next=list[index+1]||null;
    const gapBefore=prev?Math.max(0,item.startX-prev.endX):Infinity,gapAfter=next?Math.max(0,next.startX-item.endX):Infinity;
    return{loadX:Math.max(item.startX-runtimeBiomeState.stream.preload,prev?prev.endX+gapBefore*.5:-Infinity),unloadX:Math.min(item.endX+runtimeBiomeState.stream.unload,next?item.endX+gapAfter*.5:Infinity)};
  }
  function runtimeLoadedBiomesAt(x){
    for(const item of runtimeBiomeState.transitions)if(x>=item.startX&&x<=item.endX)return [...new Set([item.from,item.to])];
    const current=runtimeDominantBiomeStateAt(x);
    for(let i=0;i<runtimeBiomeState.transitions.length;i++){
      const item=runtimeBiomeState.transitions[i],win=runtimeStreamWindow(i);
      if(item.from===item.to)continue;
      if(x>=win.loadX&&x<item.startX&&current.biome===item.from)return [...new Set([item.from,item.to])];
      if(x>item.endX&&x<=win.unloadX&&current.biome===item.to)return [...new Set([item.from,item.to])];
    }
    return[current.biome];
  }
  function runtimeBiomeOwner(assetName){const saved=runtimeBiomeState.assetOwners?.[assetName];return saved===BIOME_GLOBAL_OWNER||runtimeBiomeState.defs?.[saved]?saved:defaultRuntimeBiomeOwner(assetName);}
  function runtimeProfileRecord(owner,profileId='default'){return runtimeBiomeState.profiles?.[owner]?.[profileId]||runtimeBiomeState.profiles?.[owner]?.default||null;}
  function runtimeSourceDefaultEntry(assetName){
    for(const profile of Object.values(BIOME_RUNTIME_PROFILE_DEFAULTS)){
      if(profile?.[assetName])return profile[assetName];
    }
    return{density:0,max:0};
  }
  function runtimeProfileEntry(owner,profileId,assetName){
    const saved=runtimeProfileRecord(owner,profileId)?.assets?.[assetName];
    const fallback=BIOME_RUNTIME_PROFILE_DEFAULTS?.[owner]?.[assetName]||runtimeSourceDefaultEntry(assetName);
    return{
      density:Number.isFinite(Number(saved?.density))?Math.max(0,Number(saved.density)):fallback.density,
      max:Number.isFinite(Number(saved?.max))?Math.max(0,Math.round(Number(saved.max))):fallback.max
    };
  }
  function runtimeBiomeProfileEntryAt(owner,assetName,x){
    const states=runtimeBiomeStatesAt(x).filter(stateAt=>stateAt.biome===owner&&stateAt.weight>.000001);
    if(!states.length)return{density:0,max:0};
    const total=states.reduce((sum,stateAt)=>sum+stateAt.weight,0)||1;
    let density=0,max=0;
    for(const stateAt of states){
      const entry=runtimeProfileEntry(owner,stateAt.profile,assetName),w=stateAt.weight/total;
      density+=entry.density*w;max+=entry.max*w;
    }
    return{density,max};
  }
  function runtimeBiomeProfilePoolMax(owner,assetName){
    let max=Number((BIOME_RUNTIME_PROFILE_DEFAULTS?.[owner]?.[assetName]||runtimeSourceDefaultEntry(assetName))?.max)||0;
    for(const profile of Object.values(runtimeBiomeState.profiles?.[owner]||{})){
      const value=Number(profile?.assets?.[assetName]?.max);if(Number.isFinite(value))max=Math.max(max,value);
    }
    return Math.max(0,Math.round(max));
  }
  function stableBiomeHash01(value){
    const str=String(value||'');let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
    h+=h<<13;h^=h>>>7;h+=h<<3;h^=h>>>17;h+=h<<5;
    return(h>>>0)/4294967296;
  }
  function tagProceduralBiomeObject(obj,owner,key,{candidatePool=false}={}){
    if(!obj)return obj;obj.biomeProceduralOwner=owner;obj.biomeActivation=stableBiomeHash01(key||obj.id);obj.biomeCandidatePool=!!candidatePool;return obj;
  }
  function proceduralBiomeVisibleAt(obj,drawX){
    if(!obj?.biomeProceduralOwner)return true;
    const owner=runtimeBiomeOwner(obj.assetName);
    if(owner===BIOME_GLOBAL_OWNER)return false;
    const ownerWeight=runtimeBiomeWeightsAt(drawX)[owner]||0;if(ownerWeight<=.0001)return false;
    const entry=runtimeBiomeProfileEntryAt(owner,obj.assetName,drawX);
    let probability=ownerWeight;
    if(obj.biomeCandidatePool){
      const poolMax=Math.max(1,runtimeBiomeProfilePoolMax(owner,obj.assetName));
      const target=Math.min(Math.max(0,entry.density),Math.max(0,entry.max));
      probability*=Math.min(1,target/poolMax);
    }else{
      // Woodland's existing deterministic layout is its full-density pool.
      // Profiles can thin that pool continuously; Max still acts as a cap.
      const fallback=BIOME_RUNTIME_PROFILE_DEFAULTS?.[owner]?.[obj.assetName]||runtimeSourceDefaultEntry(obj.assetName)||{density:entry.density,max:entry.max};
      const base=Math.min(Math.max(0,Number(fallback.density)||0),Math.max(0,Number(fallback.max)||Number(fallback.density)||0))||1;
      const target=Math.min(Math.max(0,entry.density),Math.max(0,entry.max));
      probability*=Math.min(1,target/base);
    }
    return obj.biomeActivation<=Math.max(0,Math.min(1,probability));
  }
  function environmentAssetAvailableForBiome(assetName,x){const owner=runtimeBiomeOwner(assetName);return owner===BIOME_GLOBAL_OWNER||runtimeLoadedBiomesAt(x).includes(owner);}
  function runtimeBiomeBlendLabel(x){
    return runtimeBiomeStatesAt(x).filter(stateAt=>stateAt.weight>.005).map(stateAt=>{
      const profile=runtimeProfileRecord(stateAt.biome,stateAt.profile);
      return`${runtimeBiomeState.defs?.[stateAt.biome]?.label||stateAt.biome} / ${profile?.label||stateAt.profile} ${Math.round(stateAt.weight*100)}%`;
    }).join(' / ');
  }
  window.SideScrollBiomes={
    get state(){return runtimeBiomeState;},
    statesAt:runtimeBiomeStatesAt,
    weightsAt:runtimeBiomeWeightsAt,
    loadedAt:runtimeLoadedBiomesAt,
    ownerOf:runtimeBiomeOwner,
    reload(){runtimeBiomeState=loadRuntimeBiomeState();return runtimeBiomeState;}
  };

  const PLAYER_POSITION_STORAGE_KEY = 'sidescroll.player.position.v1';
  const PLAYER_PUZZLE_STATE_STORAGE_KEY = 'sidescroll.player.puzzle-state.v1';
  const PLAYER_INVENTORY_STORAGE_KEY = 'sidescroll.player.inventory.v1';
  let playerSaveDeletionInProgress = false;

  // Declared before scene/puzzle bootstrap because collision and puzzle helpers
  // can run while the initial world is being restored.
  let pushingObject = null;
  let pushingSide = 0;
  let pushingFloorOffset = 0;
  const PUSH_ACTION_RANGE = 0.88;
  const PUSH_SPEED = 0.90;

  const Rig = window.GameHubWalkRig;
  if (!Rig) return;

  const canvas = document.getElementById('sidescroll-canvas');
  const errorBox = document.getElementById('sidescroll-error');
  const statusEl = document.getElementById('sidescroll-status');
  const hintEl = document.getElementById('sidescroll-hint');
  const entryFadeEl = document.getElementById('sidescroll-entry-fade');
  let introLocked = PLAYER_MODE;
  let visualAssetsPending = 0;
  let visualAssetsStarted = 0;
  function beginVisualAssetLoad() {
    visualAssetsPending += 1;
    visualAssetsStarted += 1;
    let finished = false;
    return () => {
      if (finished) return;
      finished = true;
      visualAssetsPending = Math.max(0, visualAssetsPending - 1);
    };
  }
  const debugBtn = document.getElementById('sidescroll-depth');
  const postBtn = document.getElementById('sidescroll-post');
  const postPanel = document.getElementById('sidescroll-post-panel');
  const postCloseBtn = document.getElementById('sidescroll-post-close');
  const postBrightnessInput = document.getElementById('sidescroll-post-brightness');
  const postContrastInput = document.getElementById('sidescroll-post-contrast');
  const postSaturationInput = document.getElementById('sidescroll-post-saturation');
  const postTintColourInput = document.getElementById('sidescroll-post-tint-colour');
  const postTintAmountInput = document.getElementById('sidescroll-post-tint-amount');
  const postBrightnessValue = document.getElementById('sidescroll-post-brightness-value');
  const postContrastValue = document.getElementById('sidescroll-post-contrast-value');
  const postSaturationValue = document.getElementById('sidescroll-post-saturation-value');
  const postTintAmountValue = document.getElementById('sidescroll-post-tint-amount-value');
  const postResetBtn = document.getElementById('sidescroll-post-reset');
  const fogBtn = document.getElementById('sidescroll-fog');
  const fogPanel = document.getElementById('sidescroll-fog-panel');
  const fogCloseBtn = document.getElementById('sidescroll-fog-close');
  const fogEnabledInput = document.getElementById('sidescroll-fog-enabled');
  const fogColourInput = document.getElementById('sidescroll-fog-colour');
  const fogStartInput = document.getElementById('sidescroll-fog-start');
  const fogCurveInput = document.getElementById('sidescroll-fog-curve');
  const fogAmountInput = document.getElementById('sidescroll-fog-amount');
  const fogStartValue = document.getElementById('sidescroll-fog-start-value');
  const fogCurveValue = document.getElementById('sidescroll-fog-curve-value');
  const fogAmountValue = document.getElementById('sidescroll-fog-amount-value');
  const fogResetBtn = document.getElementById('sidescroll-fog-reset');
  const collisionViewBtn = document.getElementById('sidescroll-collision-view');
  const playerHintsBtn = document.getElementById('sidescroll-player-hints');
  const stageMenuBtn = document.getElementById('sidescroll-tools');
  const stageMenuPanel = document.getElementById('sidescroll-tools-panel');
  const stageMenuCloseBtn = document.getElementById('sidescroll-tools-close');
  const soundBtn = document.getElementById('sidescroll-sound');
  const soundPanel = document.getElementById('sidescroll-sound-panel');
  const soundCloseBtn = document.getElementById('sidescroll-sound-close');
  const musicEnabledInput = document.getElementById('sidescroll-music-enabled');
  const musicVolumeInput = document.getElementById('sidescroll-music-volume');
  const musicVolumeValue = document.getElementById('sidescroll-music-volume-value');
  const soundStatusEl = document.getElementById('sidescroll-sound-status');
  const sectionBtn = document.getElementById('sidescroll-sections');
  const sectionPanel = document.getElementById('sidescroll-section-panel');
  const sectionCloseBtn = document.getElementById('sidescroll-section-close');
  const sectionGuidesBtn = document.getElementById('sidescroll-section-guides');
  const sectionGuidesPersistInput = document.getElementById('sidescroll-section-guides-persist');
  const sectionCurrentEl = document.getElementById('sidescroll-section-current');
  const sectionCurrentBoundsEl = document.getElementById('sidescroll-section-current-bounds');
  const sectionSelectedEl = document.getElementById('sidescroll-section-selected');
  const sectionSelectedBoundsEl = document.getElementById('sidescroll-section-selected-bounds');
  const sectionPrevBtn = document.getElementById('sidescroll-section-prev');
  const sectionPlayerBtn = document.getElementById('sidescroll-section-player');
  const sectionNextBtn = document.getElementById('sidescroll-section-next');
  const sectionHeightRow = document.getElementById('sidescroll-section-height-row');
  const sectionHeightInput = document.getElementById('sidescroll-section-height');
  const sectionHeightValue = document.getElementById('sidescroll-section-height-value');
  const sectionHeightNumber = document.getElementById('sidescroll-section-height-number');
  const sectionHeightDownBtn = document.getElementById('sidescroll-section-height-down');
  const sectionHeightUpBtn = document.getElementById('sidescroll-section-height-up');
  const sectionHeightLinkInput = document.getElementById('sidescroll-section-height-link');
  const sectionLayerControls = {
    near:{ mode:document.getElementById('sidescroll-section-layer-near-mode'), value:document.getElementById('sidescroll-section-layer-near-value'), summary:document.getElementById('sidescroll-section-layer-near-summary') },
    farA:{ mode:document.getElementById('sidescroll-section-layer-far-a-mode'), value:document.getElementById('sidescroll-section-layer-far-a-value'), summary:document.getElementById('sidescroll-section-layer-far-a-summary') },
    farB:{ mode:document.getElementById('sidescroll-section-layer-far-b-mode'), value:document.getElementById('sidescroll-section-layer-far-b-value'), summary:document.getElementById('sidescroll-section-layer-far-b-summary') }
  };
  const sectionVisibleBtn = document.getElementById('sidescroll-section-visible');
  const sectionTypeSelect = document.getElementById('sidescroll-section-type');
  const sectionRiverWidthRow = document.getElementById('sidescroll-section-river-width-row');
  const sectionRiverWidthInput = document.getElementById('sidescroll-section-river-width');
  const sectionRiverWidthValue = document.getElementById('sidescroll-section-river-width-value');
  const sectionCollisionBtn = document.getElementById('sidescroll-section-collision');
  const sectionBankDressBtn = document.getElementById('sidescroll-section-bank-dress');
  const sectionBankClearBtn = document.getElementById('sidescroll-section-bank-clear');
  const sectionResetBtn = document.getElementById('sidescroll-section-reset');
  const characterSwapBtn = document.getElementById('sidescroll-character');
  const cameraEditorBtn = document.getElementById('sidescroll-editor-camera');
  const cameraEditorPanel = document.getElementById('sidescroll-camera-editor');
  const cameraValuesEl = document.getElementById('sidescroll-camera-values');
  const cameraUpBtn = document.getElementById('sidescroll-camera-up');
  const cameraDownBtn = document.getElementById('sidescroll-camera-down');
  const cameraBackBtn = document.getElementById('sidescroll-camera-back');
  const cameraForwardBtn = document.getElementById('sidescroll-camera-forward');
  const cameraTiltBackBtn = document.getElementById('sidescroll-camera-tilt-back');
  const cameraTiltForwardBtn = document.getElementById('sidescroll-camera-tilt-forward');
  const cameraFollowInput = document.getElementById('sidescroll-camera-follow');
  const cameraFollowAmountInput = document.getElementById('sidescroll-camera-follow-amount');
  const cameraFollowValue = document.getElementById('sidescroll-camera-follow-value');
  const inventoryBtn = document.getElementById('sidescroll-inventory');
  const inventoryCountEl = document.getElementById('sidescroll-inventory-count');
  const inventoryPanel = document.getElementById('sidescroll-inventory-panel');
  const inventoryCloseBtn = document.getElementById('sidescroll-inventory-close');
  const inventoryListEl = document.getElementById('sidescroll-inventory-list');
  const inventoryEmptyEl = document.getElementById('sidescroll-inventory-empty');
  const quickNavBtn = document.getElementById('sidescroll-quick-nav');
  const quickNavPanel = document.getElementById('sidescroll-quick-nav-panel');
  const quickNavCloseBtn = document.getElementById('sidescroll-quick-nav-close');
  const quickNavListEl = document.getElementById('sidescroll-quick-nav-list');
  const depthKey = document.getElementById('sidescroll-depth-key');
  const driveControl = document.getElementById('sidescroll-drive');
  const driveThumb = document.getElementById('sidescroll-drive-thumb');
  const jumpBtn = document.getElementById('sidescroll-jump');
  const secondaryControls = document.getElementById('sidescroll-secondary-controls');
  const actionBtn = document.getElementById('sidescroll-action');
  const actionLabel = document.getElementById('sidescroll-action-label');
  const editBtn = document.getElementById('sidescroll-edit');
  const editorDoneBtn = document.getElementById('sidescroll-editor-done');
  const deleteSaveBtn = document.getElementById('sidescroll-delete-save');
  const playControls = document.getElementById('sidescroll-play-controls');
  const editorControls = document.getElementById('sidescroll-editor-controls');
  const editorOverlay = document.getElementById('sidescroll-editor-overlay');
  const editorOverlayCtx = editorOverlay?.getContext('2d');
  const editorPalette = document.getElementById('sidescroll-editor-palette');
  const editorAssetsEl = document.getElementById('sidescroll-editor-assets');
  const editorPaletteClose = document.getElementById('sidescroll-editor-palette-close');
  const editorPaletteTitle = document.getElementById('sidescroll-editor-palette-title');
  const editorPaletteSubtitle = document.getElementById('sidescroll-editor-palette-subtitle');
  const assetSetupEl = document.getElementById('sidescroll-asset-setup');
  const assetSetupBackBtn = document.getElementById('sidescroll-asset-setup-back');
  const assetSetupNameEl = document.getElementById('sidescroll-asset-setup-name');
  const assetBehaviorListEl = document.getElementById('sidescroll-asset-behaviour-list');
  const assetSetupNoteEl = document.getElementById('sidescroll-asset-setup-note');
  const assetBehaviorResetBtn = document.getElementById('sidescroll-asset-behaviour-reset');
  const collectibleSetupEl = document.getElementById('sidescroll-collectible-setup');
  const collectibleSetupBackBtn = document.getElementById('sidescroll-collectible-setup-back');
  const collectibleSetupNameEl = document.getElementById('sidescroll-collectible-setup-name');
  const thoughtEditorEl = document.getElementById('sidescroll-thought-editor');
  const thoughtTextInput = document.getElementById('sidescroll-thought-text');
  const thoughtRadiusInput = document.getElementById('sidescroll-thought-radius');
  const thoughtRadiusValue = document.getElementById('sidescroll-thought-radius-value');
  const thoughtOnceBtn = document.getElementById('sidescroll-thought-once');
  const thoughtEditorCloseBtn = document.getElementById('sidescroll-thought-close');
  const cameraNodeEditorEl = document.getElementById('sidescroll-camera-node-editor');
  const cameraNodeRadiusInput = document.getElementById('sidescroll-camera-node-radius');
  const cameraNodeRadiusValue = document.getElementById('sidescroll-camera-node-radius-value');
  const cameraNodeXInput = document.getElementById('sidescroll-camera-node-x');
  const cameraNodeXValue = document.getElementById('sidescroll-camera-node-x-value');
  const cameraNodeYInput = document.getElementById('sidescroll-camera-node-y');
  const cameraNodeYValue = document.getElementById('sidescroll-camera-node-y-value');
  const cameraNodeZInput = document.getElementById('sidescroll-camera-node-z');
  const cameraNodeZValue = document.getElementById('sidescroll-camera-node-z-value');
  const cameraNodeCurveStartInput = document.getElementById('sidescroll-camera-node-curve-start');
  const cameraNodeCurveStartValue = document.getElementById('sidescroll-camera-node-curve-start-value');
  const cameraNodeCurveEndInput = document.getElementById('sidescroll-camera-node-curve-end');
  const cameraNodeCurveEndValue = document.getElementById('sidescroll-camera-node-curve-end-value');
  const cameraNodeEditorCloseBtn = document.getElementById('sidescroll-camera-node-close');
  const collectibleNameInput = document.getElementById('sidescroll-collectible-name');
  const collectibleScaleInput = document.getElementById('sidescroll-collectible-scale');
  const collectibleScaleValueEl = document.getElementById('sidescroll-collectible-scale-value');
  const collectibleSpinBtn = document.getElementById('sidescroll-collectible-spin');
  const collectibleResetBtn = document.getElementById('sidescroll-collectible-reset');
  const openAssetsBtn = document.getElementById('sidescroll-open-assets');
  const openEnvironmentAssetsBtn = document.getElementById('sidescroll-open-environment-assets');
  const editorResetBtn = document.getElementById('sidescroll-editor-reset');
  const puzzlePanel = document.getElementById('sidescroll-puzzle-panel');
  const placementStrip = document.getElementById('sidescroll-placement-strip');
  const placementNameEl = document.getElementById('sidescroll-placement-name');
  const placementChangeBtn = document.getElementById('sidescroll-placement-change');
  const placementDoneBtn = document.getElementById('sidescroll-placement-done');
  const editorScopeSwitch = document.getElementById('sidescroll-editor-scope-switch');
  const environmentScopeBtn = document.getElementById('sidescroll-scope-environment');
  const puzzleScopeBtn = document.getElementById('sidescroll-scope-puzzle');
  const puzzleSourceSwitch = document.getElementById('sidescroll-puzzle-source-switch');
  const puzzleSourceLibraryBtn = document.getElementById('sidescroll-puzzle-source-library');
  const puzzleSourceSceneBtn = document.getElementById('sidescroll-puzzle-source-scene');
  const puzzlePicker = document.getElementById('sidescroll-puzzle-picker');
  const puzzleLibraryView = document.getElementById('sidescroll-puzzle-library-view');
  const puzzleSceneView = document.getElementById('sidescroll-puzzle-scene-view');
  const puzzleSceneListEl = document.getElementById('sidescroll-scene-puzzle-list');
  const puzzleSceneEmptyEl = document.getElementById('sidescroll-scene-puzzle-empty');
  const puzzleSelectionEl = document.getElementById('sidescroll-puzzle-selection');
  const environmentSelectionEl = document.getElementById('sidescroll-environment-selection');
  const environmentFilterRowEl = document.getElementById('sidescroll-environment-filter-row');
  const environmentSceneListEl = document.getElementById('sidescroll-environment-scene-list');
  const environmentSceneEmptyEl = document.getElementById('sidescroll-environment-scene-empty');
  const environmentSceneCountEl = document.getElementById('sidescroll-environment-scene-count');
  const worldGroupCountEl = document.getElementById('sidescroll-world-group-count');
  const worldGroupNewBtn = document.getElementById('sidescroll-world-group-new');
  const worldGroupEditBtn = document.getElementById('sidescroll-world-group-edit');
  const worldGroupMoveBtn = document.getElementById('sidescroll-world-group-move');
  const worldGroupRenameBtn = document.getElementById('sidescroll-world-group-rename');
  const worldGroupMembershipBtn = document.getElementById('sidescroll-world-group-membership');
  const worldGroupDissolveBtn = document.getElementById('sidescroll-world-group-dissolve');
  const worldGroupDeleteBtn = document.getElementById('sidescroll-world-group-delete');
  const worldGroupExclusionToggleBtn = document.getElementById('sidescroll-world-group-exclusion-toggle');
  const worldGroupExclusionEditBtn = document.getElementById('sidescroll-world-group-exclusion-edit');
  const worldGroupExclusionFitBtn = document.getElementById('sidescroll-world-group-exclusion-fit');
  const worldGroupStatusEl = document.getElementById('sidescroll-world-group-status');
  const worldGroupListEl = document.getElementById('sidescroll-world-group-list');
  const worldGroupEmptyEl = document.getElementById('sidescroll-world-group-empty');
  const worldTemplateCountEl = document.getElementById('sidescroll-world-template-count');
  const worldTemplateSaveBtn = document.getElementById('sidescroll-world-template-save');
  const worldTemplatePlaceBtn = document.getElementById('sidescroll-world-template-place');
  const worldTemplateDeleteBtn = document.getElementById('sidescroll-world-template-delete');
  const worldTemplateStatusEl = document.getElementById('sidescroll-world-template-status');
  const worldTemplateListEl = document.getElementById('sidescroll-world-template-list');
  const worldTemplateEmptyEl = document.getElementById('sidescroll-world-template-empty');
  const puzzleStageSection = document.getElementById('sidescroll-puzzle-stage-section');
  const puzzleSelect = document.getElementById('sidescroll-puzzle-select');
  const puzzleEditBtn = document.getElementById('sidescroll-puzzle-edit');
  const puzzleFocusBtn = document.getElementById('sidescroll-puzzle-focus');
  const puzzleManageEl = document.getElementById('sidescroll-puzzle-manage');
  const puzzleSpawnBtn = document.getElementById('sidescroll-puzzle-spawn');
  const puzzleCreateBtn = document.getElementById('sidescroll-puzzle-create');
  const puzzleClearStageBtn = document.getElementById('sidescroll-puzzle-clear-stage');
  const puzzleRestoreStageBtn = document.getElementById('sidescroll-puzzle-restore-stage');
  const exportAllBtn = document.getElementById('sidescroll-export-all');
  const puzzleExportBtn = document.getElementById('sidescroll-puzzle-export');
  const puzzleRemoveBtn = document.getElementById('sidescroll-puzzle-remove');
  const puzzleDeleteTemplateBtn = document.getElementById('sidescroll-puzzle-delete-template');
  const puzzleActionsEl = document.getElementById('sidescroll-puzzle-actions');
  const puzzleObjectsEl = document.getElementById('sidescroll-puzzle-objects');
  const puzzleObjectCountEl = document.getElementById('sidescroll-puzzle-object-count');
  const puzzleObjectListEl = document.getElementById('sidescroll-puzzle-object-list');
  const puzzleModeEl = document.getElementById('sidescroll-puzzle-mode');
  const puzzleNameEl = document.getElementById('sidescroll-puzzle-name');
  const puzzleStateEl = document.getElementById('sidescroll-puzzle-state');
  const puzzleHelpEl = document.getElementById('sidescroll-puzzle-help');
  const puzzleMarkerEditor = document.getElementById('sidescroll-puzzle-marker-editor');
  const puzzleMarkerXInput = document.getElementById('sidescroll-puzzle-marker-x');
  const puzzleSetStartBtn = document.getElementById('sidescroll-puzzle-set-start');
  const puzzleExclusionEditBtn = document.getElementById('sidescroll-puzzle-exclusion-edit');
  const puzzleExclusionToggleBtn = document.getElementById('sidescroll-puzzle-exclusion-toggle');
  const puzzleRespawnEditBtn = document.getElementById('sidescroll-puzzle-respawn-edit');
  const puzzleRespawnTools = document.getElementById('sidescroll-puzzle-respawn-tools');
  const puzzleRespawnSetSpawnBtn = document.getElementById('sidescroll-puzzle-respawn-set-spawn');
  const puzzleRespawnToggleBtn = document.getElementById('sidescroll-puzzle-respawn-toggle');
  const puzzleRespawnLowerBtn = document.getElementById('sidescroll-puzzle-respawn-lower');
  const puzzleRespawnRaiseBtn = document.getElementById('sidescroll-puzzle-respawn-raise');
  const puzzleRespawnTriggerValue = document.getElementById('sidescroll-puzzle-respawn-trigger-value');
  const puzzleCartPathEditBtn = document.getElementById('sidescroll-puzzle-cart-path-edit');
  const puzzleCartPathTools = document.getElementById('sidescroll-puzzle-cart-path-tools');
  const puzzleCartPathToggleBtn = document.getElementById('sidescroll-puzzle-cart-path-toggle');
  const puzzleCartPathStartCartBtn = document.getElementById('sidescroll-puzzle-cart-path-start-cart');
  const puzzleCartPathDurationDownBtn = document.getElementById('sidescroll-puzzle-cart-path-duration-down');
  const puzzleCartPathDurationUpBtn = document.getElementById('sidescroll-puzzle-cart-path-duration-up');
  const puzzleCartPathDurationValue = document.getElementById('sidescroll-puzzle-cart-path-duration-value');
  const puzzleCartPathAngleDownBtn = document.getElementById('sidescroll-puzzle-cart-path-angle-down');
  const puzzleCartPathAngleZeroBtn = document.getElementById('sidescroll-puzzle-cart-path-angle-zero');
  const puzzleCartPathAngleUpBtn = document.getElementById('sidescroll-puzzle-cart-path-angle-up');
  const puzzleCartPathMatchPushBtn = document.getElementById('sidescroll-puzzle-cart-path-match-push');
  const puzzleCartPathAngleValue = document.getElementById('sidescroll-puzzle-cart-path-angle-value');
  const puzzleCartPathPreviewBtn = document.getElementById('sidescroll-puzzle-cart-path-preview');
  const puzzleCartPathScrub = document.getElementById('sidescroll-puzzle-cart-path-scrub');
  const puzzleCartPathPreviewTime = document.getElementById('sidescroll-puzzle-cart-path-preview-time');
  const puzzleCartPathSpeedStartDownBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-start-down');
  const puzzleCartPathSpeedStartUpBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-start-up');
  const puzzleCartPathSpeedStartValue = document.getElementById('sidescroll-puzzle-cart-path-speed-start-value');
  const puzzleCartPathSpeedMidDownBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-mid-down');
  const puzzleCartPathSpeedMidUpBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-mid-up');
  const puzzleCartPathSpeedMidValue = document.getElementById('sidescroll-puzzle-cart-path-speed-mid-value');
  const puzzleCartPathSpeedEndDownBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-end-down');
  const puzzleCartPathSpeedEndUpBtn = document.getElementById('sidescroll-puzzle-cart-path-speed-end-up');
  const puzzleCartPathSpeedEndValue = document.getElementById('sidescroll-puzzle-cart-path-speed-end-value');
  const puzzleEditLayerSwitch = document.getElementById('sidescroll-puzzle-edit-layer-switch');
  const puzzlePiecesLayerBtn = document.getElementById('sidescroll-puzzle-layer-pieces');
  const puzzleDressingLayerBtn = document.getElementById('sidescroll-puzzle-layer-dressing');
  const placementModeLabelEl = document.getElementById('sidescroll-placement-mode-label');
  const puzzleSaveUniqueBtn = document.getElementById('sidescroll-puzzle-save-unique');
  const puzzleTestBtn = document.getElementById('sidescroll-puzzle-test');
  const puzzleResetBtn = document.getElementById('sidescroll-puzzle-reset');
  const puzzleBackSetupBtn = document.getElementById('sidescroll-puzzle-back-setup');
  const editorAddBtn = document.getElementById('sidescroll-editor-add');
  const editorDuplicateBtn = document.getElementById('sidescroll-editor-duplicate');
  const editorFlipBtn = document.getElementById('sidescroll-editor-flip');
  const editorScaleDownBtn = document.getElementById('sidescroll-editor-scale-down');
  const editorScaleUpBtn = document.getElementById('sidescroll-editor-scale-up');
  const editorGroundLineBtn = document.getElementById('sidescroll-editor-ground-line');
  const editorTransformBtn = document.getElementById('sidescroll-editor-transform');
  const transformEditor = document.getElementById('sidescroll-transform-editor');
  const transformModeLabel = document.getElementById('sidescroll-transform-mode-label');
  const transformModeBtn = document.getElementById('sidescroll-transform-mode');
  const transformCloseBtn = document.getElementById('sidescroll-transform-close');
  const transformXInput = document.getElementById('sidescroll-transform-x');
  const transformYInput = document.getElementById('sidescroll-transform-y');
  const transformZInput = document.getElementById('sidescroll-transform-z');
  const transformStepInput = document.getElementById('sidescroll-transform-step');
  const transformXMinusBtn = document.getElementById('sidescroll-transform-x-minus');
  const transformXPlusBtn = document.getElementById('sidescroll-transform-x-plus');
  const transformYMinusBtn = document.getElementById('sidescroll-transform-y-minus');
  const transformYPlusBtn = document.getElementById('sidescroll-transform-y-plus');
  const transformZMinusBtn = document.getElementById('sidescroll-transform-z-minus');
  const transformZPlusBtn = document.getElementById('sidescroll-transform-z-plus');
  const transformFloorWalkBtn = document.getElementById('sidescroll-transform-floor-walk');
  const transformSupportWalkBtn = document.getElementById('sidescroll-transform-support-walk');
  const transformAlignSupportsBtn = document.getElementById('sidescroll-transform-align-supports');
  const transformHelpEl = document.getElementById('sidescroll-transform-help');
  const groundLineEditor = document.getElementById('sidescroll-ground-line-editor');
  const groundLineInput = document.getElementById('sidescroll-ground-line-input');
  const groundLineValueEl = document.getElementById('sidescroll-ground-line-value');
  const groundLineResetBtn = document.getElementById('sidescroll-ground-line-reset');
  const groundLineCloseBtn = document.getElementById('sidescroll-ground-line-close');
  const editorGameLayerBtn = document.getElementById('sidescroll-editor-game-layer');
  const editorCollisionBtn = document.getElementById('sidescroll-editor-collision');
  const editorCollisionShapeBtn = document.getElementById('sidescroll-editor-collision-shape');
  const editorCollisionAddShapeBtn = document.getElementById('sidescroll-editor-collision-add-shape');
  const editorCollisionRemoveShapeBtn = document.getElementById('sidescroll-editor-collision-remove-shape');
  const editorCollisionRemoveBtn = document.getElementById('sidescroll-editor-collision-remove');
  const editorCollisionSaveAssetBtn = document.getElementById('sidescroll-editor-collision-save-asset');
  const editorCollisionUseAssetBtn = document.getElementById('sidescroll-editor-collision-use-asset');
  const editorSocketBtn = document.getElementById('sidescroll-editor-socket');
  const editorSocketClearBtn = document.getElementById('sidescroll-editor-socket-clear');
  const editorDeleteBtn = document.getElementById('sidescroll-editor-delete');
  const editorUiElements = () => [puzzlePanel, editorPalette, editorControls, transformEditor, groundLineEditor, thoughtEditorEl, cameraNodeEditorEl, cameraEditorPanel, quickNavPanel, stageMenuPanel, soundPanel, sectionPanel, fogPanel, postPanel, inventoryPanel].filter(el => el && !el.hidden);

  function pointInsideElement(el, clientX, clientY) {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function pointInsideEditorUi(clientX, clientY) {
    return editorUiElements().some(el => pointInsideElement(el, clientX, clientY));
  }

  // Editor/menu controls activate on a deliberate tap: pointer down + release
  // without a drag. This keeps vertical scrolling safe on touch screens while
  // avoiding Safari's unreliable delayed synthetic-click path.
  function bindEditorPress(element, handler) {
    if (!element) return;
    const DRAG_CANCEL_PX = 10;
    let press = null;
    let suppressClickUntil = -Infinity;

    element.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (element.disabled) return;
      press = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cancelled: false
      };
      // Do not preventDefault here: a touch that turns into a drag must remain
      // available to the panel's native scrolling behaviour.
      event.stopPropagation();
    }, { passive:true });

    element.addEventListener('pointermove', event => {
      if (!press || event.pointerId !== press.id) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_CANCEL_PX) {
        press.cancelled = true;
      }
    }, { passive:true });

    element.addEventListener('pointerup', event => {
      if (!press || event.pointerId !== press.id) return;
      const current = press;
      press = null;
      if (current.cancelled || element.disabled) return;
      const r = element.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) return;
      suppressClickUntil = performance.now() + 800;
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }, { passive:false });

    element.addEventListener('pointercancel', event => {
      if (press && event.pointerId === press.id) press = null;
    }, { passive:true });

    element.addEventListener('click', event => {
      // Pointer-generated click normally follows pointerup, but iOS can cancel
      // that pointer sequence inside a scrolling panel and still emit a click.
      // Suppress true duplicates, otherwise let the native click be the fallback.
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (element.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    });
  }

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: true,
    depth: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    errorBox.hidden = false;
    errorBox.textContent = 'WebGL is unavailable on this device/browser.';
    return;
  }

  const VERT = `
    attribute vec3 aPosition;
    attribute vec2 aUV;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);
      vUV = aUV * uUvScale + uUvOffset;
      vDepth = max(0.0, -viewPos.z);
      gl_Position = uProjection * viewPos;
    }
  `;

  const FRAG = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec3 uTint;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uFogAmount;
    uniform float uFogCurve;
    uniform float uOpacity;
    uniform float uHighlight;
    uniform vec3 uHighlightColor;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec4 tex = texture2D(uTexture, vUV);
      float alpha = tex.a * uOpacity;
      if (alpha < 0.045) discard;
      float fogT = smoothstep(uFogNear, uFogFar, vDepth);
      float fog = pow(fogT, uFogCurve) * uFogAmount;
      vec3 base = tex.rgb * uTint;
      base = mix(base, uHighlightColor, clamp(uHighlight, 0.0, 1.0) * 0.72);
      vec3 rgb = mix(base, uFogColor, fog * (1.0 - uHighlight * 0.72));
      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    }
    return shader;
  }

  function createProgram(vertexSource = VERT, fragmentSource = FRAG) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    }
    return program;
  }

  const POST_VERT = `
    attribute vec2 aPosition;
    varying vec2 vUV;
    void main() {
      vUV = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const POST_FRAG = `
    precision mediump float;
    uniform sampler2D uScene;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uSaturation;
    uniform vec3 uTintColor;
    uniform float uTintAmount;
    varying vec2 vUV;
    void main() {
      vec3 rgb = texture2D(uScene, vUV).rgb;
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, uSaturation);
      rgb = (rgb - vec3(0.5)) * uContrast + vec3(0.5);
      rgb *= uBrightness;
      rgb = mix(rgb, rgb * uTintColor, uTintAmount);
      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
    }
  `;

  let program;
  let postProgram;
  try {
    program = createProgram();
    postProgram = createProgram(POST_VERT, POST_FRAG);
  } catch (err) {
    errorBox.hidden = false;
    errorBox.textContent = `WebGL setup failed: ${err.message}`;
    return;
  }

  const loc = {
    pos: gl.getAttribLocation(program, 'aPosition'),
    uv: gl.getAttribLocation(program, 'aUV'),
    model: gl.getUniformLocation(program, 'uModel'),
    view: gl.getUniformLocation(program, 'uView'),
    projection: gl.getUniformLocation(program, 'uProjection'),
    texture: gl.getUniformLocation(program, 'uTexture'),
    tint: gl.getUniformLocation(program, 'uTint'),
    fogColor: gl.getUniformLocation(program, 'uFogColor'),
    fogNear: gl.getUniformLocation(program, 'uFogNear'),
    fogFar: gl.getUniformLocation(program, 'uFogFar'),
    fogAmount: gl.getUniformLocation(program, 'uFogAmount'),
    fogCurve: gl.getUniformLocation(program, 'uFogCurve'),
    opacity: gl.getUniformLocation(program, 'uOpacity'),
    highlight: gl.getUniformLocation(program, 'uHighlight'),
    highlightColor: gl.getUniformLocation(program, 'uHighlightColor'),
    uvScale: gl.getUniformLocation(program, 'uUvScale'),
    uvOffset: gl.getUniformLocation(program, 'uUvOffset')
  };

  const postLoc = {
    pos: gl.getAttribLocation(postProgram, 'aPosition'),
    scene: gl.getUniformLocation(postProgram, 'uScene'),
    brightness: gl.getUniformLocation(postProgram, 'uBrightness'),
    contrast: gl.getUniformLocation(postProgram, 'uContrast'),
    saturation: gl.getUniformLocation(postProgram, 'uSaturation'),
    tintColor: gl.getUniformLocation(postProgram, 'uTintColor'),
    tintAmount: gl.getUniformLocation(postProgram, 'uTintAmount')
  };

  const postTriangleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, postTriangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
  ]), gl.STATIC_DRAW);

  const sceneFramebuffer = gl.createFramebuffer();
  const sceneColorTexture = gl.createTexture();
  const sceneDepthBuffer = gl.createRenderbuffer();
  let sceneTargetWidth = 0;
  let sceneTargetHeight = 0;

  function resizeSceneTarget(width, height) {
    if (sceneTargetWidth === width && sceneTargetHeight === height) return;
    sceneTargetWidth = width;
    sceneTargetHeight = height;

    gl.bindTexture(gl.TEXTURE_2D, sceneColorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneColorTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepthBuffer);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Post-process framebuffer incomplete: ${status}`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function presentSceneWithPost() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(postProgram);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);

    gl.bindBuffer(gl.ARRAY_BUFFER, postTriangleBuffer);
    gl.enableVertexAttribArray(postLoc.pos);
    gl.vertexAttribPointer(postLoc.pos, 2, gl.FLOAT, false, 8, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneColorTexture);
    gl.uniform1i(postLoc.scene, 0);
    gl.uniform1f(postLoc.brightness, postSettings.brightness);
    gl.uniform1f(postLoc.contrast, postSettings.contrast);
    gl.uniform1f(postLoc.saturation, postSettings.saturation);
    gl.uniform3f(postLoc.tintColor, postSettings.tintColor[0], postSettings.tintColor[1], postSettings.tintColor[2]);
    gl.uniform1f(postLoc.tintAmount, postSettings.tintAmount);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Attribute enable/disable state is global in WebGL, not program-local.
    // The post position attribute commonly shares index 0 with the scene
    // position attribute, so disabling it here blanked every later scene frame.
    gl.useProgram(program);
    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.uv);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  function createMesh(vertices, indices) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return { vbo, ibo, count: indices.length };
  }

  const billboardMesh = createMesh(
    new Float32Array([
      -0.5, 0.0, 0.0,  0.0, 0.0,
       0.5, 0.0, 0.0,  1.0, 0.0,
      -0.5, 1.0, 0.0,  0.0, 1.0,
       0.5, 1.0, 0.0,  1.0, 1.0
    ]),
    new Uint16Array([0,1,2,2,1,3])
  );

  // Most scene billboards are authored bottom-up because their world Y is a
  // ground/base position. Rotating mechanical parts such as cart wheels need
  // their local origin at the visual centre, otherwise mat4ModelRotated() makes
  // the whole texture orbit around its bottom edge instead of spinning on its axle.
  const centredBillboardMesh = createMesh(
    new Float32Array([
      -0.5,-0.5, 0.0,  0.0, 0.0,
       0.5,-0.5, 0.0,  1.0, 0.0,
      -0.5, 0.5, 0.0,  0.0, 1.0,
       0.5, 0.5, 0.0,  1.0, 1.0
    ]),
    new Uint16Array([0,1,2,2,1,3])
  );

  const groundMesh = createMesh(
    new Float32Array([
      -0.5, 0.0,  0.0, 0.0, 0.0,
       0.5, 0.0,  0.0, 1.0, 0.0,
      -0.5, 0.0, -1.0, 0.0, 1.0,
       0.5, 0.0, -1.0, 1.0, 1.0
    ]),
    new Uint16Array([0,1,2,2,1,3])
  );

  // Real path geometry. X runs along the level; Z is the top-down path width.
  // The cross-section keeps the low raised shoulders from v1.8.74, but the
  // whole strip now rolls gently up/down along X so it feels laid through real
  // woodland rather than extruded as a perfectly straight plank.
  const PATH_UNDULATION_A = 0.050;
  const PATH_UNDULATION_B = 0.024;
  function pathUndulationUnit(t) {
    const tau = Math.PI * 2;
    return Math.sin(t * tau * 2.0 + 0.55) * PATH_UNDULATION_A
         + Math.sin(t * tau * 5.0 - 0.80) * PATH_UNDULATION_B;
  }

  function createPathMesh(segments = 48) {
    const rows = [
      { z: 1.00, y: 0.00, v: 0.00 },
      { z: 0.82, y: 0.22, v: 0.12 },
      { z: 0.68, y: 0.12, v: 0.28 },
      { z:-0.68, y: 0.12, v: 0.72 },
      { z:-0.82, y: 0.22, v: 0.88 },
      { z:-1.00, y: 0.00, v: 1.00 }
    ];
    const vertices = [];
    const indices = [];
    for (let ix = 0; ix <= segments; ix++) {
      const t = ix / segments;
      const x = t - 0.5;
      const rise = pathUndulationUnit(t);
      for (const row of rows) {
        vertices.push(x, row.y + rise, row.z, t * 24.0, row.v * 1.8);
      }
    }
    const rowCount = rows.length;
    for (let ix = 0; ix < segments; ix++) {
      for (let iz = 0; iz < rowCount - 1; iz++) {
        const a = ix * rowCount + iz;
        const b = (ix + 1) * rowCount + iz;
        const c = a + 1;
        const d = b + 1;
        indices.push(a,b,c, c,b,d);
      }
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  const pathMesh = createPathMesh();
  const terrainSectionPathMeshCache = new Map();
  const terrainSectionGroundMeshCache = new Map();

  function testHillRiseAtLocalT(t) {
    const wave = Math.sin(Math.PI * Rig.clamp(t, 0, 1));
    return wave * wave * 0.82;
  }

  function createTerrainSectionPathMesh(sectionIndex, typeId = 'normal', segments = TERRAIN_LONGITUDINAL_SEGMENTS) {
    const rows = [
      { z: 1.00, y: 0.00, v: 0.00 },
      { z: 0.82, y: 0.22, v: 0.12 },
      { z: 0.68, y: 0.12, v: 0.28 },
      { z:-0.68, y: 0.12, v: 0.72 },
      { z:-0.82, y: 0.22, v: 0.88 },
      { z:-1.00, y: 0.00, v: 1.00 }
    ];
    const bounds = terrainSectionBounds(sectionIndex);
    const vertices = [];
    const indices = [];
    for (let ix = 0; ix <= segments; ix++) {
      const t = ix / segments;
      const worldX = Rig.lerp(bounds.minX, bounds.maxX, t);
      const localX = (worldX - bounds.center) / TERRAIN_SECTION_LENGTH;
      const featureRise = typeId === 'testHill' ? testHillRiseAtLocalT(t) : 0;
      const rise = pathUndulationAtX(worldX) + featureRise + terrainLayerElevationAt(worldX, 'path') + TERRAIN_VISUAL_LAYER_OFFSETS.path;
      const u = terrainSectionWorldU(worldX);
      for (const row of rows) vertices.push(localX, row.y + rise, row.z, u, row.v * 1.8);
    }
    const rowCount = rows.length;
    for (let ix = 0; ix < segments; ix++) {
      for (let iz = 0; iz < rowCount - 1; iz++) {
        const a = ix * rowCount + iz;
        const b = (ix + 1) * rowCount + iz;
        const c = a + 1;
        const d = b + 1;
        indices.push(a,b,c, c,b,d);
      }
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  function createTerrainBandMesh(sectionIndex, typeId, frontLayerId, backLayerId, minX, maxX, segments = TERRAIN_LONGITUDINAL_SEGMENTS) {
    const bounds = terrainSectionBounds(sectionIndex);
    const centre = (minX + maxX) * 0.5;
    const width = Math.max(0.001, maxX - minX);
    const vertices = [];
    const indices = [];
    for (let ix = 0; ix <= segments; ix++) {
      const t = ix / segments;
      const worldX = Rig.lerp(minX, maxX, t);
      const sectionT = Rig.clamp((worldX - bounds.minX) / TERRAIN_SECTION_LENGTH, 0, 1);
      const featureRise = typeId === 'testHill' ? testHillRiseAtLocalT(sectionT) : 0;
      const common = pathUndulationAtX(worldX) + featureRise;
      const frontY = common + terrainLayerElevationAt(worldX, frontLayerId) + (TERRAIN_VISUAL_LAYER_OFFSETS[frontLayerId] || 0);
      const backY = common + terrainLayerElevationAt(worldX, backLayerId) + (TERRAIN_VISUAL_LAYER_OFFSETS[backLayerId] || 0);
      const localX = (worldX - centre) / width;
      vertices.push(localX, frontY,  0.0, t, 0.0);
      vertices.push(localX, backY,  -1.0, t, 1.0);
    }
    for (let ix = 0; ix < segments; ix++) {
      const a = ix * 2;
      const b = a + 2;
      const c = a + 1;
      const d = b + 1;
      indices.push(a,b,c, c,b,d);
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  function terrainSectionPathMesh(sectionIndex, typeId = terrainSectionType(sectionIndex)) {
    const key = `${typeId}:${Math.trunc(sectionIndex)}`;
    if (!terrainSectionPathMeshCache.has(key)) terrainSectionPathMeshCache.set(key, createTerrainSectionPathMesh(sectionIndex, typeId));
    return terrainSectionPathMeshCache.get(key);
  }

  function terrainBandMesh(sectionIndex, typeId, frontLayerId, backLayerId, minX, maxX) {
    const key = `${Math.trunc(sectionIndex)}:${typeId}:${frontLayerId}:${backLayerId}:${minX.toFixed(3)}:${maxX.toFixed(3)}`;
    if (!terrainSectionGroundMeshCache.has(key)) {
      terrainSectionGroundMeshCache.set(key, createTerrainBandMesh(sectionIndex, typeId, frontLayerId, backLayerId, minX, maxX));
    }
    return terrainSectionGroundMeshCache.get(key);
  }

  const terrainRiverBankMeshCache = new Map();
  const terrainRiverWaterMeshCache = new Map();

  function terrainDirtWorldUv(x, z) {
    const u = terrainSectionWorldU(x);
    const v = ((GROUND_NEAR_Z - z) / Math.max(0.001, GROUND_NEAR_Z - WORLD.farZ)) * 11.0;
    return [u, v];
  }

  function riverBankCrossSection(sectionIndex, z, side, settingsOverride = null) {
    const p = riverProfileAtZ(sectionIndex, z, settingsOverride);
    const isLeft = side === 'left';
    const outerX = isLeft ? p.minX : p.maxX;
    const lipX = isLeft ? p.leftLip : p.rightLip;
    const toeX = isLeft ? p.leftToe : p.rightToe;
    const dir = isLeft ? 1 : -1;
    const approachX = lipX - dir * 0.56;
    const shoulderX = lipX + dir * 0.18;
    const lowerWallX = lipX + dir * (p.wallRun * 0.68);
    const centreX = p.centre;
    const outerY = pathGroundYAt(outerX, z);
    const approachY = pathGroundYAt(approachX, z);
    const lipY = pathGroundYAt(lipX, z);
    return [
      { x:outerX,    y:outerY,                         map:'top',  sv:0.00 },
      { x:approachX, y:approachY,                      map:'top',  sv:0.00 },
      { x:lipX,      y:lipY,                           map:'top',  sv:0.00 },
      { x:shoulderX, y:Rig.lerp(lipY, p.bedY, 0.16),  map:'wall', sv:0.20 },
      { x:lowerWallX,y:Rig.lerp(lipY, p.bedY, 0.73),  map:'wall', sv:0.88 },
      { x:toeX,      y:p.bedY,                         map:'wall', sv:1.24 },
      { x:centreX,   y:p.bedY,                         map:'bed',  sv:1.24 }
    ];
  }

  function createRiverBankMesh(sectionIndex, side, settingsOverride = null, zSegments = 30) {
    const b = terrainSectionBounds(sectionIndex);
    const vertices = [];
    const indices = [];
    const rows = [];
    for (let iz = 0; iz <= zSegments; iz++) {
      const t = iz / zSegments;
      const z = Rig.lerp(WORLD.farZ, GROUND_NEAR_Z, t);
      rows.push({ z, points:riverBankCrossSection(sectionIndex, z, side, settingsOverride) });
    }

    function pushVertex(point, z, bandKind) {
      let u, v;
      if (bandKind === 'wall') {
        u = (z - WORLD.farZ) * 0.205;
        v = point.sv * 1.22;
      } else {
        [u, v] = terrainDirtWorldUv(point.x, z);
      }
      vertices.push(point.x - b.center, point.y, z, u, v);
      return (vertices.length / 5) - 1;
    }

    for (let iz = 0; iz < zSegments; iz++) {
      const a = rows[iz];
      const bRow = rows[iz + 1];
      for (let band = 0; band < a.points.length - 1; band++) {
        const kind = (band >= 2 && band <= 4) ? 'wall' : (band === 5 ? 'bed' : 'top');
        const i0 = pushVertex(a.points[band], a.z, kind);
        const i1 = pushVertex(a.points[band + 1], a.z, kind);
        const i2 = pushVertex(bRow.points[band], bRow.z, kind);
        const i3 = pushVertex(bRow.points[band + 1], bRow.z, kind);
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  function createRiverWaterMesh(sectionIndex, settingsOverride = null, zSegments = 32, xSegments = 4) {
    const requestedWidth = riverSectionSettings(sectionIndex, settingsOverride).width;
    const waterXSegments = Math.max(xSegments, Math.ceil(requestedWidth / 0.9));
    const b = terrainSectionBounds(sectionIndex);
    const vertices = [];
    const indices = [];
    const rows = [];
    for (let iz = 0; iz <= zSegments; iz++) {
      const tz = iz / zSegments;
      const z = Rig.lerp(WORLD.farZ, GROUND_NEAR_Z, tz);
      const p = riverProfileAtZ(sectionIndex, z, settingsOverride);
      // Run the water slightly underneath each sloping bank so a wide river can
      // never expose a dry seam between the bank meshes and the water plane.
      const left = p.leftLip + p.wallRun * 0.30;
      const right = p.rightLip - p.wallRun * 0.30;
      const row = [];
      for (let ix = 0; ix <= waterXSegments; ix++) {
        const tx = ix / waterXSegments;
        const x = Rig.lerp(left, right, tx);
        // Keep the water mapping broad and low-frequency. The old 2.35 × 0.185
        // mapping repeated the same tile visibly across the river.
        const u = tx * 0.82;
        const v = (z - WORLD.farZ) * 0.032;
        vertices.push(x - b.center, p.waterY, z, u, v);
        row.push((vertices.length / 5) - 1);
      }
      rows.push(row);
    }
    for (let iz = 0; iz < zSegments; iz++) {
      for (let ix = 0; ix < waterXSegments; ix++) {
        const a = rows[iz][ix];
        const b0 = rows[iz + 1][ix];
        const c = rows[iz][ix + 1];
        const d = rows[iz + 1][ix + 1];
        indices.push(a, b0, c, c, b0, d);
      }
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  function riverMeshKey(sectionIndex, sideOrWater) {
    const settings = riverSectionSettings(sectionIndex);
    return `${Math.trunc(sectionIndex)}:${sideOrWater}:${settings.width.toFixed(2)}`;
  }

  function terrainRiverBankMesh(sectionIndex, side) {
    const key = riverMeshKey(sectionIndex, side);
    if (!terrainRiverBankMeshCache.has(key)) terrainRiverBankMeshCache.set(key, createRiverBankMesh(sectionIndex, side));
    return terrainRiverBankMeshCache.get(key);
  }

  function terrainRiverWaterMesh(sectionIndex) {
    const key = riverMeshKey(sectionIndex, 'water');
    if (!terrainRiverWaterMeshCache.has(key)) terrainRiverWaterMeshCache.set(key, createRiverWaterMesh(sectionIndex));
    return terrainRiverWaterMeshCache.get(key);
  }

  // v1.0.62 puzzle-owned world modifiers. River crossings are no longer forced
  // to occupy a pre-authored 10 m River section. A puzzle can carry a river
  // modifier relative to its marker, allowing the whole crossing to move or be
  // deleted as one portable gameplay unit.
  const puzzleRiverBankMeshCache = new Map();
  const puzzleRiverWaterMeshCache = new Map();
  const terrainIntervalPathMeshCache = new Map();
  const terrainIntervalGroundMeshCache = new Map();

  function disposeMeshBuffers(mesh) {
    if (!mesh) return;
    try { if (mesh.vbo) gl.deleteBuffer(mesh.vbo); } catch (_) {}
    try { if (mesh.ibo) gl.deleteBuffer(mesh.ibo); } catch (_) {}
  }

  function clearMeshCache(cache) {
    for (const mesh of cache.values()) disposeMeshBuffers(mesh);
    cache.clear();
  }

  function invalidatePuzzleWorldModifierMeshes() {
    puzzleWorldModifierCache = null;
    clearMeshCache(puzzleRiverBankMeshCache);
    clearMeshCache(puzzleRiverWaterMeshCache);
    clearMeshCache(terrainIntervalPathMeshCache);
    clearMeshCache(terrainIntervalGroundMeshCache);
  }

  function invalidateTerrainElevationMeshes() {
    clearMeshCache(terrainSectionPathMeshCache);
    clearMeshCache(terrainSectionGroundMeshCache);
    clearMeshCache(terrainRiverBankMeshCache);
    clearMeshCache(terrainRiverWaterMeshCache);
    clearMeshCache(terrainIntervalPathMeshCache);
    clearMeshCache(terrainIntervalGroundMeshCache);
    clearMeshCache(puzzleRiverBankMeshCache);
    clearMeshCache(puzzleRiverWaterMeshCache);
  }

  function puzzleRiverSettings(mod) {
    return {
      width: Rig.clamp(Number(mod?.width) || DEFAULT_RIVER_SECTION.width, RIVER_SECTION_MIN_WIDTH, RIVER_SECTION_MAX_WIDTH),
      bedDepth: Math.max(0.35, Number(mod?.bedDepth) || RIVER_BED_DEPTH),
      waterAboveBed: Rig.clamp(Number(mod?.waterAboveBed) || RIVER_WATER_ABOVE_BED, 0.04, 1.2),
      phase: Number.isFinite(Number(mod?.phase)) ? Number(mod.phase) : 0,
      bankMargin: Rig.clamp(Number(mod?.bankMargin) || 0.92, 0.45, 2.0)
    };
  }

  function puzzleRiverBankDressingSettings(mod) {
    const raw = mod?.bankDressing && typeof mod.bankDressing === 'object' ? mod.bankDressing : {};
    return {
      enabled: raw.enabled !== false,
      style: typeof raw.style === 'string' && raw.style ? raw.style : 'woodland',
      seed: (Number.isFinite(Number(raw.seed)) ? Number(raw.seed) : 1) >>> 0
    };
  }

  function puzzleRiverExtent(mod) {
    const settings = puzzleRiverSettings(mod);
    const base = Number(mod?.worldCenterX) || 0;
    // The old section river can meander by roughly 0.52 m and vary in width by
    // roughly 0.25 m. Reserve enough top-bank terrain around those extremes so
    // the clipped base terrain and the replacement river mesh can never gap.
    const half = (settings.width + 0.28) * 0.5 + 0.56 + settings.bankMargin;
    return { minX:base-half, maxX:base+half, centerX:base, half };
  }

  function puzzleRiverProfileAtZ(mod, z) {
    const settings = puzzleRiverSettings(mod);
    const phase = settings.phase;
    const rawMeander = Math.sin(z * 0.165 + phase) * 0.34 + Math.sin(z * 0.071 - phase * 1.37) * 0.18;
    const widthVariation = Math.sin(z * 0.245 - phase * 0.43) * 0.16 + Math.sin(z * 0.113 + phase) * 0.09;
    const width = Rig.clamp(settings.width + widthVariation, RIVER_SECTION_MIN_WIDTH - 0.25, RIVER_SECTION_MAX_WIDTH);
    const centre = (Number(mod?.worldCenterX) || 0) + rawMeander;
    const leftLip = centre - width * 0.5;
    const rightLip = centre + width * 0.5;
    const wallRun = Math.min(0.92, Math.max(0.68, width * 0.17));
    const leftToe = leftLip + wallRun;
    const rightToe = rightLip - wallRun;
    const bedY = pathGroundYAt(Number(mod?.worldCenterX) || 0, pathZ) - settings.bedDepth + Math.sin(z * 0.19 + phase * 0.6) * 0.035;
    const waterY = bedY + settings.waterAboveBed;
    return { ...puzzleRiverExtent(mod), width, centre, leftLip, rightLip, leftToe, rightToe, wallRun, bedY, waterY };
  }

  function puzzleRiverTerrainYAt(x, z, mod) {
    const p = puzzleRiverProfileAtZ(mod, z);
    const base = pathGroundYAt(x, z);
    if (x <= p.leftLip || x >= p.rightLip) return base;
    if (x >= p.leftToe && x <= p.rightToe) return p.bedY;
    if (x < p.leftToe) {
      const t = smoothTerrainStep((x - p.leftLip) / Math.max(0.001, p.leftToe - p.leftLip));
      return Rig.lerp(base, p.bedY, t);
    }
    const t = smoothTerrainStep((x - p.rightToe) / Math.max(0.001, p.rightLip - p.rightToe));
    return Rig.lerp(p.bedY, base, t);
  }

  function puzzleRiverModifiers() {
    if (!puzzleWorldModifiersReady) return [];
    return resolvedPuzzleWorldModifiers().filter(mod => mod?.type === 'river');
  }

  function puzzleRiverModifierAtPoint(x, z = pathZ) {
    if (!puzzleWorldModifiersReady) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const mod of puzzleRiverModifiers()) {
      const extent = puzzleRiverExtent(mod);
      if (x < extent.minX || x > extent.maxX) continue;
      const distance = Math.abs(x - (Number(mod.worldCenterX) || 0));
      if (distance < bestDistance) { best = mod; bestDistance = distance; }
    }
    return best;
  }

  function puzzleRiverModifiersIntersectingRange(minX, maxX) {
    return puzzleRiverModifiers().filter(mod => {
      const extent = puzzleRiverExtent(mod);
      return extent.maxX > minX + 0.0001 && extent.minX < maxX - 0.0001;
    });
  }

  function subtractRanges(baseMin, baseMax, cuts) {
    let ranges = [{ minX:baseMin, maxX:baseMax }];
    for (const cut of cuts) {
      const next = [];
      for (const range of ranges) {
        if (cut.maxX <= range.minX || cut.minX >= range.maxX) { next.push(range); continue; }
        if (cut.minX > range.minX + 0.002) next.push({ minX:range.minX, maxX:Math.min(cut.minX, range.maxX) });
        if (cut.maxX < range.maxX - 0.002) next.push({ minX:Math.max(cut.maxX, range.minX), maxX:range.maxX });
      }
      ranges = next;
    }
    return ranges.filter(range => range.maxX - range.minX > 0.01);
  }

  function terrainBaseIntervalsForSection(sectionIndex) {
    const bounds = terrainSectionBounds(sectionIndex);
    const cuts = puzzleRiverModifiersIntersectingRange(bounds.minX, bounds.maxX).map(puzzleRiverExtent);
    return subtractRanges(bounds.minX, bounds.maxX, cuts);
  }

  function createTerrainIntervalPathMesh(sectionIndex, typeId, minX, maxX, segments = null) {
    const rows = [
      { z: 1.00, y: 0.00, v: 0.00 }, { z: 0.82, y: 0.22, v: 0.12 },
      { z: 0.68, y: 0.12, v: 0.28 }, { z:-0.68, y: 0.12, v: 0.72 },
      { z:-0.82, y: 0.22, v: 0.88 }, { z:-1.00, y: 0.00, v: 1.00 }
    ];
    const bounds = terrainSectionBounds(sectionIndex);
    const centre = (minX + maxX) * 0.5;
    const width = Math.max(0.001, maxX - minX);
    segments = Math.max(4, Math.trunc(segments || Math.ceil(TERRAIN_LONGITUDINAL_SEGMENTS * width / TERRAIN_SECTION_LENGTH)));
    const vertices = [];
    const indices = [];
    for (let ix=0; ix<=segments; ix++) {
      const t = ix / segments;
      const worldX = Rig.lerp(minX, maxX, t);
      const sectionT = Rig.clamp((worldX - bounds.minX) / TERRAIN_SECTION_LENGTH, 0, 1);
      const featureRise = typeId === 'testHill' ? testHillRiseAtLocalT(sectionT) : 0;
      const rise = pathUndulationAtX(worldX) + featureRise + terrainLayerElevationAt(worldX, 'path') + TERRAIN_VISUAL_LAYER_OFFSETS.path;
      const localX = (worldX - centre) / width;
      const u = terrainSectionWorldU(worldX);
      for (const row of rows) vertices.push(localX, row.y + rise, row.z, u, row.v * 1.8);
    }
    const rowCount = rows.length;
    for (let ix=0; ix<segments; ix++) for (let iz=0; iz<rowCount-1; iz++) {
      const a=ix*rowCount+iz, b=(ix+1)*rowCount+iz, c=a+1, d=b+1;
      indices.push(a,b,c,c,b,d);
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  function createTerrainIntervalGroundMesh(sectionIndex, typeId, minX, maxX, segments = 8) {
    if (typeId === 'normal') return groundMesh;
    const bounds = terrainSectionBounds(sectionIndex);
    const centre = (minX + maxX) * 0.5;
    const width = Math.max(0.001, maxX - minX);
    const vertices=[];
    const indices=[];
    for (let ix=0; ix<=segments; ix++) {
      const t=ix/segments;
      const worldX=Rig.lerp(minX,maxX,t);
      const sectionT=Rig.clamp((worldX-bounds.minX)/TERRAIN_SECTION_LENGTH,0,1);
      const y=typeId==='testHill' ? testHillRiseAtLocalT(sectionT) : 0;
      const localX=(worldX-centre)/width;
      vertices.push(localX,y,0,t,0);
      vertices.push(localX,y,-1,t,1);
    }
    for(let ix=0;ix<segments;ix++){const a=ix*2,b=a+2,c=a+1,d=b+1;indices.push(a,b,c,c,b,d);}
    return createMesh(new Float32Array(vertices),new Uint16Array(indices));
  }

  function terrainIntervalMeshKey(sectionIndex, typeId, minX, maxX) {
    return `${sectionIndex}:${typeId}:${minX.toFixed(3)}:${maxX.toFixed(3)}`;
  }

  function terrainIntervalPathMesh(sectionIndex, typeId, minX, maxX) {
    const key=terrainIntervalMeshKey(sectionIndex,typeId,minX,maxX);
    if(!terrainIntervalPathMeshCache.has(key)) terrainIntervalPathMeshCache.set(key,createTerrainIntervalPathMesh(sectionIndex,typeId,minX,maxX));
    return terrainIntervalPathMeshCache.get(key);
  }

  function terrainIntervalGroundMesh(sectionIndex, typeId, minX, maxX) {
    if(typeId==='normal') return groundMesh;
    const key=terrainIntervalMeshKey(sectionIndex,typeId,minX,maxX);
    if(!terrainIntervalGroundMeshCache.has(key)) terrainIntervalGroundMeshCache.set(key,createTerrainIntervalGroundMesh(sectionIndex,typeId,minX,maxX));
    return terrainIntervalGroundMeshCache.get(key);
  }

  function puzzleRiverBankCrossSection(mod, z, side) {
    const p = puzzleRiverProfileAtZ(mod, z);
    const extent = puzzleRiverExtent(mod);
    const isLeft = side === 'left';
    const outerX = isLeft ? extent.minX : extent.maxX;
    const lipX = isLeft ? p.leftLip : p.rightLip;
    const toeX = isLeft ? p.leftToe : p.rightToe;
    const dir = isLeft ? 1 : -1;
    const approachX = lipX - dir * 0.56;
    const shoulderX = lipX + dir * 0.18;
    const lowerWallX = lipX + dir * (p.wallRun * 0.68);
    const centreX = p.centre;
    const outerY = pathGroundYAt(outerX, z);
    const approachY = pathGroundYAt(approachX, z);
    const lipY = pathGroundYAt(lipX, z);
    return [
      {x:outerX,y:outerY,map:'top',sv:0},{x:approachX,y:approachY,map:'top',sv:0},{x:lipX,y:lipY,map:'top',sv:0},
      {x:shoulderX,y:Rig.lerp(lipY,p.bedY,0.16),map:'wall',sv:0.20},{x:lowerWallX,y:Rig.lerp(lipY,p.bedY,0.73),map:'wall',sv:0.88},
      {x:toeX,y:p.bedY,map:'wall',sv:1.24},{x:centreX,y:p.bedY,map:'bed',sv:1.24}
    ];
  }

  function createPuzzleRiverBankMesh(mod, side, zSegments = 30) {
    const baseX = Number(mod.worldCenterX) || 0;
    const vertices=[],indices=[],rows=[];
    for(let iz=0;iz<=zSegments;iz++){const t=iz/zSegments;const z=Rig.lerp(WORLD.farZ,GROUND_NEAR_Z,t);rows.push({z,points:puzzleRiverBankCrossSection(mod,z,side)});}
    function pushVertex(point,z,bandKind){
      let u,v;
      if(bandKind==='wall'){u=(z-WORLD.farZ)*0.205;v=point.sv*1.22;}else{[u,v]=terrainDirtWorldUv(point.x,z);}
      vertices.push(point.x-baseX,point.y,z,u,v);return vertices.length/5-1;
    }
    for(let iz=0;iz<zSegments;iz++){const a=rows[iz],b=rows[iz+1];for(let band=0;band<a.points.length-1;band++){
      const kind=(band>=2&&band<=4)?'wall':(band===5?'bed':'top');
      const i0=pushVertex(a.points[band],a.z,kind),i1=pushVertex(a.points[band+1],a.z,kind),i2=pushVertex(b.points[band],b.z,kind),i3=pushVertex(b.points[band+1],b.z,kind);
      indices.push(i0,i2,i1,i1,i2,i3);
    }}
    return createMesh(new Float32Array(vertices),new Uint16Array(indices));
  }

  function createPuzzleRiverWaterMesh(mod, zSegments = 32, xSegments = 4) {
    const settings=puzzleRiverSettings(mod);
    const waterXSegments=Math.max(xSegments,Math.ceil(settings.width/0.9));
    const baseX=Number(mod.worldCenterX)||0;
    const vertices=[],indices=[],rows=[];
    for(let iz=0;iz<=zSegments;iz++){const tz=iz/zSegments,z=Rig.lerp(WORLD.farZ,GROUND_NEAR_Z,tz),p=puzzleRiverProfileAtZ(mod,z);const left=p.leftLip+p.wallRun*0.30,right=p.rightLip-p.wallRun*0.30,row=[];
      for(let ix=0;ix<=waterXSegments;ix++){const tx=ix/waterXSegments,x=Rig.lerp(left,right,tx),u=tx*0.82,v=(z-WORLD.farZ)*0.032;vertices.push(x-baseX,p.waterY,z,u,v);row.push(vertices.length/5-1);}rows.push(row);}
    for(let iz=0;iz<zSegments;iz++)for(let ix=0;ix<waterXSegments;ix++){const a=rows[iz][ix],b=rows[iz+1][ix],c=rows[iz][ix+1],d=rows[iz+1][ix+1];indices.push(a,b,c,c,b,d);}
    return createMesh(new Float32Array(vertices),new Uint16Array(indices));
  }

  function puzzleRiverMeshKey(mod, kind) {
    const s=puzzleRiverSettings(mod);
    return `${mod.markerId||'world'}:${mod.id||'river'}:${kind}:${Number(mod.worldCenterX||0).toFixed(3)}:${s.width.toFixed(2)}:${s.bedDepth.toFixed(2)}:${s.waterAboveBed.toFixed(2)}:${s.phase.toFixed(4)}:${s.bankMargin.toFixed(2)}`;
  }

  function puzzleRiverBankMesh(mod, side) {
    const key=puzzleRiverMeshKey(mod,side);
    if(!puzzleRiverBankMeshCache.has(key)) puzzleRiverBankMeshCache.set(key,createPuzzleRiverBankMesh(mod,side));
    return puzzleRiverBankMeshCache.get(key);
  }

  function puzzleRiverWaterMesh(mod) {
    const key=puzzleRiverMeshKey(mod,'water');
    if(!puzzleRiverWaterMeshCache.has(key)) puzzleRiverWaterMeshCache.set(key,createPuzzleRiverWaterMesh(mod));
    return puzzleRiverWaterMeshCache.get(key);
  }

  function createRigPartMesh(name) {
    const r = Rig.atlasRect(name);
    if (!r) return null;
    const p0x = r.a0[0] * r.w, p0y = r.a0[1] * r.h;
    const left = -p0x, right = r.w - p0x;
    const top = p0y, bottom = p0y - r.h;
    const u0 = r.x / Rig.ATLAS.width, u1 = (r.x + r.w) / Rig.ATLAS.width;
    // Image uploads use UNPACK_FLIP_Y_WEBGL so atlas row coordinates (which are
    // measured from the image top) must be converted into bottom-origin WebGL V.
    // The old mapping sampled the opposite atlas rows, which is why boots/head/
    // torso pieces appeared attached to the correct bones but showed the wrong art.
    const vTop = 1 - (r.y / Rig.ATLAS.height);
    const vBottom = 1 - ((r.y + r.h) / Rig.ATLAS.height);
    return createMesh(
      new Float32Array([
        left, bottom, 0, u0, vBottom,
        right, bottom, 0, u1, vBottom,
        left, top, 0, u0, vTop,
        right, top, 0, u1, vTop
      ]),
      new Uint16Array([0,1,2,2,1,3])
    );
  }

  const rigPartMeshes = {};
  Object.keys(Rig.ATLAS.parts).forEach(name => { rigPartMeshes[name] = createRigPartMesh(name); });

  function bindMesh(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 20, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  }

  gl.useProgram(program);
  gl.enableVertexAttribArray(loc.pos);
  gl.enableVertexAttribArray(loc.uv);
  gl.uniform1i(loc.texture, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearDepth(1);

  function mat4Identity() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  function mat4Model(x, y, z, sx, sy, sz, flipX = false) {
    const scaleX = flipX ? -sx : sx;
    return new Float32Array([
      scaleX, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      x, y, z, 1
    ]);
  }

  function mat4Model2D(x, y, z, scale, rotation, mirrorX = 1) {
    const c = Math.cos(rotation), s = Math.sin(rotation);
    const sx = scale * mirrorX, sy = scale;
    return new Float32Array([
      c*sx, s*sx, 0, 0,
      -s*sy, c*sy, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  }

  function mat4ModelRotated(x, y, z, sx, sy, sz, rotation = 0, flipX = false) {
    const c = Math.cos(rotation), s = Math.sin(rotation);
    const scaleX = flipX ? -sx : sx;
    return new Float32Array([
      c*scaleX, s*scaleX, 0, 0,
      -s*sy, c*sy, 0, 0,
      0, 0, sz, 0,
      x, y, z, 1
    ]);
  }

  function mat4Perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  function vec3Normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function vec3Cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function vec3Subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function mat4LookAt(eye, target, up) {
    const z = vec3Normalize(vec3Subtract(eye, target));
    const x = vec3Normalize(vec3Cross(up, z));
    const y = vec3Cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0]*eye[0] + x[1]*eye[1] + x[2]*eye[2]),
      -(y[0]*eye[0] + y[1]*eye[1] + y[2]*eye[2]),
      -(z[0]*eye[0] + z[1]*eye[1] + z[2]*eye[2]),
      1
    ]);
  }

  function createTexture(draw, w = 256, h = 512, repeat = false) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    return tex;
  }

  const textures = {};
  const assetAspect = {};

  function createImageTexture(url, label = 'image', fallbackUrl = null, aspectOverride = null) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const finishVisualLoad = beginVisualAssetLoad();
    const loadIntoTexture = src => {
      const image = new Image();
      image.onload = () => {
        assetAspect[label] = Number.isFinite(aspectOverride) ? aspectOverride : (image.naturalWidth / image.naturalHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        finishVisualLoad();
      };
      image.onerror = () => {
        if (fallbackUrl && src !== fallbackUrl) {
          loadIntoTexture(fallbackUrl);
          return;
        }
        if (!label.startsWith('ground')) {
          errorBox.hidden = false;
          errorBox.textContent = `${label} asset could not be loaded.`;
        }
        finishVisualLoad();
      };
      image.src = src;
    };

    loadIntoTexture(url);
    return tex;
  }

  function createProcessedImageTexture(url, label, process, aspectOverride = null) {
    const finishVisualLoad = beginVisualAssetLoad();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    loadImageSource(url).then(image => {
      const c = document.createElement('canvas');
      c.width = image.naturalWidth;
      c.height = image.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(image, 0, 0);
      process?.(ctx, c.width, c.height, image);
      assetAspect[label] = Number.isFinite(aspectOverride) ? aspectOverride : (c.width / c.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      finishVisualLoad();
    }).catch(() => {
      errorBox.hidden = false;
      errorBox.textContent = `${label} asset could not be loaded.`;
      finishVisualLoad();
    });
    return tex;
  }

  const imageSourceCache = new Map();
  function loadImageSource(url) {
    let entry = imageSourceCache.get(url);
    if (entry) return entry;
    entry = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    imageSourceCache.set(url, entry);
    return entry;
  }

  function createImageSliceTexture(url, rect, label = 'image-slice') {
    const finishVisualLoad = beginVisualAssetLoad();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    loadImageSource(url).then(image => {
      const sx = Math.max(0, Math.floor(rect.x || 0));
      const sy = Math.max(0, Math.floor(rect.y || 0));
      const sw = Math.max(1, Math.floor(rect.w || image.naturalWidth));
      const sh = Math.max(1, Math.floor(rect.h || image.naturalHeight));
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      assetAspect[label] = sw / sh;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      finishVisualLoad();
    }).catch(() => {
      errorBox.hidden = false;
      errorBox.textContent = `${label} asset could not be loaded.`;
      finishVisualLoad();
    });

    return tex;
  }

  textures.white = createTexture((ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }, 4, 4);

  function drawFallbackTerrainTexture(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#a58a68');
    grad.addColorStop(0.55, '#8e7355');
    grad.addColorStop(1, '#725a45');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    let seed = 19427;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 860; i++) {
      const x = random() * w;
      const y = random() * h;
      const r = 0.8 + random() * 2.8;
      ctx.globalAlpha = 0.04 + random() * 0.08;
      ctx.fillStyle = random() > 0.58 ? '#ccb08a' : '#564639';
      ctx.beginPath();
      ctx.ellipse(x, y, r * (1.2 + random()), r, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 170; i++) {
      const x = random() * w;
      const y = random() * h;
      const blade = 1.5 + random() * 4.0;
      ctx.globalAlpha = 0.05 + random() * 0.08;
      ctx.strokeStyle = random() > 0.5 ? '#6b7550' : '#7f8a61';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + blade * 0.5);
      ctx.lineTo(x + (-1 + random() * 2.0), y - blade);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function createRepeatingImageTexture(url, label = 'image', options = {}) {
    const finishVisualLoad = beginVisualAssetLoad();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const placeholderSize = options.placeholderSize || 256;
    const placeholder = document.createElement('canvas');
    placeholder.width = placeholderSize;
    placeholder.height = placeholderSize;
    const pctx = placeholder.getContext('2d');
    pctx.clearRect(0, 0, placeholder.width, placeholder.height);
    if (typeof options.placeholderDraw === 'function') {
      options.placeholderDraw(pctx, placeholder.width, placeholder.height);
    } else {
      pctx.fillStyle = options.placeholderColor || '#8e7355';
      pctx.fillRect(0, 0, placeholder.width, placeholder.height);
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholder);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    const loadIntoTexture = src => {
      const image = new Image();
      image.onload = () => {
        const potSize = options.potSize || 1024;
        const c = document.createElement('canvas');
        c.width = potSize;
        c.height = potSize;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, potSize, potSize);
        ctx.drawImage(image, 0, 0, potSize, potSize);
        assetAspect[label] = 1;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        finishVisualLoad();
      };
      image.onerror = () => {
        if (!label.startsWith('ground')) {
          errorBox.hidden = false;
          errorBox.textContent = `${label} asset could not be loaded.`;
        }
        finishVisualLoad();
      };
      image.src = src;
    };

    loadIntoTexture(url);
    return tex;
  }

  textures.pathDirt = createRepeatingImageTexture('terrain-dirt.png?v=1.0.62', 'terrain dirt texture', {
    placeholderDraw: drawFallbackTerrainTexture,
    potSize: 1024
  });

  // Broad, deliberately low-frequency water. The mesh supplies the river shape;
  // this texture is intentionally close to uniform so a repeating square is not
  // visible from the gameplay camera.
  textures.riverWater = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(82,132,132,0.80)');
    g.addColorStop(0.52, 'rgba(91,140,137,0.79)');
    g.addColorStop(1, 'rgba(75,124,129,0.81)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    let seed = 91357;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 18; i++) {
      const y = random() * h;
      const x = -w * 0.10 + random() * w * 0.85;
      const len = w * (0.28 + random() * 0.34);
      ctx.strokeStyle = `rgba(232,247,239,${(0.026 + random() * 0.038).toFixed(3)})`;
      ctx.lineWidth = 1.0 + random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + len * 0.30, y - 4, x + len * 0.72, y + 4, x + len, y);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const y = random() * h;
      const band = 20 + random() * 52;
      const bg = ctx.createLinearGradient(0, y - band, 0, y + band);
      bg.addColorStop(0, 'rgba(235,248,241,0)');
      bg.addColorStop(0.5, `rgba(235,248,241,${(0.018 + random() * 0.018).toFixed(3)})`);
      bg.addColorStop(1, 'rgba(235,248,241,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, y - band, w, band * 2);
    }
  }, 512, 512, true);

  // v1.0.90: keep the woodland trees as individual source/runtime textures.
  // This deliberately steps away from the old tree atlas while the art library
  // is still changing, so a single tree can be replaced without repacking an
  // atlas.  Atlas packing remains an optional optimisation later.
  const assetUv = {
    tree01: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree02: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree03: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree04: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree05: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree06: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree07: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    tree08: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground01: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground02: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground03: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground04: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground05: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground06: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground07: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground08: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground09: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground10: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground11: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground12: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
  };
  const assetDimensions = {
    tree01: [992, 1318],
    tree02: [992, 1318],
    tree03: [992, 1318],
    tree04: [992, 1318],
    tree05: [992, 1318],
    tree06: [992, 1318],
    tree07: [992, 1318],
    tree08: [992, 1318],
    ground01: [937, 603],
    ground02: [924, 485],
    ground03: [930, 602],
    ground04: [931, 514],
    ground05: [926, 531],
    ground06: [922, 483],
    ground07: [931, 418],
    ground08: [928, 442],
    ground09: [933, 511],
    ground10: [940, 484],
    ground11: [937, 361],
    ground12: [934, 480],
  };
  Object.entries(assetDimensions).forEach(([key, size]) => {
    assetAspect[key] = size[0] / size[1];
    const filename = key.startsWith('tree')
      ? `sidescroll-tree-${key.slice(4).padStart(2,'0')}.png?v=1.0.90`
      : `sidescroll-${key.replace('ground', 'ground-')}.png?v=1.0.62`;
    textures[key] = createImageTexture(filename,key,null,size[0]/size[1]);
  });

  // v1.0.6 bridge feature art. These are deliberately independent dressing
  // planes so a river/puzzle can choose its own span and position each abutment
  // separately. Generator alpha is retained in the PNGs; RGB was colour-dilated
  // under the transparent edge to avoid dark fringes during bilinear filtering.
  const bridgeAssetDimensions = {
    'bridge-left': [1383, 1065],
    'bridge-right': [1383, 1065]
  };
  Object.entries(bridgeAssetDimensions).forEach(([key, size]) => {
    assetAspect[key] = size[0] / size[1];
    textures[key] = createImageTexture(`${key}.png?v=1.0.62`, key, null, size[0] / size[1]);
  });

  // v1.0.67 mountain traversal prototype. This is deliberately a standalone
  // world asset rather than puzzle-pack art: it can be placed freely in the
  // environment, carries its own support collision, and exposes climbable sides.
  assetAspect['mountain-climb-rock-01'] = 1448 / 748;
  textures['mountain-climb-rock-01'] = createImageTexture(
    'mountain-climb-rock-01.png?v=1.0.93',
    'mountain-climb-rock-01',
    null,
    1448 / 748
  );


  // v1.0.83 mountain-location art test library. Keep these as individual
  // textures for visual/scale iteration; atlas packing comes after approval.
  const mountainAssetDimensions = {
    'mountain-cliff-01':[1448,822],
    'mountain-cliff-02':[1444,805],
    'mountain-cliff-03':[1442,759],
    'mountain-cliff-04':[1070,1224],
    'mountain-rock-01':[1414,399],
    'mountain-rock-02':[1384,527],
    'mountain-rock-03':[1359,725],
    'mountain-rock-04':[1441,557],
    'mountain-tree-01':[977,1163],
    'mountain-tree-02':[1043,1193],
    'mountain-grass-01':[1380,666],
    'mountain-grass-02':[1057,1115],
    'mountain-grass-03':[847,1288]
  };
  Object.entries(mountainAssetDimensions).forEach(([key,size]) => {
    assetAspect[key] = size[0] / size[1];
    textures[key] = createImageTexture(`${key}.png?v=1.0.83`, key, null, size[0] / size[1]);
  });


  // v1.0.100 settlement visual test library. These are deliberately Global / Unbound
  // manual-placement assets so the village composition can be judged before a
  // settlement biome/profile or default collision behaviour is introduced.
  const settlementAssetDimensions = {
    // v1.0.101 clean exports: native/clean alpha, tight crop, floor aligned.
    'settlement-house-01':[1121,858],
    'settlement-house-02':[1116,771],
    'settlement-house-03':[1120,663],
    'settlement-house-04':[934,1241],
    'settlement-house-05':[1119,1112],
    'settlement-house-06':[1077,1097],
    'settlement-roof-01':[1399,548],
    'settlement-roof-02':[1409,678],
    'settlement-roof-03':[1389,581],
    'settlement-roof-04':[1395,618],
    'settlement-fence-01':[1404,784],
    'settlement-fence-02':[1424,461],
    'settlement-fence-03':[1433,413],
    'settlement-wall-01':[1423,288],
    'settlement-wall-02':[1364,937],
    'settlement-wall-03':[1136,992],
  };
  Object.entries(settlementAssetDimensions).forEach(([key,size]) => {
    assetAspect[key] = size[0] / size[1];
    // Important: large visual assets are cache-first in sw.js, so changing art
    // under the same filename requires a new exact query URL.
    textures[key] = createImageTexture(`${key}.png?v=1.0.102`, key, null, size[0] / size[1]);
  });

  assetAspect['counterweight-plank'] = 1050 / 220;
  textures['counterweight-plank'] = createImageTexture(
    'counterweight-plank.png?v=1.0.62',
    'counterweight-plank',
    null,
    1050 / 220
  );

  // v1.0.46 handcart art. The body/chassis intentionally contains no wheels;
  // the wheel texture is rendered as separate runtime components so it remains
  // perfectly round and can rotate independently while the cart moves.
  assetAspect.handcart = 620 / 255;
  textures.handcart = createImageTexture('handcart-body.png?v=1.0.62', 'handcart', null, 620 / 255);
  assetAspect['handcart-wheel'] = 1;
  textures['handcart-wheel'] = createImageTexture('handcart-wheel.png?v=1.0.62', 'handcart-wheel', null, 1);
  assetAspect['handcart-broken'] = 620 / 255;
  textures['handcart-broken'] = textures.handcart;
  assetAspect['cart-wheel-loose'] = 1;
  textures['cart-wheel-loose'] = textures['handcart-wheel'];
  assetAspect['cart-wheel-ready'] = 1;
  textures['cart-wheel-ready'] = textures['handcart-wheel'];
  assetAspect['axle-pin'] = 2;
  textures['axle-pin'] = createImageTexture('axle-pin.png?v=1.0.62', 'axle-pin', null, 2);

  // Editor-only puzzle Thought Trigger. It is visible while authoring but
  // suppressed completely during play. Its activation radius is drawn in the
  // editor overlay, so the marker itself can stay compact.
  assetAspect['thought-trigger'] = 1;
  textures['thought-trigger'] = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w * 0.5, h * 0.5);
    ctx.fillStyle = 'rgba(72,221,201,.20)';
    ctx.beginPath(); ctx.arc(0,0,w*.42,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#79f1df'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0,0,w*.31,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#eafffb';
    ctx.beginPath(); ctx.arc(0,0,w*.095,0,Math.PI*2); ctx.fill();
    ctx.font = `900 ${Math.round(w*.22)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('T',0,1);
  }, 256, 256, false);

  // Editor-only world Camera Node. It remains invisible during play and only
  // contributes a render-space camera offset while the player is inside its
  // authored radius. Keeping it out of gameplay transforms means it can never
  // move the player/collision root by accident.
  assetAspect['camera-trigger'] = 1;
  textures['camera-trigger'] = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w * 0.5, h * 0.5);
    ctx.fillStyle = 'rgba(162,145,244,.20)';
    ctx.beginPath(); ctx.arc(0,0,w*.42,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#b8abff'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0,0,w*.31,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#f4f0ff'; ctx.beginPath(); ctx.arc(0,0,w*.095,0,Math.PI*2); ctx.fill();
    ctx.font = `900 ${Math.round(w*.22)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('C',0,1);
  }, 256, 256, false);

  // Gameplay asset: a deliberately simple, readable wooden crate.  It is
  // generated in code so it has no extra file dependency and can be used as
  // the first editor-authored platform/obstacle.
  assetAspect.crate = 1.08;
  textures.crate = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // Fill the texture right down to the billboard baseline.  The previous
    // crate art had transparent padding beneath it, so the geometry was on the
    // path while the visible box appeared to float above it.
    const x = 18, y = 10, cw = 220, ch = 246;
    const topDepth = 20;
    ctx.fillStyle = '#a97b4e';
    ctx.beginPath(); ctx.moveTo(x, y + topDepth); ctx.lineTo(x + 24, y); ctx.lineTo(x + cw, y); ctx.lineTo(x + cw - 22, y + topDepth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#775339';
    ctx.beginPath(); ctx.moveTo(x + cw - 22, y + topDepth); ctx.lineTo(x + cw, y); ctx.lineTo(x + cw, y + ch - 8); ctx.lineTo(x + cw - 22, y + ch); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(x, y + topDepth, x, y + ch);
    g.addColorStop(0, '#b78654'); g.addColorStop(1, '#8b5f3d');
    ctx.fillStyle = g; ctx.fillRect(x, y + topDepth, cw - 22, ch - topDepth);
    ctx.strokeStyle = '#5d402e'; ctx.lineWidth = 8; ctx.strokeRect(x + 4, y + topDepth + 4, cw - 32, ch - topDepth - 8);
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x + 12, y + topDepth + 12); ctx.lineTo(x + cw - 36, y + ch - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + cw - 36, y + topDepth + 12); ctx.lineTo(x + 12, y + ch - 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,198,143,.42)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 12, y + topDepth + 15); ctx.lineTo(x + cw - 38, y + topDepth + 15); ctx.stroke();
    for (let i=0;i<7;i++) {
      ctx.strokeStyle = `rgba(77,49,32,${0.12 + i*0.012})`; ctx.lineWidth = 2;
      const yy = y + topDepth + 32 + i * 27; ctx.beginPath(); ctx.moveTo(x + 16, yy); ctx.lineTo(x + cw - 42, yy + (i%2?2:-2)); ctx.stroke();
    }
  }, 256, 256, false);

  // v0.2.31 completion reward prototype. Keep this procedural so the reward
  // system adds no new asset file: later we can simply swap this texture for
  // authored art without changing collection/inventory logic.
  assetAspect['forest-key'] = 1.18;
  textures['forest-key'] = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.48, h * 0.48, 6, w * 0.48, h * 0.48, w * 0.44);
    glow.addColorStop(0, 'rgba(239,220,159,.34)');
    glow.addColorStop(1, 'rgba(239,220,159,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#c9ad69';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.42, w * 0.13, 0, Math.PI * 2);
    ctx.moveTo(w * 0.44, h * 0.50);
    ctx.lineTo(w * 0.76, h * 0.72);
    ctx.lineTo(w * 0.82, h * 0.64);
    ctx.moveTo(w * 0.67, h * 0.66);
    ctx.lineTo(w * 0.74, h * 0.57);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,244,202,.60)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.42, w * 0.10, Math.PI * 1.05, Math.PI * 1.92);
    ctx.stroke();
  }, 256, 256, false);

  assetAspect.softShadow = 2.4;
  textures.softShadow = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.58, 10, w * 0.5, h * 0.58, w * 0.42);
    g.addColorStop(0, 'rgba(22,18,16,.58)');
    g.addColorStop(0.55, 'rgba(22,18,16,.34)');
    g.addColorStop(1, 'rgba(22,18,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.58, w * 0.42, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }, 256, 128, true);


  // -------------------------------------------------------------------------
  // PUZZLE ASSET PACKS
  // -------------------------------------------------------------------------
  // Puzzle definitions live in puzzle-groups.js.  Their art is resolved through
  // named packs so the authored layout never has to know whether an asset is a
  // temporary generated texture or, later, a rectangle in a finished atlas.
  const puzzleConfig = window.SideScrollPuzzleConfig || { assetPacks:{}, groups:{}, markers:[], streaming:{} };
  const puzzlePackRuntime = new Map();

  function drawPuzzleGeneratedAsset(ctx, w, h, generator) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const crate = (base, edge, brace, variant = 0) => {
      const x=18, y=14, cw=w-36, ch=h-20;
      const g=ctx.createLinearGradient(0,y,0,y+ch);
      g.addColorStop(0, base); g.addColorStop(1, edge);
      ctx.fillStyle=g; ctx.fillRect(x,y,cw,ch);
      ctx.strokeStyle='#4b3a2d'; ctx.lineWidth=8; ctx.strokeRect(x+4,y+4,cw-8,ch-8);
      ctx.strokeStyle=brace; ctx.lineWidth=11;
      if (variant !== 2) { ctx.beginPath();ctx.moveTo(x+14,y+16);ctx.lineTo(x+cw-14,y+ch-16);ctx.stroke(); }
      if (variant !== 1) { ctx.beginPath();ctx.moveTo(x+cw-14,y+16);ctx.lineTo(x+14,y+ch-16);ctx.stroke(); }
      ctx.strokeStyle='rgba(244,220,179,.32)';ctx.lineWidth=2;
      for(let i=0;i<5;i++){const yy=y+32+i*36;ctx.beginPath();ctx.moveTo(x+14,yy);ctx.lineTo(x+cw-14,yy+(i%2?2:-2));ctx.stroke();}
    };

    if (generator === 'crateA') return crate('#aa7c4b','#815737','#5d412d',0);
    if (generator === 'crateB') return crate('#9c7249','#755137','#553d2f',1);
    if (generator === 'crateC') return crate('#b18452','#855c39','#65462f',2);

    if (generator === 'fallenTree') {
      // Intentionally chunky greybox silhouette: large root plate + crooked
      // trunk.  Its height matches the collision so climb testing is honest.
      ctx.strokeStyle='#46372c'; ctx.lineWidth=42;
      ctx.beginPath(); ctx.moveTo(36,h-30); ctx.bezierCurveTo(72,h-98,138,h-132,w-30,44); ctx.stroke();
      ctx.strokeStyle='#745238'; ctx.lineWidth=31;
      ctx.beginPath(); ctx.moveTo(38,h-32); ctx.bezierCurveTo(74,h-96,140,h-128,w-31,45); ctx.stroke();
      ctx.strokeStyle='rgba(215,184,139,.30)';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(64,h-72);ctx.bezierCurveTo(105,h-103,151,h-128,w-52,63);ctx.stroke();
      ctx.fillStyle='#5a4635';
      for (let i=0;i<7;i++) {
        const a=-1.2+i*.39, rx=36+Math.cos(a)*45, ry=h-37+Math.sin(a)*42;
        ctx.beginPath();ctx.moveTo(43,h-40);ctx.lineTo(rx,ry);ctx.lineTo(rx+9,ry-8);ctx.closePath();ctx.fill();
      }
      ctx.strokeStyle='#5d432e';ctx.lineWidth=15;
      ctx.beginPath();ctx.moveTo(w*.57,h*.46);ctx.lineTo(w*.48,h*.23);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.72,h*.32);ctx.lineTo(w*.82,h*.14);ctx.stroke();
      return;
    }

    if (generator === 'logShort' || generator === 'logLong') {
      const yy=h*.58, x0=18, x1=w-18;
      ctx.strokeStyle='#49372b';ctx.lineWidth=h*.45;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy-h*.08);ctx.stroke();
      ctx.strokeStyle='#76533a';ctx.lineWidth=h*.34;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy-h*.08);ctx.stroke();
      ctx.fillStyle='#9c7857';ctx.beginPath();ctx.ellipse(x1,yy-h*.08,h*.15,h*.20,-.05,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(226,200,161,.32)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+20,yy-5);ctx.lineTo(x1-26,yy-h*.08-5);ctx.stroke();
      return;
    }

    if (generator === 'barrel') {
      const x=w*.20,y=h*.07,bw=w*.60,bh=h*.88;
      const g=ctx.createLinearGradient(x,0,x+bw,0);g.addColorStop(0,'#694934');g.addColorStop(.5,'#a7774b');g.addColorStop(1,'#60432f');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(w*.5,y+bw*.08,bw*.5,bw*.12,0,Math.PI,Math.PI*2);ctx.rect(x,y+bw*.08,bw,bh-bw*.16);ctx.ellipse(w*.5,y+bh-bw*.08,bw*.5,bw*.12,0,0,Math.PI);ctx.fill();
      ctx.strokeStyle='#3f4240';ctx.lineWidth=8;for(const q of [.22,.72]){const yy=y+bh*q;ctx.beginPath();ctx.moveTo(x-3,yy);ctx.lineTo(x+bw+3,yy);ctx.stroke();}
      return;
    }
  }

  function ensurePuzzleAssetPack(packName) {
    const pack = puzzleConfig.assetPacks?.[packName];
    if (!pack) return;
    let runtime = puzzlePackRuntime.get(packName);
    if (!runtime) {
      runtime = { refs:0, created:[] };
      for (const asset of pack.assets || []) {
        if (!textures[asset.name]) {
          if (asset.url) {
            textures[asset.name] = createImageTexture(asset.url, asset.name, null, asset.aspect || null);
            if (asset.aspect) assetAspect[asset.name] = asset.aspect;
          } else if (pack.image && asset.slice) {
            textures[asset.name] = createImageSliceTexture(pack.image, asset.slice, asset.name);
            assetAspect[asset.name] = asset.aspect || ((asset.slice?.w || 1) / Math.max(1, (asset.slice?.h || 1)));
          } else {
            textures[asset.name] = createTexture((ctx,w,h) => drawPuzzleGeneratedAsset(ctx,w,h,asset.generator), 256, 256, false);
            assetAspect[asset.name] = asset.aspect || 1;
          }
          runtime.created.push(asset.name);
        }
      }
      puzzlePackRuntime.set(packName, runtime);
    }
    runtime.refs += 1;
  }

  function releasePuzzleAssetPack(packName) {
    const runtime = puzzlePackRuntime.get(packName);
    if (!runtime) return;
    // Puzzle packs are deliberately resident for the lifetime of the page.
    // Seven small authored textures are cheaper than risking stale WebGL
    // handles when editor/test streaming rapidly unloads and reloads a group.
    runtime.refs = Math.max(0, runtime.refs - 1);
  }


const availableCharacterVariants = Rig.CHARACTER_VARIANTS ? Object.keys(Rig.CHARACTER_VARIANTS) : [Rig.DEFAULT_CHARACTER_VARIANT || 'original'];
const RIG_TEXTURE_VERSION = '1.0.62';
let currentCharacterVariant = Rig.loadCharacterVariant ? Rig.loadCharacterVariant() : (Rig.DEFAULT_CHARACTER_VARIANT || 'original');

function rigVariantTextureKey(id) {
  return `rigAtlas_${id}`;
}

function rigVariantUrl(id) {
  const src = Rig.atlasImageUrl ? Rig.atlasImageUrl(id) : (Rig.ATLAS.fileUrl || Rig.ATLAS.url);
  return src.includes('?') ? src : `${src}?v=${RIG_TEXTURE_VERSION}`;
}

function updateCharacterSwapButton() {
  if (!characterSwapBtn) return;
  const info = Rig.characterVariantInfo ? Rig.characterVariantInfo(currentCharacterVariant) : null;
  // The player menu is deliberately tiny: this is an action, not an editor
  // status readout. Keep the current hero in the accessible label instead.
  characterSwapBtn.textContent = PLAYER_MODE ? 'Change character' : (info?.label || 'Character');
  characterSwapBtn.setAttribute('aria-pressed', currentCharacterVariant !== (Rig.DEFAULT_CHARACTER_VARIANT || 'original') ? 'true' : 'false');
  characterSwapBtn.setAttribute('aria-label', `Change character · current ${info?.label || currentCharacterVariant}`);
}

function applyCharacterVariant(id, announce = false) {
  const desired = Rig.saveCharacterVariant ? Rig.saveCharacterVariant(id) : id;
  currentCharacterVariant = Rig.normaliseCharacterVariant ? Rig.normaliseCharacterVariant(desired) : desired;
  textures.rigAtlas = textures[rigVariantTextureKey(currentCharacterVariant)] || textures[rigVariantTextureKey(Rig.DEFAULT_CHARACTER_VARIANT || 'original')] || textures.rigAtlas;
  updateCharacterSwapButton();
  if (announce && hintEl) {
    const info = Rig.characterVariantInfo ? Rig.characterVariantInfo(currentCharacterVariant) : null;
    hintEl.textContent = `Character swapped to ${info?.label || currentCharacterVariant}`;
  }
}

function toggleCharacterVariant() {
  if (!availableCharacterVariants.length) return;
  const idx = Math.max(0, availableCharacterVariants.indexOf(currentCharacterVariant));
  applyCharacterVariant(availableCharacterVariants[(idx + 1) % availableCharacterVariants.length], true);
}

availableCharacterVariants.forEach(id => {
  textures[rigVariantTextureKey(id)] = createImageTexture(rigVariantUrl(id), `Walk Lab cutout rig atlas ${id}`);
});
textures.rigAtlas = textures[rigVariantTextureKey(Rig.DEFAULT_CHARACTER_VARIANT || 'original')];
applyCharacterVariant(currentCharacterVariant, false);
if (characterSwapBtn) characterSwapBtn.addEventListener('click', () => { toggleCharacterVariant(); setStageMenuOpen(false); });


  function mulberry32(seed) {
    return function() {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(924315);
  const TILE = { minX: -62, maxX: 62 };
  const TILE_WIDTH = TILE.maxX - TILE.minX;

  // v1.0.2 terrain-section foundation. Sections are fixed in world space rather
  // than being children of the old 124 m scenery repeat. Normal sections are
  // visually identical; later versions can replace individual section geometry.
  const TERRAIN_SECTION_LENGTH = 10;
  const TERRAIN_SECTION_HALF = TERRAIN_SECTION_LENGTH * 0.5;
  const TERRAIN_SECTION_RENDER_RADIUS = 9;
  const TERRAIN_SECTION_PATH_PHASE_COUNT = 62; // 62 × 10 m = 620 m = 5 × old 124 m terrain periods.
  const TERRAIN_SECTION_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.terrain-sections.v1' : 'sidescroll.terrain-sections.v1';
  const TERRAIN_SECTION_TYPES = {
    normal:{ id:'normal', label:'Normal' },
    testHill:{ id:'testHill', label:'Test Hill' },
    river:{ id:'river', label:'River' }
  };
  const DEFAULT_RIVER_SECTION = Object.freeze({ width:4.8 });
  const RIVER_SECTION_MIN_WIDTH = 3.4;
  const RIVER_SECTION_MAX_WIDTH = 8.8;
  // Keep the water visibly below the path so a river reads as a real obstacle
  // rather than a shallow strip. The playable terrain still follows the bank/bed.
  const RIVER_BED_DEPTH = 1.92;
  const RIVER_WATER_ABOVE_BED = 0.28;
  let terrainSectionGuidesVisible = false;
  let terrainSectionGuidesPersist = false;
  let terrainSelectedSectionIndex = 0;
  let terrainHiddenSections = new Set();
  let terrainCollisionDisabledSections = new Set();
  let terrainSectionTypes = new Map();
  let terrainSectionSettings = new Map();
  let terrainSectionHeights = new Map();
  let terrainDepthLayerSettings = {};
  let terrainResolvedHeightCache = new Map();
  let terrainHeightLinkSubsequent = true;
  let terrainLastUiCurrentIndex = null;

  // v1.0.75 terrain elevation spine. The path is the authored master profile.
  // Near/Far layers are derived from it for now; World Lab exposes them as
  // separate tracks so they can later gain per-layer overrides without changing
  // the authored path data model.
  const TERRAIN_DEPTH_LAYERS = Object.freeze({
    path:{ id:'path', label:'Path', follow:1.00, radius:0 },
    near:{ id:'near', label:'Near Strip', follow:1.00, radius:0 },
    farA:{ id:'farA', label:'Far Strip A', follow:0.88, radius:1 },
    farB:{ id:'farB', label:'Far Strip B', follow:0.62, radius:2 }
  });
  // Tiny render-only vertical staggering plus a small depth overlap keeps
  // neighbouring terrain bands tucked under the path instead of exposing a
  // hairline seam as the camera tilts across the ground plane. Gameplay and
  // collision continue to use the mathematical terrain profile with no offset.
  const TERRAIN_VISUAL_LAYER_OFFSETS = Object.freeze({ near:0.025, path:0.00, farA:-0.02, farB:-0.04 });
  const TERRAIN_GROUND_BAND_Y_OFFSET = -0.015;
  const TERRAIN_PATH_BAND_OVERLAP = 0.12;
  const TERRAIN_LONGITUDINAL_SEGMENTS = 32;
  const TERRAIN_DEPTH_LAYER_IDS = Object.freeze(['near','farA','farB']);
  const TERRAIN_FAR_A_BACK_Z = -13.0;

  function normaliseTerrainDepthLayerSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    for (const id of TERRAIN_DEPTH_LAYER_IDS) {
      const item = source[id] && typeof source[id] === 'object' ? source[id] : {};
      out[id] = {
        offsets:item.offsets && typeof item.offsets === 'object' ? { ...item.offsets } : {},
        modes:item.modes && typeof item.modes === 'object' ? { ...item.modes } : {},
        heights:item.heights && typeof item.heights === 'object' ? { ...item.heights } : {}
      };
    }
    return out;
  }

  function terrainSparseNumberAt(map, index, fallback = 0, min = -80, max = 80) {
    const target = Math.trunc(Number(index) || 0);
    let best = -Infinity, value = fallback;
    for (const [rawKey, rawValue] of Object.entries(map || {})) {
      const key = Math.trunc(Number(rawKey));
      const next = Number(rawValue);
      if (Number.isFinite(key) && Number.isFinite(next) && key <= target && key > best) {
        best = key;
        value = Rig.clamp(next, min, max);
      }
    }
    return value;
  }

  function terrainLayerModeInfo(index, layerId) {
    const target = Math.trunc(Number(index) || 0);
    const settings = terrainDepthLayerSettings?.[layerId] || {};
    let best = -Infinity, mode = 'derived';
    for (const [rawKey, rawMode] of Object.entries(settings.modes || {})) {
      const key = Math.trunc(Number(rawKey));
      if (!Number.isFinite(key) || key > target || key <= best) continue;
      best = key;
      mode = rawMode === 'explicit' ? 'explicit' : 'derived';
    }
    return { mode, startIndex:best };
  }

  function terrainLayerOffsetAt(index, layerId) {
    return terrainSparseNumberAt(terrainDepthLayerSettings?.[layerId]?.offsets, index, 0, -40, 40);
  }

  function terrainLayerDerivedSectionHeight(index, layerId) {
    const layer = TERRAIN_DEPTH_LAYERS[layerId] || TERRAIN_DEPTH_LAYERS.path;
    if (layer.id === 'path') return terrainSectionPathHeight(index);
    let weighted = 0;
    let weightTotal = 0;
    const radius = Math.max(0, Math.trunc(layer.radius || 0));
    for (let d = -radius; d <= radius; d += 1) {
      const weight = radius ? (radius + 1 - Math.abs(d)) : 1;
      weighted += terrainSectionPathHeight(index + d) * weight;
      weightTotal += weight;
    }
    const base = (weightTotal ? weighted / weightTotal : terrainSectionPathHeight(index)) * (Number(layer.follow) || 1);
    return base + terrainLayerOffsetAt(index, layerId);
  }

  function terrainLayerExplicitSectionHeight(index, layerId, modeStart) {
    const settings = terrainDepthLayerSettings?.[layerId] || {};
    const target = Math.trunc(Number(index) || 0);
    let best = -Infinity, value = null;
    for (const [rawKey, rawValue] of Object.entries(settings.heights || {})) {
      const key = Math.trunc(Number(rawKey));
      const next = Number(rawValue);
      if (!Number.isFinite(key) || !Number.isFinite(next) || key < modeStart || key > target || key <= best) continue;
      best = key;
      value = Rig.clamp(next, -80, 100);
    }
    if (value !== null) return value;
    return terrainLayerDerivedSectionHeight(Number.isFinite(modeStart) ? modeStart : target, layerId);
  }

  function setTerrainLayerMode(index, layerId, mode, { save = true } = {}) {
    if (!TERRAIN_DEPTH_LAYER_IDS.includes(layerId)) return false;
    const i = Math.trunc(Number(index) || 0);
    terrainDepthLayerSettings = normaliseTerrainDepthLayerSettings(terrainDepthLayerSettings);
    const currentHeight = terrainLayerSectionHeight(i, layerId);
    const layer = terrainDepthLayerSettings[layerId];
    layer.modes[String(i)] = mode === 'explicit' ? 'explicit' : 'derived';
    if (mode === 'explicit' && !Object.prototype.hasOwnProperty.call(layer.heights, String(i))) layer.heights[String(i)] = Number(currentHeight.toFixed(3));
    invalidateTerrainHeightCache();
    invalidateTerrainElevationMeshes();
    if (save) saveTerrainSectionState();
    return true;
  }

  function setTerrainLayerOffset(index, layerId, offset, { save = true } = {}) {
    if (!TERRAIN_DEPTH_LAYER_IDS.includes(layerId)) return false;
    const i = Math.trunc(Number(index) || 0);
    terrainDepthLayerSettings = normaliseTerrainDepthLayerSettings(terrainDepthLayerSettings);
    terrainDepthLayerSettings[layerId].offsets[String(i)] = Number(Rig.clamp(Number(offset) || 0, -40, 40).toFixed(3));
    invalidateTerrainHeightCache();
    invalidateTerrainElevationMeshes();
    if (save) saveTerrainSectionState();
    return true;
  }

  function setTerrainLayerExplicitHeight(index, layerId, height, { save = true } = {}) {
    if (!TERRAIN_DEPTH_LAYER_IDS.includes(layerId)) return false;
    const i = Math.trunc(Number(index) || 0);
    terrainDepthLayerSettings = normaliseTerrainDepthLayerSettings(terrainDepthLayerSettings);
    const layer = terrainDepthLayerSettings[layerId];
    layer.modes[String(i)] = 'explicit';
    layer.heights[String(i)] = Number(Rig.clamp(Number(height) || 0, -80, 100).toFixed(3));
    invalidateTerrainHeightCache();
    invalidateTerrainElevationMeshes();
    if (save) saveTerrainSectionState();
    return true;
  }


  // Puzzle-owned world modifiers are resolved later, after the puzzle library
  // has loaded. Terrain helpers run during initial scene construction, so they
  // must be able to operate safely before that data is ready.
  let puzzleWorldModifiersReady = false;
  let puzzleWorldModifierCache = null;

  function terrainSectionIndexAt(x) {
    return Math.floor((Number(x) + TERRAIN_SECTION_HALF) / TERRAIN_SECTION_LENGTH);
  }

  function terrainSectionBounds(index) {
    const i = Math.trunc(Number(index) || 0);
    const center = i * TERRAIN_SECTION_LENGTH;
    return { index:i, center, minX:center - TERRAIN_SECTION_HALF, maxX:center + TERRAIN_SECTION_HALF };
  }

  function invalidateTerrainHeightCache() {
    terrainResolvedHeightCache.clear();
  }

  function terrainSectionPathHeight(index) {
    const i = Math.trunc(Number(index) || 0);
    if (terrainResolvedHeightCache.has(i)) return terrainResolvedHeightCache.get(i);
    let bestIndex = -Infinity;
    let height = 0;
    for (const [rawIndex, rawHeight] of terrainSectionHeights.entries()) {
      const key = Math.trunc(Number(rawIndex) || 0);
      if (key <= i && key > bestIndex) {
        bestIndex = key;
        height = Number(rawHeight) || 0;
      }
    }
    height = Rig.clamp(height, -50, 80);
    terrainResolvedHeightCache.set(i, height);
    return height;
  }

  function terrainMonotoneTangent(previousDelta, nextDelta) {
    const a = Number(previousDelta) || 0;
    const b = Number(nextDelta) || 0;
    if (Math.abs(a) < 0.000001 || Math.abs(b) < 0.000001 || a * b <= 0) return 0;
    return (2 * a * b) / (a + b);
  }

  function terrainSmoothSectionProfileAt(x, sampleHeight) {
    const worldX = Number(x) || 0;
    const leftIndex = Math.floor(worldX / TERRAIN_SECTION_LENGTH);
    const leftX = leftIndex * TERRAIN_SECTION_LENGTH;
    const t = Rig.clamp((worldX - leftX) / TERRAIN_SECTION_LENGTH, 0, 1);
    const h0 = Number(sampleHeight(leftIndex - 1)) || 0;
    const h1 = Number(sampleHeight(leftIndex)) || 0;
    const h2 = Number(sampleHeight(leftIndex + 1)) || 0;
    const h3 = Number(sampleHeight(leftIndex + 2)) || 0;
    const d0 = h1 - h0;
    const d1 = h2 - h1;
    const d2 = h3 - h2;
    const m1 = terrainMonotoneTangent(d0, d1);
    const m2 = terrainMonotoneTangent(d1, d2);
    const t2 = t * t;
    const t3 = t2 * t;
    return (2*t3 - 3*t2 + 1) * h1
      + (t3 - 2*t2 + t) * m1
      + (-2*t3 + 3*t2) * h2
      + (t3 - t2) * m2;
  }

  function terrainPathElevationAt(x) {
    return terrainSmoothSectionProfileAt(x, terrainSectionPathHeight);
  }

  function terrainLayerSectionHeight(index, layerId = 'path') {
    const layer = TERRAIN_DEPTH_LAYERS[layerId] || TERRAIN_DEPTH_LAYERS.path;
    if (layer.id === 'path') return terrainSectionPathHeight(index);
    const modeInfo = terrainLayerModeInfo(index, layer.id);
    return modeInfo.mode === 'explicit'
      ? terrainLayerExplicitSectionHeight(index, layer.id, modeInfo.startIndex)
      : terrainLayerDerivedSectionHeight(index, layer.id);
  }

  function terrainLayerElevationAt(x, layerId = 'path') {
    return terrainSmoothSectionProfileAt(x, index => terrainLayerSectionHeight(index, layerId));
  }

  function terrainDepthElevationAt(x, z = pathZ) {
    const depth = Number(z) || 0;
    const pathHeight = terrainLayerElevationAt(x, 'path');
    if (depth >= PATH_OUTER_HALF) {
      const nearHeight = terrainLayerElevationAt(x, 'near');
      const t = Rig.clamp((depth - PATH_OUTER_HALF) / Math.max(0.001, GROUND_NEAR_Z - PATH_OUTER_HALF), 0, 1);
      return Rig.lerp(pathHeight, nearHeight, t);
    }
    if (depth <= -PATH_OUTER_HALF && depth >= TERRAIN_FAR_A_BACK_Z) {
      const farA = terrainLayerElevationAt(x, 'farA');
      const t = Rig.clamp((-depth - PATH_OUTER_HALF) / Math.max(0.001, -TERRAIN_FAR_A_BACK_Z - PATH_OUTER_HALF), 0, 1);
      return Rig.lerp(pathHeight, farA, t);
    }
    if (depth < TERRAIN_FAR_A_BACK_Z) {
      const farA = terrainLayerElevationAt(x, 'farA');
      const farB = terrainLayerElevationAt(x, 'farB');
      const t = Rig.clamp((TERRAIN_FAR_A_BACK_Z - depth) / Math.max(0.001, TERRAIN_FAR_A_BACK_Z - WORLD.farZ), 0, 1);
      return Rig.lerp(farA, farB, t);
    }
    return pathHeight;
  }

  function terrainSectionType(index) {
    const id = terrainSectionTypes.get(Math.trunc(Number(index) || 0)) || 'normal';
    return TERRAIN_SECTION_TYPES[id] ? id : 'normal';
  }

  function terrainSectionTypeAtX(x) {
    return terrainSectionType(terrainSectionIndexAt(x));
  }

  function terrainSectionTypeLabel(index) {
    return TERRAIN_SECTION_TYPES[terrainSectionType(index)]?.label || 'Normal';
  }

  function terrainSectionCollisionEnabled(index) {
    return !terrainCollisionDisabledSections.has(Math.trunc(Number(index) || 0));
  }

  function terrainCollisionEnabledAtX(x) {
    return terrainSectionCollisionEnabled(terrainSectionIndexAt(x));
  }

  function pointInsideRiverCollisionGap(x, z, index = terrainSectionIndexAt(x)) {
    const owned = puzzleRiverModifierAtPoint(x, z);
    if (owned && owned.collisionGap !== false) {
      const p = puzzleRiverProfileAtZ(owned, z);
      if (x > p.leftToe - 0.03 && x < p.rightToe + 0.03) return true;
    }
    if (terrainSectionType(index) !== 'river') return false;
    const p = riverProfileAtZ(index, z);
    // Physics deliberately ignores the sloping visual banks. The solid ground
    // runs flat to the inner toes, then becomes a clean gap across the channel.
    return x > p.leftToe - 0.03 && x < p.rightToe + 0.03;
  }

  function terrainCollisionAvailableAt(x, z = pathZ) {
    const index = terrainSectionIndexAt(x);
    if (!terrainSectionCollisionEnabled(index)) return false;
    if (pointInsideRiverCollisionGap(x, z, index)) return false;
    return true;
  }

  function setTerrainSectionCollisionEnabled(index, enabled) {
    const i = Math.trunc(Number(index) || 0);
    if (enabled) terrainCollisionDisabledSections.delete(i);
    else terrainCollisionDisabledSections.add(i);
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  }

  function terrainHeightBoundObjectAnchors() {
    if (typeof allSceneObjects !== 'function') return [];
    const anchors = [];
    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted || obj.carried || objectUsesFreePlacement(obj)) continue;
      anchors.push([obj, objectFloorOffsetFromTerrain(obj)]);
    }
    return anchors;
  }

  function restoreTerrainHeightBoundObjectAnchors(anchors) {
    for (const [obj, floorOffset] of anchors || []) {
      if (!obj || obj.deleted || objectUsesFreePlacement(obj)) continue;
      setObjectFloorOffset(obj, floorOffset);
    }
    if (typeof settleGameplayCrates === 'function') settleGameplayCrates();
  }

  function setTerrainSectionPathHeight(index, nextHeight, { linkSubsequent = terrainHeightLinkSubsequent, save = true } = {}) {
    const i = Math.trunc(Number(index) || 0);
    const oldHeight = terrainSectionPathHeight(i);
    const target = Rig.clamp(Number(nextHeight) || 0, -50, 80);
    const delta = target - oldHeight;
    if (Math.abs(delta) < 0.0001) { updateTerrainSectionUi(true); return false; }

    const oldNextHeight = terrainSectionPathHeight(i + 1);
    const anchors = terrainHeightBoundObjectAnchors();
    if (linkSubsequent) {
      const futureKeys = [...terrainSectionHeights.keys()].map(Number).filter(key => Number.isFinite(key) && key > i);
      terrainSectionHeights.set(i, target);
      for (const key of futureKeys) terrainSectionHeights.set(key, Rig.clamp((Number(terrainSectionHeights.get(key)) || 0) + delta, -50, 80));
    } else {
      terrainSectionHeights.set(i, target);
      if (!terrainSectionHeights.has(i + 1)) terrainSectionHeights.set(i + 1, oldNextHeight);
    }
    invalidateTerrainHeightCache();
    invalidateTerrainElevationMeshes();
    restoreTerrainHeightBoundObjectAnchors(anchors);
    if (save) saveTerrainSectionState();
    updateTerrainSectionUi(true);
    return true;
  }

  function riverSectionSettings(index, override = null) {
    const stored = override || terrainSectionSettings.get(Math.trunc(Number(index) || 0)) || null;
    const width = Rig.clamp(Number(stored?.width) || DEFAULT_RIVER_SECTION.width, RIVER_SECTION_MIN_WIDTH, RIVER_SECTION_MAX_WIDTH);
    return { width };
  }

  function terrainSectionFeatureRiseForTypeAtX(x, typeId, index = terrainSectionIndexAt(x)) {
    if (typeId !== 'testHill') return 0;
    const b = terrainSectionBounds(index);
    const t = Rig.clamp((x - b.minX) / TERRAIN_SECTION_LENGTH, 0, 1);
    const wave = Math.sin(Math.PI * t);
    return wave * wave * 0.82;
  }

  function smoothTerrainStep(t) {
    const c = Rig.clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
  }

  // River runs along Z, while the player/path travels along X. The centre line
  // meanders gently in depth; width also varies a little so the banks never read
  // as two perfectly parallel walls. Both banks use the same profile data.
  function riverProfileAtZ(index, z, settingsOverride = null) {
    const b = terrainSectionBounds(index);
    const settings = riverSectionSettings(index, settingsOverride);
    const phase = index * 0.731;
    const rawMeander = Math.sin(z * 0.165 + phase) * 0.34 + Math.sin(z * 0.071 - phase * 1.37) * 0.18;
    const widthVariation = Math.sin(z * 0.245 - phase * 0.43) * 0.16 + Math.sin(z * 0.113 + phase) * 0.09;
    const width = Rig.clamp(settings.width + widthVariation, RIVER_SECTION_MIN_WIDTH - 0.25, RIVER_SECTION_MAX_WIDTH);
    // Keep a small flat shoulder inside the 10 m section even at maximum width.
    // As the river approaches bridge-scale widths its meander naturally reduces,
    // preventing either lip from pushing through the neighbouring section seam.
    const bankEdgeMargin = 0.60;
    const maxCentreOffset = Math.max(0, TERRAIN_SECTION_HALF - bankEdgeMargin - width * 0.5);
    const centre = b.center + Rig.clamp(rawMeander, -maxCentreOffset, maxCentreOffset);
    const leftLip = centre - width * 0.5;
    const rightLip = centre + width * 0.5;
    const wallRun = Math.min(0.92, Math.max(0.68, width * 0.17));
    const leftToe = leftLip + wallRun;
    const rightToe = rightLip - wallRun;
    const bedY = pathGroundYAt(b.center, pathZ) - RIVER_BED_DEPTH + Math.sin(z * 0.19 + phase * 0.6) * 0.035;
    const waterY = bedY + RIVER_WATER_ABOVE_BED;
    return { ...b, width, centre, leftLip, rightLip, leftToe, rightToe, wallRun, bedY, waterY };
  }

  function riverTerrainYAt(x, z, index = terrainSectionIndexAt(x), settingsOverride = null) {
    const p = riverProfileAtZ(index, z, settingsOverride);
    const base = pathGroundYAt(x, z);
    if (x <= p.leftLip || x >= p.rightLip) return base;
    if (x >= p.leftToe && x <= p.rightToe) return p.bedY;
    if (x < p.leftToe) {
      const t = smoothTerrainStep((x - p.leftLip) / Math.max(0.001, p.leftToe - p.leftLip));
      return Rig.lerp(base, p.bedY, t);
    }
    const t = smoothTerrainStep((x - p.rightToe) / Math.max(0.001, p.rightLip - p.rightToe));
    return Rig.lerp(p.bedY, base, t);
  }

  function terrainSurfaceYForTypeAt(x, z, typeId, index = terrainSectionIndexAt(x), settingsOverride = null) {
    if (typeId === 'river') return riverTerrainYAt(x, z, index, settingsOverride);
    return pathGroundYAt(x, z) + terrainSectionFeatureRiseForTypeAtX(x, typeId, index);
  }

  function pointInsideRiverChannel(x, z, index = terrainSectionIndexAt(x)) {
    const owned = puzzleRiverModifierAtPoint(x, z);
    if (owned) {
      const p = puzzleRiverProfileAtZ(owned, z);
      if (x > p.leftLip - 0.05 && x < p.rightLip + 0.05) return true;
    }
    if (terrainSectionType(index) !== 'river') return false;
    const p = riverProfileAtZ(index, z);
    return x > p.leftLip - 0.05 && x < p.rightLip + 0.05;
  }

  function reanchorTerrainSectionObjects(index, previousType, nextType, previousSettings = null, nextSettings = null) {
    if (typeof allSceneObjects !== 'function') return;
    for (const obj of allSceneObjects()) {
      if (!obj || !Number.isFinite(obj.x) || terrainSectionIndexAt(obj.x) !== index) continue;
      const z = Number.isFinite(obj.z) ? obj.z : pathZ;
      const oldBase = terrainSurfaceYForTypeAt(obj.x, z, previousType, index, previousSettings);
      const newBase = terrainSurfaceYForTypeAt(obj.x, z, nextType, index, nextSettings);
      obj.y += newBase - oldBase;
    }
    if (typeof character !== 'undefined' && character && terrainSectionIndexAt(character.x) === index) {
      const oldBase = terrainSurfaceYForTypeAt(character.x, pathZ, previousType, index, previousSettings);
      const newBase = terrainSurfaceYForTypeAt(character.x, pathZ, nextType, index, nextSettings);
      character.y += newBase - oldBase;
    }
    if (typeof settleGameplayCrates === 'function') settleGameplayCrates();
  }

  function setTerrainSectionType(index, typeId) {
    const i = Math.trunc(Number(index) || 0);
    const previous = terrainSectionType(i);
    const next = TERRAIN_SECTION_TYPES[typeId] ? typeId : 'normal';
    if (previous === next) { updateTerrainSectionUi(true); return; }
    const settings = riverSectionSettings(i);
    if (next === 'normal') terrainSectionTypes.delete(i);
    else terrainSectionTypes.set(i, next);
    // River sections keep their bank/shoulder collision by default. The channel
    // itself is automatically cut out by terrainCollisionAvailableAt(), so any
    // support-surface object can bridge the gap without a bridge-specific rule.
    if (next === 'river' && previous !== 'river') terrainCollisionDisabledSections.delete(i);
    reanchorTerrainSectionObjects(i, previous, next, settings, settings);
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  }

  function setTerrainSectionRiverWidth(index, width) {
    const i = Math.trunc(Number(index) || 0);
    const previous = riverSectionSettings(i);
    const next = { width:Rig.clamp(Number(width) || DEFAULT_RIVER_SECTION.width, RIVER_SECTION_MIN_WIDTH, RIVER_SECTION_MAX_WIDTH) };
    if (Math.abs(previous.width - next.width) < 0.001) { updateTerrainSectionUi(true); return; }
    terrainSectionSettings.set(i, next);
    if (terrainSectionType(i) === 'river') reanchorTerrainSectionObjects(i, 'river', 'river', previous, next);
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  }

  function terrainSectionWorldU(x) {
    return ((x - TILE.minX) / TILE_WIDTH) * 24.0;
  }

  function loadTerrainSectionState() {
    try {
      const saved = JSON.parse(localStorage.getItem(TERRAIN_SECTION_STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      terrainSectionGuidesPersist = !!saved.persistGuides;
      terrainSectionGuidesVisible = terrainSectionGuidesPersist && !!saved.guides;
      terrainSelectedSectionIndex = Number.isFinite(Number(saved.selected)) ? Math.trunc(Number(saved.selected)) : 0;
      terrainHiddenSections = new Set(Array.isArray(saved.hidden) ? saved.hidden.map(Number).filter(Number.isFinite).map(Math.trunc) : []);
      terrainCollisionDisabledSections = new Set(Array.isArray(saved.collisionDisabled) ? saved.collisionDisabled.map(Number).filter(Number.isFinite).map(Math.trunc) : []);
      terrainSectionTypes = new Map();
      terrainSectionSettings = new Map();
      terrainSectionHeights = new Map();
      terrainDepthLayerSettings = normaliseTerrainDepthLayerSettings(saved.layers);
      terrainHeightLinkSubsequent = saved.linkSubsequent !== false;
      if (saved.heights && typeof saved.heights === 'object') {
        for (const [key, value] of Object.entries(saved.heights)) {
          const i = Number(key);
          const h = Number(value);
          if (Number.isFinite(i) && Number.isFinite(h)) terrainSectionHeights.set(Math.trunc(i), Rig.clamp(h, -50, 80));
        }
      }
      invalidateTerrainHeightCache();
      if (saved.types && typeof saved.types === 'object') {
        for (const [key, value] of Object.entries(saved.types)) {
          const i = Number(key);
          if (Number.isFinite(i) && TERRAIN_SECTION_TYPES[value] && value !== 'normal') terrainSectionTypes.set(Math.trunc(i), value);
        }
      }
      if (saved.settings && typeof saved.settings === 'object') {
        for (const [key, value] of Object.entries(saved.settings)) {
          const i = Number(key);
          if (!Number.isFinite(i) || !value || typeof value !== 'object') continue;
          terrainSectionSettings.set(Math.trunc(i), { width:Rig.clamp(Number(value.width) || DEFAULT_RIVER_SECTION.width, RIVER_SECTION_MIN_WIDTH, RIVER_SECTION_MAX_WIDTH) });
        }
      }
      // v1.0.17 migration: the first collision-toggle experiments could leave
      // stale whole-section holes in existing saves. Reset those once. From this
      // version onward the user's section toggle is preserved normally.
      const collisionModelVersion = Number(saved.collisionModelVersion) || 1;
      if (collisionModelVersion < 3) terrainCollisionDisabledSections.clear();
    } catch (_) {}
  }

  function saveTerrainSectionState() {
    try {
      localStorage.setItem(TERRAIN_SECTION_STORAGE_KEY, JSON.stringify({
        guides:!!terrainSectionGuidesVisible,
        persistGuides:!!terrainSectionGuidesPersist,
        selected:terrainSelectedSectionIndex,
        hidden:[...terrainHiddenSections].sort((a,b)=>a-b),
        collisionDisabled:[...terrainCollisionDisabledSections].sort((a,b)=>a-b),
        collisionModelVersion:3,
        linkSubsequent:!!terrainHeightLinkSubsequent,
        heights:Object.fromEntries([...terrainSectionHeights.entries()].sort((a,b)=>a[0]-b[0]).map(([i,h])=>[String(i),Number(h.toFixed(3))])),
        layers:normaliseTerrainDepthLayerSettings(terrainDepthLayerSettings),
        types:Object.fromEntries([...terrainSectionTypes.entries()].sort((a,b)=>a[0]-b[0])),
        settings:Object.fromEntries([...terrainSectionSettings.entries()].sort((a,b)=>a[0]-b[0]))
      }));
    } catch (_) {}
  }

  loadTerrainSectionState();

  const WORLD = { nearZ: 10.5, farZ: -42 };
  // v0.2.65: a slightly bluer fog with a gentler near-field contribution.
  // The fragment shader adds an eased/power curve so contrast stays stronger
  // around the player and falls away progressively deeper into the forest.
  const DEFAULT_FOG = { enabled:true, color:[0.835,0.885,0.945], near:7.8, far:46.0, amount:0.90, curve:1.65 };
  const DEFAULT_POST = { brightness:1.0, contrast:1.0, saturation:1.0, tintColor:[1,1,1], tintAmount:0.0 };
  const RENDER_FOG_STORAGE_KEY = 'sidescroll.render.fog.v1';
  const RENDER_POST_STORAGE_KEY = 'sidescroll.render.post.v1';

  function clampNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function loadRenderSettings(storageKey, defaults, colorKey) {
    const result = { ...defaults, [colorKey]: [...defaults[colorKey]] };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || typeof saved !== 'object') return result;
      for (const key of Object.keys(defaults)) {
        if (key === colorKey) continue;
        if (typeof defaults[key] === 'boolean') {
          if (typeof saved[key] === 'boolean') result[key] = saved[key];
        } else if (Number.isFinite(defaults[key]) && Number.isFinite(Number(saved[key]))) {
          result[key] = Number(saved[key]);
        }
      }
      if (Array.isArray(saved[colorKey]) && saved[colorKey].length >= 3) {
        result[colorKey] = saved[colorKey].slice(0,3).map((v,i) =>
          clampNumber(v, defaults[colorKey][i], 0, 1)
        );
      }
    } catch (_) {}
    return result;
  }

  const fogSettings = loadRenderSettings(RENDER_FOG_STORAGE_KEY, DEFAULT_FOG, 'color');
  fogSettings.near = clampNumber(fogSettings.near, DEFAULT_FOG.near, 0, 60);
  fogSettings.far = clampNumber(fogSettings.far, DEFAULT_FOG.far, 1, 100);
  fogSettings.amount = clampNumber(fogSettings.amount, DEFAULT_FOG.amount, 0, 1);
  fogSettings.curve = clampNumber(fogSettings.curve, DEFAULT_FOG.curve, 0.2, 5);

  const postSettings = loadRenderSettings(RENDER_POST_STORAGE_KEY, DEFAULT_POST, 'tintColor');
  postSettings.brightness = clampNumber(postSettings.brightness, DEFAULT_POST.brightness, 0.6, 1.4);
  postSettings.contrast = clampNumber(postSettings.contrast, DEFAULT_POST.contrast, 0.5, 1.6);
  postSettings.saturation = clampNumber(postSettings.saturation, DEFAULT_POST.saturation, 0, 1.6);
  postSettings.tintAmount = clampNumber(postSettings.tintAmount, DEFAULT_POST.tintAmount, 0, 0.6);

  function saveFogSettings() {
    try {
      localStorage.setItem(RENDER_FOG_STORAGE_KEY, JSON.stringify({
        enabled:!!fogSettings.enabled,
        color:[...fogSettings.color],
        near:fogSettings.near,
        far:fogSettings.far,
        amount:fogSettings.amount,
        curve:fogSettings.curve
      }));
    } catch (_) {}
  }

  function savePostSettings() {
    try {
      localStorage.setItem(RENDER_POST_STORAGE_KEY, JSON.stringify({
        brightness:postSettings.brightness,
        contrast:postSettings.contrast,
        saturation:postSettings.saturation,
        tintColor:[...postSettings.tintColor],
        tintAmount:postSettings.tintAmount
      }));
    } catch (_) {}
  }
  const fogColor = fogSettings.color;
  const PROCEDURAL_TREE_SCALE = 0.96;
  const HIDE_LEGACY_GROUND_DRESSING = false;
  const groundY = -4.55;

  // Think of this exactly like a top-down forest plan: a clear path runs along X,
  // the character walks down its centre, and woodland begins on either side.
  const pathZ = 0.0;
  const PATH_FLAT_HALF = 2.45;
  const PATH_BERM_HALF = 2.95;
  const PATH_OUTER_HALF = 3.60;
  const PATH_TOP_RISE = 0.12;
  const FAR_SIDE_START = -PATH_OUTER_HALF;
  const NEAR_SIDE_START = PATH_OUTER_HALF;

  function pathLocalX(x) {
    let local = ((x + TILE_WIDTH * 0.5) % TILE_WIDTH + TILE_WIDTH) % TILE_WIDTH - TILE_WIDTH * 0.5;
    return local;
  }

  function pathUndulationAtX(x) {
    const t = pathLocalX(x) / TILE_WIDTH + 0.5;
    return pathUndulationUnit(t);
  }

  function pathProfileHeight(z) {
    const az = Math.abs(z);
    if (az <= PATH_FLAT_HALF) return PATH_TOP_RISE;
    if (az <= PATH_BERM_HALF) {
      const t = (az - PATH_FLAT_HALF) / Math.max(0.001, PATH_BERM_HALF - PATH_FLAT_HALF);
      return Rig.lerp(PATH_TOP_RISE, 0.22, t);
    }
    if (az <= PATH_OUTER_HALF) {
      const t = (az - PATH_BERM_HALF) / Math.max(0.001, PATH_OUTER_HALF - PATH_BERM_HALF);
      return Rig.lerp(0.22, 0.0, t);
    }
    return 0;
  }

  function legacyPathGroundYAt(x, z = 0) {
    return groundY + pathProfileHeight(z) + pathUndulationAtX(x);
  }

  function pathGroundYAt(x, z = 0) {
    return legacyPathGroundYAt(x, z) + terrainDepthElevationAt(x, z);
  }

  // Grounded scenery uses the same section height ownership as the terrain mesh.
  // The old flat-world reference remains available as legacyPathGroundYAt() so
  // saved absolute positions can still be migrated without baking new terrain
  // elevation into their authored offsets.
  function terrainGroundYAt(x, z = 0) {
    const owned = puzzleRiverModifierAtPoint(x, z);
    if (owned) return puzzleRiverTerrainYAt(x, z, owned);
    const index = terrainSectionIndexAt(x);
    return terrainSurfaceYForTypeAt(x, z, terrainSectionType(index), index);
  }

  // Stable gameplay reference height. Visual river geometry is allowed to dip
  // and slope independently; collision decides whether this reference floor is
  // present. This keeps camera/jump/platform maths completely independent from
  // the decorative river-bank shape.
  function playSurfaceYAt(x) {
    if (puzzleRiverModifierAtPoint(x, pathZ)) return pathGroundYAt(x, pathZ);
    const index = terrainSectionIndexAt(x);
    const typeId = terrainSectionType(index);
    if (typeId === 'river') return pathGroundYAt(x, pathZ);
    return terrainSurfaceYForTypeAt(x, pathZ, typeId, index);
  }

  function visualTerrainSceneryAsset(assetName) {
    const name = String(assetName || '');
    return /^tree\d{2}$/.test(name)
      || /^ground\d{2}$/.test(name)
      || /^mountain-(?:rock|tree|grass)-\d{2}$/.test(name);
  }

  // Natural scenery should meet the surface that is actually rendered, while
  // gameplay/collision continues to use the mathematical terrain profile. The
  // depth-band mesh starts its blend slightly underneath the path strip and has
  // tiny render-only Y offsets to hide seams, so reproduce that exact visible
  // profile here for tree/foliage/rock grounding.
  function terrainVisibleGroundYAt(x, z = 0) {
    const worldX = Number(x) || 0;
    const depth = Number(z) || 0;
    const owned = puzzleRiverModifierAtPoint(worldX, depth);
    if (owned) return puzzleRiverTerrainYAt(worldX, depth, owned);
    const index = terrainSectionIndexAt(worldX);
    const typeId = terrainSectionType(index);
    if (typeId === 'river' || Math.abs(depth) <= PATH_OUTER_HALF) {
      return terrainSurfaceYForTypeAt(worldX, depth, typeId, index);
    }

    const bandEdge = Math.max(PATH_BERM_HALF + 0.02, PATH_OUTER_HALF - TERRAIN_PATH_BAND_OVERLAP);
    const pathHeight = terrainLayerElevationAt(worldX, 'path') + (TERRAIN_VISUAL_LAYER_OFFSETS.path || 0);
    let visibleElevation = pathHeight;
    if (depth > PATH_OUTER_HALF) {
      const nearHeight = terrainLayerElevationAt(worldX, 'near') + (TERRAIN_VISUAL_LAYER_OFFSETS.near || 0);
      const t = Rig.clamp((depth - bandEdge) / Math.max(0.001, GROUND_NEAR_Z - bandEdge), 0, 1);
      visibleElevation = Rig.lerp(pathHeight, nearHeight, t);
    } else if (depth >= TERRAIN_FAR_A_BACK_Z) {
      const farAHeight = terrainLayerElevationAt(worldX, 'farA') + (TERRAIN_VISUAL_LAYER_OFFSETS.farA || 0);
      const t = Rig.clamp((-depth - bandEdge) / Math.max(0.001, -TERRAIN_FAR_A_BACK_Z - bandEdge), 0, 1);
      visibleElevation = Rig.lerp(pathHeight, farAHeight, t);
    } else {
      const farAHeight = terrainLayerElevationAt(worldX, 'farA') + (TERRAIN_VISUAL_LAYER_OFFSETS.farA || 0);
      const farBHeight = terrainLayerElevationAt(worldX, 'farB') + (TERRAIN_VISUAL_LAYER_OFFSETS.farB || 0);
      const t = Rig.clamp((TERRAIN_FAR_A_BACK_Z - depth) / Math.max(0.001, TERRAIN_FAR_A_BACK_Z - WORLD.farZ), 0, 1);
      visibleElevation = Rig.lerp(farAHeight, farBHeight, t);
    }
    return groundY + TERRAIN_GROUND_BAND_Y_OFFSET + pathUndulationAtX(worldX)
      + terrainSectionFeatureRiseForTypeAtX(worldX, typeId, index)
      + visibleElevation;
  }

  function terrainAnchorBaseY(x, z, category = 'dressing', gameplayLayerLocked = false, assetName = null) {
    if (category === 'gameplay' && gameplayLayerLocked) return playSurfaceYAt(x);
    if (category === 'dressing' && visualTerrainSceneryAsset(assetName)) return terrainVisibleGroundYAt(x, z);
    return terrainGroundYAt(x, z);
  }


  function terrainSurfaceAngleAt(x, z = pathZ, category = 'dressing', gameplayLayerLocked = false, assetName = null) {
    const worldX = Number(x) || 0;
    const depth = Number(z) || 0;
    const sample = 0.18;
    const y0 = terrainAnchorBaseY(worldX - sample, depth, category, gameplayLayerLocked, assetName);
    const y1 = terrainAnchorBaseY(worldX + sample, depth, category, gameplayLayerLocked, assetName);
    const angle = Math.atan2(y1 - y0, sample * 2);
    return Rig.clamp(angle, -Math.PI * 0.28, Math.PI * 0.28);
  }

  function legacyTerrainAnchorBaseY(x, z, category = 'dressing', gameplayLayerLocked = false) {
    return category === 'gameplay' && gameplayLayerLocked
      ? legacyPathGroundYAt(x, pathZ)
      : legacyPathGroundYAt(x, z);
  }

  // Floor Line is the normalised height, measured up from the bottom of the
  // billboard, that should meet the terrain. Existing assets default to zero,
  // so their legacy bottom-on-ground behaviour remains unchanged.
  const ASSET_LAYOUT_STORAGE_KEY = 'sidescroll.asset-layout.v1';
  const ASSET_GROUND_LINE_DEFAULTS = Object.freeze({
    'bridge-left': 1.62 / 2.20,
    'bridge-right': 1.62 / 2.20,
    'counterweight-plank': 0.36,
    // Wheel contact in the complete 620x255 cart frame is ~16 px above the
    // texture bottom, so 0.064 places the tyres cleanly on the gameplay floor.
    'handcart': 0.064,
    'handcart-broken': 0.064,
    'cart-wheel-loose': 0.00,
    'cart-wheel-ready': 0.00,
    'axle-pin': 0.00,
    // Mountain art has intentionally broken grass/stone silhouettes at the base.
    // Bury the lowest fringe very slightly so the visible mass feels planted.
    'mountain-cliff-01':0.025,
    'mountain-cliff-02':0.025,
    'mountain-cliff-03':0.025,
    'mountain-cliff-04':0.025,
    'mountain-rock-01':0.030,
    'mountain-rock-02':0.030,
    'mountain-rock-03':0.030,
    'mountain-rock-04':0.030,
    'mountain-tree-01':0.020,
    'mountain-tree-02':0.020,
    'mountain-grass-01':0.018,
    'mountain-grass-02':0.018,
    'mountain-grass-03':0.018
  });
  const ASSET_VISUAL_DEFAULTS = Object.freeze({
    'handcart-broken': { offsetX:0.00, offsetY:-0.06, rotationDeg:-6.0 }
  });

  let assetLayoutStorageSnapshot = '';
  let assetLayoutDefaults = (() => {
    try {
      const raw = localStorage.getItem(ASSET_LAYOUT_STORAGE_KEY);
      assetLayoutStorageSnapshot = raw ?? '';
      const parsed = raw !== null ? JSON.parse(raw || '{}') : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { assetLayoutStorageSnapshot = ''; return {}; }
  })();

  function refreshAssetLayoutDefaultsFromStorage() {
    try {
      const raw = localStorage.getItem(ASSET_LAYOUT_STORAGE_KEY) ?? '';
      if (raw === assetLayoutStorageSnapshot) return false;
      const parsed = raw ? JSON.parse(raw) : {};
      assetLayoutDefaults = parsed && typeof parsed === 'object' ? parsed : {};
      assetLayoutStorageSnapshot = raw;
      return true;
    } catch (_) { return false; }
  }

  function authoredAssetHeight(assetName) {
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    const value = Number(assetLayoutDefaults?.[settingsName]?.defaultHeight);
    return Number.isFinite(value) ? Rig.clamp(value, 0.25, 12) : null;
  }

  // Procedural scenery keeps its established random size range until an asset
  // has an explicit Asset Lab height. Once authored, that value becomes the
  // master size and scales the existing procedural variation proportionally.
  function proceduralHeightFromAssetLab(assetName, generatedHeight, legacyDefaultHeight) {
    const authored = authoredAssetHeight(assetName);
    if (!Number.isFinite(authored)) return generatedHeight;
    const legacy = Number(legacyDefaultHeight);
    if (!Number.isFinite(legacy) || legacy <= 0.0001) return authored;
    return generatedHeight * (authored / legacy);
  }

  function assetGroundLineDefault(assetName, stateName = null) {
    const stateLayout=assetStateProfile(assetName,stateName)?.layout || null;
    const stateGround=Number(stateLayout?.groundLine);
    if(Number.isFinite(stateGround)) return Rig.clamp(stateGround,0,1);
    const layoutName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    const authored = Number(assetLayoutDefaults?.[layoutName]?.groundLine);
    if (Number.isFinite(authored)) return Rig.clamp(authored, 0, 1);
    const value = ASSET_GROUND_LINE_DEFAULTS[layoutName];
    return Rig.clamp(Number.isFinite(value) ? value : 0, 0, 1);
  }

  function assetVisualTransform(assetName, stateName = null) {
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    const stored = assetLayoutDefaults?.[settingsName] || {};
    const stateLayout=assetStateProfile(assetName,stateName)?.layout || {};
    const fallback = ASSET_VISUAL_DEFAULTS[settingsName] || {};
    return {
      offsetX:Number.isFinite(Number(stateLayout.visualOffsetX)) ? Number(stateLayout.visualOffsetX) : (Number.isFinite(Number(stored.visualOffsetX)) ? Number(stored.visualOffsetX) : (Number(fallback.offsetX) || 0)),
      offsetY:Number.isFinite(Number(stateLayout.visualOffsetY)) ? Number(stateLayout.visualOffsetY) : (Number.isFinite(Number(stored.visualOffsetY)) ? Number(stored.visualOffsetY) : (Number(fallback.offsetY) || 0)),
      rotationDeg:Number.isFinite(Number(stateLayout.visualRotationDeg)) ? Number(stateLayout.visualRotationDeg) : (Number.isFinite(Number(stored.visualRotationDeg)) ? Number(stored.visualRotationDeg) : (Number(fallback.rotationDeg) || 0)),
      flip:Object.prototype.hasOwnProperty.call(stateLayout,'visualFlip') ? !!stateLayout.visualFlip : !!stored.visualFlip
    };
  }

  function objectVisualFlip(obj, assetName = obj?.assetName) {
    return (!!obj?.flip) !== (!!assetVisualTransform(assetName,obj?.assetState).flip);
  }

  function objectGroundLine(obj) {
    if (!obj) return 0;
    return Rig.clamp(Number.isFinite(obj.groundLine) ? Number(obj.groundLine) : assetGroundLineDefault(obj.assetName,obj.assetState), 0, 1);
  }

  function objectFloorWorldY(obj) {
    if (!obj) return groundY;
    return obj.y + objectGroundLine(obj) * (Number(obj.sy) || 0);
  }

  function setObjectFloorWorldY(obj, floorWorldY) {
    if (!obj || !Number.isFinite(Number(floorWorldY))) return;
    obj.y = Number(floorWorldY) - objectGroundLine(obj) * (Number(obj.sy) || 0);
  }

  function setObjectAssetState(obj, stateName, { refreshCollision=true, preserveFloor=false } = {}) {
    if(!obj) return obj;
    const floorY=preserveFloor ? objectFloorWorldY(obj) : null;
    obj.assetState=stateName || inferredAssetState(obj.assetName);
    obj.groundLine=assetGroundLineDefault(obj.assetName,obj.assetState);
    if(refreshCollision && !obj.collisionOverride){
      obj.collision=behaviourCollisionFor(obj.assetName,obj.sx,obj.sy,obj.collision,obj.assetState);
    }
    if(preserveFloor && Number.isFinite(floorY)) setObjectFloorWorldY(obj,floorY);
    return obj;
  }

  function objectFloorOffsetFromTerrain(obj) {
    if (!obj) return 0;
    return objectFloorWorldY(obj) - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
  }

  function setObjectFloorOffset(obj, floorOffset = 0) {
    if (!obj) return;
    const base = terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
    obj.y = base + (Number(floorOffset) || 0) - objectGroundLine(obj) * (Number(obj.sy) || 0);
  }

  // Procedural forest dressing is stored once inside the repeating 124 m tile,
  // then wrapped beside the camera. A rising world terrain spine means the drawn
  // copy can be hundreds of metres away from the source object's X. Resolve its
  // visual/collision Y against that drawn X so trees and grass stay planted on
  // the visible terrain instead of sinking into a mountain slope.
  function objectYAtDrawX(obj, drawX = obj?.x) {
    if (!obj || !Number.isFinite(Number(obj.y))) return 0;
    // Section/path terrain meshes already bake the complete interpolated world
    // elevation into their vertices. Applying the wrapped-scenery anchor delta
    // a second time translates each 10 m chunk by its centre height and opens
    // visible seams between otherwise matching section edges. Ground-layer
    // meshes therefore keep their authored model Y; only scenery dressing is
    // re-grounded at its wrapped draw X.
    if (obj.layer === 'ground') return Number(obj.y);
    if (!obj.wrap || objectUsesFreePlacement(obj) || !Number.isFinite(Number(drawX))) return Number(obj.y);
    const sourceBase = terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
    const drawBase = terrainAnchorBaseY(Number(drawX), obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
    return Number(obj.y) + (drawBase - sourceBase);
  }

  const CRATE_HALF_WIDTH_FACTOR = 0.43;
  const CRATE_COLLISION_HEIGHT_FACTOR = 0.96;
  // Stackable props share one authored gameplay height. Their artwork can vary,
  // but stacking/carry placement always reasons about the same vertical step.
  // v0.2.45: raised from 0.48 so the physical stack block better matches the
  // visible log artwork instead of allowing neighbouring logs to intersect.
  const STACK_ITEM_HEIGHT = 0.68;
  const STACK_SEARCH_RADIUS = 2.00;
  const STACK_COLUMN_ALIGN_TOLERANCE = 0.42;
  const EDITOR_STACK_SNAP_RADIUS = 0.46;
  const STACK_ASSIST_SPEED = 0.92;
  const STACK_ASSIST_MAX = 0.78;
  const STACK_ASSIST_ROOT_GAP = 0.92;
  const SOCKET_SEARCH_RADIUS = 1.85;
  const SOCKET_DEPTH_BIAS = 0.035;
  // The painted boots extend up to ~0.087 rig units below their ankle/toe baseline in
  // the v4 atlas.  Raise only the rendered rig by that amount so the visible
  // soles, not the internal bone line, sit on the playable floor.
  const CHARACTER_SOLE_ART_LOCAL_OFFSET = 0.0870;


  // World-anchored dirt floor.  Earlier builds moved this plane with the
  // camera, which made the UV pattern visibly slide beneath gaps in the
  // foliage.  It now spans one complete repeating scene tile in X and reaches
  // from just behind the camera all the way into the fog.  wrapX() moves it by
  // whole tile widths only, so both geometry and UVs remain fixed in world space.
  const GROUND_NEAR_Z = 14.25;
  const ground = {
    mesh: groundMesh,
    texture: textures.pathDirt,
    x: 0,
    y: groundY + TERRAIN_GROUND_BAND_Y_OFFSET,
    z: GROUND_NEAR_Z,
    sx: TILE_WIDTH,
    sy: 1,
    sz: GROUND_NEAR_Z - WORLD.farZ,
    layer: 'ground',
    tint: [1.0, 1.0, 1.0],
    opacity: 1,
    uvScale: [24, 11],
    noFog: false,
    wrap: true
  };


  const pathStrip = {
    mesh: pathMesh,
    texture: textures.pathDirt,
    x: 0,
    y: groundY,
    z: pathZ,
    sx: TILE_WIDTH,
    sy: 1,
    sz: PATH_OUTER_HALF,
    layer: 'ground',
    tint: [1.0, 1.0, 1.0],
    opacity: 1,
    uvScale: [1, 1],
    noFog: false,
    wrap: true
  };

  const riverBankSurface = {
    mesh: groundMesh,
    texture: textures.pathDirt,
    x: 0, y: 0, z: 0, sx: 1, sy: 1, sz: 1,
    layer:'ground', tint:[0.98,0.98,0.98], opacity:1, uvScale:[1,1], noFog:false, wrap:false
  };

  const riverWaterSurface = {
    mesh: groundMesh,
    texture: textures.riverWater,
    x: 0, y: 0, z: 0, sx: 1, sy: 1, sz: 1,
    layer:'ground', tint:[0.94,1.0,0.98], opacity:0.78, uvScale:[1,1], noFog:false, wrap:false
  };

  const backdrop = [];
  const midfill = [];
  const frontOccluders = [];

  const SCENE_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.scene.v1' : 'sidescroll.scene.v1';
  const ASSET_BEHAVIOUR_STORAGE_KEY = 'sidescroll.asset-behaviours.v1';
  const ASSET_COLLISION_STORAGE_KEY = 'sidescroll.asset-collisions.v1';
  const ASSET_CLIMB_PATH_STORAGE_KEY = 'sidescroll.asset-climb-paths.v1';
  const ASSET_MECHANISM_STORAGE_KEY = 'sidescroll.asset-mechanisms.v3';
  const ASSET_SOCKET_STORAGE_KEY = 'sidescroll.asset-sockets.v1';
  const ASSET_STATE_STORAGE_KEY = 'sidescroll.asset-states.v1';
  const ASSET_BEHAVIOUR_KEYS = ['solid','carryable','placeable','supportSurface','stackable','pushable','climbable','followSurfaceNormal','socketHost','socketPiece'];
  const EMPTY_ASSET_BEHAVIOURS = Object.freeze({
    solid:false, carryable:false, placeable:false, supportSurface:false, stackable:false, pushable:false, climbable:false, followSurfaceNormal:false, socketHost:false, socketPiece:false
  });
  const ASSET_BEHAVIOUR_DEFAULTS = {
    crate: { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-a': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-b': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-c': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-d': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'fallen-tree': { solid:true, supportSurface:true },
    'mountain-climb-rock-01': { solid:true, supportSurface:true, climbable:true },
    'mountain-cliff-01': { solid:true, supportSurface:true, climbable:true },
    'mountain-cliff-02': { solid:true, supportSurface:true, climbable:true },
    'mountain-cliff-03': { solid:true, supportSurface:true, climbable:true },
    'mountain-cliff-04': { solid:true, supportSurface:true, climbable:true },
    'mountain-rock-01': { followSurfaceNormal:true },
    'mountain-rock-02': { followSurfaceNormal:true },
    'mountain-rock-03': { followSurfaceNormal:true },
    'mountain-rock-04': { followSurfaceNormal:true },
    'mountain-grass-01': { followSurfaceNormal:true },
    'mountain-grass-02': { followSurfaceNormal:true },
    'mountain-grass-03': { followSurfaceNormal:true },
    'thought-trigger': {},
    'bridge-left': { solid:true, supportSurface:true, socketHost:true },
    'bridge-right': { solid:true, supportSurface:true, socketHost:true },
    'counterweight-plank': { solid:true, carryable:true, placeable:true, supportSurface:true, socketPiece:true },
    'handcart': { solid:true, supportSurface:true, pushable:true },
    'handcart-broken': {},
    'cart-wheel-loose': { carryable:true, placeable:true },
    'cart-wheel-ready': { carryable:true, placeable:true },
    'tree-stump': {},
    'broken-branch': {},
    'stone-wall': { socketHost:true },
    'stone-piece-a': { carryable:true, placeable:true, socketPiece:true },
    'stone-piece-b': { carryable:true, placeable:true, socketPiece:true },
    'stone-piece-c': { carryable:true, placeable:true, socketPiece:true },
    'forest-key': {},
    'axle-pin': {}
  };
  // Placement is an editor concern, separate from gameplay behaviour. Assets
  // such as bridge halves are easier to author when their height is held in
  // world space rather than continuously re-snapping to the decorative terrain.
  const FREE_PLACEMENT_ASSET_DEFAULTS = new Set(['bridge-left','bridge-right','counterweight-plank']);
  function defaultFreePlacement(assetName) { return FREE_PLACEMENT_ASSET_DEFAULTS.has(assetName); }
  function objectUsesFreePlacement(obj) {
    return !!obj && (typeof obj.freePlacement === 'boolean' ? obj.freePlacement : defaultFreePlacement(obj.assetName));
  }

  const ASSET_BEHAVIOUR_DEFS = [
    { key:'solid', label:'Solid', description:'Adds physical collision to this asset type.' },
    { key:'carryable', label:'Carryable', description:'ACTION can pick this asset up. Enabling this also makes it placeable.' },
    { key:'placeable', label:'Placeable', description:'A carried copy may be put back down into the world.' },
    { key:'supportSurface', label:'Support Surface', description:'The top of its collision can support the player and stackable props.' },
    { key:'stackable', label:'Stackable', description:'This asset may settle onto a support surface when placed.' },
    { key:'pushable', label:'Pushable', description:'ACTION can grip this large object and walking into it moves the object instead of carrying it.' },
    { key:'climbable', label:'Climbable', description:'ACTION can use authored Climb Paths. Collision is independent and optional.' },
    { key:'followSurfaceNormal', label:'Follow Surface Normal', description:'Visually tilts terrain-bound dressing to match the local ground slope. Intended for grass, scrub and small rocks; trees stay upright unless explicitly enabled.' },
    { key:'socketHost', label:'Socket Host', description:'Allows socket-piece targets to be authored directly onto this asset.' },
    { key:'socketPiece', label:'Socket Piece', description:'Allows an individual puzzle piece to be linked to a matching authored socket.' }
  ];
  let assetMechanismDefaults = (() => {
    try {
      const raw = localStorage.getItem(ASSET_MECHANISM_STORAGE_KEY);
      const parsed = raw !== null ? JSON.parse(raw || '{}') : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  })();

  let assetSocketDefaults = (() => {
    try {
      const raw = localStorage.getItem(ASSET_SOCKET_STORAGE_KEY);
      const parsed = raw !== null ? JSON.parse(raw || '{}') : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  })();

  function socketsForHost(host) {
    if (!host) return [];
    const legacy = Array.isArray(host.sockets) ? host.sockets : [];
    const managed = Array.isArray(assetSocketDefaults?.[host.assetName]) ? assetSocketDefaults[host.assetName] : [];
    const managedPieces = new Set(managed.map(entry => entry?.pieceAsset).filter(Boolean));

    // Asset Lab entries override scene-authored sockets one linked piece at a time.
    // Old counterweight-plank scene sockets are always suppressed so a mistaken
    // in-game socket from earlier builds cannot keep affecting the bridge.
    const result = legacy.filter(socket =>
      socket?.pieceAsset !== 'counterweight-plank' &&
      !managedPieces.has(socket?.pieceAsset)
    );

    for (const socket of managed) {
      if (!socket || socket.deleted || !socket.pieceAsset) continue;
      result.push({ ...socket });
    }
    return result;
  }

  function pieceUsesAssetSocket(assetName) {
    if (assetName === 'counterweight-plank') return true;
    return Object.values(assetSocketDefaults || {}).some(list =>
      Array.isArray(list) && list.some(entry => entry?.pieceAsset === assetName)
    );
  }

  function socketLinkIsValid(piece) {
    if (!piece?.socketedTo) return true;
    const host = allSceneObjects().find(obj => !obj.deleted && obj.id === piece.socketedTo.hostObjectId);
    if (!host) return false;
    return socketsForHost(host).some(socket =>
      socket?.id === piece.socketedTo.socketId && socketMatchesPiece(socket,piece)
    );
  }

  const DEFAULT_COUNTERWEIGHT_MECHANISM = Object.freeze({
    type:'counterweightPlank',
    // The pivot is intentionally close to one end. This is both the bridge
    // socket point and the pickup point, so a player can approach it from the
    // end of a loose plank rather than needing to stand on the middle.
    pivotX:0.23,pivotY:0.50,
    // The counterweight zone lives entirely behind the pivot.
    zoneStart:0.00,zoneEnd:0.23,zoneY:0.60,zoneDepth:1.20,
    minimumOverlap:0.50,
    logWeight:1.30,playerWeight:1.00,
    maxTipDeg:32,fallAngleDeg:12
  });

  function assetMechanism(assetName) {
    if (assetName !== 'counterweight-plank') return assetMechanismDefaults?.[assetName] || null;
    return {...DEFAULT_COUNTERWEIGHT_MECHANISM,...(assetMechanismDefaults?.[assetName]||{})};
  }

  function isCounterweightPlank(obj) {
    return !!obj && assetMechanism(obj.assetName)?.type === 'counterweightPlank';
  }

  function counterweightMechanism(obj) {
    return isCounterweightPlank(obj) ? assetMechanism(obj.assetName) : null;
  }

  function mechanismVisualU(obj, u) {
    return obj?.flip ? 1 - u : u;
  }

  function counterweightPivotBaseWorld(obj) {
    const mech = counterweightMechanism(obj);
    if (!mech) return null;
    const u = mechanismVisualU(obj, Rig.clamp(Number(mech.pivotX) || 0.23, 0, 1));
    return {
      x: obj.x + (u - 0.5) * obj.sx,
      y: obj.y + Rig.clamp(Number(mech.pivotY) || 0.5, 0, 1) * obj.sy,
      z: obj.z
    };
  }

  function counterweightAngleFor(obj) {
    return isCounterweightPlank(obj) && obj.socketedTo ? (Number(obj.counterweightAngle) || 0) : 0;
  }

  function rotateAround(pointX, pointY, pivotX, pivotY, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const dx = pointX - pivotX, dy = pointY - pivotY;
    return {
      x: pivotX + dx * c - dy * s,
      y: pivotY + dx * s + dy * c
    };
  }

  function counterweightObjectOrigin(obj, angle = counterweightAngleFor(obj), aroundX = obj.x) {
    const mech = counterweightMechanism(obj);
    if (!mech || !angle) return { x:aroundX, y:obj.y };
    const u = mechanismVisualU(obj, Rig.clamp(Number(mech.pivotX) || 0.23, 0, 1));
    const localPivotX = (u - 0.5) * obj.sx;
    const localPivotY = Rig.clamp(Number(mech.pivotY) || 0.5, 0, 1) * obj.sy;
    const pivotX = aroundX + localPivotX;
    const pivotY = obj.y + localPivotY;
    const c = Math.cos(angle), s = Math.sin(angle);
    return {
      x: pivotX - (localPivotX * c - localPivotY * s),
      y: pivotY - (localPivotX * s + localPivotY * c)
    };
  }

  function counterweightWorldToRest(obj, worldX, worldY) {
    const pivot = counterweightPivotBaseWorld(obj);
    if (!pivot) return { x:worldX, y:worldY };
    const angle = counterweightAngleFor(obj);
    if (!angle) return { x:worldX, y:worldY };
    return rotateAround(worldX, worldY, pivot.x, pivot.y, -angle);
  }

  function counterweightZoneRestBounds(obj) {
    const mech = counterweightMechanism(obj);
    if (!mech) return null;
    let a = mechanismVisualU(obj, Rig.clamp(Number(mech.zoneStart) || 0.00, 0, 1));
    let b = mechanismVisualU(obj, Rig.clamp(Number(mech.zoneEnd) || 0.23, 0, 1));
    if (a > b) [a,b] = [b,a];
    return {
      minX: obj.x + (a - 0.5) * obj.sx,
      maxX: obj.x + (b - 0.5) * obj.sx,
      minZ: obj.z - Math.max(0.15, Number(mech.zoneDepth) || 1.2) * 0.5,
      maxZ: obj.z + Math.max(0.15, Number(mech.zoneDepth) || 1.2) * 0.5
    };
  }

  function counterweightZoneLineWorld(obj) {
    const mech = counterweightMechanism(obj);
    const bounds = counterweightZoneRestBounds(obj);
    const pivot = counterweightPivotBaseWorld(obj);
    if (!mech || !bounds || !pivot) return null;
    const y = obj.y + Rig.clamp(Number(mech.zoneY) || 0.60, 0, 1) * obj.sy;
    const angle = counterweightAngleFor(obj);
    const a = rotateAround(bounds.minX, y, pivot.x, pivot.y, angle);
    const b = rotateAround(bounds.maxX, y, pivot.x, pivot.y, angle);
    return { a:{...a,z:obj.z}, b:{...b,z:obj.z} };
  }

  function counterweightZoneOverlapFraction(plank, item, worldX = item?.x, worldZ = item?.z) {
    const zone = counterweightZoneRestBounds(plank);
    if (!zone || !item || !Number.isFinite(worldX) || !Number.isFinite(worldZ)) return 0;
    const rest = counterweightWorldToRest(plank, worldX, item.y ?? plank.y);
    const halfW = Math.max(0.08, item.collision?.halfWidth ?? crateHalfWidth(item));
    const halfD = Math.max(0.08, (item.collision?.depth ?? 0.56) * 0.5);
    const minX = rest.x - halfW, maxX = rest.x + halfW;
    const minZ = worldZ - halfD, maxZ = worldZ + halfD;
    const overlapX = Math.max(0, Math.min(maxX,zone.maxX) - Math.max(minX,zone.minX));
    const overlapZ = Math.max(0, Math.min(maxZ,zone.maxZ) - Math.max(minZ,zone.minZ));

    // Path-locked puzzle logs cannot be meaningfully aimed in depth while being
    // carried, and the player is shown a 1D blue line. For those logs, make the
    // acceptance test the visible horizontal overlap. Free-depth objects still
    // use the full 2D footprint.
    if (item.gameplayLayerLocked !== false) {
      return overlapX / Math.max(0.0001, maxX-minX);
    }
    return (overlapX * overlapZ) / Math.max(0.0001, (maxX-minX) * (maxZ-minZ));
  }

  function counterweightPlankById(id) {
    if (!id) return null;
    return allSceneObjects().find(obj => !obj.deleted && obj.id === id && isCounterweightPlank(obj)) || null;
  }

  function boundCounterweightLogs(plank) {
    if (!plank) return [];
    return allSceneObjects().filter(obj => !obj.deleted && obj.counterweightBoundTo?.plankId === plank.id);
  }

  function unbindCounterweightLog(obj) {
    if (!obj?.counterweightBoundTo) return false;
    obj.counterweightBoundTo = null;
    obj.counterweightVisualAngle = 0;
    return true;
  }

  function bindCounterweightLog(plank, obj) {
    if (!plank || !obj || obj.carried || obj.counterweightBoundTo) return false;
    const mech = counterweightMechanism(plank);
    if (!mech || !plank.socketedTo || !objectHasBehaviour(obj,'stackable')) return false;
    if (plank.puzzleInstanceId && obj.puzzleInstanceId !== plank.puzzleInstanceId) return false;
    const threshold = Number(mech.minimumOverlap) || 0.50;
    if (counterweightZoneOverlapFraction(plank,obj) <= threshold + 0.0001) return false;

    const top = collisionTopHeightAtX(plank,obj.x);
    const directlyOnPlank = Number.isFinite(top) && Math.abs(obj.y - top) <= 0.22;
    const supportedByBoundLog = boundCounterweightLogs(plank).some(other => {
      if (other === obj) return false;
      const otherX = objectXNear(other,obj.x);
      if (Math.abs(otherX - obj.x) > STACK_COLUMN_ALIGN_TOLERANCE + 0.08) return false;
      return Math.abs((other.y + STACK_ITEM_HEIGHT) - obj.y) <= 0.18;
    });
    if (!directlyOnPlank && !supportedByBoundLog) return false;

    const pivot = counterweightPivotBaseWorld(plank);
    const angle = counterweightAngleFor(plank);
    const c = Math.cos(-angle), s = Math.sin(-angle);
    const dx = obj.x - pivot.x, dy = obj.y - pivot.y;
    obj.counterweightBoundTo = {
      plankId: plank.id,
      localX: dx * c - dy * s,
      localY: dx * s + dy * c,
      localZ: obj.z - plank.z
    };
    obj.counterweightVisualAngle = angle;
    return true;
  }

  function updateBoundCounterweightLog(plank,obj) {
    const bind = obj?.counterweightBoundTo;
    const pivot = counterweightPivotBaseWorld(plank);
    if (!bind || !pivot) return;
    const angle = counterweightAngleFor(plank);
    const c = Math.cos(angle), s = Math.sin(angle);
    obj.x = pivot.x + bind.localX * c - bind.localY * s;
    obj.y = pivot.y + bind.localX * s + bind.localY * c;
    obj.z = plank.z + bind.localZ;
    obj.counterweightVisualAngle = angle;
  }

  function refreshCounterweightBindings() {
    const objects = allSceneObjects();
    for (const obj of objects) {
      if (!obj.counterweightBoundTo) continue;
      const plank = counterweightPlankById(obj.counterweightBoundTo.plankId);
      if (!plank || !plank.socketedTo || obj.carried) unbindCounterweightLog(obj);
    }
    for (const plank of objects) {
      if (!isCounterweightPlank(plank) || plank.deleted || plank.carried || !plank.socketedTo) continue;
      for (const obj of objects) {
        if (obj === plank || obj.deleted || obj.carried || obj.counterweightBoundTo) continue;
        if (!objectHasBehaviour(obj,'stackable')) continue;
        bindCounterweightLog(plank,obj);
      }
    }
  }

  function counterweightPlayerLocalX(plank) {
    if (!plank || standingOnObject !== plank || jumping) return 0;
    const pivot = counterweightPivotBaseWorld(plank);
    if (!pivot) return 0;
    const feetY = character.y;
    const rest = counterweightWorldToRest(plank,character.x,feetY);
    return rest.x - pivot.x;
  }

  function updateCounterweightMechanisms(dt) {
    refreshCounterweightBindings();
    for (const plank of allSceneObjects()) {
      if (!isCounterweightPlank(plank) || plank.deleted || plank.carried) continue;
      if (plank.socketedTo && !socketLinkIsValid(plank)) {
        plank.socketedTo = null;
        plank.counterweightAngle = 0;
        plank.counterweightAngularVelocity = 0;
      }
      plank.counterweightAngle ||= 0;
      plank.counterweightAngularVelocity ||= 0;
      const mech = counterweightMechanism(plank);
      let targetAngle = 0;

      if (!editMode && plank.socketedTo) {
        const playerLocalX = counterweightPlayerLocalX(plank);
        const playerTorque = playerLocalX > 0 ? (Number(mech.playerWeight) || 1) * playerLocalX : 0;
        let counterTorque = 0;
        for (const log of boundCounterweightLogs(plank)) {
          const localX = Number(log.counterweightBoundTo?.localX) || 0;
          if (localX < 0) counterTorque += (Number(mech.logWeight) || 1.3) * (-localX);
        }
        const deficit = Math.max(0, playerTorque - counterTorque);

        // v1.0.27: the old balance curve let the player get too far out before
        // the plank developed enough angle to fail. A smaller torque scale and
        // slightly front-loaded curve make the first unsupported steps matter,
        // while counterweights still subtract their real leverage normally.
        const torqueScale = Math.max(0.42, (Number(mech.playerWeight) || 1) * 0.82);
        const rawTip = Rig.clamp(deficit / torqueScale, 0, 1);
        const tip01 = Math.pow(rawTip, 0.72);
        targetAngle = -((Number(mech.maxTipDeg) || 32) * Math.PI / 180) * tip01;
      }

      // Faster but still damped/constrained response: this is intentionally not
      // a free rigid-body simulation.
      const spring = 34;
      const damping = 6.0;
      plank.counterweightAngularVelocity += (targetAngle - plank.counterweightAngle) * spring * dt;
      plank.counterweightAngularVelocity *= Math.exp(-damping * dt);
      plank.counterweightAngle += plank.counterweightAngularVelocity * dt;

      const maxAngle = (Number(mech.maxTipDeg) || 28) * Math.PI / 180;
      plank.counterweightAngle = Rig.clamp(plank.counterweightAngle,-maxAngle,maxAngle);
      if (Math.abs(targetAngle) < 0.0001 && Math.abs(plank.counterweightAngle) < 0.0004 && Math.abs(plank.counterweightAngularVelocity) < 0.002) {
        plank.counterweightAngle = 0;
        plank.counterweightAngularVelocity = 0;
      }

      for (const log of boundCounterweightLogs(plank)) updateBoundCounterweightLog(plank,log);
    }
  }

  function counterweightPlankWalkable(obj) {
    const mech = counterweightMechanism(obj);
    if (!mech || !obj.socketedTo) return true;
    const fallAngle = (Number(mech.fallAngleDeg) || 12) * Math.PI / 180;
    return Math.abs(Number(obj.counterweightAngle) || 0) < fallAngle;
  }

  function counterweightPickupPoint(obj) {
    return isCounterweightPlank(obj) ? counterweightPivotBaseWorld(obj) : null;
  }

  let assetBehaviourOverrides = (() => {
    try {
      const raw = localStorage.getItem(ASSET_BEHAVIOUR_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.assets?.behaviourOverrides || {}));
  })();

  let assetCollisionDefaults = (() => {
    try {
      const raw = localStorage.getItem(ASSET_COLLISION_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.assets?.collisionDefaults || {}));
  })();


  const BUILTIN_ASSET_CLIMB_PATHS = Object.freeze({
    'mountain-climb-rock-01': [
      { id:'left', bottom:{x:-0.48,y:0.01}, top:{x:-0.39,y:0.72}, widthRatio:0.11 },
      { id:'right', bottom:{x:0.48,y:0.01}, top:{x:0.39,y:0.72}, widthRatio:0.11 }
    ],
    'mountain-cliff-01': [
      { id:'left', bottom:{x:-0.34,y:0.02}, top:{x:-0.30,y:0.74}, widthRatio:0.10 },
      { id:'right', bottom:{x:0.34,y:0.02}, top:{x:0.30,y:0.74}, widthRatio:0.10 }
    ],
    'mountain-cliff-02': [
      { id:'left', bottom:{x:-0.33,y:0.02}, top:{x:-0.30,y:0.76}, widthRatio:0.10 },
      { id:'right', bottom:{x:0.33,y:0.02}, top:{x:0.30,y:0.76}, widthRatio:0.10 }
    ],
    'mountain-cliff-03': [
      { id:'left', bottom:{x:-0.35,y:0.02}, top:{x:-0.30,y:0.73}, widthRatio:0.10 },
      { id:'right', bottom:{x:0.35,y:0.02}, top:{x:0.30,y:0.73}, widthRatio:0.10 }
    ],
    'mountain-cliff-04': [
      { id:'centre', bottom:{x:-0.02,y:0.02}, top:{x:0.00,y:0.82}, widthRatio:0.18 }
    ]
  });

  let assetClimbPathOverrides = (() => {
    try {
      const raw = localStorage.getItem(ASSET_CLIMB_PATH_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.assets?.climbPaths || {}));
  })();

  function cloneClimbPaths(paths) {
    return Array.isArray(paths) ? JSON.parse(JSON.stringify(paths)) : [];
  }

  function genericAssetClimbPath() {
    return { id:'path-1', bottom:{x:0,y:0.02}, top:{x:0,y:0.92}, widthRatio:0.12 };
  }

  function assetClimbPaths(assetName) {
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    if (Object.prototype.hasOwnProperty.call(assetClimbPathOverrides,settingsName)) return cloneClimbPaths(assetClimbPathOverrides[settingsName]);
    return cloneClimbPaths(BUILTIN_ASSET_CLIMB_PATHS[settingsName]);
  }

  function saveAssetClimbPaths() {
    try { localStorage.setItem(ASSET_CLIMB_PATH_STORAGE_KEY, JSON.stringify(assetClimbPathOverrides)); } catch (_) {}
  }


  // The cart collider deliberately ignores the long handles and follows the
  // box + low end steps. This lets the player reach a handle to start pushing,
  // and gives both ends a climbable profile rather than one tall rectangle.
  if (!Object.prototype.hasOwnProperty.call(assetCollisionDefaults,'handcart')) {
    assetCollisionDefaults.handcart = {
      halfWidthRatio:0.405,
      heightRatio:0.72,
      fixedHeight:null,
      depthRatio:0.20,
      points:[
        {x:-1.00,y:0.00},{x:-1.00,y:0.17},{x:-0.80,y:0.17},{x:-0.80,y:0.34},
        {x:-0.63,y:0.34},{x:-0.63,y:1.00},{x:0.63,y:1.00},{x:0.63,y:0.34},
        {x:0.80,y:0.34},{x:0.80,y:0.17},{x:1.00,y:0.17},{x:1.00,y:0.00}
      ],
      shapes:[{points:[
        {x:-1.00,y:0.00},{x:-1.00,y:0.17},{x:-0.80,y:0.17},{x:-0.80,y:0.34},
        {x:-0.63,y:0.34},{x:-0.63,y:1.00},{x:0.63,y:1.00},{x:0.63,y:0.34},
        {x:0.80,y:0.34},{x:0.80,y:0.17},{x:1.00,y:0.17},{x:1.00,y:0.00}
      ]}]
    };
  }
  if (!Object.prototype.hasOwnProperty.call(assetCollisionDefaults,'handcart-broken')) {
    assetCollisionDefaults['handcart-broken'] = JSON.parse(JSON.stringify(assetCollisionDefaults.handcart));
  }
  if (!Object.prototype.hasOwnProperty.call(assetCollisionDefaults,'cart-wheel-loose')) {
    assetCollisionDefaults['cart-wheel-loose'] = {
      halfWidthRatio:0.30,
      heightRatio:0.62,
      fixedHeight:null,
      depthRatio:0.20,
      points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],
      shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]
    };
  }
  if (!Object.prototype.hasOwnProperty.call(assetCollisionDefaults,'cart-wheel-ready')) {
    assetCollisionDefaults['cart-wheel-ready'] = JSON.parse(JSON.stringify(assetCollisionDefaults['cart-wheel-loose']));
  }

  // Built-in collider for the first mountain scenic-terrain prototype. The top
  // surface lands on the painted path, while both vertical sides remain solid
  // enough to read as a rock face until the climb action takes control.
  if (!Object.prototype.hasOwnProperty.call(assetCollisionDefaults,'mountain-climb-rock-01')) {
    assetCollisionDefaults['mountain-climb-rock-01'] = {
      halfWidthRatio:0.46,
      heightRatio:0.72,
      fixedHeight:null,
      depthRatio:0.15,
      points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],
      shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]
    };
  }
  const mountainCliffCollisionDefaults = {
    'mountain-cliff-01': { halfWidthRatio:0.44, heightRatio:0.74, depthRatio:0.16 },
    'mountain-cliff-02': { halfWidthRatio:0.45, heightRatio:0.76, depthRatio:0.16 },
    'mountain-cliff-03': { halfWidthRatio:0.45, heightRatio:0.73, depthRatio:0.16 },
    'mountain-cliff-04': { halfWidthRatio:0.43, heightRatio:0.82, depthRatio:0.16 }
  };
  Object.entries(mountainCliffCollisionDefaults).forEach(([assetName,profile]) => {
    if (Object.prototype.hasOwnProperty.call(assetCollisionDefaults,assetName)) return;
    assetCollisionDefaults[assetName] = {
      ...profile, fixedHeight:null,
      points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],
      shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]
    };
  });

  let assetStateProfiles = (() => {
    try {
      const raw = localStorage.getItem(ASSET_STATE_STORAGE_KEY);
      const parsed = raw !== null ? JSON.parse(raw || '{}') : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  })();

  function canonicalStateAssetName(assetName) {
    if (assetName === 'handcart-broken') return 'handcart';
    if (assetName === 'cart-wheel-ready') return 'cart-wheel-loose';
    return assetName;
  }

  function inferredAssetState(assetName) {
    if (assetName === 'handcart-broken') return 'broken';
    if (assetName === 'handcart') return 'repaired';
    return 'base';
  }

  function assetStateProfile(assetName, stateName = null) {
    const chosen = stateName || inferredAssetState(assetName);
    if (!chosen || chosen === 'base') return null;
    return assetStateProfiles?.[canonicalStateAssetName(assetName)]?.states?.[chosen] || null;
  }

  function rawBehaviourForStateSeed(assetName) {
    const defaults = ASSET_BEHAVIOUR_DEFAULTS[assetName] || EMPTY_ASSET_BEHAVIOURS;
    const overrides = assetBehaviourOverrides[assetName] || {};
    const merged = { ...EMPTY_ASSET_BEHAVIOURS, ...defaults, ...overrides };
    if (merged.carryable) merged.placeable = true;
    if (merged.supportSurface) merged.solid = true;
    if (merged.stackable) merged.placeable = true;
    if (merged.pushable) merged.solid = true;
    return merged;
  }

  function rawLayoutForStateSeed(assetName, fallback = {}) {
    const stored = assetLayoutDefaults?.[assetName] || {};
    return {
      ...(Number.isFinite(Number(stored.defaultHeight)) ? {defaultHeight:Number(stored.defaultHeight)} : {}),
      groundLine:Number.isFinite(Number(stored.groundLine)) ? Number(stored.groundLine) : (Number(ASSET_GROUND_LINE_DEFAULTS[assetName]) || 0),
      visualOffsetX:Number.isFinite(Number(stored.visualOffsetX)) ? Number(stored.visualOffsetX) : (Number(fallback.offsetX)||0),
      visualOffsetY:Number.isFinite(Number(stored.visualOffsetY)) ? Number(stored.visualOffsetY) : (Number(fallback.offsetY)||0),
      visualRotationDeg:Number.isFinite(Number(stored.visualRotationDeg)) ? Number(stored.visualRotationDeg) : (Number(fallback.rotationDeg)||0),
      visualFlip:!!stored.visualFlip
    };
  }

  function ensureBuiltInCartStates() {
    assetStateProfiles.handcart ||= { states:{} };
    assetStateProfiles.handcart.states ||= {};
    const states=assetStateProfiles.handcart.states;
    let changed=false;
    if (!states.broken) {
      states.broken={
        label:'Broken',
        layout:rawLayoutForStateSeed('handcart-broken',ASSET_VISUAL_DEFAULTS['handcart-broken']||{}),
        behaviour:rawBehaviourForStateSeed('handcart-broken'),
        collision:JSON.parse(JSON.stringify(assetCollisionDefaults['handcart-broken'] ?? null)),
        components:{rearWheel:true,frontWheel:false}
      }; changed=true;
    }
    if (!states.repaired) {
      states.repaired={
        label:'Repaired / Pushable',
        layout:rawLayoutForStateSeed('handcart',ASSET_VISUAL_DEFAULTS.handcart||{}),
        behaviour:rawBehaviourForStateSeed('handcart'),
        collision:JSON.parse(JSON.stringify(assetCollisionDefaults.handcart ?? null)),
        components:{rearWheel:true,frontWheel:true}
      }; changed=true;
    }
    if (!states.landed) {
      const points=[{x:-1,y:.59},{x:1,y:.59},{x:1,y:.72},{x:-1,y:.72}];
      states.landed={
        label:'Landed / Bridge',
        layout:{...rawLayoutForStateSeed('handcart',ASSET_VISUAL_DEFAULTS.handcart||{}),visualOffsetX:0,visualOffsetY:0,visualRotationDeg:0},
        behaviour:{...EMPTY_ASSET_BEHAVIOURS,solid:true,supportSurface:true,pushable:false},
        collision:{halfWidthRatio:.49,heightRatio:1,fixedHeight:null,depthRatio:.18,points:points.map(p=>({...p})),shapes:[{points:points.map(p=>({...p}))}]},
        components:{rearWheel:true,frontWheel:true}
      }; changed=true;
    }
    if(changed){ try{ localStorage.setItem(ASSET_STATE_STORAGE_KEY,JSON.stringify(assetStateProfiles)); }catch(_){} }
  }
  ensureBuiltInCartStates();

  function saveAssetCollisionDefaults() {
    try { localStorage.setItem(ASSET_COLLISION_STORAGE_KEY, JSON.stringify(assetCollisionDefaults)); } catch (_) {}
  }

  function objectIsStackAssetName(assetName) {
    return !!assetBehaviours(assetName)?.stackable;
  }

  function normalizeAssetCollision(collision, sx, sy, assetName) {
    if (!collision) return null;
    const safeSx = Math.max(0.001, Math.abs(Number(sx) || 1));
    const safeSy = Math.max(0.001, Math.abs(Number(sy) || 1));
    const shapes = normalisedCollisionShapes(collision).map(points => ({
      points:points.map(point => ({ x:Number(point.x)||0, y:Number(point.y)||0 }))
    }));
    return {
      halfWidthRatio: Math.max(0.01, Number(collision.halfWidth) || 0.01) / safeSx,
      heightRatio: objectIsStackAssetName(assetName) ? null : Math.max(0.01, Number(collision.height) || 0.01) / safeSy,
      fixedHeight: objectIsStackAssetName(assetName) ? STACK_ITEM_HEIGHT : null,
      depthRatio: Math.max(0.01, Number(collision.depth) || 0.01) / safeSx,
      points: shapes[0].points.map(point => ({...point})),
      shapes
    };
  }

  function collisionFromAssetDefault(assetName, sx, sy, stateName = null) {
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    const profile=assetStateProfile(assetName,stateName);
    const def = profile && Object.prototype.hasOwnProperty.call(profile,'collision') ? profile.collision : assetCollisionDefaults[settingsName];
    if (!def) return null;
    const width = Math.max(0.001, Math.abs(Number(sx) || 1));
    const height = Math.max(0.001, Math.abs(Number(sy) || 1));
    const sourceShapes = Array.isArray(def.shapes) && def.shapes.length
      ? def.shapes.filter(shape => Array.isArray(shape?.points) && shape.points.length >= 3)
      : [{ points:Array.isArray(def.points) && def.points.length >= 3 ? def.points : defaultCollisionPoints() }];
    const shapes = sourceShapes.map(shape => ({points:shape.points.map(point => ({...point}))}));
    return {
      halfWidth: Math.max(0.01, (Number(def.halfWidthRatio) || 0.4) * width),
      height: Number.isFinite(def.fixedHeight) ? Number(def.fixedHeight) : Math.max(0.01, (Number(def.heightRatio) || 0.6) * height),
      depth: Math.max(0.01, (Number(def.depthRatio) || 0.4) * width),
      platform: !!assetBehaviours(settingsName,stateName).supportSurface,
      points: shapes[0].points.map(point => ({...point})),
      shapes,
      behaviourGenerated: false,
      assetInherited: true,
      assetState:stateName || inferredAssetState(assetName)
    };
  }

  function hasAssetCollisionDefaultOverride(assetName, stateName = null) {
    const profile=assetStateProfile(assetName,stateName);
    if(profile && Object.prototype.hasOwnProperty.call(profile,'collision')) return true;
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    return Object.prototype.hasOwnProperty.call(assetCollisionDefaults, settingsName);
  }

  function hasAssetBehaviourProfile(assetName, stateName = null) {
    if(assetStateProfile(assetName,stateName)?.behaviour) return true;
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    return Object.prototype.hasOwnProperty.call(ASSET_BEHAVIOUR_DEFAULTS, settingsName) || Object.prototype.hasOwnProperty.call(assetBehaviourOverrides, settingsName);
  }

  function assetBehaviours(assetName, stateName = null) {
    const settingsName = assetName === 'cart-wheel-ready' ? 'cart-wheel-loose' : assetName;
    const defaults = ASSET_BEHAVIOUR_DEFAULTS[settingsName] || EMPTY_ASSET_BEHAVIOURS;
    const overrides = assetBehaviourOverrides[settingsName] || {};
    const profile=assetStateProfile(assetName,stateName);
    const merged = { ...EMPTY_ASSET_BEHAVIOURS, ...defaults, ...overrides, ...(profile?.behaviour || {}) };
    if (merged.carryable) merged.placeable = true;
    if (merged.supportSurface) merged.solid = true;
    if (merged.stackable) merged.placeable = true;
    if (merged.pushable) merged.solid = true;
    return merged;
  }

  function objectHasBehaviour(obj, key) {
    if (!obj || obj.deleted) return false;
    return !!assetBehaviours(obj.assetName,obj.assetState)[key];
  }

  function saveAssetBehaviourOverrides() {
    try { localStorage.setItem(ASSET_BEHAVIOUR_STORAGE_KEY, JSON.stringify(assetBehaviourOverrides)); } catch (_) {}
  }

  let sceneIdCounter = 0;
  let userSceneCounter = 0;

  const sceneData = (() => {
    try {
      const raw = localStorage.getItem(SCENE_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || 'null');
        if (parsed && [2,3,4,5,6].includes(parsed.version)) {
          parsed.version = 6;
          parsed.overrides ||= {};
          parsed.added ||= [];
          parsed.worldGroups ||= [];
          parsed.worldGroupTemplates ||= [];
          return parsed;
        }
      }
    } catch (_) {}
    const baked = BAKED_GAME_DESIGN?.scene?.edits;
    if (baked && [2,3,4,5,6].includes(baked.version)) {
      const parsed = JSON.parse(JSON.stringify(baked));
      parsed.version = 6;
      parsed.overrides ||= {};
      parsed.added ||= [];
      parsed.worldGroups ||= [];
      parsed.worldGroupTemplates ||= [];
      return parsed;
    }
    return { version: 6, overrides: {}, added: [], worldGroups: [], worldGroupTemplates: [] };
  })();

  function saveSceneData() {
    try { localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(sceneData)); } catch (_) {}
  }

  function classifyLayer(z) {
    if (z > 1.2) return 'foreground';
    if (z > -9) return 'near';
    if (z > -24) return 'mid';
    return 'far';
  }

  function cloneCollision(collision) {
    if (!collision) return null;
    return {
      ...collision,
      points: Array.isArray(collision.points)
        ? collision.points.map(point => ({ x: Number(point.x) || 0, y: Number(point.y) || 0 }))
        : null,
      shapes: Array.isArray(collision.shapes)
        ? collision.shapes.map(shape => ({
            ...shape,
            points: Array.isArray(shape?.points)
              ? shape.points.map(point => ({ x:Number(point.x) || 0, y:Number(point.y) || 0 }))
              : []
          })).filter(shape => shape.points.length >= 3)
        : null
    };
  }

  function defaultCollisionPoints() {
    return [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
  }

  function normalisedCollisionShapes(collision) {
    const shapes = collision?.shapes;
    if (Array.isArray(shapes) && shapes.length) {
      const valid = shapes
        .map(shape => Array.isArray(shape?.points) && shape.points.length >= 3 ? shape.points : null)
        .filter(Boolean);
      if (valid.length) return valid;
    }
    const pts = collision?.points;
    return [Array.isArray(pts) && pts.length >= 3 ? pts : defaultCollisionPoints()];
  }

  function normalisedCollisionPoints(collision) {
    return normalisedCollisionShapes(collision)[0];
  }

  function collisionShapeCount(collision) {
    return normalisedCollisionShapes(collision).length;
  }

  function selectedCollisionShapeIndex(collision) {
    return Rig.clamp(selectedCollisionShape, 0, Math.max(0, collisionShapeCount(collision) - 1));
  }

  function selectedCollisionShapePoints(collision) {
    return normalisedCollisionShapes(collision)[selectedCollisionShapeIndex(collision)] || defaultCollisionPoints();
  }

  function writeSelectedCollisionShape(collision, points) {
    if (!collision) return;
    const shapes = normalisedCollisionShapes(collision).map(shape => ({ points:shape.map(point => ({ ...point })) }));
    const index = selectedCollisionShapeIndex(collision);
    shapes[index] = { points:points.map(point => ({ ...point })) };
    collision.shapes = shapes;
    collision.points = shapes[0].points.map(point => ({ ...point }));
  }

  function behaviourNeedsCollision(behaviour) {
    return !!(behaviour?.solid || behaviour?.carryable || behaviour?.supportSurface || behaviour?.stackable || behaviour?.pushable);
  }

  function behaviourCollisionFor(assetName, width, height, existing = null, stateName = null) {
    const behaviour = assetBehaviours(assetName,stateName);
    const inherited = collisionFromAssetDefault(assetName, width, height,stateName);
    if (hasAssetCollisionDefaultOverride(assetName,stateName)) return inherited;
    if (inherited) return inherited;
    if (!hasAssetBehaviourProfile(assetName,stateName)) return cloneCollision(existing);
    let collision = cloneCollision(existing);
    if (!collision && behaviourNeedsCollision(behaviour)) {
      collision = {
        halfWidth: Math.max(0.18, width * CRATE_HALF_WIDTH_FACTOR),
        height: behaviour.stackable ? STACK_ITEM_HEIGHT : Math.max(0.24, height * CRATE_COLLISION_HEIGHT_FACTOR),
        depth: Math.max(0.46, Math.min(1.08, width * 0.42)),
        platform: !!behaviour.supportSurface,
        points: defaultCollisionPoints(),
        shapes: [{ points:defaultCollisionPoints() }],
        behaviourGenerated: true
      };
    }
    if (collision) collision.platform = !!behaviour.supportSurface;
    return collision;
  }

  function addObject(collection, type, x, z, width, height, opts = {}) {
    const resolvedHeight = height;
    const resolvedWidth = width ?? resolvedHeight * (assetAspect[type] || 1);
    const category = opts.category || 'dressing';
    const resolvedAssetState = opts.assetState || inferredAssetState(type);
    const obj = {
      id: opts.id || `proc-${++sceneIdCounter}`,
      mesh: billboardMesh,
      texture: textures[type],
      uvScale: opts.uvScale || assetUv[type]?.scale || [1, 1],
      uvOffset: opts.uvOffset || assetUv[type]?.offset || [0, 0],
      x,
      y: opts.y ?? groundY,
      z,
      sx: resolvedWidth,
      sy: resolvedHeight,
      baseSx: opts.baseSx ?? resolvedWidth,
      baseSy: opts.baseSy ?? resolvedHeight,
      sz: 1,
      flip: opts.flip ?? ((type.startsWith('tree') || type.startsWith('bridge-') || ['handcart','handcart-broken','cart-wheel-loose','cart-wheel-ready','axle-pin','mountain-climb-rock-01'].includes(type)) ? false : (rand() > 0.5)),
      shade: opts.shade ?? 1,
      opacity: opts.opacity ?? 1,
      noFog: typeof opts.noFog === 'boolean' ? opts.noFog : type === 'axle-pin',
      tint: opts.tint || null,
      asset: true,
      assetName: type,
      assetState: resolvedAssetState,
      groundLine: Rig.clamp(Number.isFinite(opts.groundLine) ? Number(opts.groundLine) : assetGroundLineDefault(type,resolvedAssetState), 0, 1),
      category,
      gameplayType: opts.gameplayType || null,
      gameplayLayerLocked: typeof opts.gameplayLayerLocked === 'boolean' ? opts.gameplayLayerLocked : category === 'gameplay',
      freePlacement: typeof opts.freePlacement === 'boolean' ? opts.freePlacement : defaultFreePlacement(type),
      layer: opts.layer || classifyLayer(z),
      // Only generated/procedural scenery may use world-tile wrapping.
      // Authored world placements and puzzle-owned objects are spatially unique.
      wrap: !opts.userAdded && !opts.puzzleInstanceId && opts.wrap !== false && type !== 'mountain-climb-rock-01',
      collision: opts.collisionOverride
        ? cloneCollision(opts.collision)
        : behaviourCollisionFor(type, resolvedWidth, resolvedHeight, opts.collision,resolvedAssetState),
      collisionOverride: !!opts.collisionOverride,
      shadow: opts.shadow ? { ...opts.shadow } : null,
      deleted: !!opts.deleted,
      carried: false,
      userAdded: !!opts.userAdded,
      // World Group ownership is persistent scene data. This must be copied at
      // object construction time so restored/template-spawned objects remain
      // members after a page reload.
      worldGroupId: opts.worldGroupId || null,
      puzzleInstanceId: opts.puzzleInstanceId || null,
      puzzleObjectId: opts.puzzleObjectId || null,
      sockets: Array.isArray(opts.sockets) ? opts.sockets.map(socket => ({ ...socket })) : [],
      socketedTo: opts.socketedTo ? { ...opts.socketedTo } : null,
      counterweightBoundTo: null,
      counterweightVisualAngle: 0,
      counterweightAngle: 0,
      counterweightAngularVelocity: 0,
      wheelRotation: Number(opts.wheelRotation) || 0,
      runtimeRotation: Number(opts.runtimeRotation) || 0,
      cartRailAnimating: !!opts.cartRailAnimating,
      cartRailLocked: !!opts.cartRailLocked,
      cartRailElapsed: Number(opts.cartRailElapsed) || 0,
      thoughtText: typeof opts.thoughtText === 'string' ? opts.thoughtText : '',
      thoughtRadius: Rig.clamp(Number(opts.thoughtRadius) || 1.4, 0.25, 8),
      thoughtOnce: opts.thoughtOnce !== false,
      cameraNodeRadius: Rig.clamp(Number(opts.cameraNodeRadius) || 4.0, 0.5, 20),
      cameraNodeOffsetX: Rig.clamp(Number(opts.cameraNodeOffsetX) || 0, -8, 8),
      cameraNodeOffsetY: Rig.clamp(Number(opts.cameraNodeOffsetY) || 0, -5, 5),
      cameraNodeOffsetZ: Rig.clamp(Number(opts.cameraNodeOffsetZ) || 0, -8, 8),
      cameraNodeCurveStart: cameraNodeCurveSetting(opts.cameraNodeCurveStart),
      cameraNodeCurveEnd: cameraNodeCurveSetting(opts.cameraNodeCurveEnd)
    };
    // Support/solid behaviour belongs to the asset, not to its editor library
    // category. This lets authored feature art such as bridge halves remain
    // puzzle dressing while still behaving as walkable/supporting geometry.
    if (obj.collision && hasAssetBehaviourProfile(type,resolvedAssetState)) {
      obj.collision.platform = !!assetBehaviours(type,resolvedAssetState).supportSurface;
    }
    collection.push(obj);
    return obj;
  }

  function scatterForest() {
    const trees = ['tree01', 'tree02', 'tree03', 'tree04', 'tree05', 'tree06', 'tree07', 'tree08'];
    const dressingDefs = {
      ground01: { family:'foliage', weight:1.34, hMin:1.00, hMax:1.34, radius:0.96, same:4.0, nearWeight:1.32, farWeight:1.56 },
      ground02: { family:'foliage', weight:1.12, hMin:1.26, hMax:1.68, radius:1.28, same:5.2, nearWeight:1.02, farWeight:1.16 },
      ground03: { family:'foliage', weight:1.08, hMin:1.18, hMax:1.62, radius:1.18, same:4.7, nearWeight:1.22, farWeight:1.04 },
      ground04: { family:'foliage', weight:1.04, hMin:1.18, hMax:1.64, radius:1.24, same:4.8, nearWeight:1.08, farWeight:1.18 },
      ground05: { family:'foliage', weight:0.72, hMin:0.98, hMax:1.28, radius:0.92, same:5.2, nearWeight:0.72, farWeight:1.42 },
      ground06: { family:'foliage', weight:1.10, hMin:1.16, hMax:1.56, radius:1.22, same:4.8, nearWeight:1.14, farWeight:1.06 },
      ground07: { family:'foliage', weight:0.72, hMin:0.86, hMax:1.10, radius:1.02, same:4.8, nearWeight:0.90, farWeight:1.22 },
      ground08: { family:'foliage',    weight:0.50, hMin:1.04, hMax:1.34, radius:1.34, same:5.8, nearWeight:0.76, farWeight:0.78 },
      ground09: { family:'rock', weight:0.82, hMin:0.80, hMax:1.00, radius:0.94, same:4.4, nearWeight:0.84, farWeight:1.62 },
      ground10: { family:'rock', weight:0.36, hMin:1.06, hMax:1.36, radius:1.28, same:5.8, nearWeight:0.68, farWeight:0.58 },
      ground11: { family:'foliage', weight:1.18, hMin:0.98, hMax:1.28, radius:0.94, same:4.0, nearWeight:1.28, farWeight:1.54 },
      ground12: { family:'foliage', weight:0.94, hMin:1.06, hMax:1.42, radius:1.08, same:4.4, nearWeight:1.12, farWeight:0.96 }
    };

    const placedTrees = [];
    const placedDressings = [];
    const nearestTreeZ = -(PATH_FLAT_HALF + 0.42); // pull some trunks closer so the run feels more inside the forest while preserving a clear gameplay strip.
    const treeGeneralSpacing = 2.95;
    const treeSameVariantSpacing = 12.5;
    const dressingGeneralSpacing = 0.82;
    const dressingFamilySpacing = { foliage:0.90, twig:0.84, rock:1.08 };

    function wrappedXDistance(a, b) {
      const raw = Math.abs(a - b);
      return Math.min(raw, Math.max(0, TILE_WIDTH - raw));
    }

    function planarDistance(a, x, z) {
      return Math.hypot(wrappedXDistance(a.x, x), a.z - z);
    }

    function canUseTreePosition(x, z) {
      return !placedTrees.some(tree => planarDistance(tree, x, z) < treeGeneralSpacing);
    }

    function chooseTreeVariant(x, z) {
      const start = Math.floor(rand() * trees.length);
      for (let offset = 0; offset < trees.length; offset++) {
        const type = trees[(start + offset) % trees.length];
        const tooClose = placedTrees.some(tree => tree.type === type && planarDistance(tree, x, z) < treeSameVariantSpacing);
        if (!tooClose) return type;
      }
      return null;
    }

    function addProceduralTree(x, z, baseHeight, index, shadeBase = 0.97, opacityBase = 0.94) {
      if (!canUseTreePosition(x, z)) return false;
      const type = chooseTreeVariant(x, z);
      if (!type) return false;
      const legacyHeight = baseHeight * PROCEDURAL_TREE_SCALE;
      const height = proceduralHeightFromAssetLab(type, legacyHeight, 8.2);
      const groundLine = assetGroundLineDefault(type);
      const obj = addObject(backdrop, type, x, z, null, height, {
        id: `forest263-${index}`,
        y: terrainVisibleGroundYAt(x, z) - groundLine * height,
        groundLine,
        shade: shadeBase + rand() * 0.09,
        opacity: opacityBase + rand() * (1.0 - opacityBase),
        layer: classifyLayer(z)
      });
      tagProceduralBiomeObject(obj,'woodland',obj.id);
      placedTrees.push({ x, z, type });
      return true;
    }

    // Main forest. Trees stay far-side only, while the nearer distribution and
    // repeat-spacing keep the player feeling inside the forest rather than
    // running next to a flat wallpaper line.
    let placed = 0;
    let attempts = 0;
    const targetMainTrees = 118;
    while (placed < targetMainTrees && attempts < 3600) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.40) {
        z = -(PATH_FLAT_HALF + 0.34 + Math.pow(rand(), 1.70) * 2.1);
      } else if (bandPick < 0.78) {
        z = nearestTreeZ - Math.pow(rand(), 1.42) * 5.0;
      } else {
        const depth = Math.pow(rand(), 1.12);
        z = nearestTreeZ - 0.6 - depth * 33.2;
      }
      z = Math.max(WORLD.farZ + 1.4, z);
      const depth01 = Math.min(1, Math.max(0, (-z - 4.0) / 35.0));
      const baseHeight = 10.0 + rand() * (7.9 - depth01 * 1.0);
      if (addProceduralTree(x, z, baseHeight, `main-${placed}`)) placed += 1;
    }

    let accents = 0;
    attempts = 0;
    const targetAccents = 24;
    while (accents < targetAccents && attempts < 1400) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -13.5 - rand() * 22.5;
      const baseHeight = 14.2 + rand() * 7.0;
      if (addProceduralTree(x, z, baseHeight, `accent-${accents}`, 0.99, 0.90)) accents += 1;
    }

    function pickWeightedDressing(side) {
      const sideKey = side > 0 ? 'nearWeight' : 'farWeight';
      const entries = Object.entries(dressingDefs);
      let total = 0;
      for (const [, def] of entries) total += def.weight * (def[sideKey] ?? 1);
      let pick = rand() * total;
      for (const [type, def] of entries) {
        pick -= def.weight * (def[sideKey] ?? 1);
        if (pick <= 0) return [type, def];
      }
      return entries[entries.length - 1];
    }

    function canUseDressingPosition(type, def, x, z, height) {
      const ownRadius = Math.max(dressingGeneralSpacing, def.radius * (0.78 + height * 0.16));
      for (const item of placedDressings) {
        const d = planarDistance(item, x, z);
        const familyMin = Math.max(dressingFamilySpacing[def.family] || dressingGeneralSpacing, dressingFamilySpacing[item.family] || dressingGeneralSpacing);
        const minDistance = Math.max(ownRadius, item.radius, familyMin);
        if (d < minDistance) return false;
        if (item.type === type && d < Math.max(def.same || 5.0, item.same || 5.0)) return false;
      }
      return true;
    }

    function addProceduralDressing(x, z, side, index) {
      const [type, def] = pickWeightedDressing(side);
      const edgeDistance = Math.max(0, Math.abs(z) - PATH_FLAT_HALF);
      const edge01 = Math.min(1, edgeDistance / 6.0);
      const scaleMul = 0.98 + rand() * 0.20 + edge01 * 0.24;
      const legacyHeight = (def.hMin + rand() * (def.hMax - def.hMin)) * scaleMul;
      const legacyDefault = (type === 'ground09' || type === 'ground04' || type === 'ground07') ? 0.88 : 0.82;
      const height = proceduralHeightFromAssetLab(type, legacyHeight, legacyDefault);
      if (!canUseDressingPosition(type, def, x, z, height)) return false;
      const obj = addObject(targetCollectionForZ(z), type, x, z, null, height, {
        id: `dressing263-${index}`,
        y: terrainVisibleGroundYAt(x, z),
        shade: 0.985 + rand() * 0.055,
        opacity: 0.95 + rand() * 0.05,
        layer: classifyLayer(z)
      });
      tagProceduralBiomeObject(obj,'woodland',obj.id);
      placedDressings.push({ x, z, type, family:def.family, radius:Math.max(dressingGeneralSpacing, def.radius * (0.74 + height * 0.15)), same:def.same || 5.0, obj });
      return true;
    }

    // Re-enable the path-edge foliage/rock pass with the updated authored art.
    // Dressing stays readable (no tiny sprites), fills tree gaps on the far side,
    // and comes in much closer on both edges so the run feels wrapped by foliage.
    let farPlaced = 0;
    attempts = 0;
    const farTarget = 236;
    while (farPlaced < farTarget && attempts < 10400) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.34) {
        z = -(PATH_FLAT_HALF + 0.10 + Math.pow(rand(), 1.72) * 1.9);
      } else if (bandPick < 0.86) {
        z = -(PATH_BERM_HALF + 0.02 + Math.pow(rand(), 1.18) * 6.5);
      } else {
        z = -(PATH_OUTER_HALF + 0.9 + Math.pow(rand(), 1.06) * 10.8);
      }
      z = Math.max(WORLD.farZ + 3.0, Math.min(-(PATH_FLAT_HALF + 0.08), z));
      if (addProceduralDressing(x, z, -1, `far-${farPlaced}`)) farPlaced += 1;
    }

    let farMicroPlaced = 0;
    attempts = 0;
    const farMicroTarget = 110;
    const farMicroTypes = ['ground01', 'ground05', 'ground07', 'ground09', 'ground11'];
    function addProceduralDressingSpecific(type, x, z, side, index, scaleMul = 1.0) {
      const def = dressingDefs[type];
      if (!def) return false;
      const legacyHeight = (def.hMin + rand() * (def.hMax - def.hMin)) * scaleMul;
      const legacyDefault = (type === 'ground09' || type === 'ground04' || type === 'ground07') ? 0.88 : 0.82;
      const baseHeight = proceduralHeightFromAssetLab(type, legacyHeight, legacyDefault);
      if (!canUseDressingPosition(type, def, x, z, baseHeight)) return false;
      const obj = addObject(targetCollectionForZ(z), type, x, z, null, baseHeight, {
        id: `dressing263-${index}`,
        y: terrainVisibleGroundYAt(x, z),
        shade: 0.985 + rand() * 0.055,
        opacity: 0.95 + rand() * 0.05,
        layer: classifyLayer(z)
      });
      tagProceduralBiomeObject(obj,'woodland',obj.id);
      placedDressings.push({ x, z, type, family:def.family, radius:Math.max(dressingGeneralSpacing, def.radius * (0.76 + baseHeight * 0.15)), same:def.same || 5.0 });
      return true;
    }
    while (farMicroPlaced < farMicroTarget && attempts < 3200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -(PATH_FLAT_HALF + 0.08 + Math.pow(rand(), 1.18) * 4.5);
      const type = farMicroTypes[Math.floor(rand() * farMicroTypes.length)];
      if (addProceduralDressingSpecific(type, x, z, -1, `far-micro-${farMicroPlaced}`, 0.94 + rand() * 0.22)) farMicroPlaced += 1;
    }

    let nearMicroPlaced = 0;
    attempts = 0;
    const nearMicroTarget = 42;
    const nearMicroTypes = ['ground01', 'ground05', 'ground09', 'ground11'];
    while (nearMicroPlaced < nearMicroTarget && attempts < 2200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = PATH_FLAT_HALF + 0.10 + Math.pow(rand(), 1.22) * 4.1;
      const type = nearMicroTypes[Math.floor(rand() * nearMicroTypes.length)];
      if (addProceduralDressingSpecific(type, x, z, 1, `near-micro-${nearMicroPlaced}`, 0.96 + rand() * 0.22)) nearMicroPlaced += 1;
    }

    let nearPlaced = 0;
    attempts = 0;
    const nearTarget = 208;
    while (nearPlaced < nearTarget && attempts < 8200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.28) {
        z = PATH_FLAT_HALF + 0.12 + Math.pow(rand(), 1.62) * 2.0;
      } else if (bandPick < 0.88) {
        z = PATH_BERM_HALF + 0.04 + Math.pow(rand(), 1.20) * 6.0;
      } else {
        z = PATH_OUTER_HALF + 0.84 + Math.pow(rand(), 1.08) * 7.2;
      }
      z = Math.min(WORLD.nearZ - 0.8, Math.max(PATH_FLAT_HALF + 0.10, z));
      if (addProceduralDressing(x, z, 1, `near-${nearPlaced}`)) nearPlaced += 1;
    }

    backdrop.sort((a, b) => a.z - b.z);
    midfill.sort((a, b) => a.z - b.z);
    frontOccluders.sort((a, b) => a.z - b.z);
  }

  let mountainBiomeCandidatesLoaded = false;
  let lastBiomeDatasetSignature = '';

  function scatterMountainBiomeCandidates() {
    refreshAssetLayoutDefaultsFromStorage();
    if (mountainBiomeCandidatesLoaded) return;
    const referencedBiomes=new Set([runtimeBiomeState.defaultBiome,...runtimeBiomeState.transitions.flatMap(item=>[item.from,item.to])]);
    const mountainReferenced=MOUNTAIN_PROCEDURAL_ASSET_NAMES.some(type=>referencedBiomes.has(runtimeBiomeOwner(type)));
    if (!mountainReferenced) return;
    mountainBiomeCandidatesLoaded = true;

    const defs = {
      'mountain-rock-01': { category:'rock', height:0.88, spacing:0.78 },
      'mountain-rock-02': { category:'rock', height:1.05, spacing:0.88 },
      'mountain-rock-03': { category:'rock', height:1.38, spacing:1.00 },
      'mountain-rock-04': { category:'rock', height:1.08, spacing:0.94 },
      'mountain-tree-01': { category:'tree', height:2.35, spacing:1.35 },
      'mountain-tree-02': { category:'tree', height:2.50, spacing:1.42 },
      'mountain-grass-01': { category:'grass', height:0.92, spacing:0.52 },
      'mountain-grass-02': { category:'grass', height:1.34, spacing:0.58 },
      'mountain-grass-03': { category:'grass', height:1.55, spacing:0.60 }
    };
    const random = mulberry32(0x4d4f554e); // "MOUN"; independent of woodland RNG.
    const placed = [];
    const minSection = Math.floor((TILE.minX + 5) / 10);
    const maxSection = Math.ceil((TILE.maxX + 5) / 10);

    function depthFor(def) {
      const far = def.category === 'tree' ? random() < 0.82 : random() < 0.55;
      let distance;
      if (def.category === 'tree') distance = PATH_BERM_HALF + 0.55 + Math.pow(random(), 0.92) * 8.4;
      else if (def.category === 'rock') distance = PATH_FLAT_HALF + 0.18 + Math.pow(random(), 1.15) * 6.7;
      else distance = PATH_FLAT_HALF + 0.10 + Math.pow(random(), 1.42) * 5.2;
      const z = far ? -distance : distance;
      return Math.max(WORLD.farZ + 1.4, Math.min(WORLD.nearZ - 0.7, z));
    }

    function candidateBlocked(x,z,spacing) {
      return placed.some(item => Math.abs(item.x-x) < (item.spacing+spacing)*0.72 && Math.abs(item.z-z) < (item.spacing+spacing)*0.58);
    }

    for (let sectionIndex = minSection; sectionIndex <= maxSection; sectionIndex += 1) {
      const sectionMin = Math.max(TILE.minX, sectionIndex * 10 - 5);
      const sectionMax = Math.min(TILE.maxX, sectionIndex * 10 + 5);
      if (sectionMax <= sectionMin) continue;
      for (const [type,def] of Object.entries(defs)) {
        const owner=runtimeBiomeOwner(type);
        if (owner===BIOME_GLOBAL_OWNER) continue;
        const poolCount = Math.max(0, Math.min(18, runtimeBiomeProfilePoolMax(owner, type)));
        for (let slot = 0; slot < poolCount; slot += 1) {
          let x=0,z=0,ok=false;
          for (let attempt=0; attempt<9; attempt+=1) {
            x = sectionMin + random() * (sectionMax-sectionMin);
            z = depthFor(def);
            if (!candidateBlocked(x,z,def.spacing)) { ok=true; break; }
          }
          if (!ok) continue;
          const authoredBaseHeight = proceduralHeightFromAssetLab(type, def.height, def.height);
          const height = authoredBaseHeight * (0.86 + random()*0.28);
          const groundLine = assetGroundLineDefault(type);
          const obj = addObject(targetCollectionForZ(z), type, x, z, null, height, {
            id:`biome-mountain-${sectionIndex}-${type}-${slot}`,
            y:terrainVisibleGroundYAt(x,z) - groundLine * height,
            groundLine,
            shade:0.985 + random()*0.035,
            opacity:0.97 + random()*0.03,
            layer:classifyLayer(z),
            category:'dressing',
            wrap:true
          });
          tagProceduralBiomeObject(obj,'mountain',obj.id,{candidatePool:true});
          placed.push({x,z,spacing:def.spacing});
        }
      }
    }
    backdrop.sort((a,b)=>a.z-b.z);
    midfill.sort((a,b)=>a.z-b.z);
    frontOccluders.sort((a,b)=>a.z-b.z);
  }

  function clearProceduralBiomeCandidates(owner) {
    const prune = collection => {
      for (let i = collection.length - 1; i >= 0; i -= 1) {
        const obj = collection[i];
        if (obj?.biomeCandidatePool && obj.biomeProceduralOwner === owner) collection.splice(i,1);
      }
    };
    prune(backdrop);
    prune(midfill);
    prune(frontOccluders);
    if (selectedObject?.biomeCandidatePool && selectedObject.biomeProceduralOwner === owner) {
      selectedObject = null;
      selectionCycleInfo = null;
    }
    if (owner === 'mountain') mountainBiomeCandidatesLoaded = false;
  }

  function updateBiomeDatasetStreaming(x) {
    if (PUZZLE_LAB_MODE) return;
    const active = runtimeLoadedBiomesAt(x);
    const signature = active.join('|');
    const wantsMountain = MOUNTAIN_PROCEDURAL_ASSET_NAMES.some(type=>active.includes(runtimeBiomeOwner(type)));
    if (wantsMountain && !mountainBiomeCandidatesLoaded) scatterMountainBiomeCandidates();
    else if (!wantsMountain && mountainBiomeCandidatesLoaded) clearProceduralBiomeCandidates('mountain');

    if (signature !== lastBiomeDatasetSignature) {
      lastBiomeDatasetSignature = signature;
      // The environment palette is also streamed logically: while editing it
      // exposes only the currently loaded biome pack(s), plus Global/Unbound.
      if (editMode && editorScope === 'environment' && typeof buildAssetPalette === 'function') buildAssetPalette();
    }
  }


  function refreshMountainProceduralSizingFromAssetLab() {
    if (!refreshAssetLayoutDefaultsFromStorage()) return false;
    const active=runtimeLoadedBiomesAt(character.x);
    const wantsMountain=MOUNTAIN_PROCEDURAL_ASSET_NAMES.some(type=>active.includes(runtimeBiomeOwner(type)));
    if (mountainBiomeCandidatesLoaded) clearProceduralBiomeCandidates('mountain');
    if (wantsMountain) scatterMountainBiomeCandidates();
    return true;
  }

  function readAssetLabJson(key, fallback = {}) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return JSON.parse(JSON.stringify(fallback || {}));
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' ? parsed : JSON.parse(JSON.stringify(fallback || {}));
    } catch (_) {
      return JSON.parse(JSON.stringify(fallback || {}));
    }
  }

  function refreshAssetLabAuthoringFromStorage({layout=true}={}) {
    // Asset Lab is the source of truth. iOS frequently restores Play from the
    // back/forward cache, so in-memory copies can otherwise remain stale even
    // though localStorage already contains the new settings.
    assetBehaviourOverrides = readAssetLabJson(
      ASSET_BEHAVIOUR_STORAGE_KEY,
      BAKED_GAME_DESIGN?.assets?.behaviourOverrides || {}
    );
    assetCollisionDefaults = readAssetLabJson(
      ASSET_COLLISION_STORAGE_KEY,
      BAKED_GAME_DESIGN?.assets?.collisionDefaults || {}
    );
    assetClimbPathOverrides = readAssetLabJson(
      ASSET_CLIMB_PATH_STORAGE_KEY,
      BAKED_GAME_DESIGN?.assets?.climbPaths || {}
    );
    assetMechanismDefaults = readAssetLabJson(ASSET_MECHANISM_STORAGE_KEY, {});
    assetSocketDefaults = readAssetLabJson(ASSET_SOCKET_STORAGE_KEY, {});
    assetStateProfiles = readAssetLabJson(ASSET_STATE_STORAGE_KEY, {});

    // Layout has its own snapshot-aware refresh because changing authored
    // mountain sizes requires rebuilding the procedural candidate pool.
    if (layout) refreshMountainProceduralSizingFromAssetLab();

    // Re-apply inherited behaviour/collision to all existing authored/runtime
    // objects. Per-instance collision overrides remain untouched.
    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted) continue;
      applyAssetBehaviourToObject(obj);
    }

    settleGameplayCrates();
    sortSceneCollections();

    if (editMode) {
      if (typeof buildAssetPalette === 'function') buildAssetPalette();
      if (typeof renderAssetSetup === 'function' && assetSetupName) renderAssetSetup();
      if (typeof updateEditorButtons === 'function') updateEditorButtons();
      if (typeof renderEnvironmentSelectionTools === 'function') renderEnvironmentSelectionTools({force:true});
    }
    return true;
  }

  const ASSET_LAB_REFRESH_KEYS = new Set([
    ASSET_LAYOUT_STORAGE_KEY,
    ASSET_BEHAVIOUR_STORAGE_KEY,
    ASSET_COLLISION_STORAGE_KEY,
    ASSET_CLIMB_PATH_STORAGE_KEY,
    ASSET_MECHANISM_STORAGE_KEY,
    ASSET_SOCKET_STORAGE_KEY,
    ASSET_STATE_STORAGE_KEY
  ]);

  // Returning from Asset Lab must behave like a live refresh. In particular,
  // Follow Surface Normal is read every draw from assetBehaviours(), so once the
  // in-memory behaviour table is refreshed an existing Ground object updates
  // immediately without being recreated or moved.
  window.addEventListener('pageshow', () => refreshAssetLabAuthoringFromStorage());
  window.addEventListener('storage', event => {
    if (ASSET_LAB_REFRESH_KEYS.has(event.key)) refreshAssetLabAuthoringFromStorage();
  });

  function allSceneObjects() {
    return [...backdrop, ...midfill, ...frontOccluders];
  }

  // -------------------------------------------------------------------------
  // PUZZLE GROUP RUNTIME
  // -------------------------------------------------------------------------
  const PUZZLE_STATE_STORAGE_KEY = PLAYER_MODE ? PLAYER_PUZZLE_STATE_STORAGE_KEY : (PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.runtime.v1' : 'sidescroll.puzzle-groups.state.v1');
  const PUZZLE_START_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.starts.v1' : 'sidescroll.puzzle-groups.starts.v1';
  const PUZZLE_LIBRARY_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.library.v1' : 'sidescroll.puzzle-groups.library.v1';
  const PUZZLE_WORKSHOP_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.workshop.v1' : 'sidescroll.puzzle-groups.workshop.v1';
  const INVENTORY_STORAGE_KEY = PLAYER_MODE ? PLAYER_INVENTORY_STORAGE_KEY : (PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.inventory.v1' : 'sidescroll.inventory.v1');
  const INVENTORY_ITEM_DEFS = {
    'forest-key': {
      id:'forest-key',
      label:'Forest Key',
      asset:'forest-key',
      description:'A puzzle reward. Item use will be added later.'
    },
    'axle-pin': {
      id:'axle-pin',
      label:'Axle Pin',
      asset:'axle-pin',
      image:'axle-pin.png',
      description:'A sturdy pin that looks like it belongs to a wheel.'
    }
  };
  const COLLECTIBLE_SETUP_STORAGE_KEY = 'sidescroll.collectibles.setup.v1';
  const COLLECTIBLE_DEFAULTS = {
    'forest-key': { label:'Forest Key', scale:1, spin:true },
    'axle-pin': { label:'Axle Pin', scale:1, spin:false }
  };
  let collectibleSetup = (() => {
    try {
      const raw = localStorage.getItem(COLLECTIBLE_SETUP_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || 'null');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.collectables?.setup || {}));
  })();
  function collectibleConfig(itemId) {
    return { ...(COLLECTIBLE_DEFAULTS[itemId] || { label:itemId, scale:1, spin:false }), ...(collectibleSetup[itemId] || {}) };
  }
  function saveCollectibleSetup() {
    try { localStorage.setItem(COLLECTIBLE_SETUP_STORAGE_KEY, JSON.stringify(collectibleSetup)); } catch (_) {}
  }
  function applyCollectibleConfigToLiveRewards(itemId) {
    const cfg = collectibleConfig(itemId);
    for (const instance of activePuzzleInstances.values()) {
      const obj = instance.rewardObject;
      if (!obj || obj.deleted || obj.collectibleItemId !== itemId) continue;
      const reward = completionRewardFor(instance) || {};
      const baseHeight = Number.isFinite(reward.height) ? reward.height : 0.62;
      obj.sy = baseHeight * Math.max(0.5, Number(cfg.scale) || 1);
      obj.sx = obj.sy * (assetAspect[obj.assetName] || 1);
      obj.collectibleSpin = !!cfg.spin;
    }
    renderInventory();
  }
  let inventoryState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || 'null');
      if (parsed && parsed.version === 1 && parsed.items && typeof parsed.items === 'object') return parsed;
    } catch (_) {}
    return { version:1, items:{} };
  })();
  let inventoryOpen = false;
  let inventoryFlashTimer = 0;
  let puzzleTestInventorySnapshot = null;
  const activePuzzleInstances = new Map();
  const puzzleSavedState = (() => {
    try { return JSON.parse(localStorage.getItem(PUZZLE_STATE_STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  })();
  const puzzleStartState = (() => {
    try {
      const raw = localStorage.getItem(PUZZLE_START_STORAGE_KEY);
      if (raw !== null) return JSON.parse(raw || '{}') || {};
    } catch (_) {}
    return PUZZLE_LAB_MODE ? {} : JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.puzzles?.savedStarts || {}));
  })();
  const userPuzzleLibrary = (() => {
    try {
      const raw = localStorage.getItem(PUZZLE_LIBRARY_STORAGE_KEY);
      const parsed = raw !== null
        ? (JSON.parse(raw || '{}') || {})
        : (PUZZLE_LAB_MODE ? { groups:{}, templates:{}, markers:[] } : JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.puzzles?.localLibrary || {})));
      parsed.groups ||= {};
      parsed.templates ||= {};
      parsed.markers ||= [];

      // Older authoring builds could leave repeated marker records behind.
      // Keep one marker per id, and also collapse accidental same-group markers
      // that occupy effectively the same world position.
      const seenIds = new Set();
      const normalized = [];
      for (const raw of parsed.markers) {
        if (!raw || !raw.id || !raw.group || !Number.isFinite(Number(raw.x))) continue;
        if (seenIds.has(raw.id)) continue;
        const marker = { ...raw, x:Number(raw.x), local:true, linkMode:raw.linkMode === 'copy' ? 'copy' : 'instance' };
        const spatialDuplicate = normalized.some(item => item.group === marker.group && Math.abs(item.x - marker.x) < 0.08);
        if (spatialDuplicate) continue;
        seenIds.add(marker.id);
        normalized.push(marker);
      }
      parsed.markers = normalized;
      return parsed;
    } catch (_) { return { groups:{}, templates:{}, markers:[] }; }
  })();
  const PUZZLE_ART_V2_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.art-v2' : 'sidescroll.puzzle-art-v2.migrated';
  const PUZZLE_ART_V2_ASPECT = {
    'puzzle-log-a': 1.345895020,
    'puzzle-log-b': 1.106194690,
    'puzzle-log-c': 1.345895020,
    'puzzle-log-d': 1.106194690,
    'fallen-tree': 1.346976744,
    'stone-wall': 1.895734597,
    'stone-piece-a': 1.094391245,
    'stone-piece-b': 0.992500000,
    'stone-piece-c': 1.062416999
  };
  const STONE_WALL_ASPECT = 1600 / 844;
  function correctPuzzleAssetWidth(assetName, width, height) {
    if (assetName === 'stone-wall' && Number.isFinite(Number(height))) return Number(height) * STONE_WALL_ASPECT;
    if (assetName === 'axle-pin' && Number.isFinite(Number(height))) return Number(height) * 2;
    return width;
  }
  function migratePuzzleArtV2Snapshot(snapshot) {
    if (!snapshot?.objects) return false;
    let changed = false;
    for (const state of Object.values(snapshot.objects)) {
      if (!state?.asset) continue;
      const aspect = PUZZLE_ART_V2_ASPECT[state.asset];
      if (!Number.isFinite(aspect)) continue;
      let sy = Number(state.sy);
      if (!Number.isFinite(sy)) continue;
      if (state.asset === 'fallen-tree' && sy < 3.45) sy = 3.45;
      if (state.asset === 'stone-wall' && sy < 3.40) sy = 3.40;
      state.sy = sy;
      state.sx = sy * aspect;
      state.flip = false;
      changed = true;
    }
    snapshot.assetArtVersion = 2;
    return changed;
  }
  function migratePuzzleArtV2() {
    try { if (localStorage.getItem(PUZZLE_ART_V2_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) startsChanged = migratePuzzleArtV2Snapshot(snapshot) || startsChanged;
    let libraryChanged = false;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) libraryChanged = migratePuzzleArtV2Snapshot(snapshot) || libraryChanged;
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    try { localStorage.setItem(PUZZLE_ART_V2_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV2();

  const PUZZLE_ART_V3_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.art-v3' : 'sidescroll.puzzle-art-v3.migrated';
  function migrateFallenTreeV3Objects(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed = false;
    for (const state of Object.values(objects)) {
      if (state?.asset !== 'fallen-tree') continue;
      state.sx = 6.029201331114809;
      state.sy = 2.550000000000000;
      state.flip = false;
      changed = true;
    }
    return changed;
  }
  function migratePuzzleArtV3() {
    try { if (localStorage.getItem(PUZZLE_ART_V3_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) {
      startsChanged = migrateFallenTreeV3Objects(snapshot?.objects) || startsChanged;
    }
    let libraryChanged = false;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) {
      libraryChanged = migrateFallenTreeV3Objects(snapshot?.objects) || libraryChanged;
    }
    let runtimeChanged = false;
    for (const runtime of Object.values(puzzleSavedState || {})) {
      runtimeChanged = migrateFallenTreeV3Objects(runtime?.objects) || runtimeChanged;
    }
    if (startsChanged) {
      try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {}
    }
    if (libraryChanged) {
      try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {}
    }
    if (runtimeChanged) {
      try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {}
    }
    try { localStorage.setItem(PUZZLE_ART_V3_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV3();

  const PUZZLE_ART_V4_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.art-v4' : 'sidescroll.puzzle-art-v4.stone-wall-remap';
  function remapStoneWallV4Objects(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed = false;
    const aspect = PUZZLE_ART_V2_ASPECT['stone-wall'];
    for (const state of Object.values(objects)) {
      if (state?.asset !== 'stone-wall') continue;
      let sy = Number(state.sy);
      if (!Number.isFinite(sy)) continue;
      if (sy < 3.40) sy = 3.40;
      const sx = sy * aspect;
      if (Math.abs(Number(state.sx) - sx) > 1e-6) { state.sx = sx; changed = true; }
      if (state.sy !== sy) { state.sy = sy; changed = true; }
      if (state.flip !== false) { state.flip = false; changed = true; }
    }
    return changed;
  }
  function migratePuzzleArtV4() {
    try { if (localStorage.getItem(PUZZLE_ART_V4_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) {
      startsChanged = remapStoneWallV4Objects(snapshot?.objects) || startsChanged;
    }
    let libraryChanged = false;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) {
      libraryChanged = remapStoneWallV4Objects(snapshot?.objects) || libraryChanged;
    }
    let runtimeChanged = false;
    for (const runtime of Object.values(puzzleSavedState || {})) {
      runtimeChanged = remapStoneWallV4Objects(runtime?.objects) || runtimeChanged;
    }
    if (startsChanged) {
      try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {}
    }
    if (libraryChanged) {
      try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {}
    }
    if (runtimeChanged) {
      try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {}
    }
    try { localStorage.setItem(PUZZLE_ART_V4_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV4();

  const PUZZLE_ART_V5_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.art-v5' : 'sidescroll.puzzle-art-v5.force-stone-wall-aspect';
  function forceStoneWallAspectV5(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed = false;
    for (const state of Object.values(objects)) {
      if (state?.asset !== 'stone-wall') continue;
      const sy = Math.max(3.40, Number(state.sy) || 3.75);
      const sx = sy * STONE_WALL_ASPECT;
      if (Math.abs((Number(state.sx) || 0) - sx) > 1e-6) { state.sx = sx; changed = true; }
      if (state.sy !== sy) { state.sy = sy; changed = true; }
    }
    return changed;
  }
  function migratePuzzleArtV5() {
    try { if (localStorage.getItem(PUZZLE_ART_V5_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false, libraryChanged = false, runtimeChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) startsChanged = forceStoneWallAspectV5(snapshot?.objects) || startsChanged;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) libraryChanged = forceStoneWallAspectV5(snapshot?.objects) || libraryChanged;
    for (const runtime of Object.values(puzzleSavedState || {})) runtimeChanged = forceStoneWallAspectV5(runtime?.objects) || runtimeChanged;
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    if (runtimeChanged) { try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {} }
    try { localStorage.setItem(PUZZLE_ART_V5_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV5();

  const CART_ORIENTATION_V1_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.cart-orientation-v1' : 'sidescroll.cart-orientation-v1.no-random-flip';
  const CART_ORIENTATION_ASSETS = new Set(['handcart','handcart-broken','cart-wheel-loose','cart-wheel-ready','axle-pin']);
  function resetLegacyCartFlips(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed = false;
    for (const state of Object.values(objects)) {
      if (!CART_ORIENTATION_ASSETS.has(state?.asset)) continue;
      if (state.flip !== false) { state.flip = false; changed = true; }
    }
    return changed;
  }
  function migrateLegacyCartOrientation() {
    try { if (localStorage.getItem(CART_ORIENTATION_V1_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged=false,libraryChanged=false,runtimeChanged=false,sceneChanged=false;
    for (const snapshot of Object.values(puzzleStartState || {})) startsChanged = resetLegacyCartFlips(snapshot?.objects) || startsChanged;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) libraryChanged = resetLegacyCartFlips(snapshot?.objects) || libraryChanged;
    for (const runtime of Object.values(puzzleSavedState || {})) runtimeChanged = resetLegacyCartFlips(runtime?.objects) || runtimeChanged;
    for (const saved of sceneData.added || []) {
      if (!CART_ORIENTATION_ASSETS.has(saved?.assetName)) continue;
      if (saved.flip !== false) { saved.flip=false; sceneChanged=true; }
    }
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    if (runtimeChanged) { try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {} }
    if (sceneChanged) saveSceneData();
    try { localStorage.setItem(CART_ORIENTATION_V1_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migrateLegacyCartOrientation();

  const CART_PLACEMENT_V1_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.cart-placement-v1' : 'sidescroll.cart-placement-v1.abandoned-off-path';
  const ABANDONED_REPAIR_ASSETS = new Set(['handcart-broken','cart-wheel-loose','cart-wheel-ready','axle-pin']);
  function unlockLegacyRepairProps(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed=false;
    for (const state of Object.values(objects)) {
      if (!ABANDONED_REPAIR_ASSETS.has(state?.asset)) continue;
      if (state.gameplayLayerLocked !== false) { state.gameplayLayerLocked=false; changed=true; }
    }
    return changed;
  }
  function migrateRepairPropPlacement() {
    try { if (localStorage.getItem(CART_PLACEMENT_V1_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged=false,libraryChanged=false,runtimeChanged=false,sceneChanged=false;
    for (const snapshot of Object.values(puzzleStartState || {})) startsChanged = unlockLegacyRepairProps(snapshot?.objects) || startsChanged;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) libraryChanged = unlockLegacyRepairProps(snapshot?.objects) || libraryChanged;
    for (const runtime of Object.values(puzzleSavedState || {})) runtimeChanged = unlockLegacyRepairProps(runtime?.objects) || runtimeChanged;
    for (const saved of sceneData.added || []) {
      if (!ABANDONED_REPAIR_ASSETS.has(saved?.assetName)) continue;
      if (saved.gameplayLayerLocked !== false) { saved.gameplayLayerLocked=false; sceneChanged=true; }
    }
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    if (runtimeChanged) { try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {} }
    if (sceneChanged) saveSceneData();
    try { localStorage.setItem(CART_PLACEMENT_V1_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migrateRepairPropPlacement();

  const puzzleWorkshopState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PUZZLE_WORKSHOP_STORAGE_KEY) || '{}') || {};
      return {
        isolated: !!parsed.isolated,
        clear: !!parsed.clear,
        markerId: typeof parsed.markerId === 'string' ? parsed.markerId : null
      };
    } catch (_) { return { isolated:false, clear:false, markerId:null }; }
  })();
  let puzzleTestMode = false;
  let puzzleTestMarkerId = null;
  let puzzleTestSnapshot = null;
  const puzzleStartDirty = new Set();
  const puzzleDraftBounds = Object.create(null);
  const puzzleRespawnDraft = Object.create(null);
  let puzzleRespawnEditMode = false;
  let puzzleRespawnHandle = null;
  const puzzleCartPathDraft = Object.create(null);
  let puzzleCartPathEditMode = false;
  let puzzleCartPathHandle = null;
  let puzzleCartPathPreviewT = 1;
  let puzzleCartPathPreviewPlaying = false;
  let lastPuzzleRespawnAt = 0;
  const PUZZLE_EXCLUSION_STORAGE_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.exclusions.v1' : 'sidescroll-puzzle-exclusions-v1';
  let puzzleExclusionState = {};
  try { puzzleExclusionState = JSON.parse(localStorage.getItem(PUZZLE_EXCLUSION_STORAGE_KEY) || '{}') || {}; } catch (_) { puzzleExclusionState = {}; }
  let puzzleExclusionEditMode = false;
  let puzzleExclusionHandle = null;
  // Puzzle edit layer: false = authored puzzle pieces, true = puzzle-owned environment dressing.
  // This is independent from addAssetType: choosing a layer does not itself enter placement.
  let puzzleEnvironmentPlacementMode = false;
  let puzzleWorkshopClear = PUZZLE_LAB_MODE ? false : puzzleWorkshopState.clear;
  let puzzleWorkshopIsolated = PUZZLE_LAB_MODE ? true : puzzleWorkshopState.isolated;

  function codeBoundsForDefinition(def) {
    if (def?.bounds) return { minX:def.bounds.minX, maxX:def.bounds.maxX };
    if (def?.exclusion) return { minX:def.exclusion.minX, maxX:def.exclusion.maxX };
    const half = Math.max(1.5, (def?.width ?? 8) * 0.5);
    return { minX:-half, maxX:half };
  }

  function codeBoundsForMarker(marker) {
    return codeBoundsForDefinition(markerDefinition(marker));
  }

  function currentPuzzleBoundsRelative(marker) {
    if (!marker) return { minX:-4, maxX:4 };
    if (puzzleDraftBounds[marker.id]) return puzzleDraftBounds[marker.id];
    const authored = markerLinkMode(marker) === 'copy'
      ? puzzleStartState[marker.id]?.bounds
      : (userPuzzleLibrary.templates?.[marker.group]?.bounds || puzzleStartState[marker.id]?.bounds);
    const initial = authored && Number.isFinite(authored.minX) && Number.isFinite(authored.maxX)
      ? { minX:authored.minX, maxX:authored.maxX }
      : codeBoundsForMarker(marker);
    puzzleDraftBounds[marker.id] = { ...initial };
    return puzzleDraftBounds[marker.id];
  }

  function savePuzzleExclusionState() {
    try { localStorage.setItem(PUZZLE_EXCLUSION_STORAGE_KEY, JSON.stringify(puzzleExclusionState)); } catch (_) {}
  }

  function defaultPuzzleExclusion(marker) {
    const def = markerDefinition(marker) || {};
    const legacy = def.exclusion;
    if (legacy && [legacy.minX, legacy.maxX, legacy.minZ, legacy.maxZ].every(Number.isFinite)) {
      return {
        enabled:true,
        centerX:(legacy.minX + legacy.maxX) * 0.5,
        centerZ:(legacy.minZ + legacy.maxZ) * 0.5,
        width:Math.max(1, legacy.maxX - legacy.minX),
        depth:Math.max(1, legacy.maxZ - legacy.minZ)
      };
    }
    const bounds = currentPuzzleBoundsRelative(marker);
    return {
      enabled:false,
      centerX:(bounds.minX + bounds.maxX) * 0.5,
      centerZ:0,
      width:Math.max(3, bounds.maxX - bounds.minX),
      depth:8.4
    };
  }

  function currentPuzzleExclusion(marker) {
    if (!marker) return { enabled:false, centerX:0, centerZ:0, width:8, depth:8 };
    const raw = puzzleExclusionState[marker.id];
    const fallback = defaultPuzzleExclusion(marker);
    if (!raw || typeof raw !== 'object') {
      puzzleExclusionState[marker.id] = { ...fallback };
      return puzzleExclusionState[marker.id];
    }
    const clean = {
      enabled: raw.enabled !== false,
      centerX: Number.isFinite(Number(raw.centerX)) ? Number(raw.centerX) : fallback.centerX,
      centerZ: Number.isFinite(Number(raw.centerZ)) ? Number(raw.centerZ) : fallback.centerZ,
      width: Math.max(1, Number.isFinite(Number(raw.width)) ? Number(raw.width) : fallback.width),
      depth: Math.max(1, Number.isFinite(Number(raw.depth)) ? Number(raw.depth) : fallback.depth)
    };
    puzzleExclusionState[marker.id] = clean;
    return clean;
  }

  function puzzleExclusionWorldBounds(marker) {
    const ex = currentPuzzleExclusion(marker);
    const centerX = marker.x + ex.centerX;
    return {
      enabled:ex.enabled,
      centerX,
      centerZ:ex.centerZ,
      width:ex.width,
      depth:ex.depth,
      minX:centerX-ex.width*0.5,
      maxX:centerX+ex.width*0.5,
      minZ:ex.centerZ-ex.depth*0.5,
      maxZ:ex.centerZ+ex.depth*0.5
    };
  }

  function defaultPuzzleRespawn(marker) {
    const bounds = currentPuzzleBoundsRelative(marker);
    const spawnX = bounds.minX + Math.min(1.25, Math.max(0.70, (bounds.maxX - bounds.minX) * 0.14));
    let zoneCenterX = (bounds.minX + bounds.maxX) * 0.5;
    let zoneWidth = Math.max(2.5, Math.min(7.0, (bounds.maxX - bounds.minX) * 0.72));
    let triggerOffsetY = -0.90;
    const worldCentreX = marker.x + zoneCenterX;
    const ownedRiver = puzzleWorldModifiersReady
      ? resolvedPuzzleWorldModifiers().find(mod => mod?.type === 'river' && mod.markerId === marker.id)
      : null;
    if (ownedRiver) {
      const p = puzzleRiverProfileAtZ(ownedRiver, pathZ);
      zoneCenterX = p.centre - marker.x;
      zoneWidth = Math.max(2.2, Math.min(8.5, (p.rightToe - p.leftToe) + 0.75));
      triggerOffsetY = (p.waterY + 0.12) - playSurfaceYAt(p.centre);
    } else {
      const sectionIndex = terrainSectionIndexAt(worldCentreX);
      if (terrainSectionType(sectionIndex) === 'river') {
        const p = riverProfileAtZ(sectionIndex, pathZ);
        zoneCenterX = p.centre - marker.x;
        zoneWidth = Math.max(2.2, Math.min(8.5, (p.rightToe - p.leftToe) + 0.75));
        triggerOffsetY = (p.waterY + 0.12) - playSurfaceYAt(p.centre);
      }
    }
    return { enabled:false, spawnX, spawnZ:pathZ, zoneCenterX, zoneCenterZ:pathZ, width:zoneWidth, depth:5.6, triggerOffsetY };
  }

  function normalisePuzzleRespawn(marker, raw = null) {
    const fallback = defaultPuzzleRespawn(marker);
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
      enabled: source.enabled === true,
      spawnX: Number.isFinite(Number(source.spawnX)) ? Number(source.spawnX) : fallback.spawnX,
      spawnZ: Number.isFinite(Number(source.spawnZ)) ? Number(source.spawnZ) : fallback.spawnZ,
      zoneCenterX: Number.isFinite(Number(source.zoneCenterX)) ? Number(source.zoneCenterX) : fallback.zoneCenterX,
      zoneCenterZ: Number.isFinite(Number(source.zoneCenterZ)) ? Number(source.zoneCenterZ) : fallback.zoneCenterZ,
      width: Math.max(0.8, Number.isFinite(Number(source.width)) ? Number(source.width) : fallback.width),
      depth: Math.max(0.8, Number.isFinite(Number(source.depth)) ? Number(source.depth) : fallback.depth),
      triggerOffsetY: Rig.clamp(Number.isFinite(Number(source.triggerOffsetY)) ? Number(source.triggerOffsetY) : fallback.triggerOffsetY, -4.5, 0.5)
    };
  }

  function currentPuzzleRespawn(marker) {
    if (!marker) return null;
    if (!puzzleRespawnDraft[marker.id]) {
      const runtimeDraft = puzzleSavedState?.[marker.id]?.respawnDraft || null;
      const start = puzzleStartFor(marker);
      puzzleRespawnDraft[marker.id] = normalisePuzzleRespawn(marker, runtimeDraft || start?.respawn || null);
    }
    return puzzleRespawnDraft[marker.id];
  }

  function savePuzzleRespawnDraft(marker) {
    if (!marker) return;
    const cfg = currentPuzzleRespawn(marker);
    const runtime = savedPuzzleFor(marker.id);
    runtime.respawnDraft = deepCopy(cfg);
    if (typeof editMode !== 'undefined' && editMode && !puzzleTestMode) puzzleStartDirty.add(marker.id);
    savePuzzleState();
  }

  function puzzleRespawnWorld(marker) {
    const cfg = currentPuzzleRespawn(marker);
    if (!marker || !cfg) return null;
    const centerX = marker.x + cfg.zoneCenterX;
    const centerZ = cfg.zoneCenterZ;
    const triggerY = playSurfaceYAt(centerX) + cfg.triggerOffsetY;
    return { ...cfg, centerX, centerZ, triggerY, minX:centerX-cfg.width*0.5, maxX:centerX+cfg.width*0.5, minZ:centerZ-cfg.depth*0.5, maxZ:centerZ+cfg.depth*0.5, spawnWorldX:marker.x+cfg.spawnX, spawnWorldZ:cfg.spawnZ };
  }

  function cartObjectForInstance(instance) {
    if (!instance) return null;
    return instance.objects.find(obj => obj && !obj.deleted && (obj.assetName === 'handcart' || obj.assetName === 'handcart-broken')) || null;
  }

  function defaultPuzzleCartPath(marker) {
    const instance = marker ? activePuzzleInstances.get(marker.id) : null;
    const cart = cartObjectForInstance(instance);
    const cartX = cart?.x ?? marker?.x ?? 0;
    const cartSy = cart?.sy ?? 1.75;
    const cartGroundLine = cart ? objectGroundLine(cart) : assetGroundLineDefault('handcart');
    const startY = playSurfaceYAt(cartX) - cartGroundLine * cartSy;
    const direction = 1;
    const startRelX = cartX - (marker?.x ?? 0) + direction * 1.25;
    const landRelX = startRelX + direction * 3.6;
    const landWorldX = (marker?.x ?? 0) + landRelX;
    const landY = playSurfaceYAt(landWorldX) - cartGroundLine * cartSy - 0.35;
    return {
      enabled:false,
      duration:2.75,
      timingVersion:3,
      speedProfileVersion:1,
      speedStart:0.70,
      speedMid:1.40,
      speedEnd:0.55,
      finalRotationDeg:-8,
      start:{ x:startRelX, y:startY, z:pathZ },
      c1:{ x:startRelX + direction * 1.05, y:startY + 0.04, z:pathZ },
      c2:{ x:landRelX - direction * 0.85, y:landY + 0.55, z:pathZ },
      land:{ x:landRelX, y:landY, z:pathZ }
    };
  }

  function normalisePuzzleCartPath(marker, raw = null) {
    const fallback = defaultPuzzleCartPath(marker);
    const source = raw && typeof raw === 'object' ? raw : {};
    const cleanPoint = (point, fallbackPoint) => ({
      x:Number.isFinite(Number(point?.x)) ? Number(point.x) : fallbackPoint.x,
      y:Number.isFinite(Number(point?.y)) ? Number(point.y) : fallbackPoint.y,
      z:Number.isFinite(Number(point?.z)) ? Number(point.z) : fallbackPoint.z
    });
    const sourceDuration = Number.isFinite(Number(source.duration)) ? Number(source.duration) : fallback.duration;
    // v1.0.46 migration: the first rail prototype defaulted to 1.05 s, which
    // made a cart pushed at ~0.9 m/s suddenly shoot through a multi-metre rail.
    // There was no duration UI in those builds, so an untouched legacy default
    // can safely migrate to the calmer authored default.
    const migratedDuration = !Number.isFinite(Number(source.timingVersion)) && Math.abs(sourceDuration - 1.05) < 0.08
      ? fallback.duration
      : sourceDuration;
    return {
      enabled:source.enabled === true,
      duration:Rig.clamp(migratedDuration, 0.75, 8.0),
      timingVersion:3,
      speedProfileVersion:1,
      speedStart:Rig.clamp(Number.isFinite(Number(source.speedStart)) ? Number(source.speedStart) : fallback.speedStart, 0.20, 3.00),
      speedMid:Rig.clamp(Number.isFinite(Number(source.speedMid)) ? Number(source.speedMid) : fallback.speedMid, 0.20, 3.00),
      speedEnd:Rig.clamp(Number.isFinite(Number(source.speedEnd)) ? Number(source.speedEnd) : fallback.speedEnd, 0.20, 3.00),
      finalRotationDeg:Rig.clamp(Number.isFinite(Number(source.finalRotationDeg)) ? Number(source.finalRotationDeg) : fallback.finalRotationDeg, -85, 85),
      start:cleanPoint(source.start, fallback.start),
      c1:cleanPoint(source.c1, fallback.c1),
      c2:cleanPoint(source.c2, fallback.c2),
      land:cleanPoint(source.land, fallback.land)
    };
  }

  function currentPuzzleCartPath(marker) {
    if (!marker) return null;
    if (!puzzleCartPathDraft[marker.id]) {
      const runtimeDraft = puzzleSavedState?.[marker.id]?.cartPathDraft || null;
      const start = puzzleStartFor(marker);
      puzzleCartPathDraft[marker.id] = normalisePuzzleCartPath(marker, runtimeDraft || start?.cartPath || null);
    }
    return puzzleCartPathDraft[marker.id];
  }

  function savePuzzleCartPathDraft(marker) {
    if (!marker) return;
    const cfg = currentPuzzleCartPath(marker);
    const runtime = savedPuzzleFor(marker.id);
    runtime.cartPathDraft = deepCopy(cfg);
    if (typeof editMode !== 'undefined' && editMode && !puzzleTestMode) puzzleStartDirty.add(marker.id);
    savePuzzleState();
  }

  function puzzleCartPathWorld(marker) {
    const cfg = currentPuzzleCartPath(marker);
    if (!marker || !cfg) return null;
    const toWorld = p => ({ x:marker.x + p.x, y:p.y, z:p.z });
    return { ...cfg, start:toWorld(cfg.start), c1:toWorld(cfg.c1), c2:toWorld(cfg.c2), land:toWorld(cfg.land) };
  }

  function cubicBezierPoint(a,b,c,d,t) {
    const u=1-t, u2=u*u, t2=t*t;
    return {
      x:u2*u*a.x + 3*u2*t*b.x + 3*u*t2*c.x + t2*t*d.x,
      y:u2*u*a.y + 3*u2*t*b.y + 3*u*t2*c.y + t2*t*d.y,
      z:u2*u*a.z + 3*u2*t*b.z + 3*u*t2*c.z + t2*t*d.z
    };
  }

  function approximateCubicBezierLength(a,b,c,d,steps=40) {
    let total=0;
    let prev=a;
    for(let i=1;i<=steps;i++){
      const point=cubicBezierPoint(a,b,c,d,i/steps);
      total += Math.hypot(point.x-prev.x, point.y-prev.y, point.z-prev.z);
      prev=point;
    }
    return total;
  }

  function approximateCubicBezierTravel(a,b,c,d,t,steps=32) {
    const endT=Rig.clamp(Number(t)||0,0,1);
    if(endT<=0)return 0;
    let total=0;
    let prev=a;
    const count=Math.max(2,Math.ceil(steps*endT));
    for(let i=1;i<=count;i++){
      const point=cubicBezierPoint(a,b,c,d,endT*(i/count));
      total += Math.hypot(point.x-prev.x, point.y-prev.y, point.z-prev.z);
      prev=point;
    }
    return total;
  }

  function cartPathSpeedMultiplier(path, distanceFraction) {
    const s=Rig.clamp(Number(distanceFraction)||0,0,1);
    const a=Rig.clamp(Number(path?.speedStart)||1,0.20,3.00);
    const b=Rig.clamp(Number(path?.speedMid)||1,0.20,3.00);
    const c=Rig.clamp(Number(path?.speedEnd)||1,0.20,3.00);
    if(s<=0.5){
      const q=smooth01(s*2);
      return Rig.lerp(a,b,q);
    }
    const q=smooth01((s-0.5)*2);
    return Rig.lerp(b,c,q);
  }

  // Convert elapsed-time progress into spline progress using an authored
  // velocity profile along physical path length.  The total authored duration
  // is preserved; START/MID/END only redistribute that time along the rail.
  function cartPathTimedState(path, rawTimeT, steps=56) {
    const raw=Rig.clamp(Number(rawTimeT)||0,0,1);
    const count=Math.max(16,steps|0);
    const samples=[{t:0,point:path.start,dist:0,timeWeight:0}];
    let prev=path.start,totalLength=0;
    for(let i=1;i<=count;i++){
      const t=i/count;
      const point=cubicBezierPoint(path.start,path.c1,path.c2,path.land,t);
      totalLength += Math.hypot(point.x-prev.x,point.y-prev.y,point.z-prev.z);
      samples.push({t,point,dist:totalLength,timeWeight:0});
      prev=point;
    }
    if(totalLength<0.0001)return {t:raw,distanceFraction:raw,speedMultiplier:1,totalLength:0};
    let totalWeight=0;
    for(let i=1;i<samples.length;i++){
      const p0=samples[i-1],p1=samples[i];
      const ds=p1.dist-p0.dist;
      const distanceFraction=((p0.dist+p1.dist)*0.5)/totalLength;
      const speed=Math.max(0.05,cartPathSpeedMultiplier(path,distanceFraction));
      totalWeight += ds/speed;
      p1.timeWeight=totalWeight;
    }
    const target=raw*totalWeight;
    let hi=1;
    while(hi<samples.length && samples[hi].timeWeight<target)hi++;
    if(hi>=samples.length)hi=samples.length-1;
    const lo=Math.max(0,hi-1);
    const a=samples[lo],b=samples[hi];
    const span=Math.max(0.000001,b.timeWeight-a.timeWeight);
    const q=Rig.clamp((target-a.timeWeight)/span,0,1);
    const t=Rig.lerp(a.t,b.t,q);
    const dist=Rig.lerp(a.dist,b.dist,q);
    const distanceFraction=Rig.clamp(dist/totalLength,0,1);
    return {t,distanceFraction,speedMultiplier:cartPathSpeedMultiplier(path,distanceFraction),totalLength};
  }

  function updateCartPathPreview(dt) {
    if(!puzzleCartPathPreviewPlaying)return;
    if(!editMode || editorScope!=='puzzle' || !puzzleCartPathEditMode){puzzleCartPathPreviewPlaying=false;return;}
    const instance=selectedPuzzleInstance();
    if(!instance){puzzleCartPathPreviewPlaying=false;return;}
    const path=currentPuzzleCartPath(instance.marker);
    const duration=Math.max(0.75,Number(path?.duration)||2.75);
    puzzleCartPathPreviewT += dt/duration;
    if(puzzleCartPathPreviewT>=1){puzzleCartPathPreviewT=1;puzzleCartPathPreviewPlaying=false;}
  }

  function pathPlanePointFromClient(clientX, clientY, z = pathZ) {
    const ray = cameraRayFromClient(clientX, clientY);
    if (Math.abs(ray.dir[2]) < 0.0001) return null;
    const t = (z - ray.eye[2]) / ray.dir[2];
    if (t <= 0) return null;
    return { x:ray.eye[0] + ray.dir[0] * t, y:ray.eye[1] + ray.dir[1] * t, z };
  }

  function applyPersistedMarkerPositions() {
    for (const marker of puzzleConfig.markers || []) {
      const savedX = Number(puzzleSavedState?.[marker.id]?.markerX);
      if (Number.isFinite(savedX)) marker.x = savedX;
    }
    if (puzzleWorldModifiersReady) invalidatePuzzleWorldModifierMeshes();
  }

  function persistPuzzleMarkerPosition(marker) {
    if (!marker || !Number.isFinite(Number(marker.x))) return;
    if (markerIsUserCreated(marker)) {
      const stored = (userPuzzleLibrary.markers || []).find(item => item.id === marker.id);
      if (stored) stored.x = Number(marker.x);
      savePuzzleLibrary();
    } else {
      const state = savedPuzzleFor(marker.id);
      state.markerX = Number(marker.x);
      savePuzzleState();
    }
  }

  function captureEnvironmentAnchorsForPuzzleMove(marker, nextX) {
    const target = Number(nextX);
    const dx = target - (Number(marker?.x) || 0);
    const raw = rawPuzzleWorldModifiersForMarker(marker);
    let minX = Infinity, maxX = -Infinity;
    for (const item of raw) {
      if (item?.type !== 'river') continue;
      const currentMod = { ...item, worldCenterX:(Number(marker.x)||0) + (Number(item.centerX)||0) };
      const nextMod = { ...item, worldCenterX:target + (Number(item.centerX)||0) };
      for (const extent of [puzzleRiverExtent(currentMod), puzzleRiverExtent(nextMod)]) {
        minX = Math.min(minX, extent.minX - 0.25);
        maxX = Math.max(maxX, extent.maxX + 0.25);
      }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return [];
    const anchors = [];
    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted || obj.carried || obj.puzzleInstanceId === marker.id) continue;
      if (obj.category !== 'dressing' || objectUsesFreePlacement(obj)) continue;
      if (obj.x < minX || obj.x > maxX) continue;
      const authored = !!obj.userAdded || !!sceneData.overrides?.[obj.id];
      anchors.push({ obj, floorOffset:authored ? objectFloorOffsetFromTerrain(obj) : 0 });
    }
    return anchors;
  }

  function restoreEnvironmentAnchorsAfterPuzzleMove(anchors) {
    for (const item of anchors || []) {
      const obj = item?.obj;
      if (!obj || obj.deleted || objectUsesFreePlacement(obj)) continue;
      setObjectFloorOffset(obj, Number(item.floorOffset) || 0);
      moveObjectToCorrectCollection(obj);
    }
  }

  function movePuzzleMarkerTo(marker, nextX) {
    if (!marker || !Number.isFinite(Number(nextX))) return false;
    const target = Number(nextX);
    const previous = Number(marker.x) || 0;
    const dx = target - previous;
    if (Math.abs(dx) < 0.000001) return false;

    const environmentAnchors = captureEnvironmentAnchorsForPuzzleMove(marker, target);
    const instance = activePuzzleInstances.get(marker.id);
    const objectAnchors = new Map();
    const localXByObject = new Map();
    if (instance) {
      // Capture local coordinates before moving the marker, then rebuild world X
      // from those locals after the move. Using assignment rather than += makes
      // marker moves idempotent even if an object reference is present more than
      // once in an instance list or another authoring path has touched it.
      for (const obj of new Set(instance.objects || [])) {
        if (!obj) continue;
        localXByObject.set(obj, (Number(obj.x) || 0) - previous);
        if (!objectUsesFreePlacement(obj)) objectAnchors.set(obj, objectFloorOffsetFromTerrain(obj));
      }
      removePuzzleModifierDressing(instance);
    }

    // Runtime state is stored in world-space. Preserve its local X separately so
    // it cannot accumulate the marker delta twice across move/save/reload cycles.
    const runtime = puzzleSavedState?.[marker.id]?.objects;
    const runtimeLocalX = new Map();
    if (runtime) {
      for (const [objectId, state] of Object.entries(runtime)) {
        if (state && Number.isFinite(Number(state.x))) runtimeLocalX.set(objectId, Number(state.x) - previous);
      }
    }

    marker.x = target;
    if (instance) {
      for (const [obj, localX] of localXByObject) obj.x = target + localX;
      instance.marker = marker;
    }

    if (runtime) {
      for (const [objectId, localX] of runtimeLocalX) {
        const state = runtime[objectId];
        if (state) state.x = target + localX;
      }
    }

    invalidatePuzzleWorldModifierMeshes();

    // Re-ground anything whose supporting terrain changed. Puzzle props preserve
    // their authored floor offset; procedural world dressing snaps to the new
    // terrain, while deliberately authored environment offsets are preserved.
    if (instance) {
      for (const [obj, floorOffset] of objectAnchors) setObjectFloorOffset(obj, floorOffset);
      rebuildPuzzleWorldModifierDressing(instance);
      for (const obj of instance.objects || []) {
        if (!obj?.puzzleObjectId) continue;
        const state = runtime?.[obj.puzzleObjectId];
        if (!state) continue;
        state.y = obj.y;
        state.terrainOffset = obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
        state.floorOffset = objectFloorOffsetFromTerrain(obj);
      }
    }
    restoreEnvironmentAnchorsAfterPuzzleMove(environmentAnchors);
    sortSceneCollections();
    if (typeof settleGameplayCrates === 'function') settleGameplayCrates();
    return true;
  }

  function savePuzzleState() {
    if (PLAYER_MODE) savePlayerPosition(true);
    // Test runs are disposable.  They may mutate the in-memory state, but the
    // authored start remains the durable source of truth for Reset/Test.
    if (puzzleTestMode) return;
    try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {}
  }

  function savePuzzleStarts() {
    try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {}
    if (puzzleWorldModifiersReady) invalidatePuzzleWorldModifierMeshes();
  }

  function migratePuzzleTemplates() {
    userPuzzleLibrary.templates ||= {};
    let changed = false;
    for (const marker of userPuzzleLibrary.markers || []) {
      if (!marker.linkMode) { marker.linkMode = 'instance'; changed = true; }
      if (marker.linkMode === 'copy') continue;
      if (userPuzzleLibrary.templates[marker.group]) continue;
      const legacy = puzzleStartState[marker.id];
      if (!legacy) continue;
      userPuzzleLibrary.templates[marker.group] = JSON.parse(JSON.stringify(legacy));
      changed = true;
    }
    return changed;
  }

  function savePuzzleLibrary() {
    try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {}
    if (puzzleWorldModifiersReady) invalidatePuzzleWorldModifierMeshes();
  }

  // World Lab edits the same authored puzzle placement data, but it deliberately
  // queues moves instead of trying to duplicate the game's terrain / ownership
  // logic in another page. On the next game load we consume those requests here
  // and run them through movePuzzleMarkerTo(), then persist the result normally.
  function applyWorldLabPendingPuzzleMoves() {
    if (PUZZLE_LAB_MODE) return 0;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(WORLD_LAB_PENDING_MOVES_STORAGE_KEY) || 'null'); } catch (_) {}
    if (!pending || typeof pending !== 'object') return 0;
    let applied = 0;
    const unresolved = {};
    for (const [markerId, request] of Object.entries(pending)) {
      const marker = markerForId(markerId);
      const targetX = Number(request?.x);
      if (!marker || !Number.isFinite(targetX)) {
        if (request && Number.isFinite(targetX)) unresolved[markerId] = request;
        continue;
      }
      if (movePuzzleMarkerTo(marker, targetX)) applied++;
      persistPuzzleMarkerPosition(marker);
    }
    if (applied) {
      savePuzzleState();
      savePuzzleLibrary();
    }
    try {
      if (Object.keys(unresolved).length) localStorage.setItem(WORLD_LAB_PENDING_MOVES_STORAGE_KEY, JSON.stringify(unresolved));
      else localStorage.removeItem(WORLD_LAB_PENDING_MOVES_STORAGE_KEY);
    } catch (_) {}
    return applied;
  }

  function savePuzzleWorkshopState(markerId = null) {
    puzzleWorkshopState.isolated = !!puzzleWorkshopIsolated;
    puzzleWorkshopState.clear = !!puzzleWorkshopClear;
    puzzleWorkshopState.markerId = markerId || (!puzzleWorkshopClear ? (editorPuzzleMarkerId || puzzleWorkshopState.markerId) : null);
    try { localStorage.setItem(PUZZLE_WORKSHOP_STORAGE_KEY, JSON.stringify(puzzleWorkshopState)); } catch (_) {}
    if (puzzleWorldModifiersReady) invalidatePuzzleWorldModifierMeshes();
  }

  function allPuzzleMarkers() {
    if (PUZZLE_LAB_MODE) return groupDefinition(PUZZLE_LAB_GROUP_ID) ? [puzzleLabMarker] : [];
    const localLabels = new Set((userPuzzleLibrary.markers || []).map(marker => (userPuzzleLibrary.groups?.[marker.group]?.label || '').trim().toLowerCase()).filter(Boolean));
    const builtIns = (puzzleConfig.markers || []).filter(marker => !localLabels.has((puzzleConfig.groups?.[marker.group]?.label || '').trim().toLowerCase()));
    return [...builtIns, ...(userPuzzleLibrary.markers || [])];
  }

  function scenePuzzleMarkers() {
    if (PUZZLE_LAB_MODE) return groupDefinition(PUZZLE_LAB_GROUP_ID) ? [puzzleLabMarker] : [];
    if (puzzleWorkshopIsolated) return puzzleWorkshopClear ? [] : [...(userPuzzleLibrary.markers || [])];
    return allPuzzleMarkers();
  }

  function allPuzzleGroups() {
    if (PUZZLE_LAB_MODE) {
      const def = groupDefinition(PUZZLE_LAB_GROUP_ID);
      return def ? [{ id:PUZZLE_LAB_GROUP_ID, def }] : [];
    }
    const groups = new Map();
    const localLabels = new Set(Object.values(userPuzzleLibrary.groups || {}).map(def => (def?.label || '').trim().toLowerCase()).filter(Boolean));
    for (const [id, def] of Object.entries(puzzleConfig.groups || {})) {
      if (!localLabels.has((def?.label || '').trim().toLowerCase())) groups.set(id, def);
    }
    for (const [id, def] of Object.entries(userPuzzleLibrary.groups || {})) groups.set(id, def);
    return [...groups.entries()].map(([id, def]) => ({ id, def }));
  }

  function groupDefinition(groupId) {
    if (PUZZLE_LAB_MODE && groupId === PUZZLE_LAB_GROUP_ID && PUZZLE_LAB_LAUNCH?.groupDef) return PUZZLE_LAB_LAUNCH.groupDef;
    return userPuzzleLibrary.groups?.[groupId] || puzzleConfig.groups?.[groupId] || null;
  }

  function groupIsUserCreated(groupId) {
    return !!userPuzzleLibrary.groups?.[groupId];
  }

  function markerDefinition(marker) {
    if (!marker) return null;
    return groupDefinition(marker.group);
  }

  function markerIsUserCreated(marker) {
    return !!marker && (userPuzzleLibrary.markers || []).some(item => item.id === marker.id);
  }

  function markerLinkMode(marker) {
    return marker?.linkMode === 'copy' ? 'copy' : 'instance';
  }

  function savedPuzzleFor(markerId) {
    puzzleSavedState[markerId] ||= { solved:false, objects:{} };
    puzzleSavedState[markerId].objects ||= {};
    return puzzleSavedState[markerId];
  }

  function inventoryTotalCount() {
    return Object.values(inventoryState.items || {}).reduce((sum, item) => sum + Math.max(0, Number(item?.count) || 0), 0);
  }

  function inventoryItemCount(itemId) {
    return Math.max(0, Number(inventoryState.items?.[itemId]?.count) || 0);
  }

  function saveInventory() {
    if (PLAYER_MODE) savePlayerPosition(true);
    if (puzzleTestMode) return;
    try { localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryState)); } catch (_) {}
  }

  function inventorySnapshot() {
    return JSON.parse(JSON.stringify(inventoryState));
  }

  function restoreInventory(snapshot, { persist = false } = {}) {
    inventoryState = snapshot ? JSON.parse(JSON.stringify(snapshot)) : { version:1, items:{} };
    if (persist) saveInventory();
    renderInventory();
  }

  function addInventoryItem(itemId, count = 1, sourceId = null) {
    if (!INVENTORY_ITEM_DEFS[itemId]) return false;
    inventoryState.items ||= {};
    const amount = Math.max(1, Number(count) || 1);
    const current = inventoryState.items[itemId] || { count:0, firstCollectedAt:Date.now() };
    current.count = Math.max(0, Number(current.count) || 0) + amount;
    if (sourceId) {
      current.sources ||= {};
      current.sources[sourceId] = Math.max(0, Number(current.sources[sourceId]) || 0) + amount;
    }
    current.lastCollectedAt = Date.now();
    inventoryState.items[itemId] = current;
    saveInventory();
    renderInventory();
    flashInventoryAdd(itemId);
    return true;
  }

  function removeInventoryItem(itemId, count = 1, sourceId = null) {
    inventoryState.items ||= {};
    const current = inventoryState.items[itemId];
    if (!current) return false;
    let amount = Math.max(1, Number(count) || 1);
    if (sourceId && current.sources && Number(current.sources[sourceId]) > 0) {
      amount = Math.min(amount, Number(current.sources[sourceId]) || 0);
      current.sources[sourceId] = Math.max(0, (Number(current.sources[sourceId]) || 0) - amount);
      if (current.sources[sourceId] <= 0) delete current.sources[sourceId];
      if (!Object.keys(current.sources).length) delete current.sources;
    }
    current.count = Math.max(0, (Number(current.count) || 0) - amount);
    if (current.count <= 0) delete inventoryState.items[itemId];
    else inventoryState.items[itemId] = current;
    saveInventory();
    renderInventory();
    return true;
  }

  function removePuzzleRewardFromInventory(instance, { allowLegacyFallback = false } = {}) {
    if (!instance) return false;
    const reward = completionRewardFor(instance);
    const itemId = reward?.itemId;
    if (!itemId) return false;
    const current = inventoryState.items?.[itemId];
    if (!current) return false;

    const sourcedCount = Number(current.sources?.[instance.id]) || 0;
    if (sourcedCount > 0) return removeInventoryItem(itemId, 1, instance.id);

    // v0.2.45 migration path: older builds stored only a total count, so a
    // reward collected before source tracking cannot be tied back to its puzzle.
    // When explicitly resetting that puzzle, remove one matching legacy reward.
    if (allowLegacyFallback) return removeInventoryItem(itemId, 1);
    return false;
  }

  function inventoryThumbMarkup(itemDef) {
    if (itemDef?.image) return `<span class="sidescroll-inventory-thumb"><img src="${itemDef.image}?v=1.0.62" alt=""></span>`;
    if (itemDef?.asset === 'forest-key') return '<span class="sidescroll-inventory-thumb sidescroll-inventory-key-thumb" aria-hidden="true"><i></i></span>';
    return '<span class="sidescroll-inventory-thumb" aria-hidden="true">◇</span>';
  }

  function renderInventory() {
    const total = inventoryTotalCount();
    if (inventoryCountEl) inventoryCountEl.textContent = String(total);
    if (!inventoryListEl || !inventoryEmptyEl) return;
    inventoryListEl.innerHTML = '';
    const entries = Object.entries(inventoryState.items || {}).filter(([,state]) => (Number(state?.count) || 0) > 0);
    inventoryEmptyEl.hidden = entries.length > 0;
    for (const [itemId, state] of entries) {
      const def = INVENTORY_ITEM_DEFS[itemId] || { label:itemId, description:'Collected item.' };
      const cfg = collectibleConfig(itemId);
      const card = document.createElement('div');
      card.className = 'sidescroll-inventory-item';
      card.dataset.itemId = itemId;
      card.innerHTML = `${inventoryThumbMarkup(def)}<span class="sidescroll-inventory-item-copy"><strong>${cfg.label || def.label}</strong><small>${def.description || ''}</small></span><b class="sidescroll-inventory-qty">×${Math.max(1, Number(state.count) || 1)}</b>`;
      inventoryListEl.appendChild(card);
    }
  }

  function flashInventoryAdd(itemId) {
    if (!inventoryBtn) return;
    if (inventoryFlashTimer) clearTimeout(inventoryFlashTimer);
    inventoryBtn.classList.remove('item-added');
    // Force the class transition to restart when collecting twice quickly.
    void inventoryBtn.offsetWidth;
    inventoryBtn.classList.add('item-added');
    const card = inventoryListEl?.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);
    if (card) card.classList.add('item-added');
    inventoryFlashTimer = window.setTimeout(() => {
      inventoryBtn.classList.remove('item-added');
      card?.classList.remove('item-added');
      inventoryFlashTimer = 0;
    }, 1350);
  }

  function setInventoryOpen(open) {
    inventoryOpen = !!open;
    if (inventoryPanel) inventoryPanel.hidden = !inventoryOpen;
    if (inventoryBtn) inventoryBtn.setAttribute('aria-expanded', String(inventoryOpen));
    document.body.classList.toggle('sidescroll-inventory-open', inventoryOpen);
    if (inventoryOpen) {
      setDriveAxis(0);
      renderInventory();
    }
  }


  function markerForId(markerId) {
    return allPuzzleMarkers().find(marker => marker.id === markerId) || null;
  }

  function defaultPuzzleStartForDefinition(def) {
    const objects = {};
    for (const prop of def?.props || []) {
      objects[prop.id] = {
        asset: prop.asset,
        assetState: prop.assetState || inferredAssetState(prop.asset),
        x: prop.x,
        z: prop.z ?? pathZ,
        yOffset: Number.isFinite(prop.yOffset) ? prop.yOffset : 0,
        floorOffset: Number.isFinite(prop.floorOffset) ? prop.floorOffset : null,
        groundLine: Number.isFinite(prop.groundLine) ? prop.groundLine : assetGroundLineDefault(prop.asset,prop.assetState || inferredAssetState(prop.asset)),
        sx: prop.width ?? null,
        sy: prop.height,
        flip: !!prop.flip,
        deleted: false,
        category: prop.category || 'gameplay',
        gameplayType: prop.gameplayType || null,
        gameplayLayerLocked: true,
        freePlacement: typeof prop.freePlacement === 'boolean' ? prop.freePlacement : defaultFreePlacement(prop.asset),
        worldFloorY: Number.isFinite(prop.worldFloorY) ? Number(prop.worldFloorY) : null,
        collision: cloneCollision(prop.collision),
        shadow: prop.shadow ? { ...prop.shadow } : null,
        sockets: Array.isArray(prop.sockets) ? prop.sockets.map(socket => ({ ...socket })) : [],
        socketedTo: prop.socketedTo ? { ...prop.socketedTo } : null,
        thoughtText: typeof prop.thoughtText === 'string' ? prop.thoughtText : '',
        thoughtRadius: Rig.clamp(Number(prop.thoughtRadius) || 1.4, 0.25, 8),
        thoughtOnce: prop.thoughtOnce !== false,
        cameraNodeRadius:Rig.clamp(Number(prop.cameraNodeRadius)||4,.5,20),
        cameraNodeOffsetX:Number(prop.cameraNodeOffsetX)||0, cameraNodeOffsetY:Number(prop.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(prop.cameraNodeOffsetZ)||0,
        cameraNodeCurveStart:cameraNodeCurveSetting(prop.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(prop.cameraNodeCurveEnd)
      };
    }
    return {
      source:'default',
      bounds:codeBoundsForDefinition(def),
      objects,
      respawn:def?.respawn ? deepCopy(def.respawn) : null,
      worldModifiers:Array.isArray(def?.worldModifiers) ? deepCopy(def.worldModifiers) : []
    };
  }

  function defaultPuzzleStart(marker) {
    return defaultPuzzleStartForDefinition(markerDefinition(marker));
  }

  function templateStartForGroup(groupId) {
    return userPuzzleLibrary.templates?.[groupId] || defaultPuzzleStartForDefinition(groupDefinition(groupId));
  }

  function puzzleStartFor(marker) {
    if (!marker) return { source:'default', bounds:{minX:-4,maxX:4}, objects:{}, worldModifiers:[] };
    if (markerLinkMode(marker) === 'copy' && puzzleStartState[marker.id]) return puzzleStartState[marker.id];
    if (PUZZLE_LAB_MODE && marker.group === PUZZLE_LAB_GROUP_ID && PUZZLE_LAB_LAUNCH?.template) return PUZZLE_LAB_LAUNCH.template;
    if (userPuzzleLibrary.templates?.[marker.group]) return userPuzzleLibrary.templates[marker.group];
    if (puzzleStartState[marker.id]) return puzzleStartState[marker.id];
    return defaultPuzzleStart(marker);
  }

  function rawPuzzleWorldModifiersForMarker(marker) {
    if (!marker) return [];
    const start = puzzleStartFor(marker);
    const raw = Array.isArray(start?.worldModifiers)
      ? start.worldModifiers
      : (Array.isArray(markerDefinition(marker)?.worldModifiers) ? markerDefinition(marker).worldModifiers : []);
    return raw.filter(item => item && typeof item === 'object' && typeof item.type === 'string');
  }

  function resolvedPuzzleWorldModifiers() {
    if (!puzzleWorldModifiersReady) return [];
    if (puzzleWorldModifierCache) return puzzleWorldModifierCache;
    const resolved = [];
    for (const marker of scenePuzzleMarkers()) {
      const raw = rawPuzzleWorldModifiersForMarker(marker);
      raw.forEach((item, index) => {
        const centreOffset = Number.isFinite(Number(item.centerX)) ? Number(item.centerX) : 0;
        resolved.push({
          ...item,
          id: item.id || `${item.type}-${index+1}`,
          markerId:marker.id,
          groupId:marker.group,
          worldCenterX:Number(marker.x) + centreOffset
        });
      });
    }
    puzzleWorldModifierCache = resolved;
    return resolved;
  }

  function bridgePuzzleMarker(marker) {
    if (!marker) return false;
    const def = markerDefinition(marker) || {};
    const label = String(def.label || marker.group || '').trim().toLowerCase();
    if (label.includes('broken bridge')) return true;
    if (String(marker.group || '').toUpperCase().includes('BROKEN_BRIDGE')) return true;
    const start = puzzleStartFor(marker);
    return Object.values(start?.objects || {}).some(state => state?.asset === 'bridge-left' || state?.asset === 'bridge-right' || state?.asset === 'handcart-broken');
  }

  const PUZZLE_WORLD_MODIFIER_V1_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.world-modifier-v1' : 'sidescroll.puzzle-world-modifiers-v1.broken-bridge-river';
  function migrateBrokenBridgeRiverToPuzzleOwnership() {
    let already = false;
    try { already = localStorage.getItem(PUZZLE_WORLD_MODIFIER_V1_MIGRATION_KEY) === '1'; } catch (_) {}
    let libraryChanged = false;
    let startsChanged = false;
    let terrainChanged = false;

    for (const marker of allPuzzleMarkers()) {
      if (!bridgePuzzleMarker(marker)) continue;
      const start = puzzleStartFor(marker);
      const existing = Array.isArray(start?.worldModifiers) ? start.worldModifiers : [];
      if (existing.some(item => item?.type === 'river')) continue;

      const sectionIndex = terrainSectionIndexAt(marker.x);
      const sectionBounds = terrainSectionBounds(sectionIndex);
      const sectionWasRiver = terrainSectionType(sectionIndex) === 'river';
      const river = riverSectionSettings(sectionIndex);
      const modifier = {
        id:'bridge-river',
        type:'river',
        centerX:sectionBounds.center - Number(marker.x),
        width:sectionWasRiver ? river.width : RIVER_SECTION_MAX_WIDTH,
        bedDepth:RIVER_BED_DEPTH,
        waterAboveBed:RIVER_WATER_ABOVE_BED,
        phase:sectionIndex * 0.731,
        bankMargin:0.92,
        collisionGap:true,
        ownerRole:'crossing',
        bankDressing:{ enabled:true, style:'woodland', seed:(Math.imul(sectionIndex + 1, 2654435761) >>> 0) || 1 },
        source:sectionWasRiver ? 'migrated-section-river' : 'broken-bridge-default'
      };

      const def = markerDefinition(marker);
      if (def && !Array.isArray(def.worldModifiers)) { def.worldModifiers = [JSON.parse(JSON.stringify(modifier))]; libraryChanged = groupIsUserCreated(marker.group) || libraryChanged; }

      if (markerLinkMode(marker) === 'copy') {
        puzzleStartState[marker.id] ||= defaultPuzzleStart(marker);
        puzzleStartState[marker.id].worldModifiers = [JSON.parse(JSON.stringify(modifier))];
        startsChanged = true;
      } else {
        userPuzzleLibrary.templates ||= {};
        userPuzzleLibrary.templates[marker.group] ||= defaultPuzzleStart(marker);
        userPuzzleLibrary.templates[marker.group].worldModifiers = [JSON.parse(JSON.stringify(modifier))];
        libraryChanged = true;
      }

      // The river is now owned by the puzzle. Remove the legacy absolute section
      // override without reanchoring objects: the puzzle modifier immediately
      // reproduces the same crossing in the same place, then follows the marker.
      if (sectionWasRiver) {
        terrainSectionTypes.delete(sectionIndex);
        terrainSectionSettings.delete(sectionIndex);
        terrainCollisionDisabledSections.delete(sectionIndex);
        terrainChanged = true;
      }
    }

    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (terrainChanged) saveTerrainSectionState();
    try { localStorage.setItem(PUZZLE_WORLD_MODIFIER_V1_MIGRATION_KEY, '1'); } catch (_) {}
    puzzleWorldModifiersReady = true;
    invalidatePuzzleWorldModifierMeshes();
    return !already || libraryChanged || startsChanged || terrainChanged;
  }

  migrateBrokenBridgeRiverToPuzzleOwnership();

  // v1.0.62: river-bank dressing belongs to the puzzle-owned river modifier,
  // not to the absolute terrain section that happened to contain the bridge.
  // Existing v1.0.60/61 saves may still contain section-owned auto-dressing;
  // remove that legacy data and add a deterministic dressing recipe to the
  // river modifier so the banks move, stream and delete with the puzzle.
  const PUZZLE_WORLD_MODIFIER_V2_MIGRATION_KEY = PUZZLE_LAB_MODE ? 'sidescroll.puzzle-lab.migration.world-modifier-v2' : 'sidescroll.puzzle-world-modifiers-v2.river-bank-dressing';
  function migrateBrokenBridgeRiverDressingToPuzzleOwnership() {
    try {
      if (localStorage.getItem(PUZZLE_WORLD_MODIFIER_V2_MIGRATION_KEY) === '1') return;
    } catch (_) {}
    let libraryChanged = false;
    let startsChanged = false;
    let sceneChanged = false;
    const legacySections = new Set();

    for (const marker of allPuzzleMarkers()) {
      if (!bridgePuzzleMarker(marker)) continue;
      const start = puzzleStartFor(marker);
      const modifiers = Array.isArray(start?.worldModifiers) ? start.worldModifiers : [];
      const river = modifiers.find(item => item?.type === 'river');
      if (!river) continue;
      const worldCenterX = Number(marker.x) + (Number.isFinite(Number(river.centerX)) ? Number(river.centerX) : 0);
      const sectionIndex = terrainSectionIndexAt(worldCenterX);
      legacySections.add(sectionIndex);
      if (!river.bankDressing || typeof river.bankDressing !== 'object') {
        river.bankDressing = {
          enabled:true,
          style:'woodland',
          seed:(Math.imul(sectionIndex + 1, 2654435761) >>> 0) || 1
        };
        if (markerLinkMode(marker) === 'copy') startsChanged = true;
        else libraryChanged = true;
      } else {
        let changed = false;
        if (river.bankDressing.enabled == null) { river.bankDressing.enabled = true; changed = true; }
        if (!river.bankDressing.style) { river.bankDressing.style = 'woodland'; changed = true; }
        if (!Number.isFinite(Number(river.bankDressing.seed))) {
          river.bankDressing.seed = (Math.imul(sectionIndex + 1, 2654435761) >>> 0) || 1;
          changed = true;
        }
        if (changed) {
          if (markerLinkMode(marker) === 'copy') startsChanged = true;
          else libraryChanged = true;
        }
      }
    }

    const legacyMatch = item => {
      if (typeof item?.id !== 'string') return false;
      for (const sectionIndex of legacySections) if (item.id.startsWith(`riverbank-${sectionIndex}-`)) return true;
      return false;
    };
    if (Array.isArray(sceneData.added)) {
      const before = sceneData.added.length;
      sceneData.added = sceneData.added.filter(item => !legacyMatch(item));
      sceneChanged = sceneData.added.length !== before;
    }
    if (sceneData.overrides && typeof sceneData.overrides === 'object') {
      for (const id of Object.keys(sceneData.overrides)) {
        if (legacyMatch({ id })) { delete sceneData.overrides[id]; sceneChanged = true; }
      }
    }

    if (libraryChanged) savePuzzleLibrary();
    if (startsChanged) savePuzzleStarts();
    if (sceneChanged) saveSceneData();
    try { localStorage.setItem(PUZZLE_WORLD_MODIFIER_V2_MIGRATION_KEY, '1'); } catch (_) {}
    invalidatePuzzleWorldModifierMeshes();
  }
  migrateBrokenBridgeRiverDressingToPuzzleOwnership();

  function hasAuthoredPuzzleStart(markerId) {
    const marker = markerForId(markerId);
    if (!marker) return false;
    if (markerLinkMode(marker) === 'copy') return !!puzzleStartState[markerId];
    return !!userPuzzleLibrary.templates?.[marker.group] || !!puzzleStartState[markerId];
  }

  function capturePuzzleStart(instance) {
    if (!instance) return null;
    const objects = {};
    for (const obj of instance.objects) {
      if (!obj?.puzzleObjectId) continue;
      objects[obj.puzzleObjectId] = {
        asset: obj.assetName,
        assetState: obj.assetState || inferredAssetState(obj.assetName),
        x: obj.x - instance.marker.x,
        z: obj.z,
        yOffset: obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName),
        floorOffset: objectFloorOffsetFromTerrain(obj),
        groundLine: objectGroundLine(obj),
        sx: obj.sx,
        sy: obj.sy,
        flip: !!obj.flip,
        deleted: !!obj.deleted,
        category: obj.category || 'gameplay',
        gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked,
        freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
        collision: cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride,
        shadow: obj.shadow ? { ...obj.shadow } : null,
        sockets: Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
        socketedTo: obj.socketedTo ? { ...obj.socketedTo } : null,
        runtimeRotation:Number(obj.runtimeRotation) || 0,
        cartRailLocked:!!obj.cartRailLocked,
        wheelRotation:Number(obj.wheelRotation) || 0,
        thoughtText:typeof obj.thoughtText === 'string' ? obj.thoughtText : '',
        thoughtRadius:Rig.clamp(Number(obj.thoughtRadius) || 1.4,0.25,8),
        thoughtOnce:obj.thoughtOnce !== false,
        cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20),
        cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0, cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
        cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
      };
    }
    const snapshot = { source:'authored', savedAt:Date.now(), bounds:{ ...currentPuzzleBoundsRelative(instance.marker) }, objects, respawn:deepCopy(currentPuzzleRespawn(instance.marker)), cartPath:deepCopy(currentPuzzleCartPath(instance.marker)), worldModifiers:deepCopy(rawPuzzleWorldModifiersForMarker(instance.marker)) };
    puzzleStartState[instance.id] = snapshot;
    puzzleStartDirty.delete(instance.id);
    savePuzzleStarts();
    return snapshot;
  }

  function applyPuzzleSnapshot(instance, snapshot, { persistRuntime = true, clearDirty = false } = {}) {
    if (!instance || !snapshot) return;
    if (snapshot.bounds) puzzleDraftBounds[instance.id] = { ...snapshot.bounds };
    else puzzleDraftBounds[instance.id] = { ...codeBoundsForMarker(instance.marker) };
    puzzleRespawnDraft[instance.id] = normalisePuzzleRespawn(instance.marker, snapshot.respawn || null);
    // Legacy v1.0.41–1.0.46 authored snapshots accidentally omitted cartPath.
    // Preserve the already-authored draft in that case instead of rebuilding a
    // fresh default rail during Reset, which made the guide jump to the right.
    const existingCartPath = puzzleCartPathDraft[instance.id] || puzzleSavedState?.[instance.id]?.cartPathDraft || null;
    puzzleCartPathDraft[instance.id] = normalisePuzzleCartPath(instance.marker, snapshot.cartPath || existingCartPath || null);
    if (carriedObject?.puzzleInstanceId === instance.id) carriedObject = null;
    if (interactionState?.object?.puzzleInstanceId === instance.id) interactionState = null;
    if (pushingObject?.puzzleInstanceId === instance.id) { pushingObject = null; pushingSide = 0; pushingFloorOffset = 0; }
    if (standingOnObject?.puzzleInstanceId === instance.id) standingOnObject = null;
    removePuzzleRewardObject(instance);

    const existing = new Map(instance.objects.filter(Boolean).map(obj => [obj.puzzleObjectId, obj]));
    for (const [objectId, state] of Object.entries(snapshot.objects || {})) {
      const prop = (instance.def.props || []).find(item => item.id === objectId) || null;
      let obj = existing.get(objectId);
      const asset = state.asset || prop?.asset;
      const restoredAssetState = state.assetState || prop?.assetState || inferredAssetState(asset);
      if (!obj && asset) {
        const sy = Number.isFinite(state.sy) ? state.sy : (prop?.height ?? 0.8);
        const rawSx = Number.isFinite(state.sx) ? state.sx : (prop?.width ?? sy * (assetAspect[asset] || 1));
        const sx = correctPuzzleAssetWidth(asset, rawSx, sy);
        const x = instance.marker.x + (Number.isFinite(state.x) ? state.x : (prop?.x ?? 0));
        const z = Number.isFinite(state.z) ? state.z : (prop?.z ?? pathZ);
        obj = addObject(frontOccluders, asset, x, z, sx, sy, {
          id:`puzzle-${instance.id}-${objectId}`,
          y:playSurfaceYAt(x),
          groundLine:Number.isFinite(state.groundLine) ? state.groundLine : assetGroundLineDefault(asset,restoredAssetState),
          assetState:restoredAssetState,
          flip:!!state.flip,
          shade:1, opacity:1, layer:'foreground', wrap:false,
          category:state.category || prop?.category || 'gameplay',
          gameplayType:state.gameplayType ?? prop?.gameplayType ?? null,
          gameplayLayerLocked:state.gameplayLayerLocked ?? true,
          freePlacement:typeof state.freePlacement === 'boolean' ? state.freePlacement : defaultFreePlacement(asset),
          collision:cloneCollision(state.collision ?? prop?.collision ?? null), collisionOverride:!!state.collisionOverride,
          shadow:state.shadow || prop?.shadow || null,
          sockets:Array.isArray(state.sockets ?? prop?.sockets) ? (state.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [],
          socketedTo:(state.socketedTo ?? prop?.socketedTo) ? { ...(state.socketedTo ?? prop?.socketedTo) } : null,
          deleted:!!state.deleted,
          thoughtText:state.thoughtText ?? prop?.thoughtText ?? '',
          thoughtRadius:state.thoughtRadius ?? prop?.thoughtRadius ?? 1.4,
          thoughtOnce:state.thoughtOnce ?? prop?.thoughtOnce ?? true,
          cameraNodeRadius:state.cameraNodeRadius ?? prop?.cameraNodeRadius ?? 4.0,
          cameraNodeOffsetX:state.cameraNodeOffsetX ?? prop?.cameraNodeOffsetX ?? 0,
          cameraNodeOffsetY:state.cameraNodeOffsetY ?? prop?.cameraNodeOffsetY ?? 0,
          cameraNodeOffsetZ:state.cameraNodeOffsetZ ?? prop?.cameraNodeOffsetZ ?? 0,
          cameraNodeCurveStart:state.cameraNodeCurveStart ?? prop?.cameraNodeCurveStart ?? 0,
          cameraNodeCurveEnd:state.cameraNodeCurveEnd ?? prop?.cameraNodeCurveEnd ?? 0,
          puzzleInstanceId:instance.id,
          puzzleObjectId:objectId
        });
        instance.objects.push(obj);
        existing.set(objectId, obj);
      }
      if (!obj) continue;
      // Snapshot reset must restore the object's identity as well as its
      // position/state. Repair interactions deliberately change assetName
      // (broken cart -> fixed cart, loose wheel -> ready wheel), so leaving the
      // live asset in place meant Reset could never truly return to the authored
      // start state. Rebind all asset-derived render state before rebuilding
      // behaviour/collision below.
      if (asset && obj.assetName !== asset) {
        obj.assetName = asset;
        obj.texture = textures[asset];
        obj.mesh = billboardMesh;
        obj.uvScale = assetUv[asset]?.scale || [1, 1];
        obj.uvOffset = assetUv[asset]?.offset || [0, 0];
        obj.noFog = asset === 'axle-pin';
      }
      obj.assetState = restoredAssetState;
      const xRel = Number.isFinite(state.x) ? state.x : (prop?.x ?? 0);
      obj.x = instance.marker.x + xRel;
      obj.z = Number.isFinite(state.z) ? state.z : (prop?.z ?? pathZ);
      obj.sy = Number.isFinite(state.sy) ? state.sy : (prop?.height ?? obj.sy);
      if (obj.assetName === 'axle-pin' && obj.sy < 0.66) obj.sy = 0.72;
      const rawSnapshotWidth = Number.isFinite(state.sx) ? state.sx : (prop?.width ?? obj.sy * (assetAspect[obj.assetName] || 1));
      obj.sx = correctPuzzleAssetWidth(obj.assetName, rawSnapshotWidth, obj.sy);
      obj.baseSx = obj.sx;
      obj.baseSy = obj.sy;
      obj.flip = !!state.flip;
      obj.deleted = !!state.deleted;
      obj.category = state.category || prop?.category || obj.category || 'gameplay';
      obj.gameplayType = state.gameplayType ?? prop?.gameplayType ?? obj.gameplayType ?? null;
      obj.gameplayLayerLocked = state.gameplayLayerLocked ?? true;
      obj.freePlacement = typeof state.freePlacement === 'boolean' ? state.freePlacement : defaultFreePlacement(obj.assetName);
      obj.collisionOverride = !!state.collisionOverride;
      obj.collision = obj.collisionOverride
        ? cloneCollision(state.collision ?? prop?.collision ?? null)
        : behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, state.collision ?? prop?.collision ?? null,obj.assetState);
      obj.shadow = state.shadow || prop?.shadow || obj.shadow || null;
      obj.sockets = Array.isArray(state.sockets ?? prop?.sockets) ? (state.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [];
      obj.socketedTo = (state.socketedTo ?? prop?.socketedTo) ? { ...(state.socketedTo ?? prop?.socketedTo) } : null;
      obj.counterweightBoundTo = null;
      obj.counterweightVisualAngle = 0;
      obj.counterweightAngle = 0;
      obj.counterweightAngularVelocity = 0;
      obj.wheelRotation = Number(state.wheelRotation) || 0;
      obj.thoughtText = typeof state.thoughtText === 'string' ? state.thoughtText : (typeof prop?.thoughtText === 'string' ? prop.thoughtText : obj.thoughtText || '');
      obj.thoughtRadius = Rig.clamp(Number(state.thoughtRadius ?? prop?.thoughtRadius ?? obj.thoughtRadius) || 1.4,0.25,8);
      obj.thoughtOnce = (state.thoughtOnce ?? prop?.thoughtOnce ?? obj.thoughtOnce) !== false;
      obj.cameraNodeRadius = Rig.clamp(Number(state.cameraNodeRadius ?? prop?.cameraNodeRadius ?? obj.cameraNodeRadius) || 4,.5,20);
      obj.cameraNodeOffsetX = Number(state.cameraNodeOffsetX ?? prop?.cameraNodeOffsetX ?? obj.cameraNodeOffsetX) || 0;
      obj.cameraNodeOffsetY = Number(state.cameraNodeOffsetY ?? prop?.cameraNodeOffsetY ?? obj.cameraNodeOffsetY) || 0;
      obj.cameraNodeOffsetZ = Number(state.cameraNodeOffsetZ ?? prop?.cameraNodeOffsetZ ?? obj.cameraNodeOffsetZ) || 0;
      obj.cameraNodeCurveStart = cameraNodeCurveSetting(state.cameraNodeCurveStart ?? prop?.cameraNodeCurveStart ?? obj.cameraNodeCurveStart);
      obj.cameraNodeCurveEnd = cameraNodeCurveSetting(state.cameraNodeCurveEnd ?? prop?.cameraNodeCurveEnd ?? obj.cameraNodeCurveEnd);
      obj.runtimeRotation = Number(state.runtimeRotation) || 0;
      obj.cartRailAnimating = false;
      obj.cartRailLocked = !!state.cartRailLocked;
      obj.cartRailElapsed = 0;
      obj.carried = false;
      obj.groundLine = Rig.clamp(Number.isFinite(state.groundLine) ? Number(state.groundLine) : assetGroundLineDefault(obj.assetName,obj.assetState), 0, 1);
      const baseY = terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
      obj.y = objectUsesFreePlacement(obj) && Number.isFinite(state.worldFloorY)
        ? Number(state.worldFloorY) - objectGroundLine(obj) * obj.sy
        : (Number.isFinite(state.floorOffset)
            ? baseY + Number(state.floorOffset) - objectGroundLine(obj) * obj.sy
            : baseY + (Number.isFinite(state.yOffset) ? state.yOffset : 0));
      moveObjectToCorrectCollection(obj);
    }
    for (const obj of instance.objects) {
      if (obj?.puzzleObjectId && !snapshot.objects?.[obj.puzzleObjectId]) obj.deleted = true;
    }

    instance.solved = false;
    if (clearDirty) puzzleStartDirty.delete(instance.id);
    sortSceneCollections();
    settleGameplayCrates();

    const runtime = savedPuzzleFor(instance.id);
    runtime.solved = false;
    delete runtime.reward;
    runtime.respawnDraft = deepCopy(currentPuzzleRespawn(instance.marker));
    runtime.cartPathDraft = deepCopy(currentPuzzleCartPath(instance.marker));
    runtime.objects = {};
    for (const obj of instance.objects) {
      runtime.objects[obj.puzzleObjectId] = {
        asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName),
        x:obj.x, y:obj.y, terrainOffset:obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName), floorOffset:objectFloorOffsetFromTerrain(obj), groundLine:objectGroundLine(obj), z:obj.z, sx:obj.sx, sy:obj.sy, flip:!!obj.flip,
        deleted:!!obj.deleted, category:obj.category || 'gameplay', gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked, freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj), collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride, shadow:obj.shadow ? { ...obj.shadow } : null,
        sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [], socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null,
        runtimeRotation:Number(obj.runtimeRotation)||0, cartRailLocked:!!obj.cartRailLocked, wheelRotation:Number(obj.wheelRotation)||0,
      thoughtText:typeof obj.thoughtText === 'string' ? obj.thoughtText : '', thoughtRadius:Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8), thoughtOnce:obj.thoughtOnce !== false,
      cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20), cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0,
      cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
      cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
      };
    }
    if (persistRuntime) savePuzzleState();
    selectObject(null);
  }

  function applyPuzzleStart(instance, { persistRuntime = true } = {}) {
    if (!instance) return;
    applyPuzzleSnapshot(instance, puzzleStartFor(instance.marker), { persistRuntime, clearDirty:true });
  }

  function positionPlayerAtPuzzleEntry(instance) {
    if (!instance) return;
    const bounds = currentPuzzleBoundsRelative(instance.marker);
    const capsule = colliderWorld();
    const approachGap = Math.max(0.85, capsule.radius * 1.5 + 0.35);
    const colliderX = instance.marker.x + bounds.minX - approachGap;
    const rootX = colliderX - capsule.offsetX;
    camera.x = rootX - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = rootX;
    character.y = playSurfaceYAt(character.x);
    jumping = false;
    jumpTime = 0;
    jumpOffset = 0;
    jumpVelocity = 0;
    standingOnObject = null;
    runBlend = 0;
    locomotionPhase = 0;
    setDriveAxis(0);
  }

  function recordPuzzleObjectState(obj) {
    if (!obj?.puzzleInstanceId || !obj?.puzzleObjectId) return false;
    const state = savedPuzzleFor(obj.puzzleInstanceId);
    state.objects[obj.puzzleObjectId] = {
      asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName),
      x:obj.x, y:obj.y, terrainOffset:obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName), floorOffset:objectFloorOffsetFromTerrain(obj), groundLine:objectGroundLine(obj), z:obj.z, sx:obj.sx, sy:obj.sy, flip:!!obj.flip,
      deleted:!!obj.deleted, category:obj.category || 'gameplay', gameplayType:obj.gameplayType || null,
      gameplayLayerLocked:!!obj.gameplayLayerLocked,
      freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
      collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride, shadow:obj.shadow ? { ...obj.shadow } : null,
      sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [], socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null,
      runtimeRotation:Number(obj.runtimeRotation)||0, cartRailLocked:!!obj.cartRailLocked, wheelRotation:Number(obj.wheelRotation)||0,
      thoughtText:typeof obj.thoughtText === 'string' ? obj.thoughtText : '', thoughtRadius:Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8), thoughtOnce:obj.thoughtOnce !== false,
      cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20), cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0,
      cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
      cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
    };
    if (typeof editMode !== 'undefined' && editMode && !puzzleTestMode) puzzleStartDirty.add(obj.puzzleInstanceId);
    savePuzzleState();
    return true;
  }

  function repairUniformPuzzleMarkerDrift(instance) {
    if (!instance?.marker) return 0;
    const start = puzzleStartFor(instance.marker);
    const river = rawPuzzleWorldModifiersForMarker(instance.marker).some(item => item?.type === 'river');
    if (!river || !start?.objects) return 0;

    // Use the two bridge halves as stable anchors. They never move during normal
    // gameplay, so if both report the same local-X error we know the whole live
    // instance has been translated relative to its marker rather than genuinely
    // edited. This repairs the v1.0.60–1.0.62 marker-drag drift without touching
    // arbitrary puzzles or treating player-moved props as an error.
    const anchorDiffs = [];
    for (const obj of new Set(instance.objects || [])) {
      if (!obj?.puzzleObjectId || obj.deleted) continue;
      if (obj.assetName !== 'bridge-left' && obj.assetName !== 'bridge-right') continue;
      const authored = start.objects[obj.puzzleObjectId];
      if (!authored || !Number.isFinite(Number(authored.x))) continue;
      const currentLocalX = (Number(obj.x) || 0) - Number(instance.marker.x || 0);
      anchorDiffs.push(currentLocalX - Number(authored.x));
    }
    if (anchorDiffs.length < 2) return 0;
    const drift = anchorDiffs.reduce((sum, value) => sum + value, 0) / anchorDiffs.length;
    if (!Number.isFinite(drift) || Math.abs(drift) < 0.05) return 0;
    if (anchorDiffs.some(value => Math.abs(value - drift) > 0.025)) return 0;

    const groundedOffsets = new Map();
    for (const obj of new Set(instance.objects || [])) {
      if (!obj || objectUsesFreePlacement(obj)) continue;
      groundedOffsets.set(obj, objectFloorOffsetFromTerrain(obj));
    }
    for (const obj of new Set(instance.objects || [])) if (obj) obj.x -= drift;

    const runtime = puzzleSavedState?.[instance.id]?.objects;
    if (runtime) {
      for (const state of Object.values(runtime)) {
        if (state && Number.isFinite(Number(state.x))) state.x = Number(state.x) - drift;
      }
    }

    for (const [obj, floorOffset] of groundedOffsets) setObjectFloorOffset(obj, floorOffset);
    if (runtime) {
      for (const obj of new Set(instance.objects || [])) {
        if (!obj?.puzzleObjectId) continue;
        const state = runtime[obj.puzzleObjectId];
        if (!state) continue;
        state.y = obj.y;
        state.terrainOffset = obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
        state.floorOffset = objectFloorOffsetFromTerrain(obj);
      }
      savePuzzleState();
    }
    return drift;
  }

  function instantiatePuzzleGroup(marker) {
    const def = markerDefinition(marker);
    if (!def || activePuzzleInstances.has(marker.id)) return activePuzzleInstances.get(marker.id) || null;
    for (const packName of def.assetPacks || []) ensurePuzzleAssetPack(packName);

    const saved = savedPuzzleFor(marker.id);
    const authored = puzzleStartFor(marker);
    if (!puzzleRespawnDraft[marker.id]) puzzleRespawnDraft[marker.id] = normalisePuzzleRespawn(marker, saved.respawnDraft || authored?.respawn || null);
    if (!puzzleCartPathDraft[marker.id]) puzzleCartPathDraft[marker.id] = normalisePuzzleCartPath(marker, saved.cartPathDraft || authored?.cartPath || null);
    const instance = { id:marker.id, marker, def, objects:[], modifierObjects:[], solved:!!saved.solved };
    const baseById = new Map((def.props || []).map(prop => [prop.id, prop]));
    const ids = new Set([...baseById.keys(), ...Object.keys(authored?.objects || {}), ...Object.keys(saved.objects || {})]);
    for (const objectId of ids) {
      const prop = baseById.get(objectId) || null;
      const startState = authored?.objects?.[objectId] || null;
      const prior = saved.objects?.[objectId] || null;
      const meta = prior || startState || prop;
      const asset = prior?.asset || startState?.asset || prop?.asset;
      if (!asset) continue;
      const restoredAssetState = prior?.assetState || startState?.assetState || prop?.assetState || inferredAssetState(asset);
      const xRel = Number.isFinite(startState?.x) ? startState.x : (prop?.x ?? 0);
      const x = Number.isFinite(prior?.x) ? prior.x : (marker.x + xRel);
      const z = Number.isFinite(prior?.z) ? prior.z : (Number.isFinite(startState?.z) ? startState.z : (prop?.z ?? pathZ));
      let height = Number.isFinite(prior?.sy) ? prior.sy : (Number.isFinite(startState?.sy) ? startState.sy : (prop?.height ?? 0.8));
      if (asset === 'axle-pin' && height < 0.66) height = 0.72;
      const savedWidth = Number.isFinite(prior?.sx) ? prior.sx : (Number.isFinite(startState?.sx) ? startState.sx : prop?.width);
      const width = correctPuzzleAssetWidth(asset, savedWidth, height);
      const restoredCategory = prior?.category || startState?.category || prop?.category || 'gameplay';
      const restoredLocked = prior?.gameplayLayerLocked ?? startState?.gameplayLayerLocked ?? true;
      const restoredFreePlacement = prior?.freePlacement ?? startState?.freePlacement ?? prop?.freePlacement ?? defaultFreePlacement(asset);
      const restoredWorldFloorY = Number.isFinite(prior?.worldFloorY)
        ? Number(prior.worldFloorY)
        : (Number.isFinite(startState?.worldFloorY) ? Number(startState.worldFloorY) : null);
      const restoredZ = restoredCategory === 'gameplay' && restoredLocked ? pathZ : z;
      const currentBaseY = terrainAnchorBaseY(x, restoredZ, restoredCategory, restoredLocked, asset);
      const legacyBaseY = legacyTerrainAnchorBaseY(x, restoredZ, restoredCategory, restoredLocked);
      const restoredGroundLine = Rig.clamp(
        Number.isFinite(prior?.groundLine) ? Number(prior.groundLine)
          : (Number.isFinite(startState?.groundLine) ? Number(startState.groundLine) : assetGroundLineDefault(asset,restoredAssetState)),
        0, 1
      );
      const restoredOffset = Number.isFinite(prior?.floorOffset)
        ? Number(prior.floorOffset) - restoredGroundLine * height
        : (Number.isFinite(prior?.terrainOffset)
            ? Number(prior.terrainOffset)
            : (Number.isFinite(prior?.y)
                ? Number(prior.y) - legacyBaseY
                : (Number.isFinite(startState?.floorOffset)
                    ? Number(startState.floorOffset) - restoredGroundLine * height
                    : (Number.isFinite(startState?.yOffset) ? Number(startState.yOffset) : 0))));
      const restoredY = restoredFreePlacement && Number.isFinite(restoredWorldFloorY)
        ? restoredWorldFloorY - restoredGroundLine * height
        : currentBaseY + restoredOffset;
      const obj = addObject(frontOccluders, asset, x, restoredZ, width, height, {
        id:`puzzle-${marker.id}-${objectId}`,
        y:restoredY,
        groundLine:restoredGroundLine,
        assetState:restoredAssetState,
        flip:prior?.flip ?? startState?.flip ?? prop?.flip ?? false,
        shade:1, opacity:1, layer:'foreground', wrap:false,
        category:restoredCategory,
        gameplayType:prior?.gameplayType ?? startState?.gameplayType ?? prop?.gameplayType ?? null,
        gameplayLayerLocked:restoredLocked,
        freePlacement:!!restoredFreePlacement,
        collision:cloneCollision(prior?.collision ?? startState?.collision ?? prop?.collision ?? null),
        collisionOverride:!!(prior?.collisionOverride ?? startState?.collisionOverride ?? false),
        shadow:prior?.shadow || startState?.shadow || prop?.shadow || null,
        sockets:Array.isArray(prior?.sockets ?? startState?.sockets ?? prop?.sockets) ? (prior?.sockets ?? startState?.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [],
        socketedTo:(prior?.socketedTo ?? startState?.socketedTo ?? prop?.socketedTo) ? { ...(prior?.socketedTo ?? startState?.socketedTo ?? prop?.socketedTo) } : null,
        deleted:prior?.deleted ?? startState?.deleted ?? false,
        runtimeRotation:prior?.runtimeRotation ?? startState?.runtimeRotation ?? 0,
        cartRailLocked:prior?.cartRailLocked ?? startState?.cartRailLocked ?? false,
        wheelRotation:prior?.wheelRotation ?? startState?.wheelRotation ?? 0,
        thoughtText:prior?.thoughtText ?? startState?.thoughtText ?? prop?.thoughtText ?? '',
        thoughtRadius:prior?.thoughtRadius ?? startState?.thoughtRadius ?? prop?.thoughtRadius ?? 1.4,
        thoughtOnce:prior?.thoughtOnce ?? startState?.thoughtOnce ?? prop?.thoughtOnce ?? true,
        cameraNodeRadius:prior?.cameraNodeRadius ?? startState?.cameraNodeRadius ?? prop?.cameraNodeRadius ?? 4.0,
        cameraNodeOffsetX:prior?.cameraNodeOffsetX ?? startState?.cameraNodeOffsetX ?? prop?.cameraNodeOffsetX ?? 0,
        cameraNodeOffsetY:prior?.cameraNodeOffsetY ?? startState?.cameraNodeOffsetY ?? prop?.cameraNodeOffsetY ?? 0,
        cameraNodeOffsetZ:prior?.cameraNodeOffsetZ ?? startState?.cameraNodeOffsetZ ?? prop?.cameraNodeOffsetZ ?? 0,
        cameraNodeCurveStart:prior?.cameraNodeCurveStart ?? startState?.cameraNodeCurveStart ?? prop?.cameraNodeCurveStart ?? 0,
        cameraNodeCurveEnd:prior?.cameraNodeCurveEnd ?? startState?.cameraNodeCurveEnd ?? prop?.cameraNodeCurveEnd ?? 0,
        puzzleInstanceId:marker.id,
        puzzleObjectId:objectId
      });
      instance.objects.push(obj);
    }
    currentPuzzleBoundsRelative(marker);
    activePuzzleInstances.set(marker.id, instance);
    repairUniformPuzzleMarkerDrift(instance);
    rebuildPuzzleWorldModifierDressing(instance);
    sortSceneCollections();
    settleGameplayCrates();
    if (instance.solved) ensurePuzzleCompletionReward(instance, marker.x);
    return instance;
  }

  function capturePuzzleInstance(instance) {
    if (!instance) return;
    for (const obj of instance.objects) recordPuzzleObjectState(obj);
    const state = savedPuzzleFor(instance.id);
    state.solved = !!instance.solved;
    savePuzzleState();
  }

  function removePuzzleObjects(instance) {
    if (pushingObject?.puzzleInstanceId === instance?.id) { pushingObject = null; pushingSide = 0; pushingFloorOffset = 0; }
    const remove = new Set([...(instance.objects || []), ...(instance.modifierObjects || [])]);
    if (instance.rewardObject) remove.add(instance.rewardObject);
    for (const list of [backdrop, midfill, frontOccluders]) {
      for (let i=list.length-1;i>=0;i--) if (remove.has(list[i])) list.splice(i,1);
    }
    instance.rewardObject = null;
    instance.modifierObjects = [];
  }

  function unloadPuzzleGroup(markerId) {
    const instance = activePuzzleInstances.get(markerId);
    if (!instance) return;
    if ((carriedObject && carriedObject.puzzleInstanceId === markerId) || (interactionState?.object?.puzzleInstanceId === markerId)) return;
    capturePuzzleInstance(instance);
    if (selectedObject?.puzzleInstanceId === markerId) selectObject(null);
    removePuzzleObjects(instance);
    activePuzzleInstances.delete(markerId);
    for (const packName of instance.def.assetPacks || []) releasePuzzleAssetPack(packName);
  }

  function moduleBoundsFor(def, marker) {
    const rel = currentPuzzleBoundsRelative(marker);
    const hidesDressing = !!def?.exclusion;
    return {
      minX:marker.x + rel.minX,
      maxX:marker.x + rel.maxX,
      minZ:def?.exclusion?.minZ ?? -999,
      maxZ:def?.exclusion?.maxZ ?? 999,
      hidesDressing
    };
  }

  function puzzleBounds(instance) {
    return moduleBoundsFor(instance.def, instance.marker);
  }

  function updatePuzzleStreaming(playerX) {
    const loadAhead = puzzleConfig.streaming?.loadAhead ?? 24;
    const keepBehind = puzzleConfig.streaming?.keepBehind ?? 34;

    // Puzzle authoring can temporarily become an isolated workshop. This lets
    // us clear every puzzle from the scene, then spawn one exactly where we
    // want it without the normal game markers immediately streaming back in.
    if (puzzleWorkshopIsolated && (editMode || puzzleTestMode)) {
      const keepId = puzzleTestMarkerId || editorPuzzleMarkerId;
      for (const [id] of [...activePuzzleInstances]) {
        if (puzzleWorkshopClear || id !== keepId) unloadPuzzleGroup(id);
      }
      if (!puzzleWorkshopClear && keepId) {
        const marker = markerForId(keepId);
        if (marker && !activePuzzleInstances.has(marker.id)) instantiatePuzzleGroup(marker);
      }
      return;
    }

    // Outside the editor/test isolation, Play mode always represents the full
    // current Scene. If the workshop is isolated this is the locally-authored
    // marker set; otherwise it includes the normal built-in game markers too.
    const streamMarkers = scenePuzzleMarkers();
    const allowedIds = new Set(streamMarkers.map(marker => marker.id));
    for (const [id] of [...activePuzzleInstances]) {
      if (!allowedIds.has(id)) unloadPuzzleGroup(id);
    }

    for (const marker of streamMarkers) {
      const def = markerDefinition(marker);
      if (!def) continue;
      const bounds = moduleBoundsFor(def, marker);
      const minX = bounds.minX;
      const maxX = bounds.maxX;
      const active = activePuzzleInstances.get(marker.id);
      if (!active) {
        if (playerX >= minX - loadAhead && playerX <= maxX + loadAhead) instantiatePuzzleGroup(marker);
      } else if (playerX < minX - keepBehind || playerX > maxX + keepBehind) {
        unloadPuzzleGroup(marker.id);
      }
    }
  }

  function dressingHiddenByPuzzle(obj, drawX) {
    // Feature terrain owns its physical footprint. Any non-puzzle dressing that
    // falls inside a river channel is suppressed rather than left embedded in
    // the bed. Deliberately placed global art is still preserved from ordinary
    // puzzle exclusion zones; only the actual terrain channel takes priority.
    if (!obj || obj.category !== 'dressing' || obj.puzzleInstanceId) return false;
    if (pointInsideRiverChannel(drawX, obj.z)) return true;
    if (obj.userAdded) return false;
    for (const group of worldGroups()) {
      const b = worldGroupExclusionWorldBounds(group);
      if (!b?.enabled) continue;
      if (drawX >= b.minX && drawX <= b.maxX && obj.z >= b.minZ && obj.z <= b.maxZ) return true;
    }
    for (const instance of activePuzzleInstances.values()) {
      const b = puzzleExclusionWorldBounds(instance.marker);
      if (!b.enabled) continue;
      if (drawX >= b.minX && drawX <= b.maxX && obj.z >= b.minZ && obj.z <= b.maxZ) return true;
    }
    return false;
  }

  function activePuzzleNear(playerX) {
    let best=null, bestD=Infinity;
    for (const instance of activePuzzleInstances.values()) {
      const d=Math.abs(playerX-instance.marker.x);
      if (d<bestD) {best=instance;bestD=d;}
    }
    return bestD <= 12 ? best : null;
  }

  function respawnPlayerForPuzzle(instance) {
    if (!instance) return false;
    const cfg = currentPuzzleRespawn(instance.marker);
    if (!cfg?.enabled) return false;
    const capsule = colliderWorld();
    let spawnX = instance.marker.x + cfg.spawnX;
    let support = walkableSupportAt(spawnX + capsule.offsetX, Infinity, 0);
    if (!support || support.source === 'water') {
      const bounds = currentPuzzleBoundsRelative(instance.marker);
      spawnX = instance.marker.x + bounds.minX - Math.max(0.75, capsule.radius + 0.25);
      support = walkableSupportAt(spawnX + capsule.offsetX, Infinity, 0) || { obj:null, offset:0, source:'terrain' };
    }
    camera.x = spawnX - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = spawnX;
    jumpOffset = support.offset;
    character.y = playSurfaceYAt(spawnX) + jumpOffset;
    standingOnObject = support.obj || null;
    jumping = false;
    jumpTime = 0;
    jumpVelocity = 0;
    jumpCameraBaseY = character.y;
    cameraFollowOffset = 0;
    runBlend = 0;
    locomotionPhase = 0;
    setDriveAxis(0);
    lastPuzzleRespawnAt = performance.now();
    if (playerHintsEnabled) { hintEl.textContent = 'Respawned at puzzle checkpoint'; hintEl.classList.remove('hidden'); }
    return true;
  }

  function checkPuzzleRespawnVolumes() {
    if (editMode || interactionState || performance.now() - lastPuzzleRespawnAt < 450) return false;
    for (const instance of activePuzzleInstances.values()) {
      const cfg = currentPuzzleRespawn(instance.marker);
      if (!cfg?.enabled) continue;
      const volume = puzzleRespawnWorld(instance.marker);
      if (!volume) continue;
      if (character.x < volume.minX || character.x > volume.maxX) continue;
      if (pathZ < volume.minZ || pathZ > volume.maxZ) continue;
      if (character.y > volume.triggerY) continue;
      return respawnPlayerForPuzzle(instance);
    }
    return false;
  }

  const COLLECTIBLE_PICKUP_RADIUS = 0.72;

  function completionRewardFor(instance) {
    const explicit = instance?.def?.completionEvent;
    if (explicit?.type === 'spawn-collectible') return explicit;
    // Prototype rule for now: every socket-completion puzzle awards the same
    // key. This is deliberately centralised so a later logic/event editor can
    // replace the hard-coded branch without changing inventory or collection.
    if (instance?.def?.completion?.type === 'sockets') {
      return { type:'spawn-collectible', itemId:'forest-key', asset:'forest-key', height:0.62, offsetX:1.20 };
    }
    return null;
  }

  function removePuzzleRewardObject(instance) {
    const obj = instance?.rewardObject;
    if (!obj) return;
    for (const list of [backdrop, midfill, frontOccluders]) {
      const index = list.indexOf(obj);
      if (index >= 0) list.splice(index, 1);
    }
    obj.deleted = true;
    instance.rewardObject = null;
  }

  function ensurePuzzleCompletionReward(instance, playerX = null) {
    if (!instance || instance.rewardObject) return instance?.rewardObject || null;
    const reward = completionRewardFor(instance);
    if (!reward) return null;
    const state = savedPuzzleFor(instance.id);
    if (state.reward?.collected) return null;

    const bounds = currentPuzzleBoundsRelative(instance.marker);
    const facing = character?.lastFacing >= 0 ? 1 : -1;
    const fallbackX = Number.isFinite(playerX) ? playerX + facing * (reward.offsetX ?? 1.20) : instance.marker.x;
    const minX = instance.marker.x + bounds.minX + 0.45;
    const maxX = instance.marker.x + bounds.maxX - 0.45;
    const x = Number.isFinite(state.reward?.x) ? Number(state.reward.x) : Rig.clamp(fallbackX, minX, maxX);
    const z = Number.isFinite(state.reward?.z) ? Number(state.reward.z) : pathZ + 0.03;
    const config = collectibleConfig(reward.itemId);
    const height = (Number.isFinite(reward.height) ? reward.height : 0.62) * Math.max(0.5, Number(config.scale) || 1);
    const y = Number.isFinite(state.reward?.y) ? Number(state.reward.y) : playSurfaceYAt(x) + 0.035;
    const asset = reward.asset || INVENTORY_ITEM_DEFS[reward.itemId]?.asset || reward.itemId;

    const obj = addObject(frontOccluders, asset, x, z, null, height, {
      id:`reward-${instance.id}-${reward.itemId}`,
      y, flip:false, shade:1.05, opacity:1, noFog:true, layer:'foreground', wrap:false,
      category:'dressing', gameplayType:'collectible', gameplayLayerLocked:false,
      puzzleInstanceId:instance.id
    });
    obj.collectible = true;
    obj.collectibleItemId = reward.itemId;
    obj.collectibleBaseY = y;
    obj.collectibleSpawnTime = performance.now();
    obj.collectibleSpin = !!config.spin;
    instance.rewardObject = obj;
    state.reward = { itemId:reward.itemId, asset, x, y, z, spawned:true, collected:false };
    savePuzzleState();
    sortSceneCollections();
    return obj;
  }

  function collectPuzzleReward(instance) {
    const obj = instance?.rewardObject;
    if (!obj || !obj.collectible || obj.deleted) return false;
    const itemId = obj.collectibleItemId;
    if (!addInventoryItem(itemId, 1, instance.id)) return false;
    const def = INVENTORY_ITEM_DEFS[itemId] || { label:itemId };
    const cfg = collectibleConfig(itemId);
    const state = savedPuzzleFor(instance.id);
    state.reward = { ...(state.reward || {}), itemId, collected:true, collectedAt:Date.now() };
    removePuzzleRewardObject(instance);
    savePuzzleState();
    hintEl.textContent = `Collected ${cfg.label || def.label}`;
    hintEl.classList.remove('hidden');
    return true;
  }

  function updatePuzzleRewards(now) {
    if (editMode) return;
    for (const instance of activePuzzleInstances.values()) {
      const obj = instance.rewardObject;
      if (!obj || obj.deleted || !obj.collectible) continue;
      // Small hover makes a reward read as a collectible without committing to
      // a final reveal animation yet.
      obj.y = (obj.collectibleBaseY ?? obj.y) + Math.sin((now - (obj.collectibleSpawnTime || 0)) * 0.0042) * 0.045;
      obj.collectibleAngle = obj.collectibleSpin ? ((now - (obj.collectibleSpawnTime || 0)) * 0.00145) : 0;
      const dx = Math.abs(objectXNear(obj, character.x) - character.x);
      const dz = Math.abs(obj.z - pathZ);
      if (dx <= COLLECTIBLE_PICKUP_RADIUS && dz <= 0.95) collectPuzzleReward(instance);
    }
  }

  function checkPuzzleCompletion(playerX) {
    for (const instance of activePuzzleInstances.values()) {
      if (instance.solved) continue;
      const rule = instance.def.completion;
      if (!rule) continue;
      let done = false;
      if (rule.type === 'cross-x') {
        const target = instance.marker.x + rule.x;
        done = (rule.direction ?? 1) >= 0 ? playerX >= target : playerX <= target;
      } else if (rule.type === 'sockets') {
        const sockets = [];
        for (const host of socketHostsForInstance(instance)) {
          for (const socket of socketsForHost(host)) sockets.push({ host, socket });
        }
        done = sockets.length > 0 && sockets.every(({host,socket}) => instance.objects.some(obj => !obj.deleted && socketMatchesPiece(socket,obj)
          && obj.socketedTo?.hostObjectId === host.id && obj.socketedTo?.socketId === socket.id));
      }
      if (!done) continue;
      instance.solved = true;
      const state=savedPuzzleFor(instance.id);state.solved=true;savePuzzleState();
      const spawned = ensurePuzzleCompletionReward(instance, playerX);
      hintEl.textContent = spawned
        ? `${instance.def.label || 'Puzzle'} complete · something appeared`
        : `${instance.def.label || 'Puzzle'} complete`;
      hintEl.classList.remove('hidden');
    }
  }

  function targetCollectionForZ(z) {
    if (z > 0.85) return frontOccluders;
    if (z > -12) return midfill;
    return backdrop;
  }

  function moveObjectToCorrectCollection(obj) {
    const target = obj.category === 'gameplay' ? frontOccluders : targetCollectionForZ(obj.z);
    for (const list of [backdrop, midfill, frontOccluders]) {
      const idx = list.indexOf(obj);
      if (idx >= 0 && list !== target) list.splice(idx, 1);
    }
    if (!target.includes(obj)) target.push(obj);
    obj.layer = classifyLayer(obj.z);
  }

  function applyOverrideToObject(obj, override) {
    if (!override) return;
    if (override.assetState) obj.assetState = override.assetState;
    if (Number.isFinite(override.x)) obj.x = override.x;
    if (Number.isFinite(override.z)) obj.z = override.z;
    if (Number.isFinite(override.sx)) obj.sx = override.sx;
    if (Number.isFinite(override.sy)) obj.sy = override.sy;
    if (typeof override.flip === 'boolean') obj.flip = override.flip;
    if (typeof override.deleted === 'boolean') obj.deleted = override.deleted;
    if (override.category) obj.category = override.category;
    if ('gameplayType' in override) obj.gameplayType = override.gameplayType;
    if (typeof override.gameplayLayerLocked === 'boolean') obj.gameplayLayerLocked = override.gameplayLayerLocked;
    else if (obj.category === 'gameplay' && obj.gameplayLayerLocked == null) obj.gameplayLayerLocked = true;
    if (typeof override.freePlacement === 'boolean') obj.freePlacement = override.freePlacement;
    if ('worldGroupId' in override) obj.worldGroupId = override.worldGroupId || null;
    if (obj.category === 'gameplay' && obj.gameplayLayerLocked) obj.z = pathZ;
    obj.collisionOverride = !!override.collisionOverride;
    if (obj.collisionOverride) {
      if (override.collision === null) obj.collision = null;
      else if (override.collision) obj.collision = cloneCollision(override.collision);
    } else {
      obj.collision = behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, override.collision,obj.assetState);
    }
    obj.groundLine = Rig.clamp(Number.isFinite(override.groundLine) ? Number(override.groundLine) : objectGroundLine(obj), 0, 1);
    const currentBaseY = terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
    const legacyBaseY = legacyTerrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked);
    if (objectUsesFreePlacement(obj) && Number.isFinite(override.worldFloorY)) {
      setObjectFloorWorldY(obj, Number(override.worldFloorY));
    } else if (Number.isFinite(override.floorOffset)) {
      obj.y = currentBaseY + Number(override.floorOffset) - objectGroundLine(obj) * obj.sy;
    } else {
      const terrainOffset = Number.isFinite(override.terrainOffset)
        ? Number(override.terrainOffset)
        : (Number.isFinite(override.y) ? Number(override.y) - legacyBaseY : 0);
      obj.y = currentBaseY + terrainOffset;
    }
    moveObjectToCorrectCollection(obj);
  }

  function recordObjectEdit(obj) {
    if (!obj) return;
    if (recordPuzzleObjectState(obj)) return;
    if (obj.userAdded) {
      const saved = sceneData.added.find(item => item.id === obj.id);
      const payload = {
        id: obj.id, assetName: obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName), x: obj.x, y: obj.y, terrainOffset: obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName), floorOffset:objectFloorOffsetFromTerrain(obj), groundLine:objectGroundLine(obj), z: obj.z,
        sx: obj.sx, sy: obj.sy, flip: obj.flip, collision: obj.collision ? cloneCollision(obj.collision) : null, collisionOverride:!!obj.collisionOverride,
        category: obj.category || 'dressing', gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked, freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
        // Authored scene objects are spatially unique. Never allow them to
        // reappear one world-tile later through the old scenery wrap system.
        wrap:false,
        worldGroupId:obj.worldGroupId || null,
        puzzleInstanceId:obj.puzzleInstanceId || null, puzzleObjectId:obj.puzzleObjectId || null, deleted: !!obj.deleted,
        thoughtText:typeof obj.thoughtText === 'string' ? obj.thoughtText : '', thoughtRadius:Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8), thoughtOnce:obj.thoughtOnce !== false,
        cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20), cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0,
        cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
        cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
      };
      if (saved) Object.assign(saved, payload);
      else sceneData.added.push(payload);
    } else {
      sceneData.overrides[obj.id] = {
        assetState:obj.assetState || inferredAssetState(obj.assetName), x: obj.x, y: obj.y, terrainOffset: obj.y - terrainAnchorBaseY(obj.x, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName), floorOffset:objectFloorOffsetFromTerrain(obj), groundLine:objectGroundLine(obj), z: obj.z, sx: obj.sx, sy: obj.sy, flip: obj.flip,
        collision: obj.collision ? cloneCollision(obj.collision) : null, collisionOverride:!!obj.collisionOverride, category: obj.category || 'dressing',
        gameplayType: obj.gameplayType || null, gameplayLayerLocked: !!obj.gameplayLayerLocked, freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
        worldGroupId:obj.worldGroupId || null, deleted: !!obj.deleted
      };
    }
    saveSceneData();
    if (editMode && editorScope === 'environment') {
      sceneEnvironmentListSignature = '';
      renderEnvironmentSelectionTools();
    }
  }

  function restoreSceneEdits() {
    // Puzzle props are now owned by puzzle instances. Older releases could save
    // them as free-standing scene objects; those stale entries are the source of
    // the unselectable black/orphan logs seen during authoring. Remove them once
    // from general scene storage and let puzzle state be the sole owner.
    const puzzleAssetNames = new Set(Object.values(puzzleConfig.assetPacks || {}).flatMap(pack => (pack.assets || []).map(asset => asset.name)));
    const beforeAdded = sceneData.added.length;
    // Puzzle assets can also be perfectly valid standalone environment dressing
    // (the mountain climb rock is the first real example). Only remove legacy
    // scene rows that are unmistakably puzzle-owned; never purge by asset name.
    sceneData.added = sceneData.added.filter(saved => !(
      puzzleAssetNames.has(saved?.assetName) &&
      (saved?.puzzleInstanceId || saved?.puzzleObjectId || String(saved?.id || '').startsWith('puzzle-'))
    ));
    if (sceneData.added.length !== beforeAdded) saveSceneData();

    // v1.0.113 migration: anything in sceneData.added is an authored world
    // placement (including World Group members and auto-authored local dressing).
    // It must exist at one world coordinate only, never at x +/- WORLD width.
    let authoredWrapChanged = false;
    for (const saved of sceneData.added || []) {
      if (saved && saved.wrap !== false) {
        saved.wrap = false;
        authoredWrapChanged = true;
      }
    }
    if (authoredWrapChanged) saveSceneData();

    let groundAspectChanged = false;
    for (const obj of allSceneObjects()) {
      applyOverrideToObject(obj, sceneData.overrides[obj.id]);
      if (/^ground(?:0[1-9]|1[0-2])$/.test(obj.assetName || '') && Number.isFinite(obj.sy)) {
        const corrected = obj.sy * (assetAspect[obj.assetName] || 1);
        if (Math.abs(obj.sx - corrected) > 1e-5) {
          obj.sx = corrected;
          obj.baseSx = corrected;
          if (sceneData.overrides[obj.id]) sceneData.overrides[obj.id].sx = corrected;
          groundAspectChanged = true;
        }
      }
    }
    for (const saved of sceneData.added || []) {
      if (HIDE_LEGACY_GROUND_DRESSING && /^ground(?:0[1-9]|1[0-2])$/.test(saved.assetName || '')) continue;
      userSceneCounter += 1;
      const collection = saved.category === 'gameplay' || saved.assetName === 'crate' ? frontOccluders : targetCollectionForZ(saved.z);
      const restoredWidth = /^ground(?:0[1-9]|1[0-2])$/.test(saved.assetName || '')
        ? saved.sy * (assetAspect[saved.assetName] || 1)
        : saved.sx;
      if (restoredWidth !== saved.sx) { saved.sx = restoredWidth; groundAspectChanged = true; }
      const restoredCategory = saved.category || (saved.assetName === 'crate' ? 'gameplay' : 'dressing');
      const restoredLocked = typeof saved.gameplayLayerLocked === 'boolean' ? saved.gameplayLayerLocked : (saved.category === 'gameplay' || saved.assetName === 'crate');
      const restoredZ = restoredCategory === 'gameplay' && restoredLocked ? pathZ : saved.z;
      const currentBaseY = terrainAnchorBaseY(saved.x, restoredZ, restoredCategory, restoredLocked, saved.assetName);
      const legacyBaseY = legacyTerrainAnchorBaseY(saved.x, restoredZ, restoredCategory, restoredLocked);
      const restoredGroundLine = Rig.clamp(Number.isFinite(saved.groundLine) ? Number(saved.groundLine) : assetGroundLineDefault(saved.assetName,saved.assetState || inferredAssetState(saved.assetName)), 0, 1);
      const restoredFreePlacement = typeof saved.freePlacement === 'boolean' ? saved.freePlacement : defaultFreePlacement(saved.assetName);
      const terrainOffset = Number.isFinite(saved.floorOffset)
        ? Number(saved.floorOffset) - restoredGroundLine * saved.sy
        : (Number.isFinite(saved.terrainOffset)
            ? Number(saved.terrainOffset)
            : (Number.isFinite(saved.y) ? Number(saved.y) - legacyBaseY : 0));
      const restoredY = restoredFreePlacement && Number.isFinite(saved.worldFloorY)
        ? Number(saved.worldFloorY) - restoredGroundLine * saved.sy
        : currentBaseY + terrainOffset;
      const obj = addObject(collection, saved.assetName, saved.x, restoredZ, restoredWidth, saved.sy, {
        id: saved.id, baseSx: saved.sx, baseSy: saved.sy, flip: saved.flip, assetState:saved.assetState || inferredAssetState(saved.assetName),
        y: restoredY, groundLine:restoredGroundLine, collision: cloneCollision(saved.collision), collisionOverride:!!saved.collisionOverride, deleted: saved.deleted,
        userAdded: true, shade: 1.0, opacity: 0.98, layer: classifyLayer(restoredZ),
        category: restoredCategory, gameplayType: saved.gameplayType || (saved.assetName === 'crate' ? 'crate' : null),
        gameplayLayerLocked: restoredLocked, freePlacement:restoredFreePlacement, wrap:false,
        worldGroupId:saved.worldGroupId || null,
        thoughtText:saved.thoughtText || '', thoughtRadius:saved.thoughtRadius, thoughtOnce:saved.thoughtOnce !== false,
        cameraNodeRadius:saved.cameraNodeRadius, cameraNodeOffsetX:saved.cameraNodeOffsetX,
        cameraNodeOffsetY:saved.cameraNodeOffsetY, cameraNodeOffsetZ:saved.cameraNodeOffsetZ,
        cameraNodeCurveStart:saved.cameraNodeCurveStart, cameraNodeCurveEnd:saved.cameraNodeCurveEnd
      });
      obj.sx = restoredWidth; obj.sy = saved.sy;
      // Defensive ownership reconciliation. sceneData is authoritative.
      if ('worldGroupId' in saved) obj.worldGroupId = saved.worldGroupId || null;
      if (obj.category === 'gameplay' && obj.gameplayLayerLocked) moveObjectToCorrectCollection(obj);
    }
    if (groundAspectChanged) saveSceneData();
    backdrop.sort((a,b)=>a.z-b.z);
    midfill.sort((a,b)=>a.z-b.z);
    frontOccluders.sort((a,b)=>a.z-b.z);
  }


  function matchesRiverBankAutoId(item, sectionIndex) {
    const prefix = `riverbank-${Math.trunc(Number(sectionIndex) || 0)}-`;
    return typeof item?.id === 'string' && item.id.startsWith(prefix);
  }

  function clearAutoRiverBankDressing(sectionIndex, { save = true } = {}) {
    const i = Math.trunc(Number(sectionIndex) || 0);
    let removed = 0;
    for (const list of [backdrop, midfill, frontOccluders]) {
      for (let index = list.length - 1; index >= 0; index -= 1) {
        const obj = list[index];
        if (!matchesRiverBankAutoId(obj, i)) continue;
        if (selectedObject === obj) selectedObject = null;
        list.splice(index, 1);
        removed += 1;
      }
    }
    if (Array.isArray(sceneData.added)) {
      sceneData.added = sceneData.added.filter(saved => !matchesRiverBankAutoId(saved, i));
    }
    if (save) saveSceneData();
    return removed;
  }

  function weightedChoice(entries, random) {
    const total = entries.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
    if (!(total > 0)) return entries[0] || null;
    let n = random() * total;
    for (const item of entries) {
      n -= Math.max(0, Number(item.weight) || 0);
      if (n <= 0) return item;
    }
    return entries[entries.length - 1] || null;
  }

  function removePuzzleModifierDressing(instance) {
    if (!instance?.modifierObjects?.length) { if (instance) instance.modifierObjects = []; return 0; }
    const remove = new Set(instance.modifierObjects);
    let count = 0;
    for (const list of [backdrop, midfill, frontOccluders]) {
      for (let i=list.length-1;i>=0;i--) {
        if (!remove.has(list[i])) continue;
        if (selectedObject === list[i]) selectedObject = null;
        list.splice(i,1);
        count += 1;
      }
    }
    instance.modifierObjects = [];
    return count;
  }

  function buildPuzzleRiverBankDressing(instance) {
    if (!instance?.marker) return 0;
    removePuzzleModifierDressing(instance);
    instance.modifierObjects ||= [];
    const modifiers = resolvedPuzzleWorldModifiers().filter(mod => mod.markerId === instance.marker.id && mod.type === 'river');
    let totalPlaced = 0;

    const innerDefs = [
      { type:'ground11', weight:1.25, min:0.88, max:1.12, family:'foliage' },
      { type:'ground12', weight:1.15, min:0.98, max:1.24, family:'foliage' },
      { type:'ground03', weight:1.10, min:0.96, max:1.22, family:'foliage' },
      { type:'ground06', weight:1.00, min:0.98, max:1.28, family:'foliage' },
      { type:'ground02', weight:0.88, min:1.04, max:1.34, family:'foliage' },
      { type:'ground04', weight:0.82, min:0.98, max:1.28, family:'foliage' },
      { type:'ground09', weight:0.18, min:0.78, max:0.96, family:'rock' }
    ];
    const outerDefs = [
      { type:'ground01', weight:1.18, min:0.94, max:1.20, family:'foliage' },
      { type:'ground05', weight:0.94, min:0.84, max:1.06, family:'foliage' },
      { type:'ground07', weight:1.05, min:0.80, max:1.02, family:'foliage' },
      { type:'ground08', weight:0.66, min:0.96, max:1.24, family:'foliage' },
      { type:'ground11', weight:0.74, min:0.86, max:1.10, family:'foliage' },
      { type:'ground09', weight:0.34, min:0.78, max:0.98, family:'rock' },
      { type:'ground10', weight:0.20, min:0.96, max:1.22, family:'rock' }
    ];
    const waterEdgeDefs = [
      { type:'ground11', weight:1.30, min:0.62, max:0.88, family:'foliage' },
      { type:'ground12', weight:1.16, min:0.68, max:0.94, family:'foliage' },
      { type:'ground03', weight:0.88, min:0.64, max:0.90, family:'foliage' },
      { type:'ground07', weight:0.76, min:0.58, max:0.82, family:'foliage' }
    ];

    for (const mod of modifiers) {
      const dress = puzzleRiverBankDressingSettings(mod);
      if (!dress.enabled || dress.style !== 'woodland') continue;
      const random = mulberry32(dress.seed || 1);
      const extent = puzzleRiverExtent(mod);
      const placed = [];
      let placedCount = 0;

      // Snapshot relevant authored/gameplay blockers once for this modifier.
      // The previous implementation rebuilt/scanned the complete scene for every
      // attempted grass/rock placement. On a mature local save this could turn a
      // single streamed puzzle load into hundreds of full-scene scans on iPhone.
      const sceneBlockers = allSceneObjects().filter(obj => {
        if (!obj || obj.deleted || obj.carried || obj.worldModifierDressing) return false;
        const ox = Number(obj.x) || 0;
        if (ox < extent.minX - 1.5 || ox > extent.maxX + 1.5) return false;
        if (!obj.userAdded && !obj.puzzleInstanceId && obj.category === 'dressing') return false;
        return true;
      });

      function blocked(x, z, spacingX, spacingZ, allowChannel = false) {
        if (x <= extent.minX + 0.10 || x >= extent.maxX - 0.10) return true;
        if (z <= WORLD.farZ + 0.4 || z >= WORLD.nearZ - 0.2) return true;
        if (!allowChannel && pointInsideRiverChannel(x, z)) return true;
        for (const item of placed) {
          if (Math.abs(item.x - x) < item.spacingX + spacingX && Math.abs(item.z - z) < item.spacingZ + spacingZ) return true;
        }
        for (const obj of sceneBlockers) {
          const ox = Number(obj.x) || 0;
          const oz = Number.isFinite(obj.z) ? obj.z : pathZ;
          const otherSpacingX = Math.max(0.48, Math.abs(obj.sx || 1) * 0.34);
          const otherSpacingZ = Math.max(0.36, obj.collision?.depth || Math.min(1.20, 0.26 + Math.abs(obj.sy || 1) * 0.10));
          if (Math.abs(ox - x) < otherSpacingX + spacingX && Math.abs(oz - z) < otherSpacingZ + spacingZ) return true;
        }
        return false;
      }

      function place(def, x, z, height, spacingX, spacingZ, { waterEdge = false } = {}) {
        if (blocked(x, z, spacingX, spacingZ, waterEdge)) return false;
        const width = height * (assetAspect[def.type] || 1);
        const groundLine = assetGroundLineDefault(def.type);
        const profile = puzzleRiverProfileAtZ(mod, z);
        const floorY = waterEdge ? profile.waterY - 0.09 : terrainAnchorBaseY(x, z, 'dressing', false, def.type);
        const obj = addObject(targetCollectionForZ(z), def.type, x, z, width, height, {
          id:`puzzle-${instance.id}-${mod.id || 'river'}-dress-${placedCount + 1}`,
          userAdded:false,
          baseSx:width, baseSy:height,
          y:floorY - groundLine * height,
          groundLine, shade:1, opacity:0.99, category:'dressing',
          flip:random() > 0.5, wrap:false, collision:null, collisionOverride:false,
          puzzleInstanceId:instance.id
        });
        obj.worldModifierDressing = true;
        obj.worldModifierId = mod.id || 'river';
        instance.modifierObjects.push(obj);
        placed.push({ x, z, spacingX, spacingZ });
        placedCount += 1;
        totalPlaced += 1;
        return true;
      }

      for (const side of ['left','right']) {
        const dir = side === 'left' ? -1 : 1;
        for (let z=WORLD.farZ+1.0; z<=WORLD.nearZ-0.7; z += 0.44 + random()*0.28) {
          const focusFalloff = Math.abs(z - pathZ) < 0.95 ? 0.68 : 1;
          const profile = puzzleRiverProfileAtZ(mod, z);
          const lip = side === 'left' ? profile.leftLip : profile.rightLip;
          if (random() < 0.90 * focusFalloff) {
            const def=weightedChoice(innerDefs,random), attemptZ=z+(random()-0.5)*0.22, x=lip+dir*(0.14+random()*0.38), height=def.min+random()*(def.max-def.min);
            place(def,x,attemptZ,height,def.family==='rock'?0.68:0.54,def.family==='rock'?0.46:0.34);
          }
          if (random() < 0.58 * focusFalloff) {
            const def=weightedChoice(outerDefs,random), attemptZ=z+(random()-0.5)*0.34, x=lip+dir*(0.56+random()*0.94), height=def.min+random()*(def.max-def.min);
            place(def,x,attemptZ,height,def.family==='rock'?0.86:0.70,def.family==='rock'?0.54:0.42);
          }
          if (random() < 0.18 * focusFalloff) {
            const def=weightedChoice(innerDefs,random), attemptZ=z+(random()-0.5)*0.18, x=lip+dir*(0.10+random()*0.24), height=(def.min+random()*(def.max-def.min))*0.82;
            place(def,x,attemptZ,height,0.42,0.28);
          }
          if (random() < 0.46 * focusFalloff) {
            const def=weightedChoice(waterEdgeDefs,random), attemptZ=z+(random()-0.5)*0.26, x=lip-dir*(0.10+random()*0.28), height=def.min+random()*(def.max-def.min);
            place(def,x,attemptZ,height,0.38,0.32,{waterEdge:true});
          }
        }
      }
    }
    sortSceneCollections();
    return totalPlaced;
  }

  function rebuildPuzzleWorldModifierDressing(instance) {
    if (!instance) return 0;
    return buildPuzzleRiverBankDressing(instance);
  }

  function autoDressRiverBanks(sectionIndex) {
    const i = Math.trunc(Number(sectionIndex) || 0);
    if (terrainSectionType(i) !== 'river') return 0;
    clearAutoRiverBankDressing(i, { save:false });
    const bounds = terrainSectionBounds(i);
    const random = mulberry32((((Date.now() >>> 0) ^ (((i + 1) * 2654435761) >>> 0)) >>> 0) || 1);
    const innerDefs = [
      { type:'ground11', weight:1.25, min:0.88, max:1.12, family:'foliage' },
      { type:'ground12', weight:1.15, min:0.98, max:1.24, family:'foliage' },
      { type:'ground03', weight:1.10, min:0.96, max:1.22, family:'foliage' },
      { type:'ground06', weight:1.00, min:0.98, max:1.28, family:'foliage' },
      { type:'ground02', weight:0.88, min:1.04, max:1.34, family:'foliage' },
      { type:'ground04', weight:0.82, min:0.98, max:1.28, family:'foliage' },
      { type:'ground09', weight:0.18, min:0.78, max:0.96, family:'rock' }
    ];
    const outerDefs = [
      { type:'ground01', weight:1.18, min:0.94, max:1.20, family:'foliage' },
      { type:'ground05', weight:0.94, min:0.84, max:1.06, family:'foliage' },
      { type:'ground07', weight:1.05, min:0.80, max:1.02, family:'foliage' },
      { type:'ground08', weight:0.66, min:0.96, max:1.24, family:'foliage' },
      { type:'ground11', weight:0.74, min:0.86, max:1.10, family:'foliage' },
      { type:'ground09', weight:0.34, min:0.78, max:0.98, family:'rock' },
      { type:'ground10', weight:0.20, min:0.96, max:1.22, family:'rock' }
    ];
    const waterEdgeDefs = [
      { type:'ground11', weight:1.30, min:0.62, max:0.88, family:'foliage' },
      { type:'ground12', weight:1.16, min:0.68, max:0.94, family:'foliage' },
      { type:'ground03', weight:0.88, min:0.64, max:0.90, family:'foliage' },
      { type:'ground07', weight:0.76, min:0.58, max:0.82, family:'foliage' }
    ];
    const placed = [];
    let placedCount = 0;

    function blocked(x, z, spacingX, spacingZ, allowChannel = false) {
      if (terrainSectionIndexAt(x) !== i) return true;
      if (x <= bounds.minX + 0.12 || x >= bounds.maxX - 0.12) return true;
      if (z <= WORLD.farZ + 0.4 || z >= WORLD.nearZ - 0.2) return true;
      if (!allowChannel && pointInsideRiverChannel(x, z, i)) return true;
      for (const item of placed) {
        if (Math.abs(item.x - x) < item.spacingX + spacingX && Math.abs(item.z - z) < item.spacingZ + spacingZ) return true;
      }
      for (const obj of allSceneObjects()) {
        if (!obj || obj.deleted || obj.carried) continue;
        if (terrainSectionIndexAt(obj.x) !== i) continue;
        if (matchesRiverBankAutoId(obj, i)) continue;
        if (!obj.userAdded && !obj.puzzleInstanceId && obj.category === 'dressing') continue;
        const ox = Number(obj.x) || 0;
        const oz = Number.isFinite(obj.z) ? obj.z : pathZ;
        const otherSpacingX = Math.max(0.48, Math.abs(obj.sx || 1) * 0.34);
        const otherSpacingZ = Math.max(0.36, obj.collision?.depth || Math.min(1.20, 0.26 + Math.abs(obj.sy || 1) * 0.10));
        if (Math.abs(ox - x) < otherSpacingX + spacingX && Math.abs(oz - z) < otherSpacingZ + spacingZ) return true;
      }
      return false;
    }

    function place(def, x, z, height, spacingX, spacingZ, { waterEdge = false } = {}) {
      if (blocked(x, z, spacingX, spacingZ, waterEdge)) return false;
      const width = height * (assetAspect[def.type] || 1);
      const id = `riverbank-${i}-${Date.now().toString(36)}-${placedCount + 1}`;
      const groundLine = assetGroundLineDefault(def.type);
      const floorY = waterEdge ? riverProfileAtZ(i, z).waterY - 0.09 : terrainAnchorBaseY(x, z, 'dressing', false, def.type);
      const obj = addObject(targetCollectionForZ(z), def.type, x, z, width, height, {
        id,
        userAdded:true,
        baseSx:width,
        baseSy:height,
        y:floorY - groundLine * height,
        groundLine,
        shade:1,
        opacity:0.99,
        category:'dressing',
        flip:random() > 0.5,
        wrap:false,
        collision:null,
        collisionOverride:false
      });
      obj.autoRiverBank = true;
      moveObjectToCorrectCollection(obj);
      recordObjectEdit(obj);
      placed.push({ x, z, spacingX, spacingZ });
      placedCount += 1;
      return true;
    }

    for (const side of ['left', 'right']) {
      const dir = side === 'left' ? -1 : 1;
      for (let z = WORLD.farZ + 1.0; z <= WORLD.nearZ - 0.7; z += 0.44 + random() * 0.28) {
        const focusFalloff = Math.abs(z - pathZ) < 0.95 ? 0.68 : 1;
        const profile = riverProfileAtZ(i, z);
        const lip = side === 'left' ? profile.leftLip : profile.rightLip;
        if (random() < 0.90 * focusFalloff) {
          const def = weightedChoice(innerDefs, random);
          const attemptZ = z + (random() - 0.5) * 0.22;
          const x = lip + dir * (0.14 + random() * 0.38);
          const height = def.min + random() * (def.max - def.min);
          const spacingX = def.family === 'rock' ? 0.68 : 0.54;
          const spacingZ = def.family === 'rock' ? 0.46 : 0.34;
          place(def, x, attemptZ, height, spacingX, spacingZ);
        }
        if (random() < 0.58 * focusFalloff) {
          const def = weightedChoice(outerDefs, random);
          const attemptZ = z + (random() - 0.5) * 0.34;
          const x = lip + dir * (0.56 + random() * 0.94);
          const height = def.min + random() * (def.max - def.min);
          const spacingX = def.family === 'rock' ? 0.86 : 0.70;
          const spacingZ = def.family === 'rock' ? 0.54 : 0.42;
          place(def, x, attemptZ, height, spacingX, spacingZ);
        }
        if (random() < 0.18 * focusFalloff) {
          const def = weightedChoice(innerDefs, random);
          const attemptZ = z + (random() - 0.5) * 0.18;
          const x = lip + dir * (0.10 + random() * 0.24);
          const height = (def.min + random() * (def.max - def.min)) * 0.82;
          place(def, x, attemptZ, height, 0.42, 0.28);
        }
        if (random() < 0.46 * focusFalloff) {
          const def = weightedChoice(waterEdgeDefs, random);
          const attemptZ = z + (random() - 0.5) * 0.26;
          const x = lip - dir * (0.10 + random() * 0.28);
          const height = def.min + random() * (def.max - def.min);
          place(def, x, attemptZ, height, 0.38, 0.32, { waterEdge:true });
        }
      }
    }

    sortSceneCollections();
    saveSceneData();
    return placedCount;
  }

  // Editor state is needed by puzzle streaming, including the initial stream
  // performed during startup. Keep these declarations above that first call so
  // the game cannot hit a temporal-dead-zone error before the first frame.
  let editMode = false;
  let editorScope = 'environment';
  let editorPuzzleMarkerId = null;
  let editorPuzzleLibraryGroupId = null;
  let scenePuzzleListSignature = '';
  let sceneEnvironmentListSignature = '';
  let environmentSelectionFilter = 'all';
  let selectionTapCycle = null;
  let selectedWorldGroupId = null;
  let worldGroupEditMode = false;
  let worldGroupMoveMode = false;
  let worldGroupExclusionEditMode = false;
  let worldGroupExclusionHandle = null;
  let worldGroupListSignature = '';
  let selectedWorldTemplateId = null;
  let worldGroupTemplatePlaceMode = false;
  let worldGroupTemplateListSignature = '';
  let puzzleLibraryListSignature = '';
  let puzzleObjectListSignature = '';
  let puzzleBrowserMode = 'scene';

  applyPersistedMarkerPositions();
  // Puzzle Lab owns a disposable scene. Woodland can opt into the procedural
  // forest, while Blank/Mountain stay clean so the puzzle/mechanic is readable.
  if (!PUZZLE_LAB_MODE || PUZZLE_LAB_ENVIRONMENT === 'woodland') scatterForest();
  // v1.0.90: secondary biome candidate pools are streamed on demand from the
  // World Lab transition preload/drop windows instead of living in every scene.
  // Scene storage is namespaced in Puzzle Lab, so restoring lab-authored
  // dressing is safe and never reads/writes the main game's scene edits.
  restoreSceneEdits();

  // Group membership is stored on each authored scene row as worldGroupId.
  // Validate that saved ownership and reconstructed runtime ownership match on
  // every load; repair runtime state from the saved row if anything diverges.
  function reconcileWorldGroupMembershipIntegrity(){
    const validGroups=new Set(worldGroups().map(group=>group.id));
    const runtimeById=new Map(allSceneObjects().filter(obj=>obj?.userAdded).map(obj=>[obj.id,obj]));
    let repaired=0;
    for(const saved of sceneData.added||[]){
      if(!saved?.id)continue;
      if(saved.worldGroupId&&!validGroups.has(saved.worldGroupId)){
        saved.worldGroupId=null;repaired+=1;
      }
      const obj=runtimeById.get(saved.id);
      if(obj&&(obj.worldGroupId||null)!==(saved.worldGroupId||null)){
        obj.worldGroupId=saved.worldGroupId||null;repaired+=1;
      }
    }
    if(repaired)saveSceneData();
    return repaired;
  }
  reconcileWorldGroupMembershipIntegrity();
  // Migrate older marker-specific authored starts into reusable templates, then
  // persist the normalized library so previous authored work remains available.
  migratePuzzleTemplates();
  savePuzzleLibrary();
  applyWorldLabPendingPuzzleMoves();
  if (PUZZLE_LAB_MODE) {
    editorPuzzleMarkerId = puzzleLabMarker.id;
    editorPuzzleLibraryGroupId = PUZZLE_LAB_GROUP_ID;
    puzzleBrowserMode = 'scene';
  } else if (puzzleWorkshopIsolated && !puzzleWorkshopClear) {
    const pinned = markerForId(puzzleWorkshopState.markerId);
    if (pinned) { editorPuzzleMarkerId = pinned.id; puzzleBrowserMode = 'scene'; }
    else {
      puzzleWorkshopClear = true;
      puzzleWorkshopState.clear = true;
      puzzleWorkshopState.markerId = null;
      savePuzzleWorkshopState(null);
    }
  }
  updatePuzzleStreaming(0);
  settleGameplayCrates();

  const character = {
    x: 0,
    y: playSurfaceYAt(0),
    z: pathZ,
    scale: 2.31,
    tint: [1.0, 1.0, 1.0],
    opacity: 0.99,
    screenOffsetX: -0.18,
    distanceTravelled: 0,
    lastFacing: 1
  };

  function characterRenderY() {
    return character.y + CHARACTER_SOLE_ART_LOCAL_OFFSET * character.scale;
  }

  const SHARED_ANIM_KEY = 'gamehub.walklab.anim.v4';
  const SHARED_CLIPS_KEY = 'gamehub.walklab.anim.v6';
  const PREVIOUS_CLIPS_KEY = 'gamehub.walklab.anim.v5';
  let characterFrames = Rig.DEFAULT_FRAMES.map(Rig.clone);
  let runFrames = Rig.RUN_FRAMES.map(Rig.clone);
  let jumpFrames = Rig.JUMP_FRAMES.map(Rig.clone);
  function refreshCharacterFrames() {
    try {
      const clips = JSON.parse(localStorage.getItem(SHARED_CLIPS_KEY) || 'null');
      if (clips?.walk?.length === 16) characterFrames = clips.walk.map((p,i) => Rig.normalizedPose(p,i));
      if (clips?.run?.length === 16) runFrames = clips.run.map((p,i) => Rig.normalizedPose(p,i));
      if (clips?.jump?.length === 16) jumpFrames = clips.jump.map((p,i) => Rig.normalizedPose(p,i));
      if (!clips?.walk) {
        // Carry forward only the proven walk from the previous locomotion key.
        // Run/jump intentionally reset to the new v1.8.74 defaults so an older
        // saved experiment cannot silently overwrite this refinement pass.
        const previous = JSON.parse(localStorage.getItem(PREVIOUS_CLIPS_KEY) || 'null');
        if (previous?.walk?.length === 16) characterFrames = previous.walk.map((p,i) => Rig.normalizedPose(p,i));
        else {
          const saved = JSON.parse(localStorage.getItem(SHARED_ANIM_KEY) || 'null');
          if (saved?.frames?.length === 16) characterFrames = saved.frames.map((p,i) => Rig.normalizedPose(p,i));
        }
      }
    } catch (_) {}
  }
  refreshCharacterFrames();

  let characterCollider = Rig.loadCollider ? Rig.loadCollider() : Rig.normalizedCollider();
  function refreshCharacterCollider() {
    characterCollider = Rig.loadCollider ? Rig.loadCollider() : Rig.normalizedCollider(characterCollider);
  }
  function colliderWorld() {
    return {
      offsetX: characterCollider.offsetX * character.scale,
      radius: characterCollider.radius * character.scale,
      height: characterCollider.height * character.scale,
      bottom: characterCollider.bottom * character.scale,
      footProbe: characterCollider.footProbe * character.scale,
      stepUp: characterCollider.stepUp * character.scale,
      stepDown: characterCollider.stepDown * character.scale
    };
  }

  const debugTints = {
    ground: [0.50, 0.46, 0.75],
    character: [0.86, 0.58, 0.32],
    foreground: [0.70, 0.32, 0.28],
    near: [0.67, 0.43, 0.31],
    mid: [0.42, 0.59, 0.55],
    far: [0.37, 0.48, 0.68]
  };

  const camera = {
    x: 0,
    y: -3.00,
    z: 13.80,
    // This is intentionally ABOVE the camera Y: the camera is now actually
    // tilted upward a little, which places the character/path lower in frame.
    targetY: -2.15,
    targetZ: -13.0
  };

  const CAMERA_TUNE_STORAGE_KEY = 'sidescroll-camera-tune-v1';
  const CAMERA_FOLLOW_STORAGE_KEY = 'sidescroll-camera-follow-v1';
  const PLAYER_HINT_STORAGE_KEY = 'sidescroll-player-hints-v1';
  const CAMERA_Y_STEP = 0.12;
  const CAMERA_Z_STEP = 0.35;
  const CAMERA_TILT_STEP = 0.12;
  const CAMERA_FOLLOW_DEADZONE = 0.08;
  const CAMERA_FOLLOW_MAX = 12.0;
  let cameraEditMode = false;
  let playerHintsEnabled = true;
  let cameraBaseY = camera.y;
  let cameraBaseTilt = camera.targetY - camera.y;
  let cameraFollowEnabled = true;
  // v1.0.76: full-height follow is the new baseline. Older builds defaulted to
  // 55%, which left Aureli visibly pressed toward the top of frame on tall
  // climbs and authored terrain rises. Keep the user control, but migrate the
  // untouched legacy default to 100%.
  let cameraFollowAmount = 1.0;
  let cameraFollowOffset = 0;
  try {
    const rawCamera = localStorage.getItem(CAMERA_TUNE_STORAGE_KEY);
    const savedCamera = rawCamera !== null
      ? JSON.parse(rawCamera || 'null')
      : BAKED_GAME_DESIGN?.camera;
    if (savedCamera && Number.isFinite(savedCamera.y) && Number.isFinite(savedCamera.z)) {
      cameraBaseTilt = Number.isFinite(savedCamera.tilt) ? savedCamera.tilt : cameraBaseTilt;
      cameraBaseY = savedCamera.y;
      camera.y = cameraBaseY;
      camera.z = savedCamera.z;
      camera.targetY = cameraBaseY + cameraBaseTilt;
    }
    const savedFollow = JSON.parse(localStorage.getItem(CAMERA_FOLLOW_STORAGE_KEY) || 'null');
    if (savedFollow) {
      if (typeof savedFollow.enabled === 'boolean') cameraFollowEnabled = savedFollow.enabled;
      if (Number.isFinite(savedFollow.amount)) {
        const savedAmount = Rig.clamp(savedFollow.amount, 0, 1);
        cameraFollowAmount = Math.abs(savedAmount - 0.55) < 0.001 ? 1.0 : savedAmount;
      }
    }
    playerHintsEnabled = localStorage.getItem(PLAYER_HINT_STORAGE_KEY) !== '0';
  } catch (_) {}

  function restorePlayerPosition() {
    if (!PLAYER_MODE) return;
    try {
      const saved = JSON.parse(localStorage.getItem(PLAYER_POSITION_STORAGE_KEY) || 'null');
      // World Lab's explicit Play From Here position overrides the normal
      // continuation position. Persist it immediately so a refresh continues
      // from the requested test point rather than snapping back to the old save.
      if (Number.isFinite(WORLD_LAB_JUMP_X)) {
        character.x = WORLD_LAB_JUMP_X;
        character.lastFacing = saved?.facing === -1 ? -1 : 1;
        const requestedY = playSurfaceYAt(character.x);
        character.y = Number.isFinite(requestedY) ? requestedY : pathGroundYAt(character.x, pathZ);
        camera.x = character.x - character.screenOffsetX;
        previousCameraX = camera.x;
        updatePuzzleStreaming(character.x);
        if (statusEl) statusEl.textContent = `World Lab test · ${character.x.toFixed(1)} m`;
        localStorage.setItem(PLAYER_POSITION_STORAGE_KEY, JSON.stringify({ x:character.x, facing:character.lastFacing, savedAt:Date.now(), source:'world-lab' }));
        return;
      }
      if (!saved || !Number.isFinite(saved.x)) return;
      camera.x = saved.x - character.screenOffsetX;
      previousCameraX = camera.x;
      character.x = saved.x;
      character.lastFacing = saved.facing === -1 ? -1 : 1;
      character.y = playSurfaceYAt(character.x);
      updatePuzzleStreaming(character.x);
    } catch (_) {}
  }

  let lastPlayerPositionSave = 0;
  function savePlayerPosition(force = false) {
    if (!PLAYER_MODE || playerSaveDeletionInProgress) return;
    const now = performance.now();
    if (!force && now - lastPlayerPositionSave < 1200) return;
    lastPlayerPositionSave = now;
    try {
      localStorage.setItem(PLAYER_POSITION_STORAGE_KEY, JSON.stringify({ x:character.x, facing:character.lastFacing, savedAt:Date.now() }));
    } catch (_) {}
  }

  function saveCameraTune() {
    try { localStorage.setItem(CAMERA_TUNE_STORAGE_KEY, JSON.stringify({ y:cameraBaseY, z:camera.z, tilt:cameraBaseTilt })); } catch (_) {}
  }
  function saveCameraFollow() {
    try { localStorage.setItem(CAMERA_FOLLOW_STORAGE_KEY, JSON.stringify({ enabled:cameraFollowEnabled, amount:cameraFollowAmount })); } catch (_) {}
  }
  function syncCameraFollowUi() {
    if (cameraFollowInput) cameraFollowInput.checked = cameraFollowEnabled;
    if (cameraFollowAmountInput) cameraFollowAmountInput.value = String(cameraFollowAmount);
    if (cameraFollowValue) cameraFollowValue.textContent = `${Math.round(cameraFollowAmount * 100)}%`;
  }
  function updateCameraEditorUi() {
    if (cameraEditorPanel) cameraEditorPanel.hidden = !cameraEditMode;
    if (cameraEditorBtn) {
      cameraEditorBtn.classList.toggle('active', !!cameraEditMode);
      cameraEditorBtn.setAttribute('aria-expanded', String(!!cameraEditMode));
    }
    if (cameraValuesEl) {
      const followSuffix = Math.abs(cameraFollowOffset) > 0.005 ? ` · FOLLOW ${cameraFollowOffset >= 0 ? '+' : ''}${cameraFollowOffset.toFixed(2)}` : '';
      cameraValuesEl.textContent = `Y ${camera.y.toFixed(2)} · Z ${camera.z.toFixed(2)} · TILT ${cameraBaseTilt.toFixed(2)}${followSuffix}`;
    }
    syncCameraFollowUi();
  }
  function nudgeCamera(dy=0, dz=0) {
    cameraBaseY = Rig.clamp(cameraBaseY + dy, -6.0, 1.5);
    camera.z = Rig.clamp(camera.z + dz, 5.0, 28.0);
    camera.y = cameraBaseY + cameraFollowOffset;
    camera.targetY = camera.y + cameraBaseTilt;
    saveCameraTune();
    updateCameraEditorUi();
  }

  function nudgeCameraTilt(delta=0) {
    cameraBaseTilt = Rig.clamp(cameraBaseTilt + delta, -2.5, 3.0);
    camera.targetY = camera.y + cameraBaseTilt;
    saveCameraTune();
    updateCameraEditorUi();
  }

  function updateCameraFollow(dt) {
    // Normal gameplay follows the full vertical displacement of the character.
    // Edit mode is different: its *baseline* must always follow the authored
    // terrain height, otherwise a saved Follow Height value of 0/off drops the
    // editor camera back to the old flat-world Y=0 reference on raised sections.
    // Manual camera Y/Z/tilt tuning still works on top of this terrain anchor.
    const legacySurface = legacyPathGroundYAt(character.x, pathZ);
    const terrainSurface = playSurfaceYAt(character.x);
    const terrainOffset = terrainSurface - legacySurface;
    let rawHeight = character.y - legacySurface;
    if (Math.abs(rawHeight) < CAMERA_FOLLOW_DEADZONE) rawHeight = 0;

    let targetOffset;
    if (editMode) {
      // Asset placement/editing is terrain-relative by definition. Keep the
      // viewport looking at the current section even when character-follow is
      // disabled in the camera panel. Any above-ground character offset can
      // still be blended in when Follow Height is enabled.
      let aboveTerrain = character.y - terrainSurface;
      if (Math.abs(aboveTerrain) < CAMERA_FOLLOW_DEADZONE) aboveTerrain = 0;
      targetOffset = terrainOffset + (cameraFollowEnabled ? aboveTerrain * cameraFollowAmount : 0);
    } else {
      targetOffset = rawHeight;
    }

    const response = Math.abs(targetOffset) > Math.abs(cameraFollowOffset) ? 3.8 : 3.2;
    const blend = 1 - Math.exp(-response * Math.max(0, dt));
    cameraFollowOffset += (targetOffset - cameraFollowOffset) * blend;
    if (Math.abs(cameraFollowOffset - targetOffset) < 0.0005) cameraFollowOffset = targetOffset;
    camera.y = cameraBaseY + cameraFollowOffset;
    camera.targetY = camera.y + cameraBaseTilt;
  }

  const CAMERA_NODE_TRANSITION_SECONDS = 2.0;
  const cameraNodeCurrentOffset = { x:0, y:0, z:0 };
  let activeCameraNodeId = null;
  let cameraNodeLastCurveStart = 0;
  let cameraNodeLastCurveEnd = 0;
  const cameraNodeTween = {
    from:{x:0,y:0,z:0}, to:{x:0,y:0,z:0}, elapsed:CAMERA_NODE_TRANSITION_SECONDS,
    duration:CAMERA_NODE_TRANSITION_SECONDS, curveStart:0, curveEnd:0, targetKey:'normal'
  };

  function cameraNodeCurveSetting(value) {
    const n=Number(value);
    return Number.isFinite(n) ? Rig.clamp(n,-1,1) : 0;
  }

  function cameraNodeCurveLabel(value) {
    const v=cameraNodeCurveSetting(value);
    if(Math.abs(v)<0.025)return 'LINEAR';
    return `${v>0?'FAST':'SLOW'} ${Math.round(Math.abs(v)*100)}%`;
  }

  // Cubic Hermite progress with independently authored endpoint speeds.
  // 0 = linear (slope 1), negative = gentler/slower endpoint, positive = faster.
  // The constrained slope range remains monotonic, so the camera never overshoots.
  function cameraNodeCurveProgress(t, curveStart, curveEnd) {
    const u=Rig.clamp(Number(t)||0,0,1);
    const m0=1 + 0.85*cameraNodeCurveSetting(curveStart);
    const m1=1 + 0.85*cameraNodeCurveSetting(curveEnd);
    const u2=u*u, u3=u2*u;
    return Rig.clamp((u3-2*u2+u)*m0 + (-2*u3+3*u2) + (u3-u2)*m1,0,1);
  }

  function cameraNodeTargetForPlayer() {
    if (introLocked) return null;
    // While authoring, selecting a Camera Node previews its framing live so the
    // composition can be tuned without bouncing in and out of Edit mode.
    if (editMode) return selectedIsCameraTrigger() ? selectedObject : null;
    const playerX=Number(character.x)||0;
    const playerZ=Number(character.z)||pathZ;
    let best=null;
    for(const obj of allSceneObjects()){
      if(!obj || obj.deleted || obj.assetName!=='camera-trigger')continue;
      const radius=Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20);
      const dx=objectXNear(obj,playerX)-playerX;
      const dz=(Number(obj.z)||pathZ)-playerZ;
      const distance=Math.hypot(dx,dz);
      if(distance>radius)continue;
      const score=distance/Math.max(.001,radius);
      if(!best || score<best.score)best={obj,score};
    }
    return best?.obj || null;
  }

  function updateCameraNodeOffset(dt) {
    const node=cameraNodeTargetForPlayer();
    activeCameraNodeId=node?.id || null;
    const tx=node ? Rig.clamp(Number(node.cameraNodeOffsetX)||0,-8,8) : 0;
    const ty=node ? Rig.clamp(Number(node.cameraNodeOffsetY)||0,-5,5) : 0;
    const tz=node ? Rig.clamp(Number(node.cameraNodeOffsetZ)||0,-8,8) : 0;

    let curveStart, curveEnd;
    if(node){
      curveStart=cameraNodeCurveSetting(node.cameraNodeCurveStart);
      curveEnd=cameraNodeCurveSetting(node.cameraNodeCurveEnd);
      cameraNodeLastCurveStart=curveStart;
      cameraNodeLastCurveEnd=curveEnd;
    }else{
      // Leaving a node uses the same two-ended curve that brought the camera in:
      // Start shapes the departure from the node; End shapes the settle to normal.
      curveStart=cameraNodeLastCurveStart;
      curveEnd=cameraNodeLastCurveEnd;
    }

    const targetKey=node?.id || 'normal';
    const targetChanged = cameraNodeTween.targetKey!==targetKey
      || Math.abs(cameraNodeTween.to.x-tx)>.0005
      || Math.abs(cameraNodeTween.to.y-ty)>.0005
      || Math.abs(cameraNodeTween.to.z-tz)>.0005;

    if(targetChanged){
      cameraNodeTween.from={...cameraNodeCurrentOffset};
      cameraNodeTween.to={x:tx,y:ty,z:tz};
      cameraNodeTween.elapsed=0;
      cameraNodeTween.duration=CAMERA_NODE_TRANSITION_SECONDS;
      cameraNodeTween.targetKey=targetKey;
    }
    // Curve sliders can be tuned during a live preview without snapping/restarting
    // the camera. They shape the remainder of the current transition immediately.
    cameraNodeTween.curveStart=curveStart;
    cameraNodeTween.curveEnd=curveEnd;

    cameraNodeTween.elapsed=Math.min(cameraNodeTween.duration,cameraNodeTween.elapsed+Math.max(0,Number(dt)||0));
    const t=cameraNodeTween.duration>0 ? cameraNodeTween.elapsed/cameraNodeTween.duration : 1;
    const eased=cameraNodeCurveProgress(t,cameraNodeTween.curveStart,cameraNodeTween.curveEnd);
    cameraNodeCurrentOffset.x=cameraNodeTween.from.x+(cameraNodeTween.to.x-cameraNodeTween.from.x)*eased;
    cameraNodeCurrentOffset.y=cameraNodeTween.from.y+(cameraNodeTween.to.y-cameraNodeTween.from.y)*eased;
    cameraNodeCurrentOffset.z=cameraNodeTween.from.z+(cameraNodeTween.to.z-cameraNodeTween.from.z)*eased;
    if(t>=1){
      cameraNodeCurrentOffset.x=cameraNodeTween.to.x;
      cameraNodeCurrentOffset.y=cameraNodeTween.to.y;
      cameraNodeCurrentOffset.z=cameraNodeTween.to.z;
    }
  }

  let projection = mat4Identity();
  let debugDepth = false;
  let collisionDebugView = PUZZLE_LAB_MODE && PUZZLE_LAB_COLLISION;
  let driveAxis = 0;
  let drivePointer = null;
  let keyLeft = false;
  let keyRight = false;
  let keyRun = false;
  const DRIVE_DEADZONE = 0.08;
  const WALK_POINT = 0.50;
  const WALK_SPEED = 1.15;
  const RUN_SPEED = 2.85;
  // The body collider now comes from Walk Lab.  Only a tiny fixed skin stays
  // game-side so contact is stable at polygon boundaries.
  const PLAYER_COLLISION_SKIN = 0.040;
  const PLAYER_COLLISION_SAMPLES = 21;
  const PLAYER_COLLISION_FOOT_CLEARANCE = 0.012;
  const WALK_STRIDE = 1.45;
  const RUN_STRIDE = 2.05;
  const JUMP_VELOCITY = 5.24;
  const JUMP_GRAVITY = 9.20;
  const JUMP_DURATION = (JUMP_VELOCITY * 2) / JUMP_GRAVITY;

  let runBlend = 0;
  let locomotionPhase = 0;
  let jumping = false;
  let jumpTime = 0;
  let jumpOffset = 0;
  let jumpVelocity = 0;
  let jumpCameraBaseY = character.y;
  let standingOnObject = null;

  // Simple gameplay interaction state.  Crates are carried by the live rig,
  // not baked into an animation sheet: locomotion keeps driving the legs while
  // the arms are blended into a stable carrying pose.  Pick-up / put-down are
  // short authored transitions around that same pose.
  let carriedObject = null;
  let interactionState = null; // { type:'pickup'|'drop', time, duration, object, startX, startY, targetX, targetY }
  let autoDropStep = null; // short authored forward stack assist or backward ground-drop shuffle

  // v1.0.73 climb-path controller -------------------------------------------
  // Climbing no longer infers a route from collision geometry. A Climbable
  // asset owns one or more independent, invisible Climb Paths: effectively
  // ladders that may sit over rock, a real ladder sprite, vines, pipes, etc.
  // Collision is optional, so a ladder may be walked past while still offering
  // an ACTION climb. The path endpoints are authored in Asset Lab and follow
  // the asset's placement, flip and visual rotation.
  const CLIMB_ACTION_RANGE = 0.82;
  const CLIMB_VERTICAL_SPEED = 1.45;
  const CLIMB_ENTRY_MIN_DURATION = 0.06;
  const CLIMB_ENTRY_MAX_DURATION = 0.22;
  const CLIMB_SUPPORT_TOLERANCE = 0.72;
  let climbState = null;

  function climbPathPointWorld(obj, point, aroundX = obj.x) {
    if (!obj || !point) return null;
    const visual = assetVisualTransform(obj.assetName,obj.assetState);
    const visualAngle = (Number(visual.rotationDeg) || 0) * Math.PI / 180 + (Number(obj.runtimeRotation) || 0);
    const visualFlip = objectVisualFlip(obj);
    let lx = (Number(point.x) || 0) * (Number(obj.sx) || 1);
    const ly = (Number(point.y) || 0) * (Number(obj.sy) || 1);
    if (visualFlip) lx = -lx;
    const c = Math.cos(visualAngle), sn = Math.sin(visualAngle);
    const pivotX = aroundX + (Number(visual.offsetX) || 0);
    const pivotY = objectYAtDrawX(obj, aroundX) + (Number(visual.offsetY) || 0);
    return {
      x:pivotX + lx*c - ly*sn,
      y:pivotY + lx*sn + ly*c
    };
  }

  function climbPathWorldGeometries(obj, aroundX = obj?.x) {
    if (!obj || !objectHasBehaviour(obj,'climbable')) return [];
    const paths = assetClimbPaths(obj.assetName);
    return paths.map((path,index) => {
      const bottom = climbPathPointWorld(obj,path?.bottom || {x:0,y:0},aroundX);
      const top = climbPathPointWorld(obj,path?.top || {x:0,y:1},aroundX);
      if (!bottom || !top) return null;
      const width = Math.max(0.16,(Number(path?.widthRatio) || 0.12) * Math.max(0.001,Math.abs(Number(obj.sx) || 1)));
      const dx=top.x-bottom.x,dy=top.y-bottom.y;
      const length=Math.max(0.001,Math.hypot(dx,dy));
      return { obj,path,index,bottom,top,width,length,centreX:aroundX };
    }).filter(Boolean);
  }

  function nearestActionClimbTarget() {
    if (climbState || carriedObject || interactionState || pushingObject || jumping || editMode || inventoryOpen) return null;
    let best = null;
    const feetY = character.y;
    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted || obj.carried || !objectHasBehaviour(obj,'climbable')) continue;
      const aroundX = objectXNear(obj, character.x);
      const depth = obj.collision?.depth ?? 1.10;
      if (Math.abs((obj.z ?? pathZ) - pathZ) > Math.max(1.2, depth)) continue;
      for (const path of climbPathWorldGeometries(obj,aroundX)) {
        const actionRange=Math.max(CLIMB_ACTION_RANGE,path.width*.65+0.18);
        const bottomDx=Math.abs(character.x-path.bottom.x);
        const bottomDy=Math.abs(feetY-path.bottom.y);
        const topDx=Math.abs(character.x-path.top.x);
        const topDy=Math.abs(feetY-path.top.y);
        if (topDx<=actionRange && topDy<=0.58 && feetY>path.bottom.y+0.30) {
          const distance=topDx+topDy*.35;
          if(!best||distance<best.distance) best={...path,mode:'down',distance};
        }
        if (bottomDx<=actionRange && bottomDy<=0.62 && feetY<path.top.y-0.30) {
          const distance=bottomDx+bottomDy*.35;
          if(!best||distance<best.distance) best={...path,mode:'up',distance};
        }
      }
    }
    return best;
  }

  function climbSupportAtPoint(x,y,preferredObj=null) {
    const capsule=colliderWorld();
    const support=walkableSupportAt(x+capsule.offsetX,Infinity,0);
    if(!support) return null;
    const supportY=playSurfaceYAt(x)+support.offset;
    if(Math.abs(supportY-y)>CLIMB_SUPPORT_TOLERANCE) return null;
    return { ...support, y:supportY, preferred:preferredObj && support.obj===preferredObj };
  }

  function finishClimb() {
    const st = climbState;
    if (!st) return;
    const end = st.mode === 'up' ? st.top : st.bottom;
    const support = climbSupportAtPoint(end.x,end.y,st.obj);
    const endY = support ? support.y : end.y;
    camera.x = end.x - character.screenOffsetX;
    character.x = end.x;
    character.y = endY;
    jumpOffset = endY - playSurfaceYAt(end.x);
    standingOnObject = support?.obj || (st.mode==='up' ? st.obj : null);
    if (st.mode==='down' && Math.abs(endY-playSurfaceYAt(end.x))<0.12) {
      jumpOffset=0;
      standingOnObject=null;
      character.y=playSurfaceYAt(end.x);
    }
    jumping = false;
    jumpTime = 0;
    jumpVelocity = 0;
    climbState = null;
    hintEl.textContent = st.mode === 'up'
      ? 'On top · walk normally · ACTION at a climb path descends'
      : 'Climb complete';
    hintEl.classList.remove('hidden');
  }

  function startClimb(target) {
    if (!target || climbState || carriedObject || interactionState || pushingObject || jumping) return false;
    setDriveAxis(0);
    const startY = character.y;
    const objectCentre=objectXNear(target.obj,character.x);
    const entryTarget = target.mode === 'up' ? target.bottom : target.top;
    const entryDistance = Math.hypot(character.x - entryTarget.x, startY - entryTarget.y);
    const entryDuration = Rig.clamp(
      entryDistance / Math.max(0.001, CLIMB_VERTICAL_SPEED),
      CLIMB_ENTRY_MIN_DURATION,
      CLIMB_ENTRY_MAX_DURATION
    );
    const pathDuration = Math.max(0.001, target.length / CLIMB_VERTICAL_SPEED);
    climbState = {
      ...target,
      time:0,
      entryDuration,
      pathDuration,
      duration:entryDuration + pathDuration,
      start:{x:character.x,y:startY}
    };
    if(Math.abs(objectCentre-character.x)>.04) character.lastFacing = objectCentre>character.x ? 1 : -1;
    jumping = false;
    jumpTime = 0;
    jumpVelocity = 0;
    standingOnObject = null;
    hintEl.textContent = target.mode === 'up' ? 'Climbing…' : 'Climbing down…';
    hintEl.classList.remove('hidden');
    return true;
  }

  function updateClimbState(dt) {
    const st = climbState;
    if (!st) return;
    st.time += dt;
    const entryDuration = Math.max(0.001, Number(st.entryDuration) || CLIMB_ENTRY_MIN_DURATION);
    const pathDuration = Math.max(0.001, Number(st.pathDuration) || (st.length / CLIMB_VERTICAL_SPEED));
    const entryTarget = st.mode === 'up' ? st.bottom : st.top;
    const endTarget = st.mode === 'up' ? st.top : st.bottom;
    let x,y;
    if (st.time < entryDuration) {
      // Keep the short approach soft, but do not advance the climbing cycle yet.
      const t = smooth01(Rig.clamp(st.time / entryDuration, 0, 1));
      x = Rig.lerp(st.start.x, entryTarget.x, t);
      y = Rig.lerp(st.start.y, entryTarget.y, t);
    } else {
      // Once on the authored climb line, move at a genuinely constant world
      // speed. The planted-limb animation is distance-driven, so this also
      // removes the old slow-start / fast-middle change in animation cadence.
      const t = Rig.clamp((st.time - entryDuration) / pathDuration, 0, 1);
      x = Rig.lerp(entryTarget.x, endTarget.x, t);
      y = Rig.lerp(entryTarget.y, endTarget.y, t);
    }
    camera.x = x - character.screenOffsetX;
    character.x = x;
    character.y = y;
    jumpOffset = y - playSurfaceYAt(x);
    if (st.time >= entryDuration + pathDuration) finishClimb();
  }

  // Large-object interaction is deliberately separate from carrying. A pushable
  // remains a world collider; ACTION grips the nearest handle and locomotion
  // translates the player + object together. This is the reusable foundation
  // for the cart repair / broken-bridge sequence. pushingSide +1 means the
  // character is left of the object and pushes right; -1 is the opposite.

  const ACTION_RANGE = 0.72; // distance from the character capsule to the near edge of a carryable prop
  const PICKUP_DURATION = 0.48;
  const DROP_DURATION = 0.44;
  const CARRY_FORWARD = 0.48;
  // One predictable carry height for every stackable item. This clears one
  // standard stack layer while keeping the prop comfortably in the arms.
  const CARRY_BOTTOM = 0.64;
  const AUTO_DROP_SHUFFLE_SPEED = 0.72;
  const AUTO_DROP_SHUFFLE_MAX = 2.40; // safety cap; normal failure is collision/ledge blocking
  // Gameplay props live on z=0. Keep the character rig only a few centimetres
  // closer to the camera so she remains readable in front of puzzle art while
  // genuine foreground dressing can still occlude her normally.
  const CHARACTER_GAMEPLAY_Z_BIAS = 0.045;
  const CARRIED_COLLISION_SKIN = 0.025;

  let activePointer = null;
  let dragStartX = 0;
  let dragStartCameraX = 0;

  let editorPuzzlePackPinned = false;
  let selectedObject = null;
  let transformEditMode = false;
  let editorPointer = null;
  let editorDragKind = null;
  let editorDragOffset = { x: 0, z: 0 };
  let editorPanStart = 0;
  let editorPanCameraX = 0;
  let editorGesture = null;
  let puzzleBoundSide = null;
  let addAssetType = null;

  function placementModeActive() {
    return !!(editMode && !puzzleTestMode && addAssetType);
  }

  function updatePlacementModeUi() {
    const active = placementModeActive();
    document.body.classList.toggle('sidescroll-placement-mode', active);
    if (placementStrip) placementStrip.hidden = !active;
    if (placementModeLabelEl) {
      placementModeLabelEl.textContent = editorScope === 'puzzle'
        ? (puzzleEnvironmentPlacementMode ? 'PLACE DRESSING' : 'PLACE PIECE')
        : 'PLACE';
    }
    if (placementNameEl) {
      const info = addAssetType ? editorAssetInfo.get(addAssetType) : null;
      placementNameEl.textContent = info?.label || addAssetType || 'Asset';
    }
  }

  function exitPlacementMode() {
    addAssetType = null;
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
    updatePuzzlePanel();
    hintEl.textContent = editorScope === 'puzzle'
      ? (puzzleEnvironmentPlacementMode
          ? 'Dressing placement finished · Dressing edit mode remains active'
          : 'Puzzle-piece placement finished · Puzzle Pieces edit mode remains active')
      : 'Placement finished · drag to pan or tap an object to select it';
    hintEl.classList.remove('hidden');
  }

  let editorTapState = null;
  let selectionCycleInfo = null;
  let collisionEditMode = false;
  let collisionHandleIndex = -1;
  let selectedCollisionShape = 0;
  let groundLineEditMode = false;
  let socketPlacementPiece = null;
  let currentViewMatrix = mat4Identity();
  const editorAssetGroups = [
    { scope:'puzzle', title: 'PUZZLE PROPS · WOODLAND', items: [
      { name:'puzzle-log-a', label:'MOVEABLE LOG A', image:'puzzle-log-a.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.84, collision:{halfWidth:0.52,height:0.48,depth:0.56,platform:true} },
      { name:'puzzle-log-b', label:'MOVEABLE LOG B', image:'puzzle-log-b.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.72, collision:{halfWidth:0.38,height:0.42,depth:0.50,platform:true} },
      { name:'puzzle-log-c', label:'MOVEABLE LOG C', image:'puzzle-log-c.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.76, collision:{halfWidth:0.47,height:0.44,depth:0.54,platform:true} },
      { name:'puzzle-log-d', label:'MOVEABLE LOG D', image:'puzzle-log-d.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.82, collision:{halfWidth:0.43,height:0.46,depth:0.54,platform:true} },
      { name:'fallen-tree', label:'FALLEN TREE', image:'fallen-tree.png', category:'gameplay', gameplayType:'obstacle', thumb:'⌁', defaultHeight:2.55, collision:{halfWidth:2.35,height:1.72,depth:1.08,platform:true} },
      { name:'tree-stump', label:'TREE STUMP', image:'tree-stump.png', category:'gameplay', gameplayType:'prop', thumb:'◯', defaultHeight:1.18 },
      { name:'broken-branch', label:'BROKEN BRANCH', image:'broken-branch.png', category:'gameplay', gameplayType:'prop', thumb:'⟍', defaultHeight:0.78 }
    ]},
    { scope:'puzzle', title: 'PUZZLE PROPS · STONE WALL', items: [
      { name:'stone-wall', label:'STONE WALL', image:'stone-wall.png', category:'dressing', gameplayType:'prop', thumb:'▦', defaultHeight:3.75, gameplayLayerLocked:false },
      { name:'stone-piece-a', label:'TRIANGLE STONE', image:'stone-piece-a.png', category:'gameplay', gameplayType:'prop', thumb:'△', defaultHeight:1.00 },
      { name:'stone-piece-b', label:'ARCH STONE', image:'stone-piece-b.png', category:'gameplay', gameplayType:'prop', thumb:'◒', defaultHeight:1.04 },
      { name:'stone-piece-c', label:'HEXAGON STONE', image:'stone-piece-c.png', category:'gameplay', gameplayType:'prop', thumb:'⬡', defaultHeight:1.00 }
    ]},
    { scope:'puzzle', title: 'PUZZLE PROPS · BRIDGE', items: [
      { name:'bridge-left', label:'BROKEN BRIDGE · LEFT', image:'bridge-left.png', category:'dressing', gameplayType:'prop', defaultHeight:2.20, defaultGroundLine:1.62/2.20 },
      { name:'bridge-right', label:'BROKEN BRIDGE · RIGHT', image:'bridge-right.png', category:'dressing', gameplayType:'prop', defaultHeight:2.20, defaultGroundLine:1.62/2.20 },
      { name:'handcart-broken', label:'BROKEN HANDCART', image:'handcart-body.png', category:'gameplay', gameplayType:'prop', thumb:'▣', defaultHeight:1.75, defaultGroundLine:0.064, gameplayLayerLocked:false,
        collision:{halfWidth:1.72,height:1.26,depth:0.85,platform:true,points:[
          {x:-1.00,y:0.00},{x:-1.00,y:0.17},{x:-0.80,y:0.17},{x:-0.80,y:0.34},
          {x:-0.63,y:0.34},{x:-0.63,y:1.00},{x:0.63,y:1.00},{x:0.63,y:0.34},
          {x:0.80,y:0.34},{x:0.80,y:0.17},{x:1.00,y:0.17},{x:1.00,y:0.00}
        ]} },
      { name:'handcart', label:'WOODEN HANDCART · PUSHABLE', image:'handcart-body.png', category:'gameplay', gameplayType:'pushable', thumb:'▣', defaultHeight:1.75, defaultGroundLine:0.064,
        collision:{halfWidth:1.72,height:1.26,depth:0.85,platform:true,points:[
          {x:-1.00,y:0.00},{x:-1.00,y:0.17},{x:-0.80,y:0.17},{x:-0.80,y:0.34},
          {x:-0.63,y:0.34},{x:-0.63,y:1.00},{x:0.63,y:1.00},{x:0.63,y:0.34},
          {x:0.80,y:0.34},{x:0.80,y:0.17},{x:1.00,y:0.17},{x:1.00,y:0.00}
        ]} },
      { name:'cart-wheel-loose', label:'LOOSE CART WHEEL', image:'handcart-wheel.png', category:'gameplay', gameplayType:'prop', thumb:'◯', defaultHeight:1.06, gameplayLayerLocked:false,
        collision:{halfWidth:0.33,height:0.66,depth:0.32,platform:false,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]} },
      { name:'cart-wheel-ready', label:'CART WHEEL · READY', image:'handcart-wheel.png', category:'gameplay', gameplayType:'prop', thumb:'◉', defaultHeight:1.06, gameplayLayerLocked:false,
        collision:{halfWidth:0.33,height:0.66,depth:0.32,platform:false,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]} },
      { name:'axle-pin', label:'AXLE PIN', image:'axle-pin.png', category:'gameplay', gameplayType:'collectible', thumb:'✦', defaultHeight:0.72, gameplayLayerLocked:false }
    ]},
    { scope:'both', title: 'WORLD OBJECTS', selectionKey:'world-objects', selectionLabel:'World Objects', items: [
      { name:'thought-trigger', label:'THOUGHT NODE', category:'gameplay', gameplayType:'thought-trigger', thumb:'T', defaultHeight:0.52, gameplayLayerLocked:false, defaultThoughtText:'Enter thought text…', defaultThoughtRadius:1.4, defaultThoughtOnce:true, wrap:false },
      { name:'camera-trigger', label:'CAMERA NODE', category:'gameplay', gameplayType:'camera-trigger', thumb:'C', defaultHeight:0.52, gameplayLayerLocked:true, wrap:false, defaultCameraRadius:4.0, defaultCameraOffsetX:0, defaultCameraOffsetY:0, defaultCameraOffsetZ:0, defaultCameraCurveStart:0, defaultCameraCurveEnd:0 }
    ]},
    { scope:'environment', title: 'SETTLEMENT · BUILDINGS', selectionKey:'settlement-buildings', selectionLabel:'Settlement Buildings', items: [
      { name:'settlement-house-01', label:'HOUSE 01 · COTTAGE FRONT', image:'settlement-house-01.png', category:'dressing', defaultHeight:4.20, wrap:false },
      { name:'settlement-house-02', label:'HOUSE 02 · WIDE COTTAGE', image:'settlement-house-02.png', category:'dressing', defaultHeight:4.00, wrap:false },
      { name:'settlement-house-03', label:'HOUSE 03 · WIDE HALL', image:'settlement-house-03.png', category:'dressing', defaultHeight:3.60, wrap:false },
      { name:'settlement-house-04', label:'HOUSE 04 · TALL HOUSE', image:'settlement-house-04.png', category:'dressing', defaultHeight:5.00, wrap:false },
      { name:'settlement-house-05', label:'HOUSE 05 · RAMSHACKLE COTTAGE', image:'settlement-house-05.png', category:'dressing', defaultHeight:4.40, wrap:false },
      { name:'settlement-house-06', label:'HOUSE 06 · RAMSHACKLE HUT', image:'settlement-house-06.png', category:'dressing', defaultHeight:4.30, wrap:false },
    ]},
    { scope:'environment', title: 'SETTLEMENT · ROOFS', selectionKey:'settlement-roofs', selectionLabel:'Settlement Roofs', items: [
      { name:'settlement-roof-01', label:'ROOF 01 · TERRACOTTA GABLE', image:'settlement-roof-01.png', category:'dressing', defaultHeight:1.65, wrap:false },
      { name:'settlement-roof-02', label:'ROOF 02 · DOUBLE CHIMNEY', image:'settlement-roof-02.png', category:'dressing', defaultHeight:2.15, wrap:false },
      { name:'settlement-roof-03', label:'ROOF 03 · LOW CHIMNEY', image:'settlement-roof-03.png', category:'dressing', defaultHeight:1.70, wrap:false },
      { name:'settlement-roof-04', label:'ROOF 04 · RUSTIC SHINGLE', image:'settlement-roof-04.png', category:'dressing', defaultHeight:1.80, wrap:false },
    ]},
    { scope:'environment', title: 'SETTLEMENT · FENCES + WALLS', selectionKey:'settlement-structures', selectionLabel:'Settlement Fences + Walls', items: [
      { name:'settlement-fence-01', label:'FENCE 01 · STRAIGHT', image:'settlement-fence-01.png', category:'dressing', defaultHeight:1.35, wrap:false },
      { name:'settlement-fence-02', label:'FENCE 02 · BROKEN', image:'settlement-fence-02.png', category:'dressing', defaultHeight:1.25, wrap:false },
      { name:'settlement-fence-03', label:'FENCE 03 · GATE', image:'settlement-fence-03.png', category:'dressing', defaultHeight:1.55, wrap:false },
      { name:'settlement-wall-01', label:'WALL 01 · LOW STONE', image:'settlement-wall-01.png', category:'dressing', defaultHeight:1.35, wrap:false },
      { name:'settlement-wall-02', label:'WALL 02 · TIMBER + STONE', image:'settlement-wall-02.png', category:'dressing', defaultHeight:2.55, wrap:false },
      { name:'settlement-wall-03', label:'WALL 03 · STONE CORNER', image:'settlement-wall-03.png', category:'dressing', defaultHeight:2.45, wrap:false },
    ]},
    { scope:'environment', title: 'MOUNTAIN · CLIMB ROCKS', selectionKey:'climb-rocks', selectionLabel:'Climb Rocks', items: [
      { name:'mountain-climb-rock-01', label:'CLIMB ROCK · PROTOTYPE', image:'mountain-climb-rock-01.png', category:'gameplay', gameplayType:'climb-rock', thumb:'▰', defaultHeight:3.55, gameplayLayerLocked:true, wrap:false },
      { name:'mountain-cliff-01', label:'CLIFF 01 · STEPPED', image:'mountain-cliff-01.png', category:'gameplay', gameplayType:'climb-rock', thumb:'▰', defaultHeight:3.55, gameplayLayerLocked:true, wrap:false },
      { name:'mountain-cliff-02', label:'CLIFF 02 · SHEER', image:'mountain-cliff-02.png', category:'gameplay', gameplayType:'climb-rock', thumb:'▰', defaultHeight:3.50, gameplayLayerLocked:true, wrap:false },
      { name:'mountain-cliff-03', label:'CLIFF 03 · BROAD', image:'mountain-cliff-03.png', category:'gameplay', gameplayType:'climb-rock', thumb:'▰', defaultHeight:3.45, gameplayLayerLocked:true, wrap:false },
      { name:'mountain-cliff-04', label:'CLIFF 04 · TALL', image:'mountain-cliff-04.png', category:'gameplay', gameplayType:'climb-rock', thumb:'▰', defaultHeight:3.80, gameplayLayerLocked:true, wrap:false }
    ]},
    { scope:'environment', title: 'MOUNTAIN · ROCK DRESSING', selectionKey:'rock-dressing', selectionLabel:'Rock Dressing', items: [
      { name:'mountain-rock-01', label:'ROCK CLUSTER 01 · LOW', image:'mountain-rock-01.png', category:'dressing', defaultHeight:0.88 },
      { name:'mountain-rock-02', label:'ROCK CLUSTER 02', image:'mountain-rock-02.png', category:'dressing', defaultHeight:1.05 },
      { name:'mountain-rock-03', label:'ROCK CLUSTER 03 · TALL', image:'mountain-rock-03.png', category:'dressing', defaultHeight:1.38 },
      { name:'mountain-rock-04', label:'ROCK CLUSTER 04 · WIDE', image:'mountain-rock-04.png', category:'dressing', defaultHeight:1.08 }
    ]},
    { scope:'environment', title: 'MOUNTAIN · DRY GRASS', selectionKey:'grass', selectionLabel:'Grass', items: [
      { name:'mountain-grass-01', label:'DRY GRASS 01 · BROAD', image:'mountain-grass-01.png', category:'dressing', defaultHeight:0.92 },
      { name:'mountain-grass-02', label:'DRY GRASS 02 · TALL', image:'mountain-grass-02.png', category:'dressing', defaultHeight:1.34 },
      { name:'mountain-grass-03', label:'DRY GRASS 03 · NARROW', image:'mountain-grass-03.png', category:'dressing', defaultHeight:1.55 }
    ]},
    { scope:'environment', title: 'MOUNTAIN · SCRUB TREES', selectionKey:'trees', selectionLabel:'Trees', items: [
      { name:'mountain-tree-01', label:'SCRUB TREE 01', image:'mountain-tree-01.png', category:'dressing', defaultHeight:2.35 },
      { name:'mountain-tree-02', label:'SCRUB TREE 02', image:'mountain-tree-02.png', category:'dressing', defaultHeight:2.50 }
    ]},
    { scope:'environment', title: 'DRESSING · TREES', selectionKey:'trees', selectionLabel:'Trees', items: [
      'tree01','tree02','tree03','tree04','tree05','tree06','tree07','tree08'
    ].map(name => ({ name, label: `TREE ${Number(name.slice(-2))}`, category: 'dressing' }))},
    { scope:'environment', title: 'DRESSING · GROUND', selectionKey:'ground', selectionLabel:'Ground', items: [
      'ground01','ground02','ground03','ground04','ground05','ground06',
      'ground07','ground08','ground09','ground10','ground11','ground12'
    ].map(name => ({ name, label: `GROUND ${Number(name.slice(-2))}`, category: 'dressing' }))}
  ];
  const editorAssetInfo = new Map(editorAssetGroups.flatMap(group => group.items.map(item => [item.name, item])));
  const editorAssetScope = new Map(editorAssetGroups.flatMap(group => group.items.map(item => [item.name, group.scope])));
  const editorAssetSelectionMeta = new Map(editorAssetGroups.flatMap(group => group.items.map(item => [item.name, {
    key:group.selectionKey || (group.scope === 'both' ? 'world-objects' : 'other'),
    label:group.selectionLabel || group.title
  }])));
  const environmentSelectionCategories = (() => {
    const seen = new Set();
    const rows = [{ key:'all', label:'All' }];
    for (const group of editorAssetGroups) {
      if (group.scope !== 'environment' && group.scope !== 'both') continue;
      const key = group.selectionKey || (group.scope === 'both' ? 'world-objects' : 'other');
      const label = group.selectionLabel || group.title;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ key, label });
    }
    return rows;
  })();
  let assetSetupName = null;
  let collectibleSetupItemId = null;

  function behaviourBadgeText(assetName) {
    const b = assetBehaviours(assetName);
    const tags = [];
    if (b.carryable) tags.push('CARRY');
    if (b.supportSurface) tags.push('SUPPORT');
    if (b.stackable) tags.push('STACK');
    if (b.pushable) tags.push('PUSH');
    if (b.climbable) tags.push('CLIMB');
    if (b.socketHost) tags.push('SOCKET HOST');
    if (b.socketPiece) tags.push('SOCKET PIECE');
    if (!tags.length && b.solid) tags.push('SOLID');
    return tags.join(' · ') || 'NO BEHAVIOURS';
  }

  function renderAssetSetup() {
    if (!assetSetupEl || !assetSetupName) return;
    const info = editorAssetInfo.get(assetSetupName);
    const behaviour = assetBehaviours(assetSetupName);
    if (assetSetupNameEl) assetSetupNameEl.textContent = info?.label || assetSetupName;
    if (assetSetupNoteEl) {
      assetSetupNoteEl.textContent = behaviour.socketHost || behaviour.socketPiece
        ? (behaviour.socketPiece && pieceUsesAssetSocket(assetSetupName)
            ? 'This Socket Piece is linked at asset level. Open Asset Lab, select the Socket Host asset, choose this piece under Linked Piece, then place/move/delete the socket there.'
            : 'Socket behaviour is active. Asset-level socket links can be authored in Asset Lab; legacy per-instance sockets remain available for older puzzle pieces.')
        : `These are defaults for every copy of this asset. Collision: ${assetCollisionDefaults[assetSetupName] ? 'CUSTOM ASSET DEFAULT' : 'BUILT-IN DEFAULT'}. Fit a placed copy, then use SAVE TO ASSET.`;
    }
    if (!assetBehaviorListEl) return;
    assetBehaviorListEl.innerHTML = '';
    for (const def of ASSET_BEHAVIOUR_DEFS) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-behaviour-row';
      row.classList.toggle('active', !!behaviour[def.key]);
      row.setAttribute('aria-pressed', String(!!behaviour[def.key]));
      row.innerHTML = `<span><strong>${def.label}</strong><small>${def.description}</small></span><i>${behaviour[def.key] ? 'ON' : 'OFF'}</i>`;
      bindEditorPress(row, () => setAssetBehaviour(assetSetupName, def.key, !assetBehaviours(assetSetupName)[def.key]));
      assetBehaviorListEl.appendChild(row);
    }
  }

  function applyAssetBehaviourToObject(obj) {
    if (!obj || !hasAssetBehaviourProfile(obj.assetName)) return;
    const behaviour = assetBehaviours(obj.assetName,obj.assetState);
    if (!obj.collisionOverride) {
      const inherited = collisionFromAssetDefault(obj.assetName, obj.sx, obj.sy,obj.assetState);
      if (inherited) obj.collision = inherited;
      else if (behaviourNeedsCollision(behaviour)) obj.collision = behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, null,obj.assetState);
      else obj.collision = null;
    } else if (obj.collision) {
      obj.collision.platform = !!behaviour.supportSurface;
    }
  }

  function applyAssetCollisionEverywhere(assetName) {
    for (const obj of allSceneObjects()) {
      if (!obj || obj.assetName !== assetName || obj.collisionOverride) continue;
      applyAssetBehaviourToObject(obj);
      if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
      recordObjectEdit(obj);
    }
    settleGameplayCrates();
    sortSceneCollections();
  }

  function saveSelectedCollisionAsAssetDefault() {
    if (!selectedObject || selectedObject.deleted || !selectedObject.collision) return;
    const assetName = selectedObject.assetName;
    assetCollisionDefaults[assetName] = normalizeAssetCollision(selectedObject.collision, selectedObject.sx, selectedObject.sy, assetName);
    saveAssetCollisionDefaults();
    selectedObject.collisionOverride = false;
    applyAssetCollisionEverywhere(assetName);
    renderAssetSetup();
    updateEditorButtons();
    hintEl.textContent = `Asset collision saved · inherited by all ${editorAssetInfo.get(assetName)?.label || assetName} copies without an override`;
    hintEl.classList.remove('hidden');
  }

  function useAssetCollisionForSelected() {
    if (!selectedObject || selectedObject.deleted) return;
    selectedObject.collisionOverride = false;
    applyAssetBehaviourToObject(selectedObject);
    recordObjectEdit(selectedObject);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    updateEditorButtons();
    hintEl.textContent = assetCollisionDefaults[selectedObject.assetName] ? 'Using inherited asset collision' : 'Using built-in asset collision';
    hintEl.classList.remove('hidden');
  }

  function applyAssetBehaviourEverywhere(assetName) {
    for (const obj of allSceneObjects()) {
      if (obj?.assetName !== assetName) continue;
      applyAssetBehaviourToObject(obj);
      if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
      recordObjectEdit(obj);
    }
    settleGameplayCrates();
    sortSceneCollections();
  }

  function setAssetBehaviour(assetName, key, enabled) {
    if (!assetName || !ASSET_BEHAVIOUR_KEYS.includes(key)) return;
    const current = assetBehaviours(assetName);
    const next = { ...current, [key]: !!enabled };
    if (key === 'carryable' && enabled) next.placeable = true;
    if (key === 'supportSurface' && enabled) next.solid = true;
    if (key === 'stackable' && enabled) next.placeable = true;
    if (key === 'pushable' && enabled) next.solid = true;
    assetBehaviourOverrides[assetName] = Object.fromEntries(ASSET_BEHAVIOUR_KEYS.map(k => [k, !!next[k]]));
    if (key === 'climbable' && enabled && !assetClimbPaths(assetName).length) {
      assetClimbPathOverrides[assetName] = [genericAssetClimbPath()];
      saveAssetClimbPaths();
    }
    saveAssetBehaviourOverrides();
    applyAssetBehaviourEverywhere(assetName);
    renderAssetSetup();
    buildAssetPalette();
  }

  function resetAssetBehaviours(assetName) {
    if (!assetName) return;
    delete assetBehaviourOverrides[assetName];
    delete assetCollisionDefaults[assetName];
    delete assetClimbPathOverrides[assetName];
    saveAssetBehaviourOverrides();
    saveAssetCollisionDefaults();
    saveAssetClimbPaths();
    applyAssetBehaviourEverywhere(assetName);
    renderAssetSetup();
    buildAssetPalette();
  }

  function showAssetSetup(assetName) {
    if (!assetSetupEl || editorScope !== 'puzzle' || !editorAssetInfo.has(assetName)) return;
    assetSetupName = assetName;
    addAssetType = null;
    updatePlacementModeUi();
    if (editorAssetsEl) editorAssetsEl.hidden = true;
    assetSetupEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = 'Asset Setup';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = 'Reusable behaviour tags for this asset type';
    renderAssetSetup();
  }

  function renderCollectibleSetup() {
    if (!collectibleSetupEl || !collectibleSetupItemId) return;
    const itemDef = INVENTORY_ITEM_DEFS[collectibleSetupItemId];
    const cfg = collectibleConfig(collectibleSetupItemId);
    if (collectibleSetupNameEl) collectibleSetupNameEl.textContent = cfg.label || itemDef?.label || collectibleSetupItemId;
    if (collectibleNameInput) collectibleNameInput.value = cfg.label || itemDef?.label || collectibleSetupItemId;
    if (collectibleScaleInput) collectibleScaleInput.value = String(Math.max(0.5, Math.min(2, Number(cfg.scale) || 1)));
    if (collectibleScaleValueEl) collectibleScaleValueEl.textContent = `${(Number(cfg.scale) || 1).toFixed(2)}×`;
    if (collectibleSpinBtn) {
      collectibleSpinBtn.classList.toggle('active', !!cfg.spin);
      collectibleSpinBtn.setAttribute('aria-pressed', String(!!cfg.spin));
      const value = collectibleSpinBtn.querySelector('i');
      if (value) value.textContent = cfg.spin ? 'ON' : 'OFF';
    }
  }

  function updateCollectibleSetup(itemId, patch) {
    if (!itemId || !INVENTORY_ITEM_DEFS[itemId]) return;
    collectibleSetup[itemId] = { ...collectibleConfig(itemId), ...patch };
    saveCollectibleSetup();
    applyCollectibleConfigToLiveRewards(itemId);
    renderCollectibleSetup();
    buildAssetPalette();
  }

  function showCollectibleSetup(itemId) {
    if (!collectibleSetupEl || editorScope !== 'puzzle' || !INVENTORY_ITEM_DEFS[itemId]) return;
    collectibleSetupItemId = itemId;
    assetSetupName = null;
    addAssetType = null;
    updatePlacementModeUi();
    if (editorAssetsEl) editorAssetsEl.hidden = true;
    if (assetSetupEl) assetSetupEl.hidden = true;
    collectibleSetupEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = 'Collectable Setup';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = 'Reusable appearance and presentation settings';
    renderCollectibleSetup();
  }

  function showAssetBrowser() {
    assetSetupName = null;
    collectibleSetupItemId = null;
    if (assetSetupEl) assetSetupEl.hidden = true;
    if (collectibleSetupEl) collectibleSetupEl.hidden = true;
    if (editorAssetsEl) editorAssetsEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = editorScope === 'puzzle' ? 'Puzzle Assets' : 'Environment Assets';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = editorScope === 'puzzle'
      ? 'Tap an asset to place it · Setup edits reusable behaviours and collectables'
      : 'Choose dressing to place in the environment';
    buildAssetPalette();
    updateAssetPaletteState();
  }

  let lastTime = performance.now();
  let previousCameraX = camera.x;
  if (!PLAYER_MODE && Number.isFinite(WORLD_LAB_JUMP_X)) {
    character.x = WORLD_LAB_JUMP_X;
    character.y = playSurfaceYAt(character.x);
    camera.x = character.x - character.screenOffsetX;
    previousCameraX = camera.x;
    updatePuzzleStreaming(character.x);
  }
  let hintTimer = window.setTimeout(() => hintEl.classList.add('hidden'), 4200);

  function hideHint() {
    hintEl.classList.add('hidden');
    hintEl.classList.remove('puzzle-thought');
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
    if (typeof puzzleThoughtTimer !== 'undefined' && puzzleThoughtTimer) {
      clearTimeout(puzzleThoughtTimer);
      puzzleThoughtTimer = 0;
    }
  }

  // Movement used to call hideHint() every frame. That was fine for transient
  // control hints, but it meant a contextual thought could appear and then be
  // cancelled a frame later while the player was still walking toward the
  // object that caused it. Preserve an active thought until its own timer (or
  // a deliberate state/UI change) dismisses it.
  function hideTransientHint() {
    if (typeof puzzleThoughtTimer !== 'undefined' && puzzleThoughtTimer) return;
    hintEl.classList.add('hidden');
    hintEl.classList.remove('puzzle-thought');
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      resizeSceneTarget(w, h);
      projection = mat4Perspective((31 * Math.PI) / 180, w / h, 0.1, 180);
    }
    if (editorOverlay && editorOverlayCtx) {
      const ow = Math.max(1, Math.round(editorOverlay.clientWidth * dpr));
      const oh = Math.max(1, Math.round(editorOverlay.clientHeight * dpr));
      if (editorOverlay.width !== ow || editorOverlay.height !== oh) {
        editorOverlay.width = ow;
        editorOverlay.height = oh;
      }
      editorOverlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function mat4TransformPoint(m, x, y, z, w = 1) {
    return [
      m[0]*x + m[4]*y + m[8]*z + m[12]*w,
      m[1]*x + m[5]*y + m[9]*z + m[13]*w,
      m[2]*x + m[6]*y + m[10]*z + m[14]*w,
      m[3]*x + m[7]*y + m[11]*z + m[15]*w
    ];
  }

  function projectWorldPoint(x, y, z) {
    const v = mat4TransformPoint(currentViewMatrix, x, y, z, 1);
    const c = mat4TransformPoint(projection, v[0], v[1], v[2], v[3]);
    if (!c[3] || c[3] <= 0) return null;
    const nx = c[0] / c[3];
    const ny = c[1] / c[3];
    const rect = canvas.getBoundingClientRect();
    return {
      x: (nx * 0.5 + 0.5) * rect.width,
      y: (1 - (ny * 0.5 + 0.5)) * rect.height,
      ndcZ: c[2] / c[3]
    };
  }

  function cameraRayFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
    const eye = [camera.x, camera.y, camera.z];
    const forward = vec3Normalize([camera.x - eye[0], camera.targetY - eye[1], camera.targetZ - eye[2]]);
    const right = vec3Normalize(vec3Cross(forward, [0, 1, 0]));
    const up = vec3Normalize(vec3Cross(right, forward));
    const tan = Math.tan((31 * Math.PI / 180) * 0.5);
    const aspect = rect.width / Math.max(1, rect.height);
    const dir = vec3Normalize([
      forward[0] + right[0] * nx * tan * aspect + up[0] * ny * tan,
      forward[1] + right[1] * nx * tan * aspect + up[1] * ny * tan,
      forward[2] + right[2] * nx * tan * aspect + up[2] * ny * tan
    ]);
    return { eye, dir };
  }

  function groundPointFromClient(clientX, clientY) {
    const ray = cameraRayFromClient(clientX, clientY);
    if (Math.abs(ray.dir[1]) < 0.0001) return null;
    let targetY = groundY + PATH_TOP_RISE;
    let t = (targetY - ray.eye[1]) / ray.dir[1];
    if (t <= 0) return null;
    let x = ray.eye[0] + ray.dir[0] * t;
    let z = ray.eye[2] + ray.dir[2] * t;
    targetY = terrainGroundYAt(x, z);
    t = (targetY - ray.eye[1]) / ray.dir[1];
    if (t <= 0) return null;
    x = ray.eye[0] + ray.dir[0] * t;
    z = ray.eye[2] + ray.dir[2] * t;
    return { x, z, y: terrainGroundYAt(x, z) };
  }


  // Editor movement should follow the finger in SCREEN space rather than use a
  // ray/ground intersection. The latter becomes extremely sensitive near the
  // horizon. We solve X from horizontal pixels and Z from vertical pixels,
  // alternating a few small Newton steps so the projected anchor follows the
  // finger closely even as perspective/terrain height changes.
  function solveEditorScreenDragXZ({
    startX,startZ,startScreenX,startScreenY,targetScreenX,targetScreenY,
    yAt,lockZ=false,minZ=WORLD.farZ+0.8,maxZ=WORLD.nearZ-0.6
  }){
    let x=Number(startX)||0;
    let z=Rig.clamp(Number(startZ)||pathZ,minZ,maxZ);
    const yFor=(px,pz)=>Number(yAt?.(px,pz))||0;
    const epsX=.06,epsZ=.08;

    for(let iteration=0;iteration<6;iteration+=1){
      // Vertical finger travel controls scene depth. Locked gameplay-layer
      // objects deliberately skip this axis.
      if(!lockZ){
        const p=projectWorldPoint(x,yFor(x,z),z);
        const z2=Rig.clamp(z+epsZ,minZ,maxZ);
        const pz=projectWorldPoint(x,yFor(x,z2),z2);
        if(p&&pz){
          const deriv=(pz.y-p.y)/(z2-z || epsZ);
          if(Math.abs(deriv)>.001){
            const step=Rig.clamp((targetScreenY-p.y)/deriv,-2.0,2.0);
            z=Rig.clamp(z+step,minZ,maxZ);
          }
        }
      }

      // Horizontal finger travel controls world X. Solve after Z so perspective
      // depth changes do not make the object race ahead of the finger.
      const p=projectWorldPoint(x,yFor(x,z),z);
      const px=projectWorldPoint(x+epsX,yFor(x+epsX,z),z);
      if(p&&px){
        const deriv=(px.x-p.x)/epsX;
        if(Math.abs(deriv)>.001){
          const step=Rig.clamp((targetScreenX-p.x)/deriv,-2.0,2.0);
          x+=step;
        }
      }
    }
    return{x,z:lockZ?Number(startZ)||pathZ:Rig.clamp(z,minZ,maxZ)};
  }

  // Placement needs to respect the layer the chosen asset will actually live
  // on. Gameplay-layer props (including the large mountain cliffs) are snapped
  // to pathZ after creation, so deriving X from an arbitrary terrain-depth hit
  // can move them many metres sideways when the camera ray is shallow. Resolve
  // those taps directly on the gameplay plane instead. Free-depth dressing
  // keeps terrain picking, but rejects pathological near-horizon intersections
  // and falls back to a safe path-plane position rather than spawning offscreen.
  function placementPointFromClient(assetName, clientX, clientY) {
    const info = editorAssetInfo?.get(assetName) || null;
    const category = info?.category || 'dressing';
    const gameLayerLocked = category === 'gameplay'
      && (typeof info?.gameplayLayerLocked === 'boolean' ? info.gameplayLayerLocked : true);

    if (gameLayerLocked) {
      const plane = pathPlanePointFromClient(clientX, clientY, pathZ);
      if (!plane || !Number.isFinite(plane.x)) return null;
      return { x:plane.x, z:pathZ, y:playSurfaceYAt(plane.x) };
    }

    const ground = groundPointFromClient(clientX, clientY);
    const minZ = WORLD.farZ + 0.8;
    const maxZ = WORLD.nearZ - 0.6;
    const maxVisibleXDelta = 18.0;
    if (ground
        && Number.isFinite(ground.x)
        && Number.isFinite(ground.z)
        && ground.z >= minZ && ground.z <= maxZ
        && Math.abs(ground.x - camera.x) <= maxVisibleXDelta) {
      return ground;
    }

    // The camera deliberately looks slightly upward. A tap close to the visual
    // horizon can therefore make a horizontal-ground intersection enormous or
    // impossible. Falling back to the gameplay-depth plane preserves the tap's
    // horizontal screen position and, most importantly, keeps the new asset in
    // the current working area where it can immediately be selected/moved.
    const fallback = pathPlanePointFromClient(clientX, clientY, pathZ);
    if (!fallback || !Number.isFinite(fallback.x)) return null;
    return { x:fallback.x, z:pathZ, y:playSurfaceYAt(fallback.x) };
  }

  function objectScreenBounds(obj) {
    if (!obj || obj.deleted || obj.carried) return null;
    const x = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    if (!proceduralBiomeVisibleAt(obj, x)) return null;
    const y = objectYAtDrawX(obj, x);
    const points = [
      projectWorldPoint(x - obj.sx * 0.5, y, obj.z),
      projectWorldPoint(x + obj.sx * 0.5, y, obj.z),
      projectWorldPoint(x - obj.sx * 0.5, y + obj.sy, obj.z),
      projectWorldPoint(x + obj.sx * 0.5, y + obj.sy, obj.z)
    ].filter(Boolean);
    if (points.length < 2) return null;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    return { left, right, top, bottom, width: right-left, height: bottom-top, cx:(left+right)*0.5, cy:(top+bottom)*0.5 };
  }

  function selectionCategoryForObject(obj) {
    return editorAssetSelectionMeta.get(obj?.assetName)?.key || 'other';
  }

  function environmentObjectPassesSelectionFilter(obj) {
    if (environmentSelectionFilter === 'all') return true;
    return selectionCategoryForObject(obj) === environmentSelectionFilter;
  }

  function objectPickBounds(obj) {
    const bounds = objectScreenBounds(obj);
    if (!bounds) return null;
    if (selectionCategoryForObject(obj) !== 'world-objects') return bounds;
    // World Objects are invisible during play and are represented by editor
    // guides rather than artwork. Give their centre marker a generous fixed
    // screen-space hit target so dense foliage cannot make them impossible to
    // pick. The selection filter can then isolate them completely.
    const floor = objectFloorWorldY(obj);
    const centre = projectWorldPoint(objectXNear(obj,camera.x), floor + 0.10, obj.z);
    if (!centre) return bounds;
    const r = 22;
    return { left:centre.x-r, right:centre.x+r, top:centre.y-r, bottom:centre.y+r, width:r*2, height:r*2, cx:centre.x, cy:centre.y };
  }

  function pickSceneObjects(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const candidates = [];
    for (const obj of allSceneObjects()) {
      if (obj.deleted || obj.carried) continue;
      if (editMode && !editorObjectIsEditable(obj)) continue;
      if (editMode && editorScope === 'environment' && !environmentObjectPassesSelectionFilter(obj)) continue;
      const b = objectPickBounds(obj);
      if (!b || b.right < -20 || b.left > rect.width + 20 || b.bottom < -20 || b.top > rect.height + 20) continue;
      const pad = selectionCategoryForObject(obj) === 'world-objects' ? 4 : 7;
      if (px < b.left-pad || px > b.right+pad || py < b.top-pad || py > b.bottom+pad) continue;
      const centreDist = Math.hypot(px-b.cx, py-b.cy);
      candidates.push({ obj, centreDist });
    }
    // Camera is on +Z, so larger Z is visually nearer. The tap-cycle state
    // below walks this entire sorted stack, rather than repeatedly snapping
    // back to the foremost object after the second tap.
    candidates.sort((a,b) => (b.obj.z - a.obj.z) || (a.centreDist - b.centreDist));
    return candidates.map(item => item.obj);
  }

  function cycleInfoFor(obj, candidates) {
    if (!obj || !candidates?.length) return null;
    const index = candidates.indexOf(obj);
    return index >= 0 ? { objects: candidates.slice(), index } : null;
  }

  function nextTapCycleObject(candidates, clientX, clientY) {
    if (!candidates?.length) { selectionTapCycle = null; return null; }
    const ids = candidates.map(obj => obj.id || obj.assetName);
    const samePoint = selectionTapCycle && Math.hypot(clientX-selectionTapCycle.x, clientY-selectionTapCycle.y) <= 14;
    const sameStack = samePoint
      && selectionTapCycle.ids.length === ids.length
      && ids.every((id,index) => id === selectionTapCycle.ids[index]);
    const index = sameStack ? (selectionTapCycle.index + 1) % candidates.length : 0;
    selectionTapCycle = { x:clientX, y:clientY, ids, index };
    return candidates[index];
  }

  function worldGroups() {
    sceneData.worldGroups ||= [];
    return sceneData.worldGroups;
  }

  function worldGroupById(id) {
    return id ? worldGroups().find(group => group?.id === id) || null : null;
  }

  function worldGroupMembers(id, { includeDeleted=false } = {}) {
    if (!id) return [];
    return allSceneObjects().filter(obj => obj && !obj.puzzleInstanceId && obj.userAdded && obj.worldGroupId === id && (includeDeleted || !obj.deleted));
  }

  function nextWorldGroupLabel() {
    let index=1;
    const used=new Set(worldGroups().map(group=>String(group?.label||'').trim().toLowerCase()));
    while(used.has(`world group ${index}`)) index+=1;
    return `World Group ${index}`;
  }

  function createWorldGroup() {
    const id=`world-group-${Date.now().toString(36)}-${++userSceneCounter}`;
    const x=Number(character?.x ?? (camera.x+character.screenOffsetX))||0;
    const group={id,label:nextWorldGroupLabel(),x,z:pathZ,createdAt:Date.now()};
    worldGroups().push(group);
    selectedWorldGroupId=id; worldGroupEditMode=true; worldGroupMoveMode=false; worldGroupExclusionEditMode=false;
    saveSceneData(); worldGroupListSignature=''; sceneEnvironmentListSignature='';
    renderWorldGroupTools({force:true}); renderEnvironmentSelectionTools({force:true});
    hintEl.textContent=`${group.label} created · new environment assets will join this group`;hintEl.classList.remove('hidden');
    return group;
  }

  function worldGroupBounds(group) {
    if(!group)return null;
    const members=worldGroupMembers(group.id);
    if(!members.length){const x=Number(group.x)||0,z=Number(group.z)||pathZ;return{minX:x-.6,maxX:x+.6,minZ:z-.5,maxZ:z+.5,empty:true};}
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(const obj of members){
      const halfX=Math.max(.12,Number(obj.sx)||.25)*.5;
      const halfZ=Math.max(.18,Number(obj.collision?.depth)||.45)*.5;
      minX=Math.min(minX,Number(obj.x)-halfX);maxX=Math.max(maxX,Number(obj.x)+halfX);
      minZ=Math.min(minZ,Number(obj.z)-halfZ);maxZ=Math.max(maxZ,Number(obj.z)+halfZ);
    }
    return{minX,maxX,minZ,maxZ,empty:false};
  }

  function worldGroupScreenPolygon(group){
    const b=worldGroupBounds(group);if(!b)return null;
    const corners=[[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]].map(([x,z])=>
      projectWorldPoint(x,terrainGroundYAt(x,z)+.06,z)
    );
    return corners.some(p=>!p)?null:corners;
  }

  function pointInScreenPolygon(x,y,points){
    if(!points||points.length<3)return false;
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const xi=points[i].x,yi=points[i].y,xj=points[j].x,yj=points[j].y;
      const cross=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/Math.max(1e-6,yj-yi)+xi);
      if(cross)inside=!inside;
    }
    return inside;
  }

  function screenPointSegmentDistance(px,py,a,b){
    const vx=b.x-a.x,vy=b.y-a.y,wx=px-a.x,wy=py-a.y;
    const vv=vx*vx+vy*vy;
    const t=vv>1e-6?Rig.clamp((wx*vx+wy*vy)/vv,0,1):0;
    return Math.hypot(px-(a.x+vx*t),py-(a.y+vy*t));
  }

  function worldGroupOriginScreenPoint(group){
    if(!group)return null;
    const x=Number(group.x)||0,z=Number(group.z)||pathZ;
    return projectWorldPoint(x,terrainGroundYAt(x,z)+.12,z);
  }

  function worldGroupOriginHandleHitAt(group,clientX,clientY){
    const origin=worldGroupOriginScreenPoint(group);if(!origin)return false;
    const rect=canvas.getBoundingClientRect(),px=clientX-rect.left,py=clientY-rect.top;
    return Math.hypot(px-origin.x,py-origin.y)<=24;
  }

  function worldGroupGuideHitAt(group,clientX,clientY,{allowInterior=false}={}){
    if(!group)return false;
    const rect=canvas.getBoundingClientRect(),px=clientX-rect.left,py=clientY-rect.top;
    if(worldGroupOriginHandleHitAt(group,clientX,clientY))return true;
    const poly=worldGroupScreenPolygon(group);
    if(!poly)return false;
    if(allowInterior&&pointInScreenPolygon(px,py,poly))return true;
    for(let i=0;i<poly.length;i++){
      if(screenPointSegmentDistance(px,py,poly[i],poly[(i+1)%poly.length])<=14)return true;
    }
    return false;
  }

  function worldGroupMemberHitAt(group,clientX,clientY){
    if(!group)return null;
    const rect=canvas.getBoundingClientRect(),px=clientX-rect.left,py=clientY-rect.top;
    const hits=[];
    for(const obj of worldGroupMembers(group.id)){
      const b=objectPickBounds(obj);if(!b)continue;
      const pad=selectionCategoryForObject(obj)==='world-objects'?5:8;
      if(px<b.left-pad||px>b.right+pad||py<b.top-pad||py>b.bottom+pad)continue;
      hits.push({obj,dist:Math.hypot(px-b.cx,py-b.cy)});
    }
    hits.sort((a,b)=>(b.obj.z-a.obj.z)||(a.dist-b.dist));
    return hits[0]?.obj||null;
  }

  function worldGroupAtEditorPoint(clientX,clientY){
    if(!editMode||editorScope!=='environment')return null;
    const selected=worldGroupById(selectedWorldGroupId);
    // This function is for GROUP SELECTION only. Movement is intentionally
    // restricted to the selected group's yellow origin dot.
    if(selected&&!worldGroupEditMode&&worldGroupGuideHitAt(selected,clientX,clientY,{allowInterior:true}))return selected;
    const memberHits=[];
    for(const group of worldGroups()){
      const obj=worldGroupMemberHitAt(group,clientX,clientY);
      if(obj)memberHits.push({group,obj});
    }
    memberHits.sort((a,b)=>b.obj.z-a.obj.z);
    if(memberHits.length)return memberHits[0].group;
    for(const group of worldGroups()){
      if(worldGroupGuideHitAt(group,clientX,clientY))return group;
    }
    return null;
  }

  function persistWorldGroupMove(group){
    if(!group)return;
    for(const obj of worldGroupMembers(group.id))recordObjectEdit(obj);
    saveSceneData();
    worldGroupListSignature='';
    sceneEnvironmentListSignature='';
    renderWorldGroupTools({force:true});
    renderEnvironmentSelectionTools({force:true});
  }

  function defaultWorldGroupExclusion(group){
    const b=worldGroupBounds(group);
    const gx=Number(group?.x)||0,gz=Number(group?.z)||pathZ;
    const minX=b?.minX ?? gx-.6,maxX=b?.maxX ?? gx+.6,minZ=b?.minZ ?? gz-.5,maxZ=b?.maxZ ?? gz+.5;
    const pad=.65;
    return{
      enabled:false,
      centerX:(minX+maxX)*.5-gx,
      centerZ:(minZ+maxZ)*.5-gz,
      width:Math.max(2.2,maxX-minX+pad*2),
      depth:Math.max(2.2,maxZ-minZ+pad*2)
    };
  }

  function cleanWorldGroupExclusion(group,raw=group?.exclusion){
    const fallback=defaultWorldGroupExclusion(group);
    if(!raw||typeof raw!=='object')return{...fallback};
    return{
      enabled:raw.enabled!==false,
      centerX:Number.isFinite(Number(raw.centerX))?Number(raw.centerX):fallback.centerX,
      centerZ:Number.isFinite(Number(raw.centerZ))?Number(raw.centerZ):fallback.centerZ,
      width:Math.max(1,Number.isFinite(Number(raw.width))?Number(raw.width):fallback.width),
      depth:Math.max(1,Number.isFinite(Number(raw.depth))?Number(raw.depth):fallback.depth)
    };
  }

  function currentWorldGroupExclusion(group){return cleanWorldGroupExclusion(group,group?.exclusion);}

  function ensureWorldGroupExclusion(group){
    if(!group)return null;
    group.exclusion=cleanWorldGroupExclusion(group,group.exclusion);
    return group.exclusion;
  }

  function worldGroupExclusionWorldBounds(group){
    if(!group)return null;
    const ex=currentWorldGroupExclusion(group),gx=Number(group.x)||0,gz=Number(group.z)||pathZ;
    const centerX=gx+ex.centerX,centerZ=gz+ex.centerZ;
    return{enabled:ex.enabled,centerX,centerZ,width:ex.width,depth:ex.depth,minX:centerX-ex.width*.5,maxX:centerX+ex.width*.5,minZ:centerZ-ex.depth*.5,maxZ:centerZ+ex.depth*.5};
  }

  function fitWorldGroupExclusion(group,{enable=true}={}){
    if(!group)return false;
    const b=worldGroupBounds(group),gx=Number(group.x)||0,gz=Number(group.z)||pathZ,pad=.65;
    const minX=b?.minX ?? gx-.6,maxX=b?.maxX ?? gx+.6,minZ=b?.minZ ?? gz-.5,maxZ=b?.maxZ ?? gz+.5;
    group.exclusion={
      enabled:enable ? true : currentWorldGroupExclusion(group).enabled,
      centerX:(minX+maxX)*.5-gx,
      centerZ:(minZ+maxZ)*.5-gz,
      width:Math.max(2.2,maxX-minX+pad*2),
      depth:Math.max(2.2,maxZ-minZ+pad*2)
    };
    saveSceneData();worldGroupListSignature='';renderWorldGroupTools({force:true});return true;
  }

  function setWorldGroupExclusionEditMode(on){
    const group=worldGroupById(selectedWorldGroupId);
    worldGroupExclusionEditMode=!!(on&&group);
    worldGroupExclusionHandle=null;
    if(worldGroupExclusionEditMode){
      if(addAssetType)exitPlacementMode();
      worldGroupMoveMode=false;worldGroupEditMode=false;worldGroupTemplatePlaceMode=false;
      ensureWorldGroupExclusion(group);
    }
    worldGroupListSignature='';renderWorldGroupTools({force:true});
    if(group){hintEl.textContent=worldGroupExclusionEditMode?`Editing ${group.label} exclusion · drag centre or edge handles`:`${group.label} exclusion edit finished`;hintEl.classList.remove('hidden');}
  }

  function selectWorldGroup(id,{edit=null,focus=false}={}){
    const group=worldGroupById(id);
    const changed=(group?.id||null)!==selectedWorldGroupId;
    selectedWorldGroupId=group?.id||null;
    worldGroupMoveMode=false;worldGroupExclusionEditMode=false;
    if(edit!==null)worldGroupEditMode=!!(group&&edit);
    else if(changed||!group)worldGroupEditMode=false;
    if(!worldGroupEditMode&&selectedObject?.worldGroupId)selectObject(null);
    if(focus&&group){const b=worldGroupBounds(group);const x=b?(b.minX+b.maxX)*.5:Number(group.x)||0;camera.x=x-character.screenOffsetX;previousCameraX=camera.x;}
    if(changed)transformEditMode=false;
    worldGroupListSignature='';sceneEnvironmentListSignature='';
    renderWorldGroupTools({force:true});renderEnvironmentSelectionTools({force:true});
    updateEditorButtons();
  }

  function setWorldGroupEditMode(on){
    const group=worldGroupById(selectedWorldGroupId);
    worldGroupEditMode=!!(on&&group);
    if(worldGroupEditMode){
      worldGroupExclusionEditMode=false;
      worldGroupMoveMode=false;
    }else{
      worldGroupMoveMode=false;
      if(selectedObject?.worldGroupId===group?.id)selectObject(null);
    }
    renderWorldGroupTools({force:true});
    if(group){
      hintEl.textContent=worldGroupEditMode
        ? `Editing ${group.label} · members unlocked · new placements automatically join`
        : `${group.label} locked · drag ONLY the yellow dot to move it · Edit Group unlocks members`;
      hintEl.classList.remove('hidden');
    }
  }

  function setObjectWorldGroup(obj,groupId){
    if(!obj||obj.deleted||obj.puzzleInstanceId||!obj.userAdded)return false;
    const group=groupId?worldGroupById(groupId):null;const nextId=group?.id||null;if((obj.worldGroupId||null)===nextId)return false;
    if(group&&worldGroupMembers(group.id).length===0){group.x=Number(obj.x)||0;group.z=Number(obj.z)||pathZ;}
    obj.worldGroupId=nextId;recordObjectEdit(obj);saveSceneData();worldGroupListSignature='';sceneEnvironmentListSignature='';renderWorldGroupTools({force:true});renderEnvironmentSelectionTools({force:true});return true;
  }

  function deleteSelectedWorldGroup(){
    const group=worldGroupById(selectedWorldGroupId);if(!group)return false;
    const members=worldGroupMembers(group.id,{includeDeleted:true});
    const liveCount=members.filter(obj=>!obj.deleted).length;
    if(!window.confirm(`Delete ${group.label} and ${liveCount} ${liveCount===1?'asset':'assets'}? This removes the complete placed group from the scene.`))return false;

    for(const obj of members){
      if(!obj)continue;
      obj.deleted=true;
      obj.worldGroupId=null;
      recordObjectEdit(obj);
    }
    sceneData.worldGroups=worldGroups().filter(item=>item.id!==group.id);

    // Clear any queued World Lab move for a group that no longer exists.
    try{
      const pending=JSON.parse(localStorage.getItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY)||'null');
      if(pending&&typeof pending==='object'&&group.id in pending){
        delete pending[group.id];
        if(Object.keys(pending).length)localStorage.setItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY,JSON.stringify(pending));
        else localStorage.removeItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY);
      }
    }catch(_){}

    selectedWorldGroupId=null;
    worldGroupEditMode=false;worldGroupMoveMode=false;worldGroupExclusionEditMode=false;
    transformEditMode=false;selectedObject=null;
    saveSceneData();
    sortSceneCollections();
    worldGroupListSignature='';sceneEnvironmentListSignature='';
    renderWorldGroupTools({force:true});
    renderEnvironmentSelectionTools({force:true});
    updateEditorButtons();
    syncTransformEditor();
    hintEl.textContent='World Group deleted with its placed assets';
    hintEl.classList.remove('hidden');
    return true;
  }

  function dissolveSelectedWorldGroup(){
    const group=worldGroupById(selectedWorldGroupId);if(!group)return;
    if(!window.confirm(`Dissolve ${group.label}? Its assets will stay in the world as standalone objects.`))return;
    for(const obj of worldGroupMembers(group.id)){obj.worldGroupId=null;recordObjectEdit(obj);}
    sceneData.worldGroups=worldGroups().filter(item=>item.id!==group.id);selectedWorldGroupId=null;worldGroupEditMode=false;worldGroupMoveMode=false;worldGroupExclusionEditMode=false;
    saveSceneData();worldGroupListSignature='';sceneEnvironmentListSignature='';renderWorldGroupTools({force:true});renderEnvironmentSelectionTools({force:true});hintEl.textContent='World group dissolved · assets kept as standalone world objects';hintEl.classList.remove('hidden');
  }

  function renameSelectedWorldGroup(){
    const group=worldGroupById(selectedWorldGroupId);if(!group)return;const next=window.prompt('World group name',group.label||'World Group');if(next==null)return;const label=String(next).trim();if(!label)return;group.label=label.slice(0,60);saveSceneData();worldGroupListSignature='';renderWorldGroupTools({force:true});
  }

  function worldGroupAnchorGroundY(x,z){
    return terrainGroundYAt(Number(x)||0,Number(z)||pathZ);
  }

  // A World Group owns X/Z composition, but each child keeps its own placement
  // rule. Ground-bound members re-sample terrain at their new location while
  // preserving their authored floor offset; Follow Surface Normal remains an
  // asset behaviour and therefore rotates only assets that opt in. Free members
  // keep their vertical offset relative to the group's local ground height.
  function captureWorldGroupMoveState(group){
    if(!group)return null;
    const groupX=Number(group.x)||0,groupZ=Number(group.z)||pathZ;
    const groupGround=worldGroupAnchorGroundY(groupX,groupZ);
    return{
      group,groupX,groupZ,
      members:worldGroupMembers(group.id).map(obj=>({
        obj,
        localX:(Number(obj.x)||0)-groupX,
        localZ:(Number(obj.z)||0)-groupZ,
        free:objectUsesFreePlacement(obj),
        floorOffset:objectFloorOffsetFromTerrain(obj),
        freeGroupOffset:objectFloorWorldY(obj)-groupGround
      }))
    };
  }

  function applyWorldGroupMoveState(state,nextX,nextZ,{silent=false,persist=true}={}){
    if(!state?.group)return false;
    const group=state.group;
    nextX=Number(nextX);
    nextZ=Rig.clamp(Number(nextZ),WORLD.farZ+.8,WORLD.nearZ-.6);
    if(!Number.isFinite(nextX)||!Number.isFinite(nextZ))return false;
    const newGroupGround=worldGroupAnchorGroundY(nextX,nextZ);

    for(const member of state.members){
      const obj=member.obj;
      if(!obj||obj.deleted)continue;
      obj.x=nextX+member.localX;
      obj.z=obj.category==='gameplay'&&obj.gameplayLayerLocked
        ? pathZ
        : Rig.clamp(nextZ+member.localZ,WORLD.farZ+.8,WORLD.nearZ-.6);
      if(member.free)setObjectFloorWorldY(obj,newGroupGround+member.freeGroupOffset);
      else setObjectFloorOffset(obj,member.floorOffset);
      moveObjectToCorrectCollection(obj);
      if(persist)recordObjectEdit(obj);
    }

    group.x=nextX;group.z=nextZ;
    sortSceneCollections();
    if(persist)saveSceneData();
    worldGroupListSignature='';sceneEnvironmentListSignature='';
    if(!silent){
      renderWorldGroupTools({force:true});
      renderEnvironmentSelectionTools({force:true});
    }
    return true;
  }

  function moveWorldGroupTo(group,point,{silent=false,persist=true}={}){
    if(!group||!point)return false;
    const nextX=Number(point.x),nextZ=Rig.clamp(Number(point.z),WORLD.farZ+.8,WORLD.nearZ-.6);
    if(!Number.isFinite(nextX)||!Number.isFinite(nextZ))return false;
    const oldX=Number(group.x)||0,oldZ=Number(group.z)||pathZ;
    if(Math.abs(nextX-oldX)<1e-6&&Math.abs(nextZ-oldZ)<1e-6)return false;
    const state=captureWorldGroupMoveState(group);
    return applyWorldGroupMoveState(state,nextX,nextZ,{silent,persist});
  }


  function applyWorldLabPendingWorldGroupMoves(){
    if(PUZZLE_LAB_MODE)return 0;
    let pending=null;try{pending=JSON.parse(localStorage.getItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY)||'null');}catch(_){}
    if(!pending||typeof pending!=='object')return 0;
    let applied=0;const unresolved={};
    for(const [groupId,request] of Object.entries(pending)){
      const group=worldGroupById(groupId),targetX=Number(request?.x);
      if(!group||!Number.isFinite(targetX)){if(request&&Number.isFinite(targetX))unresolved[groupId]=request;continue;}
      if(moveWorldGroupTo(group,{x:targetX,z:Number(group.z)||pathZ},{silent:true}))applied++;
    }
    try{if(Object.keys(unresolved).length)localStorage.setItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY,JSON.stringify(unresolved));else localStorage.removeItem(WORLD_LAB_PENDING_GROUP_MOVES_STORAGE_KEY);}catch(_){}
    return applied;
  }
  applyWorldLabPendingWorldGroupMoves();

  function worldGroupTemplates(){
    sceneData.worldGroupTemplates ||= [];
    return sceneData.worldGroupTemplates;
  }

  function worldGroupTemplateById(id){
    return id ? worldGroupTemplates().find(template=>template?.id===id) || null : null;
  }

  function uniqueWorldGroupLabel(base='World Group'){
    const clean=String(base||'World Group').trim() || 'World Group';
    const used=new Set(worldGroups().map(group=>String(group?.label||'').trim().toLowerCase()));
    if(!used.has(clean.toLowerCase()))return clean;
    let index=2;
    while(used.has(`${clean} ${index}`.toLowerCase()))index+=1;
    return `${clean} ${index}`;
  }

  function uniqueWorldTemplateLabel(base='Group Template'){
    const clean=String(base||'Group Template').trim() || 'Group Template';
    const used=new Set(worldGroupTemplates().map(template=>String(template?.label||'').trim().toLowerCase()));
    if(!used.has(clean.toLowerCase()))return clean;
    let index=2;
    while(used.has(`${clean} ${index}`.toLowerCase()))index+=1;
    return `${clean} ${index}`;
  }

  function worldGroupTemplateMember(obj,group){
    const free=objectUsesFreePlacement(obj);
    const groupGround=worldGroupAnchorGroundY(group.x,group.z);
    return{
      assetName:obj.assetName,
      assetState:obj.assetState || inferredAssetState(obj.assetName),
      dx:(Number(obj.x)||0)-(Number(group.x)||0),
      dz:(Number(obj.z)||0)-(Number(group.z)||pathZ),
      sx:Number(obj.sx)||1,sy:Number(obj.sy)||1,
      flip:!!obj.flip,groundLine:objectGroundLine(obj),
      category:obj.category||'dressing',gameplayType:obj.gameplayType||null,
      gameplayLayerLocked:!!obj.gameplayLayerLocked,
      freePlacement:free,
      floorOffset:free?null:objectFloorOffsetFromTerrain(obj),
      freeGroupFloorOffset:free?(objectFloorWorldY(obj)-groupGround):null,
      collision:obj.collision?cloneCollision(obj.collision):null,
      collisionOverride:!!obj.collisionOverride,
      wrap:false,
      thoughtText:typeof obj.thoughtText==='string'?obj.thoughtText:'',
      thoughtRadius:Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8),
      thoughtOnce:obj.thoughtOnce!==false,
      cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20),
      cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0,
      cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0,
      cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
      cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart),
      cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
    };
  }

  function saveSelectedWorldGroupAsTemplate(){
    const group=worldGroupById(selectedWorldGroupId);
    if(!group)return;
    const members=worldGroupMembers(group.id);
    if(!members.length){
      hintEl.textContent='Add at least one asset before saving a group template';
      hintEl.classList.remove('hidden');
      return;
    }
    const proposed=uniqueWorldTemplateLabel(group.label||'Group Template');
    const entered=window.prompt('Group template name',proposed);
    if(entered==null)return;
    const label=uniqueWorldTemplateLabel(String(entered).trim()||proposed);
    const template={
      id:`world-template-${Date.now().toString(36)}-${++userSceneCounter}`,
      label,
      createdAt:Date.now(),
      exclusion:group.exclusion?deepCopy(currentWorldGroupExclusion(group)):null,
      members:members.map(obj=>worldGroupTemplateMember(obj,group))
    };
    worldGroupTemplates().push(template);
    selectedWorldTemplateId=template.id;
    worldGroupTemplatePlaceMode=false;
    saveSceneData();
    worldGroupTemplateListSignature='';
    renderWorldGroupTools({force:true});
    hintEl.textContent=`Saved ${label} · ${template.members.length} ${template.members.length===1?'asset':'assets'}`;
    hintEl.classList.remove('hidden');
  }

  function deleteSelectedWorldGroupTemplate(){
    const template=worldGroupTemplateById(selectedWorldTemplateId);
    if(!template)return;
    if(!window.confirm(`Delete ${template.label}? Existing placed groups will not be affected.`))return;
    sceneData.worldGroupTemplates=worldGroupTemplates().filter(item=>item.id!==template.id);
    selectedWorldTemplateId=null;
    worldGroupTemplatePlaceMode=false;
    saveSceneData();
    worldGroupTemplateListSignature='';
    renderWorldGroupTools({force:true});
  }

  function createTemplateObject(member,group,anchor){
    const x=(Number(anchor.x)||0)+(Number(member.dx)||0);
    const locked=!!member.gameplayLayerLocked && (member.category||'dressing')==='gameplay';
    const z=locked
      ? pathZ
      : Rig.clamp((Number(anchor.z)||pathZ)+(Number(member.dz)||0),WORLD.farZ+.8,WORLD.nearZ-.6);
    const sx=Math.max(.02,Number(member.sx)||1);
    const sy=Math.max(.02,Number(member.sy)||1);
    const groundLine=Rig.clamp(Number.isFinite(Number(member.groundLine))?Number(member.groundLine):assetGroundLineDefault(member.assetName,member.assetState),0,1);
    const free=!!member.freePlacement;
    const groupGround=worldGroupAnchorGroundY(anchor.x,anchor.z);
    const floorY=free
      ? groupGround+(Number(member.freeGroupFloorOffset)||0)
      : terrainAnchorBaseY(x,z,member.category||'dressing',locked,member.assetName)+(Number(member.floorOffset)||0);
    const id=`user-${Date.now().toString(36)}-${++userSceneCounter}`;
    const category=member.category||'dressing';
    const collection=category==='gameplay'?frontOccluders:targetCollectionForZ(z);
    const collision=member.collisionOverride
      ? cloneCollision(member.collision)
      : behaviourCollisionFor(member.assetName,sx,sy,member.collision,member.assetState);
    const obj=addObject(collection,member.assetName,x,z,sx,sy,{
      id,userAdded:true,baseSx:sx,baseSy:sy,
      assetState:member.assetState || inferredAssetState(member.assetName),
      y:floorY-groundLine*sy,groundLine,
      shade:1,opacity:.99,flip:!!member.flip,layer:classifyLayer(z),
      category,gameplayType:member.gameplayType||null,
      gameplayLayerLocked:locked,freePlacement:free,
      collision,collisionOverride:!!member.collisionOverride,
      worldGroupId:group.id,wrap:false,
      thoughtText:member.thoughtText||'',thoughtRadius:member.thoughtRadius,thoughtOnce:member.thoughtOnce!==false,
      cameraNodeRadius:member.cameraNodeRadius,cameraNodeOffsetX:member.cameraNodeOffsetX,
      cameraNodeOffsetY:member.cameraNodeOffsetY,cameraNodeOffsetZ:member.cameraNodeOffsetZ,
      cameraNodeCurveStart:cameraNodeCurveSetting(member.cameraNodeCurveStart),
      cameraNodeCurveEnd:cameraNodeCurveSetting(member.cameraNodeCurveEnd)
    });
    moveObjectToCorrectCollection(obj);
    recordObjectEdit(obj);
    return obj;
  }

  function spawnWorldGroupTemplateAt(template,point){
    if(!template||!point||!Array.isArray(template.members)||!template.members.length)return null;
    const anchor={
      x:Number(point.x)||0,
      z:Rig.clamp(Number(point.z)||pathZ,WORLD.farZ+.8,WORLD.nearZ-.6)
    };
    const group={
      id:`world-group-${Date.now().toString(36)}-${++userSceneCounter}`,
      label:uniqueWorldGroupLabel(template.label||'World Group'),
      x:anchor.x,z:anchor.z,createdAt:Date.now(),templateId:template.id,
      exclusion:template.exclusion?deepCopy(cleanWorldGroupExclusion({x:anchor.x,z:anchor.z},template.exclusion)):null
    };
    worldGroups().push(group);
    for(const member of template.members)createTemplateObject(member,group,anchor);
    sortSceneCollections();
    selectedWorldGroupId=group.id;
    worldGroupEditMode=false;
    worldGroupMoveMode=false;
    worldGroupTemplatePlaceMode=false;
    saveSceneData();
    worldGroupListSignature='';
    worldGroupTemplateListSignature='';
    sceneEnvironmentListSignature='';
    renderWorldGroupTools({force:true});
    renderEnvironmentSelectionTools({force:true});
    return group;
  }

  function setWorldGroupTemplatePlaceMode(on){
    const template=worldGroupTemplateById(selectedWorldTemplateId);
    worldGroupTemplatePlaceMode=!!(on&&template);
    if(worldGroupTemplatePlaceMode){
      worldGroupMoveMode=false;
      worldGroupEditMode=false;
      if(addAssetType)exitPlacementMode();
    }
    worldGroupTemplateListSignature='';
    renderWorldGroupTools({force:true});
    if(template){
      hintEl.textContent=worldGroupTemplatePlaceMode
        ? `PLACE ${template.label.toUpperCase()} · tap the scene`
        : 'Template placement cancelled';
      hintEl.classList.remove('hidden');
    }
  }

  function renderWorldGroupTemplateTools({force=false}={}){
    if(!worldTemplateListEl)return;
    const templates=worldGroupTemplates();
    if(selectedWorldTemplateId&&!worldGroupTemplateById(selectedWorldTemplateId)){
      selectedWorldTemplateId=null;
      worldGroupTemplatePlaceMode=false;
    }
    const selected=worldGroupTemplateById(selectedWorldTemplateId);
    const group=worldGroupById(selectedWorldGroupId);
    const signature=`${selectedWorldTemplateId||''}|${worldGroupTemplatePlaceMode?'p':'-'}|${selectedWorldGroupId||''}|`+
      templates.map(t=>`${t.id}:${t.label}:${Array.isArray(t.members)?t.members.length:0}`).join('|');
    if(!force&&signature===worldGroupTemplateListSignature)return;
    worldGroupTemplateListSignature=signature;
    if(worldTemplateCountEl)worldTemplateCountEl.textContent=`${templates.length} ${templates.length===1?'template':'templates'}`;
    if(worldTemplateEmptyEl)worldTemplateEmptyEl.hidden=templates.length>0;
    worldTemplateListEl.innerHTML='';
    for(const template of templates){
      const row=document.createElement('button');
      row.type='button';
      row.className='sidescroll-environment-scene-row';
      row.classList.toggle('active',template.id===selectedWorldTemplateId);
      row.setAttribute('aria-selected',String(template.id===selectedWorldTemplateId));
      const main=document.createElement('span');
      main.className='scene-puzzle-main';
      const strong=document.createElement('strong');
      strong.textContent=template.label||'Group Template';
      const small=document.createElement('small');
      const count=Array.isArray(template.members)?template.members.length:0;
      small.textContent=`${count} ${count===1?'asset':'assets'}${worldGroupTemplatePlaceMode&&template.id===selectedWorldTemplateId?' · PLACE MODE':''}`;
      main.append(strong,small);
      row.append(main);
      bindEditorPress(row,()=>{
        selectedWorldTemplateId=template.id;
        worldGroupTemplatePlaceMode=false;
        worldGroupTemplateListSignature='';
        renderWorldGroupTools({force:true});
      });
      worldTemplateListEl.appendChild(row);
    }
    if(worldTemplateSaveBtn)worldTemplateSaveBtn.disabled=!(group&&worldGroupMembers(group.id).length);
    if(worldTemplatePlaceBtn){
      worldTemplatePlaceBtn.disabled=!selected;
      worldTemplatePlaceBtn.textContent=worldGroupTemplatePlaceMode?'Tap Scene…':'Place Template';
      worldTemplatePlaceBtn.classList.toggle('primary',worldGroupTemplatePlaceMode);
    }
    if(worldTemplateDeleteBtn)worldTemplateDeleteBtn.disabled=!selected;
    if(worldTemplateStatusEl)worldTemplateStatusEl.textContent=worldGroupTemplatePlaceMode&&selected
      ? `${selected.label} · tap a scene position to create a new independent group`
      : selected
        ? `${selected.label} · reusable ${selected.members?.length||0}-asset composition`
        : 'Save a finished group as a reusable template, then tap the scene to place a complete copy.';
  }

  function renderWorldGroupTools({force=false}={}){
    renderWorldGroupTemplateTools({force});
    if(!worldGroupListEl)return;const groups=worldGroups();
    if(selectedWorldGroupId&&!worldGroupById(selectedWorldGroupId)){selectedWorldGroupId=null;worldGroupEditMode=false;worldGroupMoveMode=false;worldGroupExclusionEditMode=false;}
    const selected=worldGroupById(selectedWorldGroupId);
    const signature=`${selectedWorldGroupId||''}|${worldGroupEditMode?'e':'-'}|${worldGroupMoveMode?'m':'-'}|${worldGroupExclusionEditMode?'x':'-'}|${selectedObject?.id||''}|`+groups.map(g=>{const ex=currentWorldGroupExclusion(g);return`${g.id}:${g.label}:${Number(g.x).toFixed(2)}:${Number(g.z).toFixed(2)}:${ex.enabled?'1':'0'}:${ex.centerX.toFixed(2)}:${ex.centerZ.toFixed(2)}:${ex.width.toFixed(2)}:${ex.depth.toFixed(2)}:${worldGroupMembers(g.id).map(o=>o.id).join(',')}`;}).join('|');
    if(!force&&signature===worldGroupListSignature)return;worldGroupListSignature=signature;
    if(worldGroupCountEl)worldGroupCountEl.textContent=`${groups.length} ${groups.length===1?'group':'groups'}`;if(worldGroupEmptyEl)worldGroupEmptyEl.hidden=groups.length>0;worldGroupListEl.innerHTML='';
    for(const group of groups){const members=worldGroupMembers(group.id),b=worldGroupBounds(group);const row=document.createElement('button');row.type='button';row.className='sidescroll-environment-scene-row';row.classList.toggle('active',group.id===selectedWorldGroupId);row.setAttribute('aria-selected',String(group.id===selectedWorldGroupId));const main=document.createElement('span');main.className='scene-puzzle-main';const strong=document.createElement('strong');strong.textContent=group.label||'World Group';const small=document.createElement('small');small.textContent=`${members.length} ${members.length===1?'asset':'assets'}${worldGroupEditMode&&group.id===selectedWorldGroupId?' · EDITING':''}`;main.append(strong,small);const pos=document.createElement('span');pos.className='scene-puzzle-x';pos.textContent=b?`x ${((b.minX+b.maxX)*.5).toFixed(1)}`:`x ${Number(group.x||0).toFixed(1)}`;row.append(main,pos);bindEditorPress(row,()=>selectWorldGroup(group.id,{focus:true}));worldGroupListEl.appendChild(row);}
    const has=!!selected;if(worldGroupEditBtn){worldGroupEditBtn.disabled=!has;worldGroupEditBtn.textContent=worldGroupEditMode?'Lock Group':'Edit Group';worldGroupEditBtn.classList.toggle('primary',worldGroupEditMode);}if(worldGroupMoveBtn){worldGroupMoveBtn.disabled=!has;worldGroupMoveBtn.textContent=worldGroupMoveMode?'Tap Scene…':'Move Group';worldGroupMoveBtn.classList.toggle('primary',worldGroupMoveMode);}if(worldGroupRenameBtn)worldGroupRenameBtn.disabled=!has;if(worldGroupDissolveBtn)worldGroupDissolveBtn.disabled=!has;if(worldGroupDeleteBtn)worldGroupDeleteBtn.disabled=!has;
    const ex=selected?currentWorldGroupExclusion(selected):null;
    if(worldGroupExclusionToggleBtn){worldGroupExclusionToggleBtn.disabled=!has;worldGroupExclusionToggleBtn.textContent=ex?.enabled?'Disable Exclusion':'Enable Exclusion';}
    if(worldGroupExclusionEditBtn){worldGroupExclusionEditBtn.disabled=!has;worldGroupExclusionEditBtn.textContent=worldGroupExclusionEditMode?'Finish Exclusion':'Edit Exclusion';worldGroupExclusionEditBtn.classList.toggle('primary',worldGroupExclusionEditMode);}
    if(worldGroupExclusionFitBtn)worldGroupExclusionFitBtn.disabled=!has;
    const selectedCanGroup=!!(selectedObject&&!selectedObject.deleted&&selectedObject.userAdded&&!selectedObject.puzzleInstanceId);if(worldGroupMembershipBtn){const inSelected=selectedCanGroup&&selected&&selectedObject.worldGroupId===selected.id;worldGroupMembershipBtn.disabled=!(selectedCanGroup&&selected);worldGroupMembershipBtn.textContent=inSelected?'Remove Selected':'Add Selected';}
    if(worldGroupStatusEl)worldGroupStatusEl.textContent=!selected
      ? 'Standalone placement · create or select a group to organise authored world assets.'
      : worldGroupExclusionEditMode
        ? `${selected.label} · exclusion ${ex?.enabled?'ON':'OFF'} · drag handles to move/resize`
        : worldGroupMoveMode
          ? `${selected.label} · tap a new scene position to move the complete group`
          : worldGroupEditMode
            ? `${selected.label} · MEMBERS UNLOCKED · new assets auto-join · select members to edit/add/remove`
            : `${selected.label} · LOCKED GROUP · drag ONLY the yellow dot to move · Edit Group unlocks members${ex?.enabled?' · exclusion ON':''}`;
  }

  function placedWorldEnvironmentObjects() {
    return allSceneObjects().filter(obj => obj && !obj.deleted && !obj.carried && !obj.puzzleInstanceId && obj.userAdded
      && !String(obj.id || '').startsWith('riverbank-'));
  }

  function renderEnvironmentSelectionTools({ force=false } = {}) {
    if (!environmentFilterRowEl || !environmentSceneListEl) return;
    renderWorldGroupTools({ force });
    const categoryOrder = new Map(environmentSelectionCategories.map((item,index) => [item.key,index]));
    const objects = placedWorldEnvironmentObjects().slice().sort((a,b) => {
      const ak = selectionCategoryForObject(a), bk = selectionCategoryForObject(b);
      if (ak !== bk) return (categoryOrder.get(ak) ?? 999) - (categoryOrder.get(bk) ?? 999);
      return (Number(a.x)||0) - (Number(b.x)||0);
    });
    const signature = `${environmentSelectionFilter}|${selectedObject?.id || ''}|${selectedWorldGroupId||''}|` + objects.map(obj => `${obj.id}:${obj.assetName}:${obj.worldGroupId||''}:${Number(obj.x).toFixed(3)}:${Number(obj.z).toFixed(3)}`).join('|');
    if (!force && signature === sceneEnvironmentListSignature) return;
    sceneEnvironmentListSignature = signature;

    environmentFilterRowEl.innerHTML = '';
    for (const category of environmentSelectionCategories) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sidescroll-environment-filter-chip';
      btn.textContent = category.label;
      btn.classList.toggle('active', environmentSelectionFilter === category.key);
      btn.setAttribute('aria-pressed', String(environmentSelectionFilter === category.key));
      bindEditorPress(btn, () => {
        environmentSelectionFilter = category.key;
        selectionTapCycle = null;
        selectionCycleInfo = null;
        sceneEnvironmentListSignature = '';
        renderEnvironmentSelectionTools({ force:true });
        hintEl.textContent = category.key === 'all' ? 'Selection filter · all world assets' : `Selection filter · ${category.label}`;
        hintEl.classList.remove('hidden');
      });
      environmentFilterRowEl.appendChild(btn);
    }

    environmentSceneListEl.innerHTML = '';
    if (environmentSceneCountEl) environmentSceneCountEl.textContent = `${objects.length} placed`;
    if (environmentSceneEmptyEl) environmentSceneEmptyEl.hidden = objects.length > 0;
    let lastKey = null;
    for (const obj of objects) {
      const meta = editorAssetSelectionMeta.get(obj.assetName) || { key:'other', label:'Other' };
      if (meta.key !== lastKey) {
        lastKey = meta.key;
        const heading = document.createElement('div');
        heading.className = 'sidescroll-environment-scene-group';
        heading.textContent = meta.label;
        environmentSceneListEl.appendChild(heading);
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-environment-scene-row';
      row.classList.toggle('active', obj === selectedObject);
      row.setAttribute('aria-selected', String(obj === selectedObject));
      const main = document.createElement('span');
      main.className = 'scene-puzzle-main';
      const strong = document.createElement('strong');
      strong.textContent = editorAssetInfo.get(obj.assetName)?.label || obj.assetName;
      const small = document.createElement('small');
      const groupLabel = worldGroupById(obj.worldGroupId)?.label;
      small.textContent = `${obj.category === 'gameplay' ? 'WORLD OBJECT' : 'ENVIRONMENT'}${groupLabel ? ` · ${groupLabel}` : ''}`;
      main.append(strong, small);
      const pos = document.createElement('span');
      pos.className = 'scene-puzzle-x';
      pos.textContent = `x ${Number(obj.x).toFixed(1)}`;
      row.append(main, pos);
      bindEditorPress(row, () => {
        environmentSelectionFilter = meta.key;
        selectionTapCycle = null;
        camera.x = Number(obj.x) - character.screenOffsetX;
        previousCameraX = camera.x;
        selectObject(obj, false);
        selectionCycleInfo = { objects:[obj], index:0 };
        sceneEnvironmentListSignature = '';
        renderEnvironmentSelectionTools({ force:true });
        hintEl.textContent = `Selected ${strong.textContent.toLowerCase()} · focused in scene`;
        hintEl.classList.remove('hidden');
      });
      environmentSceneListEl.appendChild(row);
    }
  }

  function sortSceneCollections() {
    backdrop.sort((a,b)=>a.z-b.z);
    midfill.sort((a,b)=>a.z-b.z);
    frontOccluders.sort((a,b)=>a.z-b.z);
  }

  function selectedPuzzleMarker() {
    return markerForId(editorPuzzleMarkerId) || null;
  }

  function selectedPuzzleInstance() {
    if (editMode && editorScope === 'puzzle' && puzzleBrowserMode === 'library') return null;
    const marker = selectedPuzzleMarker();
    if (!marker) return null;
    if (editMode && editorScope === 'puzzle' && puzzleWorkshopClear) return activePuzzleInstances.get(marker.id) || null;
    return activePuzzleInstances.get(marker.id) || instantiatePuzzleGroup(marker);
  }

  function editorObjectIsEditable(obj) {
    if (!obj || obj.deleted) return false;
    if (editorScope === 'puzzle') {
      if (!(puzzleBrowserMode === 'scene' && !!editorPuzzleMarkerId && obj.puzzleInstanceId === editorPuzzleMarkerId)) return false;
      // Pieces and Dressing are explicit edit layers. Placement is a separate
      // state, so existing dressing remains selectable/movable after Done Placing.
      const assetScope = editorAssetScope.get(obj.assetName);
      return puzzleEnvironmentPlacementMode ? assetScope === 'environment' : assetScope !== 'environment';
    }
    // Environment editing never reaches into an instantiated puzzle.
    if (obj.puzzleInstanceId) return false;
    // World Groups are locked compositions by default. Their children become
    // individually editable only after the author explicitly enters Edit Group
    // for that same group. Standalone objects remain editable at all times.
    if (obj.worldGroupId) {
      return !!(worldGroupEditMode && selectedWorldGroupId === obj.worldGroupId);
    }
    return true;
  }

  function pointInsideScreenBounds(clientX, clientY, bounds, pad = 4) {
    if (!bounds) return false;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= bounds.left-pad && x <= bounds.right+pad && y >= bounds.top-pad && y <= bounds.bottom+pad;
  }

  function puzzleAssetNamesFor(markerId) {
    const marker = markerForId(markerId);
    const def = markerDefinition(marker);
    const names = new Set();
    for (const packName of def?.assetPacks || []) {
      for (const asset of puzzleConfig.assetPacks?.[packName]?.assets || []) names.add(asset.name);
    }
    return names;
  }

  function selectedLibraryGroupId() {
    if (editorPuzzleLibraryGroupId && groupDefinition(editorPuzzleLibraryGroupId)) return editorPuzzleLibraryGroupId;
    const marker = selectedPuzzleMarker();
    if (marker?.group && groupDefinition(marker.group)) return marker.group;
    return allPuzzleGroups()[0]?.id || null;
  }

  function puzzleGroupDisplayRows() {
    const groups = allPuzzleGroups();
    const labelCounts = new Map();
    for (const { id, def } of groups) {
      const label = def?.label || id;
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    }
    const seenLabels = new Map();
    return groups.map(({ id, def }) => {
      const label = def?.label || id;
      const source = groupIsUserCreated(id) ? 'LOCAL' : 'BUILT-IN';
      const nth = (seenLabels.get(label) || 0) + 1;
      seenLabels.set(label, nth);
      const duplicateSuffix = (labelCounts.get(label) || 0) > 1 ? ` ${nth}` : '';
      return { id, def, label, source, displayLabel:`${label}${duplicateSuffix} · ${source}` };
    });
  }

  function renderScenePuzzleList({ force=false } = {}) {
    if (!puzzleSceneListEl) return;
    const markers = scenePuzzleMarkers().slice().sort((a,b) => Number(a.x) - Number(b.x));
    const signature = markers.map(marker => [
      marker.id,
      marker.group,
      markerLinkMode(marker),
      Number(marker.x).toFixed(4)
    ].join(':')).join('|') + `|selected:${editorPuzzleMarkerId || ''}`;
    if (!force && signature === scenePuzzleListSignature) return;
    scenePuzzleListSignature = signature;

    puzzleSceneListEl.innerHTML = '';
    if (puzzleSceneEmptyEl) puzzleSceneEmptyEl.hidden = markers.length > 0;

    for (const marker of markers) {
      const def = markerDefinition(marker);
      const label = def?.label || marker.group || marker.id;
      const kind = markerLinkMode(marker) === 'copy' ? 'COPY' : 'INSTANCE';
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-scene-puzzle-row';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(marker.id === editorPuzzleMarkerId));
      row.classList.toggle('active', marker.id === editorPuzzleMarkerId);
      const main = document.createElement('span');
      main.className = 'scene-puzzle-main';
      const strong = document.createElement('strong');
      strong.textContent = label;
      const small = document.createElement('small');
      small.textContent = kind;
      main.append(strong, small);
      const pos = document.createElement('span');
      pos.className = 'scene-puzzle-x';
      pos.textContent = `x ${Number(marker.x).toFixed(1)}`;
      row.append(main, pos);
      bindEditorPress(row, () => {
        // Selecting a Scene row is intentionally passive. It chooses which
        // marker the contextual controls refer to without moving the camera or
        // recreating/instantiating the puzzle. Edit and Focus remain explicit.
        editorPuzzleMarkerId = marker.id;
        editorPuzzleLibraryGroupId = marker.group;
        selectObject(null);
        scenePuzzleListSignature = '';
        renderScenePuzzleList({ force:true });
        updatePuzzlePanel();
      });
      puzzleSceneListEl.appendChild(row);
    }
  }

  function populatePuzzleSelector({ force=false } = {}) {
    if (puzzleSelect) {
      const rows = puzzleGroupDisplayRows();
      const wanted = selectedLibraryGroupId();
      const signature = rows.map(row => `${row.id}:${row.displayLabel}`).join('|') + `|selected:${wanted || ''}`;
      if (force || signature !== puzzleLibraryListSignature) {
        puzzleLibraryListSignature = signature;
        puzzleSelect.innerHTML = '';
        for (const row of rows) {
          const option = document.createElement('option');
          option.value = row.id;
          option.textContent = row.displayLabel;
          puzzleSelect.appendChild(option);
        }
        editorPuzzleLibraryGroupId = wanted;
        if (wanted) puzzleSelect.value = wanted;
        puzzleSelect.setAttribute('aria-label', 'Puzzle library template');
      }
    }
    renderScenePuzzleList({ force });
  }

  function setPuzzleBrowserMode(mode) {
    if (mode !== 'library' && mode !== 'scene') return;
    puzzleBrowserMode = mode;
    selectObject(null);
    if (mode === 'library') {
      const marker = selectedPuzzleMarker();
      if (marker?.group) editorPuzzleLibraryGroupId = marker.group;
      editorPuzzleLibraryGroupId ||= allPuzzleGroups()[0]?.id || null;
    } else {
      const markers = scenePuzzleMarkers();
      if (!editorPuzzleMarkerId || !markers.some(marker => marker.id === editorPuzzleMarkerId)) {
        // Scene mode is a browser first: show the full list and wait for an
        // explicit row tap rather than silently choosing the first puzzle.
        editorPuzzleMarkerId = null;
      }
    }
    populatePuzzleSelector();
    buildAssetPalette();
    updatePuzzlePanel();
    updateEditorButtons();
  }

  function goToWorldX(targetX, label = 'Position') {
    if (!Number.isFinite(Number(targetX))) return;
    const x = Number(targetX);
    camera.x = x - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = x;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    updatePuzzleStreaming(character.x);
    if (quickNavPanel) quickNavPanel.hidden = true;
    if (quickNavBtn) quickNavBtn.setAttribute('aria-expanded', 'false');
    hintEl.textContent = `${label} · x ${x.toFixed(1)}`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function renderQuickNav() {
    if (!quickNavListEl) return;
    quickNavListEl.innerHTML = '';
    const current = document.createElement('div');
    current.className = 'sidescroll-quick-nav-current';
    current.textContent = `Character X ${Number(character?.x ?? (camera.x + character.screenOffsetX)).toFixed(1)}`;
    quickNavListEl.appendChild(current);
    const destinations = [{ label:'Start', x:0, detail:'Scene start' }];
    for (const marker of scenePuzzleMarkers().slice().sort((a,b) => Number(a.x)-Number(b.x))) {
      const def = markerDefinition(marker);
      destinations.push({ label:def?.label || marker.group || 'Puzzle', x:Number(marker.x)||0, detail:'Puzzle' });
    }
    for (const destination of destinations) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-quick-nav-row';
      row.innerHTML = `<span><strong>${destination.label}</strong><small>${destination.detail}</small></span><b>x ${destination.x.toFixed(1)}</b>`;
      bindEditorPress(row, () => goToWorldX(destination.x, destination.label));
      quickNavListEl.appendChild(row);
    }
  }

  function setQuickNavOpen(open) {
    if (!quickNavPanel || !quickNavBtn) return;
    const next = !!open && editMode;
    quickNavPanel.hidden = !next;
    quickNavBtn.setAttribute('aria-expanded', String(next));
    if (next) {
      setAssetPaletteOpen(false);
      cameraEditMode = false;
      updateCameraEditorUi();
      renderQuickNav();
    }
  }

  function focusSelectedPuzzle() {
    // Focus is a Scene action: it only moves the view to the selected marker.
    // It deliberately does not change the selected template or create a puzzle.
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    camera.x = marker.x - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = camera.x + character.screenOffsetX;
    if (editMode) {
      const support = editorSafeSupportAt(character.x + colliderWorld().offsetX, Infinity, 0);
      jumpOffset = support.offset;
      character.y = playSurfaceYAt(character.x) + jumpOffset;
      standingOnObject = support.obj;
      jumping = false;
      jumpVelocity = 0;
    }
    updatePuzzleStreaming(character.x);
    hintEl.textContent = `Focused ${markerDefinition(marker)?.label || marker.group} at x ${Number(marker.x).toFixed(1)}`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function editSelectedScenePuzzle() {
    if (puzzleBrowserMode !== 'scene') return;
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    // Explicitly activate the selected puzzle for bounds/object editing. This is
    // separate from row selection so browsing the Scene list stays predictable.
    editorPuzzleLibraryGroupId = marker.group || editorPuzzleLibraryGroupId;
    instantiatePuzzleGroup(marker);
    if (puzzleWorkshopIsolated) {
      puzzleWorkshopClear = false;
      savePuzzleWorkshopState(marker.id);
    }
    puzzleEnvironmentPlacementMode = false;
    addAssetType = null;
    setAssetPaletteOpen(false);
    updatePlacementModeUi();
    selectObject(null);
    buildAssetPalette();
    hintEl.textContent = `Editing ${markerDefinition(marker)?.label || marker.group} · tap props or bounds to modify them`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function choosePuzzleForEditing(markerId, focus = false) {
    const marker = markerForId(markerId) || allPuzzleMarkers()[0] || null;
    editorPuzzleMarkerId = marker?.id || null;
    if (marker) {
      currentPuzzleBoundsRelative(marker);
      editorPuzzleLibraryGroupId = marker.group || editorPuzzleLibraryGroupId;

      // A cleared workshop is a template-picking state. Merely choosing a
      // puzzle (or switching to the Puzzle tab) must not put anything into the
      // world. Spawn Here / New Puzzle are the only authoring actions that turn
      // a template into a live instance.
      if (!(puzzleWorkshopIsolated && puzzleWorkshopClear)) {
        instantiatePuzzleGroup(marker);
        if (puzzleWorkshopIsolated) savePuzzleWorkshopState(marker.id);
      } else {
        savePuzzleWorkshopState(null);
      }
    }
    selectObject(null);
    buildAssetPalette();
    if (focus && !(puzzleWorkshopIsolated && puzzleWorkshopClear)) focusSelectedPuzzle();
    updatePuzzlePanel();
  }


  function puzzleSlug(text) {
    return String(text || 'puzzle').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'puzzle';
  }

  function puzzleExportFilename(text) {
    // Keep the author's puzzle name intact (including spaces/underscores/case)
    // and only strip characters that are illegal or troublesome in filenames.
    const cleaned = String(text || 'Puzzle').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+$/g, '');
    return `${cleaned || 'Puzzle'}.json`;
  }

  function deepCopy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function puzzleSpawnX() {
    return camera.x + character.screenOffsetX;
  }

  function uniqueLocalId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random()*0xffff).toString(36)}`;
  }

  function addLocalMarker(groupId, x, { linkMode='instance', startSnapshot=null } = {}) {
    const marker = { id:uniqueLocalId('marker'), group:groupId, x:Number(x) || 0, local:true, linkMode:linkMode === 'copy' ? 'copy' : 'instance' };
    userPuzzleLibrary.markers.push(marker);
    if (marker.linkMode === 'copy' && startSnapshot) {
      puzzleStartState[marker.id] = deepCopy(startSnapshot);
      puzzleStartState[marker.id].source = 'authored';
      puzzleStartState[marker.id].savedAt = Date.now();
      savePuzzleStarts();
    }
    savePuzzleLibrary();
    populatePuzzleSelector({ force:true });
    return marker;
  }

  function spawnSelectedPuzzleHere() {
    const groupId = puzzleBrowserMode === 'library' ? selectedLibraryGroupId() : selectedPuzzleMarker()?.group;
    if (!groupId || !groupDefinition(groupId)) return;
    const marker = addLocalMarker(groupId, puzzleSpawnX(), { linkMode:'instance' });
    puzzleWorkshopIsolated = true;
    puzzleWorkshopClear = false;
    puzzleBrowserMode = 'scene';
    editorPuzzleMarkerId = marker.id;
    editorPuzzleLibraryGroupId = marker.group;
    populatePuzzleSelector({ force:true });
    choosePuzzleForEditing(marker.id, true);
    savePuzzleWorkshopState(marker.id);
    applyPuzzleStart(selectedPuzzleInstance(), { persistRuntime:true });
    hintEl.textContent = 'Linked puzzle instance spawned here · edit it, then Set Start or Save Unique';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function createPuzzleHere() {
    const entered = window.prompt('Puzzle name', 'New puzzle');
    if (entered == null) return;
    const label = entered.trim() || 'New puzzle';
    let groupId = `USER_${puzzleSlug(label).replace(/-/g,'_').toUpperCase()}`;
    let suffix = 2;
    while (userPuzzleLibrary.groups[groupId] || puzzleConfig.groups?.[groupId]) groupId = `USER_${puzzleSlug(label).replace(/-/g,'_').toUpperCase()}_${suffix++}`;
    userPuzzleLibrary.groups[groupId] = { label, width:8, assetPacks:['woodland-puzzle-atlas-v1'], entryX:-3.5, exitX:3.5, props:[] };
    userPuzzleLibrary.templates ||= {};
    userPuzzleLibrary.templates[groupId] = { source:'authored', savedAt:Date.now(), bounds:{minX:-4,maxX:4}, objects:{} };
    savePuzzleLibrary();
    puzzleBrowserMode = 'library';
    editorPuzzleLibraryGroupId = groupId;
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Blank puzzle added to the Library · press Spawn Here when you are ready to build it';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function clearPuzzleStage() {
    if (puzzleTestMode) return;
    const selectedBeforeClear = selectedPuzzleMarker();
    const selectedGroupBeforeClear = puzzleBrowserMode === 'library' ? selectedLibraryGroupId() : (selectedBeforeClear?.group || null);
    puzzleWorkshopIsolated = true;
    puzzleWorkshopClear = true;
    selectObject(null);

    // Clear means clear the authored workshop stage, not merely hide it for the
    // current session. Remove every locally placed marker instance while
    // preserving the reusable puzzle group/template definitions themselves.
    const localIds = new Set((userPuzzleLibrary.markers || []).map(marker => marker.id));
    for (const id of [...activePuzzleInstances.keys()]) unloadPuzzleGroup(id);
    for (const id of localIds) {
      delete puzzleStartState[id];
      delete puzzleSavedState[id];
      delete puzzleDraftBounds[id];
      delete puzzleRespawnDraft[id];
    }
    userPuzzleLibrary.markers = [];
    savePuzzleLibrary();
    savePuzzleStarts();
    savePuzzleState();

    // Clearing the stage leaves the reusable Puzzle Library untouched.
    editorPuzzleMarkerId = null;
    puzzleBrowserMode = 'library';
    editorPuzzleLibraryGroupId = selectedGroupBeforeClear && groupDefinition(selectedGroupBeforeClear)
      ? selectedGroupBeforeClear
      : (allPuzzleGroups()[0]?.id || null);
    populatePuzzleSelector({ force:true });
    savePuzzleWorkshopState(null);

    hintEl.textContent = 'Stage cleared and saved · choose a Library puzzle then Spawn Here, or create a new puzzle';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }


  function restoreNormalPuzzleStage() {
    if (puzzleTestMode) return;
    puzzleWorkshopIsolated = false;
    puzzleWorkshopClear = false;
    puzzleBrowserMode = 'scene';
    savePuzzleWorkshopState(null);
    updatePuzzleStreaming(camera.x + character.screenOffsetX);
    const near = activePuzzleNear(camera.x + character.screenOffsetX);
    editorPuzzleMarkerId = near?.id || allPuzzleMarkers()[0]?.id || null;
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Normal game puzzle markers restored';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function removeSelectedLocalPuzzle() {
    const marker = selectedPuzzleMarker();
    if (!marker || !markerIsUserCreated(marker)) return;
    if (!window.confirm('Remove this locally spawned puzzle instance?')) return;
    unloadPuzzleGroup(marker.id);
    userPuzzleLibrary.markers = userPuzzleLibrary.markers.filter(item => item.id !== marker.id);
    delete puzzleStartState[marker.id];
    delete puzzleSavedState[marker.id];
    delete puzzleDraftBounds[marker.id];
    delete puzzleRespawnDraft[marker.id];
    savePuzzleLibrary(); savePuzzleStarts(); savePuzzleState();
    if (puzzleWorkshopState.markerId === marker.id) savePuzzleWorkshopState(null);
    editorPuzzleMarkerId = null;
    populatePuzzleSelector({ force:true });
    updatePuzzlePanel();
  }

  function deleteSelectedPuzzleTemplate() {
    const groupId = selectedLibraryGroupId();
    if (!groupId || !groupIsUserCreated(groupId)) return;
    const def = groupDefinition(groupId);
    const linkedMarkers = (userPuzzleLibrary.markers || []).filter(marker => marker.group === groupId);
    const suffix = linkedMarkers.length
      ? ` This will also remove ${linkedMarkers.length} placed scene puzzle${linkedMarkers.length === 1 ? '' : 's'} that use it.`
      : '';
    if (!window.confirm(`Delete "${def?.label || groupId}" from the Puzzle Library?${suffix}`)) return;

    const removedIds = new Set(linkedMarkers.map(marker => marker.id));
    for (const marker of linkedMarkers) {
      unloadPuzzleGroup(marker.id);
      delete puzzleStartState[marker.id];
      delete puzzleSavedState[marker.id];
      delete puzzleDraftBounds[marker.id];
    delete puzzleRespawnDraft[marker.id];
    }
    userPuzzleLibrary.markers = (userPuzzleLibrary.markers || []).filter(marker => marker.group !== groupId);
    delete userPuzzleLibrary.groups[groupId];
    delete userPuzzleLibrary.templates[groupId];
    if (editorPuzzleMarkerId && removedIds.has(editorPuzzleMarkerId)) editorPuzzleMarkerId = null;

    const fallback = allPuzzleGroups()[0]?.id || null;
    editorPuzzleLibraryGroupId = fallback;
    savePuzzleLibrary();
    savePuzzleStarts();
    savePuzzleState();
    if (puzzleWorkshopIsolated && !(userPuzzleLibrary.markers || []).length) {
      puzzleWorkshopClear = true;
      savePuzzleWorkshopState(null);
    }
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Puzzle template deleted';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function puzzleOrphanObjects(instance) {
    if (!instance) return [];
    const allowed = puzzleAssetNamesFor(instance.id);
    const b = puzzleBounds(instance);
    return allSceneObjects().filter(obj => {
      if (!obj || obj.deleted || obj.puzzleInstanceId) return false;
      const puzzleLikeName = allowed.has(obj.assetName)
        || /^(?:puzzle-|fallen-tree$|tree-stump$|broken-branch$|log-|barrel$|puzzle-crate)/.test(obj.assetName || '');
      if (!puzzleLikeName) return false;
      const x = objectXNear(obj, instance.marker.x);
      return x >= b.minX - 1 && x <= b.maxX + 1;
    });
  }

  function focusObjectForAuthoring(obj) {
    if (!obj) return;
    camera.x = objectXNear(obj, camera.x) - character.screenOffsetX;
    previousCameraX = camera.x;
    if (obj.puzzleInstanceId === editorPuzzleMarkerId) selectObject(obj);
    else {
      // Orphans are deliberately selectable from the list even though normal
      // puzzle-scope tapping refuses environment objects.
      selectedObject = obj;
      selectionCycleInfo = null;
      collisionEditMode = false;
      updateEditorButtons();
    }
  }

  function deletePuzzleListObject(obj) {
    if (!obj) return;
    obj.deleted = true;
    recordObjectEdit(obj);
    if (obj.category === 'gameplay') settleGameplayCrates();
    if (selectedObject === obj) selectedObject = null;
    updateEditorButtons();
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function restorePuzzleListObject(obj) {
    if (!obj) return;
    obj.deleted = false;
    recordObjectEdit(obj);
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function updatePuzzleObjectList() {
    if (!puzzleObjectsEl || !puzzleObjectListEl) return;
    const instance = (editMode && editorScope === 'puzzle' && !puzzleWorkshopClear) ? selectedPuzzleInstance() : null;
    puzzleObjectsEl.hidden = !instance || puzzleTestMode;
    if (!instance) {
      puzzleObjectListSignature = '';
      puzzleObjectListEl.innerHTML='';
      if (puzzleObjectCountEl) puzzleObjectCountEl.textContent='0';
      return;
    }
    const rowMatchesLayer = obj => {
      const assetScope = editorAssetScope.get(obj?.assetName);
      return puzzleEnvironmentPlacementMode ? assetScope === 'environment' : assetScope !== 'environment';
    };
    const rows = [
      ...instance.objects
        .filter(rowMatchesLayer)
        .filter(obj => !(obj.deleted && String(obj.puzzleObjectId || '').startsWith('authored-')))
        .map(obj => ({obj, orphan:false})),
      ...puzzleOrphanObjects(instance).filter(rowMatchesLayer).map(obj => ({obj, orphan:true}))
    ];
    if (puzzleObjectCountEl) puzzleObjectCountEl.textContent = String(rows.length);
    const signature = `${instance.id}|${puzzleEnvironmentPlacementMode ? 'dressing' : 'pieces'}|${rows.map(({obj,orphan}) => `${obj.id}:${obj.assetName}:${obj.deleted?'d':'a'}:${orphan?'o':'n'}`).join('|')}`;
    if (signature === puzzleObjectListSignature) return;
    puzzleObjectListSignature = signature;
    puzzleObjectListEl.innerHTML = '';
    for (const {obj,orphan} of rows) {
      const row = document.createElement('div');
      row.className = `sidescroll-puzzle-object-row${orphan ? ' orphan' : ''}${obj.deleted ? ' deleted' : ''}`;
      const label = document.createElement('button');
      label.type='button'; label.className='object-name';
      const friendly = editorAssetInfo.get(obj.assetName)?.label || obj.assetName || 'unknown';
      label.textContent = `${orphan ? 'ORPHAN · ' : ''}${friendly}${obj.deleted ? ' · deleted' : ''}`;
      label.title = obj.puzzleObjectId || obj.id;
      bindEditorPress(label, () => focusObjectForAuthoring(obj));
      const action = document.createElement('button');
      action.type='button'; action.className='object-action';
      action.textContent = obj.deleted ? 'Restore' : 'Delete';
      bindEditorPress(action, () => { obj.deleted ? restorePuzzleListObject(obj) : deletePuzzleListObject(obj); });
      row.append(label,action);
      puzzleObjectListEl.appendChild(row);
    }
  }

  function currentPuzzleSetupSnapshot(instance) {
    if (!instance) return null;
    const objects = {};
    for (const obj of instance.objects) {
      if (!obj?.puzzleObjectId) continue;
      objects[obj.puzzleObjectId] = {
        asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName),
        x:obj.x-instance.marker.x,
        z:obj.z,
        yOffset:obj.y - (obj.category === 'gameplay' && obj.gameplayLayerLocked ? playSurfaceYAt(obj.x) : terrainGroundYAt(obj.x, obj.z)),
        floorOffset:objectFloorOffsetFromTerrain(obj),
        groundLine:objectGroundLine(obj),
        sx:obj.sx,
        sy:obj.sy,
        flip:!!obj.flip,
        deleted:!!obj.deleted,
        category:obj.category || 'gameplay',
        gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked,
        freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
        collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride,
        shadow:obj.shadow ? { ...obj.shadow } : null,
        sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
        socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null,
        runtimeRotation:Number(obj.runtimeRotation)||0,
        cartRailLocked:!!obj.cartRailLocked,
        wheelRotation:Number(obj.wheelRotation)||0,
        thoughtText:typeof obj.thoughtText === 'string' ? obj.thoughtText : '',
        thoughtRadius:Rig.clamp(Number(obj.thoughtRadius) || 1.4,0.25,8),
        thoughtOnce:obj.thoughtOnce !== false,
        cameraNodeRadius:Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20),
        cameraNodeOffsetX:Number(obj.cameraNodeOffsetX)||0, cameraNodeOffsetY:Number(obj.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(obj.cameraNodeOffsetZ)||0,
        cameraNodeCurveStart:cameraNodeCurveSetting(obj.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(obj.cameraNodeCurveEnd)
      };
    }
    return { bounds:{...currentPuzzleBoundsRelative(instance.marker)}, objects, respawn:deepCopy(currentPuzzleRespawn(instance.marker)), cartPath:deepCopy(currentPuzzleCartPath(instance.marker)), worldModifiers:deepCopy(rawPuzzleWorldModifiersForMarker(instance.marker)) };
  }

  function puzzleExportPayload(instance) {
    const marker = instance.marker;
    const def = markerDefinition(marker) || {};
    const start = deepCopy(puzzleStartFor(marker));
    const diagnostics = instance.objects.map(obj => ({
      id:obj.id,
      puzzleObjectId:obj.puzzleObjectId,
      asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName),
      deleted:!!obj.deleted,
      x:obj.x,
      relativeX:obj.x-marker.x,
      y:obj.y,
      z:obj.z,
      sx:obj.sx,
      sy:obj.sy,
      hasTexture:!!obj.texture,
      category:obj.category,
      gameplayType:obj.gameplayType,
      collision:cloneCollision(obj.collision),
      thoughtText:obj.thoughtText || null, thoughtRadius:Number(obj.thoughtRadius)||null, thoughtOnce:obj.thoughtOnce !== false,
      cameraNodeRadius:obj.assetName==='camera-trigger' ? Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20) : null,
      cameraNodeOffsetX:obj.assetName==='camera-trigger' ? Number(obj.cameraNodeOffsetX)||0 : null,
      cameraNodeOffsetY:obj.assetName==='camera-trigger' ? Number(obj.cameraNodeOffsetY)||0 : null,
      cameraNodeOffsetZ:obj.assetName==='camera-trigger' ? Number(obj.cameraNodeOffsetZ)||0 : null,
      cameraNodeCurveStart:obj.assetName==='camera-trigger' ? cameraNodeCurveSetting(obj.cameraNodeCurveStart) : null,
      cameraNodeCurveEnd:obj.assetName==='camera-trigger' ? cameraNodeCurveSetting(obj.cameraNodeCurveEnd) : null,
      sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
      socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null
    }));
    const orphans = puzzleOrphanObjects(instance).map(obj => ({
      id:obj.id, asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName), x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy,
      deleted:!!obj.deleted, hasTexture:!!obj.texture, category:obj.category, gameplayType:obj.gameplayType
    }));
    return {
      format:'SideScrollPuzzle',
      formatVersion:1,
      appVersion:'1.0.105',
      exportedAt:new Date().toISOString(),
      marker:{ id:marker.id, group:marker.group, x:marker.x, local:markerIsUserCreated(marker) },
      definition:deepCopy(def),
      savedStart:start,
      currentSetup:currentPuzzleSetupSnapshot(instance),
      currentSetupDiffersFromSaved:puzzleStartDirty.has(instance.id),
      diagnostics:{ objects:diagnostics, orphanCandidates:orphans }
    };
  }

  async function exportSelectedPuzzle() {
    let payload = null;
    let filename = 'SideScroll-puzzle.json';
    if (puzzleBrowserMode === 'library' && !puzzleTestMode) {
      const groupId = selectedLibraryGroupId();
      const def = groupDefinition(groupId);
      if (!groupId || !def) return;
      payload = {
        format:'SideScrollPuzzleTemplate', formatVersion:1, appVersion:'1.0.105', exportedAt:new Date().toISOString(),
        group:groupId, definition:deepCopy(def), savedStart:deepCopy(templateStartForGroup(groupId)),
        source:groupIsUserCreated(groupId) ? 'local-library' : 'library'
      };
      filename = puzzleExportFilename(def.label || groupId);
    } else {
      const instance = selectedPuzzleInstance();
      if (!instance) return;
      payload = puzzleExportPayload(instance);
      filename = puzzleExportFilename(instance.def?.label || instance.marker.group);
    }
    const text = JSON.stringify(payload,null,2);
    const blob = new Blob([text], {type:'application/json'});
    try {
      const file = new File([blob], filename, {type:'application/json'});
      if (navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file]});
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    hintEl.textContent = 'Puzzle JSON exported';
    hintEl.classList.remove('hidden');
  }


  function exportableEnvironmentObject(obj) {
    if (!obj || obj.puzzleInstanceId || obj.collectible) return null;
    return {
      id:obj.id,
      asset:obj.assetName, assetState:obj.assetState || inferredAssetState(obj.assetName),
      x:Number(obj.x) || 0,
      y:Number(obj.y) || 0,
      z:Number(obj.z) || 0,
      sx:Number(obj.sx) || 1,
      sy:Number(obj.sy) || 1,
      flip:!!obj.flip,
      deleted:!!obj.deleted,
      category:obj.category || 'dressing',
      gameplayType:obj.gameplayType || null,
      gameplayLayerLocked:!!obj.gameplayLayerLocked,
      freePlacement:objectUsesFreePlacement(obj), worldFloorY:objectFloorWorldY(obj),
      userAdded:!!obj.userAdded,
      worldGroupId:obj.worldGroupId || null,
      collision:cloneCollision(obj.collision),
      collisionOverride:!!obj.collisionOverride,
      thoughtText:obj.assetName==='thought-trigger' ? (obj.thoughtText || '') : null,
      thoughtRadius:obj.assetName==='thought-trigger' ? Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8) : null,
      thoughtOnce:obj.assetName==='thought-trigger' ? obj.thoughtOnce !== false : null,
      cameraNodeRadius:obj.assetName==='camera-trigger' ? Rig.clamp(Number(obj.cameraNodeRadius)||4,.5,20) : null,
      cameraNodeOffsetX:obj.assetName==='camera-trigger' ? (Number(obj.cameraNodeOffsetX)||0) : null,
      cameraNodeOffsetY:obj.assetName==='camera-trigger' ? (Number(obj.cameraNodeOffsetY)||0) : null,
      cameraNodeOffsetZ:obj.assetName==='camera-trigger' ? (Number(obj.cameraNodeOffsetZ)||0) : null,
      cameraNodeCurveStart:obj.assetName==='camera-trigger' ? cameraNodeCurveSetting(obj.cameraNodeCurveStart) : null,
      cameraNodeCurveEnd:obj.assetName==='camera-trigger' ? cameraNodeCurveSetting(obj.cameraNodeCurveEnd) : null
    };
  }

  function allPuzzleDesignsForExport() {
    return allPuzzleMarkers().map(marker => {
      const instance = activePuzzleInstances.get(marker.id) || null;
      const savedStart = deepCopy(puzzleStartFor(marker));
      const currentSetup = instance ? currentPuzzleSetupSnapshot(instance) : null;
      const dirty = !!(instance && puzzleStartDirty.has(instance.id));
      return {
        marker:{
          id:marker.id,
          group:marker.group,
          x:Number(marker.x) || 0,
          local:markerIsUserCreated(marker),
          linkMode:markerLinkMode(marker)
        },
        source:markerIsUserCreated(marker) ? 'local' : 'built-in',
        definition:deepCopy(markerDefinition(marker) || {}),
        savedStart,
        currentSetup,
        currentSetupDiffersFromSaved:dirty,
        effectiveSetup:dirty && currentSetup ? deepCopy(currentSetup) : savedStart
      };
    });
  }

  function completeGameDesignExportPayload() {
    let cameraTune = null;
    try {
      cameraTune = JSON.parse(localStorage.getItem(CAMERA_TUNE_STORAGE_KEY) || 'null');
    } catch (_) {}

    const environmentSnapshot = allSceneObjects()
      .map(exportableEnvironmentObject)
      .filter(Boolean)
      .sort((a,b) => (a.x-b.x) || (a.z-b.z) || String(a.id).localeCompare(String(b.id)));

    return {
      format:'SideScrollGameDesign',
      formatVersion:1,
      appVersion:'1.0.105',
      exportedAt:new Date().toISOString(),
      purpose:'Complete authoring handoff: scene placement, World Groups/templates, puzzle placement/setup, reusable asset settings, collectables and camera tuning.',
      world:{
        tile:{ minX:TILE.minX, maxX:TILE.maxX, width:TILE_WIDTH },
        path:{ z:pathZ, flatHalf:PATH_FLAT_HALF, bermHalf:PATH_BERM_HALF, outerHalf:PATH_OUTER_HALF },
        start:{ x:0, z:pathZ }
      },
      scene:{
        edits:deepCopy(sceneData),
        resolvedEnvironment:environmentSnapshot
      },
      puzzles:{
        instances:allPuzzleDesignsForExport(),
        localLibrary:deepCopy(userPuzzleLibrary),
        savedStarts:deepCopy(puzzleStartState)
      },
      assets:{
        behaviourOverrides:deepCopy(assetBehaviourOverrides),
        collisionDefaults:deepCopy(assetCollisionDefaults),
        climbPaths:deepCopy({...BUILTIN_ASSET_CLIMB_PATHS,...assetClimbPathOverrides})
      },
      collectables:{
        setup:deepCopy(collectibleSetup)
      },
      camera:cameraTune || { y:camera.y, z:camera.z, tilt:camera.targetY-camera.y }
    };
  }

  async function exportAllGameDesign() {
    const payload = completeGameDesignExportPayload();
    const text = JSON.stringify(payload, null, 2);
    const filename = 'SideScroll-Complete-Game-Design.json';
    const blob = new Blob([text], {type:'application/json'});

    try {
      const file = new File([blob], filename, {type:'application/json'});
      if (navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file]});
        hintEl.textContent = 'Complete game design exported';
        hintEl.classList.remove('hidden');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    hintEl.textContent = 'Complete game design exported';
    hintEl.classList.remove('hidden');
  }

  function setEditorScope(scope) {
    if (scope !== 'environment' && scope !== 'puzzle') return;
    // Environment/Puzzle is only an editor filter. It must not change whether
    // the workshop stage is isolated or clear.
    editorScope = scope;
    if (scope !== 'environment') { worldGroupEditMode=false; worldGroupMoveMode=false; worldGroupExclusionEditMode=false; worldGroupTemplatePlaceMode=false; }
    puzzleEnvironmentPlacementMode = false;
    puzzleExclusionEditMode = false;
    puzzleExclusionHandle = null;
    selectObject(null);
    selectionTapCycle = null;
    addAssetType = null;
    updatePlacementModeUi();
    if (scope === 'puzzle') {
      if (puzzleWorkshopClear) {
        puzzleBrowserMode = 'library';
        editorPuzzleLibraryGroupId ||= allPuzzleGroups()[0]?.id || null;
        populatePuzzleSelector();
      } else {
        if (puzzleBrowserMode === 'scene' && editorPuzzleMarkerId && !scenePuzzleMarkers().some(marker => marker.id === editorPuzzleMarkerId)) {
          editorPuzzleMarkerId = null;
        }
        populatePuzzleSelector();
      }
    }
    buildAssetPalette();
    updatePuzzlePanel();
    updateEditorButtons();
  }

  function socketLabelForPiece(objOrName) {
    const name = typeof objOrName === 'string' ? objOrName : objOrName?.assetName;
    const label = editorAssetInfo.get(name)?.label || name || 'piece';
    return label.replace(/^STONE PIECE\s+/i, '').replace(/^MOVEABLE\s+/i, '');
  }

  function socketKeyForPiece(obj) {
    if (!obj) return null;
    return obj.puzzleObjectId || obj.assetName || null;
  }

  function socketMatchesPiece(socket, piece) {
    if (!socket || !piece) return false;
    if (socket.pieceObjectId && piece.puzzleObjectId) return socket.pieceObjectId === piece.puzzleObjectId;
    return socket.pieceAsset === piece.assetName;
  }

  function socketWorldPosition(host, socket) {
    if (!host || !socket) return null;
    const storedU = Rig.clamp(Number(socket.u) || 0, 0, 1);
    const visualU = host.flip ? 1 - storedU : storedU;
    const v = Rig.clamp(Number(socket.v) || 0, 0, 1);
    return {
      x: host.x + (visualU - 0.5) * host.sx,
      y: host.y + v * host.sy,
      z: host.z + SOCKET_DEPTH_BIAS
    };
  }

  function socketHostsForInstance(instance) {
    if (!instance) return [];
    return (instance.objects || []).filter(obj => !obj.deleted && objectHasBehaviour(obj, 'socketHost'));
  }

  function socketForPiece(instance, piece) {
    if (!instance || !piece) return null;
    for (const host of socketHostsForInstance(instance)) {
      const socket = socketsForHost(host).find(item => socketMatchesPiece(item, piece));
      if (socket) return { host, socket };
    }
    return null;
  }

  function clearSocketForPiece(instance, piece, { record = true } = {}) {
    if (!instance || !piece) return false;
    let changed = false;
    for (const host of socketHostsForInstance(instance)) {
      const before = (host.sockets || []).length;
      host.sockets = (host.sockets || []).filter(item => !socketMatchesPiece(item, piece));
      if (host.sockets.length !== before) {
        changed = true;
        if (record) recordObjectEdit(host);
      }
    }
    return changed;
  }

  function socketHostAt(clientX, clientY) {
    const candidates = pickSceneObjects(clientX, clientY)
      .filter(obj => editorObjectIsEditable(obj) && objectHasBehaviour(obj, 'socketHost'));
    return candidates[0] || null;
  }

  function placeSocketOnHost(piece, host, clientX, clientY) {
    if (!piece || !host || !piece.puzzleInstanceId || piece.puzzleInstanceId !== host.puzzleInstanceId) return false;
    const bounds = objectScreenBounds(host);
    const rect = canvas.getBoundingClientRect();
    if (!bounds || !rect.width || !rect.height) return false;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const screenU = Rig.clamp((px - bounds.left) / Math.max(1, bounds.width), 0, 1);
    const textureU = host.flip ? 1 - screenU : screenU;
    const v = Rig.clamp((bounds.bottom - py) / Math.max(1, bounds.height), 0, 1);
    const instance = activePuzzleInstances.get(piece.puzzleInstanceId);
    if (!instance) return false;

    clearSocketForPiece(instance, piece, { record:false });
    host.sockets ||= [];
    host.sockets.push({
      id:`socket-${socketKeyForPiece(piece)}`,
      pieceAsset:piece.assetName,
      pieceObjectId:piece.puzzleObjectId || null,
      u:textureU,
      v
    });
    recordObjectEdit(host);
    puzzleStartDirty.add(instance.id);

    // A user-authored puzzle containing sockets is a socket-completion puzzle
    // unless the author has already supplied another completion rule.
    if (!instance.def.completion && groupIsUserCreated(instance.marker.group)) {
      instance.def.completion = { type:'sockets' };
      savePuzzleLibrary();
    }
    return true;
  }

  function startSocketPlacement() {
    if (!selectedObject || !objectHasBehaviour(selectedObject, 'socketPiece') || !selectedObject.puzzleInstanceId) return;
    if (pieceUsesAssetSocket(selectedObject.assetName)) {
      hintEl.textContent = 'This piece uses an asset-level socket. Open Asset Lab and place the socket on the Socket Host asset there.';
      hintEl.classList.remove('hidden');
      return;
    }
    socketPlacementPiece = selectedObject;
    groundLineEditMode = false;
    transformEditMode = false;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    addAssetType = null;
    updatePlacementModeUi();
    updateEditorButtons();
    hintEl.textContent = `SET SOCKET · tap the matching position on a Socket Host for ${socketLabelForPiece(selectedObject)}`;
    hintEl.classList.remove('hidden');
  }

  function cancelSocketPlacement() {
    socketPlacementPiece = null;
    updateEditorButtons();
  }

  function clearSelectedPieceSocket() {
    if (!selectedObject || !selectedObject.puzzleInstanceId) return;
    if (pieceUsesAssetSocket(selectedObject.assetName)) {
      hintEl.textContent = 'This socket is managed in Asset Lab. Delete or move it on the Socket Host asset there.';
      hintEl.classList.remove('hidden');
      return;
    }
    const instance = activePuzzleInstances.get(selectedObject.puzzleInstanceId);
    if (!instance) return;
    if (clearSocketForPiece(instance, selectedObject)) {
      puzzleStartDirty.add(instance.id);
      hintEl.textContent = `Socket cleared for ${socketLabelForPiece(selectedObject)}`;
    } else {
      hintEl.textContent = 'This piece does not have an authored socket yet';
    }
    socketPlacementPiece = null;
    hintEl.classList.remove('hidden');
    updateEditorButtons();
    updatePuzzlePanel();
  }

  function fixedSupportObjectsForSelectedPuzzle() {
    if (!selectedObject?.puzzleInstanceId) return [];
    const instance = activePuzzleInstances.get(selectedObject.puzzleInstanceId);
    if (!instance) return [];
    return instance.objects.filter(obj => obj && !obj.deleted && isSupportSurfaceObject(obj)
      && !objectHasBehaviour(obj, 'carryable') && !objectHasBehaviour(obj, 'stackable'));
  }

  function selectedLockedWorldGroupForEditor(){
    if(!editMode || editorScope!=='environment' || worldGroupEditMode)return null;
    return worldGroupById(selectedWorldGroupId);
  }

  function syncTransformEditor() {
    const group=selectedLockedWorldGroupForEditor();
    const hasObject=!!(selectedObject && !selectedObject.deleted);
    const has=!!(editMode && transformEditMode && (hasObject || group));
    if (transformEditor) transformEditor.hidden = !has;
    if (editorTransformBtn) editorTransformBtn.classList.toggle('active', has);
    if (!has) return;

    const yRow=transformYInput?.closest?.('.sidescroll-transform-axis') || null;

    if(group && !hasObject){
      if(transformModeLabel)transformModeLabel.textContent='GROUP';
      if(transformModeBtn)transformModeBtn.hidden=true;
      if(transformXInput)transformXInput.value=(Number(group.x)||0).toFixed(2);
      if(transformZInput){
        transformZInput.value=(Number(group.z)||pathZ).toFixed(2);
        transformZInput.disabled=false;
      }
      if(yRow)yRow.hidden=true;
      if(transformXMinusBtn)transformXMinusBtn.disabled=false;
      if(transformXPlusBtn)transformXPlusBtn.disabled=false;
      if(transformZMinusBtn)transformZMinusBtn.disabled=false;
      if(transformZPlusBtn)transformZPlusBtn.disabled=false;

      // In group mode this familiar action becomes an emergency/recovery tool:
      // it moves the whole composition back to gameplay depth.
      if(transformFloorWalkBtn){
        transformFloorWalkBtn.hidden=false;
        transformFloorWalkBtn.textContent='Depth = Path';
      }
      if(transformSupportWalkBtn)transformSupportWalkBtn.hidden=true;
      if(transformAlignSupportsBtn)transformAlignSupportsBtn.hidden=true;
      if(transformHelpEl)transformHelpEl.textContent='World Group anchor. X moves along the journey; Z moves scene depth. Members keep their local layout and their individual Ground / Free / Follow Normal behaviour.';
      return;
    }

    if(yRow)yRow.hidden=false;
    if(transformModeBtn)transformModeBtn.hidden=false;
    const free = objectUsesFreePlacement(selectedObject);
    if (transformModeLabel) transformModeLabel.textContent = free ? 'FREE' : 'GROUND';
    if (transformModeBtn) transformModeBtn.textContent = free ? 'Use Ground' : 'Make Free';
    if (transformXInput) transformXInput.value = selectedObject.x.toFixed(2);
    if (transformYInput) transformYInput.value = objectFloorWorldY(selectedObject).toFixed(2);
    if (transformZInput) {
      transformZInput.value = selectedObject.z.toFixed(2);
      transformZInput.disabled = !!(selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked);
    }
    const lockedDepth = !!(selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked);
    if (transformZMinusBtn) transformZMinusBtn.disabled = lockedDepth;
    if (transformZPlusBtn) transformZPlusBtn.disabled = lockedDepth;
    if(transformFloorWalkBtn){
      transformFloorWalkBtn.hidden=false;
      transformFloorWalkBtn.textContent='Floor = walk';
    }
    if (transformSupportWalkBtn) transformSupportWalkBtn.hidden = !isSupportSurfaceObject(selectedObject);
    if (transformAlignSupportsBtn) transformAlignSupportsBtn.hidden = fixedSupportObjectsForSelectedPuzzle().length < 2 || !isSupportSurfaceObject(selectedObject);
    if(transformHelpEl)transformHelpEl.textContent='Free mode holds Y while X/Z move. Y is the asset floor/deck height, not the image pivot.';
  }

  function setTransformEditorOpen(open) {
    const group=selectedLockedWorldGroupForEditor();
    const hasObject=!!(selectedObject && !selectedObject.deleted);
    transformEditMode = !!open && !!(hasObject || group);
    if (transformEditMode) {
      groundLineEditMode = false;
      collisionEditMode = false;
      collisionHandleIndex = -1;
      socketPlacementPiece = null;
      addAssetType = null;
      updatePlacementModeUi();
      hintEl.textContent = group && !hasObject
        ? 'Group Position · X moves along the journey · Z moves scene depth · Depth = Path recovers an off-screen group'
        : 'Position · use one axis at a time. Free mode keeps height independent from the terrain.';
      hintEl.classList.remove('hidden');
    }
    syncGroundLineEditor();
    syncTransformEditor();
    updateEditorButtons();
    updatePuzzlePanel();
  }

  function setSelectedFreePlacement(enabled) {
    if (!selectedObject || selectedObject.deleted) return;
    const floorWorldY = objectFloorWorldY(selectedObject);
    selectedObject.freePlacement = !!enabled;
    if (selectedObject.freePlacement) setObjectFloorWorldY(selectedObject, floorWorldY);
    else setObjectFloorOffset(selectedObject, 0);
    recordObjectEdit(selectedObject);
    syncTransformEditor();
    updatePuzzleObjectList();
    hintEl.textContent = selectedObject.freePlacement
      ? 'Free placement · moving X/Z will no longer change this asset’s height'
      : 'Ground placement · the asset is snapped back onto its terrain anchor';
    hintEl.classList.remove('hidden');
  }

  function moveSelectedTransformAxis(axis, value) {
    if (!Number.isFinite(Number(value))) return;
    const group=selectedLockedWorldGroupForEditor();
    if(group && (!selectedObject || selectedObject.deleted)){
      if(axis!=='x' && axis!=='z')return;
      const next=Number(value);
      const x=axis==='x'?next:(Number(group.x)||0);
      const z=axis==='z'?next:(Number(group.z)||pathZ);
      if(moveWorldGroupTo(group,{x,z})){
        syncTransformEditor();
        renderWorldGroupTools({force:true});
        renderEnvironmentSelectionTools({force:true});
      }
      return;
    }
    if (!selectedObject || selectedObject.deleted) return;
    const obj = selectedObject;
    const next = Number(value);
    const floorOffset = objectFloorOffsetFromTerrain(obj);
    const floorWorldY = objectFloorWorldY(obj);
    if (axis === 'y') {
      obj.freePlacement = true;
      setObjectFloorWorldY(obj, next);
    } else if (axis === 'x') {
      if (obj.category === 'gameplay' && !objectUsesFreePlacement(obj)) {
        placeGameplayObjectInEditor(obj, next, obj.z);
      } else {
        obj.x = next;
        if (objectUsesFreePlacement(obj)) setObjectFloorWorldY(obj, floorWorldY);
        else setObjectFloorOffset(obj, floorOffset);
      }
    } else if (axis === 'z') {
      if (obj.category === 'gameplay' && obj.gameplayLayerLocked) return;
      if (obj.category === 'gameplay' && !objectUsesFreePlacement(obj)) {
        placeGameplayObjectInEditor(obj, obj.x, next);
      } else {
        obj.z = Rig.clamp(next, WORLD.farZ + 0.8, WORLD.nearZ - 0.6);
        if (objectUsesFreePlacement(obj)) setObjectFloorWorldY(obj, floorWorldY);
        else setObjectFloorOffset(obj, floorOffset);
      }
    }
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    recordObjectEdit(obj);
    syncTransformEditor();
    updatePuzzleObjectList();
  }

  function nudgeSelectedTransformAxis(axis, direction) {
    const group=selectedLockedWorldGroupForEditor();
    const step = Math.max(0.005, Number(transformStepInput?.value) || 0.1) * (direction < 0 ? -1 : 1);
    if(group && (!selectedObject || selectedObject.deleted)){
      if(axis!=='x' && axis!=='z')return;
      const current=axis==='x'?(Number(group.x)||0):(Number(group.z)||pathZ);
      moveSelectedTransformAxis(axis,current+step);
      return;
    }
    if (!selectedObject || selectedObject.deleted) return;
    const current = axis === 'x' ? selectedObject.x : (axis === 'z' ? selectedObject.z : objectFloorWorldY(selectedObject));
    moveSelectedTransformAxis(axis, current + step);
  }

  function snapSelectedFloorToWalk() {
    const group=selectedLockedWorldGroupForEditor();
    if(group && (!selectedObject || selectedObject.deleted)){
      if(moveWorldGroupTo(group,{x:Number(group.x)||0,z:pathZ})){
        syncTransformEditor();
        renderWorldGroupTools({force:true});
        renderEnvironmentSelectionTools({force:true});
        hintEl.textContent=`${group.label} moved back to normal path depth`;
        hintEl.classList.remove('hidden');
      }
      return;
    }
    if (!selectedObject || selectedObject.deleted) return;
    selectedObject.freePlacement = true;
    setObjectFloorWorldY(selectedObject, playSurfaceYAt(selectedObject.x));
    recordObjectEdit(selectedObject);
    syncTransformEditor();
    hintEl.textContent = 'Asset floor/deck aligned to the normal walk height';
    hintEl.classList.remove('hidden');
  }

  function snapSelectedSupportTopToWalk() {
    if (!selectedObject || selectedObject.deleted || !isSupportSurfaceObject(selectedObject)) return;
    const top = collisionTopHeightAtX(selectedObject, selectedObject.x);
    if (!Number.isFinite(top)) return;
    selectedObject.freePlacement = true;
    selectedObject.y += playSurfaceYAt(selectedObject.x) - top;
    recordObjectEdit(selectedObject);
    syncTransformEditor();
    hintEl.textContent = 'Support collision top aligned exactly to the normal walk height';
    hintEl.classList.remove('hidden');
  }

  function alignFixedSupportsToSelected() {
    if (!selectedObject || selectedObject.deleted || !isSupportSurfaceObject(selectedObject)) return;
    const supports = fixedSupportObjectsForSelectedPuzzle();
    if (supports.length < 2) return;
    const targetTop = collisionTopHeightAtX(selectedObject, selectedObject.x);
    const targetZ = selectedObject.z;
    if (!Number.isFinite(targetTop)) return;
    for (const obj of supports) {
      obj.freePlacement = true;
      obj.z = targetZ;
      const top = collisionTopHeightAtX(obj, obj.x);
      if (Number.isFinite(top)) obj.y += targetTop - top;
      moveObjectToCorrectCollection(obj);
      recordObjectEdit(obj);
    }
    sortSceneCollections();
    syncTransformEditor();
    updatePuzzleObjectList();
    hintEl.textContent = `Aligned ${supports.length} fixed support surfaces to the selected height and depth`;
    hintEl.classList.remove('hidden');
  }

  function syncGroundLineEditor() {
    const has = !!(editMode && groundLineEditMode && selectedObject && !selectedObject.deleted);
    if (groundLineEditor) groundLineEditor.hidden = !has;
    if (editorGroundLineBtn) editorGroundLineBtn.classList.toggle('active', has);
    if (!has) return;
    const value = objectGroundLine(selectedObject);
    if (groundLineInput) groundLineInput.value = String(value);
    if (groundLineValueEl) groundLineValueEl.textContent = `${Math.round(value * 100)}%`;
  }

  function setGroundLineEditorOpen(open) {
    groundLineEditMode = !!open && !!selectedObject && !selectedObject.deleted;
    if (groundLineEditMode) {
      transformEditMode = false;
      syncTransformEditor();
      collisionEditMode = false;
      collisionHandleIndex = -1;
      socketPlacementPiece = null;
      addAssetType = null;
      updatePlacementModeUi();
      hintEl.textContent = 'Floor Line · move the slider until the cyan line sits on the intended ground / deck height';
      hintEl.classList.remove('hidden');
    }
    syncGroundLineEditor();
    updateEditorButtons();
  }

  function setSelectedGroundLine(value) {
    if (!selectedObject || selectedObject.deleted) return;
    const preservedFloorOffset = objectFloorOffsetFromTerrain(selectedObject);
    const preservedFloorWorldY = objectFloorWorldY(selectedObject);
    selectedObject.groundLine = Rig.clamp(Number(value) || 0, 0, 1);
    if (objectUsesFreePlacement(selectedObject)) setObjectFloorWorldY(selectedObject, preservedFloorWorldY);
    else setObjectFloorOffset(selectedObject, preservedFloorOffset);
    recordObjectEdit(selectedObject);
    syncGroundLineEditor();
    updatePuzzleObjectList();
  }

  function resetSelectedGroundLine() {
    if (!selectedObject || selectedObject.deleted) return;
    setSelectedGroundLine(assetGroundLineDefault(selectedObject.assetName));
    hintEl.textContent = 'Floor Line reset to this asset’s built-in default';
    hintEl.classList.remove('hidden');
  }

  function selectedIsThoughtTrigger(){ return !!selectedObject && !selectedObject.deleted && selectedObject.assetName === 'thought-trigger'; }

  function syncThoughtEditor(){
    const active=!!(editMode && selectedIsThoughtTrigger());
    if(thoughtEditorEl) thoughtEditorEl.hidden=!active;
    if(!active)return;
    if(thoughtTextInput && document.activeElement!==thoughtTextInput) thoughtTextInput.value=selectedObject.thoughtText || '';
    if(thoughtRadiusInput && document.activeElement!==thoughtRadiusInput) thoughtRadiusInput.value=String(Rig.clamp(Number(selectedObject.thoughtRadius)||1.4,.25,8));
    if(thoughtRadiusValue) thoughtRadiusValue.textContent=`${(Number(selectedObject.thoughtRadius)||1.4).toFixed(2)} m`;
    if(thoughtOnceBtn){
      const once=selectedObject.thoughtOnce!==false;
      thoughtOnceBtn.setAttribute('aria-pressed',String(once));
      thoughtOnceBtn.textContent=once?'One shot · ON':'One shot · OFF';
    }
  }

  function commitThoughtText(){
    if(!selectedIsThoughtTrigger() || !thoughtTextInput)return;
    selectedObject.thoughtText=thoughtTextInput.value.trim();
    recordObjectEdit(selectedObject);
    updatePuzzleObjectList();
  }

  function selectedIsCameraTrigger(){ return !!selectedObject && !selectedObject.deleted && selectedObject.assetName === 'camera-trigger'; }

  function syncCameraNodeEditor(){
    const active=!!(editMode && selectedIsCameraTrigger());
    if(cameraNodeEditorEl) cameraNodeEditorEl.hidden=!active;
    if(!active)return;
    const radius=Rig.clamp(Number(selectedObject.cameraNodeRadius)||4,.5,20);
    const ox=Rig.clamp(Number(selectedObject.cameraNodeOffsetX)||0,-8,8);
    const oy=Rig.clamp(Number(selectedObject.cameraNodeOffsetY)||0,-5,5);
    const oz=Rig.clamp(Number(selectedObject.cameraNodeOffsetZ)||0,-8,8);
    const curveStart=cameraNodeCurveSetting(selectedObject.cameraNodeCurveStart);
    const curveEnd=cameraNodeCurveSetting(selectedObject.cameraNodeCurveEnd);
    if(cameraNodeRadiusInput && document.activeElement!==cameraNodeRadiusInput) cameraNodeRadiusInput.value=String(radius);
    if(cameraNodeXInput && document.activeElement!==cameraNodeXInput) cameraNodeXInput.value=String(ox);
    if(cameraNodeYInput && document.activeElement!==cameraNodeYInput) cameraNodeYInput.value=String(oy);
    if(cameraNodeZInput && document.activeElement!==cameraNodeZInput) cameraNodeZInput.value=String(oz);
    if(cameraNodeCurveStartInput && document.activeElement!==cameraNodeCurveStartInput) cameraNodeCurveStartInput.value=String(curveStart);
    if(cameraNodeCurveEndInput && document.activeElement!==cameraNodeCurveEndInput) cameraNodeCurveEndInput.value=String(curveEnd);
    if(cameraNodeRadiusValue) cameraNodeRadiusValue.textContent=`${radius.toFixed(2)} m`;
    if(cameraNodeXValue) cameraNodeXValue.textContent=`${ox>=0?'+':''}${ox.toFixed(1)} m`;
    if(cameraNodeYValue) cameraNodeYValue.textContent=`${oy>=0?'+':''}${oy.toFixed(1)} m`;
    if(cameraNodeZValue) cameraNodeZValue.textContent=`${oz>=0?'+':''}${oz.toFixed(1)} m`;
    if(cameraNodeCurveStartValue) cameraNodeCurveStartValue.textContent=cameraNodeCurveLabel(curveStart);
    if(cameraNodeCurveEndValue) cameraNodeCurveEndValue.textContent=cameraNodeCurveLabel(curveEnd);
  }

  function updateEditorButtons() {
    const has = !!selectedObject && !selectedObject.deleted;
    const selectedGroup=selectedLockedWorldGroupForEditor();
    const hasGroup=!!selectedGroup;
    if (!has && groundLineEditMode) groundLineEditMode = false;
    if (!has && !hasGroup && transformEditMode) transformEditMode = false;
    const collisionFocus = !!(has && collisionEditMode);
    const socketFocus = !!socketPlacementPiece;
    const isGameplay = has && selectedObject.category === 'gameplay';
    const isSocketPiece = !!(has && objectHasBehaviour(selectedObject, 'socketPiece') && selectedObject.puzzleInstanceId);
    const assetManagedSocket = !!(isSocketPiece && pieceUsesAssetSocket(selectedObject.assetName));
    const socketInstance = isSocketPiece ? activePuzzleInstances.get(selectedObject.puzzleInstanceId) : null;
    const hasAuthoredSocket = !!(isSocketPiece && socketForPiece(socketInstance, selectedObject));
    const placing = placementModeActive();
    if (editorControls) editorControls.hidden = !editMode || placing;
    if (openAssetsBtn) {
      const puzzleInstanceReady = editorScope === 'puzzle' && puzzleBrowserMode === 'scene' && !!editorPuzzleMarkerId;
      openAssetsBtn.hidden = !editMode || puzzleTestMode || placing || !puzzleInstanceReady;
      openAssetsBtn.textContent = puzzleEnvironmentPlacementMode ? '＋ Place Dressing' : '＋ Place Puzzle Piece';
      openAssetsBtn.classList.toggle('active', !editorPalette?.hidden && editorScope === 'puzzle');
    }
    if (openEnvironmentAssetsBtn) {
      openEnvironmentAssetsBtn.hidden = !editMode || puzzleTestMode || placing || editorScope !== 'environment';
      openEnvironmentAssetsBtn.classList.toggle('active', !editorPalette?.hidden && editorScope === 'environment');
    }
    if (editorDuplicateBtn) editorDuplicateBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorFlipBtn) {
      editorFlipBtn.hidden = !has || collisionFocus || socketFocus;
      editorFlipBtn.classList.toggle('active', !!(has && objectVisualFlip(selectedObject)));
    }
    if (editorScaleDownBtn) editorScaleDownBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorScaleUpBtn) editorScaleUpBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorGroundLineBtn) {
      editorGroundLineBtn.hidden = !has || collisionFocus || socketFocus;
      editorGroundLineBtn.classList.toggle('active', !!(has && groundLineEditMode));
    }
    if (editorTransformBtn) {
      editorTransformBtn.hidden = !(has || hasGroup) || collisionFocus || socketFocus;
      editorTransformBtn.classList.toggle('active', !!((has || hasGroup) && transformEditMode));
    }
    if (editorGameLayerBtn) {
      editorGameLayerBtn.hidden = !isGameplay || collisionFocus || socketFocus;
      editorGameLayerBtn.classList.toggle('active', !!(isGameplay && selectedObject.gameplayLayerLocked));
    }
    if (editorCollisionBtn) {
      editorCollisionBtn.hidden = !has || socketFocus;
      editorCollisionBtn.classList.toggle('active', !!(selectedObject?.collision && collisionEditMode));
    }
    if (editorCollisionShapeBtn) {
      editorCollisionShapeBtn.hidden = !has || !selectedObject?.collision || !collisionEditMode || socketFocus;
      editorCollisionShapeBtn.classList.toggle('active', !!(selectedObject?.collision && collisionEditMode));
    }
    if (editorCollisionAddShapeBtn) editorCollisionAddShapeBtn.hidden = !has || !selectedObject?.collision || !collisionEditMode || socketFocus;
    if (editorCollisionRemoveShapeBtn) editorCollisionRemoveShapeBtn.hidden = !has || !selectedObject?.collision || !collisionEditMode || socketFocus;
    if (editorCollisionRemoveBtn) editorCollisionRemoveBtn.hidden = !has || !selectedObject?.collision || socketFocus;
    if (editorCollisionSaveAssetBtn) editorCollisionSaveAssetBtn.hidden = !has || !selectedObject?.collision || socketFocus;
    if (editorCollisionUseAssetBtn) editorCollisionUseAssetBtn.hidden = !has || !selectedObject?.collisionOverride || socketFocus;
    if (quickNavBtn) quickNavBtn.hidden = !editMode;
    if (editorSocketBtn) {
      editorSocketBtn.hidden = !isSocketPiece || collisionFocus || assetManagedSocket;
      editorSocketBtn.classList.toggle('active', socketPlacementPiece === selectedObject);
      const label = editorSocketBtn.querySelector('small');
      if (label) label.textContent = hasAuthoredSocket ? 'MOVE SOCKET' : 'SET SOCKET';
    }
    if (editorSocketClearBtn) editorSocketClearBtn.hidden = !isSocketPiece || assetManagedSocket || !hasAuthoredSocket || collisionFocus || socketFocus;
    if (editorDeleteBtn) {
      editorDeleteBtn.hidden = !(has || hasGroup) || collisionFocus || socketFocus;
      const label=editorDeleteBtn.querySelector('small');
      if(label)label.textContent=hasGroup&&!has?'DELETE GROUP':'DELETE';
    }
    updateCollisionShapeControls();
    syncGroundLineEditor();
    syncTransformEditor();
    syncThoughtEditor();
    syncCameraNodeEditor();
    syncFocusedObjectEditorWorkspace();
  }

  // Thought / Camera nodes are drill-in editors. Keep only one authoring panel
  // on screen at a time on phone-sized landscape views: when one of these
  // focused editors is active, the main Environment/Puzzle panel is hidden by
  // CSS and the focused editor occupies the same left-hand workspace. Closing
  // the focused editor clears the selection and the parent panel returns.
  function syncFocusedObjectEditorWorkspace(){
    const focused = !!(editMode && (selectedIsThoughtTrigger() || selectedIsCameraTrigger()));
    document.body.classList.toggle('sidescroll-focused-object-editor', focused);
    if(thoughtEditorEl) thoughtEditorEl.classList.toggle('sidescroll-workspace-replacement', focused && selectedIsThoughtTrigger());
    if(cameraNodeEditorEl) cameraNodeEditorEl.classList.toggle('sidescroll-workspace-replacement', focused && selectedIsCameraTrigger());
  }

  function selectObject(obj, preserveCycle = false, options = {}) {
    if (socketPlacementPiece && obj !== socketPlacementPiece) socketPlacementPiece = null;
    selectedObject = obj && !obj.deleted ? obj : null;
    if (!selectedObject) transformEditMode = false;
    if (!preserveCycle) { selectionCycleInfo = null; selectionTapCycle = null; }
    if (!options.keepPlacement) addAssetType = null;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    selectedCollisionShape = 0;
    updatePlacementModeUi();
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updateEditorButtons();
    if (editMode && editorScope === 'environment') renderEnvironmentSelectionTools();
  }


  function authoringPuzzle() {
    if (puzzleTestMarkerId) {
      const pinned = activePuzzleInstances.get(puzzleTestMarkerId);
      if (pinned) return pinned;
    }
    if (editMode && editorScope === 'puzzle' && puzzleBrowserMode === 'scene' && editorPuzzleMarkerId) return selectedPuzzleInstance();
    return null;
  }

  function updatePuzzlePanel() {
    if (!puzzlePanel) return;
    const visible = (editMode || puzzleTestMode) && !transformEditMode;
    puzzlePanel.hidden = !visible;
    document.body.classList.toggle('sidescroll-puzzle-testing', puzzleTestMode);
    if (!visible) return;

    const testing = puzzleTestMode;
    const puzzleEditing = testing || editorScope === 'puzzle';
    const libraryMode = !testing && puzzleEditing && puzzleBrowserMode === 'library';
    const sceneMode = !testing && puzzleEditing && puzzleBrowserMode === 'scene';
    const selectedMarker = (sceneMode || testing) ? selectedPuzzleMarker() : null;
    const instance = testing && selectedMarker
      ? authoringPuzzle()
      : (sceneMode && selectedMarker ? (activePuzzleInstances.get(selectedMarker.id) || null) : null);
    const selectedGroupId = libraryMode ? selectedLibraryGroupId() : selectedMarker?.group;
    const selectedDef = libraryMode ? groupDefinition(selectedGroupId) : markerDefinition(selectedMarker);
    const linkMode = selectedMarker ? markerLinkMode(selectedMarker) : null;

    if (editorScopeSwitch) editorScopeSwitch.hidden = testing;
    environmentScopeBtn?.classList.toggle('active', !testing && editorScope === 'environment');
    puzzleScopeBtn?.classList.toggle('active', testing || editorScope === 'puzzle');
    if (puzzleSourceSwitch) puzzleSourceSwitch.hidden = testing || editorScope !== 'puzzle';
    puzzleSourceLibraryBtn?.classList.toggle('active', !testing && libraryMode);
    puzzleSourceSceneBtn?.classList.toggle('active', !testing && sceneMode);

    if (environmentSelectionEl) environmentSelectionEl.hidden = testing || editorScope !== 'environment';
    if (!testing && editorScope === 'environment') renderEnvironmentSelectionTools();
    if (puzzleLibraryView) puzzleLibraryView.hidden = testing || !libraryMode;
    if (puzzleSceneView) puzzleSceneView.hidden = testing || !sceneMode;
    if (puzzleStageSection) puzzleStageSection.hidden = testing || editorScope !== 'puzzle';
    if (puzzleSelectionEl) puzzleSelectionEl.hidden = !testing && (!puzzleEditing || (sceneMode && !selectedMarker));
    if (puzzlePicker) puzzlePicker.hidden = !libraryMode;
    if (puzzleMarkerEditor) puzzleMarkerEditor.hidden = testing || !sceneMode || !selectedMarker;
    if (puzzleEditLayerSwitch) puzzleEditLayerSwitch.hidden = testing || libraryMode || !instance;
    puzzlePiecesLayerBtn?.classList.toggle('active', !puzzleEnvironmentPlacementMode);
    puzzleDressingLayerBtn?.classList.toggle('active', !!puzzleEnvironmentPlacementMode);
    if (puzzleMarkerXInput && sceneMode && selectedMarker && document.activeElement !== puzzleMarkerXInput) {
      puzzleMarkerXInput.value = Number(selectedMarker.x).toFixed(1);
    }

    if (!testing && editorScope === 'puzzle') populatePuzzleSelector();

    if (!puzzleEditing) {
      if (puzzleManageEl) puzzleManageEl.hidden = true;
      if (puzzleActionsEl) puzzleActionsEl.hidden = true;
      if (puzzleObjectsEl) puzzleObjectsEl.hidden = true;
      updateEditorButtons();
      return;
    }

    if (puzzleModeEl) puzzleModeEl.textContent = testing ? 'TEST' : (libraryMode ? 'TEMPLATE' : (linkMode === 'copy' ? 'COPY' : 'INSTANCE'));
    if (puzzleNameEl) puzzleNameEl.textContent = instance?.def?.label || selectedDef?.label || 'No puzzle selected';

    if (puzzleStateEl) {
      if (libraryMode) {
        const source = groupIsUserCreated(selectedGroupId) ? 'Local reusable template.' : 'Built-in reusable template.';
        const linkedCount = scenePuzzleMarkers().filter(marker => marker.group === selectedGroupId && markerLinkMode(marker) === 'instance').length;
        puzzleStateEl.textContent = `${source} ${linkedCount} linked scene instance${linkedCount === 1 ? '' : 's'}.`;
      } else if (testing && instance) {
        puzzleStateEl.textContent = instance.solved
          ? 'Puzzle complete. Reset to run it again, or return to Setup.'
          : 'Testing the current setup. Test moves do not change the saved puzzle.';
      } else if (selectedMarker) {
        const relationship = linkMode === 'copy'
          ? 'COPY · unique to this scene.'
          : `INSTANCE · linked to ${selectedDef?.label || selectedMarker.group}.`;
        if (instance) {
          const b = currentPuzzleBoundsRelative(instance.marker);
          const width = (b.maxX - b.minX).toFixed(1);
          const dirty = puzzleStartDirty.has(instance.id) ? 'Unsaved setup changes. ' : '';
          puzzleStateEl.textContent = `${dirty}${relationship} Marker x ${Number(selectedMarker.x).toFixed(1)} · bounds ${width}m · EDITING.`;
        } else {
          puzzleStateEl.textContent = `${relationship} Marker x ${Number(selectedMarker.x).toFixed(1)} · selected in scene.`;
        }
      }
    }

    if (puzzleHelpEl) {
      puzzleHelpEl.textContent = testing
        ? 'Reset restarts this test setup. Back to Setup returns to the same editable setup you tested.'
        : (libraryMode
            ? 'Choose a template from the Library. Spawn Here places a linked instance at the current camera position.'
            : (selectedMarker
                ? (instance
                    ? (puzzleEnvironmentPlacementMode
                        ? 'Dressing mode · tap existing puzzle dressing to select/move it, or use Place Dressing to add more.'
                        : 'Puzzle Pieces mode · tap puzzle props to select/move them, or use Place Puzzle Piece to add more.')
                    : 'Selected from the Scene list. Use Edit Puzzle to activate its bounds and objects, or Focus to move the camera to it.')
                : 'Choose a puzzle from the Scene list to see its controls.'));
      if (!testing && instance && puzzleCartPathEditMode) puzzleHelpEl.textContent = 'Cart Path · drag MOVE PATH/the spline to move the route, or drag START / CURVE / LAND. Bottom-edge handles lift above the iPhone gesture strip. The translucent cart previews the final pose.';
    }

    const selectionAvailable = libraryMode ? !!selectedGroupId : !!selectedMarker;
    if (puzzleManageEl) puzzleManageEl.hidden = testing || !selectionAvailable;
    if (puzzleSpawnBtn) { puzzleSpawnBtn.hidden = !libraryMode; puzzleSpawnBtn.disabled = !selectedGroupId; }
    if (puzzleCreateBtn) puzzleCreateBtn.hidden = !libraryMode;
    if (puzzleEditBtn) { puzzleEditBtn.hidden = libraryMode || testing; puzzleEditBtn.disabled = !selectedMarker; }
    if (puzzleFocusBtn) { puzzleFocusBtn.hidden = libraryMode; puzzleFocusBtn.disabled = !selectedMarker; }
    if (puzzleExportBtn) { puzzleExportBtn.hidden = false; puzzleExportBtn.disabled = !selectionAvailable; }
    if (puzzleDeleteTemplateBtn) {
      puzzleDeleteTemplateBtn.hidden = !libraryMode || !groupIsUserCreated(selectedGroupId);
      puzzleDeleteTemplateBtn.disabled = !selectedGroupId || !groupIsUserCreated(selectedGroupId);
    }
    if (puzzleRemoveBtn) {
      puzzleRemoveBtn.hidden = libraryMode || !selectedMarker || !markerIsUserCreated(selectedMarker);
      puzzleRemoveBtn.disabled = !selectedMarker || !markerIsUserCreated(selectedMarker);
    }

    if (puzzleClearStageBtn) puzzleClearStageBtn.classList.toggle('active', puzzleWorkshopClear);
    if (puzzleRestoreStageBtn) puzzleRestoreStageBtn.hidden = !puzzleWorkshopIsolated;

    if (puzzleActionsEl) puzzleActionsEl.hidden = libraryMode || (!instance && !testing);
    if (puzzleSetStartBtn) {
      puzzleSetStartBtn.hidden = testing || libraryMode;
      puzzleSetStartBtn.disabled = !instance;
      puzzleSetStartBtn.textContent = 'Set Start';
    }
    if (puzzleExclusionEditBtn) {
      puzzleExclusionEditBtn.hidden = testing || libraryMode;
      puzzleExclusionEditBtn.disabled = !instance;
      puzzleExclusionEditBtn.classList.toggle('active', !!(instance && puzzleExclusionEditMode));
      puzzleExclusionEditBtn.textContent = puzzleExclusionEditMode ? 'Finish Exclusion' : 'Edit Exclusion';
    }
    if (puzzleExclusionToggleBtn) {
      const ex = instance ? currentPuzzleExclusion(instance.marker) : null;
      puzzleExclusionToggleBtn.hidden = testing || libraryMode;
      puzzleExclusionToggleBtn.disabled = !instance;
      puzzleExclusionToggleBtn.classList.toggle('active', !!ex?.enabled);
      puzzleExclusionToggleBtn.textContent = ex?.enabled ? 'Disable Exclusion' : 'Add Exclusion';
    }
    if (puzzleRespawnEditBtn) {
      puzzleRespawnEditBtn.hidden = testing || libraryMode;
      puzzleRespawnEditBtn.disabled = !instance;
      puzzleRespawnEditBtn.classList.toggle('active', !!(instance && puzzleRespawnEditMode));
      puzzleRespawnEditBtn.textContent = puzzleRespawnEditMode ? 'Finish Respawn' : 'Respawn Setup';
    }
    if (puzzleRespawnTools) puzzleRespawnTools.hidden = testing || libraryMode || !instance || !puzzleRespawnEditMode;
    if (instance && puzzleRespawnEditMode) {
      const respawn = currentPuzzleRespawn(instance.marker);
      if (puzzleRespawnToggleBtn) { puzzleRespawnToggleBtn.textContent = respawn.enabled ? 'Respawn ON' : 'Respawn OFF'; puzzleRespawnToggleBtn.classList.toggle('active', respawn.enabled); }
      if (puzzleRespawnTriggerValue) puzzleRespawnTriggerValue.textContent = `${respawn.triggerOffsetY.toFixed(2)} m`;
    }
    const hasCart = !!cartObjectForInstance(instance);
    if (puzzleCartPathEditBtn) {
      puzzleCartPathEditBtn.hidden = testing || libraryMode;
      puzzleCartPathEditBtn.disabled = !instance || !hasCart;
      puzzleCartPathEditBtn.classList.toggle('active', !!(instance && puzzleCartPathEditMode));
      puzzleCartPathEditBtn.textContent = puzzleCartPathEditMode ? 'Finish Cart Path' : 'Cart Path';
    }
    if (puzzleCartPathTools) puzzleCartPathTools.hidden = testing || libraryMode || !instance || !puzzleCartPathEditMode;
    if (instance && puzzleCartPathEditMode) {
      const cartPath = currentPuzzleCartPath(instance.marker);
      if (puzzleCartPathToggleBtn) { puzzleCartPathToggleBtn.textContent = cartPath.enabled ? 'Path ON' : 'Path OFF'; puzzleCartPathToggleBtn.classList.toggle('active', cartPath.enabled); }
      if (puzzleCartPathDurationValue) puzzleCartPathDurationValue.textContent = `${Number(cartPath.duration).toFixed(2)} s`;
      if (puzzleCartPathAngleValue) puzzleCartPathAngleValue.textContent = `${Math.round(cartPath.finalRotationDeg)}°`;
      if (puzzleCartPathSpeedStartValue) puzzleCartPathSpeedStartValue.textContent = `${Number(cartPath.speedStart).toFixed(2)}×`;
      if (puzzleCartPathSpeedMidValue) puzzleCartPathSpeedMidValue.textContent = `${Number(cartPath.speedMid).toFixed(2)}×`;
      if (puzzleCartPathSpeedEndValue) puzzleCartPathSpeedEndValue.textContent = `${Number(cartPath.speedEnd).toFixed(2)}×`;
      if (puzzleCartPathScrub && document.activeElement !== puzzleCartPathScrub) puzzleCartPathScrub.value = String(Math.round(Rig.clamp(puzzleCartPathPreviewT,0,1)*1000));
      if (puzzleCartPathPreviewTime) puzzleCartPathPreviewTime.textContent = `${(Rig.clamp(puzzleCartPathPreviewT,0,1)*Number(cartPath.duration)).toFixed(2)} / ${Number(cartPath.duration).toFixed(2)} s`;
      if (puzzleCartPathPreviewBtn) {
        puzzleCartPathPreviewBtn.textContent = puzzleCartPathPreviewPlaying ? 'Pause Ghost' : (puzzleCartPathPreviewT >= 0.999 ? 'Replay Ghost' : 'Play Ghost');
        puzzleCartPathPreviewBtn.classList.toggle('active', puzzleCartPathPreviewPlaying);
      }
    }
    if (puzzleSaveUniqueBtn) {
      puzzleSaveUniqueBtn.hidden = testing || libraryMode || !instance || linkMode === 'copy';
      puzzleSaveUniqueBtn.disabled = !instance || !markerIsUserCreated(selectedMarker);
      puzzleSaveUniqueBtn.title = markerIsUserCreated(selectedMarker) ? '' : 'Spawn a Library instance first';
    }
    if (puzzleTestBtn) { puzzleTestBtn.hidden = testing || libraryMode; puzzleTestBtn.disabled = !selectedMarker; }
    if (puzzleResetBtn) { puzzleResetBtn.hidden = libraryMode; puzzleResetBtn.disabled = !instance; }
    if (puzzleBackSetupBtn) { puzzleBackSetupBtn.hidden = !testing; puzzleBackSetupBtn.disabled = !instance; }

    if (PUZZLE_LAB_MODE) {
      // Puzzle Lab already chose the reusable project and owns the disposable
      // stage, so hide normal scene/library stage-management controls that would
      // only make the sandbox feel like the main-world puzzle editor.
      if (puzzleSourceSwitch) puzzleSourceSwitch.hidden = true;
      if (puzzleClearStageBtn) puzzleClearStageBtn.hidden = true;
      if (puzzleRestoreStageBtn) puzzleRestoreStageBtn.hidden = true;
      if (puzzleSpawnBtn) puzzleSpawnBtn.hidden = true;
      if (puzzleCreateBtn) puzzleCreateBtn.hidden = true;
      if (puzzleRemoveBtn) puzzleRemoveBtn.hidden = true;
      if (puzzleDeleteTemplateBtn) puzzleDeleteTemplateBtn.hidden = true;
      if (puzzleModeEl && !testing) puzzleModeEl.textContent = 'LAB SETUP';
      if (puzzleStateEl && !testing && selectedMarker) {
        const b = instance ? currentPuzzleBoundsRelative(instance.marker) : codeBoundsForMarker(selectedMarker);
        puzzleStateEl.textContent = `Puzzle Lab isolated instance · marker x ${Number(selectedMarker.x).toFixed(1)} · bounds ${(b.maxX-b.minX).toFixed(1)}m.`;
      }
    }

    updatePuzzleObjectList();
    updateEditorButtons();
  }


  function authoredSnapshotFromInstance(instance) {
    const setup = currentPuzzleSetupSnapshot(instance);
    // Cart path is authored puzzle data just like respawn/bounds. Omitting it
    // meant Set Start saved every other setup field but Reset rebuilt the rail
    // from defaults, which looked like the whole path had jumped several metres.
    return { source:'authored', savedAt:Date.now(), bounds:{...setup.bounds}, objects:deepCopy(setup.objects), respawn:deepCopy(setup.respawn), cartPath:deepCopy(setup.cartPath), worldModifiers:deepCopy(setup.worldModifiers || []) };
  }

  function savePuzzleTemplateFromCurrent() {
    const instance = authoringPuzzle();
    if (!instance || puzzleTestMode) return;
    settleGameplayCrates();
    const marker = instance.marker;
    const snapshot = authoredSnapshotFromInstance(instance);
    if (markerLinkMode(marker) === 'copy') {
      puzzleStartState[marker.id] = snapshot;
      savePuzzleStarts();
      puzzleStartDirty.delete(marker.id);
      applyPuzzleSnapshot(instance, snapshot, { persistRuntime:true, clearDirty:true });
      hintEl.textContent = 'Start state set for this unique scene copy';
    } else {
      userPuzzleLibrary.templates ||= {};
      userPuzzleLibrary.templates[marker.group] = snapshot;
      savePuzzleLibrary();
      for (const otherMarker of allPuzzleMarkers()) {
        if (otherMarker.group !== marker.group || markerLinkMode(otherMarker) !== 'instance') continue;
        delete puzzleStartState[otherMarker.id];
        delete puzzleSavedState[otherMarker.id];
        delete puzzleDraftBounds[otherMarker.id];
        puzzleStartDirty.delete(otherMarker.id);
        const active = activePuzzleInstances.get(otherMarker.id);
        if (active) applyPuzzleSnapshot(active, snapshot, { persistRuntime:true, clearDirty:true });
      }
      savePuzzleStarts();
      savePuzzleState();
      hintEl.textContent = 'Start state set · linked instances now use this setup';
    }
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function savePuzzleUniqueFromCurrent() {
    const instance = authoringPuzzle();
    if (!instance || puzzleTestMode) return;
    const marker = instance.marker;
    if (!markerIsUserCreated(marker)) {
      hintEl.textContent = 'Spawn a Library instance first, then Save Unique to detach it';
      hintEl.classList.remove('hidden');
      return;
    }
    settleGameplayCrates();
    const snapshot = authoredSnapshotFromInstance(instance);
    marker.linkMode = 'copy';
    puzzleStartState[marker.id] = snapshot;
    puzzleStartDirty.delete(marker.id);
    savePuzzleStarts();
    savePuzzleLibrary();
    applyPuzzleSnapshot(instance, snapshot, { persistRuntime:true, clearDirty:true });
    populatePuzzleSelector();
    hintEl.textContent = 'Saved as a unique scene copy · future template changes will not affect it';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function resetPuzzleReward(instance) {
    if (!instance) return;
    const state = savedPuzzleFor(instance.id);
    const reward = state.reward ? { ...state.reward } : null;
    const hadCollectedReward = !!reward?.collected;

    if (!removePuzzleRewardFromInventory(instance, { allowLegacyFallback: hadCollectedReward })) {
      // If an old saved puzzle lost its reward metadata but the matching
      // pre-provenance item is still in inventory, an explicit puzzle reset
      // should still clean up that one legacy reward.
      removePuzzleRewardFromInventory(instance, { allowLegacyFallback: true });
    }

    removePuzzleRewardObject(instance);
    delete state.reward;
  }

  function removePuzzleOwnedInventoryItems(instance) {
    if (!instance?.id) return;
    const owned = [];
    for (const [itemId, item] of Object.entries(inventoryState.items || {})) {
      const count = Math.max(0, Number(item?.sources?.[instance.id]) || 0);
      if (count > 0) owned.push([itemId, count]);
    }
    for (const [itemId, count] of owned) removeInventoryItem(itemId, count, instance.id);
  }

  function resetCurrentPuzzle() {
    const instance = authoringPuzzle();
    if (!instance) return;
    if (puzzleTestMode && puzzleTestSnapshot) {
      resetPuzzleReward(instance);
      applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:false, clearDirty:false });
      if (puzzleTestInventorySnapshot) restoreInventory(puzzleTestInventorySnapshot);
      // Reset means this puzzle's reward is unavailable again, even if an
      // older test snapshot already contained a legacy copy of the same item.
      removePuzzleRewardFromInventory(instance, { allowLegacyFallback:true });
      setInventoryOpen(false);
      positionPlayerAtPuzzleEntry(instance);
      shownPuzzleThoughts.clear(); thoughtTriggerInside.clear();
      wheelCombinePrimed.clear();
      hintEl.classList.remove('puzzle-thought');
      hintEl.textContent = 'Test reset to the setup you started this test with · reward removed';
    } else {
      resetPuzzleReward(instance);
      // Small puzzle items such as the axle pin belong to the puzzle too. If
      // the player collected one but has not yet consumed it, Reset should not
      // duplicate it by restoring the world pickup while leaving the inventory
      // copy behind.
      removePuzzleOwnedInventoryItems(instance);
      applyPuzzleStart(instance, { persistRuntime:true });
      setInventoryOpen(false);
      positionPlayerAtPuzzleEntry(instance);
      shownPuzzleThoughts.clear(); thoughtTriggerInside.clear();
      wheelCombinePrimed.clear();
      hintEl.classList.remove('puzzle-thought');
      hintEl.textContent = 'Puzzle reset to its saved start · completion reward reset too';
    }
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function beginPuzzleTest() {
    if (puzzleTestMode) return;
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    instantiatePuzzleGroup(marker);
    const instance = activePuzzleInstances.get(marker.id) || authoringPuzzle();
    if (!instance) return;
    // Test exactly what is on screen now, including unsaved collision and layout
    // edits. Set Start is still the explicit action that makes those edits the
    // permanent authored default.
    settleGameplayCrates();
    puzzleTestSnapshot = deepCopy(currentPuzzleSetupSnapshot(instance));
    puzzleTestInventorySnapshot = inventorySnapshot();
    applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:false, clearDirty:false });
    puzzleTestMarkerId = instance.id;
    puzzleTestMode = true;
    setEditMode(false);
    positionPlayerAtPuzzleEntry(instance);
    hintEl.textContent = 'Puzzle test · using the current setup · Reset restarts this test';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function backToPuzzleSetup() {
    const instance = authoringPuzzle();
    const returnMarkerId = puzzleTestMarkerId || instance?.id || null;
    puzzleTestMode = false;
    if (puzzleTestInventorySnapshot) restoreInventory(puzzleTestInventorySnapshot);
    puzzleTestInventorySnapshot = null;
    setInventoryOpen(false);
    if (instance && puzzleTestSnapshot) {
      applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:true, clearDirty:false });
      camera.x = instance.marker.x - character.screenOffsetX;
      previousCameraX = camera.x;
      character.x = camera.x + character.screenOffsetX;
      character.y = playSurfaceYAt(character.x);
    }
    puzzleTestSnapshot = null;
    puzzleTestMarkerId = null;
    setEditMode(true);
    editorScope = 'puzzle';
    choosePuzzleForEditing(returnMarkerId, false);
    updatePuzzlePanel();
  }

  function setEditMode(on) {
    if (PLAYER_MODE && on) return;
    if (on) setInventoryOpen(false);
    if (on && !editorPuzzlePackPinned) { ensurePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = true; }
    if (!on && editorPuzzlePackPinned) { releasePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = false; }
    if (on && interactionState) {
      if (interactionState.type === 'pickup') interactionState.object.carried = false;
      else completeDrop();
      interactionState = null;
    }
    if (on && carriedObject) dropCarriedImmediate();
    if (!on) { collisionEditMode = false; collisionHandleIndex = -1; groundLineEditMode = false; transformEditMode = false; socketPlacementPiece = null; puzzleCartPathEditMode=false; puzzleCartPathHandle=null; puzzleCartPathPreviewPlaying=false; worldGroupEditMode=false; worldGroupMoveMode=false; worldGroupExclusionEditMode=false; worldGroupTemplatePlaceMode=false; setQuickNavOpen(false); }
    editMode = !!on;
    if (!editMode && !puzzleTestMode && puzzleWorkshopIsolated) savePuzzleWorkshopState(editorPuzzleMarkerId);
    if (editMode && !puzzleTestMode && !editorPuzzleMarkerId) editorScope = 'environment';
    document.body.classList.toggle('sidescroll-editing', editMode);
    if (editBtn) {
      editBtn.setAttribute('aria-pressed', String(editMode));
      editBtn.textContent = puzzleTestMode ? 'Setup' : 'Edit';
    }
    if (playControls) playControls.hidden = editMode;
    if (secondaryControls) secondaryControls.hidden = editMode;
    if (editorControls) editorControls.hidden = true;
    if (!editMode) {
      selectedObject = null;
      selectionCycleInfo = null;
      editorTapState = null;
      addAssetType = null;
      updatePlacementModeUi();
      setAssetPaletteOpen(false);
      setDriveAxis(0);
      // If a crate has just been positioned underneath the character, enter
      // Play mode standing on its top rather than intersecting it.
      const support = platformUnder(camera.x + character.screenOffsetX + colliderWorld().offsetX, Infinity);
      if (support) { jumpOffset = support.offset; standingOnObject = support.obj; }
      else if (!jumping) {
        jumpOffset = character.y - playSurfaceYAt(character.x);
        standingOnObject = null;
        jumping = true;
        jumpTime = 0;
        jumpVelocity = 0;
        jumpCameraBaseY = character.y;
      }
    } else {
      setDriveAxis(0);
      jumping = false;
      jumpTime = 0;
      jumpVelocity = 0;
      jumpOffset = 0;
      standingOnObject = null;
      character.x = camera.x + character.screenOffsetX;
      character.y = playSurfaceYAt(character.x);
      hintEl.classList.remove('hidden');
    }
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
    updatePuzzlePanel();
  }

  function defaultAssetHeight(name, stateName = null) {
    const stateHeight=Number(assetStateProfile(name,stateName)?.layout?.defaultHeight);
    if(Number.isFinite(stateHeight)) return Rig.clamp(stateHeight,0.25,12);
    const settingsName = name === 'cart-wheel-ready' ? 'cart-wheel-loose' : name;
    const authoredHeight = Number(assetLayoutDefaults?.[settingsName]?.defaultHeight);
    if (Number.isFinite(authoredHeight)) return Rig.clamp(authoredHeight, 0.25, 12);
    const info = editorAssetInfo.get(settingsName) || editorAssetInfo.get(name);
    if (Number.isFinite(info?.defaultHeight)) return info.defaultHeight;
    if (name === 'crate') return 0.88;
    if (name.startsWith('tree')) return 8.2;
    if (name === 'ground09' || name === 'ground04' || name === 'ground07') return 0.88;
    return 0.82;
  }

  function createUserObject(type, point, { selectAfter = true } = {}) {
    const h = defaultAssetHeight(type);
    const w = h * (assetAspect[type] || 1);
    const info = editorAssetInfo.get(type) || { category:'dressing', gameplayType:null };
    const puzzleInstance = editMode && editorScope === 'puzzle' ? selectedPuzzleInstance() : null;
    const puzzleObjectId = puzzleInstance ? `authored-${Date.now().toString(36)}-${++userSceneCounter}` : null;
    const id = puzzleInstance ? `puzzle-${puzzleInstance.id}-${puzzleObjectId}` : `user-${Date.now().toString(36)}-${++userSceneCounter}`;
    const collection = info.category === 'gameplay' ? frontOccluders : targetCollectionForZ(point.z);
    const behaviour = assetBehaviours(type);
    const gameplayCollision = info.collision
      ? cloneCollision(info.collision)
      : behaviourCollisionFor(type, w, h, null);
    if (gameplayCollision && behaviour.stackable) gameplayCollision.height = STACK_ITEM_HEIGHT;
    const defaultGameLayerLocked = typeof info.gameplayLayerLocked === 'boolean' ? info.gameplayLayerLocked : info.category === 'gameplay';
    const placementZ = info.category === 'gameplay' && defaultGameLayerLocked ? pathZ : point.z;
    const groundLine = assetGroundLineDefault(type);
    const freePlacement = defaultFreePlacement(type);
    const placementBaseY = freePlacement || behaviour.supportSurface
      ? playSurfaceYAt(point.x)
      : terrainAnchorBaseY(point.x, point.z, info.category, defaultGameLayerLocked, type);
    const obj = addObject(collection, type, point.x, placementZ, w, h, {
      id, userAdded:!puzzleInstance, baseSx:w, baseSy:h,
      y:placementBaseY + (Number(info.defaultYOffset) || 0) - groundLine * h,
      groundLine,
      shade:1, opacity:.99, layer:classifyLayer(placementZ),
      category:info.category || 'dressing', gameplayType:info.gameplayType || null,
      collision:gameplayCollision, gameplayLayerLocked:defaultGameLayerLocked, freePlacement,
      worldGroupId:(!puzzleInstance && worldGroupEditMode && worldGroupById(selectedWorldGroupId)) ? selectedWorldGroupId : null,
      wrap:false, puzzleInstanceId:puzzleInstance?.id || null, puzzleObjectId,
      thoughtText: info.defaultThoughtText || '', thoughtRadius: info.defaultThoughtRadius || 1.4, thoughtOnce: info.defaultThoughtOnce !== false,
      cameraNodeRadius: info.defaultCameraRadius || 4.0, cameraNodeOffsetX: info.defaultCameraOffsetX || 0,
      cameraNodeOffsetY: info.defaultCameraOffsetY || 0, cameraNodeOffsetZ: info.defaultCameraOffsetZ || 0,
      cameraNodeCurveStart: cameraNodeCurveSetting(info.defaultCameraCurveStart), cameraNodeCurveEnd: cameraNodeCurveSetting(info.defaultCameraCurveEnd)
    });
    if (puzzleInstance) puzzleInstance.objects.push(obj);
    else if (obj.worldGroupId) {
      const group=worldGroupById(obj.worldGroupId);
      if(group && worldGroupMembers(group.id).length===1){ group.x=obj.x; group.z=obj.z; saveSceneData(); }
    }
    if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, obj.x, obj.z);
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    recordObjectEdit(obj);
    if (selectAfter) selectObject(obj);
    return obj;
  }

  function duplicateSelected() {
    if (!selectedObject || selectedObject.deleted) return;
    const point = { x:selectedObject.x + 0.85, z:selectedObject.gameplayLayerLocked ? pathZ : selectedObject.z + 0.18 };
    const puzzleInstance = selectedObject.puzzleInstanceId ? activePuzzleInstances.get(selectedObject.puzzleInstanceId) : null;
    const puzzleObjectId = puzzleInstance ? `authored-${Date.now().toString(36)}-${++userSceneCounter}` : null;
    const id = puzzleInstance ? `puzzle-${puzzleInstance.id}-${puzzleObjectId}` : `user-${Date.now().toString(36)}-${++userSceneCounter}`;
    const collection = selectedObject.category === 'gameplay' ? frontOccluders : targetCollectionForZ(point.z);
    const sourceFloorOffset = objectFloorOffsetFromTerrain(selectedObject);
    const sourceFloorWorldY = objectFloorWorldY(selectedObject);
    const sourceGroundLine = objectGroundLine(selectedObject);
    const duplicateY = objectUsesFreePlacement(selectedObject)
      ? sourceFloorWorldY - sourceGroundLine * selectedObject.sy
      : terrainAnchorBaseY(point.x, point.z, selectedObject.category, selectedObject.gameplayLayerLocked, selectedObject.assetName) + sourceFloorOffset - sourceGroundLine * selectedObject.sy;
    const obj = addObject(collection, selectedObject.assetName, point.x, point.z, selectedObject.sx, selectedObject.sy, {
      id, userAdded:!puzzleInstance, baseSx:selectedObject.baseSx || selectedObject.sx, baseSy:selectedObject.baseSy || selectedObject.sy, assetState:selectedObject.assetState || inferredAssetState(selectedObject.assetName),
      y:duplicateY,
      groundLine:sourceGroundLine,
      shade:selectedObject.shade, opacity:selectedObject.opacity,
      flip:selectedObject.flip, layer:classifyLayer(point.z), collision:selectedObject.collision ? cloneCollision(selectedObject.collision) : null,
      category:selectedObject.category || 'dressing', gameplayType:selectedObject.gameplayType || null, gameplayLayerLocked:!!selectedObject.gameplayLayerLocked,
      freePlacement:objectUsesFreePlacement(selectedObject),
      worldGroupId:puzzleInstance ? null : ((worldGroupEditMode && worldGroupById(selectedWorldGroupId)) ? selectedWorldGroupId : (selectedObject.worldGroupId || null)),
      wrap:false, puzzleInstanceId:puzzleInstance?.id || null, puzzleObjectId,
      sockets:Array.isArray(selectedObject.sockets) ? selectedObject.sockets.map(socket => ({ ...socket })) : [], socketedTo:null,
      thoughtText:selectedObject.thoughtText || '', thoughtRadius:selectedObject.thoughtRadius || 1.4, thoughtOnce:selectedObject.thoughtOnce !== false,
      cameraNodeRadius:selectedObject.cameraNodeRadius || 4.0, cameraNodeOffsetX:Number(selectedObject.cameraNodeOffsetX)||0,
      cameraNodeOffsetY:Number(selectedObject.cameraNodeOffsetY)||0, cameraNodeOffsetZ:Number(selectedObject.cameraNodeOffsetZ)||0,
      cameraNodeCurveStart:cameraNodeCurveSetting(selectedObject.cameraNodeCurveStart), cameraNodeCurveEnd:cameraNodeCurveSetting(selectedObject.cameraNodeCurveEnd)
    });
    if (puzzleInstance) puzzleInstance.objects.push(obj);
    if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, obj.x, obj.z);
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    recordObjectEdit(obj);
    selectObject(obj);
  }

  function flipSelectedObject() {
    if (!selectedObject || selectedObject.deleted) return;
    selectedObject.flip = !selectedObject.flip;
    recordObjectEdit(selectedObject);
    updateEditorButtons();
    hintEl.textContent = 'Asset flipped horizontally';
    hintEl.classList.remove('hidden');
  }

  function scaleSelected(multiplier) {
    if (!selectedObject || selectedObject.deleted) return;
    const preservedFloorOffset = objectFloorOffsetFromTerrain(selectedObject);
    const preservedFloorWorldY = objectFloorWorldY(selectedObject);
    const scaleMax = selectedObject.assetName === 'crate'
      ? 8.0
      : (selectedObject.assetName.startsWith('tree') ? 40.0 : 40.0);
    const next = Rig.clamp((selectedObject.sy * multiplier), 0.18, scaleMax);
    const ratio = next / Math.max(0.001, selectedObject.sy);
    selectedObject.sy = next;
    selectedObject.sx *= ratio;
    if (selectedObject.collision) {
      if (!selectedObject.collisionOverride) {
        selectedObject.collision = behaviourCollisionFor(selectedObject.assetName, selectedObject.sx, selectedObject.sy, null,selectedObject.assetState);
      } else {
        selectedObject.collision.halfWidth *= ratio;
        selectedObject.collision.height = isGameplayCrate(selectedObject)
          ? STACK_ITEM_HEIGHT
          : selectedObject.collision.height * ratio;
        selectedObject.collision.depth *= ratio;
      }
    }
    if (objectUsesFreePlacement(selectedObject)) {
      setObjectFloorWorldY(selectedObject, preservedFloorWorldY);
    } else if (selectedObject.category === 'gameplay' && objectGroundLine(selectedObject) <= 0.0001) {
      selectedObject.y = restYForGameplayObject(selectedObject);
    } else {
      setObjectFloorOffset(selectedObject, preservedFloorOffset);
    }
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    recordObjectEdit(selectedObject);
    updateEditorButtons();
  }

  function removeSelectedCollision() {
    if (!selectedObject || selectedObject.deleted || !selectedObject.collision) return;
    selectedObject.collision = null;
    selectedObject.collisionOverride = true;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    selectedCollisionShape = 0;
    recordObjectEdit(selectedObject);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    updateEditorButtons();
    updatePuzzleObjectList();
    hintEl.textContent = 'Collision removed';
    hintEl.classList.remove('hidden');
  }

  function updateCollisionShapeControls() {
    const collision = selectedObject?.collision || null;
    const count = collision ? collisionShapeCount(collision) : 0;
    selectedCollisionShape = Rig.clamp(selectedCollisionShape, 0, Math.max(0, count - 1));
    if (editorCollisionShapeBtn) {
      editorCollisionShapeBtn.hidden = !selectedObject || !collision || !collisionEditMode || !!socketPlacementPiece;
      const label = editorCollisionShapeBtn.querySelector('small');
      if (label) label.textContent = `SHAPE ${selectedCollisionShape + 1}`;
    }
    if (editorCollisionAddShapeBtn) editorCollisionAddShapeBtn.hidden = !selectedObject || !collision || !collisionEditMode || !!socketPlacementPiece;
    if (editorCollisionRemoveShapeBtn) {
      editorCollisionRemoveShapeBtn.hidden = !selectedObject || !collision || !collisionEditMode || !!socketPlacementPiece;
      editorCollisionRemoveShapeBtn.disabled = count <= 1;
    }
  }

  function cycleSelectedCollisionShape() {
    if (!selectedObject?.collision) return;
    const count = Math.max(1, collisionShapeCount(selectedObject.collision));
    selectedCollisionShape = (selectedCollisionShape + 1) % count;
    collisionHandleIndex = -1;
    updateCollisionShapeControls();
    hintEl.textContent = `Collision shape ${selectedCollisionShape + 1} of ${count}`;
    hintEl.classList.remove('hidden');
  }

  function addCollisionShape() {
    if (!selectedObject?.collision) return;
    const points = defaultCollisionPoints().map(point => ({ ...point }));
    const shapes = normalisedCollisionShapes(selectedObject.collision).map(shape => ({ points:shape.map(point => ({ ...point })) }));
    shapes.push({ points });
    selectedObject.collision.shapes = shapes;
    selectedObject.collision.points = shapes[0].points.map(point => ({ ...point }));
    selectedObject.collisionOverride = true;
    selectedCollisionShape = shapes.length - 1;
    collisionHandleIndex = -1;
    recordObjectEdit(selectedObject);
    updateCollisionShapeControls();
    hintEl.textContent = `Collision box ${selectedCollisionShape + 1} added`;
    hintEl.classList.remove('hidden');
  }

  function removeCollisionShape() {
    if (!selectedObject?.collision) return;
    const shapes = normalisedCollisionShapes(selectedObject.collision).map(shape => ({ points:shape.map(point => ({ ...point })) }));
    if (shapes.length <= 1) return;
    shapes.splice(selectedCollisionShapeIndex(selectedObject.collision), 1);
    selectedObject.collision.shapes = shapes;
    selectedObject.collision.points = shapes[0].points.map(point => ({ ...point }));
    selectedObject.collisionOverride = true;
    selectedCollisionShape = Rig.clamp(selectedCollisionShape, 0, Math.max(0, shapes.length - 1));
    collisionHandleIndex = -1;
    recordObjectEdit(selectedObject);
    updateCollisionShapeControls();
    hintEl.textContent = `Collision box removed · ${shapes.length} remaining`;
    hintEl.classList.remove('hidden');
  }

  function toggleSelectedCollision() {
    if (!selectedObject || selectedObject.deleted) return;
    groundLineEditMode = false;
    transformEditMode = false;
    syncGroundLineEditor();
    syncTransformEditor();
    if (!selectedObject.collision) {
      selectedObject.collisionOverride = true;
      selectedObject.collision = {
        halfWidth: Math.max(0.18, selectedObject.sx * (selectedObject.category === 'gameplay' ? 0.43 : 0.34)),
        height: Math.max(0.24, selectedObject.sy * (selectedObject.category === 'gameplay' ? CRATE_COLLISION_HEIGHT_FACTOR : 0.66)),
        depth: Math.max(0.42, Math.min(1.15, selectedObject.sx * 0.42)),
        platform: objectHasBehaviour(selectedObject, 'supportSurface'),
        points: defaultCollisionPoints(),
        shapes: [{ points:defaultCollisionPoints() }],
        behaviourGenerated: false
      };
      selectedCollisionShape = 0;
      collisionEditMode = true;
      hintEl.textContent = 'Collision added · drag the orange corner handles to fit the shape';
      hintEl.classList.remove('hidden');
    } else {
      selectedObject.collisionOverride = true;
      selectedCollisionShape = selectedCollisionShapeIndex(selectedObject.collision);
      writeSelectedCollisionShape(selectedObject.collision, selectedCollisionShapePoints(selectedObject.collision).map(point => ({ ...point })));
      collisionEditMode = !collisionEditMode;
      hintEl.textContent = collisionEditMode
        ? 'Collision edit mode · drag the orange corner handles'
        : 'Collision edit mode off';
      hintEl.classList.remove('hidden');
    }
    recordObjectEdit(selectedObject);
    updateEditorButtons();
    updateCollisionShapeControls();
  }

  function toggleSelectedGameplayLayer() {
    if (!selectedObject || selectedObject.deleted || selectedObject.category !== 'gameplay') return;
    selectedObject.gameplayLayerLocked = !selectedObject.gameplayLayerLocked;
    if (selectedObject.gameplayLayerLocked) {
      selectedObject.z = pathZ;
      selectedObject.y = restYForGameplayObject(selectedObject);
      moveObjectToCorrectCollection(selectedObject);
      sortSceneCollections();
    }
    recordObjectEdit(selectedObject);
    updateEditorButtons();
    hintEl.textContent = selectedObject.gameplayLayerLocked
      ? 'Gameplay layer locked · this object will stay interactive with the character'
      : 'Gameplay layer unlocked · drag freely in depth';
    hintEl.classList.remove('hidden');
  }

  function deleteSelected() {
    const group=selectedLockedWorldGroupForEditor();
    if(group && (!selectedObject || selectedObject.deleted)){
      deleteSelectedWorldGroup();
      return;
    }
    if (!selectedObject || selectedObject.deleted) return;
    const wasGameplay = selectedObject.category === 'gameplay';
    selectedObject.deleted = true;
    recordObjectEdit(selectedObject);
    if (wasGameplay) settleGameplayCrates();
    selectedObject = null;
    updateEditorButtons();
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function setAssetPaletteOpen(open, { clearPending = false, keepSetup = false } = {}) {
    if (!editorPalette) return;
    editorPalette.hidden = !open;
    document.body.classList.toggle('sidescroll-assets-open', !!open);
    if (!open && clearPending) addAssetType = null;
    if (!open) {
      assetSetupName = null;
      collectibleSetupItemId = null;
      if (assetSetupEl) assetSetupEl.hidden = true;
      if (collectibleSetupEl) collectibleSetupEl.hidden = true;
      if (editorAssetsEl) editorAssetsEl.hidden = false;
      return;
    }
    if (!keepSetup) showAssetBrowser();
  }

  function updateAssetPaletteState() {
    if (!editorAssetsEl) return;
    editorAssetsEl.querySelectorAll('.sidescroll-editor-asset').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.asset === addAssetType);
    });
  }

  function buildAssetPalette() {
    if (!editorAssetsEl) return;
    if (editorPaletteTitle) editorPaletteTitle.textContent = puzzleEnvironmentPlacementMode
      ? 'Place Puzzle Dressing'
      : (editorScope === 'puzzle' ? 'Place Puzzle Pieces' : 'Environment Assets');
    if (editorPaletteSubtitle) {
      const activeBiomes = runtimeLoadedBiomesAt(character.x).map(id => BIOME_RUNTIME_DEFS[id]?.label || id).join(' + ');
      editorPaletteSubtitle.textContent = puzzleEnvironmentPlacementMode
        ? `Choose environment art from ${activeBiomes} + Global to attach to this puzzle · Done Placing returns to Dressing edit mode`
        : (editorScope === 'puzzle'
            ? 'Choose a puzzle piece · Done Placing returns to Puzzle Pieces edit mode · Setup edits reusable behaviours'
            : `Available here: ${activeBiomes} + Global / Unbound`);
    }
    editorAssetsEl.innerHTML = '';
    const allowedPuzzleAssets = editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode ? puzzleAssetNamesFor(editorPuzzleMarkerId) : null;
    for (const group of editorAssetGroups) {
      const wantedScope = puzzleEnvironmentPlacementMode ? 'environment' : editorScope;
      if (group.scope !== wantedScope && group.scope !== 'both') continue;
      const items = group.items.filter(info => puzzleEnvironmentPlacementMode || editorScope !== 'puzzle' || group.scope === 'both' || !allowedPuzzleAssets?.size || allowedPuzzleAssets.has(info.name))
        .filter(info => group.scope !== 'environment' || environmentAssetAvailableForBiome(info.name, character.x));
      if (!items.length) continue;
      const heading = document.createElement('div');
      heading.className = 'sidescroll-editor-asset-group';
      heading.textContent = group.title;
      editorAssetsEl.appendChild(heading);
      for (const info of items) {
        const name = info.name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sidescroll-editor-asset ${info.category === 'gameplay' ? 'gameplay' : 'dressing'}`;
        btn.dataset.asset = name;
        const file = info.image || (name.startsWith('tree')
          ? `sidescroll-tree-${name.slice(-2)}.png`
          : (name.startsWith('ground') ? `sidescroll-ground-${name.slice(-2)}.png` : null));
        if (file) {
          const thumbVersion = name.startsWith('settlement-') ? '1.0.102' : (name.startsWith('mountain-') ? '1.0.83' : '1.0.62');
          btn.innerHTML = `<span class="sidescroll-asset-thumb"><img src="${file}?v=${thumbVersion}" alt="" loading="eager"></span><small>${info.label}</small>`;
        } else if (name === 'crate') {
          btn.innerHTML = `<span class="sidescroll-crate-thumb" aria-hidden="true"><i></i></span><small>${info.label}</small>`;
        } else {
          btn.innerHTML = `<span class="sidescroll-puzzle-thumb" aria-hidden="true">${info.thumb || '◇'}</span><small>${info.label}</small>`;
        }
        bindEditorPress(btn, () => {
          addAssetType = name;
          selectedObject = null;
          collisionEditMode = false;
          collisionHandleIndex = -1;
          updateAssetPaletteState();
          setAssetPaletteOpen(false);
          updatePlacementModeUi();
          updateEditorButtons();
          updatePuzzlePanel();
          const placementKind = editorScope === 'puzzle'
            ? (puzzleEnvironmentPlacementMode ? 'Dressing placement' : 'Puzzle-piece placement')
            : 'Placement mode';
          hintEl.textContent = info.category === 'gameplay'
            ? `${placementKind} · tap the path to add ${info.label.toLowerCase()} · tap again for another`
            : `${placementKind} · tap the ground to add ${info.label.toLowerCase()} · tap again for another`;
          hintEl.classList.remove('hidden');
        });
        if (editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode) {
          const card = document.createElement('div');
          card.className = 'sidescroll-editor-asset-card';
          card.appendChild(btn);
          const tools = document.createElement('div');
          tools.className = 'sidescroll-editor-asset-card-tools';
          const tags = document.createElement('span');
          tags.className = 'sidescroll-editor-asset-tags';
          tags.textContent = behaviourBadgeText(name);
          const setup = document.createElement('button');
          setup.type = 'button';
          setup.className = 'sidescroll-editor-asset-setup';
          setup.textContent = 'SETUP';
          bindEditorPress(setup, () => showAssetSetup(name));
          tools.append(tags, setup);
          card.appendChild(tools);
          editorAssetsEl.appendChild(card);
        } else {
          editorAssetsEl.appendChild(btn);
        }
      }
    }
    if (editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode) {
      const heading = document.createElement('div');
      heading.className = 'sidescroll-editor-asset-group';
      heading.textContent = 'COLLECTABLES';
      editorAssetsEl.appendChild(heading);
      for (const [itemId, def] of Object.entries(INVENTORY_ITEM_DEFS)) {
        const cfg = collectibleConfig(itemId);
        const card = document.createElement('div');
        card.className = 'sidescroll-editor-asset-card sidescroll-collectible-card';
        const face = document.createElement('div');
        face.className = 'sidescroll-editor-asset collectible';
        face.innerHTML = `${inventoryThumbMarkup(def)}<small>${cfg.label || def.label}</small>`;
        card.appendChild(face);
        const tools = document.createElement('div');
        tools.className = 'sidescroll-editor-asset-card-tools';
        const tags = document.createElement('span');
        tags.className = 'sidescroll-editor-asset-tags';
        tags.textContent = `${(Number(cfg.scale) || 1).toFixed(2)}× · ${cfg.spin ? 'SPIN' : 'STATIC'}`;
        const setup = document.createElement('button');
        setup.type = 'button';
        setup.className = 'sidescroll-editor-asset-setup';
        setup.textContent = 'SETUP';
        bindEditorPress(setup, () => showCollectibleSetup(itemId));
        tools.append(tags, setup);
        card.appendChild(tools);
        editorAssetsEl.appendChild(card);
      }
    }
  }


  function puzzleExclusionHandlePositions(instance) {
    if (!instance || !puzzleExclusionEditMode) return [];
    const b = puzzleExclusionWorldBounds(instance.marker);
    const specs = [
      ['center', b.centerX, b.centerZ],
      ['left', b.minX, b.centerZ],
      ['right', b.maxX, b.centerZ],
      ['far', b.centerX, b.minZ],
      ['near', b.centerX, b.maxZ]
    ];
    return specs.map(([kind,x,z]) => {
      const p = projectWorldPoint(x, terrainGroundYAt(x,z)+0.055, z);
      return p && { kind, ...p };
    }).filter(Boolean);
  }

  function puzzleExclusionHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || !puzzleExclusionEditMode) return null;
    const instance = selectedPuzzleInstance();
    if (!instance) return null;
    const rect = canvas.getBoundingClientRect();
    const x=clientX-rect.left, y=clientY-rect.top;
    return puzzleExclusionHandlePositions(instance).find(h => Math.hypot(h.x-x,h.y-y) <= 21) || null;
  }

  function drawPuzzleExclusionGuide(ctx, instance) {
    if (!instance || !puzzleExclusionEditMode) return;
    const b = puzzleExclusionWorldBounds(instance.marker);
    const corners = [[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]]
      .map(([x,z]) => projectWorldPoint(x,terrainGroundYAt(x,z)+0.035,z));
    if (corners.some(p=>!p)) return;
    ctx.save();
    ctx.fillStyle = b.enabled ? 'rgba(83,178,205,.18)' : 'rgba(120,130,135,.10)';
    ctx.strokeStyle = b.enabled ? 'rgba(117,220,241,.96)' : 'rgba(160,170,174,.72)';
    ctx.lineWidth=2; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.moveTo(corners[0].x,corners[0].y);
    for(let i=1;i<corners.length;i++) ctx.lineTo(corners[i].x,corners[i].y);
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    for(const h of puzzleExclusionHandlePositions(instance)){
      ctx.beginPath(); ctx.arc(h.x,h.y,h.kind==='center'?8:7,0,Math.PI*2);
      ctx.fillStyle=h.kind==='center'?'#d9f7fb':'#7bd5e8'; ctx.fill();
      ctx.strokeStyle='#254850'; ctx.lineWidth=1.5; ctx.stroke();
    }
    const label=`EXCLUSION · ${b.width.toFixed(1)} × ${b.depth.toFixed(1)}m`;
    const c=projectWorldPoint(b.centerX,terrainGroundYAt(b.centerX,b.centerZ)+0.1,b.centerZ);
    if(c){ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,c.x-tw*.5));const ly=Math.max(48,c.y-34);ctx.fillStyle='rgba(23,32,38,.86)';ctx.fillRect(lx,ly,tw,20);ctx.fillStyle='#d9f7fb';ctx.fillText(label,lx+7,ly+14);}
    ctx.restore();
  }

  function puzzleRespawnHandlePositions(instance) {
    if (!instance || !puzzleRespawnEditMode) return [];
    const r = puzzleRespawnWorld(instance.marker);
    if (!r) return [];
    const specs = [['zone-center',r.centerX,r.centerZ,r.triggerY],['left',r.minX,r.centerZ,r.triggerY],['right',r.maxX,r.centerZ,r.triggerY],['far',r.centerX,r.minZ,r.triggerY],['near',r.centerX,r.maxZ,r.triggerY]];
    const handles = specs.map(([kind,x,z,y]) => { const p=projectWorldPoint(x,y,z); return p && {kind,...p}; }).filter(Boolean);
    const spawnX=r.spawnWorldX;
    const spawnSupport=walkableSupportAt(spawnX+colliderWorld().offsetX,Infinity,0);
    const spawnY=playSurfaceYAt(spawnX)+(spawnSupport?.offset||0)+0.06;
    const spawn=projectWorldPoint(spawnX,spawnY,r.spawnWorldZ);
    if(spawn) handles.push({kind:'spawn',...spawn});
    return handles;
  }

  function puzzleRespawnHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || !puzzleRespawnEditMode) return null;
    const instance=selectedPuzzleInstance(); if(!instance) return null;
    const rect=canvas.getBoundingClientRect(); const x=clientX-rect.left,y=clientY-rect.top;
    return puzzleRespawnHandlePositions(instance).find(h=>Math.hypot(h.x-x,h.y-y)<=(h.kind==='spawn'?23:20))||null;
  }

  function drawPuzzleRespawnGuide(ctx, instance) {
    if (!instance || !puzzleRespawnEditMode) return;
    const r=puzzleRespawnWorld(instance.marker); if(!r) return;
    const corners=[[r.minX,r.minZ],[r.maxX,r.minZ],[r.maxX,r.maxZ],[r.minX,r.maxZ]].map(([x,z])=>projectWorldPoint(x,r.triggerY,z));
    if(corners.some(p=>!p)) return;
    ctx.save();
    ctx.fillStyle=r.enabled?'rgba(221,86,116,.17)':'rgba(120,130,135,.10)';
    ctx.strokeStyle=r.enabled?'rgba(255,123,151,.96)':'rgba(165,170,174,.72)';
    ctx.lineWidth=2; ctx.setLineDash([7,5]); ctx.beginPath(); ctx.moveTo(corners[0].x,corners[0].y);
    for(let i=1;i<corners.length;i++)ctx.lineTo(corners[i].x,corners[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
    for(const h of puzzleRespawnHandlePositions(instance)){
      if(h.kind==='spawn'){
        ctx.beginPath();ctx.arc(h.x,h.y,10,0,Math.PI*2);ctx.fillStyle='#c9f4ca';ctx.fill();ctx.strokeStyle='#335b3c';ctx.lineWidth=2;ctx.stroke();
        ctx.font='900 9px -apple-system,BlinkMacSystemFont,sans-serif';ctx.fillStyle='rgba(20,38,28,.92)';ctx.fillRect(h.x-27,h.y-30,54,17);ctx.fillStyle='#dbf8df';ctx.fillText('SPAWN',h.x-20,h.y-18);
      }else{ctx.beginPath();ctx.arc(h.x,h.y,h.kind==='zone-center'?8:7,0,Math.PI*2);ctx.fillStyle=h.kind==='zone-center'?'#ffd0d8':'#ff7f9a';ctx.fill();ctx.strokeStyle='#633241';ctx.lineWidth=1.5;ctx.stroke();}
    }
    const label=`RESPAWN · ${r.width.toFixed(1)} × ${r.depth.toFixed(1)}m · Y ${r.triggerOffsetY.toFixed(2)}`;
    const c=projectWorldPoint(r.centerX,r.triggerY+0.08,r.centerZ);if(c){ctx.font='800 9px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,c.x-tw*.5));const ly=Math.max(48,c.y-32);ctx.fillStyle='rgba(38,24,29,.88)';ctx.fillRect(lx,ly,tw,19);ctx.fillStyle='#ffd6df';ctx.fillText(label,lx+7,ly+13);}ctx.restore();
  }

  function puzzleCartPathHandlePositions(instance) {
    if (!instance || !puzzleCartPathEditMode) return [];
    const path = puzzleCartPathWorld(instance.marker);
    if (!path) return [];
    const rect=canvas.getBoundingClientRect();
    // iOS reserves the bottom edge for the Home/app-switch gesture. A canvas
    // can request touch-action:none but it cannot reliably own that system
    // gesture. Keep the authored point where it really is, but lift its grab
    // control into a safe screen-space band and draw a leader back to it.
    const bottomSafeY=Math.max(68, rect.height - 96);
    const safeHandle=(kind,p)=>{
      const screen=projectWorldPoint(p.x,p.y,p.z);
      if(!screen)return null;
      const grabX=Rig.clamp(screen.x,28,Math.max(28,rect.width-28));
      const grabY=Math.min(screen.y,bottomSafeY);
      return {kind,...screen,grabX,grabY,lifted:Math.abs(grabY-screen.y)>1,world:p};
    };
    const specs = [
      ['start',path.start],['c1',path.c1],['c2',path.c2],['land',path.land]
    ];
    const handles = specs.map(([kind,p]) => safeHandle(kind,p)).filter(Boolean);
    const mid = cubicBezierPoint(path.start,path.c1,path.c2,path.land,0.5);
    const moveHandle=safeHandle('move',mid);
    if(moveHandle) handles.push(moveHandle);
    return handles;
  }

  function puzzleCartPathHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || !puzzleCartPathEditMode) return null;
    const instance=selectedPuzzleInstance(); if(!instance) return null;
    const rect=canvas.getBoundingClientRect();
    const x=clientX-rect.left,y=clientY-rect.top;
    const handles=puzzleCartPathHandlePositions(instance);

    // v1.0.46: use the safe grab position, not necessarily the authored
    // anchor position. Bottom-edge handles are visually lifted above iOS's
    // system gesture strip, while still editing the original world point.
    const candidates=[];
    for(const h of handles){
      const hx=Number.isFinite(h.grabX)?h.grabX:h.x;
      const hy=Number.isFinite(h.grabY)?h.grabY:h.y;
      const dist=Math.hypot(hx-x,hy-y);
      const radius=h.kind==='move'?66:(h.kind==='start'||h.kind==='land'?62:58);
      const halfLabel=h.kind==='move'?66:(h.kind==='start'||h.kind==='land'?58:62);
      const inLabel=x>=hx-halfLabel&&x<=hx+halfLabel&&y>=hy-54&&y<=hy-6;
      if(dist<=radius||inLabel){
        const score=dist+(inLabel&&!(dist<=radius)?14:0);
        candidates.push({h,score});
      }
    }
    if(candidates.length){
      candidates.sort((a,b)=>a.score-b.score);
      return candidates[0].h;
    }

    // The spline itself is also a MOVE PATH grab area.  This gives a large,
    // continuous target if the user misses the blue centre handle.
    const path=puzzleCartPathWorld(instance.marker);
    if(!path)return null;
    let best=null;
    let prevWorld=path.start;
    let prevScreen=projectWorldPoint(prevWorld.x,prevWorld.y,prevWorld.z);
    for(let i=1;i<=48;i++){
      const t=i/48;
      const world=cubicBezierPoint(path.start,path.c1,path.c2,path.land,t);
      const screen=projectWorldPoint(world.x,world.y,world.z);
      if(prevScreen&&screen){
        const vx=screen.x-prevScreen.x,vy=screen.y-prevScreen.y;
        const len2=vx*vx+vy*vy;
        const u=len2>0?Rig.clamp(((x-prevScreen.x)*vx+(y-prevScreen.y)*vy)/len2,0,1):0;
        const px=prevScreen.x+vx*u,py=prevScreen.y+vy*u;
        const dist=Math.hypot(x-px,y-py);
        if(!best||dist<best.dist){
          best={dist,world:{
            x:prevWorld.x+(world.x-prevWorld.x)*u,
            y:prevWorld.y+(world.y-prevWorld.y)*u,
            z:prevWorld.z+(world.z-prevWorld.z)*u
          }};
        }
      }
      prevWorld=world;prevScreen=screen;
    }
    return best&&best.dist<=34?{kind:'move',x,y,world:best.world,pathHit:true}:null;
  }

  function drawPuzzleCartPathGuide(ctx, instance) {
    if (!instance || !puzzleCartPathEditMode) return;
    const path=puzzleCartPathWorld(instance.marker);if(!path)return;
    const samples=[];
    for(let i=0;i<=32;i++){
      const p=cubicBezierPoint(path.start,path.c1,path.c2,path.land,i/32);
      const s=projectWorldPoint(p.x,p.y,p.z);if(s)samples.push(s);
    }
    if(samples.length<2)return;
    const handles=puzzleCartPathHandlePositions(instance);
    const byKind=new Map(handles.map(h=>[h.kind,h]));
    ctx.save();
    ctx.strokeStyle=path.enabled?'rgba(255,214,112,.98)':'rgba(160,166,170,.72)';
    ctx.lineWidth=4;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(samples[0].x,samples[0].y);
    for(let i=1;i<samples.length;i++)ctx.lineTo(samples[i].x,samples[i].y);ctx.stroke();
    const start=byKind.get('start'),c1=byKind.get('c1'),c2=byKind.get('c2'),land=byKind.get('land');
    if(start&&c1){ctx.strokeStyle='rgba(255,214,112,.45)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(c1.x,c1.y);ctx.stroke();}
    if(c2&&land){ctx.beginPath();ctx.moveTo(c2.x,c2.y);ctx.lineTo(land.x,land.y);ctx.stroke();}
    ctx.setLineDash([]);
    const style={start:['#ffd972','#5c4a1e','START'],c1:['#ffe9ac','#685b34','CURVE 1'],c2:['#ffe9ac','#685b34','CURVE 2'],land:['#a9efc4','#2e6043','LAND'],move:['#8fd7ff','#264d66','MOVE PATH']};
    for(const h of handles){
      const [fill,stroke,label]=style[h.kind];
      const hx=Number.isFinite(h.grabX)?h.grabX:h.x;
      const hy=Number.isFinite(h.grabY)?h.grabY:h.y;
      const dotRadius=h.kind==='move'?16:(h.kind==='start'||h.kind==='land'?15:13);
      if(h.lifted){
        ctx.strokeStyle='rgba(210,231,235,.62)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(hx,hy);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(h.x,h.y,5,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
      }
      // Faint outer halo communicates the generous phone-sized grab area.
      ctx.beginPath();ctx.arc(hx,hy,h.kind==='move'?31:28,0,Math.PI*2);ctx.fillStyle=h.kind==='move'?'rgba(143,215,255,.16)':'rgba(255,233,172,.14)';ctx.fill();
      ctx.beginPath();ctx.arc(hx,hy,dotRadius,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2.5;ctx.stroke();
      ctx.font='900 10px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+16;ctx.fillStyle='rgba(20,31,34,.92)';ctx.fillRect(hx-tw*.5,hy-37,tw,21);ctx.fillStyle=fill;ctx.fillText(label,hx-tw*.5+8,hy-22);
    }
    if(land){
      const angle=(Number(path.finalRotationDeg)||0)*Math.PI/180;
      const len=42;ctx.strokeStyle='rgba(169,239,196,.92)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(land.x,land.y);ctx.lineTo(land.x+Math.cos(angle)*len,land.y-Math.sin(angle)*len);ctx.stroke();
    }
    ctx.restore();
  }

  function puzzleBoundHandlePositions(instance) {
    if (!instance) return [];
    const b = puzzleBounds(instance);
    const left = projectWorldPoint(b.minX, playSurfaceYAt(b.minX)+0.04, pathZ);
    const right = projectWorldPoint(b.maxX, playSurfaceYAt(b.maxX)+0.04, pathZ);
    return [left && { side:'left', ...left }, right && { side:'right', ...right }].filter(Boolean);
  }

  function puzzleBoundHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle') return null;
    const instance = selectedPuzzleInstance();
    if (!instance) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    return puzzleBoundHandlePositions(instance).find(handle => Math.hypot(handle.x-x, handle.y-y) <= 18) || null;
  }

  function puzzleMarkerHandlePosition(instance) {
    if (!instance) return null;
    return projectWorldPoint(instance.marker.x, playSurfaceYAt(instance.marker.x)+0.12, pathZ);
  }

  function puzzleMarkerHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || puzzleBrowserMode !== 'scene') return null;
    const instance = selectedPuzzleInstance();
    const mark = puzzleMarkerHandlePosition(instance);
    if (!mark) return null;
    const rect = canvas.getBoundingClientRect();
    return Math.hypot(mark.x - (clientX-rect.left), mark.y - (clientY-rect.top)) <= 20 ? mark : null;
  }

  function drawPuzzleEditorGuides(ctx) {
    if (!editMode || editorScope !== 'puzzle') return;
    const instance = selectedPuzzleInstance();
    if (!instance) return;
    drawPuzzleExclusionGuide(ctx, instance);
    drawPuzzleRespawnGuide(ctx, instance);
    drawPuzzleCartPathGuide(ctx, instance);
    const b = puzzleBounds(instance);
    const left = projectWorldPoint(b.minX, playSurfaceYAt(b.minX)+0.04, pathZ);
    const right = projectWorldPoint(b.maxX, playSurfaceYAt(b.maxX)+0.04, pathZ);
    const mark = projectWorldPoint(instance.marker.x, playSurfaceYAt(instance.marker.x)+0.12, pathZ);
    if (!left || !right || !mark) return;
    ctx.save();
    ctx.strokeStyle='rgba(240,205,127,.96)';ctx.fillStyle='rgba(23,32,38,.82)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();ctx.setLineDash([]);
    for (const handle of [left,right]) {
      ctx.beginPath();ctx.arc(handle.x,handle.y,7,0,Math.PI*2);ctx.fillStyle='#f0cd7f';ctx.fill();ctx.strokeStyle='#493d28';ctx.lineWidth=1.5;ctx.stroke();
    }
    ctx.beginPath();ctx.arc(mark.x,mark.y,8,0,Math.PI*2);ctx.fillStyle='#f5e6b7';ctx.fill();ctx.strokeStyle='#493d28';ctx.lineWidth=1.5;ctx.stroke();
    const rel=currentPuzzleBoundsRelative(instance.marker);
    const label=`${instance.def.label || instance.marker.group} · BOUNDS ${(rel.maxX-rel.minX).toFixed(1)}m`;
    ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';
    const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,mark.x-tw*.5));const ly=Math.max(48,mark.y-31);
    ctx.fillStyle='rgba(23,32,38,.82)';ctx.fillRect(lx,ly,tw,20);ctx.fillStyle='#f4e4bf';ctx.fillText(label,lx+7,ly+14);
    ctx.restore();
  }

  function projectWorldPolygon(points, z = pathZ) {
    return points.map(point => projectWorldPoint(point.x, point.y, z)).filter(Boolean);
  }

  function drawCollisionDebugOverlay(ctx) {
    ctx.save();

    // Dashed cyan always shows the visual/raw terrain. Solid mint shows the
    // resolved walk support. Collision-disabled sections therefore create a real
    // gap in the mint line unless an authored platform collider fills it.
    const terrainFloor = [];
    const walkSegments = [];
    let walkSegment = [];
    const floorStartX = camera.x - 14;
    const floorEndX = camera.x + 14;
    const debugCapsule = colliderWorld();
    for (let i = 0; i <= 112; i += 1) {
      const x = Rig.lerp(floorStartX, floorEndX, i / 112);
      const terrainY = terrainGroundYAt(x, pathZ);
      const terrainPoint = projectWorldPoint(x, terrainY + 0.035, pathZ);
      if (terrainPoint) terrainFloor.push(terrainPoint);
      const support = walkableSupportAt(x + debugCapsule.offsetX, Infinity, 0);
      if (support) {
        const walkPoint = projectWorldPoint(x, playSurfaceYAt(x) + support.offset + 0.055, pathZ);
        if (walkPoint) walkSegment.push(walkPoint);
      } else if (walkSegment.length) {
        if (walkSegment.length > 1) walkSegments.push(walkSegment);
        walkSegment = [];
      }
    }
    if (walkSegment.length > 1) walkSegments.push(walkSegment);
    if (terrainFloor.length > 1) {
      ctx.strokeStyle = 'rgba(109,226,205,.86)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([9,5]);
      ctx.beginPath();
      ctx.moveTo(terrainFloor[0].x, terrainFloor[0].y);
      for (let i = 1; i < terrainFloor.length; i += 1) ctx.lineTo(terrainFloor[i].x, terrainFloor[i].y);
      ctx.stroke();
      ctx.setLineDash([]);
      const labelPoint = terrainFloor.find(point => point.x > 18 && point.x < ctx.canvas.clientWidth - 110);
      if (labelPoint) {
        ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.fillStyle = 'rgba(18,27,31,.82)';
        ctx.fillRect(labelPoint.x + 6, labelPoint.y - 21, 68, 17);
        ctx.fillStyle = 'rgba(198,255,243,.98)';
        ctx.fillText('TERRAIN', labelPoint.x + 12, labelPoint.y - 9);
      }
    }
    if (walkSegments.length) {
      ctx.strokeStyle = 'rgba(211,255,174,.98)';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([]);
      for (const segment of walkSegments) {
        ctx.beginPath();
        ctx.moveTo(segment[0].x, segment[0].y);
        for (let i = 1; i < segment.length; i += 1) ctx.lineTo(segment[i].x, segment[i].y);
        ctx.stroke();
      }
      const labelPoint = walkSegments.flat().find(point => point.x > 120 && point.x < ctx.canvas.clientWidth - 150);
      if (labelPoint) {
        ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.fillStyle = 'rgba(18,27,31,.82)';
        ctx.fillRect(labelPoint.x + 6, labelPoint.y - 21, 96, 17);
        ctx.fillStyle = 'rgba(225,255,199,.98)';
        ctx.fillText('WALK SURFACE', labelPoint.x + 12, labelPoint.y - 9);
      }
    }

    for (const obj of collisionObjects()) {
      for(const poly of collisionScreenPolygons(obj)){
        if (poly.length < 3) continue;
        ctx.fillStyle = obj.collision?.platform ? 'rgba(235,173,86,.13)' : 'rgba(226,112,92,.10)';
        ctx.strokeStyle = obj.collision?.platform ? 'rgba(239,184,102,.92)' : 'rgba(233,118,101,.88)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash(obj.collision?.platform ? [] : [5,3]);
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted || !objectHasBehaviour(obj,'climbable')) continue;
      const ox=objectXNear(obj,camera.x);
      for(const path of climbPathWorldGeometries(obj,ox)){
        const dx=path.top.x-path.bottom.x,dy=path.top.y-path.bottom.y;
        const len=Math.max(.001,Math.hypot(dx,dy));
        const nx=-dy/len,ny=dx/len,half=path.width*.5;
        const quad=[
          {x:path.bottom.x+nx*half,y:path.bottom.y+ny*half},
          {x:path.top.x+nx*half,y:path.top.y+ny*half},
          {x:path.top.x-nx*half,y:path.top.y-ny*half},
          {x:path.bottom.x-nx*half,y:path.bottom.y-ny*half}
        ];
        const poly=projectWorldPolygon(quad,obj.z ?? pathZ);
        if(poly.length===4){
          ctx.fillStyle='rgba(92,221,237,.12)';ctx.strokeStyle='rgba(118,232,244,.96)';ctx.lineWidth=2;ctx.setLineDash([6,3]);
          ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
        }
        const b=projectWorldPoint(path.bottom.x,path.bottom.y,obj.z ?? pathZ);
        const t=projectWorldPoint(path.top.x,path.top.y,obj.z ?? pathZ);
        if(b&&t){
          ctx.fillStyle='#7cf0a0';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#76e8f4';ctx.beginPath();ctx.arc(t.x,t.y,5,0,Math.PI*2);ctx.fill();
        }
      }
    }

    const rootX = camera.x + character.screenOffsetX;
    const capsule = colliderWorld();
    const centreX = rootX + capsule.offsetX;
    const baseY = playSurfaceYAt(rootX) + Math.max(0, jumpOffset) + capsule.bottom;
    const radius = Math.min(capsule.radius, capsule.height * 0.5);
    const capsulePts = [];
    const bottomCentre = baseY + radius;
    const topCentre = baseY + capsule.height - radius;
    for (let i = 0; i <= 10; i += 1) {
      const a = Math.PI + (Math.PI * i / 10);
      capsulePts.push({ x: centreX + Math.cos(a) * radius, y: bottomCentre + Math.sin(a) * radius });
    }
    for (let i = 0; i <= 10; i += 1) {
      const a = Math.PI * i / 10;
      capsulePts.push({ x: centreX + Math.cos(a) * radius, y: topCentre + Math.sin(a) * radius });
    }
    const capsuleScreen = projectWorldPolygon(capsulePts, pathZ);
    if (capsuleScreen.length >= 3) {
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(90,205,215,.10)';
      ctx.strokeStyle = 'rgba(108,224,231,.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(capsuleScreen[0].x, capsuleScreen[0].y);
      for (let i = 1; i < capsuleScreen.length; i += 1) ctx.lineTo(capsuleScreen[i].x, capsuleScreen[i].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    if (carriedObject) {
      const rect = carriedCollisionRectAtRoot(rootX, jumpOffset, character.lastFacing >= 0 ? 1 : -1, carriedObject);
      const rectPoly = rect ? projectWorldPolygon([
        {x:rect.minX,y:rect.minY},{x:rect.maxX,y:rect.minY},
        {x:rect.maxX,y:rect.maxY},{x:rect.minX,y:rect.maxY}
      ], carriedObject.gameplayLayerLocked === false ? carriedObject.z : pathZ) : [];
      if (rectPoly.length === 4) {
        ctx.fillStyle = 'rgba(90,142,235,.12)';
        ctx.strokeStyle = 'rgba(112,166,255,.98)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();ctx.moveTo(rectPoly[0].x,rectPoly[0].y);
        for (let i=1;i<rectPoly.length;i+=1) ctx.lineTo(rectPoly[i].x,rectPoly[i].y);
        ctx.closePath();ctx.fill();ctx.stroke();
      }

      const facing = character.lastFacing >= 0 ? 1 : -1;
      const searchEndX = rootX + facing * STACK_SEARCH_RADIUS;
      const searchY = playSurfaceYAt(rootX) + 0.16;
      const a = projectWorldPoint(rootX, searchY, pathZ);
      const b = projectWorldPoint(searchEndX, playSurfaceYAt(searchEndX) + 0.16, pathZ);
      if (a && b) {
        ctx.strokeStyle = 'rgba(211,135,242,.95)';
        ctx.lineWidth = 2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      const target = dropTargetForCarried(rootX);
      if (target?.socket) {
        const p = projectWorldPoint(
          Number.isFinite(target.cueX) ? target.cueX : target.x,
          Number.isFinite(target.cueY) ? target.cueY : target.y + carriedObject.sy * 0.5,
          Number.isFinite(target.cueZ) ? target.cueZ : target.z
        );
        if (p) {
          ctx.setLineDash([]);
          ctx.strokeStyle='rgba(109,226,205,.98)';ctx.fillStyle='rgba(109,226,205,.16)';ctx.lineWidth=2.5;
          ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();ctx.stroke();
          ctx.beginPath();ctx.moveTo(p.x-16,p.y);ctx.lineTo(p.x+16,p.y);ctx.moveTo(p.x,p.y-16);ctx.lineTo(p.x,p.y+16);ctx.stroke();
          ctx.fillStyle='rgba(109,226,205,.98)';ctx.font='800 9px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillText(`SOCKET ${socketLabelForPiece(carriedObject)}`, p.x + 18, p.y - 9);
        }
      } else if (target?.stack) {
        const preview = placedCollisionRect(carriedObject, target.x, target.y);
        const previewPoly = preview ? projectWorldPolygon([
          {x:preview.minX,y:preview.minY},{x:preview.maxX,y:preview.minY},
          {x:preview.maxX,y:preview.maxY},{x:preview.minX,y:preview.maxY}
        ], target.z) : [];
        if (previewPoly.length === 4) {
          ctx.setLineDash([5,4]);
          ctx.fillStyle = target.valid ? 'rgba(116,224,151,.10)' : 'rgba(245,112,112,.10)';
          ctx.strokeStyle = target.valid ? 'rgba(116,224,151,.92)' : 'rgba(245,112,112,.92)';
          ctx.lineWidth = 2;
          ctx.beginPath();ctx.moveTo(previewPoly[0].x,previewPoly[0].y);
          for (let i=1;i<previewPoly.length;i+=1) ctx.lineTo(previewPoly[i].x,previewPoly[i].y);
          ctx.closePath();ctx.fill();ctx.stroke();
        }
        const p = projectWorldPoint(target.x, target.y + 0.06, target.z);
        if (p) {
          ctx.setLineDash([]);
          ctx.strokeStyle = target.valid ? 'rgba(116,224,151,.98)' : 'rgba(245,112,112,.98)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();ctx.moveTo(p.x-13,p.y);ctx.lineTo(p.x+13,p.y);ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x,p.y+13);ctx.stroke();
          ctx.fillStyle = target.valid ? 'rgba(116,224,151,.98)' : 'rgba(245,112,112,.98)';
          ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillText(`STACK ${target.stack.members.length + 1}`, p.x + 16, p.y - 8);
        }
      }
    }

    ctx.setLineDash([]);
    ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
    const label = `COLLISION · cyan dashed = terrain · mint = walk surface · stack ${STACK_ITEM_HEIGHT.toFixed(2)} · carry ${CARRY_BOTTOM.toFixed(2)} · stack search ${STACK_SEARCH_RADIUS.toFixed(2)} · socket ${SOCKET_SEARCH_RADIUS.toFixed(2)}`;
    const tw = ctx.measureText(label).width + 16;
    const x = Math.max(8, (ctx.canvas.clientWidth - tw) * 0.5);
    const y = 48;
    ctx.fillStyle = 'rgba(18,27,31,.78)';
    ctx.fillRect(x, y, tw, 22);
    ctx.fillStyle = 'rgba(240,246,245,.96)';
    ctx.fillText(label, x + 8, y + 15);
    ctx.restore();
  }

  function drawSelectedCounterweightMechanism(ctx) {
    if (!editMode || !selectedObject || !isCounterweightPlank(selectedObject)) return;
    const plank = selectedObject;
    const pivot = counterweightPivotBaseWorld(plank);
    const line = counterweightZoneLineWorld(plank);
    if (!pivot || !line) return;
    const p = projectWorldPoint(pivot.x,pivot.y,pivot.z);
    const a = projectWorldPoint(line.a.x,line.a.y,line.a.z);
    const b = projectWorldPoint(line.b.x,line.b.y,line.b.z);
    if (!p || !a || !b) return;
    ctx.save();
    ctx.strokeStyle='rgba(103,183,255,.96)';
    ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);
    ctx.fillStyle='rgba(121,239,133,.96)';
    ctx.fill();
    ctx.strokeStyle='rgba(28,68,38,.98)';
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.font='800 8px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillStyle='rgba(20,31,34,.82)';ctx.fillRect(p.x+11,p.y-18,74,16);
    ctx.fillStyle='#d8ffe0';ctx.fillText('PIVOT / PICKUP',p.x+15,p.y-7);
    ctx.restore();
  }

  function drawAuthoredSockets(ctx) {
    if (!editMode || editorScope !== 'puzzle') return;
    const instance = selectedPuzzleInstance();
    if (!instance) return;
    ctx.save();
    ctx.font = '900 9px -apple-system,BlinkMacSystemFont,sans-serif';
    for (const host of socketHostsForInstance(instance)) {
      for (const socket of socketsForHost(host)) {
        const point = socketWorldPosition(host, socket);
        const screen = point ? projectWorldPoint(point.x, point.y, point.z) : null;
        if (!screen) continue;
        const active = !!(socketPlacementPiece && socketMatchesPiece(socket, socketPlacementPiece));
        ctx.fillStyle = active ? 'rgba(255,79,149,.22)' : 'rgba(109,226,205,.18)';
        ctx.strokeStyle = active ? '#ff4f95' : '#6de2cd';
        ctx.lineWidth = active ? 3 : 2;
        ctx.setLineDash(active ? [] : [4,3]);
        ctx.beginPath(); ctx.arc(screen.x, screen.y, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(screen.x-16,screen.y);ctx.lineTo(screen.x+16,screen.y);ctx.moveTo(screen.x,screen.y-16);ctx.lineTo(screen.x,screen.y+16);ctx.stroke();
        const label = socketLabelForPiece(socket.pieceAsset);
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle='rgba(20,31,34,.82)';ctx.fillRect(screen.x+14,screen.y-20,tw,17);
        ctx.fillStyle=active ? '#ffd4e5' : '#c9fff5';ctx.fillText(label,screen.x+19,screen.y-8);
      }
    }
    ctx.restore();
  }

  function drawPlayerInteractionHints(ctx) {
    if (!playerHintsEnabled || editMode || puzzleTestMode && false) return;
    ctx.save();
    const dot = (point, strong=false) => {
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, strong ? 5.0 : 4.2, 0, Math.PI*2);
      ctx.fillStyle = strong ? 'rgba(247,238,207,.96)' : 'rgba(247,238,207,.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(38,52,54,.72)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    const rootX = camera.x + character.screenOffsetX;
    let contextHintObject = null;
    if (!interactionState) {
      const context = nearestPuzzleContextAction();
      contextHintObject = context?.obj || null;
      if (contextHintObject && !contextHintObject.deleted) {
        const ox = objectXNear(contextHintObject, rootX);
        const oy = contextHintObject.y + Math.max(0.18, contextHintObject.sy * 0.54);
        dot(projectWorldPoint(ox, oy, contextHintObject.z), true);
      }
    }

    if (!carriedObject && !interactionState) {
      const near = nearestActionCrate();
      if (near && near !== contextHintObject) {
        const pivot = counterweightPickupPoint(near);
        const ox = pivot ? pivot.x : objectXNear(near, rootX);
        const oy = pivot ? pivot.y : near.y + Math.max(0.18, near.sy * 0.28);
        const oz = pivot ? pivot.z : near.z;
        dot(projectWorldPoint(ox,oy,oz), true);
      }
    }

    if (carriedObject && !interactionState) {
      const facing = character.lastFacing >= 0 ? 1 : -1;
      const rect = carriedCollisionRectAtRoot(rootX, jumpOffset, facing, carriedObject);
      if (rect) dot(projectWorldPoint((rect.minX+rect.maxX)*0.5, (rect.minY+rect.maxY)*0.5, carriedObject.gameplayLayerLocked === false ? carriedObject.z : pathZ));
      if (objectHasBehaviour(carriedObject,'stackable')) {
        const facing = character.lastFacing >= 0 ? 1 : -1;
        const zoneTarget = counterweightDropTargetNear(rootX,facing);
        if (zoneTarget?.counterweightPlank) {
          const line = counterweightZoneLineWorld(zoneTarget.counterweightPlank);
          if (line) {
            const a = projectWorldPoint(line.a.x,line.a.y,line.a.z);
            const b = projectWorldPoint(line.b.x,line.b.y,line.b.z);
            if (a && b) {
              const accepted = !!zoneTarget.counterweightAccepted;
              ctx.strokeStyle = accepted ? 'rgba(113,237,147,.98)' : 'rgba(103,183,255,.92)';
              ctx.lineWidth = accepted ? 5 : 3.5;
              ctx.setLineDash([]);
              ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
            }
          }
        }
      }
      const target = dropTargetForCarried(rootX);
      if (target && target.valid && (target.stack || target.socket)) {
        const targetY = target.socket ? target.y + carriedObject.sy * 0.5 : target.y + 0.06;
        dot(projectWorldPoint(target.x, targetY, target.z), true);
      }
    }
    ctx.restore();
  }

  function drawTerrainSectionOverlay(ctx) {
    if (!terrainSectionGuidesVisible) return;
    const playerX = character?.x ?? camera.x;
    const currentIndex = terrainSectionIndexAt(playerX);
    const cameraIndex = terrainSectionIndexAt(camera.x);
    const first = cameraIndex - 5;
    const last = cameraIndex + 5;
    const nearZ = PATH_OUTER_HALF;
    const farZ = -Math.min(18, Math.abs(WORLD.farZ));

    ctx.save();
    ctx.font = '800 9px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = first; i <= last; i++) {
      const b = terrainSectionBounds(i);
      const y0 = terrainGroundYAt(b.minX, 0) + 0.055;
      const y1 = terrainGroundYAt(b.maxX, 0) + 0.055;
      const p0 = projectWorldPoint(b.minX, y0, nearZ);
      const p1 = projectWorldPoint(b.maxX, y1, nearZ);
      const p2 = projectWorldPoint(b.maxX, y1, farZ);
      const p3 = projectWorldPoint(b.minX, y0, farZ);
      if (!p0 || !p1 || !p2 || !p3) continue;
      const current = i === currentIndex;
      const selected = i === terrainSelectedSectionIndex;
      const hidden = terrainHiddenSections.has(i);
      ctx.beginPath();
      ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.closePath();
      if (current) {
        ctx.fillStyle = 'rgba(103,226,198,.13)';
        ctx.fill();
      }
      ctx.strokeStyle = hidden ? 'rgba(255,116,116,.95)' : (selected ? 'rgba(255,79,149,.95)' : (current ? 'rgba(118,244,216,.95)' : 'rgba(223,238,233,.48)'));
      ctx.lineWidth = selected ? 2.6 : (current ? 2.2 : 1.15);
      ctx.setLineDash(hidden ? [5,4] : (selected && !current ? [7,3] : []));
      ctx.stroke();
      ctx.setLineDash([]);

      const labelPoint = projectWorldPoint(b.center, playSurfaceYAt(b.center) + 0.12, 0.25);
      if (labelPoint && labelPoint.x > -40 && labelPoint.x < editorOverlay.clientWidth + 40) {
        const typeTag = terrainSectionType(i) === 'normal' ? '' : ` · ${terrainSectionTypeLabel(i).toUpperCase()}`;
        const collisionTag = !terrainSectionCollisionEnabled(i)
        ? ' · NO COLLISION'
        : (terrainSectionType(i) === 'river' ? ' · FLAT BANK + WATER GAP' : '');
        const label = `S${i}${typeTag}${collisionTag}${hidden ? ' · HIDDEN' : ''}`;
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle = current ? 'rgba(31,69,65,.90)' : (selected ? 'rgba(72,30,51,.88)' : 'rgba(20,31,34,.68)');
        ctx.fillRect(labelPoint.x - tw*0.5, labelPoint.y - 10, tw, 18);
        ctx.fillStyle = current ? '#d9fff5' : (hidden ? '#ffd9d9' : '#edf5f2');
        ctx.fillText(label, labelPoint.x, labelPoint.y - 1);
      }
    }
    ctx.restore();
  }

  function worldGroupExclusionHandlePositions(group){
    if(!group||!worldGroupExclusionEditMode||group.id!==selectedWorldGroupId)return[];
    const b=worldGroupExclusionWorldBounds(group);if(!b)return[];
    return[['center',b.centerX,b.centerZ],['left',b.minX,b.centerZ],['right',b.maxX,b.centerZ],['far',b.centerX,b.minZ],['near',b.centerX,b.maxZ]].map(([kind,x,z])=>{
      const p=projectWorldPoint(x,terrainGroundYAt(x,z)+.055,z);return p&&{kind,...p};
    }).filter(Boolean);
  }

  function worldGroupExclusionHandleAt(clientX,clientY){
    if(!editMode||editorScope!=='environment'||!worldGroupExclusionEditMode)return null;
    const group=worldGroupById(selectedWorldGroupId);if(!group)return null;
    const rect=canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;
    return worldGroupExclusionHandlePositions(group).find(h=>Math.hypot(h.x-x,h.y-y)<=21)||null;
  }

  function drawWorldGroupExclusionGuide(ctx,group){
    if(!group||group.id!==selectedWorldGroupId)return;
    const b=worldGroupExclusionWorldBounds(group);if(!b||(!b.enabled&&!worldGroupExclusionEditMode))return;
    const corners=[[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]].map(([x,z])=>projectWorldPoint(x,terrainGroundYAt(x,z)+.04,z));
    if(corners.some(p=>!p))return;
    ctx.save();ctx.fillStyle=b.enabled?'rgba(89,190,171,.13)':'rgba(120,130,135,.08)';ctx.strokeStyle=b.enabled?'rgba(119,231,205,.9)':'rgba(160,170,174,.7)';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);for(let i=1;i<corners.length;i++)ctx.lineTo(corners[i].x,corners[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
    if(worldGroupExclusionEditMode){for(const h of worldGroupExclusionHandlePositions(group)){ctx.beginPath();ctx.arc(h.x,h.y,h.kind==='center'?8:7,0,Math.PI*2);ctx.fillStyle=h.kind==='center'?'#e1fff8':'#78e1c7';ctx.fill();ctx.strokeStyle='#244c43';ctx.lineWidth=1.5;ctx.stroke();}}
    const label=`GROUP EXCLUSION · ${b.width.toFixed(1)} × ${b.depth.toFixed(1)}m${b.enabled?'':' · OFF'}`;const c=projectWorldPoint(b.centerX,terrainGroundYAt(b.centerX,b.centerZ)+.1,b.centerZ);if(c){ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,c.x-tw*.5));const ly=Math.max(48,c.y-34);ctx.fillStyle='rgba(19,46,40,.88)';ctx.fillRect(lx,ly,tw,20);ctx.fillStyle='#dffff6';ctx.fillText(label,lx+7,ly+14);}ctx.restore();
  }

  function drawWorldGroupGuides(ctx){
    if(!editMode||editorScope!=='environment')return;
    for(const group of worldGroups()){
      const b=worldGroupBounds(group);if(!b)continue;const selected=group.id===selectedWorldGroupId;
      const y0=playSurfaceYAt(b.minX)+.05,y1=playSurfaceYAt(b.maxX)+.05;
      const pts=[projectWorldPoint(b.minX,y0,b.minZ),projectWorldPoint(b.maxX,y1,b.minZ),projectWorldPoint(b.maxX,y1,b.maxZ),projectWorldPoint(b.minX,y0,b.maxZ)];if(pts.some(p=>!p))continue;
      ctx.save();ctx.strokeStyle=selected?'rgba(255,205,111,.98)':'rgba(255,205,111,.34)';ctx.fillStyle=selected?'rgba(255,205,111,.065)':'rgba(255,205,111,.025)';ctx.lineWidth=selected?2.3:1.1;ctx.setLineDash(selected?[7,4]:[4,5]);ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
      if(selected){const origin=worldGroupOriginScreenPoint(group);if(origin){ctx.beginPath();ctx.arc(origin.x,origin.y,9,0,Math.PI*2);ctx.fillStyle='#ffd77d';ctx.fill();ctx.strokeStyle='#4a3920';ctx.lineWidth=1.8;ctx.stroke();const label=`${group.label||'World Group'} · ${worldGroupMembers(group.id).length} assets${worldGroupEditMode?' · MEMBERS UNLOCKED':' · LOCKED · DRAG DOT TO MOVE'}`;ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+14;ctx.fillStyle='rgba(47,38,24,.88)';ctx.fillRect(origin.x-tw*.5,origin.y-30,tw,19);ctx.fillStyle='#fff0c7';ctx.fillText(label,origin.x-tw*.5+7,origin.y-17);}}
      ctx.restore();
      if(selected)drawWorldGroupExclusionGuide(ctx,group);
    }
  }

  function drawEditorOverlay() {
    if (!editorOverlayCtx || !editorOverlay) return;
    const ctx = editorOverlayCtx;
    const w = editorOverlay.clientWidth;
    const h = editorOverlay.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (collisionDebugView) drawCollisionDebugOverlay(ctx);
    drawPlayerInteractionHints(ctx);
    drawTerrainSectionOverlay(ctx);
    if (!editMode) return;
    drawWorldGroupGuides(ctx);
    drawPuzzleEditorGuides(ctx);
    drawAuthoredSockets(ctx);
    drawSelectedCounterweightMechanism(ctx);

    // Thought Nodes can be world-owned or puzzle-owned. They are invisible in
    // play, so authoring shows their activation radius and label in screen space.
    for(const obj of allSceneObjects()){
      if(!obj || obj.deleted || obj.assetName!=='thought-trigger')continue;
      const floor=objectFloorWorldY(obj);
      const centre=projectWorldPoint(objectXNear(obj,camera.x),floor+0.10,obj.z);
      const edge=projectWorldPoint(objectXNear(obj,camera.x)+(Number(obj.thoughtRadius)||1.4),floor+0.10,obj.z);
      if(!centre||!edge)continue;
      const r=Math.max(12,Math.abs(edge.x-centre.x));
      ctx.save();
      ctx.strokeStyle=obj===selectedObject?'rgba(121,241,223,.95)':'rgba(121,241,223,.48)';
      ctx.fillStyle=obj===selectedObject?'rgba(70,210,190,.10)':'rgba(70,210,190,.05)';
      ctx.lineWidth=obj===selectedObject?2.5:1.5;ctx.setLineDash([6,5]);
      ctx.beginPath();ctx.arc(centre.x,centre.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(centre.x,centre.y,5,0,Math.PI*2);ctx.fillStyle=obj===selectedObject?'#dffff9':'rgba(121,241,223,.82)';ctx.fill();
      const label=(obj.thoughtText||'Thought').slice(0,34);
      ctx.font='800 10px -apple-system, BlinkMacSystemFont, sans-serif';
      const tw=ctx.measureText(label).width+12;
      ctx.fillStyle='rgba(15,42,40,.88)';ctx.fillRect(centre.x-tw*.5,centre.y-r-23,tw,18);
      ctx.fillStyle='#dffff9';ctx.fillText(label,centre.x-tw*.5+6,centre.y-r-10);
      ctx.restore();
    }

    // Camera Nodes are world-level authoring controls. They are invisible in
    // play, but the editor shows the trigger radius and the authored offsets.
    for(const obj of allSceneObjects()){
      if(!obj || obj.deleted || obj.assetName!=='camera-trigger')continue;
      const floor=objectFloorWorldY(obj);
      const centre=projectWorldPoint(objectXNear(obj,camera.x),floor+0.10,obj.z);
      const edge=projectWorldPoint(objectXNear(obj,camera.x)+(Number(obj.cameraNodeRadius)||4),floor+0.10,obj.z);
      if(!centre||!edge)continue;
      const r=Math.max(14,Math.abs(edge.x-centre.x));
      ctx.save();
      ctx.strokeStyle=obj===selectedObject?'rgba(184,171,255,.98)':'rgba(184,171,255,.52)';
      ctx.fillStyle=obj===selectedObject?'rgba(142,121,244,.10)':'rgba(142,121,244,.05)';
      ctx.lineWidth=obj===selectedObject?2.5:1.5;ctx.setLineDash([7,5]);
      ctx.beginPath();ctx.arc(centre.x,centre.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(centre.x,centre.y,5,0,Math.PI*2);ctx.fillStyle=obj===selectedObject?'#f2edff':'rgba(184,171,255,.86)';ctx.fill();
      const ox=Number(obj.cameraNodeOffsetX)||0,oy=Number(obj.cameraNodeOffsetY)||0,oz=Number(obj.cameraNodeOffsetZ)||0;
      const label=`CAM · X ${ox>=0?'+':''}${ox.toFixed(1)} · Y ${oy>=0?'+':''}${oy.toFixed(1)} · Z ${oz>=0?'+':''}${oz.toFixed(1)}`;
      ctx.font='800 10px -apple-system, BlinkMacSystemFont, sans-serif';
      const tw=ctx.measureText(label).width+12; ctx.fillStyle='rgba(36,29,67,.90)';
      ctx.fillRect(centre.x-tw*.5,centre.y-r-23,tw,18); ctx.fillStyle='#f2edff';
      ctx.fillText(label,centre.x-tw*.5+6,centre.y-r-10); ctx.restore();
    }

    // Show authored gameplay collision even when the object itself is partly
    // hidden by foreground dressing. The global collision viewer already draws
    // every collider, so this lighter editor pass is only needed when it is off.
    if (!collisionDebugView) for (const obj of collisionObjects()) {
      if (!editorObjectIsEditable(obj)) continue;
      if (obj === selectedObject) continue;
      const polys = collisionScreenPolygons(obj);
      if (!polys.length) continue;
      ctx.save();
      ctx.strokeStyle='rgba(226,161,92,.58)';
      ctx.lineWidth=1.25;
      ctx.setLineDash([3,3]);
      for(const poly of polys){
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    if (selectedObject && !selectedObject.deleted) {
      const b = objectScreenBounds(selectedObject);
      if (b) {
        ctx.save();
        ctx.strokeStyle = '#ff4f95';
        ctx.lineWidth = 3;
        ctx.setLineDash([7,3]);
        ctx.strokeRect(b.left-4, b.top-4, b.width+8, b.height+8);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(20,31,34,.78)';
        const depthLabel = selectionCycleInfo && selectionCycleInfo.objects.includes(selectedObject) && selectionCycleInfo.objects.length > 1
          ? `  DEPTH ${selectionCycleInfo.objects.indexOf(selectedObject)+1}/${selectionCycleInfo.objects.length}` : '';
        const layerLabel = selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked ? '  GAME LAYER' : '';
        const placementLabel = objectUsesFreePlacement(selectedObject) ? ' · FREE' : ' · GROUND';
        const groupLabel = worldGroupById(selectedObject.worldGroupId)?.label;
        const membershipLabel = groupLabel ? ` · ${groupLabel}` : '';
        const label = `${selectedObject.assetName}${layerLabel}${depthLabel}${placementLabel}${membershipLabel}  x ${selectedObject.x.toFixed(1)}  y ${objectFloorWorldY(selectedObject).toFixed(1)}  z ${selectedObject.z.toFixed(1)}`;
        ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
        const tw = ctx.measureText(label).width + 14;
        const lx = Math.max(4, Math.min(w-tw-4, b.left));
        const ly = Math.max(42, b.top-25);
        ctx.fillRect(lx, ly, tw, 19);
        ctx.fillStyle = '#f2f7f6';
        ctx.fillText(label, lx+7, ly+13);
        ctx.restore();
      }

      if (groundLineEditMode) {
        const drawX = selectedObject.wrap ? wrapX(selectedObject.x, camera.x) : selectedObject.x;
        const floorY = objectFloorWorldY(selectedObject);
        const a = projectWorldPoint(drawX - selectedObject.sx * 0.5, floorY, selectedObject.z);
        const b = projectWorldPoint(drawX + selectedObject.sx * 0.5, floorY, selectedObject.z);
        if (a && b) {
          ctx.save();
          ctx.strokeStyle = '#72e6d0';
          ctx.fillStyle = '#d7fff7';
          ctx.lineWidth = 3;
          ctx.setLineDash([8,4]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
          for (const point of [a,b]) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
          const label = `FLOOR ${Math.round(objectGroundLine(selectedObject) * 100)}%`;
          ctx.font = '800 10px -apple-system, BlinkMacSystemFont, sans-serif';
          const tw = ctx.measureText(label).width + 12;
          const cx = (a.x + b.x) * 0.5;
          const cy = (a.y + b.y) * 0.5;
          ctx.fillStyle = 'rgba(24,59,55,.90)';
          ctx.fillRect(cx - tw * 0.5, cy - 25, tw, 18);
          ctx.fillStyle = '#d7fff7';
          ctx.fillText(label, cx - tw * 0.5 + 6, cy - 12);
          ctx.restore();
        }
      }

      if (selectedObject.collision) {
        const polys = collisionScreenPolygons(selectedObject);
        if (polys.length) {
          ctx.save();
          ctx.fillStyle='rgba(228,164,89,.12)';
          ctx.strokeStyle='#e2a15c';
          ctx.lineWidth=2;
          ctx.setLineDash([4,3]);
          for(const poly of polys){
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          if (collisionEditMode) {
            ctx.setLineDash([]);
            for (const handle of collisionHandlePositions(selectedObject)) {
              ctx.beginPath();
              ctx.fillStyle = handle.index === collisionHandleIndex ? '#ff4f95' : '#f3c57f';
              ctx.strokeStyle = '#483225';
              ctx.lineWidth = 1.5;
              ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }
    }

    if (socketPlacementPiece) {
      ctx.save();
      ctx.fillStyle='rgba(20,31,34,.80)';
      ctx.font='800 11px -apple-system, BlinkMacSystemFont, sans-serif';
      const text=`SET SOCKET ${socketLabelForPiece(socketPlacementPiece).toUpperCase()} · tap a Socket Host`;
      const tw=ctx.measureText(text).width+18;
      ctx.fillRect((w-tw)/2,52,tw,24);
      ctx.fillStyle='#c9fff5';
      ctx.fillText(text,(w-tw)/2+9,68);
      ctx.restore();
    } else if (addAssetType) {
      ctx.save();
      ctx.fillStyle='rgba(20,31,34,.75)';
      ctx.font='800 11px -apple-system, BlinkMacSystemFont, sans-serif';
      const text=`PLACE ${addAssetType.toUpperCase()} · tap to add · drag to pan`;
      const tw=ctx.measureText(text).width+18;
      ctx.fillRect((w-tw)/2,52,tw,24);
      ctx.fillStyle='#f2f7f6';
      ctx.fillText(text,(w-tw)/2+9,68);
      ctx.restore();
    }
  }

  function wrapX(x, aroundX) {
    return x + Math.round((aroundX - x) / TILE_WIDTH) * TILE_WIDTH;
  }

  function objectXNear(obj, aroundX) {
    return obj?.wrap === false ? obj.x : wrapX(obj.x, aroundX);
  }


  function collisionWorldShapePoints(obj, sourcePoints, aroundX = obj.x) {
    if (!obj?.collision) return [];
    const c = obj.collision;
    const halfWidth = Math.max(0.001, c.halfWidth ?? Math.max(0.18, obj.sx * 0.34));
    const height = Math.max(0.001, c.height ?? Math.max(0.24, obj.sy * 0.66));
    const visual = assetVisualTransform(obj.assetName,obj.assetState);
    const visualAngle = (Number(visual.rotationDeg) || 0) * Math.PI / 180 + (Number(obj.runtimeRotation) || 0);
    const visualFlip = objectVisualFlip(obj);
    const vc = Math.cos(visualAngle), vs = Math.sin(visualAngle);
    const pivotX = aroundX + (Number(visual.offsetX) || 0);
    const pivotY = obj.y + (Number(visual.offsetY) || 0);
    const points = sourcePoints.map(point => {
      let lx = point.x * halfWidth;
      const ly = point.y * height;
      if (visualFlip) lx = -lx;
      return {
        x: pivotX + lx * vc - ly * vs,
        y: pivotY + lx * vs + ly * vc
      };
    });
    const angle = counterweightAngleFor(obj);
    if (!angle) return points;
    const mech = counterweightMechanism(obj);
    const u = mechanismVisualU(obj,Rig.clamp(Number(mech?.pivotX)||0.23,0,1));
    const pivot = {
      x: aroundX + (u - 0.5) * obj.sx,
      y: obj.y + Rig.clamp(Number(mech?.pivotY)||0.5,0,1) * obj.sy
    };
    return points.map(point => rotateAround(point.x,point.y,pivot.x,pivot.y,angle));
  }

  function collisionWorldShapes(obj, aroundX = obj.x) {
    if (!obj?.collision) return [];
    return normalisedCollisionShapes(obj.collision).map(points => collisionWorldShapePoints(obj,points,aroundX));
  }

  function collisionWorldPoints(obj, aroundX = obj.x) {
    return collisionWorldShapes(obj,aroundX)[0] || [];
  }

  function collisionRectScreenBounds(obj) {
    if (!obj?.collision) return null;
    const c = obj.collision;
    const drawX = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    const drawY = objectYAtDrawX(obj, drawX);
    const points = [
      projectWorldPoint(drawX - c.halfWidth, drawY, obj.z),
      projectWorldPoint(drawX + c.halfWidth, drawY, obj.z),
      projectWorldPoint(drawX - c.halfWidth, drawY + c.height, obj.z),
      projectWorldPoint(drawX + c.halfWidth, drawY + c.height, obj.z)
    ].filter(Boolean);
    if (points.length < 2) return null;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  function collisionScreenPolygons(obj) {
    const drawX = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    return collisionWorldShapes(obj, drawX)
      .map(points => points.map(point => projectWorldPoint(point.x, point.y, obj.z)).filter(Boolean))
      .filter(poly => poly.length >= 3);
  }

  function collisionScreenPolygon(obj) {
    return collisionScreenPolygons(obj)[0] || [];
  }

  function uniqueSorted(values) {
    values.sort((a, b) => a - b);
    return values.filter((value, index) => index === 0 || Math.abs(value - values[index - 1]) > 0.0001);
  }

  function polygonSpanAtY(points, worldY) {
    if (points.length < 2) return null;
    const xs = [];
    const eps = 0.0001;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (Math.abs(a.y - b.y) < eps) {
        if (Math.abs(worldY - a.y) <= eps) xs.push(a.x, b.x);
        continue;
      }
      const minY = Math.min(a.y, b.y) - eps;
      const maxY = Math.max(a.y, b.y) + eps;
      if (worldY < minY || worldY > maxY) continue;
      const t = (worldY - a.y) / (b.y - a.y);
      if (t < -eps || t > 1 + eps) continue;
      xs.push(a.x + (b.x - a.x) * t);
    }
    const vals = uniqueSorted(xs);
    if (!vals.length) return null;
    return { minX: vals[0], maxX: vals[vals.length - 1] };
  }

  function mergeCollisionSpans(spans) {
    const sorted=spans.filter(Boolean).sort((a,b)=>a.minX-b.minX);
    const merged=[];
    for(const span of sorted){
      const last=merged[merged.length-1];
      if(last && span.minX<=last.maxX+0.0001) last.maxX=Math.max(last.maxX,span.maxX);
      else merged.push({minX:span.minX,maxX:span.maxX});
    }
    return merged;
  }

  function collisionSpansAtY(obj, worldY) {
    return mergeCollisionSpans(collisionWorldShapes(obj,obj.x).map(points=>polygonSpanAtY(points,worldY)));
  }

  function collisionSpanAtY(obj, worldY) {
    const spans=collisionSpansAtY(obj,worldY);
    if(!spans.length)return null;
    return {minX:spans[0].minX,maxX:spans[spans.length-1].maxX};
  }

  function capsuleHalfWidthAtHeight(localY, capsule) {
    if (localY < 0 || localY > capsule.height) return 0;
    const r = Math.min(capsule.radius, capsule.height * 0.5);
    if (localY < r) {
      const dy = r - localY;
      return Math.sqrt(Math.max(0, r*r - dy*dy));
    }
    if (localY > capsule.height - r) {
      const dy = localY - (capsule.height - r);
      return Math.sqrt(Math.max(0, r*r - dy*dy));
    }
    return r;
  }

  function collisionBodySpans(obj, feetY) {
    const capsule = colliderWorld();
    const intervals=[];
    // Horizontal wall collision starts just above the character's authored foot
    // line.  This keeps the lower cap from snagging the platform she is already
    // standing on, while the rest of the capsule still blocks against adjacent
    // vertical rock faces.  Use a denser vertical sample so narrow ledges and
    // angled mountain collision cannot slip between sparse capsule slices.
    const minWorldY = feetY + PLAYER_COLLISION_FOOT_CLEARANCE;
    const minLocalY = Rig.clamp(minWorldY - (feetY + capsule.bottom), 0, capsule.height);
    const sampleCount = Math.max(5, PLAYER_COLLISION_SAMPLES);
    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / (sampleCount - 1);
      const localY = Rig.lerp(minLocalY, capsule.height, t);
      const y = feetY + capsule.bottom + localY;
      const half = capsuleHalfWidthAtHeight(localY, capsule) + PLAYER_COLLISION_SKIN;
      for(const span of collisionSpansAtY(obj,y)) intervals.push({minX:span.minX-half,maxX:span.maxX+half});
    }
    return mergeCollisionSpans(intervals);
  }

  function collisionBodyEnvelope(obj, feetY) {
    const spans=collisionBodySpans(obj,feetY);
    if(!spans.length)return null;
    return {minX:spans[0].minX,maxX:spans[spans.length-1].maxX};
  }

  function collisionTopHeightAtX(obj, worldX, aroundX = obj.x) {
    const ys = [];
    const eps = 0.0001;
    for(const points of collisionWorldShapes(obj,aroundX)){
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if (Math.abs(a.x - b.x) < eps) {
          if (Math.abs(worldX - a.x) <= eps) ys.push(a.y, b.y);
          continue;
        }
        const minX = Math.min(a.x, b.x) - eps;
        const maxX = Math.max(a.x, b.x) + eps;
        if (worldX < minX || worldX > maxX) continue;
        const t = (worldX - a.x) / (b.x - a.x);
        if (t < -eps || t > 1 + eps) continue;
        ys.push(a.y + (b.y - a.y) * t);
      }
    }
    const vals = uniqueSorted(ys);
    return vals.length ? vals[vals.length - 1] : -Infinity;
  }

  function collisionHandlePositions(obj) {
    const bounds = collisionRectScreenBounds(obj);
    if (!bounds || !obj?.collision) return [];
    const width = Math.max(1, bounds.right - bounds.left);
    const height = Math.max(1, bounds.bottom - bounds.top);
    return selectedCollisionShapePoints(obj.collision).map((point, index) => ({
      index,
      x: bounds.left + ((point.x + 1) * 0.5) * width,
      y: bounds.bottom - point.y * height
    }));
  }

  function collisionObjects() {
    return allSceneObjects().filter(obj => {
      if (obj === pushingObject) return false;
      if (obj.deleted || obj.carried || obj.cartRailAnimating || obj.counterweightBoundTo || !obj.collision) return false;
      // Collision geometry can still exist on non-solid props so carrying,
      // placement and editor tooling know their shape. Only Solid objects
      // should physically block the player or other moving gameplay objects.
      if (!objectHasBehaviour(obj, 'solid')) return false;
      // Keep a loose plank non-blocking so its end pickup point remains easy to
      // reach, and so simply dropping it across a gap cannot bypass the puzzle.
      if (isCounterweightPlank(obj) && !obj.socketedTo) return false;
      return true;
    });
  }

  function isPushableObject(obj) {
    return !!obj && !obj.deleted && !obj.carried && !obj.cartRailAnimating && !obj.cartRailLocked && obj.category === 'gameplay' && objectHasBehaviour(obj, 'pushable');
  }

  function isCarryableObject(obj) {
    // The loose wheel is deliberately inspect/combine-only. It becomes
    // physically carryable only after the axle pin has been fitted and the
    // object swaps to cart-wheel-ready.
    if (isLooseCartWheel(obj)) return false;
    return !!obj && !obj.deleted && !obj.carried && obj.category === 'gameplay'
      && (objectHasBehaviour(obj, 'carryable') || obj.gameplayType === 'crate');
  }

  function isGameplayCrate(obj, includeCarried = false) {
    // "Gameplay crate" is the stacking semantic, not the player-collision
    // semantic. Counterweight logs remain stackable even after they bind to the
    // plank; collisionObjects()/isSupportSurfaceObject() separately keep those
    // bound logs non-blocking and non-climbable for the player.
    return !!obj && !obj.deleted && (includeCarried || !obj.carried) && obj.category === 'gameplay'
      && (objectHasBehaviour(obj, 'stackable') || obj.gameplayType === 'crate');
  }

  function isBrokenHandcart(obj) {
    return !!obj && !obj.deleted && canonicalStateAssetName(obj.assetName)==='handcart' && (obj.assetState || inferredAssetState(obj.assetName))==='broken';
  }

  function isLooseCartWheel(obj) {
    return !!obj && !obj.deleted && obj.assetName === 'cart-wheel-loose';
  }

  function isReadyCartWheel(obj) {
    return !!obj && !obj.deleted && obj.assetName === 'cart-wheel-ready';
  }

  function isAxlePinObject(obj) {
    return !!obj && !obj.deleted && obj.assetName === 'axle-pin';
  }

  function nearestGameplayObject(predicate, range = ACTION_RANGE) {
    const characterXNow = camera.x + character.screenOffsetX;
    let best = null;
    let bestDistance = Infinity;
    for (const obj of allSceneObjects()) {
      if (!predicate(obj)) continue;
      const depth = obj.collision?.depth ?? 0.9;
      if (Math.abs((obj.z ?? pathZ) - pathZ) > Math.max(1.35, depth)) continue;
      const ox = objectXNear(obj, characterXNow);
      const shapeXs = obj.collision ? collisionWorldShapes(obj, ox).flatMap(points => points.map(point => point.x)) : [];
      const minX = shapeXs.length ? Math.min(...shapeXs) : ox - Math.abs(Number(obj.sx) || 0.4) * 0.48;
      const maxX = shapeXs.length ? Math.max(...shapeXs) : ox + Math.abs(Number(obj.sx) || 0.4) * 0.48;
      const distance = characterXNow < minX ? minX - characterXNow : (characterXNow > maxX ? characterXNow - maxX : 0);
      if (distance <= range && distance < bestDistance) {
        best = obj;
        bestDistance = distance;
      }
    }
    return best ? { obj:best, distance:bestDistance } : null;
  }

  function nearestPuzzleContextAction() {
    if (editMode || inventoryOpen || interactionState || jumping) return null;
    const broken = nearestGameplayObject(isBrokenHandcart, 0.82);
    if (carriedObject && isReadyCartWheel(carriedObject) && broken?.obj) {
      return { type:'use-wheel', label:'USE', obj:broken.obj };
    }
    const axlePin = !carriedObject ? nearestGameplayObject(isAxlePinObject, 0.72) : null;
    if (axlePin?.obj) {
      return { type:'pickup-axle-pin', label:'PICK UP', obj:axlePin.obj };
    }
    if (!carriedObject) {
      const looseWheel = nearestGameplayObject(isLooseCartWheel, 0.74)?.obj || null;
      if (looseWheel) {
        if (inventoryItemCount('axle-pin') > 0 && wheelCombinePrimed.has(looseWheel.id)) {
          return { type:'combine-wheel', label:'COMBINE', obj:looseWheel };
        }
        return { type:'inspect-wheel', label:'INSPECT', obj:looseWheel };
      }
      const readyWheel = nearestGameplayObject(isReadyCartWheel, 0.74)?.obj || null;
      if (readyWheel) return { type:'pickup-ready-wheel', label:'PICK UP', obj:readyWheel };
    }
    if (broken?.obj) {
      return { type:'inspect-broken-cart', label:'INSPECT', obj:broken.obj };
    }
    return null;
  }

  function performPuzzleContextAction(action) {
    if (!action?.type) return false;
    if (puzzleThoughtTimer) {
      clearTimeout(puzzleThoughtTimer);
      puzzleThoughtTimer = 0;
    }
    hintEl.classList.remove('puzzle-thought');
    if (action.type === 'pickup-axle-pin' && action.obj) {
      action.obj.deleted = true;
      recordObjectEdit(action.obj);
      addInventoryItem('axle-pin', 1, action.obj.puzzleInstanceId || action.obj.id || null);
      showPuzzleThought('A solid metal axle pin. This looks like it belongs to a wheel.', 4300);
      return true;
    }
    if (action.type === 'inspect-wheel' && action.obj && isLooseCartWheel(action.obj)) {
      if (inventoryItemCount('axle-pin') > 0) {
        wheelCombinePrimed.add(action.obj.id);
        showPuzzleThought('I think my axle pin will fit that wheel.', 4300);
      } else {
        showPuzzleThought('A loose cart wheel. It looks usable, but it needs a way to attach.', 4300);
      }
      return true;
    }
    if (action.type === 'combine-wheel' && action.obj && isLooseCartWheel(action.obj)) {
      if ((inventoryItemCount('axle-pin') || 0) <= 0) return false;
      removeInventoryItem('axle-pin', 1);
      const wheel = action.obj;
      wheel.assetName = 'cart-wheel-ready';
      wheel.texture = textures['cart-wheel-ready'];
      wheel.groundLine = assetGroundLineDefault('cart-wheel-ready');
      wheel.collision = behaviourCollisionFor('cart-wheel-ready', wheel.sx, wheel.sy, wheel.collision);
      wheelCombinePrimed.delete(wheel.id);
      recordObjectEdit(wheel);
      showPuzzleThought('That fits. I think I can try this on the cart now.', 4700);
      return true;
    }
    if (action.type === 'pickup-ready-wheel' && action.obj && isReadyCartWheel(action.obj)) {
      startPickup(action.obj);
      return true;
    }
    if (action.type === 'use-wheel' && action.obj && carriedObject && isReadyCartWheel(carriedObject)) {
      const cart = action.obj;
      const facingFlip = objectVisualFlip(cart);
      cart.assetName = 'handcart';
      cart.texture = textures.handcart;
      cart.gameplayType = 'pushable';
      cart.assetState = 'repaired';
      cart.groundLine = assetGroundLineDefault('handcart','repaired');
      cart.sx = cart.sy * (assetAspect.handcart || (620 / 255));
      // The abandoned cart can be authored off the road. Repair is the moment
      // it becomes a gameplay vehicle: snap it to the path and preserve the
      // way it was visually facing before the state swap.
      cart.flip = facingFlip !== !!assetVisualTransform('handcart','repaired').flip;
      cart.gameplayLayerLocked = true;
      cart.freePlacement = false;
      cart.z = pathZ;
      cart.y = playSurfaceYAt(cart.x) - cart.groundLine * cart.sy;
      cart.runtimeRotation = 0;
      cart.cartRailAnimating = false;
      cart.cartRailLocked = false;
      cart.cartRailElapsed = 0;
      cart.collision = behaviourCollisionFor('handcart', cart.sx, cart.sy, cart.collision,'repaired');
      cart.collisionOverride = false;
      recordObjectEdit(cart);
      carriedObject.deleted = true;
      recordObjectEdit(carriedObject);
      carriedObject = null;
      interactionState = null;
      settleGameplayCrates();
      showPuzzleThought('That did it. The cart should move now.', 4000);
      return true;
    }
    if (action.type === 'inspect-broken-cart') {
      const text = carriedObject && isReadyCartWheel(carriedObject)
        ? 'This repaired wheel looks like it should fit the cart.'
        : 'A broken cart. Maybe it would work with a new wheel.';
      showPuzzleThought(text, 4300);
      return true;
    }
    return false;
  }

  const shownPuzzleThoughts = new Set();
  const wheelCombinePrimed = new Set();
  let puzzleThoughtTimer = 0;

  function showPuzzleThought(text, duration = 4200) {
    if (!text) return false;
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
    if (puzzleThoughtTimer) clearTimeout(puzzleThoughtTimer);
    hintEl.textContent = text;
    hintEl.classList.add('puzzle-thought');
    hintEl.classList.remove('hidden');
    puzzleThoughtTimer = window.setTimeout(() => {
      hintEl.classList.add('hidden');
      hintEl.classList.remove('puzzle-thought');
      puzzleThoughtTimer = 0;
    }, duration);
    return true;
  }

  function showPuzzleThoughtOnce(key, text) {
    if (!key || !text || shownPuzzleThoughts.has(key)) return false;
    shownPuzzleThoughts.add(key);
    return showPuzzleThought(text, 4600);
  }

  const thoughtTriggerInside = new Set();

  function thoughtTriggerKey(obj) {
    return `thought:${obj?.puzzleInstanceId || 'scene'}:${obj?.puzzleObjectId || obj?.id || 'node'}`;
  }

  function updatePuzzleThoughts() {
    // A newly-entered Thought Trigger is allowed to interrupt an older thought.
    // showPuzzleThought() clears the previous timer and replaces its text, so the
    // player always sees the most recent contextual observation.
    if (introLocked || editMode || inventoryOpen || interactionState) return;
    const candidates=[];
    for (const obj of allSceneObjects()) {
      if (!obj || obj.deleted || obj.assetName !== 'thought-trigger' || !obj.thoughtText) continue;
      const radius=Rig.clamp(Number(obj.thoughtRadius)||1.4,.25,8);
      const dx=objectXNear(obj,character.x)-character.x;
      const dz=(Number(obj.z)||0)-(Number(character.z)||pathZ);
      const distance=Math.hypot(dx,dz);
      const key=thoughtTriggerKey(obj);
      if(distance>radius){thoughtTriggerInside.delete(key);continue;}
      if(thoughtTriggerInside.has(key))continue;
      thoughtTriggerInside.add(key);
      if(obj.thoughtOnce!==false && shownPuzzleThoughts.has(key))continue;
      candidates.push({obj,key,distance});
    }
    if(!candidates.length)return;
    candidates.sort((a,b)=>a.distance-b.distance);
    const hit=candidates[0];
    if(hit.obj.thoughtOnce!==false)shownPuzzleThoughts.add(hit.key);
    showPuzzleThought(hit.obj.thoughtText,4600);
  }

  function isSupportSurfaceObject(obj) {
    if (!obj || obj.deleted || obj.carried || obj.counterweightBoundTo || !obj.collision) return false;
    // A loose counterweight plank is an interactable prop, not a bridge.
    // It only becomes a walk/support surface after being attached to its pivot.
    if (isCounterweightPlank(obj) && !obj.socketedTo) return false;
    return objectHasBehaviour(obj, 'supportSurface') || !!obj.collision.platform;
  }

  function crateHalfWidth(obj) {
    return obj?.collision?.halfWidth ?? Math.max(0.18, (obj?.sx || 0.9) * CRATE_HALF_WIDTH_FACTOR);
  }

  function crateHeight(obj) {
    if (isGameplayCrate(obj)) return STACK_ITEM_HEIGHT;
    return obj?.collision?.height ?? Math.max(0.24, (obj?.sy || 0.88) * CRATE_COLLISION_HEIGHT_FACTOR);
  }


  function carriedCollisionRectAtRoot(rootX, clearanceHeight = jumpOffset, facing = character.lastFacing >= 0 ? 1 : -1, obj = carriedObject) {
    if (!obj) return null;
    const floorY = playSurfaceYAt(rootX) + Math.max(0, clearanceHeight);
    const mechanismCarry = isCounterweightPlank(obj);
    const halfWidth = mechanismCarry
      ? 0.34
      : (obj.collision?.halfWidth ?? crateHalfWidth(obj)) + CARRIED_COLLISION_SKIN;
    const height = mechanismCarry
      ? 0.52
      : Math.max(0.16, obj.collision?.height ?? crateHeight(obj));
    // Match the non-pose carry transform closely enough for gameplay collision;
    // animation bob is intentionally ignored so the collision stays stable.
    const centreX = rootX + facing * CARRY_FORWARD;
    const bottomY = floorY + CHARACTER_SOLE_ART_LOCAL_OFFSET * character.scale + CARRY_BOTTOM;
    return {
      minX: centreX - halfWidth,
      maxX: centreX + halfWidth,
      minY: bottomY + CARRIED_COLLISION_SKIN,
      maxY: bottomY + height - CARRIED_COLLISION_SKIN
    };
  }

  function placedCollisionRect(obj, x, y) {
    if (!obj) return null;
    const halfWidth = (obj.collision?.halfWidth ?? crateHalfWidth(obj)) + CARRIED_COLLISION_SKIN;
    const height = Math.max(0.16, obj.collision?.height ?? crateHeight(obj));
    return {
      minX: x - halfWidth,
      maxX: x + halfWidth,
      minY: y + CARRIED_COLLISION_SKIN,
      maxY: y + height - CARRIED_COLLISION_SKIN
    };
  }

  function rectIntersectsCollisionObject(rect, obstacle) {
    if (!rect || !obstacle?.collision || obstacle.deleted || obstacle.carried) return false;
    const depth = obstacle.collision.depth ?? 0.8;
    if (Math.abs(obstacle.z - pathZ) > depth) return false;
    const samples = 7;
    for (let i = 0; i < samples; i += 1) {
      const t = samples === 1 ? 0.5 : i / (samples - 1);
      const y = Rig.lerp(rect.minY, rect.maxY, t);
      const spans = collisionSpansAtY(obstacle, y);
      for(const span of spans){
        if (rect.maxX > span.minX + CARRIED_COLLISION_SKIN && rect.minX < span.maxX - CARRIED_COLLISION_SKIN) return true;
      }
    }
    return false;
  }

  function carriedCollisionBlockedAtCamera(cameraX, clearanceHeight = jumpOffset, facing = character.lastFacing >= 0 ? 1 : -1) {
    if (!carriedObject) return false;
    const rootX = cameraX + character.screenOffsetX;
    const rect = carriedCollisionRectAtRoot(rootX, clearanceHeight, facing, carriedObject);
    for (const obstacle of collisionObjects()) {
      if (obstacle === carriedObject) continue;
      if (rectIntersectsCollisionObject(rect, obstacle)) return true;
    }
    return false;
  }

  function resolveCarriedObjectMove(currentCameraX, proposedCameraX, clearanceHeight) {
    if (!carriedObject || Math.abs(proposedCameraX - currentCameraX) < 0.000001) return proposedCameraX;
    // The held object remains in front of the character even when she backs up,
    // so collision must use facing, not movement direction.
    const facing = character.lastFacing >= 0 ? 1 : -1;
    if (!carriedCollisionBlockedAtCamera(proposedCameraX, clearanceHeight, facing)) return proposedCameraX;

    // If the current pose is already intersecting, never trap the player: allow
    // a retreat away from the carried item's forward side.
    if (carriedCollisionBlockedAtCamera(currentCameraX, clearanceHeight, facing)) {
      const retreatDirection = -facing;
      if (Math.sign(proposedCameraX - currentCameraX) === retreatDirection) return proposedCameraX;
      return currentCameraX;
    }

    // Binary-search the final few centimetres so contact feels like a solid
    // combined character+item body rather than snapping a whole frame back.
    let safe = currentCameraX;
    let blocked = proposedCameraX;
    for (let i = 0; i < 9; i += 1) {
      const mid = (safe + blocked) * 0.5;
      if (carriedCollisionBlockedAtCamera(mid, clearanceHeight, facing)) blocked = mid;
      else safe = mid;
    }
    return safe;
  }

  function pushableYAtX(obj, worldX, floorOffset = 0) {
    const baseY = terrainAnchorBaseY(worldX, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName);
    return baseY + (Number(floorOffset) || 0) - objectGroundLine(obj) * obj.sy;
  }

  function pushableBlockedAt(obj, worldX, floorOffset = 0) {
    if (!obj?.collision) return false;
    const y = pushableYAtX(obj, worldX, floorOffset);
    const rect = placedCollisionRect(obj, worldX, y);
    for (const obstacle of collisionObjects()) {
      if (obstacle === obj) continue;
      // Bridge abutments are intended to receive the cart later. Do not let
      // their broad authored collision stop the prototype before the gap logic
      // has a chance to take ownership in the next puzzle pass.
      if (obstacle.assetName === 'bridge-left' || obstacle.assetName === 'bridge-right') continue;
      if (rectIntersectsCollisionObject(rect, obstacle)) return true;
    }
    return false;
  }

  function resolvePushableMove(obj, currentX, proposedX, floorOffset = 0) {
    if (!obj || Math.abs(proposedX - currentX) < 0.000001) return proposedX;
    if (!pushableBlockedAt(obj, proposedX, floorOffset)) return proposedX;
    if (pushableBlockedAt(obj, currentX, floorOffset)) return currentX;
    let safe = currentX;
    let blocked = proposedX;
    for (let i = 0; i < 9; i += 1) {
      const mid = (safe + blocked) * 0.5;
      if (pushableBlockedAt(obj, mid, floorOffset)) blocked = mid;
      else safe = mid;
    }
    return safe;
  }

  function movePushedObject(obj, delta) {
    if (!obj || Math.abs(delta) < 0.000001) return;
    obj.x += delta;
    obj.y = pushableYAtX(obj, obj.x, pushingFloorOffset);
    const wheelRadius = Math.max(0.12, obj.sy * (87 / 255));
    obj.wheelRotation = (Number(obj.wheelRotation) || 0) - delta / wheelRadius;
  }

  function cartPathForObject(obj) {
    if (!obj?.puzzleInstanceId || obj.assetName !== 'handcart') return null;
    const instance = activePuzzleInstances.get(obj.puzzleInstanceId);
    if (!instance) return null;
    const path = puzzleCartPathWorld(instance.marker);
    return path?.enabled ? { instance, path } : null;
  }

  function cartBridgeCollision(obj) {
    const landedProfile=assetStateProfile('handcart','landed');
    const authored=collisionFromAssetDefault('handcart',obj.sx,obj.sy,'landed');
    if(landedProfile && Object.prototype.hasOwnProperty.call(landedProfile,'collision')) {
      return authored ? {...authored,platform:!!assetBehaviours('handcart','landed').supportSurface,cartBridge:true,assetState:'landed'} : null;
    }
    if(authored) return {...authored,platform:true,cartBridge:true,assetState:'landed'};
    const points = [{x:-1.00,y:0.59},{x:1.00,y:0.59},{x:1.00,y:0.72},{x:-1.00,y:0.72}];
    return {halfWidth:Math.max(0.4,obj.sx*0.49),height:Math.max(0.4,obj.sy),depth:Math.max(0.70,obj.sx*0.18),platform:true,points:points.map(p=>({...p})),shapes:[{points:points.map(p=>({...p}))}],behaviourGenerated:false,cartBridge:true,assetState:'landed'};
  }

  function maybeStartCartRail(obj, previousX = null) {
    if (!obj || obj.cartRailAnimating || obj.cartRailLocked || obj.assetName !== 'handcart' || (obj.assetState && obj.assetState !== 'repaired')) return false;
    const setup = cartPathForObject(obj);
    if (!setup) return false;
    const { path } = setup;
    const direction = Math.sign(path.land.x - path.start.x) || 1;
    const movedDirection = Math.sign(obj.x - (Number.isFinite(previousX) ? previousX : obj.x));
    if (movedDirection && movedDirection !== direction) return false;
    const reached = direction > 0 ? obj.x >= path.start.x : obj.x <= path.start.x;
    if (!reached) return false;
    if (Math.abs((obj.z ?? pathZ) - path.start.z) > 0.9) return false;
    if (pushingObject === obj) stopPush(true);
    obj.cartRailAnimating = true;
    obj.cartRailLocked = false;
    obj.cartRailElapsed = 0;
    obj.runtimeRotation = 0;
    obj.freePlacement = true;
    obj.gameplayLayerLocked = false;
    obj.x = path.start.x;
    obj.y = path.start.y;
    obj.z = path.start.z;
    showPuzzleThought('There it goes…', 1800);
    return true;
  }

  function updateCartRailAnimations(dt) {
    for (const obj of allSceneObjects()) {
      if (!obj?.cartRailAnimating || obj.deleted || obj.assetName !== 'handcart') continue;
      const setup = cartPathForObject(obj);
      if (!setup) { obj.cartRailAnimating=false; continue; }
      const { path } = setup;
      const duration = Math.max(0.75, Number(path.duration) || 2.75);
      const previous = {x:obj.x,y:obj.y,z:obj.z};
      obj.cartRailElapsed = (Number(obj.cartRailElapsed)||0) + dt;
      const rawT = Rig.clamp(obj.cartRailElapsed / duration, 0, 1);
      const timed=cartPathTimedState(path,rawT);
      const point = cubicBezierPoint(path.start,path.c1,path.c2,path.land,timed.t);
      obj.x=point.x;obj.y=point.y;obj.z=point.z;
      const travel=Math.hypot(obj.x-previous.x,obj.y-previous.y,obj.z-previous.z);
      const horizontalSign=Math.sign(obj.x-previous.x)||1;
      const wheelRadius=Math.max(0.12,obj.sy*(87/255));
      obj.wheelRotation=(Number(obj.wheelRotation)||0)-horizontalSign*travel/wheelRadius;
      obj.runtimeRotation=(Number(path.finalRotationDeg)||0)*Math.PI/180*smooth01(Rig.clamp((timed.distanceFraction-0.10)/0.90,0,1));
      if(rawT>=1){
        obj.cartRailAnimating=false;
        obj.cartRailLocked=true;
        obj.cartRailElapsed=duration;
        obj.x=path.land.x;obj.y=path.land.y;obj.z=path.land.z;
        obj.runtimeRotation=(Number(path.finalRotationDeg)||0)*Math.PI/180;
        obj.assetState='landed';
        obj.groundLine=assetGroundLineDefault('handcart','landed');
        obj.gameplayType='bridge-cart';
        obj.freePlacement=true;
        obj.gameplayLayerLocked=false;
        obj.collision=cartBridgeCollision(obj);
        obj.collisionOverride=false;
        moveObjectToCorrectCollection(obj);
        sortSceneCollections();
        recordObjectEdit(obj);
        showPuzzleThought('That should hold. I can get across now.', 3600);
      }
    }
  }

  function dropTargetIsClear(obj, target, ignoredObjects = null) {
    if (!obj || !target) return false;
    const rect = placedCollisionRect(obj, target.x, target.y);
    for (const obstacle of collisionObjects()) {
      if (obstacle === obj) continue;
      if (ignoredObjects?.has(obstacle)) continue;
      if (rectIntersectsCollisionObject(rect, obstacle)) return false;
    }
    return true;
  }

  function cratesOverlapForStack(a, b) {
    if (!(a.gameplayLayerLocked && b.gameplayLayerLocked) && Math.abs(a.z - b.z) > 0.28) return false;
    const ax = objectXNear(a, b.x);
    const reach = Math.min(crateHalfWidth(a), crateHalfWidth(b)) * 0.92;
    return Math.abs(ax - b.x) <= Math.max(0.16, reach);
  }

  function stackableFitsSupport(obj, support, aroundX) {
    if (!obj || !support || !support.collision) return false;
    const depth = support.collision.depth ?? 0.8;
    if (Math.abs((obj.z ?? pathZ) - support.z) > Math.max(0.34, depth)) return false;
    const half = Math.max(0.08, crateHalfWidth(obj) * 0.72);
    const sampleXs = [aroundX - half, aroundX, aroundX + half];
    const tops = sampleXs.map(x => collisionTopHeightAtX(support, x));
    return tops.every(Number.isFinite) ? Math.min(...tops) : -Infinity;
  }

  function restYForGameplayObject(obj, aroundX = obj.x, settled = null, allowAnySupport = false) {
    const ground = obj?.category === 'gameplay' && obj?.gameplayLayerLocked
      ? playSurfaceYAt(aroundX)
      : terrainGroundYAt(aroundX, obj?.z ?? pathZ);
    if (!isGameplayCrate(obj)) return ground;
    let baseY = ground;
    const currentBase = Number.isFinite(obj.y) ? obj.y : baseY;
    const fixedSupports = allSceneObjects().filter(other => other !== obj && isSupportSurfaceObject(other) && !isGameplayCrate(other));
    const supports = settled ? [...fixedSupports, ...settled] : allSceneObjects().filter(other => other !== obj && isSupportSurfaceObject(other));
    for (const other of supports) {
      if (other === obj) continue;
      let top = -Infinity;
      if (isGameplayCrate(other)) {
        // Stackable props use the authored stack column rule rather than a
        // width-fit test. A wide log can sit on a narrow log and vice versa.
        const otherX = objectXNear(other, aroundX);
        const sameDepth = obj.gameplayLayerLocked && other.gameplayLayerLocked
          ? true
          : Math.abs((obj.z ?? pathZ) - other.z) <= 0.34;
        if (sameDepth && Math.abs(otherX - aroundX) <= STACK_COLUMN_ALIGN_TOLERANCE) {
          top = other.y + STACK_ITEM_HEIGHT;
        }
      } else {
        top = stackableFitsSupport(obj, other, aroundX);
      }
      if (!Number.isFinite(top)) continue;
      if (!allowAnySupport && top > currentBase + 0.10) continue;
      if (top > baseY) baseY = top;
    }
    return baseY;
  }

  function settleGameplayCrates() {
    const crates = allSceneObjects().filter(isGameplayCrate).sort((a,b) => a.y - b.y || a.x - b.x);
    const settled = [];
    for (const crate of crates) {
      if (crate.counterweightBoundTo) {
        const plank = counterweightPlankById(crate.counterweightBoundTo.plankId);
        if (plank) updateBoundCounterweightLog(plank,crate);
        settled.push(crate);
        continue;
      }
      if (crate.gameplayLayerLocked) crate.z = pathZ;
      if (crate.collision && (crate.collision.behaviourGenerated || crate.gameplayType === 'crate' || objectHasBehaviour(crate, 'stackable'))) {
        crate.collision.halfWidth = Math.max(0.12, crate.sx * CRATE_HALF_WIDTH_FACTOR);
        crate.collision.height = STACK_ITEM_HEIGHT;
      }
      if (crate.collision) crate.collision.platform = !!assetBehaviours(crate.assetName).supportSurface || crate.gameplayType === 'crate';
      crate.y = restYForGameplayObject(crate, crate.x, settled);
      settled.push(crate);
    }
  }

  function platformOffsetFor(obj, sampleX, terrainReferenceX = sampleX) {
    if (!isSupportSurfaceObject(obj)) return -Infinity;
    if (isCounterweightPlank(obj) && !counterweightPlankWalkable(obj)) return -Infinity;
    const platformTop = collisionTopHeightAtX(obj, sampleX);
    if (!Number.isFinite(platformTop)) return -Infinity;
    return platformTop - playSurfaceYAt(terrainReferenceX);
  }

  function waterSafetySupportAt(rootX) {
    const index = terrainSectionIndexAt(rootX);
    if (terrainSectionType(index) !== 'river' || !pointInsideRiverCollisionGap(rootX, pathZ, index)) return null;
    const p = riverProfileAtZ(index, pathZ);
    return { obj:null, offset:p.waterY - playSurfaceYAt(rootX), source:'water' };
  }

  function walkableSupportAt(characterX, ceiling = Infinity, direction = 0) {
    // Three clean layers only:
    // 1) stable terrain floor where enabled,
    // 2) authored Support Surface collision,
    // 3) river water as the lowest safety floor if nothing spans the gap.
    const capsule = colliderWorld();
    const rootX = characterX - capsule.offsetX;
    let best = terrainCollisionAvailableAt(rootX, pathZ)
      ? { obj:null, offset:0, source:'terrain' }
      : waterSafetySupportAt(rootX);
    const probe = direction ? direction * capsule.footProbe : 0;
    const sampleXs = direction ? [characterX, characterX + probe] : [characterX];
    for (const obj of collisionObjects()) {
      if (!isSupportSurfaceObject(obj)) continue;
      const c = obj.collision;
      const depth = c.depth ?? 0.82;
      if (Math.abs(obj.z - pathZ) > depth) continue;
      for (const x of sampleXs) {
        const offset = platformOffsetFor(obj, x, rootX);
        if (!Number.isFinite(offset) || offset > ceiling + 0.08) continue;
        if (!best || offset > best.offset) best = { obj, offset, source:'platform' };
      }
    }
    return best;
  }

  function platformUnder(characterX, ceiling = Infinity) {
    return walkableSupportAt(characterX, ceiling, 0);
  }

  function editorFallbackSupportAt(characterX) {
    const capsule = colliderWorld();
    const rootX = characterX - capsule.offsetX;
    // This only matters for an intentionally disabled whole section. Rivers have
    // their own real water safety floor now.
    return {
      obj:null,
      offset:terrainGroundYAt(rootX, pathZ) - playSurfaceYAt(rootX),
      source:'editor-fallback'
    };
  }

  function editorSafeSupportAt(characterX, ceiling = Infinity, direction = 0) {
    return walkableSupportAt(characterX, ceiling, direction) || editorFallbackSupportAt(characterX);
  }

  function platformIsWalkableFrom(obj, proposedX, currentOffset, airborne) {
    if (!isSupportSurfaceObject(obj)) return false;
    const capsule = colliderWorld();
    const rootX = proposedX - capsule.offsetX;
    const topOffset = platformOffsetFor(obj, proposedX, rootX);
    if (!Number.isFinite(topOffset)) return false;
    if (airborne) return currentOffset >= topOffset - PLAYER_COLLISION_SKIN;
    return topOffset <= currentOffset + capsule.stepUp + 0.025;
  }

  function resolveStaticBodyPenetration(cameraX, feetWorldY, groundedSupport = null) {
    const offset = character.screenOffsetX;
    const capsule = colliderWorld();
    let centreX = cameraX + offset + capsule.offsetX;
    let changed = false;

    // Run a few passes so overlapping stacked colliders can resolve cleanly.
    for (let pass = 0; pass < 3; pass += 1) {
      let passChanged = false;
      for (const obj of collisionObjects()) {
        // The swept movement resolver already tests the full shape of the
        // support we are standing on. Do not let this post-move safety pass
        // reinterpret the uphill side of that same sloped support as a wall
        // and push the capsule downhill. Other colliders remain fully active.
        if (obj === groundedSupport) continue;
        const c = obj.collision;
        if (!c) continue;
        const depth = c.depth ?? 0.8;
        if (Math.abs(obj.z - pathZ) > depth) continue;

        // Do not skip an entire object merely because the capsule centre is on
        // one of its walkable ledges. Complex mountain assets can have a low
        // support beside a much taller face; the low ledge is valid under the
        // feet, but the taller neighbouring face must still push the body out.
        // collisionBodySpans() naturally ignores geometry below the foot line.
        const spans = collisionBodySpans(obj, feetWorldY);
        const span = spans.find(candidate => centreX > candidate.minX && centreX < candidate.maxX);
        if (!span) continue;

        const leftDistance = centreX - span.minX;
        const rightDistance = span.maxX - centreX;
        centreX = leftDistance <= rightDistance ? span.minX : span.maxX;
        passChanged = true;
        changed = true;
      }
      if (!passChanged) break;
    }

    return changed ? centreX - capsule.offsetX - offset : cameraX;
  }

  function resolveObstacleMove(currentCameraX, proposedCameraX, clearanceHeight, airborne = false) {
    const offset = character.screenOffsetX;
    const capsule = colliderWorld();
    const currentRootX = currentCameraX + offset;
    const proposedRootX = proposedCameraX + offset;
    const currentX = currentRootX + capsule.offsetX;
    const proposedX = proposedRootX + capsule.offsetX;
    const direction = Math.sign(proposedX - currentX);
    if (!direction) return currentCameraX;

    let resolvedCharacterX = proposedX;
    const currentFeetY = playSurfaceYAt(currentRootX) + Math.max(0, clearanceHeight);
    const proposedTerrainY = playSurfaceYAt(proposedRootX);
    const proposedFeetY = proposedTerrainY + Math.max(0, clearanceHeight);
    let feetY = Math.min(currentFeetY, proposedFeetY);

    // On the ground, rebase the capsule onto the highest *reachable* support
    // under the proposed position before testing its sides. This is the key to
    // secure complex collision: a small ledge may raise the feet and remain
    // walkable, but taller rock geometry beside that ledge is still sampled
    // against the full capsule instead of being skipped wholesale.
    if (!airborne) {
      const maxStepWorldY = currentFeetY + capsule.stepUp + 0.025;
      const supportCeiling = maxStepWorldY - proposedTerrainY;
      const proposedSupport = walkableSupportAt(proposedX, supportCeiling, direction);
      if (proposedSupport) {
        const supportWorldY = proposedTerrainY + proposedSupport.offset;
        if (supportWorldY <= maxStepWorldY + 0.001) feetY = Math.max(feetY, supportWorldY);
      }
    }

    for (const obj of collisionObjects()) {
      const c = obj.collision;
      if (!c) continue;
      const depth = c.depth ?? 0.8;
      if (Math.abs(obj.z - pathZ) > depth) continue;

      // Reachable supports were already folded into feetY above. Do not skip
      // this object now: higher neighbouring faces still need to block the body.
      for(const span of collisionBodySpans(obj, feetY)){
        const blockMin = span.minX;
        const blockMax = span.maxX;
        const alreadyOverlapping = currentX > blockMin && currentX < blockMax;
        const blockCentre = (blockMin + blockMax) * 0.5;

        if (direction > 0) {
          const crossesFromLeft = currentX <= blockMin + 0.025 && resolvedCharacterX > blockMin;
          const movingDeeperFromOverlap = alreadyOverlapping && currentX < blockCentre;
          if (crossesFromLeft || movingDeeperFromOverlap) resolvedCharacterX = Math.max(currentX, Math.min(resolvedCharacterX, blockMin));
        } else {
          const crossesFromRight = currentX >= blockMax - 0.025 && resolvedCharacterX < blockMax;
          const movingDeeperFromOverlap = alreadyOverlapping && currentX > blockCentre;
          if (crossesFromRight || movingDeeperFromOverlap) resolvedCharacterX = Math.min(currentX, Math.max(resolvedCharacterX, blockMax));
        }
      }
    }
    return resolvedCharacterX - capsule.offsetX - offset;
  }

  function tintFor(obj) {
    if (debugDepth) return debugTints[obj.layer] || [1, 1, 1];
    if (obj.tint) return obj.tint;
    if (obj.asset) {
      // Preserve the authored texture colour. Previous green-biased tinting
      // made the atlas appear cooler/greener in game than in an image viewer.
      return [obj.shade, obj.shade, obj.shade];
    }
    const base = [0.155, 0.165, 0.172];
    return [base[0] * obj.shade, base[1] * obj.shade, base[2] * obj.shade];
  }

  function drawObjectShadow(obj, view, drawX) {
    // Fixed fallen-tree art now includes its own grounded base treatment.
    // Never draw the old synthetic ellipse shadow, even for saved puzzle states
    // that still contain a legacy `shadow` object.
    if (obj?.assetName === 'fallen-tree') return;
    if (!obj?.shadow) return;
    const shadow = obj.shadow === true ? {} : obj.shadow;
    bindMesh(billboardMesh);
    gl.bindTexture(gl.TEXTURE_2D, textures.softShadow);
    gl.uniformMatrix4fv(loc.model, false, mat4Model(
      drawX + (shadow.xOffset ?? 0),
      playSurfaceYAt(drawX) + (shadow.yOffset ?? 0.04),
      obj.z + (shadow.zOffset ?? 0.03),
      shadow.width ?? Math.max(1.05, obj.sx * 0.72),
      shadow.height ?? Math.max(0.24, obj.sy * 0.16),
      1,
      false
    ));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    gl.uniform3f(loc.tint, 0.16, 0.15, 0.14);
    gl.uniform1f(loc.highlight, 0);
    gl.uniform3f(loc.highlightColor, 0, 0, 0);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, fogSettings.enabled ? (debugDepth ? 0.08 : (shadow.fogAmount ?? (0.28 * fogSettings.amount))) : 0);
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    gl.uniform1f(loc.opacity, shadow.opacity ?? 0.42);
    gl.uniform2f(loc.uvScale, 1, 1);
    gl.uniform2f(loc.uvOffset, 0, 0);
    gl.drawElements(gl.TRIANGLES, billboardMesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function drawObject(obj, view, extra = null) {
    if (obj.deleted || (obj.carried && !extra?.force)) return;
    if (!extra?.force && (obj.assetName === 'thought-trigger' || obj.assetName === 'camera-trigger') && (!editMode || puzzleTestMode)) return;
    const baseDrawX = extra?.x ?? (obj.wrap ? wrapX(obj.x, camera.x) : obj.x);
    if (!extra?.force && !proceduralBiomeVisibleAt(obj, baseDrawX)) return;
    const visual = !extra?.force ? assetVisualTransform(obj.assetName,obj.assetState) : { offsetX:0, offsetY:0, rotationDeg:0 };
    const drawX = baseDrawX + (Number(visual.offsetX) || 0);
    if (!extra?.force && dressingHiddenByPuzzle(obj, drawX)) return;
    if (!extra?.force) drawObjectShadow(obj, view, drawX);
    const drawMesh = extra?.mesh || obj.mesh;
    bindMesh(drawMesh);
    gl.bindTexture(gl.TEXTURE_2D, extra?.texture || obj.texture);
    const mechanismRotation = isCounterweightPlank(obj) ? counterweightAngleFor(obj) : (Number(obj.counterweightVisualAngle) || 0);
    const followSurfaceRotation = !extra?.force && !objectUsesFreePlacement(obj) && assetBehaviours(obj.assetName,obj.assetState).followSurfaceNormal
      ? terrainSurfaceAngleAt(baseDrawX, obj.z, obj.category, obj.gameplayLayerLocked, obj.assetName)
      : 0;
    const visualRotation = (Number(visual.rotationDeg) || 0) * Math.PI / 180 + (Number(obj.runtimeRotation) || 0) + followSurfaceRotation;
    const objectRotation = mechanismRotation || Number(obj.collectibleAngle) || visualRotation || 0;
    const visualFlip = (!!obj.flip) !== (!!visual.flip);
    let drawY = (extra?.y ?? objectYAtDrawX(obj, baseDrawX)) + (Number(visual.offsetY) || 0);
    let modelX = drawX;
    const drawZ = extra?.z ?? obj.z;
    const drawSx = extra?.sx ?? obj.sx;
    const drawSy = extra?.sy ?? obj.sy;
    const drawSz = extra?.sz ?? obj.sz;
    if (!extra?.force && isCounterweightPlank(obj) && objectRotation) {
      const origin = counterweightObjectOrigin(obj,objectRotation,drawX);
      modelX = origin.x;
      drawY = origin.y;
    }
    gl.uniformMatrix4fv(loc.model, false, objectRotation ? mat4ModelRotated(modelX, drawY, drawZ, drawSx, drawSy, drawSz, objectRotation, visualFlip) : mat4Model(modelX, drawY, drawZ, drawSx, drawSy, drawSz, visualFlip));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    const tint = tintFor(obj);
    gl.uniform3f(loc.tint, tint[0], tint[1], tint[2]);
    const selectedHighlight = editMode && obj === selectedObject ? 1.0 : 0.0;
    gl.uniform1f(loc.highlight, selectedHighlight);
    gl.uniform3f(loc.highlightColor, 1.0, 0.18, 0.48);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, (!fogSettings.enabled || obj.noFog) ? 0 : (debugDepth ? 0.22 : fogSettings.amount));
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    // Keep the scene fully opaque in Edit mode. Transparency made overlapping
    // foliage impossible to read; selection is now communicated by a bright
    // tint + screen-space frame instead.
    gl.uniform1f(loc.opacity, obj.opacity);
    gl.uniform2f(loc.uvScale, extra?.uvScale?.[0] ?? obj.uvScale?.[0] ?? 1, extra?.uvScale?.[1] ?? obj.uvScale?.[1] ?? 1);
    gl.uniform2f(loc.uvOffset, extra?.uvOffset?.[0] ?? obj.uvOffset?.[0] ?? 0, extra?.uvOffset?.[1] ?? obj.uvOffset?.[1] ?? 0);
    gl.drawElements(gl.TRIANGLES, drawMesh.count, gl.UNSIGNED_SHORT, 0);

    if (!extra?.force && (obj.assetName === 'handcart' || obj.assetName === 'handcart-broken')) drawHandcartWheels(obj, view, drawX, drawY, visualRotation, visualFlip);
  }

  function drawHandcartWheels(obj, view, drawX, drawY = obj.y, bodyRotation = 0, bodyFlip = false) {
    if (!textures['handcart-wheel']) return;
    // The v1.0.46 chassis is genuinely wheel-free. These authored wheel centres
    // line up with its two vertical supports and rotate around their true hubs.
    const wheelSize = obj.sy * (160 / 255);
    const wheelV = (255 - 164) / 255;
    const profile=assetStateProfile(obj.assetName,obj.assetState);
    const components=profile?.components || {rearWheel:true,frontWheel:obj.assetName!=='handcart-broken'};
    const wheelUs=[];
    if(components.rearWheel!==false) wheelUs.push(150/620);
    if(components.frontWheel!==false) wheelUs.push(470/620);
    for (const uRaw of wheelUs) {
      const u = bodyFlip ? 1 - uRaw : uRaw;
      const localX = (u - 0.5) * obj.sx;
      const localY = wheelV * obj.sy;
      const c = Math.cos(bodyRotation), s = Math.sin(bodyRotation);
      const centreX = drawX + localX * c - localY * s;
      const centreY = drawY + localX * s + localY * c;
      const wheel = {
        mesh:centredBillboardMesh, texture:textures['handcart-wheel'],
        x:centreX, y:centreY,
        z:obj.z + 0.002, sx:wheelSize, sy:wheelSize, sz:1,
        flip:false, shade:obj.shade, opacity:obj.opacity, noFog:obj.noFog, tint:obj.tint,
        asset:true, assetName:'handcart-wheel-component', layer:obj.layer, wrap:false,
        deleted:false, carried:false, shadow:null, uvScale:[1,1], uvOffset:[0,0],
        counterweightVisualAngle:bodyRotation + (Number(obj.wheelRotation) || 0)
      };
      drawObject(wheel, view, { force:true });
    }
  }

  function drawPuzzleCartPathGhost(view) {
    if (!editMode || editorScope !== 'puzzle' || !puzzleCartPathEditMode) return;
    const instance=selectedPuzzleInstance();if(!instance)return;
    const path=puzzleCartPathWorld(instance.marker);if(!path)return;
    const source=cartObjectForInstance(instance);
    const sy=source?.sy||1.75;
    const sx=sy*(assetAspect.handcart||(620/255));
    const rawT=Rig.clamp(Number(puzzleCartPathPreviewT)||0,0,1);
    const timed=cartPathTimedState(path,rawT);
    const splineT=timed.t;
    const point=cubicBezierPoint(path.start,path.c1,path.c2,path.land,splineT);
    const rotation=(Number(path.finalRotationDeg)||0)*Math.PI/180*smooth01(Rig.clamp((timed.distanceFraction-0.10)/0.90,0,1));
    const travel=timed.totalLength*timed.distanceFraction;
    const direction=Math.sign(path.land.x-path.start.x)||1;
    const wheelRadius=Math.max(0.12,sy*(87/255));
    const ghostState=rawT>=0.999?'landed':'repaired';
    const ghost={
      id:'cart-path-ghost',mesh:billboardMesh,texture:textures.handcart,uvScale:assetUv.handcart?.scale||[1,1],uvOffset:assetUv.handcart?.offset||[0,0],
      x:point.x,y:point.y,z:point.z-0.0005,sx,sy,sz:1,baseSx:sx,baseSy:sy,flip:source?.flip||false,shade:1,opacity:puzzleCartPathPreviewPlaying?0.58:0.44,noFog:true,tint:[0.86,1.0,0.91],
      asset:true,assetName:'handcart',assetState:ghostState,groundLine:assetGroundLineDefault('handcart',ghostState),category:'gameplay',gameplayType:'bridge-cart-ghost',gameplayLayerLocked:false,freePlacement:true,layer:'foreground',wrap:false,
      collision:null,collisionOverride:true,shadow:null,deleted:false,carried:false,userAdded:false,puzzleInstanceId:null,puzzleObjectId:null,sockets:[],socketedTo:null,counterweightBoundTo:null,counterweightVisualAngle:0,counterweightAngle:0,counterweightAngularVelocity:0,
      wheelRotation:(Number(source?.wheelRotation)||0)-direction*travel/wheelRadius,runtimeRotation:rotation,cartRailAnimating:false,cartRailLocked:true,cartRailElapsed:0
    };
    drawObject(ghost,view);
  }

  function currentCharacterPhase(isWalking) {
    return isWalking ? locomotionPhase : 0;
  }

  function blendPose(a,b,t){
    if (t <= 0.001) return a;
    if (t >= 0.999) return b;
    const keys=['pelvisY','lean','aFootX','aFootLift','aFootAngle','bFootX','bFootLift','bFootAngle','aHandX','aHandY','bHandX','bHandY','hairAngle','hairBend','travel'];
    const planted = a.planted === b.planted ? a.planted : (t < .34 ? a.planted : (t > .66 ? b.planted : null));
    const out={...Rig.clone(a),name:t<.5?a.name:b.name,key:false,planted};
    keys.forEach(k=>out[k]=Rig.lerp(a[k],b[k],t));
    if(out.planted==='A') out.aFootLift=0;
    if(out.planted==='B') out.bFootLift=0;
    return out;
  }


  function smooth01(t) {
    t = Rig.clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function poseForCarrying(basePose, carryAmount = 1, reachAmount = 0) {
    const p = Rig.clone(basePose);
    const carry = smooth01(carryAmount);
    const reach = smooth01(reachAmount);
    const targetAX = Rig.lerp(0.145, 0.105, reach);
    const targetBX = Rig.lerp(0.215, 0.165, reach);
    const targetAY = Rig.lerp(0.215, 0.345, reach);
    const targetBY = Rig.lerp(0.225, 0.350, reach);
    const armAmount = Math.max(carry, reach);
    p.aHandX = Rig.lerp(p.aHandX, targetAX, armAmount);
    p.bHandX = Rig.lerp(p.bHandX, targetBX, armAmount);
    p.aHandY = Rig.lerp(p.aHandY, targetAY, armAmount);
    p.bHandY = Rig.lerp(p.bHandY, targetBY, armAmount);
    p.pelvisY = Rig.lerp(p.pelvisY, 0.455, reach * 0.72);
    p.lean = Rig.lerp(p.lean, 13 * Math.PI / 180, reach * 0.80);
    p.hairAngle = Rig.lerp(p.hairAngle, 116 * Math.PI / 180, reach * 0.35);
    return p;
  }

  function poseForPushing(basePose, amount = 1) {
    const p = Rig.clone(basePose);
    const push = smooth01(amount);
    // Keep the live walk cycle in the legs, but commit the upper body to a
    // readable two-handed shove. Local +X is forward and is mirrored by facing.
    p.aHandX = Rig.lerp(p.aHandX, 0.335, push);
    p.bHandX = Rig.lerp(p.bHandX, 0.385, push);
    p.aHandY = Rig.lerp(p.aHandY, 0.365, push);
    p.bHandY = Rig.lerp(p.bHandY, 0.375, push);
    p.pelvisY = Rig.lerp(p.pelvisY, 0.445, push * 0.65);
    p.lean = Rig.lerp(p.lean, 17 * Math.PI / 180, push);
    p.hairAngle = Rig.lerp(p.hairAngle, 118 * Math.PI / 180, push * 0.32);
    return p;
  }

  const CLIMB_ANIM_CYCLE_WORLD = 0.92;
  const CLIMB_ANIM_HAND_HOLD = 0.52;
  const CLIMB_ANIM_FOOT_HOLD = 0.50;

  function climbAnimationMotionFrame(st) {
    if (!st) return { ux:0, uy:1, distance:0, phaseDistance:0, entryBlend:1 };
    const entryTarget = st.mode === 'up' ? st.bottom : st.top;
    const endTarget = st.mode === 'up' ? st.top : st.bottom;
    const mainDx = endTarget.x - entryTarget.x;
    const mainDy = endTarget.y - entryTarget.y;
    const mainLength = Math.max(0.001, Math.hypot(mainDx, mainDy));
    const mainUx = mainDx / mainLength;
    const mainUy = mainDy / mainLength;
    const entryDuration = Math.max(0.001, Number(st.entryDuration) || CLIMB_ENTRY_MIN_DURATION);
    if (st.time < entryDuration) {
      // The approach onto the climb line is a settle, not a step. Hold the
      // climbing phase at zero until the constant-speed path traversal begins.
      return {
        ux:mainUx,
        uy:mainUy,
        distance:0,
        phaseDistance:0,
        entryBlend:smooth01(Rig.clamp(st.time / entryDuration, 0, 1))
      };
    }
    const distance = Rig.clamp((character.x - entryTarget.x) * mainUx + (character.y - entryTarget.y) * mainUy, 0, mainLength);
    return { ux:mainUx, uy:mainUy, distance, phaseDistance:distance, entryBlend:1 };
  }

  function climbLockedLimb(frame, phaseShift, holdFraction, anatomyX, anatomyY, swingAway = 0.10) {
    const cycle = CLIMB_ANIM_CYCLE_WORLD;
    const u = frame.phaseDistance / cycle + phaseShift;
    const phase = ((u % 1) + 1) % 1;
    let along;
    let swing = 0;
    if (phase < holdFraction) {
      // Counter the root travel exactly while this limb owns a hold. The endpoint
      // therefore stays planted in world space instead of sliding with the body.
      along = -cycle * phase;
    } else {
      const t = smooth01((phase - holdFraction) / Math.max(0.001, 1 - holdFraction));
      along = Rig.lerp(-cycle * holdFraction, 0, t);
      swing = Math.sin(t * Math.PI);
    }
    const facing = character.lastFacing >= 0 ? 1 : -1;
    return {
      x:character.x + facing * (anatomyX - swingAway * swing) + frame.ux * along,
      y:characterRenderY() + anatomyY + frame.uy * along,
      swing,
      phase
    };
  }

  function poseForClimbing(st = climbState) {
    const p = Rig.sampleFrames(characterFrames, 0.02);
    const frame = climbAnimationMotionFrame(st);
    const cyclePhase = ((frame.phaseDistance / CLIMB_ANIM_CYCLE_WORLD) % 1 + 1) % 1;
    const weight = 0.5 - 0.5 * Math.cos(cyclePhase * Math.PI * 2);
    const facing = character.lastFacing >= 0 ? 1 : -1;

    p.planted = null;
    p.pelvisY = 0.480 - 0.025 * weight;
    p.lean = (13.5 + 2.5 * Math.sin(cyclePhase * Math.PI * 2)) * Math.PI / 180;
    p.hairAngle = (116 + 4 * weight) * Math.PI / 180;
    p.hairBend = (10 + 5 * weight) * Math.PI / 180;
    p.travel = cyclePhase;

    // Diagonal pairs move together. Each limb advances to a new hold almost a
    // metre away, while the planted half-cycle counteracts the body translation.
    // The result is a slower, broader reach with a clearer transfer of weight.
    const aHand = climbLockedLimb(frame, 0.00, CLIMB_ANIM_HAND_HOLD, 0.46, 1.56, 0.10);
    const bHand = climbLockedLimb(frame, 0.50, CLIMB_ANIM_HAND_HOLD, 0.40, 1.50, 0.09);
    const aFoot = climbLockedLimb(frame, 0.50, CLIMB_ANIM_FOOT_HOLD, 0.13, 0.47, 0.12);
    const bFoot = climbLockedLimb(frame, 0.00, CLIMB_ANIM_FOOT_HOLD, -0.04, 0.45, 0.11);

    // The short entry move settles onto the climbing line. Fade the extreme
    // targets in through that approach so ACTION never pops the limbs abruptly.
    const settle = Rig.clamp(0.28 + frame.entryBlend * 0.72, 0, 1);
    const shoulderX = Math.sin(p.lean) * Rig.BODY.torso;
    const shoulderY = p.pelvisY + Math.cos(p.lean) * Rig.BODY.torso;
    const applyHand = (target, prefix, fallbackX, fallbackY) => {
      // Convert world X back into mirrored rig-local X. Keep the scale
      // denominator positive, then apply the facing sign separately. Using
      // Math.max() on (scale * facing) collapses left-facing (-1) to 0.001
      // and explodes otherwise normal planted-limb offsets.
      const localX = ((target.x - character.x) / Math.max(0.001, character.scale)) * facing;
      const localY = (target.y - characterRenderY()) / Math.max(0.001, character.scale);
      const handX = localX - shoulderX;
      const handY = shoulderY - localY;
      p[`${prefix}HandX`] = Rig.lerp(fallbackX, handX, settle);
      p[`${prefix}HandY`] = Rig.lerp(fallbackY, handY, settle);
    };
    const applyFoot = (target, prefix, fallbackX, fallbackLift, angle) => {
      // Convert world X back into mirrored rig-local X. Keep the scale
      // denominator positive, then apply the facing sign separately. Using
      // Math.max() on (scale * facing) collapses left-facing (-1) to 0.001
      // and explodes otherwise normal planted-limb offsets.
      const localX = ((target.x - character.x) / Math.max(0.001, character.scale)) * facing;
      const localY = (target.y - characterRenderY()) / Math.max(0.001, character.scale);
      p[`${prefix}FootX`] = Rig.lerp(fallbackX, localX, settle);
      p[`${prefix}FootLift`] = Rig.lerp(fallbackLift, localY, settle);
      p[`${prefix}FootAngle`] = angle;
    };

    applyHand(aHand, 'a', 0.235, 0.02);
    applyHand(bHand, 'b', 0.205, 0.10);
    applyFoot(aFoot, 'a', 0.06, 0.12, -12 * Math.PI / 180);
    applyFoot(bFoot, 'b', -0.035, 0.05, 9 * Math.PI / 180);
    return p;
  }

  function heldCrateTransform(facing, pose = null) {
    const obj = carriedObject || interactionState?.object;
    const sx = obj ? obj.sx : 0.96;
    const sy = obj ? obj.sy : 0.88;
    let x = character.x + facing * CARRY_FORWARD;
    let y = characterRenderY() + CARRY_BOTTOM;

    // Attach the carried crate to the actual animated hand position rather than
    // to a fixed world height.  That means the box inherits the same pelvis /
    // shoulder rise and fall as the walk cycle instead of appearing to hover
    // while the character bobs behind it.
    if (pose) {
      const g = Rig.geometry(pose);
      const handX = ((g.aW.x + g.bW.x) * 0.5) * character.scale;
      const handY = ((g.aW.y + g.bW.y) * 0.5) * character.scale;
      x = character.x + handX * facing;
      y = characterRenderY() + handY - sy * 0.52;
    }

    if (obj && isCounterweightPlank(obj)) {
      const mech = counterweightMechanism(obj);
      const u = mechanismVisualU(obj,Rig.clamp(Number(mech?.pivotX)||0.23,0,1));
      const desiredPivotX = x;
      const desiredPivotY = y + sy * 0.52;
      x = desiredPivotX - (u - 0.5) * sx;
      y = desiredPivotY - Rig.clamp(Number(mech?.pivotY)||0.5,0,1) * sy;
    }
    return { x, y, z: character.z + CHARACTER_GAMEPLAY_Z_BIAS - 0.0004, sx, sy };
  }

  function interactionCrateTransform(facing, pose = null) {
    if (!interactionState) return carriedObject ? heldCrateTransform(facing, pose) : null;
    const st = interactionState;
    const p = smooth01(st.time / st.duration);
    const held = heldCrateTransform(facing, pose);
    if (st.type === 'pickup') {
      const lift = smooth01(Rig.clamp((p - 0.18) / 0.82, 0, 1));
      return {
        x: Rig.lerp(st.startX, held.x, lift),
        y: Rig.lerp(st.startY, held.y, lift),
        z: Rig.lerp(st.startZ, held.z, lift),
        sx: st.object.sx, sy: st.object.sy
      };
    }
    const settle = smooth01(Rig.clamp((p - 0.05) / 0.95, 0, 1));
    return {
      x: Rig.lerp(held.x, st.targetX, settle),
      y: Rig.lerp(held.y, st.targetY, settle),
      z: Rig.lerp(held.z, st.targetZ, settle),
      sx: st.object.sx, sy: st.object.sy
    };
  }

  function drawCarriedCrate(view, facing, pose = null) {
    const obj = interactionState?.object || carriedObject;
    if (!obj) return;
    const tr = interactionCrateTransform(facing, pose);
    if (!tr) return;
    const temp = {
      ...obj,
      carried: false,
      wrap: false,
      x: tr.x,
      y: tr.y,
      z: tr.z,
      sx: tr.sx,
      sy: tr.sy,
      opacity: 1,
      shade: 1,
      tint: null,
      layer: 'character'
    };
    drawObject(temp, view, { force: true });
  }

  function drawRigPartWebGL(part, view, facing) {
    const mesh = rigPartMeshes[part.name];
    const r = Rig.atlasRect(part.name);
    if (!mesh || !r) return;

    const ax = character.x + part.a.x * character.scale * facing;
    const renderY = characterRenderY();
    const ay = renderY + part.a.y * character.scale;
    const bx = character.x + part.b.x * character.scale * facing;
    const by = renderY + part.b.y * character.scale;
    const dvx = bx - ax, dvy = by - ay;
    const p0x = r.a0[0] * r.w, p0y = r.a0[1] * r.h;
    const p1x = r.a1[0] * r.w, p1y = r.a1[1] * r.h;
    const svx = (p1x - p0x) * facing;
    const svy = -(p1y - p0y);
    const srcLen = Math.hypot(svx, svy) || 1;
    const dstLen = Math.hypot(dvx, dvy) || 1;
    const scale = dstLen / srcLen;
    const rotation = Math.atan2(dvy, dvx) - Math.atan2(svy, svx);

    bindMesh(mesh);
    gl.bindTexture(gl.TEXTURE_2D, textures.rigAtlas);
    const z = character.z + CHARACTER_GAMEPLAY_Z_BIAS + (part.layer - 10) * 0.0009;
    gl.uniformMatrix4fv(loc.model, false, mat4Model2D(ax, ay, z, scale, rotation, facing));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    const tint = debugDepth ? debugTints.character : character.tint;
    gl.uniform3f(loc.tint, tint[0], tint[1], tint[2]);
    gl.uniform1f(loc.highlight, 0);
    gl.uniform3f(loc.highlightColor, 1.0, 0.18, 0.48);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, fogSettings.enabled ? (debugDepth ? 0.22 : fogSettings.amount) : 0);
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    gl.uniform1f(loc.opacity, character.opacity * (part.alpha ?? 1));
    gl.uniform2f(loc.uvScale, 1, 1);
    gl.uniform2f(loc.uvOffset, 0, 0);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function drawRigCharacter(view, isWalking) {
    const phase = currentCharacterPhase(isWalking);
    let pose;
    if (climbState) {
      pose = poseForClimbing(climbState);
    } else if (jumping) {
      const jumpPhase = Rig.clamp(jumpTime / JUMP_DURATION, 0, 0.999);
      pose = Rig.sampleFrames(jumpFrames, jumpPhase);
    } else if (isWalking) {
      const walkPose = Rig.sampleFrames(characterFrames, phase);
      const runPose = Rig.sampleFrames(runFrames, phase);
      pose = blendPose(walkPose, runPose, runBlend);
    } else {
      pose = Rig.sampleFrames(characterFrames, 0.02);
    }

    if (pushingObject) pose = poseForPushing(pose, 1);
    if (carriedObject) pose = poseForCarrying(pose, 1, 0);
    if (interactionState) {
      const q = Rig.clamp(interactionState.time / interactionState.duration, 0, 1);
      if (interactionState.type === 'pickup') {
        const reach = Math.sin(Math.min(1, q) * Math.PI);
        const carry = smooth01(Rig.clamp((q - 0.52) / 0.48, 0, 1));
        pose = poseForCarrying(pose, carry, reach * (1 - carry * 0.65));
      } else {
        const reach = Math.sin(Math.min(1, q) * Math.PI);
        const carry = 1 - smooth01(Rig.clamp((q - 0.58) / 0.42, 0, 1));
        pose = poseForCarrying(pose, carry, reach * 0.95);
      }
    }

    const facing = character.lastFacing >= 0 ? 1 : -1;
    const parts = Rig.partsForPose(pose);
    let crateDrawn = false;
    for (const part of parts) {
      if (!crateDrawn && (carriedObject || interactionState) && part.name === 'near_upper_arm') {
        drawCarriedCrate(view, facing, pose);
        crateDrawn = true;
      }
      drawRigPartWebGL(part, view, facing);
    }
    if (!crateDrawn && (carriedObject || interactionState)) drawCarriedCrate(view, facing, pose);
  }

  function nearestActionPushable() {
    if (carriedObject || interactionState || pushingObject || jumping) return null;
    const characterXNow = camera.x + character.screenOffsetX;
    let best = null;
    for (const obj of allSceneObjects()) {
      if (!isPushableObject(obj) || standingOnObject === obj) continue;
      const depth = obj.collision?.depth ?? 0.9;
      if (Math.abs(obj.z - pathZ) > Math.max(1.35, depth)) continue;
      const ox = objectXNear(obj, characterXNow);
      const side = characterXNow <= ox ? 1 : -1;
      const handleX = ox - side * obj.sx * 0.49;
      const distance = Math.abs(handleX - characterXNow);
      if (distance <= PUSH_ACTION_RANGE && (!best || distance < best.distance)) best = { obj, side, distance };
    }
    return best;
  }

  function startPush(target) {
    if (!target?.obj || pushingObject || carriedObject || interactionState || jumping) return;
    pushingObject = target.obj;
    pushingSide = target.side || ((character.x <= pushingObject.x) ? 1 : -1);
    pushingFloorOffset = objectFloorOffsetFromTerrain(pushingObject);
    character.lastFacing = pushingSide;
    standingOnObject = null;
    setDriveAxis(0);
    hintEl.textContent = 'Pushing cart · move toward it · ACTION lets go';
    hintEl.classList.remove('hidden');
  }

  function stopPush(quiet = false) {
    const obj = pushingObject;
    pushingObject = null;
    pushingSide = 0;
    pushingFloorOffset = 0;
    if (obj) recordObjectEdit(obj);
    if (!quiet) {
      hintEl.textContent = 'Cart released';
      hintEl.classList.remove('hidden');
    }
  }

  function nearestActionCrate() {
    if (carriedObject || interactionState) return null;
    const characterXNow = camera.x + character.screenOffsetX;
    let best = null;
    let bestD = Infinity;
    const seenStacks = new Set();

    const carryables = allSceneObjects().filter(isCarryableObject);

    for (const candidate of carryables) {
      // A lower member of a stack must never be directly pickable.  Do this as
      // a simple spatial "covered by another stackable object" test rather than
      // relying on exact authored layer heights: small terrain offsets and older
      // saved puzzles can otherwise make stackColumnFor() miss the relationship
      // and expose the bottom log again.
      if (isGameplayCrate(candidate)) {
        const candidateX = objectXNear(candidate, characterXNow);
        const candidateDepth = candidate.collision?.depth ?? 0.9;
        const covered = carryables.some(other => {
          if (other === candidate || !isGameplayCrate(other)) return false;
          const otherX = objectXNear(other, candidateX);
          const otherDepth = other.collision?.depth ?? 0.9;
          if (Math.abs(otherX - candidateX) > STACK_COLUMN_ALIGN_TOLERANCE + 0.08) return false;
          if (Math.abs((other.z ?? pathZ) - (candidate.z ?? pathZ)) > Math.max(0.38, Math.min(candidateDepth, otherDepth))) return false;
          const dy = other.y - candidate.y;
          return dy > 0.10 && dy <= STACK_ITEM_HEIGHT * 3.25;
        });
        if (covered) continue;
      }

      let obj = candidate;
      if (isGameplayCrate(candidate)) {
        const anchor = stackBottomFor(candidate, characterXNow);
        const column = stackColumnFor(anchor, characterXNow);
        if (column?.members?.length) {
          const stackKey = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
          if (seenStacks.has(stackKey)) continue;
          seenStacks.add(stackKey);
          const exposed = column.members[column.members.length - 1];
          // Only promote to the computed top when it is genuinely the highest
          // exposed member; otherwise the coverage rule above already protects
          // the stack and this candidate remains the correct target.
          if (isCarryableObject(exposed) && exposed.y >= obj.y) obj = exposed;
        }
      }

      if (!isCarryableObject(obj)) continue;
      if (standingOnObject === obj) continue;
      const depth = obj.collision?.depth ?? 0.9;
      if (Math.abs(obj.z - pathZ) > Math.max(1.35, depth)) continue;
      const pickupPoint = counterweightPickupPoint(obj);
      const ox = pickupPoint ? pickupPoint.x : objectXNear(obj, characterXNow);
      const centreDistance = Math.abs(ox - characterXNow);
      const characterReach = colliderWorld().radius * 0.72;
      const edgeDistance = pickupPoint
        ? Math.max(0, centreDistance - characterReach)
        : Math.max(0, centreDistance - crateHalfWidth(obj) - characterReach);
      // Reach is measured to the exposed top object's edge. Lower members of a
      // stack are deliberately not action targets until the objects above them
      // have been removed.
      if (edgeDistance <= ACTION_RANGE && (edgeDistance < bestD - 0.02 || (Math.abs(edgeDistance - bestD) <= 0.02 && (!best || obj.y > best.y)))) {
        best = obj; bestD = edgeDistance;
      }
    }
    return best;
  }

  function updateActionUI() {
    if (!actionBtn || !actionLabel) return;
    actionBtn.classList.remove('ready', 'carrying');
    if (climbState) {
      actionLabel.textContent = 'CLIMBING';
      actionBtn.classList.add('ready');
      return;
    }
    if (interactionState) {
      actionLabel.textContent = interactionState.type === 'pickup' ? 'PICKING UP' : 'PUTTING DOWN';
      actionBtn.classList.add('ready');
      return;
    }
    if (pushingObject) {
      actionLabel.textContent = 'LET GO';
      actionBtn.classList.add('ready');
      return;
    }
    const climbTarget = nearestActionClimbTarget();
    if (climbTarget) {
      actionLabel.textContent = climbTarget.mode === 'up' ? 'CLIMB' : 'CLIMB DOWN';
      actionBtn.classList.add('ready');
      return;
    }
    const contextAction = nearestPuzzleContextAction();
    if (contextAction) {
      actionLabel.textContent = contextAction.label;
      actionBtn.classList.add(carriedObject ? 'carrying' : 'ready');
      return;
    }
    if (carriedObject) {
      actionLabel.textContent = 'PUT DOWN';
      actionBtn.classList.add('carrying');
      return;
    }
    const pushTarget = nearestActionPushable();
    if (pushTarget) {
      actionLabel.textContent = 'PUSH';
      actionBtn.classList.add('ready');
      return;
    }
    const near = nearestActionCrate();
    if (near) {
      actionLabel.textContent = 'PICK UP';
      actionBtn.classList.add('ready');
    } else {
      actionLabel.textContent = 'ACTION';
    }
  }

  function startPickup(obj) {
    if (!obj || carriedObject || interactionState || jumping) return;
    if (isCounterweightPlank(obj) && boundCounterweightLogs(obj).length) {
      hintEl.textContent = 'Remove the counterweights first';
      hintEl.classList.remove('hidden');
      return;
    }
    const characterXNow = camera.x + character.screenOffsetX;

    // Freeze the exact visible transform before changing any gameplay state.
    // Previously we marked the object carried and settled the stack first,
    // which could rewrite its Y to the vacant bottom slot before the pickup
    // interpolation sampled startY. That made the correct top log appear to
    // jump down and then be lifted from the bottom of the stack.
    const pickupStart = {
      x: objectXNear(obj, characterXNow),
      y: obj.y,
      z: obj.z
    };

    if (obj.counterweightBoundTo) unbindCounterweightLog(obj);
    if (isCounterweightPlank(obj)) {
      obj.counterweightAngle = 0;
      obj.counterweightAngularVelocity = 0;
    }
    obj.carried = true;
    obj.socketedTo = null;
    interactionState = {
      type: 'pickup',
      time: 0,
      duration: PICKUP_DURATION,
      object: obj,
      startX: pickupStart.x,
      startY: pickupStart.y,
      startZ: pickupStart.z
    };
    standingOnObject = null;
    setDriveAxis(0);
    hintEl.textContent = 'Picking up item';
    hintEl.classList.remove('hidden');
  }

  function completePickup() {
    if (!interactionState || interactionState.type !== 'pickup') return;
    carriedObject = interactionState.object;
    carriedObject.carried = true;
    // Large repair props may begin as scenery just off the road. Once the
    // player has physically picked the wheel up, subsequent placement follows
    // the normal gameplay path so carrying/put-down remains predictable.
    if (isLooseCartWheel(carriedObject) || isReadyCartWheel(carriedObject)) {
      carriedObject.gameplayLayerLocked = true;
      carriedObject.freePlacement = false;
      carriedObject.z = pathZ;
    }
    interactionState = null;
    // Settle what remains only after the lifted object has finished leaving the
    // stack, so the pickup animation always begins from the object's true slot.
    settleGameplayCrates();
    hintEl.textContent = 'Carrying · ACTION puts the item down';
    hintEl.classList.remove('hidden');
  }

  function stackBottomFor(candidate, aroundX, ignoredObjects = null) {
    if (!isGameplayCrate(candidate)) return candidate;
    let current = candidate;
    let guard = 0;
    while (guard++ < 12) {
      const currentX = objectXNear(current, aroundX);
      let lower = null;
      let lowerTop = -Infinity;
      for (const other of allSceneObjects()) {
        if (other === current || ignoredObjects?.has(other) || !isGameplayCrate(other)) continue;
        const ox = objectXNear(other, currentX);
        if (Math.abs(ox - currentX) > STACK_COLUMN_ALIGN_TOLERANCE) continue;
        if (other.y >= current.y - 0.05) continue;
        const top = other.y + crateHeight(other);
        if (Math.abs(top - current.y) > 0.16) continue;
        if (top > lowerTop) { lower = other; lowerTop = top; }
      }
      if (!lower) break;
      current = lower;
    }
    return current;
  }

  function stackColumnFor(anchor, aroundX, ignoredObjects = null) {
    if (!anchor || !isGameplayCrate(anchor)) return null;
    const anchorX = objectXNear(anchor, aroundX);
    const members = [anchor];
    const used = new Set([anchor]);
    let nextY = anchor.y + STACK_ITEM_HEIGHT;

    // A stack is a vertical column rooted at its bottom object. Build upward
    // one standard layer at a time, rather than asking generic support logic
    // whether a wider carried prop "fits" on the object below it.
    for (let layer = 1; layer < 12; layer += 1) {
      let next = null;
      let bestDelta = Infinity;
      for (const other of allSceneObjects()) {
        if (used.has(other) || other === carriedObject || ignoredObjects?.has(other) || !isGameplayCrate(other)) continue;
        const ox = objectXNear(other, anchorX);
        if (Math.abs(ox - anchorX) > STACK_COLUMN_ALIGN_TOLERANCE) continue;
        const dy = Math.abs(other.y - nextY);
        if (dy > 0.16 || dy >= bestDelta) continue;
        next = other;
        bestDelta = dy;
      }
      if (!next) break;
      used.add(next);
      members.push(next);
      nextY = anchor.y + members.length * STACK_ITEM_HEIGHT;
    }

    return { anchor, x: anchorX, members, topY: anchor.y + members.length * STACK_ITEM_HEIGHT };
  }

  function editorStackTargetFor(obj, desiredX, desiredZ = obj?.z ?? pathZ, ignoredObjects = null) {
    if (!obj || !isGameplayCrate(obj)) return null;
    const ignored = new Set(ignoredObjects || []);
    ignored.add(obj);
    let best = null;
    let bestDistance = EDITOR_STACK_SNAP_RADIUS + 0.0001;
    const seenAnchors = new Set();

    for (const other of allSceneObjects()) {
      if (ignored.has(other) || !isGameplayCrate(other)) continue;
      const sameDepth = obj.gameplayLayerLocked && other.gameplayLayerLocked
        ? true
        : Math.abs((desiredZ ?? pathZ) - other.z) <= 0.34;
      if (!sameDepth) continue;

      const anchor = stackBottomFor(other, desiredX, ignored);
      if (!anchor || ignored.has(anchor)) continue;
      const column = stackColumnFor(anchor, desiredX, ignored);
      if (!column) continue;
      const key = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
      if (seenAnchors.has(key)) continue;
      seenAnchors.add(key);

      const distance = Math.abs(column.x - desiredX);
      if (distance <= EDITOR_STACK_SNAP_RADIUS && distance < bestDistance) {
        bestDistance = distance;
        best = column;
      }
    }
    return best;
  }

  function placeGameplayObjectInEditor(obj, desiredX = obj?.x, desiredZ = obj?.z, ignoredObjects = null) {
    if (!obj || obj.category !== 'gameplay') return null;
    const targetZ = obj.gameplayLayerLocked ? pathZ : desiredZ;
    obj.x = desiredX;
    obj.z = targetZ;

    const stack = editorStackTargetFor(obj, desiredX, targetZ, ignoredObjects);
    if (stack) {
      obj.x = stack.x;
      obj.z = obj.gameplayLayerLocked ? pathZ : stack.anchor.z;
      obj.y = stack.topY;
      return stack;
    }

    // Outside a stack snap, retain the existing editor behaviour for fixed
    // support surfaces such as the fallen tree/platform collision.
    obj.y = restYForGameplayObject(obj, obj.x, null, true) - objectGroundLine(obj) * (Number(obj.sy) || 0);
    return null;
  }

  function socketOccupied(host, socket, ignoredPiece = null) {
    if (!host || !socket) return false;
    return allSceneObjects().some(obj => obj !== ignoredPiece && !obj.deleted && obj.socketedTo
      && obj.socketedTo.hostObjectId === host.id && obj.socketedTo.socketId === socket.id);
  }

  function socketTargetNear(rootX, facing) {
    if (!carriedObject || !objectHasBehaviour(carriedObject, 'socketPiece')) return null;
    let best = null;
    let bestForward = Infinity;
    for (const host of allSceneObjects()) {
      if (host.deleted || !objectHasBehaviour(host, 'socketHost')) continue;
      const effectiveSockets = socketsForHost(host);
      if (!effectiveSockets.length) continue;
      // Socket links are puzzle-local: a piece cannot accidentally snap into a
      // similarly named socket belonging to another streamed puzzle instance.
      if (carriedObject.puzzleInstanceId && host.puzzleInstanceId !== carriedObject.puzzleInstanceId) continue;
      for (const socket of effectiveSockets) {
        if (!socketMatchesPiece(socket, carriedObject)) continue;
        if (socketOccupied(host, socket, carriedObject)) continue;
        const point = socketWorldPosition(host, socket);
        if (!point) continue;
        const forward = (point.x - rootX) * facing;
        if (forward < -0.12 || forward > SOCKET_SEARCH_RADIUS) continue;
        if (forward < bestForward) {
          bestForward = forward;
          let targetX = point.x;
          let targetY = point.y - carriedObject.sy * 0.5;
          const mech = counterweightMechanism(carriedObject);
          if (mech) {
            const u = mechanismVisualU(carriedObject,Rig.clamp(Number(mech.pivotX)||0.23,0,1));
            targetX = point.x - (u - 0.5) * carriedObject.sx;
            targetY = point.y - Rig.clamp(Number(mech.pivotY)||0.5,0,1) * carriedObject.sy;
          }
          best = {
            host,
            socket,
            x:targetX,
            y:targetY,
            z:point.z,
            cueX:point.x,
            cueY:point.y,
            cueZ:point.z,
            forward,
            valid:true
          };
        }
      }
    }
    return best;
  }

  function stackTargetNear(rootX, facing) {
    // carriedObject.carried is true by definition. Explicitly include it here;
    // otherwise stack search exits before examining any nearby support and the
    // old generic ground-placement path accidentally decides the result.
    if (!carriedObject || !isGameplayCrate(carriedObject, true)) return null;
    let best = null;
    let bestForward = Infinity;
    const seenAnchors = new Set();
    for (const other of allSceneObjects()) {
      if (other === carriedObject || !isGameplayCrate(other)) continue;
      const ox = objectXNear(other, rootX);
      const forward = (ox - rootX) * facing;
      if (forward < 0.05 || forward > STACK_SEARCH_RADIUS) continue;
      const anchor = stackBottomFor(other, rootX);
      const column = stackColumnFor(anchor, rootX);
      if (!column) continue;
      const anchorKey = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
      if (seenAnchors.has(anchorKey)) continue;
      seenAnchors.add(anchorKey);
      const columnForward = (column.x - rootX) * facing;

      // The nearest stack in front of the character is the clearest intent.
      // This prevents a farther log from winning simply because it is nearer
      // the old fixed 0.92-unit ground-drop point.
      if (columnForward < bestForward) {
        bestForward = columnForward;
        best = { ...column, forward: columnForward };
      }
    }
    return best;
  }

  function counterweightDropTargetNear(rootX, facing) {
    if (!carriedObject || !objectHasBehaviour(carriedObject,'stackable')) return null;

    // Use the same horizontal centre as the carried-object collision / pickup
    // cue. The previous 0.92m ground-drop point sat ~0.44m ahead of the log the
    // player could actually see, so the overlap percentage could say 43% while
    // the artwork appeared centred over the blue line.
    const x = rootX + facing * CARRY_FORWARD;
    const z = carriedObject.gameplayLayerLocked === false ? carriedObject.z : pathZ;
    let best = null;
    let bestOverlap = 0;

    for (const plank of allSceneObjects()) {
      if (!isCounterweightPlank(plank) || plank.deleted || plank.carried || !plank.socketedTo) continue;
      if (plank.puzzleInstanceId && carriedObject.puzzleInstanceId !== plank.puzzleInstanceId) continue;

      const overlap = counterweightZoneOverlapFraction(plank, carriedObject, x, z);
      const zone = counterweightZoneRestBounds(plank);
      if (!zone) continue;

      // Treat a small overlap as placement intent so pressing Put Down near the
      // blue line never triggers the old automatic "back up and drop beside it"
      // behaviour.
      if (overlap <= 0.06) continue;

      if (overlap > bestOverlap) {
        const threshold = Number(counterweightMechanism(plank)?.minimumOverlap) || 0.50;

        // If this plank already has counterweights, look for the nearest bound
        // stack column close to the visibly carried log. That preserves the
        // existing free-placement feel for the first log, while subsequent logs
        // can naturally stack on the pile.
        let stack = null;
        let stackDistance = Infinity;
        const seenAnchors = new Set();
        for (const member of boundCounterweightLogs(plank)) {
          const anchor = stackBottomFor(member,x);
          if (!anchor || anchor.counterweightBoundTo?.plankId !== plank.id) continue;
          const column = stackColumnFor(anchor,x);
          if (!column?.members?.length) continue;
          if (!column.members.every(item => item.counterweightBoundTo?.plankId === plank.id)) continue;
          const key = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
          if (seenAnchors.has(key)) continue;
          seenAnchors.add(key);
          const d = Math.abs(column.x - x);
          if (d <= Math.max(0.46, STACK_COLUMN_ALIGN_TOLERANCE + 0.22) && d < stackDistance) {
            stack = column;
            stackDistance = d;
          }
        }

        const targetX = stack ? stack.x : x;
        const targetOverlap = counterweightZoneOverlapFraction(plank,carriedObject,targetX,z);
        const accepted = targetOverlap > threshold + 0.0001;
        const topY = stack ? stack.topY : collisionTopHeightAtX(plank,targetX);
        if (!Number.isFinite(topY)) continue;

        const temp = { ...carriedObject, x:targetX, z, y:topY, carried:false };
        if (temp.collision && isGameplayCrate(temp)) {
          temp.collision = { ...temp.collision, height:STACK_ITEM_HEIGHT };
        }

        // The plank is intended support, and bound counterweight members are
        // object-stack supports rather than player obstacles. Ignore this stack
        // for the overlap check so the carried log can occupy the next layer.
        const ignored = new Set([plank, ...(stack?.members || [])]);
        const target = {
          x:targetX, z, y:topY,
          stack,
          socket:null,
          counterweightPlank:plank,
          counterweightOverlap:targetOverlap,
          counterweightAccepted:accepted
        };
        target.valid = accepted && dropTargetIsClear(temp,target,ignored);
        best = target;
        bestOverlap = Math.max(overlap,targetOverlap);
      }
    }

    return best;
  }

  function dropTargetForCarried(rootX = character.x) {
    const facing = character.lastFacing >= 0 ? 1 : -1;
    let x = rootX + facing * 0.92;
    let z = carriedObject?.gameplayLayerLocked === false ? carriedObject.z : pathZ;

    // A compatible authored socket is the strongest placement intent. Socket
    // targets deliberately ignore the normal gameplay-layer lock so a carried
    // piece can move from the path into a wall/side-of-road host.
    const socket = socketTargetNear(rootX, facing);
    const counterweight = socket ? null : counterweightDropTargetNear(rootX,facing);
    const stack = (socket || counterweight) ? null : stackTargetNear(rootX, facing);
    if (socket) { x = socket.x; z = socket.z; }
    else if (counterweight) { x = counterweight.x; z = counterweight.z; }
    else if (stack) x = stack.x;

    if (counterweight) return counterweight;

    const temp = carriedObject ? { ...carriedObject, x, z, carried: false } : null;
    if (temp?.collision && isGameplayCrate(temp)) temp.collision = { ...temp.collision, height: STACK_ITEM_HEIGHT };
    const y = socket
      ? socket.y
      : (stack ? stack.topY : (temp ? restYForGameplayObject(temp, x, null, true) : playSurfaceYAt(x)));
    const target = { x, z, y, stack, socket };
    if (socket) target.valid = !!socket.valid;
    else {
      const ignoredStackObjects = stack ? new Set(stack.members) : null;
      target.valid = temp ? dropTargetIsClear(temp, target, ignoredStackObjects) : true;
    }
    return target;
  }

  function beginDropAtTarget(target) {
    interactionState = {
      type: 'drop',
      time: 0,
      duration: DROP_DURATION,
      object: carriedObject,
      targetX: target.x,
      targetY: target.y,
      targetZ: target.z,
      socketMeta: target.socket ? { hostObjectId:target.socket.host.id, socketId:target.socket.socket.id } : null
    };
    setDriveAxis(0);
    hintEl.textContent = 'Putting item down';
    hintEl.classList.remove('hidden');
  }

  function failAutoDropShuffle() {
    autoDropStep = null;
    hintEl.textContent = 'No room to put that down';
    hintEl.classList.remove('hidden');
  }

  function startAutoDropStackAssist(target) {
    if (!carriedObject || autoDropStep || !target?.stack || !target.valid) return false;
    autoDropStep = {
      mode: 'stack',
      facing: character.lastFacing >= 0 ? 1 : -1,
      target: { ...target },
      distance: 0
    };
    setDriveAxis(0);
    hintEl.textContent = 'Placing on stack…';
    hintEl.classList.remove('hidden');
    return true;
  }

  function startAutoDropStepBack() {
    if (!carriedObject || autoDropStep) return false;
    const facing = character.lastFacing >= 0 ? 1 : -1;
    autoDropStep = {
      mode: 'back',
      facing,
      startCameraX: camera.x,
      distance: 0
    };
    setDriveAxis(0);
    hintEl.textContent = 'Making room…';
    hintEl.classList.remove('hidden');
    return true;
  }

  function updateAutoDropShuffle(dt) {
    if (!autoDropStep || !carriedObject) return;

    if (autoDropStep.mode === 'stack') {
      const facing = autoDropStep.facing;
      const target = autoDropStep.target;
      const rootX = camera.x + character.screenOffsetX;
      const forwardGap = (target.x - rootX) * facing;
      if (forwardGap <= STACK_ASSIST_ROOT_GAP + 0.02 || autoDropStep.distance >= STACK_ASSIST_MAX) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      const step = Math.min(0.06, STACK_ASSIST_SPEED * dt, Math.max(0, forwardGap - STACK_ASSIST_ROOT_GAP));
      const desiredCameraX = camera.x + facing * step;
      // During this authored placement step the character body still obeys
      // normal collision. The held prop is allowed to move into the chosen
      // stack column because ACTION has already committed to that placement.
      const bodySafeX = resolveObstacleMove(camera.x, desiredCameraX, jumpOffset, false);
      const moved = Math.abs(bodySafeX - camera.x);
      if (moved < 0.004) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      const capsule = colliderWorld();
      const candidateRootX = bodySafeX + character.screenOffsetX;
      const candidateSupport = walkableSupportAt(
        candidateRootX + capsule.offsetX,
        jumpOffset + capsule.stepUp,
        facing
      );
      if (!candidateSupport || candidateSupport.offset < jumpOffset - capsule.stepDown) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      camera.x = bodySafeX;
      autoDropStep.distance += moved;
      return;
    }

    // Ground placement fallback: as soon as backing up exposes a clear landing
    // spot, stop retreating and put the item down there.
    const rootX = camera.x + character.screenOffsetX;
    const target = dropTargetForCarried(rootX);
    if (target.valid) {
      autoDropStep = null;
      beginDropAtTarget(target);
      return;
    }

    const facing = autoDropStep.facing;
    const step = Math.min(0.055, AUTO_DROP_SHUFFLE_SPEED * dt);
    const desiredCameraX = camera.x - facing * step;
    const bodySafeX = resolveObstacleMove(camera.x, desiredCameraX, jumpOffset, false);
    const combinedSafeX = resolveCarriedObjectMove(camera.x, bodySafeX, jumpOffset);
    const moved = Math.abs(combinedSafeX - camera.x);

    if (moved < 0.004) {
      failAutoDropShuffle();
      return;
    }

    const capsule = colliderWorld();
    const candidateRootX = combinedSafeX + character.screenOffsetX;
    const candidateSupport = walkableSupportAt(
      candidateRootX + capsule.offsetX,
      jumpOffset + capsule.stepUp,
      -facing
    );
    if (!candidateSupport || candidateSupport.offset < jumpOffset - capsule.stepDown) {
      failAutoDropShuffle();
      return;
    }

    camera.x = combinedSafeX;
    autoDropStep.distance += moved;
    if (autoDropStep.distance >= AUTO_DROP_SHUFFLE_MAX) failAutoDropShuffle();
  }

  function startDrop() {
    if (!carriedObject || interactionState || autoDropStep || jumping) return;
    const rootX = camera.x + character.screenOffsetX;
    const target = dropTargetForCarried(rootX);
    if (target.socket) {
      if (!target.valid) {
        hintEl.textContent = 'That socket is already occupied';
        hintEl.classList.remove('hidden');
        return;
      }
      hintEl.textContent = `Placing ${socketLabelForPiece(carriedObject)} in socket…`;
      hintEl.classList.remove('hidden');
      beginDropAtTarget(target);
      return;
    }
    if (target.counterweightPlank) {
      if (!target.counterweightAccepted) {
        hintEl.textContent = `Move the log farther over the blue line · ${Math.round((target.counterweightOverlap || 0) * 100)}% inside`;
        hintEl.classList.remove('hidden');
        return;
      }
      if (!target.valid) {
        hintEl.textContent = 'That counterweight position is blocked';
        hintEl.classList.remove('hidden');
        return;
      }
      hintEl.textContent = target.stack ? 'Stacking counterweight…' : 'Placing counterweight…';
      hintEl.classList.remove('hidden');
      if (target.stack) {
        const facing = character.lastFacing >= 0 ? 1 : -1;
        const forwardGap = (target.x - rootX) * facing;
        if (forwardGap > STACK_ASSIST_ROOT_GAP + 0.05 && startAutoDropStackAssist(target)) return;
      }
      beginDropAtTarget(target);
      return;
    }
    if (target.stack) {
      if (!target.valid) {
        // A recognised stack is an explicit placement intent. Never turn a
        // blocked stack attempt into the unrelated backwards ground-drop move.
        hintEl.textContent = 'No room on that stack';
        hintEl.classList.remove('hidden');
        return;
      }
      const facing = character.lastFacing >= 0 ? 1 : -1;
      const forwardGap = (target.x - rootX) * facing;
      if (forwardGap > STACK_ASSIST_ROOT_GAP + 0.05 && startAutoDropStackAssist(target)) return;
      beginDropAtTarget(target);
      return;
    }
    if (!target.valid) {
      if (!startAutoDropStepBack()) {
        hintEl.textContent = 'No room to put that down';
        hintEl.classList.remove('hidden');
      }
      return;
    }
    beginDropAtTarget(target);
  }

  function completeDrop() {
    if (!interactionState || interactionState.type !== 'drop') return;
    const obj = interactionState.object;
    obj.x = interactionState.targetX;
    obj.z = interactionState.socketMeta ? interactionState.targetZ : (obj.gameplayLayerLocked === false ? interactionState.targetZ : pathZ);
    obj.carried = false;
    obj.y = interactionState.targetY;
    obj.socketedTo = interactionState.socketMeta ? { ...interactionState.socketMeta } : null;
    if (isCounterweightPlank(obj)) {
      obj.counterweightAngle = 0;
      obj.counterweightAngularVelocity = 0;
    }
    carriedObject = null;
    interactionState = null;
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    settleGameplayCrates();
    refreshCounterweightBindings();
    const becameCounterweight = !!obj.counterweightBoundTo;
    recordObjectEdit(obj);
    hintEl.textContent = becameCounterweight ? 'Counterweight added' : 'Item placed';
    hintEl.classList.remove('hidden');
  }

  function dropCarriedImmediate() {
    if (!carriedObject) return;
    const obj = carriedObject;
    let target = dropTargetForCarried();
    if (!target.valid) {
      const facing = character.lastFacing >= 0 ? 1 : -1;
      for (let i = 1; i <= 12 && !target.valid; i += 1) {
        const x = character.x - facing * i * 0.12;
        const z = obj.gameplayLayerLocked === false ? obj.z : pathZ;
        const temp = { ...obj, x, z, carried:false };
        const y = restYForGameplayObject(temp, x, null, true);
        const probe = { x, z, y };
        probe.valid = dropTargetIsClear(temp, probe);
        if (probe.valid) target = probe;
      }
    }
    obj.x = target.x;
    obj.z = target.socket ? target.z : (obj.gameplayLayerLocked === false ? target.z : pathZ);
    obj.carried = false;
    obj.y = target.y;
    obj.socketedTo = target.socket ? { hostObjectId:target.socket.host.id, socketId:target.socket.socket.id } : null;
    if (isCounterweightPlank(obj)) {
      obj.counterweightAngle = 0;
      obj.counterweightAngularVelocity = 0;
    }
    carriedObject = null;
    interactionState = null;
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    settleGameplayCrates();
    refreshCounterweightBindings();
    recordObjectEdit(obj);
  }

  function performAction() {
    if (introLocked || editMode || inventoryOpen || interactionState || autoDropStep || climbState) return;
    if (pushingObject) { stopPush(); return; }
    const climbTarget = nearestActionClimbTarget();
    if (climbTarget && startClimb(climbTarget)) return;
    const contextAction = nearestPuzzleContextAction();
    if (contextAction && performPuzzleContextAction(contextAction)) return;
    if (carriedObject) { startDrop(); return; }
    const pushTarget = nearestActionPushable();
    if (pushTarget) { startPush(pushTarget); return; }
    const obj = nearestActionCrate();
    if (obj) startPickup(obj);
    else {
      hintEl.textContent = 'Move closer to a gameplay object';
      hintEl.classList.remove('hidden');
    }
  }

  function drawTerrainSections(view) {
    const centreIndex = terrainSectionIndexAt(camera.x);
    const indices = [];
    for (let i = centreIndex - TERRAIN_SECTION_RENDER_RADIUS; i <= centreIndex + TERRAIN_SECTION_RENDER_RADIUS; i++) {
      if (!terrainHiddenSections.has(i)) indices.push(i);
    }

    // Base terrain is drawn in intervals. Puzzle-owned river modifiers cut a
    // world-space opening out of otherwise normal sections. v1.0.75 splits the
    // visible floor into three depth bands around the authored path: Near, Far A
    // and Far B. They derive from the same section-centre height spine, while the
    // more distant layers soften/fall away from steep path elevation changes.
    function drawGroundBandsForRange(sectionIndex, typeId, minX, maxX) {
      const width = maxX - minX;
      if (width <= 0.01) return;
      const centre = (minX + maxX) * 0.5;
      const u0 = terrainSectionWorldU(minX);
      const uScale = (width / TILE_WIDTH) * 24.0;
      const pathBandEdge = Math.max(PATH_BERM_HALF + 0.02, PATH_OUTER_HALF - TERRAIN_PATH_BAND_OVERLAP);
      const bands = [
        { frontZ:GROUND_NEAR_Z, backZ:pathBandEdge, frontLayer:'near', backLayer:'path' },
        { frontZ:-pathBandEdge, backZ:TERRAIN_FAR_A_BACK_Z, frontLayer:'path', backLayer:'farA' },
        { frontZ:TERRAIN_FAR_A_BACK_Z, backZ:WORLD.farZ, frontLayer:'farA', backLayer:'farB' }
      ];
      for (const band of bands) {
        const depth = band.frontZ - band.backZ;
        if (depth <= 0.001) continue;
        drawObject(ground, view, {
          x:centre, y:groundY + TERRAIN_GROUND_BAND_Y_OFFSET, z:band.frontZ, sx:width, sy:1, sz:depth,
          mesh:terrainBandMesh(sectionIndex,typeId,band.frontLayer,band.backLayer,minX,maxX),
          uvScale:[uScale, Math.max(0.1, depth / Math.max(0.001, GROUND_NEAR_Z - WORLD.farZ) * (ground.uvScale?.[1] ?? 11))],
          uvOffset:[u0,0]
        });
      }
    }

    for (const i of indices) {
      const b = terrainSectionBounds(i);
      const typeId = terrainSectionType(i);
      if (typeId === 'river') continue;
      const intervals = terrainBaseIntervalsForSection(i);
      for (const interval of intervals) drawGroundBandsForRange(i,typeId,interval.minX,interval.maxX);
    }

    for (const i of indices) {
      const b = terrainSectionBounds(i);
      const typeId = terrainSectionType(i);
      if (typeId === 'river') continue;
      const intervals = terrainBaseIntervalsForSection(i);
      const uncut = intervals.length === 1 && Math.abs(intervals[0].minX-b.minX)<0.001 && Math.abs(intervals[0].maxX-b.maxX)<0.001;
      if (uncut) {
        drawObject(pathStrip, view, { x:b.center, sx:TERRAIN_SECTION_LENGTH, mesh:terrainSectionPathMesh(i,typeId), uvScale:[1,1], uvOffset:[0,0] });
        continue;
      }
      for (const interval of intervals) {
        const width = interval.maxX - interval.minX;
        if (width <= 0.01) continue;
        const centre = (interval.minX + interval.maxX) * 0.5;
        drawObject(pathStrip, view, { x:centre, sx:width, mesh:terrainIntervalPathMesh(i,typeId,interval.minX,interval.maxX), uvScale:[1,1], uvOffset:[0,0] });
      }
    }

    // Legacy/manual feature sections remain available for world authoring.
    for (const i of indices) {
      if (terrainSectionType(i) !== 'river') continue;
      const b = terrainSectionBounds(i);
      drawObject(riverBankSurface, view, { force:true, x:b.center, y:0, z:0, sx:1, sy:1, sz:1, mesh:terrainRiverBankMesh(i, 'left') });
      drawObject(riverBankSurface, view, { force:true, x:b.center, y:0, z:0, sx:1, sy:1, sz:1, mesh:terrainRiverBankMesh(i, 'right') });
      const flow = (performance.now() * 0.000010) % 1;
      drawObject(riverWaterSurface, view, { force:true, x:b.center, y:0, z:0, sx:1, sy:1, sz:1, mesh:terrainRiverWaterMesh(i), uvOffset:[0, flow] });
    }

    // Puzzle-owned world features are rendered independently of section bounds.
    // Their geometry is local to the puzzle marker, so moving the marker moves
    // the environmental requirement with the puzzle.
    const visibleMinX = terrainSectionBounds(centreIndex - TERRAIN_SECTION_RENDER_RADIUS).minX;
    const visibleMaxX = terrainSectionBounds(centreIndex + TERRAIN_SECTION_RENDER_RADIUS).maxX;
    for (const mod of puzzleRiverModifiers()) {
      const extent = puzzleRiverExtent(mod);
      if (extent.maxX < visibleMinX || extent.minX > visibleMaxX) continue;
      const baseX = Number(mod.worldCenterX) || 0;
      drawObject(riverBankSurface, view, { force:true, x:baseX, y:0, z:0, sx:1, sy:1, sz:1, mesh:puzzleRiverBankMesh(mod,'left') });
      drawObject(riverBankSurface, view, { force:true, x:baseX, y:0, z:0, sx:1, sy:1, sz:1, mesh:puzzleRiverBankMesh(mod,'right') });
      const flow = (performance.now() * 0.000010) % 1;
      drawObject(riverWaterSurface, view, { force:true, x:baseX, y:0, z:0, sx:1, sy:1, sz:1, mesh:puzzleRiverWaterMesh(mod), uvOffset:[0,flow] });
    }
  }

  function render(now) {
    resize();
    updatePuzzleStreaming(character?.x ?? camera.x);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (autoDropStep) updateAutoDropShuffle(dt);
    if (pushingObject && (pushingObject.deleted || editMode || inventoryOpen || interactionState || carriedObject)) stopPush(true);

    if (interactionState) {
      interactionState.time += dt;
      if (interactionState.time >= interactionState.duration) {
        if (interactionState.type === 'pickup') completePickup();
        else completeDrop();
      }
    }

    updateCounterweightMechanisms(dt);
    updateCartRailAnimations(dt);
    updateCartPathPreview(dt);
    if (climbState) updateClimbState(dt);

    const keyDir = (keyRight ? 1 : 0) - (keyLeft ? 1 : 0);
    const usingKeys = keyDir !== 0;
    const rawAxis = (introLocked || editMode || inventoryOpen || interactionState || autoDropStep || climbState) ? 0 : (usingKeys ? keyDir * (keyRun ? 1 : WALK_POINT) : driveAxis);
    const axisMag = Math.abs(rawAxis);
    const moveDir = axisMag > DRIVE_DEADZONE ? Math.sign(rawAxis) : 0;

    // Map the spring slider directly to motion: halfway from centre is a full
    // walk, the outer half progressively opens into the run.  This keeps one
    // continuous thumb gesture for direction and speed.
    let analogSpeed = 0;
    let targetRun = 0;
    if (moveDir) {
      if (axisMag <= WALK_POINT) {
        const walkAmount = Rig.clamp((axisMag - DRIVE_DEADZONE) / Math.max(0.001, WALK_POINT - DRIVE_DEADZONE), 0, 1);
        analogSpeed = WALK_SPEED * walkAmount;
      } else {
        targetRun = Rig.clamp((axisMag - WALK_POINT) / Math.max(0.001, 1 - WALK_POINT), 0, 1);
        analogSpeed = Rig.lerp(WALK_SPEED, RUN_SPEED, targetRun);
      }
    }
    if (carriedObject) {
      targetRun = 0;
      analogSpeed = Math.min(analogSpeed, WALK_SPEED * 0.92);
    }
    if (pushingObject) {
      targetRun = 0;
      analogSpeed = Math.min(analogSpeed, PUSH_SPEED);
      // This first prototype is push-only, not pull. Handles on both ends mean
      // the player can release, walk around, and push back the other way.
      if (moveDir && moveDir !== pushingSide) analogSpeed = 0;
    }

    // Vertical motion is integrated in world space. jumpOffset remains a derived
    // compatibility value for collision/carry code, but changing terrain height
    // underneath an airborne character can no longer add/subtract jump height.
    const previousCharacterWorldY = character.y;
    let airborneWorldY = character.y;
    if (jumping) {
      jumpTime += dt;
      jumpVelocity -= JUMP_GRAVITY * dt;
      airborneWorldY += jumpVelocity * dt;
      const currentRootX = camera.x + character.screenOffsetX;
      jumpOffset = airborneWorldY - playSurfaceYAt(currentRootX);
    }

    // Preserve the smooth pose blend while allowing the slider to control
    // actual ground speed continuously.  Releasing the thumb springs straight
    // back to idle rather than leaving a run latch behind.
    runBlend += (targetRun - runBlend) * Math.min(1, dt * 5.2);
    const smoothRun = runBlend * runBlend * (3 - 2 * runBlend);
    if (moveDir && analogSpeed > 0) {
      if (pushingObject) {
        const desiredDelta = moveDir * analogSpeed * dt;
        const playerResolved = resolveObstacleMove(camera.x, camera.x + desiredDelta, jumpOffset, jumping);
        const playerDelta = playerResolved - camera.x;
        const cartResolved = resolvePushableMove(pushingObject, pushingObject.x, pushingObject.x + desiredDelta, pushingFloorOffset);
        const cartDelta = cartResolved - pushingObject.x;
        const allowed = Math.sign(desiredDelta) * Math.min(Math.abs(desiredDelta), Math.abs(playerDelta), Math.abs(cartDelta));
        if (Math.abs(allowed) > 0.000001) {
          const pushedCart = pushingObject;
          const previousCartX = pushedCart.x;
          camera.x += allowed;
          movePushedObject(pushedCart, allowed);
          character.lastFacing = pushingSide;
          hideTransientHint();
          maybeStartCartRail(pushedCart, previousCartX);
        }
      } else {
        const proposedX = camera.x + moveDir * analogSpeed * dt;
        const bodyResolvedX = resolveObstacleMove(camera.x, proposedX, jumpOffset, jumping);
        camera.x = resolveCarriedObjectMove(camera.x, bodyResolvedX, jumpOffset);
        hideTransientHint();
      }
    }

    const characterXAfterMove = camera.x + character.screenOffsetX;
    const capsule = colliderWorld();
    const colliderXAfterMove = characterXAfterMove + capsule.offsetX;
    const terrainYAfterMove = playSurfaceYAt(characterXAfterMove);
    if (editMode) {
      // v1.0.46: Edit mode is a free camera/workspace.  The character remains a
      // visual scale reference but no longer participates in terrain, object or
      // gap collision, so panning cannot strand the editor in a hole or behind
      // a collider.  Returning to Play/Test re-acquires normal support below.
      jumping = false;
      jumpTime = 0;
      jumpVelocity = 0;
      jumpOffset = 0;
      standingOnObject = null;
      airborneWorldY = terrainYAfterMove;
    } else if (climbState) {
      // updateClimbState owns camera X, absolute character Y and jumpOffset.
      // Normal support/side collision must stay out of the way until the mantle
      // or descent has completed.
      airborneWorldY = character.y;
    } else if (jumping) {
      // Re-reference the same absolute airborne height to the terrain under the
      // new horizontal position. This is the key to stable jumps over gaps/slopes.
      jumpOffset = airborneWorldY - terrainYAfterMove;
      if (jumpVelocity <= 0) {
        // Only consider surfaces that were at/below the feet at the start of
        // this frame. A higher log/platform must not mask the real floor below
        // once the capsule has slipped beside it.
        const landingCeiling = previousCharacterWorldY - terrainYAfterMove + 0.055;
        const support = walkableSupportAt(colliderXAfterMove, landingCeiling, moveDir);
        if (support) {
          const supportWorldY = terrainYAfterMove + support.offset;
          if (previousCharacterWorldY >= supportWorldY - 0.055 && airborneWorldY <= supportWorldY + 0.01) {
            jumpOffset = support.offset;
            airborneWorldY = supportWorldY;
            jumpVelocity = 0;
            jumping = false;
            jumpTime = 0;
            standingOnObject = support.obj;
          }
        }
      }
    } else {
      const support = editMode
        ? editorSafeSupportAt(colliderXAfterMove, Infinity, moveDir)
        : walkableSupportAt(colliderXAfterMove, Infinity, moveDir);
      if (support) {
        const supportWorldY = terrainYAfterMove + support.offset;
        const deltaWorld = supportWorldY - previousCharacterWorldY;
        const editorSnap = editMode && support.source === 'editor-fallback';
        if (editorSnap || (deltaWorld <= capsule.stepUp + 0.025 && deltaWorld >= -capsule.stepDown)) {
          jumpOffset = support.offset;
          standingOnObject = support.obj;
        } else if (deltaWorld < -capsule.stepDown) {
          // A real gap/drop: preserve current world height and let gravity begin.
          jumpOffset = previousCharacterWorldY - terrainYAfterMove;
          standingOnObject = null;
          jumping = true;
          jumpTime = 0;
          jumpVelocity = 0;
          jumpCameraBaseY = previousCharacterWorldY;
        }
      } else {
        // In Play/Test mode a real unsupported gap remains a gap.
        jumpOffset = previousCharacterWorldY - terrainYAfterMove;
        standingOnObject = null;
        jumping = true;
        jumpTime = 0;
        jumpVelocity = 0;
        jumpCameraBaseY = previousCharacterWorldY;
      }
    }

    // Horizontal movement can legitimately carry an airborne capsule over a
    // platform, but it must never finish a frame embedded in the platform side.
    // Resolve any such overlap even when the player has released the stick.
    const resolvedFeetWorldY = playSurfaceYAt(camera.x + character.screenOffsetX) + jumpOffset;
    if (!editMode && !climbState) {
      const groundedSupport = !jumping && standingOnObject && isSupportSurfaceObject(standingOnObject)
        ? standingOnObject
        : null;
      camera.x = resolveStaticBodyPenetration(camera.x, resolvedFeetWorldY, groundedSupport);
    }

    const cameraDelta = camera.x - previousCameraX;
    const isWalking = !climbState && Math.abs(cameraDelta) > 0.0001;
    if (moveDir) character.lastFacing = pushingObject ? pushingSide : moveDir;
    if (isWalking) {
      const travel = Math.abs(cameraDelta);
      const stride = Rig.lerp(WALK_STRIDE, RUN_STRIDE, smoothRun);
      locomotionPhase = (locomotionPhase + travel / Math.max(0.001, stride)) % 1;
      character.distanceTravelled += travel;
    }
    previousCameraX = camera.x;

    character.x = camera.x + character.screenOffsetX;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    checkPuzzleRespawnVolumes();
    updateTerrainSectionUi(false);
    updateCameraFollow(dt);
    updateCameraNodeOffset(dt);
    if (cameraEditMode) updateCameraEditorUi();
    savePlayerPosition(false);
    updatePuzzleStreaming(character.x);
    updateBiomeDatasetStreaming(character.x);
    checkPuzzleCompletion(character.x);
    updatePuzzleRewards(now);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.uv);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewCameraX = camera.x + cameraNodeCurrentOffset.x;
    const viewCameraY = camera.y + cameraNodeCurrentOffset.y;
    const eye = [viewCameraX, viewCameraY, camera.z + cameraNodeCurrentOffset.z];
    // X/Y offsets pan the framing while preserving the normal camera tilt. Z
    // moves only the eye, acting as a local distance/zoom adjustment.
    const target = [viewCameraX, camera.targetY + cameraNodeCurrentOffset.y, camera.targetZ];
    const view = mat4LookAt(eye, target, [0, 1, 0]);
    currentViewMatrix = view;

    // v1.0.8: terrain comes from contiguous 10 m world sections; River sections can now widen to a full bridge-scale crossing.
    // With every section visible this should be visually indistinguishable from
    // the previous continuous terrain; the section editor can hide any one
    // piece to verify that the segmentation is genuinely working.
    drawTerrainSections(view);
    for (const obj of backdrop) drawObject(obj, view);
    for (const obj of midfill) drawObject(obj, view);

    drawRigCharacter(view, isWalking);

    for (const obj of frontOccluders) drawObject(obj, view);
    drawPuzzleCartPathGhost(view);

    presentSceneWithPost();
    drawEditorOverlay();

    const baseMotionLabel = climbState ? 'CLIMB' : (jumping ? 'JUMP' : (runBlend > .55 && isWalking ? 'RUN' : (isWalking ? 'WALK' : 'IDLE')));
    const motionLabel = interactionState
      ? (interactionState.type === 'pickup' ? 'PICK UP' : 'PUT DOWN')
      : (pushingObject ? `PUSH ${isWalking ? 'WALK' : 'IDLE'}` : (carriedObject ? `CARRY ${isWalking ? 'WALK' : 'IDLE'}` : baseMotionLabel));
    if (editMode) {
      const selectedDepth = selectionCycleInfo && selectedObject && selectionCycleInfo.objects.includes(selectedObject) && selectionCycleInfo.objects.length > 1
        ? ` · DEPTH ${selectionCycleInfo.objects.indexOf(selectedObject)+1}/${selectionCycleInfo.objects.length}` : '';
      const selected = selectedObject && !selectedObject.deleted
        ? `${selectedObject.category === 'gameplay' ? 'GAMEPLAY · ' : 'DRESSING · '}${selectedObject.assetName}${selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked ? ' · GAME LAYER' : ''}${selectedObject.collision ? ' · COLLISION' : ''}${selectedDepth}`
        : (addAssetType ? `ADD ${addAssetType}` : 'tap scenery to select');
      statusEl.textContent = `EDIT · ${runtimeBiomeBlendLabel(character.x)} · ${selected}`;
    } else {
      const puzzle = activePuzzleNear(character.x);
      const puzzleLabel = puzzle ? ` · ${puzzle.def.label}${puzzle.solved ? ' ✓' : ''}` : '';
      const biomeLabel = runtimeBiomeBlendLabel(character.x);
      statusEl.textContent = PLAYER_MODE
        ? `${biomeLabel} · ${motionLabel}${puzzleLabel}`
        : (debugDepth
          ? `Depth view · ${biomeLabel} · camera X ${camera.x.toFixed(1)}${puzzleLabel}`
          : `${biomeLabel} · ${motionLabel} · camera X ${camera.x.toFixed(1)}${puzzleLabel}`);
    }

    updatePuzzleThoughts();
    updateActionUI();
    if (editMode || puzzleTestMode) updatePuzzlePanel();
    requestAnimationFrame(render);
  }

  function setDriveAxis(value) {
    driveAxis = Rig.clamp(value, -1, 1);
    const display = Math.abs(driveAxis) < DRIVE_DEADZONE ? 0 : driveAxis;
    if (driveThumb) driveThumb.style.left = `${50 + display * 43}%`;
    if (driveControl) {
      driveControl.setAttribute('aria-valuenow', String(Math.round(display * 100)));
      driveControl.classList.toggle('moving', display !== 0);
      driveControl.classList.toggle('running', Math.abs(display) > WALK_POINT + 0.04);
    }
  }

  function updateDriveFromPointer(e) {
    if (!driveControl) return;
    const rect = driveControl.getBoundingClientRect();
    const centre = rect.left + rect.width * 0.5;
    const usableHalf = rect.width * 0.43;
    setDriveAxis((e.clientX - centre) / Math.max(1, usableHalf));
  }

  if (driveControl) {
    driveControl.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (introLocked) return;
      drivePointer = e.pointerId;
      driveControl.classList.add('dragging');
      driveControl.setPointerCapture?.(e.pointerId);
      updateDriveFromPointer(e);
      hideTransientHint();
    });
    driveControl.addEventListener('pointermove', e => {
      if (e.pointerId !== drivePointer) return;
      e.preventDefault();
      updateDriveFromPointer(e);
    });
    const releaseDrive = e => {
      if (drivePointer !== null && e.pointerId !== drivePointer) return;
      drivePointer = null;
      driveControl.classList.remove('dragging');
      setDriveAxis(0);
    };
    driveControl.addEventListener('pointerup', releaseDrive);
    driveControl.addEventListener('pointercancel', releaseDrive);
    driveControl.addEventListener('lostpointercapture', releaseDrive);
    driveControl.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setDriveAxis(Math.max(-1, driveAxis - 0.25)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setDriveAxis(Math.min(1, driveAxis + 0.25)); }
      if (e.key === 'Home' || e.key === '0') { e.preventDefault(); setDriveAxis(0); }
    });
    driveControl.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setDriveAxis(0);
    });
  }

  function triggerJump(){
    if (introLocked || editMode || inventoryOpen || jumping || interactionState || pushingObject || climbState) return;
    jumping = true;
    jumpTime = 0;
    jumpCameraBaseY = character.y;
    // Keep the current world-space support height so a jump from any authored
    // platform behaves identically even if the visual terrain below it changes.
    standingOnObject = null;
    jumpVelocity = JUMP_VELOCITY;
    hideTransientHint();
  }
  jumpBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    triggerJump();
    jumpBtn.setPointerCapture?.(e.pointerId);
  });

  actionBtn?.addEventListener('pointerdown', e => {
    e.preventDefault();
    performAction();
    actionBtn.setPointerCapture?.(e.pointerId);
  });

  function terrainSectionLabel(index) { return `Section ${Math.trunc(index)}`; }
  function terrainSectionBoundsLabel(index) {
    const b = terrainSectionBounds(index);
    const fmt = n => `${n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)} m`;
    return `${fmt(b.minX)} to ${fmt(b.maxX)}`;
  }
  function updateTerrainSectionUi(force = false) {
    const currentIndex = terrainSectionIndexAt(character?.x ?? camera.x);
    if (!force && terrainLastUiCurrentIndex === currentIndex && sectionPanel?.hidden) return;
    terrainLastUiCurrentIndex = currentIndex;
    if (sectionCurrentEl) sectionCurrentEl.textContent = terrainSectionLabel(currentIndex);
    if (sectionCurrentBoundsEl) sectionCurrentBoundsEl.textContent = terrainSectionBoundsLabel(currentIndex);
    if (sectionSelectedEl) sectionSelectedEl.textContent = terrainSectionLabel(terrainSelectedSectionIndex);
    const selectedType = terrainSectionType(terrainSelectedSectionIndex);
    const selectedRiver = riverSectionSettings(terrainSelectedSectionIndex);
    const collisionEnabled = terrainSectionCollisionEnabled(terrainSelectedSectionIndex);
    const selectedBounds = terrainSectionBounds(terrainSelectedSectionIndex);
    const ownedRivers = puzzleWorldModifiersReady ? puzzleRiverModifiersIntersectingRange(selectedBounds.minX, selectedBounds.maxX) : [];
    const ownedLabel = ownedRivers.length ? ` · ${ownedRivers.length === 1 ? 'puzzle river' : `${ownedRivers.length} puzzle rivers`}` : '';
    const selectedPathHeight = terrainSectionPathHeight(terrainSelectedSectionIndex);
    if (sectionSelectedBoundsEl) sectionSelectedBoundsEl.textContent = `${terrainSectionBoundsLabel(terrainSelectedSectionIndex)} · ${terrainSectionTypeLabel(terrainSelectedSectionIndex)} · path ${selectedPathHeight >= 0 ? '+' : ''}${selectedPathHeight.toFixed(1)} m${selectedType === 'river' ? ` · ${selectedRiver.width.toFixed(1)} m` : ''}${ownedLabel}${collisionEnabled ? '' : ' · collision off'}`;
    if (sectionHeightInput && document.activeElement !== sectionHeightInput) sectionHeightInput.value = String(selectedPathHeight);
    if (sectionHeightNumber && document.activeElement !== sectionHeightNumber) sectionHeightNumber.value = selectedPathHeight.toFixed(1);
    if (sectionHeightValue) sectionHeightValue.textContent = `${selectedPathHeight >= 0 ? '+' : ''}${selectedPathHeight.toFixed(1)} m`;
    if (sectionHeightLinkInput) sectionHeightLinkInput.checked = !!terrainHeightLinkSubsequent;
    for (const layerId of TERRAIN_DEPTH_LAYER_IDS) {
      const control = sectionLayerControls[layerId];
      if (!control) continue;
      const info = terrainLayerModeInfo(terrainSelectedSectionIndex, layerId);
      const explicit = info.mode === 'explicit';
      const resolved = terrainLayerSectionHeight(terrainSelectedSectionIndex, layerId);
      const offset = terrainLayerOffsetAt(terrainSelectedSectionIndex, layerId);
      if (control.mode && document.activeElement !== control.mode) control.mode.value = explicit ? 'explicit' : 'derived';
      if (control.value) {
        control.value.min = explicit ? '-50' : '-6';
        control.value.max = explicit ? '80' : '6';
        control.value.step = explicit ? '0.1' : '0.05';
        if (document.activeElement !== control.value) control.value.value = String(explicit ? resolved : offset);
        control.value.setAttribute('aria-valuetext', explicit ? `${resolved.toFixed(1)} metres` : `${offset.toFixed(2)} metre offset`);
      }
      if (control.summary) control.summary.textContent = explicit
        ? `Explicit · height ${resolved >= 0 ? '+' : ''}${resolved.toFixed(1)} m`
        : `Linked · offset ${offset >= 0 ? '+' : ''}${offset.toFixed(1)} m · resolved ${resolved >= 0 ? '+' : ''}${resolved.toFixed(1)} m`;
    }
    if (sectionTypeSelect) sectionTypeSelect.value = selectedType;
    if (sectionRiverWidthRow) sectionRiverWidthRow.hidden = selectedType !== 'river';
    if (sectionRiverWidthInput) sectionRiverWidthInput.value = selectedRiver.width.toFixed(1);
    if (sectionRiverWidthValue) sectionRiverWidthValue.textContent = `${selectedRiver.width.toFixed(1)} m`;
    if (sectionCollisionBtn) {
      sectionCollisionBtn.textContent = collisionEnabled
        ? (selectedType === 'river' ? 'Flat bank collision ON · water gap' : 'Terrain collision ON')
        : 'Terrain collision OFF';
      sectionCollisionBtn.setAttribute('aria-pressed', String(collisionEnabled));
    }
    if (sectionBankDressBtn) sectionBankDressBtn.hidden = selectedType !== 'river';
    if (sectionBankClearBtn) sectionBankClearBtn.hidden = selectedType !== 'river';

    const visible = !terrainHiddenSections.has(terrainSelectedSectionIndex);
    if (sectionVisibleBtn) {
      sectionVisibleBtn.textContent = visible ? 'Terrain visible' : 'Terrain hidden';
      sectionVisibleBtn.setAttribute('aria-pressed', String(visible));
    }
    if (sectionGuidesBtn) {
      sectionGuidesBtn.textContent = terrainSectionGuidesVisible ? 'Hide section guides' : 'Show section guides';
      sectionGuidesBtn.setAttribute('aria-pressed', String(terrainSectionGuidesVisible));
    }
    if (sectionGuidesPersistInput) sectionGuidesPersistInput.checked = terrainSectionGuidesPersist;
  }
  function selectTerrainSection(index) {
    terrainSelectedSectionIndex = Math.trunc(Number(index) || 0);
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  }
  function setTerrainSectionPanelOpen(open) {
    if (!sectionPanel || !sectionBtn) return;
    const next = !!open;
    sectionPanel.hidden = !next;
    sectionBtn.setAttribute('aria-expanded', String(next));
    if (next) {
      setStageMenuOpen(false);
      setFogPanelOpen?.(false);
      setPostPanelOpen?.(false);
      setSoundPanelOpen?.(false);
      setInventoryOpen?.(false);
      if (cameraEditMode) { cameraEditMode = false; updateCameraEditorUi(); }
      if (!terrainSectionGuidesVisible) terrainSectionGuidesVisible = true;
      selectTerrainSection(terrainSectionIndexAt(character?.x ?? camera.x));
    } else if (!terrainSectionGuidesPersist) {
      terrainSectionGuidesVisible = false;
    }
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  }

  function setStageMenuOpen(open) {
    if (!stageMenuPanel || !stageMenuBtn) return;
    const next = !!open;
    stageMenuPanel.hidden = !next;
    stageMenuBtn.setAttribute('aria-expanded', String(next));
    stageMenuBtn.classList.toggle('active', next);
    if (next) {
      if (cameraEditMode) { cameraEditMode = false; updateCameraEditorUi(); }
      if (sectionPanel && !sectionPanel.hidden) setTerrainSectionPanelOpen(false);
      setFogPanelOpen?.(false);
      setPostPanelOpen?.(false);
      setSoundPanelOpen?.(false);
      setInventoryOpen?.(false);
    }
  }

  function syncSoundUi() {
    const audio = window.SideScrollAudio;
    const state = audio?.getState?.();
    if (!state) {
      if (soundStatusEl) soundStatusEl.textContent = 'Audio system unavailable';
      return;
    }
    if (musicEnabledInput) musicEnabledInput.checked = !!state.musicEnabled;
    const percent = Math.round((Number(state.musicVolume) || 0) * 100);
    if (musicVolumeInput && document.activeElement !== musicVolumeInput) musicVolumeInput.value = String(percent);
    if (musicVolumeValue) musicVolumeValue.textContent = `${percent}%`;
    if (soundStatusEl) soundStatusEl.textContent = state.status || 'Music ready';
  }
  function setSoundPanelOpen(open) {
    if (!soundPanel || !soundBtn) return;
    const next = !!open;
    soundPanel.hidden = !next;
    soundBtn.setAttribute('aria-expanded', String(next));
    if (next) {
      setStageMenuOpen(false);
      setTerrainSectionPanelOpen(false);
      setFogPanelOpen(false);
      setPostPanelOpen(false);
      setInventoryOpen(false);
      if (cameraEditMode) { cameraEditMode = false; updateCameraEditorUi(); }
      syncSoundUi();
    }
  }
  bindEditorPress(soundBtn, () => setSoundPanelOpen(soundPanel?.hidden !== false));
  bindEditorPress(soundCloseBtn, () => setSoundPanelOpen(false));
  musicEnabledInput?.addEventListener('input', () => {
    window.SideScrollAudio?.setMusicEnabled?.(musicEnabledInput.checked);
    syncSoundUi();
  });
  musicVolumeInput?.addEventListener('input', () => {
    const value = Math.max(0, Math.min(100, Number(musicVolumeInput.value) || 0));
    window.SideScrollAudio?.setMusicVolume?.(value / 100);
    if (musicVolumeValue) musicVolumeValue.textContent = `${Math.round(value)}%`;
  });
  window.addEventListener('sidescroll-audio-state', syncSoundUi);
  window.SideScrollAudio?.prepare?.();
  syncSoundUi();

  function postHexToRgb(hex) {
    const n = parseInt(String(hex).replace('#',''), 16);
    return [((n >> 16) & 255)/255, ((n >> 8) & 255)/255, (n & 255)/255];
  }
  function postRgbToHex(rgb) {
    return '#' + rgb.map(v => Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  }
  function syncPostUi() {
    if (postBrightnessInput) postBrightnessInput.value = String(postSettings.brightness);
    if (postContrastInput) postContrastInput.value = String(postSettings.contrast);
    if (postSaturationInput) postSaturationInput.value = String(postSettings.saturation);
    if (postTintColourInput) postTintColourInput.value = postRgbToHex(postSettings.tintColor);
    if (postTintAmountInput) postTintAmountInput.value = String(postSettings.tintAmount);
    if (postBrightnessValue) postBrightnessValue.textContent = postSettings.brightness.toFixed(2);
    if (postContrastValue) postContrastValue.textContent = postSettings.contrast.toFixed(2);
    if (postSaturationValue) postSaturationValue.textContent = postSettings.saturation.toFixed(2);
    if (postTintAmountValue) postTintAmountValue.textContent = postSettings.tintAmount.toFixed(2);
  }
  function setPostPanelOpen(open) {
    if (!postPanel || !postBtn) return;
    postPanel.hidden = !open;
    postBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      setStageMenuOpen(false);
      setTerrainSectionPanelOpen(false);
      setFogPanelOpen(false);
      setSoundPanelOpen(false);
      syncPostUi();
    }
  }
  bindEditorPress(postBtn, () => setPostPanelOpen(postPanel?.hidden !== false));
  bindEditorPress(postCloseBtn, () => setPostPanelOpen(false));
  postBrightnessInput?.addEventListener('input', () => { postSettings.brightness = Number(postBrightnessInput.value); savePostSettings(); syncPostUi(); });
  postContrastInput?.addEventListener('input', () => { postSettings.contrast = Number(postContrastInput.value); savePostSettings(); syncPostUi(); });
  postSaturationInput?.addEventListener('input', () => { postSettings.saturation = Number(postSaturationInput.value); savePostSettings(); syncPostUi(); });
  postTintColourInput?.addEventListener('input', () => { postSettings.tintColor.splice(0,3,...postHexToRgb(postTintColourInput.value)); savePostSettings(); syncPostUi(); });
  postTintAmountInput?.addEventListener('input', () => { postSettings.tintAmount = Number(postTintAmountInput.value); savePostSettings(); syncPostUi(); });
  bindEditorPress(postResetBtn, () => {
    postSettings.brightness=DEFAULT_POST.brightness;
    postSettings.contrast=DEFAULT_POST.contrast;
    postSettings.saturation=DEFAULT_POST.saturation;
    postSettings.tintAmount=DEFAULT_POST.tintAmount;
    postSettings.tintColor.splice(0,3,...DEFAULT_POST.tintColor);
    savePostSettings();
    syncPostUi();
  });
  syncPostUi();

  function fogHexToRgb(hex) {
    const n = parseInt(String(hex).replace('#',''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function fogRgbToHex(rgb) {
    return '#' + rgb.map(v => Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  }
  function syncFogUi() {
    if (fogEnabledInput) fogEnabledInput.checked = fogSettings.enabled;
    if (fogColourInput) fogColourInput.value = fogRgbToHex(fogSettings.color);
    if (fogStartInput) fogStartInput.value = String(fogSettings.near);
    if (fogCurveInput) fogCurveInput.value = String(fogSettings.curve);
    if (fogAmountInput) fogAmountInput.value = String(fogSettings.amount);
    if (fogStartValue) fogStartValue.textContent = fogSettings.near.toFixed(1);
    if (fogCurveValue) fogCurveValue.textContent = fogSettings.curve.toFixed(2);
    if (fogAmountValue) fogAmountValue.textContent = fogSettings.amount.toFixed(2);
  }
  function setFogPanelOpen(open) {
    if (!fogPanel || !fogBtn) return;
    fogPanel.hidden = !open;
    fogBtn.setAttribute('aria-expanded', String(open));
    if (open) { setStageMenuOpen(false); setTerrainSectionPanelOpen(false); setPostPanelOpen(false); setSoundPanelOpen(false); syncFogUi(); }
  }
  bindEditorPress(fogBtn, () => setFogPanelOpen(fogPanel?.hidden !== false));
  bindEditorPress(fogCloseBtn, () => setFogPanelOpen(false));
  fogEnabledInput?.addEventListener('input', () => { fogSettings.enabled = fogEnabledInput.checked; saveFogSettings(); syncFogUi(); });
  fogColourInput?.addEventListener('input', () => { const c=fogHexToRgb(fogColourInput.value); fogSettings.color[0]=c[0]; fogSettings.color[1]=c[1]; fogSettings.color[2]=c[2]; saveFogSettings(); syncFogUi(); });
  fogStartInput?.addEventListener('input', () => { fogSettings.near = Number(fogStartInput.value); saveFogSettings(); syncFogUi(); });
  fogCurveInput?.addEventListener('input', () => { fogSettings.curve = Number(fogCurveInput.value); saveFogSettings(); syncFogUi(); });
  fogAmountInput?.addEventListener('input', () => { fogSettings.amount = Number(fogAmountInput.value); saveFogSettings(); syncFogUi(); });
  bindEditorPress(fogResetBtn, () => { fogSettings.enabled=DEFAULT_FOG.enabled; fogSettings.near=DEFAULT_FOG.near; fogSettings.far=DEFAULT_FOG.far; fogSettings.amount=DEFAULT_FOG.amount; fogSettings.curve=DEFAULT_FOG.curve; fogSettings.color.splice(0,3,...DEFAULT_FOG.color); saveFogSettings(); syncFogUi(); });
  syncFogUi();

  debugBtn.addEventListener('click', () => {
    debugDepth = !debugDepth;
    debugBtn.setAttribute('aria-pressed', String(debugDepth));
    debugBtn.textContent = debugDepth ? 'Normal view' : 'Depth view';
    depthKey.hidden = !debugDepth;
    hideHint();
    setStageMenuOpen(false);
  });

  collisionViewBtn?.addEventListener('click', () => {
    collisionDebugView = !collisionDebugView;
    collisionViewBtn.setAttribute('aria-pressed', String(collisionDebugView));
    collisionViewBtn.textContent = collisionDebugView ? 'Hide collision' : 'Collision';
    hideHint();
    setStageMenuOpen(false);
  });

  const syncPlayerHintsButton = () => {
    if (!playerHintsBtn) return;
    playerHintsBtn.setAttribute('aria-pressed', String(playerHintsEnabled));
    playerHintsBtn.textContent = playerHintsEnabled ? 'Hints on' : 'Hints off';
  };
  bindEditorPress(playerHintsBtn, () => {
    playerHintsEnabled = !playerHintsEnabled;
    try { localStorage.setItem(PLAYER_HINT_STORAGE_KEY, playerHintsEnabled ? '1' : '0'); } catch (_) {}
    syncPlayerHintsButton();
    setStageMenuOpen(false);
  });
  syncPlayerHintsButton();

  bindEditorPress(inventoryBtn, () => { setStageMenuOpen(false); setInventoryOpen(!inventoryOpen); });
  bindEditorPress(inventoryCloseBtn, () => setInventoryOpen(false));

  bindEditorPress(deleteSaveBtn, () => {
    if (!PLAYER_MODE) return;
    if (!window.confirm('Delete this player save and start the adventure again?')) return;
    // Prevent pagehide from immediately writing the old position back after
    // we clear the save. This was why Delete save appeared not to return to start.
    playerSaveDeletionInProgress = true;
    try { localStorage.removeItem(PLAYER_POSITION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PLAYER_PUZZLE_STATE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PLAYER_INVENTORY_STORAGE_KEY); } catch (_) {}
    window.location.reload();
  });

  bindEditorPress(editBtn, () => {
    setStageMenuOpen(false);
    if (puzzleTestMode) backToPuzzleSetup();
    else if (!editMode) { editorScope = 'environment'; setEditMode(true); buildAssetPalette(); updatePuzzlePanel(); }
  });
  bindEditorPress(editorDoneBtn, () => setEditMode(false));
  bindEditorPress(environmentScopeBtn, () => setEditorScope('environment'));
  bindEditorPress(puzzleScopeBtn, () => setEditorScope('puzzle'));
  bindEditorPress(puzzleSourceLibraryBtn, () => setPuzzleBrowserMode('library'));
  bindEditorPress(puzzleSourceSceneBtn, () => setPuzzleBrowserMode('scene'));
  puzzleSelect?.addEventListener('change', () => {
    if (puzzleBrowserMode !== 'library') return;
    editorPuzzleLibraryGroupId = puzzleSelect.value || null;
    selectObject(null);
    buildAssetPalette();
    updatePuzzlePanel();
  });
  bindEditorPress(puzzleEditBtn, editSelectedScenePuzzle);
  bindEditorPress(puzzleFocusBtn, focusSelectedPuzzle);
  const commitMarkerXInput = () => {
    if (!puzzleMarkerXInput || puzzleBrowserMode !== 'scene') return;
    const marker = selectedPuzzleMarker();
    const nextX = Number(puzzleMarkerXInput.value);
    if (!marker || !Number.isFinite(nextX)) {
      if (marker) puzzleMarkerXInput.value = Number(marker.x).toFixed(1);
      return;
    }
    if (movePuzzleMarkerTo(marker, nextX)) {
      persistPuzzleMarkerPosition(marker);
      settleGameplayCrates();
      renderScenePuzzleList({ force:true });
      updatePuzzlePanel();
      hintEl.textContent = `Moved ${markerDefinition(marker)?.label || marker.group} marker to x ${nextX.toFixed(1)}`;
      hintEl.classList.remove('hidden');
    }
  };
  puzzleMarkerXInput?.addEventListener('pointerdown', event => event.stopPropagation(), {passive:true});
  puzzleMarkerXInput?.addEventListener('click', event => event.stopPropagation());
  puzzleMarkerXInput?.addEventListener('change', commitMarkerXInput);
  puzzleMarkerXInput?.addEventListener('blur', commitMarkerXInput);
  puzzleMarkerXInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); commitMarkerXInput(); puzzleMarkerXInput.blur(); }
  });
  bindEditorPress(puzzleSpawnBtn, spawnSelectedPuzzleHere);
  bindEditorPress(puzzleCreateBtn, createPuzzleHere);
  bindEditorPress(puzzleClearStageBtn, clearPuzzleStage);
  bindEditorPress(puzzleRestoreStageBtn, restoreNormalPuzzleStage);
  bindEditorPress(puzzleExportBtn, exportSelectedPuzzle);
  bindEditorPress(puzzleRemoveBtn, removeSelectedLocalPuzzle);
  bindEditorPress(puzzleDeleteTemplateBtn, deleteSelectedPuzzleTemplate);
  function toggleAssetBrowserForCurrentScope() {
    if (!editMode || !editorPalette) return;
    const opening = editorPalette.hidden;
    setAssetPaletteOpen(opening, { clearPending: !opening });
    if (opening) {
      puzzleExclusionEditMode = false;
      addAssetType = null;
      selectedObject = null;
      collisionEditMode = false;
      collisionHandleIndex = -1;
      showAssetBrowser();
      updateEditorButtons();
    }
  }
  bindEditorPress(openAssetsBtn, toggleAssetBrowserForCurrentScope);
  bindEditorPress(openEnvironmentAssetsBtn, toggleAssetBrowserForCurrentScope);
  bindEditorPress(worldGroupNewBtn,()=>{if(editorScope!=='environment')setEditorScope('environment');if(addAssetType)exitPlacementMode();worldGroupTemplatePlaceMode=false;createWorldGroup();});
  bindEditorPress(worldGroupEditBtn,()=>{worldGroupTemplatePlaceMode=false;setWorldGroupEditMode(!worldGroupEditMode);});
  bindEditorPress(worldGroupMoveBtn,()=>{const group=worldGroupById(selectedWorldGroupId);if(!group)return;if(addAssetType)exitPlacementMode();worldGroupTemplatePlaceMode=false;worldGroupMoveMode=!worldGroupMoveMode;renderWorldGroupTools({force:true});hintEl.textContent=worldGroupMoveMode?`MOVE ${group.label.toUpperCase()} · tap its new scene position`:'Group move cancelled';hintEl.classList.remove('hidden');});
  bindEditorPress(worldGroupRenameBtn,renameSelectedWorldGroup);
  bindEditorPress(worldGroupDissolveBtn,dissolveSelectedWorldGroup);
  bindEditorPress(worldGroupDeleteBtn,deleteSelectedWorldGroup);
  bindEditorPress(worldGroupExclusionToggleBtn,()=>{const group=worldGroupById(selectedWorldGroupId);if(!group)return;const ex=ensureWorldGroupExclusion(group);ex.enabled=!ex.enabled;saveSceneData();worldGroupListSignature='';renderWorldGroupTools({force:true});hintEl.textContent=ex.enabled?`${group.label} exclusion enabled · procedural dressing inside it is suppressed`:`${group.label} exclusion disabled · procedural dressing restored`;hintEl.classList.remove('hidden');});
  bindEditorPress(worldGroupExclusionEditBtn,()=>setWorldGroupExclusionEditMode(!worldGroupExclusionEditMode));
  bindEditorPress(worldGroupExclusionFitBtn,()=>{const group=worldGroupById(selectedWorldGroupId);if(!group)return;fitWorldGroupExclusion(group,{enable:true});hintEl.textContent=`${group.label} exclusion fitted around current members`;hintEl.classList.remove('hidden');});
  bindEditorPress(worldGroupMembershipBtn,()=>{const group=worldGroupById(selectedWorldGroupId);if(!group||!selectedObject||selectedObject.deleted||selectedObject.puzzleInstanceId||!selectedObject.userAdded)return;const remove=selectedObject.worldGroupId===group.id;if(setObjectWorldGroup(selectedObject,remove?null:group.id)){hintEl.textContent=remove?`Removed asset from ${group.label}`:`Added asset to ${group.label}`;hintEl.classList.remove('hidden');}});
  bindEditorPress(worldTemplateSaveBtn,saveSelectedWorldGroupAsTemplate);
  bindEditorPress(worldTemplatePlaceBtn,()=>setWorldGroupTemplatePlaceMode(!worldGroupTemplatePlaceMode));
  bindEditorPress(worldTemplateDeleteBtn,deleteSelectedWorldGroupTemplate);
  bindEditorPress(editorPaletteClose, () => {
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
  });
  bindEditorPress(assetSetupBackBtn, showAssetBrowser);
  bindEditorPress(thoughtEditorCloseBtn,()=>selectObject(null));
  if(thoughtTextInput){
    thoughtTextInput.addEventListener('pointerdown',e=>e.stopPropagation(),{passive:true});
    thoughtTextInput.addEventListener('change',commitThoughtText);
    thoughtTextInput.addEventListener('blur',commitThoughtText);
  }
  if(thoughtRadiusInput){
    thoughtRadiusInput.addEventListener('pointerdown',e=>e.stopPropagation(),{passive:true});
    thoughtRadiusInput.addEventListener('input',()=>{
      if(!selectedIsThoughtTrigger())return;
      selectedObject.thoughtRadius=Rig.clamp(Number(thoughtRadiusInput.value)||1.4,.25,8);
      if(thoughtRadiusValue)thoughtRadiusValue.textContent=`${selectedObject.thoughtRadius.toFixed(2)} m`;
    });
    thoughtRadiusInput.addEventListener('change',()=>{if(selectedIsThoughtTrigger())recordObjectEdit(selectedObject);});
  }
  bindEditorPress(thoughtOnceBtn,()=>{
    if(!selectedIsThoughtTrigger())return;
    selectedObject.thoughtOnce=selectedObject.thoughtOnce===false;
    recordObjectEdit(selectedObject);syncThoughtEditor();
  });
  bindEditorPress(cameraNodeEditorCloseBtn,()=>selectObject(null));
  const bindCameraNodeRange=(input,valueEl,key,min,max,decimals=1)=>{
    if(!input)return;
    input.addEventListener('pointerdown',e=>e.stopPropagation(),{passive:true});
    input.addEventListener('input',()=>{
      if(!selectedIsCameraTrigger())return;
      const value=Rig.clamp(Number(input.value)||0,min,max); selectedObject[key]=value;
      if(valueEl){
        if(key==='cameraNodeRadius') valueEl.textContent=`${value.toFixed(2)} m`;
        else if(key==='cameraNodeCurveStart' || key==='cameraNodeCurveEnd') valueEl.textContent=cameraNodeCurveLabel(value);
        else valueEl.textContent=`${value>=0?'+':''}${value.toFixed(decimals)} m`;
      }
    });
    input.addEventListener('change',()=>{if(selectedIsCameraTrigger())recordObjectEdit(selectedObject);});
  };
  bindCameraNodeRange(cameraNodeRadiusInput,cameraNodeRadiusValue,'cameraNodeRadius',.5,20,2);
  bindCameraNodeRange(cameraNodeXInput,cameraNodeXValue,'cameraNodeOffsetX',-8,8,1);
  bindCameraNodeRange(cameraNodeYInput,cameraNodeYValue,'cameraNodeOffsetY',-5,5,1);
  bindCameraNodeRange(cameraNodeZInput,cameraNodeZValue,'cameraNodeOffsetZ',-8,8,1);
  bindCameraNodeRange(cameraNodeCurveStartInput,cameraNodeCurveStartValue,'cameraNodeCurveStart',-1,1,2);
  bindCameraNodeRange(cameraNodeCurveEndInput,cameraNodeCurveEndValue,'cameraNodeCurveEnd',-1,1,2);
  bindEditorPress(collectibleSetupBackBtn, showAssetBrowser);
  if (collectibleNameInput) {
    const commitCollectibleName = () => {
      if (!collectibleSetupItemId) return;
      const fallback = INVENTORY_ITEM_DEFS[collectibleSetupItemId]?.label || collectibleSetupItemId;
      const label = collectibleNameInput.value.trim() || fallback;
      updateCollectibleSetup(collectibleSetupItemId, { label });
    };
    collectibleNameInput.addEventListener('change', commitCollectibleName);
    collectibleNameInput.addEventListener('blur', commitCollectibleName);
    collectibleNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); collectibleNameInput.blur(); } });
  }
  if (collectibleScaleInput) collectibleScaleInput.addEventListener('input', () => {
    if (!collectibleSetupItemId) return;
    updateCollectibleSetup(collectibleSetupItemId, { scale:Number(collectibleScaleInput.value) || 1 });
  });
  bindEditorPress(collectibleSpinBtn, () => {
    if (!collectibleSetupItemId) return;
    updateCollectibleSetup(collectibleSetupItemId, { spin:!collectibleConfig(collectibleSetupItemId).spin });
  });
  bindEditorPress(collectibleResetBtn, () => {
    if (!collectibleSetupItemId) return;
    delete collectibleSetup[collectibleSetupItemId];
    saveCollectibleSetup();
    applyCollectibleConfigToLiveRewards(collectibleSetupItemId);
    renderCollectibleSetup();
    buildAssetPalette();
  });
  bindEditorPress(assetBehaviorResetBtn, () => {
    if (!assetSetupName) return;
    if (!window.confirm(`Reset ${editorAssetInfo.get(assetSetupName)?.label || assetSetupName} behaviour and collision defaults to their built-in values?`)) return;
    resetAssetBehaviours(assetSetupName);
  });
  bindEditorPress(placementChangeBtn, () => {
    if (!placementModeActive()) return;
    buildAssetPalette();
    setAssetPaletteOpen(true);
    updateAssetPaletteState();
  });
  bindEditorPress(placementDoneBtn, exitPlacementMode);
  bindEditorPress(editorResetBtn, () => {
    if (!window.confirm('Reset all SideScroll scene edits on this device?')) return;
    try { localStorage.removeItem(SCENE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_STATE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_START_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_LIBRARY_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_WORKSHOP_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_EXCLUSION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_BEHAVIOUR_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_COLLISION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_CLIMB_PATH_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_MECHANISM_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_SOCKET_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(INVENTORY_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(COLLECTIBLE_SETUP_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(TERRAIN_SECTION_STORAGE_KEY); } catch (_) {}
    window.location.reload();
  });
  bindEditorPress(exportAllBtn, exportAllGameDesign);
  bindEditorPress(puzzleExclusionEditBtn, () => {
    const instance = selectedPuzzleInstance();
    if (!instance || puzzleTestMode) return;
    const ex = currentPuzzleExclusion(instance.marker);
    if (!ex.enabled) { ex.enabled = true; savePuzzleExclusionState(); }
    puzzleExclusionEditMode = !puzzleExclusionEditMode;
    if (puzzleExclusionEditMode) { puzzleRespawnEditMode = false; puzzleRespawnHandle = null; puzzleCartPathEditMode=false; puzzleCartPathHandle=null; }
    addAssetType = null;
    setAssetPaletteOpen(false);
    selectObject(null);
    updatePuzzlePanel();
    hintEl.textContent = puzzleExclusionEditMode
      ? 'Exclusion edit · centre moves · cyan edge handles resize width/depth · procedural forest updates live'
      : 'Exclusion edit finished';
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(puzzleExclusionToggleBtn, () => {
    const instance = selectedPuzzleInstance();
    if (!instance || puzzleTestMode) return;
    const ex=currentPuzzleExclusion(instance.marker);
    ex.enabled=!ex.enabled;
    savePuzzleExclusionState();
    if (!ex.enabled) puzzleExclusionEditMode=false;
    updatePuzzlePanel();
    hintEl.textContent=ex.enabled ? 'Puzzle exclusion enabled' : 'Puzzle exclusion disabled · procedural forest restored';
    hintEl.classList.remove('hidden');
  });
  function setPuzzleEditLayer(layer) {
    if (layer !== 'pieces' && layer !== 'dressing') return;
    const instance = selectedPuzzleInstance();
    if (!instance || puzzleTestMode) return;
    puzzleEnvironmentPlacementMode = layer === 'dressing';
    puzzleExclusionEditMode = false;
    puzzleExclusionHandle = null;
    puzzleRespawnEditMode = false;
    puzzleRespawnHandle = null;
    puzzleCartPathEditMode = false;
    puzzleCartPathHandle = null;
    addAssetType = null;
    selectObject(null);
    setAssetPaletteOpen(false);
    buildAssetPalette();
    updatePlacementModeUi();
    updatePuzzlePanel();
    updatePuzzleObjectList();
    updateEditorButtons();
    hintEl.textContent = puzzleEnvironmentPlacementMode
      ? 'Dressing mode · select/move existing dressing, or tap Place Dressing to add more'
      : 'Puzzle Pieces mode · select/move puzzle props, or tap Place Puzzle Piece to add more';
    hintEl.classList.remove('hidden');
  }
  bindEditorPress(puzzlePiecesLayerBtn, () => setPuzzleEditLayer('pieces'));
  bindEditorPress(puzzleDressingLayerBtn, () => setPuzzleEditLayer('dressing'));
  bindEditorPress(puzzleRespawnEditBtn, () => {
    const instance=selectedPuzzleInstance(); if(!instance||puzzleTestMode)return;
    puzzleRespawnEditMode=!puzzleRespawnEditMode;puzzleExclusionEditMode=false;puzzleExclusionHandle=null;puzzleCartPathEditMode=false;puzzleCartPathHandle=null;addAssetType=null;setAssetPaletteOpen(false);selectObject(null);
    if(puzzleRespawnEditMode){const cfg=currentPuzzleRespawn(instance.marker);if(!cfg.enabled){cfg.enabled=true;savePuzzleRespawnDraft(instance.marker);}hintEl.textContent='Respawn setup · drag SPAWN or the pink volume handles · falling below the pink plane inside the volume respawns here';}
    else hintEl.textContent='Respawn setup finished';
    hintEl.classList.remove('hidden');updatePuzzlePanel();
  });
  bindEditorPress(puzzleRespawnSetSpawnBtn, () => {const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleRespawn(instance.marker);cfg.enabled=true;cfg.spawnX=character.x-instance.marker.x;cfg.spawnZ=pathZ;savePuzzleRespawnDraft(instance.marker);updatePuzzlePanel();hintEl.textContent='Respawn spawn point set to the player position';hintEl.classList.remove('hidden');});
  bindEditorPress(puzzleRespawnToggleBtn, () => {const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleRespawn(instance.marker);cfg.enabled=!cfg.enabled;savePuzzleRespawnDraft(instance.marker);updatePuzzlePanel();});
  const nudgeRespawnTrigger=delta=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleRespawn(instance.marker);cfg.triggerOffsetY=Rig.clamp(cfg.triggerOffsetY+delta,-4.5,0.5);cfg.enabled=true;savePuzzleRespawnDraft(instance.marker);updatePuzzlePanel();};
  bindEditorPress(puzzleRespawnLowerBtn,()=>nudgeRespawnTrigger(-0.15));
  bindEditorPress(puzzleRespawnRaiseBtn,()=>nudgeRespawnTrigger(0.15));
  bindEditorPress(puzzleCartPathEditBtn,()=>{
    const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode||!cartObjectForInstance(instance))return;
    puzzleCartPathEditMode=!puzzleCartPathEditMode;
    puzzleRespawnEditMode=false;puzzleRespawnHandle=null;puzzleExclusionEditMode=false;puzzleExclusionHandle=null;addAssetType=null;setAssetPaletteOpen(false);selectObject(null);
    if(puzzleCartPathEditMode){
      const cfg=currentPuzzleCartPath(instance.marker);if(!cfg.enabled){cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);}
      puzzleCartPathPreviewT=1;puzzleCartPathPreviewPlaying=false;
      hintEl.textContent='Cart path · drag handles to shape it · Replay Ghost or scrub the slider to preview the exact fall';
    } else {puzzleCartPathPreviewPlaying=false;hintEl.textContent='Cart path setup finished';}
    hintEl.classList.remove('hidden');updatePuzzlePanel();
  });
  bindEditorPress(puzzleCartPathToggleBtn,()=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);cfg.enabled=!cfg.enabled;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();});
  bindEditorPress(puzzleCartPathStartCartBtn,()=>{const instance=selectedPuzzleInstance();const cart=cartObjectForInstance(instance);if(!instance||!cart||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);const startY=playSurfaceYAt(cart.x)-assetGroundLineDefault('handcart')*cart.sy;const nextStart={x:cart.x-instance.marker.x,y:startY,z:pathZ};const dx=nextStart.x-cfg.start.x;const dy=nextStart.y-cfg.start.y;for(const key of ['start','c1','c2','land']){cfg[key]={x:cfg[key].x+dx,y:cfg[key].y+dy,z:cfg[key].z};}cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();hintEl.textContent='Whole cart path moved so START sits on the cart';hintEl.classList.remove('hidden');});
  const nudgeCartPathDuration=delta=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);cfg.duration=Rig.clamp(Math.round((cfg.duration+delta)*100)/100,0.75,8);cfg.timingVersion=3;cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();};
  bindEditorPress(puzzleCartPathDurationDownBtn,()=>nudgeCartPathDuration(-0.25));
  bindEditorPress(puzzleCartPathDurationUpBtn,()=>nudgeCartPathDuration(0.25));
  bindEditorPress(puzzleCartPathMatchPushBtn,()=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);const world=puzzleCartPathWorld(instance.marker);const length=approximateCubicBezierLength(world.start,world.c1,world.c2,world.land);cfg.duration=Rig.clamp(Math.round((length/Math.max(0.1,PUSH_SPEED*1.18))*100)/100,0.75,8);cfg.timingVersion=3;cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();hintEl.textContent=`Cart path time matched to the push speed · ${cfg.duration.toFixed(2)} s`;hintEl.classList.remove('hidden');});
  const nudgeCartPathSpeed=(key,delta)=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);cfg[key]=Rig.clamp(Math.round(((Number(cfg[key])||1)+delta)*100)/100,0.20,3.00);cfg.speedProfileVersion=1;cfg.timingVersion=3;cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();};
  bindEditorPress(puzzleCartPathSpeedStartDownBtn,()=>nudgeCartPathSpeed('speedStart',-0.10));
  bindEditorPress(puzzleCartPathSpeedStartUpBtn,()=>nudgeCartPathSpeed('speedStart',0.10));
  bindEditorPress(puzzleCartPathSpeedMidDownBtn,()=>nudgeCartPathSpeed('speedMid',-0.10));
  bindEditorPress(puzzleCartPathSpeedMidUpBtn,()=>nudgeCartPathSpeed('speedMid',0.10));
  bindEditorPress(puzzleCartPathSpeedEndDownBtn,()=>nudgeCartPathSpeed('speedEnd',-0.10));
  bindEditorPress(puzzleCartPathSpeedEndUpBtn,()=>nudgeCartPathSpeed('speedEnd',0.10));
  const nudgeCartPathAngle=delta=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);cfg.finalRotationDeg=Rig.clamp(cfg.finalRotationDeg+delta,-85,85);cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();};
  bindEditorPress(puzzleCartPathAngleDownBtn,()=>nudgeCartPathAngle(-1));
  bindEditorPress(puzzleCartPathAngleZeroBtn,()=>{const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode)return;const cfg=currentPuzzleCartPath(instance.marker);cfg.finalRotationDeg=0;cfg.enabled=true;savePuzzleCartPathDraft(instance.marker);updatePuzzlePanel();});
  bindEditorPress(puzzleCartPathAngleUpBtn,()=>nudgeCartPathAngle(1));
  bindEditorPress(puzzleCartPathPreviewBtn,()=>{
    const instance=selectedPuzzleInstance();if(!instance||puzzleTestMode||!puzzleCartPathEditMode)return;
    if(puzzleCartPathPreviewPlaying){puzzleCartPathPreviewPlaying=false;}
    else {if(puzzleCartPathPreviewT>=0.999)puzzleCartPathPreviewT=0;puzzleCartPathPreviewPlaying=true;}
    updatePuzzlePanel();
  });
  if(puzzleCartPathScrub){
    const scrubCartPathPreview=()=>{
      if(!puzzleCartPathEditMode||puzzleTestMode)return;
      puzzleCartPathPreviewPlaying=false;
      puzzleCartPathPreviewT=Rig.clamp((Number(puzzleCartPathScrub.value)||0)/1000,0,1);
      updatePuzzlePanel();
    };
    puzzleCartPathScrub.addEventListener('input',scrubCartPathPreview,{passive:true});
    puzzleCartPathScrub.addEventListener('change',scrubCartPathPreview,{passive:true});
  }

  bindEditorPress(puzzleSetStartBtn, savePuzzleTemplateFromCurrent);
  bindEditorPress(puzzleSaveUniqueBtn, savePuzzleUniqueFromCurrent);
  bindEditorPress(puzzleTestBtn, beginPuzzleTest);
  bindEditorPress(puzzleResetBtn, resetCurrentPuzzle);
  bindEditorPress(puzzleBackSetupBtn, backToPuzzleSetup);
  bindEditorPress(editorDuplicateBtn, duplicateSelected);
  bindEditorPress(editorFlipBtn, flipSelectedObject);
  bindEditorPress(editorScaleDownBtn, () => scaleSelected(0.90));
  bindEditorPress(editorScaleUpBtn, () => scaleSelected(1.10));
  bindEditorPress(editorGroundLineBtn, () => setGroundLineEditorOpen(!groundLineEditMode));
  bindEditorPress(groundLineResetBtn, resetSelectedGroundLine);
  bindEditorPress(groundLineCloseBtn, () => setGroundLineEditorOpen(false));
  groundLineInput?.addEventListener('input', () => setSelectedGroundLine(Number(groundLineInput.value)));
  bindEditorPress(editorTransformBtn, () => setTransformEditorOpen(!transformEditMode));
  bindEditorPress(transformCloseBtn, () => setTransformEditorOpen(false));
  bindEditorPress(transformModeBtn, () => {
    if(selectedLockedWorldGroupForEditor() && (!selectedObject || selectedObject.deleted))return;
    setSelectedFreePlacement(!objectUsesFreePlacement(selectedObject));
  });
  bindEditorPress(transformXMinusBtn, () => nudgeSelectedTransformAxis('x', -1));
  bindEditorPress(transformXPlusBtn, () => nudgeSelectedTransformAxis('x', 1));
  bindEditorPress(transformYMinusBtn, () => nudgeSelectedTransformAxis('y', -1));
  bindEditorPress(transformYPlusBtn, () => nudgeSelectedTransformAxis('y', 1));
  bindEditorPress(transformZMinusBtn, () => nudgeSelectedTransformAxis('z', -1));
  bindEditorPress(transformZPlusBtn, () => nudgeSelectedTransformAxis('z', 1));
  bindEditorPress(transformFloorWalkBtn, snapSelectedFloorToWalk);
  bindEditorPress(transformSupportWalkBtn, snapSelectedSupportTopToWalk);
  bindEditorPress(transformAlignSupportsBtn, alignFixedSupportsToSelected);
  const bindTransformNumberInput = (input, axis) => {
    if (!input) return;
    const commit = () => moveSelectedTransformAxis(axis, Number(input.value));
    input.addEventListener('change', commit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  };
  bindTransformNumberInput(transformXInput, 'x');
  bindTransformNumberInput(transformYInput, 'y');
  bindTransformNumberInput(transformZInput, 'z');
  bindEditorPress(editorGameLayerBtn, toggleSelectedGameplayLayer);
  bindEditorPress(editorCollisionBtn, toggleSelectedCollision);
  bindEditorPress(editorCollisionShapeBtn, cycleSelectedCollisionShape);
  bindEditorPress(editorCollisionAddShapeBtn, addCollisionShape);
  bindEditorPress(editorCollisionRemoveShapeBtn, removeCollisionShape);
  bindEditorPress(editorCollisionRemoveBtn, removeSelectedCollision);
  bindEditorPress(editorCollisionSaveAssetBtn, saveSelectedCollisionAsAssetDefault);
  bindEditorPress(editorCollisionUseAssetBtn, useAssetCollisionForSelected);
  bindEditorPress(quickNavBtn, () => setQuickNavOpen(quickNavPanel?.hidden));
  bindEditorPress(quickNavCloseBtn, () => setQuickNavOpen(false));
  bindEditorPress(stageMenuBtn, () => setStageMenuOpen(stageMenuPanel?.hidden !== false));
  bindEditorPress(stageMenuCloseBtn, () => setStageMenuOpen(false));
  bindEditorPress(sectionBtn, () => setTerrainSectionPanelOpen(sectionPanel?.hidden !== false));
  bindEditorPress(sectionCloseBtn, () => setTerrainSectionPanelOpen(false));
  bindEditorPress(sectionGuidesBtn, () => {
    terrainSectionGuidesVisible = !terrainSectionGuidesVisible;
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  });
  sectionGuidesPersistInput?.addEventListener('change', () => {
    terrainSectionGuidesPersist = !!sectionGuidesPersistInput.checked;
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  });
  bindEditorPress(sectionPrevBtn, () => selectTerrainSection(terrainSelectedSectionIndex - 1));
  bindEditorPress(sectionNextBtn, () => selectTerrainSection(terrainSelectedSectionIndex + 1));
  bindEditorPress(sectionPlayerBtn, () => selectTerrainSection(terrainSectionIndexAt(character?.x ?? camera.x)));
  sectionHeightLinkInput?.addEventListener('change', () => {
    terrainHeightLinkSubsequent = !!sectionHeightLinkInput.checked;
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  });
  for (const layerId of TERRAIN_DEPTH_LAYER_IDS) {
    const control = sectionLayerControls[layerId];
    const applyLayerSliderValue = (save = false) => {
      if (!control?.value) return;
      const anchors = terrainHeightBoundObjectAnchors();
      const info = terrainLayerModeInfo(terrainSelectedSectionIndex, layerId);
      if (info.mode === 'explicit') setTerrainLayerExplicitHeight(terrainSelectedSectionIndex, layerId, Number(control.value.value), { save:false });
      else setTerrainLayerOffset(terrainSelectedSectionIndex, layerId, Number(control.value.value), { save:false });
      restoreTerrainHeightBoundObjectAnchors(anchors);
      if (save) saveTerrainSectionState();
      updateTerrainSectionUi(true);
    };
    control?.mode?.addEventListener('change', () => {
      const anchors = terrainHeightBoundObjectAnchors();
      setTerrainLayerMode(terrainSelectedSectionIndex, layerId, control.mode.value, { save:false });
      restoreTerrainHeightBoundObjectAnchors(anchors);
      saveTerrainSectionState();
      updateTerrainSectionUi(true);
    });
    control?.value?.addEventListener('input', () => applyLayerSliderValue(false));
    control?.value?.addEventListener('change', () => {
      applyLayerSliderValue(false);
      saveTerrainSectionState();
      updateTerrainSectionUi(true);
    });
  }
  const commitSelectedSectionHeight = value => {
    const changed = setTerrainSectionPathHeight(terrainSelectedSectionIndex, Number(value), { linkSubsequent:terrainHeightLinkSubsequent });
    if (changed) {
      const h = terrainSectionPathHeight(terrainSelectedSectionIndex);
      hintEl.textContent = `Section ${terrainSelectedSectionIndex} path height ${h >= 0 ? '+' : ''}${h.toFixed(1)} m${terrainHeightLinkSubsequent ? ' · later sections shifted' : ''}`;
      hintEl.classList.remove('hidden');
    }
  };
  sectionHeightInput?.addEventListener('input', () => {
    if (sectionHeightValue) { const h=Number(sectionHeightInput.value)||0; sectionHeightValue.textContent=`${h>=0?'+':''}${h.toFixed(1)} m`; }
  });
  sectionHeightInput?.addEventListener('change', () => commitSelectedSectionHeight(sectionHeightInput.value));
  sectionHeightNumber?.addEventListener('change', () => commitSelectedSectionHeight(sectionHeightNumber.value));
  bindEditorPress(sectionHeightDownBtn, () => commitSelectedSectionHeight(terrainSectionPathHeight(terrainSelectedSectionIndex) - 0.25));
  bindEditorPress(sectionHeightUpBtn, () => commitSelectedSectionHeight(terrainSectionPathHeight(terrainSelectedSectionIndex) + 0.25));
  sectionTypeSelect?.addEventListener('change', () => {
    setTerrainSectionType(terrainSelectedSectionIndex, sectionTypeSelect.value);
    hintEl.textContent = `Section ${terrainSelectedSectionIndex} → ${terrainSectionTypeLabel(terrainSelectedSectionIndex)}`;
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(sectionCollisionBtn, () => {
    const next = !terrainSectionCollisionEnabled(terrainSelectedSectionIndex);
    setTerrainSectionCollisionEnabled(terrainSelectedSectionIndex, next);
    hintEl.textContent = next
      ? `Section ${terrainSelectedSectionIndex} terrain collision enabled`
      : `Section ${terrainSelectedSectionIndex} terrain collision disabled · support objects now define the walk surface`;
    hintEl.classList.remove('hidden');
  });
  sectionRiverWidthInput?.addEventListener('input', () => {
    if (sectionRiverWidthValue) sectionRiverWidthValue.textContent = `${Number(sectionRiverWidthInput.value).toFixed(1)} m`;
  });
  sectionRiverWidthInput?.addEventListener('change', () => {
    setTerrainSectionRiverWidth(terrainSelectedSectionIndex, Number(sectionRiverWidthInput.value));
    hintEl.textContent = `River width · ${riverSectionSettings(terrainSelectedSectionIndex).width.toFixed(1)} m`;
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(sectionVisibleBtn, () => {
    const i = terrainSelectedSectionIndex;
    if (terrainHiddenSections.has(i)) terrainHiddenSections.delete(i); else terrainHiddenSections.add(i);
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  });
  bindEditorPress(sectionResetBtn, () => {
    terrainHiddenSections.clear();
    saveTerrainSectionState();
    updateTerrainSectionUi(true);
  });
  bindEditorPress(sectionBankDressBtn, () => {
    if (terrainSectionType(terrainSelectedSectionIndex) !== 'river') return;
    const count = autoDressRiverBanks(terrainSelectedSectionIndex);
    updateEditorButtons();
    updateTerrainSectionUi(true);
    hintEl.textContent = count > 0
      ? `River banks dressed · ${count} grasses/rocks placed`
      : 'River banks already clear enough here · no auto dressing placed';
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(sectionBankClearBtn, () => {
    if (terrainSectionType(terrainSelectedSectionIndex) !== 'river') return;
    const count = clearAutoRiverBankDressing(terrainSelectedSectionIndex);
    updateEditorButtons();
    updateTerrainSectionUi(true);
    hintEl.textContent = count > 0
      ? `River-bank auto dressing cleared · ${count} objects removed`
      : 'No river-bank auto dressing to clear in this section';
    hintEl.classList.remove('hidden');
  });
  updateTerrainSectionUi(true);
  bindEditorPress(cameraEditorBtn, () => {
    cameraEditMode = !cameraEditMode;
    if (cameraEditMode) {
      setStageMenuOpen(false);
      setTerrainSectionPanelOpen(false);
      setQuickNavOpen(false);
      setFogPanelOpen(false);
      setPostPanelOpen(false);
      setSoundPanelOpen(false);
      setInventoryOpen(false);
      hintEl.textContent = 'CAMERA · smooth height follow · height · depth · tilt';
      hintEl.classList.remove('hidden');
    }
    updateCameraEditorUi();
    updateEditorButtons();
  });
  const bindCameraNudge = (el, dy, dz) => {
    if (!el) return;
    const apply = e => { e?.preventDefault?.(); if (cameraEditMode) nudgeCamera(dy, dz); };
    el.addEventListener('pointerdown', apply);
  };
  bindCameraNudge(cameraUpBtn, CAMERA_Y_STEP, 0);
  bindCameraNudge(cameraDownBtn, -CAMERA_Y_STEP, 0);
  bindCameraNudge(cameraBackBtn, 0, CAMERA_Z_STEP);
  bindCameraNudge(cameraForwardBtn, 0, -CAMERA_Z_STEP);
  if (cameraTiltBackBtn) cameraTiltBackBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (cameraEditMode) nudgeCameraTilt(CAMERA_TILT_STEP); });
  if (cameraTiltForwardBtn) cameraTiltForwardBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (cameraEditMode) nudgeCameraTilt(-CAMERA_TILT_STEP); });
  cameraFollowInput?.addEventListener('input', () => {
    cameraFollowEnabled = !!cameraFollowInput.checked;
    saveCameraFollow();
    syncCameraFollowUi();
  });
  cameraFollowAmountInput?.addEventListener('input', () => {
    cameraFollowAmount = Rig.clamp(Number(cameraFollowAmountInput.value) || 0, 0, 1);
    saveCameraFollow();
    syncCameraFollowUi();
  });
  syncCameraFollowUi();
  bindEditorPress(editorSocketBtn, startSocketPlacement);
  bindEditorPress(editorSocketClearBtn, clearSelectedPieceSocket);
  bindEditorPress(editorDeleteBtn, deleteSelected);
  const puzzleObjectsSummary = puzzleObjectsEl?.querySelector('summary');
  bindEditorPress(puzzleObjectsSummary, () => { if (puzzleObjectsEl) puzzleObjectsEl.open = !puzzleObjectsEl.open; });

  canvas.addEventListener('pointerdown', e => {
    if (editMode && pointInsideEditorUi(e.clientX, e.clientY)) return;
    canvas.setPointerCapture?.(e.pointerId);
    hideHint();
    if (editMode) {
      editorPointer = e.pointerId;
      const localRect = canvas.getBoundingClientRect();
      const startGround = addAssetType
        ? placementPointFromClient(addAssetType, e.clientX, e.clientY)
        : groundPointFromClient(e.clientX, e.clientY);
      editorGesture = {
        startClientX:e.clientX, startClientY:e.clientY,
        startLocalX:e.clientX-localRect.left, startLocalY:e.clientY-localRect.top,
        startCameraX:camera.x, startGround,
        moved:false, kind:'pan', object:null,
        objectStartX:selectedObject?.x ?? 0, objectStartZ:selectedObject?.z ?? 0,
        objectStartFloorOffset:selectedObject ? objectFloorOffsetFromTerrain(selectedObject) : 0,
        objectStartFloorWorldY:selectedObject ? objectFloorWorldY(selectedObject) : 0,
        objectStartScreen:selectedObject
          ? projectWorldPoint(selectedObject.x,objectFloorWorldY(selectedObject)+.08,selectedObject.z)
          : null
      };

      const groupExclusionHandle = worldGroupExclusionHandleAt(e.clientX,e.clientY);
      if(groupExclusionHandle){
        const group=worldGroupById(selectedWorldGroupId),start=group?currentWorldGroupExclusion(group):null;
        if(group&&start){editorGesture.kind='world-group-exclusion';editorGesture.groupExclusionHandle=groupExclusionHandle.kind;editorGesture.groupExclusionStart={...start};editorGesture.groupExclusionGroup=group;worldGroupExclusionHandle=groupExclusionHandle.kind;hintEl.textContent=groupExclusionHandle.kind==='center'?'Drag the centre dot to move the group exclusion':'Drag the green handle to resize the group exclusion';hintEl.classList.remove('hidden');return;}
      }

      if (worldGroupTemplatePlaceMode && editorScope === 'environment' && worldGroupTemplateById(selectedWorldTemplateId)) {
        editorGesture.kind = 'world-group-template-place';
        return;
      }

      if (worldGroupMoveMode && editorScope === 'environment' && worldGroupById(selectedWorldGroupId)) {
        editorGesture.kind = 'world-group-move';
        return;
      }

      if (socketPlacementPiece) {
        editorGesture.kind = 'socket-place-pan';
        editorGesture.socketPiece = socketPlacementPiece;
        return;
      }

      if (addAssetType) {
        // Placement is paint-only: existing scene art never captures the tap.
        // A tap lays down the active asset at the ground point underneath it;
        // a drag pans the view. Finish Placement before selecting/moving props.
        editorGesture.placement = true;
        editorGesture.kind = 'placement-pan';
        return;
      }

      const exclusionHandle = puzzleExclusionHandleAt(e.clientX, e.clientY);
      if (exclusionHandle) {
        const instance=selectedPuzzleInstance();
        editorGesture.kind='puzzle-exclusion';
        editorGesture.exclusionHandle=exclusionHandle.kind;
        editorGesture.exclusionStart={...currentPuzzleExclusion(instance.marker)};
        editorGesture.exclusionMarker=instance.marker;
        puzzleExclusionHandle=exclusionHandle.kind;
        hintEl.textContent=exclusionHandle.kind==='center' ? 'Drag the centre dot to move the exclusion plane' : 'Drag the cyan handle to resize the exclusion plane';
        hintEl.classList.remove('hidden');
        return;
      }

      const respawnHandle = puzzleRespawnHandleAt(e.clientX, e.clientY);
      if (respawnHandle) {
        const instance=selectedPuzzleInstance();editorGesture.kind='puzzle-respawn';editorGesture.respawnHandle=respawnHandle.kind;editorGesture.respawnStart={...currentPuzzleRespawn(instance.marker)};editorGesture.respawnMarker=instance.marker;puzzleRespawnHandle=respawnHandle.kind;
        hintEl.textContent=respawnHandle.kind==='spawn'?'Drag the green SPAWN point':(respawnHandle.kind==='zone-center'?'Drag the pink centre to move the respawn volume':'Drag the pink edge handle to resize the respawn volume');hintEl.classList.remove('hidden');return;
      }

      const cartPathHandleHit = puzzleCartPathHandleAt(e.clientX, e.clientY);
      if (cartPathHandleHit) {
        const instance=selectedPuzzleInstance();
        editorGesture.kind='puzzle-cart-path';
        editorGesture.cartPathHandle=cartPathHandleHit.kind;
        editorGesture.cartPathMarker=instance.marker;
        editorGesture.cartPathStart=deepCopy(currentPuzzleCartPath(instance.marker));
        editorGesture.cartPathPointerStart=pathPlanePointFromClient(e.clientX,e.clientY,cartPathHandleHit.world?.z ?? pathZ);
        puzzleCartPathHandle=cartPathHandleHit.kind;
        hintEl.textContent=cartPathHandleHit.kind==='move'
          ? 'Drag MOVE PATH or the spline itself to reposition the whole cart route'
          : `Drag ${cartPathHandleHit.kind==='c1'?'CURVE 1':cartPathHandleHit.kind==='c2'?'CURVE 2':cartPathHandleHit.kind.toUpperCase()} to shape the cart route`;
        hintEl.classList.remove('hidden');
        return;
      }

      if (puzzleRespawnEditMode) {
        editorGesture.kind = 'respawn-pan';
        return;
      }
      if (puzzleCartPathEditMode) {
        editorGesture.kind = 'cart-path-pan';
        return;
      }

      const markerHandle = puzzleMarkerHandleAt(e.clientX, e.clientY);
      if (markerHandle) {
        const marker = selectedPuzzleMarker();
        editorGesture.kind = 'puzzle-marker';
        editorGesture.marker = marker;
        editorGesture.markerStartX = marker?.x ?? 0;
        hintEl.textContent = 'Drag the centre dot to move this puzzle marker';
        hintEl.classList.remove('hidden');
        return;
      }

      const boundHandle = puzzleBoundHandleAt(e.clientX, e.clientY);
      if (boundHandle) {
        editorGesture.kind = 'puzzle-bound';
        puzzleBoundSide = boundHandle.side;
        hintEl.textContent = 'Drag to resize the selected puzzle bounds';
        hintEl.classList.remove('hidden');
        return;
      }

      if (selectedObject && collisionEditMode && selectedObject.collision) {
        const rect = canvas.getBoundingClientRect();
        const handles = collisionHandlePositions(selectedObject);
        const handle = handles.find(item => Math.hypot(item.x - (e.clientX-rect.left), item.y - (e.clientY-rect.top)) <= 16);
        if (handle) {
          editorGesture.kind = 'collision-handle';
          collisionHandleIndex = handle.index;
          hintEl.textContent = 'Drag the orange handle to reshape the collision';
          hintEl.classList.remove('hidden');
          return;
        }
      }

      // A locked World Group can ONLY be moved from its yellow origin dot.
      // Group members/bounds remain useful selection targets, but dragging them
      // pans the scene rather than moving the composition accidentally.
      if(editorScope==='environment'&&!worldGroupEditMode){
        const selectedGroup=worldGroupById(selectedWorldGroupId);
        if(selectedGroup&&worldGroupOriginHandleHitAt(selectedGroup,e.clientX,e.clientY)){
          selectObject(null);
          editorGesture.kind='world-group-direct';
          editorGesture.group=selectedGroup;
          editorGesture.groupMoveState=captureWorldGroupMoveState(selectedGroup);
          editorGesture.groupStartX=Number(selectedGroup.x)||0;
          editorGesture.groupStartZ=Number(selectedGroup.z)||pathZ;
          editorGesture.groupStartScreen=worldGroupOriginScreenPoint(selectedGroup);
          hintEl.textContent=`${selectedGroup.label} · drag the yellow dot · horizontal = along path · vertical = scene depth`;
          hintEl.classList.remove('hidden');
          return;
        }
      }

      // Crucial editor rule: an object only moves when the drag STARTS inside
      // the object that was already selected. Everything else begins as a pan.
      if (selectedObject && editorObjectIsEditable(selectedObject) && pointInsideScreenBounds(e.clientX,e.clientY,objectScreenBounds(selectedObject),3)) {
        editorGesture.kind = 'selected-object';
        editorGesture.object = selectedObject;
        editorGesture.stackIgnore = new Set();
        if (isGameplayCrate(selectedObject)) {
          const anchor = stackBottomFor(selectedObject, selectedObject.x);
          const column = stackColumnFor(anchor, selectedObject.x);
          const index = column?.members?.indexOf(selectedObject) ?? -1;
          if (index >= 0) {
            for (const member of column.members.slice(index + 1)) editorGesture.stackIgnore.add(member);
          }
        }
      }
      return;
    }

    // Scene swiping is an editor-only navigation gesture. In normal player
    // mode movement must come exclusively from the slider controls.
    if (PLAYER_MODE) return;
    activePointer = e.pointerId;
    dragStartX = e.clientX;
    dragStartCameraX = camera.x;
  });

  canvas.addEventListener('pointermove', e => {
    if (editMode) {
      if (e.pointerId !== editorPointer || !editorGesture) return;
      const dx = e.clientX - editorGesture.startClientX;
      const dy = e.clientY - editorGesture.startClientY;
      const travel = Math.hypot(dx,dy);
      if (travel < 7 && !editorGesture.moved) return;
      editorGesture.moved = true;

      if(editorGesture.kind==='world-group-direct'&&editorGesture.group){
        const startScreen=editorGesture.groupStartScreen;
        const moveState=editorGesture.groupMoveState;
        if(startScreen&&moveState){
          const solved=solveEditorScreenDragXZ({
            startX:editorGesture.groupStartX,
            startZ:editorGesture.groupStartZ,
            startScreenX:startScreen.x,startScreenY:startScreen.y,
            targetScreenX:startScreen.x+dx,targetScreenY:startScreen.y+dy,
            yAt:(x,z)=>terrainGroundYAt(x,z)+.12
          });
          applyWorldGroupMoveState(moveState,solved.x,solved.z,{silent:true,persist:false});
        }
        worldGroupListSignature='';
      } else if (editorGesture.kind === 'selected-object' && editorGesture.object) {
        const obj = editorGesture.object;
        if (obj.socketedTo) obj.socketedTo = null;
        const startScreen=editorGesture.objectStartScreen ||
          projectWorldPoint(editorGesture.objectStartX,editorGesture.objectStartFloorWorldY+.08,editorGesture.objectStartZ);
        const locked=obj.category==='gameplay'&&obj.gameplayLayerLocked;
        const free=objectUsesFreePlacement(obj);
        const yAt=(x,z)=>free
          ? editorGesture.objectStartFloorWorldY+.08
          : terrainAnchorBaseY(x,z,obj.category,obj.gameplayLayerLocked,obj.assetName)+editorGesture.objectStartFloorOffset+.08;
        const solved=startScreen
          ? solveEditorScreenDragXZ({
              startX:editorGesture.objectStartX,
              startZ:editorGesture.objectStartZ,
              startScreenX:startScreen.x,startScreenY:startScreen.y,
              targetScreenX:startScreen.x+dx,targetScreenY:startScreen.y+dy,
              yAt,lockZ:locked
            })
          : {x:editorGesture.objectStartX+dx*.0065,z:editorGesture.objectStartZ};
        const desiredX=solved.x;
        const desiredZ=locked?pathZ:solved.z;

        if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, desiredX, desiredZ, editorGesture.stackIgnore);
        else {
          obj.x = desiredX; obj.z = desiredZ;
          if (free) {
            // Free placement retains its authored world floor height while X/Z
            // tracks the finger in screen space.
            setObjectFloorWorldY(obj, editorGesture.objectStartFloorWorldY);
          } else {
            setObjectFloorOffset(obj, editorGesture.objectStartFloorOffset);
          }
        }
        moveObjectToCorrectCollection(obj);sortSceneCollections();selectionCycleInfo=null;
      } else if (editorGesture.kind === 'collision-handle' && selectedObject?.collision && collisionHandleIndex >= 0) {
        const bounds=collisionRectScreenBounds(selectedObject); if(!bounds) return;
        const rect=canvas.getBoundingClientRect(); const lx=e.clientX-rect.left, ly=e.clientY-rect.top;
        const nx=Rig.clamp((((lx-bounds.left)/Math.max(1,bounds.right-bounds.left))*2)-1,-4.0,4.0);
        const ny=Rig.clamp((bounds.bottom-ly)/Math.max(1,bounds.bottom-bounds.top),-0.20,3.0);
        const points=selectedCollisionShapePoints(selectedObject.collision).map(point=>({...point}));
        if(points[collisionHandleIndex]){selectedObject.collisionOverride=true;points[collisionHandleIndex].x=nx;points[collisionHandleIndex].y=ny;writeSelectedCollisionShape(selectedObject.collision,points);}
      } else if (editorGesture.kind === 'world-group-exclusion' && editorGesture.groupExclusionGroup) {
        const point=groundPointFromClient(e.clientX,e.clientY);
        if(point){
          const group=editorGesture.groupExclusionGroup,start=editorGesture.groupExclusionStart,ex=ensureWorldGroupExclusion(group),gx=Number(group.x)||0,gz=Number(group.z)||pathZ;
          const localX=point.x-gx,localZ=point.z-gz;
          const left0=start.centerX-start.width*.5,right0=start.centerX+start.width*.5,far0=start.centerZ-start.depth*.5,near0=start.centerZ+start.depth*.5;
          if(editorGesture.groupExclusionHandle==='center'){ex.centerX=localX;ex.centerZ=localZ;}
          else if(editorGesture.groupExclusionHandle==='left'){const left=Math.min(localX,right0-1);ex.centerX=(left+right0)*.5;ex.width=Math.max(1,right0-left);}
          else if(editorGesture.groupExclusionHandle==='right'){const right=Math.max(localX,left0+1);ex.centerX=(left0+right)*.5;ex.width=Math.max(1,right-left0);}
          else if(editorGesture.groupExclusionHandle==='far'){const far=Math.min(localZ,near0-1);ex.centerZ=(far+near0)*.5;ex.depth=Math.max(1,near0-far);}
          else if(editorGesture.groupExclusionHandle==='near'){const near=Math.max(localZ,far0+1);ex.centerZ=(far0+near)*.5;ex.depth=Math.max(1,near-far0);}
        }
      } else if (editorGesture.kind === 'puzzle-exclusion' && editorGesture.exclusionMarker) {
        const point=groundPointFromClient(e.clientX,e.clientY);
        if(point){
          const marker=editorGesture.exclusionMarker;
          const start=editorGesture.exclusionStart;
          const ex=currentPuzzleExclusion(marker);
          const localX=point.x-marker.x;
          const z=point.z;
          const left0=start.centerX-start.width*0.5, right0=start.centerX+start.width*0.5;
          const far0=start.centerZ-start.depth*0.5, near0=start.centerZ+start.depth*0.5;
          if(editorGesture.exclusionHandle==='center'){ex.centerX=localX;ex.centerZ=z;}
          else if(editorGesture.exclusionHandle==='left'){const left=Math.min(localX,right0-1);ex.centerX=(left+right0)*0.5;ex.width=Math.max(1,right0-left);}
          else if(editorGesture.exclusionHandle==='right'){const right=Math.max(localX,left0+1);ex.centerX=(left0+right)*0.5;ex.width=Math.max(1,right-left0);}
          else if(editorGesture.exclusionHandle==='far'){const far=Math.min(z,near0-1);ex.centerZ=(far+near0)*0.5;ex.depth=Math.max(1,near0-far);}
          else if(editorGesture.exclusionHandle==='near'){const near=Math.max(z,far0+1);ex.centerZ=(far0+near)*0.5;ex.depth=Math.max(1,near-far0);}
        }
      } else if (editorGesture.kind === 'puzzle-respawn' && editorGesture.respawnMarker) {
        const point=groundPointFromClient(e.clientX,e.clientY);if(point){const marker=editorGesture.respawnMarker;const start=editorGesture.respawnStart;const cfg=currentPuzzleRespawn(marker);const localX=point.x-marker.x;const z=point.z;const left0=start.zoneCenterX-start.width*.5,right0=start.zoneCenterX+start.width*.5,far0=start.zoneCenterZ-start.depth*.5,near0=start.zoneCenterZ+start.depth*.5;
          if(editorGesture.respawnHandle==='spawn'){cfg.spawnX=localX;cfg.spawnZ=z;}
          else if(editorGesture.respawnHandle==='zone-center'){cfg.zoneCenterX=localX;cfg.zoneCenterZ=z;}
          else if(editorGesture.respawnHandle==='left'){const left=Math.min(localX,right0-.8);cfg.zoneCenterX=(left+right0)*.5;cfg.width=Math.max(.8,right0-left);}
          else if(editorGesture.respawnHandle==='right'){const right=Math.max(localX,left0+.8);cfg.zoneCenterX=(left0+right)*.5;cfg.width=Math.max(.8,right-left0);}
          else if(editorGesture.respawnHandle==='far'){const far=Math.min(z,near0-.8);cfg.zoneCenterZ=(far+near0)*.5;cfg.depth=Math.max(.8,near0-far);}
          else if(editorGesture.respawnHandle==='near'){const near=Math.max(z,far0+.8);cfg.zoneCenterZ=(far0+near)*.5;cfg.depth=Math.max(.8,near-far0);}cfg.enabled=true;}
      } else if (editorGesture.kind === 'puzzle-cart-path' && editorGesture.cartPathMarker) {
        const marker=editorGesture.cartPathMarker;
        const cfg=currentPuzzleCartPath(marker);
        const startCfg=editorGesture.cartPathStart || deepCopy(cfg);
        const handle=editorGesture.cartPathHandle;
        const z=handle==='move' ? (startCfg.start?.z ?? pathZ) : (startCfg[handle]?.z ?? pathZ);
        const point=pathPlanePointFromClient(e.clientX,e.clientY,z);
        const startPoint=editorGesture.cartPathPointerStart;
        if(point&&startPoint){
          const dxWorld=point.x-startPoint.x;
          const dyWorld=point.y-startPoint.y;
          if(handle==='move'){
            for(const key of ['start','c1','c2','land']){
              const p=startCfg[key];
              cfg[key]={x:p.x+dxWorld,y:p.y+dyWorld,z:p.z};
            }
          }else{
            const p=startCfg[handle];
            cfg[handle]={x:p.x+dxWorld,y:p.y+dyWorld,z:p.z};
          }
          cfg.enabled=true;
        }
      } else if (editorGesture.kind === 'puzzle-marker' && editorGesture.marker) {
        const nextX = editorGesture.markerStartX + dx * 0.0065;
        movePuzzleMarkerTo(editorGesture.marker, nextX);
        if (puzzleMarkerXInput) puzzleMarkerXInput.value = Number(nextX).toFixed(1);
        renderScenePuzzleList({ force:true });
      } else if (editorGesture.kind === 'puzzle-bound') {
        const instance=selectedPuzzleInstance(); const point=groundPointFromClient(e.clientX,e.clientY);
        if(instance&&point){
          const rel=currentPuzzleBoundsRelative(instance.marker);const local=point.x-instance.marker.x;
          if(puzzleBoundSide==='left') rel.minX=Math.min(local,rel.maxX-1.0);
          else rel.maxX=Math.max(local,rel.minX+1.0);
          puzzleStartDirty.add(instance.id);updatePuzzlePanel();
        }
      } else {
        camera.x = editorGesture.startCameraX - dx*0.0065;
      }
      return;
    }
    if (PLAYER_MODE) return;
    if (e.pointerId !== activePointer) return;
    const dx = e.clientX - dragStartX;
    camera.x = dragStartCameraX - dx * 0.0075;
  });

  const endDrag = e => {
    if (editMode) {
      if (e.pointerId !== editorPointer) return;
      const gesture=editorGesture;
      if (gesture) {
        if (gesture.moved) {
          if(gesture.kind==='world-group-direct'&&gesture.group){
            persistWorldGroupMove(gesture.group);
            hintEl.textContent=`Moved ${gesture.group.label} · group remains locked`;
            hintEl.classList.remove('hidden');
          }
          else if (gesture.kind==='selected-object' && gesture.object) {
            if (gesture.object.category === 'gameplay') settleGameplayCrates();
            const instance = gesture.object.puzzleInstanceId ? activePuzzleInstances.get(gesture.object.puzzleInstanceId) : null;
            if (instance) capturePuzzleInstance(instance);
            else recordObjectEdit(gesture.object);
          }
          else if (gesture.kind==='collision-handle' && selectedObject) recordObjectEdit(selectedObject);
          else if (gesture.kind==='puzzle-respawn' && gesture.respawnMarker) { savePuzzleRespawnDraft(gesture.respawnMarker); updatePuzzlePanel(); }
          else if (gesture.kind==='puzzle-cart-path' && gesture.cartPathMarker) { savePuzzleCartPathDraft(gesture.cartPathMarker); updatePuzzlePanel(); }
          else if (gesture.kind==='puzzle-marker' && gesture.marker) {
            persistPuzzleMarkerPosition(gesture.marker);
            settleGameplayCrates();
            renderScenePuzzleList({ force:true });
            updatePuzzlePanel();
          }
          else if (gesture.kind==='puzzle-bound') {
            const instance=selectedPuzzleInstance(); if(instance) puzzleStartDirty.add(instance.id);
          }
          else if (gesture.kind==='world-group-exclusion' && gesture.groupExclusionGroup) {
            saveSceneData();worldGroupListSignature='';renderWorldGroupTools({force:true});
          }
          else if (gesture.kind==='puzzle-exclusion' && gesture.exclusionMarker) {
            savePuzzleExclusionState();
            updatePuzzlePanel();
          }
        } else if (!gesture.moved && gesture.kind==='world-group-direct' && gesture.group) {
          selectWorldGroup(gesture.group.id,{focus:false});
          selectObject(null);
          hintEl.textContent=`${gesture.group.label} selected · locked · drag ONLY the yellow dot to move · Edit Group to edit members`;
          hintEl.classList.remove('hidden');
        } else if (!gesture.moved && gesture.kind==='world-group-template-place') {
          const template=worldGroupTemplateById(selectedWorldTemplateId);
          const point=groundPointFromClient(e.clientX,e.clientY)||gesture.startGround;
          const group=template&&point?spawnWorldGroupTemplateAt(template,point):null;
          if(group){
            hintEl.textContent=`Placed ${group.label} · ground-bound assets re-grounded individually`;
            hintEl.classList.remove('hidden');
          }
          worldGroupTemplatePlaceMode=false;
          renderWorldGroupTools({force:true});
        } else if (!gesture.moved && gesture.kind==='world-group-move') {
          const group=worldGroupById(selectedWorldGroupId);const point=groundPointFromClient(e.clientX,e.clientY)||gesture.startGround;
          if(group&&point&&moveWorldGroupTo(group,point)){hintEl.textContent=`Moved ${group.label} · ground assets re-grounded · free assets kept their group-relative height`;hintEl.classList.remove('hidden');}
          worldGroupMoveMode=false;renderWorldGroupTools({force:true});
        } else if (!gesture.moved && gesture.kind==='socket-place-pan' && gesture.socketPiece) {
          const host = socketHostAt(e.clientX,e.clientY);
          if (host && placeSocketOnHost(gesture.socketPiece, host, e.clientX, e.clientY)) {
            hintEl.textContent = `Socket set for ${socketLabelForPiece(gesture.socketPiece)} · select another piece or press Move Socket to adjust`;
            hintEl.classList.remove('hidden');
            socketPlacementPiece = null;
            updateEditorButtons();
            updatePuzzlePanel();
          } else {
            hintEl.textContent = 'Tap directly on an asset tagged Socket Host';
            hintEl.classList.remove('hidden');
          }
        } else if (gesture.placement && gesture.kind==='placement-pan') {
          // Taps in Placement mode go straight through visible assets to the
          // ground. Nothing is selected, so dense dressing cannot steal input.
          if(addAssetType){
            const point=placementPointFromClient(addAssetType,e.clientX,e.clientY) || gesture.startGround;
            if(point){
              const placedType=addAssetType;
              createUserObject(placedType,point,{selectAfter:false});
              selectedObject=null;
              selectionCycleInfo=null;
              const info=editorAssetInfo.get(placedType);
              hintEl.textContent=`Placed ${String(info?.label || placedType).toLowerCase()} · tap again to add another · drag anywhere to pan`;
              hintEl.classList.remove('hidden');
            }
          }
        } else if (gesture.kind==='pan' || gesture.kind==='selected-object') {
          // Selection happens only on a clean tap/release. A drag can never
          // select a different object, which keeps panning and moving separate.
          const candidates=pickSceneObjects(e.clientX,e.clientY).filter(editorObjectIsEditable);
          const hit=nextTapCycleObject(candidates,e.clientX,e.clientY);
          if(hit){
            selectObject(hit,true);
            selectionCycleInfo=cycleInfoFor(selectedObject,candidates);
            hintEl.textContent=candidates.length>1
              ? `Selected · tap the same spot again to cycle ${selectionCycleInfo.index+1}/${candidates.length}`
              : 'Selected · drag the asset to move · horizontal follows screen X · vertical controls depth';
            hintEl.classList.remove('hidden');
          } else {
            const lockedGroup=editorScope==='environment'?worldGroupAtEditorPoint(e.clientX,e.clientY):null;
            if(lockedGroup&&(!worldGroupEditMode||lockedGroup.id!==selectedWorldGroupId)){
              selectionTapCycle=null;
              selectObject(null);
              selectWorldGroup(lockedGroup.id,{edit:false,focus:false});
              hintEl.textContent=`${lockedGroup.label} selected · locked · use the yellow dot to move it`;
              hintEl.classList.remove('hidden');
            }else{
              selectionTapCycle=null;
              selectObject(null);
            }
          }
        }
      }
      editorGesture=null;editorPointer=null;editorDragKind=null;editorTapState=null;collisionHandleIndex=-1;puzzleBoundSide=null;puzzleRespawnHandle=null;puzzleCartPathHandle=null;
      return;
    }
    if (e.pointerId === activePointer) activePointer = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', e => {
    // Editor shortcuts must never fire while the user is typing. On iOS the
    // software keyboard's delete key bubbles as Backspace, which previously
    // reached the editor-level Delete/Backspace shortcut and deleted the
    // selected Thought Trigger while its text field was focused.
    const target = e.target;
    const typingTarget = !!target && (
      target.isContentEditable ||
      target.tagName === 'TEXTAREA' ||
      (target.tagName === 'INPUT' && !['button','checkbox','radio','range','submit','reset','file','color'].includes((target.type || 'text').toLowerCase()))
    );
    if (typingTarget) return;

    const key = e.key.toLowerCase();
    if (editMode) {
      if (e.key === 'Escape') {
        if (inventoryOpen) { setInventoryOpen(false); return; }
        socketPlacementPiece = null; worldGroupMoveMode=false; worldGroupExclusionEditMode=false; worldGroupTemplatePlaceMode=false; selectObject(null); setAssetPaletteOpen(false, { clearPending:true }); updateAssetPaletteState(); renderWorldGroupTools({force:true});
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) { e.preventDefault(); deleteSelected(); }
      return;
    }
    if (introLocked) return;
    if (e.key === 'ArrowLeft' || key === 'a') {
      keyLeft = true;
      hideTransientHint();
    }
    if (e.key === 'ArrowRight' || key === 'd') {
      keyRight = true;
      hideTransientHint();
    }
    if (e.key === 'Shift') keyRun = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || key === 'w') { e.preventDefault(); triggerJump(); }
    if (key === 'e') { e.preventDefault(); performAction(); }
    if (e.key === '0') camera.x = 0;
  });

  window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (editMode) return;
    if (e.key === 'ArrowLeft' || key === 'a') keyLeft = false;
    if (e.key === 'ArrowRight' || key === 'd') keyRight = false;
    if (e.key === 'Shift') keyRun = false;
  });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshAssetLabAuthoringFromStorage();
    refreshCharacterCollider();
    keyLeft = false;
    keyRight = false;
    keyRun = false;
    setDriveAxis(0);
    jumping = false;
    jumpTime = 0;
    const support = editMode
      ? editorSafeSupportAt(camera.x + character.screenOffsetX + colliderWorld().offsetX, Infinity, 0)
      : walkableSupportAt(camera.x + character.screenOffsetX + colliderWorld().offsetX, Infinity, 0);
    if (support) {
      jumpOffset = support.offset;
      standingOnObject = support.obj;
    } else {
      jumpOffset = character.y - playSurfaceYAt(character.x);
      standingOnObject = null;
      jumping = true;
      jumpCameraBaseY = character.y;
    }
    jumpVelocity = 0;
    autoDropStep = null;
    if (interactionState?.type === 'pickup') interactionState.object.carried = false;
    if (interactionState?.type === 'drop') completeDrop();
    interactionState = null;
    locomotionPhase = 0;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    lastTime = performance.now();
    previousCameraX = camera.x;
  });

  async function waitForInitialVisualAssets(maxWaitMs = 4200) {
    const startedAt = performance.now();
    let stableFrames = 0;
    let lastStarted = -1;
    while (performance.now() - startedAt < maxWaitMs) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const sameLoadSet = visualAssetsStarted === lastStarted;
      stableFrames = visualAssetsPending === 0 && sameLoadSet ? stableFrames + 1 : 0;
      lastStarted = visualAssetsStarted;
      if (stableFrames >= 3) break;
    }
  }

  async function releasePlayerIntroFade() {
    // World Lab is a developer/test jump rather than a cinematic game start.
    // Reveal it immediately so a stale/failed asset wait can never strand the
    // user behind the full-screen black launch overlay.
    if (WORLD_LAB_LAUNCH) {
      introLocked = false;
      setDriveAxis(0);
      document.body.classList.remove('sidescroll-intro-locked');
      document.documentElement.classList.remove('ss-player-launch');
      entryFadeEl?.remove();
      return;
    }
    if (!PLAYER_MODE) {
      introLocked = false;
      entryFadeEl?.remove();
      document.documentElement.classList.remove('ss-player-launch');
      return;
    }
    document.body.classList.add('sidescroll-intro-locked');
    setDriveAxis(0);
    await waitForInitialVisualAssets();
    // Allow one fully populated frame to reach the screen before revealing it.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (!entryFadeEl) {
      introLocked = false;
      document.body.classList.remove('sidescroll-intro-locked');
      return;
    }
    entryFadeEl.classList.add('fade-out');
    const unlock = () => {
      if (!introLocked) return;
      introLocked = false;
      setDriveAxis(0);
      document.body.classList.remove('sidescroll-intro-locked');
      document.documentElement.classList.remove('ss-player-launch');
      entryFadeEl.style.display = 'none';
    };
    entryFadeEl.addEventListener('transitionend', unlock, { once:true });
    window.setTimeout(unlock, 1100);
  }

  populatePuzzleSelector();
  buildAssetPalette();
  updateEditorButtons();
  if (PLAYER_MODE) {
    document.body.classList.add('sidescroll-player-mode');
    // Player mode should feel like the game, not the authoring tool. Keep only
    // the useful player actions in Menu: Change character, Sound, and Delete save.
    [cameraEditorBtn, debugBtn, sectionBtn, fogBtn, postBtn, collisionViewBtn, playerHintsBtn, quickNavBtn, editBtn].forEach(btn => {
      if (btn) btn.hidden = true;
    });
    if (deleteSaveBtn) deleteSaveBtn.hidden = false;
    updateCharacterSwapButton();
    if (statusEl) statusEl.textContent = 'Woodland adventure';
    restorePlayerPosition();
    window.addEventListener('pagehide', () => savePlayerPosition(true));
  }
  if (PUZZLE_LAB_MODE) {
    document.body.classList.add('sidescroll-puzzle-lab-mode');
    const homeLink = document.querySelector('.game-home-button');
    if (homeLink) { homeLink.href = 'puzzle-lab.html'; homeLink.textContent = '← Puzzle Lab'; homeLink.setAttribute('aria-label','Back to Puzzle Lab'); }
    if (statusEl) statusEl.textContent = `Puzzle Lab · ${markerDefinition(puzzleLabMarker)?.label || PUZZLE_LAB_GROUP_ID} · ${PUZZLE_LAB_ENVIRONMENT}`;
    if (collisionViewBtn) {
      collisionViewBtn.setAttribute('aria-pressed', String(collisionDebugView));
      collisionViewBtn.textContent = collisionDebugView ? 'Hide collision' : 'Collision';
    }
    setEditMode(true);
    editorScope = 'puzzle';
    puzzleBrowserMode = 'scene';
    editorPuzzleMarkerId = puzzleLabMarker.id;
    editorPuzzleLibraryGroupId = PUZZLE_LAB_GROUP_ID;
    choosePuzzleForEditing(puzzleLabMarker.id, true);
    if (PUZZLE_LAB_AUTO_TEST) requestAnimationFrame(() => requestAnimationFrame(beginPuzzleTest));
  } else {
    setEditMode(false);
  }
  updatePuzzlePanel();
  renderWorldGroupTools({force:true});
  resize();
  renderInventory();
  requestAnimationFrame(render);
  releasePlayerIntroFade();
})();
