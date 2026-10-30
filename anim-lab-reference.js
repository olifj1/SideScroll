(() => {
  'use strict';

  const core = window.AnimLabCore;
  const host = document.getElementById('animlab-extension');
  if (!core || !host) {
    console.error('[Anim Lab Reference] AnimLabCore or extension host is missing.');
    return;
  }

  const SETTINGS_KEY = 'sidescroll.animlab.reference.settings.v1';
  const MANIFEST_URL = 'anim-reference-packs.json?v=1.0.151';
  const ASSET_VERSION = '1.0.150';
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wrap01 = v => ((Number(v) % 1) + 1) % 1;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  let registry = null;
  let registryError = null;
  let contextKey = '';
  let draft = null;
  let checkpoint = null;
  let refPhase = 0;
  let refPlaying = false;
  let refLastTime = performance.now();
  let lastState = core.getState();
  const images = new Map();
  const loading = new Map();
  let loadGeneration = 0;

  function loadSettingsMap() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      return raw?.contexts && typeof raw.contexts === 'object' ? raw.contexts : {};
    } catch (err) {
      console.warn('[Anim Lab Reference] Settings read failed; using defaults.', err);
      return {};
    }
  }
  let settingsMap = loadSettingsMap();

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-reference-section';
  section.setAttribute('aria-labelledby', 'animlab-motion-reference-title');
  section.innerHTML = `
    <div class="animlab-section-title" id="animlab-motion-reference-title">Motion Reference</div>
    <div class="animlab-reference-note" id="animlab-reference-note">Loading reference packs…</div>

    <div class="animlab-reference-controls" id="animlab-reference-controls" hidden>
      <div class="animlab-reference-pack" id="animlab-reference-pack"></div>
      <div class="animlab-segmented animlab-reference-gaits" id="animlab-reference-gaits" aria-label="Reference gait"></div>

      <div class="animlab-segmented animlab-two animlab-reference-source" aria-label="Reference frame source">
        <button type="button" data-reference-source="selected">Key Poses</button>
        <button type="button" data-reference-source="all">All Frames</button>
      </div>

      <div class="animlab-segmented animlab-three animlab-reference-toggles">
        <button type="button" id="animlab-reference-show">Show</button>
        <button type="button" id="animlab-reference-link">Link</button>
        <button type="button" id="animlab-reference-lock">Lock</button>
      </div>

      <label class="animlab-slider animlab-reference-slider"><span>Opacity</span><input id="animlab-reference-opacity" type="range" min="0.05" max="1" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-reference-slider animlab-reference-align"><span>Scale</span><input id="animlab-reference-scale" type="range" min="0.35" max="2.50" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-reference-slider animlab-reference-align"><span>Horizontal</span><input id="animlab-reference-x" type="range" min="-1.50" max="1.50" step="0.01"><output></output></label>
      <label class="animlab-slider animlab-reference-slider animlab-reference-align"><span>Vertical</span><input id="animlab-reference-y" type="range" min="-0.75" max="1.00" step="0.01"><output></output></label>

      <div class="animlab-reference-linked-note" id="animlab-reference-linked-note" hidden>Linked to the main timeline below the viewport.</div>
      <div class="animlab-reference-playback" id="animlab-reference-playback">
        <div class="animlab-frame-row animlab-reference-transport">
          <button id="animlab-reference-prev" type="button" aria-label="Previous reference image">←</button>
          <button id="animlab-reference-play" type="button">Play Reference</button>
          <button id="animlab-reference-next" type="button" aria-label="Next reference image">→</button>
        </div>
        <label class="animlab-slider animlab-reference-scrub"><span>Reference Cycle</span><input id="animlab-reference-scrub" type="range" min="0" max="0.999" step="0.001"><output></output></label>
      </div>
      <label class="animlab-slider animlab-reference-slider animlab-reference-align"><span>Phase Offset</span><input id="animlab-reference-phase" type="range" min="-0.50" max="0.50" step="0.005"><output></output></label>

      <div class="animlab-reference-status" id="animlab-reference-status">Reference hidden.</div>
      <div class="animlab-reference-credit" id="animlab-reference-credit"></div>
    </div>
  `;

  const stage2View = host.querySelector('.animlab-stage2-view');
  if (stage2View?.nextSibling) host.insertBefore(section, stage2View.nextSibling);
  else if (stage2View) host.appendChild(section);
  else host.insertBefore(section, host.firstChild);

  const $ = id => document.getElementById(id);
  const note = $('animlab-reference-note');
  const controls = $('animlab-reference-controls');
  const packLabel = $('animlab-reference-pack');
  const gaitRow = $('animlab-reference-gaits');
  const sourceButtons = [...section.querySelectorAll('[data-reference-source]')];
  const showBtn = $('animlab-reference-show');
  const linkBtn = $('animlab-reference-link');
  const lockBtn = $('animlab-reference-lock');
  const opacityInput = $('animlab-reference-opacity');
  const scaleInput = $('animlab-reference-scale');
  const xInput = $('animlab-reference-x');
  const yInput = $('animlab-reference-y');
  const phaseInput = $('animlab-reference-phase');
  const playback = $('animlab-reference-playback');
  const linkedNote = $('animlab-reference-linked-note');
  const scrubInput = $('animlab-reference-scrub');
  const prevBtn = $('animlab-reference-prev');
  const playBtn = $('animlab-reference-play');
  const nextBtn = $('animlab-reference-next');
  const status = $('animlab-reference-status');
  const credit = $('animlab-reference-credit');
  const alignmentInputs = [scaleInput, xInput, yInput, phaseInput];

  function compatiblePacks(state = lastState) {
    return (registry?.packs || []).filter(pack => (pack.rigFamilies || []).includes(state.family));
  }

  function currentPack(state = lastState) {
    const packs = compatiblePacks(state);
    return packs.find(pack => pack.id === draft?.packId) || packs[0] || null;
  }

  function defaultGait(pack, clip) {
    if (!pack?.gaits?.length) return null;
    return pack.gaits.find(gait => (gait.suggestedClips || []).includes(clip)) || pack.gaits[0];
  }

  function currentGait(state = lastState) {
    const pack = currentPack(state);
    if (!pack) return null;
    return pack.gaits.find(gait => gait.id === draft?.gaitId) || defaultGait(pack, state.clip);
  }

  function defaultSettings(state = lastState) {
    const pack = compatiblePacks(state)[0] || null;
    const gait = defaultGait(pack, state.clip);
    return {
      packId: pack?.id || null,
      gaitId: gait?.id || null,
      source: 'selected',
      visible: false,
      opacity: 0.42,
      scale: 1.00,
      offsetX: 0,
      offsetY: 0,
      locked: false,
      linked: true,
      phaseOffset: 0
    };
  }

  function normaliseSettings(raw, state = lastState) {
    const base = defaultSettings(state);
    const next = {...base, ...(raw && typeof raw === 'object' ? raw : {})};
    const packs = compatiblePacks(state);
    const pack = packs.find(item => item.id === next.packId) || packs[0] || null;
    next.packId = pack?.id || null;
    const gait = pack?.gaits?.find(item => item.id === next.gaitId) || defaultGait(pack, state.clip);
    next.gaitId = gait?.id || null;
    next.source = next.source === 'all' ? 'all' : 'selected';
    next.visible = !!next.visible;
    next.opacity = clamp(Number(next.opacity) || base.opacity, 0.05, 1);
    next.scale = clamp(Number(next.scale) || base.scale, 0.35, 2.5);
    next.offsetX = clamp(Number(next.offsetX) || 0, -1.5, 1.5);
    next.offsetY = clamp(Number(next.offsetY) || 0, -0.75, 1);
    next.locked = !!next.locked;
    next.linked = next.linked !== false;
    next.phaseOffset = clamp(Number(next.phaseOffset) || 0, -0.5, 0.5);
    return next;
  }

  function keyFor(state = lastState) {
    return `${state.characterId}|${state.clip}`;
  }

  function loadContext(state = lastState) {
    contextKey = keyFor(state);
    draft = normaliseSettings(settingsMap[contextKey], state);
    checkpoint = clone(draft);
    refPhase = 0;
    refPlaying = false;
    refLastTime = performance.now();
    render(state, true);
    if (draft.visible) preloadCurrent();
    core.redrawOnly?.();
  }

  function markChanged(mutator, shouldPreload = false) {
    if (!draft) return;
    mutator(draft);
    draft = normaliseSettings(draft, lastState);
    render(lastState, false);
    if (shouldPreload && draft.visible) preloadCurrent();
    // Reference overlays are editor display preferences, not character edits.
    saveSettings();
    core.redraw();
  }

  function saveSettings() {
    if (!draft || !contextKey) return true;
    settingsMap[contextKey] = clone(draft);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({schema:'animlab.reference.settings.v1', contexts:settingsMap}));
    checkpoint = clone(draft);
    render(lastState, false);
    return true;
  }

  function discardSettings() {
    if (!checkpoint) return;
    draft = clone(checkpoint);
    refPlaying = false;
    render(lastState, true);
    if (draft.visible) preloadCurrent();
  }

  core.registerSessionParticipant('motion-reference', {
    isDirty: () => false,
    save: () => true,
    discard: () => {}
  });

  function entriesFor(gait = currentGait()) {
    if (!gait) return [];
    if (draft?.source === 'all') return gait.frames.map((frame, index) => ({...frame, frameIndex:index}));
    return gait.selected.map(item => ({...gait.frames[item.frameIndex], ...item}));
  }

  function entryForPhase(phase, gait = currentGait()) {
    const entries = entriesFor(gait);
    if (!entries.length) return null;
    const p = wrap01(phase);
    let match = entries[entries.length - 1];
    for (const entry of entries) {
      if (Number(entry.phase) <= p + 1e-9) match = entry;
      else break;
    }
    return match;
  }

  function linkActive(state = lastState) { return state.mode === 'animate' && !!draft?.linked; }

  function effectivePhase(state = lastState) {
    if (!draft) return 0;
    return linkActive(state) ? wrap01((state.phase || 0) + draft.phaseOffset) : wrap01(refPhase);
  }

  function setReferencePhase(phase) {
    const p = wrap01(phase);
    refPlaying = false;
    if (linkActive(lastState)) core.setPhase(wrap01(p - draft.phaseOffset), true);
    else {
      refPhase = p;
      render(lastState, false);
      core.redrawOnly();
    }
  }

  function imageUrl(file) {
    return (window.SideScrollAssetPath || (url => url))(`${file}?v=${ASSET_VERSION}`);
  }

  function imageForFile(file) {
    if (!file) return null;
    return images.get(file) || null;
  }

  function loadImage(file) {
    if (!file) return Promise.resolve(null);
    const existing = images.get(file);
    if (existing?.complete && existing.naturalWidth) return Promise.resolve(existing);
    if (loading.has(file)) return loading.get(file);
    const promise = new Promise(resolve => {
      const img = existing || new Image();
      images.set(file, img);
      img.onload = () => { loading.delete(file); core.redrawOnly(); resolve(img); };
      img.onerror = () => { loading.delete(file); images.delete(file); resolve(null); };
      if (!img.src) img.src = imageUrl(file);
    });
    loading.set(file, promise);
    return promise;
  }

  async function preloadCurrent() {
    const gait = currentGait();
    if (!draft?.visible || !gait) return;
    const generation = ++loadGeneration;
    const entries = entriesFor(gait);
    const files = [...new Set(entries.map(entry => entry.file).filter(Boolean))];
    if (!files.length) return;
    renderStatus(lastState, `Loading ${files.length} reference images…`);
    let loaded = 0;
    await Promise.all(files.map(async file => {
      if (await loadImage(file)) loaded++;
      if (generation === loadGeneration) renderStatus(lastState, `Loading reference ${loaded} / ${files.length}…`);
    }));
    if (generation !== loadGeneration) return;
    render(lastState, false);
    core.redrawOnly();
  }

  function drawReference({ctx, gridView, phase, character}) {
    if (!draft?.visible || !registry) return;
    const pack = currentPack();
    const gait = currentGait();
    if (!pack || !gait) return;
    const p = linkActive(lastState) ? wrap01(phase + draft.phaseOffset) : wrap01(refPhase);
    const entry = entryForPhase(p, gait);
    const img = imageForFile(entry?.file);
    if (!img?.complete || !img.naturalWidth) {
      if (entry?.file) loadImage(entry.file);
      return;
    }

    const sourceW = Number(pack.imageSize?.width) || img.naturalWidth;
    const sourceH = Number(pack.imageSize?.height) || img.naturalHeight;
    const groundY = Number(pack.groundY) || sourceH;
    const baseWorldWidth = Number(pack.baseWorldWidth) || 1.8;
    const pixelsPerSource = (baseWorldWidth * draft.scale * gridView.scale) / sourceW;
    const width = sourceW * pixelsPerSource;
    const height = sourceH * pixelsPerSource;
    const x = gridView.cx + draft.offsetX * gridView.scale - width / 2;
    const y = gridView.groundY - draft.offsetY * gridView.scale - groundY * pixelsPerSource;

    ctx.save();
    ctx.globalAlpha = draft.opacity;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  }

  core.setUnderlayRenderer(drawReference);

  function setButtonState(button, active, textOn, textOff = textOn) {
    button.classList.toggle('active', !!active);
    button.setAttribute('aria-pressed', String(!!active));
    button.textContent = active ? textOn : textOff;
  }

  function formatPercent(value) {
    return `${Math.round(wrap01(value) * 100)}%`;
  }

  function formatOffset(value) {
    const n = Number(value) || 0;
    return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;
  }

  function renderStatus(state = lastState, override = null) {
    if (override) { status.textContent = override; return; }
    const gait = currentGait(state);
    if (!draft?.visible) { status.textContent = 'Reference hidden · settings remain attached to this character / clip.'; return; }
    if (!gait) { status.textContent = 'No compatible reference gait installed.'; return; }
    const p = effectivePhase(state);
    const entries = entriesFor(gait);
    const entry = entryForPhase(p, gait);
    const index = Math.max(0, entries.findIndex(item => item.frameIndex === entry?.frameIndex));
    const kind = draft.source === 'all' ? 'Frame' : 'Key';
    const loaded = !!imageForFile(entry?.file)?.complete;
    status.textContent = `${gait.label} · ${kind} ${index + 1} / ${entries.length} · ${formatPercent(p)}${loaded ? '' : ' · loading'}`;
  }

  function buildGaitButtons(state = lastState) {
    const pack = currentPack(state);
    gaitRow.innerHTML = '';
    for (const gait of pack?.gaits || []) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.referenceGait = gait.id;
      button.textContent = gait.label;
      button.addEventListener('click', () => {
        if (draft.gaitId === gait.id) return;
        markChanged(settings => { settings.gaitId = gait.id; }, true);
        refPhase = 0;
      });
      gaitRow.appendChild(button);
    }
  }

  function setSlider(input, value, digits = 2, suffix = '') {
    if (document.activeElement !== input) input.value = String(value);
    const output = input.parentElement.querySelector('output');
    if (output) output.textContent = `${Number(value).toFixed(digits)}${suffix}`;
  }

  function render(state = core.getState(), rebuild = false) {
    lastState = state;
    const rigMode = state.mode === 'setup' && !!state.rig?.RIG_DESIGNER;
    section.hidden = state.mode !== 'animate' && !rigMode;
    if (section.hidden) return;

    if (registryError) {
      note.textContent = 'Reference data could not be loaded. Reload online once to cache the reference manifest.';
      controls.hidden = true;
      return;
    }
    if (!registry) {
      note.textContent = 'Loading reference packs…';
      controls.hidden = true;
      return;
    }

    const packs = compatiblePacks(state);
    if (!packs.length) {
      note.textContent = state.family === 'human'
        ? 'No biped reference pack is installed yet. The same panel will accept one later.'
        : 'No compatible reference pack is installed for this rig.';
      controls.hidden = true;
      return;
    }

    note.textContent = state.mode === 'setup'
      ? 'Editor-only proportion reference · playback is independent in Rig mode; settings still save per character and clip.'
      : 'Editor-only overlay · reference settings save per character and clip and never affect gameplay rendering.';
    controls.hidden = false;
    const pack = currentPack(state);
    const gait = currentGait(state);
    if (rebuild) buildGaitButtons(state);
    packLabel.textContent = pack?.label || 'Reference Pack';
    credit.textContent = pack?.source ? `${pack.source.title} · ${pack.source.creator} · editor reference only` : '';

    gaitRow.querySelectorAll('[data-reference-gait]').forEach(button => {
      const active = button.dataset.referenceGait === gait?.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    sourceButtons.forEach(button => {
      const active = button.dataset.referenceSource === draft.source;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    setButtonState(showBtn, draft.visible, 'Shown', 'Show');
    setButtonState(linkBtn, linkActive(state), 'Linked', state.mode === 'setup' ? 'Animate Link' : 'Unlinked');
    linkBtn.disabled = state.mode === 'setup';
    setButtonState(lockBtn, draft.locked, 'Locked', 'Unlocked');

    setSlider(opacityInput, draft.opacity, 2);
    setSlider(scaleInput, draft.scale, 2);
    setSlider(xInput, draft.offsetX, 2, ' m');
    setSlider(yInput, draft.offsetY, 2, ' m');
    if (document.activeElement !== phaseInput) phaseInput.value = String(draft.phaseOffset);
    phaseInput.parentElement.querySelector('output').textContent = formatOffset(draft.phaseOffset);

    const linked = linkActive(state);
    const p = effectivePhase(state);
    if (document.activeElement !== scrubInput) scrubInput.value = String(p);
    scrubInput.parentElement.querySelector('output').textContent = formatPercent(p);
    alignmentInputs.forEach(input => { input.disabled = draft.locked; });
    playback.hidden = linked;
    linkedNote.hidden = !linked;
    playBtn.textContent = refPlaying ? 'Pause Reference' : 'Play Reference';
    renderStatus(state);
  }

  showBtn.addEventListener('click', () => markChanged(settings => { settings.visible = !settings.visible; }, true));
  linkBtn.addEventListener('click', () => {
    if (lastState.mode === 'setup') return;
    markChanged(settings => { settings.linked = !settings.linked; });
    refPlaying = false;
    if (!draft.linked) refPhase = wrap01((lastState.phase || 0) + draft.phaseOffset);
  });
  lockBtn.addEventListener('click', () => markChanged(settings => { settings.locked = !settings.locked; }));
  sourceButtons.forEach(button => button.addEventListener('click', () => {
    const source = button.dataset.referenceSource;
    if (draft.source === source) return;
    markChanged(settings => { settings.source = source; }, true);
  }));

  function bindSettingSlider(input, key, parser = Number) {
    input.addEventListener('input', () => {
      if (draft?.locked && input !== opacityInput) return;
      const value = parser(input.value);
      if (!Number.isFinite(value)) return;
      markChanged(settings => { settings[key] = value; });
    });
  }
  bindSettingSlider(opacityInput, 'opacity');
  bindSettingSlider(scaleInput, 'scale');
  bindSettingSlider(xInput, 'offsetX');
  bindSettingSlider(yInput, 'offsetY');
  bindSettingSlider(phaseInput, 'phaseOffset');

  scrubInput.addEventListener('input', () => setReferencePhase(Number(scrubInput.value)));
  prevBtn.addEventListener('click', () => {
    const entries = entriesFor();
    if (!entries.length) return;
    const p = effectivePhase();
    let index = 0;
    for (let i = 0; i < entries.length; i++) if (Number(entries[i].phase) < p - 1e-6) index = i;
    if (Math.abs(Number(entries[index].phase) - p) < 1e-6) index = (index - 1 + entries.length) % entries.length;
    setReferencePhase(entries[index].phase);
  });
  nextBtn.addEventListener('click', () => {
    const entries = entriesFor();
    if (!entries.length) return;
    const p = effectivePhase();
    let target = entries[0];
    for (const entry of entries) {
      if (Number(entry.phase) > p + 1e-6) { target = entry; break; }
    }
    setReferencePhase(target.phase);
  });
  playBtn.addEventListener('click', () => {
    if (linkActive(lastState)) core.setPlaying(!lastState.playing);
    else {
      refPlaying = !refPlaying;
      refLastTime = performance.now();
      render(lastState, false);
    }
  });

  core.subscribe(state => {
    const nextKey = keyFor(state);
    const enteringRig = lastState?.mode !== 'setup' && state.mode === 'setup' && !!state.rig?.RIG_DESIGNER;
    if (enteringRig && draft) {
      refPhase = wrap01((lastState?.phase || state.phase || 0) + draft.phaseOffset);
      refPlaying = false;
    }
    lastState = state;
    if (nextKey !== contextKey) loadContext(state);
    else render(state, false);
  });

  async function loadRegistry() {
    try {
      const response = await fetch(MANIFEST_URL, {cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data?.schema !== 'animlab.reference-packs.v1' || !Array.isArray(data.packs)) throw new Error('Unsupported reference manifest.');
      registry = data;
      registryError = null;
      loadContext(core.getState());
      document.dispatchEvent(new Event('animlab:reference-ready'));
    } catch (err) {
      registryError = err;
      console.error('[Anim Lab Reference] Reference manifest failed to load.', err);
      render(core.getState(), true);
      document.dispatchEvent(new Event('animlab:reference-ready'));
    }
  }

  function animateReference(now) {
    const dt = Math.min(80, Math.max(0, now - refLastTime));
    refLastTime = now;
    if (refPlaying && draft?.visible && !linkActive(lastState)) {
      const gait = currentGait();
      const durationMs = Math.max(100, Number(gait?.durationSeconds || 1) * 1000);
      refPhase = wrap01(refPhase + dt / durationMs);
      render(lastState, false);
      core.redrawOnly();
    }
    requestAnimationFrame(animateReference);
  }

  loadRegistry();
  requestAnimationFrame(animateReference);
})();
