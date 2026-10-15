(() => {
  'use strict';

  const HumanRig = window.GameHubWalkRig || null;
  const FoxRig = window.GameHubFoxRig || null;
  const canvas = document.getElementById('animlab-canvas');
  if (!HumanRig || !FoxRig || !canvas) {
    console.error('[Anim Lab] Required rig family or canvas is missing.', { human: !!HumanRig, fox: !!FoxRig, canvas: !!canvas });
    return;
  }

  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const contextEl = $('animlab-context');
  const saveStateEl = $('animlab-save-state');
  const readout = $('animlab-readout');
  const hint = $('animlab-hint');
  const dirtyBadge = $('animlab-dirty');
  const scopeEl = $('animlab-scope');
  const scrub = $('animlab-scrub');
  const timelineDock = $('animlab-timeline-dock');
  const prevBtn = $('animlab-prev');
  const nextBtn = $('animlab-next');
  const playBtn = $('animlab-play');
  const fitBtn = $('animlab-fit');
  const undoBtn = $('animlab-undo');
  const redoBtn = $('animlab-redo');
  const discardBtn = $('animlab-discard');
  const saveBtn = $('animlab-save');
  const guard = $('animlab-guard');
  const guardSave = $('animlab-guard-save');
  const guardDiscard = $('animlab-guard-discard');
  const guardCancel = $('animlab-guard-cancel');
  const characterButtons = [...document.querySelectorAll('[data-character]')];
  const clipButtons = [...document.querySelectorAll('[data-clip]')];
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const viewButtons = [...document.querySelectorAll('[data-view]')];

  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const FOX_CLIPS_KEY = 'sidescroll.animlab.fox.clips.v1';
  const SETUP_KEY = 'sidescroll.animlab.setup.v1';
  const EDITOR_SELECTION_KEY = 'sidescroll.animlab.editor.selection.v1';
  const HUMAN_CLIPS_KEY = 'gamehub.walklab.anim.v6';
  const HUMAN_WALK_KEY = 'gamehub.walklab.anim.v4';
  const HUMAN_PREVIOUS_KEY = 'gamehub.walklab.anim.v5';
  const SPARSE_CLIPS_KEY = 'sidescroll.animlab.sparse.clips.v1';
  const LEGACY_BACKUP_KEY = 'sidescroll.animlab.legacy.samples.backup.v1';
  const SPARSE_SCHEMA = 'animlab.sparse.v1';
  const SETUP_SCALE_MIN = 0.55;
  const SETUP_SCALE_MAX = 2.25;
  const COLLAPSE_STATE_KEY = 'sidescroll.editor.section-collapse.v1';
  const STATIC_REFERENCE_KEY = 'sidescroll.animlab.static-reference.v1';
  const FOX_HANDOFF_SCHEMA = 'sidescroll.animlab.fox-handoff.v1';

  function loadCollapseState() {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_STATE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  const collapseState = loadCollapseState();

  function collapseKeyFor(section, title) {
    return section.dataset.collapseKey || section.id || section.getAttribute('aria-labelledby') || title.id || String(title.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
  }

  function persistCollapseState() {
    try { localStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(collapseState)); }
    catch (_) {}
  }

  function decorateCollapsibleSection(section) {
    if (!section || section.dataset.collapsibleReady === 'true') return;
    const title = [...section.children].find(child => child.classList?.contains('animlab-section-title'));
    if (!title) return;
    const key = collapseKeyFor(section,title);
    if (!key) return;
    section.dataset.collapsibleReady = 'true';
    section.dataset.collapseKey = key;
    title.classList.add('animlab-collapse-toggle');
    title.setAttribute('role','button');
    title.setAttribute('tabindex','0');
    const apply = collapsed => {
      section.classList.toggle('animlab-section-collapsed',!!collapsed);
      title.setAttribute('aria-expanded',String(!collapsed));
      title.setAttribute('aria-label',`${collapsed ? 'Expand' : 'Collapse'} ${String(title.textContent || 'section').trim()}`);
    };
    apply(!!collapseState[key]);
    const toggle = () => {
      const collapsed = !section.classList.contains('animlab-section-collapsed');
      collapseState[key] = collapsed;
      persistCollapseState();
      apply(collapsed);
    };
    title.addEventListener('click',toggle);
    title.addEventListener('keydown',event=>{
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });
  }

  function decorateCollapsibleSections(root = document) {
    if (root.matches?.('.animlab-section')) decorateCollapsibleSection(root);
    root.querySelectorAll?.('.animlab-drawer .animlab-section').forEach(decorateCollapsibleSection);
  }

  decorateCollapsibleSections(document);
  const collapseObserver = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) decorateCollapsibleSections(node);
  });
  collapseObserver.observe(document.querySelector('.animlab-drawer'), {childList:true,subtree:true});

  const CHARACTERS = [
    { id:'original', label:'Hero 1', family:'human', atlas:'walklab-rig-v4.png' },
    { id:'alternate', label:'Hero 2', family:'human', atlas:'walklab-rig-v4-alt-hero2.png' },
    { id:'fox', label:'Fox', family:'fox', atlas:'fox-rig-atlas-v2.png?v=1.0.157' }
  ];
  const characterById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

  function defaultBank(rig) {
    return {
      walk: rig.DEFAULT_FRAMES.map(rig.clone),
      run: rig.RUN_FRAMES.map(rig.clone),
      jump: rig.JUMP_FRAMES.map(rig.clone)
    };
  }

  function loadHumanBank() {
    const bank = defaultBank(HumanRig);
    try {
      const saved = JSON.parse(localStorage.getItem(HUMAN_CLIPS_KEY) || 'null');
      if (saved) {
        for (const name of ['walk','run','jump']) {
          if (Array.isArray(saved[name]) && saved[name].length === 16) bank[name] = saved[name].map((p,i) => HumanRig.normalizedPose(p,i));
        }
      } else {
        const previous = JSON.parse(localStorage.getItem(HUMAN_PREVIOUS_KEY) || 'null');
        if (Array.isArray(previous?.walk) && previous.walk.length === 16) bank.walk = previous.walk.map((p,i) => HumanRig.normalizedPose(p,i));
        else {
          const old = JSON.parse(localStorage.getItem(HUMAN_WALK_KEY) || 'null');
          if (Array.isArray(old?.frames) && old.frames.length === 16) bank.walk = old.frames.map((p,i) => HumanRig.normalizedPose(p,i));
        }
      }
    } catch (err) {
      console.warn('[Anim Lab] Human clip read failed; using current rig defaults.', err);
    }
    return bank;
  }

  function saveHumanBank(bank) {
    const safe = {};
    for (const name of ['walk','run','jump']) safe[name] = bank[name].map((p,i) => HumanRig.normalizedPose(p,i));
    localStorage.setItem(HUMAN_CLIPS_KEY, JSON.stringify({version:14, ...safe}));
    localStorage.setItem(HUMAN_WALK_KEY, JSON.stringify({version:12, frames:safe.walk}));
  }

  function foxExampleStrideLocal() {
    const scale = clamp(Number(setupMap?.fox?.scale) || 1, SETUP_SCALE_MIN, SETUP_SCALE_MAX);
    return (Number(FoxRig.WALK_STRIDE_WORLD) || 0) / Math.max(.001, 2.31 * scale);
  }

  function foxExampleFrames() {
    if (typeof FoxRig.buildExampleWalkFrames === 'function') {
      return FoxRig.buildExampleWalkFrames(FoxRig.loadRestRig?.(), foxExampleStrideLocal()).map((p,i)=>FoxRig.normalizedPose(p,i));
    }
    return FoxRig.DEFAULT_FRAMES.map((p,i)=>FoxRig.normalizedPose(p,i));
  }

  function loadFoxBank() {
    const bank = defaultBank(FoxRig);
    bank.walk = foxExampleFrames();
    try {
      const saved = JSON.parse(localStorage.getItem(FOX_CLIPS_KEY) || 'null');
      if (saved?.clips) {
        // v1.0.154 intentionally replaces pre-example Fox Walk experiments.
        // Run/Jump remain independent and continue to honour their saved banks.
        if (saved.walkFoundationVersion === FoxRig.WALK_EXAMPLE_ID
          && Array.isArray(saved.clips.walk) && saved.clips.walk.length === 16) {
          bank.walk = saved.clips.walk.map((p,i) => FoxRig.normalizedPose(p,i));
        }
        for (const name of ['run','jump']) {
          if (Array.isArray(saved.clips[name]) && saved.clips[name].length === 16) bank[name] = saved.clips[name].map((p,i) => FoxRig.normalizedPose(p,i));
        }
      }
    } catch (err) {
      console.warn('[Anim Lab] Fox editor clip read failed; using the current Fox example/default clips.', err);
    }
    return bank;
  }

  function saveFoxBank(bank) {
    const clips = {};
    for (const name of ['walk','run','jump']) clips[name] = bank[name].map((p,i) => FoxRig.normalizedPose(p,i));
    localStorage.setItem(FOX_CLIPS_KEY, JSON.stringify({
      schema:'animlab.legacy-sampled.v1',
      family:'fox',
      sampleCount:16,
      walkFoundationVersion:FoxRig.WALK_EXAMPLE_ID || null,
      clips
    }));
  }

  const adapters = {
    human: {
      id:'human', label:'Humanoid', rig:HumanRig,
      clipMs:{walk:1050,run:650,jump:935},
      loadBank:loadHumanBank, saveBank:saveHumanBank,
      normalise:(pose, index) => HumanRig.normalizedPose(pose,index),
      defaultPose:(clip,index) => {
        const source = clip === 'run' ? HumanRig.RUN_FRAMES : clip === 'jump' ? HumanRig.JUMP_FRAMES : HumanRig.DEFAULT_FRAMES;
        return HumanRig.normalizedPose(source[index], index);
      },
      collider:() => HumanRig.loadCollider(),
      normaliseCollider:value => HumanRig.normalizedCollider(value),
      saveCollider:value => HumanRig.saveCollider(value),
      scope:'Hero 1 and Hero 2 share the current human animation bank and runtime collider.'
    },
    fox: {
      id:'fox', label:'Fox', rig:FoxRig,
      // Match the actual distance-driven gameplay cadence: cycle time = stride / speed.
      clipMs:{walk:Math.round((Number(FoxRig.WALK_STRIDE_WORLD)||.62)/1.15*1000),run:Math.round((Number(FoxRig.RUN_STRIDE_WORLD)||.92)/2.85*1000),jump:935},
      loadBank:loadFoxBank, saveBank:saveFoxBank,
      normalise:(pose,index) => FoxRig.normalizedPose(pose,index),
      defaultPose:(clip,index) => {
        const source = clip === 'run' ? FoxRig.RUN_FRAMES : clip === 'jump' ? FoxRig.JUMP_FRAMES : FoxRig.DEFAULT_FRAMES;
        return FoxRig.normalizedPose(source[index], index);
      },
      collider:() => FoxRig.loadCollider(),
      normaliseCollider:value => FoxRig.normalizedCollider(value),
      saveCollider:value => FoxRig.saveCollider(value),
      loadRestRig:() => FoxRig.loadRestRig(),
      normaliseRestRig:value => FoxRig.normalizedRestRig(value),
      saveRestRig:value => FoxRig.saveRestRig(value),
      scope:'Fox clips save to the Fox runtime bank; Play uses the last explicitly saved Walk/Run/Jump clips with built-in clips as fallback.'
    }
  };

  function loadSetupMap() {
    try { return JSON.parse(localStorage.getItem(SETUP_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  let setupMap = loadSetupMap();

  function defaultSetupFor(characterId) {
    const character = characterById(characterId);
    const adapter = adapters[character.family];
    const saved = setupMap[characterId] || {};
    const setup = {
      scale: clamp(Number(saved.scale) || 1, SETUP_SCALE_MIN, SETUP_SCALE_MAX),
      // Collider ownership remains with the existing rig family storage. This
      // prevents Hero 1/Hero 2 from showing stale per-character copies while
      // the runtime still shares one human collider.
      collider: adapter.normaliseCollider(adapter.collider())
    };
    // Structural rest-rig data is character-definition data, not clip data and
    // not a duplicate field in the generic Setup storage. The editor receives a
    // working copy here; only explicit Save writes the rig family's own key.
    if (adapter.loadRestRig) setup.rig = adapter.normaliseRestRig(adapter.loadRestRig());
    return setup;
  }

  const banks = { human:loadHumanBank(), fox:loadFoxBank() };
  const legacySamplesAtOpen = clone(banks);

  function normaliseSparseClip(raw, family, clipName, fallbackFrames = banks[family][clipName]) {
    const adapter = adapters[family];
    const keys = [];
    const seen = new Set();
    if (Array.isArray(raw?.keys)) {
      for (const item of raw.keys) {
        const frame = clamp(Math.round(Number(item?.frame)), 0, 15);
        if (!Number.isFinite(frame) || seen.has(frame) || !item?.pose || typeof item.pose !== 'object') continue;
        seen.add(frame);
        keys.push({
          frame,
          name:String(item.name || item.pose?.name || `Key ${frame + 1}`).slice(0,48),
          pose:adapter.normalise(item.pose, frame)
        });
      }
    }
    if (keys.length < 2) {
      keys.length = 0;
      seen.clear();
      (fallbackFrames || []).forEach((pose, frame) => {
        keys.push({frame, name:String(pose?.name || `Frame ${frame + 1}`).slice(0,48), pose:adapter.normalise(pose,frame)});
      });
    }
    keys.sort((a,b) => a.frame - b.frame);
    return {
      schema:SPARSE_SCHEMA,
      family,
      clip:clipName,
      sampleCount:16,
      loop:true,
      source:String(raw?.source || 'legacy-sampled'),
      foundationVersion:String(raw?.foundationVersion || ''),
      interpolation:raw?.interpolation === 'linear' ? 'linear' : (family === 'fox' ? 'smooth' : 'linear'),
      keys
    };
  }

  function importSparseClip(frames, family, clipName) {
    return normaliseSparseClip({source:'legacy-sampled', keys:(frames || []).map((pose,frame) => ({frame,name:pose?.name || `Frame ${frame+1}`,pose}))}, family, clipName, frames);
  }

  function loadSparseBanks() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(SPARSE_CLIPS_KEY) || 'null'); } catch (err) { console.warn('[Anim Lab] Sparse clip read failed; importing sampled clips.', err); }
    const out = {human:{},fox:{}};
    for (const family of ['human','fox']) {
      for (const clipName of ['walk','run','jump']) {
        let raw = stored?.schema === SPARSE_SCHEMA ? stored?.families?.[family]?.[clipName] : null;
        if (family === 'fox' && clipName === 'walk' && FoxRig.WALK_EXAMPLE_ID
          && raw?.foundationVersion !== FoxRig.WALK_EXAMPLE_ID) {
          const keys = typeof FoxRig.buildExampleWalkKeys === 'function'
            ? FoxRig.buildExampleWalkKeys(FoxRig.loadRestRig?.(), foxExampleStrideLocal())
            : FoxRig.WALK_EXAMPLE_KEYS;
          raw = {
            source:'fox-example-walk',
            foundationVersion:FoxRig.WALK_EXAMPLE_ID,
            keys
          };
        }
        out[family][clipName] = raw
          ? normaliseSparseClip(raw,family,clipName,banks[family][clipName])
          : importSparseClip(banks[family][clipName],family,clipName);
      }
    }
    return out;
  }

  let sparseBanks = loadSparseBanks();
  let conversionPreview = null;

  const GAMEPLAY_BASE_CHARACTER_SCALE = 2.31;
  function foxSavedSetupScale() {
    return clamp(Number(setupMap?.fox?.scale) || 1, SETUP_SCALE_MIN, SETUP_SCALE_MAX);
  }
  function foxLocalStride(clipName) {
    const strideWorld = clipName === 'run' ? Number(FoxRig.RUN_STRIDE_WORLD) || 0
      : clipName === 'walk' ? Number(FoxRig.WALK_STRIDE_WORLD) || 0
      : 0;
    return strideWorld / Math.max(.001, GAMEPLAY_BASE_CHARACTER_SCALE * foxSavedSetupScale());
  }
  function hermiteValue(v0,v1,v2,v3,x0,x1,x2,x3,t){
    const span=Math.max(.0001,x2-x1);
    const m1=(v2-v0)/Math.max(.0001,x2-x0);
    const m2=(v3-v1)/Math.max(.0001,x3-x1);
    const t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*v1 + (t3-2*t2+t)*span*m1 + (-2*t3+3*t2)*v2 + (t3-t2)*span*m2;
  }

  function smoothSparsePose(adapter, keys, before, after, beforeFrame, afterFrame, t, frame){
    const n=keys.length, bi=keys.indexOf(before), ai=keys.indexOf(after);
    if(n<3 || bi<0 || ai<0) return null;
    const prev=keys[(bi-1+n)%n], next=keys[(ai+1)%n];
    const back=((before.frame-prev.frame)%16+16)%16 || 16;
    const forward=((next.frame-after.frame)%16+16)%16 || 16;
    const prevFrame=beforeFrame-back, nextFrame=afterFrame+forward;
    const p0=adapter.normalise(prev.pose,prev.frame),p1=adapter.normalise(before.pose,before.frame),p2=adapter.normalise(after.pose,after.frame),p3=adapter.normalise(next.pose,next.frame);
    const linear=adapter.rig.interpolatePose(p1,p2,t,`${before.name} → ${after.name}`,Number(p2.travel)||0);
    const out={...linear};
    for(const key of Object.keys(p1)){
      if(key==='travel' || key.endsWith('IkWeight')) continue;
      const rawVals=[p0[key],p1[key],p2[key],p3[key]];
      if(!rawVals.every(value=>typeof value==='number' && Number.isFinite(value))) continue;
      const vals=rawVals;
      out[key]=hermiteValue(vals[0],vals[1],vals[2],vals[3],prevFrame,beforeFrame,afterFrame,nextFrame,t);
      if(key.endsWith('IkY')) out[key]=Math.max(-.0001,out[key]);
    }
    return adapter.normalise(out,frame);
  }

  function evaluateSparsePose(clipData, frame, family, options = {}) {
    const adapter = adapters[family];
    const keys = [...(clipData?.keys || [])].sort((a,b)=>a.frame-b.frame);
    if (!keys.length) return adapter.defaultPose(clipData?.clip || 'walk', clamp(Math.round(frame),0,15));
    const f = ((Number(frame) % 16) + 16) % 16;
    const exact = keys.find(k => k.frame === f);
    if (exact) {
      let pose = adapter.normalise(exact.pose, f);
      pose.name = exact.name;
      return adapter.normalise(pose,f);
    }
    let before = null, after = null, beforeFrame = -Infinity, afterFrame = Infinity;
    for (const key of keys) {
      if (key.frame < f && key.frame > beforeFrame) { before = key; beforeFrame = key.frame; }
      if (key.frame > f && key.frame < afterFrame) { after = key; afterFrame = key.frame; }
    }
    let wraps = false;
    if (!before) { before = keys[keys.length - 1]; beforeFrame = before.frame - 16; }
    if (!after) { after = keys[0]; afterFrame = after.frame + 16; wraps = true; }
    const span = Math.max(.0001, afterFrame - beforeFrame);
    const t = clamp((f - beforeFrame) / span, 0, 1);
    const a = adapter.normalise(before.pose, before.frame);
    const b = adapter.normalise(after.pose, after.frame);
    const crossesSeam = wraps || beforeFrame < 0 || afterFrame >= 16;
    const travelB = crossesSeam ? (Number(b.travel) || 0) + 1 : Number(b.travel);
    const name = `${before.name} → ${after.name}`;
    let pose = clipData?.interpolation === 'smooth'
      ? smoothSparsePose(adapter,keys,before,after,beforeFrame,afterFrame,t,f)
      : null;
    if(!pose) pose = adapter.rig.interpolatePose(a,b,t,name,travelB);
    // Travel is phase bookkeeping and must remain monotonic even when visual
    // channels use smooth cubic tangents.
    pose.travel = a.travel + (travelB-a.travel)*t;
    pose.name = name;
    return adapter.normalise(pose,f);
  }

  function compileSparseClip(clipData, family) {
    return Array.from({length:16},(_,frame)=>evaluateSparsePose(clipData,frame,family));
  }

  function syncCompiledClip(family, clipName) {
    banks[family][clipName] = compileSparseClip(sparseBanks[family][clipName], family);
  }
  for (const family of ['human','fox']) for (const clipName of ['walk','run','jump']) syncCompiledClip(family,clipName);

  function saveSparseBanks() {
    localStorage.setItem(SPARSE_CLIPS_KEY, JSON.stringify({schema:SPARSE_SCHEMA, sampleCount:16, families:sparseBanks}));
  }

  function ensureLegacyBackup(family, clipName) {
    try {
      const backup = JSON.parse(localStorage.getItem(LEGACY_BACKUP_KEY) || 'null') || {schema:'animlab.legacy-sampled-backup.v1',families:{human:{},fox:{}}};
      backup.families ||= {human:{},fox:{}};
      backup.families[family] ||= {};
      if (!Array.isArray(backup.families[family][clipName])) {
        backup.families[family][clipName] = clone(legacySamplesAtOpen[family][clipName]);
        localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(backup));
      }
    } catch (err) {
      console.warn('[Anim Lab] Could not write legacy sampled backup.', err);
    }
  }

  const atlases = new Map();
  const foxShapeReference = new Image();
  foxShapeReference.onload = () => draw();
  foxShapeReference.onerror = () => console.error('[Anim Lab] Fox shape reference failed to load.');
  foxShapeReference.src = 'fox-reference-charcoal.png?v=1.0.158';
  const view = { zoom:1, panX:0, panY:0 };
  const overlays = { art:true, bones:true, planes:false, collider:false, ground:false, reference:false };
  const pointers = new Map();
  const listeners = new Set();
  const sessionParticipants = new Map();
  let selectedMarkers = [];
  let underlayDraw = null;
  const underlayRenderers = new Map();
  let pluginDraw = null;
  const pluginRenderers = new Map();
  let gesture = null;
  let pendingNavigation = null;
  let playing = false;
  let artOpacity = 1;
  let playPhase = 0;
  let lastAnimTime = performance.now();
  let history = [];
  let future = [];

  function loadEditorSelection() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(EDITOR_SELECTION_KEY) || 'null'); } catch (_) {}
    const gameplay = HumanRig.loadCharacterVariant ? HumanRig.loadCharacterVariant() : 'original';
    const charId = CHARACTERS.some(c => c.id === saved?.characterId) ? saved.characterId : (CHARACTERS.some(c => c.id === gameplay) ? gameplay : 'original');
    return {
      characterId:charId,
      clip:['walk','run','jump'].includes(saved?.clip) ? saved.clip : 'walk',
      mode:saved?.mode === 'setup' ? 'setup' : 'animate',
      frame:Number.isInteger(saved?.frame) ? clamp(saved.frame,0,15) : 0
    };
  }

  const selection = loadEditorSelection();
  let setupDraft = defaultSetupFor(selection.characterId);
  let checkpoint = null;

  function currentCharacter() { return characterById(selection.characterId); }
  function currentAdapter() { return adapters[currentCharacter().family]; }

  function defaultStaticReference(family = currentCharacter().family) {
    return {
      source: family === 'fox' ? 'foxShape' : 'original',
      opacity: family === 'fox' ? 0.38 : 0.24,
      scale: 1,
      offsetX: 0,
      offsetY: 0
    };
  }

  function loadStaticReferenceMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATIC_REFERENCE_KEY) || 'null');
      return parsed?.contexts && typeof parsed.contexts === 'object' ? parsed.contexts : {};
    } catch (_) { return {}; }
  }
  let staticReferenceMap = loadStaticReferenceMap();

  function normaliseStaticReference(value, family = currentCharacter().family) {
    const base = defaultStaticReference(family);
    const raw = value && typeof value === 'object' ? value : {};
    const allowed = ['original','alternate','foxShape'];
    return {
      source: allowed.includes(raw.source) ? raw.source : base.source,
      opacity: clamp(Number(raw.opacity) || base.opacity, 0.05, 1),
      scale: clamp(Number(raw.scale) || base.scale, 0.35, 2.5),
      offsetX: clamp(Number(raw.offsetX) || 0, -1.5, 1.5),
      offsetY: clamp(Number(raw.offsetY) || 0, -0.75, 1)
    };
  }

  function currentStaticReference() {
    const family = currentCharacter().family;
    return normaliseStaticReference(staticReferenceMap[family], family);
  }

  function setStaticReference(patch = {}) {
    const family = currentCharacter().family;
    const next = normaliseStaticReference({...currentStaticReference(), ...patch}, family);
    staticReferenceMap[family] = next;
    try { localStorage.setItem(STATIC_REFERENCE_KEY, JSON.stringify({schema:'animlab.static-reference.v1',contexts:staticReferenceMap})); } catch (_) {}
    draw(); updateUi(); notify();
    return clone(next);
  }
  function currentBank() { return banks[currentCharacter().family]; }
  function currentFrames() { return currentBank()[selection.clip]; }
  function currentSparseClip() { return sparseBanks[currentCharacter().family][selection.clip]; }
  function previewApplies() { return !!conversionPreview && conversionPreview.family === currentCharacter().family && conversionPreview.clip === selection.clip; }
  function displayFrames() { return previewApplies() ? conversionPreview.frames : currentFrames(); }
  function currentPose() {
    if(playing && selection.mode==='animate') return currentAdapter().rig.sampleFrames(displayFrames(),playPhase);
    return displayFrames()[selection.frame];
  }

  function setCurrentSparseClip(value) {
    const family = currentCharacter().family;
    sparseBanks[family][selection.clip] = normaliseSparseClip(value,family,selection.clip,currentFrames());
    syncCompiledClip(family,selection.clip);
  }

  function upsertCurrentKey(frame, pose, preferredName = null) {
    const clipData = clone(currentSparseClip());
    const index = clipData.keys.findIndex(k => k.frame === frame);
    const existing = index >= 0 ? clipData.keys[index] : null;
    const key = {
      frame,
      name:String(preferredName || existing?.name || `Key ${frame + 1}`).slice(0,48),
      pose:currentAdapter().normalise(pose,frame)
    };
    if (index >= 0) clipData.keys[index] = key;
    else clipData.keys.push(key);
    clipData.keys.sort((a,b)=>a.frame-b.frame);
    clipData.source = 'sparse-authored';
    setCurrentSparseClip(clipData);
  }

  function snapshotContext() {
    return {
      characterId:selection.characterId,
      family:currentCharacter().family,
      clip:selection.clip,
      mode:selection.mode,
      sparseClip:clone(currentSparseClip()),
      clipFrames:clone(currentFrames()),
      setup:clone(setupDraft)
    };
  }

  function resetCheckpoint() {
    checkpoint = snapshotContext();
    history = [];
    future = [];
    updateUi();
  }

  function currentRelevantValue(scope = selection.mode === 'setup' ? 'setup' : 'clip') {
    if (scope === 'setup') return clone(setupDraft);
    if (scope === 'sparseClip' || scope === 'clip') return clone(currentSparseClip());
    return clone(currentPose());
  }

  function isDirty() {
    let ownDirty = false;
    if (checkpoint) ownDirty = selection.mode === 'setup'
      ? !same(setupDraft, checkpoint.setup)
      : !same(currentSparseClip(), checkpoint.sparseClip);
    if (ownDirty) return true;
    for (const participant of sessionParticipants.values()) {
      try { if (participant?.isDirty?.()) return true; }
      catch (err) { console.error('[Anim Lab] Session participant dirty check failed.', err); }
    }
    return false;
  }

  function saveEditorSelection() {
    try { sessionStorage.setItem(EDITOR_SELECTION_KEY, JSON.stringify(selection)); } catch (_) {}
  }

  function normaliseCurrentFrame(pose) {
    return currentAdapter().normalise(pose, selection.frame);
  }

  function setScopeValue(scope, value, frameIndex = selection.frame) {
    if (scope === 'setup') {
      const adapter = currentAdapter();
      setupDraft = { scale:clamp(Number(value.scale)||1,SETUP_SCALE_MIN,SETUP_SCALE_MAX), collider:adapter.normaliseCollider(value.collider) };
      if (adapter.normaliseRestRig) setupDraft.rig = adapter.normaliseRestRig(value.rig);
      return;
    }
    if (scope === 'sparseClip' || scope === 'clip') {
      setCurrentSparseClip(value);
      return;
    }
    const index = clamp(Math.round(Number(frameIndex) || 0), 0, 15);
    upsertCurrentKey(index, value);
  }

  function pushHistory(scope, before, after, label, frameIndex = selection.frame) {
    if (same(before, after)) return;
    history.push({scope, before:clone(before), after:clone(after), label:label || 'Edit', frame:frameIndex});
    if (history.length > 80) history.shift();
    future = [];
    updateUi();
  }

  function beginTransaction(scope, label) {
    const resolved = scope === 'setup' ? 'setup' : 'pose';
    if (resolved === 'pose' && previewApplies()) {
      hint.textContent = 'Exit or adopt the conversion preview before editing a pose.';
      return null;
    }
    if (resolved === 'setup') return {scope:'setup', label:label || 'Edit', before:clone(setupDraft), frame:selection.frame};
    const existing = currentSparseClip().keys.find(k=>k.frame===selection.frame);
    return {
      scope:'pose',
      label:label || 'Edit',
      before:clone(evaluateSparsePose(currentSparseClip(),selection.frame,currentCharacter().family,{resolveContacts:false})),
      beforeClip:clone(currentSparseClip()),
      keyName:existing?.name || `Key ${selection.frame + 1}`,
      frame:selection.frame
    };
  }

  function previewTransaction(tx, updater) {
    if (!tx) return;
    if (tx.scope === 'setup') {
      const next = clone(tx.before);
      if (typeof updater === 'function') updater(next);
      else if (updater) Object.assign(next, clone(updater));
      setScopeValue('setup',next,tx.frame);
    } else {
      setCurrentSparseClip(clone(tx.beforeClip));
      const next = clone(tx.before);
      if (typeof updater === 'function') updater(next);
      else if (updater) Object.assign(next, clone(updater));
      upsertCurrentKey(tx.frame,next,tx.keyName);
    }
    draw(); updateUi(); notify();
  }

  function commitTransaction(tx) {
    if (!tx) return;
    if (tx.scope === 'setup') {
      pushHistory('setup',tx.before,clone(setupDraft),tx.label,tx.frame);
    } else {
      pushHistory('sparseClip',tx.beforeClip,clone(currentSparseClip()),tx.label,tx.frame);
    }
    draw(); notify();
  }

  function cancelTransaction(tx) {
    if (!tx) return;
    if (tx.scope === 'setup') setScopeValue('setup',tx.before,tx.frame);
    else setCurrentSparseClip(clone(tx.beforeClip));
    draw(); updateUi(); notify();
  }

  function edit(scope, label, updater) {
    const tx = beginTransaction(scope,label);
    if (!tx) return false;
    previewTransaction(tx, updater);
    commitTransaction(tx);
    return true;
  }

  function editSparseClip(label, updater) {
    if (previewApplies()) {
      hint.textContent = 'Exit or adopt the conversion preview before editing the key track.';
      return false;
    }
    const before = clone(currentSparseClip());
    const next = clone(before);
    if (typeof updater === 'function') updater(next);
    else if (updater) Object.assign(next,clone(updater));
    setCurrentSparseClip(next);
    const after = clone(currentSparseClip());
    pushHistory('sparseClip',before,after,label || 'Edit key track',selection.frame);
    playing = false;
    draw(); updateUi(); notify();
    return !same(before,after);
  }

  function undo() {
    const entry = history.pop();
    if (!entry) return;
    conversionPreview = null;
    const current = entry.scope === 'setup' ? clone(setupDraft) : clone(currentSparseClip());
    setScopeValue(entry.scope, entry.before, entry.frame);
    future.push({...entry, after:current});
    playing = false;
    draw(); updateUi(); notify();
  }

  function redo() {
    const entry = future.pop();
    if (!entry) return;
    conversionPreview = null;
    const current = entry.scope === 'setup' ? clone(setupDraft) : clone(currentSparseClip());
    setScopeValue(entry.scope, entry.after, entry.frame);
    history.push({...entry, before:current});
    playing = false;
    draw(); updateUi(); notify();
  }

  function saveCurrent() {
    try {
      if (selection.mode === 'setup') {
        const character = currentCharacter();
        const adapter = currentAdapter();
        setupDraft.collider = adapter.saveCollider(setupDraft.collider);
        if (adapter.saveRestRig && setupDraft.rig) setupDraft.rig = adapter.saveRestRig(setupDraft.rig);
        // Keep canonical rig/collider ownership with the rig-family storage; the
        // generic Setup map only needs the per-character visual scale.
        setupMap[character.id] = {scale:setupDraft.scale};
        localStorage.setItem(SETUP_KEY, JSON.stringify(setupMap));
        // Fox planted-contact targets are compiled in rig-local units from the
        // gameplay stride. Refresh editor previews when scale changes, but do
        // not rewrite runtime clips until Animate is explicitly Saved.
        if (character.family === 'fox') for (const clipName of ['walk','run','jump']) syncCompiledClip('fox',clipName);
      } else {
        conversionPreview = null;
        ensureLegacyBackup(currentCharacter().family, selection.clip);
        syncCompiledClip(currentCharacter().family, selection.clip);
        saveSparseBanks();
        currentAdapter().saveBank(currentBank());
      }
      for (const participant of sessionParticipants.values()) {
        if (!participant?.save) continue;
        const result = participant.save();
        if (result === false) throw new Error('An Anim Lab extension could not save its working data.');
      }
      resetCheckpoint();
      hint.textContent = 'Saved · working copy checkpoint updated';
      draw(); notify();
      return true;
    } catch (err) {
      console.error('[Anim Lab] Save failed.', err);
      alert(`Anim Lab could not save: ${err.message}`);
      return false;
    }
  }

  function discardCurrent() {
    if (!checkpoint) return;
    conversionPreview = null;
    if (selection.mode === 'setup') setupDraft = clone(checkpoint.setup);
    else setCurrentSparseClip(clone(checkpoint.sparseClip));
    for (const participant of sessionParticipants.values()) {
      try { participant?.discard?.(); }
      catch (err) { console.error('[Anim Lab] Session participant discard failed.', err); }
    }
    history = []; future = [];
    playing = false;
    hint.textContent = 'Discarded · checkpoint restored';
    draw(); updateUi(); notify();
  }

  function guardNavigation(action) {
    if (!isDirty()) { action(); return; }
    pendingNavigation = action;
    guard.hidden = false;
  }

  function finishGuard(kind) {
    const action = pendingNavigation;
    pendingNavigation = null;
    guard.hidden = true;
    if (!action || kind === 'cancel') return;
    if (kind === 'save' && !saveCurrent()) return;
    if (kind === 'discard') discardCurrent();
    action();
  }

  function loadAtlas(characterId) {
    const character = characterById(characterId);
    if (atlases.has(characterId)) return;
    const img = new Image();
    img.onload = () => { atlases.set(characterId,img); draw(); notify(); };
    img.onerror = () => {
      atlases.set(characterId,null);
      console.error(`[Anim Lab] Atlas failed to load for ${character.label}: ${character.atlas}`);
      hint.textContent = `${character.label} art failed to load`;
      draw();
    };
    img.src = character.atlas;
  }
  CHARACTERS.forEach(c => loadAtlas(c.id));

  function switchCharacter(id) {
    if (id === selection.characterId || !CHARACTERS.some(c => c.id === id)) return;
    guardNavigation(() => {
      conversionPreview = null;
      selection.characterId = id;
      setupDraft = defaultSetupFor(id);
      selection.frame = 0; playPhase = 0; playing = false;
      fitView(false); saveEditorSelection(); resetCheckpoint(); draw(); notify();
    });
  }

  function switchClip(name) {
    if (name === selection.clip || !['walk','run','jump'].includes(name)) return;
    guardNavigation(() => {
      conversionPreview = null;
      selection.clip = name; selection.frame = 0; playPhase = 0; playing = false;
      saveEditorSelection(); resetCheckpoint(); draw(); notify();
    });
  }

  function switchMode(mode) {
    if (mode === selection.mode || !['animate','setup'].includes(mode)) return;
    guardNavigation(() => {
      conversionPreview = null;
      selection.mode = mode; playing = false;
      saveEditorSelection(); resetCheckpoint(); draw(); notify();
    });
  }

  function setFrame(index) {
    selection.frame = ((index % 16) + 16) % 16;
    playPhase = selection.frame / 16;
    playing = false;
    saveEditorSelection(); draw(); updateUi(); notify();
  }

  function toggleOverlay(name) {
    if (!(name in overlays)) return;
    overlays[name] = !overlays[name];
    draw(); updateUi(); notify();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function baseView(scaleMultiplier = 1) {
    const W = canvas.width, H = canvas.height;
    const base = Math.min(W * .34, H * .68);
    return {
      scale:base * view.zoom * scaleMultiplier,
      cx:W * (.5 + view.panX),
      groundY:H * (.86 + view.panY),
      flipX:1
    };
  }

  function previewView(phase, scaleMultiplier = setupDraft.scale) {
    const sv = baseView(scaleMultiplier);
    if (selection.mode !== 'animate' || selection.clip !== 'jump') return sv;
    const lift = Math.sin(clamp(phase,0,1) * Math.PI) * .40;
    return {...sv, groundY:sv.groundY - lift * sv.scale};
  }

  function project(pt, sv) { return {x:sv.cx + pt.x * sv.scale, y:sv.groundY - pt.y * sv.scale}; }
  function unproject(pos, sv) { return {x:(pos.x-sv.cx)/sv.scale, y:(sv.groundY-pos.y)/sv.scale}; }

  function drawPart(rig, atlas, part, sv, alpha = 1) {
    const r = rig.atlasRect(part.name); if (!r || !atlas) return;
    const A = project(part.a,sv), B = project(part.b,sv);
    const p0 = {x:r.a0[0]*r.w,y:r.a0[1]*r.h}, p1 = {x:r.a1[0]*r.w,y:r.a1[1]*r.h};
    const svx = p1.x-p0.x, svy = p1.y-p0.y, dvx = B.x-A.x, dvy = B.y-A.y;
    const sl = Math.hypot(svx,svy)||1, dl = Math.hypot(dvx,dvy)||1;
    const sc = dl/sl, rot = Math.atan2(dvy,dvx)-Math.atan2(svy,svx);
    ctx.save(); ctx.globalAlpha *= (part.alpha ?? 1) * alpha; ctx.translate(A.x,A.y); ctx.rotate(rot); ctx.scale(sc,sc);
    ctx.drawImage(atlas,r.x,r.y,r.w,r.h,-p0.x,-p0.y,r.w,r.h); ctx.restore();
  }

  function displayRestRig(adapter = currentAdapter()) {
    return adapter.id === 'fox' && selection.mode === 'setup' ? setupDraft.rig : undefined;
  }

  function drawRigArt(character, adapter, pose, sv, alpha = 1) {
    const atlas = atlases.get(character.id);
    if (!atlas) return;
    if (adapter.id === 'human' && typeof HumanRig.drawCanvas === 'function') HumanRig.drawCanvas(ctx,atlas,pose,sv,{alpha});
    else adapter.rig.partsForPose(pose,displayRestRig(adapter)).forEach(part => drawPart(adapter.rig,atlas,part,sv,alpha));
  }

  function drawBones(adapter, pose, sv, alpha = 1) {
    const parts = adapter.rig.partsForPose(pose,displayRestRig(adapter));
    ctx.save();
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=Math.max(2,sv.scale*.012);
    for (const part of parts) {
      const name=String(part.name||'');
      const near=adapter.id==='fox' && name.startsWith('near_');
      const far=adapter.id==='fox' && name.startsWith('far_');
      const bone=near?`rgba(126,216,199,${.92*alpha})`:far?`rgba(188,197,199,${.72*alpha})`:`rgba(220,228,225,${.76*alpha})`;
      const jointFill=near?`rgba(31,49,50,${.96*alpha})`:far?`rgba(91,101,104,${.92*alpha})`:`rgba(245,241,236,${.94*alpha})`;
      const jointStroke=near?`rgba(126,216,199,${.98*alpha})`:far?`rgba(206,214,216,${.92*alpha})`:`rgba(47,61,66,${.85*alpha})`;
      const A=project(part.a,sv), B=project(part.b,sv);
      ctx.strokeStyle=bone;ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();
      ctx.fillStyle=jointFill;ctx.strokeStyle=jointStroke;
      ctx.beginPath(); ctx.arc(A.x,A.y,Math.max(2.5,sv.scale*.011),0,Math.PI*2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function transformedPlane(rig, part, sv) {
    const r=rig.atlasRect(part.name); if(!r)return null;
    const A=project(part.a,sv),B=project(part.b,sv);
    const p0={x:r.a0[0]*r.w,y:r.a0[1]*r.h},p1={x:r.a1[0]*r.w,y:r.a1[1]*r.h};
    const svx=p1.x-p0.x,svy=p1.y-p0.y,dvx=B.x-A.x,dvy=B.y-A.y;
    const sl=Math.hypot(svx,svy)||1,dl=Math.hypot(dvx,dvy)||1,sc=dl/sl,rot=Math.atan2(dvy,dvx)-Math.atan2(svy,svx),co=Math.cos(rot),si=Math.sin(rot);
    const tr=(x,y)=>{const lx=(x-p0.x)*sc,ly=(y-p0.y)*sc;return{x:A.x+lx*co-ly*si,y:A.y+lx*si+ly*co};};
    return [tr(0,0),tr(r.w,0),tr(r.w,r.h),tr(0,r.h)];
  }

  function drawPlanes(adapter, pose, sv) {
    ctx.save(); ctx.strokeStyle='rgba(102,139,133,.56)';ctx.lineWidth=Math.max(1,canvas.width*.0015);ctx.setLineDash([6,4]);
    for (const part of adapter.rig.partsForPose(pose,displayRestRig(adapter))) {
      const q=transformedPlane(adapter.rig,part,sv); if(!q)continue;
      ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);for(let i=1;i<q.length;i++)ctx.lineTo(q[i].x,q[i].y);ctx.closePath();ctx.stroke();
    }
    ctx.restore();
  }

  function drawCollider(sv) {
    if (!overlays.collider) return;
    const c = setupDraft.collider;
    const r=c.radius*sv.scale, bottom=sv.groundY-c.bottom*sv.scale, top=sv.groundY-(c.bottom+c.height)*sv.scale, cx=sv.cx+c.offsetX*sv.scale;
    const rr=Math.min(r,Math.max(4,(bottom-top)*.48));
    ctx.save();ctx.fillStyle='rgba(91,142,135,.13)';ctx.strokeStyle='rgba(82,126,121,.92)';ctx.lineWidth=Math.max(2,canvas.width*.0022);ctx.setLineDash([7,4]);
    ctx.beginPath();ctx.moveTo(cx-rr,top+rr);ctx.arc(cx,top+rr,rr,Math.PI,0);ctx.lineTo(cx+rr,bottom-rr);ctx.arc(cx,bottom-rr,rr,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.setLineDash([]);ctx.strokeStyle='rgba(200,139,74,.88)';ctx.beginPath();ctx.moveTo(cx-c.footProbe*sv.scale,bottom+5);ctx.lineTo(cx+c.footProbe*sv.scale,bottom+5);ctx.stroke();ctx.restore();
  }

  function drawGroundAndRuler(sv) {
    if (!overlays.ground) return;
    ctx.save();
    ctx.strokeStyle='rgba(114,230,208,.92)';ctx.lineWidth=Math.max(1.5,canvas.width*.0017);ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(0,sv.groundY);ctx.lineTo(canvas.width,sv.groundY);ctx.stroke();ctx.setLineDash([]);
    const step=.25*sv.scale;
    ctx.fillStyle='rgba(186,251,240,.78)';ctx.font=`700 ${Math.max(9,canvas.height*.024)}px system-ui,sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText('GROUND · Y = 0.00 m',12,sv.groundY-10);
    ctx.strokeStyle='rgba(186,251,240,.40)';
    for(let i=1;i<=4;i++){
      const y=sv.groundY-i*step;ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(20,y);ctx.stroke();ctx.fillText(`${(i*.25).toFixed(2)} m`,24,y);
    }
    ctx.restore();
  }

  function drawReference(sv) {
    if (!overlays.reference) return;
    const settings = currentStaticReference();
    const refScale = settings.scale;
    const refView = {
      ...sv,
      scale:sv.scale * refScale,
      cx:sv.cx + settings.offsetX * sv.scale,
      groundY:sv.groundY - settings.offsetY * sv.scale
    };

    ctx.save();
    ctx.globalAlpha = settings.opacity;
    ctx.imageSmoothingEnabled = true;

    if (settings.source === 'foxShape') {
      if (foxShapeReference.complete && foxShapeReference.naturalWidth) {
        // The trimmed source is a neutral side-profile reference. Its default
        // width is mapped to the legacy Fox head-to-tail local span, then the
        // author can align it non-destructively with Scale / X / Y.
        const baseLocalWidth = 0.72;
        const width = baseLocalWidth * refView.scale;
        const height = width * (foxShapeReference.naturalHeight / foxShapeReference.naturalWidth);
        const x = refView.cx - width * 0.5;
        const y = refView.groundY - height;
        ctx.drawImage(foxShapeReference,x,y,width,height);
      }
    } else {
      const id = settings.source === 'alternate' ? 'alternate' : 'original';
      const atlas = atlases.get(id);
      if (atlas) {
        const pose=HumanRig.normalizedPose(HumanRig.DEFAULT_FRAMES[0],0);
        HumanRig.drawCanvas(ctx,atlas,pose,refView,{alpha:1});
        drawBones(adapters.human,pose,refView,.22);
      }
    }
    ctx.restore();
  }

  function drawSelectedMarkers(sv) {
    if (!selectedMarkers.length) return;
    ctx.save();
    for (const marker of selectedMarkers) {
      const p=project(marker,sv);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(8,sv.scale*.028),0,Math.PI*2);ctx.fillStyle='rgba(111,143,137,.28)';ctx.fill();ctx.strokeStyle='#5f817b';ctx.lineWidth=Math.max(2,sv.scale*.006);ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    resize();
    const character=currentCharacter(),adapter=currentAdapter(),frames=displayFrames();
    const phase=playing?playPhase:selection.frame/16;
    const pose=selection.mode==='setup' && adapter.id==='fox' && adapter.rig.IDLE_POSE
      ? adapter.rig.clone(adapter.rig.IDLE_POSE)
      : (playing?adapter.rig.sampleFrames(frames,playPhase):currentPose());
    const sv=previewView(phase);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const bg=ctx.createLinearGradient(0,0,0,canvas.height);bg.addColorStop(0,'#26333a');bg.addColorStop(1,'#11191e');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
    const gridView=baseView(1),step=Math.max(28,gridView.scale*.25);
    ctx.save();ctx.strokeStyle='rgba(219,233,228,.055)';ctx.lineWidth=1;
    const x0=((gridView.cx%step)+step)%step;for(let x=x0;x<canvas.width;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}for(let x=x0-step;x>0;x-=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
    const y0=((gridView.groundY%step)+step)%step;for(let y=y0;y<canvas.height;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}for(let y=y0-step;y>0;y-=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}ctx.restore();
    const underlayArgs={ctx,canvas,pose,adapter,character,view:sv,gridView,project,phase};
    for (const renderer of underlayRenderers.values()) {
      try { renderer(underlayArgs); } catch (err) { console.error('[Anim Lab] Underlay renderer failed.',err); }
    }
    if (typeof underlayDraw === 'function') underlayDraw(underlayArgs);
    drawGroundAndRuler(gridView);
    drawReference(sv);
    if(overlays.art) drawRigArt(character,adapter,pose,sv,.99*artOpacity);
    if(overlays.planes) drawPlanes(adapter,pose,sv);
    if(overlays.collider) drawCollider(sv);
    if(overlays.bones) drawBones(adapter,pose,sv,1);
    drawSelectedMarkers(sv);
    const renderArgs={ctx,canvas,pose,adapter,character,view:sv,project,phase,restRig:displayRestRig(adapter)};
    if (typeof pluginDraw === 'function') pluginDraw(renderArgs);
    for (const renderer of pluginRenderers.values()) {
      try { renderer(renderArgs); } catch (err) { console.error('[Anim Lab] Plugin renderer failed.',err); }
    }
    updateUi(pose);
  }

  function updateUi(displayPose = currentPose()) {
    const character=currentCharacter(),adapter=currentAdapter(),dirty=isDirty();
    contextEl.textContent=`${character.label} · ${selection.clip[0].toUpperCase()+selection.clip.slice(1)} · ${selection.mode==='setup'?'Rig':'Animate'}${previewApplies()?' · Preview':''}`;
    readout.textContent=playing
      ? `${character.label} · Playing ${selection.clip.toUpperCase()}${previewApplies()?' PREVIEW':''} · ${Math.round(view.zoom*100)}%`
      : `${character.label} · ${selection.clip.toUpperCase()}${previewApplies()?' PREVIEW':''} · Frame ${selection.frame+1} / 16 · ${displayPose?.name || 'Pose'} · ${Math.round(view.zoom*100)}%`;
    dirtyBadge.hidden=!dirty;
    if (saveStateEl) { saveStateEl.textContent = dirty ? 'Unsaved' : 'Saved'; saveStateEl.classList.toggle('dirty', dirty); }
    undoBtn.disabled=!history.length;redoBtn.disabled=!future.length;discardBtn.disabled=!dirty;saveBtn.disabled=!dirty;
    if (timelineDock) timelineDock.hidden=selection.mode==='setup';
    scrub.value=String(selection.frame);scrub.disabled=selection.mode==='setup';prevBtn.disabled=selection.mode==='setup';nextBtn.disabled=selection.mode==='setup';playBtn.disabled=selection.mode==='setup';
    playBtn.textContent=playing?'Pause':'Play';
    characterButtons.forEach(btn=>{const active=btn.dataset.character===selection.characterId;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    clipButtons.forEach(btn=>{const active=btn.dataset.clip===selection.clip;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));btn.disabled=selection.mode==='setup';});
    modeButtons.forEach(btn=>{const active=btn.dataset.mode===selection.mode;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    viewButtons.forEach(btn=>{const active=!!overlays[btn.dataset.view];btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    scopeEl.textContent=selection.mode==='setup'
      ? (adapter.id==='fox'
        ? `${character.label} rig · scale, collider and structural rest rig remain a working copy until Save.`
        : `${character.label} setup · scale is saved per character for gameplay; collider Save writes the current ${adapter.label} collider.`)
      : previewApplies()
        ? `${conversionPreview.label || 'Conversion'} preview · view only until Adopt or Exit Preview.`
        : `${adapter.scope} Sparse keys compile back to the existing 16-sample contract on Save.`;
  }

  function notify() {
    const snap = api.getState();
    for (const fn of listeners) { try { fn(snap); } catch (err) { console.error('[Anim Lab] Extension listener failed.',err); } }
  }

  function fitView(redraw=true) { view.zoom=1;view.panX=0;view.panY=0;if(redraw){draw();notify();} }
  function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}

  canvas.addEventListener('pointerdown',e=>{
    const pos=pointerPos(e);pointers.set(e.pointerId,pos);canvas.setPointerCapture?.(e.pointerId);playing=false;
    if(pointers.size===1) gesture={type:'pan',start:pos,panX:view.panX,panY:view.panY};
    else if(pointers.size===2){const ps=[...pointers.values()],dx=ps[1].x-ps[0].x,dy=ps[1].y-ps[0].y;gesture={type:'pinch',dist:Math.hypot(dx,dy)||1,zoom:view.zoom,panX:view.panX,panY:view.panY,mid:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2}};}
    updateUi();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;const pos=pointerPos(e);pointers.set(e.pointerId,pos);
    if(pointers.size===2){
      if(!gesture||gesture.type!=='pinch'){const ps=[...pointers.values()],dx=ps[1].x-ps[0].x,dy=ps[1].y-ps[0].y;gesture={type:'pinch',dist:Math.hypot(dx,dy)||1,zoom:view.zoom,panX:view.panX,panY:view.panY,mid:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2}};}
      const ps=[...pointers.values()],dx=ps[1].x-ps[0].x,dy=ps[1].y-ps[0].y,dist=Math.hypot(dx,dy)||1,mid={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};
      const old=baseView(setupDraft.scale);old.scale/=Math.max(.0001,view.zoom);old.scale*=gesture.zoom;old.cx=canvas.width*(.5+gesture.panX);old.groundY=canvas.height*(.86+gesture.panY);
      const local=unproject(gesture.mid,old);view.zoom=clamp(gesture.zoom*(dist/gesture.dist),.55,3.2);const next=baseView(setupDraft.scale);view.panX=(mid.x-local.x*next.scale)/canvas.width-.5;view.panY=(mid.y+local.y*next.scale)/canvas.height-.86;draw();return;
    }
    if(gesture?.type==='pan'){view.panX=gesture.panX+(pos.x-gesture.start.x)/canvas.width;view.panY=gesture.panY+(pos.y-gesture.start.y)/canvas.height;draw();}
  });
  function endPointer(e){pointers.delete(e.pointerId);if(pointers.size===1){const [,pos]=[...pointers.entries()][0];gesture={type:'pan',start:pos,panX:view.panX,panY:view.panY};}else gesture=null;draw();}
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);

  characterButtons.forEach(btn=>btn.addEventListener('click',()=>switchCharacter(btn.dataset.character)));
  clipButtons.forEach(btn=>btn.addEventListener('click',()=>switchClip(btn.dataset.clip)));
  modeButtons.forEach(btn=>btn.addEventListener('click',()=>switchMode(btn.dataset.mode)));
  viewButtons.forEach(btn=>btn.addEventListener('click',()=>toggleOverlay(btn.dataset.view)));
  scrub.addEventListener('input',()=>setFrame(Number(scrub.value)));
  prevBtn.addEventListener('click',()=>setFrame(selection.frame-1));
  nextBtn.addEventListener('click',()=>setFrame(selection.frame+1));
  playBtn.addEventListener('click',()=>{if(selection.mode==='setup')return;playing=!playing;if(playing)playPhase=selection.frame/16;lastAnimTime=performance.now();draw();notify();});
  fitBtn.addEventListener('click',()=>fitView());
  undoBtn.addEventListener('click',undo);redoBtn.addEventListener('click',redo);discardBtn.addEventListener('click',discardCurrent);saveBtn.addEventListener('click',saveCurrent);
  guardSave.addEventListener('click',()=>finishGuard('save'));guardDiscard.addEventListener('click',()=>finishGuard('discard'));guardCancel.addEventListener('click',()=>finishGuard('cancel'));
  const homeLink=document.querySelector('.game-home-button');
  homeLink?.addEventListener('click',e=>{
    if(!isDirty())return;
    e.preventDefault();
    const href=homeLink.href;
    guardNavigation(()=>{window.location.href=href;});
  });
  window.addEventListener('resize',draw,{passive:true});
  window.addEventListener('beforeunload',e=>{if(!isDirty())return;e.preventDefault();e.returnValue='';});

  function setPlaying(value) {
    if (selection.mode !== 'animate') return false;
    const next = !!value;
    if (next === playing) return true;
    playing = next;
    if (playing) playPhase = selection.frame / 16;
    lastAnimTime = performance.now();
    draw(); updateUi(); notify();
    return true;
  }

  function setPhase(value, stopPlayback = true) {
    const raw = Number(value);
    if (!Number.isFinite(raw)) return false;
    const phase = ((raw % 1) + 1) % 1;
    playPhase = phase;
    selection.frame = Math.floor(phase * 16) % 16;
    if (stopPlayback) playing = false;
    saveEditorSelection();
    draw(); updateUi(); notify();
    return true;
  }

  function registerSessionParticipant(id, participant) {
    const key = String(id || '').trim();
    if (!key || !participant || typeof participant !== 'object') return () => {};
    sessionParticipants.set(key, participant);
    updateUi();
    return () => {
      if (sessionParticipants.get(key) === participant) sessionParticipants.delete(key);
      updateUi();
    };
  }

  function animate(now) {
    const dt=Math.min(50,Math.max(0,now-lastAnimTime));lastAnimTime=now;
    if(playing&&selection.mode==='animate'){
      const ms=currentAdapter().clipMs[selection.clip]||1050;playPhase=(playPhase+dt/ms)%1;const nextFrame=Math.floor(playPhase*16)%16;const changed=nextFrame!==selection.frame;selection.frame=nextFrame;draw();if(changed)notify();
    }
    requestAnimationFrame(animate);
  }


  function setConversionPreview(clipData, label = 'Conversion') {
    if (selection.mode !== 'animate') return false;
    const family = currentCharacter().family;
    const candidate = normaliseSparseClip(clipData,family,selection.clip,currentFrames());
    conversionPreview = {family,clip:selection.clip,label:String(label||'Conversion'),candidate,frames:compileSparseClip(candidate,family)};
    playing = false;
    hint.textContent = `${conversionPreview.label} preview · no authored data changed`;
    draw(); updateUi(); notify();
    return true;
  }

  function clearConversionPreview() {
    if (!previewApplies()) return false;
    conversionPreview = null;
    playing = false;
    hint.textContent = 'Conversion preview closed · authored keys unchanged';
    draw(); updateUi(); notify();
    return true;
  }

  function adoptConversionPreview(label = 'Adopt conversion preview') {
    if (!previewApplies()) return false;
    const candidate = clone(conversionPreview.candidate);
    conversionPreview = null;
    const changed = editSparseClip(label, clip => {
      clip.source = 'sparse-authored';
      clip.keys = clone(candidate.keys);
    });
    hint.textContent = changed ? 'Conversion adopted into the working copy' : 'Conversion matches the current key track';
    return changed;
  }

  function buildFoxHandoffBundle() {
    const liveFox = currentCharacter().family === 'fox';
    const setup = liveFox
      ? clone(setupDraft)
      : {
          scale:clamp(Number(setupMap?.fox?.scale)||1,SETUP_SCALE_MIN,SETUP_SCALE_MAX),
          collider:FoxRig.normalizedCollider(FoxRig.loadCollider()),
          rig:FoxRig.normalizedRestRig(FoxRig.loadRestRig())
        };
    const sparseClips = clone(sparseBanks.fox);
    const runtimeSamples = {};
    for (const clipName of ['walk','run','jump']) runtimeSamples[clipName] = compileSparseClip(sparseClips[clipName],'fox');
    return {
      schema:FOX_HANDOFF_SCHEMA,
      app:'SideScroll',
      animLabVersion:'1.0.158',
      exportedAt:new Date().toISOString(),
      fox:{
        setup:{
          scale:clamp(Number(setup.scale)||1,SETUP_SCALE_MIN,SETUP_SCALE_MAX),
          collider:FoxRig.normalizedCollider(setup.collider),
          restRig:FoxRig.normalizedRestRig(setup.rig)
        },
        sparseClips,
        runtimeSamples
      }
    };
  }

  async function exportFoxHandoffBundle() {
    try {
      const payload = JSON.stringify(buildFoxHandoffBundle(),null,2);
      const fileName = 'SS-FOX-RIG-ANIM-1.0.158.json';
      const blob = new Blob([payload],{type:'application/json'});
      const file = typeof File === 'function' ? new File([blob],fileName,{type:'application/json'}) : null;
      if (file && navigator.share && navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file],title:'SideScroll Fox Rig + Animations'});
        hint.textContent = 'Fox rig + animation bundle shared.';
      } else {
        const url=URL.createObjectURL(blob);
        const link=document.createElement('a');
        link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),0);
        hint.textContent = 'Fox rig + animation bundle exported.';
      }
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      console.error('[Anim Lab] Fox handoff export failed.',err);
      alert(`Fox export failed: ${err.message || err}`);
      return false;
    }
  }

  const api = {
    version:'1.0.158',
    getState:() => ({
      character:clone(currentCharacter()), family:currentCharacter().family, characterId:selection.characterId,
      clip:selection.clip, mode:selection.mode, frame:selection.frame, phase:playing?playPhase:selection.frame/16, playing, dirty:isDirty(),
      pose:clone(currentPose()), setup:clone(setupDraft), overlays:clone(overlays),
      sparseClip:clone(currentSparseClip()), preview:previewApplies()?{label:conversionPreview.label,candidate:clone(conversionPreview.candidate)}:null,
      rig:currentAdapter().rig, adapterId:currentAdapter().id
    }),
    getDefaultPose:() => clone(currentAdapter().defaultPose(selection.clip,selection.frame)),
    edit,
    editSparseClip,
    beginTransaction,
    previewTransaction,
    commitTransaction,
    cancelTransaction,
    getSparseClip:()=>clone(currentSparseClip()),
    getCompiledFrames:()=>clone(currentFrames()),
    getLegacySamples:()=>clone(legacySamplesAtOpen[currentCharacter().family][selection.clip]),
    compileSparseClip:clipData=>compileSparseClip(normaliseSparseClip(clipData,currentCharacter().family,selection.clip,currentFrames()),currentCharacter().family),
    evaluateSparsePose:(clipData,frame)=>evaluateSparsePose(normaliseSparseClip(clipData,currentCharacter().family,selection.clip,currentFrames()),frame,currentCharacter().family),
    getAuthoringPose:()=>clone(evaluateSparsePose(currentSparseClip(),selection.frame,currentCharacter().family,{resolveContacts:false})),
    setConversionPreview,
    clearConversionPreview,
    adoptConversionPreview,
    setFrame,
    setPhase,
    setPlaying,
    setHint:text=>{hint.textContent=String(text||'');},
    subscribe:fn=>{if(typeof fn==='function'){listeners.add(fn);return()=>listeners.delete(fn);}return()=>{};},
    registerSessionParticipant,
    redraw:()=>{draw();notify();},
    redrawOnly:()=>draw(),
    setOverlay:(name,value)=>{if(name in overlays){overlays[name]=!!value;draw();updateUi();notify();}},
    getOverlay:name=>!!overlays[name],
    setArtOpacity:value=>{artOpacity=clamp(Number(value)||0,0,1);draw();},
    getArtOpacity:()=>artOpacity,
    setSelectedMarkers:markers=>{selectedMarkers=Array.isArray(markers)?markers.filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)).map(clone):[];draw();},
    setUnderlayRenderer:fn=>{underlayDraw=typeof fn==='function'?fn:null;draw();},
    registerUnderlayRenderer:(id,fn)=>{
      const key=String(id||'').trim();
      if(!key||typeof fn!=='function')return()=>{};
      underlayRenderers.set(key,fn);draw();
      return()=>{if(underlayRenderers.get(key)===fn)underlayRenderers.delete(key);draw();};
    },
    setPluginRenderer:fn=>{pluginDraw=typeof fn==='function'?fn:null;draw();},
    registerPluginRenderer:(id,fn)=>{
      const key=String(id||'').trim();
      if(!key||typeof fn!=='function')return()=>{};
      pluginRenderers.set(key,fn);draw();
      return()=>{if(pluginRenderers.get(key)===fn)pluginRenderers.delete(key);draw();};
    },
    geometry:pose=>currentAdapter().rig.geometry(pose||currentPose(),displayRestRig()),
    normalisePose:pose=>normaliseCurrentFrame(pose),
    getStaticReference:()=>clone(currentStaticReference()),
    setStaticReference,
    buildFoxHandoffBundle:()=>clone(buildFoxHandoffBundle()),
    exportFoxHandoffBundle,
    clamp,
    fitView,
    save:saveCurrent,
    discard:discardCurrent
  };
  window.AnimLabCore = Object.freeze(api);

  resetCheckpoint();
  draw(); notify(); requestAnimationFrame(animate);
})();
