/* SideScroll Sequences editor (game editor → Sequences scope).
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
  let pendingCharacter = null, pendingTemplate = null;

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
    placeMode = null;
    view.page = page;
    if (page === 'sequence') { view.placed = id; view.component = extra.component || null; const p = placedById(id); if (p && extra.focus !== false) host.lookAt(p.x); }
    if (page === 'event') { view.event = id; view.returnTo = extra.returnTo || null; }
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
        view.component = comp.id;
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
    const placing = placeMode?.kind === 'new-sequence' || placeMode?.kind === 'place-template';
    if (!pendingTemplate || !templateById(pendingTemplate)) pendingTemplate = draft.templates[0]?.id || null;
    return [
      segmented([['sequences', `Sequences (${draft.placed.length})`], ['events', `Events (${draft.events.length})`]], view.tab, v => { view.tab = v; placeMode = null; render(); }),
      ...(view.tab === 'sequences' ? [
        help('Sequences placed in the world, in journey order. Tap one (here or its post in the view) to open it.'),
        el('div', { class: 'sidescroll-story-list' }, placed.length ? placed.map(p => el('button', { type: 'button', onclick: () => open('sequence', p.id) },
          el('strong', { text: `▣ ${p.name}` }),
          el('small', { text: `${fmt(p.x)} m · ${p.template ? `template ${templateById(p.template)?.name || ''}` : 'unique'} · ${bodyOf(p).logic.length} line${bodyOf(p).logic.length === 1 ? '' : 's'}` })))
          : help('No sequences yet.')),
        row(btn(placeMode?.kind === 'new-sequence' ? 'Cancel' : '+ New sequence', () => setPlaceMode(placeMode?.kind === 'new-sequence' ? null : { kind: 'new-sequence' }, 'Tap the ground where the sequence goes'), placing ? 'active' : 'primary')),
        draft.templates.length ? el('div', { class: 'sidescroll-story-add' },
          select_(draft.templates.map(t => [t.id, `Template: ${t.name} (${instancesOf(t.id).length} placed)`]), pendingTemplate, v => { pendingTemplate = v; }),
          btn(placeMode?.kind === 'place-template' ? 'Cancel' : '+ Place', () => setPlaceMode(placeMode?.kind === 'place-template' ? null : { kind: 'place-template', template: pendingTemplate }, 'Tap the ground where it goes'), 'primary')) : null
      ] : [
        help('Events are reusable chains of steps, written with roles (Actor, Exit…) that each sequence fills in. Any sequence can run any event.'),
        el('div', { class: 'sidescroll-story-list' }, draft.events.length ? [...draft.events].sort((a, b) => a.name.localeCompare(b.name)).map(e => el('button', { type: 'button', onclick: () => open('event', e.id) },
          el('strong', { text: `✦ ${e.name}` }), el('small', { text: `${e.steps.length} step${e.steps.length === 1 ? '' : 's'} · used ${uses(e.id)}×` })))
          : help('No events yet.')),
        row(btn('+ New event', () => {
          const taken = takenIds(), id = Seq.newId('ev', taken), actor = Seq.newId('r', taken);
          draft.events.push({ id, name: `Event ${draft.events.length + 1}`, roles: [{ id: actor, name: 'Actor', kind: 'character' }], steps: [] });
          change(false); open('event', id);
        }, 'primary'))
      ]),
      progressBox()
    ];
  }

  // ---- Sequence page -------------------------------------------------------------
  const KIND_ICON = { character: '☺', mark: '◆', zone: '⚑' };
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
      field('Character', select_(characterChoices().map(x => [x.id, x.name]), c.character, v => { c.character = v; change(); })),
      field('Standing animation', select_(slotChoices(), c.animation, v => { c.animation = v; change(); }), 'Loops until an event moves or animates it'),
      slider(c, 'scale', 0.3, 3, 0.01, 'Size (× its own)', 2),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Blocks the player' }),
        segmented([['auto', 'Auto'], ['always', 'Always'], ['never', 'Never']], c.blocks, v => { c.blocks = v; change(); }),
        el('small', { text: 'Auto: blocks while it stands on the path; it can’t be walked or jumped past.' })));
    parts.push(row(btn('Remove', () => {
      if (!confirm(`Remove ${c.name}? Logic using it loses that part.`)) return;
      body.components = body.components.filter(x => x.id !== c.id);
      for (const l of body.logic) { for (const [r, id] of Object.entries(l.roles || {})) if (id === c.id) delete l.roles[r]; if (l.when?.zone === c.id) delete l.when.zone; }
      view.component = null; syncSelection(); change();
    }, 'danger')));
    return el('div', { class: 'sidescroll-story-editor' }, ...parts);
  }
  const lineName = (body, l) => `Line ${body.logic.indexOf(l) + 1}${eventById(l.event) ? `: ${eventById(l.event).name}` : ''}`;
  function lineEditor(p, body, l, index) {
    const zones = body.components.filter(c => c.kind === 'zone');
    const event = eventById(l.event);
    const when = l.when ||= { type: 'enter' };
    const whenRows = [select_(Object.entries(Seq.WHEN), when.type, v => { l.when = { type: v }; change(); })];
    if (when.type === 'enter' || when.type === 'action') {
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
    return el('div', { class: 'sidescroll-story-move' },
      el('div', { class: 'sidescroll-story-move-head' }, el('strong', { text: `Line ${index + 1}` }),
        btn('Test now', () => { preview(); host.fireLine(p.id, l.id) ? host.hint('Running the event (once-only lines still fire in play)') : host.hint('Choose an event first'); }),
        btn('↑', () => { const list = body.logic; list.splice(index - 1, 0, list.splice(index, 1)[0]); change(); }, index === 0 ? 'hidden' : ''),
        btn('Remove', () => { body.logic.splice(index, 1); change(); })),
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
    const adding = placeMode?.kind === 'add';
    const choices = characterChoices();
    if (!pendingCharacter || !choices.some(c => c.id === pendingCharacter)) pendingCharacter = choices[0]?.id || null;
    const addComp = (kind, extra, message) => setPlaceMode({ kind: 'add', comp: { kind, ...extra } }, message);
    const count = kind => body.components.filter(c => c.kind === kind).length + 1;
    return [
      row(btn('‹ Sequences', () => open('list', null, { tab: 'sequences' }))),
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
        body.components.length ? el('div', { class: 'sidescroll-story-list' }, body.components.map(c => el('button', { type: 'button', class: c.id === view.component ? 'active' : '',
          onclick: () => { view.component = view.component === c.id ? null : c.id; placeMode = null; syncSelection(); render(); } },
          el('strong', { text: `${KIND_ICON[c.kind]} ${c.name}` }),
          el('small', { text: c.kind === 'character' ? characterName(c.character) : c.kind === 'zone' ? `${fmt(c.width)} m wide` : `${fmt(p.x + c.dx)} m` }))))
          : help('Nothing yet. Add characters, marks (spots to walk to) and zones (where the player sets things off).'),
        comp ? componentEditor(p, body, comp) : null,
        el('div', { class: 'sidescroll-story-add' },
          select_(choices.map(c => [c.id, c.name]), pendingCharacter, v => { pendingCharacter = v; }),
          btn('+ Character', () => adding ? setPlaceMode(null) : addComp('character', { name: characterName(pendingCharacter), character: pendingCharacter, animation: 'idle', scale: 1, blocks: 'auto', facing: 1 }, 'Tap the ground where it stands'), 'primary')),
        row(btn('+ Mark', () => addComp('mark', { name: `Mark ${count('mark')}`, facing: 1 }, 'Tap the ground where the mark goes'), 'primary'),
          btn('+ Zone', () => addComp('zone', { name: `Zone ${count('zone')}`, width: 2 }, 'Tap the path where the zone goes'), 'primary'),
          adding ? btn('Cancel', () => setPlaceMode(null), 'active') : null)),
      section('Logic',
        help('Each line: when something happens, run an event, with its roles filled from these components.'),
        body.logic.map((l, i) => lineEditor(p, body, l, i)),
        row(btn('+ Add line', () => {
          const zone = body.components.find(c => c.kind === 'zone');
          body.logic.push({ id: Seq.newId('l', takenIds()), when: { type: zone ? 'enter' : 'load', ...(zone ? { zone: zone.id } : {}) }, event: draft.events[0]?.id || null, roles: {}, once: true });
          change();
        }, 'primary')),
        draft.events.length ? null : help('There are no events yet: make one in Events.'))
    ];
  }

  // ---- Event page -------------------------------------------------------------------
  function stepEditor(e, s, index) {
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
        rows.push(field('Who (character placeholder)', roleSelect('actor', 'character', true)), field('Line', line),
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
    }
    return el('div', { class: 'sidescroll-story-move' },
      el('div', { class: 'sidescroll-story-move-head' }, el('strong', { text: `${index + 1}. ${def.label}` }),
        btn('↑', () => { e.steps.splice(index - 1, 0, e.steps.splice(index, 1)[0]); change(); }, index === 0 ? 'hidden' : ''),
        btn('Remove', () => { e.steps.splice(index, 1); change(); })),
      ...rows,
      index > 0 ? el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!s.with, onchange: ev => { s.with = ev.target.checked; change(); } }),
        'At the same time as the step before') : null);
  }
  function eventPage() {
    const e = eventById(view.event);
    if (!e) { view.page = 'list'; return listPage(); }
    const usedBy = [];
    for (const p of draft.placed) bodyOf(p).logic.forEach((l, i) => { if (l.event === e.id) usedBy.push({ p, i }); });
    return [
      row(btn('‹ Events', () => open('list', null, { tab: 'events' })),
        view.returnTo && placedById(view.returnTo) ? btn(`‹ Back to ${placedById(view.returnTo).name}`, () => open('sequence', view.returnTo, { focus: false }), 'primary') : null),
      field('Name', textInput(e, 'name', 40, null, 'Name it, e.g. Greet and walk off')),
      section('Placeholders',
        help('Placeholders stand for the characters and marks this event acts on — you don’t choose real ones here. Give each a name (Actor, Exit…) and use it in the steps below. Each sequence that runs this event fills them in with its own character and mark (on its logic line).'),
        e.roles.map((r, i) => el('div', { class: 'sidescroll-seq-role' },
          textInput(r, 'name', 30, null, r.kind === 'mark' ? 'Name it, e.g. Exit or Hiding spot' : 'Name it, e.g. Actor or Friend'),
          el('span', { class: 'sidescroll-seq-kind', text: `${Seq.ROLE_KINDS[r.kind]} placeholder` }),
          btn('Remove', () => {
            e.roles.splice(i, 1);
            for (const s of e.steps) for (const k of ['actor', 'to', 'target']) if (s[k] === r.id) delete s[k];
            change();
          }))),
        row(btn('+ Character placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'character') ? 'Other' : 'Actor', kind: 'character' }); change(); }, 'primary'),
          btn('+ Mark placeholder', () => { e.roles.push({ id: Seq.newId('r', takenIds()), name: e.roles.some(r => r.kind === 'mark') ? 'Place' : 'Exit', kind: 'mark' }); change(); }, 'primary'))),
      section('Steps',
        e.steps.length ? e.steps.map((s, i) => stepEditor(e, s, i)) : help('No steps yet.'),
        el('div', { class: 'sidescroll-story-choices' }, Object.entries(Seq.STEPS).map(([type, def]) => btn(`+ ${def.label} — ${def.help}`, () => {
          const actor = e.roles.find(r => r.kind === 'character')?.id, mark = e.roles.find(r => r.kind === 'mark')?.id;
          const s = { type, ...(actor && Object.keys(def.roles).includes('actor') ? { actor } : {}), ...(type === 'move' && mark ? { to: mark } : {}) };
          if (type === 'flag') s.flag = knownFlags()[0] || 'met-father';
          e.steps.push(Seq.normaliseEvents({ events: [{ ...e, steps: [s] }] })[0]?.steps[0] || s);
          change();
        })))),
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
    panel.replaceChildren(
      el('div', { class: 'sidescroll-story-head' }, el('strong', { text: view.page === 'event' ? 'Event' : view.page === 'sequence' ? 'Sequence' : 'Sequences' }), statusEl),
      ...page,
      el('datalist', { id: 'sidescroll-seq-flags' }, knownFlags().map(f => el('option', { value: f }))),
      el('div', { class: 'sidescroll-story-actions' },
        btn('Discard', () => {
          if (!confirm('Discard your Sequences changes since the last save?')) return;
          draft = clone(Seq.load()); dirty = false; placeMode = null; preview(); open('list');
        }, 'sidescroll-story-discard'),
        btn('Save', () => { saveDraft(); host.hint('Sequences saved'); }, 'primary sidescroll-story-save')));
    updateStatus();
  }
  new MutationObserver(() => {
    if (panel.hidden) { placeMode = null; host.select(null, null); }
    else { syncSelection(); render(); }
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.SideScrollSequenceEditor = Object.freeze({ dirty: () => dirty, draft: () => clone(draft), save: saveDraft, view: () => ({ ...view }) });
})();
