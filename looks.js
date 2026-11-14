/* SideScroll — looks (window.SideScrollLooks).
 *
 * A look is a named set of fog and post values ("Warm home", "Cold and grey")
 * that the game can switch to — previewed from Menu → Looks, or set by an
 * event's Look step during play. The world's own Fog and Post settings
 * (sidescroll.render.fog.v1 / .post.v1) are the **base look**, used whenever
 * no look is set.
 *
 *   sidescroll.looks.v1 = { looks: [{ id 'look-…', name,
 *     fog:  { enabled, color:[r,g,b], near, far, amount, curve },
 *     post: { brightness, contrast, saturation, tintColor:[r,g,b], tintAmount } }] }
 *
 * Values are clamped to the same ranges as the Fog and Post panels.
 */
(function () {
  'use strict';
  const KEY = 'sidescroll.looks.v1';
  const ID = /^look-[a-z0-9]{4,20}$/;
  const DEFAULT_FOG = { enabled: true, color: [0.835, 0.885, 0.945], near: 7.8, far: 46.0, amount: 0.90, curve: 1.65 };
  const DEFAULT_POST = { brightness: 1, contrast: 1, saturation: 1, tintColor: [1, 1, 1], tintAmount: 0 };

  const num = (v, lo, hi, f) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : f; };
  const rgb = (v, f) => Array.isArray(v) && v.length >= 3 ? v.slice(0, 3).map((c, i) => num(c, 0, 1, f[i])) : [...f];
  const text = (v, f) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) || f;

  function cleanFog(f) {
    f = f && typeof f === 'object' ? f : {};
    return { enabled: f.enabled !== false, color: rgb(f.color, DEFAULT_FOG.color), near: num(f.near, 0, 60, DEFAULT_FOG.near),
      far: num(f.far, 1, 100, DEFAULT_FOG.far), amount: num(f.amount, 0, 1, DEFAULT_FOG.amount), curve: num(f.curve, 0.2, 5, DEFAULT_FOG.curve) };
  }
  function cleanPost(p) {
    p = p && typeof p === 'object' ? p : {};
    return { brightness: num(p.brightness, 0.6, 1.4, 1), contrast: num(p.contrast, 0.5, 1.6, 1), saturation: num(p.saturation, 0, 1.6, 1),
      tintColor: rgb(p.tintColor, DEFAULT_POST.tintColor), tintAmount: num(p.tintAmount, 0, 0.6, 0) };
  }
  function clean(look) {
    if (!look || typeof look !== 'object' || !ID.test(look.id || '')) return null;
    return { id: look.id, name: text(look.name, 'Look'), fog: cleanFog(look.fog), post: cleanPost(look.post) };
  }

  function list() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      const seen = new Set();
      return (Array.isArray(raw?.looks) ? raw.looks : []).map(clean).filter(l => l && !seen.has(l.id) && seen.add(l.id));
    } catch (_) { return []; }
  }
  function write(looks) {
    const clean_ = looks.map(clean).filter(Boolean);
    if (clean_.length) localStorage.setItem(KEY, JSON.stringify({ looks: clean_ }));
    else localStorage.removeItem(KEY);
  }
  const get = id => list().find(l => l.id === id) || null;
  const newId = () => `look-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.slice(0, 25);
  function add(look) {
    const made = clean({ ...look, id: newId() });
    write([...list(), made]);
    return made;
  }
  function update(id, patch) {
    const all = list(), i = all.findIndex(l => l.id === id);
    if (i < 0) return null;
    all[i] = clean({ ...all[i], ...patch, id });
    write(all);
    return all[i];
  }
  const remove = id => write(list().filter(l => l.id !== id));

  window.SideScrollLooks = { KEY, list, get, add, update, remove, cleanFog, cleanPost, DEFAULT_FOG, DEFAULT_POST };
})();
