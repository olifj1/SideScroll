/*
 * Editor screen zones (26 Nov 2026). The rules are in docs/SIDESCROLL_ENGINE_UX_BIBLE.md → Screen zones.
 *
 *  - Top strip: Home / Menu on the left, the TEST bar on the right.
 *  - The dock: one rectangle on the left (the editor drawer's place). Every panel you edit in
 *    (asset browser, Position, Floor line, Thought / Camera / Light node, Light, Fog, Post, Looks,
 *    Sound, …) opens *in the dock*, one at a time. A panel opened while another is showing goes on
 *    top; closing it brings back the one underneath (the drawer is always at the bottom). Panels
 *    underneath keep their state; they are only hidden (class `ss-dock-under`).
 *  - The rest of the screen is the scene. The selected object's toolbar runs along the bottom,
 *    from the dock's right edge (`--ss-dock-right`, kept here) to the screen's right edge.
 *
 * Each panel keeps its own open / close code; this file only watches which ones are showing.
 * New panels that you edit in belong in DOCK_IDS (and nowhere on the right).
 */
(() => {
  'use strict';
  const BASE_ID = 'sidescroll-puzzle-panel'; // the editor drawer: always the bottom of the stack
  const DOCK_IDS = [
    'sidescroll-editor-palette', 'sidescroll-transform-editor', 'sidescroll-ground-line-editor',
    'sidescroll-thought-editor', 'sidescroll-camera-node-editor', 'sidescroll-light-node-editor',
    'sidescroll-camera-editor', 'sidescroll-quick-nav-panel',
    'sidescroll-light-panel', 'sidescroll-fog-panel', 'sidescroll-post-panel', 'sidescroll-looks-panel',
    'sidescroll-sound-panel'
  ];
  const byId = id => document.getElementById(id);
  const shown = el => !!el && el.isConnected && !el.hidden && getComputedStyle(el).display !== 'none';
  const setClass = (el, name, on) => { if (el.classList.contains(name) !== on) el.classList.toggle(name, on); };

  // ---- Object toolbar: one row; what doesn't fit goes behind More (a second row above) ----
  const BAR_ID = 'sidescroll-editor-controls';
  // First to move behind More when the row is too narrow (least used first); the rest go from the end.
  const OVERFLOW_FIRST = [
    'sidescroll-editor-collision-use-asset', 'sidescroll-editor-collision-save-asset', 'sidescroll-editor-collision-remove',
    'sidescroll-editor-socket-clear', 'sidescroll-editor-game-layer', 'sidescroll-editor-ground-line',
    'sidescroll-editor-collision', 'sidescroll-editor-duplicate', 'sidescroll-editor-flip'
  ];
  let moreOpen = false;
  let moreBtn = null;
  function ensureMore(bar) {
    if (moreBtn && moreBtn.isConnected) return moreBtn;
    moreBtn = document.createElement('button');
    moreBtn.type = 'button'; moreBtn.id = 'sidescroll-editor-more'; moreBtn.className = 'sidescroll-editor-tool sidescroll-editor-more';
    moreBtn.innerHTML = '<span>⋯</span><small>MORE</small>';
    moreBtn.hidden = true;
    const toggle = e => { e.preventDefault(); e.stopPropagation(); moreOpen = !moreOpen; fitToolbar(); };
    moreBtn.addEventListener('pointerdown', e => e.stopPropagation());
    moreBtn.addEventListener('click', toggle);
    bar.appendChild(moreBtn);
    // Using a tool from the second row closes it.
    bar.addEventListener('click', e => {
      const tool = e.target.closest?.('.sidescroll-editor-tool');
      if (tool && tool !== moreBtn && tool.classList.contains('ss-overflowed') && moreOpen) { moreOpen = false; requestAnimationFrame(fitToolbar); }
    });
    return moreBtn;
  }
  function fitToolbar() {
    const bar = byId(BAR_ID); if (!bar) return;
    const more = ensureMore(bar);
    const tools = [...bar.querySelectorAll('.sidescroll-editor-tool')].filter(t => t !== more && !t.hidden);
    for (const t of bar.querySelectorAll('.ss-overflowed')) t.classList.remove('ss-overflowed');
    if (bar.hidden || !tools.length) { more.hidden = true; setClass(bar, 'ss-more-open', false); return; }
    const gap = parseFloat(getComputedStyle(bar).columnGap) || 5;
    const w = t => (t.getBoundingClientRect().width || 58) + gap;
    const room = bar.clientWidth;
    let total = tools.reduce((n, t) => n + w(t), 0);
    const out = [];
    if (total > room) {
      total += w(more.hidden ? tools[0] : more);
      const del = byId('sidescroll-editor-delete');
      const order = [...OVERFLOW_FIRST.map(byId).filter(t => t && tools.includes(t)),
        ...tools.slice().reverse().filter(t => t !== del), ...(tools.includes(del) ? [del] : [])];
      for (const t of order) {
        if (total <= room) break;
        if (out.includes(t)) continue;
        out.push(t); total -= w(t);
      }
    }
    for (const t of out) t.classList.add('ss-overflowed');
    more.hidden = !out.length;
    // Estimates can be a few px out (padding, gaps): measure the real row and move more if needed.
    if (out.length && !moreOpen) {
      const del = byId('sidescroll-editor-delete');
      const rest = [...OVERFLOW_FIRST.map(byId).filter(t => t && tools.includes(t)),
        ...tools.slice().reverse().filter(t => t !== del), ...(tools.includes(del) ? [del] : [])].filter(t => !out.includes(t));
      while (bar.scrollWidth > bar.clientWidth + 1 && rest.length > 1) { const t = rest.shift(); out.push(t); t.classList.add('ss-overflowed'); }
    }
    if (!out.length) moreOpen = false;
    setClass(more, 'active', moreOpen);
    const label = more.querySelector('small'); if (label) label.textContent = moreOpen ? 'LESS' : `MORE (${out.length})`;
    setClass(bar, 'ss-more-open', moreOpen && !!out.length);
  }

  let order = []; // docked panels that are showing, oldest first; the last one is on top
  let top = null;
  let scheduled = false;
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(sync); } }

  function sync() {
    scheduled = false;
    const open = [];
    for (const id of DOCK_IDS) {
      const el = byId(id); if (!el) continue;
      setClass(el, 'ss-docked', true);
      // A panel hidden *by us* still counts as open.
      if (shown(el)) open.push(id);
    }
    order = order.filter(id => open.includes(id));
    for (const id of open) if (!order.includes(id)) order.push(id);
    const base = byId(BASE_ID);
    top = order[order.length - 1] || (shown(base) ? BASE_ID : null);
    for (const id of [BASE_ID, ...DOCK_IDS]) {
      const el = byId(id); if (!el) continue;
      setClass(el, 'ss-dock-under', !!top && id !== top && (id === BASE_ID || order.includes(id)));
      setClass(el, 'ss-dock-top', id === top);
    }
    setClass(document.body, 'ss-dock-swapped', !!top && top !== BASE_ID);
    const r = top ? byId(top).getBoundingClientRect() : null;
    const right = r && r.width > 0 ? Math.round(r.right) : 0;
    if (right !== dockRight) {
      dockRight = right;
      document.documentElement.style.setProperty('--ss-dock-right', `${right}px`);
    }
    fitToolbar();
  }
  let dockRight = -1;

  function watch() {
    const mo = new MutationObserver(schedule);
    for (const id of [BASE_ID, ...DOCK_IDS]) {
      const el = byId(id);
      if (el) mo.observe(el, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
    }
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const bar = byId(BAR_ID);
    if (bar) mo.observe(bar, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
    addEventListener('resize', schedule);
    addEventListener('orientationchange', schedule);
    // The drawer's width can change without an attribute change (collapse animation).
    byId(BASE_ID)?.addEventListener('transitionend', schedule);
    sync();
  }

  window.SideScrollEditorLayout = {
    /** Screen x (CSS px) where the scene's free area starts: right of the dock, or 0. */
    clearLeft: () => Math.max(0, dockRight),
    /** Id of the panel on top of the dock (or null). */
    top: () => top,
    refresh: schedule
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
})();
