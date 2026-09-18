(() => {
  'use strict';

  // SideScroll v0.2.28: pick-up always targets the exposed top item of a stack.

  const Rig = window.GameHubWalkRig;
  if (!Rig) return;

  const canvas = document.getElementById('sidescroll-canvas');
  const errorBox = document.getElementById('sidescroll-error');
  const statusEl = document.getElementById('sidescroll-status');
  const hintEl = document.getElementById('sidescroll-hint');
  const debugBtn = document.getElementById('sidescroll-depth');
  const collisionViewBtn = document.getElementById('sidescroll-collision-view');
  const depthKey = document.getElementById('sidescroll-depth-key');
  const driveControl = document.getElementById('sidescroll-drive');
  const driveThumb = document.getElementById('sidescroll-drive-thumb');
  const jumpBtn = document.getElementById('sidescroll-jump');
  const secondaryControls = document.getElementById('sidescroll-secondary-controls');
  const actionBtn = document.getElementById('sidescroll-action');
  const actionLabel = document.getElementById('sidescroll-action-label');
  const editBtn = document.getElementById('sidescroll-edit');
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
  const editorDeleteBtn = document.getElementById('sidescroll-editor-delete');
  const editorUiElements = () => [puzzlePanel, editorPalette, editorControls].filter(el => el && !el.hidden);

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
      // Pointer-generated click follows pointerup on many browsers; suppress the
      // duplicate. Keyboard activation still arrives as a click with detail 0.
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.detail !== 0 || element.disabled) return;
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
    uniform float uOpacity;
    uniform float uHighlight;
    uniform vec3 uHighlightColor;
    varying vec2 vUV;
    varying float vDepth;
    void main() {
      vec4 tex = texture2D(uTexture, vUV);
      float alpha = tex.a * uOpacity;
      if (alpha < 0.045) discard;
      float fog = smoothstep(uFogNear, uFogFar, vDepth) * uFogAmount;
      vec3 base = tex.rgb * uTint;
      base = mix(base, uHighlightColor, clamp(uHighlight, 0.0, 1.0) * 0.72);
      vec3 rgb = mix(base, uFogColor, fog * (1.0 - uHighlight * 0.72));
      gl_FragColor = vec4(rgb, alpha);
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

  function createProgram() {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    }
    return program;
  }

  let program;
  try {
    program = createProgram();
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
    opacity: gl.getUniformLocation(program, 'uOpacity'),
    highlight: gl.getUniformLocation(program, 'uHighlight'),
    highlightColor: gl.getUniformLocation(program, 'uHighlightColor'),
    uvScale: gl.getUniformLocation(program, 'uUvScale'),
    uvOffset: gl.getUniformLocation(program, 'uUvOffset')
  };

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
        vertices.push(x, row.y + rise, row.z, t * 36.0, row.v);
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

  function createImageTexture(url, label = 'image', fallbackUrl = null) {
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
        assetAspect[label] = image.naturalWidth / image.naturalHeight;
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


  textures.pathDirt = createTexture((ctx,w,h) => {
    const grad=ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,'#a9845f');
    grad.addColorStop(.45,'#987352');
    grad.addColorStop(1,'#765844');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    let seed=7319;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<720;i++){
      const x=random()*w,y=random()*h,r=.4+random()*2.2;
      ctx.globalAlpha=.035+random()*.10;
      ctx.fillStyle=random()>.52?'#d1ad7e':'#4f4037';
      ctx.beginPath();ctx.ellipse(x,y,r*1.8,r,.35,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=.10;ctx.strokeStyle='#dbc092';ctx.lineWidth=1;
    for(let i=0;i<18;i++){
      const y=6+i*7+(i%3)*2;ctx.beginPath();ctx.moveTo(-10,y);ctx.bezierCurveTo(55,y+3,135,y-4,270,y+2);ctx.stroke();
    }
    ctx.globalAlpha=1;
  },256,128,true);

  // v1.8.81: forest dressing now comes from one authored atlas.
  // This removes the old per-file fallback path which could substitute the
  // full woodland source sheet when an individual PNG failed to load.
  textures.dressingAtlas = createImageTexture('sidescroll-dressing-atlas.png?v=0.2.2', 'SideScroll dressing atlas');
  const assetUv = {
    tree06: { scale: [0.107421875, 0.373046875], offset: [0.003906250, 0.623046875] },
    tree02: { scale: [0.139648438, 0.362304688], offset: [0.115234375, 0.633789062] },
    tree01: { scale: [0.086914062, 0.349609375], offset: [0.258789062, 0.646484375] },
    tree04: { scale: [0.090820312, 0.340332031], offset: [0.349609375, 0.655761719] },
    tree03: { scale: [0.083984375, 0.329101562], offset: [0.444335938, 0.666992188] },
    tree05: { scale: [0.087890625, 0.306640625], offset: [0.532226562, 0.689453125] },
    ground02: { scale: [0.131835938, 0.112792969], offset: [0.624023438, 0.883300781] },
    ground01: { scale: [0.128417969, 0.108886719], offset: [0.759765625, 0.887207031] },
    ground06: { scale: [0.111328125, 0.107421875], offset: [0.003906250, 0.511718750] },
    ground04: { scale: [0.101074219, 0.103027344], offset: [0.119140625, 0.516113281] },
    ground11: { scale: [0.125488281, 0.101074219], offset: [0.224121094, 0.518066406] },
    ground07: { scale: [0.097656250, 0.100585938], offset: [0.353515625, 0.518554688] },
    ground05: { scale: [0.142578125, 0.100097656], offset: [0.455078125, 0.519042969] },
    ground09: { scale: [0.129394531, 0.097656250], offset: [0.601562500, 0.521484375] },
    ground12: { scale: [0.145507812, 0.083496094], offset: [0.734863281, 0.535644531] },
    ground08: { scale: [0.144531250, 0.075683594], offset: [0.003906250, 0.432128906] },
    ground03: { scale: [0.144531250, 0.074707031], offset: [0.152343750, 0.433105469] },
    ground10: { scale: [0.113281250, 0.062500000], offset: [0.300781250, 0.445312500] },
  };
  const assetDimensions = {
    tree01: [237, 955],
    tree02: [382, 990],
    tree03: [230, 899],
    tree04: [248, 929],
    tree05: [240, 837],
    tree06: [293, 1018],
    ground01: [351, 297],
    ground02: [360, 308],
    ground03: [394, 204],
    ground04: [276, 281],
    ground05: [389, 273],
    ground06: [304, 294],
    ground07: [267, 275],
    ground08: [394, 207],
    ground09: [353, 267],
    ground10: [309, 171],
    ground11: [343, 276],
    ground12: [398, 228],
  };
  Object.entries(assetDimensions).forEach(([key, size]) => {
    assetAspect[key] = size[0] / size[1];
    textures[key] = textures.dressingAtlas;
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
            textures[asset.name] = createImageTexture(asset.url, asset.name);
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
  const fogColor = [0.875, 0.915, 0.945];
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
  const STACK_ITEM_HEIGHT = 0.48;
  const STACK_SEARCH_RADIUS = 2.00;
  const STACK_COLUMN_ALIGN_TOLERANCE = 0.42;
  const STACK_ASSIST_SPEED = 0.92;
  const STACK_ASSIST_MAX = 0.78;
  const STACK_ASSIST_ROOT_GAP = 0.92;
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
    tint: [0.63, 0.61, 0.55],
    opacity: 1,
    uvScale: [24, 14],
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
    tint: [1.02, 0.99, 0.95],
    opacity: 1,
    noFog: false,
    wrap: true
  };

  const backdrop = [];
  const midfill = [];
  const frontOccluders = [];

  const SCENE_STORAGE_KEY = 'sidescroll.scene.v1';
  const ASSET_BEHAVIOUR_STORAGE_KEY = 'sidescroll.asset-behaviours.v1';
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
    'stone-wall': {},
    'stone-piece-a': {},
    'stone-piece-b': {},
    'stone-piece-c': {}
  };
  const ASSET_BEHAVIOUR_DEFS = [
    { key:'solid', label:'Solid', description:'Adds physical collision to this asset type.' },
    { key:'carryable', label:'Carryable', description:'ACTION can pick this asset up. Enabling this also makes it placeable.' },
    { key:'placeable', label:'Placeable', description:'A carried copy may be put back down into the world.' },
    { key:'supportSurface', label:'Support Surface', description:'The top of its collision can support the player and stackable props.' },
    { key:'stackable', label:'Stackable', description:'This asset may settle onto a support surface when placed.' },
    { key:'socketHost', label:'Socket Host', description:'Marks this asset as able to contain authored sockets. Socket editing comes next.' },
    { key:'socketPiece', label:'Socket Piece', description:'Marks this asset as a piece that can later be linked to a matching socket.' }
  ];
  let assetBehaviourOverrides = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(ASSET_BEHAVIOUR_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  })();

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
      const parsed = JSON.parse(localStorage.getItem(SCENE_STORAGE_KEY) || 'null');
      if (parsed && (parsed.version === 2 || parsed.version === 3 || parsed.version === 4)) {
        parsed.version = 4;
        parsed.overrides ||= {};
        parsed.added ||= [];
        return parsed;
      }
    } catch (_) {}
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
      flip: opts.flip ?? (rand() > 0.5),
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
      collision: category === 'gameplay' ? behaviourCollisionFor(type, resolvedWidth, resolvedHeight, opts.collision) : cloneCollision(opts.collision),
      shadow: opts.shadow ? { ...opts.shadow } : null,
      deleted: !!opts.deleted,
      carried: false,
      userAdded: !!opts.userAdded,
      puzzleInstanceId: opts.puzzleInstanceId || null,
      puzzleObjectId: opts.puzzleObjectId || null
    };
    collection.push(obj);
    return obj;
  }

  function scatterForest() {
    const trees = ['tree01', 'tree02', 'tree03', 'tree04', 'tree05', 'tree06'];
    const allGround = ['ground01','ground02','ground03','ground04','ground05','ground06','ground07','ground08','ground09','ground10','ground11','ground12'];
    const grassScrub = ['ground01','ground02','ground03','ground05','ground06','ground08','ground09','ground10','ground11','ground12'];
    const rocks = ['ground03','ground04','ground07','ground10','ground11'];
    const edgeGrass = ['ground01','ground06','ground10','ground11'];

    // FAR PATH LIP ----------------------------------------------------------
    // The far edge is the one the side camera reads most clearly, so give it a
    // deliberately continuous low grass seam slightly inside the top of the
    // path.  The pieces overlap the dirt by a few centimetres and hide the
    // geometric line before the larger far-side woodland begins.
    const farLipCount = 238;
    for (let i = 0; i < farLipCount; i++) {
      const spacing = TILE_WIDTH / farLipCount;
      const x = TILE.minX + (i + 0.5) * spacing + (rand() - 0.5) * spacing * 0.72;
      const z = -(PATH_FLAT_HALF - 0.04 + rand() * 0.28);
      const type = edgeGrass[Math.floor(rand() * edgeGrass.length)];
      const height = 0.34 + rand() * 0.34;
      addObject(midfill, type, x, z, null, height, {
        y: pathGroundYAt(x, z) - 0.075,
        shade: 1.015 + rand() * 0.055,
        opacity: 0.96 + rand() * 0.035,
        layer: 'near'
      });
      if (i % 15 === 0 && rand() > 0.28) {
        const rockType = rocks[Math.floor(rand() * rocks.length)];
        addObject(midfill, rockType, x + (rand() - 0.5) * 0.42, z - 0.12 - rand() * 0.18, null, 0.34 + rand() * 0.30, {
          y: pathGroundYAt(x, z) - 0.06,
          shade: 0.99 + rand() * 0.07,
          opacity: 0.97,
          layer: 'near'
        });
      }
    }

    // PATH EDGE DRESSING -----------------------------------------------------
    // A low almost-continuous grass line sits directly on each raised shoulder,
    // hiding the mathematically sharp edge of the path.  Occasional rocks and
    // rooty clumps interrupt that line so it still feels naturally scattered.
    for (let i = 0; i < 145; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -(PATH_BERM_HALF + 0.02 + rand() * 0.34);
      const type = edgeGrass[Math.floor(rand() * edgeGrass.length)];
      const height = 0.25 + rand() * 0.34;
      addObject(midfill, type, x, z, null, height, {
        y: pathGroundYAt(x, z) - 0.015,
        shade: 1.01 + rand() * 0.06,
        opacity: 0.94 + rand() * 0.05,
        layer: 'near'
      });
    }
    for (let i = 0; i < 155; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = PATH_BERM_HALF + 0.02 + rand() * 0.38;
      const type = edgeGrass[Math.floor(rand() * edgeGrass.length)];
      const height = 0.26 + rand() * 0.36;
      addObject(frontOccluders, type, x, z, null, height, {
        y: pathGroundYAt(x, z) - 0.015,
        shade: 0.99 + rand() * 0.06,
        opacity: 0.95 + rand() * 0.04,
        layer: 'foreground'
      });
    }
    for (let i = 0; i < 24; i++) {
      const nearSide = rand() > 0.5;
      const x = TILE.minX + rand() * TILE_WIDTH;
      const zSign = nearSide ? 1 : -1;
      const z = zSign * (PATH_BERM_HALF + 0.10 + rand() * 0.50);
      const type = rocks[Math.floor(rand() * rocks.length)];
      const height = 0.34 + rand() * 0.38;
      addObject(nearSide ? frontOccluders : midfill, type, x, z, null, height, {
        y: pathGroundYAt(x, z) - 0.02,
        shade: 0.98 + rand() * 0.07,
        opacity: 0.96,
        layer: nearSide ? 'foreground' : 'near'
      });
    }

    // FAR SIDE OF PATH -------------------------------------------------------
    // A dense woodland wall starts clearly behind the path, then gradually
    // thins with depth. This is the main silhouette mass behind the character.
    for (let i = 0; i < 178; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const depth = Math.pow(rand(), 1.45); // bias density toward the path edge
      const z = FAR_SIDE_START - 0.55 - depth * 35.5;
      const type = trees[Math.floor(rand() * trees.length)];
      const height = 9.8 + rand() * (8.2 - depth * 1.8);
      addObject(backdrop, type, x, z, null, height, {
        shade: 0.97 + rand() * 0.10,
        opacity: 0.92 + rand() * 0.08,
        layer: classifyLayer(z)
      });
    }

    // Taller canopy accents deeper in the forest keep the upper frame alive.
    for (let i = 0; i < 42; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = -18.0 - rand() * 21.0;
      const type = trees[Math.floor(rand() * trees.length)];
      const height = 14.0 + rand() * 7.5;
      addObject(backdrop, type, x, z, null, height, {
        shade: 1.00 + rand() * 0.08,
        opacity: 0.86 + rand() * 0.10,
        layer: 'far'
      });
    }

    // Dense undergrowth right along the far path edge hides the bases of the
    // first trees and makes the path boundary feel continuous.
    for (let i = 0; i < 230; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const edgeDepth = Math.pow(rand(), 1.8);
      const z = FAR_SIDE_START - 0.20 - edgeDepth * 8.0;
      const type = grassScrub[Math.floor(rand() * grassScrub.length)];
      const height = 0.72 + rand() * 1.40;
      addObject(midfill, type, x, z, null, height, {
        shade: 1.00 + rand() * 0.08,
        opacity: 0.91 + rand() * 0.08,
        layer: classifyLayer(z)
      });
    }

    // A few rocks/bushes extend further back and help blend the first forest
    // band into the fogged middle distance.
    for (let i = 0; i < 88; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = FAR_SIDE_START - 5.0 - rand() * 13.5;
      const type = allGround[Math.floor(rand() * allGround.length)];
      const height = 0.72 + rand() * 1.50;
      addObject(midfill, type, x, z, null, height, {
        shade: 1.02 + rand() * 0.07,
        opacity: 0.86 + rand() * 0.10,
        layer: classifyLayer(z)
      });
    }

    // NEAR SIDE OF PATH ------------------------------------------------------
    // Keep a real clear corridor in front of the character. Woodland begins
    // several world units closer to camera than the character instead of
    // sitting almost on top of the same Z plane.

    // Dense low path-edge strip. At this Z range perspective naturally drops
    // it lower in frame and gives us stronger foreground parallax.
    for (let i = 0; i < 310; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = NEAR_SIDE_START + 0.25 + rand() * 2.25;
      const type = grassScrub[Math.floor(rand() * grassScrub.length)];
      const height = 0.48 + rand() * 0.58;
      addObject(frontOccluders, type, x, z, null, height, {
        shade: 0.99 + rand() * 0.06,
        opacity: 0.95 + rand() * 0.04,
        layer: 'foreground'
      });
    }

    // Mid-near layer: still mostly small, but not tiny. This should fill the
    // lower third rather than leaving isolated postage-stamp props.
    for (let i = 0; i < 230; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = NEAR_SIDE_START + 2.2 + rand() * 2.45;
      const chooseRock = rand() < 0.28;
      const list = chooseRock ? rocks : grassScrub;
      const type = list[Math.floor(rand() * list.length)];
      const height = 0.55 + rand() * 0.72;
      addObject(frontOccluders, type, x, z, null, height, {
        shade: 0.98 + rand() * 0.07,
        opacity: 0.95 + rand() * 0.04,
        layer: 'foreground'
      });
    }

    // Closest strip: dense grass/rocks with enough real-world size to overlap
    // one another and cover the floor, but still low enough not to hide the
    // character when they pass in front.
    for (let i = 0; i < 205; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = NEAR_SIDE_START + 4.6 + rand() * 2.25;
      const type = allGround[Math.floor(rand() * allGround.length)];
      const height = 0.48 + rand() * 0.78;
      addObject(frontOccluders, type, x, z, null, height, {
        shade: 0.98 + rand() * 0.06,
        opacity: 0.96,
        layer: 'foreground'
      });
    }

    // Occasional larger near-side assets give a stronger sense of passing
    // through woodland, but remain uncommon so the path stays readable.
    for (let i = 0; i < 20; i++) {
      const x = TILE.minX + rand() * TILE_WIDTH;
      const z = NEAR_SIDE_START + 2.5 + rand() * 4.5;
      if (rand() < 0.42) {
        const type = trees[Math.floor(rand() * trees.length)];
        const height = 5.2 + rand() * 4.8;
        addObject(frontOccluders, type, x, z, null, height, {
          shade: 0.92 + rand() * 0.08,
          opacity: 0.95,
          layer: 'foreground'
        });
      } else {
        const type = allGround[Math.floor(rand() * allGround.length)];
        const height = 1.05 + rand() * 1.15;
        addObject(frontOccluders, type, x, z, null, height, {
          shade: 0.96 + rand() * 0.07,
          opacity: 0.96,
          layer: 'foreground'
        });
      }
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
  const PUZZLE_STATE_STORAGE_KEY = 'sidescroll.puzzle-groups.state.v1';
  const PUZZLE_START_STORAGE_KEY = 'sidescroll.puzzle-groups.starts.v1';
  const PUZZLE_LIBRARY_STORAGE_KEY = 'sidescroll.puzzle-groups.library.v1';
  const PUZZLE_WORKSHOP_STORAGE_KEY = 'sidescroll.puzzle-groups.workshop.v1';
  const activePuzzleInstances = new Map();
  const puzzleSavedState = (() => {
    try { return JSON.parse(localStorage.getItem(PUZZLE_STATE_STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  })();
  const puzzleStartState = (() => {
    try { return JSON.parse(localStorage.getItem(PUZZLE_START_STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  })();
  const userPuzzleLibrary = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PUZZLE_LIBRARY_STORAGE_KEY) || '{}') || {};
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
    return [...(puzzleConfig.markers || []), ...(userPuzzleLibrary.markers || [])];
  }

  function scenePuzzleMarkers() {
    if (puzzleWorkshopIsolated) return puzzleWorkshopClear ? [] : [...(userPuzzleLibrary.markers || [])];
    return allPuzzleMarkers();
  }

  function allPuzzleGroups() {
    const groups = new Map();
    for (const [id, def] of Object.entries(puzzleConfig.groups || {})) groups.set(id, def);
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
        sx: prop.width ?? null,
        sy: prop.height,
        flip: !!prop.flip,
        deleted: false,
        category: prop.category || 'gameplay',
        gameplayType: prop.gameplayType || null,
        gameplayLayerLocked: true,
        collision: cloneCollision(prop.collision),
        shadow: prop.shadow ? { ...prop.shadow } : null
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
        sx: obj.sx,
        sy: obj.sy,
        flip: !!obj.flip,
        deleted: !!obj.deleted,
        category: obj.category || 'gameplay',
        gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked,
        collision: cloneCollision(obj.collision),
        shadow: obj.shadow ? { ...obj.shadow } : null
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
          collision:cloneCollision(state.collision ?? prop?.collision ?? null),
          shadow:state.shadow || prop?.shadow || null,
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
      obj.collision = cloneCollision(state.collision ?? prop?.collision ?? null);
      obj.shadow = state.shadow || prop?.shadow || obj.shadow || null;
      obj.carried = false;
      obj.y = obj.category === 'gameplay' ? playSurfaceYAt(obj.x) : pathGroundYAt(obj.x, obj.z);
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
    runtime.objects = {};
    for (const obj of instance.objects) {
      runtime.objects[obj.puzzleObjectId] = {
        asset:obj.assetName,
        x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy, flip:!!obj.flip,
        deleted:!!obj.deleted, category:obj.category || 'gameplay', gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked, collision:cloneCollision(obj.collision), shadow:obj.shadow ? { ...obj.shadow } : null
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
      collision:cloneCollision(obj.collision), shadow:obj.shadow ? { ...obj.shadow } : null
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
        y:Number.isFinite(prior?.y) ? prior.y : playSurfaceYAt(x),
        flip:prior?.flip ?? startState?.flip ?? prop?.flip ?? false,
        shade:1, opacity:1, layer:'foreground', wrap:false,
        category:prior?.category || startState?.category || prop?.category || 'gameplay',
        gameplayType:prior?.gameplayType ?? startState?.gameplayType ?? prop?.gameplayType ?? null,
        gameplayLayerLocked:prior?.gameplayLayerLocked ?? startState?.gameplayLayerLocked ?? true,
        collision:cloneCollision(prior?.collision ?? startState?.collision ?? prop?.collision ?? null),
        shadow:prior?.shadow || startState?.shadow || prop?.shadow || null,
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
    for (const list of [backdrop, midfill, frontOccluders]) {
      for (let i=list.length-1;i>=0;i--) if (remove.has(list[i])) list.splice(i,1);
    }
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
    if (!obj || obj.category !== 'dressing' || obj.puzzleInstanceId) return false;
    for (const instance of activePuzzleInstances.values()) {
      const b = puzzleBounds(instance);
      if (!b.hidesDressing) continue;
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

  function checkPuzzleCompletion(playerX) {
    for (const instance of activePuzzleInstances.values()) {
      if (instance.solved) continue;
      const rule = instance.def.completion;
      if (!rule) continue;
      const target = instance.marker.x + rule.x;
      const done = rule.type === 'cross-x' && (rule.direction ?? 1) >= 0 ? playerX >= target : playerX <= target;
      if (!done) continue;
      instance.solved = true;
      const state=savedPuzzleFor(instance.id);state.solved=true;savePuzzleState();
      hintEl.textContent = `${instance.def.label || 'Puzzle'} complete`;
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
    if (override.collision === null) obj.collision = null;
    else if (override.collision) obj.collision = cloneCollision(override.collision);
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
        sx: obj.sx, sy: obj.sy, flip: obj.flip, collision: obj.collision ? cloneCollision(obj.collision) : null,
        category: obj.category || 'dressing', gameplayType: obj.gameplayType || null,
        gameplayLayerLocked: !!obj.gameplayLayerLocked, deleted: !!obj.deleted
      };
      if (saved) Object.assign(saved, payload);
      else sceneData.added.push(payload);
    } else {
      sceneData.overrides[obj.id] = {
        x: obj.x, y: obj.y, z: obj.z, sx: obj.sx, sy: obj.sy, flip: obj.flip,
        collision: obj.collision ? cloneCollision(obj.collision) : null, category: obj.category || 'dressing',
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
      userSceneCounter += 1;
      const collection = saved.category === 'gameplay' || saved.assetName === 'crate' ? frontOccluders : targetCollectionForZ(saved.z);
      const obj = addObject(collection, saved.assetName, saved.x, saved.z, saved.sx, saved.sy, {
        id: saved.id, baseSx: saved.sx, baseSy: saved.sy, flip: saved.flip,
        y: Number.isFinite(saved.y) ? saved.y : ((saved.category === 'gameplay' || saved.assetName === 'crate') ? playSurfaceYAt(saved.x) : pathGroundYAt(saved.x, saved.z)), collision: cloneCollision(saved.collision), deleted: saved.deleted,
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
  let currentViewMatrix = mat4Identity();
  const editorAssetGroups = [
    { scope:'puzzle', title: 'PUZZLE PROPS · WOODLAND', items: [
      { name:'puzzle-log-a', label:'MOVEABLE LOG A', image:'puzzle-log-a.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.84, collision:{halfWidth:0.58,height:0.48,depth:0.62,platform:true} },
      { name:'puzzle-log-b', label:'MOVEABLE LOG B', image:'puzzle-log-b.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.72, collision:{halfWidth:0.46,height:0.42,depth:0.56,platform:true} },
      { name:'puzzle-log-c', label:'MOVEABLE LOG C', image:'puzzle-log-c.png', category:'gameplay', gameplayType:'crate', thumb:'━', defaultHeight:0.76, collision:{halfWidth:0.60,height:0.44,depth:0.60,platform:true} },
      { name:'puzzle-log-d', label:'LONG LOG', image:'puzzle-log-d.png', category:'gameplay', gameplayType:'crate', thumb:'━━', defaultHeight:0.82, collision:{halfWidth:0.75,height:0.46,depth:0.64,platform:true} },
      { name:'fallen-tree', label:'FALLEN TREE', image:'fallen-tree.png', category:'gameplay', gameplayType:'obstacle', thumb:'⌁', defaultHeight:2.55, collision:{halfWidth:2.35,height:1.72,depth:1.08,platform:true} },
      { name:'tree-stump', label:'TREE STUMP', image:'tree-stump.png', category:'gameplay', gameplayType:'prop', thumb:'◯', defaultHeight:1.18 },
      { name:'broken-branch', label:'BROKEN BRANCH', image:'broken-branch.png', category:'gameplay', gameplayType:'prop', thumb:'⟍', defaultHeight:0.78 }
    ]},
    { scope:'puzzle', title: 'PUZZLE PROPS · STONE WALL', items: [
      { name:'stone-wall', label:'STONE WALL', image:'stone-wall.png', category:'dressing', gameplayType:'prop', thumb:'▦', defaultHeight:1.75, gameplayLayerLocked:false },
      { name:'stone-piece-a', label:'STONE PIECE A', image:'stone-piece-a.png', category:'gameplay', gameplayType:'prop', thumb:'△', defaultHeight:0.72 },
      { name:'stone-piece-b', label:'STONE PIECE B', image:'stone-piece-b.png', category:'gameplay', gameplayType:'prop', thumb:'◒', defaultHeight:0.74 },
      { name:'stone-piece-c', label:'STONE PIECE C', image:'stone-piece-c.png', category:'gameplay', gameplayType:'prop', thumb:'⬡', defaultHeight:0.74 }
    ]},
    { scope:'environment', title: 'DRESSING · TREES', items: [
      'tree01','tree02','tree03','tree04','tree05','tree06'
    ].map(name => ({ name, label: `TREE ${Number(name.slice(-2))}`, category: 'dressing' }))},
    { scope:'environment', title: 'DRESSING · GROUND', items: [
      'ground01','ground02','ground03','ground04','ground05','ground06',
      'ground07','ground08','ground09','ground10','ground11','ground12'
    ].map(name => ({ name, label: `GROUND ${Number(name.slice(-2))}`, category: 'dressing' }))}
  ];
  const editorAssetInfo = new Map(editorAssetGroups.flatMap(group => group.items.map(item => [item.name, item])));
  let assetSetupName = null;

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
        ? 'Socket tags are stored now; spatial socket authoring will be added in the next editor pass.'
        : 'These are defaults for every copy of this asset. Changes save automatically.';
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
    if (!obj.collision && behaviourNeedsCollision(behaviour)) {
      obj.collision = behaviourCollisionFor(obj.assetName, obj.sx, obj.sy, null);
    } else if (obj.collision) {
      obj.collision.platform = !!behaviour.supportSurface;
      if (obj.collision.behaviourGenerated && !behaviourNeedsCollision(behaviour)) obj.collision = null;
    }
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
    saveAssetBehaviourOverrides();
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

  function showAssetBrowser() {
    assetSetupName = null;
    if (assetSetupEl) assetSetupEl.hidden = true;
    if (editorAssetsEl) editorAssetsEl.hidden = false;
    if (editorPaletteTitle) editorPaletteTitle.textContent = editorScope === 'puzzle' ? 'Puzzle Assets' : 'Environment Assets';
    if (editorPaletteSubtitle) editorPaletteSubtitle.textContent = editorScope === 'puzzle'
      ? 'Tap an asset to place it · Setup edits reusable behaviours'
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
    hintEl.textContent = 'Linked puzzle instance spawned here · edit it, then Save to Template or Save Unique';
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
      label.textContent = `${orphan ? 'ORPHAN · ' : ''}${obj.puzzleObjectId || obj.id} · ${obj.assetName || 'unknown'}${obj.deleted ? ' · deleted' : ''}`;
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
        sx:obj.sx,
        sy:obj.sy,
        flip:!!obj.flip,
        deleted:!!obj.deleted,
        category:obj.category || 'gameplay',
        gameplayType:obj.gameplayType || null,
        gameplayLayerLocked:!!obj.gameplayLayerLocked,
        collision:cloneCollision(obj.collision),
        shadow:obj.shadow ? { ...obj.shadow } : null
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
      collision:cloneCollision(obj.collision)
    }));
    const orphans = puzzleOrphanObjects(instance).map(obj => ({
      id:obj.id, asset:obj.assetName, x:obj.x, y:obj.y, z:obj.z, sx:obj.sx, sy:obj.sy,
      deleted:!!obj.deleted, hasTexture:!!obj.texture, category:obj.category, gameplayType:obj.gameplayType
    }));
    return {
      format:'SideScrollPuzzle',
      formatVersion:1,
      appVersion:'0.2.21',
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
        format:'SideScrollPuzzleTemplate', formatVersion:1, appVersion:'0.2.21', exportedAt:new Date().toISOString(),
        group:groupId, definition:deepCopy(def), savedStart:deepCopy(templateStartForGroup(groupId)),
        source:groupIsUserCreated(groupId) ? 'local-library' : 'library'
      };
      filename = `SideScroll-${puzzleSlug(def.label || groupId)}-template.json`;
    } else {
      const instance = selectedPuzzleInstance();
      if (!instance) return;
      payload = puzzleExportPayload(instance);
      filename = `SideScroll-${puzzleSlug(instance.def?.label || instance.marker.group)}-${puzzleSlug(instance.marker.id)}.json`;
    }
    const text = JSON.stringify(payload,null,2);
    const blob = new Blob([text], {type:'application/json'});
    try {
      const file = new File([blob], filename, {type:'application/json'});
      if (navigator.canShare?.({files:[file]})) {
        await navigator.share({title:'SideScroll puzzle export', files:[file]});
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

  function setEditorScope(scope) {
    if (scope !== 'environment' && scope !== 'puzzle') return;
    // Environment/Puzzle is only an editor filter. It must not change whether
    // the workshop stage is isolated or clear.
    editorScope = scope;
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

  function updateEditorButtons() {
    const has = !!selectedObject && !selectedObject.deleted;
    const collisionFocus = !!(has && collisionEditMode);
    const isGameplay = has && selectedObject.category === 'gameplay';
    const placing = placementModeActive();
    if (editorControls) editorControls.hidden = !editMode || !has || placing;
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
    if (editorDuplicateBtn) editorDuplicateBtn.hidden = !has || collisionFocus;
    if (editorScaleDownBtn) editorScaleDownBtn.hidden = !has || collisionFocus;
    if (editorScaleUpBtn) editorScaleUpBtn.hidden = !has || collisionFocus;
    if (editorGameLayerBtn) {
      editorGameLayerBtn.hidden = !isGameplay || collisionFocus;
      editorGameLayerBtn.classList.toggle('active', !!(isGameplay && selectedObject.gameplayLayerLocked));
    }
    if (editorCollisionBtn) {
      editorCollisionBtn.hidden = !has;
      editorCollisionBtn.classList.toggle('active', !!(selectedObject?.collision && collisionEditMode));
    }
    if (editorDeleteBtn) editorDeleteBtn.hidden = !has || collisionFocus;
  }

  function selectObject(obj, preserveCycle = false, options = {}) {
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
                        ? 'This copy is active for editing. Save Copy changes only this scene puzzle.'
                        : 'This instance is active for editing. Save to Template updates linked instances; Save Unique detaches this one.')
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
      puzzleSetStartBtn.textContent = linkMode === 'copy' ? 'Save Copy' : 'Save to Template';
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
      hintEl.textContent = 'Unique scene copy saved';
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
      hintEl.textContent = 'Template updated · all linked instances now use this setup';
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

  function resetCurrentPuzzle() {
    const instance = authoringPuzzle();
    if (!instance) return;
    if (puzzleTestMode && puzzleTestSnapshot) {
      applyPuzzleSnapshot(instance, puzzleTestSnapshot, { persistRuntime:false, clearDirty:false });
      positionPlayerAtPuzzleEntry(instance);
      hintEl.textContent = 'Test reset to the setup you started this test with';
    } else {
      applyPuzzleStart(instance, { persistRuntime:true });
      hintEl.textContent = 'Puzzle reset to its saved start';
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
    if (on && !editorPuzzlePackPinned) { ensurePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = true; }
    if (!on && editorPuzzlePackPinned) { releasePuzzleAssetPack('woodland-puzzle-atlas-v1'); editorPuzzlePackPinned = false; }
    if (on && interactionState) {
      if (interactionState.type === 'pickup') interactionState.object.carried = false;
      else completeDrop();
      interactionState = null;
    }
    if (on && carriedObject) dropCarriedImmediate();
    if (!on) { collisionEditMode = false; collisionHandleIndex = -1; }
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
    if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
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
      wrap:!puzzleInstance, puzzleInstanceId:puzzleInstance?.id || null, puzzleObjectId
    });
    if (puzzleInstance) puzzleInstance.objects.push(obj);
    if (obj.category === 'gameplay') obj.y = restYForGameplayObject(obj, obj.x, null, true);
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
      selectedObject.collision.halfWidth *= ratio;
      selectedObject.collision.height = isGameplayCrate(selectedObject)
        ? STACK_ITEM_HEIGHT
        : selectedObject.collision.height * ratio;
    }
    selectedObject.y = selectedObject.category === 'gameplay'
      ? restYForGameplayObject(selectedObject)
      : pathGroundYAt(selectedObject.x, selectedObject.z);
    if (selectedObject.category === 'gameplay') settleGameplayCrates();
    recordObjectEdit(selectedObject);
    updateEditorButtons();
  }

  function toggleSelectedCollision() {
    if (!selectedObject || selectedObject.deleted) return;
    if (!selectedObject.collision) {
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
      if (assetSetupEl) assetSetupEl.hidden = true;
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
    editorAssetsEl.innerHTML = '';
    const allowedPuzzleAssets = editorScope === 'puzzle' ? puzzleAssetNamesFor(editorPuzzleMarkerId) : null;
    for (const group of editorAssetGroups) {
      if (group.scope !== editorScope) continue;
      const items = group.items.filter(info => editorScope !== 'puzzle' || !allowedPuzzleAssets?.size || allowedPuzzleAssets.has(info.name));
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
          btn.innerHTML = `<span class="sidescroll-asset-thumb"><img src="${file}?v=0.2.28" alt="" loading="eager"></span><small>${info.label}</small>`;
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
        if (editorScope === 'puzzle') {
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
      if (target?.stack) {
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
    const label = `COLLISION · stack ${STACK_ITEM_HEIGHT.toFixed(2)} · carry ${CARRY_BOTTOM.toFixed(2)} · search ${STACK_SEARCH_RADIUS.toFixed(2)}`;
    const tw = ctx.measureText(label).width + 16;
    const x = Math.max(8, (ctx.canvas.clientWidth - tw) * 0.5);
    const y = 48;
    ctx.fillStyle = 'rgba(18,27,31,.78)';
    ctx.fillRect(x, y, tw, 22);
    ctx.fillStyle = 'rgba(240,246,245,.96)';
    ctx.fillText(label, x + 8, y + 15);
    ctx.restore();
  }

  function drawEditorOverlay() {
    if (!editorOverlayCtx || !editorOverlay) return;
    const ctx = editorOverlayCtx;
    const w = editorOverlay.clientWidth;
    const h = editorOverlay.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (collisionDebugView) drawCollisionDebugOverlay(ctx);
    if (!editMode) return;
    drawPuzzleEditorGuides(ctx);

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

    if (addAssetType) {
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
      const top = stackableFitsSupport(obj, other, aroundX);
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
      // Slightly greener vegetation against the warmer path, while preserving
      // the original illustrated texture values and the cool fog depth cue.
      if ((obj.assetName || '').startsWith('tree')) return [obj.shade * 0.94, obj.shade * 1.025, obj.shade * 0.94];
      return [obj.shade * 0.96, obj.shade * 1.015, obj.shade * 0.95];
    }
    const base = [0.155, 0.165, 0.172];
    return [base[0] * obj.shade, base[1] * obj.shade, base[2] * obj.shade];
  }

  function drawObjectShadow(obj, view, drawX) {
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
    gl.uniform1f(loc.fogNear, 6.2);
    gl.uniform1f(loc.fogFar, 44.0);
    gl.uniform1f(loc.fogAmount, debugDepth ? 0.08 : (shadow.fogAmount ?? 0.28));
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
    gl.uniformMatrix4fv(loc.model, false, mat4Model(drawX, obj.y, obj.z, obj.sx, obj.sy, obj.sz, obj.flip));
    gl.uniformMatrix4fv(loc.view, false, view);
    gl.uniformMatrix4fv(loc.projection, false, projection);
    const tint = tintFor(obj);
    gl.uniform3f(loc.tint, tint[0], tint[1], tint[2]);
    const selectedHighlight = editMode && obj === selectedObject ? 1.0 : 0.0;
    gl.uniform1f(loc.highlight, selectedHighlight);
    gl.uniform3f(loc.highlightColor, 1.0, 0.18, 0.48);
    gl.uniform3f(loc.fogColor, fogColor[0], fogColor[1], fogColor[2]);
    gl.uniform1f(loc.fogNear, 6.2);
    gl.uniform1f(loc.fogFar, 44.0);
    gl.uniform1f(loc.fogAmount, obj.noFog ? 0 : (debugDepth ? 0.22 : 1.0));
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
    gl.uniform1f(loc.fogNear, 6.2);
    gl.uniform1f(loc.fogFar, 44.0);
    gl.uniform1f(loc.fogAmount, debugDepth ? 0.22 : 1.0);
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

    for (const candidate of allSceneObjects()) {
      if (!isCarryableObject(candidate)) continue;

      // Treat a vertical stack as one interaction target and always expose its
      // highest member.  Previously the wider/lower log often had the smallest
      // edge distance, so ACTION could pull it out from underneath the stack.
      let obj = candidate;
      if (isGameplayCrate(candidate)) {
        const anchor = stackBottomFor(candidate, characterXNow);
        const column = stackColumnFor(anchor, characterXNow);
        if (column?.members?.length) {
          const stackKey = `${anchor.id || anchor.assetName}:${column.x.toFixed(3)}`;
          if (seenStacks.has(stackKey)) continue;
          seenStacks.add(stackKey);
          obj = column.members[column.members.length - 1];
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
    obj.carried = true;
    // If this was the lower crate in a stack, the remaining crates settle onto
    // the next available support immediately rather than being left floating.
    settleGameplayCrates();
    interactionState = {
      type: 'pickup',
      time: 0,
      duration: PICKUP_DURATION,
      object: obj,
      startX: objectXNear(obj, characterXNow),
      startY: obj.y,
      startZ: obj.z
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
    hintEl.textContent = 'Carrying · ACTION puts the item down';
    hintEl.classList.remove('hidden');
  }

  function stackBottomFor(candidate, aroundX) {
    if (!isGameplayCrate(candidate)) return candidate;
    let current = candidate;
    let guard = 0;
    while (guard++ < 12) {
      const currentX = objectXNear(current, aroundX);
      let lower = null;
      let lowerTop = -Infinity;
      for (const other of allSceneObjects()) {
        if (other === current || !isGameplayCrate(other)) continue;
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

  function stackColumnFor(anchor, aroundX) {
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
        if (used.has(other) || other === carriedObject || !isGameplayCrate(other)) continue;
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
    const z = carriedObject?.gameplayLayerLocked === false ? carriedObject.z : pathZ;

    // Placement intent is deliberately broader than physical collision. Once
    // a stack is recognised, its centre and next standard layer define the
    // target directly. This keeps 2nd/3rd/4th items deterministic even when
    // the carried prop is wider than the prop underneath.
    const stack = stackTargetNear(rootX, facing);
    if (stack) x = stack.x;

    const temp = carriedObject ? { ...carriedObject, x, z, carried: false } : null;
    if (temp?.collision && isGameplayCrate(temp)) temp.collision = { ...temp.collision, height: STACK_ITEM_HEIGHT };
    const y = stack
      ? stack.topY
      : (temp ? restYForGameplayObject(temp, x, null, true) : playSurfaceYAt(x));
    const target = { x, z, y, stack };
    const ignoredStackObjects = stack ? new Set(stack.members) : null;
    target.valid = temp ? dropTargetIsClear(temp, target, ignoredStackObjects) : true;
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
      targetZ: target.z
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
    obj.z = obj.gameplayLayerLocked === false ? interactionState.targetZ : pathZ;
    obj.carried = false;
    obj.y = interactionState.targetY;
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
    obj.z = obj.gameplayLayerLocked === false ? target.z : pathZ;
    obj.carried = false;
    obj.y = target.y;
    carriedObject = null;
    interactionState = null;
    moveObjectToCorrectCollection(obj);
    sortSceneCollections();
    settleGameplayCrates();
    recordObjectEdit(obj);
  }

  function performAction() {
    if (editMode || interactionState || autoDropStep) return;
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
    const rawAxis = (editMode || interactionState || autoDropStep) ? 0 : (usingKeys ? keyDir * (keyRun ? 1 : WALK_POINT) : driveAxis);
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
    updatePuzzleStreaming(character.x);
    checkPuzzleCompletion(character.x);

    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const eye = [camera.x, camera.y, camera.z];
    const target = [camera.x, camera.targetY, camera.targetZ];
    const view = mat4LookAt(eye, target, [0, 1, 0]);
    currentViewMatrix = view;

    drawObject(ground, view);
    drawObject(pathStrip, view);
    for (const obj of backdrop) drawObject(obj, view);
    for (const obj of midfill) drawObject(obj, view);

    drawRigCharacter(view, isWalking);

    for (const obj of frontOccluders) drawObject(obj, view);

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
      statusEl.textContent = debugDepth
        ? `Depth view · camera X ${camera.x.toFixed(1)} · raised path geometry${puzzleLabel}`
        : `3D forest · ${motionLabel} · camera X ${camera.x.toFixed(1)}${puzzleLabel}`;
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
    if (editMode || jumping || interactionState) return;
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
  puzzleMarkerXInput?.addEventListener('change', commitMarkerXInput);
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
    setAssetPaletteOpen(false);
    updateAssetPaletteState();
    updatePlacementModeUi();
    updateEditorButtons();
  });
  bindEditorPress(assetSetupBackBtn, showAssetBrowser);
  bindEditorPress(assetBehaviorResetBtn, () => {
    if (!assetSetupName) return;
    if (!window.confirm(`Reset ${editorAssetInfo.get(assetSetupName)?.label || assetSetupName} behaviour tags to their built-in defaults?`)) return;
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
    try { localStorage.removeItem(ASSET_BEHAVIOUR_STORAGE_KEY); } catch (_) {}
    window.location.reload();
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

      if (addAssetType) {
        // Placement mode follows the same editor gesture language as Setup:
        // drag empty space to pan, tap empty space to place, tap an existing
        // prop to select it, and drag only the already-selected prop to move it.
        editorGesture.placement = true;
        if (selectedObject && editorObjectIsEditable(selectedObject) && pointInsideScreenBounds(e.clientX,e.clientY,objectScreenBounds(selectedObject),3)) {
          editorGesture.kind = 'selected-object';
          editorGesture.object = selectedObject;
        } else {
          editorGesture.kind = 'placement-pan';
        }
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
      }
      return;
    }

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
        const point = groundPointFromClient(e.clientX,e.clientY);
        // Horizontal editing now uses the same world-per-pixel scale as scene
        // panning. This makes the selected asset visually track the finger
        // instead of perspective projection making it race ahead.
        obj.x = editorGesture.objectStartX + dx * 0.0065;
        obj.z = obj.category === 'gameplay' && obj.gameplayLayerLocked
          ? pathZ
          : (point && editorGesture.startGround
              ? Rig.clamp(editorGesture.objectStartZ + (point.z-editorGesture.startGround.z)*0.55, WORLD.farZ+0.8, WORLD.nearZ-0.6)
              : editorGesture.objectStartZ);
        obj.y = obj.category === 'gameplay' ? restYForGameplayObject(obj) : pathGroundYAt(obj.x,obj.z);
        moveObjectToCorrectCollection(obj);sortSceneCollections();selectionCycleInfo=null;
      } else if (editorGesture.kind === 'collision-handle' && selectedObject?.collision && collisionHandleIndex >= 0) {
        const bounds=collisionRectScreenBounds(selectedObject); if(!bounds) return;
        const rect=canvas.getBoundingClientRect(); const lx=e.clientX-rect.left, ly=e.clientY-rect.top;
        const nx=Rig.clamp((((lx-bounds.left)/Math.max(1,bounds.right-bounds.left))*2)-1,-4.0,4.0);
        const ny=Rig.clamp((bounds.bottom-ly)/Math.max(1,bounds.bottom-bounds.top),-0.20,3.0);
        const points=normalisedCollisionPoints(selectedObject.collision).map(point=>({...point}));
        if(points[collisionHandleIndex]){points[collisionHandleIndex].x=nx;points[collisionHandleIndex].y=ny;selectedObject.collision.points=points;}
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
          if (gesture.kind==='selected-object' && gesture.object) recordObjectEdit(gesture.object);
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
      if (e.key === 'Escape') { selectObject(null); setAssetPaletteOpen(false, { clearPending:true }); updateAssetPaletteState(); }
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
  setEditMode(false);
  updatePuzzlePanel();
  resize();
  requestAnimationFrame(render);
})();
