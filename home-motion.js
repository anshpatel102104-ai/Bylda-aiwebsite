/* ══════════════════════════════════════════════════════════════════════
   BYLDA · HOMEPAGE MOTION CONTROLLER
   Pairs with home-motion.css. Loaded last so it can layer on top of the
   global reveal system in bylda-redesign.js without fighting it.

   Everything here is decorative. Under prefers-reduced-motion only the
   static, non-animated setup runs; on touch / narrow screens the
   pointer-driven effects (tilt, spotlight, magnetic buttons, parallax)
   are skipped so scrolling stays cheap.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__byldaHomeMotion) return;
  window.__byldaHomeMotion = true;

  var mq = window.matchMedia ? window.matchMedia.bind(window) : null;
  var reduce = mq ? mq('(prefers-reduced-motion: reduce)').matches : false;
  var fine = mq ? mq('(hover: hover) and (pointer: fine)').matches : true;
  var wide = function () { return window.innerWidth > 960; };
  var timers = [];

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function every(ms, fn) { timers.push(setInterval(fn, ms)); }

  /* Pause the looping "live" timers while the tab is hidden. */
  function suspendable(start, stop) {
    start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }

  ready(function () {
    document.documentElement.classList.add('hm-on');

    splitHeadings();
    splitStars();
    observeReveals();
    roadmapDraw();

    if (reduce) return;

    liveMockup();
    loopAccents();
    scrollCue();

    if (fine && wide()) {
      mockTilt();
      cardSpotlight();
      magneticButtons();
      heroParallax();
    }
  });

  /* ══════════════ Headlines: reveal word by word ══════════════
     Text nodes become individually delayed spans. Gradient spans
     (.g) are kept whole — background-clip:text breaks if their glyphs
     are split across transformed children. */
  function splitHeadings() {
    var heads = document.querySelectorAll('.sec-head h2, .final h2');
    Array.prototype.forEach.call(heads, function (h) {
      if (h.getAttribute('data-hm-split')) return;
      h.setAttribute('data-hm-split', '1');

      var i = 0;
      (function walk(parent) {
        Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
          if (node.nodeType === 3) {
            if (!node.textContent.trim()) return;
            var frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              var s = document.createElement('span');
              s.className = 'hm-w';
              s.style.setProperty('--hm-i', i++);
              s.textContent = part;
              frag.appendChild(s);
            });
            parent.replaceChild(frag, node);
          } else if (node.nodeType === 1) {
            if (node.tagName === 'BR') return;
            if (node.classList.contains('g')) {
              node.classList.add('hm-w');
              node.style.setProperty('--hm-i', i++);
              return;
            }
            walk(node);
          }
        });
      })(h);
    });
  }

  /* ══════════════ Testimonial stars pop in one at a time ══════════════ */
  function splitStars() {
    Array.prototype.forEach.call(document.querySelectorAll('.stars'), function (el) {
      if (el.getAttribute('data-hm-split')) return;
      el.setAttribute('data-hm-split', '1');
      var chars = el.textContent.trim().split('');
      if (!chars.length) return;
      el.setAttribute('aria-label', chars.length + ' out of 5 stars');
      el.textContent = '';
      chars.forEach(function (c, i) {
        var s = document.createElement('span');
        s.className = 'hm-star';
        s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--hm-i', i);
        s.textContent = c;
        el.appendChild(s);
      });
    });
  }

  /* ══════════════ Our own in-view trigger ══════════════
     The shared reveal layer owns .in / .by-in; we keep a separate
     .hm-go so word and star staggers can't be toggled by anything else. */
  function observeReveals() {
    var targets = document.querySelectorAll('.sec-head, .final, .quote');

    function go(el) { el.classList.add('hm-go'); }

    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, go);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { go(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });

    /* Safety net: never leave a headline invisible. */
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.hm-w, .hm-star'), function (el) {
        var host = el.closest('.sec-head, .final, .quote');
        if (host && !host.classList.contains('hm-go')) return; // simply not scrolled to yet
        el.classList.add('hm-shown');
      });
    }, 2600);
  }

  /* ══════════════ Roadmap timeline draws down on scroll ══════════════ */
  function roadmapDraw() {
    var road = document.querySelector('.road');
    if (!road) return;

    if (reduce || !('IntersectionObserver' in window)) {
      road.classList.add('hm-drawn');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { road.classList.add('hm-drawn'); io.disconnect(); }
      });
    }, { threshold: 0.2 });
    io.observe(road);
  }

  /* ══════════════ The hero mockup runs a live demo loop ══════════════ */
  function liveMockup() {
    /* The homepage opener is `.lede`; other pages still use `.hero`. */
    var mock = document.querySelector('.lede .mock, .hero .mock');
    if (!mock) return;

    var sides = mock.querySelectorAll('.side .s');
    var steps = mock.querySelectorAll('.steps .st');
    var bars = mock.querySelectorAll('.chart b');
    var val = mock.querySelector('.flt .val');

    /* — sidebar focus walks down the nav — */
    if (sides.length) {
      var si = 0;
      var sideTimer = null;
      suspendable(function () {
        if (sideTimer) return;
        sideTimer = setInterval(function () {
          si = (si + 1) % sides.length;
          Array.prototype.forEach.call(sides, function (s, j) {
            s.classList.toggle('on', j === si);
          });
        }, 2400);
        timers.push(sideTimer);
      }, function () { clearInterval(sideTimer); sideTimer = null; });
    }

    /* — the checklist keeps completing itself — */
    if (steps.length) {
      var at = 2; // matches the markup's starting state
      var stepTimer = null;
      var paint = function () {
        Array.prototype.forEach.call(steps, function (s, j) {
          var wasNow = s.classList.contains('now');
          s.classList.toggle('done', j < at);
          s.classList.toggle('now', j === at);
          s.classList.toggle('todo', j > at);
          var ck = s.querySelector('.ck');
          if (ck) ck.textContent = j < at ? '✓' : (j === at ? '→' : '');
          if (wasNow && j < at) {
            s.classList.add('hm-just-done');
            setTimeout(function () { s.classList.remove('hm-just-done'); }, 800);
          }
        });
      };
      suspendable(function () {
        if (stepTimer) return;
        stepTimer = setInterval(function () {
          at = at >= steps.length - 1 ? 2 : at + 1;
          paint();
        }, 3800);
        timers.push(stepTimer);
      }, function () { clearInterval(stepTimer); stepTimer = null; });
    }

    /* — the chart keeps receiving fresh numbers — */
    if (bars.length) {
      var base = Array.prototype.map.call(bars, function (b) {
        return parseFloat(b.style.height) || 50;
      });
      var chartTimer = null;
      suspendable(function () {
        if (chartTimer) return;
        chartTimer = setInterval(function () {
          Array.prototype.forEach.call(bars, function (b, j) {
            var h = Math.max(18, Math.min(100, base[j] + (Math.random() * 12 - 6)));
            b.style.height = h.toFixed(1) + '%';
          });
        }, 3200);
        timers.push(chartTimer);
      }, function () { clearInterval(chartTimer); chartTimer = null; });
    }

    /* — revenue counts up when the hero is on screen, then ticks a few
         times so the number feels live without running away — */
    if (val) {
      var raw = val.textContent;
      var target = parseInt(raw.replace(/[^\d]/g, ''), 10) || 0;
      var suffix = raw.replace(/^[^\d]*[\d,]+/, '');
      var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US') + suffix; };
      var current = target;

      countUp(val, target, 1500, fmt);

      var ticks = 0;
      var revTimer = setInterval(function () {
        if (++ticks > 8) { clearInterval(revTimer); return; }
        if (document.hidden) return;
        current += 20 + Math.floor(Math.random() * 70);
        val.textContent = fmt(current);
        val.classList.add('hm-bump');
        setTimeout(function () { val.classList.remove('hm-bump'); }, 600);
      }, 4600);
      timers.push(revTimer);
    }
  }

  function countUp(el, target, duration, fmt) {
    var start = null;
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      el.textContent = fmt(target * ease(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ══════════════ Closed-loop ring: comet, ripples, core crossfade ══════════════ */
  function loopAccents() {
    var loop = document.getElementById('loop-ring');
    if (!loop) return;

    if (!loop.querySelector('.hm-orbit')) {
      var orbit = document.createElement('div');
      orbit.className = 'hm-orbit';
      orbit.setAttribute('aria-hidden', 'true');
      orbit.innerHTML = '<span class="hm-comet"></span>';
      loop.appendChild(orbit);

      ['hm-ripple', 'hm-ripple hm-r2'].forEach(function (cls) {
        var r = document.createElement('div');
        r.className = cls;
        r.setAttribute('aria-hidden', 'true');
        loop.insertBefore(r, loop.firstChild);
      });
    }

    /* The stage copy is swapped by the page's own script; watch it and
       replay a short crossfade whenever it changes. */
    var core = loop.querySelector('.core');
    var title = document.getElementById('core-t');
    if (!core || !title || !('MutationObserver' in window)) return;

    var mo = new MutationObserver(function () {
      core.classList.remove('hm-flip');
      void core.offsetWidth; // restart the animation
      core.classList.add('hm-flip');
    });
    mo.observe(title, { childList: true, characterData: true, subtree: true });
  }

  /* ══════════════ Scroll cue under the hero ══════════════ */
  function scrollCue() {
    var hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hm-cue')) return;

    var cue = document.createElement('div');
    cue.className = 'hm-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<span class="hm-cue-track"></span><span>Scroll</span>';
    hero.appendChild(cue);

    var hidden = false;
    window.addEventListener('scroll', function () {
      var past = (window.scrollY || 0) > 160;
      if (past === hidden) return;
      hidden = past;
      cue.classList.toggle('hm-hide', past);
    }, { passive: true });
  }

  /* ══════════════ 3D tilt on the product mockup ══════════════
     The mock itself owns a float animation, so the tilt goes on a
     wrapper to keep the two transforms from clobbering each other. */
  function mockTilt() {
    var col = document.querySelector('.hero .mock-col');
    var mock = col && col.querySelector('.mock');
    if (!col || !mock) return;

    var wrap = document.createElement('div');
    wrap.className = 'hm-tilt';
    mock.parentNode.insertBefore(wrap, mock);
    wrap.appendChild(mock);

    var frame = null, rx = 0, ry = 0;
    var apply = function () {
      frame = null;
      wrap.style.transform = 'perspective(1100px) rotateX(' + rx.toFixed(2) +
        'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    };

    col.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = col.getBoundingClientRect();
      ry = ((e.clientX - r.left) / r.width - 0.5) * 11;
      rx = (0.5 - (e.clientY - r.top) / r.height) * 8;
      if (!frame) frame = requestAnimationFrame(apply);
    });

    col.addEventListener('pointerleave', function () {
      rx = ry = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    });
  }

  /* ══════════════ Cursor spotlight across cards ══════════════ */
  function cardSpotlight() {
    var cards = document.querySelectorAll(
      '.bento .card, .steps3 .step, .types .type, .tgrid .quote, .why .w'
    );
    Array.prototype.forEach.call(cards, function (card) {
      card.classList.add('hm-spot');
      var frame = null, x = 50, y = 50;
      var apply = function () {
        frame = null;
        card.style.setProperty('--hm-x', x + '%');
        card.style.setProperty('--hm-y', y + '%');
      };
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = card.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width) * 100;
        y = ((e.clientY - r.top) / r.height) * 100;
        if (!frame) frame = requestAnimationFrame(apply);
      });
    });
  }

  /* ══════════════ Magnetic primary CTAs ══════════════
     The shared layer sets `transform: translateY(-2px) !important` on
     :hover, so the pull has to be written as an important inline style. */
  function magneticButtons() {
    var btns = document.querySelectorAll('.hero-cta .btn, .final .cta .btn');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.classList.add('hm-magnet');
      var frame = null, tx = 0, ty = 0;

      var apply = function () {
        frame = null;
        btn.style.setProperty(
          'transform',
          'translate(' + tx.toFixed(1) + 'px,' + (ty - 2).toFixed(1) + 'px)',
          'important'
        );
      };

      btn.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = btn.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 16;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 10;
        btn.classList.add('hm-pulling');
        if (!frame) frame = requestAnimationFrame(apply);
      });

      btn.addEventListener('pointerleave', function () {
        btn.classList.remove('hm-pulling');
        btn.style.removeProperty('transform');
        tx = ty = 0;
      });
    });
  }

  /* ══════════════ Hero parallax ══════════════ */
  function heroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var copy = hero.querySelector('.hero-copy');
    var col = hero.querySelector('.mock-col');
    var grid = hero.querySelector('.blueprint');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || 0;
      if (y > hero.offsetHeight) return; // past the hero, nothing to move
      if (copy) copy.style.setProperty('transform', 'translate3d(0,' + (y * 0.07).toFixed(1) + 'px,0)', 'important');
      if (col) col.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
      if (grid) grid.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }
})();
