(() => {
  const K = window.Kit, FS = 8000;
  const { fmt, hz, MINUS } = K;
  const TAU = 2 * Math.PI, W = f => TAU * f / FS;
  const pct1 = v => `${(v * 100).toFixed(1)}%`;
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  const NB = 0.86125, NA = 0.7225;
  const notchH = w => {
    const c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    const nr = NB * (1 + c2), ni = -NB * s2, dr = 1 + NA * c2, di = -NA * s2, d = dr * dr + di * di;
    return [(nr * dr + ni * di) / d, (ni * dr - nr * di) / d];
  };
  const notchGain = f => Math.hypot(...notchH(W(f)));
  const notchPhase = f => {
    let p = 0, prev = Math.atan2(notchH(0)[1], notchH(0)[0]);
    const n = Math.max(1, Math.ceil(f / 5));
    for (let i = 1; i <= n; i++) { const h = notchH(W(f * i / n)), q = Math.atan2(h[1], h[0]); let d = q - prev; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; p += d; prev = q; }
    return -p * 180 / Math.PI;
  };
  const notchGd = f => { const e = 0.01, a = notchH(W(f + e)), b = notchH(W(f - e)); let d = Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]); while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return -d / (W(f + e) - W(f - e)); };
  const apGain = (r, fp, f) => { const w = W(f), c = 2 * r * Math.cos(W(fp)), z = k => [Math.cos(k * w), -Math.sin(k * w)], b = [r * r, -c, 1], a = [1, -c, r * r]; const ev = q => q.reduce((s, ck, k) => [s[0] + ck * z(k)[0], s[1] + ck * z(k)[1]], [0, 0]); return Math.hypot(...ev(b)) / Math.hypot(...ev(a)); };
  const apGd = (r, fp, f) => { const w = W(f), t = W(fp), one = x => (1 - r * r) / (1 - 2 * r * Math.cos(x) + r * r); return one(w - t) + one(w + t); };

  function runNotch(x) {
    const y = new Float64Array(x.length);
    for (let n = 0; n < x.length; n++) y[n] = NB * (x[n] + (n >= 2 ? x[n - 2] : 0)) - NA * (n >= 2 ? y[n - 2] : 0);
    return y;
  }
  function runAllpass(x, r, fp) {
    const a = r * r, b = 2 * r * Math.cos(W(fp)), y = new Float64Array(x.length);
    for (let n = 0; n < x.length; n++) y[n] = a * x[n] - b * (n >= 1 ? x[n - 1] : 0) + (n >= 2 ? x[n - 2] : 0) + b * (n >= 1 ? y[n - 1] : 0) - a * (n >= 2 ? y[n - 2] : 0);
    return y;
  }

  const BL = 240, BN = 340, BC = (BL - 1) / 2;
  const hann = n => (n >= 0 && n < BL ? 0.5 - 0.5 * Math.cos(TAU * (n + 0.5) / BL) : 0);
  const bursts = new Map();
  function burstAt(f, notchOn = true) {
    if (!notchOn) {
      const key = `off${f}`;
      if (bursts.has(key)) return bursts.get(key);
      const w = W(f), xc = new Float64Array(BN), xs = new Float64Array(BN);
      for (let n = 0; n < BN; n++) { xc[n] = hann(n) * Math.cos(w * (n - BC)); xs[n] = hann(n) * Math.sin(w * (n - BC)); }
      const out = { f, xc, yc: xc, ys: xs, env: xc.map((v, i) => Math.hypot(v, xs[i])), late: 0, gain: 1, phase: 0, turn: 360 * f / FS, wave: 0, peakAmp: 1, off: true };
      bursts.set(key, out);
      return out;
    }
    if (bursts.has(f)) return bursts.get(f);
    const w = W(f), xc = new Float64Array(BN), xs = new Float64Array(BN);
    for (let n = 0; n < BN; n++) { xc[n] = hann(n) * Math.cos(w * (n - BC)); xs[n] = hann(n) * Math.sin(w * (n - BC)); }
    const yc = runNotch(xc), ys = runNotch(xs), env = yc.map((v, i) => Math.hypot(v, ys[i]));
    let k = 0; env.forEach((v, i) => { if (v > env[k]) k = i; });
    const a = env[k - 1], b = env[k], c = env[k + 1], peak = k + 0.5 * (a - c) / (a - 2 * b + c);
    const phase = notchPhase(f), turn = 360 * f / FS;
    const out = { f, xc, yc, ys, env, late: peak - BC, gain: notchGain(f), phase, turn, wave: phase / turn, peakAmp: b };
    bursts.set(f, out);
    return out;
  }

  const css = s => getComputedStyle(document.documentElement).getPropertyValue(s).trim();
  function marker(ctx, shape, x, y, color, s = 3.5) {
    ctx.fillStyle = color; ctx.beginPath();
    if (shape === 'square') ctx.rect(x - s, y - s, 2 * s, 2 * s);
    else if (shape === 'diamond') { ctx.moveTo(x, y - s - 1); ctx.lineTo(x + s + 1, y); ctx.lineTo(x, y + s + 1); ctx.lineTo(x - s - 1, y); ctx.closePath(); }
    else ctx.arc(x, y, s, 0, TAU);
    ctx.fill();
  }
  function ring(ctx, x, y, r, stroke, fill, width = 1.5) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  function xMark(pen, x, y, color, s = 5, width = 2) { pen.line([[x - s, y - s], [x + s, y + s]], color, width); pen.line([[x - s, y + s], [x + s, y - s]], color, width); }

  function mountAct1() {
    const $ = id => document.getElementById(id);
    const state = { tone: 1650, step: 0, pinned: null, notch: true, anim: 1 };
    const stage = K.stage($('a1-stage'), s => drawAct1(s), { height: w => (w < 560 ? 440 : 350) });
    const loop = K.loop($('a1-stage'), dt => {
      state.anim = Math.min(1, state.anim + dt / 1.6);
      stage.redraw();
      if (state.anim >= 1) loop.stop();
    });

    function drawAct1(s) {
      const { pen, c, w, h, ctx } = s, B = burstAt(state.tone, state.notch), shown = state.step >= 1;
      const L = 40, Rr = w - 14, topY = 26, topH = h * 0.26, zoomY = topY + topH + 66, zoomH = h - zoomY - 60;
      const X = n => L + n / (BN - 1) * (Rr - L), Y = v => topY + topH - v / 1.05 * topH;
      pen.text('the whole burst, 0 to 340 samples', L, 14, { align: 'left', color: c.soft, size: 11 });
      pen.line([[L, topY + topH], [Rr, topY + topH]], c.soft, 1);
      const reveal = Math.floor(state.anim * BN);
      const envIn = Array.from({ length: BN }, (_, n) => [X(n), Y(hann(n))]);
      pen.line(envIn, c.soft, 1.5, [6, 5]);
      if (shown) {
        if (state.pinned) pen.line(Array.from({ length: BN }, (_, n) => [X(n), Y(burstAt(state.pinned.f, state.pinned.notch).env[n])]), c.input, 1.5, [4, 4]);
        pen.line(Array.from(B.env.slice(0, reveal), (v, n) => [X(n), Y(v)]), c.ink, 2);
        if (state.anim >= 1) pen.line([[X(BC + B.late), topY], [X(BC + B.late), topY + topH]], c.accent, 2);
      }
      const z0 = 106, z1 = 134, ZX = t => L + (t - z0) / (z1 - z0) * (Rr - L), ZY = v => zoomY + zoomH / 2 - v / 1.1 * (zoomH / 2);
      ctx.strokeStyle = c.rule; ctx.lineWidth = 1; ctx.strokeRect(X(z0), topY - 4, X(z1) - X(z0), topH + 8);
      pen.text('zoom', X(z1) + 4, topY + topH - 4, { align: 'left', color: c.soft, size: 10 });
      pen.line([[X(z0), topY + topH + 4], [L, zoomY - 6]], c.rule, 1);
      pen.line([[X(z1), topY + topH + 4], [Rr, zoomY - 6]], c.rule, 1);
      pen.line([[L, ZY(0)], [Rr, ZY(0)]], c.soft, 1);
      const wv = W(B.f);
      const contIn = t => hann(t) * Math.cos(wv * (t - BC));
      const inPts = [], outPts = [];
      for (let i = 0; i <= 560; i++) { const t = z0 + (z1 - z0) * i / 560; inPts.push([ZX(t), ZY(contIn(t))]); }
      pen.line(inPts, c.soft, 1.5, [6, 5]);
      for (let n = Math.ceil(z0); n <= z1; n++) ring(ctx, ZX(n), ZY(contIn(n)), 3, c.soft, c.paper);
      if (shown) {
        const lim = state.anim >= 1 ? z1 : z0 + (z1 - z0) * Math.max(0, (state.anim - 0.25) / 0.75);
        for (let i = 0; i <= 560; i++) {
          const t = z0 + (z1 - z0) * i / 560; if (t > lim) break;
          const n = Math.floor(t), fr = t - n, a = B.env[n] + (B.env[n + 1] - B.env[n]) * fr, ph = Math.atan2(B.ys[n], B.yc[n]) + wv * fr;
          outPts.push([ZX(t), ZY(a * Math.cos(ph))]);
        }
        pen.line(outPts, c.ink, 2);
        for (let n = Math.ceil(z0); n <= Math.min(z1, lim); n++) pen.dot(ZX(n), ZY(B.yc[n]), 3, c.ink);
        if (state.anim >= 1) {
          const crestIn = BC, crestOut = BC + B.wave, peakOut = BC + B.late;
          pen.line([[ZX(crestIn), zoomY - 2], [ZX(crestIn), zoomY + zoomH]], c.soft, 1, [2, 3]);
          pen.line([[ZX(crestOut), zoomY + 8], [ZX(crestOut), zoomY + zoomH]], c.soft, 1.5);
          pen.line([[ZX(peakOut), zoomY - 2], [ZX(peakOut), zoomY + zoomH]], c.accent, 2);
          const by = zoomY - 20, wy = zoomY + zoomH + 16;
          pen.line([[ZX(crestIn), by + 4], [ZX(crestIn), by], [ZX(peakOut), by], [ZX(peakOut), by + 4]], c.accent, 2);
          const lab = (str, x, y, color, weight) => { const right = x + 6 + str.length * 7.3 > Rr; pen.text(str, right ? Rr : x + 6, y, { align: right ? 'right' : 'left', color, size: 12, weight }); };
          lab(`burst: ${fmt(B.late)} late`, ZX(peakOut), by - 6, c.accentInk, 500);
          pen.line([[ZX(crestIn), wy - 4], [ZX(crestIn), wy], [ZX(crestOut), wy], [ZX(crestOut), wy - 4]], c.soft, 2);
          lab(`wave: ${fmt(B.wave)} late`, ZX(crestOut), wy + 15, c.soft, 400);
        }
      } else {
        pen.rect((L + Rr) / 2 - 150, zoomY - 40, 300, 22, c.paper); pen.text('Answer the question to send the burst.', (L + Rr) / 2, zoomY - 24, { color: c.soft, size: 12 });
      }
      pen.text(`n = ${z0}`, L, h - 4, { align: 'left', color: c.soft, size: 10 });
      pen.text(`n = ${z1}`, Rr, h - 4, { align: 'right', color: c.soft, size: 10 });
    }

    function whyText(B) {
      const f = B.f, d1000 = burstAt(1000).late, gap = B.late - d1000;
      if (B.off) return `Notch off: the line passes the ${hz(f)} Hz burst untouched. Shape and wave arrive on time, 0.00 samples late. Turn the notch back on to see the burst fall behind its wave.`;
      if (f <= 1000) return `The bottom of the fax band. The phase climbs slowly here, so the burst is only ${fmt(B.late)} samples late, barely more than its wave (${fmt(B.wave)}).`;
      if (f < 1150) return `Near the bottom of the fax band: the burst is ${fmt(B.late)} samples late, its wave ${fmt(B.wave)}. A 1,000 Hz burst arrives ${gap < 0.005 ? 'at the same moment' : `only ${fmt(gap)} samples earlier`}.`;
      if (f < 1500) return `Still far from the notch: the burst is ${fmt(B.late)} samples late, ${fmt(gap)} after a 1,000 Hz burst. Its wave is ${fmt(B.wave)} late, so the shape has begun to fall behind the wave.`;
      if (f < 1800) return `Nearer the notch the burst falls behind its wave: ${fmt(B.late)} against ${fmt(B.wave)}. A 1,000 Hz burst would be ${fmt(gap)} samples ahead of it${gap > 1.5 ? ', already past the fax’s 1.5-sample window' : ', still inside the fax’s 1.5-sample window'}.`;
      if (f === 1800) return `The top of the fax band: ${fmt(B.late)} samples late, ${fmt(gap)} after a 1,000 Hz burst, about twice the fax’s 1.5-sample window. The wave inside is only ${fmt(B.wave)} late, and the gain is ${pct1(B.gain)}: loud enough.`;
      return `Above the fax band, right below the notch: the gain falls to ${pct1(B.gain)} and the burst is ${fmt(B.late)} samples late, while its wave is still under a sample (${fmt(B.wave)}).`;
    }

    function render() {
      const B = burstAt(state.tone, state.notch), shown = state.step >= 1;
      $('a1-tone').value = state.tone; $('a1-tone-out').textContent = `${hz(state.tone)} Hz`;
      $('a1-tone').disabled = state.step < 2; $('a1-send').disabled = state.step < 2; $('a1-pin').disabled = state.step < 2;
      $('a1-notch').setAttribute('aria-pressed', String(state.notch)); $('a1-notch').textContent = state.notch ? 'Notch on' : 'Notch off';
      const res = $('a1-result');
      res.textContent = `${hz(B.f)} Hz${B.off ? ', notch off' : ''} · gain ${pct1(B.gain)} · phase ${B.phase.toFixed(1)}° · phase ÷ turn ${fmt(B.wave)} samples · burst late by `;
      const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = shown ? `${fmt(B.late)} samples` : '?'; res.append(sp);
      $('a1-why').textContent = shown ? whyText(B) : 'The table gave the wave’s delay. Predict the burst’s, then it goes through.';
      $('a1-key-pin').hidden = !state.pinned;
      $('a1-compare').hidden = !state.pinned;
      if (state.pinned) {
        const P = burstAt(state.pinned.f, state.pinned.notch);
        $('a1-compare').textContent = P.f === B.f && Boolean(P.off) === Boolean(B.off) ? `Pinned ${hz(P.f)} Hz. Move the slider to compare.`
          : `Pinned ${hz(P.f)} Hz${P.off ? ', notch off' : ''}: burst ${fmt(P.late)}, wave ${fmt(P.wave)} samples late. Now ${hz(B.f)} Hz${B.off ? ', notch off' : ''}: burst ${fmt(B.late)}, wave ${fmt(B.wave)}. The burst moved ${fmt(Math.abs(B.late - P.late))} samples while the wave moved ${fmt(Math.abs(B.wave - P.wave))}: the burst follows how steeply the phase climbs, not the phase itself.`;
      }
      $('a1-stage').setAttribute('aria-label', shown ? `A ${hz(B.f)} Hz burst before and after the notch: its shape arrives ${fmt(B.late)} samples late, a wave crest inside it ${fmt(B.wave)} samples late.` : `A ${hz(B.f)} Hz burst before the notch.`);
      stage.redraw();
      if (audio.playing) audio.refresh();
      $('a1-now').textContent = nowText();
    }
    function send(animate = true) {
      state.anim = animate && !K.reduced.matches ? 0 : 1;
      render();
      if (state.anim < 1) loop.start();
    }

    function render8k() {
      const f = state.tone, period = BL + 160, reps = 10, out = new Float32Array(period * reps), w = W(f);
      for (let n = 0; n < out.length; n++) { const m = n % period; out[n] = hann(m) * Math.cos(w * m); }
      if (!state.notch) return out;
      const y = runNotch(out);
      return Float32Array.from(y);
    }
    function nowText() {
      if (!audio.playing) return 'Not playing. Play loops bursts at the slider’s tone.';
      return `Playing ${hz(state.tone)} Hz bursts ${state.notch ? 'through the notch' : 'with the notch off'}. A few samples is under a millisecond: your ear cannot hear it, the fax can.`;
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('a1-play').textContent = on ? 'Stop' : 'Play'; $('a1-now').textContent = nowText(); } });

    function asks() {
      K.ask($('a1-ask'), {
        question: 'The table says a steady 1,650 Hz tone is 0.40 samples late. How late will a 1,650 Hz burst be?',
        options: [['wave', '0.40 samples, like its wave'], ['mid', 'About 1.6 samples'], ['two', 'About 2.5 samples'], ['top', 'About 3.2 samples, like 1,800 Hz']], right: 'mid',
        hints: {
          wave: 'That is phase ÷ turn: how late the wiggles inside are. The opening said the 1,800 Hz bursts arrive about three samples late, while the table says their wave is only 0.56.',
          top: 'That is what the bursts right next to the notch do. 1,650 Hz is 150 Hz further away.',
          two: 'Too late for 1,650 Hz. The phase climbs more gently 100 Hz further from the notch: about 2.5 is where 1,750 Hz bursts land.',
        },
        explain: 'The burst arrives 1.65 samples late, four times its wave’s 0.40. Its shape travels much later than the wiggles inside it. One more question.',
        solved: state.step >= 1 ? 'right' : null,
        onSolved: () => { state.step = Math.max(state.step, 1); send(true); asks2(); },
        focusAfter: () => $('a1-ask2').querySelector('button'),
      });
      if (state.step >= 1) asks2();
    }
    function asks2() {
      K.ask($('a1-ask2'), {
        question: 'Now 1,900 Hz, closer to the notch. Its wave is 0.75 samples late. How late will its burst be?',
        options: [['less', 'Less than at 1,800 Hz: the notch eats it'], ['same', 'About 3.24, like 1,800 Hz'], ['more', 'Later than 1,800 Hz, about 5']], right: 'more',
        hints: {
          less: 'The notch does shrink it, to 43.9%, but lateness is not about size. Look at the trend: 1.65 at 1,650 Hz, 3.24 at 1,800 Hz.',
          same: 'From 1,650 Hz to 1,800 Hz the burst went from 1.65 to 3.24. Does that stop at 1,800 Hz?',
        },
        explain: 'It arrives 4.99 samples late, while its wave is still under a sample late. The closer to the notch, the later the burst. The slider is yours now: try 1,000 Hz, the bottom of the fax band.',
        solved: state.step >= 2 ? 'right' : null,
        onSolved: () => { state.step = 2; state.tone = 1900; send(true); document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' })); },
        focusAfter: () => $('a1-tone'),
      });
    }

    $('a1-tone').addEventListener('input', () => { state.tone = Math.round(Number($('a1-tone').value) / 10) * 10; state.anim = 1; render(); });
    $('a1-send').addEventListener('click', () => send(true));
    $('a1-play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('a1-notch').addEventListener('click', () => { state.notch = !state.notch; send(true); });
    $('a1-pin').addEventListener('click', () => { state.pinned = { f: state.tone, notch: state.notch }; render(); });
    $('a1-reset').addEventListener('click', () => {
      audio.stop(); loop.stop();
      Object.assign(state, { tone: state.step >= 2 ? 1650 : state.tone, pinned: null, notch: true, anim: 1 });
      render(); $('a1-reset').focus();
    });
    asks();
    render();
    return { stop: () => audio.stop() };
  }

  const CASES = [
    { lo: 800, hi: 1800, win: 1.5, ask: true, text: 'The fax from the opening now prints. A second customer, a print shop, has an older fax: it talks from 800 to 1,800 Hz and needs the same 1.5-sample window. Turn on the all-pass and move its pole until this fax prints clean.' },
    { lo: 1200, hi: 1850, win: 1.5, text: 'A newer fax talks from 1,200 to 1,850 Hz, closer to the notch, with a 1.5-sample window. Find the all-pass that makes it print clean.' },
    { lo: 800, hi: 1850, win: 2.0, text: 'A slow fax for long documents talks from 800 to 1,850 Hz. It is more forgiving: its window is 2.0 samples. Find the all-pass that makes it print clean.' },
  ];
  const START = { r: 0.4, a: 400 };

  function analyze(c, on, r, a) {
    let mn = Infinity, mx = -Infinity, fmn = c.lo, fmx = c.lo;
    for (let f = c.lo; f <= c.hi; f += 10) { const v = c.notch[(f - c.lo) / 10] + (on ? apGd(r, a, f) : 0); if (v < mn) { mn = v; fmn = f; } if (v > mx) { mx = v; fmx = f; } }
    return { spread: mx - mn, min: mn, max: mx, fmin: fmn, fmax: fmx };
  }
  function prepare(c) {
    if (c.notch) return c;
    c.notch = []; for (let f = c.lo; f <= c.hi; f += 10) c.notch.push(notchGd(f));
    c.minGain = Infinity; for (let f = c.lo; f <= c.hi; f += 10) c.minGain = Math.min(c.minGain, notchGain(f));
    c.solutions = [];
    for (let ri = 30; ri <= 95; ri++) for (let a = 0; a <= 2000; a += 10) if (analyze(c, true, ri / 100, a).spread <= c.win) c.solutions.push([ri / 100, a]);
    return c;
  }

  function faxPage(canvas, garble, c) {
    const rect = canvas.getBoundingClientRect(), wpx = Math.max(120, Math.round(rect.width)), hpx = Math.round(wpx * 0.42);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.style.height !== `${hpx}px`) canvas.style.height = `${hpx}px`;
    if (canvas.width !== Math.round(wpx * dpr)) { canvas.width = Math.round(wpx * dpr); canvas.height = Math.round(hpx * dpr); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = c.paper2; ctx.fillRect(0, 0, wpx, hpx);
    const cols = 60, rows = 25, cw = wpx / cols, ch = hpx / rows;
    const src = document.createElement('canvas'); src.width = cols; src.height = rows;
    const sx = src.getContext('2d'); sx.fillStyle = '#fff'; sx.fillRect(0, 0, cols, rows); sx.fillStyle = '#000';
    sx.font = 'bold 10px sans-serif'; sx.textBaseline = 'top'; sx.fillText('TEST PAGE', 2, 2);
    for (let x = 2; x < cols - 2; x += 4) sx.fillRect(x, 15, 2, 3);
    sx.fillRect(2, 20, cols - 4, 2);
    const data = sx.getImageData(0, 0, cols, rows).data;
    let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    ctx.fillStyle = c.ink;
    for (let y = 0; y < rows; y++) {
      const shift = Math.round((rand() - 0.3) * garble * 6);
      for (let x = 0; x < cols; x++) {
        const xs = Math.min(cols - 1, Math.max(0, x - shift)), on = data[(y * cols + xs) * 4] < 128;
        const flip = rand() < garble * 0.3;
        if (on !== flip) ctx.fillRect(x * cw, y * ch, cw + 0.4, ch + 0.4);
      }
    }
  }

  function mountAct2(host) {
    host.replaceChildren(document.getElementById('act2-lab').content.cloneNode(true));
    const $ = id => document.getElementById(id);
    const state = { ix: 0, on: false, r: START.r, a: START.a, unlocked: false, solved: false, drag: false };
    const caseNow = () => prepare(CASES[state.ix]);
    let layout = null;

    const stage = K.stage($('a2-stage'), s => drawAct2(s), { height: w => (w < 560 ? 620 : 330) });

    function drawAct2(s) {
      const { pen, c, w, h, ctx } = s, C = caseNow(), stacked = w < 560;
      const pz = stacked ? { x: 0, y: 0, w, h: 290 } : { x: 0, y: 0, w: 300, h };
      const gd = stacked ? { x: 44, y: 350, w: w - 58, h: h - 400 } : { x: 350, y: 34, w: w - 364, h: h - 80 };
      const cx = pz.x + pz.w / 2 - (stacked ? 20 : 30), cy = pz.y + pz.h / 2 + 6, U = Math.min(pz.w, pz.h) * 0.27;
      layout = { cx, cy, U };
      const P = (rad, deg) => [cx + rad * U * Math.cos(deg * Math.PI / 180), cy - rad * U * Math.sin(deg * Math.PI / 180)];
      pen.line([[cx - 1.3 * U, cy], [cx + 1.85 * U, cy]], c.soft, 1);
      pen.ring(cx, cy, U, c.ink, 1.5);
      pen.text('unit circle', cx, cy + U + 18, { color: c.soft, size: 10 });
      xMark(pen, ...P(0.85, 90), c.ink); xMark(pen, ...P(0.85, -90), c.ink);
      ring(ctx, ...P(1, 90), 4.5, c.ink, c.paper, 2); ring(ctx, ...P(1, -90), 4.5, c.ink, c.paper, 2);
      pen.text('notch', P(0.85, 90)[0] + 10, P(0.85, 90)[1] + 14, { align: 'left', color: c.soft, size: 10 });
      if (state.on) {
        const deg = state.a / FS * 360, zr = 1 / state.r, lim = 1.75;
        [deg, -deg].forEach((d, i) => {
          const [px, py] = P(state.r, d);
          pen.line([[cx, cy], P(Math.min(zr, lim), d)], c.input, 1, [3, 4]);
          xMark(pen, px, py, c.input, 6, 2.5);
          if (i === 0) pen.ring(px, py, 11, c.input, 1);
          if (zr <= lim) ring(ctx, ...P(zr, d), 5, c.input, c.paper, 2);
          else { const [zx, zy] = P(lim, d); pen.text(`zero at ${fmt(zr)} →`, zx, zy + (i ? 14 : -6), { align: 'center', color: c.input, size: 10 }); }
        });
        pen.text(`pole ${fmt(state.r)} at ${hz(state.a)} Hz`, cx, pz.y + pz.h - 8, { color: c.input, size: 11, weight: 500 });
      } else pen.text('all-pass off', cx, pz.y + pz.h - 8, { color: c.soft, size: 11 });
      if (!stacked) pen.line([[pz.x + pz.w + 12, 20], [pz.x + pz.w + 12, h - 20]], c.rule, 1);

      const f0 = 600, f1 = 2000, ymax = 10;
      const X = f => gd.x + (f - f0) / (f1 - f0) * gd.w, Y = v => gd.y + gd.h - Math.min(v, ymax + 0.4) / ymax * gd.h;
      const A = analyze(C, state.on, state.r, state.a);
      pen.rect(X(C.lo), gd.y, X(C.hi) - X(C.lo), gd.h, c.paper2);
      pen.rect(X(C.lo), Y(A.min + C.win), X(C.hi) - X(C.lo), Y(A.min) - Y(A.min + C.win), c.soft, 0.18);
      pen.line([[X(C.lo), Y(A.min + C.win)], [X(C.hi), Y(A.min + C.win)]], c.soft, 1.2);
      pen.line([[X(C.lo), Y(A.min)], [X(C.hi), Y(A.min)]], c.soft, 1.2);
      pen.line([[gd.x, gd.y + gd.h], [gd.x + gd.w, gd.y + gd.h]], c.soft, 1);
      [0, 2, 4, 6, 8, 10].forEach(v => pen.text(String(v), gd.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }));
      pen.text('group delay, samples', gd.x - 30, gd.y - 14, { align: 'left', color: c.soft, size: 11 });
      [600, 1000, 1400, 1800].forEach(f => pen.text(f === 1800 ? '1,800' : hz(f), X(f), gd.y + gd.h + 16, { color: c.soft, size: 10 }));
      pen.text('tone, Hz', gd.x + gd.w, gd.y + gd.h + 32, { align: 'right', color: c.soft, size: 10 });
      pen.text(`fax band ${hz(C.lo)} to ${hz(C.hi)} Hz`, X(C.lo) + 4, gd.y + 12, { align: 'left', color: c.soft, size: 10 });
      const curve = (fn, color, width, dash, shape) => {
        const pts = []; for (let f = f0; f <= 1990; f += 10) pts.push([X(f), Y(fn(f))]);
        pen.line(pts, color, width, dash);
        for (let f = 600; f <= 1800; f += 200) shape === 'circle' ? ring(ctx, X(f), Y(fn(f)), 3.5, color, c.paper) : marker(ctx, shape, X(f), Y(fn(f)), color);
      };
      curve(notchGd, c.soft, 1.5, [6, 5], 'circle');
      if (state.on) {
        curve(f => apGd(state.r, state.a, f), c.input, 2, [], 'square');
        curve(f => notchGd(f) + apGd(state.r, state.a, f), c.accent, 2.5, [], 'diamond');
      }
      const ok = A.spread <= C.win + 1e-9;
      const tag = `spread ${fmt(A.spread)} · window ${fmt(C.win, 1)}`;
      pen.text(tag, gd.x + gd.w, gd.y - (stacked ? 32 : 14), { align: 'right', color: ok ? c.input : c.accentInk, size: 12, weight: 500 });
      if (!ok) { const mx = X(A.fmax), my = Y(A.max); pen.ring(mx, my, 7, c.accent, 2); }
    }

    function nearest(C) {
      let best = null, bd = Infinity;
      for (const [r, a] of C.solutions) { const d = Math.hypot((r - state.r) / 0.05, (a - state.a) / 100); if (d < bd) { bd = d; best = [r, a]; } }
      return best;
    }
    function feedback() {
      const C = caseNow(), A = analyze(C, state.on, state.r, state.a);
      const nums = `The latest tone is ${hz(A.fmax)} Hz at ${fmt(A.max)} samples, the earliest ${hz(A.fmin)} Hz at ${fmt(A.min)}: a spread of ${fmt(A.spread)}, past the ${fmt(C.win, 1)}-sample window.`;
      state.solved = false;
      if (!state.unlocked) return 'Answer the question above to unlock the all-pass.';
      if (!state.on) return `The notch alone. ${nums} Turn on the all-pass.`;
      if (A.spread <= C.win) {
        state.solved = true;
        const before = C.notch[0], after = C.notch[0] + apGd(state.r, state.a, C.lo);
        return `Fixed. Every tone from ${hz(C.lo)} to ${hz(C.hi)} Hz arrives between ${fmt(A.min)} and ${fmt(A.max)} samples late: a spread of ${fmt(A.spread)}, inside the ${fmt(C.win, 1)}-sample window. The lowest gain in the band is still ${pct1(C.minGain)}, and the test page prints clean. The price: ${hz(C.lo)} Hz now arrives ${fmt(after)} samples late instead of ${fmt(before)}.`;
      }
      const angles = C.solutions.map(([, x]) => x), amin = Math.min(...angles), amax = Math.max(...angles);
      if (state.a < amin || state.a > amax) {
        return state.a < amin
          ? `The bump sits too low: at ${hz(state.a)} Hz it holds back tones below the part of the band the notch left early. ${nums} Move the pole’s angle up.`
          : `The bump sits too high: at ${hz(state.a)} Hz it adds delay near the top of the band, where the notch already holds tones back. ${nums} Move the pole’s angle down.`;
      }
      const nearA = angles.reduce((best, x) => (Math.abs(x - state.a) < Math.abs(best - state.a) ? x : best), angles[0]);
      const rs = C.solutions.filter(([, x]) => x === nearA).map(([r]) => r), rmin = Math.min(...rs), rmax = Math.max(...rs);
      if (state.r < rmin) return `The bump is in about the right place but too flat: a pole at radius ${fmt(state.r)} is too far from the circle to hold the early tones back enough. ${nums} Move the pole closer to the circle.`;
      if (state.r > rmax) return `The bump is in about the right place but too tall and narrow: with the pole at radius ${fmt(state.r)}, the tones near ${hz(state.a)} Hz now arrive too late, a new smear of its own. ${nums} Pull the pole in, away from the circle.`;
      const [tr, ta] = nearest(C);
      return `Almost. ${nums} Nudge the pole toward radius ${fmt(tr)} and ${hz(ta)} Hz.`;
    }

    function render() {
      const C = caseNow();
      $('a2-task').textContent = C.text;
      $('a2-on').disabled = !state.unlocked;
      $('a2-on').setAttribute('aria-pressed', String(state.on));
      $('a2-on').textContent = state.on ? 'All-pass on' : 'All-pass off';
      $('a2-r').disabled = !state.unlocked || !state.on; $('a2-a').disabled = !state.unlocked || !state.on;
      $('a2-r').value = state.r; $('a2-a').value = state.a;
      $('a2-r-out').textContent = fmt(state.r); $('a2-a-out').textContent = `${hz(state.a)} Hz`;
      const A = analyze(C, state.on, state.r, state.a);
      const msg = feedback();
      $('a2-result').textContent = `${hz(C.lo)} to ${hz(C.hi)} Hz · lowest gain ${pct1(C.minGain)} · group delay ${fmt(A.min)} to ${fmt(A.max)} samples · spread `;
      const sp = document.createElement('span'); sp.className = state.solved ? '' : 'changed'; sp.textContent = `${fmt(A.spread)} samples (window ${fmt(C.win, 1)})`; $('a2-result').append(sp);
      $('a2-why').textContent = msg;
      if (state.on) { let lo = Infinity, hi = 0; for (let f = 0; f <= 4000; f += 20) { const g = apGain(state.r, state.a, f); lo = Math.min(lo, g); hi = Math.max(hi, g); } K.meter($('a2-meter'), lo, { max: 1, text: hi - lo < 5e-4 ? '100.0%, every tone' : `${pct1(lo)} to ${pct1(hi)}` }); }
      else K.meter($('a2-meter'), 0, { max: 1, text: 'all-pass off' });
      const a = state.r * state.r, b = 2 * state.r * Math.cos(W(state.a));
      $('a2-program').textContent = state.on
        ? `notch, whose output is out1:\n  out1[n] = 0.861 × (input[n] + input[n - 2]) - 0.7225 × out1[n - 2]\nall-pass, which reads out1:\n  output[n] = ${a.toFixed(4)} × out1[n] - ${b.toFixed(3)} × out1[n - 1] + out1[n - 2]\n              + ${b.toFixed(3)} × output[n - 1] - ${a.toFixed(4)} × output[n - 2]`
        : 'notch:    output[n] = 0.861 × (input[n] + input[n - 2]) - 0.7225 × output[n - 2]\nall-pass: off';
      const garble = A.spread <= C.win ? 0 : Math.min(1, (A.spread - C.win) / C.win);
      faxPage($('a2-page'), garble, K.colors());
      $('a2-page-cap').textContent = garble ? 'The far-end fax’s test page: garbled, because late bursts overlap their neighbors.' : 'The far-end fax’s test page: clean.';
      $('a2-page').setAttribute('aria-label', garble ? 'The test page, garbled.' : 'The test page, printed clean.');
      $('a2-another').hidden = !state.solved;
      $('a2-stage').setAttribute('aria-label', `All-pass ${state.on ? `pole at radius ${fmt(state.r)} and ${hz(state.a)} Hz` : 'off'}. The line's group delay across ${hz(C.lo)} to ${hz(C.hi)} Hz spreads ${fmt(A.spread)} samples against a ${fmt(C.win, 1)}-sample window.`);
      stage.redraw();
      if (audio.playing) audio.refresh();
      $('a2-now').textContent = nowText();
      if (state.solved && state.ix === 0) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
    }

    function render8k() {
      const C = caseNow(), tones = [C.lo, C.hi, (C.lo + C.hi) / 2, C.hi, C.lo, (C.lo * 3 + C.hi) / 4], len = 40, reps = 25;
      const x = new Float64Array(tones.length * len * reps);
      for (let n = 0; n < x.length; n++) { const k = Math.floor(n / len) % tones.length, m = n % len; x[n] = 0.8 * Math.min(1, m / 3, (len - m) / 3) * Math.cos(W(tones[k]) * m); }
      let y = runNotch(x);
      if (state.on) y = runAllpass(y, state.r, state.a);
      return Float32Array.from(y);
    }
    function nowText() {
      if (!audio.playing) return 'Not playing. Play sends the fax’s bursts through the line.';
      return `Playing the fax’s bursts through the notch${state.on ? ' and the all-pass' : ''}. The smear is under a millisecond: the printout shows it, your ear will not.`;
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('a2-play').textContent = on ? 'Stop' : 'Play'; $('a2-now').textContent = nowText(); } });

    function asks() {
      $('a2-ask').replaceChildren();
      if (!CASES[state.ix].ask) { state.unlocked = true; return; }
      K.ask($('a2-ask'), {
        question: 'Before you touch the controls: put the lesson’s own all-pass, pole 0.65 at 1,200 Hz, on this fax. Will it print clean?',
        options: [['yes', 'Yes: the spread drops under 1.5'], ['no', 'No: its 800 Hz tones end up too early'], ['worse', 'No: the spread grows past the notch alone’s 2.99']], right: 'no',
        hints: {
          yes: 'That all-pass was tuned for a band that starts at 1,000 Hz. It holds back tones near 1,200 Hz most. How much does it give 800 Hz, 400 Hz below its pole?',
          worse: 'Its bump sits inside this band, below the late top, so it still evens out part of the notch’s spread instead of adding to it.',
        },
        explain: 'No. With that pole, 800 Hz arrives 3.75 samples late and 1,800 Hz 5.67: a spread of 1.92, past the 1.5-sample window. This fax’s band reaches lower, so the bump has to move. Find where: the all-pass is yours.',
        onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => $('a2-on'),
      });
    }

    const canvas = $('a2-stage');
    const toPole = e => {
      const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left - layout.cx, y = layout.cy - (e.clientY - rect.top);
      const r = Math.min(0.95, Math.max(0.3, Math.hypot(x, y) / layout.U));
      const deg = Math.min(90, Math.max(0, Math.atan2(Math.abs(y), x) * 180 / Math.PI));
      return { r: Math.round(r * 100) / 100, a: Math.round(deg / 360 * FS / 10) * 10 };
    };
    canvas.addEventListener('pointerdown', e => {
      if (!state.on || !layout) return;
      const p = toPole(e), th = state.a / FS * TAU, px = layout.cx + state.r * layout.U * Math.cos(th), py = layout.cy - state.r * layout.U * Math.sin(th);
      const rect = canvas.getBoundingClientRect();
      const ex = e.clientX - rect.left, ey = e.clientY - rect.top;
      if (Math.hypot(ex - px, ey - py) > 28 && Math.hypot(ex - px, ey - (2 * layout.cy - py)) > 28) return;
      state.drag = true; canvas.setPointerCapture(e.pointerId); Object.assign(state, p); render();
    });
    canvas.addEventListener('pointermove', e => { if (state.drag) { Object.assign(state, toPole(e)); render(); } });
    ['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, () => { state.drag = false; }));

    $('a2-on').addEventListener('click', () => { state.on = !state.on; render(); });
    $('a2-r').addEventListener('input', () => { state.r = Math.round(Number($('a2-r').value) * 100) / 100; render(); });
    $('a2-a').addEventListener('input', () => { state.a = Math.round(Number($('a2-a').value) / 10) * 10; render(); });
    $('a2-play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('a2-another').addEventListener('click', () => {
      audio.stop(); state.ix = (state.ix % (CASES.length - 1)) + 1;
      Object.assign(state, { on: false, r: START.r, a: START.a, solved: false });
      asks(); render(); $('a2-on').focus();
    });
    $('a2-reset').addEventListener('click', () => { audio.stop(); Object.assign(state, { on: false, r: START.r, a: START.a, solved: false }); render(); $('a2-reset').focus(); });
    new ResizeObserver(() => requestAnimationFrame(() => faxPage($('a2-page'), (() => { const C = caseNow(), A = analyze(C, state.on, state.r, state.a); return A.spread <= C.win ? 0 : Math.min(1, (A.spread - C.win) / C.win); })(), K.colors()))).observe($('a2-page'));
    asks();
    render();
    return { stop: () => audio.stop() };
  }

  const act1 = mountAct1();
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const mount = document.getElementById('act2-mount'), holder = document.createElement('div');
    mount.replaceChildren(holder);
    mountAct2(holder);
    const first = holder.querySelector('.k-ask button');
    (first || document.getElementById('a2-on')).focus();
  });
})();
