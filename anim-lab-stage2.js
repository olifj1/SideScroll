(() => {
  'use strict';

  const core = window.AnimLabCore;
  const host = document.getElementById('animlab-extension');
  if (!core || !host) {
    console.error('[Anim Lab Stage 2] AnimLabCore or extension host is missing.');
    return;
  }

  const DEG = Math.PI / 180;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const CONTROL_SETS = {
    human: [
      {id:'root',label:'Body / Root',group:'Core',point:'pelvis',move:{y:{key:'pelvisY',min:.40,max:.60,sign:1}},pair:null},
      {id:'chest',label:'Chest / Lean',group:'Core',point:'chest',rotate:{key:'lean',min:-25*DEG,max:25*DEG}},
      {id:'nearFoot',label:'Near Foot',group:'Near Side',point:'aAnkle',pair:'farFoot',move:{x:{key:'aFootX',min:-.45,max:.45,sign:1},y:{key:'aFootLift',min:0,max:.28,sign:1}},rotate:{key:'aFootAngle',min:-50*DEG,max:50*DEG}},
      {id:'nearHand',label:'Near Hand',group:'Near Side',point:'aW',pair:'farHand',move:{x:{key:'aHandX',min:-.34,max:.34,sign:1},y:{key:'aHandY',min:.18,max:.58,sign:-1}}},
      {id:'farFoot',label:'Far Foot',group:'Far Side',point:'bAnkle',pair:'nearFoot',move:{x:{key:'bFootX',min:-.45,max:.45,sign:1},y:{key:'bFootLift',min:0,max:.28,sign:1}},rotate:{key:'bFootAngle',min:-50*DEG,max:50*DEG}},
      {id:'farHand',label:'Far Hand',group:'Far Side',point:'bW',pair:'nearHand',move:{x:{key:'bHandX',min:-.34,max:.34,sign:1},y:{key:'bHandY',min:.18,max:.58,sign:-1}}},
      {id:'hairBase',label:'Hair Base',group:'Secondary',point:'hairRoot',rotate:{key:'hairAngle',min:65*DEG,max:155*DEG}},
      {id:'hairTip',label:'Hair Bend',group:'Secondary',point:'hairTip',rotate:{key:'hairBend',min:-65*DEG,max:65*DEG}}
    ],
    fox: [
      {id:'midRoot',label:'Mid Root',group:'Core',point:'midRoot',move:{y:{key:'bodyBob',min:-.055,max:.070,sign:1}}},
      {id:'frontBody',label:'Front Body',group:'Core',point:'frontBody',move:{y:{key:'frontBodyLift',min:-.100,max:.120,sign:1}}},
      {id:'rearBody',label:'Rear Body',group:'Core',point:'rearBody',move:{y:{key:'rearBodyLift',min:-.100,max:.120,sign:1}}},
      {id:'bodyTilt',label:'Whole Body Tilt',group:'Core',point:'frontBody',rotate:{key:'bodyPitch',min:-28*DEG,max:28*DEG}},
      {id:'neck',label:'Neck',group:'Core',point:'neck',rotate:{key:'neckPitch',min:-70*DEG,max:55*DEG}},
      {id:'head',label:'Head',group:'Core',point:'head',rotate:{key:'headPitch',min:-55*DEG,max:55*DEG}},
      {id:'fnIk',label:'Paw Target',group:'Front Near',side:'near',point:'frontNearIkTarget',capturePoint:'frontNearPaw',pair:'ffIk',ikPrefix:'fn',move:{x:{key:'fnIkX',min:-.60,max:.60,sign:1},y:{key:'fnIkY',min:-.16,max:.62,sign:1}}},
      {id:'fnDistal',label:'Wrist Angle',group:'Front Near',side:'near',point:'frontNearWrist',pair:'ffDistal',rotate:{key:'fnDistal',min:-80*DEG,max:80*DEG}},
      {id:'ffIk',label:'Paw Target',group:'Front Far',side:'far',point:'frontFarIkTarget',capturePoint:'frontFarPaw',pair:'fnIk',ikPrefix:'ff',move:{x:{key:'ffIkX',min:-.60,max:.60,sign:1},y:{key:'ffIkY',min:-.16,max:.62,sign:1}}},
      {id:'ffDistal',label:'Wrist Angle',group:'Front Far',side:'far',point:'frontFarWrist',pair:'fnDistal',rotate:{key:'ffDistal',min:-80*DEG,max:80*DEG}},
      {id:'rnIk',label:'Paw Target',group:'Rear Near',side:'near',point:'rearNearIkTarget',capturePoint:'rearNearPaw',pair:'rfIk',ikPrefix:'rn',move:{x:{key:'rnIkX',min:-.60,max:.60,sign:1},y:{key:'rnIkY',min:-.16,max:.62,sign:1}}},
      {id:'rnDistal',label:'Hock Angle',group:'Rear Near',side:'near',point:'rearNearHock',pair:'rfDistal',rotate:{key:'rnDistal',min:-95*DEG,max:95*DEG}},
      {id:'rfIk',label:'Paw Target',group:'Rear Far',side:'far',point:'rearFarIkTarget',capturePoint:'rearFarPaw',pair:'rnIk',ikPrefix:'rf',move:{x:{key:'rfIkX',min:-.60,max:.60,sign:1},y:{key:'rfIkY',min:-.16,max:.62,sign:1}}},
      {id:'rfDistal',label:'Hock Angle',group:'Rear Far',side:'far',point:'rearFarHock',pair:'rnDistal',rotate:{key:'rfDistal',min:-95*DEG,max:95*DEG}},
      {id:'tailBase',label:'Tail Base',group:'Tail',point:'tail0',rotate:{key:'tailBase',min:-70*DEG,max:70*DEG}},
      {id:'tailMid',label:'Tail Mid',group:'Tail',point:'tail1',rotate:{key:'tailMid',min:-70*DEG,max:70*DEG}},
      {id:'tailTip',label:'Tail Tip',group:'Tail',point:'tail2',rotate:{key:'tailTip',min:-70*DEG,max:70*DEG}}
    ]
  };

  let selectedId = null;
  let precisionMode = 'move';
  let fine = false;
  let axis = 'free';
  let precisionTx = null;
  let precisionStart = null;
  let lastMode = null;
  let lastFamily = null;
  let currentMode = 'animate';
  const sliderTx = new Map();

  host.innerHTML = `
    <section class="animlab-section animlab-stage2-view" aria-labelledby="animlab-stage2-view-title">
      <div class="animlab-section-title" id="animlab-stage2-view-title">Viewport</div>
      <div class="animlab-view-grid animlab-stage2-view-grid">
        <button type="button" id="animlab-ground">Ground / Ruler</button>
      </div>
    </section>

    <section class="animlab-section animlab-static-reference" id="animlab-static-reference-section" aria-labelledby="animlab-static-reference-title">
      <div class="animlab-section-title" id="animlab-static-reference-title">Static Reference</div>
      <div class="animlab-reference-note">Single-image proportion reference · editor-only and never dirties the rig or animation.</div>
      <div class="animlab-segmented animlab-three" id="animlab-static-reference-sources">
        <button type="button" data-static-reference="original">Hero 1</button>
        <button type="button" data-static-reference="alternate">Hero 2 / Hair</button>
        <button type="button" data-static-reference="foxShape">Fox Shape</button>
      </div>
      <div class="animlab-view-grid animlab-stage2-view-grid">
        <button type="button" id="animlab-reference">Show Reference</button>
      </div>
      <label class="animlab-slider animlab-static-reference-slider"><span>Opacity</span><input id="animlab-static-reference-opacity" type="range" min="0.05" max="1" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-static-reference-slider"><span>Scale</span><input id="animlab-static-reference-scale" type="range" min="0.35" max="2.50" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-static-reference-slider"><span>Horizontal</span><input id="animlab-static-reference-x" type="range" min="-1.50" max="1.50" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-static-reference-slider"><span>Vertical</span><input id="animlab-static-reference-y" type="range" min="-0.75" max="1.00" step="0.01"><output></output></label>
    </section>

    <section class="animlab-section animlab-control-section" id="animlab-control-section" aria-labelledby="animlab-control-title">
      <div class="animlab-section-title" id="animlab-control-title">Control Board</div>
      <div class="animlab-control-board" id="animlab-control-board"></div>
      <div class="animlab-control-details" id="animlab-control-details">
        <div class="animlab-control-details-head">
          <strong id="animlab-selected-label">Select a control</strong>
          <button type="button" id="animlab-pair" hidden>Pair</button>
        </div>
        <div class="animlab-channel-readout" id="animlab-channel-readout">Large labelled controls replace tiny viewport picking.</div>
      </div>
      <div class="animlab-precision" id="animlab-precision" hidden>
        <div class="animlab-precision-tools">
          <div class="animlab-segmented animlab-two">
            <button type="button" id="animlab-precision-move">Move</button>
            <button type="button" id="animlab-precision-rotate">Rotate</button>
          </div>
          <div class="animlab-segmented animlab-three">
            <button type="button" data-axis="free">Free</button>
            <button type="button" data-axis="x">X</button>
            <button type="button" data-axis="y">Y</button>
          </div>
          <div class="animlab-segmented animlab-two">
            <button type="button" id="animlab-fine">Fine</button>
            <button type="button" id="animlab-reset-control">Reset</button>
          </div>
        </div>
      </div>
    </section>

    <section class="animlab-section animlab-setup-section" id="animlab-setup-section" hidden aria-labelledby="animlab-setup-title">
      <div class="animlab-section-title" id="animlab-setup-title">Character Rig / Setup</div>
      <div class="animlab-setup-note" id="animlab-setup-note"></div>
      <label class="animlab-slider"><span>Scale</span><input type="range" data-setup="scale" min="0.55" max="2.25" step="0.01"><output></output></label>
      <label class="animlab-slider"><span>Collider X</span><input type="range" data-collider="offsetX" min="-0.18" max="0.18" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Radius</span><input type="range" data-collider="radius" min="0.07" max="0.32" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Height</span><input type="range" data-collider="height" min="0.25" max="1.15" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Bottom</span><input type="range" data-collider="bottom" min="-0.08" max="0.18" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Foot Probe</span><input type="range" data-collider="footProbe" min="0.035" max="0.30" step="0.005"><output></output></label>
    </section>

    <section class="animlab-section animlab-fox-handoff" id="animlab-fox-handoff" hidden aria-labelledby="animlab-fox-handoff-title">
      <div class="animlab-section-title" id="animlab-fox-handoff-title">Fox Handoff</div>
      <div class="animlab-setup-note">Exports the current Fox rest rig, scale/collider, sparse Walk/Run/Jump keys and compiled 16-sample runtime clips as one JSON file.</div>
      <div class="animlab-view-grid">
        <button type="button" id="animlab-export-fox">Export / Share Rig + Animations</button>
      </div>
    </section>
  `;

  const $ = id => document.getElementById(id);
  const board = $('animlab-control-board');
  const controlSection = $('animlab-control-section');
  const setupSection = $('animlab-setup-section');
  const selectedLabel = $('animlab-selected-label');
  const channelReadout = $('animlab-channel-readout');
  const pairBtn = $('animlab-pair');
  const precision = $('animlab-precision');
  const moveBtn = $('animlab-precision-move');
  const rotateBtn = $('animlab-precision-rotate');
  const fineBtn = $('animlab-fine');
  const resetBtn = $('animlab-reset-control');
  const viewportPadHost = document.getElementById('animlab-viewport-pad-host');
  const pad = document.createElement('div');
  pad.className = 'animlab-precision-pad animlab-viewport-precision-pad';
  pad.id = 'animlab-precision-pad';
  pad.setAttribute('role','application');
  pad.setAttribute('aria-label','Precision drag surface');
  pad.innerHTML = '<i class="animlab-pad-x"></i><i class="animlab-pad-y"></i><span>Drag anywhere</span>';
  if (viewportPadHost) viewportPadHost.appendChild(pad);
  const groundBtn = $('animlab-ground');
  const referenceBtn = $('animlab-reference');
  const setupNote = $('animlab-setup-note');
  const foxHandoffSection = $('animlab-fox-handoff');
  const exportFoxBtn = $('animlab-export-fox');
  const staticReferenceButtons = [...host.querySelectorAll('[data-static-reference]')];
  const staticRefOpacity = $('animlab-static-reference-opacity');
  const staticRefScale = $('animlab-static-reference-scale');
  const staticRefX = $('animlab-static-reference-x');
  const staticRefY = $('animlab-static-reference-y');
  const staticRefInputs = [staticRefOpacity,staticRefScale,staticRefX,staticRefY];
  const axisButtons = [...host.querySelectorAll('[data-axis]')];
  const sliders = [...setupSection.querySelectorAll('.animlab-slider input')];

  function controlsFor(state = core.getState()) { return CONTROL_SETS[state.family] || []; }
  function selectedControl(state = core.getState()) { return controlsFor(state).find(c => c.id === selectedId) || null; }

  function ensureSelection(state) {
    const controls = controlsFor(state);
    if (!controls.some(c => c.id === selectedId)) selectedId = controls[0]?.id || null;
    const control = selectedControl(state);
    if (!control) return;
    if (precisionMode === 'move' && !control.move) precisionMode = 'rotate';
    if (precisionMode === 'rotate' && !control.rotate) precisionMode = 'move';
    if (control.move?.y && !control.move?.x && axis === 'x') axis = 'y';
    if (control.move?.x && !control.move?.y && axis === 'y') axis = 'x';
  }

  function selectControl(id, redraw = true) {
    const state=core.getState();
    if (!(CONTROL_SETS[state.family]||[]).some(control=>control.id===id)) return false;
    selectedId=id;
    ensureSelection(state);
    render(state,false);
    if (redraw) core.redraw();
    return true;
  }

  function buildBoard(state) {
    ensureSelection(state);
    const controls = controlsFor(state);
    const groups = [];
    for (const control of controls) if (!groups.includes(control.group)) groups.push(control.group);
    board.innerHTML = '';
    for (const group of groups) {
      const wrap=document.createElement('div');wrap.className='animlab-control-group';
      if (/Near$/.test(group)) wrap.classList.add('animlab-side-near');
      if (/Far$/.test(group)) wrap.classList.add('animlab-side-far');
      const title=document.createElement('div');title.className='animlab-control-group-title';title.textContent=group;wrap.appendChild(title);
      const cells=document.createElement('div');cells.className='animlab-control-cells';
      for (const control of controls.filter(c=>c.group===group)) {
        const button=document.createElement('button');button.type='button';button.dataset.control=control.id;button.textContent=control.label;
        if(control.side) button.classList.add(`animlab-side-${control.side}`);
        button.classList.toggle('active',control.id===selectedId);button.setAttribute('aria-pressed',String(control.id===selectedId));
        button.addEventListener('click',()=>selectControl(control.id,true));
        cells.appendChild(button);
      }
      wrap.appendChild(cells);board.appendChild(wrap);
    }
  }

  function formatChannels(control, pose) {
    if (!control) return 'Select a control.';
    const bits=[];
    if (control.move?.x) bits.push(`X ${Number(pose[control.move.x.key]||0).toFixed(3)}`);
    if (control.move?.y) bits.push(`Y ${Number(pose[control.move.y.key]||0).toFixed(3)}`);
    if (control.rotate) bits.push(`Angle ${(Number(pose[control.rotate.key]||0)/DEG).toFixed(1)}°`);
    if (control.ikPrefix) bits.push('Persistent IK target');
    return bits.join(' · ') || 'No editable channel.';
  }

  function renderSetup(state) {
    setupNote.textContent = state.family === 'human'
      ? `${state.character.label} scale is per-character and now drives gameplay size after Save. Saving the human collider still affects both Hero 1 and Hero 2 at runtime.`
      : 'Fox scale, collider and structural rest rig remain a working copy until Save. Use Rig Designer below for anatomy/proportions.';
    for (const input of sliders) {
      let value;
      if (input.dataset.setup === 'scale') value=state.setup.scale;
      else value=state.setup.collider[input.dataset.collider];
      if (document.activeElement !== input) input.value=String(value);
      const output=input.parentElement.querySelector('output'); if(output) output.textContent=Number(value).toFixed(input.dataset.setup==='scale'?2:3);
    }
  }

  function setStaticRefSlider(input,value,digits=2,suffix='') {
    if (document.activeElement !== input) input.value=String(value);
    const output=input.parentElement.querySelector('output');
    if(output) output.textContent=`${Number(value).toFixed(digits)}${suffix}`;
  }

  function renderStaticReference() {
    const settings=core.getStaticReference?.() || {source:'original',opacity:.24,scale:1,offsetX:0,offsetY:0};
    staticReferenceButtons.forEach(button=>{
      const active=button.dataset.staticReference===settings.source;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    const shown=core.getOverlay('reference');
    referenceBtn.classList.toggle('active',shown);
    referenceBtn.setAttribute('aria-pressed',String(shown));
    referenceBtn.textContent=shown?'Reference Shown':'Show Reference';
    setStaticRefSlider(staticRefOpacity,settings.opacity,2);
    setStaticRefSlider(staticRefScale,settings.scale,2);
    setStaticRefSlider(staticRefX,settings.offsetX,2,' m');
    setStaticRefSlider(staticRefY,settings.offsetY,2,' m');
  }

  function render(state = core.getState(), rebuild = false) {
    const selectedBefore = selectedId;
    ensureSelection(state);
    const selectionChanged = selectedBefore !== selectedId;
    currentMode = state.mode;
    if (rebuild || state.family !== lastFamily) { buildBoard(state); lastFamily = state.family; }
    board.querySelectorAll('[data-control]').forEach(btn=>{const active=btn.dataset.control===selectedId;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    const control=selectedControl(state);
    controlSection.hidden=state.mode!=='animate';
    setupSection.hidden=state.mode!=='setup';
    foxHandoffSection.hidden=state.family!=='fox';
    groundBtn.classList.toggle('active',core.getOverlay('ground'));groundBtn.setAttribute('aria-pressed',String(core.getOverlay('ground')));
    renderStaticReference();
    if (state.mode === 'animate') {
      selectedLabel.textContent=control?.label || 'Select a control';
      channelReadout.textContent=formatChannels(control,state.pose);
      precision.hidden=!control;
      if (viewportPadHost) viewportPadHost.hidden=!control;
      pad.hidden=!control;
      moveBtn.disabled=!control?.move;rotateBtn.disabled=!control?.rotate;
      moveBtn.classList.toggle('active',precisionMode==='move');rotateBtn.classList.toggle('active',precisionMode==='rotate');
      fineBtn.classList.toggle('active',fine);fineBtn.setAttribute('aria-pressed',String(fine));
      axisButtons.forEach(btn=>{btn.classList.toggle('active',axis===btn.dataset.axis);btn.disabled=precisionMode==='rotate';btn.setAttribute('aria-pressed',String(axis===btn.dataset.axis));});
      if (control?.pair) {
        const pair=controlsFor(state).find(c=>c.id===control.pair);pairBtn.hidden=!pair;pairBtn.textContent=pair?`Pair: ${pair.label}`:'Pair';pairBtn.dataset.pair=pair?.id||'';
      } else pairBtn.hidden=true;
    } else {
      precision.hidden=true;
      if (viewportPadHost) viewportPadHost.hidden=true;
      pad.hidden=true;
      renderSetup(state);
    }

    if (lastMode !== state.mode) {
      lastMode=state.mode;
      if (state.mode==='setup') {
        if (!core.getOverlay('collider')) core.setOverlay('collider',true);
        if (!core.getOverlay('ground')) core.setOverlay('ground',true);
        // Static Reference is an editor-only proportion guide. Each rig family
        // remembers its own source/alignment; entering Rig makes it visible so
        // the author can immediately match anatomy without affecting data.
        if (!core.getOverlay('reference')) core.setOverlay('reference',true);
      }
    }
    // Character-family switches can force a different valid control. The core
    // draw that triggered this render used the previous selection, so request
    // one follow-up draw only when the selected control actually changed.
    if (selectionChanged) requestAnimationFrame(()=>core.redraw());
  }

  function applyPrecision(control, pose, dx, dy, dragStart = null) {
    const moveSensitivity=fine ? .00033 : .00105;
    const rotateSensitivity=(fine ? .10 : .34)*DEG;
    if (control.ikPrefix) {
      const prefix=control.ikPrefix;
      if (dragStart?.ikCapture) {
        pose[`${prefix}IkX`]=dragStart.ikCapture.x;
        pose[`${prefix}IkY`]=dragStart.ikCapture.y;
      }
      // Paw targets are the normal Fox limb-authoring method. Moving one turns
      // IK on for that pose automatically; authors do not key an FK/IK switch.
      pose[`${prefix}IkWeight`]=1;
      pose[`${prefix}Planted`]=false;
      pose[`${prefix}PlantPhase`]=0;
    }
    if (precisionMode === 'move' && control.move) {
      if (control.move.x && axis!=='y') {
        const ch=control.move.x;pose[ch.key]=clamp(Number(pose[ch.key]||0)+dx*moveSensitivity*(ch.sign||1),ch.min,ch.max);
      }
      if (control.move.y && axis!=='x') {
        const ch=control.move.y;pose[ch.key]=clamp(Number(pose[ch.key]||0)-dy*moveSensitivity*(ch.sign||1),ch.min,ch.max);
      }
    } else if (precisionMode === 'rotate' && control.rotate) {
      const ch=control.rotate;pose[ch.key]=clamp(Number(pose[ch.key]||0)+dx*rotateSensitivity,ch.min,ch.max);
    }
  }

  pad.addEventListener('pointerdown',e=>{
    const state=core.getState(),control=selectedControl(state);if(!control)return;
    let ikCapture=null;
    if(control.ikPrefix && (Number(state.pose?.[`${control.ikPrefix}IkWeight`])||0)<=.0001){
      const g=state.rig?.geometry?.(state.pose,state.setup?.rig);
      const point=g?.[control.capturePoint];
      if(point)ikCapture={x:point.x,y:point.y};
    }
    precisionTx=core.beginTransaction('pose',`Adjust ${control.label}`);precisionStart={x:e.clientX,y:e.clientY,control,ikCapture};
    pad.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  pad.addEventListener('pointermove',e=>{
    if(!precisionTx||!precisionStart)return;
    const dx=e.clientX-precisionStart.x,dy=e.clientY-precisionStart.y,control=precisionStart.control;
    core.previewTransaction(precisionTx,pose=>applyPrecision(control,pose,dx,dy,precisionStart));e.preventDefault();
  });
  function finishPrecision(e,cancel=false){
    if(!precisionTx)return;
    if(cancel)core.cancelTransaction(precisionTx);else core.commitTransaction(precisionTx);
    precisionTx=null;precisionStart=null;e?.preventDefault?.();
  }
  pad.addEventListener('pointerup',e=>finishPrecision(e,false));pad.addEventListener('pointercancel',e=>finishPrecision(e,true));

  moveBtn.addEventListener('click',()=>{if(selectedControl()?.move){precisionMode='move';render(core.getState(),false);}});
  rotateBtn.addEventListener('click',()=>{if(selectedControl()?.rotate){precisionMode='rotate';render(core.getState(),false);}});
  fineBtn.addEventListener('click',()=>{fine=!fine;render(core.getState(),false);});
  axisButtons.forEach(btn=>btn.addEventListener('click',()=>{axis=btn.dataset.axis;render(core.getState(),false);}));
  pairBtn.addEventListener('click',()=>{if(pairBtn.dataset.pair)selectControl(pairBtn.dataset.pair,true);});
  resetBtn.addEventListener('click',()=>{
    const state=core.getState(),control=selectedControl(state),defaults=core.getDefaultPose();if(!control)return;
    core.edit('pose',`Reset ${control.label}`,pose=>{
      if(control.move?.x)pose[control.move.x.key]=defaults[control.move.x.key];
      if(control.move?.y)pose[control.move.y.key]=defaults[control.move.y.key];
      if(control.rotate)pose[control.rotate.key]=defaults[control.rotate.key];
      if(control.ikPrefix){
        const prefix=control.ikPrefix;
        pose[`${prefix}IkWeight`]=1;
        pose[`${prefix}Planted`]=false;
        pose[`${prefix}PlantPhase`]=0;
      }
    });
  });

  groundBtn.addEventListener('click',()=>core.setOverlay('ground',!core.getOverlay('ground')));
  referenceBtn.addEventListener('click',()=>core.setOverlay('reference',!core.getOverlay('reference')));
  staticReferenceButtons.forEach(button=>button.addEventListener('click',()=>{
    core.setStaticReference?.({source:button.dataset.staticReference});
  }));
  const staticRefBindings = [
    [staticRefOpacity,'opacity'],[staticRefScale,'scale'],[staticRefX,'offsetX'],[staticRefY,'offsetY']
  ];
  staticRefBindings.forEach(([input,key])=>input.addEventListener('input',()=>{
    const value=Number(input.value);if(!Number.isFinite(value))return;
    core.setStaticReference?.({[key]:value});
  }));
  exportFoxBtn.addEventListener('click',async()=>{
    exportFoxBtn.disabled=true;
    try { await core.exportFoxHandoffBundle?.(); }
    finally { exportFoxBtn.disabled=false; }
  });

  function sliderScope(input){return input.dataset.setup==='scale'?'scale':input.dataset.collider;}
  function stateSliderValue(input,state=core.getState()){
    return Number(input.dataset.setup==='scale' ? state.setup.scale : state.setup.collider[input.dataset.collider]);
  }
  function beginSlider(input){
    if(sliderTx.has(input))return sliderTx.get(input);
    const tx=core.beginTransaction('setup',`Adjust ${sliderScope(input)}`);sliderTx.set(input,tx);return tx;
  }
  function applySliderDomValue(input,tx=beginSlider(input)){
    const value=Number(input.value);
    if(!tx || !Number.isFinite(value))return tx;
    core.previewTransaction(tx,setup=>{
      if(input.dataset.setup==='scale')setup.scale=value;
      else setup.collider[input.dataset.collider]=value;
    });
    return tx;
  }
  function previewSlider(input){
    applySliderDomValue(input);
  }
  function finishSlider(input,{syncFinal=true}={}){
    let tx=sliderTx.get(input);
    if(syncFinal){
      const domValue=Number(input.value);
      const stateValue=stateSliderValue(input);
      // Safari can visibly move a native range thumb yet omit the intermediate
      // input event. If that happens, the end event itself must import the DOM
      // value into the working Setup copy before the transaction is committed.
      if(!tx && Number.isFinite(domValue) && Number.isFinite(stateValue) && Math.abs(domValue-stateValue)<1e-9)return;
      tx=applySliderDomValue(input,tx||beginSlider(input));
    }
    if(!tx)return;
    core.commitTransaction(tx);
    sliderTx.delete(input);
  }
  sliders.forEach(input=>{
    input.addEventListener('pointerdown',()=>beginSlider(input));
    input.addEventListener('input',()=>previewSlider(input));
    // Do not depend on Safari's native range event order. Every normal end path
    // explicitly syncs the slider's current DOM value before commit.
    input.addEventListener('pointerup',()=>finishSlider(input));
    input.addEventListener('change',()=>finishSlider(input));
    input.addEventListener('blur',()=>finishSlider(input));
    input.addEventListener('pointercancel',()=>finishSlider(input));
  });

  core.setPluginRenderer(({ctx,pose,adapter,view,project})=>{
    const family=adapter.id;
    const control=(CONTROL_SETS[family]||[]).find(c=>c.id===selectedId);
    if(!control || currentMode!=='animate')return;
    const point=adapter.rig.geometry(pose)?.[control.point];if(!point)return;
    const p=project(point,view),side=control.side||'';ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,Math.max(8,view.scale*.028),0,Math.PI*2);
    ctx.fillStyle=side==='far'?'rgba(188,197,199,.18)':side==='near'?'rgba(126,216,199,.22)':'rgba(111,143,137,.25)';ctx.fill();
    ctx.strokeStyle=side==='far'?'rgba(202,210,212,.92)':side==='near'?'rgba(126,216,199,.98)':'#5f817b';ctx.lineWidth=Math.max(2,view.scale*.006);ctx.stroke();ctx.restore();
  });

  window.AnimLabControlSurface = Object.freeze({
    version:'1.0.158',
    getSelectedId:()=>selectedId,
    getSelectedControl:()=>{const control=selectedControl(core.getState());return control?{...control}:null;},
    selectControl:id=>selectControl(id,true)
  });

  core.subscribe(state=>render(state,false));
  core.setOverlay('ground',true);
  // Keep the Hero 1 scale ghost off during normal animation comparison. It is
  // enabled automatically when entering Setup, where it remains useful as a
  // physical scale reference. Motion references use their own underlay layer.
  core.setOverlay('reference',core.getState().mode==='setup');
  render(core.getState(),true);
})();
