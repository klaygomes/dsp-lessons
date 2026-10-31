export default k => {
  const { g, line, path, rect, circle, text, plot, axes, curve, stems, step, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const CSS = `
.k-fig .l12-head-ink { fill: var(--ink); }
.k-fig .l12-head-accent { fill: var(--accent); }
.k-fig .l12-head-soft { fill: var(--ink-soft); }
.k-fig .l12-head-open { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.4; }
.k-fig .l12-vec { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .l12-vec-thin { stroke: var(--ink); stroke-width: 1.5; fill: none; }
.k-fig .l12-vec-accent { stroke: var(--accent); stroke-width: 2.5; fill: none; }
.k-fig .l12-vec-soft { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
.k-fig .l12-mirror { stroke: var(--ink-soft); stroke-width: 2.2; stroke-dasharray: 0.1 4.5; stroke-linecap: round; fill: none; }
.k-fig .l12-ref { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 6 4; fill: none; }
.k-fig .l12-bad { stroke: var(--ink); stroke-width: 2.2; fill: none; stroke-linecap: round; }
.k-fig .l12-tint { fill: var(--paper-2); }
.k-fig .l12-faint-bar { fill: var(--ink-soft); opacity: 0.32; }
.k-fig .l12-square { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .l12-ring { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .l12-ring-soft { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.3; }
.k-fig .l12-dot { fill: var(--ink); }
.k-fig .l12-dot-accent { fill: var(--accent); }
.k-fig .l12-dot-soft { fill: var(--ink-soft); }
.k-fig .l12-rim { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .l12-trace { stroke: var(--ink); stroke-width: 1.2; fill: none; }
.k-fig .l12-hatch-bar { stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l12-hatch-bg { fill: var(--paper-2); }
.k-fig .l12-hatch { stroke: var(--ink); stroke-width: 1.4; }
.k-fig .l12-small { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
`;

  const heads = slug => '<defs>'
    + [['i', 'l12-head-ink'], ['a', 'l12-head-accent'], ['s', 'l12-head-soft']].map(([id, cls]) =>
      `<marker id="${slug}-h${id}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><polygon class="${cls}" points="0 0, 10 4, 0 8"/></marker>`).join('')
    + `<marker id="${slug}-ho" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="10" refX="9" refY="5" orient="auto"><polygon class="l12-head-open" points="1 1, 10 5, 1 9"/></marker>`
    + `<pattern id="${slug}-ink-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="l12-hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="l12-hatch"/></pattern>`
    + '</defs>';
  const HEAD = { ink: 'i', thin: 'i', accent: 'a', soft: 's', mirror: 'o' };
  const CLS = { ink: 'l12-vec', thin: 'l12-vec-thin', accent: 'l12-vec-accent', soft: 'l12-vec-soft', mirror: 'l12-mirror' };
  const vec = (slug, x1, y1, x2, y2, kind = 'ink', o = {}) =>
    line(x1, y1, x2, y2, { cls: `spoke ${CLS[kind]}`, 'marker-end': `url(#${slug}-h${HEAD[kind]})`, ...o });
  const arc = (slug, cx, cy, R, a0, a1, kind = 'soft', o = {}) => {
    const p = a => [cx + R * cosd(a), cy - R * sind(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 < a0 ? 1 : 0;
    return path(`M${r2(x0)} ${r2(y0)}A${R} ${R} 0 ${large} ${sweep} ${r2(x1)} ${r2(y1)}`, { cls: CLS[kind], 'marker-end': `url(#${slug}-h${HEAD[kind]})`, ...o });
  };
  const square = (x, y, s = 5, o = {}) => rect(x - s, y - s, 2 * s, 2 * s, { cls: 'l12-square', ...o });
  const diamond = (x, y, s = 6, cls = 'l12-dot') => path(`M${r2(x)} ${r2(y - s)}L${r2(x + s)} ${r2(y)}L${r2(x)} ${r2(y + s)}L${r2(x - s)} ${r2(y)}Z`, { cls });
  const tri = (x, y, s = 6, cls = 'l12-dot') => path(`M${r2(x)} ${r2(y - s)}L${r2(x + s)} ${r2(y + s * 0.8)}L${r2(x - s)} ${r2(y + s * 0.8)}Z`, { cls });
  const sq = (x, y, s = 5, cls = 'l12-dot') => rect(x - s, y - s, 2 * s, 2 * s, { cls });
  const shapes = [(x, y) => circle(x, y, 5.5, { cls: 'l12-dot' }), (x, y) => sq(x, y, 5), (x, y) => diamond(x, y, 6.5), (x, y) => tri(x, y, 6.5)];
  const bad = (x, y) => path(`M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`, { cls: 'l12-bad' });
  const ok = (x, y) => k.check(x, y);
  const legendRow = (x, y, mark, label) => g({}, mark, text(x + 30, y + 4, label, { anchor: 'start', cls: 'k-label' }));
  const rim = (cx, cy, R, ax = 12) => g({}, line(cx - R - ax, cy, cx + R + ax, cy, { cls: 'k-axis' }), line(cx, cy - R - ax, cx, cy + R + ax, { cls: 'k-grid' }), circle(cx, cy, R, { cls: 'l12-rim' }));
  const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477, 1633];

  const keypad = L => {
    const c = L.phone ? { x0: 100, y0: 78, cw: 58, ch: 40, gap: 4, lab: 70 } : { x0: 250, y0: 78, cw: 84, ch: 46, gap: 6, lab: 100 };
    const keys = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
    const X = j => c.x0 + j * (c.cw + c.gap), Y = i => c.y0 + i * (c.ch + c.gap);
    const right = X(3) + c.cw, bottom = Y(3) + c.ch;
    return [
      rect(c.x0 - c.lab, Y(1) - 2, right - c.x0 + c.lab + 4, c.ch + 4, { cls: 'l12-tint', rx: 6 }),
      rect(X(1) - 2, c.y0 - 28, c.cw + 4, bottom - c.y0 + 30, { cls: 'l12-tint', rx: 6 }),
      text((c.x0 + right) / 2, c.y0 - 44, L.phone ? 'column tones, Hz' : 'column tones (high)', { cls: 'k-label' }),
      text(c.x0 - 12, c.y0 - 44, L.phone ? 'row tones' : 'row tones (low)', { anchor: 'end', cls: 'k-label' }),
      COLS.map((f, j) => text(X(j) + c.cw / 2, c.y0 - 12, L.phone ? hz(f) : `${hz(f)} Hz`, { cls: j === 1 ? 'k-num-accent' : 'k-num' })),
      ROWS.map((f, i) => text(c.x0 - 12, Y(i) + c.ch / 2 + 4, `${hz(f)} Hz`, { anchor: 'end', cls: i === 1 ? 'k-num-accent' : L.phone ? 'k-tick' : 'k-num' })),
      keys.map((row, i) => row.map((s, j) => g({},
        rect(X(j), Y(i), c.cw, c.ch, { cls: i === 1 && j === 1 ? 'k-box-accent' : 'k-box', rx: 6 }),
        text(X(j) + c.cw / 2, Y(i) + c.ch / 2 + 5, s, { cls: i === 1 && j === 1 ? 'k-name-accent' : 'k-name' })))),
      text(L.phone ? 180 : (c.x0 + right) / 2 - 40, bottom + 36, L.phone ? 'key 5 = 770 Hz + 1,336 Hz' : 'key 5 plays 770 Hz and 1,336 Hz together', { cls: 'k-note-accent' }),
    ];
  };

  const testTone = L => {
    const rec = [1, 0, -1, 0, 1, 0, -1, 0];
    const cols = [
      { f: 2000, t: rec, title: 'is there 2,000 Hz in it?' },
      { f: 1000, t: range(0, 7).map(n => cosd(45 * n)), title: 'is there 1,000 Hz in it?' },
    ];
    const geo = L.phone
      ? [{ x: 50, y: 30, w: 286, h: 46, gap: 70 }, { x: 50, y: 334, w: 286, h: 46, gap: 70 }]
      : [{ x: 56, y: 30, w: 272, h: 54, gap: 90 }, { x: 412, y: 30, w: 272, h: 54, gap: 90 }];
    const out = [];
    cols.forEach((col, ci) => {
      const G = geo[ci], d0 = ci ? 5.2 : 1, prods = rec.map((v, n) => v * col.t[n]);
      const P = i => plot({ x: G.x, y: G.y + 34 + i * G.gap, w: G.w, h: G.h, xs: [-0.5, 7.5], ys: [-1.3, 1.3] });
      const [A, B, C] = [P(0), P(1), P(2)];
      const label = (Q, s) => text(Q.x0, Q.y0 - 6, s, { anchor: 'start', cls: 'k-label' });
      const base = [
        text(G.x, G.y + 4, col.title, { anchor: 'start', cls: 'k-name' }),
        [A, B, C].map(Q => axes(Q, { xTicks: [] })),
        label(A, 'recording'), label(B, `${hz(col.f)} Hz test tone`), label(C, 'product, sample by sample'),
        stems(A, rec.map((v, n) => [n, v]), { dot: 4 }),
        stems(B, col.t.map((v, n) => [n, v]), { cls: 'k-stem-soft', dot: 4 }),
        range(0, 7).map(n => text(C.X(n), C.y1 + 16, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
      ];
      out.push(step(ci ? 4 : 1, `the recording and the ${hz(col.f)} Hz test tone`, base));
      let run = 0;
      const sums = prods.map(v => (run += v));
      const sumY = C.y1 + 40;
      out.push(step(ci ? 5 : 2, `the products drop in one by one: ${prods.map(v => fmt(v, 0)).join(', ')}`,
        prods.map((v, n) => g({ anim: { k: 'in', d: d0 + n * 0.42, len: 0.35 } }, g({ anim: { k: 'move', dy: -18, d: d0 + n * 0.42, len: 0.5 } },
          stems(C, [[n, v]], Math.abs(v) < 1e-9 ? { dot: 2.5 } : { dot: 4.5, hollow: v < 0 }))))));
      out.push(step(ci ? 6 : 3, `the running sum ticks up to ${fmt(sums[7], 0)}`,
        sums.map((s, n) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: d0 + n * 0.42, len: 0.42 } },
          text(C.x1, sumY, `running sum ${fmt(s, 0)}`, { anchor: 'end', cls: 'k-num' }))),
        g({ anim: { k: 'in', d: d0 + 3.4, len: 0.6 } }, text(C.x1, sumY, `sum ${fmt(sums[7], 0)}`, { anchor: 'end', cls: ci ? 'k-name' : 'k-name-accent' }))));
    });
    const legendY = L.phone ? 666 : 380, lx = L.phone ? 50 : 56, dy = 26;
    const stemMark = (x, y, cls, hollow) => g({}, line(x + 10, y + 6, x + 10, y - 8, { cls }), circle(x + 10, y - 8, 4.5, { cls: cls === 'k-stem' ? `k-stem-dot${hollow ? ' k-hollow' : ''}` : 'k-stem-soft-dot' }));
    const hx = lx + (L.phone ? 0 : 290), hy = legendY + (L.phone ? dy : 0), sy = legendY + (L.phone ? 2 * dy : dy);
    out.push(g({},
      legendRow(lx, legendY, stemMark(lx, legendY, 'k-stem'), 'filled: a positive product'),
      legendRow(hx, hy, stemMark(hx, hy, 'k-stem', true), 'hollow: a negative product'),
      legendRow(lx, sy, stemMark(lx, sy, 'k-stem-soft'), L.phone ? 'dashed: the test tone' : 'dashed: the test tone, your own copy to compare with')));
    return out;
  };

  const hiddenTone = L => {
    const rec = [0, 1, 0, -1, 0, 1, 0, -1], test = [1, 0, -1, 0, 1, 0, -1, 0];
    const G = L.phone ? { x: 50, y: 34, w: 286, h: 46, gap: 68 } : { x: 56, y: 34, w: 300, h: 54, gap: 86 };
    const P = i => plot({ x: G.x, y: G.y + 16 + i * G.gap, w: G.w, h: G.h, xs: [-0.5, 7.5], ys: [-1.3, 1.3] });
    const [A, B, C] = [P(0), P(1), P(2)];
    const label = (Q, s) => text(Q.x0, Q.y0 - 6, s, { anchor: 'start', cls: 'k-label' });
    const wheels = L.phone ? { y: 386, xs: [96, 264], R: 46 } : { y: 150, xs: [500, 638], R: 52 };
    const wheelAt = (cx, n, recDeg, testDeg, prod) => {
      const { R } = wheels, cy = wheels.y, p = a => [cx + R * cosd(a), cy - R * sind(a)];
      const [rx, ry] = p(recDeg), [tx, ty] = p(testDeg);
      return g({},
        text(cx, cy - R - 22, `n = ${n}`, { cls: 'k-name' }),
        rim(cx, cy, R, 8),
        line(cx, cy, tx, ty, { cls: 'l12-ref' }), square(tx, ty, 5.5),
        line(cx, cy, rx, ry, { cls: 'l12-vec-thin' }), circle(rx, ry, 6, { cls: 'l12-dot' }),
        text(cx, cy + R + 32, prod, { cls: 'k-num' }),
        text(cx, cy + R + 50, 'recording × test', { cls: 'k-tick' }));
    };
    const legendY = L.phone ? 520 : 296, lx = L.phone ? 50 : 452;
    return [
      [A, B, C].map(Q => axes(Q, { xTicks: [] })),
      label(A, L.phone ? 'recording: a quarter turn behind' : 'recording: the same 2,000 Hz tone, a quarter turn behind'),
      label(B, '2,000 Hz test tone'), label(C, 'product: all zero'),
      stems(A, rec.map((v, n) => [n, v]), { dot: 4 }),
      stems(B, test.map((v, n) => [n, v]), { cls: 'k-stem-soft', dot: 4 }),
      stems(C, rec.map((v, n) => [n, 0]), { dot: 3.2 }),
      range(0, 7).map(n => text(C.X(n), C.y1 + 16, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
      text(G.x + G.w / 2, C.y1 + 50, 'every product has a zero in it', { cls: 'k-note-accent' }),
      wheelAt(wheels.xs[0], 0, -90, 0, '0 × 1 = 0'),
      wheelAt(wheels.xs[1], 1, 0, 90, '1 × 0 = 0'),
      legendRow(lx, legendY, g({}, line(lx, legendY, lx + 18, legendY, { cls: 'l12-vec-thin' }), circle(lx + 18, legendY, 5, { cls: 'l12-dot' })), "recording's dot"),
      legendRow(lx, legendY + 22, g({}, line(lx, legendY + 22, lx + 18, legendY + 22, { cls: 'l12-ref' }), square(lx + 18, legendY + 22, 4.5)), "test tone's dot"),
    ];
  };

  const shadows = L => {
    const W = L.phone ? { cx: 180, cy: 128, R: 74 } : { cx: 160, cy: 176, R: 92 };
    const P = L.phone ? plot({ x: 72, y: 300, w: 220, h: 220, xs: [-1, 5], ys: [-5, 1] }) : plot({ x: 430, y: 52, w: 240, h: 240, xs: [-1, 5], ys: [-5, 1] });
    const o = [P.X(0), P.Y(0)], u = P.w / 6;
    const at = (a, r = 4) => [P.X(r * cosd(a)), P.Y(r * sind(a))];
    const dotAt = a => [W.cx + W.R * cosd(a), W.cy - W.R * sind(a)];
    const turn = (cx, cy) => ({ k: 'turn', r0: '-90deg', steps: 19, d: 1, len: 3, style: `transform-origin:${cx}px ${cy}px` });
    const spin = (cx, cy, ...kids) => { const { style, ...anim } = turn(cx, cy); return g({ anim, style }, ...kids); };
    const [gx, gy] = at(-45), [fx, fy] = at(-90), [ex, ey] = at(0);
    const radius = path(`M${r2(at(8)[0])} ${r2(at(8)[1])}A${4 * u} ${4 * u} 0 0 1 ${r2(at(-90)[0])} ${r2(at(-90)[1])}`, { cls: 'l12-ref' });
    return [
      heads(L.slug),
      step(1, 'the wheel with the dot\'s starting point, and the two sums drawn as an arrow',
        text(W.cx, W.cy - W.R - 30, 'where the dot starts', { cls: 'k-name' }),
        rim(W.cx, W.cy, W.R),
        circle(...dotAt(0), 5, { cls: 'l12-ring-soft' }), circle(...dotAt(-45), 5, { cls: 'l12-ring-soft' }),
        arc(L.slug, W.cx, W.cy, W.R + 16, 4, -84, 'soft'),
        text(...[W.cx + (W.R + 30) * cosd(-40), W.cy + (W.R + 30) * sind(40) + 4], 'slides', { anchor: 'start', cls: 'k-tick' }),
        line(P.X(-1), o[1], P.X(5), o[1], { cls: 'k-axis' }), line(o[0], P.Y(1), o[0], P.Y(-4.3), { cls: 'k-axis' }),
        text(P.X(1.3), o[1] - 10, 'left-right sum', { cls: 'k-tick' }),
        text(o[0], P.Y(1) - 8, 'up-down sum', { cls: 'k-tick' }),
        radius,
        g({ cls: 'k-faint' }, vec(L.slug, ...o, ex, ey, 'ink'), vec(L.slug, ...o, gx, gy, 'ink')),
        line(o[0], o[1], gx, o[1], { cls: 'l12-ref' }), line(gx, o[1], gx, gy, { cls: 'l12-ref' }),
        text(ex - 4, ey - 10, '(4, 0)', { anchor: 'end', cls: 'k-tick' }),
        text(gx + 10, gy + 4, `(2.83, ${M}2.83)`, { anchor: 'start', cls: 'k-tick' })),
      step(2, 'the starting point slides from the right to the bottom, and the arrow swings with it, its length fixed at 4',
        spin(W.cx, W.cy, line(W.cx, W.cy, ...dotAt(-90), { cls: 'l12-vec-thin' }), circle(...dotAt(-90), 7, { cls: 'l12-dot-accent' })),
        spin(o[0], o[1], vec(L.slug, ...o, fx, fy, 'accent'))),
      step(3, 'every arrow has length 4 and points where the dot started',
        g({ anim: { k: 'in', d: 4.1 } },
          text(fx, fy + 28, `(0, ${M}4)`, { cls: 'k-num-accent' }),
          text(L.phone ? 180 : (P.x0 + P.x1) / 2, P.y1 + 40, 'length 4 every time', { cls: 'k-note-accent' }),
          text(L.phone ? 180 : (P.x0 + P.x1) / 2, P.y1 + 60, 'dashed: the circle of radius 4', { cls: 'k-tick' }))),
    ];
  };

  const sampleArrow = L => {
    const R = L.phone ? 56 : 62;
    const at = i => (L.phone ? { cx: 180, cy: 118 + i * 214 } : { cx: 120 + i * 240, cy: 150 });
    const panel = (i, lines, kids) => {
      const { cx, cy } = at(i);
      return g({}, text(cx, cy - R - 40, lines[0], { cls: 'k-name' }), text(cx, cy - R - 20, lines[1], { cls: 'k-label' }), rim(cx, cy, R, 10), kids(cx, cy));
    };
    const len = 0.7 * R;
    return [
      heads(L.slug),
      panel(0, ['1 · the test wheel at sample 1', 'turned back 90°: points down'], (cx, cy) => g({},
        vec(L.slug, cx, cy, cx, cy + R, 'soft'),
        arc(L.slug, cx, cy, R + 14, -4, -84, 'ink'),
        text(cx + (R + 22) * cosd(-45), cy + (R + 22) * sind(45) + 12, 'back = clockwise', { anchor: 'start', cls: 'k-note-accent' }))),
      panel(1, ['2 · the sample is 0.7', 'an arrow of length 0.7 along it'], (cx, cy) => g({},
        line(cx, cy, cx, cy + R, { cls: 'l12-ref' }),
        vec(L.slug, cx, cy, cx, cy + len, 'ink'),
        text(cx + 10, cy + len / 2 + 4, '0.7', { anchor: 'start', cls: 'k-num' }))),
      panel(2, [`3 · the sample is ${M}0.7`, 'flipped: it points up'], (cx, cy) => g({},
        line(cx, cy, cx, cy + R, { cls: 'l12-ref' }),
        vec(L.slug, cx, cy, cx, cy - len, 'ink'),
        text(cx + 10, cy - len / 2 + 4, '0.7', { anchor: 'start', cls: 'k-num' }))),
      text(L.phone ? 180 : 480, L.phone ? 660 : 262, 'dashed: where the test wheel points', { cls: 'k-tick' }),
    ];
  };

  const walk = (slug, x0, y0, steps, scale, kind, d0, gap) => {
    let x = x0, y = y0;
    return steps.map(([dx, dy], i) => {
      const x1 = x + dx * scale, y1 = y - dy * scale;
      const el = g(d0 === null ? {} : { anim: { k: 'in', d: d0 + i * gap, len: 0.35 } }, vec(slug, x, y, x1, y1, kind));
      [x, y] = [x1, y1];
      return el;
    });
  };

  const unspin = L => {
    const s = L.phone ? 66 : 68, half = 0.5;
    const fwd = range(0, 7).map(() => [half, 0]);
    const oct = range(0, 7).map(n => [half * cosd(45 * n), half * sind(45 * n)]);
    const A = L.phone ? { x: 30, y: 92, tx: 30, ty: 34 } : { x: 34, y: 104, tx: 34, ty: 40 };
    const B = L.phone ? { ty: 230, x: 30, y: 262 } : { ty: 212, x: 34, y: 242 };
    const C = L.phone ? { tx: 30, ty: 434, cx: 180, cy: 540 } : { tx: 410, ty: 40, cx: 560, cy: 150 };
    const octStart = [C.cx - s * half / 2, C.cy + s * half / 2 / Math.tan(Math.PI / 8)];
    const zig = range(0, 7).map(n => {
      const y = B.y + n * 9, right = n % 2 === 0, x0 = right ? B.x : B.x + s * half;
      return g({ anim: { k: 'in', d: 3.4 + n * 0.25, len: 0.3 } }, vec(L.slug, x0, y, right ? x0 + s * half : B.x, y, 'thin'));
    });
    const fan = (x, y) => g({},
      circle(x, y, 3, { cls: 'l12-dot-soft' }),
      [90, 210, 330].map(a => path(`M${x} ${y}L${r2(x + 16 * cosd(a - 14))} ${r2(y - 16 * sind(a - 14))}L${r2(x + 16 * cosd(a + 14))} ${r2(y - 16 * sind(a + 14))}Z`, { cls: 'l12-dot-soft' })),
      [60, 90, 120].map(a => line(x + 22 * cosd(a), y - 22 * sind(a), x + 30 * cosd(a), y - 30 * sind(a), { cls: 'l12-vec-soft' })));
    const endX = A.x + 8 * half * s;
    return [
      heads(L.slug),
      text(A.tx, A.ty, L.phone ? "test wheel at the tone's speed" : "test wheel at the tone's speed, 2,000 Hz", { anchor: 'start', cls: 'k-name' }),
      text(A.tx, A.ty + 20, 'forward half: eight arrows of 0.5 pile up', { anchor: 'start', cls: 'k-label' }),
      step(1, 'the forward half arrows, turned back by the test wheel, all point right and pile up', walk(L.slug, A.x, A.y, fwd, s, 'ink', 0.2, 0.3)),
      step(2, 'the walk is 4 long: the match',
        g({ anim: { k: 'in', d: 2.8, len: 0.5 } }, vec(L.slug, A.x, A.y + 22, endX, A.y + 22, 'accent'),
          text((A.x + endX) / 2, A.y + 44, 'match 4 (N ÷ 2)', { cls: 'k-num-accent' }),
          L.phone ? g({}, fan(300, 330), text(300, 372, 'a fan under a strobe', { cls: 'l12-small' }))
            : g({}, fan(endX + 40, A.y + 4), text(endX + 40, A.y + 40, 'a fan under a strobe', { cls: 'l12-small' })))),
      text(B.x, B.ty, L.phone ? 'mirror half: turns 180° a sample' : 'mirror half: turns 180° a sample against it', { anchor: 'start', cls: 'k-label' }),
      step(3, 'the mirror half goes right, then back, and ends where it started', zig,
        g({ anim: { k: 'in', d: 5.4 } }, text(B.x + s * half + 16, B.y + 36, 'ends where it started: 0', { anchor: 'start', cls: 'k-tick' }))),
      text(C.tx, C.ty, L.phone ? 'test wheel at 1,000 Hz' : 'test wheel at 1,000 Hz', { anchor: 'start', cls: 'k-name' }),
      text(C.tx, C.ty + 20, 'forward half: turns 45° a sample', { anchor: 'start', cls: 'k-label' }),
      step(4, 'at a different speed the arrows curl back to the start', walk(L.slug, octStart[0], octStart[1], oct, s, 'ink', 6, 0.3),
        g({ anim: { k: 'in', d: 8.4 } }, circle(octStart[0], octStart[1], 5, { cls: 'l12-ring' }),
          text(C.cx, octStart[1] + 26, 'curls back to the start: match 0', { cls: 'k-num' }))),
      text(L.phone ? 180 : 360, L.phone ? 680 : 340, 'each arrow: a half arrow of the tone, turned back by the test wheel', { cls: 'k-tick' }),
      text(L.phone ? 180 : 360, L.phone ? 704 : 366, 'match = length of the walk', { cls: 'k-note-accent' }),
    ];
  };

  const mirrorArrows = L => {
    const R = L.phone ? 46 : 74, cy = L.phone ? 96 : 130, xs = L.phone ? [62, 180, 298] : [130, 360, 590];
    const ang = [0, 45, 90];
    const panel = (i, d) => {
      const cx = xs[i], th = ang[i], h = R / 2;
      const tip = [cx + h * cosd(th), cy - h * sind(th)], end = [tip[0] + h * cosd(-th), tip[1] - h * sind(-th)];
      const off = th === 90 ? 6 : 0;
      const inner = g(th ? { anim: { k: 'turn', r0: `${-2 * th}deg`, steps: 14, d, len: 1.6 }, style: `transform-origin:${r2(tip[0])}px ${r2(tip[1])}px` } : {},
        vec(L.slug, tip[0] + off, tip[1], end[0] + off, end[1], 'mirror'), circle(...end, 5, { cls: 'l12-dot-accent' }));
      const outer = g(th ? { anim: { k: 'turn', r0: `${th}deg`, steps: 14, d, len: 1.6 }, style: `transform-origin:${cx}px ${cy}px` } : {},
        vec(L.slug, cx, cy, ...tip, 'ink'), inner);
      return { outer, cx, th };
    };
    const P = L.phone ? plot({ x: 40, y: 214, w: 290, h: 110, xs: [-0.4, 7.6], ys: [-1.2, 1.2] }) : plot({ x: 70, y: 262, w: 600, h: 120, xs: [-0.4, 7.6], ys: [-1.2, 1.2] });
    const panels = [0, 1, 2].map(i => panel(i, i === 1 ? 1 : 2.8));
    return [
      heads(L.slug),
      step(1, 'three moments of a 1,000 Hz tone, n = 0, 1 and 2', xs.map((cx, i) => g({},
        rim(cx, cy, R, 8),
        text(cx, cy - R - 18, `n = ${i}`, { cls: 'k-name' }))), panels[0].outer),
      step(2, 'at n = 1 the forward arrow turns 45 degrees counter-clockwise and its mirror 45 degrees clockwise; their sum slides left to 0.71', panels[1].outer),
      step(3, 'at n = 2 they turn to 90 degrees each way; the sum slides to 0', panels[2].outer),
      step(4, 'the sums, sample by sample, trace the cosine',
        g({ anim: { k: 'in', d: 4.6 } },
          xs.map((cx, i) => text(cx, cy + R + 24, fmt(cosd(ang[i])), { cls: 'k-num-accent' })),
          axes(P, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: range(0, 7).map(n => [n, n ? String(n) : 'n = 0']) }),
          curve(P, t => cosd(45 * t), { cls: 'k-curve-soft' }),
          stems(P, range(0, 7).map(n => [n, cosd(45 * n)]), { dot: 3.5 }),
          [0, 1, 2].map(n => circle(P.X(n), P.Y(cosd(45 * n)), 6, { cls: 'l12-dot-accent' })))),
      g({}, L.phone
        ? [legendRow(30, 380, vec(L.slug, 30, 380, 54, 380, 'ink'), 'solid: the forward half arrow'), legendRow(30, 404, vec(L.slug, 30, 404, 54, 404, 'mirror'), 'dotted: its mirror half'), legendRow(30, 428, circle(42, 428, 5, { cls: 'l12-dot-accent' }), 'where they land: the sample')]
        : [legendRow(70, 428, vec(L.slug, 70, 428, 94, 428, 'ink'), 'solid: forward half'), legendRow(280, 428, vec(L.slug, 280, 428, 304, 428, 'mirror'), 'dotted: mirror half'), legendRow(490, 428, circle(502, 428, 5, { cls: 'l12-dot-accent' }), 'where they land')]),
    ];
  };

  const polygon = L => {
    const s = L.phone ? 96 : 104, half = 0.5;
    const oct = range(0, 7).map(n => [half * cosd(45 * n), half * sind(45 * n)]);
    const C = L.phone ? { cx: 180, cy: 156 } : { cx: 200, cy: 168 };
    const start = [C.cx - s * half / 2, C.cy + s * half / 2 / Math.tan(Math.PI / 8)];
    const x25 = range(0, 7).map(n => cosd(112.5 * n));
    const arrows = x25.map((v, n) => [v * cosd(-90 * n), v * sind(-90 * n)]);
    let px = 0, py = 0; const pts = [[0, 0]];
    arrows.forEach(([dx, dy]) => { px += dx; py += dy; pts.push([px, py]); });
    const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0])), minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
    const s2 = L.phone ? 46 : 54;
    const B = L.phone ? { x: 180 - (minX + maxX) / 2 * s2, y: 470 + (minY + maxY) / 2 * s2, tx: 180, ty: 330 } : { x: 540 - (minX + maxX) / 2 * s2, y: 170 + (minY + maxY) / 2 * s2, tx: 540, ty: 34 };
    const end = pts[8], match = Math.hypot(end[0], end[1]);
    return [
      heads(L.slug),
      text(C.cx, L.phone ? 24 : 34, L.phone ? '2,000 Hz tone, 1,000 Hz test wheel' : '2,000 Hz against the 1,000 Hz wheel', { cls: 'k-name' }),
      text(C.cx, L.phone ? 44 : 54, 'forward half: eight arrows, 45° apart', { cls: 'k-label' }),
      walk(L.slug, start[0], start[1], oct, s, 'ink', null),
      circle(start[0], start[1], 7, { cls: 'l12-ring' }),
      text(start[0] - 14, start[1] + 22, 'start = end', { anchor: 'end', cls: 'k-num' }),
      text(C.cx, start[1] + (L.phone ? 50 : 52), 'one whole turn of difference: back to the start', { cls: 'k-note-accent' }),
      text(B.tx, B.ty, L.phone ? '2,500 Hz tone, 2,000 Hz test wheel' : '2,500 Hz against the 2,000 Hz wheel', { cls: 'k-name' }),
      text(B.tx, B.ty + 20, 'all eight samples, tip to tail', { cls: 'k-label' }),
      walk(L.slug, B.x, B.y, arrows.filter(([dx, dy]) => Math.hypot(dx, dy) > 1e-6), s2, 'thin', null),
      vec(L.slug, B.x, B.y, B.x + end[0] * s2, B.y - end[1] * s2, 'accent'),
      circle(B.x, B.y, 4, { cls: 'l12-dot' }),
      text(B.tx, B.ty + (L.phone ? 236 : 270), `not a whole number of turns: match ${fmt(match)}`, { cls: 'k-num-accent' }),
    ];
  };

  const binWheels = L => {
    const R = L.phone ? 44 : 46;
    const pos = L.phone ? [[62, 96], [180, 96], [298, 96], [121, 262], [239, 262]] : range(0, 4).map(i => [80 + i * 140, 112]);
    return [
      step(1, 'five test wheels for N = 8, making 0 to 4 turns in the block', pos.map(([cx, cy], kk) => {
        const groups = {};
        range(0, 7).forEach(n => { const a = ((45 * kk * n) % 360 + 360) % 360; (groups[a] = groups[a] || []).push(n); });
        const labels = Object.entries(groups).map(([a, ns]) => {
          const s = ns.length === 8 ? '0 to 7' : ns.join(',');
          const flat = Math.abs(sind(+a)) < 0.3, r = R - (flat ? 8 : 12), x = cx + r * cosd(+a), y = cy - r * sind(+a) + (flat ? (cosd(+a) > 0 ? -6 : 14) : 4);
          const anchor = Math.abs(cosd(+a)) < 0.3 ? 'middle' : cosd(+a) > 0 ? 'end' : 'start';
          return g({}, circle(cx + R * cosd(+a), cy - R * sind(+a), 3, { cls: 'k-stop' }), text(x, y, s, { anchor, cls: ns.length > 1 ? 'l12-small' : 'k-tick' }));
        });
        return g({},
          text(cx, cy - R - 26, `${kk} turn${kk === 1 ? '' : 's'}`, { cls: 'k-name' }),
          text(cx, cy + R + 22, `${hz(kk * 1000)} Hz`, { cls: 'k-num' }),
          circle(cx, cy, R, { cls: 'l12-rim' }), labels);
      })),
      step(2, 'the dots step together, one stop per sample, and every wheel is back at the start at sample 8', pos.map(([cx, cy], kk) =>
        g(kk ? { anim: { k: 'turn', r0: `${kk * 360}deg`, steps: 9, d: 1, len: 6 }, style: `transform-origin:${cx}px ${cy}px` } : {},
          circle(cx + R, cy, 6, { cls: 'l12-dot-accent' })))),
      text(L.phone ? 180 : 360, L.phone ? 358 : 202, L.phone ? 'numbers: the sample at each stop' : 'numbers: the sample that lands on each stop. The dot: sample 8, back at the start', { cls: 'k-tick' }),
      L.phone ? text(180, 378, 'the dot: sample 8, back at the start', { cls: 'k-tick' }) : '',
    ];
  };

  const dftBars = L => {
    const P = L.phone ? plot({ x: 40, y: 70, w: 300, h: 160, xs: [-0.6, 7.6], ys: [0, 5] }) : plot({ x: 50, y: 70, w: 400, h: 180, xs: [-0.6, 7.6], ys: [0, 5] });
    const vals = [0, 0, 4, 0, 0, 0, 4, 0], bw = L.phone ? 22 : 28;
    const W = L.phone ? { cx: 180, cy: 440, R: 60 } : { cx: 590, cy: 160, R: 62 };
    const top = [W.cx, W.cy - W.R];
    return [
      heads(L.slug),
      axes(P, { yTicks: [[0, '0'], [2, '2'], [4, '4']], xTicks: [], zero: false }),
      text(P.x0, P.y0 - 14, 'match', { anchor: 'start', cls: 'k-tick' }),
      line(P.X(4), P.y0 - (L.phone ? 24 : 6), P.X(4), P.y1, { cls: 'l12-ref' }),
      text(P.X(4), P.y0 - (L.phone ? 30 : 12), 'the limit', { cls: 'k-tick' }),
      vals.map((v, kk) => g({},
        v ? rect(P.X(kk) - bw / 2, P.Y(v), bw, P.Y(0) - P.Y(v), kk > 4 ? { fill: `url(#${L.slug}-ink-hatch)`, cls: 'l12-hatch-bar' } : { cls: 'k-bar' }) : line(P.X(kk) - bw / 2, P.y1, P.X(kk) + bw / 2, P.y1, { cls: 'l12-vec' }),
        text(P.X(kk), (v ? P.Y(v) : P.y1) - 8, String(v), { cls: v ? 'k-num' : 'k-tick' }),
        text(P.X(kk), P.y1 + 18, String(kk), { cls: 'k-num' }),
        L.phone ? '' : text(P.X(kk), P.y1 + 34, kk ? `${kk},000` : '0', { cls: 'l12-small' }))),
      text(P.x0 - 8, P.y1 + 18, 'bin', { anchor: 'end', cls: 'k-tick' }),
      L.phone ? text(P.x0, P.y1 + 40, 'bin k: k × 1,000 Hz', { anchor: 'start', cls: 'k-tick' }) : text(P.x0 - 8, P.y1 + 34, 'Hz', { anchor: 'end', cls: 'l12-small' }),
      path(`M${P.X(5) - bw / 2} ${P.Y(4.7) + 6}V${P.Y(4.7)}H${P.X(7) + bw / 2}V${P.Y(4.7) + 6}`, { cls: 'l12-vec-thin' }),
      text(P.X(6) + (L.phone ? -10 : 0), P.Y(4.7) - 8, L.phone ? 'mirror of 3 to 1' : 'mirror of bins 3 to 1', { cls: 'k-label' }),
      text(W.cx, W.cy - W.R - 40, "bin 6's test wheel", { cls: 'k-name' }),
      rim(W.cx, W.cy, W.R, 10),
      arc(L.slug, W.cx, W.cy, W.R + 14, -4, -266, 'ink'),
      arc(L.slug, W.cx, W.cy, W.R - 16, 6, 86, 'thin'),
      circle(...top, 6, { cls: 'l12-dot-accent' }),
      text(W.cx + (W.R + 22) * cosd(-45), W.cy + (W.R + 22) * sind(45) + 14, 'back 270°', { anchor: 'start', cls: 'k-num' }),
      text(W.cx - 6, W.cy - 24, 'forward', { anchor: 'end', cls: 'l12-small' }), text(W.cx - 6, W.cy - 12, '90°', { anchor: 'end', cls: 'l12-small' }),
      text(W.cx, W.cy + W.R + 46, 'same spot: bin 6 really turns forward,', { cls: 'k-label' }),
      text(W.cx, W.cy + W.R + 64, 'so it freezes the mirror arrow', { cls: 'k-label' }),
    ];
  };

  const binsFig = L => {
    const Ns = [[8, '1,000 Hz apart'], [40, '200 Hz apart'], [100, '80 Hz apart'], [205, '39.0 Hz apart']];
    const verdict = ['all four tones share bin 1', '770 and 852 Hz collide on bin 4', 'own bins, but no empty bin between', 'an empty bin between each pair'];
    const x0 = L.phone ? 30 : 170, x1 = L.phone ? 336 : 690, f0 = 580, f1 = 1060;
    const X = f => x0 + (f - f0) / (f1 - f0) * (x1 - x0);
    const yAt = i => (L.phone ? 140 + i * 112 : 106 + i * 96);
    const near = (f, N) => Math.round(f * N / 8000);
    return [
      L.phone ? '' : text(x0 - 150, 50, 'block length', { anchor: 'start', cls: 'k-tick' }),
      ROWS.map((f, i) => g({}, shapes[i](X(f), L.phone ? 50 : 46), text(X(f), L.phone ? 30 : 30, String(f), { cls: 'k-num' }))),
      text(x1, L.phone ? 22 : 30, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      Ns.map(([N, apart], i) => {
        const y = yAt(i), ticks = range(Math.ceil(f0 * N / 8000), Math.floor(f1 * N / 8000));
        const used = ROWS.map(f => near(f, N));
        const empty = N === 205 ? [19, 21, 23] : [];
        const good = i === 3;
        return g({},
          empty.map(kk => rect(X(kk * 8000 / N) - 9, y - 9, 18, 18, { cls: 'l12-tint', rx: 3 })),
          line(x0, y, x1, y, { cls: 'k-axis' }),
          ticks.map(kk => line(X(kk * 8000 / N), y - 6, X(kk * 8000 / N), y + 6, { cls: 'l12-vec-thin' })),
          [...new Set(used)].map(kk => text(X(kk * 8000 / N), y + 22, String(kk), { cls: 'k-num' })),
          ROWS.map((f, j) => g({}, line(X(f), y - 30, X(near(f, N) * 8000 / N), y - 8, { cls: 'l12-vec-soft' }), shapes[j](X(f), y - 32))),
          L.phone
            ? g({}, text(x0, y - 50, `N = ${N} · ${apart}`, { anchor: 'start', cls: 'k-label' }))
            : g({}, text(x0 - 150, y - 4, `N = ${N}`, { anchor: 'start', cls: 'k-name' }), text(x0 - 150, y + 14, apart, { anchor: 'start', cls: 'k-tick' })),
          good ? ok(x1 - 8 - (L.phone ? 0 : 0), y + 34) : bad(x1 - 8, y + 34),
          text(x1 - 24, y + 38, verdict[i], { anchor: 'end', cls: good ? 'k-num' : 'k-label' }));
      }),
      L.phone ? text(30, yAt(3) + 66, 'ticks: bins; shaded: the empty bins', { anchor: 'start', cls: 'k-tick' }) : text(x0, yAt(3) + 64, 'ticks: bins, numbered where a tone lands; shaded: the empty bins between row tones', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const spill = L => {
    const P = L.phone ? plot({ x: 52, y: 92, w: 286, h: 190, xs: [0, 3], ys: [0, 1.05] }) : plot({ x: 90, y: 74, w: 560, h: 210, xs: [0, 3], ys: [0, 1.05] });
    const sinc = d => (d < 1e-9 ? 1 : Math.abs(Math.sin(Math.PI * d) / (Math.PI * d)));
    const pts = [[0, '100%'], [0.5, 'about 63%'], [1.5, 'about 21%'], [2.5, 'about 13%']];
    return [
      rect(P.X(0), P.y0, P.X(0.5) - P.X(0), P.h, { cls: 'l12-tint' }),
      rect(P.X(1.5), P.y0, P.X(3) - P.X(1.5), P.h, { cls: 'l12-tint' }),
      text(P.X(0), P.y0 - (L.phone ? 50 : 30), L.phone ? 'own bin: at most half a bin' : 'own bin: at most half a bin away', { anchor: 'start', cls: 'k-label' }),
      text(P.X(3), P.y0 - (L.phone ? 32 : 12), L.phone ? 'rival: at least 1.5 bins' : 'rival past an empty bin: at least 1.5 bins away', { anchor: 'end', cls: 'k-label' }),
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3].map(v => [v, String(v)]), zero: false }),
      text(P.x1, P.y1 + 36, 'distance from the tone, bins', { anchor: 'end', cls: 'k-tick' }),
      text(P.x0 - 8, P.y0 - (L.phone ? 70 : 50), 'share the bin gets', { anchor: 'start', cls: 'k-tick' }),
      curve(P, sinc, { n: 300 }),
      [1, 2, 3].map(d => circle(P.X(d), P.Y(0), 4, { cls: 'l12-ring-soft' })),
      pts.map(([d, s]) => g({}, circle(P.X(d), P.Y(sinc(d)), 5.5, { cls: d ? 'l12-dot' : 'l12-dot-accent' }),
        text(P.X(d) + (L.phone && d === 2.5 ? -8 : d === 0 ? 10 : 8), P.Y(sinc(d)) - 10, s, { anchor: L.phone && d === 2.5 ? 'end' : 'start', cls: d === 0.5 ? 'k-num-accent' : 'k-num' }))),
      text(P.x0, P.y1 + (L.phone ? 54 : 36), 'hollow: 0% at whole bins', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const key5Bars = L => {
    const N = 205, x = range(0, N - 1).map(n => cosd(360 * 770 * n / 8000) + cosd(360 * 1336 * n / 8000));
    const mag = kk => { let re = 0, im = 0; x.forEach((v, n) => { re += v * cosd(360 * kk * n / N); im -= v * sind(360 * kk * n / N); }); return Math.hypot(re, im) / (N / 2); };
    const T = L.phone ? plot({ x: 40, y: 44, w: 300, h: 80, xs: [0, N - 1], ys: [-2.2, 2.2] }) : plot({ x: 60, y: 46, w: 480, h: 90, xs: [0, N - 1], ys: [-2.2, 2.2] });
    const P = L.phone ? plot({ x: 40, y: 220, w: 300, h: 200, xs: [14.4, 45.6], ys: [0, 1.05] }) : plot({ x: 60, y: 210, w: 480, h: 220, xs: [14.4, 45.6], ys: [0, 1.05] });
    const keyBins = [18, 20, 22, 24, 31, 34, 38, 42], bw = L.phone ? 6 : 10;
    const tones = [...ROWS, ...COLS];
    const shown = { 19: '32%', 20: '90%', 34: '92%' };
    const sideX = P.x1 + (L.phone ? 0 : 18);
    return [
      text(T.x0, T.y0 - 14, L.phone ? 'the key 5 beep: 205 samples' : 'the key 5 beep: 205 samples, 25.6 ms', { anchor: 'start', cls: 'k-label' }),
      axes(T, { xTicks: [[0, 'n = 0'], [204, '204']] }),
      path(x.map((v, n) => `${n ? 'L' : 'M'}${r2(T.X(n))} ${r2(T.Y(v))}`).join(''), { cls: 'l12-trace' }),
      text(P.x0, P.y0 - 26, L.phone ? 'match, as a share of 102.5' : 'match of bins 15 to 45, as a share of N ÷ 2 = 102.5', { anchor: 'start', cls: 'k-label' }),
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: [15, 20, 25, 30, 35, 40, 45].map(v => [v, String(v)]), zero: false }),
      text(P.x1, P.y1 + 50, 'bin', { anchor: 'end', cls: 'k-tick' }),
      range(15, 45).map(kk => {
        const v = mag(kk), win = kk === 20 || kk === 34, key = keyBins.includes(kk);
        return g({}, rect(P.X(kk) - bw / 2, P.Y(v), bw, P.Y(0) - P.Y(v), { cls: win ? 'k-bar-accent' : key ? 'k-bar' : 'l12-faint-bar' }),
          shown[kk] ? text(P.X(kk) + (kk === 19 ? -2 : 0), P.Y(v) - 8, shown[kk], { anchor: kk === 19 ? 'end' : 'middle', cls: win ? 'k-num-accent' : 'k-num' }) : '');
      }),
      line(P.X(21) + 2, P.Y(0.2) - 2, P.X(23.4), P.Y(0.42), { cls: 'l12-vec-soft' }),
      text(P.X(23.4) + 3, P.Y(0.42) - 2, '20%', { anchor: 'start', cls: 'k-num' }),
      tones.map(f => tri(P.X(f * N / 8000), P.y1 + 30, 4.5, 'l12-dot-soft')),
      line(P.x0, P.Y(0.25), P.x1 + (L.phone ? 0 : 8), P.Y(0.25), { cls: 'l12-ref' }),
      text(P.x1, P.Y(0.25) - 6, 'bar 25%', { anchor: 'end', cls: 'k-num' }),
      L.phone ? '' : g({},
        path(`M${sideX} ${P.Y(0.162)}h6V${P.Y(0.859)}h-6`, { cls: 'l12-vec-thin' }),
        text(sideX + 12, P.Y(0.859) + 4, 'weakest own bin 86%', { anchor: 'start', cls: 'k-tick' }),
        text(sideX + 12, P.Y(0.162) + 12, 'worst rival about 16%', { anchor: 'start', cls: 'k-tick' }),
        text(sideX + 12, P.Y(0.5) - 4, 'the bar sits', { anchor: 'start', cls: 'k-label' }),
        text(sideX + 12, P.Y(0.5) + 12, 'in this band', { anchor: 'start', cls: 'k-label' })),
      L.phone ? g({},
        text(40, P.y1 + 76, 'every key, every phase: own bins at least 86%,', { anchor: 'start', cls: 'k-tick' }),
        text(40, P.y1 + 94, 'rival bins about 16% at most', { anchor: 'start', cls: 'k-tick' })) : '',
      g({}, (L.phone
        ? [[40, P.y1 + 124], [40, P.y1 + 146], [40, P.y1 + 168]]
        : [[60, 500], [270, 500], [500, 500]]).map(([lx, ly], i) => [
        legendRow(lx, ly, rect(lx + 4, ly - 7, 12, 14, { cls: 'k-bar' }), 'keypad bin'),
        legendRow(lx, ly, rect(lx + 4, ly - 7, 12, 14, { cls: 'l12-faint-bar' }), 'faint: not checked'),
        legendRow(lx, ly, tri(lx + 10, ly, 5, 'l12-dot-soft'), 'a keypad tone'),
      ][i])),
      text(L.phone ? 40 : 60, L.phone ? P.y1 + 196 : 528, 'of the eight keypad bins, only 20 and 34 clear the bar', { anchor: 'start', cls: 'k-note-accent' }),
    ];
  };

  const circleBins = L => {
    const A = L.phone ? { cx: 180, cy: 150, R: 96 } : { cx: 180, cy: 180, R: 112 };
    const B = L.phone ? { cx: 160, cy: 470, R: 92 } : { cx: 490, cy: 180, R: 104 };
    const P = (C, a, r = C.R) => [C.cx + r * cosd(a), C.cy - r * sind(a)];
    const keyBins = [18, 20, 22, 24, 31, 34, 38, 42];
    return [
      text(A.cx, A.cy - A.R - 34, 'N = 8: one bin every 45°', { cls: 'k-name' }),
      rim(A.cx, A.cy, A.R, 14),
      range(0, 7).map(kk => {
        const [x, y] = P(A, 45 * kk), [lx, ly] = P(A, 45 * kk, A.R + 18);
        return g({}, circle(x, y, 6, { cls: kk > 4 ? 'l12-ring' : 'l12-dot' }), text(lx, ly + 4, String(kk), { cls: 'k-num' }));
      }),
      text(A.cx + A.R - 8, A.cy - 10, '0 Hz', { anchor: 'end', cls: 'k-tick' }),
      text(A.cx - A.R + 8, A.cy - 10, '4,000 Hz', { anchor: 'start', cls: 'k-tick' }),
      text(A.cx, A.cy + 32, 'hollow: mirrors', { cls: 'k-tick' }),
      text(A.cx, A.cy + 48, 'of bins 3 to 1', { cls: 'k-tick' }),
      text(B.cx, B.cy - B.R - 34, 'N = 205: the eight keypad bins', { cls: 'k-name' }),
      rim(B.cx, B.cy, B.R, 14),
      range(0, 204).map(kk => circle(...P(B, 360 * kk / 205), 1.3, { cls: 'l12-dot-soft' })),
      keyBins.map(kk => circle(...P(B, 360 * kk / 205), 4.5, { cls: 'l12-dot-accent' })),
      line(...P(B, 360 * 21 / 205, B.R + 6), ...P(B, 360 * 21 / 205, B.R + 22), { cls: 'l12-vec-soft' }),
      line(...P(B, 360 * 36 / 205, B.R + 6), ...P(B, 360 * 36 / 205, B.R + 22), { cls: 'l12-vec-soft' }),
      text(P(B, 360 * 21 / 205, B.R + 26)[0], P(B, 360 * 21 / 205, B.R + 26)[1] + 4, 'rows 18 to 24', { anchor: 'start', cls: 'k-num-accent' }),
      text(P(B, 360 * 36 / 205, B.R + 26)[0], P(B, 360 * 36 / 205, B.R + 26)[1] - 2, 'columns 31 to 42', { anchor: 'start', cls: 'k-num-accent' }),
      text(B.cx + B.R - 8, B.cy + 18, '0 Hz', { anchor: 'end', cls: 'k-tick' }),
      text(L.phone ? 180 : 355, L.phone ? 612 : 352, 'bin k sits at 360° × k ÷ N, starting at 0 Hz on the right', { cls: 'k-note-accent' }),
    ];
  };

  return [
    { name: 'keypad', w: 720, h: 336, phone: { w: 360, h: 304 }, css: CSS,
      title: 'A key is a row tone plus a column tone',
      desc: 'A 4 by 4 keypad. The four row tones, 697, 770, 852 and 941 Hz, run down the left; the four column tones, 1,209, 1,336, 1,477 and 1,633 Hz, run across the top. Key 5 sits where the 770 Hz row meets the 1,336 Hz column.',
      caption: 'Each row has a low tone and each column a high tone. Key 5 plays its row tone, 770 Hz, and its column tone, 1,336 Hz, together.',
      body: (k, L) => keypad(L) },
    { name: 'test-tone', w: 720, h: 420, phone: { w: 360, h: 740 }, steps: 6, css: CSS,
      title: 'Multiply by a test tone and add',
      desc: 'Left: the recording 1, 0, minus 1, 0 repeated, times the 2,000 Hz test tone, gives products 1, 0, 1, 0 repeated, sum 4. Right: the same recording times the 1,000 Hz test tone gives products 1 at sample 0 and minus 1 at sample 4, zero elsewhere, sum 0.',
      caption: 'Top row: the recording. Middle: the test tone. Bottom: their product at each sample. Against 2,000 Hz every product is positive or zero and the sum is 4. Against 1,000 Hz the +1 at sample 0 meets the −1 at sample 4, and the sum is 0.',
      body: (k, L) => testTone(L) },
    { name: 'hidden-tone', w: 720, h: 360, phone: { w: 360, h: 560 }, css: CSS,
      title: 'The tone that hid',
      desc: 'The recording 0, 1, 0, minus 1 repeated, a 2,000 Hz tone a quarter turn behind, against the 2,000 Hz test tone 1, 0, minus 1, 0. Every product is zero. Two wheels show why: at sample 0 the recording\'s dot is at the bottom, shadow 0, while the test dot is at the right; at sample 1 the recording\'s dot is at the right while the test dot is at the top, shadow 0.',
      caption: 'The same 2,000 Hz tone, a quarter turn behind, against the 2,000 Hz test tone. At every sample one of the two dots sits at the top or bottom of the wheel, where its left-right shadow is zero, so every product is zero.',
      body: (k, L) => hiddenTone(L) },
    { name: 'shadows', w: 720, h: 380, phone: { w: 360, h: 600 }, steps: 3, css: CSS,
      title: 'The two sums make an arrow of length 4',
      desc: 'Left: a wheel with the dot\'s starting point sliding from the right to the bottom. Right: the left-right sum and the up-down sum drawn as an arrow. Its tip goes from (4, 0) through (2.83, minus 2.83) to (0, minus 4), always on a dashed circle of radius 4, pointing where the dot started.',
      caption: 'Wherever the dot starts, the arrow made by the two sums points there, and its length stays 4. Faint: the arrows for a start at the right and 45° below it.',
      body: (k, L) => shadows(L) },
    { name: 'sample-arrow', w: 720, h: 280, phone: { w: 360, h: 680 }, css: CSS,
      title: "One sample's arrow",
      desc: 'Three steps. One: the 2,000 Hz test wheel at sample 1, turned back 90 degrees clockwise, points down. Two: a sample of 0.7 gives an arrow of length 0.7 pointing down. Three: a sample of minus 0.7 flips the arrow to point up.',
      caption: 'The test wheel sets the direction, the sample sets the length, and a negative sample flips the arrow to the opposite side.',
      body: (k, L) => sampleArrow(L) },
    { name: 'unspin', w: 720, h: 380, phone: { w: 360, h: 720 }, steps: 4, css: CSS,
      title: 'Pile up or curl away',
      desc: 'Left: against the test wheel at the tone\'s speed, the forward half\'s eight arrows of 0.5 all point right and pile up into a walk of length 4, the match; the mirror half goes right and back and ends where it started. Right: against a 1,000 Hz test wheel the forward half\'s arrows turn 45 degrees a sample and curl back to the start, match 0.',
      caption: 'Left: at the tone\'s speed the forward half\'s arrows line up into one walk of N ÷ 2 = 4, while the mirror half goes back and forth and ends at the start. Right: at another speed the arrows curl back to the start. The match is the length of the walk.',
      body: (k, L) => unspin(L) },
    { name: 'mirror-arrows', w: 720, h: 450, phone: { w: 360, h: 444 }, steps: 4, css: CSS,
      title: 'A real tone is two half arrows',
      desc: 'Three moments of a 1,000 Hz tone, n = 0, 1 and 2. A forward half arrow turns 45 degrees counter-clockwise a sample, and its mirror half arrow, laid at its tip, turns 45 degrees clockwise. Together they always land on the horizontal line, at 1.00, 0.71 and 0.00, which are the samples of the cosine plotted below.',
      caption: 'Each moment shows the forward half arrow (solid) and its mirror half (dotted) laid tip to tail. They always land on the horizontal line, and the spot where they land is the sample: 1.00, 0.71, 0.00, tracing the cosine below.',
      body: (k, L) => mirrorArrows(L) },
    { name: 'polygon', w: 720, h: 360, phone: { w: 360, h: 640 }, css: CSS,
      title: 'Whole turns cancel exactly',
      desc: 'Left: the forward half of the 2,000 Hz tone against the 1,000 Hz test wheel: eight arrows 45 degrees apart close a regular octagon, ending where they started. Right: a 2,500 Hz tone against the 2,000 Hz test wheel: the eight sample arrows do not close, and the arrow from start to end has length 2.80.',
      caption: 'Left: one whole turn of difference, so the eight arrows close an octagon and the walk ends at the start. Right: 2,500 Hz against the 2,000 Hz wheel is not a whole number of turns, and the walk stops 2.80 from where it began.',
      body: (k, L) => polygon(L) },
    { name: 'bin-wheels', w: 720, h: 220, phone: { w: 360, h: 392 }, steps: 2, css: CSS,
      title: 'Test wheels that make whole turns',
      desc: 'Five test wheels for a block of 8 samples, making 0, 1, 2, 3 and 4 turns: 0, 1,000, 2,000, 3,000 and 4,000 Hz. Each wheel marks where its dot lands at samples 0 to 7. The dots step together, and at sample 8 every wheel is back at the start.',
      caption: 'For N = 8, the wheels that make 0 to 4 whole turns in the block. The numbers say which samples land on each stop. At sample 8 every dot is back where it began.',
      body: (k, L) => binWheels(L) },
    { name: 'dft-bars', w: 720, h: 330, phone: { w: 360, h: 600 }, css: CSS,
      title: 'The DFT of the 2,000 Hz recording',
      desc: 'A bar chart of the eight matches for the recording 1, 0, minus 1, 0 repeated: 4 at bins 2 and 6, zero elsewhere. Bins 5 to 7 are beyond the limit and mirror bins 3 to 1; bin 6 is hatched. Beside it, bin 6\'s test wheel: turning back 270 degrees lands where turning forward 90 degrees does.',
      caption: 'All eight matches. Bin 2 holds the tone; bin 6 (hatched) holds its mirror, because turning back 270° a sample lands in the same spot as turning forward 90°.',
      body: (k, L) => dftBars(L) },
    { name: 'bins', w: 720, h: 470, phone: { w: 360, h: 550 }, css: CSS,
      title: 'Longer blocks put the bins closer together',
      desc: 'Four number lines for blocks of 8, 40, 100 and 205 samples. Ticks mark the bins; the four row tones, 697, 770, 852 and 941 Hz, each with its own marker shape, connect to their nearest bin. At 8 all four share bin 1; at 40, 770 and 852 Hz share bin 4; at 100 each has its own bin with no gap; at 205 they land on 18, 20, 22 and 24 with an empty bin between each pair.',
      caption: 'Each line is one row of the table: bins as ticks, the four row tones joined to their nearest bin. Only at 205 samples does every row tone get its own bin with an empty bin (shaded) on each side.',
      body: (k, L) => binsFig(L) },
    { name: 'spill', w: 720, h: 340, phone: { w: 360, h: 340 }, css: CSS,
      title: 'How much a bin picks up',
      desc: 'A curve of the share a bin picks up against its distance from the tone, 0 to 3 bins: 100% at 0, about 63% at half a bin, about 21% at 1.5 bins, about 13% at 2.5 bins, and 0% at whole-bin distances. Shaded zones: the own bin, at most half a bin away, and a rival past an empty bin, at least 1.5 bins away.',
      caption: 'A tone\'s own bin is at most half a bin away, so it gets at least about 63%. A rival past an empty bin is at least 1.5 bins away and gets about 21% at most.',
      body: (k, L) => spill(L) },
    { name: 'key5-bars', w: 720, h: 540, phone: { w: 360, h: 640 }, css: CSS,
      title: 'Decoding the key 5',
      desc: 'Top: the 205 samples of the key 5 beep. Bottom: the matches of bins 15 to 45 as a share of 102.5. Bin 20 reaches 90% and bin 34 reaches 92%; bins 19 and 21 pick up 32% and 20% of spill. A dashed line marks the 25% bar. Of the eight keypad bins, only 20 and 34 clear it. Bins the detector does not check are drawn faint.',
      caption: 'The key 5 as samples and as bins. Of the eight keypad bins (solid), only 20 and 34 clear the 25% bar. Faint bars are bins the detector never checks.',
      body: (k, L) => key5Bars(L) },
    { name: 'circle-bins', w: 720, h: 370, phone: { w: 360, h: 630 }, css: CSS,
      title: 'The bins sit on the unit circle',
      desc: 'Left: the unit circle with eight evenly spaced points for N = 8, bin 0 at 0 Hz on the right, bin 4 at 4,000 Hz on the left, bins 5 to 7 hollow on the bottom half as mirrors. Right: the same circle with 205 points for N = 205 and the eight keypad bins, 18 to 24 and 31 to 42, highlighted.',
      caption: 'The DFT reads the z-transform at N evenly spaced points on the unit circle, bin k at 360° × k ÷ N.',
      body: (k, L) => circleBins(L) },
  ];
};
