(() => {
  'use strict';

  // SideScroll v0.2.65: denser, slightly larger path-edge foliage with stronger off-path scale growth so the forest floor feels wilder just beyond the walked route.

  const queryParams = new URLSearchParams(window.location.search);
  const PLAYER_MODE = queryParams.get('mode') === 'player';
  const BAKED_GAME_DESIGN = window.SIDESCROLL_BAKED_GAME_DESIGN || null;
  const PLAYER_POSITION_STORAGE_KEY = 'sidescroll.player.position.v1';
  const PLAYER_PUZZLE_STATE_STORAGE_KEY = 'sidescroll.player.puzzle-state.v1';
  const PLAYER_INVENTORY_STORAGE_KEY = 'sidescroll.player.inventory.v1';
  let playerSaveDeletionInProgress = false;

  const Rig = window.GameHubWalkRig;
  if (!Rig) return;

  const canvas = document.getElementById('sidescroll-canvas');
  const errorBox = document.getElementById('sidescroll-error');
  const statusEl = document.getElementById('sidescroll-status');
  const hintEl = document.getElementById('sidescroll-hint');
  const debugBtn = document.getElementById('sidescroll-depth');
  const postBtn = document.getElementById('sidescroll-post');
  const postPanel = document.getElementById('sidescroll-post-panel');
  const postCloseBtn = document.getElementById('sidescroll-post-close');
  const postBrightnessInput = document.getElementById('sidescroll-post-brightness');
  const postContrastInput = document.getElementById('sidescroll-post-contrast');
  const postSaturationInput = document.getElementById('sidescroll-post-saturation');
  const postTintColourInput = document.getElementById('sidescroll-post-tint-colour');
  const postTintAmountInput = document.getElementById('sidescroll-post-tint-amount');
  const postBrightnessValue = document.getElementById('sidescroll-post-brightness-value');
  const postContrastValue = document.getElementById('sidescroll-post-contrast-value');
  const postSaturationValue = document.getElementById('sidescroll-post-saturation-value');
  const postTintAmountValue = document.getElementById('sidescroll-post-tint-amount-value');
  const postResetBtn = document.getElementById('sidescroll-post-reset');
  const fogBtn = document.getElementById('sidescroll-fog');
  const fogPanel = document.getElementById('sidescroll-fog-panel');
  const fogCloseBtn = document.getElementById('sidescroll-fog-close');
  const fogEnabledInput = document.getElementById('sidescroll-fog-enabled');
  const fogColourInput = document.getElementById('sidescroll-fog-colour');
  const fogStartInput = document.getElementById('sidescroll-fog-start');
  const fogCurveInput = document.getElementById('sidescroll-fog-curve');
  const fogAmountInput = document.getElementById('sidescroll-fog-amount');
  const fogStartValue = document.getElementById('sidescroll-fog-start-value');
  const fogCurveValue = document.getElementById('sidescroll-fog-curve-value');
  const fogAmountValue = document.getElementById('sidescroll-fog-amount-value');
  const fogResetBtn = document.getElementById('sidescroll-fog-reset');
  const collisionViewBtn = document.getElementById('sidescroll-collision-view');
  const playerHintsBtn = document.getElementById('sidescroll-player-hints');
  const cameraEditorBtn = document.getElementById('sidescroll-editor-camera');
  const cameraEditorPanel = document.getElementById('sidescroll-camera-editor');
  const cameraValuesEl = document.getElementById('sidescroll-camera-values');
  const cameraUpBtn = document.getElementById('sidescroll-camera-up');
  const cameraDownBtn = document.getElementById('sidescroll-camera-down');
  const cameraBackBtn = document.getElementById('sidescroll-camera-back');
  const cameraForwardBtn = document.getElementById('sidescroll-camera-forward');
  const cameraTiltBackBtn = document.getElementById('sidescroll-camera-tilt-back');
  const cameraTiltForwardBtn = document.getElementById('sidescroll-camera-tilt-forward');
  const inventoryBtn = document.getElementById('sidescroll-inventory');
  const inventoryCountEl = document.getElementById('sidescroll-inventory-count');
  const inventoryPanel = document.getElementById('sidescroll-inventory-panel');
  const inventoryCloseBtn = document.getElementById('sidescroll-inventory-close');
  const inventoryListEl = document.getElementById('sidescroll-inventory-list');
  const inventoryEmptyEl = document.getElementById('sidescroll-inventory-empty');
  const quickNavBtn = document.getElementById('sidescroll-quick-nav');
  const quickNavPanel = document.getElementById('sidescroll-quick-nav-panel');
  const quickNavCloseBtn = document.getElementById('sidescroll-quick-nav-close');
  const quickNavListEl = document.getElementById('sidescroll-quick-nav-list');
  const depthKey = document.getElementById('sidescroll-depth-key');
  const driveControl = document.getElementById('sidescroll-drive');
  const driveThumb = document.getElementById('sidescroll-drive-thumb');
  const jumpBtn = document.getElementById('sidescroll-jump');
  const secondaryControls = document.getElementById('sidescroll-secondary-controls');
  const actionBtn = document.getElementById('sidescroll-action');
  const actionLabel = document.getElementById('sidescroll-action-label');
  const editBtn = document.getElementById('sidescroll-edit');
  const deleteSaveBtn = document.getElementById('sidescroll-delete-save');
  const playControls = document.getElementById('sidescroll-play-controls');
  const editorControls = document.getElementById('sidescroll-editor-controls');
  const editorOverlay = document.getElementById('sidescroll-editor-overlay');
  const editorOverlayCtx = editorOverlay?.getContext('2d');
  const editorPalette = document.getElementById('sidescroll-editor-palette');
  const editorAssetsEl = document.getElementById('sidescroll-editor-assets');
  const editorPaletteClose = document.getElementById('sidescroll-editor-palette-close');
  const editorPaletteTitle = document.getElementById('sidescroll-editor-palette-title');
  const editorPaletteSubtitle = document.getElementById('sidescroll-editor-palette-subtitle');
  const assetSetupEl = document.getElementById('sidescroll-asset-setup');
  const assetSetupBackBtn = document.getElementById('sidescroll-asset-setup-back');
  const assetSetupNameEl = document.getElementById('sidescroll-asset-setup-name');
  const assetBehaviorListEl = document.getElementById('sidescroll-asset-behaviour-list');
  const assetSetupNoteEl = document.getElementById('sidescroll-asset-setup-note');
  const assetBehaviorResetBtn = document.getElementById('sidescroll-asset-behaviour-reset');
  const collectibleSetupEl = document.getElementById('sidescroll-collectible-setup');
  const collectibleSetupBackBtn = document.getElementById('sidescroll-collectible-setup-back');
  const collectibleSetupNameEl = document.getElementById('sidescroll-collectible-setup-name');
  const collectibleNameInput = document.getElementById('sidescroll-collectible-name');
  const collectibleScaleInput = document.getElementById('sidescroll-collectible-scale');
  const collectibleScaleValueEl = document.getElementById('sidescroll-collectible-scale-value');
  const collectibleSpinBtn = document.getElementById('sidescroll-collectible-spin');
  const collectibleResetBtn = document.getElementById('sidescroll-collectible-reset');
  const openAssetsBtn = document.getElementById('sidescroll-open-assets');
  const openEnvironmentAssetsBtn = document.getElementById('sidescroll-open-environment-assets');
  const editorResetBtn = document.getElementById('sidescroll-editor-reset');
  const puzzlePanel = document.getElementById('sidescroll-puzzle-panel');
  const placementStrip = document.getElementById('sidescroll-placement-strip');
  const placementNameEl = document.getElementById('sidescroll-placement-name');
  const placementChangeBtn = document.getElementById('sidescroll-placement-change');
  const placementDoneBtn = document.getElementById('sidescroll-placement-done');
  const editorScopeSwitch = document.getElementById('sidescroll-editor-scope-switch');
  const environmentScopeBtn = document.getElementById('sidescroll-scope-environment');
  const puzzleScopeBtn = document.getElementById('sidescroll-scope-puzzle');
  const puzzleSourceSwitch = document.getElementById('sidescroll-puzzle-source-switch');
  const puzzleSourceLibraryBtn = document.getElementById('sidescroll-puzzle-source-library');
  const puzzleSourceSceneBtn = document.getElementById('sidescroll-puzzle-source-scene');
  const puzzlePicker = document.getElementById('sidescroll-puzzle-picker');
  const puzzleLibraryView = document.getElementById('sidescroll-puzzle-library-view');
  const puzzleSceneView = document.getElementById('sidescroll-puzzle-scene-view');
  const puzzleSceneListEl = document.getElementById('sidescroll-scene-puzzle-list');
  const puzzleSceneEmptyEl = document.getElementById('sidescroll-scene-puzzle-empty');
  const puzzleSelectionEl = document.getElementById('sidescroll-puzzle-selection');
  const environmentSelectionEl = document.getElementById('sidescroll-environment-selection');
  const puzzleStageSection = document.getElementById('sidescroll-puzzle-stage-section');
  const puzzleSelect = document.getElementById('sidescroll-puzzle-select');
  const puzzleEditBtn = document.getElementById('sidescroll-puzzle-edit');
  const puzzleFocusBtn = document.getElementById('sidescroll-puzzle-focus');
  const puzzleManageEl = document.getElementById('sidescroll-puzzle-manage');
  const puzzleSpawnBtn = document.getElementById('sidescroll-puzzle-spawn');
  const puzzleCreateBtn = document.getElementById('sidescroll-puzzle-create');
  const puzzleClearStageBtn = document.getElementById('sidescroll-puzzle-clear-stage');
  const puzzleRestoreStageBtn = document.getElementById('sidescroll-puzzle-restore-stage');
  const exportAllBtn = document.getElementById('sidescroll-export-all');
  const puzzleExportBtn = document.getElementById('sidescroll-puzzle-export');
  const puzzleRemoveBtn = document.getElementById('sidescroll-puzzle-remove');
  const puzzleDeleteTemplateBtn = document.getElementById('sidescroll-puzzle-delete-template');
  const puzzleActionsEl = document.getElementById('sidescroll-puzzle-actions');
  const puzzleObjectsEl = document.getElementById('sidescroll-puzzle-objects');
  const puzzleObjectCountEl = document.getElementById('sidescroll-puzzle-object-count');
  const puzzleObjectListEl = document.getElementById('sidescroll-puzzle-object-list');
  const puzzleModeEl = document.getElementById('sidescroll-puzzle-mode');
  const puzzleNameEl = document.getElementById('sidescroll-puzzle-name');
  const puzzleStateEl = document.getElementById('sidescroll-puzzle-state');
  const puzzleHelpEl = document.getElementById('sidescroll-puzzle-help');
  const puzzleMarkerEditor = document.getElementById('sidescroll-puzzle-marker-editor');
  const puzzleMarkerXInput = document.getElementById('sidescroll-puzzle-marker-x');
  const puzzleSetStartBtn = document.getElementById('sidescroll-puzzle-set-start');
  const puzzleExclusionEditBtn = document.getElementById('sidescroll-puzzle-exclusion-edit');
  const puzzleExclusionToggleBtn = document.getElementById('sidescroll-puzzle-exclusion-toggle');
  const puzzleAddDressingBtn = document.getElementById('sidescroll-puzzle-add-dressing');
  const puzzleSaveUniqueBtn = document.getElementById('sidescroll-puzzle-save-unique');
  const puzzleTestBtn = document.getElementById('sidescroll-puzzle-test');
  const puzzleResetBtn = document.getElementById('sidescroll-puzzle-reset');
  const puzzleBackSetupBtn = document.getElementById('sidescroll-puzzle-back-setup');
  const editorAddBtn = document.getElementById('sidescroll-editor-add');
  const editorDuplicateBtn = document.getElementById('sidescroll-editor-duplicate');
  const editorScaleDownBtn = document.getElementById('sidescroll-editor-scale-down');
  const editorScaleUpBtn = document.getElementById('sidescroll-editor-scale-up');
  const editorGameLayerBtn = document.getElementById('sidescroll-editor-game-layer');
  const editorCollisionBtn = document.getElementById('sidescroll-editor-collision');
  const editorCollisionRemoveBtn = document.getElementById('sidescroll-editor-collision-remove');
  const editorCollisionSaveAssetBtn = document.getElementById('sidescroll-editor-collision-save-asset');
  const editorCollisionUseAssetBtn = document.getElementById('sidescroll-editor-collision-use-asset');
  const editorSocketBtn = document.getElementById('sidescroll-editor-socket');
  const editorSocketClearBtn = document.getElementById('sidescroll-editor-socket-clear');
  const editorDeleteBtn = document.getElementById('sidescroll-editor-delete');
  const editorUiElements = () => [puzzlePanel, editorPalette, editorControls, cameraEditorPanel, quickNavPanel].filter(el => el && !el.hidden);

  function pointInsideElement(el, clientX, clientY) {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  function pointInsideEditorUi(clientX, clientY) {
    return editorUiElements().some(el => pointInsideElement(el, clientX, clientY));
  }

  // Editor/menu controls activate on a deliberate tap: pointer down + release
  // without a drag. This keeps vertical scrolling safe on touch screens while
  // avoiding Safari's unreliable delayed synthetic-click path.
  function bindEditorPress(element, handler) {
    if (!element) return;
    const DRAG_CANCEL_PX = 10;
    let press = null;
    let suppressClickUntil = -Infinity;

    element.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (element.disabled) return;
      press = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cancelled: false
      };
      // Do not preventDefault here: a touch that turns into a drag must remain
      // available to the panel's native scrolling behaviour.
      event.stopPropagation();
    }, { passive:true });

    element.addEventListener('pointermove', event => {
      if (!press || event.pointerId !== press.id) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_CANCEL_PX) {
        press.cancelled = true;
      }
    }, { passive:true });

    element.addEventListener('pointerup', event => {
      if (!press || event.pointerId !== press.id) return;
      const current = press;
      press = null;
      if (current.cancelled || element.disabled) return;
      const r = element.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) return;
      suppressClickUntil = performance.now() + 800;
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }, { passive:false });

    element.addEventListener('pointercancel', event => {
      if (press && event.pointerId === press.id) press = null;
    }, { passive:true });

    element.addEventListener('click', event => {
      // Pointer-generated click normally follows pointerup, but iOS can cancel
      // that pointer sequence inside a scrolling panel and still emit a click.
      // Suppress true duplicates, otherwise let the native click be the fallback.
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (element.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    });
  }

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: true,
    depth: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    errorBox.hidden = false;
    errorBox.textContent = 'WebGL is unavailable on this device/browser.';
    return;
  }

  const VERT = `
    attribute vec3 aPosition;
    attribute vec2 aUV;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);
      vUV = aUV * uUvScale + uUvOffset;
      vDepth = max(0.0, -viewPos.z);
      gl_Position = uProjection * viewPos;
    }
  `;

  const FRAG = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec3 uTint;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uFogAmount;
    uniform float uFogCurve;
    uniform float uOpacity;
    uniform float uHighlight;
    uniform vec3 uHighlightColor;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec4 tex = texture2D(uTexture, vUV);
      float alpha = tex.a * uOpacity;
      if (alpha < 0.045) discard;
      float fogT = smoothstep(uFogNear, uFogFar, vDepth);
      float fog = pow(fogT, uFogCurve) * uFogAmount;
      vec3 base = tex.rgb * uTint;
      base = mix(base, uHighlightColor, clamp(uHighlight, 0.0, 1.0) * 0.72);
      vec3 rgb = mix(base, uFogColor, fog * (1.0 - uHighlight * 0.72));
      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    }
    return shader;
  }

  function createProgram(vertexSource = VERT, fragmentSource = FRAG) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    }
    return program;
  }

  const POST_VERT = `
    attribute vec2 aPosition;
    varying vec2 vUV;
    void main() {
      vUV = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const POST_FRAG = `
    precision mediump float;
    uniform sampler2D uScene;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uSaturation;
    uniform vec3 uTintColor;
    uniform float uTintAmount;
    varying vec2 vUV;
    void main() {
      vec3 rgb = texture2D(uScene, vUV).rgb;
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, uSaturation);
      rgb = (rgb - vec3(0.5)) * uContrast + vec3(0.5);
      rgb *= uBrightness;
      rgb = mix(rgb, rgb * uTintColor, uTintAmount);
      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
    }
  `;

  let program;
  let postProgram;
  try {
    program = createProgram();
    postProgram = createProgram(POST_VERT, POST_FRAG);
  } catch (err) {
    errorBox.hidden = false;
    errorBox.textContent = `WebGL setup failed: ${err.message}`;
    return;
  }

  const loc = {
    pos: gl.getAttribLocation(program, 'aPosition'),
    uv: gl.getAttribLocation(program, 'aUV'),
    model: gl.getUniformLocation(program, 'uModel'),
    view: gl.getUniformLocation(program, 'uView'),
    projection: gl.getUniformLocation(program, 'uProjection'),
    texture: gl.getUniformLocation(program, 'uTexture'),
    tint: gl.getUniformLocation(program, 'uTint'),
    fogColor: gl.getUniformLocation(program, 'uFogColor'),
    fogNear: gl.getUniformLocation(program, 'uFogNear'),
    fogFar: gl.getUniformLocation(program, 'uFogFar'),
    fogAmount: gl.getUniformLocation(program, 'uFogAmount'),
    fogCurve: gl.getUniformLocation(program, 'uFogCurve'),
    opacity: gl.getUniformLocation(program, 'uOpacity'),
    highlight: gl.getUniformLocation(program, 'uHighlight'),
    highlightColor: gl.getUniformLocation(program, 'uHighlightColor'),
    uvScale: gl.getUniformLocation(program, 'uUvScale'),
    uvOffset: gl.getUniformLocation(program, 'uUvOffset')
  };

  const postLoc = {
    pos: gl.getAttribLocation(postProgram, 'aPosition'),
    scene: gl.getUniformLocation(postProgram, 'uScene'),
    brightness: gl.getUniformLocation(postProgram, 'uBrightness'),
    contrast: gl.getUniformLocation(postProgram, 'uContrast'),
    saturation: gl.getUniformLocation(postProgram, 'uSaturation'),
    tintColor: gl.getUniformLocation(postProgram, 'uTintColor'),
    tintAmount: gl.getUniformLocation(postProgram, 'uTintAmount')
  };

  const postTriangleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, postTriangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
  ]), gl.STATIC_DRAW);

  const sceneFramebuffer = gl.createFramebuffer();
  const sceneColorTexture = gl.createTexture();
  const sceneDepthBuffer = gl.createRenderbuffer();
  let sceneTargetWidth = 0;
  let sceneTargetHeight = 0;

  function resizeSceneTarget(width, height) {
    if (sceneTargetWidth === width && sceneTargetHeight === height) return;
    sceneTargetWidth = width;
    sceneTargetHeight = height;

    gl.bindTexture(gl.TEXTURE_2D, sceneColorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneColorTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepthBuffer);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Post-process framebuffer incomplete: ${status}`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function presentSceneWithPost() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(postProgram);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);

    gl.bindBuffer(gl.ARRAY_BUFFER, postTriangleBuffer);
    gl.enableVertexAttribArray(postLoc.pos);
    gl.vertexAttribPointer(postLoc.pos, 2, gl.FLOAT, false, 8, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneColorTexture);
    gl.uniform1i(postLoc.scene, 0);
    gl.uniform1f(postLoc.brightness, postSettings.brightness);
    gl.uniform1f(postLoc.contrast, postSettings.contrast);
    gl.uniform1f(postLoc.saturation, postSettings.saturation);
    gl.uniform3f(postLoc.tintColor, postSettings.tintColor[0], postSettings.tintColor[1], postSettings.tintColor[2]);
    gl.uniform1f(postLoc.tintAmount, postSettings.tintAmount);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Attribute enable/disable state is global in WebGL, not program-local.
    // The post position attribute commonly shares index 0 with the scene
    // position attribute, so disabling it here blanked every later scene frame.
    gl.useProgram(program);
    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.uv);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  function createMesh(vertices, indices) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return { vbo, ibo, count: indices.length };
  }

  const billboardMesh = createMesh(
    new Float32Array([
      -0.5, 0.0, 0.0,  0.0, 0.0,
       0.5, 0.0, 0.0,  1.0, 0.0,
      -0.5, 1.0, 0.0,  0.0, 1.0,
       0.5, 1.0, 0.0,  1.0, 1.0
    ]),
    new Uint16Array([0,1,2,2,1,3])
  );

  const groundMesh = createMesh(
    new Float32Array([
      -0.5, 0.0,  0.0, 0.0, 0.0,
       0.5, 0.0,  0.0, 1.0, 0.0,
      -0.5, 0.0, -1.0, 0.0, 1.0,
       0.5, 0.0, -1.0, 1.0, 1.0
    ]),
    new Uint16Array([0,1,2,2,1,3])
  );

  // Real path geometry. X runs along the level; Z is the top-down path width.
  // The cross-section keeps the low raised shoulders from v1.8.74, but the
  // whole strip now rolls gently up/down along X so it feels laid through real
  // woodland rather than extruded as a perfectly straight plank.
  const PATH_UNDULATION_A = 0.050;
  const PATH_UNDULATION_B = 0.024;
  function pathUndulationUnit(t) {
    const tau = Math.PI * 2;
    return Math.sin(t * tau * 2.0 + 0.55) * PATH_UNDULATION_A
         + Math.sin(t * tau * 5.0 - 0.80) * PATH_UNDULATION_B;
  }

  function createPathMesh(segments = 48) {
    const rows = [
      { z: 1.00, y: 0.00, v: 0.00 },
      { z: 0.82, y: 0.22, v: 0.12 },
      { z: 0.68, y: 0.12, v: 0.28 },
      { z:-0.68, y: 0.12, v: 0.72 },
      { z:-0.82, y: 0.22, v: 0.88 },
      { z:-1.00, y: 0.00, v: 1.00 }
    ];
    const vertices = [];
    const indices = [];
    for (let ix = 0; ix <= segments; ix++) {
      const t = ix / segments;
      const x = t - 0.5;
      const rise = pathUndulationUnit(t);
      for (const row of rows) {
        vertices.push(x, row.y + rise, row.z, t * 24.0, row.v * 1.8);
      }
    }
    const rowCount = rows.length;
    for (let ix = 0; ix < segments; ix++) {
      for (let iz = 0; iz < rowCount - 1; iz++) {
        const a = ix * rowCount + iz;
        const b = (ix + 1) * rowCount + iz;
        const c = a + 1;
        const d = b + 1;
        indices.push(a,b,c, c,b,d);
      }
    }
    return createMesh(new Float32Array(vertices), new Uint16Array(indices));
  }

  const pathMesh = createPathMesh();

  function createRigPartMesh(name) {
    const r = Rig.atlasRect(name);
    if (!r) return null;
    const p0x = r.a0[0] * r.w, p0y = r.a0[1] * r.h;
    const left = -p0x, right = r.w - p0x;
    const top = p0y, bottom = p0y - r.h;
    const u0 = r.x / Rig.ATLAS.width, u1 = (r.x + r.w) / Rig.ATLAS.width;
    // Image uploads use UNPACK_FLIP_Y_WEBGL so atlas row coordinates (which are
    // measured from the image top) must be converted into bottom-origin WebGL V.
    // The old mapping sampled the opposite atlas rows, which is why boots/head/
    // torso pieces appeared attached to the correct bones but showed the wrong art.
    const vTop = 1 - (r.y / Rig.ATLAS.height);
    const vBottom = 1 - ((r.y + r.h) / Rig.ATLAS.height);
    return createMesh(
      new Float32Array([
        left, bottom, 0, u0, vBottom,
        right, bottom, 0, u1, vBottom,
        left, top, 0, u0, vTop,
        right, top, 0, u1, vTop
      ]),
      new Uint16Array([0,1,2,2,1,3])
    );
  }

  const rigPartMeshes = {};
  Object.keys(Rig.ATLAS.parts).forEach(name => { rigPartMeshes[name] = createRigPartMesh(name); });

  function bindMesh(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 20, 12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  }

  gl.useProgram(program);
  gl.enableVertexAttribArray(loc.pos);
  gl.enableVertexAttribArray(loc.uv);
  gl.uniform1i(loc.texture, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearDepth(1);

  function mat4Identity() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  function mat4Model(x, y, z, sx, sy, sz, flipX = false) {
    const scaleX = flipX ? -sx : sx;
    return new Float32Array([
      scaleX, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      x, y, z, 1
    ]);
  }

  function mat4Model2D(x, y, z, scale, rotation, mirrorX = 1) {
    const c = Math.cos(rotation), s = Math.sin(rotation);
    const sx = scale * mirrorX, sy = scale;
    return new Float32Array([
      c*sx, s*sx, 0, 0,
      -s*sy, c*sy, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  }

  function mat4ModelRotated(x, y, z, sx, sy, sz, rotation = 0, flipX = false) {
    const c = Math.cos(rotation), s = Math.sin(rotation);
    const scaleX = flipX ? -sx : sx;
    return new Float32Array([
      c*scaleX, s*scaleX, 0, 0,
      -s*sy, c*sy, 0, 0,
      0, 0, sz, 0,
      x, y, z, 1
    ]);
  }

  function mat4Perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  function vec3Normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function vec3Cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function vec3Subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function mat4LookAt(eye, target, up) {
    const z = vec3Normalize(vec3Subtract(eye, target));
    const x = vec3Normalize(vec3Cross(up, z));
    const y = vec3Cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -(x[0]*eye[0] + x[1]*eye[1] + x[2]*eye[2]),
      -(y[0]*eye[0] + y[1]*eye[1] + y[2]*eye[2]),
      -(z[0]*eye[0] + z[1]*eye[1] + z[2]*eye[2]),
      1
    ]);
  }

  function createTexture(draw, w = 256, h = 512, repeat = false) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    return tex;
  }

  const textures = {};
  const assetAspect = {};

  function createImageTexture(url, label = 'image', fallbackUrl = null, aspectOverride = null) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const loadIntoTexture = src => {
      const image = new Image();
      image.onload = () => {
        assetAspect[label] = Number.isFinite(aspectOverride) ? aspectOverride : (image.naturalWidth / image.naturalHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      };
      image.onerror = () => {
        if (fallbackUrl && src !== fallbackUrl) {
          loadIntoTexture(fallbackUrl);
          return;
        }
        if (!label.startsWith('ground')) {
          errorBox.hidden = false;
          errorBox.textContent = `${label} asset could not be loaded.`;
        }
      };
      image.src = src;
    };

    loadIntoTexture(url);
    return tex;
  }

  const imageSourceCache = new Map();
  function loadImageSource(url) {
    let entry = imageSourceCache.get(url);
    if (entry) return entry;
    entry = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    imageSourceCache.set(url, entry);
    return entry;
  }

  function createImageSliceTexture(url, rect, label = 'image-slice') {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    loadImageSource(url).then(image => {
      const sx = Math.max(0, Math.floor(rect.x || 0));
      const sy = Math.max(0, Math.floor(rect.y || 0));
      const sw = Math.max(1, Math.floor(rect.w || image.naturalWidth));
      const sh = Math.max(1, Math.floor(rect.h || image.naturalHeight));
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      assetAspect[label] = sw / sh;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }).catch(() => {
      errorBox.hidden = false;
      errorBox.textContent = `${label} asset could not be loaded.`;
    });

    return tex;
  }

  textures.white = createTexture((ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }, 4, 4);

  function drawFallbackTerrainTexture(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#a58a68');
    grad.addColorStop(0.55, '#8e7355');
    grad.addColorStop(1, '#725a45');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    let seed = 19427;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 860; i++) {
      const x = random() * w;
      const y = random() * h;
      const r = 0.8 + random() * 2.8;
      ctx.globalAlpha = 0.04 + random() * 0.08;
      ctx.fillStyle = random() > 0.58 ? '#ccb08a' : '#564639';
      ctx.beginPath();
      ctx.ellipse(x, y, r * (1.2 + random()), r, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 170; i++) {
      const x = random() * w;
      const y = random() * h;
      const blade = 1.5 + random() * 4.0;
      ctx.globalAlpha = 0.05 + random() * 0.08;
      ctx.strokeStyle = random() > 0.5 ? '#6b7550' : '#7f8a61';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + blade * 0.5);
      ctx.lineTo(x + (-1 + random() * 2.0), y - blade);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function createRepeatingImageTexture(url, label = 'image', options = {}) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const placeholderSize = options.placeholderSize || 256;
    const placeholder = document.createElement('canvas');
    placeholder.width = placeholderSize;
    placeholder.height = placeholderSize;
    const pctx = placeholder.getContext('2d');
    pctx.clearRect(0, 0, placeholder.width, placeholder.height);
    if (typeof options.placeholderDraw === 'function') {
      options.placeholderDraw(pctx, placeholder.width, placeholder.height);
    } else {
      pctx.fillStyle = options.placeholderColor || '#8e7355';
      pctx.fillRect(0, 0, placeholder.width, placeholder.height);
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholder);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    const loadIntoTexture = src => {
      const image = new Image();
      image.onload = () => {
        const potSize = options.potSize || 1024;
        const c = document.createElement('canvas');
        c.width = potSize;
        c.height = potSize;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, potSize, potSize);
        ctx.drawImage(image, 0, 0, potSize, potSize);
        assetAspect[label] = 1;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      };
      image.onerror = () => {
        if (!label.startsWith('ground')) {
          errorBox.hidden = false;
          errorBox.textContent = `${label} asset could not be loaded.`;
        }
      };
      image.src = src;
    };

    loadIntoTexture(url);
    return tex;
  }

  textures.pathDirt = createRepeatingImageTexture('terrain-dirt.png?v=0.2.67', 'terrain dirt texture', {
    placeholderDraw: drawFallbackTerrainTexture,
    potSize: 1024
  });

  textures.treeAtlas = createImageTexture('sidescroll-tree-atlas.png?v=0.2.73', 'SideScroll tree atlas');
  const assetUv = {
    tree01: { scale: [0.242187500, 0.321777344], offset: [0.003906250, 0.674316406] },
    tree02: { scale: [0.242187500, 0.321777344], offset: [0.250000000, 0.674316406] },
    tree03: { scale: [0.242187500, 0.321777344], offset: [0.496093750, 0.674316406] },
    tree04: { scale: [0.242187500, 0.321777344], offset: [0.742187500, 0.674316406] },
    tree05: { scale: [0.242187500, 0.321777344], offset: [0.003906250, 0.344726562] },
    tree06: { scale: [0.242187500, 0.321777344], offset: [0.250000000, 0.344726562] },
    tree07: { scale: [0.242187500, 0.321777344], offset: [0.496093750, 0.344726562] },
    tree08: { scale: [0.242187500, 0.321777344], offset: [0.742187500, 0.344726562] },
    ground01: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground02: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground03: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground04: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground05: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground06: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground07: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground08: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground09: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground10: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground11: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
    ground12: { scale: [1.0, 1.0], offset: [0.0, 0.0] },
  };
  const assetDimensions = {
    tree01: [992, 1318],
    tree02: [992, 1318],
    tree03: [992, 1318],
    tree04: [992, 1318],
    tree05: [992, 1318],
    tree06: [992, 1318],
    tree07: [992, 1318],
    tree08: [992, 1318],
    ground01: [937, 603],
    ground02: [924, 485],
    ground03: [930, 602],
    ground04: [931, 514],
    ground05: [926, 531],
    ground06: [922, 483],
    ground07: [931, 418],
    ground08: [928, 442],
    ground09: [933, 511],
    ground10: [940, 484],
    ground11: [937, 361],
    ground12: [934, 480],
  };
  Object.entries(assetDimensions).forEach(([key, size]) => {
    assetAspect[key] = size[0] / size[1];
    if (key.startsWith('tree')) {
      textures[key] = textures.treeAtlas;
    } else {
      textures[key] = createImageTexture(
        `sidescroll-${key.replace('ground', 'ground-')}.png?v=0.2.79`,
        key,
        null,
        size[0] / size[1]
      );
    }
  });

  // Gameplay asset: a deliberately simple, readable wooden crate.  It is
  // generated in code so it has no extra file dependency and can be used as
  // the first editor-authored platform/obstacle.
  assetAspect.crate = 1.08;
  textures.crate = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // Fill the texture right down to the billboard baseline.  The previous
    // crate art had transparent padding beneath it, so the geometry was on the
    // path while the visible box appeared to float above it.
    const x = 18, y = 10, cw = 220, ch = 246;
    const topDepth = 20;
    ctx.fillStyle = '#a97b4e';
    ctx.beginPath(); ctx.moveTo(x, y + topDepth); ctx.lineTo(x + 24, y); ctx.lineTo(x + cw, y); ctx.lineTo(x + cw - 22, y + topDepth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#775339';
    ctx.beginPath(); ctx.moveTo(x + cw - 22, y + topDepth); ctx.lineTo(x + cw, y); ctx.lineTo(x + cw, y + ch - 8); ctx.lineTo(x + cw - 22, y + ch); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(x, y + topDepth, x, y + ch);
    g.addColorStop(0, '#b78654'); g.addColorStop(1, '#8b5f3d');
    ctx.fillStyle = g; ctx.fillRect(x, y + topDepth, cw - 22, ch - topDepth);
    ctx.strokeStyle = '#5d402e'; ctx.lineWidth = 8; ctx.strokeRect(x + 4, y + topDepth + 4, cw - 32, ch - topDepth - 8);
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x + 12, y + topDepth + 12); ctx.lineTo(x + cw - 36, y + ch - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + cw - 36, y + topDepth + 12); ctx.lineTo(x + 12, y + ch - 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,198,143,.42)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 12, y + topDepth + 15); ctx.lineTo(x + cw - 38, y + topDepth + 15); ctx.stroke();
    for (let i=0;i<7;i++) {
      ctx.strokeStyle = `rgba(77,49,32,${0.12 + i*0.012})`; ctx.lineWidth = 2;
      const yy = y + topDepth + 32 + i * 27; ctx.beginPath(); ctx.moveTo(x + 16, yy); ctx.lineTo(x + cw - 42, yy + (i%2?2:-2)); ctx.stroke();
    }
  }, 256, 256, false);

  // v0.2.31 completion reward prototype. Keep this procedural so the reward
  // system adds no new asset file: later we can simply swap this texture for
  // authored art without changing collection/inventory logic.
  assetAspect['forest-key'] = 1.18;
  textures['forest-key'] = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.48, h * 0.48, 6, w * 0.48, h * 0.48, w * 0.44);
    glow.addColorStop(0, 'rgba(239,220,159,.34)');
    glow.addColorStop(1, 'rgba(239,220,159,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#c9ad69';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.42, w * 0.13, 0, Math.PI * 2);
    ctx.moveTo(w * 0.44, h * 0.50);
    ctx.lineTo(w * 0.76, h * 0.72);
    ctx.lineTo(w * 0.82, h * 0.64);
    ctx.moveTo(w * 0.67, h * 0.66);
    ctx.lineTo(w * 0.74, h * 0.57);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,244,202,.60)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w * 0.34, h * 0.42, w * 0.10, Math.PI * 1.05, Math.PI * 1.92);
    ctx.stroke();
  }, 256, 256, false);

  assetAspect.softShadow = 2.4;
  textures.softShadow = createTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.58, 10, w * 0.5, h * 0.58, w * 0.42);
    g.addColorStop(0, 'rgba(22,18,16,.58)');
    g.addColorStop(0.55, 'rgba(22,18,16,.34)');
    g.addColorStop(1, 'rgba(22,18,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.58, w * 0.42, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }, 256, 128, true);


  // -------------------------------------------------------------------------
  // PUZZLE ASSET PACKS
  // -------------------------------------------------------------------------
  // Puzzle definitions live in puzzle-groups.js.  Their art is resolved through
  // named packs so the authored layout never has to know whether an asset is a
  // temporary generated texture or, later, a rectangle in a finished atlas.
  const puzzleConfig = window.SideScrollPuzzleConfig || { assetPacks:{}, groups:{}, markers:[], streaming:{} };
  const puzzlePackRuntime = new Map();

  function drawPuzzleGeneratedAsset(ctx, w, h, generator) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const crate = (base, edge, brace, variant = 0) => {
      const x=18, y=14, cw=w-36, ch=h-20;
      const g=ctx.createLinearGradient(0,y,0,y+ch);
      g.addColorStop(0, base); g.addColorStop(1, edge);
      ctx.fillStyle=g; ctx.fillRect(x,y,cw,ch);
      ctx.strokeStyle='#4b3a2d'; ctx.lineWidth=8; ctx.strokeRect(x+4,y+4,cw-8,ch-8);
      ctx.strokeStyle=brace; ctx.lineWidth=11;
      if (variant !== 2) { ctx.beginPath();ctx.moveTo(x+14,y+16);ctx.lineTo(x+cw-14,y+ch-16);ctx.stroke(); }
      if (variant !== 1) { ctx.beginPath();ctx.moveTo(x+cw-14,y+16);ctx.lineTo(x+14,y+ch-16);ctx.stroke(); }
      ctx.strokeStyle='rgba(244,220,179,.32)';ctx.lineWidth=2;
      for(let i=0;i<5;i++){const yy=y+32+i*36;ctx.beginPath();ctx.moveTo(x+14,yy);ctx.lineTo(x+cw-14,yy+(i%2?2:-2));ctx.stroke();}
    };

    if (generator === 'crateA') return crate('#aa7c4b','#815737','#5d412d',0);
    if (generator === 'crateB') return crate('#9c7249','#755137','#553d2f',1);
    if (generator === 'crateC') return crate('#b18452','#855c39','#65462f',2);

    if (generator === 'fallenTree') {
      // Intentionally chunky greybox silhouette: large root plate + crooked
      // trunk.  Its height matches the collision so climb testing is honest.
      ctx.strokeStyle='#46372c'; ctx.lineWidth=42;
      ctx.beginPath(); ctx.moveTo(36,h-30); ctx.bezierCurveTo(72,h-98,138,h-132,w-30,44); ctx.stroke();
      ctx.strokeStyle='#745238'; ctx.lineWidth=31;
      ctx.beginPath(); ctx.moveTo(38,h-32); ctx.bezierCurveTo(74,h-96,140,h-128,w-31,45); ctx.stroke();
      ctx.strokeStyle='rgba(215,184,139,.30)';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(64,h-72);ctx.bezierCurveTo(105,h-103,151,h-128,w-52,63);ctx.stroke();
      ctx.fillStyle='#5a4635';
      for (let i=0;i<7;i++) {
        const a=-1.2+i*.39, rx=36+Math.cos(a)*45, ry=h-37+Math.sin(a)*42;
        ctx.beginPath();ctx.moveTo(43,h-40);ctx.lineTo(rx,ry);ctx.lineTo(rx+9,ry-8);ctx.closePath();ctx.fill();
      }
      ctx.strokeStyle='#5d432e';ctx.lineWidth=15;
      ctx.beginPath();ctx.moveTo(w*.57,h*.46);ctx.lineTo(w*.48,h*.23);ctx.stroke();
      ctx.beginPath();ctx.moveTo(w*.72,h*.32);ctx.lineTo(w*.82,h*.14);ctx.stroke();
      return;
    }

    if (generator === 'logShort' || generator === 'logLong') {
      const yy=h*.58, x0=18, x1=w-18;
      ctx.strokeStyle='#49372b';ctx.lineWidth=h*.45;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy-h*.08);ctx.stroke();
      ctx.strokeStyle='#76533a';ctx.lineWidth=h*.34;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy-h*.08);ctx.stroke();
      ctx.fillStyle='#9c7857';ctx.beginPath();ctx.ellipse(x1,yy-h*.08,h*.15,h*.20,-.05,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(226,200,161,.32)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+20,yy-5);ctx.lineTo(x1-26,yy-h*.08-5);ctx.stroke();
      return;
    }

    if (generator === 'barrel') {
      const x=w*.20,y=h*.07,bw=w*.60,bh=h*.88;
      const g=ctx.createLinearGradient(x,0,x+bw,0);g.addColorStop(0,'#694934');g.addColorStop(.5,'#a7774b');g.addColorStop(1,'#60432f');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(w*.5,y+bw*.08,bw*.5,bw*.12,0,Math.PI,Math.PI*2);ctx.rect(x,y+bw*.08,bw,bh-bw*.16);ctx.ellipse(w*.5,y+bh-bw*.08,bw*.5,bw*.12,0,0,Math.PI);ctx.fill();
      ctx.strokeStyle='#3f4240';ctx.lineWidth=8;for(const q of [.22,.72]){const yy=y+bh*q;ctx.beginPath();ctx.moveTo(x-3,yy);ctx.lineTo(x+bw+3,yy);ctx.stroke();}
      return;
    }
  }

  function ensurePuzzleAssetPack(packName) {
    const pack = puzzleConfig.assetPacks?.[packName];
    if (!pack) return;
    let runtime = puzzlePackRuntime.get(packName);
    if (!runtime) {
      runtime = { refs:0, created:[] };
      for (const asset of pack.assets || []) {
        if (!textures[asset.name]) {
          if (asset.url) {
            textures[asset.name] = createImageTexture(asset.url, asset.name, null, asset.aspect || null);
            if (asset.aspect) assetAspect[asset.name] = asset.aspect;
          } else if (pack.image && asset.slice) {
            textures[asset.name] = createImageSliceTexture(pack.image, asset.slice, asset.name);
            assetAspect[asset.name] = asset.aspect || ((asset.slice?.w || 1) / Math.max(1, (asset.slice?.h || 1)));
          } else {
            textures[asset.name] = createTexture((ctx,w,h) => drawPuzzleGeneratedAsset(ctx,w,h,asset.generator), 256, 256, false);
            assetAspect[asset.name] = asset.aspect || 1;
          }
          runtime.created.push(asset.name);
        }
      }
      puzzlePackRuntime.set(packName, runtime);
    }
    runtime.refs += 1;
  }

  function releasePuzzleAssetPack(packName) {
    const runtime = puzzlePackRuntime.get(packName);
    if (!runtime) return;
    // Puzzle packs are deliberately resident for the lifetime of the page.
    // Seven small authored textures are cheaper than risking stale WebGL
    // handles when editor/test streaming rapidly unloads and reloads a group.
    runtime.refs = Math.max(0, runtime.refs - 1);
  }

  textures.rigAtlas = createImageTexture(Rig.ATLAS.url.startsWith('data:') ? Rig.ATLAS.url : `${Rig.ATLAS.url}?v=0.2.2`, 'Walk Lab cutout rig atlas');

  function mulberry32(seed) {
    return function() {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(924315);
  const TILE = { minX: -62, maxX: 62 };
  const TILE_WIDTH = TILE.maxX - TILE.minX;
  const WORLD = { nearZ: 10.5, farZ: -42 };
  // v0.2.65: a slightly bluer fog with a gentler near-field contribution.
  // The fragment shader adds an eased/power curve so contrast stays stronger
  // around the player and falls away progressively deeper into the forest.
  const DEFAULT_FOG = { enabled:true, color:[0.835,0.885,0.945], near:7.8, far:46.0, amount:0.90, curve:1.65 };
  const DEFAULT_POST = { brightness:1.0, contrast:1.0, saturation:1.0, tintColor:[1,1,1], tintAmount:0.0 };
  const RENDER_FOG_STORAGE_KEY = 'sidescroll.render.fog.v1';
  const RENDER_POST_STORAGE_KEY = 'sidescroll.render.post.v1';

  function clampNumber(value, fallback, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function loadRenderSettings(storageKey, defaults, colorKey) {
    const result = { ...defaults, [colorKey]: [...defaults[colorKey]] };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || typeof saved !== 'object') return result;
      for (const key of Object.keys(defaults)) {
        if (key === colorKey) continue;
        if (typeof defaults[key] === 'boolean') {
          if (typeof saved[key] === 'boolean') result[key] = saved[key];
        } else if (Number.isFinite(defaults[key]) && Number.isFinite(Number(saved[key]))) {
          result[key] = Number(saved[key]);
        }
      }
      if (Array.isArray(saved[colorKey]) && saved[colorKey].length >= 3) {
        result[colorKey] = saved[colorKey].slice(0,3).map((v,i) =>
          clampNumber(v, defaults[colorKey][i], 0, 1)
        );
      }
    } catch (_) {}
    return result;
  }

  const fogSettings = loadRenderSettings(RENDER_FOG_STORAGE_KEY, DEFAULT_FOG, 'color');
  fogSettings.near = clampNumber(fogSettings.near, DEFAULT_FOG.near, 0, 60);
  fogSettings.far = clampNumber(fogSettings.far, DEFAULT_FOG.far, 1, 100);
  fogSettings.amount = clampNumber(fogSettings.amount, DEFAULT_FOG.amount, 0, 1);
  fogSettings.curve = clampNumber(fogSettings.curve, DEFAULT_FOG.curve, 0.2, 5);

  const postSettings = loadRenderSettings(RENDER_POST_STORAGE_KEY, DEFAULT_POST, 'tintColor');
  postSettings.brightness = clampNumber(postSettings.brightness, DEFAULT_POST.brightness, 0.6, 1.4);
  postSettings.contrast = clampNumber(postSettings.contrast, DEFAULT_POST.contrast, 0.5, 1.6);
  postSettings.saturation = clampNumber(postSettings.saturation, DEFAULT_POST.saturation, 0, 1.6);
  postSettings.tintAmount = clampNumber(postSettings.tintAmount, DEFAULT_POST.tintAmount, 0, 0.6);

  function saveFogSettings() {
    try {
      localStorage.setItem(RENDER_FOG_STORAGE_KEY, JSON.stringify({
        enabled:!!fogSettings.enabled,
        color:[...fogSettings.color],
        near:fogSettings.near,
        far:fogSettings.far,
        amount:fogSettings.amount,
        curve:fogSettings.curve
      }));
    } catch (_) {}
  }

  function savePostSettings() {
    try {
      localStorage.setItem(RENDER_POST_STORAGE_KEY, JSON.stringify({
        brightness:postSettings.brightness,
        contrast:postSettings.contrast,
        saturation:postSettings.saturation,
        tintColor:[...postSettings.tintColor],
        tintAmount:postSettings.tintAmount
      }));
    } catch (_) {}
  }
  const fogColor = fogSettings.color;
  const PROCEDURAL_TREE_SCALE = 0.96;
  const HIDE_LEGACY_GROUND_DRESSING = false;
  const groundY = -4.55;

  // Think of this exactly like a top-down forest plan: a clear path runs along X,
  // the character walks down its centre, and woodland begins on either side.
  const pathZ = 0.0;
  const PATH_FLAT_HALF = 2.45;
  const PATH_BERM_HALF = 2.95;
  const PATH_OUTER_HALF = 3.60;
  const PATH_TOP_RISE = 0.12;
  const FAR_SIDE_START = -PATH_OUTER_HALF;
  const NEAR_SIDE_START = PATH_OUTER_HALF;

  function pathLocalX(x) {
    let local = ((x + TILE_WIDTH * 0.5) % TILE_WIDTH + TILE_WIDTH) % TILE_WIDTH - TILE_WIDTH * 0.5;
    return local;
  }

  function pathUndulationAtX(x) {
    const t = pathLocalX(x) / TILE_WIDTH + 0.5;
    return pathUndulationUnit(t);
  }

  function pathProfileHeight(z) {
    const az = Math.abs(z);
    if (az <= PATH_FLAT_HALF) return PATH_TOP_RISE;
    if (az <= PATH_BERM_HALF) {
      const t = (az - PATH_FLAT_HALF) / Math.max(0.001, PATH_BERM_HALF - PATH_FLAT_HALF);
      return Rig.lerp(PATH_TOP_RISE, 0.22, t);
    }
    if (az <= PATH_OUTER_HALF) {
      const t = (az - PATH_BERM_HALF) / Math.max(0.001, PATH_OUTER_HALF - PATH_BERM_HALF);
      return Rig.lerp(0.22, 0.0, t);
    }
    return 0;
  }

  function pathGroundYAt(x, z = 0) {
    return groundY + pathProfileHeight(z) + pathUndulationAtX(x);
  }

  // One authoritative playable floor height.  Character feet, locked gameplay
  // objects and platform collision all reference this same centre line rather
  // than each using a slightly different interpretation of the path mesh.
  function playSurfaceYAt(x) {
    return pathGroundYAt(x, pathZ);
  }

  const CRATE_HALF_WIDTH_FACTOR = 0.43;
  const CRATE_COLLISION_HEIGHT_FACTOR = 0.96;
  // Stackable props share one authored gameplay height. Their artwork can vary,
  // but stacking/carry placement always reasons about the same vertical step.
  // v0.2.45: raised from 0.48 so the physical stack block better matches the
  // visible log artwork instead of allowing neighbouring logs to intersect.
  const STACK_ITEM_HEIGHT = 0.68;
  const STACK_SEARCH_RADIUS = 2.00;
  const STACK_COLUMN_ALIGN_TOLERANCE = 0.42;
  const EDITOR_STACK_SNAP_RADIUS = 0.46;
  const STACK_ASSIST_SPEED = 0.92;
  const STACK_ASSIST_MAX = 0.78;
  const STACK_ASSIST_ROOT_GAP = 0.92;
  const SOCKET_SEARCH_RADIUS = 1.85;
  const SOCKET_DEPTH_BIAS = 0.035;
  // The painted boots extend up to ~0.087 rig units below their ankle/toe baseline in
  // the v4 atlas.  Raise only the rendered rig by that amount so the visible
  // soles, not the internal bone line, sit on the playable floor.
  const CHARACTER_SOLE_ART_LOCAL_OFFSET = 0.0870;


  // World-anchored dirt floor.  Earlier builds moved this plane with the
  // camera, which made the UV pattern visibly slide beneath gaps in the
  // foliage.  It now spans one complete repeating scene tile in X and reaches
  // from just behind the camera all the way into the fog.  wrapX() moves it by
  // whole tile widths only, so both geometry and UVs remain fixed in world space.
  const GROUND_NEAR_Z = 14.25;
  const ground = {
    mesh: groundMesh,
    texture: textures.pathDirt,
    x: 0,
    y: groundY - 0.015,
    z: GROUND_NEAR_Z,
    sx: TILE_WIDTH,
    sy: 1,
    sz: GROUND_NEAR_Z - WORLD.farZ,
    layer: 'ground',
    tint: [1.0, 1.0, 1.0],
    opacity: 1,
    uvScale: [24, 11],
    noFog: false,
    wrap: true
  };


  const pathStrip = {
    mesh: pathMesh,
    texture: textures.pathDirt,
    x: 0,
    y: groundY,
    z: pathZ,
    sx: TILE_WIDTH,
    sy: 1,
    sz: PATH_OUTER_HALF,
    layer: 'ground',
    tint: [1.0, 1.0, 1.0],
    opacity: 1,
    uvScale: [1, 1],
    noFog: false,
    wrap: true
  };

  const backdrop = [];
  const midfill = [];
  const frontOccluders = [];

  const SCENE_STORAGE_KEY = 'sidescroll.scene.v1';
  const ASSET_BEHAVIOUR_STORAGE_KEY = 'sidescroll.asset-behaviours.v1';
  const ASSET_COLLISION_STORAGE_KEY = 'sidescroll.asset-collisions.v1';
  const ASSET_BEHAVIOUR_KEYS = ['solid','carryable','placeable','supportSurface','stackable','socketHost','socketPiece'];
  const EMPTY_ASSET_BEHAVIOURS = Object.freeze({
    solid:false, carryable:false, placeable:false, supportSurface:false, stackable:false, socketHost:false, socketPiece:false
  });
  const ASSET_BEHAVIOUR_DEFAULTS = {
    crate: { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-a': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-b': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-c': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'puzzle-log-d': { solid:true, carryable:true, placeable:true, supportSurface:true, stackable:true },
    'fallen-tree': { solid:true, supportSurface:true },
    'tree-stump': {},
    'broken-branch': {},
    'stone-wall': { socketHost:true },
    'stone-piece-a': { carryable:true, placeable:true, socketPiece:true },
    'stone-piece-b': { carryable:true, placeable:true, socketPiece:true },
    'stone-piece-c': { carryable:true, placeable:true, socketPiece:true },
    'forest-key': {}
  };
  const ASSET_BEHAVIOUR_DEFS = [
    { key:'solid', label:'Solid', description:'Adds physical collision to this asset type.' },
    { key:'carryable', label:'Carryable', description:'ACTION can pick this asset up. Enabling this also makes it placeable.' },
    { key:'placeable', label:'Placeable', description:'A carried copy may be put back down into the world.' },
    { key:'supportSurface', label:'Support Surface', description:'The top of its collision can support the player and stackable props.' },
    { key:'stackable', label:'Stackable', description:'This asset may settle onto a support surface when placed.' },
    { key:'socketHost', label:'Socket Host', description:'Allows socket-piece targets to be authored directly onto this asset.' },
    { key:'socketPiece', label:'Socket Piece', description:'Allows an individual puzzle piece to be linked to a matching authored socket.' }
  ];
  let assetBehaviourOverrides = (() => {
    try {
      const raw = localStorage.getItem(ASSET_BEHAVIOUR_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.assets?.behaviourOverrides || {}));
  })();

  let assetCollisionDefaults = (() => {
    try {
      const raw = localStorage.getItem(ASSET_COLLISION_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.assets?.collisionDefaults || {}));
  })();

  function saveAssetCollisionDefaults() {
    try { localStorage.setItem(ASSET_COLLISION_STORAGE_KEY, JSON.stringify(assetCollisionDefaults)); } catch (_) {}
  }

  function objectIsStackAssetName(assetName) {
    return !!assetBehaviours(assetName)?.stackable;
  }

  function normalizeAssetCollision(collision, sx, sy, assetName) {
    if (!collision) return null;
    const safeSx = Math.max(0.001, Math.abs(Number(sx) || 1));
    const safeSy = Math.max(0.001, Math.abs(Number(sy) || 1));
    return {
      halfWidthRatio: Math.max(0.01, Number(collision.halfWidth) || 0.01) / safeSx,
      heightRatio: objectIsStackAssetName(assetName) ? null : Math.max(0.01, Number(collision.height) || 0.01) / safeSy,
      fixedHeight: objectIsStackAssetName(assetName) ? STACK_ITEM_HEIGHT : null,
      depthRatio: Math.max(0.01, Number(collision.depth) || 0.01) / safeSx,
      points: normalisedCollisionPoints(collision).map(point => ({ x:Number(point.x)||0, y:Number(point.y)||0 }))
    };
  }

  function collisionFromAssetDefault(assetName, sx, sy) {
    const def = assetCollisionDefaults[assetName];
    if (!def) return null;
    const width = Math.max(0.001, Math.abs(Number(sx) || 1));
    const height = Math.max(0.001, Math.abs(Number(sy) || 1));
    return {
      halfWidth: Math.max(0.01, (Number(def.halfWidthRatio) || 0.4) * width),
      height: Number.isFinite(def.fixedHeight) ? Number(def.fixedHeight) : Math.max(0.01, (Number(def.heightRatio) || 0.6) * height),
      depth: Math.max(0.01, (Number(def.depthRatio) || 0.4) * width),
      platform: !!assetBehaviours(assetName).supportSurface,
      points: Array.isArray(def.points) && def.points.length >= 3 ? def.points.map(point => ({...point})) : defaultCollisionPoints(),
      behaviourGenerated: false,
      assetInherited: true
    };
  }

  function hasAssetBehaviourProfile(assetName) {
    return Object.prototype.hasOwnProperty.call(ASSET_BEHAVIOUR_DEFAULTS, assetName) || Object.prototype.hasOwnProperty.call(assetBehaviourOverrides, assetName);
  }

  function assetBehaviours(assetName) {
    const defaults = ASSET_BEHAVIOUR_DEFAULTS[assetName] || EMPTY_ASSET_BEHAVIOURS;
    const overrides = assetBehaviourOverrides[assetName] || {};
    const merged = { ...EMPTY_ASSET_BEHAVIOURS, ...defaults, ...overrides };
    if (merged.carryable) merged.placeable = true;
    if (merged.supportSurface) merged.solid = true;
    if (merged.stackable) merged.placeable = true;
    return merged;
  }

  function objectHasBehaviour(obj, key) {
    if (!obj || obj.deleted) return false;
    return !!assetBehaviours(obj.assetName)[key];
  }

  function saveAssetBehaviourOverrides() {
    try { localStorage.setItem(ASSET_BEHAVIOUR_STORAGE_KEY, JSON.stringify(assetBehaviourOverrides)); } catch (_) {}
  }

  let sceneIdCounter = 0;
  let userSceneCounter = 0;

  const sceneData = (() => {
    try {
      const raw = localStorage.getItem(SCENE_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || 'null');
        if (parsed && (parsed.version === 2 || parsed.version === 3 || parsed.version === 4)) {
          parsed.version = 4;
          parsed.overrides ||= {};
          parsed.added ||= [];
          return parsed;
        }
      }
    } catch (_) {}
    const baked = BAKED_GAME_DESIGN?.scene?.edits;
    if (baked && (baked.version === 2 || baked.version === 3 || baked.version === 4)) {
      const parsed = JSON.parse(JSON.stringify(baked));
      parsed.version = 4;
      parsed.overrides ||= {};
      parsed.added ||= [];
      return parsed;
    }
    return { version: 4, overrides: {}, added: [] };
  })();

  function saveSceneData() {
    try { localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(sceneData)); } catch (_) {}
  }

  function classifyLayer(z) {
    if (z > 1.2) return 'foreground';
    if (z > -9) return 'near';
    if (z > -24) return 'mid';
    return 'far';
  }

  function cloneCollision(collision) {
    if (!collision) return null;
    return {
      ...collision,
      points: Array.isArray(collision.points)
        ? collision.points.map(point => ({ x: Number(point.x) || 0, y: Number(point.y) || 0 }))
        : null
    };
  }

  function defaultCollisionPoints() {
    return [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
  }

  function normalisedCollisionPoints(collision) {
    const pts = collision?.points;
    return Array.isArray(pts) && pts.length >= 3 ? pts : defaultCollisionPoints();
  }

  function behaviourNeedsCollision(behaviour) {
    return !!(behaviour?.solid || behaviour?.carryable || behaviour?.supportSurface || behaviour?.stackable);
  }

  function behaviourCollisionFor(assetName, width, height, existing = null) {
    const behaviour = assetBehaviours(assetName);
    const inherited = collisionFromAssetDefault(assetName, width, height);
    if (inherited) return inherited;
    if (!hasAssetBehaviourProfile(assetName)) return cloneCollision(existing);
    let collision = cloneCollision(existing);
    if (!collision && behaviourNeedsCollision(behaviour)) {
      collision = {
        halfWidth: Math.max(0.18, width * CRATE_HALF_WIDTH_FACTOR),
        height: behaviour.stackable ? STACK_ITEM_HEIGHT : Math.max(0.24, height * CRATE_COLLISION_HEIGHT_FACTOR),
        depth: Math.max(0.46, Math.min(1.08, width * 0.42)),
        platform: !!behaviour.supportSurface,
        points: defaultCollisionPoints(),
        behaviourGenerated: true
      };
    }
    if (collision) collision.platform = !!behaviour.supportSurface;
    return collision;
  }

  function addObject(collection, type, x, z, width, height, opts = {}) {
    const resolvedHeight = height;
    const resolvedWidth = width ?? resolvedHeight * (assetAspect[type] || 1);
    const category = opts.category || 'dressing';
    const obj = {
      id: opts.id || `proc-${++sceneIdCounter}`,
      mesh: billboardMesh,
      texture: textures[type],
      uvScale: opts.uvScale || assetUv[type]?.scale || [1, 1],
      uvOffset: opts.uvOffset || assetUv[type]?.offset || [0, 0],
      x,
      y: opts.y ?? groundY,
      z,
      sx: resolvedWidth,
      sy: resolvedHeight,
      baseSx: opts.baseSx ?? resolvedWidth,
      baseSy: opts.baseSy ?? resolvedHeight,
      sz: 1,
      flip: opts.flip ?? (type.startsWith('tree') ? false : (rand() > 0.5)),
      shade: opts.shade ?? 1,
      opacity: opts.opacity ?? 1,
      noFog: !!opts.noFog,
      tint: opts.tint || null,
      asset: true,
      assetName: type,
      category,
      gameplayType: opts.gameplayType || null,
      gameplayLayerLocked: typeof opts.gameplayLayerLocked === 'boolean' ? opts.gameplayLayerLocked : category === 'gameplay',
      layer: opts.layer || classifyLayer(z),
      wrap: opts.wrap !== false,
      collision: category === 'gameplay'
        ? (opts.collisionOverride ? cloneCollision(opts.collision) : behaviourCollisionFor(type, resolvedWidth, resolvedHeight, opts.collision))
        : cloneCollision(opts.collision),
      collisionOverride: !!opts.collisionOverride,
      shadow: opts.shadow ? { ...opts.shadow } : null,
      deleted: !!opts.deleted,
      carried: false,
      userAdded: !!opts.userAdded,
      puzzleInstanceId: opts.puzzleInstanceId || null,
      puzzleObjectId: opts.puzzleObjectId || null,
      sockets: Array.isArray(opts.sockets) ? opts.sockets.map(socket => ({ ...socket })) : [],
      socketedTo: opts.socketedTo ? { ...opts.socketedTo } : null
    };
    collection.push(obj);
    return obj;
  }

  function scatterForest() {
    const trees = ['tree01', 'tree02', 'tree03', 'tree04', 'tree05', 'tree06', 'tree07', 'tree08'];
    const dressingDefs = {
      ground01: { family:'foliage', weight:1.34, hMin:1.00, hMax:1.34, radius:0.96, same:4.0, nearWeight:1.32, farWeight:1.56 },
      ground02: { family:'foliage', weight:1.12, hMin:1.26, hMax:1.68, radius:1.28, same:5.2, nearWeight:1.02, farWeight:1.16 },
      ground03: { family:'foliage', weight:1.08, hMin:1.18, hMax:1.62, radius:1.18, same:4.7, nearWeight:1.22, farWeight:1.04 },
      ground04: { family:'foliage', weight:1.04, hMin:1.18, hMax:1.64, radius:1.24, same:4.8, nearWeight:1.08, farWeight:1.18 },
      ground05: { family:'foliage', weight:0.72, hMin:0.98, hMax:1.28, radius:0.92, same:5.2, nearWeight:0.72, farWeight:1.42 },
      ground06: { family:'foliage', weight:1.10, hMin:1.16, hMax:1.56, radius:1.22, same:4.8, nearWeight:1.14, farWeight:1.06 },
      ground07: { family:'foliage', weight:0.72, hMin:0.86, hMax:1.10, radius:1.02, same:4.8, nearWeight:0.90, farWeight:1.22 },
      ground08: { family:'foliage',    weight:0.50, hMin:1.04, hMax:1.34, radius:1.34, same:5.8, nearWeight:0.76, farWeight:0.78 },
      ground09: { family:'rock', weight:0.82, hMin:0.80, hMax:1.00, radius:0.94, same:4.4, nearWeight:0.84, farWeight:1.62 },
      ground10: { family:'rock', weight:0.36, hMin:1.06, hMax:1.36, radius:1.28, same:5.8, nearWeight:0.68, farWeight:0.58 },
      ground11: { family:'foliage', weight:1.18, hMin:0.98, hMax:1.28, radius:0.94, same:4.0, nearWeight:1.28, farWeight:1.54 },
      ground12: { family:'foliage', weight:0.94, hMin:1.06, hMax:1.42, radius:1.08, same:4.4, nearWeight:1.12, farWeight:0.96 }
    };

    const placedTrees = [];
    const placedDressings = [];
    const nearestTreeZ = -(PATH_FLAT_HALF + 0.42); // pull some trunks closer so the run feels more inside the forest while preserving a clear gameplay strip.
    const treeGeneralSpacing = 2.95;
    const treeSameVariantSpacing = 12.5;
    const dressingGeneralSpacing = 0.82;
    const dressingFamilySpacing = { foliage:0.90, twig:0.84, rock:1.08 };

    function wrappedXDistance(a, b) {
      const raw = Math.abs(a - b);
      return Math.min(raw, Math.max(0, TILE_WIDTH - raw));
    }

    function planarDistance(a, x, z) {
      return Math.hypot(wrappedXDistance(a.x, x), a.z - z);
    }

    function canUseTreePosition(x, z) {
      return !placedTrees.some(tree => planarDistance(tree, x, z) < treeGeneralSpacing);
    }

    function chooseTreeVariant(x, z) {
      const start = Math.floor(rand() * trees.length);
      for (let offset = 0; offset < trees.length; offset++) {
        const type = trees[(start + offset) % trees.length];
        const tooClose = placedTrees.some(tree => tree.type === type && planarDistance(tree, x, z) < treeSameVariantSpacing);
        if (!tooClose) return type;
      }
      return null;
    }

    function addProceduralTree(x, z, baseHeight, index, shadeBase = 0.97, opacityBase = 0.94) {
      if (!canUseTreePosition(x, z)) return false;
      const type = chooseTreeVariant(x, z);
      if (!type) return false;
      const height = baseHeight * PROCEDURAL_TREE_SCALE;
      addObject(backdrop, type, x, z, null, height, {
        id: `forest263-${index}`,
        shade: shadeBase + rand() * 0.09,
        opacity: opacityBase + rand() * (1.0 - opacityBase),
        layer: classifyLayer(z)
      });
      placedTrees.push({ x, z, type });
      return true;
    }

    // Main forest. Trees stay far-side only, while the nearer distribution and
    // repeat-spacing keep the player feeling inside the forest rather than
    // running next to a flat wallpaper line.
    let placed = 0;
    let attempts = 0;
    const targetMainTrees = 118;
    while (placed < targetMainTrees && attempts < 3600) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.40) {
        z = -(PATH_FLAT_HALF + 0.34 + Math.pow(rand(), 1.70) * 2.1);
      } else if (bandPick < 0.78) {
        z = nearestTreeZ - Math.pow(rand(), 1.42) * 5.0;
      } else {
        const depth = Math.pow(rand(), 1.12);
        z = nearestTreeZ - 0.6 - depth * 33.2;
      }
      z = Math.max(WORLD.farZ + 1.4, z);
      const depth01 = Math.min(1, Math.max(0, (-z - 4.0) / 35.0));
      const baseHeight = 10.0 + rand() * (7.9 - depth01 * 1.0);
      if (addProceduralTree(x, z, baseHeight, `main-${placed}`)) placed += 1;
    }

    let accents = 0;
    attempts = 0;
    const targetAccents = 24;
    while (accents < targetAccents && attempts < 1400) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -13.5 - rand() * 22.5;
      const baseHeight = 14.2 + rand() * 7.0;
      if (addProceduralTree(x, z, baseHeight, `accent-${accents}`, 0.99, 0.90)) accents += 1;
    }

    function pickWeightedDressing(side) {
      const sideKey = side > 0 ? 'nearWeight' : 'farWeight';
      const entries = Object.entries(dressingDefs);
      let total = 0;
      for (const [, def] of entries) total += def.weight * (def[sideKey] ?? 1);
      let pick = rand() * total;
      for (const [type, def] of entries) {
        pick -= def.weight * (def[sideKey] ?? 1);
        if (pick <= 0) return [type, def];
      }
      return entries[entries.length - 1];
    }

    function canUseDressingPosition(type, def, x, z, height) {
      const ownRadius = Math.max(dressingGeneralSpacing, def.radius * (0.78 + height * 0.16));
      for (const item of placedDressings) {
        const d = planarDistance(item, x, z);
        const familyMin = Math.max(dressingFamilySpacing[def.family] || dressingGeneralSpacing, dressingFamilySpacing[item.family] || dressingGeneralSpacing);
        const minDistance = Math.max(ownRadius, item.radius, familyMin);
        if (d < minDistance) return false;
        if (item.type === type && d < Math.max(def.same || 5.0, item.same || 5.0)) return false;
      }
      return true;
    }

    function addProceduralDressing(x, z, side, index) {
      const [type, def] = pickWeightedDressing(side);
      const edgeDistance = Math.max(0, Math.abs(z) - PATH_FLAT_HALF);
      const edge01 = Math.min(1, edgeDistance / 6.0);
      const scaleMul = 0.98 + rand() * 0.20 + edge01 * 0.24;
      const height = (def.hMin + rand() * (def.hMax - def.hMin)) * scaleMul;
      if (!canUseDressingPosition(type, def, x, z, height)) return false;
      const obj = addObject(targetCollectionForZ(z), type, x, z, null, height, {
        id: `dressing263-${index}`,
        y: pathGroundYAt(x, z),
        shade: 0.985 + rand() * 0.055,
        opacity: 0.95 + rand() * 0.05,
        layer: classifyLayer(z)
      });
      placedDressings.push({ x, z, type, family:def.family, radius:Math.max(dressingGeneralSpacing, def.radius * (0.74 + height * 0.15)), same:def.same || 5.0, obj });
      return true;
    }

    // Re-enable the path-edge foliage/rock pass with the updated authored art.
    // Dressing stays readable (no tiny sprites), fills tree gaps on the far side,
    // and comes in much closer on both edges so the run feels wrapped by foliage.
    let farPlaced = 0;
    attempts = 0;
    const farTarget = 236;
    while (farPlaced < farTarget && attempts < 10400) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.34) {
        z = -(PATH_FLAT_HALF + 0.10 + Math.pow(rand(), 1.72) * 1.9);
      } else if (bandPick < 0.86) {
        z = -(PATH_BERM_HALF + 0.02 + Math.pow(rand(), 1.18) * 6.5);
      } else {
        z = -(PATH_OUTER_HALF + 0.9 + Math.pow(rand(), 1.06) * 10.8);
      }
      z = Math.max(WORLD.farZ + 3.0, Math.min(-(PATH_FLAT_HALF + 0.08), z));
      if (addProceduralDressing(x, z, -1, `far-${farPlaced}`)) farPlaced += 1;
    }

    let farMicroPlaced = 0;
    attempts = 0;
    const farMicroTarget = 110;
    const farMicroTypes = ['ground01', 'ground05', 'ground07', 'ground09', 'ground11'];
    function addProceduralDressingSpecific(type, x, z, side, index, scaleMul = 1.0) {
      const def = dressingDefs[type];
      if (!def) return false;
      const baseHeight = (def.hMin + rand() * (def.hMax - def.hMin)) * scaleMul;
      if (!canUseDressingPosition(type, def, x, z, baseHeight)) return false;
      addObject(targetCollectionForZ(z), type, x, z, null, baseHeight, {
        id: `dressing263-${index}`,
        y: pathGroundYAt(x, z),
        shade: 0.985 + rand() * 0.055,
        opacity: 0.95 + rand() * 0.05,
        layer: classifyLayer(z)
      });
      placedDressings.push({ x, z, type, family:def.family, radius:Math.max(dressingGeneralSpacing, def.radius * (0.76 + baseHeight * 0.15)), same:def.same || 5.0 });
      return true;
    }
    while (farMicroPlaced < farMicroTarget && attempts < 3200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -(PATH_FLAT_HALF + 0.08 + Math.pow(rand(), 1.18) * 4.5);
      const type = farMicroTypes[Math.floor(rand() * farMicroTypes.length)];
      if (addProceduralDressingSpecific(type, x, z, -1, `far-micro-${farMicroPlaced}`, 0.94 + rand() * 0.22)) farMicroPlaced += 1;
    }

    let nearMicroPlaced = 0;
    attempts = 0;
    const nearMicroTarget = 42;
    const nearMicroTypes = ['ground01', 'ground05', 'ground09', 'ground11'];
    while (nearMicroPlaced < nearMicroTarget && attempts < 2200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = PATH_FLAT_HALF + 0.10 + Math.pow(rand(), 1.22) * 4.1;
      const type = nearMicroTypes[Math.floor(rand() * nearMicroTypes.length)];
      if (addProceduralDressingSpecific(type, x, z, 1, `near-micro-${nearMicroPlaced}`, 0.96 + rand() * 0.22)) nearMicroPlaced += 1;
    }

    let nearPlaced = 0;
    attempts = 0;
    const nearTarget = 208;
    while (nearPlaced < nearTarget && attempts < 8200) {
      attempts += 1;
      const x = TILE.minX + rand() * TILE_WIDTH;
      let z;
      const bandPick = rand();
      if (bandPick < 0.28) {
        z = PATH_FLAT_HALF + 0.12 + Math.pow(rand(), 1.62) * 2.0;
      } else if (bandPick < 0.88) {
        z = PATH_BERM_HALF + 0.04 + Math.pow(rand(), 1.20) * 6.0;
      } else {
        z = PATH_OUTER_HALF + 0.84 + Math.pow(rand(), 1.08) * 7.2;
      }
      z = Math.min(WORLD.nearZ - 0.8, Math.max(PATH_FLAT_HALF + 0.10, z));
      if (addProceduralDressing(x, z, 1, `near-${nearPlaced}`)) nearPlaced += 1;
    }

    backdrop.sort((a, b) => a.z - b.z);
    midfill.sort((a, b) => a.z - b.z);
    frontOccluders.sort((a, b) => a.z - b.z);
  }

  function allSceneObjects() {
    return [...backdrop, ...midfill, ...frontOccluders];
  }

  // -------------------------------------------------------------------------
  // PUZZLE GROUP RUNTIME
  // -------------------------------------------------------------------------
  const PUZZLE_STATE_STORAGE_KEY = PLAYER_MODE ? PLAYER_PUZZLE_STATE_STORAGE_KEY : 'sidescroll.puzzle-groups.state.v1';
  const PUZZLE_START_STORAGE_KEY = 'sidescroll.puzzle-groups.starts.v1';
  const PUZZLE_LIBRARY_STORAGE_KEY = 'sidescroll.puzzle-groups.library.v1';
  const PUZZLE_WORKSHOP_STORAGE_KEY = 'sidescroll.puzzle-groups.workshop.v1';
  const INVENTORY_STORAGE_KEY = PLAYER_MODE ? PLAYER_INVENTORY_STORAGE_KEY : 'sidescroll.inventory.v1';
  const INVENTORY_ITEM_DEFS = {
    'forest-key': {
      id:'forest-key',
      label:'Forest Key',
      asset:'forest-key',
      description:'A puzzle reward. Item use will be added later.'
    }
  };
  const COLLECTIBLE_SETUP_STORAGE_KEY = 'sidescroll.collectibles.setup.v1';
  const COLLECTIBLE_DEFAULTS = {
    'forest-key': { label:'Forest Key', scale:1, spin:true }
  };
  let collectibleSetup = (() => {
    try {
      const raw = localStorage.getItem(COLLECTIBLE_SETUP_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw || 'null');
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.collectables?.setup || {}));
  })();
  function collectibleConfig(itemId) {
    return { ...(COLLECTIBLE_DEFAULTS[itemId] || { label:itemId, scale:1, spin:false }), ...(collectibleSetup[itemId] || {}) };
  }
  function saveCollectibleSetup() {
    try { localStorage.setItem(COLLECTIBLE_SETUP_STORAGE_KEY, JSON.stringify(collectibleSetup)); } catch (_) {}
  }
  function applyCollectibleConfigToLiveRewards(itemId) {
    const cfg = collectibleConfig(itemId);
    for (const instance of activePuzzleInstances.values()) {
      const obj = instance.rewardObject;
      if (!obj || obj.deleted || obj.collectibleItemId !== itemId) continue;
      const reward = completionRewardFor(instance) || {};
      const baseHeight = Number.isFinite(reward.height) ? reward.height : 0.62;
      obj.sy = baseHeight * Math.max(0.5, Number(cfg.scale) || 1);
      obj.sx = obj.sy * (assetAspect[obj.assetName] || 1);
      obj.collectibleSpin = !!cfg.spin;
    }
    renderInventory();
  }
  let inventoryState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || 'null');
      if (parsed && parsed.version === 1 && parsed.items && typeof parsed.items === 'object') return parsed;
    } catch (_) {}
    return { version:1, items:{} };
  })();
  let inventoryOpen = false;
  let puzzleTestInventorySnapshot = null;
  const activePuzzleInstances = new Map();
  const puzzleSavedState = (() => {
    try { return JSON.parse(localStorage.getItem(PUZZLE_STATE_STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  })();
  const puzzleStartState = (() => {
    try {
      const raw = localStorage.getItem(PUZZLE_START_STORAGE_KEY);
      if (raw !== null) return JSON.parse(raw || '{}') || {};
    } catch (_) {}
    return JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.puzzles?.savedStarts || {}));
  })();
  const userPuzzleLibrary = (() => {
    try {
      const raw = localStorage.getItem(PUZZLE_LIBRARY_STORAGE_KEY);
      const parsed = raw !== null
        ? (JSON.parse(raw || '{}') || {})
        : JSON.parse(JSON.stringify(BAKED_GAME_DESIGN?.puzzles?.localLibrary || {}));
      parsed.groups ||= {};
      parsed.templates ||= {};
      parsed.markers ||= [];

      // Older authoring builds could leave repeated marker records behind.
      // Keep one marker per id, and also collapse accidental same-group markers
      // that occupy effectively the same world position.
      const seenIds = new Set();
      const normalized = [];
      for (const raw of parsed.markers) {
        if (!raw || !raw.id || !raw.group || !Number.isFinite(Number(raw.x))) continue;
        if (seenIds.has(raw.id)) continue;
        const marker = { ...raw, x:Number(raw.x), local:true, linkMode:raw.linkMode === 'copy' ? 'copy' : 'instance' };
        const spatialDuplicate = normalized.some(item => item.group === marker.group && Math.abs(item.x - marker.x) < 0.08);
        if (spatialDuplicate) continue;
        seenIds.add(marker.id);
        normalized.push(marker);
      }
      parsed.markers = normalized;
      return parsed;
    } catch (_) { return { groups:{}, templates:{}, markers:[] }; }
  })();
  const PUZZLE_ART_V2_MIGRATION_KEY = 'sidescroll.puzzle-art-v2.migrated';
  const PUZZLE_ART_V2_ASPECT = {
    'puzzle-log-a': 1.345895020,
    'puzzle-log-b': 1.106194690,
    'puzzle-log-c': 1.345895020,
    'puzzle-log-d': 1.106194690,
    'fallen-tree': 1.346976744,
    'stone-wall': 1.895734597,
    'stone-piece-a': 1.094391245,
    'stone-piece-b': 0.992500000,
    'stone-piece-c': 1.062416999
  };
  function migratePuzzleArtV2Snapshot(snapshot) {
    if (!snapshot?.objects) return false;
    let changed = false;
    for (const state of Object.values(snapshot.objects)) {
      if (!state?.asset) continue;
      const aspect = PUZZLE_ART_V2_ASPECT[state.asset];
      if (!Number.isFinite(aspect)) continue;
      let sy = Number(state.sy);
      if (!Number.isFinite(sy)) continue;
      if (state.asset === 'fallen-tree' && sy < 3.45) sy = 3.45;
      if (state.asset === 'stone-wall' && sy < 3.40) sy = 3.40;
      state.sy = sy;
      state.sx = sy * aspect;
      state.flip = false;
      changed = true;
    }
    snapshot.assetArtVersion = 2;
    return changed;
  }
  function migratePuzzleArtV2() {
    try { if (localStorage.getItem(PUZZLE_ART_V2_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) startsChanged = migratePuzzleArtV2Snapshot(snapshot) || startsChanged;
    let libraryChanged = false;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) libraryChanged = migratePuzzleArtV2Snapshot(snapshot) || libraryChanged;
    if (startsChanged) { try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {} }
    if (libraryChanged) { try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {} }
    try { localStorage.setItem(PUZZLE_ART_V2_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV2();

  const PUZZLE_ART_V3_MIGRATION_KEY = 'sidescroll.puzzle-art-v3.migrated';
  function migrateFallenTreeV3Objects(objects) {
    if (!objects || typeof objects !== 'object') return false;
    let changed = false;
    for (const state of Object.values(objects)) {
      if (state?.asset !== 'fallen-tree') continue;
      state.sx = 6.029201331114809;
      state.sy = 2.550000000000000;
      state.flip = false;
      changed = true;
    }
    return changed;
  }
  function migratePuzzleArtV3() {
    try { if (localStorage.getItem(PUZZLE_ART_V3_MIGRATION_KEY) === '1') return; } catch (_) {}
    let startsChanged = false;
    for (const snapshot of Object.values(puzzleStartState || {})) {
      startsChanged = migrateFallenTreeV3Objects(snapshot?.objects) || startsChanged;
    }
    let libraryChanged = false;
    for (const snapshot of Object.values(userPuzzleLibrary.templates || {})) {
      libraryChanged = migrateFallenTreeV3Objects(snapshot?.objects) || libraryChanged;
    }
    let runtimeChanged = false;
    for (const runtime of Object.values(puzzleSavedState || {})) {
      runtimeChanged = migrateFallenTreeV3Objects(runtime?.objects) || runtimeChanged;
    }
    if (startsChanged) {
      try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {}
    }
    if (libraryChanged) {
      try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {}
    }
    if (runtimeChanged) {
      try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {}
    }
    try { localStorage.setItem(PUZZLE_ART_V3_MIGRATION_KEY, '1'); } catch (_) {}
  }
  migratePuzzleArtV3();

  const puzzleWorkshopState = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PUZZLE_WORKSHOP_STORAGE_KEY) || '{}') || {};
      return {
        isolated: !!parsed.isolated,
        clear: !!parsed.clear,
        markerId: typeof parsed.markerId === 'string' ? parsed.markerId : null
      };
    } catch (_) { return { isolated:false, clear:false, markerId:null }; }
  })();
  let puzzleTestMode = false;
  let puzzleTestMarkerId = null;
  let puzzleTestSnapshot = null;
  const puzzleStartDirty = new Set();
  const puzzleDraftBounds = Object.create(null);
  const PUZZLE_EXCLUSION_STORAGE_KEY = 'sidescroll-puzzle-exclusions-v1';
  let puzzleExclusionState = {};
  try { puzzleExclusionState = JSON.parse(localStorage.getItem(PUZZLE_EXCLUSION_STORAGE_KEY) || '{}') || {}; } catch (_) { puzzleExclusionState = {}; }
  let puzzleExclusionEditMode = false;
  let puzzleExclusionHandle = null;
  let puzzleEnvironmentPlacementMode = false;
  let puzzleWorkshopClear = puzzleWorkshopState.clear;
  let puzzleWorkshopIsolated = puzzleWorkshopState.isolated;

  function codeBoundsForDefinition(def) {
    if (def?.bounds) return { minX:def.bounds.minX, maxX:def.bounds.maxX };
    if (def?.exclusion) return { minX:def.exclusion.minX, maxX:def.exclusion.maxX };
    const half = Math.max(1.5, (def?.width ?? 8) * 0.5);
    return { minX:-half, maxX:half };
  }

  function codeBoundsForMarker(marker) {
    return codeBoundsForDefinition(markerDefinition(marker));
  }

  function currentPuzzleBoundsRelative(marker) {
    if (!marker) return { minX:-4, maxX:4 };
    if (puzzleDraftBounds[marker.id]) return puzzleDraftBounds[marker.id];
    const authored = markerLinkMode(marker) === 'copy'
      ? puzzleStartState[marker.id]?.bounds
      : (userPuzzleLibrary.templates?.[marker.group]?.bounds || puzzleStartState[marker.id]?.bounds);
    const initial = authored && Number.isFinite(authored.minX) && Number.isFinite(authored.maxX)
      ? { minX:authored.minX, maxX:authored.maxX }
      : codeBoundsForMarker(marker);
    puzzleDraftBounds[marker.id] = { ...initial };
    return puzzleDraftBounds[marker.id];
  }

  function savePuzzleExclusionState() {
    try { localStorage.setItem(PUZZLE_EXCLUSION_STORAGE_KEY, JSON.stringify(puzzleExclusionState)); } catch (_) {}
  }

  function defaultPuzzleExclusion(marker) {
    const def = markerDefinition(marker) || {};
    const legacy = def.exclusion;
    if (legacy && [legacy.minX, legacy.maxX, legacy.minZ, legacy.maxZ].every(Number.isFinite)) {
      return {
        enabled:true,
        centerX:(legacy.minX + legacy.maxX) * 0.5,
        centerZ:(legacy.minZ + legacy.maxZ) * 0.5,
        width:Math.max(1, legacy.maxX - legacy.minX),
        depth:Math.max(1, legacy.maxZ - legacy.minZ)
      };
    }
    const bounds = currentPuzzleBoundsRelative(marker);
    return {
      enabled:false,
      centerX:(bounds.minX + bounds.maxX) * 0.5,
      centerZ:0,
      width:Math.max(3, bounds.maxX - bounds.minX),
      depth:8.4
    };
  }

  function currentPuzzleExclusion(marker) {
    if (!marker) return { enabled:false, centerX:0, centerZ:0, width:8, depth:8 };
    const raw = puzzleExclusionState[marker.id];
    const fallback = defaultPuzzleExclusion(marker);
    if (!raw || typeof raw !== 'object') {
      puzzleExclusionState[marker.id] = { ...fallback };
      return puzzleExclusionState[marker.id];
    }
    const clean = {
      enabled: raw.enabled !== false,
      centerX: Number.isFinite(Number(raw.centerX)) ? Number(raw.centerX) : fallback.centerX,
      centerZ: Number.isFinite(Number(raw.centerZ)) ? Number(raw.centerZ) : fallback.centerZ,
      width: Math.max(1, Number.isFinite(Number(raw.width)) ? Number(raw.width) : fallback.width),
      depth: Math.max(1, Number.isFinite(Number(raw.depth)) ? Number(raw.depth) : fallback.depth)
    };
    puzzleExclusionState[marker.id] = clean;
    return clean;
  }

  function puzzleExclusionWorldBounds(marker) {
    const ex = currentPuzzleExclusion(marker);
    const centerX = marker.x + ex.centerX;
    return {
      enabled:ex.enabled,
      centerX,
      centerZ:ex.centerZ,
      width:ex.width,
      depth:ex.depth,
      minX:centerX-ex.width*0.5,
      maxX:centerX+ex.width*0.5,
      minZ:ex.centerZ-ex.depth*0.5,
      maxZ:ex.centerZ+ex.depth*0.5
    };
  }

  function applyPersistedMarkerPositions() {
    for (const marker of puzzleConfig.markers || []) {
      const savedX = Number(puzzleSavedState?.[marker.id]?.markerX);
      if (Number.isFinite(savedX)) marker.x = savedX;
    }
  }

  function persistPuzzleMarkerPosition(marker) {
    if (!marker || !Number.isFinite(Number(marker.x))) return;
    if (markerIsUserCreated(marker)) {
      const stored = (userPuzzleLibrary.markers || []).find(item => item.id === marker.id);
      if (stored) stored.x = Number(marker.x);
      savePuzzleLibrary();
    } else {
      const state = savedPuzzleFor(marker.id);
      state.markerX = Number(marker.x);
      savePuzzleState();
    }
  }

  function movePuzzleMarkerTo(marker, nextX) {
    if (!marker || !Number.isFinite(Number(nextX))) return false;
    const target = Number(nextX);
    const previous = Number(marker.x) || 0;
    const dx = target - previous;
    if (Math.abs(dx) < 0.000001) return false;
    marker.x = target;

    const instance = activePuzzleInstances.get(marker.id);
    if (instance) {
      for (const obj of instance.objects || []) obj.x += dx;
      instance.marker = marker;
    }

    // Runtime object state uses world-space x values. Keep it aligned with the
    // marker so unload/reload cannot snap an edited puzzle back to the old spot.
    const runtime = puzzleSavedState?.[marker.id]?.objects;
    if (runtime) {
      for (const state of Object.values(runtime)) {
        if (state && Number.isFinite(Number(state.x))) state.x = Number(state.x) + dx;
      }
    }
    return true;
  }

  function savePuzzleState() {
    if (PLAYER_MODE) savePlayerPosition(true);
    // Test runs are disposable.  They may mutate the in-memory state, but the
    // authored start remains the durable source of truth for Reset/Test.
    if (puzzleTestMode) return;
    try { localStorage.setItem(PUZZLE_STATE_STORAGE_KEY, JSON.stringify(puzzleSavedState)); } catch (_) {}
  }

  function savePuzzleStarts() {
    try { localStorage.setItem(PUZZLE_START_STORAGE_KEY, JSON.stringify(puzzleStartState)); } catch (_) {}
  }

  function migratePuzzleTemplates() {
    userPuzzleLibrary.templates ||= {};
    let changed = false;
    for (const marker of userPuzzleLibrary.markers || []) {
      if (!marker.linkMode) { marker.linkMode = 'instance'; changed = true; }
      if (marker.linkMode === 'copy') continue;
      if (userPuzzleLibrary.templates[marker.group]) continue;
      const legacy = puzzleStartState[marker.id];
      if (!legacy) continue;
      userPuzzleLibrary.templates[marker.group] = JSON.parse(JSON.stringify(legacy));
      changed = true;
    }
    return changed;
  }

  function savePuzzleLibrary() {
    try { localStorage.setItem(PUZZLE_LIBRARY_STORAGE_KEY, JSON.stringify(userPuzzleLibrary)); } catch (_) {}
  }

  function savePuzzleWorkshopState(markerId = null) {
    puzzleWorkshopState.isolated = !!puzzleWorkshopIsolated;
    puzzleWorkshopState.clear = !!puzzleWorkshopClear;
    puzzleWorkshopState.markerId = markerId || (!puzzleWorkshopClear ? (editorPuzzleMarkerId || puzzleWorkshopState.markerId) : null);
    try { localStorage.setItem(PUZZLE_WORKSHOP_STORAGE_KEY, JSON.stringify(puzzleWorkshopState)); } catch (_) {}
  }

  function allPuzzleMarkers() {
    const localLabels = new Set((userPuzzleLibrary.markers || []).map(marker => (userPuzzleLibrary.groups?.[marker.group]?.label || '').trim().toLowerCase()).filter(Boolean));
    const builtIns = (puzzleConfig.markers || []).filter(marker => !localLabels.has((puzzleConfig.groups?.[marker.group]?.label || '').trim().toLowerCase()));
    return [...builtIns, ...(userPuzzleLibrary.markers || [])];
  }

  function scenePuzzleMarkers() {
    if (puzzleWorkshopIsolated) return puzzleWorkshopClear ? [] : [...(userPuzzleLibrary.markers || [])];
    return allPuzzleMarkers();
  }

  function allPuzzleGroups() {
    const groups = new Map();
    const localLabels = new Set(Object.values(userPuzzleLibrary.groups || {}).map(def => (def?.label || '').trim().toLowerCase()).filter(Boolean));
    for (const [id, def] of Object.entries(puzzleConfig.groups || {})) {
      if (!localLabels.has((def?.label || '').trim().toLowerCase())) groups.set(id, def);
    }
    for (const [id, def] of Object.entries(userPuzzleLibrary.groups || {})) groups.set(id, def);
    return [...groups.entries()].map(([id, def]) => ({ id, def }));
  }

  function groupDefinition(groupId) {
    return userPuzzleLibrary.groups?.[groupId] || puzzleConfig.groups?.[groupId] || null;
  }

  function groupIsUserCreated(groupId) {
    return !!userPuzzleLibrary.groups?.[groupId];
  }

  function markerDefinition(marker) {
    if (!marker) return null;
    return groupDefinition(marker.group);
  }

  function markerIsUserCreated(marker) {
    return !!marker && (userPuzzleLibrary.markers || []).some(item => item.id === marker.id);
  }

  function markerLinkMode(marker) {
    return marker?.linkMode === 'copy' ? 'copy' : 'instance';
  }

  function savedPuzzleFor(markerId) {
    puzzleSavedState[markerId] ||= { solved:false, objects:{} };
    puzzleSavedState[markerId].objects ||= {};
    return puzzleSavedState[markerId];
  }

  function inventoryTotalCount() {
    return Object.values(inventoryState.items || {}).reduce((sum, item) => sum + Math.max(0, Number(item?.count) || 0), 0);
  }

  function saveInventory() {
    if (PLAYER_MODE) savePlayerPosition(true);
    if (puzzleTestMode) return;
    try { localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryState)); } catch (_) {}
  }

  function inventorySnapshot() {
    return JSON.parse(JSON.stringify(inventoryState));
  }

  function restoreInventory(snapshot, { persist = false } = {}) {
    inventoryState = snapshot ? JSON.parse(JSON.stringify(snapshot)) : { version:1, items:{} };
    if (persist) saveInventory();
    renderInventory();
  }

  function addInventoryItem(itemId, count = 1, sourceId = null) {
    if (!INVENTORY_ITEM_DEFS[itemId]) return false;
    inventoryState.items ||= {};
    const amount = Math.max(1, Number(count) || 1);
    const current = inventoryState.items[itemId] || { count:0, firstCollectedAt:Date.now() };
    current.count = Math.max(0, Number(current.count) || 0) + amount;
    if (sourceId) {
      current.sources ||= {};
      current.sources[sourceId] = Math.max(0, Number(current.sources[sourceId]) || 0) + amount;
    }
    current.lastCollectedAt = Date.now();
    inventoryState.items[itemId] = current;
    saveInventory();
    renderInventory();
    return true;
  }

  function removeInventoryItem(itemId, count = 1, sourceId = null) {
    inventoryState.items ||= {};
    const current = inventoryState.items[itemId];
    if (!current) return false;
    let amount = Math.max(1, Number(count) || 1);
    if (sourceId && current.sources && Number(current.sources[sourceId]) > 0) {
      amount = Math.min(amount, Number(current.sources[sourceId]) || 0);
      current.sources[sourceId] = Math.max(0, (Number(current.sources[sourceId]) || 0) - amount);
      if (current.sources[sourceId] <= 0) delete current.sources[sourceId];
      if (!Object.keys(current.sources).length) delete current.sources;
    }
    current.count = Math.max(0, (Number(current.count) || 0) - amount);
    if (current.count <= 0) delete inventoryState.items[itemId];
    else inventoryState.items[itemId] = current;
    saveInventory();
    renderInventory();
    return true;
  }

  function removePuzzleRewardFromInventory(instance, { allowLegacyFallback = false } = {}) {
    if (!instance) return false;
    const reward = completionRewardFor(instance);
    const itemId = reward?.itemId;
    if (!itemId) return false;
    const current = inventoryState.items?.[itemId];
    if (!current) return false;

    const sourcedCount = Number(current.sources?.[instance.id]) || 0;
    if (sourcedCount > 0) return removeInventoryItem(itemId, 1, instance.id);

    // v0.2.45 migration path: older builds stored only a total count, so a
    // reward collected before source tracking cannot be tied back to its puzzle.
    // When explicitly resetting that puzzle, remove one matching legacy reward.
    if (allowLegacyFallback) return removeInventoryItem(itemId, 1);
    return false;
  }

  function inventoryThumbMarkup(itemDef) {
    if (itemDef?.image) return `<span class="sidescroll-inventory-thumb"><img src="${itemDef.image}?v=0.2.85" alt=""></span>`;
    if (itemDef?.asset === 'forest-key') return '<span class="sidescroll-inventory-thumb sidescroll-inventory-key-thumb" aria-hidden="true"><i></i></span>';
    return '<span class="sidescroll-inventory-thumb" aria-hidden="true">◇</span>';
  }

  function renderInventory() {
    const total = inventoryTotalCount();
    if (inventoryCountEl) inventoryCountEl.textContent = String(total);
    if (!inventoryListEl || !inventoryEmptyEl) return;
    inventoryListEl.innerHTML = '';
    const entries = Object.entries(inventoryState.items || {}).filter(([,state]) => (Number(state?.count) || 0) > 0);
    inventoryEmptyEl.hidden = entries.length > 0;
    for (const [itemId, state] of entries) {
      const def = INVENTORY_ITEM_DEFS[itemId] || { label:itemId, description:'Collected item.' };
      const cfg = collectibleConfig(itemId);
      const card = document.createElement('div');
      card.className = 'sidescroll-inventory-item';
      card.innerHTML = `${inventoryThumbMarkup(def)}<span class="sidescroll-inventory-item-copy"><strong>${cfg.label || def.label}</strong><small>${def.description || ''}</small></span><b class="sidescroll-inventory-qty">×${Math.max(1, Number(state.count) || 1)}</b>`;
      inventoryListEl.appendChild(card);
    }
  }

  function setInventoryOpen(open) {
    inventoryOpen = !!open;
    if (inventoryPanel) inventoryPanel.hidden = !inventoryOpen;
    if (inventoryBtn) inventoryBtn.setAttribute('aria-expanded', String(inventoryOpen));
    document.body.classList.toggle('sidescroll-inventory-open', inventoryOpen);
    if (inventoryOpen) {
      setDriveAxis(0);
      renderInventory();
    }
  }


  function markerForId(markerId) {
    return allPuzzleMarkers().find(marker => marker.id === markerId) || null;
  }

  function defaultPuzzleStartForDefinition(def) {
    const objects = {};
    for (const prop of def?.props || []) {
      objects[prop.id] = {
        asset: prop.asset,
        x: prop.x,
        z: prop.z ?? pathZ,
        yOffset: Number.isFinite(prop.yOffset) ? prop.yOffset : 0,
        sx: prop.width ?? null,
        sy: prop.height,
        flip: !!prop.flip,
        deleted: false,
        category: prop.category || 'gameplay',
        gameplayType: prop.gameplayType || null,
        gameplayLayerLocked: true,
        collision: cloneCollision(prop.collision),
        shadow: prop.shadow ? { ...prop.shadow } : null,
        sockets: Array.isArray(prop.sockets) ? prop.sockets.map(socket => ({ ...socket })) : [],
        socketedTo: prop.socketedTo ? { ...prop.socketedTo } : null
      };
    }
    return { source:'default', bounds:codeBoundsForDefinition(def), objects };
  }

  function defaultPuzzleStart(marker) {
    return defaultPuzzleStartForDefinition(markerDefinition(marker));
  }

  function templateStartForGroup(groupId) {
    return userPuzzleLibrary.templates?.[groupId] || defaultPuzzleStartForDefinition(groupDefinition(groupId));
  }

  function puzzleStartFor(marker) {
    if (!marker) return { source:'default', bounds:{minX:-4,maxX:4}, objects:{} };
    if (markerLinkMode(marker) === 'copy' && puzzleStartState[marker.id]) return puzzleStartState[marker.id];
    if (userPuzzleLibrary.templates?.[marker.group]) return userPuzzleLibrary.templates[marker.group];
    if (puzzleStartState[marker.id]) return puzzleStartState[marker.id];
    return defaultPuzzleStart(marker);
  }

  function hasAuthoredPuzzleStart(markerId) {
    const marker = markerForId(markerId);
    if (!marker) return false;
    if (markerLinkMode(marker) === 'copy') return !!puzzleStartState[markerId];
    return !!userPuzzleLibrary.templates?.[marker.group] || !!puzzleStartState[markerId];
  }

  function capturePuzzleStart(instance) {
    if (!instance) return null;
    const objects = {};
    for (const obj of instance.objects) {
      if (!obj?.puzzleObjectId) continue;
      objects[obj.puzzleObjectId] = {
        asset: obj.assetName,
        x: obj.x - instance.marker.x,
        z: obj.z,
        yOffset: obj.y - (obj.category === 'gameplay' && obj.gameplayLayerLocked ? playSurfaceYAt(obj.x) : pathGroundYAt(obj.x, obj.z)),
        sx: obj.sx,
        sy: obj.sy,
        flip: !!obj.flip,
        deleted: !!obj.deleted,
        category: obj.category || 'gameplay',
        gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked,
        collision: cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride,
        shadow: obj.shadow ? { ...obj.shadow } : null,
        sockets: Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
        socketedTo: obj.socketedTo ? { ...obj.socketedTo } : null
      };
    }
    const snapshot = { source:'authored', savedAt:Date.now(), bounds:{ ...currentPuzzleBoundsRelative(instance.marker) }, objects };
    puzzleStartState[instance.id] = snapshot;
    puzzleStartDirty.delete(instance.id);
    savePuzzleStarts();
    return snapshot;
  }

  function applyPuzzleSnapshot(instance, snapshot, { persistRuntime = true, clearDirty = false } = {}) {
    if (!instance || !snapshot) return;
    if (snapshot.bounds) puzzleDraftBounds[instance.id] = { ...snapshot.bounds };
    else puzzleDraftBounds[instance.id] = { ...codeBoundsForMarker(instance.marker) };
    if (carriedObject?.puzzleInstanceId === instance.id) carriedObject = null;
    if (interactionState?.object?.puzzleInstanceId === instance.id) interactionState = null;
    if (standingOnObject?.puzzleInstanceId === instance.id) standingOnObject = null;
    removePuzzleRewardObject(instance);

    const existing = new Map(instance.objects.filter(Boolean).map(obj => [obj.puzzleObjectId, obj]));
    for (const [objectId, state] of Object.entries(snapshot.objects || {})) {
      const prop = (instance.def.props || []).find(item => item.id === objectId) || null;
      let obj = existing.get(objectId);
      const asset = state.asset || prop?.asset;
      if (!obj && asset) {
        const sy = Number.isFinite(state.sy) ? state.sy : (prop?.height ?? 0.8);
        const sx = Number.isFinite(state.sx) ? state.sx : (prop?.width ?? sy * (assetAspect[asset] || 1));
        const x = instance.marker.x + (Number.isFinite(state.x) ? state.x : (prop?.x ?? 0));
        const z = Number.isFinite(state.z) ? state.z : (prop?.z ?? pathZ);
        obj = addObject(frontOccluders, asset, x, z, sx, sy, {
          id:`puzzle-${instance.id}-${objectId}`,
          y:playSurfaceYAt(x),
          flip:!!state.flip,
          shade:1, opacity:1, layer:'foreground', wrap:false,
          category:state.category || prop?.category || 'gameplay',
          gameplayType:state.gameplayType ?? prop?.gameplayType ?? null,
          gameplayLayerLocked:state.gameplayLayerLocked ?? true,
          collision:cloneCollision(state.collision ?? prop?.collision ?? null), collisionOverride:!!state.collisionOverride,
          shadow:state.shadow || prop?.shadow || null,
          sockets:Array.isArray(state.sockets ?? prop?.sockets) ? (state.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [],
          socketedTo:(state.socketedTo ?? prop?.socketedTo) ? { ...(state.socketedTo ?? prop?.socketedTo) } : null,
          deleted:!!state.deleted,
          puzzleInstanceId:instance.id,
          puzzleObjectId:objectId
        });
        instance.objects.push(obj);
        existing.set(objectId, obj);
      }
      if (!obj) continue;
      const xRel = Number.isFinite(state.x) ? state.x : (prop?.x ?? 0);
      obj.x = instance.marker.x + xRel;
      obj.z = Number.isFinite(state.z) ? state.z : (prop?.z ?? pathZ);
      obj.sy = Number.isFinite(state.sy) ? state.sy : (prop?.height ?? obj.sy);
      obj.sx = Number.isFinite(state.sx) ? state.sx : (prop?.width ?? obj.sy * (assetAspect[obj.assetName] || 1));
      obj.flip = !!state.flip;
      obj.deleted = !!state.deleted;
      obj.category = state.category || prop?.category || obj.category || 'gameplay';
      obj.gameplayType = state.gameplayType ?? prop?.gameplayType ?? obj.gameplayType ?? null;
      obj.gameplayLayerLocked = state.gameplayLayerLocked ?? true;
      obj.collisionOverride = !!state.collisionOverride;
      obj.collision = obj.collisionOverride
        ? cloneCollision(state.collision ?? prop?.collision ?? null)
        : behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, state.collision ?? prop?.collision ?? null);
      obj.shadow = state.shadow || prop?.shadow || obj.shadow || null;
      obj.sockets = Array.isArray(state.sockets ?? prop?.sockets) ? (state.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [];
      obj.socketedTo = (state.socketedTo ?? prop?.socketedTo) ? { ...(state.socketedTo ?? prop?.socketedTo) } : null;
      obj.carried = false;
      const baseY = obj.category === 'gameplay' && obj.gameplayLayerLocked
        ? playSurfaceYAt(obj.x)
        : pathGroundYAt(obj.x, obj.z);
      obj.y = baseY + (Number.isFinite(state.yOffset) ? state.yOffset : 0);
      moveObjectToCorrectCollection(obj);
    }
    for (const obj of instance.objects) {
      if (obj?.puzzleObjectId && !snapshot.objects?.[obj.puzzleObjectId]) obj.deleted = true;
    }

    instance.solved = false;
    if (clearDirty) puzzleStartDirty.delete(instance.id);
    sortSceneCollections();
    settleGameplayCrates();

    const runtime = savedPuzzleFor(instance.id);
    runtime.solved = false;
    delete runtime.reward;
    runtime.objects = {};
    for (const obj of instance.objects) {
      runtime.objects[obj.puzzleObjectId] = {
        asset:obj.assetName,
        x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy, flip:!!obj.flip,
        deleted:!!obj.deleted, category:obj.category || 'gameplay', gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked, collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride, shadow:obj.shadow ? { ...obj.shadow } : null,
        sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [], socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null
      };
    }
    if (persistRuntime) savePuzzleState();
    selectObject(null);
  }

  function applyPuzzleStart(instance, { persistRuntime = true } = {}) {
    if (!instance) return;
    applyPuzzleSnapshot(instance, puzzleStartFor(instance.marker), { persistRuntime, clearDirty:true });
  }

  function positionPlayerAtPuzzleEntry(instance) {
    if (!instance) return;
    const bounds = currentPuzzleBoundsRelative(instance.marker);
    const capsule = colliderWorld();
    const approachGap = Math.max(0.85, capsule.radius * 1.5 + 0.35);
    const colliderX = instance.marker.x + bounds.minX - approachGap;
    const rootX = colliderX - capsule.offsetX;
    camera.x = rootX - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = rootX;
    character.y = playSurfaceYAt(character.x);
    jumping = false;
    jumpTime = 0;
    jumpOffset = 0;
    jumpVelocity = 0;
    standingOnObject = null;
    runBlend = 0;
    locomotionPhase = 0;
    setDriveAxis(0);
  }

  function recordPuzzleObjectState(obj) {
    if (!obj?.puzzleInstanceId || !obj?.puzzleObjectId) return false;
    const state = savedPuzzleFor(obj.puzzleInstanceId);
    state.objects[obj.puzzleObjectId] = {
      asset:obj.assetName,
      x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy, flip:!!obj.flip,
      deleted:!!obj.deleted, category:obj.category || 'gameplay', gameplayType:obj.gameplayType || null,
      gameplayLayerLocked:!!obj.gameplayLayerLocked,
      collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride, shadow:obj.shadow ? { ...obj.shadow } : null,
      sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [], socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null
    };
    if (typeof editMode !== 'undefined' && editMode && !puzzleTestMode) puzzleStartDirty.add(obj.puzzleInstanceId);
    savePuzzleState();
    return true;
  }

  function instantiatePuzzleGroup(marker) {
    const def = markerDefinition(marker);
    if (!def || activePuzzleInstances.has(marker.id)) return activePuzzleInstances.get(marker.id) || null;
    for (const packName of def.assetPacks || []) ensurePuzzleAssetPack(packName);

    const saved = savedPuzzleFor(marker.id);
    const authored = puzzleStartFor(marker);
    const instance = { id:marker.id, marker, def, objects:[], solved:!!saved.solved };
    const baseById = new Map((def.props || []).map(prop => [prop.id, prop]));
    const ids = new Set([...baseById.keys(), ...Object.keys(authored?.objects || {}), ...Object.keys(saved.objects || {})]);
    for (const objectId of ids) {
      const prop = baseById.get(objectId) || null;
      const startState = authored?.objects?.[objectId] || null;
      const prior = saved.objects?.[objectId] || null;
      const meta = prior || startState || prop;
      const asset = prior?.asset || startState?.asset || prop?.asset;
      if (!asset) continue;
      const xRel = Number.isFinite(startState?.x) ? startState.x : (prop?.x ?? 0);
      const x = Number.isFinite(prior?.x) ? prior.x : (marker.x + xRel);
      const z = Number.isFinite(prior?.z) ? prior.z : (Number.isFinite(startState?.z) ? startState.z : (prop?.z ?? pathZ));
      const height = Number.isFinite(prior?.sy) ? prior.sy : (Number.isFinite(startState?.sy) ? startState.sy : (prop?.height ?? 0.8));
      const width = Number.isFinite(prior?.sx) ? prior.sx : (Number.isFinite(startState?.sx) ? startState.sx : prop?.width);
      const obj = addObject(frontOccluders, asset, x, z, width, height, {
        id:`puzzle-${marker.id}-${objectId}`,
        y:Number.isFinite(prior?.y)
          ? prior.y
          : (((prior?.category || startState?.category || prop?.category || 'gameplay') === 'gameplay'
              && (prior?.gameplayLayerLocked ?? startState?.gameplayLayerLocked ?? true))
              ? playSurfaceYAt(x)
              : pathGroundYAt(x, z)) + (Number.isFinite(startState?.yOffset) ? startState.yOffset : 0),
        flip:prior?.flip ?? startState?.flip ?? prop?.flip ?? false,
        shade:1, opacity:1, layer:'foreground', wrap:false,
        category:prior?.category || startState?.category || prop?.category || 'gameplay',
        gameplayType:prior?.gameplayType ?? startState?.gameplayType ?? prop?.gameplayType ?? null,
        gameplayLayerLocked:prior?.gameplayLayerLocked ?? startState?.gameplayLayerLocked ?? true,
        collision:cloneCollision(prior?.collision ?? startState?.collision ?? prop?.collision ?? null),
        collisionOverride:!!(prior?.collisionOverride ?? startState?.collisionOverride ?? false),
        shadow:prior?.shadow || startState?.shadow || prop?.shadow || null,
        sockets:Array.isArray(prior?.sockets ?? startState?.sockets ?? prop?.sockets) ? (prior?.sockets ?? startState?.sockets ?? prop?.sockets).map(socket => ({ ...socket })) : [],
        socketedTo:(prior?.socketedTo ?? startState?.socketedTo ?? prop?.socketedTo) ? { ...(prior?.socketedTo ?? startState?.socketedTo ?? prop?.socketedTo) } : null,
        deleted:prior?.deleted ?? startState?.deleted ?? false,
        puzzleInstanceId:marker.id,
        puzzleObjectId:objectId
      });
      instance.objects.push(obj);
    }
    currentPuzzleBoundsRelative(marker);
    activePuzzleInstances.set(marker.id, instance);
    sortSceneCollections();
    settleGameplayCrates();
    if (instance.solved) ensurePuzzleCompletionReward(instance, marker.x);
    return instance;
  }

  function capturePuzzleInstance(instance) {
    if (!instance) return;
    for (const obj of instance.objects) recordPuzzleObjectState(obj);
    const state = savedPuzzleFor(instance.id);
    state.solved = !!instance.solved;
    savePuzzleState();
  }

  function removePuzzleObjects(instance) {
    const remove = new Set(instance.objects);
    if (instance.rewardObject) remove.add(instance.rewardObject);
    for (const list of [backdrop, midfill, frontOccluders]) {
      for (let i=list.length-1;i>=0;i--) if (remove.has(list[i])) list.splice(i,1);
    }
    instance.rewardObject = null;
  }

  function unloadPuzzleGroup(markerId) {
    const instance = activePuzzleInstances.get(markerId);
    if (!instance) return;
    if ((carriedObject && carriedObject.puzzleInstanceId === markerId) || (interactionState?.object?.puzzleInstanceId === markerId)) return;
    capturePuzzleInstance(instance);
    if (selectedObject?.puzzleInstanceId === markerId) selectObject(null);
    removePuzzleObjects(instance);
    activePuzzleInstances.delete(markerId);
    for (const packName of instance.def.assetPacks || []) releasePuzzleAssetPack(packName);
  }

  function moduleBoundsFor(def, marker) {
    const rel = currentPuzzleBoundsRelative(marker);
    const hidesDressing = !!def?.exclusion;
    return {
      minX:marker.x + rel.minX,
      maxX:marker.x + rel.maxX,
      minZ:def?.exclusion?.minZ ?? -999,
      maxZ:def?.exclusion?.maxZ ?? 999,
      hidesDressing
    };
  }

  function puzzleBounds(instance) {
    return moduleBoundsFor(instance.def, instance.marker);
  }

  function updatePuzzleStreaming(playerX) {
    const loadAhead = puzzleConfig.streaming?.loadAhead ?? 24;
    const keepBehind = puzzleConfig.streaming?.keepBehind ?? 34;

    // Puzzle authoring can temporarily become an isolated workshop. This lets
    // us clear every puzzle from the scene, then spawn one exactly where we
    // want it without the normal game markers immediately streaming back in.
    if (puzzleWorkshopIsolated && (editMode || puzzleTestMode)) {
      const keepId = puzzleTestMarkerId || editorPuzzleMarkerId;
      for (const [id] of [...activePuzzleInstances]) {
        if (puzzleWorkshopClear || id !== keepId) unloadPuzzleGroup(id);
      }
      if (!puzzleWorkshopClear && keepId) {
        const marker = markerForId(keepId);
        if (marker && !activePuzzleInstances.has(marker.id)) instantiatePuzzleGroup(marker);
      }
      return;
    }

    // Outside the editor/test isolation, Play mode always represents the full
    // current Scene. If the workshop is isolated this is the locally-authored
    // marker set; otherwise it includes the normal built-in game markers too.
    const streamMarkers = scenePuzzleMarkers();
    const allowedIds = new Set(streamMarkers.map(marker => marker.id));
    for (const [id] of [...activePuzzleInstances]) {
      if (!allowedIds.has(id)) unloadPuzzleGroup(id);
    }

    for (const marker of streamMarkers) {
      const def = markerDefinition(marker);
      if (!def) continue;
      const bounds = moduleBoundsFor(def, marker);
      const minX = bounds.minX;
      const maxX = bounds.maxX;
      const active = activePuzzleInstances.get(marker.id);
      if (!active) {
        if (playerX >= minX - loadAhead && playerX <= maxX + loadAhead) instantiatePuzzleGroup(marker);
      } else if (playerX < minX - keepBehind || playerX > maxX + keepBehind) {
        unloadPuzzleGroup(marker.id);
      }
    }
  }

  function dressingHiddenByPuzzle(obj, drawX) {
    // Puzzle exclusions remove procedural environment only. Deliberately placed
    // global art and puzzle-owned dressing remain visible inside the cleared area.
    if (!obj || obj.category !== 'dressing' || obj.puzzleInstanceId || obj.userAdded) return false;
    for (const instance of activePuzzleInstances.values()) {
      const b = puzzleExclusionWorldBounds(instance.marker);
      if (!b.enabled) continue;
      if (drawX >= b.minX && drawX <= b.maxX && obj.z >= b.minZ && obj.z <= b.maxZ) return true;
    }
    return false;
  }

  function activePuzzleNear(playerX) {
    let best=null, bestD=Infinity;
    for (const instance of activePuzzleInstances.values()) {
      const d=Math.abs(playerX-instance.marker.x);
      if (d<bestD) {best=instance;bestD=d;}
    }
    return bestD <= 12 ? best : null;
  }

  const COLLECTIBLE_PICKUP_RADIUS = 0.72;

  function completionRewardFor(instance) {
    const explicit = instance?.def?.completionEvent;
    if (explicit?.type === 'spawn-collectible') return explicit;
    // Prototype rule for now: every socket-completion puzzle awards the same
    // key. This is deliberately centralised so a later logic/event editor can
    // replace the hard-coded branch without changing inventory or collection.
    if (instance?.def?.completion?.type === 'sockets') {
      return { type:'spawn-collectible', itemId:'forest-key', asset:'forest-key', height:0.62, offsetX:1.20 };
    }
    return null;
  }

  function removePuzzleRewardObject(instance) {
    const obj = instance?.rewardObject;
    if (!obj) return;
    for (const list of [backdrop, midfill, frontOccluders]) {
      const index = list.indexOf(obj);
      if (index >= 0) list.splice(index, 1);
    }
    obj.deleted = true;
    instance.rewardObject = null;
  }

  function ensurePuzzleCompletionReward(instance, playerX = null) {
    if (!instance || instance.rewardObject) return instance?.rewardObject || null;
    const reward = completionRewardFor(instance);
    if (!reward) return null;
    const state = savedPuzzleFor(instance.id);
    if (state.reward?.collected) return null;

    const bounds = currentPuzzleBoundsRelative(instance.marker);
    const facing = character?.lastFacing >= 0 ? 1 : -1;
    const fallbackX = Number.isFinite(playerX) ? playerX + facing * (reward.offsetX ?? 1.20) : instance.marker.x;
    const minX = instance.marker.x + bounds.minX + 0.45;
    const maxX = instance.marker.x + bounds.maxX - 0.45;
    const x = Number.isFinite(state.reward?.x) ? Number(state.reward.x) : Rig.clamp(fallbackX, minX, maxX);
    const z = Number.isFinite(state.reward?.z) ? Number(state.reward.z) : pathZ + 0.03;
    const config = collectibleConfig(reward.itemId);
    const height = (Number.isFinite(reward.height) ? reward.height : 0.62) * Math.max(0.5, Number(config.scale) || 1);
    const y = Number.isFinite(state.reward?.y) ? Number(state.reward.y) : playSurfaceYAt(x) + 0.035;
    const asset = reward.asset || INVENTORY_ITEM_DEFS[reward.itemId]?.asset || reward.itemId;

    const obj = addObject(frontOccluders, asset, x, z, null, height, {
      id:`reward-${instance.id}-${reward.itemId}`,
      y, flip:false, shade:1.05, opacity:1, noFog:true, layer:'foreground', wrap:false,
      category:'dressing', gameplayType:'collectible', gameplayLayerLocked:false,
      puzzleInstanceId:instance.id
    });
    obj.collectible = true;
    obj.collectibleItemId = reward.itemId;
    obj.collectibleBaseY = y;
    obj.collectibleSpawnTime = performance.now();
    obj.collectibleSpin = !!config.spin;
    instance.rewardObject = obj;
    state.reward = { itemId:reward.itemId, asset, x, y, z, spawned:true, collected:false };
    savePuzzleState();
    sortSceneCollections();
    return obj;
  }

  function collectPuzzleReward(instance) {
    const obj = instance?.rewardObject;
    if (!obj || !obj.collectible || obj.deleted) return false;
    const itemId = obj.collectibleItemId;
    if (!addInventoryItem(itemId, 1, instance.id)) return false;
    const def = INVENTORY_ITEM_DEFS[itemId] || { label:itemId };
    const cfg = collectibleConfig(itemId);
    const state = savedPuzzleFor(instance.id);
    state.reward = { ...(state.reward || {}), itemId, collected:true, collectedAt:Date.now() };
    removePuzzleRewardObject(instance);
    savePuzzleState();
    hintEl.textContent = `Collected ${cfg.label || def.label}`;
    hintEl.classList.remove('hidden');
    return true;
  }

  function updatePuzzleRewards(now) {
    if (editMode) return;
    for (const instance of activePuzzleInstances.values()) {
      const obj = instance.rewardObject;
      if (!obj || obj.deleted || !obj.collectible) continue;
      // Small hover makes a reward read as a collectible without committing to
      // a final reveal animation yet.
      obj.y = (obj.collectibleBaseY ?? obj.y) + Math.sin((now - (obj.collectibleSpawnTime || 0)) * 0.0042) * 0.045;
      obj.collectibleAngle = obj.collectibleSpin ? ((now - (obj.collectibleSpawnTime || 0)) * 0.00145) : 0;
      const dx = Math.abs(objectXNear(obj, character.x) - character.x);
      const dz = Math.abs(obj.z - pathZ);
      if (dx <= COLLECTIBLE_PICKUP_RADIUS && dz <= 0.95) collectPuzzleReward(instance);
    }
  }

  function checkPuzzleCompletion(playerX) {
    for (const instance of activePuzzleInstances.values()) {
      if (instance.solved) continue;
      const rule = instance.def.completion;
      if (!rule) continue;
      let done = false;
      if (rule.type === 'cross-x') {
        const target = instance.marker.x + rule.x;
        done = (rule.direction ?? 1) >= 0 ? playerX >= target : playerX <= target;
      } else if (rule.type === 'sockets') {
        const sockets = [];
        for (const host of socketHostsForInstance(instance)) {
          for (const socket of host.sockets || []) sockets.push({ host, socket });
        }
        done = sockets.length > 0 && sockets.every(({host,socket}) => instance.objects.some(obj => !obj.deleted && socketMatchesPiece(socket,obj)
          && obj.socketedTo?.hostObjectId === host.id && obj.socketedTo?.socketId === socket.id));
      }
      if (!done) continue;
      instance.solved = true;
      const state=savedPuzzleFor(instance.id);state.solved=true;savePuzzleState();
      const spawned = ensurePuzzleCompletionReward(instance, playerX);
      hintEl.textContent = spawned
        ? `${instance.def.label || 'Puzzle'} complete · something appeared`
        : `${instance.def.label || 'Puzzle'} complete`;
      hintEl.classList.remove('hidden');
    }
  }

  function targetCollectionForZ(z) {
    if (z > 0.85) return frontOccluders;
    if (z > -12) return midfill;
    return backdrop;
  }

  function moveObjectToCorrectCollection(obj) {
    const target = obj.category === 'gameplay' ? frontOccluders : targetCollectionForZ(obj.z);
    for (const list of [backdrop, midfill, frontOccluders]) {
      const idx = list.indexOf(obj);
      if (idx >= 0 && list !== target) list.splice(idx, 1);
    }
    if (!target.includes(obj)) target.push(obj);
    obj.layer = classifyLayer(obj.z);
  }

  function applyOverrideToObject(obj, override) {
    if (!override) return;
    if (Number.isFinite(override.x)) obj.x = override.x;
    if (Number.isFinite(override.z)) obj.z = override.z;
    if (Number.isFinite(override.sx)) obj.sx = override.sx;
    if (Number.isFinite(override.sy)) obj.sy = override.sy;
    if (typeof override.flip === 'boolean') obj.flip = override.flip;
    if (typeof override.deleted === 'boolean') obj.deleted = override.deleted;
    if (override.category) obj.category = override.category;
    if ('gameplayType' in override) obj.gameplayType = override.gameplayType;
    if (typeof override.gameplayLayerLocked === 'boolean') obj.gameplayLayerLocked = override.gameplayLayerLocked;
    else if (obj.category === 'gameplay' && obj.gameplayLayerLocked == null) obj.gameplayLayerLocked = true;
    if (obj.category === 'gameplay' && obj.gameplayLayerLocked) obj.z = pathZ;
    obj.collisionOverride = !!override.collisionOverride;
    if (obj.collisionOverride) {
      if (override.collision === null) obj.collision = null;
      else if (override.collision) obj.collision = cloneCollision(override.collision);
    } else {
      obj.collision = behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, override.collision);
    }
    obj.y = Number.isFinite(override.y)
      ? override.y
      : (obj.category === 'gameplay' && obj.gameplayLayerLocked ? playSurfaceYAt(obj.x) : pathGroundYAt(obj.x, obj.z));
    moveObjectToCorrectCollection(obj);
  }

  function recordObjectEdit(obj) {
    if (!obj) return;
    if (recordPuzzleObjectState(obj)) return;
    if (obj.userAdded) {
      const saved = sceneData.added.find(item => item.id === obj.id);
      const payload = {
        id: obj.id, assetName: obj.assetName, x: obj.x, y: obj.y, z: obj.z,
        sx: obj.sx, sy: obj.sy, flip: obj.flip, collision: obj.collision ? cloneCollision(obj.collision) : null, collisionOverride:!!obj.collisionOverride,
        category: obj.category || 'dressing', gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked, deleted: !!obj.deleted
      };
      if (saved) Object.assign(saved, payload);
      else sceneData.added.push(payload);
    } else {
      sceneData.overrides[obj.id] = {
        x: obj.x, y: obj.y, z: obj.z, sx: obj.sx, sy: obj.sy, flip: obj.flip,
        collision: obj.collision ? cloneCollision(obj.collision) : null, collisionOverride:!!obj.collisionOverride, category: obj.category || 'dressing',
        gameplayType: obj.gameplayType || null, gameplayLayerLocked: !!obj.gameplayLayerLocked, deleted: !!obj.deleted
      };
    }
    saveSceneData();
  }

  function restoreSceneEdits() {
    // Puzzle props are now owned by puzzle instances. Older releases could save
    // them as free-standing scene objects; those stale entries are the source of
    // the unselectable black/orphan logs seen during authoring. Remove them once
    // from general scene storage and let puzzle state be the sole owner.
    const puzzleAssetNames = new Set(Object.values(puzzleConfig.assetPacks || {}).flatMap(pack => (pack.assets || []).map(asset => asset.name)));
    const beforeAdded = sceneData.added.length;
    sceneData.added = sceneData.added.filter(saved => !puzzleAssetNames.has(saved.assetName));
    if (sceneData.added.length !== beforeAdded) saveSceneData();

    for (const obj of allSceneObjects()) applyOverrideToObject(obj, sceneData.overrides[obj.id]);
    for (const saved of sceneData.added || []) {
      if (HIDE_LEGACY_GROUND_DRESSING && /^ground(?:0[1-9]|1[0-2])$/.test(saved.assetName || '')) continue;
      userSceneCounter += 1;
      const collection = saved.category === 'gameplay' || saved.assetName === 'crate' ? frontOccluders : targetCollectionForZ(saved.z);
      const obj = addObject(collection, saved.assetName, saved.x, saved.z, saved.sx, saved.sy, {
        id: saved.id, baseSx: saved.sx, baseSy: saved.sy, flip: saved.flip,
        y: Number.isFinite(saved.y) ? saved.y : ((saved.category === 'gameplay' || saved.assetName === 'crate') ? playSurfaceYAt(saved.x) : pathGroundYAt(saved.x, saved.z)), collision: cloneCollision(saved.collision), collisionOverride:!!saved.collisionOverride, deleted: saved.deleted,
        userAdded: true, shade: 1.0, opacity: 0.98, layer: classifyLayer(saved.z),
        category: saved.category || (saved.assetName === 'crate' ? 'gameplay' : 'dressing'), gameplayType: saved.gameplayType || (saved.assetName === 'crate' ? 'crate' : null),
        gameplayLayerLocked: typeof saved.gameplayLayerLocked === 'boolean' ? saved.gameplayLayerLocked : (saved.category === 'gameplay' || saved.assetName === 'crate')
      });
      obj.sx = saved.sx; obj.sy = saved.sy;
      if (obj.category === 'gameplay' && obj.gameplayLayerLocked) {
        obj.z = pathZ;
        if (!Number.isFinite(saved.y)) obj.y = playSurfaceYAt(obj.x);
        moveObjectToCorrectCollection(obj);
      }
    }
    backdrop.sort((a,b)=>a.z-b.z);
    midfill.sort((a,b)=>a.z-b.z);
    frontOccluders.sort((a,b)=>a.z-b.z);
  }

  // Editor state is needed by puzzle streaming, including the initial stream
  // performed during startup. Keep these declarations above that first call so
  // the game cannot hit a temporal-dead-zone error before the first frame.
  let editMode = false;
  let editorScope = 'environment';
  let editorPuzzleMarkerId = null;
  let editorPuzzleLibraryGroupId = null;
  let scenePuzzleListSignature = '';
  let puzzleLibraryListSignature = '';
  let puzzleBrowserMode = 'scene';

  applyPersistedMarkerPositions();
  scatterForest();
  restoreSceneEdits();
  // Migrate older marker-specific authored starts into reusable templates, then
  // persist the normalized library so previous authored work remains available.
  migratePuzzleTemplates();
  savePuzzleLibrary();
  if (puzzleWorkshopIsolated && !puzzleWorkshopClear) {
    const pinned = markerForId(puzzleWorkshopState.markerId);
    if (pinned) { editorPuzzleMarkerId = pinned.id; puzzleBrowserMode = 'scene'; }
    else {
      puzzleWorkshopClear = true;
      puzzleWorkshopState.clear = true;
      puzzleWorkshopState.markerId = null;
      savePuzzleWorkshopState(null);
    }
  }
  updatePuzzleStreaming(0);
  settleGameplayCrates();

  const character = {
    x: 0,
    y: playSurfaceYAt(0),
    z: pathZ,
    scale: 2.31,
    tint: [1.0, 1.0, 1.0],
    opacity: 0.99,
    screenOffsetX: -0.18,
    distanceTravelled: 0,
    lastFacing: 1
  };

  function characterRenderY() {
    return character.y + CHARACTER_SOLE_ART_LOCAL_OFFSET * character.scale;
  }

  const SHARED_ANIM_KEY = 'gamehub.walklab.anim.v4';
  const SHARED_CLIPS_KEY = 'gamehub.walklab.anim.v6';
  const PREVIOUS_CLIPS_KEY = 'gamehub.walklab.anim.v5';
  let characterFrames = Rig.DEFAULT_FRAMES.map(Rig.clone);
  let runFrames = Rig.RUN_FRAMES.map(Rig.clone);
  let jumpFrames = Rig.JUMP_FRAMES.map(Rig.clone);
  function refreshCharacterFrames() {
    try {
      const clips = JSON.parse(localStorage.getItem(SHARED_CLIPS_KEY) || 'null');
      if (clips?.walk?.length === 16) characterFrames = clips.walk.map((p,i) => Rig.normalizedPose(p,i));
      if (clips?.run?.length === 16) runFrames = clips.run.map((p,i) => Rig.normalizedPose(p,i));
      if (clips?.jump?.length === 16) jumpFrames = clips.jump.map((p,i) => Rig.normalizedPose(p,i));
      if (!clips?.walk) {
        // Carry forward only the proven walk from the previous locomotion key.
        // Run/jump intentionally reset to the new v1.8.74 defaults so an older
        // saved experiment cannot silently overwrite this refinement pass.
        const previous = JSON.parse(localStorage.getItem(PREVIOUS_CLIPS_KEY) || 'null');
        if (previous?.walk?.length === 16) characterFrames = previous.walk.map((p,i) => Rig.normalizedPose(p,i));
        else {
          const saved = JSON.parse(localStorage.getItem(SHARED_ANIM_KEY) || 'null');
          if (saved?.frames?.length === 16) characterFrames = saved.frames.map((p,i) => Rig.normalizedPose(p,i));
        }
      }
    } catch (_) {}
  }
  refreshCharacterFrames();

  let characterCollider = Rig.loadCollider ? Rig.loadCollider() : Rig.normalizedCollider();
  function refreshCharacterCollider() {
    characterCollider = Rig.loadCollider ? Rig.loadCollider() : Rig.normalizedCollider(characterCollider);
  }
  function colliderWorld() {
    return {
      offsetX: characterCollider.offsetX * character.scale,
      radius: characterCollider.radius * character.scale,
      height: characterCollider.height * character.scale,
      bottom: characterCollider.bottom * character.scale,
      footProbe: characterCollider.footProbe * character.scale,
      stepUp: characterCollider.stepUp * character.scale,
      stepDown: characterCollider.stepDown * character.scale
    };
  }

  const debugTints = {
    ground: [0.50, 0.46, 0.75],
    character: [0.86, 0.58, 0.32],
    foreground: [0.70, 0.32, 0.28],
    near: [0.67, 0.43, 0.31],
    mid: [0.42, 0.59, 0.55],
    far: [0.37, 0.48, 0.68]
  };

  const camera = {
    x: 0,
    y: -3.00,
    z: 13.80,
    // This is intentionally ABOVE the camera Y: the camera is now actually
    // tilted upward a little, which places the character/path lower in frame.
    targetY: -2.15,
    targetZ: -13.0
  };

  const CAMERA_TUNE_STORAGE_KEY = 'sidescroll-camera-tune-v1';
  const PLAYER_HINT_STORAGE_KEY = 'sidescroll-player-hints-v1';
  const CAMERA_Y_STEP = 0.12;
  const CAMERA_Z_STEP = 0.35;
  const CAMERA_TILT_STEP = 0.12;
  let cameraEditMode = false;
  let playerHintsEnabled = true;
  try {
    const rawCamera = localStorage.getItem(CAMERA_TUNE_STORAGE_KEY);
    const savedCamera = rawCamera !== null
      ? JSON.parse(rawCamera || 'null')
      : BAKED_GAME_DESIGN?.camera;
    if (savedCamera && Number.isFinite(savedCamera.y) && Number.isFinite(savedCamera.z)) {
      const targetDeltaY = Number.isFinite(savedCamera.tilt) ? savedCamera.tilt : (camera.targetY - camera.y);
      camera.y = savedCamera.y;
      camera.z = savedCamera.z;
      camera.targetY = camera.y + targetDeltaY;
    }
    playerHintsEnabled = localStorage.getItem(PLAYER_HINT_STORAGE_KEY) !== '0';
  } catch (_) {}

  function restorePlayerPosition() {
    if (!PLAYER_MODE) return;
    try {
      const saved = JSON.parse(localStorage.getItem(PLAYER_POSITION_STORAGE_KEY) || 'null');
      if (!saved || !Number.isFinite(saved.x)) return;
      camera.x = saved.x - character.screenOffsetX;
      previousCameraX = camera.x;
      character.x = saved.x;
      character.lastFacing = saved.facing === -1 ? -1 : 1;
      character.y = playSurfaceYAt(character.x);
      updatePuzzleStreaming(character.x);
    } catch (_) {}
  }

  let lastPlayerPositionSave = 0;
  function savePlayerPosition(force = false) {
    if (!PLAYER_MODE || playerSaveDeletionInProgress) return;
    const now = performance.now();
    if (!force && now - lastPlayerPositionSave < 1200) return;
    lastPlayerPositionSave = now;
    try {
      localStorage.setItem(PLAYER_POSITION_STORAGE_KEY, JSON.stringify({ x:character.x, facing:character.lastFacing, savedAt:Date.now() }));
    } catch (_) {}
  }

  function saveCameraTune() {
    try { localStorage.setItem(CAMERA_TUNE_STORAGE_KEY, JSON.stringify({ y:camera.y, z:camera.z, tilt:camera.targetY-camera.y })); } catch (_) {}
  }
  function updateCameraEditorUi() {
    if (cameraEditorPanel) cameraEditorPanel.hidden = !(editMode && cameraEditMode);
    if (cameraEditorBtn) cameraEditorBtn.classList.toggle('active', !!cameraEditMode);
    if (cameraValuesEl) cameraValuesEl.textContent = `Y ${camera.y.toFixed(2)} · Z ${camera.z.toFixed(2)} · TILT ${(camera.targetY-camera.y).toFixed(2)}`;
  }
  function nudgeCamera(dy=0, dz=0) {
    const targetDeltaY = camera.targetY - camera.y;
    camera.y = Rig.clamp(camera.y + dy, -6.0, 1.5);
    camera.z = Rig.clamp(camera.z + dz, 5.0, 28.0);
    camera.targetY = camera.y + targetDeltaY;
    saveCameraTune();
    updateCameraEditorUi();
  }

  function nudgeCameraTilt(delta=0) {
    const tilt = Rig.clamp((camera.targetY - camera.y) + delta, -2.5, 3.0);
    camera.targetY = camera.y + tilt;
    saveCameraTune();
    updateCameraEditorUi();
  }

  let projection = mat4Identity();
  let debugDepth = false;
  let collisionDebugView = false;
  let driveAxis = 0;
  let drivePointer = null;
  let keyLeft = false;
  let keyRight = false;
  let keyRun = false;
  const DRIVE_DEADZONE = 0.08;
  const WALK_POINT = 0.50;
  const WALK_SPEED = 1.15;
  const RUN_SPEED = 2.85;
  // The body collider now comes from Walk Lab.  Only a tiny fixed skin stays
  // game-side so contact is stable at polygon boundaries.
  const PLAYER_COLLISION_SKIN = 0.025;
  const WALK_STRIDE = 1.45;
  const RUN_STRIDE = 2.05;
  const JUMP_VELOCITY = 5.05;
  const JUMP_GRAVITY = 9.20;
  const JUMP_DURATION = (JUMP_VELOCITY * 2) / JUMP_GRAVITY;

  let runBlend = 0;
  let locomotionPhase = 0;
  let jumping = false;
  let jumpTime = 0;
  let jumpOffset = 0;
  let jumpVelocity = 0;
  let standingOnObject = null;

  // Simple gameplay interaction state.  Crates are carried by the live rig,
  // not baked into an animation sheet: locomotion keeps driving the legs while
  // the arms are blended into a stable carrying pose.  Pick-up / put-down are
  // short authored transitions around that same pose.
  let carriedObject = null;
  let interactionState = null; // { type:'pickup'|'drop', time, duration, object, startX, startY, targetX, targetY }
  let autoDropStep = null; // short authored forward stack assist or backward ground-drop shuffle
  const ACTION_RANGE = 0.72; // distance from the character capsule to the near edge of a carryable prop
  const PICKUP_DURATION = 0.48;
  const DROP_DURATION = 0.44;
  const CARRY_FORWARD = 0.48;
  // One predictable carry height for every stackable item. This clears one
  // standard stack layer while keeping the prop comfortably in the arms.
  const CARRY_BOTTOM = 0.64;
  const AUTO_DROP_SHUFFLE_SPEED = 0.72;
  const AUTO_DROP_SHUFFLE_MAX = 2.40; // safety cap; normal failure is collision/ledge blocking
  // Gameplay props live on z=0. Keep the character rig only a few centimetres
  // closer to the camera so she remains readable in front of puzzle art while
  // genuine foreground dressing can still occlude her normally.
  const CHARACTER_GAMEPLAY_Z_BIAS = 0.045;
  const CARRIED_COLLISION_SKIN = 0.025;

  let activePointer = null;
  let dragStartX = 0;
  let dragStartCameraX = 0;

  let editorPuzzlePackPinned = false;
  let selectedObject = null;
  let editorPointer = null;
  let editorDragKind = null;
  let editorDragOffset = { x: 0, z: 0 };
  let editorPanStart = 0;
  let editorPanCameraX = 0;
  let editorGesture = null;
  let puzzleBoundSide = null;
  let addAssetType = null;

  function placementModeActive() {
    return !!(editMode && !puzzleTestMode && addAssetType);
  }

  function updatePlacementModeUi() {
    const active = placementModeActive();
    document.body.classList.toggle('sidescroll-placement-mode', active);
    if (placementStrip) placementStrip.hidden = !active;
    if (placementNameEl) {
      const info = addAssetType ? editorAssetInfo.get(addAssetType) : null;
      placementNameEl.textContent = info?.label || addAssetType || 'Asset';
    }
  }

  function exitPlacementMode() {
    addAssetType = null;
    puzzleEnvironmentPlacementMode = false;
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
    updatePuzzlePanel();
    hintEl.textContent = 'Placement finished · drag to pan or tap an object to select it';
    hintEl.classList.remove('hidden');
  }

  let editorTapState = null;
  let selectionCycleInfo = null;
  let collisionEditMode = false;
  let collisionHandleIndex = -1;
  let socketPlacementPiece = null;
  let currentViewMatrix = mat4Identity();
  const editorAssetGroups = [
    { scope:'puzzle', title: 'PUZZLE PROPS · WOODLAND', items: [
      { name:'puzzle-log-a', label:'MOVEABLE LOG A', image:'puzzle-log-a.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.84, collision:{halfWidth:0.52,height:0.48,depth:0.56,platform:true} },
      { name:'puzzle-log-b', label:'MOVEABLE LOG B', image:'puzzle-log-b.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.72, collision:{halfWidth:0.38,height:0.42,depth:0.50,platform:true} },
      { name:'puzzle-log-c', label:'MOVEABLE LOG C', image:'puzzle-log-c.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.76, collision:{halfWidth:0.47,height:0.44,depth:0.54,platform:true} },
      { name:'puzzle-log-d', label:'MOVEABLE LOG D', image:'puzzle-log-d.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.82, collision:{halfWidth:0.43,height:0.46,depth:0.54,platform:true} },
      { name:'fallen-tree', label:'FALLEN TREE', image:'fallen-tree.png', category:'gameplay', gameplayType:'obstacle', thumb:'⌁', defaultHeight:2.55, collision:{halfWidth:2.35,height:1.72,depth:1.08,platform:true} },
      { name:'tree-stump', label:'TREE STUMP', image:'tree-stump.png', category:'gameplay', gameplayType:'prop', thumb:'◯', defaultHeight:1.18 },
      { name:'broken-branch', label:'BROKEN BRANCH', image:'broken-branch.png', category:'gameplay', gameplayType:'prop', thumb:'⟍', defaultHeight:0.78 }
    ]},
    { scope:'puzzle', title: 'PUZZLE PROPS · STONE WALL', items: [
      { name:'stone-wall', label:'STONE WALL', image:'stone-wall.png', category:'dressing', gameplayType:'prop', thumb:'▦', defaultHeight:3.75, gameplayLayerLocked:false },
      { name:'stone-piece-a', label:'TRIANGLE STONE', image:'stone-piece-a.png', category:'gameplay', gameplayType:'prop', thumb:'△', defaultHeight:1.00 },
      { name:'stone-piece-b', label:'ARCH STONE', image:'stone-piece-b.png', category:'gameplay', gameplayType:'prop', thumb:'◒', defaultHeight:1.04 },
      { name:'stone-piece-c', label:'HEXAGON STONE', image:'stone-piece-c.png', category:'gameplay', gameplayType:'prop', thumb:'⬡', defaultHeight:1.00 }
    ]},
    { scope:'environment', title: 'DRESSING · TREES', items: [
      'tree01','tree02','tree03','tree04','tree05','tree06','tree07','tree08'
    ].map(name => ({ name, label: `TREE ${Number(name.slice(-2))}`, category: 'dressing' }))},
    { scope:'environment', title: 'DRESSING · GROUND', items: [
      'ground01','ground02','ground03','ground04','ground05','ground06',
      'ground07','ground08','ground09','ground10','ground11','ground12'
    ].map(name => ({ name, label: `GROUND ${Number(name.slice(-2))}`, category: 'dressing' }))}
  ];
  const editorAssetInfo = new Map(editorAssetGroups.flatMap(group => group.items.map(item => [item.name, item])));
  let assetSetupName = null;
  let collectibleSetupItemId = null;

  function behaviourBadgeText(assetName) {
    const b = assetBehaviours(assetName);
    const tags = [];
    if (b.carryable) tags.push('CARRY');
    if (b.supportSurface) tags.push('SUPPORT');
    if (b.stackable) tags.push('STACK');
    if (b.socketHost) tags.push('SOCKET HOST');
    if (b.socketPiece) tags.push('SOCKET PIECE');
    if (!tags.length && b.solid) tags.push('SOLID');
    return tags.join(' · ') || 'NO BEHAVIOURS';
  }

  function renderAssetSetup() {
    if (!assetSetupEl || !assetSetupName) return;
    const info = editorAssetInfo.get(assetSetupName);
    const behaviour = assetBehaviours(assetSetupName);
    if (assetSetupNameEl) assetSetupNameEl.textContent = info?.label || assetSetupName;
    if (assetSetupNoteEl) {
      assetSetupNoteEl.textContent = behaviour.socketHost || behaviour.socketPiece
        ? 'Socket behaviours are active. Select a socket piece in the scene, then use Set Socket to place its matching target on a Socket Host.'
        : `These are defaults for every copy of this asset. Collision: ${assetCollisionDefaults[assetSetupName] ? 'CUSTOM ASSET DEFAULT' : 'BUILT-IN DEFAULT'}. Fit a placed copy, then use SAVE TO ASSET.`;
    }
    if (!assetBehaviorListEl) return;
    assetBehaviorListEl.innerHTML = '';
    for (const def of ASSET_BEHAVIOUR_DEFS) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-behaviour-row';
      row.classList.toggle('active', !!behaviour[def.key]);
      row.setAttribute('aria-pressed', String(!!behaviour[def.key]));
      row.innerHTML = `<span><strong>${def.label}</strong><small>${def.description}</small></span><i>${behaviour[def.key] ? 'ON' : 'OFF'}</i>`;
      bindEditorPress(row, () => setAssetBehaviour(assetSetupName, def.key, !assetBehaviours(assetSetupName)[def.key]));
      assetBehaviorListEl.appendChild(row);
    }
  }

  function applyAssetBehaviourToObject(obj) {
    if (!obj || obj.category !== 'gameplay' || !hasAssetBehaviourProfile(obj.assetName)) return;
    const behaviour = assetBehaviours(obj.assetName);
    if (!obj.collisionOverride) {
      const inherited = collisionFromAssetDefault(obj.assetName, obj.sx, obj.sy);
      if (inherited) obj.collision = inherited;
      else if (behaviourNeedsCollision(behaviour)) obj.collision = behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, null);
      else obj.collision = null;
    } else if (obj.collision) {
      obj.collision.platform = !!behaviour.supportSurface;
    }
  }

  function applyAssetCollisionEverywhere(assetName) {
    for (const obj of allSceneObjects()) {
      if (!obj || obj.assetName !== assetName || obj.collisionOverride) continue;
      applyAssetBehaviourToObject(obj);
      if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
      recordObjectEdit(obj);
    }
    settleGameplayCrates();
    sortSceneCollections();
  }

  function saveSelectedCollisionAsAssetDefault() {
    if (!selectedObject || selectedObject.deleted || !selectedObject.collision) return;
    const assetName = selectedObject.assetName;
    assetCollisionDefaults[assetName] = normalizeAssetCollision(selectedObject.collision, selectedObject.sx, selectedObject.sy, assetName);
    saveAssetCollisionDefaults();
    selectedObject.collisionOverride = false;
    applyAssetCollisionEverywhere(assetName);
    renderAssetSetup();
    updateEditorButtons();
    hintEl.textContent = `Asset collision saved · inherited by all ${editorAssetInfo.get(assetName)?.label || assetName} copies without an override`;
    hintEl.classList.remove('hidden');
  }

  function useAssetCollisionForSelected() {
    if (!selectedObject || selectedObject.deleted) return;
    selectedObject.collisionOverride = false;
    applyAssetBehaviourToObject(selectedObject);
    recordObjectEdit(selectedObject);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    updateEditorButtons();
    hintEl.textContent = assetCollisionDefaults[selectedObject.assetName] ? 'Using inherited asset collision' : 'Using built-in asset collision';
    hintEl.classList.remove('hidden');
  }

  function applyAssetBehaviourEverywhere(assetName) {
    for (const obj of allSceneObjects()) {
      if (obj?.assetName !== assetName) continue;
      applyAssetBehaviourToObject(obj);
      if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
      recordObjectEdit(obj);
    }
    settleGameplayCrates();
    sortSceneCollections();
  }

  function setAssetBehaviour(assetName, key, enabled) {
    if (!assetName || !ASSET_BEHAVIOUR_KEYS.includes(key)) return;
    const current = assetBehaviours(assetName);
    const next = { ...current, [key]: !!enabled };
    if (key === 'carryable' && enabled) next.placeable = true;
    if (key === 'supportSurface' && enabled) next.solid = true;
    if (key === 'stackable' && enabled) next.placeable = true;
    assetBehaviourOverrides[assetName] = Object.fromEntries(ASSET_BEHAVIOUR_KEYS.map(k => [k, !!next[k]]));
    saveAssetBehaviourOverrides();
    applyAssetBehaviourEverywhere(assetName);
    renderAssetSetup();
    buildAssetPalette();
  }

  function resetAssetBehaviours(assetName) {
    if (!assetName) return;
    delete assetBehaviourOverrides[assetName];
    delete assetCollisionDefaults[assetName];
    saveAssetBehaviourOverrides();
    saveAssetCollisionDefaults();
    applyAssetBehaviourEverywhere(assetName);
    renderAssetSetup();
    buildAssetPalette();
  }

  function showAssetSetup(assetName) {
    if (!assetSetupEl || editorScope !== 'puzzle' || !editorAssetInfo.has(assetName)) return;
    assetSetupName = assetName;
    addAssetType = null;
    updatePlacementModeUi();
    if (editorAssetsEl) editorAssetsEl.hidden = true;
    assetSetupEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = 'Asset Setup';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = 'Reusable behaviour tags for this asset type';
    renderAssetSetup();
  }

  function renderCollectibleSetup() {
    if (!collectibleSetupEl || !collectibleSetupItemId) return;
    const itemDef = INVENTORY_ITEM_DEFS[collectibleSetupItemId];
    const cfg = collectibleConfig(collectibleSetupItemId);
    if (collectibleSetupNameEl) collectibleSetupNameEl.textContent = cfg.label || itemDef?.label || collectibleSetupItemId;
    if (collectibleNameInput) collectibleNameInput.value = cfg.label || itemDef?.label || collectibleSetupItemId;
    if (collectibleScaleInput) collectibleScaleInput.value = String(Math.max(0.5, Math.min(2, Number(cfg.scale) || 1)));
    if (collectibleScaleValueEl) collectibleScaleValueEl.textContent = `${(Number(cfg.scale) || 1).toFixed(2)}×`;
    if (collectibleSpinBtn) {
      collectibleSpinBtn.classList.toggle('active', !!cfg.spin);
      collectibleSpinBtn.setAttribute('aria-pressed', String(!!cfg.spin));
      const value = collectibleSpinBtn.querySelector('i');
      if (value) value.textContent = cfg.spin ? 'ON' : 'OFF';
    }
  }

  function updateCollectibleSetup(itemId, patch) {
    if (!itemId || !INVENTORY_ITEM_DEFS[itemId]) return;
    collectibleSetup[itemId] = { ...collectibleConfig(itemId), ...patch };
    saveCollectibleSetup();
    applyCollectibleConfigToLiveRewards(itemId);
    renderCollectibleSetup();
    buildAssetPalette();
  }

  function showCollectibleSetup(itemId) {
    if (!collectibleSetupEl || editorScope !== 'puzzle' || !INVENTORY_ITEM_DEFS[itemId]) return;
    collectibleSetupItemId = itemId;
    assetSetupName = null;
    addAssetType = null;
    updatePlacementModeUi();
    if (editorAssetsEl) editorAssetsEl.hidden = true;
    if (assetSetupEl) assetSetupEl.hidden = true;
    collectibleSetupEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = 'Collectable Setup';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = 'Reusable appearance and presentation settings';
    renderCollectibleSetup();
  }

  function showAssetBrowser() {
    assetSetupName = null;
    collectibleSetupItemId = null;
    if (assetSetupEl) assetSetupEl.hidden = true;
    if (collectibleSetupEl) collectibleSetupEl.hidden = true;
    if (editorAssetsEl) editorAssetsEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = editorScope === 'puzzle' ? 'Puzzle Assets' : 'Environment Assets';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = editorScope === 'puzzle'
      ? 'Tap an asset to place it · Setup edits reusable behaviours and collectables'
      : 'Choose dressing to place in the environment';
    buildAssetPalette();
    updateAssetPaletteState();
  }

  let lastTime = performance.now();
  let previousCameraX = camera.x;
  let hintTimer = window.setTimeout(() => hintEl.classList.add('hidden'), 4200);

  function hideHint() {
    hintEl.classList.add('hidden');
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = 0;
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      resizeSceneTarget(w, h);
      projection = mat4Perspective((31 * Math.PI) / 180, w / h, 0.1, 180);
    }
    if (editorOverlay && editorOverlayCtx) {
      const ow = Math.max(1, Math.round(editorOverlay.clientWidth * dpr));
      const oh = Math.max(1, Math.round(editorOverlay.clientHeight * dpr));
      if (editorOverlay.width !== ow || editorOverlay.height !== oh) {
        editorOverlay.width = ow;
        editorOverlay.height = oh;
      }
      editorOverlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function mat4TransformPoint(m, x, y, z, w = 1) {
    return [
      m[0]*x + m[4]*y + m[8]*z + m[12]*w,
      m[1]*x + m[5]*y + m[9]*z + m[13]*w,
      m[2]*x + m[6]*y + m[10]*z + m[14]*w,
      m[3]*x + m[7]*y + m[11]*z + m[15]*w
    ];
  }

  function projectWorldPoint(x, y, z) {
    const v = mat4TransformPoint(currentViewMatrix, x, y, z, 1);
    const c = mat4TransformPoint(projection, v[0], v[1], v[2], v[3]);
    if (!c[3] || c[3] <= 0) return null;
    const nx = c[0] / c[3];
    const ny = c[1] / c[3];
    const rect = canvas.getBoundingClientRect();
    return {
      x: (nx * 0.5 + 0.5) * rect.width,
      y: (1 - (ny * 0.5 + 0.5)) * rect.height,
      ndcZ: c[2] / c[3]
    };
  }

  function cameraRayFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
    const eye = [camera.x, camera.y, camera.z];
    const forward = vec3Normalize([camera.x - eye[0], camera.targetY - eye[1], camera.targetZ - eye[2]]);
    const right = vec3Normalize(vec3Cross(forward, [0, 1, 0]));
    const up = vec3Normalize(vec3Cross(right, forward));
    const tan = Math.tan((31 * Math.PI / 180) * 0.5);
    const aspect = rect.width / Math.max(1, rect.height);
    const dir = vec3Normalize([
      forward[0] + right[0] * nx * tan * aspect + up[0] * ny * tan,
      forward[1] + right[1] * nx * tan * aspect + up[1] * ny * tan,
      forward[2] + right[2] * nx * tan * aspect + up[2] * ny * tan
    ]);
    return { eye, dir };
  }

  function groundPointFromClient(clientX, clientY) {
    const ray = cameraRayFromClient(clientX, clientY);
    if (Math.abs(ray.dir[1]) < 0.0001) return null;
    let targetY = groundY + PATH_TOP_RISE;
    let t = (targetY - ray.eye[1]) / ray.dir[1];
    if (t <= 0) return null;
    let x = ray.eye[0] + ray.dir[0] * t;
    let z = ray.eye[2] + ray.dir[2] * t;
    targetY = pathGroundYAt(x, z);
    t = (targetY - ray.eye[1]) / ray.dir[1];
    if (t <= 0) return null;
    x = ray.eye[0] + ray.dir[0] * t;
    z = ray.eye[2] + ray.dir[2] * t;
    return { x, z, y: pathGroundYAt(x, z) };
  }

  function objectScreenBounds(obj) {
    if (!obj || obj.deleted || obj.carried) return null;
    const x = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    const points = [
      projectWorldPoint(x - obj.sx * 0.5, obj.y, obj.z),
      projectWorldPoint(x + obj.sx * 0.5, obj.y, obj.z),
      projectWorldPoint(x - obj.sx * 0.5, obj.y + obj.sy, obj.z),
      projectWorldPoint(x + obj.sx * 0.5, obj.y + obj.sy, obj.z)
    ].filter(Boolean);
    if (points.length < 2) return null;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    return { left, right, top, bottom, width: right-left, height: bottom-top, cx:(left+right)*0.5, cy:(top+bottom)*0.5 };
  }

  function pickSceneObjects(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const candidates = [];
    for (const obj of allSceneObjects()) {
      if (obj.deleted || obj.carried) continue;
      if (editMode && !editorObjectIsEditable(obj)) continue;
      const b = objectScreenBounds(obj);
      if (!b || b.right < -20 || b.left > rect.width + 20 || b.bottom < -20 || b.top > rect.height + 20) continue;
      const pad = 7;
      if (px < b.left-pad || px > b.right+pad || py < b.top-pad || py > b.bottom+pad) continue;
      const centreDist = Math.hypot(px-b.cx, py-b.cy);
      candidates.push({ obj, centreDist });
    }
    // Camera is on +Z, so larger Z is visually nearer. Start with the
    // foremost item and let repeated taps cycle backward through the stack.
    candidates.sort((a,b) => (b.obj.z - a.obj.z) || (a.centreDist - b.centreDist));
    return candidates.map(item => item.obj);
  }

  function cycleInfoFor(obj, candidates) {
    if (!obj || !candidates?.length) return null;
    const index = candidates.indexOf(obj);
    return index >= 0 ? { objects: candidates.slice(), index } : null;
  }

  function sortSceneCollections() {
    backdrop.sort((a,b)=>a.z-b.z);
    midfill.sort((a,b)=>a.z-b.z);
    frontOccluders.sort((a,b)=>a.z-b.z);
  }

  function selectedPuzzleMarker() {
    return markerForId(editorPuzzleMarkerId) || null;
  }

  function selectedPuzzleInstance() {
    if (editMode && editorScope === 'puzzle' && puzzleBrowserMode === 'library') return null;
    const marker = selectedPuzzleMarker();
    if (!marker) return null;
    if (editMode && editorScope === 'puzzle' && puzzleWorkshopClear) return activePuzzleInstances.get(marker.id) || null;
    return activePuzzleInstances.get(marker.id) || instantiatePuzzleGroup(marker);
  }

  function editorObjectIsEditable(obj) {
    if (!obj || obj.deleted) return false;
    if (editorScope === 'puzzle') return puzzleBrowserMode === 'scene' && !!editorPuzzleMarkerId && obj.puzzleInstanceId === editorPuzzleMarkerId;
    return !obj.puzzleInstanceId;
  }

  function pointInsideScreenBounds(clientX, clientY, bounds, pad = 4) {
    if (!bounds) return false;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return x >= bounds.left-pad && x <= bounds.right+pad && y >= bounds.top-pad && y <= bounds.bottom+pad;
  }

  function puzzleAssetNamesFor(markerId) {
    const marker = markerForId(markerId);
    const def = markerDefinition(marker);
    const names = new Set();
    for (const packName of def?.assetPacks || []) {
      for (const asset of puzzleConfig.assetPacks?.[packName]?.assets || []) names.add(asset.name);
    }
    return names;
  }

  function selectedLibraryGroupId() {
    if (editorPuzzleLibraryGroupId && groupDefinition(editorPuzzleLibraryGroupId)) return editorPuzzleLibraryGroupId;
    const marker = selectedPuzzleMarker();
    if (marker?.group && groupDefinition(marker.group)) return marker.group;
    return allPuzzleGroups()[0]?.id || null;
  }

  function puzzleGroupDisplayRows() {
    const groups = allPuzzleGroups();
    const labelCounts = new Map();
    for (const { id, def } of groups) {
      const label = def?.label || id;
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    }
    const seenLabels = new Map();
    return groups.map(({ id, def }) => {
      const label = def?.label || id;
      const source = groupIsUserCreated(id) ? 'LOCAL' : 'BUILT-IN';
      const nth = (seenLabels.get(label) || 0) + 1;
      seenLabels.set(label, nth);
      const duplicateSuffix = (labelCounts.get(label) || 0) > 1 ? ` ${nth}` : '';
      return { id, def, label, source, displayLabel:`${label}${duplicateSuffix} · ${source}` };
    });
  }

  function renderScenePuzzleList({ force=false } = {}) {
    if (!puzzleSceneListEl) return;
    const markers = scenePuzzleMarkers().slice().sort((a,b) => Number(a.x) - Number(b.x));
    const signature = markers.map(marker => [
      marker.id,
      marker.group,
      markerLinkMode(marker),
      Number(marker.x).toFixed(4)
    ].join(':')).join('|') + `|selected:${editorPuzzleMarkerId || ''}`;
    if (!force && signature === scenePuzzleListSignature) return;
    scenePuzzleListSignature = signature;

    puzzleSceneListEl.innerHTML = '';
    if (puzzleSceneEmptyEl) puzzleSceneEmptyEl.hidden = markers.length > 0;

    for (const marker of markers) {
      const def = markerDefinition(marker);
      const label = def?.label || marker.group || marker.id;
      const kind = markerLinkMode(marker) === 'copy' ? 'COPY' : 'INSTANCE';
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-scene-puzzle-row';
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(marker.id === editorPuzzleMarkerId));
      row.classList.toggle('active', marker.id === editorPuzzleMarkerId);
      const main = document.createElement('span');
      main.className = 'scene-puzzle-main';
      const strong = document.createElement('strong');
      strong.textContent = label;
      const small = document.createElement('small');
      small.textContent = kind;
      main.append(strong, small);
      const pos = document.createElement('span');
      pos.className = 'scene-puzzle-x';
      pos.textContent = `x ${Number(marker.x).toFixed(1)}`;
      row.append(main, pos);
      bindEditorPress(row, () => {
        // Selecting a Scene row is intentionally passive. It chooses which
        // marker the contextual controls refer to without moving the camera or
        // recreating/instantiating the puzzle. Edit and Focus remain explicit.
        editorPuzzleMarkerId = marker.id;
        editorPuzzleLibraryGroupId = marker.group;
        selectObject(null);
        scenePuzzleListSignature = '';
        renderScenePuzzleList({ force:true });
        updatePuzzlePanel();
      });
      puzzleSceneListEl.appendChild(row);
    }
  }

  function populatePuzzleSelector({ force=false } = {}) {
    if (puzzleSelect) {
      const rows = puzzleGroupDisplayRows();
      const wanted = selectedLibraryGroupId();
      const signature = rows.map(row => `${row.id}:${row.displayLabel}`).join('|') + `|selected:${wanted || ''}`;
      if (force || signature !== puzzleLibraryListSignature) {
        puzzleLibraryListSignature = signature;
        puzzleSelect.innerHTML = '';
        for (const row of rows) {
          const option = document.createElement('option');
          option.value = row.id;
          option.textContent = row.displayLabel;
          puzzleSelect.appendChild(option);
        }
        editorPuzzleLibraryGroupId = wanted;
        if (wanted) puzzleSelect.value = wanted;
        puzzleSelect.setAttribute('aria-label', 'Puzzle library template');
      }
    }
    renderScenePuzzleList({ force });
  }

  function setPuzzleBrowserMode(mode) {
    if (mode !== 'library' && mode !== 'scene') return;
    puzzleBrowserMode = mode;
    selectObject(null);
    if (mode === 'library') {
      const marker = selectedPuzzleMarker();
      if (marker?.group) editorPuzzleLibraryGroupId = marker.group;
      editorPuzzleLibraryGroupId ||= allPuzzleGroups()[0]?.id || null;
    } else {
      const markers = scenePuzzleMarkers();
      if (!editorPuzzleMarkerId || !markers.some(marker => marker.id === editorPuzzleMarkerId)) {
        // Scene mode is a browser first: show the full list and wait for an
        // explicit row tap rather than silently choosing the first puzzle.
        editorPuzzleMarkerId = null;
      }
    }
    populatePuzzleSelector();
    buildAssetPalette();
    updatePuzzlePanel();
    updateEditorButtons();
  }

  function goToWorldX(targetX, label = 'Position') {
    if (!Number.isFinite(Number(targetX))) return;
    const x = Number(targetX);
    camera.x = x - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = x;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    updatePuzzleStreaming(character.x);
    if (quickNavPanel) quickNavPanel.hidden = true;
    if (quickNavBtn) quickNavBtn.setAttribute('aria-expanded', 'false');
    hintEl.textContent = `${label} · x ${x.toFixed(1)}`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function renderQuickNav() {
    if (!quickNavListEl) return;
    quickNavListEl.innerHTML = '';
    const current = document.createElement('div');
    current.className = 'sidescroll-quick-nav-current';
    current.textContent = `Character X ${Number(character?.x ?? (camera.x + character.screenOffsetX)).toFixed(1)}`;
    quickNavListEl.appendChild(current);
    const destinations = [{ label:'Start', x:0, detail:'Scene start' }];
    for (const marker of scenePuzzleMarkers().slice().sort((a,b) => Number(a.x)-Number(b.x))) {
      const def = markerDefinition(marker);
      destinations.push({ label:def?.label || marker.group || 'Puzzle', x:Number(marker.x)||0, detail:'Puzzle' });
    }
    for (const destination of destinations) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sidescroll-quick-nav-row';
      row.innerHTML = `<span><strong>${destination.label}</strong><small>${destination.detail}</small></span><b>x ${destination.x.toFixed(1)}</b>`;
      bindEditorPress(row, () => goToWorldX(destination.x, destination.label));
      quickNavListEl.appendChild(row);
    }
  }

  function setQuickNavOpen(open) {
    if (!quickNavPanel || !quickNavBtn) return;
    const next = !!open && editMode;
    quickNavPanel.hidden = !next;
    quickNavBtn.setAttribute('aria-expanded', String(next));
    if (next) {
      setAssetPaletteOpen(false);
      cameraEditMode = false;
      updateCameraEditorUi();
      renderQuickNav();
    }
  }

  function focusSelectedPuzzle() {
    // Focus is a Scene action: it only moves the view to the selected marker.
    // It deliberately does not change the selected template or create a puzzle.
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    camera.x = marker.x - character.screenOffsetX;
    previousCameraX = camera.x;
    character.x = camera.x + character.screenOffsetX;
    updatePuzzleStreaming(character.x);
    hintEl.textContent = `Focused ${markerDefinition(marker)?.label || marker.group} at x ${Number(marker.x).toFixed(1)}`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function editSelectedScenePuzzle() {
    if (puzzleBrowserMode !== 'scene') return;
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    // Explicitly activate the selected puzzle for bounds/object editing. This is
    // separate from row selection so browsing the Scene list stays predictable.
    editorPuzzleLibraryGroupId = marker.group || editorPuzzleLibraryGroupId;
    instantiatePuzzleGroup(marker);
    if (puzzleWorkshopIsolated) {
      puzzleWorkshopClear = false;
      savePuzzleWorkshopState(marker.id);
    }
    selectObject(null);
    buildAssetPalette();
    hintEl.textContent = `Editing ${markerDefinition(marker)?.label || marker.group} · tap props or bounds to modify them`;
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function choosePuzzleForEditing(markerId, focus = false) {
    const marker = markerForId(markerId) || allPuzzleMarkers()[0] || null;
    editorPuzzleMarkerId = marker?.id || null;
    if (marker) {
      currentPuzzleBoundsRelative(marker);
      editorPuzzleLibraryGroupId = marker.group || editorPuzzleLibraryGroupId;

      // A cleared workshop is a template-picking state. Merely choosing a
      // puzzle (or switching to the Puzzle tab) must not put anything into the
      // world. Spawn Here / New Puzzle are the only authoring actions that turn
      // a template into a live instance.
      if (!(puzzleWorkshopIsolated && puzzleWorkshopClear)) {
        instantiatePuzzleGroup(marker);
        if (puzzleWorkshopIsolated) savePuzzleWorkshopState(marker.id);
      } else {
        savePuzzleWorkshopState(null);
      }
    }
    selectObject(null);
    buildAssetPalette();
    if (focus && !(puzzleWorkshopIsolated && puzzleWorkshopClear)) focusSelectedPuzzle();
    updatePuzzlePanel();
  }


  function puzzleSlug(text) {
    return String(text || 'puzzle').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'puzzle';
  }

  function puzzleExportFilename(text) {
    // Keep the author's puzzle name intact (including spaces/underscores/case)
    // and only strip characters that are illegal or troublesome in filenames.
    const cleaned = String(text || 'Puzzle').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+$/g, '');
    return `${cleaned || 'Puzzle'}.json`;
  }

  function deepCopy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function puzzleSpawnX() {
    return camera.x + character.screenOffsetX;
  }

  function uniqueLocalId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random()*0xffff).toString(36)}`;
  }

  function addLocalMarker(groupId, x, { linkMode='instance', startSnapshot=null } = {}) {
    const marker = { id:uniqueLocalId('marker'), group:groupId, x:Number(x) || 0, local:true, linkMode:linkMode === 'copy' ? 'copy' : 'instance' };
    userPuzzleLibrary.markers.push(marker);
    if (marker.linkMode === 'copy' && startSnapshot) {
      puzzleStartState[marker.id] = deepCopy(startSnapshot);
      puzzleStartState[marker.id].source = 'authored';
      puzzleStartState[marker.id].savedAt = Date.now();
      savePuzzleStarts();
    }
    savePuzzleLibrary();
    populatePuzzleSelector({ force:true });
    return marker;
  }

  function spawnSelectedPuzzleHere() {
    const groupId = puzzleBrowserMode === 'library' ? selectedLibraryGroupId() : selectedPuzzleMarker()?.group;
    if (!groupId || !groupDefinition(groupId)) return;
    const marker = addLocalMarker(groupId, puzzleSpawnX(), { linkMode:'instance' });
    puzzleWorkshopIsolated = true;
    puzzleWorkshopClear = false;
    puzzleBrowserMode = 'scene';
    editorPuzzleMarkerId = marker.id;
    editorPuzzleLibraryGroupId = marker.group;
    populatePuzzleSelector({ force:true });
    choosePuzzleForEditing(marker.id, true);
    savePuzzleWorkshopState(marker.id);
    applyPuzzleStart(selectedPuzzleInstance(), { persistRuntime:true });
    hintEl.textContent = 'Linked puzzle instance spawned here · edit it, then Set Start or Save Unique';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function createPuzzleHere() {
    const entered = window.prompt('Puzzle name', 'New puzzle');
    if (entered == null) return;
    const label = entered.trim() || 'New puzzle';
    let groupId = `USER_${puzzleSlug(label).replace(/-/g,'_').toUpperCase()}`;
    let suffix = 2;
    while (userPuzzleLibrary.groups[groupId] || puzzleConfig.groups?.[groupId]) groupId = `USER_${puzzleSlug(label).replace(/-/g,'_').toUpperCase()}_${suffix++}`;
    userPuzzleLibrary.groups[groupId] = { label, width:8, assetPacks:['woodland-puzzle-atlas-v1'], entryX:-3.5, exitX:3.5, props:[] };
    userPuzzleLibrary.templates ||= {};
    userPuzzleLibrary.templates[groupId] = { source:'authored', savedAt:Date.now(), bounds:{minX:-4,maxX:4}, objects:{} };
    savePuzzleLibrary();
    puzzleBrowserMode = 'library';
    editorPuzzleLibraryGroupId = groupId;
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Blank puzzle added to the Library · press Spawn Here when you are ready to build it';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function clearPuzzleStage() {
    if (puzzleTestMode) return;
    const selectedBeforeClear = selectedPuzzleMarker();
    const selectedGroupBeforeClear = puzzleBrowserMode === 'library' ? selectedLibraryGroupId() : (selectedBeforeClear?.group || null);
    puzzleWorkshopIsolated = true;
    puzzleWorkshopClear = true;
    selectObject(null);

    // Clear means clear the authored workshop stage, not merely hide it for the
    // current session. Remove every locally placed marker instance while
    // preserving the reusable puzzle group/template definitions themselves.
    const localIds = new Set((userPuzzleLibrary.markers || []).map(marker => marker.id));
    for (const id of [...activePuzzleInstances.keys()]) unloadPuzzleGroup(id);
    for (const id of localIds) {
      delete puzzleStartState[id];
      delete puzzleSavedState[id];
      delete puzzleDraftBounds[id];
    }
    userPuzzleLibrary.markers = [];
    savePuzzleLibrary();
    savePuzzleStarts();
    savePuzzleState();

    // Clearing the stage leaves the reusable Puzzle Library untouched.
    editorPuzzleMarkerId = null;
    puzzleBrowserMode = 'library';
    editorPuzzleLibraryGroupId = selectedGroupBeforeClear && groupDefinition(selectedGroupBeforeClear)
      ? selectedGroupBeforeClear
      : (allPuzzleGroups()[0]?.id || null);
    populatePuzzleSelector({ force:true });
    savePuzzleWorkshopState(null);

    hintEl.textContent = 'Stage cleared and saved · choose a Library puzzle then Spawn Here, or create a new puzzle';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }


  function restoreNormalPuzzleStage() {
    if (puzzleTestMode) return;
    puzzleWorkshopIsolated = false;
    puzzleWorkshopClear = false;
    puzzleBrowserMode = 'scene';
    savePuzzleWorkshopState(null);
    updatePuzzleStreaming(camera.x + character.screenOffsetX);
    const near = activePuzzleNear(camera.x + character.screenOffsetX);
    editorPuzzleMarkerId = near?.id || allPuzzleMarkers()[0]?.id || null;
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Normal game puzzle markers restored';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function removeSelectedLocalPuzzle() {
    const marker = selectedPuzzleMarker();
    if (!marker || !markerIsUserCreated(marker)) return;
    if (!window.confirm('Remove this locally spawned puzzle instance?')) return;
    unloadPuzzleGroup(marker.id);
    userPuzzleLibrary.markers = userPuzzleLibrary.markers.filter(item => item.id !== marker.id);
    delete puzzleStartState[marker.id];
    delete puzzleSavedState[marker.id];
    delete puzzleDraftBounds[marker.id];
    savePuzzleLibrary(); savePuzzleStarts(); savePuzzleState();
    if (puzzleWorkshopState.markerId === marker.id) savePuzzleWorkshopState(null);
    editorPuzzleMarkerId = null;
    populatePuzzleSelector({ force:true });
    updatePuzzlePanel();
  }

  function deleteSelectedPuzzleTemplate() {
    const groupId = selectedLibraryGroupId();
    if (!groupId || !groupIsUserCreated(groupId)) return;
    const def = groupDefinition(groupId);
    const linkedMarkers = (userPuzzleLibrary.markers || []).filter(marker => marker.group === groupId);
    const suffix = linkedMarkers.length
      ? ` This will also remove ${linkedMarkers.length} placed scene puzzle${linkedMarkers.length === 1 ? '' : 's'} that use it.`
      : '';
    if (!window.confirm(`Delete "${def?.label || groupId}" from the Puzzle Library?${suffix}`)) return;

    const removedIds = new Set(linkedMarkers.map(marker => marker.id));
    for (const marker of linkedMarkers) {
      unloadPuzzleGroup(marker.id);
      delete puzzleStartState[marker.id];
      delete puzzleSavedState[marker.id];
      delete puzzleDraftBounds[marker.id];
    }
    userPuzzleLibrary.markers = (userPuzzleLibrary.markers || []).filter(marker => marker.group !== groupId);
    delete userPuzzleLibrary.groups[groupId];
    delete userPuzzleLibrary.templates[groupId];
    if (editorPuzzleMarkerId && removedIds.has(editorPuzzleMarkerId)) editorPuzzleMarkerId = null;

    const fallback = allPuzzleGroups()[0]?.id || null;
    editorPuzzleLibraryGroupId = fallback;
    savePuzzleLibrary();
    savePuzzleStarts();
    savePuzzleState();
    if (puzzleWorkshopIsolated && !(userPuzzleLibrary.markers || []).length) {
      puzzleWorkshopClear = true;
      savePuzzleWorkshopState(null);
    }
    populatePuzzleSelector({ force:true });
    hintEl.textContent = 'Puzzle template deleted';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function puzzleOrphanObjects(instance) {
    if (!instance) return [];
    const allowed = puzzleAssetNamesFor(instance.id);
    const b = puzzleBounds(instance);
    return allSceneObjects().filter(obj => {
      if (!obj || obj.deleted || obj.puzzleInstanceId) return false;
      const puzzleLikeName = allowed.has(obj.assetName)
        || /^(?:puzzle-|fallen-tree$|tree-stump$|broken-branch$|log-|barrel$|puzzle-crate)/.test(obj.assetName || '');
      if (!puzzleLikeName) return false;
      const x = objectXNear(obj, instance.marker.x);
      return x >= b.minX - 1 && x <= b.maxX + 1;
    });
  }

  function focusObjectForAuthoring(obj) {
    if (!obj) return;
    camera.x = objectXNear(obj, camera.x) - character.screenOffsetX;
    previousCameraX = camera.x;
    if (obj.puzzleInstanceId === editorPuzzleMarkerId) selectObject(obj);
    else {
      // Orphans are deliberately selectable from the list even though normal
      // puzzle-scope tapping refuses environment objects.
      selectedObject = obj;
      selectionCycleInfo = null;
      collisionEditMode = false;
      updateEditorButtons();
    }
  }

  function deletePuzzleListObject(obj) {
    if (!obj) return;
    obj.deleted = true;
    recordObjectEdit(obj);
    if (obj.category === 'gameplay') settleGameplayCrates();
    if (selectedObject === obj) selectedObject = null;
    updateEditorButtons();
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function restorePuzzleListObject(obj) {
    if (!obj) return;
    obj.deleted = false;
    recordObjectEdit(obj);
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function updatePuzzleObjectList() {
    if (!puzzleObjectsEl || !puzzleObjectListEl) return;
    const instance = (editMode && editorScope === 'puzzle' && !puzzleWorkshopClear) ? selectedPuzzleInstance() : null;
    puzzleObjectsEl.hidden = !instance || puzzleTestMode;
    if (!instance) { puzzleObjectListEl.innerHTML=''; if (puzzleObjectCountEl) puzzleObjectCountEl.textContent='0'; return; }
    const rows = [
      ...instance.objects
        .filter(obj => !(obj.deleted && String(obj.puzzleObjectId || '').startsWith('authored-')))
        .map(obj => ({obj, orphan:false})),
      ...puzzleOrphanObjects(instance).map(obj => ({obj, orphan:true}))
    ];
    if (puzzleObjectCountEl) puzzleObjectCountEl.textContent = String(rows.length);
    puzzleObjectListEl.innerHTML = '';
    for (const {obj,orphan} of rows) {
      const row = document.createElement('div');
      row.className = `sidescroll-puzzle-object-row${orphan ? ' orphan' : ''}${obj.deleted ? ' deleted' : ''}`;
      const label = document.createElement('button');
      label.type='button'; label.className='object-name';
      const friendly = editorAssetInfo.get(obj.assetName)?.label || obj.assetName || 'unknown';
      label.textContent = `${orphan ? 'ORPHAN · ' : ''}${friendly}${obj.deleted ? ' · deleted' : ''}`;
      label.title = obj.puzzleObjectId || obj.id;
      bindEditorPress(label, () => focusObjectForAuthoring(obj));
      const action = document.createElement('button');
      action.type='button'; action.className='object-action';
      action.textContent = obj.deleted ? 'Restore' : 'Delete';
      bindEditorPress(action, () => { obj.deleted ? restorePuzzleListObject(obj) : deletePuzzleListObject(obj); });
      row.append(label,action);
      puzzleObjectListEl.appendChild(row);
    }
  }

  function currentPuzzleSetupSnapshot(instance) {
    if (!instance) return null;
    const objects = {};
    for (const obj of instance.objects) {
      if (!obj?.puzzleObjectId) continue;
      objects[obj.puzzleObjectId] = {
        asset:obj.assetName,
        x:obj.x-instance.marker.x,
        z:obj.z,
        yOffset:obj.y - (obj.category === 'gameplay' && obj.gameplayLayerLocked ? playSurfaceYAt(obj.x) : pathGroundYAt(obj.x, obj.z)),
        sx:obj.sx,
        sy:obj.sy,
        flip:!!obj.flip,
        deleted:!!obj.deleted,
        category:obj.category || 'gameplay',
        gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked,
        collision:cloneCollision(obj.collision), collisionOverride:!!obj.collisionOverride,
        shadow:obj.shadow ? { ...obj.shadow } : null,
        sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
        socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null
      };
    }
    return { bounds:{...currentPuzzleBoundsRelative(instance.marker)}, objects };
  }

  function puzzleExportPayload(instance) {
    const marker = instance.marker;
    const def = markerDefinition(marker) || {};
    const start = deepCopy(puzzleStartFor(marker));
    const diagnostics = instance.objects.map(obj => ({
      id:obj.id,
      puzzleObjectId:obj.puzzleObjectId,
      asset:obj.assetName,
      deleted:!!obj.deleted,
      x:obj.x,
      relativeX:obj.x-marker.x,
      y:obj.y,
      z:obj.z,
      sx:obj.sx,
      sy:obj.sy,
      hasTexture:!!obj.texture,
      category:obj.category,
      gameplayType:obj.gameplayType,
      collision:cloneCollision(obj.collision),
      sockets:Array.isArray(obj.sockets) ? obj.sockets.map(socket => ({ ...socket })) : [],
      socketedTo:obj.socketedTo ? { ...obj.socketedTo } : null
    }));
    const orphans = puzzleOrphanObjects(instance).map(obj => ({
      id:obj.id, asset:obj.assetName, x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy,
      deleted:!!obj.deleted, hasTexture:!!obj.texture, category:obj.category, gameplayType:obj.gameplayType
    }));
    return {
      format:'SideScrollPuzzle',
      formatVersion:1,
      appVersion:'0.2.59',
      exportedAt:new Date().toISOString(),
      marker:{ id:marker.id, group:marker.group, x:marker.x, local:markerIsUserCreated(marker) },
      definition:deepCopy(def),
      savedStart:start,
      currentSetup:currentPuzzleSetupSnapshot(instance),
      currentSetupDiffersFromSaved:puzzleStartDirty.has(instance.id),
      diagnostics:{ objects:diagnostics, orphanCandidates:orphans }
    };
  }

  async function exportSelectedPuzzle() {
    let payload = null;
    let filename = 'SideScroll-puzzle.json';
    if (puzzleBrowserMode === 'library' && !puzzleTestMode) {
      const groupId = selectedLibraryGroupId();
      const def = groupDefinition(groupId);
      if (!groupId || !def) return;
      payload = {
        format:'SideScrollPuzzleTemplate', formatVersion:1, appVersion:'0.2.59', exportedAt:new Date().toISOString(),
        group:groupId, definition:deepCopy(def), savedStart:deepCopy(templateStartForGroup(groupId)),
        source:groupIsUserCreated(groupId) ? 'local-library' : 'library'
      };
      filename = puzzleExportFilename(def.label || groupId);
    } else {
      const instance = selectedPuzzleInstance();
      if (!instance) return;
      payload = puzzleExportPayload(instance);
      filename = puzzleExportFilename(instance.def?.label || instance.marker.group);
    }
    const text = JSON.stringify(payload,null,2);
    const blob = new Blob([text], {type:'application/json'});
    try {
      const file = new File([blob], filename, {type:'application/json'});
      if (navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file]});
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    hintEl.textContent = 'Puzzle JSON exported';
    hintEl.classList.remove('hidden');
  }


  function exportableEnvironmentObject(obj) {
    if (!obj || obj.puzzleInstanceId || obj.collectible) return null;
    return {
      id:obj.id,
      asset:obj.assetName,
      x:Number(obj.x) || 0,
      y:Number(obj.y) || 0,
      z:Number(obj.z) || 0,
      sx:Number(obj.sx) || 1,
      sy:Number(obj.sy) || 1,
      flip:!!obj.flip,
      deleted:!!obj.deleted,
      category:obj.category || 'dressing',
      gameplayType:obj.gameplayType || null,
      gameplayLayerLocked:!!obj.gameplayLayerLocked,
      userAdded:!!obj.userAdded,
      collision:cloneCollision(obj.collision),
      collisionOverride:!!obj.collisionOverride
    };
  }

  function allPuzzleDesignsForExport() {
    return allPuzzleMarkers().map(marker => {
      const instance = activePuzzleInstances.get(marker.id) || null;
      const savedStart = deepCopy(puzzleStartFor(marker));
      const currentSetup = instance ? currentPuzzleSetupSnapshot(instance) : null;
      const dirty = !!(instance && puzzleStartDirty.has(instance.id));
      return {
        marker:{
          id:marker.id,
          group:marker.group,
          x:Number(marker.x) || 0,
          local:markerIsUserCreated(marker),
          linkMode:markerLinkMode(marker)
        },
        source:markerIsUserCreated(marker) ? 'local' : 'built-in',
        definition:deepCopy(markerDefinition(marker) || {}),
        savedStart,
        currentSetup,
        currentSetupDiffersFromSaved:dirty,
        effectiveSetup:dirty && currentSetup ? deepCopy(currentSetup) : savedStart
      };
    });
  }

  function completeGameDesignExportPayload() {
    let cameraTune = null;
    try {
      cameraTune = JSON.parse(localStorage.getItem(CAMERA_TUNE_STORAGE_KEY) || 'null');
    } catch (_) {}

    const environmentSnapshot = allSceneObjects()
      .map(exportableEnvironmentObject)
      .filter(Boolean)
      .sort((a,b) => (a.x-b.x) || (a.z-b.z) || String(a.id).localeCompare(String(b.id)));

    return {
      format:'SideScrollGameDesign',
      formatVersion:1,
      appVersion:'0.2.59',
      exportedAt:new Date().toISOString(),
      purpose:'Complete authoring handoff: scene placement, puzzle placement/setup, reusable asset settings, collectables and camera tuning.',
      world:{
        tile:{ minX:TILE.minX, maxX:TILE.maxX, width:TILE_WIDTH },
        path:{ z:pathZ, flatHalf:PATH_FLAT_HALF, bermHalf:PATH_BERM_HALF, outerHalf:PATH_OUTER_HALF },
        start:{ x:0, z:pathZ }
      },
      scene:{
        edits:deepCopy(sceneData),
        resolvedEnvironment:environmentSnapshot
      },
      puzzles:{
        instances:allPuzzleDesignsForExport(),
        localLibrary:deepCopy(userPuzzleLibrary),
        savedStarts:deepCopy(puzzleStartState)
      },
      assets:{
        behaviourOverrides:deepCopy(assetBehaviourOverrides),
        collisionDefaults:deepCopy(assetCollisionDefaults)
      },
      collectables:{
        setup:deepCopy(collectibleSetup)
      },
      camera:cameraTune || { y:camera.y, z:camera.z, tilt:camera.targetY-camera.y }
    };
  }

  async function exportAllGameDesign() {
    const payload = completeGameDesignExportPayload();
    const text = JSON.stringify(payload, null, 2);
    const filename = 'SideScroll-Complete-Game-Design.json';
    const blob = new Blob([text], {type:'application/json'});

    try {
      const file = new File([blob], filename, {type:'application/json'});
      if (navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file]});
        hintEl.textContent = 'Complete game design exported';
        hintEl.classList.remove('hidden');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    hintEl.textContent = 'Complete game design exported';
    hintEl.classList.remove('hidden');
  }

  function setEditorScope(scope) {
    if (scope !== 'environment' && scope !== 'puzzle') return;
    // Environment/Puzzle is only an editor filter. It must not change whether
    // the workshop stage is isolated or clear.
    editorScope = scope;
    puzzleEnvironmentPlacementMode = false;
    puzzleExclusionEditMode = false;
    puzzleExclusionHandle = null;
    selectObject(null);
    addAssetType = null;
    updatePlacementModeUi();
    if (scope === 'puzzle') {
      if (puzzleWorkshopClear) {
        puzzleBrowserMode = 'library';
        editorPuzzleLibraryGroupId ||= allPuzzleGroups()[0]?.id || null;
        populatePuzzleSelector();
      } else {
        if (puzzleBrowserMode === 'scene' && editorPuzzleMarkerId && !scenePuzzleMarkers().some(marker => marker.id === editorPuzzleMarkerId)) {
          editorPuzzleMarkerId = null;
        }
        populatePuzzleSelector();
      }
    }
    buildAssetPalette();
    updatePuzzlePanel();
    updateEditorButtons();
  }

  function socketLabelForPiece(objOrName) {
    const name = typeof objOrName === 'string' ? objOrName : objOrName?.assetName;
    const label = editorAssetInfo.get(name)?.label || name || 'piece';
    return label.replace(/^STONE PIECE\s+/i, '').replace(/^MOVEABLE\s+/i, '');
  }

  function socketKeyForPiece(obj) {
    if (!obj) return null;
    return obj.puzzleObjectId || obj.assetName || null;
  }

  function socketMatchesPiece(socket, piece) {
    if (!socket || !piece) return false;
    if (socket.pieceObjectId && piece.puzzleObjectId) return socket.pieceObjectId === piece.puzzleObjectId;
    return socket.pieceAsset === piece.assetName;
  }

  function socketWorldPosition(host, socket) {
    if (!host || !socket) return null;
    const storedU = Rig.clamp(Number(socket.u) || 0, 0, 1);
    const visualU = host.flip ? 1 - storedU : storedU;
    const v = Rig.clamp(Number(socket.v) || 0, 0, 1);
    return {
      x: host.x + (visualU - 0.5) * host.sx,
      y: host.y + v * host.sy,
      z: host.z + SOCKET_DEPTH_BIAS
    };
  }

  function socketHostsForInstance(instance) {
    if (!instance) return [];
    return (instance.objects || []).filter(obj => !obj.deleted && objectHasBehaviour(obj, 'socketHost'));
  }

  function socketForPiece(instance, piece) {
    if (!instance || !piece) return null;
    for (const host of socketHostsForInstance(instance)) {
      const socket = (host.sockets || []).find(item => socketMatchesPiece(item, piece));
      if (socket) return { host, socket };
    }
    return null;
  }

  function clearSocketForPiece(instance, piece, { record = true } = {}) {
    if (!instance || !piece) return false;
    let changed = false;
    for (const host of socketHostsForInstance(instance)) {
      const before = (host.sockets || []).length;
      host.sockets = (host.sockets || []).filter(item => !socketMatchesPiece(item, piece));
      if (host.sockets.length !== before) {
        changed = true;
        if (record) recordObjectEdit(host);
      }
    }
    return changed;
  }

  function socketHostAt(clientX, clientY) {
    const candidates = pickSceneObjects(clientX, clientY)
      .filter(obj => editorObjectIsEditable(obj) && objectHasBehaviour(obj, 'socketHost'));
    return candidates[0] || null;
  }

  function placeSocketOnHost(piece, host, clientX, clientY) {
    if (!piece || !host || !piece.puzzleInstanceId || piece.puzzleInstanceId !== host.puzzleInstanceId) return false;
    const bounds = objectScreenBounds(host);
    const rect = canvas.getBoundingClientRect();
    if (!bounds || !rect.width || !rect.height) return false;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const screenU = Rig.clamp((px - bounds.left) / Math.max(1, bounds.width), 0, 1);
    const textureU = host.flip ? 1 - screenU : screenU;
    const v = Rig.clamp((bounds.bottom - py) / Math.max(1, bounds.height), 0, 1);
    const instance = activePuzzleInstances.get(piece.puzzleInstanceId);
    if (!instance) return false;

    clearSocketForPiece(instance, piece, { record:false });
    host.sockets ||= [];
    host.sockets.push({
      id:`socket-${socketKeyForPiece(piece)}`,
      pieceAsset:piece.assetName,
      pieceObjectId:piece.puzzleObjectId || null,
      u:textureU,
      v
    });
    recordObjectEdit(host);
    puzzleStartDirty.add(instance.id);

    // A user-authored puzzle containing sockets is a socket-completion puzzle
    // unless the author has already supplied another completion rule.
    if (!instance.def.completion && groupIsUserCreated(instance.marker.group)) {
      instance.def.completion = { type:'sockets' };
      savePuzzleLibrary();
    }
    return true;
  }

  function startSocketPlacement() {
    if (!selectedObject || !objectHasBehaviour(selectedObject, 'socketPiece') || !selectedObject.puzzleInstanceId) return;
    socketPlacementPiece = selectedObject;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    addAssetType = null;
    updatePlacementModeUi();
    updateEditorButtons();
    hintEl.textContent = `SET SOCKET · tap the matching position on a Socket Host for ${socketLabelForPiece(selectedObject)}`;
    hintEl.classList.remove('hidden');
  }

  function cancelSocketPlacement() {
    socketPlacementPiece = null;
    updateEditorButtons();
  }

  function clearSelectedPieceSocket() {
    if (!selectedObject || !selectedObject.puzzleInstanceId) return;
    const instance = activePuzzleInstances.get(selectedObject.puzzleInstanceId);
    if (!instance) return;
    if (clearSocketForPiece(instance, selectedObject)) {
      puzzleStartDirty.add(instance.id);
      hintEl.textContent = `Socket cleared for ${socketLabelForPiece(selectedObject)}`;
    } else {
      hintEl.textContent = 'This piece does not have an authored socket yet';
    }
    socketPlacementPiece = null;
    hintEl.classList.remove('hidden');
    updateEditorButtons();
    updatePuzzlePanel();
  }

  function updateEditorButtons() {
    const has = !!selectedObject && !selectedObject.deleted;
    const collisionFocus = !!(has && collisionEditMode);
    const socketFocus = !!socketPlacementPiece;
    const isGameplay = has && selectedObject.category === 'gameplay';
    const isSocketPiece = !!(has && objectHasBehaviour(selectedObject, 'socketPiece') && selectedObject.puzzleInstanceId);
    const socketInstance = isSocketPiece ? activePuzzleInstances.get(selectedObject.puzzleInstanceId) : null;
    const hasAuthoredSocket = !!(isSocketPiece && socketForPiece(socketInstance, selectedObject));
    const placing = placementModeActive();
    if (editorControls) editorControls.hidden = !editMode || placing;
    if (openAssetsBtn) {
      const puzzleInstanceReady = editorScope === 'puzzle' && puzzleBrowserMode === 'scene' && !!editorPuzzleMarkerId;
      openAssetsBtn.hidden = !editMode || puzzleTestMode || placing || !puzzleInstanceReady;
      openAssetsBtn.textContent = '＋ Add Puzzle Asset';
      openAssetsBtn.classList.toggle('active', !editorPalette?.hidden && editorScope === 'puzzle');
    }
    if (openEnvironmentAssetsBtn) {
      openEnvironmentAssetsBtn.hidden = !editMode || puzzleTestMode || placing || editorScope !== 'environment';
      openEnvironmentAssetsBtn.classList.toggle('active', !editorPalette?.hidden && editorScope === 'environment');
    }
    if (editorDuplicateBtn) editorDuplicateBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorScaleDownBtn) editorScaleDownBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorScaleUpBtn) editorScaleUpBtn.hidden = !has || collisionFocus || socketFocus;
    if (editorGameLayerBtn) {
      editorGameLayerBtn.hidden = !isGameplay || collisionFocus || socketFocus;
      editorGameLayerBtn.classList.toggle('active', !!(isGameplay && selectedObject.gameplayLayerLocked));
    }
    if (editorCollisionBtn) {
      editorCollisionBtn.hidden = !has || socketFocus;
      editorCollisionBtn.classList.toggle('active', !!(selectedObject?.collision && collisionEditMode));
    }
    if (editorCollisionRemoveBtn) editorCollisionRemoveBtn.hidden = !has || !selectedObject?.collision || socketFocus;
    if (editorCollisionSaveAssetBtn) editorCollisionSaveAssetBtn.hidden = !has || !selectedObject?.collision || socketFocus;
    if (editorCollisionUseAssetBtn) editorCollisionUseAssetBtn.hidden = !has || !selectedObject?.collisionOverride || socketFocus;
    if (quickNavBtn) quickNavBtn.hidden = !editMode;
    if (editorSocketBtn) {
      editorSocketBtn.hidden = !isSocketPiece || collisionFocus;
      editorSocketBtn.classList.toggle('active', socketPlacementPiece === selectedObject);
      const label = editorSocketBtn.querySelector('small');
      if (label) label.textContent = hasAuthoredSocket ? 'MOVE SOCKET' : 'SET SOCKET';
    }
    if (editorSocketClearBtn) editorSocketClearBtn.hidden = !isSocketPiece || !hasAuthoredSocket || collisionFocus || socketFocus;
    if (editorDeleteBtn) editorDeleteBtn.hidden = !has || collisionFocus || socketFocus;
  }

  function selectObject(obj, preserveCycle = false, options = {}) {
    if (socketPlacementPiece && obj !== socketPlacementPiece) socketPlacementPiece = null;
    selectedObject = obj && !obj.deleted ? obj : null;
    if (!preserveCycle) selectionCycleInfo = null;
    if (!options.keepPlacement) addAssetType = null;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    updatePlacementModeUi();
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updateEditorButtons();
  }


  function authoringPuzzle() {
    if (puzzleTestMarkerId) {
      const pinned = activePuzzleInstances.get(puzzleTestMarkerId);
      if (pinned) return pinned;
    }
    if (editMode && editorScope === 'puzzle' && puzzleBrowserMode === 'scene' && editorPuzzleMarkerId) return selectedPuzzleInstance();
    return null;
  }

  function updatePuzzlePanel() {
    if (!puzzlePanel) return;
    const visible = editMode || puzzleTestMode;
    puzzlePanel.hidden = !visible;
    document.body.classList.toggle('sidescroll-puzzle-testing', puzzleTestMode);
    if (!visible) return;

    const testing = puzzleTestMode;
    const puzzleEditing = testing || editorScope === 'puzzle';
    const libraryMode = !testing && puzzleEditing && puzzleBrowserMode === 'library';
    const sceneMode = !testing && puzzleEditing && puzzleBrowserMode === 'scene';
    const selectedMarker = (sceneMode || testing) ? selectedPuzzleMarker() : null;
    const instance = testing && selectedMarker
      ? authoringPuzzle()
      : (sceneMode && selectedMarker ? (activePuzzleInstances.get(selectedMarker.id) || null) : null);
    const selectedGroupId = libraryMode ? selectedLibraryGroupId() : selectedMarker?.group;
    const selectedDef = libraryMode ? groupDefinition(selectedGroupId) : markerDefinition(selectedMarker);
    const linkMode = selectedMarker ? markerLinkMode(selectedMarker) : null;

    if (editorScopeSwitch) editorScopeSwitch.hidden = testing;
    environmentScopeBtn?.classList.toggle('active', !testing && editorScope === 'environment');
    puzzleScopeBtn?.classList.toggle('active', testing || editorScope === 'puzzle');
    if (puzzleSourceSwitch) puzzleSourceSwitch.hidden = testing || editorScope !== 'puzzle';
    puzzleSourceLibraryBtn?.classList.toggle('active', !testing && libraryMode);
    puzzleSourceSceneBtn?.classList.toggle('active', !testing && sceneMode);

    if (environmentSelectionEl) environmentSelectionEl.hidden = testing || editorScope !== 'environment';
    if (puzzleLibraryView) puzzleLibraryView.hidden = testing || !libraryMode;
    if (puzzleSceneView) puzzleSceneView.hidden = testing || !sceneMode;
    if (puzzleStageSection) puzzleStageSection.hidden = testing || editorScope !== 'puzzle';
    if (puzzleSelectionEl) puzzleSelectionEl.hidden = !testing && (!puzzleEditing || (sceneMode && !selectedMarker));
    if (puzzlePicker) puzzlePicker.hidden = !libraryMode;
    if (puzzleMarkerEditor) puzzleMarkerEditor.hidden = testing || !sceneMode || !selectedMarker;
    if (puzzleMarkerXInput && sceneMode && selectedMarker && document.activeElement !== puzzleMarkerXInput) {
      puzzleMarkerXInput.value = Number(selectedMarker.x).toFixed(1);
    }

    if (!testing && editorScope === 'puzzle') populatePuzzleSelector();

    if (!puzzleEditing) {
      if (puzzleManageEl) puzzleManageEl.hidden = true;
      if (puzzleActionsEl) puzzleActionsEl.hidden = true;
      if (puzzleObjectsEl) puzzleObjectsEl.hidden = true;
      updateEditorButtons();
      return;
    }

    if (puzzleModeEl) puzzleModeEl.textContent = testing ? 'TEST' : (libraryMode ? 'TEMPLATE' : (linkMode === 'copy' ? 'COPY' : 'INSTANCE'));
    if (puzzleNameEl) puzzleNameEl.textContent = instance?.def?.label || selectedDef?.label || 'No puzzle selected';

    if (puzzleStateEl) {
      if (libraryMode) {
        const source = groupIsUserCreated(selectedGroupId) ? 'Local reusable template.' : 'Built-in reusable template.';
        const linkedCount = scenePuzzleMarkers().filter(marker => marker.group === selectedGroupId && markerLinkMode(marker) === 'instance').length;
        puzzleStateEl.textContent = `${source} ${linkedCount} linked scene instance${linkedCount === 1 ? '' : 's'}.`;
      } else if (testing && instance) {
        puzzleStateEl.textContent = instance.solved
          ? 'Puzzle complete. Reset to run it again, or return to Setup.'
          : 'Testing the current setup. Test moves do not change the saved puzzle.';
      } else if (selectedMarker) {
        const relationship = linkMode === 'copy'
          ? 'COPY · unique to this scene.'
          : `INSTANCE · linked to ${selectedDef?.label || selectedMarker.group}.`;
        if (instance) {
          const b = currentPuzzleBoundsRelative(instance.marker);
          const width = (b.maxX - b.minX).toFixed(1);
          const dirty = puzzleStartDirty.has(instance.id) ? 'Unsaved setup changes. ' : '';
          puzzleStateEl.textContent = `${dirty}${relationship} Marker x ${Number(selectedMarker.x).toFixed(1)} · bounds ${width}m · EDITING.`;
        } else {
          puzzleStateEl.textContent = `${relationship} Marker x ${Number(selectedMarker.x).toFixed(1)} · selected in scene.`;
        }
      }
    }

    if (puzzleHelpEl) {
      puzzleHelpEl.textContent = testing
        ? 'Reset restarts this test setup. Back to Setup returns to the same editable setup you tested.'
        : (libraryMode
            ? 'Choose a template from the Library. Spawn Here places a linked instance at the current camera position.'
            : (selectedMarker
                ? (instance
                    ? (linkMode === 'copy'
                        ? 'This copy is active for editing. Edit Exclusion clears procedural forest art; Add Dressing lets you selectively place environment art back into that puzzle.'
                        : 'This instance is active for editing. Edit Exclusion clears procedural forest art; Add Dressing lets you selectively place environment art back into that puzzle.')
                    : 'Selected from the Scene list. Use Edit Puzzle to activate its bounds and objects, or Focus to move the camera to it.')
                : 'Choose a puzzle from the Scene list to see its controls.'));
    }

    const selectionAvailable = libraryMode ? !!selectedGroupId : !!selectedMarker;
    if (puzzleManageEl) puzzleManageEl.hidden = testing || !selectionAvailable;
    if (puzzleSpawnBtn) { puzzleSpawnBtn.hidden = !libraryMode; puzzleSpawnBtn.disabled = !selectedGroupId; }
    if (puzzleCreateBtn) puzzleCreateBtn.hidden = !libraryMode;
    if (puzzleEditBtn) { puzzleEditBtn.hidden = libraryMode || testing; puzzleEditBtn.disabled = !selectedMarker; }
    if (puzzleFocusBtn) { puzzleFocusBtn.hidden = libraryMode; puzzleFocusBtn.disabled = !selectedMarker; }
    if (puzzleExportBtn) { puzzleExportBtn.hidden = false; puzzleExportBtn.disabled = !selectionAvailable; }
    if (puzzleDeleteTemplateBtn) {
      puzzleDeleteTemplateBtn.hidden = !libraryMode || !groupIsUserCreated(selectedGroupId);
      puzzleDeleteTemplateBtn.disabled = !selectedGroupId || !groupIsUserCreated(selectedGroupId);
    }
    if (puzzleRemoveBtn) {
      puzzleRemoveBtn.hidden = libraryMode || !selectedMarker || !markerIsUserCreated(selectedMarker);
      puzzleRemoveBtn.disabled = !selectedMarker || !markerIsUserCreated(selectedMarker);
    }

    if (puzzleClearStageBtn) puzzleClearStageBtn.classList.toggle('active', puzzleWorkshopClear);
    if (puzzleRestoreStageBtn) puzzleRestoreStageBtn.hidden = !puzzleWorkshopIsolated;

    if (puzzleActionsEl) puzzleActionsEl.hidden = libraryMode || (!instance && !testing);
    if (puzzleSetStartBtn) {
      puzzleSetStartBtn.hidden = testing || libraryMode;
      puzzleSetStartBtn.disabled = !instance;
      puzzleSetStartBtn.textContent = 'Set Start';
    }
    if (puzzleExclusionEditBtn) {
      puzzleExclusionEditBtn.hidden = testing || libraryMode;
      puzzleExclusionEditBtn.disabled = !instance;
      puzzleExclusionEditBtn.classList.toggle('active', !!(instance && puzzleExclusionEditMode));
      puzzleExclusionEditBtn.textContent = puzzleExclusionEditMode ? 'Finish Exclusion' : 'Edit Exclusion';
    }
    if (puzzleExclusionToggleBtn) {
      const ex = instance ? currentPuzzleExclusion(instance.marker) : null;
      puzzleExclusionToggleBtn.hidden = testing || libraryMode;
      puzzleExclusionToggleBtn.disabled = !instance;
      puzzleExclusionToggleBtn.classList.toggle('active', !!ex?.enabled);
      puzzleExclusionToggleBtn.textContent = ex?.enabled ? 'Disable Exclusion' : 'Add Exclusion';
    }
    if (puzzleAddDressingBtn) {
      puzzleAddDressingBtn.hidden = testing || libraryMode;
      puzzleAddDressingBtn.disabled = !instance;
      puzzleAddDressingBtn.classList.toggle('active', !!puzzleEnvironmentPlacementMode);
    }
    if (puzzleSaveUniqueBtn) {
      puzzleSaveUniqueBtn.hidden = testing || libraryMode || !instance || linkMode === 'copy';
      puzzleSaveUniqueBtn.disabled = !instance || !markerIsUserCreated(selectedMarker);
      puzzleSaveUniqueBtn.title = markerIsUserCreated(selectedMarker) ? '' : 'Spawn a Library instance first';
    }
    if (puzzleTestBtn) { puzzleTestBtn.hidden = testing || libraryMode; puzzleTestBtn.disabled = !selectedMarker; }
    if (puzzleResetBtn) { puzzleResetBtn.hidden = libraryMode; puzzleResetBtn.disabled = !instance; }
    if (puzzleBackSetupBtn) { puzzleBackSetupBtn.hidden = !testing; puzzleBackSetupBtn.disabled = !instance; }

    updatePuzzleObjectList();
    updateEditorButtons();
  }


  function authoredSnapshotFromInstance(instance) {
    const setup = currentPuzzleSetupSnapshot(instance);
    return { source:'authored', savedAt:Date.now(), bounds:{...setup.bounds}, objects:deepCopy(setup.objects) };
  }

  function savePuzzleTemplateFromCurrent() {
    const instance = authoringPuzzle();
    if (!instance || puzzleTestMode) return;
    settleGameplayCrates();
    const marker = instance.marker;
    const snapshot = authoredSnapshotFromInstance(instance);
    if (markerLinkMode(marker) === 'copy') {
      puzzleStartState[marker.id] = snapshot;
      savePuzzleStarts();
      puzzleStartDirty.delete(marker.id);
      applyPuzzleSnapshot(instance, snapshot, { persistRuntime:true, clearDirty:true });
      hintEl.textContent = 'Start state set for this unique scene copy';
    } else {
      userPuzzleLibrary.templates ||= {};
      userPuzzleLibrary.templates[marker.group] = snapshot;
      savePuzzleLibrary();
      for (const otherMarker of allPuzzleMarkers()) {
        if (otherMarker.group !== marker.group || markerLinkMode(otherMarker) !== 'instance') continue;
        delete puzzleStartState[otherMarker.id];
        delete puzzleSavedState[otherMarker.id];
        delete puzzleDraftBounds[otherMarker.id];
        puzzleStartDirty.delete(otherMarker.id);
        const active = activePuzzleInstances.get(otherMarker.id);
        if (active) applyPuzzleSnapshot(active, snapshot, { persistRuntime:true, clearDirty:true });
      }
      savePuzzleStarts();
      savePuzzleState();
      hintEl.textContent = 'Start state set · linked instances now use this setup';
    }
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function savePuzzleUniqueFromCurrent() {
    const instance = authoringPuzzle();
    if (!instance || puzzleTestMode) return;
    const marker = instance.marker;
    if (!markerIsUserCreated(marker)) {
      hintEl.textContent = 'Spawn a Library instance first, then Save Unique to detach it';
      hintEl.classList.remove('hidden');
      return;
    }
    settleGameplayCrates();
    const snapshot = authoredSnapshotFromInstance(instance);
    marker.linkMode = 'copy';
    puzzleStartState[marker.id] = snapshot;
    puzzleStartDirty.delete(marker.id);
    savePuzzleStarts();
    savePuzzleLibrary();
    applyPuzzleSnapshot(instance, snapshot, { persistRuntime:true, clearDirty:true });
    populatePuzzleSelector();
    hintEl.textContent = 'Saved as a unique scene copy · future template changes will not affect it';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function resetPuzzleReward(instance) {
    if (!instance) return;
    const state = savedPuzzleFor(instance.id);
    const reward = state.reward ? { ...state.reward } : null;
    const hadCollectedReward = !!reward?.collected;

    if (!removePuzzleRewardFromInventory(instance, { allowLegacyFallback: hadCollectedReward })) {
      // If an old saved puzzle lost its reward metadata but the matching
      // pre-provenance item is still in inventory, an explicit puzzle reset
      // should still clean up that one legacy reward.
      removePuzzleRewardFromInventory(instance, { allowLegacyFallback: true });
    }

    removePuzzleRewardObject(instance);
    delete state.reward;
  }

  function resetCurrentPuzzle() {
    const instance = authoringPuzzle();
    if (!instance) return;
    if (puzzleTestMode && puzzleTestSnapshot) {
      resetPuzzleReward(instance);
      applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:false, clearDirty:false });
      if (puzzleTestInventorySnapshot) restoreInventory(puzzleTestInventorySnapshot);
      // Reset means this puzzle's reward is unavailable again, even if an
      // older test snapshot already contained a legacy copy of the same item.
      removePuzzleRewardFromInventory(instance, { allowLegacyFallback:true });
      setInventoryOpen(false);
      positionPlayerAtPuzzleEntry(instance);
      hintEl.textContent = 'Test reset to the setup you started this test with · reward removed';
    } else {
      resetPuzzleReward(instance);
      applyPuzzleStart(instance, { persistRuntime:true });
      hintEl.textContent = 'Puzzle reset to its saved start · completion reward reset too';
    }
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function beginPuzzleTest() {
    if (puzzleTestMode) return;
    const marker = selectedPuzzleMarker();
    if (!marker) return;
    instantiatePuzzleGroup(marker);
    const instance = activePuzzleInstances.get(marker.id) || authoringPuzzle();
    if (!instance) return;
    // Test exactly what is on screen now, including unsaved collision and layout
    // edits. Set Start is still the explicit action that makes those edits the
    // permanent authored default.
    settleGameplayCrates();
    puzzleTestSnapshot = deepCopy(currentPuzzleSetupSnapshot(instance));
    puzzleTestInventorySnapshot = inventorySnapshot();
    applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:false, clearDirty:false });
    puzzleTestMarkerId = instance.id;
    puzzleTestMode = true;
    setEditMode(false);
    positionPlayerAtPuzzleEntry(instance);
    hintEl.textContent = 'Puzzle test · using the current setup · Reset restarts this test';
    hintEl.classList.remove('hidden');
    updatePuzzlePanel();
  }

  function backToPuzzleSetup() {
    const instance = authoringPuzzle();
    const returnMarkerId = puzzleTestMarkerId || instance?.id || null;
    puzzleTestMode = false;
    if (puzzleTestInventorySnapshot) restoreInventory(puzzleTestInventorySnapshot);
    puzzleTestInventorySnapshot = null;
    setInventoryOpen(false);
    if (instance && puzzleTestSnapshot) {
      applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:true, clearDirty:false });
      camera.x = instance.marker.x - character.screenOffsetX;
      previousCameraX = camera.x;
      character.x = camera.x + character.screenOffsetX;
      character.y = playSurfaceYAt(character.x);
    }
    puzzleTestSnapshot = null;
    puzzleTestMarkerId = null;
    setEditMode(true);
    editorScope = 'puzzle';
    choosePuzzleForEditing(returnMarkerId, false);
    updatePuzzlePanel();
  }

  function setEditMode(on) {
    if (PLAYER_MODE && on) return;
    if (on) setInventoryOpen(false);
    if (on && !editorPuzzlePackPinned) { ensurePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = true; }
    if (!on && editorPuzzlePackPinned) { releasePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = false; }
    if (on && interactionState) {
      if (interactionState.type === 'pickup') interactionState.object.carried = false;
      else completeDrop();
      interactionState = null;
    }
    if (on && carriedObject) dropCarriedImmediate();
    if (!on) { collisionEditMode = false; collisionHandleIndex = -1; socketPlacementPiece = null; cameraEditMode = false; setQuickNavOpen(false); }
    editMode = !!on;
    if (!editMode && !puzzleTestMode && puzzleWorkshopIsolated) savePuzzleWorkshopState(editorPuzzleMarkerId);
    if (editMode && !puzzleTestMode && !editorPuzzleMarkerId) editorScope = 'environment';
    document.body.classList.toggle('sidescroll-editing', editMode);
    if (editBtn) {
      editBtn.setAttribute('aria-pressed', String(editMode));
      editBtn.textContent = puzzleTestMode ? 'Setup' : (editMode ? 'Done' : 'Edit');
    }
    if (playControls) playControls.hidden = editMode;
    if (secondaryControls) secondaryControls.hidden = editMode;
    if (editorControls) editorControls.hidden = true;
    if (!editMode) {
      selectedObject = null;
      selectionCycleInfo = null;
      editorTapState = null;
      addAssetType = null;
      updatePlacementModeUi();
      setAssetPaletteOpen(false);
      setDriveAxis(0);
      // If a crate has just been positioned underneath the character, enter
      // Play mode standing on its top rather than intersecting it.
      const support = platformUnder(camera.x + character.screenOffsetX + colliderWorld().offsetX, Infinity);
      if (support) { jumpOffset = support.offset; standingOnObject = support.obj; }
      else if (!jumping) { jumpOffset = 0; standingOnObject = null; }
    } else {
      setDriveAxis(0);
      jumping = false;
      jumpOffset = 0;
      jumpVelocity = 0;
      standingOnObject = null;
      hintEl.classList.remove('hidden');
    }
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
    updatePuzzlePanel();
  }

  function defaultAssetHeight(name) {
    const info = editorAssetInfo.get(name);
    if (Number.isFinite(info?.defaultHeight)) return info.defaultHeight;
    if (name === 'crate') return 0.88;
    if (name.startsWith('tree')) return 8.2;
    if (name === 'ground09' || name === 'ground04' || name === 'ground07') return 0.88;
    return 0.82;
  }

  function createUserObject(type, point, { selectAfter = true } = {}) {
    const h = defaultAssetHeight(type);
    const w = h * (assetAspect[type] || 1);
    const info = editorAssetInfo.get(type) || { category:'dressing', gameplayType:null };
    const puzzleInstance = editMode && editorScope === 'puzzle' ? selectedPuzzleInstance() : null;
    const puzzleObjectId = puzzleInstance ? `authored-${Date.now().toString(36)}-${++userSceneCounter}` : null;
    const id = puzzleInstance ? `puzzle-${puzzleInstance.id}-${puzzleObjectId}` : `user-${Date.now().toString(36)}-${++userSceneCounter}`;
    const collection = info.category === 'gameplay' ? frontOccluders : targetCollectionForZ(point.z);
    const behaviour = assetBehaviours(type);
    const gameplayCollision = info.collision
      ? cloneCollision(info.collision)
      : behaviourCollisionFor(type, w, h, null);
    if (gameplayCollision && behaviour.stackable) gameplayCollision.height = STACK_ITEM_HEIGHT;
    const defaultGameLayerLocked = typeof info.gameplayLayerLocked === 'boolean' ? info.gameplayLayerLocked : info.category === 'gameplay';
    const placementZ = info.category === 'gameplay' && defaultGameLayerLocked ? pathZ : point.z;
    const obj = addObject(collection, type, point.x, placementZ, w, h, {
      id, userAdded:!puzzleInstance, baseSx:w, baseSy:h,
      y:info.category === 'gameplay' && defaultGameLayerLocked ? playSurfaceYAt(point.x) : pathGroundYAt(point.x, point.z),
      shade:1, opacity:.99, layer:classifyLayer(placementZ),
      category:info.category || 'dressing', gameplayType:info.gameplayType || null,
      collision:gameplayCollision, gameplayLayerLocked:defaultGameLayerLocked,
      wrap:!puzzleInstance, puzzleInstanceId:puzzleInstance?.id || null, puzzleObjectId
    });
    if (puzzleInstance) puzzleInstance.objects.push(obj);
    if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, obj.x, obj.z);
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    recordObjectEdit(obj);
    if (selectAfter) selectObject(obj);
    return obj;
  }

  function duplicateSelected() {
    if (!selectedObject || selectedObject.deleted) return;
    const point = { x:selectedObject.x + 0.85, z:selectedObject.gameplayLayerLocked ? pathZ : selectedObject.z + 0.18 };
    const puzzleInstance = selectedObject.puzzleInstanceId ? activePuzzleInstances.get(selectedObject.puzzleInstanceId) : null;
    const puzzleObjectId = puzzleInstance ? `authored-${Date.now().toString(36)}-${++userSceneCounter}` : null;
    const id = puzzleInstance ? `puzzle-${puzzleInstance.id}-${puzzleObjectId}` : `user-${Date.now().toString(36)}-${++userSceneCounter}`;
    const collection = selectedObject.category === 'gameplay' ? frontOccluders : targetCollectionForZ(point.z);
    const obj = addObject(collection, selectedObject.assetName, point.x, point.z, selectedObject.sx, selectedObject.sy, {
      id, userAdded:!puzzleInstance, baseSx:selectedObject.baseSx || selectedObject.sx, baseSy:selectedObject.baseSy || selectedObject.sy,
      y:selectedObject.category === 'gameplay' ? playSurfaceYAt(point.x) : pathGroundYAt(point.x, point.z), shade:selectedObject.shade, opacity:selectedObject.opacity,
      flip:selectedObject.flip, layer:classifyLayer(point.z), collision:selectedObject.collision ? cloneCollision(selectedObject.collision) : null,
      category:selectedObject.category || 'dressing', gameplayType:selectedObject.gameplayType || null, gameplayLayerLocked:!!selectedObject.gameplayLayerLocked,
      wrap:!puzzleInstance, puzzleInstanceId:puzzleInstance?.id || null, puzzleObjectId,
      sockets:Array.isArray(selectedObject.sockets) ? selectedObject.sockets.map(socket => ({ ...socket })) : [], socketedTo:null
    });
    if (puzzleInstance) puzzleInstance.objects.push(obj);
    if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, obj.x, obj.z);
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    recordObjectEdit(obj);
    selectObject(obj);
  }

  function scaleSelected(multiplier) {
    if (!selectedObject || selectedObject.deleted) return;
    const next = Rig.clamp((selectedObject.sy * multiplier), 0.18, selectedObject.assetName.startsWith('tree') ? 24 : (selectedObject.assetName === 'crate' ? 3.0 : 5.0));
    const ratio = next / Math.max(0.001, selectedObject.sy);
    selectedObject.sy = next;
    selectedObject.sx *= ratio;
    if (selectedObject.collision) {
      if (!selectedObject.collisionOverride) {
        selectedObject.collision = behaviourCollisionFor(selectedObject.assetName, selectedObject.sx, selectedObject.sy, null);
      } else {
        selectedObject.collision.halfWidth *= ratio;
        selectedObject.collision.height = isGameplayCrate(selectedObject)
          ? STACK_ITEM_HEIGHT
          : selectedObject.collision.height * ratio;
        selectedObject.collision.depth *= ratio;
      }
    }
    selectedObject.y = selectedObject.category === 'gameplay'
      ? restYForGameplayObject(selectedObject)
      : pathGroundYAt(selectedObject.x, selectedObject.z);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    recordObjectEdit(selectedObject);
    updateEditorButtons();
  }

  function removeSelectedCollision() {
    if (!selectedObject || selectedObject.deleted || !selectedObject.collision) return;
    selectedObject.collision = null;
    selectedObject.collisionOverride = true;
    collisionEditMode = false;
    collisionHandleIndex = -1;
    recordObjectEdit(selectedObject);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    updateEditorButtons();
    updatePuzzleObjectList();
    hintEl.textContent = 'Collision removed';
    hintEl.classList.remove('hidden');
  }

  function toggleSelectedCollision() {
    if (!selectedObject || selectedObject.deleted) return;
    if (!selectedObject.collision) {
      selectedObject.collisionOverride = true;
      selectedObject.collision = {
        halfWidth: Math.max(0.18, selectedObject.sx * (selectedObject.category === 'gameplay' ? 0.43 : 0.34)),
        height: Math.max(0.24, selectedObject.sy * (selectedObject.category === 'gameplay' ? CRATE_COLLISION_HEIGHT_FACTOR : 0.66)),
        depth: Math.max(0.42, Math.min(1.15, selectedObject.sx * 0.42)),
        platform: selectedObject.category === 'gameplay' && objectHasBehaviour(selectedObject, 'supportSurface'),
        points: defaultCollisionPoints(),
        behaviourGenerated: false
      };
      collisionEditMode = true;
      hintEl.textContent = 'Collision added · drag the orange corner handles to fit the shape';
      hintEl.classList.remove('hidden');
    } else {
      selectedObject.collisionOverride = true;
      selectedObject.collision.points = normalisedCollisionPoints(selectedObject.collision).map(point => ({ ...point }));
      collisionEditMode = !collisionEditMode;
      hintEl.textContent = collisionEditMode
        ? 'Collision edit mode · drag the orange corner handles'
        : 'Collision edit mode off';
      hintEl.classList.remove('hidden');
    }
    recordObjectEdit(selectedObject);
    updateEditorButtons();
  }

  function toggleSelectedGameplayLayer() {
    if (!selectedObject || selectedObject.deleted || selectedObject.category !== 'gameplay') return;
    selectedObject.gameplayLayerLocked = !selectedObject.gameplayLayerLocked;
    if (selectedObject.gameplayLayerLocked) {
      selectedObject.z = pathZ;
      selectedObject.y = restYForGameplayObject(selectedObject);
      moveObjectToCorrectCollection(selectedObject);
      sortSceneCollections();
    }
    recordObjectEdit(selectedObject);
    updateEditorButtons();
    hintEl.textContent = selectedObject.gameplayLayerLocked
      ? 'Gameplay layer locked · this object will stay interactive with the character'
      : 'Gameplay layer unlocked · drag freely in depth';
    hintEl.classList.remove('hidden');
  }

  function deleteSelected() {
    if (!selectedObject || selectedObject.deleted) return;
    const wasGameplay = selectedObject.category === 'gameplay';
    selectedObject.deleted = true;
    recordObjectEdit(selectedObject);
    if (wasGameplay) settleGameplayCrates();
    selectedObject = null;
    updateEditorButtons();
    updatePuzzleObjectList();
    updatePuzzlePanel();
  }

  function setAssetPaletteOpen(open, { clearPending = false, keepSetup = false } = {}) {
    if (!editorPalette) return;
    editorPalette.hidden = !open;
    document.body.classList.toggle('sidescroll-assets-open', !!open);
    if (!open && clearPending) addAssetType = null;
    if (!open) {
      assetSetupName = null;
      collectibleSetupItemId = null;
      if (assetSetupEl) assetSetupEl.hidden = true;
      if (collectibleSetupEl) collectibleSetupEl.hidden = true;
      if (editorAssetsEl) editorAssetsEl.hidden = false;
      return;
    }
    if (!keepSetup) showAssetBrowser();
  }

  function updateAssetPaletteState() {
    if (!editorAssetsEl) return;
    editorAssetsEl.querySelectorAll('.sidescroll-editor-asset').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.asset === addAssetType);
    });
  }

  function buildAssetPalette() {
    if (!editorAssetsEl) return;
    if (editorPaletteTitle) editorPaletteTitle.textContent = puzzleEnvironmentPlacementMode
      ? 'Puzzle Dressing'
      : (editorScope === 'puzzle' ? 'Puzzle Assets' : 'Environment Assets');
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = puzzleEnvironmentPlacementMode
      ? 'Choose environment art to attach to this puzzle · it ignores the exclusion zone'
      : (editorScope === 'puzzle'
          ? 'Tap an asset to place it · Setup edits reusable behaviours and collectables'
          : 'Choose dressing to place in the environment');
    editorAssetsEl.innerHTML = '';
    const allowedPuzzleAssets = editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode ? puzzleAssetNamesFor(editorPuzzleMarkerId) : null;
    for (const group of editorAssetGroups) {
      const wantedScope = puzzleEnvironmentPlacementMode ? 'environment' : editorScope;
      if (group.scope !== wantedScope) continue;
      const items = group.items.filter(info => puzzleEnvironmentPlacementMode || editorScope !== 'puzzle' || !allowedPuzzleAssets?.size || allowedPuzzleAssets.has(info.name));
      if (!items.length) continue;
      const heading = document.createElement('div');
      heading.className = 'sidescroll-editor-asset-group';
      heading.textContent = group.title;
      editorAssetsEl.appendChild(heading);
      for (const info of items) {
        const name = info.name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sidescroll-editor-asset ${info.category === 'gameplay' ? 'gameplay' : 'dressing'}`;
        btn.dataset.asset = name;
        const file = info.image || (name.startsWith('tree')
          ? `sidescroll-tree-${name.slice(-2)}.png`
          : (name.startsWith('ground') ? `sidescroll-ground-${name.slice(-2)}.png` : null));
        if (file) {
          btn.innerHTML = `<span class="sidescroll-asset-thumb"><img src="${file}?v=0.2.85" alt="" loading="eager"></span><small>${info.label}</small>`;
        } else if (name === 'crate') {
          btn.innerHTML = `<span class="sidescroll-crate-thumb" aria-hidden="true"><i></i></span><small>${info.label}</small>`;
        } else {
          btn.innerHTML = `<span class="sidescroll-puzzle-thumb" aria-hidden="true">${info.thumb || '◇'}</span><small>${info.label}</small>`;
        }
        bindEditorPress(btn, () => {
          addAssetType = name;
          selectedObject = null;
          collisionEditMode = false;
          collisionHandleIndex = -1;
          updateAssetPaletteState();
          setAssetPaletteOpen(false);
          updatePlacementModeUi();
          updateEditorButtons();
          updatePuzzlePanel();
          hintEl.textContent = info.category === 'gameplay'
            ? `Placement mode · tap the path to add ${info.label.toLowerCase()} · tap again for another`
            : `Placement mode · tap the ground to add ${info.label.toLowerCase()} · tap again for another`;
          hintEl.classList.remove('hidden');
        });
        if (editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode) {
          const card = document.createElement('div');
          card.className = 'sidescroll-editor-asset-card';
          card.appendChild(btn);
          const tools = document.createElement('div');
          tools.className = 'sidescroll-editor-asset-card-tools';
          const tags = document.createElement('span');
          tags.className = 'sidescroll-editor-asset-tags';
          tags.textContent = behaviourBadgeText(name);
          const setup = document.createElement('button');
          setup.type = 'button';
          setup.className = 'sidescroll-editor-asset-setup';
          setup.textContent = 'SETUP';
          bindEditorPress(setup, () => showAssetSetup(name));
          tools.append(tags, setup);
          card.appendChild(tools);
          editorAssetsEl.appendChild(card);
        } else {
          editorAssetsEl.appendChild(btn);
        }
      }
    }
    if (editorScope === 'puzzle' && !puzzleEnvironmentPlacementMode) {
      const heading = document.createElement('div');
      heading.className = 'sidescroll-editor-asset-group';
      heading.textContent = 'COLLECTABLES';
      editorAssetsEl.appendChild(heading);
      for (const [itemId, def] of Object.entries(INVENTORY_ITEM_DEFS)) {
        const cfg = collectibleConfig(itemId);
        const card = document.createElement('div');
        card.className = 'sidescroll-editor-asset-card sidescroll-collectible-card';
        const face = document.createElement('div');
        face.className = 'sidescroll-editor-asset collectible';
        face.innerHTML = `${inventoryThumbMarkup(def)}<small>${cfg.label || def.label}</small>`;
        card.appendChild(face);
        const tools = document.createElement('div');
        tools.className = 'sidescroll-editor-asset-card-tools';
        const tags = document.createElement('span');
        tags.className = 'sidescroll-editor-asset-tags';
        tags.textContent = `${(Number(cfg.scale) || 1).toFixed(2)}× · ${cfg.spin ? 'SPIN' : 'STATIC'}`;
        const setup = document.createElement('button');
        setup.type = 'button';
        setup.className = 'sidescroll-editor-asset-setup';
        setup.textContent = 'SETUP';
        bindEditorPress(setup, () => showCollectibleSetup(itemId));
        tools.append(tags, setup);
        card.appendChild(tools);
        editorAssetsEl.appendChild(card);
      }
    }
  }


  function puzzleExclusionHandlePositions(instance) {
    if (!instance || !puzzleExclusionEditMode) return [];
    const b = puzzleExclusionWorldBounds(instance.marker);
    const specs = [
      ['center', b.centerX, b.centerZ],
      ['left', b.minX, b.centerZ],
      ['right', b.maxX, b.centerZ],
      ['far', b.centerX, b.minZ],
      ['near', b.centerX, b.maxZ]
    ];
    return specs.map(([kind,x,z]) => {
      const p = projectWorldPoint(x, pathGroundYAt(x,z)+0.055, z);
      return p && { kind, ...p };
    }).filter(Boolean);
  }

  function puzzleExclusionHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || !puzzleExclusionEditMode) return null;
    const instance = selectedPuzzleInstance();
    if (!instance) return null;
    const rect = canvas.getBoundingClientRect();
    const x=clientX-rect.left, y=clientY-rect.top;
    return puzzleExclusionHandlePositions(instance).find(h => Math.hypot(h.x-x,h.y-y) <= 21) || null;
  }

  function drawPuzzleExclusionGuide(ctx, instance) {
    if (!instance || !puzzleExclusionEditMode) return;
    const b = puzzleExclusionWorldBounds(instance.marker);
    const corners = [[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]]
      .map(([x,z]) => projectWorldPoint(x,pathGroundYAt(x,z)+0.035,z));
    if (corners.some(p=>!p)) return;
    ctx.save();
    ctx.fillStyle = b.enabled ? 'rgba(83,178,205,.18)' : 'rgba(120,130,135,.10)';
    ctx.strokeStyle = b.enabled ? 'rgba(117,220,241,.96)' : 'rgba(160,170,174,.72)';
    ctx.lineWidth=2; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.moveTo(corners[0].x,corners[0].y);
    for(let i=1;i<corners.length;i++) ctx.lineTo(corners[i].x,corners[i].y);
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    for(const h of puzzleExclusionHandlePositions(instance)){
      ctx.beginPath(); ctx.arc(h.x,h.y,h.kind==='center'?8:7,0,Math.PI*2);
      ctx.fillStyle=h.kind==='center'?'#d9f7fb':'#7bd5e8'; ctx.fill();
      ctx.strokeStyle='#254850'; ctx.lineWidth=1.5; ctx.stroke();
    }
    const label=`EXCLUSION · ${b.width.toFixed(1)} × ${b.depth.toFixed(1)}m`;
    const c=projectWorldPoint(b.centerX,pathGroundYAt(b.centerX,b.centerZ)+0.1,b.centerZ);
    if(c){ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,c.x-tw*.5));const ly=Math.max(48,c.y-34);ctx.fillStyle='rgba(23,32,38,.86)';ctx.fillRect(lx,ly,tw,20);ctx.fillStyle='#d9f7fb';ctx.fillText(label,lx+7,ly+14);}
    ctx.restore();
  }

  function puzzleBoundHandlePositions(instance) {
    if (!instance) return [];
    const b = puzzleBounds(instance);
    const left = projectWorldPoint(b.minX, playSurfaceYAt(b.minX)+0.04, pathZ);
    const right = projectWorldPoint(b.maxX, playSurfaceYAt(b.maxX)+0.04, pathZ);
    return [left && { side:'left', ...left }, right && { side:'right', ...right }].filter(Boolean);
  }

  function puzzleBoundHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle') return null;
    const instance = selectedPuzzleInstance();
    if (!instance) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    return puzzleBoundHandlePositions(instance).find(handle => Math.hypot(handle.x-x, handle.y-y) <= 18) || null;
  }

  function puzzleMarkerHandlePosition(instance) {
    if (!instance) return null;
    return projectWorldPoint(instance.marker.x, playSurfaceYAt(instance.marker.x)+0.12, pathZ);
  }

  function puzzleMarkerHandleAt(clientX, clientY) {
    if (!editMode || editorScope !== 'puzzle' || puzzleBrowserMode !== 'scene') return null;
    const instance = selectedPuzzleInstance();
    const mark = puzzleMarkerHandlePosition(instance);
    if (!mark) return null;
    const rect = canvas.getBoundingClientRect();
    return Math.hypot(mark.x - (clientX-rect.left), mark.y - (clientY-rect.top)) <= 20 ? mark : null;
  }

  function drawPuzzleEditorGuides(ctx) {
    if (!editMode || editorScope !== 'puzzle') return;
    const instance = selectedPuzzleInstance();
    if (!instance) return;
    drawPuzzleExclusionGuide(ctx, instance);
    const b = puzzleBounds(instance);
    const left = projectWorldPoint(b.minX, playSurfaceYAt(b.minX)+0.04, pathZ);
    const right = projectWorldPoint(b.maxX, playSurfaceYAt(b.maxX)+0.04, pathZ);
    const mark = projectWorldPoint(instance.marker.x, playSurfaceYAt(instance.marker.x)+0.12, pathZ);
    if (!left || !right || !mark) return;
    ctx.save();
    ctx.strokeStyle='rgba(240,205,127,.96)';ctx.fillStyle='rgba(23,32,38,.82)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();ctx.setLineDash([]);
    for (const handle of [left,right]) {
      ctx.beginPath();ctx.arc(handle.x,handle.y,7,0,Math.PI*2);ctx.fillStyle='#f0cd7f';ctx.fill();ctx.strokeStyle='#493d28';ctx.lineWidth=1.5;ctx.stroke();
    }
    ctx.beginPath();ctx.arc(mark.x,mark.y,8,0,Math.PI*2);ctx.fillStyle='#f5e6b7';ctx.fill();ctx.strokeStyle='#493d28';ctx.lineWidth=1.5;ctx.stroke();
    const rel=currentPuzzleBoundsRelative(instance.marker);
    const label=`${instance.def.label || instance.marker.group} · BOUNDS ${(rel.maxX-rel.minX).toFixed(1)}m`;
    ctx.font='800 10px -apple-system,BlinkMacSystemFont,sans-serif';
    const tw=ctx.measureText(label).width+14;const lx=Math.max(5,Math.min(ctx.canvas.clientWidth-tw-5,mark.x-tw*.5));const ly=Math.max(48,mark.y-31);
    ctx.fillStyle='rgba(23,32,38,.82)';ctx.fillRect(lx,ly,tw,20);ctx.fillStyle='#f4e4bf';ctx.fillText(label,lx+7,ly+14);
    ctx.restore();
  }

  function projectWorldPolygon(points, z = pathZ) {
    return points.map(point => projectWorldPoint(point.x, point.y, z)).filter(Boolean);
  }

  function drawCollisionDebugOverlay(ctx) {
    ctx.save();
    for (const obj of collisionObjects()) {
      const poly = collisionScreenPolygon(obj);
      if (poly.length < 3) continue;
      ctx.fillStyle = obj.collision?.platform ? 'rgba(235,173,86,.13)' : 'rgba(226,112,92,.10)';
      ctx.strokeStyle = obj.collision?.platform ? 'rgba(239,184,102,.92)' : 'rgba(233,118,101,.88)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash(obj.collision?.platform ? [] : [5,3]);
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const rootX = camera.x + character.screenOffsetX;
    const capsule = colliderWorld();
    const centreX = rootX + capsule.offsetX;
    const baseY = playSurfaceYAt(rootX) + Math.max(0, jumpOffset) + capsule.bottom;
    const radius = Math.min(capsule.radius, capsule.height * 0.5);
    const capsulePts = [];
    const bottomCentre = baseY + radius;
    const topCentre = baseY + capsule.height - radius;
    for (let i = 0; i <= 10; i += 1) {
      const a = Math.PI + (Math.PI * i / 10);
      capsulePts.push({ x: centreX + Math.cos(a) * radius, y: bottomCentre + Math.sin(a) * radius });
    }
    for (let i = 0; i <= 10; i += 1) {
      const a = Math.PI * i / 10;
      capsulePts.push({ x: centreX + Math.cos(a) * radius, y: topCentre + Math.sin(a) * radius });
    }
    const capsuleScreen = projectWorldPolygon(capsulePts, pathZ);
    if (capsuleScreen.length >= 3) {
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(90,205,215,.10)';
      ctx.strokeStyle = 'rgba(108,224,231,.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(capsuleScreen[0].x, capsuleScreen[0].y);
      for (let i = 1; i < capsuleScreen.length; i += 1) ctx.lineTo(capsuleScreen[i].x, capsuleScreen[i].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    if (carriedObject) {
      const rect = carriedCollisionRectAtRoot(rootX, jumpOffset, character.lastFacing >= 0 ? 1 : -1, carriedObject);
      const rectPoly = rect ? projectWorldPolygon([
        {x:rect.minX,y:rect.minY},{x:rect.maxX,y:rect.minY},
        {x:rect.maxX,y:rect.maxY},{x:rect.minX,y:rect.maxY}
      ], carriedObject.gameplayLayerLocked === false ? carriedObject.z : pathZ) : [];
      if (rectPoly.length === 4) {
        ctx.fillStyle = 'rgba(90,142,235,.12)';
        ctx.strokeStyle = 'rgba(112,166,255,.98)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();ctx.moveTo(rectPoly[0].x,rectPoly[0].y);
        for (let i=1;i<rectPoly.length;i+=1) ctx.lineTo(rectPoly[i].x,rectPoly[i].y);
        ctx.closePath();ctx.fill();ctx.stroke();
      }

      const facing = character.lastFacing >= 0 ? 1 : -1;
      const searchEndX = rootX + facing * STACK_SEARCH_RADIUS;
      const searchY = playSurfaceYAt(rootX) + 0.16;
      const a = projectWorldPoint(rootX, searchY, pathZ);
      const b = projectWorldPoint(searchEndX, playSurfaceYAt(searchEndX) + 0.16, pathZ);
      if (a && b) {
        ctx.strokeStyle = 'rgba(211,135,242,.95)';
        ctx.lineWidth = 2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      const target = dropTargetForCarried(rootX);
      if (target?.socket) {
        const p = projectWorldPoint(target.x, target.y + carriedObject.sy * 0.5, target.z);
        if (p) {
          ctx.setLineDash([]);
          ctx.strokeStyle='rgba(109,226,205,.98)';ctx.fillStyle='rgba(109,226,205,.16)';ctx.lineWidth=2.5;
          ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();ctx.stroke();
          ctx.beginPath();ctx.moveTo(p.x-16,p.y);ctx.lineTo(p.x+16,p.y);ctx.moveTo(p.x,p.y-16);ctx.lineTo(p.x,p.y+16);ctx.stroke();
          ctx.fillStyle='rgba(109,226,205,.98)';ctx.font='800 9px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillText(`SOCKET ${socketLabelForPiece(carriedObject)}`, p.x + 18, p.y - 9);
        }
      } else if (target?.stack) {
        const preview = placedCollisionRect(carriedObject, target.x, target.y);
        const previewPoly = preview ? projectWorldPolygon([
          {x:preview.minX,y:preview.minY},{x:preview.maxX,y:preview.minY},
          {x:preview.maxX,y:preview.maxY},{x:preview.minX,y:preview.maxY}
        ], target.z) : [];
        if (previewPoly.length === 4) {
          ctx.setLineDash([5,4]);
          ctx.fillStyle = target.valid ? 'rgba(116,224,151,.10)' : 'rgba(245,112,112,.10)';
          ctx.strokeStyle = target.valid ? 'rgba(116,224,151,.92)' : 'rgba(245,112,112,.92)';
          ctx.lineWidth = 2;
          ctx.beginPath();ctx.moveTo(previewPoly[0].x,previewPoly[0].y);
          for (let i=1;i<previewPoly.length;i+=1) ctx.lineTo(previewPoly[i].x,previewPoly[i].y);
          ctx.closePath();ctx.fill();ctx.stroke();
        }
        const p = projectWorldPoint(target.x, target.y + 0.06, target.z);
        if (p) {
          ctx.setLineDash([]);
          ctx.strokeStyle = target.valid ? 'rgba(116,224,151,.98)' : 'rgba(245,112,112,.98)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();ctx.moveTo(p.x-13,p.y);ctx.lineTo(p.x+13,p.y);ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x,p.y+13);ctx.stroke();
          ctx.fillStyle = target.valid ? 'rgba(116,224,151,.98)' : 'rgba(245,112,112,.98)';
          ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillText(`STACK ${target.stack.members.length + 1}`, p.x + 16, p.y - 8);
        }
      }
    }

    ctx.setLineDash([]);
    ctx.font = '800 9px -apple-system,BlinkMacSystemFont,sans-serif';
    const label = `COLLISION · stack ${STACK_ITEM_HEIGHT.toFixed(2)} · carry ${CARRY_BOTTOM.toFixed(2)} · stack search ${STACK_SEARCH_RADIUS.toFixed(2)} · socket ${SOCKET_SEARCH_RADIUS.toFixed(2)}`;
    const tw = ctx.measureText(label).width + 16;
    const x = Math.max(8, (ctx.canvas.clientWidth - tw) * 0.5);
    const y = 48;
    ctx.fillStyle = 'rgba(18,27,31,.78)';
    ctx.fillRect(x, y, tw, 22);
    ctx.fillStyle = 'rgba(240,246,245,.96)';
    ctx.fillText(label, x + 8, y + 15);
    ctx.restore();
  }

  function drawAuthoredSockets(ctx) {
    if (!editMode || editorScope !== 'puzzle') return;
    const instance = selectedPuzzleInstance();
    if (!instance) return;
    ctx.save();
    ctx.font = '900 9px -apple-system,BlinkMacSystemFont,sans-serif';
    for (const host of socketHostsForInstance(instance)) {
      for (const socket of host.sockets || []) {
        const point = socketWorldPosition(host, socket);
        const screen = point ? projectWorldPoint(point.x, point.y, point.z) : null;
        if (!screen) continue;
        const active = !!(socketPlacementPiece && socketMatchesPiece(socket, socketPlacementPiece));
        ctx.fillStyle = active ? 'rgba(255,79,149,.22)' : 'rgba(109,226,205,.18)';
        ctx.strokeStyle = active ? '#ff4f95' : '#6de2cd';
        ctx.lineWidth = active ? 3 : 2;
        ctx.setLineDash(active ? [] : [4,3]);
        ctx.beginPath(); ctx.arc(screen.x, screen.y, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(screen.x-16,screen.y);ctx.lineTo(screen.x+16,screen.y);ctx.moveTo(screen.x,screen.y-16);ctx.lineTo(screen.x,screen.y+16);ctx.stroke();
        const label = socketLabelForPiece(socket.pieceAsset);
        const tw = ctx.measureText(label).width + 10;
        ctx.fillStyle='rgba(20,31,34,.82)';ctx.fillRect(screen.x+14,screen.y-20,tw,17);
        ctx.fillStyle=active ? '#ffd4e5' : '#c9fff5';ctx.fillText(label,screen.x+19,screen.y-8);
      }
    }
    ctx.restore();
  }

  function drawPlayerInteractionHints(ctx) {
    if (!playerHintsEnabled || editMode || puzzleTestMode && false) return;
    ctx.save();
    const dot = (point, strong=false) => {
      if (!point) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, strong ? 5.0 : 4.2, 0, Math.PI*2);
      ctx.fillStyle = strong ? 'rgba(247,238,207,.96)' : 'rgba(247,238,207,.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(38,52,54,.72)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    const rootX = camera.x + character.screenOffsetX;
    if (!carriedObject && !interactionState) {
      const near = nearestActionCrate();
      if (near) {
        const ox = objectXNear(near, rootX);
        dot(projectWorldPoint(ox, near.y + Math.max(0.18, near.sy * 0.28), near.z), true);
      }
    }

    if (carriedObject && !interactionState) {
      const facing = character.lastFacing >= 0 ? 1 : -1;
      const rect = carriedCollisionRectAtRoot(rootX, jumpOffset, facing, carriedObject);
      if (rect) dot(projectWorldPoint((rect.minX+rect.maxX)*0.5, (rect.minY+rect.maxY)*0.5, carriedObject.gameplayLayerLocked === false ? carriedObject.z : pathZ));
      const target = dropTargetForCarried(rootX);
      if (target && target.valid && (target.stack || target.socket)) {
        const targetY = target.socket ? target.y + carriedObject.sy * 0.5 : target.y + 0.06;
        dot(projectWorldPoint(target.x, targetY, target.z), true);
      }
    }
    ctx.restore();
  }

  function drawEditorOverlay() {
    if (!editorOverlayCtx || !editorOverlay) return;
    const ctx = editorOverlayCtx;
    const w = editorOverlay.clientWidth;
    const h = editorOverlay.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (collisionDebugView) drawCollisionDebugOverlay(ctx);
    drawPlayerInteractionHints(ctx);
    if (!editMode) return;
    drawPuzzleEditorGuides(ctx);
    drawAuthoredSockets(ctx);

    // Show authored gameplay collision even when the object itself is partly
    // hidden by foreground dressing. The global collision viewer already draws
    // every collider, so this lighter editor pass is only needed when it is off.
    if (!collisionDebugView) for (const obj of collisionObjects()) {
      if (!editorObjectIsEditable(obj)) continue;
      if (obj === selectedObject) continue;
      const poly = collisionScreenPolygon(obj);
      if (poly.length < 3) continue;
      ctx.save();
      ctx.strokeStyle='rgba(226,161,92,.58)';
      ctx.lineWidth=1.25;
      ctx.setLineDash([3,3]);
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    if (selectedObject && !selectedObject.deleted) {
      const b = objectScreenBounds(selectedObject);
      if (b) {
        ctx.save();
        ctx.strokeStyle = '#ff4f95';
        ctx.lineWidth = 3;
        ctx.setLineDash([7,3]);
        ctx.strokeRect(b.left-4, b.top-4, b.width+8, b.height+8);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(20,31,34,.78)';
        const depthLabel = selectionCycleInfo && selectionCycleInfo.objects.includes(selectedObject) && selectionCycleInfo.objects.length > 1
          ? `  DEPTH ${selectionCycleInfo.objects.indexOf(selectedObject)+1}/${selectionCycleInfo.objects.length}` : '';
        const layerLabel = selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked ? '  GAME LAYER' : '';
        const label = `${selectedObject.assetName}${layerLabel}${depthLabel}  x ${selectedObject.x.toFixed(1)}  z ${selectedObject.z.toFixed(1)}`;
        ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
        const tw = ctx.measureText(label).width + 14;
        const lx = Math.max(4, Math.min(w-tw-4, b.left));
        const ly = Math.max(42, b.top-25);
        ctx.fillRect(lx, ly, tw, 19);
        ctx.fillStyle = '#f2f7f6';
        ctx.fillText(label, lx+7, ly+13);
        ctx.restore();
      }

      if (selectedObject.collision) {
        const poly = collisionScreenPolygon(selectedObject);
        if (poly.length >= 3) {
          ctx.save();
          ctx.fillStyle='rgba(228,164,89,.12)';
          ctx.strokeStyle='#e2a15c';
          ctx.lineWidth=2;
          ctx.setLineDash([4,3]);
          ctx.beginPath();
          ctx.moveTo(poly[0].x, poly[0].y);
          for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (collisionEditMode) {
            ctx.setLineDash([]);
            for (const handle of collisionHandlePositions(selectedObject)) {
              ctx.beginPath();
              ctx.fillStyle = handle.index === collisionHandleIndex ? '#ff4f95' : '#f3c57f';
              ctx.strokeStyle = '#483225';
              ctx.lineWidth = 1.5;
              ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }
    }

    if (socketPlacementPiece) {
      ctx.save();
      ctx.fillStyle='rgba(20,31,34,.80)';
      ctx.font='800 11px -apple-system, BlinkMacSystemFont, sans-serif';
      const text=`SET SOCKET ${socketLabelForPiece(socketPlacementPiece).toUpperCase()} · tap a Socket Host`;
      const tw=ctx.measureText(text).width+18;
      ctx.fillRect((w-tw)/2,52,tw,24);
      ctx.fillStyle='#c9fff5';
      ctx.fillText(text,(w-tw)/2+9,68);
      ctx.restore();
    } else if (addAssetType) {
      ctx.save();
      ctx.fillStyle='rgba(20,31,34,.75)';
      ctx.font='800 11px -apple-system, BlinkMacSystemFont, sans-serif';
      const text=`PLACE ${addAssetType.toUpperCase()} · tap to add · drag to pan`;
      const tw=ctx.measureText(text).width+18;
      ctx.fillRect((w-tw)/2,52,tw,24);
      ctx.fillStyle='#f2f7f6';
      ctx.fillText(text,(w-tw)/2+9,68);
      ctx.restore();
    }
  }

  function wrapX(x, aroundX) {
    return x + Math.round((aroundX - x) / TILE_WIDTH) * TILE_WIDTH;
  }

  function objectXNear(obj, aroundX) {
    return obj?.wrap === false ? obj.x : wrapX(obj.x, aroundX);
  }


  function collisionWorldPoints(obj, aroundX = obj.x) {
    if (!obj?.collision) return [];
    const c = obj.collision;
    const halfWidth = Math.max(0.001, c.halfWidth ?? Math.max(0.18, obj.sx * 0.34));
    const height = Math.max(0.001, c.height ?? Math.max(0.24, obj.sy * 0.66));
    return normalisedCollisionPoints(c).map(point => ({
      x: aroundX + point.x * halfWidth,
      y: obj.y + point.y * height
    }));
  }

  function collisionRectScreenBounds(obj) {
    if (!obj?.collision) return null;
    const c = obj.collision;
    const drawX = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    const points = [
      projectWorldPoint(drawX - c.halfWidth, obj.y, obj.z),
      projectWorldPoint(drawX + c.halfWidth, obj.y, obj.z),
      projectWorldPoint(drawX - c.halfWidth, obj.y + c.height, obj.z),
      projectWorldPoint(drawX + c.halfWidth, obj.y + c.height, obj.z)
    ].filter(Boolean);
    if (points.length < 2) return null;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  function collisionScreenPolygon(obj) {
    const drawX = obj.wrap ? wrapX(obj.x, camera.x) : obj.x;
    return collisionWorldPoints(obj, drawX)
      .map(point => projectWorldPoint(point.x, point.y, obj.z))
      .filter(Boolean);
  }

  function uniqueSorted(values) {
    values.sort((a, b) => a - b);
    return values.filter((value, index) => index === 0 || Math.abs(value - values[index - 1]) > 0.0001);
  }

  function collisionSpanAtY(obj, worldY) {
    const points = collisionWorldPoints(obj, obj.x);
    if (points.length < 2) return null;
    const xs = [];
    const eps = 0.0001;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (Math.abs(a.y - b.y) < eps) {
        if (Math.abs(worldY - a.y) <= eps) xs.push(a.x, b.x);
        continue;
      }
      const minY = Math.min(a.y, b.y) - eps;
      const maxY = Math.max(a.y, b.y) + eps;
      if (worldY < minY || worldY > maxY) continue;
      const t = (worldY - a.y) / (b.y - a.y);
      if (t < -eps || t > 1 + eps) continue;
      xs.push(a.x + (b.x - a.x) * t);
    }
    const vals = uniqueSorted(xs);
    if (!vals.length) return null;
    return { minX: vals[0], maxX: vals[vals.length - 1] };
  }

  function capsuleHalfWidthAtHeight(localY, capsule) {
    if (localY < 0 || localY > capsule.height) return 0;
    const r = Math.min(capsule.radius, capsule.height * 0.5);
    if (localY < r) {
      const dy = r - localY;
      return Math.sqrt(Math.max(0, r*r - dy*dy));
    }
    if (localY > capsule.height - r) {
      const dy = localY - (capsule.height - r);
      return Math.sqrt(Math.max(0, r*r - dy*dy));
    }
    return r;
  }

  function collisionBodyEnvelope(obj, feetY) {
    // A real capsule profile: wider through the torso and rounded at its ends.
    // Environment spans are expanded by the capsule width at each sample.
    const capsule = colliderWorld();
    const sampleCount = 11;
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / (sampleCount - 1);
      const localY = capsule.height * t;
      const y = feetY + capsule.bottom + localY;
      const span = collisionSpanAtY(obj, y);
      if (!span) continue;
      const half = capsuleHalfWidthAtHeight(localY, capsule) + PLAYER_COLLISION_SKIN;
      minX = Math.min(minX, span.minX - half);
      maxX = Math.max(maxX, span.maxX + half);
    }
    return Number.isFinite(minX) && Number.isFinite(maxX) ? { minX, maxX } : null;
  }

  function collisionTopHeightAtX(obj, worldX) {
    const points = collisionWorldPoints(obj, obj.x);
    if (points.length < 2) return -Infinity;
    const ys = [];
    const eps = 0.0001;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (Math.abs(a.x - b.x) < eps) {
        if (Math.abs(worldX - a.x) <= eps) ys.push(a.y, b.y);
        continue;
      }
      const minX = Math.min(a.x, b.x) - eps;
      const maxX = Math.max(a.x, b.x) + eps;
      if (worldX < minX || worldX > maxX) continue;
      const t = (worldX - a.x) / (b.x - a.x);
      if (t < -eps || t > 1 + eps) continue;
      ys.push(a.y + (b.y - a.y) * t);
    }
    const vals = uniqueSorted(ys);
    return vals.length ? vals[vals.length - 1] : -Infinity;
  }

  function collisionHandlePositions(obj) {
    const bounds = collisionRectScreenBounds(obj);
    if (!bounds || !obj?.collision) return [];
    const width = Math.max(1, bounds.right - bounds.left);
    const height = Math.max(1, bounds.bottom - bounds.top);
    return normalisedCollisionPoints(obj.collision).map((point, index) => ({
      index,
      x: bounds.left + ((point.x + 1) * 0.5) * width,
      y: bounds.bottom - point.y * height
    }));
  }

  function collisionObjects() {
    return allSceneObjects().filter(obj => !obj.deleted && !obj.carried && obj.collision);
  }

  function isCarryableObject(obj) {
    return !!obj && !obj.deleted && !obj.carried && obj.category === 'gameplay'
      && (objectHasBehaviour(obj, 'carryable') || obj.gameplayType === 'crate');
  }

  function isGameplayCrate(obj, includeCarried = false) {
    // Kept as the internal stacking helper name for compatibility with the
    // existing movement code. Most physics calls intentionally ignore carried
    // props, but placement intent must still be able to identify the object in
    // the character's hands as stackable.
    return !!obj && !obj.deleted && (includeCarried || !obj.carried) && obj.category === 'gameplay'
      && (objectHasBehaviour(obj, 'stackable') || obj.gameplayType === 'crate');
  }

  function isSupportSurfaceObject(obj) {
    return !!obj && !obj.deleted && !obj.carried && obj.category === 'gameplay' && !!obj.collision
      && (objectHasBehaviour(obj, 'supportSurface') || !!obj.collision.platform);
  }

  function crateHalfWidth(obj) {
    return obj?.collision?.halfWidth ?? Math.max(0.18, (obj?.sx || 0.9) * CRATE_HALF_WIDTH_FACTOR);
  }

  function crateHeight(obj) {
    if (isGameplayCrate(obj)) return STACK_ITEM_HEIGHT;
    return obj?.collision?.height ?? Math.max(0.24, (obj?.sy || 0.88) * CRATE_COLLISION_HEIGHT_FACTOR);
  }


  function carriedCollisionRectAtRoot(rootX, clearanceHeight = jumpOffset, facing = character.lastFacing >= 0 ? 1 : -1, obj = carriedObject) {
    if (!obj) return null;
    const floorY = playSurfaceYAt(rootX) + Math.max(0, clearanceHeight);
    const halfWidth = (obj.collision?.halfWidth ?? crateHalfWidth(obj)) + CARRIED_COLLISION_SKIN;
    const height = Math.max(0.16, obj.collision?.height ?? crateHeight(obj));
    // Match the non-pose carry transform closely enough for gameplay collision;
    // animation bob is intentionally ignored so the collision stays stable.
    const centreX = rootX + facing * CARRY_FORWARD;
    const bottomY = floorY + CHARACTER_SOLE_ART_LOCAL_OFFSET * character.scale + CARRY_BOTTOM;
    return {
      minX: centreX - halfWidth,
      maxX: centreX + halfWidth,
      minY: bottomY + CARRIED_COLLISION_SKIN,
      maxY: bottomY + height - CARRIED_COLLISION_SKIN
    };
  }

  function placedCollisionRect(obj, x, y) {
    if (!obj) return null;
    const halfWidth = (obj.collision?.halfWidth ?? crateHalfWidth(obj)) + CARRIED_COLLISION_SKIN;
    const height = Math.max(0.16, obj.collision?.height ?? crateHeight(obj));
    return {
      minX: x - halfWidth,
      maxX: x + halfWidth,
      minY: y + CARRIED_COLLISION_SKIN,
      maxY: y + height - CARRIED_COLLISION_SKIN
    };
  }

  function rectIntersectsCollisionObject(rect, obstacle) {
    if (!rect || !obstacle?.collision || obstacle.deleted || obstacle.carried) return false;
    const depth = obstacle.collision.depth ?? 0.8;
    if (Math.abs(obstacle.z - pathZ) > depth) return false;
    const samples = 7;
    for (let i = 0; i < samples; i += 1) {
      const t = samples === 1 ? 0.5 : i / (samples - 1);
      const y = Rig.lerp(rect.minY, rect.maxY, t);
      const span = collisionSpanAtY(obstacle, y);
      if (!span) continue;
      if (rect.maxX > span.minX + CARRIED_COLLISION_SKIN && rect.minX < span.maxX - CARRIED_COLLISION_SKIN) return true;
    }
    return false;
  }

  function carriedCollisionBlockedAtCamera(cameraX, clearanceHeight = jumpOffset, facing = character.lastFacing >= 0 ? 1 : -1) {
    if (!carriedObject) return false;
    const rootX = cameraX + character.screenOffsetX;
    const rect = carriedCollisionRectAtRoot(rootX, clearanceHeight, facing, carriedObject);
    for (const obstacle of collisionObjects()) {
      if (obstacle === carriedObject) continue;
      if (rectIntersectsCollisionObject(rect, obstacle)) return true;
    }
    return false;
  }

  function resolveCarriedObjectMove(currentCameraX, proposedCameraX, clearanceHeight) {
    if (!carriedObject || Math.abs(proposedCameraX - currentCameraX) < 0.000001) return proposedCameraX;
    // The held object remains in front of the character even when she backs up,
    // so collision must use facing, not movement direction.
    const facing = character.lastFacing >= 0 ? 1 : -1;
    if (!carriedCollisionBlockedAtCamera(proposedCameraX, clearanceHeight, facing)) return proposedCameraX;

    // If the current pose is already intersecting, never trap the player: allow
    // a retreat away from the carried item's forward side.
    if (carriedCollisionBlockedAtCamera(currentCameraX, clearanceHeight, facing)) {
      const retreatDirection = -facing;
      if (Math.sign(proposedCameraX - currentCameraX) === retreatDirection) return proposedCameraX;
      return currentCameraX;
    }

    // Binary-search the final few centimetres so contact feels like a solid
    // combined character+item body rather than snapping a whole frame back.
    let safe = currentCameraX;
    let blocked = proposedCameraX;
    for (let i = 0; i < 9; i += 1) {
      const mid = (safe + blocked) * 0.5;
      if (carriedCollisionBlockedAtCamera(mid, clearanceHeight, facing)) blocked = mid;
      else safe = mid;
    }
    return safe;
  }

  function dropTargetIsClear(obj, target, ignoredObjects = null) {
    if (!obj || !target) return false;
    const rect = placedCollisionRect(obj, target.x, target.y);
    for (const obstacle of collisionObjects()) {
      if (obstacle === obj) continue;
      if (ignoredObjects?.has(obstacle)) continue;
      if (rectIntersectsCollisionObject(rect, obstacle)) return false;
    }
    return true;
  }

  function cratesOverlapForStack(a, b) {
    if (!(a.gameplayLayerLocked && b.gameplayLayerLocked) && Math.abs(a.z - b.z) > 0.28) return false;
    const ax = objectXNear(a, b.x);
    const reach = Math.min(crateHalfWidth(a), crateHalfWidth(b)) * 0.92;
    return Math.abs(ax - b.x) <= Math.max(0.16, reach);
  }

  function stackableFitsSupport(obj, support, aroundX) {
    if (!obj || !support || !support.collision) return false;
    const depth = support.collision.depth ?? 0.8;
    if (Math.abs((obj.z ?? pathZ) - support.z) > Math.max(0.34, depth)) return false;
    const half = Math.max(0.08, crateHalfWidth(obj) * 0.72);
    const sampleXs = [aroundX - half, aroundX, aroundX + half];
    const tops = sampleXs.map(x => collisionTopHeightAtX(support, x));
    return tops.every(Number.isFinite) ? Math.min(...tops) : -Infinity;
  }

  function restYForGameplayObject(obj, aroundX = obj.x, settled = null, allowAnySupport = false) {
    const ground = obj?.category === 'gameplay' && obj?.gameplayLayerLocked
      ? playSurfaceYAt(aroundX)
      : pathGroundYAt(aroundX, obj?.z ?? pathZ);
    if (!isGameplayCrate(obj)) return ground;
    let baseY = ground;
    const currentBase = Number.isFinite(obj.y) ? obj.y : baseY;
    const fixedSupports = allSceneObjects().filter(other => other !== obj && isSupportSurfaceObject(other) && !isGameplayCrate(other));
    const supports = settled ? [...fixedSupports, ...settled] : allSceneObjects().filter(other => other !== obj && isSupportSurfaceObject(other));
    for (const other of supports) {
      if (other === obj) continue;
      let top = -Infinity;
      if (isGameplayCrate(other)) {
        // Stackable props use the authored stack column rule rather than a
        // width-fit test. A wide log can sit on a narrow log and vice versa.
        const otherX = objectXNear(other, aroundX);
        const sameDepth = obj.gameplayLayerLocked && other.gameplayLayerLocked
          ? true
          : Math.abs((obj.z ?? pathZ) - other.z) <= 0.34;
        if (sameDepth && Math.abs(otherX - aroundX) <= STACK_COLUMN_ALIGN_TOLERANCE) {
          top = other.y + STACK_ITEM_HEIGHT;
        }
      } else {
        top = stackableFitsSupport(obj, other, aroundX);
      }
      if (!Number.isFinite(top)) continue;
      if (!allowAnySupport && top > currentBase + 0.10) continue;
      if (top > baseY) baseY = top;
    }
    return baseY;
  }

  function settleGameplayCrates() {
    const crates = allSceneObjects().filter(isGameplayCrate).sort((a,b) => a.y - b.y || a.x - b.x);
    const settled = [];
    for (const crate of crates) {
      if (crate.gameplayLayerLocked) crate.z = pathZ;
      if (crate.collision && (crate.collision.behaviourGenerated || crate.gameplayType === 'crate' || objectHasBehaviour(crate, 'stackable'))) {
        crate.collision.halfWidth = Math.max(0.12, crate.sx * CRATE_HALF_WIDTH_FACTOR);
        crate.collision.height = STACK_ITEM_HEIGHT;
      }
      if (crate.collision) crate.collision.platform = !!assetBehaviours(crate.assetName).supportSurface || crate.gameplayType === 'crate';
      crate.y = restYForGameplayObject(crate, crate.x, settled);
      settled.push(crate);
    }
  }

  function platformOffsetFor(obj, characterX) {
    if (!obj?.collision?.platform) return -Infinity;
    const platformTop = collisionTopHeightAtX(obj, characterX);
    if (!Number.isFinite(platformTop)) return -Infinity;
    return platformTop - playSurfaceYAt(characterX);
  }

  function walkableSupportAt(characterX, ceiling = Infinity, direction = 0) {
    // The procedural path is the default terrain surface.  Puzzle/platform
    // polygons can override it when their top surface is reachable.
    let best = { obj:null, offset:0 };
    const capsule = colliderWorld();
    const probe = direction ? direction * capsule.footProbe : 0;
    const sampleXs = direction ? [characterX, characterX + probe] : [characterX];
    for (const obj of collisionObjects()) {
      const c = obj.collision;
      if (!c?.platform) continue;
      const depth = c.depth ?? 0.82;
      if (Math.abs(obj.z - pathZ) > depth) continue;
      for (const x of sampleXs) {
        const offset = platformOffsetFor(obj, x);
        if (!Number.isFinite(offset)) continue;
        if (offset <= ceiling + 0.08 && offset > best.offset) best = { obj, offset };
      }
    }
    return best;
  }

  function platformUnder(characterX, ceiling = Infinity) {
    return walkableSupportAt(characterX, ceiling, 0);
  }

  function platformIsWalkableFrom(obj, proposedX, currentOffset, airborne) {
    if (!obj?.collision?.platform) return false;
    const topOffset = platformOffsetFor(obj, proposedX);
    if (!Number.isFinite(topOffset)) return false;
    const capsule = colliderWorld();
    if (airborne) return currentOffset >= topOffset - PLAYER_COLLISION_SKIN;
    return topOffset <= currentOffset + capsule.stepUp + 0.025;
  }

  function resolveObstacleMove(currentCameraX, proposedCameraX, clearanceHeight, airborne = false) {
    const offset = character.screenOffsetX;
    const capsule = colliderWorld();
    const currentRootX = currentCameraX + offset;
    const proposedRootX = proposedCameraX + offset;
    const currentX = currentRootX + capsule.offsetX;
    const proposedX = proposedRootX + capsule.offsetX;
    const direction = Math.sign(proposedX - currentX);
    if (!direction) return currentCameraX;

    let resolvedCharacterX = proposedX;
    const currentFeetY = playSurfaceYAt(currentRootX) + Math.max(0, clearanceHeight);
    const proposedFeetY = playSurfaceYAt(proposedRootX) + Math.max(0, clearanceHeight);
    const feetY = Math.min(currentFeetY, proposedFeetY);

    for (const obj of collisionObjects()) {
      const c = obj.collision;
      if (!c) continue;
      const depth = c.depth ?? 0.8;
      if (Math.abs(obj.z - pathZ) > depth) continue;

      // A reachable platform surface is terrain, not a wall.  This is what lets
      // the shared capsule walk continuously up authored slopes.
      if (platformIsWalkableFrom(obj, proposedX, clearanceHeight, airborne)) continue;

      const span = collisionBodyEnvelope(obj, feetY);
      if (!span) continue;
      const blockMin = span.minX;
      const blockMax = span.maxX;
      const alreadyOverlapping = currentX > blockMin && currentX < blockMax;
      const blockCentre = (blockMin + blockMax) * 0.5;

      if (direction > 0) {
        const crossesFromLeft = currentX <= blockMin + 0.025 && resolvedCharacterX > blockMin;
        const movingDeeperFromOverlap = alreadyOverlapping && currentX < blockCentre;
        if (crossesFromLeft || movingDeeperFromOverlap) resolvedCharacterX = Math.max(currentX, Math.min(resolvedCharacterX, blockMin));
      } else {
        const crossesFromRight = currentX >= blockMax - 0.025 && resolvedCharacterX < blockMax;
        const movingDeeperFromOverlap = alreadyOverlapping && currentX > blockCentre;
        if (crossesFromRight || movingDeeperFromOverlap) resolvedCharacterX = Math.min(currentX, Math.max(resolvedCharacterX, blockMax));
      }
    }
    return resolvedCharacterX - capsule.offsetX - offset;
  }

  function tintFor(obj) {
    if (debugDepth) return debugTints[obj.layer] || [1, 1, 1];
    if (obj.tint) return obj.tint;
    if (obj.asset) {
      // Preserve the authored texture colour. Previous green-biased tinting
      // made the atlas appear cooler/greener in game than in an image viewer.
      return [obj.shade, obj.shade, obj.shade];
    }
    const base = [0.155, 0.165, 0.172];
    return [base[0] * obj.shade, base[1] * obj.shade, base[2] * obj.shade];
  }

  function drawObjectShadow(obj, view, drawX) {
    // Fixed fallen-tree art now includes its own grounded base treatment.
    // Never draw the old synthetic ellipse shadow, even for saved puzzle states
    // that still contain a legacy `shadow` object.
    if (obj?.assetName === 'fallen-tree') return;
    if (!obj?.shadow) return;
    const shadow = obj.shadow === true ? {} : obj.shadow;
    bindMesh(billboardMesh);
    gl.bindTexture(gl.TEXTURE_2D, textures.softShadow);
    gl.uniformMatrix4fv(loc.model, false, mat4Model(
      drawX + (shadow.xOffset ?? 0),
      playSurfaceYAt(drawX) + (shadow.yOffset ?? 0.04),
      obj.z + (shadow.zOffset ?? 0.03),
      shadow.width ?? Math.max(1.05, obj.sx * 0.72),
      shadow.height ?? Math.max(0.24, obj.sy * 0.16),
      1,
      false
    ));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    gl.uniform3f(loc.tint, 0.16, 0.15, 0.14);
    gl.uniform1f(loc.highlight, 0);
    gl.uniform3f(loc.highlightColor, 0, 0, 0);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, fogSettings.enabled ? (debugDepth ? 0.08 : (shadow.fogAmount ?? (0.28 * fogSettings.amount))) : 0);
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    gl.uniform1f(loc.opacity, shadow.opacity ?? 0.42);
    gl.uniform2f(loc.uvScale, 1, 1);
    gl.uniform2f(loc.uvOffset, 0, 0);
    gl.drawElements(gl.TRIANGLES, billboardMesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function drawObject(obj, view, extra = null) {
    if (obj.deleted || (obj.carried && !extra?.force)) return;
    const drawX = extra?.x ?? (obj.wrap ? wrapX(obj.x, camera.x) : obj.x);
    if (!extra?.force && dressingHiddenByPuzzle(obj, drawX)) return;
    if (!extra?.force) drawObjectShadow(obj, view, drawX);
    bindMesh(obj.mesh);
    gl.bindTexture(gl.TEXTURE_2D, extra?.texture || obj.texture);
    const objectRotation = Number(obj.collectibleAngle) || 0;
    const visualFlip = (obj.assetName || '').startsWith('tree') ? false : obj.flip;
    gl.uniformMatrix4fv(loc.model, false, objectRotation ? mat4ModelRotated(drawX, obj.y, obj.z, obj.sx, obj.sy, obj.sz, objectRotation, visualFlip) : mat4Model(drawX, obj.y, obj.z, obj.sx, obj.sy, obj.sz, visualFlip));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    const tint = tintFor(obj);
    gl.uniform3f(loc.tint, tint[0], tint[1], tint[2]);
    const selectedHighlight = editMode && obj === selectedObject ? 1.0 : 0.0;
    gl.uniform1f(loc.highlight, selectedHighlight);
    gl.uniform3f(loc.highlightColor, 1.0, 0.18, 0.48);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, (!fogSettings.enabled || obj.noFog) ? 0 : (debugDepth ? 0.22 : fogSettings.amount));
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    // Keep the scene fully opaque in Edit mode. Transparency made overlapping
    // foliage impossible to read; selection is now communicated by a bright
    // tint + screen-space frame instead.
    gl.uniform1f(loc.opacity, obj.opacity);
    gl.uniform2f(loc.uvScale, extra?.uvScale?.[0] ?? obj.uvScale?.[0] ?? 1, extra?.uvScale?.[1] ?? obj.uvScale?.[1] ?? 1);
    gl.uniform2f(loc.uvOffset, extra?.uvOffset?.[0] ?? obj.uvOffset?.[0] ?? 0, extra?.uvOffset?.[1] ?? obj.uvOffset?.[1] ?? 0);
    gl.drawElements(gl.TRIANGLES, obj.mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function currentCharacterPhase(isWalking) {
    return isWalking ? locomotionPhase : 0;
  }

  function blendPose(a,b,t){
    if (t <= 0.001) return a;
    if (t >= 0.999) return b;
    const keys=['pelvisY','lean','aFootX','aFootLift','aFootAngle','bFootX','bFootLift','bFootAngle','aHandX','aHandY','bHandX','bHandY','hairAngle','hairBend','travel'];
    const planted = a.planted === b.planted ? a.planted : (t < .34 ? a.planted : (t > .66 ? b.planted : null));
    const out={...Rig.clone(a),name:t<.5?a.name:b.name,key:false,planted};
    keys.forEach(k=>out[k]=Rig.lerp(a[k],b[k],t));
    if(out.planted==='A') out.aFootLift=0;
    if(out.planted==='B') out.bFootLift=0;
    return out;
  }


  function smooth01(t) {
    t = Rig.clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function poseForCarrying(basePose, carryAmount = 1, reachAmount = 0) {
    const p = Rig.clone(basePose);
    const carry = smooth01(carryAmount);
    const reach = smooth01(reachAmount);
    const targetAX = Rig.lerp(0.145, 0.105, reach);
    const targetBX = Rig.lerp(0.215, 0.165, reach);
    const targetAY = Rig.lerp(0.215, 0.345, reach);
    const targetBY = Rig.lerp(0.225, 0.350, reach);
    const armAmount = Math.max(carry, reach);
    p.aHandX = Rig.lerp(p.aHandX, targetAX, armAmount);
    p.bHandX = Rig.lerp(p.bHandX, targetBX, armAmount);
    p.aHandY = Rig.lerp(p.aHandY, targetAY, armAmount);
    p.bHandY = Rig.lerp(p.bHandY, targetBY, armAmount);
    p.pelvisY = Rig.lerp(p.pelvisY, 0.455, reach * 0.72);
    p.lean = Rig.lerp(p.lean, 13 * Math.PI / 180, reach * 0.80);
    p.hairAngle = Rig.lerp(p.hairAngle, 116 * Math.PI / 180, reach * 0.35);
    return p;
  }

  function heldCrateTransform(facing, pose = null) {
    const obj = carriedObject || interactionState?.object;
    const sx = obj ? obj.sx : 0.96;
    const sy = obj ? obj.sy : 0.88;
    let x = character.x + facing * CARRY_FORWARD;
    let y = characterRenderY() + CARRY_BOTTOM;

    // Attach the carried crate to the actual animated hand position rather than
    // to a fixed world height.  That means the box inherits the same pelvis /
    // shoulder rise and fall as the walk cycle instead of appearing to hover
    // while the character bobs behind it.
    if (pose) {
      const g = Rig.geometry(pose);
      const handX = ((g.aW.x + g.bW.x) * 0.5) * character.scale;
      const handY = ((g.aW.y + g.bW.y) * 0.5) * character.scale;
      x = character.x + handX * facing;
      y = characterRenderY() + handY - sy * 0.52;
    }

    return { x, y, z: character.z + CHARACTER_GAMEPLAY_Z_BIAS - 0.0004, sx, sy };
  }

  function interactionCrateTransform(facing, pose = null) {
    if (!interactionState) return carriedObject ? heldCrateTransform(facing, pose) : null;
    const st = interactionState;
    const p = smooth01(st.time / st.duration);
    const held = heldCrateTransform(facing, pose);
    if (st.type === 'pickup') {
      const lift = smooth01(Rig.clamp((p - 0.18) / 0.82, 0, 1));
      return {
        x: Rig.lerp(st.startX, held.x, lift),
        y: Rig.lerp(st.startY, held.y, lift),
        z: Rig.lerp(st.startZ, held.z, lift),
        sx: st.object.sx, sy: st.object.sy
      };
    }
    const settle = smooth01(Rig.clamp((p - 0.05) / 0.95, 0, 1));
    return {
      x: Rig.lerp(held.x, st.targetX, settle),
      y: Rig.lerp(held.y, st.targetY, settle),
      z: Rig.lerp(held.z, st.targetZ, settle),
      sx: st.object.sx, sy: st.object.sy
    };
  }

  function drawCarriedCrate(view, facing, pose = null) {
    const obj = interactionState?.object || carriedObject;
    if (!obj) return;
    const tr = interactionCrateTransform(facing, pose);
    if (!tr) return;
    const temp = {
      ...obj,
      carried: false,
      wrap: false,
      x: tr.x,
      y: tr.y,
      z: tr.z,
      sx: tr.sx,
      sy: tr.sy,
      opacity: 1,
      shade: 1,
      tint: null,
      layer: 'character'
    };
    drawObject(temp, view, { force: true });
  }

  function drawRigPartWebGL(part, view, facing) {
    const mesh = rigPartMeshes[part.name];
    const r = Rig.atlasRect(part.name);
    if (!mesh || !r) return;

    const ax = character.x + part.a.x * character.scale * facing;
    const renderY = characterRenderY();
    const ay = renderY + part.a.y * character.scale;
    const bx = character.x + part.b.x * character.scale * facing;
    const by = renderY + part.b.y * character.scale;
    const dvx = bx - ax, dvy = by - ay;
    const p0x = r.a0[0] * r.w, p0y = r.a0[1] * r.h;
    const p1x = r.a1[0] * r.w, p1y = r.a1[1] * r.h;
    const svx = (p1x - p0x) * facing;
    const svy = -(p1y - p0y);
    const srcLen = Math.hypot(svx, svy) || 1;
    const dstLen = Math.hypot(dvx, dvy) || 1;
    const scale = dstLen / srcLen;
    const rotation = Math.atan2(dvy, dvx) - Math.atan2(svy, svx);

    bindMesh(mesh);
    gl.bindTexture(gl.TEXTURE_2D, textures.rigAtlas);
    const z = character.z + CHARACTER_GAMEPLAY_Z_BIAS + (part.layer - 10) * 0.0009;
    gl.uniformMatrix4fv(loc.model, false, mat4Model2D(ax, ay, z, scale, rotation, facing));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    const tint = debugDepth ? debugTints.character : character.tint;
    gl.uniform3f(loc.tint, tint[0], tint[1], tint[2]);
    gl.uniform1f(loc.highlight, 0);
    gl.uniform3f(loc.highlightColor, 1.0, 0.18, 0.48);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, fogSettings.near);
    gl.uniform1f(loc.fogFar, fogSettings.far);
    gl.uniform1f(loc.fogAmount, fogSettings.enabled ? (debugDepth ? 0.22 : fogSettings.amount) : 0);
    gl.uniform1f(loc.fogCurve, fogSettings.curve);
    gl.uniform1f(loc.opacity, character.opacity * (part.alpha ?? 1));
    gl.uniform2f(loc.uvScale, 1, 1);
    gl.uniform2f(loc.uvOffset, 0, 0);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  function drawRigCharacter(view, isWalking) {
    const phase = currentCharacterPhase(isWalking);
    let pose;
    if (jumping) {
      const jumpPhase = Rig.clamp(jumpTime / JUMP_DURATION, 0, 0.999);
      pose = Rig.sampleFrames(jumpFrames, jumpPhase);
    } else if (isWalking) {
      const walkPose = Rig.sampleFrames(characterFrames, phase);
      const runPose = Rig.sampleFrames(runFrames, phase);
      pose = blendPose(walkPose, runPose, runBlend);
    } else {
      pose = Rig.sampleFrames(characterFrames, 0.02);
    }

    if (carriedObject) pose = poseForCarrying(pose, 1, 0);
    if (interactionState) {
      const q = Rig.clamp(interactionState.time / interactionState.duration, 0, 1);
      if (interactionState.type === 'pickup') {
        const reach = Math.sin(Math.min(1, q) * Math.PI);
        const carry = smooth01(Rig.clamp((q - 0.52) / 0.48, 0, 1));
        pose = poseForCarrying(pose, carry, reach * (1 - carry * 0.65));
      } else {
        const reach = Math.sin(Math.min(1, q) * Math.PI);
        const carry = 1 - smooth01(Rig.clamp((q - 0.58) / 0.42, 0, 1));
        pose = poseForCarrying(pose, carry, reach * 0.95);
      }
    }

    const facing = character.lastFacing >= 0 ? 1 : -1;
    const parts = Rig.partsForPose(pose);
    let crateDrawn = false;
    for (const part of parts) {
      if (!crateDrawn && (carriedObject || interactionState) && part.name === 'near_upper_arm') {
        drawCarriedCrate(view, facing, pose);
        crateDrawn = true;
      }
      drawRigPartWebGL(part, view, facing);
    }
    if (!crateDrawn && (carriedObject || interactionState)) drawCarriedCrate(view, facing, pose);
  }

  function nearestActionCrate() {
    if (carriedObject || interactionState) return null;
    const characterXNow = camera.x + character.screenOffsetX;
    let best = null;
    let bestD = Infinity;
    const seenStacks = new Set();

    const carryables = allSceneObjects().filter(isCarryableObject);

    for (const candidate of carryables) {
      // A lower member of a stack must never be directly pickable.  Do this as
      // a simple spatial "covered by another stackable object" test rather than
      // relying on exact authored layer heights: small terrain offsets and older
      // saved puzzles can otherwise make stackColumnFor() miss the relationship
      // and expose the bottom log again.
      if (isGameplayCrate(candidate)) {
        const candidateX = objectXNear(candidate, characterXNow);
        const candidateDepth = candidate.collision?.depth ?? 0.9;
        const covered = carryables.some(other => {
          if (other === candidate || !isGameplayCrate(other)) return false;
          const otherX = objectXNear(other, candidateX);
          const otherDepth = other.collision?.depth ?? 0.9;
          if (Math.abs(otherX - candidateX) > STACK_COLUMN_ALIGN_TOLERANCE + 0.08) return false;
          if (Math.abs((other.z ?? pathZ) - (candidate.z ?? pathZ)) > Math.max(0.38, Math.min(candidateDepth, otherDepth))) return false;
          const dy = other.y - candidate.y;
          return dy > 0.10 && dy <= STACK_ITEM_HEIGHT * 3.25;
        });
        if (covered) continue;
      }

      let obj = candidate;
      if (isGameplayCrate(candidate)) {
        const anchor = stackBottomFor(candidate, characterXNow);
        const column = stackColumnFor(anchor, characterXNow);
        if (column?.members?.length) {
          const stackKey = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
          if (seenStacks.has(stackKey)) continue;
          seenStacks.add(stackKey);
          const exposed = column.members[column.members.length - 1];
          // Only promote to the computed top when it is genuinely the highest
          // exposed member; otherwise the coverage rule above already protects
          // the stack and this candidate remains the correct target.
          if (isCarryableObject(exposed) && exposed.y >= obj.y) obj = exposed;
        }
      }

      if (!isCarryableObject(obj)) continue;
      if (standingOnObject === obj) continue;
      const depth = obj.collision?.depth ?? 0.9;
      if (Math.abs(obj.z - pathZ) > Math.max(0.95, depth)) continue;
      const ox = objectXNear(obj, characterXNow);
      const centreDistance = Math.abs(ox - characterXNow);
      const characterReach = colliderWorld().radius * 0.72;
      const edgeDistance = Math.max(0, centreDistance - crateHalfWidth(obj) - characterReach);
      // Reach is measured to the exposed top object's edge. Lower members of a
      // stack are deliberately not action targets until the objects above them
      // have been removed.
      if (edgeDistance <= ACTION_RANGE && (edgeDistance < bestD - 0.02 || (Math.abs(edgeDistance - bestD) <= 0.02 && (!best || obj.y > best.y)))) {
        best = obj; bestD = edgeDistance;
      }
    }
    return best;
  }

  function updateActionUI() {
    if (!actionBtn || !actionLabel) return;
    actionBtn.classList.remove('ready', 'carrying');
    if (interactionState) {
      actionLabel.textContent = interactionState.type === 'pickup' ? 'PICKING UP' : 'PUTTING DOWN';
      actionBtn.classList.add('ready');
      return;
    }
    if (carriedObject) {
      actionLabel.textContent = 'PUT DOWN';
      actionBtn.classList.add('carrying');
      return;
    }
    const near = nearestActionCrate();
    if (near) {
      actionLabel.textContent = 'PICK UP';
      actionBtn.classList.add('ready');
    } else {
      actionLabel.textContent = 'ACTION';
    }
  }

  function startPickup(obj) {
    if (!obj || carriedObject || interactionState || jumping) return;
    const characterXNow = camera.x + character.screenOffsetX;

    // Freeze the exact visible transform before changing any gameplay state.
    // Previously we marked the object carried and settled the stack first,
    // which could rewrite its Y to the vacant bottom slot before the pickup
    // interpolation sampled startY. That made the correct top log appear to
    // jump down and then be lifted from the bottom of the stack.
    const pickupStart = {
      x: objectXNear(obj, characterXNow),
      y: obj.y,
      z: obj.z
    };

    obj.carried = true;
    obj.socketedTo = null;
    interactionState = {
      type: 'pickup',
      time: 0,
      duration: PICKUP_DURATION,
      object: obj,
      startX: pickupStart.x,
      startY: pickupStart.y,
      startZ: pickupStart.z
    };
    standingOnObject = null;
    setDriveAxis(0);
    hintEl.textContent = 'Picking up item';
    hintEl.classList.remove('hidden');
  }

  function completePickup() {
    if (!interactionState || interactionState.type !== 'pickup') return;
    carriedObject = interactionState.object;
    carriedObject.carried = true;
    interactionState = null;
    // Settle what remains only after the lifted object has finished leaving the
    // stack, so the pickup animation always begins from the object's true slot.
    settleGameplayCrates();
    hintEl.textContent = 'Carrying · ACTION puts the item down';
    hintEl.classList.remove('hidden');
  }

  function stackBottomFor(candidate, aroundX, ignoredObjects = null) {
    if (!isGameplayCrate(candidate)) return candidate;
    let current = candidate;
    let guard = 0;
    while (guard++ < 12) {
      const currentX = objectXNear(current, aroundX);
      let lower = null;
      let lowerTop = -Infinity;
      for (const other of allSceneObjects()) {
        if (other === current || ignoredObjects?.has(other) || !isGameplayCrate(other)) continue;
        const ox = objectXNear(other, currentX);
        if (Math.abs(ox - currentX) > STACK_COLUMN_ALIGN_TOLERANCE) continue;
        if (other.y >= current.y - 0.05) continue;
        const top = other.y + crateHeight(other);
        if (Math.abs(top - current.y) > 0.16) continue;
        if (top > lowerTop) { lower = other; lowerTop = top; }
      }
      if (!lower) break;
      current = lower;
    }
    return current;
  }

  function stackColumnFor(anchor, aroundX, ignoredObjects = null) {
    if (!anchor || !isGameplayCrate(anchor)) return null;
    const anchorX = objectXNear(anchor, aroundX);
    const members = [anchor];
    const used = new Set([anchor]);
    let nextY = anchor.y + STACK_ITEM_HEIGHT;

    // A stack is a vertical column rooted at its bottom object. Build upward
    // one standard layer at a time, rather than asking generic support logic
    // whether a wider carried prop "fits" on the object below it.
    for (let layer = 1; layer < 12; layer += 1) {
      let next = null;
      let bestDelta = Infinity;
      for (const other of allSceneObjects()) {
        if (used.has(other) || other === carriedObject || ignoredObjects?.has(other) || !isGameplayCrate(other)) continue;
        const ox = objectXNear(other, anchorX);
        if (Math.abs(ox - anchorX) > STACK_COLUMN_ALIGN_TOLERANCE) continue;
        const dy = Math.abs(other.y - nextY);
        if (dy > 0.16 || dy >= bestDelta) continue;
        next = other;
        bestDelta = dy;
      }
      if (!next) break;
      used.add(next);
      members.push(next);
      nextY = anchor.y + members.length * STACK_ITEM_HEIGHT;
    }

    return { anchor, x: anchorX, members, topY: anchor.y + members.length * STACK_ITEM_HEIGHT };
  }

  function editorStackTargetFor(obj, desiredX, desiredZ = obj?.z ?? pathZ, ignoredObjects = null) {
    if (!obj || !isGameplayCrate(obj)) return null;
    const ignored = new Set(ignoredObjects || []);
    ignored.add(obj);
    let best = null;
    let bestDistance = EDITOR_STACK_SNAP_RADIUS + 0.0001;
    const seenAnchors = new Set();

    for (const other of allSceneObjects()) {
      if (ignored.has(other) || !isGameplayCrate(other)) continue;
      const sameDepth = obj.gameplayLayerLocked && other.gameplayLayerLocked
        ? true
        : Math.abs((desiredZ ?? pathZ) - other.z) <= 0.34;
      if (!sameDepth) continue;

      const anchor = stackBottomFor(other, desiredX, ignored);
      if (!anchor || ignored.has(anchor)) continue;
      const column = stackColumnFor(anchor, desiredX, ignored);
      if (!column) continue;
      const key = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
      if (seenAnchors.has(key)) continue;
      seenAnchors.add(key);

      const distance = Math.abs(column.x - desiredX);
      if (distance <= EDITOR_STACK_SNAP_RADIUS && distance < bestDistance) {
        bestDistance = distance;
        best = column;
      }
    }
    return best;
  }

  function placeGameplayObjectInEditor(obj, desiredX = obj?.x, desiredZ = obj?.z, ignoredObjects = null) {
    if (!obj || obj.category !== 'gameplay') return null;
    const targetZ = obj.gameplayLayerLocked ? pathZ : desiredZ;
    obj.x = desiredX;
    obj.z = targetZ;

    const stack = editorStackTargetFor(obj, desiredX, targetZ, ignoredObjects);
    if (stack) {
      obj.x = stack.x;
      obj.z = obj.gameplayLayerLocked ? pathZ : stack.anchor.z;
      obj.y = stack.topY;
      return stack;
    }

    // Outside a stack snap, retain the existing editor behaviour for fixed
    // support surfaces such as the fallen tree/platform collision.
    obj.y = restYForGameplayObject(obj, obj.x, null, true);
    return null;
  }

  function socketOccupied(host, socket, ignoredPiece = null) {
    if (!host || !socket) return false;
    return allSceneObjects().some(obj => obj !== ignoredPiece && !obj.deleted && obj.socketedTo
      && obj.socketedTo.hostObjectId === host.id && obj.socketedTo.socketId === socket.id);
  }

  function socketTargetNear(rootX, facing) {
    if (!carriedObject || !objectHasBehaviour(carriedObject, 'socketPiece')) return null;
    let best = null;
    let bestForward = Infinity;
    for (const host of allSceneObjects()) {
      if (host.deleted || !objectHasBehaviour(host, 'socketHost') || !Array.isArray(host.sockets)) continue;
      // Socket links are puzzle-local: a piece cannot accidentally snap into a
      // similarly named socket belonging to another streamed puzzle instance.
      if (carriedObject.puzzleInstanceId && host.puzzleInstanceId !== carriedObject.puzzleInstanceId) continue;
      for (const socket of host.sockets) {
        if (!socketMatchesPiece(socket, carriedObject)) continue;
        if (socketOccupied(host, socket, carriedObject)) continue;
        const point = socketWorldPosition(host, socket);
        if (!point) continue;
        const forward = (point.x - rootX) * facing;
        if (forward < -0.12 || forward > SOCKET_SEARCH_RADIUS) continue;
        if (forward < bestForward) {
          bestForward = forward;
          best = {
            host,
            socket,
            x:point.x,
            y:point.y - carriedObject.sy * 0.5,
            z:point.z,
            forward,
            valid:true
          };
        }
      }
    }
    return best;
  }

  function stackTargetNear(rootX, facing) {
    // carriedObject.carried is true by definition. Explicitly include it here;
    // otherwise stack search exits before examining any nearby support and the
    // old generic ground-placement path accidentally decides the result.
    if (!carriedObject || !isGameplayCrate(carriedObject, true)) return null;
    let best = null;
    let bestForward = Infinity;
    const seenAnchors = new Set();
    for (const other of allSceneObjects()) {
      if (other === carriedObject || !isGameplayCrate(other)) continue;
      const ox = objectXNear(other, rootX);
      const forward = (ox - rootX) * facing;
      if (forward < 0.05 || forward > STACK_SEARCH_RADIUS) continue;
      const anchor = stackBottomFor(other, rootX);
      const column = stackColumnFor(anchor, rootX);
      if (!column) continue;
      const anchorKey = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
      if (seenAnchors.has(anchorKey)) continue;
      seenAnchors.add(anchorKey);
      const columnForward = (column.x - rootX) * facing;

      // The nearest stack in front of the character is the clearest intent.
      // This prevents a farther log from winning simply because it is nearer
      // the old fixed 0.92-unit ground-drop point.
      if (columnForward < bestForward) {
        bestForward = columnForward;
        best = { ...column, forward: columnForward };
      }
    }
    return best;
  }

  function dropTargetForCarried(rootX = character.x) {
    const facing = character.lastFacing >= 0 ? 1 : -1;
    let x = rootX + facing * 0.92;
    let z = carriedObject?.gameplayLayerLocked === false ? carriedObject.z : pathZ;

    // A compatible authored socket is the strongest placement intent. Socket
    // targets deliberately ignore the normal gameplay-layer lock so a carried
    // piece can move from the path into a wall/side-of-road host.
    const socket = socketTargetNear(rootX, facing);
    const stack = socket ? null : stackTargetNear(rootX, facing);
    if (socket) { x = socket.x; z = socket.z; }
    else if (stack) x = stack.x;

    const temp = carriedObject ? { ...carriedObject, x, z, carried: false } : null;
    if (temp?.collision && isGameplayCrate(temp)) temp.collision = { ...temp.collision, height: STACK_ITEM_HEIGHT };
    const y = socket
      ? socket.y
      : (stack ? stack.topY : (temp ? restYForGameplayObject(temp, x, null, true) : playSurfaceYAt(x)));
    const target = { x, z, y, stack, socket };
    if (socket) target.valid = !!socket.valid;
    else {
      const ignoredStackObjects = stack ? new Set(stack.members) : null;
      target.valid = temp ? dropTargetIsClear(temp, target, ignoredStackObjects) : true;
    }
    return target;
  }

  function beginDropAtTarget(target) {
    interactionState = {
      type: 'drop',
      time: 0,
      duration: DROP_DURATION,
      object: carriedObject,
      targetX: target.x,
      targetY: target.y,
      targetZ: target.z,
      socketMeta: target.socket ? { hostObjectId:target.socket.host.id, socketId:target.socket.socket.id } : null
    };
    setDriveAxis(0);
    hintEl.textContent = 'Putting item down';
    hintEl.classList.remove('hidden');
  }

  function failAutoDropShuffle() {
    autoDropStep = null;
    hintEl.textContent = 'No room to put that down';
    hintEl.classList.remove('hidden');
  }

  function startAutoDropStackAssist(target) {
    if (!carriedObject || autoDropStep || !target?.stack || !target.valid) return false;
    autoDropStep = {
      mode: 'stack',
      facing: character.lastFacing >= 0 ? 1 : -1,
      target: { ...target },
      distance: 0
    };
    setDriveAxis(0);
    hintEl.textContent = 'Placing on stack…';
    hintEl.classList.remove('hidden');
    return true;
  }

  function startAutoDropStepBack() {
    if (!carriedObject || autoDropStep) return false;
    const facing = character.lastFacing >= 0 ? 1 : -1;
    autoDropStep = {
      mode: 'back',
      facing,
      startCameraX: camera.x,
      distance: 0
    };
    setDriveAxis(0);
    hintEl.textContent = 'Making room…';
    hintEl.classList.remove('hidden');
    return true;
  }

  function updateAutoDropShuffle(dt) {
    if (!autoDropStep || !carriedObject) return;

    if (autoDropStep.mode === 'stack') {
      const facing = autoDropStep.facing;
      const target = autoDropStep.target;
      const rootX = camera.x + character.screenOffsetX;
      const forwardGap = (target.x - rootX) * facing;
      if (forwardGap <= STACK_ASSIST_ROOT_GAP + 0.02 || autoDropStep.distance >= STACK_ASSIST_MAX) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      const step = Math.min(0.06, STACK_ASSIST_SPEED * dt, Math.max(0, forwardGap - STACK_ASSIST_ROOT_GAP));
      const desiredCameraX = camera.x + facing * step;
      // During this authored placement step the character body still obeys
      // normal collision. The held prop is allowed to move into the chosen
      // stack column because ACTION has already committed to that placement.
      const bodySafeX = resolveObstacleMove(camera.x, desiredCameraX, jumpOffset, false);
      const moved = Math.abs(bodySafeX - camera.x);
      if (moved < 0.004) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      const capsule = colliderWorld();
      const candidateRootX = bodySafeX + character.screenOffsetX;
      const candidateSupport = walkableSupportAt(
        candidateRootX + capsule.offsetX,
        jumpOffset + capsule.stepUp,
        facing
      );
      if (!candidateSupport || candidateSupport.offset < jumpOffset - capsule.stepDown) {
        autoDropStep = null;
        beginDropAtTarget(target);
        return;
      }

      camera.x = bodySafeX;
      autoDropStep.distance += moved;
      return;
    }

    // Ground placement fallback: as soon as backing up exposes a clear landing
    // spot, stop retreating and put the item down there.
    const rootX = camera.x + character.screenOffsetX;
    const target = dropTargetForCarried(rootX);
    if (target.valid) {
      autoDropStep = null;
      beginDropAtTarget(target);
      return;
    }

    const facing = autoDropStep.facing;
    const step = Math.min(0.055, AUTO_DROP_SHUFFLE_SPEED * dt);
    const desiredCameraX = camera.x - facing * step;
    const bodySafeX = resolveObstacleMove(camera.x, desiredCameraX, jumpOffset, false);
    const combinedSafeX = resolveCarriedObjectMove(camera.x, bodySafeX, jumpOffset);
    const moved = Math.abs(combinedSafeX - camera.x);

    if (moved < 0.004) {
      failAutoDropShuffle();
      return;
    }

    const capsule = colliderWorld();
    const candidateRootX = combinedSafeX + character.screenOffsetX;
    const candidateSupport = walkableSupportAt(
      candidateRootX + capsule.offsetX,
      jumpOffset + capsule.stepUp,
      -facing
    );
    if (!candidateSupport || candidateSupport.offset < jumpOffset - capsule.stepDown) {
      failAutoDropShuffle();
      return;
    }

    camera.x = combinedSafeX;
    autoDropStep.distance += moved;
    if (autoDropStep.distance >= AUTO_DROP_SHUFFLE_MAX) failAutoDropShuffle();
  }

  function startDrop() {
    if (!carriedObject || interactionState || autoDropStep || jumping) return;
    const rootX = camera.x + character.screenOffsetX;
    const target = dropTargetForCarried(rootX);
    if (target.socket) {
      if (!target.valid) {
        hintEl.textContent = 'That socket is already occupied';
        hintEl.classList.remove('hidden');
        return;
      }
      hintEl.textContent = `Placing ${socketLabelForPiece(carriedObject)} in socket…`;
      hintEl.classList.remove('hidden');
      beginDropAtTarget(target);
      return;
    }
    if (target.stack) {
      if (!target.valid) {
        // A recognised stack is an explicit placement intent. Never turn a
        // blocked stack attempt into the unrelated backwards ground-drop move.
        hintEl.textContent = 'No room on that stack';
        hintEl.classList.remove('hidden');
        return;
      }
      const facing = character.lastFacing >= 0 ? 1 : -1;
      const forwardGap = (target.x - rootX) * facing;
      if (forwardGap > STACK_ASSIST_ROOT_GAP + 0.05 && startAutoDropStackAssist(target)) return;
      beginDropAtTarget(target);
      return;
    }
    if (!target.valid) {
      if (!startAutoDropStepBack()) {
        hintEl.textContent = 'No room to put that down';
        hintEl.classList.remove('hidden');
      }
      return;
    }
    beginDropAtTarget(target);
  }

  function completeDrop() {
    if (!interactionState || interactionState.type !== 'drop') return;
    const obj = interactionState.object;
    obj.x = interactionState.targetX;
    obj.z = interactionState.socketMeta ? interactionState.targetZ : (obj.gameplayLayerLocked === false ? interactionState.targetZ : pathZ);
    obj.carried = false;
    obj.y = interactionState.targetY;
    obj.socketedTo = interactionState.socketMeta ? { ...interactionState.socketMeta } : null;
    carriedObject = null;
    interactionState = null;
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    settleGameplayCrates();
    recordObjectEdit(obj);
    hintEl.textContent = 'Item placed';
    hintEl.classList.remove('hidden');
  }

  function dropCarriedImmediate() {
    if (!carriedObject) return;
    const obj = carriedObject;
    let target = dropTargetForCarried();
    if (!target.valid) {
      const facing = character.lastFacing >= 0 ? 1 : -1;
      for (let i = 1; i <= 12 && !target.valid; i += 1) {
        const x = character.x - facing * i * 0.12;
        const z = obj.gameplayLayerLocked === false ? obj.z : pathZ;
        const temp = { ...obj, x, z, carried:false };
        const y = restYForGameplayObject(temp, x, null, true);
        const probe = { x, z, y };
        probe.valid = dropTargetIsClear(temp, probe);
        if (probe.valid) target = probe;
      }
    }
    obj.x = target.x;
    obj.z = target.socket ? target.z : (obj.gameplayLayerLocked === false ? target.z : pathZ);
    obj.carried = false;
    obj.y = target.y;
    obj.socketedTo = target.socket ? { hostObjectId:target.socket.host.id, socketId:target.socket.socket.id } : null;
    carriedObject = null;
    interactionState = null;
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    settleGameplayCrates();
    recordObjectEdit(obj);
  }

  function performAction() {
    if (editMode || inventoryOpen || interactionState || autoDropStep) return;
    if (carriedObject) { startDrop(); return; }
    const obj = nearestActionCrate();
    if (obj) startPickup(obj);
    else {
      hintEl.textContent = 'Move closer to a gameplay object';
      hintEl.classList.remove('hidden');
    }
  }

  function render(now) {
    resize();
    updatePuzzleStreaming(character?.x ?? camera.x);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (autoDropStep) updateAutoDropShuffle(dt);

    if (interactionState) {
      interactionState.time += dt;
      if (interactionState.time >= interactionState.duration) {
        if (interactionState.type === 'pickup') completePickup();
        else completeDrop();
      }
    }

    const keyDir = (keyRight ? 1 : 0) - (keyLeft ? 1 : 0);
    const usingKeys = keyDir !== 0;
    const rawAxis = (editMode || inventoryOpen || interactionState || autoDropStep) ? 0 : (usingKeys ? keyDir * (keyRun ? 1 : WALK_POINT) : driveAxis);
    const axisMag = Math.abs(rawAxis);
    const moveDir = axisMag > DRIVE_DEADZONE ? Math.sign(rawAxis) : 0;

    // Map the spring slider directly to motion: halfway from centre is a full
    // walk, the outer half progressively opens into the run.  This keeps one
    // continuous thumb gesture for direction and speed.
    let analogSpeed = 0;
    let targetRun = 0;
    if (moveDir) {
      if (axisMag <= WALK_POINT) {
        const walkAmount = Rig.clamp((axisMag - DRIVE_DEADZONE) / Math.max(0.001, WALK_POINT - DRIVE_DEADZONE), 0, 1);
        analogSpeed = WALK_SPEED * walkAmount;
      } else {
        targetRun = Rig.clamp((axisMag - WALK_POINT) / Math.max(0.001, 1 - WALK_POINT), 0, 1);
        analogSpeed = Rig.lerp(WALK_SPEED, RUN_SPEED, targetRun);
      }
    }
    if (carriedObject) {
      targetRun = 0;
      analogSpeed = Math.min(analogSpeed, WALK_SPEED * 0.92);
    }

    // Vertical motion and terrain following now share one surface query.  While
    // grounded, gentle changes in the authored surface are followed directly;
    // larger drops become real falls and larger rises remain obstacles.
    const previousJumpOffset = jumpOffset;
    if (jumping) {
      jumpTime += dt;
      jumpVelocity -= JUMP_GRAVITY * dt;
      jumpOffset += jumpVelocity * dt;
    }

    // Preserve the smooth pose blend while allowing the slider to control
    // actual ground speed continuously.  Releasing the thumb springs straight
    // back to idle rather than leaving a run latch behind.
    runBlend += (targetRun - runBlend) * Math.min(1, dt * 5.2);
    const smoothRun = runBlend * runBlend * (3 - 2 * runBlend);
    if (moveDir && analogSpeed > 0) {
      const proposedX = camera.x + moveDir * analogSpeed * dt;
      const bodyResolvedX = resolveObstacleMove(camera.x, proposedX, jumpOffset, jumping);
      camera.x = resolveCarriedObjectMove(camera.x, bodyResolvedX, jumpOffset);
      hideHint();
    }

    const characterXAfterMove = camera.x + character.screenOffsetX;
    const capsule = colliderWorld();
    const colliderXAfterMove = characterXAfterMove + capsule.offsetX;
    if (jumping) {
      if (jumpVelocity <= 0) {
        const support = walkableSupportAt(colliderXAfterMove, previousJumpOffset + 0.10, moveDir);
        if (support && previousJumpOffset >= support.offset - 0.04 && jumpOffset <= support.offset) {
          jumpOffset = support.offset;
          jumpVelocity = 0;
          jumping = false;
          jumpTime = 0;
          standingOnObject = support.obj;
        }
      }
      if (jumping && jumpOffset <= 0 && jumpTime > 0.18) {
        jumpOffset = 0;
        jumpVelocity = 0;
        jumping = false;
        jumpTime = 0;
        standingOnObject = null;
      }
    } else {
      const support = walkableSupportAt(colliderXAfterMove, jumpOffset + capsule.stepUp, moveDir);
      const delta = support.offset - jumpOffset;
      if (delta <= capsule.stepUp + 0.025 && delta >= -capsule.stepDown) {
        jumpOffset = support.offset;
        standingOnObject = support.obj;
      } else if (delta < -capsule.stepDown) {
        // Walking beyond a significant ledge keeps the current height and lets
        // the normal gravity solver take over rather than snapping downward.
        standingOnObject = null;
        jumping = true;
        jumpTime = 0;
        jumpVelocity = 0;
      }
    }

    const cameraDelta = camera.x - previousCameraX;
    const isWalking = Math.abs(cameraDelta) > 0.0001;
    if (moveDir) character.lastFacing = moveDir;
    if (isWalking) {
      const travel = Math.abs(cameraDelta);
      const stride = Rig.lerp(WALK_STRIDE, RUN_STRIDE, smoothRun);
      locomotionPhase = (locomotionPhase + travel / Math.max(0.001, stride)) % 1;
      character.distanceTravelled += travel;
    }
    previousCameraX = camera.x;

    character.x = camera.x + character.screenOffsetX;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    savePlayerPosition(false);
    updatePuzzleStreaming(character.x);
    checkPuzzleCompletion(character.x);
    updatePuzzleRewards(now);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFramebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.uv);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const eye = [camera.x, camera.y, camera.z];
    const target = [camera.x, camera.targetY, camera.targetZ];
    const view = mat4LookAt(eye, target, [0, 1, 0]);
    currentViewMatrix = view;

    // Draw the current terrain tile plus its immediate neighbours.
    // Previously the floor/path used a single wrapped copy, so at the tile
    // boundary the old plane disappeared just as the next one jumped in.
    // Keeping the neighbouring sections resident removes that visible swap.
    const terrainCentreX = wrapX(ground.x, camera.x);
    for (const offset of [-TILE_WIDTH, 0, TILE_WIDTH]) {
      drawObject(ground, view, { x: terrainCentreX + offset });
      drawObject(pathStrip, view, { x: terrainCentreX + offset });
    }
    for (const obj of backdrop) drawObject(obj, view);
    for (const obj of midfill) drawObject(obj, view);

    drawRigCharacter(view, isWalking);

    for (const obj of frontOccluders) drawObject(obj, view);

    presentSceneWithPost();
    drawEditorOverlay();

    const baseMotionLabel = jumping ? 'JUMP' : (runBlend > .55 && isWalking ? 'RUN' : (isWalking ? 'WALK' : 'IDLE'));
    const motionLabel = interactionState
      ? (interactionState.type === 'pickup' ? 'PICK UP' : 'PUT DOWN')
      : (carriedObject ? `CARRY ${isWalking ? 'WALK' : 'IDLE'}` : baseMotionLabel);
    if (editMode) {
      const selectedDepth = selectionCycleInfo && selectedObject && selectionCycleInfo.objects.includes(selectedObject) && selectionCycleInfo.objects.length > 1
        ? ` · DEPTH ${selectionCycleInfo.objects.indexOf(selectedObject)+1}/${selectionCycleInfo.objects.length}` : '';
      const selected = selectedObject && !selectedObject.deleted
        ? `${selectedObject.category === 'gameplay' ? 'GAMEPLAY · ' : 'DRESSING · '}${selectedObject.assetName}${selectedObject.category === 'gameplay' && selectedObject.gameplayLayerLocked ? ' · GAME LAYER' : ''}${selectedObject.collision ? ' · COLLISION' : ''}${selectedDepth}`
        : (addAssetType ? `ADD ${addAssetType}` : 'tap scenery to select');
      statusEl.textContent = `EDIT · ${selected}`;
    } else {
      const puzzle = activePuzzleNear(character.x);
      const puzzleLabel = puzzle ? ` · ${puzzle.def.label}${puzzle.solved ? ' ✓' : ''}` : '';
      statusEl.textContent = PLAYER_MODE
        ? `Woodland adventure · ${motionLabel}${puzzleLabel}`
        : (debugDepth
          ? `Depth view · camera X ${camera.x.toFixed(1)} · raised path geometry${puzzleLabel}`
          : `3D forest · ${motionLabel} · camera X ${camera.x.toFixed(1)}${puzzleLabel}`);
    }

    updateActionUI();
    if (editMode || puzzleTestMode) updatePuzzlePanel();
    requestAnimationFrame(render);
  }

  function setDriveAxis(value) {
    driveAxis = Rig.clamp(value, -1, 1);
    const display = Math.abs(driveAxis) < DRIVE_DEADZONE ? 0 : driveAxis;
    if (driveThumb) driveThumb.style.left = `${50 + display * 43}%`;
    if (driveControl) {
      driveControl.setAttribute('aria-valuenow', String(Math.round(display * 100)));
      driveControl.classList.toggle('moving', display !== 0);
      driveControl.classList.toggle('running', Math.abs(display) > WALK_POINT + 0.04);
    }
  }

  function updateDriveFromPointer(e) {
    if (!driveControl) return;
    const rect = driveControl.getBoundingClientRect();
    const centre = rect.left + rect.width * 0.5;
    const usableHalf = rect.width * 0.43;
    setDriveAxis((e.clientX - centre) / Math.max(1, usableHalf));
  }

  if (driveControl) {
    driveControl.addEventListener('pointerdown', e => {
      e.preventDefault();
      drivePointer = e.pointerId;
      driveControl.classList.add('dragging');
      driveControl.setPointerCapture?.(e.pointerId);
      updateDriveFromPointer(e);
      hideHint();
    });
    driveControl.addEventListener('pointermove', e => {
      if (e.pointerId !== drivePointer) return;
      e.preventDefault();
      updateDriveFromPointer(e);
    });
    const releaseDrive = e => {
      if (drivePointer !== null && e.pointerId !== drivePointer) return;
      drivePointer = null;
      driveControl.classList.remove('dragging');
      setDriveAxis(0);
    };
    driveControl.addEventListener('pointerup', releaseDrive);
    driveControl.addEventListener('pointercancel', releaseDrive);
    driveControl.addEventListener('lostpointercapture', releaseDrive);
    driveControl.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setDriveAxis(Math.max(-1, driveAxis - 0.25)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setDriveAxis(Math.min(1, driveAxis + 0.25)); }
      if (e.key === 'Home' || e.key === '0') { e.preventDefault(); setDriveAxis(0); }
    });
    driveControl.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setDriveAxis(0);
    });
  }

  function triggerJump(){
    if (editMode || inventoryOpen || jumping || interactionState) return;
    jumping = true;
    jumpTime = 0;
    // Keep the current support height so jumping from the top of a crate starts
    // from that surface rather than teleporting back to path level.
    standingOnObject = null;
    jumpVelocity = JUMP_VELOCITY;
    hideHint();
  }
  jumpBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    triggerJump();
    jumpBtn.setPointerCapture?.(e.pointerId);
  });

  actionBtn?.addEventListener('pointerdown', e => {
    e.preventDefault();
    performAction();
    actionBtn.setPointerCapture?.(e.pointerId);
  });

  function postHexToRgb(hex) {
    const n = parseInt(String(hex).replace('#',''), 16);
    return [((n >> 16) & 255)/255, ((n >> 8) & 255)/255, (n & 255)/255];
  }
  function postRgbToHex(rgb) {
    return '#' + rgb.map(v => Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  }
  function syncPostUi() {
    if (postBrightnessInput) postBrightnessInput.value = String(postSettings.brightness);
    if (postContrastInput) postContrastInput.value = String(postSettings.contrast);
    if (postSaturationInput) postSaturationInput.value = String(postSettings.saturation);
    if (postTintColourInput) postTintColourInput.value = postRgbToHex(postSettings.tintColor);
    if (postTintAmountInput) postTintAmountInput.value = String(postSettings.tintAmount);
    if (postBrightnessValue) postBrightnessValue.textContent = postSettings.brightness.toFixed(2);
    if (postContrastValue) postContrastValue.textContent = postSettings.contrast.toFixed(2);
    if (postSaturationValue) postSaturationValue.textContent = postSettings.saturation.toFixed(2);
    if (postTintAmountValue) postTintAmountValue.textContent = postSettings.tintAmount.toFixed(2);
  }
  function setPostPanelOpen(open) {
    if (!postPanel || !postBtn) return;
    postPanel.hidden = !open;
    postBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      setFogPanelOpen(false);
      syncPostUi();
    }
  }
  bindEditorPress(postBtn, () => setPostPanelOpen(postPanel?.hidden !== false));
  bindEditorPress(postCloseBtn, () => setPostPanelOpen(false));
  postBrightnessInput?.addEventListener('input', () => { postSettings.brightness = Number(postBrightnessInput.value); savePostSettings(); syncPostUi(); });
  postContrastInput?.addEventListener('input', () => { postSettings.contrast = Number(postContrastInput.value); savePostSettings(); syncPostUi(); });
  postSaturationInput?.addEventListener('input', () => { postSettings.saturation = Number(postSaturationInput.value); savePostSettings(); syncPostUi(); });
  postTintColourInput?.addEventListener('input', () => { postSettings.tintColor.splice(0,3,...postHexToRgb(postTintColourInput.value)); savePostSettings(); syncPostUi(); });
  postTintAmountInput?.addEventListener('input', () => { postSettings.tintAmount = Number(postTintAmountInput.value); savePostSettings(); syncPostUi(); });
  bindEditorPress(postResetBtn, () => {
    postSettings.brightness=DEFAULT_POST.brightness;
    postSettings.contrast=DEFAULT_POST.contrast;
    postSettings.saturation=DEFAULT_POST.saturation;
    postSettings.tintAmount=DEFAULT_POST.tintAmount;
    postSettings.tintColor.splice(0,3,...DEFAULT_POST.tintColor);
    savePostSettings();
    syncPostUi();
  });
  syncPostUi();

  function fogHexToRgb(hex) {
    const n = parseInt(String(hex).replace('#',''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function fogRgbToHex(rgb) {
    return '#' + rgb.map(v => Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
  }
  function syncFogUi() {
    if (fogEnabledInput) fogEnabledInput.checked = fogSettings.enabled;
    if (fogColourInput) fogColourInput.value = fogRgbToHex(fogSettings.color);
    if (fogStartInput) fogStartInput.value = String(fogSettings.near);
    if (fogCurveInput) fogCurveInput.value = String(fogSettings.curve);
    if (fogAmountInput) fogAmountInput.value = String(fogSettings.amount);
    if (fogStartValue) fogStartValue.textContent = fogSettings.near.toFixed(1);
    if (fogCurveValue) fogCurveValue.textContent = fogSettings.curve.toFixed(2);
    if (fogAmountValue) fogAmountValue.textContent = fogSettings.amount.toFixed(2);
  }
  function setFogPanelOpen(open) {
    if (!fogPanel || !fogBtn) return;
    fogPanel.hidden = !open;
    fogBtn.setAttribute('aria-expanded', String(open));
    if (open) { setPostPanelOpen(false); syncFogUi(); }
  }
  bindEditorPress(fogBtn, () => setFogPanelOpen(fogPanel?.hidden !== false));
  bindEditorPress(fogCloseBtn, () => setFogPanelOpen(false));
  fogEnabledInput?.addEventListener('input', () => { fogSettings.enabled = fogEnabledInput.checked; saveFogSettings(); syncFogUi(); });
  fogColourInput?.addEventListener('input', () => { const c=fogHexToRgb(fogColourInput.value); fogSettings.color[0]=c[0]; fogSettings.color[1]=c[1]; fogSettings.color[2]=c[2]; saveFogSettings(); syncFogUi(); });
  fogStartInput?.addEventListener('input', () => { fogSettings.near = Number(fogStartInput.value); saveFogSettings(); syncFogUi(); });
  fogCurveInput?.addEventListener('input', () => { fogSettings.curve = Number(fogCurveInput.value); saveFogSettings(); syncFogUi(); });
  fogAmountInput?.addEventListener('input', () => { fogSettings.amount = Number(fogAmountInput.value); saveFogSettings(); syncFogUi(); });
  bindEditorPress(fogResetBtn, () => { fogSettings.enabled=DEFAULT_FOG.enabled; fogSettings.near=DEFAULT_FOG.near; fogSettings.far=DEFAULT_FOG.far; fogSettings.amount=DEFAULT_FOG.amount; fogSettings.curve=DEFAULT_FOG.curve; fogSettings.color.splice(0,3,...DEFAULT_FOG.color); saveFogSettings(); syncFogUi(); });
  syncFogUi();

  debugBtn.addEventListener('click', () => {
    debugDepth = !debugDepth;
    debugBtn.setAttribute('aria-pressed', String(debugDepth));
    debugBtn.textContent = debugDepth ? 'Normal view' : 'Depth view';
    depthKey.hidden = !debugDepth;
    hideHint();
  });

  collisionViewBtn?.addEventListener('click', () => {
    collisionDebugView = !collisionDebugView;
    collisionViewBtn.setAttribute('aria-pressed', String(collisionDebugView));
    collisionViewBtn.textContent = collisionDebugView ? 'Hide collision' : 'Collision';
    hideHint();
  });

  const syncPlayerHintsButton = () => {
    if (!playerHintsBtn) return;
    playerHintsBtn.setAttribute('aria-pressed', String(playerHintsEnabled));
    playerHintsBtn.textContent = playerHintsEnabled ? 'Hints on' : 'Hints off';
  };
  bindEditorPress(playerHintsBtn, () => {
    playerHintsEnabled = !playerHintsEnabled;
    try { localStorage.setItem(PLAYER_HINT_STORAGE_KEY, playerHintsEnabled ? '1' : '0'); } catch (_) {}
    syncPlayerHintsButton();
  });
  syncPlayerHintsButton();

  bindEditorPress(inventoryBtn, () => setInventoryOpen(!inventoryOpen));
  bindEditorPress(inventoryCloseBtn, () => setInventoryOpen(false));

  bindEditorPress(deleteSaveBtn, () => {
    if (!PLAYER_MODE) return;
    if (!window.confirm('Delete this player save and start the adventure again?')) return;
    // Prevent pagehide from immediately writing the old position back after
    // we clear the save. This was why Delete save appeared not to return to start.
    playerSaveDeletionInProgress = true;
    try { localStorage.removeItem(PLAYER_POSITION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PLAYER_PUZZLE_STATE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PLAYER_INVENTORY_STORAGE_KEY); } catch (_) {}
    window.location.reload();
  });

  bindEditorPress(editBtn, () => {
    if (puzzleTestMode) backToPuzzleSetup();
    else if (editMode) setEditMode(false);
    else { editorScope = 'environment'; setEditMode(true); buildAssetPalette(); updatePuzzlePanel(); }
  });
  bindEditorPress(environmentScopeBtn, () => setEditorScope('environment'));
  bindEditorPress(puzzleScopeBtn, () => setEditorScope('puzzle'));
  bindEditorPress(puzzleSourceLibraryBtn, () => setPuzzleBrowserMode('library'));
  bindEditorPress(puzzleSourceSceneBtn, () => setPuzzleBrowserMode('scene'));
  puzzleSelect?.addEventListener('change', () => {
    if (puzzleBrowserMode !== 'library') return;
    editorPuzzleLibraryGroupId = puzzleSelect.value || null;
    selectObject(null);
    buildAssetPalette();
    updatePuzzlePanel();
  });
  bindEditorPress(puzzleEditBtn, editSelectedScenePuzzle);
  bindEditorPress(puzzleFocusBtn, focusSelectedPuzzle);
  const commitMarkerXInput = () => {
    if (!puzzleMarkerXInput || puzzleBrowserMode !== 'scene') return;
    const marker = selectedPuzzleMarker();
    const nextX = Number(puzzleMarkerXInput.value);
    if (!marker || !Number.isFinite(nextX)) {
      if (marker) puzzleMarkerXInput.value = Number(marker.x).toFixed(1);
      return;
    }
    if (movePuzzleMarkerTo(marker, nextX)) {
      persistPuzzleMarkerPosition(marker);
      settleGameplayCrates();
      renderScenePuzzleList({ force:true });
      updatePuzzlePanel();
      hintEl.textContent = `Moved ${markerDefinition(marker)?.label || marker.group} marker to x ${nextX.toFixed(1)}`;
      hintEl.classList.remove('hidden');
    }
  };
  puzzleMarkerXInput?.addEventListener('pointerdown', event => event.stopPropagation(), {passive:true});
  puzzleMarkerXInput?.addEventListener('click', event => event.stopPropagation());
  puzzleMarkerXInput?.addEventListener('change', commitMarkerXInput);
  puzzleMarkerXInput?.addEventListener('blur', commitMarkerXInput);
  puzzleMarkerXInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); commitMarkerXInput(); puzzleMarkerXInput.blur(); }
  });
  bindEditorPress(puzzleSpawnBtn, spawnSelectedPuzzleHere);
  bindEditorPress(puzzleCreateBtn, createPuzzleHere);
  bindEditorPress(puzzleClearStageBtn, clearPuzzleStage);
  bindEditorPress(puzzleRestoreStageBtn, restoreNormalPuzzleStage);
  bindEditorPress(puzzleExportBtn, exportSelectedPuzzle);
  bindEditorPress(puzzleRemoveBtn, removeSelectedLocalPuzzle);
  bindEditorPress(puzzleDeleteTemplateBtn, deleteSelectedPuzzleTemplate);
  function toggleAssetBrowserForCurrentScope() {
    if (!editMode || !editorPalette) return;
    const opening = editorPalette.hidden;
    setAssetPaletteOpen(opening, { clearPending: !opening });
    if (opening) {
      puzzleEnvironmentPlacementMode = false;
      puzzleExclusionEditMode = false;
      addAssetType = null;
      selectedObject = null;
      collisionEditMode = false;
      collisionHandleIndex = -1;
      showAssetBrowser();
      updateEditorButtons();
    }
  }
  bindEditorPress(openAssetsBtn, toggleAssetBrowserForCurrentScope);
  bindEditorPress(openEnvironmentAssetsBtn, toggleAssetBrowserForCurrentScope);
  bindEditorPress(editorPaletteClose, () => {
    if (!addAssetType) puzzleEnvironmentPlacementMode = false;
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
  });
  bindEditorPress(assetSetupBackBtn, showAssetBrowser);
  bindEditorPress(collectibleSetupBackBtn, showAssetBrowser);
  if (collectibleNameInput) {
    const commitCollectibleName = () => {
      if (!collectibleSetupItemId) return;
      const fallback = INVENTORY_ITEM_DEFS[collectibleSetupItemId]?.label || collectibleSetupItemId;
      const label = collectibleNameInput.value.trim() || fallback;
      updateCollectibleSetup(collectibleSetupItemId, { label });
    };
    collectibleNameInput.addEventListener('change', commitCollectibleName);
    collectibleNameInput.addEventListener('blur', commitCollectibleName);
    collectibleNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); collectibleNameInput.blur(); } });
  }
  if (collectibleScaleInput) collectibleScaleInput.addEventListener('input', () => {
    if (!collectibleSetupItemId) return;
    updateCollectibleSetup(collectibleSetupItemId, { scale:Number(collectibleScaleInput.value) || 1 });
  });
  bindEditorPress(collectibleSpinBtn, () => {
    if (!collectibleSetupItemId) return;
    updateCollectibleSetup(collectibleSetupItemId, { spin:!collectibleConfig(collectibleSetupItemId).spin });
  });
  bindEditorPress(collectibleResetBtn, () => {
    if (!collectibleSetupItemId) return;
    delete collectibleSetup[collectibleSetupItemId];
    saveCollectibleSetup();
    applyCollectibleConfigToLiveRewards(collectibleSetupItemId);
    renderCollectibleSetup();
    buildAssetPalette();
  });
  bindEditorPress(assetBehaviorResetBtn, () => {
    if (!assetSetupName) return;
    if (!window.confirm(`Reset ${editorAssetInfo.get(assetSetupName)?.label || assetSetupName} behaviour and collision defaults to their built-in values?`)) return;
    resetAssetBehaviours(assetSetupName);
  });
  bindEditorPress(placementChangeBtn, () => {
    if (!placementModeActive()) return;
    buildAssetPalette();
    setAssetPaletteOpen(true);
    updateAssetPaletteState();
  });
  bindEditorPress(placementDoneBtn, exitPlacementMode);
  bindEditorPress(editorResetBtn, () => {
    if (!window.confirm('Reset all SideScroll scene edits on this device?')) return;
    try { localStorage.removeItem(SCENE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_STATE_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_START_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_LIBRARY_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_WORKSHOP_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(PUZZLE_EXCLUSION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_BEHAVIOUR_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(ASSET_COLLISION_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(INVENTORY_STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(COLLECTIBLE_SETUP_STORAGE_KEY); } catch (_) {}
    window.location.reload();
  });
  bindEditorPress(exportAllBtn, exportAllGameDesign);
  bindEditorPress(puzzleExclusionEditBtn, () => {
    const instance = selectedPuzzleInstance();
    if (!instance || puzzleTestMode) return;
    const ex = currentPuzzleExclusion(instance.marker);
    if (!ex.enabled) { ex.enabled = true; savePuzzleExclusionState(); }
    puzzleExclusionEditMode = !puzzleExclusionEditMode;
    puzzleEnvironmentPlacementMode = false;
    addAssetType = null;
    setAssetPaletteOpen(false);
    selectObject(null);
    updatePuzzlePanel();
    hintEl.textContent = puzzleExclusionEditMode
      ? 'Exclusion edit · centre moves · cyan edge handles resize width/depth · procedural forest updates live'
      : 'Exclusion edit finished';
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(puzzleExclusionToggleBtn, () => {
    const instance = selectedPuzzleInstance();
    if (!instance || puzzleTestMode) return;
    const ex=currentPuzzleExclusion(instance.marker);
    ex.enabled=!ex.enabled;
    savePuzzleExclusionState();
    if (!ex.enabled) puzzleExclusionEditMode=false;
    updatePuzzlePanel();
    hintEl.textContent=ex.enabled ? 'Puzzle exclusion enabled' : 'Puzzle exclusion disabled · procedural forest restored';
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(puzzleAddDressingBtn, () => {
    const instance=selectedPuzzleInstance();
    if(!instance || puzzleTestMode) return;
    puzzleExclusionEditMode=false;
    puzzleEnvironmentPlacementMode=true;
    addAssetType=null;
    selectObject(null);
    buildAssetPalette();
    setAssetPaletteOpen(true);
    showAssetBrowser();
    updatePuzzlePanel();
    hintEl.textContent='Puzzle Dressing · choose a tree, bush, grass or rock to place back into the cleared area';
    hintEl.classList.remove('hidden');
  });
  bindEditorPress(puzzleSetStartBtn, savePuzzleTemplateFromCurrent);
  bindEditorPress(puzzleSaveUniqueBtn, savePuzzleUniqueFromCurrent);
  bindEditorPress(puzzleTestBtn, beginPuzzleTest);
  bindEditorPress(puzzleResetBtn, resetCurrentPuzzle);
  bindEditorPress(puzzleBackSetupBtn, backToPuzzleSetup);
  bindEditorPress(editorDuplicateBtn, duplicateSelected);
  bindEditorPress(editorScaleDownBtn, () => scaleSelected(0.90));
  bindEditorPress(editorScaleUpBtn, () => scaleSelected(1.10));
  bindEditorPress(editorGameLayerBtn, toggleSelectedGameplayLayer);
  bindEditorPress(editorCollisionBtn, toggleSelectedCollision);
  bindEditorPress(editorCollisionRemoveBtn, removeSelectedCollision);
  bindEditorPress(editorCollisionSaveAssetBtn, saveSelectedCollisionAsAssetDefault);
  bindEditorPress(editorCollisionUseAssetBtn, useAssetCollisionForSelected);
  bindEditorPress(quickNavBtn, () => setQuickNavOpen(quickNavPanel?.hidden));
  bindEditorPress(quickNavCloseBtn, () => setQuickNavOpen(false));
  bindEditorPress(cameraEditorBtn, () => {
    if (!editMode) return;
    cameraEditMode = !cameraEditMode;
    if (cameraEditMode) {
      setQuickNavOpen(false);
      selectedObject = null;
      collisionEditMode = false;
      socketPlacementPiece = null;
      setAssetPaletteOpen(false);
      hintEl.textContent = 'CAMERA · height · depth · tilt';
      hintEl.classList.remove('hidden');
    }
    updateCameraEditorUi();
    updateEditorButtons();
  });
  const bindCameraNudge = (el, dy, dz) => {
    if (!el) return;
    const apply = e => { e?.preventDefault?.(); if (editMode && cameraEditMode) nudgeCamera(dy, dz); };
    el.addEventListener('pointerdown', apply);
  };
  bindCameraNudge(cameraUpBtn, CAMERA_Y_STEP, 0);
  bindCameraNudge(cameraDownBtn, -CAMERA_Y_STEP, 0);
  bindCameraNudge(cameraBackBtn, 0, CAMERA_Z_STEP);
  bindCameraNudge(cameraForwardBtn, 0, -CAMERA_Z_STEP);
  if (cameraTiltBackBtn) cameraTiltBackBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (editMode && cameraEditMode) nudgeCameraTilt(CAMERA_TILT_STEP); });
  if (cameraTiltForwardBtn) cameraTiltForwardBtn.addEventListener('pointerdown', e => { e.preventDefault(); if (editMode && cameraEditMode) nudgeCameraTilt(-CAMERA_TILT_STEP); });
  bindEditorPress(editorSocketBtn, startSocketPlacement);
  bindEditorPress(editorSocketClearBtn, clearSelectedPieceSocket);
  bindEditorPress(editorDeleteBtn, deleteSelected);
  const puzzleObjectsSummary = puzzleObjectsEl?.querySelector('summary');
  bindEditorPress(puzzleObjectsSummary, () => { if (puzzleObjectsEl) puzzleObjectsEl.open = !puzzleObjectsEl.open; });

  canvas.addEventListener('pointerdown', e => {
    if (editMode && pointInsideEditorUi(e.clientX, e.clientY)) return;
    canvas.setPointerCapture?.(e.pointerId);
    hideHint();
    if (editMode) {
      editorPointer = e.pointerId;
      const localRect = canvas.getBoundingClientRect();
      const startGround = groundPointFromClient(e.clientX, e.clientY);
      editorGesture = {
        startClientX:e.clientX, startClientY:e.clientY,
        startLocalX:e.clientX-localRect.left, startLocalY:e.clientY-localRect.top,
        startCameraX:camera.x, startGround,
        moved:false, kind:'pan', object:null,
        objectStartX:selectedObject?.x ?? 0, objectStartZ:selectedObject?.z ?? 0
      };

      if (socketPlacementPiece) {
        editorGesture.kind = 'socket-place-pan';
        editorGesture.socketPiece = socketPlacementPiece;
        return;
      }

      if (addAssetType) {
        // Placement mode follows the same editor gesture language as Setup:
        // drag empty space to pan, tap empty space to place, tap an existing
        // prop to select it, and drag only the already-selected prop to move it.
        editorGesture.placement = true;
        if (selectedObject && editorObjectIsEditable(selectedObject) && pointInsideScreenBounds(e.clientX,e.clientY,objectScreenBounds(selectedObject),3)) {
          editorGesture.kind = 'selected-object';
          editorGesture.object = selectedObject;
          editorGesture.stackIgnore = new Set();
          if (isGameplayCrate(selectedObject)) {
            const anchor = stackBottomFor(selectedObject, selectedObject.x);
            const column = stackColumnFor(anchor, selectedObject.x);
            const index = column?.members?.indexOf(selectedObject) ?? -1;
            if (index >= 0) {
              for (const member of column.members.slice(index + 1)) editorGesture.stackIgnore.add(member);
            }
          }
        } else {
          editorGesture.kind = 'placement-pan';
        }
        return;
      }

      const exclusionHandle = puzzleExclusionHandleAt(e.clientX, e.clientY);
      if (exclusionHandle) {
        const instance=selectedPuzzleInstance();
        editorGesture.kind='puzzle-exclusion';
        editorGesture.exclusionHandle=exclusionHandle.kind;
        editorGesture.exclusionStart={...currentPuzzleExclusion(instance.marker)};
        editorGesture.exclusionMarker=instance.marker;
        puzzleExclusionHandle=exclusionHandle.kind;
        hintEl.textContent=exclusionHandle.kind==='center' ? 'Drag the centre dot to move the exclusion plane' : 'Drag the cyan handle to resize the exclusion plane';
        hintEl.classList.remove('hidden');
        return;
      }

      const markerHandle = puzzleMarkerHandleAt(e.clientX, e.clientY);
      if (markerHandle) {
        const marker = selectedPuzzleMarker();
        editorGesture.kind = 'puzzle-marker';
        editorGesture.marker = marker;
        editorGesture.markerStartX = marker?.x ?? 0;
        hintEl.textContent = 'Drag the centre dot to move this puzzle marker';
        hintEl.classList.remove('hidden');
        return;
      }

      const boundHandle = puzzleBoundHandleAt(e.clientX, e.clientY);
      if (boundHandle) {
        editorGesture.kind = 'puzzle-bound';
        puzzleBoundSide = boundHandle.side;
        hintEl.textContent = 'Drag to resize the selected puzzle bounds';
        hintEl.classList.remove('hidden');
        return;
      }

      if (selectedObject && collisionEditMode && selectedObject.collision) {
        const rect = canvas.getBoundingClientRect();
        const handles = collisionHandlePositions(selectedObject);
        const handle = handles.find(item => Math.hypot(item.x - (e.clientX-rect.left), item.y - (e.clientY-rect.top)) <= 16);
        if (handle) {
          editorGesture.kind = 'collision-handle';
          collisionHandleIndex = handle.index;
          hintEl.textContent = 'Drag the orange handle to reshape the collision';
          hintEl.classList.remove('hidden');
          return;
        }
      }

      // Crucial editor rule: an object only moves when the drag STARTS inside
      // the object that was already selected. Everything else begins as a pan.
      if (selectedObject && editorObjectIsEditable(selectedObject) && pointInsideScreenBounds(e.clientX,e.clientY,objectScreenBounds(selectedObject),3)) {
        editorGesture.kind = 'selected-object';
        editorGesture.object = selectedObject;
        editorGesture.stackIgnore = new Set();
        if (isGameplayCrate(selectedObject)) {
          const anchor = stackBottomFor(selectedObject, selectedObject.x);
          const column = stackColumnFor(anchor, selectedObject.x);
          const index = column?.members?.indexOf(selectedObject) ?? -1;
          if (index >= 0) {
            for (const member of column.members.slice(index + 1)) editorGesture.stackIgnore.add(member);
          }
        }
      }
      return;
    }

    // Scene swiping is an editor-only navigation gesture. In normal player
    // mode movement must come exclusively from the slider controls.
    if (PLAYER_MODE) return;
    activePointer = e.pointerId;
    dragStartX = e.clientX;
    dragStartCameraX = camera.x;
  });

  canvas.addEventListener('pointermove', e => {
    if (editMode) {
      if (e.pointerId !== editorPointer || !editorGesture) return;
      const dx = e.clientX - editorGesture.startClientX;
      const dy = e.clientY - editorGesture.startClientY;
      const travel = Math.hypot(dx,dy);
      if (travel < 7 && !editorGesture.moved) return;
      editorGesture.moved = true;

      if (editorGesture.kind === 'selected-object' && editorGesture.object) {
        const obj = editorGesture.object;
        if (obj.socketedTo) obj.socketedTo = null;
        const point = groundPointFromClient(e.clientX,e.clientY);
        // Horizontal editing now uses the same world-per-pixel scale as scene
        // panning. This makes the selected asset visually track the finger
        // instead of perspective projection making it race ahead.
        const desiredX = editorGesture.objectStartX + dx * 0.0065;
        const desiredZ = obj.category === 'gameplay' && obj.gameplayLayerLocked
          ? pathZ
          : (point && editorGesture.startGround
              ? Rig.clamp(editorGesture.objectStartZ + (point.z-editorGesture.startGround.z)*0.55, WORLD.farZ+0.8, WORLD.nearZ-0.6)
              : editorGesture.objectStartZ);
        if (obj.category === 'gameplay') placeGameplayObjectInEditor(obj, desiredX, desiredZ, editorGesture.stackIgnore);
        else { obj.x = desiredX; obj.z = desiredZ; obj.y = pathGroundYAt(obj.x,obj.z); }
        moveObjectToCorrectCollection(obj);sortSceneCollections();selectionCycleInfo=null;
      } else if (editorGesture.kind === 'collision-handle' && selectedObject?.collision && collisionHandleIndex >= 0) {
        const bounds=collisionRectScreenBounds(selectedObject); if(!bounds) return;
        const rect=canvas.getBoundingClientRect(); const lx=e.clientX-rect.left, ly=e.clientY-rect.top;
        const nx=Rig.clamp((((lx-bounds.left)/Math.max(1,bounds.right-bounds.left))*2)-1,-4.0,4.0);
        const ny=Rig.clamp((bounds.bottom-ly)/Math.max(1,bounds.bottom-bounds.top),-0.20,3.0);
        const points=normalisedCollisionPoints(selectedObject.collision).map(point=>({...point}));
        if(points[collisionHandleIndex]){selectedObject.collisionOverride=true;points[collisionHandleIndex].x=nx;points[collisionHandleIndex].y=ny;selectedObject.collision.points=points;}
      } else if (editorGesture.kind === 'puzzle-exclusion' && editorGesture.exclusionMarker) {
        const point=groundPointFromClient(e.clientX,e.clientY);
        if(point){
          const marker=editorGesture.exclusionMarker;
          const start=editorGesture.exclusionStart;
          const ex=currentPuzzleExclusion(marker);
          const localX=point.x-marker.x;
          const z=point.z;
          const left0=start.centerX-start.width*0.5, right0=start.centerX+start.width*0.5;
          const far0=start.centerZ-start.depth*0.5, near0=start.centerZ+start.depth*0.5;
          if(editorGesture.exclusionHandle==='center'){ex.centerX=localX;ex.centerZ=z;}
          else if(editorGesture.exclusionHandle==='left'){const left=Math.min(localX,right0-1);ex.centerX=(left+right0)*0.5;ex.width=Math.max(1,right0-left);}
          else if(editorGesture.exclusionHandle==='right'){const right=Math.max(localX,left0+1);ex.centerX=(left0+right)*0.5;ex.width=Math.max(1,right-left0);}
          else if(editorGesture.exclusionHandle==='far'){const far=Math.min(z,near0-1);ex.centerZ=(far+near0)*0.5;ex.depth=Math.max(1,near0-far);}
          else if(editorGesture.exclusionHandle==='near'){const near=Math.max(z,far0+1);ex.centerZ=(far0+near)*0.5;ex.depth=Math.max(1,near-far0);}
        }
      } else if (editorGesture.kind === 'puzzle-marker' && editorGesture.marker) {
        const nextX = editorGesture.markerStartX + dx * 0.0065;
        movePuzzleMarkerTo(editorGesture.marker, nextX);
        if (puzzleMarkerXInput) puzzleMarkerXInput.value = Number(nextX).toFixed(1);
        renderScenePuzzleList({ force:true });
      } else if (editorGesture.kind === 'puzzle-bound') {
        const instance=selectedPuzzleInstance(); const point=groundPointFromClient(e.clientX,e.clientY);
        if(instance&&point){
          const rel=currentPuzzleBoundsRelative(instance.marker);const local=point.x-instance.marker.x;
          if(puzzleBoundSide==='left') rel.minX=Math.min(local,rel.maxX-1.0);
          else rel.maxX=Math.max(local,rel.minX+1.0);
          puzzleStartDirty.add(instance.id);updatePuzzlePanel();
        }
      } else {
        camera.x = editorGesture.startCameraX - dx*0.0065;
      }
      return;
    }
    if (PLAYER_MODE) return;
    if (e.pointerId !== activePointer) return;
    const dx = e.clientX - dragStartX;
    camera.x = dragStartCameraX - dx * 0.0075;
  });

  const endDrag = e => {
    if (editMode) {
      if (e.pointerId !== editorPointer) return;
      const gesture=editorGesture;
      if (gesture) {
        if (gesture.moved) {
          if (gesture.kind==='selected-object' && gesture.object) {
            if (gesture.object.category === 'gameplay') settleGameplayCrates();
            const instance = gesture.object.puzzleInstanceId ? activePuzzleInstances.get(gesture.object.puzzleInstanceId) : null;
            if (instance) capturePuzzleInstance(instance);
            else recordObjectEdit(gesture.object);
          }
          else if (gesture.kind==='collision-handle' && selectedObject) recordObjectEdit(selectedObject);
          else if (gesture.kind==='puzzle-marker' && gesture.marker) {
            persistPuzzleMarkerPosition(gesture.marker);
            settleGameplayCrates();
            renderScenePuzzleList({ force:true });
            updatePuzzlePanel();
          }
          else if (gesture.kind==='puzzle-bound') {
            const instance=selectedPuzzleInstance(); if(instance) puzzleStartDirty.add(instance.id);
          }
          else if (gesture.kind==='puzzle-exclusion' && gesture.exclusionMarker) {
            savePuzzleExclusionState();
            updatePuzzlePanel();
          }
        } else if (!gesture.moved && gesture.kind==='socket-place-pan' && gesture.socketPiece) {
          const host = socketHostAt(e.clientX,e.clientY);
          if (host && placeSocketOnHost(gesture.socketPiece, host, e.clientX, e.clientY)) {
            hintEl.textContent = `Socket set for ${socketLabelForPiece(gesture.socketPiece)} · select another piece or press Move Socket to adjust`;
            hintEl.classList.remove('hidden');
            socketPlacementPiece = null;
            updateEditorButtons();
            updatePuzzlePanel();
          } else {
            hintEl.textContent = 'Tap directly on an asset tagged Socket Host';
            hintEl.classList.remove('hidden');
          }
        } else if (gesture.placement && (gesture.kind==='placement-pan' || gesture.kind==='selected-object')) {
          // A clean release in Placement mode first tries to select an existing
          // editable prop. Only genuinely empty space creates another asset.
          const candidates=pickSceneObjects(e.clientX,e.clientY).filter(editorObjectIsEditable);
          const hit=candidates[0]||null;
          if(hit){
            selectObject(hit,true,{keepPlacement:true});
            selectionCycleInfo=cycleInfoFor(selectedObject,candidates);
            hintEl.textContent='Selected · drag this asset to move it · drag elsewhere to pan · tap empty ground to place another';
            hintEl.classList.remove('hidden');
          } else if(addAssetType){
            const point=groundPointFromClient(e.clientX,e.clientY) || gesture.startGround;
            if(point){
              const placedType=addAssetType;
              const obj=createUserObject(placedType,point,{selectAfter:false});
              selectObject(obj,true,{keepPlacement:true});
              const info=editorAssetInfo.get(placedType);
              hintEl.textContent=`Placed ${String(info?.label || placedType).toLowerCase()} · drag it to adjust · drag elsewhere to pan · tap empty ground for another`;
              hintEl.classList.remove('hidden');
            }
          }
        } else if (gesture.kind==='pan' || gesture.kind==='selected-object') {
          // Selection happens only on a clean tap/release. A drag can never
          // select a different object, which keeps panning and moving separate.
          const candidates=pickSceneObjects(e.clientX,e.clientY);
          const hit=candidates[0]||null;
          if(hit){
            if(hit===selectedObject && candidates.length>1 && selectionCycleInfo?.objects?.length){
              const current=Math.max(0,candidates.indexOf(selectedObject));selectObject(candidates[(current+1)%candidates.length],true);
            } else selectObject(hit,true);
            selectionCycleInfo=cycleInfoFor(selectedObject,candidates);
            hintEl.textContent='Selected · drag inside this asset to move it · drag elsewhere to pan';hintEl.classList.remove('hidden');
          } else {
            selectObject(null);
          }
        }
      }
      editorGesture=null;editorPointer=null;editorDragKind=null;editorTapState=null;collisionHandleIndex=-1;puzzleBoundSide=null;
      return;
    }
    if (e.pointerId === activePointer) activePointer = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (editMode) {
      if (e.key === 'Escape') {
        if (inventoryOpen) { setInventoryOpen(false); return; }
        socketPlacementPiece = null; selectObject(null); setAssetPaletteOpen(false, { clearPending:true }); updateAssetPaletteState();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) { e.preventDefault(); deleteSelected(); }
      return;
    }
    if (e.key === 'ArrowLeft' || key === 'a') {
      keyLeft = true;
      hideHint();
    }
    if (e.key === 'ArrowRight' || key === 'd') {
      keyRight = true;
      hideHint();
    }
    if (e.key === 'Shift') keyRun = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || key === 'w') { e.preventDefault(); triggerJump(); }
    if (key === 'e') { e.preventDefault(); performAction(); }
    if (e.key === '0') camera.x = 0;
  });

  window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (editMode) return;
    if (e.key === 'ArrowLeft' || key === 'a') keyLeft = false;
    if (e.key === 'ArrowRight' || key === 'd') keyRight = false;
    if (e.key === 'Shift') keyRun = false;
  });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    refreshCharacterCollider();
    keyLeft = false;
    keyRight = false;
    keyRun = false;
    setDriveAxis(0);
    jumping = false;
    jumpTime = 0;
    const support = walkableSupportAt(camera.x + character.screenOffsetX + colliderWorld().offsetX, Infinity, 0);
    jumpOffset = support.offset;
    jumpVelocity = 0;
    standingOnObject = support.obj;
    autoDropStep = null;
    if (interactionState?.type === 'pickup') interactionState.object.carried = false;
    if (interactionState?.type === 'drop') completeDrop();
    interactionState = null;
    locomotionPhase = 0;
    character.y = playSurfaceYAt(character.x) + jumpOffset;
    lastTime = performance.now();
    previousCameraX = camera.x;
  });

  populatePuzzleSelector();
  buildAssetPalette();
  updateEditorButtons();
  if (PLAYER_MODE) {
    document.body.classList.add('sidescroll-player-mode');
    if (debugBtn) debugBtn.hidden = true;
    if (collisionViewBtn) collisionViewBtn.hidden = true;
    if (editBtn) editBtn.hidden = true;
    if (quickNavBtn) quickNavBtn.hidden = true;
    if (deleteSaveBtn) deleteSaveBtn.hidden = false;
    if (statusEl) statusEl.textContent = 'Woodland adventure';
    restorePlayerPosition();
    window.addEventListener('pagehide', () => savePlayerPosition(true));
  }
  setEditMode(false);
  updatePuzzlePanel();
  resize();
  renderInventory();
  requestAnimationFrame(render);
})();
