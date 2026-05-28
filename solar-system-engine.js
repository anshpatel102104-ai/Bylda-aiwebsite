'use strict';

/* ══════════════════════════════════════════════════════════════════════
   NovaOps AI — NovaSolarSystem
   Three.js interactive solar system engine for nova-ops.space
   Requires: THREE (global, loaded via three.min.js)
   Canvas ID: #solar-canvas
   Labels container: #planet-labels
   Modal: #planet-modal / #modal-inner / #modal-backdrop / #modal-close
   ══════════════════════════════════════════════════════════════════════ */

class NovaSolarSystem {
  constructor() {
    this.canvas = document.getElementById('solar-canvas');
    if (!this.canvas) return;

    /* ── Planet data ──────────────────────────────────────────────── */
    this.PLANET_DATA = [
      {
        id: 'ai-automation',
        name: 'AI Automation',
        tagline: 'Done-for-you AI systems',
        color: 0xFF8C42,
        emissiveColor: 0xFF6A00,
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
        name: 'CRM Systems',
        tagline: 'Your pipeline, automated',
        color: 0x4EC9C9,
        emissiveColor: 0x00A8A8,
        radius: 2.0,
        distance: 40,
        speed: 0.007,
        rotationSpeed: 0.015,
        href: '/services/crm-automation',
        icon: '🔗',
        features: ['Pipeline Automation', 'Contact Management', 'Deal Tracking'],
      },
      {
        id: 'lead-generation',
        name: 'Lead Generation',
        tagline: 'Leads that convert',
        color: 0x6B9EFF,
        emissiveColor: 0x4477DD,
        radius: 3.2,
        distance: 56,
        speed: 0.005,
        rotationSpeed: 0.020,
        href: '/services/lead-qualification',
        icon: '🎯',
        features: ['AI Qualification', 'Multi-channel Outreach', 'Smart Scoring'],
      },
      {
        id: 'growth-systems',
        name: 'Growth Systems',
        tagline: 'Scale without headcount',
        color: 0xFF4F6B,
        emissiveColor: 0xCC1F3B,
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
        name: 'AI Agents',
        tagline: 'Your 24/7 AI workforce',
        color: 0xFFB347,
        emissiveColor: 0xFF9500,
        radius: 6.0,
        distance: 95,
        speed: 0.0026,
        rotationSpeed: 0.008,
        href: '/services/voice-ai',
        icon: '🤖',
        features: ['Voice AI', 'Chat AI', 'Email AI', 'SMS AI'],
        rings: true,
        ringInner: 8.5,
        ringOuter: 13,
        ringColor: 0x997744,
      },
      {
        id: 'saas-products',
        name: 'SaaS Products',
        tagline: 'Software that sells itself',
        color: 0x7BED9F,
        emissiveColor: 0x3BB562,
        radius: 2.6,
        distance: 118,
        speed: 0.0020,
        rotationSpeed: 0.022,
        href: '/launchpad',
        icon: '💻',
        features: ['LaunchpadNova', '20 AI Tools', 'Founder OS'],
      },
      {
        id: 'recruiting',
        name: 'Recruiting',
        tagline: 'Hire smarter, faster',
        color: 0x70A1FF,
        emissiveColor: 0x3D6BCC,
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
        ringColor: 0x334466,
        ringTilt: 0.45,
      },
      {
        id: 'consulting',
        name: 'Consulting',
        tagline: 'Strategic AI advisory',
        color: 0xC5A3FF,
        emissiveColor: 0x8866CC,
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
     PLANETS — sphere + glow + point light + orbital ring
  ────────────────────────────────────────────────────────────── */
  createPlanets() {
    this.PLANET_DATA.forEach((data) => {
      /* Orbital group — we rotate this group to orbit the sun */
      const group = new THREE.Group();
      const initialAngle = Math.random() * Math.PI * 2;
      group.userData.initialAngle = initialAngle;
      group.rotation.y = initialAngle;

      /* Planet sphere */
      const geo = new THREE.SphereGeometry(data.radius, 48, 48);
      const mat = new THREE.MeshPhongMaterial({
        color:            data.color,
        emissive:         data.emissiveColor,
        emissiveIntensity: 0.35,
        shininess:        80,
        specular:         0x333333,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(data.distance, 0, 0);

      /* Store planet data on mesh for raycaster callback */
      mesh.userData.planetData = data;

      /* Glow shell around planet (slightly larger, rendered inside-out) */
      const glowGeo = new THREE.SphereGeometry(data.radius * 1.3, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color:       data.color,
        transparent: true,
        opacity:     0.15,
        side:        THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);

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
    const geo = new THREE.RingGeometry(data.ringInner, data.ringOuter, 64);
    const mat = new THREE.MeshBasicMaterial({
      color:       data.ringColor,
      transparent: true,
      opacity:     0.45,
      side:        THREE.DoubleSide,
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
    sunEl.textContent = 'NovaOps ☀';
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
      window.novaSolarSystem = new NovaSolarSystem();
    } catch (e) {
      console.warn('Solar system init failed:', e);
    }
  } else {
    console.warn('NovaSolarSystem: THREE.js not available. Skipping 3D engine.');
  }
});
