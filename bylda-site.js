/* ════════════════════════════════════════════════════════════════
   bylda-site.js — Bylda Global Site Script
   ════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Cursor Glow ─────────────────────────────────────────────── */
  const cursor = document.getElementById('cursor-glow');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    document.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
    });
  }

  /* ─── Scroll Progress Bar ──────────────────────────────────────── */
  const bar = document.querySelector('.scroll-progress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const s = document.documentElement.scrollTop || document.body.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (h > 0 ? (s / h) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ─── Nav scroll class ────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Dropdown menus ──────────────────────────────────────────── */
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    if (dd.dataset.ddBound) return; dd.dataset.ddBound = '1';
    const trigger = dd.querySelector('.nav-dropdown-trigger');
    const menu    = dd.querySelector('.nav-dropdown-menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dd.classList.contains('open');
      // Close all
      document.querySelectorAll('.nav-dropdown.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        dd.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(o => {
      o.classList.remove('open');
      const t = o.querySelector('.nav-dropdown-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-dropdown.open').forEach(o => {
        o.classList.remove('open');
        const t = o.querySelector('.nav-dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && mobileMenu.classList.contains('open')) closeMobile();
    }
  });

  /* ─── Mobile Menu ─────────────────────────────────────────────── */
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu   = document.getElementById('mobile-menu');

  function openMobile() {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileToggle.classList.add('active');
    mobileToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMobile() : openMobile();
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));
  }

  /* ─── Scroll Reveal ───────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-child');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ─── FAQ Accordion ───────────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Optionally close others
      document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ─── Active nav link ─────────────────────────────────────────── */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link, .nav-dropdown-item').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href && href !== '/' && currentPath.startsWith(href.replace(/\/$/, ''))) {
      link.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    }
  });

})();
