window.SideScrollPuzzleConfig = {
  version: 27,
  assetPacks: {
    "woodland-puzzle-atlas-v1": {
      assets: [
        { name: "puzzle-log-a", url: "puzzle-log-a.png?v=0.2.94", aspect: 1.345895 },
        { name: "puzzle-log-b", url: "puzzle-log-b.png?v=0.2.94", aspect: 1.106195 },
        { name: "puzzle-log-c", url: "puzzle-log-c.png?v=0.2.94", aspect: 1.345895 },
        { name: "puzzle-log-d", url: "puzzle-log-d.png?v=0.2.94", aspect: 1.106195 },
        { name: "fallen-tree", url: "fallen-tree.png?v=0.2.94", aspect: 2.364393 },
        { name: "tree-stump", url: "tree-stump.png?v=0.2.61", aspect: 2.4223 },
        { name: "broken-branch", url: "broken-branch.png?v=0.2.61", aspect: 2.7182 },
        { name: "bridge-left", url: "bridge-left.png?v=1.0.12", aspect: 1.298592 },
        { name: "bridge-right", url: "bridge-right.png?v=1.0.12", aspect: 1.298592 },
        { name: "handcart-broken", aspect: 2.431373 },
        { name: "handcart", url: "handcart-body.png?v=1.0.46", aspect: 2.431373 },
        { name: "cart-wheel-loose", aspect: 1 },
        { name: "cart-wheel-ready", aspect: 1 },
        { name: "axle-pin", url: "axle-pin.png?v=1.0.46", aspect: 2 },
        { name: "counterweight-plank", url: "counterweight-plank.png?v=1.0.25", aspect: 4.772727 },
        { name: "stone-wall", url: "stone-wall.png?v=0.2.94", aspect: 1.895735 },
        { name: "stone-piece-a", url: "stone-piece-a.png?v=0.2.94", aspect: 1.094391 },
        { name: "stone-piece-b", url: "stone-piece-b.png?v=0.2.94", aspect: 0.992500 },
        { name: "stone-piece-c", url: "stone-piece-c.png?v=0.2.94", aspect: 1.062417 }
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
    "width": 1.130552,
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
    "width": 0.796460,
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
    "width": 1.022880,
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
    },
    STONE_WALL: {
      label: "Stone Wall",
      width: 22.09242296593955,
      bounds: { minX: -11.502642631903193, maxX: 10.589780239038355 },
      assetPacks: ["woodland-puzzle-atlas-v1"],
      entryX: -11.502642631903193,
      exitX: 10.589780239038355,
      props: [
        {
          id: "wall", asset: "stone-wall", x: 0.5279803341563962, z: -1.8344944983502849, yOffset: -0.010227229958892359,
          width: 7.109004739336, height: 3.75, flip: false, category: "dressing", gameplayType: "prop", gameplayLayerLocked: false, sockets: []
        },
        {
          id: "piece-a", asset: "stone-piece-a", x: -6.811181137605502, z: 0, yOffset: 0,
          width: 1.094391, height: 1.00, flip: false, category: "gameplay", gameplayType: "prop", gameplayLayerLocked: true,
          collision: { halfWidth: 0.43944212812500005, height: 0.48, depth: 0.4292225437500001, platform: false, points: [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}], behaviourGenerated: false }
        },
        {
          id: "piece-b", asset: "stone-piece-b", x: -7.9868207529392095, z: 0, yOffset: 0,
          width: 1.032200, height: 1.04, flip: false, category: "gameplay", gameplayType: "prop", gameplayLayerLocked: true,
          collision: { halfWidth: 0.3638457900000001, height: 0.48, depth: 0.42, platform: false, points: [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}], behaviourGenerated: false }
        },
        {
          id: "piece-c", asset: "stone-piece-c", x: -1.8137508429064155, z: 0, yOffset: 0,
          width: 1.062417, height: 1.00, flip: false, category: "gameplay", gameplayType: "prop", gameplayLayerLocked: true,
          collision: { halfWidth: 0.43423533834586475, height: 0.48, depth: 0.42413684210526326, platform: false, points: [{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}], behaviourGenerated: false }
        }
      ],
      completion: { type: "sockets" },
      completionEvent: { type: "spawn-collectible", itemId: "forest-key", asset: "forest-key", height: 0.62, offsetX: 1.20 }
    }
  },
  markers: [
    { id: "fallen-tree-01", group: "FALLEN_TREE_TEST", x: 8.5 },
    { id: "stone-wall-01", group: "STONE_WALL", x: 84.60739002700691 }
  ],
  streaming: { loadAhead: 24, keepBehind: 34 }
};
