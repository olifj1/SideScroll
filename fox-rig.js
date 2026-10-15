(() => {
  'use strict';

  const DEG = Math.PI / 180;
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const point = (x, y) => ({x:Number(x) || 0, y:Number(y) || 0});
  const distance = (a,b) => Math.hypot(b.x-a.x,b.y-a.y);
  const angle = (a,b) => Math.atan2(b.y-a.y,b.x-a.x);
  const DISTAL_SPLIT = 0.58;

  // v1.0.150 source constants retained as the migration authority. The new
  // rest-rig default is derived from the geometry that these constants actually
  // generated, including the authored upper/lower segment lengths. That is
  // intentionally different from merely copying the approximate guide points.
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

  const LEGACY_LIMBS = Object.freeze({
    rearNear:{root:[BODY.rearNearRootX,BODY.rearNearRootY],knee:[-0.1250,0.1107],foot:[-0.1893,0.0036],upper:BODY.rearNearUpper,lower:BODY.rearNearLower},
    rearFar:{root:[BODY.rearFarRootX,BODY.rearFarRootY],knee:[-0.0393,0.1036],foot:[-0.0393,0.0036],upper:BODY.rearFarUpper,lower:BODY.rearFarLower},
    frontNear:{root:[BODY.frontNearRootX,BODY.frontNearRootY],knee:[0.0964,0.1071],foot:[0.0929,0.0000],upper:BODY.frontNearUpper,lower:BODY.frontNearLower},
    frontFar:{root:[BODY.frontFarRootX,BODY.frontFarRootY],knee:[0.1393,0.1107],foot:[0.1714,0.0000],upper:BODY.frontFarUpper,lower:BODY.frontFarLower}
  });

  function legacyLimbPoints(def) {
    const root = point(def.root[0],def.root[1]);
    const guideKnee = point(def.knee[0],def.knee[1]);
    const guideFoot = point(def.foot[0],def.foot[1]);
    const upperAngle = angle(root,guideKnee);
    const lowerAngle = angle(guideKnee,guideFoot);
    const knee = point(root.x + Math.cos(upperAngle)*def.upper, root.y + Math.sin(upperAngle)*def.upper);
    const paw = point(knee.x + Math.cos(lowerAngle)*def.lower, knee.y + Math.sin(lowerAngle)*def.lower);
    return {root,knee,paw};
  }

  function buildLegacyRestRig() {
    const rn=legacyLimbPoints(LEGACY_LIMBS.rearNear), rf=legacyLimbPoints(LEGACY_LIMBS.rearFar);
    const fn=legacyLimbPoints(LEGACY_LIMBS.frontNear), ff=legacyLimbPoints(LEGACY_LIMBS.frontFar);
    const splitLower=(limb)=>point(lerp(limb.knee.x,limb.paw.x,DISTAL_SPLIT),lerp(limb.knee.y,limb.paw.y,DISTAL_SPLIT));
    const rnHock=splitLower(rn), rfHock=splitLower(rf), fnWrist=splitLower(fn), ffWrist=splitLower(ff);
    const tailRoot=point(BODY.tail0X,BODY.tail0Y);
    const tail1=point(tailRoot.x+Math.cos(REST.tailAngle1)*BODY.tail1,tailRoot.y+Math.sin(REST.tailAngle1)*BODY.tail1);
    const tail2=point(tail1.x+Math.cos(REST.tailAngle2)*BODY.tail2,tail1.y+Math.sin(REST.tailAngle2)*BODY.tail2);
    const tailTip=point(tail2.x+Math.cos(REST.tailAngle3)*BODY.tail3,tail2.y+Math.sin(REST.tailAngle3)*BODY.tail3);
    return {
      schema:'sidescroll.fox.rest-rig.v3',
      family:'quadruped',
      joints:{
        rearBody:point(BODY.hipX,BODY.hipY),
        midRoot:point(BODY.bodyCenterX,BODY.bodyCenterY),
        frontBody:point(BODY.shoulderX,BODY.shoulderY),
        neck:point(BODY.neckX,BODY.neckY),
        head:point(BODY.headX,BODY.headY),
        frontNearSocket:fn.root, frontNearKnee:fn.knee, frontNearWrist:fnWrist, frontNearPaw:fn.paw,
        frontFarSocket:ff.root, frontFarKnee:ff.knee, frontFarWrist:ffWrist, frontFarPaw:ff.paw,
        rearNearSocket:rn.root, rearNearKnee:rn.knee, rearNearHock:rnHock, rearNearPaw:rn.paw,
        rearFarSocket:rf.root, rearFarKnee:rf.knee, rearFarHock:rfHock, rearFarPaw:rf.paw,
        tailRoot, tail1, tail2, tailTip
      }
    };
  }

  const REST_RIG_STORAGE_KEY = 'sidescroll.fox.rig.v3';
  const PREVIOUS_REST_RIG_STORAGE_KEY = 'sidescroll.fox.rig.v2';
  const DEFAULT_REST_RIG = Object.freeze(buildLegacyRestRig());
  const RIG_JOINT_IDS = Object.freeze(Object.keys(DEFAULT_REST_RIG.joints));

  const RIG_DESIGNER = Object.freeze({
    schema:'animlab.rig-designer.v1',
    family:'quadruped',
    bounds:Object.freeze({minX:-0.62,maxX:0.62,minY:-0.18,maxY:0.72}),
    jointGroups:Object.freeze([
      Object.freeze({id:'body',label:'Body / Spine',joints:Object.freeze(['rearBody','midRoot','frontBody','neck','head'])}),
      Object.freeze({id:'frontNear',label:'Front Near',joints:Object.freeze(['frontNearSocket','frontNearKnee','frontNearWrist','frontNearPaw'])}),
      Object.freeze({id:'frontFar',label:'Front Far',joints:Object.freeze(['frontFarSocket','frontFarKnee','frontFarWrist','frontFarPaw'])}),
      Object.freeze({id:'rearNear',label:'Rear Near',joints:Object.freeze(['rearNearSocket','rearNearKnee','rearNearHock','rearNearPaw'])}),
      Object.freeze({id:'rearFar',label:'Rear Far',joints:Object.freeze(['rearFarSocket','rearFarKnee','rearFarHock','rearFarPaw'])}),
      Object.freeze({id:'tail',label:'Tail',joints:Object.freeze(['tailRoot','tail1','tail2','tailTip'])})
    ]),
    labels:Object.freeze({
      rearBody:'Rear Body',midRoot:'Mid Root',frontBody:'Front Body',neck:'Neck',head:'Head',
      frontNearSocket:'Socket',frontNearKnee:'Elbow',frontNearWrist:'Wrist',frontNearPaw:'Paw',
      frontFarSocket:'Socket',frontFarKnee:'Elbow',frontFarWrist:'Wrist',frontFarPaw:'Paw',
      rearNearSocket:'Socket',rearNearKnee:'Knee',rearNearHock:'Hock',rearNearPaw:'Paw',
      rearFarSocket:'Socket',rearFarKnee:'Knee',rearFarHock:'Hock',rearFarPaw:'Paw',
      tailRoot:'Root',tail1:'Tail 1',tail2:'Tail 2',tailTip:'Tip'
    }),
    boneLinks:Object.freeze([
      Object.freeze({a:'rearBody',b:'midRoot',label:'Rear → Mid'}),
      Object.freeze({a:'midRoot',b:'frontBody',label:'Mid → Front'}),
      Object.freeze({a:'frontBody',b:'neck',label:'Front → Neck'}),
      Object.freeze({a:'neck',b:'head',label:'Neck → Head'}),
      Object.freeze({a:'frontNearSocket',b:'frontNearKnee',label:'Front Near Upper'}),
      Object.freeze({a:'frontNearKnee',b:'frontNearWrist',label:'Front Near Forearm'}),
      Object.freeze({a:'frontNearWrist',b:'frontNearPaw',label:'Front Near Paw'}),
      Object.freeze({a:'frontFarSocket',b:'frontFarKnee',label:'Front Far Upper'}),
      Object.freeze({a:'frontFarKnee',b:'frontFarWrist',label:'Front Far Forearm'}),
      Object.freeze({a:'frontFarWrist',b:'frontFarPaw',label:'Front Far Paw'}),
      Object.freeze({a:'rearNearSocket',b:'rearNearKnee',label:'Rear Near Thigh'}),
      Object.freeze({a:'rearNearKnee',b:'rearNearHock',label:'Rear Near Shin'}),
      Object.freeze({a:'rearNearHock',b:'rearNearPaw',label:'Rear Near Paw'}),
      Object.freeze({a:'rearFarSocket',b:'rearFarKnee',label:'Rear Far Thigh'}),
      Object.freeze({a:'rearFarKnee',b:'rearFarHock',label:'Rear Far Shin'}),
      Object.freeze({a:'rearFarHock',b:'rearFarPaw',label:'Rear Far Paw'}),
      Object.freeze({a:'tailRoot',b:'tail1',label:'Tail Base'}),
      Object.freeze({a:'tail1',b:'tail2',label:'Tail Mid'}),
      Object.freeze({a:'tail2',b:'tailTip',label:'Tail Tip'})
    ]),
    symmetryPairs:Object.freeze([
      Object.freeze(['frontNearSocket','frontFarSocket']),
      Object.freeze(['frontNearKnee','frontFarKnee']),
      Object.freeze(['frontNearWrist','frontFarWrist']),
      Object.freeze(['frontNearPaw','frontFarPaw']),
      Object.freeze(['rearNearSocket','rearFarSocket']),
      Object.freeze(['rearNearKnee','rearFarKnee']),
      Object.freeze(['rearNearHock','rearFarHock']),
      Object.freeze(['rearNearPaw','rearFarPaw'])
    ]),
    groundContacts:Object.freeze(['frontNearPaw','frontFarPaw','rearNearPaw','rearFarPaw']),
    // Stable two-bone IK bend branch per limb. Front knees solve on the + side
    // of the socket→paw line; rear hocks solve on the - side. Keeping this in
    // the rig-family descriptor prevents frame-by-frame branch selection from
    // making knees/hocks snap backwards and forwards near ambiguous targets.
    ikBendSides:Object.freeze({frontNear:1,frontFar:1,rearNear:-1,rearFar:-1})
  });

  function normalizedRestRig(value = null) {
    const raw = value?.joints && typeof value.joints === 'object' ? value.joints : {};
    const joints = {};
    for (const id of RIG_JOINT_IDS) {
      const fallback = DEFAULT_REST_RIG.joints[id];
      const candidate = raw[id];
      const x = Number(candidate?.x), y = Number(candidate?.y);
      joints[id] = point(Number.isFinite(x)?x:fallback.x,Number.isFinite(y)?y:fallback.y);
    }
    for (const [id,a,b] of [
      ['frontNearWrist','frontNearKnee','frontNearPaw'],['frontFarWrist','frontFarKnee','frontFarPaw'],
      ['rearNearHock','rearNearKnee','rearNearPaw'],['rearFarHock','rearFarKnee','rearFarPaw']
    ]) {
      if (raw[id] && Number.isFinite(Number(raw[id].x)) && Number.isFinite(Number(raw[id].y))) continue;
      joints[id] = point(lerp(joints[a].x,joints[b].x,DISTAL_SPLIT),lerp(joints[a].y,joints[b].y,DISTAL_SPLIT));
    }
    return {schema:'sidescroll.fox.rest-rig.v3',family:'quadruped',joints};
  }

  function readRestRig() {
    try {
      if (typeof localStorage === 'undefined') return normalizedRestRig(DEFAULT_REST_RIG);
      const current = JSON.parse(localStorage.getItem(REST_RIG_STORAGE_KEY) || 'null');
      if (current) return normalizedRestRig(current);
      const previous = JSON.parse(localStorage.getItem(PREVIOUS_REST_RIG_STORAGE_KEY) || 'null');
      return normalizedRestRig(previous || DEFAULT_REST_RIG);
    } catch (_) { return normalizedRestRig(DEFAULT_REST_RIG); }
  }

  let activeRestRig = readRestRig();
  function loadRestRig() { return clone(activeRestRig); }
  function saveRestRig(value) {
    const rig = normalizedRestRig(value);
    activeRestRig = rig;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(REST_RIG_STORAGE_KEY,JSON.stringify(rig)); } catch (_) {}
    return clone(rig);
  }
  function resetRestRig() { return normalizedRestRig(DEFAULT_REST_RIG); }

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
    try {
      if (typeof localStorage === 'undefined') return normalizedCollider();
      return normalizedCollider(JSON.parse(localStorage.getItem(COLLIDER_STORAGE_KEY) || 'null'));
    } catch (_) { return normalizedCollider(); }
  }
  function saveCollider(value) {
    const collider = normalizedCollider(value);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(COLLIDER_STORAGE_KEY, JSON.stringify(collider)); } catch (_) {}
    return collider;
  }

  const ATLAS = Object.freeze({
    width: 2048,
    height: 2048,
    fileUrl: 'fox-rig-atlas-v2.png?v=1.0.157',
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
      far_rear_lower_prox:{x:24,y:1060,w:149,h:222,a0:[0.5167785235,0.1261261261],a1:[0.5167785235,0.491891891906]},
      far_rear_lower_dist:{x:197,y:1060,w:149,h:222,a0:[0.5167785235,0.491891891906],a1:[0.5167785235,0.7567567568]},
      far_front_lower_prox:{x:388,y:1060,w:149,h:246,a0:[0.2013422819,0.1138211382],a1:[0.376510067124,0.479268292664]},
      far_front_lower_dist:{x:561,y:1060,w:149,h:246,a0:[0.376510067124,0.479268292664],a1:[0.5033557047,0.743902439]},
      near_rear_lower_prox:{x:752,y:1060,w:150,h:240,a0:[0.7933333333,0.125],a1:[0.4453333333,0.4875]},
      near_rear_lower_dist:{x:926,y:1060,w:150,h:240,a0:[0.4453333333,0.4875],a1:[0.1933333333,0.75]},
      near_front_lower_prox:{x:1118,y:1060,w:92,h:242,a0:[0.3260869565,0.1198347107],a1:[0.294565217362,0.479338842964]},
      near_front_lower_dist:{x:1234,y:1060,w:92,h:242,a0:[0.294565217362,0.479338842964],a1:[0.2717391304,0.7396694215]},
      head_neck:{x:1042,y:415,w:394,h:478,a0:[0.4314720812,0.5376569038],a1:[0.6598984772,0.3598326360]}
    })
  });

  function atlasRect(name) {
    const p = ATLAS.parts[name];
    return p ? {...p} : null;
  }

  function rotPoint(pt, center, angleValue, dx = 0, dy = 0) {
    const x = pt.x - center.x, y = pt.y - center.y;
    const c = Math.cos(angleValue), s = Math.sin(angleValue);
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

  // Compatibility view of the legacy limb descriptor. Runtime geometry now uses
  // the saved rest-rig points directly, but external code may still inspect it.
  const LIMBS = Object.freeze(clone(LEGACY_LIMBS));
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
      frontBodyLift:0,rearBodyLift:0,
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
    name:'Idle',travel:0,key:true,bodyBob:0,frontBodyLift:0,rearBodyLift:0,bodyPitch:0,headPitch:0,tailBase:0,tailMid:0,tailTip:0,
    rnUpper:0,rnLower:0,rfUpper:0,rfLower:0,fnUpper:0,fnLower:0,ffUpper:0,ffLower:0
  });

  function jumpKey(i){
    const tuck=[0,.10,.25,.70,1,.65,.25,0][i];
    const launch=[0,.55,1,.6,0,-.35,-.65,0][i];
    return {
      name:['Compress','Takeoff','Trail','Tuck','Apex','Open','Extend','Land'][i],travel:i/8,key:true,
      bodyBob:[-.010,-.003,.008,.015,.018,.010,.000,-.010][i],frontBodyLift:0,rearBodyLift:0,
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

  const IK_PREFIXES=Object.freeze(['fn','ff','rn','rf']);
  const IK_NUMERIC_KEYS=IK_PREFIXES.flatMap(prefix=>[
    `${prefix}IkX`,`${prefix}IkY`,`${prefix}IkWeight`
  ]);
  const NUMERIC_KEYS=[
    'bodyBob','frontBodyLift','rearBodyLift','bodyPitch','neckPitch','headPitch','tailBase','tailMid','tailTip',
    'rnUpper','rnLower','rfUpper','rfLower','fnUpper','fnLower','ffUpper','ffLower','rnDistal','rfDistal','fnDistal','ffDistal','travel',
    ...IK_NUMERIC_KEYS
  ];

  function defaultIkPoint(prefix){
    const map={
      fn:DEFAULT_REST_RIG.joints.frontNearPaw,
      ff:DEFAULT_REST_RIG.joints.frontFarPaw,
      rn:DEFAULT_REST_RIG.joints.rearNearPaw,
      rf:DEFAULT_REST_RIG.joints.rearFarPaw
    };
    return map[prefix] || {x:0,y:0};
  }

  function blendPose(a,b,t){
    if(t<=.001)return clone(a); if(t>=.999)return clone(b);
    const out={...clone(a),name:t<.5?a.name:b.name,key:false};
    for(const k of NUMERIC_KEYS) out[k]=lerp(Number(a[k])||0,Number(b[k])||0,t);
    // v1.0.156: Plant/Release is no longer an authoring state. Paw targets are
    // ordinary persistent IK channels that interpolate just like body motion.
    for(const prefix of IK_PREFIXES){out[`${prefix}Planted`]=false;out[`${prefix}PlantPhase`]=0;}
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
  const WALK_EXAMPLE_ID = 'fox-walk-example-v3';
  // Eight readable body/head/tail templates. v1.0.156 rebuilds every leg as a
  // continuously active paw IK target; there is no stance/swing mode switch.
  const WALK_EXAMPLE_KEYS = Object.freeze([
  {
    "frame": 0,
    "name": "Rear near contact",
    "pose": {
      "name": "Rear near contact",
      "travel": 0,
      "key": true,
      "bodyBob": 0.002,
      "frontBodyLift": 0.003,
      "rearBodyLift": -0.003,
      "bodyPitch": 0.008726646,
      "headPitch": -0.015707963,
      "tailBase": -0.034906585,
      "tailMid": -0.017453293,
      "tailTip": 0.034906585,
      "rnUpper": 0.304103626392975,
      "rnLower": 1.5316473031227613,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 1,
      "rnPlantPhase": 0,
      "rnPlanted": true,
      "rfUpper": -0.7535349433661931,
      "rfLower": 0.2552125637361981,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 1,
      "rfPlantPhase": 0.5,
      "rfPlanted": true,
      "fnUpper": 0.507722407289354,
      "fnLower": -0.9356361164914186,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 0,
      "fnPlantPhase": 0.25,
      "fnPlanted": false,
      "ffUpper": 0.3776756539030905,
      "ffLower": -0.6725278058498085,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 1,
      "ffPlantPhase": 0.75,
      "ffPlanted": true
    }
  },
  {
    "frame": 2,
    "name": "Rear far lift",
    "pose": {
      "name": "Rear far lift",
      "travel": 0.125,
      "key": true,
      "bodyBob": -0.004,
      "frontBodyLift": 0.006,
      "rearBodyLift": 0.001,
      "bodyPitch": -0.003490659,
      "headPitch": 0.006981317,
      "tailBase": -0.06981317,
      "tailMid": -0.06981317,
      "tailTip": -0.017453293,
      "rnUpper": 0.09518339195023306,
      "rnLower": 1.4725673416585312,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 1,
      "rnPlantPhase": 0,
      "rnPlanted": true,
      "rfUpper": -0.812929603682428,
      "rfLower": 0.041372843550264375,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 0,
      "rfPlantPhase": 0.5,
      "rfPlanted": false,
      "fnUpper": 1.0110424121141788,
      "fnLower": -0.44023477867500016,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 0,
      "fnPlantPhase": 0.25,
      "fnPlanted": false,
      "ffUpper": 0.2787460029538916,
      "ffLower": -0.8554269775543341,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 1,
      "ffPlantPhase": 0.75,
      "ffPlanted": true
    }
  },
  {
    "frame": 4,
    "name": "Front near contact",
    "pose": {
      "name": "Front near contact",
      "travel": 0.25,
      "key": true,
      "bodyBob": 0.003,
      "frontBodyLift": 0.001,
      "rearBodyLift": 0.007,
      "bodyPitch": -0.015707963,
      "headPitch": 0.026179939,
      "tailBase": -0.052359878,
      "tailMid": -0.104719755,
      "tailTip": -0.087266463,
      "rnUpper": -0.010814606081797622,
      "rnLower": 1.2802774251782045,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 1,
      "rnPlantPhase": 0,
      "rnPlanted": true,
      "rfUpper": -0.9328927919667084,
      "rfLower": 0.5156612224747169,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 0,
      "rfPlantPhase": 0.5,
      "rfPlanted": false,
      "fnUpper": 0.6581697033519246,
      "fnLower": 0.11838338021346873,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 1,
      "fnPlantPhase": 0.25,
      "fnPlanted": true,
      "ffUpper": 0.09431638142751997,
      "ffLower": -0.9653291922045871,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 1,
      "ffPlantPhase": 0.75,
      "ffPlanted": true
    }
  },
  {
    "frame": 6,
    "name": "Front far lift",
    "pose": {
      "name": "Front far lift",
      "travel": 0.375,
      "key": true,
      "bodyBob": -0.003,
      "frontBodyLift": -0.006,
      "rearBodyLift": 0.004,
      "bodyPitch": -0.005235988,
      "headPitch": 0.012217305,
      "tailBase": 0,
      "tailMid": -0.052359878,
      "tailTip": -0.122173048,
      "rnUpper": -0.2443969751549461,
      "rnLower": 1.1726448401382008,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 1,
      "rnPlantPhase": 0,
      "rnPlanted": true,
      "rfUpper": -0.5248676324998788,
      "rfLower": 1.00032350973706,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 0,
      "rfPlantPhase": 0.5,
      "rfPlanted": false,
      "fnUpper": 0.7442553070273249,
      "fnLower": -0.21755929428200985,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 1,
      "fnPlantPhase": 0.25,
      "fnPlanted": true,
      "ffUpper": -0.06918264483890649,
      "ffLower": -1.1564746609401633,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 0,
      "ffPlantPhase": 0.75,
      "ffPlanted": false
    }
  },
  {
    "frame": 8,
    "name": "Rear far contact",
    "pose": {
      "name": "Rear far contact",
      "travel": 0.5,
      "key": true,
      "bodyBob": 0.002,
      "frontBodyLift": -0.003,
      "rearBodyLift": -0.002,
      "bodyPitch": 0.010471976,
      "headPitch": -0.017453293,
      "tailBase": 0.052359878,
      "tailMid": 0.017453293,
      "tailTip": -0.034906585,
      "rnUpper": -0.4075205388436382,
      "rnLower": 0.9830890405545434,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 1,
      "rnPlantPhase": 0,
      "rnPlanted": true,
      "rfUpper": 0.033749365185490814,
      "rfLower": 0.7180381747271483,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 1,
      "rfPlantPhase": 0.5,
      "rfPlanted": true,
      "fnUpper": 0.5381864836563964,
      "fnLower": -0.38435959379720835,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 1,
      "fnPlantPhase": 0.25,
      "fnPlanted": true,
      "ffUpper": 0.408484198803947,
      "ffLower": -1.2676794701350544,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 0,
      "ffPlantPhase": 0.75,
      "ffPlanted": false
    }
  },
  {
    "frame": 10,
    "name": "Rear near lift",
    "pose": {
      "name": "Rear near lift",
      "travel": 0.625,
      "key": true,
      "bodyBob": -0.004,
      "frontBodyLift": 0.001,
      "rearBodyLift": -0.007,
      "bodyPitch": 0.015707963,
      "headPitch": -0.026179939,
      "tailBase": 0.087266463,
      "tailMid": 0.104719755,
      "tailTip": 0.087266463,
      "rnUpper": -0.5884359165194305,
      "rnLower": 0.8149630781058933,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 0,
      "rnPlantPhase": 0,
      "rnPlanted": false,
      "rfUpper": -0.32852229909216024,
      "rfLower": 0.7966299547206344,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 1,
      "rfPlantPhase": 0.5,
      "rfPlanted": true,
      "fnUpper": 0.3920884957767231,
      "fnLower": -0.5708325831401769,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 1,
      "fnPlantPhase": 0.25,
      "fnPlanted": true,
      "ffUpper": 0.8812111042948209,
      "ffLower": -0.7756778442439839,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 0,
      "ffPlantPhase": 0.75,
      "ffPlanted": false
    }
  },
  {
    "frame": 12,
    "name": "Front far contact",
    "pose": {
      "name": "Front far contact",
      "travel": 0.75,
      "key": true,
      "bodyBob": 0.003,
      "frontBodyLift": 0.007,
      "rearBodyLift": -0.001,
      "bodyPitch": 0.003490659,
      "headPitch": -0.006981317,
      "tailBase": 0.052359878,
      "tailMid": 0.122173048,
      "tailTip": 0.174532925,
      "rnUpper": -0.6235436348187852,
      "rnLower": 1.1966414393734885,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 0,
      "rnPlantPhase": 0,
      "rnPlanted": false,
      "rfUpper": -0.42779611204784806,
      "rfLower": 0.5824895659904039,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 1,
      "rfPlantPhase": 0.5,
      "rfPlanted": true,
      "fnUpper": 0.10982657783218486,
      "fnLower": -0.5775490831896001,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 1,
      "fnPlantPhase": 0.25,
      "fnPlanted": true,
      "ffUpper": 0.44230020906534195,
      "ffLower": -0.1886225593883536,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 1,
      "ffPlantPhase": 0.75,
      "ffPlanted": true
    }
  },
  {
    "frame": 14,
    "name": "Front near lift",
    "pose": {
      "name": "Front near lift",
      "travel": 0.875,
      "key": true,
      "bodyBob": -0.003,
      "frontBodyLift": 0.004,
      "rearBodyLift": 0.005,
      "bodyPitch": -0.010471976,
      "headPitch": 0.017453293,
      "tailBase": 0,
      "tailMid": 0.052359878,
      "tailTip": 0.122173048,
      "rnUpper": -0.11072140251434065,
      "rnLower": 1.6710162392295829,
      "rnIkX": 0.0226844155844156,
      "rnIkY": 0,
      "rnIkWeight": 0,
      "rnPlantPhase": 0,
      "rnPlanted": false,
      "rfUpper": -0.5770782911191281,
      "rfLower": 0.4421628894776936,
      "rfIkX": 0.0476844155844156,
      "rfIkY": 0,
      "rfIkWeight": 1,
      "rfPlantPhase": 0.5,
      "rfPlanted": true,
      "fnUpper": -0.02635990516712044,
      "fnLower": -0.7271820469353885,
      "fnIkX": 0.1726844155844156,
      "fnIkY": 0,
      "fnIkWeight": 0,
      "fnPlantPhase": 0.25,
      "fnPlanted": false,
      "ffUpper": 0.5547981614048317,
      "ffLower": -0.48990091687185006,
      "ffIkX": 0.20128441558441562,
      "ffIkY": 0,
      "ffIkWeight": 1,
      "ffPlantPhase": 0.75,
      "ffPlanted": true
    }
  }
].map(entry=>Object.freeze({frame:entry.frame,name:entry.name,pose:Object.freeze(entry.pose)})));

  function circularPhaseDelta(phase,start){ return ((phase-start)%1+1)%1; }
  function runtimeFramesFromWalkKeys(keys,strideLocal=WALK_STRIDE_WORLD/2.31){
    const sorted=[...(keys||[])].sort((a,b)=>a.frame-b.frame),out=[];
    for(let frame=0;frame<16;frame++){
      const exact=sorted.find(key=>key.frame===frame);
      let pose;
      if(exact) pose=clone(exact.pose);
      else {
        let before=null,after=null,bf=-Infinity,af=Infinity,wraps=false;
        for(const key of sorted){if(key.frame<frame&&key.frame>bf){before=key;bf=key.frame;}if(key.frame>frame&&key.frame<af){after=key;af=key.frame;}}
        if(!before){before=sorted[sorted.length-1];bf=before.frame-16;}
        if(!after){after=sorted[0];af=after.frame+16;wraps=true;}
        const t=clamp((frame-bf)/Math.max(.0001,af-bf),0,1);
        const travelB=(wraps||bf<0||af>=16)?(Number(after.pose.travel)||0)+1:Number(after.pose.travel)||0;
        pose=interpolatePose(before.pose,after.pose,t,`${before.name} → ${after.name}`,travelB);
      }
      for(const prefix of IK_PREFIXES){pose[`${prefix}Planted`]=false;pose[`${prefix}PlantPhase`]=0;}
      pose.key=frame%2===0;out.push(pose);
    }
    return out;
  }
  const WALK_EXAMPLE_DEFAULT_KEYS=buildExampleWalkKeys(DEFAULT_REST_RIG,WALK_STRIDE_WORLD/2.31);
  const DEFAULT_FRAMES=runtimeFramesFromWalkKeys(WALK_EXAMPLE_DEFAULT_KEYS);
  const RUN_FRAMES=Array.from({length:16},(_,i)=>({...locomotionPose(i/16,'run'),key:i%2===0}));
  const JUMP_FRAMES=buildFramesFromKeys(Array.from({length:8},(_,i)=>jumpKey(i)));

  function normalizedPose(p,i=0){
    const d=DEFAULT_FRAMES[i%16];
    const out={...clone(d),...clone(p||{}),key:i%2===0};
    const supplied=(p&&typeof p==='object')?p:null;
    for(const prefix of IK_PREFIXES){
      const point=defaultIkPoint(prefix);
      const xKey=`${prefix}IkX`,yKey=`${prefix}IkY`,wKey=`${prefix}IkWeight`;
      // Do not let legacy Run/Jump poses inherit the Walk's active targets just
      // because DEFAULT_FRAMES is the normalisation template.
      if(supplied && !Object.prototype.hasOwnProperty.call(supplied,xKey)) out[xKey]=point.x;
      if(supplied && !Object.prototype.hasOwnProperty.call(supplied,yKey)) out[yKey]=point.y;
      if(supplied && !Object.prototype.hasOwnProperty.call(supplied,wKey)) out[wKey]=0;
      if(!Number.isFinite(Number(out[xKey]))) out[xKey]=point.x;
      if(!Number.isFinite(Number(out[yKey]))) out[yKey]=point.y;
      if(!Number.isFinite(Number(out[wKey]))) out[wKey]=0;
      out[wKey]=clamp(Number(out[wKey])||0,0,1);
      out[`${prefix}PlantPhase`]=0;
      out[`${prefix}Planted`]=false;
    }
    for(const k of NUMERIC_KEYS) if(!Number.isFinite(Number(out[k]))) out[k]=Number(d[k])||0;
    return out;
  }
  function sampleFrames(frames,phase){
    const p=((phase%1)+1)%1*16,i=Math.floor(p)%16,t=p-Math.floor(p),j=(i+1)%16;
    const a=normalizedPose(frames[i],i),b=normalizedPose(frames[j],j),travelB=j===0?1:b.travel;
    return interpolatePose(a,b,t,a.name,travelB);
  }

  function geometry(pose, restRig = activeRestRig){
    const p=normalizedPose(pose);
    const rest=normalizedRestRig(restRig);
    const j=rest.joints;
    const center=j.midRoot;
    const bodyPoint=id=>rotPoint(j[id],center,p.bodyPitch,0,p.bodyBob);
    const shifted=(pt,dy)=>({x:pt.x,y:pt.y+dy});

    const midRoot=bodyPoint('midRoot');
    const rearBody=shifted(bodyPoint('rearBody'),p.rearBodyLift);
    const frontBody=shifted(bodyPoint('frontBody'),p.frontBodyLift);
    const neckRest=shifted(bodyPoint('neck'),p.frontBodyLift);
    const headRest=shifted(bodyPoint('head'),p.frontBodyLift);
    const neck=rotPoint(neckRest,frontBody,p.neckPitch);
    const headBase=rotPoint(headRest,frontBody,p.neckPitch);
    const head=rotPoint(headBase,neck,p.headPitch);

    function solveJointStable(root,target,l1,l2,bendSide=1){
      let dx=target.x-root.x,dy=target.y-root.y,d=Math.hypot(dx,dy)||1e-5;
      const minD=Math.abs(l1-l2)+.0005,maxD=l1+l2-.0005,cd=clamp(d,minD,maxD);
      dx*=cd/d;dy*=cd/d;d=cd;
      const resolvedTarget={x:root.x+dx,y:root.y+dy};
      const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
      const ux=dx/d,uy=dy/d,bx=root.x+ux*a,by=root.y+uy*a,px=-uy,py=ux;
      // c1 and c2 are the two valid two-bone solutions. Their signed side
      // relative to root→target is stable (+ for c1, - for c2), so choose the
      // anatomical branch explicitly instead of whichever happens to be nearest
      // to the current FK knee. The old nearest-knee rule could alternate from
      // sample to sample and was the source of visible knee/hock flicking.
      const c1={x:bx+px*h,y:by+py*h},c2={x:bx-px*h,y:by-py*h};
      return{joint:bendSide<0?c2:c1,target:resolvedTarget};
    }

    function limbGeom(prefix,channelPrefix,upperDelta,lowerDelta,lift){
      const socketId=`${prefix}Socket`,kneeId=`${prefix}Knee`,pawId=`${prefix}Paw`;
      const distalId=prefix.startsWith('front')?`${prefix}Wrist`:`${prefix}Hock`;
      const root=shifted(bodyPoint(socketId),lift);
      const upperLength=distance(j[socketId],j[kneeId]);
      const middleLength=distance(j[kneeId],j[distalId]);
      const distalLength=distance(j[distalId],j[pawId]);
      const upperAngle=angle(j[socketId],j[kneeId])+p.bodyPitch+upperDelta;
      const middleAngle=angle(j[kneeId],j[distalId])+p.bodyPitch+lowerDelta;
      const distalAngle=angle(j[distalId],j[pawId])+(Number(p[`${channelPrefix}Distal`])||0);
      const fkKnee={x:root.x+Math.cos(upperAngle)*upperLength,y:root.y+Math.sin(upperAngle)*upperLength};
      const fkDistal={x:fkKnee.x+Math.cos(middleAngle)*middleLength,y:fkKnee.y+Math.sin(middleAngle)*middleLength};
      const fkPaw={x:fkDistal.x+Math.cos(distalAngle)*distalLength,y:fkDistal.y+Math.sin(distalAngle)*distalLength};
      const target={x:Number(p[`${channelPrefix}IkX`]),y:Number(p[`${channelPrefix}IkY`])};
      const weight=clamp(Number(p[`${channelPrefix}IkWeight`])||0,0,1);
      if(weight<=.0001 || !Number.isFinite(target.x) || !Number.isFinite(target.y)){
        return{root,knee:fkKnee,distal:fkDistal,paw:fkPaw,fkKnee,fkDistal,fkPaw,ikTarget:fkPaw,ikWeight:0};
      }
      const blendedTarget={x:lerp(fkPaw.x,target.x,weight),y:lerp(fkPaw.y,target.y,weight)};
      const distalVector={x:Math.cos(distalAngle)*distalLength,y:Math.sin(distalAngle)*distalLength};
      const distalTarget={x:blendedTarget.x-distalVector.x,y:blendedTarget.y-distalVector.y};
      const bendSide=Number(RIG_DESIGNER.ikBendSides?.[prefix])||1;
      const solved=solveJointStable(root,distalTarget,upperLength,middleLength,bendSide);
      const paw={x:solved.target.x+distalVector.x,y:solved.target.y+distalVector.y};
      return{root,knee:solved.joint,distal:solved.target,paw,fkKnee,fkDistal,fkPaw,ikTarget:target,ikWeight:weight};
    }
    const rn=limbGeom('rearNear','rn',p.rnUpper,p.rnLower,p.rearBodyLift);
    const rf=limbGeom('rearFar','rf',p.rfUpper,p.rfLower,p.rearBodyLift);
    const fn=limbGeom('frontNear','fn',p.fnUpper,p.fnLower,p.frontBodyLift);
    const ff=limbGeom('frontFar','ff',p.ffUpper,p.ffLower,p.frontBodyLift);

    const tail0=shifted(bodyPoint('tailRoot'),p.rearBodyLift);
    const t1Len=distance(j.tailRoot,j.tail1),t2Len=distance(j.tail1,j.tail2),t3Len=distance(j.tail2,j.tailTip);
    const a1=angle(j.tailRoot,j.tail1)+p.bodyPitch+p.tailBase;
    const tail1={x:tail0.x+Math.cos(a1)*t1Len,y:tail0.y+Math.sin(a1)*t1Len};
    const a2=angle(j.tail1,j.tail2)+p.bodyPitch+p.tailBase*.25+p.tailMid;
    const tail2={x:tail1.x+Math.cos(a2)*t2Len,y:tail1.y+Math.sin(a2)*t2Len};
    const a3=angle(j.tail2,j.tailTip)+p.bodyPitch+p.tailMid*.20+p.tailTip;
    const tail3={x:tail2.x+Math.cos(a3)*t3Len,y:tail2.y+Math.sin(a3)*t3Len};

    return {pose:p,
      rearBody,midRoot,frontBody,hip:rearBody,shoulder:frontBody,neck,head,tail0,tail1,tail2,tail3,
      tailRoot:tail0,tailTip:tail3,
      rearNearRoot:rn.root,rearNearSocket:rn.root,rearNearKnee:rn.knee,rearNearHock:rn.distal,rearNearFoot:rn.paw,rearNearPaw:rn.paw,rearNearIkTarget:rn.ikTarget,rearNearFkPaw:rn.fkPaw,
      rearFarRoot:rf.root,rearFarSocket:rf.root,rearFarKnee:rf.knee,rearFarHock:rf.distal,rearFarFoot:rf.paw,rearFarPaw:rf.paw,rearFarIkTarget:rf.ikTarget,rearFarFkPaw:rf.fkPaw,
      frontNearRoot:fn.root,frontNearSocket:fn.root,frontNearKnee:fn.knee,frontNearWrist:fn.distal,frontNearFoot:fn.paw,frontNearPaw:fn.paw,frontNearIkTarget:fn.ikTarget,frontNearFkPaw:fn.fkPaw,
      frontFarRoot:ff.root,frontFarSocket:ff.root,frontFarKnee:ff.knee,frontFarWrist:ff.distal,frontFarFoot:ff.paw,frontFarPaw:ff.paw,frontFarIkTarget:ff.ikTarget,frontFarFkPaw:ff.fkPaw};
  }


  function buildExampleWalkKeys(restRig=activeRestRig,strideLocal=WALK_STRIDE_WORLD/2.31){
    const rest=normalizedRestRig(restRig);
    const stride=Math.max(.001,Number(strideLocal)||WALK_STRIDE_WORLD/2.31);
    const stance=.625,swing=1-stance;
    const limbs={
      rn:{full:'rearNear',start:0.00,lift:.050},
      fn:{full:'frontNear',start:0.25,lift:.055},
      rf:{full:'rearFar',start:0.50,lift:.046},
      ff:{full:'frontFar',start:0.75,lift:.052}
    };
    return WALK_EXAMPLE_KEYS.map(template=>{
      const phase=template.frame/16;
      const pose=clone(template.pose);
      for(const [prefix,spec] of Object.entries(limbs)){
        const socket=rest.joints[`${spec.full}Socket`];
        const sweep=stance*stride;
        const contactX=socket.x+sweep*.54;
        const releaseX=contactX-sweep;
        const delta=circularPhaseDelta(phase,spec.start);
        let target;
        if(delta<stance-1e-8){
          // Stance is simply an authored target travelling backwards with the
          // ground. Because the target is independent from the torso, body
          // bob/lift can be edited later without dragging the paw with it.
          target={x:contactX-delta*stride,y:0};
        } else {
          const release=(spec.start+stance)%1;
          const t=clamp(circularPhaseDelta(phase,release)/swing,0,1);
          const eased=t*t*(3-2*t);
          target={x:lerp(releaseX,contactX,eased),y:Math.sin(Math.PI*t)*spec.lift};
        }
        pose[`${prefix}IkX`]=target.x;
        pose[`${prefix}IkY`]=target.y;
        pose[`${prefix}IkWeight`]=1;
        pose[`${prefix}PlantPhase`]=0;
        pose[`${prefix}Planted`]=false;
      }
      return {frame:template.frame,name:template.name,pose};
    });
  }
  function buildExampleWalkFrames(restRig=activeRestRig,strideLocal=WALK_STRIDE_WORLD/2.31){
    return runtimeFramesFromWalkKeys(buildExampleWalkKeys(restRig,strideLocal),strideLocal);
  }

  function restGeometry(restRig = activeRestRig) {
    const rest=normalizedRestRig(restRig);
    const out={};
    for (const id of RIG_JOINT_IDS) out[id]=clone(rest.joints[id]);
    return out;
  }

  function seg(name,a,b,layer,alpha=1){return{name,a,b,layer,alpha,kind:'segment'};}
  function partsForPose(pose, restRig = activeRestRig){
    const g=geometry(pose,restRig);
    return [
      seg('tail_tip',g.tail2,g.tail3,0,.98),seg('tail_mid',g.tail1,g.tail2,1,.99),seg('tail_base',g.tail0,g.tail1,2,1),
      seg('far_rear_upper',g.rearFarRoot,g.rearFarKnee,3,.94),seg('far_rear_lower_prox',g.rearFarKnee,g.rearFarHock,4,.94),seg('far_rear_lower_dist',g.rearFarHock,g.rearFarFoot,4.2,.94),
      seg('far_front_upper',g.frontFarRoot,g.frontFarKnee,5,.94),seg('far_front_lower_prox',g.frontFarKnee,g.frontFarWrist,6,.94),seg('far_front_lower_dist',g.frontFarWrist,g.frontFarFoot,6.2,.94),
      // Skeleton-only spine links have no atlas rectangles and are therefore
      // ignored by art/gameplay rendering while remaining visible in Bones.
      seg('__rear_mid',g.rearBody,g.midRoot,6.2,1),seg('__mid_front',g.midRoot,g.frontBody,6.3,1),seg('__front_neck',g.frontBody,g.neck,6.4,1),
      seg('torso',g.rearBody,g.frontBody,7,1),
      seg('near_rear_upper',g.rearNearRoot,g.rearNearKnee,8,1),seg('near_rear_lower_prox',g.rearNearKnee,g.rearNearHock,9,1),seg('near_rear_lower_dist',g.rearNearHock,g.rearNearFoot,9.2,1),
      seg('near_front_upper',g.frontNearRoot,g.frontNearKnee,10,1),seg('near_front_lower_prox',g.frontNearKnee,g.frontNearWrist,11,1),seg('near_front_lower_dist',g.frontNearWrist,g.frontNearFoot,11.2,1),
      seg('head_neck',g.neck,g.head,12,1)
    ];
  }

  window.GameHubFoxRig={
    version:'1.0.157',DEG,TAU,BODY,REST,LIMBS,ATLAS,WALK_STRIDE_WORLD,RUN_STRIDE_WORLD,WALK_EXAMPLE_ID,WALK_EXAMPLE_KEYS:WALK_EXAMPLE_DEFAULT_KEYS,buildExampleWalkKeys,buildExampleWalkFrames,IDLE_POSE,DEFAULT_FRAMES,RUN_FRAMES,JUMP_FRAMES,
    COLLIDER_STORAGE_KEY,DEFAULT_COLLIDER,normalizedCollider,loadCollider,saveCollider,
    REST_RIG_STORAGE_KEY,DEFAULT_REST_RIG,RIG_DESIGNER,normalizedRestRig,loadRestRig,saveRestRig,resetRestRig,restGeometry,
    clone,clamp,lerp,normalizedPose,sampleFrames,blendPose,interpolatePose,geometry,partsForPose,atlasRect,solveJoint,IK_PREFIXES
  };
})();
