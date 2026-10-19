(() => {
  'use strict';

  const core = window.AnimLabCore;
  const FoxRig = window.GameHubFoxRig;
  const host = document.getElementById('animlab-extension');
  if (!core || !FoxRig || !host || typeof core.registerArtRenderer !== 'function') {
    console.error('[Anim Lab Mesh] Required mesh preview hooks are missing.');
    return;
  }

  // Stage M1.3: keep the clean topology/twist-safe binding from M1.1, but feed it
  // one deliberately packed deform atlas cut from the approved charcoal Fox source.
  // A single atlas keeps the source coherent and avoids region-by-region image drift.
  // The old rigid atlas remains a fallback while the deform atlas is loading/unavailable.
  const REGION_DEFS = [
    {
      id:'tail', label:'Tail', order:0, topology:'chain', artRect:{x:16,y:590,w:655,h:366},
      parts:['tail_base','tail_mid','tail_tip'],
      subdivisions:3, scanHalfWidth:.115, maxCap:.070, widthPad:.0035,
      bones:[['tail0','tail1'],['tail1','tail2'],['tail2','tail3']],
      attachBone:['rearBody','midRoot'], attachBlendDistance:.11, attachStrength:.2
    },
    {
      id:'rearFar', label:'Rear Far Leg', order:1, topology:'chain', artRect:{x:1280,y:470,w:278,h:394},
      parts:['far_rear_upper','far_rear_lower_prox','far_rear_lower_dist'],
      subdivisions:3, scanHalfWidth:.075, maxCap:.052, widthPad:.003,
      bones:[['rearFarRoot','rearFarKnee'],['rearFarKnee','rearFarHock'],['rearFarHock','rearFarFoot']],
      attachBone:['rearBody','midRoot'], attachBlendDistance:.115, attachStrength:.32
    },
    {
      id:'frontFar', label:'Front Far Leg', order:2, topology:'chain', artRect:{x:1240,y:16,w:245,h:389},
      parts:['far_front_upper','far_front_lower_prox','far_front_lower_dist'],
      subdivisions:3, scanHalfWidth:.075, maxCap:.052, widthPad:.003,
      bones:[['frontFarRoot','frontFarKnee'],['frontFarKnee','frontFarWrist'],['frontFarWrist','frontFarFoot']],
      attachBone:['midRoot','frontBody'], attachBlendDistance:.12, attachStrength:.4
    },
    {
      id:'bodyHead', label:'Body + Head', order:3, topology:'grid', artRect:{x:16,y:16,w:904,h:555},
      parts:['torso','head_neck'],
      grid:[9,5],
      fit:{scaleX:.91,scaleY:.90,offsetYPct:.055},
      bones:[['rearBody','midRoot'],['midRoot','frontBody'],['frontBody','neck'],['neck','head']]
    },
    {
      id:'rearNear', label:'Rear Near Leg', order:4, topology:'chain', artRect:{x:960,y:470,w:278,h:394},
      parts:['near_rear_upper','near_rear_lower_prox','near_rear_lower_dist'],
      subdivisions:3, scanHalfWidth:.075, maxCap:.052, widthPad:.003,
      bones:[['rearNearRoot','rearNearKnee'],['rearNearKnee','rearNearHock'],['rearNearHock','rearNearFoot']],
      attachBone:['rearBody','midRoot'], attachBlendDistance:.115, attachStrength:.35
    },
    {
      id:'frontNear', label:'Front Near Leg', order:5, topology:'chain', artRect:{x:960,y:16,w:245,h:389},
      parts:['near_front_upper','near_front_lower_prox','near_front_lower_dist'],
      subdivisions:3, scanHalfWidth:.075, maxCap:.052, widthPad:.003,
      bones:[['frontNearRoot','frontNearKnee'],['frontNearKnee','frontNearWrist'],['frontNearWrist','frontNearFoot']],
      attachBone:['midRoot','frontBody'], attachBlendDistance:.12, attachStrength:.44
    }
  ];

  const PAD = 8;
  const CROP_PAD = 4;
  const TEXELS_PER_LOCAL = 900;
  const ALPHA_THRESHOLD = 10;
  const caches = new Map();
  const ART_VERSION = '1.0.173';
  const DEFORM_ATLAS_FILE = 'fox-deform-atlas-v2.png';
  let deformAtlas = null;
  let artRevision = 0;
  let mode = 'mesh';
  let wireframe = false;
  let inspectIndex = 0;
  let lastFamily = null;

  const INSPECT = [
    {id:'all',label:'All'},
    ...REGION_DEFS.map(def=>({id:def.id,label:def.label}))
  ];

  const section = document.createElement('section');
  section.className = 'animlab-section';
  section.id = 'animlab-mesh-preview-section';
  section.setAttribute('aria-labelledby','animlab-mesh-preview-title');
  section.innerHTML = `
    <div class="animlab-section-title" id="animlab-mesh-preview-title">Skin Prototype</div>
    <div class="animlab-setup-note">Stage M1.3 · fully rebuilt clean charcoal Fox deform atlas: new body + tail from the approved modular sheet, matched copied front/rear legs. Editor-only; rig and animation keys stay untouched.</div>
    <div class="animlab-segmented animlab-two" id="animlab-mesh-mode">
      <button type="button" data-mesh-mode="rigid">Rigid</button>
      <button type="button" data-mesh-mode="mesh">Deform</button>
    </div>
    <div class="animlab-view-grid">
      <button type="button" id="animlab-mesh-wire" aria-pressed="false">Mesh Wireframe</button>
      <button type="button" id="animlab-mesh-inspect">Inspect: All</button>
    </div>
  `;
  host.appendChild(section);

  const modeButtons = [...section.querySelectorAll('[data-mesh-mode]')];
  const wireBtn = section.querySelector('#animlab-mesh-wire');
  const inspectBtn = section.querySelector('#animlab-mesh-inspect');
  const setupNote = section.querySelector('.animlab-setup-note');

  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function dist(a,b){ return Math.hypot((b?.x||0)-(a?.x||0),(b?.y||0)-(a?.y||0)); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpPoint(a,b,t){ return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)}; }
  function unit(a,b){
    const x=b.x-a.x,y=b.y-a.y,l=Math.hypot(x,y)||1;
    return {x:x/l,y:y/l};
  }


  function loadDedicatedArt(){
    if(deformAtlas)return;
    const img=new Image();
    img.decoding='async';
    img.onload=()=>{
      artRevision++;
      caches.clear();
      core.redrawOnly?.();
    };
    img.onerror=()=>console.warn(`[Anim Lab Mesh] Deform atlas failed to load: ${DEFORM_ATLAS_FILE}`);
    img.src=`${DEFORM_ATLAS_FILE}?v=${ART_VERSION}`;
    deformAtlas=img;
  }

  function dedicatedArtFor(def){
    if(!deformAtlas||!deformAtlas.complete||deformAtlas.naturalWidth<=0||!def.artRect)return null;
    return {image:deformAtlas,rect:def.artRect};
  }

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

  function unprojectTexture(pt,sv){
    const flip=sv.flipX||1;
    return {x:(pt.x-sv.cx)/(sv.scale*flip),y:(sv.groundY-pt.y)/sv.scale};
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

  function readAlpha(canvas){
    try {
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const image=ctx.getImageData(0,0,canvas.width,canvas.height);
      return {width:canvas.width,height:canvas.height,data:image.data};
    } catch (err) {
      console.warn('[Anim Lab Mesh] Alpha readback unavailable; using uncropped fallback topology.',err);
      return null;
    }
  }

  function alphaAt(alpha,x,y){
    if(!alpha)return 255;
    const ix=Math.round(x),iy=Math.round(y);
    if(ix<0||iy<0||ix>=alpha.width||iy>=alpha.height)return 0;
    return alpha.data[(iy*alpha.width+ix)*4+3]||0;
  }

  function alphaBounds(alpha){
    if(!alpha)return null;
    let minX=alpha.width,minY=alpha.height,maxX=-1,maxY=-1;
    const {width,height,data}=alpha;
    for(let y=0;y<height;y++){
      const row=y*width*4;
      for(let x=0;x<width;x++){
        if(data[row+x*4+3]<=ALPHA_THRESHOLD)continue;
        if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      }
    }
    return maxX>=minX&&maxY>=minY?{minX,minY,maxX,maxY}:null;
  }

  function cropToOpaque(raw,rawView){
    const rawAlpha=readAlpha(raw),bounds=alphaBounds(rawAlpha);
    if(!bounds)return {texture:raw,view:rawView,alpha:rawAlpha};
    const x0=Math.max(0,Math.floor(bounds.minX-CROP_PAD));
    const y0=Math.max(0,Math.floor(bounds.minY-CROP_PAD));
    const x1=Math.min(raw.width-1,Math.ceil(bounds.maxX+CROP_PAD));
    const y1=Math.min(raw.height-1,Math.ceil(bounds.maxY+CROP_PAD));
    if(x0===0&&y0===0&&x1===raw.width-1&&y1===raw.height-1)return {texture:raw,view:rawView,alpha:rawAlpha};
    const texture=document.createElement('canvas');
    texture.width=Math.max(1,x1-x0+1);texture.height=Math.max(1,y1-y0+1);
    const ctx=texture.getContext('2d');
    ctx.drawImage(raw,-x0,-y0);
    const view={...rawView,cx:rawView.cx-x0,groundY:rawView.groundY-y0};
    return {texture,view,alpha:readAlpha(texture)};
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
      return {index,score:1/Math.pow(d+0.022,1.7)};
    }).sort((a,b)=>b.score-a.score).slice(0,3);
    const total=ranked.reduce((s,x)=>s+x.score,0)||1;
    return ranked.map(x=>({index:x.index,weight:x.score/total}));
  }

  function makeEdges(triangles){
    const seen=new Set(),edges=[];
    for(const tri of triangles){
      for(const pair of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){
        const a=Math.min(pair[0],pair[1]),b=Math.max(pair[0],pair[1]),key=`${a}:${b}`;
        if(seen.has(key))continue;
        seen.add(key);edges.push([a,b]);
      }
    }
    return edges;
  }

  function cellHasInk(alpha,x0,y0,x1,y1){
    if(!alpha)return true;
    const minX=clamp(Math.floor(Math.min(x0,x1)),0,alpha.width-1);
    const maxX=clamp(Math.ceil(Math.max(x0,x1)),0,alpha.width-1);
    const minY=clamp(Math.floor(Math.min(y0,y1)),0,alpha.height-1);
    const maxY=clamp(Math.ceil(Math.max(y0,y1)),0,alpha.height-1);
    const step=Math.max(1,Math.floor(Math.min(maxX-minX+1,maxY-minY+1)/12));
    for(let y=minY;y<=maxY;y+=step)for(let x=minX;x<=maxX;x+=step){
      if(alphaAt(alpha,x,y)>ALPHA_THRESHOLD)return true;
    }
    return false;
  }

  function chainJointIds(def){
    if(!def.bones.length)return[];
    return [def.bones[0][0],...def.bones.map(b=>b[1])];
  }

  function chainMetrics(points){
    const lengths=[],starts=[0];let total=0;
    for(let i=0;i<points.length-1;i++){
      const len=Math.max(1e-8,dist(points[i],points[i+1]));
      lengths.push(len);total+=len;starts.push(total);
    }
    return {lengths,starts,total};
  }

  function pointOnChain(points,metrics,s){
    if(points.length<2)return points[0]||{x:0,y:0};
    if(s<=0){
      const d=unit(points[0],points[1]);
      return {x:points[0].x+d.x*s,y:points[0].y+d.y*s};
    }
    if(s>=metrics.total){
      const last=points.length-1,d=unit(points[last-1],points[last]),extra=s-metrics.total;
      return {x:points[last].x+d.x*extra,y:points[last].y+d.y*extra};
    }
    for(let i=0;i<metrics.lengths.length;i++){
      const start=metrics.starts[i],end=metrics.starts[i+1];
      if(s<=end+1e-10)return lerpPoint(points[i],points[i+1],clamp((s-start)/metrics.lengths[i],0,1));
    }
    return points[points.length-1];
  }

  function chainFrame(points,metrics,s){
    const center=pointOnChain(points,metrics,s);
    if(points.length<2)return {center,tangent:{x:1,y:0},normal:{x:0,y:1}};
    const eps=Math.min(.012,Math.max(.0025,metrics.total*.025));
    const before=pointOnChain(points,metrics,s-eps),after=pointOnChain(points,metrics,s+eps);
    let tx=after.x-before.x,ty=after.y-before.y,tl=Math.hypot(tx,ty);
    if(tl<1e-7){
      const fallback=s<=0?unit(points[0],points[1]):unit(points[points.length-2],points[points.length-1]);
      tx=fallback.x;ty=fallback.y;tl=1;
    }
    const tangent={x:tx/tl,y:ty/tl};
    return {center,tangent,normal:{x:-tangent.y,y:tangent.x}};
  }

  function scanCrossSection(center,tangent,halfWidth,widthPad,view,alpha){
    const normal={x:-tangent.y,y:tangent.x};
    const step=Math.max(1.25/view.scale,.0011);
    const samples=[];
    for(let off=-halfWidth;off<=halfWidth+step*.5;off+=step){
      const p={x:center.x+normal.x*off,y:center.y+normal.y*off};
      const uv=projectLocal(p,view);
      samples.push({off,ink:alphaAt(alpha,uv.x,uv.y)>ALPHA_THRESHOLD});
    }
    const runs=[];let start=-1;
    for(let i=0;i<=samples.length;i++){
      const ink=i<samples.length&&samples[i].ink;
      if(ink&&start<0)start=i;
      if(!ink&&start>=0){runs.push([start,i-1]);start=-1;}
    }
    if(!runs.length)return null;
    let chosen=runs[0],best=Infinity;
    for(const run of runs){
      const lo=samples[run[0]].off,hi=samples[run[1]].off;
      const d=lo<=0&&hi>=0?0:Math.min(Math.abs(lo),Math.abs(hi));
      if(d<best){best=d;chosen=run;}
    }
    const pad=Math.max(widthPad||0,1.5/view.scale);
    return {
      min:clamp(samples[chosen[0]].off-pad,-halfWidth,halfWidth),
      max:clamp(samples[chosen[1]].off+pad,-halfWidth,halfWidth)
    };
  }

  function findCapDistance(origin,tangent,sign,def,view,alpha){
    const step=Math.max(2/view.scale,.002);
    let last=0,misses=0,seen=false;
    for(let d=0;d<=def.maxCap+step*.5;d+=step){
      const center={x:origin.x+tangent.x*d*sign,y:origin.y+tangent.y*d*sign};
      const span=scanCrossSection(center,tangent,def.scanHalfWidth,def.widthPad,view,alpha);
      if(span){last=d;misses=0;seen=true;}
      else if(seen&&++misses>=3)break;
    }
    return last;
  }

  function fillMissingSpans(spans,fallback=.012){
    for(let i=0;i<spans.length;i++){
      if(spans[i])continue;
      let left=i-1,right=i+1;
      while(left>=0&&!spans[left])left--;
      while(right<spans.length&&!spans[right])right++;
      if(left>=0&&right<spans.length){
        const t=(i-left)/(right-left);
        spans[i]={min:lerp(spans[left].min,spans[right].min,t),max:lerp(spans[left].max,spans[right].max,t)};
      } else if(left>=0)spans[i]={...spans[left]};
      else if(right<spans.length)spans[i]={...spans[right]};
      else spans[i]={min:-fallback,max:fallback};
    }
    const source=spans.map(s=>({...s}));
    for(let i=1;i<spans.length-1;i++){
      spans[i].min=source[i].min*.60+source[i-1].min*.20+source[i+1].min*.20;
      spans[i].max=source[i].max*.60+source[i-1].max*.20+source[i+1].max*.20;
      if(spans[i].max-spans[i].min<.006){
        const mid=(spans[i].max+spans[i].min)*.5;
        spans[i].min=mid-.003;spans[i].max=mid+.003;
      }
    }
    return spans;
  }

  function buildChainRegion(def,texture,view,alpha,bindGeom){
    const ids=chainJointIds(def),points=ids.map(id=>bindGeom[id]).filter(Boolean);
    if(points.length!==ids.length||points.length<2)return null;
    const metrics=chainMetrics(points);
    const firstTangent=unit(points[0],points[1]);
    const lastTangent=unit(points[points.length-2],points[points.length-1]);
    const before=findCapDistance(points[0],firstTangent,-1,def,view,alpha);
    const after=findCapDistance(points[points.length-1],lastTangent,1,def,view,alpha);
    const stationS=[];
    if(before>.0015)stationS.push(-before);
    for(let i=0;i<metrics.lengths.length;i++){
      const start=metrics.starts[i],len=metrics.lengths[i],steps=Math.max(1,def.subdivisions||2);
      for(let k=0;k<steps;k++){
        const s=start+len*(k/steps);
        if(!stationS.length||Math.abs(s-stationS[stationS.length-1])>1e-6)stationS.push(s);
      }
    }
    stationS.push(metrics.total);
    if(after>.0015)stationS.push(metrics.total+after);

    const frames=stationS.map(s=>chainFrame(points,metrics,s));
    const spans=fillMissingSpans(frames.map(frame=>scanCrossSection(frame.center,frame.tangent,def.scanHalfWidth,def.widthPad,view,alpha)));
    const vertices=[];
    for(let i=0;i<stationS.length;i++){
      const frame=frames[i],span=spans[i],mid=(span.min+span.max)*.5;
      for(const offset of [span.min,mid,span.max]){
        const bind={x:frame.center.x+frame.normal.x*offset,y:frame.center.y+frame.normal.y*offset};
        vertices.push({bind,uv:projectLocal(bind,view),chainS:stationS[i],offset});
      }
    }
    const triangles=[],across=3;
    for(let row=0;row<stationS.length-1;row++){
      for(let col=0;col<across-1;col++){
        const a=row*across+col,b=a+1,c=a+across,d=c+1;
        if((row+col)&1)triangles.push([a,b,c],[b,d,c]);
        else triangles.push([a,b,d],[a,d,c]);
      }
    }
    return {...def,texture,vertices,triangles,edges:makeEdges(triangles),bindGeom,chainIds:ids,bindMetrics:metrics,binding:'chain'};
  }

  function buildGridRegion(def,texture,view,alpha,bindGeom){
    const [cols,rows]=def.grid;
    const vertices=[];
    for(let y=0;y<=rows;y++){
      const ty=y/rows;
      for(let x=0;x<=cols;x++){
        const tx=x/cols,uv={x:texture.width*tx,y:texture.height*ty};
        const bind=unprojectTexture(uv,view);
        vertices.push({bind,uv,weights:weightsForPoint(bind,def.bones,bindGeom)});
      }
    }
    const triangles=[],stride=cols+1;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const x0=texture.width*x/cols,x1=texture.width*(x+1)/cols;
      const y0=texture.height*y/rows,y1=texture.height*(y+1)/rows;
      if(!cellHasInk(alpha,x0,y0,x1,y1))continue;
      const i=y*stride+x,a=i,b=i+1,c=i+stride,d=i+stride+1;
      if((x+y)&1)triangles.push([a,b,c],[b,d,c]);
      else triangles.push([a,b,d],[a,d,c]);
    }
    return {...def,texture,vertices,triangles,edges:makeEdges(triangles),bindGeom,binding:'weights'};
  }

  function buildRegion(def,atlas,restRig){
    const bindGeom=FoxRig.geometry(BIND_POSE,restRig);
    const allParts=FoxRig.partsForPose(BIND_POSE,restRig);
    const wanted=new Set(def.parts);
    const parts=allParts.filter(p=>wanted.has(p.name));
    const bbox=bboxForParts(parts);
    if(!bbox)return null;
    const width=Math.max(1e-4,bbox.maxX-bbox.minX),height=Math.max(1e-4,bbox.maxY-bbox.minY);
    const scale=TEXELS_PER_LOCAL;
    const raw=document.createElement('canvas');
    raw.width=Math.max(32,Math.ceil(width*scale)+PAD*2);
    raw.height=Math.max(32,Math.ceil(height*scale)+PAD*2);
    const rctx=raw.getContext('2d');
    rctx.clearRect(0,0,raw.width,raw.height);rctx.imageSmoothingEnabled=true;
    const rawView={scale,cx:PAD-bbox.minX*scale,groundY:PAD+bbox.maxY*scale,flipX:1};
    const dedicated=dedicatedArtFor(def);
    if(dedicated){
      // Stage M1.3 uses one source atlas cut from the approved charcoal Fox. Each
      // region keeps a known clean rectangle, then fits into the already-approved
      // bind-space region without changing rig proportions or animation keys.
      const r=dedicated.rect;
      const fit=def.fit||{};
      const innerW=Math.max(1,raw.width-PAD*2), innerH=Math.max(1,raw.height-PAD*2);
      const scaleX=fit.scaleX ?? fit.scale ?? 1;
      const scaleY=fit.scaleY ?? fit.scale ?? 1;
      const drawW=Math.max(1,innerW*scaleX), drawH=Math.max(1,innerH*scaleY);
      const alignX=fit.alignX ?? .5, alignY=fit.alignY ?? .5;
      const dx=PAD + (innerW-drawW)*alignX + innerW*(fit.offsetXPct||0) + (fit.offsetX||0);
      const dy=PAD + (innerH-drawH)*alignY + innerH*(fit.offsetYPct||0) + (fit.offsetY||0);
      rctx.drawImage(dedicated.image,r.x,r.y,r.w,r.h,dx,dy,drawW,drawH);
    }else{
      // Safe fallback while images are loading/offline: rebuild from the rigid atlas
      // exactly as M1.1 did, so Deform never disappears because one source failed.
      for(const part of parts)drawPartToTexture(rctx,atlas,part,rawView);
    }

    const cropped=cropToOpaque(raw,rawView);
    const region=def.topology==='chain'
      ? buildChainRegion(def,cropped.texture,cropped.view,cropped.alpha,bindGeom)
      : buildGridRegion(def,cropped.texture,cropped.view,cropped.alpha,bindGeom);
    return region?{...region,textureView:cropped.view,artSource:dedicated?'dedicated':'fallback'}:null;
  }

  function rigKey(restRig){
    try{return JSON.stringify(restRig?.joints||restRig||{});}catch(_){return'fox';}
  }

  function regionsFor(atlas,restRig){
    const key=`${artRevision}:${rigKey(restRig)}`;
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

  function weightedVertex(vertex,region,poseGeom){
    let x=0,y=0,total=0;
    for(const influence of vertex.weights||[]){
      const bone=region.bones[influence.index];
      const bindA=region.bindGeom[bone[0]],bindB=region.bindGeom[bone[1]];
      const poseA=poseGeom[bone[0]],poseB=poseGeom[bone[1]];
      if(!bindA||!bindB||!poseA||!poseB)continue;
      const q=mapByBone(vertex.bind,bindA,bindB,poseA,poseB);
      x+=q.x*influence.weight;y+=q.y*influence.weight;total+=influence.weight;
    }
    return total>1e-6?{x:x/total,y:y/total}:vertex.bind;
  }

  function chainVertex(vertex,region,poseGeom){
    const points=region.chainIds.map(id=>poseGeom[id]).filter(Boolean);
    if(points.length!==region.chainIds.length)return vertex.bind;
    const metrics=chainMetrics(points),frame=chainFrame(points,metrics,vertex.chainS);
    let out={x:frame.center.x+frame.normal.x*vertex.offset,y:frame.center.y+frame.normal.y*vertex.offset};
    const attach=region.attachBone;
    if(attach&&region.bindGeom&&typeof region.attachBlendDistance==='number'&&region.attachBlendDistance>0){
      const bindA=region.bindGeom[attach[0]], bindB=region.bindGeom[attach[1]];
      const poseA=poseGeom[attach[0]], poseB=poseGeom[attach[1]];
      if(bindA&&bindB&&poseA&&poseB){
        const attachPos=mapByBone(vertex.bind,bindA,bindB,poseA,poseB);
        const s=Math.max(0,vertex.chainS||0);
        const rootBlend=1-clamp(s/region.attachBlendDistance,0,1);
        const offsetBlend=1-clamp(Math.abs(vertex.offset)/0.085,0,1)*0.35;
        const t=clamp((region.attachStrength||0.3)*rootBlend*(0.65+offsetBlend),0,0.85);
        out=lerpPoint(out,attachPos,t);
      }
    }
    return out;
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

  function renderWireframe(ctx,region,dst,args){
    const inspect=INSPECT[inspectIndex]?.id||'all';
    if(!wireframe||(inspect!=='all'&&inspect!==region.id))return;
    ctx.save();
    ctx.strokeStyle='rgba(145,232,214,.58)';
    ctx.lineWidth=Math.max(1,args.canvas.width*.00105);
    ctx.beginPath();
    for(const edge of region.edges){
      const a=dst[edge[0]],b=dst[edge[1]];
      if(!a||!b)continue;
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Part Layout transforms are authored against a neutral, unskinned bind-space
  // view. Outside Parts the legacy v191 posed binding is intentionally retained
  // until the separate P2 Rig/Rebind stage. No UV/texture/key changes.
  const PART_PIVOTS = Object.freeze({bodyHead:'midRoot',tail:'tail0',
    frontNear:'frontNearRoot',frontFar:'frontFarRoot',rearNear:'rearNearRoot',rearFar:'rearFarRoot'});
  function layoutVertex(point,regionId,poseGeom,artLayout,partsMode){
    const tr=artLayout?.parts?.[regionId];
    if(!tr)return point;
    const dx=Number(tr.x)||0,dy=Number(tr.y)||0;
    const fallback=Number(tr.scale)||1;
    const sx=clamp(Number(tr.scaleX)||fallback,.25,3),sy=clamp(Number(tr.scaleY)||fallback,.25,3);
    const r=Number(tr.rotation)||0;
    if(!dx&&!dy&&sx===1&&sy===1&&!r)return point;
    const desc=FoxRig.ART_LAYOUT_DESIGNER?.parts?.find(p=>p.id===regionId);
    // Parts use a fixed rest-space pivot. For Animate preserve v191's posed
    // joint-based pivot for old saved layouts; new pivot edits are offsets
    // from that original joint, pending true independent P2 skin rebind.
    const restPivot=desc?.pivot||{x:0,y:0};
    const selected={x:Number.isFinite(Number(tr.pivotX))?Number(tr.pivotX):restPivot.x,
      y:Number.isFinite(Number(tr.pivotY))?Number(tr.pivotY):restPivot.y};
    const posed=poseGeom[PART_PIVOTS[regionId]]||restPivot;
    const pivot=partsMode?selected:{x:posed.x+selected.x-restPivot.x,y:posed.y+selected.y-restPivot.y};
    const x=point.x-pivot.x,y=point.y-pivot.y,c=Math.cos(r),sn=Math.sin(r);
    return {x:pivot.x+dx+x*sx*c-y*sy*sn,y:pivot.y+dy+x*sx*sn+y*sy*c};
  }
  function renderRegion(args,region,poseGeom,partsMode){
    const {ctx,view}=args;
    const dst=region.vertices.map(v=>projectLocal(layoutVertex(
      partsMode?v.bind:(region.binding==='chain'?chainVertex(v,region,poseGeom):weightedVertex(v,region,poseGeom)),
      region.id,poseGeom,args.setup?.artLayout,partsMode),view));
    for(const tri of region.triangles){
      const v0=region.vertices[tri[0]],v1=region.vertices[tri[1]],v2=region.vertices[tri[2]];
      drawTriangle(ctx,region.texture,v0.uv,v1.uv,v2.uv,dst[tri[0]],dst[tri[1]],dst[tri[2]],args.alpha??1);
    }
    renderWireframe(ctx,region,dst,args);
  }

  function render(args){
    if(args.adapter?.id!=='fox'||!args.atlas)return false;
    const editor=core.getState();
    const partsMode=editor.mode==='setup'&&editor.setupTool==='art';
    if(mode!=='mesh'&&!partsMode)return false;
    const restRig=args.restRig||args.setup?.rig||FoxRig.loadRestRig?.()||FoxRig.DEFAULT_REST_RIG;
    const poseGeom=FoxRig.geometry(partsMode?BIND_POSE:args.pose,restRig);
    const regions=regionsFor(args.atlas,restRig);
    const layout=args.setup?.artLayout,display=partsMode?window.AnimLabPartLayoutDisplay:null;
    const solo=display?.getSolo?.()||null;
    const order=Array.isArray(layout?.order)?layout.order:REGION_DEFS.map(r=>r.id);
    const byId=new Map(regions.map(region=>[region.id,region]));
    args.ctx.save();
    args.ctx.imageSmoothingEnabled=true;
    for(const id of order){
      const region=byId.get(id);
      if(!region||display?.isHidden?.(id)||(solo&&id!==solo))continue;
      renderRegion(args,region,poseGeom,partsMode);
    }
    args.ctx.restore();
    return true;
  }

  function updateUi(state=core.getState()){
    const visible=state.family==='fox';
    section.hidden=!visible;
    if(lastFamily!==state.family){lastFamily=state.family;}
    const partsMode=state.mode==='setup'&&state.setupTool==='art';
    modeButtons.forEach(btn=>{
      const active=btn.dataset.meshMode===(partsMode?'mesh':mode);
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
      btn.disabled=partsMode;
    });
    wireBtn.classList.toggle('active',wireframe);wireBtn.setAttribute('aria-pressed',String(wireframe));wireBtn.disabled=mode!=='mesh';
    inspectBtn.disabled=mode!=='mesh'||!wireframe;
    inspectBtn.textContent=`Inspect: ${INSPECT[inspectIndex]?.label||'All'}`;
    if(setupNote){
      const ready=!!dedicatedArtFor(REGION_DEFS[0]);
      setupNote.textContent=ready
        ? 'Stage M1.3 · clean deform atlas v2 rebuilt entirely from the approved modular charcoal source is loaded. Editor-only; rig and animation keys stay untouched.'
        : 'Stage M1.3 · loading clean charcoal Fox deform atlas v2; rigid-atlas fallback remains active.';
    }
  }

  modeButtons.forEach(btn=>btn.addEventListener('click',()=>{
    mode=btn.dataset.meshMode==='rigid'?'rigid':'mesh';
    updateUi();core.redrawOnly?.();
  }));
  wireBtn.addEventListener('click',()=>{wireframe=!wireframe;updateUi();core.redrawOnly?.();});
  inspectBtn.addEventListener('click',()=>{inspectIndex=(inspectIndex+1)%INSPECT.length;updateUi();core.redrawOnly?.();});

  loadDedicatedArt();
  core.registerArtRenderer('fox-deform-mesh',render);
  core.subscribe(state=>updateUi(state));
  updateUi();
})();
