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
      ? 'Apple keeps the final Add to Home Screen step in the browser Share menu.'
      : 'Add SideScroll to your Home screen so it opens like a standalone landscape app.';
    const labels = ios
      ? ['Tap the Share button in Safari.', 'Choose Add to Home Screen.', 'Tap Add to confirm.']
      : android
        ? ['Open the browser menu (⋮).', 'Choose Install app or Add to Home screen.', 'Confirm the install.']
        : ['Open your browser menu.', 'Choose Install app or Add to Home screen.', 'Confirm the install.'];
    steps.innerHTML = labels.map((label, i) => `<div class="gh-install-step"><span>${i + 1}</span><strong>${label}</strong></div>`).join('');
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
