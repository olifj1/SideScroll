/* SideScroll v1.1.0 — Atlas authoring Stage A.
 * A separate 2D texture-space editor, NEVER a replacement for Part Layout.
 * Legacy Fox procedural meshes are read-only; no conversion or binding here.
 * Source vertices in pixels define UVs by (x / imageWidth, y / imageHeight).
 */
(() => {
  'use strict';
  const core = window.AnimLabCore;
  const extension = document.getElementById('animlab-extension');
  const viewport = document.querySelector('.animlab-viewport');
  if (!core || !extension || !viewport || !window.indexedDB) {
    // IDB-less browsers can still use existing Anim Lab without losing work.
    console.warn('[Atlas] Persistent image storage unavailable. Atlas authoring disabled.');
    return;
  }
  const DOC_KEY = 'sidescroll.animlab.atlas-docs.v1';
  const DB_NAME = 'sidescroll-animlab-art-v1';
  const DB_STORE = 'atlas-images';
  const clone = o => JSON.parse(JSON.stringify(o));
  const bounded = (n, a, b) => Math.min(b, Math.max(a, n));
  const fresh = () => ({schema:'animlab.atlas-document.v1',atlas:null,meshes:[]});
  const parseMap = () => {
    try {
      const obj = JSON.parse(localStorage.getItem(DOC_KEY) || 'null');
      return obj?.schema === 'animlab.atlas-map.v1' && obj.characters && typeof obj.characters === 'object' ? obj : {schema:'animlab.atlas-map.v1',characters:{}};
    } catch (_) { return {schema:'animlab.atlas-map.v1',characters:{}}; }
  };
  function openDB() {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open(DB_NAME,1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('Image database unavailable'));
    });
  }
  async function putImage(key,blob) {
    const db=await openDB();
    try {
      await new Promise((resolve,reject) => {
        const tx=db.transaction(DB_STORE,'readwrite');
        tx.objectStore(DB_STORE).put(blob,key);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error || Error('Image could not be stored'));
        tx.onabort=()=>reject(tx.error || Error('Image storage cancelled'));
      });
    } finally { db.close(); }
  }
  async function getImage(key) {
    const db=await openDB();
    try {
      return await new Promise((resolve,reject) => {
        const tx=db.transaction(DB_STORE,'readonly');
        const req=tx.objectStore(DB_STORE).get(key);
        req.onsuccess=()=>resolve(req.result || null);
        req.onerror=()=>reject(req.error || Error('Image read failed'));
      });
    } finally { db.close(); }
  }
  async function imageFromBlob(blob) {
    const url=URL.createObjectURL(blob);
    try {
      const image=new Image();
      await new Promise((resolve,reject) => {
        image.onload=resolve;
        image.onerror=()=>reject(Error('The selected PNG could not be decoded.'));
        image.src=url;
      });
      return {image,url};
    } catch(err) { URL.revokeObjectURL(url); throw err; }
  }
  const panel=document.createElement('section');
  panel.className='animlab-section animlab-atlas-panel';
  panel.hidden=true;
  panel.innerHTML=`
    <div class="animlab-section-title">Atlas · source meshes (v1.1.0)</div>
    <label class="animlab-atlas-import">PNG atlas <input type="file" accept="image/png" data-atlas="file"></label>
    <div class="animlab-atlas-tools" role="group" aria-label="Atlas tools">
      <button type="button" data-tool="pan">Pan</button><button type="button" data-tool="rect">Rectangle</button><button type="button" data-tool="vertex">Vertices</button><button type="button" data-act="fit">Fit</button>
    </div>
    <div class="animlab-atlas-density"><label>Across <input type="number" data-atlas="cols" value="2" min="1" max="24" step="1"></label>
      <label>Down <input type="number" data-atlas="rows" value="2" min="1" max="24" step="1"></label></div>
    <div class="animlab-atlas-tools"><button type="button" data-act="apply" hidden>Apply rectangle</button><button type="button" data-act="cancel" hidden>Cancel</button></div>
    <p class="animlab-atlas-status" aria-live="polite"></p>
    <div class="animlab-section-title">Source meshes</div><div class="animlab-atlas-list" aria-label="Atlas mesh list"></div>
    <p class="animlab-atlas-warning">Legacy meshes are read-only. New rectangles save in Atlas but do not yet appear in Parts/Skin. Imported PNGs are stored on this device; v205 exports/backups do <strong>not</strong> include image bytes.</p>`;
  extension.insertBefore(panel, extension.firstChild);
  const pick=(attr,val)=>panel.querySelector(`[${attr}="${val}"]`);
  const status=panel.querySelector('.animlab-atlas-status');
  const list=panel.querySelector('.animlab-atlas-list');
  const canvas=document.createElement('canvas');
  canvas.className='animlab-atlas-canvas';
  canvas.setAttribute('aria-label','Atlas source image and mesh editor');
  canvas.hidden=true;
  viewport.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  const state={charId:null,draft:null,saved:null,legacy:null,img:null,imageURL:null,
    imageStatus:'',tool:'pan',selected:null,hidden:new Set(),solo:null,locked:new Set(),
    undo:[],redo:[],pending:null,gesture:null,zoom:1,tx:0,ty:0,loadSerial:0};
  const isActive=s=>s.mode==='setup' && s.setupTool==='atlas';
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const dirty=()=>!!state.saved && !same(state.draft,state.saved);
  const report=text=>{status.textContent=text;};
  const allMeshes=()=>[
    ...(state.legacy?.meshes || []),...(state.draft?.meshes || [])
  ];
  function relevantImage() {
    if (state.draft?.atlas) return state.img;
    if (core.getState().family==='fox') return state.legacy?.image || null;
    return state.img;
  }
  function dims() {
    const img=relevantImage();
    return img && (img.naturalWidth || img.width)>0
      ? {w:img.naturalWidth || img.width,h:img.naturalHeight || img.height} : null;
  }
  function setImage(img,url=null) {
    if (state.imageURL) URL.revokeObjectURL(state.imageURL);
    state.imageURL=url;state.img=img;
    fit(); refresh();
  }
  async function loadStoredImage(id) {
    const current=++state.loadSerial;
    try {
      const blob=await getImage(id);
      if (!blob) throw Error('Saved image bytes are missing on this device. Re-import the PNG; no meshes were changed.');
      const decoded=await imageFromBlob(blob);
      if (current!==state.loadSerial) {URL.revokeObjectURL(decoded.url);return;}
      setImage(decoded.image,decoded.url);
      state.imageStatus=`Local PNG · ${decoded.image.naturalWidth} × ${decoded.image.naturalHeight}`;
    } catch(err) {
      if(current!==state.loadSerial)return;
      setImage(null);state.imageStatus=err.message;
    }
    refresh();
  }
  function loadCharacter(s) {
    if(state.charId===s.characterId)return;
    state.loadSerial++;
    state.charId=s.characterId;
    state.legacy=null;
    list.dataset.signature='';
    const map=parseMap();
    const doc=map.characters[s.characterId];
    state.draft=doc?.schema==='animlab.atlas-document.v1' ? clone(doc) : fresh();
    state.saved=clone(state.draft);
    state.selected=null;state.hidden.clear();state.locked.clear();state.solo=null;
    state.undo=[];state.redo=[];state.pending=null;state.gesture=null;
    setImage(null);
    state.imageStatus='';
    if(state.draft.atlas?.kind==='indexeddb'&&state.draft.atlas.id)loadStoredImage(state.draft.atlas.id);
    else if(s.family!=='fox' && s.character.atlas) {
      const current=++state.loadSerial, image=new Image();
      image.onload=()=>{if(current!==state.loadSerial)return;setImage(image);refresh();};
      image.onerror=()=>{if(current===state.loadSerial){state.imageStatus='Bundled atlas unavailable';refresh();}};
      image.src=s.character.atlas;
    }
  }
  function updateLegacy(s) {
    const previousImage = state.legacy?.image;
    state.legacy=isActive(s) && s.family==='fox' && !state.draft.atlas
      ? window.AnimLabLegacyAtlas?.getSnapshot?.() || null : null;
    // The bundled Fox atlas loads after the stage may already be open.
    // Initialise its view once, rather than displaying a cropped 1:1 corner.
    if (state.legacy?.image && previousImage !== state.legacy.image) fit();
  }
  function fit() {
    const d=dims();if(!d)return;
    const w=canvas.clientWidth||viewport.clientWidth||600,h=canvas.clientHeight||viewport.clientHeight||340;
    state.zoom=Math.min((w-20)/d.w,(h-20)/d.h);
    state.zoom=Math.max(0.03,state.zoom);
    state.tx=(w-d.w*state.zoom)/2;state.ty=(h-d.h*state.zoom)/2;
  }
  function screenToAtlas(x,y) {return{x:(x-state.tx)/state.zoom,y:(y-state.ty)/state.zoom};}
  function pixelPos(e) {const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  const shown=m=>!state.hidden.has(m.id) && (!state.solo || state.solo===m.id);
  function layout() {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w || !h) return;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const W=Math.round(w*dpr),H=Math.round(h*dpr);
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;ctx.setTransform(dpr,0,0,dpr,0,0);}
    else ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#17252c';ctx.fillRect(0,0,w,h);
    const img=relevantImage(),d=dims();
    if(!d) {
      ctx.font='13px system-ui';ctx.fillStyle='#d2dfe1';ctx.fillText('Atlas image loading · select a PNG',16,30);
      return;
    }
    ctx.save();ctx.translate(state.tx,state.ty);ctx.scale(state.zoom,state.zoom);
    ctx.fillStyle='#9da9af';ctx.fillRect(0,0,d.w,d.h);
    const check=Math.max(4,Math.min(d.w,d.h)/26);
    for(let y=0;y<d.h;y+=check)for(let x=0;x<d.w;x+=check){if((Math.floor(x/check)+Math.floor(y/check))%2){ctx.fillStyle='#b6c0c4';ctx.fillRect(x,y,check,check);}}
    ctx.drawImage(img,0,0,d.w,d.h);
    ctx.lineWidth=2/state.zoom;ctx.strokeStyle='rgba(240,250,255,.65)';ctx.strokeRect(0,0,d.w,d.h);
    const meshes=allMeshes();
    for(const m of meshes) {
      if(!shown(m))continue;
      const chosen=m.id===state.selected;
      ctx.strokeStyle=chosen?'#ffdf80':(m.readOnly?'#91c7e7':'#76e2b7');
      ctx.fillStyle=chosen?'rgba(255,209,98,.10)':(m.readOnly?'rgba(67,149,225,.035)':'rgba(66,220,156,.06)');
      ctx.lineWidth=(chosen?2.5:1.2)/state.zoom;
      for(const tri of m.triangles) {
        const [a,b,c]=tri.map(i=>m.vertices[i]);if(!a||!b||!c)continue;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();ctx.stroke();
      }
      if(chosen)for(const v of m.vertices){ctx.beginPath();ctx.fillStyle=m.readOnly?'#98bdd8':'#ffe09b';ctx.arc(v.x,v.y,Math.min(13,4.8/state.zoom),0,Math.PI*2);ctx.fill();}
    }
    if(state.pending){const p=state.pending;ctx.strokeStyle='#fff4a4';ctx.setLineDash([8/state.zoom,6/state.zoom]);ctx.lineWidth=2/state.zoom;ctx.strokeRect(p.x,p.y,p.w,p.h);ctx.setLineDash([]);}
    ctx.restore();
  }
  function refreshList() {
    const meshes=allMeshes();
    const signature=JSON.stringify([meshes.map(m=>[m.id,m.name,m.vertices.length,!!m.readOnly]),state.selected,[...state.hidden],state.solo,[...state.locked]]);
    if(list.dataset.signature===signature)return;
    list.dataset.signature=signature;
    list.replaceChildren();
    for(const m of meshes){
      const row=document.createElement('div');row.className='animlab-atlas-item';
      const name=document.createElement('button');name.type='button';name.textContent=m.name+(m.readOnly?' · legacy':'');
      name.classList.toggle('active',m.id===state.selected);
      name.addEventListener('click',()=>{state.selected=m.id;refresh();});row.append(name);
      const add=(label, title, fn, pressed=false)=>{
        const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.title=title;
        btn.setAttribute('aria-pressed',String(pressed));btn.addEventListener('click',fn);row.append(btn);
      };
      add(state.hidden.has(m.id)?'Show':'Hide','Display-only visibility',()=>{
        state.hidden.has(m.id)?state.hidden.delete(m.id):state.hidden.add(m.id);refresh();
      });
      add(state.solo===m.id?'All':'Solo','Display only; does not change draw order',()=>{state.solo=state.solo===m.id?null:m.id;refresh();});
      add(state.locked.has(m.id)?'Unlock':'Lock','Editor interaction only',()=>{state.locked.has(m.id)?state.locked.delete(m.id):state.locked.add(m.id);refresh();});
      list.append(row);
    }
  }
  function refresh() {
    if(!state.draft)return;
    refreshList();
    panel.querySelectorAll('[data-tool]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tool===state.tool));
    pick('data-act','apply').hidden=!state.pending;
    pick('data-act','cancel').hidden=!state.pending;
    const d=dims();
    report(state.imageStatus || (d ? `${d.w} × ${d.h} px · ${allMeshes().length} mesh(es) · ${dirty()?'UNSAVED':'Saved'}` : 'Choose a PNG or allow bundled art to load.'));
    layout();
  }
  function modify(fn) {
    const before=clone(state.draft);fn();
    if(same(before,state.draft))return false;
    state.undo.push(before);if(state.undo.length>70)state.undo.shift();state.redo=[];
    core.redraw();return true;
  }
  function undo() {if(!state.undo.length)return false;state.redo.push(clone(state.draft));state.draft=state.undo.pop();state.pending=null;state.loadSerial++;if(state.draft.atlas?.kind==='indexeddb')loadStoredImage(state.draft.atlas.id);else if(state.imageURL)setImage(null);refresh();return true;}
  function redo() {if(!state.redo.length)return false;state.undo.push(clone(state.draft));state.draft=state.redo.pop();state.pending=null;state.loadSerial++;if(state.draft.atlas?.kind==='indexeddb')loadStoredImage(state.draft.atlas.id);else if(state.imageURL)setImage(null);refresh();return true;}
  function rectangle(box,cols,rows) {
    const vertices=[],triangles=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)vertices.push({x:box.x+box.w*x/cols,y:box.y+box.h*y/rows});
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
      if((x+y)%2)triangles.push([a,b,d],[a,d,c]);
      else triangles.push([a,b,c],[b,d,c]);
    }
    return {vertices,triangles,generator:{type:'rectangle',x:box.x,y:box.y,w:box.w,h:box.h,cols,rows}};
  }
  function applyPending() {
    const p=state.pending, d=dims();if(!p||!d)return;
    if(p.w<4 || p.h<4)return report('Draw a rectangle at least 4 × 4 atlas pixels.');
    const cols=bounded(Number(pick('data-atlas','cols').value)||1,1,24)|0;
    const rows=bounded(Number(pick('data-atlas','rows').value)||1,1,24)|0;
    const name=window.prompt('Name this source mesh',`Part ${state.draft.meshes.length+1}`);
    if(name===null)return;
    const label=name.trim().slice(0,50)||`Part ${state.draft.meshes.length+1}`;
    const id='atlas-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const geom=rectangle(p,cols,rows);
    modify(()=>state.draft.meshes.push({id,name:label,kind:'rectangle',...geom}));
    state.selected=id;state.pending=null;state.tool='vertex';refresh();
  }
  function findHit(pt) {
    const meshes=allMeshes().filter(shown).reverse();
    const dist=16/state.zoom;
    for(const m of meshes)if(!m.readOnly && !state.locked.has(m.id)){
      for(let i=0;i<m.vertices.length;i++) {
        const v=m.vertices[i];if(Math.hypot(v.x-pt.x,v.y-pt.y)<=dist)return {mesh:m,index:i};
      }
    }
    for(const m of meshes)if(!state.locked.has(m.id)){
      const vs=m.vertices;
      if(vs.length && pt.x>=Math.min(...vs.map(v=>v.x))-dist && pt.x<=Math.max(...vs.map(v=>v.x))+dist && pt.y>=Math.min(...vs.map(v=>v.y))-dist && pt.y<=Math.max(...vs.map(v=>v.y))+dist)return {mesh:m,index:-1};
    }
    return null;
  }
  const pointers=new Map();
  function pointerDown(e) {
    if(e.button!==0||!isActive(core.getState()))return;
    canvas.setPointerCapture(e.pointerId);
    const pos=pixelPos(e);pointers.set(e.pointerId,pos);
    if(pointers.size>1){state.gesture=null;return;}
    const pt=screenToAtlas(pos.x,pos.y),d=dims();
    if(!d)return;
    if(state.tool==='rect'){
      state.gesture={type:'rectangle',start:pt};state.pending=null;
    }else if(state.tool==='vertex'){
      const hit=findHit(pt);
      if(hit){state.selected=hit.mesh.id;
        if(hit.index>=0 && !hit.mesh.readOnly){state.gesture={type:'vertex',id:hit.mesh.id,index:hit.index,before:clone(state.draft)};}
      }else state.gesture={type:'pan',x:pos.x,y:pos.y,tx:state.tx,ty:state.ty};
    }else state.gesture={type:'pan',x:pos.x,y:pos.y,tx:state.tx,ty:state.ty};
    refresh();
  }
  function pointerMove(e) {
    if(!pointers.has(e.pointerId))return;
    const pos=pixelPos(e);pointers.set(e.pointerId,pos);
    if(pointers.size===2){
      const ps=[...pointers.values()];const distance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
      const center={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};
      if(!state.pinch)state.pinch={distance,zoom:state.zoom,tx:state.tx,ty:state.ty,center};
      const f=bounded(distance/Math.max(1,state.pinch.distance),.2,5);
      const next=bounded(state.pinch.zoom*f,.03,12);
      const anchor={x:(state.pinch.center.x-state.pinch.tx)/state.pinch.zoom,y:(state.pinch.center.y-state.pinch.ty)/state.pinch.zoom};
      state.zoom=next;state.tx=center.x-anchor.x*next;state.ty=center.y-anchor.y*next;layout();return;
    }
    const g=state.gesture;if(!g)return;
    const pt=screenToAtlas(pos.x,pos.y),d=dims();if(!d)return;
    if(g.type==='pan'){state.tx=g.tx+pos.x-g.x;state.ty=g.ty+pos.y-g.y;}
    else if(g.type==='rectangle'){
      const x=bounded(pt.x,0,d.w),y=bounded(pt.y,0,d.h);
      state.pending={x:Math.min(g.start.x,x),y:Math.min(g.start.y,y),w:Math.abs(x-g.start.x),h:Math.abs(y-g.start.y)};
    }else if(g.type==='vertex'){
      const m=state.draft.meshes.find(v=>v.id===g.id);
      if(m){m.vertices[g.index]={x:bounded(pt.x,0,d.w),y:bounded(pt.y,0,d.h)};m.generator.edited=true;}
    }
    layout();
  }
  function pointerUp(e) {
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);
    if(pointers.size<2)state.pinch=null;
    const g=state.gesture;
    if(g?.type==='vertex' && !same(g.before,state.draft)){
      const after=clone(state.draft);
      state.draft=g.before;
      modify(()=>{state.draft=after;});
    }
    state.gesture=null;refresh();
  }
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('wheel',e=>{
    if(!isActive(core.getState()))return;
    e.preventDefault();const p=pixelPos(e),pt=screenToAtlas(p.x,p.y);
    state.zoom=bounded(state.zoom*(e.deltaY<0?1.11:1/1.11),.03,12);
    state.tx=p.x-pt.x*state.zoom;state.ty=p.y-pt.y*state.zoom;layout();
  },{passive:false});
  panel.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{state.tool=btn.dataset.tool;state.pending=null;refresh();}));
  pick('data-act','fit').addEventListener('click',()=>{fit();refresh();});
  pick('data-act','apply').addEventListener('click',applyPending);
  pick('data-act','cancel').addEventListener('click',()=>{state.pending=null;refresh();});
  pick('data-atlas','file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(file.type!=='image/png' || file.size>16*1024*1024)return report('Use a PNG smaller than 16 MB.');
    const charId=state.charId,token=++state.loadSerial;
    try {
      const decoded=await imageFromBlob(file);
      const image=decoded.image;
      if(image.naturalWidth>8192||image.naturalHeight>8192||image.naturalWidth<8||image.naturalHeight<8)
        throw Error('PNG must be 8–8192 pixels in each dimension.');
      const probe=document.createElement('canvas');probe.width=24;probe.height=24;
      const probeCtx=probe.getContext('2d',{willReadFrequently:true});probeCtx.drawImage(image,0,0,24,24);
      const alpha=probeCtx.getImageData(0,0,24,24).data;
      let transparent=false;
      for(let i=3;i<alpha.length;i+=4)if(alpha[i]<252){transparent=true;break;}
      if(!transparent) throw Error('PNG has no visible transparency; use an alpha atlas.');
      if(token!==state.loadSerial || charId!==state.charId){URL.revokeObjectURL(decoded.url);return;}
      if(state.draft.meshes.length && !confirm('Replace the Atlas image reference? Existing source mesh positions stay in pixels; check their alignment carefully.')){
        URL.revokeObjectURL(decoded.url);return;
      }
      const id='image-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
      await putImage(id,file);
      if(token!==state.loadSerial || charId!==state.charId){URL.revokeObjectURL(decoded.url);return;}
      modify(()=>state.draft.atlas={kind:'indexeddb',id,name:file.name.slice(0,120),width:image.naturalWidth,height:image.naturalHeight,bytes:file.size});
      setImage(image,decoded.url);
      state.imageStatus=`Imported ${image.naturalWidth} × ${image.naturalHeight} · Save to attach. Not included in backup exports.`;
      refresh();
    } catch(err){state.imageStatus=err.message||String(err);refresh();}
  });
  core.registerSessionParticipant('atlas',{
    isDirty:dirty,canUndo:()=>state.undo.length>0,canRedo:()=>state.redo.length>0,
    undo,redo,
    save:()=>{
      if(!dirty())return true;
      const map=parseMap();map.characters[state.charId]=clone(state.draft);
      localStorage.setItem(DOC_KEY,JSON.stringify(map));
      state.saved=clone(state.draft);state.undo=[];state.redo=[];refresh();return true;
    },
    discard:()=>{if(!state.saved)return;state.draft=clone(state.saved);state.undo=[];state.redo=[];state.pending=null;
      if(state.draft.atlas?.kind==='indexeddb')loadStoredImage(state.draft.atlas.id);
      else if(state.imageURL)setImage(null);
      refresh();}
  });
  core.subscribe(s=>{
    loadCharacter(s);updateLegacy(s);
    const active=isActive(s);
    panel.hidden=!active;canvas.hidden=!active;
    if(active){
      // Source image is displayed on its own canvas; assembled artwork, skeleton
      // and the old pan/drag surface remain unchanged in every other stage.
      refresh();
    }
  });
  const observer=new ResizeObserver(()=>{if(isActive(core.getState()))layout();});
  observer.observe(viewport);
  // Test/diagnostic surface: reads are clones; never allows direct mutation.
  window.AnimLabAtlasInspect=Object.freeze({getDocument:()=>state.draft?clone(state.draft):null,
    getLegacyCount:()=>state.legacy?.meshes?.length||0,
    getUVs:()=>{const d=dims();return d?state.draft.meshes.map(m=>({id:m.id,uvs:m.vertices.map(v=>({u:v.x/d.w,v:v.y/d.h}))})):[];}});
  const s=core.getState();loadCharacter(s);updateLegacy(s);panel.hidden=!isActive(s);canvas.hidden=!isActive(s);
  if(isActive(s))refresh();
})();
