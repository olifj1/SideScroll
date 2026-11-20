/* SideScroll — draw a character into a texture (window.SideScrollCharacterPreview).
 *
 * Asset Lab previews character effects (Dissolve) on a real character: this
 * draws the character's own mesh (character-game-runtime.js, the game's mesh
 * data and posing), in any of its animations, holding one of its props
 * (character-props.js), into a framebuffer texture on the effect renderer's
 * WebGL context. effects.js then draws that texture through the effect, the way
 * the game does with drawDissolvedCharacter.
 *
 * Bipeds drawn as a Mesh only (library characters, and original characters
 * whose drawing method is Mesh); the others keep the sample picture.
 */
(() => {
  'use strict';
  const Chars = window.SideScrollGameCharacters, Rig = window.GameHubWalkRig, Props = window.SideScrollProps;
  const Registry = window.SideScrollCharacters, AssetLib = window.SideScrollAssetLibrary;
  const assetPath = window.SideScrollAssetPath || (url => url);
  if (!Chars || !Rig) return;

  // Characters it can draw: [{id, name}].
  function characters() {
    const out = [];
    for (const c of Chars.list()) if (c.family === 'biped') out.push({ id: c.id, name: Registry?.name?.(c.id) || c.label || c.id });
    for (const id of Chars.originalMeshIds?.() || []) if (Chars.familyOf?.(id) === 'biped') out.push({ id, name: Registry?.name?.(id) || id });
    return out;
  }
  const animations = id => Chars.animationsFor?.(id) || [];
  // The props it has a grip for (Character Lab → Props): asset names.
  const holdsOf = id => Object.keys((Chars.find?.(id) || Chars.meshFor(id))?.setup?.holds || {});
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
    function poseFor(id, data, animation, phase) {
      const clip = animation ? Chars.clipFor?.(id, animation) : null;
      const pose = clip ? Chars.sampleBipedClip({ family: 'biped', sparseClips: { a: clip } }, 'a', phase, Rig) : null;
      return pose || Rig.restPose(data.setup.rig);
    }
    // The character's height (rig units), measured once from its rest pose.
    function heightOf(id, data) {
      if (heights.has(id)) return heights.get(id);
      Chars.poseParts(data, Rig.restPose(data.setup.rig), Rig);
      let top = 0;
      for (const part of data.parts) for (let i = 1; i < part.buffer.length; i += 5) top = Math.max(top, part.buffer[i]);
      const h = top > 0.05 ? top : 0.8;
      heights.set(id, h);
      return h;
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
      const data = Chars.meshFor(id);
      if (!data) {
        if (!loading.has(id)) { loading.add(id); Chars.load(id).catch(() => {}).finally(() => loading.delete(id)); }
        return null;
      }
      const H = heightOf(id, data);
      const pose = poseFor(id, data, opts.animation, opts.phase || 0);
      Chars.poseParts(data, pose, Rig);
      let top = 0;
      for (const part of data.parts) for (let i = 1; i < part.buffer.length; i += 5) top = Math.max(top, part.buffer[i]);
      // Framed like the game's dissolve box: room above for drifting flecks.
      const x0 = -0.75 * H, x1 = 0.75 * H, y0 = -0.08 * H, y1 = 1.45 * H;
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
      if (opts.prop && Props) {
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
      return { texture: target.tex, aspect, body: [(0 - y0) / (y1 - y0), (Math.max(top, 0.1) - y0) / (y1 - y0)] };
    }
    return { render };
  }

  window.SideScrollCharacterPreview = Object.freeze({ characters, animations, holdsOf, propLabel, create });
})();
