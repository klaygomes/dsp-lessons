(() => {
  const K = window.Kit, FS = 16000, RATE = 8000, PI = Math.PI;
  const { fmt, hz, MINUS } = K;
  const hI = m => (m === 0 ? 0.5 : Math.sin(PI * m / 2) / (PI * m));
  const WEIGHT = {
    rect: () => 1,
    hamming: (m, N) => 0.54 + 0.46 * Math.cos(2 * PI * m / (N - 1)),
  };
  const NAME = { rect: 'plain cut', hamming: 'Hamming' };
  const Name = k => NAME[k][0].toUpperCase() + NAME[k].slice(1);
  const f3 = v => fmt(v, 3);
  const pct = v => `${(v * 100).toFixed(2)}%`;
  const pct1 = v => `${(v * 100).toFixed(1)}%`;
  const odd = v => Math.round((v - 1) / 2) * 2 + 1;

  const coeffs = (kind, N) => Float64Array.from({ length: (N - 1) / 2 + 1 }, (_, m) => hI(m) * WEIGHT[kind](m, N));
  const gainAt = (c, f) => { const t = 2 * PI * f / FS; let s = c[0]; for (let m = 1; m < c.length; m++) s += 2 * c[m] * Math.cos(t * m); return s; };

  const cache = new Map();
  function analyse(kind, N, P) {
    const key = `${kind}:${N}:${P}`;
    if (cache.has(key)) return cache.get(key);
    const c = coeffs(kind, N), S = FS / 2 - P;
    const curve = Float64Array.from({ length: 1001 }, (_, i) => gainAt(c, i * 8));
    let vb = 0, fb = 0, gh = 0, fg = 0;
    for (let f = 0; f <= P; f++) { const e = Math.abs(gainAt(c, f) - 1); if (e > vb) { vb = e; fb = f; } }
    for (let f = S; f <= FS / 2; f++) { const e = Math.abs(gainAt(c, f)); if (e > gh) { gh = e; fg = f; } }
    let peak = -1, peakF = 0;
    for (let f = 0; f <= 4000; f += 2) { const v = gainAt(c, f); if (v > peak) { peak = v; peakF = f; } }
    for (let f = Math.max(0, peakF - 2); f <= Math.min(4000, peakF + 2); f += 0.25) { const v = gainAt(c, f); if (v > peak) { peak = v; peakF = f; } }
    let dip = 2, dipF = 4000;
    for (let f = 4000; f <= FS / 2; f += 2) { const v = gainAt(c, f); if (v < dip) { dip = v; dipF = f; } }
    for (let f = Math.max(4000, dipF - 2); f <= Math.min(FS / 2, dipF + 2); f += 0.25) { const v = gainAt(c, f); if (v < dip) { dip = v; dipF = f; } }
    let edgeLo = null, edgeHi = null;
    for (let f = 0; f <= 4000; f++) if (Math.abs(gainAt(c, f) - 1) > 0.01) { edgeLo = f - 1; break; }
    for (let f = 4000; f <= FS / 2; f++) if (Math.abs(gainAt(c, f)) < 0.01) { edgeHi = f; break; }
    peakF = Math.round(peakF); dipF = Math.round(dipF);
    const a = { c, N, kind, P, curve, vb, fb, gh, fg, peak, peakF, dip, dipF, edgeLo, edgeHi, at: f => gainAt(c, f) };
    if (cache.size > 400) cache.clear();
    cache.set(key, a);
    return a;
  }

  function envelope(a) {
    if (a.env) return a.env;
    const g = Float64Array.from({ length: 1001 }, (_, i) => Math.abs(a.at(4000 + 4 * i)));
    a.env = Float64Array.from(g, (_, i) => { let m = 0; for (let j = Math.max(0, i - 4); j <= Math.min(1000, i + 4); j++) m = Math.max(m, g[j]); return m; });
    return a.env;
  }

  let sweep = null;
  const sweepAt16k = () => sweep || (sweep = Float32Array.from({ length: 10 * FS }, (_, n) => { const t = n / FS; return 0.9 * Math.sin(2 * PI * (4000 * t + 200 * t * t)); }));
  function render8k(a, on) {
    const x = sweepAt16k(), out = new Float32Array(x.length / 2);
    if (!on) { for (let j = 0; j < out.length; j++) out[j] = x[2 * j]; return out; }
    const M = a.c.length - 1, h = Float64Array.from({ length: 2 * M + 1 }, (_, k) => a.c[Math.abs(k - M)]);
    for (let j = 0; j < out.length; j++) {
      const n = 2 * j; let s = 0;
      for (let k = 0, top = Math.min(h.length - 1, n); k <= top; k++) s += h[k] * x[n - k];
      out[j] = s;
    }
    return out;
  }

  const CASES = [
    { P: 3700, tol: 0.1, budget: 31, start: ['hamming', 15], band: 'Carried band', text: 'Before your own line, the loading-dock intercom joins. Its handsets carry tones up to 3,700 Hz, so its carried band, the tones it must deliver, runs from 0 to 3,700 Hz. Shouted announcements only need to be understood, so it forgives a lot: every tone up to 3,700 Hz may stray from whole by up to 10%, and every tone above 4,300 Hz, which would land below 3,700 Hz, may leak up to 10% (−20 dB). Its chip is tiny: 31 coefficients at most, as many as lesson 5’s. The engineer has loaded a Hamming filter of 15.' },
    { P: 3400, tol: 0.01, budget: 47, start: ['rect', 31], band: 'Voice band', text: 'Your own line: pass the voice band, 0 to 3,400 Hz, within 1%, and remove every tone above 4,600 Hz to below 1%, with at most 47 coefficients. The sweep starts out through lesson 5’s plain cut of 31.' },
    { P: 3500, tol: 0.01, budget: 63, start: ['rect', 31], band: 'Carried band', text: 'A second wideband bridge joins. Its phones carry tones up to 3,500 Hz, so its job is: pass 0 to 3,500 Hz within 1%, and remove every tone above 4,500 Hz, which would land below 3,500 Hz, to below 1%. Its chip affords 63 coefficients.' },
    { P: 3600, tol: 0.1, budget: 33, start: ['hamming', 13], band: 'Carried band', text: 'The warehouse walkie-talkie gateway joins. Its radios carry up to 3,600 Hz, and it forgives strays and leaks up to 10%: the band may stray by 10%, and every tone above 4,400 Hz must stay below 10%. Its chip affords 33 coefficients.' },
    { P: 3000, tol: 0.01, budget: 27, start: ['rect', 21], band: 'Carried band', text: 'An old radio link joins. Its handsets carry only up to 3,000 Hz, so everything above 5,000 Hz must go, to below 1%, and the band must stay within 1%. Its chip is tiny: 27 coefficients at most.' },
    { P: 3200, tol: 0.01, budget: 39, start: ['rect', 31], band: 'Carried band', text: 'A hotel exchange joins. Its band reaches 3,200 Hz and must stay within 1%, so everything above 4,800 Hz must go, to below 1%. Its chip affords 39 coefficients.' },
  ];

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('fir-lab').content.cloneNode(true));
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = { kind: explore ? 'rect' : CASES[0].start[0], N: explore ? 31 : CASES[0].start[1], unlocked: false, pinned: null, db: !explore, on: true, caseIx: 0, solved: false, t: null };
    const job = () => (explore ? { P: 3400, tol: 0.01, budget: 255, band: 'Where voices live' } : CASES[st.caseIx]);
    const lim = () => `${Math.round(job().tol * 100)}%`;
    const now = () => analyse(st.kind, st.N, job().P);

    const slider = $('len');
    slider.min = 7; slider.max = explore ? 255 : 99; slider.step = explore ? 4 : 2;

    const stage = K.stage($('stage'), s => draw(s), { height: w => (w < 560 ? 500 : 470) });

    function draw(s) {
      const { pen, c, w, h } = s, a = now(), J = job(), phone = w < 560;
      const R = { x: phone ? 48 : 60, y: 26, w: w - (phone ? 60 : 76), h: phone ? 210 : 200 };
      const G = { x: R.x, y: R.y + R.h + (phone ? 70 : 64), w: R.w, h: h - (R.y + R.h + (phone ? 70 : 64)) - 30 };
      const X = f => R.x + f / 8000 * R.w;
      const lo = st.db ? -80 : -0.2, hi = st.db ? 5 : 1.2;
      const toY = v => R.y + R.h - (v - lo) / (hi - lo) * R.h;
      const Y = v => toY(Math.max(lo, Math.min(hi, st.db ? 20 * Math.log10(Math.max(Math.abs(v), 1e-5)) : v)));
      if (!explore) {
        pen.rect(X(0), R.y, X(J.P) - X(0), R.h, c.inputSoft);
        const S = 8000 - J.P;
        pen.rect(X(S), R.y, X(8000) - X(S), R.h, c.paper2);
        for (let x = X(S) - R.h; x < X(8000); x += 9) {
          const x0 = Math.max(x, X(S)), x1 = Math.min(x + R.h, X(8000));
          if (x1 > x0) pen.line([[x0, R.y + R.h - (x0 - x)], [x1, R.y + R.h - (x1 - x)]], c.rule, 1);
        }
        pen.text('pass', (X(0) + X(J.P)) / 2, R.y + R.h - 8, { color: c.input, size: 12, font: 'body', weight: 600 });
        pen.text('remove', (X(S) + X(8000)) / 2, R.y + 14, { color: c.soft, size: 12, font: 'body', weight: 600 });
      }
      const ticks = st.db ? [[0, '0'], [-20, `${MINUS}20`], [-40, `${MINUS}40`], [-60, `${MINUS}60`], [-80, `${MINUS}80 dB`]] : [[0, '0'], [0.5, '0.5'], [1, '1']];
      ticks.forEach(([v, t]) => { pen.line([[R.x, toY(v)], [R.x + R.w, toY(v)]], c.rule, 1); pen.text(t, R.x - 6, toY(v) + 4, { align: 'right', color: c.soft, size: phone ? 11 : 12 }); });
      pen.text(st.db ? 'gain in dB' : 'gain', R.x - 6, R.y - 10, { align: 'left', color: c.soft, size: phone ? 11 : 12 });
      (phone ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]).forEach(f => pen.text(f === 8000 ? '8,000 Hz' : hz(f), Math.min(X(f), R.x + R.w - 18), R.y + R.h + 16, { color: c.soft, size: phone ? 11 : 12 }));
      pen.text('input tone, 16,000 samples per second', R.x, R.y + R.h + 32, { align: 'left', color: c.soft, size: phone ? 11 : 12 });
      if (st.db) {
        const L = 20 * Math.log10(J.tol);
        pen.line([[X(8000 - J.P), toY(L)], [X(8000), toY(L)]], c.soft, 1.5, [4, 4]);
      } else {
        pen.line([[X(0), Y(1)], [X(4000), Y(1)], [X(4000), Y(0)], [X(8000), Y(0)]], c.soft, 1.5, [6, 5]);
      }
      if (st.pinned) {
        const p = analyse(st.pinned.kind, st.pinned.N, J.P);
        pen.line(Array.from(p.curve, (v, i) => [X(i * 8), Y(v)]), c.input, 2, [1.5, 4]);
      }
      const locked = explore ? !st.unlocked : false;
      if (!st.on) {
        s.ctx.globalAlpha = 0.3; pen.line(Array.from(a.curve, (v, i) => [X(i * 8), Y(v)]), c.soft, 2); s.ctx.globalAlpha = 1;
        const offLab = phone ? 'filter off: every tone at full strength' : 'filter off: every tone reaches the downsampler at full strength', ow = offLab.length * (phone ? 5.9 : 6.4) + 16;
        pen.rect(R.x + R.w / 2 - ow / 2, R.y + R.h * 0.4 - 17, ow, 24, c.paper);
        pen.text(offLab, R.x + R.w / 2, R.y + R.h * 0.4, { color: c.ink, size: phone ? 11 : 12, font: 'body', weight: 600 });
      } else pen.line(Array.from(a.curve, (v, i) => [X(i * 8), Y(v)]), c.ink, 2);
      if (explore && !locked && st.on) {
        pen.dot(X(a.peakF), Y(a.peak), 4, c.accent);
        const lab = `${f3(a.peak)} at ${hz(a.peakF)} Hz`, right = X(a.peakF) > R.x + R.w * 0.55;
        pen.text(lab, X(a.peakF) + (right ? -8 : 8), Y(a.peak) - 8, { align: right ? 'right' : 'left', color: c.accentInk, size: 12 });
      }
      if (!explore && st.unlocked && st.on) {
        if (a.vb > J.tol) pen.dot(X(a.fb), Y(a.at(a.fb)), 4, c.accent);
        if (a.gh > J.tol) pen.dot(X(a.fg), Y(a.at(a.fg)), 4, c.accent);
      }

      const GX = t => G.x + t / 10 * G.w, GY = f => G.y + G.h - f / 4000 * G.h;
      pen.text(phone ? 'the ghost on your side (thicker: louder)' : 'the ghost on your side, 8,000 samples per second: thicker is louder', G.x, G.y - 10, { align: 'left', color: c.ink, size: phone ? 11 : 12 });
      pen.rect(G.x, GY(J.P), G.w, GY(0) - GY(J.P), c.paper2);
      pen.line([[G.x, G.y + G.h], [G.x + G.w, G.y + G.h]], c.soft, 1);
      pen.text('4,000', G.x - 6, GY(4000) + 4, { align: 'right', color: c.soft, size: phone ? 11 : 12 });
      pen.text(hz(J.P), G.x - 6, GY(J.P) + 10, { align: 'right', color: c.soft, size: phone ? 11 : 12 });
      pen.text('0 Hz', G.x - 6, GY(0) + 4, { align: 'right', color: c.soft, size: phone ? 11 : 12 });
      pen.text(J.band.toLowerCase(), G.x + 6, GY(0) - 6, { align: 'left', color: c.soft, size: phone ? 11 : 12 });
      [0, 5, 10].forEach(t => pen.text(t === 10 ? '10 s' : String(t), Math.min(GX(t), G.x + G.w - 10), G.y + G.h + 14, { color: c.soft, size: phone ? 11 : 12 }));
      if (locked) return;
      s.ctx.save(); s.ctx.beginPath(); s.ctx.rect(G.x, G.y, G.w, G.h); s.ctx.clip();
      const tol = J.tol;
      const env = st.on ? envelope(a) : null;
      const half = t => { const g = env ? env[Math.round(t * 100)] : 1; return [g, g < 0.01 ? 0 : Math.max(1.2, Math.min(12, 70 * g))]; };
      for (let i = 0; i < 500; i++) {
        const t0 = i / 50, t1 = (i + 1) / 50, [g0, w0] = half(t0), [g1, w1] = half(t1), g = Math.max(g0, g1);
        if (Math.max(w0, w1) === 0) continue;
        const y0 = GY(4000 - 400 * t0), y1 = GY(4000 - 400 * t1), over = g > tol && (explore || 4000 - 400 * t0 < J.P);
        s.ctx.beginPath(); s.ctx.moveTo(GX(t0), y0 - w0); s.ctx.lineTo(GX(t1), y1 - w1); s.ctx.lineTo(GX(t1), y1 + w1); s.ctx.lineTo(GX(t0), y0 + w0); s.ctx.closePath();
        if (over) { s.ctx.fillStyle = c.accent; s.ctx.fill(); }
        else { s.ctx.beginPath(); s.ctx.moveTo(GX(t0), y0 - w0); s.ctx.lineTo(GX(t1), y1 - w1); s.ctx.moveTo(GX(t0), y0 + w0); s.ctx.lineTo(GX(t1), y1 + w1); s.ctx.strokeStyle = c.ink; s.ctx.lineWidth = 1.2; s.ctx.stroke(); }
      }
      if (explore && st.on) {
        const td = (a.dipF - 4000) / 400, wd = half(td)[1];
        pen.ring(GX(td), GY(8000 - a.dipF), Math.min(wd + 3, 7), c.ink, 1.5);
        pen.text(phone ? `dip: ${pct1(-a.dip)} heard at ${hz(8000 - a.dipF)} Hz` : `the dip past the cutoff: ${pct1(-a.dip)} of the sweep, heard at ${hz(8000 - a.dipF)} Hz`, G.x + G.w - 4, G.y + 12, { align: 'right', color: c.ink, size: phone ? 11 : 12 });
      }
      s.ctx.restore();
      if (st.t !== null) pen.line([[GX(st.t), G.y], [GX(st.t), G.y + G.h]], c.input, 2);
    }

    const audio = K.player({ rate: RATE, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play the sweep'; nowText(); if (on) ticker.start(); else { ticker.stop(); st.t = null; stage.redraw(); } } });
    const ticker = K.loop(host, () => { if (!audio.playing) return; st.t = ((audio.ctx.currentTime - audio.startedAt) % audio.duration + audio.duration) % audio.duration; stage.redraw(); });
    let refreshTimer = 0;
    const refreshSoon = () => { if (!audio.playing) return; clearTimeout(refreshTimer); refreshTimer = setTimeout(() => audio.refresh(), 150); };
    function nowText() {
      const J = job(), loops = 'The 10-second sweep loops until you press Stop.';
      $('now').textContent = !audio.playing ? 'Not playing. Play the sweep to hear what reaches your side; it loops until you press Stop.'
        : st.on ? `Playing the 4,000 to 8,000 Hz sweep through the ${NAME[st.kind]}, ${st.N} coefficients, then the downsampler: ${!explore && clean(now()) ? (J.tol > 0.01 ? `every leak stays within this line’s ${lim()}, so the ghost that remains is one it forgives.` : `every leak stays below 1%, so the sweep leaves no ghost in the ${J.band.toLowerCase()}.`) : 'what you hear is the ghost.'} ${loops}`
          : `Playing the sweep with the filter off, only the downsampler: every tone folds straight into your line at full strength. ${loops}`;
    }

    const offText = 'The filter is off, so the downsampler alone gets the sweep: every tone folds into your line at full strength, and the strip shows the whole sweep falling from 4,000 to 0 Hz. The faded curve is the filter you would switch back on.';
    function exploreWhy(a) {
      if (!st.on) return offText;
      const pk = `${f3(a.peak)} at ${hz(a.peakF)} Hz`, leak = `Past the cutoff the curve dips to ${f3(a.dip)} at ${hz(a.dipF)} Hz: a gain below zero means ${pct1(-a.dip)} of that tone still gets out, flipped upside down.`;
      if (st.N === 7) return `The shortest the slider goes, the middle and two nonzero pairs. The cliff is a long gentle slope, and the bump sits far from the cutoff: ${pk}. ${leak}`;
      if (st.N < 31) return `Shorter than lesson 5’s filter: a gentler cliff, and the bump further from the cutoff, ${pk}. ${leak}`;
      if (st.N === 31) return `Lesson 5’s filter, the bug. The bump is ${pk}: the top of a wideband voice comes out 9% louder, as the engineer heard on real calls. ${leak}`;
      const strip = `On the strip, the dip’s ghost is still ${pct1(-a.dip)} of the sweep; it only comes sooner and shorter, heard at ${hz(8000 - a.dipF)} Hz, above the 3,400 Hz where voices end. But inside the range where voices live, 0 to 3,400 Hz, the ripples still reach ${pct(a.gh)}${a.gh < 0.015 ? ' (too thin to stand out on the strip)' : ''}: the plain cut only gets under 1% there at 271 coefficients, more than five times the 47 your chip can afford.`;
      if (st.N === 255) return `The longest the slider goes, more than eight times lesson 5’s filter. The bump sits at ${hz(a.peakF)} Hz, only ${hz(4000 - a.peakF)} Hz below the cutoff, and it is still ${f3(a.peak)}. ${leak} ${strip}`;
      return `Longer than lesson 5’s filter: the bump has moved to ${hz(a.peakF)} Hz, ${hz(4000 - a.peakF)} Hz below the cutoff, and got narrower. Its height: ${f3(a.peak)}. ${leak}${st.N >= 127 ? ` ${strip}` : ''}`;
    }
    function pinCompare(a) {
      const p = analyse(st.pinned.kind, st.pinned.N, 3400);
      if (p.N === a.N) return `Pinned ${p.N} coefficients. Move the slider to compare.`;
      const same = Math.abs(p.peak - a.peak) < 0.005;
      return `Pinned ${p.N}: bump ${f3(p.peak)} at ${hz(p.peakF)} Hz. Now ${a.N}: bump ${f3(a.peak)} at ${hz(a.peakF)} Hz. ${same ? `Same height; the ${a.N > p.N ? 'longer' : 'shorter'} cut only moves the bump ${a.N > p.N ? 'closer to' : 'away from'} the cutoff.` : `The heights differ by ${f3(Math.abs(p.peak - a.peak))}, nowhere near the 9% you would need to lose.`}`;
    }
    const clean = a => a.vb <= job().tol && a.gh <= job().tol;
    function fixMessage(a) {
      const J = job(), S = 8000 - J.P, slope = `${hz(S - J.P)} Hz`, pass = clean(a);
      const where = `the band strays ${pct(a.vb)} at ${hz(a.fb)} Hz and the ghost leaks ${pct(a.gh)} at ${hz(a.fg)} Hz, heard at ${hz(8000 - a.fg)} Hz`;
      st.solved = false;
      if (!st.on) return `${offText} Switch the filter on to judge this line.`;
      const same = st.kind === 'rect' && st.N % 4 === 1 ? ` (A plain cut of ${st.N} is the same filter as ${st.N - 2}: its outermost pair, n = ±${(st.N - 1) / 2}, is even, and even coefficients are zero.)` : '';
      if (st.N > J.budget) {
        return pass ? `${Name(st.kind)} ${st.N} would do the job (band ${pct(a.vb)}, ghost ${pct(a.gh)}), but this chip affords only ${J.budget} coefficients.`
          : `${st.N} coefficients is more than this chip’s ${J.budget}, and it still fails: ${where}. This line allows ${lim()}.`;
      }
      if (!pass && st.kind === 'rect' && J.tol < 0.09) return `Plain cut ${st.N}: its 9% bump sits at ${hz(a.peakF)} Hz${a.peakF > J.P ? `, past the band’s ${hz(J.P)} Hz edge, but its ripples still reach ${pct(a.vb)} inside the band, at ${hz(a.fb)} Hz, and the ghost leaks ${pct(a.gh)} at ${hz(a.fg)} Hz, heard at ${hz(8000 - a.fg)} Hz` : `, inside the band, and ${where}`}. This line allows ${lim()}.${same}`;
      if (!pass) return `${Name(st.kind)} ${st.N}: its slope is wider than the ${slope} this line leaves for it, from ${hz(J.P)} to ${hz(S)} Hz. So ${where}. This line allows ${lim()}.${same}`;
      st.solved = true;
      const tail = `${Name(st.kind)} ${st.N}: band within ${pct(a.vb)}, ghost at most ${pct(a.gh)}, ${st.N} of ${J.budget} coefficients.${same}`;
      if (st.caseIx === 1) {
        return `Fixed. ${tail} The engineer runs her sweep again. The first moment still leaks, fading below 1% by ${hz(a.edgeHi)} Hz, but it all lands in the empty margin. After that: nothing. No ghost in the voice band, and a wideband voice at 3,500 Hz now comes out at ${f3(a.at(3500))} instead of 1.090.`;
      }
      if (st.caseIx === 0) return `Fixed for the intercom. ${tail} The intercom forgives ${lim()}, so a ripple near 9% is allowed, and then the narrow slope is what counts. Next, your own line, which forgives only 1%.`;
      return `Fixed. ${tail} What still reaches this line’s band stays within the ${lim()} it allows.`;
    }

    function setMeter(el, v, label) {
      el.classList.toggle('k-off', !st.on);
      const tol = job().tol, max = tol * (tol > 0.01 ? 2 : 10);
      el.querySelector('[data-label]').textContent = label;
      el.querySelector('.bar').style.setProperty('--limit', `${tol / max * 100}%`);
      el.querySelector('.scale span:last-child').textContent = `${Math.round(max * 100)}%`;
      const ok = v <= tol;
      if (!st.on) { K.meter(el, max, { max, text: 'filter off: every tone at full strength' }); el.classList.remove('k-ok'); return; }
      K.meter(el, v, { max, text: ok ? `${pct(v)} ✓ within ${lim()}` : `${pct(v)}, over ${lim()}${v > max ? ', past the bar' : ''}` });
      el.classList.toggle('k-ok', ok);
    }

    function render() {
      const a = now(), J = job();
      slider.value = st.N; $('len-out').textContent = explore ? `${st.N} coefficients` : `${st.N} coefficients${st.N > J.budget ? `, over the budget of ${J.budget}` : ` of ${J.budget} allowed`}`;
      const locked = !st.unlocked;
      slider.disabled = locked; $('play').disabled = locked; $('on').disabled = locked; $('reset').disabled = locked; $('pin').disabled = locked; $('db').disabled = locked;
      host.querySelectorAll('[data-window]').forEach(b => { b.disabled = locked; b.setAttribute('aria-pressed', String(b.dataset.window === st.kind)); });
      $('db').setAttribute('aria-pressed', String(st.db)); $('db').textContent = st.db ? 'Scale: dB' : 'Scale: gain'; $('key-db').hidden = explore || !st.db; $('key-step').hidden = st.db || !explore;
      $('key-db-text').textContent = `in dB: the ${MINUS}${Math.round(-20 * Math.log10(J.tol))} dB line, ${lim()}, from ${hz(8000 - J.P)} Hz up`;
      $('key-ghost').textContent = explore ? 'the ghost, thicker where louder' : `ghost in the ${J.band.toLowerCase()}, over ${lim()}`;
      $('key-ok').hidden = explore; $('key-ok-text').textContent = `ghost this line allows: within its ${lim()}, or heard above ${hz(J.P)} Hz`;
      $('key-dip').hidden = !explore || locked || !st.on; $('key-ghost-item').hidden = explore && locked;
      $('key-worst').hidden = explore || !st.on || clean(a); $('on').setAttribute('aria-pressed', String(st.on));
      $('on').textContent = st.on ? 'Filter on' : 'Filter off';
      if (explore) {
        $('result').textContent = !st.on && !locked ? `Filter off · the downsampler alone · every tone at full strength` : locked ? `${st.N} coefficients, lesson 5’s filter · bump ${f3(a.peak)} at ${hz(a.peakF)} Hz`
          : `${st.N} coefficients · bump ${f3(a.peak)} at ${hz(a.peakF)} Hz, ${((a.peak - 1) * 100).toFixed(1)}% too loud · dip ${f3(a.dip)} at ${hz(a.dipF)} Hz`;
        $('why').textContent = locked ? 'Answer the question above to unlock the slider.' : exploreWhy(a);
        $('compare').hidden = !st.pinned;
        if (st.pinned) $('compare').textContent = pinCompare(a);
        $('key-pin').hidden = !st.pinned;
        $('stage').setAttribute('aria-label', `Gain of the plain cut with ${st.N} coefficients at every input tone: the bump reaches ${f3(a.peak)} at ${hz(a.peakF)} Hz. Below it, the ghost of the sweep on your side.`);
      } else {
        $('task-text').textContent = J.text;
        $('result').textContent = st.on ? `${Name(st.kind)}, ${st.N} coefficients` : `Filter off · ${Name(st.kind)}, ${st.N} coefficients, switched out`;
        $('why').textContent = locked ? 'Answer the question above to unlock the window and the length.' : fixMessage(a);
        setMeter($('m-band'), locked ? 0 : a.vb, `${J.band}, 0 to ${hz(J.P)} Hz: largest stray from whole (line at ${lim()})`);
        setMeter($('m-ghost'), locked ? 0 : a.gh, `Ghost: loudest leak above ${hz(8000 - J.P)} Hz (line at ${lim()})`);
        if (locked) { $('m-band').querySelector('output').textContent = '?'; $('m-ghost').querySelector('output').textContent = '?'; $('m-band').classList.remove('k-ok'); $('m-ghost').classList.remove('k-ok'); }
        $('another').hidden = !st.solved;
        $('another').textContent = st.caseIx === 0 ? 'Next: your own line' : 'Try another line';
        if (st.solved && st.caseIx === 1) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        $('stage').setAttribute('aria-label', `Gain of the ${NAME[st.kind]} with ${st.N} coefficients against the job: pass up to ${hz(J.P)} Hz, remove above ${hz(8000 - J.P)} Hz. Below it, the ghost of the sweep on your side.`);
      }
      stage.redraw();
      nowText();
      refreshSoon();
    }

    function buildAsk() {
      if (explore) {
        K.ask($('ask'), {
          question: 'Lesson 5’s filter has 31 coefficients and a bump of 1.090. Push it to 255 coefficients, eight times as many. What happens to the bump above 1?',
          options: [['much', 'It shrinks to almost nothing'], ['little', 'It shrinks a little'], ['same', 'It stays about the same height']], right: 'same',
          hints: {
            much: 'The 0 Hz staircase settled toward 1 as pairs were added. But every new pair is a faster wiggle. Does a faster wiggle flatten the cliff’s edge, or just crowd closer to it?',
            little: 'Think about where each new, faster wiggle does its work: near 0 Hz, or right at the cliff?',
          },
          explain: 'It stays about the same height. Drag to 255 and see what changes instead. The slider is yours now: try every length.',
          reveal: 'Skip: show me', solved: st.unlocked ? 'right' : null,
          onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => slider,
        });
        return;
      }
      $('ask').replaceChildren();
      if (st.caseIx !== 0) { st.unlocked = true; return; }
      const q = document.createElement('div');
      $('ask').append(q);
      K.ask(q, {
        question: 'The intercom forgives 10%, but its slope must fit between 3,700 and 4,300 Hz, only 600 Hz wide, and its chip affords 31 coefficients. Which window can do this job?',
        options: [['rect', 'Only the plain cut'], ['hamming', 'Only Hamming'], ['both', 'Both'], ['neither', 'Neither']], right: 'rect',
        hints: {
          hamming: 'Hamming’s soft edges buy a tiny ripple, far below 10%. What do they cost the slope? Look back at 4,300 Hz: at 31 coefficients Hamming passed 22% there, the plain cut under 1%.',
          both: 'Both keep their ripple under 10%. So what else does this job ask for, and do both windows have it at 31 coefficients?',
          neither: 'The plain cut’s ripple stays near 9% at any length, under this line’s 10%. What else could stop it?',
        },
        explain: 'Only the plain cut. Its ripple, near 9%, fits under the intercom’s 10%, and at the same length its slope is narrower than Hamming’s. Now find a length that does it: the window and the length are yours, so watch both bars.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => host.querySelector('[data-window="rect"]'),
      });
    }

    if (explore) {
      ['task', 'windows', 'meters', 'another', 'db', 'key-db'].forEach(k => { $(k).hidden = true; });
    } else {
      ['pin', 'key-step', 'key-pin', 'compare'].forEach(k => { $(k).hidden = true; });
      $('task').hidden = false; $('windows').hidden = false; $('meters').hidden = false;
    }
    buildAsk();

    slider.addEventListener('input', () => { st.N = Math.max(7, Math.min(Number(slider.max), odd(Number(slider.value)))); render(); });
    host.querySelectorAll('[data-window]').forEach(b => b.addEventListener('click', () => { st.kind = b.dataset.window; render(); }));
    $('db').addEventListener('click', () => { st.db = !st.db; render(); });
    $('on').addEventListener('click', () => { st.on = !st.on; render(); if (audio.playing) audio.refresh(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(() => render8k(now(), st.on))));
    $('pin').addEventListener('click', () => { st.pinned = { kind: st.kind, N: st.N }; render(); });
    $('another').addEventListener('click', () => {
      audio.stop();
      st.caseIx = st.caseIx + 1 < CASES.length ? st.caseIx + 1 : 2;
      Object.assign(st, { kind: job().start[0], N: job().start[1], solved: false });
      buildAsk(); render(); host.querySelector('[data-window="rect"]').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      Object.assign(st, explore ? { N: 31, pinned: null, db: false, on: true } : { kind: job().start[0], N: job().start[1], db: true, on: true, solved: false });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  K.ask(document.getElementById('predict-zero'), {
    question: 'Start from the middle coefficient, 0.5, and add the nonzero pairs one at a time: h[1] and h[−1], then h[3] and h[−3], and so on. How does the running total move toward 1?',
    options: [['steady', 'It climbs to 1 without passing it'], ['swing', 'It passes 1 and swings around it'], ['short', 'It stays well below 1 for long']], right: 'swing',
    hints: {
      steady: 'The first pair alone adds 2 × 0.3183. Add that to 0.5: where does the total land?',
      short: 'The first pair alone adds 2 × 0.3183. Add that to 0.5: is that short of 1?',
    },
    explain: 'It passes 1 with the very first pair, and the pairs alternate in sign, so the total swings around 1. Here it is, pair by pair.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-zero' })),
  });

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const box = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    box.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
