(() => {
  'use strict';

  const core = window.AnimLabCore;
  const host = document.getElementById('animlab-extension');
  if (!core || !host) {
    console.error('[Anim Lab Stage 3] AnimLabCore or extension host is missing.');
    return;
  }

  const DEG = Math.PI / 180;
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const CHANNELS = {
    human: {
      linear:['pelvisY','aFootX','aFootLift','bFootX','bFootLift','aHandX','aHandY','bHandX','bHandY','travel'],
      angular:['lean','aFootAngle','bFootAngle','hairAngle','hairBend'],
      discrete:['planted']
    },
    fox: {
      linear:[
        'bodyBob','frontBodyLift','rearBodyLift','travel',
        'fnIkX','fnIkY','fnIkWeight','ffIkX','ffIkY','ffIkWeight',
        'rnIkX','rnIkY','rnIkWeight','rfIkX','rfIkY','rfIkWeight'
      ],
      angular:['bodyPitch','headPitch','tailBase','tailMid','tailTip','rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower'],
      discrete:['fnPlanted','ffPlanted','rnPlanted','rfPlanted']
    }
  };

  let clipboard = null;
  let lastPreviewReport = '';
  let lastFamily = null;
  let lastClip = null;

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-key-tools-section';
  section.setAttribute('aria-labelledby','animlab-key-tools-title');
  section.innerHTML = `
    <div class="animlab-section-title" id="animlab-key-tools-title">Key Pose Tools</div>
    <div class="animlab-timeline-summary" id="animlab-timeline-summary">The key-pose lane below the viewport is locked to the main 16-sample timeline.</div>

    <div class="animlab-key-detail">
      <div class="animlab-key-status" id="animlab-key-status">Frame 1</div>
      <div class="animlab-key-name-row">
        <input id="animlab-key-name" type="text" maxlength="48" autocomplete="off" aria-label="Selected key name" placeholder="Marker name">
        <button id="animlab-key-rename" type="button">Name</button>
      </div>
    </div>

    <div class="animlab-key-tools animlab-key-tools-primary">
      <button id="animlab-key-add" type="button">Add Tween</button>
      <button id="animlab-key-duplicate" type="button">Duplicate</button>
      <button id="animlab-key-delete" type="button">Delete</button>
      <button id="animlab-key-copy" type="button">Copy</button>
      <button id="animlab-key-paste" type="button">Paste</button>
      <button id="animlab-key-mirror" type="button">Mirror Key</button>
    </div>

    <div class="animlab-key-tools animlab-key-tools-cycle">
      <button id="animlab-key-left" type="button">Move ←</button>
      <button id="animlab-key-right" type="button">Move →</button>
      <button id="animlab-phase-left" type="button">Phase −1</button>
      <button id="animlab-phase-right" type="button">Phase +1</button>
      <button id="animlab-phase-half" type="button">Half Cycle</button>
      <button id="animlab-mirror-clip" type="button">Mirror Clip</button>
    </div>

    <div class="animlab-convert-box">
      <div class="animlab-convert-head"><strong>Sparse conversion</strong><span id="animlab-convert-count"></span></div>
      <div class="animlab-convert-copy" id="animlab-convert-copy">Preview an 8-key reduction before adopting it. Preview never changes authored data.</div>
      <div class="animlab-key-tools animlab-convert-actions">
        <button id="animlab-convert-preview" type="button">Preview 8 Keys</button>
        <button id="animlab-convert-adopt" type="button" disabled>Adopt Preview</button>
        <button id="animlab-convert-exit" type="button" disabled>Exit Preview</button>
      </div>
    </div>
  `;

  const controlSection = host.querySelector('.animlab-control-section');
  if (controlSection) host.insertBefore(section,controlSection);
  else host.appendChild(section);

  const trackHost = document.getElementById('animlab-key-track-host');
  if (!trackHost) {
    console.error('[Anim Lab Stage 3] Timeline dock host is missing.');
    return;
  }
  trackHost.innerHTML = `
    <div class="animlab-dock-label">Key Poses</div>
    <div class="animlab-key-track" id="animlab-key-track" aria-label="16 sample key-pose timeline"></div>
  `;

  const $ = id => document.getElementById(id);
  const track = $('animlab-key-track');
  const summary = $('animlab-timeline-summary');
  const status = $('animlab-key-status');
  const nameInput = $('animlab-key-name');
  const renameBtn = $('animlab-key-rename');
  const addBtn = $('animlab-key-add');
  const duplicateBtn = $('animlab-key-duplicate');
  const deleteBtn = $('animlab-key-delete');
  const copyBtn = $('animlab-key-copy');
  const pasteBtn = $('animlab-key-paste');
  const mirrorBtn = $('animlab-key-mirror');
  const leftBtn = $('animlab-key-left');
  const rightBtn = $('animlab-key-right');
  const phaseLeftBtn = $('animlab-phase-left');
  const phaseRightBtn = $('animlab-phase-right');
  const phaseHalfBtn = $('animlab-phase-half');
  const mirrorClipBtn = $('animlab-mirror-clip');
  const convertCount = $('animlab-convert-count');
  const convertCopy = $('animlab-convert-copy');
  const previewBtn = $('animlab-convert-preview');
  const adoptBtn = $('animlab-convert-adopt');
  const exitBtn = $('animlab-convert-exit');

  const frameButtons = [];
  for (let frame=0; frame<16; frame++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'animlab-key-cell';
    button.dataset.frame = String(frame);
    button.innerHTML = `<span class="animlab-key-number">${frame+1}</span><i class="animlab-key-dot" aria-hidden="true"></i>`;
    button.addEventListener('click',()=>core.setFrame(frame));
    frameButtons.push(button);
    track.appendChild(button);
  }

  function state() { return core.getState(); }
  function keysFor(st=state()) { return st.sparseClip?.keys || []; }
  function keyAt(frame, st=state()) { return keysFor(st).find(k=>k.frame===frame) || null; }

  function neighbours(frame, keys) {
    const sorted=[...keys].sort((a,b)=>a.frame-b.frame);
    if (!sorted.length) return {before:null,after:null};
    let before=null,after=null;
    for (const key of sorted) {
      if (key.frame < frame) before=key;
      if (key.frame > frame && !after) after=key;
    }
    return {before:before||sorted[sorted.length-1],after:after||sorted[0]};
  }

  function swapValues(obj,a,b) {
    const t=obj[a]; obj[a]=obj[b]; obj[b]=t;
  }

  function swapWords(text, a, b) {
    const token='__ANIMLAB_SWAP__';
    return String(text || '').replaceAll(a,token).replaceAll(b,a).replaceAll(token,b);
  }

  function mirrorName(name, family) {
    let out=String(name||'');
    if (family === 'human') {
      out=swapWords(out,' L',' R');
      out=swapWords(out,'Left','Right');
    } else {
      out=swapWords(out,'Near','Far');
    }
    return out;
  }

  function mirrorPose(pose, family) {
    const out=clone(pose);
    if (family === 'human') {
      for (const [a,b] of [
        ['aFootX','bFootX'],['aFootLift','bFootLift'],['aFootAngle','bFootAngle'],
        ['aHandX','bHandX'],['aHandY','bHandY']
      ]) swapValues(out,a,b);
      if (out.planted === 'A') out.planted='B';
      else if (out.planted === 'B') out.planted='A';
    } else {
      for (const [a,b] of [
        ['fnUpper','ffUpper'],['fnLower','ffLower'],
        ['rnUpper','rfUpper'],['rnLower','rfLower'],
        ['fnIkX','ffIkX'],['fnIkY','ffIkY'],['fnIkWeight','ffIkWeight'],['fnPlanted','ffPlanted'],['fnPlantPhase','ffPlantPhase'],
        ['rnIkX','rfIkX'],['rnIkY','rfIkY'],['rnIkWeight','rfIkWeight'],['rnPlanted','rfPlanted'],['rnPlantPhase','rfPlantPhase']
      ]) swapValues(out,a,b);
    }
    return out;
  }

  function markAuthored(clip) { clip.source='sparse-authored'; }

  function setKeyName(frame, name) {
    const clean=String(name||'').trim().slice(0,48);
    if (!clean) return false;
    return core.editSparseClip('Rename key pose',clip=>{
      const key=clip.keys.find(k=>k.frame===frame);
      if (!key) return;
      key.name=clean;
      key.pose.name=clean;
      markAuthored(clip);
    });
  }

  function addTweenKey() {
    const st=state();
    if (keyAt(st.frame,st) || st.preview) return;
    const pose=clone(core.getAuthoringPose ? core.getAuthoringPose() : st.pose);
    core.editSparseClip('Add tween key',clip=>{
      clip.keys.push({frame:st.frame,name:`Tween ${st.frame+1}`,pose});
      markAuthored(clip);
    });
  }

  function nextFreeFrame(frame, keys) {
    const occupied=new Set(keys.map(k=>k.frame));
    for (let step=1;step<16;step++) {
      const candidate=(frame+step)%16;
      if (!occupied.has(candidate)) return candidate;
    }
    return null;
  }

  function duplicateKey() {
    const st=state(), key=keyAt(st.frame,st);
    if (!key || st.preview) return;
    const destination=nextFreeFrame(st.frame,keysFor(st));
    if (destination == null) { core.setHint('All 16 sample slots already contain keys.'); return; }
    core.editSparseClip('Duplicate key pose',clip=>{
      clip.keys.push({frame:destination,name:`${key.name} copy`.slice(0,48),pose:clone(key.pose)});
      markAuthored(clip);
    });
    core.setFrame(destination);
  }

  function deleteKey() {
    const st=state(), key=keyAt(st.frame,st);
    if (!key || st.preview) return;
    if (keysFor(st).length <= 2) { core.setHint('A cyclic clip needs at least two key poses.'); return; }
    core.editSparseClip('Delete key pose',clip=>{
      clip.keys=clip.keys.filter(k=>k.frame!==st.frame);
      markAuthored(clip);
    });
  }

  function copyKey() {
    const st=state(), key=keyAt(st.frame,st);
    if (!key) return;
    clipboard={family:st.family,name:key.name,pose:clone(key.pose)};
    core.setHint(`Copied key: ${key.name}`);
    render(state());
  }

  function pasteKey() {
    const st=state();
    if (!clipboard || clipboard.family!==st.family || st.preview) return;
    const existing=keyAt(st.frame,st);
    if (existing && !window.confirm(`Replace key at frame ${st.frame+1}?`)) return;
    core.editSparseClip(existing?'Paste over key pose':'Paste key pose',clip=>{
      const next={frame:st.frame,name:String(clipboard.name||`Key ${st.frame+1}`).slice(0,48),pose:clone(clipboard.pose)};
      const index=clip.keys.findIndex(k=>k.frame===st.frame);
      if(index>=0)clip.keys[index]=next;else clip.keys.push(next);
      markAuthored(clip);
    });
  }

  function moveKey(delta) {
    const st=state(), key=keyAt(st.frame,st);
    if (!key || st.preview) return;
    const sourceFrame=st.frame;
    const destination=(sourceFrame+delta+16)%16;
    if (keyAt(destination,st)) { core.setHint(`Frame ${destination+1} already has a key.`); return; }
    core.editSparseClip('Move key pose',clip=>{
      const target=clip.keys.find(k=>k.frame===sourceFrame);
      if(target){
        if(st.family==='fox') {
          const sourcePhase=sourceFrame/16;
          const destinationPhase=destination/16;
          for(const prefix of ['fn','ff','rn','rf']){
            const phaseKey=`${prefix}PlantPhase`;
            const authored=Number(target.pose?.[phaseKey]);
            if(target.pose?.[`${prefix}Planted`] && Number.isFinite(authored) && Math.abs(authored-sourcePhase)<1e-6){
              target.pose[phaseKey]=destinationPhase;
            }
          }
        }
        target.frame=destination;
      }
      markAuthored(clip);
    });
    core.setFrame(destination);
  }

  function mirrorCurrentKey() {
    const st=state(), key=keyAt(st.frame,st);
    if (!key || st.preview) return;
    core.editSparseClip('Mirror key pose',clip=>{
      const target=clip.keys.find(k=>k.frame===st.frame);
      if(!target)return;
      target.pose=mirrorPose(target.pose,st.family);
      target.name=mirrorName(target.name,st.family);
      target.pose.name=target.name;
      markAuthored(clip);
    });
  }

  function mirrorClip() {
    const st=state();
    if (st.preview) return;
    core.editSparseClip('Mirror entire clip',clip=>{
      for(const key of clip.keys){
        key.pose=mirrorPose(key.pose,st.family);
        key.name=mirrorName(key.name,st.family);
        key.pose.name=key.name;
      }
      markAuthored(clip);
    });
  }

  function shiftFoxPlantPhases(pose, deltaFrames) {
    if (!pose || state().family !== 'fox') return;
    const delta=deltaFrames/16;
    for (const prefix of ['fn','ff','rn','rf']) {
      const key=`${prefix}PlantPhase`;
      if (!Number.isFinite(Number(pose[key]))) continue;
      pose[key]=((Number(pose[key])+delta)%1+1)%1;
    }
  }

  function foxClipHasContact(st=state()) {
    if (st.family !== 'fox') return false;
    return keysFor(st).some(key=>['fn','ff','rn','rf'].some(prefix=>(Number(key.pose?.[`${prefix}IkWeight`])||0)>.0001 || !!key.pose?.[`${prefix}Planted`]));
  }

  function phaseShift(delta,label) {
    const st=state();
    if (st.preview) return;
    core.editSparseClip(label,clip=>{
      for(const key of clip.keys) {
        key.frame=(key.frame+delta+16)%16;
        if (st.family==='fox') shiftFoxPlantPhases(key.pose,delta);
      }
      markAuthored(clip);
    });
    core.setFrame((st.frame+delta+16)%16);
  }

  function makeEightKeyCandidate(st=state()) {
    const frames=core.getCompiledFrames();
    const existing=new Map(keysFor(st).map(k=>[k.frame,k]));
    const keys=[];
    for(let frame=0;frame<16;frame+=2){
      const pose=clone(frames[frame]);
      const named=existing.get(frame)?.name;
      const fallback=st.family==='fox' && /^Walk$|^Run$/i.test(String(pose.name||'')) ? `Phase ${frame/2+1}` : (pose.name||`Key ${frame+1}`);
      const name=String(named||fallback).slice(0,48);
      pose.name=name;
      keys.push({frame,name,pose});
    }
    return {...clone(st.sparseClip),source:'sparse-conversion-preview',keys};
  }

  function measureFrames(a,b,family) {
    const schema=CHANNELS[family]||{linear:[],angular:[],discrete:[]};
    let linear=0,angular=0,discrete=0;
    for(let i=0;i<16;i++){
      for(const key of schema.linear) linear=Math.max(linear,Math.abs((Number(a[i]?.[key])||0)-(Number(b[i]?.[key])||0)));
      for(const key of schema.angular) angular=Math.max(angular,Math.abs((Number(a[i]?.[key])||0)-(Number(b[i]?.[key])||0)));
      for(const key of schema.discrete) if((a[i]?.[key]??null)!==(b[i]?.[key]??null))discrete++;
    }
    return {linear,angularDeg:angular/DEG,discrete};
  }

  function formatError(error) {
    const parts=[`max linear ${error.linear.toFixed(4)}`,`max angle ${error.angularDeg.toFixed(2)}°`];
    if(error.discrete)parts.push(`${error.discrete} contact-label changes`);
    return parts.join(' · ');
  }

  function previewEightKeys() {
    const st=state();
    if(st.mode!=='animate')return;
    const source=core.getCompiledFrames();
    const candidate=makeEightKeyCandidate(st);
    const compiled=core.compileSparseClip(candidate);
    const error=measureFrames(source,compiled,st.family);
    lastPreviewReport=`8-key preview · ${formatError(error)}`;
    core.setConversionPreview(candidate,'8-key sparse conversion');
    render(state());
  }

  function adoptPreview() {
    if(!state().preview)return;
    core.adoptConversionPreview('Adopt 8-key sparse conversion');
    lastPreviewReport='8-key conversion adopted into the working copy. Save is still required.';
    render(state());
  }

  function exitPreview() {
    if(!state().preview)return;
    core.clearConversionPreview();
    lastPreviewReport='Preview closed · authored key track unchanged.';
    render(state());
  }

  function legacyImportReport(st) {
    if(st.sparseClip?.source!=='legacy-sampled')return null;
    const legacy=core.getLegacySamples();
    const compiled=core.getCompiledFrames();
    const error=measureFrames(legacy,compiled,st.family);
    if(error.linear<1e-9 && error.angularDeg<1e-7 && error.discrete===0)return 'Legacy 16-sample import is exact.';
    return `Legacy import check · ${formatError(error)}`;
  }

  function render(st=state()) {
    const animate=st.mode==='animate';
    section.hidden=!animate;
    trackHost.hidden=!animate;
    if(!animate)return;

    if(st.family!==lastFamily || st.clip!==lastClip){
      lastFamily=st.family;lastClip=st.clip;lastPreviewReport='';
    }

    const keys=keysFor(st), key=keyAt(st.frame,st), preview=!!st.preview;
    const keyMap=new Map(keys.map(k=>[k.frame,k]));
    for(const button of frameButtons){
      const frame=Number(button.dataset.frame), marker=keyMap.get(frame), current=frame===st.frame;
      button.classList.toggle('has-key',!!marker);
      button.classList.toggle('current',current);
      button.classList.toggle('previewing',preview);
      button.setAttribute('aria-pressed',String(current));
      button.setAttribute('aria-label',marker?`Frame ${frame+1}, key ${marker.name}`:`Frame ${frame+1}, tweened`);
      button.title=marker?marker.name:'Tweened in-between';
    }

    const legacy=legacyImportReport(st);
    summary.textContent=preview
      ? `${st.preview.label} · authored ${keys.length} keys remain untouched.`
      : legacy || `${keys.length} authored keys compile to the existing 16-sample runtime shape.`;

    if(key){
      status.textContent=`Frame ${st.frame+1} · KEY · ${key.name}`;
      if(document.activeElement!==nameInput)nameInput.value=key.name;
    }else{
      const n=neighbours(st.frame,keys);
      status.textContent=`Frame ${st.frame+1} · TWEEN · ${n.before?.name||'—'} → ${n.after?.name||'—'}`;
      if(document.activeElement!==nameInput)nameInput.value='';
    }

    nameInput.disabled=!key||preview;
    renameBtn.disabled=!key||preview;
    addBtn.disabled=!!key||preview;
    duplicateBtn.disabled=!key||preview||keys.length>=16;
    deleteBtn.disabled=!key||preview||keys.length<=2;
    copyBtn.disabled=!key;
    pasteBtn.disabled=!clipboard||clipboard.family!==st.family||preview;
    mirrorBtn.disabled=!key||preview;
    leftBtn.disabled=!key||preview||!!keyAt((st.frame+15)%16,st);
    rightBtn.disabled=!key||preview||!!keyAt((st.frame+1)%16,st);
    phaseLeftBtn.disabled=preview;
    phaseRightBtn.disabled=preview;
    phaseHalfBtn.disabled=preview;
    mirrorClipBtn.disabled=preview;

    const hasContact=foxClipHasContact(st);
    convertCount.textContent=`${keys.length} keys`;
    convertCopy.textContent=lastPreviewReport || (preview
      ? 'Preview is view-only. Scrub or Play it, then Adopt or Exit.'
      : hasContact
        ? 'Sparse conversion is disabled while this Fox clip contains authored IK/contact data so plant ranges are not flattened accidentally.'
        : 'Preview an 8-key reduction before adopting it. Preview never changes authored data.');
    previewBtn.disabled=preview||hasContact;
    adoptBtn.disabled=!preview;
    exitBtn.disabled=!preview;
  }

  renameBtn.addEventListener('click',()=>setKeyName(state().frame,nameInput.value));
  nameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setKeyName(state().frame,nameInput.value);nameInput.blur();}});
  addBtn.addEventListener('click',addTweenKey);
  duplicateBtn.addEventListener('click',duplicateKey);
  deleteBtn.addEventListener('click',deleteKey);
  copyBtn.addEventListener('click',copyKey);
  pasteBtn.addEventListener('click',pasteKey);
  mirrorBtn.addEventListener('click',mirrorCurrentKey);
  leftBtn.addEventListener('click',()=>moveKey(-1));
  rightBtn.addEventListener('click',()=>moveKey(1));
  phaseLeftBtn.addEventListener('click',()=>phaseShift(-1,'Phase shift clip −1'));
  phaseRightBtn.addEventListener('click',()=>phaseShift(1,'Phase shift clip +1'));
  phaseHalfBtn.addEventListener('click',()=>phaseShift(8,'Half-cycle phase shift'));
  mirrorClipBtn.addEventListener('click',mirrorClip);
  previewBtn.addEventListener('click',previewEightKeys);
  adoptBtn.addEventListener('click',adoptPreview);
  exitBtn.addEventListener('click',exitPreview);

  core.subscribe(st=>render(st));
  render(state());
})();
