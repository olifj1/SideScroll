(() => {
  'use strict';

  const VERSION = '1.0.36';
  const BEHAVIOUR_KEY = 'sidescroll.asset-behaviours.v1';
  const COLLISION_KEY = 'sidescroll.asset-collisions.v1';
  const LAYOUT_KEY = 'sidescroll.asset-layout.v1';
  const MECHANISM_KEY = 'sidescroll.asset-mechanisms.v3';
  const SOCKET_KEY = 'sidescroll.asset-sockets.v1';
  const STACK_ITEM_HEIGHT = 0.68;
  const BRIDGE_NAMES = ['bridge-left', 'bridge-right'];
  const behaviourKeys = ['solid','carryable','placeable','supportSurface','stackable','pushable','socketHost','socketPiece'];
  const emptyBehaviour = { solid:false, carryable:false, placeable:false, supportSurface:false, stackable:false, pushable:false, socketHost:false, socketPiece:false };

  const ASSETS = [
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-left',label:'Broken Bridge · Left',image:'bridge-left.png',height:2.20,groundLine:1.62/2.20,behaviour:{solid:true,supportSurface:true,socketHost:true}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-right',label:'Broken Bridge · Right',image:'bridge-right.png',height:2.20,groundLine:1.62/2.20,behaviour:{solid:true,supportSurface:true,socketHost:true}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'counterweight-plank',label:'Counterweight Plank · Legacy',image:'counterweight-plank.png',height:0.72,groundLine:0.36,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,socketPiece:true},collision:{halfWidthRatio:0.49,fixedHeight:0.26,heightRatio:null,depthRatio:0.12,points:null}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'handcart-broken',label:'Broken Handcart',image:'handcart-body.png',height:1.75,groundLine:0.064,behaviour:{solid:true,supportSurface:true},collision:{halfWidthRatio:0.405,heightRatio:0.72,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:-1,y:.17},{x:-.8,y:.17},{x:-.8,y:.34},{x:-.63,y:.34},{x:-.63,y:1},{x:.63,y:1},{x:.63,y:.34},{x:.8,y:.34},{x:.8,y:.17},{x:1,y:.17},{x:1,y:0}]}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'handcart',label:'Wooden Handcart · Pushable',image:'handcart-body.png',height:1.75,groundLine:0.064,behaviour:{solid:true,supportSurface:true,pushable:true},collision:{halfWidthRatio:0.405,heightRatio:0.72,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:-1,y:.17},{x:-.8,y:.17},{x:-.8,y:.34},{x:-.63,y:.34},{x:-.63,y:1},{x:.63,y:1},{x:.63,y:.34},{x:.8,y:.34},{x:.8,y:.17},{x:1,y:.17},{x:1,y:0}]}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'cart-wheel-loose',label:'Cart Wheel',image:'handcart-wheel.png',height:1.06,groundLine:0,behaviour:{solid:true,carryable:true,placeable:true},collision:{halfWidthRatio:0.30,heightRatio:0.62,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'axle-pin',label:'Axle Pin',procedural:'axle-pin',height:0.72,groundLine:0,behaviour:{}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-a',label:'Moveable Log A',image:'puzzle-log-a.png',height:0.84,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true},collision:{halfWidthRatio:0.52/(0.84*1.7083),fixedHeight:STACK_ITEM_HEIGHT,heightRatio:null,depthRatio:0.56/(0.84*1.7083),points:null}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-b',label:'Moveable Log B',image:'puzzle-log-b.png',height:0.72,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-c',label:'Moveable Log C',image:'puzzle-log-c.png',height:0.76,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-d',label:'Moveable Log D',image:'puzzle-log-d.png',height:0.82,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'fallen-tree',label:'Fallen Tree',image:'fallen-tree.png',height:2.55,behaviour:{solid:true,supportSurface:true}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'tree-stump',label:'Tree Stump',image:'tree-stump.png',height:1.18,behaviour:{}},
    {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'broken-branch',label:'Broken Branch',image:'broken-branch.png',height:0.78,behaviour:{}},
    {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-wall',label:'Stone Wall',image:'stone-wall.png',height:3.75,behaviour:{socketHost:true}},
    {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-a',label:'Triangle Stone',image:'stone-piece-a.png',height:1.00,behaviour:{carryable:true,placeable:true,socketPiece:true}},
    {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-b',label:'Arch Stone',image:'stone-piece-b.png',height:1.04,behaviour:{carryable:true,placeable:true,socketPiece:true}},
    {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-c',label:'Hexagon Stone',image:'stone-piece-c.png',height:1.00,behaviour:{carryable:true,placeable:true,socketPiece:true}},
    ...Array.from({length:8},(_,i)=>({group:'ENVIRONMENT · TREES',scope:'environment',name:`tree${String(i+1).padStart(2,'0')}`,label:`Tree ${i+1}`,image:`sidescroll-tree-${String(i+1).padStart(2,'0')}.png`,height:8.2,behaviour:{}})),
    ...Array.from({length:12},(_,i)=>({group:'ENVIRONMENT · GROUND',scope:'environment',name:`ground${String(i+1).padStart(2,'0')}`,label:`Ground ${i+1}`,image:`sidescroll-ground-${String(i+1).padStart(2,'0')}.png`,height:0.82,behaviour:{}}))
  ];

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
  const collisionToggle = document.getElementById('assetlab-collision-toggle');
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
  const resetBtn = document.getElementById('assetlab-reset');
  const fitBtn = document.getElementById('assetlab-fit');
  const referenceBtn = document.getElementById('assetlab-reference');
  const pairBtn = document.getElementById('assetlab-pair');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
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
  const brokenRotationInput = document.getElementById('assetlab-broken-rotation');
  const brokenOffsetXValue = document.getElementById('assetlab-broken-offset-x-value');
  const brokenOffsetYValue = document.getElementById('assetlab-broken-offset-y-value');
  const brokenRotationValue = document.getElementById('assetlab-broken-rotation-value');

  const readStore = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  };
  let behaviourStore = readStore(BEHAVIOUR_KEY);
  let collisionStore = readStore(COLLISION_KEY);
  let layoutStore = readStore(LAYOUT_KEY);
  let mechanismStore = readStore(MECHANISM_KEY);
  let socketStore = readStore(SOCKET_KEY);

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

  const state = {
    filter:'puzzle',
    asset:ASSETS[0],
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
    socketPlacementMode:false
  };

  const defaultPoints = () => [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}];
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

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

  function ensureImage(asset) {
    if (!asset) return null;
    const existing = imageCache.get(asset.name);
    if (existing) return existing;
    if (asset.procedural) {
      const img=makeProceduralImage(asset);
      img.onload=()=>{resize();renderPointEditor();draw();};
      imageCache.set(asset.name,img);
      return img;
    }
    if (asset.name === 'handcart-broken') {
      const img = new Image();
      const source = new Image();
      source.onload = () => {
        const c=document.createElement('canvas'); c.width=source.naturalWidth; c.height=source.naturalHeight;
        const cctx=c.getContext('2d'); cctx.drawImage(source,0,0);
        cctx.save(); cctx.globalCompositeOperation='destination-out'; cctx.beginPath(); cctx.arc(400,162,96,0,Math.PI*2); cctx.fill(); cctx.restore();
        img.src=c.toDataURL('image/png');
      };
      img.onload=()=>{resize();renderPointEditor();draw();};
      source.src=`${asset.image}?v=${VERSION}`;
      imageCache.set(asset.name,img);
      return img;
    }
    const img = new Image();
    img.onload = () => { resize(); renderPointEditor(); draw(); };
    img.src = `${asset.image}?v=${VERSION}`;
    imageCache.set(asset.name,img);
    return img;
  }

  function builtInBehaviour(asset) {
    return {...emptyBehaviour,...(asset.behaviour||{})};
  }
  function effectiveBehaviour(asset=state.asset) {
    const b = {...builtInBehaviour(asset),...(behaviourStore[asset.name]||{})};
    if (b.carryable) b.placeable = true;
    if (b.supportSurface) b.solid = true;
    if (b.stackable) b.placeable = true;
    if (b.pushable) b.solid = true;
    return b;
  }
  function effectiveHeight(asset=state.asset) {
    const v = Number(layoutStore[asset.name]?.defaultHeight);
    return Number.isFinite(v) ? clamp(v,0.25,12) : asset.height;
  }
  function effectiveGroundLine(asset=state.asset) {
    const v = Number(layoutStore[asset.name]?.groundLine);
    return Number.isFinite(v) ? clamp(v,0,1) : clamp(Number(asset.groundLine)||0,0,1);
  }
  function effectiveVisual(asset=state.asset) {
    const stored=layoutStore[asset?.name]||{};
    const fallback=asset?.name==='handcart-broken' ? {visualOffsetX:0,visualOffsetY:-.06,visualRotationDeg:-6} : {visualOffsetX:0,visualOffsetY:0,visualRotationDeg:0};
    return {
      x:Number.isFinite(Number(stored.visualOffsetX))?Number(stored.visualOffsetX):fallback.visualOffsetX,
      y:Number.isFinite(Number(stored.visualOffsetY))?Number(stored.visualOffsetY):fallback.visualOffsetY,
      deg:Number.isFinite(Number(stored.visualRotationDeg))?Number(stored.visualRotationDeg):fallback.visualRotationDeg
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
  function effectiveCollision(asset=state.asset) {
    if (Object.prototype.hasOwnProperty.call(collisionStore,asset.name)) return clone(collisionStore[asset.name]);
    return autoCollision(asset);
  }
  function hasCustomCollision(asset=state.asset) {
    return Object.prototype.hasOwnProperty.call(collisionStore,asset.name);
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
    layoutStore[state.asset.name] = {...(layoutStore[state.asset.name]||{}),...patch};
    writeStore(LAYOUT_KEY,layoutStore);
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

  function buildList() {
    listEl.innerHTML='';
    let group='';
    for (const asset of ASSETS.filter(a=>a.scope===state.filter)) {
      if (asset.group!==group) {
        group=asset.group;
        const h=document.createElement('div');h.className='assetlab-group-label';h.textContent=group;listEl.appendChild(h);
      }
      const row=document.createElement('button');row.type='button';row.className='assetlab-asset-row';row.classList.toggle('active',asset.name===state.asset.name);
      row.innerHTML=`<img src="${asset.image}" alt=""><span><strong>${asset.label}</strong><small>${effectiveBehaviour(asset).pushable?'PUSH · ':''}${effectiveBehaviour(asset).supportSurface?'SUPPORT · ':''}${effectiveCollision(asset)?'COLLISION':'NO COLLISION'}</small></span>`;
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
    currentNameEl.textContent=`${state.asset.label}${state.pairMode?' · Pair':''}`;
    stageHelpEl.textContent=state.pairMode
      ? 'Bridge Pair view. Click either piece to edit it. Drag empty space to pan; drag orange points or edge handles. Cyan is Y = 0.'
      : 'Drag empty space to pan. Drag orange points or edge handles. The cyan line is ground level (Y = 0).';
  }

  function selectAsset(asset,{keepView=false}={}) {
    state.asset=asset;
    state.draggingHandle=-1;
    state.draggingEdge=null;
    state.selectedPoint=-1;
    state.selectedEdge=-1;
    state.selectedShape=0;
    if(!keepView){ state.panX=0; state.panY=0; state.viewScale=1; }
    ensureImage(asset);
    if(state.pairMode&&isBridge(asset)) BRIDGE_NAMES.forEach(name=>ensureImage(assetByName(name)));
    updatePairUI();
    syncControls();
    buildList();
  }

  function syncControls() {
    const h=effectiveHeight();
    const floor=effectiveGroundLine();
    heightInput.value=String(h); heightValue.textContent=`${h.toFixed(2)} m`;
    floorInput.value=String(Math.round(floor*100)); floorValue.textContent=`${Math.round(floor*100)}%`;
    const collision=effectiveCollision();
    collisionToggle.textContent=collision ? (hasCustomCollision()?'Use Auto Collision':'Customise Collision') : 'Add Collision';
    collisionToggle.classList.toggle('active',!!collision);
    collisionReset.disabled=!collision;
    depthRow.hidden=!collision;
    pointEditor.hidden=!collision;
    if(collision){
      const width=assetWorldWidth();
      const depth=Math.max(.15,(Number(collision.depthRatio)||.25)*width);
      depthInput.value=String(clamp(depth,.15,2.5)); depthValue.textContent=`${depth.toFixed(2)} m`;
    }
    renderPointEditor();
    renderBehaviours();
    syncMechanismControls();
    syncSocketControls();
    if (brokenCartSection) {
      const broken = state.asset?.name === 'handcart-broken';
      brokenCartSection.hidden = !broken;
      if (broken) {
        const visual = effectiveVisual();
        brokenOffsetXInput.value = String(visual.x);
        brokenOffsetYInput.value = String(visual.y);
        brokenRotationInput.value = String(visual.deg);
        brokenOffsetXValue.textContent = `${visual.x.toFixed(2)} m`;
        brokenOffsetYValue.textContent = `${visual.y.toFixed(2)} m`;
        brokenRotationValue.textContent = `${visual.deg.toFixed(1).replace('.0','')}°`;
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
    behaviourStore[state.asset.name]=Object.fromEntries(behaviourKeys.map(k=>[k,!!next[k]]));
    writeStore(BEHAVIOUR_KEY,behaviourStore);
    renderBehaviours(); buildList(); draw();
  }

  function ensureCustomCollision(asset=state.asset) {
    if(hasCustomCollision(asset)){ ensureCollisionShapes(collisionStore[asset.name]); return collisionStore[asset.name]; }
    const current=effectiveCollision(asset);
    if(!current) return null;
    collisionStore[asset.name]={...current,autoGenerated:false};
    ensureCollisionShapes(collisionStore[asset.name]);
    return collisionStore[asset.name];
  }

  function addOrRemoveCollision() {
    if (hasCustomCollision()) {
      delete collisionStore[state.asset.name];
    } else {
      const current=effectiveCollision();
      collisionStore[state.asset.name]=current ? {...current,autoGenerated:false} : {halfWidthRatio:.5,heightRatio:1,fixedHeight:null,depthRatio:.25,points:defaultPoints(),autoGenerated:false};
      ensureCollisionShapes(collisionStore[state.asset.name]);
    }
    writeStore(COLLISION_KEY,collisionStore); state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0; syncControls(); buildList();
  }
  function fitCollisionRectangle() {
    const points=defaultPoints();
    collisionStore[state.asset.name]={halfWidthRatio:.5,heightRatio:1,fixedHeight:effectiveBehaviour().stackable?STACK_ITEM_HEIGHT:null,depthRatio:.25,points:points.map(p=>({...p})),shapes:[{points:points.map(p=>({...p}))}],autoGenerated:false};
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0;
    writeStore(COLLISION_KEY,collisionStore); syncControls(); buildList();
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
    collisionStore[state.asset.name]=def; state.selectedShape=shapes.length-1; state.selectedPoint=-1; state.selectedEdge=-1;
    writeStore(COLLISION_KEY,collisionStore); renderPointEditor(); buildList(); draw();
  }
  function deleteCollisionBox() {
    const def=ensureCustomCollision(); if(!def) return;
    const shapes=ensureCollisionShapes(def);
    if(shapes.length<=1) return;
    shapes.splice(clamp(state.selectedShape,0,shapes.length-1),1);
    def.shapes=shapes; def.points=shapes[0].points.map(p=>({...p})); def.autoGenerated=false;
    collisionStore[state.asset.name]=def; state.selectedShape=clamp(state.selectedShape,0,shapes.length-1); state.selectedPoint=-1; state.selectedEdge=-1;
    writeStore(COLLISION_KEY,collisionStore); renderPointEditor(); buildList(); draw();
  }

  function resetCurrent() {
    delete behaviourStore[state.asset.name]; delete collisionStore[state.asset.name]; delete layoutStore[state.asset.name]; delete mechanismStore[state.asset.name]; delete socketStore[state.asset.name];
    writeStore(BEHAVIOUR_KEY,behaviourStore); writeStore(COLLISION_KEY,collisionStore); writeStore(LAYOUT_KEY,layoutStore); writeStore(MECHANISM_KEY,mechanismStore); writeStore(SOCKET_KEY,socketStore);
    state.selectedPoint=-1; state.selectedEdge=-1; state.selectedShape=0; syncControls(); buildList();
  }

  function pointToWorld(asset,point) {
    const geo=currentCollisionGeometry(asset); if(!geo) return {x:0,y:0};
    return {
      x:Number(point.x||0)*geo.halfWidth,
      y:Number(point.y||0)*geo.collHeight-effectiveGroundLine(asset)*effectiveHeight(asset)
    };
  }
  function worldToPoint(asset,x,y) {
    const geo=currentCollisionGeometry(asset); if(!geo) return {x:0,y:0};
    return {
      x:x/Math.max(.001,geo.halfWidth),
      y:(y+effectiveGroundLine(asset)*effectiveHeight(asset))/Math.max(.001,geo.collHeight)
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
    collisionStore[asset.name]=def;
    if(write) writeStore(COLLISION_KEY,collisionStore);
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
    const metrics=assets.map(asset=>({
      asset,
      image:ensureImage(asset),
      assetH:effectiveHeight(asset),
      assetW:assetWorldWidth(asset),
      floor:effectiveGroundLine(asset)
    }));
    const totalAssetW=metrics.reduce((sum,m)=>sum+m.assetW,0)+gapM*Math.max(0,metrics.length-1);
    const maxAbove=Math.max(...metrics.map(m=>(1-m.floor)*m.assetH),1);
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
    const height=1.48*r.ppm, radius=.18*r.ppm;
    const x=Math.min(r.w-34,right+Math.max(38,.45*r.ppm)), bottom=r.groundY;
    ctx.save(); ctx.strokeStyle='rgba(113,226,211,.65)'; ctx.fillStyle='rgba(113,226,211,.07)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(x-radius,bottom-height,radius*2,height,Math.min(radius,18)); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(215,255,247,.76)'; ctx.font='700 12px -apple-system,BlinkMacSystemFont,sans-serif'; ctx.fillText('PLAYER',x-radius,bottom-height-8);
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
        if(asset.name==='handcart-broken'){
          const pivotX=ar.drawX+ar.drawW*.5+visual.x*r.ppm;
          const pivotY=ar.drawY+ar.drawH-visual.y*r.ppm;
          ctx.translate(pivotX,pivotY);
          ctx.rotate(-visual.deg*Math.PI/180);
          ctx.drawImage(image,-ar.drawW*.5,-ar.drawH,ar.drawW,ar.drawH);
        }else{
          ctx.drawImage(image,ar.drawX,ar.drawY,ar.drawW,ar.drawH);
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

    ctx.save(); ctx.fillStyle='rgba(238,243,241,.45)'; ctx.font='700 11px -apple-system,BlinkMacSystemFont,sans-serif'; const metres=Math.max(1,Math.floor(100/r.ppm)); const px=metres*r.ppm; const x=18,y=r.h-22; ctx.fillRect(x,y,px,2); ctx.fillText(`${metres} m`,x,y-7); ctx.restore();
  }

  function pointerPos(e){const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};}
  function distanceToSegment(p,a,b){
    const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y; const len2=vx*vx+vy*vy;
    if(len2<=.0001)return Math.hypot(p.x-a.x,p.y-a.y);
    const t=clamp((wx*vx+wy*vy)/len2,0,1); const x=a.x+t*vx,y=a.y+t*vy; return Math.hypot(p.x-x,p.y-y);
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
    const r=state.render||computeRender(), p=pointerPos(e);
    if (state.socketPlacementMode) {
      if (setSocketAtViewportPoint(p,r)) {
        stageHelpEl.textContent='Socket saved to the asset. Every placed copy of this host now inherits it.';
      } else {
        stageHelpEl.textContent='Tap directly on the selected Socket Host artwork.';
      }
      return;
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
    const p=pointerPos(e); const r=state.render||computeRender();
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

  function finishPointer(){
    const changed=state.draggingHandle>=0||!!state.draggingEdge;
    state.draggingHandle=-1; state.draggingEdge=null; state.panning=false; state.pointerStart=null; state.panStart=null;
    if(changed){writeStore(COLLISION_KEY,collisionStore);buildList();renderPointEditor();}
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

  collisionShapeSelect?.addEventListener('change',()=>{state.selectedShape=clamp(Number(collisionShapeSelect.value)||0,0,99);state.selectedPoint=-1;state.selectedEdge=-1;renderPointEditor();draw();});
  collisionAddBoxBtn?.addEventListener('click',addCollisionBox);
  collisionDeleteBoxBtn?.addEventListener('click',deleteCollisionBox);
  heightInput.addEventListener('input',()=>{const v=clamp(Number(heightInput.value)||state.asset.height,.25,12);heightValue.textContent=`${v.toFixed(2)} m`;saveLayout({defaultHeight:v});syncControls();});
  floorInput.addEventListener('input',()=>{const v=clamp((Number(floorInput.value)||0)/100,0,1);floorValue.textContent=`${Math.round(v*100)}%`;saveLayout({groundLine:v});renderPointEditor();draw();});
  brokenOffsetXInput?.addEventListener('input',()=>{const v=clamp(Number(brokenOffsetXInput.value)||0,-1,1);brokenOffsetXValue.textContent=`${v.toFixed(2)} m`;saveLayout({visualOffsetX:v});draw();});
  brokenOffsetYInput?.addEventListener('input',()=>{const v=clamp(Number(brokenOffsetYInput.value)||0,-.75,.75);brokenOffsetYValue.textContent=`${v.toFixed(2)} m`;saveLayout({visualOffsetY:v});draw();});
  brokenRotationInput?.addEventListener('input',()=>{const v=clamp(Number(brokenRotationInput.value)||0,-18,18);brokenRotationValue.textContent=`${v.toFixed(1).replace('.0','')}°`;saveLayout({visualRotationDeg:v});draw();});
  depthInput.addEventListener('input',()=>{const def=ensureCustomCollision();if(!def)return;const width=assetWorldWidth();const depth=clamp(Number(depthInput.value)||.8,.15,2.5);def.depthRatio=depth/Math.max(.001,width);def.autoGenerated=false;collisionStore[state.asset.name]=def;depthValue.textContent=`${depth.toFixed(2)} m`;writeStore(COLLISION_KEY,collisionStore);syncControls();buildList();});
  collisionToggle.addEventListener('click',addOrRemoveCollision);
  collisionReset.addEventListener('click',fitCollisionRectangle);
  resetBtn.addEventListener('click',resetCurrent);
  fitBtn.addEventListener('click',()=>{state.viewScale=1;state.panX=0;state.panY=0;draw();});
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

  filterButtons.forEach(button=>button.addEventListener('click',()=>{
    state.filter=button.dataset.filter; filterButtons.forEach(b=>b.classList.toggle('active',b===button));
    const candidate=ASSETS.find(a=>a.scope===state.filter); if(candidate)selectAsset(candidate); else buildList();
  }));
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('orientationchange',settleViewport,{passive:true});
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  const stageResizeObserver='ResizeObserver' in window ? new ResizeObserver(resize) : null;
  stageResizeObserver?.observe(document.querySelector('.assetlab-stage-wrap'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')settleViewport();});

  ASSETS.slice(0,2).forEach(ensureImage);
  buildList(); selectAsset(ASSETS[0]); settleViewport();
})();
