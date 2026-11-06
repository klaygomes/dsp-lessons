const CSS = `
.k-fig .w-pass { fill: var(--input-soft); }
.k-fig .w-mirror { fill: var(--paper-2); }
.k-fig .w-stripe-bg { fill: var(--paper); }
.k-fig .w-stripe { stroke: var(--ink-soft); stroke-width: 1.2; opacity: 0.55; }
.k-fig .w-tb { fill: var(--paper-2); }
.k-fig .w-strip { fill: var(--input-soft); stroke: var(--input); stroke-width: 0.8; }
.k-fig .w-ref { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 5; fill: none; }
.k-fig .w-main { stroke: var(--ink); stroke-width: 2.4; fill: none; }
.k-fig .w-thin { stroke: var(--ink); stroke-width: 1.3; fill: none; }
.k-fig .w-dot { stroke: var(--ink-soft); stroke-width: 2.4; stroke-dasharray: 0.5 4.5; stroke-linecap: round; fill: none; }
.k-fig .w-dashdot { stroke: var(--ink-soft); stroke-width: 1.8; stroke-dasharray: 9 3 2 3; fill: none; }
.k-fig .w-win { stroke: var(--input); stroke-width: 2.2; fill: none; }
.k-fig .w-m-ink { fill: var(--ink); }
.k-fig .w-m-soft { fill: var(--ink-soft); }
.k-fig .w-m-hollow { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .w-m-soft-hollow { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .w-m-accent { fill: var(--accent); }
.k-fig .w-ghost { stroke: var(--ink-soft); stroke-width: 1.5; opacity: 0.4; fill: none; }
.k-fig .w-ghost-band { fill: var(--accent); }
.k-fig .w-ghost-path { stroke: var(--ink); stroke-width: 1.3; stroke-dasharray: 2 5; stroke-linecap: round; fill: none; }
.k-fig .w-sum { stroke: var(--accent); stroke-width: 3.5; }
.k-fig .w-hump { fill: var(--paper-2); stroke: var(--ink-soft); stroke-width: 1.4; }
.k-fig .w-left-out { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.4; }
.k-fig .w-lo-bg { fill: var(--accent-soft); }
.k-fig .w-lo-line { stroke: var(--ink); stroke-width: 1.4; }
.k-fig .w-ring-dot { fill: var(--paper); stroke: var(--ink); stroke-width: 2.2; }
.k-fig .w-cell { fill: var(--paper); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .w-cell-on { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.6; }
.k-fig .w-bar-accent { fill: var(--accent); }
.k-fig .w-bar { fill: var(--ink); }
.k-fig .w-bar-soft { fill: var(--ink-soft); }
.k-fig .w-out { stroke: var(--accent); stroke-width: 2.4; fill: none; }
.k-fig .w-arc { stroke: var(--ink-soft); stroke-width: 1.3; fill: none; }
`.replace(/\n/g, ' ').trim();

export default k => {
  const { g, line, path, rect, circle, text, plot, axes, stems, arrow, check, step, fmt, hz, range, masked } = k;
  const FS = 16000, M = '−', PI = Math.PI;
  const r2 = v => Math.round(v * 100) / 100;
  const hI = m => (m === 0 ? 0.5 : Math.sin(PI * m / 2) / (PI * m));
  const weight = { rect: () => 1, hamming: (m, N) => 0.54 + 0.46 * Math.cos(2 * PI * m / (N - 1)), hann: (m, N) => 0.5 + 0.5 * Math.cos(2 * PI * m / (N - 1)) };
  const resp = (kind, N) => {
    const half = (N - 1) / 2, c = range(0, half).map(m => hI(m) * weight[kind](m, N));
    return f => { const t = 2 * PI * f / FS; let s = c[0]; for (let m = 1; m <= half; m++) s += 2 * c[m] * Math.cos(t * m); return s; };
  };
  const winResp = (kind, N) => {
    const half = (N - 1) / 2, w = range(0, half).map(m => weight[kind](m, N)), w0 = w[0] + 2 * w.slice(1).reduce((a, b) => a + b, 0);
    return f => { const t = 2 * PI * f / FS; let s = w[0]; for (let m = 1; m <= half; m++) s += 2 * w[m] * Math.cos(t * m); return s / w0; };
  };
  const ideal = f => (f < 4000 ? 1 : f > 4000 ? 0 : 0.5);
  const poly = (P, fn, from, to, n, o = {}) => {
    const d = range(0, n).map(i => { const x = from + (to - from) * i / n; return `${i ? 'L' : 'M'}${r2(P.X(x))} ${r2(P.Y(Math.max(P.ys[0], Math.min(P.ys[1], fn(x)))))}`; }).join('');
    return path(d, { cls: 'w-main', ...o });
  };
  const stepPath = (P, o = {}) => path(`M${P.X(P.xs[0])} ${P.Y(1)}H${P.X(4000)}V${P.Y(0)}H${P.X(P.xs[1])}`, { cls: 'w-ref', ...o });
  const vec = (x1, y1, x2, y2, cls = 'k-vec') => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 11, W = 5, bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
    const p = [[x2, y2], [bx + W * Math.sin(a), by - W * Math.cos(a)], [bx - W * Math.sin(a), by + W * Math.cos(a)]].map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
    return g({}, line(x1, y1, bx, by, { cls }), `<polygon class="k-head" points="${p}"/>`);
  };
  const marker = (shape, x, y, cls = 'w-m-ink', s = 5) => {
    if (shape === 'circle') return circle(x, y, s, { cls });
    if (shape === 'square') return rect(x - s, y - s, 2 * s, 2 * s, { cls });
    if (shape === 'triangle') return path(`M${r2(x)} ${r2(y - s * 1.2)}L${r2(x + s * 1.1)} ${r2(y + s * 0.8)}L${r2(x - s * 1.1)} ${r2(y + s * 0.8)}Z`, { cls });
    return path(`M${r2(x)} ${r2(y - s * 1.3)}L${r2(x + s)} ${r2(y)}L${r2(x)} ${r2(y + s * 1.3)}L${r2(x - s)} ${r2(y)}Z`, { cls });
  };
  const key = (x, y, items, o = {}) => {
    const { dx = 230, dy = 22, cols = items.length } = o;
    return g({}, items.map(([cls, shape, mcls, label], i) => {
      const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
      return g({}, line(lx, ly - 4, lx + 30, ly - 4, { cls }), shape ? marker(shape, lx + 15, ly - 4, mcls, 4.5) : '', text(lx + 38, ly, label, { anchor: 'start', cls: 'k-label' }));
    }));
  };
  const stripeDefs = slug => `<defs><pattern id="${slug}-stripe" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" class="w-stripe-bg"/><line x1="0" y1="0" x2="0" y2="7" class="w-stripe"/></pattern></defs>`;
  const hzTicks = (list, last = 'Hz') => list.map((f, i) => [f, i === list.length - 1 && last ? `${hz(f)} ${last}` : hz(f)]);
  const yTicks = list => list.map(v => [v, fmt(v, v % 1 ? (Math.abs(v * 10 % 1) > 1e-9 ? 2 : 1) : 0)]);

  const wheel16k = (L) => {
    const ph = L.phone, cx = ph ? 180 : 210, cy = ph ? 168 : 172, R = ph ? 104 : 118;
    const at = (d, r = R) => [cx + r * Math.cos(d * PI / 180), cy - r * Math.sin(d * PI / 180)];
    const wedge = (a0, a1, cls, fill) => { const [x0, y0] = at(a0), [x1, y1] = at(a1); return path(`M${cx} ${cy}L${r2(x0)} ${r2(y0)}A${R} ${R} 0 0 0 ${r2(x1)} ${r2(y1)}Z`, { cls, fill }); };
    const tones = [[0, '0 Hz'], [45, '2,000'], [90, '4,000 Hz'], [135, '6,000'], [180, '8,000 Hz']];
    const stops = [[0, 'n = 0, 4'], [90, '1'], [180, '2'], [270, '3']], rs = R * 0.7;
    const [dx, dy] = at(0, R * 0.7);
    const textX = ph ? 24 : 400;
    const lines = ph
      ? [['k-name', '360° × tone ÷ 16,000 per sample'], ['k-label', '4,000 Hz: 90° per sample'], ['k-label', '8,000 Hz, the wideband limit: 180°']]
      : [['k-name', '360° × tone ÷ 16,000 per sample'], ['k-label', '4,000 Hz turns 90°: a quarter turn'], ['k-label', '8,000 Hz, the wideband limit, turns 180°'], ['k-label', 'bottom half: the mirror arrows']];
    return [
      stripeDefs(L.slug),
      step(1, 'the wheel at 16,000 samples per second: pass quarter, remove quarter, mirror half',
        wedge(0, 90, 'w-pass'), wedge(90, 180, '', `url(#${L.slug}-stripe)`),
        path(`M${cx - R} ${cy}A${R} ${R} 0 0 0 ${cx + R} ${cy}Z`, { cls: 'w-mirror' }),
        line(cx - R, cy, cx + R, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }), circle(cx, cy, R * 0.7, { cls: 'w-ghost-path' }),
        masked(...at(45, R * 0.55), 'pass', { cls: 'k-name', size: 15 }),
        masked(...at(135, R * 0.55), 'remove', { cls: 'k-name', size: 15 }),
        text(cx, cy + R * 0.45, 'mirror arrows', { cls: 'k-label' }),
        tones.map(([d, s]) => { const [x, y] = at(d), [lx, ly] = at(d, R + 16); return g({}, circle(x, y, 4.5, { cls: 'k-stem-dot' }), text(d === 0 ? lx - 4 : d === 180 ? lx + 4 : lx, ly + (d === 90 ? -2 : 4), s, { anchor: d === 0 ? 'start' : d === 180 ? 'end' : d === 45 ? 'start' : d === 135 ? 'end' : 'middle', cls: 'k-num' })); }),
        stops.map(([d, s]) => { const [x, y] = at(d, rs), [lx, ly] = at(d, rs - 14); return g({}, circle(x, y, 3, { cls: 'k-stop' }), text(lx, d === 0 || d === 180 ? ly - 10 : d === 90 ? ly + 10 : ly - 2, s, { cls: 'k-tick', anchor: d === 0 ? 'end' : d === 180 ? 'start' : 'middle' })); }),
        lines.map(([cls, s], i) => text(textX, (ph ? 330 : 120) + i * 26, s, { anchor: 'start', cls }))),
      step(2, 'a 4,000 Hz dot steps a quarter turn, 90°, per sample, for four samples',
        g({ anim: { k: 'turn', r0: '360deg', steps: 5, d: 0.4, len: 4 }, style: `transform-origin:${cx}px ${cy}px` },
          line(cx, cy, dx, dy, { cls: 'k-spoke-line' }), circle(dx, dy, 7, { cls: 'k-dot' })),
        text(textX, ph ? 330 + 3 * 26 : 120 + 4 * 26, ph ? 'dotted ring: 4,000 Hz at samples n = 0 to 4' : 'dotted ring: 4,000 Hz, samples n = 0 to 4', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const cutoff = (L) => {
    const ph = L.phone, P = plot({ x: ph ? 48 : 70, y: 50, w: ph ? 268 : 600, h: 170, xs: [0, 8000], ys: [0, 1.12] });
    return [
      axes(P, { zero: false, yTicks: [[0, '0'], [0.5, '0.5'], [1, '1']], xTicks: hzTicks(ph ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]), yTitle: 'gain, from 0', xTitle: 'input tone, from 0 Hz' }),
      line(P.x0, P.Y(0.5), P.X(4000), P.Y(0.5), { cls: 'k-guide' }),
      path(`M${P.x0} ${P.Y(1)}H${P.X(4000)}V${P.Y(0)}H${P.x1}`, { cls: 'w-main' }),
      circle(P.X(4000), P.Y(0.5), 6, { cls: 'k-dot' }),
      text(P.X(4000) + 12, P.Y(0.5) + 5, ph ? 'cutoff, 4,000 Hz' : 'cutoff: 4,000 Hz, where the gain is half', { anchor: 'start', cls: 'k-num-accent' }),
      text(P.X(2000), P.Y(1) - 10, 'keep: gain 1', { cls: 'k-label' }),
      text(P.X(6000), P.Y(0) - 10, 'remove: gain 0', { cls: 'k-label' }),
    ];
  };

  const fir = (L) => {
    const ph = L.phone, co = [0.1, 0.3, 0.5, 0.3, 0.1];
    const A = ph ? plot({ x: 40, y: 50, w: 290, h: 64, xs: [-0.5, 8.5], ys: [0, 1.1] }) : plot({ x: 30, y: 80, w: 190, h: 90, xs: [-0.5, 8.5], ys: [0, 1.1] });
    const B = ph ? plot({ x: 40, y: 330, w: 290, h: 64, xs: [-0.5, 8.5], ys: [0, 0.6] }) : plot({ x: 506, y: 80, w: 190, h: 90, xs: [-0.5, 8.5], ys: [0, 0.6] });
    const bx = ph ? 70 : 262, by = ph ? 186 : 92, cw = ph ? 44 : 36, bw = cw * 5 + 20;
    const cells = co.map((v, i) => [bx + 10 + i * cw, by + 34]);
    const nTicks = [[0, 'n = 0'], [4, '4'], [8, '8']];
    return [
      text(A.x0, A.y0 - 22, 'in: a click, 1 then zeros', { anchor: 'start', cls: 'k-name' }),
      axes(A, { xTicks: nTicks }), stems(A, range(0, 8).map(n => [n, n ? 0 : 1]), { dot: 4 }),
      text(A.X(0) + 10, A.Y(1) + 4, '1', { anchor: 'start', cls: 'k-num' }),
      rect(bx, by, bw, 92, { cls: 'k-box', rx: 6 }),
      text(bx + bw / 2, by + 22, 'FIR filter: no feedback', { cls: 'k-name' }),
      cells.map(([x, y], i) => g({}, rect(x, y, cw - 4, 26, { cls: 'w-cell', rx: 3 }), text(x + (cw - 4) / 2, y + 17, fmt(co[i], 1), { cls: 'k-num' }), text(x + (cw - 4) / 2, y + 44, `h[${i}]`, { cls: 'k-tick' }))),
      ph ? g({}, arrow(L.slug, [[180, 146], [180, by - 6]]), arrow(L.slug, [[180, by + 98], [180, 290]]))
        : g({}, arrow(L.slug, [[A.x1 + 8, by + 46], [bx - 6, by + 46]]), arrow(L.slug, [[bx + bw + 6, by + 46], [B.x0 - 14, by + 46]])),
      text(B.x0, B.y0 - 22, 'out: the coefficient list', { anchor: 'start', cls: 'k-name' }),
      axes(B, { xTicks: nTicks }),
      step(1, 'the click meets each coefficient in turn, one per sample',
        co.map((_, i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.4 + i * 0.8, len: 0.8 } }, rect(cells[i][0], cells[i][1], cw - 4, 26, { cls: 'w-cell-on', rx: 3 }), text(cells[i][0] + (cw - 4) / 2, cells[i][1] + 17, fmt(co[i], 1), { cls: 'k-num' })))),
      step(2, 'out come 0.1, 0.3, 0.5, 0.3, 0.1, one number per sample',
        co.map((v, i) => g({ anim: { k: 'in', d: 0.6 + i * 0.8, len: 0.5 } }, stems(B, [[i, v]], { dot: 4, labels: () => (ph ? '' : fmt(v, 1)) })))),
      step(3, 'and then it stops: zeros forever',
        g({ anim: { k: 'in', d: 4.6, len: 0.6 } }, stems(B, range(5, 8).map(n => [n, 0]), { dot: 4 }),
          text(B.X(6.5), B.y1 + 44, 'and then it stops', { cls: 'k-note-accent' }))),
    ];
  };

  const idealFig = (L) => {
    const ph = L.phone;
    const P = ph ? plot({ x: 36, y: 64, w: 300, h: 170, xs: [-16, 16], ys: [-0.16, 0.56] }) : plot({ x: 60, y: 64, w: 400, h: 180, xs: [-16, 16], ys: [-0.16, 0.56] });
    const S = ph ? plot({ x: 60, y: 356, w: 250, h: 80, xs: [0, 8000], ys: [0, 1.1] }) : plot({ x: 540, y: 104, w: 150, h: 110, xs: [0, 8000], ys: [0, 1.1] });
    const lab = { 0: '0.5000', 1: '0.3183', [-3]: `${M}0.1061` };
    return [
      text(P.x0, 30, 'the ideal low-pass’s coefficients, h[n]', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0.5, '0.5'], [0, '0']], xTicks: [[-15, `${M}15`], [-5, `${M}5`], [0, 'n = 0'], [5, '5'], [15, '15']] }),
      stems(P, range(-15, 15).map(n => [n, hI(n)]), { dot: 3.5 }),
      Object.entries(lab).map(([n, s]) => text(P.X(Number(n)) + (Number(n) === -3 ? -8 : 0), hI(Number(n)) >= 0 ? P.Y(hI(Number(n))) - 10 : P.Y(hI(Number(n))) + 4, s, { cls: 'k-num', anchor: Number(n) === 1 ? 'start' : Number(n) === -3 ? 'end' : 'middle' })),
      arrow(L.slug, [[P.X(-12), P.y0 + (ph ? 102 : 62)], [P.x0, P.y0 + (ph ? 102 : 62)]]), arrow(L.slug, [[P.X(12), P.y0 + (ph ? 102 : 62)], [P.x1, P.y0 + (ph ? 102 : 62)]]),
      text(P.x0, P.y0 + (ph ? 90 : 50), 'continues forever', { anchor: 'start', cls: 'k-tick' }), text(P.x1, P.y0 + (ph ? 90 : 50), 'continues forever', { anchor: 'end', cls: 'k-tick' }),
      ph ? arrow(L.slug, [[180, 290], [180, 318]]) : arrow(L.slug, [[P.x1 + 14, 160], [S.x0 - 10, 160]]),
      text(S.x0, S.y0 - 14, 'its gain: the step', { anchor: 'start', cls: 'k-name' }),
      axes(S, { zero: false, yTicks: [[0, '0'], [1, '1']], xTicks: [[0, '0'], [4000, '4,000'], [8000, '8,000 Hz']] }),
      path(`M${S.x0} ${S.Y(1)}H${S.X(4000)}V${S.Y(0)}H${S.x1}`, { cls: 'w-main' }),
    ];
  };

  const truncation = (L) => {
    const ph = L.phone;
    const P = ph ? plot({ x: 30, y: 60, w: 310, h: 140, xs: [-24, 24], ys: [-0.15, 0.55] }) : plot({ x: 40, y: 70, w: 330, h: 180, xs: [-24, 24], ys: [-0.15, 0.55] });
    const S = ph ? plot({ x: 60, y: 310, w: 270, h: 160, xs: [-1, 32], ys: [0.4, 1.2] }) : plot({ x: 450, y: 70, w: 240, h: 180, xs: [-1, 32], ys: [0.4, 1.2] });
    const kept = [1, 3, 7, 11, 15, 19, 23, 27, 31];
    let tot = 0;
    const totals = kept.map(K => { const m = (K - 1) / 2; tot += m === 0 ? 0.5 : 2 * hI(m); return tot; });
    const label = { 0: '0.5000', 1: '1.1366', 2: '0.9244', 8: '0.9802' };
    const stair = i => g({},
      line(S.X(kept[i]), S.Y(totals[i]), S.X(i < 8 ? kept[i + 1] : 32), S.Y(totals[i]), { cls: 'w-main' }),
      i ? line(S.X(kept[i]), S.Y(totals[i - 1]), S.X(kept[i]), S.Y(totals[i]), { cls: 'w-thin' }) : '',
      circle(S.X(kept[i]), S.Y(totals[i]), 3.5, { cls: 'w-m-ink' }),
      label[i] ? text(i === 0 ? S.X(3) + 8 : S.X(kept[i]) + (i === 8 ? -4 : 6), S.Y(totals[i]) + (i === 0 ? 4 : totals[i] > 1 ? -8 : 16), label[i], { anchor: i === 8 ? 'end' : 'start', cls: 'k-num' }) : '');
    const pairStems = m => stems(P, m === 0 ? [[0, 0.5]] : [[-m, hI(m)], [m, hI(m)]], { dot: 3 });
    const at = i => ({ k: 'in', d: 0.3 + i * 0.75, len: 0.5 });
    return [
      text(P.x0, 30, ph ? 'kept: n from −15 to 15' : 'kept: n from −15 to 15; dropped: faded', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0.5, '0.5'], [0, '0']], xTicks: [[-23, `${M}23`], [-15, `${M}15`], [0, 'n = 0'], [15, '15'], [23, '23']] }),
      g({ cls: 'k-faint' }, stems(P, range(16, 23).flatMap(m => [[-m, hI(m)], [m, hI(m)]]), { cls: 'k-stem-soft', dot: 3 })),
      line(P.X(-15.5), P.y0, P.X(-15.5), P.y1, { cls: 'k-grid' }), line(P.X(15.5), P.y0, P.X(15.5), P.y1, { cls: 'k-grid' }),
      text(ph ? 20 : S.x0, ph ? S.y0 - 30 : 30, 'running total = gain at 0 Hz', { anchor: 'start', cls: 'k-name' }),
      axes(S, { zero: false, yTicks: [[0.4, '0.4'], [1, '1']], xTicks: [[1, '1'], [15, '15'], [31, '31']], xTitle: 'coefficients kept' }),
      line(S.x0, S.Y(1), S.x1, S.Y(1), { cls: 'w-ref' }), text(S.x1, S.Y(0.62), 'dashed: the ideal,', { anchor: 'end', cls: 'k-tick' }), text(S.x1, S.Y(0.62) + 16, 'exactly 1', { anchor: 'end', cls: 'k-tick' }),
      step(1, 'the middle coefficient alone: 0.5000; then the first pair: 1.1366',
        g({ anim: at(0) }, pairStems(0), stair(0)), g({ anim: at(1) }, pairStems(1), stair(1))),
      range(2, 8).map(i => step(i, `pair ±${2 * i - 1} brings the total to ${fmt(totals[i], 4)}`, g({ anim: at(i) }, pairStems(2 * i - 1), stair(i)))),
    ];
  };

  const pairCosine = (L) => {
    const ph = L.phone, ox = ph ? 70 : 90, oy = ph ? 160 : 170, R = ph ? 110 : 120, th = 30;
    const tip = d => [ox + R * Math.cos(d * PI / 180), oy - R * Math.sin(d * PI / 180)];
    const [ax, ay] = tip(th), [bx, by] = tip(-th), sumX = ox + 2 * R * Math.cos(th * PI / 180);
    const arc = (d0, d1, r) => { const a = [ox + r * Math.cos(d0 * PI / 180), oy - r * Math.sin(d0 * PI / 180)], b = [ox + r * Math.cos(d1 * PI / 180), oy - r * Math.sin(d1 * PI / 180)]; return path(`M${r2(a[0])} ${r2(a[1])}A${r} ${r} 0 0 ${d1 > d0 ? 0 : 1} ${r2(b[0])} ${r2(b[1])}`, { cls: 'w-arc', 'marker-end': `url(#${L.slug}-arrow)` }); };
    const ix = ph ? 180 : 560, iy = ph ? 450 : 170, iR = ph ? 52 : 70;
    return [
      line(ox - 20, oy, ox + 2 * R + 26, oy, { cls: 'k-axis' }),
      step(1, 'the two arrows turn opposite ways, 30° each',
        g({ anim: { k: 'turn', r0: `${th}deg`, steps: 16, d: 0.3, len: 2.4 }, style: `transform-origin:${ox}px ${oy}px` }, vec(ox, oy, ax, ay)),
        g({ anim: { k: 'turn', r0: `${-th}deg`, steps: 16, d: 0.3, len: 2.4 }, style: `transform-origin:${ox}px ${oy}px` }, vec(ox, oy, bx, by))),
      arc(4, th - 4, R * 0.42), arc(-4, -th + 4, R * 0.42),
      text(ox + R * 0.5, oy - R * 0.1 - 6, '30°', { anchor: 'start', cls: 'k-num' }),
      text(ax + 6, ay - 8, ph ? 'h[−m]: forward m' : 'h[−m]: turned forward m steps', { anchor: 'start', cls: 'k-label' }),
      text(bx + 6, by + 18, ph ? 'h[m]: back m' : 'h[m]: turned back m steps', { anchor: 'start', cls: 'k-label' }),
      line(ax, ay, ax, oy, { cls: 'k-guide' }), line(bx, by, bx, oy, { cls: 'k-guide' }),
      text(ax + 8, oy - 24, ph ? 'up and down cancel' : 'up-and-down parts cancel', { anchor: 'start', cls: 'k-tick' }),
      step(2, 'their sum lies flat, 2 h[m] cos(m × turn) long',
        g({ anim: { k: 'scale', sx: 1 / Math.cos(th * PI / 180), d: 0.3, len: 2.4 }, style: `transform-origin:${ox}px ${oy}px` }, line(ox, oy + 1, sumX, oy + 1, { cls: 'w-sum' })),
        g({}, circle(sumX, oy, 5, { cls: 'k-dot' }), text(ph ? 20 : 30, oy + R * 0.5 + (ph ? 64 : 70), ph ? 'flat sum: 2 h[m] cos(m × turn)' : 'their sum, flat: 2 h[m] cos(m × turn)', { anchor: 'start', cls: 'k-num-accent' }))),
      g({},
        ph ? line(20, 340, 340, 340, { cls: 'k-grid' }) : line(410, 40, 410, 300, { cls: 'k-grid' }),
        line(ix - iR - 10, iy, ix + iR + 10, iy, { cls: 'k-axis' }),
        vec(ix, iy, ix, iy - iR), vec(ix, iy, ix, iy + iR),
        circle(ix, iy, 5, { cls: 'k-dot' }),
        text(ix + 10, iy - 8, 'sum: 0', { anchor: 'start', cls: 'k-num-accent' }),
        text(ix, ph ? 372 : 66, 'at 90°: 4,000 Hz, odd m', { cls: 'k-name' }),
        text(ix, iy + iR + 28, ph ? 'straight up and down' : 'the arrows point up and down', { cls: 'k-label' })),
    ];
  };

  const pairBars = (L) => {
    const ph = L.phone, turn = 2 * PI * 4500 / FS;
    const parts = [0.5, ...range(1, 15, 2).map(m => 2 * hI(m) * Math.cos(m * turn))];
    const total = parts.reduce((a, b) => a + b, 0);
    if (ph) {
      const zx = 150, sc = 300, top = 70, rh = 24, names = ['h[0]', ...range(1, 15, 2).map(m => `m = ${m}`), 'sum'];
      const I = plot({ x: 40, y: 420, w: 280, h: 60, xs: [0, 2], ys: [-1.1, 1.1] });
      return [
        text(20, 30, '4,500 Hz: each pair’s part', { anchor: 'start', cls: 'k-name' }),
        line(zx, top - 14, zx, top + 10 * rh, { cls: 'k-axis' }), text(zx, top - 20, '0', { cls: 'k-tick' }),
        [...parts, total].map((v, i) => {
          const y = top + i * rh + (i === 10 ? 6 : 0), x1 = zx + v * sc;
          return g({}, text(20, y + 14, names[i], { anchor: 'start', cls: 'k-tick' }),
            rect(Math.min(zx, x1), y + 3, Math.abs(x1 - zx), 14, { cls: i === 10 ? 'w-bar-accent' : i === 0 ? 'w-bar' : 'w-bar-soft' }),
            text(340, y + 14, fmt(v, 3), { anchor: 'end', cls: i === 10 ? 'k-num-accent' : 'k-num' }));
        }),
        line(20, top + 10 * rh + 2, 340, top + 10 * rh + 2, { cls: 'k-grid' }),
        text(20, top + 11 * rh + 30, 'every pair pulls down', { anchor: 'start', cls: 'k-note' }),
        text(I.x0, I.y0 - 16, 'a gain of −0.09: 9%, upside down', { anchor: 'start', cls: 'k-name' }),
        axes(I, { xTicks: [] }),
        k.curve(I, x => Math.sin(PI * 2 * x), { cls: 'w-ref' }),
        k.curve(I, x => -0.3 * Math.sin(PI * 2 * x), { cls: 'w-out' }),
        key(I.x0, I.y1 + 30, [['w-ref', null, null, 'tone in'], ['w-out', null, null, 'out, × (−0.09)']], { cols: 2, dx: 140 }),
        text(I.x0, I.y1 + 52, 'size not to scale', { anchor: 'start', cls: 'k-tick' }),
      ];
    }
    const P = ph ? plot({ x: 40, y: 60, w: 310, h: 250, xs: [-0.6, 9.6], ys: [-0.17, 0.56] }) : plot({ x: 70, y: 60, w: 470, h: 220, xs: [-0.6, 9.6], ys: [-0.17, 0.56] });
    const bw = ph ? 18 : 26;
    const names = ['h[0]', ...range(1, 15, 2).map(m => (m === 1 ? 'm = 1' : String(m))), 'sum'];
    const bar = (i, v, cls) => {
      const x = P.X(i), y0 = P.Y(0), y1 = P.Y(v);
      return g({}, rect(x - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0), { cls }),
        text(x, v >= 0 ? y1 - 8 : y1 + 16 + (ph && i % 2 === 0 && i > 0 && i < 9 ? 14 : 0), fmt(v, 3), { cls: i === 9 ? 'k-num-accent' : 'k-num', style: ph ? 'font-size:9px' : 'font-size:10.5px', anchor: 'middle' }));
    };
    const ix = ph ? 40 : 580, iy = ph ? 410 : 140, iw = ph ? 280 : 120;
    const I = plot({ x: ix, y: iy, w: iw, h: 60, xs: [0, 2], ys: [-1.1, 1.1] });
    return [
      text(P.x0, 30, ph ? '4,500 Hz: each pair’s part' : '4,500 Hz, a turn of 101.25° per sample: each pair’s part', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0.5, '0.5'], [0, '0']], xTicks: [] }),
      parts.map((v, i) => bar(i, v, i === 0 ? 'w-bar' : 'w-bar-soft')),
      line(P.X(8.5), P.y0 + 30, P.X(8.5), P.Y(0) - 6, { cls: 'k-grid' }),
      bar(9, total, 'w-bar-accent'),
      names.map((s, i) => text(P.X(i), P.y1 + 18, s, { cls: 'k-tick', style: ph ? 'font-size:9.5px' : undefined })),
      text(P.X(4.5), P.Y(0.36), ph ? 'every pair pulls down' : 'every pair pulls down', { cls: 'k-note' }),
      text(I.x0, I.y0 - 26, ph ? 'a gain of −0.09: 9%, upside down' : '−0.09 is 9%,', { anchor: 'start', cls: 'k-name' }),
      ph ? '' : text(I.x0, I.y0 - 8, 'upside down', { anchor: 'start', cls: 'k-name' }),
      axes(I, { xTicks: [] }),
      k.curve(I, x => Math.sin(PI * 2 * x), { cls: 'w-ref' }),
      k.curve(I, x => -0.3 * Math.sin(PI * 2 * x), { cls: 'w-out' }),
      key(I.x0, I.y1 + 30, [['w-ref', null, null, 'tone in'], ['w-out', null, null, 'out, × (−0.09)']], { cols: ph ? 2 : 1, dx: 140, dy: 20 }),
      text(I.x0, I.y1 + (ph ? 52 : 72), 'size not to scale', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const sweepGhost = (L) => {
    const ph = L.phone, H31 = resp('rect', 31), x0 = ph ? 56 : 90, w = ph ? 290 : 590;
    const T = plot({ x: x0, y: 50, w, h: ph ? 110 : 120, xs: [0, 10], ys: [4000, 8000] });
    const B = plot({ x: x0, y: ph ? 236 : 240, w, h: ph ? 200 : 140, xs: [0, 10], ys: [0, 4000] });
    const fin = t => 4000 + 400 * t;
    const half = t => Math.max(0, Math.min(16, 90 * Math.abs(H31(fin(t)))) - 0.6);
    const n = 600, ts = range(0, n).map(i => 10 * i / n);
    const up = ts.map(t => [B.X(t), B.Y(8000 - fin(t)) - half(t)]), dn = ts.map(t => [B.X(t), B.Y(8000 - fin(t)) + half(t)]).reverse();
    const d = [...up, ...dn].map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join('') + 'Z';
        const tTicks = ph ? [[0, '0'], [5, '5'], [10, '10 s']] : [[0, '0'], [2.5, '2.5'], [5, '5'], [7.5, '7.5'], [10, '10 s']];
    return [
      text(T.x0, 30, ph ? 'the sweep (Hz), 16,000 samples/s' : 'the sweep on the wideband side, 16,000 samples per second', { anchor: 'start', cls: 'k-name' }),
      axes(T, { zero: false, yTicks: [[4000, '4,000'], [8000, ph ? '8,000' : '8,000 Hz']], xTicks: tTicks }),
      path(`M${T.X(0)} ${T.Y(4000)}L${T.X(10)} ${T.Y(8000)}`, { cls: 'w-main' }),
      text(B.x0, B.y0 - 20, ph ? 'the ghost (Hz), 8,000 samples/s' : 'the ghost on your side, 8,000 samples per second: thicker is louder', { anchor: 'start', cls: 'k-name' }),
      rect(B.x0, B.Y(3400), B.w, B.Y(0) - B.Y(3400), { cls: 'w-mirror' }),
      text(B.x0 + 6, B.y1 - 8, 'where voices live', { anchor: 'start', cls: 'k-label' }),
      axes(B, { zero: false, yTicks: [[0, ph ? '0' : '0 Hz'], [3400, '3,400'], [4000, '4,000']], xTicks: tTicks }),
      line(B.X(0), B.Y(4000), B.X(10), B.Y(0), { cls: 'w-ghost-path' }),
      path(d, { cls: 'w-ghost-band' }),
      [0, 1.25, 2.5, 7.5].map(t => circle(B.X(t), B.Y(8000 - fin(t)), 5, { cls: 'w-ring-dot' })),
      ['ghost loudness, dots:', '50% at the start,', 'gone by 0.75 s;', '9% at 3,500 Hz,', '5% at 3,000 Hz,', '2% at 1,000 Hz'].map((s, i) => text(B.x1 - 4, B.y0 + 16 + i * 16, s, { anchor: 'end', cls: i ? 'k-num-accent' : 'k-tick', style: ph ? 'font-size:10.5px' : undefined })),
      text(B.x0, B.y1 + 44, ph ? 'gaps: the gain crosses 0, every 500 Hz or so' : 'gaps: the gain crosses 0 (inputs 4,306, 4,778, 5,267 Hz, and on every 500 Hz or so)', { anchor: 'start', cls: 'k-tick' }),
      ph ? text(B.x0, B.y1 + 62, 'dotted: where the ghost would sit', { anchor: 'start', cls: 'k-tick' }) : text(B.x0, B.y1 + 62, 'dotted: where the ghost would sit if it were loud all the way', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const gibbs = (L) => {
    const ph = L.phone, P = ph ? plot({ x: 44, y: 50, w: 274, h: 220, xs: [2600, 5000], ys: [-0.15, 1.2] }) : plot({ x: 60, y: 50, w: 420, h: 220, xs: [2600, 5000], ys: [-0.15, 1.2] });
    const series = [[15, 3000, 'w-thin', 'square', 'w-m-ink'], [63, 3750, 'w-dashdot', 'circle', 'w-m-soft'], [255, 3937.5, 'w-main', 'triangle', 'w-m-ink']];
    const items = series.map(([N, f, cls, shape, mc]) => [cls, shape, mc, `${N} coefficients, peak at ${hz(f)} Hz`]);
    return [
      text(P.x0, 30, 'plain cuts near the cutoff', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0, '0'], [0.5, '0.5'], [1, '1']], xTicks: hzTicks(ph ? [3000, 4000, 5000] : [3000, 3500, 4000, 4500, 5000]) }),
      text(P.x0 - 8, P.y0 - 10, 'gain', { anchor: 'end', cls: 'k-tick' }),
      stepPath(P),
      line(P.x0, P.Y(1.09), P.x1, P.Y(1.09), { cls: 'k-guide' }),
      text(P.x0 + 4, P.Y(1.09) - 8, '1.09', { anchor: 'start', cls: 'k-num' }),
      series.map(([N, f, cls, shape, mc], i) => step(i + 1, `${N} coefficients: the bump peaks at 1.09 at ${hz(f)} Hz`,
        g({ anim: { k: 'in', d: 0.3 + i * 1.1, len: 0.8 } }, poly(P, resp('rect', N), P.xs[0], P.xs[1], N > 100 ? 1200 : 400, { cls }), marker(shape, P.X(f), P.Y(1.09), mc)))),
      ph ? key(20, 330, [...items, ['w-ref', null, null, 'dashed: the ideal step']], { cols: 1, dy: 22 })
        : key(500, 90, [...items.map(([a, b, c, s]) => [a, b, c, s.replace(' coefficients, peak at', ':')]), ['w-ref', null, null, 'the ideal step']], { cols: 1, dy: 28 }),
      ph ? '' : text(500, 70, 'coefficients, and peak tone', { anchor: 'start', cls: 'k-tick' }),
      text(ph ? 20 : 500, ph ? 314 : 220, ph ? 'every peak touches 1.09' : 'every peak touches 1.09', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const decibels = (L) => {
    const ph = L.phone, x0 = ph ? 40 : 80, x1 = ph ? 320 : 640, y = ph ? 150 : 140;
    const X = db => x0 + (0 - db) / 60 * (x1 - x0);
    const rungs = [[0, '100%'], [-20, '10%'], [-40, '1%'], [-60, '0.1%']];
    return [
      text(x0, 34, ph ? 'gain as percent and as dB' : 'every factor of ten is a step of 20 dB', { anchor: 'start', cls: 'k-name' }),
      line(x0, y, x1, y, { cls: 'k-axis' }),
      rungs.map(([d, p]) => g({}, line(X(d), y - 8, X(d), y + 8, { cls: 'k-axis' }), text(X(d), y - 18, p, { cls: 'k-num' }), text(X(d), y + 26, `${d ? M + Math.abs(d) : 0} dB`, { cls: 'k-num' }))),
      text(x0 - 10, y - 18, ph ? '' : '', { anchor: 'end', cls: 'k-tick' }),
      circle(X(-20.9), y, 6, { cls: 'k-dot' }),
      line(X(-20.9), y + 36, X(-20.9), y + 70, { cls: 'k-grid' }),
      text(X(-20.9) - 4, y + 86, ph ? 'plain cut leak: 9%, −21 dB' : 'the plain cut’s leak: 9%, about −21 dB', { anchor: 'start', cls: 'k-num-accent' }),
      marker('square', X(-40), y, 'w-m-hollow', 5.5),
      line(X(-40), y - 34, X(-40), y - 62, { cls: 'k-grid' }),
      text(X(-40), y - 70, ph ? 'target: 1%, −40 dB' : 'the target: 1%, −40 dB', { anchor: ph ? 'end' : 'middle', cls: 'k-num' }),
      text(x0, ph ? y + 120 : y + 116, 'dB = 20 × log10 of the gain', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const wiggles = (L) => {
    const ph = L.phone, x0 = ph ? 44 : 210, w = ph ? 274 : 480, hh = ph ? 58 : 62, gap = ph ? 96 : 86;
    const tf = f => PI * f / 8000;
    const rows = [[1, 2 * hI(1)], [3, 2 * hI(3)], [5, 2 * hI(5)]];
    const out = [text(20, 28, ph ? 'three wiggles, 0 to 8,000 Hz' : 'three odd wiggles over the tones, then their sum', { anchor: 'start', cls: 'k-name' })];
    rows.forEach(([m, a], i) => {
      const P = plot({ x: x0, y: 50 + i * gap, w, h: hh, xs: [0, 8000], ys: [-0.7, 0.7] });
      out.push(axes(P, { xTicks: [] }), k.curve(P, f => a * Math.cos(m * tf(f)), { cls: 'w-main', n: 300 }),
        ph ? text(20, P.y0 - 4, `2 h[${m}] cos(${m === 1 ? '' : m + ' × '}turn): ${fmt(a, 3)}, ${m} half-swing${m > 1 ? 's' : ''}`, { anchor: 'start', cls: 'k-tick' })
          : g({}, text(20, P.Y(0) - 4, `2 h[${m}] cos(${m === 1 ? '' : m + ' × '}turn)`, { anchor: 'start', cls: 'k-label' }), text(20, P.Y(0) + 14, `${fmt(a, 3)}, ${m} half-swing${m > 1 ? 's' : ''}`, { anchor: 'start', cls: 'k-tick' })));
    });
    const S = plot({ x: x0, y: 50 + 3 * gap + (ph ? 30 : 20), w, h: ph ? 110 : 110, xs: [0, 8000], ys: [-0.2, 1.25] });
    const sum = f => 0.5 + rows.reduce((s, [m, a]) => s + a * Math.cos(m * tf(f)), 0);
    out.push(line(16, S.y0 - 22, L.W - 16, S.y0 - 22, { cls: 'k-grid' }),
      axes(S, { yTicks: [[0, '0'], [1, '1']], xTicks: hzTicks(ph ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]) }),
      stepPath(S), k.curve(S, sum, { cls: 'w-main', n: 300 }),
      text(20, ph ? S.y0 - 12 : S.Y(0.75), ph ? 'h[0] + all three; dashed: the step' : 'h[0] + all three', { anchor: 'start', cls: ph ? 'k-tick' : 'k-label' }),
      ph ? '' : text(20, S.Y(0.75) + 16, 'dashed: the step', { anchor: 'start', cls: 'k-tick' }));
    return out;
  };

  const average = (L) => {
    const ph = L.phone, tf = f => PI * f / 8000;
    const panel = (x, y, fn, title, avgLabel, avgVal, d) => {
      const P = plot({ x, y, w: ph ? 280 : 280, h: 150, xs: [0, 8000], ys: [-1.1, 1.1] });
      const n = 400, pts = []; let s = 0;
      for (let i = 0; i <= n; i++) { const f = 8000 * i / n; s += fn(f); pts.push([f, s / (i + 1)]); }
      const dpath = pts.map(([f, v], i) => `${i ? 'L' : 'M'}${r2(P.X(f))} ${r2(P.Y(v))}`).join('');
      return g({},
        text(P.x0, y - 18, title, { anchor: 'start', cls: 'k-name' }),
        axes(P, { yTicks: [[1, '1'], [0, '0'], [-1, `${M}1`]], xTicks: hzTicks([0, 4000, 8000]) }),
        k.curve(P, fn, { cls: 'w-thin', n: 400 }),
        line(P.x0, P.Y(avgVal), P.x1, P.Y(avgVal), { cls: 'k-guide' }),
        step(d + 1, `the running average of ${title} settles on ${avgLabel}`,
          path(dpath, { cls: 'w-main', style: 'stroke:var(--accent);stroke-width:3', pathLength: 1, anim: { k: 'draw', d: 0.3 + d * 2.6, len: 2.2 } })),
        text(P.x0, P.y1 + 40, `thick line: running average → ${avgLabel}`, { anchor: 'start', cls: 'k-num-accent' }));
    };
    return [
      panel(ph ? 50 : 50, 54, f => Math.cos(tf(f)) * Math.cos(3 * tf(f)), 'cos(turn) × cos(3 × turn)', '0', 0, 0),
      panel(ph ? 50 : 410, ph ? 300 : 54, f => Math.cos(3 * tf(f)) ** 2, 'cos(3 × turn) × itself', 'one half', 0.5, 1),
      text(ph ? 20 : 50, L.H - 12, ph ? 'thin: the product; dashed: the value it settles on' : 'thin: the product at each tone; dashed: the value the average settles on', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const gibbsBuild = (L) => {
    const ph = L.phone, P = ph ? plot({ x: 44, y: 50, w: 274, h: 220, xs: [0, 6000], ys: [-0.2, 1.22] }) : plot({ x: 60, y: 50, w: 440, h: 230, xs: [0, 6000], ys: [-0.2, 1.22] });
    const series = [[3, 0, 1.1366, 'w-dashdot', 'diamond', 'w-m-soft'], [7, 2000, 1.1002, 'w-dot', 'circle', 'w-m-soft-hollow'], [15, 3000, 1.0921, 'w-thin', 'square', 'w-m-ink'], [31, 3500, 1.0901, 'w-main', 'triangle', 'w-m-ink']];
    return [
      text(P.x0, 30, 'adding pairs, 3 to 31 coefficients', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0, '0'], [0.5, '0.5'], [1, '1']], xTicks: hzTicks(ph ? [0, 3000, 6000] : [0, 2000, 4000, 6000]) }),
      text(P.x0 - 8, P.y0 - 10, 'gain', { anchor: 'end', cls: 'k-tick' }),
      stepPath(P),
      line(P.x0, P.Y(1.09), P.x1, P.Y(1.09), { cls: 'k-guide' }),
      series.map(([N, f, pk, cls, shape, mc], i) => step(i + 1, `${N} coefficients: peak ${fmt(pk, 3)} at ${hz(f)} Hz`,
        g({ anim: { k: 'in', d: 0.3 + i * 1.1, len: 0.8 } }, poly(P, resp('rect', N), 0, 6000, 400, { cls }), marker(shape, P.X(f) + (f === 0 ? 6 : 0), P.Y(pk), mc)))),
      ph ? key(20, 334, series.map(([N, f, pk, cls, shape, mc]) => [cls, shape, mc, `${N}: peak ${fmt(pk, 3)} at ${hz(f)} Hz`]), { cols: 1, dy: 22 })
        : key(524, 90, series.map(([N, f, pk, cls, shape, mc]) => [cls, shape, mc, `${N}: ${fmt(pk, 3)}, ${hz(f)} Hz`]), { cols: 1, dy: 28 }),
      ph ? '' : text(524, 70, 'coefficients: peak, at tone', { anchor: 'start', cls: 'k-tick' }),
      text(ph ? 20 : 524, ph ? 318 : 222, ph ? 'the bump narrows, never below 1.09' : 'narrower each time,', { anchor: 'start', cls: 'k-note' }),
      ph ? '' : text(524, 244, 'never below 1.09', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const windowFig = (L) => {
    const ph = L.phone, x0 = ph ? 30 : 190, w = ph ? 310 : 500, rh = ph ? 100 : 86, gap = ph ? 160 : 112;
    const xs = [-23, 23];
    const rows = [
      ['ideal list, h[n]', 'k-stem', n => hI(n), [-0.15, 0.55], range(-22, 22)],
      ['× rectangle, w[n]', 'k-stem-input', n => (Math.abs(n) <= 15 ? 1 : 0), [0, 1.1], range(-22, 22)],
      ['= kept: h[n] × w[n]', 'k-stem', n => (Math.abs(n) <= 15 ? hI(n) : 0), [-0.15, 0.55], range(-22, 22)],
    ];
    return rows.map(([label, cls, fn, ys, ns], i) => {
      const y = (ph ? 46 : 40) + i * gap, P = plot({ x: x0, y, w, h: rh, xs, ys });
      return g({},
        text(20, ph ? y - 12 : P.Y(ys[1] / 2) + 4, label, { anchor: 'start', cls: 'k-name' }),
        axes(P, { xTicks: i === 2 || (ph && i === 1) ? [[-22, `${M}22`], [-15, `${M}15`], [0, 'n = 0'], [15, '15'], [22, '22']] : [], yTicks: [] }),
        stems(P, ns.map(n => [n, fn(n)]), { cls, dot: ph ? 2.6 : 3 }),
        i === 0 ? g({}, arrow(L.slug, [[P.X(-19), P.y0 + 18], [P.x0, P.y0 + 18]]), arrow(L.slug, [[P.X(19), P.y0 + 18], [P.x1, P.y0 + 18]]), text(P.x1, P.y0 + 6, 'continues', { anchor: 'end', cls: 'k-tick' }), text(P.x0, P.y0 + 6, 'continues', { anchor: 'start', cls: 'k-tick' })) : '',
        i === 1 ? text(P.X(19), P.Y(0) - 12, '0', { cls: 'k-num-input' }) : '',
        i === 1 ? text(P.X(0), P.Y(1) - 10, '1 from −15 to 15', { cls: 'k-num-input' }) : '',
'');
    });
  };

  const rectResponse = (L) => {
    const ph = L.phone;
    const panel = (x, y, kind, N, title, notes) => {
      const P = plot({ x, y, w: ph ? 290 : 280, h: 170, xs: [-2000, 2000], ys: [-0.3, 1.08] });
      return g({},
        text(P.x0, y - 20, title, { anchor: 'start', cls: 'k-name' }),
        axes(P, { yTicks: [[1, '1'], [0, '0']], xTicks: [[-2000, `${M}2,000`], [0, '0'], [2000, '2,000']] }),
        poly(P, winResp(kind, N), -2000, 2000, 500),
        notes(P));
    };
    const fr = winResp('rect', 31);
    return [
      panel(ph ? 50 : 60, 50, 'rect', 31, 'rectangle, 31 long', P => g({},
        text(P.X(0) + 10, P.Y(1) + 4, 'central hump', { anchor: 'start', cls: 'k-label' }),
        circle(P.X(738), P.Y(fr(738)), 4.5, { cls: 'k-dot' }), circle(P.X(-738), P.Y(fr(-738)), 4.5, { cls: 'k-dot' }),
        text(P.X(738) + 8, P.Y(fr(738)) + 20, `${M}22%`, { anchor: 'start', cls: 'k-num-accent' }),
        text(P.X(1250), P.Y(0.24), 'side lobes', { cls: 'k-label' }))),
      panel(ph ? 50 : 420, ph ? 316 : 50, 'hamming', 31, 'Hamming, also 31 long, same scale', P => g({},
        text(P.X(700), P.Y(1) + 4, 'wider hump', { anchor: 'start', cls: 'k-label' }),
        text(P.X(1300), P.Y(0.36), 'side lobes:', { cls: 'k-label' }), text(P.X(1300), P.Y(0.36) + 16, 'under 1%', { cls: 'k-label' }))),
      text(ph ? 20 : 60, L.H - 14, ph ? 'across: distance from the hump’s center' : 'across: distance from the hump’s center, in Hz; up: the hump’s height, 1 at its center', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const smear = (L) => {
    const ph = L.phone, xs = [1600, 6000];
    const panel = (y, kind, N, center, title, leftLabel, d) => {
      const P = plot({ x: ph ? 44 : 60, y, w: ph ? 274 : 470, h: ph ? 150 : 140, xs, ys: [-0.42, 1.2] });
      const Wr = winResp(kind, N), H = resp(kind, N), hs = 0.75, span = 2600, back = 3000;
      const humpPts = range(0, 560).map(i => { const u = -back + (back + span) * i / 560; return [center + u, hs * Wr(u)]; });
      const humpD = `M${r2(P.X(center - back))} ${r2(P.Y(0))}` + humpPts.map(([f, v]) => `L${r2(P.X(f))} ${r2(P.Y(v))}`).join('') + `L${r2(P.X(center + span))} ${r2(P.Y(0))}Z`;
      const out = humpPts.filter(([f]) => f >= 4000 && f <= xs[1]);
      const outD = `M${r2(P.X(4000))} ${r2(P.Y(0))}` + out.map(([f, v]) => `L${r2(P.X(f))} ${r2(P.Y(v))}`).join('') + `L${r2(P.X(Math.min(center + span, xs[1])))} ${r2(P.Y(0))}Z`;
      const start = center - 1400, dx = P.X(start) - P.X(center), lin = 'animation-timing-function:linear';
      const seg = (a, b) => range(0, 200).map(i => { const f = a + (b - a) * i / 200; return `${i ? 'L' : 'M'}${r2(P.X(f))} ${r2(P.Y(H(f)))}`; }).join('');
      const clip = `${L.slug}-clip-${d}`;
      return g({},
        text(P.x0, y - 16, title, { anchor: 'start', cls: 'k-name' }),
        axes(P, { yTicks: [[0, '0'], [1, '1']], xTicks: hzTicks(ph ? [2000, 4000, 6000] : [2000, 3000, 4000, 5000, 6000]) }),
        stepPath(P),
        step(d + 1, `${title}: the hump slides to the cliff and draws the curve`,
          g({ 'clip-path': `url(#${clip})` }, `<clipPath id="${clip}"><rect x="${P.x0}" y="${P.y0 - 10}" width="${P.w}" height="${P.h + 20}"/></clipPath>`, g({ anim: { k: 'move', dx, d: 0.3 + d * 3.2, len: 2.4 }, style: lin }, path(humpD, { cls: 'w-hump' }))),
          g({}, path(seg(xs[0], start), { cls: 'w-main' }), path(seg(start, center), { cls: 'w-main', pathLength: 1, style: lin, anim: { k: 'draw', d: 0.3 + d * 3.2, len: 2.4 } }), g({ anim: { k: 'in', d: 2.7 + d * 3.2, len: 0.5 } }, path(seg(center, xs[1]), { cls: 'w-main' }), path(outD, { cls: 'w-left-out', style: `fill:url(#${L.slug}-leftout)` }), circle(P.X(center), P.Y(H(center)), 5, { cls: 'k-dot' }),
            text(P.X(center) - 8, P.Y(H(center)) - 10, fmt(H(center), 2), { anchor: 'end', cls: 'k-num-accent' }),
            text(P.X(4000) + 8, P.Y(-0.33), leftLabel, { anchor: 'start', cls: 'k-num-accent' })))));
    };
    return [
      `<defs><pattern id="${L.slug}-leftout" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="w-lo-bg"/><line x1="0" y1="0" x2="0" y2="6" class="w-lo-line"/></pattern></defs>`,
      panel(56, 'rect', 31, 3484, 'rectangle, 31 long', ph ? 'left out: −9%' : 'left out: −9% of the area', 0),
      panel(ph ? 290 : 262, 'hamming', 31, 2968, 'Hamming, 31 long', 'left out: under 1%', 1),
      ph ? g({}, key(20, 512, [['w-ref', null, null, 'dashed: the ideal step'], ['w-main', null, null, 'the curve the slide draws']], { cols: 1, dy: 22 }), text(20, 566, 'grey: the hump, parked at the cliff', { anchor: 'start', cls: 'k-label' }))
        : g({}, text(556, 100, 'grey: the window’s', { anchor: 'start', cls: 'k-label' }), text(556, 118, 'hump, parked at', { anchor: 'start', cls: 'k-label' }), text(556, 136, 'the cliff', { anchor: 'start', cls: 'k-label' }),
          key(556, 176, [['w-main', null, null, 'the curve'], ['w-ref', null, null, 'ideal step']], { cols: 1, dy: 22 }),
          text(556, 236, 'hatched and edged:', { anchor: 'start', cls: 'k-label' }), text(556, 254, 'the part past the', { anchor: 'start', cls: 'k-label' }), text(556, 272, 'cliff, left out', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const spec = (L) => {
    const ph = L.phone, x0 = ph ? 24 : 60, w = ph ? 310 : 600, X = f => x0 + f / 8000 * w;
    const ty = ph ? 70 : 74, by = ph ? 270 : 240, sh = ph ? 44 : 44;
    const strip = (a, b, y, cls, fill, label, sub) => g({}, rect(X(a), y, X(b) - X(a), sh, { cls, fill }), rect(X(a), y, X(b) - X(a), sh, { fill: 'none', cls: 'k-frame' }),
      label ? masked((X(a) + X(b)) / 2, y + (sub ? 20 : 27), label, { cls: 'k-name', size: ph ? 12 : 14 }) : '', sub ? masked((X(a) + X(b)) / 2, y + 37, sub, { cls: 'k-tick', size: ph ? 9 : 11 }) : '');
    const ticks = (y, list) => list.map(f => g({}, line(X(f), y + sh, X(f), y + sh + 6, { cls: 'k-axis' }), text(X(f) + (ph && f === 3400 && !list.includes(4600) ? -2 : ph && f === 4000 ? 2 : 0), y + sh + 20, hz(f), { cls: 'k-tick', anchor: ph && f === 3400 && !list.includes(4600) ? 'end' : ph && f === 4000 ? 'start' : 'middle', style: ph ? 'font-size:9.5px' : undefined })));
    return [
      stripeDefs(L.slug),
      step(1, 'the job on the input tones: pass, slope, remove',
        text(x0, ty - 16, ph ? 'input tone, 16,000 samples/s' : 'input tone, on the wideband side (Hz)', { anchor: 'start', cls: 'k-name' }),
        strip(0, 3400, ty, 'w-pass', undefined, 'pass', ph ? '' : 'within 1%'), strip(3400, 4600, ty, '', 'var(--paper)', 'slope'), strip(4600, 8000, ty, '', `url(#${L.slug}-stripe)`, 'remove', ph ? '' : 'below 1%'),
        ticks(ty, ph ? [0, 3400, 4600, 8000] : [0, 3400, 4000, 4600, 8000]),
        text(x0, by + sh + 46, ph ? 'where it lands, 8,000 samples/s' : 'where it lands on your side after downsampling (Hz)', { anchor: 'start', cls: 'k-name' }),
        strip(0, 3400, by, 'w-mirror', undefined, 'voice band'), strip(3400, 4000, by, '', 'var(--paper)', ph ? '' : 'margin'),
        ph ? text(X(4000) + 6, by + 27, 'margin', { anchor: 'start', cls: 'k-label' }) : '',
        ticks(by, [0, 3400, 4000])),
      step(2, 'the remove band folds onto the voice band; the slope lands in the margin',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.4, len: 2.2 } }, g({ anim: { k: 'move', dx: X(4600) - X(0), dy: ty - by, d: 0.4, len: 2 } }, rect(X(0), by, X(3400) - X(0), sh, { fill: `url(#${L.slug}-stripe)` }))),
        g({ anim: { k: 'in', d: 2.4, len: 0.6 } },
          arrow(L.slug, [[X(6300), ty + sh + 28], [X(6300), (ty + sh + by) / 2 - 6], [X(1700), (ty + sh + by) / 2 - 6], [X(1700), by - 4]], { tone: 'accent' }),
          arrow(L.slug, [[X(4300), ty + sh + 28], [X(4300), (ty + sh + by) / 2 + 22], [X(3700), (ty + sh + by) / 2 + 22], [X(3700), by - 4]]),
          ph ? text(X(1700) + 8, (ty + sh + by) / 2 + 10, '8,000 − tone', { anchor: 'start', cls: 'k-num-accent' }) : text(X(6300) + 8, ty + sh + 46, 'folds: 8,000 − tone', { anchor: 'start', cls: 'k-num-accent' }))),
    ];
  };

  const taper = (L) => {
    const ph = L.phone, P = ph ? plot({ x: 40, y: 60, w: 300, h: 210, xs: [-16, 16], ys: [-0.15, 1.08] }) : plot({ x: 60, y: 60, w: 420, h: 210, xs: [-16, 16], ys: [-0.15, 1.08] });
    const wv = n => weight.hamming(n, 31);
    return [
      text(P.x0, 30, ph ? 'Hamming weights over the ideal list' : 'Hamming weights over the 31 ideal coefficients', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[1, '1'], [0.5, '0.5'], [0, '0']], xTicks: [[-15, `${M}15`], [-7, `${M}7`], [0, 'n = 0'], [7, '7'], [15, '15']] }),
      k.curve(P, wv, { from: -15, to: 15, cls: 'w-win' }),
      stems(P, range(-15, 15).map(n => [n, hI(n)]), { cls: 'k-stem-soft', dot: 3 }),
      stems(P, range(-15, 15).map(n => [n, hI(n) * wv(n)]), { cls: 'k-stem', dot: 3 }),
      text(P.X(0) + 8, P.Y(1) - 6, '1.000', { anchor: 'start', cls: 'k-num-input' }),
      text(P.X(15), P.Y(0.08) - 14, '0.08', { anchor: 'middle', cls: 'k-num-input' }), text(P.X(-15), P.Y(0.08) - 14, '0.08', { anchor: 'middle', cls: 'k-num-input' }),
      ph ? key(20, 330, [['w-win', null, null, 'Hamming weight w[n]'], ['k-stem-soft', 'circle', 'w-m-soft-hollow', 'ideal coefficient, dashed'], ['w-main', 'circle', 'w-m-ink', 'new: ideal × weight']], { cols: 1, dy: 22 })
        : key(500, 110, [['w-win', null, null, 'Hamming weight w[n]'], ['k-stem-soft', 'circle', 'w-m-soft-hollow', 'ideal, dashed'], ['w-main', 'circle', 'w-m-ink', 'new: ideal × weight']], { cols: 1, dy: 30 }),
      ph ? '' : text(500, 220, 'the middle barely moves;', { anchor: 'start', cls: 'k-note' }),
      ph ? '' : text(500, 242, 'the ends are squashed', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const transitionBand = (L) => {
    const ph = L.phone, P = ph ? plot({ x: 44, y: 84, w: 274, h: 220, xs: [2500, 5500], ys: [-0.1, 1.14] }) : plot({ x: 60, y: 84, w: 620, h: 210, xs: [2000, 6000], ys: [-0.1, 1.14] });
    const H = resp('hamming', 31);
    return [
      rect(P.X(3191), P.y0, P.X(4809) - P.X(3191), P.h, { cls: 'w-tb' }),
      rect(P.x0, P.Y(1.01), P.w, P.Y(0.99) - P.Y(1.01), { cls: 'w-strip' }),
      rect(P.x0, P.Y(0.01), P.w, P.Y(-0.01) - P.Y(0.01), { cls: 'w-strip' }),
      axes(P, { zero: false, yTicks: [[0, '0'], [0.5, '0.5'], [1, '1']], xTicks: hzTicks(ph ? [2500, 4000, 5500] : [2000, 3000, 4000, 5000, 6000]) }),
      text(P.x0 - 8, P.y0 - 10, 'gain', { anchor: 'end', cls: 'k-tick' }),
      poly(P, H, P.xs[0], P.xs[1], 400),
      text((P.X(3191) + P.X(4809)) / 2, P.y0 - 30, 'transition band, about 1,600 Hz', { cls: 'k-name' }),
      line(P.X(3191), P.y0 - 20, P.X(3191), P.y0, { cls: 'k-axis' }), line(P.X(4809), P.y0 - 20, P.X(4809), P.y0, { cls: 'k-axis' }),
      text(P.X(3191) - 6, P.y0 - 6, '3,191', { anchor: 'end', cls: 'k-num' }), text(P.X(4809) + 6, P.y0 - 6, '4,809 Hz', { anchor: 'start', cls: 'k-num' }),
      text(P.x0 + 6, P.Y(1.01) + 22, ph ? '1% strip' : 'thin strip: within 1% of 1', { anchor: 'start', cls: 'k-label' }),
      text(P.x1 - 6, P.Y(0.01) - 10, ph ? '1% strip' : 'thin strip: within 1% of 0', { anchor: 'end', cls: 'k-label' }),
      text(ph ? 20 : P.x0, 24, ph ? 'Hamming, 31 coefficients' : 'the Hamming filter, 31 coefficients', { anchor: 'start', cls: 'k-label' }),
    ];
  };

  const trade = (L) => {
    const ph = L.phone, dB = v => Math.max(-80, 20 * Math.log10(Math.max(Math.abs(v), 1e-5)));
    const mini = (x, y, kind, title) => {
      const P = plot({ x, y, w: ph ? 300 : 280, h: 70, xs: [-16, 16], ys: [0, 1.1] });
      return g({}, text(P.x0, y - 12, title, { anchor: 'start', cls: 'k-label' }), axes(P, { xTicks: [[-15, `${M}15`], [0, 'n = 0'], [15, '15']] }), stems(P, range(-15, 15).map(n => [n, weight[kind](n, 31)]), { cls: 'k-stem-input', dot: 2.4 }));
    };
    const top = ph ? 0 : 0;
    const P = ph ? plot({ x: 54, y: 330, w: 264, h: 220, xs: [0, 8000], ys: [-80, 5] }) : plot({ x: 70, y: 200, w: 460, h: 220, xs: [0, 8000], ys: [-80, 5] });
    const Hr = resp('rect', 31), Hh = resp('hamming', 31);
    const lbl = (y, s, cls) => text(ph ? P.x0 + 6 : P.x1 + 10, y + 4, s, { anchor: 'start', cls });
    return [
      text(20, 28 + top, 'weights, 31 long', { anchor: 'start', cls: 'k-name' }),
      mini(ph ? 40 : 60, ph ? 66 : 66, 'rect', 'rectangle'), mini(ph ? 40 : 400, ph ? 180 : 66, 'hamming', 'Hamming'),
      text(20, P.y0 - 24, 'their responses, in dB', { anchor: 'start', cls: 'k-name' }),
      axes(P, { zero: false, yTicks: [[0, '0'], [-20, `${M}20`], [-40, `${M}40`], [-60, `${M}60`], [-80, `${M}80`]], xTicks: hzTicks(ph ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]) }),
      text(P.x0 - 8, P.y0 - 8, 'dB', { anchor: 'end', cls: 'k-tick' }),
      poly(P, f => dB(Hh(f)), 0, 8000, 800, { cls: 'w-main' }),
      poly(P, f => dB(Hr(f)), 0, 8000, 800, { cls: 'w-dot' }),
      line(P.X(4000), P.Y(-21), P.x1, P.Y(-21), { cls: 'k-guide' }), line(P.X(5000), P.Y(-51), P.x1, P.Y(-51), { cls: 'k-guide' }),
      lbl(P.Y(-21), ph ? '−21 dB, rectangle' : '−21 dB, rectangle', 'k-num'),
      lbl(P.Y(-51), ph ? '−51 dB, Hamming' : '−51 dB, Hamming,', 'k-num'),
      ph ? '' : text(P.x1 + 10, P.Y(-51) + 20, 'from 5,000 Hz up', { anchor: 'start', cls: 'k-num' }),
      ph ? key(20, 610, [['w-dot', null, null, 'rectangle'], ['w-main', null, null, 'Hamming']], { dx: 150 })
        : key(560, 300, [['w-dot', null, null, 'rectangle'], ['w-main', null, null, 'Hamming']], { cols: 1, dy: 24 }),
    ];
  };

  const done = (L) => {
    const ph = L.phone, P = ph ? plot({ x: 44, y: 60, w: 274, h: 200, xs: [0, 8000], ys: [-0.1, 1.15] }) : plot({ x: 60, y: 60, w: 440, h: 210, xs: [0, 8000], ys: [-0.1, 1.15] });
    const H = resp('hamming', 45);
    const mx = ph ? 30 : 540, my = ph ? 330 : 110;
    return [
      stripeDefs(L.slug),
      rect(P.X(0), P.y0, P.X(3400) - P.X(0), P.h, { cls: 'w-pass' }),
      rect(P.X(4600), P.y0, P.x1 - P.X(4600), P.h, { fill: `url(#${L.slug}-stripe)` }),
      masked(P.X(1700), P.Y(0.45), 'pass', { cls: 'k-name', size: 14 }), text(P.X(4000), P.y0 - 6, 'slope', { cls: 'k-label' }), masked(P.X(6300), P.Y(0.45), 'remove', { cls: 'k-name', size: 14 }),
      axes(P, { zero: false, yTicks: [[0, '0'], [1, '1']], xTicks: hzTicks([0, 3400, 4600, 8000]) }),
      text(P.x0 - 8, P.y0 - 10, 'gain', { anchor: 'end', cls: 'k-tick' }),
      poly(P, H, 0, 8000, 400),
      text(P.x0, 32, ph ? 'Hamming 45 against the job' : 'the Hamming filter, 45 coefficients, against the job', { anchor: 'start', cls: 'k-name' }),
      text(mx, my, 'the meter', { anchor: 'start', cls: 'k-name' }),
      [['voice band', '0.24%'], ['ghost', '0.24%']].map(([a, v], i) => g({}, check(mx + 8, my + 30 + i * 30), text(mx + 24, my + 34 + i * 30, `${a}: ${v}`, { anchor: 'start', cls: 'k-num' }))),
      text(mx, my + 100, 'both within 1%', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: CSS, eyebrow: 'Lesson 10 · FIR design by windows', body: (kk, L) => body(L) });

  return [
    fig('wheel16k', [340, 450], 'The wheel at 16,000 samples per second',
      'A unit circle with tones marked at 0 degrees (0 Hz), 45 (2,000 Hz), 90 (4,000 Hz), 135 (6,000 Hz) and 180 (8,000 Hz); the top-right quarter is shaded pass, the top-left striped remove, the bottom half greyed for the mirror arrows; a 4,000 Hz dot steps a quarter turn per sample.',
      'On the wideband side a tone turns 360° × tone ÷ 16,000 per sample, so 4,000 Hz is a quarter turn. The filter should pass the top-right quarter and remove the top-left.', wheel16k, 2),
    fig('cutoff', [300, 300], 'The filter we want: a step',
      'Gain against input tone from 0 to 8,000 Hz: 1 up to 4,000 Hz, a sheer cliff, then 0; the cutoff, 4,000 Hz, is marked halfway down the cliff at gain 0.5.',
      'The wanted response: keep everything below 4,000 Hz whole, remove everything above. The cutoff sits halfway down the cliff.', cutoff),
    fig('fir', [300, 460], 'An FIR filter answers a click with its coefficients',
      'A click, 1 then zeros, enters a filter with five coefficients and no feedback; out come 0.1, 0.3, 0.5, 0.3, 0.1, one per sample, and then zeros forever.',
      'With no feedback, a click comes out as the coefficient list, one number per sample, and then it stops. These five numbers are only an example.', fir, 3),
    fig('ideal', [300, 470], 'The ideal low-pass’s coefficients never end',
      'Stems h[n] for n from −15 to 15: 0.5000 in the middle, zero at every other even n, odd ones alternating in sign and shrinking like 1 ÷ n (0.3183, −0.1061, ...), with arrows at both ends saying the list continues forever; beside it, the step it produces.',
      'The ideal list runs both ways from the middle and never ends. It produces the perfect step.', idealFig),
    fig('truncation', [300, 530], 'Cutting the list: the 0 Hz gain overshoots and settles',
      'Left: the ideal coefficients from −23 to 23, kept solid from −15 to 15 and faded beyond; right: the running total of the kept coefficients, the gain at 0 Hz, as a staircase 0.5000, 1.1366, 0.9244, 1.0517, 0.9608, 1.0315, 0.9737, 1.0226, 0.9802 around a dashed line at 1.',
      'Each pair of coefficients adds a step. The total overshoots to 1.1366, dives, and swings around 1, ending at 0.9802 with 31 kept.', truncation, 8),
    fig('pair-cosine', [320, 560], 'A pair of equal coefficients makes a flat number',
      'Two arrows of the same size turn opposite ways from 0 degrees, one forward and one back, to 30 degrees each; their up-and-down parts cancel and their sum lies flat on the horizontal line, 2 h[m] cos(m × turn) long. An inset at 90 degrees shows the arrows straight up and down, summing to 0.',
      'Coefficient h[m] sees the arrow turned back m steps, h[−m] the arrow turned forward. Their sum is flat: 2 h[m] cos(m × turn). At 90°, as for 4,000 Hz with odd m, it is zero.', pairCosine, 2),
    fig('pair-bars', [340, 560], 'A negative gain, built from its parts',
      'Bars for each pair’s contribution at 4,500 Hz: 0.500 for the middle, then −0.124, −0.118, −0.106, −0.089, −0.069, −0.048, −0.027, −0.008, and a final coral bar for the sum, −0.090; an inset shows a tone and its small flipped copy, labelled −0.09 is 9%, upside down.',
      'At 4,500 Hz every pair pulls the gain down, and together they land on −0.090: 9% of the tone gets out, upside down.', pairBars),
    fig('sweep-ghost', [460, 540], 'The sweep and its ghost, in time',
      'Top: over 10 seconds the sweep rises from 4,000 to 8,000 Hz. Bottom, on the same time axis: the ghost on your side falls from 4,000 to 0 Hz, drawn thicker where it is louder: 50% at the start, gone by 0.75 s, then swells of 9% at 3,500 Hz, 5% at 3,000 Hz and 2% at 1,000 Hz, with gaps where the gain crosses zero; the range where voices live, 0 to 3,400 Hz, is shaded.',
      'The rising sweep comes out as a falling ghost that swells and vanishes every 500 Hz or so, deep in the range where voices live.', sweepGhost),
    fig('gibbs', [320, 430], 'Longer cuts: the bump narrows, its height stays',
      'Plain-cut responses near the 4,000 Hz cutoff for 15, 63 and 255 coefficients, each with its own line style and marker; every peak touches the guide at 1.09, at 3,000, 3,750 and 3,938 Hz.',
      'More coefficients squeeze the ripple toward the cliff, but every bump still reaches 1.09.', gibbs, 3),
    fig('decibels', [270, 300], 'Percent and decibels',
      'A scale from 100% (0 dB) through 10% (−20 dB) and 1% (−40 dB) to 0.1% (−60 dB); the plain cut’s 9% leak is marked at about −21 dB and the 1% target at −40 dB.',
      'Each factor of ten is 20 dB. The Gibbs leak, 9%, is about −21 dB; the target, 1%, is −40 dB.', decibels),
    fig('wiggles', [480, 560], 'The curve is a sum of wiggles',
      'Three stacked wiggles over 0 to 8,000 Hz: 2 h[1] cos(turn) of size 0.637 with one half-swing, 2 h[3] cos(3 × turn) of size −0.212 with three, 2 h[5] cos(5 × turn) of size 0.127 with five; below, h[0] plus all three, already leaning toward the dashed step.',
      'Each coefficient pair sets the size of one wiggle. Three wiggles and the middle coefficient already lean toward the step.', wiggles),
    fig('average', [310, 580], 'Different wiggles average to zero',
      'Left: cos(turn) × cos(3 × turn) over 0 to 8,000 Hz, with its running average settling on 0. Right: cos(3 × turn) times itself, with its running average settling on one half.',
      'Two different wiggles multiplied average to zero over all the tones; a wiggle times itself averages to one half.', average, 2),
    fig('gibbs-build', [320, 440], 'Adding pairs builds the cliff, and the overshoot stays',
      'The plain cut’s response for 3, 7, 15 and 31 coefficients, each with its own line style and marker at its peak: 1.137 at 0 Hz, 1.100 at 2,000 Hz, 1.092 at 3,000 Hz and 1.090 at 3,500 Hz; the dashed step and a guide at 1.09.',
      'Each pair sharpens the cliff and moves the bump closer to it, but the bump never drops below about 1.09.', gibbsBuild, 4),
    fig('window', [370, 520], 'Truncation is multiplying by a rectangle',
      'Three stem rows: the ideal list from −22 to 22 that continues forever, times the rectangle, 1 from −15 to 15 and 0 outside, equals the 31 kept coefficients.',
      'Keeping 31 coefficients is the same as multiplying the ideal list by a rectangle of ones.', windowFig),
    fig('rect-response', [290, 560], 'A window has a response of its own',
      'Left: the 31-long rectangle’s response, a tall central hump with side lobes, the first one negative at −22% of the hump. Right, at the same length and on the same scale: the 31-long Hamming window’s response, a hump about twice as wide with side lobes under 1%, too small to see.',
      'The rectangle’s sharp edges give its response side lobes; the first is −22% of the hump. At the same length, Hamming’s soft edges leave a hump about twice as wide and almost no side lobes.', rectResponse),
    fig('smear', [460, 580], 'Sliding the hump along the cliff',
      'Two panels. Top: the rectangle’s hump slides along the ideal step and the curve it draws overshoots to 1.09; parked with its main hump touching the cliff, the part past the cliff, left out, is shaded: −9% of its area. Bottom: the Hamming hump slides and draws a gentle slope, leaving out under 1%.',
      'The cut filter’s gain at each tone is the share of the hump’s area still on the pass side. The rectangle’s left-out side lobes are worth −9%, so 109% remains.', smear, 2),
    fig('spec', [340, 400], 'The honest job, and where each band lands',
      'Input tones from 0 to 8,000 Hz: pass from 0 to 3,400 Hz, slope from 3,400 to 4,600 Hz, remove from 4,600 to 8,000 Hz. After downsampling, the remove band folds onto the voice band, 0 to 3,400 Hz, and the slope lands in the margin, 3,400 to 4,000 Hz.',
      'Anything above 4,600 Hz lands in the voice band and must go. The slope may live between 3,400 and 4,600 Hz, because it lands in the empty margin.', spec, 2),
    fig('taper', [300, 420], 'The Hamming taper over the ideal list',
      'The Hamming weights, 1 in the middle and 0.08 at the ends, drawn as a bell over the 31 ideal coefficients from −15 to 15; the new coefficients, ideal times weight, form a second set that barely changes in the middle and shrinks at the ends.',
      'Hamming barely touches the big middle coefficients and squashes the small outer ones.', taper),
    fig('transition-band', [334, 434], 'The transition band of the Hamming filter',
      'The Hamming 31 response from 2,000 to 6,000 Hz with thin strips within 1% of 1 and of 0; the transition band from 3,191 to 4,809 Hz, about 1,600 Hz wide, is shaded.',
      'Between 3,191 and 4,809 Hz the Hamming filter of 31 is neither within 1% of whole nor below 1%: that stretch is its transition band.', transitionBand),
    fig('trade', [450, 640], 'The window trade: shape sets the ripple',
      'Top: rectangle and Hamming weights, 31 long. Bottom: their responses in dB from 0 to 8,000 Hz; the rectangle’s ripple reaches −21 dB, Hamming’s stays below −51 dB from 5,000 Hz up.',
      'Same length, different shape: the rectangle’s ripple sits near −21 dB, Hamming’s below −51 dB.', trade),
    fig('done', [300, 450], 'What done looks like',
      'The Hamming 45 response over the job: inside the pass region from 0 to 3,400 Hz, inside the remove region above 4,600 Hz, with its slope crossing the gap; the meter reads 0.24% for the voice band and 0.24% for the ghost, both ticked.',
      'Hamming, 45 coefficients: the voice band within 0.24%, the ghost below 0.24%, and the slope only in the margin.', done),
  ];
};
