/* SideScroll near-side dressing rows (window.SideScrollNearRows).
 * A biome profile may replace the scattered near-side dressing (between the
 * camera and the path) with three rows. Each row is a line at a depth from the
 * path centre that follows the path; items are placed along it at a spacing,
 * with a random ± on depth, size and spacing, chosen from the row's textures.
 * Stored in the biome profile (sidescroll.biomes.v1 → profiles[biome][id].nearRows),
 * so it publishes with World content and blends between profiles like density.
 * Shared by the game (sidescroll.js) and World Lab (which must keep it on save).
 */
(() => {
  'use strict';
  const TEXTURES = Object.freeze(['ground01','ground02','ground03','ground04','ground05','ground06',
    'ground07','ground08','ground09','ground10','ground11','ground12']);
  // Value limits (metres from the path centre / multiples of a texture's normal size).
  const LIMITS = Object.freeze({
    depth:[2.6,10.4], depthJitter:[0,3], scale:[0.2,2.5], scaleJitter:[0,1.2],
    spacing:[0.4,8], spacingJitter:[0,4]
  });
  // Roughly today's scattered near side: an edge row just off the path of the
  // small clumps, a middle row of everything, and a sparser outer row.
  const DEFAULT_ROWS = Object.freeze([
    {label:'Edge', on:true, depth:3.0, depthJitter:0.45, scale:1.0, scaleJitter:0.12, spacing:1.2, spacingJitter:0.5,
      textures:['ground01','ground05','ground09','ground11']},
    {label:'Middle', on:true, depth:5.4, depthJitter:1.3, scale:1.08, scaleJitter:0.14, spacing:1.0, spacingJitter:0.45,
      textures:['ground01','ground02','ground03','ground04','ground06','ground07','ground08','ground09','ground11','ground12']},
    {label:'Outer', on:true, depth:8.6, depthJitter:1.0, scale:1.2, scaleJitter:0.14, spacing:3.5, spacingJitter:1.2,
      textures:['ground02','ground03','ground04','ground06','ground08','ground10','ground12']}
  ].map(Object.freeze));
  const clampTo = (value, [lo, hi], fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };
  function normaliseRow(raw, index) {
    const d = DEFAULT_ROWS[index];
    const out = {label:d.label, on:raw?.on === undefined ? d.on : !!raw.on};
    for (const key of Object.keys(LIMITS)) out[key] = clampTo(raw?.[key], LIMITS[key], d[key]);
    const textures = Array.isArray(raw?.textures) ? raw.textures.filter(t => TEXTURES.includes(t)) : null;
    out.textures = textures ? [...new Set(textures)] : [...d.textures];
    return out;
  }
  // null when the profile has never set rows (it keeps the scattered near side).
  function normalise(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {enabled:!!raw.enabled, rows:DEFAULT_ROWS.map((_, i) => normaliseRow(raw.rows?.[i], i))};
  }
  const defaults = () => ({enabled:false, rows:DEFAULT_ROWS.map(r => ({...r, textures:[...r.textures]}))});
  window.SideScrollNearRows = Object.freeze({TEXTURES, LIMITS, DEFAULT_ROWS, normalise, defaults});
})();
