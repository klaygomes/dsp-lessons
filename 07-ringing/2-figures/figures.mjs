export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, curve, stems, step, fmt, cosd, sind, range } = k;
  const FS = 8000, M = '−';
  const gainAt = (r, f) => {
    const w = 2 * Math.PI * f / FS, r2 = r * r;
    return ((1 + r2) / 2) * Math.abs(2 * Math.cos(w)) / Math.hypot(1 + r2 * Math.cos(2 * w), r2 * Math.sin(2 * w));
  };
  const peakAt = f => { const w = 2 * Math.PI * f / FS; return 0.2123 / Math.hypot(1 + 0.81 * Math.cos(2 * w), 0.81 * Math.sin(2 * w)); };
  const decayN = r => Math.log(0.01) / Math.log(r);
  const edge = (r, level, side) => {
    let lo = side < 0 ? 0 : 2000, hi = side < 0 ? 2000 : 4000;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, gm = gainAt(r, m); if ((side < 0) === (gm > level)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const bandwidth = r => edge(r, Math.SQRT1_2, 1) - edge(r, Math.SQRT1_2, -1);
  const respond = (x, r) => { const b = (1 + r * r) / 2, y = []; x.forEach((v, n) => y.push(b * (v + (n >= 2 ? x[n - 2] : 0)) - (n >= 2 ? r * r * y[n - 2] : 0))); return y; };
  const click = len => range(0, len - 1).map(n => (n ? 0 : 1));
  const hz = f => Math.round(f).toLocaleString('en-US');
  const r2 = v => Math.round(v * 100) / 100;
  const poly = (pts, o = {}) => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), o);

  const SERIES = {
    0.9: { cls: 'r7-s90', shape: 'circle', name: 'radius 0.90' },
    0.95: { cls: 'r7-s95', shape: 'square', name: 'radius 0.95' },
    0.98: { cls: 'r7-s98', shape: 'triangle', name: 'radius 0.98' },
  };
  const mark = (shape, x, y, o = {}) => {
    const { cls = 'r7-m', size = 4.5 } = o;
    if (shape === 'square') return rect(x - size + 0.5, y - size + 0.5, 2 * size - 1, 2 * size - 1, { cls });
    if (shape === 'triangle') return path(`M${r2(x)} ${r2(y - size - 1)}L${r2(x + size + 0.5)} ${r2(y + size - 0.5)}L${r2(x - size - 0.5)} ${r2(y + size - 0.5)}Z`, { cls });
    return circle(x, y, size, { cls });
  };
  const keyRow = (x, y, items, o = {}) => {
    const { dx = 220, dy = 22, cols = items.length, slug } = o;
    return g({}, items.map(([kind, label, extra = {}], i) => {
      const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
      let sw;
      if (kind === 'hatch') sw = rect(lx + 2, ly - 9, 18, 14, { fill: `url(#${slug}-hatch)`, cls: 'k-bar-hatch' });
      else if (kind === 'outline') sw = rect(lx + 2, ly - 9, 18, 14, { cls: 'r7-outline' });
      else if (kind === 'dot') sw = circle(lx + 11, ly - 2, 5, { cls: 'k-stem-dot' });
      else if (kind === 'bar') sw = rect(lx + 2, ly - 9, 18, 14, { cls: extra.cls || 'k-bar' });
      else if (kind === 'stem') sw = g({}, line(lx + 11, ly + 5, lx + 11, ly - 8, { cls: extra.cls || 'k-stem' }), mark(extra.shape || 'circle', lx + 11, ly - 8, { cls: extra.mcls || 'k-stem-dot', size: 4 }));
      else if (kind === 'cross') sw = g({}, poleX(lx + 11, ly - 2, 5));
      else sw = g({}, line(lx, ly - 2, lx + 26, ly - 2, { cls: kind }), extra.shape ? mark(extra.shape, lx + 13, ly - 2, { size: 4 }) : '');
      return g({}, sw, text(lx + 34, ly + 2, label, { anchor: 'start', cls: 'k-label' }));
    }));
  };
  const poleX = (x, y, s = 6, cls = 'r7-pole') => g({}, line(x - s, y - s, x + s, y + s, { cls }), line(x - s, y + s, x + s, y - s, { cls }));
  const zeroO = (x, y, s = 5.5) => circle(x, y, s, { cls: 'r7-zero' });
  const bracketH = (x1, x2, y, o = {}) => {
    const { cls = 'r7-bracket', tick = 6 } = o;
    return g({}, line(x1, y, x2, y, { cls }), line(x1, y - tick, x1, y + tick, { cls }), line(x2, y - tick, x2, y + tick, { cls }));
  };
  const bracketV = (x, y1, y2, o = {}) => {
    const { cls = 'r7-bracket', tick = 5 } = o;
    return g({}, line(x, y1, x, y2, { cls }), line(x - tick, y1, x + tick, y1, { cls }), line(x - tick, y2, x + tick, y2, { cls }));
  };
  const zeroDots = (P, ns, rr = 2.2) => g({}, ns.map(n => circle(P.X(n), P.Y(0), rr, { cls: 'k-stem-dot' })));
  const ringStems = (P, ys, from, o = {}) => stems(P, ys.map((v, n) => [n, v]).filter(([n, v]) => n >= from && Math.abs(v) > 1e-9), { dot: o.dot ?? 3.5, ...o });

  const css = `
.k-fig .r7-s90 { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .r7-s95 { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 9 3 2 3; fill: none; }
.k-fig .r7-s98 { stroke: var(--ink); stroke-width: 2.2; stroke-dasharray: 0.5 4; stroke-linecap: round; fill: none; }
.k-fig .r7-m { fill: var(--ink); stroke: var(--paper); stroke-width: 1; }
.k-fig .r7-m-accent { fill: var(--accent); stroke: var(--paper); stroke-width: 1; }
.k-fig .r7-m-hollow { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
.k-fig .r7-pole { stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; }
.k-fig .r7-zero { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .r7-rim { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .r7-bracket { stroke: var(--ink); stroke-width: 1.4; fill: none; }
.k-fig .r7-bracket-accent { stroke: var(--accent); stroke-width: 1.8; fill: none; }
.k-fig .r7-result { stroke: var(--accent); stroke-width: 2.5; fill: none; }
.k-fig .r7-result-dot { fill: var(--accent); }
.k-fig .r7-shade { fill: var(--paper-2); }
.k-fig .r7-click { stroke: var(--ink); stroke-width: 4.5; }
.k-fig .r7-spiral { stroke: var(--ink); stroke-width: 1.6; fill: none; }
.k-fig .r7-drop { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 2 3; }
.k-fig .r7-env { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 5; fill: none; }
.k-fig .r7-level { stroke: var(--ink-soft); stroke-width: 1; stroke-dasharray: 3 4; }
.k-fig .r7-hatch-line { stroke: var(--accent); stroke-width: 1.5; }
.k-fig .r7-span { fill: var(--ink-soft); opacity: 0.35; }
.k-fig .r7-answer { fill: var(--input-soft); stroke: var(--input); stroke-width: 1.2; }
.k-fig .r7-turn { stroke: var(--ink-soft); stroke-width: 1.6; fill: none; }
.k-fig .r7-head-soft { fill: var(--ink-soft); }
.k-fig .r7-outline { fill: var(--paper); stroke: var(--ink); stroke-width: 1.8; }
.k-fig .r7-plate { fill: var(--paper-2); }
.k-fig .r7-softline { stroke: var(--ink-soft); stroke-width: 1.8; fill: none; }
.k-fig .r7-op { font-family: var(--font-body); font-weight: 500; font-size: 26px; fill: var(--ink); }
`;

  const meter = L => {
    const ph = L.phone;
    const [A, B] = ph
      ? [plot({ x: 40, y: 70, w: 290, h: 120, xs: [0, 4000], ys: [0, 1.15] }), plot({ x: 40, y: 290, w: 290, h: 120, xs: [0, 4000], ys: [0, 1.15] })]
      : [plot({ x: 60, y: 70, w: 270, h: 150, xs: [0, 4000], ys: [0, 1.15] }), plot({ x: 410, y: 70, w: 270, h: 150, xs: [0, 4000], ys: [0, 1.15] })];
    const flat = 0.3, peak = f => peakAt(f) / 1.1173 * 0.95;
    const ticks = [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']];
    const fillPath = P => {
      const pts = range(0, 240).map(i => [P.X(4000 * i / 240), P.Y(peak(4000 * i / 240))]);
      return path(`M${r2(P.x0)} ${r2(P.Y(0))}` + pts.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join('') + `L${r2(P.x1)} ${r2(P.Y(0))}Z`, { fill: `url(#${L.slug}-hatch)`, cls: 'r7-hatch-line' });
    };
    const spikeL = B.X(1650), spikeR = B.X(2350);
    return [
      [A, B].map(P => g({}, axes(P, { xTicks: ticks, yTicks: [[0, '0']], zero: false }), text(P.x0, P.y0 - 10, 'strength, from 0', { anchor: 'start', cls: 'k-tick' }))),
      text(A.x0, A.y0 - 34, 'what a click should look like', { anchor: 'start', cls: 'k-name' }),
      text(B.x0, B.y0 - 34, 'what the meter showed', { anchor: 'start', cls: 'k-name' }),
      line(A.x0, A.Y(flat), A.x1, A.Y(flat), { cls: 'k-curve-soft' }),
      line(B.x0, B.Y(flat), spikeL, B.Y(flat), { cls: 'k-curve-soft' }), line(spikeR, B.Y(flat), B.x1, B.Y(flat), { cls: 'k-curve-soft' }),
      fillPath(B),
      text(B.X(2260), B.Y(0.84), 'one thin spike', { anchor: 'start', cls: 'k-note-accent' }),
      ph ? keyRow(30, 470, [['k-curve-soft', 'a click: every tone a little'], ['hatch', 'the ring left after the click']], { cols: 1, slug: L.slug })
        : keyRow(80, 282, [['k-curve-soft', 'a click: every tone a little'], ['hatch', 'the ring left after the click, at 2,000 Hz']], { dx: 280, slug: L.slug }),
    ];
  };

  const splitZero = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 30, y: 60, w: 316, h: 230, xs: [-3.7, 7.5], ys: [-0.3, 1.25] }) : plot({ x: 60, y: 60, w: 630, h: 220, xs: [-2.2, 8.5], ys: [-0.3, 1.25] });
    const x0 = P.X(0), bw = ph ? 20 : 26, last = ph ? 7 : 8;
    const ring = [0, 0, 0.172, 0, -0.139, 0, 0.113, 0, -0.091];
    const ax = x0 + bw / 2 + 12;
    return [
      axes(P, { xTicks: range(0, last).map(n => [n, n ? String(n) : ph ? '0' : 'n = 0']), yTicks: [[0, '0']] }),
      ph ? text(P.x0 + 8, P.y1 + 18, 'n', { anchor: 'start', cls: 'k-tick' }) : '',
      text(P.x0, 30, 'y[n]: the notch’s answer to one click', { anchor: 'start', cls: 'k-name' }),
      rect(x0 - bw / 2, P.Y(1.1173), bw, P.Y(0) - P.Y(1.1173), { cls: 'r7-outline' }),
      rect(x0 - bw / 2, P.Y(1.1173), bw, P.Y(0.905) - P.Y(1.1173), { fill: `url(#${L.slug}-hatch)`, cls: 'k-bar-hatch' }),
      k.arrow(L.slug, [[ax, P.Y(1.1173)], [ax, P.Y(0.905) - 2]], { tone: 'accent' }),
      circle(x0, P.Y(0.905), 5, { cls: 'k-stem-dot' }),
      text(x0 - bw / 2 - 10, P.Y(1.1173) + 4, 'click: 1.117', { anchor: 'end', cls: 'k-num' }),
      text(x0 - bw / 2 - 10, P.Y(0.905) + 16, 'output: 0.905', { anchor: 'end', cls: 'k-num' }),
      text(ax + 8, (P.Y(1.1173) + P.Y(0.905)) / 2 + 4, ph ? '−0.212: ring' : 'ring starts: −0.212', { anchor: 'start', cls: 'k-num-accent' }),
      zeroDots(P, range(1, last).filter(n => n % 2)),
      stems(P, ring.map((v, n) => [n, v]).filter(([n]) => n >= 2 && n % 2 === 0 && n <= last), { cls: 'k-stem-accent', dot: 4.5, labels: v => fmt(v, 3), labelCls: ph ? 'k-tick' : 'k-num' }),
      bracketH(P.X(2) - 6, P.X(last) + 6, P.Y(0.42), { tick: 5 }),
      text((P.X(2) + P.X(last)) / 2, P.Y(0.42) - 12, 'from n = 2: the ring alone', { cls: 'k-label' }),
      ph ? keyRow(24, 350, [['outline', 'the click passing through'], ['hatch', 'the ring starting, made by feedback'], ['stem', 'the ring alone', { cls: 'k-stem-accent', mcls: 'k-stem-accent-dot' }], ['dot', 'an output sample']], { cols: 1, slug: L.slug })
        : keyRow(60, 336, [['outline', 'the click passing through'], ['hatch', 'the ring starting, made by feedback'], ['stem', 'the ring alone', { cls: 'k-stem-accent', mcls: 'k-stem-accent-dot' }], ['dot', 'an output sample']], { cols: 2, dx: 330, slug: L.slug }),
    ];
  };

  const clickRing = L => {
    const ph = L.phone, last = ph ? 24 : 40;
    const P = ph ? plot({ x: 40, y: 70, w: 305, h: 200, xs: [-1, last + 0.6], ys: [-0.2, 0.3] }) : plot({ x: 60, y: 70, w: 630, h: 210, xs: [-1, last + 0.6], ys: [-0.2, 0.3] });
    const y = respond(click(last + 1), 0.9);
    const pace = (n, d0) => d0 + n * 0.11;
    const top = P.y0 - 6;
    const stemAt = n => g({ anim: { k: 'in', d: pace(n, 0.6), len: 0.25 } }, n % 2 ? zeroDots(P, [n]) : stems(P, [[n, y[n]]], { dot: 3.5 }));
    const half = ph ? 12 : 16;
    return [
      axes(P, { xTicks: range(0, last, ph ? 6 : 10).map(n => [n, n ? String(n) : 'n = 0']), yTicks: [[0.2, '0.2'], [0, '0'], [-0.2, `${M}0.2`]] }),
      step(4, 'the dashed envelope: the ring keeps 0.9 of its size per sample, so 0.81 from one non-zero sample to the next',
        g({ anim: { k: 'in', d: pace(last, 0.9), len: 0.8 } },
          curve(P, n => 0.172 * 0.9 ** (n - 2), { from: 2, to: last, cls: 'r7-env' }), curve(P, n => -0.172 * 0.9 ** (n - 2), { from: 4, to: last, cls: 'r7-env' }),
          masked(P.X(ph ? 13 : 22), P.Y(0.15), ph ? '× 0.81 every 2 samples' : '× 0.9 per sample: × 0.81 every 2 samples', { cls: 'k-label', size: 12 }))),
      step(1, 'sample 0, the click plus the start of the ring, 0.905, runs off the top of the scale',
        g({}, line(P.X(0), P.Y(0), P.X(0), top, { cls: 'r7-click' }), rect(P.X(0) - 5, top - 5, 10, 10, { cls: 'r7-m-hollow' }),
          text(P.X(0) + 12, top - 8, ph ? '0.905: click + ring start' : 'n = 0: 0.905, click + ring start (off the scale)', { anchor: 'start', cls: 'k-num' }))),
      step(2, 'the first samples appear one at a time: 0, 0.172, 0, −0.139, 0, 0.113',
        g({}, range(1, half).map(stemAt)),
        g({ anim: { k: 'in', d: pace(6, 0.6), len: 0.4 } }, text(P.X(2) + 8, P.Y(0.172) - 8, '0.172', { anchor: 'start', cls: 'k-num' }), text(P.X(4) + 9, P.Y(-0.139) + 16, `${M}0.139`, { anchor: 'start', cls: 'k-num' }),
          bracketH(P.X(2), P.X(5), P.y0 + 14, { tick: 4 }), text(P.X(5) + 8, P.y0 + 18, ph ? '2,000 Hz' : 'up, nothing, down, nothing: 2,000 Hz', { anchor: 'start', cls: 'k-label' }))),
      step(3, 'the ring keeps going, shrinking, every sample', g({}, range(half + 1, last).map(stemAt))),
      ph ? keyRow(30, 340, [['r7-env', 'dashed: the ring’s size']], { slug: L.slug })
        : keyRow(80, 336, [['r7-env', 'dashed: the ring’s size, 0.172 × 0.9 per sample, from n = 2']], { slug: L.slug }),
    ];
  };

  const spiral = L => {
    const ph = L.phone;
    const cx = ph ? 180 : 190, cy = ph ? 175 : 200, R = ph ? 130 : 150;
    const S = ph ? plot({ x: 44, y: 476, w: 300, h: 160, xs: [-0.6, 16.6], ys: [-1.1, 1.1] }) : plot({ x: 410, y: 90, w: 285, h: 220, xs: [-0.6, 16.6], ys: [-1.1, 1.1] });
    const at = (rad, n) => [cx + R * rad ** n * cosd(90 * n), cy - R * rad ** n * sind(90 * n)];
    const trail = (rad, to, cls) => poly(range(0, to).map(n => at(rad, n)), { cls });
    const shadow = n => 0.9 ** n * cosd(90 * n);
    const dotAt = (n, d) => {
      const [x, y] = at(0.9, n), odd = n % 2 === 1;
      return g({ anim: { k: 'in', d, len: 0.3 } },
        odd ? line(x, y, cx, cy, { cls: 'r7-drop' }) : '',
        circle(x, y, n === 0 ? 5.5 : 3.8, { cls: 'r7-m' }),
        Math.abs(shadow(n)) > 1e-9 ? stems(S, [[n, shadow(n)]], { dot: 3.5 }) : zeroDots(S, [n]));
    };
    const pace = n => 0.4 + n * 0.32;
    const pole = at(0.9, 1);
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }), line(cx, cy - R - 14, cx, cy + R + 14, { cls: 'k-grid' }),
      circle(cx, cy, R, { cls: 'r7-rim', fill: 'none' }),
      text(cx + R + 6, cy + 18, '1', { anchor: 'start', cls: 'k-tick' }),
      axes(S, { xTicks: [[0, 'n = 0'], [4, '4'], [8, '8'], [12, '12'], [16, '16']], yTicks: [[1, '1'], [-1, `${M}1`]] }),
      text(S.x0, S.y0 - 14, ph ? 'its shadow, sample by sample' : 'the dot’s shadow, sample by sample', { anchor: 'start', cls: 'k-name' }),
      step(1, 'the dot starts on the rim at radius 1, and its shadow is 1',
        dotAt(0, 0.2), text(cx + R + 8, cy - 22, 'n = 0', { anchor: 'start', cls: 'k-tick' })),
      step(2, 'each sample it turns 90 degrees and shrinks to 0.90: shadows 0, −0.81, 0, 0.656',
        g({}, range(1, 4).map(n => dotAt(n, pace(n)))),
        g({ anim: { k: 'in', d: pace(1), len: 0.5 } }, text(cx, cy + R + 34, 'each sample: turn 90°, shrink to 0.90', { cls: 'k-note' }))),
      step(3, 'it keeps spiraling in, and the shadow keeps swinging smaller',
        g({}, range(5, 16).map(n => dotAt(n, pace(n))))),
      step(4, 'the path of the dot, a spiral toward the center', g({ anim: { k: 'in', d: pace(16) + 0.2, len: 1.2 } }, trail(0.9, 16, 'r7-spiral'))),
      step(5, 'a pole at radius 0.98 makes a spiral that shrinks much more slowly',
        g({ anim: { k: 'in', d: pace(16) + 1.8, len: 0.8 } }, trail(0.98, 8, 'r7-s98'))),
      poleX(pole[0], pole[1], 7),
      text(pole[0], cy - R - 24, 'pole: radius 0.90, at 90°', { cls: 'k-label' }),
      ph ? keyRow(40, 388, [['r7-spiral', 'radius 0.90'], ['r7-s98', 'radius 0.98: shrinks slower']], { cols: 1, slug: L.slug })
        : keyRow(30, 410, [['r7-spiral', 'radius 0.90'], ['r7-s98', 'radius 0.98: shrinks slower']], { dx: 140, slug: L.slug }),
    ];
  };

  const decayTime = L => {
    const ph = L.phone;
    const A = ph ? plot({ x: 54, y: 70, w: 290, h: 130, xs: [0, 8], ys: [0, 1] }) : plot({ x: 70, y: 70, w: 610, h: 140, xs: [0, 8], ys: [0, 1] });
    const Z = ph ? plot({ x: 54, y: 280, w: 290, h: 100, xs: [0, 8], ys: [0, 0.05] }) : plot({ x: 70, y: 268, w: 610, h: 100, xs: [0, 8], ys: [0, 0.05] });
    const env = t => 0.9 ** (8 * t), tc = decayN(0.9) / 8;
    const msTicks = range(0, 8, 2).map(t => [t, t === 8 ? '8 ms' : String(t)]);
    return [
      text(A.x0 - (ph ? 44 : 60), 30, ph ? 'ring size, share of its start (r = 0.90)' : 'the ring’s size, as a share of where it started (radius 0.90)', { anchor: 'start', cls: ph ? 'k-label' : 'k-name' }),
      axes(A, { yTicks: [[1, '100%'], [0.5, '50%'], [0, '0']], xTicks: [], zero: false }),
      rect(A.x0, A.Y(0.05), A.w, A.Y(0) - A.Y(0.05), { cls: 'r7-plate' }),
      line(A.x0, A.Y(0), Z.x0, Z.y0, { cls: 'k-grid' }), line(A.x1, A.Y(0), Z.x1, Z.y0, { cls: 'k-grid' }),
      rect(Z.x0, Z.y0, Z.w, Z.h, { cls: 'r7-plate' }),
      curve(A, env, { cls: 'r7-s90' }),
      mark('circle', A.X(10 / 8), A.Y(0.9 ** 10)), mark('circle', A.X(20 / 8), A.Y(0.9 ** 20)),
      text(A.X(10 / 8) + 12, A.Y(0.9 ** 10) - 12, '10 samples: 0.35', { anchor: 'start', cls: 'k-num' }),
      text(A.X(20 / 8) + 12, A.Y(0.9 ** 20) - 14, '20 samples: 0.12', { anchor: 'start', cls: 'k-num' }),
      text(A.x1, ph ? A.Y(0) + 16 : A.Y(0.05) - 6, ph ? 'shaded: 0 to 5%, zoomed below' : 'shaded strip, 0 to 5%: zoomed in below', { anchor: 'end', cls: 'k-tick' }),
      axes(Z, { yTicks: [[0.05, '5%'], [0.01, '1%']], xTicks: msTicks, zero: false }),
      text(Z.x0 - 8, Z.y1 + 4, '0', { anchor: 'end', cls: 'k-tick' }),
      range(0, 64, 16).map(n => text(Z.X(n / 8), Z.y1 + 34, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
      text(Z.x1, Z.y1 + 52, ph ? 'top: ms; below: samples' : 'top row: ms after the click; bottom row: samples', { anchor: 'end', cls: 'k-tick' }),
      curve(Z, env, { from: 3.56, cls: 'r7-s90' }),
      line(Z.x0, Z.Y(0.01), Z.x1, Z.Y(0.01), { cls: 'r7-level' }),
      line(Z.X(tc), Z.Y(0.01), Z.X(tc), Z.y1, { cls: 'r7-bracket-accent' }),
      mark('circle', Z.X(tc), Z.Y(0.01), { cls: 'r7-m-accent', size: 5 }),
      text(ph ? Z.X(0.15) : Z.X(tc) + 10, Z.Y(0.03), ph ? '1% at 43.7 samples' : '1% at 43.7 samples = 5.5 ms', { anchor: 'start', cls: 'k-num-accent' }),
      ph ? text(Z.X(0.15), Z.Y(0.03) + 16, '= 5.5 ms', { anchor: 'start', cls: 'k-num-accent' }) : '',
    ];
  };

  const poleGaps = L => {
    const ph = L.phone;
    const zx = ph ? 130 : 140, zy = ph ? 80 : 90, S = 1200;
    const P = ph ? plot({ x: 44, y: 390, w: 296, h: 170, xs: [0, 32], ys: [0, 1] }) : plot({ x: 360, y: 80, w: 330, h: 200, xs: [0, 32], ys: [0, 1] });
    const rim = poly(range(-30, 30).map(i => { const dx = i * 4; return [zx + dx, zy + S - Math.sqrt(S * S - dx * dx)]; }), { cls: 'r7-rim' });
    const radii = [0.9, 0.95, 0.98];
    const off = [34, 66, 98];
    return [
      text(ph ? 20 : 30, 40, 'the top of the unit circle, zoomed in', { anchor: 'start', cls: 'k-name' }),
      rim, line(zx, zy - 14, zx, zy + 150, { cls: 'k-grid' }),
      zeroO(zx, zy), text(zx - 12, zy - 10, 'zero on the rim', { anchor: 'end', cls: 'k-label' }),
      radii.map((r, i) => g({},
        poleX(zx, zy + (1 - r) * S, 5.5),
        text(zx - 12, zy + (1 - r) * S + 4, `pole ${fmt(r)}`, { anchor: 'end', cls: 'k-num' }),
        line(zx + 8, zy + (1 - r) * S, zx + off[i] - 4, zy + (1 - r) * S, { cls: 'k-grid' }),
        bracketV(zx + off[i], zy, zy + (1 - r) * S, { cls: SERIES[r].cls, tick: 4 }),
        mark(SERIES[r].shape, zx + off[i], zy + (1 - r) * S + 14, { size: 4 }),
        text(zx + off[i], zy + (1 - r) * S + 34, fmt(1 - r), { cls: 'k-num' }))),
      text(zx + 50, zy + 182, 'gap to the circle: 1 − radius', { cls: 'k-label' }),
      axes(P, { yTicks: [[1, '100%'], [0, '0']], xTicks: [[0, '0'], [10, '10'], [20, '20 ms']], zero: false }),
      text(P.x0, P.y0 - 14, ph ? 'the ring’s size, as a share of its start' : 'the ring’s size, as a share of where it started', { anchor: 'start', cls: ph ? 'k-label' : 'k-name' }),
      radii.map(r => g({},
        curve(P, t => r ** (8 * t), { cls: SERIES[r].cls, n: 320 }),
        line(P.X(decayN(r) / 8), P.y1, P.X(decayN(r) / 8), P.y1 + 26, { cls: 'k-grid' }),
        mark(SERIES[r].shape, P.X(decayN(r) / 8), P.y1, { size: 4.5 }),
        text(P.X(decayN(r) / 8) + (r === 0.9 ? -4 : r === 0.98 && ph ? 6 : 4), P.y1 + 40, `${fmt(decayN(r) / 8, 1)} ms`, { anchor: r === 0.9 || (r === 0.98 && ph) ? 'end' : 'start', cls: 'k-num' }))),
      text(P.x1, P.y1 + 60, ph ? 'marks: where each falls to 1%' : 'marks on the axis: where each falls to 1%', { anchor: 'end', cls: 'k-tick' }),
      ph ? keyRow(30, 300, radii.map(r => [SERIES[r].cls, `pole ${SERIES[r].name}`, { shape: SERIES[r].shape }]), { cols: 1, slug: L.slug })
        : keyRow(330, 400, radii.map(r => [SERIES[r].cls, SERIES[r].name.replace('radius ', ''), { shape: SERIES[r].shape }]), { dx: 110, slug: L.slug }),
      ph ? '' : text(330, 380, 'pole radius:', { anchor: 'start', cls: 'k-label' }),
      ph ? text(180, 690, 'smaller gap, longer ring: halve it, double it', { cls: 'k-note' }) : text(170, 316, 'smaller gap, longer ring:', { cls: 'k-note' }),
      ph ? '' : text(170, 340, 'halve the gap, double the ring', { cls: 'k-note' }),
    ];
  };

  const whineOn = L => {
    const ph = L.phone, first = ph ? -2 : -3, last = ph ? 12 : 20;
    const X0 = ph ? 70 : 120, W = ph ? 280 : 570;
    const row = (y, h, ys) => plot({ x: X0, y, w: W, h, xs: [first - 0.5, last + 0.5], ys });
    const A = row(54, 64, [-1.15, 1.15]), B = row(156, 64, [-1.15, 1.15]), C = row(320, 120, [-1, 1]);
    const ns = range(first, last);
    const x = n => (n < 0 ? 0 : cosd(90 * n));
    const y = respond(range(0, last).map(n => x(n)), 0.9);
    const pts = (P, f) => ns.map(n => [n, f(n)]);
    const drawRow = (P, f, opts = {}) => g({}, zeroDots(P, ns.filter(n => Math.abs(f(n)) < 1e-9)), stems(P, pts(P, f).filter(([n, v]) => Math.abs(v) > 1e-9 && !(opts.skip || []).includes(n)), { dot: 3.5 }));
    const lab = (P, s) => text(X0 - 10, P.Y(0) + 4, s, { anchor: 'end', cls: 'k-label' });
    const nTicks = range(0, last, 4).map(n => [n, n ? String(n) : 'n = 0']);
    return [
      step(3, 'from n = 2 on, each sample and the one two back cancel: the zero pair removes the whine',
        g({ anim: { k: 'in', d: 2.4, len: 0.6 } }, rect(A.X(1.5), A.y0 - 6, A.X(last + 0.5) - A.X(1.5), B.y1 - A.y0 + 12, { cls: 'r7-plate' }),
          text(ph ? A.X(1.6) : A.X(1.7), B.y1 + 50, ph ? 'shaded: x[n] + x[n − 2] = 0' : 'shaded: the zero pair cancels the input here, x[n] + x[n − 2] = 0', { anchor: 'start', cls: 'k-label' }))),
      [0, 2].map(n => line(A.X(n), A.y0 - 6, A.X(n), C.y1, { cls: 'k-grid' })),
      axes(A, { xTicks: [] }), axes(B, { xTicks: nTicks }), axes(C, { xTicks: nTicks }),
      lab(A, ph ? 'x[n]' : 'x[n], whine'), lab(B, 'x[n − 2]'), lab(C, ph ? 'y[n]' : 'y[n], out'),
      step(1, 'the whine switches on at n = 0: 1, 0, −1, 0, with silence before',
        drawRow(A, x, { skip: [0] }), g({}, stems(A, [[0, 1]], { cls: 'k-stem-accent', dot: 4.5 }))),
      step(2, 'the same stream two samples later, x[n − 2], has nothing under n = 0',
        g({ anim: { k: 'in', d: 1.2, len: 0.6 } }, drawRow(B, n => x(n - 2))),
        g({ anim: { k: 'in', d: 1.8, len: 0.6 } }, k.arrow(L.slug, [[A.X(0), A.Y(0) + 6], [A.X(0), B.Y(0) - 10]], { tone: 'accent' }),
          circle(B.X(0), B.Y(0), 6, { cls: 'k-ring-missing' }),
          text(A.X(0) - 10, (A.Y(0) + B.Y(0)) / 2 + 6, ph ? 'no partner' : 'nothing two back to cancel', { anchor: 'end', cls: 'k-note-accent' }))),
      step(5, 'the same ring as the click’s: its size keeps 0.9 per sample',
        g({ anim: { k: 'in', d: 3.4 + last * 0.12, len: 0.8 } },
          curve(C, n => 0.905 * 0.9 ** n, { from: 0, to: last, cls: 'r7-env' }), curve(C, n => -0.905 * 0.9 ** n, { from: 2, to: last, cls: 'r7-env' }),
          text(C.x1, C.y0 - 16, ph ? 'dashed: × 0.81 every 2 samples' : 'the whine leaks out and fades. Dashed: × 0.9 per sample, × 0.81 every 2', { anchor: 'end', cls: 'k-label' }))),
      step(4, 'the output: 0.905, −0.733, 0.594, −0.481, shrinking by 0.81 every two samples',
        g({}, range(0, last).map(n => g({ anim: { k: 'in', d: 3.2 + n * 0.12, len: 0.25 } }, Math.abs(y[n]) < 1e-9 ? zeroDots(C, [n]) : stems(C, [[n, y[n]]], { dot: 3.5 })))),
        g({ anim: { k: 'in', d: 3.4, len: 0.5 } }, text(C.X(0) + 8, C.Y(0.905) - 2, '0.905', { anchor: 'start', cls: 'k-num' }), text(C.X(2) + 8, C.Y(-0.733) + 12, `${M}0.733`, { anchor: 'start', cls: 'k-num' }))),
    ];
  };

  const bandwidthFig = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 50, y: 126, w: 290, h: 190, xs: [1500, 2500], ys: [0, 1.05] }) : plot({ x: 70, y: 120, w: 610, h: 190, xs: [1500, 2500], ys: [0, 1.05] });
    const e9 = [edge(0.9, Math.SQRT1_2, -1), edge(0.9, Math.SQRT1_2, 1)], e98 = [edge(0.98, Math.SQRT1_2, -1), edge(0.98, Math.SQRT1_2, 1)];
    const by9 = P.y0 - 26, by98 = P.y0 - 62, l = Math.SQRT1_2;
    return [
      axes(P, { yTicks: [[1, '100%'], [l, '71%'], [0, '0%']], xTicks: ph ? [[1500, '1,500'], [2000, '2,000 Hz'], [2500, '2,500']] : [[1500, '1,500'], [1750, '1,750'], [2000, '2,000'], [2250, '2,250'], [2500, '2,500 Hz']], zero: false }),
      text(P.x0, 26, ph ? 'what the notch passes' : 'how much the notch passes, near the whine', { anchor: 'start', cls: 'k-name' }),
      line(P.x0, P.Y(l), P.x1, P.Y(l), { cls: 'r7-level' }),
      curve(P, f => gainAt(0.9, f), { cls: 'r7-s90', n: 600 }),
      curve(P, f => gainAt(0.98, f), { cls: 'r7-s98', n: 600 }),
      e9.map(f => g({}, line(P.X(f), P.Y(l) - 8, P.X(f), by9 + 6, { cls: 'r7-drop' }), mark('circle', P.X(f), P.Y(l)))),
      e98.map(f => g({}, line(P.X(f), P.Y(l) - 8, P.X(f), by98 + 6, { cls: 'r7-drop' }), mark('triangle', P.X(f), P.Y(l)))),
      bracketH(P.X(e9[0]), P.X(e9[1]), by9, { cls: 'r7-s90' }),
      bracketH(P.X(e98[0]), P.X(e98[1]), by98, { cls: 'r7-s98' }),
      text(P.X(e9[1]) + 12, by9 + 4, ph ? '266 Hz' : '266 Hz: 1,867 to 2,133 Hz', { anchor: 'start', cls: 'k-num' }),
      text(P.X(e98[1]) + 12, by98 + 4, ph ? '51 Hz' : '51 Hz: 1,974 to 2,026 Hz', { anchor: 'start', cls: 'k-num' }),
      ph ? keyRow(30, 380, [['r7-s90', 'pole radius 0.90', { shape: 'circle' }], ['r7-s98', 'pole radius 0.98', { shape: 'triangle' }], ['r7-level', 'the 71% line']], { cols: 1, slug: L.slug })
        : keyRow(90, 362, [['r7-s90', 'pole radius 0.90', { shape: 'circle' }], ['r7-s98', 'pole radius 0.98', { shape: 'triangle' }], ['r7-level', 'the 71% line']], { dx: 200, slug: L.slug }),
    ];
  };

  const tradeOff = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 56, y: 56, w: 284, h: 230, xs: [0, 30], ys: [0, 600] }) : plot({ x: 90, y: 50, w: 590, h: 240, xs: [0, 30], ys: [0, 600] });
    const rs = range(0, 200).map(i => 0.8 + 0.18 * i / 200);
    const pt = r => [P.X(decayN(r) / 8), P.Y(bandwidth(r))];
    const dots = [0.8, 0.85, 0.9, 0.95, 0.98];
    const place = { 0.8: [10, -2, 'start'], 0.85: [10, -2, 'start'], 0.9: [10, -8, 'start'], 0.95: [6, -12, 'start'], 0.98: [0, -14, 'middle'] };
    return [
      axes(P, { yTicks: [[600, '600'], [400, '400'], [200, '200'], [0, '0']], xTicks: [[0, '0'], [10, '10'], [20, '20'], [30, '30 ms']], zero: false, grid: true }),
      text(P.x0 - (ph ? 46 : 60), P.y0 - 20, 'bandwidth, Hz, from 0', { anchor: 'start', cls: 'k-tick' }),
      text(P.x1, P.y1 + 40, 'decay time, ms, from 0', { anchor: 'end', cls: 'k-tick' }),
      poly(rs.map(pt), { cls: 'r7-s90' }),
      dots.map(r => { const [x, y] = pt(r), [dx, dy, a] = place[r]; return g({}, mark('circle', x, y, { size: 5 }), text(x + dx, y + dy, fmt(r), { anchor: a, cls: 'k-num' })); }),
      text(P.X(ph ? 8 : 9), P.Y(500), ph ? 'bandwidth (Hz) × decay (s)' : 'every notch of this kind: bandwidth (Hz) × decay time (s) ≈ 1.46', { anchor: 'start', cls: ph ? 'k-label' : 'k-note' }),
      ph ? text(P.X(8), P.Y(500) + 18, '≈ 1.46 everywhere', { anchor: 'start', cls: 'k-label' }) : '',
      text(P.X(ph ? 8 : 12), P.Y(ph ? 390 : 420), ph ? '0.90: 266 × 0.00546 = 1.45' : 'at 0.90: 266 Hz × 0.00546 s = 1.45', { anchor: 'start', cls: 'k-num' }),
      text(P.X(ph ? 8 : 12), P.Y(ph ? 340 : 370), ph ? 'labels: pole radius' : 'dots are labeled with the pole radius', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const halfTurn = L => {
    const ph = L.phone, cx = ph ? 180 : 300, cy = ph ? 160 : 170, R = ph ? 120 : 130;
    const at = n => [cx + R * 0.9 ** n * cosd(90 * n), cy - R * 0.9 ** n * sind(90 * n)];
    const [ax, ay] = at(2), [bx, by] = at(4);
    const arcPts = range(0, 24).map(i => { const t = 2.12 + 1.76 * i / 24; return [cx + R * 0.9 ** t * cosd(90 * t), cy - R * 0.9 ** t * sind(90 * t)]; });
    const [hx, hy] = arcPts[arcPts.length - 1], [px, py] = arcPts[arcPts.length - 3], ang = Math.atan2(hy - py, hx - px);
    const head = path(`M${r2(hx)} ${r2(hy)}L${r2(hx - 9 * Math.cos(ang) + 4.5 * Math.sin(ang))} ${r2(hy - 9 * Math.sin(ang) - 4.5 * Math.cos(ang))}L${r2(hx - 9 * Math.cos(ang) - 4.5 * Math.sin(ang))} ${r2(hy - 9 * Math.sin(ang) + 4.5 * Math.cos(ang))}Z`, { cls: 'r7-head-soft' });
    const arc = g({}, poly(arcPts.slice(0, -1), { cls: 'r7-turn' }), head);
    const ly = cy + R + (ph ? 28 : 30);
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }), line(cx, cy - R - 10, cx, cy + R + 10, { cls: 'k-grid' }),
      circle(cx, cy, R, { cls: 'r7-rim', fill: 'none' }),
      step(1, 'two samples back, at n − 2, the dot sat at radius 0.81, on the left: shadow −0.81',
        circle(ax, ay, 6, { cls: 'r7-m-hollow' }), masked(ax + 10, ay - 16, 'n − 2: 0.81', { anchor: 'start', cls: 'k-num', size: 12 })),
      step(2, 'half a turn later and 0.81 smaller, at n, the dot is on the right at 0.656',
        g({ anim: { k: 'in', d: 0.8, len: 1.0 } }, arc, text(cx + 14, cy + R * 0.4, 'half a turn', { anchor: 'start', cls: 'k-label' })),
        g({ anim: { k: 'in', d: 2, len: 0.5 } }, circle(bx, by, 6, { cls: 'r7-m' }), masked(bx - 10, by - 16, 'n: 0.656', { anchor: 'end', cls: 'k-num', size: 12 }),
          text(cx, cy - R - 22, 'half a turn, and 0.9 × 0.9 = 0.81 smaller', { cls: 'k-note' }))),
      step(3, 'so the new shadow is the old one times −0.81',
        g({ anim: { k: 'in', d: 2.8, len: 0.6 } },
          line(ax, cy + 8, ax, ly - 8, { cls: 'r7-drop' }), line(bx, cy + 8, bx, ly - 8, { cls: 'r7-drop' }),
          k.arrow(L.slug, [[ax + 6, ly], [bx - 6, ly]], { tone: 'accent' }),
          masked((ax + bx) / 2, ly + 4, '× −0.81', { cls: 'k-num-accent', size: 13 }),
          text(ax, ly + 26, `shadow ${M}0.81`, { cls: 'k-num' }), text(bx, ly + 26, 'shadow 0.656', { cls: 'k-num' }))),
    ];
  };

  const clickMinusRing = L => {
    const ph = L.phone;
    const tN = 12, ys = [-0.3, 1.25];
    const cl = n => (n ? 0 : 1.1173), h = n => cl(n) - spPlot(n);
    const spPlot = n => 0.2123 * (n % 2 ? 0 : (-0.81) ** (n / 2));
    const layout = ph
      ? i => ({ t: plot({ x: 40, y: 92 + i * 220, w: 130, h: 110, xs: [-0.6, tN + 0.6], ys }), f: plot({ x: 206, y: 92 + i * 220, w: 128, h: 110, xs: [0, 4000], ys: [0, 1.25] }) })
      : i => ({ t: plot({ x: 70 + i * 225, y: 80, w: 175, h: 110, xs: [-0.6, tN + 0.6], ys }), f: plot({ x: 70 + i * 225, y: 280, w: 175, h: 110, xs: [0, 4000], ys: [0, 1.25] }) });
    const L0 = layout(0), L1 = layout(1), L2 = layout(2);
    const tStems = (P, fn, o = {}) => g({}, zeroDots(P, range(0, tN).filter(n => Math.abs(fn(n)) < 1e-9), 1.8), stems(P, range(0, tN).map(n => [n, fn(n)]).filter(([, v]) => Math.abs(v) > 1e-9), { dot: 3, ...o }));
    const fx = ph ? [[0, '0'], [2000, '2,000'], [4000, '4,000']] : [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']];
    const hatchPeak = P => {
      const pts = range(0, 200).map(i => [P.X(4000 * i / 200), P.Y(peakAt(4000 * i / 200))]);
      return path(`M${r2(P.x0)} ${r2(P.Y(0))}` + pts.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join('') + `L${r2(P.x1)} ${r2(P.Y(0))}Z`, { fill: `url(#${L.slug}-hatch)`, cls: 'r7-hatch-line' });
    };
    const titles = ph ? ['the click, × 1.117', 'minus the spiral, × 0.212', 'equals the notch'] : ['the click, × 1.117', 'the spiral, × 0.212', 'the notch'];
    const tt = (Lx, s) => text(ph ? 20 : Lx.t.x0, ph ? Lx.t.y0 - 34 : Lx.t.y0 - 30, s, { anchor: 'start', cls: 'k-name' });
    const ops = ph ? [] : [[L0.t.x1 + 25, L0.t.Y(0.4), '−'], [L1.t.x1 + 25, L1.t.Y(0.4), '='], [L0.f.x1 + 25, L0.f.Y(0.6), '−'], [L1.f.x1 + 25, L1.f.Y(0.6), '=']];
    return [
      ph ? g({}, text(L0.t.x0, 40, 'in time, n', { anchor: 'start', cls: 'k-label' }), text(L0.f.x0, 40, 'in tones, Hz', { anchor: 'start', cls: 'k-label' }))
        : g({}, text(20, L0.t.y0 - 52, 'in time: samples n = 0 to 12', { anchor: 'start', cls: 'k-label' }), text(20, L0.f.y0 - 52, 'in tones: how strong each tone comes out, 0 to 4,000 Hz', { anchor: 'start', cls: 'k-label' })),
      [L0, L1, L2].map((Lx, i) => g({}, tt(Lx, titles[i]),
        axes(Lx.t, { xTicks: [[0, '0'], [12, '12']], yTicks: i === 0 ? [[1, '1']] : [] }),
        axes(Lx.f, { xTicks: fx, yTicks: i === 0 ? [[1.1173, '1.117'], [0, '0']] : [[1.1173, '1.117']], zero: false }))),
      ops.map(([x, y, s]) => text(x, y + 8, s, { cls: 'r7-op' })),
      ph ? g({}, text(20, L1.t.y0 - 52, '−', { anchor: 'start', cls: 'r7-op' }), text(20, L2.t.y0 - 52, '=', { anchor: 'start', cls: 'r7-op' })) : '',
      step(1, 'in time: the click of 1.117 at n = 0, and the spiral scaled by 0.212',
        tStems(L0.t, cl), tStems(L1.t, spPlot, { cls: 'k-stem-accent' })),
      step(2, 'subtracting gives the notch’s impulse response: 0.905, 0, 0.172, 0, −0.139',
        g({ anim: { k: 'in', d: 1, len: 0.6 } }, tStems(L2.t, h))),
      step(3, 'in tones: the click is a flat line at 1.117; the spiral is a narrow peak that reaches 1.117 at 2,000 Hz',
        g({ anim: { k: 'in', d: 1.8, len: 0.6 } }, line(L0.f.x0, L0.f.Y(1.1173), L0.f.x1, L0.f.Y(1.1173), { cls: 'k-curve' })),
        g({ anim: { k: 'in', d: 2.3, len: 0.6 } }, hatchPeak(L1.f))),
      step(4, 'at 2,000 Hz the peak is as tall as the flat line, so the two cancel',
        g({ anim: { k: 'in', d: 3.1, len: 0.6 } }, line(L2.f.x0, L2.f.Y(1.1173), L2.f.x1, L2.f.Y(1.1173), { cls: 'r7-softline' }),
          text(L2.f.X(2000) + 10, L2.f.Y(0.62), '1.117', { anchor: 'start', cls: 'k-num' }), text(L2.f.X(2000) + 10, L2.f.Y(0.62) + 15, '− 1.117', { anchor: 'start', cls: 'k-num' }))),
      step(5, 'what is left is the notch: 1 at 0 Hz, 0 at 2,000 Hz',
        g({ anim: { k: 'in', d: 4.4, len: 0.6 } }, curve(L2.f, f => gainAt(0.9, f), { cls: 'k-curve', n: 400 }),
          circle(L2.f.X(2000), L2.f.Y(0), 4.5, { cls: 'r7-m-hollow' }),
          text(L2.f.X(2000) + 10, L2.f.Y(0.62) + 30, '= 0', { anchor: 'start', cls: 'k-num' }))),
      ph ? keyRow(30, 730, [['hatch', 'the spiral’s peak, made by feedback'], ['r7-softline', 'the click’s flat line'], ['k-curve', 'the notch: click minus spiral']], { cols: 1, slug: L.slug })
        : keyRow(70, 450, [['hatch', 'the spiral’s peak, made by feedback'], ['r7-softline', 'the click’s flat line'], ['stem', 'the spiral, in time', { cls: 'k-stem-accent', mcls: 'k-stem-accent-dot' }], ['k-curve', 'the notch']], { dx: 330, cols: 2, slug: L.slug }),
    ];
  };

  const triangle = L => {
    const ph = L.phone, S = 900;
    const zoom = (zx, zy, a, gap, label, equal) => {
      const tx0 = zx - a * S;
      const rimY = xx => zy + S - Math.sqrt(S * S - (xx - zx) ** 2);
      const rimPts = range(0, 40).map(i => { const xx = tx0 - 26 + (zx + 40 - tx0 + 26) * i / 40; return [xx, rimY(xx)]; });
      const aPts = range(0, 20).map(i => { const xx = tx0 + (zx - tx0) * i / 20; return [xx, rimY(xx)]; });
      const tx = tx0, ty = rimY(tx0), py = zy + gap * S;
      const mx = (tx + zx) / 2, my = (ty + py) / 2;
      return g({},
        poly(rimPts, { cls: 'r7-rim' }),
        poly(aPts, { cls: 'r7-s90' }), line(zx, zy, zx, py, { cls: 'r7-s90' }), line(tx, ty, zx, py, { cls: 'k-line' }),
        path(`M${zx - 10} ${zy + 0.5}L${zx - 10} ${zy + 10.5}L${zx} ${zy + 10.5}`, { cls: 'r7-bracket' }),
        zeroO(zx, zy, 5), poleX(zx, py, 5.5), circle(tx, ty, 5, { cls: 'r7-m' }),
        text(zx + 10, zy - 8, 'zero', { anchor: 'start', cls: 'k-label' }),
        text(zx + 10, py + 5, 'pole', { anchor: 'start', cls: 'k-label' }),
        text(tx - 4, ty + 22, 'tone', { anchor: 'end', cls: 'k-label' }),
        text(zx + 10, (zy + py) / 2 + 4, '1 − r', { anchor: 'start', cls: 'k-num' }),
        text((tx + zx) / 2, Math.min(ty, zy) - 12, equal ? 'arc a = 1 − r' : 'arc a', { cls: 'k-num' }),
        masked(mx - 12, my + 14, 'to the pole', { anchor: 'end', cls: 'k-tick', size: 11 }),
        equal ? g({}, text(zx - 30, py + 34, 'zero: a, pole: √2 × a', { cls: 'k-num' }), text(zx - 30, py + 54, 'a ÷ (√2 × a) = 71%', { cls: 'k-num' }))
          : text(zx - 40, py + 40, label, { cls: 'k-note' }));
    };
    const inset = (cx, cy, R) => {
      const zs = [[cx, cy - R], [cx, cy + R]], poles = [[cx, cy - 0.9 * R], [cx, cy + 0.9 * R]], t = [cx + R * cosd(115), cy - R * sind(115)];
      return g({},
        line(cx - R - 10, cy, cx + R + 10, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'r7-rim', fill: 'none' }),
        line(t[0], t[1], zs[1][0], zs[1][1], { cls: 'r7-drop' }),
        zs.map(([xx, yy]) => zeroO(xx, yy, 4.5)), poles.map(([xx, yy]) => poleX(xx, yy, 4.5)),
        circle(t[0], t[1], 4.5, { cls: 'r7-m' }), circle(cx + R, cy, 4.5, { cls: 'r7-m-hollow' }),
        text(cx + R - 8, cy - 10, '0 Hz', { anchor: 'end', cls: 'k-tick' }),
        text(cx, cy + R + 28, 'far pair: 2 ÷ 1.9 = 1.053', { cls: 'k-tick' }),
        text(cx, cy + R + 44, '0 Hz: 2 ÷ 1.81 = 1.105', { cls: 'k-tick' }),
        text(cx, cy + R + 60, '1.053 ÷ 1.105 ≈ 0.95,', { cls: 'k-tick' }),
        text(cx, cy + R + 76, 'treated as 1', { cls: 'k-tick' }));
    };
    if (ph) return [
      text(20, 30, 'near the top of the circle, zoomed in', { anchor: 'start', cls: 'k-name' }),
      zoom(230, 80, 0.16, 0.1, 'any small a', false),
      zoom(230, 270, 0.1, 0.1, '', true),
      text(180, 456, 'arc a ≈ angle a, in radians', { cls: 'k-tick' }),
      line(20, 480, 340, 480, { cls: 'k-grid' }),
      text(20, 510, 'the whole circle', { anchor: 'start', cls: 'k-name' }),
      inset(180, 590, 56),
    ];
    return [
      text(20, 30, 'near the top of the circle, zoomed in', { anchor: 'start', cls: 'k-name' }),
      zoom(220, 90, 0.16, 0.1, 'any small a', false),
      zoom(460, 90, 0.1, 0.1, '', true),
      text(280, 316, 'arc a on the rim ≈ the angle a, in radians', { cls: 'k-tick' }),
      line(540, 40, 540, 320, { cls: 'k-grid' }),
      text(630, 30, 'the whole circle', { cls: 'k-name' }),
      inset(630, 130, 62),
    ];
  };

  const drift = L => {
    const ph = L.phone;
    const R = ph ? 56 : 66, wy = ph ? 120 : 130, w1 = ph ? 95 : 140, w2 = ph ? 265 : 340;
    const snaps = [0, 20, 40, 60, 80];
    const ang = (f, n) => (360 * f * n / FS) % 360;
    const W1 = ph ? plot({ x: 40, y: 340, w: 280, h: 70, xs: [0, 1], ys: [-1.1, 1.1] }) : plot({ x: 70, y: 300, w: 280, h: 100, xs: [0, 1], ys: [-1.1, 1.1] });
    const W2 = ph ? plot({ x: 40, y: 460, w: 280, h: 70, xs: [9.5, 10.5], ys: [-1.1, 1.1] }) : plot({ x: 410, y: 300, w: 280, h: 100, xs: [9.5, 10.5], ys: [-1.1, 1.1] });
    const wheelBase = (cx, label) => g({}, line(cx - R - 10, wy, cx + R + 10, wy, { cls: 'k-axis' }), circle(cx, wy, R, { cls: 'r7-rim', fill: 'none' }), text(cx, wy - R - 18, label, { cls: 'k-name' }));
    const dotOn = (cx, a, cls = 'r7-m', shape = 'circle') => {
      const x = cx + R * cosd(a), y = wy - R * sind(a);
      return g({}, line(cx, wy, x, y, { cls: 'k-spoke-line' }), mark(shape, x, y, { cls, size: 5.5 }));
    };
    const counterX = ph ? 180 : 560, counterY = ph ? 238 : 120;
    const counter = n => text(counterX, counterY, `sample ${n}${n === 80 ? ' = 10 ms' : ''}`, { cls: 'k-name' });
    const ghosts = [20, 40, 60].map(n => g({ cls: 'k-faint' }, mark('triangle', w2 + R * cosd(ang(2050, n)), wy - R * sind(ang(2050, n)), { size: 4 })));
    const arcPath = (cx, from, to, rr) => poly(range(0, 30).map(i => { const a = from + (to - from) * i / 30; return [cx + rr * cosd(a), wy - rr * sind(a)]; }), { cls: 'r7-turn' });
    return [
      wheelBase(w1, '2,000 Hz'), wheelBase(w2, '2,050 Hz'),
      dotOn(w1, 0),
      text(w1, wy + R + 26, ph ? 'back here every 4' : 'back every 4 samples', { cls: 'k-tick' }),
      circle(w2 + R, wy, 6, { cls: 'r7-m-hollow' }),
      step(1, 'at sample 0 both dots start together at the right',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0, len: 1 } }, dotOn(w2, 0, 'r7-m', 'triangle'), counter(0))),
      snaps.slice(1, 4).map((n, i) => step(i + 2, `at sample ${n} the 2,050 Hz dot is ${ang(2050, n)} degrees ahead; the 2,000 Hz dot is back at the right`,
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 1 + i, len: 1 } }, dotOn(w2, ang(2050, n), 'r7-m', 'triangle'), counter(n)))),
      step(5, 'at sample 80, 10 ms, the dots are 180 degrees apart: half a cycle',
        g({ anim: { k: 'in', d: 4, len: 0.6 } }, ghosts, dotOn(w2, 180, 'r7-m', 'triangle'), arcPath(w2, 8, 172, R + 12), counter(80),
          text(w2, wy + R + 26, ph ? '180° from the ○' : '180° from the ○ (2,000 Hz)', { cls: 'k-label' }),
          text(counterX, counterY + 24, ph ? 'faint: 20, 40, 60. ○: 2,000 Hz' : 'faint: where it was at 20, 40, 60', { cls: 'k-tick' }))),
      step(6, 'their shadows: in step in the first millisecond, opposite around 10 ms',
        g({ anim: { k: 'in', d: 4.9, len: 0.8 } }, [[W1, 0, 'from 0 ms: in step'], [W2, 9.5, 'at 10 ms: opposite']].map(([P, t0, lab]) => g({},
          axes(P, { xTicks: [[t0, `${fmt(t0, t0 % 1 ? 1 : 0)}`], [t0 + 1, `${fmt(t0 + 1, (t0 + 1) % 1 ? 1 : 0)} ms`]], yTicks: [[1, '1'], [-1, `${M}1`]] }),
          curve(P, t => cosd(360 * 2000 * t / 1000), { cls: 'r7-s90', n: 200 }),
          curve(P, t => cosd(360 * 2050 * t / 1000), { cls: 'r7-s98', n: 200 }),
          text(P.x0, P.y0 - 12, lab, { anchor: 'start', cls: 'k-num' }))))),
      ph ? keyRow(40, 580, [['r7-s90', '2,000 Hz'], ['r7-s98', '2,050 Hz']], { dx: 150, slug: L.slug })
        : keyRow(140, 452, [['r7-s90', '2,000 Hz shadow'], ['r7-s98', '2,050 Hz shadow']], { dx: 240, slug: L.slug }),
    ];
  };

  const ninety = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 50, y: 116, w: 290, h: 190, xs: [1500, 2500], ys: [0, 1.05] }) : plot({ x: 70, y: 116, w: 610, h: 190, xs: [1500, 2500], ys: [0, 1.05] });
    const e = [edge(0.9, Math.SQRT1_2, -1), edge(0.9, Math.SQRT1_2, 1)], f90 = edge(0.9, 0.9, -1), f90r = edge(0.9, 0.9, 1), l = Math.SQRT1_2;
    const by = P.y0 - 24, b90 = P.y0 - 58;
    return [
      axes(P, { yTicks: [[0.9, '90%'], [l, '71%'], [0, '0%']], xTicks: ph ? [[1500, '1,500'], [2000, '2,000 Hz'], [2500, '2,500']] : [[1500, '1,500'], [1750, '1,750'], [2000, '2,000'], [2250, '2,250'], [2500, '2,500 Hz']], zero: false }),
      text(P.x0, 26, 'the notch at pole radius 0.90', { anchor: 'start', cls: 'k-name' }),
      line(P.x0, P.Y(l), P.x1, P.Y(l), { cls: 'r7-level' }), line(P.x0, P.Y(0.9), P.x1, P.Y(0.9), { cls: 'r7-level' }),
      curve(P, f => gainAt(0.9, f), { cls: 'r7-s90', n: 600 }),
      e.map(f => g({}, line(P.X(f), P.Y(l) - 8, P.X(f), by + 6, { cls: 'r7-drop' }), mark('circle', P.X(f), P.Y(l)))),
      bracketH(P.X(e[0]), P.X(e[1]), by),
      text(P.X(e[1]) + 12, by + 4, ph ? '266 Hz' : 'bandwidth: 266 Hz', { anchor: 'start', cls: 'k-num' }),
      line(P.X(f90), P.Y(0.9) - 8, P.X(f90), b90 + 6, { cls: 'r7-drop' }), line(P.X(2000), P.Y(0), P.X(2000), b90 + 6, { cls: 'r7-drop' }),
      mark('square', P.X(f90), P.Y(0.9), { size: 5 }), mark('square', P.X(f90r), P.Y(0.9), { cls: 'r7-m-hollow', size: 5 }),
      bracketH(P.X(f90), P.X(2000), b90),
      text(P.X(f90) - 10, b90 + 4, ph ? '1,728 Hz' : '90% at 1,728 Hz', { anchor: 'end', cls: 'k-num' }),
      text(P.X(2000) + 12, b90 + 4, ph ? '272 Hz away' : '272 Hz from the whine: about one bandwidth', { anchor: 'start', cls: 'k-num' }),
      ph ? text(180, 362, '272 Hz: about one bandwidth', { cls: 'k-note' }) : '',
    ];
  };

  const radiusStrip = L => {
    const ph = L.phone;
    const x0 = ph ? 30 : 230, x1 = ph ? 340 : 690;
    const X = r => x0 + (r - 0.8) / 0.2 * (x1 - x0);
    const rows = ph ? [[96, 'ring under 1% within 4 ms', 0.8, 0.866], [176, '1,800 Hz at 90% or more', 0.926, 0.99], [256, '1,500 Hz at 90% or more', 0.816, 0.99]]
      : [[80, 'ring under 1% within 4 ms', 0.8, 0.866], [130, '1,800 Hz at 90% or more', 0.926, 0.99], [180, '1,500 Hz at 90% or more', 0.816, 0.99]];
    const axisY = ph ? 300 : 222;
    const bar = 16;
    return [
      text(20, 30, 'which pole radii meet each request', { anchor: 'start', cls: 'k-name' }),
      rect(X(0.816), rows[0][0] - bar / 2 - 10, X(0.866) - X(0.816), rows[2][0] - rows[0][0] + bar + 20, { cls: 'r7-plate', rx: 3 }),
      rows.map(([y, label, a, b], i) => g({},
        rect(X(a), y - bar / 2, X(b) - X(a), bar, { cls: 'k-bar-soft' }),
        i === 0 ? path(`M${r2(X(0.8) - 2)} ${y - 7}L${r2(X(0.8) - 10)} ${y}L${r2(X(0.8) - 2)} ${y + 7}Z`, { cls: 'r7-head-soft' }) : '',
        ph ? masked(x0 + 4, y - bar / 2 - 8, label, { anchor: 'start', cls: 'k-label', size: 12 }) : text(x0 - 16, y + 4, label, { anchor: 'end', cls: 'k-label' }))),
      line(x0, axisY, x1, axisY, { cls: 'k-axis' }),
      [0.8, 0.85, 0.9, 0.95, 1].map(r => g({}, line(X(r), axisY, X(r), axisY + 5, { cls: 'k-axis' }), text(X(r), axisY + 20, fmt(r), { cls: 'k-tick' }))),
      text(x1, axisY + 40, ph ? 'pole radius; bars stop short of 1' : 'pole radius, from 0.80; bars stop short of 1, where no pole is stable', { anchor: 'end', cls: 'k-tick' }),
      text(ph ? 180 : X(0.841), axisY + 66, 'both rules hold: 0.816 to just under 0.866', { cls: 'k-note' }),
      bracketH(X(0.866), X(0.926), ph ? rows[1][0] : (rows[0][0] + rows[1][0]) / 2, { tick: 4 }),
      ph ? masked(X(0.896), rows[1][0] + 26, 'gap: none meets both', { cls: 'k-num', size: 12 })
        : text(X(0.874), rows[0][0] + 4, 'gap: no radius meets the first two', { anchor: 'start', cls: 'k-num' }),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: css.replace(/\n/g, ' ').trim(), eyebrow: 'Lesson 7 · how long a filter rings', body: (kk, L) => body(L) });

  return [
    fig('meter', [310, 510], 'The meter after the click',
      'Two frequency-meter panels from 0 to 4,000 Hz: a click should light every tone a little, a flat line; the meter showed one thin hatched spike at 2,000 Hz, made by the notch.',
      'A click should light every tone a little. Right after it, the meter showed one thin spike, at the one tone the notch removes.', meter),
    fig('split-zero', [380, 440], 'Sample 0 is the click plus the ring',
      'At n = 0 the output 0.905 is the click passing through, 1.117, minus a hatched piece of 0.212 hanging down from its top, the start of the ring. From n = 2 the samples 0.172, −0.139 and 0.113 are the ring alone.',
      'The first output sample is two things added: the click passing straight through and the very start of the ring. After that, only the ring is left.', splitZero),
    fig('click-ring', [360, 370], 'One click, and the notch rings',
      'The notch’s answer to one click, n = 0 to 40: sample 0 is 0.905, then the even samples alternate in sign, 0.172, −0.139, 0.113, with zeros between, inside a dashed envelope that keeps 0.9 per sample.',
      'After the click the output never quite stops: up, nothing, down, nothing, at 2,000 Hz, each swing 0.9 of the one before per sample.', clickRing, 4),
    fig('spiral', [440, 680], 'A pole pair in time is a spiral',
      'A dot starts on the unit circle at radius 1 and each sample turns 90 degrees and shrinks to 0.9; its left-right shadow is 1, 0, −0.81, 0, 0.656. A dotted spiral at radius 0.98 shrinks much more slowly.',
      'The turn per sample is the ring’s pitch, the shrink per sample is its decay. After one sample the dot sits exactly on the pole.', spiral, 5),
    fig('decay-time', [440, 460], 'Decay time: down to 1%',
      'The ring’s size at radius 0.9 falls from 100% as 0.9 to the power n: 0.35 after 10 samples, 0.12 after 20; zoomed in, it crosses 1% at 43.7 samples, 5.5 ms.',
      'The decay time is how long the ring takes to fall to 1% of where it started. At radius 0.9 that is 43.7 samples, 5.5 ms.', decayTime),
    fig('pole-gaps', [430, 710], 'Halve the gap, double the ring',
      'Poles at 0.90, 0.95 and 0.98 sit 0.10, 0.05 and 0.02 below the zero on the rim; their rings fall to 1% at 5.5, 11.2 and 28.5 ms.',
      'Each time the pole halves its gap to the circle, its ring lasts twice as long.', poleGaps),
    fig('whine-on', [480, 480], 'The whine switching on rings too',
      'The whine 1, 0, −1, 0 starts at n = 0; from n = 2 each sample cancels the one two back, but the n = 0 sample has no partner, so the output 0.905, −0.733, 0.594, −0.481 leaks out and fades by 0.9 per sample.',
      'From n = 2 on the zero pair cancels the whine exactly. The first sample had nothing to cancel against, and the feedback carries it on as a fading ring.', whineOn, 5),
    fig('bandwidth', [390, 460], 'Bandwidth: the notch’s width at 71%',
      'The notch’s gain from 1,500 to 2,500 Hz at radius 0.90 (solid) and 0.98 (dotted); it crosses 71% at 1,867 and 2,133 Hz, 266 Hz apart, and at 1,974 and 2,026 Hz, 51 Hz apart.',
      'The bandwidth is the distance between the two tones where the notch passes 71%. Poles closer to the circle make it narrower.', bandwidthFig),
    fig('trade-off', [340, 340], 'Every notch sits on one curve',
      'Bandwidth in Hz against decay time in ms for this notch: one falling curve, with pole radii 0.80, 0.85, 0.90, 0.95 and 0.98 marked from short and wide to long and narrow; bandwidth times decay time is about 1.46 everywhere.',
      'Pick a pole radius and you pick a point on this curve. A short ring means a wide notch, a narrow notch means a long ring.', tradeOff),
    fig('half-turn', [360, 360], 'Two samples back: half a turn, a little farther out',
      'On the spiral at radius 0.9, the dot two samples back sits at 0.81 on the left, shadow −0.81; at sample n it is half a turn later at 0.656 on the right, so the new shadow is the old one times −0.81.',
      'Two samples is half a turn, which flips the shadow’s sign, and two shrinks of 0.9, which is 0.81. Together: × −0.81, exactly the feedback rule.', halfTurn, 3),
    fig('click-minus-ring', [500, 800], 'The notch is a click minus a ring',
      'In time, a click of 1.117 minus the spiral scaled by 0.212 gives the notch’s answer 0.905, 0, 0.172. In tones, a flat line at 1.117 minus a narrow hatched peak reaching 1.117 at 2,000 Hz leaves the notch, which dips to 0 at 2,000 Hz.',
      'A click is every tone at once. Take away the ring, a narrow peak at 2,000 Hz, and what is left is the notch.', clickMinusRing, 5),
    fig('triangle', [340, 740], 'Near the top, a right triangle',
      'Zoomed in at the top of the unit circle: the zero on the rim, the pole 1 − r below it and a tone a small arc a away make a right triangle; when a equals 1 − r the legs are equal and the ratio is 71%. Inset: the bottom zero and pole, about 2 and 1.9 away, together with the 0 Hz comparison give about 0.95.',
      'Near the whine only two distances matter: to the top zero, about a, and to the top pole, the triangle’s long side.', triangle),
    fig('drift', [480, 610], 'Telling close tones apart takes time',
      'Two wheels, 2,000 Hz and 2,050 Hz, start together; seen every 20 samples, the 2,050 Hz dot gains 45 degrees each time and is 180 degrees ahead at sample 80, 10 ms. Their shadows over 20 ms start in step and are opposite at 10 ms.',
      'Two tones 50 Hz apart look alike at first. Only after 10 ms are they half a cycle apart.', drift, 6),
    fig('ninety', [350, 390], 'Where the notch gets back to 90%',
      'The notch at radius 0.90 from 1,500 to 2,500 Hz, with lines at 71% and 90%: the bandwidth is 266 Hz, and the gain is back at 90% at 1,728 Hz, 272 Hz from the whine, about one bandwidth.',
      'For this notch a tone gets back to 90% about one bandwidth away from the whine.', ninety),
    fig('radius-strip', [310, 400], 'The window of radii',
      'A strip of pole radius from 0.80 to 1.00: ring under 4 ms from 0.80 to 0.866, 1,800 Hz at 90% from 0.926 up, 1,500 Hz at 90% from 0.816 up; the first two do not meet, and the first and third overlap from 0.816 to just under 0.866.',
      'The first request and the second never meet. The first and the third overlap in a short window.', radiusStrip),
  ];
};
