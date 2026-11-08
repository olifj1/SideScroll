/* SideScroll story: world characters and marks (window.SideScrollStory).
 * Design: docs/SEQUENCE_SYSTEM_DESIGN.md (stage 1).
 *
 * A world character is a character from the registry placed in the world (x
 * along the journey, depth = world z, 0 on the path centre, + towards the
 * camera), looping one of its animations, optionally walking a route of moves
 * between marks. A mark is a named spot (x, depth, facing). Both are content
 * (published with the Story area). Positions along a route are worked out from
 * the time since the route started, so nothing about a route is saved while
 * playing.
 *
 * Shared by the game (sidescroll.js, drawing and blocking), the Story editor
 * (story-editor.js) and later World Lab.
 */
(() => {
  'use strict';
  const CHARACTERS_KEY = 'sidescroll.story.world-characters.v1';
  const MARKS_KEY = 'sidescroll.story.marks.v1';
  const CHARACTERS_SCHEMA = 'sidescroll.story.world-characters.v1';
  const MARKS_SCHEMA = 'sidescroll.story.marks.v1';
  const CHARACTER_ID = /^wc-[a-z0-9]{4,20}$/;
  const MARK_ID = /^mark-[a-z0-9]{4,20}$/;
  const ANIMATION_KEY = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const LIMITS = Object.freeze({
    depth: [-40, 10], scale: [0.3, 3], speed: [0.1, 4], offset: [0, 1],
    seconds: [0.5, 600], wait: [0, 600]
  });
  // Auto blocking: a character stands "on the path" within this depth of its centre.
  const PATH_BLOCK_DEPTH = 1.0;
  // A route that starts "when the player comes near" starts within this distance.
  const NEAR_DISTANCE = 15;
  const BLOCKS = Object.freeze(['auto', 'always', 'never']);
  const FACES = Object.freeze(['keep', 'left', 'right', 'mark']);
  const MAX_CHARACTERS = 60, MAX_MARKS = 120, MAX_MOVES = 24;

  const finite = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  const clampTo = (v, [lo, hi], fallback) => Math.min(hi, Math.max(lo, finite(v, fallback)));
  const round = (v, step = 1000) => Math.round(v * step) / step;
  const text = (v, max, fallback = '') => {
    const s = typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '';
    return s || fallback;
  };
  const animationKey = (v, fallback) => (typeof v === 'string' && ANIMATION_KEY.test(v) ? v : fallback);
  const facing = v => (Number(v) < 0 ? -1 : 1);
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  function newId(prefix, taken) {
    for (;;) {
      const id = `${prefix}-${Math.random().toString(36).slice(2, 10).padEnd(6, '0')}`;
      if (!taken.has(id)) return id;
    }
  }

  function normaliseMove(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.to !== 'string' || !MARK_ID.test(raw.to)) return null;
    const move = {
      to: raw.to,
      animation: animationKey(raw.animation, 'walk'),
      timing: raw.timing === 'time' ? 'time' : 'speed',
      seconds: round(clampTo(raw.seconds, LIMITS.seconds, 10), 100),
      wait: round(clampTo(raw.wait, LIMITS.wait, 0), 100),
      face: FACES.includes(raw.face) ? raw.face : 'keep'
    };
    const arrive = animationKey(raw.arriveAnimation, null);
    if (arrive) move.arriveAnimation = arrive;
    return move;
  }
  function normaliseCharacter(raw, taken) {
    if (!raw || typeof raw !== 'object') return null;
    const character = text(raw.character, 60);
    if (!character) return null;
    const id = typeof raw.id === 'string' && CHARACTER_ID.test(raw.id) && !taken.has(raw.id) ? raw.id : newId('wc', taken);
    taken.add(id);
    const out = {
      id, name: text(raw.name, 40, 'Character'), character,
      x: round(finite(raw.x, 0)), depth: round(clampTo(raw.depth, LIMITS.depth, 0)), facing: facing(raw.facing),
      scale: round(clampTo(raw.scale, LIMITS.scale, 1)),
      animation: animationKey(raw.animation, 'idle'),
      speed: round(clampTo(raw.speed, LIMITS.speed, 1), 100),
      offset: round(clampTo(raw.offset, LIMITS.offset, 0), 100),
      blocks: BLOCKS.includes(raw.blocks) ? raw.blocks : 'auto'
    };
    const moves = Array.isArray(raw.route?.moves) ? raw.route.moves.map(normaliseMove).filter(Boolean).slice(0, MAX_MOVES) : [];
    if (moves.length) out.route = { loop: !!raw.route.loop, start: raw.route.start === 'near' ? 'near' : 'game', moves };
    // Kept for stage 2 (story flags): show only while a flag is / isn't set.
    if (raw.visible && typeof raw.visible.flag === 'string' && raw.visible.flag)
      out.visible = { flag: text(raw.visible.flag, 60), when: raw.visible.when === 'unset' ? 'unset' : 'set' };
    return out;
  }
  function normaliseMark(raw, taken) {
    if (!raw || typeof raw !== 'object') return null;
    const id = typeof raw.id === 'string' && MARK_ID.test(raw.id) && !taken.has(raw.id) ? raw.id : newId('mark', taken);
    taken.add(id);
    return { id, name: text(raw.name, 40, 'Mark'), x: round(finite(raw.x, 0)),
      depth: round(clampTo(raw.depth, LIMITS.depth, 0)), facing: facing(raw.facing) };
  }
  function normaliseCharacters(raw) {
    const taken = new Set();
    const list = Array.isArray(raw?.characters) ? raw.characters : [];
    return list.slice(0, MAX_CHARACTERS).map(c => normaliseCharacter(c, taken)).filter(Boolean);
  }
  function normaliseMarks(raw) {
    const taken = new Set();
    const list = Array.isArray(raw?.marks) ? raw.marks : [];
    return list.slice(0, MAX_MARKS).map(m => normaliseMark(m, taken)).filter(Boolean);
  }
  // Both lists, from saved data (or the built-in content through project-defaults.js).
  function load() {
    return { characters: normaliseCharacters(read(CHARACTERS_KEY)), marks: normaliseMarks(read(MARKS_KEY)) };
  }
  // Writes both keys; an empty list removes the key (so a device without any
  // story content of its own falls back to the built-in content).
  function save(state) {
    const characters = normaliseCharacters({ characters: state?.characters });
    const marks = normaliseMarks({ marks: state?.marks });
    const write = (key, value) => {
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    };
    write(CHARACTERS_KEY, characters.length ? { schema: CHARACTERS_SCHEMA, characters } : null);
    write(MARKS_KEY, marks.length ? { schema: MARKS_SCHEMA, marks } : null);
    return { characters, marks };
  }

  // ---- Routes -------------------------------------------------------------
  // A route plan is a list of segments from the start of the route:
  //   {kind:'move', t0, t1, from:{x,depth}, to:{x,depth}, animation, speed}
  //   {kind:'wait', t0, t1, at:{x,depth}, facing, animation}
  // walkSpeed(animation) gives the character's ground speed (m/s) for a move
  // at its normal speed. Moves to marks that no longer exist are skipped.
  function plan(character, marksById, walkSpeed, from) {
    const segments = [];
    let t = 0, at = from || { x: character.x, depth: character.depth }, face = character.facing;
    for (const move of character.route?.moves || []) {
      const mark = marksById.get(move.to);
      if (!mark) continue;
      const to = { x: mark.x, depth: mark.depth };
      const distance = Math.hypot(to.x - at.x, to.depth - at.depth);
      if (distance > 0.001) {
        const seconds = move.timing === 'time' ? move.seconds : distance / Math.max(0.05, walkSpeed(move.animation) || 1.15);
        if (Math.abs(to.x - at.x) > 0.001) face = to.x > at.x ? 1 : -1;
        segments.push({ kind: 'move', t0: t, t1: t + seconds, from: at, to, mark, animation: move.animation,
          speed: distance / seconds, facing: face });
        t += seconds;
      }
      if (move.face === 'left') face = -1;
      else if (move.face === 'right') face = 1;
      else if (move.face === 'mark') face = mark.facing;
      segments.push({ kind: 'wait', t0: t, t1: t + move.wait, at: to, mark, facing: face,
        animation: move.arriveAnimation || character.animation });
      t += move.wait;
      at = to;
    }
    return { segments, total: t, end: at, facing: face };
  }
  // Where a character is at `time` seconds after its route started (or always
  // where it was placed, without a route). `distance` is how far it has walked
  // in the current move, for matching the walk cycle to the ground.
  function stateAt(character, marksById, walkSpeed, time) {
    const still = { x: character.x, depth: character.depth, facing: character.facing,
      animation: character.animation, moving: false, distance: 0, speed: 0, segmentStart: 0 };
    if (!character.route?.moves?.length) return still;
    const first = plan(character, marksById, walkSpeed);
    if (!first.segments.length) return still;
    let current = first, t = Math.max(0, time);
    if (t >= first.total && character.route.loop) {
      // Later laps start from where the first one ended.
      const lap = plan(character, marksById, walkSpeed, first.end);
      if (lap.total > 0.01) { current = lap; t = (t - first.total) % lap.total; }
    }
    const segment = current.segments.find(s => t < s.t1) || null;
    if (!segment) {
      const last = current.segments[current.segments.length - 1];
      return { ...still, x: current.end.x, depth: current.end.depth, facing: current.facing,
        animation: last.kind === 'wait' ? last.animation : character.animation, segmentStart: last.t0 };
    }
    if (segment.kind === 'wait') {
      return { ...still, x: segment.at.x, depth: segment.at.depth, facing: segment.facing,
        animation: segment.animation, segmentStart: segment.t0 };
    }
    const k = Math.min(1, Math.max(0, (t - segment.t0) / Math.max(0.001, segment.t1 - segment.t0)));
    return { x: segment.from.x + (segment.to.x - segment.from.x) * k,
      depth: segment.from.depth + (segment.to.depth - segment.from.depth) * k,
      facing: segment.facing, animation: segment.animation, moving: true,
      distance: segment.speed * (t - segment.t0), speed: segment.speed, segmentStart: segment.t0 };
  }
  // A readable timeline of a route (for the editor): [{label, time}].
  function describeRoute(character, marksById, walkSpeed) {
    const out = [{ time: 0, label: 'Starts where placed' }];
    if (!character.route?.moves?.length) return out;
    const p = plan(character, marksById, walkSpeed);
    for (const s of p.segments) {
      const markName = s.mark.name;
      if (s.kind === 'move') out.push({ time: s.t0, label: `Leaves · ${s.animation} to ${markName} (${(s.t1 - s.t0).toFixed(1)} s)` });
      else if (s.t1 > s.t0) out.push({ time: s.t0, label: `At ${markName} · ${s.animation} for ${(s.t1 - s.t0).toFixed(1)} s` });
      else out.push({ time: s.t0, label: `At ${markName}` });
    }
    out.push({ time: p.total, label: character.route.loop ? 'Repeats from the first move' : 'Stays there' });
    return out;
  }
  // Whether a character at this depth blocks the player.
  const blocksPlayer = (character, depth = character.depth) =>
    character.blocks === 'always' || (character.blocks === 'auto' && Math.abs(depth) <= PATH_BLOCK_DEPTH);

  window.SideScrollStory = Object.freeze({
    CHARACTERS_KEY, MARKS_KEY, LIMITS, BLOCKS, FACES, NEAR_DISTANCE, PATH_BLOCK_DEPTH,
    normaliseCharacters, normaliseMarks, load, save, newId, plan, stateAt, describeRoute, blocksPlayer
  });
})();
