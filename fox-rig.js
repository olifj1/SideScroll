(() => {
  'use strict';

  const DEG = Math.PI / 180;
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clone = obj => JSON.parse(JSON.stringify(obj));

  // First-pass quadruped rig authored directly over the approved B2 fox source.
  // Local units are intentionally much smaller than the humanoid rig so the
  // existing SideScroll character scale renders the fox at about half-height.
  const BODY = Object.freeze({
    bodyCenterX: -0.0018,
    bodyCenterY: 0.2268,
    hipX: -0.0714,
    hipY: 0.2214,
    shoulderX: 0.0679,
    shoulderY: 0.2321,
    neckX: 0.0964,
    neckY: 0.3071,
    headX: 0.1607,
    headY: 0.3679,
    tail0X: -0.1179,
    tail0Y: 0.2429,
    rearNearRootX: -0.0679,
    rearNearRootY: 0.2071,
    rearFarRootX: -0.0429,
    rearFarRootY: 0.2071,
    frontNearRootX: 0.0821,
    frontNearRootY: 0.2071,
    frontFarRootX: 0.1107,
    frontFarRootY: 0.2071,
    rearNearUpper: 0.1320,
    rearNearLower: 0.1420,
    rearFarUpper: 0.1160,
    rearFarLower: 0.1220,
    frontNearUpper: 0.1160,
    frontNearLower: 0.1280,
    frontFarUpper: 0.1160,
    frontFarLower: 0.1320,
    tail1: 0.1288,
    tail2: 0.1280,
    tail3: 0.1088
  });

  const REST = Object.freeze({
    rearNearFootX: -0.1400,
    rearFarFootX: -0.0450,
    frontNearFootX: 0.0950,
    frontFarFootX: 0.1550,
    tailAngle1: Math.atan2(0.2000 - 0.2429, -0.2393 + 0.1179),
    tailAngle2: Math.atan2(0.1500 - 0.2000, -0.3571 + 0.2393),
    tailAngle3: Math.atan2(0.1071 - 0.1500, -0.4571 + 0.3571),
    headAngle: Math.atan2(0.3679 - 0.3071, 0.1607 - 0.0964),
    headLength: Math.hypot(0.1607 - 0.0964, 0.3679 - 0.3071)
  });

  const COLLIDER_STORAGE_KEY = 'sidescroll.fox.collider.v1';
  const DEFAULT_COLLIDER = Object.freeze({
    offsetX: 0.010,
    radius: 0.125,
    height: 0.445,
    bottom: 0.010,
    footProbe: 0.085,
    stepUp: 0.105,
    stepDown: 0.085
  });

  function normalizedCollider(value = null) {
    const raw = value || {};
    const radius = clamp(Number(raw.radius) || DEFAULT_COLLIDER.radius, 0.070, 0.220);
    const bottom = clamp(Number.isFinite(Number(raw.bottom)) ? Number(raw.bottom) : DEFAULT_COLLIDER.bottom, -0.040, 0.120);
    const height = clamp(Number(raw.height) || DEFAULT_COLLIDER.height, radius * 2 + 0.045, 0.720);
    return {
      offsetX: clamp(Number.isFinite(Number(raw.offsetX)) ? Number(raw.offsetX) : DEFAULT_COLLIDER.offsetX, -0.120, 0.160),
      radius: Math.min(radius, height * 0.46),
      height,
      bottom,
      footProbe: clamp(Number(raw.footProbe) || DEFAULT_COLLIDER.footProbe, 0.035, 0.190),
      stepUp: clamp(Number(raw.stepUp) || DEFAULT_COLLIDER.stepUp, 0.045, 0.180),
      stepDown: clamp(Number(raw.stepDown) || DEFAULT_COLLIDER.stepDown, 0.035, 0.170)
    };
  }

  function loadCollider() {
    try { return normalizedCollider(JSON.parse(localStorage.getItem(COLLIDER_STORAGE_KEY) || 'null')); }
    catch (_) { return normalizedCollider(); }
  }
  function saveCollider(value) {
    const collider = normalizedCollider(value);
    try { localStorage.setItem(COLLIDER_STORAGE_KEY, JSON.stringify(collider)); } catch (_) {}
    return collider;
  }

  const ATLAS = Object.freeze({
    width: 2048,
    height: 1024,
    fileUrl: 'fox-rig-atlas-v1.png?v=1.0.141',
    sourceUrl: 'fox-character-source-v1.png?v=1.0.141',
    parts: Object.freeze({
      tail_tip:{x:12,y:12,w:243,h:289,a0:[0.8724279835,0.3910034602],a1:[0.2962962963,0.5986159170]},
      tail_mid:{x:267,y:12,w:416,h:391,a0:[0.7548076923,0.3248081841],a1:[0.3581730769,0.5038363171]},
      tail_base:{x:695,y:12,w:310,h:280,a0:[0.6516129032,0.3428571429],a1:[0.1032258065,0.5571428571]},
      far_rear_upper:{x:1017,y:12,w:150,h:227,a0:[0.4533333333,0.1321585903],a1:[0.4866666667,0.7709251101]},
      far_rear_lower:{x:1179,y:12,w:149,h:222,a0:[0.5167785235,0.1261261261],a1:[0.5167785235,0.7567567568]},
      far_front_upper:{x:1340,y:12,w:155,h:224,a0:[0.2064516129,0.2500000000],a1:[0.4645161290,0.8526785714]},
      far_front_lower:{x:1507,y:12,w:149,h:246,a0:[0.2013422819,0.1138211382],a1:[0.5033557047,0.7439024390]},
      torso:{x:12,y:415,w:404,h:280,a0:[0.2500000000,0.5785714286],a1:[0.7326732673,0.5250000000]},
      near_rear_upper:{x:428,y:415,w:203,h:240,a0:[0.8374384236,0.1333333333],a1:[0.4433497537,0.6958333333]},
      near_rear_lower:{x:643,y:415,w:150,h:240,a0:[0.7933333333,0.1250000000],a1:[0.1933333333,0.7500000000]},
      near_front_upper:{x:805,y:415,w:121,h:203,a0:[0.4958677686,0.1576354680],a1:[0.6611570248,0.8472906404]},
      near_front_lower:{x:938,y:415,w:92,h:242,a0:[0.3260869565,0.1198347107],a1:[0.2717391304,0.7396694215]},
      head_neck:{x:1042,y:415,w:394,h:478,a0:[0.4314720812,0.5376569038],a1:[0.6598984772,0.3598326360]}
    })
  });

  function atlasRect(name) {
    const p = ATLAS.parts[name];
    return p ? {...p} : null;
  }

  function rotPoint(pt, center, angle, dx = 0, dy = 0) {
    const x = pt.x - center.x, y = pt.y - center.y;
    const c = Math.cos(angle), s = Math.sin(angle);
    return {x:center.x + x*c - y*s + dx, y:center.y + x*s + y*c + dy};
  }

  function solveJoint(root, target, l1, l2, bendSign = 1) {
    let dx=target.x-root.x, dy=target.y-root.y, d=Math.hypot(dx,dy)||1e-5;
    const minD=Math.abs(l1-l2)+.0005, maxD=l1+l2-.0005, cd=clamp(d,minD,maxD);
    dx*=cd/d; dy*=cd/d; d=cd;
    const t={x:root.x+dx,y:root.y+dy};
    const a=(l1*l1-l2*l2+d*d)/(2*d), h=Math.sqrt(Math.max(0,l1*l1-a*a));
    const ux=dx/d, uy=dy/d, bx=root.x+ux*a, by=root.y+uy*a, px=-uy, py=ux;
    const c1={x:bx+px*h,y:by+py*h}, c2={x:bx-px*h,y:by-py*h};
    const joint=bendSign<0 ? (c1.x<c2.x?c1:c2) : (c1.x>c2.x?c1:c2);
    return {joint,target:t};
  }

  const LIMBS = Object.freeze({
    rearNear:{root:[BODY.rearNearRootX,BODY.rearNearRootY],knee:[-0.1250,0.1107],foot:[-0.1893,0.0036],upper:BODY.rearNearUpper,lower:BODY.rearNearLower},
    rearFar:{root:[BODY.rearFarRootX,BODY.rearFarRootY],knee:[-0.0393,0.1036],foot:[-0.0393,0.0036],upper:BODY.rearFarUpper,lower:BODY.rearFarLower},
    frontNear:{root:[BODY.frontNearRootX,BODY.frontNearRootY],knee:[0.0964,0.1071],foot:[0.0929,0.0000],upper:BODY.frontNearUpper,lower:BODY.frontNearLower},
    frontFar:{root:[BODY.frontFarRootX,BODY.frontFarRootY],knee:[0.1393,0.1107],foot:[0.1714,0.0000],upper:BODY.frontFarUpper,lower:BODY.frontFarLower}
  });
  for (const limb of Object.values(LIMBS)) {
    limb.upperAngle = Math.atan2(limb.knee[1]-limb.root[1], limb.knee[0]-limb.root[0]);
    limb.lowerAngle = Math.atan2(limb.foot[1]-limb.knee[1], limb.foot[0]-limb.knee[0]);
  }

  const WALK_STRIDE_WORLD = 0.62;
  const RUN_STRIDE_WORLD = 0.92;
  const WALK_OFFSETS = Object.freeze({rearNear:0.00,frontNear:0.25,rearFar:0.50,frontFar:0.75});
  const RUN_OFFSETS = Object.freeze({rearNear:0.00,frontFar:0.00,rearFar:0.50,frontNear:0.50});

  function legMotion(phase, offset, mode='walk') {
    const run=mode==='run', q=(phase+offset)*TAU;
    const swing=Math.sin(q), lift=Math.max(0,Math.sin(q));
    return {
      upper:swing*(run?24:13)*DEG,
      lower:(-swing*(run?18:10) + lift*(run?26:14))*DEG
    };
  }

  function locomotionPose(phase, mode='walk') {
    const run=mode==='run', offsets=run?RUN_OFFSETS:WALK_OFFSETS;
    const rn=legMotion(phase,offsets.rearNear,mode), rf=legMotion(phase,offsets.rearFar,mode);
    const fn=legMotion(phase,offsets.frontNear,mode), ff=legMotion(phase,offsets.frontFar,mode);
    const beat=Math.sin(phase*TAU*(run?2:1));
    return {
      name:run?'Run':'Walk',travel:phase,key:false,
      bodyBob:(run?.008:.0035)*Math.sin(phase*TAU*(run?2:4)),
      bodyPitch:(run?2.5:1.2)*DEG*beat,
      headPitch:(run?-1.6:-.7)*DEG*beat,
      tailBase:(run?4.0:2.0)*DEG*Math.sin(phase*TAU+.45),
      tailMid:(run?6.0:3.2)*DEG*Math.sin(phase*TAU+.95),
      tailTip:(run?8.0:4.2)*DEG*Math.sin(phase*TAU+1.35),
      rnUpper:rn.upper,rnLower:rn.lower,rfUpper:rf.upper,rfLower:rf.lower,
      fnUpper:fn.upper,fnLower:fn.lower,ffUpper:ff.upper,ffLower:ff.lower
    };
  }

  const IDLE_POSE = Object.freeze({
    name:'Idle',travel:0,key:true,bodyBob:0,bodyPitch:0,headPitch:0,tailBase:0,tailMid:0,tailTip:0,
    rnUpper:0,rnLower:0,rfUpper:0,rfLower:0,fnUpper:0,fnLower:0,ffUpper:0,ffLower:0
  });

  function jumpKey(i){
    const tuck=[0,.10,.25,.70,1,.65,.25,0][i];
    const launch=[0,.55,1,.6,0,-.35,-.65,0][i];
    return {
      name:['Compress','Takeoff','Trail','Tuck','Apex','Open','Extend','Land'][i],travel:i/8,key:true,
      bodyBob:[-.010,-.003,.008,.015,.018,.010,.000,-.010][i],
      bodyPitch:[-4,3,8,5,1,-2,-4,-5][i]*DEG,
      headPitch:[2,0,-2,-3,-2,0,2,3][i]*DEG,
      tailBase:[-3,-6,-9,-5,0,5,7,2][i]*DEG,
      tailMid:[-2,-4,-7,-3,2,7,9,3][i]*DEG,
      tailTip:[0,-2,-5,-1,4,9,11,4][i]*DEG,
      rnUpper:(launch*-9 + tuck*14)*DEG,
      rnLower:(launch*7 + tuck*17)*DEG,
      rfUpper:(launch*-7 + tuck*12)*DEG,
      rfLower:(launch*6 + tuck*15)*DEG,
      fnUpper:(launch*10 - tuck*13)*DEG,
      fnLower:(launch*-7 - tuck*16)*DEG,
      ffUpper:(launch*9 - tuck*11)*DEG,
      ffLower:(launch*-6 - tuck*14)*DEG
    };
  }

  const NUMERIC_KEYS=['bodyBob','bodyPitch','headPitch','tailBase','tailMid','tailTip','rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower','travel'];
  function blendPose(a,b,t){
    if(t<=.001)return clone(a); if(t>=.999)return clone(b);
    const out={...clone(a),name:t<.5?a.name:b.name,key:false};
    for(const k of NUMERIC_KEYS) out[k]=lerp(Number(a[k])||0,Number(b[k])||0,t);
    return out;
  }
  function interpolatePose(a,b,t,name,travelB=b.travel){
    const out=blendPose(a,b,t); out.name=name||out.name; out.travel=lerp(a.travel,travelB,t); return out;
  }
  function buildFramesFromKeys(keys){
    const out=new Array(16);
    for(let i=0;i<8;i++){
      const a=clone(keys[i]);a.key=true;out[i*2]=a;
      const ni=(i+1)%8,b=keys[ni],travelB=ni===0?1:b.travel;
      out[i*2+1]=interpolatePose(a,b,.5,`${a.name} → ${b.name}`,travelB);
    }
    return out;
  }
  const DEFAULT_FRAMES=Array.from({length:16},(_,i)=>({...locomotionPose(i/16,'walk'),key:i%2===0}));
  const RUN_FRAMES=Array.from({length:16},(_,i)=>({...locomotionPose(i/16,'run'),key:i%2===0}));
  const JUMP_FRAMES=buildFramesFromKeys(Array.from({length:8},(_,i)=>jumpKey(i)));

  function normalizedPose(p,i=0){
    const d=DEFAULT_FRAMES[i%16];
    const out={...clone(d),...clone(p||{}),key:i%2===0};
    for(const k of NUMERIC_KEYS) if(!Number.isFinite(Number(out[k]))) out[k]=Number(d[k])||0;
    return out;
  }
  function sampleFrames(frames,phase){
    const p=((phase%1)+1)%1*16,i=Math.floor(p)%16,t=p-Math.floor(p),j=(i+1)%16;
    const a=normalizedPose(frames[i],i),b=normalizedPose(frames[j],j),travelB=j===0?1:b.travel;
    return interpolatePose(a,b,t,a.name,travelB);
  }

  function geometry(pose){
    const p=normalizedPose(pose);
    const c={x:BODY.bodyCenterX,y:BODY.bodyCenterY};
    const bodyPoint=(x,y)=>rotPoint({x,y},c,p.bodyPitch,0,p.bodyBob);
    const hip=bodyPoint(BODY.hipX,BODY.hipY),shoulder=bodyPoint(BODY.shoulderX,BODY.shoulderY);
    const neck=bodyPoint(BODY.neckX,BODY.neckY);
    const headAngle=REST.headAngle+p.bodyPitch+p.headPitch;
    const head={x:neck.x+Math.cos(headAngle)*REST.headLength,y:neck.y+Math.sin(headAngle)*REST.headLength};

    function limbGeom(id,upperDelta,lowerDelta){
      const l=LIMBS[id],root=bodyPoint(l.root[0],l.root[1]);
      const ua=l.upperAngle+p.bodyPitch+upperDelta,la=l.lowerAngle+p.bodyPitch+lowerDelta;
      const knee={x:root.x+Math.cos(ua)*l.upper,y:root.y+Math.sin(ua)*l.upper};
      const foot={x:knee.x+Math.cos(la)*l.lower,y:knee.y+Math.sin(la)*l.lower};
      return{root,knee,foot};
    }
    const rn=limbGeom('rearNear',p.rnUpper,p.rnLower),rf=limbGeom('rearFar',p.rfUpper,p.rfLower);
    const fn=limbGeom('frontNear',p.fnUpper,p.fnLower),ff=limbGeom('frontFar',p.ffUpper,p.ffLower);

    const tail0=bodyPoint(BODY.tail0X,BODY.tail0Y);
    const a1=REST.tailAngle1+p.bodyPitch+p.tailBase;
    const tail1={x:tail0.x+Math.cos(a1)*BODY.tail1,y:tail0.y+Math.sin(a1)*BODY.tail1};
    const a2=REST.tailAngle2+p.bodyPitch+p.tailBase*.25+p.tailMid;
    const tail2={x:tail1.x+Math.cos(a2)*BODY.tail2,y:tail1.y+Math.sin(a2)*BODY.tail2};
    const a3=REST.tailAngle3+p.bodyPitch+p.tailMid*.20+p.tailTip;
    const tail3={x:tail2.x+Math.cos(a3)*BODY.tail3,y:tail2.y+Math.sin(a3)*BODY.tail3};

    return {pose:p,hip,shoulder,neck,head,tail0,tail1,tail2,tail3,
      rearNearRoot:rn.root,rearNearKnee:rn.knee,rearNearFoot:rn.foot,
      rearFarRoot:rf.root,rearFarKnee:rf.knee,rearFarFoot:rf.foot,
      frontNearRoot:fn.root,frontNearKnee:fn.knee,frontNearFoot:fn.foot,
      frontFarRoot:ff.root,frontFarKnee:ff.knee,frontFarFoot:ff.foot};
  }

  function seg(name,a,b,layer,alpha=1){return{name,a,b,layer,alpha,kind:'segment'};}
  function partsForPose(pose){
    const g=geometry(pose);
    return [
      seg('tail_tip',g.tail2,g.tail3,0,.98),seg('tail_mid',g.tail1,g.tail2,1,.99),seg('tail_base',g.tail0,g.tail1,2,1),
      seg('far_rear_upper',g.rearFarRoot,g.rearFarKnee,3,.94),seg('far_rear_lower',g.rearFarKnee,g.rearFarFoot,4,.94),
      seg('far_front_upper',g.frontFarRoot,g.frontFarKnee,5,.94),seg('far_front_lower',g.frontFarKnee,g.frontFarFoot,6,.94),
      seg('torso',g.hip,g.shoulder,7,1),
      seg('near_rear_upper',g.rearNearRoot,g.rearNearKnee,8,1),seg('near_rear_lower',g.rearNearKnee,g.rearNearFoot,9,1),
      seg('near_front_upper',g.frontNearRoot,g.frontNearKnee,10,1),seg('near_front_lower',g.frontNearKnee,g.frontNearFoot,11,1),
      seg('head_neck',g.neck,g.head,12,1)
    ];
  }

  window.GameHubFoxRig={
    DEG,TAU,BODY,REST,LIMBS,ATLAS,WALK_STRIDE_WORLD,RUN_STRIDE_WORLD,IDLE_POSE,DEFAULT_FRAMES,RUN_FRAMES,JUMP_FRAMES,
    COLLIDER_STORAGE_KEY,DEFAULT_COLLIDER,normalizedCollider,loadCollider,saveCollider,
    clone,clamp,lerp,normalizedPose,sampleFrames,blendPose,interpolatePose,geometry,partsForPose,atlasRect,solveJoint
  };
})();
