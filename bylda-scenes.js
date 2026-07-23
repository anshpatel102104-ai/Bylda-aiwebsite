/* ════════════════════════════════════════════════════════════════
   BYLDA SCENES — scripted product-demo clips for the systems rows.
   Each system mockup plays like a short screen recording: a cursor
   moves and clicks, text types itself, cards get dragged. Scenes
   loop while their row is in view and reset when it leaves.
   No video files — everything is live DOM, so it stays crisp.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.ByldaScenes = { start: function () {}, stop: function () {} };
    return;
  }
  document.body.classList.add('js-clips');

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ── Scene runtime ─────────────────────────────────────────── */
  function Scene(visual, script) {
    this.visual = visual;
    this.script = script;
    this.token = 0;
    this.running = false;
    this._x = 0; this._y = 0;
  }

  Scene.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    var t = ++this.token;
    var self = this;
    (function loop() {
      if (!self.running || t !== self.token) return;
      Promise.resolve(self.script(self)).catch(function () {}).then(function () {
        if (!self.running || t !== self.token) return;
        setTimeout(loop, 1900);
      });
    })();
  };

  Scene.prototype.stop = function () {
    this.running = false;
    this.token++;
    this.hideCursor();
  };

  Scene.prototype.ok = function () { return this.running; };
  Scene.prototype.card = function () { return this.visual.querySelector('.showcase-card'); };

  Scene.prototype.cursorEl = function () {
    if (!this._cursor || !this._cursor.isConnected) {
      var c = document.createElement('div');
      c.className = 'demo-cursor';
      c.innerHTML = '<svg width="21" height="21" viewBox="0 0 24 24"><path d="M5.5 2.5 L19.5 12.2 L12.6 13.5 L9.2 20.6 Z" fill="#15151F" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      this.card().appendChild(c);
      this._cursor = c;
    }
    return this._cursor;
  };

  Scene.prototype.hideCursor = function () {
    if (this._cursor) this._cursor.style.opacity = '0';
  };

  Scene.prototype.moveTo = function (el, dur, ox, oy) {
    dur = dur || 700;
    ox = ox === undefined ? 0.5 : ox;
    oy = oy === undefined ? 0.5 : oy;
    var c = this.cursorEl();
    var cr = this.card().getBoundingClientRect();
    var r = el.getBoundingClientRect();
    this._x = r.left - cr.left + r.width * ox;
    this._y = r.top - cr.top + r.height * oy;
    c.style.opacity = '1';
    c.style.transition = 'transform ' + dur + 'ms cubic-bezier(0.45,0.05,0.25,1), opacity 250ms ease';
    c.style.transform = 'translate(' + this._x + 'px,' + this._y + 'px)';
    return wait(dur + 80);
  };

  Scene.prototype.click = function () {
    var self = this;
    var c = this.cursorEl();
    var ring = document.createElement('div');
    ring.className = 'demo-click';
    ring.style.transform = 'translate(' + this._x + 'px,' + this._y + 'px)';
    this.card().appendChild(ring);
    setTimeout(function () { ring.remove(); }, 650);
    c.style.transition = 'transform 90ms ease';
    c.style.transform = 'translate(' + this._x + 'px,' + this._y + 'px) scale(0.82)';
    return wait(110).then(function () {
      c.style.transform = 'translate(' + self._x + 'px,' + self._y + 'px)';
      return wait(160);
    });
  };

  Scene.prototype.type = async function (node, text, cps) {
    cps = cps || 32;
    var chars = Array.from(text);
    node.textContent = '';
    for (var i = 0; i < chars.length; i++) {
      if (!this.ok()) { node.textContent = text; return; }
      node.textContent += chars[i];
      await wait(1000 / cps + Math.random() * 16);
    }
  };

  Scene.prototype.typeWords = async function (node, text, msPerWord) {
    msPerWord = msPerWord || 130;
    var words = text.split(' ');
    node.textContent = '';
    for (var i = 0; i < words.length; i++) {
      if (!this.ok()) { node.textContent = text; return; }
      node.textContent += (i ? ' ' : '') + words[i];
      await wait(msPerWord + Math.random() * 60);
    }
  };

  Scene.prototype.count = async function (node, target, suffix, dur) {
    var start = performance.now();
    while (this.ok()) {
      var p = Math.min((performance.now() - start) / dur, 1);
      node.textContent = Math.round(target * ease(p)) + (suffix || '');
      if (p >= 1) return;
      await wait(28);
    }
    node.textContent = target + (suffix || '');
  };

  /* Replace a text node with a typable span (preserves trailing
     elements like the blinking caret). Returns the span + original. */
  function typable(el) {
    var node = null;
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim()) { node = el.childNodes[i]; break; }
    }
    if (!node) return { span: el, text: el.textContent };
    var span = document.createElement('span');
    var text = node.nodeValue;
    node.parentNode.replaceChild(span, node);
    span.textContent = text;
    return { span: span, text: text };
  }

  /* ── Scene 0 · Appointment Setting ─────────────────────────── */
  function calendarScene(v) {
    var slots = v.querySelectorAll('.cal-slot');
    var avail = v.querySelectorAll('.cal-cell.available');
    return async function (s) {
      slots.forEach(function (el) { el.classList.remove('in', 'hover-pulse'); });
      avail.forEach(function (el) { el.classList.remove('booked-now'); });
      s.hideCursor();
      await wait(500); if (!s.ok()) return;
      for (var i = 0; i < slots.length; i++) {
        slots[i].classList.add('in');
        await wait(280); if (!s.ok()) return;
      }
      await wait(300); if (!s.ok()) return;
      await s.moveTo(avail[0], 850); if (!s.ok()) return;
      await s.click();
      avail[0].classList.add('booked-now');
      await wait(750); if (!s.ok()) return;
      await s.moveTo(avail[avail.length - 1], 650); if (!s.ok()) return;
      await s.click();
      avail[avail.length - 1].classList.add('booked-now');
      await wait(550); if (!s.ok()) return;
      await s.moveTo(slots[0], 650, 0.86, 0.5); if (!s.ok()) return;
      slots[0].classList.add('hover-pulse');
      await wait(950);
      slots[0].classList.remove('hover-pulse');
      s.hideCursor();
      await wait(1500);
    };
  }

  /* ── Scene 1 · AI Follow-Ups ───────────────────────────────── */
  function followupScene(v) {
    var steps = v.querySelectorAll('.email-step');
    var preview = v.querySelector('.step-preview');
    var tw = typable(preview);
    return async function (s) {
      steps.forEach(function (el) { el.classList.remove('in'); });
      tw.span.textContent = '';
      s.hideCursor();
      await wait(500); if (!s.ok()) return;
      steps[0].classList.add('in');
      await wait(420); if (!s.ok()) return;
      steps[1].classList.add('in');
      await wait(420); if (!s.ok()) return;
      steps[2].classList.add('in');
      await wait(500); if (!s.ok()) return;
      await s.type(tw.span, tw.text, 38); if (!s.ok()) return;
      await wait(350); if (!s.ok()) return;
      steps[3].classList.add('in');
      await wait(2100);
    };
  }

  /* ── Scene 2 · CRM Automation (drag the deal) ──────────────── */
  function crmScene(v) {
    var deal = v.querySelector('.crm-deal.moving');
    var col = v.querySelector('.col-qual');
    return async function (s) {
      deal.classList.remove('grabbed', 'dropped');
      deal.style.transition = 'none';
      deal.style.transform = '';
      deal.style.opacity = '1';
      s.hideCursor();
      await wait(650); if (!s.ok()) return;
      await s.moveTo(deal, 900); if (!s.ok()) return;
      await s.click();
      deal.classList.add('grabbed');
      await wait(180); if (!s.ok()) return;

      var dr = deal.getBoundingClientRect();
      var colDeals = col.querySelectorAll('.crm-deal');
      var last = colDeals[colDeals.length - 1].getBoundingClientRect();
      var dx = last.left - dr.left;
      var dy = (last.bottom + 6) - dr.top;
      var c = s.cursorEl();
      c.style.transition = 'none';
      var cx = s._x, cy = s._y;
      var dur = 1050, t0 = performance.now();
      while (s.ok()) {
        var p = Math.min((performance.now() - t0) / dur, 1);
        var e = ease(p);
        var arc = -16 * Math.sin(Math.PI * e);
        var rot = 2.4 * Math.sin(Math.PI * e);
        deal.style.transform = 'translate(' + (dx * e) + 'px,' + (dy * e + arc) + 'px) rotate(' + rot + 'deg)';
        c.style.transform = 'translate(' + (cx + dx * e) + 'px,' + (cy + dy * e + arc) + 'px)';
        if (p >= 1) break;
        await wait(16);
      }
      s._x = cx + dx; s._y = cy + dy;
      deal.classList.remove('grabbed');
      deal.classList.add('dropped');
      await wait(420); if (!s.ok()) return;
      s.hideCursor();
      await wait(1900); if (!s.ok()) return;
      deal.style.transition = 'opacity 0.25s ease';
      deal.style.opacity = '0';
      await wait(280);
      deal.style.transform = '';
      deal.classList.remove('dropped');
      await wait(80);
      deal.style.opacity = '1';
      await wait(400);
    };
  }

  /* ── Scene 3 · Lead Qualification ──────────────────────────── */
  function qualScene(v) {
    var ring = v.querySelector('.score-fill');
    var num = v.querySelector('.score-number');
    var rows = v.querySelectorAll('.qual-bar-row');
    var verdict = v.querySelector('.qual-verdict');
    var numTarget = parseInt(num.textContent, 10) || 85;
    var bars = [];
    rows.forEach(function (row) {
      var fill = row.querySelector('.qual-bar-fill');
      var pct = row.querySelector('.qual-bar-pct');
      bars.push({ fill: fill, pct: pct, target: parseInt(pct.textContent, 10) || 0 });
    });
    return async function (s) {
      ring.style.transition = 'none';
      ring.style.strokeDashoffset = '138';
      num.textContent = '0';
      verdict.classList.remove('in');
      bars.forEach(function (b) {
        b.fill.style.transition = 'none';
        b.fill.style.transform = 'scaleX(0)';
        b.pct.textContent = '0%';
      });
      await wait(550); if (!s.ok()) return;

      /* ring + headline score count together */
      var t0 = performance.now(), dur = 1300;
      var countDone = s.count(num, numTarget, '', dur);
      while (s.ok()) {
        var p = Math.min((performance.now() - t0) / dur, 1);
        ring.style.strokeDashoffset = String(138 - (138 - 14) * ease(p));
        if (p >= 1) break;
        await wait(16);
      }
      await countDone; if (!s.ok()) return;
      await wait(250); if (!s.ok()) return;

      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        b.fill.style.transition = 'transform 0.85s cubic-bezier(0.22,1,0.36,1)';
        b.fill.style.transform = 'scaleX(1)';
        s.count(b.pct, b.target, '%', 850);
        await wait(240); if (!s.ok()) return;
      }
      await wait(650); if (!s.ok()) return;
      verdict.classList.add('in');
      await wait(2300);
    };
  }

  /* ── Scene 4 · SMS Automation ──────────────────────────────── */
  function smsScene(v) {
    var msgs = Array.prototype.slice.call(v.querySelectorAll('.sms-messages .sms-msg'));
    var thread = v.querySelector('.sms-messages');
    var data = msgs.map(function (m) {
      var t = typable(m);
      return { el: m, span: t.span, text: t.text, outgoing: m.classList.contains('outgoing') };
    });
    function indicator(outgoing) {
      var d = document.createElement('div');
      d.className = 'sms-typing';
      d.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
      if (outgoing) { d.style.alignSelf = 'flex-end'; d.style.background = 'rgba(2,132,199,0.10)'; }
      return d;
    }
    return async function (s) {
      data.forEach(function (m) { m.el.classList.remove('in'); m.span.textContent = m.text; });
      await wait(550); if (!s.ok()) return;
      for (var i = 0; i < data.length; i++) {
        var m = data[i];
        if (m.outgoing) {
          var ind = indicator(true);
          thread.insertBefore(ind, m.el);
          await wait(850); if (!s.ok()) { ind.remove(); return; }
          ind.remove();
          m.span.textContent = '';
          m.el.classList.add('in');
          await s.type(m.span, m.text, 34); if (!s.ok()) return;
        } else {
          m.el.classList.add('in');
        }
        await wait(620); if (!s.ok()) return;
      }
      await wait(2200);
    };
  }

  /* ── Scene 5 · Voice AI ────────────────────────────────────── */
  function voiceScene(v) {
    var lines = Array.prototype.slice.call(v.querySelectorAll('.voice-line'));
    var tags = v.querySelectorAll('.vo-tag');
    var data = lines.map(function (l) {
      var t = typable(l.querySelector('.vl-text'));
      return { el: l, span: t.span, text: t.text };
    });
    var status = v.querySelector('.voice-status');
    var statusNode = null, statusBase = '';
    if (status) {
      for (var i = 0; i < status.childNodes.length; i++) {
        if (status.childNodes[i].nodeType === 3 && /\d+:\d+/.test(status.childNodes[i].nodeValue)) {
          statusNode = status.childNodes[i];
          statusBase = statusNode.nodeValue;
          break;
        }
      }
    }
    return async function (s) {
      data.forEach(function (l) { l.el.classList.remove('in'); l.span.textContent = l.text; });
      tags.forEach(function (t) { t.classList.remove('in'); });
      if (statusNode) statusNode.nodeValue = statusBase;

      /* live call timer ticks in the background */
      var m = statusBase.match(/(\d+):(\d+)/);
      var secs = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
      var ticking = true;
      (async function () {
        while (ticking && s.ok()) {
          await wait(1000);
          if (!ticking || !s.ok() || !statusNode || !m) return;
          secs++;
          var mm = Math.floor(secs / 60), ss = ('0' + (secs % 60)).slice(-2);
          statusNode.nodeValue = statusBase.replace(/\d+:\d+/, mm + ':' + ss);
        }
      })();

      try {
        await wait(450); if (!s.ok()) return;
        for (var i = 0; i < data.length; i++) {
          data[i].el.classList.add('in');
          await s.typeWords(data[i].span, data[i].text, 120); if (!s.ok()) return;
          await wait(520); if (!s.ok()) return;
        }
        await wait(300); if (!s.ok()) return;
        tags[0] && tags[0].classList.add('in');
        await wait(420); if (!s.ok()) return;
        tags[1] && tags[1].classList.add('in');
        await wait(2300);
      } finally {
        ticking = false;
        if (statusNode) statusNode.nodeValue = statusBase;
      }
    };
  }

  /* ── Registry ──────────────────────────────────────────────── */
  var builders = { 0: calendarScene, 1: followupScene, 2: crmScene, 3: qualScene, 4: smsScene, 5: voiceScene };
  var players = new WeakMap();

  function playerFor(visual) {
    if (!players.has(visual)) {
      var step = parseInt(visual.getAttribute('data-step'), 10);
      var builder = builders[step];
      if (!builder) return null;
      players.set(visual, new Scene(visual, builder(visual)));
    }
    return players.get(visual);
  }

  window.ByldaScenes = {
    start: function (visual) { var p = playerFor(visual); if (p) p.start(); },
    stop: function (visual) { var p = players.get(visual); if (p) p.stop(); }
  };

  /* Rows already in view before this script loaded */
  document.querySelectorAll('.sys-visual.active').forEach(function (v) {
    window.ByldaScenes.start(v);
  });
})();
