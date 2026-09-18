window.SideScrollPuzzleConfig = {
  version: 8,
  assetPacks: {
    "woodland-puzzle-atlas-v1": {
      assets: [
        { name: "puzzle-log-a", url: "puzzle-log-a.png?v=0.2.8", aspect: 1.7095 },
        { name: "puzzle-log-b", url: "puzzle-log-b.png?v=0.2.8", aspect: 1.5423 },
        { name: "puzzle-log-c", url: "puzzle-log-c.png?v=0.2.8", aspect: 2.1916 },
        { name: "puzzle-log-d", url: "puzzle-log-d.png?v=0.2.8", aspect: 2.3850 },
        { name: "fallen-tree", url: "fallen-tree.png?v=0.2.8", aspect: 2.3644 },
        { name: "tree-stump", url: "tree-stump.png?v=0.2.8", aspect: 2.4223 },
        { name: "broken-branch", url: "broken-branch.png?v=0.2.8", aspect: 2.7182 },
        { name: "stone-wall", url: "stone-wall.png?v=0.2.24", aspect: 3.1356 },
        { name: "stone-piece-a", url: "stone-piece-a.png?v=0.2.24", aspect: 1.0664 },
        { name: "stone-piece-b", url: "stone-piece-b.png?v=0.2.24", aspect: 0.9545 },
        { name: "stone-piece-c", url: "stone-piece-c.png?v=0.2.24", aspect: 1.1278 }
      ]
    }
  },
  groups: {
    FALLEN_TREE_TEST: {
      label: "Fallen tree test",
      width: 14.607981861570,
      bounds: {
  "minX": -8.507981861569682,
  "maxX": 6.1
},
      assetPacks: ["woodland-puzzle-atlas-v1"],
      entryX: -8.507981861569682,
      exitX: 6.1,
      props: [
  {
    "id": "log-a",
    "asset": "puzzle-log-a",
    "x": -7.579211515616101,
    "z": 0,
    "width": 1.435977653631285,
    "height": 0.84,
    "category": "gameplay",
    "gameplayType": "crate",
    "collision": {
      "halfWidth": 0.6174703910614525,
      "height": 0.8063999999999999,
      "depth": 0.62,
      "platform": true,
      "points": null
    }
  },
  {
    "id": "log-b",
    "asset": "puzzle-log-b",
    "x": -5.15288916232687,
    "z": 0,
    "width": 1.1104225352112675,
    "height": 0.72,
    "category": "gameplay",
    "gameplayType": "crate",
    "collision": {
      "halfWidth": 0.477481690140845,
      "height": 0.6911999999999999,
      "depth": 0.56,
      "platform": true,
      "points": null
    }
  },
  {
    "id": "log-c",
    "asset": "puzzle-log-c",
    "x": -2.1967421294734493,
    "z": 0,
    "width": 1.6656287425149703,
    "height": 0.76,
    "category": "gameplay",
    "gameplayType": "crate",
    "collision": {
      "halfWidth": 0.7162203592814372,
      "height": 0.7296,
      "depth": 0.6,
      "platform": true,
      "points": null
    }
  },
  {
    "id": "tree",
    "asset": "fallen-tree",
    "x": 2.695779243336297,
    "z": 0,
    "width": 6.029201331114809,
    "height": 2.55,
    "category": "gameplay",
    "gameplayType": "obstacle",
    "collision": {
      "halfWidth": 0.98,
      "height": 1.72,
      "depth": 1.08,
      "platform": true,
      "points": [
        {
          "x": -2.5092710099549187,
          "y": 0.07299245479569054
        },
        {
          "x": 3.0730339942408067,
          "y": 0.046617771437714214
        },
        {
          "x": 2.8298478675986596,
          "y": 0.29298021032224686
        },
        {
          "x": 0.4353998514298296,
          "y": 0.6250339322970517
        },
        {
          "x": -2.609728247410452,
          "y": 1.4016111853026438
        },
        {
          "x": -2.6404327338268985,
          "y": 0.48538306855645824
        }
      ]
    },
    "shadow": {
      "width": 3.15,
      "height": 0.54,
      "xOffset": 0.08,
      "yOffset": 0.05,
      "opacity": 0.34
    }
  }
],
      completion: {
  "type": "cross-x",
  "x": 5.18,
  "direction": 1
}
    }
  },
  markers: [
    { id: "fallen-tree-01", group: "FALLEN_TREE_TEST", x: 8.5 }
  ],
  streaming: { loadAhead: 24, keepBehind: 34 }
};
