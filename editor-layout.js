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
  }
  let dockRight = -1;

  function watch() {
    const mo = new MutationObserver(schedule);
    for (const id of [BASE_ID, ...DOCK_IDS]) {
      const el = byId(id);
      if (el) mo.observe(el, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
    }
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
