/* ══════════════════════════════════════════════════════════════
   NovaOps AI · NANO BANANA SATELLITE SYSTEM
   Hyper-realistic metallic nano-banana objects orbiting the sun.
   Integrates with galaxy.js's shared Three.js scene.

   Nano Banana lore: Quantum-organic data transponders, shaped by
   harmonic curvature algorithms into the most aerodynamic form
   nature ever produced — the banana arc. They relay AI inference
   at the speed of light and look absolutely unhinged while doing it.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Wait for galaxy engine & THREE to be ready */
  function whenReady(fn) {
    if (typeof THREE !== 'undefined' && window.NanoBananaReady !== false) {
      const check = setInterval(() => {
        const canvas = document.getElementById('galaxy-canvas');
        /* galaxy.js exposes GalaxyEngine after init; we hook via a custom event */
        if (window.__galaxyScene) {
          clearInterval(check);
          fn(window.__galaxyScene, window.__galaxyCamera, window.__galaxyClock);
        }
      }, 120);
    }
  }

  /* ── Banana curve path ───────────────────────────────────────
     A CatmullRomCurve3 traced through 6 control points that
     approximate a banana's characteristic crescent arc.          */
  function buildBananaCurve(scale) {
    const s = scale || 1;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.4 * s,  0.0 * s,  0),
      new THREE.Vector3(-1.6 * s,  0.5 * s,  0),
      new THREE.Vector3(-0.6 * s,  1.0 * s,  0),
      new THREE.Vector3( 0.6 * s,  1.0 * s,  0),
      new THREE.Vector3( 1.6 * s,  0.5 * s,  0),
      new THREE.Vector3( 2.4 * s,  0.0 * s,  0),
    ], false, 'catmullrom', 0.5);
  }

  /* ── Banana geometry ─────────────────────────────────────────
     TubeGeometry along the banana curve with tapered ends.       */
  function buildBananaGeometry(scale) {
    const curve = buildBananaCurve(scale || 1);
    /* Radius function: tapers at tips, thicker in middle */
    return new THREE.TubeGeometry(curve, 24, 0.28 * (scale || 1), 8, false);
  }

  /* ── Metallic banana material ────────────────────────────────
     MeshStandardMaterial gives us PBR metalness for that
     hyper-realistic organic-metal look.                          */
  function buildBananaMaterial(tint) {
    return new THREE.MeshStandardMaterial({
      color:     tint || 0xF2C94C,
      metalness: 0.72,
      roughness: 0.22,
      emissive:  0xAA7A00,
      emissiveIntensity: 0.18,
      envMapIntensity: 1.0,
    });
  }

  /* ── Glow sprite per banana ─────────────────────────────────── */
  function buildBananaGlow(color) {
    const size = 128;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,   'rgba(242,201,76,0.60)');
    grad.addColorStop(0.4, 'rgba(242,201,76,0.20)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cvs);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.55,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(10, 10, 1);
    return sprite;
  }

  /* ── Config: five nano bananas in eccentric orbits ──────────── */
  const BANANA_CONFIG = [
    {
      orbitRadius: 58,
      orbitSpeed:  0.065,
      orbitAngle:  0,
      orbitTilt:   0.18,          /* Y-tilt for 3D orbital plane */
      scale:       1.1,
      rotSpeed:    { x: 0.008, y: 0.014, z: 0.006 },
      label:       'NB-Alpha · Quantum Transponder',
    },
    {
      orbitRadius: 48,
      orbitSpeed:  0.085,
      orbitAngle:  Math.PI * 0.6,
      orbitTilt:  -0.28,
      scale:       0.85,
      rotSpeed:    { x: 0.012, y: 0.009, z: 0.010 },
      label:       'NB-Beta · Dark Matter Relay',
    },
    {
      orbitRadius: 72,
      orbitSpeed:  0.048,
      orbitAngle:  Math.PI * 1.2,
      orbitTilt:   0.12,
      scale:       1.3,
      rotSpeed:    { x: 0.005, y: 0.018, z: 0.008 },
      label:       'NB-Gamma · Neural Sync Node',
    },
    {
      orbitRadius: 38,
      orbitSpeed:  0.110,
      orbitAngle:  Math.PI * 1.7,
      orbitTilt:  -0.08,
      scale:       0.70,
      rotSpeed:    { x: 0.016, y: 0.007, z: 0.012 },
      label:       'NB-Delta · Temporal Cache',
    },
    {
      orbitRadius: 90,
      orbitSpeed:  0.032,
      orbitAngle:  Math.PI * 0.3,
      orbitTilt:   0.35,
      scale:       1.5,
      rotSpeed:    { x: 0.004, y: 0.011, z: 0.007 },
      label:       'NB-Omega · Sovereign Override',
    },
  ];

  /* ── Orbit ring for each banana ─────────────────────────────── */
  function buildBananaOrbit(radius, tilt, scene) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(a) * radius,
        Math.sin(a) * radius * Math.sin(tilt),
        Math.sin(a) * radius * Math.cos(tilt)
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0xF2C94C,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Line(geo, mat));
  }

  /* ── Main: inject bananas into galaxy scene ─────────────────── */
  whenReady(function (scene, camera, clock) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!scene) return;

    const bananas = [];   /* { mesh, glow, cfg, angle } */

    BANANA_CONFIG.forEach(cfg => {
      /* Build banana mesh */
      const geo  = buildBananaGeometry(cfg.scale);
      const mat  = buildBananaMaterial(0xF2C94C);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.isBanana  = true;
      mesh.userData.bananaLabel = cfg.label;
      mesh.castShadow    = false;
      mesh.receiveShadow = false;
      scene.add(mesh);

      /* Glow sprite */
      const glow = buildBananaGlow();
      scene.add(glow);

      /* Orbit ring */
      buildBananaOrbit(cfg.orbitRadius, cfg.orbitTilt, scene);

      bananas.push({ mesh, glow, cfg, angle: cfg.orbitAngle });
    });

    /* ── Animate bananas each frame ────────────────────────────── */
    function animateBananas(elapsed) {
      bananas.forEach(b => {
        if (!reduced) {
          b.angle += b.cfg.orbitSpeed * 0.016; /* ~60fps normalized */
        }
        const a = b.angle;
        const r = b.cfg.orbitRadius;
        const tilt = b.cfg.orbitTilt;

        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * Math.cos(tilt);
        const y = Math.sin(a) * r * Math.sin(tilt);

        b.mesh.position.set(x, y, z);
        b.glow.position.set(x, y, z);

        /* Self-rotation */
        b.mesh.rotation.x += b.cfg.rotSpeed.x;
        b.mesh.rotation.y += b.cfg.rotSpeed.y;
        b.mesh.rotation.z += b.cfg.rotSpeed.z;

        /* Glow pulse */
        const pulse = 0.45 + 0.12 * Math.sin(elapsed * 1.8 + b.cfg.orbitAngle);
        b.glow.material.opacity = pulse;
      });
    }

    /* Hook into galaxy.js animation loop via requestAnimationFrame sentinel */
    let lastElapsed = 0;
    function tick() {
      const elapsed = clock ? clock.getElapsedTime() : (lastElapsed += 0.016);
      lastElapsed = elapsed;
      animateBananas(elapsed);
      requestAnimationFrame(tick);
    }
    tick();
  });

  /* ── DOM banana badge interaction ───────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const reveal  = document.getElementById('nano-banana-reveal');
    const closeBtn = document.getElementById('nbr-close-btn');
    const badges  = document.querySelectorAll('.banana-badge');

    if (!reveal) return;

    badges.forEach(badge => {
      badge.addEventListener('click', () => {
        reveal.classList.add('open');
        /* Announce for SR */
        reveal.removeAttribute('aria-hidden');
        reveal.setAttribute('role', 'dialog');
        reveal.setAttribute('aria-modal', 'true');
        reveal.setAttribute('aria-label', 'Nano Banana Technology Specifications');
      });
    });

    function closeReveal() {
      reveal.classList.remove('open');
      reveal.setAttribute('aria-hidden', 'true');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeReveal);
    reveal.addEventListener('click', e => {
      if (e.target === reveal) closeReveal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeReveal();
    });
  });

})();
