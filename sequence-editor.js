/* SideScroll Story editor (game editor → Story scope): sequences and events.
 * Design: docs/SEQUENCE_SYSTEM_DESIGN.md (agreed 10 Nov 2026).
 *
 * One pattern everywhere: a list → open → edit page; things are added only with
 * "+ Add …" from a list, and each thing is edited in one place.
 *   Sequences list → Sequence page: Placement, Components, Logic.
 *   Events list    → Event page: Roles, Steps, Used by.
 * Edits are a draft, shown live in the game (SideScrollSequenceHost.preview) and
 * written by Save (SideScrollSequences.save); Discard goes back to the saved copy.
 * Taps in the game view arrive as sidescroll:story-tap (place / move / select).
 */
(() => {
  'use strict';
  const Seq = window.SideScrollSequences;
  const host = window.SideScrollSequenceHost;
  const panel = document.getElementById('sidescroll-story-panel');
  if (!Seq || !host || !panel) return;

  const clone = value => JSON.parse(JSON.stringify(value));
  let draft = clone(Seq.load());
  let dirty = false;
  // page: 'list' | 'sequence' | 'event'; tab (list page): 'sequences' | 'events'
  const view = { page: 'list', tab: 'sequences', placed: null, event: null, component: null };
  let placeMode = null; // {kind:'add', comp} | {kind:'anchor'} | {kind:'component', id}


  // ---- Small DOM helpers ----------------------------------------------------
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (value === true) node.setAttribute(key, '');
      else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value);
    }
    for (const child of children.flat()) if (child) node.append(child);
    return node;
  };
  const fmt = (n, d = 1) => Number(n).toFixed(d);
  const btn = (label, onclick, cls = '') => el('button', { type: 'button', class: cls, onclick }, label);
  const field = (label, control, note) => el('label', { class: 'sidescroll-story-field' }, el('span', { text: label }), control, note ? el('small', { text: note }) : null);
  const row = (...children) => el('div', { class: 'sidescroll-story-row' }, ...children);
  function segmented(options, value, onPick) {
    return el('div', { class: 'sidescroll-story-segmented', role: 'group' },
      options.map(([key, label]) => el('button', { type: 'button', class: String(key) === String(value) ? 'active' : '',
        'aria-pressed': String(String(key) === String(value)), onclick: () => onPick(key) }, label)));
  }
  function select_(options, value, onPick) {
    const node = el('select', {}, options.map(([key, label]) => el('option', { value: key, selected: String(key) === String(value ?? '') }, label)));
    node.addEventListener('change', () => onPick(node.value));
    return node;
  }
  function textInput(item, key, max = 40, after, placeholder) {
    const input = el('input', { type: 'text', value: item[key] ?? '', maxlength: max, placeholder });
    input.addEventListener('input', () => { item[key] = input.value; change(false); });
    input.addEventListener('change', () => { after?.(); render(); });
    return input;
  }
  function numberInput(item, key, min, max, step, fallback) {
    const input = el('input', { type: 'number', min, max, step, value: item[key] ?? fallback, inputmode: 'decimal' });
    input.addEventListener('change', () => { const n = Number(input.value); item[key] = Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback)); change(); });
    return input;
  }
  function slider(item, key, min, max, step, label, digits = 2, suffix = '') {
    const out = el('b', { text: `${fmt(item[key], digits)}${suffix}` });
    const input = el('input', { type: 'range', min, max, step, value: item[key] });
    input.addEventListener('input', () => { item[key] = Number(input.value); out.textContent = `${fmt(item[key], digits)}${suffix}`; change(false); });
    return el('label', { class: 'sidescroll-story-field sidescroll-story-slider' }, el('span', {}, label, ' ', out), input);
  }
  const section = (title, ...children) => el('section', { class: 'sidescroll-seq-section' }, el('h4', { text: title }), ...children);
  // One editing pattern (see docs/SIDESCROLL_ENGINE_UX_BIBLE.md, Sequences editor):
  // a section's add buttons sit at its top, equal widths; an add with a choice
  // opens a short list to pick from; each row has a small × on its right.
  const addBar = (...buttons) => el('div', { class: 'sidescroll-seq-addbar' }, ...buttons.filter(Boolean));
  const xBtn = (onclick, label = 'Remove') => el('button', { type: 'button', class: 'sidescroll-seq-x', 'aria-label': label, title: label, onclick }, '×');
  // "Choose from a list" opens the asset browser's window on the right (the same
  // picker the Environment and Puzzle editors use); tapping the same button again
  // closes it. options: [{value, label, thumb, note}].
  let chooserKey = null;
  function openChooser(key, title, options, onPick, subtitle = 'Tap one to choose it') {
    if (chooserKey === key && host.pickerOpen()) { host.closePicker(); chooserKey = null; return; }
    chooserKey = key;
    // The timeline covers the editor: step aside while the list is open.
    if (timeline.open) {
      timeline.picking = true; timeline.root?.classList.add('picking');
      clearInterval(timeline.pickTimer);
      timeline.pickTimer = setInterval(() => {
        if (host.pickerOpen()) return;
        clearInterval(timeline.pickTimer); timeline.picking = false; timeline.root?.classList.remove('picking');
      }, 250);
    }
    const groupLabel = { characters: 'Characters', swap: 'Characters', steps: 'Steps', templates: 'Templates' }[key] || 'Choose';
    host.openPicker({ title, subtitle, groupLabel, choices: options.map(o => ({ label: o.label, thumb: o.thumb || '◇', description: o.note || '',
      onSelect: () => { chooserKey = null; onPick(o.value); } })) });
  }
  function closeChooser() { if (chooserKey) { host.closePicker(); chooserKey = null; } }
  const chooserBox = () => null;
  // After a render, scroll a newly added item into view (data-reveal).
  let reveal = null;
  const help = text => el('p', { class: 'sidescroll-story-help', text });

  // ---- Draft access -----------------------------------------------------------
  const placedById = id => draft.placed.find(p => p.id === id) || null;
  const templateById = id => draft.templates.find(t => t.id === id) || null;
  const eventById = id => draft.events.find(e => e.id === id) || null;
  const bodyOf = p => p.template ? (templateById(p.template)?.body || (p.body = { components: [], logic: [] })) : (p.body ||= { components: [], logic: [] });
  const instancesOf = templateId => draft.placed.filter(p => p.template === templateId);
  const takenIds = () => {
    const out = new Set([...draft.events.map(e => e.id), ...draft.templates.map(t => t.id), ...draft.placed.map(p => p.id)]);
    for (const e of draft.events) for (const r of e.roles) out.add(r.id);
    for (const b of [...draft.templates.map(t => t.body), ...draft.placed.map(p => p.body).filter(Boolean)])
      for (const x of [...b.components, ...b.logic]) out.add(x.id);
    return out;
  };
  const characterChoices = () => host.characters();
  const characterName = id => characterChoices().find(c => c.id === id)?.name || id;
  const slotChoices = () => (window.SideScrollActionSlots?.list() || ['idle', 'walk', 'run', 'jump'].map(id => ({ id, name: id[0].toUpperCase() + id.slice(1) })))
    .map(s => [s.id, s.name]);
  function knownFlags() {
    const out = new Set(Object.keys(host.progress().flags || {}));
    for (const e of draft.events) for (const s of e.steps) if (s.type === 'flag' && s.flag) out.add(s.flag);
    for (const b of [...draft.templates.map(t => t.body), ...draft.placed.map(p => p.body).filter(Boolean)])
      for (const l of b.logic) { if (l.condition?.flag) out.add(l.condition.flag); if (l.when?.flag) out.add(l.when.flag); }
    return [...out].filter(Boolean).sort();
  }
  function flagInput(value, onSet) {
    const input = el('input', { type: 'text', value: value || '', placeholder: 'flag name, e.g. met-father', list: 'sidescroll-seq-flags', autocapitalize: 'none', spellcheck: 'false' });
    input.addEventListener('change', () => { input.value = Seq.flagName(input.value); onSet(input.value); });
    return input;
  }

  // ---- Preview, change, navigation ------------------------------------------
  function normalised() {
    return { events: Seq.normaliseEvents({ events: draft.events }), ...Seq.normaliseSequences({ templates: draft.templates, placed: draft.placed }) };
  }
  function preview() { host.preview(normalised()); }
  function change(rerender = true) { dirty = true; preview(); if (rerender) render(); else updateStatus(); }
  function syncSelection() { host.select(view.page === 'sequence' ? view.placed : null, view.page === 'sequence' ? view.component : null); }
  function open(page, id, extra = {}) {
    placeMode = null; closeChooser();
    view.page = page;
    if (page === 'sequence') { view.placed = id; view.component = extra.component || null; const p = placedById(id); if (p && extra.focus !== false) host.lookAt(p.x); }
    if (page === 'event') { view.event = id; view.returnTo = extra.returnTo || null; view.openStep = null; }
    if (page === 'list' && extra.tab) view.tab = extra.tab;
    syncSelection();
    render();
    panel.closest('.sidescroll-editor-drawer-body, #sidescroll-editor-drawer-body')?.scrollTo?.({ top: 0 });
  }
  function setPlaceMode(mode, message) { placeMode = mode; if (mode && message) host.hint(message); render(); }

  // ---- Taps in the game view ----------------------------------------------------
  window.addEventListener('sidescroll:story-tap', event => {
    if (!host.active()) return;
    const { clientX, clientY } = event.detail || {};
    if (placeMode) {
      const point = host.groundPointAt(clientX, clientY);
      if (!point) { host.hint('Tap on the ground'); return; }
      const p = placedById(view.placed), depth = Math.max(Seq.DEPTH[0], Math.min(Seq.DEPTH[1], point.z));
      if (placeMode.kind === 'new-sequence') {
        const id = Seq.newId('sq', takenIds());
        draft.placed.push({ id, name: `Sequence ${draft.placed.length + 1}`, x: point.x, body: { components: [], logic: [] } });
        placeMode = null; change(false); open('sequence', id, { focus: false });
        host.hint('Placed a sequence · add its components and logic');
        return;
      }
      if (placeMode.kind === 'place-template') {
        const t = templateById(placeMode.template);
        if (t) {
          const id = Seq.newId('sq', takenIds());
          draft.placed.push({ id, name: t.name, x: point.x, template: t.id });
          placeMode = null; change(false); open('sequence', id, { focus: false });
          host.hint(`Placed “${t.name}” · an instance of the template`);
        }
        return;
      }
      if (!p) { placeMode = null; render(); return; }
      const body = bodyOf(p);
      if (placeMode.kind === 'add') {
        const comp = { ...placeMode.comp, id: Seq.newId('c', takenIds()), dx: point.x - p.x, depth: placeMode.comp.kind === 'zone' ? 0 : depth };
        body.components.push(comp);
        view.component = comp.id; reveal = comp.id;
        host.hint(`Added ${comp.name}`);
      } else if (placeMode.kind === 'anchor') {
        p.x = point.x;
        host.hint('Sequence moved (its components move with it)');
      } else if (placeMode.kind === 'component') {
        const comp = body.components.find(c => c.id === placeMode.id);
        if (comp) { comp.dx = point.x - p.x; if (comp.kind !== 'zone') comp.depth = depth; }
        host.hint('Moved');
      }
      placeMode = null;
      syncSelection();
      change();
      return;
    }
    const hit = host.itemAt(clientX, clientY);
    if (hit?.component) open('sequence', hit.placed, { component: hit.component, focus: false });
    else if (hit?.placed) open('sequence', hit.placed, { focus: false });
  });

  // ---- List page ------------------------------------------------------------------
  function listPage() {
    const placed = [...draft.placed].sort((a, b) => a.x - b.x);
    const uses = id => draft.placed.reduce((n, p) => n + bodyOf(p).logic.filter(l => l.event === id).length, 0);
    return [
      segmented([['sequences', `Sequences (${draft.placed.length})`], ['events', `Events (${draft.events.length})`]], view.tab, v => { view.tab = v; placeMode = null; render(); }),
      ...(view.tab === 'sequences' ? [
        addBar(btn(placeMode?.kind === 'new-sequence' ? 'Cancel' : '+ New sequence', () => setPlaceMode(placeMode?.kind === 'new-sequence' ? null : { kind: 'new-sequence' }, 'Tap the ground where the sequence goes'), placeMode?.kind === 'new-sequence' ? 'active' : 'primary'),
          draft.templates.length ? btn(placeMode?.kind === 'place-template' ? 'Cancel' : '+ Place a template', () => placeMode?.kind === 'place-template' ? setPlaceMode(null)
            : openChooser('templates', 'Place a template', draft.templates.map(t => ({ value: t.id, label: t.name, thumb: '▣', note: `placed ${instancesOf(t.id).length}×` })),
              id => setPlaceMode({ kind: 'place-template', template: id }, 'Tap the ground where it goes')), placeMode?.kind === 'place-template' ? 'active' : 'primary') : null),
        chooserBox('templates'),
        help('Sequences placed in the world, in journey order. Tap one (here or its post in the view) to open it.'),
        el('div', { class: 'sidescroll-story-list' }, placed.length ? placed.map(p => el('button', { type: 'button', onclick: () => open('sequence', p.id) },
          el('strong', { text: `▣ ${p.name}` }),
          el('small', { text: `${fmt(p.x)} m · ${p.template ? `template ${templateById(p.template)?.name || ''}` : 'unique'} · ${bodyOf(p).logic.length} line${bodyOf(p).logic.length === 1 ? '' : 's'}` })))
          : help('No sequences yet.'))
      ] : [
        addBar(btn('+ New event', () => {
          const taken = takenIds(), id = Seq.newId('ev', taken), actor = Seq.newId('r', taken);
          draft.events.push({ id, name: `Event ${draft.events.length + 1}`, roles: [{ id: actor, name: 'Actor', kind: 'character' }], steps: [] });
          change(false); open('event', id);
        }, 'primary')),
        help('Events are reusable chains of steps, written with placeholders (Actor, Exit…) that each sequence fills in. Any sequence can run any event.'),
        el('div', { class: 'sidescroll-story-list' }, draft.events.length ? [...draft.events].sort((a, b) => a.name.localeCompare(b.name)).map(e => el('button', { type: 'button', onclick: () => open('event', e.id) },
          el('strong', { text: `✦ ${e.name}` }), el('small', { text: `${e.steps.length} step${e.steps.length === 1 ? '' : 's'} · used ${uses(e.id)}×` })))
          : help('No events yet.'))
      ]),
      progressBox()
    ];
  }

  // ---- Sequence page -------------------------------------------------------------
  const KIND_ICON = { character: '☺', mark: '◆', zone: '⚑' };
  const STEP_ICON = { move: '→', animate: '↻', face: '⇆', say: '❝', think: '☁', wait: '⏱', flag: '⚑', show: '◐', control: '✋', camera: '▣', screen: '▬', prompt: '◇', item: '✚', look: '◑', effect: '✺', prop: '⚒' };

  // ---- Steps: timing, summaries, beats, moving (step list and timeline) --------
  // A beat is a step and the "at the same time" steps after it; the next beat
  // starts when everything in it has finished (except "don't wait" steps).
  const STEP_KIND = { say: 'speech', think: 'speech', camera: 'view', screen: 'view', look: 'view',
    move: 'actor', animate: 'actor', face: 'actor', show: 'actor', effect: 'actor', prop: 'actor' }; // else 'logic'
  const roleName = (e, id) => (id === Seq.PLAYER ? 'Player' : e.roles.find(r => r.id === id)?.name || '…');
  const clip = (text, n = 34) => (String(text || '').length > n ? `${String(text).slice(0, n - 1)}…` : String(text || ''));
  // How long a step takes: {seconds, approx (a guess: own walking speed, an
  // animation's length), open (waits for the player)}.
  function stepTiming(s) {
    switch (s.type) {
      case 'say': case 'think': case 'wait': case 'look': case 'screen': return { seconds: s.seconds };
      case 'camera': return { seconds: s.seconds };
      case 'move': return s.timing === 'time' ? { seconds: s.seconds } : { seconds: 3, approx: true };
      case 'animate': return s.mode === 'loop' ? { seconds: 0 } : { seconds: 1.2 * (s.times || 1), approx: true };
      case 'face': return { seconds: 0.3 };
      case 'effect': return { seconds: (s.delay || 0) + (s.keys || []).reduce((t, k) => t + k.seconds, 0) };
      case 'prompt': return { seconds: 2, open: true };
      default: return { seconds: 0 };
    }
  }
  const timingLabel = t => (t.open ? 'until Action' : t.seconds ? `${t.approx ? '~' : ''}${fmt(t.seconds, t.seconds % 1 ? 1 : 0)} s` : 'instant');
  function stepSummary(e, s) {
    const who = roleName(e, s.actor);
    switch (s.type) {
      case 'move': return `${who} ${s.animation === 'run' ? 'runs' : 'walks'} to ${roleName(e, s.to)}`;
      case 'animate': return `${who} · ${s.animation}${s.mode === 'loop' ? ' (loop)' : ''}`;
      case 'face': return `${who} faces ${s.toward === 'character' ? roleName(e, s.target) : s.toward}`;
      case 'say': return `${s.actor ? `${who}: ` : ''}“${clip(s.text)}”`;
      case 'think': return `Thinks “${clip(s.text)}”`;
      case 'wait': return `Wait ${fmt(s.seconds, s.seconds % 1 ? 1 : 0)} s`;
      case 'flag': return `${s.value ? 'Set' : 'Clear'} ${s.flag}`;
      case 'show': return `${who} ${s.visible ? 'appears' : 'disappears'}`;
      case 'control': return s.take ? 'Take control' : 'Give control back';
      case 'camera': return s.mode === 'back' ? 'Camera back' : `Camera → ${s.target ? roleName(e, s.target) : 'player'}`;
      case 'screen': return Seq.SCREEN_ACTIONS[s.action] || s.action;
      case 'prompt': return `Wait for Action “${s.label}”`;
      case 'item': return `${s.give ? 'Give' : 'Take'} ${s.count > 1 ? `${s.count} × ` : ''}${s.item}`;
      case 'effect': return `${(host.effects?.() || []).find(x => x.id === s.asset)?.name || 'Effect'} on ${who}`;
      case 'look': return `Look: ${(host.looks?.() || []).find(x => x.id === s.look)?.name || 'base look'}`;
      case 'prop': return `${who} · ${(Seq.PROP_ACTIONS[s.action] || '').toLowerCase()} ${clip((host.props?.() || []).find(x => x.id === s.asset)?.name || s.asset || '…', 18)}`;
      default: return Seq.STEPS[s.type]?.label || s.type;
    }
  }
  // [[step index, …], …] — each beat's steps.
  function beatsOf(steps) {
    const beats = [];
    steps.forEach((s, i) => { if (!beats.length || !s.with || i === 0) beats.push([i]); else beats[beats.length - 1].push(i); });
    return beats;
  }
  // Takes step `from` out of its beat; a beat it led keeps the rest together.
  function detachStep(steps, from) {
    const s = steps[from];
    if (!s.with && steps[from + 1]?.with) steps[from + 1].with = false;
    steps.splice(from, 1);
    return s;
  }
  // Timeline drop: {join: step} (run with that step's beat) | {before: step} (its
  // own beat just before that one) | {end: true}. Returns the step's new index.
  function moveStep(e, from, target) {
    const steps = e.steps, s = steps[from];
    if (target.join === s || target.before === s) return from;
    detachStep(steps, from);
    let at = steps.length;
    if (target.join) {
      const beat = beatsOf(steps).find(b => b.includes(steps.indexOf(target.join)));
      at = beat ? beat[beat.length - 1] + 1 : steps.length;
      s.with = true;
    } else if (target.before) {
      at = Math.max(0, steps.indexOf(target.before));
      s.with = false;
    } else s.with = false;
    steps.splice(at, 0, s);
    if (steps[0]) steps[0].with = false;
    return at;
  }
  // Step list drag: to position `to` (0…length, before the step there), keeping
  // its "at the same time" setting (it joins whatever is before it there).
  function moveStepTo(e, from, to) {
    const steps = e.steps;
    if (to === from || to === from + 1) return from;
    const s = detachStep(steps, from);
    const at = to > from ? to - 1 : to;
    steps.splice(at, 0, s);
    if (steps[0]) steps[0].with = false;
    return at;
  }
  function componentEditor(p, body, c) {
    const moving = placeMode?.kind === 'component' && placeMode.id === c.id;
    const worldX = el('input', { type: 'number', step: '0.1', value: fmt(p.x + c.dx, 2), inputmode: 'decimal' });
    worldX.addEventListener('change', () => { const n = Number(worldX.value); if (Number.isFinite(n)) { c.dx = n - p.x; change(); } });
    const nudge = d => btn(d > 0 ? `+${d}` : `−${-d}`, () => { c.dx = Math.round((c.dx + d) * 100) / 100; change(); });
    const parts = [
      field('Name', textInput(c, 'name', 30)),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: c.kind === 'zone' ? 'Centre along the journey (m)' : 'Along the journey (m)' }),
        el('div', { class: 'sidescroll-story-nudge' }, nudge(-1), nudge(-0.1), worldX, nudge(0.1), nudge(1))),
      row(btn(moving ? 'Cancel move' : 'Move by tap', () => setPlaceMode(moving ? null : { kind: 'component', id: c.id }, 'Tap the ground where it goes'), moving ? 'active' : ''))
    ];
    if (c.kind !== 'zone') parts.push(slider(c, 'depth', -15, 8, 0.05, 'Depth (0 = path centre, + nearer)', 2, ' m'),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Facing' }), segmented([['-1', 'Left'], ['1', 'Right']], String(c.facing), v => { c.facing = Number(v); change(); })));
    if (c.kind === 'zone') parts.push(field('Width (m)', numberInput(c, 'width', 0.2, 40, 0.1, 2)));
    if (c.kind === 'character') parts.push(
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Character' }),
        el('div', { class: 'sidescroll-seq-item' }, el('div', { class: 'sidescroll-seq-current', text: characterName(c.character) }),
          btn('Change…', () => openChooser('swap', `Swap ${c.name} for…`, characterChoices().filter(x => x.id !== c.character)
            .map(x => ({ value: x.id, label: x.name, thumb: x.family === 'quadruped' ? '🐾' : '☺', note: x.family === 'quadruped' ? 'Quadruped' : 'Biped' })), id => {
            if (c.name === characterName(c.character)) c.name = characterName(id); // an unrenamed component follows its character
            c.character = id; change(); host.hint(`Swapped to ${characterName(id)} · its place, animation and logic stay`);
          }, 'Its place, standing animation and logic stay the same')))),
      field('Standing animation', select_(slotChoices(), c.animation, v => { c.animation = v; change(); }), 'Loops until an event moves or animates it'),
      slider(c, 'scale', 0.3, 3, 0.01, 'Size (× its own)', 2),
      holdsField(c),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Blocks the player' }),
        segmented([['auto', 'Auto'], ['always', 'Always'], ['never', 'Never']], c.blocks, v => { c.blocks = v; change(); }),
        el('small', { text: 'Auto: blocks while it stands on the path; it can’t be walked or jumped past.' })));
    return el('div', { class: 'sidescroll-story-editor' }, ...parts);
  }
  // Props a character holds from the start (a Prop step can change it while playing).
  const propChoices = () => host.props?.() || [];
  const propLabel = id => propChoices().find(x => x.id === id)?.name || id;
  function chooseProp(key, title, onPick) {
    openChooser(key, title, propChoices().map(x => ({ value: x.id, label: x.name, thumb: x.held ? '⚒' : '◇',
      note: x.held ? `${x.group} · hold set up in Character Lab` : x.group })), onPick,
      'How it is held (hand, place, angle, size) is set per character in Character Lab → Props');
  }
  function holdsField(c) {
    const holding = c.holding || [];
    return el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Holds' }),
      holding.map((name, i) => el('div', { class: 'sidescroll-seq-item' }, el('div', { class: 'sidescroll-seq-current', text: `⚒ ${propLabel(name)}` }),
        xBtn(() => { holding.splice(i, 1); if (holding.length) c.holding = holding; else delete c.holding; change(); }, `Stop holding ${propLabel(name)}`))),
      holding.length < 4 ? btn('+ Prop', () => chooseProp('holds', `${c.name} holds…`, name => {
        c.holding = [...new Set([...holding, name])]; change(); host.hint(`${c.name} holds ${propLabel(name)} · set the grip in Character Lab → Props`);
      })) : null,
      el('small', { text: 'Held from the start. Hand, place, angle and size: Character Lab → Props.' }));
  }
  function removeComponent(body, c) {
    if (!confirm(`Remove ${c.name}? Logic using it loses that part.`)) return;
    body.components = body.components.filter(x => x.id !== c.id);
    for (const l of body.logic) { for (const [r, id] of Object.entries(l.roles || {})) if (id === c.id) delete l.roles[r]; if (l.when?.zone === c.id) delete l.when.zone; }
    if (view.component === c.id) view.component = null;
    syncSelection(); change();
  }
  const lineName = (body, l) => `Line ${body.logic.indexOf(l) + 1}${eventById(l.event) ? `: ${eventById(l.event).name}` : ''}`;
  function lineEditor(p, body, l, index) {
    const zones = body.components.filter(c => c.kind === 'zone');
    const event = eventById(l.event);
    const when = l.when ||= { type: 'enter' };
    const whenRows = [select_(Object.entries(Seq.WHEN), when.type, v => { l.when = { type: v }; change(); })];
    if (when.type === 'enter' || when.type === 'leave' || when.type === 'action') {
      whenRows.push(zones.length ? select_([['', 'Choose a zone…'], ...zones.map(z => [z.id, `⚑ ${z.name}`])], when.zone, v => { when.zone = v || undefined; change(); })
        : help('Add a zone to this sequence first (Components).'));
      if (when.type === 'action') { when.label ||= 'Talk'; whenRows.push(field('Action button reads', textInput(when, 'label', 14))); }
    } else if (when.type === 'finish') {
      whenRows.push(select_([['', 'Choose a line…'], ...body.logic.filter(x => x !== l).map(x => [x.id, lineName(body, x)])], when.line, v => { when.line = v || undefined; change(); }));
    } else if (when.type === 'flag') {
      whenRows.push(flagInput(when.flag, v => { when.flag = v; change(); }));
    }
    const roleRows = (event?.roles || []).map(r => {
      const fits = body.components.filter(c => c.kind === r.kind);
      const kind = Seq.ROLE_KINDS[r.kind].toLowerCase();
      return field(`${r.name} →`, fits.length
        ? select_([['', `Choose this sequence’s ${kind}…`], ...fits.map(c => [c.id, `${KIND_ICON[c.kind]} ${c.name}`])], l.roles?.[r.id], v => { (l.roles ||= {})[r.id] = v || undefined; if (!v) delete l.roles[r.id]; change(); })
        : help(`Add a ${kind} to this sequence first (Components), then choose it here.`));
    });
    if (roleRows.length) roleRows.unshift(el('div', { class: 'sidescroll-seq-fill' }, el('strong', { text: 'Fill in the event’s placeholders' }),
      el('small', { text: 'Which of this sequence’s components each placeholder means here.' })));
    const c = l.condition;
    return el('div', { class: 'sidescroll-story-move', 'data-reveal': l.id },
      el('div', { class: 'sidescroll-story-move-head' }, el('strong', { text: `Line ${index + 1}` }),
        btn('Test now', () => { preview(); host.fireLine(p.id, l.id) ? host.hint('Running the event (once-only lines still fire in play)') : host.hint('Choose an event first'); }),
        btn('↑', () => { const list = body.logic; list.splice(index - 1, 0, list.splice(index, 1)[0]); change(); }, index === 0 ? 'hidden' : ''),
        xBtn(() => { if (confirm(`Remove line ${index + 1}?`)) { body.logic.splice(index, 1); change(); } }, 'Remove line')),
      field('When', el('div', { class: 'sidescroll-seq-stack' }, ...whenRows)),
      field('Run event', el('div', { class: 'sidescroll-seq-stack' },
        select_([['', 'Choose an event…'], ...draft.events.map(e => [e.id, `✦ ${e.name}`]), ['__new', '+ New event…']], l.event, v => {
          if (v !== '__new') { l.event = v || null; change(); return; }
          // Make an event for this line and open it; "‹ Back" returns here.
          const taken = takenIds(), id = Seq.newId('ev', taken);
          draft.events.push({ id, name: `Event ${draft.events.length + 1}`, roles: [{ id: Seq.newId('r', taken), name: 'Actor', kind: 'character' }], steps: [] });
          l.event = id; change(false); open('event', id, { returnTo: p.id });
        }),
        event ? btn(`Open “${event.name}”`, () => open('event', event.id, { returnTo: p.id })) : null)),
      ...roleRows,
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Only' }),
        segmented([['none', 'Always'], ['set', 'While flag is set'], ['unset', 'While flag is not set']], c ? c.when : 'none', v => {
          if (v === 'none') delete l.condition; else l.condition = { flag: c?.flag || knownFlags()[0] || '', when: v }; change();
        }),
        c ? flagInput(c.flag, v => { c.flag = v; change(); }) : null),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Fires' }),
        segmented([['once', 'Once per player'], ['every', 'Every time']], l.once === false ? 'every' : 'once', v => { l.once = v === 'once'; change(); })));
  }
  function sequencePage() {
    const p = placedById(view.placed);
    if (!p) { view.page = 'list'; return listPage(); }
    const body = bodyOf(p), t = p.template ? templateById(p.template) : null;
    const moving = placeMode?.kind === 'anchor';
    const anchorX = el('input', { type: 'number', step: '0.1', value: fmt(p.x, 2), inputmode: 'decimal' });
    anchorX.addEventListener('change', () => { const n = Number(anchorX.value); if (Number.isFinite(n)) { p.x = n; change(); } });
    const nudge = d => btn(d > 0 ? `+${d}` : `−${-d}`, () => { p.x = Math.round((p.x + d) * 100) / 100; change(); });
    const comp = body.components.find(c => c.id === view.component) || null;
    const adding = placeMode?.kind === 'add' ? placeMode.comp : null;
    const addComp = (kind, extra, message) => { closeChooser(); setPlaceMode({ kind: 'add', comp: { kind, ...extra } }, message); };
    const count = kind => body.components.filter(c => c.kind === kind).length + 1;
    return [
      field('Name', textInput(p, 'name', 40, () => { if (t) t.name = p.name; })),
      section('Placement',
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Anchor along the journey (m)' }),
          el('div', { class: 'sidescroll-story-nudge' }, nudge(-1), nudge(-0.1), anchorX, nudge(0.1), nudge(1))),
        row(btn(moving ? 'Cancel move' : 'Move by tap', () => setPlaceMode(moving ? null : { kind: 'anchor' }, 'Tap the ground where the sequence goes'), moving ? 'active' : ''),
          btn('Show', () => host.lookAt(p.x)), btn('To view centre', () => { p.x = Math.round(host.playerX() * 100) / 100; change(); })),
        t ? el('div', { class: 'sidescroll-story-note' },
          el('span', { text: `Template “${t.name}” · placed ${instancesOf(t.id).length}× — changes to its components and logic change every placed copy.` }),
          btn('Make unique', () => { p.body = clone(t.body); delete p.template; change(); host.hint('Now unique: its own components and logic'); }))
          : row(btn('Save as template', () => {
            const id = Seq.newId('sqt', takenIds());
            draft.templates.push({ id, name: p.name, body: p.body || { components: [], logic: [] } });
            p.template = id; delete p.body; change(); host.hint('Saved as a template · place more copies from the Sequences list');
          })),
        row(btn('▶ Play from here', () => {
          preview(); placeMode = null;
          const b = host.bounds(p.id); host.playFrom((b ? b.x0 : p.x) - 2.5);
          host.hint(`Playing from before ${p.name} · story reset · ↺ Restart to try again · ■ Stop to edit`);
        }, 'primary'),
          btn('Delete', () => {
            if (!confirm(`Delete the sequence “${p.name}”?`)) return;
            draft.placed = draft.placed.filter(x => x.id !== p.id);
            if (t && !instancesOf(t.id).length && confirm(`“${t.name}” is no longer placed anywhere. Delete the template too?`)) draft.templates = draft.templates.filter(x => x.id !== t.id);
            change(false); open('list', null, { tab: 'sequences' });
          }, 'danger'))),
      section('Components',
        addBar(
          btn('+ Character', () => openChooser('characters', 'Add a character', characterChoices().map(c => ({ value: c.id, label: c.name, thumb: c.family === 'quadruped' ? '🐾' : '☺', note: c.family === 'quadruped' ? 'Quadruped' : 'Biped' })),
            id => addComp('character', { name: characterName(id), character: id, animation: 'idle', scale: 1, blocks: 'auto', facing: 1 }, `Tap the ground where ${characterName(id)} stands`)), adding?.kind === 'character' ? 'active' : 'primary'),
          btn('+ Mark', () => addComp('mark', { name: `Mark ${count('mark')}`, facing: 1 }, 'Tap the ground where the mark goes'), adding?.kind === 'mark' ? 'active' : 'primary'),
          btn('+ Zone', () => addComp('zone', { name: `Zone ${count('zone')}`, width: 2 }, 'Tap the path where the zone goes'), adding?.kind === 'zone' ? 'active' : 'primary')),
        chooserBox('characters'),
        adding ? el('div', { class: 'sidescroll-story-note' }, el('span', { text: `Tap the ground in the view to place ${adding.name}.` }), btn('Cancel', () => setPlaceMode(null))) : null,
        body.components.length ? el('div', { class: 'sidescroll-story-list' }, body.components.map(c => el('div', { class: 'sidescroll-seq-item', 'data-reveal': c.id },
          el('button', { type: 'button', class: c.id === view.component ? 'active' : '',
            onclick: () => { view.component = view.component === c.id ? null : c.id; placeMode = null; syncSelection(); render(); } },
            el('strong', { text: `${KIND_ICON[c.kind]} ${c.name}` }),
            el('small', { text: c.kind === 'character' ? characterName(c.character) : c.kind === 'zone' ? `${fmt(c.width)} m wide` : `${fmt(p.x + c.dx)} m` })),
          xBtn(() => removeComponent(body, c), `Remove ${c.name}`))))
          : help('Nothing yet. Add characters, marks (spots to walk to) and zones (where the player sets things off).'),
        comp ? componentEditor(p, body, comp) : null),
      section('Logic',
        addBar(btn('+ Add line', () => {
          const zone = body.components.find(c => c.kind === 'zone');
          const id = Seq.newId('l', takenIds());
          body.logic.push({ id, when: { type: zone ? 'enter' : 'load', ...(zone ? { zone: zone.id } : {}) }, event: draft.events[0]?.id || null, roles: {}, once: true });
          reveal = id; change();
        }, 'primary')),
        help('Each line: when something happens, run an event, with its placeholders filled from these components.'),
        body.logic.map((l, i) => lineEditor(p, body, l, i)),
        draft.events.length ? null : help('There are no events yet: make one with + New event… in a line’s Run event list.'))
    ];
  }

  // ---- Event page -------------------------------------------------------------------
  // opts.onFold: the title folds it back to its one-line row (step list).
  function stepEditor(e, s, index, opts = {}) {
    const def = Seq.STEPS[s.type];
    const roleSelect = (field_, kind, allowNone = false) => {
      const fits = e.roles.filter(r => r.kind === kind);
      if (!fits.length && !allowNone) return help(`Add a ${Seq.ROLE_KINDS[kind].toLowerCase()} placeholder above first.`);
      return select_([...(allowNone ? [['', 'No one']] : [['', `Choose a ${Seq.ROLE_KINDS[kind].toLowerCase()} placeholder…`]]),
        ...fits.map(r => [r.id, r.name])], s[field_], v => { if (v) s[field_] = v; else delete s[field_]; change(); });
    };
    const rows = [];
    switch (s.type) {
      case 'move':
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character')), field('To (mark placeholder)', roleSelect('to', 'mark')),
          field('Using', select_(slotChoices(), s.animation, v => { s.animation = v; change(); }), 'An action slot: each character plays its own animation for it'),
          el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Timing' }),
            segmented([['speed', 'Its own speed'], ['time', 'Takes…']], s.timing, v => { s.timing = v; change(); }),
            s.timing === 'time' ? el('div', { class: 'sidescroll-story-inline' }, numberInput(s, 'seconds', 0.5, 600, 0.5, 5), 's') : null));
        break;
      case 'animate':
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character')), field('Animation', select_(slotChoices(), s.animation, v => { s.animation = v; change(); })),
          segmented([['once', 'Play once, then back'], ['loop', 'Switch to it (loop)']], s.mode, v => { s.mode = v; change(); }),
          s.mode === 'once' ? el('div', { class: 'sidescroll-story-inline' }, numberInput(s, 'times', 1, 10, 1, 1), 'times') : null);
        break;
      case 'face':
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character')),
          segmented([['player', 'The player'], ['left', 'Left'], ['right', 'Right'], ['character', 'Another character']], s.toward, v => { s.toward = v; change(); }),
          s.toward === 'character' ? field('Which (character placeholder)', roleSelect('target', 'character')) : null);
        break;
      case 'say': {
        const line = el('textarea', { rows: '2', maxlength: '200' }); line.value = s.text || '';
        line.addEventListener('input', () => { s.text = line.value; change(false); });
        const speakers = [['', 'No one (no name shown)'], [Seq.PLAYER, 'The player (whoever is played)'], ...e.roles.filter(r => r.kind === 'character').map(r => [r.id, r.name])];
        rows.push(field('Who', select_(speakers, s.actor || '', v => { if (v) s.actor = v; else delete s.actor; change(); }),
          'A character placeholder, or the player'), field('Line', line),
          el('div', { class: 'sidescroll-story-inline' }, 'shown for', numberInput(s, 'seconds', 1, 30, 0.5, 3), 's'));
        break;
      }
      case 'think': {
        const line = el('textarea', { rows: '2', maxlength: '200' }); line.value = s.text || '';
        line.addEventListener('input', () => { s.text = line.value; change(false); });
        rows.push(field('The player thinks', line), el('div', { class: 'sidescroll-story-inline' }, 'shown for', numberInput(s, 'seconds', 1, 30, 0.5, 3), 's'));
        break;
      }
      case 'wait': rows.push(el('div', { class: 'sidescroll-story-inline' }, 'for', numberInput(s, 'seconds', 0.1, 120, 0.1, 1), 's')); break;
      case 'flag':
        rows.push(field('Flag', flagInput(s.flag, v => { s.flag = v; change(); })),
          segmented([['set', 'Set it'], ['clear', 'Clear it']], s.value === false ? 'clear' : 'set', v => { s.value = v === 'set'; change(); }));
        break;
      case 'show':
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character')), segmented([['show', 'Show'], ['hide', 'Hide']], s.visible === false ? 'hide' : 'show', v => { s.visible = v === 'show'; change(); }));
        break;
      case 'control':
        rows.push(segmented([['take', 'Take control from the player'], ['give', 'Give control back']], s.take === false ? 'give' : 'take', v => { s.take = v === 'take'; change(); }),
          help('Control always comes back when the event ends.'));
        break;
      case 'camera': {
        s.mode ||= 'shot'; s.ease ||= 'smooth';
        for (const [k, v] of Object.entries({ side: 0, height: 0, distance: 0, tilt: 0, seconds: 2 })) if (s[k] === undefined) s[k] = v;
        rows.push(segmented([['shot', 'Frame a shot'], ['back', 'Back to the player']], s.mode, v => { s.mode = v; change(); }));
        if (s.mode === 'shot') rows.push(
          field('Look at', select_([['', 'The player'], ...e.roles.map(r => [r.id, `${r.name} (${Seq.ROLE_KINDS[r.kind].toLowerCase()} placeholder)`])], s.target, v => { if (v) s.target = v; else delete s.target; change(); }),
            'Tip: add a mark where the shot should centre, and a mark placeholder for it here'),
          slider(s, 'side', -20, 20, 0.1, 'Shift along the journey', 1, ' m'),
          slider(s, 'height', -5, 10, 0.1, 'Raise the camera', 1, ' m'),
          slider(s, 'distance', -20, 30, 0.1, 'Move back (− closer)', 1, ' m'),
          slider(s, 'tilt', -4, 4, 0.05, 'Aim up (− down)', 2, ' m'));
        // Cut = instant (0 s); Move / Blend = over some seconds.
        const cut = Number(s.seconds) === 0;
        rows.push(segmented([['cut', s.mode === 'shot' ? 'Cut to it' : 'Cut back'], ['move', s.mode === 'shot' ? 'Move there' : 'Blend back']], cut ? 'cut' : 'move',
          v => { if (v === 'cut') { if (Number(s.seconds) > 0) s.lastSeconds = s.seconds; s.seconds = 0; } else { s.seconds = s.lastSeconds || 2; delete s.lastSeconds; } change(); }));
        if (!cut) rows.push(el('div', { class: 'sidescroll-story-inline' }, 'over', numberInput(s, 'seconds', 0.1, 60, 0.5, 2), 's'),
          segmented([['smooth', 'Smooth'], ['linear', 'Steady']], s.ease, v => { s.ease = v; change(); }));
        // Frame it: look through the shot in the game and drag / pinch to set it.
        if (s.mode === 'shot') rows.push(btn('📷 Frame it', () => {
          const ok = host.frameShot?.({ eventId: e.id, placedId: view.returnTo || null, step: { ...s },
            onChange: v => { Object.assign(s, v); dirty = true; updateStatus(); },
            onDone: () => change() });
          if (!ok) host.hint('Framing is not available here');
        }, 'sidescroll-frame-it'));
        rows.push(
          s.mode === 'shot' ? el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!s.keep, onchange: ev => { if (ev.target.checked) s.keep = true; else delete s.keep; change(); } }),
            'Keep after the event (until a later “Back to the player” step)') : null,
          help(s.mode === 'shot' ? (s.keep ? 'The shot stays when the event ends: bring it back with a Camera “Back to the player” step, e.g. on a line When the player leaves a zone.'
            : 'The camera holds the shot until the next Camera step; it goes back to the player when the event ends.') : 'Blends back to following the player.'));
        break;
      }
      case 'item': {
        const items = host.items?.() || [];
        s.item ||= items[0]?.id || 'forest-key'; if (s.count === undefined) s.count = 1; if (s.give === undefined) s.give = true;
        rows.push(segmented([['give', 'Give the player'], ['take', 'Take from the player']], s.give === false ? 'take' : 'give', v => { s.give = v === 'give'; change(); }),
          field('Item', select_(items.map(i => [i.id, i.label]), s.item, v => { s.item = v; change(); })),
          el('div', { class: 'sidescroll-story-inline' }, numberInput(s, 'count', 1, 20, 1, 1), 'of them'),
          help('Progress → Reset on this sequence takes back what it gave and gives back what it took.'));
        break;
      }
      case 'effect': {
        // Darkness / effect on a character: which effect, its states in order (each
        // blended to over its seconds; it starts invisible) and when the character hides.
        const effects = host.effects?.() || [];
        if (!s.asset && effects[0]) s.asset = effects[0].id;
        if (s.delay === undefined) s.delay = 0; if (s.size === undefined) s.size = 1.4; if (s.hideAt === undefined) s.hideAt = -1;
        s.keys ||= [];
        const fx = effects.find(e => e.id === s.asset);
        const states = [['gone', fx?.character ? 'Gone (fully dissolved)' : 'Gone (invisible)'], ...(fx?.states || []).map(st => [st.id, st.name])];
        rows.push(field('On (character placeholder)', roleSelect('actor', 'character')),
          field('Effect', select_(effects.length ? effects.map(e => [e.id, `${e.name}${e.character ? ' (character effect)' : ''}`]) : [['', 'No effects yet']], s.asset || '', v => { s.asset = v; change(); })),
          el('div', { class: 'sidescroll-story-inline' }, 'start after', numberInput(s, 'delay', 0, 30, 0.1, 0), 's · size', numberInput(s, 'size', 0.3, 4, 0.1, 1.4), '× its height'));
        s.keys.forEach((k, i) => rows.push(el('div', { class: 'sidescroll-story-inline sidescroll-fx-key' },
          `${i + 1}.`, select_(states, k.state, v => { k.state = v; change(); }), 'over', numberInput(k, 'seconds', 0, 20, 0.05, 0.5), 's',
          btn('×', () => { s.keys.splice(i, 1); change(); }, 'sidescroll-seq-x'))));
        rows.push(btn('+ Add state', () => { s.keys.push({ state: fx?.states?.[0]?.id || 'gone', seconds: 0.5 }); change(); }),
          segmented([['keep', 'Keep the character'], ['hide', 'Hide the character']], s.hideAt >= 0 ? 'hide' : 'keep', v => { s.hideAt = v === 'hide' ? 0.5 : -1; change(); }));
        if (s.hideAt >= 0) rows.push(el('div', { class: 'sidescroll-story-inline' }, 'hide it', numberInput(s, 'hideAt', 0, 60, 0.05, 0.5), 's after the effect starts'));
        if (fx?.character) rows.push(help('A character effect works on the character itself: it starts whole and blends through its states; if it ends fully dissolved (Gone, or Dissolve at 1) the character stays hidden. It keeps moving while it dissolves.'));
        rows.push(help(fx ? (fx.states?.length ? 'The effect starts invisible and blends to each state in turn; it follows the character (a hidden character keeps moving, so the dust travels on), then disappears when the last state is done. Run this step “with” a Move step to catch a running animal. For a long, low animal widen the effect (Asset Lab → Shape) or raise the size.'
          : 'This effect has no states yet: in Asset Lab, set its sliders and tap “Save as state” (e.g. Grab, Cover, Dust).') : 'Make an effect first: Asset Lab → + New effect.'));
        break;
      }
      case 'prop': {
        s.action ||= 'give';
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character')),
          segmented(Object.entries(Seq.PROP_ACTIONS), s.action, v => { s.action = v; change(); }),
          el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Prop' }),
            el('div', { class: 'sidescroll-seq-item' }, el('div', { class: 'sidescroll-seq-current', text: s.asset ? `⚒ ${propLabel(s.asset)}` : 'None chosen' }),
              btn(s.asset ? 'Change…' : 'Choose…', () => chooseProp(`prop-${index}`, 'Which prop?', name => { s.asset = name; change(); })))),
          help(s.action === 'give' ? 'The character takes it in hand, held as its hold in Character Lab → Props says (it follows the hand in every animation).'
            : s.action === 'take' ? 'The character stops holding it (it is put away).'
            : 'It falls from the hand and lies on the ground there. Progress → Reset on this sequence puts it back.'));
        break;
      }
      case 'look': {
        const looks = host.looks?.() || [];
        if (s.look === undefined) s.look = looks[0]?.id || ''; if (s.seconds === undefined) s.seconds = 2;
        rows.push(field('Change to', select_([['', 'Base look (normal)'], ...looks.map(l => [l.id, l.name])], s.look || '', v => { s.look = v; change(); })),
          el('div', { class: 'sidescroll-story-inline' }, 'blend over', numberInput(s, 'seconds', 0, 30, 0.5, 1), 's'),
          help(looks.length ? 'Fog and colour change to the look and stay until another Look step changes them (kept when the game is reopened).'
            : 'No looks yet: make them in Menu → Looks (set Fog and Post, then “Save current as a new look”).'));
        break;
      }
      case 'prompt':
        s.label ||= 'Talk';
        rows.push(field('Action button reads', textInput(s, 'label', 14, null, 'e.g. Talk, Ask, Give')),
          help('The event pauses here until the player presses Action — even while control is taken. The button lights up with this label.'));
        break;
      case 'screen':
        s.action ||= 'fade-out'; if (s.seconds === undefined) s.seconds = 1;
        rows.push(select_(Object.entries(Seq.SCREEN_ACTIONS), s.action, v => { s.action = v; change(); }),
          el('div', { class: 'sidescroll-story-inline' }, 'over', numberInput(s, 'seconds', 0, 10, 0.25, 1), 's'),
          help('A fade or the bars still on when the event ends are cleared.'));
        break;
    }
    return el('div', { class: 'sidescroll-story-move', 'data-reveal': `step-${index}` },
      el('div', { class: 'sidescroll-story-move-head' },
        opts.onFold ? el('button', { type: 'button', class: 'sidescroll-seq-fold', onclick: opts.onFold, 'aria-label': 'Fold this step' }, `▾ ${index + 1}. ${def.label}`)
          : el('strong', { text: `${index + 1}. ${def.label}` }),
        btn('↑', () => { e.steps.splice(index - 1, 0, e.steps.splice(index, 1)[0]); change(); }, index === 0 ? 'hidden' : ''),
        xBtn(() => { e.steps.splice(index, 1); change(); }, 'Remove step')),
      ...rows,
      index > 0 ? el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!s.with, onchange: ev => { s.with = ev.target.checked; change(); } }),
        'At the same time as the step before') : null,
      el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!s.background, onchange: ev => { if (ev.target.checked) s.background = true; else delete s.background; change(); } }),
        'Don’t wait for it to finish (the next steps go on while it runs)'));
  }
  // A folded step: one line (tap to open), ⋮⋮ drags it to a new place.
  function stepRow(e, s, i) {
    const t = stepTiming(s);
    return el('div', { class: `sidescroll-seq-steprow kind-${STEP_KIND[s.type] || 'logic'}${s.with && i > 0 ? ' with' : ''}`, 'data-step': i, 'data-reveal': `step-${i}` },
      el('span', { class: 'sidescroll-seq-handle', 'aria-label': `Drag to move step ${i + 1}`, title: 'Drag to move', onpointerdown: ev => startListDrag(ev, e, i) }, '⋮⋮'),
      el('button', { type: 'button', class: 'sidescroll-seq-steprow-open', onclick: () => { view.openStep = i; reveal = `step-${i}`; render(); } },
        el('span', { class: 'sidescroll-seq-steprow-n', text: `${i + 1}` }),
        el('span', { class: 'sidescroll-seq-steprow-icon', text: STEP_ICON[s.type] || '◇' }),
        el('span', { class: 'sidescroll-seq-steprow-text', text: stepSummary(e, s) }),
        s.background ? el('span', { class: 'sidescroll-seq-chip runs-on', text: '↷', title: 'Doesn’t wait for it to finish' }) : null,
        el('span', { class: 'sidescroll-seq-chip', text: timingLabel(t) })));
  }
  let listDrag = null;
  function startListDrag(ev, e, from) {
    const list = ev.target.closest('.sidescroll-seq-steps');
    if (!list || listDrag) return;
    ev.preventDefault();
    const rows = [...list.children];
    const line = el('div', { class: 'sidescroll-seq-dropline' });
    list.append(line);
    rows[from]?.classList.add('dragging');
    listDrag = { e, from, to: from, rows, line, id: ev.pointerId };
    const place = y => {
      let to = rows.length;
      for (let k = 0; k < rows.length; k++) { const r = rows[k].getBoundingClientRect(); if (y < r.top + r.height / 2) { to = k; break; } }
      listDrag.to = to;
      const lr = list.getBoundingClientRect(), ref = rows[Math.min(to, rows.length - 1)].getBoundingClientRect();
      line.style.top = `${(to < rows.length ? ref.top : ref.bottom) - lr.top - 2}px`;
    };
    place(ev.clientY);
    const move = m => { if (m.pointerId !== listDrag?.id) return; m.preventDefault(); place(m.clientY); };
    const end = u => {
      if (u.pointerId !== listDrag?.id) return;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
      const d = listDrag; listDrag = null; d.line.remove(); d.rows[d.from]?.classList.remove('dragging');
      if (u.type === 'pointercancel') return;
      const wasOpen = view.openStep === d.from;
      const at = moveStepTo(d.e, d.from, d.to);
      if (at !== d.from) { view.openStep = wasOpen ? at : null; reveal = `step-${at}`; change(); }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }
  // ---- Event timeline (⤢ Timeline): the event's steps laid out in time ---------
  // Blocks are steps (length = how long they take); steps that start together
  // stack; "don't wait" steps run on (dashed) under the next ones. Drag a block by
  // ⋮⋮ (or press and hold it) onto another block to run with it, or between two
  // moments to make it its own beat there; tap a block to edit it on the right.
  const timeline = { open: false, pps: 44, selected: null, selObj: null, root: null, scroll: null };
  const TL = { lane: 46, top: 30, minW: 74, instantGap: 0.4, pad: 16 };
  function timelineLayout(e) {
    const beats = beatsOf(e.steps), items = [], starts = [];
    let t = 0;
    beats.forEach((beat, k) => {
      let end = t;
      starts.push(t);
      for (const i of beat) {
        const s = e.steps[i], timing = stepTiming(s);
        items.push({ i, s, beat: k, start: t, timing });
        if (!s.background) end = Math.max(end, t + timing.seconds);
      }
      t = end > t ? end : t + TL.instantGap; // instant beats still take a little room
    });
    // Lanes: first free lane by drawn extent, so nothing overlaps.
    const lanes = [];
    for (const it of items) {
      it.x = TL.pad + it.start * timeline.pps;
      it.w = Math.max(TL.minW, it.timing.seconds * timeline.pps);
      let lane = lanes.findIndex(end => end <= it.x + 0.5);
      if (lane < 0) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = it.x + it.w + 4;
      it.lane = lane;
    }
    const width = Math.max(...items.map(it => it.x + it.w), TL.pad + t * timeline.pps) + 140;
    return { items, starts, total: t, width, lanes: Math.max(1, lanes.length) };
  }
  function openTimeline() {
    timeline.open = true; timeline.selected = null; timeline.selObj = null; timeline.scroll = null;
    document.body.classList.add('sidescroll-tl-open');
    renderTimeline();
  }
  function closeTimeline() {
    timeline.open = false; closeChooser();
    timeline.root?.remove(); timeline.root = null;
    document.body.classList.remove('sidescroll-tl-open');
    render();
  }
  function renderTimeline() {
    const e = view.page === 'event' ? eventById(view.event) : null;
    if (!timeline.open || !e) { if (timeline.open) closeTimeline(); return; }
    const old = timeline.root;
    const keep = old ? { left: old.querySelector('.sidescroll-tl-scroll')?.scrollLeft || 0, top: old.querySelector('.sidescroll-tl-scroll')?.scrollTop || 0,
      sheet: old.querySelector('.sidescroll-tl-sheet-body')?.scrollTop || 0 } : null;
    // The sheet follows its step when it moves (↑, drag) and closes if it is removed.
    if (timeline.selObj && e.steps[timeline.selected] !== timeline.selObj) {
      const at = e.steps.indexOf(timeline.selObj);
      timeline.selected = at >= 0 ? at : null;
    }
    if (timeline.selected != null && !e.steps[timeline.selected]) timeline.selected = null;
    timeline.selObj = timeline.selected != null ? e.steps[timeline.selected] : null;
    const L = timelineLayout(e), pps = timeline.pps;
    const height = TL.top + L.lanes * TL.lane + 30;
    // Ruler: a tick a second, labels every 1/2/5 s depending on zoom.
    const every = pps >= 36 ? 1 : pps >= 18 ? 2 : 5;
    const ruler = [];
    for (let sec = 0; sec <= Math.ceil(L.total) + 3; sec++) ruler.push(el('div', { class: `sidescroll-tl-tick${sec % every ? ' minor' : ''}`, style: `left:${TL.pad + sec * pps}px` }, sec % every ? null : `${sec}s`));
    const beatLines = L.starts.map((t, k) => el('div', { class: 'sidescroll-tl-beat', style: `left:${TL.pad + t * pps}px;height:${height}px` }, el('span', { text: `${k + 1}` })));
    const blocks = L.items.map(it => {
      const s = it.s, t = it.timing, kind = STEP_KIND[s.type] || 'logic';
      return el('div', { class: `sidescroll-tl-block kind-${kind}${s.background ? ' runs-on' : ''}${t.approx || t.open ? ' approx' : ''}${!t.seconds ? ' instant' : ''}${timeline.selected === it.i ? ' selected' : ''}`,
        'data-i': it.i, style: `left:${it.x}px;top:${TL.top + it.lane * TL.lane}px;width:${it.w}px` },
        el('span', { class: 'sidescroll-tl-grip', 'aria-label': `Drag step ${it.i + 1}` }, '⋮⋮'),
        el('span', { class: 'sidescroll-tl-text' }, el('b', { text: `${STEP_ICON[s.type] || '◇'} ${it.i + 1}` }), ` ${stepSummary(e, s)}`),
        el('small', { text: `${timingLabel(t)}${s.background ? ' · runs on' : ''}` }));
    });
    const content = el('div', { class: 'sidescroll-tl-content', style: `width:${L.width}px;height:${height}px` }, ...beatLines, ...ruler, ...blocks,
      el('div', { class: 'sidescroll-tl-endmark', style: `left:${TL.pad + L.total * pps}px;height:${height}px` }, el('span', { text: `${fmt(L.total, 1)} s` })));
    const scroller = el('div', { class: 'sidescroll-tl-scroll' }, content);
    const sel = timeline.selected != null ? e.steps[timeline.selected] : null;
    const sheet = sel ? el('aside', { class: 'sidescroll-tl-sheet' },
      el('div', { class: 'sidescroll-tl-sheet-head' }, el('strong', { text: `Step ${timeline.selected + 1}` }),
        btn('Duplicate', () => { const copy = clone(sel); copy.with = true; e.steps.splice(timeline.selected + 1, 0, copy); timeline.selected += 1; timeline.selObj = copy; change(); }),
        btn('Done', () => { timeline.selected = null; timeline.selObj = null; renderTimeline(); }, 'primary')),
      el('div', { class: 'sidescroll-tl-sheet-body' }, stepEditor(e, sel, timeline.selected))) : null;
    const status = el('span', { class: `sidescroll-tl-status${dirty ? ' dirty' : ''}`, text: dirty ? 'Unsaved' : 'Saved' });
    const root = el('div', { class: `sidescroll-tl${sheet ? ' has-sheet' : ''}`, role: 'dialog', 'aria-label': `${e.name} timeline` },
      el('div', { class: 'sidescroll-tl-head' },
        btn('‹ Close', closeTimeline),
        el('strong', { text: `${e.name} · ${fmt(L.total, 1)} s` }),
        el('span', { class: 'sidescroll-tl-zoom' },
          btn('−', () => { timeline.pps = Math.max(10, timeline.pps / 1.4); renderTimeline(); }),
          btn('+', () => { timeline.pps = Math.min(200, timeline.pps * 1.4); renderTimeline(); })),
        btn('+ Step', () => addStepChooser(e)),
        status,
        btn('Save', () => { saveDraft(); host.hint('Story saved'); }, `primary${dirty ? '' : ' quiet'}`)),
      el('p', { class: 'sidescroll-tl-help', text: 'Tap a step to edit it. Drag ⋮⋮ (or press and hold a step) onto another step to run them together, or between two moments to give it its own moment. ~ = a guess (own walking speed, animation length).' }),
      el('div', { class: 'sidescroll-tl-main' }, scroller, sheet));
    if (old) old.replaceWith(root); else document.body.append(root);
    if (timeline.picking) root.classList.add('picking');
    timeline.root = root;
    if (keep) { scroller.scrollLeft = keep.left; scroller.scrollTop = keep.top; const sb = root.querySelector('.sidescroll-tl-sheet-body'); if (sb) sb.scrollTop = keep.sheet; }
    bindTimelineDrag(e, scroller, content, L);
  }
  function bindTimelineDrag(e, scroller, content, L) {
    let press = null;
    const blockAt = (x, y, except) => L.items.find(it => it.i !== except && x >= it.x && x <= it.x + it.w && y >= TL.top + it.lane * TL.lane - 4 && y <= TL.top + it.lane * TL.lane + TL.lane - 2);
    const local = ev => { const r = content.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    function target(pt, from) {
      const hit = blockAt(pt.x, pt.y, from);
      if (hit) return { join: e.steps[hit.i], x: hit.x, hit };
      // Nearest moment boundary: before a beat, or the end.
      const bounds = L.starts.map((t, k) => ({ x: TL.pad + t * timeline.pps, k })).concat([{ x: TL.pad + L.total * timeline.pps, k: L.starts.length }]);
      const b = bounds.reduce((best, c) => (Math.abs(c.x - pt.x) < Math.abs(best.x - pt.x) ? c : best), bounds[0]);
      const leader = b.k < L.starts.length ? e.steps[beatsOf(e.steps)[b.k][0]] : null;
      return leader ? { before: leader, x: b.x } : { end: true, x: b.x };
    }
    function startDrag() {
      const node = content.querySelector(`.sidescroll-tl-block[data-i="${press.i}"]`);
      if (!node) return;
      press.dragging = true;
      press.ghost = node.cloneNode(true); press.ghost.classList.add('ghost');
      press.marker = el('div', { class: 'sidescroll-tl-drop' });
      node.classList.add('dragging');
      content.append(press.ghost, press.marker);
      navigator.vibrate?.(12);
      dragTo(press.last);
    }
    function dragTo(ev) {
      const pt = local(ev), r = scroller.getBoundingClientRect();
      press.ghost.style.left = `${pt.x - press.offX}px`; press.ghost.style.top = `${pt.y - press.offY}px`;
      press.target = target(pt, press.i);
      content.querySelectorAll('.sidescroll-tl-block.drop-join').forEach(n => n.classList.remove('drop-join'));
      if (press.target.join) { content.querySelector(`.sidescroll-tl-block[data-i="${press.target.hit.i}"]`)?.classList.add('drop-join'); press.marker.hidden = true; }
      else { press.marker.hidden = false; press.marker.style.left = `${press.target.x - 2}px`; press.marker.style.height = `${content.offsetHeight}px`; }
      // Scroll along when dragging near an edge.
      if (ev.clientX > r.right - 36) scroller.scrollLeft += 12; else if (ev.clientX < r.left + 36) scroller.scrollLeft -= 12;
    }
    function finish(ev, cancelled) {
      const p = press; press = null;
      clearTimeout(p?.timer);
      if (!p) return;
      if (p.dragging) {
        p.ghost.remove(); p.marker.remove();
        if (cancelled || !p.target) { renderTimeline(); return; }
        const wasSel = timeline.selected === p.i;
        const at = moveStep(e, p.i, p.target);
        if (wasSel) { timeline.selected = at; timeline.selObj = e.steps[at]; }
        view.openStep = null;
        change();
        return;
      }
      if (!cancelled && !p.moved) { timeline.selected = p.i; timeline.selObj = e.steps[p.i]; renderTimeline(); }
    }
    content.addEventListener('pointerdown', ev => {
      const node = ev.target.closest('.sidescroll-tl-block');
      if (!node || press) return;
      const i = Number(node.dataset.i), pt = local(ev), it = L.items.find(x => x.i === i);
      press = { i, id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, last: ev, moved: false, dragging: false,
        offX: pt.x - it.x, offY: pt.y - (TL.top + it.lane * TL.lane) };
      if (ev.target.closest('.sidescroll-tl-grip')) { ev.preventDefault(); try { content.setPointerCapture(ev.pointerId); } catch (_) {} startDrag(); }
      else press.timer = setTimeout(() => { if (press && !press.moved) { try { content.setPointerCapture(press.id); } catch (_) {} startDrag(); } }, 380);
    });
    content.addEventListener('pointermove', ev => {
      if (!press || ev.pointerId !== press.id) return;
      press.last = ev;
      if (press.dragging) { ev.preventDefault(); dragTo(ev); return; }
      if (Math.hypot(ev.clientX - press.x0, ev.clientY - press.y0) > 8) { press.moved = true; clearTimeout(press.timer); }
    });
    content.addEventListener('pointerup', ev => { if (press && ev.pointerId === press.id) finish(ev, false); });
    content.addEventListener('pointercancel', ev => { if (press && ev.pointerId === press.id) finish(ev, true); });
    // Once a drag has started, the finger moves the block, not the view.
    scroller.addEventListener('touchmove', ev => { if (press?.dragging) ev.preventDefault(); }, { passive: false });
  }
  function addStepChooser(e) {
    openChooser('steps', 'Add a step', Object.entries(Seq.STEPS).map(([type, def]) => ({ value: type, label: def.label, thumb: STEP_ICON[type] || '◇', note: def.help })), type => {
          const def = Seq.STEPS[type];
          const actor = e.roles.find(r => r.kind === 'character')?.id, mark = e.roles.find(r => r.kind === 'mark')?.id;
          const s = { type, ...(actor && Object.keys(def.roles).includes('actor') ? { actor } : {}), ...(type === 'move' && mark ? { to: mark } : {}) };
          if (type === 'flag') s.flag = knownFlags()[0] || 'met-father';
          e.steps.push(Seq.normaliseEvents({ events: [{ ...e, steps: [s] }] })[0]?.steps[0] || s);
          view.openStep = e.steps.length - 1;
          if (timeline.open) { timeline.selected = e.steps.length - 1; timeline.selObj = e.steps[timeline.selected]; }
          reveal = `step-${e.steps.length - 1}`; change();
        });
  }
  function eventPage() {
    const e = eventById(view.event);
    if (!e) { view.page = 'list'; return listPage(); }
    const usedBy = [];
    for (const p of draft.placed) bodyOf(p).logic.forEach((l, i) => { if (l.event === e.id) usedBy.push({ p, i }); });
    return [
      view.returnTo && placedById(view.returnTo) ? help(`Opened from the sequence “${placedById(view.returnTo).name}” — ‹ Back returns there.`) : null,
      field('Name', textInput(e, 'name', 40, null, 'Name it, e.g. Greet and walk off')),
      section('Placeholders',
        help('Placeholders stand for the characters and marks this event acts on — you don’t choose real ones here. Give each a name (Actor, Exit…) and use it in the steps below. Each sequence that runs this event fills them in with its own character and mark (on its logic line).'),
        addBar(btn('+ Character placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'character') ? 'Other' : 'Actor', kind: 'character' }); change(); }, 'primary'),
          btn('+ Mark placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'mark') ? 'Place' : 'Exit', kind: 'mark' }); change(); }, 'primary')),
        e.roles.map((r, i) => el('div', { class: 'sidescroll-seq-role' },
          textInput(r, 'name', 30, null, r.kind === 'mark' ? 'Name it, e.g. Exit or Hiding spot' : 'Name it, e.g. Actor or Friend'),
          el('span', { class: 'sidescroll-seq-kind', text: `${Seq.ROLE_KINDS[r.kind]}` }),
          xBtn(() => {
            e.roles.splice(i, 1);
            for (const s of e.steps) for (const k of ['actor', 'to', 'target']) if (s[k] === r.id) delete s[k];
            change();
          }, `Remove ${r.name}`)))),
      // Steps run in order and are added one after another, so their add
      // button sits after the last step (the one exception to add-bars-on-top).
      section('Steps',
        e.steps.length ? addBar(btn('⤢ Timeline', () => openTimeline(), 'primary')) : null,
        e.steps.length > 1 ? help('Each step waits until the ones before it have finished. “At the same time as the step before” starts it together with that one; “Don’t wait for it to finish” lets the next steps go on while it runs (e.g. lines spoken during a long dissolve). Tap a step to open it; drag ⋮⋮ to reorder.') : null,
        e.steps.length ? el('div', { class: 'sidescroll-seq-steps' }, e.steps.map((s, i) => view.openStep === i
          ? stepEditor(e, s, i, { onFold: () => { view.openStep = null; render(); } })
          : stepRow(e, s, i))) : help('No steps yet.'),
        addBar(btn('+ Add step', () => addStepChooser(e), 'primary')),
        chooserBox('steps')),
      section('Used by',
        usedBy.length ? usedBy.map(({ p, i }) => btn(`▣ ${p.name} · line ${i + 1}`, () => open('sequence', p.id))) : help('Not used by any sequence yet.')),
      row(btn('Duplicate', () => {
        const copy = clone(e); copy.id = Seq.newId('ev', takenIds()); copy.name = `${e.name} copy`;
        draft.events.push(copy); change(false); open('event', copy.id);
      }), btn('Delete', () => {
        if (!confirm(usedBy.length ? `Delete “${e.name}”? ${usedBy.length} line(s) use it and will run nothing.` : `Delete “${e.name}”?`)) return;
        draft.events = draft.events.filter(x => x.id !== e.id);
        for (const p of draft.placed) for (const l of bodyOf(p).logic) if (l.event === e.id) l.event = null;
        change(false); open('list', null, { tab: 'events' });
      }, 'danger'))
    ];
  }

  // ---- Story progress, panel ---------------------------------------------------------
  function progressBox() {
    const p = host.progress(), flags = Object.keys(p.flags || {});
    return el('details', { class: 'sidescroll-story-progress' },
      el('summary', {}, `Story progress on this device · ${flags.length} flag${flags.length === 1 ? '' : 's'} set`),
      help(flags.length ? `Flags: ${flags.join(', ')}` : 'No flags set.'),
      help('Reset story (TEST bar, top right) clears flags, fired lines and what events changed, as for a new player.'));
  }
  let statusEl = null;
  function updateStatus() {
    if (!statusEl) return;
    statusEl.textContent = dirty ? 'Unsaved changes' : 'Saved';
    statusEl.classList.toggle('dirty', dirty);
    panel.querySelector('.sidescroll-story-save')?.toggleAttribute('disabled', !dirty);
    panel.querySelector('.sidescroll-story-discard')?.toggleAttribute('disabled', !dirty);
  }
  function saveDraft() { draft = clone(Seq.save(draft)); dirty = false; preview(); render(); }
  function render() {
    if (panel.hidden) return;
    statusEl = el('span', { class: 'sidescroll-story-status' });
    const page = view.page === 'sequence' ? sequencePage() : view.page === 'event' ? eventPage() : listPage();
    // ‹ Back (inner pages): to the sequence an event was opened from, else the list.
    const back = view.page === 'list' ? null : el('button', { type: 'button', class: 'sidescroll-seq-back', onclick: () => {
      if (view.page === 'event' && view.returnTo && placedById(view.returnTo)) open('sequence', view.returnTo, { focus: false });
      else open('list', null, { tab: view.page === 'event' ? 'events' : 'sequences' });
    } }, '‹ Back');
    panel.replaceChildren(
      el('div', { class: 'sidescroll-story-head' }, back,
        el('strong', { text: view.page === 'event' ? (eventById(view.event)?.name || 'Event') : view.page === 'sequence' ? (placedById(view.placed)?.name || 'Sequence') : 'Story' }), statusEl),
      ...page,
      el('datalist', { id: 'sidescroll-seq-flags' }, knownFlags().map(f => el('option', { value: f }))),
      el('div', { class: 'sidescroll-story-actions' },
        btn('Discard', () => {
          if (!confirm('Discard your Story changes since the last save?')) return;
          draft = clone(Seq.load()); dirty = false; placeMode = null; preview(); open('list');
        }, 'sidescroll-story-discard'),
        btn('Save', () => { saveDraft(); host.hint('Story saved'); }, 'primary sidescroll-story-save')));
    updateStatus();
    if (timeline.open) renderTimeline();
    if (reveal) {
      const target = panel.querySelector(`[data-reveal="${reveal}"]`);
      reveal = null;
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  new MutationObserver(() => {
    if (panel.hidden) { placeMode = null; closeChooser(); host.select(null, null); if (timeline.open) closeTimeline(); }
    else { syncSelection(); render(); }
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.SideScrollSequenceEditor = Object.freeze({ dirty: () => dirty, draft: () => clone(draft), save: saveDraft, view: () => ({ ...view }) });
})();
