/* ══════════════════════════════════════════════════════════════
   bylda-motion.js — String Tune-inspired motion engine
   Dependency-free. Smooth scroll · scroll reveal · parallax ·
   char-wave headings · custom cursor · magnetic buttons · progress.
   One rAF loop drives everything. Guarded for reduced-motion,
   touch, and coarse pointers so it never breaks the page.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var html = document.documentElement;
    var auto = document.body.hasAttribute('data-motion');

    /* ── Drop-in mode: auto-create overlays + tag below-fold sections ──
       Lets any existing page opt in with just <body data-motion> plus the
       two asset tags — no per-element markup, no DOM restructuring. */
    if (auto) {
      ensureOverlays();
      autoReveal();
    }

    /* ── Split headings into lines/words for the wave reveal ── */
    splitHeadings();

    /* ── Reveal + stagger via IntersectionObserver ── */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-reveal],[data-stagger],[data-split],[data-line]').forEach(function (el) {
      io.observe(el);
    });
    // index children of staggered parents
    document.querySelectorAll('[data-stagger]').forEach(function (p) {
      Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); });
    });

    /* ── Reduced motion: reveals are handled by CSS; skip the engine ── */
    if (reduce) return;

    /* ── Collect parallax + magnetic targets ── */
    var parallax = [].slice.call(document.querySelectorAll('[data-parallax]'));
    var magnets = [].slice.call(document.querySelectorAll('[data-magnetic]'));

    /* ── Smooth scroll (virtual, lerp) ── */
    var container = document.querySelector('[data-scroll-container]');
    var smooth = !!container && !matchMedia('(pointer: coarse)').matches && innerWidth > 768;
    var scrollY = window.scrollY || 0, targetY = scrollY;

    function setBodyHeight() {
      if (smooth) document.body.style.height = container.getBoundingClientRect().height + 'px';
    }
    if (smooth) {
      html.classList.add('has-smooth');
      container.style.position = 'fixed';
      container.style.top = 0; container.style.left = 0; container.style.width = '100%';
      setBodyHeight();
      addEventListener('resize', setBodyHeight, { passive: true });
      // keep spacer in sync as fonts/images settle
      if (window.ResizeObserver) new ResizeObserver(setBodyHeight).observe(container);
      addEventListener('load', setBodyHeight);
      // smooth anchor jumps
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var t = document.querySelector(id);
          if (!t) return;
          ev.preventDefault();
          window.scrollTo({ top: t.offsetTop - 60, behavior: 'auto' });
        });
      });
    }

    /* ── Scroll progress bar ── */
    var bar = document.querySelector('.scroll-progress');

    /* ── Custom cursor ── */
    var dot, ring, cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
    if (finePointer) {
      dot = document.querySelector('.cursor-dot');
      ring = document.querySelector('.cursor-ring');
      if (dot && ring) {
        html.classList.add('has-cursor');
        addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
        addEventListener('mousedown', function () { ring.classList.add('down'); });
        addEventListener('mouseup', function () { ring.classList.remove('down'); });
        var hoverSel = 'a,button,[data-cursor],[data-magnetic],input,textarea';
        document.querySelectorAll(hoverSel).forEach(function (el) {
          el.addEventListener('mouseenter', function () { ring.classList.add('hover'); });
          el.addEventListener('mouseleave', function () { ring.classList.remove('hover'); });
        });
      } else { dot = ring = null; }
    }

    /* ── One rAF loop drives all motion ── */
    var mx = 0, my = 0; // pointer for magnetic (page coords)
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });

    function frame() {
      // smooth scroll
      if (smooth) {
        targetY = window.scrollY;
        scrollY = lerp(scrollY, targetY, 0.09);
        if (Math.abs(targetY - scrollY) < 0.05) scrollY = targetY;
        container.style.transform = 'translate3d(0,' + (-scrollY) + 'px,0)';
      } else {
        scrollY = window.scrollY;
      }

      // progress bar
      if (bar) {
        var max = (smooth ? container.getBoundingClientRect().height : document.body.scrollHeight) - innerHeight;
        bar.style.transform = 'scaleX(' + clamp(scrollY / (max || 1), 0, 1) + ')';
      }

      // parallax
      var vh = innerHeight;
      for (var i = 0; i < parallax.length; i++) {
        var el = parallax[i];
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        // element top in document coords
        var top = el.getAttribute('data-top');
        if (top === null || el.__t === undefined) { el.__t = offsetTopDoc(el, container, smooth); }
        var center = el.__t + el.offsetHeight / 2;
        var progress = (scrollY + vh / 2 - center) / (vh + el.offsetHeight); // ~ -0.5..0.5
        el.style.transform = 'translate3d(0,' + (progress * speed * -200) + 'px,0)';
      }

      // custom cursor lerp
      if (dot && ring) {
        rx = lerp(rx, cx, 0.18); ry = lerp(ry, cy, 0.18);
        dot.style.transform = 'translate3d(' + (cx - 3) + 'px,' + (cy - 3) + 'px,0)';
        ring.style.transform = 'translate3d(' + (rx - 17) + 'px,' + (ry - 17) + 'px,0)';
      }

      // magnetic buttons
      for (var m = 0; m < magnets.length; m++) {
        var b = magnets[m], r = b.getBoundingClientRect();
        var bxc = r.left + r.width / 2, byc = r.top + r.height / 2;
        var dx = mx - bxc, dy = my - byc;
        var dist = Math.hypot(dx, dy), radius = Math.max(r.width, r.height) * 0.9 + 40;
        if (dist < radius) {
          var pull = (1 - dist / radius) * 0.4;
          b.style.transform = 'translate(' + (dx * pull) + 'px,' + (dy * pull) + 'px)';
        } else {
          b.style.transform = 'translate(0,0)';
        }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // recompute cached tops after layout settles
    addEventListener('load', function () { parallax.forEach(function (el) { el.__t = undefined; }); });
    addEventListener('resize', function () { parallax.forEach(function (el) { el.__t = undefined; }); });
  }

  /* Create the cursor + progress overlays if a drop-in page didn't include them */
  function ensureOverlays() {
    if (!document.querySelector('.scroll-progress')) {
      add('div', 'scroll-progress');
    }
    if (matchMedia('(pointer: fine)').matches && !reduce) {
      if (!document.querySelector('.cursor-ring')) add('div', 'cursor-ring');
      if (!document.querySelector('.cursor-dot')) add('div', 'cursor-dot');
    }
    function add(tag, cls) {
      var el = document.createElement(tag); el.className = cls;
      el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
    }
  }

  /* Tag section-level blocks that start below the fold so they reveal on
     scroll. Above-fold content is left untouched — never hidden, no flash. */
  function autoReveal() {
    var vh = innerHeight;
    var blocks = document.querySelectorAll('section, .section, footer, [data-motion-reveal]');
    blocks.forEach(function (el) {
      if (el.hasAttribute('data-reveal') || el.hasAttribute('data-stagger')) return;
      var top = el.getBoundingClientRect().top;
      if (top > vh * 0.85) el.setAttribute('data-reveal', 'up');
    });
  }

  /* offsetTop relative to document (accounts for the fixed smooth wrapper) */
  function offsetTopDoc(el, container, smooth) {
    var y = 0, n = el;
    while (n && n !== document.body && n !== container) { y += n.offsetTop; n = n.offsetParent; }
    if (smooth && container) y += 0; // container is at top:0
    return y;
  }

  /* Wrap words of [data-split] headings in spans for the line-wave reveal */
  function splitHeadings() {
    document.querySelectorAll('[data-split]').forEach(function (h) {
      if (h.__split) return; h.__split = true;
      var nodes = [].slice.call(h.childNodes);
      h.textContent = '';
      var wi = { n: 0 };
      var line = newLine(h);
      nodes.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'BR') { line = newLine(h); return; }
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok.length) return;
            if (/^\s+$/.test(tok)) { line.appendChild(document.createTextNode(tok)); return; }
            line.appendChild(word(tok, wi));
          });
        } else if (node.nodeType === 1) {
          var s = word('', wi); s.appendChild(node); line.appendChild(s);
        }
      });
      h.classList.add('split-ready');
    });
    function newLine(h) { var l = document.createElement('span'); l.className = 'split-line'; h.appendChild(l); return l; }
    function word(t, wi) {
      var s = document.createElement('span'); s.className = 'split-w';
      s.style.setProperty('--wi', wi.n++); if (t) s.textContent = t; return s;
    }
  }
})();
