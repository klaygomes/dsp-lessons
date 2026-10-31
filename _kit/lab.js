/* Canvas drawing adapted from the iwrzwr visual archive, Sample Hold Ladder. MIT License, Copyright (c) 2026 Kagan Yaldizkaya. */
window.Kit = (() => {
  const MINUS = '−';
  const fmt = (v, digits = 2) => {
    const s = Math.abs(v).toFixed(digits);
    return (v < 0 && Number(s) !== 0 ? MINUS : '') + s;
  };
  const hz = f => Math.round(f).toLocaleString('en-US');
  const pct = v => `${Math.round(v * 100)}%`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function colors() {
    const s = getComputedStyle(document.documentElement), v = k => s.getPropertyValue(k).trim();
    return { ink: v('--ink'), soft: v('--ink-soft'), accent: v('--accent'), accentInk: v('--accent-ink'), accentSoft: v('--accent-soft'),
      input: v('--input'), inputSoft: v('--input-soft'), rule: v('--rule'), paper: v('--paper'), paper2: v('--paper-2') };
  }

  function pen(ctx) {
    const snap = v => Math.round(v * 2) / 2;
    return {
      line(pts, color, width = 1, dash = [], alpha = 1) {
        if (!pts.length) return;
        ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.lineCap = 'butt';
        ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(snap(x), snap(y)) : ctx.moveTo(snap(x), snap(y)));
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      },
      rect(x, y, w, h, color, alpha = 1) { ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; },
      dot(x, y, r, color, alpha = 1) { ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; },
      ring(x, y, r, color, width = 1.5) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); },
      text(s, x, y, { align = 'center', color, size = 11, font = 'mono', weight = 400 } = {}) {
        const family = font === 'mono' ? '"Geist Mono", ui-monospace, monospace' : '"Geist", system-ui, sans-serif';
        ctx.font = `${weight} ${size}px ${family}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y);
      },
      tick(x, y, color) { this.line([[x - 5, y], [x - 1.5, y + 4], [x + 6, y - 5]], color, 2); },
      cross(x, y, color) { this.line([[x - 4.5, y - 4.5], [x + 4.5, y + 4.5]], color, 2); this.line([[x + 4.5, y - 4.5], [x - 4.5, y + 4.5]], color, 2); },
    };
  }

  function stage(canvas, draw, { height = w => (w < 560 ? 320 : 260) } = {}) {
    const ctx = canvas.getContext('2d');
    const s = { ctx, pen: pen(ctx), w: 1, h: 1, c: colors() };
    s.redraw = () => { ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); ctx.clearRect(0, 0, s.w, s.h); draw(s); };
    s.resize = () => {
      s.w = Math.max(1, Math.round(canvas.getBoundingClientRect().width)); s.h = height(s.w);
      if (canvas.style.height !== `${s.h}px`) canvas.style.height = `${s.h}px`;
      s.dpr = Math.min(devicePixelRatio || 1, 2);
      const cw = Math.round(s.w * s.dpr), ch = Math.round(s.h * s.dpr);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      s.redraw();
    };
    const recolor = () => { s.c = colors(); s.redraw(); };
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
    new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let queued = 0;
    new ResizeObserver(() => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; s.resize(); }); }).observe(canvas);
    s.resize();
    return s;
  }

  function loop(root, tick, fps = 30) {
    let raf = 0, last = 0, visible = false, on = false;
    const go = () => { if (!raf && on && visible && !document.hidden && !reduced.matches) { last = 0; raf = requestAnimationFrame(frame); } };
    function frame(now) {
      raf = 0;
      if (!on || !visible || document.hidden || reduced.matches) return;
      if (!last || now - last >= 1000 / fps) { tick(last ? Math.min((now - last) / 1000, 0.1) : 0); last = now; }
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; go(); }).observe(root);
    document.addEventListener('visibilitychange', go);
    return { start() { on = true; go(); }, stop() { on = false; }, get running() { return on && !reduced.matches; } };
  }

  function wav(base64) {
    const bin = atob(base64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const v = new DataView(u.buffer);
    for (let o = 12; o + 8 <= v.byteLength;) {
      const id = String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]), size = v.getUint32(o + 4, true);
      if (id === 'data') { const n = size / 2, out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = v.getInt16(o + 8 + i * 2, true) / 32768; return out; }
      o += 8 + size + (size % 2);
    }
    return new Float32Array(0);
  }

  const players = new Set();
  function player({ rate = 8000, gain = 0.3, onChange = () => {} } = {}) {
    const p = { ctx: null, source: null, out: null, startedAt: 0, duration: 0, render: null };
    players.add(p);
    p.play = (render, offset = 0) => {
      players.forEach(q => { if (q !== p && q.playing) q.stop(); });
      p.render = render;
      p.ctx = p.ctx || new AudioContext();
      const data = render(), buffer = p.ctx.createBuffer(1, data.length, rate);
      buffer.copyToChannel(data, 0);
      if (!p.out) { p.out = p.ctx.createGain(); p.out.gain.value = Math.min(gain, 0.3); p.out.connect(p.ctx.destination); }
      const src = p.ctx.createBufferSource(); src.buffer = buffer; src.loop = true; src.connect(p.out);
      p.duration = buffer.duration; const at = offset % p.duration;
      src.start(0, at); p.startedAt = p.ctx.currentTime - at;
      if (p.source) p.source.stop();
      p.source = src; onChange(true);
    };
    p.refresh = () => { if (p.source) p.play(p.render, p.ctx.currentTime - p.startedAt); };
    p.stop = () => { if (p.source) { p.source.stop(); p.source = null; } onChange(false); };
    Object.defineProperty(p, 'playing', { get: () => Boolean(p.source) });
    return p;
  }

  function tones(x, rate = 8000) {
    const N = x.length, out = [];
    for (let k = 0; k <= N / 2; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { re += x[n] * Math.cos(2 * Math.PI * k * n / N); im -= x[n] * Math.sin(2 * Math.PI * k * n / N); }
      out.push({ f: k * rate / N, size: Math.hypot(re, im) / N * (k === 0 || k === N / 2 ? 1 : 2) });
    }
    return out;
  }


  function ask(root, { question, options, right, explain, hints = {}, reveal = 'Show me the answer', solved = null, onSolved = () => {}, focusAfter = null }) {
    root.classList.add('k-ask');
    root.replaceChildren();
    const q = document.createElement('p'); q.className = 'k-q'; q.textContent = question;
    const row = document.createElement('div'); row.className = 'row'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', question);
    const fb = document.createElement('p'); fb.className = 'k-feedback'; fb.tabIndex = -1; fb.setAttribute('aria-live', 'polite');
    const buttons = options.map(([value, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.value = value;
      b.addEventListener('click', () => choose(value, b));
      return b;
    });
    const more = document.createElement('button'); more.type = 'button'; more.className = 'quiet'; more.textContent = reveal;
    more.addEventListener('click', () => finish(true));
    row.append(...buttons, more);
    root.append(q, row, fb);
    const labelOf = v => options.find(([o]) => o === v)[1];
    function finish(shown, silent = false) {
      buttons.forEach(b => { b.disabled = true; if (b.dataset.value === right) { b.classList.add('k-right'); b.setAttribute('aria-pressed', 'true'); } });
      more.hidden = true;
      fb.classList.remove('k-bad');
      fb.textContent = `${shown ? `The right choice: “${labelOf(right)}”. ` : 'Right. '}${explain}`;
      if (silent) return;
      onSolved(shown);
      const next = focusAfter && focusAfter();
      (next && !next.disabled ? next : fb).focus();
    }
    function choose(value, b) {
      if (value === right) return finish(false);
      b.disabled = true; b.classList.add('k-wrong');
      fb.classList.add('k-bad');
      fb.textContent = `Not quite. ${hints[value] || ''} Try again.`;
      (buttons.find(x => !x.disabled) || more).focus();
    }
    if (solved) finish(solved === 'shown', true);
    return { get solved() { return more.hidden; } };
  }

  function meter(el, value, { max = 0.4, known = true, text } = {}) {
    el.querySelector('.fill').style.width = known ? `${Math.min(value / max, 1) * 100}%` : '0%';
    el.querySelector('output').textContent = !known ? '?' : text || `${value > 0 && value < 0.005 ? 'under 1%' : `${Math.round(value * 100)}%`}${value > max ? ', past the bar' : ''}`;
  }

  return { fmt, hz, pct, MINUS, reduced, colors, pen, stage, loop, wav, player, tones, ask, meter };
})();
