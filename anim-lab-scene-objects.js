/* Character Lab · Scene objects (Animate and Play).
 * Any asset (the built-in props and every imported picture) can stand on the
 * ground next to the character at game size, to animate against — a chopping
 * block, a log, a doorway. Like the Quick Play test box they last only while
 * the page is open: nothing is saved with the character or the animation.
 * Each object has a distance from the character (metres, + = in front of a
 * right-facing character), Behind / In front, and a size (100 % = the asset's
 * game height). In Play the objects stay where they are in the world while the
 * character walks (window.AnimLabQuickPlay gives its distance).
 */
(() => {
  'use strict';
  const core = window.AnimLabCore;
  const Props = window.SideScrollProps;
  const AssetLib = window.SideScrollAssetLibrary;
  const assetPath = window.SideScrollAssetPath || (url => url);
  const anchor = document.getElementById('animlab-clip-row')?.closest('section');
  if (!core?.registerUnderlayRenderer || !core.registerPluginRenderer || !anchor) return;
  const BASE_SCALE = 2.31; // world metres per rig unit at scale 1, as the game

  // ---- What can be placed: built-in props + imported pictures ---------------------
  function catalogue() {
    const imported = AssetLib ? AssetLib.list().filter(e => e.art?.kind !== 'effect') : [];
    return [
      ...(Props?.BUILT_IN || []).map(a => ({ name: a.name, label: a.label, height: Number(a.height) || 1, groundLine: 0 })),
      ...imported.map(e => ({ name: e.name, label: e.label || e.name, height: Number(e.height) || 1, groundLine: Number.isFinite(Number(e.groundLine)) ? Number(e.groundLine) : 0 }))
    ];
  }
  const images = new Map();
  function imageFor(entry) {
    if (images.has(entry.name)) return images.get(entry.name);
    const rec = { img: new Image(), ready: false, aspect: 1 };
    images.set(entry.name, rec);
    rec.img.onload = () => { rec.ready = true; rec.aspect = rec.img.naturalWidth / Math.max(1, rec.img.naturalHeight); core.redrawOnly?.(); };
    const builtIn = Props?.BUILT_IN?.find(a => a.name === entry.name);
    const imported = AssetLib?.get?.(entry.name);
    if (builtIn) rec.img.src = assetPath(builtIn.image);
    else if (imported) AssetLib.artUrl(imported).then(url => { if (url) rec.img.src = url; }).catch(() => {});
    return rec;
  }

  // ---- Session state (not saved) ------------------------------------------------
  const objects = []; // {id, name, label, height, groundLine, x, front, size}
  let nextId = 1;
  const state = () => core.getState();
  const isActive = (s = state()) => s.mode === 'animate' || s.mode === 'play';
  const characterX = s => (s.mode === 'play' ? Number(window.AnimLabQuickPlay?.state?.().x) || 0 : 0);

  // ---- Panel -------------------------------------------------------------------
  const section = document.createElement('section');
  section.className = 'animlab-section animlab-scene-objects';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Scene objects</div>
    <p class="animlab-setup-note">Stand any asset next to the character to animate against. Only for this visit: nothing is saved.</p>
    <div class="animlab-scene-add"><select data-scene-pick aria-label="Asset to add"></select><button type="button" data-scene-add>Add</button></div>
    <div class="animlab-scene-list" data-scene-list></div>
    <div class="animlab-quickplay-actions"><button type="button" data-scene-clear>Clear all</button></div>`;
  anchor.insertAdjacentElement('afterend', section);
  const pick = section.querySelector('[data-scene-pick]'), list = section.querySelector('[data-scene-list]');
  let pickSig = '';
  function renderPicker() {
    const items = catalogue(), sig = items.map(i => i.name).join('|');
    if (sig === pickSig) return;
    pickSig = sig;
    const keep = pick.value;
    pick.replaceChildren(...items.map(i => { const o = document.createElement('option'); o.value = i.name; o.textContent = i.label; return o; }));
    if (items.some(i => i.name === keep)) pick.value = keep;
  }
  function row(o) {
    const el = document.createElement('div');
    el.className = 'animlab-scene-row';
    el.innerHTML = `
      <div class="animlab-scene-row-head"><strong></strong>
        <button type="button" data-front aria-pressed="${o.front}">${o.front ? 'In front' : 'Behind'}</button>
        <button type="button" data-remove aria-label="Remove">✕</button></div>
      <label class="animlab-slider"><span>Distance</span><input type="range" data-x min="-4" max="4" step="0.05" value="${o.x}"><output>${o.x.toFixed(2)} m</output></label>
      <label class="animlab-slider"><span>Size</span><input type="range" data-size min="0.25" max="3" step="0.05" value="${o.size}"><output>${Math.round(o.size * 100)} %</output></label>`;
    el.querySelector('strong').textContent = o.label;
    el.querySelector('[data-front]').addEventListener('click', () => { o.front = !o.front; renderList(); core.redrawOnly?.(); });
    el.querySelector('[data-remove]').addEventListener('click', () => { objects.splice(objects.indexOf(o), 1); renderList(); core.redrawOnly?.(); });
    el.querySelector('[data-x]').addEventListener('input', ev => { o.x = Number(ev.target.value); ev.target.nextElementSibling.textContent = `${o.x.toFixed(2)} m`; core.redrawOnly?.(); });
    el.querySelector('[data-size]').addEventListener('input', ev => { o.size = Number(ev.target.value); ev.target.nextElementSibling.textContent = `${Math.round(o.size * 100)} %`; core.redrawOnly?.(); });
    return el;
  }
  function renderList() {
    list.replaceChildren(...objects.map(row));
    section.querySelector('[data-scene-clear]').disabled = !objects.length;
  }
  section.querySelector('[data-scene-add]').addEventListener('click', () => {
    const entry = catalogue().find(i => i.name === pick.value);
    if (!entry) return;
    const s = state();
    // A little in front of the character (and clear of any object already there).
    let x = characterX(s) + 0.8;
    while (objects.some(o => Math.abs(o.x - x) < 0.3)) x += 0.6;
    objects.push({ id: nextId++, name: entry.name, label: entry.label, height: entry.height, groundLine: entry.groundLine, x: Math.round(x * 20) / 20, front: false, size: 1 });
    imageFor(entry);
    renderList(); core.redrawOnly?.();
  });
  section.querySelector('[data-scene-clear]').addEventListener('click', () => { objects.length = 0; renderList(); core.redrawOnly?.(); });

  // ---- Drawing: behind (underlay) or in front (after the character) -------------
  let grid = null; // the frame's grid view (world metres ↔ pixels), from the underlay pass
  function drawObjects(ctx, front) {
    const s = state();
    if (!grid || !isActive(s)) return;
    const ppw = grid.scale / BASE_SCALE, cx = characterX(s);
    for (const o of objects) {
      if (!!o.front !== front) continue;
      const rec = imageFor(o);
      if (!rec.ready) continue;
      const h = o.height * o.size * ppw, w = h * rec.aspect;
      // groundLine: where the ground meets the picture, 0–1 up from its bottom edge (0 = the bottom).
      const below = Math.max(0, Math.min(1, o.groundLine)) * h;
      const left = grid.cx + (o.x - cx) * ppw - w / 2, top = grid.groundY - h + below;
      ctx.save(); ctx.drawImage(rec.img, left, top, w, h); ctx.restore();
    }
  }
  core.registerUnderlayRenderer('scene-objects', ({ ctx, gridView }) => { grid = gridView; drawObjects(ctx, false); });
  core.registerPluginRenderer('scene-objects-front', ({ ctx }) => drawObjects(ctx, true));

  function render() {
    const active = isActive();
    section.hidden = !active;
    if (active) renderPicker();
  }
  core.subscribe?.(render);
  render(); renderList();
  window.AnimLabSceneObjects = Object.freeze({ list: () => objects.map(o => ({ ...o })) }); // read-only test hook
})();
