(() => {
  'use strict';

  const core = window.AnimLabCore;
  if (!core || typeof core.setPlayFrameProvider !== 'function') return;

  const session = document.querySelector('.animlab-session');
  const viewportPadHost = document.getElementById('animlab-viewport-pad-host');
  if (!session || !viewportPadHost) return;

  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const DRIVE_DEADZONE = 0.08;
  const WALK_POINT = 0.50;
  const BASE_CHARACTER_SCALE = 2.31;
  const JUMP_VELOCITY = 5.24;
  const JUMP_GRAVITY = 9.20;
  const JUMP_DURATION = (JUMP_VELOCITY * 2) / JUMP_GRAVITY;
  const GAIT_RUN_ENTER = 0.18;
  const GAIT_RUN_EXIT = 0.08;
  const GAIT_TRANSITION_SECONDS = 0.17;

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-quickplay-section';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Quick Play</div>
    <div class="animlab-quickplay-status" aria-live="polite">Character motion test</div>
    <label class="animlab-slider animlab-motion-slider">
      <span>Walk Speed</span>
      <input type="range" data-motion-speed="walkSpeed" min="0.45" max="3.25" step="0.05" value="1.15">
      <output>1.15 m/s</output>
    </label>
    <label class="animlab-slider animlab-motion-slider">
      <span>Run Speed</span>
      <input type="range" data-motion-speed="runSpeed" min="1.00" max="5.75" step="0.05" value="2.85">
      <output>2.85 m/s</output>
    </label>
    <div class="animlab-quickplay-actions">
      <button type="button" data-quickplay-reset>Reset Speeds</button>
    </div>
    <p class="animlab-contact-note">The animation cadence stays fixed while these controls change ground travel, so you can visually balance the gait against movement. Save writes movement speeds with the selected character. Biped Idle uses a static neutral preview until an editable Idle clip exists.</p>
  `;
  session.insertAdjacentElement('beforebegin', section);

  const status = section.querySelector('.animlab-quickplay-status');
  const speedInputs = [...section.querySelectorAll('[data-motion-speed]')];
  const resetButton = section.querySelector('[data-quickplay-reset]');

  const pad = document.createElement('div');
  pad.className = 'animlab-quickplay-pad';
  pad.hidden = true;
  pad.innerHTML = `
    <div class="animlab-quickplay-move" role="application" aria-label="Quick Play movement control" tabindex="0">
      <i class="animlab-quickplay-centre"></i>
      <i class="animlab-quickplay-thumb"></i>
      <span>Walk · drag farther to run</span>
    </div>
    <button class="animlab-quickplay-jump" type="button">Jump</button>
  `;
  viewportPadHost.appendChild(pad);
  const movePad = pad.querySelector('.animlab-quickplay-move');
  const moveThumb = pad.querySelector('.animlab-quickplay-thumb');
  const jumpButton = pad.querySelector('.animlab-quickplay-jump');

  const sim = {
    active:false,
    axis:0,
    distance:0,
    locomotionPhase:0,
    gaitMode:'walk',
    gaitPhase:0,
    gaitTransition:null,
    facing:1,
    jumpTime:0,
    jumpVelocity:0,
    jumpY:0,
    jumping:false,
    idlePhase:0,
    lastNow:0,
    actualSpeed:0,
    modeLabel:'Idle',
    family:null,
    profile:null
  };

  let pointerId = null;
  let speedTx = null;
  let speedTxInput = null;
  let lastStatusStamp = 0;

  function state(){ return core.getState(); }
  function activeState(s=state()){ return s.mode === 'play' && !!s.capabilities?.quickPlay; }
  function defaultWalk(s){ return Number(s.capabilities?.defaultSpeeds?.walk) || 1.15; }
  function defaultRun(s){ return Number(s.capabilities?.defaultSpeeds?.run) || 2.85; }
  function clipMs(profile,name){ return Number(profile?.clipMs?.[name]) || (name==='run'?650:1050); }
  // Until Biped Idle is an editable clip, pose the existing rig at a grounded,
  // neutral stance rather than displaying one of its walking contact poses.
  function neutralIdlePose(rig){
    if(!rig?.normalizedPose || !rig?.DEFAULT_FRAMES?.[0])return null;
    return rig.normalizedPose({...rig.DEFAULT_FRAMES[0],
      name:'Idle (neutral fallback)',travel:0,planted:null,
      pelvisY:.507,lean:0,aFootX:-.09,bFootX:.09,
      aFootLift:0,bFootLift:0,aFootAngle:0,bFootAngle:0,
      aHandX:-.12,bHandX:.12,aHandY:.31,bHandY:.31},0);
  }

  function setupSpeeds(s=state()){
    const walk=clamp(Number(s.setup?.walkSpeed)||defaultWalk(s),0.45,3.25);
    const run=clamp(Math.max(Number(s.setup?.runSpeed)||defaultRun(s),walk+.20),1.00,5.75);
    return {walk,run};
  }

  function resetSimulation(){
    sim.axis=0;
    sim.distance=0;
    sim.locomotionPhase=0;
    sim.gaitMode='walk';
    sim.gaitPhase=0;
    sim.gaitTransition=null;
    sim.facing=1;
    sim.jumpTime=0;
    sim.jumpVelocity=0;
    sim.jumpY=0;
    sim.jumping=false;
    sim.idlePhase=0;
    sim.lastNow=0;
    sim.actualSpeed=0;
    sim.modeLabel='Idle';
    renderPadAxis();
  }

  function renderPadAxis(){
    const pct=(sim.axis+1)*50;
    moveThumb.style.left=`${clamp(pct,5,95)}%`;
    movePad.classList.toggle('is-running',Math.abs(sim.axis)>WALK_POINT+.04);
  }

  function updateAxisFromPointer(ev){
    const rect=movePad.getBoundingClientRect();
    if(!rect.width)return;
    sim.axis=clamp(((ev.clientX-rect.left)/rect.width)*2-1,-1,1);
    if(Math.abs(sim.axis)<DRIVE_DEADZONE)sim.axis=0;
    if(sim.axis)sim.facing=Math.sign(sim.axis);
    renderPadAxis();
  }

  movePad.addEventListener('pointerdown',ev=>{
    if(!activeState())return;
    pointerId=ev.pointerId;
    try{movePad.setPointerCapture(ev.pointerId);}catch(_){ }
    updateAxisFromPointer(ev);
    ev.preventDefault();
  });
  movePad.addEventListener('pointermove',ev=>{
    if(pointerId!==ev.pointerId)return;
    updateAxisFromPointer(ev);
    ev.preventDefault();
  });
  function releaseMove(ev){
    if(pointerId!==null&&ev?.pointerId!==undefined&&pointerId!==ev.pointerId)return;
    pointerId=null;
    sim.axis=0;
    renderPadAxis();
    ev?.preventDefault?.();
  }
  movePad.addEventListener('pointerup',releaseMove);
  movePad.addEventListener('pointercancel',releaseMove);
  movePad.addEventListener('lostpointercapture',releaseMove);

  movePad.addEventListener('keydown',ev=>{
    if(!activeState())return;
    if(ev.key==='ArrowLeft'||ev.key==='a'||ev.key==='A'){sim.axis=-1;sim.facing=-1;renderPadAxis();ev.preventDefault();}
    if(ev.key==='ArrowRight'||ev.key==='d'||ev.key==='D'){sim.axis=1;sim.facing=1;renderPadAxis();ev.preventDefault();}
    if(ev.key===' '){triggerJump();ev.preventDefault();}
  });
  movePad.addEventListener('keyup',ev=>{
    if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(ev.key)){sim.axis=0;renderPadAxis();ev.preventDefault();}
  });

  function triggerJump(){
    if(!activeState()||sim.jumping)return;
    sim.jumping=true;
    sim.jumpTime=0;
    sim.jumpVelocity=JUMP_VELOCITY;
    sim.jumpY=0;
  }
  jumpButton.addEventListener('click',triggerJump);

  function beginSpeed(input){
    if(speedTx)return speedTx;
    speedTxInput=input;
    speedTx=core.beginTransaction('setup',`Adjust ${input.dataset.motionSpeed==='walkSpeed'?'walk':'run'} speed`);
    return speedTx;
  }

  function previewSpeed(input){
    const value=Number(input.value);
    if(!Number.isFinite(value))return;
    const tx=beginSpeed(input);
    if(!tx)return;
    core.previewTransaction(tx,setup=>{
      if(input.dataset.motionSpeed==='walkSpeed'){
        setup.walkSpeed=clamp(value,.45,3.25);
        setup.runSpeed=Math.max(Number(setup.runSpeed)||defaultRun(state()),setup.walkSpeed+.20);
      }else{
        setup.runSpeed=clamp(Math.max(value,(Number(setup.walkSpeed)||defaultWalk(state()))+.20),1,5.75);
      }
    });
  }

  function finishSpeed(input){
    if(speedTxInput!==input||!speedTx)return;
    previewSpeed(input);
    const tx=speedTx;
    speedTx=null;
    speedTxInput=null;
    core.commitTransaction(tx);
  }

  speedInputs.forEach(input=>{
    input.addEventListener('pointerdown',()=>beginSpeed(input));
    input.addEventListener('input',()=>previewSpeed(input));
    input.addEventListener('pointerup',()=>finishSpeed(input));
    input.addEventListener('change',()=>finishSpeed(input));
    input.addEventListener('blur',()=>finishSpeed(input));
    input.addEventListener('pointercancel',()=>finishSpeed(input));
  });

  resetButton.addEventListener('click',()=>{
    const s=state();
    core.edit('setup','Reset movement speeds',setup=>{
      setup.walkSpeed=defaultWalk(s);
      setup.runSpeed=defaultRun(s);
    });
  });

  function sampleGait(mode,phase){
    return core.evaluateClip(mode==='run'?'run':'walk',phase,sim.family);
  }
  function gaitHz(rig,mode){
    const ms=clipMs(sim.profile,mode);
    return 1000/Math.max(1,ms);
  }
  function gaitCadenceScale(mode,analogSpeed,speeds){
    const nominal=mode==='run'?speeds.run:speeds.walk;
    return clamp(analogSpeed/Math.max(.001,nominal),0,1.25);
  }
  function beginGaitTransition(rig,toMode){
    if(sim.gaitTransition||toMode===sim.gaitMode)return;
    const fromPose=sampleGait(sim.gaitMode,sim.gaitPhase);
    const targetPhase=typeof rig?.findMatchingLocomotionPhase==='function'
      ? rig.findMatchingLocomotionPhase(fromPose,phase=>sampleGait(toMode,phase),sim.gaitPhase,64)
      : sim.gaitPhase;
    sim.gaitTransition={fromMode:sim.gaitMode,toMode,fromPhase:sim.gaitPhase,toPhase:targetPhase,elapsed:0,duration:GAIT_TRANSITION_SECONDS};
  }
  function updateGait(rig,dt,analogSpeed,targetRun,moving,speeds){
    if(!moving||analogSpeed<=.0001){
      if(targetRun<=GAIT_RUN_EXIT){sim.gaitMode='walk';sim.gaitTransition=null;}
      sim.locomotionPhase=sim.gaitPhase;
      return;
    }
    if(!sim.gaitTransition){
      if(sim.gaitMode==='walk'&&targetRun>=GAIT_RUN_ENTER)beginGaitTransition(rig,'run');
      else if(sim.gaitMode==='run'&&targetRun<=GAIT_RUN_EXIT)beginGaitTransition(rig,'walk');
    }
    if(sim.gaitTransition){
      const tr=sim.gaitTransition;
      tr.fromPhase=(tr.fromPhase+dt*gaitHz(rig,tr.fromMode)*gaitCadenceScale(tr.fromMode,analogSpeed,speeds))%1;
      tr.toPhase=(tr.toPhase+dt*gaitHz(rig,tr.toMode)*gaitCadenceScale(tr.toMode,analogSpeed,speeds))%1;
      tr.elapsed+=dt;
      if(tr.elapsed>=tr.duration){sim.gaitMode=tr.toMode;sim.gaitPhase=tr.toPhase;sim.gaitTransition=null;}
    }else{
      sim.gaitPhase=(sim.gaitPhase+dt*gaitHz(rig,sim.gaitMode)*gaitCadenceScale(sim.gaitMode,analogSpeed,speeds))%1;
    }
    sim.locomotionPhase=sim.gaitTransition
      ?(sim.gaitTransition.elapsed<sim.gaitTransition.duration*.5?sim.gaitTransition.fromPhase:sim.gaitTransition.toPhase)
      :sim.gaitPhase;
  }
  function currentGaitPose(rig){
    const tr=sim.gaitTransition;
    if(!tr)return sampleGait(sim.gaitMode,sim.gaitPhase);
    const a=sampleGait(tr.fromMode,tr.fromPhase),b=sampleGait(tr.toMode,tr.toPhase);
    const t=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1);
    if(typeof rig?.locomotionTransitionPose==='function')return rig.locomotionTransitionPose(a,b,t);
    return a&&b&&typeof rig?.interpolatePose==='function'
      ?rig.interpolatePose(a,b,t,'Locomotion transition',Number(b.travel)||0)
      :(t<.5?a:b);
  }
  function gaitRunMix(){
    const tr=sim.gaitTransition;
    if(!tr)return sim.gaitMode==='run'?1:0;
    const t=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1);
    return tr.fromMode==='run'?(1-t):t;
  }

  function frameProvider({now,setup,rig}){
    if(!sim.active && !activeState())return null;
    const stamp=Number(now)||performance.now();
    const dt=sim.lastNow?Math.min(.05,Math.max(0,(stamp-sim.lastNow)/1000)):0;
    sim.lastNow=stamp;
    const defaults=sim.profile?.defaultSpeeds || {walk:1.15,run:2.85};
    const speeds={
      walk:clamp(Number(setup?.walkSpeed)||defaults.walk,.45,3.25),
      run:clamp(Math.max(Number(setup?.runSpeed)||defaults.run,(Number(setup?.walkSpeed)||defaults.walk)+.20),1,5.75)
    };
    const axisMag=Math.abs(sim.axis);
    const moveDir=axisMag>DRIVE_DEADZONE?Math.sign(sim.axis):0;
    let analogSpeed=0,targetRun=0,effort=0;
    if(moveDir){
      if(axisMag<=WALK_POINT){
        effort=clamp((axisMag-DRIVE_DEADZONE)/Math.max(.001,WALK_POINT-DRIVE_DEADZONE),0,1);
        analogSpeed=speeds.walk*effort;
      }else{
        targetRun=clamp((axisMag-WALK_POINT)/Math.max(.001,1-WALK_POINT),0,1);
        effort=1;
        analogSpeed=lerp(speeds.walk,speeds.run,targetRun);
      }
    }
    if(moveDir&&analogSpeed>0){
      sim.distance+=moveDir*analogSpeed*dt;
      sim.facing=moveDir;
      updateGait(rig,dt,analogSpeed,targetRun,true,speeds);
      sim.modeLabel=gaitRunMix()>.5?'Run':'Walk';
    }else{
      updateGait(rig,dt,0,targetRun,false,speeds);
      sim.modeLabel='Idle';
      sim.idlePhase=(sim.idlePhase+dt/1.4)%1;
    }
    sim.actualSpeed=analogSpeed;

    if(sim.jumping){
      sim.jumpTime+=dt;
      sim.jumpVelocity-=JUMP_GRAVITY*dt;
      sim.jumpY+=sim.jumpVelocity*dt;
      if(sim.jumpTime>=JUMP_DURATION||sim.jumpY<=0&&sim.jumpTime>.12){
        sim.jumping=false;sim.jumpTime=0;sim.jumpVelocity=0;sim.jumpY=0;
      }
    }

    let pose;
    if(sim.jumping){
      pose=core.evaluateClip('jump',clamp(sim.jumpTime/JUMP_DURATION,0,.999),sim.family);
      sim.modeLabel='Jump';
    }else if(moveDir&&analogSpeed>.001){
      pose=currentGaitPose(rig);
    }else{
      pose=core.evaluateClip('idle',sim.idlePhase,sim.family);
      if(!pose && sim.profile?.idleFallback==='neutral-pose') pose=neutralIdlePose(rig);
    }
    if(!pose)pose=rig?.IDLE_POSE||null;

    const localLift=sim.jumpY/Math.max(.001,BASE_CHARACTER_SCALE*(Number(setup?.scale)||1));
    const runMix=gaitRunMix();
    if(stamp-lastStatusStamp>80){lastStatusStamp=stamp;renderStatus(speeds,rig,runMix);}
    return {pose,localLift,facing:sim.facing,distance:sim.distance,actualSpeed:analogSpeed,runBlend:runMix};
  }

  function renderStatus(speeds,rig,runMix=gaitRunMix()){
    const walkMs=clipMs(sim.profile,'walk');
    const runMs=clipMs(sim.profile,'run');
    const cycleMs=lerp(walkMs,runMs,clamp(runMix,0,1));
    const fullSpeed=lerp(speeds.walk,speeds.run,clamp(runMix,0,1));
    const metresPerCycle=fullSpeed*cycleMs/1000;
    status.textContent=`${sim.modeLabel} · ${sim.actualSpeed.toFixed(2)} m/s · ${Math.round(cycleMs)} ms/cycle · ${metresPerCycle.toFixed(2)} m/cycle`;
  }

  function render(s=state()){
    const active=activeState(s);
    if(active&&(!sim.active||sim.family!==s.family)){
      sim.active=true;resetSimulation();sim.family=s.family;sim.profile=s.capabilities;
    }
    if(!active&&sim.active){sim.active=false;releaseMove();sim.lastNow=0;}
    section.hidden=!active;
    pad.hidden=!active;
    if(active)viewportPadHost.hidden=false;
    speedInputs.forEach(input=>{
      if(speedTxInput===input)return;
      const key=input.dataset.motionSpeed;
      const val=Number(s.setup?.[key])||(key==='walkSpeed'?defaultWalk(s):defaultRun(s));
      input.value=String(val);
      input.nextElementSibling.textContent=`${val.toFixed(2)} m/s`;
    });
    if(active)renderStatus(setupSpeeds(s),s.rig,gaitRunMix());
  }

  core.setPlayFrameProvider(frameProvider);
  core.registerUnderlayRenderer('quick-play-ground',({ctx,gridView})=>{
    const s=state();
    if(!activeState(s))return;
    const pxPerWorld=gridView.scale/BASE_CHARACTER_SCALE;
    const start=Math.floor(sim.distance)-8;
    const end=Math.ceil(sim.distance)+8;
    ctx.save();
    ctx.strokeStyle='rgba(222,232,229,.28)';
    ctx.fillStyle='rgba(222,232,229,.48)';
    ctx.lineWidth=Math.max(1,canvasPixelRatio());
    ctx.font=`${Math.max(8,gridView.scale*.025)}px system-ui,-apple-system,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='top';
    for(let metre=start;metre<=end;metre++){
      const x=gridView.cx+(metre-sim.distance)*pxPerWorld;
      if(x<-30||x>ctx.canvas.width+30)continue;
      ctx.beginPath();ctx.moveTo(x,gridView.groundY-10);ctx.lineTo(x,gridView.groundY+13);ctx.stroke();
      ctx.fillText(`${metre}m`,x,gridView.groundY+15);
      const half=x+pxPerWorld*.5;
      ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(half,gridView.groundY-5);ctx.lineTo(half,gridView.groundY+7);ctx.stroke();ctx.globalAlpha=1;
    }
    ctx.restore();
  });

  function canvasPixelRatio(){
    const canvas=document.getElementById('animlab-canvas');
    if(!canvas)return 1;
    const rect=canvas.getBoundingClientRect();
    return Math.max(1,canvas.width/Math.max(1,rect.width));
  }

  core.subscribe(render);
  render();
})();
