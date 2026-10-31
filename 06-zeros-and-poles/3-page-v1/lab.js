/* Drawing adapted from iwrzwr visual archive, Sample Hold Ladder and Phase Aperture. MIT License, Copyright (c) kaganin. */
(() => {
  const FS = 8000;
  const VOICE_BAND = [300, 3400];
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const pct = g => Math.round(g * 100);
  const lab = $('lab'), canvas = $('stage'), ctx = canvas.getContext('2d');
  const tone = $('tone'), zero = $('zero'), pole = $('pole');
  const result = $('result'), why = $('why'), compare = $('compare');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const guesses = { quarter: 'about a quarter', half: 'about half', most: 'about 70%' };
  const state = { mode: 'explore', revealed: false, guess: null, f: 2000, pinned: null, zeroHz: 1000, r: 0, whine: 2600, trail: [], solved: false, bypass: false };
  let colors = {}, w = 0, h = 300, dpr = 1;

  const point = f => [Math.cos(Math.PI * f / 4000), Math.sin(Math.PI * f / 4000)];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function filter() {
    if (state.mode === 'explore') return { zeros: [[-1, 0]], poles: [] };
    const [c, s] = point(state.zeroHz);
    const poles = state.r > 0 ? [[state.r * c, state.r * s], [state.r * c, -state.r * s]] : [];
    return { zeros: [[c, s], [c, -s]], poles };
  }
  const raw = (f, F) => {
    const p = point(f);
    return F.zeros.reduce((m, z) => m * dist(p, z), 1) / F.poles.reduce((m, q) => m * dist(p, q), 1);
  };
  const loudest = F => { let m = 0; for (let f = 0; f <= 4000; f += 20) m = Math.max(m, raw(f, F)); return m; };
  const passes = (f, F = filter()) => raw(f, F) / (state.mode === 'explore' ? raw(0, F) : loudest(F));

  function voiceScore() {
    const F = filter();
    let sum = 0, n = 0;
    for (let f = VOICE_BAND[0]; f <= VOICE_BAND[1]; f += 50) {
      if (Math.abs(f - state.whine) < 150) continue;
      sum += Math.min(1, passes(f, F)); n++;
    }
    return sum / n;
  }
  const shown = v => Math.floor(v * 100);

  function coefficients() {
    if (state.mode === 'explore') return { b: [0.5, 0.5], a: [1] };
    const c = Math.cos(Math.PI * state.zeroHz / 4000), r = state.r;
    const g = 1 / loudest(filter());
    return { b: [g, -2 * c * g, g], a: [1, -2 * r * c, r * r] };
  }

  function readColors() {
    const s = getComputedStyle(document.documentElement), v = k => s.getPropertyValue(k).trim();
    colors = { ink: v('--ink'), soft: v('--ink-soft'), accent: v('--accent'), input: v('--input'), rule: v('--rule'), paper2: v('--paper-2') };
  }

  function line(pts, color, width = 1, dash = [], alpha = 1) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
    pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  function dot(x, y, r, color, alpha = 1) { ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  function ring(x, y, r, color, alpha = 1) { ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  function cross(x, y, color, alpha = 1) { line([[x - 6, y - 6], [x + 6, y + 6]], color, 2.5, [], alpha); line([[x + 6, y - 6], [x - 6, y + 6]], color, 2.5, [], alpha); }
  function label(text, x, y, align = 'center', color = colors.soft) { ctx.font = '11px "Geist Mono", ui-monospace, monospace'; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y); }

  function layout() {
    const stacked = w < 560;
    if (stacked) {
      const R = Math.min(w * 0.36, 120);
      return { circle: { cx: w / 2, cy: 40 + R, R }, chart: { x0: 44, x1: w - 28, y0: 2 * R + 110, y1: h - 34 } };
    }
    const R = Math.min(h * 0.4, (w * 0.42) / 2.4);
    return { circle: { cx: 28 + R * 1.15, cy: h * 0.56, R }, chart: { x0: R * 2.3 + 90, x1: w - 28, y0: 24, y1: h - 34 } };
  }

  function drawCircle({ cx, cy, R }, F) {
    const at = ([x, y]) => [cx + x * R, cy - y * R];
    line([[cx - R - 12, cy], [cx + R + 12, cy]], colors.rule);
    ctx.strokeStyle = colors.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = colors.rule; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
    label('0 Hz', cx + R, cy + 18); label('4,000 Hz', cx - R, cy + 18);
    const [x1k, y1k] = at(point(1000)), [x3k, y3k] = at(point(3000));
    label('1,000', x1k + 14, y1k - 6, 'left'); label('3,000', x3k - 14, y3k - 6, 'right');
    label('← tones rise', cx, cy + 36);
    if (!(state.mode === 'fix' && state.solved && Math.abs(state.whine - 2000) <= 600)) label('2,000', cx, cy - R - 10);
    state.trail.forEach((f, i) => { const [x, y] = at(point(f)); dot(x, y, 3.2, colors.input, 0.15 + i * 0.08); });
    F.zeros.forEach(z => { const [x, y] = at(z); ring(x, y, 7, colors.accent, z[1] < 0 ? 0.35 : 1); });
    F.poles.forEach(p => { const [x, y] = at(p); cross(x, y, colors.accent, p[1] < 0 ? 0.35 : 1); });
    if (F.poles.length) { const [px, py] = at(F.poles[0]); line([[cx, cy], [px, py]], colors.rule, 1, [3, 4]); label(`r ${state.r.toFixed(2)}`, px + (px >= cx ? 14 : -14), py + 18, px >= cx ? 'left' : 'right', colors.ink); }
    if (state.mode === 'explore') {
      if (state.pinned !== null && state.pinned !== state.f) { const [px, py] = at(point(state.pinned)); line([[px, py], at(F.zeros[0])], colors.input, 1.4, [5, 4]); dot(px, py, 5, colors.input); }
      const [tx, ty] = at(point(state.f));
      line([[tx, ty], at(F.zeros[0])], colors.ink, 1.4, [6, 4]);
      dot(tx, ty, 6, colors.ink);
    } else if (state.solved) {
      const [wx, wy] = at(point(state.whine));
      dot(wx, wy, 6, colors.ink);
      label('whine', wx + 12, wy - 12, 'left', colors.ink);
    }
  }

  function drawChart({ x0, x1, y0, y1 }, F) {
    const X = f => x0 + (f / 4000) * (x1 - x0), Y = g => y1 - Math.min(g, 1.2) / 1.2 * (y1 - y0);
    if (state.mode === 'fix') { ctx.fillStyle = colors.paper2; ctx.fillRect(X(VOICE_BAND[0]), y0, X(VOICE_BAND[1]) - X(VOICE_BAND[0]), y1 - y0); label('voice', X(1850), y0 + 14); }
    [0, 0.5, 1].forEach(g => { line([[x0, Y(g)], [x1, Y(g)]], colors.rule); label(`${g * 100}%`, x0 - 8, Y(g) + 4, 'right'); });
    [0, 1000, 2000, 3000, 4000].forEach(f => label(f ? fmt(f) : '0', X(f), y1 + 18));
    label('tones rise →', x1, y0 - 8, 'right');
    if (state.mode === 'explore' && !state.revealed) { label('the curve appears after your guess', (x0 + x1) / 2, (y0 + y1) / 2); return; }
    const unstable = state.mode === 'fix' && state.r >= 1;
    const pts = [];
    for (let i = 0; i <= 400; i++) { const f = 4000 * i / 400; pts.push([X(f), Y(passes(f, F))]); }
    line(pts, colors.ink, 2, unstable ? [4, 4] : [], unstable ? 0.5 : 1);
    if (unstable) label(state.r > 1 ? 'unstable: echoes grow' : 'rings forever', (x0 + x1) / 2, y0 + 30, 'center', colors.accent);
    if (state.mode === 'explore') {
      if (state.pinned !== null && state.pinned !== state.f) dot(X(state.pinned), Y(passes(state.pinned, F)), 5, colors.input);
      dot(X(state.f), Y(passes(state.f, F)), 6, state.f === 4000 ? colors.accent : colors.ink);
    } else {
      line([[X(state.zeroHz), y1], [X(state.zeroHz), y1 - 10]], colors.accent, 2.5);
      if (state.solved) dot(X(state.whine), Y(passes(state.whine, F)), 6, colors.accent);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const L = layout(), F = filter();
    drawCircle(L.circle, F); drawChart(L.chart, F);
  }

  function exploreWhy(f) {
    if (f === 0) return 'A 0 Hz tone is a constant. Every average is the same constant, so 100% passes.';
    if (f === 4000) return 'The samples flip +1, −1. Each average is 0. The tone sits on the zero, so the average removes it.';
    const d = dist(point(f), [-1, 0]);
    return `The point sits ${Math.round(f / 4000 * 180)}° around the circle, ${d.toFixed(2)} from the zero. Compared with 2, the distance of 0 Hz, ${pct(passes(f))}% passes.`;
  }

  function fixMessage() {
    const wp = pct(passes(state.whine)), vraw = voiceScore(), vs = shown(vraw);
    state.solved = false;
    if (state.r >= 1) return state.r > 1
      ? `Poles outside the circle: each echo is ${state.r.toFixed(2)} times the last, so the filter blows up. Pull them back inside.`
      : 'Poles on the circle: one click and the filter rings forever. Pull them a little inside.';
    if (wp > 2) return `The whine still passes ${wp}%. Its pitch is ${state.whine > state.zeroHz ? 'higher' : 'lower'} than your zeros. Listen, then move the zeros toward it.`;
    if (vraw < 0.9) return `Whine removed. But the voice keeps only ${vs}%: the zeros are dulling the tones around them. Bring the poles in beside the zeros.`;
    state.solved = true;
    return `Fixed. The whine sat at ${fmt(state.whine)} Hz and now passes ${wp}%, and the voice keeps ${vs}%. Line two is quiet.`;
  }

  function render() {
    if (state.mode === 'explore') {
      const f = state.f;
      tone.value = f; $('tone-out').textContent = `${fmt(f)} Hz`;
      if (state.revealed) {
        result.textContent = `Tone ${fmt(f)} Hz · passes `;
        const s = document.createElement('span'); s.className = pct(passes(f)) < 100 ? 'changed' : ''; s.textContent = f === 4000 ? '0%, removed' : `${pct(passes(f))}%`;
        result.append(s);
        const lead = state.guess && f === 2000 ? (state.guess === 'most' ? 'Right. ' : `Not ${guesses[state.guess]}. `) : '';
        why.textContent = lead + exploreWhy(f);
      } else { result.textContent = `Tone ${fmt(f)} Hz`; why.textContent = 'Make your guess first. Then you see the answer.'; }
      compare.hidden = state.pinned === null;
      if (state.pinned !== null) {
        const p = state.pinned;
        compare.textContent = p === f ? `Pinned ${fmt(p)} Hz. Move the slider to compare.`
          : `Pinned ${fmt(p)} Hz passes ${pct(passes(p))}%, now ${fmt(f)} Hz passes ${pct(passes(f))}%. ${dist(point(p), [-1, 0]) < dist(point(f), [-1, 0]) ? fmt(p) : fmt(f)} Hz is closer to the zero, so less of it passes.`;
      }
      tone.disabled = !state.revealed; $('pin').disabled = !state.revealed; $('skip').disabled = state.revealed;
      document.querySelectorAll('[data-guess]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.guess === state.guess)); b.disabled = state.revealed; });
    } else {
      zero.value = state.zeroHz; pole.value = state.r;
      $('zero-out').textContent = `${fmt(state.zeroHz)} Hz`;
      $('pole-out').textContent = state.r === 0 ? '0 (no poles)' : state.r.toFixed(2) + (state.r >= 1 ? (state.r === 1 ? ' (on the circle)' : ' (outside)') : '');
      const message = fixMessage();
      if (state.r >= 1) {
        result.textContent = 'Unstable filter: ';
        const s = document.createElement('span'); s.className = 'changed'; s.textContent = state.r > 1 ? 'echoes grow' : 'rings forever';
        result.append(s);
      } else {
        result.textContent = `Whine passes ${pct(passes(state.whine))}% · voice keeps `;
        const s = document.createElement('span'); s.className = state.solved ? '' : 'changed'; s.textContent = `${shown(voiceScore())}%`;
        result.append(s);
      }
      why.textContent = message;
      compare.hidden = true;
      $('another').hidden = !state.solved; $('before-after').hidden = !state.solved;
    }
    $('key-pole').hidden = state.mode !== 'fix' || state.r === 0;
    $('key-tone').hidden = state.mode === 'fix';
    $('jump').hidden = state.mode === 'fix';
    $('key-pin').hidden = state.mode !== 'explore' || state.pinned === null;
    canvas.setAttribute('aria-label', state.mode === 'explore'
      ? `Unit circle with the average's zero at 4,000 Hz; the tone at ${fmt(state.f)} Hz.`
      : `Unit circle with a zero pair at ${fmt(state.zeroHz)} Hz${state.r ? ` and poles at radius ${state.r.toFixed(2)}` : ''}.`);
    draw();
    if (audio.source) audio.refresh();
  }

  const VOICE = (() => {
    const bin = atob(window.LINE_TWO_CALL), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const v = new DataView(u.buffer);
    for (let o = 12; o + 8 <= v.byteLength;) {
      const id = String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]), size = v.getUint32(o + 4, true);
      if (id === 'data') { const n = size / 2, out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = v.getInt16(o + 8 + i * 2, true) / 32768; return out; }
      o += 8 + size + (size % 2);
    }
    return new Float32Array(0);
  })();

  function signal() {
    const n = VOICE.length + FS / 2, x = new Float32Array(n);
    const peak = VOICE.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
    const f = state.mode === 'explore' ? state.f : state.whine;
    for (let i = 0; i < n; i++) x[i] = (i < VOICE.length ? 0.55 * VOICE[i] / peak : 0) + 0.16 * Math.cos(2 * Math.PI * f * i / FS);
    if (state.bypass) return x;
    const { b, a } = coefficients(), y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let k = 0; k < b.length; k++) if (i - k >= 0) acc += b[k] * x[i - k];
      for (let k = 1; k < a.length; k++) if (i - k >= 0) acc -= a[k] * y[i - k];
      y[i] = acc;
    }
    return y;
  }

  const audio = {
    ctx: null, source: null, gain: null, startedAt: 0, duration: 0,
    start(offset = 0) {
      if (state.mode === 'fix' && state.r >= 1 && !state.bypass) { this.stop(); why.textContent = 'The filter is unstable, so playing it would only blast noise. Pull the poles back inside the circle first.'; return; }
      this.ctx = this.ctx || new AudioContext();
      const data = signal(), buffer = this.ctx.createBuffer(1, data.length, FS);
      buffer.copyToChannel(data, 0);
      if (!this.gain) { this.gain = this.ctx.createGain(); this.gain.gain.value = 0.3; this.gain.connect(this.ctx.destination); }
      const src = this.ctx.createBufferSource(); src.buffer = buffer; src.loop = true; src.connect(this.gain);
      this.duration = buffer.duration; src.start(0, offset % this.duration); this.startedAt = this.ctx.currentTime - offset % this.duration;
      if (this.source) this.source.stop();
      this.source = src; $('play').textContent = 'Stop';
    },
    refresh() { this.start((this.ctx.currentTime - this.startedAt) % this.duration); },
    stop() { if (this.source) { this.source.stop(); this.source = null; } $('play').textContent = 'Play the call'; }
  };

  function newWhine() {
    let f;
    do { f = 700 + 100 * Math.floor(Math.random() * 27); } while (Math.abs(f - state.zeroHz) < 400);
    state.whine = f; state.solved = false;
  }

  function setBypass(on) { state.bypass = on; $('bypass').setAttribute('aria-pressed', String(on)); }

  function startAct2() {
    audio.stop(); setBypass(false);
    $('act2-mount').replaceChildren(lab);
    Object.assign(state, { mode: 'fix', zeroHz: 1000, r: 0, trail: [], pinned: null });
    newWhine();
    lab.dataset.mode = 'fix';
    ['ask', 'tone-control'].forEach(id => $(id).hidden = true);
    $('pin').hidden = true;
    ['task', 'zero-control', 'pole-control'].forEach(id => $(id).hidden = false);
    resize(); render(); zero.focus();
  }

  function resetAct() {
    audio.stop(); setBypass(false);
    if (state.mode === 'explore') Object.assign(state, { revealed: false, guess: null, f: 2000, pinned: null, trail: [] });
    else { Object.assign(state, { zeroHz: 1000, r: 0, trail: [] }); newWhine(); }
    render();
  }

  function resize() {
    w = Math.max(1, canvas.getBoundingClientRect().width); h = w < 560 ? 520 : 300; canvas.style.height = h + 'px';
    dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }

  const remember = v => { state.trail = [...state.trail, v].slice(reduced.matches ? -1 : -5); };
  document.querySelectorAll('[data-guess]').forEach(b => b.addEventListener('click', () => { state.guess = b.dataset.guess; state.revealed = true; render(); }));
  $('skip').addEventListener('click', () => { state.revealed = true; render(); });
  tone.addEventListener('input', () => { remember(state.f); state.f = Number(tone.value); render(); });
  zero.addEventListener('input', () => { remember(state.zeroHz); state.zeroHz = Number(zero.value); render(); });
  pole.addEventListener('input', () => { state.r = Math.round(Number(pole.value) * 100) / 100; render(); });
  $('pin').addEventListener('click', () => { state.pinned = state.f; render(); });
  $('play').addEventListener('click', () => audio.source ? audio.stop() : audio.start());
  $('bypass').addEventListener('click', () => { setBypass(!state.bypass); if (audio.source) audio.refresh(); });
  $('before-after').addEventListener('click', () => { setBypass(true); audio.start(); setTimeout(() => { setBypass(false); audio.refresh(); }, 3500); });
  $('another').addEventListener('click', () => { Object.assign(state, { zeroHz: 1000, r: 0, trail: [] }); newWhine(); render(); });
  $('reset').addEventListener('click', resetAct);
  $('start-act2').addEventListener('click', startAct2);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); draw(); });
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(resize).observe(canvas);
  readColors(); resize(); render();
})();
