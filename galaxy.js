/* ══════════════════════════════════════════════════════════════
   LaunchpadNova · CINEMATIC GALAXY ENGINE v2.0
   Photorealistic planets via procedural canvas textures,
   rim-light atmospheres, layered sun corona, dense starfield
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── GUARD ──────────────────────────────────────────────────── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) return;

  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;

  /* ── CONSTANTS ──────────────────────────────────────────────── */
  const OVERVIEW_POS    = { x: 0,   y: 90,  z: 175 };
  const OVERVIEW_TARGET = { x: 0,   y: -5,  z: -10 };
  const INTRO_POS       = { x: 50,  y: 180, z: 280 };

  /* ── PLANET DEFINITIONS ─────────────────────────────────────── */
  const PLANETS = [
    {
      id: 'sun', name: 'LaunchpadNova', labelText: '☀ LaunchpadNova',
      panelId: 'panel-sun', pos: { x: 0, y: 0, z: 0 },
      radius: 13, isSun: true,
      glowColor: '#FF8800', glowSize: 90,
      glowColor2: '#FFCC00', glowSize2: 140,
      camOffset: { x: 0, y: 20, z: 55 }, camLookOffset: { x: 0, y: 0, z: 0 },
      labelColor: '#FFB800', rotSpeed: 0.002
    },
    {
      id: 'nova', name: 'Nova AI', labelText: '🌙 Nova',
      panelId: 'panel-nova',
      orbitRadius: 22, orbitSpeed: reduced ? 0 : 0.18, orbitAngle: Math.PI * 0.25,
      radius: 3.8, isMoon: true,
      glowColor: '#A78BFA', glowSize: 26,
      camOffset: { x: 12, y: 10, z: 30 },
      labelColor: '#A78BFA', rotSpeed: 0.007
    },
    {
      id: 'hiw', name: 'How It Works', labelText: '⚡ How It Works',
      panelId: 'panel-hiw', pos: { x: 52, y: 3, z: 18 },
      radius: 6.5,
      glowColor: '#60A5FA', glowSize: 38,
      camOffset: { x: -8, y: 14, z: 38 },
      labelColor: '#60A5FA', rotSpeed: 0.004
    },
    {
      id: 'results', name: 'Results', labelText: '📈 Results',
      panelId: 'panel-results', pos: { x: -38, y: -3, z: -50 },
      radius: 5.8,
      glowColor: '#67E8F9', glowSize: 32,
      camOffset: { x: 10, y: 14, z: 35 },
      labelColor: '#67E8F9', rotSpeed: 0.005
    },
    {
      id: 'pricing', name: 'Pricing', labelText: '💎 Pricing',
      panelId: 'panel-pricing', pos: { x: 78, y: 6, z: -28 },
      radius: 9.5, hasRings: true,
      glowColor: '#7C3AED', glowSize: 55,
      camOffset: { x: -12, y: 18, z: 50 },
      labelColor: '#8B5CF6', rotSpeed: 0.0015
    },
    {
      id: 'about', name: 'About', labelText: '🚀 About',
      panelId: 'panel-about', pos: { x: -75, y: 5, z: 18 },
      radius: 5.2,
      glowColor: '#FBBF24', glowSize: 30,
      camOffset: { x: 10, y: 14, z: 35 },
      labelColor: '#FBBF24', rotSpeed: 0.006
    },
    {
      id: 'faq', name: 'FAQ', labelText: '✦ FAQ',
      panelId: 'panel-faq', pos: { x: 22, y: -6, z: -75 },
      radius: 5.5,
      glowColor: '#F472B6', glowSize: 30,
      camOffset: { x: -8, y: 14, z: 38 },
      labelColor: '#F472B6', rotSpeed: 0.005
    },
    {
      id: 'contact', name: 'Contact', labelText: '✉ Contact',
      panelId: 'panel-contact', pos: { x: -55, y: 7, z: -78 },
      radius: 6.2,
      glowColor: '#34D399', glowSize: 34,
      camOffset: { x: 10, y: 14, z: 38 },
      labelColor: '#4ADE80', rotSpeed: 0.004
    }
  ];

  /* ── STATE ──────────────────────────────────────────────────── */
  let scene, camera, renderer, clock;
  let planetMeshes = [], glowSprites = [], labelEls = [];
  let activePlanet = null, isFlying = false;
  let cameraTarget = new THREE.Vector3(0, 0, 0);
  let starParticles, sunLight, raycaster, mouse, hoveredPlanet = null;

  /* ══════════════════════════════════════════════════════════════
     PROCEDURAL TEXTURE FACTORY
     Generates photorealistic planet surfaces via canvas 2D
     ══════════════════════════════════════════════════════════════ */

  /* Fast value noise (1–2 octave, good enough for planet surface) */
  function hash(x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function valueNoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct) {
    let v = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < oct; i++) {
      v += valueNoise(x * freq, y * freq) * amp;
      max += amp; amp *= 0.5; freq *= 2.1;
    }
    return v / max;
  }

  /* Lerp between two hex colors */
  function lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  /* ── Sun texture ─────────────────────────────────────────────── */
  function makeSunTexture(size) {
    const c = document.createElement('canvas'); c.width = size; c.height = size / 2;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size / 2);
    const d = imgData.data;
    const cols = [
      [255, 255, 200], [255, 220, 80], [255, 160, 20], [220, 80, 10], [180, 40, 0]
    ];
    for (let y = 0; y < size / 2; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / (size / 2);
        // Granulation noise
        const n1 = fbm(u * 12, v * 12, 4);
        const n2 = fbm(u * 5 + 1.7, v * 5 + 0.9, 3) * 0.5;
        const n = (n1 * 0.7 + n2 * 0.3);
        // Sunspot: rare dark patches
        const sp = fbm(u * 6 + 3, v * 6 + 2, 2);
        const spotMask = sp > 0.72 ? (sp - 0.72) / 0.28 : 0;
        const t = Math.max(0, Math.min(1, n + spotMask * 0.3));
        const ci = Math.floor(t * (cols.length - 1));
        const ct = t * (cols.length - 1) - ci;
        const c1 = cols[Math.min(ci, cols.length - 1)];
        const c2 = cols[Math.min(ci + 1, cols.length - 1)];
        const idx = (y * size + x) * 4;
        d[idx]     = Math.round(c1[0] + (c2[0] - c1[0]) * ct) * (1 - spotMask * 0.6);
        d[idx + 1] = Math.round(c1[1] + (c2[1] - c1[1]) * ct) * (1 - spotMask * 0.7);
        d[idx + 2] = Math.round(c1[2] + (c2[2] - c1[2]) * ct) * (1 - spotMask * 0.8);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /* ── Gas giant texture (banded, like Jupiter/Saturn) ─────────── */
  function makeGasGiantTexture(size, bandColors, turbulence) {
    const c = document.createElement('canvas'); c.width = size; c.height = size / 2;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size / 2);
    const d = imgData.data;
    for (let y = 0; y < size / 2; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / (size / 2);
        // Horizontal bands
        const bandNoise = fbm(u * 3, v * 8, 3) * turbulence;
        const bandV = (v + bandNoise) % 1;
        // Pick band color
        const bi = bandV * bandColors.length;
        const ci = Math.floor(bi) % bandColors.length;
        const cn = Math.floor(bi + 1) % bandColors.length;
        const t = bi - Math.floor(bi);
        // Storm oval (subtle)
        const stormDist = Math.sqrt((u - 0.25) ** 2 * 4 + (v - 0.6) ** 2 * 16);
        const stormMask = Math.max(0, 1 - stormDist * 4);
        const n = fbm(u * 18, v * 18, 3) * 0.12;
        const idx = (y * size + x) * 4;
        const cc1 = bandColors[ci], cc2 = bandColors[cn];
        d[idx]     = Math.round((cc1[0] + (cc2[0] - cc1[0]) * t) * (1 - stormMask * 0.3 + n));
        d[idx + 1] = Math.round((cc1[1] + (cc2[1] - cc1[1]) * t) * (1 - stormMask * 0.2 + n));
        d[idx + 2] = Math.round((cc1[2] + (cc2[2] - cc1[2]) * t) * (1 - stormMask * 0.1 + n));
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  /* ── Rocky/terrestrial planet texture ───────────────────────── */
  function makeRockyTexture(size, landColor, seaColor, snowCaps) {
    const c = document.createElement('canvas'); c.width = size; c.height = size / 2;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size / 2);
    const d = imgData.data;
    for (let y = 0; y < size / 2; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / (size / 2);
        const n = fbm(u * 4 + 0.3, v * 4 + 1.1, 5);
        // Ice caps at poles
        const poleDist = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles
        const iceMask = snowCaps ? Math.max(0, (poleDist - 0.75) * 4) : 0;
        // Cloud layer
        const cloud = fbm(u * 6 + 2.1, v * 5 + 0.7, 3);
        const cloudMask = Math.max(0, cloud - 0.52) * 2.5;
        // Crater detail (subtle)
        const craterN = fbm(u * 20, v * 20, 2);
        const crater = craterN > 0.65 ? (craterN - 0.65) * 0.3 : 0;
        const land = n > 0.48;
        const lc = land ? landColor : seaColor;
        const t = Math.min(1, Math.max(0, (n - 0.48) / 0.12 + 0.5));
        const idx = (y * size + x) * 4;
        // Blend land/sea
        const r = land ? lc[0] * (1 - crater) : lc[0];
        const g = land ? lc[1] * (1 - crater) : lc[1];
        const b = land ? lc[2] * (1 - crater) : lc[2];
        // Apply ice cap
        const ri = r + (255 - r) * iceMask;
        const gi = g + (255 - g) * iceMask;
        const bi = b + (255 - b) * iceMask;
        // Apply clouds (white)
        d[idx]     = Math.min(255, Math.round(ri + (255 - ri) * cloudMask * 0.8));
        d[idx + 1] = Math.min(255, Math.round(gi + (255 - gi) * cloudMask * 0.8));
        d[idx + 2] = Math.min(255, Math.round(bi + (255 - bi) * cloudMask * 0.8));
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  /* ── Bump/roughness map (greyscale noise) ────────────────────── */
  function makeBumpTexture(size, scale, oct) {
    const c = document.createElement('canvas'); c.width = size; c.height = size / 2;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(size, size / 2);
    const d = imgData.data;
    for (let y = 0; y < size / 2; y++) {
      for (let x = 0; x < size; x++) {
        const n = fbm(x / size * scale, y / (size / 2) * scale, oct);
        const v = Math.round(n * 255);
        const idx = (y * size + x) * 4;
        d[idx] = d[idx + 1] = d[idx + 2] = v; d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  /* ── Get texture set per planet ──────────────────────────────── */
  function getPlanetTextures(cfg) {
    const S = 512; // texture resolution
    if (cfg.isSun) {
      return { map: makeSunTexture(S * 2), roughness: null };
    }
    switch (cfg.id) {
      case 'nova':     // violet ice moon
        return {
          map: makeRockyTexture(S, [120, 80, 200], [60, 30, 130], false),
          roughnessMap: makeBumpTexture(S, 8, 3)
        };
      case 'hiw':      // blue gas giant with bands
        return {
          map: makeGasGiantTexture(S,
            [[20,50,180],[40,90,220],[80,140,240],[30,70,200],[15,40,160],[50,100,230]],
            0.18),
          roughnessMap: makeBumpTexture(S, 6, 2)
        };
      case 'results':  // cyan ice world
        return {
          map: makeRockyTexture(S, [30, 180, 200], [10, 120, 160], true),
          roughnessMap: makeBumpTexture(S, 10, 4)
        };
      case 'pricing':  // violet gas giant (Saturn-like)
        return {
          map: makeGasGiantTexture(S,
            [[80,20,160],[120,50,200],[100,30,180],[60,10,140],[140,70,210],[90,25,170]],
            0.22),
          roughnessMap: makeBumpTexture(S, 5, 2)
        };
      case 'about':    // amber desert/rock (Mars-like)
        return {
          map: makeRockyTexture(S, [200, 120, 30], [160, 80, 20], false),
          roughnessMap: makeBumpTexture(S, 12, 5)
        };
      case 'faq':      // pink — smooth cloud world
        return {
          map: makeGasGiantTexture(S,
            [[220,80,140],[200,60,120],[240,110,160],[210,70,130],[230,90,150]],
            0.12),
          roughnessMap: makeBumpTexture(S, 4, 2)
        };
      case 'contact':  // green lush world
        return {
          map: makeRockyTexture(S, [20, 160, 80], [10, 80, 140], true),
          roughnessMap: makeBumpTexture(S, 9, 4)
        };
      default:
        return { map: null };
    }
  }

  /* ══════════════════════════════════════════════════════════════
     SCENE INIT
     ══════════════════════════════════════════════════════════════ */
  function init() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020108, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020108, 0.0018);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2500);
    camera.position.set(INTRO_POS.x, INTRO_POS.y, INTRO_POS.z);
    cameraTarget.set(0, 0, 0);
    clock = new THREE.Clock();

    buildLights();
    buildStarfield();
    buildNebula();
    buildPlanets();
    buildOrbitalRings();
    buildAsteroidBelt();
    buildLabels();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('click', onCanvasClick);
    window.addEventListener('resize', onResize, { passive: true });

    bootSequence();
    animate();
  }

  /* ── LIGHTS ──────────────────────────────────────────────────── */
  function buildLights() {
    scene.add(new THREE.AmbientLight(0x080518, 1.4));
    sunLight = new THREE.PointLight(0xFFE080, 4.0, 400, 1.5);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    // Subtle cool rim from opposite side
    const rim = new THREE.DirectionalLight(0x1030A0, 0.45);
    rim.position.set(-1, 0.5, -1).normalize();
    scene.add(rim);
  }

  /* ── STARFIELD ───────────────────────────────────────────────── */
  function buildStarfield() {
    // Layer 1: dense small stars
    const count1 = 8000;
    const pos1 = new Float32Array(count1 * 3);
    const col1 = new Float32Array(count1 * 3);
    const sz1  = new Float32Array(count1);
    const starPalette = [[1,.95,.85],[.85,.9,1],[.9,.85,1],[1,1,1],[1,1,.9]];
    for (let i = 0; i < count1; i++) {
      const r = 700 + Math.random() * 900;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos1[i*3]   = r*Math.sin(ph)*Math.cos(th);
      pos1[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      pos1[i*3+2] = r*Math.cos(ph);
      const p = starPalette[Math.floor(Math.random() * starPalette.length)];
      col1[i*3]=p[0]; col1[i*3+1]=p[1]; col1[i*3+2]=p[2];
      sz1[i] = Math.random() < 0.03 ? 3.2 : Math.random() < 0.12 ? 1.8 : 0.8;
    }
    const geo1 = new THREE.BufferGeometry();
    geo1.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
    geo1.setAttribute('color',    new THREE.BufferAttribute(col1, 3));
    geo1.setAttribute('size',     new THREE.BufferAttribute(sz1, 1));
    const mat1 = new THREE.PointsMaterial({
      map: buildCircleTex(64), size: 1.2, sizeAttenuation: true,
      vertexColors: true, transparent: true, alphaTest: 0.01,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    starParticles = new THREE.Points(geo1, mat1);
    scene.add(starParticles);

    // Layer 2: bright star spikes (a handful of very bright stars)
    addBrightStars();
  }

  function addBrightStars() {
    const spikeTex = buildSpikeTex(128);
    const brightPositions = [
      [400, 200, -600], [-500, -100, -500], [300, 350, -700],
      [-350, 250, 600], [600, -200, 400], [-400, -300, -500]
    ];
    brightPositions.forEach(([x,y,z]) => {
      const mat = new THREE.SpriteMaterial({
        map: spikeTex, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.7, depthWrite: false,
        color: new THREE.Color(0.9, 0.95, 1.0)
      });
      const s = new THREE.Sprite(mat);
      s.position.set(x, y, z);
      s.scale.set(12, 12, 1);
      scene.add(s);
    });
  }

  /* ── NEBULA ──────────────────────────────────────────────────── */
  function buildNebula() {
    const nebulas = [
      { color: '#18083C', pos: [-220, 70, -310], size: 400, opacity: 0.65 },
      { color: '#06183A', pos: [320, -90, -220], size: 350, opacity: 0.55 },
      { color: '#280838', pos: [-100, 110, 210],  size: 300, opacity: 0.5 },
      { color: '#001838', pos: [200, 50, 260],    size: 260, opacity: 0.45 },
      { color: '#0A0228', pos: [0,  -180,  100],  size: 500, opacity: 0.4 },
    ];
    nebulas.forEach(({ color, pos, size, opacity }) => {
      const tex = buildRadialTex(256, color);
      const mat = new THREE.SpriteMaterial({
        map: tex, blending: THREE.AdditiveBlending,
        transparent: true, opacity, depthWrite: false
      });
      const s = new THREE.Sprite(mat);
      s.position.set(...pos);
      s.scale.set(size, size, 1);
      scene.add(s);
    });
  }

  /* ── PLANETS ─────────────────────────────────────────────────── */
  function buildPlanets() {
    PLANETS.forEach((cfg, idx) => {
      const group = new THREE.Group();
      scene.add(group);
      if (!cfg.isMoon) group.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);

      /* Generate texture maps */
      const textures = getPlanetTextures(cfg);

      /* Main planet sphere */
      const geo = new THREE.SphereGeometry(cfg.radius, 80, 80);
      let mat;
      if (cfg.isSun) {
        mat = new THREE.MeshStandardMaterial({
          map: textures.map,
          emissive: new THREE.Color(0xFF6000),
          emissiveIntensity: 0.9,
          emissiveMap: textures.map,
          roughness: 0.8, metalness: 0.0
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          map: textures.map || undefined,
          bumpMap: textures.roughnessMap || undefined,
          bumpScale: 0.8,
          roughnessMap: textures.roughnessMap || undefined,
          roughness: 0.85,
          metalness: 0.0
        });
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.planetIdx = idx;
      mesh.userData.planetId  = cfg.id;
      group.add(mesh);

      /* ── Sun extras ── */
      if (cfg.isSun) {
        // Inner hot corona
        addAtmosphere(group, cfg.radius * 1.08, 0xFF8800, 0.18, THREE.BackSide);
        addAtmosphere(group, cfg.radius * 1.25, 0xFF5500, 0.10, THREE.BackSide);
        // Outer diffuse halo
        addAtmosphere(group, cfg.radius * 1.60, 0xFF3300, 0.05, THREE.BackSide);
        // Sun corona sprite (soft multi-layer)
        addGlowSprite(group, cfg.glowColor, cfg.glowSize, 0.72);
        addGlowSprite(group, cfg.glowColor2 || '#FFAA00', cfg.glowSize2 || 120, 0.38);
      } else {
        /* ── Atmosphere rim glow (thin additive sphere, backSide) ── */
        const atmColors = {
          nova:    [0xAA80FF, 0.28],  hiw:     [0x4488FF, 0.22],
          results: [0x44DDFF, 0.22],  pricing: [0x8844EE, 0.22],
          about:   [0xFFAA44, 0.22],  faq:     [0xFF44AA, 0.22],
          contact: [0x44FF99, 0.22]
        };
        const [atmCol, atmOp] = atmColors[cfg.id] || [0x8888FF, 0.2];
        addAtmosphere(group, cfg.radius * 1.10, atmCol, atmOp, THREE.BackSide);
        addAtmosphere(group, cfg.radius * 1.25, atmCol, atmOp * 0.5, THREE.BackSide);
        addGlowSprite(group, cfg.glowColor, cfg.glowSize, 0.5);
      }

      /* ── Saturn rings ── */
      if (cfg.hasRings) buildRealisticRings(group, cfg.radius);

      cfg._group = group;
      cfg._mesh  = mesh;
      cfg._angle = cfg.orbitAngle || 0;
      planetMeshes.push(mesh);
      glowSprites.push(group.children.find(c => c.isSprite) || mesh);
    });
  }

  function addAtmosphere(group, radius, color, opacity, side) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, side
    });
    group.add(new THREE.Mesh(geo, mat));
  }

  function addGlowSprite(group, color, size, opacity) {
    const tex = buildGlowTex(256, color);
    const mat = new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending,
      transparent: true, opacity, depthWrite: false
    });
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    group.add(s);
    return s;
  }

  /* ── Realistic multi-band rings ────────────────────────────── */
  function buildRealisticRings(group, radius) {
    const ringTex = buildRingTexture(512);
    const innerR = radius * 1.3, outerR = radius * 2.6;
    const geo = new THREE.RingGeometry(innerR, outerR, 120, 6);
    // Remap UVs so texture maps radially
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const d = v.length();
      uv.setXY(i, (d - innerR) / (outerR - innerR), 0.5);
    }
    const mat = new THREE.MeshBasicMaterial({
      map: ringTex, side: THREE.DoubleSide,
      transparent: true, depthWrite: false,
      blending: THREE.NormalBlending
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI * 0.44;
    ring.rotation.z = Math.PI * 0.05;
    group.add(ring);
  }

  function buildRingTexture(size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = 1;
    const ctx = c.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, size, 0);
    // Multi-band ring like Saturn
    grd.addColorStop(0,    'rgba(80,50,120,0)');
    grd.addColorStop(0.05, 'rgba(120,80,180,0.55)');
    grd.addColorStop(0.12, 'rgba(100,65,155,0.4)');
    grd.addColorStop(0.20, 'rgba(140,100,200,0.65)');
    grd.addColorStop(0.28, 'rgba(90,55,140,0.35)');
    grd.addColorStop(0.36, 'rgba(160,120,220,0.7)');
    grd.addColorStop(0.44, 'rgba(80,50,130,0.28)');
    grd.addColorStop(0.52, 'rgba(180,140,240,0.72)');
    grd.addColorStop(0.62, 'rgba(100,70,160,0.4)');
    grd.addColorStop(0.72, 'rgba(150,110,210,0.55)');
    grd.addColorStop(0.82, 'rgba(70,45,120,0.22)');
    grd.addColorStop(0.92, 'rgba(110,80,170,0.3)');
    grd.addColorStop(1,    'rgba(60,40,100,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /* ── ORBITAL RINGS ───────────────────────────────────────────── */
  function buildOrbitalRings() {
    buildOrbitLine(22, 0.05, 0xA78BFA);
    PLANETS.filter(p => !p.isSun && !p.isMoon).forEach(cfg => {
      const r = Math.sqrt(cfg.pos.x ** 2 + cfg.pos.z ** 2);
      buildOrbitLine(r, 0.025, new THREE.Color(cfg.glowColor).getHex());
    });
  }

  function buildOrbitLine(radius, opacity, color) {
    const pts = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    scene.add(new THREE.Line(geo, mat));
  }

  /* ── ASTEROID BELT ───────────────────────────────────────────── */
  function buildAsteroidBelt() {
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 32 + Math.random() * 12;
      pos[i*3]   = Math.cos(a) * r;
      pos[i*3+1] = (Math.random() - 0.5) * 2.5;
      pos[i*3+2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x889AAA, size: 0.35, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false
    })));
  }

  /* ── LABELS ──────────────────────────────────────────────────── */
  function buildLabels() {
    const container = document.getElementById('planet-labels');
    if (!container) return;
    PLANETS.forEach((cfg, idx) => {
      const el = document.createElement('div');
      el.className = 'planet-label';
      el.dataset.planetIdx = idx;
      el.style.setProperty('--pcolor', cfg.labelColor);
      const dot = document.createElement('span'); dot.className = 'plabel-dot';
      const text = document.createElement('span'); text.textContent = cfg.labelText;
      el.appendChild(dot); el.appendChild(text);
      el.addEventListener('click', () => navigateToPlanet(idx));
      container.appendChild(el);
      labelEls.push(el);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     TEXTURE UTILITIES
     ══════════════════════════════════════════════════════════════ */
  function buildCircleTex(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    g.addColorStop(0,'#fff'); g.addColorStop(0.35,'#fff');
    g.addColorStop(0.7,'rgba(255,255,255,.4)'); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(c);
  }

  function buildSpikeTex(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    const cx = size/2, cy = size/2, r = size/2;
    // Soft core
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r*0.4);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,size,size);
    // 4-point diffraction spikes
    ctx.globalCompositeOperation='screen';
    [[0,1],[1,0],[0.7,0.7],[0.7,-0.7]].forEach(([dx,dy]) => {
      const gr = ctx.createLinearGradient(cx-dx*r,cy-dy*r,cx+dx*r,cy+dy*r);
      gr.addColorStop(0,'rgba(200,220,255,0)');
      gr.addColorStop(0.45,'rgba(200,220,255,0.5)');
      gr.addColorStop(0.5,'rgba(255,255,255,0.9)');
      gr.addColorStop(0.55,'rgba(200,220,255,0.5)');
      gr.addColorStop(1,'rgba(200,220,255,0)');
      ctx.strokeStyle=gr; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(cx-dx*r,cy-dy*r); ctx.lineTo(cx+dx*r,cy+dy*r);
      ctx.stroke();
    });
    return new THREE.CanvasTexture(c);
  }

  function buildGlowTex(size, color) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    const r = parseInt(color.slice(1,3),16)||0;
    const g = parseInt(color.slice(3,5),16)||0;
    const b = parseInt(color.slice(5,7),16)||0;
    const gr = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    gr.addColorStop(0,   `rgba(${r},${g},${b},1)`);
    gr.addColorStop(0.2, `rgba(${r},${g},${b},0.7)`);
    gr.addColorStop(0.5, `rgba(${r},${g},${b},0.25)`);
    gr.addColorStop(0.8, `rgba(${r},${g},${b},0.06)`);
    gr.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr; ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(c);
  }

  function buildRadialTex(size, hex) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    // parse 6-digit hex
    const r = parseInt(hex.slice(1,3),16)||0;
    const g = parseInt(hex.slice(3,5),16)||0;
    const b = parseInt(hex.slice(5,7),16)||0;
    const gr = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    gr.addColorStop(0,`rgba(${r},${g},${b},0.9)`);
    gr.addColorStop(0.5,`rgba(${r},${g},${b},0.45)`);
    gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.fillStyle=gr; ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(c);
  }

  /* ══════════════════════════════════════════════════════════════
     BOOT SEQUENCE
     ══════════════════════════════════════════════════════════════ */
  function bootSequence() {
    const loader = document.getElementById('galaxy-loader');
    let progress = 0;
    const bar = document.querySelector('.loader-bar-fill');
    const status = document.querySelector('.loader-status');
    const steps = ['Generating planet surfaces','Mapping star systems','Charging solar core','Ready for launch'];
    const iv = setInterval(() => {
      progress += Math.random() * 18 + 6;
      if (progress >= 100) { progress = 100; clearInterval(iv); }
      if (bar) bar.style.width = progress + '%';
      if (status) status.textContent = steps[Math.floor(progress / 26)] || steps[3];
    }, 200);
    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      runIntroAnimation();
    }, 1800);
  }

  function runIntroAnimation() {
    if (reduced) {
      camera.position.set(OVERVIEW_POS.x, OVERVIEW_POS.y, OVERVIEW_POS.z);
      cameraTarget.set(OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z);
      setLabelsVisibility(true); hideIntroText(); return;
    }
    setTimeout(hideIntroText, 2400);
    gsap.timeline({ delay: 0.5 })
      .to(camera.position, { x: OVERVIEW_POS.x, y: OVERVIEW_POS.y, z: OVERVIEW_POS.z, duration: 4.0, ease: 'power2.inOut' })
      .to(cameraTarget,    { x: OVERVIEW_TARGET.x, y: OVERVIEW_TARGET.y, z: OVERVIEW_TARGET.z, duration: 4.0, ease: 'power2.inOut' }, '<')
      .call(() => setLabelsVisibility(true));
  }

  function hideIntroText() {
    const el = document.getElementById('intro-text');
    if (el) { el.style.transition='opacity .8s ease'; el.style.opacity='0'; setTimeout(()=>{ if(el) el.style.display='none'; }, 900); }
  }

  /* ══════════════════════════════════════════════════════════════
     NAVIGATION
     ══════════════════════════════════════════════════════════════ */
  function navigateToPlanet(idx) {
    if (isFlying) return;
    const cfg = PLANETS[idx];
    closeAllPanels(); isFlying = true; setLabelsVisibility(false);
    const overlay = document.getElementById('travel-overlay');
    if (overlay) overlay.classList.add('active');
    const pp = getPlanetWorldPos(cfg);
    const off = cfg.camOffset || { x: 0, y: 15, z: 40 };
    const la  = cfg.camLookOffset || { x: 0, y: 0, z: 0 };
    const tl = gsap.timeline({ onComplete: () => {
      isFlying = false; activePlanet = idx;
      if (overlay) overlay.classList.remove('active');
      openPanel(cfg.panelId); updateNavActive(cfg.id); showOverviewBtn();
    }});
    tl.to(camera.position,{ x:OVERVIEW_POS.x, y:OVERVIEW_POS.y+10, z:OVERVIEW_POS.z, duration:0.9, ease:'power2.in' })
      .to(cameraTarget,   { x:OVERVIEW_TARGET.x, y:OVERVIEW_TARGET.y, z:OVERVIEW_TARGET.z, duration:0.9, ease:'power2.in' }, '<')
      .to(camera.position,{ x:pp.x+off.x, y:pp.y+off.y, z:pp.z+off.z, duration:1.5, ease:'power2.inOut' })
      .to(cameraTarget,   { x:pp.x+la.x,  y:pp.y+la.y,  z:pp.z+la.z,  duration:1.5, ease:'power2.inOut' }, '<');
  }

  function returnToOverview() {
    if (isFlying) return;
    closeAllPanels(); isFlying = true; hideOverviewBtn(); activePlanet = null; updateNavActive(null);
    gsap.timeline({ onComplete: () => { isFlying = false; setLabelsVisibility(true); } })
      .to(camera.position,{ x:OVERVIEW_POS.x, y:OVERVIEW_POS.y, z:OVERVIEW_POS.z, duration:1.7, ease:'power2.inOut' })
      .to(cameraTarget,   { x:OVERVIEW_TARGET.x, y:OVERVIEW_TARGET.y, z:OVERVIEW_TARGET.z, duration:1.7, ease:'power2.inOut' }, '<');
  }

  function getPlanetWorldPos(cfg) {
    if (cfg.isMoon) { const wp=new THREE.Vector3(); cfg._group.getWorldPosition(wp); return{x:wp.x,y:wp.y,z:wp.z}; }
    return cfg.pos;
  }

  /* ── PANELS ──────────────────────────────────────────────────── */
  function openPanel(id)    { const el=document.getElementById(id); if(el){el.classList.add('open'); document.getElementById('galaxy-nav')?.classList.add('at-planet');} }
  function closeAllPanels() { document.querySelectorAll('.g-panel.open').forEach(e=>e.classList.remove('open')); document.getElementById('galaxy-nav')?.classList.remove('at-planet'); }
  function showOverviewBtn(){ const b=document.getElementById('overview-btn'); if(b)b.classList.remove('hidden'); }
  function hideOverviewBtn(){ const b=document.getElementById('overview-btn'); if(b)b.classList.add('hidden'); }
  function setLabelsVisibility(v){ labelEls.forEach(el=>{ v?el.classList.add('overview-mode'):el.classList.remove('overview-mode'); }); }
  function updateNavActive(id){ document.querySelectorAll('.gnav-pill').forEach(p=>p.classList.toggle('active',p.dataset.planet===id)); }

  /* ── HOVER / CLICK ───────────────────────────────────────────── */
  function onMouseMove(e) {
    mouse.x = (e.clientX/window.innerWidth)*2-1;
    mouse.y = -(e.clientY/window.innerHeight)*2+1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes, false);
    if (hits.length) {
      const idx = hits[0].object.userData.planetIdx;
      if (hoveredPlanet !== idx) {
        if (hoveredPlanet !== null) { const s=glowSprites[hoveredPlanet]; if(s&&s.material)gsap.to(s.material,{opacity:PLANETS[hoveredPlanet].isSun?0.72:0.5,duration:.5}); }
        hoveredPlanet = idx; canvas.classList.add('hovering');
        const s=glowSprites[idx]; if(s&&s.material)gsap.to(s.material,{opacity:0.9,duration:.3});
      }
    } else {
      if (hoveredPlanet !== null) { const s=glowSprites[hoveredPlanet]; if(s&&s.material)gsap.to(s.material,{opacity:PLANETS[hoveredPlanet].isSun?0.72:0.5,duration:.5}); }
      hoveredPlanet = null; canvas.classList.remove('hovering');
    }
  }

  function onCanvasClick(e) {
    if (isFlying) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes, false);
    if (hits.length) navigateToPlanet(hits[0].object.userData.planetIdx);
  }

  /* ── LABEL PROJECTION ────────────────────────────────────────── */
  function updateLabels() {
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    PLANETS.forEach((cfg, idx) => {
      const el = labelEls[idx]; if (!el) return;
      const wp = new THREE.Vector3(); cfg._group.getWorldPosition(wp);
      const proj = wp.clone().project(camera);
      const x=(proj.x+1)/2*w, y=-(proj.y-1)/2*h;
      if (proj.z>1||x<0||x>w||y<0||y>h){el.style.opacity='0';return;}
      el.style.left=x+'px'; el.style.top=y+'px';
      const dist=camera.position.distanceTo(wp);
      el.style.opacity=el.classList.contains('overview-mode')?Math.max(0,Math.min(1,(dist-25)/(130-25))*0.92).toString():'0';
    });
  }

  function onResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ── ANIMATION LOOP ──────────────────────────────────────────── */
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta(), t = clock.getElapsedTime();

    if (starParticles) { starParticles.rotation.y += dt*0.006; starParticles.rotation.x += dt*0.0015; }

    PLANETS.forEach((cfg, i) => {
      if (!cfg._mesh) return;
      cfg._mesh.rotation.y += dt * (cfg.rotSpeed || 0.004);
      // Pulse sun glow
      if (cfg.isSun && cfg._group) {
        sunLight.intensity = 3.8 + Math.sin(t * 2.0) * 0.3;
        cfg._group.children.forEach(child => {
          if (child.isSprite) child.material.opacity = 0.68 + Math.sin(t*1.6)*0.08;
        });
      }
    });

    // Moon orbit
    const moon = PLANETS[1];
    if (moon._group) {
      moon._angle += dt * moon.orbitSpeed;
      const r = moon.orbitRadius;
      moon._group.position.set(Math.cos(moon._angle)*r, Math.sin(moon._angle*0.28)*2.5, Math.sin(moon._angle)*r);
    }

    // Gentle pulse on planet glows
    PLANETS.forEach((cfg, i) => {
      if (i===0||!cfg._group) return;
      const phase = i*1.1;
      cfg._group.children.forEach(child => {
        if (child.isSprite) child.material.opacity = 0.48+Math.sin(t*1.1+phase)*0.07;
      });
    });

    camera.lookAt(cameraTarget);
    updateLabels();
    renderer.render(scene, camera);
  }

  /* ── PUBLIC API ──────────────────────────────────────────────── */
  window.GalaxyEngine = {
    navigate: navigateToPlanet,
    overview: returnToOverview,
    closePanel: closeAllPanels,
    getPlanetIndex: (id) => PLANETS.findIndex(p => p.id === id)
  };

  /* ── WIRE NAV ────────────────────────────────────────────────── */
  function wireNav() {
    document.querySelectorAll('.gnav-pill[data-planet]').forEach(pill => {
      pill.addEventListener('click', () => { const idx=PLANETS.findIndex(p=>p.id===pill.dataset.planet); if(idx>=0)navigateToPlanet(idx); });
    });
    document.querySelector('.gnav-brand')?.addEventListener('click', returnToOverview);
    document.getElementById('overview-btn')?.addEventListener('click', returnToOverview);
    document.querySelectorAll('.g-panel-close').forEach(b=>b.addEventListener('click',returnToOverview));
    document.querySelectorAll('.gp-faq-q').forEach(q=>q.addEventListener('click',()=>q.closest('.gp-faq')?.classList.toggle('open')));
  }

  if (typeof THREE==='undefined'||typeof gsap==='undefined') { console.error('GalaxyEngine: THREE/GSAP missing'); return; }
  if (document.readyState==='loading') { document.addEventListener('DOMContentLoaded',()=>{init();wireNav();}); }
  else { init(); wireNav(); }
})();
