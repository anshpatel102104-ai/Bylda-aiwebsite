/* ══════════════════════════════════════════════════════════════════════
   BYLDA · HOMEPAGE HERO — behaviour
   Pairs with hero-lede.css. Self-contained: it only touches nodes inside
   `.lede`, so it cannot disturb the shared motion layer running alongside.

   Everything here is decorative. Under prefers-reduced-motion the words
   are shown immediately and no pointer or scroll handlers are attached;
   on touch / coarse pointers the tilt is skipped.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__byldaLede) return;
  window.__byldaLede = true;

  var mq = window.matchMedia ? window.matchMedia.bind(window) : null;
  var reduce = mq ? mq('(prefers-reduced-motion: reduce)').matches : false;
  var fine = mq ? mq('(hover: hover) and (pointer: fine)').matches : true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var lede = document.querySelector('.lede');
    if (!lede) return;

    splitHeadline(lede);
    demo(lede);

    if (reduce) return;

    cue(lede);
    if (fine) tilt(lede);
  });

  /* ══════════════ Headline reveals word by word ══════════════
     Text nodes are split into individually delayed spans. A gradient
     span (.g) is wrapped whole instead of per-word: background-clip:text
     paints across the element box, so splitting it into separately
     transformed children tears the gradient apart. */
  function splitHeadline(lede) {
    var h = lede.querySelector('h1');
    if (!h || h.getAttribute('data-ld-split')) return;
    h.setAttribute('data-ld-split', '1');

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
            var w = document.createElement('span');
            w.className = 'ld-w';
            w.style.setProperty('--ld-i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          parent.replaceChild(frag, node);
          return;
        }

        if (node.nodeType !== 1) return;

        if (node.classList && node.classList.contains('g')) {
          node.classList.add('ld-w');
          node.style.setProperty('--ld-i', i++);
          return;
        }

        walk(node);
      });
    })(h);

    if (reduce) {
      Array.prototype.forEach.call(h.querySelectorAll('.ld-w'), function (w) {
        w.classList.add('ld-shown');
      });
      return;
    }

    /* Above the fold on load — start it on the next frame rather than
       waiting for an observer that would fire immediately anyway. */
    requestAnimationFrame(function () { h.classList.add('ld-go'); });

    /* Safety net: if an animation never runs (older engines, a throttled
       background tab at load), don't leave the headline invisible. */
    setTimeout(function () {
      Array.prototype.forEach.call(h.querySelectorAll('.ld-w'), function (w) {
        if (!w.getClientRects().length || getComputedStyle(w).opacity === '0') {
          w.classList.add('ld-shown');
        }
      });
    }, 2600);
  }

  /* ══════════════ Product demo sequencer ══════════════
     Types the idea into the prompt, walks the seven steps, then settles
     into the dashboard (~10.5s). All state is CSS classes; the only
     inline mutation is the counters' text. Under reduced motion the
     finished dashboard renders immediately and nothing runs. */
  function demo(lede) {
    var win = lede.querySelector('.ldm');
    if (!win) return;

    var txEl = win.querySelector('#ldm-tx');
    var steps = win.querySelectorAll('.ldm-steps li');
    var PROMPT = 'I want to start a meal-prep business for busy professionals.';
    var timers = [];

    if (reduce) {
      txEl.textContent = PROMPT;
      win.classList.add('done');
      /* No sequence to replay, but the secondary CTA should still take
         the user to the demo (with no smooth-scroll motion). */
      var w = document.getElementById('watch-bylda');
      if (w) w.addEventListener('click', function () {
        win.scrollIntoView({ block: 'center' });
      });
      return;
    }

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function count(el, target, ms) {
      var t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / ms);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function run() {
      timers.forEach(clearTimeout);
      timers = [];
      win.classList.remove('done');
      txEl.textContent = '';
      Array.prototype.forEach.call(steps, function (li) {
        li.classList.remove('on', 'ok');
        var c = li.querySelector('.ct');
        if (c) c.textContent = '0';
      });

      /* 0 – 2.2s: the idea types in. */
      win.classList.add('typing');
      var perChar = 2000 / PROMPT.length;
      PROMPT.split('').forEach(function (ch, i) {
        at(200 + i * perChar, function () { txEl.textContent += ch; });
      });
      at(2450, function () { win.classList.remove('typing'); });

      /* 2.6s on: each step works for ~.95s, then checks off. */
      Array.prototype.forEach.call(steps, function (li, i) {
        var t = 2600 + i * 1050;
        at(t, function () {
          li.classList.add('on');
          var c = li.querySelector('.ct');
          if (c) count(c, parseInt(c.getAttribute('data-n'), 10), 850);
        });
        at(t + 950, function () {
          li.classList.remove('on');
          li.classList.add('ok');
        });
      });

      /* ~10.4s: settle into the dashboard. */
      at(2600 + steps.length * 1050 + 500, function () {
        win.classList.add('done');
      });
    }

    /* Start once the window is actually on screen (it is above the fold
       on desktop, but on mobile it sits below the copy). */
    if ('IntersectionObserver' in window) {
      var started = false;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; io.disconnect(); run(); }
        });
      }, { threshold: 0.35 });
      io.observe(win);
    } else {
      at(500, run);
    }

    var replay = win.querySelector('#ldm-replay');
    if (replay) replay.addEventListener('click', run);

    /* "Watch Bylda Work": bring the demo into view and play it again. */
    var watch = document.getElementById('watch-bylda');
    if (watch) watch.addEventListener('click', function () {
      var r = win.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        win.scrollIntoView({ behavior: 'smooth', block: 'center' });
        at(450, run);
      } else {
        run();
      }
    });
  }

  /* ══════════════ Scroll cue fades out on first scroll ══════════════ */
  function cue(lede) {
    var el = lede.querySelector('.lede-cue');
    if (!el) return;

    var ticking = false;
    function check() {
      ticking = false;
      el.classList.toggle('ld-hide', (window.scrollY || 0) > 120);
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    }, { passive: true });
  }

  /* ══════════════ Product mock tilts toward the cursor ══════════════
     The rotation is written to the .lede-tilt wrapper, never to .mock
     itself — .mock carries a float animation from bylda-redesign.css and
     the two transforms would overwrite each other. */
  function tilt(lede) {
    var stage = lede.querySelector('.lede-stage');
    var el = lede.querySelector('.lede-tilt');
    if (!stage || !el) return;

    var MAX = 7;               /* degrees; past ~8 the mock text skews badly */
    var frame = null, rx = 0, ry = 0;

    function apply() {
      frame = null;
      el.style.setProperty('--ld-rx', rx.toFixed(2) + 'deg');
      el.style.setProperty('--ld-ry', ry.toFixed(2) + 'deg');
    }
    function queue() { if (!frame) frame = requestAnimationFrame(apply); }

    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      ry = (((e.clientX - r.left) / r.width) - 0.5) * 2 * MAX;
      rx = -((((e.clientY - r.top) / r.height) - 0.5) * 2 * MAX);
      queue();
    });

    stage.addEventListener('pointerleave', function () {
      rx = 0; ry = 0; queue();
    });
  }
})();
