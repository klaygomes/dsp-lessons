(() => {
  const K = window.Kit, FS = 8000;
  const { hz, MINUS } = K;
  const pc = v => `${(v * 100).toFixed(1)}%`;
  const signed = v => (Math.round(Math.abs(v)) === 0 ? '0' : `${v < 0 ? MINUS : '+'}${hz(Math.abs(v))}`);
  const warp = F => FS / Math.PI * Math.atan(Math.PI * F / FS);
  const unwarp = f => FS / Math.PI * Math.tan(Math.PI * f / FS);
  const exg = (F, c) => 1 / Math.sqrt(1 + (F / c) ** 4);
  const design = fc => {
    const W = 2 * Math.PI * fc, Kc = 2 * FS, A = Kc * Kc + Math.SQRT2 * W * Kc + W * W;
    return { b: [W * W / A, 2 * W * W / A, W * W / A], a: [(2 * W * W - 2 * Kc * Kc) / A, (Kc * Kc - Math.SQRT2 * W * Kc + W * W) / A] };
  };
  const dgain = ({ b, a }, f) => {
    const w = 2 * Math.PI * f / FS, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    return Math.hypot(b[0] + b[1] * c1 + b[2] * c2, b[1] * s1 + b[2] * s2) / Math.hypot(1 + a[0] * c1 + a[1] * c2, a[0] * s1 + a[1] * s2);
  };
  const run = ({ b, a }, x) => {
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let n = 0; n < x.length; n++) {
      const v = b[0] * x[n] + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
      x2 = x1; x1 = x[n]; y2 = y1; y1 = v; y[n] = v;
    }
    return y;
  };
  const SCRIPT = design(3400);

  const RULER_MAX = 100000, LOG = Math.log(RULER_MAX + 1);
  const posOfF = F => Math.log(F + 1) / LOG, FofPos = p => Math.exp(p * LOG) - 1;
  const C_MIN = 1000, C_MAX = 20000, CLOG = Math.log(C_MAX / C_MIN);
  const posOfC = C => Math.log(C / C_MIN) / CLOG, CofPos = p => C_MIN * Math.exp(p * CLOG);

  const CASES = [
    { X: 3250, text: 'The technician measured the real exchange this morning. Its capacitors have aged, and its 71% point now sits at 3,250 Hz, not the manual’s 3,400. Customers hear the real rack, so match the real rack: set the prototype’s cutoff so your copy passes 71% at 3,250 Hz.' },
    { X: 3100, text: 'The exchange in the next town is being switched off too. Its line filter is the same Butterworth design, with its 71% point at 3,100 Hz. Copy it.' },
    { X: 3500, text: 'A newer rack with a wider band: its 71% point sits at 3,500 Hz, up where the squeeze is strongest. Copy it.' },
    { X: 2900, text: 'An old rural line with a narrower band: its 71% point sits at 2,900 Hz. Copy it.' },
  ];

  const VOICE = (() => {
    const v = K.wav(window.LESSON_CALL), peak = v.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
    return v.map(s => 0.9 * s / peak);
  })();
  function fft(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inverse ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ar = re[i + k], ai = im[i + k], br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ar + br; im[i + k] = ai + bi; re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  let SPEC = null;
  const NFFT = 1 << Math.ceil(Math.log2(VOICE.length + FS / 4));
  function voiceThrough(gainAt) {
    if (!SPEC) {
      const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
      VOICE.forEach((v, i) => { re[i] = v; });
      fft(re, im, false); SPEC = { re, im };
    }
    const re = Float64Array.from(SPEC.re), im = Float64Array.from(SPEC.im);
    for (let k = 0; k <= NFFT / 2; k++) {
      const gk = gainAt(k * FS / NFFT);
      re[k] *= gk; im[k] *= gk;
      if (k && k < NFFT / 2) { re[NFFT - k] *= gk; im[NFFT - k] *= gk; }
    }
    fft(re, im, true);
    const out = new Float32Array(VOICE.length + FS / 4);
    for (let i = 0; i < out.length; i++) out[i] = re[i] / NFFT;
    return out;
  }
  const voicePadded = () => { const x = new Float32Array(VOICE.length + FS / 4); x.set(VOICE); return x; };

  function geom(w) {
    const phone = w < 560;
    const R = phone ? Math.max(70, Math.min(100, w / 2 - 60)) : 112;
    const cx = w / 2, cy = R + 58, rulerY = cy + 72;
    const P = { x0: phone ? 46 : 64, x1: w - (phone ? 40 : 70), y0: rulerY + 74, h: phone ? 160 : 170 };
    P.y1 = P.y0 + P.h;
    P.X = f => P.x0 + f / 4000 * (P.x1 - P.x0);
    P.Y = v => P.y1 - v / 1.05 * P.h;
    return { phone, R, cx, cy, rulerY, rx0: 24, rx1: w - 28, P };
  }

  function mountLab(host, mode) {
    host.replaceChildren(document.getElementById('ruler-lab').content.cloneNode(true));
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const state = explore
      ? { revealed: false, F: 3400, pinned: null, source: 'tone', through: 'cp' }
      : { caseIx: 0, C: CASES[0].X, unlocked: false, solved: false, everSolved: false, source: 'voice', through: 'cp' };
    const X = () => CASES[state.caseIx].X;
    const target = () => unwarp(X());
    const copyFilter = () => (explore ? SCRIPT : design(state.C));
    const exCut = () => (explore ? 3400 : X());
    const markF = () => (explore ? state.F : state.C);
    const markLive = () => (explore ? state.revealed : state.unlocked);

    const xOnRuler = (G, F) => G.rx0 + posOfF(F) * (G.rx1 - G.rx0);
    const onCircle = (G, f, extra = 0) => { const t = Math.PI * f / 4000; return [G.cx + (G.R + extra) * Math.cos(t), G.cy - (G.R + extra) * Math.sin(t)]; };

    const stage = K.stage($('stage'), s => {
      const { pen, c, w } = s, G = geom(w), { P } = G;
      const F = markF(), f = warp(F), flt = copyFilter(), cut = exCut();
      pen.line([[G.cx - G.R - 14, G.cy], [G.cx + G.R + 14, G.cy]], c.soft, 1);
      const arcPts = Array.from({ length: 91 }, (_, i) => onCircle(G, i * 4000 / 90));
      pen.line(arcPts, c.ink, 1.5);
      [1000, 2000, 3000].forEach(t => {
        const [x1, y1] = onCircle(G, t, -5), [x2, y2] = onCircle(G, t, 5), [lx, ly] = onCircle(G, t, -20);
        pen.line([[x1, y1], [x2, y2]], c.soft, 1);
        pen.text(hz(t), lx, ly + 4, { color: c.soft, size: 10 });
      });
      pen.text('0 Hz', G.cx + G.R, G.cy + 16, { color: c.soft, size: 10 });
      pen.text('4,000 Hz', G.cx - G.R, G.cy + 16, { color: c.soft, size: 10 });
      pen.text(G.phone ? 'the half circle: digital tones f' : 'the half circle: digital tones f, from 0 to 4,000 Hz', G.rx0, 16, { color: c.ink, size: 12, font: 'body', weight: 600, align: 'left' });

      const x4k = xOnRuler(G, 4000);
      pen.rect(x4k, G.rulerY - 9, G.rx1 - x4k, 9, c.paper2);
      pen.line([[G.rx0, G.rulerY], [G.rx1, G.rulerY]], c.ink, 1.5);
      const ticks = G.phone ? [[0, '0'], [100, '100'], [1000, '1,000'], [10000, '10,000'], [100000, '100,000']] : [[0, '0'], [10, '10'], [100, '100'], [1000, '1,000'], [10000, '10,000'], [100000, '100,000 Hz']];
      ticks.forEach(([t, lab]) => {
        const x = xOnRuler(G, t);
        pen.line([[x, G.rulerY], [x, G.rulerY + 5]], c.soft, 1);
        pen.text(lab, x, G.rulerY + 18, { color: c.soft, size: 10, align: t === 0 ? 'left' : t === RULER_MAX ? 'right' : 'center' });
      });
      pen.line([[x4k, G.rulerY - 9], [x4k, G.rulerY + 5]], c.soft, 2);
      pen.text(G.phone ? 'the analog ruler F, log scale' : 'the analog ruler: frequency F, log scale', G.rx0, G.rulerY + 36, { color: c.ink, size: 11, align: 'left' });

      if (!explore) {
        const [tx, ty] = onCircle(G, X());
        pen.ring(tx, ty, 7, c.ink, 2);
        const [lx, ly] = onCircle(G, X(), 22);
        pen.text(`exchange: ${hz(X())}`, lx - 4, ly, { color: c.ink, size: 11, align: 'right' });
      }
      if (explore && state.pinned !== null) {
        const xp = xOnRuler(G, state.pinned), [px, py] = onCircle(G, warp(state.pinned));
        pen.line([[xp, G.rulerY - 2], [px, py]], c.input, 1, [], 0.5);
        pen.ring(px, py, 7, c.input, 2); pen.ring(xp, G.rulerY - 7, 5, c.input, 2);
      }
      const xm = xOnRuler(G, F), [lx, ly] = onCircle(G, f);
      pen.line([[xm, G.rulerY - 8], [lx, ly]], c.soft, 1, [], markLive() ? 0.9 : 0.4);
      s.ctx.globalAlpha = markLive() ? 1 : 0.5;
      s.ctx.fillStyle = c.input; s.ctx.beginPath(); s.ctx.moveTo(xm, G.rulerY - 2); s.ctx.lineTo(xm + 7, G.rulerY - 15); s.ctx.lineTo(xm - 7, G.rulerY - 15); s.ctx.closePath(); s.ctx.fill();
      s.ctx.globalAlpha = 1;
      pen.dot(lx, ly, 6, c.accent);
      const [tx, ty] = onCircle(G, f, 18), right = f < 2000;
      pen.text(`f = ${hz(f)}`, tx + (right ? 2 : -2), ty + (f > 3900 ? -6 : 4), { color: c.accentInk, size: 12, align: right ? 'left' : 'right', weight: 500 });
      const fLab = `F = ${hz(F)}`, fx = Math.max(G.rx0 + 30, Math.min(G.rx1 - 30, xm));
      pen.text(fLab, fx, G.rulerY - 20, { color: c.input, size: 11, weight: 500 });

      pen.line([[P.x0, P.y1], [P.x1, P.y1]], c.soft, 1);
      pen.line([[P.x0, P.y0], [P.x0, P.y1]], c.soft, 1);
      [[0, '0%'], [0.5, '50%'], [1, '100%']].forEach(([v, lab]) => pen.text(lab, P.x0 - 6, P.Y(v) + 4, { color: c.soft, size: 10, align: 'right' }));
      (G.phone ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]).forEach(t => pen.text(t === 4000 ? '4,000 Hz' : hz(t), P.X(t), P.y1 + 16, { color: c.soft, size: 10, align: t === 4000 ? 'right' : 'center' }));
      pen.text('gain', P.x0, P.y0 - 8, { color: c.soft, size: 10, align: 'left' });
      pen.text(G.phone ? 'digital tone f' : 'digital tone f, from 0', P.x1, P.y1 + 32, { color: c.soft, size: 10, align: 'right' });
      pen.line([[P.x0, P.Y(Math.SQRT1_2)], [P.x1, P.Y(Math.SQRT1_2)]], c.soft, 1);
      pen.text('71%', P.x1 + 4, P.Y(Math.SQRT1_2) + 4, { color: c.soft, size: 10, align: 'left' });
      const N = 160, curvePts = fn => Array.from({ length: N + 1 }, (_, i) => { const t = 4000 * i / N; return [P.X(t), P.Y(fn(t))]; });
      pen.line(curvePts(t => exg(t, cut)), c.ink, 2.2);
      pen.line(curvePts(t => dgain(flt, t)), c.ink, 2, [9, 5]);
      [2000, 3000].forEach(t => { pen.dot(P.X(t), P.Y(exg(t, cut)), 4, c.ink); });
      [2000, 3000].forEach(t => { s.ctx.strokeStyle = c.ink; s.ctx.lineWidth = 1.6; s.ctx.strokeRect(P.X(t) - 3.5, P.Y(dgain(flt, t)) - 3.5, 7, 7); });

      if (explore) {
        const gv = exg(F, 3400), yv = P.Y(gv), xc = P.X(f);
        if (F <= 4000) {
          const xe = P.X(F);
          if (xe - xc > 26) {
            pen.line([[xe - 8, yv], [xc + 9, yv]], c.soft, 1.2);
            pen.line([[xc + 15, yv - 4], [xc + 9, yv], [xc + 15, yv + 4]], c.soft, 1.2);
            if (xe - xc > 90) pen.text('same gain', (xe + xc) / 2, yv + 15, { color: c.soft, size: 10 });
          }
          pen.ring(xe, yv, 6, c.ink, 2);
        } else {
          pen.line([[P.x1 + 2, yv], [xc + 9, yv]], c.soft, 1.2);
          pen.line([[xc + 15, yv - 4], [xc + 9, yv], [xc + 15, yv + 4]], c.soft, 1.2);
          pen.text(G.phone ? `from ${hz(F)}` : `same gain as the exchange at ${hz(F)} Hz`, Math.min(P.x1 - 4, xc + 20), yv - 7, { color: c.soft, size: 10, align: G.phone ? 'left' : 'left' });
        }
        pen.dot(xc, yv, 5.5, c.accent);
      } else {
        const fc = warp(state.C), xe = P.X(X()), xc = P.X(fc), y71 = P.Y(Math.SQRT1_2);
        pen.ring(xe, y71, 7, c.ink, 2);
        pen.dot(xc, y71, 5.5, c.accent);
        const close = Math.abs(X() - fc) < 15;
        if (close) pen.text(`both at ${hz(fc)}`, Math.min(xe, xc) - 10, y71 + 20, { color: c.accentInk, size: 11, align: 'right' });
        else {
          pen.text(`copy: ${hz(fc)}`, xc + (xc < xe ? -8 : 8), y71 + 20, { color: c.accentInk, size: 11, align: xc < xe ? 'right' : 'left' });
          pen.text(`exchange: ${hz(X())}`, xe + (xc < xe ? 8 : -8), y71 - 12, { color: c.ink, size: 11, align: xc < xe ? 'left' : 'right' });
        }
      }
    }, { height: w => (w < 560 ? 550 : 530) });

    const regions = (F, f) => {
      const d = f - F;
      if (F < 0.5) return '0 Hz on the ruler lands on 0 Hz on the half circle: the two start together.';
      if (F < 700) return `Low frequencies barely move: ${hz(F)} Hz lands ${Math.round(-d) === 0 ? 'on itself, to the nearest hertz' : `only ${hz(-d)} Hz lower`}. Down here the copy is almost exact.`;
      if (F < 2600) return `The squeeze starts to show: ${hz(F)} Hz lands ${hz(-d)} Hz lower, at ${hz(f)} Hz.`;
      if (Math.abs(F - 3400) < 0.5) return 'The exchange’s cutoff, 3,400 Hz, lands on 2,363 Hz. That’s the bug: your copy passes 71% at 2,363 Hz, where the exchange still passes far more.';
      if (F <= 4000) return `Deep in the squeeze: ${hz(F)} Hz lands ${hz(-d)} Hz lower. This is where the exchange’s cutoff lives, so this is where the copy goes wrong.`;
      if (F < 20000) return `Beyond the wall: your line could never carry ${hz(F)} Hz, but the squeeze still finds it a spot, at ${hz(f)} Hz. Everything from here up crowds into the last few hundred hertz.`;
      if (F >= RULER_MAX - 0.5) return 'The end of this ruler, 100,000 Hz, lands at 3,935 Hz. A million would land at 3,994 Hz, and infinity exactly on 4,000 Hz.';
      return `Far out: ${hz(F)} Hz lands at ${hz(f)} Hz, only ${hz(4000 - f)} Hz below 4,000 Hz. Infinity itself would land exactly on 4,000 Hz.`;
    };
    const gainLine = (F, f) => {
      const gv = exg(F, 3400), gc = dgain(SCRIPT, f);
      return F <= 4000
        ? ` The exchange passes ${pc(gv)} at ${hz(F)} Hz; your copy passes ${pc(gc)} at ${hz(f)} Hz: the same gain${Math.round(F - f) === 0 ? ', at the same tone to the nearest hertz.' : ', moved down to a new tone.'}`
        : ` The exchange passes ${pc(gv)} at ${hz(F)} Hz, a frequency your line cannot carry; your copy passes that same ${pc(gc)} at ${hz(f)} Hz.`;
    };

    function fixFeedback() {
      const x = X(), C = state.C, T = target(), fc = warp(C), gx = dgain(design(C), x), drop = x - warp(x);
      state.solved = Math.abs(gx - Math.SQRT1_2) <= 0.01;
      if (state.solved) return `Fixed. At ${hz(x)} Hz your copy passes ${pc(gx)}, and its 71% point sits on the exchange’s. The prototype’s cutoff is ${hz(C)} Hz, ${(C / x).toFixed(1)} times the exchange’s own. ${state.caseIx === 0 ? 'The technician plays her tones through both, and the line sounds bright again.' : 'Another exchange copied.'}`;
      if (Math.abs(C - x) / x < 0.005) return `That is the script’s setting: the prototype at the exchange’s own ${hz(x)} Hz. The squeeze drags that cutoff down to ${hz(fc)} Hz, and at ${hz(x)} Hz your copy passes only ${pc(gx)}.`;
      if (Math.abs(C - warp(x)) / warp(x) < 0.02) return `${hz(C)} Hz is where ${hz(x)} Hz lands: the squeeze run forward, with arctan. Prewarping runs it backward, with tan, from the tone you want.`;
      if (C < x) return `Below the exchange’s own cutoff. The squeeze only ever moves frequencies down, so a lower prototype lands lower still, at ${hz(fc)} Hz. Go up, not down.`;
      if (Math.abs(C - (x + drop)) / (x + drop) < 0.03) return `You added back the drop: ${hz(x)} Hz landed ${hz(drop)} Hz low, so you asked for ${hz(C)} Hz. But up here the squeeze is stronger, so ${hz(C)} Hz itself lands at ${hz(fc)} Hz, still short. Keep going up.`;
      if (C < T) return `Up, but not enough: your copy’s 71% point lands at ${hz(fc)} Hz, ${hz(x - fc)} Hz below the exchange’s. At ${hz(x)} Hz it passes ${pc(gx)}. Near the top of the line the squeeze is strong, so the prototype has to go much higher.`;
      return `Too high: your copy’s 71% point lands at ${hz(fc)} Hz, ${hz(fc - x)} Hz above the exchange’s, so at ${hz(x)} Hz it passes ${pc(gx)} instead of 70.7%. Come back down.`;
    }

    function nowText() {
      if (!audio.playing) return explore && !state.revealed ? 'Answer the questions above to play.' : 'Not playing.';
      const through = { ex: explore ? 'the exchange' : `the exchange (${hz(X())} Hz)`, cp: 'your copy', off: 'no filter' }[state.through];
      if (state.source === 'tone') {
        const f = Math.round(warp(markF())), g = state.through === 'off' ? 1 : state.through === 'ex' ? exg(f, exCut()) : dgain(copyFilter(), f);
        if (f < 1) return 'The landing point is 0 Hz: a 0 Hz tone is silence.';
        return `Playing a ${hz(f)} Hz tone, the landing point, through ${through}: it passes ${pc(g)}.`;
      }
      return `Playing the recorded voice through ${through}.${state.through === 'cp' && explore ? ' Listen for the top of the voice going dull.' : ''}`;
    }
    const cache = new Map();
    function render8k() {
      const flt = copyFilter(), F = markF();
      if (state.source === 'tone') {
        const f = Math.round(warp(F)), base = Float32Array.from({ length: 2 * FS }, (_, n) => 0.5 * Math.sin(2 * Math.PI * f * n / FS));
        const y = state.through === 'off' ? base : state.through === 'ex' ? base.map(v => v * exg(f, exCut())) : run(flt, base);
        return y.slice(FS);
      }
      const key = `${state.through}:${state.through === 'ex' ? exCut() : state.through === 'cp' ? (explore ? 'script' : state.C) : ''}`;
      if (!cache.has(key)) {
        if (cache.size > 12) cache.clear();
        cache.set(key, state.through === 'off' ? voicePadded() : state.through === 'ex' ? voiceThrough(t => exg(t, exCut())) : run(flt, voicePadded()));
      }
      return cache.get(key);
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play'; $('now').textContent = nowText(); } });

    function render() {
      const F = markF(), f = warp(F);
      host.querySelectorAll('[data-source]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.source === state.source)));
      host.querySelectorAll('[data-through]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.through === state.through)));
      $('play').disabled = !markLive(); $('pin').disabled = !explore || !state.revealed;
      if (explore) {
        $('F').value = String(Math.round(posOfF(state.F) * 1000));
        $('F-out').textContent = `${hz(state.F)} Hz`;
        $('F').setAttribute('aria-valuetext', `${hz(state.F)} Hz, lands on ${hz(f)} Hz`);
        $('F').disabled = !state.revealed;
        host.querySelectorAll('[data-hz]').forEach(b => { b.disabled = !state.revealed; });
        if (state.revealed) {
          $('result').textContent = `F = ${hz(F)} Hz on the ruler → `;
          const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = `f = ${hz(f)} Hz`;
          $('result').append(sp, ` · moved ${signed(f - F)} Hz`);
          $('why').textContent = regions(F, f) + (F < 0.5 ? '' : gainLine(F, f));
        } else {
          $('result').textContent = `F = ${hz(F)} Hz on the ruler → f = ${hz(f)} Hz`;
          $('why').textContent = 'Answer the questions above, then the mark is yours to drag.';
        }
        $('compare').hidden = state.pinned === null;
        if (state.pinned !== null) {
          const p = state.pinned, pf = warp(p);
          $('compare').textContent = Math.abs(p - F) < 0.5 ? `Pinned ${hz(p)} Hz → ${hz(pf)} Hz. Move the mark to compare.`
            : `Pinned ${hz(p)} Hz → ${hz(pf)} Hz; now ${hz(F)} Hz → ${hz(f)} Hz. On the ruler they are ${hz(Math.abs(F - p))} Hz apart; on the half circle, only ${hz(Math.abs(f - pf))} Hz. ${Math.max(F, p) > 4000 ? 'The higher you go, the harder the squeeze.' : 'Even below 4,000 Hz the squeeze shrinks the gap.'}`;
        }
        $('key-pin').hidden = state.pinned === null;
        $('stage').setAttribute('aria-label', `The analog ruler with a mark at ${hz(F)} Hz, landing on the half circle at ${hz(f)} Hz; below, the exchange's gain and your copy's gain from 0 to 4,000 Hz.`);
      } else {
        const x = X(), fc = warp(state.C), gx = dgain(design(state.C), x);
        $('task-text').textContent = CASES[state.caseIx].text;
        $('C').value = String(Math.round(posOfC(state.C) * 1000));
        $('C-out').textContent = `${hz(state.C)} Hz`;
        $('C').setAttribute('aria-valuetext', `${hz(state.C)} Hz, its 71% point lands at ${hz(fc)} Hz`);
        ['C', 'C-typed', 'C-set'].forEach(k => { $(k).disabled = !state.unlocked; });
        $('result').textContent = `prototype cutoff ${hz(state.C)} Hz → your copy’s 71% point at `;
        const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = `${hz(fc)} Hz`;
        $('result').append(sp, ` · the exchange’s at ${hz(x)} Hz`);
        $('why').textContent = state.unlocked ? fixFeedback() : 'Answer the question above to unlock the knob. Right now the knob sits where the script put it: the exchange’s own cutoff.';
        K.meter($('meter'), gx, { max: 1, text: `${pc(gx)} at ${hz(x)} Hz` });
        $('meter-label').textContent = `The technician’s meter: your copy at ${hz(x)} Hz (target 70.7%)`;
        $('another').hidden = !state.solved;
        $('myth').hidden = !state.solved;
        if (state.solved) {
          const below = x - 400;
          $('myth').textContent = `One more look, 400 Hz below the cutoff: at ${hz(below)} Hz the exchange passes ${pc(exg(below, x))} and your copy ${pc(dgain(design(state.C), below))}. At 4,000 Hz: ${pc(exg(4000, x))} against 0%. The knob pinned one tone, not the whole curve.`;
          if (!state.everSolved) { state.everSolved = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' })); }
        }
        $('stage').setAttribute('aria-label', `The prototype's cutoff at ${hz(state.C)} Hz on the analog ruler lands at ${hz(fc)} Hz; the exchange's 71% point is at ${hz(x)} Hz. Below, the exchange's gain and your copy's gain from 0 to 4,000 Hz.`);
      }
      stage.redraw();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    function buildAsks() {
      if (explore) {
        const second = () => {
          K.ask($('ask2'), {
            question: 'So how much of a 3,800 Hz tone does your copy pass?',
            options: [['62', '62.5%, what the exchange passes at 3,800 Hz'], ['11', 'About 11%'], ['1', 'About 1%']], right: '1',
            hints: { 62: 'That is the exchange’s gain at analog 3,800 Hz. Your copy at 3,800 Hz copies the exchange at a different frequency: which one?', 11: 'That is the exchange at 10,000 Hz, which lands at 3,365 Hz. 3,800 Hz comes from much further out.' },
            explain: 'Your copy at 3,800 Hz passes exactly what the exchange passes at 32,356 Hz: 1.1%. The ruler and the presets are yours now.',
            reveal: 'Skip: show me', solved: state.revealed ? 'right' : null,
            onSolved: () => { state.revealed = true; render(); }, focusAfter: () => $('F'),
          });
        };
        K.ask($('ask'), {
          question: 'Which analog frequency lands on the digital tone 3,800 Hz?',
          options: [['4300', 'About 4,300 Hz'], ['10000', 'About 10,000 Hz'], ['32000', 'About 32,000 Hz']], right: '32000',
          hints: { 4300: 'Down low the squeeze is gentle, but up here it is strong: 3,400 Hz already landed a thousand hertz low.', 10000: 'The table says 10,000 Hz lands on 3,365 Hz. 3,800 Hz is higher still, so it comes from further out.' },
          explain: 'Run it backward: 2546.5 × tan(π × 3,800 ÷ 8,000) = 2546.5 × 12.71 = 32,356 Hz, between the table’s 20,000 (3,678) and 100,000 (3,935).',
          reveal: 'Skip: show me', solved: state.revealed ? 'right' : null,
          onSolved: () => second(), focusAfter: () => $('ask2').querySelector('button'),
        });
        if (state.revealed) second();
        return;
      }
      if (state.unlocked) { $('ask').replaceChildren(); return; }
      K.ask($('ask'), {
        question: 'Before you touch the knob: once your copy’s 71% point sits on the exchange’s, how will the two compare at the other tones?',
        options: [['same', 'They will match at every tone'], ['flat', 'Your copy will pass more below the cutoff and less above it'], ['low', 'Your copy will pass less below the cutoff and more above it']], right: 'flat',
        hints: { same: 'The knob moves one number, the prototype’s cutoff. The squeeze still bends every other tone: where does the analog filter’s infinity land?', low: 'Above the cutoff your copy must reach 0% at 4,000 Hz, where infinity lands. The exchange never reaches 0%. Which one passes more up there?' },
        explain: 'One knob pins one tone. Below it your copy comes out flatter than the exchange, above it steeper, down to 0% at 4,000 Hz. The knob is yours: find the setting.',
        onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => $('C'),
      });
    }

    if (!explore) {
      ['F-control', 'presets', 'jump'].forEach(k => { $(k).hidden = true; });
      ['task', 'C-control', 'meter', 'key-target'].forEach(k => { $(k).hidden = false; });
      $('pin').hidden = true;
      $('key-mark').textContent = 'the prototype’s cutoff, on the analog ruler';
      $('key-ex').textContent = 'the exchange you must match';
      $('key-cp').textContent = 'your copy, with the knob’s prototype';
      host.querySelector('[data-source="tone"]').textContent = 'A tone at your copy’s cutoff';
    }

    const setF = F => { state.F = Math.max(0, Math.min(RULER_MAX, Math.round(F))); render(); };
    const setC = C => { state.C = Math.max(C_MIN, Math.min(C_MAX, Math.round(C))); $('C-msg').textContent = ''; $('C-msg').classList.remove('bad'); render(); };
    $('F').addEventListener('input', () => setF(FofPos(Number($('F').value) / 1000)));
    $('C').addEventListener('input', () => setC(CofPos(Number($('C').value) / 1000)));
    host.querySelectorAll('[data-hz]').forEach(b => b.addEventListener('click', () => setF(Number(b.dataset.hz))));
    const typed = () => {
      const raw = $('C-typed').value.trim().replace(/,/g, ''), msg = $('C-msg');
      const bad = t => { msg.textContent = t; msg.classList.add('bad'); $('C-typed').focus(); };
      if (!raw) return bad('Type a cutoff in hertz first, for example 5,000.');
      if (!/^\d+$/.test(raw)) return bad('Type a whole number of hertz, digits only, for example 5,000.');
      const v = Number(raw);
      if (v < C_MIN || v > C_MAX) return bad(`The knob runs from 1,000 to 20,000 Hz; ${hz(v)} Hz is outside it.`);
      setC(v);
    };
    $('C-set').addEventListener('click', typed);
    $('C-typed').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); typed(); } });

    const canvas = $('stage');
    let dragging = false;
    const fromPointer = e => {
      const r = canvas.getBoundingClientRect(), G = geom(r.width), x = e.clientX - r.left, p = Math.max(0, Math.min(1, (x - G.rx0) / (G.rx1 - G.rx0)));
      if (explore) setF(FofPos(p)); else setC(FofPos(p));
    };
    canvas.addEventListener('pointerdown', e => {
      if (!markLive()) return;
      const r = canvas.getBoundingClientRect(), G = geom(r.width), y = e.clientY - r.top;
      if (Math.abs(y - G.rulerY) > 30) return;
      dragging = true; canvas.setPointerCapture(e.pointerId); fromPointer(e);
    });
    canvas.addEventListener('pointermove', e => { if (dragging) fromPointer(e); });
    ['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, () => { dragging = false; }));

    host.querySelectorAll('[data-source]').forEach(b => b.addEventListener('click', () => { state.source = b.dataset.source; render(); }));
    host.querySelectorAll('[data-through]').forEach(b => b.addEventListener('click', () => { state.through = b.dataset.through; render(); }));
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('pin').addEventListener('click', () => { state.pinned = state.F; render(); });
    $('another').addEventListener('click', () => {
      audio.stop();
      state.caseIx = (state.caseIx % (CASES.length - 1)) + 1;
      Object.assign(state, { C: CASES[state.caseIx].X, solved: false });
      $('C-typed').value = ''; $('C-msg').textContent = '';
      render(); $('C').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(state, { F: 3400, pinned: null, source: 'tone', through: 'cp' });
      else Object.assign(state, { C: X(), solved: false, source: 'voice', through: 'cp' });
      if (!explore) { $('C-typed').value = ''; $('C-msg').textContent = ''; }
      render(); $('reset').focus();
    });
    buildAsks();
    render();
    return { stop: () => audio.stop() };
  }

  const act1 = mountLab(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const mount = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    mount.replaceChildren(host);
    mountLab(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
