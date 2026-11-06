export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, curve, stems, arrow, box, step, fmt, cosd, sind } = k;
  const FS = 8000, M = '−';
  const warp = F => FS / Math.PI * Math.atan(Math.PI * F / FS);
  const unwarp = f => FS / Math.PI * Math.tan(Math.PI * f / FS);
  const ex = (F, c = 3400) => 1 / Math.sqrt(1 + (F / c) ** 4);
  const design = fc => {
    const W = 2 * Math.PI * fc, K = 2 * FS, A = K * K + Math.SQRT2 * W * K + W * W;
    return { b: [W * W / A, 2 * W * W / A, W * W / A], a: [(2 * W * W - 2 * K * K) / A, (K * K - Math.SQRT2 * W * K + W * W) / A] };
  };
  const dgain = ({ b, a }, f) => {
    const w = 2 * Math.PI * f / FS, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    return Math.hypot(b[0] + b[1] * c1 + b[2] * c2, b[1] * s1 + b[2] * s2) / Math.hypot(1 + a[0] * c1 + a[1] * c2, a[0] * s1 + a[1] * s2);
  };
  const SCRIPT = design(3400), PRE = design(unwarp(3400));
  const cp = f => dgain(SCRIPT, f), pw = f => dgain(PRE, f);
  const click = flt => { const y = []; for (let n = 0; n < 10; n++) { const x = i => (i === 0 ? 1 : 0); y.push(flt.b[0] * x(n) + flt.b[1] * x(n - 1) + flt.b[2] * x(n - 2) - flt.a[0] * (y[n - 1] || 0) - flt.a[1] * (y[n - 2] || 0)); } return y; };
  const hz = f => Math.round(f).toLocaleString('en-US');
  const pc = v => `${(v * 100).toFixed(1)}%`;
  const r2 = v => Math.round(v * 100) / 100;
  const poly = (pts, o = {}) => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), o);

  const SER = {
    ex: { cls: 'b11-ex', shape: 'circle', m: 'b11-m-ex' },
    cp: { cls: 'b11-cp', shape: 'square', m: 'b11-m-cp' },
    pw: { cls: 'b11-pw', shape: 'triangle', m: 'b11-m-pw' },
  };
  const mark = (shape, x, y, cls, size = 4.5) => {
    if (shape === 'square') return rect(x - size + 0.5, y - size + 0.5, 2 * size - 1, 2 * size - 1, { cls });
    if (shape === 'triangle') return poly([[x, y - size - 1.5], [x + size + 1, y + size - 0.5], [x - size - 1, y + size - 0.5]], { cls, fill: undefined });
    return circle(x, y, size, { cls });
  };
  const series = (P, kind, fn, at = [], o = {}) => g(o.wrap || {},
    curve(P, fn, { cls: SER[kind].cls, n: 320, from: o.from, to: o.to }),
    at.map(f => mark(SER[kind].shape, P.X(f), P.Y(fn(f)), SER[kind].m)));
  const key = (x, y, items, o = {}) => {
    const { cols = items.length, dx = 220, dy = 22 } = o;
    return g({}, items.map(([kind, label], i) => {
      const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
      const sw = SER[kind] ? g({}, line(lx, ly - 4, lx + 30, ly - 4, { cls: SER[kind].cls }), mark(SER[kind].shape, lx + 15, ly - 4, SER[kind].m))
        : kind === 'ref' ? line(lx, ly - 4, lx + 30, ly - 4, { cls: 'b11-ref' })
          : kind === 'curve' ? line(lx, ly - 4, lx + 30, ly - 4, { cls: 'b11-ex' })
            : kind === 'stretch' ? rect(lx + 4, ly - 11, 22, 14, { cls: 'b11-stretch' })
              : kind === 'old' ? g({}, line(lx, ly - 4, lx + 22, ly - 4, { cls: 'b11-spoke-cp' }), poleX(lx + 26, ly - 4, 4.5, 'b11-pole-old'))
                : g({}, line(lx, ly - 4, lx + 22, ly - 4, { cls: 'b11-spoke-pw' }), poleX(lx + 26, ly - 4, 4.5));
      return g({}, sw, text(lx + 40, ly, label, { anchor: 'start', cls: 'k-label' }));
    }));
  };
  const sup = (x, y, base, top, o = {}) => `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${o.anchor || 'start'}" class="${o.cls || 'k-math'}">${base}<tspan dy="-8" font-size="13">${top}</tspan></text>`;
  const headAt = (x, y, deg, cls = 'b11-head', len = 9, half = 4) => {
    const ux = cosd(deg), uy = -sind(deg), bx = x - ux * len, by = y - uy * len;
    return poly([[x, y], [bx - uy * half, by + ux * half], [bx + uy * half, by - ux * half]], { cls, fill: undefined });
  };
  const vec = (x1, y1, x2, y2, cls, head) => {
    const deg = Math.atan2(-(y2 - y1), x2 - x1) * 180 / Math.PI, back = 7;
    return g({}, line(x1, y1, x2 - back * cosd(deg), y2 + back * sind(deg), { cls }), headAt(x2, y2, deg, head));
  };
  const poleX = (x, y, s = 6, cls = 'b11-pole') => g({}, line(x - s, y - s, x + s, y + s, { cls }), line(x - s, y + s, x + s, y - s, { cls }));
  const zeroO = (x, y, s = 6) => circle(x, y, s, { cls: 'b11-zero' });
  const gainTicks = [[0, '0%'], [0.5, '50%'], [1, '100%']];
  const level = (P, from = P.xs[0], to = P.xs[1], labelSide = 'right') => g({},
    line(P.X(from), P.Y(Math.SQRT1_2), P.X(to), P.Y(Math.SQRT1_2), { cls: 'b11-ref' }),
    labelSide === 'right' ? text(P.X(to) + 6, P.Y(Math.SQRT1_2) + 4, '71%', { anchor: 'start', cls: 'k-label' }) : '');
  const drop = (P, f, v, y2) => line(P.X(f), P.Y(v), P.X(f), y2, { cls: 'b11-ref' });

  const css = `
.k-fig .b11-ex { stroke: var(--ink); stroke-width: 2.2; fill: none; }
.k-fig .b11-cp { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 9 5; fill: none; }
.k-fig .b11-pw { stroke: var(--accent); stroke-width: 2.8; stroke-dasharray: 0.5 5.5; stroke-linecap: round; fill: none; }
.k-fig .b11-m-ex { fill: var(--ink); stroke: var(--paper); stroke-width: 1; }
.k-fig .b11-m-cp { fill: none; stroke: var(--ink); stroke-width: 1.8; }
.k-fig .b11-m-pw { fill: var(--accent); stroke: var(--paper); stroke-width: 1; }
.k-fig .b11-ref { stroke: var(--ink-soft); stroke-width: 1; fill: none; }
.k-fig .b11-wall { stroke: var(--ink-soft); stroke-width: 3; }
.k-fig .b11-shade { fill: var(--paper-2); }
.k-fig .b11-stretch { fill: var(--accent-soft); }
.k-fig .b11-rim { stroke: var(--ink); stroke-width: 1.5; fill: none; }
.k-fig .b11-lap { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .b11-tick { stroke: var(--ink); stroke-width: 1.5; }
.k-fig .b11-tick-accent { stroke: var(--accent); stroke-width: 2.5; }
.k-fig .b11-pole { stroke: var(--ink); stroke-width: 2.4; stroke-linecap: round; }
.k-fig .b11-pole-old { stroke: var(--ink-soft); stroke-width: 1.6; stroke-linecap: round; }
.k-fig .b11-zero { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .b11-spoke-cp { stroke: var(--ink-soft); stroke-width: 1.4; stroke-dasharray: 9 5; }
.k-fig .b11-spoke-pw { stroke: var(--accent); stroke-width: 2.4; stroke-dasharray: 0.5 5; stroke-linecap: round; }
.k-fig .b11-vec { stroke: var(--ink); stroke-width: 2; }
.k-fig .b11-vec-accent { stroke: var(--accent); stroke-width: 2.6; }
.k-fig .b11-cell { fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .b11-wave { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .b11-head { fill: var(--ink-soft); }
.k-fig .b11-head-ink { fill: var(--ink); }
`;

  const overlayBug = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 48, y: 46, w: 276, h: 210, xs: [0, 4000], ys: [0, 1.05] }) : plot({ x: 76, y: 50, w: 560, h: 220, xs: [0, 4000], ys: [0, 1.05] });
    const tones = [2000, 3000, 3400];
    const row = P.y1 + 38;
    return [
      axes(P, { yTicks: gainTicks, xTicks: ph ? [[0, '0'], [2000, '2,000'], [4000, '4,000']] : [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000']], zero: false, yTitle: 'gain: how much passes' }),
      level(P),
      drop(P, 3400, Math.SQRT1_2, row - 14), drop(P, 2363, Math.SQRT1_2, row - 14),
      series(P, 'ex', f => ex(f), tones),
      series(P, 'cp', cp, tones),
      text(P.X(2363), row, ph ? '2,363' : '2,363 Hz', { cls: 'k-num' }), text(P.X(3400), row, ph ? '3,400' : '3,400 Hz', { cls: 'k-num' }),
      ph ? '' : g({}, text(P.X(3400) + 10, P.Y(ex(3400)) - 8, pc(ex(3400)), { anchor: 'start', cls: 'k-num' }),
        text(P.X(3400) + 10, P.Y(cp(3400)) - 8, pc(cp(3400)), { anchor: 'start', cls: 'k-num' })),
      text(P.x1, row + 20, 'tone, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      ph ? g({}, key(28, row + 50, [['ex', 'the old exchange'], ['cp', 'your copy, from the script']], { cols: 1 }),
        text(28, row + 104, `at 3,400 Hz: exchange ${pc(ex(3400))}, copy ${pc(cp(3400))}`, { anchor: 'start', cls: 'k-num' }))
        : key(P.x0, row + 52, [['ex', 'the old exchange'], ['cp', 'your copy, from the script']], { dx: 250 }),
    ];
  };

  const analog = L => {
    const ph = L.phone;
    const v = t => 0.55 * Math.sin(2 * Math.PI * t * 1.6 + 0.3) + 0.35 * Math.sin(2 * Math.PI * t * 4.1 + 1.2);
    const smooth = t => 0.5 * Math.sin(2 * Math.PI * t * 1.6 + 0.1);
    const lay = ph
      ? { inX: 18, inW: 84, boxX: 118, boxW: 124, outX: 258, outW: 84, rowA: 96, rowB: 306, axA: 196, axB: 400, ax0: 24, ax1: 336 }
      : { inX: 40, inW: 180, boxX: 262, boxW: 196, outX: 500, outW: 180, rowA: 90, rowB: 292, axA: 178, axB: 380, ax0: 60, ax1: 680 };
    const amp = ph ? 28 : 32;
    const wave = (x0, w, y0, fn) => k.sampled(t => fn(t), 0, 1, 160).map(([t, val]) => [x0 + t * w, y0 - val * amp]);
    const N = ph ? 8 : 12;
    const dots = (x0, w, y0, fn, d0) => Array.from({ length: N }, (_, i) => {
      const t = (i + 0.5) / N, x = x0 + t * w, y = y0 - fn(t) * amp;
      return g({ anim: { k: 'in', d: d0 + i * 0.32, len: 0.3 } }, line(x, y0, x, y, { cls: 'k-stem' }), circle(x, y, 3.5, { cls: 'k-stem-dot' }));
    });
    const scale = ph ? F => lay.ax0 + F / 30000 * (lay.ax1 - lay.ax0 - 24) : F => lay.ax0 + F / 30000 * (lay.ax1 - lay.ax0 - 30);
    const tickAt = (y, F, s) => g({}, line(scale(F), y, scale(F), y + 5, { cls: 'k-axis' }), text(scale(F), y + 19, s, { cls: 'k-tick' }));
    const midA = lay.rowA, midB = lay.rowB, bh = ph ? 64 : 72;
    return [
      text(lay.inX, midA - 52, ph ? 'analog: a voltage, every instant' : 'analog: a smooth voltage, at every instant', { anchor: 'start', cls: 'k-name' }),
      text(lay.inX, midB - 52, ph ? 'digital: 8,000 numbers a second' : 'digital: a list of samples, 8,000 a second', { anchor: 'start', cls: 'k-name' }),
      arrow(L.slug, [[lay.inX + lay.inW + 2, midA], [lay.boxX - 4, midA]]), arrow(L.slug, [[lay.boxX + lay.boxW + 2, midA], [lay.outX - 4, midA]]),
      arrow(L.slug, [[lay.inX + lay.inW + 2, midB], [lay.boxX - 4, midB]]), arrow(L.slug, [[lay.boxX + lay.boxW + 2, midB], [lay.outX - 4, midB]]),
      box(lay.boxX, midA - bh / 2, lay.boxW, bh, { name: 'analog filter', sub: ph ? 'capacitors, coils' : 'capacitors and coils' }),
      box(lay.boxX, midB - bh / 2, lay.boxW, bh, { name: 'digital filter', sub: ph ? 'arithmetic' : 'arithmetic on samples' }),
      line(lay.inX, midB, lay.inX + lay.inW, midB, { cls: 'k-axis' }), line(lay.outX, midB, lay.outX + lay.outW, midB, { cls: 'k-axis' }),
      step(1, 'the voltage flows through the analog filter continuously',
        poly(wave(lay.inX, lay.inW, midA, v), { cls: 'b11-wave', pathLength: 1, anim: { k: 'draw', d: 0, len: 4 } }),
        poly(wave(lay.outX, lay.outW, midA, smooth), { cls: 'b11-wave', pathLength: 1, anim: { k: 'draw', d: 0.4, len: 4 } })),
      step(2, 'the samples tick through the digital filter one at a time',
        dots(lay.inX, lay.inW, midB, v, 0), dots(lay.outX, lay.outW, midB, smooth, 0.4)),
      line(lay.ax0, lay.axA, lay.ax1, lay.axA, { cls: 'k-axis', 'marker-end': `url(#${L.slug}-arrow)` }),
      [[0, '0'], [4000, '4,000'], [10000, '10,000'], [20000, ph ? '20,000' : '20,000 Hz']].map(([F, s]) => tickAt(lay.axA, F, s)),
      text(lay.ax1, lay.axA - 10, ph ? 'F, Hz: on forever' : 'analog frequency F, in Hz, from 0: on forever', { anchor: 'end', cls: 'k-tick' }),
      line(lay.ax0, lay.axB, scale(4000), lay.axB, { cls: 'k-axis' }),
      line(scale(4000), lay.axB - 9, scale(4000), lay.axB + 3, { cls: 'b11-wall' }),
      [[0, '0'], [4000, '4,000 Hz']].map(([F, s]) => tickAt(lay.axB, F, s)),
      text(scale(4000) + 12, lay.axB + 4, ph ? 'f stops here' : 'digital tone f, in Hz, from 0: stops at 4,000', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const prototype = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 48, y: 56, w: 280, h: 210, xs: [0, 10000], ys: [0, 1.05] }) : plot({ x: 72, y: 56, w: 576, h: 220, xs: [0, 10000], ys: [0, 1.05] });
    const pts = [1000, 2000, 3000, 3400, 5000, 10000];
    return [
      rect(P.X(4000), P.y0, P.x1 - P.X(4000), P.h, { cls: 'b11-shade' }),
      text((P.X(4000) + P.x1) / 2, P.y0 + 22, ph ? 'beyond your line' : 'tones your line cannot carry', { cls: 'k-label' }),
      axes(P, { yTicks: gainTicks, xTicks: ph ? [[0, '0'], [4000, '4,000'], [10000, '10,000']] : [[0, '0'], [2000, '2,000'], [4000, '4,000'], [6000, '6,000'], [8000, '8,000'], [10000, '10,000']], zero: false, yTitle: ph ? 'gain' : 'gain: how much passes' }),
      line(P.X(4000), P.y0 - 8, P.X(4000), P.y1, { cls: 'b11-wall' }),
      text(P.X(4000) + 8, P.y0 - 14, ph ? 'the wall' : 'the wall: your line stops at 4,000 Hz', { anchor: 'start', cls: 'k-label' }),
      line(P.x0, P.Y(Math.SQRT1_2), P.X(3400), P.Y(Math.SQRT1_2), { cls: 'b11-ref' }), drop(P, 3400, Math.SQRT1_2, P.y1),
      series(P, 'ex', f => ex(f), pts, { from: 0, to: 10000 }),
      text(P.X(3400) - 8, P.Y(Math.SQRT1_2) + 18, ph ? '70.7%' : '70.7% at 3,400 Hz', { anchor: 'end', cls: 'k-num' }),
      text(P.X(5000) + 9, P.Y(ex(5000)) - 9, ph ? pc(ex(5000)) : `${pc(ex(5000))} at 5,000 Hz`, { anchor: 'start', cls: 'k-num' }),
      text(P.X(10000) - 4, P.Y(ex(10000)) - 22, ph ? pc(ex(10000)) : `${pc(ex(10000))} at 10,000 Hz`, { anchor: 'end', cls: 'k-num' }),
      text(P.x1, P.y1 + 38, ph ? 'analog F, Hz, from 0' : 'analog frequency F, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      ph ? text(P.x0, P.y1 + 66, 'the exchange: Butterworth, cutoff 3,400 Hz', { anchor: 'start', cls: 'k-tick' })
        : text(P.x0, P.y1 + 66, 'the exchange: a second-order Butterworth low-pass, cutoff 3,400 Hz', { anchor: 'start', cls: 'k-label' }),
    ];
  };

  const arc = (cx, cy, R, a0, a1) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3));
    return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + R * cosd(a), cy - R * sind(a)]; });
  };
  const wrapSqueeze = L => {
    const ph = L.phone, R = ph ? 104 : 120, gap = 11;
    const [cl, cr] = ph ? [[180, 188], [180, 504]] : [[184, 236], [540, 236]];
    const total = 12000, len = 4.5, T = F => len * F / total;
    const wrapAngle = F => { const lap = Math.floor(F / 4000), r = (F % 4000) / 4000 * 180; return lap % 2 ? 180 - r : r; };
    const wrapR = F => R + gap * Math.floor(Math.min(F, 11999) / 4000);
    const at = (c, rr, a) => [c[0] + rr * cosd(a), c[1] - rr * sind(a)];
    const radial = (c, rr, a, cls, o = 7) => { const [x1, y1] = at(c, rr - o, a), [x2, y2] = at(c, rr + o, a); return line(x1, y1, x2, y2, { cls }); };
    const laps = [0, 1, 2].map(lap => {
      const a0 = lap % 2 ? 180 : 0, a1 = lap % 2 ? 0 : 180, rr = R + gap * lap;
      const pts = arc(cl[0], cl[1], rr, a0, a1);
      if (lap) pts.unshift(at(cl, rr - gap, a0));
      return poly(pts, { cls: 'b11-lap', pathLength: 1, anim: { k: 'draw', d: T(lap * 4000), len: T(4000) } });
    });
    const wrapTicks = [[0, ''], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '']].map(([F, s]) => {
      const a = wrapAngle(F), [lx, ly] = at(cl, R - 24, a);
      return g({ anim: { k: 'in', d: T(F), len: 0.3 } }, radial(cl, R, a, 'b11-tick', 6), s ? text(lx, ly + 4, s, { cls: 'k-tick', anchor: 'middle' }) : '');
    });
    const five = (() => {
      const a = wrapAngle(5000), rr = wrapR(5000), [lx, ly] = at(cl, rr + 20, a);
      return g({ anim: { k: 'in', d: T(5000), len: 0.3 } }, radial(cl, rr, a, 'b11-tick', 7), text(lx - 4, ly, '5,000', { cls: 'k-num', anchor: 'end' }));
    })();
    const sq = [0, 1000, 2000, 3400, 5000, 10000, 12000];
    const segs = sq.slice(1).map((F, i) => {
      const F0 = sq[i];
      return poly(arc(cr[0], cr[1], R, 180 * warp(F0) / 4000, 180 * warp(F) / 4000), { cls: 'b11-lap', pathLength: 1, anim: { k: 'draw', d: T(F0), len: T(F) - T(F0) } });
    });
    segs.push(poly(arc(cr[0], cr[1], R, 180 * warp(12000) / 4000, 180), { cls: 'b11-lap', pathLength: 1, anim: { k: 'draw', d: len, len: 0.6 } }));
    const sqTicks = [[0, ''], [1000, '1,000'], [2000, '2,000'], [3400, '3,400'], [5000, '5,000'], [10000, '10,000'], [100000, '100,000']].map(([F, s]) => {
      const a = 180 * warp(F) / 4000, [lx, ly] = at(cr, R + 18, a);
      const anchor = a < 60 ? 'start' : a > 120 ? 'end' : 'middle';
      return g({ anim: { k: 'in', d: F > total ? len + 0.3 : T(F), len: 0.3 } }, radial(cr, R, a, 'b11-tick', 6),
        s ? text(lx + (a > 170 ? -2 : 0), ly + (a > 170 ? -6 : 4), s, { cls: 'k-tick', anchor }) : '');
    });
    const base = (c, extra = 0) => g({}, line(c[0] - R - 16 - extra, c[1], c[0] + R + 16 + extra, c[1], { cls: 'k-axis' }),
      text(c[0] + R, c[1] + 18, '0 Hz', { cls: 'k-tick' }), text(c[0] - R, c[1] + 18, '4,000 Hz', { cls: 'k-tick' }));
    const [aliasX, aliasY] = at(cl, R, 135);
    return [
      text(cl[0], cl[1] - R - 48, ph ? 'wrap: sample its click echo' : 'wrap: sample the exchange’s echo to a click', { cls: 'k-name' }),
      text(cr[0], cr[1] - R - 48, 'squeeze: bend the ruler once', { cls: 'k-name' }),
      base(cl, gap * 2), base(cr),
      step(1, 'the ruler wraps around the half circle again and again, and 5,000 Hz lands on 3,000 Hz', laps, wrapTicks, five),
      step(2, 'the same ruler bends onto the half circle once, its ticks bunching toward 4,000 Hz', segs, sqTicks),
      g({ anim: { k: 'in', d: len + 0.5, len: 0.6 } },
        circle(aliasX, aliasY, 9, { cls: 'b11-zero', style: 'fill:none' }),
        text(cl[0], cl[1] + 46, '5,000 Hz lands on 3,000 Hz: an alias', { cls: 'k-note' }),
        ['each ring is one 4,000 Hz lap:', 'inner ring: 0 to 4,000 Hz', 'middle ring: 4,000 to 8,000 Hz', 'outer ring: 8,000 to 12,000 Hz']
          .map((t, i) => text(cl[0], cl[1] + 68 + 14 * i, t, { cls: 'k-tick' })),
        text(cr[0] - R - 6, cr[1] + 36, '∞', { cls: 'k-num-accent', style: 'font-size:16px' }),
        text(cr[0], cr[1] + 62, 'infinity lands on 4,000 Hz: nothing wraps', { cls: 'k-note-accent' })),
      text(L.W / 2, ph ? cr[1] + 84 : cr[1] + 128, ph ? 'numbers on the ticks: analog F in Hz' : 'numbers on the ticks: analog F in Hz; under the line: the digital tones', { cls: 'k-tick' }),
    ];
  };

  const arctanFig = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 48, y: 50, w: 284, h: 200, xs: [0, 20], ys: [0, 1.75] }) : plot({ x: 80, y: 46, w: 560, h: 220, xs: [0, 20], ys: [0, 1.75] });
    const top = Math.PI / 2;
    return [
      axes(P, { yTicks: [[0, '0'], [Math.PI / 4, 'π/4'], [top, 'π/2']], xTicks: [[0, '0'], [5, '5'], [10, '10'], [15, '15'], [20, '20']], zero: false, yTitle: 'arctan x, in radians' }),
      line(P.x0, P.Y(top), P.x1, P.Y(top), { cls: 'b11-ref' }),
      text(P.x1, P.Y(top) - 8, ph ? 'ceiling: π/2, 90°' : 'the ceiling: π/2, which is 90°', { anchor: 'end', cls: 'k-label' }),
      line(P.X(0), P.Y(0), P.X(1.75), P.Y(1.75), { cls: 'b11-ref' }),
      text(P.X(1.75) + 6, P.Y(1.75) + 12, 'y = x', { anchor: 'start', cls: 'k-label' }),
      curve(P, x => Math.atan(x), { cls: 'b11-ex', n: 400 }),
      ph ? g({}, text(20, P.y1 + 66, 'small x: almost the same number back', { anchor: 'start', cls: 'k-label' }), text(20, P.y1 + 86, 'big x: creeps toward the ceiling', { anchor: 'start', cls: 'k-label' }))
        : g({}, text(P.X(4.2), P.Y(0.62), 'small x: almost the same number back', { anchor: 'start', cls: 'k-note' }),
          text(P.X(9), P.Y(1.12), 'big x: it creeps toward the ceiling, never past it', { anchor: 'start', cls: 'k-note' })),
      text(P.x1, P.y1 + 38, 'x, from 0', { anchor: 'end', cls: 'k-tick' }),
    ];
  };

  const warpPlot = (L, back) => {
    const ph = L.phone;
    const P = ph ? plot({ x: 52, y: 46, w: 276, h: 230, xs: [0, 20000], ys: [0, 4400] }) : plot({ x: 84, y: 46, w: 556, h: 250, xs: [0, 20000], ys: [0, 4400] });
    const xt = [[0, '0'], [20000, '20,000']], yt = [[0, '0'], [4000, '4,000']];
    return {
      P, parts: [
        axes(P, { yTicks: yt, xTicks: xt, zero: false, yTitle: ph ? 'digital f, Hz' : 'digital tone f, in Hz, from 0' }),
        line(P.x0, P.Y(4000), P.x1, P.Y(4000), { cls: 'b11-ref' }),
        text(P.x1, P.Y(4000) - 8, 'the ceiling: 4,000 Hz', { anchor: 'end', cls: 'k-label' }),
        line(P.X(0), P.Y(0), P.X(4400), P.Y(4400), { cls: 'b11-ref' }),
        text(P.X(4400) + 6, P.Y(4400) + 12, ph ? 'f = F' : 'no squeeze: f = F', { anchor: 'start', cls: 'k-label' }),
        curve(P, warp, { cls: 'b11-ex', n: 400 }),
        text(P.x1, P.y1 + 38, ph ? 'analog F, Hz, from 0' : 'analog frequency F, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      ],
    };
  };
  const warping = L => {
    const ph = L.phone, { P, parts } = warpPlot(L);
    const up = arrow(L.slug, [[P.X(3400), P.y1], [P.X(3400), P.Y(2363) + 2], [P.x0 + 4, P.Y(2363) + 2]]);
    const back = arrow(L.slug, [[P.x0, P.Y(3000)], [P.X(6148), P.Y(3000)], [P.X(6148), P.y1 - 4]]);
    return [
      ...parts, up, back,
      text(P.X(3400) + (ph ? 2 : 0), P.y1 + 18, '3,400', { anchor: ph ? 'end' : 'middle', cls: 'k-num' }), text(P.X(6148) + (ph ? 3 : 0), P.y1 + 18, '6,148', { anchor: ph ? 'start' : 'middle', cls: 'k-num' }),
      text(P.x0 - 8, P.Y(2363) + 6, '2,363', { anchor: 'end', cls: 'k-num-accent' }), text(P.x0 - 8, P.Y(3000) + 4, '3,000', { anchor: 'end', cls: 'k-num' }),
      ph ? g({}, text(20, P.y1 + 66, 'up and across: 3,400 Hz lands on 2,363 Hz', { anchor: 'start', cls: 'k-label' }),
        text(20, P.y1 + 88, 'across and down: 3,000 Hz comes from 6,148 Hz', { anchor: 'start', cls: 'k-label' }))
        : g({}, text(P.X(9000), P.Y(1500), 'up and across: 3,400 Hz lands on 2,363 Hz', { anchor: 'start', cls: 'k-label' }),
          text(P.X(9000), P.Y(1500) + 22, 'across and down: 3,000 Hz comes from 6,148 Hz', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const prewarp = L => {
    const ph = L.phone, { P, parts } = warpPlot(L);
    const F = unwarp(3400), y = P.Y(3400), x = P.X(F);
    const head = (x0, y0) => path(`M${r2(x0 - 4)} ${r2(y0 - 8)}L${r2(x0)} ${r2(y0)}L${r2(x0 + 4)} ${r2(y0 - 8)}Z`, { cls: 'b11-head', fill: undefined });
    return [
      ...parts,
      step(1, 'start at 3,400 Hz on the digital axis and go across to the curve',
        line(P.x0, y, x, y, { cls: 'k-arrow', pathLength: 1, anim: { k: 'draw', d: 0, len: 1.6 } })),
      step(2, 'then down to the analog axis: 10,607 Hz',
        line(x, y, x, P.y1 - 1, { cls: 'k-arrow', pathLength: 1, anim: { k: 'draw', d: 1.6, len: 1.4 } }),
        g({ anim: { k: 'in', d: 2.9, len: 0.4 } }, head(x, P.y1 - 1), text(x, P.y1 + 18, '10,607', { cls: 'k-num-accent' }))),
      text(P.x0 - 8, y + 4, '3,400', { anchor: 'end', cls: 'k-num-input' }),
      text(x + 8, (y + P.y1) / 2, ph ? 'read backward' : 'read backward: across, then down', { anchor: 'start', cls: 'k-label' }),
    ];
  };

  const arrows = L => {
    const ph = L.phone, th = 50;
    const [cx, cy, R] = ph ? [150, 196, 82] : [176, 196, 92];
    const tip = a => [cx + R * cosd(a), cy - R * sind(a)];
    const [ax, ay] = tip(th), [mx, my] = tip(-th);
    const sumX = cx + 2 * cosd(th) * R, difY = cy - 2 * sind(th) * R;
    const origin = `transform-origin:${cx}px ${cy}px;animation-timing-function:linear`;
    const lines = ph ? [[30, 352], [30, 404]] : [[372, 120], [372, 216]];
    return [
      circle(cx, cy, R, { cls: 'b11-rim', style: 'stroke:var(--ink-soft);stroke-width:1' }),
      line(cx - R - 18, cy, cx + 2 * R + 16, cy, { cls: 'k-axis' }), line(cx, cy + R + 14, cx, cy - 2 * R - 6, { cls: 'k-axis' }),
      step(1, 'the arrow at angle theta and its mirror at minus theta turn opposite ways, theta reaching 50 degrees',
        g({ anim: { k: 'turn', r0: '30deg', steps: 30, len: 2 }, style: origin }, vec(cx, cy, ax, ay, 'b11-vec', 'b11-head-ink')),
        g({ anim: { k: 'turn', r0: '-30deg', steps: 30, len: 2 }, style: origin }, vec(cx, cy, mx, my, 'b11-vec', 'b11-head-ink'))),
      sup(ax + 6, ay - 4, 'e', 'jθ'),
      sup(mx + 6, my + 20, 'e', '−jθ'),
      text(cx + 30, cy - 8, 'θ = 50°', { anchor: 'start', cls: 'k-label' }),
      step(2, 'their sum lies flat: 2 cos theta, 1.29',
        g({ anim: { k: 'scale', sx: r2(2 * cosd(20) / (2 * cosd(th))), d: 0, len: 2 }, style: origin }, line(cx, cy, sumX, cy, { cls: 'b11-vec-accent', 'marker-end': `url(#${L.slug}-arrow-accent)` })),
        g({ anim: { k: 'in', d: 2, len: 0.4 } }, line(ax, ay, sumX, cy, { cls: 'b11-ref k-faint' }))),
      step(3, 'their difference points straight up: 2j sin theta, length 1.53',
        g({ anim: { k: 'scale', sy: r2(sind(20) / sind(th)), d: 0, len: 2 }, style: origin }, line(cx, cy, cx, difY, { cls: 'b11-vec-accent', 'marker-end': `url(#${L.slug}-arrow-accent)` })),
        g({ anim: { k: 'in', d: 2, len: 0.4 } }, line(ax, ay, cx, difY, { cls: 'b11-ref k-faint' }))),
      text(sumX - 4, cy + 20, '1.29', { anchor: 'middle', cls: 'k-num-accent' }),
      text(cx + 8, difY + 4, '1.53', { anchor: 'start', cls: 'k-num-accent' }),
      `<text x="${lines[0][0]}" y="${lines[0][1]}" text-anchor="start" class="k-math">e<tspan dy="-8" font-size="13">jθ</tspan><tspan dy="8"> + e</tspan><tspan dy="-8" font-size="13">−jθ</tspan><tspan dy="8"> = 2 cos θ</tspan></text>`,
      text(lines[0][0], lines[0][1] + 22, ph ? 'lies flat: 2 cos 50° = 1.29' : 'plus: lies flat, 2 cos 50° = 1.29', { anchor: 'start', cls: 'k-label' }),
      `<text x="${lines[1][0]}" y="${lines[1][1]}" text-anchor="start" class="k-math">e<tspan dy="-8" font-size="13">jθ</tspan><tspan dy="8"> − e</tspan><tspan dy="-8" font-size="13">−jθ</tspan><tspan dy="8"> = 2j sin θ</tspan></text>`,
      text(lines[1][0], lines[1][1] + 22, ph ? 'points straight up: 2 sin 50° = 1.53' : 'minus: points straight up, 2 sin 50° = 1.53', { anchor: 'start', cls: 'k-label' }),
    ];
  };

  const twoRadians = L => {
    const ph = L.phone;
    const a = ph ? { x0: 30, x1: 250, y: 92 } : { x0: 70, x1: 370, y: 92 };
    const b = ph ? { x0: 30, x1: 330, y: 238, max: 40000 } : { x0: 70, x1: 680, y: 228, max: 60000 };
    const Xa = w => a.x0 + w / Math.PI * (a.x1 - a.x0), Xb = W => b.x0 + W / b.max * (b.x1 - b.x0 - 30);
    const tk = (x, y, s, sub) => g({}, line(x, y, x, y + 5, { cls: 'k-axis' }), text(x, y + 19, s, { cls: 'k-tick' }), sub ? text(x, y + 35, sub, { cls: 'k-tick' }) : '');
    const w34 = 0.85 * Math.PI, W34 = 2 * Math.PI * 3400;
    const flag = (x, y, s) => g({}, line(x, y - 22, x, y, { cls: 'k-stem-accent' }), circle(x, y - 22, 4, { cls: 'k-stem-accent-dot' }), text(x, y - 32, s, { cls: 'k-num-accent' }));
    return [
      text(a.x0, a.y - 56, ph ? 'ω: radians per sample' : 'ω, radians per sample: digital tones, from 0', { anchor: 'start', cls: 'k-name' }),
      line(a.x0, a.y, a.x1, a.y, { cls: 'k-axis' }), line(a.x1, a.y - 12, a.x1, a.y + 4, { cls: 'b11-wall' }),
      tk(Xa(0), a.y, '0', '0 Hz'), tk(Xa(Math.PI / 2), a.y, 'π/2', '2,000 Hz'), tk(Xa(Math.PI), a.y, 'π', '4,000 Hz'),
      text(a.x1 + 10, a.y + 4, ph ? 'stops' : 'stops at π', { anchor: 'start', cls: 'k-label' }),
      flag(Xa(w34), a.y, ph ? '0.85π' : '3,400 Hz: 0.85π'),
      text(b.x0, b.y - 56, ph ? 'Ω: radians per second' : 'Ω, radians per second: analog frequencies, from 0', { anchor: 'start', cls: 'k-name' }),
      line(b.x0, b.y, b.x1, b.y, { cls: 'k-axis', 'marker-end': `url(#${L.slug}-arrow)` }),
      tk(Xb(0), b.y, '0', '0 Hz'), tk(Xb(20000), b.y, '20,000'), tk(Xb(40000), b.y, '40,000'), ph ? '' : tk(Xb(60000), b.y, '60,000'),
      text(b.x1, b.y + 52, ph ? 'on forever' : 'on forever, no end', { anchor: 'end', cls: 'k-label' }),
      flag(Xb(W34), b.y, ph ? '21,363' : '3,400 Hz: 21,363 rad/s'),
      text(ph ? 30 : 70, ph ? 316 : 300, ph ? 'same 3,400 Hz, two kinds of radian' : 'the same 3,400 Hz tone, counted two ways: per sample and per second', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const sLine = L => {
    const ph = L.phone;
    const lx = ph ? 84 : 130, top = ph ? 70 : 64, bot = ph ? 300 : 300;
    const Fy = F => bot - F / 10000 * (bot - top - 16);
    const gx0 = ph ? 150 : 230, gw = ph ? 176 : 260;
    const Gx = v => gx0 + v * gw;
    const ptsTo = (a, b) => k.sampled(F => ex(F), a, b, 120).map(([F, v]) => [Gx(v), Fy(F)]);
    const y34 = Fy(3400), g34 = Gx(Math.SQRT1_2);
    const inset = ph ? { x: 70, y: 470 } : { x: 560, y: 250 };
    const iu = ph ? 44 : 48;
    return [
      text(lx, top - 40, 'the analog ruler', { cls: 'k-name' }), text(lx, top - 20, 's = j 2πF', { cls: 'k-num' }),
      line(lx, bot + 6, lx, top - 6, { cls: 'b11-tick', 'marker-end': `url(#${L.slug}-arrow)` }),
      [[0, '0 Hz'], [3400, '3,400 Hz'], [10000, '10,000 Hz']].map(([F, s]) => g({}, line(lx - 5, Fy(F), lx, Fy(F), { cls: 'k-axis' }), text(lx - 9, Fy(F) + 4, s, { anchor: 'end', cls: 'k-tick' }))),
      line(gx0, bot, gx0, top, { cls: 'k-axis' }), line(gx0, bot, gx0 + gw, bot, { cls: 'k-axis' }),
      [[0, '0%'], [0.5, '50%'], [1, '100%']].map(([v, s]) => g({}, line(Gx(v), bot, Gx(v), bot + 5, { cls: 'k-axis' }), text(Gx(v), bot + 19, s, { cls: 'k-tick' }))),
      text(gx0 + gw, bot + 38, ph ? 'size of H' : 'size of H(s): the gain', { anchor: 'end', cls: 'k-tick' }),
      text(ph ? gx0 + 10 : gx0 + 30, top - 40, ph ? 'size of H' : 'the size of H as the dot climbs', { anchor: 'start', cls: 'k-name' }),
      line(lx, y34, g34, y34, { cls: 'b11-ref' }),
      step(1, 'a dot climbs the ruler from 0 Hz to 3,400 Hz while the gain curve traces out',
        g({ anim: { k: 'move', dy: bot - y34, d: 0, len: 2 }, style: 'animation-timing-function:linear' }, circle(lx, y34, 6, { cls: 'k-dot' })),
        poly(ptsTo(0, 3400), { cls: 'b11-ex', pathLength: 1, anim: { k: 'draw', d: 0, len: 2 }, style: 'animation-timing-function:linear' })),
      step(2, 'the rest of the gain curve, up to 10,000 Hz',
        poly(ptsTo(3400, 10000), { cls: 'b11-ex', pathLength: 1, anim: { k: 'draw', d: 2, len: 1.6 } })),
      mark('circle', g34, y34, 'b11-m-ex'),
      text(g34 + 10, y34 - 8, '71%', { anchor: 'start', cls: 'k-num' }),
      step(3, 'at 3,400 Hz the bottom of H is an arrow pointing straight up, length 1.41, so the gain is 71%',
        g({ anim: { k: 'in', d: 3.6, len: 0.6 } },
          line(inset.x - 10, inset.y, inset.x + iu * 1.6, inset.y, { cls: 'k-axis' }), line(inset.x, inset.y + 10, inset.x, inset.y - iu * 1.75, { cls: 'k-axis' }),
          line(inset.x, inset.y, inset.x, inset.y - iu * Math.SQRT2, { cls: 'b11-vec-accent', 'marker-end': `url(#${L.slug}-arrow-accent)` }),
          text(inset.x + 10, inset.y - iu * Math.SQRT2 + 4, 'j√2', { anchor: 'start', cls: 'k-num-accent' }))),
      ph ? g({}, text(20, inset.y - 108, 'the bottom of H at 3,400 Hz (u = 1):', { anchor: 'start', cls: 'k-label' }),
        text(160, inset.y - 50, '(1 − 1) + j√2 = j√2', { anchor: 'start', cls: 'k-num' }),
        text(160, inset.y - 28, 'length 1.41, so', { anchor: 'start', cls: 'k-num' }),
        text(160, inset.y - 6, 'gain 1 ÷ 1.41 = 71%', { anchor: 'start', cls: 'k-num' }))
        : g({}, text(inset.x - 20, 84, 'bottom of H at 3,400 Hz,', { anchor: 'start', cls: 'k-label' }),
          text(inset.x - 20, 104, 'where u = 1:', { anchor: 'start', cls: 'k-label' }),
          text(inset.x - 20, 130, '(1 − u²) + j√2 u = j√2', { anchor: 'start', cls: 'k-num' }),
          text(inset.x - 20, inset.y + 30, 'length 1.41, so', { anchor: 'start', cls: 'k-label' }),
          text(inset.x - 20, inset.y + 50, 'gain = 1 ÷ 1.41 = 71%', { anchor: 'start', cls: 'k-num' })),
    ];
  };

  const bilinear = L => {
    const ph = L.phone;
    const { b, a } = SCRIPT;
    const f4 = v => fmt(v, 4);
    const lay = ph
      ? { fx: 180, fy: 54, bx: 40, by: 132, bw: 280, bh: 66, cells: [[24, 300], [104, 300], [184, 300]], sig: [180, 392], outs: [[24, 470], [104, 470], [184, 470]], cw: 66 }
      : { fx: 132, fy: 70, bx: 262, by: 44, bw: 236, bh: 72, cells: [[40, 210], [130, 210], [220, 210]], sig: [350, 290], outs: [[430, 210], [520, 210], [610, 210]], cw: 72 };
    const cell = ([x, y], s) => g({}, rect(x, y, lay.cw, 30, { cls: 'b11-cell', rx: 3 }), text(x + lay.cw / 2, y + 20, s, { cls: 'k-num' }));
    const [sx, sy] = lay.sig;
    const inputs = ['x[n]', 'x[n−1]', 'x[n−2]'], outs = ['y[n]', 'y[n−1]', 'y[n−2]'];
    const formula = g({},
      text(lay.fx - 70, lay.fy, 'H(s) =', { anchor: 'end', cls: 'k-math' }),
      text(lay.fx + 20, lay.fy - 10, 'Ωc²', { cls: 'k-math' }),
      line(lay.fx - 64, lay.fy - 4, lay.fx + 104, lay.fy - 4, { cls: 'k-line' }),
      text(lay.fx + 20, lay.fy + 18, 's² + √2 Ωc s + Ωc²', { cls: 'k-math' }));
    const tapLabel = (x, y, v) => text(x + 6, y, `× ${f4(v)}`, { anchor: 'start', cls: 'k-tick' });
    if (ph) {
      const ins = [[20, 290], [100, 290], [180, 290]], fb = [[100, 444], [180, 444]], S = [300, 372], busY = 372, fbY = 414;
      return [
        step(1, "the exchange's formula in s goes in", g({ anim: { k: 'in', d: 0, len: 0.8 } }, formula)),
        arrow(L.slug, [[180, 84], [180, lay.by - 4]]),
        step(2, 'the substitution replaces every s', g({ anim: { k: 'in', d: 1, len: 0.8 } }, box(lay.bx, lay.by, lay.bw, lay.bh, { name: 'replace every s by', sub: '16,000 (1 − z⁻¹) ÷ (1 + z⁻¹)' }))),
        arrow(L.slug, [[180, lay.by + lay.bh + 2], [180, 252]]),
        step(3, 'out comes a program: three input taps forward, two feedback taps',
          g({ anim: { k: 'in', d: 2, len: 0.8 } },
            text(20, 278, 'inputs, forward', { anchor: 'start', cls: 'k-label' }),
            ins.map((c, i) => g({}, cell(c, inputs[i]), line(c[0] + lay.cw / 2, c[1] + 30, c[0] + lay.cw / 2, busY, { cls: 'k-arrow' }), tapLabel(c[0] + lay.cw / 2, c[1] + 58, b[i]))),
            arrow(L.slug, [[20 + lay.cw / 2, busY], [S[0] - 18, busY]]),
            circle(S[0], S[1], 15, { cls: 'b11-cell' }), text(S[0], S[1] + 6, 'Σ', { cls: 'k-name' }),
            g({}, rect(267, 290, 66, 30, { cls: 'b11-cell', rx: 3 }), text(300, 310, 'y[n]', { cls: 'k-num' })),
            arrow(L.slug, [[S[0], S[1] - 15], [S[0], 324]]),
            fb.map((c, i) => g({}, cell(c, outs[i + 1]), line(c[0] + lay.cw / 2, c[1], c[0] + lay.cw / 2, fbY, { cls: 'k-arrow' }), tapLabel(c[0] + lay.cw / 2, c[1] - 12, -a[i]))),
            path(`M${fb[0][0] + lay.cw / 2} ${fbY}H${S[0]}V${S[1] + 19}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
            text(20, 496, 'outputs, fed back', { anchor: 'start', cls: 'k-label' }))),
        text(20, 540, 'the five numbers the script handed back', { anchor: 'start', cls: 'k-tick' }),
      ];
    }
    const busY = sy;
    return [
      step(1, "the exchange's formula in s goes in", g({ anim: { k: 'in', d: 0, len: 0.8 } }, formula)),
      arrow(L.slug, [[lay.fx + 112, 80], [lay.bx - 4, 80]]),
      step(2, 'the substitution replaces every s', g({ anim: { k: 'in', d: 1, len: 0.8 } }, box(lay.bx, lay.by, lay.bw, lay.bh, { name: 'replace every s by', sub: '16,000 (1 − z⁻¹) ÷ (1 + z⁻¹)' }))),
      arrow(L.slug, [[lay.bx + lay.bw + 2, 80], [560, 80], [560, 170]]),
      text(568, 140, 'out comes', { anchor: 'start', cls: 'k-label' }), text(568, 158, 'a program', { anchor: 'start', cls: 'k-label' }),
      step(3, 'out comes a program: three input taps forward, two feedback taps',
        g({ anim: { k: 'in', d: 2, len: 0.8 } },
          text(40, 196, 'inputs, forward', { anchor: 'start', cls: 'k-label' }), text(520, 196, 'outputs, fed back', { anchor: 'start', cls: 'k-label' }),
          lay.cells.map((c, i) => g({}, cell(c, inputs[i]), line(c[0] + lay.cw / 2, c[1] + 30, c[0] + lay.cw / 2, busY, { cls: 'k-arrow' }), tapLabel(c[0] + lay.cw / 2, c[1] + 56, b[i]))),
          line(40 + lay.cw / 2, busY, sx - 16, busY, { cls: 'k-arrow' }),
          circle(sx, busY, 15, { cls: 'b11-cell' }), text(sx, busY + 6, 'Σ', { cls: 'k-name' }),
          path(`M${sx} ${busY - 15}V225H${lay.outs[0][0] - 4}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
          lay.outs.map((c, i) => cell(c, outs[i])),
          [1, 2].map(i => g({}, line(lay.outs[i][0] + lay.cw / 2, lay.outs[i][1] + 30, lay.outs[i][0] + lay.cw / 2, busY, { cls: 'k-arrow' }), tapLabel(lay.outs[i][0] + lay.cw / 2, lay.outs[i][1] + 56, -a[i - 1]))),
          path(`M${lay.outs[2][0] + lay.cw / 2} ${busY}H${sx + 19}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }))),
      text(40, 340, 'the five numbers the script handed back, as a program you can run', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const zplane = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [180, 196, 112] : [190, 196, 120];
    const P = ph ? plot({ x: 56, y: 430, w: 264, h: 150, xs: [0, 4000], ys: [0, 1.05] }) : plot({ x: 410, y: 70, w: 260, h: 200, xs: [0, 4000], ys: [0, 1.05] });
    const rp = Math.sqrt(SCRIPT.a[1]), ap = Math.acos(-SCRIPT.a[0] / (2 * rp)) * 180 / Math.PI;
    const fEnd = 2363, aEnd = 180 * fEnd / 4000;
    const [dx, dy] = [cx + R * cosd(aEnd), cy - R * sind(aEnd)];
    const lin = 'animation-timing-function:linear';
    const sweep = g({ anim: { k: 'turn', r0: '180deg', steps: 60, d: 0, len: 3 }, style: `transform-origin:${cx}px ${cy}px;${lin}` },
      g({ anim: { k: 'turn', r0: `${r2(aEnd - 180)}deg`, steps: 30, d: 3, len: 1.4 }, style: `transform-origin:${cx}px ${cy}px;${lin}` },
        line(cx, cy, dx, dy, { cls: 'b11-ref' }), circle(dx, dy, 7, { cls: 'k-dot' })));
    const cursor = g({ anim: { k: 'move', dx: P.X(0) - P.X(4000), d: 0, len: 3 }, style: lin },
      g({ anim: { k: 'move', dx: P.X(4000) - P.X(fEnd), d: 3, len: 1.4 }, style: lin }, line(P.X(fEnd), P.y0, P.X(fEnd), P.y1, { cls: 'k-stem-accent' })));
    const guide = arc(cx, cy, R + 18, 8, 172);
    return [
      line(cx - R - 20, cy, cx + R + 20, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'b11-rim' }),
      g({ cls: 'k-faint' }, poly(guide.slice(0, -1), { cls: 'b11-ref' }), headAt(guide[guide.length - 1][0], guide[guide.length - 1][1], 262, 'b11-head', 8, 3.5)),
      text(cx, cy - R - 30, ph ? 'the tone sweeps 0 to 4,000 Hz' : 'the tone sweeps the top half, 0 to 4,000 Hz', { cls: 'k-label' }),
      text(cx + R + 4, cy + 18, '0 Hz', { anchor: 'start', cls: 'k-tick' }), text(cx - R - 10, cy + 20, '4,000 Hz', { anchor: 'end', cls: 'k-tick' }),
      zeroO(cx - R, cy, 7), text(cx - R + 12, cy - 10, '2', { anchor: 'start', cls: 'k-num' }),
      [1, -1].map(s => g({}, line(cx, cy, cx + rp * R * cosd(s * ap), cy - rp * R * sind(s * ap), { cls: 'b11-spoke-cp' }), poleX(cx + rp * R * cosd(s * ap), cy - rp * R * sind(s * ap), 6))),
      text(cx - R, cy + R + 30, 'circle: double zero at z = −1 (4,000 Hz)', { anchor: 'start', cls: 'k-label' }),
      text(cx - R, cy + R + 50, 'crosses: poles, radius 0.44', { anchor: 'start', cls: 'k-label' }),
      axes(P, { yTicks: gainTicks, xTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']], zero: false, yTitle: ph ? 'the copy’s gain' : 'the script’s copy: gain' }),
      level(P, 0, 4000, 'right'),
      series(P, 'cp', cp, [1000, 2000, 3000, 3400]),
      step(1, 'the tone dot sweeps from 0 Hz to 4,000 Hz and back to 2,363 Hz while the cursor tracks the gain', sweep, cursor),
      step(2, 'at 2,363 Hz the copy passes 71%',
        g({ anim: { k: 'in', d: 4.4, len: 0.5 } }, circle(P.X(fEnd), P.Y(Math.SQRT1_2), 5, { cls: 'k-stem-accent-dot' }),
          text(P.X(fEnd) - 8, P.Y(0.3), '2,363 Hz:', { anchor: 'end', cls: 'k-num-accent' }), text(P.X(fEnd) - 8, P.Y(0.3) + 16, '71%', { anchor: 'end', cls: 'k-num-accent' }),
          text(dx - 10, dy - 12, '2,363 Hz', { anchor: 'end', cls: 'k-num-accent' }))),
      text(P.x1, P.y1 + 38, 'digital tone f, from 0', { anchor: 'end', cls: 'k-tick' }),
    ];
  };

  const echo = L => {
    const ph = L.phone;
    const y = click(PRE);
    const P = ph ? plot({ x: 50, y: 60, w: 280, h: 190, xs: [-0.5, 9.5], ys: [-0.4, 0.8] }) : plot({ x: 70, y: 62, w: 330, h: 200, xs: [-0.5, 9.5], ys: [-0.4, 0.8] });
    const [cx, cy, R] = ph ? [180, 440, 100] : [556, 160, 96];
    const pole = (flt, cls, spoke) => {
      const rp = Math.sqrt(flt.a[1]), ap = Math.acos(-flt.a[0] / (2 * rp)) * 180 / Math.PI;
      return [1, -1].map(s => { const x = cx + rp * R * cosd(s * ap), yy = cy - rp * R * sind(s * ap); return g({}, line(cx, cy, x, yy, { cls: spoke }), poleX(x, yy, 6, cls)); });
    };
    return [
      text(P.x0, P.y0 - 30, ph ? 'the prewarped copy’s echo' : 'one click in: the prewarped copy’s echo', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[0.5, '0.5'], [0, '0'], [-0.25, `${M}0.25`]], xTicks: [[0, 'n = 0'], [3, '3'], [6, '6'], [9, '9']] }),
      stems(P, y.map((v, n) => [n, v]), { dot: 4.5, labels: (v, n) => (n <= 3 ? fmt(v, 4) : ''), labelCls: ph ? 'k-tick' : 'k-num' }),
      text(P.x1, P.y1 + 40, ph ? 'after n = 3: no numbers' : 'flips sign and dies; after n = 3, no numbers', { anchor: 'end', cls: 'k-tick' }),
      text(cx, cy - R - 26, ph ? 'its poles' : 'its poles on the unit circle', { cls: 'k-name' }),
      line(cx - R - 16, cy, cx + R + 16, cy, { cls: 'k-axis' }), line(cx, cy - R - 10, cx, cy + R + 10, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'b11-rim' }),
      zeroO(cx - R, cy, 6.5), text(cx - R - 10, cy - 8, '2', { anchor: 'end', cls: 'k-num' }),
      g({ cls: 'k-faint' }, pole(SCRIPT, 'b11-pole-old', 'b11-spoke-cp')),
      pole(PRE, 'b11-pole', 'b11-spoke-pw'),
      key(ph ? 20 : cx - R - 30, cy + R + 36, [['old', 'script’s copy: radius 0.44'], ['new', 'prewarped: 0.72, near 3,560 Hz']], { cols: 1, dy: 24 }),
    ];
  };

  const squeezed = L => {
    const ph = L.phone;
    const C = unwarp(3400);
    const A = ph ? plot({ x: 30, y: 74, w: 300, h: 100, xs: [0, 20000], ys: [0, 1.05] }) : plot({ x: 60, y: 70, w: 600, h: 100, xs: [0, 20000], ys: [0, 1.05] });
    const B = ph ? plot({ x: 30, y: 316, w: 300, h: 100, xs: [0, 4000], ys: [0, 1.05] }) : plot({ x: 60, y: 286, w: 600, h: 100, xs: [0, 4000], ys: [0, 1.05] });
    const links = [5000, C, 20000];
    return [
      text(A.x0, A.y0 - 36, ph ? 'the 10,607 Hz prototype, on the ruler' : 'the 10,607 Hz prototype, on the analog ruler', { anchor: 'start', cls: 'k-name' }),
      step(1, 'the prototype from 0 to 20,000 Hz, its stretch from 0 to 10,607 Hz highlighted',
        g({ anim: { k: 'in', d: 0, len: 0.8 } }, rect(A.X(0), A.y0, A.X(C) - A.X(0), A.h, { cls: 'b11-stretch' }), curve(A, F => ex(F, C), { cls: 'b11-ex', n: 300 }))),
      axes(A, { xTicks: [[0, '0'], [5000, '5,000'], [C, '10,607'], [20000, '20,000']], zero: false }),
      text(A.x1, A.y1 + 36, ph ? 'analog F, Hz' : 'analog frequency F, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      step(2, 'each analog frequency squeezes onto its digital tone: 5,000 to 2,800, 10,607 to 3,400, 20,000 to 3,678',
        links.map((F, i) => line(A.X(F), A.y1 + 44, B.X(warp(F)), B.y0 - 10, { cls: F === C ? 'b11-tick-accent' : 'b11-ref', pathLength: 1, anim: { k: 'draw', d: 1 + i * 0.5, len: 1.2 } }))),
      step(3, 'on the line the stretch fills 0 to 3,400 Hz and stays nearly flat',
        g({ anim: { k: 'in', d: 3.4, len: 0.8 } }, rect(B.X(0), B.y0, B.X(3400) - B.X(0), B.h, { cls: 'b11-stretch' }), series(B, 'pw', pw, [1000, 2000, 3000, 3400]))),
      text(B.x0 + 8, B.y1 - 14, 'the prewarped copy, on your line', { anchor: 'start', cls: 'k-name' }),
      axes(B, { xTicks: ph ? [[0, '0'], [2000, '2,000'], [3400, '3,400'], [4000, '4,000']] : [[0, '0'], [1000, '1,000'], [2000, '2,000'], [2800, '2,800'], [3400, '3,400'], [3678, '3,678']], zero: false }),
      ph ? '' : text(B.x1 + 4, B.y1 + 18, '4,000', { anchor: 'start', cls: 'k-tick' }),
      text(B.x1, B.y1 + 36, ph ? 'digital f, Hz' : 'digital tone f, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      ph ? key(30, B.y1 + 66, [['stretch', '0 to 10,607 Hz, landing in 0 to 3,400 Hz']], { cols: 1 })
        : key(60, B.y1 + 66, [['stretch', 'the stretch from 0 to 10,607 Hz, landing in 0 to 3,400 Hz: gain 100% down to 71%']], { cols: 1 }),
    ];
  };

  const overlay = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 48, y: 50, w: 276, h: 210, xs: [0, 4000], ys: [0, 1.05] }) : plot({ x: 76, y: 60, w: 540, h: 220, xs: [0, 4000], ys: [0, 1.05] });
    const tones = [2000, 3000, 3400];
    const row = P.y1 + 38;
    const brk = (f, v1, v2) => g({}, line(P.X(f) + 7, P.Y(v1), P.X(f) + 7, P.Y(v2), { cls: 'b11-ref' }), line(P.X(f) + 3, P.Y(v1), P.X(f) + 11, P.Y(v1), { cls: 'b11-ref' }), line(P.X(f) + 3, P.Y(v2), P.X(f) + 11, P.Y(v2), { cls: 'b11-ref' }));
    return [
      axes(P, { yTicks: gainTicks, xTicks: ph ? [[0, '0'], [2000, '2,000'], [4000, '4,000']] : [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000']], zero: false, yTitle: 'gain: how much passes' }),
      level(P),
      drop(P, 3400, Math.SQRT1_2, row - 14), drop(P, 2363, Math.SQRT1_2, row - 14),
      series(P, 'cp', cp, tones),
      series(P, 'pw', pw, tones),
      series(P, 'ex', f => ex(f), tones),
      text(P.X(2363), row, ph ? '2,363' : '2,363 Hz', { cls: 'k-num' }), text(P.X(3400), row, ph ? '3,400' : '3,400 Hz', { cls: 'k-num' }),
      brk(4000, ex(4000), 0),
      ph ? '' : g({},
        text(P.X(3000), P.y0 - 18, `3,000 Hz: ${pc(ex(3000))} against ${pc(pw(3000))}`, { cls: 'k-num' }),
        line(P.X(3000), P.y0 - 12, P.X(3000), P.Y(pw(3000)) - 8, { cls: 'b11-ref' }),
        text(P.X(4000) + 16, P.Y(0.3), '4,000 Hz:', { anchor: 'start', cls: 'k-num' }),
        text(P.X(4000) + 16, P.Y(0.3) + 18, `${pc(ex(4000))}`, { anchor: 'start', cls: 'k-num' }),
        text(P.X(4000) + 16, P.Y(0.3) + 36, 'against 0%', { anchor: 'start', cls: 'k-num' })),
      text(P.x1, row + 20, 'digital tone f, in Hz, from 0', { anchor: 'end', cls: 'k-tick' }),
      ph ? g({}, key(28, row + 50, [['ex', 'the old exchange'], ['cp', 'the script’s copy'], ['pw', 'the prewarped copy']], { cols: 1 }),
        text(28, row + 128, `3,000 Hz: ${pc(ex(3000))} against ${pc(pw(3000))}`, { anchor: 'start', cls: 'k-num' }),
        text(28, row + 148, `4,000 Hz: ${pc(ex(4000))} against 0%`, { anchor: 'start', cls: 'k-num' }))
        : key(P.x0 - 40, row + 52, [['ex', 'the old exchange'], ['cp', 'the script’s copy'], ['pw', 'the prewarped copy']], { dx: 210 }),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: css.replace(/\n/g, ' ').trim(), eyebrow: 'Lesson 11 · the bilinear transform', body: (kk, L) => body(L) });

  return [
    fig('overlay-bug', [380, 440], 'The copy falls apart up high',
      'Gain from 0 to 4,000 Hz: the old exchange, solid with circles, crosses 71% at 3,400 Hz; your copy, dashed with squares, crosses it at 2,363 Hz; at 3,400 Hz they pass 70.7% and 10.2%.',
      'The technician’s two columns as curves. Low tones match; the higher the tone, the further the copy falls below the exchange.', overlayBug),
    fig('analog', [420, 440], 'Analog and digital filters',
      'Top: a smooth voltage flows through an analog filter of capacitors and coils, and its frequency axis runs on forever. Bottom: samples, 8,000 a second, tick through a digital filter, and its frequency axis stops at 4,000 Hz.',
      'An analog filter works on the voltage itself, every instant, and has a response at every frequency. A digital filter works on samples and stops at 4,000 Hz.', analog, 2),
    fig('prototype', [370, 380], 'The exchange’s gain, past the wall',
      'The exchange’s gain from 0 to 10,000 Hz: 70.7% at 3,400 Hz, 42.0% at 5,000 Hz and 11.5% at 10,000 Hz; a wall at 4,000 Hz marks where your line stops, and the curve runs straight past it.',
      'The analog prototype: the exchange’s filter. It has a response far beyond 4,000 Hz, where your line cannot follow.', prototype),
    fig('wrap-vs-squeeze', [400, 674], 'Wrap it, or squeeze it',
      'Left: the exchange’s echo to a click, sampled: the analog ruler wraps around the half circle in 4,000 Hz laps, inner ring 0 to 4,000 Hz, middle 4,000 to 8,000, outer 8,000 to 12,000, so 5,000 Hz lands on 3,000 Hz. Right: the same ruler bent once onto the half circle, its ticks 0, 1,000, 2,000, 3,400, 5,000, 10,000 and 100,000 even near 0 Hz and bunching toward 4,000 Hz, where infinity lands.',
      'Wrapping lays the ruler round and round, so different frequencies share a spot. Squeezing bends it on once, so every frequency gets its own spot.', wrapSqueeze, 2),
    fig('arctan', [340, 380], 'The shape of arctan',
      'y = arctan x for x from 0 to 20: it starts along the diagonal y = x, bends, and flattens under a ceiling at π/2, which is 90 degrees.',
      'Small inputs come back almost unchanged; big ones crowd under the ceiling.', arctanFig),
    fig('warping', [380, 420], 'The warping curve',
      'Digital tone f against analog frequency F from 0 to 20,000 Hz: the curve hugs the line f = F at first, then flattens under 4,000 Hz. Read up and across, 3,400 Hz lands on 2,363 Hz; read across and down, 3,000 Hz comes from 6,148 Hz.',
      'Read up from the analog axis to find where a frequency lands; read across from the digital axis to find what lands there.', warping),
    fig('arrows', [300, 440], 'An arrow and its mirror',
      'An arrow at 50 degrees and its mirror at minus 50 degrees on the unit circle: their sum lies flat, 2 cos 50° = 1.29; their difference points straight up, 2 sin 50° = 1.53.',
      'Add an arrow and its mirror and the up-down parts cancel. Subtract them and the left-right parts cancel.', arrows, 3),
    fig('two-radians', [320, 340], 'Two kinds of radian',
      'Two axes: ω in radians per sample runs from 0 to π (0 to 4,000 Hz) and stops; Ω in radians per second runs from 0 on forever. 3,400 Hz sits at 0.85π on the first and at 21,363 on the second.',
      'Digital tones count turns per sample and stop at π. Analog frequencies count turns per second and never stop.', twoRadians),
    fig('s-line', [360, 560], 'Climbing the analog ruler',
      'The analog ruler drawn as the line s = j2πF; a dot climbs it while the size of H traces the gain curve 1 over the root of 1 + (F/3400)^4. At 3,400 Hz the bottom of H is the arrow j√2, length 1.41, so the gain is 71%.',
      'Walk up the ruler and read the size of H: it is the manual’s gain formula. At 3,400 Hz the bottom of H points straight up.', sLine, 3),
    fig('bilinear', [360, 560], 'The bilinear transform as a machine',
      'The exchange’s formula in s goes into a box that replaces every s by 16,000 (1 − z⁻¹) ÷ (1 + z⁻¹); out comes a program: x[n], x[n−1] and x[n−2] times 0.3817, 0.7633 and 0.3817 forward, and y[n−1] and y[n−2] times −0.3351 and −0.1915 fed back.',
      'One substitution turns a formula in s into five numbers you can run, sample by sample.', bilinear, 3),
    fig('zplane', [380, 620], 'The script’s filter on the circle',
      'The unit circle with the script’s filter: a double zero at the far left, z = −1, and a pole pair at radius 0.44. A tone dot sweeps the top half; beside it the copy’s gain falls from 100% to 0% at 4,000 Hz, and the dot rests at 2,363 Hz, where the copy passes 71%.',
      'The double zero sits on 4,000 Hz, where infinity landed. The poles sit well inside the circle: the filter is stable.', zplane, 2),
    fig('prewarp', [380, 420], 'Prewarping: read the curve backward',
      'The warping curve read backward: from 3,400 Hz on the digital axis across to the curve, then down to 10,607 Hz on the analog axis.',
      'Start where you want the cutoff to land, and read back to the analog frequency that lands there.', prewarp, 2),
    fig('echo', [360, 640], 'The prewarped copy’s echo',
      'One click into the prewarped copy: the output 0.7157, 0.4660, −0.2807, 0.1392 and on, flipping sign at almost every sample from n = 1 and dying. Its poles sit at radius 0.72 near 3,560 Hz, beside the script’s copy’s poles at radius 0.44.',
      'From n = 1 on, the echo flips sign at almost every sample: the new poles sit near the far left of the circle, where a tone turns almost half a turn per sample. Both pairs are inside it: stable.', echo),
    fig('squeezed-prototype', [480, 520], 'The prototype, squeezed onto the line',
      'The 10,607 Hz prototype on the analog ruler from 0 to 20,000 Hz, its stretch from 0 to 10,607 Hz highlighted; squeezed onto the line, that stretch fills 0 to 3,400 Hz, where the prewarped copy stays nearly flat.',
      'The whole nearly flat stretch of the prototype lands below 3,400 Hz. That is why the prewarped copy is flatter than the exchange.', squeezed, 3),
    fig('overlay', [400, 480], 'Three curves, one pinned point',
      'Gain from 0 to 4,000 Hz for the exchange (solid, circles), the script’s copy (dashed, squares) and the prewarped copy (dotted, triangles): the exchange and the prewarped copy cross 71% together at 3,400 Hz, the script’s copy at 2,363 Hz. At 3,000 Hz: 78.9% against 94.8%; at 4,000 Hz: 58.6% against 0%.',
      'Prewarping pins one point. Below it the prewarped copy is flatter than the exchange, above it steeper.', overlay),
  ];
};
