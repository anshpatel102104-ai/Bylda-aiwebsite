'use strict';

/* ══════════════════════════════════════════════════════════════════════
   NovaOps AI — nova-animations.js
   Vanilla JS animation system (no GSAP ScrollTrigger dependency).
   Covers: reveal observer, nav scroll/hide, mobile menu, counter
   animation, hero title stagger, cursor glow, card 3D tilt, smooth
   anchors, active nav, explore button, outside-click-close, labels.
   ══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════════════════════════
     1. INTERSECTION OBSERVER — .reveal elements fade/slide in
     ════════════════════════════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);  // fire once
      }
    });
  }, {
    threshold:  0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


  /* ════════════════════════════════════════════════════════════════
     2. NAVIGATION — scroll class + hide-on-down / show-on-up
     ════════════════════════════════════════════════════════════════ */
  (function mountNavScroll() {
    /* Support both the galaxy nav and the nova-landing nav */
    const nav = document.querySelector('#nav, #nl-nav, #galaxy-nav, .site-nav, nav');
    if (!nav) return;

    let lastScrollY  = window.scrollY;
    let rafPending   = false;
    let isHidden     = false;

    function updateNav() {
      const currentY = window.scrollY;

      /* Scrolled class — thickens backdrop at >60px */
      if (currentY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      /* Hide on scroll down past 200px, reveal on any scroll up */
      if (currentY > 200) {
        if (currentY > lastScrollY && !isHidden) {
          nav.style.transform  = 'translateY(-110%)';
          nav.style.transition = 'transform 0.35s cubic-bezier(.5,0,.75,0)';
          isHidden = true;
        } else if (currentY < lastScrollY && isHidden) {
          nav.style.transform  = 'translateY(0)';
          nav.style.transition = 'transform 0.45s cubic-bezier(.22,1,.36,1)';
          isHidden = false;
        }
      } else {
        /* Always visible near top */
        nav.style.transform = 'translateY(0)';
        isHidden = false;
      }

      lastScrollY = currentY;
      rafPending  = false;
    }

    window.addEventListener('scroll', () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateNav);
      }
    }, { passive: true });

    updateNav(); // initial state
  })();


  /* ════════════════════════════════════════════════════════════════
     3. MOBILE MENU TOGGLE
     ════════════════════════════════════════════════════════════════ */
  (function mountMobileMenu() {
    /* Support multiple toggle/menu ID patterns across pages */
    const toggle     = document.getElementById('mobile-toggle')
                    || document.getElementById('nl-burger')
                    || document.querySelector('.nav-burger, .hamburger');
    const mobileMenu = document.getElementById('mobile-menu')
                    || document.getElementById('nl-mobile-menu')
                    || document.querySelector('.nav-mobile, .mobile-menu');

    if (!toggle || !mobileMenu) return;

    function openMenu() {
      mobileMenu.classList.add('active');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    }

    function closeMenu() {
      mobileMenu.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    }

    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('active');
      if (isOpen) closeMenu(); else openMenu();
    });

    /* Outside click to close */
    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('active') &&
        !mobileMenu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }
    });

    /* Escape key to close */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMenu();
        toggle.focus();
      }
    });

    /* Close on any menu link click (anchor navigation) */
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     4. COUNTER ANIMATION — .stat-value and .stat-big
     Parse target value from textContent, animate 0 → target.
     Handles suffixes: +  ★  $  M  h  k  d
     ════════════════════════════════════════════════════════════════ */
  (function mountCounters() {
    const counterEls = document.querySelectorAll('.stat-value, .stat-big, .gsn, .sn, .num');
    if (!counterEls.length) return;

    /**
     * Parse a display string into { prefix, number, suffix }.
     * Examples:
     *   "$14k+" → { prefix:"$", number:14, suffix:"k+" }
     *   "4.9★"  → { prefix:"",  number:4.9, suffix:"★" }
     *   "500+"  → { prefix:"",  number:500,  suffix:"+" }
     *   "14d"   → { prefix:"",  number:14,  suffix:"d" }
     *   "2M+"   → { prefix:"",  number:2,   suffix:"M+" }
     */
    function parse(text) {
      text = text.trim();
      // Prefix
      const prefixMatch = text.match(/^([$€£]?)/);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      let   rest   = text.slice(prefix.length);
      // Number (int or float)
      const numMatch = rest.match(/^(\d+(?:\.\d+)?)/);
      if (!numMatch) return null;
      const number = parseFloat(numMatch[1]);
      const suffix = rest.slice(numMatch[1].length);
      return { prefix, number, suffix, original: text };
    }

    /**
     * Easing: ease-out cubic
     */
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animateCounter(el) {
      const parsed = parse(el.textContent);
      if (!parsed || isNaN(parsed.number)) return;

      const { prefix, number, suffix } = parsed;
      const duration  = 2000;   // ms
      const startTime = performance.now();
      const isFloat   = String(number).includes('.');
      const decimals  = isFloat ? (String(number).split('.')[1] || '').length : 0;

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = easeOut(progress);
        const current  = number * eased;

        el.textContent = prefix + current.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          /* Ensure exact final value */
          el.textContent = prefix + number.toFixed(decimals) + suffix;
        }
      }

      requestAnimationFrame(tick);
    }

    /* Trigger counter when element enters viewport */
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterEls.forEach(el => counterObserver.observe(el));
  })();


  /* ════════════════════════════════════════════════════════════════
     5. HERO TITLE STAGGER ON LOAD
     .title-line elements + hero supporting elements animate in
     ════════════════════════════════════════════════════════════════ */
  (function mountHeroStagger() {
    /* Title lines — staggered by index */
    document.querySelectorAll('.title-line').forEach((line, i) => {
      line.style.opacity         = '0';
      line.style.transform       = 'translateY(30px)';
      line.style.transition      = 'opacity 0.8s ease, transform 0.8s ease';
      line.style.transitionDelay = `${0.1 + i * 0.15}s`;

      /* Double-rAF ensures the initial state is painted before transition fires */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          line.style.opacity   = '1';
          line.style.transform = 'translateY(0)';
        });
      });
    });

    /* Supporting hero elements */
    const heroSelectors = [
      '.hero-badge',
      '.hero-eyebrow',
      '.hero-subtitle',
      '.hero-sub',
      '.hero-cta-group',
      '.hero-cta',
      '.hero-stats',
      '.stat-rail',
    ];

    heroSelectors.forEach((sel, i) => {
      const el = document.querySelector(sel);
      if (!el) return;

      el.style.opacity         = '0';
      el.style.transform       = 'translateY(20px)';
      el.style.transition      = 'opacity 0.7s ease, transform 0.7s ease';
      el.style.transitionDelay = `${0.5 + i * 0.1}s`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     6. PLANET LABEL HOVER ENHANCEMENT
     (labels are created dynamically by solar-system-engine.js —
     we use event delegation on the container)
     ════════════════════════════════════════════════════════════════ */
  (function mountLabelHover() {
    const labelContainer = document.getElementById('planet-labels');
    if (!labelContainer) return;

    labelContainer.addEventListener('mouseenter', (e) => {
      const label = e.target.closest('.planet-label');
      if (label) {
        label.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        label.style.transform  = 'translateX(-50%) scale(1.15)';
      }
    }, true);

    labelContainer.addEventListener('mouseleave', (e) => {
      const label = e.target.closest('.planet-label');
      if (label) {
        label.style.transform = 'translateX(-50%) scale(1)';
      }
    }, true);
  })();


  /* ════════════════════════════════════════════════════════════════
     7. SMOOTH ANCHOR SCROLLING
     ════════════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const hash   = a.getAttribute('href');
      const target = hash && hash.length > 1
        ? document.querySelector(hash)
        : null;

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        /* Update URL hash without triggering a jump */
        if (history.pushState) {
          history.pushState(null, null, hash);
        }
      }
    });
  });


  /* ════════════════════════════════════════════════════════════════
     8. CURSOR GLOW — desktop only, follows mouse with rAF
     ════════════════════════════════════════════════════════════════ */
  (function mountCursorGlow() {
    /* Only on non-touch desktop screens */
    if ('ontouchstart' in window || window.innerWidth <= 1024) return;

    const cursor = document.querySelector('.cursor-glow');
    if (!cursor) return;

    cursor.style.display = 'block';

    let cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
    }, { passive: true });

    /* rAF loop updates position — smoother than direct mousemove assignment */
    function updateCursor() {
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    /* Scale up on interactive elements */
    const interactiveSelectors = 'a, button, [role="button"], .service-card, .planet-label, [data-href]';

    document.addEventListener('mouseenter', (e) => {
      if (e.target.closest && e.target.closest(interactiveSelectors)) {
        cursor.style.transform = 'translate(-50%, -50%) scale(2.5)';
        cursor.style.opacity   = '0.6';
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      if (e.target.closest && e.target.closest(interactiveSelectors)) {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.opacity   = '1';
      }
    }, true);
  })();


  /* ════════════════════════════════════════════════════════════════
     9. ACTIVE NAV LINK — highlight based on current pathname
     ════════════════════════════════════════════════════════════════ */
  (function mountActiveNav() {
    const current = window.location.pathname
      .replace(/\/$/, '')        // strip trailing slash
      .replace(/\.html$/, '');   // strip .html extension for comparison

    document.querySelectorAll('nav a').forEach(a => {
      const href = (a.getAttribute('href') || '')
        .replace(/\/$/, '')
        .replace(/\.html$/, '');

      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

      /* Exact match, or root "/" for index */
      const isHome    = (current === '' || current === '/index') && (href === '' || href === '/');
      const isExact   = href !== '' && current === href;
      const isPrefix  = href.length > 1 && current.startsWith(href);

      if (isHome || isExact || isPrefix) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     10a. HERO SCROLL PARALLAX — hero content lifts/fades as user scrolls
     ════════════════════════════════════════════════════════════════ */
  (function mountHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!heroContent) return;

    let rafPending = false;
    const heroEl = document.querySelector('.solar-hero');

    function updateParallax() {
      const scrollY = window.scrollY;
      if (!heroEl) { rafPending = false; return; }
      const heroH = heroEl.offsetHeight;

      if (scrollY < heroH) {
        const p = scrollY / heroH;
        const lift = scrollY * 0.22;
        const fade = Math.max(0, 1 - p * 1.8);
        heroContent.style.transform = `translateY(${lift}px)`;
        heroContent.style.opacity   = fade;
        if (scrollIndicator) {
          scrollIndicator.style.opacity = Math.max(0, 1 - p * 5);
        }
      } else {
        heroContent.style.transform = '';
        heroContent.style.opacity   = '0';
      }

      rafPending = false;
    }

    window.addEventListener('scroll', () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
  })();


  /* ════════════════════════════════════════════════════════════════
     10b. NAV HEIGHT MORPH — update CSS variable on scroll
     ════════════════════════════════════════════════════════════════ */
  (function mountNavHeightMorph() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    let raf = false;

    function tick() {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      raf = false;
    }
    window.addEventListener('scroll', () => {
      if (!raf) { raf = true; requestAnimationFrame(tick); }
    }, { passive: true });
    tick();
  })();


  /* ════════════════════════════════════════════════════════════════
     10. EXPLORE SOLAR SYSTEM BUTTON
     ════════════════════════════════════════════════════════════════ */
  const exploreSolarBtn = document.getElementById('explore-solar');
  if (exploreSolarBtn) {
    exploreSolarBtn.addEventListener('click', () => {
      /* Scroll to #what section, or fall back to #features / first section after hero */
      const target = document.getElementById('what')
                  || document.getElementById('features')
                  || document.querySelector('section:nth-of-type(2)');

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }


  /* ════════════════════════════════════════════════════════════════
     11. OUTSIDE CLICK — close mobile menu (already in section 3)
     This is the standalone handler for pages that don't use #3's pattern.
     ════════════════════════════════════════════════════════════════ */
  (function mountOutsideClickClose() {
    /* Generic: close any element with .closeable-dropdown.open */
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.closeable-dropdown.open').forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     12. CARD HOVER 3D TILT — .service-card elements
     JS computes exact tilt from mouse position inside card.
     CSS provides the perspective. Reset on leave.
     ════════════════════════════════════════════════════════════════ */
  (function mountCardTilt() {
    /* Only on non-touch devices — tilt is awkward on mobile */
    if ('ontouchstart' in window) return;

    const cards = document.querySelectorAll(
      '.service-card, .tool-card, .feature-card, .spotlight-card, .product-orbit-card, .price-orb, .testi-orb-card'
    );

    if (!cards.length) return;

    const MAX_TILT = 10;   // degrees — keep it subtle

    cards.forEach(card => {
      /* Ensure the card has perspective set so 3D transforms look correct */
      card.style.transformStyle  = 'preserve-3d';
      card.style.willChange      = 'transform';
      card.style.transition      = 'transform 0.1s ease-out, box-shadow 0.3s ease';

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
      });

      card.addEventListener('mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        /* Mouse position relative to card center, normalised -1 to +1 */
        const relX   = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        const relY   = ((e.clientY - rect.top)  / rect.height) * 2 - 1;

        /* Tilt: mouse on right edge → tilt right (positive rotateY),
                 mouse on top edge  → tilt back (negative rotateX) */
        const rotateX = -relY * MAX_TILT;
        const rotateY =  relX * MAX_TILT;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
      });

      card.addEventListener('mouseleave', () => {
        /* Smooth reset */
        card.style.transition = 'transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.4s ease';
        card.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      });
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     BONUS: Nova landing page custom cursor (cursor-dot / cursor-ring)
     Used in nova-landing.html — guard if elements don't exist
     ════════════════════════════════════════════════════════════════ */
  (function mountNovaCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;
    if ('ontouchstart' in window || window.innerWidth <= 768) {
      dot.style.display  = 'none';
      ring.style.display = 'none';
      return;
    }

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    }, { passive: true });

    /* Ring lags behind with lerp for a trailing feel */
    (function updateRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(updateRing);
    })();

    /* Scale ring on hover of interactive elements */
    document.querySelectorAll('a, button, .btn, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     BONUS: Galaxy panel FAQ accordion (galaxy.js may also handle
     this but we guard for it here in case nova-animations.js loads
     on a page without galaxy.js)
     ════════════════════════════════════════════════════════════════ */
  (function mountGalaxyFAQ() {
    document.querySelectorAll('.gp-faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const faqItem  = btn.closest('.gp-faq');
        if (!faqItem) return;
        const isOpen   = btn.getAttribute('aria-expanded') === 'true';
        const icon     = btn.querySelector('.gfq-icon');

        /* Collapse all sibling FAQs */
        const parent   = faqItem.parentElement;
        if (parent) {
          parent.querySelectorAll('.gp-faq-q').forEach(q => {
            q.setAttribute('aria-expanded', 'false');
            const i = q.querySelector('.gfq-icon');
            if (i) i.textContent = '+';
          });
        }

        /* Toggle this one */
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          if (icon) icon.textContent = '−';
        }
      });
    });
  })();


  /* ════════════════════════════════════════════════════════════════
     BONUS: .page-arriving entrance (duplicate-safe — only fires
     if solar.js hasn't already set it)
     ════════════════════════════════════════════════════════════════ */
  (function mountPageArrival() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!document.body.classList.contains('page-arriving')) {
      document.body.classList.add('page-arriving');
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('arrived');
      });
    });
  })();

});  // end DOMContentLoaded
