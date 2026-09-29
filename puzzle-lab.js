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
  const resetBtn = document.getElementById('pl-reset-lab');

  function project() { return projectMap.get(state.groupId) || null; }
  function definition() { return project()?.def || null; }

  function projectBadge(id, def, source) {
    if (id === 'MOUNTAIN_CLIMB_PROTO') return 'PROTOTYPE';
    if (source === 'library') return 'LIBRARY';
    if (def?.lab?.category) return String(def.lab.category).toUpperCase();
    return 'PUZZLE';
  }

  function renderProjects() {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const item of projects) {
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
    const isClimb = state.groupId === 'MOUNTAIN_CLIMB_PROTO';
    document.getElementById('pl-checks-card').hidden = !isClimb;
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

  render();
})();
