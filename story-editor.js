/* SideScroll Story editor (game editor → Story scope).
 * Design: docs/SEQUENCE_SYSTEM_DESIGN.md (stage 1: world characters and marks).
 *
 * Edits a draft of the world characters and marks, shown live in the game
 * through window.SideScrollStoryHost.preview(), and writes it with
 * SideScrollStory.save() on "Save story" (Discard goes back to the saved copy).
 * A tap in the game view (sidescroll:story-tap) places, moves or selects.
 */
(() => {
  'use strict';
  const Story = window.SideScrollStory;
  const host = window.SideScrollStoryHost;
  const panel = document.getElementById('sidescroll-story-panel');
  if (!Story || !host || !panel) return;

  const clone = value => JSON.parse(JSON.stringify(value));
  let draft = clone(Story.load());
  let dirty = false;
  let tab = 'characters';          // 'characters' | 'marks' | 'triggers'
  let selected = null;             // {kind:'character'|'mark'|'trigger', id}
  let placeMode = null;            // {kind:'add-character', character} | {kind:'add-mark'} | {kind:'add-trigger'} | {kind:'move', target:{kind,id}}
  const TAB_OF = { character: 'characters', mark: 'marks', trigger: 'triggers' };
  let pendingCharacter = null;     // chosen in the Add character picker

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
  const characterById = id => draft.characters.find(c => c.id === id) || null;
  const markById = id => draft.marks.find(m => m.id === id) || null;
  const triggerById = id => draft.triggers.find(t => t.id === id) || null;
  const itemOf = (kind, id) => kind === 'character' ? characterById(id) : kind === 'mark' ? markById(id) : kind === 'trigger' ? triggerById(id) : null;
  const selectedItem = () => itemOf(selected?.kind, selected?.id);
  const itemX = item => item ? (Number.isFinite(item.x) ? item.x : (item.x0 + item.x1) / 2) : NaN;
  const characterChoices = () => host.characters();
  const characterName = id => characterChoices().find(c => c.id === id)?.name || id;
  const animations = id => host.animationsFor(id);
  const animationName = (id, key) => animations(id).find(a => a.key === key)?.name || key;

  // Live preview of the draft (normalised exactly as it will be saved).
  function preview() {
    host.preview({ characters: Story.normaliseCharacters({ characters: draft.characters }), marks: Story.normaliseMarks({ marks: draft.marks }),
      triggers: Story.normaliseTriggers({ triggers: draft.triggers }) });
  }
  function change(rerender = true) {
    dirty = true;
    preview();
    if (rerender) render(); else updateStatus();
  }
  function select(kind, id, focus = false) {
    selected = kind && id ? { kind, id } : null;
    if (kind) tab = TAB_OF[kind];
    host.select(selected?.kind || null, selected?.id || null);
    const item = selectedItem();
    if (focus && item) host.lookAt(itemX(item));
    render();
  }
  function setPlaceMode(mode, message) {
    placeMode = mode;
    if (mode && message) host.hint(message);
    render();
  }

  // ---- Taps in the game view ----------------------------------------------
  window.addEventListener('sidescroll:story-tap', event => {
    if (!host.active()) return;
    const { clientX, clientY } = event.detail || {};
    if (placeMode) {
      const point = host.groundPointAt(clientX, clientY);
      if (!point) { host.hint('Tap on the ground'); return; }
      const depth = Math.max(Story.LIMITS.depth[0], Math.min(Story.LIMITS.depth[1], point.z));
      const taken = new Set([...draft.characters.map(c => c.id), ...draft.marks.map(m => m.id), ...draft.triggers.map(t => t.id)]);
      if (placeMode.kind === 'add-character') {
        const id = Story.newId('wc', taken);
        const name = characterName(placeMode.character);
        draft.characters.push({ id, name, character: placeMode.character, x: point.x, depth, facing: 1, scale: 1,
          animation: 'idle', speed: 1, offset: 0, blocks: 'auto' });
        placeMode = null;
        host.hint(`Placed ${name} · choose what it does below`);
        select('character', id);
      } else if (placeMode.kind === 'add-mark') {
        const id = Story.newId('mark', taken);
        const name = `Mark ${draft.marks.length + 1}`;
        draft.marks.push({ id, name, x: point.x, depth, facing: 1 });
        placeMode = null;
        host.hint(`Placed ${name} · rename it below`);
        select('mark', id);
      } else if (placeMode.kind === 'add-trigger') {
        const id = Story.newId('trg', taken);
        const name = `Trigger ${draft.triggers.length + 1}`;
        draft.triggers.push({ id, name, kind: 'enter', x0: point.x - 1.5, x1: point.x + 1.5, once: true, reactions: [] });
        placeMode = null;
        host.hint(`Placed ${name} · add what it does below`);
        select('trigger', id);
      } else if (placeMode.kind === 'move') {
        const target = placeMode.target;
        const item = itemOf(target.kind, target.id);
        if (item && target.kind === 'trigger') { const w = item.x1 - item.x0; item.x0 = point.x - w / 2; item.x1 = point.x + w / 2; }
        else if (item) { item.x = point.x; item.depth = depth; }
        placeMode = null;
        host.hint('Moved');
        select(target.kind, target.id);
      }
      change();
      return;
    }
    const hit = host.itemAt(clientX, clientY);
    if (hit) select(hit.kind, hit.id);
    else if (selected) select(null, null);
  });

  // ---- Small controls -------------------------------------------------------
  function field(label, control, note) {
    return el('label', { class: 'sidescroll-story-field' }, el('span', { text: label }), control, note ? el('small', { text: note }) : null);
  }
  function segmented(options, value, onPick) {
    return el('div', { class: 'sidescroll-story-segmented', role: 'group' },
      options.map(([key, label]) => el('button', { type: 'button', class: key === value ? 'active' : '', 'aria-pressed': String(key === value),
        onclick: () => onPick(key) }, label)));
  }
  function slider(item, key, min, max, step, label, digits = 2, suffix = '') {
    const out = el('b', { text: `${fmt(item[key], digits)}${suffix}` });
    const input = el('input', { type: 'range', min, max, step, value: item[key] });
    input.addEventListener('input', () => { item[key] = Number(input.value); out.textContent = `${fmt(item[key], digits)}${suffix}`; change(false); });
    return el('label', { class: 'sidescroll-story-field sidescroll-story-slider' }, el('span', {}, label, ' ', out), input);
  }
  function select_(options, value, onPick) {
    const node = el('select', {}, options.map(([key, label]) => el('option', { value: key, selected: key === value }, label)));
    node.addEventListener('change', () => onPick(node.value));
    return node;
  }
  function textInput(item, key, max = 40) {
    const input = el('input', { type: 'text', value: item[key], maxlength: max });
    input.addEventListener('input', () => { item[key] = input.value; change(false); });
    input.addEventListener('change', () => render());
    return input;
  }
  function positionControls(item, kind) {
    const value = el('input', { type: 'number', step: '0.1', value: fmt(item.x, 2), inputmode: 'decimal' });
    value.addEventListener('change', () => { const n = Number(value.value); if (Number.isFinite(n)) { item.x = n; change(); } });
    const nudge = d => el('button', { type: 'button', onclick: () => { item.x = Math.round((item.x + d) * 100) / 100; change(); } }, d > 0 ? `+${d}` : `−${-d}`);
    const moving = placeMode?.kind === 'move' && placeMode.target.id === item.id;
    return [
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Along the journey (m)' }),
        el('div', { class: 'sidescroll-story-nudge' }, nudge(-1), nudge(-0.1), value, nudge(0.1), nudge(1))),
      slider(item, 'depth', -15, 8, 0.05, 'Depth (0 = path centre, + nearer)', 2, ' m'),
      el('div', { class: 'sidescroll-story-row' },
        el('button', { type: 'button', class: moving ? 'active' : '', onclick: () => setPlaceMode(moving ? null : { kind: 'move', target: { kind, id: item.id } },
          'Tap the ground where it should stand') }, moving ? 'Cancel move' : 'Move by tap'),
        el('button', { type: 'button', onclick: () => host.lookAt(item.x) }, 'Show'),
        el('button', { type: 'button', onclick: () => { item.x = Math.round(host.playerX() * 100) / 100; change(); } }, 'To view centre'))
    ];
  }

  // ---- World characters -----------------------------------------------------
  function characterEditor(wc) {
    const anims = animations(wc.character);
    const animOptions = anims.map(a => [a.key, a.name]);
    const marks = draft.marks;
    const route = wc.route || null;
    const routeTimeline = () => {
      const marksById = new Map(Story.normaliseMarks({ marks }).map(m => [m.id, m]));
      const normalised = Story.normaliseCharacters({ characters: [wc] })[0];
      if (!normalised) return null;
      const walk = host.walkSpeed(wc.character);
      const p = Story.plan(normalised, marksById, walk);
      const rows = [el('li', {}, el('b', { text: '0.0 s' }), ' starts where placed')];
      for (const s of p.segments) {
        if (s.kind === 'move') rows.push(el('li', {}, el('b', { text: `${fmt(s.t0)} s` }), ` ${animationName(wc.character, s.animation)} to ${s.mark.name} · arrives ${fmt(s.t1)} s`));
        else if (s.t1 > s.t0) rows.push(el('li', {}, el('b', { text: `${fmt(s.t0)} s` }), ` at ${s.mark.name} · ${animationName(wc.character, s.animation)} for ${fmt(s.t1 - s.t0)} s`));
      }
      rows.push(el('li', {}, el('b', { text: `${fmt(p.total)} s` }), route?.loop ? ' repeats from the first move' : ' stays there'));
      return el('ol', { class: 'sidescroll-story-timeline' }, rows);
    };
    const moveEditor = (move, index) => {
      const timing = segmented([['speed', 'Walking speed'], ['time', 'Takes…']], move.timing, v => { move.timing = v; change(); });
      const seconds = el('input', { type: 'number', min: '0.5', max: '600', step: '0.5', value: move.seconds, inputmode: 'decimal' });
      seconds.addEventListener('change', () => { move.seconds = Number(seconds.value) || 10; change(); });
      const wait = el('input', { type: 'number', min: '0', max: '600', step: '0.5', value: move.wait, inputmode: 'decimal' });
      wait.addEventListener('change', () => { move.wait = Math.max(0, Number(wait.value) || 0); change(); });
      return el('div', { class: 'sidescroll-story-move' },
        el('div', { class: 'sidescroll-story-move-head' }, el('strong', { text: `Move ${index + 1}` }),
          el('button', { type: 'button', disabled: index === 0, onclick: () => { route.moves.splice(index - 1, 0, route.moves.splice(index, 1)[0]); change(); } }, '↑'),
          el('button', { type: 'button', onclick: () => { route.moves.splice(index, 1); if (!route.moves.length) delete wc.route; change(); } }, 'Remove')),
        field('To mark', select_(marks.map(m => [m.id, m.name]), move.to, v => { move.to = v; change(); })),
        field('Animation', select_(animOptions, move.animation, v => { move.animation = v; change(); }), 'Plays at the speed it moves, so the feet keep to the ground'),
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Timing' }), timing,
          move.timing === 'time' ? el('div', { class: 'sidescroll-story-inline' }, 'arrives after', seconds, 's') : null),
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Then wait' }), el('div', { class: 'sidescroll-story-inline' }, wait, 's')),
        field('While there', select_([['', 'Its own animation'], ...animOptions], move.arriveAnimation || '', v => { if (v) move.arriveAnimation = v; else delete move.arriveAnimation; change(); })),
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Then face' }),
          segmented([['keep', 'As walking'], ['left', 'Left'], ['right', 'Right'], ['mark', 'Mark']], move.face, v => { move.face = v; change(); })));
    };
    return el('div', { class: 'sidescroll-story-editor' },
      field('Name', textInput(wc, 'name')),
      field('Character', select_(characterChoices().map(c => [c.id, c.name]), wc.character, v => { wc.character = v; change(); })),
      ...positionControls(wc, 'character'),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Facing' }),
        segmented([[-1, 'Left'], [1, 'Right']].map(([k, l]) => [String(k), l]), String(wc.facing), v => { wc.facing = Number(v); change(); })),
      slider(wc, 'scale', 0.3, 3, 0.01, 'Size (× its own)', 2),
      el('h4', { text: 'What it does' }),
      field('Animation', select_(animOptions, wc.animation, v => { wc.animation = v; change(); }), 'Loops while it stands still'),
      slider(wc, 'speed', 0.1, 4, 0.05, 'Animation speed', 2, '×'),
      slider(wc, 'offset', 0, 1, 0.01, 'Start offset (so two characters move out of step)', 2),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Blocks the player' }),
        segmented([['auto', 'Auto'], ['always', 'Always'], ['never', 'Never']], wc.blocks, v => { wc.blocks = v; change(); }),
        el('small', { text: 'Auto: blocks while it stands on the path. A blocking character can’t be walked or jumped past.' })),
      conditionEditor('Shown', wc, 'visible', 'Always'),
      el('h4', { text: 'Route' }),
      route ? el('div', {},
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Starts' }),
          segmented([['game', 'When play starts'], ['near', 'Player comes near'], ['trigger', 'From a trigger']], route.start || 'game', v => { route.start = v; change(); })),
        el('label', { class: 'sidescroll-story-check' }, el('input', { type: 'checkbox', checked: !!route.loop, onchange: e => { route.loop = e.target.checked; change(); } }), 'Repeat (from the last mark back to the first move)'),
        route.moves.map(moveEditor)) : el('p', { class: 'sidescroll-story-help', text: 'No route: it stays where it is placed.' }),
      marks.length
        ? el('button', { type: 'button', onclick: () => { (wc.route ||= { loop: false, start: 'game', moves: [] }).moves.push({ to: marks[0].id, animation: 'walk', timing: 'speed', seconds: 10, wait: 0, face: 'keep' }); change(); } }, '+ Add move to a mark')
        : el('p', { class: 'sidescroll-story-help', text: 'Add marks (Marks tab) to give it somewhere to walk to.' }),
      route ? routeTimeline() : null,
      route ? el('button', { type: 'button', onclick: () => { host.restartRoutes(); host.hint('Routes restarted'); } }, 'Restart routes') : null,
      el('div', { class: 'sidescroll-story-row sidescroll-story-danger' },
        el('button', { type: 'button', onclick: () => {
          const copy = clone(wc); copy.id = Story.newId('wc', new Set(draft.characters.map(c => c.id))); copy.name = `${wc.name} copy`; copy.x += 1.5;
          draft.characters.push(copy); select('character', copy.id); change();
        } }, 'Duplicate'),
        el('button', { type: 'button', onclick: () => {
          const uses = draft.triggers.filter(t => t.reactions.some(r => r.target === wc.id)).length;
          if (!confirm(`Remove ${wc.name} from the world?${uses ? ` Its reactions in ${uses} trigger(s) are removed too.` : ''}`)) return;
          draft.characters = draft.characters.filter(c => c.id !== wc.id);
          for (const t of draft.triggers) t.reactions = t.reactions.filter(r => r.target !== wc.id);
          select(null, null); change();
        } }, 'Delete')));
  }
  function charactersTab() {
    const choices = characterChoices();
    if (!pendingCharacter || !choices.some(c => c.id === pendingCharacter)) pendingCharacter = choices[0]?.id || null;
    const adding = placeMode?.kind === 'add-character';
    const item = selected?.kind === 'character' ? characterById(selected.id) : null;
    return [
      el('div', { class: 'sidescroll-story-list' }, draft.characters.length
        ? [...draft.characters].sort((a, b) => a.x - b.x).map(c => el('button', { type: 'button', class: item?.id === c.id ? 'active' : '',
          onclick: () => select('character', c.id, true) }, el('strong', { text: c.name }), el('small', { text: `${characterName(c.character)} · ${fmt(c.x)} m${c.route ? ' · route' : ''}` })))
        : el('p', { class: 'sidescroll-story-help', text: 'No world characters yet.' })),
      el('div', { class: 'sidescroll-story-add' },
        select_(choices.map(c => [c.id, c.name]), pendingCharacter, v => { pendingCharacter = v; }),
        el('button', { type: 'button', class: adding ? 'active' : 'primary', disabled: !pendingCharacter,
          onclick: () => setPlaceMode(adding ? null : { kind: 'add-character', character: pendingCharacter }, 'Tap the ground where the character should stand') },
          adding ? 'Cancel' : '+ Add character')),
      item ? characterEditor(item) : null
    ];
  }

  // ---- Marks ----------------------------------------------------------------
  function markEditor(mark) {
    const users = draft.characters.filter(c => c.route?.moves?.some(m => m.to === mark.id));
    return el('div', { class: 'sidescroll-story-editor' },
      field('Name', textInput(mark, 'name')),
      ...positionControls(mark, 'mark'),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Facing (when a move says “face the mark”)' }),
        segmented([['-1', 'Left'], ['1', 'Right']], String(mark.facing), v => { mark.facing = Number(v); change(); })),
      el('p', { class: 'sidescroll-story-help', text: users.length ? `Used by ${users.map(c => c.name).join(', ')}` : 'Not used by any route yet.' }),
      el('div', { class: 'sidescroll-story-row sidescroll-story-danger' },
        el('button', { type: 'button', onclick: () => {
          if (!confirm(users.length ? `Delete ${mark.name}? Moves to it are removed from ${users.length} route(s).` : `Delete ${mark.name}?`)) return;
          draft.marks = draft.marks.filter(m => m.id !== mark.id);
          for (const c of draft.characters) if (c.route) { c.route.moves = c.route.moves.filter(m => m.to !== mark.id); if (!c.route.moves.length) delete c.route; }
          select(null, null); change();
        } }, 'Delete')));
  }
  function marksTab() {
    const adding = placeMode?.kind === 'add-mark';
    const item = selected?.kind === 'mark' ? markById(selected.id) : null;
    return [
      el('p', { class: 'sidescroll-story-help', text: 'Marks are named spots characters walk between. Moving a mark moves every route through it.' }),
      el('div', { class: 'sidescroll-story-list' }, draft.marks.length
        ? [...draft.marks].sort((a, b) => a.x - b.x).map(m => el('button', { type: 'button', class: item?.id === m.id ? 'active' : '',
          onclick: () => select('mark', m.id, true) }, el('strong', { text: `◆ ${m.name}` }), el('small', { text: `${fmt(m.x)} m · depth ${fmt(m.depth)}` })))
        : el('p', { class: 'sidescroll-story-help', text: 'No marks yet.' })),
      el('button', { type: 'button', class: adding ? 'active' : 'primary',
        onclick: () => setPlaceMode(adding ? null : { kind: 'add-mark' }, 'Tap the ground to place the mark') }, adding ? 'Cancel' : '+ Add mark'),
      item ? markEditor(item) : null
    ];
  }

  // ---- Story flags -----------------------------------------------------------
  // Every flag named anywhere in the story (for suggestions).
  function knownFlags() {
    const out = new Set(Object.keys(host.progress().flags || {}));
    for (const c of draft.characters) if (c.visible?.flag) out.add(c.visible.flag);
    for (const t of draft.triggers) {
      if (t.condition?.flag) out.add(t.condition.flag);
      for (const r of t.reactions) if (r.type === 'flag' && r.flag) out.add(r.flag);
    }
    return [...out].filter(Boolean).sort();
  }
  function flagInput(value, onSet) {
    const input = el('input', { type: 'text', value: value || '', placeholder: 'flag name, e.g. met-father', list: 'sidescroll-story-flags', autocapitalize: 'none', spellcheck: 'false' });
    input.addEventListener('change', () => { input.value = Story.flagName(input.value); onSet(input.value); });
    return input;
  }
  // A {flag, when} condition at item[key]: "Always" (none) / while set / while not set.
  function conditionEditor(label, item, key, noneLabel) {
    const c = item[key];
    const mode = c ? (c.when === 'unset' ? 'unset' : 'set') : 'none';
    return el('div', { class: 'sidescroll-story-field' }, el('span', { text: label }),
      segmented([['none', noneLabel], ['set', 'While flag is set'], ['unset', 'While flag is not set']], mode, v => {
        if (v === 'none') delete item[key]; else item[key] = { flag: c?.flag || knownFlags()[0] || '', when: v };
        change();
      }),
      c ? flagInput(c.flag, v => { c.flag = v; change(); }) : null,
      c && !c.flag ? el('small', { text: 'Name a flag, or this is ignored.' }) : null);
  }

  // ---- Triggers ---------------------------------------------------------------
  const REACTION_TYPES = Object.entries(Story.REACTIONS);
  const CHARACTER_REACTIONS = ['play-once', 'set-animation', 'start-route', 'walk-to', 'face-player'];
  function newReaction(type) {
    const target = draft.characters[0]?.id || null;
    const base = { type, delay: 0 };
    if (type === 'flag') return { ...base, flag: knownFlags()[0] || 'met-father', value: true };
    if (type === 'say') return { ...base, target, text: 'Hello!', seconds: 4 };
    if (type === 'play-once') return { ...base, target, animation: 'idle', times: 1 };
    if (type === 'set-animation') return { ...base, target, animation: 'idle' };
    if (type === 'walk-to') return { ...base, target, to: draft.marks[0]?.id || null, animation: 'walk', face: 'keep' };
    if (type === 'face-player') return { ...base, target, seconds: 3 };
    return { ...base, target };
  }
  function reactionEditor(t, r, index) {
    const list = t.reactions;
    const charOptions = draft.characters.map(c => [c.id, c.name]);
    const targetSelect = (allowNone = false) => select_([...(allowNone ? [['', 'No one (narrator)']] : []), ...charOptions,
      ...(r.target && !characterById(r.target) ? [[r.target, '(removed character)']] : [])], r.target || '', v => { if (v) r.target = v; else delete r.target; change(); });
    const target = characterById(r.target);
    const anims = target ? animations(target.character).map(a => [a.key, a.name]) : [['idle', 'Idle'], ['walk', 'Walk']];
    const num = (key, min, max, step, fallback) => {
      const input = el('input', { type: 'number', min, max, step, value: r[key] ?? fallback, inputmode: 'decimal' });
      input.addEventListener('change', () => { r[key] = Math.min(max, Math.max(min, Number(input.value) || 0)); change(); });
      return input;
    };
    const rows = [];
    if (CHARACTER_REACTIONS.includes(r.type)) rows.push(field('Character', targetSelect()));
    if (r.type === 'play-once') rows.push(field('Animation', select_(anims, r.animation, v => { r.animation = v; change(); })),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Times' }), el('div', { class: 'sidescroll-story-inline' }, num('times', 1, 10, 1, 1), 'then back to what it was doing')));
    if (r.type === 'set-animation') rows.push(field('New animation', select_(anims, r.animation, v => { r.animation = v; change(); }), 'Stops its route where it is; kept for this player'));
    if (r.type === 'start-route') rows.push(el('p', { class: 'sidescroll-story-help', text: target?.route ? 'Starts its route from the beginning (set the route to start "From a trigger").' : 'This character has no route yet.' }));
    if (r.type === 'walk-to') rows.push(
      field('To mark', select_(draft.marks.map(m => [m.id, m.name]), r.to || '', v => { r.to = v; change(); })),
      field('Animation', select_(anims, r.animation, v => { r.animation = v; change(); })),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Then face' }),
        segmented([['keep', 'As walking'], ['left', 'Left'], ['right', 'Right'], ['mark', 'Mark']], r.face || 'keep', v => { r.face = v; change(); })));
    if (r.type === 'face-player') rows.push(el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'For' }),
      el('div', { class: 'sidescroll-story-inline' }, num('seconds', 0, 120, 0.5, 3), 's (0 = from then on)')));
    if (r.type === 'say') {
      const line = el('textarea', { rows: '2', maxlength: '200' });
      line.value = r.text || '';
      line.addEventListener('input', () => { r.text = line.value; change(false); });
      rows.push(field('Who speaks', targetSelect(true)), field('Line', line),
        el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Shown for' }), el('div', { class: 'sidescroll-story-inline' }, num('seconds', 1, 30, 0.5, 4), 's')));
    }
    if (r.type === 'flag') rows.push(field('Flag', flagInput(r.flag, v => { r.flag = v; change(); })),
      segmented([['set', 'Set it'], ['clear', 'Clear it']], r.value === false ? 'clear' : 'set', v => { r.value = v === 'set'; change(); }));
    return el('div', { class: 'sidescroll-story-move' },
      el('div', { class: 'sidescroll-story-move-head' }, el('strong', { text: `${index + 1}. ${Story.REACTIONS[r.type]}` }),
        el('button', { type: 'button', disabled: index === 0, onclick: () => { list.splice(index - 1, 0, list.splice(index, 1)[0]); change(); } }, '↑'),
        el('button', { type: 'button', onclick: () => { list.splice(index, 1); change(); } }, 'Remove')),
      ...rows,
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Starts' }),
        el('div', { class: 'sidescroll-story-inline' }, num('delay', 0, 120, 0.25, 0), 's after the trigger fires')));
  }
  function zoneControls(t) {
    const edge = key => {
      const input = el('input', { type: 'number', step: '0.1', value: Number(t[key]).toFixed(2), inputmode: 'decimal' });
      input.addEventListener('change', () => { const n = Number(input.value); if (Number.isFinite(n)) { t[key] = n; if (t.x1 < t.x0) [t.x0, t.x1] = [t.x1, t.x0]; change(); } });
      return input;
    };
    const shift = d => el('button', { type: 'button', onclick: () => { t.x0 += d; t.x1 += d; change(); } }, d > 0 ? `+${d}` : `−${-d}`);
    const moving = placeMode?.kind === 'move' && placeMode.target.id === t.id;
    return [
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: `Zone along the journey (${(t.x1 - t.x0).toFixed(1)} m wide)` }),
        el('div', { class: 'sidescroll-story-inline' }, 'from', edge('x0'), 'to', edge('x1'), 'm')),
      el('div', { class: 'sidescroll-story-row' }, shift(-1), shift(-0.25), shift(0.25), shift(1)),
      el('div', { class: 'sidescroll-story-row' },
        el('button', { type: 'button', class: moving ? 'active' : '', onclick: () => setPlaceMode(moving ? null : { kind: 'move', target: { kind: 'trigger', id: t.id } },
          'Tap the ground where the zone should be centred') }, moving ? 'Cancel move' : 'Move by tap'),
        el('button', { type: 'button', onclick: () => host.lookAt((t.x0 + t.x1) / 2) }, 'Show'),
        el('button', { type: 'button', onclick: () => { const w = t.x1 - t.x0, x = host.playerX(); t.x0 = x - w / 2; t.x1 = x + w / 2; change(); } }, 'To view centre'))
    ];
  }
  function triggerEditor(t) {
    let pickType = 'play-once';
    const typeSelect = select_(REACTION_TYPES, pickType, v => { pickType = v; });
    const labelInput = t.kind === 'action' ? textInput(t, 'label', 14) : null;
    return el('div', { class: 'sidescroll-story-editor' },
      field('Name', textInput(t, 'name')),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Fires when the player…' }),
        segmented([['enter', 'Walks in'], ['action', 'Presses Action in it']], t.kind, v => { t.kind = v; if (v === 'action' && !t.label) t.label = 'Talk'; change(); })),
      labelInput ? field('Action button reads', labelInput) : null,
      ...zoneControls(t),
      el('div', { class: 'sidescroll-story-field' }, el('span', { text: 'Fires' }),
        segmented([['once', 'Once per player'], ['every', 'Every time']], t.once === false ? 'every' : 'once', v => { t.once = v === 'once'; change(); })),
      conditionEditor('Only', t, 'condition', 'Always'),
      el('h4', { text: 'What happens' }),
      t.reactions.length ? t.reactions.map((r, i) => reactionEditor(t, r, i)) : el('p', { class: 'sidescroll-story-help', text: 'Nothing yet: add reactions below.' }),
      el('div', { class: 'sidescroll-story-add' }, typeSelect,
        el('button', { type: 'button', class: 'primary', onclick: () => { t.reactions.push(newReaction(pickType)); change(); } }, '+ Add')),
      el('div', { class: 'sidescroll-story-row' },
        el('button', { type: 'button', onclick: () => { preview(); host.fire(t.id); host.hint(`${t.name}: fired (flags it sets are kept until Reset story progress)`); setTimeout(render, 50); } }, 'Fire now')),
      el('div', { class: 'sidescroll-story-row sidescroll-story-danger' },
        el('button', { type: 'button', onclick: () => {
          const copy = clone(t); copy.id = Story.newId('trg', new Set(draft.triggers.map(x => x.id))); copy.name = `${t.name} copy`;
          copy.x0 += (t.x1 - t.x0) + 1; copy.x1 += (t.x1 - t.x0) + 1;
          draft.triggers.push(copy); select('trigger', copy.id); change();
        } }, 'Duplicate'),
        el('button', { type: 'button', onclick: () => {
          if (!confirm(`Delete ${t.name}?`)) return;
          draft.triggers = draft.triggers.filter(x => x.id !== t.id); select(null, null); change();
        } }, 'Delete')));
  }
  function triggersTab() {
    const adding = placeMode?.kind === 'add-trigger';
    const item = selected?.kind === 'trigger' ? triggerById(selected.id) : null;
    return [
      el('p', { class: 'sidescroll-story-help', text: 'A trigger is a zone along the path. When the player walks in (or presses Action in it) its reactions run: characters react, speak, walk; flags record what happened. Triggers don\u2019t fire while editing: use Fire now, or Done Editing and walk in.' }),
      el('div', { class: 'sidescroll-story-list' }, draft.triggers.length
        ? [...draft.triggers].sort((a, b) => a.x0 - b.x0).map(t => el('button', { type: 'button', class: item?.id === t.id ? 'active' : '',
          onclick: () => select('trigger', t.id, true) }, el('strong', { text: `⚑ ${t.name}` }),
          el('small', { text: `${t.kind === 'action' ? 'Action' : 'Walk in'} · ${fmt(t.x0)}–${fmt(t.x1)} m · ${t.reactions.length} reaction${t.reactions.length === 1 ? '' : 's'}` })))
        : el('p', { class: 'sidescroll-story-help', text: 'No triggers yet.' })),
      el('button', { type: 'button', class: adding ? 'active' : 'primary',
        onclick: () => setPlaceMode(adding ? null : { kind: 'add-trigger' }, 'Tap the path where the trigger should be') }, adding ? 'Cancel' : '+ Add trigger'),
      item ? triggerEditor(item) : null
    ];
  }
  // This device's story progress (flags, fired triggers), with a reset for testing.
  function progressBox() {
    const p = host.progress();
    const flags = Object.keys(p.flags || {}), fired = Object.keys(p.fired || {});
    return el('details', { class: 'sidescroll-story-progress' },
      el('summary', {}, `Story progress on this device · ${flags.length} flag${flags.length === 1 ? '' : 's'} set`),
      el('p', { class: 'sidescroll-story-help', text: flags.length ? `Flags: ${flags.join(', ')}` : 'No flags set.' }),
      el('p', { class: 'sidescroll-story-help', text: fired.length ? `Fired once-only triggers: ${fired.map(id => triggerById(id)?.name || id).join(', ')}` : 'No once-only trigger has fired.' }),
      el('button', { type: 'button', onclick: () => {
        if (!confirm('Reset story progress? Flags, fired triggers and what triggers changed about characters are cleared, as for a new player.')) return;
        host.resetProgress(); host.hint('Story progress reset'); render();
      } }, 'Reset story progress'));
  }

  // ---- Panel ----------------------------------------------------------------
  let statusEl = null;
  function updateStatus() {
    if (!statusEl) return;
    statusEl.textContent = dirty ? 'Unsaved changes' : 'Saved';
    statusEl.classList.toggle('dirty', dirty);
    panel.querySelector('.sidescroll-story-save')?.toggleAttribute('disabled', !dirty);
    panel.querySelector('.sidescroll-story-discard')?.toggleAttribute('disabled', !dirty);
  }
  function render() {
    if (panel.hidden) return;
    const scroll = panel.scrollTop;
    statusEl = el('span', { class: 'sidescroll-story-status' });
    panel.replaceChildren(
      el('div', { class: 'sidescroll-story-head' }, el('strong', { text: 'Story' }), statusEl),
      el('p', { class: 'sidescroll-story-help', text: 'Characters placed in the world, marks for them to walk between, and triggers that make things happen. Tap one in the view to select it; drag to look around.' }),
      segmented([['characters', `Characters (${draft.characters.length})`], ['marks', `Marks (${draft.marks.length})`],
        ['triggers', `Triggers (${draft.triggers.length})`]], tab, v => { tab = v; placeMode = null; render(); }),
      ...(tab === 'marks' ? marksTab() : tab === 'triggers' ? triggersTab() : charactersTab()),
      el('datalist', { id: 'sidescroll-story-flags' }, knownFlags().map(f => el('option', { value: f }))),
      progressBox(),
      el('div', { class: 'sidescroll-story-actions' },
        el('button', { type: 'button', class: 'sidescroll-story-discard', onclick: () => {
          if (!confirm('Discard your Story changes since the last save?')) return;
          draft = clone(Story.load()); dirty = false; placeMode = null; select(null, null); preview();
        } }, 'Discard'),
        el('button', { type: 'button', class: 'primary sidescroll-story-save', onclick: () => {
          draft = clone(Story.save(draft)); dirty = false; preview(); host.hint('Story saved'); render();
        } }, 'Save story')));
    updateStatus();
    panel.scrollTop = scroll;
  }
  // Render whenever the Story scope opens; leaving it ends any placing.
  new MutationObserver(() => {
    if (panel.hidden) { placeMode = null; host.select(null, null); }
    else { if (selected) host.select(selected.kind, selected.id); render(); }
  }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.SideScrollStoryEditor = Object.freeze({ dirty: () => dirty, draft: () => clone(draft) });
})();
