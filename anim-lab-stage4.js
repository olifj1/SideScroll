(() => {
  'use strict';

  const core = window.AnimLabCore;
  const controls = window.AnimLabControlSurface;
  const FoxRig = window.GameHubFoxRig || null;
  const host = document.getElementById('animlab-extension');
  if (!core || !host) {
    console.error('[Anim Lab Stage 4] AnimLabCore or extension host is missing.');
    return;
  }

  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const clone = value => JSON.parse(JSON.stringify(value));
  const BASE_GAMEPLAY_SCALE = 2.31;
  const PREF_KEY = 'sidescroll.animlab.ik-view.v2';
  const LIMBS = Object.freeze({
    fn:{label:'Front Near',paw:'frontNearPaw',fk:'frontNearFkPaw',target:'frontNearIkTarget',side:'near'},
    ff:{label:'Front Far',paw:'frontFarPaw',fk:'frontFarFkPaw',target:'frontFarIkTarget',side:'far'},
    rn:{label:'Rear Near',paw:'rearNearPaw',fk:'rearNearFkPaw',target:'rearNearIkTarget',side:'near'},
    rf:{label:'Rear Far',paw:'rearFarPaw',fk:'rearFarFkPaw',target:'rearFarIkTarget',side:'far'}
  });

  let prefs = {showGround:true,speed:1};
  try {
    const saved=JSON.parse(localStorage.getItem(PREF_KEY)||'null');
    if(saved&&typeof saved==='object') prefs={showGround:saved.showGround!==false,speed:clamp(Number(saved.speed)||1,.5,1.5)};
  } catch (_) {}

  const ikSection=document.createElement('section');
  ikSection.className='animlab-section animlab-contact-section';
  ikSection.setAttribute('aria-labelledby','animlab-contact-title');
  ikSection.innerHTML=`
    <div class="animlab-section-title" id="animlab-contact-title">Paw IK</div>
    <p class="animlab-contact-note">Quadruped legs use persistent paw targets. Select a Paw Target in the Control Board, then move it with the viewport drag pad. Body motion does not carry the target with it, and there is no Plant / Release switch to key.</p>
    <div class="animlab-contact-status" id="animlab-contact-status">Select a Paw Target in the Control Board.</div>
    <div class="animlab-contact-actions animlab-contact-actions-simple">
      <button id="animlab-contact-capture" type="button">Capture Current Paw</button>
      <button id="animlab-contact-ground" type="button">Target to Ground</button>
      <button id="animlab-contact-example" class="animlab-contact-example" type="button">Reload Example Walk</button>
    </div>
  `;

  const groundSection=document.createElement('section');
  groundSection.className='animlab-section animlab-ground-motion-section';
  groundSection.setAttribute('aria-labelledby','animlab-ground-motion-title');
  groundSection.innerHTML=`
    <div class="animlab-section-title" id="animlab-ground-motion-title">Ground Motion</div>
    <p class="animlab-contact-note">Editor-only moving datum for spotting paw slip. At ×1 it represents the current quadruped gameplay stride. During stance, animate the paw target backwards with the ground; during swing, move it forwards and up.</p>
    <div class="animlab-segmented animlab-two">
      <button id="animlab-ground-motion-show" type="button">Moving Ground</button>
      <button id="animlab-ground-motion-reset" type="button">Speed ×1</button>
    </div>
    <label class="animlab-slider"><span>Ground speed</span><input id="animlab-ground-motion-speed" type="range" min="0.5" max="1.5" step="0.05" value="1"><output>×1.00</output></label>
    <div class="animlab-contact-status" id="animlab-ground-motion-status">Walk stride reference</div>
  `;

  const controlSection=host.querySelector('.animlab-control-section');
  if(controlSection){
    controlSection.insertAdjacentElement('afterend',ikSection);
    ikSection.insertAdjacentElement('afterend',groundSection);
  } else {
    host.appendChild(ikSection);host.appendChild(groundSection);
  }

  const $=id=>document.getElementById(id);
  const status=$('animlab-contact-status');
  const captureBtn=$('animlab-contact-capture');
  const groundBtn=$('animlab-contact-ground');
  const exampleBtn=$('animlab-contact-example');
  const groundShow=$('animlab-ground-motion-show');
  const groundReset=$('animlab-ground-motion-reset');
  const groundSpeed=$('animlab-ground-motion-speed');
  const groundSpeedOut=groundSpeed.parentElement.querySelector('output');
  const groundStatus=$('animlab-ground-motion-status');

  function state(){ return core.getState(); }
  function currentAuthoringPose(){ return core.getAuthoringPose ? core.getAuthoringPose() : state().pose; }
  function selectedPrefix(){
    const control=controls?.getSelectedControl?.();
    return control?.ikPrefix && LIMBS[control.ikPrefix] ? control.ikPrefix : null;
  }
  function persistPrefs(){
    try { localStorage.setItem(PREF_KEY,JSON.stringify(prefs)); } catch (_) {}
  }
  function strideLocal(st=state()){
    if(st.family!=='fox')return 0;
    const world=st.clip==='run' ? Number(st.rig?.RUN_STRIDE_WORLD)||0 : st.clip==='walk' ? Number(st.rig?.WALK_STRIDE_WORLD)||0 : 0;
    return world/Math.max(.001,BASE_GAMEPLAY_SCALE*(Number(st.setup?.scale)||1));
  }
  function geometryFor(pose,st=state()){
    return st.rig?.geometry?.(pose,st.setup?.rig);
  }

  function captureCurrentPaw(){
    const st=state(),prefix=selectedPrefix();
    if(st.family!=='fox'||st.mode!=='animate'||st.preview||!prefix)return;
    const limb=LIMBS[prefix];
    core.edit('pose',`Capture ${limb.label} paw target`,pose=>{
      // Force a clean FK read if this is an older pose that has never used IK.
      const probe=clone(pose);probe[`${prefix}IkWeight`]=0;
      const point=geometryFor(probe,st)?.[limb.paw];if(!point)return;
      pose[`${prefix}IkX`]=point.x;pose[`${prefix}IkY`]=point.y;
      pose[`${prefix}IkWeight`]=1;pose[`${prefix}Planted`]=false;pose[`${prefix}PlantPhase`]=0;
    });
  }

  function targetToGround(){
    const st=state(),prefix=selectedPrefix();
    if(st.family!=='fox'||st.mode!=='animate'||st.preview||!prefix)return;
    const limb=LIMBS[prefix];
    core.edit('pose',`${limb.label} paw target to ground`,pose=>{
      if((Number(pose[`${prefix}IkWeight`])||0)<=.0001){
        const probe=clone(pose);probe[`${prefix}IkWeight`]=0;
        const point=geometryFor(probe,st)?.[limb.paw];
        if(point) pose[`${prefix}IkX`]=point.x;
      }
      const groundY=st.clip==='jump' ? -(Number(core.getJumpAuthoringLift?.(st.phase))||0) : 0;
      pose[`${prefix}IkY`]=groundY;pose[`${prefix}IkWeight`]=1;
      pose[`${prefix}Planted`]=false;pose[`${prefix}PlantPhase`]=0;
    });
  }

  function reloadExampleWalk(){
    const st=state();
    if(st.family!=='fox'||st.mode!=='animate'||st.clip!=='walk'||st.preview||!FoxRig)return;
    const keys=typeof FoxRig.buildExampleWalkKeys==='function'
      ? FoxRig.buildExampleWalkKeys(st.setup?.rig,strideLocal(st))
      : clone(FoxRig.WALK_EXAMPLE_KEYS||[]);
    if(!Array.isArray(keys)||keys.length<2)return;
    const changed=core.editSparseClip?.('Reload example walk',clip=>{
      clip.source='fox-example-walk';
      clip.foundationVersion=FoxRig.WALK_EXAMPLE_ID||'fox-walk-example-v3';
      clip.keys=clone(keys);
    });
    if(changed!==false){
      core.setFrame?.(0);
      core.setHint?.('Example Walk loaded · all four legs use persistent IK paw targets · Save to make it the authored gameplay Walk.');
    }
  }

  captureBtn.addEventListener('click',captureCurrentPaw);
  groundBtn.addEventListener('click',targetToGround);
  exampleBtn.addEventListener('click',reloadExampleWalk);
  groundShow.addEventListener('click',()=>{prefs.showGround=!prefs.showGround;persistPrefs();render(state());core.redrawOnly?.();});
  groundReset.addEventListener('click',()=>{prefs.speed=1;groundSpeed.value='1';persistPrefs();render(state());core.redrawOnly?.();});
  groundSpeed.addEventListener('input',()=>{prefs.speed=clamp(Number(groundSpeed.value)||1,.5,1.5);persistPrefs();render(state());core.redrawOnly?.();});

  function drawMovingGround({ctx,canvas,adapter,view,project,phase}){
    const st=state();
    if(st.family!=='fox'||st.mode!=='animate'||adapter.id!=='fox')return;
    const base=project({x:0,y:0},view);
    if(st.clip==='jump'){
      if(!core.getOverlay?.('ground'))return;
      // Jump keeps the moving local Y=0 datum as a quiet reference only. The
      // bright fixed Ground / Ruler is the real floor and remains unchanged.
      ctx.save();
      ctx.strokeStyle='rgba(126,216,199,.18)';
      ctx.lineWidth=Math.max(1,view.scale*.0012);
      ctx.setLineDash([5,7]);
      ctx.beginPath();ctx.moveTo(0,base.y);ctx.lineTo(canvas.width,base.y);ctx.stroke();
      ctx.restore();
      return;
    }
    if(!prefs.showGround)return;
    const stride=strideLocal(st)*prefs.speed;
    const spacing=Math.max(.045,stride?stride/4:.07);
    const offset=(phase*stride)%spacing;
    ctx.save();
    ctx.globalAlpha=.85;
    ctx.fillStyle='rgba(73,102,99,.10)';
    ctx.fillRect(0,base.y,canvas.width,Math.max(8,canvas.height-base.y));
    ctx.strokeStyle='rgba(126,216,199,.34)';ctx.lineWidth=Math.max(1,view.scale*.002);
    ctx.beginPath();ctx.moveTo(0,base.y);ctx.lineTo(canvas.width,base.y);ctx.stroke();
    const minX=-canvas.width/view.scale*.7,maxX=canvas.width/view.scale*.7;
    for(let x=Math.floor((minX+offset)/spacing)*spacing-offset;x<=maxX;x+=spacing){
      const p=project({x,y:0},view),major=Math.abs(Math.round((x+offset)/spacing)%4)===0;
      const h=major?14:8;
      ctx.strokeStyle=major?'rgba(126,216,199,.38)':'rgba(238,243,241,.16)';
      ctx.beginPath();ctx.moveTo(p.x,base.y+2);ctx.lineTo(p.x-5,base.y+h);ctx.stroke();
    }
    ctx.restore();
  }

  function drawIkTargets({ctx,pose,adapter,view,project,restRig}){
    if(adapter.id!=='fox'||state().mode!=='animate')return;
    const g=adapter.rig.geometry(pose,restRig),activePrefix=selectedPrefix();
    ctx.save();
    for(const [prefix,limb] of Object.entries(LIMBS)){
      const w=clamp(Number(pose[`${prefix}IkWeight`])||0,0,1);if(w<=.001)continue;
      const target=g?.[limb.target];if(!target)continue;
      const t=project(target,view),active=prefix===activePrefix;
      const far=limb.side==='far';
      ctx.strokeStyle=active
        ? (far?'rgba(218,224,225,.98)':'rgba(126,216,199,.98)')
        : (far?'rgba(190,199,201,.62)':'rgba(126,216,199,.52)');
      ctx.lineWidth=active?2.4:1.5;
      ctx.beginPath();ctx.arc(t.x,t.y,active?8:6,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(t.x-4,t.y);ctx.lineTo(t.x+4,t.y);ctx.moveTo(t.x,t.y-4);ctx.lineTo(t.x,t.y+4);ctx.stroke();
    }
    ctx.restore();
  }

  core.registerUnderlayRenderer?.('fox-ground-motion',drawMovingGround);
  core.registerPluginRenderer?.('fox-paw-ik',drawIkTargets);

  function render(st=state()){
    const visible=st.family==='fox'&&st.mode==='animate';
    const locomotion=visible&&(st.clip==='walk'||st.clip==='run');
    ikSection.hidden=!visible;
    groundSection.hidden=!locomotion;
    if(!visible)return;

    const prefix=selectedPrefix(),key=st.sparseClip?.keys?.find(item=>item.frame===st.frame)||null;
    if(prefix){
      const author=currentAuthoringPose(),active=(Number(author?.[`${prefix}IkWeight`])||0)>.001;
      status.textContent=`${LIMBS[prefix].label} Paw Target · ${key?'KEY':'TWEEN'} · ${active?'IK active':'move/capture to activate'}`;
    } else {
      status.textContent='Select a Paw Target in the Control Board. The same right-thumb drag pad moves it.';
    }
    captureBtn.disabled=!!st.preview||!prefix;groundBtn.disabled=!!st.preview||!prefix;
    exampleBtn.hidden=st.clip!=='walk';exampleBtn.disabled=!!st.preview||st.clip!=='walk';

    groundShow.classList.toggle('active',prefs.showGround);groundShow.setAttribute('aria-pressed',String(prefs.showGround));
    groundSpeed.value=String(prefs.speed);groundSpeedOut.textContent=`×${prefs.speed.toFixed(2)}`;
    const stride=strideLocal(st);
    groundStatus.textContent=`${st.clip==='run'?'Run':'Walk'} · ${stride.toFixed(3)} rig units/cycle at Scale ${Number(st.setup?.scale||1).toFixed(2)} · display ×${prefs.speed.toFixed(2)}`;
  }

  core.subscribe(st=>render(st));
  render(state());
})();
