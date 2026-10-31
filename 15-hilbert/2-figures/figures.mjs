export default k => {
  const { g, line, path, rect, circle, text, plot, axes, curve, stems, step, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const pt = (cx, cy, R, a) => [cx + R * cosd(a), cy - R * sind(a)];

  const hann = (n, D) => 0.5 + 0.5 * Math.cos(Math.PI * n / (D + 1));
  const gainOf = (N, win, f) => {
    const D = (N - 1) / 2, w = 2 * Math.PI * f / 8000;
    let s = 0;
    for (let n = 1; n <= D; n += 2) s += 2 * (2 / (Math.PI * n)) * (win ? hann(n, D) : 1) * Math.sin(w * n);
    return s;
  };
  const ghostOf = G => Math.abs(1 - G) / (1 + G);
  const pct = (v, d = 2) => `${(v * 100).toFixed(d)}%`;

  const CSS = `
.k-fig .h-top { stroke: var(--ink); stroke-width: 2.4; stroke-linecap: round; }
.k-fig .h-mirror { stroke: var(--ink); stroke-width: 2.6; stroke-dasharray: 0.5 5; stroke-linecap: round; }
.k-fig .h-ref { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 4; }
.k-fig .h-res { stroke: var(--accent); stroke-width: 2.8; stroke-linecap: round; }
.k-fig .h-given { stroke: var(--input); stroke-width: 2.4; stroke-linecap: round; }
.k-fig .h-head { fill: var(--ink); }
.k-fig .h-head-open { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; stroke-linejoin: round; }
.k-fig .h-head-soft { fill: var(--ink-soft); }
.k-fig .h-head-accent { fill: var(--accent); }
.k-fig .h-head-input { fill: var(--input); }
.k-fig .h-circle { fill: none; stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .h-bar-ref { fill: none; stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 5 3; }
.k-fig .h-band { fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .h-dotted { stroke: var(--ink); stroke-width: 2.2; stroke-dasharray: 0.5 4.5; stroke-linecap: round; fill: none; }
.k-fig .h-chip { fill: none; stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .h-shadow { fill: var(--ink); }
.k-fig .h-shadow-soft { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .h-arc { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .h-arc-input { stroke: var(--input); stroke-width: 1.6; fill: none; }
.k-fig .h-wedge { fill: var(--paper-2); }
.k-fig .h-collide { stroke: var(--accent); stroke-width: 2; }
.k-fig .h-lobe-left { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.2; }
.k-fig .h-soft-stem { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 3 3; }
.k-fig .h-soft-dot { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.3; }
.k-fig .h-hollow-dot { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
.k-fig .h-tick-label { font-family: var(--font-mono); font-size: 10px; fill: var(--ink-soft); }
`;

  const head = (x1, y1, x2, y2, len, half) => {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const bx = x2 - ux * len, by = y2 - uy * len;
    return { bx, by, pts: `${r2(x2)},${r2(y2)} ${r2(bx - uy * half)},${r2(by + ux * half)} ${r2(bx + uy * half)},${r2(by - ux * half)}` };
  };
  const LINE = { top: 'h-top', mirror: 'h-mirror', ref: 'h-ref', res: 'h-res', given: 'h-given' };
  const HEAD = { top: 'h-head', mirror: 'h-head-open', ref: 'h-head-soft', res: 'h-head-accent', given: 'h-head-input' };
  const vec = (x1, y1, x2, y2, kind = 'top', o = {}) => {
    const big = kind === 'top' || kind === 'mirror' || kind === 'res';
    const h = head(x1, y1, x2, y2, big ? 11 : 9, big ? 5.5 : 4.5);
    return g(o, line(x1, y1, h.bx, h.by, { cls: LINE[kind] }), `<polygon class="${HEAD[kind]}" points="${h.pts}"/>`);
  };
  const polar = (cx, cy, len, a, kind, o) => { const [x, y] = pt(cx, cy, len, a); return vec(cx, cy, x, y, kind, o); };
  const arcD = (cx, cy, r, a0, a1) => {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `M${r2(x0)} ${r2(y0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${r2(x1)} ${r2(y1)}`;
  };
  const turnArc = (cx, cy, r, a0, a1, cls = 'h-arc', headCls = 'h-head-soft') => {
    const [x1, y1] = pt(cx, cy, r, a1), dir = a1 > a0 ? 1 : -1;
    const tx = -sind(a1) * dir, ty = -cosd(a1) * dir;
    const h = head(x1 - tx * 8, y1 - ty * 8, x1, y1, 7, 3.5);
    return g({}, path(arcD(cx, cy, r, a0, a1 - dir * 4), { cls }), `<polygon class="${headCls}" points="${h.pts}"/>`);
  };
  const wedge = (cx, cy, r, a0, a1) => {
    const [x0, y0] = pt(cx, cy, r, a0);
    return path(`M${cx} ${cy}L${r2(x0)} ${r2(y0)}${arcD(cx, cy, r, a0, a1).replace(/^M[^A]+/, '')}Z`, { cls: 'h-wedge' });
  };
  const ring = (cx, cy, r, axis = true) => g({}, axis ? line(cx - r - 14, cy, cx + r + 14, cy, { cls: 'k-axis' }) : '', circle(cx, cy, r, { cls: 'h-circle' }));
  const clipped = (P, fn, lim, step = 4, cls = 'k-curve') => {
    const pieces = []; let seg = [];
    for (let f = P.xs[0]; f <= P.xs[1] + 1e-9; f += step) {
      const v = fn(f);
      if (v > lim) { if (seg.length) { seg.push([f, lim]); pieces.push(seg); seg = []; } continue; }
      if (!seg.length && f > P.xs[0]) seg.push([f - step, lim]);
      seg.push([f, v]);
    }
    if (seg.length) pieces.push(seg);
    return path(pieces.map(sg => sg.map(([f, v], i) => `${i ? 'L' : 'M'}${r2(P.X(f))} ${r2(P.Y(v))}`).join('')).join(''), { cls });
  };
  const turnAt = (cx, cy, r0, o = {}) => ({ anim: { k: 'turn', r0: `${r0}deg`, steps: 24, ...o }, style: `transform-origin:${r2(cx)}px ${r2(cy)}px` });
  const sq = (x, y, s = 9, cls = 'h-shadow') => rect(x - s / 2, y - s / 2, s, s, { cls });

  const keyLine = (x, y, kind, label, o = {}) => {
    const w = o.w ?? 28;
    const mark = kind === 'hatch' ? rect(x, y - 10, 18, 13, { fill: `url(#${o.slug}-hatch)`, cls: 'k-bar-hatch' })
      : kind === 'bar' ? rect(x, y - 10, 18, 13, { cls: 'k-bar' })
      : kind === 'bar-ref' ? rect(x, y - 10, 18, 13, { cls: 'h-bar-ref' })
      : kind === 'band' ? rect(x, y - 10, 18, 13, { cls: 'h-band' })
      : kind === 'fill' ? rect(x, y - 10, 18, 13, { cls: 'k-fill' })
      : kind === 'stem' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'k-stem' }), circle(x + 9, y - 11, 3.5, { cls: 'k-stem-dot' }))
      : kind === 'stem-soft' ? g({}, line(x + 9, y + 3, x + 9, y - 11, { cls: 'h-soft-stem' }), circle(x + 9, y - 11, 3.5, { cls: 'h-soft-dot' }))
      : kind === 'square' ? sq(x + 9, y - 4)
      : kind === 'square-open' ? sq(x + 9, y - 4, 9, 'h-shadow-soft')
      : kind === 'curve' ? line(x, y - 4, x + w, y - 4, { cls: 'k-curve' })
      : kind === 'dotted' ? line(x, y - 4, x + w, y - 4, { cls: 'h-dotted' })
      : kind === 'dashed' ? line(x, y - 4, x + w, y - 4, { cls: 'h-ref' })
      : vec(x, y - 4, x + w, y - 4, kind);
    const dx = ['hatch', 'bar', 'bar-ref', 'band', 'fill', 'stem', 'stem-soft', 'square', 'square-open'].includes(kind) ? 26 : w + 8;
    return g({}, mark, text(x + dx, y, label, { anchor: 'start', cls: 'k-label' }));
  };

  const hatchBar = (P, f, v, slug, w = 18, o = {}) => rect(P.X(f) - w / 2, P.Y(v), w, P.Y(0) - P.Y(v), { fill: `url(#${slug}-hatch)`, cls: 'k-bar-hatch', ...o });
  const solidBar = (P, f, v, w = 18, o = {}) => rect(P.X(f) - w / 2, P.Y(v), w, P.Y(0) - P.Y(v), { cls: 'k-bar', ...o });
  const refBar = (P, f, v, w = 18, o = {}) => rect(P.X(f) - w / 2, P.Y(v), w, P.Y(0) - P.Y(v), { cls: 'h-bar-ref', ...o });
  const hzTicks = (list) => list.map(f => [f, hz(f)]);

  const split = (L) => {
    const ph = L.phone, x0 = ph ? 24 : 210, x1 = ph ? 336 : 690;
    const P = plot({ x: x0, y: ph ? 74 : 66, w: x1 - x0, h: ph ? 96 : 104, xs: [0, 4000], ys: [0, 1.15] });
    const S = plot({ x: x0, y: 0, w: x1 - x0, h: 10, xs: [0, 4000], ys: [0, 1] });
    const rowY = ph ? [262, 316, 370] : [262, 302, 342], rh = ph ? 22 : 24;
    const rowLabel = (i, s) => ph ? text(x0, rowY[i] - 8, s, { anchor: 'start', cls: 'k-label' }) : text(x0 - 12, rowY[i] + rh / 2 + 4, s, { anchor: 'end', cls: 'k-label' });
    const band = (lo, hi, i, cls, extra = {}) => rect(S.X(lo), rowY[i], S.X(hi) - S.X(lo), rh, { cls, ...extra });
    const axisY = rowY[2] + rh + 14;
    const d700 = P.X(1000) - P.X(700), d1300 = P.X(1300) - P.X(1000);
    const collide = S.X(1700);
    return [
      text(ph ? x0 : 24, ph ? 26 : 30, ph ? 'one 1,000 Hz tone × a 300 Hz tone' : 'one 1,000 Hz tone, times a 300 Hz tone', { anchor: 'start', cls: 'k-name' }),
      ph ? '' : text(24, P.Y(0.5) + 4, 'tone size', { anchor: 'start', cls: 'k-tick' }),
      axes(P, { xTicks: hzTicks([0, 1000, 2000, 3000, 4000]), yTicks: ph ? [] : [[1, '1'], [0.5, '½'], [0, '0']] }),
      text(x1, P.y1 + 36, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      step(1, 'the 1,000 Hz tone, size 1, before the multiplication',
        g({ anim: { k: 'in', d: 0, len: 1 } }, refBar(P, 1000, 1), text(P.X(1000), P.Y(1) - 8, 'call tone, 1,000 Hz', { cls: 'k-label' }))),
      step(2, 'it splits into two half-size tones: 1,300 Hz, the wanted copy, and 700 Hz, the ghost',
        g({ anim: { k: 'move', dx: -d1300, d: 1.2, len: 1.6 } }, solidBar(P, 1300, 0.5), text(P.X(1300) + (ph ? 2 : 14), P.Y(0.5) - 8, ph ? 'wanted' : 'wanted copy, 1,300', { anchor: 'start', cls: 'k-label' })),
        g({ anim: { k: 'move', dx: d700, d: 1.2, len: 1.6 } }, hatchBar(P, 700, 0.5, L.slug), text(P.X(700) - (ph ? 2 : 14), P.Y(0.5) - 8, ph ? 'ghost' : 'ghost, 700', { anchor: 'end', cls: 'k-label' }))),
      text(ph ? x0 : 24, ph ? 222 : 236, ph ? 'a whole voice, 300 to 3,400 Hz' : 'a whole voice, 300 to 3,400 Hz, times the same 300 Hz tone', { anchor: 'start', cls: 'k-name' }),
      rowLabel(0, 'voice, 300 to 3,400 Hz'), band(300, 3400, 0, 'h-bar-ref'),
      rowLabel(1, 'wanted copy, 600 to 3,700'), rowLabel(2, 'ghost, 0 to 3,100'),
      step(3, 'the voice band splits: the wanted copy slides up 300 Hz to 600 to 3,700, the ghost slides down to 0 to 3,100',
        g({ anim: { k: 'move', dx: S.X(300) - S.X(600), dy: rowY[0] - rowY[1], d: 3.2, len: 1.4 } }, band(600, 3700, 1, 'h-band')),
        g({ anim: { k: 'move', dx: S.X(300) - S.X(0), dy: rowY[0] - rowY[2], d: 3.2, len: 1.4 } }, band(0, 3100, 2, 'k-bar-hatch', { fill: `url(#${L.slug}-hatch)` }))),
      line(x0, axisY, x1, axisY, { cls: 'k-axis' }),
      [0, 1000, 2000, 3000, 4000].map(f => text(S.X(f), axisY + 16, hz(f), { cls: 'k-tick' })),
      text(x1, axisY + 32, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      step(4, 'they overlap from 600 to 3,100 Hz; at 1,700 Hz the ghost of 2,000 sits on the wanted copy of 1,400, and no filter can separate them',
        g({ anim: { k: 'in', d: 5, len: 1 } },
          line(collide, rowY[1] - 6, collide, rowY[2] + rh + 6, { cls: 'h-collide' }),
          ph ? g({}, text(x0, axisY + 54, '1,700 Hz: the wanted copy of 1,400', { anchor: 'start', cls: 'k-label' }), text(x0, axisY + 72, 'and the ghost of 2,000 land together', { anchor: 'start', cls: 'k-label' }))
            : text(collide, axisY + 52, '1,700 Hz: the wanted copy of 1,400 and the ghost of 2,000 land together', { cls: 'k-label' }),
          text(ph ? 180 : 450, ph ? axisY + 104 : axisY + 86, 'no filter can separate these', { cls: 'k-note' }))),
    ];
  };

  const negTone = (L) => {
    const ph = L.phone, cx = ph ? 180 : 190, cy = ph ? 166 : 180, r = ph ? 96 : 120;
    const frame = (n, last) => {
      const a = 45 * n, [tx, ty] = pt(cx, cy, r, a), [mx, my] = pt(cx, cy, r, -a), sx = cx + r * cosd(a);
      const num = n === 0 ? text(cx + r + 24, cy + 4, '0', { anchor: 'start', cls: 'k-tick' })
        : g({}, text(...pt(cx, cy, r + 14, a).map((v, i) => v + (i ? 4 : 0)), String(n), { cls: 'k-tick' }), text(...pt(cx, cy, r + 14, -a).map((v, i) => v + (i ? 4 : 0)), String(n), { cls: 'k-tick' }));
      const body = g({}, n ? line(tx, ty, sx, cy, { cls: 'k-guide' }) : '', n ? line(mx, my, sx, cy, { cls: 'k-guide' }) : '',
        polar(cx, cy, r, a, 'top'), polar(cx, cy, r, -a, 'mirror'), sq(sx, cy), num);
      return g({ anim: { k: 'in', d: n * 1.3, len: 0.5 } }, last ? body : g({ cls: 'k-faint', anim: { k: 'fade', o0: 1, d: (n + 1) * 1.3, len: 0.5 } }, body));
    };
    const Q = ph ? plot({ x: 46, y: 452, w: 290, h: 110, xs: [-0.5, 7.5], ys: [-1.1, 1.1] }) : plot({ x: 460, y: 100, w: 240, h: 150, xs: [-0.5, 7.5], ys: [-1.1, 1.1] });
    const cosPts = range(0, 7).map(n => [n, cosd(45 * n)]);
    return [
      ring(cx, cy, r),
      turnArc(cx, cy, 34, 6, 38), turnArc(cx, cy, 34, -6, -38),
      text(cx, cy - r - 34, '+1,000 Hz: +45° per sample', { cls: 'k-label' }),
      text(cx, cy + r + 46, `${M}1,000 Hz: ${M}45° per sample`, { cls: 'k-label' }),
      step(1, 'sample 0: both arrows point right, the shadow is at the rim', frame(0, false)),
      step(2, 'sample 1: the top arrow has turned 45 degrees counter-clockwise, the mirror 45 degrees clockwise; their shadows land on the same spot', frame(1, false)),
      step(3, 'sample 2: the top arrow points straight up, the mirror straight down; the shadow is at the centre', frame(2, true)),
      step(4, 'both shadows added, sample by sample, give the 1,000 Hz cosine: 1.000, 0.707, 0.000 and on',
        g({ anim: { k: 'in', d: 4.2, len: 1 } },
          text(Q.x0 - 30, Q.y0 - 24, ph ? 'both shadows added: the 1,000 Hz tone' : 'both shadows added, n = 0 to 7', { anchor: 'start', cls: 'k-name' }),
          axes(Q, { xTicks: range(0, 7).map(n => [n, n ? String(n) : 'n = 0']), yTicks: [[1, '1'], [-1, `${M}1`]] }),
          stems(Q, cosPts, { dot: 4 }))),
      ph ? g({}, keyLine(24, 356, 'top', 'top arrow, counter-clockwise', { w: 26 }), keyLine(24, 378, 'mirror', 'mirror arrow, clockwise', { w: 26 }), keyLine(24, 400, 'square', 'their shared shadow'))
        : g({}, keyLine(460, 306, 'top', 'top arrow: counter-clockwise', { w: 26 }), keyLine(460, 330, 'mirror', 'mirror arrow: clockwise', { w: 26 }), keyLine(460, 354, 'square', 'their shared shadow')),
    ];
  };

  const chipBoundary = (L) => {
    const ph = L.phone, A = k.arrow;
    if (ph) {
      const bx = 60, bw = 240;
      return [
        text(180, 30, 'from the line: one number per sample', { cls: 'k-label' }),
        A(L.slug, [[180, 40], [180, 92]]),
        rect(24, 70, 312, 330, { cls: 'h-chip', rx: 8 }),
        text(40, 92, 'inside the chip', { anchor: 'start', cls: 'k-name' }),
        k.box(bx, 108, bw, 60, { name: 'make an arrow', sub: 'left-right and up-down' }),
        A(L.slug, [[180, 168], [180, 202]]),
        text(196, 190, 'two numbers', { anchor: 'start', cls: 'k-tick' }),
        k.box(bx, 206, bw, 60, { name: '× one arrow', sub: '+300 Hz, no mirror' }),
        A(L.slug, [[180, 266], [180, 300]]),
        text(196, 288, 'two numbers', { anchor: 'start', cls: 'k-tick' }),
        k.box(bx, 304, bw, 60, { name: 'keep the shadow', sub: 'left-right part only', cls: 'k-box-accent' }),
        A(L.slug, [[180, 364], [180, 440]], { tone: 'accent' }),
        text(180, 460, 'to the line: one number per sample', { cls: 'k-label' }),
        text(180, 500, 'only what leaves has to be a shadow', { cls: 'k-note' }),
      ];
    }
    const y = 128;
    return [
      text(20, y - 6, 'from the line', { anchor: 'start', cls: 'k-name' }), text(20, y + 14, 'one number', { anchor: 'start', cls: 'k-tick' }), text(20, y + 30, 'per sample', { anchor: 'start', cls: 'k-tick' }),
      A(L.slug, [[124, y], [170, y]]),
      rect(146, 50, 432, 156, { cls: 'h-chip', rx: 8 }),
      text(162, 74, 'inside the chip', { anchor: 'start', cls: 'k-name' }),
      k.box(174, y - 30, 120, 60, { name: 'an arrow', sub: 'two numbers' }),
      A(L.slug, [[294, y], [322, y]]),
      k.box(326, y - 30, 104, 60, { name: '× arrow', sub: '+300 Hz' }),
      A(L.slug, [[430, y], [458, y]]),
      k.box(462, y - 30, 100, 60, { name: 'shadow', sub: 'left-right', cls: 'k-box-accent' }),
      text(174, y + 58, 'each arrow: left-right and up-down', { anchor: 'start', cls: 'k-tick' }),
      A(L.slug, [[562, y], [612, y]], { tone: 'accent' }),
      text(620, y - 6, 'to the line', { anchor: 'start', cls: 'k-name' }), text(620, y + 14, 'one number', { anchor: 'start', cls: 'k-tick' }), text(620, y + 30, 'per sample', { anchor: 'start', cls: 'k-tick' }),
      text(360, 244, 'only what goes out on the line has to be a shadow', { cls: 'k-note' }),
    ];
  };

  const ghostArrows = (L) => {
    const ph = L.phone, r = ph ? 80 : 90;
    const [ax, ay] = ph ? [180, 130] : [130, 170], [bx, by] = ph ? [180, 440] : [440, 170];
    const tag = (x, y, s, anchor = 'start', cls = 'k-label') => text(x, y, s, { anchor, cls });
    return [
      text(ax, ph ? 26 : 34, 'before: the call tone', { cls: 'k-name' }),
      ring(ax, ay, r), polar(ax, ay, r, 45, 'top'), polar(ax, ay, r, -45, 'mirror'),
      turnArc(ax, ay, 26, 0, 40), turnArc(ax, ay, 26, 0, -40),
      tag(ax, ay + r + 30, 'top: +45°, +1,000 Hz', 'middle'), tag(ax, ay + r + 48, `mirror: ${M}45°, ${M}1,000 Hz`, 'middle'),
      step(1, 'the multiplier: one arrow turning +13.5 degrees per sample, +300 Hz, applied to both arrows',
        g({ anim: { k: 'in', d: 0.4, len: 1 } },
          ph ? g({}, k.arrow(L.slug, [[180, 270], [180, 316]], { tone: 'input' }), text(196, 290, '× one arrow:', { anchor: 'start', cls: 'k-num-input' }), text(196, 308, '+13.5° per sample', { anchor: 'start', cls: 'k-num-input' }))
            : g({}, k.arrow(L.slug, [[245, 170], [335, 170]], { tone: 'input' }), text(290, 150, '× one arrow', { cls: 'k-num-input' }), text(290, 196, '+13.5°', { cls: 'k-num-input' }), text(290, 212, 'per sample', { cls: 'k-tick' })))),
      text(bx, ph ? 346 : 34, ph ? 'after: both turn 13.5° more' : 'after: both arrows turn 13.5° more', { cls: 'k-name' }),
      ring(bx, by, r),
      polar(bx, by, r, 45, 'ref'), polar(bx, by, r, -45, 'ref'),
      step(2, 'each arrow turns 13.5 degrees further counter-clockwise: the top arrow speeds up, the mirror arrow slows down',
        g(turnAt(bx, by, 13.5, { d: 1.6, len: 1.6 }), polar(bx, by, r, 58.5, 'top'), polar(bx, by, r, -31.5, 'mirror'))),
      turnArc(bx, by, r + 14, 46, 57.5, 'h-arc-input', 'h-head-input'), turnArc(bx, by, r + 14, -44, -32.5, 'h-arc-input', 'h-head-input'),
      step(3, 'the top arrow now turns +58.5 degrees, +1,300 Hz, the wanted copy; the mirror turns -31.5 degrees, -700 Hz, whose shadow sounds at 700 Hz: the ghost',
        g({ anim: { k: 'in', d: 3.4, len: 1 } },
          ph ? g({}, tag(bx, by + r + 30, 'top: +58.5°, +1,300 Hz, wanted', 'middle'), tag(bx, by + r + 48, `mirror: ${M}31.5°, ${M}700 Hz`, 'middle'), tag(bx, by + r + 66, 'its shadow is at 700 Hz: the ghost', 'middle'))
            : g({}, tag(548, 104, 'top: +58.5°'), tag(548, 122, '+1,300 Hz, wanted'), tag(548, 224, `mirror: ${M}31.5°`), tag(548, 242, `${M}700 Hz; its shadow`), tag(548, 260, 'at 700 Hz: the ghost')))),
      ph ? g({}, keyLine(24, 618, 'top', 'top arrow', { w: 24 }), keyLine(170, 618, 'mirror', 'mirror arrow', { w: 24 }), keyLine(24, 642, 'ref', 'before the turn', { w: 24 }))
        : g({}, keyLine(60, 330, 'top', 'top arrow', { w: 24 }), keyLine(210, 330, 'mirror', 'mirror arrow', { w: 24 }), keyLine(380, 330, 'ref', 'where it was before the turn', { w: 24 })),
    ];
  };

  const analytic = (L) => {
    const ph = L.phone, cx = ph ? 180 : 170, cy = ph ? 150 : 160, r = ph ? 100 : 110;
    const [tx, ty] = pt(cx, cy, r, 45), [bx2, by2] = pt(cx, cy, r, -45);
    const ns = range(0, 7);
    const X = ph ? plot({ x: 46, y: 392, w: 290, h: 70, xs: [-0.5, 7.5], ys: [-1.1, 1.1] }) : plot({ x: 420, y: 84, w: 270, h: 74, xs: [-0.5, 7.5], ys: [-1.1, 1.1] });
    const S = ph ? plot({ x: 46, y: 516, w: 290, h: 70, xs: [-0.5, 7.5], ys: [-1.1, 1.1] }) : plot({ x: 420, y: 222, w: 270, h: 74, xs: [-0.5, 7.5], ys: [-1.1, 1.1] });
    const col = P => rect(P.X(1) - 12, P.y0 - 6, 24, P.h + 12, { cls: 'k-row-tint', rx: 4 });
    const under = cy + r + 32;
    return [
      ring(cx, cy, r), line(cx, cy - r - 12, cx, cy + r + 12, { cls: 'k-axis' }),
      polar(cx, cy, r, -45, 'ref'), circle(bx2, by2, 4, { cls: 'h-soft-dot' }),
      line(bx2, by2, bx2, cy, { cls: 'k-guide' }),
      polar(cx, cy, r, 45, 'top'), circle(tx, ty, 5, { cls: 'k-dot' }),
      line(tx, ty, tx, cy, { cls: 'k-guide' }), line(tx, ty, cx, ty, { cls: 'k-guide' }),
      sq(tx, cy), sq(cx, ty, 9, 'h-shadow-soft'),
      text(tx + 8, ty - (ph ? 6 : 12), ph ? 'n = 1' : 'the dot, n = 1', { anchor: 'start', cls: 'k-label' }),
      text(cx - 10, ty + 4, '0.707', { anchor: 'end', cls: 'k-num' }),
      text(tx - 8, cy - 8, '0.707', { anchor: 'end', cls: 'k-num' }),
      text(cx, under, 'dashed: the dot a quarter turn behind;', { cls: 'k-label' }),
      text(cx, under + 18, 'its left-right part is 0.707 too', { cls: 'k-label' }),
      ph ? g({}, keyLine(24, under + 48, 'square', 'left-right part'), keyLine(190, under + 48, 'square-open', 'up-down part'))
        : g({}, keyLine(40, under + 48, 'square', 'left-right part'), keyLine(200, under + 48, 'square-open', 'up-down part')),
      col(X), col(S),
      text(X.x0 - 30, X.y0 - 18, 'x[n] = cos: left-right, stored', { anchor: 'start', cls: 'k-name' }),
      axes(X, { xTicks: [], yTicks: [] }), stems(X, ns.map(n => [n, cosd(45 * n)]), { dot: 4 }),
      text(S.x0 - 30, S.y0 - 18, 'x̂[n] = sin: up-down, needed', { anchor: 'start', cls: 'k-name' }),
      axes(S, { xTicks: ns.map(n => [n, n ? String(n) : 'n = 0']), yTicks: [] }), stems(S, ns.map(n => [n, sind(45 * n)]), { dot: 4.5, hollow: true }),
      text(ph ? 180 : 555, ph ? 654 : 350, 'x + j x̂ = the dot itself', { cls: 'k-math' }),
    ];
  };

  const hilbert = (L) => {
    const ph = L.phone, r = ph ? 84 : 96, a = r / 2;
    const C = ph ? [[180, 156], [180, 440], [180, 724]] : [[120, 176], [360, 176], [600, 176]];
    const titles = [['(a) a cosine:', 'two half-size arrows'], ['(b) after the Hilbert', 'transformer'], ['(c) × j, then add', 'the original']];
    const head2 = (i) => { const [x, y] = C[i]; return g({}, text(x, y - r - 40, titles[i][0], { cls: 'k-name' }), text(x, y - r - 22, titles[i][1], { cls: 'k-name' })); };
    const [A, B, Cc] = C;
    const [tTx, tTy] = pt(Cc[0], Cc[1], a, 45), [mTx, mTy] = pt(Cc[0], Cc[1], a, -45);
    return [
      head2(0), ring(A[0], A[1], r), polar(A[0], A[1], a, 45, 'top'), polar(A[0], A[1], a, -45, 'mirror'),
      text(A[0], A[1] + r + 28, 'their shadows add to the cosine', { cls: 'k-label' }),
      head2(1), ring(B[0], B[1], r),
      step(1, 'the Hilbert transformer turns the top arrow a quarter turn clockwise, times minus j, and the mirror a quarter turn counter-clockwise, times plus j',
        g(turnAt(B[0], B[1], -90, { d: 0.6, len: 1.6 }), polar(B[0], B[1], a, -45, 'top')),
        g(turnAt(B[0], B[1], 90, { d: 0.6, len: 1.6 }), polar(B[0], B[1], a, 45, 'mirror'))),
      turnArc(B[0], B[1], a + 16, 42, -38), turnArc(B[0], B[1], a + 16, -42, 38),
      text(B[0], B[1] + r + 28, 'top × (−j), mirror × (+j)', { cls: 'k-label' }),
      text(B[0], B[1] + r + 46, 'still mirror images: still real', { cls: 'k-label' }),
      head2(2), ring(Cc[0], Cc[1], r),
      polar(Cc[0], Cc[1], a, 45, 'ref'), polar(Cc[0], Cc[1], a, -45, 'ref'),
      step(2, 'times j turns both a quarter turn counter-clockwise; placed tip to tail on the original, the top arrow reaches twice as far and the mirror lands back on the centre',
        g(turnAt(tTx, tTy, 90, { d: 2.8, len: 1.6 }), vec(tTx, tTy, ...pt(Cc[0], Cc[1], 2 * a, 45), 'top')),
        g(turnAt(mTx - 5, mTy + 5, 90, { d: 2.8, len: 1.6 }), vec(mTx - 5, mTy + 5, Cc[0] - 5, Cc[1] + 5, 'mirror'))),
      step(3, 'added to the original: the top arrow doubles, 1 + 1 = 2, and the mirror cancels, 1 - 1 = 0',
        g({ anim: { k: 'in', d: 4.6, len: 1 } },
          circle(Cc[0], Cc[1], 5, { cls: 'k-dot' }),
          text(Cc[0], Cc[1] + r + 28, 'top: 1 + 1 = 2, doubled', { cls: 'k-num' }),
          text(Cc[0], Cc[1] + r + 46, 'mirror: 1 − 1 = 0, gone', { cls: 'k-num-accent' }))),
      ph ? g({}, keyLine(24, 904, 'top', 'top', { w: 22 }), keyLine(100, 904, 'mirror', 'mirror', { w: 22 }), keyLine(200, 904, 'ref', 'the original', { w: 22 }))
        : g({}, keyLine(150, 356, 'top', 'top arrow', { w: 24 }), keyLine(290, 356, 'mirror', 'mirror arrow', { w: 24 }), keyLine(450, 356, 'ref', 'the original arrows', { w: 24 })),
    ];
  };

  const delayVsQuarter = (L) => {
    const ph = L.phone, r = ph ? 34 : 46;
    const xs = ph ? [64, 180, 296] : [250, 410, 570], ys = ph ? [110, 300] : [100, 250];
    const tones = [500, 1000, 2000];
    const wheel = (x, y, back, row, label) => g({},
      ring(x, y, r, false), wedge(x, y, r * 0.55, -back, 0), polar(x, y, r, 0, 'ref'),
      g(turnAt(x, y, -back, { d: row * 2.6 + 0.4, len: 1.6 }), polar(x, y, r, -back, 'top')),
      text(x, y + r + (ph ? 26 : 30), label, { cls: 'k-num' }));
    return [
      ph ? text(16, 40, 'delay 2 samples', { anchor: 'start', cls: 'k-name' }) : text(24, ys[0] + 5, 'delay 2 samples', { anchor: 'start', cls: 'k-name' }),
      ph ? text(16, 230, 'Hilbert transformer', { anchor: 'start', cls: 'k-name' }) : text(24, ys[1] + 5, 'Hilbert transformer', { anchor: 'start', cls: 'k-name' }),
      tones.map((f, i) => text(xs[i], ph ? 62 : 36, `${hz(f)} Hz`, { cls: 'k-label' })),
      step(1, 'a 2-sample delay puts 500 Hz 45 degrees behind, 1,000 Hz 90 degrees, 2,000 Hz 180 degrees',
        g({}, tones.map((f, i) => wheel(xs[i], ys[0], 2 * 360 * f / 8000, 0, `${2 * 360 * f / 8000}° behind`)))),
      step(2, 'the Hilbert transformer puts every tone 90 degrees behind',
        g({}, tones.map((f, i) => wheel(xs[i], ys[1], 90, 1, '90° behind')))),
      text(ph ? 180 : 410, ph ? 414 : 368, ph ? 'a delay turns each tone in proportion' : 'a delay turns each tone in proportion to its pitch;', { cls: 'k-note' }),
      text(ph ? 180 : 410, ph ? 436 : 392, ph ? 'to its pitch; the Hilbert transformer' : 'the Hilbert transformer turns every tone a quarter turn', { cls: 'k-note' }),
      ph ? text(180, 458, 'turns every tone a quarter turn', { cls: 'k-note' }) : '',
      ph ? g({}, keyLine(24, 494, 'ref', 'the tone going in', { w: 22 }), keyLine(24, 516, 'top', 'the tone coming out', { w: 22 }))
        : g({}, keyLine(250, 428, 'ref', 'the tone going in', { w: 24 }), keyLine(450, 428, 'top', 'the tone coming out', { w: 24 })),
    ];
  };

  const mul = (x, y, s = '×') => g({}, circle(x, y, 15, { cls: 'k-mask-box' }), circle(x, y, 15, { cls: 'k-box' }), text(x, y + 5, s, { cls: 'k-name' }));
  const shifter = (L) => {
    const ph = L.phone, A = (pts, o) => k.arrow(L.slug, pts, o);
    if (ph) {
      const lx = 92, rx = 268;
      return [
        text(180, 22, 'x[n], the call', { cls: 'k-name' }),
        line(180, 30, 180, 56, { cls: 'k-arrow' }), line(lx, 56, rx, 56, { cls: 'k-arrow' }),
        A([[lx, 56], [lx, 82]]), A([[rx, 56], [rx, 82]]),
        k.box(16, 86, 152, 56, { name: 'delay', sub: 'D = 15 samples' }),
        k.box(192, 86, 152, 56, { sub: '31 coefficients' }), text(rx, 110, 'Hilbert transformer', { cls: 'k-name', style: 'font-size:13px' }),
        A([[lx, 142], [lx, 181]]), A([[rx, 142], [rx, 181]]),
        text(rx + 8, 166, 'x̂[n]', { anchor: 'start', cls: 'k-label' }),
        mul(lx, 196), mul(rx, 196),
        A([[20, 196], [73, 196]]), text(16, 178, 'cos 300 Hz', { anchor: 'start', cls: 'k-label' }),
        A([[340, 196], [287, 196]]), text(344, 178, 'sin 300 Hz', { anchor: 'end', cls: 'k-label' }),
        path(`M${lx} 211L${lx} 270L159 270`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
        path(`M${rx} 211L${rx} 270L201 270`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
        mul(180, 270, '−'), text(140, 260, '+', { cls: 'k-name' }), text(220, 260, '−', { cls: 'k-name' }),
        A([[180, 285], [180, 326]]),
        text(180, 346, 'y[n], the shifted call', { cls: 'k-name' }),
        text(180, 384, 'y = x · cos − x̂ · sin', { cls: 'k-math' }),
      ];
    }
    const yT = 72, yB = 196, yM = 134;
    return [
      text(20, yM - 8, 'x[n]', { anchor: 'start', cls: 'k-name' }), text(20, yM + 12, 'the call', { anchor: 'start', cls: 'k-tick' }),
      line(80, yM, 104, yM, { cls: 'k-arrow' }), line(104, yT, 104, yB, { cls: 'k-arrow' }),
      A([[104, yT], [136, yT]]), A([[104, yB], [136, yB]]),
      k.box(140, yT - 28, 180, 56, { name: 'delay', sub: 'D = 15 samples' }),
      k.box(140, yB - 28, 180, 56, { name: 'Hilbert transformer', sub: '31 coefficients' }),
      A([[320, yT], [397, yT]]), A([[320, yB], [397, yB]]),
      text(348, yB - 10, 'x̂[n]', { cls: 'k-label' }),
      mul(412, yT), mul(412, yB),
      A([[412, 24], [412, yT - 19]]), text(424, 30, 'cos 300 Hz', { anchor: 'start', cls: 'k-label' }),
      A([[412, 246], [412, yB + 19]]), text(424, 250, 'sin 300 Hz', { anchor: 'start', cls: 'k-label' }),
      path(`M427 ${yT}L540 ${yT}L540 ${yM - 19}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
      path(`M427 ${yB}L540 ${yB}L540 ${yM + 19}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
      mul(540, yM, '−'), text(556, yM - 26, '+', { cls: 'k-name' }), text(556, yM + 38, '−', { cls: 'k-name' }),
      A([[555, yM], [600, yM]]),
      text(606, yM - 8, 'y[n]', { anchor: 'start', cls: 'k-name' }), text(606, yM + 12, 'shifted call', { anchor: 'start', cls: 'k-tick' }),
      text(230, 282, 'y = x · cos 300 Hz − x̂ · sin 300 Hz', { cls: 'k-math' }),
    ];
  };

  const sideband = (L) => {
    const ph = L.phone, x0 = ph ? 24 : 60, x1 = ph ? 336 : 690;
    const P = plot({ x: x0, y: ph ? 110 : 96, w: x1 - x0, h: ph ? 120 : 130, xs: [0, 2000], ys: [0, 1.15] });
    const top = P.Y(1) - 46;
    return [
      axes(P, { xTicks: hzTicks([0, 300, 700, 1000, 1300, 2000]) }),
      text(x1, P.y1 + 36, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      line(P.X(300), P.Y(0), P.X(300), P.Y(0.25), { cls: 'h-given' }), circle(P.X(300), P.Y(0.25), 4, { cls: 'k-stem-input-dot' }),
      text(P.X(300), P.Y(0.25) - 10, ph ? 'shift' : 'the shift', { cls: 'k-num-input' }),
      refBar(P, 1000, 1), text(P.X(1000), P.Y(1) - 8, 'call tone', { cls: 'k-label' }),
      hatchBar(P, 700, 0.5, L.slug), solidBar(P, 1300, 0.5),
      k.arrow(L.slug, [[P.X(1000) + 12, top], [P.X(1300), top]]), k.arrow(L.slug, [[P.X(1000) - 12, top], [P.X(700), top]]),
      text(P.X(1150) + 2, top - 8, '+300', { cls: 'k-tick' }), text(P.X(850) - 2, top - 8, `${M}300`, { cls: 'k-tick' }),
      k.check(P.X(1300) + (ph ? 20 : 26), P.Y(0.5) - 6), text(P.X(1300) + (ph ? 32 : 40), P.Y(0.5) - 2, ph ? 'kept' : 'upper sideband: kept', { anchor: 'start', cls: 'k-label' }),
      k.cross(P.X(700) - (ph ? 20 : 26), P.Y(0.5) - 6), text(P.X(700) - (ph ? 32 : 40), P.Y(0.5) - 2, ph ? 'removed' : 'lower sideband: removed', { anchor: 'end', cls: 'k-label' }),
      ph ? g({}, text(24, 24, 'upper sideband, 1,300 Hz: kept', { anchor: 'start', cls: 'k-label' }), text(24, 44, 'lower sideband, 700 Hz: removed', { anchor: 'start', cls: 'k-label' })) : '',
      text(ph ? 180 : 375, ph ? 300 : 292, 'single sideband: one copy, no ghost', { cls: 'k-note' }),
      ph ? g({}, keyLine(24, 332, 'bar-ref', 'the call tone'), keyLine(190, 332, 'bar', 'kept'), keyLine(24, 356, 'hatch', 'removed sideband', { slug: L.slug }))
        : g({}, keyLine(120, 328, 'bar-ref', 'the call tone'), keyLine(300, 328, 'bar', 'kept sideband'), keyLine(480, 328, 'hatch', 'removed sideband', { slug: L.slug })),
    ];
  };

  const hilbertResponse = (L) => {
    const ph = L.phone, x0 = ph ? 40 : 90, x1 = ph ? 340 : 690;
    const P = plot({ x: x0, y: ph ? 60 : 56, w: x1 - x0, h: ph ? 180 : 190, xs: [-4000, 4000], ys: [-1.3, 1.3] });
    const ideal = f => (f > 0 ? -1 : 1);
    const arrows = range(-3500, 3500, 500).filter(f => f !== 0).map(f => vec(P.X(f), P.Y(0), P.X(f), P.Y(ideal(f) * 0.96), 'ref'));
    return [
      axes(P, { xTicks: hzTicks(ph ? [-4000, 0, 4000] : [-4000, -2000, 0, 2000, 4000]).map(([f, s]) => [f, f < 0 ? M + hz(-f) : s]), yTicks: [[1, '+j'], [0, '0'], [-1, `${M}j`]] }),
      text(x1, P.y1 + 36, ph ? 'tone, Hz' : 'tone (Hz): negative tones on the left', { anchor: 'end', cls: 'k-tick' }),
      arrows,
      path(`M${P.X(-4000)} ${P.Y(1)}L${P.X(0)} ${P.Y(1)}L${P.X(0)} ${P.Y(-1)}L${P.X(4000)} ${P.Y(-1)}`, { cls: 'h-ref', fill: 'none' }),
      curve(P, f => -gainOf(31, true, f), { cls: 'k-curve', n: 400 }),
      text(P.X(-2000), P.Y(1) - 12, ph ? '+j: forward' : '+j: a quarter turn forward', { cls: 'k-label' }),
      text(P.X(2000), P.Y(-1) + 22, ph ? '−j: back' : '−j: a quarter turn back', { cls: 'k-label' }),
      text(P.X(0) + 10, P.Y(0.62), 'the jump at 0 Hz', { anchor: 'start', cls: 'k-label' }),
      ph ? g({}, keyLine(20, 318, 'dashed', 'what the ideal asks for', { w: 26 }), keyLine(20, 340, 'curve', '31 Hann coefficients', { w: 26 }))
        : g({}, keyLine(110, 312, 'dashed', 'what the ideal Hilbert transformer asks for', { w: 26 }), keyLine(110, 336, 'curve', '31 Hann coefficients: the jump smoothed over about 0 to 300 Hz', { w: 26 })),
    ];
  };

  const hSketch = (L) => {
    const ph = L.phone;
    const panel = (x, y, n, w, h) => {
      const P = plot({ x, y, w, h, xs: [0, Math.PI], ys: [-1.15, 1.15] });
      const lobes = range(0, n - 1).map(i => {
        const a = i * Math.PI / n, b = (i + 1) * Math.PI / n, up = i % 2 === 0, left = n % 2 === 1 && i === n - 1;
        const pts = range(0, 30).map(j => { const t = a + (b - a) * j / 30; return `L${r2(P.X(t))} ${r2(P.Y(Math.sin(t * n)))}`; }).join('');
        const shape = up ? path(`M${r2(P.X(a))} ${r2(P.Y(0))}${pts}L${r2(P.X(b))} ${r2(P.Y(0))}Z`, { cls: left ? 'h-lobe-left' : 'k-fill', fill: undefined }) : '';
        return g({}, shape, text(P.X((a + b) / 2), P.Y(up ? 0.4 : -0.4) + 5, up ? (left ? '+ left over' : '+') : M, { cls: left ? 'k-num-accent' : 'k-num' }));
      });
      return g({}, lobes,
        axes(P, { xTicks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], yTicks: [[1, '1'], [-1, `${M}1`]] }),
        curve(P, t => Math.sin(n * t), { n: 120 }),
        text(P.x0, P.y0 - 14, `n = ${n}: sin(${n}ω), ${n} half-waves`, { anchor: 'start', cls: 'k-name' }));
    };
    if (ph) return [
      panel(44, 50, 2, 290, 130), text(44, 236, 'up and down cancel: h[2] = 0', { anchor: 'start', cls: 'k-num' }),
      panel(44, 300, 3, 290, 130), text(44, 486, 'one up left over, area 2 ÷ 3', { anchor: 'start', cls: 'k-num-accent' }),
      text(44, 506, 'h[3] = (2 ÷ 3) ÷ π = 0.212', { anchor: 'start', cls: 'k-num' }),
      text(44, 540, 'ω from 0 to π: 0 to 4,000 Hz', { anchor: 'start', cls: 'k-tick' }),
    ];
    return [
      panel(60, 56, 2, 270, 150), text(60, 264, 'up and down cancel: h[2] = 0', { anchor: 'start', cls: 'k-num' }),
      panel(420, 56, 3, 270, 150), text(420, 264, 'one up left over, area 2 ÷ 3', { anchor: 'start', cls: 'k-num-accent' }),
      text(420, 284, 'h[3] = (2 ÷ 3) ÷ π = 0.212', { anchor: 'start', cls: 'k-num' }),
      text(375, 318, 'average over ω from 0 to π, that is 0 to 4,000 Hz', { cls: 'k-tick' }),
    ];
  };

  const taps = (L) => {
    const ph = L.phone, x0 = ph ? 56 : 70, x1 = ph ? 344 : 690;
    const P = plot({ x: x0, y: ph ? 100 : 70, w: x1 - x0, h: ph ? 190 : 200, xs: [-15.6, 15.6], ys: [-0.78, 0.78] });
    const W = plot({ x: x0, y: ph ? 384 : 340, w: x1 - x0, h: ph ? 56 : 56, xs: [-15.6, 15.6], ys: [0, 1] });
    const odd = range(-15, 15).filter(n => n % 2 !== 0), even = range(-14, 14, 2);
    const ideal = odd.map(n => [n, 2 / (Math.PI * n)]), kept = odd.map(n => [n, 2 / (Math.PI * n) * hann(n, 15)]);
    const lab = (n, s, below) => text(P.X(n) + (n > 0 ? 8 : -8), P.Y(2 / (Math.PI * n)) + (below ? 16 : -2), s, { anchor: n > 0 ? 'start' : 'end', cls: 'k-num' });
    return [
      rect(P.X(-15.6), P.y0, P.X(-0.5) - P.X(-15.6), P.h, { cls: 'k-fill' }),
      text(P.X(-8), P.y0 + 16, ph ? 'n < 0: the future' : 'n < 0: reaches the future', { cls: 'k-label' }),
      axes(P, { xTicks: [[-15, `${M}15`], [-5, `${M}5`], [0, 'n = 0'], [5, '5'], [15, '15']], yTicks: [[0.637, '0.637'], [-0.637, `${M}0.637`]] }),
      stems(P, ideal, { cls: 'h-soft-stem', dot: 0 }),
      g({}, ideal.map(([n, v]) => circle(P.X(n), P.Y(v), 3.5, { cls: 'h-soft-dot' }))),
      stems(P, kept, { dot: ph ? 2.6 : 3.2 }),
      g({}, even.map(n => circle(P.X(n), P.Y(0), 2, { cls: 'k-stop' }))),
      lab(1, '0.637', false), lab(3, '0.212', false), ph ? '' : lab(5, '0.127', false),
      k.arrow(L.slug, [[P.X(-15), P.y1 + 40], [P.X(0) - 4, P.y1 + 40]], { tone: 'input' }),
      text(P.X(0) + 8, P.y1 + 44, ph ? 'delay 15 samples' : 'delay 15 samples: n = −15 moves to 0', { anchor: 'start', cls: 'k-num-input' }),
      text(W.x0, W.y0 - 10, 'Hann window: ½ + ½ cos(πn / 16)', { anchor: 'start', cls: 'k-label' }),
      line(W.x0, W.y1, W.x1, W.y1, { cls: 'k-axis' }),
      curve(W, n => hann(n, 15), { from: -16, to: 16, n: 160 }),
      text(W.x0 - 8, W.Y(1) + 4, '1', { anchor: 'end', cls: 'k-tick' }), text(W.x0 - 8, W.Y(0) + 4, '0', { anchor: 'end', cls: 'k-tick' }),
      ph ? g({}, keyLine(20, 30, 'stem-soft', '2 ÷ (πn), the ideal'), keyLine(20, 54, 'stem', 'times the window: kept'))
        : g({}, keyLine(80, 30, 'stem-soft', '2 ÷ (πn), the ideal coefficient'), keyLine(380, 30, 'stem', 'times the Hann window: the 31 kept')),
    ];
  };

  const delayCatch = (L) => {
    const ph = L.phone, u = ph ? 66 : 64;
    const draw = (ox, oy, a2, kind, label, sub, cls) => {
      const [x1, y1] = [ox + u, oy], [x2, y2] = [x1 + u * cosd(a2), y1 - u * sind(a2)];
      return g({}, vec(ox, oy, x1, y1, 'ref'), vec(x1, y1, x2, y2, 'ref'), vec(ox, oy, x2, y2, kind),
        text(ox, oy + 28, label, { anchor: 'start', cls: cls }), sub ? text(ox, oy + 46, sub, { anchor: 'start', cls: 'k-label' }) : '');
    };
    const P = ph ? plot({ x: 50, y: 268, w: 252, h: 170, xs: [0, 4000], ys: [0, 3] }) : plot({ x: 400, y: 70, w: 250, h: 220, xs: [0, 4000], ys: [0, 3] });
    const marks = [[500, 0.199, '20%'], [1000, 0.414, '41%'], [2000, 1, '100%'], [3000, 2.414, '241%']];
    const top = ph ? [24, 110] : [40, 110], mir = ph ? [196, 110] : [40, 236];
    return [
      text(ph ? 20 : 24, 28, ph ? '1,000 Hz, Hilbert path 675° late' : '1,000 Hz with the Hilbert path 675° late', { anchor: 'start', cls: 'k-name' }),
      step(1, 'the top arrow: 1 plus the late Hilbert arrow, length 1.85',
        g({ anim: { k: 'in', d: 0, len: 1 } }, draw(top[0], top[1], 45, 'top', 'top: length 1.85', '', 'k-num'))),
      step(2, 'the mirror arrow: 1 minus the late arrow no longer cancels, length 0.77, a 41% ghost',
        g({ anim: { k: 'in', d: 1.3, len: 1 } }, draw(mir[0], mir[1], 135, 'res', 'mirror: 0.77, not 0', ph ? '' : 'ghost 0.77 ÷ 1.85 = 41%', 'k-num-accent'),
          ph ? text(180, 186, 'ghost: 0.77 ÷ 1.85 = 41%', { cls: 'k-label' }) : '')),
      text(P.x0 - 30, P.y0 - 22, ph ? 'ghost with no delay box' : 'the ghost with no delay box, 0 to 4,000 Hz', { anchor: 'start', cls: 'k-name' }),
      axes(P, { xTicks: hzTicks(ph ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]), yTicks: [[0, '0%'], [1, '100%'], [2, '200%'], [3, '300%']] }),
      line(P.x0, P.Y(0.05), P.x1, P.Y(0.05), { cls: 'h-ref' }),
      text(P.x1 + 6, P.Y(0.05) - 4, '5%', { anchor: 'start', cls: 'k-tick' }), text(P.x1 + 6, P.Y(0.05) + 10, 'target', { anchor: 'start', cls: 'k-tick' }),
      text(P.x1, P.y1 + 36, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      step(3, 'the ghost against tone for the missing 15-sample delay: it swings from 0 to off the top again and again',
        g({ anim: { k: 'in', d: 2.6, len: 1.2 } }, clipped(P, f => Math.abs(Math.tan(15 * Math.PI * f / 8000)), 3.05, 2))),
      step(4, 'marked: 20% at 500 Hz, 41% at 1,000 Hz, 100% at 2,000 Hz, 241% at 3,000 Hz',
        g({}, marks.map(([f, v, s], i) => g({ anim: { k: 'in', d: 4 + i * 0.6, len: 0.5 } },
          circle(P.X(f), P.Y(v), 4.5, { cls: 'k-dot' }), k.masked(P.X(f) + (f === 3000 ? -10 : 8), P.Y(v) - 8, s, { anchor: f === 3000 ? 'end' : 'start', cls: 'k-num' }))))),
      text(P.x0, P.y1 + (ph ? 58 : 52), 'where the curve runs off the top,', { anchor: 'start', cls: 'k-tick' }),
      text(P.x0, P.y1 + (ph ? 74 : 68), 'the wanted copy itself cancels', { anchor: 'start', cls: 'k-tick' }),
      ph ? keyLine(20, 538, 'ref', 'the original, then the late arrow', { w: 22 }) : keyLine(24, 320, 'ref', 'the original, then the late arrow', { w: 22 }),
    ];
  };

  const edges = (L) => {
    const ph = L.phone, x0 = ph ? 50 : 80, x1 = ph ? 340 : 690;
    const P = plot({ x: x0, y: ph ? 70 : 60, w: x1 - x0, h: ph ? 150 : 160, xs: [0, 4000], ys: [0, 1.25] });
    const Q = plot({ x: x0, y: 300, w: x1 - x0, h: ph ? 150 : 140, xs: [0, 4000], ys: [0, 0.2] });
    const vb = (Pl) => rect(Pl.X(300), Pl.y0, Pl.X(3400) - Pl.X(300), Pl.h, { cls: 'k-fill' });
    const gh = (N, win) => f => ghostOf(gainOf(N, win, f));
    return [
      vb(P), vb(Q),
      text(P.X(1850), P.Y(0.12), 'voice band, 300 to 3,400 Hz', { cls: 'k-label' }),
      text(x0 - (ph ? 44 : 70), P.y0 - 18, 'Hilbert gain G', { anchor: 'start', cls: 'k-name' }),
      axes(P, { xTicks: [], yTicks: [[1, '1'], [0.5, '0.5'], [0, '0']] }),
      curve(P, f => gainOf(31, false, f), { cls: 'h-dotted', n: 400 }),
      curve(P, f => gainOf(31, true, f), { n: 400 }),
      circle(P.X(100), P.Y(0.3866), 4, { cls: 'k-stem-dot' }), text(P.X(100) + 8, P.Y(0.3866) + 4, '0.3866 at 100 Hz', { anchor: 'start', cls: 'k-num' }),
      circle(P.X(300), P.Y(0.9004), 4, { cls: 'k-stem-dot' }), text(P.X(300) + 10, P.Y(0.9004) + 20, '0.9004 at 300 Hz', { anchor: 'start', cls: 'k-num' }),
      text(x0 - (ph ? 44 : 70), Q.y0 - 18, ph ? 'ghost |1 − G| ÷ (1 + G)' : 'the ghost it leaves: |1 − G| ÷ (1 + G)', { anchor: 'start', cls: 'k-name' }),
      axes(Q, { xTicks: hzTicks(ph ? [0, 2000, 4000] : [0, 1000, 2000, 3000, 4000]), yTicks: [[0.2, '20%'], [0.1, '10%'], [0.05, '5%'], [0, '0%']] }),
      text(x1, Q.y1 + 36, 'Hz', { anchor: 'end', cls: 'k-tick' }),
      line(Q.x0, Q.Y(0.05), Q.x1, Q.Y(0.05), { cls: 'h-ref' }),
      clipped(Q, gh(31, false), 0.2, 5, 'h-dotted'),
      clipped(Q, gh(31, true), 0.2, 5),
      circle(Q.X(300), Q.Y(0.0524), 4, { cls: 'k-dot' }), k.masked(Q.X(300) + 10, Q.Y(0.0524) + 18, '5.24%', { anchor: 'start', cls: 'k-num-accent' }),
      circle(Q.X(300), Q.Y(0.0679), 4, { cls: 'h-hollow-dot' }), k.masked(Q.X(300) + 10, Q.Y(0.0679) - 4, '6.79%', { anchor: 'start', cls: 'k-num' }),
      text(Q.X(ph ? 520 : 480), Q.Y(0.2) + 14, ph ? '100 Hz: 44.2%, off the top' : 'at 100 Hz the ghost is 44.2%, off the top', { anchor: 'start', cls: 'k-tick' }),
      ph ? g({}, keyLine(20, 512, 'curve', '31 coefficients, Hann window', { w: 26 }), keyLine(20, 534, 'dotted', '31 coefficients, plain cut', { w: 26 }), keyLine(20, 556, 'dashed', 'the 5% target', { w: 26 }), keyLine(20, 580, 'fill', 'the voice band'))
        : g({}, keyLine(80, 494, 'curve', '31 coefficients, Hann window', { w: 26 }), keyLine(380, 494, 'dotted', '31 coefficients, plain cut', { w: 26 }), keyLine(80, 518, 'dashed', 'the 5% target', { w: 26 }), keyLine(380, 518, 'fill', 'the voice band')),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: CSS, eyebrow: 'Lesson 15 · the Hilbert transform', body: (kk, L) => body(L) });

  return [
    fig('split', [490, 530], 'One tone in, two tones out',
      'A 1,000 Hz tone times a 300 Hz tone splits into two half-size tones, 1,300 Hz, the wanted copy, and 700 Hz, the ghost. A whole voice from 300 to 3,400 Hz splits the same way into a wanted copy from 600 to 3,700 Hz and a ghost from 0 to 3,100 Hz; they overlap from 600 to 3,100 Hz, and at 1,700 Hz the wanted copy of 1,400 and the ghost of 2,000 land together.',
      'Top: the 1,000 Hz tone splits into two half-size tones. Bottom: a whole voice splits into a wanted copy and a ghost that overlap almost everywhere, so no filter can pull them apart.', split, 4),
    fig('negative-tone', [370, 600], 'Two arrows, one shadow',
      'A 1,000 Hz tone drawn as two half-size arrows: the top arrow turns counter-clockwise 45 degrees per sample, the mirror arrow turns clockwise 45 degrees per sample. At samples 0, 1 and 2 they share the same shadow on the horizontal line, and their shadows added give the 1,000 Hz cosine.',
      'The top arrow is +1,000 Hz, the mirror arrow is the negative tone, −1,000 Hz. Sample by sample they cast the same shadow, so on the line they sound the same.', negTone, 4),
    fig('chip-boundary', [270, 520], 'Arrows inside, shadows outside',
      'The chip takes one number per sample from the line, keeps each sample as an arrow of two numbers, left-right and up-down, multiplies arrows by one arrow turning +300 Hz, and sends only the shadow, one number per sample, back out to the line.',
      'Inside the chip a sample can be an arrow, two numbers. Only what goes out on the line has to be a shadow.', chipBoundary),
    fig('ghost-arrows', [350, 660], 'The mirror arrow is the ghost',
      'Before: the top arrow turns +45 degrees per sample and the mirror −45 degrees. Times one arrow turning +13.5 degrees per sample, both turn 13.5 degrees further counter-clockwise: the top arrow speeds up to +58.5 degrees, +1,300 Hz, and the mirror slows to −31.5 degrees, −700 Hz, whose shadow sounds at 700 Hz, the ghost.',
      'One arrow turning +300 Hz adds 13.5° per sample to both arrows. The top arrow speeds up to 1,300 Hz; the mirror slows to −700 Hz, and its shadow is the 700 Hz ghost.', ghostArrows, 3),
    fig('analytic', [380, 670], 'The analytic signal: the dot itself',
      'One full-size arrow at sample 1, 45 degrees: its left-right part is the cosine x, 0.707, and its up-down part is the sine x̂, 0.707. The same dot a quarter turn behind, at −45 degrees, has a left-right part of 0.707 too. Beside it, x[n] and x̂[n] for n = 0 to 7.',
      'The analytic signal of one tone is the dot: its left-right part is the cosine you store, its up-down part the sine you need. That sine is the left-right part of the dot a quarter turn behind.', analytic),
    fig('hilbert', [380, 930], 'Two quarter turns cancel the mirror',
      'Three steps for a cosine’s two half-size arrows: the Hilbert transformer turns the top arrow a quarter turn clockwise and the mirror a quarter turn counter-clockwise, keeping them mirror images; times j turns both a quarter turn counter-clockwise; placed tip to tail on the original arrows, the top arrow reaches twice as far, doubled, and the mirror arrow comes back to the centre, cancelled.',
      'Follow the mirror arrow: the filter turns it a quarter turn forward, j turns it another, and it ends exactly opposite where it started. Added to the original, it cancels; the top arrow doubles.', hilbert, 3),
    fig('delay-vs-quarter-turn', [450, 530], 'A delay is not a quarter turn',
      'A 2-sample delay puts 500 Hz 45 degrees behind, 1,000 Hz 90 degrees and 2,000 Hz 180 degrees; the Hilbert transformer puts all three 90 degrees behind.',
      'Top row: a delay turns each tone in proportion to its pitch. Bottom row: the Hilbert transformer turns every tone by the same quarter turn.', delayVsQuarter, 2),
    fig('shifter', [300, 400], 'The single-sideband shifter',
      'The call x[n] splits into two paths. The top path delays it D = 15 samples and multiplies by cos 300 Hz; the bottom path runs the 31-coefficient Hilbert transformer and multiplies x̂[n] by sin 300 Hz. The bottom is subtracted from the top to give y[n].',
      'Two multiplications and a subtraction per sample. The delay box keeps the plain path in step with the Hilbert transformer.', shifter),
    fig('sideband', [350, 380], 'Single sideband keeps one copy',
      'Around the 1,000 Hz call tone, a plain multiplication by the 300 Hz shift makes two half-size sidebands: the upper at 1,300 Hz and the lower at 700 Hz. Single sideband keeps the upper one and removes the lower one.',
      'A plain multiplication makes both sidebands. Single sideband keeps the upper one, 1,300 Hz, and removes the lower one, the ghost.', sideband),
    fig('hilbert-response', [360, 360], 'The Hilbert transformer’s response',
      'The ideal response is +j for every negative tone and −j for every positive tone, with a jump at 0 Hz. The 31-coefficient Hann version follows it across the middle and smooths the jump over about 0 to 300 Hz, and the same near 4,000 Hz.',
      'Every positive tone is turned back a quarter turn (−j, down), every negative tone forward (+j, up). The real 31-coefficient filter cannot jump at 0 Hz; it ramps.', hilbertResponse),
    fig('h-sketch', [340, 560], 'Where 2 ÷ (πn) comes from',
      'For n = 2, sin(2ω) over ω from 0 to π makes one half-wave up and one down; they cancel, so h[2] = 0. For n = 3 there are three half-waves; one up and one down cancel and one up is left over, area 2 ÷ 3, so h[3] = (2 ÷ 3) ÷ π = 0.212.',
      'Each coefficient is the average of sin(ωn) from 0 to π. Even n: the half-waves cancel. Odd n: one upward half-wave is left over.', hSketch),
    fig('taps', [420, 480], 'The Hilbert transformer’s coefficients',
      'The coefficients 2 ÷ (πn) for odd n from −15 to 15, with zeros at even n: 0.637, 0.212, 0.127 and on, negative for negative n. Times the Hann window they are tapered toward the ends. The negative n reach into the future, so the whole list is delayed 15 samples.',
      'The ideal coefficients shrink like 1 ÷ n and reach backwards. Keep n from −15 to 15, taper them with the Hann window, and delay the list 15 samples.', taps),
    fig('delay-catch', [380, 560], 'The missing delay box',
      'For 1,000 Hz with the Hilbert path 675 degrees late, the top arrow is 1 plus the late arrow, length 1.85, and the mirror is 1 minus it, length 0.77 instead of 0: a 41% ghost. Against tone, the ghost with no delay box is 20% at 500 Hz, 41% at 1,000 Hz, 100% at 2,000 Hz and 241% at 3,000 Hz, far above the 5% target.',
      'Without the delay box, the mirror arrow no longer cancels. The ghost depends on the tone, and it is never small for long.', delayCatch, 4),
    fig('edges', [540, 600], 'Where a short Hilbert transformer fails',
      'Gain of the 31-coefficient Hilbert transformer against tone: with the Hann window it is 0.3866 at 100 Hz, 0.9004 at 300 Hz and close to 1 across the middle; the plain cut ripples. Below, the ghost |1 − G| ÷ (1 + G): with Hann, 5.24% at 300 Hz, just over the 5% target; the plain cut, 6.79% there.',
      'Top: the gain of the 31-coefficient Hilbert transformer. Bottom: the ghost it leaves. Both fail near 0 Hz, and at 300 Hz both miss the 5% target.', edges),
  ];
};
