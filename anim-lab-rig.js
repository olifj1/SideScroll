(function(){
  'use strict';

  const core = window.AnimLabCore;
  if (!core || typeof core.getState !== 'function') return;

  const canvas = document.getElementById('animlab-canvas');
  const setupSection = document.getElementById('animlab-setup-section');
  if (!canvas || !setupSection) return;

  const section = document.createElement('section');
  section.className = 'animlab-section animlab-rig-controls';
  section.hidden = true;
  section.innerHTML = `
    <div class="animlab-section-title">Rig Designer</div>
    <p class="animlab-rig-note">Edit the saved character anatomy/rest structure. Animation poses remain separate and retarget onto the saved rig.</p>
    <div class="animlab-rig-board" aria-label="Rig joints"></div>
    <div class="animlab-rig-selected">
      <div class="animlab-rig-selected-title">No joint selected</div>
      <div class="animlab-rig-selected-pos"></div>
      <div class="animlab-rig-lengths"></div>
    </div>
    <div class="animlab-precision animlab-rig-precision">
      <div class="animlab-precision-row animlab-rig-axis">
        <button type="button" data-axis="free" class="is-active">Free</button>
        <button type="button" data-axis="x">X only</button>
        <button type="button" data-axis="y">Y only</button>
        <button type="button" data-fine="1">Fine</button>
      </div>
      <div class="animlab-precision-pad animlab-rig-pad" role="application" aria-label="Precision rig joint drag">
        <span>Drag selected joint</span>
      </div>
    </div>
    <div class="animlab-rig-actions">
      <button type="button" data-action="copy-pair">Copy to Pair</button>
      <button type="button" data-action="reset-joint">Reset Joint</button>
      <button type="button" data-action="near-far">Near → Far</button>
      <button type="button" data-action="far-near">Far → Near</button>
      <button type="button" data-action="ground">Paws to Ground</button>
      <button type="button" data-action="reset-rig">Reset Rig</button>
      <button type="button" data-action="ghost" class="animlab-rig-ghost is-active">Art Ghost</button>
    </div>
  `;
  setupSection.insertAdjacentElement('afterend', section);

  const board = section.querySelector('.animlab-rig-board');
  const selectedTitle = section.querySelector('.animlab-rig-selected-title');
  const selectedPos = section.querySelector('.animlab-rig-selected-pos');
  const lengthsEl = section.querySelector('.animlab-rig-lengths');
  const pad = section.querySelector('.animlab-rig-pad');
  const ghostButton = section.querySelector('[data-action="ghost"]');

  let selectedJoint = null;
  let axis = 'free';
  let fine = false;
  let ghost = true;
  let lastActive = false;
  let lastDescriptor = null;
  let lastRender = null;
  let viewportDrag = null;
  let precisionDrag = null;

  function state(){ return core.getState(); }
  function descriptorFor(s){ return s && s.mode === 'setup' && s.rig && s.rig.RIG_DESIGNER || null; }
  function rigDraftFor(s){ return s && s.setup && s.setup.rig && s.setup.rig.joints ? s.setup.rig : null; }
  function isActive(s){ return !!(descriptorFor(s) && rigDraftFor(s)); }
  function labelFor(desc,id){ return desc?.labels?.[id] || id || 'Joint'; }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }

  function normalizedRig(s, candidate){
    if (s?.rig && typeof s.rig.normalizedRestRig === 'function') return s.rig.normalizedRestRig(candidate);
    return clone(candidate);
  }

  function defaultRig(s){
    return normalizedRig(s, s?.rig?.DEFAULT_REST_RIG || s?.setup?.rig);
  }

  function bounds(desc){
    const b = desc?.bounds || desc?.editingBounds || {};
    return {
      minX: Number.isFinite(+b.minX) ? +b.minX : -1,
      maxX: Number.isFinite(+b.maxX) ? +b.maxX : 1,
      minY: Number.isFinite(+b.minY) ? +b.minY : -1,
      maxY: Number.isFinite(+b.maxY) ? +b.maxY : 1
    };
  }

  function clampPoint(desc,p){
    const b = bounds(desc);
    return {
      x: Math.max(b.minX, Math.min(b.maxX, +p.x || 0)),
      y: Math.max(b.minY, Math.min(b.maxY, +p.y || 0))
    };
  }

  function symmetryPair(desc,id){
    const pairs = desc?.symmetryPairs || [];
    for (const pair of pairs) {
      if (pair[0] === id) return {other:pair[1], sourceIndex:0};
      if (pair[1] === id) return {other:pair[0], sourceIndex:1};
    }
    return null;
  }

  function connectedLengths(desc,joints,id){
    const out = [];
    for (const link of desc?.boneLinks || []) {
      const a = Array.isArray(link) ? link[0] : link.a;
      const b = Array.isArray(link) ? link[1] : link.b;
      if (a !== id && b !== id) continue;
      const other = a === id ? b : a;
      const p0 = joints[id], p1 = joints[other];
      if (!p0 || !p1) continue;
      const len = Math.hypot(p1.x-p0.x,p1.y-p0.y);
      out.push(`${labelFor(desc,other)} ${len.toFixed(3)}`);
    }
    return out;
  }

  function ensureSelection(s, desc){
    const joints = rigDraftFor(s)?.joints || {};
    if (selectedJoint && joints[selectedJoint]) return;
    const ids = desc?.jointGroups?.flatMap(g => g.joints || []) || Object.keys(joints);
    selectedJoint = ids.find(id => joints[id]) || null;
  }

  function renderBoard(desc){
    if (lastDescriptor === desc && board.childElementCount) return;
    lastDescriptor = desc;
    board.textContent = '';
    for (const group of desc?.jointGroups || []) {
      const wrap = document.createElement('div');
      wrap.className = 'animlab-rig-group';
      const title = document.createElement('div');
      title.className = 'animlab-rig-group-title';
      title.textContent = group.label || group.id || 'Joints';
      const joints = document.createElement('div');
      joints.className = 'animlab-rig-joints';
      for (const id of group.joints || []) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.joint = id;
        button.textContent = labelFor(desc,id);
        button.addEventListener('click', () => { selectedJoint = id; renderUI(); });
        joints.appendChild(button);
      }
      wrap.append(title,joints);
      board.appendChild(wrap);
    }
  }

  function renderUI(){
    const s = state();
    const active = isActive(s);
    section.hidden = !active;

    if (active !== lastActive) {
      lastActive = active;
      if (typeof core.setArtOpacity === 'function') core.setArtOpacity(active && ghost ? 0.28 : 1);
    }
    if (!active) return;

    const desc = descriptorFor(s);
    const draft = rigDraftFor(s);
    renderBoard(desc);
    ensureSelection(s,desc);

    section.querySelectorAll('[data-joint]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.joint === selectedJoint);
    });
    section.querySelectorAll('[data-axis]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.axis === axis);
    });
    const fineButton = section.querySelector('[data-fine]');
    if (fineButton) fineButton.classList.toggle('is-active', fine);
    ghostButton.classList.toggle('is-active', ghost);

    const p = selectedJoint && draft.joints[selectedJoint];
    selectedTitle.textContent = p ? labelFor(desc,selectedJoint) : 'No joint selected';
    selectedPos.textContent = p ? `X ${p.x.toFixed(4)}   Y ${p.y.toFixed(4)}` : '';
    const lens = p ? connectedLengths(desc,draft.joints,selectedJoint) : [];
    lengthsEl.textContent = lens.length ? `Bone lengths: ${lens.join(' · ')}` : '';

    const pair = selectedJoint && symmetryPair(desc,selectedJoint);
    const copyPair = section.querySelector('[data-action="copy-pair"]');
    if (copyPair) copyPair.disabled = !pair;
  }

  function editRig(label, mutator){
    const s = state();
    if (!isActive(s)) return;
    core.edit('setup', label, setup => {
      if (!setup.rig || !setup.rig.joints) return setup;
      mutator(setup.rig, descriptorFor(s));
      setup.rig = normalizedRig(s, setup.rig);
      return setup;
    });
  }

  function setJointInTransaction(tx, s, id, point){
    if (!tx || !id) return;
    const desc = descriptorFor(s);
    const next = clampPoint(desc, point);
    core.previewTransaction(tx, setup => {
      if (!setup.rig?.joints?.[id]) return setup;
      setup.rig.joints[id] = next;
      setup.rig = normalizedRig(s, setup.rig);
      return setup;
    });
  }

  function pairCopy(direction){
    editRig(direction === 'nearFar' ? 'Copy near rig to far' : 'Copy far rig to near', (rig,desc) => {
      for (const pair of desc?.symmetryPairs || []) {
        const src = direction === 'nearFar' ? pair[0] : pair[1];
        const dst = direction === 'nearFar' ? pair[1] : pair[0];
        if (rig.joints[src] && rig.joints[dst]) rig.joints[dst] = clone(rig.joints[src]);
      }
    });
  }

  function action(name){
    const s = state();
    const desc = descriptorFor(s);
    const draft = rigDraftFor(s);
    if (!desc || !draft) return;
    if (name === 'ghost') {
      ghost = !ghost;
      if (typeof core.setArtOpacity === 'function') core.setArtOpacity(ghost ? 0.28 : 1);
      renderUI();
      return;
    }
    if (name === 'copy-pair' && selectedJoint) {
      const pair = symmetryPair(desc,selectedJoint);
      if (!pair) return;
      editRig(`Copy ${labelFor(desc,selectedJoint)} to pair`, rig => {
        rig.joints[pair.other] = clone(rig.joints[selectedJoint]);
      });
    } else if (name === 'reset-joint' && selectedJoint) {
      const defaults = defaultRig(s);
      if (!defaults?.joints?.[selectedJoint]) return;
      editRig(`Reset ${labelFor(desc,selectedJoint)}`, rig => {
        rig.joints[selectedJoint] = clone(defaults.joints[selectedJoint]);
      });
    } else if (name === 'near-far') {
      pairCopy('nearFar');
    } else if (name === 'far-near') {
      pairCopy('farNear');
    } else if (name === 'ground') {
      editRig('Set paws to ground', rig => {
        for (const id of desc.groundContacts || []) if (rig.joints[id]) rig.joints[id].y = 0;
      });
    } else if (name === 'reset-rig') {
      const defaults = defaultRig(s);
      editRig('Reset rig to legacy proportions', rig => {
        const next = clone(defaults);
        rig.schema = next.schema;
        rig.family = next.family;
        rig.joints = next.joints;
      });
    }
  }

  section.addEventListener('click', ev => {
    const axisButton = ev.target.closest('[data-axis]');
    if (axisButton) { axis = axisButton.dataset.axis; renderUI(); return; }
    if (ev.target.closest('[data-fine]')) { fine = !fine; renderUI(); return; }
    const actionButton = ev.target.closest('[data-action]');
    if (actionButton) action(actionButton.dataset.action);
  });

  function unproject(render, x, y){
    if (!render?.view) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = (x - rect.left) * (canvas.width / rect.width);
    const sy = (y - rect.top) * (canvas.height / rect.height);
    const v = render.view;
    if (!Number.isFinite(v.scale) || !v.scale) return null;
    return {x:(sx-v.cx)/v.scale, y:(v.groundY-sy)/v.scale};
  }

  function nearestJoint(render,clientX,clientY){
    if (!render?.screenPoints) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX-rect.left)*(canvas.width/rect.width);
    const sy = (clientY-rect.top)*(canvas.height/rect.height);
    const radius = 30 * (canvas.width / rect.width);
    let best = null, bestD = radius*radius;
    for (const [id,p] of Object.entries(render.screenPoints)) {
      const d = (p.x-sx)**2 + (p.y-sy)**2;
      if (d <= bestD) { bestD=d; best=id; }
    }
    return best;
  }

  function onViewportDown(ev){
    const s = state();
    if (!isActive(s) || !lastRender) return;
    const id = nearestJoint(lastRender,ev.clientX,ev.clientY);
    if (!id) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    selectedJoint = id;
    const model = unproject(lastRender,ev.clientX,ev.clientY);
    const start = clone(rigDraftFor(s).joints[id]);
    viewportDrag = {
      pointerId:ev.pointerId,
      joint:id,
      tx:core.beginTransaction('setup',`Move ${labelFor(descriptorFor(s),id)}`),
      offset:model ? {x:start.x-model.x,y:start.y-model.y} : {x:0,y:0}
    };
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) {}
    renderUI();
  }

  function onViewportMove(ev){
    if (!viewportDrag || viewportDrag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const s = state();
    const model = unproject(lastRender,ev.clientX,ev.clientY);
    if (!model) return;
    setJointInTransaction(viewportDrag.tx,s,viewportDrag.joint,{
      x:model.x+viewportDrag.offset.x,
      y:model.y+viewportDrag.offset.y
    });
  }

  function finishViewport(ev,cancel){
    if (!viewportDrag || viewportDrag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const drag = viewportDrag;
    viewportDrag = null;
    if (cancel) core.cancelTransaction(drag.tx);
    else core.commitTransaction(drag.tx);
    try { canvas.releasePointerCapture(ev.pointerId); } catch (_) {}
    renderUI();
  }

  canvas.addEventListener('pointerdown',onViewportDown,true);
  canvas.addEventListener('pointermove',onViewportMove,true);
  canvas.addEventListener('pointerup',ev => finishViewport(ev,false),true);
  canvas.addEventListener('pointercancel',ev => finishViewport(ev,true),true);

  function precisionDown(ev){
    const s = state();
    if (!isActive(s) || !selectedJoint || !rigDraftFor(s).joints[selectedJoint]) return;
    ev.preventDefault();
    const start = clone(rigDraftFor(s).joints[selectedJoint]);
    precisionDrag = {
      pointerId:ev.pointerId,
      joint:selectedJoint,
      startX:ev.clientX,
      startY:ev.clientY,
      start,
      tx:core.beginTransaction('setup',`Move ${labelFor(descriptorFor(s),selectedJoint)}`)
    };
    try { pad.setPointerCapture(ev.pointerId); } catch (_) {}
  }

  function precisionMove(ev){
    if (!precisionDrag || precisionDrag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const s = state();
    const scale = lastRender?.view?.scale || Math.max(rect.width,rect.height);
    const pxScale = canvas.width / Math.max(1,rect.width);
    const sensitivity = (fine ? 0.25 : 1) * pxScale / Math.max(1,scale);
    let dx=(ev.clientX-precisionDrag.startX)*sensitivity;
    let dy=-(ev.clientY-precisionDrag.startY)*sensitivity;
    if (axis === 'x') dy=0;
    if (axis === 'y') dx=0;
    setJointInTransaction(precisionDrag.tx,s,precisionDrag.joint,{
      x:precisionDrag.start.x+dx,
      y:precisionDrag.start.y+dy
    });
  }

  function finishPrecision(ev,cancel){
    if (!precisionDrag || precisionDrag.pointerId !== ev.pointerId) return;
    ev.preventDefault();
    const drag=precisionDrag;
    precisionDrag=null;
    if (cancel) core.cancelTransaction(drag.tx);
    else core.commitTransaction(drag.tx);
    try { pad.releasePointerCapture(ev.pointerId); } catch (_) {}
    renderUI();
  }

  pad.addEventListener('pointerdown',precisionDown);
  pad.addEventListener('pointermove',precisionMove);
  pad.addEventListener('pointerup',ev=>finishPrecision(ev,false));
  pad.addEventListener('pointercancel',ev=>finishPrecision(ev,true));

  function renderer(args){
    const s = state();
    if (!isActive(s)) { lastRender=null; return; }
    const desc = descriptorFor(s);
    const rig = rigDraftFor(s);
    const {ctx,view,project} = args;
    if (!ctx || !view || typeof project !== 'function') return;

    const points = rig.joints;
    const screenPoints={};
    for (const [id,p] of Object.entries(points)) screenPoints[id]=project(p);
    lastRender={view,screenPoints};

    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';

    const groundY=project({x:0,y:0}).y;
    ctx.globalAlpha=.55;
    ctx.strokeStyle='rgba(140,185,215,.9)';
    ctx.lineWidth=Math.max(1,canvas.width/700);
    ctx.setLineDash([10,8]);
    ctx.beginPath();
    ctx.moveTo(0,groundY);
    ctx.lineTo(canvas.width,groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha=.95;
    ctx.strokeStyle='rgba(220,228,236,.92)';
    ctx.lineWidth=Math.max(2,canvas.width/380);
    for (const link of desc.boneLinks || []) {
      const a=Array.isArray(link)?link[0]:link.a;
      const b=Array.isArray(link)?link[1]:link.b;
      const p0=screenPoints[a],p1=screenPoints[b];
      if (!p0||!p1) continue;
      ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();
    }

    const r=Math.max(7,canvas.width/150);
    for (const [id,p] of Object.entries(screenPoints)) {
      const active=id===selectedJoint;
      ctx.globalAlpha=1;
      ctx.fillStyle=active?'rgba(255,196,92,1)':'rgba(44,54,64,.96)';
      ctx.strokeStyle=active?'rgba(255,239,195,1)':'rgba(238,244,249,.95)';
      ctx.lineWidth=Math.max(2,canvas.width/520);
      ctx.beginPath();ctx.arc(p.x,p.y,active?r*1.25:r,0,Math.PI*2);ctx.fill();ctx.stroke();
      if (active) {
        ctx.font=`${Math.max(12,canvas.width/72)}px system-ui,-apple-system,sans-serif`;
        ctx.textAlign='center';ctx.textBaseline='bottom';
        ctx.fillStyle='rgba(250,250,250,.98)';
        ctx.fillText(labelFor(desc,id),p.x,p.y-r*1.6);
      }
    }
    ctx.restore();
  }

  if (typeof core.registerPluginRenderer === 'function') core.registerPluginRenderer('rig-designer',renderer);
  if (typeof core.subscribe === 'function') core.subscribe(renderUI);
  renderUI();
})();
