(() => {
  const K = window.Kit, FS = 8000, MINUS = K.MINUS, hz = K.hz, fmt = K.fmt;
  const $ = id => document.getElementById(id);
  const sec = n => `${(n / FS).toFixed(3)} s`;
  const ms = n => `${Number((n * 1000 / FS).toFixed(3)).toLocaleString('en-US')} ms`;
  const samples = n => `${hz(n)} sample${n === 1 ? '' : 's'}`;
  const reducedNow = () => K.reduced.matches;
  const perText = D => { const p = FS / D; return Number.isInteger(p) ? hz(p) : p >= 10 ? p.toFixed(1) : p.toFixed(2); };

  function makeFFT(N) {
    const bits = Math.log2(N), rev = new Uint32Array(N), cs = new Float64Array(N / 2), sn = new Float64Array(N / 2);
    for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
    for (let i = 0; i < N / 2; i++) { cs[i] = Math.cos(2 * Math.PI * i / N); sn[i] = -Math.sin(2 * Math.PI * i / N); }
    return (re, im) => {
      for (let i = 0; i < N; i++) {
        const r = rev[i];
        if (r > i) { let t = re[i]; re[i] = re[r]; re[r] = t; t = im[i]; im[i] = im[r]; im[r] = t; }
      }
      for (let len = 2; len <= N; len <<= 1) {
        const half = len >> 1, stride = N / len;
        for (let i = 0; i < N; i += len) {
          for (let k = 0; k < half; k++) {
            const wr = cs[k * stride], wi = sn[k * stride], p = i + k, q = p + half;
            const tr = re[q] * wr - im[q] * wi, ti = re[q] * wi + im[q] * wr;
            re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
          }
        }
      }
    };
  }

  function cepstrumOfLogs(fft, logs) {
    const N = logs.length, im = new Float64Array(N);
    fft(logs, im);
    for (let i = 0; i < N; i++) logs[i] /= N;
    return logs;
  }

  function arrowRight(pen, x, y, color) { pen.line([[x - 6, y - 4], [x, y], [x - 6, y + 4]], color, 1.5); }
  function envelope(s, P, xs, valueAt, color, { dash = [], width = 1.6, smoothPx = 8, period = Infinity, rangeAt = null } = {}) {
    const { pen } = s, cols = Math.max(2, Math.round(P.w));
    const span = (xs[1] - xs[0]) / cols;
    if (period / span >= smoothPx) {
      const pts = [];
      for (let c = 0; c <= cols * 4; c++) { const x = xs[0] + (c / 4) * span; pts.push([P.x + c / 4, P.Y(valueAt(x))]); }
      pen.line(pts, color, width, dash);
      return;
    }
    const hi = [], lo = [];
    for (let c = 0; c <= cols; c++) {
      let mn = Infinity, mx = -Infinity;
      if (rangeAt) [mn, mx] = rangeAt(xs[0] + (c - 0.5) * span, xs[0] + (c + 0.5) * span);
      else for (let j = 0; j <= 12; j++) { const v = valueAt(xs[0] + (c + j / 12 - 0.5) * span); mn = Math.min(mn, v); mx = Math.max(mx, v); }
      hi.push([P.x + c, P.Y(mx)]); lo.push([P.x + c, P.Y(mn)]);
    }
    if (dash.length) { pen.line(hi, color, width, dash); pen.line(lo, color, width, dash); return; }
    const { ctx } = s;
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.beginPath();
    hi.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    lo.reverse().forEach(([x, y]) => ctx.lineTo(x, y + 0.5));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function frame(x, y, w, h, xs, ys) {
    return { x, y, w, h, xs, ys, X: v => x + (v - xs[0]) / (xs[1] - xs[0]) * w, Y: v => y + h - (Math.max(ys[0], Math.min(ys[1], v)) - ys[0]) / (ys[1] - ys[0]) * h };
  }
  function xAxis(s, P, ticks, title, yAt = P.y + P.h) {
    const { pen, c } = s;
    pen.line([[P.x, yAt], [P.x + P.w, yAt]], c.soft, 1);
    ticks.forEach(([v, label], i) => pen.text(label, Math.min(P.x + P.w - 4, Math.max(P.x + 4, P.X(v))), P.y + P.h + 15, { color: c.soft, size: 10, align: i === ticks.length - 1 && P.X(v) > P.x + P.w - 20 ? 'right' : i === 0 && P.X(v) < P.x + 20 ? 'left' : 'center' }));
    if (title) pen.text(title, P.x + P.w, P.y + P.h + 30, { color: c.soft, size: 10, align: 'right' });
  }
  function yTicks(s, P, ticks) { ticks.forEach(([v, label]) => s.pen.text(label, P.x - 6, P.Y(v) + 4, { color: s.c.soft, size: 10, align: 'right' })); }
  function title(s, text, x, y) { s.pen.text(text, x, y, { align: 'left', color: s.c.ink, size: 13, font: 'body', weight: 600 }); }

  let toneDone = false;
  K.ask($('predict-every-tone'), {
    question: 'Does every tone come out 1.5 times as loud?',
    options: [['all', 'Yes, every tone'], ['some', 'No: some louder, some quieter'], ['none', 'No: every tone quieter']],
    right: 'some',
    hints: {
      all: 'Take 1,000 Hz, which repeats every 8 samples. Where was it 4 samples back, compared with where it is now?',
      none: 'Take 2,000 Hz, which repeats every 4 samples. Where was it 4 samples back?',
    },
    explain: 'It depends on where the tone was 4 samples back. Where it was in the same place, the echo adds; where it was on the opposite side, the echo pulls against it. Here are two tones worked out.',
    onSolved: () => { document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-every-tone' })); if (!toneDone) { toneDone = true; ask1(); a1Render(); } },
  });

  const N1 = 65536, fft1 = makeFFT(N1), COS1 = Float64Array.from({ length: N1 }, (_, i) => Math.cos(2 * Math.PI * i / N1));
  const gainAt = (f, D, a) => Math.sqrt(Math.max(1e-12, 1 + 2 * a * Math.cos(2 * Math.PI * f * D / FS) + a * a));
  const gainRange = (D, a, log = false) => (f0, f1) => {
    const t0 = 2 * Math.PI * f0 * D / FS, t1 = 2 * Math.PI * f1 * D / FS, c0 = Math.cos(t0), c1 = Math.cos(t1);
    const TAU = 2 * Math.PI, hasTop = TAU * Math.ceil(t0 / TAU) <= t1, hasDip = Math.PI + TAU * Math.ceil((t0 - Math.PI) / TAU) <= t1;
    const cmax = hasTop ? 1 : Math.max(c0, c1), cmin = hasDip ? -1 : Math.min(c0, c1);
    const g = cv => Math.sqrt(Math.max(1e-12, 1 + 2 * a * cv + a * a));
    return log ? [Math.log(g(cmin)), Math.log(g(cmax))] : [g(cmin), g(cmax)];
  };
  const cepCache = new Map();
  function echoCepstrum(D, a) {
    const key = `${D}|${a}`;
    if (cepCache.has(key)) return cepCache.get(key);
    const logs = new Float64Array(N1);
    for (let k = 0; k < N1; k++) logs[k] = 0.5 * Math.log(Math.max(1e-12, 1 + 2 * a * COS1[(k * D) % N1] + a * a));
    const c = cepstrumOfLogs(fft1, logs);
    if (cepCache.size > 12) cepCache.clear();
    cepCache.set(key, c);
    return c;
  }
  const qRangeFor = D => [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 8000].find(r => r >= 3.3 * D) || 8000;

  const SWEEP_LEN = 4 * FS;
  const SWEEP = (() => { const x = new Float32Array(SWEEP_LEN); let ph = 0; for (let n = 0; n < SWEEP_LEN; n++) { x[n] = Math.cos(ph); ph += 2 * Math.PI * (4000 * n / SWEEP_LEN) / FS; } return x; })();

  const a1 = { stage: 0, D: 4, a: 0.5, zoom: false, echo: true, pinned: null, sweepF: null };
  const zoomOK = () => a1.D >= 16;
  const xRange = () => (a1.zoom && zoomOK() ? [1000, Math.min(4000, 1000 + 4 * FS / a1.D)] : [0, 4000]);

  const stage1 = K.stage($('a1-stage'), s => {
    const { c, w, pen } = s, phone = w < 560;
    const left = phone ? 40 : 52, pw = w - left - 14, ph = phone ? 108 : 112, gap = phone ? 176 : 172;
    if (!toneDone) { pen.text('The plots open once you answer the question', w / 2, s.h / 2 - 9, { color: c.soft, size: 12 }); pen.text('in “A tiny echo, sample by sample”.', w / 2, s.h / 2 + 9, { color: c.soft, size: 12 }); return; }
    const xs = xRange(), period = FS / a1.D;
    const G = frame(left, 30, pw, ph, xs, [0, 1.95]);
    const Lg = frame(left, 30 + gap, pw, ph, xs, [-2.45, 0.75]);
    const tick = f => (Number.isInteger(f) ? hz(f) : Number(f.toFixed(1)).toLocaleString('en-US'));
    const ticks = (a1.zoom && zoomOK() ? [xs[0], (xs[0] + xs[1]) / 2, xs[1]] : phone ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]).map(f => [f, tick(f)]);
    title(s, 'gain, tone by tone', 0, 16);
    yTicks(s, G, [[0.5, '0.5'], [1, '1'], [1.5, '1.5']]);
    pen.line([[G.x, G.Y(1)], [G.x + G.w, G.Y(1)]], c.rule, 1);
    xAxis(s, G, ticks, 'tone (Hz)', G.Y(0));
    envelope(s, G, xs, f => gainAt(f, a1.D, a1.a), c.ink, { period, rangeAt: gainRange(a1.D, a1.a) });
    if (a1.pinned && a1.stage >= 1) envelope(s, G, xs, f => gainAt(f, a1.pinned.D, a1.pinned.a), c.input, { dash: [6, 4], width: 1.6, period: FS / a1.pinned.D, rangeAt: gainRange(a1.pinned.D, a1.pinned.a) });
    title(s, 'log of the gain', 0, Lg.y - 14);
    yTicks(s, Lg, [[0, '0'], [-1, `${MINUS}1`], [-2, `${MINUS}2`]]);
    xAxis(s, Lg, ticks, 'tone (Hz)', Lg.Y(0));
    envelope(s, Lg, xs, f => Math.log(gainAt(f, a1.D, a1.a)), c.ink, { period, rangeAt: gainRange(a1.D, a1.a, true) });
    if (a1.pinned && a1.stage >= 1) envelope(s, Lg, xs, f => Math.log(gainAt(f, a1.pinned.D, a1.pinned.a)), c.input, { dash: [6, 4], width: 1.6, period: FS / a1.pinned.D, rangeAt: gainRange(a1.pinned.D, a1.pinned.a, true) });
    if (a1.sweepF !== null && a1.sweepF >= xs[0] && a1.sweepF <= xs[1]) {
      const x = G.X(a1.sweepF);
      pen.line([[x, G.y], [x, G.y + G.h]], c.soft, 1.5, [2, 3]);
      pen.line([[x, Lg.y], [x, Lg.y + Lg.h]], c.soft, 1.5, [2, 3]);
      pen.dot(x, G.Y(gainAt(a1.sweepF, a1.D, a1.echo ? a1.a : 0)), 4, c.ink);
    }
    const Cy = 30 + 2 * gap;
    title(s, phone ? 'cepstrum (explained below)' : 'cepstrum: which periods the log of the gain repeats with (explained below)', 0, Cy - 14);
    if (a1.stage < 2) {
      pen.text('this plot opens after the questions above the plots', left + pw / 2, Cy + ph / 2, { color: c.soft, size: 12 });
      return;
    }
    const Q = qRangeFor(a1.D), C = frame(left, Cy, pw, ph, [0, Q], [-0.25, 0.5]);
    yTicks(s, C, [[0.4, '0.4'], [0.2, '0.2'], [0, '0'], [-0.2, `${MINUS}0.2`]]);
    const div = phone ? 2 : Q === 8000 ? 4 : 5;
    xAxis(s, C, Array.from({ length: div + 1 }, (_, i) => [(Q * i) / div, hz((Q * i) / div)]), 'position (samples)', C.Y(0));
    const stemsOf = (cc, color, dash, peakD) => {
      for (let q = 1; q <= Q; q++) {
        const v = cc[q];
        if (Math.abs(v) < 0.004) continue;
        const x = C.X(q), isPeak = q === peakD;
        pen.line([[x, C.Y(0)], [x, C.Y(v)]], isPeak && !dash.length ? c.accent : color, isPeak ? 2.5 : 1.8, dash);
        if (dash.length) pen.ring(x, C.Y(v), 3.5, color, 1.5); else pen.dot(x, C.Y(v), isPeak ? 4.5 : 3, isPeak ? c.accent : color);
      }
    };
    const cc = echoCepstrum(a1.D, a1.a);
    stemsOf(cc, c.ink, [], a1.D);
    if (a1.pinned) stemsOf(echoCepstrum(a1.pinned.D, a1.pinned.a), c.input, [4, 3], -1);
    if (a1.a > 0) {
      const label = `spike at ${hz(a1.D)}`, x = C.X(a1.D), right = x + 8 + label.length * 6.6 < C.x + C.w;
      pen.text(label, right ? x + 8 : x - 8, C.Y(cc[a1.D]) + 4, { align: right ? 'left' : 'right', color: c.accentInk, size: 11 });
    }
  }, { height: w => (w < 560 ? 546 : 540) });

  const sweepLoop = K.loop($('lab'), () => {
    if (!audio1.playing) return;
    const t = ((audio1.ctx.currentTime - audio1.startedAt) % audio1.duration + audio1.duration) % audio1.duration;
    a1.sweepF = 4000 * t / audio1.duration;
    stage1.redraw();
  });

  function a1Why() {
    const { D, a } = a1;
    if (a === 0) return 'Strength 0: no echo. The gain is 1 at every tone, its log is 0, and the cepstrum is empty.';
    const parts = [];
    if (D === 1) parts.push('Delay 1: one ripple takes 8,000 Hz, so between 0 and 4,000 Hz you see only half of it, loud at the bottom and quiet at the top.');
    else if (D === 2) parts.push('Delay 2: a peak at 0 Hz, a dip at 2,000 Hz, and the next peak right at the limit, 4,000 Hz.');
    else if (D <= 40) parts.push(`A peak every ${perText(D)} Hz: ${D % 2 ? `${(D / 2).toFixed(1)}` : D / 2} ripples between 0 and 4,000 Hz.`);
    else parts.push(`A peak every ${perText(D)} Hz: ${hz(Math.floor(D / 2))} ripples below the limit, 4,000 Hz${period1px() ? ', too fine to draw one by one, so the plots fill in. Zoom in on four ripples to see them' : ''}.`);
    if (a1.stage >= 3) {
      const up = Math.log(1 + a), down = Math.log(1 - a);
      parts.push(`In the log, the peaks reach ${fmt(up)} and the dips sink to ${fmt(down)}${a >= 0.7 ? ': the dips run far deeper than the peaks rise' : ''}.`);
    }
    if (a1.stage >= 2) parts.push(`The tall spike sits at position ${hz(D)}: the delay.`);
    if (D === 2400) parts.push('That is the slider’s end.');
    if (a1.stage === 2) parts.push('The strength slider opens after the question above the plots.');
    return parts.join(' ');
  }
  const period1px = () => { const r = xRange(); return (FS / a1.D) / ((r[1] - r[0]) / Math.max(200, $('a1-stage').clientWidth)) < 3; };
  function a1Compare() {
    const p = a1.pinned, name = q => `delay ${samples(q.D)}, strength ${q.a.toFixed(2)}`;
    if (p.D === a1.D && p.a === a1.a) return `Pinned: ${name(p)}. Move a control to compare.`;
    let tail;
    if (p.a === a1.a) {
      const r = a1.D / p.D;
      const ratio = Number.isInteger(r) ? `${r} times` : Number.isInteger(1 / r) ? `${1 / r} times` : `${(r >= 1 ? r : 1 / r).toFixed(2)} times`;
      tail = r > 1 ? `The delay is ${ratio} longer: the peaks are ${ratio} closer together, and the spike moved ${ratio} further out.` : `The delay is ${ratio} shorter: the peaks are ${ratio} further apart, and the spike moved ${ratio} closer to 0.`;
    } else if (p.D === a1.D) {
      tail = `Same delay, so the ripple keeps its spacing and the spike stays at ${hz(a1.D)}. ${a1.a > p.a ? 'More strength: the dips sink much further than the peaks rise, and the smaller spikes grow.' : 'Less strength: the ripple flattens, and the smaller spikes shrink first.'}`;
    } else tail = 'Both changed: the delay sets where the peaks and the spike sit, the strength sets how tall they are.';
    return `Pinned: ${name(p)}. Now: ${name(a1)}. ${tail}`;
  }
  let a1Queued = 0;
  function a1Render() {
    a1Queued = 0;
    $('a1-delay').value = a1.D; $('a1-delay-out').textContent = samples(a1.D);
    $('a1-strength').value = a1.a; $('a1-strength-out').textContent = a1.a.toFixed(2);
    const free = a1.stage >= 2;
    ['a1-delay', 'a1-half', 'a1-double', 'a1-play', 'a1-echo', 'a1-pin'].forEach(id => { $(id).disabled = !free; });
    $('a1-half').disabled = !free || a1.D <= 1; $('a1-double').disabled = !free || a1.D * 2 > 2400;
    $('a1-strength').disabled = a1.stage < 3;
    $('a1-zoom').disabled = !free || !zoomOK();
    $('a1-zoom').title = zoomOK() ? '' : 'Needs a delay of 16 samples or more';
    $('a1-zoom').setAttribute('aria-pressed', String(a1.zoom && zoomOK()));
    $('a1-echo').setAttribute('aria-pressed', String(a1.echo));
    $('a1-key-pin').hidden = !a1.pinned; $('a1-key-peak').hidden = a1.stage < 2; $('a1-key-sweep').hidden = !audio1.playing || reducedNow();
    const res = $('a1-result');
    res.textContent = `delay ${samples(a1.D)} (${ms(a1.D)}) · strength ${a1.a.toFixed(2)} · peak every ${perText(a1.D)} Hz`;
    if (a1.stage >= 2 && a1.a > 0) { const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = ` · spike at ${hz(a1.D)}`; res.append(sp); }
    $('a1-why').textContent = !toneDone ? 'Answer the question in “A tiny echo, sample by sample” first.' : a1.stage === 0 ? 'Answer the question above to move on.' : a1.stage === 1 ? 'Delay 8 now. One more question opens the cepstrum and the delay slider.' : a1Why();
    $('a1-compare').hidden = !a1.pinned;
    if (a1.pinned) $('a1-compare').textContent = a1Compare();
    $('a1-stage').setAttribute('aria-label', !toneDone ? 'The lab’s plots, not open yet.' : `Delay ${a1.D} samples, strength ${a1.a.toFixed(2)}: the gain peaks every ${perText(a1.D)} Hz between ${fmt(Math.abs(1 - a1.a))} and ${fmt(1 + a1.a)}${a1.stage >= 2 && a1.a > 0 ? `; the cepstrum's tallest spike is at position ${a1.D}` : ''}.`);
    stage1.redraw();
    if (audio1.playing) audio1.refresh();
    $('a1-now').textContent = now1();
  }
  const a1Schedule = () => { if (!a1Queued) a1Queued = requestAnimationFrame(a1Render); };

  function render1() {
    const { D, a } = a1, out = new Float32Array(SWEEP_LEN), on = a1.echo ? a : 0, scale = 0.9 / (1 + on);
    for (let n = 0; n < SWEEP_LEN; n++) out[n] = scale * (SWEEP[n] + on * SWEEP[(n - D + SWEEP_LEN) % SWEEP_LEN]);
    return out;
  }
  function now1() {
    if (!audio1.playing) return 'Not playing.';
    if (!a1.echo) return 'Playing the sweep, 0 to 4,000 Hz in 4 seconds, with no echo: steady loudness.';
    return `Playing the sweep through the echo, delay ${samples(a1.D)}: ${a1.D <= 4 ? 'a slow swell and fade' : a1.D <= 100 ? 'the loudness wobbles' : 'the wobble is so fast it sounds rough'}.`;
  }
  const audio1 = K.player({ rate: FS, gain: 0.3, onChange: on => {
    $('a1-play').textContent = on ? 'Stop' : 'Play the sweep';
    if (on) sweepLoop.start(); else { sweepLoop.stop(); a1.sweepF = null; stage1.redraw(); }
    $('a1-key-sweep').hidden = !on || reducedNow();
    $('a1-now').textContent = now1();
  } });

  const askBox = () => { const d = document.createElement('div'); $('a1-ask').append(d); return d; };
  function ask3() {
    K.ask(askBox(), {
      question: 'Before you touch the strength: raise it from 0.5 to 0.9. In the log of the gain, what happens?',
      options: [['same', 'The peaks rise as much as the dips sink'], ['dips', 'The dips sink much further than the peaks rise'], ['peaks', 'The peaks rise much further than the dips sink']],
      right: 'dips',
      hints: {
        same: 'In the gain itself that is true: the peaks go from 1.5 to 1.9 and the dips from 0.5 to 0.1. Now take the log of 0.1.',
        peaks: 'The peaks go from 1.5 to 1.9 and the dips from 0.5 to 0.1. Which of those changes more in the log?',
      },
      explain: 'The gain’s peaks go from 1.5 to 1.9 and its dips from 0.5 to 0.1. In the log the peaks only reach 0.64, but the dips sink to −2.30. Watch the small spikes further out grow too. The strength slider is yours.',
      onSolved: () => { a1.stage = 3; a1.a = 0.9; a1Render(); },
      focusAfter: () => $('a1-strength'),
    });
  }
  function ask2() {
    K.ask(askBox(), {
      question: 'The third plot is the cepstrum: it takes the log of the gain as a list round the whole circle of tones, 0 to 8,000 Hz, and asks which periods it repeats with, the way lesson 12’s DFT reads a list. With the delay at 8, where will its tall spike be?',
      options: [['1000', 'At 1,000'], ['8', 'At 8'], ['125', 'At 125'], ['0', 'At 0']],
      right: '8',
      hints: {
        1000: '1,000 Hz is how far apart the peaks are. The DFT counts something else: how many times the pattern goes round across the whole list.',
        125: 'That is 1,000 divided by 8. Count instead: how many 1,000 Hz ripples fit in 8,000 Hz?',
        0: 'Position 0 holds the list’s average. The ripple is about repeating.',
      },
      explain: '8,000 Hz round the circle holds eight 1,000 Hz ripples, so the spike sits at position 8: the delay itself. The next sections show why. The delay slider is yours: double it again and watch.',
      onSolved: () => { a1.stage = 2; a1Render(); ask3(); },
      focusAfter: () => $('a1-ask').querySelectorAll('.k-ask')[2]?.querySelector('button'),
    });
  }
  function ask1() {
  $('a1-ask').replaceChildren();
  K.ask(askBox(), {
    question: 'The lab starts at delay 4, a peak every 2,000 Hz. Double the delay to 8. Where is the first peak above 0 Hz?',
    options: [['4000', 'At 4,000 Hz'], ['2000', 'Still at 2,000 Hz'], ['1000', 'At 1,000 Hz'], ['500', 'At 500 Hz']],
    right: '1000',
    hints: {
      4000: 'A longer delay puts the echo further behind at every tone. Does it then come back round to the top sooner or later as the tone climbs?',
      2000: '2,000 Hz is a peak again, but is it the first? At 1,000 Hz each per-sample step is 45°: how far behind do eight of them put the echo?',
      500: 'At 500 Hz each step is 22.5°, so eight of them put the echo 180° behind: a dip, not a peak.',
    },
    explain: 'At 1,000 Hz, eight steps of 45° make 360°: a full lap, so the echo lands on top. The peaks now come every 1,000 Hz, twice as close. The plots show delay 8.',
    onSolved: () => { a1.stage = 1; a1.D = 8; a1Render(); ask2(); document.dispatchEvent(new CustomEvent('k:solved', { detail: 'a1-q1' })); },
    focusAfter: () => $('a1-ask').querySelectorAll('.k-ask')[1]?.querySelector('button'),
  });
  }
  $('a1-ask').innerHTML = '<p class="note">The lab opens once you answer the question in <a href="#a-tiny-echo-sample-by-sample">A tiny echo, sample by sample</a>.</p>';

  const setDelay = D => { a1.D = Math.max(1, Math.min(2400, D)); if (!zoomOK()) a1.zoom = false; a1Schedule(); };
  $('a1-delay').addEventListener('input', () => setDelay(Number($('a1-delay').value)));
  $('a1-strength').addEventListener('input', () => { a1.a = Number($('a1-strength').value); a1Schedule(); });
  $('a1-half').addEventListener('click', () => setDelay(Math.max(1, Math.round(a1.D / 2))));
  $('a1-double').addEventListener('click', () => setDelay(a1.D * 2));
  $('a1-zoom').addEventListener('click', () => { a1.zoom = !a1.zoom; a1Render(); });
  $('a1-echo').addEventListener('click', () => { a1.echo = !a1.echo; a1Render(); });
  $('a1-pin').addEventListener('click', () => { a1.pinned = { D: a1.D, a: a1.a }; a1Render(); });
  $('a1-play').addEventListener('click', () => (audio1.playing ? audio1.stop() : audio1.play(render1)));
  $('a1-reset').addEventListener('click', () => {
    audio1.stop();
    Object.assign(a1, { D: a1.stage >= 1 ? 8 : 4, a: a1.stage >= 3 ? 0.9 : 0.5, zoom: false, echo: true, pinned: null });
    a1Render(); $('a1-reset').focus();
  });
  K.reduced.addEventListener('change', a1Render);
  a1Render();

  const N2 = 8192, fft2 = makeFFT(N2);
  const HANN = Float64Array.from({ length: N2 }, (_, n) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / N2));
  const RAW = K.wav(window.LESSON_CALL);
  const PEAK = RAW.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6);
  const VOICE = Float64Array.from(RAW, v => v / PEAK);
  const START = (() => {
    let best = 2400, bestE = -1;
    for (let s = 2400; s + N2 <= VOICE.length; s += 512) {
      let e = 0;
      for (let n = 0; n < N2; n += 4) e += VOICE[s + n] * VOICE[s + n] * HANN[n];
      if (e > bestE) { bestE = e; best = s; }
    }
    return best;
  })();
  function cepstrumOf(x) {
    const re = new Float64Array(N2), im = new Float64Array(N2);
    for (let n = 0; n < N2; n++) re[n] = x[START + n] * HANN[n];
    fft2(re, im);
    let top = 0;
    for (let k = 0; k < N2; k++) { re[k] = Math.hypot(re[k], im[k]); top = Math.max(top, re[k]); }
    for (let k = 0; k < N2; k++) re[k] = Math.log(Math.max(re[k], top * 1e-6));
    return cepstrumOfLogs(fft2, re);
  }
  const echoed = (x, D, a) => { const y = new Float64Array(x.length); for (let n = 0; n < x.length; n++) y[n] = x[n] + (n >= D ? a * x[n - D] : 0); return y; };
  function cancel(x, D, s, mode) {
    const y = new Float64Array(x.length);
    if (mode === 'feedback') for (let n = 0; n < x.length; n++) y[n] = x[n] - (n >= D ? s * y[n - D] : 0);
    else for (let n = 0; n < x.length; n++) y[n] = x[n] - (n >= D ? s * x[n - D] : 0);
    return y;
  }
  const tallestFrom = (c, lo = 101) => { let b = lo; for (let q = lo; q < N2 / 2; q++) if (c[q] > c[b]) b = q; return b; };
  const C0 = cepstrumOf(VOICE);

  const DONE = 0.01, r2 = v => Math.round(v * 100) / 100;
  function fair(D, a, heard) {
    const c = cepstrumOf(heard), guess = r2(2 * c[D]), left = s => Math.abs(cepstrumOf(cancel(heard, D, s, 'feedback'))[D]);
    return tallestFrom(c) === D && guess <= a - 0.04 && left(guess) >= DONE && [a - 0.01, a, a + 0.01].every(s => left(r2(s)) < DONE);
  }
  function newCase(avoid) {
    for (let i = 0; i < 400; i++) {
      const D = 400 + Math.floor(Math.random() * 2001), a = r2(0.3 + Math.random() * 0.4);
      if (Math.abs(D - 2000) < 60 || Math.abs(C0[D]) >= 0.005 || (avoid && Math.abs(D - avoid) < 150)) continue;
      const heard = echoed(VOICE, D, a);
      if (fair(D, a, heard)) return { D, a, heard };
    }
    return { D: 1200, a: 0.5, heard: echoed(VOICE, 1200, 0.5) };
  }
  const START2 = { D: 2000, s: 0, mode: 'feedback' };
  const a2 = { ...START2, out: 'clean', unlocked: false, solved: false, firstDone: false, hidden: null, cache: null, round: 0 };
  function loadCase() {
    a2.hidden = newCase(a2.hidden && a2.hidden.D);
    a2.cache = null;
  }
  loadCase();
  function current() {
    const key = `${a2.D}|${a2.s}|${a2.mode}|${a2.hidden.D}|${a2.hidden.a}`;
    if (a2.cache && a2.cache.key === key) return a2.cache;
    const out = a2.s === 0 ? a2.hidden.heard : cancel(a2.hidden.heard, a2.D, a2.s, a2.mode);
    a2.cache = { key, out, c: cepstrumOf(out) };
    return a2.cache;
  }

  const stage2 = K.stage($('a2-stage'), s => {
    const { c, w, pen } = s, phone = w < 560, left = phone ? 40 : 52, pw = w - left - 14;
    const P = frame(left, 28, pw, phone ? 150 : 160, [0, N2 / 2], [-0.2, 0.4]);
    const cur = current(), cc = cur.c;
    title(s, 'cepstrum of what your canceller lets through', 0, 14);
    pen.rect(P.x, P.y, P.X(100) - P.x, P.h, c.paper2);
    yTicks(s, P, [[0.4, '0.4'], [0.2, '0.2'], [0, '0'], [-0.2, `${MINUS}0.2`]]);
    xAxis(s, P, (phone ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]).map(v => [v, hz(v)]), 'quefrency (samples; 8,000 is 1 s)', P.Y(0));
    const cols = Math.round(P.w), hi = [], lo = [];
    for (let i = 0; i < cols; i++) {
      const q0 = Math.max(1, Math.floor(i / cols * (N2 / 2))), q1 = Math.max(q0 + 1, Math.floor((i + 1) / cols * (N2 / 2)));
      let mn = Infinity, mx = -Infinity;
      for (let q = q0; q < q1; q++) { mn = Math.min(mn, cc[q]); mx = Math.max(mx, cc[q]); }
      hi.push([P.x + i, P.Y(mx)]); lo.push([P.x + i, P.Y(mn)]);
    }
    const { ctx } = s;
    ctx.save(); ctx.fillStyle = c.ink; ctx.beginPath();
    hi.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    lo.reverse().forEach(([x, y]) => ctx.lineTo(x, y + 0.8));
    ctx.closePath(); ctx.fill(); ctx.restore();
    if (!a2.unlocked) return;
    const lx = P.X(a2.D);
    pen.line([[lx, P.y], [lx, P.y + P.h]], c.input, 2);
    const span = 40, Z = frame(left, P.y + P.h + (phone ? 74 : 70), pw, phone ? 110 : 100, [a2.D - span - 0.5, a2.D + span + 0.5], [-0.2, 0.4]);
    title(s, phone ? 'close up round your delay' : 'close up round your delay, one stem per sample', 0, Z.y - 14);
    yTicks(s, Z, [[0.2, '0.2'], [0, '0']]);
    pen.line([[Z.x, Z.Y(0)], [Z.x + Z.w, Z.Y(0)]], c.soft, 1);
    for (let q = a2.D - span; q <= a2.D + span; q++) {
      if (q < 1 || q >= N2 / 2) continue;
      const x = Z.X(q), mine = q === a2.D;
      pen.line([[x, Z.Y(0)], [x, Z.Y(cc[q])]], mine ? c.input : c.ink, mine ? 2.5 : 1.4);
      pen.dot(x, Z.Y(cc[q]), mine ? 4 : 2.2, mine ? c.input : c.ink);
    }
    [a2.D - span, a2.D, a2.D + span].forEach((q, i) => { if (q >= 0) pen.text(hz(q), Z.X(q), Z.y + Z.h + 15, { color: i === 1 ? c.input : c.soft, size: 10, align: i === 0 ? 'left' : i === 2 ? 'right' : 'center' }); });
  }, { height: w => (a2.unlocked ? (w < 560 ? 420 : 400) : (w < 560 ? 230 : 236)) });

  function a2Eval() {
    const cur = current(), H = a2.hidden, cD = cur.c[H.D];
    const delayOK = a2.D === H.D, small = Math.abs(cD) < DONE;
    return { cur, H, cD, delayOK, small, solved: a2.unlocked && delayOK && a2.mode === 'feedback' && a2.s > 0 && small };
  }
  function a2Message(e) {
    const { H, cD, delayOK, cur } = e, mine = cur.c[a2.D];
    if (e.solved) {
      const head = `Fixed. The echo was ${samples(H.D)} late, ${sec(H.D)}, and your canceller subtracts ${a2.s.toFixed(2)} of its own output from that far back. The cepstrum at ${hz(H.D)} reads ${fmt(cD, 3)}, as flat as the voice alone.`;
      return a2.round === 0 ? `${head} The far caller’s words come through once, and the partner tickets stop.` : head;
    }
    if (a2.s === 0) {
      if (delayOK) return 'Your delay line sits on the peak. The canceller is still off: give it some strength, starting at about twice the peak’s height.';
      return 'Canceller off, strength 0: this is the call as heard. Find the tallest peak beyond quefrency 100, then move your delay line onto it. The close-up strip shows the quefrencies right round your delay, one stem per sample.';
    }
    if (!delayOK) {
      const d = a2.D - H.D;
      const own = ` Your canceller also adds a new echo of its own at ${hz(a2.D)}, the dip under your line (${fmt(mine)}).`;
      if (Math.abs(d) <= 5) return `Close, but off by a few samples: the echo is still there and your line sits just ${d < 0 ? 'before' : 'after'} it. Use the close-up and the −1 and +1 buttons.${own}`;
      return d < 0 ? `Delay too short: the call’s echo peak is further out than your line, so the canceller subtracts at the wrong moment.${own}` : `Delay too long: the call’s echo peak sits before your line, so the canceller subtracts at the wrong moment.${own}`;
    }
    if (a2.mode === 'feedforward') {
      const where = 2 * H.D < N2 / 2 ? ` (${fmt(cur.c[2 * H.D])} at ${hz(2 * H.D)})` : ', past the right end of this plot; listen for it';
      return `The echo at ${hz(H.D)} is gone, but a second echo appeared at 2D${where}: you are subtracting the heard signal, echo and all. Subtract a shifted copy of clean instead.`;
    }
    if (cD >= DONE) return `Echo still there at D: the cepstrum reads ${fmt(cD, 3)} at your delay, and it has to fall below 0.010. Raise the strength.`;
    return `The peak at D flipped into a dip, ${fmt(cD, 3)}: you subtract more echo than the call holds. Lower the strength.`;
  }
  let a2Queued = 0;
  function a2Render() {
    a2Queued = 0;
    const e = a2Eval();
    $('a2-task').textContent = a2.round === 0
      ? 'A call from the partner network, about one second of it. Somewhere in it is an echo: you don’t know its delay or its strength. The canceller ships set to lesson 2’s 2,000 samples and switched off. Read the delay off the cepstrum, set the canceller, and raise its strength until the peak is gone.'
      : 'Another call, another route: a new hidden delay and strength. Same job.';
    $('a2-delay').value = a2.D; $('a2-delay-out').textContent = `${samples(a2.D)}, ${sec(a2.D)}`;
    $('a2-strength').value = a2.s; $('a2-strength-out').textContent = a2.s.toFixed(2);
    ['a2-delay', 'a2-minus', 'a2-plus', 'a2-strength', 'a2-play'].forEach(id => { $(id).disabled = !a2.unlocked; });
    document.querySelectorAll('[data-mode]').forEach(b => { b.disabled = !a2.unlocked; b.setAttribute('aria-pressed', String(b.dataset.mode === a2.mode)); });
    document.querySelectorAll('[data-out]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.out === a2.out)));
    const res = $('a2-result');
    if (a2.unlocked) {
      res.textContent = `delay ${samples(a2.D)} · strength ${a2.s.toFixed(2)} · subtracting ${a2.mode === 'feedback' ? 'clean' : 'heard'} · cepstrum at your delay `;
      const sp = document.createElement('span'); sp.className = e.solved ? '' : 'changed'; sp.textContent = fmt(e.cur.c[a2.D], 3); res.append(sp);
      $('a2-why').textContent = a2Message(e);
    } else {
      res.textContent = `delay ${samples(a2.D)} · strength ${a2.s.toFixed(2)}`;
      $('a2-why').textContent = 'Answer the question above to unlock the canceller.';
    }
    a2.solved = e.solved;
    $('a2-another').hidden = !a2.solved;
    if (a2.solved && !a2.firstDone) { a2.firstDone = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' })); }
    $('a2-stage').setAttribute('aria-label', a2.unlocked ? `Cepstrum of the canceller's output, quefrency 0 to 4,096 samples, with your delay line at ${a2.D}, where it reads ${fmt(e.cur.c[a2.D])}.` : 'Cepstrum of the call as heard, quefrency 0 to 4,096 samples.');
    stage2.redraw();
    if (audio2.playing) audio2.refresh();
    $('a2-now').textContent = now2();
  }
  const a2Schedule = () => { if (!a2Queued) a2Queued = requestAnimationFrame(a2Render); };
  function render2() {
    const x = a2.out === 'heard' ? a2.hidden.heard : current().out;
    let p = 0;
    for (let n = 0; n < x.length; n++) p = Math.max(p, Math.abs(x[n]));
    const g = 0.9 / Math.max(p, 1e-6), y = new Float32Array(x.length + FS / 2);
    for (let n = 0; n < x.length; n++) y[n] = x[n] * g;
    return y;
  }
  function now2() {
    if (!audio2.playing) return 'Not playing.';
    if (a2.out === 'heard') return 'Playing the call as heard: every word, then its echo.';
    if (a2.s === 0) return 'Playing your canceller’s output: it is off, so this is the call as heard.';
    return `Playing your canceller’s output: delay ${samples(a2.D)}, strength ${a2.s.toFixed(2)}, subtracting ${a2.mode === 'feedback' ? 'clean' : 'heard'}.`;
  }
  const audio2 = K.player({ rate: FS, gain: 0.3, onChange: on => { $('a2-play').textContent = on ? 'Stop' : 'Play'; $('a2-now').textContent = now2(); } });

  function a2Ask() {
    $('a2-ask').replaceChildren();
    if (a2.round > 0) { a2.unlocked = true; return; }
    const q = document.createElement('div');
    $('a2-ask').append(q);
    K.ask(q, {
      question: 'Before you touch the canceller: say you find the right delay but set the strength too high, 0.9 against an echo of 0.5. What will the cepstrum show at the delay?',
      options: [['smaller', 'A smaller peak'], ['nothing', 'Nothing: the echo is gone'], ['dip', 'A dip below zero'], ['twice', 'Only a peak at twice the delay']],
      right: 'dip',
      hints: {
        smaller: 'A smaller peak means some of the echo is left over. Is that what happens when you subtract more than there is?',
        nothing: 'Nothing is left only when you subtract exactly as much as the echo holds.',
        twice: 'With a copy of clean, the echo’s own echo does not appear. Look at the delay itself.',
      },
      explain: 'Subtract more echo than the call holds and you leave an echo of the opposite sign, so the peak flips into a dip. If you see a dip at your delay, you have gone too far. The canceller is yours.',
      onSolved: () => { a2.unlocked = true; stage2.resize(); a2Render(); },
      focusAfter: () => $('a2-delay'),
    });
  }

  $('a2-delay').addEventListener('input', () => { a2.D = Number($('a2-delay').value); a2Schedule(); });
  $('a2-minus').addEventListener('click', () => { a2.D = Math.max(1, a2.D - 1); a2Render(); });
  $('a2-plus').addEventListener('click', () => { a2.D = Math.min(3000, a2.D + 1); a2Render(); });
  $('a2-strength').addEventListener('input', () => { a2.s = Number($('a2-strength').value); a2Schedule(); });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { a2.mode = b.dataset.mode; a2Render(); }));
  document.querySelectorAll('[data-out]').forEach(b => b.addEventListener('click', () => { a2.out = b.dataset.out; a2Render(); }));
  $('a2-play').addEventListener('click', () => (audio2.playing ? audio2.stop() : audio2.play(render2)));
  $('a2-another').addEventListener('click', () => {
    audio2.stop();
    a2.round += 1;
    loadCase();
    Object.assign(a2, START2, { solved: false });
    a2Ask(); a2Render(); $('a2-delay').focus();
  });
  $('a2-reset').addEventListener('click', () => {
    audio2.stop();
    Object.assign(a2, START2, { out: 'clean', solved: false });
    a2Render(); $('a2-reset').focus();
  });
  $('start-act2').addEventListener('click', () => {
    audio1.stop();
    $('start-act2').hidden = true; $('lab2').hidden = false;
    stage2.resize(); a2Render();
    ($('lab2').querySelector('.k-ask button') || $('a2-delay')).focus();
  });
  a2Ask(); a2Render();
})();
