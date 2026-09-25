(() => {
  'use strict';

  // SideScroll v1.0.56 — lightweight Web Audio music engine.
  // Music is cached before launch, decoded asynchronously, and only unlocked
  // after a genuine user gesture so iOS/Safari never needs brittle autoplay.

  const VERSION = '1.0.56';
  const MUSIC_URL = `sidescroll-music.m4a?v=${VERSION}`;
  const STORAGE_KEY = 'sidescroll.audio.settings.v1';
  const DEFAULTS = Object.freeze({ musicEnabled: true, musicVolume: 0.32 });
  const LOOP_CROSSFADE_SECONDS = 0.03;
  const START_FADE_SECONDS = 0.18;
  const STOP_FADE_SECONDS = 0.10;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let volumeGain = null;
  let envelopeGain = null;
  let musicBuffer = null;
  let musicSource = null;
  let preparePromise = null;
  let unlocked = false;
  let wantsMusic = true;
  let hiddenPause = false;
  let startContextTime = 0;
  let startOffset = 0;
  let pausedOffset = 0;
  let lastError = null;
  let sourceToken = 0;

  const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
  const loadSettings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return {
        musicEnabled: typeof raw?.musicEnabled === 'boolean' ? raw.musicEnabled : DEFAULTS.musicEnabled,
        musicVolume: Number.isFinite(raw?.musicVolume) ? clamp01(raw.musicVolume) : DEFAULTS.musicVolume
      };
    } catch (_) {
      return { ...DEFAULTS };
    }
  };
  const settings = loadSettings();
  wantsMusic = settings.musicEnabled;

  const saveSettings = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
    catch (_) {}
  };

  const emitState = () => {
    window.dispatchEvent(new CustomEvent('sidescroll-audio-state', { detail: getState() }));
  };

  const createContext = () => {
    if (context || !AudioContextCtor) return context;
    try {
      context = new AudioContextCtor({ latencyHint: 'interactive' });
    } catch (_) {
      try { context = new AudioContextCtor(); }
      catch (error) { lastError = error; emitState(); return null; }
    }

    volumeGain = context.createGain();
    envelopeGain = context.createGain();
    volumeGain.gain.value = settings.musicVolume;
    envelopeGain.gain.value = 0;
    envelopeGain.connect(volumeGain);
    volumeGain.connect(context.destination);
    context.addEventListener?.('statechange', emitState);
    return context;
  };

  // Build a loop-safe copy in memory. The final few milliseconds are blended
  // into the opening samples, then playback wraps to the corresponding point
  // near the start. This removes the hard AAC seam without re-encoding the file.
  const makeLoopBuffer = input => {
    const ctx = createContext();
    if (!ctx || !input || input.length < 8) return input;
    const blendFrames = Math.max(1, Math.min(
      Math.round(input.sampleRate * LOOP_CROSSFADE_SECONDS),
      Math.floor(input.length / 8)
    ));
    if (blendFrames < 2 || input.length <= blendFrames * 2) return input;

    const middleFrames = input.length - (blendFrames * 2);
    const outputLength = input.length - blendFrames;
    const output = ctx.createBuffer(input.numberOfChannels, outputLength, input.sampleRate);

    for (let channel = 0; channel < input.numberOfChannels; channel += 1) {
      const src = input.getChannelData(channel);
      const dst = output.getChannelData(channel);
      dst.set(src.subarray(blendFrames, input.length - blendFrames), 0);
      const blendStart = middleFrames;
      for (let i = 0; i < blendFrames; i += 1) {
        const t = (i + 1) / blendFrames;
        dst[blendStart + i] = src[input.length - blendFrames + i] * (1 - t) + src[i] * t;
      }
    }
    return output;
  };

  const decodeAudio = async arrayBuffer => {
    const ctx = createContext();
    if (!ctx) throw new Error('Web Audio is not available on this device.');
    // Promise form is current; the callback path keeps older WebKit builds happy.
    const bytes = arrayBuffer.slice(0);
    try {
      const result = ctx.decodeAudioData(bytes);
      if (result && typeof result.then === 'function') return await result;
    } catch (_) {
      // Fall through to the callback form below.
    }
    return await new Promise((resolve, reject) => {
      try { ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject); }
      catch (error) { reject(error); }
    });
  };

  const prepare = () => {
    if (preparePromise) return preparePromise;
    createContext();
    preparePromise = (async () => {
      try {
        const response = await fetch(MUSIC_URL, { cache: 'force-cache', credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Music load failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        const decoded = await decodeAudio(bytes);
        musicBuffer = makeLoopBuffer(decoded);
        lastError = null;
        emitState();
        if (unlocked && wantsMusic && !document.hidden) startMusic(pausedOffset);
        return musicBuffer;
      } catch (error) {
        lastError = error;
        console.warn('SideScroll audio:', error);
        emitState();
        return null;
      }
    })();
    return preparePromise;
  };

  const currentOffset = () => {
    if (!musicBuffer) return 0;
    if (!musicSource || !context || context.state !== 'running') return pausedOffset % musicBuffer.duration;
    const elapsed = Math.max(0, context.currentTime - startContextTime);
    return (startOffset + elapsed) % musicBuffer.duration;
  };

  const disconnectSource = source => {
    try { source?.disconnect(); } catch (_) {}
  };

  const stopSource = ({ preserveOffset = false, fade = true } = {}) => {
    if (preserveOffset) pausedOffset = currentOffset();
    else pausedOffset = 0;
    if (!musicSource || !context) { emitState(); return; }

    const source = musicSource;
    musicSource = null;
    sourceToken += 1;
    const now = context.currentTime;
    const stopAt = fade && context.state === 'running' ? now + STOP_FADE_SECONDS + 0.01 : now;
    try {
      envelopeGain.gain.cancelScheduledValues(now);
      envelopeGain.gain.setValueAtTime(envelopeGain.gain.value, now);
      if (fade && context.state === 'running') envelopeGain.gain.linearRampToValueAtTime(0, now + STOP_FADE_SECONDS);
      else envelopeGain.gain.setValueAtTime(0, now);
      source.stop(stopAt);
    } catch (_) {
      try { source.stop(); } catch (_) {}
    }
    window.setTimeout(() => disconnectSource(source), Math.ceil((STOP_FADE_SECONDS + 0.08) * 1000));
    emitState();
  };

  const startMusic = (offset = 0) => {
    if (!unlocked || !wantsMusic || document.hidden || !musicBuffer) return false;
    const ctx = createContext();
    if (!ctx || ctx.state !== 'running') return false;
    if (musicSource) return true;

    const source = ctx.createBufferSource();
    source.buffer = musicBuffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = musicBuffer.duration;
    source.connect(envelopeGain);

    const normalizedOffset = ((Number(offset) || 0) % musicBuffer.duration + musicBuffer.duration) % musicBuffer.duration;
    const now = ctx.currentTime;
    const token = ++sourceToken;
    envelopeGain.gain.cancelScheduledValues(now);
    envelopeGain.gain.setValueAtTime(0, now);
    envelopeGain.gain.linearRampToValueAtTime(1, now + START_FADE_SECONDS);
    try {
      source.start(now, normalizedOffset);
    } catch (error) {
      disconnectSource(source);
      lastError = error;
      emitState();
      return false;
    }

    musicSource = source;
    startContextTime = now;
    startOffset = normalizedOffset;
    pausedOffset = normalizedOffset;
    source.onended = () => {
      if (token !== sourceToken) return;
      disconnectSource(source);
      if (musicSource === source) musicSource = null;
      emitState();
    };
    emitState();
    return true;
  };

  const unlock = async () => {
    if (!AudioContextCtor) { lastError = new Error('Web Audio is not supported.'); emitState(); return false; }
    const ctx = createContext();
    prepare();
    try {
      if (ctx.state !== 'running') await ctx.resume();
      unlocked = ctx.state === 'running';
      lastError = null;
      if (unlocked && wantsMusic && !document.hidden) startMusic(pausedOffset);
      emitState();
      return unlocked;
    } catch (error) {
      lastError = error;
      emitState();
      return false;
    }
  };

  const setMusicEnabled = enabled => {
    settings.musicEnabled = !!enabled;
    wantsMusic = settings.musicEnabled;
    saveSettings();
    if (!wantsMusic) stopSource({ preserveOffset: true, fade: true });
    else {
      prepare();
      if (unlocked && !document.hidden) startMusic(pausedOffset);
    }
    emitState();
  };

  const setMusicVolume = value => {
    settings.musicVolume = clamp01(value);
    saveSettings();
    const ctx = createContext();
    if (ctx && volumeGain) {
      const now = ctx.currentTime;
      volumeGain.gain.cancelScheduledValues(now);
      volumeGain.gain.setTargetAtTime(settings.musicVolume, now, 0.025);
    }
    emitState();
  };

  const suspendForHidden = async () => {
    if (document.hidden) {
      hiddenPause = !!musicSource;
      if (musicSource) stopSource({ preserveOffset: true, fade: false });
      try { if (context?.state === 'running') await context.suspend(); } catch (_) {}
      emitState();
      return;
    }

    if (!unlocked || !wantsMusic) { hiddenPause = false; emitState(); return; }
    try {
      if (context && context.state !== 'running') await context.resume();
      if (hiddenPause || wantsMusic) startMusic(pausedOffset);
    } catch (_) {
      // If WebKit requires another gesture after an interruption, the global
      // gesture unlock below will resume it on the next touch without errors.
    }
    hiddenPause = false;
    emitState();
  };

  const hardStop = () => {
    stopSource({ preserveOffset: false, fade: false });
    wantsMusic = settings.musicEnabled;
    hiddenPause = false;
    try { if (context?.state === 'running') context.suspend(); } catch (_) {}
  };

  function getState() {
    const supported = !!AudioContextCtor;
    let status = 'Preparing music…';
    if (!supported) status = 'Audio is not supported on this device';
    else if (lastError) status = 'Music could not be loaded';
    else if (!settings.musicEnabled) status = 'Music off';
    else if (!musicBuffer) status = unlocked ? 'Loading music…' : 'Music readying · starts on first tap';
    else if (!unlocked) status = 'Ready · starts on first game tap';
    else if (document.hidden) status = 'Paused while the game is in the background';
    else if (musicSource) status = 'Music playing';
    else if (context?.state !== 'running') status = 'Paused · tap the game to resume';
    else status = 'Music ready';
    return {
      supported,
      status,
      unlocked,
      contextState: context?.state || 'uninitialized',
      prepared: !!musicBuffer,
      playing: !!musicSource,
      musicEnabled: settings.musicEnabled,
      musicVolume: settings.musicVolume,
      error: lastError ? String(lastError.message || lastError) : null
    };
  }

  const isGameDocument = () => document.documentElement.classList.contains('ss-game-page') || document.body?.classList.contains('ss-standalone-game');
  const unlockFromGesture = () => { if (isGameDocument()) unlock(); };
  window.addEventListener('pointerdown', unlockFromGesture, { capture: true, passive: true });
  window.addEventListener('keydown', unlockFromGesture, { capture: true });
  document.addEventListener('visibilitychange', suspendForHidden);
  window.addEventListener('pagehide', hardStop);

  window.SideScrollAudio = Object.freeze({
    prepare,
    unlock,
    setMusicEnabled,
    setMusicVolume,
    getState,
    stop: hardStop
  });

  // Warm the cached file and decode it without blocking game boot/rendering.
  // requestIdleCallback keeps the initial visual reveal first when available.
  const warm = () => prepare();
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 900 });
  else window.setTimeout(warm, 0);
  emitState();
})();
