/* SideScroll v1.1.2 — Atlas authoring Stage B.
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
  const VIEW_KEY = 'sidescroll.animlab.atlas-view.v1'; // Editor preference; never alters character data.
  const WIRES_KEY = 'sidescroll.animlab.atlas-wires.v1';
  function initialBackdrop() {
    try {return localStorage.getItem(VIEW_KEY)==='checker'?'checker':'dark';}
    catch (_) {return 'dark';}
  }
  function initialWires(){
    try {const v=localStorage.getItem(WIRES_KEY);return ['all','selected','off'].includes(v)?v:'all';}
    catch(_) {return 'all';}
  }
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
    <div class="animlab-section-title">Atlas · source mesh editor</div>
    <label class="animlab-atlas-import">PNG atlas <input type="file" accept="image/png" data-atlas="file"></label>
    <label class="animlab-atlas-backdrop">Transparent pixels <select data-atlas="backdrop" aria-label="Transparent-pixel background"><option value="dark">Dark background</option><option value="checker">Checkerboard</option></select></label>
    <label class="animlab-atlas-backdrop">Wireframes <select data-atlas="wires" aria-label="Mesh wireframes"><option value="all">All meshes</option><option value="selected">Selected only</option><option value="off">Off</option></select></label>
    <div class="animlab-atlas-control-group"><div class="animlab-atlas-group-label">Navigate</div>
      <div class="animlab-atlas-tools"><button type="button" data-tool="pan">Pan</button><button type="button" data-act="fit">Fit</button><button type="button" data-act="zoom-out" aria-label="Zoom out">−</button><button type="button" data-act="zoom-in" aria-label="Zoom in">+</button></div>
    </div>
    <div class="animlab-atlas-control-group"><div class="animlab-atlas-group-label">Create mesh</div>
      <div class="animlab-atlas-tools three"><button type="button" data-tool="rect">Rectangle</button><button type="button" data-tool="outline">Outline spline</button><button type="button" data-tool="strip">Spline strip</button></div>
      <div class="animlab-atlas-density" data-settings="rect"><label>Across (columns) <input type="number" data-atlas="cols" value="2" min="1" max="24" step="1" title="Number of mesh cells across the rectangle"></label>
        <label>Down (rows) <input type="number" data-atlas="rows" value="2" min="1" max="24" step="1" title="Number of mesh cells down the rectangle"></label></div>
      <div class="animlab-atlas-density" data-settings="outline" hidden><label>Curve detail <input type="number" data-atlas="curve" value="3" min="1" max="8" step="1" title="Interpolated segments between outline points"></label>
        <label>Fill detail <input type="number" data-atlas="fill" value="0" min="0" max="2" step="1" title="Interior triangle subdivisions"></label></div>
      <div class="animlab-atlas-density" data-settings="strip" hidden><label>Width px <input type="number" data-atlas="width" value="65" min="2" max="1000" step="1" title="Full width of strip across its centreline"></label>
        <label>Tip % <input type="number" data-atlas="taper" value="65" min="5" max="200" step="5" title="End width as a percentage of start width"></label>
        <label>Across <input type="number" data-atlas="stripcols" value="2" min="1" max="12" step="1" title="Cells across strip width"></label>
        <label>Along <input type="number" data-atlas="striprows" value="3" min="1" max="12" step="1" title="Segments between centreline points"></label></div>
      <p class="animlab-atlas-hint" data-atlas="hint">Drag a rectangle over the image.</p>
      <div class="animlab-atlas-tools three"><button type="button" data-act="apply" hidden>Create rectangle</button><button type="button" data-act="finish" hidden>Finish spline</button><button type="button" data-act="cancel" hidden>Cancel drawing</button></div>
    </div>
    <div class="animlab-atlas-control-group"><div class="animlab-atlas-group-label">Edit selected mesh</div>
      <div class="animlab-atlas-tools"><button type="button" data-tool="vertex">Vertices</button><button type="button" data-act="rename">Rename</button><button type="button" data-act="duplicate">Duplicate</button><button type="button" data-act="delete">Delete</button></div>
    </div>
    <p class="animlab-atlas-status" aria-live="polite"></p>
    <div class="animlab-section-title">Source meshes</div><div class="animlab-atlas-list" aria-label="Atlas mesh list"></div>
    <p class="animlab-atlas-warning">Legacy meshes are read-only. New Atlas meshes do not yet appear in Parts/Skin. PNGs are device-local; JSON exports/backups still omit image bytes.</p>`;
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
    undo:[],redo:[],pending:null,path:[],hover:null,gesture:null,zoom:1,tx:0,ty:0,loadSerial:0,backdrop:initialBackdrop(),wires:initialWires()};
  pick('data-atlas','backdrop').value=state.backdrop;
  pick('data-atlas','wires').value=state.wires;
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
    state.undo=[];state.redo=[];state.pending=null;state.path=[];state.hover=null;state.gesture=null;
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
    // The image's actual alpha remains intact. Only the preview backdrop changes.
    ctx.fillStyle=state.backdrop==='checker'?'#89979b':'#11232b';ctx.fillRect(0,0,d.w,d.h);
    if(state.backdrop==='checker'){
      const check=Math.max(4,Math.min(d.w,d.h)/26);
      for(let y=0;y<d.h;y+=check)for(let x=0;x<d.w;x+=check)
        if((Math.floor(x/check)+Math.floor(y/check))%2){ctx.fillStyle='#bac5c8';ctx.fillRect(x,y,check,check);}
    }
    ctx.drawImage(img,0,0,d.w,d.h);
    ctx.lineWidth=2/state.zoom;ctx.strokeStyle='rgba(240,250,255,.65)';ctx.strokeRect(0,0,d.w,d.h);
    const meshes=allMeshes();
    for(const m of meshes) {
      if(!shown(m))continue;
      const chosen=m.id===state.selected;
      if(state.wires==='off'||(state.wires==='selected'&&!chosen))continue;
      // Single-pixel wireframes regardless of selection; colour, not thickness,
      // distinguishes the selected mesh. De-duplicate triangle edges so each
      // shared edge draws only once, and never tint the source texture.
      ctx.strokeStyle=chosen?'rgba(184,146,63,.69)':(m.readOnly?'rgba(89,148,173,.52)':'rgba(95,167,139,.55)');
      ctx.lineWidth=(chosen?0.75:0.58)/state.zoom;
      const edges=new Set();ctx.beginPath();
      for(const tri of m.triangles){
        if(!tri || tri.length!==3)continue;
        for(const [i,j] of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){
          const a=m.vertices[i],b=m.vertices[j];if(!a||!b)continue;
          const edge=i<j?i+':'+j:j+':'+i;
          if(edges.has(edge))continue;
          edges.add(edge);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        }
      }
      ctx.stroke();
      // Handles are useful in Vertices mode, but obscure image detail elsewhere.
      if(chosen && state.tool==='vertex')for(const v of m.vertices){
        ctx.beginPath();ctx.fillStyle=m.readOnly?'#9dc9de':'#ffe09b';
        ctx.arc(v.x,v.y,Math.min(50,2.5/state.zoom),0,Math.PI*2);ctx.fill();
      }
    }
    if(state.pending){const p=state.pending;ctx.strokeStyle='#d5bc78';ctx.setLineDash([5/state.zoom,4/state.zoom]);ctx.lineWidth=1/state.zoom;ctx.strokeRect(p.x,p.y,p.w,p.h);ctx.setLineDash([]);}
    if(state.path.length){
      ctx.beginPath();ctx.moveTo(state.path[0].x,state.path[0].y);
      for(const p of state.path.slice(1))ctx.lineTo(p.x,p.y);
      if(state.hover)ctx.lineTo(state.hover.x,state.hover.y);
      if(state.tool==='outline' && state.path.length>=3){ctx.moveTo(state.path[state.path.length-1].x,state.path[state.path.length-1].y);ctx.lineTo(state.path[0].x,state.path[0].y);}
      ctx.strokeStyle='#f0c977';ctx.lineWidth=1.2/state.zoom;ctx.setLineDash([7/state.zoom,4/state.zoom]);ctx.stroke();ctx.setLineDash([]);
      for(const p of state.path){ctx.beginPath();ctx.arc(p.x,p.y,Math.min(45,3.5/state.zoom),0,Math.PI*2);ctx.fillStyle='#e6c785';ctx.fill();}
    }
    ctx.restore();
  }
  function refreshList() {
    const meshes=allMeshes();
    list.classList.toggle('many',meshes.length>14);
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
  function selectedEditable() {return state.draft?.meshes.find(m=>m.id===state.selected)||null;}
  function refresh() {
    if(!state.draft)return;
    refreshList();
    panel.querySelectorAll('[data-tool]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tool===state.tool));
    for(const type of ['rect','outline','strip']){
      const group=pick('data-settings',type);
      group.hidden=state.tool!==type;
    }
    const pathTool=state.tool==='outline'||state.tool==='strip';
    const needed=state.tool==='outline'?3:2;
    pick('data-act','apply').hidden=!(state.tool==='rect' && state.pending);
    pick('data-act','finish').hidden=!(pathTool && state.path.length>=needed);
    pick('data-act','finish').textContent=state.tool==='outline'?'Close outline':'Create strip';
    pick('data-act','cancel').hidden=!(state.pending || state.path.length);
    pick('data-atlas','hint').textContent=state.tool==='rect'
      ?'Drag a rectangle on the atlas. Across/Down set the number of grid cells (2 × 2 = 9 vertices).'
      :state.tool==='outline'
      ?`Tap around the outside silhouette, then Close outline (minimum 3 points). ${state.path.length} point(s).`
      :state.tool==='strip'
      ?`Tap along the centre of a limb or tail, then Create strip (minimum 2 points). ${state.path.length} point(s).`
      :state.tool==='vertex'?'Choose a mesh, then drag its vertices. Legacy meshes cannot be changed.':'Drag to pan; pinch or use +/- to zoom.';
    const editable=!!selectedEditable();
    for(const act of ['rename','duplicate','delete'])pick('data-act',act).disabled=!editable;
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
    state.selected=id;state.pending=null;state.path=[];state.hover=null;state.tool='vertex';refresh();
  }
  // Atlas vertices and UVs are the SAME source coordinates. Generators output
  // durable vertices + triangles; placement, skin, bind and clips are untouched.
  function interpolatePath(controls,detail,closed,d) {
    const result=[];
    const n=controls.length;
    for(let i=0;i<(closed?n:n-1);i++){
      const p0=controls[closed?(i+n-1)%n:Math.max(0,i-1)];
      const p1=controls[i],p2=controls[(i+1)%n];
      const p3=controls[closed?(i+2)%n:Math.min(n-1,i+2)];
      for(let step=0;step<detail;step++){
        const t=step/detail,t2=t*t,t3=t2*t;
        const smooth=(a,b,c,e)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-e)*t2+(-a+3*b-3*c+e)*t3);
        result.push({x:bounded(smooth(p0.x,p1.x,p2.x,p3.x),0,d.w),
          y:bounded(smooth(p0.y,p1.y,p2.y,p3.y),0,d.h)});
      }
    }
    if(!closed)result.push({...controls[n-1]});
    return result;
  }
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function segmentsCross(a,b,c,d) {
    const ab=cross(a,b,c),ab2=cross(a,b,d),cd=cross(c,d,a),cd2=cross(c,d,b);
    return ((ab>1e-5&&ab2 < -1e-5)||(ab < -1e-5&&ab2>1e-5))&&
      ((cd>1e-5&&cd2 < -1e-5)||(cd < -1e-5&&cd2>1e-5));
  }
  function outlineMesh(path,curve,fill,d) {
    const vertices=interpolatePath(path,curve,true,d);
    const n=vertices.length;
    if(n>384)throw Error('Outline has too many points. Reduce curve detail.');
    for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){
      if(i===0 && j===n-1)continue;
      if(segmentsCross(vertices[i],vertices[(i+1)%n],vertices[j],vertices[(j+1)%n]))
        throw Error('Outline crosses itself. Move or remove control points and try again.');
    }
    const area=vertices.reduce((sum,v,i)=>{
      const b=vertices[(i+1)%n];return sum+v.x*b.y-b.x*v.y;
    },0);
    if(Math.abs(area)<10)throw Error('Outline is too narrow or folded to triangulate.');
    const winding=area>0?1:-1;
    const remaining=Array.from({length:n},(_,i)=>i);
    let triangles=[];
    while(remaining.length>3) {
      let clipped=false;
      for(let k=0;k<remaining.length;k++){
        const a=remaining[(k+remaining.length-1)%remaining.length],b=remaining[k],c=remaining[(k+1)%remaining.length];
        if(winding*cross(vertices[a],vertices[b],vertices[c])<=0.01)continue;
        let occupied=false;
        for(const q of remaining){
          if(q===a||q===b||q===c)continue;
          const v=vertices[q];
          if(winding*cross(vertices[a],vertices[b],v)>1e-5 && winding*cross(vertices[b],vertices[c],v)>1e-5 && winding*cross(vertices[c],vertices[a],v)>1e-5){occupied=true;break;}
        }
        if(occupied)continue;
        triangles.push([a,b,c]);remaining.splice(k,1);clipped=true;break;
      }
      if(!clipped)throw Error('Could not triangulate this outline. Try fewer or less closely spaced points.');
    }
    triangles.push(remaining);
    // Interior density without changing or duplicating the outer silhouette edges.
    for(let level=0;level<fill;level++){
      const subdiv=[];
      for(const [a,b,c] of triangles){
        const v=vertices[a],w=vertices[b],z=vertices[c];
        const center=vertices.length;
        vertices.push({x:(v.x+w.x+z.x)/3,y:(v.y+w.y+z.y)/3});
        subdiv.push([a,b,center],[b,c,center],[c,a,center]);
      }
      triangles=subdiv;
      if(vertices.length>2000)throw Error('Too many outline vertices. Reduce Fill detail.');
    }
    return {vertices,triangles,generator:{type:'outline-spline',controls:clone(path),curveDetail:curve,fillDetail:fill}};
  }
  function stripMesh(path,width,taper,across,along,d) {
    const centers=interpolatePath(path,along,false,d),vertices=[],triangles=[];
    if(centers.length*(across+1)>1600)throw Error('Too many strip vertices. Reduce subdivisions.');
    for(let i=0;i<centers.length;i++){
      const prev=centers[Math.max(0,i-1)],next=centers[Math.min(i+1,centers.length-1)];
      const dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;
      const nx=-dy/len,ny=dx/len;
      const t=i/(centers.length-1),r=width*(1+(taper-1)*t)/2;
      for(let j=0;j<=across;j++){
        const spread=(j/across*2-1)*r;
        vertices.push({x:bounded(centers[i].x+nx*spread,0,d.w),y:bounded(centers[i].y+ny*spread,0,d.h)});
      }
    }
    for(let i=0;i<centers.length-1;i++)for(let j=0;j<across;j++){
      const a=i*(across+1)+j,b=a+1,c=a+across+1,e=c+1;
      triangles.push([a,b,c],[b,e,c]);
    }
    return {vertices,triangles,generator:{type:'spline-strip',controls:clone(path),width,taper,across,along}};
  }
  function finishPath() {
    const path=state.path,d=dims(),kind=state.tool;
    if(!d || (kind!=='outline'&&kind!=='strip') || path.length < (kind==='outline'?3:2))return;
    try {
      if(path.some((p,i)=>i && Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y)<3))throw Error('Control points are too close together.');
      const geometry=kind==='outline'
        ?outlineMesh(path,bounded(Number(pick('data-atlas','curve').value)||1,1,8)|0,bounded(Number(pick('data-atlas','fill').value)||0,0,2)|0,d)
        :stripMesh(path,bounded(Number(pick('data-atlas','width').value)||65,2,1000),bounded(Number(pick('data-atlas','taper').value)||65,5,200)/100,
          bounded(Number(pick('data-atlas','stripcols').value)||2,1,12)|0,bounded(Number(pick('data-atlas','striprows').value)||3,1,12)|0,d);
      const raw=window.prompt('Name this source mesh',`Part ${state.draft.meshes.length+1}`);
      if(raw===null)return;
      const id='atlas-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
      const name=raw.trim().slice(0,50)||`Part ${state.draft.meshes.length+1}`;
      modify(()=>state.draft.meshes.push({id,name,kind:geometry.generator.type,...geometry}));
      state.selected=id;state.path=[];state.hover=null;state.tool='vertex';state.imageStatus='';refresh();
    }catch(error){report(error.message||String(error));}
  }
  function selectedAction(action) {
    const selected=selectedEditable();if(!selected)return;
    if(action==='rename'){
      const raw=window.prompt('Rename source mesh',selected.name);
      if(raw===null)return;
      const name=raw.trim().slice(0,50);
      if(!name)return report('Mesh name cannot be empty.');
      modify(()=>selected.name=name);
    } else if(action==='duplicate'){
      const id='atlas-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
      const dup=clone(selected);dup.id=id;dup.name=(selected.name+' copy').slice(0,50);
      modify(()=>state.draft.meshes.push(dup));state.selected=id;
    } else if(action==='delete'){
      if(!window.confirm(`Delete source mesh “${selected.name}”? You can Undo before saving.`))return;
      modify(()=>state.draft.meshes=state.draft.meshes.filter(m=>m.id!==selected.id));
      state.hidden.delete(selected.id);state.locked.delete(selected.id);
      if(state.solo===selected.id)state.solo=null;
      state.selected=null;
    }
    refresh();
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
    }else if(state.tool==='outline'||state.tool==='strip'){
      state.gesture={type:'point',start:pos,pt};
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
    if(g.type==='point'){state.hover={x:bounded(pt.x,0,d.w),y:bounded(pt.y,0,d.h)};layout();return;}
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
    if(g?.type==='point' && pointers.size===0){
      const pos=pixelPos(e),d=dims();
      if(d && Math.hypot(pos.x-g.start.x,pos.y-g.start.y)<12 && state.path.length<100) {
        const pt=screenToAtlas(pos.x,pos.y),at={x:bounded(pt.x,0,d.w),y:bounded(pt.y,0,d.h)};
        if(!state.path.length || Math.hypot(at.x-state.path[state.path.length-1].x,at.y-state.path[state.path.length-1].y)>=3)state.path.push(at);
      }
      state.hover=null;
    }
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
  panel.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{state.tool=btn.dataset.tool;state.pending=null;state.path=[];state.hover=null;refresh();}));
  pick('data-act','fit').addEventListener('click',()=>{fit();refresh();});
  for(const [act,multiplier] of [['zoom-in',1.25],['zoom-out',.8]])pick('data-act',act).addEventListener('click',()=>{
    const x=canvas.clientWidth/2,y=canvas.clientHeight/2,pt=screenToAtlas(x,y);
    state.zoom=bounded(state.zoom*multiplier,.03,12);state.tx=x-pt.x*state.zoom;state.ty=y-pt.y*state.zoom;layout();
  });
  for(const action of ['rename','duplicate','delete'])pick('data-act',action).addEventListener('click',()=>selectedAction(action));
  pick('data-act','finish').addEventListener('click',finishPath);
  pick('data-atlas','wires').addEventListener('change',e=>{
    state.wires=['all','selected','off'].includes(e.target.value)?e.target.value:'all';
    try {localStorage.setItem(WIRES_KEY,state.wires);} catch (_) {}
    layout();
  });
  pick('data-atlas','backdrop').addEventListener('change',e=>{
    state.backdrop=e.target.value==='checker'?'checker':'dark';
    try {localStorage.setItem(VIEW_KEY,state.backdrop);} catch (_) {}
    layout(); // No Save/Undo entry: this is a viewport-only preference.
  });
  pick('data-act','apply').addEventListener('click',applyPending);
  pick('data-act','cancel').addEventListener('click',()=>{state.pending=null;state.path=[];state.hover=null;refresh();});
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
    discard:()=>{if(!state.saved)return;state.draft=clone(state.saved);state.undo=[];state.redo=[];state.pending=null;state.path=[];state.hover=null;
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
    getTool:()=>state.tool,getDraftPath:()=>clone(state.path),
    getUVs:()=>{const d=dims();return d?state.draft.meshes.map(m=>({id:m.id,uvs:m.vertices.map(v=>({u:v.x/d.w,v:v.y/d.h}))})):[];}});
  const s=core.getState();loadCharacter(s);updateLegacy(s);panel.hidden=!isActive(s);canvas.hidden=!isActive(s);
  if(isActive(s))refresh();
})();
