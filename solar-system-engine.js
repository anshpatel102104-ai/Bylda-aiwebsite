'use strict';

/* ══════════════════════════════════════════════════════════════════════
   Bylda — ByldaSolarSystem
   Three.js interactive solar system engine for usebylda.com
   Requires: THREE (global, loaded via three.min.js)
   Canvas ID: #solar-canvas
   Labels container: #planet-labels
   Modal: #planet-modal / #modal-inner / #modal-backdrop / #modal-close
   ══════════════════════════════════════════════════════════════════════ */

class ByldaSolarSystem {
  constructor() {
    this.canvas = document.getElementById('solar-canvas');
    if (!this.canvas) return;

    /* ── Planet data ──────────────────────────────────────────────── */
    this.PLANET_DATA = [
      {
        id: 'ai-automation',
        style: 'lava',
        name: 'AI Automation',
        tagline: 'Done-for-you AI systems',
        color: 0xFF5500,
        emissiveColor: 0xFF3300,
        radius: 2.2,
        distance: 26,
        speed: 0.009,
        rotationSpeed: 0.018,
        href: '/services',
        icon: '⚡',
        features: ['Appointment Setting', 'Lead Qualification', 'Follow-up Sequences'],
      },
      {
        id: 'crm-systems',
        style: 'ice',
        name: 'CRM Systems',
        tagline: 'Your pipeline, automated',
        color: 0x00E5E5,
        emissiveColor: 0x00BBBB,
        radius: 2.0,
        distance: 40,
        speed: 0.007,
        rotationSpeed: 0.015,
        href: '/services',
        icon: '🔗',
        features: ['Pipeline Automation', 'Contact Management', 'Deal Tracking'],
      },
      {
        id: 'lead-generation',
        style: 'terra',
        name: 'Lead Generation',
        tagline: 'Leads that convert',
        color: 0x4488FF,
        emissiveColor: 0x2255DD,
        radius: 3.2,
        distance: 56,
        speed: 0.005,
        rotationSpeed: 0.020,
        href: '/services',
        icon: '🎯',
        features: ['AI Qualification', 'Multi-channel Outreach', 'Smart Scoring'],
      },
      {
        id: 'growth-systems',
        style: 'rocky',
        name: 'Growth Systems',
        tagline: 'Scale without headcount',
        color: 0xFF1744,
        emissiveColor: 0xCC0022,
        radius: 2.8,
        distance: 72,
        speed: 0.0038,
        rotationSpeed: 0.012,
        href: '/how-it-works',
        icon: '📈',
        features: ['Revenue Automation', 'Growth Playbooks', 'Performance Tracking'],
      },
      {
        id: 'ai-agents',
        style: 'gas', storm: true, bands: 9,
        name: 'AI Agents',
        tagline: 'Your 24/7 AI workforce',
        color: 0xFFAA00,
        emissiveColor: 0xFF8800,
        radius: 6.0,
        distance: 95,
        speed: 0.0026,
        rotationSpeed: 0.008,
        href: '/services',
        icon: '🤖',
        features: ['Voice AI', 'Chat AI', 'Email AI', 'SMS AI'],
        rings: true,
        ringInner: 8.5,
        ringOuter: 13,
        ringColor: 0xBB8800,
      },
      {
        id: 'saas-products',
        style: 'terra',
        name: 'SaaS Products',
        tagline: 'Software that sells itself',
        color: 0x00DD66,
        emissiveColor: 0x00AA44,
        radius: 2.6,
        distance: 118,
        speed: 0.0020,
        rotationSpeed: 0.022,
        href: '/launchpad',
        icon: '💻',
        features: ['Launchpad', '20 AI Tools', 'Founder OS'],
      },
      {
        id: 'recruiting',
        style: 'gas', bands: 6,
        name: 'Recruiting',
        tagline: 'Hire smarter, faster',
        color: 0x5599FF,
        emissiveColor: 0x2266EE,
        radius: 2.4,
        distance: 140,
        speed: 0.0016,
        rotationSpeed: 0.020,
        href: '/about',
        icon: '👥',
        features: ['AI Screening', 'Automated Outreach', 'Talent Pipeline'],
        rings: true,
        ringInner: 3.2,
        ringOuter: 5.0,
        ringColor: 0x2244AA,
        ringTilt: 0.45,
      },
      {
        id: 'consulting',
        style: 'marble',
        name: 'Consulting',
        tagline: 'Strategic AI advisory',
        color: 0xAA44FF,
        emissiveColor: 0x8800EE,
        radius: 2.1,
        distance: 162,
        speed: 0.0011,
        rotationSpeed: 0.018,
        href: '/contact',
        icon: '💡',
        features: ['AI Strategy', 'Implementation', 'Growth Consulting'],
      },
    ];

    /* ── Internal state ───────────────────────────────────────────── */
    this.scene          = null;
    this.camera         = null;
    this.renderer       = null;
    this.clock          = null;
    this.planets        = [];       // { group, mesh, glow, data, angle }
    this.planetMeshes   = [];       // flat array for raycasting
    this.sunMesh        = null;
    this.sunParticles   = null;
    this.starField      = null;
    this.asteroidBelt   = null;
    this.raycaster      = null;
    this.pointer        = null;
    this.hoveredPlanet  = null;
    this.mouse          = { x: 0, y: 0, normalX: 0, normalY: 0 };
    this.isAnimating    = true;     // false when scrolled past hero
    this.labelElements  = [];       // { el, mesh, isSun }
    this.heroHeight     = window.innerHeight;
    this.time           = 0;

    this.init();
  }

  /* ──────────────────────────────────────────────────────────────
     INIT — orchestrates setup in the correct dependency order
  ────────────────────────────────────────────────────────────── */
  init() {
    this.setupThree();
    this.createStarfield();
    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    this.setupRaycaster();
    this.updateLabels();       // create DOM label elements
    this.setupEventListeners();
    this.animate();
  }

  /* ──────────────────────────────────────────────────────────────
     THREE.JS RENDERER / CAMERA / SCENE
  ────────────────────────────────────────────────────────────── */
  setupThree() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    /* Scene with deep-space exponential fog */
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000008, 0.0015);

    /* Perspective camera — slight upward-shifted eye position */
    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 2500);
    this.camera.position.set(0, 22, 190);
    this.camera.lookAt(0, 0, 0);

    /* Renderer — high-performance preset */
    this.renderer = new THREE.WebGLRenderer({
      canvas:           this.canvas,
      antialias:        true,
      alpha:            true,
      powerPreference:  'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    /* Delta clock */
    this.clock = new THREE.Clock();
  }

  /* ──────────────────────────────────────────────────────────────
     STARFIELD — procedural sphere distribution, warm tints
  ────────────────────────────────────────────────────────────── */
  createStarfield() {
    const isMobile  = window.innerWidth < 768;
    const starCount = isMobile ? 1500 : 4000;

    const positions = new Float32Array(starCount * 3);
    const colors    = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      /* Spherical coordinate shell between radius 500 and 1500 */
      const radius = 500 + Math.random() * 1000;
      const theta  = Math.acos(2 * Math.random() - 1);   // polar
      const phi    = Math.random() * Math.PI * 2;          // azimuthal

      positions[i * 3]     = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);

      /* Mostly white, occasional warm tints (amber / blue-white) */
      const tint = Math.random();
      if (tint < 0.08) {
        // amber-warm star
        colors[i * 3]     = 1.0;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 0.65;
      } else if (tint < 0.15) {
        // blue-white hot star
        colors[i * 3]     = 0.80;
        colors[i * 3 + 1] = 0.90;
        colors[i * 3 + 2] = 1.0;
      } else {
        // neutral white (slight variation)
        const v = 0.88 + Math.random() * 0.12;
        colors[i * 3]     = v;
        colors[i * 3 + 1] = v;
        colors[i * 3 + 2] = v;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size:            1.5,
      sizeAttenuation: true,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.92,
    });

    this.starField = new THREE.Points(geo, mat);
    this.scene.add(this.starField);
  }

  /* ──────────────────────────────────────────────────────────────
     SUN — multi-layer glow + point light + ambient + particles
  ────────────────────────────────────────────────────────────── */
  createSun() {
    const sunGroup = new THREE.Group();

    /* ── Core sphere ──────────────────────────────────────────── */
    const coreGeo = new THREE.SphereGeometry(9, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF6A00 });
    this.sunMesh  = new THREE.Mesh(coreGeo, coreMat);
    sunGroup.add(this.sunMesh);

    /* ── Inner glow shell ─────────────────────────────────────── */
    const innerGlowGeo = new THREE.SphereGeometry(10.5, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color:       0xFF7A20,
      transparent: true,
      opacity:     0.25,
      side:        THREE.BackSide,
    });
    sunGroup.add(new THREE.Mesh(innerGlowGeo, innerGlowMat));

    /* ── Outer glow shell ─────────────────────────────────────── */
    const outerGlowGeo = new THREE.SphereGeometry(17, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color:       0xFF5500,
      transparent: true,
      opacity:     0.07,
      side:        THREE.BackSide,
    });
    sunGroup.add(new THREE.Mesh(outerGlowGeo, outerGlowMat));

    /* ── Corona glow shell ────────────────────────────────────── */
    const coronaGeo = new THREE.SphereGeometry(22, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color:       0xFF4400,
      transparent: true,
      opacity:     0.03,
      side:        THREE.BackSide,
    });
    sunGroup.add(new THREE.Mesh(coronaGeo, coronaMat));

    /* ── Lighting ─────────────────────────────────────────────── */
    // Primary solar point light
    const pointLight = new THREE.PointLight(0xFF8840, 3.5, 500);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // Soft ambient to lift shadow side slightly
    const ambientLight = new THREE.AmbientLight(0x0A0A20, 0.4);
    this.scene.add(ambientLight);

    // Directional fill — softens the dark hemisphere of each planet
    const dirLight = new THREE.DirectionalLight(0xFFAA66, 0.5);
    dirLight.position.set(50, 30, 80);
    this.scene.add(dirLight);

    /* ── Sun surface particles ────────────────────────────────── */
    const particleCount = 100;
    const pPositions    = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r     = 10 + Math.random() * 5;   // radius 10–15
      const theta = Math.acos(2 * Math.random() - 1);
      const phi   = Math.random() * Math.PI * 2;
      pPositions[i * 3]     = r * Math.sin(theta) * Math.cos(phi);
      pPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pPositions[i * 3 + 2] = r * Math.cos(theta);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color:       0xFF9900,
      size:        2.5,
      sizeAttenuation: true,
      transparent: true,
      opacity:     0.5,
    });

    this.sunParticles = new THREE.Points(pGeo, pMat);
    sunGroup.add(this.sunParticles);

    this.scene.add(sunGroup);
  }

  /* ──────────────────────────────────────────────────────────────
     PROCEDURAL TEXTURES — each planet gets a generated surface
     (value-noise fBm, seamless horizontal wrap), a bump map, an
     atmosphere shader, and banded ring textures. No image files.
  ────────────────────────────────────────────────────────────── */
  static mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  static seedFor(id) {
    let s = 7;
    for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) | 0;
    return Math.abs(s) + 1;
  }

  /* Value noise on a lattice, wrapping horizontally so the sphere
     seam is invisible. Returns fbm(x, y, octaves) in [0, 1]. */
  static makeFbm(seed, gw = 64, gh = 32) {
    const rnd  = ByldaSolarSystem.mulberry32(seed);
    const grid = new Float32Array(gw * gh);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();

    function noise(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi,        yf = y - yi;
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      const x0 = ((xi % gw) + gw) % gw, x1 = (x0 + 1) % gw;
      const y0 = Math.max(0, Math.min(gh - 1, yi));
      const y1 = Math.min(gh - 1, y0 + 1);
      const a = grid[y0 * gw + x0], b = grid[y0 * gw + x1];
      const c = grid[y1 * gw + x0], d = grid[y1 * gw + x1];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }

    return function fbm(x, y, oct = 4) {
      let sum = 0, amp = 0.5, freq = 1, norm = 0;
      for (let o = 0; o < oct; o++) {
        sum  += noise(x * freq, y * freq) * amp;
        norm += amp;
        amp  *= 0.5;
        freq *= 2;
      }
      return sum / norm;
    };
  }

  createPlanetTexture(data) {
    const W = 512, H = 256;
    const seed = ByldaSolarSystem.seedFor(data.id);
    /* Lattice width == repeat count, sampled over exactly one period,
       so the sphere's longitude seam is invisible at every octave. */
    const f1 = ByldaSolarSystem.makeFbm(seed, 12, 110);
    const f2 = ByldaSolarSystem.makeFbm(seed * 3 + 11, 40, 340);
    const f3 = ByldaSolarSystem.makeFbm(seed * 5 + 1, 6, 60);
    const S1 = (u, v, o) => f1(u * 12, v * 6,  o);
    const S2 = (u, v, o) => f2(u * 40, v * 20, o);
    const S3 = (u, v, o) => f3(u * 6,  v * 3,  o);
    const rnd  = ByldaSolarSystem.mulberry32(seed * 7 + 3);

    /* Palette derived from the planet's brand color */
    const hsl = {};
    new THREE.Color(data.color).getHSL(hsl);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const shade = (dh, ds, dl) => {
      const c = new THREE.Color();
      c.setHSL(((hsl.h + dh) % 1 + 1) % 1, clamp01(hsl.s + ds), clamp01(hsl.l + dl));
      return [c.r * 255, c.g * 255, c.b * 255];
    };
    const deep   = shade(-0.02,  0.10, -0.30);
    const dark   = shade(-0.01,  0.02, -0.13);
    const base   = shade( 0.00,  0.00,  0.00);
    const light  = shade( 0.015, -0.06,  0.14);
    const bright = shade( 0.03, -0.12,  0.28);
    const accent = shade( 0.07,  0.10,  0.06);
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(W, H);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = W; bumpCanvas.height = H;
    const bctx = bumpCanvas.getContext('2d');
    const bimg = bctx.createImageData(W, H);

    const style = data.style || 'rocky';
    const bands = data.bands || 8;

    for (let y = 0; y < H; y++) {
      const lat = (y / H) * 2 - 1;            // -1 .. 1
      const v   = y / H;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const u = x / W;
        let rgb, h = 128;

        if (style === 'gas') {
          /* Banded gas giant with turbulent streaks */
          const warp   = S3(u, v, 3);
          const streak = S2(u, v, 3);
          const band   = Math.sin((v + (warp - 0.5) * 0.24) * Math.PI * bands);
          let t = band * 0.5 + 0.5;
          t = t * 0.75 + streak * 0.25;
          rgb = t > 0.62 ? mix(light, bright, (t - 0.62) / 0.38)
              : t > 0.38 ? mix(base, light, (t - 0.38) / 0.24)
              : mix(deep, base, t / 0.38);
          h = 120 + band * 10;
        } else if (style === 'terra') {
          /* Oceans, continents, coast glow, polar caps */
          const e = S1(u, v, 5);
          if (e > 0.53) {
            const detail = S2(u, v, 4);
            rgb = mix(mix(light, accent, detail), bright, (e - 0.53) * 1.6);
            h = 150 + (e - 0.53) * 320;
          } else {
            rgb = mix(deep, base, e / 0.53);
            h = 90;
            if (e > 0.505) rgb = mix(rgb, bright, (e - 0.505) * 14); // coast shallows
          }
          if (Math.abs(lat) > 0.74 && e > 0.42) {
            const cap = (Math.abs(lat) - 0.74) / 0.26;
            rgb = mix(rgb, [245, 248, 252], Math.min(1, cap * 1.8));
            h = 200;
          }
        } else if (style === 'lava') {
          /* Domain-warped molten marble with glowing fissures
             (the warp field is seamless, so the warp stays seamless) */
          const q = S1(u, v, 4);
          const n = S2(u + (q - 0.5) * 0.35, v + (q - 0.5) * 0.35, 5);
          rgb = mix(deep, light, Math.pow(n, 1.5));
          if (n > 0.64) rgb = mix(rgb, bright, (n - 0.64) * 2.4);
          h = 100 + n * 90;
        } else if (style === 'ice') {
          /* Pale glacial surface, frost variation */
          const n = S1(u, v, 5);
          rgb = mix(light, bright, n);
          rgb = mix(rgb, base, S2(u, v, 3) * 0.32);
          h = 140 + n * 60;
        } else if (style === 'marble') {
          /* Veined nebula-marble */
          const q = S1(u, v, 4);
          const n = S2(u + (q - 0.5) * 0.3, v + (q - 0.5) * 0.3, 5);
          rgb = mix(deep, light, n);
          const vein = Math.abs(n - 0.5);
          if (vein < 0.045) rgb = mix(rgb, bright, 1 - vein / 0.045);
          h = 110 + n * 80;
        } else {
          /* Rocky / cratered dust world — remap noise for contrast */
          const raw = S1(u, v, 5);
          const n = Math.max(0, Math.min(1, (raw - 0.32) / 0.36));
          rgb = mix(deep, light, n);
          rgb = mix(rgb, accent, S3(u, v, 3) * 0.3);
          const ridge = Math.abs(S2(u, v, 4) - 0.5);
          if (ridge < 0.06) rgb = mix(rgb, dark, 0.5 * (1 - ridge / 0.06));
          h = 80 + n * 150;
        }

        /* subtle latitude shading for body */
        const limb = 1 - Math.pow(Math.abs(lat), 2.4) * 0.25;
        img.data[i]     = rgb[0] * limb;
        img.data[i + 1] = rgb[1] * limb;
        img.data[i + 2] = rgb[2] * limb;
        img.data[i + 3] = 255;
        bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = h;
        bimg.data[i + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    bctx.putImageData(bimg, 0, 0);

    /* Post-pass details drawn on top */
    if (style === 'rocky') {
      for (let c = 0; c < 46; c++) {
        const cx = rnd() * W, cy = H * 0.12 + rnd() * H * 0.76;
        const r  = 2 + rnd() * 13;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.9, Math.PI * 1.9);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
    if (style === 'ice') {
      ctx.strokeStyle = `rgba(${deep[0] | 0},${deep[1] | 0},${deep[2] | 0},0.5)`;
      for (let c = 0; c < 16; c++) {
        ctx.beginPath();
        let px = rnd() * W, py = rnd() * H;
        ctx.moveTo(px, py);
        const segs = 4 + (rnd() * 5 | 0);
        for (let sgi = 0; sgi < segs; sgi++) {
          px += (rnd() - 0.5) * 90;
          py += (rnd() - 0.5) * 40;
          ctx.lineTo(px, py);
        }
        ctx.lineWidth = 0.8 + rnd() * 1.2;
        ctx.stroke();
      }
    }
    if (style === 'gas' && data.storm) {
      /* Great-spot storm */
      const sx = W * 0.66, sy = H * 0.6;
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 36);
      grad.addColorStop(0, `rgba(${bright[0] | 0},${bright[1] | 0},${bright[2] | 0},0.95)`);
      grad.addColorStop(0.55, `rgba(${accent[0] | 0},${accent[1] | 0},${accent[2] | 0},0.6)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1.9, 1);
      ctx.translate(-sx, -sy);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${deep[0] | 0},${deep[1] | 0},${deep[2] | 0},0.55)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const map  = new THREE.CanvasTexture(canvas);
    const bump = new THREE.CanvasTexture(bumpCanvas);
    if (THREE.SRGBColorSpace && 'colorSpace' in map) map.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) map.encoding = THREE.sRGBEncoding;
    const aniso = this.renderer.capabilities.getMaxAnisotropy ? Math.min(4, this.renderer.capabilities.getMaxAnisotropy()) : 1;
    map.anisotropy = aniso;
    return { map, bump };
  }

  /* Soft fresnel atmosphere halo (replaces the flat glow shell) */
  createAtmosphere(data) {
    /* Front-side fresnel rim: alpha ~0 facing the camera, so the
       surface stays untinted and only the limb glows. */
    const geo = new THREE.SphereGeometry(data.radius * 1.10, 48, 48);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(data.color) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView   = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.4);
          gl_FragColor = vec4(glowColor, min(1.0, rim * 0.45));
        }`,
      side:        THREE.FrontSide,
      blending:    THREE.NormalBlending,
      transparent: true,
      depthWrite:  false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    return mesh;
  }

  /* Wispy cloud layer for terra-style planets */
  createCloudLayer(data) {
    const W = 512, H = 256;
    const f = ByldaSolarSystem.makeFbm(ByldaSolarSystem.seedFor(data.id) * 13 + 5, 10, 90);
    const fbm = (x, y, o) => f((x / 512) * 10, (y / 256) * 5, o);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = fbm(x * 0.022, y * 0.03, 4);
        const a = Math.max(0, Math.min(1, (n - 0.52) / 0.2));
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = a * 200;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.SphereGeometry(data.radius * 1.045, 48, 48);
    const mat = new THREE.MeshLambertMaterial({
      map:         tex,
      transparent: true,
      opacity:     0.65,
      depthWrite:  false,
    });
    return new THREE.Mesh(geo, mat);
  }

  /* Banded ring texture (planar-mapped onto RingGeometry) */
  createRingTexture(data) {
    const S = 512;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d');
    const rnd = ByldaSolarSystem.mulberry32(ByldaSolarSystem.seedFor(data.id) * 17 + 9);
    const hsl = {};
    new THREE.Color(data.ringColor).getHSL(hsl);
    const cx = S / 2;
    const innerPx = (data.ringInner / data.ringOuter) * cx;
    const bandCount = 26;
    for (let bnd = 0; bnd < bandCount; bnd++) {
      const t0 = bnd / bandCount, t1 = (bnd + 1) / bandCount;
      const r0 = innerPx + (cx - innerPx) * t0;
      const r1 = innerPx + (cx - innerPx) * t1;
      const c  = new THREE.Color();
      c.setHSL(hsl.h, Math.max(0, hsl.s - 0.1 + rnd() * 0.2), Math.max(0.08, hsl.l - 0.12 + rnd() * 0.3));
      /* gaps + edge fade for realistic ring structure */
      const gap   = rnd() < 0.22 ? 0.12 : 1;
      const fade  = Math.sin(((t0 + t1) / 2) * Math.PI) * 0.85 + 0.15;
      const alpha = (0.25 + rnd() * 0.55) * gap * fade;
      ctx.beginPath();
      ctx.arc(cx, cx, (r0 + r1) / 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${alpha.toFixed(3)})`;
      ctx.lineWidth = r1 - r0 + 0.5;
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  /* ──────────────────────────────────────────────────────────────
     PLANETS — sphere + glow + point light + orbital ring
  ────────────────────────────────────────────────────────────── */
  createPlanets() {
    this.PLANET_DATA.forEach((data) => {
      /* Orbital group — we rotate this group to orbit the sun */
      const group = new THREE.Group();
      const initialAngle = Math.random() * Math.PI * 2;
      group.userData.initialAngle = initialAngle;
      group.rotation.y = initialAngle;

      /* Planet sphere — procedural surface + bump relief */
      const tex = this.createPlanetTexture(data);
      const geo = new THREE.SphereGeometry(data.radius, 56, 56);
      const mat = new THREE.MeshStandardMaterial({
        map:               tex.map,
        bumpMap:           tex.bump,
        bumpScale:         data.radius * 0.045,
        roughness:         0.86,
        metalness:         0.05,
        emissive:          new THREE.Color(data.emissiveColor),
        emissiveMap:       tex.map,
        emissiveIntensity: 0.20,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(data.distance, 0, 0);
      /* slight axial tilt so bands/caps read in 3D */
      mesh.rotation.z = ((ByldaSolarSystem.seedFor(data.id) % 100) / 100 - 0.5) * 0.5;

      /* Store planet data on mesh for raycaster callback */
      mesh.userData.planetData = data;

      /* Fresnel atmosphere halo */
      const glow = this.createAtmosphere(data);
      mesh.add(glow);

      /* Cloud layer on living worlds */
      let clouds = null;
      if (data.style === 'terra') {
        clouds = this.createCloudLayer(data);
        mesh.add(clouds);
      }

      /* Small point light at planet position for local illumination */
      const planetLight = new THREE.PointLight(data.emissiveColor, 1.0, data.radius * 15);
      planetLight.position.set(data.distance, 0, 0);
      group.add(planetLight);

      /* Orbital ring (flat plane circle) */
      this.createOrbitalRing(data.distance);

      /* Saturn-style rings if specified */
      if (data.rings) {
        this.createPlanetRings(mesh, data);
      }

      group.add(mesh);
      this.scene.add(group);

      /* Track for animation and raycasting */
      this.planets.push({
        group,
        mesh,
        glow,
        clouds,
        data,
        angle: initialAngle,
      });
      this.planetMeshes.push(mesh);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     ORBITAL RING — thin flat disc at orbital radius
  ────────────────────────────────────────────────────────────── */
  createOrbitalRing(distance) {
    const geo = new THREE.RingGeometry(distance - 0.2, distance + 0.2, 120);
    const mat = new THREE.MeshBasicMaterial({
      color:       0x223355,
      transparent: true,
      opacity:     0.25,
      side:        THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;   // lie flat in the XZ plane
    this.scene.add(ring);
  }

  /* ──────────────────────────────────────────────────────────────
     PLANET RINGS — Saturn-style tilt ring system
  ────────────────────────────────────────────────────────────── */
  createPlanetRings(mesh, data) {
    const geo = new THREE.RingGeometry(data.ringInner, data.ringOuter, 96);
    const mat = new THREE.MeshBasicMaterial({
      map:         this.createRingTexture(data),
      transparent: true,
      opacity:     0.85,
      side:        THREE.DoubleSide,
      depthWrite:  false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2 + (data.ringTilt || 0.3);
    mesh.add(ring);
  }

  /* ──────────────────────────────────────────────────────────────
     ASTEROID BELT — point cloud between Mars and AI Agents orbit
  ────────────────────────────────────────────────────────────── */
  createAsteroidBelt() {
    const count     = 350;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      /* Random angle around Y axis */
      const angle  = Math.random() * Math.PI * 2;
      /* Radius spread: 80–92 units (between Growth Systems and AI Agents) */
      const radius = 80 + Math.random() * 12;
      const yOffset = (Math.random() - 0.5) * 5;   // ±2.5 vertical scatter

      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color:       0x998877,
      size:        0.7,
      sizeAttenuation: true,
      transparent: true,
      opacity:     0.5,
    });

    this.asteroidBelt = new THREE.Points(geo, mat);
    this.scene.add(this.asteroidBelt);
  }

  /* ──────────────────────────────────────────────────────────────
     RAYCASTER — for hover and click detection
  ────────────────────────────────────────────────────────────── */
  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.pointer   = new THREE.Vector2();
  }

  /* ──────────────────────────────────────────────────────────────
     EVENT LISTENERS
  ────────────────────────────────────────────────────────────── */
  setupEventListeners() {
    const canvas = this.canvas;

    /* Mouse position tracking (normalized device coordinates) */
    document.addEventListener('mousemove', (e) => {
      this.mouse.x       = e.clientX;
      this.mouse.y       = e.clientY;
      this.mouse.normalX = (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.normalY = -((e.clientY / window.innerHeight) * 2 - 1);

      /* Update pointer for raycaster */
      this.pointer.x = this.mouse.normalX;
      this.pointer.y = this.mouse.normalY;

      this.checkHover();
    }, { passive: true });

    /* Touch move — update pointer for mobile hover check */
    document.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      this.pointer.x = (t.clientX / window.innerWidth)  * 2 - 1;
      this.pointer.y = -((t.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    /* Click — fire planet modal */
    canvas.addEventListener('click', () => this.handleClick());

    /* Touch tap on canvas */
    canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches[0]) {
        const t = e.changedTouches[0];
        this.pointer.x = (t.clientX / window.innerWidth)  * 2 - 1;
        this.pointer.y = -((t.clientY / window.innerHeight) * 2 - 1);
        this.handleClick();
      }
    }, { passive: true });

    /* Resize — update camera aspect and renderer dimensions */
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.heroHeight = h;
    }, { passive: true });

    /* Scroll — pause render loop when hero is scrolled past (CWV) */
    window.addEventListener('scroll', () => {
      this.isAnimating = window.scrollY < this.heroHeight * 0.6;
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────────
     HOVER DETECTION — scale planet on hover, update cursor
  ────────────────────────────────────────────────────────────── */
  checkHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;

      /* Scale up hovered planet */
      if (this.hoveredPlanet !== hitMesh) {
        /* Reset previous */
        if (this.hoveredPlanet) {
          this.hoveredPlanet.scale.setScalar(1.0);
        }
        this.hoveredPlanet = hitMesh;
        hitMesh.scale.setScalar(1.15);
      }

      this.canvas.style.cursor = 'pointer';
    } else {
      /* Nothing hit — reset */
      if (this.hoveredPlanet) {
        this.hoveredPlanet.scale.setScalar(1.0);
        this.hoveredPlanet = null;
      }
      this.canvas.style.cursor = 'default';
    }
  }

  /* ──────────────────────────────────────────────────────────────
     CLICK — open planet modal
  ────────────────────────────────────────────────────────────── */
  handleClick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);

    if (intersects.length > 0) {
      const data = intersects[0].object.userData.planetData;
      if (data) this.showPlanetModal(data);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     PLANET MODAL — populate and show overlay
  ────────────────────────────────────────────────────────────── */
  showPlanetModal(data) {
    const modal     = document.getElementById('planet-modal');
    const inner     = document.getElementById('modal-inner');
    const backdrop  = document.getElementById('modal-backdrop');

    if (!modal || !inner) {
      /* Fallback: navigate directly if no modal in this page's HTML */
      if (data.href) window.location.href = data.href;
      return;
    }

    /* Build feature list HTML */
    const featureHTML = data.features
      .map(f => `<li class="pm-feature">${f}</li>`)
      .join('');

    inner.innerHTML = `
      <div class="pm-header">
        <span class="pm-icon" aria-hidden="true">${data.icon}</span>
        <div>
          <h2 class="pm-title">${data.name}</h2>
          <p class="pm-tagline">${data.tagline}</p>
        </div>
      </div>
      <ul class="pm-features" role="list">
        ${featureHTML}
      </ul>
      <a href="${data.href}" class="pm-cta">
        Explore ${data.name} <span aria-hidden="true">→</span>
      </a>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    /* Focus trap — move focus into modal */
    const firstFocusable = inner.querySelector('a, button');
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 80);
  }

  /* ──────────────────────────────────────────────────────────────
     LABELS — create DOM overlay labels for each planet + sun
  ────────────────────────────────────────────────────────────── */
  updateLabels() {
    const container = document.getElementById('planet-labels');
    if (!container) return;

    container.innerHTML = '';
    this.labelElements  = [];

    /* Sun label */
    const sunEl = document.createElement('div');
    sunEl.className   = 'planet-label sun-label';
    sunEl.textContent = 'Bylda ☀';
    sunEl.setAttribute('aria-hidden', 'true');
    container.appendChild(sunEl);
    this.labelElements.push({ el: sunEl, mesh: null, isSun: true });

    /* Planet labels */
    this.planets.forEach(({ mesh, data }) => {
      const el = document.createElement('div');
      el.className = 'planet-label';
      el.innerHTML = `<span class="pl-icon" aria-hidden="true">${data.icon}</span> ${data.name}`;
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-planet-id', data.id);

      /* Hover enhancement */
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'translateX(-50%) scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translateX(-50%) scale(1)';
      });

      /* Click label → open modal */
      el.addEventListener('click', () => this.showPlanetModal(data));
      el.style.cursor = 'pointer';

      container.appendChild(el);
      this.labelElements.push({ el, mesh, isSun: false });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     POSITION LABELS — project 3D → 2D every frame
  ────────────────────────────────────────────────────────────── */
  positionLabels() {
    if (!this.labelElements.length) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    this.labelElements.forEach(({ el, mesh, isSun }) => {
      let worldPos;

      if (isSun) {
        /* Sun is always at origin */
        worldPos = new THREE.Vector3(0, -12, 0);
      } else {
        if (!mesh) return;
        worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        /* Offset label slightly below planet */
        worldPos.y -= mesh.geometry.parameters.radius || 3;
      }

      /* Project world position to NDC */
      const projected = worldPos.clone().project(this.camera);

      /* Cull labels behind the camera or off-screen */
      if (projected.z >= 1) {
        el.style.display = 'none';
        return;
      }

      const sx = ((projected.x + 1) / 2) * w;
      const sy = ((-projected.y + 1) / 2) * h;

      /* Hide if too far outside viewport */
      const margin = 80;
      if (sx < -margin || sx > w + margin || sy < -margin || sy > h + margin) {
        el.style.display = 'none';
        return;
      }

      el.style.display  = 'block';
      el.style.left     = sx + 'px';
      el.style.top      = sy + 'px';

      /* Fade out labels that are far from the camera (depth cue) */
      const depth  = worldPos.distanceTo(this.camera.position);
      const maxDep = 380;
      const minDep = 60;
      const alpha  = Math.max(0, Math.min(1, 1 - (depth - minDep) / (maxDep - minDep)));
      el.style.opacity = alpha.toFixed(3);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     ANIMATE — main render loop
  ────────────────────────────────────────────────────────────── */
  animate() {
    requestAnimationFrame(() => this.animate());

    /* Skip heavy work when the canvas is off-screen — save battery */
    if (!this.isAnimating) return;

    const delta = this.clock.getDelta();
    this.time  += delta;

    /* ── Orbit all planets ──────────────────────────────────── */
    this.planets.forEach((planet) => {
      planet.angle          += planet.data.speed;
      planet.group.rotation.y = planet.angle;

      /* Self-rotation around planet's own Y axis */
      planet.mesh.rotation.y += planet.data.rotationSpeed * 0.016;

      /* Clouds drift slightly faster than the surface */
      if (planet.clouds) planet.clouds.rotation.y += planet.data.rotationSpeed * 0.007;
    });

    /* ── Sun slow self-rotation ─────────────────────────────── */
    if (this.sunMesh) {
      this.sunMesh.rotation.y += 0.0008;
    }

    /* ── Sun pulse — subtle scale oscillation ───────────────── */
    if (this.sunMesh && this.sunMesh.parent) {
      const pulse = 1 + Math.sin(this.time * 0.6) * 0.012;
      this.sunMesh.parent.scale.setScalar(pulse);
    }

    /* ── Smooth camera follow mouse ─────────────────────────── */
    const targetX = this.mouse.normalX * 18;
    const targetY = this.mouse.normalY * 10 + 22;
    const lerpFactor = 0.018;

    this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;

    /* Keep camera looking at origin */
    this.camera.lookAt(0, 0, 0);

    /* ── Update 2D label positions ──────────────────────────── */
    this.positionLabels();

    /* ── Render ─────────────────────────────────────────────── */
    this.renderer.render(this.scene, this.camera);
  }
}

/* ══════════════════════════════════════════════════════════════════════
   DOM READY — boot solar system + UI interactions
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Modal close helpers ──────────────────────────────────────── */
  function closePlanetModal() {
    const modal = document.getElementById('planet-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    }
  }

  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close');

  if (backdrop) backdrop.addEventListener('click', closePlanetModal);
  if (closeBtn) closeBtn.addEventListener('click', closePlanetModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlanetModal();
  });

  /* ── Service card clicks (data-href delegation) ───────────────── */
  document.querySelectorAll('[data-href]').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.dataset.href;
      if (href) window.location.href = href;
    });
    card.style.cursor = 'pointer';
  });

  /* ── FAQ accordion ────────────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      /* Collapse all first */
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      /* Open the clicked one if it was previously closed */
      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Boot the solar system (guard against missing THREE) ─────── */
  if (typeof THREE !== 'undefined') {
    try {
      window.byldaSolarSystem = new ByldaSolarSystem();
    } catch (e) {
      console.warn('Solar system init failed:', e);
    }
  } else {
    console.warn('ByldaSolarSystem: THREE.js not available. Skipping 3D engine.');
  }
});
