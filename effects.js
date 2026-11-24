/* SideScroll — shader effects (window.SideScrollEffects).
 *
 * An effect asset is a flat plane drawn by a shader instead of an image (Asset Lab →
 * + New effect). Its settings are plain numbers and colours, so sequences can later
 * animate them. Asset Lab previews it on its own canvas; the game renders each visible
 * copy into a small texture every frame (renderer.render into a framebuffer) and then
 * draws it like any other asset, so fog, depth and placement behave the same.
 *
 * Shaders: 'darkness' — a dark whirlwind: a twisting funnel of smoke with flecks
 * floating, orbiting and spinning inside it. 'fire' — flames rising from the bottom
 * of the plane (tongues that break off, a hot core, glow, smoke and embers).
 * 'dissolve' — a character effect (no plane; see createDissolveRenderer).
 * Plane shaders other than darkness read each setting as a uniform named p_<key>.
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
  // Dissolve: a character effect. The game draws the character into its own image
  // and draws that image back through this shader, so the character itself breaks up.
  const DISSOLVE_PARAMS = [
    { key:'progress',   label:'Dissolve',       min:0,    max:1,   step:0.01, value:0.5 },
    { key:'sweep',      label:'From feet ↔ head', min:-1, max:1,   step:0.05, value:0.6 },
    { key:'scale',      label:'Pattern size',   min:2,    max:30,  step:0.5,  value:9 },
    { key:'edge',       label:'Edge width',     min:0,    max:0.3, step:0.005, value:0.08 },
    { key:'glow',       label:'Edge brightness', min:0,   max:3,   step:0.05, value:1.2 },
    { key:'edgeColor',  label:'Edge colour',    type:'color', value:[0.32, 0.22, 0.5] },
    { key:'darken',     label:'Darken as it goes', min:0, max:1,   step:0.01, value:0.5 },
    { key:'darkColor',  label:'Dark colour',    type:'color', value:[0.05, 0.04, 0.08] },
    { key:'drift',      label:'Drift upward',   min:0,    max:1,   step:0.01, value:0.4 },
    { key:'flecks',     label:'Flecks',         min:0,    max:1,   step:0.01, value:0.6 },
    { key:'fleckSize',  label:'Fleck size',     min:0.5,  max:3,   step:0.05, value:1 },
    { key:'rise',       label:'Fleck rise',     min:0,    max:2,   step:0.05, value:1 },
    { key:'fleckColor', label:'Fleck colour',   type:'color', value:[0.7, 0.65, 0.85] }
  ];
  // Fire: flames standing on the bottom edge of the plane (a hearth, a campfire, a torch).
  const FIRE_PARAMS = [
    { key:'opacity',    label:'Opacity',        min:0,    max:1,    step:0.01,  value:1 },
    { key:'height',     label:'Flame height',   min:0.1,  max:1,    step:0.01,  value:0.7 },
    { key:'width',      label:'Width at base',  min:0.05, max:1,    step:0.01,  value:0.6 },
    { key:'speed',      label:'Speed',          min:0,    max:4,    step:0.05,  value:1.2 },
    { key:'flicker',    label:'Flicker',        min:0,    max:2,    step:0.05,  value:1 },
    { key:'tongues',    label:'Tongues',        min:1,    max:8,    step:0.1,   value:3 },
    { key:'lean',       label:'Lean (wind)',    min:-1,   max:1,    step:0.01,  value:0 },
    { key:'bed',        label:'Soft base',      min:0,    max:0.4,  step:0.01,  value:0.04 },
    { key:'coreColor',  label:'Core colour',    type:'color', value:[1.0, 0.92, 0.62] },
    { key:'midColor',   label:'Flame colour',   type:'color', value:[1.0, 0.56, 0.14] },
    { key:'edgeColor',  label:'Edge colour',    type:'color', value:[0.78, 0.2, 0.05] },
    { key:'glow',       label:'Glow',           min:0,    max:1,    step:0.01,  value:0.35 },
    { key:'smoke',      label:'Smoke',          min:0,    max:1,    step:0.01,  value:0.15 },
    { key:'smokeColor', label:'Smoke colour',   type:'color', value:[0.22, 0.2, 0.2] },
    { key:'embers',     label:'Embers',         min:0,    max:1,    step:0.01,  value:0.45 },
    { key:'emberSize',  label:'Ember size',     min:0.002, max:0.03, step:0.001, value:0.009 },
    { key:'emberColor', label:'Ember colour',   type:'color', value:[1.0, 0.7, 0.3] }
  ];
  // target: what it draws on ('plane' = its own plane; 'character' = a character).
  // start / gone: what the first state blends from, and what 'Gone' means.
  const SHADERS = {
    darkness: { label:'Darkness whirlwind', target:'plane', params:DARKNESS_PARAMS, start:{ opacity:0 }, gone:{ opacity:0 } },
    fire:     { label:'Fire', target:'plane', params:FIRE_PARAMS, start:{ opacity:0 }, gone:{ opacity:0 } },
    dissolve: { label:'Dissolve (character)', target:'character', params:DISSOLVE_PARAMS, start:{ progress:0 }, gone:{ progress:1 } }
  };

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

  const FIRE_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect;
uniform float p_opacity, p_height, p_width, p_speed, p_flicker, p_tongues, p_lean, p_bed, p_glow, p_smoke, p_embers, p_emberSize;
uniform vec3 p_coreColor, p_midColor, p_edgeColor, p_smokeColor, p_emberColor;
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
// Straight alpha "a over b".
vec4 over(vec4 a, vec4 b){
  float o = a.a + b.a * (1.0 - a.a);
  return o > 0.0001 ? vec4((a.rgb * a.a + b.rgb * b.a * (1.0 - a.a)) / o, o) : vec4(0.0);
}
void main(){
  float y = vUv.y, x = vUv.x * 2.0 - 1.0;
  float t = uTime * p_speed;
  float hy = y / max(p_height, 0.05);           // 0 at the base, 1 at the flame tips
  // Wind leans the upper flames; a slow sway keeps it alive.
  float sway = (fbm(vec2(y * 1.5, uTime * 0.4)) - 0.5) * 0.3 * p_flicker;
  float xs = x - (p_lean * 0.6 + sway) * hy * hy;
  // Noise rising through the flames: it cuts the tongues and lets pieces break off.
  vec2 q = vec2(xs * p_tongues * max(uAspect, 0.2), y * 3.2 - t * 1.6);
  float n1 = fbm(q);
  float n2 = fbm(q * 2.1 + vec2(4.3, -t * 0.9));
  float xd = xs + (n1 - 0.5) * 0.3 * p_flicker * hy;
  // Separate tongues across the width, each reaching its own (slowly changing) height;
  // the middle ones reach highest.
  float tongue = noise(vec2(xd * p_tongues * 1.4 + 3.0, t * 0.45)) * 0.65 + noise(vec2(xd * p_tongues * 3.1 + 8.0, t * 0.9)) * 0.35;
  float across = abs(xd) / max(p_width, 0.01);
  float reach = mix(0.15, 1.15, tongue * tongue * (3.0 - 2.0 * tongue)) * (1.0 - 0.6 * across * across);
  float halfw = max(p_width, 0.01) * (1.0 - 0.6 * min(hy, 1.0));
  float heat = (1.0 - hy / max(reach, 0.08)) * 1.0 - pow(abs(xd) / max(halfw, 0.01), 1.6) * 0.75;
  heat += (n2 - 0.5) * 0.8 * p_flicker + (n1 - 0.5) * 0.45;
  heat *= smoothstep(0.0, max(p_bed, 0.001), y);
  float a = smoothstep(0.04, 0.3, heat);
  // Hotter inside and low down; redder at the edges and towards the tips.
  float hot = heat * (1.15 - 0.45 * min(hy, 1.2));
  vec3 col = mix(p_edgeColor, p_midColor, smoothstep(0.08, 0.36, hot));
  col = mix(col, p_coreColor, smoothstep(0.42, 0.85, hot));
  vec4 flame = vec4(col, a);
  // Smoke curling up off the tips.
  float sy = smoothstep(p_height * 0.55, p_height * 1.05, y);
  float sw = max(p_width, 0.05) * (0.5 + 0.9 * (y - p_height * 0.55));
  float sn = fbm(vec2(xs * 3.0 * max(uAspect, 0.2), y * 4.0 - t * 0.7) + 2.0);
  float sm = sy * (1.0 - smoothstep(sw * 0.4, sw, abs(xs - (sn - 0.5) * 0.3))) * smoothstep(0.35, 0.75, sn) * p_smoke * 0.75;
  vec4 smoke = vec4(p_smokeColor, sm);
  // A soft glow round the base of the fire.
  float g = exp(-pow(x / max(p_width * 1.3, 0.05), 2.0) * 1.6 - pow((y - p_height * 0.2) / max(p_height * 0.75, 0.05), 2.0) * 2.2);
  float flick = 0.85 + 0.15 * noise(vec2(uTime * 3.0 * max(p_speed, 0.2), 1.7));
  vec4 glow = vec4(p_midColor, g * p_glow * 0.55 * flick);
  // Embers: sparks rising from the bed, drifting and fading.
  float ea = 0.0;
  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    if (fi >= p_embers * 28.0) break;
    float h1 = hash(vec2(fi, 2.3)), h2 = hash(vec2(fi, 8.9)), h3 = hash(vec2(fi, 5.1));
    float life = fract(h2 + uTime * (0.18 + 0.22 * h3) * (0.5 + p_speed * 0.5));
    float ey = life * (0.4 + 0.6 * h1);
    float ex = (h1 * 2.0 - 1.0) * p_width * 0.6 + sin(uTime * (1.5 + h3 * 2.0) + fi) * 0.05 * life + p_lean * 0.5 * ey;
    vec2 d = vec2((x - ex) * uAspect * 0.5, y - ey);
    float size = p_emberSize * (0.6 + 0.8 * h3);
    float m = 1.0 - smoothstep(size * 0.3, size, length(d * vec2(1.0, 0.7)));
    ea = max(ea, m * (1.0 - life) * smoothstep(0.0, 0.08, life));
  }
  vec4 ember = vec4(p_emberColor, ea);
  vec4 o = over(ember, over(flame, over(smoke, glow)));
  // Never a hard edge at the plane's sides or top.
  o.a *= smoothstep(1.0, 0.9, abs(x)) * smoothstep(1.0, 0.92, y);
  gl_FragColor = vec4(o.rgb, o.a * p_opacity);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('Effect shader: ' + gl.getShaderInfoLog(s));
    return s;
  }

  function link(gl, fragment, what) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(what + ' program: ' + gl.getProgramInfoLog(program));
    return program;
  }
  // Plane shaders that read their settings as p_<key> uniforms.
  const PLANE_FRAGMENTS = { fire: FIRE_FRAGMENT };
  // A renderer in an existing WebGL context. The caller binds the target framebuffer
  // and viewport; render() draws one full-target triangle and leaves blending off.
  // render(params, time, aspect, shader): shader is the art's shader (default darkness);
  // each shader's program is built the first time it is drawn.
  function createRenderer(gl) {
    const program = link(gl, DARKNESS_FRAGMENT, 'Effect');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const u = {};
    for (const name of ['uTime', 'uOpacity', 'uSpeed', 'uTwist', 'uRise', 'uDensity', 'uSoft', 'uBase', 'uTop', 'uTurb', 'uFlecks', 'uFleckSpeed', 'uFleckSize', 'uAspect', 'uCore', 'uEdge', 'uFleckColor'])
      u[name] = gl.getUniformLocation(program, name);
    const others = new Map(); // shader -> {program, uTime, uAspect, params:[[param, location]]}
    function other(shader) {
      if (others.has(shader)) return others.get(shader);
      const prog = link(gl, PLANE_FRAGMENTS[shader], 'Effect ' + shader);
      const entry = { program:prog, uTime:gl.getUniformLocation(prog, 'uTime'), uAspect:gl.getUniformLocation(prog, 'uAspect'),
        params:SHADERS[shader].params.map(p => [p, gl.getUniformLocation(prog, 'p_' + p.key)]) };
      others.set(shader, entry);
      return entry;
    }
    function draw() {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    return {
      render(params, time, aspect, shader = 'darkness') {
        const p = params;
        if (PLANE_FRAGMENTS[shader]) {
          const o = other(shader);
          gl.useProgram(o.program);
          gl.uniform1f(o.uTime, time);
          gl.uniform1f(o.uAspect, aspect || 0.6);
          for (const [def, loc] of o.params) {
            if (def.type === 'color') gl.uniform3fv(loc, p[def.key]); else gl.uniform1f(loc, p[def.key]);
          }
          draw();
          return;
        }
        gl.useProgram(program);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uOpacity, p.opacity); gl.uniform1f(u.uSpeed, p.speed); gl.uniform1f(u.uTwist, p.twist);
        gl.uniform1f(u.uRise, p.rise); gl.uniform1f(u.uDensity, p.density); gl.uniform1f(u.uSoft, p.softness);
        gl.uniform1f(u.uBase, p.base); gl.uniform1f(u.uTop, p.top); gl.uniform1f(u.uTurb, p.turbulence);
        gl.uniform1f(u.uFlecks, p.flecks); gl.uniform1f(u.uFleckSpeed, p.fleckSpeed); gl.uniform1f(u.uFleckSize, p.fleckSize);
        gl.uniform1f(u.uAspect, aspect || 0.6);
        gl.uniform3fv(u.uCore, p.coreColor); gl.uniform3fv(u.uEdge, p.edgeColor); gl.uniform3fv(u.uFleckColor, p.fleckColor);
        draw();
      }
    };
  }

  const DISSOLVE_VERTEX = `
attribute vec2 aPos;
uniform vec4 uRect;
uniform float uDepth; // the character's depth (NDC z), so scenery in front still covers it
varying vec2 vUv;
void main(){ vUv = aPos; gl_Position = vec4(mix(uRect.xy, uRect.zw, aPos), uDepth, 1.0); }`;

  const DISSOLVE_FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uChar;
uniform float uTime, uProgress, uScale, uSweep, uEdge, uGlow, uDarken, uDrift, uFlecks, uFleckSize, uRise, uAspect;
uniform vec3 uEdgeColor, uDarkColor, uFleckColor;
uniform vec2 uBody; // the character's feet and head height in the image (0..1)
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
// When each point goes: noise, swept from the feet up (sweep > 0) or the head down.
float field(vec2 uv){
  float n = fbm(uv * vec2(uAspect, 1.0) * uScale);
  float y = clamp((uv.y - uBody.x) / max(uBody.y - uBody.x, 0.01), 0.0, 1.0);
  float s = uSweep >= 0.0 ? y : 1.0 - y;
  return mix(n, s, abs(uSweep) * 0.85);
}
// The character image is premultiplied (drawn with blending); unpremultiply it.
vec4 straight(vec2 uv){ vec4 c = texture2D(uChar, uv); return c.a > 0.001 ? vec4(c.rgb / c.a, c.a) : vec4(0.0); }
void main(){
  float cut = mix(-uEdge - 0.03, 1.03, uProgress);
  float f = field(vUv);
  // Near the edge the body smears upward.
  float near = 1.0 - smoothstep(cut, cut + 0.25, f);
  vec4 c = straight(vUv - vec2(0.0, uDrift * 0.12 * near * uProgress));
  float keep = smoothstep(cut, cut + 0.015, f);
  float edge = keep * (1.0 - smoothstep(cut, cut + max(uEdge, 0.0001), f));
  vec3 col = mix(c.rgb, uDarkColor, uDarken * uProgress);
  col = mix(col, uEdgeColor * uGlow, clamp(edge, 0.0, 1.0) * step(0.0001, uEdge));
  float alpha = c.a * keep;
  // Flecks: cells of the body break off as the edge passes them, rise and fade.
  vec2 cell = vec2(1.0 / (24.0 * uAspect), 1.0 / 24.0) * uFleckSize;
  vec2 here = floor(vUv / cell);
  float fl = 0.0;
  for (int k = 0; k < 8; k++) {
    vec2 oc = here - vec2(0.0, float(k));
    float r = hash(oc);
    if (r > uFlecks) continue;
    vec2 ouv = (oc + 0.5) * cell;
    float age = cut - field(ouv);
    if (age <= 0.0) continue;
    if (texture2D(uChar, ouv).a < 0.4) continue;
    vec2 pos = ouv + vec2((hash(oc + 3.1) - 0.5) * cell.x * 2.0 + sin(uTime * 2.0 + r * 6.28) * cell.x * 0.5, age * uRise * 0.6);
    float m = 1.0 - smoothstep(0.15, 0.4, length((vUv - pos) / cell));
    fl = max(fl, m * (1.0 - clamp(age * uRise * 2.0, 0.0, 1.0)));
  }
  col = mix(col, uFleckColor, fl);
  gl_FragColor = vec4(col, max(alpha, fl));
}`;

  // Draws a character image (premultiplied texture) through the dissolve shader into
  // rect (NDC x0, y0, x1, y1). Output is straight alpha; the caller sets blending.
  function createDissolveRenderer(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, DISSOLVE_VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, DISSOLVE_FRAGMENT));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Dissolve program: ' + gl.getProgramInfoLog(program));
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    const u = {};
    for (const name of ['uRect', 'uChar', 'uTime', 'uProgress', 'uScale', 'uSweep', 'uEdge', 'uGlow', 'uDarken', 'uDrift', 'uFlecks', 'uFleckSize', 'uRise', 'uAspect', 'uEdgeColor', 'uDarkColor', 'uFleckColor', 'uBody', 'uDepth'])
      u[name] = gl.getUniformLocation(program, name);
    return {
      render(p, time, texture, rect, aspect, body, depth = 0) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u.uChar, 0);
        gl.uniform4f(u.uRect, rect[0], rect[1], rect[2], rect[3]);
        gl.uniform1f(u.uTime, time); gl.uniform1f(u.uProgress, p.progress); gl.uniform1f(u.uScale, p.scale);
        gl.uniform1f(u.uSweep, p.sweep); gl.uniform1f(u.uEdge, p.edge); gl.uniform1f(u.uGlow, p.glow);
        gl.uniform1f(u.uDarken, p.darken); gl.uniform1f(u.uDrift, p.drift); gl.uniform1f(u.uFlecks, p.flecks);
        gl.uniform1f(u.uFleckSize, p.fleckSize); gl.uniform1f(u.uRise, p.rise); gl.uniform1f(u.uAspect, aspect || 1);
        gl.uniform2f(u.uBody, body ? body[0] : 0, body ? body[1] : 1);
        gl.uniform1f(u.uDepth, depth);
        gl.uniform3fv(u.uEdgeColor, p.edgeColor); gl.uniform3fv(u.uDarkColor, p.darkColor); gl.uniform3fv(u.uFleckColor, p.fleckColor);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
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
    let dissolver = null, sampleTex = null, sampleAspect = 2;
    // A sample character for previewing character effects (the fox, side on).
    function loadSample() {
      if (sampleTex) return;
      sampleTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, sampleTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      const img = new Image();
      img.onload = () => {
        sampleAspect = img.naturalWidth / img.naturalHeight;
        gl.bindTexture(gl.TEXTURE_2D, sampleTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        thumbs.clear();
      };
      img.src = (window.SideScrollAssetPath || (u => u))('quadruped-reference.png');
    }
    shared = {
      canvas,
      gl, // Asset Lab draws a real character on it (character-preview.js)
      // sample (character effects): {texture, aspect, body:[feet, head]} drawn on
      // this context — a real character; without it the sample picture.
      render(art, time, sample = null) {
        if ((SHADERS[art.shader] || {}).target === 'character') {
          if (!sample) loadSample();
          dissolver ||= createDissolveRenderer(gl);
          const aspect = sample ? sample.aspect : sampleAspect;
          const h = sample ? 512 : 384, w = Math.round(h * aspect);
          if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, w, h);
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
          if (sample) dissolver.render(clean(art.shader, art.params), time, sample.texture, [-1, -1, 1, 1], aspect, sample.body);
          else dissolver.render(clean(art.shader, art.params), time, sampleTex, [-1, -1, 1, 1], sampleAspect);
          return canvas;
        }
        const h = 384, w = Math.max(16, Math.round(h * (art.width / Math.max(1, art.height))));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        renderer.render(clean(art.shader, art.params), time, w / h, art.shader);
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

  const isCharacterEffect = art => (SHADERS[art?.shader] || {}).target === 'character';
  window.SideScrollEffects = { SHADERS, defaults, clean, createRenderer, createDissolveRenderer, canvasRenderer, thumbnail, isCharacterEffect };
})();
