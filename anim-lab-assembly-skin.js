/* SideScroll v1.1.8 — Atlas assembly → Skin binding & posed preview.
 * Source UV/geometry belongs to Atlas, placement to Parts, joints to Rig.
 * Skin stores per-instance bone indices/weights only; no legacy six-region
 * assumptions, no hidden source topology regeneration.
 */
(() => {
  'use strict';
  const core=window.AnimLabCore,rig=window.GameHubFoxRig;
  if(!core||!rig?.RIG_DESIGNER?.boneLinks||!core.registerArtRenderer)return;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const bones=rig.RIG_DESIGNER.boneLinks;
  const groups=rig.RIG_DESIGNER.jointGroups||[];
  const getState=()=>core.getState();
  const inventory=s=>s?.setup?.artLayout?.assembly?.enabled?s.setup.artLayout.assembly.instances||[]:null;
  const atlas=()=>window.AnimLabAtlasInspect;
  const builtins=()=>window.AnimLabLegacyAtlas?.getSnapshot?.();
  const activeSource=s=>atlas()?.getCharacterId?.()===s.characterId?atlas()?.getDocument?.():null;
  function sourceMap(s){
    const map=new Map((activeSource(s)?.meshes||[]).map(m=>[m.id,{mesh:m,image:atlas()?.getImage?.()}]));
    const old=builtins();
    for(const m of old?.meshes||[])map.set(`atlas-builtin-${m.id}`,{mesh:m,image:old.image});
    return map;
  }
  function validSource(source){return source?.mesh?.vertices?.length>=3&&source.mesh.triangles?.length>0;}
  function sourceSignature(mesh){
    // Stable across renaming, affected by vertex order/position or topology edits.
    const str=JSON.stringify([mesh.vertices.map(v=>[v.x,v.y]),mesh.triangles]);
    let hash=2166136261;
    for(let i=0;i<str.length;i++){hash^=str.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `${mesh.vertices.length}:${mesh.triangles.length}:${(hash>>>0).toString(16)}`;
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
  function distanceToSegment(p,a,b){
    if(!a||!b)return 1e6;
    const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;
    const t=d2>1e-8?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d2,0,1):0;
    return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
  }
  function transformVertices(mesh,item,image){
    const verts=mesh.vertices;
    const xs=verts.map(v=>v.x),ys=verts.map(v=>v.y);
    const cx=(Math.min(...xs)+Math.max(...xs))/2,ymax=Math.max(...ys);
    const imageW=image?.naturalWidth||image?.width||atlas()?.getDocument?.()?.atlas?.width||1;
    const ppu=.95/imageW;
    const sx=Number(item.scaleX)||1,sy=Number(item.scaleY)||1;
    const rotation=Number(item.rotation)||0,c=Math.cos(rotation),s=Math.sin(rotation);
    const ox=Number(item.pivotX)||0,oy=Number(item.pivotY)||0;
    return verts.map(v=>{
      const x=(v.x-cx)*ppu-ox,y=(ymax-v.y)*ppu-oy;
      return {x:(Number(item.x)||0)+ox+c*x*sx-s*y*sy,
        y:(Number(item.y)||0)+oy+s*x*sx+c*y*sy};
    });
  }
  function bestGroup(item,mesh,source,geom){
    const label=`${item.nameOverride||''} ${item.label||''} ${mesh?.name||''}`.toLowerCase();
    if(/tail/.test(label))return 'tail';
    if(/body|head|torso|neck|trunk/.test(label))return 'body';
    const near=/near/.test(label),far=/far/.test(label),front=/front/.test(label),rear=/back|rear|hind/.test(label);
    if((near||far)&&(front||rear))return `${front?'front':'rear'}${near?'Near':'Far'}`;
    const vertices=transformVertices(mesh,item,source.image);
    const centroid=vertices.reduce((p,v)=>({x:p.x+v.x/vertices.length,y:p.y+v.y/vertices.length}),{x:0,y:0});
    const ranked=groups.map(g=>({id:g.id,d:Math.min(...groupBones(g.id).map(i=>distanceToSegment(centroid,geom[bones[i].a],geom[bones[i].b])))}));
    return ranked.sort((a,b)=>a.d-b.d)[0]?.id||'body';
  }
  function autoWeights(point,allowed,geom){
    const ranking=allowed.map(i=>{
      const b=bones[i];return {i,d:distanceToSegment(point,geom[b.a],geom[b.b])};
    }).sort((a,b)=>a.d-b.d).slice(0,3);
    // Rigid follow when only one bone, smooth three-bone interpolation otherwise.
    const scores=ranking.map(r=>1/Math.pow(r.d+.018,2));
    const total=scores.reduce((a,b)=>a+b,0)||1;
    return ranking.map((r,j)=>[r.i,Math.round(scores[j]/total*10000)/10000]);
  }
  function bindingFor(item,source){
    const b=item.skinBinding;
    return validSource(source)&&b?.schema==='animlab.skin-binding.v1'&&
      b.meshSignature===sourceSignature(source.mesh)&&b.weights?.length===source.mesh.vertices.length?b:null;
  }
  function createBinding(item,source,geom,group='auto'){
    const chosen=group==='auto'?bestGroup(item,source.mesh,source,geom):group;
    const allowed=groupBones(chosen);
    if(!allowed.length)return null;
    return {schema:'animlab.skin-binding.v1',meshSignature:sourceSignature(source.mesh),group:chosen,
      weights:transformVertices(source.mesh,item,source.image).map(p=>autoWeights(p,allowed,geom))};
  }
  function bindSelected(ids,groupOverride){
    const s=getState(),sources=sourceMap(s);
    const geom=rig.geometry(neutral,s.setup?.rig||rig.DEFAULT_REST_RIG);
    core.edit('setup',`Bind ${ids.size} atlas parts`,setup=>{
      for(const part of setup.artLayout?.assembly?.instances||[]){
        if(!ids.has(part.id))continue;
        const source=sources.get(part.meshId);
        if(!validSource(source))continue;
        part.skinBinding=createBinding(part,source,geom,groupOverride||part.skinBinding?.group||'auto');
      }
      return setup;
    });
  }
  function project(p,v){return {x:v.cx+p.x*v.scale*(v.flipX||1),y:v.groundY-p.y*v.scale};}
  function mapBone(p,a,b,c,d){
    if(!a||!b||!c||!d)return p;
    const bx=b.x-a.x,by=b.y-a.y,px=d.x-c.x,py=d.y-c.y;
    const bl=Math.hypot(bx,by),pl=Math.hypot(px,py);
    if(bl<1e-6||pl<1e-6)return p;
    const ux=bx/bl,uy=by/bl,vx=-uy,vy=ux;
    const dux=px/pl,duy=py/pl,dvx=-duy,dvy=dux;
    const dx=p.x-a.x,dy=p.y-a.y;
    const along=(dx*ux+dy*uy)*pl/bl,across=dx*vx+dy*vy;
    return{x:c.x+dux*along+dvx*across,y:c.y+duy*along+dvy*across};
  }
  function skinVertex(p,influences,bind,posed){
    let x=0,y=0,sum=0;
    for(const [index,weight] of influences||[]){
      const bone=bones[index];if(!bone||weight<=0)continue;
      const next=mapBone(p,bind[bone.a],bind[bone.b],posed[bone.a],posed[bone.b]);
      x+=next.x*weight;y+=next.y*weight;sum+=weight;
    }
    return sum>1e-6?{x:x/sum,y:y/sum}:p;
  }
  function triangle(ctx,image,a,b,c,u,v,w,alpha){
    const denominator=u.x*(v.y-w.y)+v.x*(w.y-u.y)+w.x*(u.y-v.y);
    if(Math.abs(denominator)<1e-7)return;
    const m={a:(a.x*(v.y-w.y)+b.x*(w.y-u.y)+c.x*(u.y-v.y))/denominator,
      c:(a.x*(w.x-v.x)+b.x*(u.x-w.x)+c.x*(v.x-u.x))/denominator,
      e:(a.x*(v.x*w.y-w.x*v.y)+b.x*(w.x*u.y-u.x*w.y)+c.x*(u.x*v.y-v.x*u.y))/denominator,
      b:(a.y*(v.y-w.y)+b.y*(w.y-u.y)+c.y*(u.y-v.y))/denominator,
      d:(a.y*(w.x-v.x)+b.y*(u.x-w.x)+c.y*(v.x-u.x))/denominator,
      f:(a.y*(v.x*w.y-w.x*v.y)+b.y*(w.x*u.y-u.x*w.y)+c.y*(u.x*v.y-v.x*u.y))/denominator};
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();
    ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.drawImage(image,0,0);ctx.restore();
  }

  const legacySkin=document.getElementById('animlab-skin-editor');
  const panel=document.createElement('section');panel.id='animlab-assembly-skin';panel.className='animlab-section animlab-assembly-skin';panel.hidden=true;
  panel.innerHTML=`
    <div class="animlab-section-title">Skin · Atlas assembly</div>
    <p class="animlab-skin-note">The parts from Parts are shown here. Bind each to the rig; this does not alter your Atlas mesh or assembly layout.</p>
    <div class="animlab-skin-assembly-status" role="status"></div>
    <div class="animlab-parts-subgroup-label">Parts &amp; bindings</div>
    <div class="animlab-skin-assembly-parts"></div>
    <div class="animlab-parts-subgroup-label">Edit selected binding</div>
    <label class="animlab-skin-group-select">Bone group
      <select data-skin-group></select>
    </label>
    <div class="animlab-view-grid animlab-skin-assembly-actions">
      <button type="button" data-bind-action="selected">Auto-bind selected</button>
      <button type="button" data-bind-action="all">Auto-bind all</button>
      <button type="button" data-bind-action="reset">Unbind selected</button>
    </div>
    <div class="animlab-parts-subgroup-label">Pose preview</div>
    <div class="animlab-view-grid animlab-skin-assembly-actions">
      <button type="button" data-preview="rest">Rest</button>
      <button type="button" data-preview="walk">Walk</button>
      <button type="button" data-preview="run">Run</button>
      <button type="button" data-preview="phase">Phase: 25%</button>
    </div>
    <details class="animlab-skin-assembly-vertex">
      <summary>Advanced · individual vertex weight</summary>
      <div class="animlab-view-grid"><button type="button" data-v-nav="prev">◀ Vertex</button><button type="button" data-v-nav="next">Vertex ▶</button></div>
      <div class="animlab-skin-vertex-label"></div>
      <label class="animlab-skin-group-select">Influence bone <select data-v-bone></select></label>
      <label class="animlab-slider"><span>Selected bone weight</span><input data-v-weight type="range" min="0" max="100" value="50" step="1"><output>50%</output></label>
      <button type="button" data-bind-action="auto-vertex">Reset vertex to automatic</button>
    </details>
    <p class="animlab-skin-note">Binding changes participate in Setup Undo / Redo / Save / Discard. New topology requires rebind; source edits never silently remap saved weights. The game runtime is not yet wired to this assembly.</p>`;
  (legacySkin||document.getElementById('animlab-extension')).insertAdjacentElement('afterend',panel);
  const rows=panel.querySelector('.animlab-skin-assembly-parts'),groupSelect=panel.querySelector('[data-skin-group]');
  groupSelect.innerHTML=groups.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
  const boneSelect=panel.querySelector('[data-v-bone]'),weightInput=panel.querySelector('[data-v-weight]');
  let selectedId=null,vertexIndex=0,boneIndex=0,preview='rest',phase=.25;
  let redrawPending=false;
  function label(item,sources){return item.nameOverride||sources.get(item.meshId)?.mesh?.name||item.label||item.id;}
  function selectedItem(s){return inventory(s)?.find(p=>p.id===selectedId)||null;}
  function statusFor(item,sources){
    const source=sources.get(item.meshId);
    if(!validSource(source))return 'Missing source mesh';
    return bindingFor(item,source)?'Bound':item.skinBinding?'Needs rebind (mesh changed)':'Unbound';
  }
  function refresh(){
    const s=getState(),parts=inventory(s);
    const active=!!parts&&s.family==='fox'&&s.mode==='setup'&&s.setupTool==='skin';
    panel.hidden=!active;
    if(!active)return;
    const sources=sourceMap(s);
    if(!parts.find(p=>p.id===selectedId))selectedId=parts[0]?.id||null;
    // Keep DOM focus while moving a range input. Buttons are re-created only
    // when the identity/status digest changes.
    const digest=JSON.stringify(parts.map(p=>[p.id,label(p,sources),statusFor(p,sources)]));
    if(rows.dataset.signature!==digest){
      rows.dataset.signature=digest;rows.replaceChildren();
      for(const part of parts){
        const btn=document.createElement('button');btn.type='button';btn.dataset.skinPart=part.id;
        btn.textContent=`${label(part,sources)} · ${statusFor(part,sources)}`;
        btn.addEventListener('click',()=>{selectedId=part.id;vertexIndex=0;boneIndex=0;refresh();core.redrawOnly?.();});rows.append(btn);
      }
    }
    for(const button of rows.children)button.classList.toggle('is-active',button.dataset.skinPart===selectedId);
    const bound=parts.filter(p=>statusFor(p,sources)==='Bound').length;
    const noTexture=parts.filter(p=>validSource(sources.get(p.meshId))&&!sources.get(p.meshId)?.image).length;
    panel.querySelector('.animlab-skin-assembly-status').textContent=`${bound} / ${parts.length} parts bound · ${parts.length-bound} need binding${noTexture?` · ${noTexture} source texture(s) unavailable`:''}`;
    const item=selectedItem(s),source=item&&sources.get(item.meshId),binding=item&&bindingFor(item,source);
    groupSelect.disabled=!item||!validSource(source);
    if(document.activeElement!==groupSelect)groupSelect.value=binding?.group||item?.skinBinding?.group|| (item&&validSource(source)?bestGroup(item,source.mesh,source,rig.geometry(neutral,s.setup.rig)):groups[0]?.id);
    for(const btn of panel.querySelectorAll('[data-bind-action]'))btn.disabled=btn.dataset.bindAction==='all'?!parts.length:!item||!validSource(source)||(btn.dataset.bindAction==='auto-vertex'&&!binding);
    for(const btn of panel.querySelectorAll('[data-preview]')){
      btn.classList.toggle('active',btn.dataset.preview===preview);
      if(btn.dataset.preview==='phase')btn.textContent=`Phase: ${Math.round(phase*100)}%`;
    }
    const vertCount=source?.mesh?.vertices?.length||0;
    vertexIndex=clamp(vertexIndex,0,Math.max(0,vertCount-1));
    panel.querySelector('.animlab-skin-vertex-label').textContent=`Vertex ${vertCount?vertexIndex+1:0} / ${vertCount} · ${binding?'saved weights':'bind part first'}`;
    const allowed=groupBones(binding?.group||groupSelect.value);
    if(!allowed.includes(boneIndex))boneIndex=allowed[0]??0;
    const boneDigest=allowed.join(',');
    if(boneSelect.dataset.signature!==boneDigest){boneSelect.dataset.signature=boneDigest;boneSelect.replaceChildren();
      for(const i of allowed){const opt=document.createElement('option');opt.value=String(i);opt.textContent=bones[i].label;boneSelect.append(opt);}}
    boneSelect.disabled=!binding;boneSelect.value=String(boneIndex);
    weightInput.disabled=!binding;
    const weight=binding?.weights?.[vertexIndex]?.find(pair=>pair[0]===boneIndex)?.[1]||0;
    if(document.activeElement!==weightInput)weightInput.value=String(Math.round(weight*100));
    weightInput.parentElement.querySelector('output').textContent=`${Math.round(weight*100)}%`;
  }
  groupSelect.addEventListener('change',()=>{
    // Selection is a candidate until Auto-bind; never silently replace weights.
    boneIndex=groupBones(groupSelect.value)[0]??0;refresh();
  });
  panel.addEventListener('click',event=>{
    const action=event.target.closest('[data-bind-action]')?.dataset.bindAction;
    const s=getState(),item=selectedItem(s),parts=inventory(s)||[];
    if(action==='selected'&&item){bindSelected(new Set([item.id]),groupSelect.value);vertexIndex=0;}
    if(action==='all'){bindSelected(new Set(parts.map(p=>p.id)));vertexIndex=0;}
    if(action==='reset'&&item)core.edit('setup','Unbind atlas part',setup=>{
      const target=setup.artLayout?.assembly?.instances?.find(p=>p.id===item.id);if(target)delete target.skinBinding;return setup;
    });
    if(action==='auto-vertex'&&item){
      const source=sourceMap(s).get(item.meshId),binding=bindingFor(item,source);
      if(binding){const geom=rig.geometry(neutral,s.setup?.rig);const vertex=transformVertices(source.mesh,item,source.image)[vertexIndex];
        const weights=autoWeights(vertex,groupBones(binding.group),geom);
        core.edit('setup',`Auto-bind vertex ${vertexIndex+1}`,setup=>{
          const target=setup.artLayout?.assembly?.instances?.find(p=>p.id===item.id);
          if(target?.skinBinding?.weights)target.skinBinding.weights[vertexIndex]=weights;return setup;
        });
      }
    }
    if(action){refresh();core.redrawOnly?.();}
    const mode=event.target.closest('[data-preview]')?.dataset.preview;
    if(mode){if(mode==='phase')phase=(phase+.25)%1;else preview=mode;refresh();core.redrawOnly?.();}
    const nav=event.target.closest('[data-v-nav]')?.dataset.vNav;
    if(nav){vertexIndex=Math.max(0,vertexIndex+(nav==='next'?1:-1));refresh();core.redrawOnly?.();}
  });
  boneSelect.addEventListener('change',()=>{boneIndex=Number(boneSelect.value)||0;refresh();core.redrawOnly?.();});
  weightInput.addEventListener('change',()=>{
    const s=getState(),item=selectedItem(s),source=item&&sourceMap(s).get(item.meshId),binding=item&&bindingFor(item,source);
    if(!binding)return;
    const value=clamp(Number(weightInput.value)/100,0,1),index=vertexIndex,bone=boneIndex;
    core.edit('setup',`Set vertex ${index+1} bone weight`,setup=>{
      const target=setup.artLayout?.assembly?.instances?.find(p=>p.id===item.id);
      const list=target?.skinBinding?.weights?.[index];if(!list)return setup;
      const oldTotal=list.filter(([i])=>i!==bone).reduce((t,[,w])=>t+w,0);
      const remaining=1-value;
      const revised=list.filter(([i])=>i!==bone).map(([i,w])=>[i,oldTotal>1e-8?w*remaining/oldTotal:0]);
      if(!revised.length&&remaining>0){const backup=groupBones(binding.group).find(i=>i!==bone);if(backup!==undefined)revised.push([backup,remaining]);}
      revised.push([bone,value]);target.skinBinding.weights[index]=revised;return setup;
    });refresh();core.redrawOnly?.();
  });
  const canvas=document.getElementById('animlab-canvas');
  function render(args){
    const s=getState(),parts=inventory(s);if(!parts||s.family!=='fox')return false;
    if(s.mode==='setup'&&!['skin'].includes(s.setupTool))return false;
    const sources=sourceMap(s);
    const skinMode=s.mode==='setup'&&s.setupTool==='skin';
    const neutralDisplay=skinMode&&preview==='rest';
    const pose=skinMode&&!neutralDisplay?(core.evaluateClip?.(preview,phase,'fox')||args.pose):args.pose;
    const bindGeom=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
    const posed=neutralDisplay?rig.geometry(neutral,s.setup?.rig||rig.DEFAULT_REST_RIG):rig.geometry(pose,s.setup?.rig||rig.DEFAULT_REST_RIG);
    const ctx=args.ctx;
    ctx.save();ctx.imageSmoothingEnabled=true;
    for(const item of parts){
      const source=sources.get(item.meshId);if(!validSource(source))continue;
      const {mesh,image}=source;
      const bind=bindingFor(item,source);
      const restPoints=transformVertices(mesh,item,image);
      const points=restPoints.map((p,i)=>project(bind&&!neutralDisplay?skinVertex(p,bind.weights[i],bindGeom,posed):p,args.view));
      const selected=skinMode&&item.id===selectedId;
      const isReady=!!(image&&(image.complete!==false)&&(image.naturalWidth||image.width));
      for(const tri of mesh.triangles){
        const [i,j,k]=tri;
        if(!points[i]||!points[j]||!points[k])continue;
        const uv0=mesh.vertices[i],uv1=mesh.vertices[j],uv2=mesh.vertices[k];
        if(isReady)triangle(ctx,image,points[i],points[j],points[k],uv0,uv1,uv2,
          (skinMode&&!selected)?0.18:1);
        else{ctx.beginPath();ctx.moveTo(points[i].x,points[i].y);ctx.lineTo(points[j].x,points[j].y);ctx.lineTo(points[k].x,points[k].y);ctx.closePath();ctx.strokeStyle='#90b0ab';ctx.stroke();}
      }
      if(selected){
        ctx.beginPath();for(const tri of mesh.triangles){const [i,j,k]=tri;const a=points[i],b=points[j],c=points[k];if(!a||!b||!c)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();}
        ctx.strokeStyle='rgba(245,196,102,.56)';ctx.lineWidth=.8;ctx.stroke();
        if(panel.querySelector('details')?.open){const point=points[vertexIndex];if(point){ctx.beginPath();ctx.arc(point.x,point.y,Math.max(3,args.canvas.width*.004),0,Math.PI*2);ctx.strokeStyle='#fff2c1';ctx.lineWidth=2;ctx.stroke();}}
      }
    }
    if(skinMode){
      // Draw the real posed skeleton for the selected binding group, so bone
      // assignments can be evaluated without turning on the global Fox overlay.
      const item=parts.find(p=>p.id===selectedId);
      const group=item?.skinBinding?.group||panel.querySelector('[data-skin-group]')?.value||'body';
      const allowed=new Set(groupBones(group));
      ctx.lineCap='round';ctx.lineJoin='round';
      bones.forEach((bone,index)=>{
        const a=posed[bone.a],b=posed[bone.b];if(!a||!b)return;
        const A=project(a,args.view),B=project(b,args.view);
        const on=allowed.has(index);
        ctx.strokeStyle=on?'rgba(250,215,140,.88)':'rgba(218,231,225,.23)';
        ctx.lineWidth=on?Math.max(1.2,args.canvas.width*.0014):.7;
        ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
      });
    }
    ctx.restore();return true;
  }
  core.registerArtRenderer('atlas-assembly-skin',render);
  core.subscribe(()=>refresh());
  refresh();
  window.AnimLabAssemblySkinInspect=Object.freeze({sourceSignature,sourceMap:()=>sourceMap(getState()),status:()=>({selectedId,preview,phase,bound:(inventory(getState())||[]).filter(p=>bindingFor(p,sourceMap(getState()).get(p.meshId))).length})});
})();
