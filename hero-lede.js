/* ══════════════════════════════════════════════════════════════════════
   BYLDA · HOMEPAGE LEDE — behaviour
   Pairs with hero-lede.css. Self-contained: it only touches nodes inside
   `.lede`, so it cannot disturb the product hero or the shared motion
   layer running alongside it.

   Everything here is decorative. Under prefers-reduced-motion the words
   are shown immediately and no pointer or scroll handlers are attached;
   on touch / narrow screens the pointer effects are skipped.
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

    if (reduce) return;

    cue(lede);
    if (fine) spotlight(lede);
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

  /* ══════════════ Cursor spotlight on the capability cards ══════════════ */
  function spotlight(lede) {
    Array.prototype.forEach.call(lede.querySelectorAll('.lede-card'), function (card) {
      var frame = null, x = 50, y = 50;

      function apply() {
        frame = null;
        card.style.setProperty('--ld-x', x + '%');
        card.style.setProperty('--ld-y', y + '%');
      }

      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = card.getBoundingClientRect();
        x = ((e.clientX - r.left) / r.width) * 100;
        y = ((e.clientY - r.top) / r.height) * 100;
        if (!frame) frame = requestAnimationFrame(apply);
      });
    });
  }
})();
