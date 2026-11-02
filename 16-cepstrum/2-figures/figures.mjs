export default k => {
  const { g, line, path, rect, circle, text, plot, axes, curve, stems, step, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const FS = 8000;
  const gainAt = (f, D, a = 0.5) => { const w = 2 * Math.PI * f / FS; return Math.hypot(1 + a * Math.cos(w * D), a * Math.sin(w * D)); };
  const logGain = (f, D, a = 0.5) => Math.log(gainAt(f, D, a));

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let j = 0; j < len / 2; j++) {
          const p = i + j, q = p + len / 2, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
          re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  const cepstrumOfLog = logs => { const re = Float64Array.from(logs), im = new Float64Array(logs.length); fft(re, im); return re.map(v => v / logs.length); };
  const pureEchoCepstrum = (N, D, a = 0.5) => cepstrumOfLog(Array.from({ length: N }, (_, kk) => logGain(kk * FS / N, D, a)));
  const argmaxFrom = (c, lo, hi) => { let b = lo; for (let q = lo; q < hi; q++) if (c[q] > c[b]) b = q; return b; };

  const SIM = (() => {
    let seed = 1;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
    const N = 8192, D = 1200, L = N + 4000, r = 0.95;
    const src = Float64Array.from({ length: L }, (_, n) => (n % 64 === 0 ? 1 : 0) + 0.15 * rnd());
    const reson = (x, f) => { const th = 2 * Math.PI * f / FS, y = new Float64Array(x.length); for (let n = 0; n < x.length; n++) y[n] = x[n] + 2 * r * Math.cos(th) * (n > 0 ? y[n - 1] : 0) - r * r * (n > 1 ? y[n - 2] : 0); return y; };
    const voice = reson(reson(src, 700), 1200);
    const heard = voice.map((s, n) => s + (n >= D ? 0.5 * voice[n - D] : 0));
    const re = new Float64Array(N), im = new Float64Array(N), st = L - N;
    for (let n = 0; n < N; n++) re[n] = heard[st + n] * (0.5 - 0.5 * Math.cos(2 * Math.PI * n / N));
    fft(re, im);
    const size = re.map((_, kk) => Math.hypot(re[kk], im[kk]));
    const top = size.reduce((m, v) => Math.max(m, v), 0);
    const logs = size.map(v => Math.log(Math.max(v, top * 1e-6)));
    const c = cepstrumOfLog(logs);
    const peak = argmaxFrom(c, 101, N / 2);
    let next = 0;
    for (let q = 101; q < N / 2; q++) if (Math.abs(q - peak) > 3 && c[q] > c[q - 1] && c[q] >= c[q + 1]) next = Math.max(next, c[q]);
    return { voice, heard, logs, c, peak, next, N };
  })();

  const pure = { 1024: argmaxFrom(pureEchoCepstrum(1024, 1200), 1, 512), 2048: argmaxFrom(pureEchoCepstrum(2048, 1200), 1, 1024), 8192: argmaxFrom(pureEchoCepstrum(8192, 1200), 1, 4096) };
  const LIST = range(0, 15).map(kk => logGain(kk * 500, 4));
  const LIST_C = cepstrumOfLog(LIST);
  const checks = [
    [fmt(gainAt(500, 4)), '1.12'], [fmt(gainAt(1000, 4)), '0.50'], [fmt(gainAt(2000, 4)), '1.50'],
    [fmt(LIST[0]), '0.41'], [fmt(LIST[1]), '0.11'], [fmt(LIST[2]), '−0.69'],
    [fmt(LIST_C[4]), '0.27'], [fmt(LIST_C[8]), '−0.13'], [fmt(LIST_C[12]), '0.27'], [fmt(LIST_C[4] * 16), '4.39'],
    [String(pure[1024]), '176'], [String(pure[2048]), '848'], [String(pure[8192]), '1200'],
    [String(SIM.peak), '1200'], [fmt(SIM.c[1200]), '0.20'], [fmt(SIM.c[2400]), '−0.04'],
    [fmt(Math.log(150) - Math.log(50)), '1.10'],
  ];
  checks.forEach(([got, want]) => { if (got !== want) throw new Error(`figure number ${got}, sheet says ${want}`); });
  if (SIM.next > 0.095) throw new Error(`voice bump ${SIM.next} too tall`);

  const CSS = `
.k-fig .c-copy { stroke: var(--ink); stroke-width: 1.8; stroke-dasharray: 4 3; fill: none; }
.k-fig .c-copy-dot { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .c-dash { stroke: var(--ink); stroke-width: 1.6; stroke-dasharray: 6 4; fill: none; }
.k-fig .c-dot-line { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 0.5 4; stroke-linecap: round; fill: none; }
.k-fig .c-dashdot { stroke: var(--ink); stroke-width: 1.4; stroke-dasharray: 8 3 1.5 3; fill: none; }
.k-fig .c-ref { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 4; fill: none; }
.k-fig .c-orig { stroke: var(--ink); stroke-width: 2.4; stroke-linecap: round; }
.k-fig .c-echo { stroke: var(--ink); stroke-width: 2.2; stroke-dasharray: 5 3; }
.k-fig .c-sum { stroke: var(--accent); stroke-width: 2.8; stroke-linecap: round; }
.k-fig .c-head { fill: var(--ink); }
.k-fig .c-head-open { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; stroke-linejoin: round; }
.k-fig .c-head-accent { fill: var(--accent); }
.k-fig .c-shade { fill: var(--paper-2); }
.k-fig .c-ring { fill: none; stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .c-tone-dot { fill: var(--ink); }
.k-fig .c-echo-dot { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .c-block { fill: none; stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 5 3; }
.k-fig .c-bar-ref { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 4 2; }
.k-fig .c-env { fill: var(--ink); stroke: var(--ink); stroke-width: 0.6; }
.k-fig .c-env-line { stroke: var(--ink); stroke-width: 1; fill: none; }
.k-fig .c-bracket { stroke: var(--ink-soft); stroke-width: 1.3; fill: none; }
.k-fig .c-bracket-accent { stroke: var(--accent); stroke-width: 1.8; fill: none; }
.k-fig .c-tick { stroke: var(--ink); stroke-width: 1.3; }
.k-fig .c-arc { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .c-small { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
`;

  const head = (x1, y1, x2, y2, len, half) => {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const bx = x2 - ux * len, by = y2 - uy * len;
    return { bx, by, pts: `${r2(x2)},${r2(y2)} ${r2(bx - uy * half)},${r2(by + ux * half)} ${r2(bx + uy * half)},${r2(by - ux * half)}` };
  };
  const LINE = { orig: 'c-orig', echo: 'c-echo', sum: 'c-sum' };
  const HEAD = { orig: 'c-head', echo: 'c-head-open', sum: 'c-head-accent' };
  const vec = (x1, y1, x2, y2, kind = 'orig', o = {}) => {
    const h = head(x1, y1, x2, y2, 11, 5.5);
    return g(o, line(x1, y1, h.bx, h.by, { cls: LINE[kind] }), `<polygon class="${HEAD[kind]}" points="${h.pts}"/>`);
  };
  const keyLine = (x, y, kind, label, o = {}) => {
    const w = o.w ?? 26;
    const mark = kind === 'stem' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'k-stem' }), circle(x + 9, y - 11, 3.5, { cls: 'k-stem-dot' }))
      : kind === 'stem-copy' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'c-copy' }), circle(x + 9, y - 11, 3.5, { cls: 'c-copy-dot' }))
      : kind === 'stem-soft' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'k-stem-soft' }), circle(x + 9, y - 11, 3.5, { cls: 'k-stem-soft-dot' }))
      : kind === 'stem-accent' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'k-stem-accent' }), circle(x + 9, y - 11, 3.5, { cls: 'k-stem-accent-dot' }))
      : kind === 'bar' ? rect(x, y - 10, 18, 13, { cls: 'k-bar' })
      : kind === 'bar-accent' ? rect(x, y - 10, 18, 13, { cls: 'k-bar-accent' })
      : kind === 'bar-ref' ? rect(x, y - 10, 18, 13, { cls: 'c-bar-ref' })
      : kind === 'block' ? rect(x, y - 10, 18, 13, { cls: 'c-block' })
      : kind === 'tone-dot' ? circle(x + 9, y - 4, 5, { cls: 'c-tone-dot' })
      : kind === 'echo-dot' ? circle(x + 9, y - 4, 5, { cls: 'c-echo-dot' })
      : ['orig', 'echo', 'sum'].includes(kind) ? vec(x, y - 4, x + w, y - 4, kind)
      : line(x, y - 4, x + w, y - 4, { cls: kind });
    const dx = ['stem', 'stem-copy', 'stem-soft', 'stem-accent', 'bar', 'bar-accent', 'bar-ref', 'block', 'tone-dot', 'echo-dot'].includes(kind) ? 26 : w + 8;
    return g({}, mark, text(x + dx, y, label, { anchor: 'start', cls: 'k-label' }));
  };
  const hzTicks = list => list.map(f => [f, hz(f)]);
  const pathOf = (P, pts) => pts.map(([x, v], i) => `${i ? 'L' : 'M'}${r2(P.X(x))} ${r2(P.Y(v))}`).join('');
  const envelope = (P, xs, ys, { clip = [-Infinity, Infinity], px = 1 } = {}) => {
    const cols = new Map();
    xs.forEach((x, i) => {
      if (x < P.xs[0] || x > P.xs[1]) return;
      const c = Math.round((P.X(x) - P.x0) / px), v = Math.min(clip[1], Math.max(clip[0], ys[i])), e = cols.get(c);
      cols.set(c, e ? [Math.min(e[0], v), Math.max(e[1], v)] : [v, v]);
    });
    const keys = [...cols.keys()].sort((a, b) => a - b);
    const lo = keys.map(c => [P.x0 + c * px, P.Y(cols.get(c)[0])]), hi = keys.map(c => [P.x0 + c * px, P.Y(cols.get(c)[1])]);
    const d = hi.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join('') + lo.reverse().map(([x, y]) => `L${r2(x)} ${r2(y + 0.6)}`).join('') + 'Z';
    return path(d, { cls: 'c-env' });
  };
  const bracket = (x, y1, y2, cls = 'c-bracket', w = 5) => path(`M${r2(x - w)} ${r2(y1)}L${r2(x)} ${r2(y1)}L${r2(x)} ${r2(y2)}L${r2(x - w)} ${r2(y2)}`, { cls });
  const turnAt = (cx, cy, r0, o = {}) => ({ anim: { k: 'turn', r0: `${r0}deg`, steps: 24, ...o }, style: `transform-origin:${r2(cx)}px ${r2(cy)}px` });

  const echoSamples = L => {
    const ph = L.phone;
    const ns = range(0, 11);
    const cols = [
      { f: 2000, title: '2,000 Hz', out: 'from sample 4 on: 1.5 tall' },
      { f: 1000, title: '1,000 Hz', out: 'from sample 4 on: 0.5 tall' },
    ];
    const rowLabels = ph ? ['the tone', '0.5 × the sample 4 back', 'heard: the sum'] : ['the tone', '0.5 × the sample 4 back', 'heard: the sum'];
    const column = (c, i) => {
      const x0 = ph ? 40 : (i ? 420 : 60), w = ph ? 300 : 270, top = ph ? 36 + i * 330 : 36;
      const gap = ph ? 86 : 92, h = ph ? 52 : 58;
      const rows = [0, 1, 2].map(r => plot({ x: x0, y: top + 22 + r * gap, w, h, xs: [-0.6, 11.6], ys: [-1.7, 1.7] }));
      const tone = n => r2(cosd(360 * c.f / FS * n));
      const copy = ns.filter(n => n >= 4).map(n => [n, 0.5 * tone(n - 4)]);
      const sum = ns.map(n => [n, tone(n) + (n >= 4 ? 0.5 * tone(n - 4) : 0)]);
      const last = rows[2];
      return g({},
        rect(rows[0].X(3.5), rows[0].y0 - 8, rows[0].X(11.6) - rows[0].X(3.5), last.y1 - rows[0].y0 + 16, { cls: 'c-shade' }),
        text(x0, top, c.title, { anchor: 'start', cls: 'k-name' }),
        text(rows[0].X(3.5) + 4, top, 'sample 4 on', { anchor: 'start', cls: 'k-tick' }),
        rows.map((P, r) => g({}, line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }), text(x0 - (ph ? 30 : 46), P.y0 - 4, rowLabels[r], { anchor: 'start', cls: 'k-tick' }))),
        stems(rows[0], ns.map(n => [n, tone(n)]), { dot: 3.5 }),
        stems(rows[1], copy, { cls: 'c-copy', dot: 3.5, hollow: true }),
        stems(last, sum, { dot: 3.5 }),
        ns.filter(n => n % 4 === 0).map(n => text(last.X(n), last.y1 + 16, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
        text(last.X(4) + 8, last.Y(sum[4][1]) + (sum[4][1] > 0 ? 4 : 12), fmt(sum[4][1], 1), { anchor: 'start', cls: 'k-num-accent' }),
        text(x0, last.y1 + 40, c.out, { anchor: 'start', cls: 'k-num-accent' }));
    };
    return [column(cols[0], 0), column(cols[1], 1),
      ph ? g({}, keyLine(20, 690, 'stem', 'the tone and the sum'), keyLine(20, 714, 'stem-copy', 'the echo: half-size, 4 samples late'))
        : g({}, keyLine(60, 380, 'stem', 'the tone and the sum, solid'), keyLine(360, 380, 'stem-copy', 'the echo: half-size, 4 samples late'))];
  };

  const gainRipple = L => {
    const ph = L.phone, x0 = ph ? 50 : 80, x1 = ph ? 336 : 690;
    const P = plot({ x: x0, y: 64, w: x1 - x0, h: ph ? 190 : 200, xs: [0, 4000], ys: [0, 1.95] });
    const dots = [0, 500, 1000, 2000, 3000, 4000];
    const top = P.Y(1.86);
    return [
      axes(P, { xTicks: hzTicks(ph ? [0, 1000, 2000, 3000, 4000] : [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]).map(([f, s]) => [f, ph && f ? `${f / 1000}k` : s]), yTicks: [[0, '0'], [0.5, '0.5'], [1, '1'], [1.5, '1.5']], yTitle: 'gain' }),
      text(x1, P.y1 + 36, ph ? 'tone (Hz; 1k = 1,000)' : 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      line(P.x0, P.Y(1), P.x1, P.Y(1), { cls: 'k-grid' }),
      curve(P, f => gainAt(f, 4), { n: 400 }),
      dots.map(f => { const v = gainAt(f, 4); return g({}, circle(P.X(f), P.Y(v), 4.5, { cls: 'k-stem-dot' }), k.masked(P.X(f) + (f === 4000 ? -8 : f === 0 ? 8 : f === 500 ? (ph ? 8 : -10) : 0), f === 500 ? P.Y(v) + (ph ? -8 : 18) : v > 1 ? P.Y(v) - 10 : P.Y(v) + 22, fmt(v), { anchor: f === 4000 || (f === 500 && !ph) ? 'end' : f === 0 || f === 500 ? 'start' : 'middle', cls: 'k-num' })); }),
      path(`M${r2(P.X(0))} ${r2(top + 6)}L${r2(P.X(0))} ${r2(top)}L${r2(P.X(2000))} ${r2(top)}L${r2(P.X(2000))} ${r2(top + 6)}`, { cls: 'c-bracket-accent' }),
      text(P.X(1000), top - 8, ph ? 'a peak every 2,000 Hz' : 'a peak every 2,000 Hz', { cls: 'k-num-accent' }),
    ];
  };

  const echoWheel = L => {
    const ph = L.phone, R = ph ? 76 : 80;
    const stops = [500, 1000, 2000];
    const P = ph ? plot({ x: 50, y: 520, w: 286, h: 120, xs: [0, 4000], ys: [0, 1.75] }) : plot({ x: 80, y: 300, w: 610, h: 120, xs: [0, 4000], ys: [0, 1.75] });
    const panel = (f, i) => {
      const th = 4 * 360 * f / FS, gn = gainAt(f, 4);
      const ox = ph ? 34 : 34 + i * 235, oy = ph ? 92 + i * 136 : 136;
      const tx = ox + R, lift = th === 180 ? -10 : 0, drop = th === 360 ? 12 : th === 180 ? 10 : 0;
      const ex = tx + (R / 2) * cosd(-th), ey = oy + lift - (R / 2) * sind(-th);
      const d = i * 2.4;
      const tagX = ph ? 184 : ox, tagY = ph ? oy - 34 : oy + 70;
      const tags = [`echo ${th}° behind`, `gain ${fmt(gn)}`];
      return [
        text(ph ? tagX : ox, ph ? tagY : 56, `${hz(f)} Hz`, { anchor: 'start', cls: 'k-name' }),
        vec(ox, oy, tx, oy, 'orig'),
        lift ? line(tx, oy, tx, oy + lift, { cls: 'k-guide' }) : '',
        step(i + 1, `${hz(f)} Hz: the echo arrow turns ${th} degrees back, the sum arrow has length ${fmt(gn)}`,
          g(turnAt(tx, oy + lift, -th, { d, len: 1.4 }), vec(tx, oy + lift, ex, ey, 'echo')),
          g({ anim: { k: 'in', d: d + 1.4, len: 0.6 } },
            vec(ox, oy + drop, ex, th === 90 ? ey : oy + drop, 'sum'),
            tags.map((s, j) => text(tagX, tagY + (ph ? 22 : 0) + j * 18, s, { anchor: 'start', cls: j ? 'k-num-accent' : 'k-num' })),
            circle(P.X(f), P.Y(gn), 5, { cls: 'k-dot' }),
            k.masked(P.X(f) + 8, P.Y(gn) + (gn > 1 ? -8 : 18), fmt(gn), { anchor: 'start', cls: 'k-num-accent' }))),
      ];
    };
    return [
      stops.map(panel),
      text(P.x0 - (ph ? 40 : 66), P.y0 - 22, ph ? 'the sum arrow’s length, tone by tone' : 'the sum arrow’s length is the gain, tone by tone', { anchor: 'start', cls: 'k-name' }),
      axes(P, { xTicks: hzTicks(ph ? [0, 2000, 4000] : [0, 500, 1000, 2000, 3000, 4000]), yTicks: [[0.5, '0.5'], [1.5, '1.5']] }),
      text(P.x1, P.y1 + 36, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      step(4, 'the whole gain curve: the sum arrow’s length as the tone climbs from 0 to 4,000 Hz',
        curve(P, f => gainAt(f, 4), { n: 300, anim: { k: 'draw', d: 7.4, len: 2 } })),
      ph ? g({}, keyLine(20, 444, 'orig', 'original, length 1'), keyLine(20, 466, 'echo', 'echo, length 0.5'), keyLine(196, 444, 'sum', 'their sum'))
        : g({}, keyLine(80, 252, 'orig', 'original, length 1'), keyLine(270, 252, 'echo', 'echo, length 0.5, 4 samples back'), keyLine(590, 252, 'sum', 'their sum')),
    ];
  };

  const delayVsRipple = L => {
    const ph = L.phone, x0 = ph ? 50 : 80, x1 = ph ? 336 : 690;
    const P = plot({ x: x0, y: 50, w: x1 - x0, h: ph ? 190 : 200, xs: [0, 4000], ys: [0, 1.75] });
    return [
      axes(P, { xTicks: hzTicks(ph ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]), yTicks: [[0.5, '0.5'], [1, '1'], [1.5, '1.5']], yTitle: 'gain' }),
      text(x1, P.y1 + 36, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      curve(P, f => gainAt(f, 40), { n: 1600, cls: 'c-dash' }),
      curve(P, f => gainAt(f, 4), { n: 400 }),
      ph ? g({}, keyLine(20, 316, 'k-curve', 'delay 4: a peak every 2,000 Hz'), keyLine(20, 340, 'c-dash', 'delay 40: a peak every 200 Hz'))
        : g({}, keyLine(80, 314, 'k-curve', 'delay 4: two wide humps, a peak every 2,000 Hz'), keyLine(80, 338, 'c-dash', 'delay 40: twenty narrow ones, a peak every 200 Hz')),
    ];
  };

  const voiceLog10 = f => {
    const s = (a, b, t) => a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * t));
    if (f <= 700) return s(1.4, 2, f / 700);
    if (f <= 3000) return s(2, 0, (f - 700) / 2300);
    return s(0, 0.5, (f - 3000) / 1000);
  };
  const logSpectrum = L => {
    const ph = L.phone, x0 = ph ? 50 : 80, x1 = ph ? 336 : 690;
    const V = f => 10 ** voiceLog10(f), E = f => V(f) * gainAt(f, 80);
    const T = plot({ x: x0, y: 70, w: x1 - x0, h: ph ? 170 : 170, xs: [0, 4000], ys: [0, 185] });
    const B = plot({ x: x0, y: ph ? 340 : 330, w: x1 - x0, h: ph ? 170 : 160, xs: [0, 4000], ys: [-2, 6.5] });
    const ticks = hzTicks(ph ? [0, 700, 2000, 3000, 4000] : [0, 700, 1000, 2000, 3000, 4000]);
    const bx = [700, 3000];
    return [
      text(x0 - (ph ? 40 : 66), T.y0 - 30, 'the spectrum of an echoed voice', { anchor: 'start', cls: 'k-name' }),
      axes(T, { xTicks: ticks, yTicks: [[0, '0'], [50, '50'], [100, '100'], [150, '150']], yTitle: 'size' }),
      curve(T, V, { n: 400, cls: 'c-ref' }),
      curve(T, E, { n: 2400, cls: 'k-curve' }),
      rect(T.X(650), T.Y(150), T.X(750) - T.X(650), T.Y(50) - T.Y(150), { cls: 'c-block' }),
      text(T.X(700), T.Y(150) - 8, 'swing 100', { cls: 'k-num' }),
      rect(T.X(2950), T.Y(12), T.X(3050) - T.X(2950), T.Y(0) - T.Y(12), { cls: 'c-block' }),
      text(T.X(3000), T.Y(12) - 8, 'swing 1', { cls: 'k-num' }),
      text(x0 - (ph ? 40 : 66), B.y0 - 30, 'the same, after the log', { anchor: 'start', cls: 'k-name' }),
      axes(B, { xTicks: ticks, yTicks: [[0, '0'], [2, '2'], [4, '4'], [6, '6']], yTitle: 'log of size' }),
      text(x1, B.y1 + 36, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      curve(B, f => Math.log(V(f)), { n: 400, cls: 'c-ref' }),
      curve(B, f => Math.log(E(f)), { n: 2400, cls: 'k-curve' }),
      bx.map(f => g({}, rect(B.X(f - 50), B.Y(Math.log(1.5 * V(f))), B.X(f + 50) - B.X(f - 50), B.Y(Math.log(0.5 * V(f))) - B.Y(Math.log(1.5 * V(f))), { cls: 'c-bracket-accent' }),
        text(B.X(f), f === 700 ? B.Y(Math.log(1.5 * V(f))) - 8 : B.Y(Math.log(0.5 * V(f))) + 18, 'swing 1.10', { cls: 'k-num-accent' }))),
      ph ? g({}, keyLine(20, 580, 'c-ref', 'the voice alone'), keyLine(20, 604, 'k-curve', 'the voice with the echo'))
        : g({}, keyLine(80, 546, 'c-ref', 'the voice alone, dashed'), keyLine(360, 546, 'k-curve', 'the voice with the echo')),
    ];
  };

  const toneCircle = L => {
    const ph = L.phone, cx = ph ? 180 : 250, cy = ph ? 200 : 210, R = ph ? 104 : 140, lr = R + (ph ? 24 : 30);
    const tones = range(0, 15).map(i => i * 500);
    const at = (f, r) => [cx + r * cosd(360 * f / FS), cy - r * sind(360 * f / FS)];
    return [
      line(cx - R - 18, cy, cx + R + 18, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'c-ring' }),
      range(1, 7).map(i => { const [x, y1] = at(i * 500, R), [, y2] = at(FS - i * 500, R); return line(x, y1, x, y2, { cls: 'k-guide' }); }),
      tones.map(f => { const [x, y] = at(f, R), [tx, ty] = at(f, lr); return g({}, circle(x, y, 4.5, { cls: f > 4000 ? 'c-echo-dot' : 'c-tone-dot' }), text(tx, ty + 4, hz(f), { cls: ph ? 'c-small' : 'k-tick' })); }),
      ph ? g({}, text(180, 372, 'top half: 0 to 4,000 Hz', { cls: 'k-label' }), text(180, 392, 'bottom half: the mirror arrows', { cls: 'k-label' }), text(180, 412, 'dashed: a mirror pair, same gain', { cls: 'k-label' }))
        : g({}, keyLine(470, 150, 'tone-dot', '0 to 4,000 Hz, the top half'), keyLine(470, 176, 'echo-dot', '4,500 to 7,500 Hz: the mirror'), keyLine(470, 202, 'k-guide', 'a mirror pair: same gain'), text(470, 250, '16 bins, 500 Hz apart', { anchor: 'start', cls: 'k-label' }), text(470, 270, 'one lap of the circle', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const listDft = L => {
    const ph = L.phone;
    const A = ph ? plot({ x: 46, y: 64, w: 290, h: 180, xs: [-0.7, 15.7], ys: [-1.0, 0.75] }) : plot({ x: 70, y: 64, w: 290, h: 200, xs: [-0.7, 15.7], ys: [-1.0, 0.75] });
    const B = ph ? plot({ x: 46, y: 352, w: 290, h: 180, xs: [-0.7, 15.7], ys: [-0.2, 0.34] }) : plot({ x: 420, y: 64, w: 280, h: 200, xs: [-0.7, 15.7], ys: [-0.2, 0.34] });
    const bw = ph ? 11 : 11;
    const bar = (P, kk, v, cls) => rect(P.X(kk) - bw / 2, Math.min(P.Y(v), P.Y(0)), bw, Math.abs(P.Y(v) - P.Y(0)), { cls });
    const kTicks = [0, 4, 8, 12, 15].map(kk => [kk, String(kk)]);
    return [
      text(A.x0 - 30, A.y0 - 34, 'the log list, 16 bins', { anchor: 'start', cls: 'k-name' }),
      axes(A, { xTicks: kTicks, yTicks: [[0.4, '0.4'], [0, '0'], [-0.7, `${M}0.7`]] }),
      rect(A.X(-0.5), A.Y(0.62), A.X(3.5) - A.X(-0.5), A.Y(-0.94) - A.Y(0.62), { cls: 'c-block' }),
      text(A.X(-0.5), A.Y(0.62) - 24, 'this block repeats:', { anchor: 'start', cls: 'k-tick' }),
      LIST.map((v, kk) => bar(A, kk, v, 'k-bar')),
      text(A.X(-0.5), A.Y(0.62) - 8, [0, 1, 2, 3].map(kk => fmt(LIST[kk])).join(', '), { anchor: 'start', cls: 'k-num' }),
      text(A.x1, A.y1 + 36, 'bin (500 Hz apart)', { anchor: 'end', cls: 'k-tick' }),
      text(B.x0 - 30, B.y0 - 34, 'its FFT ÷ 16', { anchor: 'start', cls: 'k-name' }),
      axes(B, { xTicks: kTicks, yTicks: [[0.27, '0.27'], [0, '0'], [-0.13, `${M}0.13`]], yTitle: 'FFT ÷ 16' }),
      text(B.x1, B.y1 + 36, 'bin', { anchor: 'end', cls: 'k-tick' }),
      range(0, 15).map(kk => bar(B, kk, LIST_C[kk], kk === 4 ? 'k-bar-accent' : kk === 12 ? 'c-bar-ref' : 'k-bar')),
      text(B.X(4), B.Y(LIST_C[4]) - 8, 'bin 4: 0.27', { cls: 'k-num-accent' }),
      text(B.X(8), B.Y(LIST_C[8]) + 16, fmt(LIST_C[8]), { cls: 'k-num' }),
      text(B.X(12), B.Y(LIST_C[12]) - 22, '0.27,', { cls: 'k-num' }), text(B.X(12), B.Y(LIST_C[12]) - 8, 'mirror of 4', { cls: 'k-tick' }),
      text(ph ? 46 : 420, ph ? 590 : 330, 'a plain FFT reads 4.39 at bin 4', { anchor: 'start', cls: 'k-tick' }),
      text(ph ? 46 : 420, ph ? 608 : 348, 'bin 0, ' + fmt(LIST_C[0], 3) + ', is too small to label', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const lappingEcho = L => {
    const ph = L.phone, R = ph ? 86 : 96;
    const [cx, cy] = ph ? [180, 140] : [140, 160];
    const P = ph ? plot({ x: 50, y: 334, w: 286, h: 130, xs: [0, 8000], ys: [-0.8, 0.5] }) : plot({ x: 330, y: 70, w: 360, h: 170, xs: [0, 8000], ys: [-0.8, 0.5] });
    const at = (a, r = R) => [cx + r * cosd(a), cy - r * sind(a)];
    const quarter = i => {
      const [tx, ty] = at(90 * i), d = (i - 1) * 2;
      return [
        step(i, `${hz(2000 * i)} Hz: the tone's dot has gone ${i} quarter${i > 1 ? 's' : ''} round; the echo's dot, 4 per-sample steps behind it, has lapped it ${i} time${i > 1 ? 's' : ''} and sits on it again`,
          g({ anim: { k: 'in', d, len: 0.3 } },
            g(i < 4 ? { cls: 'k-faint', anim: { k: 'fade', o0: 1, d: d + 2, len: 0.4 } } : {},
              g(turnAt(cx, cy, -270, { d, len: 1.8 }), circle(tx, ty, 9, { cls: 'c-echo-dot' })), g(turnAt(cx, cy, 90, { d, len: 1.8 }), circle(tx, ty, 5, { cls: 'c-tone-dot' }))))),
        step(i, `the log of the gain from ${hz(2000 * (i - 1))} to ${hz(2000 * i)} Hz: one bump, lap ${i}`,
          g({}, curve(P, f => logGain(f, 4), { from: 2000 * (i - 1), to: 2000 * i, n: 80, anim: { k: 'draw', d, len: 1.8 } }),
            g({ anim: { k: 'in', d: d + 1.6, len: 0.4 } }, text(P.X(2000 * i - 1000), P.Y(0.5) - 4, `lap ${i}`, { cls: 'k-num-accent' })))),
      ];
    };
    const strip = range(0, 4).map(i => {
      const sx = ph ? 36 + i * 72 : 120 + i * 120, sy = ph ? 600 : 388, r = ph ? 22 : 26;
      const [tx, ty] = [sx + r * cosd(90 * i), sy - r * sind(90 * i)];
      return g({}, circle(sx, sy, r, { cls: 'c-ring' }), circle(tx, ty, 7, { cls: 'c-echo-dot' }), circle(tx, ty, 3.5, { cls: 'c-tone-dot' }),
        text(sx, sy - r - 10, `${hz(2000 * i)} Hz`, { cls: ph ? 'c-small' : 'k-tick' }), text(sx, sy + r + 18, `${i} lap${i === 1 ? '' : 's'}`, { cls: 'k-num' }));
    });
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'c-ring' }),
      text(cx, cy + R + (ph ? 26 : 30), ph ? 'the tone goes once round' : 'the tone goes once round,', { cls: 'k-label' }),
      text(cx, cy + R + (ph ? 44 : 48), ph ? 'the echo laps it 4 times' : 'the echo laps it 4 times', { cls: 'k-label' }),
      text(P.x0 - (ph ? 40 : 46), P.y0 - 22, 'log of the gain, delay 4', { anchor: 'start', cls: 'k-name' }),
      axes(P, { xTicks: hzTicks(ph ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]), yTicks: [[0.41, '0.41'], [0, '0'], [-0.69, `${M}0.69`]] }),
      text(P.x1, P.y1 + 36, 'tone (Hz), once round', { anchor: 'end', cls: 'k-tick' }),
      [1, 2, 3, 4].map(quarter),
      text(ph ? 180 : 360, ph ? 542 : 330, ph ? 'every 2,000 Hz: echo on the tone' : 'every 2,000 Hz the echo lands back on the tone: five stops', { cls: 'k-label' }),
      strip,
      ph ? g({}, keyLine(20, 676, 'tone-dot', 'the tone'), keyLine(150, 676, 'echo-dot', 'the echo, 4 samples back'))
        : g({}, keyLine(120, 470, 'tone-dot', 'the tone’s dot'), keyLine(320, 470, 'echo-dot', 'the echo’s dot, set back 4 per-sample steps')),
    ];
  };

  const cepstrumFig = L => {
    const ph = L.phone;
    const word = range(0, 2599).map(n => (n < 700 ? SIM.voice[200 + n] * (0.5 - 0.5 * Math.cos(2 * Math.PI * n / 700)) : 0));
    const call = word.map((v, n) => v + (n >= 1200 ? 0.5 * word[n - 1200] : 0));
    const peak = word.reduce((m, v) => Math.max(m, Math.abs(v)), 0) * 1.15;
    const pos = ph ? [[50, 60], [50, 308], [50, 570]] : [[34, 80], [290, 80], [546, 80]];
    const w = ph ? 286 : 150, h = ph ? 110 : 130;
    const A = plot({ x: pos[0][0], y: pos[0][1], w, h, xs: [0, 2600], ys: [-peak, peak] });
    const B = plot({ x: pos[1][0], y: pos[1][1], w, h, xs: [0, 4000], ys: [-4, 6] });
    const C = plot({ x: pos[2][0], y: pos[2][1], w, h, xs: [0, 2600], ys: [-0.1, 0.3] });
    const nsA = range(0, 2599), half = range(0, SIM.N / 2 - 1);
    const arrowAt = (x1, y1, x2, y2, label) => g({}, k.arrow(L.slug, [[x1, y1], [x2, y2]]), ph ? text(x1 + 14, (y1 + y2) / 2 + 4, label, { anchor: 'start', cls: 'k-num' }) : text((x1 + x2) / 2, y1 - 10, label, { cls: 'k-num' }));
    const qTicks = [[0, '0'], [1200, '1,200'], [2400, '2,400']];
    return [
      [[A, 'a call with an echo'], [B, 'its log spectrum'], [C, 'its cepstrum']].map(([P, s]) => text(P.x0, P.y0 - 18, s, { anchor: 'start', cls: 'k-name' })),
      line(A.x0, A.Y(0), A.x1, A.Y(0), { cls: 'k-axis' }),
      envelope(A, nsA, call),
      qTicks.map(([v, s]) => text(A.X(v), A.y1 + 16, s, { cls: 'k-tick' })), text(A.x1, A.y1 + 32, 'time (samples)', { anchor: 'end', cls: 'k-tick' }),
      text(A.X(1200) + 6, A.Y(peak * 0.75), 'echo', { anchor: 'start', cls: 'k-tick' }),
      line(B.x0, B.y1, B.x1, B.y1, { cls: 'k-axis' }),
      envelope(B, half.map(kk => kk * FS / SIM.N), half.map(kk => SIM.logs[kk]), { clip: [-4, 6] }),
      [[0, '0'], [4000, '4,000']].map(([v, s]) => text(B.X(v), B.y1 + 16, s, { cls: 'k-tick' })), text(B.x1, B.y1 + 32, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      text(B.x0, B.y1 + 50, 'a ripple every 6.67 Hz,', { anchor: 'start', cls: 'k-tick' }), text(B.x0, B.y1 + 64, 'too fine to see one by one', { anchor: 'start', cls: 'k-tick' }),
      line(C.x0, C.Y(0), C.x1, C.Y(0), { cls: 'k-axis' }),
      envelope(C, half, half.map(q => SIM.c[q]), { clip: [-0.1, 0.3] }),
      circle(C.X(1200), C.Y(SIM.c[1200]), 4.5, { cls: 'k-dot' }),
      text(C.X(1200) + 8, C.Y(SIM.c[1200]) + 4, 'peak', { anchor: 'start', cls: 'k-num-accent' }),
      qTicks.map(([v, s]) => text(C.X(v), C.y1 + 16, s, { cls: 'k-tick' })), text(C.x1, C.y1 + 32, 'quefrency (samples)', { anchor: 'end', cls: 'k-tick' }),
      text(C.x0, C.y1 + 50, 'peak at 1,200 samples,', { anchor: 'start', cls: 'k-num-accent' }), text(C.x0, C.y1 + 66, '0.15 s: the delay', { anchor: 'start', cls: 'k-num-accent' }),
      ph ? g({}, arrowAt(180, 220, 180, 262, 'FFT, then log'), arrowAt(180, 494, 180, 532, 'FFT'))
        : g({}, arrowAt(196, 145, 280, 145, 'FFT, then log'), arrowAt(452, 145, 536, 145, 'FFT')),
    ];
  };

  const binsVsRipple = L => {
    const ph = L.phone;
    const lo = 1000, hi = 1020;
    const T = ph ? plot({ x: 30, y: 60, w: 306, h: 80, xs: [lo, hi], ys: [0, 1.6] }) : plot({ x: 130, y: 56, w: 330, h: 90, xs: [lo, hi], ys: [0, 1.6] });
    const rows = [1024, 2048, 8192].map((N, i) => {
      const P = ph ? plot({ x: 30, y: 210 + i * 146, w: 306, h: 50, xs: [lo, hi], ys: [0, 1.6] }) : plot({ x: 130, y: 196 + i * 78, w: 330, h: 50, xs: [lo, hi], ys: [0, 1.6] });
      const step = FS / N, bins = range(Math.ceil(lo / step), Math.floor(hi / step)).map(kk => kk * step);
      const per = N / 1200, ok = pure[N] === 1200;
      const sx = ph ? 30 : 490, sy = ph ? P.y1 + 26 : P.y0 + 14;
      return g({},
        line(P.x0, P.y1, P.x1, P.y1, { cls: 'k-axis' }),
        text(ph ? P.x0 : P.x0 - 12, ph ? P.y0 - 8 : P.y1 - 18, `N = ${hz(N)}`, { anchor: ph ? 'start' : 'end', cls: 'k-name' }),
        ph ? '' : text(P.x0 - 12, P.y1, `bins ${step.toFixed(2)} Hz apart`, { anchor: 'end', cls: 'k-tick' }),
        ph ? text(P.x1, P.y0 - 8, `bins ${step.toFixed(2)} Hz apart`, { anchor: 'end', cls: 'k-tick' }) : '',
        stems(P, bins.map(f => [f, gainAt(f, 1200)]), { dot: 2.6 }),
        text(sx, sy, `${per < 1 ? per.toFixed(2) : per.toFixed(1)} bins per ripple`, { anchor: 'start', cls: 'k-num' }),
        ok ? k.check(sx + 8, sy + 18) : k.cross(sx + 8, sy + 18),
        text(sx + 24, sy + 22, ok ? `peak at ${hz(pure[N])}: right` : `peak at ${hz(pure[N])}: false`, { anchor: 'start', cls: ok ? 'k-num-accent' : 'k-num' }));
    });
    return [
      text(T.x0, T.y0 - 22, ph ? 'the ripple of a 1,200-sample echo' : 'the ripple of a 1,200-sample echo, 1,000 to 1,020 Hz', { anchor: 'start', cls: 'k-name' }),
      line(T.x0, T.y1, T.x1, T.y1, { cls: 'k-axis' }),
      curve(T, f => gainAt(f, 1200), { n: 400 }),
      [1000, 1006.67, 1013.33, 1020].map(f => line(T.X(f), T.y1, T.X(f), T.y1 + 5, { cls: 'k-axis' })),
      text(T.X(1003.33), T.y1 + 20, 'one ripple: 6.67 Hz', { cls: 'k-tick' }),
      rows,
      text(ph ? 30 : 130, ph ? 668 : 446, ph ? 'stems: the ripple as each N’s bins see it' : 'stems: the ripple as each record’s bins sample it, 1,000 to 1,020 Hz', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const realCepstrum = L => {
    const ph = L.phone, x0 = ph ? 50 : 80, x1 = ph ? 336 : 690;
    const P = plot({ x: x0, y: 80, w: x1 - x0, h: ph ? 220 : 230, xs: [0, 2500], ys: [-0.1, 0.3] });
    const qs = range(0, 2500), c = SIM.c;
    const pitch = ph ? [64] : [64, 128, 192, 256], py = ph ? 0.15 : 0.12;
    return [
      axes(P, { xTicks: ph ? [[0, '0'], [1200, '1,200'], [2400, '2,400']] : [[0, '0'], [100, '100'], [500, '500'], [1000, '1,000'], [1200, '1,200'], [1500, '1,500'], [2000, '2,000'], [2400, '2,400']], yTicks: [[0.2, '0.20'], [0.08, '0.08'], [0, '0'], [-0.04, `${M}0.04`]] }),
      text(x1, P.y1 + 36, 'quefrency (samples)', { anchor: 'end', cls: 'k-tick' }),
      line(P.x0, P.Y(0.08), P.x1, P.Y(0.08), { cls: 'k-guide' }),
      rect(P.x0, P.y0, P.X(100) - P.x0, P.h, { cls: 'c-shade' }),
      envelope(P, qs, qs.map(q => c[q]), { clip: [-0.1, 0.3] }),
      line(P.X(100), P.y0 - 6, P.X(100), P.y1, { cls: 'c-dash' }),
      text(P.X(100) + 6, P.y0 + 12, ph ? 'cutoff 100' : 'cutoff: quefrency 100', { anchor: 'start', cls: 'k-tick' }),
      text(P.x0, P.y0 - 14, ph ? 'voice shape: off the top' : 'voice shape (slow wobble): runs off the top near 0', { anchor: 'start', cls: 'k-label' }),
      pitch.map(q => path(`M${r2(P.X(q))} ${r2(P.Y(py))}l-4 -8h8z`, { cls: 'c-head' })),
      text(P.X(pitch[pitch.length - 1]) + 8, P.Y(py), ph ? 'pitch: 64' : 'pitch: 64 and its multiples', { anchor: 'start', cls: 'k-label' }),
      circle(P.X(1200), P.Y(c[1200]), 5, { cls: 'k-dot' }),
      k.masked(P.X(1200) + 10, P.Y(c[1200]) + 4, `echo: 1,200, ${fmt(c[1200])}`, { anchor: 'start', cls: 'k-num-accent' }),
      circle(P.X(2400), P.Y(c[2400]), 4, { cls: 'c-echo-dot' }),
      k.masked(P.X(2400) - 10, P.Y(c[2400]) + 26, ph ? `dip: 2,400, ${fmt(c[2400])}` : `lopsided-ripple dip: 2,400, ${fmt(c[2400])}`, { anchor: 'end', cls: 'k-num' }),
      text(P.x1, P.Y(0.08) - 6, ph ? 'voice bumps' : 'the voice’s own bumps stay under about 0.08', { anchor: 'end', cls: 'k-tick' }),
    ];
  };

  const lopsidedLog = L => {
    const ph = L.phone;
    const A = ph ? plot({ x: 50, y: 70, w: 286, h: 170, xs: [0, 4000], ys: [-0.8, 0.6] }) : plot({ x: 70, y: 70, w: 280, h: 190, xs: [0, 4000], ys: [-0.8, 0.6] });
    const B = ph ? plot({ x: 50, y: 360, w: 286, h: 170, xs: [0, 4000], ys: [-0.8, 0.6] }) : plot({ x: 420, y: 70, w: 280, h: 190, xs: [0, 4000], ys: [-0.8, 0.6] });
    const w = f => 2 * Math.PI * f / FS * 4;
    const t1 = f => 0.5 * Math.cos(w(f)), t2 = f => -0.125 * Math.cos(2 * w(f)), t3 = f => (0.125 / 3) * Math.cos(3 * w(f));
    const yt = [[0.41, '0.41'], [0, '0'], [-0.5, `${M}0.5`], [-0.69, `${M}0.69`]];
    return [
      text(A.x0 - 40, A.y0 - 30, 'log of the gain, delay 4', { anchor: 'start', cls: 'k-name' }),
      axes(A, { xTicks: hzTicks([0, 2000, 4000]), yTicks: yt }),
      text(A.x1, A.y1 + 36, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      curve(A, t1, { n: 200, cls: 'c-ref' }),
      curve(A, f => logGain(f, 4), { n: 300 }),
      text(A.X(1000), A.Y(-0.69) + 18, 'dips: −0.69', { cls: 'k-num-accent' }),
      text(A.X(2000), A.Y(0.5) - 8, 'peaks: 0.41', { cls: 'k-num' }),
      text(B.x0 - 40, B.y0 - 30, 'three cosines add up to it', { anchor: 'start', cls: 'k-name' }),
      axes(B, { xTicks: hzTicks([0, 2000, 4000]), yTicks: [[0.5, '0.5'], [0, '0'], [-0.5, `${M}0.5`]] }),
      text(B.x1, B.y1 + 36, 'tone (Hz)', { anchor: 'end', cls: 'k-tick' }),
      curve(B, t1, { n: 200, cls: 'c-ref' }),
      curve(B, t2, { n: 300, cls: 'c-dot-line' }),
      curve(B, t3, { n: 300, cls: 'c-dashdot' }),
      curve(B, f => t1(f) + t2(f) + t3(f), { n: 300 }),
      ph ? g({}, keyLine(20, 580, 'c-ref', '0.5 cos, the pure cosine'), keyLine(20, 602, 'c-dot-line', `${M}0.125 cos, twice as fast`), keyLine(20, 624, 'c-dashdot', '0.042 cos, three times'), keyLine(20, 646, 'k-curve', 'log of gain; the three added'))
        : g({}, keyLine(70, 330, 'c-ref', '0.5 cos: the pure cosine'), keyLine(400, 330, 'c-dot-line', `${M}0.125 cos: twice as fast`), keyLine(70, 354, 'c-dashdot', '0.042 cos: three times as fast'), keyLine(400, 354, 'k-curve', 'left: the log; right: the three added')),
    ];
  };

  const cancellerFig = L => {
    const ph = L.phone, A = (pts, o) => k.arrow(L.slug, pts, o);
    const sub = (x, y) => g({}, circle(x, y, 14, { cls: 'k-mask-box' }), circle(x, y, 14, { cls: 'k-box' }), text(x, y + 5, '−', { cls: 'k-name' }));
    const diagram = (ox, oy, fb) => {
      const sx = ox + 150, outX = ox + 300, by = oy + 92;
      const tap = fb ? ox + 262 : ox + 60;
      return g({},
        text(ox, oy - 6, 'heard', { anchor: 'start', cls: 'k-label' }),
        line(ox, oy, sx - 14, oy, { cls: 'k-arrow' }), A([[sx - 30, oy], [sx - 16, oy]]),
        sub(sx, oy),
        A([[sx + 14, oy], [outX, oy]]),
        text(outX, oy - 8, fb ? 'clean' : 'out', { anchor: 'end', cls: 'k-label' }),
        circle(tap, oy, 3, { cls: 'c-tone-dot' }),
        line(tap, oy, tap, by, { cls: 'k-arrow' }),
        k.box(fb ? tap - 32 : tap - 10, by - 18, 64, 36, { name: 'D' }),
        fb ? g({}, A([[tap - 32, by], [sx + 56, by]]), k.box(sx - 10, by - 18, 64, 36, { name: '× α' }), path(`M${sx - 10} ${by}L${sx - 40} ${by}L${sx - 40} ${oy + 30}L${sx} ${oy + 30}`, { cls: 'k-arrow' }), A([[sx, oy + 30], [sx, oy + 16]]))
          : g({}, A([[tap + 54, by], [sx - 22, by]]), k.box(sx - 20, by - 18, 64, 36, { name: '× α' }), path(`M${sx + 44} ${by}L${sx + 60} ${by}L${sx + 60} ${oy + 30}L${sx} ${oy + 30}`, { cls: 'k-arrow' }), A([[sx, oy + 30], [sx, oy + 16]])),
        text(ox, by + 52, fb ? 'subtract a shifted copy of clean' : 'subtract a shifted copy of heard', { anchor: 'start', cls: 'k-name' }),
        fb ? text(ox, by + 72, 'overall: exactly 1', { anchor: 'start', cls: 'k-num' }) : `<text x="${ox}" y="${by + 72}" text-anchor="start" class="k-num">overall: 1 − α<tspan baseline-shift="super" font-size="9">2</tspan> z<tspan baseline-shift="super" font-size="9">−2D</tspan></text>`);
    };
    const resp = (ox, oy, fb) => {
      const P = plot({ x: ox + 20, y: oy, w: ph ? 286 : 270, h: 100, xs: [-0.4, 2.6], ys: [-0.4, 1.15] });
      const out = fb ? [[0, 1]] : [[0, 1], [2, -0.25]];
      return g({},
        line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
        [[0, 'n = 0'], [1, 'D'], [2, '2D']].map(([v, s]) => text(P.X(v), P.y1 + 16, s, { cls: 'k-tick' })),
        stems(P, [[0.07, 1], [1, 0.5]], { cls: 'k-stem-soft', dot: 3.5 }),
        stems(P, out.filter(([n]) => n === 0), { dot: 4 }),
        fb ? text(P.X(1.7), P.Y(0.3), 'nothing left', { cls: 'k-num' })
          : g({}, stems(P, [[2, -0.25]], { cls: 'k-stem-accent', dot: 4.5 }), text(P.X(2) - 10, P.Y(-0.25) + 4, `${M}0.25 at 2D`, { anchor: 'end', cls: 'k-num-accent' })),
        text(P.x0 - 20, P.y0 - 12, 'one click through the echo:', { anchor: 'start', cls: 'k-label' }));
    };
    if (ph) return [
      diagram(20, 40, false), resp(20, 260, false),
      diagram(20, 440, true), resp(20, 660, true),
      keyLine(20, 836, 'stem-soft', 'heard: the click and its echo'), keyLine(20, 860, 'stem', 'what comes out'),
    ];
    return [
      diagram(24, 50, false), diagram(384, 50, true),
      resp(24, 260, false), resp(384, 260, true),
      keyLine(44, 430, 'stem-soft', 'heard: the click and its echo (dashed)'), keyLine(400, 430, 'stem', 'what comes out'),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: CSS, eyebrow: 'Lesson 16 · the cepstrum', body: (kk, L) => body(L) });

  return [
    fig('echo-samples', [400, 730], 'Same echo, louder here, quieter there',
      'Left: a 2,000 Hz tone, its half-size copy 4 samples late, and the sum, which is 1.5 tall from sample 4 on. Right: the same for 1,000 Hz, where the copy pulls against the tone and the sum is 0.5 tall from sample 4 on.',
      'The echo is half a copy of each tone, 4 samples late. For 2,000 Hz it lands on top of the tone; for 1,000 Hz it pulls against it.', echoSamples),
    fig('gain-ripple', [340, 330], 'The echo’s gain ripples',
      'Gain against tone from 0 to 4,000 Hz for an echo 4 samples late at strength 0.5: a smooth curve between 0.5 and 1.5, with dots at 0, 500, 1,000, 2,000, 3,000 and 4,000 Hz reading 1.5, 1.12, 0.5, 1.5, 0.5 and 1.5. It peaks every 2,000 Hz.',
      'The gain of the 4-sample echo at every tone from 0 to 4,000 Hz, with the six values from the table as dots. It peaks every 2,000 Hz.', gainRipple),
    fig('echo-wheel', [470, 690], 'The echo arrow swings round',
      'The original arrow, length 1, with the echo’s half-length arrow hanging off its tip, set back by 4 per-sample steps. At 500 Hz the echo sits 90 degrees behind and the sum is 1.12 long; at 1,000 Hz 180 degrees, sum 0.5; at 2,000 Hz 360 degrees, sum 1.5. Below, the sum’s length against tone traces the gain curve.',
      'At each tone the echo arrow sits 4 per-sample steps behind the original: 90° at 500 Hz, 180° at 1,000 Hz, a full lap at 2,000 Hz. The sum arrow’s length is the gain.', echoWheel, 4),
    fig('delay-vs-ripple', [360, 360], 'A longer delay makes a finer ripple',
      'Two gain curves from 0 to 4,000 Hz at strength 0.5: delay 4, solid, with a peak every 2,000 Hz, two wide humps; delay 40, dashed, with a peak every 200 Hz, twenty narrow humps.',
      'Two wide humps against twenty narrow ones. Ten times the delay, a ripple ten times tighter.', delayVsRipple),
    fig('log-spectrum', [570, 620], 'The log makes the ripple the same height',
      'Top: a voice-shaped spectrum, loud near 700 Hz and quiet near 3,000 Hz, times the echo’s ripple, on a linear axis. Near 700 Hz it swings between 150 and 50, a swing of 100; near 3,000 Hz between 1.5 and 0.5, a swing of 1. Bottom: the same after the log; the swing is 1.10 at both places.',
      'Top: the echo’s ripple is huge on the voice’s hump and invisible in its valley. Bottom: after the log, the same ripple has the same height everywhere.', logSpectrum),
    fig('tone-circle', [420, 430], 'Sixteen tones round the circle',
      'The unit circle with 16 dots, 500 Hz apart, labelled 0 to 7,500 Hz, with 0 Hz at the right. Tones from 0 to 4,000 Hz are on the top half; 4,500 to 7,500 Hz on the bottom half, the mirror arrows. Each mirror pair is joined: 4,500 with 3,500, 5,000 with 3,000, and so on.',
      'The echo’s gain is sampled at these 16 tones: no voice, no recording. Each tone below the line mirrors one above it and has the same gain.', toneCircle),
    fig('list-dft', [370, 630], 'The list’s FFT lights up bin 4',
      'Left: the log of the gain at 16 tones as bars, repeating 0.41, 0.11, −0.69, 0.11, with the first block of four outlined. Right: its FFT divided by 16: bin 4 is 0.27, bin 8 is −0.13, and bin 12 is 0.27, the mirror of bin 4.',
      'The list repeats every 4 bins, so it goes round 4 times across all 16, and the FFT lights up bin 4: the delay. Bin 12 is its mirror.', listDft),
    fig('lapping-echo', [490, 700], 'The echo laps the tone D times',
      'Left: the unit circle. As the tone climbs from 0 to 8,000 Hz its dot goes once round, a quarter every 2,000 Hz; the echo’s dot, 4 per-sample steps behind, laps it 4 times, landing back on the tone’s dot every 2,000 Hz. Right: the log of the gain draws one bump per lap, 4 bumps. Below, five stops at 0, 2,000, 4,000, 6,000 and 8,000 Hz with 0 to 4 laps.',
      'Once round the circle, the 4-sample echo laps the tone 4 times, so the log ripple has 4 bumps and the match lands on bin 4.', lappingEcho, 4),
    fig('cepstrum', [330, 770], 'The cepstrum: a spectrum of a spectrum',
      'Three panels. A call with an echo 1,200 samples late against time in samples; an arrow labelled FFT, then log; its log spectrum against tone, fuzzy with a ripple every 6.67 Hz; an arrow labelled FFT; its cepstrum against quefrency in samples, with one peak at 1,200 samples, 0.15 s.',
      'The recipe at a glance.', cepstrumFig),
    fig('bins-vs-ripple', [460, 690], 'The record must hold more than 2D samples',
      'The 6.67 Hz ripple of a 1,200-sample echo from 1,000 to 1,020 Hz, then the same ripple as sampled by the bins of three records. N = 1,024: bins 7.81 Hz apart, 0.85 per ripple, false peak at 176. N = 2,048: bins 3.91 Hz apart, 1.7 per ripple, false peak at 848. N = 8,192: bins 0.98 Hz apart, 6.8 per ripple, peak at 1,200.',
      'More than two bins per ripple, or the peak lands at a false quefrency: 176 and 848 for records too short, 1,200 for 8,192 samples.', binsVsRipple),
    fig('real-cepstrum', [380, 380], 'The cepstrum of the real call',
      'The cepstrum of a voice with an echo 1,200 samples late at strength 0.5, from quefrency 0 to 2,500 samples. Near 0 the voice’s shape runs off the top; pitch bumps sit at 64 and its multiples; a dashed line marks the cutoff at 100; the echo’s peak is at 1,200, 0.20 tall; a dip at 2,400 reads −0.04; the voice’s other bumps stay under about 0.08.',
      'Everything below 100 is the voice’s shape; the bumps at 64 and its multiples are its pitch. Beyond that, the tallest peak is the echo, with its dip at twice the delay.', realCepstrum),
    fig('lopsided-log', [370, 670], 'The lopsided ripple',
      'Left: the log of the gain for a 4-sample echo at strength 0.5, with peaks of 0.41 and dips of −0.69, beside a pure cosine of size 0.5. Right: three cosines, 0.5 cos, −0.125 cos at twice the speed and 0.042 cos at three times, and their sum, which matches the lopsided log.',
      'The log squashes the peaks and stretches the dips. Describing that lopsided ripple takes cosines at two and three times the speed: the smaller spikes at 2D and 3D.', lopsidedLog),
    fig('canceller', [450, 880], 'Two cancellers',
      'Left: the feedforward canceller subtracts a shifted, scaled copy of heard; overall it multiplies by 1 minus α squared times z to the power −2D. Right: the feedback canceller subtracts a shifted, scaled copy of its own output, clean; overall exactly 1. Below each: one click through the echo. Feedforward leaves −0.25 at 2D; feedback leaves nothing.',
      'Subtract a shifted copy of heard and the echo’s own echo is left, −0.25 at 2D. Subtract a shifted copy of clean and nothing is left.', cancellerFig),
  ];
};
