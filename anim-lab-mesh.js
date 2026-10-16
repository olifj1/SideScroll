(() => {
  'use strict';

  const core = window.AnimLabCore;
  const FoxRig = window.GameHubFoxRig;
  const host = document.getElementById('animlab-extension');
  if (!core || !FoxRig || !host || typeof core.registerArtRenderer !== 'function') {
    console.error('[Anim Lab Mesh] Required mesh preview hooks are missing.');
    return;
  }

  // Stage 1 proof-of-concept: automatic low-poly 2D linear skinning for the
  // current Fox.  It intentionally edits no rig/animation data.  The existing
  // rigid atlas is rebuilt into a handful of temporary region textures at bind
  // pose, then each region is deformed by the approved Fox bones.
  const REGION_DEFS = [
    {
      id:'tail', label:'Tail', order:0,
      parts:['tail_base','tail_mid','tail_tip'],
      grid:[8,2],
      bones:[['tail0','tail1'],['tail1','tail2'],['tail2','tail3']]
    },
    {
      id:'rearFar', label:'Rear Far Leg', order:1,
      parts:['far_rear_upper','far_rear_lower_prox','far_rear_lower_dist'],
      grid:[2,5],
      bones:[['rearFarRoot','rearFarKnee'],['rearFarKnee','rearFarHock'],['rearFarHock','rearFarFoot']]
    },
    {
      id:'frontFar', label:'Front Far Leg', order:2,
      parts:['far_front_upper','far_front_lower_prox','far_front_lower_dist'],
      grid:[2,5],
      bones:[['frontFarRoot','frontFarKnee'],['frontFarKnee','frontFarWrist'],['frontFarWrist','frontFarFoot']]
    },
    {
      id:'bodyHead', label:'Body + Head', order:3,
      parts:['torso','head_neck'],
      grid:[7,2],
      bones:[['rearBody','midRoot'],['midRoot','frontBody'],['frontBody','neck'],['neck','head']]
    },
    {
      id:'rearNear', label:'Rear Near Leg', order:4,
      parts:['near_rear_upper','near_rear_lower_prox','near_rear_lower_dist'],
      grid:[2,5],
      bones:[['rearNearRoot','rearNearKnee'],['rearNearKnee','rearNearHock'],['rearNearHock','rearNearFoot']]
    },
    {
      id:'frontNear', label:'Front Near Leg', order:5,
      parts:['near_front_upper','near_front_lower_prox','near_front_lower_dist'],
      grid:[2,5],
      bones:[['frontNearRoot','frontNearKnee'],['frontNearKnee','frontNearWrist'],['frontNearWrist','frontNearFoot']]
    }
  ];

  const PAD = 8;
  const TEXELS_PER_LOCAL = 900;
  const caches = new Map();
  let mode = 'mesh';
  let wireframe = false;
  let lastFamily = null;

  const section = document.createElement('section');
  section.className = 'animlab-section';
  section.id = 'animlab-mesh-preview-section';
  section.setAttribute('aria-labelledby','animlab-mesh-preview-title');
  section.innerHTML = `
    <div class="animlab-section-title" id="animlab-mesh-preview-title">Skin Prototype</div>
    <div class="animlab-setup-note">Stage 1 · auto-weighted low-poly preview. Editor-only; does not alter the rig or animation keys.</div>
    <div class="animlab-segmented animlab-two" id="animlab-mesh-mode">
      <button type="button" data-mesh-mode="rigid">Rigid</button>
      <button type="button" data-mesh-mode="mesh">Deform</button>
    </div>
    <div class="animlab-view-grid">
      <button type="button" id="animlab-mesh-wire" aria-pressed="false">Mesh Wireframe</button>
    </div>
  `;
  host.appendChild(section);

  const modeButtons = [...section.querySelectorAll('[data-mesh-mode]')];
  const wireBtn = section.querySelector('#animlab-mesh-wire');

  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function dist(a,b){ return Math.hypot((b?.x||0)-(a?.x||0),(b?.y||0)-(a?.y||0)); }

  function neutralPose(){
    const p = clone(FoxRig.IDLE_POSE || {});
    for (const key of ['bodyBob','frontBodyLift','rearBodyLift','bodyPitch','neckPitch','headPitch','tailBase','tailMid','tailTip',
      'rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower','rnDistal','rfDistal','fnDistal','ffDistal']) p[key]=0;
    for (const prefix of ['rn','rf','fn','ff']) p[`${prefix}IkWeight`]=0;
    return FoxRig.normalizedPose(p,0);
  }

  const BIND_POSE = neutralPose();

  function projectLocal(pt,sv){
    return {x:sv.cx+pt.x*sv.scale*(sv.flipX||1), y:sv.groundY-pt.y*sv.scale};
  }

  function partTransform(rect,part,sv){
    const A=projectLocal(part.a,sv), B=projectLocal(part.b,sv);
    const p0={x:rect.a0[0]*rect.w,y:rect.a0[1]*rect.h};
    const p1={x:rect.a1[0]*rect.w,y:rect.a1[1]*rect.h};
    const sx=p1.x-p0.x, sy=p1.y-p0.y, dx=B.x-A.x, dy=B.y-A.y;
    const sl=Math.hypot(sx,sy)||1, dl=Math.hypot(dx,dy)||1, sc=dl/sl;
    const usx=sx/sl, usy=sy/sl, vsx=-usy, vsy=usx;
    const udx=dx/dl, udy=dy/dl, flip=(sv.flipX||1)<0?-1:1;
    const vdx=-udy*flip, vdy=udx*flip;
    const a=sc*(udx*usx+vdx*vsx), c=sc*(udx*usy+vdx*vsy);
    const b=sc*(udy*usx+vdy*vsx), d=sc*(udy*usy+vdy*vsy);
    return {a,b,c,d,e:A.x-a*p0.x-c*p0.y,f:A.y-b*p0.x-d*p0.y};
  }

  function planeCornersLocal(part){
    const rect=FoxRig.atlasRect(part.name);
    if(!rect)return[];
    const sv={scale:1000,cx:0,groundY:0,flipX:1};
    const m=partTransform(rect,part,sv);
    const tr=(x,y)=>({x:(m.a*x+m.c*y+m.e)/sv.scale,y:-(m.b*x+m.d*y+m.f)/sv.scale});
    return [tr(0,0),tr(rect.w,0),tr(rect.w,rect.h),tr(0,rect.h)];
  }

  function bboxForParts(parts){
    const points=parts.flatMap(planeCornersLocal);
    if(!points.length)return null;
    const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
    return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
  }

  function drawPartToTexture(ctx,atlas,part,view){
    const rect=FoxRig.atlasRect(part.name);
    if(!rect)return;
    const m=partTransform(rect,part,view);
    ctx.save();
    ctx.globalAlpha*=part.alpha??1;
    ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    ctx.drawImage(atlas,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);
    ctx.restore();
  }

  function pointSegmentDistance(p,a,b){
    const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y;
    const vv=vx*vx+vy*vy;
    const t=vv>1e-12?clamp((wx*vx+wy*vy)/vv,0,1):0;
    return Math.hypot(p.x-(a.x+vx*t),p.y-(a.y+vy*t));
  }

  function weightsForPoint(point,bones,bindGeom){
    const ranked=bones.map((bone,index)=>{
      const a=bindGeom[bone[0]],b=bindGeom[bone[1]];
      const d=pointSegmentDistance(point,a,b);
      return {index,score:1/(d*d+0.00055)};
    }).sort((a,b)=>b.score-a.score).slice(0,2);
    const total=ranked.reduce((s,x)=>s+x.score,0)||1;
    return ranked.map(x=>({index:x.index,weight:x.score/total}));
  }

  function buildRegion(def,atlas,restRig){
    const bindGeom=FoxRig.geometry(BIND_POSE,restRig);
    const allParts=FoxRig.partsForPose(BIND_POSE,restRig);
    const wanted=new Set(def.parts);
    const parts=allParts.filter(p=>wanted.has(p.name));
    const bbox=bboxForParts(parts);
    if(!bbox)return null;
    const width=Math.max(1,bbox.maxX-bbox.minX),height=Math.max(1,bbox.maxY-bbox.minY);
    const scale=TEXELS_PER_LOCAL;
    const tex=document.createElement('canvas');
    tex.width=Math.max(32,Math.ceil(width*scale)+PAD*2);
    tex.height=Math.max(32,Math.ceil(height*scale)+PAD*2);
    const tctx=tex.getContext('2d');
    tctx.clearRect(0,0,tex.width,tex.height);
    tctx.imageSmoothingEnabled=true;
    const view={scale,cx:PAD-bbox.minX*scale,groundY:PAD+bbox.maxY*scale,flipX:1};
    for(const part of parts)drawPartToTexture(tctx,atlas,part,view);

    const [cols,rows]=def.grid;
    const vertices=[];
    for(let y=0;y<=rows;y++){
      const ty=y/rows;
      for(let x=0;x<=cols;x++){
        const tx=x/cols;
        const bind={x:bbox.minX+width*tx,y:bbox.minY+height*ty};
        const uv=projectLocal(bind,view);
        vertices.push({bind,uv,weights:weightsForPoint(bind,def.bones,bindGeom)});
      }
    }
    const triangles=[];
    const stride=cols+1;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=y*stride+x,a=i,b=i+1,c=i+stride,d=i+stride+1;
      // Alternate diagonals to avoid one directional fold bias.
      if((x+y)&1){triangles.push([a,b,c],[b,d,c]);}
      else{triangles.push([a,b,d],[a,d,c]);}
    }
    return {...def,texture:tex,bbox,vertices,triangles,bindGeom};
  }

  function rigKey(restRig){
    try{return JSON.stringify(restRig?.joints||restRig||{});}catch(_){return'fox';}
  }

  function regionsFor(atlas,restRig){
    const key=rigKey(restRig);
    const cached=caches.get(key);
    if(cached?.atlas===atlas)return cached.regions;
    const regions=REGION_DEFS.map(def=>buildRegion(def,atlas,restRig)).filter(Boolean).sort((a,b)=>a.order-b.order);
    caches.clear();
    caches.set(key,{atlas,regions});
    return regions;
  }

  function mapByBone(point,bindA,bindB,poseA,poseB){
    const bx=bindB.x-bindA.x,by=bindB.y-bindA.y,bl=Math.hypot(bx,by)||1e-8;
    const px=poseB.x-poseA.x,py=poseB.y-poseA.y,pl=Math.hypot(px,py)||1e-8;
    const bux=bx/bl,buy=by/bl,bvx=-buy,bvy=bux;
    const pux=px/pl,puy=py/pl,pvx=-puy,pvy=pux;
    const rx=point.x-bindA.x,ry=point.y-bindA.y;
    const along=rx*bux+ry*buy,across=rx*bvx+ry*bvy;
    const longitudinal=along*(pl/bl);
    return {x:poseA.x+pux*longitudinal+pvx*across,y:poseA.y+puy*longitudinal+pvy*across};
  }

  function skinnedVertex(vertex,region,poseGeom){
    let x=0,y=0,total=0;
    for(const influence of vertex.weights){
      const bone=region.bones[influence.index];
      const bindA=region.bindGeom[bone[0]],bindB=region.bindGeom[bone[1]];
      const poseA=poseGeom[bone[0]],poseB=poseGeom[bone[1]];
      if(!bindA||!bindB||!poseA||!poseB)continue;
      const q=mapByBone(vertex.bind,bindA,bindB,poseA,poseB);
      x+=q.x*influence.weight;y+=q.y*influence.weight;total+=influence.weight;
    }
    return total>1e-6?{x:x/total,y:y/total}:vertex.bind;
  }

  function affineFromTriangles(s0,s1,s2,d0,d1,d2){
    const den=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);
    if(Math.abs(den)<1e-8)return null;
    const a=(d0.x*(s1.y-s2.y)+d1.x*(s2.y-s0.y)+d2.x*(s0.y-s1.y))/den;
    const c=(d0.x*(s2.x-s1.x)+d1.x*(s0.x-s2.x)+d2.x*(s1.x-s0.x))/den;
    const e=(d0.x*(s1.x*s2.y-s2.x*s1.y)+d1.x*(s2.x*s0.y-s0.x*s2.y)+d2.x*(s0.x*s1.y-s1.x*s0.y))/den;
    const b=(d0.y*(s1.y-s2.y)+d1.y*(s2.y-s0.y)+d2.y*(s0.y-s1.y))/den;
    const d=(d0.y*(s2.x-s1.x)+d1.y*(s0.x-s2.x)+d2.y*(s1.x-s0.x))/den;
    const f=(d0.y*(s1.x*s2.y-s2.x*s1.y)+d1.y*(s2.x*s0.y-s0.x*s2.y)+d2.y*(s0.x*s1.y-s1.x*s0.y))/den;
    return {a,b,c,d,e,f};
  }

  function drawTriangle(ctx,texture,s0,s1,s2,d0,d1,d2,alpha){
    const m=affineFromTriangles(s0,s1,s2,d0,d1,d2);
    if(!m)return;
    ctx.save();
    ctx.globalAlpha*=alpha;
    ctx.beginPath();ctx.moveTo(d0.x,d0.y);ctx.lineTo(d1.x,d1.y);ctx.lineTo(d2.x,d2.y);ctx.closePath();ctx.clip();
    ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    ctx.drawImage(texture,0,0);
    ctx.restore();
  }

  function renderRegion(args,region,poseGeom){
    const {ctx,view}=args;
    const dst=region.vertices.map(v=>projectLocal(skinnedVertex(v,region,poseGeom),view));
    for(const tri of region.triangles){
      const v0=region.vertices[tri[0]],v1=region.vertices[tri[1]],v2=region.vertices[tri[2]];
      drawTriangle(ctx,region.texture,v0.uv,v1.uv,v2.uv,dst[tri[0]],dst[tri[1]],dst[tri[2]],args.alpha??1);
    }
    if(wireframe){
      ctx.save();
      ctx.strokeStyle='rgba(145,232,214,.48)';
      ctx.lineWidth=Math.max(1,args.canvas.width*.0011);
      for(const tri of region.triangles){
        const a=dst[tri[0]],b=dst[tri[1]],c=dst[tri[2]];
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.stroke();
      }
      ctx.restore();
    }
  }

  function render(args){
    if(mode!=='mesh'||args.adapter?.id!=='fox'||!args.atlas)return false;
    const restRig=args.restRig||args.setup?.rig||FoxRig.loadRestRig?.()||FoxRig.DEFAULT_REST_RIG;
    const poseGeom=FoxRig.geometry(args.pose,restRig);
    const regions=regionsFor(args.atlas,restRig);
    args.ctx.save();
    args.ctx.imageSmoothingEnabled=true;
    for(const region of regions)renderRegion(args,region,poseGeom);
    args.ctx.restore();
    return true;
  }

  function updateUi(state=core.getState()){
    const visible=state.family==='fox';
    section.hidden=!visible;
    if(lastFamily!==state.family){lastFamily=state.family;}
    modeButtons.forEach(btn=>{
      const active=btn.dataset.meshMode===mode;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    wireBtn.classList.toggle('active',wireframe);wireBtn.setAttribute('aria-pressed',String(wireframe));wireBtn.disabled=mode!=='mesh';
  }

  modeButtons.forEach(btn=>btn.addEventListener('click',()=>{
    mode=btn.dataset.meshMode==='rigid'?'rigid':'mesh';
    updateUi();core.redrawOnly?.();
  }));
  wireBtn.addEventListener('click',()=>{wireframe=!wireframe;updateUi();core.redrawOnly?.();});

  core.registerArtRenderer('fox-deform-mesh',render);
  core.subscribe(state=>updateUi(state));
  updateUi();
})();
