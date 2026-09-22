(() => {
  'use strict';

  const VERSION = '1.0.9';
  const BEHAVIOUR_KEY = 'sidescroll.asset-behaviours.v1';
  const COLLISION_KEY = 'sidescroll.asset-collisions.v1';
  const LAYOUT_KEY = 'sidescroll.asset-layout.v1';
  const STACK_ITEM_HEIGHT = 0.68;
  const behaviourKeys = ['solid','carryable','placeable','supportSurface','stackable','socketHost','socketPiece'];
  const emptyBehaviour = { solid:false, carryable:false, placeable:false, supportSurface:false, stackable:false, socketHost:false, socketPiece:false };

  const ASSETS = [
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-left',label:'Broken Bridge · Left',image:'bridge-left.png',height:2.20,groundLine:1.62/2.20,behaviour:{solid:true,supportSurface:true}},
    {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-right',label:'Broken Bridge · Right',image:'bridge-right.png',height:2.20,groundLine:1.58/2.20,behaviour:{solid:true,supportSurface:true}},
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
  const heightInput = document.getElementById('assetlab-height');
  const heightValue = document.getElementById('assetlab-height-value');
  const floorInput = document.getElementById('assetlab-floor');
  const floorValue = document.getElementById('assetlab-floor-value');
  const collisionToggle = document.getElementById('assetlab-collision-toggle');
  const collisionReset = document.getElementById('assetlab-collision-reset');
  const depthRow = document.getElementById('assetlab-depth-row');
  const depthInput = document.getElementById('assetlab-depth');
  const depthValue = document.getElementById('assetlab-depth-value');
  const behavioursEl = document.getElementById('assetlab-behaviours');
  const resetBtn = document.getElementById('assetlab-reset');
  const fitBtn = document.getElementById('assetlab-fit');
  const referenceBtn = document.getElementById('assetlab-reference');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];

  const readStore = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  };
  let behaviourStore = readStore(BEHAVIOUR_KEY);
  let collisionStore = readStore(COLLISION_KEY);
  let layoutStore = readStore(LAYOUT_KEY);

  const state = {
    filter:'puzzle',
    asset:ASSETS[0],
    image:null,
    showReference:true,
    draggingHandle:-1,
    viewScale:1,
    render:null
  };

  const defaultPoints = () => [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}];
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

  function builtInBehaviour(asset) {
    return {...emptyBehaviour,...(asset.behaviour||{})};
  }
  function effectiveBehaviour(asset=state.asset) {
    const b = {...builtInBehaviour(asset),...(behaviourStore[asset.name]||{})};
    if (b.carryable) b.placeable = true;
    if (b.supportSurface) b.solid = true;
    if (b.stackable) b.placeable = true;
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
  function behaviourNeedsCollision(behaviour) {
    return !!(behaviour?.solid || behaviour?.carryable || behaviour?.supportSurface || behaviour?.stackable);
  }
  function autoCollision(asset=state.asset) {
    if (asset.collision) return clone(asset.collision);
    const behaviour=effectiveBehaviour(asset);
    if (!behaviourNeedsCollision(behaviour)) return null;
    const height=effectiveHeight(asset);
    const aspect=state.asset===asset && state.image?.naturalWidth && state.image?.naturalHeight
      ? state.image.naturalWidth/state.image.naturalHeight : 1;
    const width=Math.max(.001,height*aspect);
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

  function buildList() {
    listEl.innerHTML='';
    let group='';
    for (const asset of ASSETS.filter(a=>a.scope===state.filter)) {
      if (asset.group!==group) {
        group=asset.group;
        const h=document.createElement('div');h.className='assetlab-group-label';h.textContent=group;listEl.appendChild(h);
      }
      const row=document.createElement('button');row.type='button';row.className='assetlab-asset-row';row.classList.toggle('active',asset.name===state.asset.name);
      row.innerHTML=`<img src="${asset.image}" alt=""><span><strong>${asset.label}</strong><small>${effectiveBehaviour(asset).supportSurface?'SUPPORT · ':''}${effectiveCollision(asset)?'COLLISION':'NO COLLISION'}</small></span>`;
      row.addEventListener('click',()=>selectAsset(asset));
      listEl.appendChild(row);
    }
  }

  function selectAsset(asset) {
    state.asset=asset;
    state.draggingHandle=-1;
    currentNameEl.textContent=asset.label;
    const img=new Image();
    img.onload=()=>{ state.image=img; syncControls(); resize(); };
    img.src=asset.image+`?v=${VERSION}`;
    state.image=img;
    syncControls();
    buildList();
  }

  function syncControls() {
    const h=effectiveHeight();
    const floor=effectiveGroundLine();
    heightInput.value=String(h);heightValue.textContent=`${h.toFixed(2)} m`;
    floorInput.value=String(Math.round(floor*100));floorValue.textContent=`${Math.round(floor*100)}%`;
    const collision=effectiveCollision();
    collisionToggle.textContent=collision ? (hasCustomCollision()?'Use Auto Collision':'Customise Collision') : 'Add Collision';
    collisionToggle.classList.toggle('active',!!collision);
    collisionReset.disabled=!collision;
    depthRow.hidden=!collision;
    if(collision){
      const width=assetWorldWidth();
      const depth=Math.max(.15,(Number(collision.depthRatio)||.25)*width);
      depthInput.value=String(clamp(depth,.15,2.5));depthValue.textContent=`${depth.toFixed(2)} m`;
    }
    renderBehaviours();
    draw();
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
      ['socketHost','Socket Host','Can contain authored sockets.'],
      ['socketPiece','Socket Piece','Can be assigned to an authored socket.']
    ];
    for(const [key,label,desc] of defs){
      const button=document.createElement('button');button.type='button';button.className='assetlab-behaviour';button.classList.toggle('active',!!behaviour[key]);button.setAttribute('aria-pressed',String(!!behaviour[key]));
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
    behaviourStore[state.asset.name]=Object.fromEntries(behaviourKeys.map(k=>[k,!!next[k]]));
    writeStore(BEHAVIOUR_KEY,behaviourStore);
    renderBehaviours();buildList();draw();
  }

  function assetWorldWidth() {
    const h=effectiveHeight();
    const aspect=state.image?.naturalWidth&&state.image?.naturalHeight?state.image.naturalWidth/state.image.naturalHeight:1;
    return h*aspect;
  }

  function currentCollisionGeometry() {
    const def=effectiveCollision();if(!def)return null;
    const width=assetWorldWidth();const height=effectiveHeight();
    const halfWidth=Math.max(.01,(Number(def.halfWidthRatio)||.5)*width);
    const collHeight=Number.isFinite(def.fixedHeight)?Number(def.fixedHeight):Math.max(.01,(Number(def.heightRatio)||1)*height);
    const points=Array.isArray(def.points)&&def.points.length>=3?def.points:defaultPoints();
    return {def,width,height,halfWidth,collHeight,points};
  }

  function addOrRemoveCollision() {
    if (hasCustomCollision()) {
      delete collisionStore[state.asset.name];
    } else {
      const current=effectiveCollision();
      collisionStore[state.asset.name]=current ? {...current,autoGenerated:false} : {halfWidthRatio:.5,heightRatio:1,fixedHeight:null,depthRatio:.25,points:defaultPoints()};
    }
    writeStore(COLLISION_KEY,collisionStore);syncControls();buildList();
  }
  function fitCollisionRectangle() {
    collisionStore[state.asset.name]={halfWidthRatio:.5,heightRatio:1,fixedHeight:effectiveBehaviour().stackable?STACK_ITEM_HEIGHT:null,depthRatio:.25,points:defaultPoints()};
    writeStore(COLLISION_KEY,collisionStore);syncControls();buildList();
  }

  function resetCurrent() {
    delete behaviourStore[state.asset.name];delete collisionStore[state.asset.name];delete layoutStore[state.asset.name];
    writeStore(BEHAVIOUR_KEY,behaviourStore);writeStore(COLLISION_KEY,collisionStore);writeStore(LAYOUT_KEY,layoutStore);
    syncControls();buildList();
  }

  function resize() {
    const rect=canvas.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }

  function computeRender() {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    const assetH=effectiveHeight(),assetW=assetWorldWidth();
    const spanW=Math.max(assetW+2.2,5.2),spanH=Math.max(assetH+2.0,3.6);
    const ppm=Math.min((w-70)/spanW,(h-54)/spanH)*state.viewScale;
    const groundY=Math.round(h*.68);
    const floor=effectiveGroundLine();
    const drawH=assetH*ppm,drawW=assetW*ppm;
    const x=(w-drawW)/2;
    const y=groundY-(1-floor)*drawH;
    state.render={w,h,ppm,groundY,floor,drawX:x,drawY:y,drawW,drawH,assetH,assetW};
    return state.render;
  }

  function drawGrid(r) {
    ctx.clearRect(0,0,r.w,r.h);
    const grad=ctx.createLinearGradient(0,0,0,r.h);grad.addColorStop(0,'#26333a');grad.addColorStop(1,'#11191e');ctx.fillStyle=grad;ctx.fillRect(0,0,r.w,r.h);
    ctx.save();ctx.strokeStyle='rgba(219,233,228,.055)';ctx.lineWidth=1;
    const step=Math.max(28,r.ppm);
    for(let x=r.w/2%step;x<r.w;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,r.h);ctx.stroke();}
    for(let y=r.groundY%step;y<r.h;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.w,y);ctx.stroke();}
    for(let y=r.groundY-step;y>0;y-=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.w,y);ctx.stroke();}
    ctx.restore();
  }

  function drawReference(r) {
    if(!state.showReference)return;
    const height=1.48*r.ppm;const radius=.18*r.ppm;const x=Math.min(r.w-34,r.drawX+r.drawW+Math.max(38,.45*r.ppm));const bottom=r.groundY;
    ctx.save();ctx.strokeStyle='rgba(113,226,211,.65)';ctx.fillStyle='rgba(113,226,211,.07)';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(x-radius,bottom-height,radius*2,height,Math.min(radius,18));ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(215,255,247,.76)';ctx.font='700 10px -apple-system,BlinkMacSystemFont,sans-serif';ctx.fillText('PLAYER',x-radius,bottom-height-8);
    ctx.restore();
  }

  function collisionScreenPoints(r) {
    const geo=currentCollisionGeometry();if(!geo)return [];
    const objBottom=r.groundY+r.floor*r.drawH;
    return geo.points.map((p,index)=>({index,x:r.w/2+p.x*geo.halfWidth*r.ppm,y:objBottom-p.y*geo.collHeight*r.ppm}));
  }

  function draw() {
    if(!canvas.clientWidth||!canvas.clientHeight)return;
    const r=computeRender();drawGrid(r);
    ctx.save();ctx.strokeStyle='rgba(114,230,208,.92)';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(0,r.groundY);ctx.lineTo(r.w,r.groundY);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#bafbf0';ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';ctx.fillText(`FLOOR · ${Math.round(r.floor*100)}%`,12,r.groundY-9);ctx.restore();
    if(state.image?.complete&&state.image.naturalWidth){ctx.drawImage(state.image,r.drawX,r.drawY,r.drawW,r.drawH);}
    drawReference(r);
    const points=collisionScreenPoints(r);
    if(points.length>=3){
      const support=effectiveBehaviour().supportSurface;
      ctx.save();ctx.fillStyle=support?'rgba(239,184,102,.14)':'rgba(233,118,101,.12)';ctx.strokeStyle=support?'#efb866':'#e97665';ctx.lineWidth=2;ctx.setLineDash(support?[]:[6,4]);ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
      points.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.index===state.draggingHandle?8:6,0,Math.PI*2);ctx.fillStyle=p.index===state.draggingHandle?'#ff4f95':'#f1b56a';ctx.strokeStyle='#3a2c24';ctx.lineWidth=1.5;ctx.fill();ctx.stroke();});ctx.restore();
    }
    ctx.save();ctx.fillStyle='rgba(238,243,241,.45)';ctx.font='700 10px -apple-system,BlinkMacSystemFont,sans-serif';const metres=Math.max(1,Math.floor(100/r.ppm));const px=metres*r.ppm;const x=18,y=r.h-22;ctx.fillRect(x,y,px,2);ctx.fillText(`${metres} m`,x,y-7);ctx.restore();
  }

  function pointerPos(e){const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};}
  function pickHandle(e){const p=pointerPos(e);return collisionScreenPoints(state.render||computeRender()).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<=20)||null;}
  canvas.addEventListener('pointerdown',e=>{const handle=pickHandle(e);if(!handle)return;state.draggingHandle=handle.index;canvas.setPointerCapture(e.pointerId);draw();});
  canvas.addEventListener('pointermove',e=>{
    if(state.draggingHandle<0)return;const geo=currentCollisionGeometry();const r=state.render||computeRender();if(!geo)return;const p=pointerPos(e);const objBottom=r.groundY+r.floor*r.drawH;
    const nx=clamp((p.x-r.w/2)/(geo.halfWidth*r.ppm),-4,4);const ny=clamp((objBottom-p.y)/(geo.collHeight*r.ppm),-.2,3);
    const def=effectiveCollision();const points=Array.isArray(def.points)&&def.points.length>=3?def.points.map(q=>({...q})):defaultPoints();points[state.draggingHandle]={x:nx,y:ny};def.points=points;def.autoGenerated=false;collisionStore[state.asset.name]=def;draw();
  });
  const finishDrag=()=>{if(state.draggingHandle<0)return;state.draggingHandle=-1;writeStore(COLLISION_KEY,collisionStore);buildList();draw();};
  canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);

  heightInput.addEventListener('input',()=>{const v=clamp(Number(heightInput.value)||state.asset.height,.25,12);heightValue.textContent=`${v.toFixed(2)} m`;saveLayout({defaultHeight:v});syncControls();});
  floorInput.addEventListener('input',()=>{const v=clamp((Number(floorInput.value)||0)/100,0,1);floorValue.textContent=`${Math.round(v*100)}%`;saveLayout({groundLine:v});draw();});
  depthInput.addEventListener('input',()=>{const def=effectiveCollision();if(!def)return;const width=assetWorldWidth();const depth=clamp(Number(depthInput.value)||.8,.15,2.5);def.depthRatio=depth/Math.max(.001,width);def.autoGenerated=false;collisionStore[state.asset.name]=def;depthValue.textContent=`${depth.toFixed(2)} m`;writeStore(COLLISION_KEY,collisionStore);syncControls();buildList();});
  collisionToggle.addEventListener('click',addOrRemoveCollision);collisionReset.addEventListener('click',fitCollisionRectangle);resetBtn.addEventListener('click',resetCurrent);
  fitBtn.addEventListener('click',()=>{state.viewScale=1;draw();});
  referenceBtn.addEventListener('click',()=>{state.showReference=!state.showReference;referenceBtn.classList.toggle('active',state.showReference);referenceBtn.setAttribute('aria-pressed',String(state.showReference));draw();});
  filterButtons.forEach(button=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;filterButtons.forEach(b=>b.classList.toggle('active',b===button));const candidate=ASSETS.find(a=>a.scope===state.filter);if(candidate)selectAsset(candidate);else buildList();}));
  window.addEventListener('resize',resize);

  buildList();selectAsset(ASSETS[0]);resize();
})();
