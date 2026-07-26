/* ══════════════════════════════════════════════════════════════════
   nav-home.js — behaviour for the shared homepage-style top bar.

   Guarded with a data flag: several pages already load other nav scripts,
   and two click bindings on the same toggle cancel each other out (each
   flips the class, so an even number of handlers is a no-op). This binds
   at most once per element regardless of how many times it is included.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    var nav = document.getElementById('nav');
    if (nav && !nav.dataset.navHomeBound) {
      nav.dataset.navHomeBound = '1';
      var onScroll = function () {
        nav.classList.toggle('scrolled', window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    var burger = document.getElementById('burger');
    var mobile = document.getElementById('mobile');
    if (!burger || !mobile || burger.dataset.navHomeBound) return;
    burger.dataset.navHomeBound = '1';

    function close() {
      mobile.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }

    burger.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobile.classList.contains('open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
