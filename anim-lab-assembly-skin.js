/* SideScroll v1.1.10 — rigid bone weights and consistent Skin editing.
 * Atlas owns UV/geometry, Parts owns instances and transforms, Rig owns joints.
 * Skin owns per-instance normalized weights. No fixed-six-region assumptions.
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
  const inventory=s=>s?.setup?.artLayout?.assembly?.enabled?s.setup.artLayout.assembly.instances||[]:null;
  const atlas=()=>window.AnimLabAtlasInspect;
  const activeSource=s=>atlas()?.getCharacterId?.()===s.characterId?atlas()?.getDocument?.():null;
  function sourceMap(s){
    const map=new Map((activeSource(s)?.meshes||[]).map(mesh=>[mesh.id,{mesh,image:atlas()?.getImage?.()}]));
    const old=window.AnimLabLegacyAtlas?.getSnapshot?.();
    for(const mesh of old?.meshes||[])map.set(`atlas-builtin-${mesh.id}`,{mesh,image:old.image});
    return map;
  }
  const validSource=source=>source?.mesh?.vertices?.length>=3&&source.mesh.triangles?.length>0;
  function signature(mesh){
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
  function pointSegmentDistance(p,a,b){
    if(!a||!b)return 1e6;
    const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;
    const t=d2>1e-8?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d2,0,1):0;
    return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
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
    const baseWeights=transformVertices(source.mesh,item,source.image).map(p=>autoWeights(p,allowed,geom));
    return{schema:'animlab.skin-binding.v1',meshSignature:signature(source.mesh),group:chosen,
      weights:clone(baseWeights),baseWeights,boneProfiles:{},manualWeights:{}};
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
  function skinVertex(p,influences,bind,posed){
    let x=0,y=0,sum=0;
    for(const [i,w] of influences||[]){
      const bone=bones[i];if(!bone||w<=0)continue;
      const point=mapBone(p,bind[bone.a],bind[bone.b],posed[bone.a],posed[bone.b]);
      x+=point.x*w;y+=point.y*w;sum+=w;
    }
    return sum>1e-8?{x:x/sum,y:y/sum}:p;
  }
  function triangle(ctx,image,a,b,c,u,v,w){
    const den=u.x*(v.y-w.y)+v.x*(w.y-u.y)+w.x*(u.y-v.y);
    if(Math.abs(den)<1e-7)return;
    const m={a:(a.x*(v.y-w.y)+b.x*(w.y-u.y)+c.x*(u.y-v.y))/den,
      c:(a.x*(w.x-v.x)+b.x*(u.x-w.x)+c.x*(v.x-u.x))/den,
      e:(a.x*(v.x*w.y-w.x*v.y)+b.x*(w.x*u.y-u.x*w.y)+c.x*(u.x*v.y-v.x*u.y))/den,
      b:(a.y*(v.y-w.y)+b.y*(w.y-u.y)+c.y*(u.y-v.y))/den,
      d:(a.y*(w.x-v.x)+b.y*(u.x-w.x)+c.y*(v.x-u.x))/den,
      f:(a.y*(v.x*w.y-w.x*v.y)+b.y*(w.x*u.y-u.x*w.y)+c.y*(u.x*v.y-v.x*u.y))/den};
    ctx.save();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);
    ctx.closePath();ctx.clip();ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.drawImage(image,0,0);ctx.restore();
  }
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
      <label class="animlab-slider animlab-skin-primary-slider"><span>Peak Bone Weight (0–100%)</span><input data-skin-peak type="range" min="0" max="100" step="1" value="50"><output>50%</output></label>
      <div class="animlab-skin-weight-status" data-weight-status role="status"></div>
      <label class="animlab-slider"><span>Influence Spread / Falloff</span><input data-skin-spread type="range" min="0.5" max="2.5" step="0.05" value="1"><output>1.00×</output></label>
      <div class="animlab-view-grid animlab-skin-assembly-actions">
        <button type="button" data-skin-display="heatmap">Heatmap: Off</button>
        <button type="button" data-skin-display="wires">Wireframe: On</button>
        <button type="button" data-bind-action="reset-bone">Reset bone</button>
      </div>
      <div class="animlab-skin-legend" data-heat-legend hidden><span>0% · Blue</span><i></i><span>Red · 100%</span></div>
      <p class="animlab-skin-note">Peak adjusts the maximum weight, not every vertex. For an exact one-bone test use <b>Rigid bind</b>, which gives 100% of the selected bone to every vertex. Heatmap never reduces artwork opacity.</p>
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
  const bonesBoard=panel.querySelector('[data-skin-bones]'),peakSlider=panel.querySelector('[data-skin-peak]'),spreadSlider=panel.querySelector('[data-skin-spread]');
  const weightInput=panel.querySelector('[data-v-weight]'),copySelect=panel.querySelector('[data-copy-target]');
  const canvas=document.getElementById('animlab-canvas');
  groupSelect.innerHTML=groups.map(g=>`<option value="${g.id}">${g.label}</option>`).join('');
  let selectedId=null,selectedBone=0,vertexIndex=0,groupCandidate=null,preview='rest',phase=.25;
  let heatmap=false,wires=true,pickArmed=false,lastPickedPoints=null,liveBinding=null,liveItemId=null;
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
    const base=binding?baseRows(binding):[],profile=binding?.boneProfiles?.[selectedBone];
    const automaticPeak=peakOf(base,selectedBone);
    const actualPeak=binding?peakOf(binding.weights,selectedBone):0;
    const peak=profile?.peakWeight??actualPeak,spread=profile?.spread||1;
    peakSlider.disabled=!canWeight;spreadSlider.disabled=!canWeight;
    if(document.activeElement!==peakSlider)peakSlider.value=String(Math.round(peak*100));
    if(document.activeElement!==spreadSlider)spreadSlider.value=String(spread);
    peakSlider.parentElement.querySelector('output').textContent=`${Math.round(peak*100)}%`;
    spreadSlider.parentElement.querySelector('output').textContent=`${Number(spread).toFixed(2)}×`;
    const actualMin=binding?Math.min(1,...binding.weights.map(row=>row.find(p=>p[0]===selectedBone)?.[1]||0)):0;
    const isRigid=!!binding&&binding.weights.length>0&&binding.weights.every(row=>row.length===1&&row[0][0]===selectedBone&&row[0][1]>=.9999);
    panel.querySelector('[data-weight-status]').textContent=binding?
      `${isRigid?'Rigid · ':''}Selected bone across vertices: ${Math.round(actualMin*100)}–${Math.round(actualPeak*100)}% · Auto max ${Math.round(automaticPeak*100)}%`:
      'Bind a part to edit its weights.';
    const rigidButton=panel.querySelector('[data-bind-action="rigid"]');
    rigidButton.classList.toggle('active',isRigid);
    rigidButton.setAttribute('aria-pressed',String(isRigid));
    for(const action of ['heatmap','wires']){
      const button=panel.querySelector(`[data-skin-display="${action}"]`),on=action==='heatmap'?heatmap:wires;
      button.textContent=`${action==='heatmap'?'Heatmap':'Wireframe'}: ${on?'On':'Off'}`;
      button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));
    }
    panel.querySelector('[data-heat-legend]').hidden=!heatmap;
    const vertCount=source?.mesh?.vertices?.length||0;
    vertexIndex=clamp(vertexIndex,0,Math.max(0,vertCount-1));
    panel.querySelector('.animlab-skin-vertex-label').textContent=`Vertex ${vertCount?vertexIndex+1:0} / ${vertCount} · ${binding?.manualWeights?.[vertexIndex]?'Manual':'Automatic'}${pickArmed?' · tap the viewport':''}`;
    const weight=binding?.weights?.[vertexIndex]?.find(p=>p[0]===selectedBone)?.[1]||0;
    weightInput.disabled=!canWeight;
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
  function previewSlider(input,kind){
    const s=state(),item=selectedItem(s),source=item&&sourceMap(s).get(item.meshId),saved=item&&bindingFor(item,source);
    if(!saved||lockedParts.has(item.id))return;
    // Never accumulate modifications from earlier input events in one drag.
    const previewBinding=clone(saved);
    previewBinding.baseWeights ||= clone(saved.weights);
    previewBinding.boneProfiles ||= {};
    const profile={...(previewBinding.boneProfiles[selectedBone]||{})};
    if(kind==='peak')profile.peakWeight=clamp(Number(input.value)/100,0,1);
    else {
      // Spread must work independently, even when the peak has never been
      // edited. Preserve the actual automatic peak rather than zeroing it.
      if(profile.peakWeight===undefined)profile.peakWeight=peakOf(baseRows(saved),selectedBone);
      profile.spread=clamp(Number(input.value)||1,.5,2.5);
    }
    previewBinding.boneProfiles[selectedBone]=profile;
    rebuildWeights(previewBinding);liveBinding=previewBinding;liveItemId=item.id;
    peakSlider.parentElement.querySelector('output').textContent=`${Math.round(Number(peakSlider.value))}%`;
    spreadSlider.parentElement.querySelector('output').textContent=`${Number(spreadSlider.value).toFixed(2)}×`;
    core.redrawOnly?.();
  }
  for(const [input,kind] of [[peakSlider,'peak'],[spreadSlider,'spread']]){
    input.addEventListener('input',()=>previewSlider(input,kind));
    input.addEventListener('change',()=>{
      if(!liveBinding||liveItemId!==selectedId)previewSlider(input,kind);
      if(liveBinding&&liveItemId===selectedId)
        commitBinding(selectedId,liveBinding,`Adjust ${kind==='peak'?'bone peak weight':'bone influence spread'}`);
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
      const geometry=rig.geometry(neutral,s.setup?.rig||rig.DEFAULT_REST_RIG);
      const binding=createBinding(item,sources.get(item.meshId),geometry,candidate);
      if(binding){commitBinding(item.id,binding,'Auto-bind selected part');vertexIndex=0;groupCandidate=null;}
    }
    if(action==='all'){
      const geometry=rig.geometry(neutral,s.setup?.rig||rig.DEFAULT_REST_RIG);
      core.edit('setup','Auto-bind all assembled parts',setup=>{
        for(const part of setup.artLayout?.assembly?.instances||[]){
          if(lockedParts.has(part.id))continue;
          const source=sources.get(part.meshId);if(validSource(source))part.skinBinding=createBinding(part,source,geometry,'auto');
        }
        return setup;
      });groupCandidate=null;vertexIndex=0;liveBinding=null;liveItemId=null;
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
        rebuildWeights(binding);
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
        if(action==='reset-bone')delete binding.boneProfiles[selectedBone];
        if(action==='auto-vertex')delete binding.manualWeights[vertexIndex];
        if(action==='reset-part'){binding.boneProfiles={};binding.manualWeights={};}
        rebuildWeights(binding);commitBinding(item.id,binding,action==='reset-bone'?'Reset bone influence':action==='auto-vertex'?'Reset vertex weights':'Reset part weights');
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
  function render(args){
    const s=state(),parts=inventory(s);if(!parts||s.family!=='fox')return false;
    if(s.mode==='setup'&&s.setupTool!=='skin')return false;
    const sources=sourceMap(s),skinMode=s.mode==='setup'&&s.setupTool==='skin';
    const pose=skinMode&&preview==='rest'?null:skinMode?(core.evaluateClip?.(preview,phase,'fox')||args.pose):args.pose;
    const bindGeom=rig.geometry(neutral,s.setup?.skinBindRig||s.setup?.rig||rig.DEFAULT_REST_RIG);
    const posed=pose?rig.geometry(pose,s.setup?.rig||rig.DEFAULT_REST_RIG):rig.geometry(neutral,s.setup?.rig||rig.DEFAULT_REST_RIG);
    const ctx=args.ctx;
    ctx.save();ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;
    lastPickedPoints=null;
    for(const item of parts){
      if(skinMode&&(hiddenParts.has(item.id)||(soloPart&&soloPart!==item.id)))continue;
      const source=sources.get(item.meshId);if(!validSource(source))continue;
      const {mesh,image}=source;
      const selected=skinMode&&item.id===selectedId;
      const binding=selected&&item.id===liveItemId&&liveBinding?liveBinding:bindingFor(item,source);
      const rest=transformVertices(mesh,item,image);
      const points=rest.map((p,i)=>project(binding&&pose?skinVertex(p,binding.weights[i],bindGeom,posed):p,args.view));
      const ready=!!(image&&image.complete!==false&&(image.naturalWidth||image.width));
      for(const tri of mesh.triangles){
        const [i,j,k]=tri,a=points[i],b=points[j],c=points[k];if(!a||!b||!c)continue;
        if(ready)triangle(ctx,image,a,b,c,mesh.vertices[i],mesh.vertices[j],mesh.vertices[k]);
        else{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fillStyle='#536b67';ctx.fill();}
        if(selected&&heatmap&&binding){
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
      ctx.lineCap='round';ctx.lineJoin='round';
      bones.forEach((bone,i)=>{
        const a=posed[bone.a],b=posed[bone.b];if(!a||!b)return;
        const A=project(a,args.view),B=project(b,args.view),active=i===selectedBone,on=allowed.has(i);
        ctx.strokeStyle=active?'rgba(255,232,158,.95)':on?'rgba(240,213,142,.54)':'rgba(220,230,223,.12)';
        ctx.lineWidth=active?Math.max(1.6,args.canvas.width*.0018):on?1:.6;
        ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
      });
    }
    ctx.restore();return true;
  }
  core.registerArtRenderer('atlas-assembly-skin',render);
  core.subscribe(()=>refresh());refresh();
  window.AnimLabAssemblySkinInspect=Object.freeze({sourceSignature:signature,sourceMap:()=>sourceMap(state()),status:()=>({selectedId,selectedBone,preview,phase,heatmap,bound:(inventory(state())||[]).filter(p=>bindingFor(p,sourceMap(state()).get(p.meshId))).length}),rebuildWeights});
})();
