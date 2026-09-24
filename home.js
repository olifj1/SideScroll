(() => {
  const VERSION = '1.0.48';
  const PRELOAD_CACHE = `sidescroll-v${VERSION}`;
  const play = document.getElementById('ss-splash-play');
  const bar = document.getElementById('ss-preload-bar');
  const label = document.getElementById('ss-preload-label');
  const percent = document.getElementById('ss-preload-percent');
  const menuButton = document.getElementById('ss-splash-menu-button');
  const menu = document.getElementById('ss-splash-menu');

  const withVersion = path => `${path}${path.includes('?') ? '&' : '?'}v=${VERSION}`;
  const GAME_PRELOAD = [
    'style.css',
    'site-config.js',
    'core.js',
    'walk-rig.js',
    'puzzle-groups.js',
    'baked-game-design.js',
    'sidescroll.js',
    'terrain-dirt.png',
    'sidescroll-tree-atlas.png',
    'sidescroll-tree-01.png',
    'sidescroll-tree-02.png',
    'sidescroll-tree-03.png',
    'sidescroll-tree-04.png',
    'sidescroll-tree-05.png',
    'sidescroll-tree-06.png',
    'sidescroll-tree-07.png',
    'sidescroll-tree-08.png',
    'sidescroll-ground-01.png',
    'sidescroll-ground-02.png',
    'sidescroll-ground-03.png',
    'sidescroll-ground-04.png',
    'sidescroll-ground-05.png',
    'sidescroll-ground-06.png',
    'sidescroll-ground-07.png',
    'sidescroll-ground-08.png',
    'sidescroll-ground-09.png',
    'sidescroll-ground-10.png',
    'sidescroll-ground-11.png',
    'sidescroll-ground-12.png',
    'walklab-rig-v4.png',
    'walklab-rig-v4-alt-hero2.png',
    'walklab-character-source.png',
    'puzzle-log-a.png',
    'puzzle-log-b.png',
    'puzzle-log-c.png',
    'puzzle-log-d.png',
    'fallen-tree.png',
    'tree-stump.png',
    'broken-branch.png',
    'bridge-left.png',
    'bridge-right.png',
    'handcart-body.png',
    'handcart-wheel.png',
    'axle-pin.png',
    'counterweight-plank.png',
    'stone-wall.png',
    'stone-piece-a.png',
    'stone-piece-b.png',
    'stone-piece-c.png'
  ].map(withVersion);

  const setProgress = (done, total, failed = 0) => {
    const value = total ? Math.round((done / total) * 100) : 100;
    if (bar) bar.style.width = `${value}%`;
    if (percent) percent.textContent = `${value}%`;
    if (label) label.textContent = value >= 100
      ? (failed ? `Ready · ${failed} item${failed === 1 ? '' : 's'} will load on demand` : 'Ready')
      : 'Preparing world…';
  };

  const enablePlay = () => {
    if (!play) return;
    play.classList.remove('is-loading');
    play.classList.add('is-ready');
    play.setAttribute('aria-disabled', 'false');
  };

  const warmResource = async url => {
    const response = await fetch(url, { cache: 'force-cache', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    // Populate the exact release cache before the worker installs. This makes
    // the loading bar real useful work rather than a second download.
    if ('caches' in window) {
      try {
        const cache = await caches.open(PRELOAD_CACHE);
        await cache.put(url, response.clone());
      } catch (_) {}
    }
    // Consume the body so progress reflects a complete download rather than headers only.
    await response.blob();
  };

  const preload = async () => {
    if (!play || !bar || !label || !percent) return;
    let done = 0;
    let failed = 0;
    setProgress(0, GAME_PRELOAD.length);

    // A few parallel fetches are substantially quicker on iOS without flooding Safari.
    const queue = GAME_PRELOAD.slice();
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        try { await warmResource(url); }
        catch (error) { failed += 1; console.warn('SideScroll preload skipped:', url, error); }
        done += 1;
        setProgress(done, GAME_PRELOAD.length, failed);
      }
    };
    await Promise.all(Array.from({ length: Math.min(5, GAME_PRELOAD.length) }, worker));
    enablePlay();
    sessionStorage.setItem(`sidescroll-preloaded-${VERSION}`, '1');
  };

  play?.addEventListener('click', event => {
    if (play.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });

  const closeMenu = () => {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.classList.remove('active');
  };
  const openMenu = () => {
    if (!menu || !menuButton) return;
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.classList.add('active');
  };
  menuButton?.addEventListener('click', event => {
    event.stopPropagation();
    if (menu?.hidden) openMenu(); else closeMenu();
  });
  menu?.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('pointerdown', event => {
    if (!menu?.hidden && event.target !== menuButton && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  preload();
})();

(() => {
  const installButton = document.getElementById('ss-install');
  const overlay = document.getElementById('gh-install-overlay');
  const closeButton = document.getElementById('gh-install-close');
  const doneButton = document.getElementById('gh-install-done');
  const kicker = document.getElementById('gh-install-kicker');
  const copy = document.getElementById('gh-install-copy-text');
  const steps = document.getElementById('gh-install-steps');
  if (!installButton || !overlay) return;

  let deferredPrompt = null;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  const setVisible = visible => { installButton.hidden = !visible; };
  const closeGuide = () => {
    overlay.classList.remove('open');
    setTimeout(() => { overlay.hidden = true; }, 150);
  };
  const openGuide = kind => {
    const ios = kind === 'ios';
    const android = kind === 'android';
    kicker.textContent = ios ? 'IPHONE / IPAD' : android ? 'ANDROID' : 'INSTALL SIDESCROLL';
    copy.textContent = ios
      ? 'Install SideScroll as a web app to remove Safari’s address and tab bars.'
      : 'Add SideScroll to your Home screen so it opens like a standalone landscape app.';
    const labels = ios
      ? ['Tap the Share button in Safari.', 'Choose Add to Home Screen.', 'Make sure Open as Web App is turned on, then tap Add.']
      : android
        ? ['Open the browser menu (⋮).', 'Choose Install app or Add to Home screen.', 'Confirm the install.']
        : ['Open your browser menu.', 'Choose Install app or Add to Home screen.', 'Confirm the install.'];
    steps.innerHTML = labels.map((item, i) => `<div class="gh-install-step"><span>${i + 1}</span><strong>${item}</strong></div>`).join('');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('open'));
  };

  if (isStandalone()) return;
  setVisible(isIOS || isAndroid);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    setVisible(true);
  });
  window.addEventListener('appinstalled', () => setVisible(false));
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        setVisible(choice?.outcome !== 'accepted');
      } catch (_) {
        openGuide(isAndroid ? 'android' : 'generic');
      }
      return;
    }
    openGuide(isIOS ? 'ios' : isAndroid ? 'android' : 'generic');
  });
  closeButton?.addEventListener('click', closeGuide);
  doneButton?.addEventListener('click', closeGuide);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeGuide(); });
})();
