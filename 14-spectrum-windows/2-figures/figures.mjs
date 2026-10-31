export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, step, fmt, hz, range } = k;
  const FS = 8000, TAU = 2 * Math.PI, M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
  const hzf = f => (Number.isInteger(f) ? hz(f) : f.toLocaleString('en-US', { maximumFractionDigits: 2 }));
  const hannW = (n, N) => 0.5 - 0.5 * Math.cos(TAU * n / N);

  function spectrum(tones, N, win = 'none') {
    const w = range(0, N - 1).map(n => (win === 'hann' ? hannW(n, N) : 1));
    const s = w.reduce((a, b) => a + b, 0) / 2;
    const x = w.map((wn, n) => wn * tones.reduce((acc, [f, a = 1, ph = 0]) => acc + a * Math.cos(TAU * f * n / FS + ph), 0));
    return fb => {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const t = TAU * fb * n / FS; re += x[n] * Math.cos(t); im -= x[n] * Math.sin(t); }
      return Math.hypot(re, im) / s;
    };
  }
  const plainLong = d => (Math.abs(d) < 1e-9 ? 1 : Math.abs(Math.sin(Math.PI * d) / (256 * Math.sin(Math.PI * d / 256))));
  const sinc = d => (Math.abs(d) < 1e-9 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d));
  const hannAt = d => Math.abs(sinc(d) + 0.5 * sinc(d - 1) + 0.5 * sinc(d + 1));

  const poly = (pts, o = {}) => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), o);
  const fnPts = (P, fn, a, b, n = 300, clipTop = Infinity) => range(0, n).map(i => { const t = a + (b - a) * i / n; return [P.X(t), P.Y(Math.min(fn(t), clipTop))]; });
  const area = (P, fn, a, b, cls = 'l-shade', clipTop = Infinity) => {
    const pts = fnPts(P, fn, a, b, 120, clipTop);
    return path(`M${r2(P.X(a))} ${r2(P.Y(0))}` + pts.map(([x, y]) => `L${r2(x)} ${r2(y)}`).join('') + `L${r2(P.X(b))} ${r2(P.Y(0))}Z`, { cls, fill: undefined });
  };
  const dot = (x, y, r = 4.5, cls = 'l-dot') => circle(x, y, r, { cls });
  const sq = (x, y, s = 8, cls = 'l-sq') => rect(x - s / 2, y - s / 2, s, s, { cls });
  const tri = (x, y, s = 7, cls = 'l-tri') => path(`M${r2(x)} ${r2(y - s)}L${r2(x + s)} ${r2(y + s * 0.8)}L${r2(x - s)} ${r2(y + s * 0.8)}Z`, { cls });
  const lab = (x, y, s, cls = 'k-label', anchor = 'middle', o = {}) => text(x, y, s, { cls, anchor, ...o });
  const rich = (x, y, parts, cls = 'k-math', anchor = 'middle') => {
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const inner = parts.map(p => (typeof p === 'string' ? esc(p) : `<tspan baseline-shift="super" font-size="70%">${esc(p.sup)}</tspan>`)).join('');
    return `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" class="${cls}">${inner}</text>`;
  };
  const heads = slug => `<defs><marker id="${slug}-hi" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="l-head-ink" points="0 0, 8 3, 0 6"/></marker>`
    + `<marker id="${slug}-hs" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="l-head-soft" points="0 0, 8 3, 0 6"/></marker>`
    + `<marker id="${slug}-ha" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="l-head-accent" points="0 0, 8 3, 0 6"/></marker></defs>`;
  const vec = (slug, x1, y1, x2, y2, kind = 'ink', o = {}) => line(x1, y1, x2, y2, { cls: `spoke ${kind === 'ink' ? 'l-vec' : kind === 'soft' ? 'l-vec-mirror' : kind === 'col' ? 'l-vec-col' : 'l-vec-total'}`, 'marker-end': `url(#${slug}-h${kind === 'ink' ? 'i' : kind === 'total' ? 'a' : 's'})`, ...o });
  const key = (x, y, kind, label, slug) => {
    const mark = kind === 'plain' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-plain' }), dot(x + 13, y - 4, 4)]
      : kind === 'hann' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-hann' }), sq(x + 13, y - 4, 8)]
      : kind === 'mirror' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-mirror' }), circle(x + 13, y - 4, 3.5, { cls: 'l-ring' })]
      : kind === 'bar' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-bar' })]
      : kind === 'hatch' ? [rect(x + 5, y - 11, 16, 14, { fill: `url(#${slug}-hatch)`, cls: 'k-bar-hatch' })]
      : kind === 'solidbar' ? [rect(x + 5, y - 11, 16, 14, { cls: 'k-bar' })]
      : kind === 'ref' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-ref' })]
      : kind === 'padded' ? [circle(x + 13, y - 4, 2.6, { cls: 'l-pad' })]
      : kind === 'coarse' ? [dot(x + 13, y - 4, 4.5)]
      : kind === 'total' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-total' })]
      : kind === 'out' ? [circle(x + 13, y - 4, 3.5, { cls: 'l-dot-accent' })]
      : kind === 'arrow' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-vec', 'marker-end': `url(#${slug}-hi)` })]
      : kind === 'arrow-mirror' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-vec-mirror', 'marker-end': `url(#${slug}-hs)` })]
      : kind === 'arrow-col' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-vec-col', 'marker-end': `url(#${slug}-hs)` })]
      : kind === 'sample' ? [circle(x + 13, y - 4, 5, { cls: 'l-dot-accent' })]
      : kind === 'hamming' ? [line(x, y - 4, x + 26, y - 4, { cls: 'l-ref' }), tri(x + 13, y - 4, 4.5)]
      : kind === 'faint' ? [line(x, y - 4, x + 26, y - 4, { cls: 'k-curve-faint' })]
      : kind === 'solid' ? [line(x, y - 4, x + 26, y - 4, { cls: 'k-line' })]
      : [];
    return g({}, mark, lab(x + 34, y, label, 'k-label', 'start'));
  };
  const keys = (slug, x, y, items, { dx = 230, dy = 22, cols = items.length } = {}) =>
    g({}, items.map(([kind, label], i) => key(x + (i % cols) * dx, y + Math.floor(i / cols) * dy, kind, label, slug)));

  const css = `
.k-fig .l-plain { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .l-hann { stroke: var(--ink); stroke-width: 1.8; stroke-dasharray: 7 4; fill: none; }
.k-fig .l-mirror { stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 0.5 4; stroke-linecap: round; fill: none; }
.k-fig .l-ref { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; opacity: 0.55; }
.k-fig .l-bar { stroke: var(--input); stroke-width: 2.2; fill: none; }
.k-fig .l-total { stroke: var(--accent); stroke-width: 2.5; fill: none; }
.k-fig .l-shade { fill: var(--paper-2); }
.k-fig .l-tint { fill: var(--input-soft); }
.k-fig .l-dot { fill: var(--ink); }
.k-fig .l-dot-accent { fill: var(--accent); }
.k-fig .l-sq { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .l-ring { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .l-ring-accent { fill: none; stroke: var(--accent); stroke-width: 2; }
.k-fig .l-pad { fill: var(--paper); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l-tri { fill: var(--ink-soft); }
.k-fig .l-vec { stroke: var(--ink); stroke-width: 2; }
.k-fig .l-vec-mirror { stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 0.5 4; stroke-linecap: round; }
.k-fig .l-vec-col { stroke: var(--ink-soft); stroke-width: 2; }
.k-fig .l-vec-total { stroke: var(--accent); stroke-width: 2.5; }
.k-fig .l-head-ink { fill: var(--ink); }
.k-fig .l-head-soft { fill: var(--ink-soft); }
.k-fig .l-head-accent { fill: var(--accent); }
.k-fig .l-circle { stroke: var(--rule); stroke-width: 1.5; fill: none; }
.k-fig .l-in-bar { fill: var(--paper); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l-out-bar { fill: var(--accent); }
.k-fig .l-band-faint { fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l-grey { opacity: 0.35; }`;

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({
    name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css, eyebrow: 'Lesson 14 · spectrum analysis with windows',
    body: (kk, L) => [heads(L.slug), body(L)],
  });

  const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477, 1633];
  const keyBins = N => [...ROWS, ...COLS].map(f => Math.round(f * N / FS));

  const screen = L => {
    const P = L.phone ? plot({ x: 46, y: 70, w: 296, h: 200, xs: [0, 4000], ys: [0, 0.15] }) : plot({ x: 70, y: 60, w: 610, h: 220, xs: [0, 4000], ys: [0, 0.15] });
    const ph = [1.9, 0.6];
    const S = spectrum([[770, 0.1, ph[0]], [1336, 0.1, ph[1]]], 256);
    const pts = range(0, 128).map(b => [P.X(b * 31.25), P.Y(S(b * 31.25))]);
    const kb = keyBins(256), rowV = S(25 * 31.25), colV = S(43 * 31.25);
    return [
      axes(P, { yTicks: [[0, '0%'], [0.05, '5%'], [0.1, '10%'], [0.15, '15%']], xTicks: L.phone ? [[0, '0 Hz'], [2000, '2,000'], [4000, '4,000']] : [[0, '0 Hz'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000 Hz']], yTitle: 'match' }),
      L.phone ? '' : lab(P.x1, P.y1 + 36, 'bin tone, every bin of a 256-sample block', 'k-tick', 'end'),
      poly(pts, { cls: 'l-plain' }),
      line(P.x0, P.Y(0.12), P.x1, P.Y(0.12), { cls: 'l-bar' }),
      lab(P.x1, P.Y(0.12) - 8, 'bar 12%', 'k-num-input', 'end'),
      kb.map(b => dot(P.X(b * 31.25), P.Y(S(b * 31.25)), 3.5)),
      lab(P.X(25 * 31.25) - 4, P.Y(rowV) - 12, L.phone ? pct(rowV) : `770 Hz: ${pct(rowV)}`, 'k-num', 'end'),
      lab(P.X(43 * 31.25) + 4, P.Y(colV) - 12, L.phone ? pct(colV) : `1,336 Hz: ${pct(colV)}`, 'k-num', 'start'),
      L.phone ? [lab(P.x1, 24, 'a faint 5: the eye sees the bumps;', 'k-note', 'end'), lab(P.x1, 46, 'the bar does not', 'k-note', 'end')]
        : lab(P.x1, 30, 'a faint 5 on the rural line: the eye sees the bumps; the bar does not', 'k-note', 'end'),
      L.phone ? lab(P.x1, P.y1 + 40, 'bin tone, Hz (dots: the 8 keypad bins)', 'k-tick', 'end') : lab(P.x0, P.y1 + 36, 'dots: the eight keypad bins', 'k-tick', 'start'),
    ];
  };

  const leakage = L => {
    const ys = [0, 1];
    const [A, B] = L.phone
      ? [plot({ x: 56, y: 64, w: 280, h: 150, xs: [-0.5, 4.5], ys }), plot({ x: 56, y: 330, w: 280, h: 150, xs: [-0.5, 4.5], ys })]
      : [plot({ x: 70, y: 70, w: 270, h: 190, xs: [-0.5, 4.5], ys }), plot({ x: 420, y: 70, w: 270, h: 190, xs: [-0.5, 4.5], ys })];
    const on = [0, 1, 0, 0, 0], off = [0.25, 0.5995, 0.6995, 0.298, 0.25], bw = L.phone ? 26 : 30;
    const ticks = [[0, '0'], [1, '1,000'], [2, '2,000'], [3, '3,000'], [4, '4,000']];
    const ax = P => axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: ticks });
    const bar = (P, i, v, cls, o = {}) => rect(P.X(i) - bw / 2, P.Y(v), bw, P.Y(0) - P.Y(v), { cls, ...o });
    const toneMark = (P, f, anim) => g({ anim }, line(P.X(f / 1000), P.y0 - 14, P.X(f / 1000), P.y1, { cls: 'l-ref' }), tri(P.X(f / 1000), P.y0 - 20, 6),
      lab(P.X(f / 1000) + 10, P.y0 - 14, `tone ${hz(f)} Hz`, 'k-label', 'start'));
    const origin = P => `transform-origin:0px ${P.Y(0)}px`;
    return [
      ax(A), ax(B),
      lab(A.x0 - 40, A.y0 - 40, 'on a bin', 'k-name', 'start'), lab(B.x0 - 40, B.y0 - 40, 'between bins', 'k-name', 'start'),
      lab(A.x1, A.y1 + 36, 'bin, Hz', 'k-tick', 'end'), lab(B.x1, B.y1 + 36, 'bin, Hz', 'k-tick', 'end'),
      step(1, 'a 1,000 Hz tone sits on a bin: one bar at 100%, the rest at 0%',
        g({}, toneMark(A, 1000), on.map((v, i) => (v ? bar(A, i, v, 'k-bar') : '')), on.map((v, i) => (v ? lab(A.X(i) + bw / 2 + 6, A.Y(v) + 12, pct(v), 'k-num', 'start') : lab(A.X(i), A.Y(v) - 8, pct(v), 'k-num'))))),
      step(2, 'the tone slides from 1,000 to 1,500 Hz',
        toneMark(B, 1500, { k: 'move', dx: -(B.X(1.5) - B.X(1)), d: 1, len: 1.5 }),
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 1, len: 2 } }, bar(B, 1, 1, 'k-bar'))),
      step(3, 'the single bar melts into 25, 60, 70, 30 and 25 percent',
        g({ anim: { k: 'scale', sy: 0, d: 2.6, len: 1.2 }, style: origin(B) },
          off.map((v, i) => (i === 1 || i === 2 ? bar(B, i, v, 'k-bar') : bar(B, i, v, 'k-bar-hatch', { fill: `url(#${L.slug}-hatch)` })))),
        g({ anim: { k: 'in', d: 3.8 } }, off.map((v, i) => lab(B.X(i), B.Y(v) - 8, pct(v), 'k-num')))),
      step(4, 'hatched bars are leakage: the tone shows up in bins far from it',
        g({ anim: { k: 'in', d: 4.4 } }, L.phone ? keys(L.slug, 20, 536, [['solidbar', 'the two nearest bins'], ['hatch', 'leakage into far bins']], { cols: 1 })
          : keys(L.slug, 70, 330, [['solidbar', 'the two nearest bins'], ['hatch', 'leakage into far bins, where no tone is near']], { dx: 230 }))),
    ];
  };

  const midTurn = L => {
    const rows = [[1000, 'whole turn: back at the start'], [1500, 'half a turn left over']];
    return rows.map(([f, endText], r) => {
      const stepDeg = 360 * f / FS, end = 8 * stepDeg;
      const y0 = L.phone ? 50 + r * 300 : 50 + r * 200;
      const P = L.phone ? plot({ x: 40, y: y0 + 20, w: 300, h: 100, xs: [-0.5, 8.5], ys: [-1.2, 1.2] }) : plot({ x: 70, y: y0 + 20, w: 380, h: 120, xs: [-0.5, 8.5], ys: [-1.2, 1.2] });
      const cx = L.phone ? 180 : 590, cy = L.phone ? y0 + 205 : y0 + 80, R = L.phone ? 48 : 62;
      const at = d => [cx + R * Math.cos(d * Math.PI / 180), cy - R * Math.sin(d * Math.PI / 180)];
      const val = n => Math.cos(TAU * f * n / FS);
      const wave = range(0, 160).map(i => [P.X(i / 20), P.Y(val(i / 20))]);
      const [ex, ey] = at(end), [lx, ly] = [cx + (R + 18) * Math.cos(end * Math.PI / 180), cy - (R + 18) * Math.sin(end * Math.PI / 180)];
      const turn = { k: 'turn', r0: `${end}deg`, steps: 9, d: 1.2 + r * 3, len: 2.4 };
      const first = r * 3 + 1;
      return g({},
        lab(P.x0 - 30, y0, `${hz(f)} Hz: ${f === 1000 ? 'one turn' : 'one and a half turns'} in 8 samples`, 'k-name', 'start'),
        axes(P, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: [[0, 'n = 0'], [4, '4'], [8, L.phone ? '8' : '8: next block']] }),
        step(first, `${hz(f)} Hz: the 8 samples of the block, and sample 8 where the next block would start`,
          g({}, poly(wave, { cls: 'k-curve-faint' }),
            range(0, 7).map(n => g({}, line(P.X(n), P.Y(0), P.X(n), P.Y(val(n)), { cls: 'k-stem' }), dot(P.X(n), P.Y(val(n)), 4))),
            line(P.X(8), P.Y(0), P.X(8), P.Y(val(8)), { cls: 'l-ref' }), circle(P.X(8), P.Y(val(8)), 4.5, { cls: 'l-ring' }))),
        circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }), line(cx - R - 10, cy, cx + R + 10, cy, { cls: 'k-axis' }),
        range(0, 7).map(n => circle(...at(n * stepDeg), 2.8, { cls: 'k-stop' })),
        step(first + 1, `the dot turns ${fmt(stepDeg, 1)} degrees per sample, 8 times`,
          g({ anim: turn, style: `transform-origin:${cx}px ${cy}px` }, line(cx, cy, ex, ey, { cls: 'l-ref' }), circle(ex, ey, 6, { cls: 'k-dot' }))),
        step(first + 2, `after 8 samples: ${endText}`,
          g({ anim: { k: 'in', d: 3.8 + r * 3 } }, circle(...at(0), 9, { cls: 'l-ring-accent' }),
            lab(cx, cy + R + 30, `n = 8: ${endText}`, 'k-note-accent'),
            f === 1500 ? lab(lx, ly + 4, '8', 'k-tick') : '')),
        lab(cx + R + 16, cy + 4, '0', 'k-tick', 'start'));
    });
  };

  const twoArrows = L => {
    const cx = L.phone ? 180 : 210, cy = L.phone ? 190 : 180, R = L.phone ? 130 : 140, h = R / 2;
    const snaps = [0, 1, 2].map(n => { const a = 67.5 * n * Math.PI / 180; return { n, a, s: Math.cos(a) }; });
    const tip = (a, sgn = 1) => [cx + h * Math.cos(a), cy - sgn * h * Math.sin(a)];
    const one = ({ n, a, s }, solid) => {
      const [x1, y1] = tip(a), [x2, y2] = tip(a, -1), sx = cx + R * s;
      return g({},
        vec(L.slug, cx, cy, x1, y1, 'ink'), vec(L.slug, cx, cy, x2, y2, 'soft'),
        solid ? vec(L.slug, x1, y1, sx, cy, 'soft') : '',
        circle(sx, cy, solid ? 6 : 5, { cls: solid ? 'l-dot-accent' : 'l-dot' }),
        lab(sx + (n === 0 ? -2 : 0), cy + 22, fmt(s), solid ? 'k-num-accent' : 'k-num'),
        lab(x1 + (n === 0 ? 4 : n === 1 ? 8 : -8), y1 - 8, `n = ${n}`, 'k-tick', n === 2 ? 'end' : 'start'));
    };
    const keyX = L.phone ? 24 : 420, keyY = L.phone ? 380 : 90;
    return [
      circle(cx, cy, R, { cls: 'l-circle' }), circle(cx, cy, h, { cls: 'l-circle' }),
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }),
      lab(cx - R, cy + 40, `${M}1`, 'k-tick'), lab(cx + R, cy + 40, '1', 'k-tick'),
      step(1, 'sample 0: both half-size arrows point right, and the sample is 1.00',
        g({ anim: { k: 'in', d: 0, len: 0.6 } }, g({ cls: 'k-faint', anim: { k: 'fade', o0: 1, d: 1.6, len: 0.6 } }, one(snaps[0], false)))),
      step(2, 'sample 1: the arrows turn 67.5 degrees, one up and one down; the sample is 0.38',
        g({ anim: { k: 'in', d: 1.6, len: 0.6 } }, g({ cls: 'k-faint', anim: { k: 'fade', o0: 1, d: 3.2, len: 0.6 } }, one(snaps[1], false)))),
      step(3, 'sample 2: 135 degrees each way; the mirror arrow laid tip to tail lands on the sample, −0.71',
        g({ anim: { k: 'in', d: 3.2, len: 0.6 } }, one(snaps[2], true))),
      keys(L.slug, keyX, keyY, [['arrow', 'counter-clockwise arrow, half size'], ['arrow-mirror', 'mirror arrow, turning clockwise'], ['sample', 'the sample: left-right position'], ['faint', 'faint: samples 0 and 1']], { cols: 1, dy: 24 }),
      lab(keyX, keyY + 116, '1,500 Hz, samples 0, 1, 2:', 'k-num', 'start'), lab(keyX, keyY + 136, '1.00, 0.38, −0.71', 'k-num', 'start'),
      L.phone ? '' : lab(keyX, keyY + 172, 'the up-down parts cancel;', 'k-note', 'start'),
      L.phone ? '' : lab(keyX, keyY + 194, 'the left-right parts add', 'k-note', 'start'),
    ];
  };

  const walk = (x0, y0, a, stepDeg, count, start = 0, lengths = null) => {
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    for (let n = 0; n < count; n++) {
      const d = (start + n * stepDeg) * Math.PI / 180, l = lengths ? lengths[n] : 1;
      x += a * l * Math.cos(d); y -= a * l * Math.sin(d); pts.push([x, y]);
    }
    return pts;
  };

  const leftover = L => {
    const a = L.phone ? 24 : 30;
    const [ox, oy] = L.phone ? [100, 250] : [110, 270];
    const [px, py] = L.phone ? [180, 470] : [530, 200];
    const left = walk(ox, oy, a, 22.5, 8), right = walk(px - a / 2, py + a * 1.2, a, 45, 8);
    const [ex, ey] = left[8];
    const arrows = (pts, ids) => ids.map(i => vec(L.slug, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'ink', { anim: { k: 'in', d: 0.3 + i * 0.5, len: 0.4 } }));
    const total = Math.hypot(ex - ox, ey - oy) / (8 * a);
    return [
      lab(L.phone ? 20 : 40, 30, '1,500 Hz tone, 1,000 Hz bin', 'k-name', 'start'),
      lab(L.phone ? 20 : 40, 50, 'leftover arrow: 22.5° per sample', 'k-tick', 'start'),
      lab(L.phone ? 20 : 420, L.phone ? 330 : 30, '1,000 Hz tone, 2,000 Hz bin', 'k-name', 'start'),
      lab(L.phone ? 20 : 420, L.phone ? 350 : 50, 'leftover arrow: 45° per sample', 'k-tick', 'start'),
      line(ox, oy, ox + 8 * a, oy, { cls: 'l-ref' }), lab(ox + 8 * a, oy + 20, 'full pile, 100%', 'k-tick', 'end'),
      ...[0, 1, 2, 3].map(s => step(s + 1, `arrows ${2 * s + 1} and ${2 * s + 2} of each chain, laid tip to tail`,
        g({}, arrows(left, [2 * s, 2 * s + 1])), g({}, arrows(right, [2 * s, 2 * s + 1])))),
      step(5, `the left chain stops at ${pct(total)} of a full pile; the right one closes into a loop, 0%`,
        g({ anim: { k: 'in', d: 4.3 } }, line(ox, oy, ex, ey, { cls: 'l-total' }), circle(ox, oy, 4, { cls: 'l-dot-accent' }),
          masked(ox + (ex - ox) / 2 - 12, oy + (ey - oy) / 2 + 4, pct(total), { anchor: 'end', cls: 'k-num-accent', size: 13 }),
          lab(ex + 10, ey - 6, 'end: 157.5° from the first arrow', 'k-tick', 'start')),
        g({ anim: { k: 'in', d: 4.3 } }, circle(right[0][0], right[0][1], 7, { cls: 'l-ring-accent' }),
          lab(right[0][0] + 14, right[0][1] + 22, 'ends where it began: 0%', 'k-num-accent', 'start'))),
      lab(L.phone ? 180 : 360, L.phone ? 600 : 330, 'whole turns close, part turns leak', 'k-note'),
    ];
  };

  const twoChains = L => {
    const sc = L.phone ? 260 : 340;
    const chainPic = (ox, oy, Lv, Sv, ang, name, totalText, opts = {}) => {
      const lx = ox + Lv * sc, sx = lx + Sv * sc * Math.cos(ang * Math.PI / 180), sy = oy - Sv * sc * Math.sin(ang * Math.PI / 180);
      return { lx, sx, sy,
        base: g({}, lab(ox, oy - (opts.titleUp || 40), name, 'k-name', 'start'), vec(L.slug, ox, oy, lx, oy, 'ink'), lab(ox + Lv * sc / 2, oy + 20, `long ${opts.lText || pct(Lv)}`, 'k-num')),
        short: vec(L.slug, lx, oy, sx, sy, 'soft'),
        total: g({}, line(ox, oy, sx, sy, { cls: 'l-total' }), opts.left ? lab(sx - 10, sy - 8, totalText, 'k-num-accent', 'end') : lab(sx + 8, sy - 8, totalText, 'k-num-accent', 'start')) };
    };
    const [mx, my] = L.phone ? [24, 200] : [40, 230];
    const main = chainPic(mx, my, 0.641, 0.15, 112.5, '1,000 Hz bin', '60% from this start', { titleUp: L.phone ? 140 : 170, left: true });
    const r = 0.15 * sc;
    const ins = L.phone
      ? [chainPic(24, 400, 0.641, 0.127, 67.5, '2,000 Hz bin', '70%', { titleUp: 64 }), chainPic(24, 530, 0.225, 0.127, 67.5, '3,000 Hz bin', '30%', { titleUp: 64, lText: '22.5%' })]
      : [chainPic(440, 140, 0.641, 0.127, 67.5, '2,000 Hz bin', '70%', { titleUp: 60 }), chainPic(440, 290, 0.225, 0.127, 67.5, '3,000 Hz bin', '30%', { titleUp: 60, lText: '22.5%' })];
    return [
      main.base,
      circle(main.lx, my, r, { cls: 'l-circle' }),
      circle(main.lx + r, my, 4, { cls: 'l-ring' }), lab(main.lx + r + 8, my - 8, 'with: 79%', 'k-tick', 'start'),
      circle(main.lx - r, my, 4, { cls: 'l-ring' }), lab(main.lx - r, my + 38, 'against: 49%', 'k-tick'),
      lab(main.lx + 12, my - r - 8, 'mirror 15%', 'k-num', 'start'),
      step(1, 'the short mirror chain swings around the end of the long one as the start changes, from with to this start, 112.5 degrees off',
        g({ anim: { k: 'turn', r0: '112.5deg', steps: 16, d: 0.3, len: 2.4 }, style: `transform-origin:${main.lx}px ${my}px` }, main.short)),
      step(2, 'joined end to end, the two chains reach 60% from this start', g({ anim: { k: 'in', d: 2.8 } }, main.total)),
      step(3, 'the 2,000 Hz bin: 64% and 13%, 67.5 degrees apart, give 70%', g({ anim: { k: 'in', d: 3.6 } }, ins[0].base, ins[0].short, ins[0].total)),
      step(4, 'the 3,000 Hz bin: 22.5% and 13%, 67.5 degrees apart, give 30%', g({ anim: { k: 'in', d: 4.4 } }, ins[1].base, ins[1].short, ins[1].total)),
      keys(L.slug, L.phone ? 24 : 40, L.phone ? 590 : 336, [['arrow', 'long chain'], ['arrow-mirror', 'mirror chain'], ['total', 'joined: the match']], { dx: L.phone ? 0 : 200, cols: L.phone ? 1 : 3, dy: 22 }),
    ];
  };

  const mainLobe = L => {
    const P = L.phone ? plot({ x: 56, y: 50, w: 286, h: 190, xs: [-3, 3], ys: [0, 1] }) : plot({ x: 110, y: 50, w: 560, h: 200, xs: [-3, 3], ys: [0, 1] });
    const xt = L.phone ? [-2, -1, 0, 1, 2] : [-3, -2, -1, 0, 1, 2, 3];
    const hzT = d => (d === 0 ? '0' : `${d < 0 ? M : ''}${hzf(Math.abs(d) * 31.25)}`);
    const zl = (d, anchor) => g({}, line(P.X(d), P.Y(0) - 7, P.X(d), P.Y(0.3), { cls: 'l-ref' }), lab(P.X(d) + (anchor === 'start' ? 4 : -4), P.Y(0.3) - 6, L.phone ? 'zero' : 'zero: one whole turn', 'k-num-accent', anchor));
    return [
      area(P, plainLong, -1, 1),
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: xt.map(d => [d, d === 0 ? '0' : `${d < 0 ? M : ''}${Math.abs(d)}`]) }),
      xt.map(d => lab(P.X(d), P.y1 + 36, hzT(d), 'k-tick')),
      lab(P.x0 - (L.phone ? 20 : 30), P.y1 + 18, 'bins', 'k-tick', 'end'), lab(P.x0 - (L.phone ? 20 : 30), P.y1 + 36, 'Hz', 'k-tick', 'end'),
      lab(P.x1, P.y1 + 58, L.phone ? 'from the tone; Hz for N = 256' : 'distance from the tone, in bins and in Hz for a 256-sample block', 'k-tick', 'end'),
      poly(fnPts(P, plainLong, -3, 3), { cls: 'l-plain' }),
      lab(P.X(0), P.Y(L.phone ? 0.22 : 0.45), 'main lobe', L.phone ? 'k-num' : 'k-name'),
      [-1, 1].map(d => circle(P.X(d), P.Y(0), 5, { cls: 'l-ring-accent' })),
      zl(-1, 'end'), zl(1, 'start'),
    ];
  };

  const sideLobes = L => {
    const P = L.phone ? plot({ x: 46, y: 60, w: 300, h: 220, xs: [-11, 11], ys: [0, 0.3] }) : plot({ x: 70, y: 60, w: 610, h: 220, xs: [-11, 11], ys: [0, 0.3] });
    const S = spectrum([[770]], 256), at = d => S(770 + d * 31.25), top = 0.3;
    const b27 = 27 - 770 / 31.25, b22 = 22 - 770 / 31.25;
    const xt = L.phone ? [-10, -5, 0, 5, 10] : [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
    return [
      area(P, at, -11, -1, 'l-shade'), area(P, at, 1, 11, 'l-shade'),
      axes(P, { yTicks: [[0, '0%'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%']], xTicks: xt.map(d => [d, d === 0 ? '0' : `${d < 0 ? M : ''}${Math.abs(d)}`]) }),
      lab(P.x1, P.y1 + 36, 'bins from the 770 Hz tone (256 samples)', 'k-tick', 'end'),
      poly(fnPts(P, d => 1 / (Math.PI * Math.abs(d)), 1.06, 11, 120), { cls: 'l-ref' }), poly(fnPts(P, d => 1 / (Math.PI * Math.abs(d)), -11, -1.06, 120), { cls: 'l-ref' }),
      poly(fnPts(P, at, -11, 11, 900, top), { cls: 'l-plain' }),
      lab(P.X(0), P.y0 - 8, 'main lobe, up to 100%', 'k-tick'),
      lab(P.X(1.43) + 8, P.Y(0.24), L.phone ? '22%' : 'first side lobe: 22%', 'k-num', 'start'),
      lab(P.X(-8), P.Y(0.1), '1 ÷ (π d)', 'k-tick'),
      dot(P.X(10.5), P.Y(at(10.5)), 3.5), lab(P.X(10.5), P.Y(at(10.5)) - 26, L.phone ? '3%' : '10.5 bins: 3%', 'k-num', 'end'),
      dot(P.X(b27), P.Y(at(b27)), 5, 'l-dot-accent'), lab(P.X(b27) + 10, P.Y(at(b27)) + 4, L.phone ? 'bin 27: 13%' : "bin 27, the 7's row: 13%", 'k-num-accent', 'start'),
      dot(P.X(b22), P.Y(at(b22)), 5), line(P.X(b22), P.Y(at(b22)) - 7, P.X(b22), P.Y(0.165), { cls: 'l-ref' }),
      lab(P.X(b22) + 4, P.Y(0.165) - 6, L.phone ? 'bin 22: 10%' : "bin 22, the 1's row: 10%", 'k-num', 'end'),
      keys(L.slug, P.x0, L.phone ? P.y1 + 66 : P.y1 + 62, [['plain', 'match of a 770 Hz tone'], ['ref', 'envelope 1 ÷ (π d)']], { dx: 260, cols: L.phone ? 1 : 2 }),
    ];
  };

  const keypadLeak = L => {
    const P = L.phone ? plot({ x: 46, y: 50, w: 300, h: 200, xs: [600, 1000], ys: [0, 1] }) : plot({ x: 80, y: 50, w: 590, h: 220, xs: [600, 1000], ys: [0, 1] });
    const Sp = spectrum([[770]], 256), Sh = spectrum([[770]], 256, 'hann');
    const bins = [22, 25, 27, 30].map(b => b * 31.25), names = ['22', '25', '27', '30'];
    const rowY = P.y1 + 20;
    return [
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: [], yTitle: 'match' }),
      lab(P.x0, P.y1 + 18, '600 Hz', 'k-tick', 'start'), lab(P.x1, P.y1 + 18, '1,000 Hz', 'k-tick', 'end'),
      poly(fnPts(P, Sp, 600, 1000, 400), { cls: 'l-plain' }),
      poly(fnPts(P, Sh, 600, 1000, 400), { cls: 'l-hann' }),
      line(P.x0, P.Y(0.12), P.x1, P.Y(0.12), { cls: 'l-bar' }), lab(P.x0 + 6, P.Y(0.12) - 8, 'bar 12%', 'k-num-input', 'start'),
      bins.map((f, i) => g({},
        line(P.X(f), P.y1, P.X(f), P.y1 + 5, { cls: 'k-axis' }),
        dot(P.X(f), P.Y(Sp(f)), 4.5, i === 2 ? 'l-dot-accent' : 'l-dot'), sq(P.X(f), P.Y(Sh(f)), 8),
        lab(P.X(f), rowY + 16, hzf(f), 'k-tick', 'middle', L.phone ? { style: 'font-size:9.5px' } : {}),
        lab(P.X(f), rowY + 36, pct(Sp(f)), i === 2 ? 'k-num-accent' : 'k-num'),
        lab(P.X(f), rowY + 56, pct(Sh(f)), 'k-num'))),
      lab(P.x0 - 8, rowY + 16, 'bin', 'k-tick', 'end'), lab(P.x0 - 8, rowY + 36, 'plain', 'k-tick', 'end'), lab(P.x0 - 8, rowY + 56, 'Hann', 'k-tick', 'end'),
      L.phone ? lab(P.X(843.75) + 6, P.Y(0.3), 'second side lobe', 'k-tick', 'start')
        : lab(P.X(843.75) + 8, P.Y(0.27), 'bin 27 sits on the second side lobe', 'k-tick', 'start'),
      line(P.X(843.75), P.Y(0.24), P.X(843.75), P.Y(0.16), { cls: 'l-ref' }),
      keys(L.slug, L.phone ? 46 : 80, P.y1 + 104, [['plain', 'plain block, 256 samples'], ['hann', 'Hann window, 256 samples'], ['bar', 'the bar']], { dx: L.phone ? 0 : 220, cols: L.phone ? 1 : 3 }),
    ];
  };

  const phaseWobble = L => {
    const sc = L.phone ? 17 : 30;
    const [ox, oy] = L.phone ? [24, 170] : [40, 190];
    const cf = (f, b, sgn) => { let re = 0, im = 0; for (let n = 0; n < 256; n++) { const t = sgn * TAU * f * n / FS - TAU * b * n / 256; re += Math.cos(t); im += Math.sin(t); } return [re / 256, im / 256]; };
    const A = cf(770, 27, 1), B = cf(770, 27, -1), C = cf(1209, 27, 1), D = cf(1209, 27, -1);
    const mul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c], cj = ([a, b]) => [a, -b], add = (...z) => z.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
    const unitA = [A[0] / Math.hypot(...A), A[1] / Math.hypot(...A)];
    const parts = (er, ec) => { const r = mul(cj(er), cj(unitA)); return [mul(mul(A, er), r), mul(mul(B, cj(er)), r), mul(mul(C, ec), r), mul(mul(D, cj(ec)), r)]; };
    const E = range(0, 15).map(i => [Math.cos(TAU * i / 16), Math.sin(TAU * i / 16)]);
    const pairs = [];
    E.forEach(er => E.forEach(ec => pairs.push(parts(er, ec))));
    const ends = pairs.map(z => add(...z)), len = z => Math.hypot(...z);
    const P = ([x, y]) => [ox + x * 100 * sc, oy - y * 100 * sc];
    const out = ends.filter(z => len(z) > 0.12), lo = Math.min(...ends.map(len)), hi = Math.max(...ends.map(len));
    const ex = pairs[ends.indexOf(ends.reduce((b, z) => (len(z) > len(b) ? z : b)))];
    const pA = P(ex[0]), pB = P(add(ex[0], ex[1])), pC = P(add(ex[0], ex[1], ex[2])), pD = P(add(...ex));
    const arcR = 12 * sc, arc = range(-16, 16).map(i => [ox + arcR * Math.cos(i * Math.PI / 180), oy - arcR * Math.sin(i * Math.PI / 180)]);
    const mx = L.phone ? 70 : 580, mTop = L.phone ? 440 : 80, mH = L.phone ? 170 : 200, mY = v => mTop + mH - v / 0.16 * mH;
    return [
      lab(L.phone ? 24 : 40, 30, L.phone ? "a loud 4 in the 7's bin" : "a loud 4 in the 7's bin (bin 27), 256 pairs of starts", 'k-name', 'start'),
      L.phone ? lab(24, 50, 'bin 27, 256 pairs of starts', 'k-tick', 'start') : '',
      poly(arc, { cls: 'l-bar' }), lab(arc[0][0] + 4, arc[0][1] + 16, 'bar 12%', 'k-num-input', 'start'),
      step(1, "the 770 Hz tone's long chain into bin 27: 12.2%", g({ anim: { k: 'in', d: 0 } }, vec(L.slug, ox, oy, ...pA, 'ink'), lab(ox + 6, oy + 22, '770 Hz chain 12.2%', 'k-num', 'start'))),
      step(2, 'its mirror chain, 0.6%, and the 1,209 Hz column tone, 2.3%, joined end to end',
        g({ anim: { k: 'in', d: 1 } }, vec(L.slug, ...pA, ...pB, 'soft'), vec(L.slug, ...pB, ...pC, 'col'), vec(L.slug, ...pC, ...pD, 'soft'))),
      step(3, 'each pair of starts puts the end somewhere else: 256 ends, filled where they pass the bar',
        g({ anim: { k: 'in', d: 2, len: 1.6 } }, ends.map(z => { const [x, y] = P(z); return len(z) > 0.12 ? circle(x, y, 2.6, { cls: 'l-dot-accent' }) : circle(x, y, 2.4, { cls: 'l-pad' }); }))),
      step(4, `the match ranges from 8.9% to 14.6%; ${out.length} of 256 pairs of starts pass the 12% bar`,
        g({ anim: { k: 'in', d: 3.6 } },
          line(mx, mTop, mx, mTop + mH, { cls: 'k-axis' }),
          [0, 0.04, 0.08, 0.12, 0.16].map(v => lab(mx - 8, mY(v) + 4, pct(v), 'k-tick', 'end')),
          rect(mx + 10, mY(hi), 26, mY(lo) - mY(hi), { cls: 'l-band-faint' }),
          line(mx, mY(0.12), mx + 48, mY(0.12), { cls: 'l-bar' }),
          lab(mx + 44, mY(hi) + 4, `up to ${pct(hi, 1)}`, 'k-num', 'start'), lab(mx + 44, mY(lo) + 4, `down to ${pct(lo, 1)}`, 'k-num', 'start'),
          lab(mx + 52, mY(0.12) + 4, 'bar 12%', 'k-num-input', 'start'),
          lab(mx - 34, mTop + mH + 26, `${out.length} of 256`, 'k-num-accent', 'start'), lab(mx - 34, mTop + mH + 44, 'thrown out', 'k-num-accent', 'start'),
          lab(mx - 34, mTop - 16, "match in the 7's bin", 'k-tick', 'start'))),
      keys(L.slug, L.phone ? 24 : 40, L.phone ? 300 : 350, [['arrow', '770 Hz chain'], ['arrow-mirror', 'mirror chains'], ['arrow-col', '1,209 Hz chain, 2.3%'], ['out', 'end past the bar'], ['padded', 'end inside the bar']], { dx: 170, cols: L.phone ? 1 : 3, dy: 22 }),
    ];
  };

  const barSeesaw = L => {
    const top = 50, H = L.phone ? 300 : 250, Y = v => top + H - v / 0.16 * H;
    const ax = L.phone ? 50 : 90, cA = L.phone ? 70 : 130, cB = L.phone ? 200 : 330, cw = L.phone ? 80 : 110;
    const right = L.phone ? 300 : 470;
    const lowA = 0.089, hiA = 0.146, lowB = 0.077, hiB = 0.102;
    return [
      line(ax, top, ax, top + H, { cls: 'k-axis' }),
      [0, 0.04, 0.08, 0.12, 0.16].map(v => lab(ax - 8, Y(v) + 4, pct(v), 'k-tick', 'end')),
      lab(ax - 30, top - 20, 'match', 'k-tick', 'start'),
      step(1, "a loud 4's leak in the 7's row runs 8.9% to 14.6%; rural keys' own bins run 7.7% to 10.2%",
        g({}, rect(cA, Y(hiA), cw, Y(lowA) - Y(hiA), { fill: `url(#${L.slug}-hatch)`, cls: 'k-bar-hatch' }),
          lab(cA + cw / 2, Y(0) + 20, L.phone ? 'loud 4 leak' : "loud 4's leak", 'k-label'),
          lab(cA + cw / 2, Y(0) + 38, '8.9% to 14.6%', 'k-num')),
        g({}, rect(cB, Y(hiB), cw, Y(lowB) - Y(hiB), { cls: 'l-band-faint' }),
          lab(cB + cw / 2, Y(0) + 20, L.phone ? 'rural keys' : "rural keys' own bins", 'k-label'),
          lab(cB + cw / 2, Y(0) + 38, '7.7% to 10.2%', 'k-num'))),
      step(2, 'with the bar at 12%, every rural key is below it: never heard',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 1, len: 1.6 } }, line(ax, Y(0.12), right, Y(0.12), { cls: 'l-bar' }), masked(cB + cw / 2, Y(0.09) + 4, 'never heard', { cls: 'k-num-accent' }))),
      step(3, 'with the bar at 6%, every loud leak clears it: thrown out',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 2.6, len: 1.6 } }, line(ax, Y(0.06), right, Y(0.06), { cls: 'l-bar' }), masked(cA + cw / 2, Y(0.118) + 4, 'thrown out', { cls: 'k-num-accent' }))),
      step(4, 'to hear the rural keys the bar must sit below 7.7%; to keep out the leak, above 14.6%: no bar fits',
        g({ anim: { k: 'in', d: 4.2 } },
          path(`M${cA + cw / 2} ${Y(hiA) - 6}L${cA + cw / 2} ${Y(hiA) - 36}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
          lab(cA + cw / 2 + 8, Y(hiA) - 24, L.phone ? 'above' : 'bar must be above', 'k-label', 'start'),
          path(`M${cB + cw / 2} ${Y(lowB) + 6}L${cB + cw / 2} ${Y(lowB) + 36}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
          lab(cB + cw / 2 + 8, Y(lowB) + 30, L.phone ? 'below' : 'bar must be below', 'k-label', 'start'),
          lab(L.phone ? cB + cw / 2 : cB + cw / 2, Y(0.145), 'no bar fits', 'k-note-accent'))),
      L.phone ? g({}, lab(24, top + H + 70, 'bar 12%: rural never heard', 'k-num-input', 'start'), lab(24, top + H + 92, 'bar 6%: loud thrown out', 'k-num-input', 'start'))
        : g({}, line(530, Y(0.12), 600, Y(0.12), { cls: 'l-bar' }), lab(530, Y(0.12) + 18, '12%: rural never heard', 'k-tick', 'start'),
          line(530, Y(0.06), 600, Y(0.06), { cls: 'l-bar' }), lab(530, Y(0.06) + 18, '6%: loud thrown out', 'k-tick', 'start')),
    ];
  };

  const chainGap = L => {
    const a = L.phone ? 34 : 44, D = 22.5 * Math.PI / 180, rho = a / (2 * Math.sin(D / 2));
    const [sx, sy] = L.phone ? [150, 330] : [190, 330];
    const ca = (90 - 11.25) * Math.PI / 180, cx = sx + rho * Math.cos(ca), cy = sy - rho * Math.sin(ca);
    const pts = walk(sx, sy, a, 22.5, 8);
    const [ex, ey] = pts[8];
    const kx = L.phone ? 24 : 400;
    return [
      circle(cx, cy, rho, { cls: 'l-circle' }),
      line(cx, cy, sx, sy, { cls: 'l-ref' }), circle(cx, cy, 3, { cls: 'l-dot' }), lab((cx + sx) / 2 - 8, (cy + sy) / 2, 'radius 1', 'k-tick', 'end'),
      range(0, 7).map(i => vec(L.slug, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'ink')),
      line(sx, sy, ex, ey, { cls: 'l-total' }),
      circle(sx, sy, 4, { cls: 'l-dot-accent' }), circle(ex, ey, 4, { cls: 'l-dot-accent' }),
      lab(sx, sy + 22, 'start', 'k-tick'), lab(ex, ey - 12, 'end', 'k-tick'),
      L.phone ? '' : rich(kx, 110, ['gap: |1 − e', { sup: 'jNΔ' }, '|'], 'k-math', 'start'),
      L.phone ? '' : rich(kx, 160, ['one step: |1 − e', { sup: 'jΔ' }, '|'], 'k-math', 'start'),
      L.phone ? '' : lab(kx, 200, 'on the circle the chain runs around,', 'k-label', 'start'),
      L.phone ? '' : lab(kx, 220, 'drawn with radius 1', 'k-label', 'start'),
      L.phone ? '' : lab(kx, 260, 'gap ÷ step = the chain\'s length in steps', 'k-label', 'start'),
      L.phone ? [rich(24, 400, ['gap: |1 − e', { sup: 'jNΔ' }, '|'], 'k-math', 'start'), rich(24, 440, ['one step: |1 − e', { sup: 'jΔ' }, '|'], 'k-math', 'start'),
        lab(24, 474, 'on the chain\'s circle, radius 1', 'k-label', 'start')] : '',
      lab(L.phone ? 180 : 200, L.phone ? 30 : 40, '8 arrows, 22.5° apart', 'k-name'),
      lab((sx + ex) / 2 - 10, (sy + ey) / 2 - 20, 'gap', 'k-num-accent', 'end'),
    ];
  };

  const chord = L => {
    const [cx, cy, R] = L.phone ? [170, 180, 110] : [220, 180, 120];
    const x = 110 * Math.PI / 180;
    const p1 = [cx + R, cy], p2 = [cx + R * Math.cos(x), cy - R * Math.sin(x)];
    const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const arcPts = (r, a0, a1) => range(0, 30).map(i => { const t = a0 + (a1 - a0) * i / 30; return [cx + r * Math.cos(t), cy - r * Math.sin(t)]; });
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      line(cx, cy, ...p1, { cls: 'l-ref' }), line(cx, cy, ...p2, { cls: 'l-ref' }), line(cx, cy, ...mid, { cls: 'k-line' }),
      poly(arcPts(34, 0, x / 2), { cls: 'k-line' }), lab(cx + 46 * Math.cos(x / 4), cy - 46 * Math.sin(x / 4) + 4, 'x/2', 'k-num', 'start'),
      poly(arcPts(22, x / 2, x), { cls: 'l-ref' }),
      line(...p1, ...p2, { cls: 'l-total' }),
      circle(...p1, 4.5, { cls: 'l-dot' }), circle(...p2, 4.5, { cls: 'l-dot' }),
      lab(p1[0] + 10, p1[1] + 18, '1', 'k-math', 'start'),
      rich(p2[0] - 10, p2[1] - 10, ['e', { sup: 'jx' }], 'k-math', 'end'),
      lab(cx + (R + 12) * Math.cos(x / 2), cy - (R + 12) * Math.sin(x / 2), L.phone ? '2 sin(x/2)' : 'chord: 2 sin(x/2)', 'k-num-accent', 'start'),
      L.phone ? rich(180, 350, ['|1 − e', { sup: 'jx' }, '| = 2 |sin(x/2)|'], 'k-math') : rich(420, 150, ['|1 − e', { sup: 'jx' }, '| = 2 |sin(x/2)|'], 'k-math', 'start'),
      L.phone ? lab(180, 380, 'the chord from 1 to the point at angle x', 'k-label') : lab(420, 190, 'the chord from 1 to the point at angle x', 'k-label', 'start'),
      L.phone ? '' : lab(420, 214, 'is two half-chords, each sin(x/2) long', 'k-label', 'start'),
    ];
  };

  const hannTaper = L => {
    const N = 256, f = 770;
    const Wp = L.phone ? plot({ x: 40, y: 70, w: 300, h: 80, xs: [0, N], ys: [0, 1] }) : plot({ x: 60, y: 70, w: 180, h: 110, xs: [0, N], ys: [0, 1] });
    const P = L.phone ? plot({ x: 40, y: 230, w: 300, h: 100, xs: [0, N], ys: [-1.1, 1.1] }) : plot({ x: 300, y: 70, w: 380, h: 110, xs: [0, N], ys: [-1.1, 1.1] });
    const x = n => Math.cos(TAU * f * n / FS), w = n => hannW(n, N), hm = n => 0.54 - 0.46 * Math.cos(TAU * n / N);
    const blk = range(0, N - 1).map(n => [P.X(n), P.Y(x(n))]);
    const win = range(0, N - 1).map(n => [P.X(n), P.Y(x(n) * w(n))]);
    const d = 27 - f * N / FS, stepDeg = -360 * d / N;
    const wsum = range(0, N - 1).reduce((s0, n) => s0 + w(n), 0);
    const plain1 = walk(0, 0, 1, stepDeg, N, 90), hann1 = walk(0, 0, 1, stepDeg, N, 90, range(0, N - 1).map(n => w(n) * N / wsum));
    const box = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]; };
    const bp = box(plain1), bh = box(hann1);
    const span = Math.max(bp[1] - bp[0], bp[3] - bp[2], bh[1] - bh[0], bh[3] - bh[2]);
    const side = L.phone ? 150 : 170, sc = side / span;
    const place = (pts, bb, cx, cy) => pts.map(([px, py]) => [cx + (px - (bb[0] + bb[1]) / 2) * sc, cy + (py - (bb[2] + bb[3]) / 2) * sc]);
    const [c1, c2] = L.phone ? [[180, 560], [180, 800]] : [[200, 370], [520, 370]];
    const pw = place(plain1, bp, ...c1), hw = place(hann1, bh, ...c2);
    const gap = pts => Math.hypot(pts[N][0] - pts[0][0], pts[N][1] - pts[0][1]) / (sc * N);
    const gp = gap(pw), gh = gap(hw);
    const ends = pts => g({}, line(...pts[0], ...pts[N], { cls: 'l-total' }), circle(...pts[0], 8, { cls: 'l-ring-accent' }), circle(...pts[N], 8, { cls: 'l-ring-accent' }));
    const below = (c, t) => lab(c[0], c[1] + side / 2 + 30, t, 'k-num-accent');
    return [
      lab(Wp.x0, 34, 'the windows', 'k-name', 'start'),
      axes(Wp, { yTicks: [[0, '0'], [1, '1']], xTicks: [[0, 'n = 0'], [256, '256']] }),
      lab(P.x0, L.phone ? 200 : 34, '770 Hz, 256 samples', 'k-name', 'start'),
      axes(P, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: [[0, 'n = 0'], [128, '128'], [256, '256']] }),
      step(1, 'the Hann window fades in from 0 and back out to 0; Hamming stops at 0.08',
        g({ anim: { k: 'in', d: 0 } }, poly(range(0, N).map(n => [Wp.X(n), Wp.Y(w(n))]), { cls: 'l-hann' }),
          poly(range(0, N).map(n => [Wp.X(n), Wp.Y(hm(n))]), { cls: 'l-ref' }), tri(Wp.X(0) + 2, Wp.Y(0.08) - 6, 4), tri(Wp.X(N) - 2, Wp.Y(0.08) - 6, 4))),
      step(2, 'the plain block, then the block times the Hann window: the edges shrink to nothing',
        g({ anim: { k: 'in', d: 1 } }, poly(blk, { cls: 'k-curve-faint' })), g({ anim: { k: 'in', d: 2 } }, poly(win, { cls: 'k-line' }))),
      keys(L.slug, L.phone ? 24 : 60, L.phone ? 374 : 226, [['hann', 'Hann: 0 at the ends'], ['faint', 'plain block'], ['hamming', 'Hamming: 0.08 at the ends'], ['solid', 'windowed block']], { dx: 300, cols: L.phone ? 1 : 2, dy: 22 }),
      lab(c1[0], c1[1] - side / 2 - 18, 'plain chain into bin 27', 'k-name'), lab(c2[0], c2[1] - side / 2 - 18, 'Hann chain into bin 27', 'k-name'),
      step(3, `the plain chain runs 2.36 turns around one circle and stops ${pct(gp, 1)} of a full pile from the start`,
        g({ anim: { k: 'in', d: 3, len: 1.2 } }, poly(pw, { cls: 'k-line' }), ends(pw), below(c1, `gap ${pct(gp, 1)}: full-length end arrows`))),
      step(4, `the Hann chain: short arrows at both ends, so it ends ${pct(gh, 1)} from the start`,
        g({ anim: { k: 'in', d: 4.4, len: 1.2 } }, poly(hw, { cls: 'l-hann' }), ends(hw), below(c2, `gap ${pct(gh, 1)}: short end arrows`))),
      lab(L.phone ? 180 : 360, L.H - 14, 'first side lobe: 22% plain, 2.7% Hann', 'k-note'),
    ];
  };

  const effLength = L => {
    const N = 128;
    const A = L.phone ? plot({ x: 40, y: 60, w: 300, h: 140, xs: [0, N], ys: [0, 1] }) : plot({ x: 60, y: 60, w: 290, h: 180, xs: [0, N], ys: [0, 1] });
    const B = L.phone ? plot({ x: 40, y: 330, w: 300, h: 140, xs: [-3, 3], ys: [0, 1] }) : plot({ x: 420, y: 60, w: 270, h: 180, xs: [-3, 3], ys: [0, 1] });
    const w = n => hannW(n, N);
    const brace = (P, d, yv, s) => g({}, line(P.X(0), P.Y(yv), P.X(d), P.Y(yv), { cls: 'k-line', 'marker-end': `url(#${L.slug}-hi)` }), lab(P.X(d) + (d > 0 ? 6 : -6), P.Y(yv) + 4, s, 'k-num', d > 0 ? 'start' : 'end'));
    return [
      lab(A.x0, 30, 'Hann window, 128 samples', 'k-name', 'start'),
      rect(A.X(32), A.y0, A.X(96) - A.X(32), A.h, { cls: 'l-shade' }),
      axes(A, { yTicks: [[0, '0'], [0.5, '0.5'], [1, '1']], xTicks: [[0, 'n = 0'], [32, '32'], [96, '96'], [128, '128']] }),
      line(A.x0, A.Y(0.5), A.x1, A.Y(0.5), { cls: 'l-ref' }),
      poly(range(0, N).map(n => [A.X(n), A.Y(w(n))]), { cls: 'l-hann' }),
      masked(A.X(64), A.Y(0.3), 'above one half', { cls: 'k-num' }),
      lab(A.X(64), A.y1 + 40, 'half the block carries most of the weight', 'k-note'),
      lab(B.x0, L.phone ? 300 : 30, 'main lobes', 'k-name', 'start'),
      axes(B, { yTicks: [[0, '0%'], [1, '100%']], xTicks: [[-2, `${M}2`], [-1, `${M}1`], [0, '0'], [1, '1'], [2, '2']] }),
      lab(B.x1, B.y1 + 36, 'bins from the tone', 'k-tick', 'end'),
      poly(fnPts(B, d => Math.abs(sinc(d)), -3, 3), { cls: 'l-plain' }),
      poly(fnPts(B, hannAt, -3, 3), { cls: 'l-hann' }),
      [-1, 1].map(d => dot(B.X(d), B.Y(0), 4.5)), [-2, 2].map(d => sq(B.X(d), B.Y(0), 8)),
      keys(L.slug, L.phone ? 40 : 420, B.y1 + 64, [['plain', 'plain: first zero 1 bin out'], ['hann', 'Hann: first zero 2 bins out']], { cols: 1, dy: 22 }),
    ];
  };

  const threeCurves = L => {
    const T = L.phone ? plot({ x: 46, y: 70, w: 296, h: 170, xs: [-4, 4], ys: [-0.15, 0.55] }) : plot({ x: 70, y: 60, w: 600, h: 170, xs: [-4, 4], ys: [-0.15, 0.55] });
    const B = L.phone ? plot({ x: 46, y: 380, w: 296, h: 150, xs: [-4, 4], ys: [0, 1] }) : plot({ x: 70, y: 310, w: 600, h: 130, xs: [-4, 4], ys: [0, 1] });
    const xt = range(-4, 4).map(d => [d, d === 0 ? '0' : `${d < 0 ? M : ''}${Math.abs(d)}`]);
    const c = d => 0.5 * sinc(d), l = d => 0.25 * sinc(d + 1), r = d => 0.25 * sinc(d - 1);
    return [
      lab(T.x0 - 30, L.phone ? 24 : 30, L.phone ? 'three plain chains, as arrows' : 'three plain chains, measured along the tone\'s own chain', 'k-name', 'start'),
      L.phone ? lab(T.x0 - 30, 44, "(along the tone's own chain)", 'k-tick', 'start') : '',
      axes(T, { yTicks: [[0, '0'], [0.25, '¼'], [0.5, '½']], xTicks: xt }),
      poly(fnPts(T, l, -4, 4), { cls: 'l-ref' }), poly(fnPts(T, r, -4, 4), { cls: 'l-ref' }),
      tri(T.X(-1), T.Y(0.25) - 10, 5), tri(T.X(1), T.Y(0.25) - 10, 5),
      poly(fnPts(T, c, -4, 4), { cls: 'l-plain' }),
      lab(T.X(0.45), T.Y(0.5) + 4, '½ at the tone', 'k-num', 'start'),
      lab(T.X(-1) - 10, T.Y(0.25) - 6, L.phone ? '−¼, left' : '−¼ of the chain one bin left', 'k-tick', 'end'),
      lab(T.X(1) + 12, T.Y(0.25) - 6, L.phone ? '−¼, right' : '−¼ of the chain one bin right', 'k-tick', 'start'),
      lab(T.x1, T.y1 + 36, L.phone ? 'one bin over, a chain points backward, so −¼ adds' : 'bins from the tone; one bin over, a chain points backward, so −¼ of it adds', 'k-tick', 'end'),
      lab(B.x0 - 30, B.y0 - 24, 'their sum, rescaled: the Hann curve', 'k-name', 'start'),
      axes(B, { yTicks: [[0, '0%'], [1, '100%']], xTicks: xt }),
      poly(fnPts(B, hannAt, -4, 4), { cls: 'l-hann' }),
      [-4, -3, -2, 2, 3, 4].map(d => circle(B.X(d), B.Y(0), 4.5, { cls: 'l-ring-accent' })),
      L.phone ? lab(B.x1, B.Y(0) - 14, 'zeros from 2 bins', 'k-num-accent', 'end') : lab(B.X(2) + 10, B.Y(0) - 12, 'first zero: 2 bins out', 'k-num-accent', 'start'),
      lab(B.X(1) + 8, B.Y(0.5), '50%', 'k-num', 'start'), lab(B.x1, B.y1 + 36, 'bins from the tone', 'k-tick', 'end'),
    ];
  };

  const windowTrade = L => {
    const A = L.phone ? plot({ x: 46, y: 60, w: 296, h: 190, xs: [500, 900], ys: [0, 1.2] }) : plot({ x: 70, y: 50, w: 330, h: 230, xs: [500, 900], ys: [0, 1.2] });
    const B = L.phone ? plot({ x: 46, y: 370, w: 296, h: 170, xs: [550, 850], ys: [0, 1.2] }) : plot({ x: 470, y: 50, w: 210, h: 230, xs: [550, 850], ys: [0, 1.2] });
    const Sp = spectrum([[697]], 128), Sh = spectrum([[697]], 128, 'hann'), S2 = spectrum([[697]], 256, 'hann');
    const marker = (P, s) => g({}, line(P.X(770), P.Y(1.02), P.X(770), P.y1, { cls: 'l-ref' }), lab(P.X(770) + 6, P.Y(0.85), s, 'k-tick', 'start'));
    const edge = (P, half) => g({}, line(P.X(697), P.Y(1.1), P.X(697 + half), P.Y(1.1), { cls: 'k-line', 'marker-end': `url(#${L.slug}-hi)` }), line(P.X(697), P.Y(1.04), P.X(697), P.Y(1.16), { cls: 'k-line' }),
      lab(P.X(697) - 6, P.Y(1.1) + 4, `main lobe ${hzf(half)} Hz`, 'k-num', 'end'));
    return [
      lab(A.x0 - 40, 30, '128 samples, around 697 Hz', 'k-name', 'start'),
      axes(A, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: [[500, '500 Hz'], [697, '697'], [900, '900']] }),
      poly(fnPts(A, Sp, 500, 900, 300), { cls: 'l-plain' }), poly(fnPts(A, Sh, 500, 900, 300), { cls: 'l-hann' }),
      marker(A, '770 Hz'),
      edge(A, 125),
      dot(A.X(750), A.Y(Sh(750)), 5.5, 'l-dot-accent'), lab(A.X(750) + (L.phone ? 10 : 26), A.Y(Sh(750)) + 18, '750 Hz bin: 61%', 'k-num-accent', 'start'),
      lab(B.x0 - 40, L.phone ? 330 : 30, 'Hann, 256 samples', 'k-name', 'start'),
      axes(B, { yTicks: [[0, '0%'], [1, '100%']], xTicks: [[550, '550 Hz'], [697, '697'], [850, '850']] }),
      poly(fnPts(B, S2, 550, 850, 300), { cls: 'l-hann' }),
      marker(B, '770 Hz'),
      edge(B, 62.5),
      lab(B.X(770) + 6, B.Y(0.6), 'outside', 'k-num', 'start'),
      keys(L.slug, L.phone ? 24 : 70, L.phone ? B.y1 + 50 : A.y1 + 60, [['plain', 'plain'], ['hann', 'Hann'], ['ref', 'the next row']], { dx: L.phone ? 100 : 160 }),
    ];
  };

  const lobeLength = L => {
    const P = L.phone ? plot({ x: 50, y: 60, w: 290, h: 220, xs: [128, 400], ys: [0, 130] }) : plot({ x: 80, y: 50, w: 590, h: 230, xs: [128, 400], ys: [0, 130] });
    const hw = N => 16000 / N;
    return [
      rect(P.X(219.2), P.y0, P.X(320) - P.X(219.2), P.h, { cls: 'l-shade' }),
      axes(P, { yTicks: [[0, '0 Hz'], [50, '50'], [100, '100']], xTicks: (L.phone ? [128, 219, 320, 400] : [128, 200, 219, 256, 320, 400]).map(n => [n, String(n)]) }),
      lab(P.x1, P.y1 + 36, 'block length N, samples', 'k-tick', 'end'),
      lab(P.x0, P.y0 - 12, 'Hann main lobe reach, Hz each side', 'k-tick', 'start'),
      line(P.x0, P.Y(73), P.x1, P.Y(73), { cls: 'l-ref' }), lab(P.x1, P.Y(73) - 8, L.phone ? '73 Hz' : '73 Hz: 697 to 770', 'k-tick', 'end'),
      line(P.X(320), P.y0, P.X(320), P.y1, { cls: 'k-axis' }), lab(P.X(320) + 6, P.y0 + 14, L.phone ? '40 ms' : '320: 40 ms, a short press', 'k-tick', 'start'),
      poly(fnPts(P, hw, 128, 400), { cls: 'l-plain' }),
      lab(P.X(165), P.Y(110), '2 × 8,000 ÷ N', 'k-num', 'start'),
      circle(P.X(219.2), P.Y(73), 4, { cls: 'l-dot' }),
      dot(P.X(256), P.Y(62.5), 5.5, 'l-dot-accent'), line(P.X(256), P.Y(62.5) + 8, P.X(256), P.Y(36), { cls: 'l-ref' }), lab(P.X(256), P.Y(36) + 16, '256: 62.5 Hz', 'k-num-accent'),
      lab(P.X(270), P.Y(10), 'this range works', 'k-num'),
    ];
  };

  const zeroPad = L => {
    const P = L.phone ? plot({ x: 46, y: 50, w: 286, h: 200, xs: [600, 1000], ys: [0, 1.05] }) : plot({ x: 80, y: 50, w: 590, h: 220, xs: [600, 1000], ys: [0, 1.05] });
    const S = spectrum([[770]], 256);
    const coarse = range(20, 31).map(b => b * 31.25), fine = range(154, 256).filter(b => b % 8).map(b => b * 8000 / 2048);
    return [
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: (L.phone ? [600, 800, 1000] : [600, 700, 800, 900, 1000]).map(f => [f, f === 600 ? '600 Hz' : hz(f)]), yTitle: 'match' }),
      poly(fnPts(P, S, 600, 1000, 500), { cls: 'l-plain' }),
      step(1, 'the 256 bins, 31.25 Hz apart, on the curve', g({ anim: { k: 'in', d: 0 } }, coarse.map(f => dot(P.X(f), P.Y(S(f)), 4.5)))),
      step(2, 'padded to 2,048: bins 3.9 Hz apart land on the same curve', g({ anim: { k: 'in', d: 1, len: 1.6 } }, fine.map(f => circle(P.X(f), P.Y(S(f)), 2.4, { cls: 'l-pad' })))),
      step(3, 'a bin at 769.5 Hz now reads 100%; 843.75 Hz still leaks the same',
        g({ anim: { k: 'in', d: 3 } }, lab(P.X(769.53), P.Y(1) - 10, '769.5 Hz: 100%', 'k-num'),
          circle(P.X(843.75), P.Y(S(843.75)), 8, { cls: 'l-ring-accent' }), L.phone ? [lab(P.X(843.75) + 10, P.Y(S(843.75)) - 30, '843.75 Hz: still', 'k-num-accent', 'start'), lab(P.X(843.75) + 10, P.Y(S(843.75)) - 14, '11.6% to 12.8%', 'k-num-accent', 'start')]
            : lab(P.X(843.75) + 12, P.Y(S(843.75)) - 14, '843.75 Hz: still 11.6% to 12.8%', 'k-num-accent', 'start'))),
      lab(P.x1, P.y0 + 30, 'same curve, more dots', 'k-note', 'end'),
      keys(L.slug, L.phone ? 24 : 80, P.y1 + 50, [['coarse', '256 bins'], ['padded', '2,048 bins, after padding']], { dx: 200, cols: L.phone ? 1 : 2 }),
    ];
  };

  const myth = L => {
    const S = spectrum([[697]], 128, 'hann'), v770 = S(770);
    const panel = (P, title, fs) => g({},
      lab(P.x0 - 40, P.y0 - 24, title, 'k-name', 'start'),
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: [[550, '550 Hz'], [697, '697'], [850, '850']] }),
      poly(fnPts(P, S, 550, 850, 300), { cls: 'l-hann' }),
      fs.map(f => sq(P.X(f), P.Y(S(f)), fs.length > 20 ? 4 : 8)),
      line(P.X(770), P.y0, P.X(770), P.y1, { cls: 'l-ref' }),
      circle(P.X(770), P.Y(v770), 6, { cls: 'l-ring-accent' }), lab(P.X(770) + 10, P.Y(v770) - 6, `770 Hz: ${pct(v770)}`, 'k-num-accent', 'start'));
    const A = L.phone ? plot({ x: 46, y: 70, w: 296, h: 160, xs: [550, 850], ys: [0, 1] }) : plot({ x: 70, y: 70, w: 270, h: 200, xs: [550, 850], ys: [0, 1] });
    const B = L.phone ? plot({ x: 46, y: 340, w: 296, h: 160, xs: [550, 850], ys: [0, 1] }) : plot({ x: 420, y: 70, w: 270, h: 200, xs: [550, 850], ys: [0, 1] });
    return [
      panel(A, '128 samples, Hann', range(9, 13).map(b => b * 62.5)),
      panel(B, 'padded to 2,048: bins 3.9 Hz apart', range(141, 217).map(b => b * 8000 / 2048)),
      lab(L.phone ? 180 : 360, L.H - 16, 'same curve both times: the hump is just as wide', 'k-note'),
    ];
  };

  return [
    fig('spectrum-screen', [340, 330], "The engineers' spectrum screen",
      'Every bin of a 256-sample block of a faint key 5 plotted from 0 to 4,000 Hz: two small bumps near 770 and 1,336 Hz, about 8% and 9%, both under the 12% bar.',
      'A faint 5 on the rural line. The screen draws every bin, so your eye finds the two bumps. The detector reads only the eight keypad bins, and both sit under the 12% bar.', screen),
    fig('leakage', [380, 600], 'One tone, five bins',
      'Matches of an 8-sample block at the five bins: a 1,000 Hz tone gives 100% in one bin and 0% elsewhere; a 1,500 Hz tone gives 25, 60, 70, 30 and 25%.',
      'On a bin, the tone fills one bin. Halfway between bins it spreads into every bin. The hatched bars are leakage: matches where no tone is anywhere near.', leakage, 4),
    fig('mid-turn', [430, 640], 'Whole turn, half a turn',
      'The 8 samples of 1,000 Hz and 1,500 Hz with each tone\'s dot on a wheel: 1,000 Hz ends back at the start after one turn; 1,500 Hz stops halfway round after one and a half.',
      'The 1,000 Hz dot ends the block back where it started. The 1,500 Hz dot stops half a turn short, so the next sample (the hollow dot) jumps from 1.00 to −1.00.', midTurn, 6),
    fig('two-arrows', [360, 560], 'Two arrows make one tone',
      'A 1,500 Hz tone as two half-size arrows, one turning counter-clockwise and its mirror clockwise; their left-right parts add to the samples 1.00, 0.38 and −0.71.',
      'Each arrow is half size. The mirror arrow is always the counter-clockwise arrow reflected across the horizontal line, so the up-down parts cancel and the left-right parts add to the sample.', twoArrows, 3),
    fig('leftover', [350, 630], 'The leftover arrow',
      'The 8 leftover arrows laid tip to tail: for 1,500 Hz against the 1,000 Hz bin they fan over half a turn and stop at 64% of a full pile; for 1,000 Hz against the 2,000 Hz bin they close into a loop.',
      'Left: the leftover arrow turns 22.5° per sample, half a turn in all, and the chain reaches 64% as far as a full pile. Right: 45° per sample, one whole turn, and the chain closes.', leftover, 5),
    fig('two-chains', [360, 640], 'Two chains per bin',
      'At the 1,000 Hz bin the long chain, 64%, and the mirror chain, 15%, join end to end; depending on the start the total runs from 49% to 79%, 60% from this start. The 2,000 Hz bin gives 70% and the 3,000 Hz bin 30%.',
      'The mirror chain can point anywhere on the small circle, depending on where the tone starts. From our start it points 112.5° away and pulls the match down to 60%.', twoChains, 4),
    fig('main-lobe', [330, 320], 'The main lobe',
      'The match of a plain block against distance from the tone, −3 to +3 bins: a hump that reaches 0 one bin away on each side, 31.25 Hz for a 256-sample block.',
      'This is lesson 10\'s central hump, now named: the main lobe. It falls to zero one bin out on each side, where the leftover arrow makes one whole turn.', mainLobe),
    fig('side-lobes', [370, 400], 'The side lobes',
      'The match of a 770 Hz tone from −11 to +11 bins: shaded side lobes, the first at 22%, shrinking like 1 ÷ (π d) to 3% at 10.5 bins, with bin 27 at 13% and bin 22 at 10%.',
      'Beyond the main lobe the curve rises into side lobes that shrink slowly. The 7\'s bin and the 1\'s bin both sit on side lobes of the 770 Hz tone.', sideLobes),
    fig('keypad-leak', [410, 420], 'A loud 770 Hz across the row bins',
      'The match curve of a loud 770 Hz tone, 600 to 1,000 Hz: plain, the row bins read 10%, 81%, 13% and 6%, with the 13% above the 12% bar; with a Hann window they read 2%, 92%, 3% and 0%.',
      'The 7\'s bin (843.75 Hz) sits on the second side lobe of the plain curve and catches 13%, over the 12% bar. The dashed Hann curve leaves it 3%.', keypadLeak),
    fig('phase-wobble', [400, 700], 'Why only sometimes',
      'The 7\'s bin as joined chains for a loud 4: the 770 Hz chain, 12.2%, plus its mirror and the 1,209 Hz column tone\'s chains; over 256 pairs of starts the total runs 8.9% to 14.6%, and 144 pass the 12% bar.',
      'The long chain is fixed. The small chains move with the starts, so the end lands somewhere in a small cloud. Filled dots land past the bar: those presses are thrown out.', phaseWobble, 4),
    fig('bar-seesaw', [360, 500], 'No bar fits',
      'On one scale from 0 to 16%: a loud 4\'s leak runs 8.9% to 14.6% and rural keys\' own bins 7.7% to 10.2%; a bar at 12% misses the rural keys, a bar at 6% throws out the loud ones.',
      'The two ranges overlap. Hearing the rural keys needs a bar below 7.7%; keeping out the leak needs one above 14.6%.', barSeesaw, 4),
    fig('chain-gap', [340, 500], 'The gap is the top of the fraction',
      'The 8-arrow chain for 1,500 Hz at the 1,000 Hz bin runs around a circle; with that circle\'s radius as 1, the gap from start to end is |1 − e^{jNΔ}| and one step is |1 − e^{jΔ}|.',
      'The arrows of a chain all turn by the same angle, so they run around one circle. Measured with that circle\'s radius as 1, the gap is the top of the fraction and one step is the bottom.', chainGap),
    fig('chord', [320, 400], 'The chord',
      'The unit circle with the points 1 and e^{jx}: the chord between them is 2 sin(x/2), two half-chords split by the line from the centre at angle x/2.',
      'The line from the centre to the chord\'s midpoint splits the angle x in half and the chord in two halves, each sin(x/2) long.', chord),
    fig('hann-taper', [530, 940], 'Taper the edges',
      'A 256-sample block of 770 Hz and the same block times the Hann window, then the chains into bin 27: the plain chain stops 12.2% of a full pile from the start, the Hann chain 2.7%.',
      'The window shrinks the arrows near both ends of the block. The plain chain\'s full-length end arrows leave a wide gap; the Hann chain\'s short ones leave it nearly closed.', hannTaper, 4),
    fig('effective-length', [360, 580], 'Half the block does the work',
      'The Hann window over 128 samples is above one half only from sample 32 to 96; its main lobe reaches 2 bins against the plain block\'s 1.',
      'A Hann-windowed block acts roughly like one half as long, and its main lobe is twice as wide.', effLength),
    fig('hann-three-curves', [490, 600], 'Three plain chains make the Hann curve',
      'Half the plain chain at the tone and a quarter of the plain chains one bin each way, added as arrows: the sum, rescaled, is the Hann curve, zero at every whole bin from 2 bins out.',
      'Added as arrows, then rescaled so a tone on its bin reads 100%. Each plain curve is zero at every whole bin but its own centre, so the sum is zero everywhere except at −1, 0 and +1 bins.', threeCurves),
    fig('window-trade', [370, 620], 'The window\'s trade',
      'Around 697 Hz with 128 samples, the Hann main lobe reaches 125 Hz and the 750 Hz bin reads 61%; with 256 samples it reaches 62.5 Hz and 770 Hz falls outside it.',
      'At 128 samples the Hann main lobe swallows the next row\'s tone. At 256 samples it stops short of it.', windowTrade),
    fig('lobe-vs-length', [340, 360], 'Why 256 works',
      'The Hann main lobe\'s reach, 2 × 8,000 ÷ N Hz, against block length: it drops below the 73 Hz row gap at N = 219, and 320 samples is the longest block that fits a press; 256 reaches 62.5 Hz.',
      'Any block between the crossing at 219 samples and the 40 ms limit at 320 keeps the next row outside the main lobe. 256 sits inside that range.', lobeLength),
    fig('zero-padding', [380, 400], 'Zero padding',
      'The plain 256-sample curve of 770 Hz with its bins 31.25 Hz apart and, after padding to 2,048 samples, bins 3.9 Hz apart on the same curve: 769.5 Hz reads 100%, 843.75 Hz still 11.6% to 12.8%.',
      'The padded bins fall on exactly the same curve. A bin now sits on the tone, but the leak at 843.75 Hz is unchanged.', zeroPad, 3),
    fig('padding-myth', [340, 560], 'Padding does not narrow the hump',
      'The 128-sample Hann hump of 697 Hz, once with its own bins and once with far finer padded bins: the same curve, reading 38% at 770 Hz both times.',
      'More dots, same hump. The 770 Hz tone is still inside it at 38%.', myth),
  ];
};
