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
  // Skin mode owns display-only choices. Authored tuning is in Setup's Undoable
  // working copy; it never mutates procedural topology or the source atlas.
  let selectedSkinRegion = 'bodyHead';
  let selectedSkinBone = 0;
  let selectedSkinVertex = 22;
  let skinPreview = 'walk';
  let skinPhase = .25;
  let skinPickArmed = false;
  let skinHeatmap = true; // editor overlay, never written into character Setup
  let skinBonesRestore = null;
  let skinLastViewport = null;
  let sliderTx = null;
  let sliderField = null;


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

  const skinSection=document.createElement('section');
  skinSection.id='animlab-skin-editor';
  skinSection.className='animlab-section animlab-skin-editor';
  skinSection.hidden=true;
  skinSection.innerHTML=`
    <div class="animlab-section-title">Skin / Weight Editor</div>
    <p class="animlab-skin-note">Select a part, preview a pose, and adjust deformation without changing artwork or rig. Save commits changes; Discard and Undo are supported.</p>
    <div class="animlab-skin-region-board" aria-label="Skin regions"></div>
    <div class="animlab-view-grid animlab-skin-preview-controls">
      <button type="button" data-skin-preview="neutral">Rest</button>
      <button type="button" data-skin-preview="walk">Walk</button>
      <button type="button" data-skin-preview="run">Run</button>
      <button type="button" data-skin-phase>Phase: ¼</button>
    </div>
    <div class="animlab-skin-bone-picker">
      <div class="animlab-section-title">Selected bone / influence</div>
      <div class="animlab-skin-bones" aria-label="Bones affecting selected part"></div>
      <label class="animlab-slider"><span>Bone Influence</span><input data-skin-field="boneGain" type="range" min="0.05" max="3" step="0.05" value="1"><output>100%</output></label>
      <label class="animlab-slider"><span>Influence Spread / Falloff</span><input data-skin-field="boneSpread" type="range" min="0.5" max="2.5" step="0.05" value="1"><output>1.00×</output></label>
      <div class="animlab-view-grid animlab-skin-heat-tools">
        <button type="button" data-skin-action="heatmap" class="active">Heatmap: On</button>
        <button type="button" data-skin-action="auto-bone">Reset Bone</button>
      </div>
      <div class="animlab-skin-legend" aria-label="Influence colours"><span>0% · Blue</span><i></i><span>Red · 100%</span></div>
      <p class="animlab-skin-note">Pick a part, then a bone. Red is strongest influence, blue is weakest. Strength and falloff adjust that bone over the whole part; fine vertex editing is optional below.</p>
    </div>
    <div class="animlab-skin-chain-controls" hidden>
      <label class="animlab-slider"><span>Body / Root Influence</span><input data-skin-field="attachStrength" type="range" min="0" max="0.85" step="0.01"><output></output></label>
      <label class="animlab-slider"><span>Blend Along Part</span><input data-skin-field="attachBlendDistance" type="range" min="0.025" max="0.35" step="0.005"><output></output></label>
      <p class="animlab-skin-note">Increase body influence to carry the top of a leg or tail with the torso. Blend distance controls how far along the part it fades.</p>
    </div>
    <details class="animlab-skin-advanced"><summary>Advanced · Individual Vertex Weights</summary>
    <div class="animlab-skin-grid-controls">
      <div class="animlab-view-grid animlab-skin-grid-tools">
        <button type="button" data-skin-action="previous">◀ Vertex</button>
        <button type="button" data-skin-action="next">Vertex ▶</button>
        <button type="button" data-skin-action="pick">Pick Vertex</button>
        <button type="button" data-skin-action="auto-vertex">Auto Vertex</button>
      </div>
      <div class="animlab-skin-vertex-status" role="status"></div>
      <label class="animlab-slider"><span>Selected Bone Weight</span><input data-skin-field="vertexBoneWeight" type="range" min="0" max="1" step="0.01"><output></output></label>
      <p class="animlab-skin-note">Fine edit: only the selected vertex is changed, other weights are normalised to 100%. Use Pick Vertex to tap a visible dot. Reset Bone and Auto Vertex are separate operations.</p>
    </div></details>
    <div class="animlab-skin-actions">
      <button type="button" data-skin-action="copy-pair">Copy To Matching Side</button>
      <button type="button" data-skin-action="reset-region">Reset Region</button>
    </div>
    <p class="animlab-skin-note">Editor-only in this stage: gameplay still uses its existing Fox mesh. A later integration stage will connect saved skin tuning to the runtime.</p>
  `;
  section.insertAdjacentElement('afterend',skinSection);
  const skinRegionBoard=skinSection.querySelector('.animlab-skin-region-board');
  const skinBoneBoard=skinSection.querySelector('.animlab-skin-bones');
  const skinAdvanced=skinSection.querySelector('.animlab-skin-advanced');
  const skinChainControls=skinSection.querySelector('.animlab-skin-chain-controls');
  const skinGridControls=skinSection.querySelector('.animlab-skin-grid-controls');
  const skinVertexStatus=skinSection.querySelector('.animlab-skin-vertex-status');
  const skinPhaseButton=skinSection.querySelector('[data-skin-phase]');
  const skinCanvas=document.getElementById('animlab-canvas');


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

  function activeVertexWeights(vertex,region,vertexIndex,tuning){
    const original=vertex.weights||[];
    const edited=tuning?.vertexWeights?.[vertexIndex];
    if(!Array.isArray(edited))return original;
    // Full influence array indexed by the region's actual bone descriptor.
    // Never silently rebuild topology or introduce external joint IDs.
    const clean=region.bones.map((_,index)=>Math.max(0,Number(edited[index])||0));
    const total=clean.reduce((a,b)=>a+b,0);
    return total>1e-8?clean.map((weight,index)=>({index,weight:weight/total})).filter(x=>x.weight>1e-8):original;
  }

  function boneProfilesActive(tuning){
    return !!Object.values(tuning?.boneProfiles||{}).some(p=>p&&(Math.abs((Number(p.gain)||1)-1)>.0001||Math.abs((Number(p.spread)||1)-1)>.0001));
  }
  function editedVertexWeights(vertex,region,vertexIndex,tuning){
    const manual=tuning?.vertexWeights?.[vertexIndex];
    if(Array.isArray(manual))return activeVertexWeights(vertex,region,vertexIndex,tuning);
    const baseline=region.binding==='weights'?vertex.weights:weightsForPoint(vertex.bind,region.bones,region.bindGeom);
    if(!boneProfilesActive(tuning))return baseline;
    const result=region.bones.map((bone,index)=>{
      const initial=baseline.find(w=>w.index===index)?.weight||.001;
      const profile=tuning.boneProfiles?.[index]||{};
      const gain=clamp(Number(profile.gain)||1,.05,3),spread=clamp(Number(profile.spread)||1,.5,2.5);
      const a=region.bindGeom[bone[0]],b=region.bindGeom[bone[1]];
      const distance=a&&b?pointSegmentDistance(vertex.bind,a,b):.1;
      return {index,weight:initial*gain*Math.pow(clamp((distance+.045)/.09,.2,8),1.7*(1-1/spread))};
    });
    const total=result.reduce((a,b)=>a+b.weight,0)||1;
    return result.map(w=>({...w,weight:w.weight/total}));
  }
  function vertexWeight(vertex,region,index,tuning){
    return editedVertexWeights(vertex,region,index,tuning).find(w=>w.index===selectedSkinBone)?.weight||0;
  }
  function heatColor(weight){
    const stops=[[0,[37,74,212]],[.18,[36,177,230]],[.45,[56,203,96]],[.67,[245,226,56]],[.84,[255,135,38]],[1,[235,42,49]]];
    const w=clamp(weight,0,1);
    for(let i=1;i<stops.length;i++)if(w<=stops[i][0]){
      const [a,ca]=stops[i-1],[b,cb]=stops[i];const t=(w-a)/(b-a);
      return `rgb(${ca.map((c,j)=>Math.round(lerp(c,cb[j],t))).join(',')})`;
    }
    return 'rgb(235,42,49)';
  }
  let heatTextureCache=null;
  function texturedHeatmap(region,tuning){
    // Paint in source texture UV, then use its existing alpha as a mask.
    // Unlike a screen-space triangle overlay, this never colours transparent
    // rectangle corners or empty spaces between Fox body/leg silhouettes.
    const key=JSON.stringify([region.id,selectedSkinBone,tuning,artRevision]);
    if(heatTextureCache?.key===key&&heatTextureCache.region===region)return heatTextureCache.texture;
    const texture=document.createElement('canvas');
    texture.width=region.texture.width;texture.height=region.texture.height;
    const ctx=texture.getContext('2d');ctx.drawImage(region.texture,0,0);
    const weights=region.vertices.map((v,i)=>vertexWeight(v,region,i,tuning));
    ctx.save();ctx.globalAlpha=.7;
    for(const tri of region.triangles){
      const pt=tri.map(i=>region.vertices[i].uv);const vals=tri.map(i=>weights[i]);
      const low=vals.indexOf(Math.min(...vals)),high=vals.indexOf(Math.max(...vals));
      ctx.beginPath();ctx.moveTo(pt[0].x,pt[0].y);ctx.lineTo(pt[1].x,pt[1].y);ctx.lineTo(pt[2].x,pt[2].y);ctx.closePath();
      if(Math.abs(vals[high]-vals[low])<.012)ctx.fillStyle=heatColor(vals[0]);
      else{
        const a=pt[low],b=pt[high],g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
        g.addColorStop(0,heatColor(vals[low]));g.addColorStop(1,heatColor(vals[high]));ctx.fillStyle=g;
      }
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation='destination-in';ctx.drawImage(region.texture,0,0);
    ctx.globalCompositeOperation='source-over';
    heatTextureCache={key,region,texture};
    return texture;
  }
  function drawPosedSkinRig(args,poseGeom){
    if(!poseGeom)return;
    const {ctx,view,canvas}=args,seen=new Set();
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const region of REGION_DEFS)for(let i=0;i<region.bones.length;i++){
      const [a,b]=region.bones[i],key=`${a}:${b}`;if(seen.has(key))continue;seen.add(key);
      const p=poseGeom[a],q=poseGeom[b];if(!p||!q)continue;
      const P=projectLocal(p,view),Q=projectLocal(q,view);
      const active=region.id===selectedSkinRegion&&i===selectedSkinBone;
      ctx.lineWidth=active?Math.max(1.5,Math.min(2.8,canvas.width*.0021)):Math.max(.7,Math.min(1.4,canvas.width*.0011));
      ctx.strokeStyle=active?'rgba(255,226,139,.96)':'rgba(236,241,240,.43)';
      ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(Q.x,Q.y);ctx.stroke();
      if(active){for(const v of [P,Q]){
        ctx.beginPath();ctx.arc(v.x,v.y,Math.max(2.5,Math.min(4,canvas.width*.003)),0,Math.PI*2);
        ctx.fillStyle='rgba(255,229,145,.92)';ctx.fill();
      }}
    }
    ctx.restore();
  }
  function weightedVertex(vertex,region,poseGeom,bindGeom,vertexIndex,tuning){
    let x=0,y=0,total=0;
    for(const influence of editedVertexWeights(vertex,region,vertexIndex,tuning)){
      const bone=region.bones[influence.index];
      const bindA=bindGeom[bone[0]],bindB=bindGeom[bone[1]];
      const poseA=poseGeom[bone[0]],poseB=poseGeom[bone[1]];
      if(!bindA||!bindB||!poseA||!poseB)continue;
      const q=mapByBone(vertex.bind,bindA,bindB,poseA,poseB);
      x+=q.x*influence.weight;y+=q.y*influence.weight;total+=influence.weight;
    }
    return total>1e-6?{x:x/total,y:y/total}:vertex.bind;
  }

  function chainVertex(vertex,region,poseGeom,bindGeom,tuning){
    const posed=region.chainIds.map(id=>poseGeom[id]);
    const rested=region.chainIds.map(id=>bindGeom[id]);
    if(posed.some(p=>!p)||rested.some(p=>!p))return vertex.bind;
    const poseMetrics=chainMetrics(posed),restMetrics=chainMetrics(rested);
    // Map each source station to a proportionate station on the explicit
    // bind rig. Rotate/deform the local offset relative to that rest frame.
    // At bind == pose this is mathematically the original vertex position,
    // even when art geometry was originally built with a different rig.
    const sourceLength=Math.max(1e-8,region.bindMetrics.total);
    const fraction=vertex.chainS/sourceLength;
    const restS=fraction*restMetrics.total,poseS=fraction*poseMetrics.total;
    const restFrame=chainFrame(rested,restMetrics,restS);
    const poseFrame=chainFrame(posed,poseMetrics,poseS);
    const dx=vertex.bind.x-restFrame.center.x,dy=vertex.bind.y-restFrame.center.y;
    const along=dx*restFrame.tangent.x+dy*restFrame.tangent.y;
    const across=dx*restFrame.normal.x+dy*restFrame.normal.y;
    let out={x:poseFrame.center.x+poseFrame.tangent.x*along+poseFrame.normal.x*across,
             y:poseFrame.center.y+poseFrame.tangent.y*along+poseFrame.normal.y*across};
    const attach=region.attachBone;
    const blendDistance=clamp(Number(tuning?.attachBlendDistance ?? region.attachBlendDistance),.025,.35);
    const strength=clamp(Number(tuning?.attachStrength ?? region.attachStrength),0,.85);
    if(attach&&blendDistance>0){
      const bindA=bindGeom[attach[0]], bindB=bindGeom[attach[1]];
      const poseA=poseGeom[attach[0]], poseB=poseGeom[attach[1]];
      if(bindA&&bindB&&poseA&&poseB){
        const attachPos=mapByBone(vertex.bind,bindA,bindB,poseA,poseB);
        const s=Math.max(0,vertex.chainS||0);
        const rootBlend=1-clamp(s/blendDistance,0,1);
        const offsetBlend=1-clamp(Math.abs(vertex.offset)/0.085,0,1)*0.35;
        const t=clamp(strength*rootBlend*(0.65+offsetBlend),0,0.85);
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
    const skinEditing=core.getState().mode==='setup'&&core.getState().setupTool==='skin';
    if(!(wireframe||(skinEditing&&skinAdvanced.open&&selectedSkinRegion===region.id))||(!skinEditing&&inspect!=='all'&&inspect!==region.id))return;
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

  // P2: fixed source-art space and explicit inverse-bind rest space.
  // Layout happens BEFORE deformation, using stable character-space pivots.
  // The inverse bind and current posed geometry coincide at neutral rest, so
  // the assembled artwork is never displaced simply by moving a Rig joint.
  const ART_PARTS=new Map((FoxRig.ART_LAYOUT_DESIGNER?.parts||[]).map(part=>[part.id,part]));
  function layoutVertex(point,regionId,artLayout){
    const tr=artLayout?.parts?.[regionId];
    if(!tr)return point;
    const dx=Number(tr.x)||0,dy=Number(tr.y)||0;
    const fallback=Number(tr.scale)||1;
    const sx=clamp(Number(tr.scaleX)||fallback,.25,3),sy=clamp(Number(tr.scaleY)||fallback,.25,3);
    const r=Number(tr.rotation)||0;
    if(!dx&&!dy&&sx===1&&sy===1&&!r)return point;
    const desc=ART_PARTS.get(regionId);
    const restPivot=desc?.pivot||{x:0,y:0};
    const pivot={x:Number.isFinite(Number(tr.pivotX))?Number(tr.pivotX):restPivot.x,
      y:Number.isFinite(Number(tr.pivotY))?Number(tr.pivotY):restPivot.y};
    const x=point.x-pivot.x,y=point.y-pivot.y,c=Math.cos(r),sn=Math.sin(r);
    return {x:pivot.x+dx+x*sx*c-y*sy*sn,y:pivot.y+dy+x*sx*sn+y*sy*c};
  }
  // In Parts and unposed Rig, source pixels are rigid, not skinned: draw each
  // region texture with one affine canvas transform instead of ~100 triangles.
  // This fast path runs throughout pad dragging; the Skin heatmap still uses
  // the complete mesh so weighted previews remain physically meaningful.
  function renderNeutralRegion(args,region){
    const {ctx,view}=args;
    const tr=args.setup?.artLayout?.parts?.[region.id]||{};
    const desc=ART_PARTS.get(region.id);
    const fallback=Number(tr.scale)||1;
    const sx=clamp(Number(tr.scaleX)||fallback,.25,3),sy=clamp(Number(tr.scaleY)||fallback,.25,3);
    const pivot={x:Number.isFinite(Number(tr.pivotX))?Number(tr.pivotX):(desc?.pivot?.x||0),
      y:Number.isFinite(Number(tr.pivotY))?Number(tr.pivotY):(desc?.pivot?.y||0)};
    const source=region.textureView;
    if(!source)return false;
    ctx.save();ctx.globalAlpha*=args.alpha??1;ctx.imageSmoothingEnabled=true;
    ctx.translate(view.cx,view.groundY);ctx.scale(view.scale*(view.flipX||1),-view.scale);
    ctx.translate(pivot.x+(Number(tr.x)||0),pivot.y+(Number(tr.y)||0));
    ctx.rotate(Number(tr.rotation)||0);ctx.scale(sx,sy);ctx.translate(-pivot.x,-pivot.y);
    ctx.transform(1/source.scale,0,0,-1/source.scale,-source.cx/source.scale,source.groundY/source.scale);
    ctx.drawImage(region.texture,0,0);
    ctx.restore();return true;
  }
  function renderRegion(args,region,poseGeom,bindGeom,neutralMode,skinEditing){
    const {ctx,view}=args;
    const tuning=args.setup?.skinTuning?.regions?.[region.id]||{};
    if(neutralMode&&!skinEditing&&renderNeutralRegion(args,region))return;
    const dst=region.vertices.map((v,index)=>{
      const point=layoutVertex(v.bind,region.id,args.setup?.artLayout);
      const adjusted={...v,bind:point};
      const drawn=neutralMode?point:(region.binding==='chain'
        ? (()=>{
          const chain=chainVertex(adjusted,region,poseGeom,bindGeom,tuning);
          if(!boneProfilesActive(tuning)&&!tuning?.vertexWeights?.[index])return chain;
          const weighted=weightedVertex(adjusted,region,poseGeom,bindGeom,index,tuning);
          return lerpPoint(chain,weighted,.85);
        })()
        : weightedVertex(adjusted,region,poseGeom,bindGeom,index,tuning));
      return projectLocal(drawn,view);
    });
    const texture=skinEditing&&selectedSkinRegion===region.id&&skinHeatmap?texturedHeatmap(region,tuning):region.texture;
    for(const tri of region.triangles){
      const v0=region.vertices[tri[0]],v1=region.vertices[tri[1]],v2=region.vertices[tri[2]];
      drawTriangle(ctx,texture,v0.uv,v1.uv,v2.uv,dst[tri[0]],dst[tri[1]],dst[tri[2]],args.alpha??1);
    }
    renderWireframe(ctx,region,dst,args);
    if(skinEditing&&selectedSkinRegion===region.id){
      ctx.save();
      if(skinAdvanced.open){
        const radius=Math.max(2,args.canvas.width*.0022);
        for(let i=0;i<dst.length;i++){
          const pt=dst[i];if(!pt)continue;
          ctx.beginPath();ctx.arc(pt.x,pt.y,i===selectedSkinVertex?radius*1.9:radius,0,Math.PI*2);
          ctx.fillStyle=heatColor(vertexWeight(region.vertices[i],region,i,tuning));
          ctx.fill();ctx.strokeStyle=i===selectedSkinVertex?'#fff9d7':'#21373b';ctx.lineWidth=i===selectedSkinVertex?1.8:.6;ctx.stroke();
        }
      }
      ctx.restore();
      // Hit-test uses the same projected posed vertices as the rendering.
      skinLastViewport={regionId:region.id,points:dst,view};
    }
  }

  function render(args){
    if(args.adapter?.id!=='fox'||!args.atlas)return false;
    const editor=core.getState();
    const setupMode=editor.mode==='setup';
    const partsMode=setupMode&&editor.setupTool==='art';
    const rigMode=setupMode&&editor.setupTool==='rig';
    const skinEditing=setupMode&&editor.setupTool==='skin';
    if(mode!=='mesh'&&!setupMode)return false;
    const restRig=args.restRig||args.setup?.rig||FoxRig.loadRestRig?.()||FoxRig.DEFAULT_REST_RIG;
    const artRig=args.setup?.artRestRig||restRig;
    skinLastAtlas=args.atlas;
    const regions=regionsFor(args.atlas,artRig);
    const preview=rigMode?window.AnimLabRigBindPreview?.getMode?.()||'off':'off';
    const neutralMode=setupMode&&(partsMode||(rigMode&&preview==='off')||(skinEditing&&skinPreview==='neutral'));
    const pose=rigMode&&preview!=='off'
      ?(core.evaluateClip?.('walk',.25,'fox')||args.pose)
      :skinEditing&&skinPreview!=='neutral'
        ?(core.evaluateClip?.(skinPreview,skinPhase,'fox')||args.pose):args.pose;
    const poseGeom=neutralMode?null:FoxRig.geometry(pose,restRig);
    const bindRig=rigMode&&preview==='candidate'?restRig:(args.setup?.skinBindRig||restRig);
    const bindGeom=neutralMode?null:FoxRig.geometry(BIND_POSE,bindRig);
    const layout=args.setup?.artLayout,display=partsMode?window.AnimLabPartLayoutDisplay:null;
    const solo=display?.getSolo?.()||null;
    const order=Array.isArray(layout?.order)?layout.order:REGION_DEFS.map(r=>r.id);
    const byId=new Map(regions.map(region=>[region.id,region]));
    args.ctx.save();
    args.ctx.imageSmoothingEnabled=true;
    for(const id of order){
      const region=byId.get(id);
      if(!region||display?.isHidden?.(id)||(solo&&id!==solo))continue;
      renderRegion(skinEditing&&id!==selectedSkinRegion?{...args,alpha:(args.alpha??1)*.20}:args,region,poseGeom,bindGeom,neutralMode,skinEditing);
    }
    args.ctx.restore();
    if(skinEditing)drawPosedSkinRig(args,neutralMode?FoxRig.geometry(BIND_POSE,restRig):poseGeom);
    return true;
  }


  function skinRegionInfo(state=core.getState()){
    const rest=state.setup?.artRestRig||state.setup?.rig||FoxRig.DEFAULT_REST_RIG;
    const atlas=core.getState().family==='fox'?skinLastAtlas:null;
    return atlas?regionsFor(atlas,rest).find(region=>region.id===selectedSkinRegion):null;
  }
  let skinLastAtlas=null;
  function selectedSkinDef(){return REGION_DEFS.find(def=>def.id===selectedSkinRegion)||REGION_DEFS[0];}
  function skinDraft(){return core.getState().setup?.skinTuning?.regions?.[selectedSkinRegion]||{};}
  function skinEditingNow(){const s=core.getState();return s.family==='fox'&&s.mode==='setup'&&s.setupTool==='skin';}
  function skinEdit(label,change){
    if(!skinEditingNow())return;
    core.edit('setup',label,setup=>{
      if(!setup.skinTuning)setup.skinTuning={schema:'animlab.skin-tuning.v1',regions:{}};
      if(!setup.skinTuning.regions)setup.skinTuning.regions={};
      const current=setup.skinTuning.regions[selectedSkinRegion]||{};
      change(current,setup.skinTuning.regions);
      if(Object.keys(current).length)setup.skinTuning.regions[selectedSkinRegion]=current;
      else delete setup.skinTuning.regions[selectedSkinRegion];
    });
  }
  function withSliderTransaction(input,modify){
    const field=input.dataset.skinField;
    if(sliderTx&&sliderField!==field){core.commitTransaction(sliderTx);sliderTx=null;}
    if(!sliderTx){sliderTx=core.beginTransaction('setup',`Skin ${selectedSkinRegion}: ${field}`);sliderField=field;}
    if(!sliderTx)return;
    const regionId=selectedSkinRegion,vertexIndex=selectedSkinVertex,boneIndex=selectedSkinBone;
    const value=Number(input.value);
    core.previewTransaction(sliderTx,setup=>{
      setup.skinTuning ||= {schema:'animlab.skin-tuning.v1',regions:{}};
      setup.skinTuning.regions ||= {};
      const entry=setup.skinTuning.regions[regionId] ||= {};
      modify(entry,value,regionId,vertexIndex,boneIndex);
    });
  }
  function commitSkinSlider(){
    if(sliderTx){core.commitTransaction(sliderTx);sliderTx=null;sliderField=null;}
  }
  function skinRegionChanged(){commitSkinSlider();skinPickArmed=false;skinLastViewport=null;selectedSkinVertex=0;selectedSkinBone=0;refreshSkinUI();core.redrawOnly?.();}
  function refreshSkinUI(state=core.getState()){
    const active=state.family==='fox'&&state.mode==='setup'&&state.setupTool==='skin';
    skinSection.hidden=!active;
    if(!active)return;
    for(const btn of skinRegionBoard.querySelectorAll('button'))btn.classList.toggle('active',btn.dataset.region===selectedSkinRegion);
    const region=skinRegionInfo(state),def=selectedSkinDef();
    const chain=def.topology==='chain';
    skinChainControls.hidden=!chain;skinGridControls.hidden=false;
    const settings=skinDraft();
    for(const btn of skinSection.querySelectorAll('[data-skin-preview]'))btn.classList.toggle('active',btn.dataset.skinPreview===skinPreview);
    skinPhaseButton.textContent=`Phase: ${Math.round(skinPhase*100)}%`;
    const pairBtn=skinSection.querySelector('[data-skin-action="copy-pair"]');
    pairBtn.disabled=!/(Near|Far)$/.test(selectedSkinRegion);
    selectedSkinBone=clamp(selectedSkinBone,0,def.bones.length-1);
    const profiles=settings.boneProfiles||{},activeProfile=profiles[selectedSkinBone]||{};
    skinBoneBoard.replaceChildren();
    def.bones.forEach(([a,b],index)=>{
      const btn=document.createElement('button');btn.type='button';btn.textContent=`${a} → ${b}`;
      btn.classList.toggle('active',index===selectedSkinBone);
      btn.addEventListener('click',()=>{commitSkinSlider();selectedSkinBone=index;refreshSkinUI();core.redrawOnly?.();});
      skinBoneBoard.appendChild(btn);
    });
    for(const input of skinSection.querySelectorAll('[data-skin-field="boneGain"],[data-skin-field="boneSpread"]')){
      const name=input.dataset.skinField,key=name==='boneGain'?'gain':'spread';
      const value=Number(activeProfile[key])||1;
      if(document.activeElement!==input)input.value=String(value);
      input.parentElement.querySelector('output').textContent=name==='boneGain'?`${Math.round(value*100)}%`:`${value.toFixed(2)}×`;
    }
    skinSection.querySelector('[data-skin-action="heatmap"]').textContent=`Heatmap: ${skinHeatmap?'On':'Off'}`;
    skinSection.querySelector('[data-skin-action="heatmap"]').classList.toggle('active',skinHeatmap);
    if(chain){
      for(const input of skinChainControls.querySelectorAll('input')){
        const key=input.dataset.skinField;
        const value=settings[key]??def[key];
        if(document.activeElement!==input)input.value=String(value);
        input.parentElement.querySelector('output').textContent=Number(value).toFixed(3);
      }
    }
    const count=region?.vertices?.length||60;
    selectedSkinVertex=clamp(selectedSkinVertex,0,count-1);
    const vertex=region?.vertices?.[selectedSkinVertex];
    const weights=vertex?editedVertexWeights(vertex,region,selectedSkinVertex,settings):[];
    const influence=weights.find(x=>x.index===selectedSkinBone)?.weight||0;
    skinVertexStatus.textContent=`Vertex ${selectedSkinVertex+1} / ${count} · ${settings.vertexWeights?.[selectedSkinVertex]?'Manual':'Automatic'} weights`;
    const input=skinGridControls.querySelector('[data-skin-field="vertexBoneWeight"]');
    if(document.activeElement!==input)input.value=String(influence);
    input.parentElement.querySelector('output').textContent=`${Math.round(influence*100)}%`;
    const pick=skinSection.querySelector('[data-skin-action="pick"]');
    pick.textContent=skinPickArmed?'Tap a Vertex…':'Pick Vertex';pick.classList.toggle('active',skinPickArmed);
  }

  // The region descriptor is the only region-specific input. No Fox-specific
  // part IDs are embedded in the controls, so subsequent rig families can
  // expose equivalent descriptors without cloning the editor design.
  REGION_DEFS.forEach(def=>{
    const btn=document.createElement('button');btn.type='button';btn.dataset.region=def.id;btn.textContent=def.label;
    btn.addEventListener('click',()=>{selectedSkinRegion=def.id;skinRegionChanged();});
    skinRegionBoard.appendChild(btn);
  });
  skinSection.querySelectorAll('[data-skin-preview]').forEach(btn=>btn.addEventListener('click',()=>{
    commitSkinSlider();skinPreview=btn.dataset.skinPreview;refreshSkinUI();core.redrawOnly?.();
  }));
  skinPhaseButton.addEventListener('click',()=>{
    commitSkinSlider();skinPhase=skinPhase===.25?.5:skinPhase===.5?.75:skinPhase===.75?0:.25;
    refreshSkinUI();core.redrawOnly?.();
  });
  skinSection.querySelectorAll('[data-skin-field]').forEach(input=>{
    input.addEventListener('input',()=>{
      if(!skinEditingNow())return;
      if(input.dataset.skinField==='vertexBoneWeight'){
        const region=skinRegionInfo(),vertex=region?.vertices?.[selectedSkinVertex];
        if(!vertex)return;
        withSliderTransaction(input,(entry,value,regionId,vertexIndex,boneIndex)=>{
          const prev=editedVertexWeights(vertex,region,vertexIndex,entry);
          const arr=region.bones.map((_,index)=>prev.find(w=>w.index===index)?.weight||0);
          const remainder=Math.max(0,1-value),other=arr.reduce((sum,w,index)=>sum+(index===boneIndex?0:w),0);
          arr.forEach((w,index)=>{arr[index]=index===boneIndex?value:other>1e-7?w*remainder/other:remainder/(arr.length-1||1);});
          entry.vertexWeights ||= {};
          entry.vertexWeights[vertexIndex]=arr;
        });
      }else if(input.dataset.skinField==='boneGain'||input.dataset.skinField==='boneSpread'){
        withSliderTransaction(input,(entry,value,_regionId,_vertexIndex,boneIndex)=>{
          entry.boneProfiles ||= {};
          const profile=entry.boneProfiles[boneIndex]||{gain:1,spread:1};
          profile[input.dataset.skinField==='boneGain'?'gain':'spread']=value;
          if(Math.abs(profile.gain-1)<.001&&Math.abs(profile.spread-1)<.001)delete entry.boneProfiles[boneIndex];
          else entry.boneProfiles[boneIndex]=profile;
          if(!Object.keys(entry.boneProfiles).length)delete entry.boneProfiles;
        });
      }else{
        withSliderTransaction(input,(entry,value)=>{entry[input.dataset.skinField]=value;});
      }
      const field=input.dataset.skinField;
      input.parentElement.querySelector('output').textContent=field==='vertexBoneWeight'||field==='boneGain'?`${Math.round(Number(input.value)*100)}%`:field==='boneSpread'?`${Number(input.value).toFixed(2)}×`:Number(input.value).toFixed(3);
    });
    input.addEventListener('change',commitSkinSlider);
    input.addEventListener('pointerup',commitSkinSlider);
    input.addEventListener('pointercancel',commitSkinSlider);
  });
  skinSection.querySelectorAll('[data-skin-action]').forEach(btn=>btn.addEventListener('click',()=>{
    const name=btn.dataset.skinAction;
    commitSkinSlider();
    if(name==='previous'||name==='next'){
      const count=skinRegionInfo()?.vertices?.length||1;
      selectedSkinVertex=(selectedSkinVertex+(name==='next'?1:count-1))%count;
    }else if(name==='pick')skinPickArmed=!skinPickArmed;
    else if(name==='heatmap')skinHeatmap=!skinHeatmap;
    else if(name==='auto-bone')skinEdit('Restore automatic bone influence',entry=>{if(entry.boneProfiles){delete entry.boneProfiles[selectedSkinBone];if(!Object.keys(entry.boneProfiles).length)delete entry.boneProfiles;}});
    else if(name==='auto-vertex')skinEdit('Restore automatic vertex weights',entry=>{
      if(entry.vertexWeights){delete entry.vertexWeights[selectedSkinVertex];if(!Object.keys(entry.vertexWeights).length)delete entry.vertexWeights;}
    });
    else if(name==='reset-region')skinEdit('Reset skin weights for region',(entry,regions)=>{delete regions[selectedSkinRegion];for(const key of Object.keys(entry))delete entry[key];});
    else if(name==='copy-pair'){
      const target=selectedSkinRegion.endsWith('Near')?selectedSkinRegion.replace('Near','Far'):selectedSkinRegion.replace('Far','Near');
      const src=skinDraft();
      skinEdit('Copy skin weights to matching side',(_,regions)=>{regions[target]=clone(src);});
    }
    refreshSkinUI();core.redrawOnly?.();
  }));
  skinCanvas?.addEventListener('pointerdown',event=>{
    if(!skinEditingNow()||!skinPickArmed||!skinLastViewport||!skinAdvanced.open)return;
    // Arm first; never hijack ordinary pan/zoom unless a Pick operation is active.
    event.preventDefault();event.stopImmediatePropagation();
    const rect=skinCanvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)*(skinCanvas.width/Math.max(1,rect.width));
    const y=(event.clientY-rect.top)*(skinCanvas.height/Math.max(1,rect.height));
    let best=-1,distance=Infinity;
    skinLastViewport.points.forEach((point,index)=>{
      const d=Math.hypot(point.x-x,point.y-y);
      if(d<distance){distance=d;best=index;}
    });
    if(best>=0&&distance<=Math.max(24,skinCanvas.width*.035))selectedSkinVertex=best;
    else core.setHint('No vertex close to that tap. Zoom in or try again.');
    skinPickArmed=false;refreshSkinUI();core.redrawOnly?.();
  },true);

  function updateUi(state=core.getState()){ 
    const visible=state.family==='fox';
    section.hidden=!visible;
    if(lastFamily!==state.family){lastFamily=state.family;}
    const skinActive=state.family==='fox'&&state.mode==='setup'&&state.setupTool==='skin';
    // Temporarily hide distracting global skeleton lines in Skin; restore the
    // user's prior View choice on exit, without saving a new display setting.
    if(skinActive&&skinBonesRestore===null){
      skinBonesRestore=!!state.overlays.bones;
      if(state.overlays.bones)core.setOverlay('bones',false);
    }else if(!skinActive&&skinBonesRestore!==null){
      const wasVisible=skinBonesRestore;skinBonesRestore=null;
      if(!!state.overlays.bones!==wasVisible)core.setOverlay('bones',wasVisible);
    }
    refreshSkinUI(state);
    const setupMode=state.mode==='setup';
    modeButtons.forEach(btn=>{
      const active=btn.dataset.meshMode===(setupMode?'mesh':mode);
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
      btn.disabled=setupMode;
    });
    wireBtn.classList.toggle('active',wireframe);wireBtn.setAttribute('aria-pressed',String(wireframe));wireBtn.disabled=mode!=='mesh';
    inspectBtn.disabled=mode!=='mesh'||!wireframe;
    inspectBtn.textContent=`Inspect: ${INSPECT[inspectIndex]?.label||'All'}`;
    if(setupNote){
      const ready=!!dedicatedArtFor(REGION_DEFS[0]);
      setupNote.textContent=ready
        ? 'Deform atlas v2 loaded. Parts/Rig share a fixed neutral artwork assembly; binding rest is independent. No source art or animation keys overwritten.'
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
