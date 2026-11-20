/* Character Lab → Props stage (anim-lab-props.js).
 *
 * Any asset can be held. Choose one, then place it against the hand: move it
 * along / across the hand, turn it, size it, mirror it, pick the hand and where
 * it is drawn among the parts. The result is the character's hold for that asset
 * (setup.holds, character-props.js), saved with Save like the rest of the setup.
 * The stage can show the character in any of its animations (▶), so the grip can
 * be checked through a swing; "Show in Animate and Play" keeps the chosen prop in
 * the hand in those stages too (this session only).
 */
(() => {
  'use strict';
  const core = window.AnimLabCore;
  const Props = window.SideScrollProps;
  const canvas = document.getElementById('animlab-canvas');
  const setupSection = document.getElementById('animlab-setup-section');
  const viewportPadHost = document.getElementById('animlab-viewport-pad-host');
  if (!core || !Props || !canvas || !setupSection || typeof core.setPropItemsProvider !== 'function') return;
  const AssetLib = window.SideScrollAssetLibrary || null;
  const assetPath = window.SideScrollAssetPath || (url => url);
  const SESSION_KEY = 'sidescroll.animlab.props-view'; // sessionStorage: {selected, show, pose}
  const DEG = Math.PI / 180;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- Assets that can be held: built-in props + every imported picture --------
  const images = new Map(); // name → {img, ready, aspect}
  function catalogue() {
    const imported = AssetLib ? AssetLib.list().filter(e => e.art?.kind !== 'effect') : [];
    return [
      ...Props.BUILT_IN.map(a => ({ name: a.name, label: a.label, height: a.height, group: 'Built-in' })),
      ...imported.map(e => ({ name: e.name, label: e.label, height: Number(e.height) || 1, group: e.group ? e.group.charAt(0) + e.group.slice(1).toLowerCase() : 'Imported' }))
    ];
  }
  const entryFor = name => catalogue().find(a => a.name === name) || null;
  const labelFor = name => entryFor(name)?.label || name;
  function imageFor(name) {
    if (images.has(name)) return images.get(name);
    const rec = { img: new Image(), ready: false, aspect: 1 };
    images.set(name, rec);
    rec.img.onload = () => { rec.ready = true; rec.aspect = rec.img.naturalWidth / Math.max(1, rec.img.naturalHeight); core.redrawOnly(); };
    const builtIn = Props.BUILT_IN.find(a => a.name === name);
    const imported = AssetLib?.get?.(name);
    if (builtIn) rec.img.src = assetPath(builtIn.image);
    else if (imported) AssetLib.artUrl(imported).then(url => { rec.img.src = url; }).catch(() => {});
    return rec;
  }

  // ---- Session view state ------------------------------------------------------
  const viewState = (() => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}') || {}; } catch (_) { return {}; } })();
  let selected = typeof viewState.selected === 'string' ? viewState.selected : null;
  let showOutside = !!viewState.show;     // show the selected prop in Animate and Play
  let poseClip = typeof viewState.pose === 'string' ? viewState.pose : '';  // '' = rest pose
  let playing = false, phase = 0, lastTick = 0, rafId = 0;
  let mode = 'move', fine = false;
  const persist = () => { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ selected, show: showOutside, pose: poseClip })); } catch (_) {} };

  const state = () => core.peekArtRenderState();
  const holdsOf = s => (s.setup && s.setup.holds) || {};
  const fits = s => !!Props.FAMILIES[s.family];
  const isActive = (s = state()) => s.mode === 'setup' && s.setupTool === 'props' && fits(s);
  const metres = (units, s = state()) => units * Props.BASE_SCALE * (Number(s.setup?.scale) || 1);

  // ---- Panel -------------------------------------------------------------------
  const section = document.createElement('section');
  section.className = 'animlab-section animlab-props-section';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Props · things it holds</div>
    <p class="animlab-contact-note">Choose an asset, then place it against the hand. It follows the hand through every animation (in the game too). Story → a character's <strong>Holds</strong> or a <strong>Prop</strong> step says when it holds it.</p>
    <label class="animlab-held-layer"><span>Add a prop</span><select data-props-add></select></label>
    <div class="animlab-props-list" data-props-list></div>
    <div class="animlab-props-editor" data-props-editor hidden>
      <div class="animlab-parts-subgroup-label" data-props-title>Prop</div>
      <div class="animlab-segmented" data-props-hand>
        <button type="button" data-hand="near">Near hand</button>
        <button type="button" data-hand="far">Far hand</button>
      </div>
      <div class="animlab-parts-subgroup-label">Place it (drag the pad on the view)</div>
      <div class="animlab-segmented animlab-props-modes">
        <button type="button" data-props-mode="move">Move</button>
        <button type="button" data-props-mode="turn">Turn</button>
        <button type="button" data-props-mode="size">Size</button>
        <button type="button" data-props-fine>Fine</button>
      </div>
      <div class="animlab-art-numeric-grid">
        <label>Along hand (m) <input type="number" data-props-number="x" inputmode="decimal" step="0.01"></label>
        <label>Across (m) <input type="number" data-props-number="y" inputmode="decimal" step="0.01"></label>
        <label>Angle ° <input type="number" data-props-number="angle" inputmode="decimal" step="1"></label>
        <label>Height (m) <input type="number" data-props-number="size" inputmode="decimal" step="0.01" min="0.05"></label>
      </div>
      <div class="animlab-quickplay-actions">
        <button type="button" data-props-flip>Mirror</button>
        <button type="button" data-props-reset>Reset grip</button>
      </div>
      <label class="animlab-held-layer"><span>Drawn</span>
        <select data-props-layer>
          <option value="hand">With the hand (near: behind the near arm; far: behind the body)</option>
          <option value="front">In front of everything</option>
          <option value="back">Behind everything</option>
        </select>
      </label>
      <div class="animlab-parts-subgroup-label">Try it in an animation</div>
      <div class="animlab-props-pose">
        <select data-props-pose></select>
        <button type="button" data-props-play>▶ Play</button>
      </div>
      <label class="animlab-props-check"><input type="checkbox" data-props-show> Show it in Animate and Play too</label>
      <p class="animlab-contact-note">Save keeps the grip with this character. Props that no character has set up are held at the hand at their own height.</p>
    </div>`;
  setupSection.insertAdjacentElement('afterend', section);
  const $ = sel => section.querySelector(sel);
  const addSelect = $('[data-props-add]'), list = $('[data-props-list]'), editor = $('[data-props-editor]');
  const title = $('[data-props-title]'), layerSelect = $('[data-props-layer]'), poseSelect = $('[data-props-pose]');
  const playButton = $('[data-props-play]'), showBox = $('[data-props-show]'), fineButton = $('[data-props-fine]');
  const numbers = [...section.querySelectorAll('[data-props-number]')];

  const pad = document.createElement('div');
  pad.className = 'animlab-precision-pad animlab-viewport-precision-pad animlab-props-pad';
  pad.setAttribute('role', 'application');
  pad.setAttribute('aria-label', 'Move, turn or size the selected prop');
  pad.innerHTML = '<i class="animlab-pad-x"></i><i class="animlab-pad-y"></i><span>Move prop</span>';
  pad.hidden = true;
  viewportPadHost?.appendChild(pad);

  function editHold(label, fn) {
    if (!selected) return;
    core.edit('setup', label, setup => {
      setup.holds ||= {};
      const hold = Props.normaliseHold(setup.holds[selected] || Props.defaultHold(entryFor(selected)?.height, setup.scale));
      fn(hold, setup);
      setup.holds[selected] = Props.normaliseHold(hold);
    });
  }
  function select(name) { selected = name; persist(); render(); core.redrawOnly(); }

  addSelect.addEventListener('change', () => {
    const name = addSelect.value;
    addSelect.value = '';
    if (!name) return;
    const s = state();
    if (!holdsOf(s)[name]) core.edit('setup', `Add prop ${labelFor(name)}`, setup => {
      setup.holds ||= {};
      setup.holds[name] = Props.defaultHold(entryFor(name)?.height, setup.scale);
    });
    select(name);
  });
  section.querySelectorAll('[data-hand]').forEach(b => b.addEventListener('click', () => editHold('Prop hand', h => { h.hand = b.dataset.hand; })));
  section.querySelectorAll('[data-props-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.propsMode; render(); }));
  fineButton.addEventListener('click', () => { fine = !fine; render(); });
  $('[data-props-flip]').addEventListener('click', () => editHold('Mirror prop', h => { h.flip = !h.flip; }));
  $('[data-props-reset]').addEventListener('click', () => editHold('Reset prop grip', (h, setup) => {
    Object.assign(h, Props.defaultHold(entryFor(selected)?.height, setup.scale, h.hand));
  }));
  layerSelect.addEventListener('change', () => editHold('Prop drawn', h => { h.layer = layerSelect.value; }));
  numbers.forEach(input => input.addEventListener('change', () => {
    const v = Number(input.value);
    if (!Number.isFinite(v)) { render(); return; }
    const key = input.dataset.propsNumber, k = Props.BASE_SCALE * (Number(state().setup?.scale) || 1);
    editHold('Prop value', h => { h[key] = key === 'angle' ? v : v / k; });
  }));
  poseSelect.addEventListener('change', () => { poseClip = poseSelect.value; phase = 0; if (!poseClip) setPlaying(false); persist(); core.redrawOnly(); render(); });
  playButton.addEventListener('click', () => { if (!poseClip) return; setPlaying(!playing); render(); });
  showBox.addEventListener('change', () => { showOutside = showBox.checked; persist(); core.redrawOnly(); });

  // ---- Animation preview in the Props stage --------------------------------------
  function setPlaying(on) {
    playing = !!on;
    if (playing && !rafId) { lastTick = performance.now(); rafId = requestAnimationFrame(tick); }
  }
  function tick(now) {
    rafId = 0;
    if (!playing || !isActive()) { playing = false; render(); return; }
    phase = (phase + (now - lastTick) / 1000 / 1.1) % 1; // about one cycle a second
    lastTick = now;
    core.drawPlaybackFrame();
    rafId = requestAnimationFrame(tick);
  }
  core.setSetupPoseProvider(() => {
    const s = state();
    if (!isActive(s) || !poseClip) return null;
    return core.evaluateClip(poseClip, phase);
  });

  // ---- Drawing -------------------------------------------------------------------
  function drawProp(ctx, view, geometry, name, hold, outline) {
    const at = Props.place(geometry, hold);
    const rec = imageFor(name);
    if (!at) return;
    const c = core.project({ x: at.x, y: at.y }, view), f = view.flipX || 1;
    const hPx = at.size * view.scale, wPx = hPx * (rec.ready ? rec.aspect : 0.25);
    ctx.save();
    ctx.translate(c.x, c.y); ctx.scale(f, 1); ctx.rotate(-at.angle); if (at.flip) ctx.scale(-1, 1);
    if (rec.ready) ctx.drawImage(rec.img, -wPx / 2, -hPx / 2, wPx, hPx);
    if (outline || !rec.ready) {
      ctx.strokeStyle = 'rgba(255,196,92,.85)'; ctx.setLineDash([5, 4]); ctx.lineWidth = Math.max(1, view.scale * 0.003);
      ctx.strokeRect(-wPx / 2, -hPx / 2, wPx, hPx);
    }
    ctx.restore();
    if (outline) {
      // The wrist (what the prop is measured from) and the hand's direction.
      const w = core.project(at.wrist, view), r = Math.max(4, view.scale * 0.012);
      ctx.save(); ctx.fillStyle = 'rgba(255,196,92,.95)'; ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  core.setPropItemsProvider(args => {
    const s = state();
    if (!fits(s) || !selected) return [];
    const inStage = isActive(s), elsewhere = showOutside && (s.mode === 'animate' || s.mode === 'play');
    if (!inStage && !elsewhere) return [];
    const holds = holdsOf(s);
    if (!holds[selected] && !inStage) return [];
    const hold = Props.normaliseHold(holds[selected] || Props.defaultHold(entryFor(selected)?.height, s.setup?.scale));
    let geometry = null;
    try { geometry = args.adapter.rig.geometry(args.pose, args.restRig); } catch (_) { return []; }
    lastGeometry = geometry;
    return [{ layer: Props.layerFor(hold), draw: () => drawProp(args.ctx, args.view, geometry, selected, hold, inStage) }];
  });

  // ---- Pad: move / turn / size the selected prop -----------------------------------
  let drag = null, lastGeometry = null; // the posed geometry last drawn (the pad turns moves into the hand's frame)
  pad.addEventListener('pointerdown', ev => {
    const s = state();
    if (!isActive(s) || !selected) return;
    ev.preventDefault();
    const hold = Props.normaliseHold(holdsOf(s)[selected] || Props.defaultHold(entryFor(selected)?.height, s.setup?.scale));
    let handAngle = 0;
    try { handAngle = Props.place(lastGeometry, hold)?.handAngle || 0; } catch (_) {}
    drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, start: hold, handAngle, tx: core.beginTransaction('setup', `${mode} prop`) };
    try { pad.setPointerCapture(ev.pointerId); } catch (_) {}
  });
  pad.addEventListener('pointermove', ev => {
    if (!drag || drag.id !== ev.pointerId) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect(), view = core.getPreviewView();
    if (!(rect.width > 0) || !(view.scale > 0)) return;
    const k = (fine ? 0.25 : 1) * (canvas.width / rect.width) / view.scale;
    const dx = (ev.clientX - drag.x) * k * (view.flipX || 1), dy = -(ev.clientY - drag.y) * k;
    const c = Math.cos(drag.handAngle), sn = Math.sin(drag.handAngle);
    const next = { ...drag.start };
    if (mode === 'move') { next.x = drag.start.x + c * dx + sn * dy; next.y = drag.start.y - sn * dx + c * dy; }
    else if (mode === 'turn') next.angle = drag.start.angle - (ev.clientX - drag.x) * (fine ? 0.1 : 0.4);
    else next.size = clamp(drag.start.size * Math.exp((ev.clientX - drag.x) * (fine ? 0.001 : 0.004)), 0.02, 3);
    core.previewTransaction(drag.tx, setup => { setup.holds ||= {}; setup.holds[selected] = Props.normaliseHold(next); });
  });
  const endDrag = cancel => ev => {
    if (!drag || drag.id !== ev.pointerId) return;
    const d = drag; drag = null;
    if (cancel) core.cancelTransaction(d.tx); else core.commitTransaction(d.tx);
    try { pad.releasePointerCapture(ev.pointerId); } catch (_) {}
    render();
  };
  pad.addEventListener('pointerup', endDrag(false));
  pad.addEventListener('pointercancel', endDrag(true));

  // ---- Panel state ---------------------------------------------------------------------
  let listSig = '';
  function render() {
    const s = state(), active = isActive(s);
    section.hidden = !active;
    pad.hidden = !active || !selected;
    if (!active) { if (playing) setPlaying(false); return; }
    if (viewportPadHost) viewportPadHost.hidden = false;
    const holds = holdsOf(s), names = Object.keys(holds);
    if (selected && !holds[selected] && !entryFor(selected)) selected = null;
    // Add list: everything not held yet.
    const options = catalogue().filter(a => !holds[a.name]);
    const sig = `${s.characterId}|${names.join(',')}|${options.map(a => a.name).join(',')}|${selected}`;
    if (sig !== listSig) {
      listSig = sig;
      addSelect.replaceChildren(new Option(options.length ? 'Choose an asset…' : 'No more assets', ''),
        ...options.map(a => new Option(`${a.label} · ${a.group}`, a.name)));
      list.replaceChildren(...names.map(name => {
        const rowEl = document.createElement('div');
        rowEl.className = 'animlab-props-row' + (name === selected ? ' active' : '');
        const pick = document.createElement('button');
        pick.type = 'button'; pick.textContent = `⚒ ${labelFor(name)}`;
        pick.setAttribute('aria-pressed', String(name === selected));
        pick.addEventListener('click', () => select(name));
        const x = document.createElement('button');
        x.type = 'button'; x.className = 'animlab-props-x'; x.textContent = '×'; x.title = `Remove ${labelFor(name)}`;
        x.addEventListener('click', () => {
          if (!confirm(`Remove ${labelFor(name)} from this character’s props? (Sequences that give it to this character then hold it at the hand by default.)`)) return;
          core.edit('setup', `Remove prop ${labelFor(name)}`, setup => { delete setup.holds?.[name]; });
          if (selected === name) selected = null;
          persist(); render();
        });
        rowEl.append(pick, x);
        return rowEl;
      }));
      if (!names.length) list.append(Object.assign(document.createElement('p'), { className: 'animlab-contact-note', textContent: 'No props yet.' }));
      const anims = core.animationList?.() || [];
      poseSelect.replaceChildren(new Option('Rest pose', ''), ...anims.map(a => new Option(a.name, a.key)));
    }
    if (poseClip && ![...poseSelect.options].some(o => o.value === poseClip)) poseClip = '';
    poseSelect.value = poseClip;
    playButton.textContent = playing ? '❚❚ Pause' : '▶ Play';
    playButton.disabled = !poseClip;
    showBox.checked = showOutside;
    const hold = selected ? Props.normaliseHold(holds[selected] || Props.defaultHold(entryFor(selected)?.height, s.setup?.scale)) : null;
    editor.hidden = !hold;
    if (!hold) return;
    title.textContent = labelFor(selected);
    section.querySelectorAll('[data-hand]').forEach(b => { const on = b.dataset.hand === hold.hand; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    section.querySelectorAll('[data-props-mode]').forEach(b => { const on = b.dataset.propsMode === mode; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    fineButton.classList.toggle('active', fine); fineButton.setAttribute('aria-pressed', String(fine));
    $('[data-props-flip]').classList.toggle('active', hold.flip);
    pad.querySelector('span').textContent = { move: 'Move prop', turn: 'Turn prop', size: 'Size prop' }[mode];
    layerSelect.value = ['hand', 'front', 'back'].includes(hold.layer) ? hold.layer : 'hand';
    for (const input of numbers) {
      if (document.activeElement === input) continue;
      const key = input.dataset.propsNumber;
      input.value = key === 'angle' ? hold.angle.toFixed(1) : metres(hold[key], s).toFixed(2);
    }
  }
  core.subscribe(() => render());
  render();

  // Read-only test hook.
  window.AnimLabProps = Object.freeze({ state: () => ({ selected, showOutside, poseClip, playing, mode, holds: JSON.parse(JSON.stringify(holdsOf(state()))) }) });
})();
