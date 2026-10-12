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
  const readout = $('animlab-readout');
  const hint = $('animlab-hint');
  const dirtyBadge = $('animlab-dirty');
  const scopeEl = $('animlab-scope');
  const scrub = $('animlab-scrub');
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

  const CHARACTERS = [
    { id:'original', label:'Hero 1', family:'human', atlas:'walklab-rig-v4.png' },
    { id:'alternate', label:'Hero 2', family:'human', atlas:'walklab-rig-v4-alt-hero2.png' },
    { id:'fox', label:'Fox', family:'fox', atlas:'fox-rig-atlas-v1.png?v=1.0.141' }
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

  function loadFoxBank() {
    const bank = defaultBank(FoxRig);
    try {
      const saved = JSON.parse(localStorage.getItem(FOX_CLIPS_KEY) || 'null');
      if (saved?.clips) {
        for (const name of ['walk','run','jump']) {
          if (Array.isArray(saved.clips[name]) && saved.clips[name].length === 16) bank[name] = saved.clips[name].map((p,i) => FoxRig.normalizedPose(p,i));
        }
      }
    } catch (err) {
      console.warn('[Anim Lab] Fox editor clip read failed; using approved v1.0.141 defaults.', err);
    }
    return bank;
  }

  function saveFoxBank(bank) {
    const clips = {};
    for (const name of ['walk','run','jump']) clips[name] = bank[name].map((p,i) => FoxRig.normalizedPose(p,i));
    localStorage.setItem(FOX_CLIPS_KEY, JSON.stringify({schema:'animlab.legacy-sampled.v1', family:'fox', sampleCount:16, clips}));
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
      clipMs:{walk:1050,run:650,jump:935},
      loadBank:loadFoxBank, saveBank:saveFoxBank,
      normalise:(pose,index) => FoxRig.normalizedPose(pose,index),
      defaultPose:(clip,index) => {
        const source = clip === 'run' ? FoxRig.RUN_FRAMES : clip === 'jump' ? FoxRig.JUMP_FRAMES : FoxRig.DEFAULT_FRAMES;
        return FoxRig.normalizedPose(source[index], index);
      },
      collider:() => FoxRig.loadCollider(),
      normaliseCollider:value => FoxRig.normalizedCollider(value),
      saveCollider:value => FoxRig.saveCollider(value),
      scope:'Fox clips are stored separately in Anim Lab; gameplay clip integration is deliberately deferred.'
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
    return {
      scale: clamp(Number(saved.scale) || 1, .55, 1.55),
      // Collider ownership remains with the existing rig family storage. This
      // prevents Hero 1/Hero 2 from showing stale per-character copies while
      // the runtime still shares one human collider.
      collider: adapter.normaliseCollider(adapter.collider())
    };
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
        const raw = stored?.schema === SPARSE_SCHEMA ? stored?.families?.[family]?.[clipName] : null;
        out[family][clipName] = raw
          ? normaliseSparseClip(raw,family,clipName,banks[family][clipName])
          : importSparseClip(banks[family][clipName],family,clipName);
      }
    }
    return out;
  }

  let sparseBanks = loadSparseBanks();
  let conversionPreview = null;

  function evaluateSparsePose(clipData, frame, family) {
    const adapter = adapters[family];
    const keys = [...(clipData?.keys || [])].sort((a,b)=>a.frame-b.frame);
    if (!keys.length) return adapter.defaultPose(clipData?.clip || 'walk', clamp(Math.round(frame),0,15));
    const f = ((Number(frame) % 16) + 16) % 16;
    const exact = keys.find(k => k.frame === f);
    if (exact) { const pose = adapter.normalise(exact.pose, f); pose.name = exact.name; return pose; }
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
    const pose = adapter.rig.interpolatePose(a,b,t,name,travelB);
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
  const view = { zoom:1, panX:0, panY:0 };
  const overlays = { art:true, bones:true, planes:false, collider:false, ground:false, reference:false };
  const pointers = new Map();
  const listeners = new Set();
  let selectedMarkers = [];
  let pluginDraw = null;
  let gesture = null;
  let pendingNavigation = null;
  let playing = false;
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
  function currentBank() { return banks[currentCharacter().family]; }
  function currentFrames() { return currentBank()[selection.clip]; }
  function currentSparseClip() { return sparseBanks[currentCharacter().family][selection.clip]; }
  function previewApplies() { return !!conversionPreview && conversionPreview.family === currentCharacter().family && conversionPreview.clip === selection.clip; }
  function displayFrames() { return previewApplies() ? conversionPreview.frames : currentFrames(); }
  function currentPose() { return displayFrames()[selection.frame]; }

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
    if (!checkpoint) return false;
    if (selection.mode === 'setup') return !same(setupDraft, checkpoint.setup);
    return !same(currentSparseClip(), checkpoint.sparseClip);
  }

  function saveEditorSelection() {
    try { sessionStorage.setItem(EDITOR_SELECTION_KEY, JSON.stringify(selection)); } catch (_) {}
  }

  function normaliseCurrentFrame(pose) {
    return currentAdapter().normalise(pose, selection.frame);
  }

  function setScopeValue(scope, value, frameIndex = selection.frame) {
    if (scope === 'setup') {
      setupDraft = { scale:clamp(Number(value.scale)||1,.55,1.55), collider:currentAdapter().normaliseCollider(value.collider) };
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
      before:clone(evaluateSparsePose(currentSparseClip(),selection.frame,currentCharacter().family)),
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
        setupMap[character.id] = clone(setupDraft);
        localStorage.setItem(SETUP_KEY, JSON.stringify(setupMap));
      } else {
        conversionPreview = null;
        ensureLegacyBackup(currentCharacter().family, selection.clip);
        syncCompiledClip(currentCharacter().family, selection.clip);
        saveSparseBanks();
        currentAdapter().saveBank(currentBank());
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

  function drawRigArt(character, adapter, pose, sv, alpha = 1) {
    const atlas = atlases.get(character.id);
    if (!atlas) return;
    if (adapter.id === 'human' && typeof HumanRig.drawCanvas === 'function') HumanRig.drawCanvas(ctx,atlas,pose,sv,{alpha});
    else adapter.rig.partsForPose(pose).forEach(part => drawPart(adapter.rig,atlas,part,sv,alpha));
  }

  function drawBones(adapter, pose, sv, alpha = 1) {
    const parts = adapter.rig.partsForPose(pose);
    ctx.save();
    ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=Math.max(2,sv.scale*.012); ctx.strokeStyle=`rgba(47,61,66,${.78*alpha})`;
    for (const part of parts) {
      const A=project(part.a,sv), B=project(part.b,sv);
      ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();
      ctx.fillStyle=`rgba(245,241,236,${.94*alpha})`; ctx.strokeStyle=`rgba(47,61,66,${.85*alpha})`;
      ctx.beginPath(); ctx.arc(A.x,A.y,Math.max(2.5,sv.scale*.011),0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle=`rgba(47,61,66,${.78*alpha})`;
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
    for (const part of adapter.rig.partsForPose(pose)) {
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
    ctx.strokeStyle='rgba(64,76,80,.42)';ctx.lineWidth=Math.max(1,canvas.width*.0017);ctx.beginPath();ctx.moveTo(0,sv.groundY);ctx.lineTo(canvas.width,sv.groundY);ctx.stroke();
    const step=.25*sv.scale;
    ctx.fillStyle='rgba(51,63,67,.55)';ctx.font=`${Math.max(9,canvas.height*.024)}px system-ui,sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
    for(let i=0;i<=4;i++){
      const y=sv.groundY-i*step;ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(20,y);ctx.stroke();ctx.fillText(`${(i*.25).toFixed(2)}`,24,y);
    }
    ctx.restore();
  }

  function drawReference() {
    if (!overlays.reference) return;
    const refChar = characterById('original'), atlas=atlases.get('original'); if(!atlas)return;
    const sv=baseView(1); sv.cx = canvas.width * .76;
    const pose=HumanRig.normalizedPose(HumanRig.DEFAULT_FRAMES[0],0);
    ctx.save();ctx.globalAlpha=.24;HumanRig.drawCanvas(ctx,atlas,pose,sv,{alpha:.72});drawBones(adapters.human,pose,sv,.35);ctx.restore();
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
    const pose=playing?adapter.rig.sampleFrames(frames,playPhase):currentPose();
    const sv=previewView(phase);
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f2ede7';ctx.fillRect(0,0,canvas.width,canvas.height);
    const pad=canvas.width*.035;ctx.strokeStyle='rgba(67,76,80,.17)';ctx.lineWidth=Math.max(1,canvas.width*.002);ctx.strokeRect(pad,canvas.height*.05,canvas.width-pad*2,canvas.height*.88);
    drawGroundAndRuler(baseView(1));
    drawReference();
    if(overlays.art) drawRigArt(character,adapter,pose,sv,.99);
    if(overlays.planes) drawPlanes(adapter,pose,sv);
    if(overlays.collider) drawCollider(sv);
    if(overlays.bones) drawBones(adapter,pose,sv,1);
    drawSelectedMarkers(sv);
    if (typeof pluginDraw === 'function') pluginDraw({ctx,canvas,pose,adapter,character,view:sv,project});
    updateUi(pose);
  }

  function updateUi(displayPose = currentPose()) {
    const character=currentCharacter(),adapter=currentAdapter(),dirty=isDirty();
    contextEl.textContent=`${character.label} · ${selection.clip[0].toUpperCase()+selection.clip.slice(1)} · ${selection.mode==='setup'?'Setup':'Animate'}${previewApplies()?' · Preview':''}`;
    readout.textContent=playing
      ? `${character.label} · Playing ${selection.clip.toUpperCase()}${previewApplies()?' PREVIEW':''} · ${Math.round(view.zoom*100)}%`
      : `${character.label} · ${selection.clip.toUpperCase()}${previewApplies()?' PREVIEW':''} · Frame ${selection.frame+1} / 16 · ${displayPose?.name || 'Pose'} · ${Math.round(view.zoom*100)}%`;
    dirtyBadge.hidden=!dirty;
    undoBtn.disabled=!history.length;redoBtn.disabled=!future.length;discardBtn.disabled=!dirty;saveBtn.disabled=!dirty;
    scrub.value=String(selection.frame);scrub.disabled=selection.mode==='setup';prevBtn.disabled=selection.mode==='setup';nextBtn.disabled=selection.mode==='setup';playBtn.disabled=selection.mode==='setup';
    playBtn.textContent=playing?'Pause':'Play';
    characterButtons.forEach(btn=>{const active=btn.dataset.character===selection.characterId;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    clipButtons.forEach(btn=>{const active=btn.dataset.clip===selection.clip;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));btn.disabled=selection.mode==='setup';});
    modeButtons.forEach(btn=>{const active=btn.dataset.mode===selection.mode;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    viewButtons.forEach(btn=>{const active=!!overlays[btn.dataset.view];btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    scopeEl.textContent=selection.mode==='setup'
      ? `${character.label} setup · scale is editor-owned; collider Save writes the current ${adapter.label} collider.`
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

  const api = {
    version:'1.0.145',
    getState:() => ({
      character:clone(currentCharacter()), family:currentCharacter().family, characterId:selection.characterId,
      clip:selection.clip, mode:selection.mode, frame:selection.frame, playing, dirty:isDirty(),
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
    setConversionPreview,
    clearConversionPreview,
    adoptConversionPreview,
    setFrame,
    setHint:text=>{hint.textContent=String(text||'');},
    subscribe:fn=>{if(typeof fn==='function'){listeners.add(fn);return()=>listeners.delete(fn);}return()=>{};},
    redraw:()=>{draw();notify();},
    setOverlay:(name,value)=>{if(name in overlays){overlays[name]=!!value;draw();updateUi();notify();}},
    getOverlay:name=>!!overlays[name],
    setSelectedMarkers:markers=>{selectedMarkers=Array.isArray(markers)?markers.filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)).map(clone):[];draw();},
    setPluginRenderer:fn=>{pluginDraw=typeof fn==='function'?fn:null;draw();},
    geometry:pose=>currentAdapter().rig.geometry(pose||currentPose()),
    normalisePose:pose=>normaliseCurrentFrame(pose),
    clamp,
    fitView,
    save:saveCurrent,
    discard:discardCurrent
  };
  window.AnimLabCore = Object.freeze(api);

  resetCheckpoint();
  draw(); notify(); requestAnimationFrame(animate);
})();
