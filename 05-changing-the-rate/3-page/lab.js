(() => {
  const K = window.Kit;
  const { fmt, hz } = K;
  const cosd = d => Math.cos(d * Math.PI / 180), sind = d => Math.sin(d * Math.PI / 180);
  const pct1 = v => `${(v * 100).toFixed(1)}%`;
  const pctV = v => ((v > 1.1 && v < 1.1005) || (v < 0.9 && v > 0.8995) ? `${(v * 100).toFixed(2)}%` : `${(v * 100).toFixed(1)}%`);
  const pct0 = v => `${Math.round(v * 100)}%`;
  const dg = v => `${Number(v.toFixed(2))}°`;

  const VOICE8 = K.wav(window.LESSON_CALL);
  const WIDE16 = K.wav(window.LESSON_WIDE);

  const players = {};
  const audio = {
    listeners: new Set(),
    current: null,
    play(rate, render) {
      Object.entries(players).forEach(([r, p]) => { if (Number(r) !== rate && p.playing) p.stop(); });
      if (!players[rate]) players[rate] = K.player({ rate, gain: 0.3, onChange: () => audio.listeners.forEach(fn => fn()) });
      audio.current = rate;
      players[rate].play(render);
    },
    refresh(rate, render) {
      const p = players[audio.current];
      if (!p || !p.playing) return;
      if (rate !== audio.current) { const at = p.ctx.currentTime - p.startedAt; p.stop(); audio.play(rate, render); return at; }
      p.render = render; p.refresh();
    },
    stop() { Object.values(players).forEach(p => { if (p.playing) p.stop(); }); },
    get playing() { return Object.values(players).some(p => p.playing); },
  };

  const weights = N => {
    if (N === 3) return [0.25, 0.5, 0.25];
    const c = (N - 1) / 2;
    return Array.from({ length: N }, (_, i) => { const j = i - c; return j === 0 ? 0.5 : Math.sin(Math.PI * j / 2) / (Math.PI * j); });
  };
  const share = (N, f) => {
    const p = 360 * f / 16000;
    if (N === 3) return Math.abs(0.5 * (1 + cosd(p)));
    let s = 0.5;
    for (let j = 1; j <= (N - 1) / 2; j++) s += 2 * Math.sin(Math.PI * j / 2) / (Math.PI * j) * cosd(j * p);
    return Math.abs(s);
  };
  const convolve = (x, h, gain) => {
    const c = (h.length - 1) / 2, out = new Float32Array(x.length), taps = h.map((w, i) => [i - c, w * gain]).filter(([, w]) => Math.abs(w) > 1e-12);
    for (let n = 0; n < x.length; n++) {
      let s = 0;
      for (const [j, w] of taps) { const i = n - j; if (i >= 0 && i < x.length) s += w * x[i]; }
      out[n] = s;
    }
    return out;
  };
  const zeroStuff = x => { const y = new Float32Array(x.length * 2); x.forEach((v, i) => { y[2 * i] = v; }); return y; };
  const keepEven = x => Float32Array.from({ length: Math.floor(x.length / 2) }, (_, i) => x[2 * i]);

  const CASES = [
    { vlo: 300, vhi: 2800, shortest: true, name: 'the gateway', text: 'Warm-up job from the bridge team: a walkie-talkie gateway at 8,000 samples/s on one side and 16,000 on the other. It only promises voice from 300 to 2,800 Hz, so its images and aliases live from 5,200 to 7,700 Hz. Spec: voice 90% to 110%, everything from 5,200 to 7,700 Hz under 8%. Its chip is cheap, so the bridge team wants the shortest rule that passes, in both directions.' },
    { vlo: 300, vhi: 3400, name: 'your bridge', text: 'Now your own bridge. Two calls wait on the bridge. Going up, your colleague’s recorded voice must reach the wideband line without its upside-down twin. Going down, a wideband caller full of “s” sounds must reach your line without squeals. Every voice tone from 300 to 3,400 Hz must come out between 90% and 110%, and every image or alias, from 4,600 to 7,700 Hz, under 8%. Fix both directions.' },
  ];
  const shareAt = (dir, len, place, f) => {
    if (len === 0) return dir === 'up' ? 0.5 : 1;
    if (dir === 'down' && place === 'after') return share(len, 2 * (f > 4000 ? 8000 - f : f));
    return share(len, f);
  };
  const lenName = n => (n === 0 ? 'no rule' : n === 3 ? 'the neighbor average' : `the ${n}-sample rule`);

  function metrics(c, dir, len, place) {
    const ilo = 8000 - c.vhi, ihi = 8000 - c.vlo;
    const flat = v => ({ vmin: v, vmax: v, imax: v, iat: ilo, vminAt: c.vlo, vmaxAt: c.vlo });
    let m;
    if (len === 0) m = flat(dir === 'up' ? 0.5 : 1);
    else {
      m = { vmin: Infinity, vmax: -Infinity, imax: -Infinity, iat: ilo };
      for (let f = c.vlo; f <= c.vhi; f += 5) { const v = shareAt(dir, len, place, f); if (v < m.vmin) { m.vmin = v; m.vminAt = f; } if (v > m.vmax) { m.vmax = v; m.vmaxAt = f; } }
      for (let f = ilo; f <= ihi; f += 5) { const v = shareAt(dir, len, place, f); if (v > m.imax) { m.imax = v; m.iat = f; } }
    }
    m.voiceOK = m.vmin >= 0.9 && m.vmax <= 1.1;
    m.imageOK = m.imax < 0.08;
    m.budget = len <= 31;
    m.pass = m.voiceOK && m.imageOK && m.budget;
    return m;
  }
  const passLens = (c, dir) => [3, 7, 15, 31, 47].filter(n => metrics(c, dir, n, 'before').pass);

  function hatch(ctx, x, y, w, h, color) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    for (let t = -h; t < w + h; t += 6) { ctx.beginPath(); ctx.moveTo(x + t, y + h); ctx.lineTo(x + t + h, y); ctx.stroke(); }
    ctx.restore();
  }

  function mountBridge(host, mode) {
    host.replaceChildren(document.getElementById('bridge-lab').content.cloneNode(true));
    host.dataset.mode = mode;
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = explore
      ? { f: 1000, phase: 'q1', pinned: null, source: false, t: 0 }
      : { caseIx: 0, dir: 'up', up: { len: 0 }, down: { len: 0, place: 'after' }, asked: false, solved: false, announced: false, source: false };
    const unlocked = () => (explore ? st.phase === 'free' : st.asked);

    const bridgeOut = (f, count) => Array.from({ length: count }, (_, m) => (m % 2 ? 0 : cosd(360 * f * (m / 2) / 8000)));
    const toneList = f => K.tones(Float32Array.from(bridgeOut(f, 160)), 16000).filter(t => t.size > 0.005);

    function drawWheel(s, cx, cy, R, title, sub, dots) {
      const { pen, c } = s;
      pen.line([[cx - R - 10, cy], [cx + R + 10, cy]], c.soft, 1);
      pen.ring(cx, cy, R, c.ink, 1.3);
      pen.text(title, cx, cy - R - 26, { color: c.ink, size: 13, font: 'body', weight: 600 });
      pen.text(sub, cx, cy - R - 10, { color: c.soft, size: 11 });
      dots.forEach(d => {
        d.trail.forEach((deg, i) => {
          const x = cx + R * cosd(deg), y = cy - R * sind(deg), a = 0.25 + 0.55 * (i + 1) / d.trail.length;
          d.ghost ? s.pen.ring(x, y, 3.5, c.accent, 1.3) : pen.dot(x, y, 2.6, c.ink, a);
        });
        const x = cx + R * cosd(d.deg), y = cy - R * sind(d.deg);
        pen.line([[cx, cy], [x, y]], d.ghost ? c.accent : c.ink, 1.4, d.ghost ? [4, 3] : []);
        pen.line([[x, y], [x, cy]], c.soft, 1, [2, 3]);
        if (d.ghost) { pen.dot(x, y, 7, c.paper); pen.ring(x, y, 7, c.accent, 2.2); } else pen.dot(x, y, 5, c.ink);
      });
    }

    function drawStrip(s, A, f, hi) {
      const { pen, c } = s, count = 24, y0 = A.y + A.h / 2, sc = A.h / 2 / 1.15, step = A.w / count;
      const v = bridgeOut(f, count);
      pen.text('zeros in: 16,000 samples/s', A.x, A.y - 8, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      pen.line([[A.x, y0], [A.x + A.w, y0]], c.soft, 1);
      v.forEach((val, m) => {
        const x = A.x + (m + 0.5) * step, y = y0 - val * sc;
        if (m === hi) pen.ring(x, y, 8, c.input, 2);
        if (m % 2) { pen.dot(x, y0, 3.3, c.paper); pen.ring(x, y0, 3.3, c.ink, 1.3); }
        else { pen.line([[x, y0], [x, y]], c.ink, 1.8); pen.dot(x, y, 3.3, c.ink); }
        if (m % 4 === 0) pen.text(m ? String(m) : 'm = 0', x, A.y + A.h + 14, { color: c.soft, size: 10 });
      });
    }

    function drawMeter(s, A, f, shown) {
      const { pen, c, ctx } = s, X = v => A.x + v / 8000 * A.w, Y = v => A.y + A.h - v / 1.1 * A.h;
      pen.text('frequency meter, wideband side', A.x, A.y - 12, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      [[0.5, 'half'], [1, 'full']].forEach(([v, l]) => { pen.line([[A.x, Y(v)], [A.x + A.w, Y(v)]], c.rule, 1); pen.text(l, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }); });
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      pen.line([[X(4000), A.y - 2], [X(4000), Y(0)]], c.soft, 1, [3, 4]);
      const ticks = A.w < 420 ? [0, 2000, 4000, 6000, 8000] : [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
      ticks.forEach(t => pen.text(t ? hz(t) : '0', X(t), Y(0) + 15, { color: c.soft, size: 10 }));
      pen.text('Hz', A.x + A.w, Y(0) + 29, { align: 'right', color: c.soft, size: 10 });
      const bw = A.w < 420 ? 10 : 14;
      if (st.pinned) st.pinned.tones.forEach(t => { const x = X(t.f) - bw / 2 - 3, y = Y(t.size); pen.line([[x, Y(0)], [x, y], [x + bw + 6, y], [x + bw + 6, Y(0)]], c.input, 1.5, [4, 3]); });
      if (!shown) { pen.text('?', X(f), Y(0.62), { color: c.soft, size: 18 }); return; }
      const tones = toneList(f);
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      tones.forEach((t, i) => {
        const x = Math.min(Math.max(X(t.f) - bw / 2, A.x), A.x + A.w - bw), y = Y(t.size), isHum = Math.abs(t.f - f) < 1;
        if (isHum) pen.rect(x, y, bw, Y(0) - y, c.ink);
        else { pen.rect(x, y, bw, Y(0) - y, c.accentSoft); hatch(ctx, x, y, bw, Y(0) - y, c.accent); pen.line([[x, Y(0)], [x, y], [x + bw, y], [x + bw, Y(0)]], c.accent, 1.5); }
        const lab = `${hz(t.f)} Hz · ${pct0(t.size)}`, tw = ctx.measureText(lab).width;
        let align, lx;
        if (tones.length < 2 && Math.abs(t.f - 4000) < 1) { align = 'left'; lx = x + bw + 6; }
        else if (tones.length < 2) { align = 'center'; lx = Math.min(Math.max(x + bw / 2, A.x + tw / 2), A.x + A.w - tw / 2); }
        else if (i === 0) { align = 'right'; lx = Math.min(x + bw, X(4000) - 5); if (lx - tw < A.x) { align = 'left'; lx = A.x; } }
        else { align = 'left'; lx = Math.max(x, X(4000) + 5); if (lx + tw > A.x + A.w) { align = 'right'; lx = A.x + A.w; } }
        pen.text(lab, lx, y - 8 - (tones.length > 1 && i === 1 && Math.abs(X(tones[1].f) - X(tones[0].f)) < tw + 12 && align === 'right' ? 16 : 0), { align, color: isHum ? c.ink : c.accentInk, size: 11, weight: 500 });
      });
    }

    function drawFix(s) {
      const { pen, c, w, h } = s, cs = CASES[st.caseIx], cfg = st[st.dir];
      const A = { x: 44, y: 34, w: w - 60, h: h - 86 }, X = v => A.x + v / 8000 * A.w, Y = v => A.y + A.h - v / 1.15 * A.h;
      const ilo = 8000 - cs.vhi, ihi = 8000 - cs.vlo, m = metrics(cs, st.dir, cfg.len, cfg.place);
      pen.text(w < 520 ? `going ${st.dir}: share of each tone` : st.dir === 'up' ? 'going up: share of each tone that reaches the wideband line' : 'going down: share of each tone that reaches your line', A.x, 16, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      [cs.vhi, ilo].forEach(f => pen.line([[X(f), A.y + 20], [X(f), Y(0)]], c.soft, 1.5));
      pen.rect(X(cs.vlo), Y(1.1), X(cs.vhi) - X(cs.vlo), Y(0.9) - Y(1.1), c.inputSoft);
      pen.line([[X(cs.vlo), Y(1.1)], [X(cs.vhi), Y(1.1)]], c.input, 1, [5, 4]); pen.line([[X(cs.vlo), Y(0.9)], [X(cs.vhi), Y(0.9)]], c.input, 1, [5, 4]);
      pen.rect(X(ilo), Y(0.08), X(ihi) - X(ilo), Y(0) - Y(0.08), c.inputSoft);
      pen.line([[X(ilo), Y(0.08)], [X(ihi), Y(0.08)]], c.input, 1, [5, 4]);

      [[0, '0%'], [0.5, '50%'], [1, '100%']].forEach(([v, l]) => pen.text(l, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }));
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      const ticks = A.w < 420 ? [0, 2000, 4000, 6000, 8000] : [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
      ticks.forEach(t => pen.text(t ? hz(t) : '0', X(t), Y(0) + 15, { color: c.soft, size: 10 }));
      pen.text(st.dir === 'up' ? 'above 4,000 Hz: images' : 'above 4,000 Hz: tones that fold onto 8,000 − tone', A.x + A.w, Y(0) + 30, { align: 'right', color: c.soft, size: 10 });
      const pts = [];
      for (let i = 0; i <= 400; i++) { const f = i * 20; pts.push([X(f), Y(shareAt(st.dir, cfg.len, cfg.place, f))]); }
      pen.line(pts, c.ink, 2.2);
      const wx = X(m.iat), wy = Y(m.imax);
      pen.dot(wx, wy, 4.5, m.imageOK ? c.input : c.accent);
      const label = `${pct1(m.imax)} at ${hz(m.iat)} Hz`;
      s.ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      const tw = s.ctx.measureText(label).width, lines = [X(cs.vhi), X(ilo)], ly = Math.max(wy - 8, A.y + 30);
      const clear = (a, b) => a >= A.x && b <= A.x + A.w && lines.every(x => x < a - 3 || x > b + 3);
      const spot = clear(wx + 8, wx + 8 + tw) ? [wx + 8, ly, 'left'] : clear(wx - 8 - tw, wx - 8) ? [wx - 8, ly, 'right'] : [A.x + A.w, A.y + 12, 'right'];
      pen.text(label, spot[0], spot[1], { align: spot[2], color: m.imageOK ? c.ink : c.accentInk, size: 11, weight: 500 });
    }

    let loop = null;
    const stage = K.stage($('stage'), s => {
      const { w } = s, narrow = w < 640;
      if (!explore) { drawFix(s); return; }
      const shown = st.phase !== 'q1' || st.f === 1000;
      const n16 = Math.floor(st.t), n8 = Math.floor(n16 / 2), trailN = 4;
      const anim = Boolean(loop && loop.running);
      const at16 = (f, m) => 360 * f * m / 16000, at8 = (f, n) => 360 * f * n / 8000;
      const trail = (fn, k) => Array.from({ length: trailN }, (_, i) => k - trailN + i).filter(i => i >= 0).map(fn);
      const k16 = anim ? n16 : 4, k8 = anim ? n8 : 4;
      const ghostF = 8000 - st.f;
      const dots16 = [{ deg: at16(st.f, k16), trail: trail(i => at16(st.f, i), k16) }];
      if (shown) dots16.unshift({ deg: at16(ghostF, k16), trail: trail(i => at16(ghostF, i), k16), ghost: true });
      const R = narrow ? Math.min(54, w / 4 - 22) : 58;
      const W1 = narrow ? [w / 4, 92] : [84, 104], W2 = narrow ? [3 * w / 4, 92] : [236, 104];
      drawWheel(s, W1[0], W1[1], R, 'your line, 8,000/s', `${dg(360 * st.f / 8000)} per sample`, [{ deg: at8(st.f, k8), trail: trail(i => at8(st.f, i), k8) }]);
      drawWheel(s, W2[0], W2[1], R, 'wideband, 16,000/s', shown ? `${dg(360 * st.f / 16000)} and ${dg(360 * ghostF / 16000)}` : `${dg(360 * st.f / 16000)} per sample`, dots16);
      const strip = narrow ? { x: 16, y: 196, w: w - 28, h: 90 } : { x: 330, y: 44, w: w - 344, h: 110 };
      drawStrip(s, strip, st.f, anim ? n16 % 24 : -1);
      const meter = narrow ? { x: 34, y: 346, w: w - 52, h: 150 } : { x: 44, y: 226, w: w - 64, h: 150 };
      drawMeter(s, meter, st.f, shown);
    }, { height: w => (explore ? (w < 640 ? 560 : 430) : (w < 640 ? 330 : 300)) });

    loop = K.loop(host, dt => { st.t = (st.t + dt * 1.6) % 96; stage.redraw(); });
    if (explore) loop.start();

    function exploreWhy() {
      const f = st.f, g = 8000 - f;
      if (st.phase === 'q1' && f === 1000) return 'The bug as the tickets describe it: the 1,000 Hz hum arrives at half height, with a ghost at 7,000 Hz just as tall. Answer the question above to move the hum.';
      if (f === 0) return '0 Hz, a steady level: 1, 1, 1 on your line becomes 1, 0, 1, 0. That is half the level plus half of 8,000 Hz, the flip 1, −1, 1, −1. Even a hum with no pitch gets a ghost, at the very top of the wideband line.';
      if (f === 4000) return '4,000 Hz, your line’s limit: on the wideband line the hum turns 90° per sample and its ghost turns the rest of the flip, also 90°. They are the same tone, so the two halves stack into one tone at full height: 1, 0, −1, 0. A tone on the mirror line is its own image.';
      const apart = g - f;
      const where = f < 300 ? 'The hum is below the voice band. ' : f <= 3400 ? '' : 'The hum is above the voice band, near the mirror. ';
      const gap = apart >= 4000 ? 'easy to tell apart' : apart >= 2000 ? 'still clearly apart' : 'close together: telling them apart will take a sharp step at 4,000 Hz';
      return `On the wideband line, ${hz(f)} Hz turns ${dg(360 * f / 16000)} per sample (on your line, ${dg(360 * f / 8000)}); its ghost turns the rest of the flip, ${dg(180 - 360 * f / 16000)}, which is ${hz(g)} Hz. Both at 50%. ${where}The hum and its ghost are ${hz(apart)} Hz apart, ${gap}. Move the hum up and the ghost comes down.`;
    }
    function pinCompare() {
      const p = st.pinned, d = st.f - p.f;
      if (!d) return `Pinned ${hz(p.f)} Hz, ghost ${hz(8000 - p.f)} Hz. Move the slider to compare.`;
      return `Pinned ${hz(p.f)} Hz with its ghost at ${hz(8000 - p.f)} Hz. Now ${hz(st.f)} Hz, ghost at ${hz(8000 - st.f)} Hz. The hum moved ${d > 0 ? 'up' : 'down'} ${hz(Math.abs(d))} Hz and the ghost moved ${d > 0 ? 'down' : 'up'} ${hz(Math.abs(d))} Hz: always mirrored across 4,000 Hz.`;
    }

    function fixCheck(m, dir) {
      const cs = CASES[st.caseIx], ilo = 8000 - cs.vhi, ihi = 8000 - cs.vlo;
      const what = dir === 'up' ? 'image' : 'alias';
      const v = `Voice, ${hz(cs.vlo)} to ${hz(cs.vhi)} Hz: ${m.vmin === m.vmax ? pctV(m.vmin) : `${pctV(m.vmin)} to ${pctV(m.vmax)}`} ${m.voiceOK ? '✓ inside 90% to 110%' : '✗ outside 90% to 110%'}`;
      const i = `Worst ${what}, ${hz(ilo)} to ${hz(ihi)} Hz: ${pct1(m.imax)} ${m.imageOK ? '✓ under 8%' : '✗ over 8%'}`;
      return [v, i];
    }
    function fixMessage() {
      const cs = CASES[st.caseIx], cfg = st[st.dir], m = metrics(cs, st.dir, cfg.len, cfg.place);
      const other = st.dir === 'up' ? 'down' : 'up', mo = metrics(cs, other, st[other].len, st[other].place);
      const shortest = passLens(cs, 'up')[0];
      let msg;
      if (cfg.len > 31) msg = `${lenName(cfg.len)[0].toUpperCase()}${lenName(cfg.len).slice(1)} would meet the spec (voice ${pctV(m.vmin)} to ${pctV(m.vmax)}, worst ${pct1(m.imax)}), but the chip can only afford 31 weights per output sample. Find a rule within the budget.`;
      else if (st.dir === 'up') {
        if (cfg.len === 0) msg = 'No rule: the zeros alone leave every voice tone at 50% and every image at 50%. Your colleague arrives half as loud, with an upside-down twin just as loud above 4,000 Hz.';
        else if (!m.voiceOK && m.vmin < 0.9) msg = `${lenName(cfg.len)[0].toUpperCase()}${lenName(cfg.len).slice(1)} slopes too gently: the top of the voice drops to ${pctV(m.vmin)} at ${hz(m.vminAt)} Hz, and the image at ${hz(m.iat)} Hz, the mirror of ${hz(8000 - m.iat)} Hz, keeps ${pct1(m.imax)}.`;
        else if (!m.voiceOK) msg = `The voice overshoots to ${pctV(m.vmax)} at ${hz(m.vmaxAt)} Hz, and the image at ${hz(m.iat)} Hz keeps ${pct1(m.imax)}. A longer rule steps more steeply.`;
        else if (!m.imageOK) msg = `Close. The voice stays between ${pctV(m.vmin)} and ${pctV(m.vmax)}, but the image at ${hz(m.iat)} Hz, the mirror of ${hz(8000 - m.iat)} Hz, keeps ${pct1(m.imax)}: over 8%. A longer rule steps more steeply.`;
        else msg = `Going up passes with ${lenName(cfg.len)}: voice ${pctV(m.vmin)} to ${pctV(m.vmax)}, worst image ${pct1(m.imax)} at ${hz(m.iat)} Hz.${cs.shortest && cfg.len > shortest ? ' It works, but the gateway wants the shortest rule that passes. Try a shorter one.' : ''}`;
      } else if (st.dir === 'down') {
        if (cfg.len === 0) msg = `No rule: every wideband tone from ${hz(8000 - cs.vhi)} to ${hz(8000 - cs.vlo)} Hz folds into your voice band at full height. The 6,000 Hz “s” lands on 2,000 Hz at 100%: the squeal.`;
        else if (cfg.place === 'after') msg = `Wrong place. Once every other sample is gone, the 6,000 Hz “s” is already a 2,000 Hz tone, inside the voice. And ${lenName(cfg.len)}, run at 8,000 samples/s, moves its cutoff down to 2,000 Hz. Three things follow: your voice is cut, down to ${pctV(m.vmin)} at ${hz(m.vminAt)} Hz; the squeal from the “s” still reaches your line at ${pct0(share(cfg.len, 4000))}; and the worst folded tone, ${hz(m.iat)} Hz, lands on ${hz(8000 - m.iat)} Hz at ${pct1(m.imax)}, the number in the readout. The rule has to meet the “s” while it is still 6,000 Hz.`;
        else if (!m.voiceOK) msg = `In the right place, but ${lenName(cfg.len)} ${m.vmin < 0.9 ? `drops the voice to ${pctV(m.vmin)} at ${hz(m.vminAt)} Hz` : `overshoots to ${pctV(m.vmax)}`}, and the wideband tone at ${hz(m.iat)} Hz still reaches your line at ${pct1(m.imax)}, as ${hz(8000 - m.iat)} Hz.`;
        else if (!m.imageOK) msg = `In the right place. The voice passes, but the wideband tone at ${hz(m.iat)} Hz still reaches your line at ${pct1(m.imax)}, folded onto ${hz(8000 - m.iat)} Hz: over 8%.`;
        else msg = `Going down passes: ${lenName(cfg.len)} before the drop, gain 1. Voice ${pctV(m.vmin)} to ${pctV(m.vmax)}, worst alias ${pct1(m.imax)}.${cs.shortest && cfg.len > shortest ? ' It works, but the gateway wants the shortest rule that passes. Try a shorter one.' : ''}`;
      }
      if (m.pass && !mo.pass && !(cs.shortest && cfg.len > shortest)) msg += ` Now switch to going ${other}.`;
      const short = !cs.shortest || (st.up.len === shortest && st.down.len === shortest);
      return { msg, m, both: m.pass && mo.pass && short };
    }
    function successText() {
      const cs = CASES[st.caseIx];
      if (st.caseIx === 1) return 'Fixed. Your colleague’s voice reaches the wideband line without its upside-down twin, and a wideband caller’s “s” no longer squeals on your line. Listen closely going up, though: a faint shimmer is left, the 7.3% ripple near 4,600 Hz that the 31-sample rule still lets through. Remember it.';
      const s = passLens(cs, 'up')[0];
      return `The gateway is done, with ${s} samples, the shortest rule that passes both ways. Its voice stops at 2,800 Hz, which leaves a wide gap around 4,000 Hz, so a short rule can step across it. Your own bridge keeps voice up to 3,400 Hz: press “Next: your own bridge”.`;
    }

    function chainText() {
      if (st.dir === 'up') return `Your line, 8,000/s → zeros in → ${st.up.len ? `${lenName(st.up.len)}, gain 2` : 'no rule'} → wideband, 16,000/s`;
      const r = st.down.len ? `${lenName(st.down.len)}, gain 1` : null;
      if (!r) return 'Wideband, 16,000/s → keep every other → your line, 8,000/s (no rule)';
      return st.down.place === 'before' ? `Wideband, 16,000/s → ${r} → keep every other → your line, 8,000/s` : `Wideband, 16,000/s → keep every other → ${r} → your line, 8,000/s`;
    }

    function renderAudio() {
      if (explore) {
        if (st.source) { const f = st.f; return [8000, () => Float32Array.from({ length: 8000 }, (_, n) => 0.6 * cosd(360 * f * n / 8000))]; }
        const f = st.f; return [16000, () => Float32Array.from(bridgeOut(f, 16000).map(v => 0.6 * v))];
      }
      const cfg = st[st.dir];
      if (st.dir === 'up') {
        if (st.source) return [8000, () => VOICE8];
        const len = cfg.len;
        return [16000, () => { const xe = zeroStuff(VOICE8); return len ? convolve(xe, weights(len), 2) : xe; }];
      }
      if (st.source) return [16000, () => WIDE16];
      const { len, place } = cfg;
      return [8000, () => (!len ? keepEven(WIDE16) : place === 'before' ? keepEven(convolve(WIDE16, weights(len), 1)) : convolve(keepEven(WIDE16), weights(len), 1))];
    }
    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Press Play to hear the wideband side of the bridge.' : 'Not playing. Press Play to hear this direction through your bridge.';
      if (explore) return st.source ? `Playing the ${hz(st.f)} Hz hum as your line carries it, 8,000 samples/s.` : `Playing the wideband side: the ${hz(st.f)} Hz hum${st.f > 0 && st.f < 4000 ? ` and its ghost at ${hz(8000 - st.f)} Hz` : ''}, 16,000 samples/s.`;
      const cfg = st[st.dir];
      if (st.dir === 'up') return st.source ? 'Playing your colleague’s voice as sent, 8,000 samples/s.' : `Playing the voice on the wideband line, ${cfg.len ? `through ${lenName(cfg.len)}` : 'zeros only'}, 16,000 samples/s.`;
      return st.source ? 'Playing the wideband caller as sent, 16,000 samples/s.' : `Playing the wideband caller on your line, ${cfg.len ? `${lenName(cfg.len)} ${cfg.place} the drop` : 'no rule'}, 8,000 samples/s.`;
    }
    audio.listeners.add(() => { $('play').textContent = audio.playing && host.contains(document.activeElement || host) ? 'Stop' : 'Play'; $('play').textContent = audio.playing ? 'Stop' : 'Play'; $('now').textContent = nowText(); });

    function render() {
      if (explore) {
        $('hum').value = st.f; $('hum-out').textContent = `${hz(st.f)} Hz`; $('hum').setAttribute('aria-valuetext', `${hz(st.f)} Hz`);
        $('hum').disabled = !unlocked(); $('pin').disabled = !unlocked();
        const shown = st.phase !== 'q1' || st.f === 1000;
        if (shown) {
          const tones = toneList(st.f);
          $('result').textContent = `${hz(st.f)} Hz in · out: ${tones.map(t => `${hz(t.f)} Hz at ${pct0(t.size)}`).join(', ')}`;
        } else $('result').textContent = `${hz(st.f)} Hz in · out: ?`;
        $('why').textContent = exploreWhy();
        $('compare').hidden = !st.pinned; $('key-pin').hidden = !st.pinned;
        if (st.pinned) $('compare').textContent = pinCompare();
        $('source').setAttribute('aria-pressed', String(st.source));
        $('source').textContent = st.source ? 'Hear the wideband side' : 'Hear your line instead';
        $('stage').setAttribute('aria-label', `Two wheels, the output with a zero in every other slot, and a frequency meter: the ${hz(st.f)} Hz hum ${st.f === 4000 ? 'and its ghost land on one tone at 4,000 Hz, full height' : st.f === 0 ? 'becomes half at 0 Hz and half at 8,000 Hz' : `at 50% and a ghost at ${hz(8000 - st.f)} Hz at 50%`}.`);
      } else {
        const cs = CASES[st.caseIx], cfg = st[st.dir];
        $('task-text').textContent = cs.text;
        host.querySelectorAll('[data-dir]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dir === st.dir)));
        host.querySelectorAll('[data-len]').forEach(b => { b.setAttribute('aria-pressed', String(Number(b.dataset.len) === cfg.len)); b.disabled = !unlocked(); });
        host.querySelectorAll('[data-place]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.place === st.down.place)); b.disabled = !unlocked(); });
        $('place-control').hidden = st.dir !== 'down';
        $('len-label').textContent = st.dir === 'up' ? 'The rule after the zeros, gain 2' : 'The rule, gain 1';
        $('chain').textContent = chainText();
        const r = fixMessage(), [cv, ci] = fixCheck(r.m, st.dir);
        const mu = metrics(cs, 'up', st.up.len, 'before'), md = metrics(cs, 'down', st.down.len, st.down.place);
        const sh = passLens(cs, 'up')[0], tag = (mm, len) => (!mm.pass ? 'not yet ✗' : cs.shortest && len > sh ? 'passes, not the shortest ✗' : 'passes ✓');
        $('result').textContent = `Going up: ${tag(mu, st.up.len)} · Going down: ${tag(md, st.down.len)}`;
        $('check-voice').textContent = cv; $('check-image').textContent = ci;
        $('check-voice').className = r.m.voiceOK ? 'ok' : 'bad'; $('check-image').className = r.m.imageOK ? 'ok' : 'bad';
        st.solved = r.both;
        $('why').textContent = !unlocked() ? 'Answer the question above to unlock the rules.' : r.both ? successText() : r.msg;
        $('another').hidden = !st.solved;
        $('another').textContent = st.caseIx === 0 ? 'Next: your own bridge' : 'Back to the gateway';
        $('zone-key').textContent = `the gap, ${hz(cs.vhi)} to ${hz(8000 - cs.vhi)} Hz: voice ends, ${st.dir === 'up' ? 'image' : 'alias'} starts`;
        $('source').textContent = st.source ? 'Hear the bridge output' : st.dir === 'up' ? 'Hear the call as sent, 8,000/s' : 'Hear the call as sent, 16,000/s';
        $('source').setAttribute('aria-pressed', String(st.source));
        if (st.solved && st.caseIx === 1 && !st.announced) { st.announced = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' })); }
        $('stage').setAttribute('aria-label', `Going ${st.dir}: ${lenName(cfg.len)}${st.dir === 'down' && cfg.len ? `, ${cfg.place} keep every other` : ''}. ${cv}. ${ci}.`);
      }
      stage.redraw();
      if (audio.playing) { const [rate, fn] = renderAudio(); audio.refresh(rate, fn); }
      $('now').textContent = nowText();
    }

    function buildAsks() {
      if (explore) {
        const q1 = document.createElement('div'), q2 = document.createElement('div');
        $('ask').replaceChildren(q1, q2);
        const ask2 = () => K.ask(q2, {
          question: 'Now your colleague slides the hum up to 4,000 Hz, your line’s limit, starting at the top of its swing so it samples as 1, −1, 1, −1. What will the meter show there?',
          options: [['two', 'Two tones, 4,000 and 8,000 Hz, each at half height'], ['one', 'One tone at 4,000 Hz, full height'], ['none', 'Only the hum, at half height: the ghost vanishes']], right: 'one',
          hints: { two: 'The ghost turns the rest of the flip, 180° minus the hum’s turn. On the wideband line the 4,000 Hz hum turns 90° per sample. What is left for the ghost?', none: 'The ghost does not vanish; it always sits somewhere. On the wideband line the hum turns 90° per sample; the ghost turns the rest of 180°. Where does that put it?' },
          explain: 'On the wideband line the 4,000 Hz hum turns 90° per sample, and the ghost turns the rest of the flip, also 90°: the same tone. The two halves land on one spot and stack to full height. (Start that hum at 0 instead and it samples as 0, 0, 0: at the limit the start matters, as lesson 4 warned. The lab’s hum always starts at the top.) The slider is yours now.',
          solved: st.phase === 'free' ? 'right' : null,
          onSolved: () => { st.phase = 'free'; st.f = 4000; render(); }, focusAfter: () => $('hum'),
        });
        K.ask(q1, {
          question: 'Your colleague moves the hum from 1,000 Hz up to 1,500 Hz. Where will the second tone appear?',
          options: [['3000', '3,000 Hz'], ['5500', '5,500 Hz'], ['6500', '6,500 Hz'], ['7500', '7,500 Hz']], right: '6500',
          hints: {
            3000: 'That would be twice the hum, below 4,000 Hz. The ghost lives above 4,000 Hz, and the customer said it moves the other way.',
            5500: 'Count the turns. At 16,000 samples/s, 1,000 Hz turns 22.5° and its ghost 157.5°, together a flip. On that line 1,500 Hz turns 33.75°. What is left of 180°, and which tone turns that much?',
            7500: 'When the hum rose from 500 to 1,000 Hz, the ghost fell from 7,500 to 7,000 Hz. The hum rises again here.',
          },
          explain: 'On the wideband line 1,500 Hz turns 33.75° per sample, so the ghost turns the rest of the flip, 146.25°, which is 6,500 Hz. The hum went up 500 Hz and the ghost came down 500 Hz.',
          solved: st.phase !== 'q1' ? 'right' : null,
          onSolved: () => { st.phase = 'q2'; st.f = 1500; render(); ask2(); }, focusAfter: () => q2.querySelector('button'),
        });
        if (st.phase !== 'q1') ask2();
        return;
      }
      if (st.asked) { $('ask').replaceChildren(); return; }
      K.ask($('ask'), {
        question: 'Before you build anything: with no rule at all, a wideband caller hisses at 5,500 Hz. Where does that hiss land on your line?',
        options: [['1500', 'At 1,500 Hz'], ['2500', 'At 2,500 Hz'], ['5500', 'At 5,500 Hz, still a hiss'], ['gone', 'Nowhere: your line cannot hold it']], right: '2500',
        hints: { 1500: 'The fold is a mirror across 4,000 Hz, not a shift down by 4,000 Hz. 6,000 Hz landed on 2,000 Hz.', 5500: 'Your line takes 8,000 samples/s, so it holds no tone above 4,000 Hz. The hiss must land somewhere below.', gone: 'Dropping samples cannot delete a tone: the kept samples still wiggle. 6,000 Hz arrived as 2,000 Hz at full height.' },
        explain: 'Keep every other sample and 5,500 Hz turns 247.5° between kept samples, the same spot as 112.5° backwards: 2,500 Hz, at full height, mirrored across 4,000 Hz. Every hiss lands inside the voice. Now fix both directions with the controls.',
        solved: st.asked ? 'right' : null,
        onSolved: () => { st.asked = true; render(); }, focusAfter: () => host.querySelector('[data-len="3"]'),
      });
    }

    if (!explore) {
      ['hum-control', 'pin', 'jump', 'key-explore'].forEach(k => { $(k).hidden = true; });
      ['task', 'dir', 'chain', 'len-control', 'key-fix', 'checks'].forEach(k => { $(k).hidden = false; });
    }
    buildAsks();

    $('hum').addEventListener('input', () => { st.f = Number($('hum').value); render(); });
    $('pin').addEventListener('click', () => { st.pinned = { f: st.f, tones: toneList(st.f) }; render(); });
    $('play').addEventListener('click', () => { if (audio.playing) audio.stop(); else { const [rate, fn] = renderAudio(); audio.play(rate, fn); } $('now').textContent = nowText(); });
    $('source').addEventListener('click', () => { st.source = !st.source; render(); });
    if (!explore) {
      host.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => { st.dir = b.dataset.dir; render(); }));
      host.querySelectorAll('[data-len]').forEach(b => b.addEventListener('click', () => { st[st.dir].len = Number(b.dataset.len); render(); }));
      host.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { st.down.place = b.dataset.place; render(); }));
    } else ['dir', 'len-control', 'place-control', 'key-fix', 'checks', 'task', 'chain'].forEach(k => $(k).remove());
    $('another').addEventListener('click', () => {
      audio.stop(); st.caseIx = (st.caseIx + 1) % CASES.length;
      Object.assign(st, { dir: 'up', up: { len: 0 }, down: { len: 0, place: 'after' }, solved: false, source: false });
      buildAsks(); render(); host.querySelector('[data-len="0"]').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(st, { f: st.phase === 'free' ? 1000 : st.f, pinned: null, source: false });
      else Object.assign(st, { dir: 'up', up: { len: 0 }, down: { len: 0, place: 'after' }, source: false });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  const guessP = [...document.querySelectorAll('#the-other-direction > p')].find(p => p.textContent.startsWith('Guess before you compute'));
  if (guessP) {
    const box = document.createElement('div');
    guessP.after(box);
    const work = () => document.querySelector('.k-working[data-unlock="ds-guess"]');
    const wb = work()?.querySelector('.k-working-open'); if (wb) wb.textContent = 'Show the working (opens after your guess)';
    K.ask(box, {
      question: 'Your guess: when the 6,000 Hz “s” loses every other sample, what reaches your line?',
      options: [['none', 'Nothing: your line cannot carry 6,000 Hz'], ['quiet', 'A quieter 6,000 Hz hiss'], ['2000', 'A 2,000 Hz tone'], ['4000', 'A 4,000 Hz tone']], right: '2000',
      hints: {
        none: 'Dropping samples cannot delete a tone. The kept samples still wiggle, and every wiggle your line stores is some tone below 4,000 Hz.',
        quiet: 'Your line holds no tone above 4,000 Hz, at any height. The hiss has to turn into something lower.',
        4000: 'A 4,000 Hz tone samples as 1, −1, 1, −1. On the wideband line the “s” turns 135° per sample, so 270° between kept samples. Where does 270° forwards land?',
      },
      explain: 'A 2,000 Hz tone, at full height. The working below shows why.',
      onSolved: () => {
        document.dispatchEvent(new CustomEvent('k:solved', { detail: 'ds-guess' }));
        const w = work(); if (w) w.querySelector('.k-working-note').textContent = 'You have made your guess, so the working is open to read.';
      },
      focusAfter: () => work()?.querySelector('.k-working-open'),
    });
  }

  const act1 = mountBridge(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const mount = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    mount.replaceChildren(host);
    mountBridge(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
