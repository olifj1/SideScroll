/* SideScroll asset paths and versions.
 * Art and audio live in assets/. Code, bundled data and players' saved data keep
 * referring to them by bare filename (e.g. 'quadruped-deform-atlas-v2.png?v=1.1.25'),
 * so identifiers never change; only the URL used to load a file is resolved here.
 * Anything that already has a folder, a scheme (data:, blob:, https:) or is not
 * an art/audio file is returned unchanged, so calling this twice is harmless.
 *
 * ASSET_VERSIONS is the single source of truth for each file's ?v= cache-buster.
 * Images and audio are cache-first in sw.js, so every page must request a file
 * with the same URL or it is downloaded (and stored) again. A listed file always
 * gets its version from here, whatever query the caller passed. When you replace
 * a file's artwork, bump its version here and nowhere else. Unlisted files keep
 * the query the caller gave.
 */
(() => {
  'use strict';
  const ASSET_DIR = 'assets/';
  const ART_FILE = /\.(?:png|jpe?g|webp|gif|m4a|mp3|wav|ogg)(?:[?#]|$)/i;

  const VERSIONED = {
    '1.0.62': [
      'axle-pin.png', 'bridge-left.png', 'bridge-right.png', 'broken-branch.png',
      'counterweight-plank.png', 'fallen-tree.png', 'handcart-body.png',
      'handcart-wheel.png', 'puzzle-log-a.png', 'puzzle-log-b.png', 'puzzle-log-c.png',
      'puzzle-log-d.png', 'sidescroll-ground-01.png', 'sidescroll-ground-02.png',
      'sidescroll-ground-03.png', 'sidescroll-ground-04.png', 'sidescroll-ground-05.png',
      'sidescroll-ground-06.png', 'sidescroll-ground-07.png', 'sidescroll-ground-08.png',
      'sidescroll-ground-09.png', 'sidescroll-ground-10.png', 'sidescroll-ground-11.png',
      'sidescroll-ground-12.png', 'sidescroll-music.m4a', 'splash-screen.png',
      'stone-piece-a.png', 'stone-piece-b.png', 'stone-piece-c.png', 'stone-wall.png',
      'terrain-dirt.png', 'tree-stump.png', 'walklab-character-source.png',
      'walklab-rig-v4-alt-b.png', 'walklab-rig-v4.png'
    ],
    '1.0.83': [
      'mountain-cliff-01.png', 'mountain-cliff-02.png', 'mountain-cliff-03.png',
      'mountain-cliff-04.png', 'mountain-grass-01.png', 'mountain-grass-02.png',
      'mountain-grass-03.png', 'mountain-rock-01.png', 'mountain-rock-02.png',
      'mountain-rock-03.png', 'mountain-rock-04.png', 'mountain-tree-01.png',
      'mountain-tree-02.png'
    ],
    '1.0.90': [
      'sidescroll-tree-01.png', 'sidescroll-tree-02.png', 'sidescroll-tree-03.png',
      'sidescroll-tree-04.png', 'sidescroll-tree-05.png', 'sidescroll-tree-06.png',
      'sidescroll-tree-07.png', 'sidescroll-tree-08.png'
    ],
    '1.0.93': [
      'mountain-climb-rock-01.png'
    ],
    '1.0.102': [
      'settlement-fence-01.png', 'settlement-fence-02.png', 'settlement-fence-03.png',
      'settlement-house-01.png', 'settlement-house-02.png', 'settlement-house-03.png',
      'settlement-house-04.png', 'settlement-house-05.png', 'settlement-house-06.png',
      'settlement-roof-01.png', 'settlement-roof-02.png', 'settlement-roof-03.png',
      'settlement-roof-04.png', 'settlement-wall-01.png', 'settlement-wall-02.png',
      'settlement-wall-03.png'
    ],
    '1.0.139': [
      'terrain-surface-mountain-trail.png', 'terrain-surface-pale-gravel.png',
      'terrain-surface-rocky-gravel.png', 'terrain-surface-snow-ground.png',
      'terrain-surface-village-cobble.png', 'terrain-surface-wetland-mud.png',
      'terrain-surface-woodland-soil.png'
    ],
    '1.0.141': [
      'quadruped-source-v1.png'
    ],
    '1.0.163': [
      'quadruped-reference.png', 'quadruped-parts-atlas-v3.png'
    ],
    '1.0.173': [
      'quadruped-deform-atlas-v2.png'
    ]
  };
  // Files renamed so no file is named after a character. Saved data and older
  // exports still use the old names, so they keep resolving here.
  const RENAMED = {
    'fox-deform-atlas-v2.png': 'quadruped-deform-atlas-v2.png',
    'fox-rig-atlas-v3.png': 'quadruped-parts-atlas-v3.png',
    'fox-rig-atlas-v1.png': 'quadruped-parts-atlas-v1.png',
    'fox-reference-charcoal.png': 'quadruped-reference.png',
    'fox-character-source-v1.png': 'quadruped-source-v1.png',
    'walklab-rig-v4-alt-hero2.png': 'walklab-rig-v4-alt-b.png'
  };
  const ASSET_VERSIONS = {};
  for (const [version, files] of Object.entries(VERSIONED)) {
    for (const file of files) ASSET_VERSIONS[file] = version;
  }

  function assetPath(url) {
    if (typeof url !== 'string' || !url) return url;
    const bare = url.startsWith('./') ? url.slice(2) : url;
    const named = bare.split(/[?#]/)[0];
    if (named.includes('/') || named.includes(':') || !ART_FILE.test(bare)) return url;
    const file = RENAMED[named] || named;
    const version = ASSET_VERSIONS[file];
    return ASSET_DIR + (version ? `${file}?v=${version}` : file + bare.slice(named.length));
  }

  window.SideScrollAssetPath = assetPath;
  window.SideScrollAssetRename = name => RENAMED[name] || name;
  window.SideScrollAssetVersions = Object.freeze(ASSET_VERSIONS);
})();
