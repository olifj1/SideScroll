/*
 * In-panel colour picker (editor screen zones step 3, 26 Nov 2026).
 *
 * iPhone's own colour picker covers the whole screen, so you can't see a colour change while you
 * pick it. Every <input type="color"> on the game page gets a swatch instead; tapping it opens a
 * small picker *inside the panel*, under that row: hue, saturation and brightness bars, the recent
 * colours, a hex box and Done. The page's own input stays the place the value lives: the picker sets
 * its value and fires `input` while you drag (at most once a frame) and `change` when you let go, so
 * the code that listens to it is unchanged. Values set by code (a panel syncing, a Look blending)
 * update the swatch through the input's value setter.
 *
 * window.SideScrollColourPicker: attach(input), closeAll(). Recent colours: localStorage
 * `sidescroll.editor.recent-colours` (up to 8, this device only).
 */
(() => {
  'use strict';
  const RECENT_KEY = 'sidescroll.editor.recent-colours';
  const RECENT_MAX = 8;
  const valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const getVal = input => valueDesc.get.call(input);
  const setVal = (input, v) => valueDesc.set.call(input, v);

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const hexOk = h => /^#?[0-9a-f]{6}$/i.test(String(h || '').trim());
  const normHex = h => { const s = String(h || '').trim().replace(/^#?/, '#').toLowerCase(); return hexOk(s) ? s : null; };
  const hexToRgb = h => { const v = parseInt(normHex(h).slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const rgbToHex = rgb => '#' + rgb.map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('');
  function rgbToHsv([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h /= 6; if (h < 0) h += 1;
    }
    return { h, s: max ? d / max : 0, v: max };
  }
  function hsvToRgb({ h, s, v }) {
    const i = Math.floor(h * 6) % 6, f = h * 6 - Math.floor(h * 6);
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
    return [r * 255, g * 255, b * 255];
  }

  function loadRecent() {
    try { const a = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(a) ? a.map(normHex).filter(Boolean).slice(0, RECENT_MAX) : []; }
    catch (_) { return []; }
  }
  function pushRecent(hex) {
    const h = normHex(hex); if (!h) return;
    const list = [h, ...loadRecent().filter(x => x !== h)].slice(0, RECENT_MAX);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (_) {}
  }

  const pickers = [];
  function closeAll(except) { for (const p of pickers) if (p !== except) p.close(); }

  function attach(input) {
    if (!input || input.dataset.inlinePicker) return null;
    input.dataset.inlinePicker = '1';
    input.classList.add('ss-colour-native');
    const label = input.closest('label') || input.parentElement;

    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'ss-colour-swatch';
    swatch.setAttribute('aria-expanded', 'false');
    input.after(swatch);

    const panel = document.createElement('div');
    panel.className = 'ss-colour-picker';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ss-cp-bar ss-cp-hue" data-k="h" aria-label="Hue"><i></i></div>
      <div class="ss-cp-bar ss-cp-sat" data-k="s" aria-label="Saturation"><i></i></div>
      <div class="ss-cp-bar ss-cp-val" data-k="v" aria-label="Brightness"><i></i></div>
      <div class="ss-cp-recent" aria-label="Recent colours"></div>
      <div class="ss-cp-foot"><input class="ss-cp-hex" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Hex colour"><button type="button" class="ss-cp-done">DONE</button></div>`;
    label.after(panel);
    const bars = { h: panel.querySelector('.ss-cp-hue'), s: panel.querySelector('.ss-cp-sat'), v: panel.querySelector('.ss-cp-val') };
    const hexBox = panel.querySelector('.ss-cp-hex');
    const recentBox = panel.querySelector('.ss-cp-recent');

    let hsv = rgbToHsv(hexToRgb(normHex(getVal(input)) || '#ffffff'));
    let lastSent = null;
    let frame = 0;
    let dirty = false;
    let dragging = false; // while a bar is held, values written by code don't move the bars

    function paint() {
      const hex = rgbToHex(hsvToRgb(hsv));
      swatch.style.background = hex;
      swatch.setAttribute('aria-label', `Colour ${hex}`);
      const pure = rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 }));
      bars.s.style.background = `linear-gradient(90deg, ${rgbToHex(hsvToRgb({ h: hsv.h, s: 0, v: hsv.v }))}, ${rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: hsv.v }))})`;
      bars.v.style.background = `linear-gradient(90deg, #000, ${rgbToHex(hsvToRgb({ h: hsv.h, s: hsv.s, v: 1 }))})`;
      bars.h.querySelector('i').style.left = `${hsv.h * 100}%`;
      bars.s.querySelector('i').style.left = `${hsv.s * 100}%`;
      bars.v.querySelector('i').style.left = `${hsv.v * 100}%`;
      bars.h.querySelector('i').style.background = pure;
      if (document.activeElement !== hexBox) hexBox.value = hex.toUpperCase();
    }
    function send(final) {
      frame = 0;
      const hex = rgbToHex(hsvToRgb(hsv));
      if (hex !== normHex(getVal(input)) || (dragging && hex !== lastSent)) {
        lastSent = hex;
        setVal(input, hex);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        dirty = true;
      }
      if (final && dirty) {
        dirty = false;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        pushRecent(hex); renderRecent();
      }
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(() => send(false)); };
    // A value set by code: show it, unless it is the one we just sent (keeps the hue of greys).
    function fromInput() {
      if (dragging) return;
      const h = normHex(getVal(input)); if (!h) return;
      if (h === lastSent || h === rgbToHex(hsvToRgb(hsv))) { paint(); return; }
      hsv = rgbToHsv(hexToRgb(h)); paint();
    }
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() { return getVal(input); },
      set(v) { setVal(input, v); fromInput(); }
    });

    function renderRecent() {
      recentBox.textContent = '';
      for (const h of loadRecent()) {
        const b = document.createElement('button');
        b.type = 'button'; b.style.background = h; b.setAttribute('aria-label', `Use ${h}`);
        b.addEventListener('click', e => { e.preventDefault(); hsv = rgbToHsv(hexToRgb(h)); paint(); send(true); });
        recentBox.appendChild(b);
      }
      recentBox.hidden = !recentBox.childElementCount;
    }

    for (const [k, bar] of Object.entries(bars)) {
      let id = null;
      const at = e => { const r = bar.getBoundingClientRect(); hsv[k] = clamp01((e.clientX - r.left) / Math.max(1, r.width)); if (k === 'h' && hsv[k] >= 1) hsv[k] = 0.9999; paint(); queue(); };
      bar.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); id = e.pointerId; dragging = true; try { bar.setPointerCapture(id); } catch (_) {} bar.classList.add('dragging'); at(e); });
      bar.addEventListener('pointermove', e => { if (e.pointerId === id) { e.preventDefault(); at(e); } });
      const end = e => { if (e.pointerId !== id) return; id = null; bar.classList.remove('dragging'); if (frame) cancelAnimationFrame(frame); send(true); dragging = false; };
      bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
    }
    hexBox.addEventListener('input', () => { const h = normHex(hexBox.value); if (h) { hsv = rgbToHsv(hexToRgb(h)); paint(); queue(); } });
    hexBox.addEventListener('change', () => { const h = normHex(hexBox.value); if (h) { hsv = rgbToHsv(hexToRgb(h)); send(true); } paint(); });

    const api = {
      open() {
        closeAll(api); fromInput(); renderRecent();
        panel.hidden = false; swatch.setAttribute('aria-expanded', 'true'); swatch.classList.add('open');
        panel.scrollIntoView?.({ block: 'nearest' });
      },
      close() {
        if (panel.hidden) return;
        if (frame) { cancelAnimationFrame(frame); send(true); } else if (dirty) send(true);
        panel.hidden = true; swatch.setAttribute('aria-expanded', 'false'); swatch.classList.remove('open');
      },
      toggle() { panel.hidden ? api.open() : api.close(); }
    };
    panel.querySelector('.ss-cp-done').addEventListener('click', e => { e.preventDefault(); api.close(); });
    swatch.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); api.toggle(); });
    // Tapping the row's label would open iPhone's picker: open ours instead.
    input.addEventListener('click', e => { e.preventDefault(); api.toggle(); });
    for (const el of [swatch, panel]) el.addEventListener('pointerdown', e => e.stopPropagation());
    // A panel that closes (hidden) closes its picker.
    const host = input.closest('aside, [id$="-editor"], [id$="-panel"]');
    if (host) new MutationObserver(() => { if (host.hidden) api.close(); }).observe(host, { attributes: true, attributeFilter: ['hidden'] });
    paint();
    pickers.push(api);
    return api;
  }

  function attachAll(root = document) { for (const input of root.querySelectorAll('input[type="color"]')) attach(input); }
  window.SideScrollColourPicker = { attach, attachAll, closeAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => attachAll(), { once: true });
  else attachAll();
})();
