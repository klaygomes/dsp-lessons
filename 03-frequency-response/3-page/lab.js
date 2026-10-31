(() => {
  const K = window.Kit, FS = 8000;
  const { fmt, hz } = K;
  const cosd = d => Math.cos(d * Math.PI / 180), sind = d => Math.sin(d * Math.PI / 180);
  const turnOf = f => 360 * f / FS;
  const pct = v => `${Math.round(v * 100)}%`;
  const degText = d => { const r = Math.round(d * 10) / 10; return `${Number.isInteger(r) ? r : r.toFixed(1)}°`; };
  const joinList = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const EAST = [0.15, 0.7, 0.15];
  const BANDS = [500, 1000, 1500, 2000, 2500, 3000, 3400];
  const CASES = [
    { name: 'west route', h: [0.1, 0.8, 0.1], text: 'The west route: its click is hidden from you. Send a test tone down each band, then set each band’s boost.' },
    { name: 'north route', h: [0.125, 0.75, 0.125], text: 'Another ticket: the north route sounds muffled too, and nobody kept its click either. Measure each band again; the west route’s numbers will not carry over.' },
    { name: 'harbour route', h: [0.05, 0.9, 0.05], text: 'The harbour route: callers say it sounds only a little dull. Measure each band and boost what it lost, however small.' },
  ];

  const response = (h, f) => {
    let A = 0, B = 0;
    h.forEach((v, k) => { A += v * cosd(turnOf(f) * k); B += v * sind(turnOf(f) * k); });
    const G = Math.hypot(A, B);
    let phi = G < 1e-9 ? 0 : ((Math.atan2(B, A) * 180 / Math.PI) % 360 + 360) % 360;
    if (phi > 359.95) phi = 0;
    return { G, phi };
  };
  const conv = (x, h) => { const y = new Float32Array(x.length); for (let n = 0; n < x.length; n++) { let s = 0; for (let k = 0; k < h.length && k <= n; k++) s += h[k] * x[n - k]; y[n] = s; } return y; };
  const convLoop = (x, h) => Float32Array.from(x, (_, n) => h.reduce((s, hk, k) => s + hk * x[(n - k + x.length) % x.length], 0));

  const RAW = K.wav(window.LESSON_CALL);
  const RAW_PEAK = RAW.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
  const VOICE = Float32Array.from(RAW, s => 0.45 * s / RAW_PEAK);

  function boostFilter(knobs) {
    const N = 65, M = 32;
    const D = f => {
      if (f <= BANDS[0]) return knobs[0];
      if (f >= BANDS[BANDS.length - 1]) return knobs[knobs.length - 1];
      const i = BANDS.findIndex((c, j) => f >= c && f <= BANDS[j + 1]);
      const t = (f - BANDS[i]) / (BANDS[i + 1] - BANDS[i]);
      return knobs[i] * (1 - t) + knobs[i + 1] * t;
    };
    return Array.from({ length: N }, (_, n) => {
      let s = D(0);
      for (let k = 1; k <= M; k++) s += 2 * D(k * FS / N) * Math.cos(2 * Math.PI * k * (n - M) / N);
      return s / N;
    });
  }

  function stage(canvas, draw) {
    const ctx = canvas.getContext('2d');
    const s = { ctx, pen: K.pen(ctx), c: K.colors(), w: 1, h: 1, dpr: 1 };
    s.redraw = () => { ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); ctx.clearRect(0, 0, s.w, s.h); draw(s); };
    s.fit = () => {
      const r = canvas.getBoundingClientRect();
      s.w = Math.max(1, r.width); s.h = Math.max(1, r.height); s.dpr = Math.min(devicePixelRatio || 1, 2);
      const W = Math.round(s.w * s.dpr), H = Math.round(s.h * s.dpr);
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      s.redraw();
    };
    let queued = false;
    new ResizeObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; s.fit(); }); }).observe(canvas);
    const recolor = () => { s.c = K.colors(); s.redraw(); };
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
    new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    s.fit();
    return s;
  }

  const P = (cx, cy, r, a) => [cx + r * cosd(a), cy - r * sind(a)];
  function ringDash(s, cx, cy, r, color, width = 1.2, dash = [4, 4]) {
    const { ctx } = s; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  function wedge(s, cx, cy, r, a0, a1) {
    const { ctx, c } = s;
    ctx.fillStyle = c.accentSoft; ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -a0 * Math.PI / 180, -a1 * Math.PI / 180, true); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function drawWheels(s, { cx1, cx2, cy, R, angle, G, phi, pinned = null, small = false }) {
    const { pen, c } = s, fs = small ? 11 : 12;
    [cx1, cx2].forEach(cx => pen.line([[cx - R - 8, cy], [cx + R + 8, cy]], c.rule, 1));
    pen.ring(cx1, cy, R, c.ink, 1.5);
    pen.line([[cx1, cy], P(cx1, cy, R, angle)], c.soft, 1, [3, 3]);
    pen.dot(...P(cx1, cy, R, angle), small ? 5 : 6.5, c.input);
    ringDash(s, cx2, cy, R, c.soft);
    if (G > 0.005) pen.ring(cx2, cy, R * G, c.ink, 1.5);
    if (phi > 0.5) wedge(s, cx2, cy, Math.max(R * G - 8, 6), angle - phi, angle);
    if (pinned) ringDash(s, cx2, cy, R * pinned.G, c.input, 2, [6, 4]);
    pen.ring(...P(cx2, cy, R, angle), small ? 4 : 5.5, c.soft, 1.5);
    pen.line([[cx2, cy], P(cx2, cy, R * G, angle - phi)], c.ink, 1.2);
    pen.dot(...P(cx2, cy, R * G, angle - phi), small ? 5 : 6.5, c.accent);
    pen.text('into the route', cx1, cy - R - 14, { color: c.ink, size: fs + 1, font: 'body', weight: 600 });
    pen.text('out of the route', cx2, cy - R - 14, { color: c.ink, size: fs + 1, font: 'body', weight: 600 });
    pen.text('size 1.00', cx1, cy + R + 20, { color: c.soft, size: fs });
    if (small) { pen.text(`size ${fmt(G)}`, cx2, cy + R + 18, { color: c.accentInk, size: fs }); pen.text(`${degText(phi)} behind`, cx2, cy + R + 32, { color: c.accentInk, size: fs }); }
    else pen.text(`size ${fmt(G)} · ${degText(phi)} behind`, cx2, cy + R + 20, { color: c.accentInk, size: fs });
  }

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('route-lab').content.cloneNode(true));
    host.dataset.mode = mode;
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const fresh = () => ({ caseIx: 0, measured: BANDS.map(() => null), knobs: BANDS.map(() => 1), volume: 1, checked: null, solved: false, lastTone: null, boostOn: true });
    const state = { revealed: !explore, unlocked: false, tone: 2000, source: 'tone', routeOn: true, pinned: null, n: 0, running: true, ...fresh() };
    const routeH = () => (explore ? EAST : CASES[state.caseIx].h);
    const seenH = () => (state.routeOn ? EAST : [1]);
    const toneNow = () => (explore ? state.tone : state.lastTone);

    const sampleAt = (f, m) => cosd(turnOf(f) * m);
    const outAt = (f, m, h) => h.reduce((acc, hk, k) => acc + hk * sampleAt(f, m - k), 0);

    const st = stage($('stage'), s => {
      const { pen, c, w, h } = s;
      if (explore) {
        const f = state.tone, { G, phi } = response(seenH(), f), R = Math.min(72, w * 0.17), cy = 106;
        drawWheels(s, { cx1: w * 0.27, cx2: w * 0.73, cy, R, angle: turnOf(f) * state.n, G, phi, pinned: state.pinned });
        const top = 232, mid = top + 42, amp = 36, cols = 16, x0 = 34, cw = (w - x0 - 12) / cols;
        pen.line([[x0, mid], [w - 12, mid]], c.soft, 1);
        pen.text('1', x0 - 8, mid - amp + 4, { align: 'right', color: c.soft, size: 10 });
        pen.text('−1', x0 - 8, mid + amp + 4, { align: 'right', color: c.soft, size: 10 });
        for (let j = 0; j < cols; j++) {
          const m = state.n - cols + 1 + j, x = x0 + (j + 0.5) * cw, vi = sampleAt(f, m), vo = outAt(f, m, seenH());
          pen.line([[x - 3, mid], [x - 3, mid - amp * vi]], c.input, 1, [3, 3]); pen.ring(x - 3, mid - amp * vi, 2.6, c.input, 1.2);
          pen.line([[x + 3, mid], [x + 3, mid - amp * vo]], c.accent, 1.8); pen.dot(x + 3, mid - amp * vo, 3, c.accent);
        }
        pen.text(`n = ${state.n}`, w - 12, mid + amp + 18, { align: 'right', color: c.soft, size: 10 });
        pen.text(state.routeOn ? (w < 560 ? 'last 16 samples: in (teal), out' : 'the last 16 samples: in (teal, dashed) and out') : 'route off: out is the input itself', x0, top - 4, { align: 'left', color: c.soft, size: 10 });
        return;
      }
      const narrow = w < 560, h2 = routeH();
      const f = state.lastTone, wheelsW = narrow ? w : w * 0.38, R = narrow ? Math.min(44, w * 0.13) : Math.min(46, wheelsW * 0.17), cy = 86;
      if (f === null) { pen.text('Send a test tone to see', wheelsW / 2, cy - 4, { color: c.soft, size: 12 }); pen.text('it go through the route.', wheelsW / 2, cy + 14, { color: c.soft, size: 12 }); }
      else { const { G, phi } = response(h2, f); drawWheels(s, { cx1: wheelsW * 0.27, cx2: wheelsW * 0.73, cy, R, angle: turnOf(f) * state.n, G, phi, small: true }); pen.text(`test tone ${hz(f)} Hz`, wheelsW / 2, cy + R + 52, { color: c.ink, size: 12 }); }
      const A = narrow ? { x: 46, y: 216, w: w - 60, h: h - 266 } : { x: wheelsW + 40, y: 46, w: w - wheelsW - 54, h: h - 96 };
      const top = Math.max(1.5, ...(state.checked || []), ...state.measured.filter(m => m !== null)), vmax = Math.ceil(top * 1.15 * 2) / 2, tickStep = vmax > 3 ? 1 : 0.5, X = fq => A.x + fq / 4000 * A.w, Y = v => A.y + A.h - v / vmax * A.h;
      pen.text('each band: route alone, then route and boost', A.x, A.y - 26, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      Array.from({ length: Math.floor(vmax / tickStep) }, (_, i) => [(i + 1) * tickStep, `${Math.round((i + 1) * tickStep * 100)}%`]).forEach(([v, t]) => { pen.line([[A.x, Y(v)], [A.x + A.w, Y(v)]], c.rule, 1); pen.text(t, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 11 }); });
      pen.line([[A.x, Y(0.95)], [A.x + A.w, Y(0.95)]], c.soft, 1, [4, 3]); pen.line([[A.x, Y(1.05)], [A.x + A.w, Y(1.05)]], c.soft, 1, [4, 3]);
      BANDS.forEach((b, i) => {
        const x = X(b), m = state.measured[i];
        pen.text(narrow ? (b >= 1000 ? `${b / 1000}k` : String(b)) : hz(b), x, Y(0) + 16, { color: c.soft, size: 11 });
        if (m === null) pen.text('?', x, Y(0) - 6, { color: c.soft, size: 12 });
        else pen.rect(x - 5, Y(m), 10, Y(0) - Y(m), c.ink);
        if (state.checked) {
          const t = state.checked[i], ok = Math.round(t * 100) >= 95 && Math.round(t * 100) <= 105, y = Y(t);
          pen.dot(x, y, 5, ok ? c.input : c.accent);
          ok ? pen.tick(x, y - 14, c.input) : pen.cross(x, y - 14, c.accent);
        }
      });
      pen.text('Hz', A.x + A.w, Y(0) + 30, { align: 'right', color: c.soft, size: 11 });
    });

    const loop = K.loop(host, dt => {
      if (!state.running) return;
      loop.acc = (loop.acc || 0) + dt;
      if (loop.acc >= 0.6) { loop.acc = 0; state.n += 1; st.redraw(); }
    });

    function exploreWhy(f) {
      const { G, phi } = response(EAST, f);
      if (!state.routeOn) return 'Route off: the tone goes straight through, the same size and on time, so the out wheel matches the in wheel. Switch the route back on to see what it does to this tone.';
      if (f === 0) return '0 Hz never turns, so all three copies point the same way and simply add: 0.15 + 0.70 + 0.15 = 1. Gain 100%, phase 0°. (A constant does not move a speaker, so there is nothing to hear.)';
      if (f === 2000) return 'Worked example 1: one sample apart is a quarter turn, so the two 0.15 copies point opposite ways and cancel, leaving the 0.70 copy. Gain 70%, phase 90°: one sample behind.';
      if (f === 4000) return 'The dot flips every sample. The fresh and two-old copies (0.15 + 0.15) point one way and the one-old copy (0.70) the other: 0.70 − 0.30 = 0.40. Gain 40%, phase 180°, still exactly one sample late.';
      if (f < 2000) return `The two 0.15 copies sit ${degText(turnOf(f))} either side of the 0.70 copy. Below 2,000 Hz they lean with it, so they add part of their 0.30 to it: gain ${pct(G)}. The out dot trails by one sample’s turn, ${degText(phi)}.`;
      return `The two 0.15 copies sit ${degText(turnOf(f))} either side of the 0.70 copy. Above 2,000 Hz they lean against it, so the sum shrinks: gain ${pct(G)}. The out dot trails by one sample’s turn, ${degText(phi)}.`;
    }
    function pinText() {
      const p = state.pinned, now = response(seenH(), state.tone);
      const how = p.routeOn ? 'through the route' : 'with the route off';
      if (!state.routeOn) return `Pinned ${hz(p.f)} Hz ${how}: gain ${pct(p.G)}. The route is off now, so every tone comes out at 100%, on time.`;
      if (!p.routeOn) return `Pinned ${hz(p.f)} Hz with the route off: gain 100%. Now through the route, ${hz(state.tone)} Hz keeps ${pct(now.G)} and trails by ${degText(now.phi)}.`;
      if (p.f === state.tone) return `Pinned ${hz(p.f)} Hz: gain ${pct(p.G)}, phase ${degText(p.phi)}. Move the tone to compare.`;
      const hi = state.tone > p.f;
      return `Pinned ${hz(p.f)} Hz: gain ${pct(p.G)}, phase ${degText(p.phi)}. Now ${hz(state.tone)} Hz: gain ${pct(now.G)}, phase ${degText(now.phi)}. The ${hi ? 'higher' : 'lower'} tone keeps ${hi ? 'less' : 'more'} and trails by ${hi ? 'more' : 'fewer'} degrees, yet both come out exactly one sample late.`;
    }

    const together = i => response(routeH(), BANDS[i]).G * state.knobs[i] * state.volume;
    function checkMessage() {
      const t = BANDS.map((_, i) => together(i)), r = t.map(v => Math.round(v * 100));
      const bad = BANDS.map((b, i) => i).filter(i => r[i] < 95 || r[i] > 105);
      if (!bad.length) return null;
      const volOff = Math.abs(state.volume - 1) > 0.05, ratio = t[0] / t[t.length - 1], allSame = state.knobs.every(k => Math.abs(k - state.knobs[0]) < 1e-9);
      const flat = Math.max(...t) - Math.min(...t) < 0.03;
      if (volOff) {
        if (flat) return `Start with the volume knob: it is at ×${state.volume.toFixed(1)} and lifts every band at once, so every band reads about ${r[3]}%. The boosts are right: the recipe is flat. Set the volume back to ×1.0.`;
        if (allSame) return `Start with the volume knob: at ×${state.volume.toFixed(1)} it lifts every band by the same amount, so 500 Hz is at ${r[0]}% and 3,400 Hz at ${r[6]}%, and 3,400 Hz is still only ${pct(1 / ratio)} as strong as 500 Hz. It changes the loudness, not the recipe. Set it back to ×1.0 and use the band knobs.`;
        return `Start with the volume knob: it is at ×${state.volume.toFixed(1)} and scales every band at once, so the band readings are off for a reason that is not the boosts. Set it back to ×1.0, then check again.`;
      }
      if (allSame && Math.abs(state.knobs[0] - 1) > 0.005) return `One boost for every band is just another volume knob: 500 Hz comes out at ${r[0]}% and 3,400 Hz at ${r[6]}%. Each band lost a different amount, so each needs its own boost.`;
      const lines = bad.slice(0, 3).map(i => {
        const g = response(routeH(), BANDS[i]).G, k = state.knobs[i], east = 1 / response(EAST, BANDS[i]).G, name = `${hz(BANDS[i])} Hz comes out at ${r[i]}%`;
        if (Math.abs(k - g) < 0.015 && g < 0.98) return `${name}: × ${k.toFixed(2)} is what this band keeps, so the route’s loss is applied a second time. The boost has to undo the loss, not repeat it.`;
        if (Math.abs(k - (2 - g)) < 0.02 && Math.abs(g - 1) > 0.02) return `${name}: × ${k.toFixed(2)} adds back the ${Math.round((1 - g) * 100)} points the route took, but a boost multiplies what is left, so it falls short. Divide instead of adding.`;
        if (Math.abs(k - Math.round(east * 100) / 100) < 0.006 && Math.abs(east - 1 / g) > 0.03) return `${name}: × ${k.toFixed(2)} is the east route’s boost for this band, but this route keeps ${pct(g)} here, not ${pct(1 / east)}. Use what you measured on this route.`;
        return `${name}, ${r[i] < 95 ? 'too little: turn its knob up' : 'too much: turn its knob down'}.`;
      });
      const more = bad.length > 3 ? ` ${bad.length - 3} more band${bad.length > 4 ? 's are' : ' is'} also outside 95% to 105%.` : '';
      return `${lines.join(' ')}${more}`;
    }

    function render8k() {
      if (explore) {
        if (state.source === 'tone') { const x = Float32Array.from({ length: FS }, (_, n) => 0.5 * sampleAt(state.tone, n)); return state.routeOn ? convLoop(x, EAST) : x; }
        const x = new Float32Array(VOICE.length + FS / 2); x.set(VOICE);
        return state.routeOn ? conv(x, EAST) : x;
      }
      const x = new Float32Array(VOICE.length + FS / 2); x.set(VOICE);
      let y = conv(x, routeH());
      if (state.boostOn) y = conv(y, boostFilter(state.knobs));
      return y.map(v => Math.max(-1, Math.min(1, v * state.volume)));
    }
    function fixPeak() {
      const x = new Float32Array(VOICE.length); x.set(VOICE);
      let y = conv(x, routeH());
      if (state.boostOn) y = conv(y, boostFilter(state.knobs));
      return y.reduce((m, v) => Math.max(m, Math.abs(v)), 0) * state.volume;
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : (explore ? 'Play' : 'Play the caller'); $('now').textContent = nowText(); } });
    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Press Play to hear the tone or a caller, through the route or straight.' : 'Not playing. Press Play the caller to hear this route.';
      if (explore) {
        const what = state.source === 'tone' ? `the ${hz(state.tone)} Hz tone` : 'a caller’s voice';
        const edge = state.source === 'tone' && state.tone === 4000 ? ' A tone right at 4,000 Hz may sound faint or vanish on your speaker: it sits on the line’s top edge, next lesson’s story.' : state.source === 'tone' && state.tone === 0 ? ' 0 Hz is a constant: silence.' : '';
        return `Playing ${what} ${state.routeOn ? (state.source === 'tone' ? `through the east route (it keeps ${pct(response(EAST, state.tone).G)} of this tone)` : 'through the east route') : 'straight, without the route'}.${state.source === 'voice' ? ` The wheels still show the ${hz(state.tone)} Hz tone; the slider does not change the voice.${state.routeOn ? ' Switch the route off to hear the difference.' : ''}` : ''}${edge}`;
      }
      const peak = fixPeak(), clip = peak > 1;
      return `Playing the caller on the ${CASES[state.caseIx].name}, boost ${state.boostOn ? 'on' : 'off'}, volume ×${state.volume.toFixed(1)}.${clip ? ` The loudest samples ask for ${fmt(peak)} and are cut flat at 1: lesson 1’s clipping buzz is back.` : ''}`;
    }

    function buildBands() {
      const box = $('bands'); box.replaceChildren();
      const tip = document.createElement('p'); tip.className = 'note'; tip.textContent = 'Arrow keys move a knob by 0.05, Page Up and Page Down by 0.25; hold Shift with an arrow for 0.01.';
      box.append(tip);
      BANDS.forEach((b, i) => {
        const row = document.createElement('div'); row.className = 'band-row';
        const name = document.createElement('span'); name.className = 'b-name'; name.textContent = `${hz(b)} Hz`;
        const send = document.createElement('button'); send.type = 'button'; send.textContent = 'Send test tone'; send.setAttribute('aria-label', `Send the ${hz(b)} Hz test tone`);
        const info = document.createElement('span'); info.className = 'b-info';
        const keeps = document.createElement('span'); keeps.className = 'b-keeps';
        const tog = document.createElement('span'); tog.className = 'b-together';
        info.append(keeps, document.createTextNode(' · '), tog);
        const knob = document.createElement('div'); knob.className = 'b-knob';
        const id = `${uid}knob-${b}`;
        const lab = document.createElement('label'); lab.htmlFor = id; lab.textContent = 'Boost ';
        const out = document.createElement('output'); lab.append(out);
        const input = document.createElement('input'); input.type = 'range'; input.setAttribute('aria-label', `Boost for the ${hz(b)} Hz band`); input.min = '0.5'; input.max = '3'; input.step = '0.01'; input.id = id;
        knob.append(lab, input);
        row.append(name, send, info, knob);
        box.append(row);
        send.addEventListener('click', () => {
          const h2 = routeH(), x = Array.from({ length: 120 }, (_, n) => 0.5 * sampleAt(b, n)), y = conv(Float32Array.from(x), h2).slice(40);
          state.measured[i] = Math.sqrt(2 * y.reduce((s, v) => s + v * v, 0) / y.length) / 0.5;
          state.lastTone = b; state.n = 0; render();
          (input.disabled ? send : input).focus();
        });
        input.addEventListener('keydown', e => {
          const big = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.25, PageDown: -0.25 }[e.key];
          if (!big || (e.shiftKey && e.key.startsWith('Arrow'))) return;
          e.preventDefault();
          input.value = String(Math.min(3, Math.max(0.5, Math.round((Number(input.value) + big) * 100) / 100)));
          input.dispatchEvent(new Event('input'));
        });
        input.addEventListener('input', () => { state.knobs[i] = Math.round(Number(input.value) * 100) / 100; state.checked = null; state.solved = false; render(); });
        row.ui = { send, keeps, tog, out, input };
      });
    }

    function render() {
      const f = toneNow();
      if (explore) {
        const { G, phi } = response(seenH(), state.tone);
        $('tone').value = state.tone; $('tone-out').textContent = `${hz(state.tone)} Hz`;
        $('tone').disabled = !state.revealed; $('pin').disabled = !state.revealed;
        $('result').textContent = `${hz(state.tone)} Hz · turns ${degText(turnOf(state.tone))} per sample · ${state.routeOn ? '' : 'route off · '}gain ${fmt(G, 3)} (${pct(G)}) · phase ${degText(phi)}`;
        $('tone').setAttribute('aria-valuetext', `${hz(state.tone)} Hz`);
        $('why').textContent = state.revealed ? exploreWhy(state.tone) : 'Answer the question above to unlock the tone slider.';
        $('compare').hidden = !state.pinned; if (state.pinned) $('compare').textContent = pinText();
        $('key-pin').hidden = !state.pinned;
        host.querySelectorAll('[data-source]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.source === state.source)));
        $('route').setAttribute('aria-pressed', String(state.routeOn));
        $('stage').setAttribute('aria-label', `Two wheels for the ${hz(state.tone)} Hz tone. The output dot is ${pct(G)} the size of the input dot and trails it by ${degText(phi)}. Below, the last 16 input and output samples.`);
      } else {
        const c = CASES[state.caseIx];
        $('task-text').textContent = c.text;
        const rows = [...$('bands').querySelectorAll('.band-row')];
        rows.forEach((row, i) => {
          const u = row.ui, m = state.measured[i];
          u.keeps.textContent = m === null ? 'keeps ?' : `keeps ${pct(m)}`;
          u.input.disabled = !state.unlocked || m === null;
          u.input.value = state.knobs[i]; u.out.textContent = `×${state.knobs[i].toFixed(2)}`; u.input.setAttribute('aria-valuetext', `times ${state.knobs[i].toFixed(2)}`);
          if (state.checked) { const r = Math.round(state.checked[i] * 100); u.tog.textContent = `together ${r}%`; u.tog.classList.toggle('k-bad', r < 95 || r > 105); }
          else { u.tog.textContent = 'together ?'; u.tog.classList.remove('k-bad'); }
        });
        $('volume').disabled = !state.unlocked; $('volume').value = state.volume; $('volume-out').textContent = `×${state.volume.toFixed(1)}`; $('volume').setAttribute('aria-valuetext', `times ${state.volume.toFixed(1)}`);
        const done = state.measured.filter(m => m !== null).length;
        $('result').textContent = `${c.name} · ${done} of 7 bands measured${state.checked ? ` · ${state.checked.filter(t => { const r = Math.round(t * 100); return r >= 95 && r <= 105; }).length} of 7 on target` : ''}`;
        $('boost').setAttribute('aria-pressed', String(state.boostOn)); $('boost').textContent = state.boostOn ? 'Boost on' : 'Boost off';
        $('another').hidden = !state.solved;
        if (!state.unlocked) $('why').textContent = 'Answer the question above to unlock the knobs. You can send test tones already.';
        else if (!state.checked) $('why').textContent = done < 7 ? 'Send a test tone down every band: its reading says how much of the tone the route keeps. A band’s knob opens once you have measured it.' : 'All seven measured. Set each knob so route and boost together keep that band at full strength, then press Check the line.';
        $('stage').setAttribute('aria-label', `The ${c.name}: ${done} of 7 bands measured${f !== null ? `, last test tone ${hz(f)} Hz` : ''}.`);
      }
      st.redraw();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    function runCheck() {
      if (state.measured.some(m => m === null)) {
        const left = BANDS.filter((_, i) => state.measured[i] === null).map(b => `${hz(b)} Hz`);
        $('why').textContent = `Measure first: you have not sent the test tone for ${joinList(left)}. Without it you do not know what that band lost.`;
        return;
      }
      state.checked = BANDS.map((_, i) => together(i));
      const msg = checkMessage();
      if (msg) { state.solved = false; render(); $('why').textContent = msg; return; }
      const first = !state.solved; state.solved = true;
      render();
      const worst = state.checked.reduce((b, t, i) => (Math.abs(t - 1) > Math.abs(state.checked[b] - 1) ? i : b), 0);
      const wr = Math.round(state.checked[worst] * 100);
      $('why').textContent = `Fixed. Every band comes out between 95% and 105% (${wr === 100 ? 'all at 100%' : `furthest off: ${hz(BANDS[worst])} Hz at ${wr}%`}). Press Play the caller: they sound like they have stepped out from behind the wall, one sample late and about as loud as they spoke.${state.caseIx === 0 ? '' : ' Same method, different route.'}`;
      if (first) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
      $('another').focus();
    }

    function buildAsk() {
      if (explore) {
        K.ask($('ask'), {
          question: 'At 4,000 Hz the dot flips every sample. Will the route keep more of it than of 2,000 Hz (70%), the same, or less?',
          options: [['more', 'More than 70%'], ['same', 'The same, 70%'], ['less', 'Less than 70%']], right: 'less',
          hints: { more: 'At 4,000 Hz, copies one sample apart point opposite ways. Does the big 0.70 copy get help from the two 0.15 copies, or a fight?', same: 'At 0 Hz the route keeps 100%, at 2,000 Hz 70%. Does that look like a line that stays flat?' },
          explain: '40%. The fresh and two-old copies (0.15 + 0.15) point one way and the one-old copy (0.70) the other: 0.70 − 0.30 = 0.40. The slider is yours now.',
          solved: state.revealed ? 'right' : null, onSolved: () => { state.revealed = true; render(); document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' })); }, focusAfter: () => $('tone'),
        });
        return;
      }
      K.ask($('ask'), {
        question: 'Predict first: suppose you set every band’s knob to the same × 1.30. Where will the 500 Hz band and the 3,400 Hz band come out, route and boost together?',
        options: [['both', 'Both at about 100%'], ['split', '500 Hz over 105%, 3,400 Hz under 95%'], ['over', 'Both over 105%']], right: 'split',
        hints: { both: 'Low tones walk through almost untouched. What does × 1.30 do to a band the route barely touched?', over: 'A muffled route keeps the least at the top. Is × 1.30 enough to bring a badly cut band all the way back?' },
        explain: 'One number for every band lifts the vowel past full strength before the consonant gets back: each band lost a different amount. Now measure, set, and check.',
        solved: state.unlocked ? 'right' : null, onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => $('bands').querySelector('button'),
      });
    }

    if (!explore) {
      ['tone-control', 'source', 'route', 'pause', 'next', 'pin', 'jump', 'key-explore'].forEach(k => { $(k).hidden = true; });
      ['task', 'bands', 'volume-control', 'check', 'boost', 'key-fix'].forEach(k => { $(k).hidden = false; });
      $('play').textContent = 'Play the caller';
      buildBands();
    }
    buildAsk();

    $('tone').addEventListener('input', () => { state.tone = Number($('tone').value); render(); });
    host.querySelectorAll('[data-source]').forEach(b => b.addEventListener('click', () => { state.source = b.dataset.source; render(); }));
    $('route').addEventListener('click', () => { state.routeOn = !state.routeOn; render(); });
    $('pause').addEventListener('click', () => { state.running = !state.running; $('pause').textContent = state.running ? 'Pause the wheels' : 'Run the wheels'; });
    $('next').addEventListener('click', () => { state.n += 1; st.redraw(); });
    $('pin').addEventListener('click', () => { const r = response(seenH(), state.tone); state.pinned = { f: state.tone, routeOn: state.routeOn, ...r }; render(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('boost').addEventListener('click', () => { state.boostOn = !state.boostOn; render(); });
    $('volume').addEventListener('input', () => { state.volume = Math.round(Number($('volume').value) * 10) / 10; state.checked = null; state.solved = false; render(); });
    $('check').addEventListener('click', runCheck);
    $('another').addEventListener('click', () => {
      audio.stop();
      Object.assign(state, fresh(), { caseIx: (state.caseIx + 1) % CASES.length });
      render(); $('bands').querySelector('button').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) { Object.assign(state, { tone: 2000, source: 'tone', routeOn: true, pinned: null, n: 0, running: !K.reduced.matches }); $('pause').textContent = 'Pause the wheels'; }
      else Object.assign(state, fresh(), { caseIx: state.caseIx });
      render(); $('reset').focus();
    });
    if (K.reduced.matches) { state.running = false; $('pause').hidden = true; }
    loop.start();
    render();
    return { stop: () => audio.stop() };
  }

  function gate(anchor, hide, opts) {
    if (!anchor) return;
    const box = document.createElement('div'), note = document.createElement('p');
    box.className = 'k-gate'; note.className = 'k-gate-note'; note.textContent = opts.note;
    anchor.before(box, note);
    hide.forEach(el => { el.hidden = true; });
    K.ask(box, { ...opts, onSolved: () => { hide.forEach(el => { el.hidden = false; }); note.hidden = true; } });
  }
  const wheelFig = document.getElementById('figure-wheel');
  if (wheelFig) gate(wheelFig, [wheelFig, wheelFig.nextElementSibling].filter(el => el && el.classList.contains('table') || el === wheelFig), {
    note: 'The figure and the table open once you answer.',
    question: 'Before the figure: 3,000 Hz sits between 2,000 Hz (90° per sample) and 4,000 Hz (180°). Its dot starts at the right. Where is it after two samples?',
    options: [['top', 'At the top, reading 0'], ['bottom', 'Straight down, reading 0'], ['left', 'At the far left, reading −1'], ['right', 'Back at the right, reading +1']], right: 'bottom',
    hints: { top: 'That is where 2,000 Hz sits after one sample. How far does 3,000 Hz turn each time, and what is twice that?', left: 'That is 2,000 Hz after two samples, 2 × 90°. 3,000 Hz turns further each time.', right: 'That is 4,000 Hz after two flips. 3,000 Hz turns less than half a turn per sample.' },
    explain: '3,000 Hz turns 135° per sample, 45° for every 1,000 Hz, so two samples make 270°: straight down, where the left-right reading is 0. The figure shows all five wheels.',
  });
  const respFig = document.getElementById('figure-response');
  if (respFig) {
    const paren = respFig.previousElementSibling, table = paren && paren.previousElementSibling;
    if (table && table.classList.contains('table')) gate(table, [table, paren, respFig], {
      note: 'The table and the figure open once you answer.',
      question: 'Before the table: an “s” lives around 3,000 Hz and a vowel’s swell around 500 Hz. After the route, how strong is the “s” compared with the vowel?',
      options: [['same', 'About as strong'], ['half', 'About half as strong'], ['tenth', 'About a tenth as strong']], right: 'half',
      hints: { same: 'The vowel keeps nearly all of itself. Does the 3,000 Hz tone keep nearly all too?', tenth: 'Even 4,000 Hz keeps 40% through this route. Could 3,000 Hz end up ten times weaker than the vowel?' },
      explain: 'About half: 0.488 against 0.977, a ratio of 0.50. The vowel walks through; the “s” is cut in half. The table and the figure show the rest.',
    });
  }

  const hints = [...document.querySelectorAll('.table')].map(t => {
    const p = document.createElement('p'); p.className = 'k-scroll-hint'; p.textContent = 'Scroll the table sideways for the rest.'; p.hidden = true;
    t.after(p);
    return [t, p];
  });
  const fitHints = () => hints.forEach(([t, p]) => { p.hidden = t.scrollWidth <= t.clientWidth + 2; });
  let hintTimer = 0;
  addEventListener('resize', () => { clearTimeout(hintTimer); hintTimer = setTimeout(fitHints, 150); });
  document.addEventListener('k:solved', () => setTimeout(fitHints, 50));
  document.addEventListener('click', e => { if (e.target.closest('.k-working-open, .k-ask')) setTimeout(fitHints, 50); });
  fitHints();

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const m = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    m.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
