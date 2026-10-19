(function(){
  'use strict';

  const core=window.AnimLabCore;
  const canvas=document.getElementById('animlab-canvas');
  const setupSection=document.getElementById('animlab-setup-section');
  if(!core||!canvas||!setupSection)return;

  const section=document.createElement('section');
  section.className='animlab-section animlab-art-layout-controls';
  section.hidden=true;
  section.innerHTML=`
    <div class="animlab-section-title">Part Layout</div>
    <p class="animlab-art-layout-note">Arrange neutral artwork; joints and animation keys stay unchanged. Move joints in Rig without moving artwork; Rebind explicitly before saving a changed rig.</p>
    <div class="animlab-art-part-board" aria-label="Bind art parts"></div>
    <div class="animlab-rig-selected animlab-art-selected">
      <div class="animlab-rig-selected-title">No part selected</div>
      <div class="animlab-rig-selected-pos"></div>
    </div>
    <div class="animlab-art-numeric-grid" aria-label="Selected part transform values">
      <label>X <input type="number" data-art-number="x" inputmode="decimal" step="0.01"></label>
      <label>Y <input type="number" data-art-number="y" inputmode="decimal" step="0.01"></label>
      <label>Rotation ° <input type="number" data-art-number="rotation" inputmode="decimal" step="0.5"></label>
      <label>Width <input type="number" data-art-number="scaleX" inputmode="decimal" min="0.25" max="3" step="0.01"></label>
      <label>Height <input type="number" data-art-number="scaleY" inputmode="decimal" min="0.25" max="3" step="0.01"></label>
      <label>Pivot X <input type="number" data-art-number="pivotX" inputmode="decimal" step="0.01"></label>
      <label>Pivot Y <input type="number" data-art-number="pivotY" inputmode="decimal" step="0.01"></label>
    </div>
    <div class="animlab-segmented animlab-art-transform-row">
      <button type="button" data-art-transform="move">Move</button>
      <button type="button" data-art-transform="rotate">Rotate</button>
      <button type="button" data-art-transform="scale">Scale</button>
      <button type="button" data-art-transform="pivot">Pivot</button>
    </div>
    <div class="animlab-precision animlab-rig-precision">
      <div class="animlab-precision-row animlab-rig-axis animlab-art-axis">
        <button type="button" data-art-axis="free">Free</button>
        <button type="button" data-art-axis="x">X only</button>
        <button type="button" data-art-axis="y">Y only</button>
        <button type="button" data-art-fine="1">Fine</button>
      </div>
      <p class="animlab-art-layout-note">Select a part above, then drag the right pad. Scale: Free = X+Y, X only = width, Y only = height. Pivot moves without shifting the picture. The viewport only pans/zooms.</p>
    </div>
    <div class="animlab-art-layer-tools">
      <div class="animlab-view-grid animlab-art-visibility-buttons">
        <button type="button" data-art-action="toggle-visible">Hide Part</button>
        <button type="button" data-art-action="solo">Solo: Off</button>
        <button type="button" data-art-action="show-all">Show All</button>
      </div>
      <div class="animlab-view-grid animlab-art-order-buttons">
        <button type="button" data-art-action="back">Send Back</button>
        <button type="button" data-art-action="forward">Bring Forward</button>
        <button type="button" data-art-action="bottom">To Back</button>
        <button type="button" data-art-action="top">To Front</button>
      </div>
    </div>
    <div class="animlab-art-clipboard-tools">
      <div class="animlab-view-grid animlab-art-clipboard-buttons">
        <button type="button" data-art-action="copy">Copy Part</button>
        <button type="button" data-art-action="paste">Paste All</button>
        <button type="button" data-art-action="paste-position">Paste Position</button>
        <button type="button" data-art-action="paste-rotation">Paste Rotation</button>
        <button type="button" data-art-action="paste-scale">Paste Scale</button>
        <button type="button" data-art-action="paste-pivot">Paste Pivot</button>
        <button type="button" data-art-action="copy-pair">Copy to Pair</button>
      </div>
    </div>
    <div class="animlab-art-reference-tools">
      <div class="animlab-view-grid animlab-art-reference-buttons">
        <button type="button" data-art-action="reference">Show Reference</button>
        <button type="button" data-art-action="difference">Difference: Off</button>
      </div>
      <label class="animlab-slider"><span>Reference opacity</span><input type="range" data-art-reference-opacity min="0.05" max="1" step="0.01"><output></output></label>
    </div>
    <div class="animlab-rig-actions animlab-art-actions">
      <button type="button" data-art-action="reset-part">Reset Part</button>
      <button type="button" data-art-action="reset-layout">Reset Layout</button>
      <button type="button" data-art-action="align-reference">Align Reference</button>
    </div>
  `;
  const rigSection=document.querySelector('.animlab-rig-controls');
  (rigSection||setupSection).insertAdjacentElement('afterend',section);

  const board=section.querySelector('.animlab-art-part-board');
  const selectedTitle=section.querySelector('.animlab-rig-selected-title');
  const selectedPos=section.querySelector('.animlab-rig-selected-pos');
  const transformButtons=[...section.querySelectorAll('[data-art-transform]')];
  const axisButtons=[...section.querySelectorAll('[data-art-axis]')];
  const fineButton=section.querySelector('[data-art-fine]');
  const referenceButton=section.querySelector('[data-art-action="reference"]');
  const differenceButton=section.querySelector('[data-art-action="difference"]');
  const referenceOpacity=section.querySelector('[data-art-reference-opacity]');
  const viewportPadHost=document.getElementById('animlab-viewport-pad-host');
  const pad=document.createElement('div');
  pad.className='animlab-precision-pad animlab-viewport-precision-pad animlab-art-layout-pad';
  pad.setAttribute('role','application');
  pad.setAttribute('aria-label','Precision bind art transform');
  pad.innerHTML='<i class="animlab-pad-x"></i><i class="animlab-pad-y"></i><span>Move selected part</span>';
  if(viewportPadHost)viewportPadHost.appendChild(pad);
  pad.hidden=true;

  let selectedPart=null;
  let transformMode='move';
  let axis='free';
  let fine=false;
  let lastDescriptor=null;
  let lastRender=null;
  let viewportDrag=null;
  let precisionDrag=null;
  let soloPart=null; // display-only: never written into Setup or exported
  const hiddenParts=new Set(); // display-only: Hide/Show never dirty authored data
  let clipboard=null; // editor-only, available between part selections

  const clone=v=>JSON.parse(JSON.stringify(v));
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const DEG=Math.PI/180;

  function state(){return core.getState();}
  function descriptorFor(s){return s?.mode==='setup'&&s?.setupTool==='art'&&s?.rig?.ART_LAYOUT_DESIGNER||null;}
  function layoutFor(s){return s?.setup?.artLayout?.parts?s.setup.artLayout:null;}
  function isActive(s){return !!(descriptorFor(s)&&layoutFor(s));}
  function partById(desc,id){return desc?.parts?.find(part=>part.id===id)||null;}
  function transformFor(s,id){
    const raw=layoutFor(s)?.parts?.[id]||{};
    const scale=Number(raw.scale)||1;
    return {x:Number(raw.x)||0,y:Number(raw.y)||0,rotation:Number(raw.rotation)||0,
      scaleX:Number(raw.scaleX)||scale,scaleY:Number(raw.scaleY)||scale,
      pivotX:Number.isFinite(Number(raw.pivotX))?Number(raw.pivotX):0,
      pivotY:Number.isFinite(Number(raw.pivotY))?Number(raw.pivotY):0};
  }

  function ensureSelection(s,desc){
    if(selectedPart&&partById(desc,selectedPart))return;
    selectedPart=desc?.parts?.[0]?.id||null;
  }

  function renderBoard(desc){
    if(lastDescriptor===desc&&board.childElementCount)return;
    lastDescriptor=desc;
    board.textContent='';
    for(const part of desc?.parts||[]){
      const button=document.createElement('button');
      button.type='button';button.dataset.artPart=part.id;button.textContent=part.label||part.id;
      button.addEventListener('click',()=>{selectedPart=part.id;renderUI();core.redrawOnly?.();});
      board.appendChild(button);
    }
  }

  function sourcePixelToLocal(desc,px,py){
    const source=desc?.source||{};const ppu=Number(source.pixelsPerLocal)||1;
    return {x:(px-(Number(source.originX)||0))/ppu,y:((Number(source.groundY)||0)-py)/ppu};
  }

  function applyTransform(point,part,transform){
    const pivot={x:Number.isFinite(transform.pivotX)?transform.pivotX:(part?.pivot?.x||0),
      y:Number.isFinite(transform.pivotY)?transform.pivotY:(part?.pivot?.y||0)};
    const dx=point.x-pivot.x,dy=point.y-pivot.y;
    const c=Math.cos(Number(transform.rotation)||0),sn=Math.sin(Number(transform.rotation)||0);
    const sx=Number(transform.scaleX)||1,sy=Number(transform.scaleY)||1;
    return {
      x:pivot.x+(Number(transform.x)||0)+dx*sx*c-dy*sy*sn,
      y:pivot.y+(Number(transform.y)||0)+dx*sx*sn+dy*sy*c
    };
  }

  function partCornersLocal(desc,part,transform){
    const r=part.sourceRect||{};const x=Number(r.x)||0,y=Number(r.y)||0,w=Number(r.width)||0,h=Number(r.height)||0;
    return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>applyTransform(sourcePixelToLocal(desc,px,py),part,transform));
  }

  function project(point,view){return{x:view.cx+point.x*view.scale*(view.flipX||1),y:view.groundY-point.y*view.scale};}

  function renderUI(){
    const s=state(),desc=descriptorFor(s),active=isActive(s);
    section.hidden=!active;
    // Keep the Setup Joints / Part Layout switch visible, but put Part tools
    // directly beneath it instead of forcing a scroll past collider sliders.
    setupSection.classList.toggle('animlab-setup-art-active',active);
    if(!active){pad.hidden=true;lastRender=null;return;}
    if(viewportPadHost)viewportPadHost.hidden=false;
    pad.hidden=false;
    renderBoard(desc);ensureSelection(s,desc);
    const layout=layoutFor(s);
    const order=layout?.order||desc.parts.map(p=>p.id);
    board.querySelectorAll('[data-art-part]').forEach(button=>{
      const id=button.dataset.artPart,part=partById(desc,id),shown=!hiddenParts.has(id);
      button.classList.toggle('is-active',id===selectedPart);
      button.classList.toggle('is-hidden-part',!shown);
      button.classList.toggle('is-solo-part',soloPart===id);
      button.textContent=`${order.indexOf(id)+1}. ${part?.label||id}${shown?'':' (hidden)'}${soloPart===id?' (solo)':''}`;
    });
    transformButtons.forEach(button=>{const on=button.dataset.artTransform===transformMode;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
    axisButtons.forEach(button=>{const on=button.dataset.artAxis===axis;button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));button.disabled=!(transformMode==='move'||transformMode==='scale'||transformMode==='pivot');});
    fineButton.classList.toggle('is-active',fine);fineButton.setAttribute('aria-pressed',String(fine));
    const part=partById(desc,selectedPart),tr=transformFor(s,selectedPart);
    selectedTitle.textContent=part?.label||'No part selected';
    selectedPos.textContent=part?`X ${tr.x.toFixed(3)} Y ${tr.y.toFixed(3)}  Rot ${(tr.rotation/DEG).toFixed(1)}°  Width ${tr.scaleX.toFixed(2)} Height ${tr.scaleY.toFixed(2)}  Pivot ${tr.pivotX.toFixed(3)}, ${tr.pivotY.toFixed(3)}`:'';
    for(const input of section.querySelectorAll('[data-art-number]')){
      const property=input.dataset.artNumber,display=property==='rotation'?tr.rotation/DEG:tr[property];
      if(document.activeElement!==input)input.value=part?String(Number(display.toFixed(4))):'';
      input.disabled=!part;
    }
    section.querySelector('[data-art-action="copy-pair"]').disabled=!pairFor(selectedPart);
    const visibility=section.querySelector('[data-art-action="toggle-visible"]');
    visibility.textContent=hiddenParts.has(selectedPart)?'Show Part':'Hide Part';
    const soloBtn=section.querySelector('[data-art-action="solo"]');
    soloBtn.textContent=soloPart===selectedPart?'Solo: On':'Solo: Off';soloBtn.classList.toggle('is-active',soloPart===selectedPart);
    section.querySelectorAll('[data-art-action^="paste"]').forEach(btn=>btn.disabled=!clipboard);
    const index=order.indexOf(selectedPart);
    for(const name of ['back','bottom'])section.querySelector(`[data-art-action="${name}"]`).disabled=index<1;
    for(const name of ['forward','top'])section.querySelector(`[data-art-action="${name}"]`).disabled=index<0||index===order.length-1;
    pad.querySelector('span').textContent=`${transformMode[0].toUpperCase()+transformMode.slice(1)} selected part`;
    const ref=core.getStaticReference?.()||{opacity:.38};
    if(document.activeElement!==referenceOpacity)referenceOpacity.value=String(ref.opacity);
    const output=referenceOpacity.parentElement.querySelector('output');if(output)output.textContent=Number(ref.opacity).toFixed(2);
    const shown=core.getOverlay?.('reference');
    referenceButton.classList.toggle('active',!!shown);referenceButton.textContent=shown?'Reference Shown':'Show Reference';
    const skin=window.AnimLabSkinSurface;
    const diff=!!skin?.getDifference?.();
    differenceButton.classList.toggle('active',diff);differenceButton.textContent=`Difference: ${diff?'On':'Off'}`;differenceButton.disabled=!skin;
  }

  function editLayout(label,mutator){
    const s=state();if(!isActive(s))return;
    core.edit('setup',label,setup=>{
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      if(!setup.artLayout?.parts)return setup;
      mutator(setup.artLayout,descriptorFor(s));
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      return setup;
    });
  }

  function setPartInTransaction(tx,id,next){
    if(!tx||!id)return;
    core.previewTransaction(tx,setup=>{
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      if(!setup.artLayout?.parts?.[id])return setup;
      Object.assign(setup.artLayout.parts[id],next);
      setup.artLayout=core.normaliseArtLayout?.(setup.artLayout)||setup.artLayout;
      return setup;
    });
  }

  function defaults(){return core.normaliseArtLayout?.(null)||null;}

  function pairFor(id){
    return {rearNear:'rearFar',rearFar:'rearNear',frontNear:'frontFar',frontFar:'frontNear'}[id]||null;
  }

  // Preserve the exact mapped artwork when its transform origin changes.
  function shiftPivotKeepingArt(start,newPivotX,newPivotY){
    const vx=start.pivotX-newPivotX,vy=start.pivotY-newPivotY;
    const c=Math.cos(start.rotation),sn=Math.sin(start.rotation);
    return {pivotX:newPivotX,pivotY:newPivotY,
      x:start.x+vx-(c*start.scaleX*vx-sn*start.scaleY*vy),
      y:start.y+vy-(sn*start.scaleX*vx+c*start.scaleY*vy)};
  }

  function action(name){
    const s=state(),desc=descriptorFor(s);if(!desc)return;
    if(name==='reference'){
      core.setOverlay?.('reference',!core.getOverlay?.('reference'));return;
    }
    if(name==='difference'){
      const skin=window.AnimLabSkinSurface;if(!skin)return;
      skin.setBindProof?.(true);skin.setDifference?.(!skin.getDifference?.());renderUI();return;
    }
    if(name==='align-reference'){
      const source=desc.referenceSource||core.getStaticReference?.()?.source||'original';
      core.setStaticReference?.({source,scale:1,offsetX:0,offsetY:0});
      if(!core.getOverlay?.('reference'))core.setOverlay?.('reference',true);
      return;
    }
    if(name==='solo'){
      if(soloPart!==selectedPart)hiddenParts.delete(selectedPart);
      soloPart=soloPart===selectedPart?null:selectedPart;
      renderUI();core.redrawOnly?.();return;
    }
    if(name==='show-all'){
      soloPart=null;hiddenParts.clear();renderUI();core.redrawOnly?.();return;
    }
    if(name==='toggle-visible'&&selectedPart){
      if(hiddenParts.has(selectedPart))hiddenParts.delete(selectedPart);
      else hiddenParts.add(selectedPart);
      renderUI();core.redrawOnly?.();return;
    }
    if(['back','forward','bottom','top'].includes(name)&&selectedPart){
      editLayout(`Reorder ${partById(desc,selectedPart)?.label||selectedPart}`,layout=>{
        const order=layout.order,at=order.indexOf(selectedPart);if(at<0)return;
        const target=name==='bottom'?0:name==='top'?order.length-1:at+(name==='back'?-1:1);
        if(target<0||target>=order.length)return;
        order.splice(at,1);order.splice(target,0,selectedPart);
      });return;
    }
    if(name==='copy-pair'&&selectedPart&&pairFor(selectedPart)){
      const source=transformFor(s,selectedPart),pair=pairFor(selectedPart);
      editLayout('Copy part transform to near/far pair',layout=>{
        Object.assign(layout.parts[pair],{
          x:source.x,y:source.y,rotation:source.rotation,
          scaleX:source.scaleX,scaleY:source.scaleY
        });
      });return;
    }
    if(name==='copy'&&selectedPart){
      clipboard=clone(transformFor(s,selectedPart));renderUI();return;
    }
    if(name.startsWith('paste')&&selectedPart&&clipboard){
      const properties=name==='paste-position'?['x','y']:
        name==='paste-rotation'?['rotation']:
        name==='paste-scale'?['scaleX','scaleY']:
        name==='paste-pivot'?['pivotX','pivotY']:
        ['x','y','rotation','scaleX','scaleY','pivotX','pivotY'];
      editLayout(`Paste ${name.slice(6)||'all'} transform`,layout=>{
        for(const prop of properties)layout.parts[selectedPart][prop]=clipboard[prop];
      });return;
    }
    if(name==='reset-part'&&selectedPart){
      const base=defaults()?.parts?.[selectedPart];if(!base)return;
      editLayout(`Reset ${partById(desc,selectedPart)?.label||selectedPart} layout`,layout=>{layout.parts[selectedPart]=clone(base);});
      return;
    }
    if(name==='reset-layout'){
      const base=defaults();if(!base)return;
      core.edit('setup','Reset part layout',setup=>{setup.artLayout=clone(base);return setup;});
    }
  }

  section.addEventListener('click',event=>{
    const t=event.target.closest('[data-art-transform]');if(t){transformMode=t.dataset.artTransform;renderUI();return;}
    const a=event.target.closest('[data-art-axis]');if(a){axis=a.dataset.artAxis;renderUI();return;}
    if(event.target.closest('[data-art-fine]')){fine=!fine;renderUI();return;}
    const actionButton=event.target.closest('[data-art-action]');if(actionButton)action(actionButton.dataset.artAction);
  });

  section.querySelector('.animlab-art-numeric-grid').addEventListener('change',event=>{
    const input=event.target.closest('[data-art-number]');if(!input||!selectedPart)return;
    const property=input.dataset.artNumber,entered=Number(input.value);
    if(!Number.isFinite(entered)||input.value.trim()===''){renderUI();return;}
    const s=state(),current=transformFor(s,selectedPart);
    let next={};
    if(property==='rotation')next.rotation=clamp(entered*DEG,-Math.PI,Math.PI);
    else if(property==='scaleX'||property==='scaleY')next[property]=clamp(entered,.25,3);
    else if(property==='pivotX'||property==='pivotY'){
      const px=property==='pivotX'?clamp(entered,-2,2):current.pivotX;
      const py=property==='pivotY'?clamp(entered,-2,2):current.pivotY;
      next=shiftPivotKeepingArt(current,px,py);
    }else next[property]=clamp(entered,property==='x'?-1.5:-1,property==='x'?1.5:1);
    editLayout(`Set ${property} for ${partById(descriptorFor(s),selectedPart)?.label||selectedPart}`,
      layout=>Object.assign(layout.parts[selectedPart],next));
    renderUI();
  });

  referenceOpacity.addEventListener('input',()=>{const value=Number(referenceOpacity.value);if(Number.isFinite(value))core.setStaticReference?.({opacity:value});});

  function pointInPolygon(point,poly){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      const hit=((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/((b.y-a.y)||1e-9)+a.x);
      if(hit)inside=!inside;
    }
    return inside;
  }

  function canvasPoint(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    return{x:(clientX-rect.left)*(canvas.width/rect.width),y:(clientY-rect.top)*(canvas.height/rect.height)};
  }

  function unproject(render,clientX,clientY){
    if(!render?.view)return null;const p=canvasPoint(clientX,clientY),v=render.view,flip=v.flipX||1;
    return{x:(p.x-v.cx)/(v.scale*flip),y:(v.groundY-p.y)/v.scale};
  }

  function hitPart(render,clientX,clientY){
    const p=canvasPoint(clientX,clientY);
    if(selectedPart&&pointInPolygon(p,render.polygons[selectedPart]||[]))return selectedPart;
    const ids=[...(render.order||[])].reverse();
    return ids.find(id=>pointInPolygon(p,render.polygons[id]||[]))||null;
  }

  function viewportDown(event){
    const s=state();if(!isActive(s)||!lastRender)return;
    const id=hitPart(lastRender,event.clientX,event.clientY);if(!id)return;
    event.preventDefault();event.stopImmediatePropagation();selectedPart=id;
    const model=unproject(lastRender,event.clientX,event.clientY),start=transformFor(s,id);
    viewportDrag={pointerId:event.pointerId,part:id,start,model,tx:core.beginTransaction('setup',`Move ${partById(descriptorFor(s),id)?.label||id}`)};
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
    renderUI();core.redrawOnly?.();
  }

  function viewportMove(event){
    if(!viewportDrag||viewportDrag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const model=unproject(lastRender,event.clientX,event.clientY);if(!model||!viewportDrag.model)return;
    setPartInTransaction(viewportDrag.tx,viewportDrag.part,{x:viewportDrag.start.x+(model.x-viewportDrag.model.x),y:viewportDrag.start.y+(model.y-viewportDrag.model.y)});
  }

  function finishViewport(event,cancel){
    if(!viewportDrag||viewportDrag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();const drag=viewportDrag;viewportDrag=null;
    if(cancel)core.cancelTransaction(drag.tx);else core.commitTransaction(drag.tx);
    try{canvas.releasePointerCapture(event.pointerId);}catch(_){}renderUI();
  }

  // Viewport dragging stays pan/zoom only to prevent accidental part moves.
  // canvas.addEventListener('pointerdown',viewportDown,true);
  // canvas.addEventListener('pointermove',viewportMove,true);
  // canvas.addEventListener('pointerup',event=>finishViewport(event,false),true);
  // canvas.addEventListener('pointercancel',event=>finishViewport(event,true),true);

  function precisionDown(event){
    const s=state();if(!isActive(s)||!selectedPart)return;
    event.preventDefault();precisionDrag={pointerId:event.pointerId,part:selectedPart,startX:event.clientX,startY:event.clientY,start:transformFor(s,selectedPart),tx:core.beginTransaction('setup',`${transformMode} ${partById(descriptorFor(s),selectedPart)?.label||selectedPart}`)};
    try{pad.setPointerCapture(event.pointerId);}catch(_){}
  }

  function precisionMove(event){
    if(!precisionDrag||precisionDrag.pointerId!==event.pointerId)return;
    event.preventDefault();const dx=event.clientX-precisionDrag.startX,dy=event.clientY-precisionDrag.startY;
    const next={};
    const rect=canvas.getBoundingClientRect(),view=lastRender?.view;
    const pxScale=canvas.width/Math.max(1,rect.width);
    const sensitivity=(fine ? .25 : 1)*pxScale/Math.max(1,view?.scale||1);
    if(transformMode==='move'||transformMode==='pivot'){
      let mx=dx*sensitivity,my=-dy*sensitivity;
      if(axis==='x')my=0;if(axis==='y')mx=0;
      if(transformMode==='move'){
        next.x=precisionDrag.start.x+mx;next.y=precisionDrag.start.y+my;
      }else{
        // Rebase translation so moving a pivot cannot shift existing artwork.
        const start=precisionDrag.start;
        next.pivotX=clamp(start.pivotX+mx,-2,2);
        next.pivotY=clamp(start.pivotY+my,-2,2);
        Object.assign(next,shiftPivotKeepingArt(start,next.pivotX,next.pivotY));
      }
    }else if(transformMode==='rotate'){
      next.rotation=precisionDrag.start.rotation+dx*(fine ? .10 : .35)*DEG;
    }else{
      const start=precisionDrag.start,amount=dx*(fine ? .001 : .0035);
      if(axis!=='y')next.scaleX=clamp(start.scaleX+amount,.25,3);
      if(axis!=='x')next.scaleY=clamp(start.scaleY+amount,.25,3);
    }
    setPartInTransaction(precisionDrag.tx,precisionDrag.part,next);
  }

  function finishPrecision(event,cancel){
    if(!precisionDrag||precisionDrag.pointerId!==event.pointerId)return;
    event.preventDefault();const drag=precisionDrag;precisionDrag=null;
    if(cancel)core.cancelTransaction(drag.tx);else core.commitTransaction(drag.tx);
    try{pad.releasePointerCapture(event.pointerId);}catch(_){}renderUI();
  }

  pad.addEventListener('pointerdown',precisionDown);
  pad.addEventListener('pointermove',precisionMove);
  pad.addEventListener('pointerup',event=>finishPrecision(event,false));
  pad.addEventListener('pointercancel',event=>finishPrecision(event,true));

  function renderer(args){
    const s=state(),desc=descriptorFor(s);if(!desc||!layoutFor(s)){lastRender=null;return;}
    const {ctx,view}=args,polygons={},pivots={};
    const order=layoutFor(s)?.order||desc.parts.map(p=>p.id);
    if(soloPart&&!partById(desc,soloPart))soloPart=null;
    for(const part of desc.parts||[]){
      const tr=transformFor(s,part.id),corners=partCornersLocal(desc,part,tr),screen=corners.map(p=>project(p,view));
      polygons[part.id]=screen;pivots[part.id]=project(applyTransform(part.pivot,part,tr),view);
    }
    lastRender={view,polygons,pivots,order};
    ctx.save();ctx.lineJoin='round';ctx.lineWidth=Math.max(1.5,canvas.width/650);
    for(const part of desc.parts||[]){
      const poly=polygons[part.id];if(!poly?.length)continue;const active=part.id===selectedPart;
      const hidden=hiddenParts.has(part.id);
      ctx.strokeStyle=active?'rgba(255,196,92,.98)':hidden?'rgba(241,132,128,.28)':'rgba(126,216,199,.34)';ctx.setLineDash(active?[]:[7,6]);
      ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.stroke();
      if(active){const p=pivots[part.id],r=Math.max(6,canvas.width/180);ctx.setLineDash([]);ctx.fillStyle='rgba(255,196,92,.92)';ctx.strokeStyle='rgba(255,239,195,.98)';ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
    }
    ctx.restore();
  }

  // Read-only display state consumed by compatible renderers. Solo is ephemeral.
  window.AnimLabPartLayoutDisplay=Object.freeze({
    getSolo:()=>isActive(state())?soloPart:null,
    isHidden:id=>isActive(state())&&hiddenParts.has(id)
  });
  core.registerPluginRenderer?.('art-layout-designer',renderer);
  core.subscribe?.(()=>renderUI());
  renderUI();
})();
