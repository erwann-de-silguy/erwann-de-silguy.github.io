/* Reference: https://gigi.co/ — background study: the reference's woven field and face reveal,
   adapted to the CV's CSS color tokens. No runtime libraries or remote assets. */
(function () {
  'use strict';
  var canvas = document.getElementById('bg');
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var coarse = matchMedia('(pointer: coarse)').matches;
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) return; // The page's white background remains available without WebGL.

  var vertex = 'attribute vec2 position; varying vec2 vUv; void main(){vUv=position*0.5+0.5; gl_Position=vec4(position,0.0,1.0);}';
  var trailShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D previous;
    uniform vec2 pointer, velocity;
    uniform float aspect, moving, presence, decay;
    void main() {
      vec4 state = texture2D(previous, vUv);
      vec2 bend = (state.rg * 2.0 - 1.0) * pow(0.90, decay);
      float reveal = state.b * pow(0.975, decay);
      float halo = state.a * pow(0.97, decay);
      vec2 d = (vUv - pointer) * vec2(aspect, 1.0);
      float distance2 = dot(d, d);
      bend += velocity * exp(-distance2 * 300.0) * moving * 1.9 * decay;
      float still = 1.0 - clamp(moving * 1.4, 0.0, 1.0);
      reveal += (exp(-distance2 * 110.0) * 0.05 * still
        + exp(-distance2 * 5000.0) * 0.8 * moving) * presence * decay;
      halo += exp(-distance2 * 60.0) * (0.035 + 0.03 * moving) * presence * decay;
      gl_FragColor = vec4(clamp(bend, -1.0, 1.0) * 0.5 + 0.5, clamp(reveal, 0.0, 1.0), clamp(halo, 0.0, 1.0));
    }
  `;
  var paintShader = `

  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform float uIntensity;
  uniform float uEnergy;
  uniform float uFlowT;
  uniform float uPulse;
  uniform float uPulseX;
  uniform float uBloom;
  uniform vec2 uResolution;
  uniform float uCell;
  uniform sampler2D uTrail;
  uniform sampler2D uGlyphs;
  uniform float uGlyphN;
  uniform sampler2D uFaces;
  uniform float uFaceAmt;
  uniform vec2 uFaceFit;
  uniform vec2 uPointer;
  uniform float uPresence;
  uniform float uCalm;
  uniform vec3 uActive;
  uniform float uIgnite;
  uniform vec2 uTouch;
  uniform float uRevealR;
  uniform vec3 uBg;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  varying vec2 vUv;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  vec2 fieldAt(vec2 uv, float trailBend) {
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0) * 1.7;
    float t = uFlowT + uScroll * 1.2;
    float ang = -0.32 + uScroll * 0.7;
    float ca = cos(ang);
    float sa = sin(ang);
    p = mat2(ca, -sa, sa, ca) * p;
    p.y += trailBend * 0.25;
    float wave = 0.24 * sin(p.x * 0.7 + t * 0.6) + 0.1 * sin(p.x * 1.7 - t * 0.4);
    float cur = smoothstep(0.95, 0.0, abs(p.y + wave));
    float drift = noise(p * 0.8 + vec2(t * 0.35, -t * 0.22));
    float lane = fract(p.x * 0.22 - t * 0.17 + noise(vec2(p.y * 1.4, t * 0.12)) * 0.2);
    float glint = exp(-pow((lane - 0.5) * 8.0, 2.0)) * cur;
    float f = cur * (0.2 + 0.16 * drift) + glint * 0.42 * uEnergy;
    f *= 0.8 + 0.35 * noise(p * 3.2 + t * 0.4);
    return vec2(f, cur);
  }
  float spotlight(vec2 uv, vec2 beam) {
    vec2 d = (uv - beam) * vec2(uAspect, 1.0);
    float r = length(d) / uRevealR;
    float m = smoothstep(1.0, 0.5, r) * 0.55 + smoothstep(0.55, 0.1, r) * 0.45;
    return m * uPresence;
  }
  void main() {
    vec2 grid = gl_FragCoord.xy / uCell;
    vec2 cellId = floor(grid);
    vec2 cellUv = fract(grid);
    vec2 cUv = (cellId + 0.5) * uCell / uResolution;
    vec4 trailCont = texture2D(uTrail, vUv);
    vec4 trailCell = texture2D(uTrail, cUv);
    vec2 fc = fieldAt(vUv, trailCont.g);
    float fCont = fc.x;
    float fCell = fieldAt(cUv, trailCell.g).x;
    float h = hash(cellId);
    float dj = 0.45 + 0.9 * fract(h * 9.17);
    float mag = length(trailCell.rg);
    float spin = h * 6.2832 + uTime * (5.0 + 7.0 * fract(h * 5.53));
    vec2 kick = vec2(cos(spin), sin(spin));
    vec2 wob = vec2(sin(uTime * 0.7 + h * 41.0), cos(uTime * 0.6 + h * 27.0)) * 0.0014;
    vec2 fUv = cUv + wob;
    vec2 colUv = (fUv - 0.5) * uFaceFit + 0.5;
    float lum = texture2D(uFaces, colUv).r;
    float env = smoothstep(0.03, 0.22, lum);
    float shaped = floor(clamp(lum, 0.0, 1.0) * 8.0 + 0.5) / 8.0;
    float keepD = step(0.7 * (1.0 - smoothstep(0.0, 0.3, shaped)), fract(h * 7.31));
    shaped *= keepD;
    float pathCell = clamp(trailCell.b, 0.0, 1.0) * uPresence;
    float pathCont = clamp(trailCont.b, 0.0, 1.0) * uPresence;
    float mask = clamp(spotlight(cUv, uPointer) * 0.3 * uCalm + pathCell, 0.0, 1.0);
    float maskC = clamp(spotlight(vUv, uPointer) * 0.3 * uCalm + pathCont, 0.0, 1.0);
    float haloCell = clamp(trailCell.a, 0.0, 1.0) * uPresence;
    float aw = length((fUv - uActive.xy) * vec2(uAspect, 1.0));
    float faceWin = smoothstep(uActive.z * 1.5, uActive.z * 0.85, aw);
    vec2 td = (fUv - uTouch) * vec2(uAspect, 1.0);
    float ignR = uActive.z * (0.2 + 2.45 * uIgnite);
    float ignite = smoothstep(ignR, ignR * 0.5, length(td)) * smoothstep(0.0, 0.25, uIgnite);
    float faceMask = clamp(mask + haloCell * env, 0.0, 1.0) * faceWin * ignite;
    float person = shaped * faceMask * uFaceAmt;
    float nLines = uResolution.y / (uCell * 3.0);
    float idleBend = (noise(cUv * vec2(2.4, 1.6) + vec2(uTime * 0.06, -uTime * 0.04)) - 0.5) * 0.02;
    float drag = (trailCell.g * 0.7 + trailCell.r * 0.3) * 0.02   
               + kick.y * mag * 0.03 * dj;                        
    float faceBend = shaped * 0.07 * faceMask * uFaceAmt;         
    float yy = (cUv.y + idleBend + drag + faceBend) * nLines;
    float dLine = abs(fract(yy) - 0.5);
    float line = smoothstep(0.34, 0.1, dLine);
    line *= mix(1.0, smoothstep(0.02, 0.12, lum), env * faceMask * uFaceAmt);
    float faceMix = env * faceMask * uFaceAmt;
    float stir = smoothstep(0.1, 0.6, mag);
    float eBoost = clamp(uEnergy - 1.0, 0.0, 1.0);
    float rowsB = line * (0.28 + 0.18 * eBoost + 0.28 * fCell + mask * 0.4 + stir * 0.3);
    float bandD = vUv.x + vUv.y * 0.28 - uPulseX + 0.25;
    float band = exp(-bandD * bandD * 26.0) * uPulse;
    rowsB += line * band * 0.9;
    float mosaicB = shaped * (0.4 + 0.65 * faceMask);
    float bCell = clamp(mix(rowsB, mosaicB, faceMix), 0.0, 1.15);
    vec2 hd = (cUv - uPointer) * vec2(uAspect, 1.0);
    float head = exp(-dot(hd, hd) * 7000.0) * uPresence;
    bCell = clamp(bCell + head * line * 0.9 + head * 0.15, 0.0, 1.15);
    float bCont = clamp(fCont * 0.5 + maskC * (0.12 + 0.35 * person) + band * 0.3, 0.0, 1.0);
    vec3 grad = mix(uC1, uC2, smoothstep(0.0, 0.55, bCont));
    grad = mix(grad, uC3, smoothstep(0.55, 1.0, bCont));
    vec3 col = uBg + grad * bCont * bCont * 0.34 * uIntensity;
    vec3 bloomCol = mix(uC1, uC2, 0.72);
    float bloomAmt = uBloom * (0.3 + 0.7 * smoothstep(0.03, 0.28, uScroll));
    col += bloomCol * fc.y * fc.y * bloomAmt * 0.5 * uIntensity;
    float bj = bCell * (0.82 + 0.34 * h);
    bj *= 0.94 + 0.06 * uEnergy * sin(uTime * 1.1 * uEnergy + h * 43.0); 
    float eb = clamp(uEnergy - 1.0, 0.0, 1.0);
    bj *= 1.0 + eb * 0.22 * (fract(h * 7.77 + floor(uTime * 7.0) * 0.713) - 0.5);
    float gi = floor(clamp(bj, 0.0, 1.0) * (uGlyphN - 1.0) * 1.3);
    gi += floor((1.0 - faceMix) * smoothstep(0.08, 0.5, mag) * 3.0 * fract(h * 6.13 + floor(uTime * 8.0) * 0.37));
    gi += floor((1.0 - faceMix) * eb
              * step(0.9 - 0.42 * eb, fract(h * 8.31 + floor(uTime * (2.0 + 6.0 * eb)) * 0.531))
              * 3.0 * fract(h * 4.91));
    gi = clamp(gi, 1.0, uGlyphN - 1.0);
    float sj = 0.82 + 0.42 * fract(h * 3.77);          
    vec2 guv = (cellUv - 0.5) / sj + 0.5;
    float inG = step(0.0, guv.x) * step(guv.x, 1.0) * step(0.0, guv.y) * step(guv.y, 1.0);
    float g = texture2D(uGlyphs, vec2((gi + 0.06 + clamp(guv.x, 0.0, 1.0) * 0.88) / uGlyphN, 0.06 + clamp(guv.y, 0.0, 1.0) * 0.88)).r * inG;
    g *= step(0.05, bj);                               
    g *= 0.62 + 0.38 * fract(h * 5.93);                
    vec3 gcol = mix(uC2, uC3, smoothstep(0.35, 1.0, bj));
    gcol = mix(gcol, uC2, smoothstep(0.2, 0.42, dLine) * 0.6 * (1.0 - faceMix * 0.85));
    vec3 faceGlow = uC3;
    gcol = mix(gcol, faceGlow, clamp(person, 0.0, 1.0) * 0.6);
    float cpick = fract(h * 2.17);
    vec3 sparkCol = mix(
      mix(uC1, uC2, step(0.34, cpick)),
      uC3,
      step(0.67, cpick)
    );
    float spark = step(0.87, fract(h * 9.71 + floor(uTime * 9.0) * 0.211)) * smoothstep(0.15, 0.55, mag)
                * (1.0 - faceMix * 0.7);
    gcol = mix(gcol, sparkCol, spark * 0.75);
    col += gcol * g * (0.3 + bj * 1.05) * uIntensity * 1.25;
    gl_FragColor = vec4(vec3(1.0) - clamp(col - uBg, 0.0, 0.72), 1.0);
  }
  `;
  // The trail uses ordinary RGBA8 targets, including on phones without float textures.
  paintShader = paintShader.replace('vec4 trailCell = texture2D(uTrail, cUv);',
    'vec4 trailCell = texture2D(uTrail, cUv); trailCont.rg = trailCont.rg * 2.0 - 1.0; trailCell.rg = trailCell.rg * 2.0 - 1.0;');

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error);
    }
    return shader;
  }
  function program(fragment) {
    var p = gl.createProgram(), vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var uniforms = {};
    for (var i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      var name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { handle: p, uniforms: uniforms, position: gl.getAttribLocation(p, 'position') };
  }
  var paint, trail;
  try { paint = program(paintShader); trail = program(trailShader); }
  catch (error) { console.warn('Background shader unavailable:', error.message); return; }
  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  function use(p) {
    gl.useProgram(p.handle); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(p.position); gl.vertexAttribPointer(p.position, 2, gl.FLOAT, false, 0, 0);
  }
  function f(p, name, value) { gl.uniform1f(p.uniforms[name], value); }
  function v2(p, name, x, y) { gl.uniform2f(p.uniforms[name], x, y); }
  function texture(source) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!source);
    if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
    return t;
  }
  function bind(p, name, t, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(p.uniforms[name], unit);
  }
  function target(width, height) {
    var t = texture(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var buffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0.5,0.5,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: t, buffer: buffer };
  }
  var chars = [' ','.','·',':','-','/','|','i','1',']','[','}','0','I','g','G'];
  var atlas = document.createElement('canvas'); atlas.width = 64 * chars.length; atlas.height = 64;
  var a = atlas.getContext('2d');
  a.fillStyle = '#fff'; a.textAlign = 'center'; a.textBaseline = 'middle';
  a.font = '500 44px ui-monospace, SFMono-Regular, Menlo, monospace';
  chars.forEach(function (ch, i) { a.fillText(ch, i * 64 + 32, 34.56); });
  var glyphs = texture(atlas), faces = texture(), facesReady = false;
  var faceAspect = 4 / 3, fit = [1,1], width, height, ratio, tw, th, targets = [];
  var spots = [
    [.265,.101,.1],[.49,.124,.1],[.817,.145,.11],[.134,.216,.09],
    [.89,.276,.11],[.737,.295,.1],[.191,.337,.09],[.343,.361,.1],
    [.65,.392,.09],[.13,.78,.1],[.094,.498,.11],[.502,.519,.08],
    [.726,.557,.12],[.258,.574,.11],[.611,.599,.08],[.476,.811,.14],
    [.637,.847,.13],[.801,.813,.08]
  ];
  var pointer = [.5,.5], smooth = [.5,.5], previous = [.5,.5], touch = [.5,.5];
  var velocity = [0,0], active = [.5,.5,.12], activeIndex = -1;
  var moving = 0, presence = 0, presenceTarget = 0, calm = 0, ignite = 0;
  var lastInteraction = 0, intro = !coarse, introStart = -1, introSpot = 0;
  var scroll = 0, scrollTarget = 0, elapsed = 0, last = 0, frame = 0, lost = false;
  var colors;
  function palette() {
    var style = getComputedStyle(document.documentElement);
    // Subtractive color makes the identical light field read as blue ink on white.
    function ink(token) {
      var hex = style.getPropertyValue(token).trim().replace('#','');
      return [0,2,4].map(function (i) { return 1 - parseInt(hex.slice(i,i+2),16) / 255; });
    }
    colors = [ink('--blue-soft'), ink('--blue'), ink('--ink')];
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.75);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    tw = Math.ceil(width / 4); th = Math.ceil(height / 4);
    targets.forEach(function (t) { gl.deleteFramebuffer(t.buffer); gl.deleteTexture(t.texture); });
    targets = [target(tw, th), target(tw, th)];
    fit = width / height > faceAspect ? [1, faceAspect / (width / height)] : [(width / height) / faceAspect, 1];
    palette(); readScroll();
    if (motion.matches) draw(performance.now());
  }
  function readScroll() {
    scrollTarget = Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    if (scrollTarget > .09) intro = false;
    if (motion.matches) { scroll = scrollTarget; draw(performance.now()); }
  }
  function onPointer(e) {
    if (motion.matches) return;
    intro = false; pointer = [e.clientX / width, 1 - e.clientY / height];
    moving = 1; presenceTarget = 1; lastInteraction = performance.now();
  }
  function mix(a, b, amount) { return a + (b - a) * amount; }
  function step(amount, dt) { return 1 - Math.pow(1 - amount, dt * 60); }
  function draw(now) {
    if (lost) return;
    var dt = motion.matches ? 0 : Math.min((now - (last || now)) / 1000, .05); last = now; elapsed += dt;
    scroll = mix(scroll, scrollTarget, motion.matches ? 1 : step(.06, dt));
    if (intro && facesReady && !motion.matches) {
      if (introStart < 0) {
        introStart = elapsed + .7; var best = -Infinity;
        spots.forEach(function (spot, i) {
          var x = (spot[0] - .5) / fit[0] + .5, y = (.5 - spot[1]) / fit[1] + .5;
          if (x < .15 || x > .9 || y < .35 || y > .9) return;
          var score = spot[2] - .04 * Math.hypot(x - .62, y - .6);
          if (score > best) { best = score; introSpot = i; }
        });
      }
      var t = elapsed - introStart, spot = spots[introSpot];
      var sx = (spot[0] - .5) / fit[0] + .5, sy = (.5 - spot[1]) / fit[1] + .5;
      if (t >= 0 && t < 2.8) {
        var p = t / 2.8; p = p * p * (3 - 2 * p);
        pointer = [-.06 * (1-p)*(1-p) + .8*(1-p)*p + p*p*sx, .88*(1-p)*(1-p) + .76*(1-p)*p + p*p*sy];
        moving = 1; presenceTarget = 1;
      } else if (t >= 2.8 && t < 5.8) {
        var angle = (t - 2.8) * 1.6 + 2.4, r = spot[2] / fit[1] * .22;
        pointer = [sx + Math.cos(angle)*r*.7, sy + Math.sin(angle)*r]; presenceTarget = 1;
      } else if (t >= 5.8) { presenceTarget = 0; intro = false; }
    }
    if (coarse && now - lastInteraction > 2500 && !motion.matches) {
      pointer[0] = mix(pointer[0], .5 + .34*Math.sin(.11*elapsed+1.7) + .08*Math.sin(.31*elapsed), step(.01,dt));
      pointer[1] = mix(pointer[1], .5 + .28*Math.sin(.07*elapsed) + .07*Math.cos(.23*elapsed), step(.01,dt));
      moving = Math.max(moving,.3); presenceTarget = 1;
    }
    for (var k = 0; k < 2; k++) {
      smooth[k] = mix(smooth[k],pointer[k],step(.12,dt));
      velocity[k] = (pointer[k] - previous[k]) * 8; previous[k] = pointer[k];
    }
    var speed = Math.hypot(velocity[0],velocity[1]);
    if (speed > 1) { velocity[0] /= speed; velocity[1] /= speed; }
    presence = mix(presence,presenceTarget,step(presenceTarget > presence ? .08 : .05,dt));
    calm = mix(calm,moving > .15 ? 0 : 1,step(.06,dt));
    var fx = (smooth[0]-.5)*fit[0]+.5, fy = (smooth[1]-.5)*fit[1]+.5, nearest = 0, distance = Infinity;
    function distanceTo(s) { return Math.pow((s[0]-fx)*faceAspect,2) + Math.pow(1-s[1]-fy,2); }
    spots.forEach(function (s, i) { var d = distanceTo(s); if (d < distance) { distance = d; nearest = i; } });
    if (activeIndex >= 0 && activeIndex !== nearest && distance > distanceTo(spots[activeIndex])*.8) nearest = activeIndex;
    activeIndex = nearest; var face = spots[nearest];
    active[0] = mix(active[0],(face[0]-.5)/fit[0]+.5,step(.1,dt));
    active[1] = mix(active[1],(.5-face[1])/fit[1]+.5,step(.1,dt));
    active[2] = mix(active[2],face[2]/fit[1],step(.1,dt));
    var touching = Math.sqrt(distanceTo(face)) < face[2]*(coarse ? 1.6 : 1.05);
    if (touching) for (var j = 0; j < 2; j++) touch[j] = mix(touch[j],smooth[j],step(.25,dt));
    ignite = mix(ignite,touching ? 1 : 0,step(touching ? .05 : .07,dt));
    moving *= Math.pow(.92,dt*60);

    use(trail); gl.bindFramebuffer(gl.FRAMEBUFFER,targets[1].buffer); gl.viewport(0,0,tw,th);
    bind(trail,'previous',targets[0].texture,0); v2(trail,'pointer',pointer[0],pointer[1]); v2(trail,'velocity',velocity[0],velocity[1]);
    f(trail,'aspect',width/height); f(trail,'moving',moving); f(trail,'presence',presence); f(trail,'decay',dt*60);
    gl.drawArrays(gl.TRIANGLES,0,6);
    use(paint); gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,canvas.width,canvas.height);
    bind(paint,'uTrail',targets[1].texture,0); bind(paint,'uGlyphs',glyphs,1); bind(paint,'uFaces',faces,2);
    f(paint,'uTime',elapsed); f(paint,'uScroll',scroll); f(paint,'uAspect',width/height);
    f(paint,'uIntensity',.64); f(paint,'uEnergy',1); f(paint,'uFlowT',elapsed*.05);
    f(paint,'uPulse',0); f(paint,'uPulseX',0); f(paint,'uBloom',.08);
    v2(paint,'uResolution',canvas.width,canvas.height); f(paint,'uCell',Math.max(5,Math.round(7*ratio)));
    f(paint,'uGlyphN',chars.length); f(paint,'uFaceAmt',facesReady && !motion.matches ? 1 : 0);
    v2(paint,'uFaceFit',fit[0],fit[1]); v2(paint,'uPointer',smooth[0],smooth[1]);
    f(paint,'uPresence',motion.matches ? 0 : presence); f(paint,'uCalm',calm);
    gl.uniform3fv(paint.uniforms.uActive,active); f(paint,'uIgnite',ignite);
    v2(paint,'uTouch',touch[0],touch[1]); f(paint,'uRevealR',Math.min(320,Math.max(220,.32*height))/height);
    gl.uniform3f(paint.uniforms.uBg,0,0,0);
    ['uC1','uC2','uC3'].forEach(function (name,i) { gl.uniform3fv(paint.uniforms[name],colors[i]); });
    gl.drawArrays(gl.TRIANGLES,0,6); targets.reverse();
  }
  function animate(now) {
    frame = 0;
    if (document.hidden || motion.matches || lost) return;
    // Keep the reference's motion while capping GPU work at 30 frames per second.
    if (!last || now-last >= 1000/30) draw(now);
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (!document.hidden && !lost) {
      if (motion.matches) { presence = 0; draw(performance.now()); }
      else frame = requestAnimationFrame(animate);
    }
  }
  addEventListener('resize',resize);
  var scrollPending = false;
  addEventListener('scroll',function () {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(function () { scrollPending = false; readScroll(); });
  },{passive:true});
  addEventListener('pointermove',onPointer,{passive:true});
  addEventListener('touchstart',function (e) { if (e.touches[0]) onPointer(e.touches[0]); },{passive:true});
  addEventListener('touchmove',function (e) { if (e.touches[0]) onPointer(e.touches[0]); },{passive:true});
  document.documentElement.addEventListener('pointerleave',function () { presenceTarget = 0; });
  document.addEventListener('visibilitychange',resume); motion.addEventListener('change',resume);
  canvas.addEventListener('webglcontextlost',function (e) { e.preventDefault(); lost = true; cancelAnimationFrame(frame); });
  canvas.addEventListener('webglcontextrestored',function () { location.reload(); });
  resize(); resume();
})();
