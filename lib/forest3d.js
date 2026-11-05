/* 마음숲 모험 — the 3D world behind the walking scenes.
   The game itself (questions, obstacles, door logic, saving) stays in 마음숲모험.html; this file
   only draws. It models everything in code from the game's own look, so there are no model
   files and the game still opens by double-clicking. Needs lib/three.min.js. */
(function(global){
  "use strict";
  const IS_TOUCH = global.matchMedia && global.matchMedia("(pointer: coarse)").matches;
  const REDUCE = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const col = h => new THREE.Color(h);
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* Each layer's own place. Stairs go up in the outer layers and down from the shadow inward:
     the deeper you go, the further below the surface you are walking. */
  const THEMES = {
    persona: {
      guideU: 100, tail: 22, seed: 20261105, wobble: 1, treesPerM: 2.1,
      stairs: [{ f: 0.4, n: 10, rise: 0.27 }, { f: 0.72, n: 6, rise: 0.27 }],
      skyA: ["#5f96c6", "#8cc8ea", "#e4f3f6"], skyB: ["#5a8cbc", "#86bfe0", "#f4f6ea"], sunDir: [0.05, 0.3, -1],
      haze: "#b9d6e0", fog: 0.0165, hemi: ["#d6eef7", "#6f9a62", 1.9], sun: ["#fff0d0", 2.2], sunOff: [-26, 58, 22], exposure: 1.08,
      leaves: ["#4f9457", "#5ea35f", "#468a50", "#6aab5c", "#3f8150"], catch: "#b6dd9c", trunk: "#94704c", bough: "#7d5e40",
      grass: ["#3e7a3f", "#5c9a4c"], earth: "#7d6a4d", blades: ["#6aa850", "#4f9148"], far: "#2f6a45",
      stones: ["#a39a88", "#8f8878", "#b3a994", "#7e7a6c"], flower: ["#fffaf0", "#f4cf6a"], flowers: 110,
      shafts: 18, shaft: "255,246,214", motes: "#f2ffd9", moteOp: 0.85, masks: true, halo: "#f6ffe0"
    },
    ego: {
      guideU: 82, tail: 22, seed: 7719, wobble: 1.15, treesPerM: 1.8,
      stairs: [{ f: 0.55, n: 8, rise: 0.27 }],
      skyA: ["#a5788c", "#e9b98a", "#f7e2c4"], skyB: ["#7a6484", "#d0a08e", "#f2d2ac"], sunDir: [-0.35, 0.09, -1],
      haze: "#e4bb9c", fog: 0.018, hemi: ["#f7dcc0", "#5f6f6a", 1.7], sun: ["#ffd8ae", 2.2], sunOff: [38, 26, 34], exposure: 1.05,
      leaves: ["#3f8a84", "#4e9c90", "#357a78", "#6aa98a", "#2f6f70"], catch: "#f0c79a", trunk: "#7a5a4a", bough: "#684c3e",
      grass: ["#3f7468", "#6a9a78"], earth: "#8a6a50", blades: ["#6f9f78", "#4c8270"], far: "#5a6f7a",
      stones: ["#b09a88", "#9a8878", "#c0a892", "#8a7a70"], flower: ["#ffe0c8", "#ee9a5a"], flowers: 90,
      shafts: 14, shaft: "255,214,170", motes: "#ffe6c0", moteOp: 0.9, halo: "#ffe6c8"
    },
    shadow: {
      guideU: 78, tail: 52, seed: 3301, wobble: 1.3, treesPerM: 2.0,
      stairs: [{ f: 0.3, n: 9, rise: -0.27 }],
      skyA: ["#2a2442", "#3d3358", "#5a4c78"], skyB: ["#141024", "#231b38", "#3a2f54"], sunDir: [0.1, 0.5, -1],
      haze: "#3a3358", fog: 0.024, hemi: ["#b4aae8", "#3a3058", 2.5], sun: ["#c8c0ff", 1.9], sunOff: [-18, 50, -14], exposure: 1.25,
      leaves: ["#54407a", "#5f4c86", "#4a3a6e", "#6a558c", "#403466"], catch: "#9a8abc", trunk: "#50445a", bough: "#443a4e",
      grass: ["#34344e", "#484566"], earth: "#4c4054", blades: ["#514d74", "#3f3c60"], far: "#2c2444",
      stones: ["#6e6a7e", "#5e5a70", "#7c788c", "#524e64"], flower: null, flowers: 0,
      shafts: 0, motes: "#c8beff", moteOp: 0.6, fill: 6, halo: "#b8a8ff",
      // once you have faced it, the rain stops and the air opens up
      clearSky: ["#46507e", "#7a7aa8", "#c4b4c4"], clearHaze: "#6a6888", clearFog: 0.015, clearHemi: 3.1, clearSun: 2.6
    },
    anima: {
      guideU: 72, tail: 22, seed: 5511, wobble: 1.1, treesPerM: 1.7,
      stairs: [{ f: 0.42, n: 6, rise: -0.27 }],
      skyA: ["#1e1838", "#4a3264", "#8a4f86"], skyB: ["#2a1f4f", "#5a3a6e", "#b0689a"], sunDir: [0, 0.03, -1],
      haze: "#4e3768", fog: 0.0185, hemi: ["#c8b0e8", "#2a1f3f", 1.5], sun: ["#ffefc4", 1.5], sunOff: [10, 30, -50], exposure: 1.05,
      leaves: ["#7a3b6e", "#5c3a7a", "#8a4a80", "#4f2f66", "#6a4a90"], catch: "#d8a8d8", trunk: "#4a3448", bough: "#3e2c3e",
      grass: ["#3b3662", "#544878"], earth: "#5a4a68", blades: ["#655a90", "#4a4478"], far: "#2a1f4f",
      stones: ["#8a8098", "#7a7088", "#9a90a8", "#6a6078"], flower: ["#f4e6ff", "#f6dc9a"], flowers: 70,
      shafts: 6, shaft: "240,214,255", motes: "#f5c6e6", moteOp: 0.8, fill: 2.2, halo: "#ffd8f0",
      moon: true, pool: true, stopDist: 4.0
    },
    self: {
      guideU: 25, tail: 12, seed: 9001, wobble: 0, treesPerM: 0, beach: true,
      stairs: [],
      skyA: ["#e8a58c", "#ffc9a0", "#fff0d4"], skyB: ["#f0bc90", "#ffdcae", "#fff8e4"], sunDir: [0, 0.07, -1],
      haze: "#ffe2bc", fog: 0.0085, hemi: ["#ffeed4", "#c9a06a", 2.0], sun: ["#ffe2b0", 2.3], sunOff: [6, 20, -46], exposure: 1.05,
      leaves: ["#5f9a6a", "#6fa86a", "#4f8a60", "#86b06a", "#468058"], catch: "#f2dca0", trunk: "#94704c", bough: "#7d5e40",
      grass: ["#d9b06e", "#f0d3a0"], earth: "#e6c48a", blades: ["#a6a860", "#8f9a58"], far: "#7f9a80",
      stones: [], flower: null, flowers: 0, shafts: 10, shaft: "255,236,190", motes: "#ffe6aa", moteOp: 0.9, halo: "#fff2c8"
    }
  };

  let renderer = null, canvas = null, W = null;

  function softDot(){
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.55)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function makeWorld(cfg){
    const T = THEMES[cfg.key] || THEMES.persona;
    // seeded, so each layer's forest is the same every visit and no tree lands on the path by chance
    let seed = T.seed;
    const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const rr = (a, b) => a + R() * (b - a);

    const scene = new THREE.Scene();
    const hazeC = col(T.haze);
    scene.fog = new THREE.FogExp2(hazeC.clone(), T.fog);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
    renderer.toneMappingExposure = T.exposure;

    /* ---------- the path ---------- */
    const GUIDE_U = T.guideU, zLen = GUIDE_U + T.tail;
    const ctrl = [[0, 6]];
    const nCtrl = Math.max(3, Math.round(zLen / 17));
    for (let i = 1; i <= nCtrl; i++){
      const f = i / nCtrl, z = 6 - f * (zLen + 6);
      const x = T.wobble * (Math.sin(f * 5.2 + T.seed % 7) * 4.6 + Math.sin(f * 11 + 1) * 1.7) * smooth(0, 0.12, f) * (1 - smooth(0.85, 1, f));
      ctrl.push([x, z]);
    }
    const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const LEN = curve.getLength();
    const SAMPLES = Math.round(LEN * 5.4);
    const pts = curve.getSpacedPoints(SAMPLES);
    const DU = LEN / SAMPLES;
    const STAIRS = T.stairs.map(s => ({ u: GUIDE_U * s.f, n: s.n, run: 0.92, rise: s.rise }));
    const idxAt = u => Math.max(0, Math.min(SAMPLES, Math.round(u / DU)));
    function pathY(u, smoothRamp){
      let y = 0;
      for (const s of STAIRS){
        const t = (u - s.u) / s.run;
        if (t <= 0) continue;
        if (t >= s.n){ y += s.n * s.rise; continue; }
        // the visible tread: going down, each step's top stays at or above the sloped ground
        y += (smoothRamp ? t : (s.rise < 0 ? Math.floor(t) : Math.ceil(t))) * s.rise;
      }
      return y;
    }
    function nearest(x, z, from, to, step){
      let best = 0, bd = Infinity;
      for (let i = from; i <= to; i += step){
        const dx = pts[i].x - x, dz = pts[i].z - z, d = dx * dx + dz * dz;
        if (d < bd){ bd = d; best = i; }
      }
      return { i: best, d: Math.sqrt(bd) };
    }
    const nearestAll = (x, z) => nearest(x, z, 0, SAMPLES, 3);
    const hills = (x, z) => Math.sin(x * 0.09 + 1.3) * 1.5 + Math.sin(z * 0.07) * 1.3 + Math.sin((x + z) * 0.21) * 0.45 + Math.sin(x * 0.4 - z * 0.33) * 0.14;
    const SHORE_Z = T.beach ? pts[idxAt(GUIDE_U)].z - 7.5 : 0;
    function groundY(x, z){
      if (T.beach){
        const dune = (Math.sin(x * 0.11) + Math.sin(z * 0.13 + 1)) * 0.25 * smooth(0, 22, Math.abs(x)) + smooth(6, 40, Math.abs(x)) * 2.5;
        return dune * smooth(SHORE_Z - 2, SHORE_Z + 10, z) - 1.1 * (1 - smooth(SHORE_Z - 7, SHORE_Z + 1, z));
      }
      const n = nearestAll(x, z);
      const py = pathY(n.i * DU, true);
      const bank = smooth(3.2, 13, n.d);
      return py - 0.02 + bank * (hills(x, z) + 1.4) + smooth(3, 8, n.d) * 0.5;
    }
    const sideFrame = u => {
      const i = idxAt(u), p = pts[i], a = pts[Math.min(SAMPLES, i + 2)], b = pts[Math.max(0, i - 2)];
      const tx = a.x - b.x, tz = a.z - b.z, l = Math.hypot(tx, tz) || 1;
      return { p, nx: -tz / l, nz: tx / l, tx: tx / l, tz: tz / l };
    };
    const offPath = (u, off) => { const f = sideFrame(u); return { x: f.p.x + f.nx * off, z: f.p.z + f.nz * off }; };

    /* ---------- sky ---------- */
    const SUN_DIR = new THREE.Vector3().fromArray(T.sunDir).normalize();
    const skyU = { top: { value: col(T.skyA[0]) }, mid: { value: col(T.skyA[1]) }, low: { value: col(T.skyA[2]) }, sun: { value: SUN_DIR }, sunPow: { value: T.beach ? 0.55 : (cfg.key === "shadow" || cfg.key === "anima" ? 0.12 : 1) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: `varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 v; uniform vec3 top, mid, low, sun; uniform float sunPow;
        void main(){ float h = clamp(v.y, -0.05, 1.0);
          vec3 c = mix(low, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.2, 0.75, h));
          float s = max(dot(normalize(v), sun), 0.0);
          c += vec3(1.0, 0.96, 0.84) * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.5) * sunPow;
          gl_FragColor = vec4(c, 1.0); }`
    }));
    sky.renderOrder = -1;
    scene.add(sky);

    /* ---------- light ---------- */
    const hemi = new THREE.HemisphereLight(col(T.hemi[0]), col(T.hemi[1]), T.hemi[2]);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(col(T.sun[0]), T.sun[1]);
    sun.castShadow = true;
    sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
    sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 130;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    const SUN_OFFSET = new THREE.Vector3().fromArray(T.sunOff);
    // a soft light from the camera's side: lifts your face when you turn to look at yourself,
    // and keeps you visible in the darker layers
    const faceLight = new THREE.PointLight(0xfff0dc, T.fill || 0, 7, 1.2);
    scene.add(faceLight);

    /* ---------- small painted textures ---------- */
    function noiseTex(base, dots, size, rep, alpha){
      const c = document.createElement("canvas"); c.width = c.height = size;
      const g = c.getContext("2d");
      g.fillStyle = base; g.fillRect(0, 0, size, size);
      for (let i = 0; i < dots; i++){
        const v = R(), a = rr(0.03, alpha);
        g.fillStyle = v < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
        const s = rr(1, size / 40);
        g.beginPath(); g.ellipse(R() * size, R() * size, s, s * rr(0.4, 1), R() * 3, 0, 7); g.fill();
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }
    const dot = softDot();

    /* ---------- ground ---------- */
    {
      const zEnd = pts[SAMPLES].z, zMin = zEnd - 70, zMax = 72, depth = zMax - zMin;
      const geo = new THREE.PlaneGeometry(190, depth, IS_TOUCH ? 110 : 170, Math.round(depth * (IS_TOUCH ? 0.6 : 0.9)));
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0, (zMax + zMin) / 2);
      const p = geo.attributes.position, colors = new Float32Array(p.count * 3);
      const grassA = col(T.grass[0]), grassB = col(T.grass[1]), earth = col(T.earth), wet = col("#b98a4e"), c = new THREE.Color();
      for (let i = 0; i < p.count; i++){
        const x = p.getX(i), z = p.getZ(i), n = nearest(x, z, 0, SAMPLES, 6);
        p.setY(i, groundY(x, z));
        const patch = 0.5 + 0.5 * Math.sin(x * 0.23 + Math.sin(z * 0.17) * 2) * Math.cos(z * 0.19);
        c.copy(grassA).lerp(grassB, patch);
        if (T.beach) c.lerp(wet, 1 - smooth(SHORE_Z, SHORE_Z + 9, z));
        else c.lerp(earth, 1 - smooth(2.2, 4.4, n.d + Math.sin(x * 1.3 + z) * 0.4));
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: noiseTex("#ffffff", 2600, 256, 34, 0.09) }));
      ground.receiveShadow = true;
      scene.add(ground);
    }

    const dummy = new THREE.Object3D();
    function instanced(geo, mat, list, opts){
      if (!list.length) return null;
      const m = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => {
        dummy.position.set(it.x, it.y, it.z);
        dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        if (it.s != null) dummy.scale.setScalar(it.s); else dummy.scale.set(it.sx, it.sy, it.sz);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        if (it.c) m.setColorAt(i, it.c);
      });
      m.castShadow = !!(opts && opts.cast);
      m.receiveShadow = !!(opts && opts.receive);
      scene.add(m);
      return m;
    }

    /* ---------- stepping stones and stairs ---------- */
    const poolU = T.pool ? GUIDE_U - 2.2 : -99;
    if (T.stones.length){
      const list = [], greys = T.stones.map(col);
      for (let u = 1; u < LEN - 2; u += 1.05){
        if (STAIRS.some(s => u > s.u - 0.8 && u < s.u + s.n * s.run + 0.5)) continue;
        if (T.pool && Math.abs(u - poolU) < 2.6) continue;
        const f = sideFrame(u), y = pathY(u, true);
        [-1.25, 0, 1.25].forEach(off => {
          if (R() < 0.12) return;
          const o = off + rr(-0.28, 0.28);
          list.push({ x: f.p.x + f.nx * o + rr(-0.1, 0.1), y: y + 0.03, z: f.p.z + f.nz * o + rr(-0.2, 0.2), ry: R() * 3,
            sx: rr(0.42, 0.66), sy: rr(0.06, 0.1), sz: rr(0.34, 0.52), c: greys[Math.floor(R() * greys.length)].clone().multiplyScalar(rr(0.9, 1.1)) });
        });
      }
      const stoneGeo = new THREE.SphereGeometry(1, 22, 8);
      { const q = stoneGeo.attributes.position;
        for (let i = 0; i < q.count; i++){ const x = q.getX(i), z = q.getZ(i), k = 1 + Math.sin(Math.atan2(z, x) * 3 + 1) * 0.07 + Math.sin(Math.atan2(z, x) * 5) * 0.04; q.setX(i, x * k); q.setZ(i, z * k); }
        stoneGeo.computeVertexNormals(); }
      instanced(stoneGeo, new THREE.MeshStandardMaterial({ roughness: 0.92, map: noiseTex("#ffffff", 900, 128, 1, 0.14) }), list, { receive: true, cast: true });
      const stoneMat = new THREE.MeshStandardMaterial({ color: greys[2].clone().multiplyScalar(1.05), roughness: 0.9, map: noiseTex("#ffffff", 1400, 256, 1, 0.16) });
      STAIRS.forEach(s => {
        const a = pts[idxAt(s.u)], b = pts[idxAt(s.u + s.n * s.run)];
        const ang = Math.atan2(-(b.x - a.x), -(b.z - a.z));
        const base = pathY(s.u, false);
        for (let k = 0; k < s.n; k++){
          const u = s.u + (k + 0.5) * s.run, p = pts[idxAt(u)];
          const top = base + (s.rise < 0 ? k : k + 1) * s.rise;
          // each step reaches down into the ground, so the flight reads as solid stone
          const h = 1.2 + Math.abs(s.n * s.rise);
          const m = new THREE.Mesh(new THREE.BoxGeometry(5.4 + (k % 2) * 0.12, h, s.run + 0.04), stoneMat);
          m.position.set(p.x, top - h / 2, p.z);
          m.rotation.y = ang;
          m.castShadow = m.receiveShadow = true;
          scene.add(m);
        }
      });
    }

    /* ---------- the forest ---------- */
    const trees = [];
    const guideP0 = pts[idxAt(GUIDE_U)];
    const blob = new THREE.SphereGeometry(1, IS_TOUCH ? 12 : 16, IS_TOUCH ? 9 : 11);
    const leafC = document.createElement("canvas"); leafC.width = leafC.height = 256;
    { const g = leafC.getContext("2d"); g.fillStyle = "#e4e4e4"; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1500; i++){ const v = R(); g.fillStyle = v < 0.5 ? `rgba(255,255,255,${rr(0.06, 0.26)})` : `rgba(10,40,20,${rr(0.04, 0.14)})`;
        g.beginPath(); g.ellipse(R() * 256, R() * 256, rr(3, 9), rr(1.6, 4), R() * 3, 0, 7); g.fill(); } }
    const leafTex = new THREE.CanvasTexture(leafC); leafTex.wrapS = leafTex.wrapT = THREE.RepeatWrapping; leafTex.repeat.set(3, 2); leafTex.colorSpace = THREE.SRGBColorSpace;
    const foliage = T.leaves.map(col);
    // the moon needs a clear view: the anima wood opens into a glade behind the guide
    const inGlade = (x, z) => T.moon && z < guideP0.z + 6 && Math.abs(x - guideP0.x) < 7 + (guideP0.z + 6 - z) * 0.55;
    const tooClose = (x, z, d2) => trees.some(q => (q.x - x) ** 2 + (q.z - z) ** 2 < d2);
    const addTree = (x, z) => trees.push({ x, z, y: groundY(x, z), h: rr(5.2, 8.6), k: rr(0.88, 1.35), d: nearest(x, z, 0, SAMPLES, 5).d });
    const scaleN = IS_TOUCH ? 0.52 : 1;
    // past the end of the path, so the guide and door stand in forest, not in a field
    if (!T.beach) for (let i = 0, n = Math.round(70 * scaleN), t = 0; i < n && t < 1500; t++){
      const x = rr(-55, 55), z = rr(pts[SAMPLES].z - 46, pts[SAMPLES].z + 8);
      if (nearest(x, z, 0, SAMPLES, 5).d < 5 || inGlade(x, z) || tooClose(x, z, 13)) continue;
      addTree(x, z); i++;
    }
    // and behind where you start, so looking back still shows wood
    for (let i = 0, n = Math.round(66 * scaleN), t = 0; i < n && t < 1500; t++){
      const x = rr(-52, 52), z = rr(11, 62);
      if (tooClose(x, z, 11)) continue;
      addTree(x, z); i++;
    }
    if (T.beach){
      // the wood thins out and ends: a few last trees either side as you step out onto the sand
      for (let i = 0, t = 0; i < Math.round(26 * scaleN) && t < 600; t++){
        const x = (R() < 0.5 ? -1 : 1) * rr(7.5, 36), z = rr(2 - Math.abs(x) * 0.3, 11);
        if (tooClose(x, z, 11)) continue;
        addTree(x, z); i++;
      }
    } else {
      const want = trees.length + Math.round(LEN * T.treesPerM * scaleN);
      let tries = 0;
      while (trees.length < want && tries++ < 9000){
        const u = R() * LEN, f = sideFrame(u), side = R() < 0.5 ? -1 : 1;
        // more trees close to the path than far from it, so the wood closes in beside you
        const dist = 5.2 + Math.pow(R(), 1.7) * 46;
        const x = f.p.x + f.nx * side * dist, z = f.p.z + f.nz * side * dist;
        if (nearest(x, z, 0, SAMPLES, 5).d < 4.9 || inGlade(x, z) || tooClose(x, z, 11)) continue;
        addTree(x, z);
      }
    }
    {
      const trunks = [], crowns = [], lights = [], moss = [];
      const trunkC = col(T.trunk), boughC = col(T.bough), catchC = col(T.catch);
      trees.forEach(t => {
        const lean = rr(-0.05, 0.05);
        trunks.push({ x: t.x, y: t.y + t.h / 2, z: t.z, rz: lean, ry: R() * 6, sx: 0.34 * t.k, sy: t.h, sz: 0.34 * t.k, c: trunkC.clone().multiplyScalar(rr(0.85, 1.2)) });
        [-1, 1].forEach(s => trunks.push({ x: t.x + s * 0.55 * t.k, y: t.y + t.h * 0.62, z: t.z, rz: -s * 0.95, ry: 0, sx: 0.13 * t.k, sy: 1.7 * t.k, sz: 0.13 * t.k, c: boughC }));
        const top = t.y + t.h, base = foliage[Math.floor(R() * foliage.length)].clone();
        const r = 2.25 * t.k;
        crowns.push({ x: t.x + rr(-0.3, 0.3), y: top + r * 0.55, z: t.z + rr(-0.3, 0.3), s: r, c: base.clone().multiplyScalar(1.08) });
        for (let i = 0; i < 4; i++){
          const a = i / 4 * 6.28 + R(), rad = r * rr(0.72, 0.98);
          crowns.push({ x: t.x + Math.cos(a) * rad, y: top - r * rr(0.02, 0.26), z: t.z + Math.sin(a) * rad, s: r * rr(0.66, 0.84), c: base.clone().multiplyScalar(rr(0.82, 1)) });
        }
        for (let i = 0; i < 2; i++){
          const a = R() * 6.28;
          lights.push({ x: t.x + Math.cos(a) * r * 0.55, y: top + r * rr(0.95, 1.2), z: t.z + Math.sin(a) * r * 0.55, s: r * rr(0.2, 0.32), c: base.clone().lerp(catchC, 0.55) });
        }
        if (t.d < 18) moss.push({ x: t.x + rr(-0.45, 0.45), y: t.y + rr(0.25, 1.1), z: t.z + rr(-0.45, 0.45), s: rr(0.07, 0.13), c: catchC.clone() });
      });
      const trunkGeo = new THREE.CylinderGeometry(0.62, 1, 1, 9);
      instanced(trunkGeo, new THREE.MeshStandardMaterial({ roughness: 0.95, map: noiseTex("#ffffff", 700, 128, 1, 0.2) }), trunks, { cast: true, receive: true });
      instanced(blob, new THREE.MeshStandardMaterial({ roughness: 0.82, map: leafTex }), crowns, { cast: true, receive: true });
      instanced(blob, new THREE.MeshStandardMaterial({ roughness: 0.7 }), lights);
      instanced(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ fog: true }), moss);

      const bushes = [];
      if (!T.beach) for (let i = 0, n = Math.round(LEN * 3.6 * scaleN); i < n; i++){
        const f = sideFrame(R() * LEN), side = R() < 0.5 ? -1 : 1, dist = rr(4.4, 15);
        const x = f.p.x + f.nx * side * dist, z = f.p.z + f.nz * side * dist;
        if (nearest(x, z, 0, SAMPLES, 5).d < 4.2 || inGlade(x, z)) continue;
        const s = rr(0.4, 0.95);
        bushes.push({ x, y: groundY(x, z) + s * 0.25, z, sx: s * rr(1, 1.5), sy: s * 0.78, sz: s * rr(1, 1.4), c: foliage[Math.floor(R() * foliage.length)].clone().multiplyScalar(rr(0.8, 1.1)) });
      }
      instanced(blob, new THREE.MeshStandardMaterial({ roughness: 0.85, map: leafTex }), bushes, { cast: true, receive: true });

      // far hills melting into the haze; none straight ahead where the moon or the sea is
      const far = [], cz = pts[SAMPLES].z / 2;
      for (let i = 0; i < 90; i++){
        const a = R() * 6.28, d = rr(100, 150), x = Math.cos(a) * d, z = cz + Math.sin(a) * d * 1.3;
        if ((T.moon || T.beach) && z < cz && Math.abs(x) < (T.beach ? 400 : 30)) continue;
        far.push({ x, y: rr(4, 12), z, sx: rr(10, 20), sy: rr(11, 22), sz: rr(10, 20), c: col(T.far) });
      }
      instanced(blob, new THREE.MeshStandardMaterial({ roughness: 1 }), far);

      if (!T.beach){
        const tufts = [], bladeA = col(T.blades[0]), bladeB = col(T.blades[1]);
        for (let i = 0, n = Math.round(LEN * 42 * (IS_TOUCH ? 0.37 : 1)); i < n; i++){
          const f = sideFrame(R() * LEN), side = R() < 0.5 ? -1 : 1, dist = 2.5 + Math.pow(R(), 1.5) * 15;
          const x = f.p.x + f.nx * side * dist, z = f.p.z + f.nz * side * dist, s = rr(0.2, 0.42);
          tufts.push({ x, y: groundY(x, z), z, ry: R() * 6, sx: s, sy: s * rr(0.8, 1.25), sz: s, c: (R() < 0.5 ? bladeA : bladeB).clone().multiplyScalar(rr(0.85, 1.2)) });
        }
        const bladeV = [], BL = 6;
        for (let b = 0; b < BL; b++){
          const a = b / BL * 6.28 + 0.4, ox = Math.cos(a) * 0.14, oz = Math.sin(a) * 0.14, lx = Math.cos(a) * 0.3, lz = Math.sin(a) * 0.3, wx = -Math.sin(a) * 0.05, wz = Math.cos(a) * 0.05, h = 0.75 + (b % 3) * 0.14;
          bladeV.push(ox - wx, 0, oz - wz, ox + wx, 0, oz + wz, ox + lx * 0.45 + wx * 0.7, h * 0.55, oz + lz * 0.45 + wz * 0.7,
                      ox - wx, 0, oz - wz, ox + lx * 0.45 + wx * 0.7, h * 0.55, oz + lz * 0.45 + wz * 0.7, ox + lx * 0.45 - wx * 0.7, h * 0.55, oz + lz * 0.45 - wz * 0.7,
                      ox + lx * 0.45 - wx * 0.7, h * 0.55, oz + lz * 0.45 - wz * 0.7, ox + lx * 0.45 + wx * 0.7, h * 0.55, oz + lz * 0.45 + wz * 0.7, ox + lx, h, oz + lz);
        }
        const bladeGeo = new THREE.BufferGeometry();
        bladeGeo.setAttribute("position", new THREE.Float32BufferAttribute(bladeV, 3));
        bladeGeo.computeVertexNormals();
        instanced(bladeGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide }), tufts);
      }
      if (T.flower && T.flowers){
        const fc = document.createElement("canvas"); fc.width = fc.height = 64;
        const fg = fc.getContext("2d");
        fg.fillStyle = T.flower[0]; for (let i = 0; i < 5; i++){ const a = i / 5 * 6.28 - 1.57; fg.beginPath(); fg.arc(32 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, 11, 0, 7); fg.fill(); }
        fg.fillStyle = T.flower[1]; fg.beginPath(); fg.arc(32, 32, 7, 0, 7); fg.fill();
        const flowers = [];
        for (let i = 0; i < T.flowers; i++){
          const f = sideFrame(R() * LEN), side = R() < 0.5 ? -1 : 1, dist = rr(3, 9);
          const x = f.p.x + f.nx * side * dist, z = f.p.z + f.nz * side * dist;
          flowers.push({ x, y: groundY(x, z) + 0.22, z, rx: -0.5, ry: rr(-0.4, 0.4), rz: 0, s: rr(0.18, 0.28) });
        }
        instanced(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(fc), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }), flowers);
      }
    }

    /* ---------- the shared solid-with-outline helper ---------- */
    const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x161018, side: THREE.BackSide });
    function solid(parent, geo, color, x, y, z, sx, sy, sz, outline){
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.62, side: geo.userData.double ? THREE.DoubleSide : THREE.FrontSide }));
      m.position.set(x, y, z); m.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
      m.castShadow = true;
      parent.add(m);
      if (outline !== false){
        const o = new THREE.Mesh(geo, OUTLINE);
        o.scale.setScalar(1.045);
        m.add(o);
      }
      return m;
    }
    const SPHERE = new THREE.SphereGeometry(1, 24, 18);
    const CYL = new THREE.CylinderGeometry(1, 1, 1, 16);
    const BOX = new THREE.BoxGeometry(1, 1, 1);
    const sparkle = (color, size) => new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));

    /* ---------- masks on strings (persona) ---------- */
    const hanging = [];
    const faceShape = () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.5);
      shape.bezierCurveTo(0.36, 0.5, 0.46, 0.2, 0.46, -0.02);
      shape.bezierCurveTo(0.46, -0.36, 0.2, -0.62, 0, -0.66);
      shape.bezierCurveTo(-0.2, -0.62, -0.46, -0.36, -0.46, -0.02);
      shape.bezierCurveTo(-0.46, 0.2, -0.36, 0.5, 0, 0.5);
      [-0.2, 0.2].forEach(cx => { const h = new THREE.Path(); h.absellipse(cx, 0.03, 0.12, 0.095, 0, 6.3, true); shape.holes.push(h); });
      return shape;
    };
    if (T.masks){
      const geo = new THREE.ExtrudeGeometry(faceShape(), { depth: 0.07, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 2, curveSegments: 14 });
      const palette = ["#efe4c9", "#e6d6b4", "#d9b25c", "#c9d4dc", "#d9a3a3"];
      trees.filter(t => t.d < 15).forEach((t, i) => {
        if (i % 3) return;
        const g = new THREE.Group();
        const side = i % 2 ? 1 : -1, topY = t.y + t.h * 0.62 + 0.95 * t.k;
        g.position.set(t.x + side * 1.3 * t.k, topY, t.z);
        const len = rr(0.9, 1.5);
        const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 4), new THREE.MeshBasicMaterial({ color: 0x3a2c20 }));
        line.position.y = -len / 2;
        const mask = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: palette[i % 5], roughness: 0.55 }));
        mask.scale.setScalar(rr(0.5, 0.68));
        mask.position.y = -len - 0.3;
        mask.rotation.y = rr(-0.7, 0.7) + (t.x > 0 ? -0.5 : 0.5);
        mask.castShadow = true;
        g.add(line, mask);
        g.userData.ph = R() * 6;
        scene.add(g);
        hanging.push(g);
      });
    }

    /* ---------- found objects (shadow): old, half-familiar things beside the path ---------- */
    function place(obj, u, off, faceUp){
      const pos = offPath(u, off);
      obj.position.set(pos.x, groundY(pos.x, pos.z), pos.z);
      obj.rotation.y = Math.atan2(sideFrame(u).p.x - pos.x, 8) + (off < 0 ? 0.7 : -0.7);
      scene.add(obj);
      return obj;
    }
    if (cfg.key === "shadow"){
      const mirror = () => { const g = new THREE.Group();
        solid(g, BOX, "#5c4632", 0, 0.75, 0, 0.72, 1.3, 0.09);
        const glass = solid(g, BOX, "#a9bac6", 0, 0.75, 0.05, 0.56, 1.1, 0.02, false); glass.material.metalness = 0.75; glass.material.roughness = 0.15;
        const crack = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x20202c }));
        crack.position.set(0.02, 0.85, 0.065); crack.rotation.z = 0.6; crack.scale.set(0.012, 0.75, 0.005); g.add(crack);
        const crack2 = crack.clone(); crack2.rotation.z = -0.5; crack2.scale.set(0.012, 0.45, 0.005); crack2.position.set(0.1, 0.72, 0.065); g.add(crack2);
        return g; };
      const box = () => { const g = new THREE.Group();
        solid(g, BOX, "#5c4632", 0, 0.28, 0, 0.9, 0.5, 0.62);
        const lid = solid(g, BOX, "#6e5640", 0, 0.58, 0, 0.96, 0.12, 0.68); lid.rotation.x = 0.03;
        solid(g, BOX, "#b09a60", 0, 0.42, 0.33, 0.14, 0.2, 0.04, false);
        return g; };
      const teddy = () => { const g = new THREE.Group(), c = "#a98660", c2 = "#d2b48c";
        solid(g, SPHERE, c, 0, 0.32, 0, 0.27, 0.3, 0.24);
        solid(g, SPHERE, c, 0, 0.74, 0, 0.24);
        [-1, 1].forEach(s => { solid(g, SPHERE, c, s * 0.2, 0.94, 0, 0.09); solid(g, SPHERE, c, s * 0.3, 0.42, 0.06, 0.09, 0.15, 0.09); solid(g, SPHERE, c, s * 0.17, 0.09, 0.14, 0.11, 0.09, 0.15);
          solid(g, SPHERE, 0x161018, s * 0.09, 0.79, 0.21, 0.025, 0.025, 0.012, false); });
        solid(g, SPHERE, c2, 0, 0.69, 0.19, 0.09, 0.07, 0.06, false);
        solid(g, SPHERE, 0x161018, 0, 0.72, 0.245, 0.028, 0.02, 0.012, false);
        g.rotation.z = 0.14;
        return g; };
      const snake = () => { const g = new THREE.Group(), c = "#4f6a4a";
        [[0.48, 0.1], [0.36, 0.26], [0.24, 0.4]].forEach(([r, y]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 10, 30), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })); t.rotation.x = Math.PI / 2; t.position.y = y; t.castShadow = true; g.add(t); });
        solid(g, SPHERE, c, 0.18, 0.56, 0.12, 0.14, 0.1, 0.17);
        [-1, 1].forEach(s => solid(g, SPHERE, 0xd8d060, 0.18 + s * 0.07, 0.61, 0.22, 0.022, 0.022, 0.012, false));
        return g; };
      const make = [mirror, box, teddy, snake];
      const n = 8;
      for (let i = 0; i < n; i++){
        const u = 10 + i * (GUIDE_U - 16) / n + rr(-1.5, 1.5);
        if (STAIRS.some(s => u > s.u - 1.5 && u < s.u + s.n * s.run + 1.5)) continue;
        place(make[i % 4](), u, (i % 2 ? 1 : -1) * rr(3.4, 4.6)).scale.setScalar(1.15);
      }
    }

    /* ---------- well and white bird among the trees (anima) ---------- */
    const birds = [];
    if (cfg.key === "anima"){
      const well = () => { const g = new THREE.Group(), s = "#8a8296";
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.8, 22, 1, true), new THREE.MeshStandardMaterial({ color: s, roughness: 0.9, side: THREE.DoubleSide, map: noiseTex("#ffffff", 900, 128, 3, 0.2) }));
        ring.position.y = 0.4; ring.castShadow = true; g.add(ring);
        const water = new THREE.Mesh(new THREE.CircleGeometry(0.68, 22), new THREE.MeshBasicMaterial({ color: 0x1c1a38 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.55; g.add(water);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.07, 8, 24), new THREE.MeshStandardMaterial({ color: "#a39ab0", roughness: 0.8 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.8; g.add(rim);
        [-1, 1].forEach(k => solid(g, CYL, "#5c4632", k * 0.72, 1.25, 0, 0.05, 1.0, 0.05));
        const roof = solid(g, new THREE.ConeGeometry(1.1, 0.55, 4), "#4a3a5c", 0, 1.98, 0, 1); roof.rotation.y = Math.PI / 4;
        return g; };
      const bird = () => { const g = new THREE.Group();
        solid(g, SPHERE, 0xffffff, 0, 0, 0, 0.17, 0.15, 0.25);
        solid(g, SPHERE, 0xffffff, 0, 0.13, 0.17, 0.1);
        solid(g, new THREE.ConeGeometry(0.03, 0.09, 8), "#e0a040", 0, 0.12, 0.29, 1).rotation.x = Math.PI / 2;
        const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 0.11, 0.04, 0); solid(p, SPHERE, 0xf4f0ff, s * 0.2, 0, -0.02, 0.24, 0.035, 0.13); g.add(p); return p; });
        g.userData.wings = wings; g.userData.ph = R() * 6;
        return g; };
      for (let i = 0; i < 3; i++) place(well(), 14 + i * 20 + rr(-2, 2), (i % 2 ? 1 : -1) * rr(7, 10));
      for (let i = 0; i < 4; i++){
        const b = place(bird(), 8 + i * 15 + rr(-2, 2), (i % 2 ? -1 : 1) * rr(4.5, 8));
        b.position.y += rr(1.5, 2.9); b.scale.setScalar(1.25);
        b.userData.y = b.position.y;
        birds.push(b);
      }
    }

    /* ---------- the moon half-risen on the horizon, and the pool in front of the guide ---------- */
    let waterU = null, poolMesh = null;
    if (T.moon){
      const mx = guideP0.x, mz = guideP0.z - 130;
      const moon = new THREE.Mesh(new THREE.SphereGeometry(13, 40, 24), new THREE.MeshBasicMaterial({ color: col("#ffe79a").multiplyScalar(1.25), fog: false, toneMapped: false }));
      moon.position.set(mx, pathY(GUIDE_U, false) + 1.5, mz);
      moon.renderOrder = -0.5;
      scene.add(moon);
      const halo = sparkle(0xffe7a8); halo.material.opacity = 0.42; halo.scale.set(70, 70, 1); halo.position.copy(moon.position); halo.position.y += 2;
      scene.add(halo);
      // a low wall of land at the horizon the moon can sink behind
      const hill = new THREE.Mesh(new THREE.BoxGeometry(420, 12, 40), new THREE.MeshBasicMaterial({ color: col(T.far).multiplyScalar(0.72), fog: false }));
      hill.position.set(mx, pathY(GUIDE_U, false) - 5.2, mz + 22);
      scene.add(hill);
    }
    if (T.pool){
      const pu = poolU, p = pts[idxAt(pu)], y = pathY(pu, false) + 0.05;
      waterU = { t: { value: 0 } };
      poolMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.ShaderMaterial({
        uniforms: waterU, transparent: true, depthWrite: false,
        vertexShader: `varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec2 v; uniform float t;
          void main(){ vec2 q = v * 2.0 - 1.0; float r = length(q);
            float w = sin(q.x * 16.0 + t * 1.2) * sin(q.y * 22.0 - t) * 0.5 + 0.5;
            vec3 c = mix(vec3(0.07, 0.07, 0.18), vec3(0.21, 0.17, 0.36), q.y * 0.5 + 0.5);
            float streak = exp(-q.x * q.x * 22.0) * smoothstep(-0.9, 0.9, q.y);
            c += vec3(1.0, 0.86, 0.5) * streak * (0.45 + 0.28 * w);
            float edge = smoothstep(1.0, 0.86, r);
            gl_FragColor = vec4(c, edge * 0.95); }`
      }));
      poolMesh.rotation.x = -Math.PI / 2;
      poolMesh.scale.set(2.6, 1.9, 1);
      poolMesh.position.set(p.x, y, p.z);
      scene.add(poolMesh);
    }

    /* ---------- the sea (Self): open water beyond the last of the sand ---------- */
    let seaU = null;
    if (T.beach){
      seaU = { t: { value: 0 }, shore: { value: SHORE_Z } };
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 500, 1, 1), new THREE.ShaderMaterial({
        uniforms: seaU, fog: false,
        vertexShader: `varying vec3 w; void main(){ vec4 p = modelMatrix * vec4(position, 1.0); w = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }`,
        fragmentShader: `varying vec3 w; uniform float t, shore;
          void main(){ float d = shore - w.z; float far = clamp(d / 240.0, 0.0, 1.0);
            vec3 c = mix(vec3(0.46, 0.76, 0.76), vec3(1.0, 0.82, 0.62), pow(far, 0.55));
            float w1 = sin(w.x * 0.5 + d * 0.9 + t * 1.3) * sin(w.x * 0.21 - d * 0.42 + t * 0.7);
            c += vec3(0.1, 0.1, 0.07) * w1 * (1.0 - far);
            float beam = exp(-pow(w.x / (3.0 + d * 0.13), 2.0));
            c += vec3(1.0, 0.9, 0.62) * beam * (0.3 + 0.55 * smoothstep(0.2, 1.0, w1)) * 0.75;
            float wave = sin(d * 0.8 - t * 0.9) * 0.5 + 0.5;
            float foam = smoothstep(0.84, 1.0, wave) * smoothstep(9.0, 0.5, d);
            c = mix(c, vec3(1.0, 0.98, 0.92), clamp(foam + smoothstep(1.4, 0.0, d + sin(w.x * 0.3 + t) * 0.5) * 0.8, 0.0, 1.0));
            gl_FragColor = vec4(c, 1.0); }`
      }));
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -0.42, SHORE_Z - 248);
      scene.add(sea);
      const disc = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 20), new THREE.MeshBasicMaterial({ color: col("#fff1c0").multiplyScalar(1.3), fog: false, toneMapped: false }));
      disc.position.copy(SUN_DIR).multiplyScalar(240); disc.position.y = 8;
      scene.add(disc);
      const glow = sparkle(0xffe6b0); glow.material.opacity = 0.42; glow.scale.set(74, 74, 1); glow.position.copy(disc.position);
      scene.add(glow);
      seaU.disc = disc; seaU.glow = glow;
    }

    /* ---------- light through the leaves, and motes drifting in it ---------- */
    if (T.shafts){
      const c = document.createElement("canvas"); c.width = 64; c.height = 256;
      const g = c.getContext("2d"), l = g.createLinearGradient(0, 0, 0, 256);
      l.addColorStop(0, `rgba(${T.shaft},0.9)`); l.addColorStop(1, `rgba(${T.shaft},0)`);
      g.fillStyle = l; g.fillRect(0, 0, 64, 256);
      const side = g.createLinearGradient(0, 0, 64, 0);
      side.addColorStop(0, "rgba(0,0,0,1)"); side.addColorStop(0.5, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,1)");
      g.globalCompositeOperation = "destination-out"; g.fillStyle = side; g.fillRect(0, 0, 64, 256);
      const tex = new THREE.CanvasTexture(c);
      for (let i = 0; i < T.shafts; i++){
        const u = rr(4, LEN - 3), p = pts[idxAt(u)];
        const m = new THREE.Mesh(new THREE.PlaneGeometry(rr(2.2, 4.5), rr(13, 20)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: rr(0.1, 0.2), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        m.position.set(p.x + rr(-5, 5), pathY(u, true) + 6.5, p.z + rr(-3, 3));
        m.rotation.set(0, rr(-0.5, 0.5), 0.4);
        scene.add(m);
      }
    }
    const MOTES = IS_TOUCH ? 140 : 300;
    const motePos = new Float32Array(MOTES * 3), moteSeed = new Float32Array(MOTES);
    for (let i = 0; i < MOTES; i++){ motePos.set([rr(-18, 18), rr(0.3, 7), rr(-18, 18)], i * 3); moteSeed[i] = R() * 6.28; }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ map: dot, size: 0.13, transparent: true, opacity: T.moteOp, color: col(T.motes), blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    motes.frustumCulled = false;
    scene.add(motes);

    /* ---------- the chibi: your character and the guides ---------- */
    const HAIR_CAP = new THREE.SphereGeometry(1, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.62).rotateX(-0.75);
    const LEG = new THREE.CapsuleGeometry(0.105, 0.24, 4, 10);
    function chibi({ outfit, hair, skin = "#f6cca0", cape, iris = "#274a3a" }){
      const root = new THREE.Group(), body = new THREE.Group();
      root.add(body);
      const dark = col(outfit).multiplyScalar(0.62);
      const capeC = cape ? col(cape) : col(outfit).multiplyScalar(0.78);
      const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.13, 0.38, 0); solid(g, LEG, dark, 0, -0.2, 0, 1); body.add(g); return g; });
      solid(body, SPHERE, outfit, 0, 0.56, 0, 0.3, 0.3, 0.24);
      const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.36, 0.72, 0); solid(g, SPHERE, outfit, 0, -0.14, 0, 0.1, 0.19, 0.1); body.add(g); return g; });
      const capeGeo = new THREE.CylinderGeometry(0.24, 0.4, 0.42, 20, 1, true, -Math.PI * 0.5, Math.PI);
      capeGeo.rotateY(Math.PI); capeGeo.userData.double = true;
      solid(body, capeGeo, capeC, 0, 0.62, -0.03, 1, 1, 1, false);
      const head = new THREE.Group();
      head.position.y = 1.16;
      body.add(head);
      solid(head, SPHERE, skin, 0, 0, 0, 0.47, 0.46, 0.48);
      solid(head, HAIR_CAP, hair, 0, 0.03, -0.01, 0.5, 0.49, 0.51);
      [-1, 1].forEach(s => solid(head, SPHERE, hair, s * 0.43, -0.2, -0.04, 0.13, 0.38, 0.17));
      const eyes = new THREE.Group(); head.add(eyes);
      [-1, 1].forEach(s => {
        solid(eyes, SPHERE, 0xffffff, s * 0.17, -0.05, 0.42, 0.095, 0.115, 0.05, false);
        solid(eyes, SPHERE, iris, s * 0.17, -0.05, 0.455, 0.078, 0.095, 0.03, false);
        solid(eyes, SPHERE, 0x161018, s * 0.17, -0.04, 0.475, 0.042, 0.052, 0.02, false);
        solid(eyes, SPHERE, 0xffffff, s * 0.17 - 0.028, -0.01, 0.49, 0.022, 0.024, 0.012, false);
        solid(head, SPHERE, 0xff9d8a, s * 0.28, -0.2, 0.34, 0.07, 0.04, 0.03, false).material.opacity = 0.7;
      });
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: 0x161018 }));
      smile.position.set(0, -0.2, 0.455); smile.rotation.z = Math.PI;
      head.add(smile);
      root.userData = { body, legs, arms, head, eyes };
      return root;
    }
    // each guide keeps its 2D accessory: the persona's pointed hat and mask, the ego's glasses,
    // the shadow's hood, the anima's tiara, the Self's halo
    function dress(fig, accessory, light){
      const u = fig.userData, head = u.head;
      if (accessory === "mask"){
        solid(head, new THREE.ConeGeometry(0.38, 0.74, 24), light, 0, 0.68, 0, 1);
        solid(head, SPHERE, col(light).lerp(col("#ffffff"), 0.35), 0, 0.34, 0, 0.56, 0.08, 0.56);
        solid(head, SPHERE, "#fff8e6", 0, 0.36, 0.44, 0.07, 0.07, 0.04);
        const faceMask = new THREE.Group(); head.add(faceMask);
        faceMask.position.y = -0.04;
        solid(faceMask, SPHERE, col(light).multiplyScalar(0.85), 0, 0, 0.38, 0.38, 0.17, 0.13);
        [-1, 1].forEach(s => solid(faceMask, SPHERE, 0x161018, s * 0.17, 0, 0.49, 0.09, 0.085, 0.03, false));
        u.faceMask = faceMask;
      } else if (accessory === "glasses"){
        [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.018, 8, 24), new THREE.MeshStandardMaterial({ color: "#d8c28a", metalness: 0.5, roughness: 0.35 })); r.position.set(s * 0.17, -0.05, 0.5); head.add(r); });
        const bridge = new THREE.Mesh(CYL, new THREE.MeshStandardMaterial({ color: "#d8c28a", metalness: 0.5, roughness: 0.35 })); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, -0.03, 0.52); bridge.scale.set(0.012, 0.09, 0.012); head.add(bridge);
        solid(head, SPHERE, light, 0, 0.36, -0.03, 0.42, 0.17, 0.42);
        solid(head, SPHERE, col(light).multiplyScalar(0.7), 0, 0.27, 0, 0.47, 0.03, 0.47);
      } else if (accessory === "hood"){
        const hood = new THREE.SphereGeometry(1, 30, 20, 0, Math.PI * 2, 0, Math.PI * 0.66).rotateX(-0.65);
        solid(head, hood, "#1c1830", 0, 0.03, -0.03, 0.58, 0.57, 0.6);
        const cloak = new THREE.CylinderGeometry(0.3, 0.46, 0.62, 20, 1, true, -Math.PI * 0.62, Math.PI * 1.24); cloak.rotateY(Math.PI); cloak.userData.double = true; solid(u.body, cloak, "#262040", 0, 0.5, -0.02, 1, 1, 1, false);
      } else if (accessory === "aura"){
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 30), new THREE.MeshStandardMaterial({ color: "#ffe39a", metalness: 0.6, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.6 }));
        t.rotation.x = Math.PI / 2 - 0.25; t.position.set(0, 0.34, 0.03); head.add(t);
        solid(head, new THREE.OctahedronGeometry(0.07), "#fff4c8", 0, 0.38, 0.36, 1, 1.5, 0.6, false);
      } else if (accessory === "halo"){
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 10, 36), new THREE.MeshBasicMaterial({ color: col("#fff0b0").multiplyScalar(1.3), toneMapped: false, fog: false }));
        t.rotation.x = Math.PI / 2; t.position.set(0, 0.62, 0); head.add(t);
      }
    }

    const player = chibi({ outfit: cfg.avatar.outfit, hair: cfg.avatar.hair });
    scene.add(player);
    const guide = cfg.guide ? chibi(cfg.guide) : null;
    let guideHalo = null;
    if (guide){
      dress(guide, cfg.guide.accessory, cfg.guide.hat || cfg.guide.outfit);
      guideHalo = sparkle(col(T.halo)); guideHalo.material.opacity = 0.5; guideHalo.scale.set(4.4, 4.4, 1); guideHalo.position.y = 0.95;
      guide.add(guideHalo);
      scene.add(guide);
    }
    const guideMats = [];
    if (guide) guide.traverse(o => { if (o.isMesh && o.material !== OUTLINE && o.material.color) guideMats.push({ m: o.material, c: o.material.color.clone() }); });

    /* ---------- anima: the guide takes the shape you were drawn to ---------- */
    let formGroup = null, formStars = [];
    function setAnimaForm(form, flash){
      if (!guide) return;
      if (formGroup){ guide.userData.body.remove(formGroup); formGroup = null; formStars = []; }
      if (form){
        const g = new THREE.Group(); guide.userData.body.add(g); formGroup = g;
        if (form === "deep"){
          const veil = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), new THREE.MeshStandardMaterial({ color: "#e8dcff", transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }));
          veil.position.set(0, 1.16, -0.05); veil.rotation.x = -0.3; g.add(veil);
          const moon = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 20, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: col("#fff6dc").multiplyScalar(1.2), toneMapped: false })); moon.position.set(0, 1.86, 0.1); moon.rotation.z = 0.9; g.add(moon);
        } else if (form === "wanderer"){
          solid(g, CYL, "#6b4a2e", 0.56, 0.75, 0.1, 0.035, 1.5, 0.035);
          const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: col("#fff8e0").multiplyScalar(1.4), toneMapped: false })); orb.position.set(0.56, 1.58, 0.1); g.add(orb);
          const gl = sparkle(0xfff3c4); gl.scale.set(0.9, 0.9, 1); gl.position.copy(orb.position); g.add(gl);
        } else if (form === "pathfinder"){
          solid(g, CYL, "#161018", -0.5, 1.02, 0.1, 0.012, 0.3, 0.012, false);
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.2), new THREE.MeshBasicMaterial({ color: col("#ffe7a0").multiplyScalar(1.4), toneMapped: false })); lamp.position.set(-0.5, 0.78, 0.1); g.add(lamp);
          const gl = sparkle(0xffe7a0); gl.scale.set(1.6, 1.6, 1); gl.position.copy(lamp.position); g.add(gl);
        } else if (form === "tender"){
          const heart = new THREE.Group(); heart.position.set(0, 0.62, 0.28);
          [-1, 1].forEach(s => solid(heart, SPHERE, "#ff9db5", s * 0.065, 0.05, 0, 0.09, 0.09, 0.05));
          const tip = solid(heart, BOX, "#ff9db5", 0, -0.03, 0, 0.13, 0.13, 0.08); tip.rotation.z = Math.PI / 4;
          g.add(heart);
          const gl = sparkle(0xffd0dc); gl.scale.set(0.9, 0.9, 1); gl.position.set(0, 0.62, 0.3); g.add(gl);
        } else if (form === "creator"){
          const brush = solid(g, CYL, "#8a5a32", 0.5, 0.75, 0.15, 0.025, 0.72, 0.025); brush.rotation.z = -0.4;
          solid(g, new THREE.ConeGeometry(0.05, 0.14, 10), "#ffb86b", 0.65, 1.16, 0.15, 1).rotation.z = -0.4;
          [[0.75, 1.4], [0.5, 1.6], [0.86, 1.15]].forEach(([x, y], i) => { const s = sparkle(i % 2 ? 0xffe0f0 : 0xfff6dc); s.material.opacity = 0.95; s.scale.set(0.28, 0.28, 1); s.position.set(x, y, 0.15); g.add(s); formStars.push(s); });
        }
      }
      if (flash){ S.flashAt = performance.now(); }
    }

    /* ---------- the Self: the golden figure and the four guides in a loose ring ---------- */
    let figure = null, figureGlow = null;
    const ring = {};
    if (T.beach){
      figure = chibi({ outfit: "#ffd45e", hair: "#f2bd45", skin: "#fff1d6", iris: "#a07a20" });
      dress(figure, "halo", "#f4c24d");
      figure.scale.setScalar(1.25);
      const p = pts[idxAt(GUIDE_U)];
      figure.position.set(p.x, groundY(p.x, p.z), p.z);
      figure.traverse(o => { if (o.isMesh && o.material.emissive){ o.material.emissive = col("#c88a20"); o.material.emissiveIntensity = 0.28; } });
      figureGlow = sparkle(0xfff0c0); figureGlow.material.opacity = 0.5; figureGlow.scale.set(4.6, 4.6, 1); figureGlow.position.y = 0.95;
      figure.add(figureGlow);
      scene.add(figure);
      const SPOTS = { persona: [-3.3, 0.8], ego: [3.3, 0.8], shadow: [-5.9, -1.6], anima: [5.9, -1.6] };
      (cfg.ring || []).forEach(g => {
        const c = chibi(g);
        dress(c, g.accessory, g.hat || g.outfit);
        if (c.userData.faceMask) c.userData.faceMask.position.y = 0.32;
        const [x, dz] = SPOTS[g.key];
        c.position.set(p.x + x, groundY(p.x + x, p.z + dz), p.z + dz);
        c.rotation.y = Math.atan2(-x, 6);
        c.scale.setScalar(0.001); c.visible = false;
        const gl = sparkle(col(T.halo)); gl.material.opacity = 0.45; gl.scale.set(3.4, 3.4, 1); gl.position.y = 0.9; c.add(gl);
        scene.add(c);
        ring[g.key] = c;
      });
    }

    /* ---------- the door ---------- */
    const door = new THREE.Group();
    let doorLeaf = null, doorGlow = null;
    {
      const arch = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(-w, h - w); s.absarc(0, h - w, w, Math.PI, 0, true); s.lineTo(w, 0); s.closePath(); return s; };
      const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(arch(0.98, 3.3), { depth: 0.3, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, curveSegments: 20 }), new THREE.MeshStandardMaterial({ color: 0x3a3236, roughness: 0.7 }));
      frame.castShadow = true;
      doorLeaf = new THREE.Mesh(new THREE.ExtrudeGeometry(arch(0.8, 3.1), { depth: 0.36, bevelEnabled: false, curveSegments: 20 }), new THREE.MeshStandardMaterial({ color: 0xd9ad52, roughness: 0.4, metalness: 0.35, emissive: 0x6a4a10, emissiveIntensity: 0.5 }));
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.1, 0.4), new THREE.MeshBasicMaterial({ color: 0x7a5a20 }));
      seam.position.set(0, 1.55, 0.18);
      const knob = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 20), new THREE.MeshStandardMaterial({ color: 0xfff0b8, metalness: 0.5, roughness: 0.3 }));
      knob.position.set(0, 1.6, 0.4);
      doorGlow = sparkle(0xffe9b0); doorGlow.scale.set(7, 7, 1); doorGlow.position.y = 1.7;
      door.add(frame, doorLeaf, seam, knob, doorGlow);
      door.visible = false;
      scene.add(door);
    }

    /* ---------- state ---------- */
    const S = { i0: 6, u: 6 * DU, x: pts[6].x, z: pts[6].z, y: 0, h: 0, speed: 0, phase: 0, camYaw: 0, view: false, orbit: 0, jumpY: 0, jumpV: 0, land: 0, side: 0,
      npcU: GUIDE_U, guideOff: 0, answered: false, doorUp: 0, doorU: null, liftAt: 0, greet: 0, hopAt: 0, flashAt: 0, reveal: 1, clear: 0, gone: 0, bridge: [], skyT: 0, doorOpen: 0 };
    { const a = pts[Math.min(SAMPLES, 14)], b = pts[6]; S.h = Math.atan2(-(a.x - b.x), -(a.z - b.z)); }
    const camPos = new THREE.Vector3(S.x + Math.sin(S.h) * 4.9, 1.72, S.z + Math.cos(S.h) * 4.9);
    const camLook = new THREE.Vector3(S.x - Math.sin(S.h) * 8, 2, S.z - Math.cos(S.h) * 8);
    const SPEED = 3.3, TURN = 1.55, MAX_OFF = T.beach ? 7 : 3.1;
    const skyColA = T.skyA.map(col), skyColB = T.skyB.map(col), tmpC = new THREE.Color();
    const clearSky = T.clearSky ? T.clearSky.map(col) : null, clearHaze = T.clearHaze ? col(T.clearHaze) : null;
    const fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
    const vw = () => (canvas.clientWidth || 1) / (canvas.clientHeight || 1);

    if (cfg.animaForm) setAnimaForm(cfg.animaForm, false);

    function guideWorld(){
      const u = Math.min(LEN - 0.5, S.npcU), f = sideFrame(u);
      return { x: f.p.x + f.nx * S.guideOff, z: f.p.z + f.nz * S.guideOff, y: pathY(u, false) };
    }

    function frame(now, dt, inp){
      const canMove = !inp.frozen;
      const fwdKey = canMove && inp.fwd, backKey = canMove && inp.back;
      const turn = canMove ? (inp.left ? 1 : 0) - (inp.right ? 1 : 0) : 0;
      S.h += turn * TURN * dt;

      const n = nearest(S.x, S.z, Math.max(0, S.i0 - 30), Math.min(SAMPLES, S.i0 + 30), 1);
      S.i0 = n.i; S.u = n.i * DU;
      const a = pts[Math.min(SAMPLES, n.i + 8)], b = pts[n.i];
      const pathH = Math.atan2(-(a.x - b.x), -(a.z - b.z));
      const moving = fwdKey || backKey;
      // a gentle hand on the shoulder: while you just walk, your heading eases along the path,
      // so holding forward alone can never lead you into the trees
      if (moving && !turn && fwdKey){
        let dh = pathH - S.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        S.h += dh * Math.min(1, dt * 1.4);
      }
      const onStairs = STAIRS.some(s => S.u > s.u - 0.4 && S.u < s.u + s.n * s.run + 0.3);
      const k = inp.slow != null ? inp.slow : 1;
      const target = moving ? (fwdKey ? SPEED : -SPEED * 0.6) * (onStairs ? 0.68 : 1) * k : 0;
      S.speed += (target - S.speed) * Math.min(1, dt * 7);
      if (Math.abs(S.speed) < 0.02) S.speed = 0;
      fwd.set(-Math.sin(S.h), 0, -Math.cos(S.h));
      let nx = S.x + fwd.x * S.speed * dt, nz = S.z + fwd.z * S.speed * dt;
      const c = nearest(nx, nz, Math.max(0, n.i - 30), Math.min(SAMPLES, n.i + 30), 1);
      if (c.d > MAX_OFF){ const p = pts[c.i], q = MAX_OFF / c.d; nx = p.x + (nx - p.x) * q; nz = p.z + (nz - p.z) * q; }
      const cu = c.i * DU;
      // the game decides how far you may go (the guide, a wall of fog, the door)
      const hitLimit = inp.maxU != null && cu > inp.maxU && S.speed > 0;
      if (hitLimit || (cu < 0.5 && S.speed < 0)){ nx = S.x; nz = S.z; S.speed = 0; }
      S.x = nx; S.z = nz;
      const stepY = T.beach ? groundY(S.x, S.z) : pathY(cu, false);
      S.y += (stepY - S.y) * Math.min(1, dt * 11);

      // the walk
      const sp = Math.abs(S.speed), u = player.userData;
      S.phase += dt * sp * 3.1;
      const swing = Math.sin(S.phase) * Math.min(1, sp / 2) * 0.72;
      u.legs[0].rotation.x = swing; u.legs[1].rotation.x = -swing;
      u.arms[0].rotation.x = -swing * 0.8; u.arms[1].rotation.x = swing * 0.8;
      u.body.position.y = REDUCE ? 0 : Math.abs(Math.cos(S.phase)) * Math.min(1, sp / 2) * 0.05 + Math.sin(now / 900) * 0.006;
      // the jump: up, a tucked-in pose in the air, a small squash on landing
      if (S.jumpY > 0){
        S.jumpV -= 13 * dt; S.jumpY += S.jumpV * dt;
        if (S.jumpY <= 0){ S.jumpY = 0; S.jumpV = 0; S.land = 1; }
        u.legs[0].rotation.x = -0.75; u.legs[1].rotation.x = 0.45;
        u.arms[0].rotation.z = -0.9; u.arms[1].rotation.z = 0.9;
      } else { u.arms[0].rotation.z = 0; u.arms[1].rotation.z = 0; }
      S.land = Math.max(0, S.land - dt * 5);
      const squash = REDUCE ? 0 : Math.sin(S.land * Math.PI) * 0.12;
      u.body.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);
      if ((now % 3600) < 130){ u.eyes.scale.y = 0.12; u.eyes.position.y = -0.044; } else { u.eyes.scale.y = 1; u.eyes.position.y = 0; }
      player.position.set(S.x, S.y + 0.11 + S.jumpY, S.z);
      player.rotation.y = S.h + Math.PI;

      // the camera: low and close behind you; "see myself" walks it round to your front
      if (moving && S.view) { S.view = false; if (inp.onViewEnd) inp.onViewEnd(); }
      if (!drag.on && (moving || S.view)){
        S.camYaw = Math.atan2(Math.sin(S.camYaw), Math.cos(S.camYaw));
        S.camYaw *= Math.max(0, 1 - dt * 1.6);
      }
      S.orbit += ((S.view ? Math.PI : 0) - S.orbit) * Math.min(1, dt * 3);
      const viewT = S.orbit / Math.PI;
      const ch = S.h + S.camYaw + S.orbit;
      const back = (vw() < 0.8 ? 5.6 : 4.9) - viewT * 1.5;
      let fd = 99;
      if (guide || figure || S.doorU != null){
        const fx = S.answered && S.doorU != null ? door.position.x : figure ? figure.position.x : guide.position.x;
        const fz = S.answered && S.doorU != null ? door.position.z : figure ? figure.position.z : guide.position.z;
        fd = Math.hypot(fx - S.x, fz - S.z);
      }
      const aside = 1 - smooth(5, 15, fd);
      S.side += (aside - S.side) * Math.min(1, dt * 2.5);
      const sideX = Math.cos(ch) * S.side * 2.9, sideZ = -Math.sin(ch) * S.side * 2.9;
      tmp.set(S.x + Math.sin(ch) * back + sideX, S.y + 1.72, S.z + Math.cos(ch) * back + sideZ);
      camPos.lerp(tmp, Math.min(1, dt * 6));
      camera.position.copy(camPos);
      faceLight.position.set(camPos.x, camPos.y + 0.6, camPos.z);
      faceLight.intensity = (T.fill || 0) + viewT * 7;
      tmp.set(S.x - Math.sin(ch) * 8 - sideX * 0.1, S.y + 2.0, S.z - Math.cos(ch) * 8 - sideZ * 0.1);
      camLook.lerp(tmp, Math.min(1, dt * 6));
      camera.lookAt(camLook);

      sun.position.set(S.x + SUN_OFFSET.x, S.y + SUN_OFFSET.y, S.z + SUN_OFFSET.z);
      sun.target.position.set(S.x, S.y, S.z - 8);
      sky.position.copy(camera.position);

      // the layer's time of day deepens as you walk in, and the air clears once the shadow is faced
      const skyT = Math.min(1, S.u / Math.max(1, GUIDE_U));
      S.skyT += (skyT - S.skyT) * Math.min(1, dt * 2);
      if (S.clearing) S.clear = Math.min(1, S.clear + dt / 3);
      ["top", "mid", "low"].forEach((name, i) => {
        tmpC.copy(skyColA[i]).lerp(skyColB[i], S.skyT);
        if (clearSky) tmpC.lerp(clearSky[i], S.clear);
        skyU[name].value.copy(tmpC);
      });
      if (clearHaze){
        scene.fog.color.copy(hazeC).lerp(clearHaze, S.clear);
        scene.fog.density = T.fog + (T.clearFog - T.fog) * S.clear;
        hemi.intensity = T.hemi[2] + (T.clearHemi - T.hemi[2]) * S.clear;
        sun.intensity = T.sun[1] + (T.clearSun - T.sun[1]) * S.clear;
      }

      // the guide
      if (guide){
        S.npcU = inp.npcU != null ? inp.npcU : S.npcU;
        if (S.answered) S.guideOff += (2.5 - S.guideOff) * Math.min(1, dt * 1.6);
        const gw = guideWorld(), gu = guide.userData;
        const floaty = cfg.key === "anima" && !REDUCE ? 0.12 + Math.sin(now / 1100) * 0.06 : 0;
        const hop = S.hopAt && now - S.hopAt < 650 ? Math.sin((now - S.hopAt) / 650 * Math.PI) * 0.3 : 0;
        guide.position.set(gw.x, gw.y + 0.11 + floaty + hop, gw.z);
        const gh = Math.atan2(S.x - gw.x, S.z - gw.z);
        guide.rotation.y += Math.atan2(Math.sin(gh - guide.rotation.y), Math.cos(gh - guide.rotation.y)) * Math.min(1, dt * 3);
        gu.body.position.y = REDUCE ? 0 : Math.sin(now / 700) * 0.018;
        const d = Math.hypot(gw.x - S.x, gw.z - S.z);
        if (d < 4.4 && !S.greet) S.greet = now;
        gu.arms[1].rotation.x = S.greet && now - S.greet < 1800 ? -2.5 + Math.sin(now / 90) * 0.35 : 0;
        if ((now % 4300) < 130){ gu.eyes.scale.y = 0.12; gu.eyes.position.y = -0.044; } else { gu.eyes.scale.y = 1; gu.eyes.position.y = 0; }
        if (S.liftAt && gu.faceMask){
          const t = smooth(0, 1100, now - S.liftAt);
          gu.faceMask.position.y = -0.04 + t * 0.36;
          gu.faceMask.rotation.x = -t * 0.55;
        }
        if (S.flashAt){
          const t = (now - S.flashAt) / 1200;
          if (t >= 1){ S.flashAt = 0; guideHalo.scale.set(4.4, 4.4, 1); guideHalo.material.opacity = 0.5; }
          else { const q = 4.4 + Math.sin(t * Math.PI) * 5; guideHalo.scale.set(q, q, 1); guideHalo.material.opacity = 0.5 + Math.sin(t * Math.PI) * 0.45; }
        }
      }
      if (figure){
        figure.rotation.y = Math.atan2(S.x - figure.position.x, S.z - figure.position.z);
        figure.userData.body.position.y = REDUCE ? 0 : Math.sin(now / 800) * 0.03;
        figureGlow.material.opacity = 0.46 + (REDUCE ? 0 : Math.sin(now / 900) * 0.1);
        // the sun rises as you near the figure
        if (seaU.disc){ seaU.disc.position.y = 6 + S.skyT * 18; seaU.glow.position.y = seaU.disc.position.y; }
        Object.keys(ring).forEach(k => {
          const c = ring[k];
          if (S.gone > 0){ const q = Math.max(0.001, c.userData.appear * (1 - S.gone)); c.scale.setScalar(q); c.position.y += dt * 0.5; }
          if (c.visible) c.userData.body.position.y = REDUCE ? 0 : Math.sin(now / 720 + c.position.x) * 0.018;
        });
        if (S.goneOn) S.gone = Math.min(1, S.gone + dt / 1.1);
      }

      // the door rises out of the ground once the conversation is done
      if (door.visible){
        if (S.doorUp < 1){
          S.doorUp = Math.min(1, S.doorUp + dt / (REDUCE ? 0.1 : 1.8));
          door.position.y = pathY(S.doorU, false) - 3.4 * (1 - smooth(0, 1, S.doorUp));
        }
        door.rotation.y = Math.atan2(S.x - door.position.x, S.z - door.position.z);
        if (S.doorOpen > 0){
          S.doorOpen = Math.min(1, S.doorOpen + dt / 0.5);
          const q = 7 + S.doorOpen * 14; doorGlow.scale.set(q, q, 1); doorGlow.material.opacity = 0.6 + S.doorOpen * 0.4;
        }
      }

      if (!REDUCE) hanging.forEach(g => { g.rotation.z = Math.sin(now / 1100 + g.userData.ph) * 0.09; g.rotation.x = Math.cos(now / 1400 + g.userData.ph) * 0.05; });
      if (!REDUCE) birds.forEach(b => { const f = Math.sin(now / 130 + b.userData.ph) * 0.5; b.userData.wings[0].rotation.z = f; b.userData.wings[1].rotation.z = -f; b.position.y = b.userData.y + Math.sin(now / 900 + b.userData.ph) * 0.14; });
      if (formStars.length && !REDUCE) formStars.forEach((s, i) => { const q = 0.22 + Math.abs(Math.sin(now / 500 + i * 2)) * 0.16; s.scale.set(q, q, 1); });
      if (waterU) waterU.t.value = REDUCE ? 0 : now / 1000;
      if (seaU) seaU.t.value = REDUCE ? 0 : now / 1000;
      // moonlight stones lay themselves down one by one
      S.bridge.forEach(s => { if (now > s.at && s.k < 1){ s.k = Math.min(1, s.k + dt / 0.5); s.m.scale.set(s.sx * s.k, s.sy, s.sz * s.k); s.g.material.opacity = 0.22 * s.k; } });
      if (!REDUCE){
        const P = moteGeo.attributes.position;
        for (let i = 0; i < MOTES; i++){
          let x = P.getX(i), y = P.getY(i) + dt * 0.1, z = P.getZ(i);
          x += Math.sin(now / 2000 + moteSeed[i]) * dt * 0.14;
          if (x - S.x > 18) x -= 36; if (x - S.x < -18) x += 36;
          if (z - S.z > 18) z -= 36; if (z - S.z < -18) z += 36;
          if (y - S.y > 8) y = S.y + 0.3;
          P.setXYZ(i, x, y, z);
        }
        P.needsUpdate = true;
      }

      renderer.render(scene, camera);
      return { u: S.u, speed: S.speed };
    }

    // on-screen box of a thing in the world: what the DOM parts (talk bubble, ending) anchor to
    function rectOf(obj, h){
      if (!obj) return null;
      const w = canvas.clientWidth, ht = canvas.clientHeight;
      obj.getWorldPosition(tmp); const fy = tmp.y; tmp.project(camera);
      const x = (tmp.x + 1) / 2 * w, bottom = (1 - tmp.y) / 2 * ht, behind = tmp.z > 1;
      obj.getWorldPosition(tmp); tmp.y = fy + h * (obj.scale.y || 1); tmp.project(camera);
      const top = (1 - tmp.y) / 2 * ht, height = Math.max(4, bottom - top);
      return { x, top, height, width: height * 0.72, behind };
    }

    const drag = { on: false };
    return {
      frame, S, GUIDE_U, LEN, trees: trees.length, stopDist: T.stopDist || 2.7, isBeach: !!T.beach, camera, scene,
      rect(name){
        if (name === "guide") return rectOf(guide, 2.05);
        if (name === "door") return door.visible ? rectOf(door, 3.3) : null;
        if (name === "figure") return rectOf(figure, 2.05);
        return rectOf(ring[name], 2.05);
      },
      setReveal(q){
        if (!guide || S.reveal === q) return;
        S.reveal = q;
        const b = 0.2 + 0.8 * q;
        guideMats.forEach(({ m, c }) => m.color.copy(c).multiplyScalar(b));
        guideHalo.material.opacity = 0.5 * q;
      },
      showDoor(u, color){
        S.answered = true; S.doorU = u;
        const p = pts[idxAt(u)];
        door.position.set(p.x, pathY(u, false) - 3.4, p.z);
        door.visible = true;
        if (color) doorLeaf.material.color.set(color).lerp(col("#ffffff"), 0.05);
        if (color) doorLeaf.material.emissive.set(color).multiplyScalar(0.4);
        if (color) doorGlow.material.color.set(color).lerp(col("#ffffff"), 0.5);
        S.hopAt = performance.now();
      },
      openDoor(){ S.doorOpen = 0.001; },
      liftMask(){ S.liftAt = performance.now(); },
      clearRain(){ S.clearing = true; },
      setAnimaForm,
      setRingAppear(key, t){
        const c = ring[key]; if (!c) return;
        c.visible = t > 0.01; c.userData.appear = smooth(0, 1, t);
        if (!S.goneOn) c.scale.setScalar(Math.max(0.001, c.userData.appear));
      },
      guidesGone(){ S.goneOn = true; },
      moonBridge(){
        // from where you stand, across the pool, to the guide's feet
        const now = performance.now(), from = Math.max(S.u + 0.8, 1), to = S.npcU + 1;
        const n = Math.max(4, Math.min(11, Math.round((to - from) / 0.95)));
        for (let i = 0; i < n; i++){
          const u = from + (to - from) * (i + 0.5) / n, f = sideFrame(u), o = Math.sin(i * 1.7) * 0.32;
          const y = (Math.abs(u - poolU) < 2.6 ? pathY(poolU, false) + 0.09 : pathY(u, true) + 0.12);
          const m = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: col("#ffefb8").multiplyScalar(1.25), toneMapped: false, fog: false }));
          const sx = 0.5, sy = 0.035, sz = 0.36;
          m.position.set(f.p.x + f.nx * o, y, f.p.z + f.nz * o); m.scale.set(0.001, sy, 0.001); m.rotation.y = i;
          const g = sparkle(0xffe39a); g.material.opacity = 0; g.scale.set(1.15, 1.15, 1); g.position.copy(m.position); g.position.y += 0.1;
          scene.add(m, g);
          S.bridge.push({ m, g, k: 0, sx, sy, sz, at: now + (REDUCE ? 0 : i * 200) });
        }
      },
      addLaidMask(svg){
        // your own mask, drawn from the same picture as the 2D one, resting against the path's edge
        const f = offPath(S.npcU - 0.6, -2.6), y = groundY(f.x, f.z);
        const host = document.createElement("div"); host.innerHTML = svg;
        const el = host.querySelector("svg");
        if (!el) return;
        el.setAttribute("xmlns", "http://www.w3.org/2000/svg"); el.setAttribute("width", "256"); el.setAttribute("height", "372");
        const img = new Image();
        img.onload = () => {
          try{
            const c = document.createElement("canvas"); c.width = 256; c.height = 372;
            c.getContext("2d").drawImage(img, 0, 0, 256, 372);
            const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.96), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 }));
            m.position.set(f.x, y + 0.44, f.z); m.rotation.set(-0.42, Math.atan2(S.x - f.x, S.z - f.z), 0);
            m.castShadow = true;
            scene.add(m);
          }catch(e){}
        };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
      },
      // jump along the path (used by the automated checks)
      goTo(u){ const i = idxAt(u), p = pts[i], q = pts[Math.min(SAMPLES, i + 8)];
        S.x = p.x; S.z = p.z; S.i0 = i; S.u = i * DU; S.h = Math.atan2(-(q.x - p.x), -(q.z - p.z)); S.y = pathY(u, false);
        camPos.set(S.x + Math.sin(S.h) * 4.9, S.y + 1.72, S.z + Math.cos(S.h) * 4.9); camLook.set(S.x - Math.sin(S.h) * 8, S.y + 2, S.z - Math.cos(S.h) * 8); S.skyT = Math.min(1, S.u / GUIDE_U); },
      jump(){ if (S.jumpY > 0) return; S.jumpV = REDUCE ? 3.2 : 4.7; S.jumpY = 0.001; },
      toggleView(){ S.view = !S.view; return S.view; },
      setDrag(on){ drag.on = on; },
      turnLook(dx){ S.camYaw -= dx * 0.005; }
    };
  }

  function disposeScene(scene){
    const seen = new Set();
    scene.traverse(o => {
      if (o.geometry && !seen.has(o.geometry)){ seen.add(o.geometry); o.geometry.dispose(); }
      const m = o.material;
      if (m && !seen.has(m)){
        seen.add(m);
        ["map"].forEach(k => { if (m[k] && !seen.has(m[k])){ seen.add(m[k]); m[k].dispose(); } });
        m.dispose();
      }
      if (o.dispose && o.isInstancedMesh) o.dispose();
    });
  }

  let ratio = 1, slowFrames = 0, sampled = 0;
  function resize(){
    if (!renderer || !canvas) return;
    const w = canvas.clientWidth || global.innerWidth, h = canvas.clientHeight || global.innerHeight;
    renderer.setSize(w, h, false);
    if (W){
      W.camera.aspect = w / h;
      W.camera.fov = W.camera.aspect < 0.8 ? 68 : 58;
      W.camera.updateProjectionMatrix();
    }
  }

  global.Forest3D = {
    supported(){
      if (!global.THREE) return false;
      try{
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
      }catch(e){ return false; }
    },
    init(el){
      canvas = el;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      ratio = Math.min(global.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2);
      renderer.setPixelRatio(ratio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      global.addEventListener("resize", resize);
      let dragX = null;
      const host = el.parentElement;
      host.addEventListener("pointerdown", e => {
        if (e.target.closest("button, a, input")) return;
        dragX = e.clientX; if (W) W.setDrag(true);
      });
      global.addEventListener("pointermove", e => { if (dragX != null && W){ W.turnLook(e.clientX - dragX); dragX = e.clientX; } });
      global.addEventListener("pointerup", () => { dragX = null; if (W) W.setDrag(false); });
      global.addEventListener("pointercancel", () => { dragX = null; if (W) W.setDrag(false); });
    },
    build(cfg){
      this.clear();
      W = makeWorld(cfg);
      resize();
      return W;
    },
    clear(){
      if (W){ disposeScene(W.scene); W = null; }
      if (renderer) renderer.renderLists.dispose();
    },
    frame(now, dtMs, inp){
      if (!W) return null;
      const r = W.frame(now, dtMs / 1000, inp);
      // lower the resolution rather than stutter, if this machine can't keep up
      sampled++; if (dtMs > 30) slowFrames++;
      if (sampled >= 90){
        if (slowFrames > 60 && ratio > 1){ ratio = Math.max(1, ratio - 0.5); renderer.setPixelRatio(ratio); resize(); }
        sampled = 0; slowFrames = 0;
      }
      return r;
    },
    get world(){ return W; },
    get info(){ return renderer ? renderer.info.render : null; },
    resize
  };
})(window);
