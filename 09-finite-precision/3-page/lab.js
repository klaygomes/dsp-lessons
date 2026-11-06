(() => {
  const K = window.Kit, FS = 8000;
  const { fmt, hz, MINUS } = K;
  const TAU = 2 * Math.PI;
  const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
  const pct = v => (v > 0 && v < 0.0005 ? 'under 0.1%' : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);
  const pct1 = v => `${(v * 100).toFixed(1)}%`;
  const joinList = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const signed = v => (v < 0 ? `${MINUS}${Math.abs(v)}` : String(v));
  const hz1 = v => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const VOICE = K.wav(window.LESSON_CALL);
  const VOICE_PEAK = VOICE.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);

  const polymul = (a, b) => { const out = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; })); return out; };
  const evalAt = (c, w) => c.reduce(([re, im], v, n) => [re + v * Math.cos(w * n), im - v * Math.sin(w * n)], [0, 0]);
  const gainOf = (B, A, f) => {
    const w = TAU * f / FS, [br, bi] = evalAt(B, w), [ar, ai] = evalAt(A, w), den = Math.hypot(ar, ai);
    return den < 1e-12 ? null : Math.hypot(br, bi) / den;
  };
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  function roots(c) {
    const n = c.length - 1;
    if (n < 1) return [];
    let r = Array.from({ length: n }, (_, k) => { const a = 0.4 + 2.1 * k; return [0.9 * Math.cos(a), 0.9 * Math.sin(a)]; });
    const P = z => c.reduce((acc, v) => { const m = cmul(acc, z); return [m[0] + v, m[1]]; }, [0, 0]);
    for (let it = 0; it < 600; it++) {
      r = r.map((ri, i) => {
        let d = [1, 0];
        r.forEach((rj, j) => { if (j !== i) d = cmul(d, [ri[0] - rj[0], ri[1] - rj[1]]); });
        const q = cdiv(P(ri), d);
        return [ri[0] - q[0], ri[1] - q[1]];
      });
    }
    return r;
  }
  const quad = (a1, a2) => {
    const disc = a1 * a1 - 4 * a2;
    if (disc >= 0) { const s = Math.sqrt(disc); return [[(-a1 + s) / 2, 0], [(-a1 - s) / 2, 0]]; }
    const s = Math.sqrt(-disc); return [[-a1 / 2, s / 2], [-a1 / 2, -s / 2]];
  };
  const radius = z => Math.hypot(z[0], z[1]);
  const RIM = 1 - 1e-6, onRim = z => radius(z) >= RIM;
  const toneOf = z => Math.abs(Math.atan2(z[1], z[0])) * FS / TAU;
  function run(B, A, x, clip) {
    const y = new Float32Array(x.length);
    for (let n = 0; n < x.length; n++) {
      let v = 0;
      for (let i = 0; i < B.length; i++) if (n - i >= 0) v += B[i] * x[n - i];
      for (let i = 1; i < A.length; i++) if (n - i >= 0) v -= A[i] * y[n - i];
      y[n] = clip ? Math.max(-1, Math.min(1, v)) : v;
    }
    return y;
  }
  const rnd = (v, s) => { const w = Math.max(-128, Math.min(127, Math.round(v / s))); return { w, v: w * s }; };

  const STEPS = [128, 64, 32, 16, 8, 4, 2];
  const notch1 = den => { const b = rnd(0.905, 1 / den), a = rnd(0.81, 1 / den); return { b, a, B: [b.v, 0, b.v], A: [1, 0, a.v] }; };
  const LAPTOP1 = { B: [0.905, 0, 0.905], A: [1, 0, 0.81] };

  const callWith = whines => {
    const n = VOICE.length + FS / 2, x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const f = whines[Math.floor(i / (FS / 2)) % whines.length];
      ph += TAU * f / FS;
      x[i] = 0.45 * (VOICE[i] || 0) / VOICE_PEAK + 0.15 * Math.sin(ph);
    }
    return x;
  };
  const clicks = () => { const x = new Float32Array(FS); [0, 2000, 4000, 6000].forEach(i => { x[i] = 0.5; }); return x; };
  const fadeIn = (y, len) => { for (let i = 0; i < Math.min(len, y.length); i++) y[i] *= i / len; return y; };
  const fit = y => { const p = y.reduce((m, v) => Math.max(m, Math.abs(v)), 0); return p > 1 ? y.map(v => v / p) : y; };

  function notchCoefs(f, r) { const c = Math.cos(TAU * f / FS); return { b: [1, -2 * c, 1], a: [1, -2 * r * c, r * r] }; }
  function multiplied(whines, r) {
    let B = [1], A = [1];
    whines.forEach(f => { const { b, a } = notchCoefs(f, r), kk = (a[0] + a[1] + a[2]) / (b[0] + b[1] + b[2]); B = polymul(B, b.map(v => kk * v)); A = polymul(A, a); });
    return { B, A };
  }
  function chipMulti(whines) {
    const L = multiplied(whines, 0.98), all = [...L.B, ...L.A.slice(1)], m = Math.max(...all.map(Math.abs));
    let den = 128; while (127 / den < m) den /= 2;
    const B = L.B.map(v => rnd(v, 1 / den).v), A = [1, ...L.A.slice(1).map(v => rnd(v, 1 / den).v)];
    return { B, A, den, L };
  }
  function chipSection(f, r) {
    const { b, a } = notchCoefs(f, r);
    const wb = rnd(b[1], 1 / 64), wa1 = rnd(a[1], 1 / 64), wa2 = rnd(a[2], 1 / 64);
    return { b: [1, wb.v, 1], a: [1, wa1.v, wa2.v], whole: [64, wb.w, 64, wa1.w, wa2.w] };
  }
  function cascadeOf(secs) {
    const chips = secs.map(s => (s.f === null || s.bad ? null : chipSection(s.f, s.r)));
    let B = [1], A = [1];
    chips.forEach(c => { if (c) { B = polymul(B, c.b); A = polymul(A, c.a); } });
    const sumB = B.reduce((s, v) => s + v, 0), sumA = A.reduce((s, v) => s + v, 0);
    const k = rnd(sumA / sumB, 1 / 128);
    return { chips, k, B: B.map(v => v * k.v), A };
  }
  const runCascade = (cas, x, clip) => cas.chips.filter(Boolean).reduce((y, c) => run(c.b, c.a, y, clip), x.map(v => v * cas.k.v));

  const CASES = [
    { whines: [1729.7, 1830.1, 1930.6], text: 'The coast exchange runs its clock chip hot, so its whine hops between three pitches of its own. Find them on the chart of the call’s tones. Its team multiplied three notches with poles at 0.98 into one rule, just as yours did, and loaded it onto the 8-bit chip.' },
    { whines: [2039.5, 2139.8, 2239.9], text: 'The valley exchange: another clock chip, another three whine pitches to find on the chart. Same story: three notches multiplied into one rule, loaded onto the 8-bit chip.' },
    { whines: [2250.6, 2352.3, 2457.7], text: 'The harbour exchange whines higher. Find its three pitches on the chart; its multiplied-out rule hums too.' },
    { whines: [1667.7, 1770.3, 1870.2], text: 'The hill exchange whines low, close to the voice at 1,500 Hz. Find its three pitches on the chart. This one needs care.' },
  ];
  const ORDINAL = ['lowest', 'middle', 'highest'];

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const a = -TAU / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  const SPEC_N = 16384;
  const specCache = new Map();
  function spectrumOf(caseIx) {
    if (specCache.has(caseIx)) return specCache.get(caseIx);
    const x = callWith(CASES[caseIx].whines), win = Array.from({ length: SPEC_N }, (_, i) => 0.5 - 0.5 * Math.cos(TAU * i / (SPEC_N - 1)));
    const mag = new Float32Array(SPEC_N / 2);
    let segs = 0;
    for (let s = 0; s + SPEC_N <= x.length; s += SPEC_N / 4) {
      const re = new Float64Array(SPEC_N), im = new Float64Array(SPEC_N);
      for (let i = 0; i < SPEC_N; i++) re[i] = x[s + i] * win[i];
      fft(re, im);
      for (let k = 0; k < SPEC_N / 2; k++) mag[k] += Math.hypot(re[k], im[k]);
      segs++;
    }
    const lo = Math.floor(1000 * SPEC_N / FS), hi = Math.ceil(3000 * SPEC_N / FS);
    let peak = 1e-9;
    for (let k = lo; k <= hi; k++) peak = Math.max(peak, mag[k]);
    const out = { size: f => { const b = f * SPEC_N / FS, k = Math.floor(b), t = b - k; return ((1 - t) * mag[k] + t * mag[k + 1]) / peak; }, maxIn: (f0, f1) => { let m = 0; for (let k = Math.ceil(f0 * SPEC_N / FS); k <= Math.floor(f1 * SPEC_N / FS); k++) m = Math.max(m, mag[k]); return m / peak; } };
    specCache.set(caseIx, out);
    return out;
  }

  const SPANS = [2000, 400, 100];
  function specDraw(s, view) {
    const { pen, c, w, h } = s;
    const G = { x: 40, y: 14, w: w - 66, h: h - 52 };
    const { f0, f1, minor, major } = view;
    const X = f => G.x + (f - f0) / (f1 - f0) * G.w, Y = v => G.y + G.h - Math.min(v, 1.05) / 1.05 * G.h;
    pen.line([[G.x, G.y + G.h], [G.x + G.w, G.y + G.h]], c.soft, 1);
    pen.line([[G.x, G.y], [G.x, G.y + G.h]], c.soft, 1);
    pen.text('0', G.x - 6, G.y + G.h + 4, { align: 'right', color: c.soft, size: 10 });
    pen.text('size', G.x - 6, G.y + 8, { align: 'right', color: c.soft, size: 10 });
    for (let f = Math.ceil(f0 / minor) * minor; f <= f1 + 1e-9; f += minor) {
      const isMajor = Math.abs(f / major - Math.round(f / major)) < 1e-9, x = X(f);
      pen.line([[x, G.y + G.h], [x, G.y + G.h + (isMajor ? 6 : 3)]], c.soft, 1);
      if (isMajor) pen.text(hz(f), x, G.y + G.h + 18, { color: c.soft, size: 10 });
    }
    pen.text('tone (Hz)', G.x + G.w, G.y + G.h + 34, { align: 'right', color: c.soft, size: 10 });
    const pts = [], n = Math.max(2, Math.round(G.w)), sp = view.spec, df = (f1 - f0) / n;
    for (let i = 0; i <= n; i++) { const f = f0 + df * i; pts.push([X(f), Y(df > SPEC_N / FS ? sp.maxIn(f - df / 2, f + df / 2) : sp.size(f))]); }
    pen.line(pts, c.ink, 1.4);
  }

  function stageDraw(s, view) {
    const { pen, c, w, h, ctx } = s;
    const wide = w >= 560;
    const circH = wide ? 250 : (view.zoom ? Math.round(0.7 * (w - 40) + 50) : 230);
    const top = Boolean(view.zoom), panelW = wide ? 290 : w - 40;
    const R = top ? panelW : 96, cx = wide ? 145 : w / 2, cy = top ? 26 + 1.22 * R : 125;
    if (top) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - panelW / 2, 18, panelW, 0.7 * R); ctx.clip();
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
      pen.line([[cx, cy - R - 30], [cx, cy]], c.rule, 1);
      [1500, 2500].forEach(f => { const a = TAU * f / FS; pen.line([[cx, cy], [cx + 1.3 * R * Math.cos(a), cy - 1.3 * R * Math.sin(a)]], c.rule, 1); });
    } else {
      pen.line([[cx - R - 10, cy], [cx + R + 10, cy]], c.rule, 1);
      pen.line([[cx, cy - R - 14], [cx, cy + R + 14]], c.rule, 1);
      pen.ring(cx, cy, R, c.ink, 1.3);
      pen.text('0 Hz', cx + R + 5, cy + 15, { align: 'left', color: c.soft, size: 10 });
      pen.text('4,000', cx - R - 5, cy + 15, { align: 'right', color: c.soft, size: 10 });
    }
    pen.text('2,000 Hz', cx + 6, top ? 30 : cy - R - 16, { align: 'left', color: c.soft, size: 10 });
    const P = z => [cx + R * z[0], cy - R * z[1]];
    if (top) { [1500, 2500].forEach(f => { const a = TAU * f / FS; pen.text(hz(f), cx + 0.84 * R * Math.cos(a), cy - 0.84 * R * Math.sin(a) + 4, { color: c.soft, size: 10 }); }); }
    const xm = (x, y, sz, color, width) => { pen.line([[x - sz, y - sz], [x + sz, y + sz]], color, width); pen.line([[x + sz, y - sz], [x - sz, y + sz]], color, width); };
    const shown = z => !top || z[1] >= -1e-9;
    (view.zeros || []).filter(shown).forEach(z => { const [x, y] = P(z); ctx.fillStyle = c.paper; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill(); pen.ring(x, y, 4.5, c.ink, 1.5); });
    (view.lap || []).filter(shown).forEach(z => { const [x, y] = P(z); ctx.setLineDash([2, 2]); pen.ring(x, y, 7, c.soft, 1.2); ctx.setLineDash([]); xm(x, y, 3, c.soft, 1); });
    (view.pin || []).filter(shown).forEach(z => { const [x, y] = P(z); ctx.setLineDash([3, 3]); pen.ring(x, y, 9, c.input, 1.5); ctx.setLineDash([]); });
    (view.chip || []).filter(shown).forEach(z => {
      const [x, y] = P(z), out = onRim(z);
      if (out) { ctx.strokeStyle = c.accent; ctx.lineWidth = 1.6; ctx.strokeRect(x - 8, y - 8, 16, 16); }
      xm(x, y, 5, out ? c.accent : c.ink, 2.2);
    });
    if (top) { ctx.restore(); pen.text('the top of the unit circle, zoomed in', cx, 18 + 0.7 * R + 16, { color: c.soft, size: 10 }); }

    const G = wide ? { x: 330, y: 22, w: w - 350, h: circH - 70 } : { x: 44, y: circH + 30, w: w - 60, h: 130 };
    const [f0, f1] = view.band;
    const X = f => G.x + (f - f0) / (f1 - f0) * G.w, Y = v => G.y + G.h - Math.min(v, 1.25) / 1.25 * G.h;
    pen.line([[G.x, G.y + G.h], [G.x + G.w, G.y + G.h]], c.soft, 1);
    pen.line([[G.x, Y(1)], [G.x + G.w, Y(1)]], c.rule, 1);
    pen.text('100%', G.x - 6, Y(1) + 4, { align: 'right', color: c.soft, size: 10 });
    pen.text('0%', G.x - 6, Y(0) + 4, { align: 'right', color: c.soft, size: 10 });
    view.ticks.forEach(f => pen.text(hz(f), X(f), G.y + G.h + 15, { color: c.soft, size: 10 }));
    pen.text('tone (Hz)', G.x + G.w, G.y + G.h + 30, { align: 'right', color: c.soft, size: 10 });
    pen.text('how much passes', G.x, G.y - 8, { align: 'left', color: c.soft, size: 10 });
    const curve = (fn, color, width, dash) => {
      const pts = [];
      for (let i = 0; i <= 300; i++) { const f = f0 + (f1 - f0) * i / 300, v = fn(f); if (v !== null) pts.push([X(f), Y(v)]); }
      pen.line(pts, color, width, dash);
    };
    if (view.lapGain) curve(view.lapGain, c.soft, 1.5, [5, 4]);
    if (view.pinGain) curve(view.pinGain, c.input, 1.5, [3, 3]);
    if (view.chipGain === 'unstable') pen.text(wide || w >= 420 ? 'on the chip: unstable, no steady gain' : 'chip: unstable, no steady gain', G.x + 4, Y(1.13) + 4, { align: 'left', color: c.accentInk, size: 11, weight: 500 });
    else if (view.chipGain) curve(view.chipGain, c.ink, 2);
    if (view.voice) {
      pen.line([[X(1500), G.y + G.h], [X(1500), G.y + G.h - 6]], c.soft, 1.5);
      pen.text(wide ? 'voice 1,500' : 'voice', X(1500), G.y + G.h + 15, { color: c.soft, size: 10 });
    }
    if (view.strip) {
      const S = wide ? { x: 44, y: circH + 30, w: w - 64, h: 90 } : { x: 44, y: circH + 220, w: w - 60, h: 90 };
      const Ys = v => S.y + S.h / 2 - Math.max(-1.2, Math.min(1.2, v)) / 1.2 * S.h / 2;
      pen.rect(S.x, Ys(1), S.w, Ys(-1) - Ys(1), c.inputSoft, 0.6);
      pen.line([[S.x, Ys(0)], [S.x + S.w, Ys(0)]], c.soft, 1);
      pen.text('+1', S.x - 6, Ys(1) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.text(`${MINUS}1`, S.x - 6, Ys(-1) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.text(view.strip.title, S.x, S.y - 8, { align: 'left', color: c.ink, size: 11 });
      pen.text('400 samples, 50 ms', S.x + S.w, S.y + S.h + 14, { align: 'right', color: c.soft, size: 10 });
      const y = view.strip.y, pts = Array.from(y, (v, n) => [S.x + n / (y.length - 1) * S.w, Ys(v)]);
      pen.line(pts, view.strip.bad ? c.accent : c.ink, 1.1);
    }
  }
  const stageHeight = (act2, w) => (w >= 560 ? (act2 ? 400 : 260) : (act2 ? Math.round(0.7 * (w - 40) + 50) + 340 : 420));

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('chip-lab').content.cloneNode(true));
    const uid = `${host.id}-`, $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const act2 = mode === 'fix';
    const st = act2
      ? { caseIx: 0, form: 'multi', unlocked: false, secs: null, solved: false, filter: true, source: 'call', errors: {} }
      : { revealed: false, stepIx: 0, filter: true, source: 'call', pinned: null };
    const defaults = () => [0, 1, 2].map(() => ({ f: null, r: 0.85, text: '' }));
    if (act2) st.secs = defaults();

    const stage = K.stage($('stage'), s => stageDraw(s, view()), { height: w => stageHeight(act2, w) });
    const spec = { spanIx: 0, centre: 2000 };
    const specView = () => {
      const span = SPANS[spec.spanIx], c = Math.max(1000 + span / 2, Math.min(3000 - span / 2, spec.centre));
      const [minor, major] = span === 2000 ? [100, 500] : span === 400 ? [25, 100] : [5, 20];
      return { f0: c - span / 2, f1: c + span / 2, minor, major, spec: spectrumOf(st.caseIx) };
    };
    const specStage = act2 ? K.stage($('spec-stage'), s => specDraw(s, specView()), { height: w => (w < 560 ? 180 : 200) }) : null;
    function renderSpec() {
      const v = specView(), span = v.f1 - v.f0, grain = span / 20;
      host.querySelectorAll('[data-span]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === spec.spanIx)));
      $('centre-control').hidden = spec.spanIx === 0;
      $('centre').min = 1000 + span / 2; $('centre').max = 3000 - span / 2; $('centre').value = (v.f0 + v.f1) / 2;
      $('centre-out').textContent = hz((v.f0 + v.f1) / 2);
      $('centre').setAttribute('aria-valuetext', `${hz((v.f0 + v.f1) / 2)} Hz`);
      const peaks = [];
      for (let f = v.f0 + 1; f < v.f1 - 1; f += 0.25) { const y = v.spec.size(f); if (y > 0.3 && y >= v.spec.size(f - 0.25) && y > v.spec.size(f + 0.25)) peaks.push(Math.round(f / grain) * grain); }
      const named = [...new Set(peaks)].map(hz);
      $('spec-stage').setAttribute('aria-label', `How strong each tone is in the incoming call, from ${hz(v.f0)} to ${hz(v.f1)} Hz. ${named.length ? `Tall peaks near ${joinList(named)} Hz, read to the nearest ${hz(grain)} Hz.` : 'No tall peak in view.'}`);
      if (specStage) specStage.redraw();
    }

    function act1State() {
      const den = STEPS[st.stepIx], n = notch1(den);
      const chipPoles = quad(0, n.A[2]), lapPoles = quad(0, 0.81);
      const g = f => (near(n.A[2], 1) && near(f, 2000) ? n.b.v : gainOf(n.B, n.A, f));
      return { den, n, chipPoles, lapPoles, r: Math.sqrt(n.A[2]), g };
    }
    function act2Multi() {
      const cm = chipMulti(CASES[st.caseIx].whines), poles = roots(cm.A), lap = roots(cm.L.A);
      return { cm, poles, lap, rmax: Math.max(...poles.map(radius)) };
    }
    function act2Cascade() {
      const cas = cascadeOf(st.secs);
      const live = cas.chips.filter(Boolean), poles = live.flatMap(c => quad(c.a[1], c.a[2])), zeros = live.flatMap(c => quad(c.b[1], 1));
      const ringing = live.some(c => c.a[2] >= RIM && c.a[1] !== c.b[1]);
      return { cas, poles, zeros, rmax: Math.max(...poles.map(radius)), ringing };
    }
    function clickResponse(fn) { const x = new Float32Array(400); x[0] = 0.1; return fn(x); }

    function view() {
      if (!act2) {
        const a = act1State(), lapG = f => gainOf(LAPTOP1.B, LAPTOP1.A, f);
        if (!st.revealed) return { zeros: quad(0, 1), lap: a.lapPoles, band: [0, 4000], ticks: [0, 1000, 2000, 3000, 4000], lapGain: lapG };
        return { zeros: quad(0, 1), lap: a.lapPoles, chip: a.chipPoles, pin: st.pinned && st.pinned.poles, band: [0, 4000], ticks: [0, 1000, 2000, 3000, 4000], lapGain: lapG, chipGain: a.g, pinGain: st.pinned && st.pinned.g };
      }
      const band = [1000, 3000], ticks = [1000, 2000, 3000];
      if (st.form === 'multi') {
        const m = act2Multi();
        const y = clickResponse(x => run(m.cm.B, m.cm.A, x, true));
        return { zoom: true, voice: true, band, ticks, lap: m.lap, chip: m.poles, zeros: roots(m.cm.B.map(v => v / m.cm.B[0])), lapGain: f => gainOf(m.cm.L.B, m.cm.L.A, f), chipGain: m.rmax >= RIM ? 'unstable' : f => gainOf(m.cm.B, m.cm.A, f),
          strip: { y, bad: m.rmax >= RIM, title: 'on the chip, after one click' } };
      }
      const cz = act2Cascade(), y = clickResponse(x => runCascade(cz.cas, x, true));
      return { zoom: true, voice: true, band, ticks, chip: cz.poles, zeros: cz.zeros, lap: st.secs.filter(s => s.f !== null && !s.bad).map(s => [s.r * Math.cos(TAU * s.f / FS), s.r * Math.sin(TAU * s.f / FS)]).flatMap(z => [z, [z[0], -z[1]]]),
        chipGain: cz.ringing || cz.rmax > 1 + 1e-6 ? 'unstable' : f => gainOf(cz.cas.B, cz.cas.A, f), strip: { y, bad: cz.ringing || y.some(v => Math.abs(v) >= 1), title: 'on the chip, after one click' } };
    }

    function act1Why(a) {
      const d = a.den, n = a.n;
      const head = `0.905 × ${d} = ${fmt(0.905 * d, 2)}, stored as ${n.b.w} (${fmt(n.b.v, 4)}); 0.81 × ${d} = ${fmt(0.81 * d, 2)}, stored as ${n.a.w} (${fmt(n.a.v, 4)}).`;
      const g0 = a.g(0);
      if (d === 128) return `${head} Worked example 1: the poles move from 0.9 to ${fmt(a.r, 4)}, and 0 Hz stays at ${pct1(g0)}. Now make the step coarser.`;
      if (d >= 32) return `${head} The same stored 0.8125 as at 1/128: the poles sit at ${fmt(a.r, 4)}, out by 0.0014, and 0 Hz stays at ${pct1(g0)}. A lone pair barely notices.`;
      if (d === 16) return `${head} The 0.905 rounds down to 0.875, so 0 Hz drops to ${pct1(g0)}, but 0.81 still lands on 0.8125: the poles stay at ${fmt(a.r, 4)}.`;
      if (d === 8 || d === 4) return `${head} Now 0.81 rounds down to 0.75, so the poles move in, to ${fmt(a.r, 3)}. Inside means stable: the notch just gets wider, and 1,900 Hz drops to ${pct(a.g(1900))}. ${d === 4 ? `The 0.905 rounds up to 1, so 0 Hz is at ${pct1(g0)}.` : ''}`;
      return `${head} 0.81 rounds up to 1: the poles land exactly on the circle at 2,000 Hz, on top of the zeros. It never goes past the rim, but on the rim is no notch at all: zero and pole cancel, and the filter passes every tone at 100%, the whine included. One speck of rounding noise in the loop would ring there forever.`;
    }

    function act2Feedback(cz) {
      const whines = CASES[st.caseIx].whines;
      const bad = st.secs.map((s, i) => [s, i]).filter(([s]) => s.bad);
      if (bad.length) return { ok: false, msg: `Fix the tone in section ${bad[0][1] + 1} first: type a whole number of hertz from 100 to 3,900.` };
      const filled = st.secs.map((s, i) => i).filter(i => st.secs[i].f !== null);
      if (!filled.length) return { ok: false, msg: 'Give each section a tone: the whine pitches you read off the chart of the call’s tones. Zoom in until you can read each one to within a few hertz.' };
      const onCircle = filled.filter(i => cz.cas.chips[i].a[2] >= RIM);
      if (onCircle.length) {
        const i = onCircle[0], r = st.secs[i].r, ch = cz.cas.chips[i], head = `Section ${i + 1}: at radius ${fmt(r, 3)}, r² = ${fmt(r * r, 4)} rounds to 64/64 = 1 at step 1/64, so its poles sit exactly on the circle.`;
        if (ch.a[1] === ch.b[1]) return { ok: false, msg: `${head} The chip rounds its zeros to the very same spot, so pole and zero cancel: the strip stays flat, but this notch is gone and its whine passes. On a real chip, one speck of rounding noise in the loop would ring there forever. Bring that radius in.` };
        return { ok: false, msg: `${head} Its zeros land just beside them, so nothing cancels: the output strip shows the ring that never dies. Bring that radius in.` };
      }
      const gW = whines.map(f => gainOf(cz.cas.B, cz.cas.A, f));
      const zeroTone = i => toneOf(quad(cz.cas.chips[i].b[1], 1)[0]);
      const onWhine = i => whines.findIndex(f => Math.abs(zeroTone(i) - f) < 2);
      const missed = whines.map((f, w) => w).filter(w => gW[w] >= 0.02);
      if (missed.length) {
        const w = missed[0], f = whines[w], name = ORDINAL[w];
        const tight = filled.find(i => onWhine(i) === w);
        if (tight !== undefined) {
          const s = st.secs[tight], rc = Math.sqrt(cz.cas.chips[tight].a[2]), off = Math.abs(zeroTone(tight) - f);
          return { ok: false, msg: `Section ${tight + 1} sits on the ${name} whine: the chip puts its zeros ${off.toFixed(1)} Hz from it. But at radius ${fmt(s.r, 3)} the chip stores the poles at ${fmt(rc, 4)}, so close to the circle that the notch is narrower than that tiny miss: the whine gets through at ${pct(gW[w])}. Bring the radius in a little.` };
        }
        const owners = whines.map((_, v) => filled.filter(i => onWhine(i) === v));
        const shared = owners.findIndex(o => o.length > 1);
        if (shared >= 0) return { ok: false, msg: `Sections ${joinList(owners[shared].map(i => i + 1))} ${owners[shared].length === 2 ? 'both' : 'all'} sit on the ${ORDINAL[shared]} whine, so the ${name} whine gets through at ${pct(gW[w])} with no section of its own. Give each section a different whine.` };
        const free = filled.filter(i => onWhine(i) < 0);
        const tones = free.map(i => Math.round(zeroTone(i)));
        if (free.length > 1 && tones.every(t => t === tones[0])) return { ok: false, msg: `Sections ${joinList(free.map(i => i + 1))} all put their zeros at ${hz(tones[0])} Hz, and no whine is there. Read the three pitches off the chart of the call’s tones and give each section one of them.` };
        if (!free.length) {
          const empty = st.secs.map((s, i) => i).filter(i => st.secs[i].f === null);
          return { ok: false, msg: `The ${name} whine gets through at ${pct(gW[w])}: no section sits on it yet. Section ${empty[0] + 1} has no tone; find the ${name} pitch on the chart and give it to that section.` };
        }
        const j = free.reduce((b, i) => (Math.abs(zeroTone(i) - f) < Math.abs(zeroTone(b) - f) ? i : b), free[0]), off = zeroTone(j) - f, dir = off < 0 ? 'low' : 'high';
        const by = Math.abs(off) < 15 ? `a few hertz too ${dir}` : Math.abs(off) < 60 ? `tens of hertz too ${dir}` : `far too ${dir}`;
        const typed = st.secs[j].f, landed = Math.round(zeroTone(j));
        const where = typed === landed ? `you typed ${hz(typed)} Hz, and the chip puts its zeros there` : `you typed ${hz(typed)} Hz, and the chip rounds that to ${hz(landed)} Hz`;
        return { ok: false, msg: `The ${name} whine gets through at ${pct(gW[w])}: no section sits on it. The nearest free one is section ${j + 1}: ${where}, ${by}. Zoom in on that peak of the chart and read it again.` };
      }
      const v = gainOf(cz.cas.B, cz.cas.A, 1500);
      if (v < 0.95) {
        const lo = filled.reduce((b, i) => (st.secs[i].r < st.secs[b].r ? i : b), filled[0]);
        return { ok: false, msg: `Every whine is under 2%, but the voice at 1,500 Hz keeps only ${(Math.floor(v * 1000) / 10).toFixed(1)}%, and it needs more than 95%. Poles far inside the circle make wide notches that bite into the voice; section ${lo + 1} is at ${fmt(st.secs[lo].r, 3)}. Move the poles closer to the circle.` };
      }
      const rs = filled.map(i => fmt(Math.sqrt(cz.cas.chips[i].a[2]), 4));
      const over = v > 1.005 ? ', a little over 100%: the volume factor sets 0 Hz to 100%, and poles this close to the circle lift the tones beside their notches a few percent' : '';
      return { ok: true, msg: `Fixed. Every chip pole is inside the circle (radii ${joinList([...new Set(rs)])}), the whine is at ${joinList(gW.map(pct))} at ${joinList(whines.map(hz))} Hz, and the voice at 1,500 Hz keeps ${pct(v)}${over}. Play it: the hum is gone, and so is the whine.` };
    }

    function nowText() {
      if (!audio.playing) return 'Not playing.';
      const what = st.source === 'clicks' ? 'a click every quarter second' : 'a call with the whine';
      if (!st.filter) return `Playing ${what} with the filter off.`;
      if (!act2) return `Playing ${what} through the notch on the chip at step 1/${STEPS[st.stepIx]}.`;
      return `Playing ${what} through the ${st.form === 'multi' ? 'multiplied-out rule' : 'cascade'} on the chip${st.form === 'multi' ? ', fading in from quiet' : ''}.`;
    }

    function render8k() {
      const x = st.source === 'clicks' ? clicks() : callWith(act2 ? CASES[st.caseIx].whines : [2000]);
      if (!st.filter) return fit(x);
      if (!act2) { const n = act1State().n; return fit(run(n.B, n.A, x, true)); }
      if (st.form === 'multi') { const m = chipMulti(CASES[st.caseIx].whines); return fadeIn(fit(run(m.B, m.A, x, true)), FS * 1.5); }
      return fadeIn(fit(runCascade(cascadeOf(st.secs), x, true)), FS * 0.1);
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play'; $('now').textContent = nowText(); } });

    function pinnedShare() {
      const x = callWith(CASES[st.caseIx].whines);
      const y = st.form === 'multi' ? (() => { const m = chipMulti(CASES[st.caseIx].whines); return run(m.B, m.A, x, true); })() : runCascade(cascadeOf(st.secs), x, true);
      let n = 0; y.forEach(v => { if (Math.abs(v) >= 1) n++; });
      return n / y.length;
    }

    function render() {
      $('filter').setAttribute('aria-pressed', String(st.filter));
      $('filter').textContent = st.filter ? 'Filter on' : 'Filter off';
      $('source').textContent = st.source === 'call' ? 'Sound: a call with the whine' : 'Sound: clicks';
      if (!act2) {
        const a = act1State();
        $('step').disabled = !st.revealed; $('pin').disabled = !st.revealed;
        $('step').value = st.stepIx; $('step-out').textContent = `1/${STEPS[st.stepIx]}`; $('step').setAttribute('aria-valuetext', `1/${STEPS[st.stepIx]}`);
        if (st.revealed) {
          $('result').textContent = `step 1/${a.den} · stored ${a.n.b.w} and ${a.n.a.w} · poles at ${fmt(a.r, 4)} · 0 Hz ${pct1(a.g(0))} · 1,500 Hz ${pct1(a.g(1500))} · 1,900 Hz ${pct1(a.g(1900))} · 2,000 Hz ${pct1(a.g(2000))}`;
          $('why').textContent = act1Why(a);
        } else {
          $('result').textContent = 'Lesson 6’s notch on the laptop: poles at 0.9, zeros on the circle at 2,000 Hz.';
          $('why').textContent = 'Answer the question above, then the step is yours.';
        }
        $('compare').hidden = !st.pinned; $('key-pin').hidden = !st.pinned;
        if (st.pinned) {
          const p = st.pinned, rim = r => r >= 1 - 1e-9;
          const change = rim(a.r) && !rim(p.r) ? 'The poles moved out onto the circle, on top of the zeros: the notch is gone, and every tone passes at 100%, the whine at 2,000 Hz included.'
            : rim(p.r) && !rim(a.r) ? 'The poles moved back inside the circle, off the zeros: the notch is back, and the whine at 2,000 Hz is removed again.'
            : a.r > p.r + 1e-9 ? 'The poles moved out: a narrower notch.' : a.r < p.r - 1e-9 ? 'The poles moved in: a wider notch, so the voice beside it loses more.' : 'Same pole radius: only the volume changed.';
          $('compare').textContent = p.den === a.den ? `Pinned step 1/${p.den}. Move the step to compare.` : `Pinned step 1/${p.den}: poles ${fmt(p.r, 4)}, 1,900 Hz ${pct1(p.g(1900))}. Now step 1/${a.den}: poles ${fmt(a.r, 4)}, 1,900 Hz ${pct1(a.g(1900))}. ${change}`;
        }
        $('stage').setAttribute('aria-label', st.revealed ? `Unit circle and gain. On the chip at step 1/${a.den} the poles sit at radius ${fmt(a.r, 4)}, laptop 0.9.` : 'Unit circle with lesson 6’s notch on the laptop, and its gain from 0 to 4,000 Hz.');
      } else {
        const c = CASES[st.caseIx];
        $('task-text').textContent = c.text;
        host.querySelectorAll('[data-form]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.form === st.form)); b.disabled = b.dataset.form === 'cascade' && !st.unlocked; });
        $('sections').hidden = st.form !== 'cascade' || !st.unlocked;
        if (st.form === 'multi') {
          const m = act2Multi(), outs = m.poles.filter(z => onRim(z) && z[1] >= 0), radii = [...new Set(outs.map(z => fmt(radius(z), 4)))];
          const pairs = outs.length === 1 ? 'one pole pair lands' : `${outs.length === 2 ? 'two' : outs.length === 3 ? 'three' : outs.length} pole pairs land`;
          $('result').textContent = `multiplied-out rule · biggest coefficient ${fmt(Math.max(...m.cm.L.A.map(Math.abs)), 4)} forces step 1/${m.cm.den} · largest chip pole ${fmt(m.rmax, 4)}`;
          $('why').textContent = outs.length ? `On the chip, ${pairs} on or outside the circle, at radius ${joinList(radii)}: one click grows until it pins at the limits, as the output strip shows. Play the call to hear the hum build. Then rebuild it as a cascade.` : 'All the chip poles are inside the circle.';
          K.meter($('meter'), pinnedShare(), { max: 1 });
        } else {
          const cz = act2Cascade(), fb = act2Feedback(cz);
          const wasSolved = st.solved;
          st.solved = fb.ok;
          $('result').textContent = `cascade · step 1/64 per section · volume factor ${cz.cas.k.w}/128 = ${fmt(cz.cas.k.v, 4)} · ${cz.poles.length ? `largest chip pole ${fmt(cz.rmax, 4)}` : 'no section has a tone yet'}`;
          $('why').textContent = fb.msg;
          K.meter($('meter'), pinnedShare(), { max: 1 });
          host.querySelectorAll('.sec').forEach((el, i) => {
            const ch = cz.cas.chips[i];
            if (!ch) el.querySelector('.chipnote').textContent = st.secs[i].bad ? '' : 'No tone yet: this section passes the call through untouched.';
            else {
              const z = toneOf(quad(ch.b[1], 1)[0]), p = quad(ch.a[1], ch.a[2])[0];
              el.querySelector('.chipnote').textContent = `on the chip: whole numbers 64, ${signed(ch.whole[1])}, 64 | ${signed(ch.whole[3])}, ${ch.whole[4]} · zeros ${hz1(z)} Hz · poles ${fmt(radius(p), 4)} at ${hz1(toneOf(p))} Hz`;
            }
            el.querySelector('output').textContent = fmt(st.secs[i].r, 3);
            el.querySelector('input[type="range"]').setAttribute('aria-valuetext', fmt(st.secs[i].r, 3));
          });
          if (st.solved && !wasSolved) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        }
        $('another').hidden = !st.solved;
        $('stage').setAttribute('aria-label', `Top of the unit circle, gain from 1,000 to 3,000 Hz, and the chip's output after one click, for the ${st.form === 'multi' ? 'multiplied-out rule' : 'cascade'}.`);
        renderSpec();
      }
      stage.redraw();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    function buildSections() {
      const box = $('sections');
      box.replaceChildren();
      st.secs.forEach((s, i) => {
        const el = document.createElement('div'); el.className = 'sec';
        const tid = `${uid}tone-${i}`, rid = `${uid}r-${i}`, eid = `${uid}err-${i}`;
        el.innerHTML = `<h4>Section ${i + 1}</h4>
          <label for="${tid}">Tone of its zeros and poles</label>
          <div class="field"><input type="text" inputmode="numeric" id="${tid}" aria-describedby="${eid}" autocomplete="off"><span>Hz</span><span class="err" id="${eid}" aria-live="polite"></span></div>
          <label for="${rid}">Pole radius: <output></output></label>
          <input type="range" id="${rid}" min="0.8" max="1" step="0.005">
          <p class="chipnote"></p>`;
        const t = el.querySelector('input[type="text"]'), r = el.querySelector('input[type="range"]'), err = el.querySelector('.err');
        t.value = s.text; r.value = s.r;
        const apply = () => {
          const raw = t.value.replace(/[,\s]/g, '');
          if (!raw) { s.bad = false; s.f = null; s.text = ''; err.textContent = ''; render(); return; }
          if (!/^\d+$/.test(raw)) { s.bad = true; err.textContent = 'Type a whole number of hertz, like 2,150.'; render(); return; }
          const v = Number(raw);
          if (v < 100 || v > 3900) { s.bad = true; err.textContent = `${hz(v)} Hz is outside 100 to 3,900 Hz.`; render(); return; }
          s.bad = false; err.textContent = ''; s.f = v; s.text = hz(v); render();
        };
        t.addEventListener('change', () => { apply(); if (!s.bad) t.value = s.text; });
        t.addEventListener('input', () => { const raw = t.value.replace(/[,\s]/g, ''); if (!raw || (/^\d+$/.test(raw) && Number(raw) >= 100 && Number(raw) <= 3900)) apply(); });
        t.addEventListener('keydown', e => {
          if (e.key === 'Enter') { apply(); if (!s.bad) t.value = s.text; }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
            s.f = Math.max(100, Math.min(3900, (s.bad || s.f === null ? 2000 : s.f) + step)); s.bad = false; s.text = hz(s.f); t.value = s.text; err.textContent = ''; render();
          }
        });
        r.addEventListener('input', () => { s.r = Math.round(Number(r.value) * 1000) / 1000; render(); });
        box.append(el);
      });
    }

    function buildAsks() {
      if (!act2) {
        K.ask($('ask'), {
          question: 'Lesson 6’s notch has its poles at 0.9. Make the chip’s step coarser and coarser. At which step do the poles first reach the rim, on it or past it?',
          options: [['64', 'At 1/64'], ['16', 'At 1/16'], ['4', 'At 1/4'], ['2', 'At 1/2'], ['never', 'At no step']], right: '2',
          hints: { 64: 'At 1/64, 0.81 × 64 = 51.84, stored as 52. What is 52/64, and its square root?', 16: 'At 1/16, 0.81 × 16 = 12.96, stored as 13. What is 13/16, and its square root?', 4: 'At 1/4, 0.81 × 4 = 3.24 rounds down to 3. Does a smaller number move the poles in or out?', never: 'Rounding can go up as well as down. For each step, which whole number of steps is nearest to 0.81, and where does that put the poles?' },
          explain: 'Rounding 0.81 to a coarser step mostly lands it on 0.8125 or 0.75, both inside. Only at 1/2 does it round up to 1, and that puts the poles exactly on the rim, on top of the zeros. They never go past it. The step is yours: try every one.',
          reveal: 'Skip: show me', solved: st.revealed ? 'right' : null,
          onSolved: () => { st.revealed = true; host.querySelectorAll('[data-k="ask"] button.quiet').forEach(b => { b.disabled = true; }); document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' })); render(); }, focusAfter: () => $('step'),
        });
        return;
      }
      $('ask2').replaceChildren();
      if (st.unlocked) return;
      const q = document.createElement('div');
      $('ask2').append(q);
      K.ask(q, {
        question: 'Before you build: each section’s pole radius starts at 0.85, and you will slide it anywhere from 0.80 up to 1. What will its pole on the chip do?',
        options: [['smooth', 'Follow the slider smoothly'], ['jumps', 'Hop between a few fixed radii'], ['drag', 'Pull the other poles along with it']], right: 'jumps',
        hints: { smooth: 'The chip stores the section’s r² as a whole number of 64ths. What happens to that stored number when the slider moves only a little?', drag: 'Which numbers does one section’s radius change? Does any other section store them?' },
        explain: 'The chip stores r² as a whole number of 64ths, so while the slider moves the chip pole stays put, then hops to the next radius the chip can store. When you build the cascade, watch the circle and the chip line under each section while you slide.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => host.querySelector('[data-form="cascade"]'),
      });
    }

    if (act2) {
      ['step-control', 'jump', 'pin'].forEach(k => { $(k).remove(); });
      ['task', 'form', 'meter', 'spec'].forEach(k => { $(k).hidden = false; });
    } else {
      ['task', 'spec', 'meter', 'form', 'ask2', 'sections', 'another'].forEach(k => { $(k).remove(); });
    }
    buildAsks();

    if (!act2) {
      $('step').addEventListener('input', () => { st.stepIx = Number($('step').value); render(); });
      $('pin').addEventListener('click', () => { const a = act1State(); st.pinned = { den: a.den, r: a.r, g: a.g, poles: a.chipPoles }; render(); });
    } else {
      host.querySelectorAll('[data-span]').forEach((btn, i) => btn.addEventListener('click', () => { spec.spanIx = i; renderSpec(); }));
      $('centre').addEventListener('input', () => { spec.centre = Number($('centre').value); renderSpec(); });
      $('spec-stage').addEventListener('click', e => {
        const v = specView(), r = $('spec-stage').getBoundingClientRect(), gx = 40, gw = r.width - 66;
        const f = v.f0 + (e.clientX - r.left - gx) / gw * (v.f1 - v.f0);
        if (f < v.f0 || f > v.f1) return;
        spec.centre = Math.round(f / 5) * 5;
        if (spec.spanIx < SPANS.length - 1) spec.spanIx++;
        renderSpec();
      });
    }
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('filter').addEventListener('click', () => { st.filter = !st.filter; render(); });
    $('source').addEventListener('click', () => { st.source = st.source === 'call' ? 'clicks' : 'call'; render(); });
    if (act2) {
      host.querySelectorAll('[data-form]').forEach(b => b.addEventListener('click', () => {
        st.form = b.dataset.form;
        if (st.form === 'cascade' && !host.querySelector('.sec')) buildSections();
        render();
      }));
      $('another').addEventListener('click', () => {
        audio.stop();
        st.caseIx = (st.caseIx + 1) % CASES.length;
        Object.assign(st, { form: 'multi', solved: false, secs: defaults() });
        Object.assign(spec, { spanIx: 0, centre: 2000 });
        buildSections(); render(); host.querySelector('[data-form="multi"]').focus();
      });
    }
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (!act2) Object.assign(st, { stepIx: 0, pinned: null, filter: true, source: 'call' });
      else { Object.assign(st, { form: st.unlocked ? 'cascade' : 'multi', solved: false, secs: defaults(), filter: true, source: 'call' }); if (st.unlocked) buildSections(); }
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  K.ask(document.getElementById('predict-drift'), {
    question: 'The chip’s errors are about a hundredth each. The poles sit at 0.98, so a move of 0.02 outward is enough to cross the rim. How far will the errors move the poles?',
    options: [['003', 'About 0.03'], ['01', 'About 0.1'], ['03', 'About 0.3'], ['1', 'About 1']],
    right: '01',
    hints: { '003': 'That is just enough to cross, three times the errors. But on each half of the circle the three poles sit only 4.5° from their neighbors, and errors in a crowded rule are amplified far more than that. The real move is bigger.', '03': 'That would throw a pole from 0.98 out to 1.28 or in to 0.68. A straight-line estimate, coming up below, does say about 0.3, but the real move is smaller.', '1': 'A move of 1 would carry a pole from the rim to the middle of the circle. The real move is much smaller.' },
    explain: 'About ten times the errors: the poles move 0.10 to 0.14, and two pairs land at 1.0567, outside the circle. Here is the computer’s answer.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-drift' })),
  });

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const m = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    m.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('[data-k="task-text"]').focus();
  });
})();
