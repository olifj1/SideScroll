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

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-quickplay-section';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Quick Play</div>
    <div class="animlab-quickplay-status" aria-live="polite">Fox motion test</div>
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
    <p class="animlab-contact-note">The animation cadence stays fixed while these controls change ground travel, so you can visually balance the gait against movement. Save writes the speeds with the Fox setup.</p>
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
    runBlend:0,
    facing:1,
    jumpTime:0,
    jumpVelocity:0,
    jumpY:0,
    jumping:false,
    idlePhase:0,
    lastNow:0,
    actualSpeed:0,
    modeLabel:'Idle'
  };

  let pointerId = null;
  let speedTx = null;
  let speedTxInput = null;
  let lastStatusStamp = 0;

  function state(){ return core.getState(); }
  function activeState(s=state()){ return s.family === 'fox' && s.mode === 'play'; }
  function defaultWalk(s){ return Number(s.rig?.DEFAULT_WALK_SPEED) || 1.15; }
  function defaultRun(s){ return Number(s.rig?.DEFAULT_RUN_SPEED) || 2.85; }
  function walkCycleMs(s){ return Number(s.rig?.WALK_CYCLE_MS) || 539; }
  function runCycleMs(s){ return Number(s.rig?.RUN_CYCLE_MS) || 323; }

  function setupSpeeds(s=state()){
    const walk=clamp(Number(s.setup?.walkSpeed)||defaultWalk(s),0.45,3.25);
    const run=clamp(Math.max(Number(s.setup?.runSpeed)||defaultRun(s),walk+.20),1.00,5.75);
    return {walk,run};
  }

  function resetSimulation(){
    sim.axis=0;
    sim.distance=0;
    sim.locomotionPhase=0;
    sim.runBlend=0;
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
    speedTx=core.beginTransaction('setup',`Adjust Fox ${input.dataset.motionSpeed==='walkSpeed'?'walk':'run'} speed`);
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
    core.edit('setup','Reset Fox movement speeds',setup=>{
      setup.walkSpeed=defaultWalk(s);
      setup.runSpeed=defaultRun(s);
    });
  });

  function blendFoxPose(rig,walkPose,runPose,t){
    if(typeof rig?.blendPose==='function')return rig.blendPose(walkPose,runPose,t);
    return t<.5?walkPose:runPose;
  }

  function frameProvider({now,setup,rig}){
    if(!activeState())return null;
    const stamp=Number(now)||performance.now();
    const dt=sim.lastNow?Math.min(.05,Math.max(0,(stamp-sim.lastNow)/1000)):0;
    sim.lastNow=stamp;
    const speeds={
      walk:clamp(Number(setup?.walkSpeed)||Number(rig?.DEFAULT_WALK_SPEED)||1.15,.45,3.25),
      run:clamp(Math.max(Number(setup?.runSpeed)||Number(rig?.DEFAULT_RUN_SPEED)||2.85,(Number(setup?.walkSpeed)||1.15)+.20),1,5.75)
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
    sim.runBlend+=(targetRun-sim.runBlend)*Math.min(1,dt*5.2);
    const smoothRun=sim.runBlend*sim.runBlend*(3-2*sim.runBlend);
    if(moveDir&&analogSpeed>0){
      sim.distance+=moveDir*analogSpeed*dt;
      sim.facing=moveDir;
      const walkHz=1000/Math.max(1,Number(rig?.WALK_CYCLE_MS)||539);
      const runHz=1000/Math.max(1,Number(rig?.RUN_CYCLE_MS)||323);
      const referenceSpeed=lerp(speeds.walk,speeds.run,smoothRun);
      const cadenceScale=axisMag<=WALK_POINT?effort:clamp(analogSpeed/Math.max(.001,referenceSpeed),0,1.25);
      sim.locomotionPhase=(sim.locomotionPhase+dt*lerp(walkHz,runHz,smoothRun)*cadenceScale)%1;
      sim.modeLabel=smoothRun>.55?'Run':'Walk';
    }else{
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
      pose=core.evaluateClip('jump',clamp(sim.jumpTime/JUMP_DURATION,0,.999),'fox');
      sim.modeLabel='Jump';
    }else if(moveDir&&analogSpeed>.001){
      const walkPose=core.evaluateClip('walk',sim.locomotionPhase,'fox');
      const runPose=core.evaluateClip('run',sim.locomotionPhase,'fox');
      pose=blendFoxPose(rig,walkPose,runPose,smoothRun);
    }else{
      pose=core.evaluateClip('idle',sim.idlePhase,'fox');
    }
    if(!pose)pose=rig?.IDLE_POSE||null;

    const localLift=sim.jumpY/Math.max(.001,BASE_CHARACTER_SCALE*(Number(setup?.scale)||1));
    if(stamp-lastStatusStamp>80){lastStatusStamp=stamp;renderStatus(speeds,rig,smoothRun);}
    return {pose,localLift,facing:sim.facing,distance:sim.distance,actualSpeed:analogSpeed,runBlend:smoothRun};
  }

  function renderStatus(speeds,rig,runMix=sim.runBlend){
    const walkMs=Number(rig?.WALK_CYCLE_MS)||539;
    const runMs=Number(rig?.RUN_CYCLE_MS)||323;
    const cycleMs=lerp(walkMs,runMs,clamp(runMix,0,1));
    const fullSpeed=lerp(speeds.walk,speeds.run,clamp(runMix,0,1));
    const metresPerCycle=fullSpeed*cycleMs/1000;
    status.textContent=`${sim.modeLabel} · ${sim.actualSpeed.toFixed(2)} m/s · ${Math.round(cycleMs)} ms/cycle · ${metresPerCycle.toFixed(2)} m/cycle`;
  }

  function render(s=state()){
    const active=activeState(s);
    if(active&&!sim.active){sim.active=true;resetSimulation();}
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
    if(active)renderStatus(setupSpeeds(s),s.rig,sim.runBlend);
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
