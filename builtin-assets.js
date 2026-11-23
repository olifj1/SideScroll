/* SideScroll · built-in assets (shared list)
 * Every asset that ships with the game: its group, scope, name (the permanent key),
 * label, picture, default game height (metres), floor line (0–1 up from the
 * picture's bottom) and default behaviour / collision. Asset Lab edits these
 * (its saved per-name stores win over these defaults); Character Lab's scene
 * objects list them. Imported assets live in asset-library.js instead.
 * The game still has its own list (editorAssetGroups in sidescroll.js).
 */
(() => {
  'use strict';
  const STACK_ITEM_HEIGHT = 0.68;
  const ASSETS = [
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-left',label:'Broken Bridge · Left',image:'bridge-left.png',height:2.20,groundLine:1.62/2.20,behaviour:{solid:true,supportSurface:true,socketHost:true}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'bridge-right',label:'Broken Bridge · Right',image:'bridge-right.png',height:2.20,groundLine:1.62/2.20,behaviour:{solid:true,supportSurface:true,socketHost:true}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'counterweight-plank',label:'Counterweight Plank · Legacy',image:'counterweight-plank.png',height:0.72,groundLine:0.36,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,socketPiece:true},collision:{halfWidthRatio:0.49,fixedHeight:0.26,heightRatio:null,depthRatio:0.12,points:null}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'handcart-broken',label:'Broken Handcart',image:'handcart-body.png',height:1.75,groundLine:0.064,behaviour:{},collision:{halfWidthRatio:0.405,heightRatio:0.72,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:-1,y:.17},{x:-.8,y:.17},{x:-.8,y:.34},{x:-.63,y:.34},{x:-.63,y:1},{x:.63,y:1},{x:.63,y:.34},{x:.8,y:.34},{x:.8,y:.17},{x:1,y:.17},{x:1,y:0}]}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'handcart',label:'Wooden Handcart · Pushable',image:'handcart-body.png',height:1.75,groundLine:0.064,behaviour:{solid:true,supportSurface:true,pushable:true},collision:{halfWidthRatio:0.405,heightRatio:0.72,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:-1,y:.17},{x:-.8,y:.17},{x:-.8,y:.34},{x:-.63,y:.34},{x:-.63,y:1},{x:.63,y:1},{x:.63,y:.34},{x:.8,y:.34},{x:.8,y:.17},{x:1,y:.17},{x:1,y:0}]}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'cart-wheel-loose',label:'Cart Wheel',image:'handcart-wheel.png',height:1.06,groundLine:0,behaviour:{carryable:true,placeable:true},collision:{halfWidthRatio:0.30,heightRatio:0.62,fixedHeight:null,depthRatio:0.20,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}},
      {group:'PUZZLE · BRIDGE',scope:'puzzle',name:'axle-pin',label:'Axle Pin',image:'axle-pin.png',height:0.72,groundLine:0,behaviour:{}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-a',label:'Moveable Log A',image:'puzzle-log-a.png',height:0.84,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true},collision:{halfWidthRatio:0.52/(0.84*1.7083),fixedHeight:STACK_ITEM_HEIGHT,heightRatio:null,depthRatio:0.56/(0.84*1.7083),points:null}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-b',label:'Moveable Log B',image:'puzzle-log-b.png',height:0.72,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-c',label:'Moveable Log C',image:'puzzle-log-c.png',height:0.76,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'puzzle-log-d',label:'Moveable Log D',image:'puzzle-log-d.png',height:0.82,behaviour:{solid:true,carryable:true,placeable:true,supportSurface:true,stackable:true}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'fallen-tree',label:'Fallen Tree',image:'fallen-tree.png',height:2.55,behaviour:{solid:true,supportSurface:true}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'tree-stump',label:'Tree Stump',image:'tree-stump.png',height:1.18,behaviour:{}},
      {group:'PUZZLE · WOODLAND',scope:'puzzle',name:'broken-branch',label:'Broken Branch',image:'broken-branch.png',height:0.78,behaviour:{}},
      {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-wall',label:'Stone Wall',image:'stone-wall.png',height:3.75,behaviour:{socketHost:true}},
      {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-a',label:'Triangle Stone',image:'stone-piece-a.png',height:1.00,behaviour:{carryable:true,placeable:true,socketPiece:true}},
      {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-b',label:'Arch Stone',image:'stone-piece-b.png',height:1.04,behaviour:{carryable:true,placeable:true,socketPiece:true}},
      {group:'PUZZLE · STONE WALL',scope:'puzzle',name:'stone-piece-c',label:'Hexagon Stone',image:'stone-piece-c.png',height:1.00,behaviour:{carryable:true,placeable:true,socketPiece:true}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-01',label:'House 01 · Cottage Front',image:'settlement-house-01.png',height:4.20,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-02',label:'House 02 · Wide Cottage',image:'settlement-house-02.png',height:4.00,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-03',label:'House 03 · Wide Hall',image:'settlement-house-03.png',height:3.60,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-04',label:'House 04 · Tall House',image:'settlement-house-04.png',height:5.00,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-05',label:'House 05 · Ramshackle Cottage',image:'settlement-house-05.png',height:4.40,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · BUILDINGS',scope:'environment',name:'settlement-house-06',label:'House 06 · Ramshackle Hut',image:'settlement-house-06.png',height:4.30,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · ROOFS',scope:'environment',name:'settlement-roof-01',label:'Roof 01 · Terracotta Gable',image:'settlement-roof-01.png',height:1.65,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · ROOFS',scope:'environment',name:'settlement-roof-02',label:'Roof 02 · Double Chimney',image:'settlement-roof-02.png',height:2.15,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · ROOFS',scope:'environment',name:'settlement-roof-03',label:'Roof 03 · Low Chimney',image:'settlement-roof-03.png',height:1.70,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · ROOFS',scope:'environment',name:'settlement-roof-04',label:'Roof 04 · Rustic Shingle',image:'settlement-roof-04.png',height:1.80,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-fence-01',label:'Fence 01 · Straight',image:'settlement-fence-01.png',height:1.35,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-fence-02',label:'Fence 02 · Broken',image:'settlement-fence-02.png',height:1.25,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-fence-03',label:'Fence 03 · Gate',image:'settlement-fence-03.png',height:1.55,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-wall-01',label:'Wall 01 · Low Stone',image:'settlement-wall-01.png',height:1.35,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-wall-02',label:'Wall 02 · Timber + Stone',image:'settlement-wall-02.png',height:2.55,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · SETTLEMENT · FENCES + WALLS',scope:'environment',name:'settlement-wall-03',label:'Wall 03 · Stone Corner',image:'settlement-wall-03.png',height:2.45,groundLine:0,behaviour:{}},
      {group:'ENVIRONMENT · MOUNTAIN',scope:'environment',name:'mountain-climb-rock-01',label:'Mountain Climb Rock 01',image:'mountain-climb-rock-01.png',height:3.55,behaviour:{solid:true,supportSurface:true,climbable:true},collision:{halfWidthRatio:0.46,heightRatio:0.72,fixedHeight:null,depthRatio:0.15,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]},climbPaths:[{id:'left',bottom:{x:-0.48,y:0.01},top:{x:-0.39,y:0.72},widthRatio:0.11},{id:'right',bottom:{x:0.48,y:0.01},top:{x:0.39,y:0.72},widthRatio:0.11}]},
      {group:'ENVIRONMENT · MOUNTAIN · CLIFFS',scope:'environment',name:'mountain-cliff-01',label:'Mountain Cliff 01 · Stepped',image:'mountain-cliff-01.png',height:3.55,groundLine:0.025,behaviour:{solid:true,supportSurface:true,climbable:true},collision:{halfWidthRatio:0.44,heightRatio:0.74,fixedHeight:null,depthRatio:0.16,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]},climbPaths:[{id:'left',bottom:{x:-0.34,y:0.02},top:{x:-0.30,y:0.74},widthRatio:0.10},{id:'right',bottom:{x:0.34,y:0.02},top:{x:0.30,y:0.74},widthRatio:0.10}]},
      {group:'ENVIRONMENT · MOUNTAIN · CLIFFS',scope:'environment',name:'mountain-cliff-02',label:'Mountain Cliff 02 · Sheer',image:'mountain-cliff-02.png',height:3.50,groundLine:0.025,behaviour:{solid:true,supportSurface:true,climbable:true},collision:{halfWidthRatio:0.45,heightRatio:0.76,fixedHeight:null,depthRatio:0.16,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]},climbPaths:[{id:'left',bottom:{x:-0.33,y:0.02},top:{x:-0.30,y:0.76},widthRatio:0.10},{id:'right',bottom:{x:0.33,y:0.02},top:{x:0.30,y:0.76},widthRatio:0.10}]},
      {group:'ENVIRONMENT · MOUNTAIN · CLIFFS',scope:'environment',name:'mountain-cliff-03',label:'Mountain Cliff 03 · Broad',image:'mountain-cliff-03.png',height:3.45,groundLine:0.025,behaviour:{solid:true,supportSurface:true,climbable:true},collision:{halfWidthRatio:0.45,heightRatio:0.73,fixedHeight:null,depthRatio:0.16,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]},climbPaths:[{id:'left',bottom:{x:-0.35,y:0.02},top:{x:-0.30,y:0.73},widthRatio:0.10},{id:'right',bottom:{x:0.35,y:0.02},top:{x:0.30,y:0.73},widthRatio:0.10}]},
      {group:'ENVIRONMENT · MOUNTAIN · CLIFFS',scope:'environment',name:'mountain-cliff-04',label:'Mountain Cliff 04 · Tall',image:'mountain-cliff-04.png',height:3.80,groundLine:0.025,behaviour:{solid:true,supportSurface:true,climbable:true},collision:{halfWidthRatio:0.43,heightRatio:0.82,fixedHeight:null,depthRatio:0.16,points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}],shapes:[{points:[{x:-1,y:0},{x:1,y:0},{x:1,y:1},{x:-1,y:1}]}]},climbPaths:[{id:'centre',bottom:{x:-0.02,y:0.02},top:{x:0.00,y:0.82},widthRatio:0.18}]},
      {group:'ENVIRONMENT · MOUNTAIN · ROCK DRESSING',scope:'environment',name:'mountain-rock-01',label:'Mountain Rock 01 · Low',image:'mountain-rock-01.png',height:0.88,groundLine:0.030,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · ROCK DRESSING',scope:'environment',name:'mountain-rock-02',label:'Mountain Rock 02',image:'mountain-rock-02.png',height:1.05,groundLine:0.030,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · ROCK DRESSING',scope:'environment',name:'mountain-rock-03',label:'Mountain Rock 03 · Tall',image:'mountain-rock-03.png',height:1.38,groundLine:0.030,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · ROCK DRESSING',scope:'environment',name:'mountain-rock-04',label:'Mountain Rock 04 · Wide',image:'mountain-rock-04.png',height:1.08,groundLine:0.030,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · DRY GRASS',scope:'environment',name:'mountain-grass-01',label:'Mountain Grass 01 · Broad',image:'mountain-grass-01.png',height:0.92,groundLine:0.018,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · DRY GRASS',scope:'environment',name:'mountain-grass-02',label:'Mountain Grass 02 · Tall',image:'mountain-grass-02.png',height:1.34,groundLine:0.018,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · DRY GRASS',scope:'environment',name:'mountain-grass-03',label:'Mountain Grass 03 · Narrow',image:'mountain-grass-03.png',height:1.55,groundLine:0.018,behaviour:{followSurfaceNormal:true}},
      {group:'ENVIRONMENT · MOUNTAIN · SCRUB TREES',scope:'environment',name:'mountain-tree-01',label:'Mountain Scrub Tree 01',image:'mountain-tree-01.png',height:2.35,groundLine:0.020,behaviour:{}},
      {group:'ENVIRONMENT · MOUNTAIN · SCRUB TREES',scope:'environment',name:'mountain-tree-02',label:'Mountain Scrub Tree 02',image:'mountain-tree-02.png',height:2.50,groundLine:0.020,behaviour:{}},
      ...Array.from({length:8},(_,i)=>({group:'ENVIRONMENT · TREES',scope:'environment',name:`tree${String(i+1).padStart(2,'0')}`,label:`Tree ${i+1}`,image:`sidescroll-tree-${String(i+1).padStart(2,'0')}.png`,height:8.2,behaviour:{}})),
      ...Array.from({length:12},(_,i)=>({group:'ENVIRONMENT · GROUND',scope:'environment',name:`ground${String(i+1).padStart(2,'0')}`,label:`Ground ${i+1}`,image:`sidescroll-ground-${String(i+1).padStart(2,'0')}.png`,height:0.82,behaviour:{}}))
  ];
  const json = JSON.stringify(ASSETS);
  window.SideScrollBuiltInAssets = Object.freeze({
    list: () => JSON.parse(json),           // a fresh, editable copy
    get: name => { const a = ASSETS.find(x => x.name === name); return a ? JSON.parse(JSON.stringify(a)) : null; }
  });
})();
