// story-flow.js — what the Story editor's flow views show, worked out from the saved logic
// (docs/STORY_EDITOR_UX_PLAN.md → Sequence flow view, stages 3, 5 and 6). Pure functions, no DOM,
// nothing stored: the flow, the flags overview and the story map are views of the same data.
//
//   sequenceGraph(body, ctx)   one sequence: triggers → event boxes (one per logic line) → flags,
//                              flags → lines that wait for them, dashed "only while" / waiters.
//   layout(graph, sizes)       columns in order of action (longest path; loops become return
//                              arrows), rows per thread (start first, then zones along the path).
//   flagIndex(story, ctx)      every flag: where it is set (Flag steps, Inspect / take) and read.
//   storyGraph(story, ctx)     every placed sequence along the journey, with flag links between.
(() => {
  'use strict';
  const Seq = window.SideScrollSequences;
  const condFlags = c => (Seq?.conditionFlags ? Seq.conditionFlags(c) : []).filter(Boolean);

  // ---- One sequence ------------------------------------------------------------------
  // ctx: { events: Map|Array, interactions: {asset: entry}, x(component) → metres along the
  //        path, readElsewhere(flag) → bool, setElsewhere(flag) → bool }
  function sequenceGraph(body, ctx = {}) {
    const events = ctx.events instanceof Map ? ctx.events : new Map((ctx.events || []).map(e => [e.id, e]));
    const nodes = new Map(), edges = [];
    const comp = id => body.components.find(c => c.id === id);
    const add = (id, node) => { if (!nodes.has(id)) nodes.set(id, { id, ...node }); return nodes.get(id); };
    const edge = (from, to, kind, extra = {}) => { if (from && to && !edges.some(e => e.from === from && e.to === to && e.kind === kind)) edges.push({ from, to, kind, ...extra }); };
    const xOf = c => (c && ctx.x ? ctx.x(c) : c?.dx ?? 0);
    const flagNode = f => add(`f:${f}`, { kind: 'flag', flag: f });

    // Triggers the player sets off (shared when several lines use the same one).
    const triggerOf = l => {
      const w = l.when || { type: 'load' };
      if (w.type === 'load') return add('t:load', { kind: 'trigger', when: 'load', order: -1e9 });
      if (w.type === 'enter' || w.type === 'leave' || w.type === 'action') {
        const z = comp(w.zone);
        const id = `t:${w.type}:${w.zone || '-'}:${w.type === 'action' ? (w.label || 'Action') : ''}`;
        return add(id, { kind: 'trigger', when: w.type, zone: z?.id || null, zoneName: z?.name || '', label: w.label || 'Action',
          x: z ? xOf(z) : null, order: z ? xOf(z) : 1e8 });
      }
      return null; // flag / finish lines are fed by other nodes
    };
    body.logic.forEach((l, i) => {
      const e = events.get(l.event) || null;
      const roles = (e?.roles || []).map(r => ({ name: r.name, kind: r.kind, filled: !!comp(l.roles?.[r.id]), as: comp(l.roles?.[r.id])?.name || '' }));
      add(`l:${l.id}`, { kind: 'event', line: l.id, index: i, event: e?.id || null, name: e?.name || '', every: l.once === false,
        missing: !e || roles.some(r => !r.filled) || ((l.when?.type === 'enter' || l.when?.type === 'leave' || l.when?.type === 'action') && !comp(l.when.zone)),
        roles });
    });
    body.logic.forEach(l => {
      const me = `l:${l.id}`, w = l.when || { type: 'load' };
      const t = triggerOf(l);
      if (t) edge(t.id, me, 'run');
      else if (w.type === 'flag' && w.flag) edge(flagNode(w.flag).id, me, 'when');
      else if (w.type === 'finish' && nodes.has(`l:${w.line}`)) edge(`l:${w.line}`, me, 'finish');
      for (const f of condFlags(l.condition)) edge(flagNode(f).id, me, 'only', { unset: l.condition?.when === 'unset' });
      const e = events.get(l.event);
      for (const s of e?.steps || []) if (s.type === 'flag' && s.flag) edge(me, flagNode(s.flag).id, s.value ? 'sets' : 'clears');
    });
    // The player's own actions on this sequence's objects (Asset Lab → Interactions) can set flags.
    for (const c of body.components) {
      if (c.kind === 'object' && c.asset) {
        const entry = ctx.interactions?.[c.asset] || {};
        for (const [action, a] of Object.entries(entry)) if (a?.flag) {
          const id = `t:${action}:${c.id}`;
          add(id, { kind: 'trigger', when: action, zone: c.id, zoneName: c.name, x: xOf(c), order: xOf(c) + 0.001 });
          edge(id, flagNode(a.flag).id, 'sets');
        }
      }
    }
    // What waits for a flag: barriers (Blocks …) and objects (Can be taken …).
    for (const c of body.components) {
      const fl = c.kind === 'barrier' ? condFlags(c.active) : c.kind === 'object' ? condFlags(c.takeWhen) : [];
      if (!fl.length) continue;
      add(`w:${c.id}`, { kind: 'wait', component: c.id, what: c.kind, name: c.name, x: xOf(c) });
      for (const f of fl) edge(flagNode(f).id, `w:${c.id}`, 'waits');
    }
    // Flags: set here, or only read here (set elsewhere), and whether others read them.
    for (const n of nodes.values()) if (n.kind === 'flag') {
      n.setHere = edges.some(e => e.to === n.id && (e.kind === 'sets' || e.kind === 'clears'));
      n.elsewhere = !n.setHere || !!ctx.setElsewhere?.(n.flag);
      n.readElsewhere = !!ctx.readElsewhere?.(n.flag);
    }
    return { nodes: [...nodes.values()], edges };
  }

  // ---- Layout: order of action -------------------------------------------------------
  const SIZES = { trigger: [150, 56], event: [190, 70], flag: [140, 48], wait: [140, 48], seq: [170, 64] };
  // Edges that decide the order (dashed "only while" ones don't).
  const RANKS = new Set(['run', 'sets', 'clears', 'when', 'finish', 'waits', 'link']);
  function layout(graph, opts = {}) {
    const sizes = { ...SIZES, ...(opts.sizes || {}) };
    const gapX = opts.gapX ?? 54, gapY = opts.gapY ?? 22, padX = opts.padX ?? 24, padY = opts.padY ?? 24;
    const byId = new Map(graph.nodes.map(n => [n.id, n]));
    const out = new Map(graph.nodes.map(n => [n.id, []]));
    const incoming = new Map(graph.nodes.map(n => [n.id, 0]));
    for (const e of graph.edges) if (RANKS.has(e.kind) && byId.has(e.from) && byId.has(e.to)) { out.get(e.from).push(e); incoming.set(e.to, incoming.get(e.to) + 1); }
    // Roots: what needs nothing else, in the order the player meets it (start, then along the path).
    const rootRank = n => (n.kind === 'trigger' ? 0 : n.kind === 'flag' ? 1 : 2);
    const roots = graph.nodes.filter(n => !incoming.get(n.id))
      .sort((a, b) => rootRank(a) - rootRank(b) || (a.order ?? 0) - (b.order ?? 0) || String(a.id).localeCompare(String(b.id)));
    // Depth-first from the roots: edges back to a node still on the path are loops.
    const state = new Map(), back = new Set(), thread = new Map(), post = [];
    const visit = (id, t) => {
      state.set(id, 1);
      if (!thread.has(id)) thread.set(id, t);
      for (const e of out.get(id)) {
        if (state.get(e.to) === 1) back.add(e);
        else if (!state.has(e.to)) visit(e.to, t);
      }
      state.set(id, 2); post.push(id);
    };
    let threads = 0;
    for (const r of roots) if (!state.has(r.id)) visit(r.id, threads++);
    // Anything only reachable through a loop (a cycle with no way in): start its own thread.
    for (const n of graph.nodes) if (!state.has(n.id)) visit(n.id, threads++);
    // Columns: longest path over the forward edges.
    const col = new Map(graph.nodes.map(n => [n.id, 0]));
    for (const id of post.reverse()) for (const e of out.get(id)) if (!back.has(e)) col.set(e.to, Math.max(col.get(e.to), col.get(id) + 1));
    // Rows: each thread is a band; nodes of one thread in one column stack inside it.
    const order = new Map(post.map((id, i) => [id, i]));
    const cells = new Map();
    for (const n of graph.nodes) {
      const key = `${thread.get(n.id)}:${col.get(n.id)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(n.id);
    }
    const bandRows = new Array(threads).fill(1);
    for (const [key, ids] of cells) {
      ids.sort((a, b) => (byId.get(a).order ?? 0) - (byId.get(b).order ?? 0) || order.get(b) - order.get(a));
      const t = Number(key.split(':')[0]); bandRows[t] = Math.max(bandRows[t], ids.length);
    }
    const rowH = Math.max(...Object.values(sizes).map(s => s[1])) + gapY;
    const bandTop = []; let r = 0;
    for (let t = 0; t < threads; t++) { bandTop[t] = r; r += bandRows[t]; }
    const cols = Math.max(0, ...col.values()) + 1;
    const colW = new Array(cols).fill(0);
    for (const n of graph.nodes) colW[col.get(n.id)] = Math.max(colW[col.get(n.id)], sizes[n.kind]?.[0] || 120);
    const colX = []; let x = padX;
    for (let c = 0; c < cols; c++) { colX[c] = x; x += colW[c] + gapX; }
    const pos = new Map();
    for (const [key, ids] of cells) {
      const [t, c] = key.split(':').map(Number);
      ids.forEach((id, k) => {
        const n = byId.get(id), [w, h] = sizes[n.kind] || [120, 48];
        const row = bandTop[t] + k;
        pos.set(id, { x: colX[c] + (colW[c] - w) / 2, y: padY + row * rowH + (rowH - gapY - h) / 2, w, h, col: c, row, thread: t });
      });
    }
    const width = x - gapX + padX, rowsUsed = Math.max(1, r);
    const bottom = padY + rowsUsed * rowH;
    // Arrows: straight within a row to the next column; otherwise through the gaps between
    // columns and the channels between rows, never through a box. Loops run under everything.
    let loopLane = 0;
    const lanes = new Map();
    const paths = graph.edges.filter(e => pos.has(e.from) && pos.has(e.to)).map(e => {
      const a = pos.get(e.from), b = pos.get(e.to);
      const sy = a.y + a.h / 2, ty = b.y + b.h / 2, sx = a.x + a.w, tx = b.x;
      const loop = back.has(e) || b.col <= a.col;
      const lane = k => { const n = lanes.get(k) || 0; lanes.set(k, n + 1); return n; };
      if (loop) {
        const y = bottom + 10 + 9 * loopLane++;
        const gx = colX[a.col] + colW[a.col] + 10 + 4 * lane(`g${a.col}`);
        const gx2 = colX[b.col] - 14 - 4 * lane(`h${b.col}`);
        return { ...e, loop: true, d: `M${sx} ${sy} H${gx} V${y} H${gx2} V${ty} H${tx}` };
      }
      if (a.row === b.row && b.col === a.col + 1) return { ...e, d: `M${sx} ${sy} H${tx}` };
      const gx = colX[a.col] + colW[a.col] + 10 + 4 * lane(`g${a.col}`);
      if (b.col === a.col + 1) return { ...e, d: `M${sx} ${sy} H${gx} V${ty} H${tx}` };
      const chan = padY + b.row * rowH - gapY / 2 + (b.row === 0 ? gapY / 2 - 6 : 0) - 3 * lane(`c${b.row}`);
      const gx2 = colX[b.col] - 14 - 4 * lane(`h${b.col}`);
      return { ...e, d: `M${sx} ${sy} H${gx} V${chan} H${gx2} V${ty} H${tx}` };
    });
    return { pos, paths, width: Math.max(width, 200), height: bottom + 16 + 9 * loopLane, cols, rows: rowsUsed };
  }

  // ---- Flags: where each is set and read ----------------------------------------------
  // story: {events, templates, placed}; ctx: {interactions, bodyOf(placed)}.
  // → Map flag → {sets:[…], reads:[…]} with plain records the editor turns into links.
  function flagIndex(story, ctx = {}) {
    const map = new Map();
    const get = f => { if (!map.has(f)) map.set(f, { flag: f, sets: [], reads: [] }); return map.get(f); };
    const bodyOf = ctx.bodyOf || (p => p.body);
    const eventsById = new Map((story.events || []).map(e => [e.id, e]));
    // Which placed sequences run each event (so a Flag step's flag is "set in" those sequences).
    const runners = new Map();
    for (const p of story.placed || []) {
      const b = bodyOf(p); if (!b) continue;
      for (const l of b.logic) if (l.event) { if (!runners.has(l.event)) runners.set(l.event, []); runners.get(l.event).push({ placed: p.id, line: l.id }); }
    }
    for (const e of story.events || []) e.steps.forEach((s, i) => {
      if (s.type === 'flag' && s.flag) get(s.flag).sets.push({ type: 'step', event: e.id, step: i, value: !!s.value, runIn: runners.get(e.id) || [] });
    });
    for (const [asset, entry] of Object.entries(ctx.interactions || {})) for (const [action, a] of Object.entries(entry || {})) if (a?.flag) get(a.flag).sets.push({ type: 'interaction', asset, action });
    for (const p of story.placed || []) {
      const b = bodyOf(p); if (!b) continue;
      for (const l of b.logic) {
        if (l.when?.type === 'flag' && l.when.flag) get(l.when.flag).reads.push({ type: 'when', placed: p.id, line: l.id });
        for (const f of condFlags(l.condition)) get(f).reads.push({ type: 'only', placed: p.id, line: l.id, unset: l.condition?.when === 'unset' });
      }
      for (const c of b.components) {
        if (c.kind === 'barrier') for (const f of condFlags(c.active)) get(f).reads.push({ type: 'barrier', placed: p.id, component: c.id });
        if (c.kind === 'object') for (const f of condFlags(c.takeWhen)) get(f).reads.push({ type: 'take', placed: p.id, component: c.id });
      }
    }
    for (const v of map.values()) v.orphan = !v.sets.length ? 'never set' : !v.reads.length ? 'never read' : '';
    void eventsById;
    return map;
  }

  // ---- The whole story: sequences along the journey, linked by flags ------------------------
  // A link A → B for each flag that A sets (an event its lines run, or its objects' Inspect / take)
  // and B reads (a line's When / Only, a barrier, an object's Can be taken).
  function storyGraph(story, ctx = {}) {
    const index = flagIndex(story, ctx);
    const bodyOf = ctx.bodyOf || (p => p.body);
    const placed = (story.placed || []).slice().sort((a, b) => a.x - b.x);
    const nodes = placed.map((p, i) => ({ id: `s:${p.id}`, kind: 'seq', placed: p.id, name: p.name, x: p.x, order: i,
      lines: bodyOf(p)?.logic.length || 0 }));
    const setters = new Map(); // flag → Set(placed ids)
    const objectAssets = new Map(placed.map(p => [p.id, new Set((bodyOf(p)?.components || []).filter(c => c.kind === 'object').map(c => c.asset))]));
    for (const [f, v] of index) {
      const who = new Set();
      for (const s of v.sets) {
        if (s.type === 'step') for (const r of s.runIn) who.add(r.placed);
        if (s.type === 'interaction') for (const [pid, assets] of objectAssets) if (assets.has(s.asset)) who.add(pid);
      }
      setters.set(f, who);
    }
    const links = new Map(); // "a>b" → flags
    let world = false;
    for (const [f, v] of index) for (const r of v.reads) {
      const from = setters.get(f) || new Set();
      if (!from.size) { world = world || v.sets.some(s => s.type === 'interaction'); }
      for (const a of from) if (a !== r.placed) {
        const k = `${a}>${r.placed}`;
        if (!links.has(k)) links.set(k, new Set());
        links.get(k).add(f);
      }
    }
    const edges = [...links].map(([k, flags]) => { const [a, b] = k.split('>'); return { from: `s:${a}`, to: `s:${b}`, kind: 'link', flags: [...flags].sort() }; });
    // Flags read somewhere but set by nothing in the story (or only by assets in the world).
    const loose = [...index.values()].filter(v => v.reads.length && !(setters.get(v.flag)?.size)).map(v => v.flag).sort();
    return { nodes, edges, loose, world, index };
  }

  window.SideScrollStoryFlow = Object.freeze({ sequenceGraph, layout, flagIndex, storyGraph, SIZES });
})();
