/* SideScroll v1.1.25 — read-only same-origin Character Lab -> Game bridge.
 * User character JSON is never modified. IndexedDB art stays on this device.
 * Render geometry uses exactly the same rest-space placement, UVs and skin
 * transforms as the Character Lab Canvas2D assembly renderer.
 */
(() => {
  'use strict';
  const LIBRARY_KEY='sidescroll.animlab.character-library.v1';
  const ATLAS_KEY='sidescroll.animlab.atlas-docs.v1';
  const DB_NAME='sidescroll-animlab-art-v1';
  const DB_STORE='atlas-images';
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}};
  const sourceLibrary=read(LIBRARY_KEY);
  const atlasMap=read(ATLAS_KEY);
  const entries=new Map();
  if(sourceLibrary?.schema==='animlab.character-library.v1'&&Array.isArray(sourceLibrary.entries)){
    for(const candidate of sourceLibrary.entries.slice(0,24)){
      if(!candidate||!/^user-[a-z0-9-]{5,40}$/.test(candidate.id)||!['fox','original'].includes(candidate.starter)||entries.has(candidate.id))continue;
      entries.set(candidate.id,{id:candidate.id,label:String(candidate.name||candidate.id).slice(0,42),
        family:candidate.starter==='fox'?'fox':'human',
        rigFamily:candidate.starter==='fox'?'quadruped':'biped',setup:candidate.setup,
        sparseClips:candidate.sparseClips,legacyAtlasSource:candidate.legacyAtlasSource||null,
        art:typeof candidate.art==='string'?candidate.art:null});
    }
  }
  // Original characters (not in the library) whose Drawing method is Mesh:
  // Character Lab saved an enabled Parts assembly and its mesh sources in their
  // setup. Only their drawing changes; scale, speeds, collider and animation
  // still come from the game's usual original-character data, so these entries
  // are reached through meshFor() and never through find()/ready()/list().
  const SETUP_KEY='sidescroll.animlab.setup.v1';
  const setupMap=read(SETUP_KEY);
  const QuadrupedRig=window.SideScrollQuadrupedRig;
  const registry=window.SideScrollCharacters;
  const originalMeshIds=[];
  for(const id of registry?.ORIGINAL_IDS||['fox']){
    const saved=setupMap?.[id],family=registry?.find(id)?.family||(id==='fox'?'fox':'human');
    if(family!=='fox'||!QuadrupedRig||saved?.artLayout?.assembly?.enabled!==true)continue;
    // Same rule as the game's original-character setup: data saved against an
    // older baseline is not used.
    if(saved.baselineId!==QuadrupedRig.AUTHORING_BASELINE_ID)continue;
    entries.set(id,{id,label:registry?.name(id)||id,family:'fox',rigFamily:'quadruped',original:true,
      setup:{...saved,rig:QuadrupedRig.loadRestRig?.()||QuadrupedRig.DEFAULT_REST_RIG},
      sparseClips:null,legacyAtlasSource:saved.legacyAtlasSource||null});
    originalMeshIds.push(id);
  }
  const prepared=new Map(), failures=new Map(), inFlight=new Map();
  const library=()=>[...entries.values()].filter(e=>!e.original);
  const list=()=>library().map(e=>({id:e.id,label:e.label,family:e.family,rigFamily:e.rigFamily,
    technique:prepared.get(e.id)?.technique||null,status:prepared.has(e.id)?'ready':failures.get(e.id)||'loading'}));
  const find=id=>{const e=entries.get(id);return e&&!e.original?e:null;};
  const ready=id=>find(id)?prepared.get(id)||null:null;
  // The prepared mesh for drawing, for library and original characters alike.
  const meshFor=id=>{const data=prepared.get(id);return data?.parts?.length?data:null;};
  const reason=id=>failures.get(id)||null;
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const assert=(test,message)=>{if(!test)throw Error(message);};
  const num=(v,fallback=0)=>finite(v)?v:fallback;
  function openDB(){return new Promise((resolve,reject)=>{
    if(!window.indexedDB)return reject(Error('IndexedDB artwork storage unavailable'));
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE);};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||Error('Cannot open artwork storage'));
  });}
  async function loadImage(id){
    const db=await openDB();let blob;
    try{blob=await new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).get(id);
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error||Error('Cannot read image'));
    });}finally{db.close();}
    assert(blob instanceof Blob,'Imported PNG missing from this device · reimport in Character Lab');
    const url=URL.createObjectURL(blob),image=new Image();
    try{await new Promise((resolve,reject)=>{
      image.onload=resolve;image.onerror=()=>reject(Error('Imported PNG cannot be decoded'));
      image.src=url;
    });return image;
    }finally{URL.revokeObjectURL(url);}
  }
  // Published character art is written to assets/ by tools/bake_project.py as
  // char-<character id>-<content hash>.png (a new name whenever the art changes).
  const PUBLISHED_CHARACTER_ART=/^char-[a-z0-9-]{4,90}\.png$/;
  async function loadBundledImage(file) {
    // Allowlist means saved browser records can never choose arbitrary URL paths.
    // Saved data may still name the atlas by its old file name; resolve renames first.
    file=(window.SideScrollAssetRename||(n=>n))(String(file));
    const quadruped=file==='quadruped-deform-atlas-v2.png';
    assert(quadruped||PUBLISHED_CHARACTER_ART.test(String(file)),'Unsupported bundled artwork source');
    const image=new Image();
    await new Promise((resolve,reject)=>{
      image.onload=resolve;
      image.onerror=()=>reject(Error(quadruped?'Original deform atlas missing from the game':`Published character art missing from the game (${file})`));
      image.src=(window.SideScrollAssetPath||(url=>url))(quadruped?'quadruped-deform-atlas-v2.png?v=1.1.25':file);
    });
    return image;
  }
  // Keep this hashing convention identical to Anim Lab Skin's mesh signature.
  function signature(mesh){
    const value=JSON.stringify([mesh.vertices.map(v=>[v.x,v.y]),mesh.triangles]);
    let hash=2166136261;
    for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `${mesh.vertices.length}:${mesh.triangles.length}:${(hash>>>0).toString(16)}`;
  }
  function makePart(item,mesh,image,sourceKey){
    const verts=mesh.vertices;
    assert(Array.isArray(verts)&&verts.length>=3&&verts.length<=4096,`Invalid vertices for ${item.label||item.id}`);
    assert(Array.isArray(mesh.triangles)&&mesh.triangles.length>0&&mesh.triangles.length<=8192,`Invalid faces for ${item.label||item.id}`);
    const indices=[];
    for(const tri of mesh.triangles){
      assert(Array.isArray(tri)&&tri.length===3&&tri.every(i=>Number.isInteger(i)&&i>=0&&i<verts.length),`Invalid triangle in ${item.label||item.id}`);
      indices.push(...tri);
    }
    assert(verts.every(v=>finite(v.x)&&finite(v.y)),`Invalid vertex coordinates in ${item.label||item.id}`);
    const xs=verts.map(v=>v.x),ys=verts.map(v=>v.y);
    const cx=Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))/2,ymax=Math.max(...ys);
    const ppu=.95/image.naturalWidth,sx=num(item.scaleX,1)||1,sy=num(item.scaleY,1)||1;
    const angle=num(item.rotation),c=Math.cos(angle),s=Math.sin(angle),ox=num(item.pivotX),oy=num(item.pivotY);
    const rest=verts.map(v=>{
      const x=(v.x-cx)*ppu-ox,y=(ymax-v.y)*ppu-oy;
      return {x:num(item.x)+ox+c*x*sx-s*y*sy,y:num(item.y)+oy+s*x*sx+c*y*sy};
    });
    const binding=item.skinBinding;
    const validBinding=binding?.schema==='animlab.skin-binding.v1'&&binding.meshSignature===signature(mesh)&&
      Array.isArray(binding.weights)&&binding.weights.length===verts.length;
    // No silent rebind: invalid/missing bindings render at rest and are reported.
    const weights=validBinding?binding.weights.map(row=>Array.isArray(row)?row.filter(p=>Array.isArray(p)&&Number.isInteger(p[0])&&finite(p[1])&&p[1]>0).slice(0,4):[]):null;
    return {id:item.id,label:String(item.label||mesh.name||item.id),rest,vertices:verts,
      indices:new Uint16Array(indices),weights,mode:binding?.envelopeMode||'',
      image,sourceKey,texture:null,buffer:new Float32Array(verts.length*5),mesh:null,
      warning:validBinding?null:`${item.label||item.id}: missing/stale Skin bind (rest pose shown)`};
  }
  async function load(id){
    if(prepared.has(id))return prepared.get(id);
    if(inFlight.has(id))return inFlight.get(id);
    const entry=entries.get(id);if(!entry)throw Error('Character not in local library');
    const promise=(async()=>{
      const setup=entry.setup||{},assembly=setup.artLayout?.assembly;
      // Biped authoring currently has poses/collider/scale but no authored Atlas
      // assembly or structural rig. Play with the first original biped's rigid atlas
      // while preserving each character's own saved animation data. No fake
      // biped skin/bind is synthesized and no source document is modified.
      if(entry.family==='human'){
        assert(entry.sparseClips && ['walk','run','jump'].every(name=>
          Array.isArray(entry.sparseClips?.[name]?.keys)&&entry.sparseClips[name].keys.length),
          'Biped starter animation clips missing; Save in Character Lab');
        const value={...entry,technique:'biped-starter-rigid',parts:[],warnings:[]};
        prepared.set(id,value);failures.delete(id);return value;
      }
      assert(setup.rig?.joints&&setup.skinBindRig?.joints,'Character Rig / Skin Bind missing; Save in Character Lab');
      assert(assembly?.enabled===true&&Array.isArray(assembly.instances)&&assembly.instances.length,
        'No Atlas assembly: save assembled Parts in Character Lab');
      const requiresLegacy=assembly.instances.some(p=>String(p.meshId).startsWith('atlas-builtin-'));
      const requiresCustom=assembly.instances.some(p=>!String(p.meshId).startsWith('atlas-builtin-'));
      let legacyMeshMap=null,legacyImage=null,customMeshMap=null,customImage=null;
      if(requiresLegacy){
        const bundled=entry.legacyAtlasSource;
        assert(bundled?.schema==='animlab.legacy-atlas-sources.v1' &&
          (window.SideScrollAssetRename||(n=>n))(String(bundled.file))==='quadruped-deform-atlas-v2.png' && Array.isArray(bundled.meshes),
          'Original Parts need a new Character Lab Save to record their meshes');
        legacyMeshMap=new Map(bundled.meshes.map(m=>[`atlas-builtin-${m.id}`,m]));
        legacyImage=await loadBundledImage(bundled.file);
        assert(legacyImage.naturalWidth===bundled.width&&legacyImage.naturalHeight===bundled.height,
          'Original parts atlas size changed; please Save in Character Lab');
      }
      if(requiresCustom){
        const doc=atlasMap?.characters?.[id];
        assert(doc?.schema==='animlab.atlas-document.v1','Atlas source document missing on this device');
        assert((doc.atlas?.kind==='indexeddb'&&doc.atlas.id)||(doc.atlas?.kind==='bundled'&&doc.atlas.file),
          'Imported atlas image reference missing');
        assert(Array.isArray(doc.meshes),'Atlas meshes missing');
        customMeshMap=new Map(doc.meshes.map(m=>[m.id,m]));
        customImage=doc.atlas.kind==='bundled'?await loadBundledImage(doc.atlas.file):await loadImage(doc.atlas.id);
        assert(customImage.naturalWidth===doc.atlas.width&&customImage.naturalHeight===doc.atlas.height,
          'Imported image size no longer matches authored mesh UVs');
      }
      const parts=assembly.instances.map(item=>{
        const legacy=String(item.meshId).startsWith('atlas-builtin-');
        const source=legacy?legacyMeshMap:customMeshMap;
        assert(source?.has(item.meshId),`Atlas source mesh missing: ${item.label||item.meshId}`);
        return makePart(item,source.get(item.meshId),legacy?legacyImage:customImage,
          legacy?'bundled-quadruped-deform':'imported-atlas');
      });
      const technique=requiresLegacy?(requiresCustom?'atlas-mixed':'atlas-bundled'):'atlas-deform';
      const value={...entry,technique,parts,warnings:parts.flatMap(p=>p.warning?[p.warning]:[])};
      prepared.set(id,value);failures.delete(id);return value;
    })().catch(error=>{failures.set(id,String(error.message||error));throw error;}).finally(()=>inFlight.delete(id));
    inFlight.set(id,promise);return promise;
  }
  const neutralKeys=['bodyBob','frontBodyLift','rearBodyLift','bodyPitch','neckPitch','headPitch','tailBase','tailMid','tailTip',
    'rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower','rnDistal','rfDistal','fnDistal','ffDistal'];
  function neutralPose(rig){const pose={...rig.IDLE_POSE};for(const k of neutralKeys)pose[k]=0;
    for(const prefix of ['rn','rf','fn','ff'])pose[`${prefix}IkWeight`]=0;
    return rig.normalizedPose(pose,0);
  }
  function transforms(rig,bind,posed,rigid){
    return rig.RIG_DESIGNER.boneLinks.map(bone=>{
      const A=bind[bone.a],B=bind[bone.b],C=posed[bone.a],D=posed[bone.b];
      if(!A||!B||!C||!D)return [1,0,0,1,0,0];
      const rx=B.x-A.x,ry=B.y-A.y,tx=D.x-C.x,ty=D.y-C.y;
      const rlen=Math.hypot(rx,ry),tlen=Math.hypot(tx,ty);
      if(rlen<1e-8||tlen<1e-8)return [1,0,0,1,C.x-A.x,C.y-A.y];
      const cos=(rx*tx+ry*ty)/(rlen*tlen),sin=(rx*ty-ry*tx)/(rlen*tlen),k=rigid?1:tlen/rlen;
      const a=k*cos,b=k*sin,c=-sin,d=cos;
      // Non-rigid: longitudinal scaling only, preserving perpendicular width.
      const e=C.x-a*A.x-c*A.y,f=C.y-b*A.x-d*A.y;
      return [a,b,c,d,e,f];
    });
  }
  function poseParts(data,pose,rig){
    const bind=rig.geometry(neutralPose(rig),data.setup.skinBindRig||data.setup.rig);
    const posed=rig.geometry(pose,data.setup.rig);
    const flexible=transforms(rig,bind,posed,false),rigid=transforms(rig,bind,posed,true);
    for(const part of data.parts){
      const maps=(part.mode==='rect-binary-v1'||part.mode==='joint-boundaries-v1')?rigid:flexible;
      const out=part.buffer,imw=part.image.naturalWidth,imh=part.image.naturalHeight;
      for(let i=0;i<part.vertices.length;i++){
        const p=part.rest[i],row=part.weights?.[i]||[];let x=0,y=0,total=0;
        for(const [bi,w] of row){const m=maps[bi];if(!m)continue;
          x+=(m[0]*p.x+m[2]*p.y+m[4])*w;
          y+=(m[1]*p.x+m[3]*p.y+m[5])*w;total+=w;
        }
        const remain=Math.max(0,1-total),den=Math.max(1,total);
        const n=i*5;out[n]=(x+remain*p.x)/den;out[n+1]=(y+remain*p.y)/den;out[n+2]=0;
        out[n+3]=part.vertices[i].x/imw;out[n+4]=1-part.vertices[i].y/imh;
      }
    }
  }
  // Biped sparse clips share Character Lab's 16-frame authored format. Use
  // continuous key-to-key interpolation; the built-in biped atlas is simply the
  // renderer of those poses, not the source of the saved clip.
  function sampleBipedClip(data,name,phase,rig){
    if(data?.family!=='human'||!rig?.interpolatePose||!rig?.normalizedPose)return null;
    const clip=data.sparseClips?.[name];
    if(!Array.isArray(clip?.keys)||!clip.keys.length)return null;
    const keys=clip.keys.filter(k=>Number.isInteger(k?.frame)&&k.frame>=0&&k.frame<16&&
      k.pose&&typeof k.pose==='object').slice().sort((a,b)=>a.frame-b.frame);
    if(keys.length<2)return null;
    const f=(((Number(phase)||0)%1)+1)%1*16;
    let before=keys[keys.length-1],after=keys[0];
    let beforeFrame=before.frame-16,afterFrame=after.frame+16;
    for(const k of keys){if(k.frame<=f){before=k;beforeFrame=k.frame;}else{after=k;afterFrame=k.frame;break;}}
    if(afterFrame<=beforeFrame)afterFrame=after.frame+16;
    const t=Math.max(0,Math.min(1,(f-beforeFrame)/Math.max(.0001,afterFrame-beforeFrame)));
    const a=rig.normalizedPose(before.pose,before.frame),b=rig.normalizedPose(after.pose,after.frame);
    const travelB=(afterFrame>=16?(Number(b.travel)||0)+1:Number(b.travel)||0);
    return rig.normalizedPose(rig.interpolatePose(a,b,t,before.name||name,travelB),Math.floor(f));
  }
  window.SideScrollGameCharacters=Object.freeze({list,find,ready,reason,load,poseParts,sampleBipedClip,
    meshFor,originalMeshIds:()=>originalMeshIds.slice()});
})();
