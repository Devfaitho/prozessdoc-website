// ProzessDoc Hero: wechselndes Wort + animierter Hintergrund (Canvas)
// Modi: linien (A), bpmn (E), kombi (A + E)
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MINT = '79,209,174', SAGE = '169,204,195';

  // Wechselndes Wort
  // Wörter kommen aus data-words am Element #rot (durch | getrennt), damit die Headline austauschbar bleibt
  var wi = 0;
  if (!reduce) setInterval(function () {
    var el = document.getElementById('rot'); if (!el) return;
    var words = (el.getAttribute('data-words') || '').split('|').filter(Boolean); if (words.length < 2) return;
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(function () { wi = (wi + 1) % words.length; el.textContent = words[wi]; el.classList.remove('out'); el.classList.add('in'); }, 360);
  }, 3200);

  var c = document.getElementById('flow'); if (!c) return; var x = c.getContext('2d'), W = 0, H = 0, mode = 'bpmn';

  // ---------- A: Prozesslinien mit wandernden Belegen ----------
  var linien = {
    st: null,
    init: function (fade) {
      var n = W < 700 ? 6 : 9, lines = [];
      for (var k = 0; k < n; k++) lines.push({ y: H * (0.10 + 0.78 * k / (n - 1)), a: 14 + (k % 3) * 10, f: 0.0016 + (k % 4) * 0.0005, p: k * 1.7, nodes: [0.22 + (k % 3) * 0.07, 0.55 + (k % 2) * 0.08, 0.84] });
      this.st = { fade: fade || 1, lines: lines, dots: lines.map(function (l, k) { return { l: k, t: (k * 0.137) % 1, s: 0.0007 + (k % 3) * 0.00025, hold: 0 }; }) };
    },
    draw: function (t) {
      var s = this.st;
      function yAt(l, px) { return l.y + Math.sin(px * l.f + l.p + t * 0.00025) * l.a; }
      s.lines.forEach(function (l) {
        x.beginPath();
        for (var px = -20; px <= W + 20; px += 12) { var py = yAt(l, px); px === -20 ? x.moveTo(px, py) : x.lineTo(px, py); }
        x.strokeStyle = 'rgba(' + SAGE + ',' + (0.13 * s.fade) + ')'; x.lineWidth = 1; x.stroke();
        l.nodes.forEach(function (n) { x.beginPath(); x.arc(n * W, yAt(l, n * W), 2.2, 0, 7); x.fillStyle = 'rgba(' + SAGE + ',' + (0.28 * s.fade) + ')'; x.fill(); });
      });
      s.dots.forEach(function (d) {
        var l = s.lines[d.l];
        if (d.hold > 0) d.hold--; else { var b = d.t; d.t += d.s; if (d.t > 1.05) d.t = -0.05; l.nodes.forEach(function (n) { if (b < n && d.t >= n) d.hold = 40; }); }
        glow(d.t * W, yAt(l, d.t * W), d.hold > 0 ? 3.6 : 2.6, 16, s.fade);
      });
    }
  };

  // ---------- E: BPMN-2.0-Prozessleiste ----------
  var bpmn = {
    st: null,
    init: function () {
      var m = W < 960, trust = (document.querySelector('.trust') || {}).offsetHeight || 56;
      var cy = H - trust - (m ? 62 : 74), x0 = W * 0.04, x1 = W * 0.96;
      var steps = m
        ? [['start'], ['task', 'Erfassen'], ['task', 'Prüfen'], ['task', 'Ablegen'], ['task', 'Vernichten'], ['end']]
        : [['start'], ['task', 'Beleg erfassen'], ['gw', 'vollständig?'], ['task', 'Prüfen & kontieren'], ['task', 'Buchen'], ['task', 'Revisionssicher ablegen'], ['task', 'Beleg vernichten'], ['end']];
      var lane = m ? 26 : 44, inner0 = x0 + lane + (m ? 14 : 24), inner1 = x1 - 24, n = steps.length;
      // Kreise und Gateways brauchen weniger Platz als Aufgaben: Positionen nach Gewicht verteilen
      var wgt = steps.map(function (st) { return st[0] === 'task' ? 1 : st[0] === 'gw' ? 0.6 : 0.45; });
      var total = wgt.reduce(function (a, b) { return a + b; }, 0), unit = (inner1 - inner0) / total, acc = 0;
      var tw = Math.min(160, unit * (m ? 0.86 : 0.8)), th = m ? 40 : 46;
      var nodes = steps.map(function (st, i) { var px = inner0 + (acc + wgt[i] / 2) * unit; acc += wgt[i]; return { t: st[0], label: st[1], px: px }; });
      this.st = { m: m, cy: cy, x0: x0, x1: x1, lane: lane, h: m ? 100 : 118, tw: tw, th: th, nodes: nodes, seg: 0, prog: 0, hold: 40, lit: [] };
    },
    draw: function () {
      var s = this.st, txt = 'rgba(' + SAGE + ',0.6)';
      function edgeOut(n) { return n.px + (n.t === 'task' ? s.tw / 2 : n.t === 'gw' ? 16 : 13); }
      function edgeIn(n) { return n.px - (n.t === 'task' ? s.tw / 2 : n.t === 'gw' ? 16 : 13); }
      var top = s.cy - s.h / 2;
      x.fillStyle = 'rgba(6,35,38,0.72)'; roundRect(s.x0, top, s.x1 - s.x0, s.h, 10); x.fill();
      x.strokeStyle = 'rgba(' + SAGE + ',0.22)'; x.lineWidth = 1; x.stroke();
      x.beginPath(); x.moveTo(s.x0 + s.lane, top); x.lineTo(s.x0 + s.lane, top + s.h); x.stroke();
      x.save(); x.translate(s.x0 + s.lane / 2, s.cy); x.rotate(-Math.PI / 2); x.fillStyle = txt; x.font = '600 10px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BELEGPROZESS', 0, 0); x.restore();
      for (var i = 0; i < s.nodes.length - 1; i++) {
        var a = edgeOut(s.nodes[i]), b = edgeIn(s.nodes[i + 1]), on = s.lit[i] > 0;
        x.strokeStyle = on ? 'rgba(' + MINT + ',0.85)' : 'rgba(' + SAGE + ',0.30)'; x.lineWidth = on ? 1.8 : 1.2;
        x.beginPath(); x.moveTo(a, s.cy); x.lineTo(b, s.cy); x.stroke();
        x.fillStyle = x.strokeStyle; x.beginPath(); x.moveTo(b, s.cy); x.lineTo(b - 8, s.cy - 4.5); x.lineTo(b - 8, s.cy + 4.5); x.closePath(); x.fill();
        if (s.lit[i] > 0) s.lit[i]--;
      }
      s.nodes.forEach(function (n, i) {
        var act = s.hold > 0 && s.seg === i;
        x.strokeStyle = act ? 'rgb(' + MINT + ')' : 'rgba(' + SAGE + ',0.5)'; x.fillStyle = act ? 'rgba(' + MINT + ',0.14)' : 'rgba(6,35,38,0.95)'; x.lineWidth = act ? 2 : 1.3;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        if (n.t === 'task') { roundRect(n.px - s.tw / 2, s.cy - s.th / 2, s.tw, s.th, 9); x.fill(); x.stroke(); x.fillStyle = act ? '#fff' : txt; x.font = '600 ' + (s.m ? 9.5 : 12.5) + 'px system-ui,sans-serif'; wrapText(n.label, n.px, s.cy, s.tw - 12, 15); }
        else if (n.t === 'gw') { var r = 16; x.beginPath(); x.moveTo(n.px, s.cy - r); x.lineTo(n.px + r, s.cy); x.lineTo(n.px, s.cy + r); x.lineTo(n.px - r, s.cy); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.moveTo(n.px - 5.5, s.cy - 5.5); x.lineTo(n.px + 5.5, s.cy + 5.5); x.moveTo(n.px + 5.5, s.cy - 5.5); x.lineTo(n.px - 5.5, s.cy + 5.5); x.stroke(); x.fillStyle = txt; x.font = '500 11px system-ui,sans-serif'; x.fillText(n.label, n.px, s.cy - 30); }
        else { x.beginPath(); x.arc(n.px, s.cy, 13, 0, 7); x.fill(); x.lineWidth = n.t === 'end' ? 3.5 : 1.5; x.stroke(); }
      });
      if (s.hold === 0 && s.seg >= s.nodes.length - 1) { s.seg = 0; s.hold = 40; }
      if (s.hold > 0) { s.hold--; glow(s.nodes[s.seg].px, s.cy, 3, 18, 1); return; }
      var A = s.nodes[s.seg], B = s.nodes[s.seg + 1], ax = edgeOut(A), bx = edgeIn(B);
      s.prog += 2.6 / Math.max(1, bx - ax); s.lit[s.seg] = 50;
      if (s.prog >= 1) { s.prog = 0; s.seg++; s.hold = B.t === 'task' ? 60 : (B.t === 'end' ? 80 : 24); return; }
      glow(ax + (bx - ax) * s.prog, s.cy, 4, 18, 1);
    }
  };

  // ---------- Helfer ----------
  function glow(px, py, r, halo, a) { var g = x.createRadialGradient(px, py, 0, px, py, halo); g.addColorStop(0, 'rgba(' + MINT + ',' + (0.55 * a) + ')'); g.addColorStop(1, 'rgba(' + MINT + ',0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, halo, 0, 7); x.fill(); x.fillStyle = 'rgba(' + MINT + ',' + a + ')'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
  function roundRect(px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.lineTo(px + w - r, py); x.quadraticCurveTo(px + w, py, px + w, py + r); x.lineTo(px + w, py + h - r); x.quadraticCurveTo(px + w, py + h, px + w - r, py + h); x.lineTo(px + r, py + h); x.quadraticCurveTo(px, py + h, px, py + h - r); x.lineTo(px, py + r); x.quadraticCurveTo(px, py, px + r, py); x.closePath(); }
  function wrapText(t, cx, cy, maxW, lh) {
    var w = t.split(' '), lines = [], cur = '';
    w.forEach(function (word) { var test = cur ? cur + ' ' + word : word; if (x.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; } else cur = test; });
    lines.push(cur);
    lines.forEach(function (l, i) { x.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * lh); });
  }

  var MODES = {
    linien: { init: function () { linien.init(1); }, draw: function (t) { linien.draw(t); } },
    bpmn: { init: function () { bpmn.init(); }, draw: function (t) { bpmn.draw(t); } },
    kombi: { init: function () { linien.init(0.75); bpmn.init(); }, draw: function (t) { linien.draw(t); bpmn.draw(t); } }
  };
  function setModeClass() { var h = document.querySelector('.hero'); if (h) h.classList.toggle('mode-bpmn', mode !== 'linien'); }
  function size() {
    var dpr = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    MODES[mode].init();
  }
  function frame(t) { x.clearRect(0, 0, W, H); MODES[mode].draw(t || 0); if (!reduce) requestAnimationFrame(frame); }

  document.querySelectorAll('[data-bg]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.bg; setModeClass(); size(); if (reduce) frame(0);
      document.querySelectorAll('[data-bg]').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
    });
  });
  var start = (location.hash || '').replace('#', '');
  if (MODES[start]) mode = start;
  document.querySelectorAll('[data-bg]').forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.bg === mode); });
  setModeClass(); size(); addEventListener('resize', size); requestAnimationFrame(frame);
})();
