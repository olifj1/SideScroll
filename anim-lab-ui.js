/* SideScroll v1.0.195 — one Workspace and one Display panel for Anim Lab.
   This controller moves existing, already-bound display controls; it does not
   duplicate reference sliders, alter character data or replace the renderers. */
(() => {
  'use strict';
  const core = window.AnimLabCore;
  const $ = id => document.getElementById(id);
  const panel = $('animlab-display-panel');
  if (!core || !panel || typeof core.navigateAuthorStage !== 'function') return;

  const DISPLAY_KEY = 'sidescroll.animlab.editor-display.v1';
  const fields = ['art', 'bones', 'planes', 'collider', 'ground', 'reference'];
  const artInput = $('animlab-display-art-opacity');
  const artOutput = artInput?.parentElement.querySelector('output');
  const stageButtons = [...document.querySelectorAll('[data-author-stage]')];
  const stageCaption = $('animlab-workflow-caption');
  const clipSection = $('animlab-clip-row')?.closest('.animlab-section');
  const setupSection = $('animlab-setup-section');
  const legacyMode = $('animlab-legacy-modes');
  const oldViewport = document.querySelector('.animlab-stage2-view');
  const extras = $('animlab-display-extras');
  const outlineBtn = $('animlab-display-outlines');
  const differenceBtn = $('animlab-display-difference');
  const bindBtn = $('animlab-display-bind-preview');
  const motionRow = $('animlab-display-motion-row');

  // Keep one *live* control for each display channel. Reparenting retains all
  // pre-existing listeners and current localStorage settings in their modules.
  function move(id, parent) {
    const node = $(id), target = $(parent);
    if (node && target) target.appendChild(node);
    return node;
  }
  function moveOpacity(id, parent) {
    const input = $(id), target = $(parent);
    if (input && target) target.appendChild(input.closest('label') || input);
  }
  move('animlab-reference', 'animlab-display-static-toggle');
  moveOpacity('animlab-static-reference-opacity', 'animlab-display-static-opacity');
  move('animlab-reference-show', 'animlab-display-motion-toggle');
  moveOpacity('animlab-reference-opacity', 'animlab-display-motion-opacity');
  const ground = $('animlab-ground');
  const groundPlaceholder = $('animlab-display-ground-placeholder');
  if (ground && groundPlaceholder) groundPlaceholder.replaceWith(ground);
  if (oldViewport) oldViewport.hidden = true; // no longer has independent controls

  // The *advanced* source/alignment settings live in collapsible subsections of
  // Display, rather than competing panels farther down the character inspector.
  const staticSection = move('animlab-static-reference-section', 'animlab-display-extras');
  const motionSection = document.querySelector('.animlab-reference-section');
  if (motionSection) extras.appendChild(motionSection);
  const meshSection = move('animlab-mesh-preview-section', 'animlab-display-extras');
  if (staticSection) staticSection.querySelector('.animlab-section-title').textContent = 'Static reference · Source & Align';
  if (motionSection) motionSection.querySelector('.animlab-section-title').textContent = 'Motion reference · Timing & Align';
  if (meshSection) meshSection.querySelector('.animlab-section-title').textContent = 'Mesh / Wireframe';

  // Part Layout's extra reference show/opacity are duplicates of Display.
  // Keep the hidden original handlers for compatibility; expose Difference as
  // a single display-only action, and keep Rebind itself in Rig (it edits data).
  const redundantPartRef = document.querySelector('.animlab-art-reference-tools');
  if (redundantPartRef) redundantPartRef.hidden = true;
  const originalDifference = document.querySelector('[data-art-action="difference"]');
  const originalBind = document.querySelector('[data-action="preview-bind"]');
  differenceBtn?.addEventListener('click', () => originalDifference?.click());
  bindBtn?.addEventListener('click', () => originalBind?.click());
  if (originalBind) originalBind.hidden = true;
  if (legacyMode) legacyMode.hidden = true;

  // Put the *active* inspector first. Older module insertion order put Rig
  // behind several collider sliders and Skin behind unrelated utilities.
  const extension = $('animlab-extension');
  if (extension && setupSection) {
    for (const node of [document.querySelector('.animlab-rig-controls'),
                        document.querySelector('.animlab-drawing-method'),
                        document.querySelector('.animlab-art-layout-controls'),
                        $('animlab-skin-editor')]) {
      if (node) extension.insertBefore(node, setupSection);
    }
  }

  const readPrefs = () => {
    try {
      const value = JSON.parse(localStorage.getItem(DISPLAY_KEY) || 'null');
      return value && value.schema === 'animlab.editor-display.v1' ? value : null;
    } catch (_) { return null; }
  };
  const prefs = readPrefs();
  if (prefs?.overlays) {
    for (const key of fields) {
      if (typeof prefs.overlays[key] === 'boolean') core.setOverlay(key, prefs.overlays[key]);
    }
  }
  if (Number.isFinite(Number(prefs?.artOpacity))) core.setArtOpacity(Math.max(0, Math.min(1, Number(prefs.artOpacity))));
  if (typeof prefs?.outlines === 'boolean') window.AnimLabPartLayoutDisplay?.setOutlines?.(prefs.outlines);

  function persist() {
    if (core.getState().mode === 'play') return; // Quick Play temporarily swaps overlays
    const overlays = {};
    for (const key of fields) overlays[key] = core.getOverlay(key);
    try {
      localStorage.setItem(DISPLAY_KEY, JSON.stringify({
        schema: 'animlab.editor-display.v1', overlays,
        artOpacity: core.getArtOpacity(),
        outlines: window.AnimLabPartLayoutDisplay?.getOutlines?.() ?? true
      }));
    } catch (_) {} // private/offline storage may be unavailable
  }

  artInput?.addEventListener('input', () => {
    const value = Number(artInput.value) / 100;
    core.setArtOpacity(value);
    if (artOutput) artOutput.textContent = `${Math.round(value * 100)}%`;
    persist();
  });
  for (const btn of panel.querySelectorAll('[data-view], #animlab-ground, #animlab-reference')) {
    // Core/Stage2 owns actual state transitions. Persist after those listeners run.
    btn.addEventListener('click', () => queueMicrotask(persist));
  }
  outlineBtn?.addEventListener('click', () => {
    const display = window.AnimLabPartLayoutDisplay;
    display?.setOutlines?.(!display.getOutlines());
    persist();
    update(core.getState());
  });
  for (const btn of stageButtons) btn.addEventListener('click', () => {
    if (btn.disabled) return;
    core.navigateAuthorStage(btn.dataset.authorStage);
  });

  const tips = {
    atlas: 'Source-image mesh authoring. Layout stays in Parts.',
    parts: 'Arrange artwork. Skeleton stays fixed.',
    rig: 'Move joints without moving the artwork.',
    skin: 'Tune deforming regions and bone weights.',
    animate: 'Edit clips using the shared timeline.',
    play: 'Test this character’s working clips and movement.'
  };
  function update(s = core.getState()) {
    const stage = s.mode === 'setup'
      ? ({atlas:'atlas',art:'parts',rig:'rig',skin:'skin'}[s.setupTool] || 'rig')
      : s.mode === 'play' ? 'play' : 'animate';
    // Atlas has its own image-space controls; the shared Character Display
    // belongs only to Parts/Rig/Skin/Animate/Play. Restore it on exit.
    panel.hidden = stage === 'atlas';
    const caps = s.capabilities || core.getCharacterCapabilities?.() || {};
    const quadruped = caps.rigFamily === 'quadruped'; // legacy Difference overlay only
    for (const btn of stageButtons) {
      const id = btn.dataset.authorStage;
      const active = id === stage;
      btn.disabled = id === 'play' ? !caps.quickPlay :
        id === 'parts' ? !caps.authoring?.parts :
        id === 'skin' ? !caps.authoring?.skin : false;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      btn.setAttribute('aria-current', active ? 'step' : 'false');
    }
    if (stageCaption) stageCaption.textContent = tips[stage] || '';
    if (clipSection) clipSection.hidden = s.mode !== 'animate';
    if (setupSection) {
      setupSection.hidden = stage !== 'rig';
      // Only Rig needs the collider dimensions and overall character scale.
      for (const label of setupSection.querySelectorAll('label.animlab-slider'))
        label.hidden = s.mode === 'setup' && s.setupTool !== 'rig';
    }
    const alpha = Math.round(core.getArtOpacity() * 100);
    if (artInput && document.activeElement !== artInput) artInput.value = String(alpha);
    if (artOutput) artOutput.textContent = `${alpha}%`;
    // Preserve the user's mesh/weight debugging visibility in each context.
    if (outlineBtn) {
      outlineBtn.hidden = stage !== 'parts';
      const visible = window.AnimLabPartLayoutDisplay?.getOutlines?.() ?? true;
      outlineBtn.classList.toggle('active', visible);
      outlineBtn.setAttribute('aria-pressed', String(visible));
      outlineBtn.textContent = visible ? 'Outlines: On' : 'Outlines: Off';
    }
    if (differenceBtn) {
      differenceBtn.hidden = stage !== 'parts' || !quadruped;
      differenceBtn.textContent = originalDifference?.textContent || 'Difference: Off';
      differenceBtn.disabled = originalDifference?.disabled ?? true;
      differenceBtn.classList.toggle('active', !!originalDifference?.classList.contains('active'));
    }
    if (bindBtn) {
      bindBtn.hidden = stage !== 'rig' || !quadruped;
      bindBtn.textContent = originalBind?.textContent || 'Walk Preview: Off';
      bindBtn.disabled = originalBind?.disabled ?? false;
      bindBtn.classList.toggle('active', /Previous|Proposed/.test(bindBtn.textContent));
    }
    // Motion reference packs are installed only for compatible rig families;
    // the source/timing section reports missing packs. Keep the channel obvious.
    const available = !$('animlab-reference-controls')?.hidden;
    const motionShow = $('animlab-reference-show');
    const motionOpacity = $('animlab-reference-opacity');
    if (motionShow) motionShow.disabled = !available || stage === 'play';
    if (motionOpacity) motionOpacity.disabled = !available || stage === 'play';
    if (motionRow) motionRow.classList.toggle('animlab-layer-unavailable', !available);
  }
  core.subscribe(update);
  document.addEventListener('animlab:reference-ready', () => update(core.getState()));
  update();
})();
