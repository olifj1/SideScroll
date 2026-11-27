/* SideScroll Story editor (game editor → Story scope): sequences and events.
 * Design: docs/SEQUENCE_SYSTEM_DESIGN.md (agreed 10 Nov 2026).
 *
 * One pattern everywhere: a list → open → edit page; things are added only with
 * "+ Add …" from a list, and each thing is edited in one place.
 *   Sequences list → Sequence page: Placement, Components, Logic.
 *   Events list    → Event page: Roles, a summary of the steps, Used by; the
 *   event itself is made on its ⤢ Timeline (a row per subject, steps at their times).
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
  const btn = (label, onclick, cls = '', title = '') => el('button', { type: 'button', class: cls, onclick, ...(title ? { title, 'aria-label': title } : {}) }, label);
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
  const chooserBox = () => ''; // '' not null: some lists are append()ed directly, which would print "null"
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
      { for (const l of b.logic) { for (const f of Seq.conditionFlags(l.condition)) out.add(f); if (l.when?.flag) out.add(l.when.flag); }
        for (const c of b.components) for (const f of [...Seq.conditionFlags(c.active), ...Seq.conditionFlags(c.takeWhen)]) out.add(f); }
    // Flags set by inspecting / picking up assets (Asset Lab → Interactions).
    for (const entry of Object.values(window.SideScrollInteractions?.load() || {})) for (const a of Object.values(entry)) if (a?.flag) out.add(a.flag);
    return [...out].filter(Boolean).sort();
  }
  // A condition on story flags (a line's Only, a barrier's Blocks): Always / while set / while not
  // set, one or more flags, and with several: all of them or any of them (Seq.normaliseCondition).
  function conditionField(owner, key, title, labels) {
    const c = owner[key], flags = c ? Seq.conditionFlags(c) : [];
    const write = (list, when, match) => {
      if (!when) delete owner[key];
      // Several flags: "set" defaults to all of them; "not set" to *any* not set (= until all are set).
      else owner[key] = list.length > 1 ? { flags: list, match: match === 'any' || match === 'all' ? match : (when === 'unset' ? 'any' : 'all'), when } : { flag: list[0] || '', when };
      change();
    };
    const parts = [el('span', { text: title }),
      segmented([['none', labels[0]], ['set', labels[1]], ['unset', labels[2]]], c ? c.when : 'none', v => {
        if (v === 'none') write([], null); else write(flags.length ? flags : [knownFlags()[0] || ''], v, c?.match);
      })];
    if (c) {
      flags.forEach((f, i) => parts.push(el('div', { class: 'sidescroll-seq-flagrow' },
        flagInput(f, v => { const list = [...flags]; list[i] = v; write(list, c.when, c.match); }),
        flags.length > 1 ? xBtn(() => write(flags.filter((_, j) => j !== i), c.when, c.match), 'Remove this flag') : null)));
      // Worded by what it means: with "not set", any-not-set = until all of them are set.
      if (flags.length > 1) parts.push(c.when === 'unset'
        ? segmented([['any', 'Until all of them are set'], ['all', 'Until any of them is set']], c.match === 'all' ? 'all' : 'any', v => write(flags, c.when, v))
        : segmented([['all', 'All of them'], ['any', 'Any of them']], c.match === 'any' ? 'any' : 'all', v => write(flags, c.when, v)));
      if (flags.length < 12) parts.push(btn('+ Another flag', () => write([...flags, ''], c.when, c.match)));
    }
    return el('div', { class: 'sidescroll-story-field sidescroll-seq-condition' }, ...parts);
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
  function preview() { host.preview(normalised()); replayAtPlayhead(); }
  // ---- Undo / redo: snapshots of the draft (typing within a second is one step) ----
  const history = { undo: [], redo: [], last: JSON.stringify(draft), typing: false, at: 0 };
  function resetHistory() { history.undo = []; history.redo = []; history.last = JSON.stringify(draft); history.typing = false; }
  function remember(typing) {
    const now = JSON.stringify(draft);
    if (now === history.last) return;
    const t = performance.now();
    if (!(typing && history.typing && t - history.at < 1000)) { history.undo.push(history.last); if (history.undo.length > 120) history.undo.shift(); }
    history.redo = []; history.typing = typing; history.at = t; history.last = now;
  }
  function stepHistory(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(draft));
    draft = JSON.parse(from.pop());
    history.last = JSON.stringify(draft); history.typing = false;
    dirty = true; placeMode = null; preview();
    if (view.page === 'event' && !eventById(view.event)) open('list'); else render();
  }
  const undo = () => stepHistory(history.undo, history.redo), redo = () => stepHistory(history.redo, history.undo);
  function discard() {
    if (!confirm('Discard your Story changes since the last save?')) return false;
    draft = timeAll(clone(Seq.load())); dirty = false; placeMode = null; resetHistory(); preview();
    return true;
  }
  function change(rerender = true) { remember(!rerender); dirty = true; preview(); if (rerender) render(); else updateStatus(); }
  function syncSelection() { host.select(view.page === 'sequence' ? view.placed : null, view.page === 'sequence' ? view.component : null); }
  function open(page, id, extra = {}) {
    placeMode = null; closeChooser();
    view.page = page;
    if (page === 'sequence') { view.placed = id; view.component = extra.component || null; const p = placedById(id); if (p && extra.focus !== false) host.lookAt(p.x); }
    if (page === 'event') { view.event = id; view.returnTo = extra.returnTo || null; if (draft.events.find(x => x.id === id)) makeTimed(eventById(id)); }
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
        const comp = { ...placeMode.comp, id: Seq.newId('c', takenIds()), dx: point.x - p.x, depth: ['zone', 'barrier'].includes(placeMode.comp.kind) ? 0 : depth };
        body.components.push(comp);
        view.component = comp.id; reveal = comp.id;
        host.hint(`Added ${comp.name}`);
      } else if (placeMode.kind === 'anchor') {
        p.x = point.x;
        host.hint('Sequence moved (its components move with it)');
      } else if (placeMode.kind === 'component') {
        const comp = body.components.find(c => c.id === placeMode.id);
        if (comp) { comp.dx = point.x - p.x; if (!['zone', 'barrier'].includes(comp.kind)) comp.depth = depth; }
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
  const KIND_ICON = { character: '☺', mark: '◆', zone: '⚑', object: '▢', barrier: '▮' };
  const STEP_ICON = { move: '→', animate: '↻', face: '⇆', say: '❝', think: '☁', wait: '⏱', flag: '⚑', show: '◐', control: '✋', camera: '▣', screen: '▬', prompt: '◇', item: '✚', look: '◑', effect: '✺', prop: '⚒', object: '▢', wear: '◒' };

  // ---- Steps: timing, summaries, beats, moving (step list and timeline) --------
  // A beat is a step and the "at the same time" steps after it; the next beat
  // starts when everything in it has finished (except "don't wait" steps).
  const STEP_KIND = { say: 'speech', think: 'speech', camera: 'view', screen: 'view', look: 'view',
    move: 'actor', animate: 'actor', face: 'actor', show: 'actor', effect: 'actor', prop: 'actor', object: 'actor' }; // else 'logic'
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
      case 'wear': return `${s.action === 'off' ? 'Take off' : 'Put on'} ${propLabel(s.asset) || '…'}`;
      case 'item': return `${s.give ? 'Give' : 'Take'} ${s.count > 1 ? `${s.count} × ` : ''}${s.item}`;
      case 'effect': return `${(host.effects?.() || []).find(x => x.id === s.asset)?.name || 'Effect'} on ${who}`;
      case 'look': return `Look: ${(host.looks?.() || []).find(x => x.id === s.look)?.name || 'base look'}`;
      case 'prop': return `${who} · ${(Seq.PROP_ACTIONS[s.action] || '').toLowerCase()} ${clip((host.props?.() || []).find(x => x.id === s.asset)?.name || s.asset || '…', 18)}`;
      case 'object': return `${who} ${objectActionText(s)}`;
      default: return Seq.STEPS[s.type]?.label || s.type;
    }
  }
  const objectActionText = s => (s.action === 'swap' ? `changes to ${clip(propLabel(s.asset) || '…', 18)}` : s.action === 'show' ? 'appears' : 'disappears');
  // [[step index, …], …] — each beat's steps.
  function beatsOf(steps) {
    const beats = [];
    steps.forEach((s, i) => { if (!beats.length || !s.with || i === 0) beats.push([i]); else beats[beats.length - 1].push(i); });
    return beats;
  }
  // ---- Timeline rows: one per subject ------------------------------------------
  // Each character placeholder has a row (its lines, walks, animations, effects,
  // props), then Player, Camera, Screen (fades, bars, unnamed captions), Look and
  // Game (control, flags, items, Wait for Action, waits). A step's row follows
  // from what it is, so rows never need arranging.
  const CHAR_STEPS = ['say', 'move', 'animate', 'face', 'show', 'effect', 'prop'];
  const ROW_OF_TYPE = { think: 'player', wear: 'player', camera: 'camera', screen: 'screen', look: 'look' }; // else 'game'
  function rowKeyOf(s) {
    if (s.type === 'say') return s.actor === Seq.PLAYER ? 'player' : s.actor ? `role:${s.actor}` : 'screen';
    if (CHAR_STEPS.includes(s.type) || s.type === 'object') return s.actor ? `role:${s.actor}` : 'role:?';
    return ROW_OF_TYPE[s.type] || 'game';
  }
  // What tapping an empty spot on a row offers: [{type, label, preset}].
  const ADD = {
    say: { type: 'say', label: 'Say a line' }, move: { type: 'move', label: 'Walk / run to a mark' },
    animate: { type: 'animate', label: 'Play an animation' }, face: { type: 'face', label: 'Turn to face' },
    show: { type: 'show', label: 'Appear / disappear' }, effect: { type: 'effect', label: 'Effect on it (dissolve…)' },
    prop: { type: 'prop', label: 'Hold / put away / drop a prop' }, think: { type: 'think', label: 'Think' },
    playerSay: { type: 'say', label: 'Say a line' }, caption: { type: 'say', label: 'Caption (no name shown)' },
    shot: { type: 'camera', label: 'Frame a shot', preset: { mode: 'shot' } }, back: { type: 'camera', label: 'Back to the player', preset: { mode: 'back' } },
    screen: { type: 'screen', label: 'Fade / letterbox bars' }, look: { type: 'look', label: 'Change the look' },
    control: { type: 'control', label: 'Take / give control' }, prompt: { type: 'prompt', label: 'Wait for Action' },
    flag: { type: 'flag', label: 'Set / clear a flag' },
    objectShow: { type: 'object', label: 'Appears', preset: { action: 'show' } }, objectHide: { type: 'object', label: 'Disappears', preset: { action: 'hide' } },
    objectSwap: { type: 'object', label: 'Changes to another asset', preset: { action: 'swap' } }, item: { type: 'item', label: 'Give / take an item' },
    wearOn: { type: 'wear', label: 'Put on (the bag…)', preset: { action: 'on' } }, wearOff: { type: 'wear', label: 'Take off', preset: { action: 'off' } }, wait: { type: 'wait', label: 'Wait (a gap)' }
  };
  function timelineRows(e) {
    const rows = e.roles.filter(r => r.kind === 'character').map(r => ({ key: `role:${r.id}`, role: r.id, label: r.name, icon: '☺',
      adds: ['say', 'move', 'animate', 'face', 'effect', 'prop', 'show'] }));
    // Object placeholders: a row each (appear / disappear / change).
    for (const r of e.roles.filter(r => r.kind === 'object')) rows.push({ key: `role:${r.id}`, role: r.id, object: true, label: r.name, icon: '▢', adds: ['objectHide', 'objectShow', 'objectSwap'] });
    if (e.steps.some(s => rowKeyOf(s) === 'role:?')) rows.push({ key: 'role:?', label: 'No one chosen', icon: '?', adds: [] });
    rows.push({ key: 'player', label: 'Player', icon: '★', adds: ['playerSay', 'think', 'wearOn', 'wearOff'] },
      { key: 'camera', label: 'Camera', icon: '▣', adds: ['shot', 'back'] },
      { key: 'screen', label: 'Screen', icon: '▬', adds: ['screen', 'caption'] },
      { key: 'look', label: 'Look', icon: '◑', adds: ['look'] },
      { key: 'game', label: 'Game', icon: '⚙', adds: ['control', 'prompt', 'flag', 'item', 'wait'] });
    return rows;
  }
  // Whether a step may be dragged onto a row (a line can change speaker, a
  // character step can change character; everything else stays on its row).
  function canMoveTo(s, row) {
    if (rowKeyOf(s) === row.key) return true;
    if (s.type === 'say') return !!row.role && !row.object || row.key === 'player' || row.key === 'screen';
    if (s.type === 'object') return !!row.object;
    return CHAR_STEPS.includes(s.type) && !!row.role && !row.object;
  }
  function putOnRow(s, row) {
    if (rowKeyOf(s) === row.key) return;
    if (row.role) s.actor = row.role;
    else if (row.key === 'player') s.actor = Seq.PLAYER;
    else delete s.actor;
  }
  const rowLabel = (e, s) => timelineRows(e).find(r => r.key === rowKeyOf(s))?.label || '';
  // Every event is a timeline: an event saved step by step is converted on
  // opening the editor, each step keeping the time it starts at now (a walk at
  // its own speed gets an estimated length; drag its edge to change it).
  function timeAll(d) { for (const e of d.events) makeTimed(e); return d; }
  function barrierSummary(c) {
    const flags = Seq.conditionFlags(c.active).filter(Boolean);
    if (!c.active || !flags.length) return 'Always blocks';
    const list = flags.join(', ');
    if (flags.length === 1) return `Blocks while ${list} is ${c.active.when === 'unset' ? 'not set' : 'set'}`;
    if (c.active.when === 'unset') return c.active.match === 'all' ? `Blocks until any of ${list} is set` : `Blocks until ${list} are all set`;
    return c.active.match === 'any' ? `Blocks while any of ${list} is set` : `Blocks while ${list} are all set`;
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
    if (c.kind === 'barrier') parts.push(
      conditionField(c, 'active', 'Blocks', ['Always', 'While flag is set', 'While flag is not set']),
      help('An invisible wall across the path: she can’t walk past it while this holds, e.g. “While flag packed is not set”. Shown as a red dashed wall in the editor (faint when it isn’t blocking now).'),
      field('She thinks (when she walks into it)', textInput(c, 'say', 120)));
    if (c.kind !== 'zone' && c.kind !== 'barrier') parts.push(slider(c, 'depth', -15, 8, 0.05, 'Depth (0 = path centre, + nearer)', 2, ' m'),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Facing' }), segmented([['-1', 'Left'], ['1', 'Right']], String(c.facing), v => { c.facing = Number(v); change(); })));
    if (c.kind === 'zone') parts.push(field('Width (m)', numberInput(c, 'width', 0.2, 40, 0.1, 2)));
    if (c.kind === 'object') parts.push(
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Asset' }),
        el('div', { class: 'sidescroll-seq-item' }, el('div', { class: 'sidescroll-seq-current', text: `▢ ${propLabel(c.asset)}` }),
          btn('Change…', () => chooseAsset('object-asset', `${c.name} shows…`, name => {
            if (c.name === propLabel(c.asset)) c.name = propLabel(name); // an unrenamed object follows its asset
            c.asset = name; change();
          })))),
      slider(c, 'size', 0.1, 5, 0.01, 'Size (× its game height)', 2),
      slider(c, 'lift', 0, 5, 0.01, 'Lift above the ground', 2, ' m'),
      el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!c.startHidden, onchange: ev => { if (ev.target.checked) c.startHidden = true; else delete c.startHidden; change(); } }),
        'Hidden at the start (an Object step shows it)'),
      help('Events change it with an Object step: give the event an object placeholder and fill it with this object in a logic line.'),
      conditionField(c, 'takeWhen', 'Can be taken', ['Always', 'While flag is set', 'While flag is not set']),
      ...(c.takeWhen ? [field('Until then she thinks', textInput(c, 'notYet', 160)),
        help('For an asset she can pick up or put on (Asset Lab → Interactions). Until the condition holds, Inspect still shows it but without Pick up, and adds this line (or she just thinks it).')] : []));
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
  function chooseAsset(key, title, onPick) {
    openChooser(key, title, propChoices().map(x => ({ value: x.id, label: x.name, thumb: '▢', note: x.group })), onPick, 'Built-in props and every imported asset');
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
      conditionField(l, 'condition', 'Only', ['Always', 'While flag is set', 'While flag is not set']),
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
          btn('+ Zone', () => addComp('zone', { name: `Zone ${count('zone')}`, width: 2 }, 'Tap the path where the zone goes'), adding?.kind === 'zone' ? 'active' : 'primary'),
          btn('+ Object', () => chooseAsset('characters', 'Add an object', name => addComp('object', { name: propLabel(name), asset: name, size: 1, lift: 0, facing: 1 }, `Tap the ground where ${propLabel(name)} stands`)), adding?.kind === 'object' ? 'active' : 'primary'),
          btn('+ Barrier', () => addComp('barrier', { name: `Barrier ${count('barrier')}` }, 'Tap the path where the barrier goes'), adding?.kind === 'barrier' ? 'active' : 'primary')),
        chooserBox('characters'),
        adding ? el('div', { class: 'sidescroll-story-note' }, el('span', { text: `Tap the ground in the view to place ${adding.name}.` }), btn('Cancel', () => setPlaceMode(null))) : null,
        body.components.length ? el('div', { class: 'sidescroll-story-list' }, body.components.map(c => el('div', { class: 'sidescroll-seq-item', 'data-reveal': c.id },
          el('button', { type: 'button', class: c.id === view.component ? 'active' : '',
            onclick: () => { view.component = view.component === c.id ? null : c.id; placeMode = null; syncSelection(); render(); } },
            el('strong', { text: `${KIND_ICON[c.kind]} ${c.name}` }),
            el('small', { text: c.kind === 'character' ? characterName(c.character) : c.kind === 'zone' ? `${fmt(c.width)} m wide` : c.kind === 'barrier' ? barrierSummary(c) : c.kind === 'object' ? `${propLabel(c.asset)}${c.startHidden ? ' · hidden at first' : ''}${c.takeWhen ? ' · taken later' : ''}` : `${fmt(p.x + c.dx)} m` })),
          xBtn(() => removeComponent(body, c), `Remove ${c.name}`))))
          : help('Nothing yet. Add characters, marks (spots to walk to), zones (where the player sets things off), objects (any asset: a note, the food, a chopping block) and barriers (invisible walls that hold her back until a flag is set).'),
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
          // The timeline is pushed aside while framing and comes back after.
          const wasAside = timeline.aside, inTimeline = timeline.open;
          if (inTimeline) { host.setPaused?.(true); setTlAside(true); }
          const ok = host.frameShot?.({ eventId: e.id, placedId: view.returnTo || null, step: { ...s },
            onChange: v => { Object.assign(s, v); dirty = true; updateStatus(); },
            onDone: () => { if (inTimeline && timeline.open) timeline.aside = wasAside; change(); } });
          if (!ok) { if (inTimeline) setTlAside(wasAside); host.hint('Framing is not available here'); }
        }, 'sidescroll-frame-it'));
        rows.push(
          s.mode === 'shot' ? el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!s.keep, onchange: ev => { if (ev.target.checked) s.keep = true; else delete s.keep; change(); } }),
            'Keep after the event (until a later “Back to the player” step)') : null,
          help(s.mode === 'shot' ? (s.keep ? 'The shot stays when the event ends: bring it back with a Camera “Back to the player” step, e.g. on a line When the player leaves a zone.'
            : 'The camera holds the shot until the next Camera step; it goes back to the player when the event ends.') : 'Blends back to following the player.'));
        break;
      }
      case 'wear': {
        // Wearables: assets with Wear set in Asset Lab → Interactions.
        const all = window.SideScrollInteractions?.load() || {};
        const wearables = Object.keys(all).filter(n => all[n].wear);
        if (!s.asset && wearables.length) s.asset = wearables[0];
        rows.push(segmented([['on', 'Put on'], ['off', 'Take off']], s.action === 'off' ? 'off' : 'on', v => { s.action = v; change(); }),
          wearables.length
            ? field('Item', select_(wearables.map(n => [n, propLabel(n)]).concat(s.asset && !wearables.includes(s.asset) ? [[s.asset, `${propLabel(s.asset)} (no Wear set)`]] : []), s.asset, v => { s.asset = v; change(); }))
            : help('Nothing can be worn yet: set Wear on an asset in Asset Lab → Interactions.'),
          help('The player shows the parts marked with it (Character Lab → Skin → Worn item). Progress → Reset on this sequence takes it off again.'));
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
      case 'object':
        s.action ||= 'hide';
        rows.push(field('Which (object placeholder)', roleSelect('actor', 'object')),
          segmented(Object.entries(Seq.OBJECT_ACTIONS), s.action, v => { s.action = v; change(); }),
          s.action === 'swap' ? el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Changes to' }),
            el('div', { class: 'sidescroll-seq-item' }, el('div', { class: 'sidescroll-seq-current', text: s.asset ? `▢ ${propLabel(s.asset)}` : 'None chosen' }),
              btn(s.asset ? 'Change…' : 'Choose…', () => chooseAsset(`object-${index}`, 'Change to which asset?', name => { s.asset = name; change(); })))) : null,
          help(s.action === 'show' ? 'It appears (set “Hidden at the start” on the object for things that appear later).'
            : s.action === 'hide' ? 'It disappears (the note picked up, the food eaten). Progress → Reset on the sequence brings it back.'
            : 'It shows another asset in its place (a full plate → an empty one, a log → split logs).'));
        break;
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
    // When it starts (its row on the timeline follows from Who).
    const timing = [
      el('div', { class: 'sidescroll-story-inline' }, el('span', { text: 'Starts at' }),
        el('input', { type: 'number', min: 0, max: 900, step: 0.1, value: fmt(s.at || 0, 2), inputmode: 'decimal',
          onchange: ev => { const v = Number(ev.target.value); if (Number.isFinite(v)) { s.at = Math.max(0, Math.round(v * 20) / 20); sortTimed(e); change(); } } }), el('span', { text: 's' })),
      help(s.type === 'prompt' ? 'The clock stops here until the player presses Action; everything after it waits.' : 'It starts at this time whatever else is running.')
    ];
    return el('div', { class: 'sidescroll-story-move sidescroll-seq-stepdetails' }, ...rows, ...timing);
  }
  // One line of the event page's summary (in time order): tap to open the
  // timeline on that step.
  function summaryRow(e, s, i) {
    const t = stepTiming(s);
    return el('button', { type: 'button', class: `sidescroll-seq-steprow kind-${STEP_KIND[s.type] || 'logic'}`, 'data-step': i, 'data-reveal': `step-${i}`,
      onclick: () => openTimeline(s) },
      el('span', { class: 'sidescroll-seq-at', title: 'Starts at', text: `${fmt(s.at || 0, 1)}s` }),
      el('span', { class: 'sidescroll-seq-steprow-icon', text: STEP_ICON[s.type] || '◇' }),
      el('span', { class: 'sidescroll-seq-steprow-text' }, el('b', { text: `${rowLabel(e, s)} · ` }), blockLabel(e, s)),
      el('span', { class: 'sidescroll-seq-chip', text: timingLabel(t) }));
  }
  // A step's text on its row (the row already says who).
  function blockLabel(e, s) {
    switch (s.type) {
      case 'move': return `${s.animation === 'run' ? 'Runs' : 'Walks'} to ${roleName(e, s.to)}`;
      case 'animate': return `${s.animation}${s.mode === 'loop' ? ' (loop)' : ''}`;
      case 'face': return `Faces ${s.toward === 'character' ? roleName(e, s.target) : s.toward}`;
      case 'say': case 'think': return `“${clip(s.text, 60)}”`;
      case 'wait': return 'Wait';
      case 'show': return s.visible ? 'Appears' : 'Disappears';
      case 'effect': return (host.effects?.() || []).find(x => x.id === s.asset)?.name || 'Effect';
      case 'prop': return `${Seq.PROP_ACTIONS[s.action] || ''}: ${clip((host.props?.() || []).find(x => x.id === s.asset)?.name || s.asset || '…', 18)}`;
      case 'camera': return s.mode === 'back' ? 'Back to the player' : `Shot on ${s.target ? roleName(e, s.target) : 'the player'}`;
      case 'object': return objectActionText(s)[0].toUpperCase() + objectActionText(s).slice(1);
      default: return stepSummary(e, s);
    }
  }

  // ---- Event timeline (⤢ Timeline): the event's editor ---------------------------
  // Rows by subject (timelineRows); where a step sits is when it starts. Tap an
  // empty spot on a row to add something there; drag ⋮⋮ (or press and hold) to
  // move a step in time or to another character's row; drag a block's right edge
  // to change how long it lasts; tap to edit it on the side; pinch to zoom.
  // Instant steps are diamonds. Steps that overlap on a row get extra lines.
  // Its size (bar along the bottom / lower half / full screen) and whether it is
  // pushed aside (a tab at the right edge) last for the session.
  const TL_VIEW_KEY = 'sidescroll.story.timeline-view';
  const TL_SIZES = ['bar', 'half', 'full'];
  // Focus: 'timeline' (taps edit the timeline) or 'game' (taps and the touch
  // controls go to the game; the timeline shows through and only its top line
  // works). Opacity: how solid the timeline is over the game.
  const TL_OPACITY = [1, 0.75, 0.5, 0.25];
  const tlView = (() => {
    const base = { size: 'half', aside: false, focus: 'timeline', opacity: 1 };
    try {
      const v = JSON.parse(sessionStorage.getItem(TL_VIEW_KEY) || '{}');
      return { size: TL_SIZES.includes(v.size) ? v.size : base.size, aside: !!v.aside,
        focus: v.focus === 'game' ? 'game' : 'timeline', opacity: TL_OPACITY.includes(v.opacity) ? v.opacity : 1 };
    } catch (_) { return base; }
  })();
  const timeline = { open: false, pps: 44, selected: null, selObj: null, root: null, picking: false, pickTimer: 0, scrollTo: null,
    size: tlView.size, aside: false, focus: tlView.focus, opacity: tlView.opacity, focusBeforePlay: null, playing: null, playT: 0, total: 0, raf: 0, rail: null };
  function saveTlView() {
    try { sessionStorage.setItem(TL_VIEW_KEY, JSON.stringify({ size: timeline.size, aside: timeline.aside, focus: timeline.focus, opacity: timeline.opacity })); } catch (_) {}
  }
  function setTlFocus(focus) { timeline.focus = focus === 'game' ? 'game' : 'timeline'; timeline.focusBeforePlay = null; saveTlView(); renderTimeline(); }
  function cycleTlOpacity() {
    timeline.opacity = TL_OPACITY[(TL_OPACITY.indexOf(timeline.opacity) + 1) % TL_OPACITY.length];
    saveTlView(); renderTimeline();
  }
  function setTlSize(size) {
    if (!TL_SIZES.includes(size)) return;
    timeline.size = size; timeline.aside = false; saveTlView(); renderTimeline();
  }
  function setTlAside(aside) { timeline.aside = !!aside; saveTlView(); renderTimeline(); }
  // Transport, shared with the TEST bar: host.transport(event) says whether
  // editor play is on, whether the story is paused and where this event is (null
  // when it isn't running, however it started: ▶ here, ▶ Play / ↺ Restart on the
  // TEST bar and walking into its zone, …). ▶ plays from the playhead (or the
  // start), ❚❚ pauses, ⏮ goes back to the start (paused); dragging on the ruler
  // or the Bar's strip scrubs (host.seekEvent); an edit replays to the playhead.
  const noTransport = { playing: false, paused: false, clock: null, prompt: false };
  const transportNow = () => (view.event && host.transport?.(view.event)) || noTransport;
  const gameRunning = tr => tr.playing && !tr.paused;
  function seekTo(t, pause = null) {
    const e = eventById(view.event);
    if (!e) return false;
    if (!host.seekEvent?.(e.id, view.returnTo || null, t)) { host.hint('No sequence runs this event yet: use it in a sequence’s logic to play it here'); return false; }
    if (pause != null) host.setPaused?.(pause);
    timeline.playT = t;
    syncTransport();
    return true;
  }
  function togglePlay() {
    const tr = transportNow();
    if (tr.clock != null && tr.playing) { host.setPaused?.(!tr.paused); syncTransport(); return; }
    timeline.seeking = true; preview(); timeline.seeking = false;
    const from = timeline.playT > 0.05 && timeline.playT < timeline.total - 0.05 ? timeline.playT : 0;
    seekTo(from, false);
  }
  function toStart() { timeline.seeking = true; preview(); timeline.seeking = false; seekTo(0, true); }
  // After an edit (which reloads the story and ends the run) the event is shown
  // again at the playhead, paused or playing as it was.
  function replayAtPlayhead() {
    if (!timeline.open || !timeline.live || timeline.seeking) return;
    const e = eventById(view.event);
    if (e) { host.seekEvent?.(e.id, view.returnTo || null, Math.min(timeline.playT, eventSeconds(e))); syncTransport(); }
  }
  // Scrubbing: the playhead follows at once; the scene catches up once a frame.
  function scrubTo(t) {
    timeline.playT = Math.max(0, Math.min(timeline.total, Math.round(t * 20) / 20));
    placePlayhead();
    if (timeline.scrubRaf) return;
    timeline.scrubRaf = requestAnimationFrame(() => { timeline.scrubRaf = 0; if (timeline.open) seekTo(timeline.playT, true); });
  }
  function startScrub() {
    const tr = transportNow();
    timeline.scrubResume = gameRunning(tr) && tr.clock != null;
    if (tr.playing) host.setPaused?.(true);
    timeline.seeking = true; preview(); timeline.seeking = false;
  }
  function endScrub() {
    if (timeline.scrubRaf) { cancelAnimationFrame(timeline.scrubRaf); timeline.scrubRaf = 0; seekTo(timeline.playT, true); }
    if (timeline.scrubResume) host.setPaused?.(false);
    timeline.scrubResume = false; syncTransport();
  }
  // Focus follows the game: playing (here or from the TEST bar) gives the game
  // the focus; pausing or stopping hands it back to the timeline.
  function followFocus(active) {
    if (active && timeline.focus !== 'game') { timeline.focusBeforePlay = timeline.focus; timeline.focus = 'game'; saveTlView(); return true; }
    if (!active && timeline.focusBeforePlay) { timeline.focus = timeline.focusBeforePlay; timeline.focusBeforePlay = null; saveTlView(); return true; }
    return false;
  }
  // Once a frame while the timeline is open: the playhead, clock and ▶ / ❚❚ follow the game.
  function syncTransport() {
    const tr = transportNow(), running = tr.clock != null;
    if (running && !timeline.scrubbing) timeline.playT = tr.clock;
    const active = gameRunning(tr);
    const changed = running !== timeline.live || tr.paused !== timeline.paused || tr.playing !== timeline.gamePlaying;
    timeline.live = running; timeline.paused = tr.paused; timeline.gamePlaying = tr.playing;
    if (changed && !timeline.scrubbing) { if (followFocus(active)) { renderTimeline(); return; } updateTransportUi(running && active); }
    else if (changed) updateTransportUi(running && active);
    placePlayhead();
  }
  function updateTransportUi(playing) {
    const b = timeline.root?.querySelector('.sidescroll-tl-play');
    if (b) { b.textContent = playing ? '❚❚' : '▶'; b.title = playing ? 'Pause' : 'Play the event in the game'; b.classList.toggle('on', playing); }
    timeline.rail?.classList.toggle('playing', playing);
    const ph = timeline.root?.querySelector('.sidescroll-tl-playhead');
    if (ph) ph.hidden = !timeline.live && !timeline.playT;
  }
  function startTransportLoop() {
    cancelAnimationFrame(timeline.raf);
    const step = () => { if (!timeline.open) return; syncTransport(); timeline.raf = requestAnimationFrame(step); };
    timeline.raf = requestAnimationFrame(step);
  }
  function stopTransportLoop() { cancelAnimationFrame(timeline.raf); timeline.raf = 0; }
  function placePlayhead() {
    const root = timeline.root;
    if (!root) return;
    const t = timeline.playT || 0, x = PAD + t * timeline.pps;
    const ph = root.querySelector('.sidescroll-tl-playhead');
    if (ph) {
      ph.style.left = `${x}px`;
      const sc = root.querySelector('.sidescroll-tl-scroll');
      if (sc && timeline.live && !timeline.paused && !timeline.scrubbing && (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft + TL.label + 10)) sc.scrollLeft = Math.max(0, x - TL.label - 60);
    }
    const mh = root.querySelector('.sidescroll-tl-mini-head');
    if (mh) mh.style.left = `${Math.min(100, (t / Math.max(0.1, timeline.total)) * 100)}%`;
    const clock = root.querySelector('.sidescroll-tl-clock');
    if (clock) clock.textContent = `${fmt(t, 1)} / ${fmt(timeline.total, 1)} s`;
  }
  const TL = { label: 92, lane: 40, top: 22, minW: 64, snap: 0.1, magnet: 10, diamond: 22 };
  const PAD = TL.label + 12;
  const openEnded = s => s.type === 'prompt';
  // Seconds a step takes for placing others after it (open-ended: none).
  const runSeconds = s => (openEnded(s) ? 0 : stepTiming(s).seconds);
  const isInstant = s => { const t = stepTiming(s); return !t.open && t.seconds < 0.35; };
  // Steps whose length can be dragged, and setting it.
  function resizable(s) {
    switch (s.type) {
      case 'say': case 'think': case 'wait': case 'move': return true;
      case 'look': case 'screen': case 'camera': return s.seconds > 0;
      case 'effect': return (s.keys || []).some(k => k.seconds > 0);
      default: return false;
    }
  }
  const LENGTH_MIN = { say: 1, think: 1, wait: 0.1, move: 0.5, look: 0.1, screen: 0.1, camera: 0.1 };
  const LENGTH_MAX = { say: 30, think: 30, wait: 120, move: 600, look: 30, screen: 10, camera: 60 };
  function lengthLimits(s) {
    if (s.type === 'effect') return [(s.delay || 0) + 0.1, (s.delay || 0) + 60];
    return [LENGTH_MIN[s.type] ?? 0.1, LENGTH_MAX[s.type] ?? 60];
  }
  function setLength(s, seconds) {
    const [lo, hi] = lengthLimits(s), sec = Math.round(Math.max(lo, Math.min(hi, seconds)) * 20) / 20;
    if (s.type === 'effect') {
      const sum = (s.keys || []).reduce((t, k) => t + k.seconds, 0), f = (sec - (s.delay || 0)) / Math.max(0.01, sum);
      s.keys.forEach(k => { k.seconds = Math.round(k.seconds * f * 100) / 100; });
      return;
    }
    if (s.type === 'move') s.timing = 'time';
    s.seconds = sec;
  }
  // Where each step starts: its own time (timed events) or, for an event that
  // still runs step by step, the time it would start at now.
  function timedPlacement(e) {
    if (e.timed) return e.steps.map(s => ({ at: s.at || 0 }));
    const out = [];
    let t = 0;
    for (const beat of beatsOf(e.steps)) {
      let end = t;
      for (const i of beat) { out[i] = { at: t }; if (!e.steps[i].background) end = Math.max(end, t + runSeconds(e.steps[i])); }
      t = end;
    }
    return out;
  }
  function makeTimed(e) {
    if (e.timed) return;
    const place = timedPlacement(e);
    e.steps.forEach((s, i) => { s.at = Math.round(place[i].at * 20) / 20; delete s.with; delete s.background; delete s.track; });
    e.timed = true;
    sortTimed(e);
  }
  function sortTimed(e) {
    e.steps = e.steps.map((s, i) => [s, i]).sort((a, b) => (a[0].at || 0) - (b[0].at || 0) || a[1] - b[1]).map(x => x[0]);
    e.steps.forEach(s => { s.with = false; delete s.track; });
  }
  const eventSeconds = (e, place = timedPlacement(e)) => Math.max(0, ...e.steps.map((s, i) => place[i].at + stepTiming(s).seconds));
  function openTimeline(step = null) {
    const e = eventById(view.event);
    timeline.open = true; timeline.aside = false; timeline.selObj = step; timeline.selected = step && e ? e.steps.indexOf(step) : null;
    timeline.scrollTo = step ? Math.max(0, PAD + (step.at || 0) * timeline.pps - 160) : 0;
    document.body.classList.add('sidescroll-tl-open');
    timeline.live = false; timeline.paused = false; timeline.gamePlaying = false;
    renderTimeline();
    startTransportLoop();
  }
  function closeTimeline() {
    stopTransportLoop();
    timeline.open = false; closeChooser(); clearInterval(timeline.pickTimer);
    timeline.root?.remove(); timeline.root = null;
    timeline.rail?.remove(); timeline.rail = null;
    document.body.classList.remove('sidescroll-tl-open', 'sidescroll-tl-shown', 'sidescroll-tl-focus-game', ...TL_SIZES.map(k => `sidescroll-tl-size-${k}`));
    render();
  }
  function timelineLayout(e) {
    const rows = timelineRows(e), pps = timeline.pps;
    const items = e.steps.map((s, i) => {
      const timing = stepTiming(s), at = s.at || 0, instant = isInstant(s), label = blockLabel(e, s), x = PAD + at * pps;
      const w = instant ? TL.diamond + Math.min(150, 6 * label.length + 12) : Math.max(TL.minW, timing.seconds * pps);
      return { i, s, at, timing, instant, label, x, x0: instant ? x - TL.diamond / 2 : x, w, row: rowKeyOf(s) };
    });
    // Each row gets as many lines as its overlapping steps need (as drawn).
    let y = TL.top;
    for (const row of rows) {
      const mine = items.filter(it => it.row === row.key).sort((a, b) => a.x0 - b.x0 || a.i - b.i), ends = [];
      for (const it of mine) {
        let lane = ends.findIndex(end => end <= it.x0 + 1);
        if (lane < 0) { lane = ends.length; ends.push(0); }
        ends[lane] = it.x0 + it.w + 4; it.lane = lane;
      }
      Object.assign(row, { lanes: Math.max(1, ends.length), y, count: mine.length });
      row.h = row.lanes * TL.lane;
      for (const it of mine) it.y = y + it.lane * TL.lane + 3;
      y += row.h;
    }
    const total = eventSeconds(e);
    const width = Math.max(PAD + 30 * pps, ...items.map(it => it.x0 + it.w), PAD + total * pps) + 240;
    return { rows, items, total, width, height: y + 40 };
  }
  function renderTimeline() {
    const e = view.page === 'event' ? eventById(view.event) : null;
    if (!timeline.open || !e) { if (timeline.open) closeTimeline(); return; }
    makeTimed(e);
    const old = timeline.root, oldScroll = old?.querySelector('.sidescroll-tl-scroll');
    const keep = old ? { left: oldScroll?.scrollLeft || 0, top: oldScroll?.scrollTop || 0, sheet: old.querySelector('.sidescroll-tl-sheet-body')?.scrollTop || 0 } : null;
    // The sheet follows its step when it moves and closes if it is removed.
    if (timeline.selObj && e.steps[timeline.selected] !== timeline.selObj) {
      const at = e.steps.indexOf(timeline.selObj);
      timeline.selected = at >= 0 ? at : null;
    }
    if (timeline.selected != null && !e.steps[timeline.selected]) timeline.selected = null;
    timeline.selObj = timeline.selected != null ? e.steps[timeline.selected] : null;
    const L = timelineLayout(e), pps = timeline.pps;
    const every = pps >= 36 ? 1 : pps >= 18 ? 2 : pps >= 8 ? 5 : 10;
    const ruler = [];
    for (let sec = 0; sec <= Math.ceil((L.width - PAD) / pps); sec++) if (sec % every === 0 || pps >= 18)
      ruler.push(el('div', { class: `sidescroll-tl-tick${sec % every ? ' minor' : ''}`, style: `left:${PAD + sec * pps}px` }, sec % every ? null : `${sec}s`));
    const rows = L.rows.map((r, k) => el('div', { class: `sidescroll-tl-row${k % 2 ? ' odd' : ''}`, 'data-row': r.key, style: `top:${r.y}px;height:${r.h}px;width:${L.width}px` },
      r.count || !r.adds.length ? null : el('span', { class: 'sidescroll-tl-empty', style: `left:${PAD + 6}px`, text: 'tap to add' })));
    const labels = el('div', { class: 'sidescroll-tl-labels', style: `height:${L.height}px` },
      ...L.rows.map(r => el('div', { class: `sidescroll-tl-rowlabel${r.role ? ' role' : ''}`, style: `top:${r.y}px;height:${r.h}px` },
        el('b', { text: r.icon }), el('span', { text: r.label }))),
      el('button', { type: 'button', class: 'sidescroll-tl-addrole', style: `top:${L.height - 36}px`, onclick: () => {
        const taken = takenIds(), n = e.roles.filter(r => r.kind === 'character').length;
        e.roles.push({ id: Seq.newId('r', taken), name: n ? `Other${n > 1 ? ` ${n}` : ''}` : 'Actor', kind: 'character' });
        change(); host.hint('Added a character placeholder · rename it on the event page');
      } }, '+ Character'));
    const blocks = L.items.map(it => {
      const s = it.s, t = it.timing, kind = STEP_KIND[s.type] || 'logic', sel = timeline.selected === it.i ? ' selected' : '';
      if (it.instant) return el('div', { class: `sidescroll-tl-block point kind-${kind}${sel}`, 'data-i': it.i, style: `left:${it.x0}px;top:${it.y}px;width:${it.w}px`, title: `${fmt(it.at, 2)} s` },
        el('span', { class: 'sidescroll-tl-grip sidescroll-tl-diamond', 'aria-label': `Drag ${it.label}` }),
        el('span', { class: 'sidescroll-tl-text' }, el('b', { text: STEP_ICON[s.type] || '◇' }), ` ${it.label}`));
      return el('div', { class: `sidescroll-tl-block kind-${kind}${t.approx || t.open ? ' approx' : ''}${sel}`, 'data-i': it.i, style: `left:${it.x}px;top:${it.y}px;width:${it.w}px` },
        el('span', { class: 'sidescroll-tl-grip', 'aria-label': `Drag ${it.label}` }, '⋮⋮'),
        el('span', { class: 'sidescroll-tl-text' }, el('b', { text: STEP_ICON[s.type] || '◇' }), ` ${it.label}`),
        el('small', { text: `${fmt(it.at, 1)} s · ${timingLabel(t)}` }),
        resizable(s) ? el('span', { class: 'sidescroll-tl-edge', 'aria-label': 'Drag to change how long it lasts' }) : null);
    });
    const content = el('div', { class: 'sidescroll-tl-content', style: `width:${L.width}px;height:${L.height}px` }, ...rows, ...blocks,
      el('div', { class: 'sidescroll-tl-ruler', style: `width:${L.width}px` }, ...ruler),
      el('div', { class: 'sidescroll-tl-endmark', style: `left:${PAD + L.total * pps}px;height:${L.height - TL.top - 36}px` }, el('span', { text: `end ${fmt(L.total, 1)} s` })),
      labels);
    const scroller = el('div', { class: 'sidescroll-tl-scroll' }, content);
    const sel = timeline.selected != null ? e.steps[timeline.selected] : null;
    const sheet = sel ? el('aside', { class: 'sidescroll-tl-sheet' },
      el('div', { class: 'sidescroll-tl-sheet-head' }, el('strong', { text: `${Seq.STEPS[sel.type]?.label || 'Step'} · ${rowLabel(e, sel)}` }),
        btn('Duplicate', () => {
          const copy = clone(sel); copy.at = Math.round(((sel.at || 0) + Math.max(0.5, stepTiming(sel).seconds)) * 20) / 20;
          e.steps.push(copy); sortTimed(e); timeline.selObj = copy; change();
        }),
        btn('Remove', () => { e.steps.splice(e.steps.indexOf(sel), 1); timeline.selected = null; timeline.selObj = null; change(); }, 'danger'),
        btn('Done', () => { timeline.selected = null; timeline.selObj = null; renderTimeline(); }, 'primary')),
      el('div', { class: 'sidescroll-tl-sheet-body' }, stepEditor(e, sel, timeline.selected))) : null;
    timeline.total = L.total;
    const size = timeline.size, full = size === 'full';
    const t = timeline.playT || 0;
    const isPlaying = timeline.live && timeline.gamePlaying && !timeline.paused;
    const playBtn = el('span', { class: 'sidescroll-tl-transport' },
      btn('⏮', toStart, '', 'Back to the start (paused)'),
      btn(isPlaying ? '❚❚' : '▶', togglePlay, `sidescroll-tl-play${isPlaying ? ' on' : ''}`, isPlaying ? 'Pause' : 'Play the event in the game'));
    const clock = el('span', { class: 'sidescroll-tl-clock', text: `${fmt(t, 1)} / ${fmt(L.total, 1)} s` });
    const sizes = el('span', { class: 'sidescroll-tl-sizes' }, ...[['bar', '▁', 'Bar'], ['half', '▄', 'Half'], ['full', '█', 'Full screen']]
      .map(([k, icon, label]) => btn(icon, () => setTlSize(k), size === k ? 'on' : '', label)));
    const asideBtn = btn('‹', () => setTlAside(true), 'sidescroll-tl-collapse', 'Collapse the timeline');
    const gameFocus = timeline.focus === 'game';
    const focusSeg = el('span', { class: 'sidescroll-tl-focus' },
      btn('🎮', () => setTlFocus('game'), gameFocus ? 'on' : '', 'Focus on the game (taps and controls go to the game)'),
      btn('✎', () => setTlFocus('timeline'), gameFocus ? '' : 'on', 'Focus on the timeline (taps edit it)'));
    const opacityBtn = btn(`◐ ${Math.round(timeline.opacity * 100)}%`, cycleTlOpacity, 'sidescroll-tl-opacity', 'How solid the timeline is over the game');
    const saveBtn = btn('Save', () => { saveDraft(); host.hint('Story saved'); }, `primary${dirty ? '' : ' quiet'}`);
    const handle = el('div', { class: 'sidescroll-tl-handle', role: 'button', 'aria-label': 'Drag or tap to resize the timeline; swipe left to collapse it' });
    // Bar: one line, with a strip of the whole event (a tick per step, a line per row).
    let body;
    if (size === 'bar') {
      const rowIndex = new Map(L.rows.map((r, k) => [r.key, k])), lane = 30 / Math.max(1, L.rows.length), span = Math.max(0.1, L.total);
      const mini = el('div', { class: 'sidescroll-tl-mini' },
        ...L.items.map(it => el('div', { class: `sidescroll-tl-mini-step kind-${STEP_KIND[it.s.type] || 'logic'}${timeline.selected === it.i ? ' selected' : ''}`,
          title: `${fmt(it.at, 1)} s · ${it.label}`,
          style: `left:${(it.at / span) * 100}%;width:${Math.max(0.6, (it.timing.seconds / span) * 100)}%;top:${2 + (rowIndex.get(it.row) || 0) * lane}px;height:${Math.max(2, lane - 1.5)}px`,
          onclick: () => { if (timeline.stripScrubbed) return; timeline.selected = it.i; timeline.selObj = it.s; renderTimeline(); } })),
        el('div', { class: 'sidescroll-tl-mini-head', style: `left:${Math.min(100, (t / span) * 100)}%` }));
      bindStripScrub(mini, span);
      body = [el('div', { class: 'sidescroll-tl-head' }, btn('✕', closeTimeline, '', 'Close the timeline'), playBtn, clock, mini, dirty ? saveBtn : null, focusSeg, opacityBtn, sizes, asideBtn)];
    } else {
      body = [
        el('div', { class: 'sidescroll-tl-head' },
          btn('✕', closeTimeline, '', 'Close the timeline'), playBtn, clock,
          el('strong', { text: e.name }),
          btn('↶', undo, history.undo.length ? '' : 'quiet', 'Undo'),
          btn('↷', redo, history.redo.length ? '' : 'quiet', 'Redo'),
          btn('+ Add', () => addStepChooser(e)),
          btn('Discard', () => { if (discard()) { closeTimeline(); open('list', null, { tab: 'events' }); } }, dirty ? '' : 'quiet'),
          saveBtn, focusSeg, opacityBtn, sizes, asideBtn),
        full ? el('p', { class: 'sidescroll-tl-help', text: 'Tap a row to add there · drag ⋮⋮ or hold to move · drag an edge to change the length · tap to edit · pinch to zoom' }) : null,
        el('div', { class: 'sidescroll-tl-main' }, scroller, full ? sheet : null)];
      content.append(el('div', { class: 'sidescroll-tl-playhead', hidden: !timeline.live && !t, style: `left:${PAD + t * pps}px;height:${L.height - 36}px` }));
    }
    const root = el('div', { class: `sidescroll-tl size-${size}${timeline.aside ? ' aside' : ''}${sheet ? ' has-sheet' : ''}${gameFocus ? ' focus-game' : ''}`,
      role: 'dialog', 'aria-label': `${e.name} timeline`, style: `--tl-alpha:${timeline.opacity}` },
      handle, ...body, full ? null : sheet);
    document.body.classList.add('sidescroll-tl-open');
    for (const k of TL_SIZES) document.body.classList.toggle(`sidescroll-tl-size-${k}`, k === size && !timeline.aside);
    document.body.classList.toggle('sidescroll-tl-focus-game', gameFocus && !timeline.aside);
    document.body.classList.toggle('sidescroll-tl-shown', !timeline.aside); // collapsed: the game's controls are back
    // Pushed aside: the same collapsed rail as the editor panel's, in the same
    // place (the panel's left edge and height); tap or swipe right to bring it back.
    if (!timeline.rail) {
      timeline.rail = el('button', { type: 'button', class: 'sidescroll-tl-rail', 'aria-label': 'Expand the timeline', onclick: () => setTlAside(false) },
        el('span', { text: 'TIMELINE' }), el('b', { text: '›' }), el('i', { hidden: true }));
      bindSwipe(timeline.rail, dx => { if (dx > 0) setTlAside(false); });
      document.body.append(timeline.rail);
    }
    timeline.rail.hidden = !timeline.aside;
    timeline.rail.querySelector('i').hidden = !dirty;
    if (timeline.aside) {
      const node = document.getElementById('sidescroll-puzzle-panel'), r = node?.getBoundingClientRect();
      const box = r && r.height > 40 ? { left: r.left + node.clientLeft, top: r.top + node.clientTop, height: node.clientHeight } : { left: 10, top: 64, height: innerHeight - 74 };
      Object.assign(timeline.rail.style, { left: `${box.left}px`, top: `${box.top}px`, height: `${box.height}px` });
    }
    if (old) old.replaceWith(root); else document.body.append(root);
    if (timeline.picking) root.classList.add('picking');
    timeline.root = root;
    if (timeline.scrollTo != null) { scroller.scrollLeft = timeline.scrollTo; scroller.scrollTop = keep?.top || 0; timeline.scrollTo = null; }
    else if (keep) { scroller.scrollLeft = keep.left; scroller.scrollTop = keep.top; }
    if (keep) { const sb = root.querySelector('.sidescroll-tl-sheet-body'); if (sb) sb.scrollTop = keep.sheet; }
    // Row names stay at the left edge while the time scrolls.
    const pin = () => { content.style.setProperty('--sx', `${scroller.scrollLeft}px`); content.style.setProperty('--sy', `${scroller.scrollTop}px`); };
    scroller.addEventListener('scroll', pin, { passive: true }); pin();
    if (size !== 'bar') bindTimeline(e, scroller, content, L);
    bindHandle(handle);
    // The timeline overlays the game (the view never changes); the side sheet sits above it.
    requestAnimationFrame(() => { if (timeline.root === root) document.body.style.setProperty('--tl-h', `${root.offsetHeight}px`); });
  }
  // Bar's strip: drag (or tap an empty spot) to move the playhead and scrub; a
  // tap on a step's line opens it.
  function bindStripScrub(mini, span) {
    let start = null;
    const at = ev => { const r = mini.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / Math.max(1, r.width))) * span; };
    mini.addEventListener('pointerdown', ev => {
      start = { id: ev.pointerId, x: ev.clientX, onStep: !!ev.target.closest('.sidescroll-tl-mini-step'), scrubbing: false };
      timeline.stripScrubbed = false;
      if (!start.onStep) { try { mini.setPointerCapture(ev.pointerId); } catch (_) {} start.scrubbing = true; timeline.scrubbing = true; startScrub(); scrubTo(at(ev)); }
    });
    mini.addEventListener('pointermove', ev => {
      if (!start || ev.pointerId !== start.id) return;
      if (!start.scrubbing && Math.abs(ev.clientX - start.x) > 6) { try { mini.setPointerCapture(ev.pointerId); } catch (_) {} start.scrubbing = true; timeline.scrubbing = true; timeline.stripScrubbed = true; startScrub(); }
      if (start.scrubbing) { ev.preventDefault(); scrubTo(at(ev)); }
    });
    const end = ev => {
      if (!start || ev.pointerId !== start.id) return;
      if (start.scrubbing) { timeline.scrubbing = false; endScrub(); }
      start = null;
      setTimeout(() => { timeline.stripScrubbed = false; }, 0);
    };
    mini.addEventListener('pointerup', end);
    mini.addEventListener('pointercancel', end);
  }
  // A horizontal swipe on `node` (≥ 42 px, mostly sideways) → onSwipe(dx).
  function bindSwipe(node, onSwipe) {
    let start = null;
    node.addEventListener('pointerdown', ev => { start = { id: ev.pointerId, x: ev.clientX, y: ev.clientY }; }, { passive: true });
    node.addEventListener('pointerup', ev => {
      if (!start || ev.pointerId !== start.id) return;
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y; start = null;
      if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.2) onSwipe(dx);
    }, { passive: true });
    node.addEventListener('pointercancel', () => { start = null; }, { passive: true });
  }
  // The top edge: tap for the next size up (bar → half → full → bar), drag up /
  // down for bigger / smaller, swipe left to collapse it (like the editor panel).
  function bindHandle(node) {
    let start = null;
    node.addEventListener('pointerdown', ev => { start = { id: ev.pointerId, x: ev.clientX, y: ev.clientY }; try { node.setPointerCapture(ev.pointerId); } catch (_) {} ev.preventDefault(); });
    node.addEventListener('pointerup', ev => {
      if (!start || ev.pointerId !== start.id) return;
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y; start = null;
      const k = TL_SIZES.indexOf(timeline.size);
      if (dx < -50 && Math.abs(dx) > Math.abs(dy)) setTlAside(true);
      else if (Math.abs(dy) < 12 && Math.abs(dx) < 12) setTlSize(TL_SIZES[(k + 1) % TL_SIZES.length]);
      else if (dy < -30) setTlSize(TL_SIZES[Math.min(TL_SIZES.length - 1, k + (dy < -innerHeight * 0.4 ? 2 : 1))]);
      else if (dy > 30) setTlSize(TL_SIZES[Math.max(0, k - (dy > innerHeight * 0.4 ? 2 : 1))]);
    });
    node.addEventListener('pointercancel', () => { start = null; });
  }
  // Zoom by a factor, keeping the time at `focusX` (px in the view) in place.
  function zoomTimeline(factor, focusX = null) {
    const sc = timeline.root?.querySelector('.sidescroll-tl-scroll');
    const fx = focusX ?? (sc ? sc.clientWidth / 2 : 0);
    const time = sc ? (sc.scrollLeft + fx - PAD) / timeline.pps : 0;
    timeline.pps = Math.max(6, Math.min(240, timeline.pps * factor));
    timeline.scrollTo = Math.max(0, PAD + time * timeline.pps - fx);
    renderTimeline();
  }
  function bindTimeline(e, scroller, content, L) {
    let press = null, pinch = null;
    const local = ev => { const r = content.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    const rowAt = y => L.rows.find(r => y >= r.y && y < r.y + r.h) || (y < TL.top ? L.rows[0] : L.rows[L.rows.length - 1]);
    const snapTime = t => Math.round(Math.max(0, t) / TL.snap) * TL.snap;
    // Where the dragged step lands: its start snapped to 0.1 s, and to other
    // steps' starts / ends when close; its row if it may go there.
    function landing(pt) {
      const it = press.it;
      let at = Math.max(0, (pt.x - press.offX - PAD) / timeline.pps);
      let best = null;
      for (const o of L.items) if (o.i !== it.i) for (const t of [o.at, o.at + o.timing.seconds]) {
        const d = Math.abs((t - at) * timeline.pps);
        if (d <= TL.magnet && (!best || d < best.d)) best = { d, t };
      }
      at = best ? best.t : snapTime(at);
      const want = rowAt(pt.y - press.offY + TL.lane / 2), row = canMoveTo(it.s, want) ? want : L.rows.find(r => r.key === it.row);
      return { at: Math.round(at * 20) / 20, row, blocked: want !== row, snapped: !!best };
    }
    function startDrag() {
      const node = content.querySelector(`.sidescroll-tl-block[data-i="${press.it.i}"]`);
      if (!node) return;
      clearTimeout(press.timer);
      press.dragging = true;
      press.ghost = node.cloneNode(true); press.ghost.classList.add('ghost');
      press.readout = el('div', { class: 'sidescroll-tl-readout' });
      press.marker = el('div', { class: 'sidescroll-tl-drop', style: `height:${L.height - TL.top - 36}px` });
      node.classList.add('dragging');
      content.append(press.marker, press.ghost, press.readout);
      navigator.vibrate?.(12);
      dragTo(press.last);
    }
    function edgeScroll(ev) {
      const r = scroller.getBoundingClientRect();
      if (ev.clientX > r.right - 36) scroller.scrollLeft += 12; else if (ev.clientX < r.left + TL.label + 20) scroller.scrollLeft -= 12;
      if (ev.clientY > r.bottom - 30) scroller.scrollTop += 10; else if (ev.clientY < r.top + 30) scroller.scrollTop -= 10;
    }
    function dragTo(ev) {
      const pt = local(ev), it = press.it;
      press.land = landing(pt);
      const x = PAD + press.land.at * timeline.pps, sameRow = press.land.row.key === it.row;
      const y = sameRow ? it.y : press.land.row.y + 3;
      press.ghost.style.left = `${it.instant ? x - TL.diamond / 2 : x}px`; press.ghost.style.top = `${y}px`;
      press.marker.style.left = `${x - 1}px`; press.marker.classList.toggle('snapped', press.land.snapped);
      press.readout.textContent = `${fmt(press.land.at, 2)} s · ${press.land.row.label}${press.land.blocked ? ' (stays on its row)' : ''}`;
      press.readout.style.left = `${x}px`; press.readout.style.top = `${Math.max(0, y - 20)}px`;
      edgeScroll(ev);
    }
    // Dragging a right edge: the step's length, snapped to 0.1 s.
    function resizeTo(ev) {
      const pt = local(ev), it = press.it, [lo, hi] = lengthLimits(it.s);
      const sec = Math.max(lo, Math.min(hi, snapTime((pt.x - it.x) / timeline.pps)));
      press.length = sec;
      press.node.style.width = `${Math.max(TL.minW, sec * timeline.pps)}px`;
      press.readout.textContent = `${fmt(sec, 1)} s long`;
      press.readout.style.left = `${it.x + sec * timeline.pps}px`; press.readout.style.top = `${Math.max(0, it.y - 20)}px`;
      edgeScroll(ev);
    }
    function addAt(pt) {
      if (pt.x - scroller.scrollLeft < TL.label || pt.y < TL.top) return;
      const row = rowAt(pt.y), at = Math.round(snapTime((pt.x - PAD) / timeline.pps) * 20) / 20;
      const options = row.adds.map(k => ADD[k]);
      if (!options.length) return;
      if (options.length === 1) { createStep(e, row, options[0], at); return; }
      openChooser('tl-add', `${row.label} at ${fmt(at, 1)} s`, options.map((o, k) => ({ value: String(k), label: o.label, thumb: STEP_ICON[o.type] || '◇', note: Seq.STEPS[o.type]?.help })),
        v => createStep(e, row, options[Number(v)], at), 'Tap one to add it there');
    }
    function finish(cancelled) {
      const p = press; press = null;
      if (!p) return;
      clearTimeout(p.timer);
      if (p.mode === 'tap') { if (!cancelled && !p.moved) addAt(p.pt); return; }
      if (p.mode === 'scrub') { timeline.scrubbing = false; endScrub(); return; }
      if (p.mode === 'resize') {
        p.readout.remove();
        if (cancelled || p.length == null) { renderTimeline(); return; }
        setLength(p.it.s, p.length); change(); return;
      }
      if (p.dragging) {
        p.ghost.remove(); p.marker.remove(); p.readout.remove();
        if (cancelled || !p.land) { renderTimeline(); return; }
        const s = p.it.s, moved = p.land.row.key !== p.it.row;
        s.at = p.land.at; putOnRow(s, p.land.row);
        sortTimed(e);
        change();
        if (moved) host.hint(`Moved to ${p.land.row.label}`);
        return;
      }
      if (!cancelled && !p.moved) { timeline.selected = p.it.i; timeline.selObj = p.it.s; renderTimeline(); }
    }
    content.addEventListener('pointerdown', ev => {
      if (press || pinch || ev.target.closest('.sidescroll-tl-labels')) return;
      const node = ev.target.closest('.sidescroll-tl-block'), pt = local(ev);
      // The ruler (it stays at the top) or the playhead itself: tap or drag to move it and scrub.
      if (ev.target.closest('.sidescroll-tl-playhead') || (!node && pt.y - scroller.scrollTop < TL.top && pt.x - scroller.scrollLeft > TL.label)) {
        ev.preventDefault(); try { content.setPointerCapture(ev.pointerId); } catch (_) {}
        press = { mode: 'scrub', id: ev.pointerId };
        timeline.scrubbing = true; startScrub(); scrubTo((pt.x - PAD) / timeline.pps);
        return;
      }
      if (!node) { press = { mode: 'tap', id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, pt, moved: false }; return; }
      const it = L.items.find(x => x.i === Number(node.dataset.i));
      press = { mode: 'move', it, node, id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, last: ev, moved: false, dragging: false, offX: pt.x - it.x, offY: pt.y - it.y };
      if (ev.target.closest('.sidescroll-tl-edge')) {
        ev.preventDefault(); try { content.setPointerCapture(ev.pointerId); } catch (_) {}
        press.mode = 'resize'; press.readout = el('div', { class: 'sidescroll-tl-readout' }); content.append(press.readout);
        node.classList.add('resizing'); resizeTo(ev);
      } else if (ev.target.closest('.sidescroll-tl-grip')) { ev.preventDefault(); try { content.setPointerCapture(ev.pointerId); } catch (_) {} startDrag(); }
      else press.timer = setTimeout(() => { if (press && !press.moved && !pinch) { try { content.setPointerCapture(press.id); } catch (_) {} startDrag(); } }, 380);
    });
    content.addEventListener('pointermove', ev => {
      if (!press || ev.pointerId !== press.id) return;
      press.last = ev;
      if (press.mode === 'scrub') { ev.preventDefault(); scrubTo((local(ev).x - PAD) / timeline.pps); edgeScroll(ev); return; }
      if (press.mode === 'resize') { ev.preventDefault(); resizeTo(ev); return; }
      if (press.dragging) { ev.preventDefault(); dragTo(ev); return; }
      if (Math.hypot(ev.clientX - press.x0, ev.clientY - press.y0) > 8) { press.moved = true; clearTimeout(press.timer); }
    });
    content.addEventListener('pointerup', ev => { if (press && ev.pointerId === press.id) finish(false); });
    content.addEventListener('pointercancel', ev => { if (press && ev.pointerId === press.id) finish(true); });
    // Pinch to zoom (two fingers); one finger scrolls; a drag moves the step, not the view.
    const span = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    scroller.addEventListener('touchstart', ev => {
      if (ev.touches.length !== 2 || press?.dragging || press?.mode === 'resize') return;
      if (press) { clearTimeout(press.timer); press = null; }
      const r = scroller.getBoundingClientRect();
      pinch = { d0: span(ev.touches), pps0: timeline.pps, fx: (ev.touches[0].clientX + ev.touches[1].clientX) / 2 - r.left, raf: 0 };
      ev.preventDefault();
    }, { passive: false });
    scroller.addEventListener('touchmove', ev => {
      if (press?.dragging || press?.mode === 'resize') { ev.preventDefault(); return; }
      if (!pinch || ev.touches.length !== 2) return;
      ev.preventDefault();
      const want = pinch.pps0 * span(ev.touches) / Math.max(10, pinch.d0);
      if (pinch.raf) return;
      pinch.raf = requestAnimationFrame(() => { const p = pinch; if (!p) return; p.raf = 0; const f = want / timeline.pps; if (Math.abs(f - 1) > 0.01) { pinch = null; zoomTimeline(f, p.fx); } });
    }, { passive: false });
    scroller.addEventListener('touchend', ev => { if (ev.touches.length < 2) pinch = null; });
    scroller.addEventListener('wheel', ev => { if (!ev.ctrlKey) return; ev.preventDefault(); const r = scroller.getBoundingClientRect(); zoomTimeline(Math.exp(-ev.deltaY * 0.01), ev.clientX - r.left); }, { passive: false });
  }
  // A new step on `row` starting at `at`, opened on the side.
  function createStep(e, row, opt, at) {
    const s = { type: opt.type, ...(opt.preset || {}), at };
    if (row.role) s.actor = row.role;
    else if (row.key === 'player' && opt.type === 'say') s.actor = Seq.PLAYER;
    const mark = e.roles.find(r => r.kind === 'mark')?.id;
    if (opt.type === 'move' && mark) s.to = mark;
    if (opt.type === 'flag') s.flag = knownFlags()[0] || 'met-father';
    const added = Seq.normaliseEvents({ events: [{ ...e, timed: true, steps: [s] }] })[0]?.steps[0] || s;
    delete added.track;
    e.steps.push(added); sortTimed(e);
    timeline.selObj = added; timeline.selected = e.steps.indexOf(added);
    change();
  }
  // + Add (timeline head): anything, on its row, where the event ends now.
  function addStepChooser(e) {
    const choices = [];
    timelineRows(e).forEach(row => row.adds.forEach(k => choices.push({ row, opt: ADD[k] })));
    openChooser('tl-add', 'Add at the end', choices.map((c, k) => ({ value: String(k), label: `${c.row.label} · ${c.opt.label}`, thumb: STEP_ICON[c.opt.type] || '◇', note: Seq.STEPS[c.opt.type]?.help })),
      v => { const c = choices[Number(v)]; createStep(e, c.row, c.opt, Math.round(eventSeconds(e) * 20) / 20); }, 'Or tap an empty spot on a row to add something at that time');
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
          btn('+ Mark placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'mark') ? 'Place' : 'Exit', kind: 'mark' }); change(); }, 'primary'),
          btn('+ Object placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'object') ? 'Other thing' : 'Thing', kind: 'object' }); change(); }, 'primary')),
        e.roles.map((r, i) => el('div', { class: 'sidescroll-seq-role' },
          textInput(r, 'name', 30, null, r.kind === 'mark' ? 'Name it, e.g. Exit or Hiding spot' : 'Name it, e.g. Actor or Friend'),
          el('span', { class: 'sidescroll-seq-kind', text: `${Seq.ROLE_KINDS[r.kind]}` }),
          xBtn(() => {
            e.roles.splice(i, 1);
            for (const s of e.steps) for (const k of ['actor', 'to', 'target']) if (s[k] === r.id) delete s[k];
            change();
          }, `Remove ${r.name}`)))),
      // The timeline is where an event is made; here is a summary in time order.
      section('Timeline',
        addBar(btn(e.steps.length ? '⤢ Open the timeline' : '⤢ Open the timeline to add steps', () => openTimeline(), 'primary')),
        e.steps.length ? help(`${e.steps.length} step${e.steps.length === 1 ? '' : 's'} · ${fmt(eventSeconds(e), 1)} s. Tap one to open the timeline on it. Wait for Action stops the clock until it is pressed.`) : null,
        e.steps.length ? el('div', { class: 'sidescroll-seq-steps timed' }, e.steps.map((s, i) => summaryRow(e, s, i))) : help('No steps yet.')),
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
  function saveDraft() { draft = clone(Seq.save(draft)); dirty = false; history.last = JSON.stringify(draft); preview(); render(); }
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
        btn('↶ Undo', undo, `sidescroll-story-undo${history.undo.length ? '' : ' quiet'}`),
        btn('Discard', () => { if (discard()) open('list'); }, 'sidescroll-story-discard'),
        btn('Save', () => { saveDraft(); host.hint('Story saved'); }, 'primary sidescroll-story-save')));
    updateStatus();
    if (timeline.open) renderTimeline();
    if (reveal) {
      const target = panel.querySelector(`[data-reveal="${reveal}"]`);
      reveal = null;
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  // Every event is a timeline from here on (saved as one with the next Save).
  timeAll(draft); resetHistory();
  new MutationObserver(() => {
    if (panel.hidden) { placeMode = null; closeChooser(); host.select(null, null); if (timeline.open) closeTimeline(); }
    else { syncSelection(); render(); }
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.SideScrollSequenceEditor = Object.freeze({ dirty: () => dirty, draft: () => clone(draft), save: saveDraft, view: () => ({ ...view }) });
})();
