(() => {
  'use strict';

  const VERSION = '1.0.102';
  const assetPath = window.SideScrollAssetPath || (url => url);
  const BEHAVIOUR_KEY = 'sidescroll.asset-behaviours.v1';
  const COLLISION_KEY = 'sidescroll.asset-collisions.v1';
  const LAYOUT_KEY = 'sidescroll.asset-layout.v1';
  const MECHANISM_KEY = 'sidescroll.asset-mechanisms.v3';
  const SOCKET_KEY = 'sidescroll.asset-sockets.v1';
  const STATE_KEY = 'sidescroll.asset-states.v1';
  const CLIMB_PATH_KEY = 'sidescroll.asset-climb-paths.v1';
  const STACK_ITEM_HEIGHT = 0.68;
  const BRIDGE_NAMES = ['bridge-left', 'bridge-right'];
  const behaviourKeys = ['solid','carryable','placeable','supportSurface','stackable','pushable','climbable','followSurfaceNormal','socketHost','socketPiece'];
  const emptyBehaviour = { solid:false, carryable:false, placeable:false, supportSurface:false, stackable:false, pushable:false, climbable:false, followSurfaceNormal:false, socketHost:false, socketPiece:false };

  // Built-in assets: builtin-assets.js (shared with Character Lab's scene objects).
  const ASSETS = window.SideScrollBuiltInAssets ? window.SideScrollBuiltInAssets.list() : [];

  // Imported assets (Asset Lab → + Import asset; asset-library.js) follow the
  // built-in ones, sorted by library and heading. They are set up like any other
  // asset: everything below is keyed by the asset's permanent name.
  const Lib = window.SideScrollAssetLibrary || null;
  const importedAsset = entry => ({
    group:`${entry.scope === 'puzzle' ? 'PUZZLE' : 'ENVIRONMENT'} · ${entry.group}`, scope:entry.scope,
    name:entry.name, label:entry.label, imported:true, height:entry.height, groundLine:entry.groundLine, behaviour:{}
  });
  function syncImportedAssets() {
    for (let i = ASSETS.length - 1; i >= 0; i--) if (ASSETS[i].imported) ASSETS.splice(i, 1);
    const entries = (Lib?.list() || []).sort((a, b) => a.scope.localeCompare(b.scope) || a.group.localeCompare(b.group) || a.createdAt - b.createdAt);
    ASSETS.push(...entries.map(importedAsset));
  }
  syncImportedAssets();
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const canvas = document.getElementById('assetlab-canvas');
  const ctx = canvas.getContext('2d');
  const listEl = document.getElementById('assetlab-asset-list');
  const currentNameEl = document.getElementById('assetlab-current-name');
  const saveStateEl = document.getElementById('assetlab-save-state');
  const stageHelpEl = document.getElementById('assetlab-stage-help');
  const heightInput = document.getElementById('assetlab-height');
  const heightValue = document.getElementById('assetlab-height-value');
  const floorInput = document.getElementById('assetlab-floor');
  const floorValue = document.getElementById('assetlab-floor-value');
  const rotationInput = document.getElementById('assetlab-rotation');
  const rotationValue = document.getElementById('assetlab-rotation-value');
  const flipBtn = document.getElementById('assetlab-flip');
  const collisionToggle = document.getElementById('assetlab-collision-toggle');
  const collisionRemove = document.getElementById('assetlab-collision-remove');
  const collisionReset = document.getElementById('assetlab-collision-reset');
  const depthRow = document.getElementById('assetlab-depth-row');
  const depthInput = document.getElementById('assetlab-depth');
  const depthValue = document.getElementById('assetlab-depth-value');
  const pointEditor = document.getElementById('assetlab-point-editor');
  const pointList = document.getElementById('assetlab-point-list');
  const edgeFloorBtn = document.getElementById('assetlab-edge-floor');
  const collisionShapeSelect = document.getElementById('assetlab-collision-shape');
  const collisionAddBoxBtn = document.getElementById('assetlab-collision-add-box');
  const collisionDeleteBoxBtn = document.getElementById('assetlab-collision-delete-box');
  const behavioursEl = document.getElementById('assetlab-behaviours');
  const climbSection = document.getElementById('assetlab-climb-section');
  const climbPathSelect = document.getElementById('assetlab-climb-path-select');
  const climbPathAddBtn = document.getElementById('assetlab-climb-path-add');
  const climbPathDeleteBtn = document.getElementById('assetlab-climb-path-delete');
  const climbWidthInput = document.getElementById('assetlab-climb-width');
  const climbWidthValue = document.getElementById('assetlab-climb-width-value');
  const climbBottomXInput = document.getElementById('assetlab-climb-bottom-x');
  const climbBottomYInput = document.getElementById('assetlab-climb-bottom-y');
  const climbTopXInput = document.getElementById('assetlab-climb-top-x');
  const climbTopYInput = document.getElementById('assetlab-climb-top-y');
  const resetBtn = document.getElementById('assetlab-reset');
  const fitBtn = document.getElementById('assetlab-fit');
  const referenceBtn = document.getElementById('assetlab-reference');
  const pairBtn = document.getElementById('assetlab-pair');
  // Show: one filter (all, a library, imported, effects, or a group heading).
  const filterSelect = document.getElementById('assetlab-filter');
  function assetMatchesFilter(a, f = state.filter) {
    if (!f || f === 'all') return true;
    if (f === 'puzzle' || f === 'environment') return a.scope === f;
    if (f === 'imported') return !!a.imported;
    if (f === 'effects') return !!a.imported && !!Lib?.isEffect(Lib.get(a.name));
    if (f.startsWith('group:')) return a.group === f.slice(6);
    return true;
  }
  function renderFilterOptions() {
    if (!filterSelect) return;
    const opt = (value, label) => Object.assign(document.createElement('option'), { value, textContent:label });
    const groups = [...new Set(ASSETS.map(a => a.group))];
    const groupBox = Object.assign(document.createElement('optgroup'), { label:'Groups' });
    groupBox.append(...groups.map(g => opt(`group:${g}`, g.charAt(0) + g.slice(1).toLowerCase())));
    filterSelect.replaceChildren(opt('all', 'All assets'), opt('puzzle', 'Puzzle assets'), opt('environment', 'Environment assets'),
      opt('imported', 'Imported'), opt('effects', 'Effects'), groupBox);
    if (![...filterSelect.options].some(o => o.value === state.filter)) state.filter = 'all';
    filterSelect.value = state.filter;
  }
  const filterButtons = []; // kept for older code paths; the Show select replaced the buttons
  const counterweightSection = document.getElementById('assetlab-counterweight-section');
  const pivotXInput = document.getElementById('assetlab-pivot-x');
  const pivotYInput = document.getElementById('assetlab-pivot-y');
  const zoneStartInput = document.getElementById('assetlab-zone-start');
  const zoneEndInput = document.getElementById('assetlab-zone-end');
  const zoneYInput = document.getElementById('assetlab-zone-y');
  const zoneDepthInput = document.getElementById('assetlab-zone-depth');
  const logWeightInput = document.getElementById('assetlab-log-weight');
  const playerWeightInput = document.getElementById('assetlab-player-weight');
  const maxTipInput = document.getElementById('assetlab-max-tip');
  const fallTipInput = document.getElementById('assetlab-fall-tip');
  const pivotXValue = document.getElementById('assetlab-pivot-x-value');
  const pivotYValue = document.getElementById('assetlab-pivot-y-value');
  const zoneStartValue = document.getElementById('assetlab-zone-start-value');
  const zoneEndValue = document.getElementById('assetlab-zone-end-value');
  const zoneYValue = document.getElementById('assetlab-zone-y-value');
  const zoneDepthValue = document.getElementById('assetlab-zone-depth-value');
  const logWeightValue = document.getElementById('assetlab-log-weight-value');
  const playerWeightValue = document.getElementById('assetlab-player-weight-value');
  const maxTipValue = document.getElementById('assetlab-max-tip-value');
  const fallTipValue = document.getElementById('assetlab-fall-tip-value');
  const socketSection = document.getElementById('assetlab-socket-section');
  const socketHeading = document.getElementById('assetlab-socket-heading');
  const socketHostControls = document.getElementById('assetlab-socket-host-controls');
  const socketPieceNote = document.getElementById('assetlab-socket-piece-note');
  const socketPieceSelect = document.getElementById('assetlab-socket-piece');
  const socketPlaceBtn = document.getElementById('assetlab-socket-place');
  const socketDeleteBtn = document.getElementById('assetlab-socket-delete');
  const socketXInput = document.getElementById('assetlab-socket-x');
  const socketYInput = document.getElementById('assetlab-socket-y');
  const socketXValue = document.getElementById('assetlab-socket-x-value');
  const socketYValue = document.getElementById('assetlab-socket-y-value');
  const socketNote = document.getElementById('assetlab-socket-note');
  const brokenCartSection = document.getElementById('assetlab-broken-cart-section');
  const brokenOffsetXInput = document.getElementById('assetlab-broken-offset-x');
  const brokenOffsetYInput = document.getElementById('assetlab-broken-offset-y');
  const brokenOffsetXValue = document.getElementById('assetlab-broken-offset-x-value');
  const brokenOffsetYValue = document.getElementById('assetlab-broken-offset-y-value');
  const stateSelect = document.getElementById('assetlab-state-select');
  const stateNewBtn = document.getElementById('assetlab-state-new');
  const stateDuplicateBtn = document.getElementById('assetlab-state-duplicate');
  const stateRenameBtn = document.getElementById('assetlab-state-rename');
  const stateDeleteBtn = document.getElementById('assetlab-state-delete');
  const cartComponents = document.getElementById('assetlab-cart-components');
  const cartRearWheelBtn = document.getElementById('assetlab-cart-rear-wheel');
  const cartFrontWheelBtn = document.getElementById('assetlab-cart-front-wheel');

  const readStore = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  };
  let behaviourStore = readStore(BEHAVIOUR_KEY);
  let collisionStore = readStore(COLLISION_KEY);
  let layoutStore = readStore(LAYOUT_KEY);
  let mechanismStore = readStore(MECHANISM_KEY);
  let socketStore = readStore(SOCKET_KEY);
  let assetStateStore = readStore(STATE_KEY);
  let climbPathStore = readStore(CLIMB_PATH_KEY);

  const DEFAULT_COUNTERWEIGHT = Object.freeze({
    type:'counterweightPlank',
    pivotX:0.23,
    pivotY:0.50,
    zoneStart:0.00,
    zoneEnd:0.23,
    zoneY:0.60,
    zoneDepth:1.20,
    minimumOverlap:0.50,
    logWeight:1.30,
    playerWeight:1.00,
    maxTipDeg:32,
    fallAngleDeg:12
  });

  function isCounterweightPlank(asset=state.asset) {
    return asset?.name === 'counterweight-plank';
  }

  function effectiveMechanism(asset=state.asset) {
    if (!isCounterweightPlank(asset)) return null;
    return {...DEFAULT_COUNTERWEIGHT,...(mechanismStore[asset.name]||{})};
  }

  function saveMechanism(patch) {
    if (!isCounterweightPlank()) return;
    mechanismStore[state.asset.name] = {...effectiveMechanism(),...patch,type:'counterweightPlank',minimumOverlap:0.50};
    writeStore(MECHANISM_KEY,mechanismStore);
  }

  const imageCache = new Map();
  const assetByName = name => ASSETS.find(a => a.name === name) || null;
  const isBridge = asset => !!asset && BRIDGE_NAMES.includes(asset.name);
  const urlParams = new URLSearchParams(location.search);
  const requestedAsset = assetByName(urlParams.get('asset'));

  const state = {
    filter:requestedAsset?.scope || 'all',
    asset:requestedAsset || ASSETS[0],
    showReference:true,
    pairMode:false,
    draggingHandle:-1,
    draggingEdge:null,
    selectedPoint:-1,
    selectedEdge:-1,
    selectedShape:0,
    panning:false,
    pointerStart:null,
    panStart:null,
    panX:0,
    panY:0,
    viewScale:1,
    render:null,
    socketPlacementMode:false,
    assetState:'base',
    selectedClimbPath:0,
    draggingClimbHandle:null,
    activePointers:new Map(),
    pinch:null,
    blockSingleTouchUntilClear:false
  };

  const defaultPoints = () => [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}];
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const cartWheelPreview = new Image();
  cartWheelPreview.onload = () => draw();
  cartWheelPreview.src = assetPath(`handcart-wheel.png?v=${VERSION}`);

  function drawAxlePin(ctx,w,h){
    ctx.clearRect(0,0,w,h);
    ctx.save();
    ctx.translate(w*.5,h*.5); ctx.rotate(-.32);
    ctx.fillStyle='rgba(238,209,129,.34)'; ctx.beginPath(); ctx.arc(0,0,w*.40,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#9e8959'; ctx.fillRect(-w*.31,-h*.065,w*.54,h*.13);
    ctx.fillStyle='#e3cd94'; ctx.fillRect(-w*.30,-h*.025,w*.49,h*.05);
    ctx.fillStyle='#75613d'; ctx.fillRect(w*.13,-h*.115,w*.10,h*.23);
    ctx.fillStyle='#e8d49c'; ctx.beginPath(); ctx.arc(-w*.31,0,w*.105,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#705c39'; ctx.beginPath(); ctx.arc(-w*.31,0,w*.058,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function makeProceduralImage(asset){
    const c=document.createElement('canvas'); c.width=256; c.height=256;
    const cctx=c.getContext('2d');
    if(asset?.procedural==='axle-pin') drawAxlePin(cctx,256,256);
    const img=new Image(); img.src=c.toDataURL('image/png'); return img;
  }

  let effectPreviewSample = null; // set below (character effect preview)
  let effectPreviewSize = null;   // {name, metres, aspect, ground} of the character drawn for it
  function ensureImage(asset) {
    if (!asset) return null;
    const existing = imageCache.get(asset.name);
    if (existing) return existing;
    if (asset.imported && Lib?.isEffect(Lib.get(asset.name))) {
      // Shader effect: the shared effect canvas stands in for an image (animated by
      // tickEffects); the list row gets a still frame.
      const r = window.SideScrollEffects?.canvasRenderer();
      const entry = Lib.get(asset.name);
      Lib.artUrl(entry).then(url => listEl.querySelector(`[data-asset="${asset.name}"] img`)?.setAttribute('src', url)).catch(() => {});
      if (!r) return null;
      if (!('naturalWidth' in r.canvas && r.canvas.complete)) {
        Object.defineProperty(r.canvas, 'naturalWidth', { get:() => r.canvas.width, configurable:true });
        Object.defineProperty(r.canvas, 'naturalHeight', { get:() => r.canvas.height, configurable:true });
        Object.defineProperty(r.canvas, 'complete', { get:() => true, configurable:true });
      }
      const t = performance.now() / 1000;
      r.render(entry.art, t, effectPreviewSample?.(entry.art, t) || null); // a character effect may preview on a real character
      return r.canvas; // not cached: every effect shares this canvas
    }
    if (asset.imported) {
      const img = new Image();
      img.onload = () => { resize(); renderPointEditor(); draw(); if (state.asset === asset) syncTextureFacts(); };
      Lib.artUrl(Lib.get(asset.name)).then(url => {
        img.src = url;
        listEl.querySelector(`[data-asset="${asset.name}"] img`)?.setAttribute('src', url);
      }).catch(() => { asset.artMissing = true; syncImportedSection(); });
      imageCache.set(asset.name, img);
      return img;
    }
    if (asset.procedural) {
      const img=makeProceduralImage(asset);
      img.onload=()=>{resize();renderPointEditor();draw();};
      imageCache.set(asset.name,img);
      return img;
    }
    const img = new Image();
    img.onload = () => { resize(); renderPointEditor(); draw(); if (state.asset === asset) syncTextureFacts(); };
    img.src = assetPath(`${asset.image}?v=${VERSION}`);
    imageCache.set(asset.name,img);
    return img;
  }

  function canonicalStateAssetName(asset=state.asset) {
    const name = typeof asset === 'string' ? asset : asset?.name;
    if (name === 'handcart-broken') return 'handcart';
    if (name === 'cart-wheel-ready') return 'cart-wheel-loose';
    return name || '';
  }

  function defaultStateForAsset(asset=state.asset) {
    const name = typeof asset === 'string' ? asset : asset?.name;
    if (name === 'handcart-broken') return 'broken';
    if (name === 'handcart') return 'repaired';
    return 'base';
  }

  function stateProfile(asset=state.asset, stateName=null) {
    const name = canonicalStateAssetName(asset);
    const chosen = stateName ?? ((asset === state.asset || asset?.name === state.asset?.name) ? state.assetState : defaultStateForAsset(asset));
    if (!name || chosen === 'base') return null;
    return assetStateStore?.[name]?.states?.[chosen] || null;
  }

  function ensureStateBucket(asset=state.asset) {
    const name = canonicalStateAssetName(asset);
    assetStateStore[name] ||= { states:{} };
    assetStateStore[name].states ||= {};
    return assetStateStore[name];
  }

  function writeStateStore() {
    writeStore(STATE_KEY, assetStateStore);
  }

  function builtInBehaviour(asset) {
    return {...emptyBehaviour,...(asset?.behaviour||{})};
  }

  function normaliseBehaviour(value) {
    const b = {...emptyBehaviour,...(value||{})};
    if (b.carryable) b.placeable = true;
    if (b.supportSurface) b.solid = true;
    if (b.stackable) b.placeable = true;
    if (b.pushable) b.solid = true;
    return b;
  }

  function baseBehaviour(asset=state.asset) {
    return normaliseBehaviour({...builtInBehaviour(asset),...(behaviourStore[asset.name]||{})});
  }

  function effectiveBehaviour(asset=state.asset, stateName=null) {
    const profile = stateProfile(asset,stateName);
    return normaliseBehaviour(profile?.behaviour ? profile.behaviour : baseBehaviour(asset));
  }

  function builtinClimbPaths(asset=state.asset) {
    return Array.isArray(asset?.climbPaths) ? clone(asset.climbPaths) : [];
  }

  function genericClimbPath(asset=state.asset) {
    return { id:`path-${Date.now()}`, bottom:{x:0,y:0.02}, top:{x:0,y:0.92}, widthRatio:0.12 };
  }

  function effectiveClimbPaths(asset=state.asset) {
    if (!asset) return [];
    if (Object.prototype.hasOwnProperty.call(climbPathStore,asset.name)) {
      const stored=climbPathStore[asset.name];
      return Array.isArray(stored) ? clone(stored) : [];
    }
    return builtinClimbPaths(asset);
  }

  function writeClimbPaths(asset,paths,{persist=true}={}) {
    if(!asset) return;
    climbPathStore[asset.name]=clone(Array.isArray(paths)?paths:[]);
    if(persist) writeStore(CLIMB_PATH_KEY,climbPathStore);
  }

  function ensureClimbPath(asset=state.asset) {
    let paths=effectiveClimbPaths(asset);
    if(paths.length) return paths;
    paths=[genericClimbPath(asset)];
    writeClimbPaths(asset,paths);
    state.selectedClimbPath=0;
    return paths;
  }

  function selectedClimbPath(asset=state.asset) {
    const paths=effectiveClimbPaths(asset);
    if(!paths.length) return null;
    state.selectedClimbPath=clamp(state.selectedClimbPath,0,paths.length-1);
    return paths[state.selectedClimbPath] || null;
  }

  function baseHeight(asset=state.asset) {
    const v = Number(layoutStore[asset.name]?.defaultHeight);
    return Number.isFinite(v) ? clamp(v,0.25,12) : asset.height;
  }

  function effectiveHeight(asset=state.asset, stateName=null) {
    const profile = stateProfile(asset,stateName);
    const v = Number(profile?.layout?.defaultHeight);
    return Number.isFinite(v) ? clamp(v,0.25,12) : baseHeight(asset);
  }

  function baseGroundLine(asset=state.asset) {
    const v = Number(layoutStore[asset.name]?.groundLine);
    return Number.isFinite(v) ? clamp(v,0,1) : clamp(Number(asset.groundLine)||0,0,1);
  }

  function effectiveGroundLine(asset=state.asset, stateName=null) {
    const profile = stateProfile(asset,stateName);
    const v = Number(profile?.layout?.groundLine);
    return Number.isFinite(v) ? clamp(v,0,1) : baseGroundLine(asset);
  }

  function baseVisual(asset=state.asset) {
    const stored=layoutStore[asset?.name]||{};
    const fallback=asset?.name==='handcart-broken' ? {visualOffsetX:0,visualOffsetY:-.06,visualRotationDeg:-6} : {visualOffsetX:0,visualOffsetY:0,visualRotationDeg:0};
    return {
      x:Number.isFinite(Number(stored.visualOffsetX))?Number(stored.visualOffsetX):fallback.visualOffsetX,
      y:Number.isFinite(Number(stored.visualOffsetY))?Number(stored.visualOffsetY):fallback.visualOffsetY,
      deg:Number.isFinite(Number(stored.visualRotationDeg))?Number(stored.visualRotationDeg):fallback.visualRotationDeg,
      flip:!!stored.visualFlip
    };
  }

  function effectiveVisual(asset=state.asset, stateName=null) {
    const base=baseVisual(asset);
    const stored=stateProfile(asset,stateName)?.layout||{};
    return {
      x:Number.isFinite(Number(stored.visualOffsetX))?Number(stored.visualOffsetX):base.x,
      y:Number.isFinite(Number(stored.visualOffsetY))?Number(stored.visualOffsetY):base.y,
      deg:Number.isFinite(Number(stored.visualRotationDeg))?Number(stored.visualRotationDeg):base.deg,
      flip:Object.prototype.hasOwnProperty.call(stored,'visualFlip')?!!stored.visualFlip:base.flip
    };
  }

  function behaviourNeedsCollision(behaviour) {
    return !!(behaviour?.solid || behaviour?.carryable || behaviour?.supportSurface || behaviour?.stackable || behaviour?.pushable);
  }
  function assetAspect(asset=state.asset) {
    const image=ensureImage(asset);
    return image?.naturalWidth && image?.naturalHeight ? image.naturalWidth/image.naturalHeight : 1;
  }
  function assetWorldWidth(asset=state.asset) {
    return effectiveHeight(asset)*assetAspect(asset);
  }
  function autoCollision(asset=state.asset) {
    if (asset.collision) return clone(asset.collision);
    const behaviour=effectiveBehaviour(asset);
    if (!behaviourNeedsCollision(behaviour)) return null;
    const width=Math.max(.001,assetWorldWidth(asset));
    return {
      halfWidthRatio:.43,
      heightRatio:behaviour.stackable?null:.96,
      fixedHeight:behaviour.stackable?STACK_ITEM_HEIGHT:null,
      depthRatio:Math.max(.01,Math.min(1.08,width*.42)/width),
      points:defaultPoints(),
      autoGenerated:true
    };
  }

  function baseCollision(asset=state.asset) {
    if (Object.prototype.hasOwnProperty.call(collisionStore,asset.name)) return clone(collisionStore[asset.name]);
    if (asset.collision) return clone(asset.collision);
    const behaviour=baseBehaviour(asset);
    if (!behaviourNeedsCollision(behaviour)) return null;
    const height=baseHeight(asset);
    const image=ensureImage(asset);
    const aspect=image?.naturalWidth&&image?.naturalHeight?image.naturalWidth/image.naturalHeight:1;
    const width=Math.max(.001,height*aspect);
    return {halfWidthRatio:.43,heightRatio:behaviour.stackable?null:.96,fixedHeight:behaviour.stackable?STACK_ITEM_HEIGHT:null,depthRatio:Math.max(.01,Math.min(1.08,width*.42)/width),points:defaultPoints(),autoGenerated:true};
  }

  function effectiveCollision(asset=state.asset, stateName=null) {
    const profile=stateProfile(asset,stateName);
    if (profile && Object.prototype.hasOwnProperty.call(profile,'collision')) return clone(profile.collision);
    if (Object.prototype.hasOwnProperty.call(collisionStore,asset.name)) return clone(collisionStore[asset.name]);
    return autoCollision(asset);
  }
  function hasCollisionOverride(asset=state.asset) {
    const profile=stateProfile(asset);
    if (profile) return Object.prototype.hasOwnProperty.call(profile,'collision');
    return Object.prototype.hasOwnProperty.call(collisionStore,asset.name);
  }
  function hasCustomCollision(asset=state.asset) {
    const profile=stateProfile(asset);
    if (profile) return Object.prototype.hasOwnProperty.call(profile,'collision') && profile.collision != null;
    return hasCollisionOverride(asset) && collisionStore[asset.name] != null;
  }

  function setCollisionOverride(asset,value) {
    const profile=stateProfile(asset);
    if (profile) {
      profile.collision=clone(value);
      writeStateStore();
    } else {
      collisionStore[asset.name]=clone(value);
      writeStore(COLLISION_KEY,collisionStore);
    }
  }

  function deleteCollisionOverride(asset=state.asset) {
    const profile=stateProfile(asset);
    if (profile) {
      delete profile.collision;
      writeStateStore();
    } else {
      delete collisionStore[asset.name];
      writeStore(COLLISION_KEY,collisionStore);
    }
  }
  function collisionShapeDefs(def) {
    if(!def) return [];
    if(Array.isArray(def.shapes) && def.shapes.length){
      const valid=def.shapes
        .map(shape=>({points:Array.isArray(shape?.points)&&shape.points.length>=3?shape.points.map(p=>({...p})):null}))
        .filter(shape=>shape.points);
      if(valid.length) return valid;
    }
    const points=Array.isArray(def.points)&&def.points.length>=3?def.points.map(p=>({...p})):defaultPoints();
    return [{points}];
  }
  function ensureCollisionShapes(def) {
    if(!def) return [];
    const shapes=collisionShapeDefs(def);
    def.shapes=shapes.map(shape=>({points:shape.points.map(p=>({...p}))}));
    def.points=def.shapes[0].points.map(p=>({...p})); // legacy first-shape mirror
    return def.shapes;
  }
  function currentCollisionGeometry(asset=state.asset,shapeIndex=state.selectedShape) {
    const def=effectiveCollision(asset); if(!def) return null;
    const width=assetWorldWidth(asset); const height=effectiveHeight(asset);
    const halfWidth=Math.max(.01,(Number(def.halfWidthRatio)||.5)*width);
    const collHeight=Number.isFinite(def.fixedHeight)?Number(def.fixedHeight):Math.max(.01,(Number(def.heightRatio)||1)*height);
    const shapes=collisionShapeDefs(def);
    const index=clamp(Number(shapeIndex)||0,0,Math.max(0,shapes.length-1));
    const points=shapes[index]?.points||defaultPoints();
    return {def,width,height,halfWidth,collHeight,points,shapes,index};
  }

  function writeStore(key,value) {
    localStorage.setItem(key,JSON.stringify(value));
    saveStateEl.textContent='Saved';
    saveStateEl.classList.add('pulse');
    setTimeout(()=>saveStateEl.classList.remove('pulse'),220);
  }
  function saveLayout(patch) {
    const profile=stateProfile();
    if(profile){
      profile.layout={...(profile.layout||{}),...patch};
      writeStateStore();
    } else {
      layoutStore[state.asset.name] = {...(layoutStore[state.asset.name]||{}),...patch};
      writeStore(LAYOUT_KEY,layoutStore);
    }
  }


  function socketPieceAssets() {
    return ASSETS.filter(asset => effectiveBehaviour(asset).socketPiece);
  }

  function assetSocketEntries(asset=state.asset) {
    const list = socketStore[asset?.name];
    return Array.isArray(list) ? list : [];
  }

  function selectedSocketPieceName() {
    const options = socketPieceAssets();
    const requested = socketPieceSelect?.value;
    if (requested && options.some(asset => asset.name === requested)) return requested;
    if (state.asset?.name === 'bridge-left' || state.asset?.name === 'bridge-right') {
      const plank = options.find(asset => asset.name === 'counterweight-plank');
      if (plank) return plank.name;
    }
    return options[0]?.name || '';
  }

  function assetSocketForPiece(hostAsset=state.asset, pieceAssetName=selectedSocketPieceName()) {
    return assetSocketEntries(hostAsset).find(entry => entry?.pieceAsset === pieceAssetName && !entry.deleted) || null;
  }

  function managedSocketEntryForPiece(hostAsset=state.asset, pieceAssetName=selectedSocketPieceName()) {
    return assetSocketEntries(hostAsset).find(entry => entry?.pieceAsset === pieceAssetName) || null;
  }

  function writeAssetSocket(hostAsset, pieceAssetName, socket) {
    if (!hostAsset || !pieceAssetName) return;
    const entries = assetSocketEntries(hostAsset).filter(entry => entry?.pieceAsset !== pieceAssetName);
    entries.push(socket
      ? {
          id:`asset-socket-${hostAsset.name}-${pieceAssetName}`,
          pieceAsset:pieceAssetName,
          pieceObjectId:null,
          u:clamp(Number(socket.u)||0,0,1),
          v:clamp(Number(socket.v)||0,0,1)
        }
      : {
          id:`asset-socket-${hostAsset.name}-${pieceAssetName}`,
          pieceAsset:pieceAssetName,
          pieceObjectId:null,
          deleted:true
        });
    socketStore[hostAsset.name] = entries;
    writeStore(SOCKET_KEY,socketStore);
  }

  function setSocketAtViewportPoint(p,r) {
    const asset = state.asset;
    if (!effectiveBehaviour(asset).socketHost) return false;
    const ar = r?.assetRenders?.[asset.name];
    if (!ar || !renderContains(ar,p)) return false;
    const pieceName = selectedSocketPieceName();
    if (!pieceName) return false;
    const u = clamp((p.x-ar.drawX)/Math.max(1,ar.drawW),0,1);
    const v = clamp((ar.drawY+ar.drawH-p.y)/Math.max(1,ar.drawH),0,1);
    writeAssetSocket(asset,pieceName,{u,v});
    state.socketPlacementMode=false;
    syncSocketControls();
    draw();
    return true;
  }

  function populateSocketPieceSelect() {
    if (!socketPieceSelect) return;
    const prior = socketPieceSelect.value;
    const pieces = socketPieceAssets();
    socketPieceSelect.innerHTML = pieces.map(asset => `<option value="${asset.name}">${asset.label}</option>`).join('');
    const preferred = pieces.some(asset => asset.name === prior)
      ? prior
      : ((state.asset?.name === 'bridge-left' || state.asset?.name === 'bridge-right') && pieces.some(asset => asset.name === 'counterweight-plank')
          ? 'counterweight-plank'
          : pieces[0]?.name);
    if (preferred) socketPieceSelect.value = preferred;
  }

  function syncSocketControls() {
    if (!socketSection) return;
    const behaviour = effectiveBehaviour();
    const isHost = !!behaviour.socketHost;
    const isPiece = !!behaviour.socketPiece;
    socketSection.hidden = !(isHost || isPiece);
    if (socketSection.hidden) {
      state.socketPlacementMode=false;
      return;
    }

    socketHeading.textContent = isHost ? 'Asset socket links' : 'Socket Piece';
    socketHostControls.hidden = !isHost;
    socketPieceNote.hidden = isHost;

    if (!isHost) {
      state.socketPlacementMode=false;
      return;
    }

    populateSocketPieceSelect();
    const pieceName = selectedSocketPieceName();
    const socket = assetSocketForPiece(state.asset,pieceName);
    const managed = managedSocketEntryForPiece(state.asset,pieceName);

    socketPlaceBtn.textContent = state.socketPlacementMode
      ? 'Tap Artwork…'
      : (socket ? 'Move Socket' : 'Add Socket');
    socketPlaceBtn.classList.toggle('active',state.socketPlacementMode);
    socketDeleteBtn.disabled = !socket && !managed;

    socketXInput.disabled = !socket;
    socketYInput.disabled = !socket;
    socketXInput.value = String(Math.round((socket?.u ?? 0.5)*100));
    socketYInput.value = String(Math.round((socket?.v ?? 0.5)*100));
    socketXValue.textContent = `${Math.round((socket?.u ?? 0.5)*100)}%`;
    socketYValue.textContent = `${Math.round((socket?.v ?? 0.5)*100)}%`;

    if (state.socketPlacementMode) {
      socketNote.textContent = `Tap directly on ${state.asset.label} to place the socket for ${assetByName(pieceName)?.label || pieceName}.`;
    } else if (socket) {
      socketNote.textContent = `Linked to ${assetByName(pieceName)?.label || pieceName}. This position is inherited by every placed ${state.asset.label} asset.`;
    } else if (managed?.deleted) {
      socketNote.textContent = `The asset-level socket for ${assetByName(pieceName)?.label || pieceName} is explicitly disabled. Press Add Socket to create a new one.`;
    } else {
      socketNote.textContent = `Choose a Socket Piece, press Add Socket, then tap the host artwork. The link belongs to the asset, not an individual puzzle instance.`;
    }
  }

  function drawAssetSockets(r) {
    const asset = state.asset;
    if (!effectiveBehaviour(asset).socketHost) return;
    const ar = r?.assetRenders?.[asset.name];
    if (!ar) return;
    const entries = assetSocketEntries(asset).filter(entry => entry && !entry.deleted);
    if (!entries.length) return;

    ctx.save();
    ctx.font='800 9px -apple-system,BlinkMacSystemFont,sans-serif';
    for (const socket of entries) {
      const x = ar.drawX + clamp(Number(socket.u)||0,0,1)*ar.drawW;
      const y = ar.drawY + (1-clamp(Number(socket.v)||0,0,1))*ar.drawH;
      const active = socket.pieceAsset === selectedSocketPieceName();
      ctx.beginPath();
      ctx.arc(x,y,active?10:8,0,Math.PI*2);
      ctx.fillStyle=active?'rgba(121,239,133,.30)':'rgba(109,226,205,.20)';
      ctx.fill();
      ctx.strokeStyle=active?'#79ef85':'#6de2cd';
      ctx.lineWidth=active?3:2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x-14,y);ctx.lineTo(x+14,y);ctx.moveTo(x,y-14);ctx.lineTo(x,y+14);ctx.stroke();
      const label=assetByName(socket.pieceAsset)?.label || socket.pieceAsset;
      const tw=ctx.measureText(label).width+10;
      ctx.fillStyle='rgba(12,28,35,.86)';
      ctx.fillRect(x+12,y-19,tw,17);
      ctx.fillStyle=active?'#d8ffe0':'#c9fff5';
      ctx.fillText(label,x+17,y-7);
    }
    ctx.restore();
  }

  function displayAssets() {
    if (state.pairMode && isBridge(state.asset)) return BRIDGE_NAMES.map(assetByName).filter(Boolean);
    return [state.asset];
  }

  function stateLabel(stateName, asset=state.asset) {
    if (stateName === 'base') return 'Base';
    return assetStateStore?.[canonicalStateAssetName(asset)]?.states?.[stateName]?.label || stateName.replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  function cartDefaultStateDefinition(name) {
    const brokenAsset=assetByName('handcart-broken');
    const repairedAsset=assetByName('handcart');
    const source=name==='broken'?brokenAsset:repairedAsset;
    const visual=baseVisual(source);
    const layout={
      defaultHeight:baseHeight(source),
      groundLine:baseGroundLine(source),
      visualOffsetX:visual.x,
      visualOffsetY:visual.y,
      visualRotationDeg:visual.deg,
      visualFlip:visual.flip
    };
    const behaviour=baseBehaviour(source);
    const collision=baseCollision(source);
    if(name==='broken') return {label:'Broken',layout,behaviour,collision,components:{rearWheel:true,frontWheel:false}};
    if(name==='landed') {
      const points=[{x:-1,y:.59},{x:1,y:.59},{x:1,y:.72},{x:-1,y:.72}];
      return {
        label:'Landed / Bridge',
        layout:{...layout,visualOffsetX:0,visualOffsetY:0,visualRotationDeg:0},
        behaviour:{...emptyBehaviour,solid:true,supportSurface:true,pushable:false},
        collision:{halfWidthRatio:.49,heightRatio:1,fixedHeight:null,depthRatio:.18,points:points.map(p=>({...p})),shapes:[{points:points.map(p=>({...p}))}],autoGenerated:false},
        components:{rearWheel:true,frontWheel:true}
      };
    }
    return {label:'Repaired / Pushable',layout,behaviour,collision,components:{rearWheel:true,frontWheel:true}};
  }

  function ensureCartStates() {
    const bucket=ensureStateBucket('handcart');
    let changed=false;
    for(const name of ['broken','repaired','landed']){
      if(!bucket.states[name]){ bucket.states[name]=cartDefaultStateDefinition(name); changed=true; }
    }
    if(changed) try{ localStorage.setItem(STATE_KEY,JSON.stringify(assetStateStore)); }catch(_){}
  }

  function currentStateSnapshot(label='New State') {
    const visual=effectiveVisual();
    const profile=stateProfile();
    const components=profile?.components ? clone(profile.components) : (canonicalStateAssetName()==='handcart' ? {rearWheel:true,frontWheel:true} : undefined);
    return {
      label,
      layout:{defaultHeight:effectiveHeight(),groundLine:effectiveGroundLine(),visualOffsetX:visual.x,visualOffsetY:visual.y,visualRotationDeg:visual.deg,visualFlip:visual.flip},
      behaviour:Object.fromEntries(behaviourKeys.map(k=>[k,!!effectiveBehaviour()[k]])),
      collision:clone(effectiveCollision()),
      ...(components?{components}:{})
    };
  }

  function stateSlug(label) {
    const base=String(label||'state').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'state';
    const bucket=ensureStateBucket();
    let key=base,n=2;
    while(bucket.states[key]) key=`${base}-${n++}`;
    return key;
  }

  function syncStateControls() {
    if(!stateSelect) return;
    const bucket=ensureStateBucket();
    const names=['base',...Object.keys(bucket.states)];
    if(!names.includes(state.assetState)) state.assetState=defaultStateForAsset(state.asset);
    if(!names.includes(state.assetState)) state.assetState='base';
    stateSelect.innerHTML=names.map(name=>`<option value="${name}">${stateLabel(name)}</option>`).join('');
    stateSelect.value=state.assetState;
    const protectedState=canonicalStateAssetName()==='handcart' && ['broken','repaired','landed'].includes(state.assetState);
    stateRenameBtn.disabled=state.assetState==='base'||protectedState;
    stateDeleteBtn.disabled=state.assetState==='base'||protectedState;
    if(cartComponents){
      const isCart=canonicalStateAssetName()==='handcart' && state.assetState!=='base';
      cartComponents.hidden=!isCart;
      if(isCart){
        const profile=stateProfile();
        profile.components ||= {rearWheel:true,frontWheel:true};
        for(const [btn,key,label] of [[cartRearWheelBtn,'rearWheel','Rear Wheel'],[cartFrontWheelBtn,'frontWheel','Front Wheel']]){
          const on=profile.components[key]!==false;
          btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));btn.textContent=`${label} · ${on?'ON':'OFF'}`;
        }
      }
    }
  }

  function changeAssetState(name) {
    state.assetState=name;
    state.draggingHandle=-1;state.draggingEdge=null;state.selectedPoint=-1;state.selectedEdge=-1;state.selectedShape=0;state.selectedClimbPath=0;state.draggingClimbHandle=null;
    syncControls();buildList();
  }

  function buildList() {
    listEl.innerHTML='';
    let group='';
    for (const asset of ASSETS.filter(a=>assetMatchesFilter(a))) {
      if (asset.group!==group) {
        group=asset.group;
        const h=document.createElement('div');h.className='assetlab-group-label';h.textContent=group;listEl.appendChild(h);
      }
      const row=document.createElement('button');row.type='button';row.className='assetlab-asset-row';row.classList.toggle('active',asset.name===state.asset.name);row.dataset.asset=asset.name;
      const preview=ensureImage(asset);
      const previewSrc=preview?.src || (asset.imported ? '' : assetPath(asset.image || ''));
      row.innerHTML=`<img src="${escapeHtml(previewSrc)}" alt=""><span><strong>${escapeHtml(asset.label)}</strong><small>${asset.imported?'IMPORTED · ':''}${effectiveBehaviour(asset).pushable?'PUSH · ':''}${effectiveBehaviour(asset).climbable?'CLIMB · ':''}${effectiveBehaviour(asset).supportSurface?'SUPPORT · ':''}${effectiveCollision(asset)?'COLLISION':'NO COLLISION'}</small></span>`;
      row.addEventListener('click',()=>selectAsset(asset,{keepView:state.pairMode&&isBridge(asset)}));
      listEl.appendChild(row);
    }
  }

  function updatePairUI() {
    const bridge=isBridge(state.asset);
    pairBtn.hidden=!bridge;
    if(!bridge) state.pairMode=false;
    pairBtn.classList.toggle('active',state.pairMode);
    pairBtn.setAttribute('aria-pressed',String(state.pairMode));
    pairBtn.textContent=state.pairMode?'Single Piece':'Bridge Pair';
    currentNameEl.textContent=`${state.asset.label}${state.pairMode?' · Pair':''} · ${stateLabel(state.assetState)}`;
    stageHelpEl.textContent=state.pairMode
      ? 'Bridge Pair view. Click either piece to edit it. Drag empty space to pan; drag orange points or edge handles. Cyan is Y = 0.'
      : 'Drag empty space to pan. Drag orange points or edge handles. The cyan line is ground level (Y = 0).';
  }

  function selectAsset(asset,{keepView=false}={}) {
    state.asset=asset;
    state.assetState=defaultStateForAsset(asset);
    state.draggingHandle=-1;
    state.draggingEdge=null;
    state.selectedPoint=-1;
    state.selectedEdge=-1;
    state.selectedShape=0;
    state.selectedClimbPath=0;
    state.draggingClimbHandle=null;
    if(!keepView){ state.panX=0; state.panY=0; state.viewScale=1; }
    ensureImage(asset);
    if(state.pairMode&&isBridge(asset)) BRIDGE_NAMES.forEach(name=>ensureImage(assetByName(name)));
    updatePairUI();
    syncControls();
    buildList();
    syncImportedSection();
    syncEffectSection();
    syncInteractions();
  }

  // --- Interactions: what the player can do to this asset (asset-interactions.js) ---
  const Interactions = window.SideScrollInteractions;
  const $ = id => document.getElementById(id);
  const inspectOnBtn = $('assetlab-inspect-on'), inspectFields = $('assetlab-inspect-fields');
  const inspectTitleEl = $('assetlab-inspect-title'), inspectTextEl = $('assetlab-inspect-text');
  const inspectLargeBtn = $('assetlab-inspect-large'), inspectFlagEl = $('assetlab-inspect-flag');
  const collectOnBtn = $('assetlab-collect-on'), collectFields = $('assetlab-collect-fields');
  const collectLabelEl = $('assetlab-collect-label'), collectDescEl = $('assetlab-collect-description'), collectFlagEl = $('assetlab-collect-flag');
  const wearOnBtn = $('assetlab-wear-on'), wearFields = $('assetlab-wear-fields'), wearHoldsBtn = $('assetlab-wear-holds');
  const wearRefuseEl = $('assetlab-wear-refuse'), wearRefuseRow = $('assetlab-wear-refuse-row'), wearFlagEl = $('assetlab-wear-flag');
  const pressed = (btn, on) => { btn.classList.toggle('active', !!on); btn.setAttribute('aria-pressed', String(!!on)); };
  const fill = (el, v) => { if (document.activeElement !== el) el.value = v || ''; };
  function syncInteractions() {
    const section = $('assetlab-interactions-section');
    const asset = state.asset;
    const usable = !!(Interactions && asset && asset.art?.kind !== 'effect');
    if (section) section.hidden = !usable;
    if (!usable) return;
    const entry = Interactions.get(asset.name) || {}, inspect = entry.inspect || null, collect = entry.collect || null;
    pressed(inspectOnBtn, inspect); inspectFields.hidden = !inspect;
    inspectTitleEl.placeholder = asset.label || asset.name;
    fill(inspectTitleEl, inspect?.title); fill(inspectTextEl, inspect?.text); fill(inspectFlagEl, inspect?.flag);
    pressed(inspectLargeBtn, inspect?.large);
    pressed(collectOnBtn, collect); collectFields.hidden = !collect;
    collectLabelEl.placeholder = asset.label || asset.name;
    fill(collectLabelEl, collect?.label); fill(collectDescEl, collect?.description); fill(collectFlagEl, collect?.flag);
    const wear = entry.wear || null;
    pressed(wearOnBtn, wear); wearFields.hidden = !wear;
    pressed(wearHoldsBtn, wear?.holdsInventory); wearRefuseRow.hidden = !wear?.holdsInventory;
    fill(wearRefuseEl, wear?.refuse); fill(wearFlagEl, wear?.flag);
  }
  // patch null = turn the action off; otherwise merge into it (turning it on).
  function saveAction(action, patch) {
    const asset = state.asset;
    if (!Interactions || !asset) return;
    const entry = Interactions.get(asset.name) || {};
    if (patch === null) delete entry[action];
    else entry[action] = { ...(entry[action] || {}), ...patch };
    writeStore(Interactions.KEY, Interactions.set(asset.name, entry));
    syncInteractions();
  }
  const current = action => Interactions?.get(state.asset?.name)?.[action] || null;
  if (Interactions && inspectOnBtn) {
    inspectOnBtn.addEventListener('click', () => saveAction('inspect', current('inspect') ? null : {}));
    inspectLargeBtn.addEventListener('click', () => saveAction('inspect', { large: !current('inspect')?.large }));
    inspectTitleEl.addEventListener('input', () => saveAction('inspect', { title: inspectTitleEl.value }));
    inspectTextEl.addEventListener('input', () => saveAction('inspect', { text: inspectTextEl.value }));
    inspectFlagEl.addEventListener('change', () => { saveAction('inspect', { flag: inspectFlagEl.value }); fill(inspectFlagEl, current('inspect')?.flag); inspectFlagEl.value = current('inspect')?.flag || ''; });
    collectOnBtn.addEventListener('click', () => saveAction('collect', current('collect') ? null : {}));
    collectLabelEl.addEventListener('input', () => saveAction('collect', { label: collectLabelEl.value }));
    collectDescEl.addEventListener('input', () => saveAction('collect', { description: collectDescEl.value }));
    collectFlagEl.addEventListener('change', () => { saveAction('collect', { flag: collectFlagEl.value }); collectFlagEl.value = current('collect')?.flag || ''; });
    wearOnBtn.addEventListener('click', () => saveAction('wear', current('wear') ? null : {}));
    wearHoldsBtn.addEventListener('click', () => saveAction('wear', { holdsInventory: !current('wear')?.holdsInventory }));
    wearRefuseEl.addEventListener('input', () => saveAction('wear', { refuse: wearRefuseEl.value }));
    wearFlagEl.addEventListener('change', () => { saveAction('wear', { flag: wearFlagEl.value }); wearFlagEl.value = current('wear')?.flag || ''; });
  }

  // --- Texture: the image's size, file size and how dense it is in the game ------
  const textureFactsEl = document.getElementById('assetlab-texture-facts');
  const fileBytes = new Map();
  function syncTextureFacts() {
    if (!textureFactsEl) return;
    const asset = state.asset;
    const entry = asset?.imported && Lib ? Lib.get(asset.name) : null;
    const img = imageCache.get(asset?.name);
    const rows = [];
    const add = (term, value) => rows.push([term, value]);
    if (entry?.art.kind === 'effect') {
      add('Image', 'Shader effect (no image file)');
      const metres = effectiveHeight(), aspect = entry.art.width / entry.art.height;
      add('In the game', `${(metres * aspect).toFixed(2)} m wide × ${metres.toFixed(2)} m tall`);
      add('Drawn at', `${Math.round(384 * aspect)} × 384 px, every frame while on screen`);
      add('Memory', `about ${((Math.round(384 * aspect) * 384 * 4) / 1048576).toFixed(1)} MB per placed copy`);
    } else if (asset?.procedural) {
      add('Image', 'Drawn by the game (no image file)');
    } else {
      const file = entry ? (entry.art.kind === 'bundled' ? entry.art.file : entry.art.name || 'imported PNG') : asset?.image || '';
      add('File', file || '—');
      const w = img?.naturalWidth || entry?.art.width || 0, h = img?.naturalHeight || entry?.art.height || 0;
      if (w && h) {
        add('Pixels', `${w} × ${h} px · ${((w * h) / 1e6).toFixed(2)} MP`);
        add('Aspect', `${(w / h).toFixed(3)} (width ÷ height)`);
        const metres = effectiveHeight();
        add('In the game', `${(metres * w / h).toFixed(2)} m wide × ${metres.toFixed(2)} m tall`);
        add('Density', `${Math.round(h / metres)} px per metre at this height`);
        add('Memory', `about ${((w * h * 4) / 1048576).toFixed(1)} MB once loaded`);
      } else add('Pixels', 'loading…');
      let bytes = entry?.art.bytes ?? fileBytes.get(asset?.name);
      if (bytes == null && asset?.image && !fileBytes.has(asset.name)) {
        fileBytes.set(asset.name, undefined);
        fetch(assetPath(`${asset.image}?v=${VERSION}`)).then(r => r.ok ? r.blob() : null).then(blob => {
          if (blob) { fileBytes.set(asset.name, blob.size); if (state.asset === asset) syncTextureFacts(); }
        }).catch(() => {});
      }
      if (bytes != null) add('File size', bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
      add('Source', entry ? (entry.art.kind === 'bundled' ? 'Imported · published with the game' : 'Imported · on this device only') : 'Built in');
    }
    textureFactsEl.replaceChildren(...rows.flatMap(([term, value]) => [
      Object.assign(document.createElement('dt'), { textContent:term }),
      Object.assign(document.createElement('dd'), { textContent:value })
    ]));
  }

  // --- Imported assets: + Import asset, details, Replace Art, Delete -------------
  const importBtn = document.getElementById('assetlab-import');
  const importFile = document.getElementById('assetlab-import-file');
  const importedSection = document.getElementById('assetlab-imported-section');
  const importedName = document.getElementById('assetlab-imported-name');
  const importedScope = document.getElementById('assetlab-imported-scope');
  const importedGroup = document.getElementById('assetlab-imported-group');
  const importedGroups = document.getElementById('assetlab-imported-groups');
  const importedCategory = document.getElementById('assetlab-imported-category');
  const importedInfo = document.getElementById('assetlab-imported-info');
  const importedReplace = document.getElementById('assetlab-imported-replace');
  const importedReplaceFile = document.getElementById('assetlab-imported-replace-file');
  const importedDelete = document.getElementById('assetlab-imported-delete');

  function syncImportedSection() {
    const entry = state.asset?.imported && Lib ? Lib.get(state.asset.name) : null;
    importedSection.hidden = !entry;
    if (!entry) return;
    if (document.activeElement !== importedName) importedName.value = entry.label;
    if (document.activeElement !== importedGroup) importedGroup.value = entry.group;
    importedScope.value = entry.scope;
    importedCategory.value = entry.category;
    const groups = [...new Set(Lib.list().map(e => e.group))].sort();
    importedGroups.replaceChildren(...groups.map(g => Object.assign(document.createElement('option'), { value:g })));
    const art = entry.art;
    const where = art.kind === 'bundled' ? 'published with the game' : 'on this device · Publish Lab → Assets publishes it';
    importedInfo.textContent = `${art.width} × ${art.height} px · ${Math.max(1, Math.round(art.bytes / 1024))} KB · ${where}`
      + (state.asset.artMissing ? ' · ⚠ its artwork is not on this device (it was imported on another one)' : '');
  }

  function showImported(name) {
    const keep = state.panX || state.panY || state.viewScale !== 1;
    syncImportedAssets();
    const asset = assetByName(name) || ASSETS.find(a => a.imported) || ASSETS[0];
    renderFilterOptions();
    if (asset.imported && !assetMatchesFilter(asset)) { state.filter = 'all'; if (filterSelect) filterSelect.value = 'all'; }
    selectAsset(asset, { keepView:keep && asset.name === state.asset?.name });
    listEl.querySelector(`[data-asset="${asset.name}"]`)?.scrollIntoView({ block:'nearest' });
  }

  const prettyName = file => String(file || 'New asset').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^./, c => c.toUpperCase()) || 'New asset';

  async function readPickedArt(file) {
    const info = await Lib.inspectFile(file);
    if (!info.transparent && !confirm('This PNG has no transparent pixels, so it will show as a solid rectangle in the game. Use it anyway?')) return null;
    const id = await Lib.putArt(file);
    return { kind:'indexeddb', id, width:info.width, height:info.height, bytes:info.bytes, name:info.name };
  }

  importBtn?.addEventListener('click', () => { if (Lib) importFile.click(); });
  importFile?.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    importFile.value = '';
    if (!file) return;
    try {
      const art = await readPickedArt(file);
      if (!art) return;
      const current = state.asset?.imported ? Lib.get(state.asset.name) : null;
      const entry = Lib.add({
        label:prettyName(file.name), group:current?.group || 'IMPORTED',
        scope:state.filter === 'puzzle' ? 'puzzle' : (current?.scope || 'environment'),
        category:current?.category || 'dressing', height:1, groundLine:0, art
      });
      showImported(entry.name);
      saveStateEl.textContent = 'Imported';
      importedSection.scrollIntoView({ block:'start', behavior:'smooth' });
      importedName.focus();
      importedName.select();
    } catch (error) { alert(error?.message || 'That file could not be imported.'); }
  });

  importedName?.addEventListener('input', () => {
    const label = importedName.value.trim();
    if (!label || !state.asset?.imported) return;
    Lib.update(state.asset.name, { label });
    state.asset.label = label;
    updatePairUI();
    const row = listEl.querySelector(`[data-asset="${state.asset.name}"] strong`);
    if (row) row.textContent = label;
    saveStateEl.textContent = 'Saved';
  });
  importedName?.addEventListener('change', () => { if (!importedName.value.trim()) syncImportedSection(); });
  for (const [input, field] of [[importedScope, 'scope'], [importedGroup, 'group'], [importedCategory, 'category']]) {
    input?.addEventListener('change', () => {
      if (!state.asset?.imported) return;
      const value = input.value.trim();
      if (!value) { syncImportedSection(); return; }
      Lib.update(state.asset.name, { [field]:value });
      saveStateEl.textContent = 'Saved';
      showImported(state.asset.name);
    });
  }

  importedReplace?.addEventListener('click', () => importedReplaceFile.click());
  importedReplaceFile?.addEventListener('change', async () => {
    const file = importedReplaceFile.files?.[0];
    importedReplaceFile.value = '';
    const entry = state.asset?.imported ? Lib.get(state.asset.name) : null;
    if (!file || !entry) return;
    try {
      const art = await readPickedArt(file);
      if (!art) return;
      Lib.update(entry.name, { art });
      if (entry.art.kind === 'indexeddb') Lib.deleteArt(entry.art.id).catch(() => {});
      imageCache.delete(entry.name);
      // A different shape: placed copies keep their height and take the new width.
      const factor = (art.width / art.height) / (entry.art.width / entry.art.height);
      const resized = Lib.rescalePlaced(entry.name, factor);
      saveStateEl.textContent = resized ? `Art replaced · ${resized} placed cop${resized === 1 ? 'y' : 'ies'} reshaped` : 'Art replaced';
      showImported(entry.name);
    } catch (error) { alert(error?.message || 'That file could not be used.'); }
  });

  const USE_PLACES = [[/scene|environment|world-group/, 'the game scene or a world group'], [/puzzle/, 'a puzzle'], [/story|sequence/, 'a sequence']];
  importedDelete?.addEventListener('click', () => {
    const entry = state.asset?.imported ? Lib.get(state.asset.name) : null;
    if (!entry) return;
    const used = Lib.usedIn(entry.name);
    if (used.length) {
      const places = [...new Set(used.map(key => USE_PLACES.find(([re]) => re.test(key))?.[1] || key))];
      alert(`“${entry.label}” is placed in ${places.join(', ')}. Remove its placed copies first, then delete it.`);
      return;
    }
    if (!confirm(`Delete “${entry.label}”? Its artwork and its setup (height, collision, behaviour) are removed from this device.`)) return;
    Lib.remove(entry.name);
    Lib.removeSetup(entry.name);
    for (const store of [behaviourStore, collisionStore, layoutStore, mechanismStore, socketStore, assetStateStore, climbPathStore]) delete store[entry.name];
    if (entry.art.kind === 'indexeddb') Lib.deleteArt(entry.art.id).catch(() => {});
    imageCache.delete(entry.name);
    saveStateEl.textContent = 'Deleted';
    showImported(null);
  });
  if (!Lib && importBtn) importBtn.hidden = true;

  // --- Shader effects: + New effect, settings, live preview -------------------------
  const Effects = window.SideScrollEffects || null;
  // ---- Character effects: preview on a real character (character-preview.js) ----
  // A drawn character (posed, animated, holding one of its props) stands in for
  // the sample picture. Preview only; remembered for this session.
  const CharPreview = window.SideScrollCharacterPreview || null;
  const PREVIEW_KEY = 'sidescroll.assetlab.effect-preview'; // sessionStorage {character, prop, pose}
  const previewEl = document.getElementById('assetlab-effect-preview');
  const previewChar = document.getElementById('assetlab-effect-preview-character');
  const previewProp = document.getElementById('assetlab-effect-preview-prop');
  const previewPose = document.getElementById('assetlab-effect-preview-pose');
  const previewNote = document.getElementById('assetlab-effect-preview-note');
  // character: '' until chosen (then the first character), 'sample' = the picture.
  const preview = (() => { try { return { character:'', prop:'', pose:'idle', ...JSON.parse(sessionStorage.getItem(PREVIEW_KEY) || '{}') }; } catch (_) { return { character:'', prop:'', pose:'idle' }; } })();
  let previewDrawer = null, previewSig = '';
  const savePreview = () => { try { sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(preview)); } catch (_) {} };
  function syncPreviewControls() {
    const entry = currentEffect();
    const show = !!(entry && CharPreview && Effects?.isCharacterEffect(entry.art));
    if (previewEl) previewEl.hidden = !show;
    if (!show) return;
    const chars = CharPreview.characters();
    if (preview.character !== 'sample' && !chars.some(c => c.id === preview.character)) preview.character = chars[0]?.id || 'sample';
    const real = preview.character !== 'sample';
    const holds = real ? CharPreview.holdsOf(preview.character) : [];
    const anims = real ? CharPreview.animations(preview.character) : [];
    const sig = JSON.stringify([chars, holds, anims.map(a => a.key)]);
    if (sig !== previewSig) {
      previewSig = sig;
      previewChar.replaceChildren(...chars.map(c => new Option(c.name, c.id)), new Option('Sample picture (not to scale)', 'sample'));
      previewProp.replaceChildren(new Option(holds.length ? 'Nothing' : 'Nothing (no props set up)', ''), ...holds.map(n => new Option(CharPreview.propLabel(n), n)));
      previewPose.replaceChildren(new Option('Standing still', ''), ...anims.map(a => new Option(a.name, a.key)));
    }
    previewChar.value = preview.character;
    previewProp.value = holds.includes(preview.prop) ? preview.prop : '';
    previewPose.value = anims.some(a => a.key === preview.pose) ? preview.pose : '';
    previewProp.disabled = !real || !holds.length;
    previewPose.disabled = !real;
    const reason = real ? CharPreview.reasonOf(preview.character) : null;
    previewNote.textContent = reason ? `This character can’t be drawn here: ${reason}`
      : real && !holds.length && window.SideScrollProps?.FAMILIES?.[window.SideScrollCharacters?.find?.(preview.character)?.family]
      ? 'Shown at its game size. Props: give it a grip in Character Lab → Props (and Save) to see it holding one here.'
      : real ? 'Shown at its game size beside the player reference. Only the preview: the effect works on any character in the game.'
      : 'The sample picture is not to scale.';
  }
  previewChar?.addEventListener('change', () => { preview.character = previewChar.value; preview.prop = ''; savePreview(); syncPreviewControls(); });
  previewProp?.addEventListener('change', () => { preview.prop = previewProp.value; savePreview(); });
  previewPose?.addEventListener('change', () => { preview.pose = previewPose.value; savePreview(); });
  // The drawn character for this frame, or null (sample picture).
  function previewSample(art, time) {
    const sample = drawPreviewCharacter(art, time);
    const entry = currentEffect();
    effectPreviewSize = sample && entry ? { name:entry.name, metres:sample.metres, aspect:sample.aspect, ground:sample.ground } : null;
    return sample;
  }
  function drawPreviewCharacter(art, time) {
    if (!preview.character || preview.character === 'sample' || !CharPreview || !Effects?.isCharacterEffect(art)) return null;
    const r = Effects.canvasRenderer();
    if (!r?.gl) return null;
    try {
      previewDrawer ||= CharPreview.create(r.gl);
      const sample = previewDrawer.render(preview.character, { animation:preview.pose, phase:(time / 1.1) % 1, prop:previewProp.value || '' });
      if (!sample) setTimeout(syncPreviewControls, 300); // still loading: its props / animations arrive with it
      return sample;
    } catch (err) { console.error('[Asset Lab] Character preview failed.', err); return null; }
  }
  const newEffectBtn = document.getElementById('assetlab-new-effect');
  const effectSection = document.getElementById('assetlab-effect-section');
  const effectControls = document.getElementById('assetlab-effect-controls');
  const rgbHex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const currentEffect = () => (state.asset?.imported && Lib?.isEffect(Lib.get(state.asset.name)) ? Lib.get(state.asset.name) : null);
  let effectControlsFor = null;
  function syncEffectSection() {
    const entry = currentEffect();
    if (effectSection) effectSection.hidden = !entry;
    if (importedReplace) importedReplace.hidden = !!entry;
    syncPreviewControls();
    if (!entry || !Effects) { effectControlsFor = null; return; }
    renderEffectStates();
    if (effectControlsFor === entry.name) return;
    effectControlsFor = entry.name;
    const def = Effects.SHADERS[entry.art.shader] || Effects.SHADERS.darkness;
    document.getElementById('assetlab-effect-title').textContent = def.label;
    const params = Effects.clean(entry.art.shader, entry.art.params);
    const save = patch => {
      const fresh = Lib.get(entry.name);
      Lib.update(entry.name, { art:{ ...fresh.art, params:{ ...Effects.clean(fresh.art.shader, fresh.art.params), ...patch } } });
      saveStateEl.textContent = 'Saved';
    };
    const rows = [];
    // Shape: the plane's width ÷ height (placed copies keep their height, take the new width).
    const shape = document.createElement('label'); shape.className = 'assetlab-range-row';
    const shapeVal = document.createElement('small'); shapeVal.textContent = (entry.art.width / entry.art.height).toFixed(2);
    const shapeIn = Object.assign(document.createElement('input'), { type:'range', min:'0.2', max:'2', step:'0.01', value:String(entry.art.width / entry.art.height) });
    shape.append(Object.assign(document.createElement('span'), { innerHTML:'<strong>Shape</strong>' }), shapeIn);
    shape.querySelector('span').append(shapeVal);
    let shapeStart = null;
    shapeIn.addEventListener('pointerdown', () => { shapeStart = Lib.get(entry.name).art.width / Lib.get(entry.name).art.height; });
    shapeIn.addEventListener('input', () => {
      const a = Number(shapeIn.value); shapeVal.textContent = a.toFixed(2);
      const fresh = Lib.get(entry.name);
      if (shapeStart == null) shapeStart = fresh.art.width / fresh.art.height;
      Lib.update(entry.name, { art:{ ...fresh.art, width:Math.round(1000 * a), height:1000 } });
      resize(); renderPointEditor(); syncTextureFacts();
    });
    shapeIn.addEventListener('change', () => {
      if (shapeStart != null) Lib.rescalePlaced(entry.name, Number(shapeIn.value) / shapeStart);
      shapeStart = null; saveStateEl.textContent = 'Saved';
    });
    // A character effect takes the character's shape: no Shape control.
    if (def.target !== 'character') rows.push(shape);
    else rows.push(Object.assign(document.createElement('p'), { className:'assetlab-note', textContent:'Previewed on a sample character. In the game it draws on whichever character an Effect step puts it on; Dissolve 0 = whole, 1 = gone.' }));
    for (const p of def.params) {
      const row = document.createElement('label'); row.className = 'assetlab-range-row';
      const head = document.createElement('span'); const name = document.createElement('strong'); name.textContent = p.label;
      const val = document.createElement('small'); head.append(name, val);
      let input;
      if (p.type === 'color') {
        input = Object.assign(document.createElement('input'), { type:'color', value:rgbHex(params[p.key]) });
        input.addEventListener('input', () => save({ [p.key]:hexRgb(input.value) }));
      } else {
        input = Object.assign(document.createElement('input'), { type:'range', min:String(p.min), max:String(p.max), step:String(p.step), value:String(params[p.key]) });
        const show = () => { val.textContent = Number(input.value).toFixed(p.step < 0.01 ? 3 : 2); };
        show();
        input.addEventListener('input', () => { show(); save({ [p.key]:Number(input.value) }); });
      }
      row.append(head, input);
      rows.push(row);
    }
    effectControls.replaceChildren(...rows);
  }
  // Effect states: named copies of the settings a Darkness step blends between.
  let effectStateSel = null;
  const effectStatesEl = document.getElementById('assetlab-effect-states');
  function renderEffectStates() {
    const entry = currentEffect();
    if (!effectStatesEl || !entry) return;
    const states = entry.art.states || [];
    if (effectStateSel && !states.some(st => st.id === effectStateSel)) effectStateSel = null;
    effectStatesEl.replaceChildren(...(states.length ? states.map(st => {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'assetlab-effect-state' + (st.id === effectStateSel ? ' active' : '');
      b.textContent = st.name;
      b.addEventListener('click', () => {
        effectStateSel = st.id;
        const fresh = Lib.get(entry.name);
        Lib.update(entry.name, { art:{ ...fresh.art, params:Effects.clean(fresh.art.shader, st.params) } });
        effectControlsFor = null; syncEffectSection();
        saveStateEl.textContent = `Showing ${st.name}`;
      });
      return b;
    }) : [Object.assign(document.createElement('small'), { className:'assetlab-note', textContent:'No states yet.' })]));
    for (const id of ['assetlab-effect-state-update', 'assetlab-effect-state-rename', 'assetlab-effect-state-delete'])
      document.getElementById(id).disabled = !effectStateSel;
  }
  const newStateId = () => `st-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.slice(0, 23);
  const editStates = fn => { const fresh = currentEffect(); if (!fresh) return; const states = fn([...(fresh.art.states || [])], fresh); Lib.update(fresh.name, { art:{ ...fresh.art, states } }); renderEffectStates(); saveStateEl.textContent = 'Saved'; };
  document.getElementById('assetlab-effect-state-save')?.addEventListener('click', () => {
    const entry = currentEffect(); if (!entry) return;
    const name = (prompt('Name this state (e.g. Grab, Cover, Dust)', `State ${(entry.art.states || []).length + 1}`) || '').trim();
    if (!name) return;
    const id = newStateId();
    editStates((states, fresh) => [...states, { id, name, params:Effects.clean(fresh.art.shader, fresh.art.params) }]);
    effectStateSel = id; renderEffectStates();
  });
  document.getElementById('assetlab-effect-state-update')?.addEventListener('click', () =>
    editStates((states, fresh) => states.map(st => st.id === effectStateSel ? { ...st, params:Effects.clean(fresh.art.shader, fresh.art.params) } : st)));
  document.getElementById('assetlab-effect-state-rename')?.addEventListener('click', () => {
    const st = (currentEffect()?.art.states || []).find(x => x.id === effectStateSel); if (!st) return;
    const name = (prompt('Rename this state', st.name) || '').trim();
    if (name) editStates(states => states.map(x => x.id === st.id ? { ...x, name } : x));
  });
  document.getElementById('assetlab-effect-state-delete')?.addEventListener('click', () => {
    const st = (currentEffect()?.art.states || []).find(x => x.id === effectStateSel); if (!st) return;
    if (!confirm(`Delete the state “${st.name}”? Darkness steps that use it will treat it as the effect's current settings.`)) return;
    editStates(states => states.filter(x => x.id !== st.id)); effectStateSel = null; renderEffectStates();
  });

  document.getElementById('assetlab-effect-reset')?.addEventListener('click', () => {
    const entry = currentEffect();
    if (!entry || !confirm('Put every setting of this effect back to its default?')) return;
    Lib.update(entry.name, { art:{ ...entry.art, params:Effects.defaults(entry.art.shader) } });
    effectControlsFor = null; syncEffectSection();
  });
  function newEffect(shader) {
    if (!Lib || !Effects) return;
    const character = Effects.SHADERS[shader]?.target === 'character';
    const entry = Lib.add({
      label:character ? 'Dissolve' : 'Darkness whirlwind', group:character ? 'CHARACTER EFFECTS' : 'EFFECTS',
      scope:state.filter === 'puzzle' ? 'puzzle' : 'environment', category:'dressing',
      height:3, groundLine:0, art:{ kind:'effect', shader, width:character ? 1000 : 600, height:1000, params:Effects.defaults(shader) }
    });
    showImported(entry.name);
    saveStateEl.textContent = 'Effect created';
    importedSection.scrollIntoView({ block:'start', behavior:'smooth' });
    importedName.focus(); importedName.select();
  }
  newEffectBtn?.addEventListener('click', () => newEffect('darkness'));
  document.getElementById('assetlab-new-dissolve')?.addEventListener('click', () => newEffect('dissolve'));
  if (!Effects && newEffectBtn) newEffectBtn.hidden = true;
  effectPreviewSample = previewSample;
  // The selected effect plays live on the stage.
  function tickEffects() {
    const entry = currentEffect();
    if (entry && !document.hidden) {
      const art = Lib.get(entry.name).art, time = performance.now() / 1000;
      Effects?.canvasRenderer()?.render(art, time, previewSample(art, time)); draw();
    }
    requestAnimationFrame(tickEffects);
  }
  requestAnimationFrame(tickEffects);

  function syncControls() {
    syncTextureFacts();
    const h=effectiveHeight();
    const floor=effectiveGroundLine();
    const visual=effectiveVisual();
    heightInput.value=String(h); heightValue.textContent=`${h.toFixed(2)} m`;
    floorInput.value=String(Math.round(floor*100)); floorValue.textContent=`${Math.round(floor*100)}%`;
    if(rotationInput) rotationInput.value=String(visual.deg);
    if(rotationValue) rotationValue.textContent=`${visual.deg.toFixed(1).replace('.0','')}°`;
    if(flipBtn){
      flipBtn.classList.toggle('active',!!visual.flip);
      flipBtn.setAttribute('aria-pressed',String(!!visual.flip));
      flipBtn.textContent=visual.flip?'Flipped Horizontally':'Flip Horizontally';
    }
    syncStateControls();
    const collision=effectiveCollision();
    const profile=stateProfile();
    const explicitCollision = profile ? Object.prototype.hasOwnProperty.call(profile,'collision') : Object.prototype.hasOwnProperty.call(collisionStore,state.asset.name);
    const explicitlyRemoved = explicitCollision && (profile ? profile.collision === null : collisionStore[state.asset.name] === null);
    collisionToggle.textContent=explicitlyRemoved ? 'Use Auto Collision' : (collision ? (hasCustomCollision()?'Use Auto Collision':'Customise Collision') : 'Add Collision');
    collisionToggle.classList.toggle('active',!!collision);
    if(collisionRemove) collisionRemove.disabled=!collision;
    collisionReset.disabled=!collision;
    depthRow.hidden=!collision;
    pointEditor.hidden=!collision;
    if(collision){
      const width=assetWorldWidth();
      const depth=Math.max(.15,(Number(collision.depthRatio)||.25)*width);
      depthInput.value=String(clamp(depth,.15,2.5)); depthValue.textContent=`${depth.toFixed(2)} m`;
    }
    renderPointEditor();
    renderClimbControls();
    renderBehaviours();
    syncMechanismControls();
    syncSocketControls();
    if (brokenCartSection) {
      const broken = canonicalStateAssetName()==='handcart' && state.assetState==='broken';
      brokenCartSection.hidden = !broken;
      if (broken) {
        brokenOffsetXInput.value = String(visual.x);
        brokenOffsetYInput.value = String(visual.y);
        brokenOffsetXValue.textContent = `${visual.x.toFixed(2)} m`;
        brokenOffsetYValue.textContent = `${visual.y.toFixed(2)} m`;
      }
    }
    updatePairUI();
    draw();
  }

  function syncMechanismControls() {
    if (!counterweightSection) return;
    const mech = effectiveMechanism();
    counterweightSection.hidden = !mech;
    if (!mech) return;

    pivotXInput.value = String(Math.round(mech.pivotX*100));
    pivotYInput.value = String(Math.round(mech.pivotY*100));
    zoneStartInput.value = String(Math.round(mech.zoneStart*100));
    zoneEndInput.value = String(Math.round(mech.zoneEnd*100));
    zoneYInput.value = String(Math.round(mech.zoneY*100));
    zoneDepthInput.value = String(mech.zoneDepth);
    logWeightInput.value = String(mech.logWeight);
    playerWeightInput.value = String(mech.playerWeight);
    maxTipInput.value = String(mech.maxTipDeg);
    fallTipInput.value = String(mech.fallAngleDeg);

    pivotXValue.textContent = `${Math.round(mech.pivotX*100)}%`;
    pivotYValue.textContent = `${Math.round(mech.pivotY*100)}%`;
    zoneStartValue.textContent = `${Math.round(mech.zoneStart*100)}%`;
    zoneEndValue.textContent = `${Math.round(mech.zoneEnd*100)}%`;
    zoneYValue.textContent = `${Math.round(mech.zoneY*100)}%`;
    zoneDepthValue.textContent = `${mech.zoneDepth.toFixed(2)} m`;
    logWeightValue.textContent = mech.logWeight.toFixed(2);
    playerWeightValue.textContent = mech.playerWeight.toFixed(2);
    maxTipValue.textContent = `${Math.round(mech.maxTipDeg)}°`;
    fallTipValue.textContent = `${Math.round(mech.fallAngleDeg)}°`;
  }

  function climbLocalPointToWorld(asset,point) {
    const visual=effectiveVisual(asset);
    const floor=effectiveGroundLine(asset);
    const width=assetWorldWidth(asset);
    const height=effectiveHeight(asset);
    const pivotY=-floor*height+visual.y;
    let lx=(Number(point?.x)||0)*width;
    const ly=(Number(point?.y)||0)*height;
    if(visual.flip) lx=-lx;
    const a=visual.deg*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
    return {
      x:visual.x+lx*c-ly*sn,
      y:pivotY+lx*sn+ly*c
    };
  }

  function climbWorldPointToLocal(asset,x,y) {
    const visual=effectiveVisual(asset);
    const floor=effectiveGroundLine(asset);
    const width=Math.max(.001,assetWorldWidth(asset));
    const height=Math.max(.001,effectiveHeight(asset));
    const pivotY=-floor*height+visual.y;
    const dx=x-visual.x,dy=y-pivotY;
    const a=-visual.deg*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
    let lx=dx*c-dy*sn;
    const ly=dx*sn+dy*c;
    if(visual.flip) lx=-lx;
    return {x:lx/width,y:ly/height};
  }

  function climbPathWorldGeometry(asset=state.asset,path=null) {
    const chosen=path || selectedClimbPath(asset);
    if(!chosen) return null;
    const bottom=climbLocalPointToWorld(asset,chosen.bottom||{x:0,y:0});
    const top=climbLocalPointToWorld(asset,chosen.top||{x:0,y:1});
    const width=Math.max(.12,(Number(chosen.widthRatio)||.12)*assetWorldWidth(asset));
    return {bottom,top,width};
  }

  function climbPathMetrePoint(asset,point) {
    return {
      x:(Number(point?.x)||0)*assetWorldWidth(asset),
      y:(Number(point?.y)||0)*effectiveHeight(asset)
    };
  }

  function metrePointToClimbLocal(asset,x,y) {
    return {
      x:(Number(x)||0)/Math.max(.001,assetWorldWidth(asset)),
      y:(Number(y)||0)/Math.max(.001,effectiveHeight(asset))
    };
  }

  function renderClimbControls() {
    if(!climbSection) return;
    const behaviour=effectiveBehaviour();
    const paths=effectiveClimbPaths();
    const visible=!!behaviour.climbable || paths.length>0;
    climbSection.hidden=!visible;
    if(!visible) return;
    state.selectedClimbPath=clamp(state.selectedClimbPath,0,Math.max(0,paths.length-1));
    if(climbPathSelect){
      climbPathSelect.innerHTML='';
      paths.forEach((path,index)=>{
        const option=document.createElement('option');
        option.value=String(index);
        option.textContent=`Path ${index+1}${path?.id?` · ${path.id}`:''}`;
        climbPathSelect.appendChild(option);
      });
      if(paths.length) climbPathSelect.value=String(state.selectedClimbPath);
      climbPathSelect.disabled=!paths.length;
    }
    if(climbPathDeleteBtn) climbPathDeleteBtn.disabled=!paths.length;
    const path=paths[state.selectedClimbPath]||null;
    const controls=[climbWidthInput,climbBottomXInput,climbBottomYInput,climbTopXInput,climbTopYInput];
    controls.forEach(control=>{if(control)control.disabled=!path;});
    if(!path){
      if(climbWidthValue) climbWidthValue.textContent='—';
      return;
    }
    const width=Math.max(.12,(Number(path.widthRatio)||.12)*assetWorldWidth());
    if(climbWidthInput) climbWidthInput.value=String(clamp(width,.20,2.50));
    if(climbWidthValue) climbWidthValue.textContent=`${width.toFixed(2)} m`;
    const bottom=climbPathMetrePoint(state.asset,path.bottom);
    const top=climbPathMetrePoint(state.asset,path.top);
    if(climbBottomXInput && document.activeElement!==climbBottomXInput) climbBottomXInput.value=bottom.x.toFixed(2);
    if(climbBottomYInput && document.activeElement!==climbBottomYInput) climbBottomYInput.value=bottom.y.toFixed(2);
    if(climbTopXInput && document.activeElement!==climbTopXInput) climbTopXInput.value=top.x.toFixed(2);
    if(climbTopYInput && document.activeElement!==climbTopYInput) climbTopYInput.value=top.y.toFixed(2);
  }

  function addClimbPath() {
    const paths=effectiveClimbPaths();
    const path=genericClimbPath();
    path.id=`path-${paths.length+1}`;
    paths.push(path);
    writeClimbPaths(state.asset,paths);
    state.selectedClimbPath=paths.length-1;
    if(!effectiveBehaviour().climbable) setBehaviour('climbable',true);
    else { renderClimbControls(); buildList(); draw(); }
  }

  function deleteClimbPath() {
    const paths=effectiveClimbPaths();
    if(!paths.length) return;
    paths.splice(clamp(state.selectedClimbPath,0,paths.length-1),1);
    writeClimbPaths(state.asset,paths);
    state.selectedClimbPath=clamp(state.selectedClimbPath,0,Math.max(0,paths.length-1));
    renderClimbControls(); buildList(); draw();
  }

  function updateSelectedClimbPath(mutator,{persist=true}={}) {
    const paths=effectiveClimbPaths();
    if(!paths.length) return;
    const index=clamp(state.selectedClimbPath,0,paths.length-1);
    const path=clone(paths[index]);
    mutator(path);
    path.bottom ||= {x:0,y:0};
    path.top ||= {x:0,y:1};
    path.widthRatio=clamp(Number(path.widthRatio)||.12,.02,.60);
    paths[index]=path;
    writeClimbPaths(state.asset,paths,{persist});
    renderClimbControls();
    draw();
  }

  function commitClimbEndpointInput(which,axis,input) {
    const value=Number(input?.value); if(!Number.isFinite(value)) return;
    updateSelectedClimbPath(path=>{
      const current=climbPathMetrePoint(state.asset,path[which]);
      current[axis]=clamp(value,-20,20);
      path[which]=metrePointToClimbLocal(state.asset,current.x,current.y);
    });
  }

  function renderBehaviours() {
    behavioursEl.innerHTML='';
    const behaviour=effectiveBehaviour();
    const defs=[
      ['solid','Solid','Blocks the player / carried props when collision exists.'],
      ['supportSurface','Support Surface','The collision top can be walked on or support stackable props.'],
      ['carryable','Carryable','ACTION can pick the asset up.'],
      ['placeable','Placeable','A carried copy can be put back down.'],
      ['stackable','Stackable','May settle onto other support surfaces.'],
      ['pushable','Pushable','ACTION grips the object and walking into it moves the object.'],
      ['climbable','Climbable','ACTION can use authored Climb Paths. Collision is independent and optional.'],
      ['followSurfaceNormal','Follow Surface Normal','Rotate this dressing asset to match the local terrain slope. Best for grass, scrub and small rocks; leave trees and major props upright.'],
      ['socketHost','Socket Host','Can contain authored sockets.'],
      ['socketPiece','Socket Piece','Can be assigned to an authored socket.']
    ];
    for(const [key,label,desc] of defs){
      const button=document.createElement('button'); button.type='button'; button.className='assetlab-behaviour'; button.classList.toggle('active',!!behaviour[key]); button.setAttribute('aria-pressed',String(!!behaviour[key]));
      button.innerHTML=`<span><strong>${label}</strong><small>${desc}</small></span><i>${behaviour[key]?'ON':'OFF'}</i>`;
      button.addEventListener('click',()=>setBehaviour(key,!effectiveBehaviour()[key]));
      behavioursEl.appendChild(button);
    }
  }

  function setBehaviour(key,enabled) {
    const current=effectiveBehaviour();
    const next={...current,[key]:!!enabled};
    if(key==='carryable'&&enabled)next.placeable=true;
    if(key==='supportSurface'&&enabled)next.solid=true;
    if(key==='stackable'&&enabled)next.placeable=true;
    if(key==='pushable'&&enabled)next.solid=true;
    const packed=Object.fromEntries(behaviourKeys.map(k=>[k,!!next[k]]));
    const profile=stateProfile();
    if(profile){ profile.behaviour=packed; writeStateStore(); }
    else { behaviourStore[state.asset.name]=packed; writeStore(BEHAVIOUR_KEY,behaviourStore); }
    if(key==='climbable'&&enabled&&!effectiveClimbPaths().length) ensureClimbPath();
    renderClimbControls(); renderBehaviours(); buildList(); draw();
  }

  function ensureCustomCollision(asset=state.asset) {
    if(hasCustomCollision(asset)){
      const current=effectiveCollision(asset); ensureCollisionShapes(current); return current;
    }
    const current=effectiveCollision(asset);
    if(!current) return null;
    current.autoGenerated=false;
    ensureCollisionShapes(current);
    setCollisionOverride(asset,current);
    return current;
  }

  function addOrRemoveCollision() {
    const current=effectiveCollision();
    if (hasCollisionOverride()) deleteCollisionOverride();
    else {
      const next=current ? {...current,autoGenerated:false} : {halfWidthRatio:.5,heightRatio:1,fixedHeight:null,depthRatio:.25,points:defaultPoints(),autoGenerated:false};
      ensureCollisionShapes(next); setCollisionOverride(state.asset,next);
    }
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0; syncControls(); buildList();
  }
  function removeCollisionExplicitly() {
    setCollisionOverride(state.asset,null);
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0;
    syncControls(); buildList(); draw();
  }
  function fitCollisionRectangle() {
    const points=defaultPoints();
    const next={halfWidthRatio:.5,heightRatio:1,fixedHeight:effectiveBehaviour().stackable?STACK_ITEM_HEIGHT:null,depthRatio:.25,points:points.map(p=>({...p})),shapes:[{points:points.map(p=>({...p}))}],autoGenerated:false};
    setCollisionOverride(state.asset,next);
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0;
    syncControls(); buildList();
  }
  function addCollisionBox() {
    const def=ensureCustomCollision(); if(!def) return;
    const shapes=ensureCollisionShapes(def);
    const n=shapes.length;
    const xShift=clamp(((n%5)-2)*0.18,-0.45,0.45);
    const yBase=0.08+((Math.floor(n/5)%3)*0.16);
    const pts=[
      {x:clamp(xShift-.30,-1.8,1.8),y:yBase},
      {x:clamp(xShift+.30,-1.8,1.8),y:yBase},
      {x:clamp(xShift+.30,-1.8,1.8),y:yBase+.32},
      {x:clamp(xShift-.30,-1.8,1.8),y:yBase+.32}
    ];
    shapes.push({points:pts}); def.shapes=shapes; def.points=shapes[0].points.map(p=>({...p})); def.autoGenerated=false;
    setCollisionOverride(state.asset,def); state.selectedShape=shapes.length-1; state.selectedPoint=-1; state.selectedEdge=-1;
    renderPointEditor(); buildList(); draw();
  }
  function deleteCollisionBox() {
    const def=ensureCustomCollision(); if(!def) return;
    const shapes=ensureCollisionShapes(def);
    if(shapes.length<=1) return;
    shapes.splice(clamp(state.selectedShape,0,shapes.length-1),1);
    def.shapes=shapes; def.points=shapes[0].points.map(p=>({...p})); def.autoGenerated=false;
    setCollisionOverride(state.asset,def); state.selectedShape=clamp(state.selectedShape,0,shapes.length-1); state.selectedPoint=-1; state.selectedEdge=-1;
    renderPointEditor(); buildList(); draw();
  }

  function resetCurrent() {
    const profile=stateProfile();
    if(profile){
      const key=canonicalStateAssetName();
      const protectedCart=key==='handcart' && ['broken','repaired','landed'].includes(state.assetState);
      if(protectedCart){
        const replacement=cartDefaultStateDefinition(state.assetState);
        assetStateStore[key].states[state.assetState]=replacement;
      } else {
        delete assetStateStore[key].states[state.assetState];
        state.assetState='base';
      }
      writeStateStore();
    } else {
      delete behaviourStore[state.asset.name]; delete collisionStore[state.asset.name]; delete layoutStore[state.asset.name]; delete mechanismStore[state.asset.name]; delete socketStore[state.asset.name]; delete climbPathStore[state.asset.name];
      writeStore(BEHAVIOUR_KEY,behaviourStore); writeStore(COLLISION_KEY,collisionStore); writeStore(LAYOUT_KEY,layoutStore); writeStore(MECHANISM_KEY,mechanismStore); writeStore(SOCKET_KEY,socketStore); writeStore(CLIMB_PATH_KEY,climbPathStore);
    }
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0; syncControls(); buildList();
  }

  function pointToWorld(asset,point) {
    const geo=currentCollisionGeometry(asset); if(!geo) return {x:0,y:0};
    const visual=effectiveVisual(asset);
    const floor=effectiveGroundLine(asset);
    const height=effectiveHeight(asset);
    const pivotY=-floor*height+visual.y;
    let lx=Number(point.x||0)*geo.halfWidth;
    const ly=Number(point.y||0)*geo.collHeight;
    if(visual.flip) lx=-lx;
    const a=visual.deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    return {
      x:visual.x+lx*c-ly*s,
      y:pivotY+lx*s+ly*c
    };
  }
  function worldToPoint(asset,x,y) {
    const geo=currentCollisionGeometry(asset); if(!geo) return {x:0,y:0};
    const visual=effectiveVisual(asset);
    const floor=effectiveGroundLine(asset);
    const height=effectiveHeight(asset);
    const pivotY=-floor*height+visual.y;
    const dx=x-visual.x,dy=y-pivotY;
    const a=-visual.deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    let lx=dx*c-dy*s;
    const ly=dx*s+dy*c;
    if(visual.flip) lx=-lx;
    return {
      x:lx/Math.max(.001,geo.halfWidth),
      y:ly/Math.max(.001,geo.collHeight)
    };
  }
  function collisionWorldPoints(asset=state.asset,shapeIndex=state.selectedShape) {
    const geo=currentCollisionGeometry(asset,shapeIndex); if(!geo) return [];
    return geo.points.map(p=>pointToWorld(asset,p));
  }
  function saveWorldPoints(asset,worldPoints,{write=true,shapeIndex=state.selectedShape}={}) {
    const def=ensureCustomCollision(asset); if(!def) return;
    const shapes=ensureCollisionShapes(def);
    const index=clamp(Number(shapeIndex)||0,0,Math.max(0,shapes.length-1));
    shapes[index].points=worldPoints.map(p=>worldToPoint(asset,p.x,p.y));
    def.shapes=shapes; def.points=shapes[0].points.map(p=>({...p}));
    def.autoGenerated=false;
    if(write) setCollisionOverride(asset,def);
    else { const profile=stateProfile(asset); if(profile) profile.collision=clone(def); else collisionStore[asset.name]=def; }
  }

  function renderPointEditor() {
    pointList.innerHTML='';
    const collision=effectiveCollision();
    pointEditor.hidden=!collision;
    if(!collision){ edgeFloorBtn.disabled=true; return; }
    const shapes=collisionShapeDefs(collision);
    state.selectedShape=clamp(state.selectedShape,0,Math.max(0,shapes.length-1));
    if(collisionShapeSelect){
      collisionShapeSelect.innerHTML='';
      shapes.forEach((shape,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`Shape ${index+1} · ${shape.points.length} pts`;collisionShapeSelect.appendChild(option);});
      collisionShapeSelect.value=String(state.selectedShape);
    }
    if(collisionDeleteBoxBtn) collisionDeleteBoxBtn.disabled=shapes.length<=1;
    const worlds=collisionWorldPoints(state.asset,state.selectedShape);
    worlds.forEach((p,index)=>{
      const row=document.createElement('div'); row.className='assetlab-point-row'; row.classList.toggle('active',index===state.selectedPoint);
      const select=document.createElement('button'); select.type='button'; select.className='assetlab-point-select'; select.textContent=`P${index+1}`;
      select.addEventListener('click',()=>{state.selectedPoint=index;state.selectedEdge=-1;renderPointEditor();draw();});
      const x=document.createElement('input'); x.type='number'; x.step='0.01'; x.inputMode='decimal'; x.value=p.x.toFixed(2); x.setAttribute('aria-label',`Point ${index+1} X metres`);
      const y=document.createElement('input'); y.type='number'; y.step='0.01'; y.inputMode='decimal'; y.value=p.y.toFixed(2); y.setAttribute('aria-label',`Point ${index+1} Y metres, floor is zero`);
      const xWrap=document.createElement('label'); xWrap.innerHTML='<span>X</span>'; xWrap.appendChild(x);
      const yWrap=document.createElement('label'); yWrap.innerHTML='<span>Y</span>'; yWrap.appendChild(y);
      const update=(axis,input)=>{
        const value=Number(input.value); if(!Number.isFinite(value)) return;
        const pts=collisionWorldPoints(state.asset,state.selectedShape); if(!pts[index]) return;
        pts[index][axis]=clamp(value,-20,20);
        saveWorldPoints(state.asset,pts,{shapeIndex:state.selectedShape});
        state.selectedPoint=index; state.selectedEdge=-1;
        renderPointEditor(); buildList(); draw();
      };
      x.addEventListener('change',()=>update('x',x)); y.addEventListener('change',()=>update('y',y));
      x.addEventListener('focus',()=>{state.selectedPoint=index;state.selectedEdge=-1;draw();});
      y.addEventListener('focus',()=>{state.selectedPoint=index;state.selectedEdge=-1;draw();});
      row.append(select,xWrap,yWrap); pointList.appendChild(row);
    });
    edgeFloorBtn.disabled=state.selectedEdge<0 || state.selectedEdge>=worlds.length;
    edgeFloorBtn.textContent=edgeFloorBtn.disabled?'Select an Edge to Set Y = 0':`Set Edge ${state.selectedEdge+1} to Y = 0`;
  }

  let resizeFrame=0;
  function resize() {
    if(resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{
      resizeFrame=0;
      const rect=canvas.getBoundingClientRect();
      if(rect.width<2||rect.height<2)return;
      const dpr=Math.min(2,window.devicePixelRatio||1);
      const w=Math.max(1,Math.round(rect.width*dpr)), h=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw();
    });
  }

  function settleViewport() {
    resize();
    // iOS can report one or more transient viewport sizes while rotating.
    // Re-measure after each layout settles so the canvas never keeps the
    // temporary portrait/landscape backing size.
    [80,180,360,650].forEach(delay=>setTimeout(resize,delay));
  }

  function computeRender() {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    const assets=displayAssets();
    assets.forEach(ensureImage);
    const gapM=state.pairMode?0.72:0;
    const metrics=assets.map(asset=>{
      const image=ensureImage(asset);
      // A character effect previewed on a character: drawn at that character's game size.
      const fx=effectPreviewSize?.name===asset.name?effectPreviewSize:null;
      return fx?{asset,image,assetH:fx.metres,assetW:fx.metres*fx.aspect,floor:fx.ground}
        :{asset,image,assetH:effectiveHeight(asset),assetW:assetWorldWidth(asset),floor:effectiveGroundLine(asset)};
    });
    const totalAssetW=metrics.reduce((sum,m)=>sum+m.assetW,0)+gapM*Math.max(0,metrics.length-1);
    const maxAbove=Math.max(...metrics.map(m=>(1-m.floor)*m.assetH),state.showReference?2.70:1,1);
    const maxBelow=Math.max(...metrics.map(m=>m.floor*m.assetH),1);
    const spanW=Math.max(totalAssetW+2.2,5.2);
    const spanH=Math.max(maxAbove+maxBelow+1.8,3.6);
    const ppm=Math.max(8,Math.min((w-70)/spanW,(h-54)/spanH)*state.viewScale);
    const centerX=w/2+state.panX;
    const verticalContentPx=spanH*ppm;
    const topPad=Math.max(18,(h-verticalContentPx)/2);
    const groundY=Math.round(topPad+(maxAbove+.9)*ppm+state.panY);
    const totalPx=totalAssetW*ppm;
    let cursor=centerX-totalPx/2;
    const assetRenders={};
    for(const m of metrics){
      const drawW=m.assetW*ppm, drawH=m.assetH*ppm;
      const drawX=cursor;
      const drawY=groundY-(1-m.floor)*drawH;
      assetRenders[m.asset.name]={...m,drawX,drawY,drawW,drawH,centerX:drawX+drawW/2};
      cursor+=drawW+gapM*ppm;
    }
    state.render={w,h,ppm,groundY,centerX,assetRenders,assets};
    return state.render;
  }

  function drawGrid(r) {
    ctx.clearRect(0,0,r.w,r.h);
    const grad=ctx.createLinearGradient(0,0,0,r.h); grad.addColorStop(0,'#26333a'); grad.addColorStop(1,'#11191e'); ctx.fillStyle=grad; ctx.fillRect(0,0,r.w,r.h);
    ctx.save(); ctx.strokeStyle='rgba(219,233,228,.055)'; ctx.lineWidth=1;
    const step=Math.max(28,r.ppm);
    const x0=((r.centerX%step)+step)%step;
    for(let x=x0;x<r.w;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.h);ctx.stroke();}
    for(let x=x0-step;x>0;x-=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.h);ctx.stroke();}
    const y0=((r.groundY%step)+step)%step;
    for(let y=y0;y<r.h;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.w,y);ctx.stroke();}
    for(let y=y0-step;y>0;y-=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.w,y);ctx.stroke();}
    ctx.restore();
  }

  function drawReference(r) {
    if(!state.showReference)return;
    const renders=Object.values(r.assetRenders);
    const right=Math.max(...renders.map(ar=>ar.drawX+ar.drawW));
    // Match the actual SideScroll rig scale (character.scale = 2.31). The
    // assembled idle rig is ~2.70 world metres from floor contact to head top.
    const height=2.70*r.ppm, radius=.28*r.ppm;
    const x=Math.min(r.w-34,right+Math.max(38,.45*r.ppm)), bottom=r.groundY;
    ctx.save(); ctx.strokeStyle='rgba(113,226,211,.65)'; ctx.fillStyle='rgba(113,226,211,.07)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(x-radius,bottom-height,radius*2,height,Math.min(radius,18)); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(215,255,247,.76)'; ctx.font='700 12px -apple-system,BlinkMacSystemFont,sans-serif'; ctx.fillText('PLAYER · GAME SCALE',x-radius,bottom-height-8);
    ctx.restore();
  }

  function collisionScreenPoints(r,asset=state.asset,shapeIndex=state.selectedShape) {
    const ar=r.assetRenders[asset.name], geo=currentCollisionGeometry(asset,shapeIndex); if(!ar||!geo)return [];
    return geo.points.map((point,index)=>{
      const world=pointToWorld(asset,point);
      return {index,shapeIndex,asset,x:ar.centerX+world.x*r.ppm,y:r.groundY-world.y*r.ppm,world};
    });
  }
  function edgeScreenHandles(r,asset=state.asset,shapeIndex=state.selectedShape) {
    const pts=collisionScreenPoints(r,asset,shapeIndex); if(pts.length<2)return [];
    return pts.map((a,index)=>{
      const b=pts[(index+1)%pts.length];
      return {index,shapeIndex,asset,x:(a.x+b.x)/2,y:(a.y+b.y)/2,a,b};
    });
  }

  function drawCollision(r,asset,active) {
    const collision=effectiveCollision(asset); if(!collision)return;
    const shapes=collisionShapeDefs(collision);
    const support=effectiveBehaviour(asset).supportSurface;
    shapes.forEach((shape,shapeIndex)=>{
      const points=collisionScreenPoints(r,asset,shapeIndex); if(points.length<3)return;
      const selectedShape=active && shapeIndex===state.selectedShape;
      ctx.save();
      ctx.globalAlpha=active?(selectedShape?1:.48):.32;
      ctx.fillStyle=support?'rgba(239,184,102,.14)':'rgba(233,118,101,.12)';
      ctx.strokeStyle=selectedShape?'#ffb36c':(support?'#efb866':'#e97665');
      ctx.lineWidth=selectedShape?2.5:(active?1.5:1.2); ctx.setLineDash(support?[]:[6,4]);
      ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y); for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      if(selectedShape){
        const edges=edgeScreenHandles(r,asset,shapeIndex);
        edges.forEach(edge=>{
          const selected=edge.index===state.selectedEdge || state.draggingEdge?.index===edge.index;
          ctx.beginPath(); ctx.roundRect(edge.x-(selected?10:8),edge.y-(selected?6:5),selected?20:16,selected?12:10,4);
          ctx.fillStyle=selected?'#ff4f95':'rgba(26,31,31,.86)'; ctx.strokeStyle='#f1b56a'; ctx.lineWidth=1.5; ctx.fill(); ctx.stroke();
        });
        points.forEach(p=>{
          const selected=p.index===state.selectedPoint || p.index===state.draggingHandle;
          ctx.beginPath(); ctx.arc(p.x,p.y,selected?8:6,0,Math.PI*2); ctx.fillStyle=selected?'#ff4f95':'#f1b56a'; ctx.strokeStyle='#3a2c24'; ctx.lineWidth=1.5; ctx.fill(); ctx.stroke();
          ctx.fillStyle='rgba(20,25,25,.9)'; ctx.font='800 8px -apple-system,BlinkMacSystemFont,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(p.index+1),p.x,p.y+.5);
        });
      }
      ctx.restore();
    });
  }

  function drawMechanismOverlay(r, asset=state.asset) {
    const mech = effectiveMechanism(asset);
    const ar = r.assetRenders[asset?.name];
    if (!mech || !ar) return;

    const pivotX = ar.drawX + ar.drawW * mech.pivotX;
    const pivotY = ar.drawY + ar.drawH * mech.pivotY;
    const zoneY = ar.drawY + ar.drawH * mech.zoneY;
    const zoneX1 = ar.drawX + ar.drawW * mech.zoneStart;
    const zoneX2 = ar.drawX + ar.drawW * mech.zoneEnd;

    ctx.save();
    ctx.lineCap = 'round';

    ctx.strokeStyle = 'rgba(103,183,255,.30)';
    ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(zoneX1, zoneY); ctx.lineTo(zoneX2, zoneY); ctx.stroke();
    ctx.strokeStyle = '#67b7ff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(zoneX1, zoneY); ctx.lineTo(zoneX2, zoneY); ctx.stroke();

    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 8, 0, Math.PI*2);
    ctx.fillStyle = '#79ef85';
    ctx.fill();
    ctx.strokeStyle = '#183f25';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillStyle = 'rgba(12,28,35,.88)';
    ctx.fillRect(pivotX + 11, pivotY - 21, 77, 17);
    ctx.fillStyle = '#d8ffe0';
    ctx.fillText('PIVOT / PICKUP', pivotX + 16, pivotY - 9);

    const label='COUNTERWEIGHT >50%';
    const tw=ctx.measureText(label).width+12;
    const zx=(zoneX1+zoneX2)*0.5-tw*0.5;
    ctx.fillStyle='rgba(12,28,35,.84)';
    ctx.fillRect(zx,zoneY+9,tw,17);
    ctx.fillStyle='#cceaff';
    ctx.fillText(label,zx+6,zoneY+21);
    ctx.restore();
  }

  function climbPathScreenGeometry(r,asset=state.asset,path=null,index=0) {
    const ar=r.assetRenders[asset?.name];
    const geo=climbPathWorldGeometry(asset,path);
    if(!ar||!geo) return null;
    const bottom={x:ar.centerX+geo.bottom.x*r.ppm,y:r.groundY-geo.bottom.y*r.ppm};
    const top={x:ar.centerX+geo.top.x*r.ppm,y:r.groundY-geo.top.y*r.ppm};
    const dx=top.x-bottom.x,dy=top.y-bottom.y;
    const len=Math.max(.001,Math.hypot(dx,dy));
    const nx=-dy/len,ny=dx/len;
    const half=Math.max(7,geo.width*r.ppm*.5);
    const center={x:(bottom.x+top.x)*.5,y:(bottom.y+top.y)*.5};
    const widthHandle={x:center.x+nx*half,y:center.y+ny*half};
    const corners=[
      {x:bottom.x+nx*half,y:bottom.y+ny*half},
      {x:top.x+nx*half,y:top.y+ny*half},
      {x:top.x-nx*half,y:top.y-ny*half},
      {x:bottom.x-nx*half,y:bottom.y-ny*half}
    ];
    return {asset,path,index,bottom,top,center,widthHandle,corners,nx,ny,half};
  }

  function drawClimbPaths(r,asset=state.asset,active=true) {
    const paths=effectiveClimbPaths(asset);
    if(!paths.length) return;
    paths.forEach((path,index)=>{
      const g=climbPathScreenGeometry(r,asset,path,index); if(!g)return;
      const selected=active && index===state.selectedClimbPath;
      ctx.save();
      ctx.globalAlpha=active?(selected?1:.48):.28;
      ctx.fillStyle=selected?'rgba(91,217,236,.20)':'rgba(91,217,236,.10)';
      ctx.strokeStyle=selected?'#76e8f4':'rgba(118,232,244,.72)';
      ctx.lineWidth=selected?2.4:1.4;
      ctx.setLineDash(selected?[]:[6,4]);
      ctx.beginPath();ctx.moveTo(g.corners[0].x,g.corners[0].y);for(let i=1;i<g.corners.length;i++)ctx.lineTo(g.corners[i].x,g.corners[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(180,250,255,.92)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(g.bottom.x,g.bottom.y);ctx.lineTo(g.top.x,g.top.y);ctx.stroke();
      if(selected){
        const handles=[
          ['bottom',g.bottom,'#7cf0a0'],
          ['top',g.top,'#76e8f4'],
          ['center',g.center,'#f1f7f5'],
          ['width',g.widthHandle,'#ff6cae']
        ];
        for(const [kind,pt,color] of handles){
          const dragging=state.draggingClimbHandle?.kind===kind && state.draggingClimbHandle?.index===index;
          ctx.beginPath();ctx.arc(pt.x,pt.y,dragging?9:7,0,Math.PI*2);ctx.fillStyle=color;ctx.strokeStyle='#203037';ctx.lineWidth=2;ctx.fill();ctx.stroke();
        }
        const label=`CLIMB PATH ${index+1}`;
        ctx.font='800 9px -apple-system,BlinkMacSystemFont,sans-serif';
        const tw=ctx.measureText(label).width+12;
        const lx=g.center.x-tw*.5,ly=Math.min(g.bottom.y,g.top.y)-23;
        ctx.fillStyle='rgba(14,27,33,.82)';ctx.fillRect(lx,ly,tw,17);ctx.fillStyle='#c9faff';ctx.fillText(label,lx+6,ly+12);
      }
      ctx.restore();
    });
  }

  function draw() {
    if(!canvas.clientWidth||!canvas.clientHeight)return;
    const r=computeRender(); drawGrid(r);
    ctx.save(); ctx.strokeStyle='rgba(114,230,208,.92)'; ctx.lineWidth=2; ctx.setLineDash([8,5]); ctx.beginPath(); ctx.moveTo(0,r.groundY); ctx.lineTo(r.w,r.groundY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#bafbf0'; ctx.font='800 12px -apple-system,BlinkMacSystemFont,sans-serif'; ctx.fillText('GROUND · Y = 0.00 m',12,r.groundY-9); ctx.restore();

    for(const asset of r.assets){
      const ar=r.assetRenders[asset.name], image=ar.image; const active=asset.name===state.asset.name;
      if(image?.complete&&image.naturalWidth){
        ctx.save();
        ctx.globalAlpha=(state.pairMode && !active) ? .72 : 1;
        const visual=effectiveVisual(asset);
        const pivotX=ar.drawX+ar.drawW*.5+visual.x*r.ppm;
        const pivotY=ar.drawY+ar.drawH-visual.y*r.ppm;
        ctx.translate(pivotX,pivotY);
        ctx.rotate(-visual.deg*Math.PI/180);
        ctx.scale(visual.flip?-1:1,1);
        ctx.drawImage(image,-ar.drawW*.5,-ar.drawH,ar.drawW,ar.drawH);
        if((asset.name==='handcart'||asset.name==='handcart-broken')&&cartWheelPreview.complete&&cartWheelPreview.naturalWidth){
          const wheelSize=ar.drawH*(160/255);
          const wheelY=-(91/255)*ar.drawH;
          const chosenState=(asset===state.asset)?state.assetState:defaultStateForAsset(asset);
          const profile=stateProfile(asset,chosenState);
          const components=profile?.components || {rearWheel:true,frontWheel:asset.name!=='handcart-broken'};
          const wheelUs=[];
          if(components.rearWheel!==false) wheelUs.push(150/620);
          if(components.frontWheel!==false) wheelUs.push(470/620);
          for(const u of wheelUs){
            const wheelX=(u-.5)*ar.drawW;
            ctx.drawImage(cartWheelPreview,wheelX-wheelSize*.5,wheelY-wheelSize*.5,wheelSize,wheelSize);
          }
        }
        ctx.restore();
      }
      if(state.pairMode){
        ctx.save(); ctx.strokeStyle=active?'rgba(126,216,199,.72)':'rgba(238,243,241,.16)'; ctx.lineWidth=active?2:1; ctx.setLineDash(active?[]:[5,5]); ctx.strokeRect(ar.drawX-5,ar.drawY-5,ar.drawW+10,ar.drawH+10); ctx.setLineDash([]);
        ctx.fillStyle=active?'#c8f4e9':'rgba(238,243,241,.52)'; ctx.font='800 11px -apple-system,BlinkMacSystemFont,sans-serif'; ctx.fillText(asset.name==='bridge-left'?'LEFT':'RIGHT',ar.drawX,Math.max(14,ar.drawY-10)); ctx.restore();
      }
    }
    drawReference(r);
    if (isCounterweightPlank(state.asset)) drawMechanismOverlay(r,state.asset);
    drawAssetSockets(r);
    for(const asset of r.assets) drawCollision(r,asset,asset.name===state.asset.name);
    for(const asset of r.assets) drawClimbPaths(r,asset,asset.name===state.asset.name);

    ctx.save(); ctx.fillStyle='rgba(238,243,241,.45)'; ctx.font='700 11px -apple-system,BlinkMacSystemFont,sans-serif'; const metres=Math.max(1,Math.floor(100/r.ppm)); const px=metres*r.ppm; const x=18,y=r.h-22; ctx.fillRect(x,y,px,2); ctx.fillText(`${metres} m`,x,y-7); ctx.restore();
  }

  function pointerPos(e){const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};}
  function pinchDistance(a,b){return Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));}
  function pinchMidpoint(a,b){return{x:(a.x+b.x)*.5,y:(a.y+b.y)*.5};}
  function clearDirectManipulation(){
    state.draggingHandle=-1;
    state.draggingEdge=null;
    state.draggingClimbHandle=null;
    state.panning=false;
    state.pointerStart=null;
    state.panStart=null;
  }
  function beginPinch(){
    const entries=[...state.activePointers.entries()].slice(0,2);
    if(entries.length<2)return false;
    const [[idA,a],[idB,b]]=entries;
    const r=state.render||computeRender();
    const mid=pinchMidpoint(a,b);
    clearDirectManipulation();
    state.pinch={
      ids:[idA,idB],
      startDistance:pinchDistance(a,b),
      startScale:state.viewScale,
      worldX:(mid.x-r.centerX)/r.ppm,
      worldY:(r.groundY-mid.y)/r.ppm
    };
    return true;
  }
  function updatePinch(){
    const pinch=state.pinch;if(!pinch)return false;
    const a=state.activePointers.get(pinch.ids[0]),b=state.activePointers.get(pinch.ids[1]);
    if(!a||!b)return false;
    const mid=pinchMidpoint(a,b);
    const nextScale=clamp(pinch.startScale*(pinchDistance(a,b)/pinch.startDistance),.45,5);
    state.viewScale=nextScale;
    // Recompute the automatic fit at the new zoom with no manual pan, then
    // offset it so the same world-space point remains under the pinch midpoint.
    state.panX=0;state.panY=0;
    const base=computeRender();
    state.panX=(mid.x-pinch.worldX*base.ppm)-base.centerX;
    state.panY=(mid.y+pinch.worldY*base.ppm)-base.groundY;
    draw();
    return true;
  }
  function frameAssetView(){
    state.viewScale=1;state.panX=0;state.panY=0;
    state.pinch=null;state.blockSingleTouchUntilClear=false;
    draw();
  }
  function distanceToSegment(p,a,b){
    const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y; const len2=vx*vx+vy*vy;
    if(len2<=.0001)return Math.hypot(p.x-a.x,p.y-a.y);
    const t=clamp((wx*vx+wy*vy)/len2,0,1); const x=a.x+t*vx,y=a.y+t*vy; return Math.hypot(p.x-x,p.y-y);
  }
  function climbScreenPointToLocal(asset,p,r) {
    const ar=r.assetRenders[asset?.name];
    if(!ar) return {x:0,y:0};
    const wx=(p.x-ar.centerX)/r.ppm;
    const wy=(r.groundY-p.y)/r.ppm;
    return climbWorldPointToLocal(asset,wx,wy);
  }

  function pickClimbHandleAt(p,r) {
    const paths=effectiveClimbPaths(state.asset);
    let stripHit=null;
    for(let index=paths.length-1;index>=0;index--){
      const g=climbPathScreenGeometry(r,state.asset,paths[index],index); if(!g)continue;
      const handles=[['bottom',g.bottom],['top',g.top],['width',g.widthHandle],['center',g.center]];
      for(const [kind,pt] of handles){
        if(Math.hypot(pt.x-p.x,pt.y-p.y)<=18) return {kind,index,geometry:g};
      }
      const d=distanceToSegment(p,g.bottom,g.top);
      if(d<=g.half+8&&!stripHit) stripHit={kind:'center',index,geometry:g};
    }
    return stripHit;
  }

  function pickHandleAt(p,r) {
    const assets=[state.asset,...r.assets.filter(a=>a.name!==state.asset.name)];
    for(const asset of assets){
      const count=collisionShapeDefs(effectiveCollision(asset)).length;
      for(let shapeIndex=0;shapeIndex<count;shapeIndex++){
        const hit=collisionScreenPoints(r,asset,shapeIndex).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<=18); if(hit)return hit;
      }
    }
    return null;
  }
  function pickEdgeAt(p,r) {
    const assets=[state.asset,...r.assets.filter(a=>a.name!==state.asset.name)];
    let best=null;
    for(const asset of assets){
      const count=collisionShapeDefs(effectiveCollision(asset)).length;
      for(let shapeIndex=0;shapeIndex<count;shapeIndex++) for(const edge of edgeScreenHandles(r,asset,shapeIndex)){
        const d=distanceToSegment(p,edge.a,edge.b);
        if(d<=13 && (!best||d<best.distance))best={...edge,distance:d};
      }
    }
    return best;
  }
  function renderContains(ar,p){return !!ar&&p.x>=ar.drawX-8&&p.x<=ar.drawX+ar.drawW+8&&p.y>=ar.drawY-8&&p.y<=ar.drawY+ar.drawH+8;}

  canvas.addEventListener('pointerdown',e=>{
    const p=pointerPos(e);
    if(e.pointerType==='touch'){
      state.activePointers.set(e.pointerId,p);
      try{canvas.setPointerCapture(e.pointerId);}catch{}
      if(state.activePointers.size>=2){
        e.preventDefault();
        if(!state.pinch)beginPinch();
        else updatePinch();
        return;
      }
      if(state.blockSingleTouchUntilClear)return;
    }
    const r=state.render||computeRender();
    if (state.socketPlacementMode) {
      if (setSocketAtViewportPoint(p,r)) {
        stageHelpEl.textContent='Socket saved to the asset. Every placed copy of this host now inherits it.';
      } else {
        stageHelpEl.textContent='Tap directly on the selected Socket Host artwork.';
      }
      return;
    }
    const climbHandle=pickClimbHandleAt(p,r);
    if(climbHandle){
      state.selectedClimbPath=climbHandle.index;
      const paths=effectiveClimbPaths();
      const local=climbScreenPointToLocal(state.asset,p,r);
      state.draggingClimbHandle={kind:climbHandle.kind,index:climbHandle.index,startLocal:local,startPaths:clone(paths)};
      state.selectedPoint=-1;state.selectedEdge=-1;
      canvas.setPointerCapture(e.pointerId);renderClimbControls();draw();return;
    }
    const handle=pickHandleAt(p,r);
    if(handle){
      if(handle.asset.name!==state.asset.name) selectAsset(handle.asset,{keepView:true});
      state.selectedShape=handle.shapeIndex; state.draggingHandle=handle.index; state.selectedPoint=handle.index; state.selectedEdge=-1;
      canvas.setPointerCapture(e.pointerId); renderPointEditor(); draw(); return;
    }
    const edge=pickEdgeAt(p,r);
    if(edge){
      if(edge.asset.name!==state.asset.name) selectAsset(edge.asset,{keepView:true});
      state.selectedShape=edge.shapeIndex;
      const pts=collisionWorldPoints(edge.asset,edge.shapeIndex);
      state.draggingEdge={assetName:edge.asset.name,shapeIndex:edge.shapeIndex,index:edge.index,startPointer:p,startPoints:pts.map(q=>({...q}))};
      state.selectedEdge=edge.index; state.selectedPoint=-1;
      canvas.setPointerCapture(e.pointerId); renderPointEditor(); draw(); return;
    }
    if(state.pairMode){
      const other=r.assets.find(asset=>asset.name!==state.asset.name&&renderContains(r.assetRenders[asset.name],p));
      if(other){ selectAsset(other,{keepView:true}); return; }
    }
    state.panning=true; state.pointerStart=p; state.panStart={x:state.panX,y:state.panY};
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove',e=>{
    const p=pointerPos(e);
    if(e.pointerType==='touch'&&state.activePointers.has(e.pointerId)){
      state.activePointers.set(e.pointerId,p);
      if(state.pinch){e.preventDefault();updatePinch();return;}
      if(state.blockSingleTouchUntilClear)return;
    }
    const r=state.render||computeRender();
    if(state.draggingClimbHandle){
      const drag=state.draggingClimbHandle;
      const current=climbScreenPointToLocal(state.asset,p,r);
      const paths=clone(drag.startPaths);
      const path=paths[drag.index]; if(!path)return;
      if(drag.kind==='bottom') path.bottom={x:clamp(current.x,-1.5,1.5),y:clamp(current.y,-1,2)};
      else if(drag.kind==='top') path.top={x:clamp(current.x,-1.5,1.5),y:clamp(current.y,-1,2)};
      else if(drag.kind==='center') {
        const dx=current.x-drag.startLocal.x,dy=current.y-drag.startLocal.y;
        path.bottom={x:clamp((Number(path.bottom?.x)||0)+dx,-1.5,1.5),y:clamp((Number(path.bottom?.y)||0)+dy,-1,2)};
        path.top={x:clamp((Number(path.top?.x)||0)+dx,-1.5,1.5),y:clamp((Number(path.top?.y)||0)+dy,-1,2)};
      } else if(drag.kind==='width') {
        const g=climbPathScreenGeometry(r,state.asset,path,drag.index);
        if(g){
          const widthMeters=clamp(2*distanceToSegment(p,g.bottom,g.top)/r.ppm,.20,2.50);
          path.widthRatio=widthMeters/Math.max(.001,assetWorldWidth());
        }
      }
      climbPathStore[state.asset.name]=paths;
      renderClimbControls();draw();return;
    }
    if(state.draggingHandle>=0){
      const ar=r.assetRenders[state.asset.name]; if(!ar)return;
      const wx=(p.x-ar.centerX)/r.ppm, wy=(r.groundY-p.y)/r.ppm;
      const pts=collisionWorldPoints(state.asset,state.selectedShape); if(!pts[state.draggingHandle])return;
      pts[state.draggingHandle]={x:clamp(wx,-20,20),y:clamp(wy,-20,20)};
      saveWorldPoints(state.asset,pts,{write:false,shapeIndex:state.selectedShape}); refreshPointInputs(); draw(); return;
    }
    if(state.draggingEdge){
      const asset=assetByName(state.draggingEdge.assetName); if(!asset)return;
      const dx=(p.x-state.draggingEdge.startPointer.x)/r.ppm;
      const dy=-(p.y-state.draggingEdge.startPointer.y)/r.ppm;
      const pts=state.draggingEdge.startPoints.map(q=>({...q}));
      const a=state.draggingEdge.index,b=(a+1)%pts.length;
      pts[a].x+=dx; pts[a].y+=dy; pts[b].x+=dx; pts[b].y+=dy;
      saveWorldPoints(asset,pts,{write:false,shapeIndex:state.draggingEdge.shapeIndex}); refreshPointInputs(); draw(); return;
    }
    if(state.panning&&state.pointerStart&&state.panStart){
      state.panX=state.panStart.x+(p.x-state.pointerStart.x);
      state.panY=state.panStart.y+(p.y-state.pointerStart.y);
      draw();
    }
  });

  function finishPointer(e){
    if(e?.pointerType==='touch'){
      state.activePointers.delete(e.pointerId);
      if(state.pinch){
        state.pinch=null;
        clearDirectManipulation();
        // Do not reinterpret the remaining finger as a pan/edit gesture.
        // Require the pinch gesture to fully release first.
        state.blockSingleTouchUntilClear=state.activePointers.size>0;
        draw();
        return;
      }
      if(state.blockSingleTouchUntilClear){
        if(state.activePointers.size===0)state.blockSingleTouchUntilClear=false;
        clearDirectManipulation();
        draw();
        return;
      }
    }
    const collisionChanged=state.draggingHandle>=0||!!state.draggingEdge;
    const climbChanged=!!state.draggingClimbHandle;
    clearDirectManipulation();
    if(collisionChanged){ if(stateProfile()) writeStateStore(); else writeStore(COLLISION_KEY,collisionStore); buildList();renderPointEditor(); }
    if(climbChanged){ writeStore(CLIMB_PATH_KEY,climbPathStore); buildList();renderClimbControls(); }
    draw();
  }
  canvas.addEventListener('pointerup',finishPointer); canvas.addEventListener('pointercancel',finishPointer);

  function refreshPointInputs(){
    const worlds=collisionWorldPoints(state.asset,state.selectedShape);
    [...pointList.querySelectorAll('.assetlab-point-row')].forEach((row,index)=>{
      const inputs=row.querySelectorAll('input'); if(!worlds[index]||inputs.length<2)return;
      if(document.activeElement!==inputs[0])inputs[0].value=worlds[index].x.toFixed(2);
      if(document.activeElement!==inputs[1])inputs[1].value=worlds[index].y.toFixed(2);
      row.classList.toggle('active',index===state.selectedPoint);
    });
  }

  stateSelect?.addEventListener('change',()=>changeAssetState(stateSelect.value||'base'));
  stateNewBtn?.addEventListener('click',()=>{
    const label=window.prompt('Name this asset state','New State'); if(!label?.trim()) return;
    const bucket=ensureStateBucket(); const key=stateSlug(label);
    bucket.states[key]={label:label.trim()}; writeStateStore(); changeAssetState(key);
  });
  stateDuplicateBtn?.addEventListener('click',()=>{
    const suggested=`${stateLabel(state.assetState)} Copy`;
    const label=window.prompt('Name the duplicated state',suggested); if(!label?.trim()) return;
    const bucket=ensureStateBucket(); const key=stateSlug(label);
    bucket.states[key]=currentStateSnapshot(label.trim()); writeStateStore(); changeAssetState(key);
  });
  stateRenameBtn?.addEventListener('click',()=>{
    const profile=stateProfile(); if(!profile) return;
    const label=window.prompt('Rename this state',profile.label||stateLabel(state.assetState)); if(!label?.trim()) return;
    profile.label=label.trim(); writeStateStore(); syncControls(); buildList();
  });
  stateDeleteBtn?.addEventListener('click',()=>{
    if(state.assetState==='base') return;
    const key=canonicalStateAssetName(); const bucket=ensureStateBucket();
    if(!bucket.states[state.assetState]) return;
    if(!window.confirm(`Delete state “${stateLabel(state.assetState)}”?`)) return;
    delete bucket.states[state.assetState]; writeStateStore(); changeAssetState('base');
  });
  for(const [btn,key] of [[cartRearWheelBtn,'rearWheel'],[cartFrontWheelBtn,'frontWheel']]){
    btn?.addEventListener('click',()=>{
      const profile=stateProfile(); if(!profile) return;
      profile.components ||= {rearWheel:true,frontWheel:true};
      profile.components[key]=profile.components[key]===false;
      writeStateStore(); syncStateControls(); draw();
    });
  }
  climbPathSelect?.addEventListener('change',()=>{state.selectedClimbPath=clamp(Number(climbPathSelect.value)||0,0,99);renderClimbControls();draw();});
  climbPathAddBtn?.addEventListener('click',addClimbPath);
  climbPathDeleteBtn?.addEventListener('click',deleteClimbPath);
  climbWidthInput?.addEventListener('input',()=>{
    const width=clamp(Number(climbWidthInput.value)||.70,.20,2.50);
    updateSelectedClimbPath(path=>{path.widthRatio=width/Math.max(.001,assetWorldWidth());});
  });
  climbBottomXInput?.addEventListener('change',()=>commitClimbEndpointInput('bottom','x',climbBottomXInput));
  climbBottomYInput?.addEventListener('change',()=>commitClimbEndpointInput('bottom','y',climbBottomYInput));
  climbTopXInput?.addEventListener('change',()=>commitClimbEndpointInput('top','x',climbTopXInput));
  climbTopYInput?.addEventListener('change',()=>commitClimbEndpointInput('top','y',climbTopYInput));
  collisionShapeSelect?.addEventListener('change',()=>{state.selectedShape=clamp(Number(collisionShapeSelect.value)||0,0,99);state.selectedPoint=-1;state.selectedEdge=-1;renderPointEditor();draw();});
  collisionAddBoxBtn?.addEventListener('click',addCollisionBox);
  collisionDeleteBoxBtn?.addEventListener('click',deleteCollisionBox);
  heightInput.addEventListener('input',()=>{const v=clamp(Number(heightInput.value)||state.asset.height,.25,12);heightValue.textContent=`${v.toFixed(2)} m`;saveLayout({defaultHeight:v});syncControls();});
  floorInput.addEventListener('input',()=>{const v=clamp((Number(floorInput.value)||0)/100,0,1);floorValue.textContent=`${Math.round(v*100)}%`;saveLayout({groundLine:v});renderPointEditor();draw();});
  rotationInput?.addEventListener('input',()=>{const v=clamp(Number(rotationInput.value)||0,-180,180);rotationValue.textContent=`${v.toFixed(1).replace('.0','')}°`;saveLayout({visualRotationDeg:v});renderPointEditor();draw();});
  flipBtn?.addEventListener('click',()=>{const next=!effectiveVisual().flip;saveLayout({visualFlip:next});syncControls();renderPointEditor();draw();});
  brokenOffsetXInput?.addEventListener('input',()=>{const v=clamp(Number(brokenOffsetXInput.value)||0,-1,1);brokenOffsetXValue.textContent=`${v.toFixed(2)} m`;saveLayout({visualOffsetX:v});draw();});
  brokenOffsetYInput?.addEventListener('input',()=>{const v=clamp(Number(brokenOffsetYInput.value)||0,-.75,.75);brokenOffsetYValue.textContent=`${v.toFixed(2)} m`;saveLayout({visualOffsetY:v});draw();});
  depthInput.addEventListener('input',()=>{const def=ensureCustomCollision();if(!def)return;const width=assetWorldWidth();const depth=clamp(Number(depthInput.value)||.8,.15,2.5);def.depthRatio=depth/Math.max(.001,width);def.autoGenerated=false;setCollisionOverride(state.asset,def);depthValue.textContent=`${depth.toFixed(2)} m`;syncControls();buildList();});
  collisionToggle.addEventListener('click',addOrRemoveCollision);
  collisionRemove?.addEventListener('click',removeCollisionExplicitly);
  collisionReset.addEventListener('click',fitCollisionRectangle);
  resetBtn.addEventListener('click',resetCurrent);
  fitBtn.addEventListener('click',frameAssetView);
  referenceBtn.addEventListener('click',()=>{state.showReference=!state.showReference;referenceBtn.classList.toggle('active',state.showReference);referenceBtn.setAttribute('aria-pressed',String(state.showReference));draw();});
  pairBtn.addEventListener('click',()=>{
    if(!isBridge(state.asset))return;
    state.pairMode=!state.pairMode; state.panX=0; state.panY=0; state.viewScale=1;
    if(state.pairMode)BRIDGE_NAMES.forEach(name=>ensureImage(assetByName(name)));
    updatePairUI(); draw();
  });
  edgeFloorBtn.addEventListener('click',()=>{
    const pts=collisionWorldPoints(state.asset,state.selectedShape); if(state.selectedEdge<0||state.selectedEdge>=pts.length)return;
    const a=state.selectedEdge,b=(a+1)%pts.length; pts[a].y=0; pts[b].y=0;
    saveWorldPoints(state.asset,pts,{shapeIndex:state.selectedShape}); renderPointEditor(); buildList(); draw();
  });
  socketPieceSelect?.addEventListener('change',()=>{
    state.socketPlacementMode=false;
    syncSocketControls();
    draw();
  });
  socketPlaceBtn?.addEventListener('click',()=>{
    if (!effectiveBehaviour().socketHost) return;
    state.socketPlacementMode=!state.socketPlacementMode;
    syncSocketControls();
    stageHelpEl.textContent=state.socketPlacementMode
      ? `Tap ${state.asset.label} where the ${assetByName(selectedSocketPieceName())?.label || 'piece'} should attach.`
      : 'Socket placement cancelled.';
    draw();
  });
  socketDeleteBtn?.addEventListener('click',()=>{
    if (!effectiveBehaviour().socketHost) return;
    const pieceName=selectedSocketPieceName();
    if (!pieceName) return;
    writeAssetSocket(state.asset,pieceName,null);
    state.socketPlacementMode=false;
    syncSocketControls();
    draw();
    stageHelpEl.textContent=`Asset socket removed for ${assetByName(pieceName)?.label || pieceName}.`;
  });
  const updateSocketNumeric=(axis,value)=>{
    const pieceName=selectedSocketPieceName();
    const socket=assetSocketForPiece(state.asset,pieceName);
    if (!socket) return;
    const patch={u:socket.u,v:socket.v};
    patch[axis]=clamp(Number(value)/100,0,1);
    writeAssetSocket(state.asset,pieceName,patch);
    syncSocketControls();
    draw();
  };
  socketXInput?.addEventListener('input',()=>updateSocketNumeric('u',socketXInput.value));
  socketYInput?.addEventListener('input',()=>updateSocketNumeric('v',socketYInput.value));

  const mechanismBindings = [
    [pivotXInput, value => ({pivotX:clamp(Number(value)/100,0.05,0.95)})],
    [pivotYInput, value => ({pivotY:clamp(Number(value)/100,0,1)})],
    [zoneStartInput, value => {
      const mech=effectiveMechanism(); const start=clamp(Number(value)/100,0,0.90);
      return {zoneStart:Math.min(start,mech.zoneEnd-0.02)};
    }],
    [zoneEndInput, value => {
      const mech=effectiveMechanism(); const end=clamp(Number(value)/100,0.05,0.98);
      return {zoneEnd:Math.max(end,mech.zoneStart+0.02)};
    }],
    [zoneYInput, value => ({zoneY:clamp(Number(value)/100,0,1)})],
    [zoneDepthInput, value => ({zoneDepth:clamp(Number(value),0.30,2.50)})],
    [logWeightInput, value => ({logWeight:clamp(Number(value),0.20,2.50)})],
    [playerWeightInput, value => ({playerWeight:clamp(Number(value),0.50,2.00)})],
    [maxTipInput, value => ({maxTipDeg:clamp(Number(value),5,40)})],
    [fallTipInput, value => ({fallAngleDeg:clamp(Number(value),6,35)})]
  ];
  for (const [input,toPatch] of mechanismBindings) {
    input?.addEventListener('input',()=>{
      if(!effectiveMechanism()) return;
      saveMechanism(toPatch(input.value));
      syncMechanismControls();
      draw();
    });
  }

  filterSelect?.addEventListener('change',()=>{
    state.filter=filterSelect.value;
    if(assetMatchesFilter(state.asset)){buildList();return;}
    const candidate=ASSETS.find(a=>assetMatchesFilter(a)); if(candidate)selectAsset(candidate); else buildList();
  });
  // + Add: one button, a short menu of ways to add an asset (more can join it later).
  const addBtn=document.getElementById('assetlab-add'), addMenu=document.getElementById('assetlab-add-menu');
  const setAddMenu=open=>{if(!addMenu)return;addMenu.hidden=!open;addBtn?.setAttribute('aria-expanded',String(open));};
  addBtn?.addEventListener('click',event=>{event.stopPropagation();setAddMenu(addMenu.hidden);});
  addMenu?.addEventListener('click',()=>setAddMenu(false));
  document.addEventListener('click',event=>{if(addMenu&&!addMenu.hidden&&!event.target.closest('.assetlab-add'))setAddMenu(false);});
  // The settings panel folds away to give the stage room (remembered on this device).
  const shellEl=document.querySelector('.assetlab-shell'), panelToggle=document.getElementById('assetlab-controls-toggle');
  const PANEL_KEY='sidescroll.asset-lab.panel-collapsed.v1';
  function setPanelCollapsed(collapsed){
    shellEl?.classList.toggle('controls-collapsed',collapsed);
    if(panelToggle){panelToggle.textContent=collapsed?'‹':'Hide panel ›';panelToggle.title=collapsed?'Show the settings panel':'Hide the settings panel';panelToggle.setAttribute('aria-expanded',String(!collapsed));}
    try{collapsed?localStorage.setItem(PANEL_KEY,'1'):localStorage.removeItem(PANEL_KEY);}catch(_){}
    requestAnimationFrame(()=>{resize();draw();});
  }
  panelToggle?.addEventListener('click',()=>setPanelCollapsed(!shellEl?.classList.contains('controls-collapsed')));
  try{if(localStorage.getItem(PANEL_KEY)==='1')setPanelCollapsed(true);}catch(_){}
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('orientationchange',settleViewport,{passive:true});
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  const stageResizeObserver='ResizeObserver' in window ? new ResizeObserver(resize) : null;
  stageResizeObserver?.observe(document.querySelector('.assetlab-stage-wrap'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')settleViewport();});

  ensureCartStates();
  ASSETS.slice(0,2).forEach(ensureImage);
  renderFilterOptions();
  buildList();
  selectAsset(state.asset);
  settleViewport();
})();
