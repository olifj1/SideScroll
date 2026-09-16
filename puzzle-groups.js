window.SideScrollPuzzleConfig = {
  version: 6,

  // Puzzle art now comes from an authored transparent asset pack.  Layout and
  // collision remain data-driven so this whole module can still be moved by its
  // world marker or replaced later without changing the streaming system.
  assetPacks: {
    "woodland-puzzle-atlas-v1": {
      assets: [
        { name: "puzzle-log-a", url: "puzzle-log-a.png?v=0.2.2", aspect: 1.7095 },
        { name: "puzzle-log-b", url: "puzzle-log-b.png?v=0.2.2", aspect: 1.5423 },
        { name: "puzzle-log-c", url: "puzzle-log-c.png?v=0.2.2", aspect: 2.1916 },
        { name: "puzzle-log-d", url: "puzzle-log-d.png?v=0.2.2", aspect: 2.3850 },
        { name: "fallen-tree", url: "fallen-tree.png?v=0.2.2", aspect: 2.3644 },
        { name: "tree-stump", url: "tree-stump.png?v=0.2.2", aspect: 2.4223 },
        { name: "broken-branch", url: "broken-branch.png?v=0.2.2", aspect: 2.7182 }
      ]
    }
  },
  groups: {
    FALLEN_TREE_TEST: {
      label: "Fallen tree test",
      width: 12.2,
      assetPacks: ["woodland-puzzle-atlas-v1"],

      // Keep the procedural woodland intact around the puzzle unless a later
      // module genuinely needs local clearing.
      entryX: -4.8,
      exitX: 5.6,

      props: [
        {
          id: "log-a",
          asset: "puzzle-log-a",
          x: -3.25, z: 0.76,
          height: 0.84,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.58, height: 0.48, depth: 0.62, platform: true }
        },
        {
          id: "log-b",
          asset: "puzzle-log-b",
          x: -2.00, z: 0.78,
          height: 0.72,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.46, height: 0.42, depth: 0.56, platform: true }
        },
        {
          id: "log-c",
          asset: "puzzle-log-c",
          x: -0.74, z: 0.74,
          height: 0.76,
          category: "gameplay", gameplayType: "crate",
          collision: { halfWidth: 0.60, height: 0.44, depth: 0.60, platform: true }
        },
        {
          id: "tree",
          asset: "fallen-tree",
          x: 2.35, z: 0.0,
          height: 2.55,
          category: "gameplay", gameplayType: "obstacle",
          // The collision intentionally hugs the flatter root/platform region
          // rather than the entire fallen trunk silhouette.
          collision: {
            halfWidth: 2.35, height: 1.72, depth: 1.08, platform: true,
            points: [
              { x: -1.00, y: 0.00 },
              { x: 0.12, y: 0.00 },
              { x: 0.58, y: 0.26 },
              { x: 0.10, y: 1.00 },
              { x: -0.70, y: 1.00 },
              { x: -1.00, y: 0.42 }
            ]
          },
          shadow: { width: 3.15, height: 0.54, xOffset: 0.08, yOffset: 0.05, opacity: 0.34 }
        }
      ],

      completion: { type: "cross-x", x: 5.18, direction: 1 }
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
