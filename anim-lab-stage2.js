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
      {id:'body',label:'Body / Root',group:'Core',point:'hip',move:{y:{key:'bodyBob',min:-.055,max:.070,sign:1}}},
      {id:'bodyTilt',label:'Body Tilt',group:'Core',point:'shoulder',rotate:{key:'bodyPitch',min:-28*DEG,max:28*DEG}},
      {id:'head',label:'Head / Neck',group:'Core',point:'head',rotate:{key:'headPitch',min:-35*DEG,max:35*DEG}},
      {id:'fnUpper',label:'Front Near Upper',group:'Front Near',point:'frontNearRoot',pair:'ffUpper',rotate:{key:'fnUpper',min:-80*DEG,max:80*DEG}},
      {id:'fnLower',label:'Front Near Lower',group:'Front Near',point:'frontNearKnee',pair:'ffLower',rotate:{key:'fnLower',min:-80*DEG,max:80*DEG}},
      {id:'ffUpper',label:'Front Far Upper',group:'Front Far',point:'frontFarRoot',pair:'fnUpper',rotate:{key:'ffUpper',min:-80*DEG,max:80*DEG}},
      {id:'ffLower',label:'Front Far Lower',group:'Front Far',point:'frontFarKnee',pair:'fnLower',rotate:{key:'ffLower',min:-80*DEG,max:80*DEG}},
      {id:'rnUpper',label:'Rear Near Upper',group:'Rear Near',point:'rearNearRoot',pair:'rfUpper',rotate:{key:'rnUpper',min:-80*DEG,max:80*DEG}},
      {id:'rnLower',label:'Rear Near Lower',group:'Rear Near',point:'rearNearKnee',pair:'rfLower',rotate:{key:'rnLower',min:-80*DEG,max:80*DEG}},
      {id:'rfUpper',label:'Rear Far Upper',group:'Rear Far',point:'rearFarRoot',pair:'rnUpper',rotate:{key:'rfUpper',min:-80*DEG,max:80*DEG}},
      {id:'rfLower',label:'Rear Far Lower',group:'Rear Far',point:'rearFarKnee',pair:'rnLower',rotate:{key:'rfLower',min:-80*DEG,max:80*DEG}},
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
      <div class="animlab-section-title" id="animlab-stage2-view-title">Reference</div>
      <div class="animlab-view-grid animlab-stage2-view-grid">
        <button type="button" id="animlab-ground">Ground / Ruler</button>
        <button type="button" id="animlab-reference">Hero 1 Ref</button>
      </div>
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
        <div class="animlab-precision-pad" id="animlab-precision-pad" role="application" aria-label="Precision drag surface">
          <i class="animlab-pad-x"></i><i class="animlab-pad-y"></i>
          <span>Drag anywhere</span>
        </div>
      </div>
    </section>

    <section class="animlab-section animlab-setup-section" id="animlab-setup-section" hidden aria-labelledby="animlab-setup-title">
      <div class="animlab-section-title" id="animlab-setup-title">Character Setup</div>
      <div class="animlab-setup-note" id="animlab-setup-note"></div>
      <label class="animlab-slider"><span>Scale</span><input type="range" data-setup="scale" min="0.55" max="2.25" step="0.01"><output></output></label>
      <label class="animlab-slider"><span>Collider X</span><input type="range" data-collider="offsetX" min="-0.18" max="0.18" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Radius</span><input type="range" data-collider="radius" min="0.07" max="0.32" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Height</span><input type="range" data-collider="height" min="0.25" max="1.15" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Bottom</span><input type="range" data-collider="bottom" min="-0.08" max="0.18" step="0.005"><output></output></label>
      <label class="animlab-slider"><span>Foot Probe</span><input type="range" data-collider="footProbe" min="0.035" max="0.30" step="0.005"><output></output></label>
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
  const pad = $('animlab-precision-pad');
  const groundBtn = $('animlab-ground');
  const referenceBtn = $('animlab-reference');
  const setupNote = $('animlab-setup-note');
  const axisButtons = [...host.querySelectorAll('[data-axis]')];
  const sliders = [...host.querySelectorAll('.animlab-slider input')];

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

  function buildBoard(state) {
    ensureSelection(state);
    const controls = controlsFor(state);
    const groups = [];
    for (const control of controls) if (!groups.includes(control.group)) groups.push(control.group);
    board.innerHTML = '';
    for (const group of groups) {
      const wrap=document.createElement('div');wrap.className='animlab-control-group';
      const title=document.createElement('div');title.className='animlab-control-group-title';title.textContent=group;wrap.appendChild(title);
      const cells=document.createElement('div');cells.className='animlab-control-cells';
      for (const control of controls.filter(c=>c.group===group)) {
        const button=document.createElement('button');button.type='button';button.dataset.control=control.id;button.textContent=control.label;
        button.classList.toggle('active',control.id===selectedId);button.setAttribute('aria-pressed',String(control.id===selectedId));
        button.addEventListener('click',()=>{selectedId=control.id;ensureSelection(core.getState());render(core.getState(),false);core.redraw();});
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
    return bits.join(' · ') || 'No editable channel.';
  }

  function renderSetup(state) {
    setupNote.textContent = state.family === 'human'
      ? `${state.character.label} scale is per-character and now drives gameplay size after Save. Saving the human collider still affects both Hero 1 and Hero 2 at runtime.`
      : 'Fox scale is per-character and now drives gameplay size after Save. The fox collider keeps its own runtime storage and scales with the character.';
    for (const input of sliders) {
      let value;
      if (input.dataset.setup === 'scale') value=state.setup.scale;
      else value=state.setup.collider[input.dataset.collider];
      if (document.activeElement !== input) input.value=String(value);
      const output=input.parentElement.querySelector('output'); if(output) output.textContent=Number(value).toFixed(input.dataset.setup==='scale'?2:3);
    }
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
    groundBtn.classList.toggle('active',core.getOverlay('ground'));groundBtn.setAttribute('aria-pressed',String(core.getOverlay('ground')));
    referenceBtn.classList.toggle('active',core.getOverlay('reference'));referenceBtn.setAttribute('aria-pressed',String(core.getOverlay('reference')));
    if (state.mode === 'animate') {
      selectedLabel.textContent=control?.label || 'Select a control';
      channelReadout.textContent=formatChannels(control,state.pose);
      precision.hidden=!control;
      moveBtn.disabled=!control?.move;rotateBtn.disabled=!control?.rotate;
      moveBtn.classList.toggle('active',precisionMode==='move');rotateBtn.classList.toggle('active',precisionMode==='rotate');
      fineBtn.classList.toggle('active',fine);fineBtn.setAttribute('aria-pressed',String(fine));
      axisButtons.forEach(btn=>{btn.classList.toggle('active',axis===btn.dataset.axis);btn.disabled=precisionMode==='rotate';btn.setAttribute('aria-pressed',String(axis===btn.dataset.axis));});
      if (control?.pair) {
        const pair=controlsFor(state).find(c=>c.id===control.pair);pairBtn.hidden=!pair;pairBtn.textContent=pair?`Pair: ${pair.label}`:'Pair';pairBtn.dataset.pair=pair?.id||'';
      } else pairBtn.hidden=true;
    } else {
      renderSetup(state);
    }

    if (lastMode !== state.mode) {
      lastMode=state.mode;
      if (state.mode==='setup') {
        if (!core.getOverlay('collider')) core.setOverlay('collider',true);
        if (!core.getOverlay('ground')) core.setOverlay('ground',true);
        if (!core.getOverlay('reference')) core.setOverlay('reference',true);
      }
    }
    // Character-family switches can force a different valid control. The core
    // draw that triggered this render used the previous selection, so request
    // one follow-up draw only when the selected control actually changed.
    if (selectionChanged) requestAnimationFrame(()=>core.redraw());
  }

  function applyPrecision(control, pose, dx, dy) {
    const moveSensitivity=fine ? .00033 : .00105;
    const rotateSensitivity=(fine ? .10 : .34)*DEG;
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
    precisionTx=core.beginTransaction('pose',`Adjust ${control.label}`);precisionStart={x:e.clientX,y:e.clientY,control};
    pad.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  pad.addEventListener('pointermove',e=>{
    if(!precisionTx||!precisionStart)return;
    const dx=e.clientX-precisionStart.x,dy=e.clientY-precisionStart.y,control=precisionStart.control;
    core.previewTransaction(precisionTx,pose=>applyPrecision(control,pose,dx,dy));e.preventDefault();
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
  pairBtn.addEventListener('click',()=>{if(pairBtn.dataset.pair){selectedId=pairBtn.dataset.pair;ensureSelection(core.getState());render(core.getState(),false);core.redraw();}});
  resetBtn.addEventListener('click',()=>{
    const state=core.getState(),control=selectedControl(state),defaults=core.getDefaultPose();if(!control)return;
    core.edit('pose',`Reset ${control.label}`,pose=>{
      if(control.move?.x)pose[control.move.x.key]=defaults[control.move.x.key];
      if(control.move?.y)pose[control.move.y.key]=defaults[control.move.y.key];
      if(control.rotate)pose[control.rotate.key]=defaults[control.rotate.key];
    });
  });

  groundBtn.addEventListener('click',()=>core.setOverlay('ground',!core.getOverlay('ground')));
  referenceBtn.addEventListener('click',()=>core.setOverlay('reference',!core.getOverlay('reference')));

  function sliderScope(input){return input.dataset.setup==='scale'?'scale':input.dataset.collider;}
  function beginSlider(input){
    if(sliderTx.has(input))return sliderTx.get(input);
    const tx=core.beginTransaction('setup',`Adjust ${sliderScope(input)}`);sliderTx.set(input,tx);return tx;
  }
  function previewSlider(input){
    const tx=beginSlider(input),value=Number(input.value);
    core.previewTransaction(tx,setup=>{
      if(input.dataset.setup==='scale')setup.scale=value;
      else setup.collider[input.dataset.collider]=value;
    });
  }
  function finishSlider(input,cancel=false){
    const tx=sliderTx.get(input);if(!tx)return;
    if(cancel)core.cancelTransaction(tx);else core.commitTransaction(tx);sliderTx.delete(input);
  }
  sliders.forEach(input=>{
    input.addEventListener('pointerdown',()=>beginSlider(input));
    input.addEventListener('input',()=>previewSlider(input));
    // Native iOS range controls may finish a drag with pointercancel even when
    // the thumb/value change is intentional. Treat every native slider end as
    // a commit; true cancel/restore semantics remain reserved for the custom
    // precision pad where we own the entire gesture.
    input.addEventListener('pointerup',()=>finishSlider(input,false));
    input.addEventListener('change',()=>finishSlider(input,false));
    input.addEventListener('blur',()=>finishSlider(input,false));
    input.addEventListener('pointercancel',()=>finishSlider(input,false));
  });

  core.setPluginRenderer(({ctx,pose,adapter,view,project})=>{
    const family=adapter.id;
    const control=(CONTROL_SETS[family]||[]).find(c=>c.id===selectedId);
    if(!control || currentMode!=='animate')return;
    const point=adapter.rig.geometry(pose)?.[control.point];if(!point)return;
    const p=project(point,view);ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,Math.max(8,view.scale*.028),0,Math.PI*2);ctx.fillStyle='rgba(111,143,137,.25)';ctx.fill();ctx.strokeStyle='#5f817b';ctx.lineWidth=Math.max(2,view.scale*.006);ctx.stroke();ctx.restore();
  });

  core.subscribe(state=>render(state,false));
  core.setOverlay('ground',true);
  core.setOverlay('reference',true);
  render(core.getState(),true);
})();
