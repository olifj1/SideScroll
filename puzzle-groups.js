window.SideScrollPuzzleConfig = {
  version: 29,
  assetPacks: {
    "woodland-puzzle-atlas-v1": {
      assets: [
        { name: "puzzle-log-a", url: "puzzle-log-a.png?v=1.0.62", aspect: 1.345895 },
        { name: "puzzle-log-b", url: "puzzle-log-b.png?v=1.0.62", aspect: 1.106195 },
        { name: "puzzle-log-c", url: "puzzle-log-c.png?v=1.0.62", aspect: 1.345895 },
        { name: "puzzle-log-d", url: "puzzle-log-d.png?v=1.0.62", aspect: 1.106195 },
        { name: "fallen-tree", url: "fallen-tree.png?v=1.0.62", aspect: 2.364393 },
        { name: "tree-stump", url: "tree-stump.png?v=1.0.62", aspect: 2.4223 },
        { name: "broken-branch", url: "broken-branch.png?v=1.0.62", aspect: 2.7182 },
        { name: "bridge-left", url: "bridge-left.png?v=1.0.62", aspect: 1.298592 },
        { name: "bridge-right", url: "bridge-right.png?v=1.0.62", aspect: 1.298592 },
        { name: "handcart-broken", aspect: 2.431373 },
        { name: "handcart", url: "handcart-body.png?v=1.0.62", aspect: 2.431373 },
        { name: "cart-wheel-loose", aspect: 1 },
        { name: "cart-wheel-ready", aspect: 1 },
        { name: "axle-pin", url: "axle-pin.png?v=1.0.62", aspect: 2 },
        { name: "thought-trigger", aspect: 1 },
        { name: "counterweight-plank", url: "counterweight-plank.png?v=1.0.62", aspect: 4.772727 },
        { name: "stone-wall", url: "stone-wall.png?v=1.0.62", aspect: 1.895735 },
        { name: "stone-piece-a", url: "stone-piece-a.png?v=1.0.62", aspect: 1.094391 },
        { name: "stone-piece-b", url: "stone-piece-b.png?v=1.0.62", aspect: 0.992500 },
        { name: "stone-piece-c", url: "stone-piece-c.png?v=1.0.62", aspect: 1.062417 }
      ]
    }
    ,
    "mountain-prototype-v1": {
      assets: [
        { name: "mountain-climb-rock-01", url: "mountain-climb-rock-01.png?v=1.0.68", aspect: 1.935829 }
      ]
    }
  },
  groups: {
    MOUNTAIN_CLIMB_PROTO: {
      label: "Mountain Climb Prototype",
      width: 10,
      bounds: { minX: -5, maxX: 5 },
      assetPacks: ["mountain-prototype-v1"],
      entryX: -4.35,
      exitX: 4.35,
      lab: {
        category: "Traversal prototype",
        recommendedEnvironment: "mountain",
        mechanic: "Climbable scenic terrain",
        note: "Prototype one climbable rock, mantle onto its painted top, walk across it, then climb down."
      },
      props: [
        {
          id: "climb-rock",
          asset: "mountain-climb-rock-01",
          x: 0.45,
          z: 0,
          width: 6.872,
          height: 3.55,
          flip: false,
          category: "gameplay",
          gameplayType: "climb-rock",
          gameplayLayerLocked: true
        }
      ]
    },
    // The original Fallen tree test and Stone Wall definitions were removed on
    // 5 Nov 2026: the project's puzzle library and templates carry the versions
    // placed in the world (sidescroll.puzzle-groups.library.v1).
  },
  // World placements live in the puzzle library (markers); none come from code.
  markers: [],
  streaming: { loadAhead: 24, keepBehind: 34 }
};
