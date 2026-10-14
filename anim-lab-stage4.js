(() => {
  'use strict';

  const core = window.AnimLabCore;
  const controls = window.AnimLabControlSurface;
  const host = document.getElementById('animlab-extension');
  if (!core || !host) {
    console.error('[Anim Lab Stage 4] AnimLabCore or extension host is missing.');
    return;
  }

  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const clone = value => JSON.parse(JSON.stringify(value));
  const BASE_GAMEPLAY_SCALE = 2.31;
  const PREF_KEY = 'sidescroll.animlab.contact-view.v1';
  const LIMBS = Object.freeze({
    fn:{label:'Front Near',control:'fnIk',paw:'frontNearPaw',fk:'frontNearFkPaw',target:'frontNearIkTarget',pair:'ff'},
    ff:{label:'Front Far',control:'ffIk',paw:'frontFarPaw',fk:'frontFarFkPaw',target:'frontFarIkTarget',pair:'fn'},
    rn:{label:'Rear Near',control:'rnIk',paw:'rearNearPaw',fk:'rearNearFkPaw',target:'rearNearIkTarget',pair:'rf'},
    rf:{label:'Rear Far',control:'rfIk',paw:'rearFarPaw',fk:'rearFarFkPaw',target:'rearFarIkTarget',pair:'rn'}
  });

  let selectedPrefix = 'fn';
  let weightTx = null;
  let prefs = {showGround:true,speed:1};
  try {
    const saved=JSON.parse(localStorage.getItem(PREF_KEY)||'null');
    if(saved&&typeof saved==='object') prefs={showGround:saved.showGround!==false,speed:clamp(Number(saved.speed)||1,.5,1.5)};
  } catch (_) {}

  const ikSection=document.createElement('section');
  ikSection.className='animlab-section animlab-contact-section';
  ikSection.setAttribute('aria-labelledby','animlab-contact-title');
  ikSection.innerHTML=`
    <div class="animlab-section-title" id="animlab-contact-title">Paw Contact / IK</div>
    <p class="animlab-contact-note">Select a paw target, pose it with the viewport drag pad, then Plant it across stance keys. FK remains underneath and IK can be blended per key.</p>
    <div class="animlab-segmented animlab-four animlab-contact-limbs" id="animlab-contact-limbs">
      <button type="button" data-contact-limb="fn">Front N</button>
      <button type="button" data-contact-limb="ff">Front F</button>
      <button type="button" data-contact-limb="rn">Rear N</button>
      <button type="button" data-contact-limb="rf">Rear F</button>
    </div>
    <div class="animlab-contact-status" id="animlab-contact-status">Front Near · FK</div>
    <label class="animlab-slider animlab-contact-weight"><span>FK / IK blend</span><input id="animlab-contact-weight" type="range" min="0" max="1" step="0.05" value="0"><output>0%</output></label>
    <div class="animlab-contact-actions">
      <button id="animlab-contact-capture" type="button">Capture FK → IK</button>
      <button id="animlab-contact-ground" type="button">Target to Ground</button>
      <button id="animlab-contact-plant" type="button">Plant from Here</button>
      <button id="animlab-contact-release" type="button">Release Here</button>
    </div>
  `;

  const groundSection=document.createElement('section');
  groundSection.className='animlab-section animlab-ground-motion-section';
  groundSection.setAttribute('aria-labelledby','animlab-ground-motion-title');
  groundSection.innerHTML=`
    <div class="animlab-section-title" id="animlab-ground-motion-title">Ground Motion</div>
    <p class="animlab-contact-note">Editor-only moving datum for spotting paw slip. At ×1 it represents the current Fox gameplay stride; scrub or Play the main timeline to move it.</p>
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
  const limbButtons=[...ikSection.querySelectorAll('[data-contact-limb]')];
  const status=$('animlab-contact-status');
  const weight=$('animlab-contact-weight');
  const weightOut=weight.parentElement.querySelector('output');
  const captureBtn=$('animlab-contact-capture');
  const groundBtn=$('animlab-contact-ground');
  const plantBtn=$('animlab-contact-plant');
  const releaseBtn=$('animlab-contact-release');
  const groundShow=$('animlab-ground-motion-show');
  const groundReset=$('animlab-ground-motion-reset');
  const groundSpeed=$('animlab-ground-motion-speed');
  const groundSpeedOut=groundSpeed.parentElement.querySelector('output');
  const groundStatus=$('animlab-ground-motion-status');

  function state(){ return core.getState(); }
  function selected(){ return LIMBS[selectedPrefix]; }
  function currentKey(st=state()){ return st.sparseClip?.keys?.find(key=>key.frame===st.frame)||null; }
  function currentAuthoringPose(){ return core.getAuthoringPose ? core.getAuthoringPose() : state().pose; }
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
  function limbPoint(pose,property,st=state()){
    return geometryFor(pose,st)?.[selected()?.[property]]||null;
  }
  function previousKey(st=state()){
    const keys=[...(st.sparseClip?.keys||[])].sort((a,b)=>a.frame-b.frame);
    if(!keys.length)return null;
    const before=keys.filter(key=>key.frame<st.frame);
    return before.length?before[before.length-1]:keys[keys.length-1];
  }

  function selectLimb(prefix){
    if(!LIMBS[prefix])return;
    selectedPrefix=prefix;
    controls?.selectControl?.(LIMBS[prefix].control);
    render(state());
    core.redrawOnly?.();
  }

  function captureFk(){
    const st=state();if(st.family!=='fox'||st.mode!=='animate'||st.preview)return;
    const prefix=selectedPrefix;
    core.edit('pose',`Capture ${selected().label} FK to IK`,pose=>{
      const fkPose=clone(pose);fkPose[`${prefix}IkWeight`]=0;fkPose[`${prefix}Planted`]=false;
      const g=geometryFor(fkPose,st),point=g?.[selected().paw];if(!point)return;
      pose[`${prefix}IkX`]=point.x;pose[`${prefix}IkY`]=point.y;pose[`${prefix}IkWeight`]=1;pose[`${prefix}Planted`]=false;pose[`${prefix}PlantPhase`]=st.frame/16;
    });
  }

  function targetToGround(){
    const st=state();if(st.family!=='fox'||st.mode!=='animate'||st.preview)return;
    const prefix=selectedPrefix;
    core.edit('pose',`${selected().label} IK to ground`,pose=>{
      if((Number(pose[`${prefix}IkWeight`])||0)<=.0001){
        const fkPose=clone(pose);fkPose[`${prefix}IkWeight`]=0;fkPose[`${prefix}Planted`]=false;
        const point=geometryFor(fkPose,st)?.[selected().paw];if(point)pose[`${prefix}IkX`]=point.x;
        pose[`${prefix}IkWeight`]=1;
      }
      pose[`${prefix}IkY`]=0;pose[`${prefix}Planted`]=false;pose[`${prefix}PlantPhase`]=st.frame/16;
    });
  }

  function plantFromHere(){
    const st=state();if(st.family!=='fox'||st.mode!=='animate'||st.preview)return;
    const prefix=selectedPrefix,prev=previousKey(st);
    core.edit('pose',`Plant ${selected().label}`,pose=>{
      if(prev?.pose?.[`${prefix}Planted`]){
        pose[`${prefix}IkX`]=Number(prev.pose[`${prefix}IkX`])||0;
        pose[`${prefix}IkY`]=Number(prev.pose[`${prefix}IkY`])||0;
        pose[`${prefix}PlantPhase`]=Number(prev.pose[`${prefix}PlantPhase`])||0;
      } else {
        const display=st.pose;
        const point=geometryFor(display,st)?.[selected().paw] || limbPoint(pose,'paw',st);
        if(point){pose[`${prefix}IkX`]=point.x;pose[`${prefix}IkY`]=point.y;}
        pose[`${prefix}PlantPhase`]=st.frame/16;
      }
      pose[`${prefix}IkWeight`]=Math.max(.001,Number(pose[`${prefix}IkWeight`])||1);
      pose[`${prefix}Planted`]=true;
    });
  }

  function releaseHere(){
    const st=state();if(st.family!=='fox'||st.mode!=='animate'||st.preview)return;
    const prefix=selectedPrefix;
    core.edit('pose',`Release ${selected().label}`,pose=>{
      pose[`${prefix}Planted`]=false;pose[`${prefix}IkWeight`]=0;pose[`${prefix}PlantPhase`]=st.frame/16;
    });
  }

  function beginWeight(){
    if(weightTx)return weightTx;
    const st=state();if(st.family!=='fox'||st.mode!=='animate'||st.preview)return null;
    weightTx=core.beginTransaction('pose',`Adjust ${selected().label} IK blend`);return weightTx;
  }
  function previewWeight(){
    const tx=beginWeight();if(!tx)return;
    const prefix=selectedPrefix,value=clamp(Number(weight.value)||0,0,1);
    core.previewTransaction(tx,pose=>{pose[`${prefix}IkWeight`]=value;});
  }
  function finishWeight(cancel=false){
    if(!weightTx)return;
    if(cancel)core.cancelTransaction(weightTx);else{previewWeight();core.commitTransaction(weightTx);}
    weightTx=null;
  }

  limbButtons.forEach(button=>button.addEventListener('click',()=>selectLimb(button.dataset.contactLimb)));
  captureBtn.addEventListener('click',captureFk);
  groundBtn.addEventListener('click',targetToGround);
  plantBtn.addEventListener('click',plantFromHere);
  releaseBtn.addEventListener('click',releaseHere);
  weight.addEventListener('pointerdown',beginWeight);
  weight.addEventListener('input',previewWeight);
  weight.addEventListener('pointerup',()=>finishWeight(false));
  weight.addEventListener('change',()=>finishWeight(false));
  weight.addEventListener('blur',()=>finishWeight(false));
  weight.addEventListener('pointercancel',()=>finishWeight(true));

  groundShow.addEventListener('click',()=>{prefs.showGround=!prefs.showGround;persistPrefs();render(state());core.redrawOnly?.();});
  groundReset.addEventListener('click',()=>{prefs.speed=1;groundSpeed.value='1';persistPrefs();render(state());core.redrawOnly?.();});
  groundSpeed.addEventListener('input',()=>{prefs.speed=clamp(Number(groundSpeed.value)||1,.5,1.5);persistPrefs();render(state());core.redrawOnly?.();});

  function drawMovingGround({ctx,canvas,adapter,view,project,phase}){
    const st=state();
    if(!prefs.showGround||st.family!=='fox'||st.mode!=='animate'||adapter.id!=='fox')return;
    const stride=strideLocal(st)*prefs.speed;
    const base=project({x:0,y:0},view);
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
    const g=adapter.rig.geometry(pose,restRig);
    ctx.save();
    for(const [prefix,limb] of Object.entries(LIMBS)){
      const w=clamp(Number(pose[`${prefix}IkWeight`])||0,0,1);if(w<=.001)continue;
      const target=g?.[limb.target],paw=g?.[limb.paw];if(!target||!paw)continue;
      const t=project(target,view),p=project(paw,view),active=prefix===selectedPrefix;
      ctx.strokeStyle=active?'rgba(126,216,199,.95)':'rgba(143,207,197,.52)';ctx.lineWidth=active?2.4:1.5;
      ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(t.x,t.y,active?8:6,0,Math.PI*2);ctx.stroke();
      if(currentAuthoringPose()?.[`${prefix}Planted`]){
        ctx.fillStyle='rgba(126,216,199,.85)';ctx.fillRect(t.x-3,t.y-12,6,5);
      }
    }
    ctx.restore();
  }

  core.registerUnderlayRenderer?.('fox-ground-motion',drawMovingGround);
  core.registerPluginRenderer?.('fox-paw-contact',drawIkTargets);

  function render(st=state()){
    const visible=st.family==='fox'&&st.mode==='animate';
    ikSection.hidden=!visible;groundSection.hidden=!visible;
    if(!visible)return;

    const selectedControl=controls?.getSelectedControl?.();
    if(selectedControl?.ikPrefix&&LIMBS[selectedControl.ikPrefix]) selectedPrefix=selectedControl.ikPrefix;
    const author=currentAuthoringPose(),prefix=selectedPrefix,key=currentKey(st);
    const w=clamp(Number(author?.[`${prefix}IkWeight`])||0,0,1),planted=!!author?.[`${prefix}Planted`];
    limbButtons.forEach(button=>{const active=button.dataset.contactLimb===prefix;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    if(document.activeElement!==weight)weight.value=String(w);
    weightOut.textContent=`${Math.round(w*100)}%`;
    const keyText=key?'KEY':'TWEEN';
    status.textContent=`${selected().label} · ${keyText} · ${planted?'PLANTED':w>.001?'IK':'FK'}${planted?' · anchor '+(Number(author?.[`${prefix}PlantPhase`])||0).toFixed(3):''}`;
    plantBtn.classList.toggle('active',planted);releaseBtn.disabled=!planted&&w<=.001;
    captureBtn.disabled=!!st.preview;groundBtn.disabled=!!st.preview;plantBtn.disabled=!!st.preview;weight.disabled=!!st.preview;

    groundShow.classList.toggle('active',prefs.showGround);groundShow.setAttribute('aria-pressed',String(prefs.showGround));
    groundSpeed.value=String(prefs.speed);groundSpeedOut.textContent=`×${prefs.speed.toFixed(2)}`;
    const stride=strideLocal(st);
    groundStatus.textContent=st.clip==='jump'?'Jump has no locomotion ground stride; the datum remains static.':`${st.clip==='run'?'Run':'Walk'} · ${stride.toFixed(3)} rig units/cycle at Scale ${Number(st.setup?.scale||1).toFixed(2)} · display ×${prefs.speed.toFixed(2)}`;
  }

  core.subscribe(st=>render(st));
  render(state());
})();
