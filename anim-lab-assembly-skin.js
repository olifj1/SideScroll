/* SideScroll v1.1.18 — optional joint-mitred, binary bone envelopes.
 * Atlas owns UV/geometry, Parts owns instances and transforms, Rig owns joints.
 * Skin owns per-instance weights (including rest-space residual). No fixed-six-region assumptions.
 * Legacy Fox skin remains untouched when no Atlas assembly is enabled.
 */
(() => {
  'use strict';
  const core=window.AnimLabCore,rig=window.GameHubFoxRig;
  if(!core||!rig?.RIG_DESIGNER?.boneLinks||!core.registerArtRenderer)return;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const bones=rig.RIG_DESIGNER.boneLinks;
  const groups=rig.RIG_DESIGNER.jointGroups||[];
  const state=()=>core.getState();
  const renderState=()=>core.peekArtRenderState?.()||core.getState();
  const inventory=s=>s?.setup?.artLayout?.assembly?.enabled?s.setup.artLayout.assembly.instances||[]:null;
  const atlas=()=>window.AnimLabAtlasInspect;
  const activeSource=s=>atlas()?.getCharacterId?.()===s.characterId?atlas()?.getDocument?.():null;
  function sourceMap(s){
    const document=atlas()?.getCharacterId?.()===s.characterId
      ? (atlas()?.getRenderDocument?.()||activeSource(s)):null;
    const img=atlas()?.getImage?.();
    const map=new Map((document?.meshes||[]).map(mesh=>[mesh.id,{mesh,image:img}]));
    // Legacy snapshot performs a full Core getState()/geometry check. Only
    // request it if this assembly actually references a legacy builtin mesh.
    const needsLegacy=(inventory(s)||[]).some(p=>String(p.meshId||'').startsWith('atlas-builtin-'));
    const old=needsLegacy?window.AnimLabLegacyAtlas?.getSnapshot?.():null;
    for(const mesh of old?.meshes||[])map.set(`atlas-builtin-${mesh.id}`,{mesh,image:old.image});
    return map;
  }
  const validSource=source=>source?.mesh?.vertices?.length>=3&&source.mesh.triangles?.length>0;
  // The Atlas can edit vertices in place while in its own workspace. Clear
  // signatures when Atlas is active; elsewhere the render-document mesh is
  // stable and hashing its full JSON every animation frame is unnecessary.
  let signatures=new WeakMap();
  function signature(mesh){
    const cached=signatures.get(mesh);if(cached)return cached;
    const str=JSON.stringify([mesh.vertices.map(v=>[v.x,v.y]),mesh.triangles]);
    let hash=2166136261;
    for(let i=0;i<str.length;i++){hash^=str.charCodeAt(i);hash=Math.imul(hash,16777619);}
    const id=`${mesh.vertices.length}:${mesh.triangles.length}:${(hash>>>0).toString(16)}`;
    signatures.set(mesh,id);return id;
  }
  const neutral=(()=>{
    const p={...rig.IDLE_POSE};
    for(const key of ['bodyBob','frontBodyLift','rearBodyLift','bodyPitch','neckPitch','headPitch','tailBase','tailMid','tailTip',
      'rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower','rnDistal','rfDistal','fnDistal','ffDistal'])p[key]=0;
    for(const prefix of ['rn','rf','fn','ff'])p[`${prefix}IkWeight`]=0;
    return rig.normalizedPose(p,0);
  })();
  function groupBones(id){
    if(id==='auto')return bones.map((_,i)=>i);
    const joints=new Set(groups.find(g=>g.id===id)?.joints||[]);
    return bones.map((b,i)=>joints.has(b.a)&&joints.has(b.b)?i:-1).filter(i=>i>=0);
  }
  function pointSegmentDistance(p,a,b){
    if(!a||!b)return 1e6;
    const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;
    const t=d2>1e-8?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d2,0,1):0;
    return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
  }
  const bindGeometries=new WeakMap();
  function bindingGeometry(restRig){
    if(restRig&&typeof restRig==='object'){
      let value=bindGeometries.get(restRig);
      if(!value){value=rig.geometry(neutral,restRig);bindGeometries.set(restRig,value);}
      return value;
    }
    return rig.geometry(neutral,rig.DEFAULT_REST_RIG);
  }
  function transformVertices(mesh,item,image){
    const verts=mesh.vertices,xs=verts.map(v=>v.x),ys=verts.map(v=>v.y);
    const cx=(Math.min(...xs)+Math.max(...xs))/2,ymax=Math.max(...ys);
    const width=image?.naturalWidth||image?.width||atlas()?.getDocument?.()?.atlas?.width||1;
    const ppu=.95/width;
    const sx=Number(item.scaleX)||1,sy=Number(item.scaleY)||1;
    const rotation=Number(item.rotation)||0,c=Math.cos(rotation),s=Math.sin(rotation);
    const ox=Number(item.pivotX)||0,oy=Number(item.pivotY)||0;
    return verts.map(v=>{
      const x=(v.x-cx)*ppu-ox,y=(ymax-v.y)*ppu-oy;
      return{x:(Number(item.x)||0)+ox+c*x*sx-s*y*sy,y:(Number(item.y)||0)+oy+s*x*sx+c*y*sy};
    });
  }
  function bestGroup(item,mesh,source,geom){
    const label=`${item.nameOverride||''} ${item.label||''} ${mesh.name||''}`.toLowerCase();
    if(/tail/.test(label))return 'tail';
    if(/body|head|torso|neck|trunk/.test(label))return 'body';
    const near=/near/.test(label),far=/far/.test(label),front=/front/.test(label),rear=/back|rear|hind/.test(label);
    if((near||far)&&(front||rear))return `${front?'front':'rear'}${near?'Near':'Far'}`;
    const verts=transformVertices(mesh,item,source.image);
    const center=verts.reduce((p,v)=>({x:p.x+v.x/verts.length,y:p.y+v.y/verts.length}),{x:0,y:0});
    return groups.map(g=>({id:g.id,d:Math.min(...groupBones(g.id).map(i=>pointSegmentDistance(center,geom[bones[i].a],geom[bones[i].b])))}))
      .sort((a,b)=>a.d-b.d)[0]?.id||'body';
  }
  function normalizeRow(row,allowed){
    const list=(row||[]).filter(p=>allowed.includes(p[0])&&Number.isFinite(+p[1])&&+p[1]>0)
      .map(p=>[p[0],Math.max(0,+p[1])]).sort((a,b)=>b[1]-a[1]).slice(0,4);
    const total=list.reduce((s,p)=>s+p[1],0);
    return total>1e-9?list.map(([id,w])=>[id,Math.round(w/total*10000)/10000]):allowed.length?[[allowed[0],1]]:[];
  }
  function autoWeights(point,allowed,geom){
    // All bones in a group (max four), not only the nearest three: this keeps
    // every group bone addressable by the peak/falloff tools.
    const ranked=allowed.map(i=>({i,d:pointSegmentDistance(point,geom[bones[i].a],geom[bones[i].b])}))
      .sort((a,b)=>a.d-b.d).slice(0,4);
    return normalizeRow(ranked.map(r=>[r.i,1/Math.pow(r.d+.018,2)]),allowed);
  }
  function bindingFor(item,source){
    const binding=item.skinBinding;
    return validSource(source)&&binding?.schema==='animlab.skin-binding.v1'&&
      binding.meshSignature===signature(source.mesh)&&binding.weights?.length===source.mesh.vertices.length?binding:null;
  }
  function createBinding(item,source,geom,group='auto'){
    const chosen=group==='auto'?bestGroup(item,source.mesh,source,geom):group;
    const allowed=groupBones(chosen);
    if(!allowed.length)return null;
    const binding={schema:'animlab.skin-binding.v1',meshSignature:signature(source.mesh),group:chosen,
      weights:[],baseWeights:[],boneProfiles:{},manualWeights:{},
      envelopeMode:'rect-binary-v1',rectangles:defaultRectangles(allowed,geom)};
    return updateRectWeights(binding,item,source,geom);
  }
  // Spatial bind v1: one capsule around each rest bone. Strength 0 is truly
  // 0, radius <=inner is 100%, radius >=outer is 0%, with a smooth transition.
  // The leftover weight intentionally stays in REST space; forcing every row
  // to sum to one makes a sole bone jump straight to 100% at any nonzero value.
  function defaultEnvelope(i,geom){
    const b=bones[i],a=geom[b.a],c=geom[b.b],len=a&&c?Math.hypot(c.x-a.x,c.y-a.y):.15;
    const inner=clamp(len*.14,.012,.085);
    return {strength:1,inner:+inner.toFixed(4),outer:+clamp(Math.max(inner+.055,len*.8),inner+.01,.36).toFixed(4)};
  }
  function defaultEnvelopes(allowed,geom){
    return Object.fromEntries(allowed.map(i=>[i,defaultEnvelope(i,geom)]));
  }
  function envelopeFalloff(distance,env){
    const inner=clamp(Number(env?.inner)||0,0,.5),outer=clamp(Number(env?.outer)||0,0,.5);
    if(outer<=inner)return distance<=inner?1:0;
    const t=clamp((distance-inner)/(outer-inner),0,1);
    return 1-t*t*(3-2*t);
  }
  function capsuleRows(binding,positions,geom){
    const allowed=groupBones(binding.group),envs=binding.envelopes||{};
    return positions.map(point=>{
      const positive=allowed.map(i=>{
        const env=envs[i]||defaultEnvelope(i,geom),bone=bones[i];
        const distance=pointSegmentDistance(point,geom[bone.a],geom[bone.b]);
        return [i,clamp(Number(env.strength)||0,0,1)*envelopeFalloff(distance,env)];
      }).filter(p=>p[1]>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4);
      const sum=positive.reduce((v,p)=>v+p[1],0);
      // Preserve residual rest weight for sum < 1, normalize only overlaps.
      return positive.map(([i,w])=>[i,Math.round(w/Math.max(1,sum)*10000)/10000]);
    });
  }
  // Rectangle authoring v1: a crisp, BINARY, per-bone influence region
  // defined in that bone's *rest-local* coordinate frame. Local X follows
  // A -> B, local Y is its left normal. Scale X multiplies bone length;
  // scale Y multiplies 0.12 m. Offsets are in metres in this same frame.
  // Intentionally NO blending, fuzzy boundary or weight redistribution.
  function defaultRectangle(){return {scaleX:1.45,scaleY:1.2,offsetX:0,offsetY:0};}
  function defaultRectangles(allowed){return Object.fromEntries(allowed.map(i=>[i,defaultRectangle()]));}
  function rectangleFrame(index,rect,geom){
    const bone=bones[index],a=geom[bone?.a],b=geom[bone?.b];
    if(!a||!b)return null;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(len<1e-6)return null;
    const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    const sx=clamp(Number(rect?.scaleX)||0,.05,8);
    const sy=clamp(Number(rect?.scaleY)||0,.05,8);
    const ox=clamp(Number(rect?.offsetX)||0,-1,1),oy=clamp(Number(rect?.offsetY)||0,-1,1);
    return {cx:(a.x+b.x)*.5+ux*ox+nx*oy,cy:(a.y+b.y)*.5+uy*ox+ny*oy,
      ux,uy,nx,ny,hx:len*.5*sx,hy:.06*sy};
  }
  function rectangleCorners(frame){
    if(!frame)return [];
    return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>({
      x:frame.cx+i*frame.ux*frame.hx+j*frame.nx*frame.hy,
      y:frame.cy+i*frame.uy*frame.hx+j*frame.ny*frame.hy}));
  }
  // Optional Joint Fit: construct shared MITRED endpoints in rest space.
  // A pair of successive bones with exactly one shared joint receives ONE
  // boundary computed from the bisector of their rest directions. Both polygons
  // reference the identical endpoints, so no independent caps can overlap or
  // leave a wedge. Free ends retain the artist's ordinary rectangle controls.
  // The joint boundary is anchored to the rest joint: X offset/scale affect
  // free ends, while Y scale affects the shared width. This is deliberately
  // hard binary ownership, NOT a blend, and requires explicit opt-in.
  function jointFitPolygons(binding,geom){
    const allowed=groupBones(binding.group);
    const frames=new Map(allowed.map(i=>[i,rectangleFrame(i,binding.rectangles?.[i]||defaultRectangle(),geom)]));
    const begin=new Map(),end=new Map();
    const incoming=new Map(),outgoing=new Map();
    for(const i of allowed){
      if(!frames.get(i))continue;
      const bone=bones[i];
      if(!incoming.has(bone.b))incoming.set(bone.b,[]);
      incoming.get(bone.b).push(i);
      if(!outgoing.has(bone.a))outgoing.set(bone.a,[]);
      outgoing.get(bone.a).push(i);
    }
    for(const [joint,ins] of incoming){
      const outs=outgoing.get(joint)||[];
      // Only unambiguous chain joints. Do not mitre branched anatomy.
      if(ins.length!==1||outs.length!==1)continue;
      const before=ins[0],after=outs[0],prev=frames.get(before),next=frames.get(after);
      const j=geom[joint];if(!prev||!next||!j||before===after)continue;
      const dx=prev.ux+next.ux,dy=prev.uy+next.uy,len=Math.hypot(dx,dy);
      // An almost fully folded back joint has no stable bisector.
      if(len<.12)continue;
      let tx=-dy/len,ty=dx/len;
      if(tx*prev.nx+ty*prev.ny<0){tx=-tx;ty=-ty;}
      const cos=Math.abs(tx*prev.nx+ty*prev.ny);
      // Bound mitre length at sharp bends to avoid exploding envelopes.
      const halfWidth=(prev.hy+next.hy)*.5;
      const reach=halfWidth/Math.max(cos,.4);
      const negative={x:j.x-tx*reach,y:j.y-ty*reach};
      const positive={x:j.x+tx*reach,y:j.y+ty*reach};
      end.set(before,[negative,positive]);
      begin.set(after,[negative,positive]);
    }
    const polygons=new Map();
    for(const [i,frame] of frames){
      if(!frame)continue;
      const rect=rectangleCorners(frame);
      const start=begin.get(i)||[rect[0],rect[3]];
      const finish=end.get(i)||[rect[1],rect[2]];
      // Walk around the negative side, distal cap, positive side and root.
      const poly=[start[0],finish[0],finish[1],start[1]];
      // Extreme user offsets can place the free end past the joint and
      // invert the quad. Fall back to the unmitred rectangle rather than
      // assigning an unpredictable self-intersecting influence region.
      const area=poly.reduce((sum,v,k)=>{
        const w=poly[(k+1)%poly.length];return sum+v.x*w.y-w.x*v.y;
      },0);
      const baseArea=rect.reduce((sum,v,k)=>{
        const w=rect[(k+1)%rect.length];return sum+v.x*w.y-w.x*v.y;
      },0);
      polygons.set(i,Math.abs(area)>1e-9&&area*baseArea>0?poly:rect);
    }
    return polygons;
  }
  function polygonContains(p,poly){
    if(!poly||poly.length<3)return false;
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j],b=poly[i],vx=b.x-a.x,vy=b.y-a.y;
      const cross=(p.x-a.x)*vy-(p.y-a.y)*vx;
      if(Math.abs(cross)<1e-9&&(p.x-a.x)*(p.x-b.x)+(p.y-a.y)*(p.y-b.y)<=1e-9)return true;
      if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  // The influence area is AUTHORed in the bind pose and weights are assigned
  // there once. For pose preview, display that same area after the selected
  // bone's rigid transform (identical to rect-binary skinned vertices).
  // Do NOT recalculate/assign vertex weights in the animated pose: that would
  // make influence jump between bones as the character moves.
  function rectanglePoseFrame(index,frame,bind,posed){
    if(!frame||!bind||!posed||bind===posed)return frame;
    const bone=bones[index];if(!bone)return frame;
    const A=bind[bone.a],B=bind[bone.b],C=posed[bone.a],D=posed[bone.b];
    if(!A||!B||!C||!D)return frame;
    const centre={x:frame.cx,y:frame.cy};
    const move=p=>mapBoneRigid(p,A,B,C,D);
    const c=move(centre);
    const x=move({x:centre.x+frame.ux,y:centre.y+frame.uy});
    const y=move({x:centre.x+frame.nx,y:centre.y+frame.ny});
    return {...frame,cx:c.x,cy:c.y,
      ux:x.x-c.x,uy:x.y-c.y,nx:y.x-c.x,ny:y.y-c.y};
  }
  function rectBinaryRows(binding,positions,geom){
    const allowed=groupBones(binding.group),frames=allowed.map(i=>[i,rectangleFrame(i,binding.rectangles?.[i]||defaultRectangle(),geom)]);
    const polygons=binding.jointFit===true?jointFitPolygons(binding,geom):null;
    return positions.map(point=>{
      let chosen=-1,score=Infinity;
      for(const [i,f] of frames){
        if(!f)continue;
        const dx=point.x-f.cx,dy=point.y-f.cy;
        const lx=(dx*f.ux+dy*f.uy)/f.hx,ly=(dx*f.nx+dy*f.ny)/f.hy;
        if(polygons?!polygonContains(point,polygons.get(i)):(Math.abs(lx)>1+1e-7||Math.abs(ly)>1+1e-7))continue;
        // Hard overlapping regions are exclusive: closest *normalised*
        // centre wins; bone order is merely a stable tie-breaker.
        const d=lx*lx+ly*ly;
        if(d<score-1e-9){chosen=i;score=d;}
      }
      // Unclaimed vertices stay at rest (empty row), visibly reported in UI.
      // Do not inject another bone's weight or blend across rectangle edges.
      return chosen<0?[]:[[chosen,1]];
    });
  }
  function activateRectangles(binding,item,source,geom){
    if(binding.envelopeMode==='rect-binary-v1'&&binding.rectangles)return binding;
    binding.envelopeMode='rect-binary-v1';
    binding.jointFit=false;
    binding.rectangles=defaultRectangles(groupBones(binding.group));
    delete binding.envelopes;
    binding.boneProfiles={};binding.manualWeights={};
    return updateRectWeights(binding,item,source,geom);
  }
  function updateRectWeights(binding,item,source,geom){
    const positions=transformVertices(source.mesh,item,source.image);
    binding.baseWeights=rectBinaryRows(binding,positions,geom);
    binding.weights=binding.baseWeights.map((row,index)=>{
      const override=binding.manualWeights?.[index];
      return override!==undefined?clone(override):clone(row);
    });
    return binding;
  }
  function activateEnvelopes(binding,item,source,geom){
    if(binding.envelopeMode==='capsule-v1'&&binding.envelopes)return binding;
    binding.envelopeMode='capsule-v1';
    binding.envelopes=defaultEnvelopes(groupBones(binding.group),geom);
    binding.boneProfiles={};
    binding.baseWeights=capsuleRows(binding,transformVertices(source.mesh,item,source.image),geom);
    binding.weights=clone(binding.baseWeights);
    return binding;
  }
  function updateEnvelopeWeights(binding,item,source,geom){
    const positions=transformVertices(source.mesh,item,source.image);
    binding.baseWeights=capsuleRows(binding,positions,geom);
    binding.weights=binding.baseWeights.map((row,index)=>{
      const override=binding.manualWeights?.[index];
      return override?clone(override):clone(row);
    });
    return binding;
  }
  function baseRows(binding){return binding.baseWeights?.length===binding.weights.length?binding.baseWeights:binding.weights;}
  function peakOf(rows,bone){return Math.max(0,...rows.map(row=>row.find(p=>p[0]===bone)?.[1]||0));}
  function rebuildWeights(binding){
    const allowed=groupBones(binding.group),base=baseRows(binding),profiles=binding.boneProfiles||{};
    const peaks=Object.fromEntries(allowed.map(i=>[i,peakOf(base,i)]));
    const weights=base.map((row,index)=>{
      const byBone=new Map(row.map(p=>[p[0],p[1]]));
      const requested=new Map();
      for(const [key,profile] of Object.entries(profiles)){
        const bone=Number(key),peak=Number(profile.peakWeight),spread=clamp(Number(profile.spread)||1,.5,2.5);
        if(!allowed.includes(bone)||!Number.isFinite(peak))continue;
        const baseWeight=byBone.get(bone)||0;
        const shape=Math.pow(clamp(baseWeight/Math.max(peaks[bone],.000001),0,1),1/spread);
        requested.set(bone,clamp(peak,0,1)*shape);
      }
      const fixedTotal=[...requested.values()].reduce((a,b)=>a+b,0);
      if(fixedTotal>1){for(const [i,w] of requested)requested.set(i,w/fixedTotal);}
      const remainder=Math.max(0,1-Math.min(fixedTotal,1));
      const available=row.filter(p=>!requested.has(p[0]));
      const availableSum=available.reduce((sum,p)=>sum+p[1],0);
      const combined=[...requested].map(([i,w])=>[i,w]);
      if(availableSum>1e-9)for(const [id,w] of available)combined.push([id,w/availableSum*remainder]);
      else if(remainder>1e-9){
        // If the artist explicitly set all but one bone to 0, all remaining
        // influence MUST go to that non-zero bone. Previously it was assigned
        // to the first (even zeroed-out) bone in the group: lower-leg tests
        // twisted and collapsed although the selected bone was set to 100%.
        const positives=combined.filter(pair=>pair[1]>1e-9);
        const total=positives.reduce((sum,pair)=>sum+pair[1],0);
        if(total>1e-9){for(const pair of positives)pair[1]+=remainder*pair[1]/total;}
        else {
          // A bone with zero automatic influence needs a well-defined fallback.
          // Prefer a positively requested peak; otherwise preserve the strongest
          // automatic bone, NOT the arbitrary first link in the group.
          const userBone=Object.entries(profiles)
            .filter(([key,p])=>allowed.includes(Number(key))&&Number(p.peakWeight)>0)
            .sort((a,b)=>Number(b[1].peakWeight)-Number(a[1].peakWeight))[0];
          const fallback=userBone?Number(userBone[0]):row[0]?.[0]??allowed[0];
          if(fallback!==undefined)combined.push([fallback,remainder]);
        }
      }
      return normalizeRow(binding.manualWeights?.[index]||combined,allowed);
    });
    binding.weights=weights;
    return binding;
  }
  function setManualWeight(binding,index,bone,value){
    const allowed=groupBones(binding.group),old=clone(binding.weights[index]||[]);
    if(!allowed.includes(bone))return;
    const remain=Math.max(0,1-clamp(value,0,1));
    if(binding.envelopeMode==='rect-binary-v1'){
      binding.manualWeights ||= {};
      binding.manualWeights[index]=value>=.5?[[bone,1]]:[];
      binding.weights[index]=clone(binding.manualWeights[index]);
      return binding;
    }
    if(binding.envelopeMode==='capsule-v1'){
      // Manual zero must not magically move weight onto another bone.
      const others=old.filter(p=>p[0]!==bone&&p[1]>0),othersTotal=others.reduce((n,p)=>n+p[1],0);
      const otherScale=othersTotal>remain&&othersTotal>0?remain/othersTotal:1;
      const row=[[bone,1-remain],...others.map(([i,w])=>[i,w*otherScale])]
        .filter(p=>p[1]>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4);
      binding.manualWeights ||= {};
      binding.manualWeights[index]=row;
      binding.weights[index]=clone(row);
      return binding;
    }
    let others=old.filter(p=>p[0]!==bone),total=others.reduce((sum,p)=>sum+p[1],0);
    if(!others.length&&remain>1e-9){const backup=allowed.find(i=>i!==bone);if(backup!==undefined){others=[[backup,1]];total=1;}}
    const row=[[bone,1-remain],...others.map(([id,w])=>[id,total>0?w/total*remain:0])];
    binding.manualWeights ||= {};
    binding.manualWeights[index]=normalizeRow(row,allowed);
    return rebuildWeights(binding);
  }
  function project(p,v){return{x:v.cx+p.x*v.scale*(v.flipX||1),y:v.groundY-p.y*v.scale};}
  function mapBone(p,a,b,c,d){
    if(!a||!b||!c||!d)return p;
    const bx=b.x-a.x,by=b.y-a.y,px=d.x-c.x,py=d.y-c.y;
    const bl=Math.hypot(bx,by),pl=Math.hypot(px,py);
    if(bl<1e-6||pl<1e-6)return p;
    const ux=bx/bl,uy=by/bl,vx=-uy,vy=ux,dux=px/pl,duy=py/pl,dvx=-duy,dvy=dux;
    const dx=p.x-a.x,dy=p.y-a.y,along=(dx*ux+dy*uy)*pl/bl,across=dx*vx+dy*vy;
    return{x:c.x+dux*along+dvx*across,y:c.y+duy*along+dvy*across};
  }
  // A binary rectangle belongs to ONE bone at full weight. Avoid the
  // legacy mapBone along-axis stretch when IK/body guides slightly change
  // length: rigid mode is translation + rotation ONLY, anchored at bone A.
  function mapBoneRigid(p,A,B,C,D){
    if(!A||!B||!C||!D)return p;
    const rx=B.x-A.x,ry=B.y-A.y,tx=D.x-C.x,ty=D.y-C.y;
    const rl=Math.hypot(rx,ry),tl=Math.hypot(tx,ty);
    if(rl<1e-8||tl<1e-8)return {x:p.x+C.x-A.x,y:p.y+C.y-A.y};
    const cos=(rx*tx+ry*ty)/(rl*tl),sin=(rx*ty-ry*tx)/(rl*tl);
    const dx=p.x-A.x,dy=p.y-A.y;
    return {x:C.x+cos*dx-sin*dy,y:C.y+sin*dx+cos*dy};
  }
  function skinVertex(p,influences,bind,posed,mode){
    let x=0,y=0,sum=0;
    for(const [i,w] of influences||[]){
      const bone=bones[i];if(!bone||w<=0)continue;
      const point=(mode==='rect-binary-v1'?mapBoneRigid:mapBone)(p,bind[bone.a],bind[bone.b],posed[bone.a],posed[bone.b]);
      x+=point.x*w;y+=point.y*w;sum+=w;
    }
    // Legacy normalized weights sum to 1; capsule weights may sum to less.
    // Their remainder stays at the original rest position (0 = no movement).
    const rest=Math.max(0,1-sum),den=Math.max(1,sum);
    return sum>1e-8?{x:(x+rest*p.x)/den,y:(y+rest*p.y)/den}:p;
  }
  function uvAffine(a,b,c,u,v,w){
    const den=u.x*(v.y-w.y)+v.x*(w.y-u.y)+w.x*(u.y-v.y);
    if(Math.abs(den)<1e-7)return null;
    const m={a:(a.x*(v.y-w.y)+b.x*(w.y-u.y)+c.x*(u.y-v.y))/den,
      c:(a.x*(w.x-v.x)+b.x*(u.x-w.x)+c.x*(v.x-u.x))/den,
      e:(a.x*(v.x*w.y-w.x*v.y)+b.x*(w.x*u.y-u.x*w.y)+c.x*(u.x*v.y-v.x*u.y))/den,
      b:(a.y*(v.y-w.y)+b.y*(w.y-u.y)+c.y*(u.y-v.y))/den,
      d:(a.y*(w.x-v.x)+b.y*(u.x-w.x)+c.y*(v.x-u.x))/den,
      f:(a.y*(v.x*w.y-w.x*v.y)+b.y*(w.x*u.y-u.x*w.y)+c.y*(u.x*v.y-v.x*u.y))/den};
    return m;
  }
  function triangle(ctx,image,a,b,c,u,v,w){
    const m=uvAffine(a,b,c,u,v,w);if(!m)return;
    ctx.save();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);
    ctx.closePath();ctx.clip();ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    const W=image.naturalWidth||image.width,H=image.naturalHeight||image.height;
    const sx=clamp(Math.floor(Math.min(u.x,v.x,w.x))-2,0,W-1);
    const sy=clamp(Math.floor(Math.min(u.y,v.y,w.y))-2,0,H-1);
    const ex=clamp(Math.ceil(Math.max(u.x,v.x,w.x))+2,sx+1,W);
    const ey=clamp(Math.ceil(Math.max(u.y,v.y,w.y))+2,sy+1,H);
    ctx.drawImage(image,sx,sy,ex-sx,ey-sy,sx,sy,ex-sx,ey-sy);
    ctx.restore();
  }
  // Neighbouring faces whose deformed UV mapping agrees within 0.18 canvas
  // pixel can share one clipped atlas draw. Mesh edges stay exact, so this
  // eliminates thousands of drawImage calls with subpixel-only UV differences.
  // Runs are consecutive, preserving authored triangle stacking order.
  function drawAffineRun(ctx,image,mesh,points,triangles,start,end){
    const first=triangles[start],a=points[first[0]],b=points[first[1]],c=points[first[2]];
    const u=mesh.vertices[first[0]],v=mesh.vertices[first[1]],w=mesh.vertices[first[2]];
    const m=uvAffine(a,b,c,u,v,w);if(!m)return false;
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    ctx.save();ctx.globalAlpha=1;ctx.beginPath();
    for(let k=start;k<end;k++){
      const tri=triangles[k],p=points[tri[0]],q=points[tri[1]],r=points[tri[2]];
      ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();
      for(const idx of tri){const pt=mesh.vertices[idx];
        minX=Math.min(minX,pt.x);maxX=Math.max(maxX,pt.x);
        minY=Math.min(minY,pt.y);maxY=Math.max(maxY,pt.y);}
    }
    const W=image.naturalWidth||image.width,H=image.naturalHeight||image.height;
    const sx=clamp(Math.floor(minX)-2,0,W-1),sy=clamp(Math.floor(minY)-2,0,H-1);
    const ex=clamp(Math.ceil(maxX)+2,sx+1,W),ey=clamp(Math.ceil(maxY)+2,sy+1,H);
    ctx.clip();ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    ctx.drawImage(image,sx,sy,ex-sx,ey-sy,sx,sy,ex-sx,ey-sy);
    ctx.restore();return true;
  }
  // Group only consecutive triangles whose exact UV->screen affine maps agree
  // at all three corners within a subpixel tolerance. This is *not* a mesh
  // simplifier: every posed triangle boundary and vertex remains unchanged.
  // Identical transform runs are pixel-exact apart from avoiding clip seams.
  function rasterTriangles(ctx,image,mesh,points,binding,posed,counts){
    const triangles=mesh.triangles,ready=!!(image&&image.complete!==false&&(image.naturalWidth||image.width));
    const closeTo=(m,tri)=>{
      for(const i of tri){const u=mesh.vertices[i],p=points[i];if(!u||!p)return false;
        if(Math.abs(m.a*u.x+m.c*u.y+m.e-p.x)>.18||
           Math.abs(m.b*u.x+m.d*u.y+m.f-p.y)>.18)return false;
      }
      return true;
    };
    for(let t=0;t<triangles.length;){
      const tri=triangles[t],u=mesh.vertices,v=points;
      const affine=ready?uvAffine(v[tri[0]],v[tri[1]],v[tri[2]],u[tri[0]],u[tri[1]],u[tri[2]]):null;
      let end=t+1;
      if(affine){
        while(end<triangles.length&&end-t<320&&closeTo(affine,triangles[end]))end++;
      }
      if(ready&&end-t>=2&&drawAffineRun(ctx,image,mesh,points,triangles,t,end)){
        counts.drawCalls++;counts.batched+=end-t;t=end;continue;
      }
      const [i,j,k]=tri,a=points[i],b=points[j],c=points[k];
      if(a&&b&&c){
        if(ready)triangle(ctx,image,a,b,c,mesh.vertices[i],mesh.vertices[j],mesh.vertices[k]);
        else{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fillStyle='#536b67';ctx.fill();}
        counts.drawCalls++;
      }
      t++;
    }
    counts.triangles+=triangles.length;
  }
  // Precompute bone transforms once per pose (instead of calculating two
  // hypot's + bone basis vectors for every influence of every vertex).
  function boneTransforms(bind,posed){
    return bones.map(b=>{
      const A=bind[b.a],B=bind[b.b],C=posed[b.a],D=posed[b.b];
      if(!A||!B||!C||!D)return {a:1,b:0,c:0,d:1,e:0,f:0};
      const x=mapBone({x:0,y:0},A,B,C,D);
      const xx=mapBone({x:1,y:0},A,B,C,D);
      const yy=mapBone({x:0,y:1},A,B,C,D);
      return {a:xx.x-x.x,b:xx.y-x.y,c:yy.x-x.x,d:yy.y-x.y,e:x.x,f:x.y};
    });
  }
  function rigidBoneTransforms(bind,posed){
    return bones.map(b=>{
      const A=bind[b.a],B=bind[b.b],C=posed[b.a],D=posed[b.b];
      if(!A||!B||!C||!D)return {a:1,b:0,c:0,d:1,e:0,f:0};
      const O=mapBoneRigid({x:0,y:0},A,B,C,D);
      const X=mapBoneRigid({x:1,y:0},A,B,C,D);
      const Y=mapBoneRigid({x:0,y:1},A,B,C,D);
      return {a:X.x-O.x,b:X.y-O.y,c:Y.x-O.x,d:Y.y-O.y,e:O.x,f:O.y};
    });
  }
  function fastSkinVertex(p,influences,maps){
    let x=0,y=0,sum=0;
    for(const [i,w] of influences||[]){
      const m=maps[i];if(!m||w<=0)continue;
      x+=(m.a*p.x+m.c*p.y+m.e)*w;
      y+=(m.b*p.x+m.d*p.y+m.f)*w;sum+=w;
    }
    const rest=Math.max(0,1-sum),den=Math.max(1,sum);
    return sum>1e-8?{x:(x+rest*p.x)/den,y:(y+rest*p.y)/den}:p;
  }
  let lastPerf={triangles:0,drawCalls:0,batched:0,ms:0};
  // Heatmap is a colour annotation drawn OVER fully opaque textured triangles.
  // It never changes the artwork opacity, selected or unselected.
  function heatColour(w){
    w=clamp(w,0,1);
    const colors=[[49,104,205],[40,176,187],[85,187,115],[241,202,91],[223,79,62]],s=w*4,i=Math.min(3,Math.floor(s)),t=s-i;
    return colors[i].map((v,c)=>Math.round(v+(colors[i+1][c]-v)*t));
  }
  function heatTri(ctx,a,b,c,wa,wb,wc){
    const n=4;
    const point=(i,j)=>({x:a.x+(b.x-a.x)*i/n+(c.x-a.x)*j/n,y:a.y+(b.y-a.y)*i/n+(c.y-a.y)*j/n,
      weight:wa+(wb-wa)*i/n+(wc-wa)*j/n});
    function paint(p,q,r){
      const colour=heatColour((p.weight+q.weight+r.weight)/3);
      ctx.fillStyle=`rgba(${colour.join(',')},.38)`;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.fill();
    }
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
      paint(point(i,j),point(i+1,j),point(i,j+1));
      if(i+j<n-1)paint(point(i+1,j),point(i+1,j+1),point(i,j+1));
    }
  }

  const legacy=document.getElementById('animlab-skin-editor');
  const panel=document.createElement('section');panel.id='animlab-assembly-skin';panel.className='animlab-section animlab-assembly-skin';panel.hidden=true;
  panel.innerHTML=`
    <div class="animlab-section-title">Skin · Weight Editor</div>
    <div class="animlab-skin-assembly-status" role="status"></div>
    <div class="animlab-parts-subgroup-label">Parts</div>
    <div class="animlab-skin-assembly-parts" aria-label="Skin parts list"></div>
    <section class="animlab-skin-edit-box" aria-label="Edit selected part binding">
      <div class="animlab-section-title">Edit selected part</div>
      <label class="animlab-skin-group-select">Bone group <select data-skin-group></select></label>
      <div class="animlab-view-grid animlab-skin-assembly-actions">
        <button type="button" data-bind-action="selected">Auto-bind part</button>
        <button type="button" data-bind-action="all">Auto-bind all</button>
        <button type="button" data-bind-action="reset">Unbind part</button>
      </div>
      <div class="animlab-parts-subgroup-label">Bone influence</div>
      <div class="animlab-skin-bones" data-skin-bones aria-label="Bones influencing selected part"></div>
      <button type="button" class="animlab-skin-rigid-action" data-bind-action="rigid">Rigid bind: 100% selected bone (all vertices)</button>
      <div class="animlab-skin-envelope-heading">Bone-local rectangle · hard 100% / 0%</div>
      <button type="button" data-bind-action="rect-convert" class="animlab-skin-rigid-action">Use binary rectangles on this part</button>
      <div class="animlab-skin-rectangle-controls">
        <label class="animlab-slider"><span>Local X scale · along bone</span><input data-rect-x-scale type="range" min="0.2" max="5" step="0.05" value="1.45"><output>1.45×</output></label>
        <label class="animlab-slider"><span>Local Y scale · across bone</span><input data-rect-y-scale type="range" min="0.2" max="5" step="0.05" value="1.20"><output>1.20×</output></label>
        <label class="animlab-slider"><span>Local X offset</span><input data-rect-x-offset type="range" min="-0.35" max="0.35" step="0.005" value="0"><output>0.000 m</output></label>
        <label class="animlab-slider"><span>Local Y offset</span><input data-rect-y-offset type="range" min="-0.35" max="0.35" step="0.005" value="0"><output>0.000 m</output></label>
      </div>
      <div class="animlab-skin-weight-status" data-weight-status role="status"></div>
      <p class="animlab-skin-note" data-envelope-mode-note>Current binding retained until you choose binary rectangles or Auto-bind. Shape controls only take effect in rectangle mode.</p>
      <div class="animlab-view-grid animlab-skin-assembly-actions">
        <button type="button" data-skin-display="heatmap">Heatmap: Off</button>
        <button type="button" data-skin-display="wires">Wireframe: On</button>
        <button type="button" data-skin-display="rect">Rectangle: On</button>
        <button type="button" data-bind-action="reset-bone">Reset rectangle</button>
        <button type="button" data-bind-action="joint-fit" aria-pressed="false">Joint Fit: Off</button>
      </div>
      <div class="animlab-skin-legend" data-heat-legend hidden><span>0% · Blue</span><i></i><span>Red · 100%</span></div>
      <p class="animlab-skin-note">Binary 100% / 0%, no softness. Joint Fit is optional: in the rest pose, neighbouring bone shapes share a mitred seam. The joint caps stay at the joint; X scale/offset affect free ends. Weights never change during pose preview. Uncovered vertices remain at rest.</p>
      <details class="animlab-skin-assembly-vertex">
        <summary>Advanced · Individual vertex weights</summary>
        <div class="animlab-view-grid animlab-skin-assembly-actions">
          <button type="button" data-v-nav="prev">◀ Vertex</button>
          <button type="button" data-v-nav="next">Vertex ▶</button>
          <button type="button" data-v-nav="pick">Pick vertex</button>
          <button type="button" data-bind-action="auto-vertex">Auto vertex</button>
        </div>
        <div class="animlab-skin-vertex-label"></div>
        <label class="animlab-slider"><span>Selected bone weight</span><input data-v-weight type="range" min="0" max="100" step="1" value="50"><output>50%</output></label>
      </details>
      <details class="animlab-skin-assembly-more">
        <summary>Advanced · Binding management</summary>
        <button type="button" data-bind-action="reset-part">Reset part to automatic weights</button>
        <label class="animlab-skin-group-select">Copy weights to matching part <select data-copy-target></select></label>
        <button type="button" data-bind-action="copy">Copy selected part weights</button>
        <p class="animlab-skin-note">Copy requires the same source mesh and topology. Joint-group indices are copied exactly; use Auto-bind if you need a different leg group.</p>
      </details>
    </section>
    <div class="animlab-parts-subgroup-label">Pose preview</div>
    <div class="animlab-view-grid animlab-skin-assembly-actions">
      <button type="button" data-preview="rest">Rest</button>
      <button type="button" data-preview="walk">Walk</button>
      <button type="button" data-preview="run">Run</button>
      <button type="button" data-preview="phase">Phase: 25%</button>
    </div>
    <p class="animlab-skin-note">Binding edits use Setup Save / Discard / Undo / Redo. Geometry changes require an explicit rebind. Game runtime integration remains a future stage.</p>`;
  (legacy||document.getElementById('animlab-extension')).insertAdjacentElement('afterend',panel);
  const rows=panel.querySelector('.animlab-skin-assembly-parts'),groupSelect=panel.querySelector('[data-skin-group]');
  const bonesBoard=panel.querySelector('[data-skin-bones]');
  const rectControls=[['scaleX',panel.querySelector('[data-rect-x-scale]')],['scaleY',panel.querySelector('[data-rect-y-scale]')],
    ['offsetX',panel.querySelector('[data-rect-x-offset]')],['offsetY',panel.querySelector('[data-rect-y-offset]')]];
  const weightInput=panel.querySelector('[data-v-weight]'),copySelect=panel.querySelector('[data-copy-target]');
  const canvas=document.getElementById('animlab-canvas');
  groupSelect.innerHTML=groups.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
  let selectedId=null,selectedBone=0,vertexIndex=0,groupCandidate=null,preview='rest',phase=.25;
  let heatmap=false,wires=true,showRect=true,pickArmed=false,lastPickedPoints=null,liveBinding=null,liveItemId=null;
  const hiddenParts=new Set(),lockedParts=new Set();let soloPart=null,lastCharacterId=null;
  function label(item,sources){return item.nameOverride||sources.get(item.meshId)?.mesh?.name||item.label||item.id;}
  function selectedItem(s){return inventory(s)?.find(p=>p.id===selectedId)||null;}
  function statusFor(item,sources){
    const source=sources.get(item.meshId);
    if(!validSource(source))return 'Missing mesh';
    return bindingFor(item,source)?'Bound':item.skinBinding?'Rebind needed':'Unbound';
  }
  function selectedBinding(s,sources){
    const item=selectedItem(s),source=item&&sources.get(item.meshId);
    const persisted=item&&bindingFor(item,source);
    return item?.id===liveItemId&&liveBinding?liveBinding:persisted;
  }
  function selectPart(id){
    if(selectedId!==id){selectedId=id;selectedBone=0;vertexIndex=0;groupCandidate=null;pickArmed=false;liveBinding=null;liveItemId=null;}
    refresh();core.redrawOnly?.();
  }
  function refresh(){
    const s=state(),parts=inventory(s);
    const active=!!parts&&s.family==='fox'&&s.mode==='setup'&&s.setupTool==='skin';
    panel.hidden=!active;if(!active){lastPickedPoints=null;liveBinding=null;liveItemId=null;pickArmed=false;return;}
    if(lastCharacterId!==s.characterId){lastCharacterId=s.characterId;selectedId=null;hiddenParts.clear();lockedParts.clear();soloPart=null;groupCandidate=null;}
    const sources=sourceMap(s);
    if(!parts.find(p=>p.id===selectedId)){selectedId=parts[0]?.id||null;groupCandidate=null;}
    const digest=JSON.stringify(parts.map(p=>[p.id,label(p,sources),statusFor(p,sources)]));
    if(rows.dataset.signature!==digest){
      rows.dataset.signature=digest;rows.replaceChildren();
      for(const item of parts){
        const row=document.createElement('div');row.className='animlab-skin-part-row';row.dataset.skinRow=item.id;
        const name=document.createElement('button');name.type='button';name.dataset.skinPart=item.id;
        name.className='animlab-skin-part-name';name.title=label(item,sources);
        const nameText=document.createElement('span');nameText.className='animlab-skin-part-text';nameText.textContent=label(item,sources);
        const badge=document.createElement('span');badge.className='animlab-skin-part-status';badge.textContent=statusFor(item,sources);
        name.append(nameText,badge);
        name.addEventListener('click',()=>selectPart(item.id));row.append(name);
        for(const [mode,text] of [['hide','Hide'],['solo','Solo'],['lock','Lock']]){
          const button=document.createElement('button');button.type='button';button.dataset.skinRowAction=mode;button.textContent=text;
          button.addEventListener('click',()=>{
            if(mode==='hide'){hiddenParts.has(item.id)?hiddenParts.delete(item.id):hiddenParts.add(item.id);if(hiddenParts.has(item.id)&&soloPart===item.id)soloPart=null;}
            else if(mode==='solo'){soloPart=soloPart===item.id?null:item.id;}
            else lockedParts.has(item.id)?lockedParts.delete(item.id):lockedParts.add(item.id);
            refresh();core.redrawOnly?.();
          });row.append(button);
        }
        rows.append(row);
      }
    }
    for(const row of rows.children){
      const id=row.dataset.skinRow;
      row.classList.toggle('is-active',id===selectedId);
      row.classList.toggle('is-hidden-part',hiddenParts.has(id));
      row.classList.toggle('is-locked-part',lockedParts.has(id));
      for(const button of row.querySelectorAll('[data-skin-row-action]')){
        const action=button.dataset.skinRowAction;
        const on=action==='hide'?hiddenParts.has(id):action==='solo'?soloPart===id:lockedParts.has(id);
        button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));
        button.textContent=action==='hide'&&on?'Show':action==='solo'?'Solo':action==='lock'&&on?'Unlock':action==='lock'?'Lock':'Hide';
      }
    }
    const bound=parts.filter(p=>statusFor(p,sources)==='Bound').length;
    const missingTexture=parts.filter(p=>validSource(sources.get(p.meshId))&&!sources.get(p.meshId).image).length;
    panel.querySelector('.animlab-skin-assembly-status').textContent=`${bound} of ${parts.length} parts bound${missingTexture?` · ${missingTexture} texture(s) not loaded`:''}`;
    const item=selectedItem(s),source=item&&sources.get(item.meshId),binding=selectedBinding(s,sources);
    const canEdit=!!item&&validSource(source)&&!lockedParts.has(item.id),canWeight=canEdit&&!!binding;
    const currentGroup=groupCandidate||binding?.group||item?.skinBinding?.group||
      (item&&validSource(source)?bestGroup(item,source.mesh,source,rig.geometry(neutral,s.setup?.rig)):groups[0]?.id);
    if(document.activeElement!==groupSelect)groupSelect.value=currentGroup||'';
    groupSelect.disabled=!canEdit;
    for(const button of panel.querySelectorAll('[data-bind-action]')){
      const action=button.dataset.bindAction;
      button.disabled=action==='all'?!parts.some(p=>validSource(sources.get(p.meshId))&&!lockedParts.has(p.id)):
        action==='selected'?!canEdit:action==='copy'?!canWeight||!copySelect.value:
        action==='reset'?!canEdit||!item?.skinBinding:!canWeight;
    }
    const allowed=groupBones(binding?.group||currentGroup);
    if(!allowed.includes(selectedBone))selectedBone=allowed[0]??0;
    const boneDigest=allowed.join(',');
    if(bonesBoard.dataset.signature!==boneDigest){
      bonesBoard.dataset.signature=boneDigest;bonesBoard.replaceChildren();
      for(const i of allowed){
        const button=document.createElement('button');button.type='button';button.dataset.skinBone=String(i);
        button.textContent=bones[i]?.label||`Bone ${i+1}`;
        button.addEventListener('click',()=>{selectedBone=i;liveBinding=null;liveItemId=null;refresh();core.redrawOnly?.();});bonesBoard.append(button);
      }
    }
    for(const button of bonesBoard.children){button.classList.toggle('active',Number(button.dataset.skinBone)===selectedBone);button.disabled=!canWeight;}
    const bindGeom=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
    const binary=binding?.envelopeMode==='rect-binary-v1';
    const rect=binary?(binding?.rectangles?.[selectedBone]||defaultRectangle()):defaultRectangle();
    for(const [key,input] of rectControls){
      input.disabled=!canWeight||!binary;
      if(document.activeElement!==input)input.value=String(rect[key]);
      input.parentElement.querySelector('output').textContent=key.startsWith('scale')?`${rect[key].toFixed(2)}×`:`${rect[key].toFixed(3)} m`;
    }
    const convert=panel.querySelector('[data-bind-action="rect-convert"]');
    convert.disabled=!canWeight||binary;
    convert.textContent=binary?'Binary rectangles active':'Use binary rectangles on this part';
    const jointButton=panel.querySelector('[data-bind-action="joint-fit"]');
    const fitEnabled=binary&&binding.jointFit===true;
    jointButton.disabled=!canWeight||!binary;
    jointButton.textContent=`Joint Fit: ${fitEnabled?'On':'Off'}`;
    jointButton.classList.toggle('active',fitEnabled);
    jointButton.setAttribute('aria-pressed',String(fitEnabled));
    const actualMin=binding?Math.min(1,...binding.weights.map(row=>row.find(p=>p[0]===selectedBone)?.[1]||0)):0;
    const actualPeak=binding?peakOf(binding.weights,selectedBone):0;
    const unassigned=binding?Math.round(binding.weights.reduce((n,row)=>n+Math.max(0,1-row.reduce((a,p)=>a+p[1],0)),0)/Math.max(1,binding.weights.length)*100):0;
    const manualCount=Object.keys(binding?.manualWeights||{}).length;
    const isRigid=!!binding&&binding.weights.length>0&&binding.weights.every(row=>row.length===1&&row[0][0]===selectedBone&&row[0][1]>=.9999);
    const claimed=binding?.weights.filter(row=>row.length>0).length||0;
    panel.querySelector('[data-weight-status]').textContent=binding?
      `${binary?'Binary · ':''}${isRigid?'Rigid · ':''}Selected bone: ${Math.round(actualMin*100)}–${Math.round(actualPeak*100)}% · Covered ${claimed}/${binding.weights.length} vertices · Unassigned ${binding.weights.length-claimed}${manualCount?` · ${manualCount} manual`:''}`:
      'Bind a part to edit its weights.';
    panel.querySelector('[data-envelope-mode-note]').textContent=binary?
      `Local X follows the rest bone (1× = bone length); Y is perpendicular (1× = 0.12 m wide). ${fitEnabled?'Joint Fit creates matching mitred caps at connected joints in REST space. ':'Independent rectangles active. '}Only free ends honour X extent when Joint Fit is on. Each covered vertex belongs to exactly one bone.`:
      'Existing weights are preserved. Choose “Use binary rectangles” to opt in, or Auto-bind part for fresh rectangles. Undo can restore your earlier binding.';
    const rigidButton=panel.querySelector('[data-bind-action="rigid"]');
    rigidButton.classList.toggle('active',isRigid);
    rigidButton.setAttribute('aria-pressed',String(isRigid));
    for(const action of ['heatmap','wires','rect']){
      const button=panel.querySelector(`[data-skin-display="${action}"]`),on=action==='heatmap'?heatmap:action==='wires'?wires:showRect;
      button.textContent=`${action==='heatmap'?'Heatmap':action==='wires'?'Wireframe':'Rectangle'}: ${on?'On':'Off'}`;
      button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
    }
    panel.querySelector('[data-heat-legend]').hidden=!heatmap;
    const vertCount=source?.mesh?.vertices?.length||0;
    vertexIndex=clamp(vertexIndex,0,Math.max(0,vertCount-1));
    panel.querySelector('.animlab-skin-vertex-label').textContent=`Vertex ${vertCount?vertexIndex+1:0} / ${vertCount} · ${binding?.manualWeights?.[vertexIndex]?'Manual':'Automatic'}${pickArmed?' · tap the viewport':''}`;
    const weight=binding?.weights?.[vertexIndex]?.find(p=>p[0]===selectedBone)?.[1]||0;
    weightInput.disabled=!canWeight;
    weightInput.step=binary?100:1;
    if(document.activeElement!==weightInput)weightInput.value=String(Math.round(weight*100));
    weightInput.parentElement.querySelector('output').textContent=`${Math.round(weight*100)}%`;
    const pickBtn=panel.querySelector('[data-v-nav="pick"]');
    pickBtn.textContent=pickArmed?'Tap vertex…':'Pick vertex';pickBtn.classList.toggle('active',pickArmed);
    for(const b of panel.querySelectorAll('[data-v-nav]'))b.disabled=!canWeight;
    const compatibles=parts.filter(p=>p.id!==selectedId&&p.meshId===item?.meshId&&validSource(sources.get(p.meshId)));
    const copyDigest=JSON.stringify(compatibles.map(p=>[p.id,label(p,sources)]));
    if(copySelect.dataset.signature!==copyDigest){
      const keep=copySelect.value;copySelect.dataset.signature=copyDigest;copySelect.replaceChildren();
      for(const target of compatibles){const option=document.createElement('option');option.value=target.id;option.textContent=label(target,sources);copySelect.append(option);}
      if(compatibles.some(p=>p.id===keep))copySelect.value=keep;
    }
    copySelect.disabled=!canWeight||!compatibles.length;
    panel.querySelector('[data-bind-action="copy"]').disabled=!canWeight||!compatibles.length;
    for(const button of panel.querySelectorAll('[data-preview]')){
      button.classList.toggle('active',button.dataset.preview===preview);
      if(button.dataset.preview==='phase')button.textContent=`Phase: ${Math.round(phase*100)}%`;
    }
  }
  function commitBinding(id,binding,description){
    const item=selectedItem(state());if(item?.id!==id||lockedParts.has(id))return;
    core.edit('setup',description,setup=>{
      const target=setup.artLayout?.assembly?.instances?.find(p=>p.id===id);
      if(target)target.skinBinding=clone(binding);
      return setup;
    });
    liveBinding=null;liveItemId=null;
    refresh();core.redrawOnly?.();
  }
  function previewRectangle(input,key){
    const s=state(),item=selectedItem(s),source=item&&sourceMap(s).get(item.meshId),saved=item&&bindingFor(item,source);
    if(!saved||lockedParts.has(item.id)||saved.envelopeMode!=='rect-binary-v1')return;
    const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
    const next=clone(saved);
    // Whole-part rigid mode must not hide subsequent rectangle changes.
    if(Object.keys(next.manualWeights||{}).length>=source.mesh.vertices.length&&
       next.weights.every(row=>row.length===1&&row[0][1]>=.9999))next.manualWeights={};
    const rect={...defaultRectangle(),...next.rectangles?.[selectedBone]};
    const value=Number(input.value);
    rect[key]=key.startsWith('scale')?clamp(value,.2,5):clamp(value,-.35,.35);
    next.rectangles[selectedBone]=rect;
    updateRectWeights(next,item,source,geometry);
    liveBinding=next;liveItemId=item.id;
    for(const [name,slider] of rectControls){
      if(document.activeElement!==slider)slider.value=String(rect[name]);
      slider.parentElement.querySelector('output').textContent=name.startsWith('scale')?`${rect[name].toFixed(2)}×`:`${rect[name].toFixed(3)} m`;
    }
    const claimed=next.weights.filter(row=>row.length>0).length;
    panel.querySelector('[data-weight-status]').textContent=
      `Binary · Covered ${claimed}/${next.weights.length} vertices · Unassigned ${next.weights.length-claimed}`;
    core.redrawOnly?.();
  }
  for(const [key,input] of rectControls){
    input.addEventListener('input',()=>previewRectangle(input,key));
    input.addEventListener('change',()=>{
      if(!liveBinding||liveItemId!==selectedId)previewRectangle(input,key);
      if(liveBinding&&liveItemId===selectedId)commitBinding(selectedId,liveBinding,`Adjust rectangle ${key}`);
    });
    input.addEventListener('pointercancel',()=>{liveBinding=null;liveItemId=null;refresh();core.redrawOnly?.();});
  }
  weightInput.addEventListener('input',()=>{weightInput.parentElement.querySelector('output').textContent=`${Math.round(Number(weightInput.value))}%`;});
  weightInput.addEventListener('change',()=>{
    const s=state(),item=selectedItem(s),source=item&&sourceMap(s).get(item.meshId),binding=item&&bindingFor(item,source);
    if(!binding||lockedParts.has(item.id))return;
    const result=clone(binding);result.baseWeights ||= clone(binding.weights);
    setManualWeight(result,vertexIndex,selectedBone,Number(weightInput.value)/100);
    commitBinding(item.id,result,`Edit vertex ${vertexIndex+1} bone weight`);
  });
  groupSelect.addEventListener('change',()=>{groupCandidate=groupSelect.value;selectedBone=groupBones(groupCandidate)[0]??0;liveBinding=null;liveItemId=null;refresh();core.redrawOnly?.();});
  panel.addEventListener('click',event=>{
    const action=event.target.closest('[data-bind-action]')?.dataset.bindAction;
    const s=state(),item=selectedItem(s),parts=inventory(s)||[],sources=sourceMap(s);
    const candidate=groupCandidate||groupSelect.value;
    if(action==='selected'&&item&&!lockedParts.has(item.id)&&validSource(sources.get(item.meshId))){
      const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
      const binding=createBinding(item,sources.get(item.meshId),geometry,candidate);
      if(binding){commitBinding(item.id,binding,'Auto-bind selected part');vertexIndex=0;groupCandidate=null;}
    }
    if(action==='all'){
      const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
      core.edit('setup','Auto-bind all assembled parts',setup=>{
        for(const part of setup.artLayout?.assembly?.instances||[]){
          if(lockedParts.has(part.id))continue;
          const source=sources.get(part.meshId);if(validSource(source))part.skinBinding=createBinding(part,source,geometry,'auto');
        }
        return setup;
      });groupCandidate=null;vertexIndex=0;liveBinding=null;liveItemId=null;
    }
    if(action==='rect-convert'&&item&&!lockedParts.has(item.id)){
      const source=sources.get(item.meshId),saved=source&&bindingFor(item,source);
      if(saved){
        const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
        const binding=activateRectangles(clone(saved),item,source,geometry);
        commitBinding(item.id,binding,'Switch part to binary rectangle envelopes');
      }
    }
    if(action==='joint-fit'&&item&&!lockedParts.has(item.id)){
      const source=sources.get(item.meshId),saved=source&&bindingFor(item,source);
      if(saved?.envelopeMode==='rect-binary-v1'){
        const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
        const binding=clone(saved);
        binding.jointFit=!(binding.jointFit===true);
        // A previous rigid full-part override would conceal the fitted result.
        if(Object.keys(binding.manualWeights||{}).length>=source.mesh.vertices.length&&
           binding.weights.every(row=>row.length===1&&row[0][1]>=.9999))binding.manualWeights={};
        updateRectWeights(binding,item,source,geometry);
        commitBinding(item.id,binding,`Joint Fit ${binding.jointFit?'on':'off'}`);
      }
    }
    if(action==='rigid'&&item&&!lockedParts.has(item.id)){
      const source=sources.get(item.meshId),saved=source&&bindingFor(item,source);
      if(saved&&groupBones(saved.group).includes(selectedBone)){
        const binding=clone(saved);
        // A rigid assignment is explicit per-vertex data, not a peak-profile.
        // Preserve base weights so Reset Part can restore the soft auto bind.
        binding.baseWeights ||=clone(saved.weights);
        binding.boneProfiles={};
        binding.manualWeights={};
        for(let i=0;i<source.mesh.vertices.length;i++)binding.manualWeights[i]=[[selectedBone,1]];
        // Override every row exactly; do not invoke old normalized peak builder.
        binding.weights=source.mesh.vertices.map(()=>[[selectedBone,1]]);
        commitBinding(item.id,binding,'Rigid bind selected bone (all vertices)');
      }
    }
    if(action==='reset'&&item&&!lockedParts.has(item.id))core.edit('setup','Unbind selected part',setup=>{
      const target=setup.artLayout?.assembly?.instances?.find(p=>p.id===item.id);
      if(target)delete target.skinBinding;return setup;
    });
    if(action==='reset-bone'||action==='auto-vertex'||action==='reset-part'){
      const saved=item&&bindingFor(item,sources.get(item.meshId));
      if(saved&&!lockedParts.has(item.id)){
        const binding=clone(saved);binding.baseWeights ||= clone(saved.weights);
        binding.boneProfiles ||= {};binding.manualWeights ||= {};
        if(binding.envelopeMode==='rect-binary-v1'){
          const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
          if(action==='reset-bone')binding.rectangles[selectedBone]=defaultRectangle();
          if(action==='auto-vertex')delete binding.manualWeights[vertexIndex];
          if(action==='reset-part'){
            binding.rectangles=defaultRectangles(groupBones(binding.group));
            binding.manualWeights={};
          }
          updateRectWeights(binding,item,sources.get(item.meshId),geometry);
        }else         if(binding.envelopeMode==='capsule-v1'){
          const geometry=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
          if(action==='reset-bone')binding.envelopes[selectedBone]=defaultEnvelope(selectedBone,geometry);
          if(action==='auto-vertex')delete binding.manualWeights[vertexIndex];
          if(action==='reset-part'){
            binding.envelopes=defaultEnvelopes(groupBones(binding.group),geometry);
            binding.manualWeights={};
          }
          updateEnvelopeWeights(binding,item,sources.get(item.meshId),geometry);
        }else{
          if(action==='reset-bone')delete binding.boneProfiles[selectedBone];
          if(action==='auto-vertex')delete binding.manualWeights[vertexIndex];
          if(action==='reset-part'){binding.boneProfiles={};binding.manualWeights={};}
          rebuildWeights(binding);
        }
        commitBinding(item.id,binding,action==='reset-bone'?'Reset bone influence':action==='auto-vertex'?'Reset vertex weights':'Reset part weights');
      }
    }
    if(action==='copy'&&item&&copySelect.value&&!lockedParts.has(item.id)){
      const original=bindingFor(item,sources.get(item.meshId));
      const target=parts.find(p=>p.id===copySelect.value&&!lockedParts.has(p.id));
      if(original&&target&&target.meshId===item.meshId){
        const targetId=target.id;
        core.edit('setup','Copy skin weights to compatible part',setup=>{
          const dest=setup.artLayout?.assembly?.instances?.find(p=>p.id===targetId);
          if(dest)dest.skinBinding=clone(original);return setup;
        });
      }
    }
    const display=event.target.closest('[data-skin-display]')?.dataset.skinDisplay;
    if(display==='heatmap')heatmap=!heatmap;
    if(display==='wires')wires=!wires;
    if(display==='rect')showRect=!showRect;
    const pose=event.target.closest('[data-preview]')?.dataset.preview;
    if(pose){if(pose==='phase')phase=(phase+.25)%1;else preview=pose;}
    const nav=event.target.closest('[data-v-nav]')?.dataset.vNav;
    if(nav==='pick')pickArmed=!pickArmed;
    else if(nav){const count=sources.get(item?.meshId)?.mesh?.vertices?.length||1;vertexIndex=(vertexIndex+(nav==='next'?1:count-1))%count;}
    if(action||display||pose||nav){refresh();core.redrawOnly?.();}
  });
  canvas?.addEventListener('pointerdown',event=>{
    const s=state();if(!(s.mode==='setup'&&s.setupTool==='skin'&&inventory(s))||!pickArmed||!lastPickedPoints)return;
    event.preventDefault();event.stopImmediatePropagation();
    const box=canvas.getBoundingClientRect();
    const x=(event.clientX-box.left)*canvas.width/Math.max(box.width,1);
    const y=(event.clientY-box.top)*canvas.height/Math.max(box.height,1);
    let closest=-1,distance=Infinity;
    lastPickedPoints.forEach((point,i)=>{const d=Math.hypot(point.x-x,point.y-y);if(d<distance){distance=d;closest=i;}});
    if(closest>=0&&distance<=Math.max(24,canvas.width*.035))vertexIndex=closest;
    else core.setHint?.('No vertex near that tap; zoom in or try again.');
    pickArmed=false;refresh();core.redrawOnly?.();
  },true);
  function rectangleOutline(ctx,frame,view,outline){
    const corners=(outline||rectangleCorners(frame)).map(p=>project(p,view));
    if(corners.length!==4)return;
    ctx.beginPath();ctx.moveTo(corners[0].x,corners[0].y);
    for(let k=1;k<4;k++)ctx.lineTo(corners[k].x,corners[k].y);
    ctx.closePath();
    ctx.fillStyle='rgba(58,188,205,.075)';ctx.fill();
    ctx.strokeStyle='rgba(84,214,229,.9)';ctx.lineWidth=1;ctx.stroke();
    // The axis cross explicitly shows the bone-local X/Y frame.
    const center=project({x:frame.cx,y:frame.cy},view);
    const x=project({x:frame.cx+frame.ux*frame.hx*.55,y:frame.cy+frame.uy*frame.hx*.55},view);
    const y=project({x:frame.cx+frame.nx*frame.hy*.55,y:frame.cy+frame.ny*frame.hy*.55},view);
    ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(x.x,x.y);
    ctx.strokeStyle='rgba(255,210,117,.95)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(y.x,y.y);
    ctx.strokeStyle='rgba(99,228,219,.95)';ctx.stroke();
  }
  function render(args){
    const s=renderState(),parts=inventory(s);if(!parts||s.family!=='fox')return false;
    if(s.mode==='setup'&&s.setupTool!=='skin')return false;
    const sources=sourceMap(s),skinMode=s.mode==='setup'&&s.setupTool==='skin';
    const pose=skinMode&&preview==='rest'?null:skinMode?(core.evaluateClip?.(preview,phase,'fox')||args.pose):args.pose;
    const bindGeom=bindingGeometry(s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
    const posed=pose?rig.geometry(pose,s.setup?.rig||rig.DEFAULT_REST_RIG):bindGeom;
    const maps=pose?boneTransforms(bindGeom,posed):null;
    const rigidMaps=pose?rigidBoneTransforms(bindGeom,posed):null;
    const counts={triangles:0,drawCalls:0,batched:0};const started=performance.now();
    const ctx=args.ctx;
    ctx.save();ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;
    // v1.1.12: one authoritative rasterisation path for Skin, Animate and
    // Quick Play. The v1.1.11 WebGL compositor was not device-validated and
    // produced broken Animate artwork while Skin's Canvas2D preview looked
    // correct. Do NOT re-enable GPU until pixel-parity is tested on device.
    lastPickedPoints=null;
    for(const item of parts){
      if(skinMode&&(hiddenParts.has(item.id)||(soloPart&&soloPart!==item.id)))continue;
      const source=sources.get(item.meshId);if(!validSource(source))continue;
      const {mesh,image}=source;
      const selected=skinMode&&item.id===selectedId;
      const binding=selected&&item.id===liveItemId&&liveBinding?liveBinding:bindingFor(item,source);
      const rest=transformVertices(mesh,item,image);
      const chosenMaps=binding?.envelopeMode==='rect-binary-v1'?rigidMaps:maps;
      const points=rest.map((p,i)=>project(binding&&chosenMaps?fastSkinVertex(p,binding.weights[i],chosenMaps):p,args.view));
      rasterTriangles(ctx,image,mesh,points,binding,pose,counts);
      if(selected&&heatmap&&binding){
        for(const tri of mesh.triangles){
          const [i,j,k]=tri,a=points[i],b=points[j],c=points[k];if(!a||!b||!c)continue;
          const weight=n=>binding.weights[n]?.find(p=>p[0]===selectedBone)?.[1]||0;
          heatTri(ctx,a,b,c,weight(i),weight(j),weight(k));
        }
      }
      if(selected){
        lastPickedPoints=points;
        if(wires){ctx.beginPath();for(const tri of mesh.triangles){const [i,j,k]=tri,a=points[i],b=points[j],c=points[k];if(!a||!b||!c)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();}
          ctx.strokeStyle='rgba(217,190,116,.53)';ctx.lineWidth=.65;ctx.stroke();}
        if(pickArmed||panel.querySelector('.animlab-skin-assembly-vertex')?.open){
          for(let i=0;i<points.length;i++){
            const p=points[i],active=i===vertexIndex,r=Math.max(active?3.5:2.1,args.canvas.width*(active?.004:.0023));
            ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=active?'#f8d58c':'rgba(245,236,210,.85)';ctx.fill();
            if(active){ctx.strokeStyle='#193037';ctx.lineWidth=1;ctx.stroke();}
          }
        }
      }
    }
    if(skinMode){
      const item=parts.find(p=>p.id===selectedId),source=item&&sources.get(item.meshId);
      const bound=item&&bindingFor(item,source);
      const allowed=new Set(groupBones(groupCandidate||bound?.group||'body'));
      const displayed=item?.id===liveItemId&&liveBinding?liveBinding:bound;
      if(showRect&&displayed?.envelopeMode==='rect-binary-v1'&&allowed.has(selectedBone)){
        const restFrame=rectangleFrame(selectedBone,displayed.rectangles?.[selectedBone]||defaultRectangle(),bindGeom);
        const displayFrame=rectanglePoseFrame(selectedBone,restFrame,bindGeom,posed);
        if(displayFrame){
          const restOutline=displayed.jointFit===true?jointFitPolygons(displayed,bindGeom).get(selectedBone):null;
          const bone=bones[selectedBone];
          const A=bindGeom[bone.a],B=bindGeom[bone.b],C=posed[bone.a],D=posed[bone.b];
          const shownOutline=restOutline&&A&&B&&C&&D
            ?restOutline.map(p=>mapBoneRigid(p,A,B,C,D)):restOutline;
          ctx.save();rectangleOutline(ctx,displayFrame,args.view,shownOutline);ctx.restore();
        }
      }
      ctx.lineCap='round';ctx.lineJoin='round';
      bones.forEach((bone,i)=>{
        const a=posed[bone.a],b=posed[bone.b];if(!a||!b)return;
        const A=project(a,args.view),B=project(b,args.view),active=i===selectedBone,on=allowed.has(i);
        ctx.strokeStyle=active?'rgba(255,232,158,.95)':on?'rgba(240,213,142,.54)':'rgba(220,230,223,.12)';
        ctx.lineWidth=active?Math.max(1.6,args.canvas.width*.0018):on?1:.6;
        ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
      });
    }
    ctx.restore();lastPerf={...counts,ms:performance.now()-started};return true;
  }
  core.registerArtRenderer('atlas-assembly-skin',render);
  core.subscribe(s=>{if(s.mode==='setup'&&s.setupTool==='atlas')signatures=new WeakMap();refresh();});refresh();
  window.AnimLabAssemblySkinInspect=Object.freeze({sourceSignature:signature,defaultEnvelope,envelopeFalloff,capsuleRows,activateEnvelopes,updateEnvelopeWeights,
    defaultRectangle,rectangleFrame,rectangleCorners,rectanglePoseFrame,jointFitPolygons,polygonContains,rectBinaryRows,activateRectangles,updateRectWeights,mapBoneRigid,skinVertex,sourceMap:()=>sourceMap(state()),performance:()=>({...lastPerf}),status:()=>({selectedId,selectedBone,preview,phase,heatmap,bound:(inventory(state())||[]).filter(p=>bindingFor(p,sourceMap(state()).get(p.meshId))).length}),rebuildWeights});
})();
