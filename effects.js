/* SideScroll — shader effects (window.SideScrollEffects).
 *
 * An effect asset is a flat plane drawn by a shader instead of an image (Asset Lab →
 * + New effect). Its settings are plain numbers and colours, so sequences can later
 * animate them. Asset Lab previews it on its own canvas; the game renders each visible
 * copy into a small texture every frame (renderer.render into a framebuffer) and then
 * draws it like any other asset, so fog, depth and placement behave the same.
 *
 * Shaders: 'darkness' — a dark whirlwind: a twisting funnel of smoke with flecks
 * floating, orbiting and spinning inside it.
 */
(function () {
  'use strict';

  const DARKNESS_PARAMS = [
    { key:'opacity',    label:'Opacity',        min:0,     max:1,    step:0.01,  value:0.95 },
    { key:'speed',      label:'Swirl speed',    min:0,     max:5,    step:0.05,  value:1.2 },
    { key:'twist',      label:'Twist',          min:0,     max:20,   step:0.1,   value:6 },
    { key:'rise',       label:'Rise',           min:-2,    max:3,    step:0.05,  value:0.6 },
    { key:'density',    label:'Density',        min:0,     max:2,    step:0.01,  value:1 },
    { key:'softness',   label:'Edge softness',  min:0.05,  max:1,    step:0.01,  value:0.35 },
    { key:'base',       label:'Width at base',  min:0.02,  max:1,    step:0.01,  value:0.25 },
    { key:'top',        label:'Width at top',   min:0.02,  max:1,    step:0.01,  value:0.85 },
    { key:'turbulence', label:'Turbulence',     min:0.2,   max:3,    step:0.05,  value:1 },
    { key:'coreColor',  label:'Core colour',    type:'color', value:[0.04, 0.035, 0.07] },
    { key:'edgeColor',  label:'Edge colour',    type:'color', value:[0.17, 0.15, 0.22] },
    { key:'flecks',     label:'Flecks',         min:0,     max:1,    step:0.01,  value:0.7 },
    { key:'fleckSpeed', label:'Fleck speed',    min:0,     max:6,    step:0.05,  value:2 },
    { key:'fleckSize',  label:'Fleck size',     min:0.004, max:0.06, step:0.001, value:0.03 },
    { key:'fleckColor', label:'Fleck colour',   type:'color', value:[0.74, 0.7, 0.86] }
  ];
  const SHADERS = { darkness: { label:'Darkness whirlwind', params:DARKNESS_PARAMS } };

  function defaults(shader = 'darkness') {
    const out = {};
    for (const p of (SHADERS[shader] || SHADERS.darkness).params) out[p.key] = Array.isArray(p.value) ? [...p.value] : p.value;
    return out;
  }
  // Clamps saved values to each control's range; missing values take the default.
  function clean(shader, params) {
    const out = defaults(shader), src = params && typeof params === 'object' ? params : {};
    for (const p of (SHADERS[shader] || SHADERS.darkness).params) {
      const v = src[p.key];
      if (p.type === 'color') {
        if (Array.isArray(v) && v.length >= 3) out[p.key] = v.slice(0, 3).map((c, i) => { const n = Number(c); return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : out[p.key][i]; });
      } else {
        const n = Number(v);
        if (Number.isFinite(n)) out[p.key] = Math.min(p.max, Math.max(p.min, n));
      }
    }
    return out;
  }

  const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const DARKNESS_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uOpacity, uSpeed, uTwist, uRise, uDensity, uSoft, uBase, uTop, uTurb;
uniform float uFlecks, uFleckSpeed, uFleckSize, uAspect;
uniform vec3 uCore, uEdge, uFleckColor;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  float y = vUv.y, x = vUv.x * 2.0 - 1.0;
  // The funnel: its half-width at this height, swaying gently.
  float w = max(mix(uBase, uTop, y), 0.02);
  float sway = (fbm(vec2(y * 2.0, uTime * 0.3)) - 0.5) * 0.25 * uTurb;
  float xc = (x - sway) / w;
  // Smoke wrapped round a cylinder: bands twist with height and turn with time.
  float ang = asin(clamp(xc, -1.0, 1.0));
  float band = ang * 1.2 + y * uTwist - uTime * uSpeed;
  float n1 = fbm(vec2(band * 1.5, y * 3.0 * uTurb - uTime * uRise));
  float n2 = fbm(vec2(band * 3.0 + 5.0, y * 6.0 * uTurb - uTime * uRise * 1.7));
  // Ragged edges and a wispy, uneven top instead of straight cuts.
  float wisp = (fbm(vec2(band * 2.0 + 11.0, y * 4.0 - uTime * uRise * 1.3)) - 0.5) * uTurb;
  float ends = smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.62 + n1 * 0.3, 1.0, y));
  float body = (1.0 - smoothstep(1.0 - uSoft, 1.0, abs(xc) + wisp * 0.45)) * ends;
  float smoke = clamp((n1 * 0.65 + n2 * 0.5) * uDensity * 1.4 - 0.25, 0.0, 1.0);
  float core = 1.0 - smoothstep(0.0, 1.0, abs(xc));
  vec3 col = mix(uEdge, uCore, clamp(core * 0.9 + smoke * 0.3, 0.0, 1.0));
  // Denser towards the middle, so the funnel reads as a solid dark mass.
  float alpha = body * clamp(smoke + core * 0.55 * uDensity, 0.0, 1.0);
  // Flecks: small spinning slivers orbiting inside the funnel and drifting up.
  float fa = 0.0;
  for (int i = 0; i < 32; i++) {
    float fi = float(i);
    if (fi >= uFlecks * 32.0) break;
    float h1 = hash(vec2(fi, 1.3)), h2 = hash(vec2(fi, 7.1)), h3 = hash(vec2(fi, 4.7));
    float fy = fract(h2 + uTime * (0.03 + 0.05 * h3) * (0.4 + abs(uRise)));
    float fw = max(mix(uBase, uTop, fy), 0.02);
    float th = h1 * 6.2831 + uTime * uFleckSpeed * (0.6 + h3) + fy * uTwist;
    float fx = sin(th) * fw * (0.3 + 0.6 * h3) + sway;
    float depth = cos(th);
    vec2 d = vec2((x - fx) * uAspect * 0.5, y - fy);
    float rot = uTime * (2.0 + h1 * 4.0) + fi;
    vec2 r = vec2(cos(rot) * d.x - sin(rot) * d.y, sin(rot) * d.x + cos(rot) * d.y);
    float size = uFleckSize * (0.6 + 0.8 * h2) * (0.75 + 0.25 * depth);
    float m = 1.0 - smoothstep(size * 0.4, size, length(r * vec2(1.0, 2.6)));
    fa = max(fa, m * mix(0.35, 1.0, step(0.0, depth)));
  }
  fa *= ends;
  col = mix(col, uFleckColor, fa);
  alpha = max(alpha, fa);
  gl_FragColor = vec4(col, alpha * uOpacity);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('Effect shader: ' + gl.getShaderInfoLog(s));
    return s;
  }

  // A renderer in an existing WebGL context. The caller binds the target framebuffer
  // and viewport; render() draws one full-target triangle and leaves blending off.
  function createRenderer(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, DARKNESS_FRAGMENT));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Effect program: ' + gl.getProgramInfoLog(program));
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const u = {};
    for (const name of ['uTime', 'uOpacity', 'uSpeed', 'uTwist', 'uRise', 'uDensity', 'uSoft', 'uBase', 'uTop', 'uTurb', 'uFlecks', 'uFleckSpeed', 'uFleckSize', 'uAspect', 'uCore', 'uEdge', 'uFleckColor'])
      u[name] = gl.getUniformLocation(program, name);
    return {
      render(params, time, aspect) {
        const p = params;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uOpacity, p.opacity); gl.uniform1f(u.uSpeed, p.speed); gl.uniform1f(u.uTwist, p.twist);
        gl.uniform1f(u.uRise, p.rise); gl.uniform1f(u.uDensity, p.density); gl.uniform1f(u.uSoft, p.softness);
        gl.uniform1f(u.uBase, p.base); gl.uniform1f(u.uTop, p.top); gl.uniform1f(u.uTurb, p.turbulence);
        gl.uniform1f(u.uFlecks, p.flecks); gl.uniform1f(u.uFleckSpeed, p.fleckSpeed); gl.uniform1f(u.uFleckSize, p.fleckSize);
        gl.uniform1f(u.uAspect, aspect || 0.6);
        gl.uniform3fv(u.uCore, p.coreColor); gl.uniform3fv(u.uEdge, p.edgeColor); gl.uniform3fv(u.uFleckColor, p.fleckColor);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  // A standalone canvas renderer (Asset Lab preview, thumbnails). One shared
  // WebGL context, resized per use, so pages never hold many contexts.
  let shared = null;
  function canvasRenderer() {
    if (shared) return shared;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { premultipliedAlpha:false, preserveDrawingBuffer:true, alpha:true });
    if (!gl) return null;
    const renderer = createRenderer(gl);
    shared = {
      canvas,
      render(art, time) {
        const h = 384, w = Math.max(16, Math.round(h * (art.width / Math.max(1, art.height))));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        renderer.render(clean(art.shader, art.params), time, w / h);
        return canvas;
      }
    };
    return shared;
  }
  // A still frame as a PNG data URL (list thumbnails, the game's first frame).
  const thumbs = new Map();
  function thumbnail(art) {
    const key = JSON.stringify([art.shader, art.width, art.height, art.params]);
    if (thumbs.has(key)) return Promise.resolve(thumbs.get(key));
    const r = canvasRenderer();
    if (!r) return Promise.reject(Error('WebGL unavailable'));
    const url = r.render(art, 2.5).toDataURL('image/png');
    if (thumbs.size > 40) thumbs.clear();
    thumbs.set(key, url);
    return Promise.resolve(url);
  }

  window.SideScrollEffects = { SHADERS, defaults, clean, createRenderer, canvasRenderer, thumbnail };
})();
