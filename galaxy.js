/* ══════════════════════════════════════════════════════════════
   Launchpad · CINEMATIC GALAXY ENGINE v1.0
   Three.js 3D solar system with cinematic camera fly-through
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── GUARD: mobile / reduced-motion / no-WebGL ─────────────── */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) return;

  const canvas = document.getElementById('galaxy-canvas');
  if (!canvas) return;

  /* ── CONSTANTS ────────────────────────────────────────────── */
  const OVERVIEW_POS    = { x: 0,   y: 90,  z: 175 };
  const OVERVIEW_TARGET = { x: 0,   y: -5,  z: -10 };
  const INTRO_POS       = { x: 50,  y: 180, z: 280 };

  /* Planet config: id, name, position, radius, colors, panel */
  const PLANETS = [
    {
      id: 'sun',
      name: 'Launchpad',
      labelText: '☀ Launchpad',
      panelId: 'panel-sun',
      pos: { x: 0, y: 0, z: 0 },
      radius: 13,
      color: 0xFFB800,
      emissive: 0xFF6000,
      emissiveInt: 0.75,
      glowColor: '#FF9000',
      glowSize: 70,
      isSun: true,
      camOffset: { x: 0, y: 20, z: 55 },
      camLookOffset: { x: 0, y: 0, z: 0 },
      labelColor: '#FFB800',
      rotSpeed: 0.003
    },
    {
      id: 'nova',
      name: 'Nova AI',
      labelText: '🌙 Nova',
      panelId: 'panel-nova',
      orbitRadius: 22,
      orbitSpeed: reduced ? 0 : 0.18,
      orbitAngle: Math.PI * 0.25,
      radius: 3.8,
      color: 0xC4B5FD,
      emissive: 0x7C3AED,
      emissiveInt: 0.35,
      glowColor: '#A78BFA',
      glowSize: 22,
      isMoon: true,
      camOffset: { x: 12, y: 10, z: 30 },
      labelColor: '#A78BFA',
      rotSpeed: 0.008
    },
    {
      id: 'hiw',
      name: 'How It Works',
      labelText: '⚡ How It Works',
      panelId: 'panel-hiw',
      pos: { x: 52, y: 3, z: 18 },
      radius: 6.5,
      color: 0x60A5FA,
      emissive: 0x1D4ED8,
      emissiveInt: 0.18,
      glowColor: '#60A5FA',
      glowSize: 34,
      camOffset: { x: -8, y: 14, z: 38 },
      labelColor: '#60A5FA',
      rotSpeed: 0.004
    },
    {
      id: 'results',
      name: 'Results',
      labelText: '📈 Results',
      panelId: 'panel-results',
      pos: { x: -38, y: -3, z: -50 },
      radius: 5.8,
      color: 0x67E8F9,
      emissive: 0x0E7490,
      emissiveInt: 0.18,
      glowColor: '#67E8F9',
      glowSize: 30,
      camOffset: { x: 10, y: 14, z: 35 },
      labelColor: '#67E8F9',
      rotSpeed: 0.005
    },
    {
      id: 'pricing',
      name: 'Pricing',
      labelText: '💎 Pricing',
      panelId: 'panel-pricing',
      pos: { x: 78, y: 6, z: -28 },
      radius: 9.5,
      color: 0x7C3AED,
      emissive: 0x4C1D95,
      emissiveInt: 0.22,
      glowColor: '#8B5CF6',
      glowSize: 50,
      hasRings: true,
      camOffset: { x: -12, y: 18, z: 50 },
      labelColor: '#8B5CF6',
      rotSpeed: 0.002
    },
    {
      id: 'about',
      name: 'About',
      labelText: '🚀 About',
      panelId: 'panel-about',
      pos: { x: -75, y: 5, z: 18 },
      radius: 5.2,
      color: 0xFBBF24,
      emissive: 0x92400E,
      emissiveInt: 0.18,
      glowColor: '#FBBF24',
      glowSize: 28,
      camOffset: { x: 10, y: 14, z: 35 },
      labelColor: '#FBBF24',
      rotSpeed: 0.006
    },
    {
      id: 'faq',
      name: 'FAQ',
      labelText: '✦ FAQ',
      panelId: 'panel-faq',
      pos: { x: 22, y: -6, z: -75 },
      radius: 5.5,
      color: 0xF472B6,
      emissive: 0x9D174D,
      emissiveInt: 0.18,
      glowColor: '#F472B6',
      glowSize: 28,
      camOffset: { x: -8, y: 14, z: 38 },
      labelColor: '#F472B6',
      rotSpeed: 0.005
    },
    {
      id: 'contact',
      name: 'Contact',
      labelText: '✉ Contact',
      panelId: 'panel-contact',
      pos: { x: -55, y: 7, z: -78 },
      radius: 6.2,
      color: 0x34D399,
      emissive: 0x065F46,
      emissiveInt: 0.18,
      glowColor: '#4ADE80',
      glowSize: 32,
      camOffset: { x: 10, y: 14, z: 38 },
      labelColor: '#4ADE80',
      rotSpeed: 0.004
    }
  ];

  /* ── STATE ─────────────────────────────────────────────────── */
  let scene, camera, renderer;
  let planetMeshes = [];    // THREE.Mesh[] aligned to PLANETS
  let glowSprites  = [];    // glow sprite per planet
  let labelEls     = [];    // DOM elements
  let activePlanet = null;  // current panel open
  let isFlying     = false;
  let cameraTarget = new THREE.Vector3(INTRO_POS.x * .2, 0, INTRO_POS.z * .2);
  let clock;
  let starParticles;
  let sunLight;
  let raycaster, mouse;
  let hoveredPlanet = null;

  /* ── INIT ──────────────────────────────────────────────────── */
  function init() {
    /* Renderer */
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x040211, 1);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    /* Scene */
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040211, 0.0022);

    /* Camera */
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2000);
    camera.position.set(INTRO_POS.x, INTRO_POS.y, INTRO_POS.z);
    cameraTarget.set(0, 0, 0);
    camera.lookAt(cameraTarget);

    /* Clock */
    clock = new THREE.Clock();

    /* Build scene */
    buildLights();
    buildStarfield();
    buildNebula();
    buildPlanets();
    buildOrbitalRings();
    buildAsteroidBelt();
    buildLabels();

    /* Interaction */
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('click', onCanvasClick);
    window.addEventListener('resize', onResize, { passive: true });

    /* Boot sequence */
    bootSequence();

    /* Start render loop */
    animate();
  }

  /* ── LIGHTS ─────────────────────────────────────────────────── */
  function buildLights() {
    /* Deep ambient */
    const ambient = new THREE.AmbientLight(0x0a0820, 1.2);
    scene.add(ambient);

    /* Sun point light — illuminates all planets */
    sunLight = new THREE.PointLight(0xFFD070, 3.5, 350, 1.6);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    /* Subtle fill lights for depth */
    const fill1 = new THREE.DirectionalLight(0x2040A0, 0.35);
    fill1.position.set(-1, 1, -1);
    scene.add(fill1);
    const fill2 = new THREE.DirectionalLight(0x602080, 0.2);
    fill2.position.set(1, -1, 1);
    scene.add(fill2);
  }

  /* ── STARFIELD ───────────────────────────────────────────────── */
  function buildStarfield() {
    const count = 6000;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const starColors = [
      [1.0, 1.0, 1.0],    // white
      [0.75, 0.85, 1.0],  // cool blue
      [1.0, 0.95, 0.8],   // warm
      [0.9, 0.8, 1.0],    // lavender
    ];

    for (let i = 0; i < count; i++) {
      /* Distribute on a sphere */
      const r = 600 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = starColors[Math.floor(Math.random() * starColors.length)];
      col[i * 3]     = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
      sizes[i] = Math.random() < 0.04 ? 2.8 : (Math.random() < 0.15 ? 1.6 : 0.9);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    /* Star texture (soft round point) */
    const starTex = buildCircleTexture(64, '#ffffff');
    const mat = new THREE.PointsMaterial({
      map: starTex,
      size: 1.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.01,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    starParticles = new THREE.Points(geo, mat);
    scene.add(starParticles);
  }

  /* ── NEBULA ─────────────────────────────────────────────────── */
  function buildNebula() {
    const nebulaData = [
      { color: '#1A0A4A', pos: [-200, 60, -300], size: 320 },
      { color: '#0A2040', pos: [300, -80, -200], size: 280 },
      { color: '#2A0830', pos: [-100, 100, 200],  size: 240 },
      { color: '#001A30', pos: [180, 40, 250],    size: 200 },
    ];

    nebulaData.forEach(({ color, pos, size }) => {
      const tex = buildRadialGradientTexture(256, color);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(...pos);
      sprite.scale.set(size, size, 1);
      scene.add(sprite);
    });
  }

  /* ── PLANETS ────────────────────────────────────────────────── */
  function buildPlanets() {
    PLANETS.forEach((cfg, idx) => {
      const group = new THREE.Group();
      scene.add(group);

      /* Position (moon gets computed in animate()) */
      if (!cfg.isMoon) {
        group.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);
      }

      /* Planet sphere */
      const segments = 64;
      const geo = new THREE.SphereGeometry(cfg.radius, segments, segments);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: cfg.emissiveInt,
        roughness: cfg.isSun ? 0.6 : 0.75,
        metalness: cfg.isSun ? 0.1 : 0.05
      });

      /* Add surface detail via normal map-like gradient variations on material */
      if (cfg.isSun) {
        /* Sun has extra inner emissive sphere (corona effect) */
        const coronaGeo = new THREE.SphereGeometry(cfg.radius * 1.18, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: 0xFF8800,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeo, coronaMat);
        group.add(corona);

        /* Sun outer glow ring */
        const outerGeo = new THREE.SphereGeometry(cfg.radius * 1.45, 32, 32);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0xFF6600,
          transparent: true,
          opacity: 0.05,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.BackSide
        });
        group.add(new THREE.Mesh(outerGeo, outerMat));
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.planetIdx = idx;
      mesh.userData.planetId  = cfg.id;
      group.add(mesh);

      /* Atmosphere glow (additive sphere around planet) */
      if (!cfg.isSun) {
        const atmGeo = new THREE.SphereGeometry(cfg.radius * 1.22, 32, 32);
        const atmMat = new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: 0.07,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.BackSide
        });
        group.add(new THREE.Mesh(atmGeo, atmMat));
      }

      /* Saturn-style rings */
      if (cfg.hasRings) {
        buildRings(group, cfg.radius, cfg.color);
      }

      /* Glow sprite */
      const glowTex = buildGlowTexture(256, cfg.glowColor);
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: cfg.isSun ? 0.75 : 0.55,
        depthWrite: false
      });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(cfg.glowSize, cfg.glowSize, 1);
      group.add(glow);

      /* Store references */
      cfg._group  = group;
      cfg._mesh   = mesh;
      cfg._glow   = glow;
      cfg._angle  = cfg.orbitAngle || 0; // for moon orbit
      planetMeshes.push(mesh);
      glowSprites.push(glow);
    });
  }

  function buildRings(group, planetRadius, color) {
    const innerR = planetRadius * 1.4;
    const outerR = planetRadius * 2.4;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 80, 4);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.42;
    group.add(ring);

    /* Thin bright inner ring */
    const innerRingGeo = new THREE.RingGeometry(innerR * 1.02, innerR * 1.12, 80);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI * 0.42;
    group.add(innerRing);
  }

  /* ── ORBITAL RINGS ──────────────────────────────────────────── */
  function buildOrbitalRings() {
    /* Moon orbit */
    buildOrbitLine(22, 0.04, 0xA78BFA);

    /* Planet orbits */
    const outerPlanets = PLANETS.filter(p => !p.isSun && !p.isMoon);
    outerPlanets.forEach(cfg => {
      /* Approximate orbital radius from origin */
      const r = Math.sqrt(cfg.pos.x ** 2 + cfg.pos.z ** 2);
      buildOrbitLine(r, 0.02, cfg.color);
    });
  }

  function buildOrbitLine(radius, opacity, color) {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    scene.add(new THREE.Line(geo, mat));
  }

  /* ── ASTEROID BELT ──────────────────────────────────────────── */
  function buildAsteroidBelt() {
    const count = 350;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const minR  = 32, maxR = 42;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * (maxR - minR);
      pos[i * 3]     = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x8899BB,
      size: 0.45,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    scene.add(new THREE.Points(geo, mat));
  }

  /* ── LABELS ─────────────────────────────────────────────────── */
  function buildLabels() {
    const container = document.getElementById('planet-labels');
    if (!container) return;

    PLANETS.forEach((cfg, idx) => {
      const el = document.createElement('div');
      el.className = 'planet-label';
      el.dataset.planetIdx = idx;
      el.style.setProperty('--pcolor', cfg.labelColor);

      const dot = document.createElement('span');
      dot.className = 'plabel-dot';
      const text = document.createElement('span');
      text.textContent = cfg.labelText;

      el.appendChild(dot);
      el.appendChild(text);
      el.addEventListener('click', () => navigateToPlanet(idx));
      container.appendChild(el);
      labelEls.push(el);
    });
  }

  /* ── TEXTURE HELPERS ────────────────────────────────────────── */
  function buildCircleTexture(size, color) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function buildGlowTexture(size, color) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    /* Parse color to rgba */
    grad.addColorStop(0,   hexToRgba(color, 0.9));
    grad.addColorStop(0.25, hexToRgba(color, 0.6));
    grad.addColorStop(0.6,  hexToRgba(color, 0.2));
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function buildRadialGradientTexture(size, color) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,   hexToRgba(color, 0.8));
    grad.addColorStop(0.5, hexToRgba(color, 0.4));
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ── BOOT SEQUENCE ─────────────────────────────────────────── */
  function bootSequence() {
    const loader = document.getElementById('galaxy-loader');

    /* Simulate loading progress */
    let progress = 0;
    const bar = document.querySelector('.loader-bar-fill');
    const status = document.querySelector('.loader-status');
    const steps = ['Calibrating warp drive', 'Mapping star systems', 'Charging solar core', 'Ready for launch'];

    const interval = setInterval(() => {
      progress += Math.random() * 22 + 8;
      if (progress >= 100) { progress = 100; clearInterval(interval); }
      if (bar) bar.style.width = progress + '%';
      if (status) status.textContent = steps[Math.floor(progress / 26)] || steps[3];
    }, 180);

    /* After load: hide loader, run cinematic intro */
    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      runIntroAnimation();
    }, 1400);
  }

  function runIntroAnimation() {
    if (reduced) {
      /* Skip intro, go straight to overview */
      camera.position.set(OVERVIEW_POS.x, OVERVIEW_POS.y, OVERVIEW_POS.z);
      cameraTarget.set(OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z);
      setLabelsVisibility(true);
      hideIntroText();
      return;
    }

    /* Fade out intro text after 2s */
    setTimeout(hideIntroText, 2200);

    /* Cinematic camera sweep from far in to overview */
    gsap.timeline({ delay: 0.6 })
      .to(camera.position, {
        x: OVERVIEW_POS.x,
        y: OVERVIEW_POS.y,
        z: OVERVIEW_POS.z,
        duration: 3.8,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(cameraTarget)
      })
      .to(cameraTarget, {
        x: OVERVIEW_TARGET.x,
        y: OVERVIEW_TARGET.y,
        z: OVERVIEW_TARGET.z,
        duration: 3.8,
        ease: 'power2.inOut'
      }, '<')
      .call(() => {
        setLabelsVisibility(true);
      });
  }

  function hideIntroText() {
    const el = document.getElementById('intro-text');
    if (el) {
      el.style.transition = 'opacity .8s ease';
      el.style.opacity = '0';
      setTimeout(() => { if (el) el.style.display = 'none'; }, 900);
    }
  }

  /* ── NAVIGATION ─────────────────────────────────────────────── */
  function navigateToPlanet(idx) {
    if (isFlying) return;
    const cfg = PLANETS[idx];

    /* Close any open panel */
    closeAllPanels();
    isFlying = true;
    setLabelsVisibility(false);

    /* Show travel flash */
    const overlay = document.getElementById('travel-overlay');
    if (overlay) overlay.classList.add('active');

    /* Compute landing camera position */
    const planetPos = getPlanetWorldPos(cfg);
    const offset = cfg.camOffset || { x: 0, y: 15, z: 40 };
    const camPos = {
      x: planetPos.x + offset.x,
      y: planetPos.y + offset.y,
      z: planetPos.z + offset.z
    };
    const lookOffset = cfg.camLookOffset || { x: 0, y: 0, z: 0 };
    const lookAt = {
      x: planetPos.x + lookOffset.x,
      y: planetPos.y + lookOffset.y,
      z: planetPos.z + lookOffset.z
    };

    /* 3-phase camera animation */
    const tl = gsap.timeline({
      onComplete: () => {
        isFlying = false;
        activePlanet = idx;
        if (overlay) overlay.classList.remove('active');
        openPanel(cfg.panelId);
        updateNavActive(cfg.id);
        /* Show return-to-overview button */
        showOverviewBtn();
      }
    });

    /* Phase 1: Zoom out to overview */
    tl.to(camera.position, {
      x: OVERVIEW_POS.x,
      y: OVERVIEW_POS.y + 10,
      z: OVERVIEW_POS.z,
      duration: 0.85,
      ease: 'power2.in'
    })
    .to(cameraTarget, {
      x: OVERVIEW_TARGET.x,
      y: OVERVIEW_TARGET.y,
      z: OVERVIEW_TARGET.z,
      duration: 0.85,
      ease: 'power2.in'
    }, '<');

    /* Phase 2: Travel to planet */
    tl.to(camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      duration: 1.4,
      ease: 'power2.inOut'
    })
    .to(cameraTarget, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration: 1.4,
      ease: 'power2.inOut'
    }, '<');

    /* Dimm overlay mid-flight */
    tl.to({}, { duration: 0.2 }, '<+=0.5');
  }

  function returnToOverview() {
    if (isFlying) return;
    closeAllPanels();
    isFlying = true;
    hideOverviewBtn();
    activePlanet = null;
    updateNavActive(null);

    gsap.timeline({ onComplete: () => { isFlying = false; setLabelsVisibility(true); } })
      .to(camera.position, {
        x: OVERVIEW_POS.x,
        y: OVERVIEW_POS.y,
        z: OVERVIEW_POS.z,
        duration: 1.6,
        ease: 'power2.inOut'
      })
      .to(cameraTarget, {
        x: OVERVIEW_TARGET.x,
        y: OVERVIEW_TARGET.y,
        z: OVERVIEW_TARGET.z,
        duration: 1.6,
        ease: 'power2.inOut'
      }, '<');
  }

  function getPlanetWorldPos(cfg) {
    if (cfg.isMoon) {
      /* Moon position is computed in animate() */
      const moonGroup = cfg._group;
      const wp = new THREE.Vector3();
      moonGroup.getWorldPosition(wp);
      return { x: wp.x, y: wp.y, z: wp.z };
    }
    return cfg.pos;
  }

  /* ── PANELS ─────────────────────────────────────────────────── */
  function openPanel(panelId) {
    const el = document.getElementById(panelId);
    if (el) {
      el.classList.add('open');
      /* Update nav state */
      document.getElementById('galaxy-nav')?.classList.add('at-planet');
    }
  }

  function closeAllPanels() {
    document.querySelectorAll('.g-panel.open').forEach(el => el.classList.remove('open'));
    document.getElementById('galaxy-nav')?.classList.remove('at-planet');
  }

  function showOverviewBtn() {
    const btn = document.getElementById('overview-btn');
    if (btn) btn.classList.remove('hidden');
  }

  function hideOverviewBtn() {
    const btn = document.getElementById('overview-btn');
    if (btn) btn.classList.add('hidden');
  }

  function setLabelsVisibility(visible) {
    labelEls.forEach(el => {
      if (visible) el.classList.add('overview-mode');
      else el.classList.remove('overview-mode');
    });
  }

  function updateNavActive(planetId) {
    document.querySelectorAll('.gnav-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.planet === planetId);
    });
  }

  /* ── RAYCASTING / HOVER ─────────────────────────────────────── */
  function onMouseMove(e) {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    updateHover();
  }

  function updateHover() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes, false);

    if (hits.length > 0) {
      const idx = hits[0].object.userData.planetIdx;
      if (hoveredPlanet !== idx) {
        hoveredPlanet = idx;
        canvas.classList.add('hovering');
        /* Pulse glow on hovered planet */
        gsap.to(glowSprites[idx].material, { opacity: 0.85, duration: 0.3 });
      }
    } else {
      if (hoveredPlanet !== null) {
        const prev = hoveredPlanet;
        const baseCfg = PLANETS[prev];
        gsap.to(glowSprites[prev].material, {
          opacity: baseCfg.isSun ? 0.75 : 0.55,
          duration: 0.5
        });
      }
      hoveredPlanet = null;
      canvas.classList.remove('hovering');
    }
  }

  function onCanvasClick(e) {
    if (isFlying) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.planetIdx;
      navigateToPlanet(idx);
    }
  }

  /* ── LABEL PROJECTION ──────────────────────────────────────── */
  function updateLabels() {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;

    PLANETS.forEach((cfg, idx) => {
      const el = labelEls[idx];
      if (!el) return;

      /* Get world position */
      const wp = new THREE.Vector3();
      cfg._group.getWorldPosition(wp);

      /* Project to screen */
      const proj = wp.clone().project(camera);
      const x = (proj.x + 1) / 2 * w;
      const y = -(proj.y - 1) / 2 * h;

      /* Hide if behind camera or out of bounds */
      if (proj.z > 1 || x < 0 || x > w || y < 0 || y > h) {
        el.style.opacity = '0';
        return;
      }

      el.style.left = x + 'px';
      el.style.top  = y + 'px';

      /* Scale opacity by distance */
      const dist = camera.position.distanceTo(wp);
      const fadeStart = 120, fadeEnd = 30;
      const fade = Math.max(0, Math.min(1, (dist - fadeEnd) / (fadeStart - fadeEnd)));

      if (el.classList.contains('overview-mode')) {
        el.style.opacity = (fade * 0.9).toString();
      } else {
        el.style.opacity = '0';
      }
    });
  }

  /* ── RESIZE ─────────────────────────────────────────────────── */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ── ANIMATION LOOP ────────────────────────────────────────── */
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    /* Rotate starfield very slowly */
    if (starParticles) {
      starParticles.rotation.y += delta * 0.008;
      starParticles.rotation.x += delta * 0.002;
    }

    /* Rotate planets on their axes */
    PLANETS.forEach(cfg => {
      if (!cfg._mesh) return;
      cfg._mesh.rotation.y += delta * (cfg.rotSpeed || 0.004);
    });

    /* Pulse sun glow */
    const sunCfg = PLANETS[0];
    if (sunCfg._glow) {
      const pulse = 0.72 + Math.sin(elapsed * 1.8) * 0.06;
      sunCfg._glow.material.opacity = pulse;
    }

    /* Pulse sun light intensity */
    if (sunLight) {
      sunLight.intensity = 3.4 + Math.sin(elapsed * 2.2) * 0.25;
    }

    /* Moon orbit around sun */
    const moonCfg = PLANETS[1];
    if (moonCfg._group) {
      moonCfg._angle += delta * moonCfg.orbitSpeed;
      const r = moonCfg.orbitRadius;
      moonCfg._group.position.set(
        Math.cos(moonCfg._angle) * r,
        Math.sin(moonCfg._angle * 0.3) * 3,
        Math.sin(moonCfg._angle) * r
      );
    }

    /* Gently pulse each planet glow */
    PLANETS.forEach((cfg, i) => {
      if (i === 0 || !cfg._glow) return;
      const base = cfg.isMoon ? 0.55 : 0.5;
      const phase = i * 0.9;
      cfg._glow.material.opacity = base + Math.sin(elapsed * 1.2 + phase) * 0.08;
    });

    /* Update camera lookAt */
    camera.lookAt(cameraTarget);

    /* Update label positions */
    updateLabels();

    renderer.render(scene, camera);
  }

  /* ── PUBLIC API (exposed to HTML) ──────────────────────────── */
  window.GalaxyEngine = {
    navigate: navigateToPlanet,
    overview: returnToOverview,
    closePanel: closeAllPanels,
    getPlanetIndex: (id) => PLANETS.findIndex(p => p.id === id),
    /* Scene references for external modules (e.g. nano-banana.js) */
    _scene:  null,  /* set by init() */
    _camera: null,
    _clock:  null,
  };

  /* Patch init to fill scene refs after build */
  const _origInit = init;
  function initWithExpose() {
    _origInit();
    window.GalaxyEngine._scene  = scene;
    window.GalaxyEngine._camera = camera;
    window.GalaxyEngine._clock  = clock;
    /* Also set legacy globals for nano-banana.js whenReady() */
    window.__galaxyScene  = scene;
    window.__galaxyCamera = camera;
    window.__galaxyClock  = clock;
  }

  /* ── WIRING NAV PILLS ─────────────────────────────────────── */
  function wireNavPills() {
    document.querySelectorAll('.gnav-pill[data-planet]').forEach(pill => {
      pill.addEventListener('click', () => {
        const id = pill.dataset.planet;
        const idx = PLANETS.findIndex(p => p.id === id);
        if (idx >= 0) navigateToPlanet(idx);
      });
    });

    /* Brand logo → overview */
    document.querySelector('.gnav-brand')?.addEventListener('click', returnToOverview);

    /* Overview button */
    document.getElementById('overview-btn')?.addEventListener('click', returnToOverview);

    /* Panel close buttons */
    document.querySelectorAll('.g-panel-close').forEach(btn => {
      btn.addEventListener('click', returnToOverview);
    });

    /* FAQ accordions inside panels */
    document.querySelectorAll('.gp-faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.gp-faq');
        if (item) item.classList.toggle('open');
      });
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────── */
  if (typeof THREE === 'undefined') {
    console.error('GalaxyEngine: Three.js not loaded');
    return;
  }
  if (typeof gsap === 'undefined') {
    console.error('GalaxyEngine: GSAP not loaded');
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initWithExpose(); wireNavPills(); });
  } else {
    initWithExpose();
    wireNavPills();
  }
})();
