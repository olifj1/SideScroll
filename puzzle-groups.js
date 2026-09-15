window.SideScrollPuzzleConfig = {
  version: 1,

  // Asset packs are named here rather than hard-wired into a puzzle.  The
  // current pack is generated greybox art; later we can swap these entries to
  // atlas-backed art without changing any puzzle layout definitions.
  assetPacks: {
    "woodland-puzzle-greybox-v1": {
      assets: [
        { name: "puzzle-crate-a", generator: "crateA", aspect: 1.05 },
        { name: "puzzle-crate-b", generator: "crateB", aspect: 1.05 },
        { name: "puzzle-crate-c", generator: "crateC", aspect: 1.05 },
        { name: "fallen-tree", generator: "fallenTree", aspect: 1.34 },
        { name: "log-short", generator: "logShort", aspect: 2.45 },
        { name: "log-long", generator: "logLong", aspect: 3.55 },
        { name: "barrel", generator: "barrel", aspect: 0.72 }
      ]
    }
  },

  groups: {
    FALLEN_TREE_TEST: {
      label: "Fallen tree test",
      width: 11.0,
      assetPacks: ["woodland-puzzle-greybox-v1"],

      // Procedural dressing inside this local box is hidden while the group is
      // active.  The distant forest remains, so the puzzle still feels embedded
      // in the same continuous woodland rather than placed on a blank stage.
      exclusion: { minX: -4.2, maxX: 5.0, minZ: -7.0, maxZ: 7.2 },
      entryX: -4.4,
      exitX: 4.8,

      props: [
        {
          id: "crate-a",
          asset: "puzzle-crate-a",
          x: -3.05, z: 0,
          width: 0.96, height: 0.88,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.43, height: 0.845, depth: 0.82, platform: true }
        },
        {
          id: "crate-b",
          asset: "puzzle-crate-b",
          x: -1.92, z: 0,
          width: 0.96, height: 0.88,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.43, height: 0.845, depth: 0.82, platform: true }
        },
        {
          id: "crate-c",
          asset: "puzzle-crate-c",
          x: -0.78, z: 0,
          width: 0.96, height: 0.88,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.43, height: 0.845, depth: 0.82, platform: true }
        },
        {
          id: "tree",
          asset: "fallen-tree",
          x: 2.15, z: 0,
          width: 2.05, height: 2.38,
          category: "gameplay", gameplayType: "obstacle",
          collision: { halfWidth: 0.88, height: 2.30, depth: 0.92, platform: true }
        }
      ],

      completion: { type: "cross-x", x: 4.55, direction: 1 }
    }
  },

  // Markers are the only thing the continuous world needs to know about a
  // puzzle.  Moving this X value relocates the complete authored module.
  markers: [
    { id: "fallen-tree-01", group: "FALLEN_TREE_TEST", x: 8.5 }
  ],

  streaming: {
    loadAhead: 24,
    keepBehind: 34
  }
};
