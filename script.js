/* ─── NOVAOPS AI — script.js v6.0 ─── */

(function () {
  'use strict';

  /* ── LIGHT / DARK MODE TOGGLE ── */
  const SCHEME_KEY = 'novaops-scheme';
  const html = document.documentElement;

  // Moon icon (dark mode active) and Sun icon (light mode active)
  const ICON_MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6.002 6.002 0 1 0 8 8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const ICON_SUN  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function applyScheme(scheme) {
    if (scheme === 'light') {
      html.setAttribute('data-color-scheme', 'light');
    } else {
      html.removeAttribute('data-color-scheme');
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = scheme === 'light' ? ICON_MOON : ICON_SUN;
  }

  // Init from saved preference, default to dark
  const savedScheme = localStorage.getItem(SCHEME_KEY) || 'dark';
  applyScheme(savedScheme);

  // Inject toggle button into nav after DOM ready
  function injectToggle() {
    const navCta = document.querySelector('.nav-actions');
    if (!navCta) return;
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle light/dark mode');
    btn.innerHTML = (localStorage.getItem(SCHEME_KEY) === 'light') ? ICON_MOON : ICON_SUN;
    btn.addEventListener('click', () => {
      const current = html.getAttribute('data-color-scheme') === 'light' ? 'light' : 'dark';
      const next    = current === 'light' ? 'dark' : 'light';
      localStorage.setItem(SCHEME_KEY, next);
      applyScheme(next);
    });
    navCta.insertAdjacentElement('beforebegin', btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToggle);
  } else {
    injectToggle();
  }

  /* ── NAV SCROLL STATE ── */
  const nav = document.querySelector('.nova-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── HAMBURGER / MOBILE DRAWER ── */
  const hamburger = document.getElementById('mobile-toggle');
  const drawer    = document.getElementById('mobile-menu');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('click', e => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !hamburger.contains(e.target)) {
        drawer.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── SCROLL REVEAL (all variants) ── */
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-up, .section-label, .eyebrow'
  );
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ── INLINE REVEAL FOR FEATURE ROWS ── */
  const inlineReveal = document.querySelectorAll('.feature-row, .about-story-row');
  if (inlineReveal.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });
    inlineReveal.forEach(el => io2.observe(el));
  }

  /* ── FAQ ACCORDION ── */
  document.querySelectorAll('.faq-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      const parent = item.parentElement;
      parent.querySelectorAll('.faq-item.open').forEach(open => {
        if (open !== item) {
          open.classList.remove('open');
          open.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });

  /* ── COUNTER ANIMATION (with comma formatting) ── */
  function formatNum(n) {
    return n.toLocaleString('en-US');
  }
  function animateCounter(el, target, suffix) {
    const duration = 1600;
    const start    = performance.now();
    el.classList.add('visible-counter');
    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNum(Math.round(target * ease)) + (suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const val    = parseInt(el.dataset.counter, 10);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, val, suffix);
          cio.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => cio.observe(el));
  }

  /* ── FAQ SIDE NAV HIGHLIGHT (faq.html) ── */
  const faqNavItems = document.querySelectorAll('.faq-nav-item');
  const faqGroups   = document.querySelectorAll('.faq-group');
  if (faqNavItems.length && faqGroups.length) {
    const faqSIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          faqNavItems.forEach(nav => {
            nav.classList.toggle('active', nav.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    faqGroups.forEach(g => faqSIO.observe(g));
  }

  /* ── STAT PANEL CARD STAGGER (homepage) ── */
  const panels = document.querySelectorAll('.stat-panel-card');
  panels.forEach((card, i) => {
    card.style.transitionDelay = (i * 0.07) + 's';
  });

  /* ── CARD ENTRANCE STAGGER (grids) ── */
  const cardGrids = document.querySelectorAll('.grid-3, .grid-2, .grid-4');
  cardGrids.forEach(grid => {
    const cards = grid.querySelectorAll('.card, .testimonial-card, .result-card, .service-card');
    cards.forEach((card, i) => {
      if (!card.classList.contains('reveal')) {
        card.classList.add('reveal');
        card.style.transitionDelay = (i * 0.08) + 's';
      }
    });
    const io3 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io3.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    cards.forEach(card => io3.observe(card));
  });

  /* ── HERO PARALLAX (subtle) ── */
  const heroEl = document.querySelector('.solar-hero, .hero-split, .services-hero, .pricing-hero, .contact-hero, .results-hero, .industries-hero');
  if (heroEl) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroEl.style.backgroundPositionY = (y * 0.3) + 'px';
    }, { passive: true });
  }

  /* ── TYPING ANIMATION for hero headline ── */
  const typeTarget = document.querySelector('[data-type]');
  if (typeTarget) {
    const words  = typeTarget.dataset.type.split('|');
    let wi = 0, ci = 0, deleting = false;
    const tick = () => {
      const word    = words[wi];
      const current = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
      typeTarget.textContent = current;
      let delay = deleting ? 60 : 100;
      if (!deleting && ci > word.length) { delay = 1800; deleting = true; }
      if (deleting && ci < 0)            { deleting = false; wi = (wi + 1) % words.length; ci = 0; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 600);
  }

  /* ── SMOOTH SCROLL for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── BACK TO TOP BUTTON ── */
  const btt = document.createElement('button');
  btt.id            = 'back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML     = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btt);
  window.addEventListener('scroll', () => {
    btt.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── DROPDOWN NAV ── */
  document.querySelectorAll('.nav-drop-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const item   = btn.closest('.has-dropdown');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.has-dropdown').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.has-dropdown').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.nav-drop-btn')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.querySelectorAll('.mobile-drop-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const group  = btn.closest('.mobile-drop-group');
      const isOpen = group.classList.contains('open');
      document.querySelectorAll('.mobile-drop-group').forEach(g => g.classList.remove('open'));
      if (!isOpen) group.classList.add('open');
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });

})();
