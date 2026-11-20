/* SideScroll — draw a character into a texture (window.SideScrollCharacterPreview).
 *
 * Asset Lab previews character effects (Dissolve) on a real character: this
 * draws the character's own mesh (character-game-runtime.js, the game's mesh
 * data and posing), in any of its animations, holding one of its props
 * (character-props.js), into a framebuffer texture on the effect renderer's
 * WebGL context. effects.js then draws that texture through the effect, the way
 * the game does with drawDissolvedCharacter.
 *
 * Every character: those drawn as a Mesh (two- or four-legged; library and
 * original) from their mesh, and original two-legged characters still drawn
 * with parts (Aureli, Hero 2) through the rig's own canvas drawing. Each result
 * carries its size in metres at game scale (2.31 × the character's scale), so
 * Asset Lab draws it beside the player reference as it will be in the game.
 */
(() => {
  'use strict';
  const Chars = window.SideScrollGameCharacters, Rig = window.GameHubWalkRig, Props = window.SideScrollProps;
  const QRig = window.SideScrollQuadrupedRig || null;
  const Registry = window.SideScrollCharacters, AssetLib = window.SideScrollAssetLibrary;
  const assetPath = window.SideScrollAssetPath || (url => url);
  if (!Chars || !Rig) return;

  const BASE_SCALE = 2.31, SOLE_OFFSET = 0.087; // as the game (BASE_CHARACTER_SCALE, CHARACTER_SOLE_ART_LOCAL_OFFSET)
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const setupMap = read('sidescroll.animlab.setup.v1') || {};
  const sharedClips = read('sidescroll.animlab.sparse.clips.v1')?.families || {};
  const isOriginal = id => !!Rig.CHARACTER_VARIANTS?.[id];
  const familyOf = id => Chars.familyOf?.(id) || Registry?.find?.(id)?.family || Rig.CHARACTER_VARIANTS?.[id]?.rigType || null;
  const rigFor = id => (familyOf(id) === 'quadruped' ? QRig : Rig);
  // How it is drawn: 'mesh' (its own mesh) | 'parts' (original two-legged, atlas parts) | null.
  function methodOf(id) {
    if (Chars.find?.(id) || (Chars.originalMeshIds?.() || []).includes(id)) return rigFor(id) ? 'mesh' : null;
    return isOriginal(id) && familyOf(id) === 'biped' ? 'parts' : null;
  }
  // Characters it can draw, in the registry's order: [{id, name}].
  function characters() {
    const ids = Registry?.list ? Registry.list().filter(c => !c.hidden).map(c => c.id) : [...Object.keys(Rig.CHARACTER_VARIANTS || {}), ...Chars.list().map(c => c.id)];
    return ids.filter(id => methodOf(id)).map(id => ({ id, name: Registry?.name?.(id) || Chars.find?.(id)?.label || id }));
  }
  // The game's scale for a character (characterScaleMultiplier in sidescroll.js).
  function scaleOf(id) {
    const custom = Chars.find?.(id)?.setup;
    const quadruped = familyOf(id) === 'quadruped';
    const current = !(isOriginal(id) && quadruped) || !QRig?.isCurrentBaseline || QRig.isCurrentBaseline(setupMap[id]?.baselineId);
    const raw = custom ? Number(custom.scale) : (current ? Number(setupMap[id]?.scale) : NaN);
    const value = Number.isFinite(raw) ? raw : (quadruped ? Number(QRig?.DEFAULT_SCALE) || 1.71 : 1);
    return Math.max(0.2, Math.min(5, value));
  }
  // How far the game lifts it off the ground (rig units): library characters 0,
  // original ones their variant's sole offset (characterVariantInfo in sidescroll.js).
  const soleOf = id => {
    if (Chars.find?.(id)) return 0;
    const v = Number(Rig.CHARACTER_VARIANTS?.[id]?.soleArtOffset);
    return Number.isFinite(v) ? v : SOLE_OFFSET;
  };
  const reasonOf = id => Chars.reason?.(id) || null;
  const animations = id => Chars.animationsFor?.(id) || [];
  // The props it has a grip for (Character Lab → Props): asset names (two-legged only).
  const setupOf = id => (Chars.find?.(id) || Chars.meshFor(id))?.setup || setupMap[id] || null;
  const holdsOf = id => (Props?.FAMILIES?.[familyOf(id)] ? Object.keys(setupOf(id)?.holds || {}) : []);
  const propLabel = name => Props?.BUILT_IN.find(a => a.name === name)?.label || AssetLib?.get?.(name)?.label || name;

  function create(gl) {
    const compile = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, `
      attribute vec2 aPos; attribute vec2 aUv; uniform vec4 uBox; varying vec2 vUv;
      void main(){ vUv = aUv; gl_Position = vec4((aPos - uBox.xy) / (uBox.zw - uBox.xy) * 2.0 - 1.0, 0.0, 1.0); }`));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform sampler2D uTex; varying vec2 vUv;
      void main(){ gl_FragColor = texture2D(uTex, vUv); }`));
    gl.linkProgram(program);
    const aPos = gl.getAttribLocation(program, 'aPos'), aUv = gl.getAttribLocation(program, 'aUv');
    const uBox = gl.getUniformLocation(program, 'uBox'), uTex = gl.getUniformLocation(program, 'uTex');
    const vbo = gl.createBuffer(), ibo = gl.createBuffer();
    const textures = new Map(); // image → texture
    const propImages = new Map(); // asset name → {img, ready, aspect}
    const target = { fb: gl.createFramebuffer(), tex: gl.createTexture(), w: 0, h: 0 };
    const loading = new Set(), heights = new Map();

    function textureFor(image) {
      let t = textures.get(image);
      if (t) return t;
      t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures.set(image, t);
      return t;
    }
    function propImage(name) {
      if (propImages.has(name)) return propImages.get(name);
      const rec = { img: new Image(), ready: false, aspect: 1 };
      propImages.set(name, rec);
      rec.img.onload = () => { rec.ready = true; rec.aspect = rec.img.naturalWidth / Math.max(1, rec.img.naturalHeight); };
      const builtIn = Props?.BUILT_IN.find(a => a.name === name), imported = AssetLib?.get?.(name);
      if (builtIn) rec.img.src = assetPath(builtIn.image);
      else if (imported) AssetLib.artUrl(imported).then(url => { rec.img.src = url; }).catch(() => {});
      return rec;
    }
    function ensureTarget(w, h) {
      if (target.w === w && target.h === h) return;
      target.w = w; target.h = h;
      gl.bindTexture(gl.TEXTURE_2D, target.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.tex, 0);
    }
    // As the game's storyPose: the character's own clip for the slot, else the
    // shared family clip (original characters), else the built-in frames.
    function poseFor(id, animation, phase, restRig) {
      const key = animation ? (animation.startsWith('clip-') ? animation : (Chars.slotAnimation?.(id, animation) || animation)) : '';
      const clip = (key && Chars.clipFor?.(id, key)) || (key && isOriginal(id) ? sharedClips[familyOf(id)]?.[key] : null) || null;
      if (familyOf(id) === 'quadruped') {
        if (clip && QRig.sampleSparseClip) return QRig.sampleSparseClip(clip, phase);
        return QRig.sampleFrames(QRig.IDLE_FRAMES, key ? phase : 0);
      }
      const pose = clip ? Chars.sampleBipedClip({ family: 'biped', sparseClips: { a: clip } }, 'a', phase, Rig) : null;
      return pose || (restRig ? Rig.restPose(restRig) : Rig.sampleFrames(Rig.DEFAULT_FRAMES, 0.02));
    }
    // Its height (rig units), measured once from its idle / rest pose.
    function heightOf(id, measure) {
      if (heights.has(id)) return heights.get(id);
      const h = Math.max(0.2, measure());
      heights.set(id, h);
      return h;
    }
    // The framing box (rig units): room above for drifting flecks; the ground
    // (rig y = −sole, as the game lifts characters by their sole offset) near the bottom.
    function boxFor(id, H) {
      const ground = -soleOf(id), long = familyOf(id) === 'quadruped';
      const halfW = long ? 0.95 * H : 0.75 * H;
      return { x0: -halfW, x1: halfW, y0: ground - 0.08 * H, y1: ground + 1.45 * H };
    }
    function result(id, box, top, texture) {
      const hUnits = box.y1 - box.y0, aspect = (box.x1 - box.x0) / hUnits, k = BASE_SCALE * scaleOf(id);
      return { texture, aspect, body: [(-soleOf(id) - box.y0) / hUnits, (Math.max(top, 0.1) - box.y0) / hUnits],
        metres: hUnits * k, ground: (-soleOf(id) - box.y0) / hUnits };
    }
    function drawTriangles(texture, vertices, indices) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    const QUAD = new Uint16Array([0, 1, 2, 0, 2, 3]);
    function drawProp(geometry, setup, name) {
      const rec = propImage(name);
      if (!rec.ready) return;
      const hold = Props.holdFor(setup, name, 0.8, setup?.scale), at = Props.place(geometry, hold);
      if (!at) return;
      const h = at.size, w = h * rec.aspect, c = Math.cos(at.angle), s = Math.sin(at.angle);
      const v = new Float32Array(20);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => {
        const lx = sx * w / 2, ly = sy * h / 2, n = i * 5;
        v[n] = at.x + c * lx - s * ly; v[n + 1] = at.y + s * lx + c * ly;
        v[n + 3] = at.flip ? (1 - sx) / 2 : (1 + sx) / 2; v[n + 4] = (1 + sy) / 2;
      });
      drawTriangles(textureFor(rec.img), v, QUAD);
    }

    // Draws the character into a texture. opts: {animation (key), phase 0..1,
    // prop (asset name or '')}. Returns {texture, aspect, body:[feet, head] as
    // 0..1 of the image height}, or null while it is still loading / can't be drawn.
    function render(id, opts = {}) {
      const method = methodOf(id);
      if (method === 'parts') return renderParts(id, opts);
      if (method !== 'mesh') return null;
      const data = Chars.meshFor(id);
      if (!data) {
        if (!loading.has(id) && !reasonOf(id)) { loading.add(id); Chars.load(id).catch(() => {}).finally(() => loading.delete(id)); }
        return null;
      }
      const rig = rigFor(id), biped = rig === Rig;
      const topOf = () => { let top = -Infinity; for (const part of data.parts) for (let i = 1; i < part.buffer.length; i += 5) top = Math.max(top, part.buffer[i]); return top; };
      const H = heightOf(id, () => { Chars.poseParts(data, poseFor(id, 'idle', 0, biped ? data.setup.rig : null), rig); return topOf() + soleOf(id); });
      const pose = poseFor(id, opts.animation, opts.phase || 0, biped ? data.setup.rig : null);
      Chars.poseParts(data, pose, rig);
      const top = topOf();
      const box = boxFor(id, H), { x0, x1, y0, y1 } = box;
      const aspect = (x1 - x0) / (y1 - y0), ht = 512, wd = Math.round(ht * aspect);
      ensureTarget(wd, ht);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
      gl.viewport(0, 0, wd, ht);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // as the game's charFx
      gl.useProgram(program);
      gl.uniform4f(uBox, x0, y0, x1, y1);
      gl.uniform1i(uTex, 0); gl.activeTexture(gl.TEXTURE0);
      gl.enableVertexAttribArray(aPos); gl.enableVertexAttribArray(aUv);
      // The prop goes among the parts where its grip's layer says (as in the game).
      const props = [];
      if (opts.prop && Props && biped) {
        let geometry = null;
        try { geometry = Rig.geometry(pose, data.setup.rig); } catch (_) {}
        const hold = Props.holdFor(data.setup, opts.prop, 0.8, data.setup?.scale);
        const nearArm = p => (p.nearArm ??= Rig.weightsAreNearArm(p.weights));
        if (geometry) props.push({ at: Rig.heldItemIndex(data.parts, Props.layerFor(hold), p => p.id, nearArm), draw: () => drawProp(geometry, data.setup, opts.prop) });
      }
      data.parts.forEach((part, i) => {
        for (const p of props) if (p.at === i) p.draw();
        drawTriangles(textureFor(part.image), part.buffer, part.indices);
      });
      for (const p of props) if (p.at >= data.parts.length) p.draw();
      gl.disableVertexAttribArray(aPos); gl.disableVertexAttribArray(aUv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return result(id, box, top, target.tex);
    }

    // Original two-legged characters drawn with atlas parts: the rig's own canvas
    // drawing (as Character Lab) into a 2D canvas, then into a texture.
    const partsCanvas = document.createElement('canvas'), partsCtx = partsCanvas.getContext('2d');
    const partsTex = gl.createTexture(), atlases = new Map();
    function atlasFor(id) {
      if (atlases.has(id)) return atlases.get(id);
      const img = new Image();
      img.src = assetPath(Rig.atlasImageUrl(id));
      atlases.set(id, img);
      return img;
    }
    function renderParts(id, opts) {
      const atlas = atlasFor(id);
      if (!atlas.complete || !atlas.naturalWidth) return null;
      const restRig = setupMap[id]?.rig || Rig.DEFAULT_REST_RIG;
      const H = heightOf(id, () => {
        let top = 0;
        for (const p of Rig.partsForPose(poseFor(id, 'idle', 0, restRig), restRig)) top = Math.max(top, p.a.y, p.b.y);
        return top * 1.12 + soleOf(id); // parts reach a little past their joints
      });
      const box = boxFor(id, H), hUnits = box.y1 - box.y0;
      const ht = 512, wd = Math.round(ht * (box.x1 - box.x0) / hUnits), ppu = ht / hUnits;
      if (partsCanvas.width !== wd || partsCanvas.height !== ht) { partsCanvas.width = wd; partsCanvas.height = ht; }
      partsCtx.clearRect(0, 0, wd, ht);
      const view = { cx: -box.x0 * ppu, groundY: box.y1 * ppu, scale: ppu, flipX: 1 };
      const pose = poseFor(id, opts.animation, opts.phase || 0, restRig);
      const heldItems = [];
      if (opts.prop && Props) {
        let geometry = null;
        try { geometry = Rig.geometry(pose, restRig); } catch (_) {}
        const setup = setupOf(id), hold = Props.holdFor(setup, opts.prop, 0.8, scaleOf(id)), rec = propImage(opts.prop);
        if (geometry && rec.ready) heldItems.push({ layer: Props.layerFor(hold), draw: () => {
          const at = Props.place(geometry, hold);
          if (!at) return;
          const hPx = at.size * ppu, wPx = hPx * rec.aspect;
          partsCtx.save();
          partsCtx.translate(view.cx + at.x * ppu, view.groundY - at.y * ppu); partsCtx.rotate(-at.angle); if (at.flip) partsCtx.scale(-1, 1);
          partsCtx.drawImage(rec.img, -wPx / 2, -hPx / 2, wPx, hPx);
          partsCtx.restore();
        } });
      }
      const parts = Rig.drawCanvas(partsCtx, atlas, pose, view, { restRig, heldItems });
      let top = 0;
      for (const p of parts || []) top = Math.max(top, p.a.y, p.b.y);
      gl.bindTexture(gl.TEXTURE_2D, partsTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); // the effect expects a premultiplied image
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, partsCanvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return result(id, box, top * 1.12, partsTex);
    }
    return { render };
  }

  window.SideScrollCharacterPreview = Object.freeze({ characters, animations, holdsOf, propLabel, reasonOf, create });
})();
