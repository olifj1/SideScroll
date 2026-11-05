(() => {
  'use strict';

  const UI_KEY = 'sidescroll.puzzle-lab.ui.v1';
  const LAB_KEYS = [
    'sidescroll.puzzle-lab.runtime.v1',
    'sidescroll.puzzle-lab.starts.v1',
    'sidescroll.puzzle-lab.library.v1',
    'sidescroll.puzzle-lab.inventory.v1',
    'sidescroll.puzzle-lab.workshop.v1',
    'sidescroll.puzzle-lab.exclusions.v1',
    'sidescroll.puzzle-lab.scene.v1',
    'sidescroll.puzzle-lab.terrain-sections.v1',
    'sidescroll.puzzle-lab.launch.v1'
  ];

  const config = window.SideScrollPuzzleConfig || { groups:{} };
  const MAIN_LIBRARY_KEY = 'sidescroll.puzzle-groups.library.v1';
  const LAUNCH_KEY = 'sidescroll.puzzle-lab.launch.v1';
  const mainLibrary = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(MAIN_LIBRARY_KEY) || '{}') || {};
      parsed.groups ||= {}; parsed.templates ||= {}; parsed.markers ||= [];
      return parsed;
    } catch (_) { return { groups:{}, templates:{}, markers:[] }; }
  })();
  // Built-in puzzles hidden by the author (Hide, below); kept in the library so
  // the choice publishes with the project like the library itself.
  const hiddenBuiltIns = new Set(Array.isArray(mainLibrary.hiddenBuiltIns) ? mainLibrary.hiddenBuiltIns : []);
  let showHidden = false;
  const projectMap = new Map();
  for (const [id, def] of Object.entries(config.groups || {})) projectMap.set(id, { id, def, source:'built-in', template:null });
  for (const [id, def] of Object.entries(mainLibrary.groups || {})) projectMap.set(id, { id, def, source:'library', template:mainLibrary.templates?.[id] || null });
  const projects = [...projectMap.values()].sort((a,b) => {
    if (a.id === 'MOUNTAIN_CLIMB_PROTO') return -1;
    if (b.id === 'MOUNTAIN_CLIMB_PROTO') return 1;
    return String(a.def?.label || a.id).localeCompare(String(b.def?.label || b.id));
  });
  const preferredId = projectMap.has('MOUNTAIN_CLIMB_PROTO') ? 'MOUNTAIN_CLIMB_PROTO' : projects[0]?.id || null;

  const loadState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {};
      return {
        groupId: projectMap.has(parsed.groupId) ? parsed.groupId : preferredId,
        environment: ['blank','woodland','mountain'].includes(parsed.environment) ? parsed.environment : 'mountain',
        markerX: Number.isFinite(Number(parsed.markerX)) ? Number(parsed.markerX) : 0,
        collision: parsed.collision !== false,
        checks: parsed.checks && typeof parsed.checks === 'object' ? parsed.checks : {}
      };
    } catch (_) {
      return { groupId:preferredId, environment:'mountain', markerX:0, collision:true, checks:{} };
    }
  };

  const state = loadState();
  const saveState = () => {
    try { localStorage.setItem(UI_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const listEl = document.getElementById('pl-project-list');
  const selectedNameEl = document.getElementById('pl-selected-name');
  const selectedNoteEl = document.getElementById('pl-selected-note');
  const selectedMetaEl = document.getElementById('pl-selected-meta');
  const summaryEl = document.getElementById('pl-summary');
  const environmentEl = document.getElementById('pl-environment');
  const environmentNoteEl = document.getElementById('pl-environment-note');
  const positionInput = document.getElementById('pl-position');
  const positionValueEl = document.getElementById('pl-position-value');
  const collisionInput = document.getElementById('pl-collision');
  const setupBtn = document.getElementById('pl-open-setup');
  const testBtn = document.getElementById('pl-run-test');
  const editAssetBtn = document.getElementById('pl-edit-asset');
  const resetBtn = document.getElementById('pl-reset-lab');

  function project() { return projectMap.get(state.groupId) || null; }
  function definition() { return project()?.def || null; }

  function primaryAssetName() {
    const item = project();
    if (!item) return null;
    const objects = item.template?.objects && typeof item.template.objects === 'object'
      ? Object.values(item.template.objects)
      : (Array.isArray(item.def?.props) ? item.def.props : []);
    for (const object of objects) {
      const name = typeof object === 'string' ? object : (object?.asset || object?.name || null);
      if (name) return name;
    }
    return null;
  }

  function projectBadge(id, def, source) {
    if (id === 'MOUNTAIN_CLIMB_PROTO') return 'PROTOTYPE';
    if (source === 'library') return 'LIBRARY';
    if (def?.lab?.category) return String(def.lab.category).toUpperCase();
    return 'PUZZLE';
  }

  function visibleProjects() {
    return projects.filter(item => showHidden || !(item.source === 'built-in' && hiddenBuiltIns.has(item.id)));
  }
  function renderProjects() {
    if (!listEl) return;
    listEl.innerHTML = '';
    const hiddenCount = projects.filter(item => item.source === 'built-in' && hiddenBuiltIns.has(item.id)).length;
    const showHiddenBtn = document.getElementById('pl-show-hidden');
    if (showHiddenBtn) {
      showHiddenBtn.hidden = !hiddenCount;
      showHiddenBtn.textContent = showHidden ? 'Hide hidden built-in puzzles' : `Show ${hiddenCount} hidden built-in puzzle${hiddenCount === 1 ? '' : 's'}`;
    }
    for (const item of visibleProjects()) {
      const { id, def, source } = item;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pl-project${id === state.groupId ? ' active' : ''}`;
      const templateModifiers = Array.isArray(item.template?.worldModifiers) ? item.template.worldModifiers.length : 0;
      const modifiers = templateModifiers || (Array.isArray(def.worldModifiers) ? def.worldModifiers.length : 0);
      const templateObjects = item.template?.objects && typeof item.template.objects === 'object' ? Object.keys(item.template.objects).length : 0;
      const props = templateObjects || (Array.isArray(def.props) ? def.props.length : 0);
      button.innerHTML = `<span><strong>${def.label || id}</strong><small>${props} owned object${props === 1 ? '' : 's'}${modifiers ? ` · ${modifiers} world modifier${modifiers === 1 ? '' : 's'}` : ''}</small></span><b>${projectBadge(id,def,source)}</b>`;
      button.addEventListener('click', () => {
        state.groupId = id;
        if (def?.lab?.recommendedEnvironment) state.environment = def.lab.recommendedEnvironment;
        saveState();
        render();
      });
      listEl.appendChild(button);
    }
  }

  function renderSelected() {
    const def = definition();
    if (!def) return;
    selectedNameEl.textContent = def.label || state.groupId;
    selectedNoteEl.textContent = def.lab?.note || 'Reusable puzzle definition loaded into a disposable Puzzle Lab stage.';
    summaryEl.textContent = `${def.label || state.groupId} · sandbox`;
    const item = project();
    const props = item?.template?.objects && typeof item.template.objects === 'object' ? Object.keys(item.template.objects) : (Array.isArray(def.props) ? def.props : []);
    const modifiers = Array.isArray(item?.template?.worldModifiers) ? item.template.worldModifiers : (Array.isArray(def.worldModifiers) ? def.worldModifiers : []);
    const bounds = item?.template?.bounds || def.bounds || null;
    const width = bounds && Number.isFinite(Number(bounds.minX)) && Number.isFinite(Number(bounds.maxX))
      ? Number(bounds.maxX) - Number(bounds.minX)
      : Number(def.width) || 0;
    const tags = [
      def.lab?.mechanic || null,
      item?.source === 'library' ? 'Local Puzzle Library' : 'Built-in definition',
      `${width.toFixed(1)} m bounds`,
      `${props.length} object${props.length === 1 ? '' : 's'}`,
      modifiers.length ? `${modifiers.length} world modifier${modifiers.length === 1 ? '' : 's'}` : 'No world modifier'
    ].filter(Boolean);
    selectedMetaEl.innerHTML = tags.map(tag => `<span>${tag}</span>`).join('');
    renderManage();
    const isClimb = state.groupId === 'MOUNTAIN_CLIMB_PROTO';
    document.getElementById('pl-checks-card').hidden = !isClimb;
    const primaryAsset = primaryAssetName();
    if (editAssetBtn) {
      editAssetBtn.hidden = !primaryAsset;
      editAssetBtn.dataset.asset = primaryAsset || '';
    }
  }

  function renderEnvironment() {
    for (const button of environmentEl?.querySelectorAll('[data-environment]') || []) {
      const active = button.dataset.environment === state.environment;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    const notes = {
      blank:'Blank uses the clean gameplay terrain with procedural world dressing removed.',
      woodland:'Woodland adds the existing procedural forest dressing around the isolated puzzle.',
      mountain:'Mountain currently uses a clean stage with no woodland dressing, ready for the mountain renderer later.'
    };
    if (environmentNoteEl) environmentNoteEl.textContent = notes[state.environment] || notes.blank;
  }

  function renderPosition() {
    if (positionInput) positionInput.value = Number(state.markerX).toFixed(1).replace(/\.0$/,'');
    if (positionValueEl) positionValueEl.textContent = `${Number(state.markerX).toFixed(1)} m`;
    for (const button of document.querySelectorAll('[data-position]')) {
      button.classList.toggle('active', Math.abs(Number(button.dataset.position) - Number(state.markerX)) < 0.001);
    }
  }

  function renderChecks() {
    for (const input of document.querySelectorAll('[data-check]')) input.checked = !!state.checks[input.dataset.check];
  }

  function render() {
    renderProjects();
    renderSelected();
    renderEnvironment();
    renderPosition();
    if (collisionInput) collisionInput.checked = !!state.collision;
    renderChecks();
  }

  function launch(autoTest) {
    const item = project();
    if (!item?.def) return;
    saveState();
    try {
      localStorage.setItem(LAUNCH_KEY, JSON.stringify({
        version:1,
        groupId:item.id,
        source:item.source,
        groupDef:item.def,
        template:item.template || null,
        launchedAt:Date.now()
      }));
    } catch (_) {}
    const params = new URLSearchParams();
    params.set('lab','puzzle');
    params.set('group',state.groupId);
    params.set('environment',state.environment);
    params.set('markerX',String(Number(state.markerX) || 0));
    if (state.collision) params.set('collision','1');
    if (autoTest) params.set('autotest','1');
    location.href = `play.html?${params.toString()}`;
  }

  environmentEl?.addEventListener('click', event => {
    const button = event.target.closest('[data-environment]');
    if (!button) return;
    state.environment = button.dataset.environment;
    saveState();
    renderEnvironment();
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-position]');
    if (!button) return;
    state.markerX = Number(button.dataset.position) || 0;
    saveState();
    renderPosition();
  });

  positionInput?.addEventListener('input', () => {
    const value = Number(positionInput.value);
    if (!Number.isFinite(value)) return;
    state.markerX = value;
    saveState();
    renderPosition();
  });

  collisionInput?.addEventListener('change', () => {
    state.collision = !!collisionInput.checked;
    saveState();
  });

  for (const input of document.querySelectorAll('[data-check]')) {
    input.addEventListener('change', () => {
      state.checks[input.dataset.check] = !!input.checked;
      saveState();
    });
  }

  setupBtn?.addEventListener('click', () => launch(false));
  testBtn?.addEventListener('click', () => launch(true));
  editAssetBtn?.addEventListener('click', () => {
    const asset = editAssetBtn.dataset.asset || primaryAssetName();
    if (!asset) return;
    location.href = `asset-lab.html?asset=${encodeURIComponent(asset)}&from=puzzle-lab`;
  });
  resetBtn?.addEventListener('click', () => {
    if (!window.confirm('Reset only Puzzle Lab test/setup state? Main-world puzzle placement and World Lab data will not be touched.')) return;
    for (const key of LAB_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
    state.checks = {};
    saveState();
    renderChecks();
    resetBtn.textContent = 'Puzzle Lab Test Data Reset';
    setTimeout(() => { resetBtn.textContent = 'Reset Puzzle Lab Test Data'; }, 1500);
  });

  // ---- Delete (library) / Hide (built-in) ------------------------------------
  // Library puzzles are project data: Delete removes the definition, its start
  // state and its template entry — refused while it is placed in the world, so the
  // world never loses a puzzle. Built-in puzzles are code: they can only be hidden.
  const deleteBtn = document.getElementById('pl-delete');
  const manageNoteEl = document.getElementById('pl-manage-note');
  function readLibrary() {
    try { const lib = JSON.parse(localStorage.getItem(MAIN_LIBRARY_KEY) || '{}') || {}; lib.groups ||= {}; lib.templates ||= {}; lib.markers ||= []; return lib; }
    catch (_) { return null; }
  }
  function placementsOf(lib, id) { return (lib?.markers || []).filter(marker => marker?.group === id); }
  function renderManage() {
    const item = project();
    if (!deleteBtn || !item) return;
    if (item.source === 'built-in') {
      const hidden = hiddenBuiltIns.has(item.id);
      deleteBtn.textContent = hidden ? 'Show this built-in puzzle' : 'Hide this built-in puzzle';
      deleteBtn.disabled = false;
      manageNoteEl.textContent = 'Built-in puzzles are part of the game code, so they can be hidden here, not deleted.';
      return;
    }
    const placed = placementsOf(readLibrary(), item.id);
    deleteBtn.textContent = 'Delete puzzle';
    deleteBtn.disabled = placed.length > 0;
    manageNoteEl.textContent = placed.length
      ? `Placed in your world ${placed.length === 1 ? 'once' : `${placed.length} times`} (at x ${placed.map(m => Math.round(Number(m.x) || 0)).join(', ')} m). Remove it from the world in the game editor first.`
      : 'Not placed in your world. Deleting removes it from the project (Publish to remove it for everyone).';
  }
  function saveLibrary(lib) {
    try { localStorage.setItem(MAIN_LIBRARY_KEY, JSON.stringify(lib)); return true; }
    catch (err) { window.alert(`Couldn't save: ${err?.message || err}`); return false; }
  }
  deleteBtn?.addEventListener('click', () => {
    const item = project(), lib = readLibrary();
    if (!item || !lib) return;
    const name = item.def?.label || item.id;
    if (item.source === 'built-in') {
      if (hiddenBuiltIns.has(item.id)) hiddenBuiltIns.delete(item.id); else hiddenBuiltIns.add(item.id);
      lib.hiddenBuiltIns = [...hiddenBuiltIns];
      if (!saveLibrary(lib)) return;
      if (hiddenBuiltIns.has(item.id) && !showHidden) state.groupId = visibleProjects()[0]?.id || state.groupId;
      saveState(); render(); return;
    }
    if (placementsOf(lib, item.id).length) { renderManage(); return; }
    if (!window.confirm(`Delete “${name}” from the project? Its definition, start state and template are removed. This cannot be undone (a Project Backup can bring it back).`)) return;
    delete lib.groups[item.id];
    delete lib.templates[item.id];
    if (Array.isArray(lib.puzzleTemplates)) lib.puzzleTemplates = lib.puzzleTemplates.filter(t => t?.groupId !== item.id);
    if (!saveLibrary(lib)) return;
    state.groupId = null; saveState();
    location.reload();
  });
  document.getElementById('pl-show-hidden')?.addEventListener('click', () => { showHidden = !showHidden; render(); });

  if (!projectMap.has(state.groupId) || (!showHidden && project()?.source === 'built-in' && hiddenBuiltIns.has(state.groupId)))
    state.groupId = visibleProjects()[0]?.id || state.groupId;
  render();
})();
