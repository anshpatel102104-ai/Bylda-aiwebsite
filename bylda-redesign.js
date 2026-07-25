/* ══════════════════════════════════════════════════════════════════════
   BYLDA · REDESIGN JS  ·  "BYLDA BUSINESS"
   Global motion layer: scroll reveals, pop-ins, scroll progress,
   back-to-top, and the BYLDA BUSINESS motto — on every page.
   Safe & idempotent: guards against double-init and respects
   reduced-motion. No external dependencies.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.__byldaRedesign) return;
  window.__byldaRedesign = true;

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    injectMotto();
    buildChrome();
    setupReveals();
  });

  /* ── BYLDA BUSINESS motto under every logo ── */
  function injectMotto() {
    var logos = document.querySelectorAll('.logo, a.logo, .brand, .nav-logo');
    logos.forEach(function (logo) {
      if (logo.querySelector('.by-motto')) return;
      // Only add to the primary top-nav / footer logo lockups
      var m = document.createElement('span');
      m.className = 'by-motto';
      m.textContent = 'BYLDA BUSINESS';
      logo.appendChild(m);
    });
    // Fallback: if no logo found, don't force anything.
  }

  /* ── Scroll progress bar + back-to-top button ── */
  function buildChrome() {
    if (!document.getElementById('by-progress')) {
      var bar = document.createElement('div');
      bar.id = 'by-progress';
      document.body.appendChild(bar);
      var onScroll = function () {
        var h = document.documentElement;
        var scrolled = h.scrollTop || document.body.scrollTop;
        var max = (h.scrollHeight - h.clientHeight) || 1;
        bar.style.width = (scrolled / max * 100) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (!document.getElementById('by-top')) {
      var btn = document.createElement('button');
      btn.id = 'by-top';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
      document.body.appendChild(btn);
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
      window.addEventListener('scroll', function () {
        if ((window.scrollY || 0) > 600) btn.classList.add('show');
        else btn.classList.remove('show');
      }, { passive: true });
    }
  }

  /* ── Scroll reveals + staggered pop-ins ── */
  function setupReveals() {
    // Candidate blocks to reveal. Skip tiny/inline or already-handled nodes.
    var selector = [
      'section', '.sec', '.card', '.step', '.type', '.quote', '.w', '.ritem',
      '.tier', '.plan', '.pricing-card', '.feature', '.value-card', '.benefit',
      '.faq-item', '.testimonial', '.stat', '.metric', '.integration',
      '.sec-head', '.hero-copy', '.mock-col', '.loop-wrap', '.final',
      'article', '.post', '.blog-card', 'h2', 'h3', '.grid > *', '.row > *'
    ].join(',');

    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    var seen = new Set();
    var directions = ['', 'by-left', 'by-right', 'by-zoom'];
    var i = 0;

    nodes.forEach(function (el) {
      if (seen.has(el)) return;
      if (el.closest('header.nav, .nav, footer.ft')) return;
      if (el.classList.contains('reveal')) return; // page already animates it
      // avoid nesting reveal-in-reveal for very small text nodes inside cards
      if (el.parentElement && el.parentElement.closest('.by-reveal') &&
          (el.tagName === 'H2' || el.tagName === 'H3')) return;
      seen.add(el);
      el.classList.add('by-reveal');
      // gentle variety in entrance direction for "super cool" feel
      var dir = directions[i % 4];
      if (dir) el.classList.add(dir);
      i++;
    });

    var targets = Array.prototype.slice.call(
      document.querySelectorAll('.by-reveal, .reveal')
    );

    // Common "revealed" trigger class names used by hand-rolled reveal
    // systems across these pages. We only apply the broad set to elements
    // that were authored as `.reveal` (explicit reveal targets), so we
    // never accidentally toggle a component state elsewhere.
    var VIS = ['in', 'is-visible', 'visible', 'revealed', 'show', 'shown',
      'in-view', 'inview', 'aos-animate'];
    function reveal(el) {
      el.classList.add('by-in');
      el.classList.add('in');
      if (el.classList.contains('reveal')) {
        for (var k = 0; k < VIS.length; k++) el.classList.add(VIS[k]);
      }
    }

    // Reduced motion or no IO support → show everything immediately.
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) { io.observe(el); });

    // Reveal anything currently in (or near) the viewport — covers cases where
    // the observer's first callback is delayed or the page is short.
    function revealInView() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      targets.forEach(function (el) {
        if (el.classList.contains('by-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh + 240 && r.bottom > -240) reveal(el);
      });
    }
    revealInView();
    requestAnimationFrame(revealInView);
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('load', revealInView);

    // Hard safety net: never leave content invisible. If anything is still
    // hidden shortly after load, force it visible.
    setTimeout(function () { targets.forEach(reveal); }, 1600);
  }
})();
