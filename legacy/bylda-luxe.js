/* ══════════════════════════════════════════════════════════════════════════
   BYLDA — LUXE MOTION ENGINE
   Cinematic page entrance · richer scroll reveals · magnetic buttons ·
   3D tilt cards · spotlight cursor · scroll progress · count-ups · shimmer.

   Designed to LAYER on top of the existing motion system without fighting it:
   it never re-hides elements already owned by .by-reveal / .reveal, and it
   degrades to fully-visible content if anything fails.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Mark the document so the luxe CSS "hidden" states activate.
  docEl.classList.add('luxe');

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
  }

  /* ─────────────────────────────────────────────────────────────
     1 · CINEMATIC PAGE ENTRANCE
     ───────────────────────────────────────────────────────────── */
  function entrance() {
    // Tag the first hero-like block so its children cascade in.
    var hero = document.querySelector(
      '[data-lux-hero], .hero, header .hero, section.hero, .hero-lede, #hero, .hero-inner'
    );
    if (hero && !hero.hasAttribute('data-lux-hero')) hero.setAttribute('data-lux-hero', '');

    if (reduce) { docEl.classList.add('luxe-entered'); return; }

    // Build the silk veil overlay.
    var veil = document.createElement('div');
    veil.id = 'lux-veil';
    (document.body || docEl).appendChild(veil);

    var lift = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { docEl.classList.add('luxe-entered'); });
      });
      // Remove the veil node once its transition is done.
      setTimeout(function () { if (veil && veil.parentNode) veil.parentNode.removeChild(veil); }, 1500);
    };

    if (document.readyState === 'complete') { setTimeout(lift, 120); }
    else { window.addEventListener('load', function () { setTimeout(lift, 120); }); }
    // Safety: never trap the page behind the veil.
    setTimeout(lift, 2200);
  }

  /* ─────────────────────────────────────────────────────────────
     2 · SUPPLEMENTAL SCROLL REVEALS + STAGGER
     Auto-tag content blocks the base layer didn't claim.
     ───────────────────────────────────────────────────────────── */
  var OWNED = ['by-reveal', 'reveal', 'in-view', 'lux-reveal'];
  function isOwned(el) {
    for (var i = 0; i < OWNED.length; i++) if (el.classList.contains(OWNED[i])) return true;
    return false;
  }

  function tagReveals() {
    var sel = [
      'section > .wrap > *', 'section > .container > *',
      '.grid > *', '.cards > *', '.row > *',
      'h2', 'h3', '.feature', '.card', '.tier', '.plan', '.step',
      '.stat', '.value', '.metric', '.testimonial', '.faq-item', '.service',
      'figure', 'blockquote', '.eyebrow', '.section-head', '.cta'
    ].join(',');

    var nodes = Array.prototype.slice.call(document.querySelectorAll(sel));
    nodes.forEach(function (el) {
      if (isOwned(el)) return;
      if (el.closest('[data-no-reveal],[data-no-lux],nav,header.nav,.nav,footer .legal')) return;
      if (el.hasAttribute('data-lux-hero') || el.closest('[data-lux-hero]')) return;
      // skip elements already inside a luxe/base reveal to avoid double-hiding
      if (el.closest('.by-reveal, .lux-reveal, .reveal')) return;
      var r = el.getBoundingClientRect();
      if (r.height === 0 && r.width === 0) return; // hidden/inline
      el.classList.add('lux-reveal');
      // A grid/list container gets staggered children instead of moving as one.
      if (el.children.length >= 3 &&
          (el.classList.contains('grid') || el.classList.contains('cards') ||
           el.classList.contains('row'))) {
        el.classList.add('lux-stagger');
      }
    });
  }

  function observeReveals() {
    var targets = Array.prototype.slice.call(document.querySelectorAll('.lux-reveal'));
    if (!targets.length) return;

    function show(el) { el.classList.add('lux-in'); }

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(show); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) show(el); // already in view
      else io.observe(el);
    });
    // Safety net: reveal everything after a while no matter what.
    setTimeout(function () { targets.forEach(show); }, 2600);
  }

  /* ─────────────────────────────────────────────────────────────
     3 · MAGNETIC BUTTONS
     ───────────────────────────────────────────────────────────── */
  function magnetize() {
    if (!fine || reduce) return;
    var els = document.querySelectorAll('.btn-primary, .btn.btn-primary, [data-lux-magnetic]');
    els.forEach(function (el) {
      if (el.hasAttribute('data-lux-mag-init')) return;
      el.setAttribute('data-lux-mag-init', '1');
      el.setAttribute('data-lux-magnetic', '');
      var strength = 0.35;
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var mx = (ev.clientX - (r.left + r.width / 2)) * strength;
        var my = (ev.clientY - (r.top + r.height / 2)) * strength;
        el.style.setProperty('--mx', mx.toFixed(1) + 'px');
        el.style.setProperty('--my', my.toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     4 · 3D TILT CARDS
     ───────────────────────────────────────────────────────────── */
  function tiltify() {
    if (!fine || reduce) return;
    var els = document.querySelectorAll(
      '.tier, .plan, .feature, .value, .metric, .testimonial, .card, [data-lux-tilt]'
    );
    els.forEach(function (el) {
      if (el.hasAttribute('data-lux-tilt-init')) return;
      // Skip oversized panels / hero mocks — tilt reads best on compact cards.
      var r0 = el.getBoundingClientRect();
      if (r0.height > 560 || r0.width > 620) return;
      if (el.closest('.hero, .mock, [data-lux-hero]') && !el.hasAttribute('data-lux-tilt')) return;
      el.setAttribute('data-lux-tilt-init', '1');
      el.setAttribute('data-lux-tilt', '');
      var max = 7;
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * max).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     5 · SPOTLIGHT CURSOR
     ───────────────────────────────────────────────────────────── */
  function spotlight() {
    if (!fine || reduce) return;
    var spot = document.createElement('div');
    spot.id = 'lux-spot';
    (document.body || docEl).appendChild(spot);
    var x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, raf;
    function loop() {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      spot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('pointermove', function (ev) {
      tx = ev.clientX; ty = ev.clientY;
      if (!docEl.classList.contains('lux-pointer')) docEl.classList.add('lux-pointer');
      if (!raf) loop();
    }, { passive: true });
    window.addEventListener('pointerleave', function () { docEl.classList.remove('lux-pointer'); });
  }

  /* ─────────────────────────────────────────────────────────────
     6 · SCROLL PROGRESS (only if the base #by-progress isn't present)
     ───────────────────────────────────────────────────────────── */
  function progress() {
    if (document.getElementById('by-progress')) return; // base layer already has one
    var bar = document.createElement('div');
    bar.id = 'lux-progress';
    (document.body || docEl).appendChild(bar);
    function upd() {
      var h = document.documentElement;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      var p = Math.min(1, Math.max(0, (h.scrollTop || window.pageYOffset) / max));
      bar.style.width = (p * 100).toFixed(2) + '%';
    }
    upd();
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
  }

  /* ─────────────────────────────────────────────────────────────
     7 · COUNT-UP NUMBERS
     Auto-detect stat-like numbers, or honour data-lux-count.
     ───────────────────────────────────────────────────────────── */
  function counters() {
    if (reduce || !('IntersectionObserver' in window)) return;
    // Auto-tag obvious stat numbers.
    var cands = document.querySelectorAll(
      '.stat .num, .stat-num, .metric .num, [data-count], [data-lux-count], .value .num'
    );
    var list = [];
    cands.forEach(function (el) {
      if (el.hasAttribute('data-lux-count-init')) return;
      var raw = (el.getAttribute('data-lux-count') || el.getAttribute('data-count') || el.textContent || '').trim();
      var m = raw.match(/^([^\d\-]*)(-?[\d,]*\.?\d+)(.*)$/);
      if (!m) return;
      var target = parseFloat(m[2].replace(/,/g, ''));
      if (!isFinite(target) || target === 0) return;
      el.setAttribute('data-lux-count-init', '1');
      list.push({ el: el, pre: m[1], target: target, post: m[3], raw: m[2] });
    });
    if (!list.length) return;

    var decimals = function (s) { var i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
    var group = function (n, d) {
      var parts = n.toFixed(d).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var item = list.filter(function (x) { return x.el === e.target; })[0];
        io.unobserve(e.target);
        if (!item) return;
        var d = decimals(item.raw), start = performance.now(), dur = 1400;
        var hadComma = item.raw.indexOf(',') >= 0;
        function frame(now) {
          var t = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          var val = item.target * eased;
          var txt = hadComma ? group(val, d) : val.toFixed(d);
          item.el.textContent = item.pre + txt + item.post;
          if (t < 1) requestAnimationFrame(frame);
          else item.el.textContent = item.pre + (hadComma ? group(item.target, d) : item.target.toFixed(d)) + item.post;
        }
        item.el.textContent = item.pre + (d ? (0).toFixed(d) : '0') + item.post;
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });
    list.forEach(function (x) { io.observe(x.el); });
  }

  /* ─────────────────────────────────────────────────────────────
     8 · SHIMMER + MEDIA hover tagging
     ───────────────────────────────────────────────────────────── */
  function accents() {
    // Big hero H1 gets a subtle animated gradient shimmer (once).
    var h1 = document.querySelector('[data-lux-hero] h1, .hero h1, section.hero h1');
    if (h1 && !h1.classList.contains('lux-shimmer') && !h1.querySelector('*')) {
      // only plain-text headings to avoid clobbering nested markup
      h1.classList.add('lux-shimmer');
    }
    // Image containers get the cinematic zoom-on-hover treatment.
    document.querySelectorAll('.card figure, .feature img, figure img, .lux-media').forEach(function (el) {
      var box = el.tagName === 'IMG' ? el.parentElement : el;
      if (box && !box.classList.contains('lux-media')) box.classList.add('lux-media');
    });
  }

  /* ─────────────────────────────────────────────────────────────
     RUN
     ───────────────────────────────────────────────────────────── */
  entrance();
  ready(function () {
    try { accents(); } catch (e) {}
    try { tagReveals(); } catch (e) {}
    try { observeReveals(); } catch (e) {}
    try { magnetize(); } catch (e) {}
    try { tiltify(); } catch (e) {}
    try { spotlight(); } catch (e) {}
    try { progress(); } catch (e) {}
    try { counters(); } catch (e) {}
  });
})();
