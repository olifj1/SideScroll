/* SideScroll sequences and events (window.SideScrollSequences).
 * Design: docs/SEQUENCE_SYSTEM_DESIGN.md (agreed 10 Nov 2026).
 *
 * Events library (sidescroll.story.events.v1): reusable chains of steps written
 * with roles (Actor, Exit…). Sequences (sidescroll.story.sequences.v1): placed in
 * the world like puzzles — an anchor x, components (library characters, marks,
 * zones) placed relative to it, and logic lines *When → run event* that fill the
 * event's roles from the components. A sequence is unique (its own body) or an
 * instance of a template (the template's body). Play progress
 * (sidescroll.player.story-progress.v2): story flags, fired once-only lines and
 * lasting changes to components.
 *
 * Shared by the game (sidescroll.js: runtime) and the editor (sequence-editor.js).
 */
(() => {
  'use strict';
  const EVENTS_KEY = 'sidescroll.story.events.v1';
  const SEQUENCES_KEY = 'sidescroll.story.sequences.v1';
  const PROGRESS_KEY = 'sidescroll.player.story-progress.v2';
  const ID = { event: /^ev-[a-z0-9]{4,20}$/, role: /^r-[a-z0-9]{4,20}$/, template: /^sqt-[a-z0-9]{4,20}$/,
    placed: /^sq-[a-z0-9]{4,20}$/, component: /^c-[a-z0-9]{4,20}$/, line: /^l-[a-z0-9]{4,20}$/ };
  const ANIMATION_KEY = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const ROLE_KINDS = Object.freeze({ character: 'Character', mark: 'Mark', object: 'Object' });
  // object: any asset (built-in prop or imported picture) standing in the sequence
  // — a chopping block, a note, the food — that events can show, hide or swap.
  const COMPONENT_KINDS = Object.freeze({ character: 'Character', mark: 'Mark', zone: 'Zone', object: 'Object', barrier: 'Barrier' });
  // Event steps. `roles` lists which fields name a role, and of which kind.
  const STEPS = Object.freeze({
    move:    { label: 'Move', help: 'walks / runs to a mark', roles: { actor: 'character', to: 'mark' } },
    animate: { label: 'Animate', help: 'plays an animation once, or switches to a new loop', roles: { actor: 'character' } },
    face:    { label: 'Face', help: 'turns to face the player, left, right or another character', roles: { actor: 'character', target: 'character' } },
    say:     { label: 'Say', help: 'says a line (subtitle)', roles: { actor: 'character' } },
    think:   { label: 'Think', help: 'the player thinks a line (thought bubble)', roles: {} },
    wait:    { label: 'Wait', help: 'waits a few seconds', roles: {} },
    flag:    { label: 'Flag', help: 'sets or clears a story flag', roles: {} },
    show:    { label: 'Show / Hide', help: 'a character appears or disappears', roles: { actor: 'character' } },
    control: { label: 'Control', help: 'takes control from the player, or gives it back', roles: {} },
    camera:  { label: 'Camera', help: 'frames a mark, a character or the player; or goes back to following the player', roles: { target: 'any' } },
    screen:  { label: 'Screen', help: 'fades to / from black, letterbox bars in / out', roles: {} },
    prompt:  { label: 'Wait for Action', help: 'waits until the player presses Action (the button shows your label)', roles: {} },
    item:    { label: 'Item', help: 'gives the player an item, or takes one', roles: {} },
    effect:  { label: 'Effect on a character', help: 'a darkness wrapping a character, or a character effect such as Dissolve; blends through its states and can hide the character', roles: { actor: 'character' } },
    prop:    { label: 'Prop', help: 'a character takes an asset in its hand (an axe), puts it away or drops it on the ground', roles: { actor: 'character' } },
    look:    { label: 'Look', help: 'changes the world\u2019s look (fog and colour) to a saved look, or back to the base look', roles: {} },
    object:  { label: 'Object', help: 'an object appears, disappears or changes to another asset (the note picked up, the food eaten)', roles: { actor: 'object' } },
    wear:    { label: 'Wear', help: 'the player puts on or takes off something worn (the bag; Asset Lab → Wear)', roles: {} }
  });
  const OBJECT_ACTIONS = Object.freeze({ show: 'Appears', hide: 'Disappears', swap: 'Changes to…' });
  const PLAYER = 'player'; // Say: the player speaks (the character being played)
  const PROP_ACTIONS = Object.freeze({ give: 'Hold it', take: 'Put it away', drop: 'Drop it', release: 'Let go' });
  // An asset name (built-in or imported): what a character holds.
  const PROP_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const propName = v => (typeof v === 'string' && PROP_NAME.test(v) ? v : '');
  const MAX_HELD = 4, MAX_DROPPED = 20;
  const SCREEN_ACTIONS = Object.freeze({ 'fade-out': 'Fade to black', 'fade-in': 'Fade in from black', 'bars-in': 'Letterbox bars in', 'bars-out': 'Letterbox bars out' });
  const WHEN = Object.freeze({
    load: 'The sequence starts', enter: 'The player walks into a zone', leave: 'The player leaves a zone', action: 'The player presses Action in a zone',
    finish: 'Another line’s event finishes', flag: 'A story flag is set'
  });
  const DEPTH = [-40, 10];
  const MAX = { events: 200, roles: 12, steps: 60, templates: 120, placed: 200, components: 40, lines: 40 };

  const finite = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  const clamp = (v, lo, hi, fallback) => Math.min(hi, Math.max(lo, finite(v, fallback)));
  const round = (v, step = 1000) => Math.round(v * step) / step;
  const text = (v, max, fallback = '') => {
    const s = typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
    return s || fallback;
  };
  const animationKey = (v, fallback) => (typeof v === 'string' && ANIMATION_KEY.test(v) ? v : fallback);
  const facing = v => (Number(v) < 0 ? -1 : 1);
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const flagName = v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  function newId(prefix, taken = new Set()) {
    for (;;) {
      const id = `${prefix}-${Math.random().toString(36).slice(2, 10).padEnd(6, '0')}`;
      if (!taken.has(id)) return id;
    }
  }
  const idOr = (raw, pattern, prefix, taken) => {
    const id = typeof raw === 'string' && pattern.test(raw) && !taken.has(raw) ? raw : newId(prefix, taken);
    taken.add(id);
    return id;
  };
  // A condition on story flags: {flag, when} (one flag, the original form) or, for several,
  // {flags:[…], match 'all'|'any', when}; when 'set' | 'unset'.
  function normaliseCondition(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const when = raw.when === 'unset' ? 'unset' : 'set';
    const list = [...new Set((Array.isArray(raw.flags) ? raw.flags : [raw.flag]).map(flagName).filter(Boolean))].slice(0, 12);
    if (!list.length) return null;
    if (list.length === 1) return { flag: list[0], when };
    return { flags: list, match: raw.match === 'any' ? 'any' : 'all', when };
  }
  const conditionFlags = condition => Array.isArray(condition?.flags) ? condition.flags : (condition?.flag ? [condition.flag] : []);
  // Against a player's flags; no condition is always met.
  function conditionMet(condition, flags) {
    const list = conditionFlags(condition);
    if (!list.length) return true;
    const want = condition.when !== 'unset', ok = f => !!flags?.[f] === want;
    return condition.match === 'any' ? list.some(ok) : list.every(ok);
  }

  // ---- Events ----------------------------------------------------------------
  // timed: the event's steps start at their own times (`at`, seconds from the
  // event's start) instead of one beat after another (`with` / `background`).
  // The editor makes every event timed; its timeline rows follow from each
  // step (who it is about), so nothing about rows is stored.
  function normaliseStep(raw, roleKinds, timed = false) {
    const def = STEPS[raw?.type];
    if (!def) return null;
    const out = { type: raw.type, with: !!raw.with };
    // Don't wait for it: the event carries on with the next step while this one
    // runs (it still ends only when this has finished too).
    if (timed) {
      out.with = false;
      out.at = Math.round(clamp(raw.at, 0, 900, 0) * 20) / 20;
    } else if (raw.background) out.background = true;
    for (const [field, kind] of Object.entries(def.roles)) {
      const role = raw[field];
      if (typeof role === 'string' && (kind === 'any' ? roleKinds.has(role) : roleKinds.get(role) === kind)) out[field] = role;
    }
    // A line can also be the player's own (no placeholder).
    if (raw.type === 'say' && raw.actor === PLAYER) out.actor = PLAYER;
    switch (raw.type) {
      case 'move':
        out.animation = animationKey(raw.animation, 'walk');
        out.timing = raw.timing === 'time' ? 'time' : 'speed';
        out.seconds = round(clamp(raw.seconds, 0.5, 600, 5), 100);
        break;
      case 'animate':
        out.animation = animationKey(raw.animation, 'idle');
        out.mode = raw.mode === 'loop' ? 'loop' : 'once';
        out.times = Math.round(clamp(raw.times, 1, 10, 1));
        break;
      case 'face':
        out.toward = ['player', 'left', 'right', 'character'].includes(raw.toward) ? raw.toward : 'player';
        break;
      case 'say': case 'think':
        out.text = text(raw.text, 200, raw.type === 'say' ? 'Hello!' : '…');
        out.seconds = round(clamp(raw.seconds, 1, 30, 3), 10);
        break;
      case 'wait':
        out.seconds = round(clamp(raw.seconds, 0.1, 120, 1), 100);
        break;
      case 'flag':
        out.flag = flagName(raw.flag);
        out.value = raw.value !== false;
        break;
      case 'show':
        out.visible = raw.visible !== false;
        break;
      case 'object':
        out.action = OBJECT_ACTIONS[raw.action] ? raw.action : 'hide';
        if (out.action === 'swap') out.asset = propName(raw.asset);
        break;
      case 'control':
        out.take = raw.take !== false;
        break;
      case 'camera':
        // shot: frame the target (a placeholder, or the player when none) with
        // offsets in metres; back: blend back to following the player.
        out.mode = raw.mode === 'back' ? 'back' : 'shot';
        out.side = round(clamp(raw.side, -20, 20, 0), 100);
        out.height = round(clamp(raw.height, -5, 10, 0), 100);
        out.distance = round(clamp(raw.distance, -20, 30, 0), 100);
        out.tilt = round(clamp(raw.tilt, -4, 4, 0), 100);
        out.seconds = round(clamp(raw.seconds, 0, 60, 2), 100);
        out.ease = raw.ease === 'linear' ? 'linear' : 'smooth';
        // keep: the shot stays after the event ends, until a later "back" step.
        if (out.mode === 'shot' && raw.keep) out.keep = true;
        break;
      case 'prompt':
        out.label = text(raw.label, 14, 'Talk');
        break;
      case 'wear':
        // The player puts on / takes off a wearable asset (Progress → Reset on this sequence undoes it).
        out.action = raw.action === 'off' ? 'off' : 'on';
        out.asset = propName(raw.asset);
        break;
      case 'item':
        // Items given are tagged with the sequence (Progress → Reset takes them back).
        out.item = text(raw.item, 60, 'forest-key');
        out.count = Math.round(clamp(raw.count, 1, 20, 1));
        out.give = raw.give !== false;
        break;
      case 'effect': {
        // An effect asset (Asset Lab → + New effect) attached to the actor: it starts
        // invisible, blends to each key's state over its seconds ('gone' = invisible),
        // and the actor is hidden hideAt s after it starts (-1 = never).
        out.asset = typeof raw.asset === 'string' && /^asset-[a-z0-9]+-[a-z0-9]+$/.test(raw.asset) ? raw.asset : '';
        out.delay = round(clamp(raw.delay, 0, 30, 0), 100);
        out.size = round(clamp(raw.size, 0.3, 4, 1.4), 100);
        out.hideAt = round(clamp(raw.hideAt, -1, 60, -1), 100);
        out.keys = (Array.isArray(raw.keys) ? raw.keys : []).slice(0, 12).map(k => ({
          state: typeof k?.state === 'string' && /^(gone|st-[a-z0-9]{4,20})$/.test(k.state) ? k.state : 'gone',
          seconds: round(clamp(k?.seconds, 0, 20, 0.5), 100) }));
        break;
      }
      case 'prop':
        // Which asset, and whether the actor takes it in hand, puts it away, drops it (it
        // falls and lies there) or lets go (it stays where the hand left it); play progress
        // keeps where.
        out.asset = propName(raw.asset);
        out.action = PROP_ACTIONS[raw.action] ? raw.action : 'give';
        break;
      case 'look':
        // A saved look (Menu → Looks) or '' = the base look; blends over `seconds`.
        // It stays until another Look step changes it (kept in play progress).
        out.look = typeof raw.look === 'string' && /^look-[a-z0-9]{4,20}$/.test(raw.look) ? raw.look : '';
        out.seconds = round(clamp(raw.seconds, 0, 30, 2), 100);
        break;
      case 'screen':
        out.action = SCREEN_ACTIONS[raw.action] ? raw.action : 'fade-out';
        out.seconds = round(clamp(raw.seconds, 0, 10, 1), 100);
        break;
    }
    return out;
  }
  function normaliseEvent(raw, taken) {
    if (!raw || typeof raw !== 'object') return null;
    const id = idOr(raw.id, ID.event, 'ev', taken);
    const roleIds = new Set(), roles = [];
    for (const r of (Array.isArray(raw.roles) ? raw.roles : []).slice(0, MAX.roles)) {
      if (!r || !ROLE_KINDS[r.kind]) continue;
      roles.push({ id: idOr(r.id, ID.role, 'r', roleIds), name: text(r.name, 30, ROLE_KINDS[r.kind]), kind: r.kind });
    }
    const roleKinds = new Map(roles.map(r => [r.id, r.kind]));
    const timed = raw.timed === true;
    const steps = (Array.isArray(raw.steps) ? raw.steps : []).slice(0, MAX.steps).map(s => normaliseStep(s, roleKinds, timed)).filter(Boolean);
    return { id, name: text(raw.name, 40, 'Event'), ...(timed ? { timed: true } : {}), roles, steps };
  }
  function normaliseEvents(raw) {
    const taken = new Set();
    return (Array.isArray(raw?.events) ? raw.events : []).slice(0, MAX.events).map(e => normaliseEvent(e, taken)).filter(Boolean);
  }

  // ---- Sequences ---------------------------------------------------------------
  function normaliseComponent(raw, taken) {
    if (!raw || !COMPONENT_KINDS[raw.kind]) return null;
    const out = { id: idOr(raw.id, ID.component, 'c', taken), kind: raw.kind, name: text(raw.name, 30, COMPONENT_KINDS[raw.kind]),
      dx: round(clamp(raw.dx, -200, 200, 0)), depth: round(clamp(raw.depth, DEPTH[0], DEPTH[1], 0)), facing: facing(raw.facing) };
    if (raw.kind === 'character') {
      out.character = text(raw.character, 60);
      if (!out.character) return null;
      out.animation = animationKey(raw.animation, 'idle');
      out.scale = round(clamp(raw.scale, 0.3, 3, 1));
      out.blocks = ['auto', 'always', 'never'].includes(raw.blocks) ? raw.blocks : 'auto';
      // Assets it holds from the start (hand and grip: Character Lab → Props).
      const holding = [...new Set((Array.isArray(raw.holding) ? raw.holding : []).map(propName).filter(Boolean))].slice(0, MAX_HELD);
      if (holding.length) out.holding = holding;
    } else if (raw.kind === 'zone') {
      out.width = round(clamp(raw.width, 0.2, 40, 2));
      out.depth = 0;
    } else if (raw.kind === 'barrier') {
      // An invisible wall across the path: the player can't walk through it while `active` is met
      // (none = always); `say` is what the player thinks on walking into it.
      out.depth = 0;
      const active = normaliseCondition(raw.active);
      if (active) out.active = active;
      const say = text(raw.say, 120);
      if (say) out.say = say;
    } else if (raw.kind === 'object') {
      out.asset = propName(raw.asset);
      if (!out.asset) return null;
      out.size = round(clamp(raw.size, 0.1, 5, 1), 100);  // × the asset's game height
      out.lift = round(clamp(raw.lift, 0, 10, 0), 100);   // metres above the ground (a note on the mantelpiece)
      out.rotate = round(clamp(raw.rotate, -180, 180, 0), 10); // degrees about its centre, + = clockwise
      if (raw.startHidden) out.startHidden = true;        // hidden until an Object step shows it
      const takeWhen = normaliseCondition(raw.takeWhen);    // can only be picked up / put on while this holds
      if (takeWhen) out.takeWhen = takeWhen;
      const notYet = text(raw.notYet, 160); if (notYet) out.notYet = notYet; // what the player thinks until then
    }
    return out;
  }
  function normaliseLine(raw, taken, componentKinds, lineIds) {
    if (!raw || typeof raw !== 'object') return null;
    const id = idOr(raw.id, ID.line, 'l', taken);
    const type = WHEN[raw.when?.type] ? raw.when.type : 'enter';
    const when = { type };
    if (type === 'enter' || type === 'leave' || type === 'action') {
      if (componentKinds.get(raw.when.zone) === 'zone') when.zone = raw.when.zone;
      if (type === 'action') when.label = text(raw.when.label, 14, 'Talk');
    } else if (type === 'finish') {
      if (typeof raw.when.line === 'string' && ID.line.test(raw.when.line)) when.line = raw.when.line;
    } else if (type === 'flag') {
      const f = flagName(raw.when.flag); if (f) when.flag = f;
    }
    const out = { id, when, event: typeof raw.event === 'string' && ID.event.test(raw.event) ? raw.event : null,
      roles: {}, once: raw.once !== false };
    for (const [role, comp] of Object.entries(raw.roles && typeof raw.roles === 'object' ? raw.roles : {}))
      if (ID.role.test(role) && componentKinds.has(comp)) out.roles[role] = comp;
    const condition = normaliseCondition(raw.condition);
    if (condition) out.condition = condition;
    return out;
  }
  function normaliseBody(raw) {
    const compIds = new Set(), lineIds = new Set();
    const components = (Array.isArray(raw?.components) ? raw.components : []).slice(0, MAX.components)
      .map(c => normaliseComponent(c, compIds)).filter(Boolean);
    const kinds = new Map(components.map(c => [c.id, c.kind]));
    const logic = (Array.isArray(raw?.logic) ? raw.logic : []).slice(0, MAX.lines).map(l => normaliseLine(l, lineIds, kinds)).filter(Boolean);
    return { components, logic };
  }
  function normaliseSequences(raw) {
    const tTaken = new Set(), pTaken = new Set();
    const templates = (Array.isArray(raw?.templates) ? raw.templates : []).slice(0, MAX.templates).filter(t => t && typeof t === 'object')
      .map(t => ({ id: idOr(t.id, ID.template, 'sqt', tTaken), name: text(t.name, 40, 'Sequence'), body: normaliseBody(t.body) }));
    const templateIds = new Set(templates.map(t => t.id));
    const placed = (Array.isArray(raw?.placed) ? raw.placed : []).slice(0, MAX.placed).filter(p => p && typeof p === 'object').map(p => {
      const out = { id: idOr(p.id, ID.placed, 'sq', pTaken), name: text(p.name, 40, 'Sequence'), x: round(finite(p.x, 0)) };
      if (typeof p.template === 'string' && templateIds.has(p.template)) out.template = p.template;
      else out.body = normaliseBody(p.body);
      return out;
    });
    return { templates, placed };
  }
  // The body (components + logic) a placed sequence uses.
  const bodyOf = (state, placed) => placed.template ? (state.templates.find(t => t.id === placed.template)?.body || { components: [], logic: [] }) : placed.body;

  function load() {
    return { events: normaliseEvents(read(EVENTS_KEY)), ...normaliseSequences(read(SEQUENCES_KEY)) };
  }
  // Writes both keys; empty libraries remove the key (back to built-in content).
  function save(state) {
    const events = normaliseEvents({ events: state?.events });
    const seq = normaliseSequences({ templates: state?.templates, placed: state?.placed });
    const write = (key, value) => { if (value) localStorage.setItem(key, JSON.stringify(value)); else localStorage.removeItem(key); };
    write(EVENTS_KEY, events.length ? { schema: EVENTS_KEY, events } : null);
    write(SEQUENCES_KEY, seq.templates.length || seq.placed.length ? { schema: SEQUENCES_KEY, ...seq } : null);
    return { events, ...seq };
  }

  // ---- Play progress -----------------------------------------------------------
  // {flags:{name:true}, fired:{"<placed id>:<line id>":true},
  //  components:{"<placed id>:<component id>":{x, depth, facing, animation, hidden,
  //    holding:[asset], dropped:[{asset, x, z, rot, flip, w, h, stay?:{y, z}}]}} (props: Prop step; stay = Let go),
  //  taken:{"<placed id>":{item id: count}} — items its events took from the player,
  //  look:{id, by} — the look a Look step set (by = placed sequence id); none = base,
  //  running:{"<placed id>:<line id>":true} — lines whose event has taken control and not
  //    finished; if the game closes first, the next start finishes them (as a Skip)}
  function loadProgress() {
    const raw = read(PROGRESS_KEY), out = { flags: {}, fired: {}, components: {}, taken: {} };
    if (raw?.look && /^look-[a-z0-9]{4,20}$/.test(raw.look.id || '')) out.look = { id: raw.look.id, by: /^sq-[a-z0-9]+$/.test(raw.look.by || '') ? raw.look.by : null };
    for (const [k, v] of Object.entries(raw?.taken || {})) {
      if (!/^sq-[a-z0-9]+$/.test(k) || !v || typeof v !== 'object') continue;
      const items = {};
      for (const [item, n] of Object.entries(v)) if (Number(n) > 0) items[text(item, 60)] = Math.round(Number(n));
      if (Object.keys(items).length) out.taken[k] = items;
    }
    for (const [k, v] of Object.entries(raw?.flags || {})) if (v && flagName(k) === k) out.flags[k] = true;
    for (const [k, v] of Object.entries(raw?.fired || {})) if (v && /^sq-[a-z0-9]+:l-[a-z0-9]+$/.test(k)) out.fired[k] = true;
    for (const [k, v] of Object.entries(raw?.running || {})) if (v && /^sq-[a-z0-9]+:l-[a-z0-9]+$/.test(k)) (out.running ||= {})[k] = true;
    for (const [k, v] of Object.entries(raw?.components || {})) {
      if (!/^sq-[a-z0-9]+:c-[a-z0-9]+$/.test(k) || !v || typeof v !== 'object') continue;
      const c = {};
      if (Number.isFinite(Number(v.x))) c.x = round(Number(v.x));
      if (Number.isFinite(Number(v.depth))) c.depth = round(clamp(v.depth, DEPTH[0], DEPTH[1], 0));
      if (v.facing !== undefined) c.facing = facing(v.facing);
      const a = animationKey(v.animation, null); if (a) c.animation = a;
      if (v.hidden !== undefined) c.hidden = !!v.hidden;
      // Props: what it holds now (a Prop step changed it) and what it dropped.
      if (Array.isArray(v.holding)) c.holding = [...new Set(v.holding.map(propName).filter(Boolean))].slice(0, MAX_HELD);
      if (Array.isArray(v.dropped)) {
        const dropped = v.dropped.slice(0, MAX_DROPPED).filter(d => propName(d?.asset) && [d.x, d.z, d.rot, d.w, d.h].every(n => Number.isFinite(Number(n))))
          .map(d => ({ asset: d.asset, x: round(Number(d.x)), z: round(clamp(d.z, DEPTH[0], DEPTH[1], 0)), rot: round(Number(d.rot)), flip: !!d.flip,
            w: round(clamp(d.w, 0.01, 20, 1)), h: round(clamp(d.h, 0.01, 20, 1)),
            // Let go: where it was left in the hand (height and drawn depth), so it stays put.
            ...(d.stay && Number.isFinite(Number(d.stay.y)) && Number.isFinite(Number(d.stay.z)) ? { stay: { y: round(Number(d.stay.y)), z: round(Number(d.stay.z)) } } : {}) }));
        if (dropped.length) c.dropped = dropped;
      }
      out.components[k] = c;
    }
    return out;
  }
  function saveProgress(p) {
    const empty = !Object.keys(p?.flags || {}).length && !Object.keys(p?.fired || {}).length && !Object.keys(p?.components || {}).length
      && !Object.keys(p?.taken || {}).length && !p?.look && !Object.keys(p?.running || {}).length;
    if (empty) localStorage.removeItem(PROGRESS_KEY);
    else localStorage.setItem(PROGRESS_KEY, JSON.stringify({ schema: PROGRESS_KEY, flags: p.flags, fired: p.fired, components: p.components, taken: p.taken || {},
      ...(p.look ? { look: p.look } : {}), ...(Object.keys(p.running || {}).length ? { running: p.running } : {}) }));
  }

  window.SideScrollSequences = Object.freeze({
    EVENTS_KEY, SEQUENCES_KEY, PROGRESS_KEY, ROLE_KINDS, COMPONENT_KINDS, STEPS, OBJECT_ACTIONS, WHEN, DEPTH, SCREEN_ACTIONS, PROP_ACTIONS, PLAYER,
    normaliseEvents, normaliseSequences, normaliseBody, bodyOf, load, save, loadProgress, saveProgress,
    flagName, conditionMet, conditionFlags, normaliseCondition, newId
  });
})();
