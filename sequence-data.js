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
  const ROLE_KINDS = Object.freeze({ character: 'Character', mark: 'Mark' });
  const COMPONENT_KINDS = Object.freeze({ character: 'Character', mark: 'Mark', zone: 'Zone' });
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
    control: { label: 'Control', help: 'takes control from the player, or gives it back', roles: {} }
  });
  const WHEN = Object.freeze({
    load: 'The sequence starts', enter: 'The player walks into a zone', action: 'The player presses Action in a zone',
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
  function normaliseCondition(raw) {
    const flag = flagName(raw?.flag);
    return flag ? { flag, when: raw.when === 'unset' ? 'unset' : 'set' } : null;
  }
  // {flag, when} against a player's flags; no condition is always met.
  const conditionMet = (condition, flags) => !condition?.flag || (!!flags?.[condition.flag] === (condition.when !== 'unset'));

  // ---- Events ----------------------------------------------------------------
  function normaliseStep(raw, roleKinds) {
    const def = STEPS[raw?.type];
    if (!def) return null;
    const out = { type: raw.type, with: !!raw.with };
    for (const [field, kind] of Object.entries(def.roles)) {
      const role = raw[field];
      if (typeof role === 'string' && roleKinds.get(role) === kind) out[field] = role;
    }
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
      case 'control':
        out.take = raw.take !== false;
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
    const steps = (Array.isArray(raw.steps) ? raw.steps : []).slice(0, MAX.steps).map(s => normaliseStep(s, roleKinds)).filter(Boolean);
    return { id, name: text(raw.name, 40, 'Event'), roles, steps };
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
    } else if (raw.kind === 'zone') {
      out.width = round(clamp(raw.width, 0.2, 40, 2));
      out.depth = 0;
    }
    return out;
  }
  function normaliseLine(raw, taken, componentKinds, lineIds) {
    if (!raw || typeof raw !== 'object') return null;
    const id = idOr(raw.id, ID.line, 'l', taken);
    const type = WHEN[raw.when?.type] ? raw.when.type : 'enter';
    const when = { type };
    if (type === 'enter' || type === 'action') {
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
  //  components:{"<placed id>:<component id>":{x, depth, facing, animation, hidden}}}
  function loadProgress() {
    const raw = read(PROGRESS_KEY), out = { flags: {}, fired: {}, components: {} };
    for (const [k, v] of Object.entries(raw?.flags || {})) if (v && flagName(k) === k) out.flags[k] = true;
    for (const [k, v] of Object.entries(raw?.fired || {})) if (v && /^sq-[a-z0-9]+:l-[a-z0-9]+$/.test(k)) out.fired[k] = true;
    for (const [k, v] of Object.entries(raw?.components || {})) {
      if (!/^sq-[a-z0-9]+:c-[a-z0-9]+$/.test(k) || !v || typeof v !== 'object') continue;
      const c = {};
      if (Number.isFinite(Number(v.x))) c.x = round(Number(v.x));
      if (Number.isFinite(Number(v.depth))) c.depth = round(clamp(v.depth, DEPTH[0], DEPTH[1], 0));
      if (v.facing !== undefined) c.facing = facing(v.facing);
      const a = animationKey(v.animation, null); if (a) c.animation = a;
      if (v.hidden !== undefined) c.hidden = !!v.hidden;
      out.components[k] = c;
    }
    return out;
  }
  function saveProgress(p) {
    const empty = !Object.keys(p?.flags || {}).length && !Object.keys(p?.fired || {}).length && !Object.keys(p?.components || {}).length;
    if (empty) localStorage.removeItem(PROGRESS_KEY);
    else localStorage.setItem(PROGRESS_KEY, JSON.stringify({ schema: PROGRESS_KEY, flags: p.flags, fired: p.fired, components: p.components }));
  }

  window.SideScrollSequences = Object.freeze({
    EVENTS_KEY, SEQUENCES_KEY, PROGRESS_KEY, ROLE_KINDS, COMPONENT_KINDS, STEPS, WHEN, DEPTH,
    normaliseEvents, normaliseSequences, normaliseBody, bodyOf, load, save, loadProgress, saveProgress,
    flagName, conditionMet, newId
  });
})();
