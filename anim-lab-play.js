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
  // Test box: one stack layer of the game's carryable items (STACK_ITEM_HEIGHT
  // 0.68 m; carry default 0.96 m wide). Distances below are the game's.
  const BOX_W = 0.96, BOX_H = 0.68;
  const BODY_HALF = 0.22, BODY_HEIGHT = 1.5, STEP_UP = 0.12, FOOT_HALF = 0.08;
  const ACTION_RANGE = 0.72, STACK_ALIGN = 0.42, REACH_UP = 1.05;
  const PICKUP_DURATION = 0.48, DROP_DURATION = 0.44;
  const CARRY_FORWARD = 0.48, CARRY_BOTTOM = 0.64;

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
    <label class="animlab-slider animlab-motion-slider">
      <span>Jump Height</span>
      <input type="range" data-motion-speed="jumpHeight" min="0.30" max="2.50" step="0.05" value="1.49">
      <output>1.49 m</output>
    </label>
    <div class="animlab-quickplay-actions">
      <button type="button" data-quickplay-reset>Reset Speeds</button>
    </div>
    <div class="animlab-section-title">Test box</div>
    <div class="animlab-quickplay-actions">
      <button type="button" data-box-add>Add box</button>
      <button type="button" data-box-stack>Stack box</button>
      <button type="button" data-box-clear>Clear</button>
    </div>
    <label class="animlab-held-layer">
      <span>Held item drawn</span>
      <select data-held-layer></select>
    </label>
    <p class="animlab-contact-note">A 0.96 × 0.68 m box: one stack layer in the game. Walk into it, jump on it and off it, and use <strong>Pick up</strong> / <strong>Put down</strong> on the pad (it stacks where you put it). The carry pose and the box's place in the hands are the game's. <em>Held item drawn</em> chooses which part it sits behind; the game uses it too (Save to keep).</p>
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
    <button class="animlab-quickplay-jump animlab-quickplay-action" type="button" disabled>Pick up</button>
  `;
  viewportPadHost.appendChild(pad);
  const movePad = pad.querySelector('.animlab-quickplay-move');
  const moveThumb = pad.querySelector('.animlab-quickplay-thumb');
  const jumpButton = pad.querySelector('.animlab-quickplay-jump:not(.animlab-quickplay-action)');
  const actionButton = pad.querySelector('.animlab-quickplay-action');
  const heldLayerSelect = section.querySelector('[data-held-layer]');

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
    jumpY:0, // height of the feet above the floor (0) — on a box, its top
    jumping:false,
    boxes:[], // test boxes on the ground or stacked: {x (centre), y (bottom)}
    held:null, // the box being carried
    action:null, // {type:'pickup'|'drop', t, box, from:{x,y}, to:{x,y}}
    heldAt:null, // where the held / moving box is drawn this frame {x,y}
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
    sim.jumpPrep=null;sim.jumpRecover=null;sim.jumpPlan=null;
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
    sim.boxes=[];sim.held=null;sim.action=null;sim.heldAt=null;
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
    if(ev.key==='e'||ev.key==='E'){performAction();ev.preventDefault();}
  });
  movePad.addEventListener('keyup',ev=>{
    if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(ev.key)){sim.axis=0;renderPadAxis();ev.preventDefault();}
  });

  // A jump: frames before the Jump animation's lift-off play on the ground,
  // the arc (from the character's Jump height) runs from lift-off to landing,
  // and frames after landing play on the ground. Every frame lasts the same.
  function triggerJump(){
    if(!activeState()||sim.jumping||sim.jumpPrep||sim.action)return;
    const v=Math.sqrt(2*JUMP_GRAVITY*jumpHeightOf(state())),T=2*v/JUMP_GRAVITY;
    const {L,M}=core.jumpTimingOf?.()||{L:0,M:16};
    sim.jumpPlan={v,T,L,M,tpf:T/Math.max(1,M-L)};
    sim.jumpRecover=null;
    if(L>0)sim.jumpPrep={t:0};else launchJump();
  }
  function launchJump(){
    sim.jumping=true;sim.jumpTime=0;
    sim.jumpVelocity=sim.jumpPlan.v;sim.jumpDuration=sim.jumpPlan.T;
  }
  // Frame of the Jump animation now (0–16), or null when not jumping.
  function jumpFrame(){
    const plan=sim.jumpPlan;
    // Walking off an edge: the Jump animation over the original jump's time.
    if(!plan)return sim.jumping?clamp(sim.jumpTime/JUMP_DURATION,0,1)*16:null;
    if(sim.jumpPrep)return sim.jumpPrep.t/plan.tpf;
    if(sim.jumping)return plan.L+clamp(sim.jumpTime/plan.T,0,1)*(plan.M-plan.L);
    if(sim.jumpRecover)return plan.M+sim.jumpRecover.t/plan.tpf;
    return null;
  }
  jumpButton.addEventListener('click',triggerJump);

  const DEFAULT_JUMP_HEIGHT=JUMP_VELOCITY*JUMP_VELOCITY/(2*JUMP_GRAVITY);
  const jumpHeightOf=s=>clamp(Number(s?.setup?.jumpHeight)||DEFAULT_JUMP_HEIGHT,.3,2.5);
  function beginSpeed(input){
    if(speedTx)return speedTx;
    speedTxInput=input;
    speedTx=core.beginTransaction('setup',input.dataset.motionSpeed==='jumpHeight'?'Adjust jump height':`Adjust ${input.dataset.motionSpeed==='walkSpeed'?'walk':'run'} speed`);
    return speedTx;
  }

  function previewSpeed(input){
    const value=Number(input.value);
    if(!Number.isFinite(value))return;
    const tx=beginSpeed(input);
    if(!tx)return;
    core.previewTransaction(tx,setup=>{
      if(input.dataset.motionSpeed==='jumpHeight'){
        setup.jumpHeight=clamp(value,.3,2.5);
      }else if(input.dataset.motionSpeed==='walkSpeed'){
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
      setup.jumpHeight=DEFAULT_JUMP_HEIGHT;
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

  // ---- Test box --------------------------------------------------------------
  // Boxes are the game's size and the same world metres as the ground markers.
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const loose=()=>sim.boxes.filter(b=>b!==sim.held&&b!==sim.action?.box);
  // Height of the floor or box top under x, no higher than `ceiling`.
  function supportAt(x,ceiling=Infinity){
    let top=0;
    for(const b of loose()){
      const t=b.y+BOX_H;
      if(Math.abs(x-b.x)<BOX_W/2+FOOT_HALF&&t<=ceiling+.01&&t>top)top=t;
    }
    return top;
  }
  // Walking stops at a box side taller than a step (moving away is never blocked).
  function boxStop(from,to,dir){
    let x=to;
    for(const b of loose()){
      if(b.y+BOX_H<=sim.jumpY+STEP_UP||b.y>=sim.jumpY+BODY_HEIGHT)continue;
      if(Math.sign(b.x-from)!==dir)continue;
      const limit=b.x-dir*(BOX_W/2+BODY_HALF);
      if(dir>0?x>limit:x<limit)x=dir>0?Math.max(from,limit):Math.min(from,limit);
    }
    return x;
  }
  const columnTop=x=>{let top=0;for(const b of loose())if(Math.abs(b.x-x)<STACK_ALIGN)top=Math.max(top,b.y+BOX_H);return top;};
  const columnNear=x=>loose().filter(b=>Math.abs(b.x-x)<BOX_W).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]||null;
  // Add: a new box on the floor 1.6 m ahead (or the next free spot).
  // Stack: on top of the nearest column ahead (a new box if there is none).
  function addBox(stack){
    const dir=sim.facing||1;
    const ahead=loose().filter(b=>Math.sign(b.x-sim.distance)===dir).sort((a,b)=>Math.abs(a.x-sim.distance)-Math.abs(b.x-sim.distance))[0];
    if(stack&&ahead){sim.boxes.push({x:ahead.x,y:columnTop(ahead.x)});return;}
    let x=sim.distance+dir*1.6;
    while(columnNear(x))x+=dir*(BOX_W+.1);
    sim.boxes.push({x,y:0});
  }
  // The top box of the nearest column in front, within reach.
  function pickupTarget(){
    if(sim.held||sim.action||sim.jumping||sim.jumpPrep)return null;
    let best=null,bestGap=Infinity;
    for(const b of loose()){
      if(loose().some(o=>o!==b&&Math.abs(o.x-b.x)<STACK_ALIGN&&o.y>b.y+.05))continue; // not the top one
      const gap=Math.abs(b.x-sim.distance)-BOX_W/2-BODY_HALF;
      const ahead=Math.sign(b.x-sim.distance)===sim.facing;
      const standingOn=Math.abs(b.y+BOX_H-sim.jumpY)<.03&&Math.abs(b.x-sim.distance)<BOX_W/2+FOOT_HALF;
      if(!ahead||standingOn||gap>ACTION_RANGE||b.y>sim.jumpY+REACH_UP||b.y+BOX_H<sim.jumpY-.05)continue;
      if(gap<bestGap){best=b;bestGap=gap;}
    }
    return best;
  }
  // Where a put-down box lands: in front; on a column it overlaps (stacked).
  function dropTarget(){
    if(!sim.held||sim.action||sim.jumping||sim.jumpPrep)return null;
    let x=sim.distance+sim.facing*(BODY_HALF+BOX_W/2+.06);
    const near=columnNear(x);
    if(near&&Math.abs(near.x-x)>=STACK_ALIGN)return null; // would half-overlap a column
    if(near)x=near.x;
    const y=near?columnTop(x):0;
    return y<=sim.jumpY+REACH_UP?{x,y}:null;
  }
  function performAction(){
    if(!activeState())return;
    const from=sim.heldAt?{...sim.heldAt}:null;
    if(sim.held){
      const to=dropTarget();if(!to)return;
      sim.action={type:'drop',t:0,box:sim.held,from,to};sim.held=null;
    }else{
      const box=pickupTarget();if(!box)return;
      sim.action={type:'pickup',t:0,box,from:{x:box.x,y:box.y},to:null};
    }
    sim.axis=0;renderPadAxis();
  }
  function updateAction(dt){
    const a=sim.action;if(!a)return;
    a.t+=dt;
    if(a.type==='pickup'&&a.t>=PICKUP_DURATION){sim.held=a.box;sim.action=null;}
    else if(a.type==='drop'&&a.t>=DROP_DURATION){a.box.x=a.to.x;a.box.y=a.to.y;sim.action=null;}
  }
  // The game's carry arms (biped-rig.js carryPose), reaching while picking up.
  function carryArms(rig,pose){
    const a=sim.action;
    if(sim.held)return rig.carryPose(pose,1,0);
    if(!a)return pose;
    const q=clamp(a.t/(a.type==='pickup'?PICKUP_DURATION:DROP_DURATION),0,1),reach=Math.sin(q*Math.PI);
    if(a.type==='pickup'){const carry=ease((q-.52)/.48);return rig.carryPose(pose,carry,reach*(1-carry*.65));}
    return rig.carryPose(pose,1-ease((q-.58)/.42),reach*.95);
  }
  // As the game: a foot keyed below the floor goes no lower than the real ground.
  function keepFeetAboveGround(pose,k){
    const above=sim.jumping?Math.max(0,sim.jumpY-supportAt(sim.distance,sim.jumpY)):0;
    const min=-above/Math.max(.01,k);
    if((Number(pose.aFootLift)||0)>=min&&(Number(pose.bFootLift)||0)>=min)return pose;
    return {...pose,aFootLift:Math.max(min,Number(pose.aFootLift)||0),bFootLift:Math.max(min,Number(pose.bFootLift)||0)};
  }
  // The held box sits at the hands (bottom just under them), as in the game.
  function placeHeldBox(rig,pose,setup,k){
    if(!sim.held&&!sim.action){sim.heldAt=null;return;}
    let hands={x:sim.distance+sim.facing*CARRY_FORWARD,y:sim.jumpY+CARRY_BOTTOM};
    if(sim.family==='biped'&&pose&&rig?.geometry){
      const g=rig.geometry(pose,setup?.rig||rig.DEFAULT_REST_RIG);
      if(g?.aW&&g?.bW)hands={x:sim.distance+sim.facing*(g.aW.x+g.bW.x)/2*k,y:sim.jumpY+(g.aW.y+g.bW.y)/2*k-BOX_H*.52};
    }
    const a=sim.action;
    if(!a){sim.heldAt=hands;return;}
    const p=ease(a.t/(a.type==='pickup'?PICKUP_DURATION:DROP_DURATION));
    if(a.type==='pickup'){const lift=ease((p-.18)/.82);sim.heldAt={x:lerp(a.from.x,hands.x,lift),y:lerp(a.from.y,hands.y,lift)};}
    else{const settle=ease((p-.05)/.95);sim.heldAt={x:lerp(hands.x,a.to.x,settle),y:lerp(hands.y,a.to.y,settle)};}
  }
  function drawBox(ctx,gridView,x,y,held){
    const ppw=gridView.scale/BASE_CHARACTER_SCALE;
    const left=gridView.cx+(x-BOX_W/2-sim.distance)*ppw,top=gridView.groundY-(y+BOX_H)*ppw,w=BOX_W*ppw,h=BOX_H*ppw;
    ctx.save();
    ctx.fillStyle=held?'#a77a4c':'#8f6840';ctx.fillRect(left,top,w,h);
    ctx.strokeStyle='#4a321d';ctx.lineWidth=Math.max(1.5,w*.035);
    ctx.strokeRect(left,top,w,h);
    ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left+w,top+h);ctx.moveTo(left+w,top);ctx.lineTo(left,top+h);
    ctx.lineWidth=Math.max(1,w*.025);ctx.globalAlpha=.55;ctx.stroke();
    ctx.restore();
  }
  section.querySelector('[data-box-add]').addEventListener('click',()=>addBox(false));
  section.querySelector('[data-box-stack]').addEventListener('click',()=>addBox(true));
  section.querySelector('[data-box-clear]').addEventListener('click',()=>{sim.boxes=[];sim.held=null;sim.action=null;sim.heldAt=null;});
  actionButton.addEventListener('click',performAction);
  heldLayerSelect.addEventListener('change',()=>{
    const value=heldLayerSelect.value;
    core.edit('setup','Held item drawn',setup=>{setup.heldItemLayer=value;});
  });
  // Options: Auto, In front, Behind, or behind any one part (by its name).
  function heldLayerOptions(s){
    const parts=s.setup?.artLayout?.assembly?.enabled
      ?(s.setup.artLayout.assembly.instances||[]).map(i=>({id:i.id,name:i.nameOverride||i.label||i.id}))
      :(s.family==='biped'&&s.rig?.partsForPose?s.rig.partsForPose(s.rig.restPose?s.rig.restPose(s.setup?.rig):s.rig.IDLE_POSE,s.setup?.rig).map(p=>({id:p.name,name:p.name.replace(/_/g,' ')})):[]);
    return [['auto','Auto · behind the near arm'],['front','In front of the character'],['back','Behind the character'],
      ...parts.map(p=>[`part:${p.id}`,`Behind ${p.name}`])];
  }
  function updateActionButton(){
    const carrying=!!sim.held;
    actionButton.textContent=carrying?'Put down':'Pick up';
    actionButton.classList.toggle('is-carrying',carrying);
    actionButton.disabled=carrying?!dropTarget():!pickupTarget();
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
    if(sim.action){analogSpeed=0;targetRun=0;}
    if(moveDir&&analogSpeed>0){
      sim.distance=boxStop(sim.distance,sim.distance+moveDir*analogSpeed*dt,moveDir);
      sim.facing=moveDir;
      updateGait(rig,dt,analogSpeed,targetRun,true,speeds);
      sim.modeLabel=gaitRunMix()>.5?'Run':'Walk';
    }else{
      updateGait(rig,dt,0,targetRun,false,speeds);
      sim.modeLabel='Idle';
      sim.idlePhase=(sim.idlePhase+dt/1.4)%1;
    }
    sim.actualSpeed=analogSpeed;

    if(sim.jumpPrep){
      sim.jumpPrep.t+=dt;
      if(sim.jumpPrep.t>=sim.jumpPlan.L*sim.jumpPlan.tpf){sim.jumpPrep=null;launchJump();}
    }
    if(sim.jumping){
      const before=sim.jumpY;
      sim.jumpTime+=dt;
      sim.jumpVelocity-=JUMP_GRAVITY*dt;
      sim.jumpY+=sim.jumpVelocity*dt;
      // Land on the floor or a box top no higher than a step above the feet
      // (the same step walking allows, so a box edge can't be fallen into).
      const floor=supportAt(sim.distance,before+STEP_UP);
      if(sim.jumpVelocity<=0&&sim.jumpY<=floor){
        sim.jumping=false;sim.jumpTime=0;sim.jumpVelocity=0;sim.jumpY=floor;
        if(sim.jumpPlan&&sim.jumpPlan.M<16)sim.jumpRecover={t:0};else sim.jumpPlan=null;
      }
    }else if(!sim.jumpPrep&&supportAt(sim.distance,sim.jumpY+STEP_UP)<sim.jumpY-.02){
      // Walked off a box: fall.
      sim.jumping=true;sim.jumpTime=0;sim.jumpVelocity=0;sim.jumpPlan=null;sim.jumpRecover=null;
    }else{
      sim.jumpY=supportAt(sim.distance,sim.jumpY+STEP_UP);
    }
    updateAction(dt);
    if(!sim.jumping&&sim.jumpRecover){
      sim.jumpRecover.t+=dt;
      // Landing frames play out unless the character sets off walking.
      if(sim.jumpRecover.t>=(16-sim.jumpPlan.M)*sim.jumpPlan.tpf||(moveDir&&analogSpeed>.001)){sim.jumpRecover=null;sim.jumpPlan=null;}
    }

    let pose;
    const jf=jumpFrame();
    if(jf!==null){
      pose=core.evaluateClip('jump',clamp(jf/16,0,.999),sim.family);
      sim.modeLabel='Jump';
    }else if(moveDir&&analogSpeed>.001){
      pose=currentGaitPose(rig);
    }else{
      pose=core.evaluateClip('idle',sim.idlePhase,sim.family);
      if(!pose && sim.profile?.idleFallback==='neutral-pose') pose=neutralIdlePose(rig);
    }
    if(!pose)pose=rig?.IDLE_POSE||null;
    // Bipeds: ease between standing, moving and jumping (as the game does).
    if(pose&&sim.family==='biped'&&rig?.interpolatePose)pose=crossfade(rig,pose,jf!==null?'jump':(moveDir&&analogSpeed>.001?'move':'idle'),stamp);

    const k=BASE_CHARACTER_SCALE*(Number(setup?.scale)||1); // world metres per character unit
    if(pose&&sim.family==='biped'&&rig?.carryPose)pose=carryArms(rig,pose);
    if(pose&&sim.family==='biped')pose=keepFeetAboveGround(pose,k);
    placeHeldBox(rig,pose,setup,k);
    const localLift=sim.jumpY/Math.max(.001,k);
    const runMix=gaitRunMix();
    if(stamp-lastStatusStamp>80){lastStatusStamp=stamp;renderStatus(speeds,rig,runMix);updateActionButton();}
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
      const val=key==='jumpHeight'?jumpHeightOf(s):Number(s.setup?.[key])||(key==='walkSpeed'?defaultWalk(s):defaultRun(s));
      input.value=String(val);
      input.nextElementSibling.textContent=key==='jumpHeight'?`${val.toFixed(2)} m`:`${val.toFixed(2)} m/s`;
    });
    if(active){
      renderStatus(setupSpeeds(s),s.rig,gaitRunMix());
      const options=heldLayerOptions(s),value=s.setup?.heldItemLayer||'auto';
      const sig=options.map(o=>o.join('=')).join('|');
      if(heldLayerSelect.dataset.sig!==sig){
        heldLayerSelect.replaceChildren(...options.map(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;return o;}));
        heldLayerSelect.dataset.sig=sig;
      }
      heldLayerSelect.value=options.some(o=>o[0]===value)?value:'auto';
      updateActionButton();
    }
  }

  core.setPlayFrameProvider(frameProvider);
  core.registerUnderlayRenderer('quick-play-boxes',({ctx,gridView})=>{
    if(!activeState())return;
    for(const b of loose())drawBox(ctx,gridView,b.x,b.y,false);
  });
  core.setHeldItemDrawer?.(({ctx,gridView})=>{
    if(activeState()&&sim.heldAt)drawBox(ctx,gridView,sim.heldAt.x,sim.heldAt.y,true);
  });
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

  const FADE_MS={idle:220,move:220,jump:150};
  function crossfade(rig,pose,source,stamp){
    if(source!==sim.poseSource){
      if(sim.poseSource&&sim.lastPose)sim.poseFade={from:sim.lastPose,start:stamp,ms:FADE_MS[source]||200};
      sim.poseSource=source;
    }
    if(sim.poseFade){
      const t=(stamp-sim.poseFade.start)/sim.poseFade.ms;
      if(t>=1)sim.poseFade=null;
      else{
        const k=t*t*(3-2*t),a=sim.poseFade.from;
        const out=rig.interpolatePose(a,pose,k,k<.5?a.name:pose.name,Number(pose.travel)||0);
        // interpolatePose holds the first pose's contact; mix the feet freely,
        // then plant by the contact at this point of the fade.
        for(const c of ['aFootLift','bFootLift'])out[c]=(Number(a[c])||0)+((Number(pose[c])||0)-(Number(a[c])||0))*k;
        out.planted=a.planted===pose.planted?a.planted:(k<.34?a.planted:k>.66?pose.planted:null);
        if(out.planted==='A')out.aFootLift=0;
        if(out.planted==='B')out.bFootLift=0;
        pose=rig.normalizedPose(out,0);
      }
    }
    sim.lastPose=pose;
    return pose;
  }

  function canvasPixelRatio(){
    const canvas=document.getElementById('animlab-canvas');
    if(!canvas)return 1;
    const rect=canvas.getBoundingClientRect();
    return Math.max(1,canvas.width/Math.max(1,rect.width));
  }

  // Read-only view of the simulation (tests).
  window.AnimLabQuickPlay=Object.freeze({state:()=>({x:sim.distance,y:sim.jumpY,jumping:sim.jumping,facing:sim.facing,
    boxes:sim.boxes.map(b=>({x:b.x,y:b.y,held:b===sim.held})),held:!!sim.held,action:sim.action?.type||null,heldAt:sim.heldAt&&{...sim.heldAt}})});
  core.subscribe(render);
  render();
})();
