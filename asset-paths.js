/* SideScroll asset paths.
 * Art and audio live in assets/. Code, bundled data and players' saved data keep
 * referring to them by bare filename (e.g. 'fox-deform-atlas-v2.png?v=1.1.25'),
 * so identifiers never change; only the URL used to load a file is resolved here.
 * Anything that already has a folder, a scheme (data:, blob:, https:) or is not
 * an art/audio file is returned unchanged, so calling this twice is harmless.
 */
(() => {
  'use strict';
  const ASSET_DIR = 'assets/';
  const ART_FILE = /\.(?:png|jpe?g|webp|gif|m4a|mp3|wav|ogg)(?:[?#]|$)/i;

  function assetPath(url) {
    if (typeof url !== 'string' || !url) return url;
    const bare = url.startsWith('./') ? url.slice(2) : url;
    const file = bare.split(/[?#]/)[0];
    if (file.includes('/') || file.includes(':') || !ART_FILE.test(bare)) return url;
    return ASSET_DIR + bare;
  }

  window.SideScrollAssetPath = assetPath;
})();
