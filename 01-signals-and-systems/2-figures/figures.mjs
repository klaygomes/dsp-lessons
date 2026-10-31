export default k => {
  const { g, line, path, rect, circle, text, plot, axes, band, curve, stems, bars, arrow, check, cross, box, step, legend, fmt, cosd, range } = k;
  const clip = v => Math.max(-1, Math.min(1, v));
  const tone = (f, size = 1, phi = 0) => n => size * cosd(360 * f * n / 8000 + phi);
  const pts = (fn, ns) => ns.map(n => [n, fn(n)]);
  const ns = (a, b) => range(a, b);
  const M = '−';
  const pm = [[1, '1'], [-1, `${M}1`]];
  const clipStems = (P, fn, nlist, o = {}) => {
    const raw = pts(fn, nlist), over = raw.filter(([, v]) => Math.abs(v) > 1 + 1e-9);
    return g({}, over.length ? stems(P, over, { cls: 'k-stem-soft' }) : '',
      stems(P, raw.filter(([, v]) => Math.abs(v) <= 1 + 1e-9), { cls: 'k-stem', ...o }),
      over.length ? stems(P, over.map(([n, v]) => [n, clip(v)]), { cls: 'k-stem-accent', ...o }) : '');
  };

  const samples = (L) => {
    const v = t => 0.55 * Math.sin(2 * Math.PI * 620 * t / 8000 + 0.4) + 0.3 * Math.sin(2 * Math.PI * 1430 * t / 8000 + 1.1);
    const last = L.phone ? 6 : 10;
    const P = plot({ x: L.phone ? 40 : 60, y: 50, w: L.W - (L.phone ? 56 : 80), h: 180, xs: [-0.4, last + 0.4], ys: [-1, 1] });
    const dots = ns(0, last), stick = i => 2 + i * (L.phone ? 0.45 : 0.3);
    const lab = n => text(P.X(n), v(n) >= 0 ? P.Y(v(n)) - 12 : P.Y(v(n)) + 26, fmt(v(n)), { cls: 'k-num' });
    return [
      axes(P, { yTicks: [[1, '+1'], [-1, `${M}1`]], xTicks: [] }),
      step(1, 'the smooth voltage from the microphone',
        g({ cls: 'k-ghost', anim: { k: 'flash', d: 0, len: 6.6 } }, curve(P, v, { anim: { k: 'draw', d: 0, len: 2 } }))),
      step(2, 'one measurement every 1/8,000 of a second',
        g({}, dots.map((n, i) => g({ anim: { k: 'in', d: stick(i), len: 0.6 } }, stems(P, [[n, v(n)]], { dot: 5 })))),
        g({ anim: { k: 'in', d: 2.3 } }, line(P.X(0), 258, P.X(1), 258, { cls: 'k-axis' }), line(P.X(0), 252, P.X(0), 264, { cls: 'k-axis' }), line(P.X(1), 252, P.X(1), 264, { cls: 'k-axis' }),
          text(P.X(1) + 10, 262, '1/8,000 s apart', { anchor: 'start', cls: 'k-tick' }))),
      step(3, 'the curve fades and only the dots remain, each a sample x[n] with its value',
        g({ anim: { k: 'in', d: 6.6 } }, dots.map(lab), dots.map(n => text(P.X(n), 288, `x[${n}]`, { cls: 'k-tick' })))),
      step(4, 'the dots sit on the wave they came from, which runs on between them',
        g({ anim: { k: 'in', d: 7.8, len: 1.2 } }, curve(P, v, { cls: 'k-curve-soft' }),
          text(L.W / 2, 30, L.phone ? 'kept: only the dots' : 'kept: only the dots. Dashed: the wave they came from', { cls: 'k-note' }))),
    ];
  };

  const toneSteps = (L) => {
    const Lp = L.phone ? plot({ x: 44, y: 50, w: 296, h: 140, xs: [0, 360], ys: [-1.2, 1.2] }) : plot({ x: 60, y: 60, w: 280, h: 180, xs: [0, 360], ys: [-1.2, 1.2] });
    const R = L.phone ? plot({ x: 44, y: 290, w: 296, h: 150, xs: [-0.5, 8.5], ys: [-1.25, 1.25] }) : plot({ x: 410, y: 60, w: 290, h: 180, xs: [-0.5, 8.5], ys: [-1.2, 1.2] });
    const at = i => 1 + i * 0.7, rowN = R.y1 + 30, rowA = R.y1 + 48;
    return [
      step(1, 'the cosine curve against the angle, 0 to 360 degrees',
        axes(Lp, { yTicks: pm, xTicks: [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°'], [360, '360°']] }),
        curve(Lp, d => cosd(d), { cls: 'k-curve-soft' }),
        text(Lp.x0, Lp.y0 - 22, 'cos of the angle', { anchor: 'start', cls: 'k-name' }),
        text(R.x0, R.y0 - 22, 'the 1,000 Hz tone, sample by sample', { anchor: 'start', cls: 'k-name' })),
      step(2, 'the angle steps 45 degrees per sample',
        range(0, 8).map(i => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: at(i), len: 0.7 } }, line(Lp.X(45 * i), Lp.y0, Lp.X(45 * i), Lp.y1, { cls: 'k-edge' }))),
        range(0, 8).map(i => g({ anim: { k: 'in', d: at(i), len: 0.4 } }, circle(Lp.X(45 * i), Lp.Y(cosd(45 * i)), 4.5, { cls: 'k-stem-dot' })))),
      step(3, `each value drops onto its own stem: 1.00, 0.71, 0.00, ${M}0.71, ${M}1.00, ${M}0.71, 0.00, 0.71, 1.00`,
        axes(R, { xTicks: [] }),
        range(0, 8).map(i => g({ anim: { k: 'in', d: at(i) + 0.25, len: 0.35 } }, g({ anim: { k: 'move', dy: -24, d: at(i) + 0.25, len: 0.5 } },
          stems(R, [[i, cosd(45 * i)]], { labels: v => fmt(v), labelCls: L.phone ? 'k-tick' : 'k-num' }))))),
      step(4, 'the angle under each stem',
        range(0, 8).map(i => g({}, text(R.X(i), rowN, String(i), { cls: 'k-tick' }), text(R.X(i), rowA, `${45 * i}°`, { cls: 'k-tick', style: L.phone ? 'font-size:9px' : undefined }))),
        text(R.x0 - 8, rowN, 'n', { anchor: 'end', cls: 'k-tick' }), L.phone ? '' : text(R.x0 - 8, rowA, 'angle', { anchor: 'end', cls: 'k-tick' }),
        text(L.W / 2, L.H - 10, '360° × 1,000 ÷ 8,000 = 45° per sample', { cls: 'k-note' })),
    ];
  };

  const system = (L) => {
    const xin = [0.3, 0.7, 0.5, -0.2, -0.6, -0.1], yout = [0.5, 0.6, 0.1, -0.4, -0.3, 0.2];
    if (L.phone) {
      const A = plot({ x: 100, y: 40, w: 180, h: 70, xs: [-0.5, 5.5], ys: [-1, 1] }), B = plot({ x: 100, y: 236, w: 180, h: 70, xs: [-0.5, 5.5], ys: [-1, 1] });
      return [
        arrow(L.slug, [[180, 114], [180, 136]]), arrow(L.slug, [[180, 196], [180, 226]]),
        axes(A, { xTicks: [] }), stems(A, xin.map((v, i) => [i, v]), { dot: 4 }), text(A.x0 - 8, A.Y(0) + 4, 'x[n]', { anchor: 'end', cls: 'k-name' }),
        box(130, 140, 100, 52, { name: 'T', sub: 'the system' }),
        axes(B, { xTicks: [] }), stems(B, yout.map((v, i) => [i, v]), { dot: 4 }), text(B.x0 - 8, B.Y(0) + 4, 'y[n]', { anchor: 'end', cls: 'k-name' }),
        text(180, 344, 'y[n] = T{x[n]}', { cls: 'k-math' }),
        text(180, 376, 'T could be:', { cls: 'k-label' }),
        ['× 4', 'average with the one before', 'wait 2,000 samples'].map((s, i) => text(180, 398 + i * 20, s, { cls: 'k-num' })),
      ];
    }
    const A = plot({ x: 40, y: 60, w: 170, h: 80, xs: [-0.5, 5.5], ys: [-1, 1] }), B = plot({ x: 510, y: 60, w: 170, h: 80, xs: [-0.5, 5.5], ys: [-1, 1] });
    return [
      arrow(L.slug, [[214, 100], [288, 100]]), arrow(L.slug, [[432, 100], [506, 100]]),
      axes(A, { xTicks: [] }), stems(A, xin.map((v, i) => [i, v]), { dot: 4 }),
      axes(B, { xTicks: [] }), stems(B, yout.map((v, i) => [i, v]), { dot: 4 }),
      text(A.X(2.5), 44, 'x[n], the signal in', { cls: 'k-name' }), text(B.X(2.5), 44, 'y[n], the signal out', { cls: 'k-name' }),
      box(292, 64, 136, 72, { name: 'T', sub: 'the system' }),
      text(360, 184, 'y[n] = T{x[n]}', { cls: 'k-math' }),
      text(360, 222, 'T could be:  × 4   ·   average with the one before   ·   wait 2,000 samples', { cls: 'k-num' }),
    ];
  };

  const clipFig = (L) => {
    const ys = [-2.25, 2.25], n8 = ns(0, 7);
    const [A, B] = L.phone
      ? [plot({ x: 44, y: 76, w: 296, h: 170, xs: [-0.5, 7.5], ys }), plot({ x: 44, y: 330, w: 296, h: 170, xs: [-0.5, 7.5], ys })]
      : [plot({ x: 70, y: 70, w: 260, h: 210, xs: [-0.5, 7.5], ys }), plot({ x: 420, y: 70, w: 260, h: 210, xs: [-0.5, 7.5], ys })];
    const grow = { k: 'scale', sy: 0.25, d: 1, len: 2 }, origin = P => `transform-origin:0px ${P.Y(0)}px`;
    const loud = pts(tone(1000, 2), n8);
    const title = (P, s, ok) => g({}, text(P.x0, P.y0 - 16, s, { anchor: 'start', cls: 'k-name' }),
      ok ? check(P.x1 - 8, P.y0 - 20) : cross(P.x1 - 8, P.y0 - 20));
    return [
      text(L.phone ? 20 : 70, 30, L.phone ? 'shaded: what the chip can store' : 'shaded: what the 16-bit chip can store, −1 to +1', { anchor: 'start', cls: 'k-note' }),
      g({}, [A, B].map(P => g({}, band(P, -1, 1), axes(P, { yTicks: [[2, '2'], [1, '1'], [-1, `${M}1`], [-2, `${M}2`]], xTicks: [[0, 'n = 0'], [7, '7']] })))),
      title(A, 'quiet caller: 0.2 × 4, peak 0.80', true),
      title(B, 'loud caller: 0.5 × 4, peak 2.00', false),
      step(1, 'the quiet caller, 0.2, grows by 4 and stays inside the range',
        g({ anim: grow, style: origin(A) }, stems(A, pts(tone(1000, 0.8), n8)))),
      step(2, 'the loud caller, 0.5, grows by 4 past the edge to 2.00',
        g({ anim: grow, style: origin(B) }, stems(B, loud.filter(([, v]) => Math.abs(v) > 1), { cls: 'k-stem-soft' }),
          text(B.X(0) + 10, B.Y(2) + 4, '2.00', { anchor: 'start', cls: 'k-label' }), text(B.X(1) + 10, B.Y(1.414) - 6, '1.41', { anchor: 'start', cls: 'k-label' }))),
      step(3, 'the chip pushes every stem past the edge back onto it, to 1.00 or −1.00',
        g({ anim: { k: 'in', d: 3.2 } }, stems(B, loud.filter(([, v]) => Math.abs(v) < 1), { cls: 'k-stem' }),
          stems(B, loud.filter(([, v]) => Math.abs(v) > 1).map(([n, v]) => [n, clip(v)]), { cls: 'k-stem-accent' }),
          text(B.x0, B.y1 + 36, 'every sample past the edge is cut to the edge', { anchor: 'start', cls: 'k-note-accent' }))),
    ];
  };

  const neighbor = (L) => {
    const panel = (x0, y0, title, vals, ok) => {
      const P = plot({ x: x0 + 34, y: y0 + 40, w: 150, h: 150, xs: [-0.5, 2.5], ys: [0, 1.6] });
      const Y = P.Y, bx = x0 + 216, sx = x0 + 308, bw = 22, sum = vals[0] + vals[2], scaled = 1.414 * vals[1];
      return g({},
        text(x0 + 170, y0 + 10, title, { cls: 'k-name' }),
        rect(P.X(1) - 18, P.y0 - 4, 36, P.y1 - P.y0 + 4, { cls: 'k-band', rx: 3 }),
        axes(P, { xTicks: [[0, 'n = 0'], [1, '1'], [2, '2']] }),
        stems(P, vals.map((v, i) => [i, v]), { labels: v => fmt(v) }),
        line(bx - 24, Y(0), sx + 24, Y(0), { cls: 'k-axis' }),
        rect(bx - bw / 2, Y(sum), bw, Y(0) - Y(sum), { cls: 'k-bar-soft' }),
        text(bx, Y(sum) - 10, fmt(sum), { cls: 'k-num' }),
        rect(sx - bw / 2, Y(scaled), bw, Y(0) - Y(scaled), { cls: ok ? 'k-bar' : 'k-bar-accent' }),
        text(sx, Y(scaled) - 10, fmt(scaled, ok ? 2 : 3), { cls: ok ? 'k-num' : 'k-num-accent' }),
        line(bx - 16, Y(sum), sx + 16, Y(sum), { cls: 'k-guide' }),
        text(bx, P.y1 + 18, 'x[0] + x[2]', { cls: 'k-tick' }), text(sx, P.y1 + 18, '1.414 × x[1]', { cls: 'k-tick' }),
        text(bx, P.y1 + 34, `${fmt(vals[0])} + ${fmt(vals[2])}`, { cls: 'k-tick' }),
        ok ? check(x0 + 110, P.y1 + 66) : cross(x0 + 110, P.y1 + 66),
        text(x0 + 124, P.y1 + 70, ok ? '1.00 = 1.00: match' : '1.00 against 1.414: no match', { anchor: 'start', cls: 'k-label' }));
    };
    const foot = text(L.W / 2, L.H - 10, '1.414 is 2 × cos 45°, the 1,000 Hz tone’s own number', { cls: 'k-tick' });
    if (L.phone) return [panel(4, 20, 'clean tone, at n = 1', [1, 0.7071, 0], true), line(20, 300, 340, 300, { cls: 'k-grid' }), panel(4, 316, 'clipped list, at n = 1', [1, 1, 0], false), foot];
    return [panel(10, 20, 'clean tone, at n = 1', [1, 0.7071, 0], true), line(360, 30, 360, 290, { cls: 'k-grid' }), panel(370, 20, 'clipped list, at n = 1', [1, 1, 0], false), foot];
  };

  const twoTones = (L) => {
    const P = plot({ x: L.phone ? 36 : 60, y: 40, w: L.W - (L.phone ? 50 : 80), h: L.phone ? 200 : 230, xs: [-0.4, 7.6], ys: [-1.45, 1.45] });
    const A = t => 1.207 * cosd(45 * t), B = t => 0.207 * cosd(135 * t);
    const clipped = [1, 1, 0, -1, -1, -1, 0, 1];
    const items = [['k-curve-soft', '1,000 Hz, size 1.207'], ['k-curve-accent', L.phone ? '3,000 Hz, size 0.207: the buzz' : '3,000 Hz, 0.207: the buzz'], ['k-curve', 'the first minus the second']];
    return [
      axes(P, { yTicks: pm, xTicks: ns(0, 7).map(n => [n, n ? String(n) : 'n = 0']) }),
      step(1, `the eight clipped samples: 1, 1, 0, ${M}1, ${M}1, ${M}1, 0, 1`, stems(P, clipped.map((v, i) => [i, v]), { dot: 5 })),
      step(2, 'a 1,000 Hz wave of size 1.207', g({ anim: { k: 'in', d: 1 } }, curve(P, A, { cls: 'k-curve-soft' }))),
      step(3, 'a 3,000 Hz wave of size 0.207, the buzz', g({ anim: { k: 'in', d: 2 } }, curve(P, B, { cls: 'k-curve-accent' }),
        text(P.X(16 / 3), P.Y(0.36), 'the buzz', { cls: 'k-note-accent' }))),
      step(4, 'subtracting the small wave from the big one lands exactly on every clipped sample',
        [0, 0.25, 0.5, 0.75].map((s, i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 3 + i * 0.6, len: 0.9 } }, curve(P, t => A(t) - s * B(t)))),
        g({ anim: { k: 'in', d: 5.4 } }, curve(P, t => A(t) - B(t)))),
      L.phone ? legend(L.slug, 40, 300, items, { cols: 1, dy: 22 }) : legend(L.slug, 24, 318, items, { dx: 236 }),
    ];
  };

  const superposition = (L) => {
    const col = (x0, y0, s, out1, note, out2, ok) => {
      const row = (y, label, inputs, op1, mid, op2, out, accent, sub) => g({},
        text(x0, y - 36, label, { anchor: 'start', cls: 'k-tick' }),
        inputs.map((t, i) => text(x0 + 24, y + 4 + (i - 0.5) * 18, t, { cls: 'k-num' })),
        arrow(L.slug, [[x0 + 50, y], [x0 + 74, y]]),
        box(x0 + 78, y - 20, 60, 40, { name: op1 }),
        arrow(L.slug, [[x0 + 140, y], [x0 + 162, y]]),
        mid.map((t, i) => text(x0 + 184, y + 4 + (i - (mid.length - 1) / 2) * 18, t, { cls: 'k-num' })),
        arrow(L.slug, [[x0 + 204, y], [x0 + 226, y]]),
        box(x0 + 230, y - 20, 60, 40, { name: op2 }),
        arrow(L.slug, [[x0 + 292, y], [x0 + 306, y]]),
        text(x0 + 310, y + 5, out, { anchor: 'start', cls: accent ? 'k-name-accent' : 'k-name' }),
        sub ? text(x0 + 260, y + 38, sub, { cls: 'k-tick' }) : '');
      return g({},
        text(x0 + 170, y0, `two samples of ${s}`, { cls: 'k-name' }),
        row(y0 + 70, 'add first, then T', [s, s], 'add', [fmt(2 * s, 1)], 'T', out1, !ok, note),
        row(y0 + 170, 'T first, then add', [s, s], 'T', [fmt(4 * s, 1), fmt(4 * s, 1)], 'add', out2, false),
        ok ? check(x0 + 60, y0 + 232) : cross(x0 + 60, y0 + 232),
        text(x0 + 74, y0 + 236, ok ? 'both paths give 0.80: match' : '1.00 against 1.60: no match', { anchor: 'start', cls: 'k-label' }));
    };
    const foot = text(L.W / 2, L.H - 10, 'T is the booster: × 4, then clip to the range', { cls: 'k-tick' });
    if (L.phone) return [col(10, 30, 0.1, '0.80', '', '0.80', true), line(20, 290, 340, 290, { cls: 'k-grid' }), col(10, 320, 0.2, '1.00', '× 4 is 1.6, cut to 1.00', '1.60', false), foot];
    return [col(8, 30, 0.1, '0.80', '', '0.80', true), line(356, 20, 356, 280, { cls: 'k-grid' }), col(364, 30, 0.2, '1.00', '× 4 is 1.6, cut to 1.00', '1.60', false), foot];
  };

  const timeInvariance = (L) => {
    const blip = [0.1, 0.2, 0.1];
    const rows = L.phone ? [[2, 'blip centred on n = 2', 'out, centred on 2'], [5, 'same blip, 3 later', 'out, 3 later']] : [[2, 'a blip centred on n = 2', 'out, centred on n = 2'], [5, 'the same blip, 3 samples later', 'out, 3 samples later, same shape']];
    return rows.map(([at, inLabel, outLabel], r) => {
      const y = (L.phone ? 50 : 56) + r * (L.phone ? 170 : 150);
      const [A, B] = L.phone
        ? [plot({ x: 16, y, w: 146, h: 80, xs: [-0.5, 8.5], ys: [0, 0.25] }), plot({ x: 200, y, w: 146, h: 80, xs: [-0.5, 8.5], ys: [0, 1] })]
        : [plot({ x: 40, y, w: 250, h: 80, xs: [-0.5, 8.5], ys: [0, 0.25] }), plot({ x: 450, y, w: 250, h: 80, xs: [-0.5, 8.5], ys: [0, 1] })];
      const cy = y + 50, ticks = [[0, '0'], [2, '2'], [5, '5'], [8, '8']];
      const shift = P => r ? g({},
        line(P.X(2), P.y0 + 4, P.X(2), P.y1, { cls: 'k-guide' }),
        arrow(L.slug, [[P.X(2), P.y1 + 32], [P.X(5) - 2, P.y1 + 32]], { tone: 'input' }),
        text(P.X(5) + 8, P.y1 + 36, '+3', { anchor: 'start', cls: 'k-num-input' })) : '';
      return g({},
        L.phone ? g({}, arrow(L.slug, [[164, cy], [196, cy]]), text(180, cy - 10, '× 4', { cls: 'k-num' }))
          : g({}, arrow(L.slug, [[294, cy], [326, cy]]), arrow(L.slug, [[414, cy], [446, cy]]), box(330, cy - 28, 80, 56, { name: 'booster', sub: '× 4' })),
        axes(A, { xTicks: ticks }), axes(B, { xTicks: ticks }),
        stems(A, blip.map((v, i) => [at - 1 + i, v]), { labels: (v, n) => (!L.phone || n === at ? fmt(v) : '') }),
        stems(B, blip.map((v, i) => [at - 1 + i, 4 * v]), { labels: (v, n) => (!L.phone || n === at ? fmt(v) : '') }),
        text(A.x0, y - 12, inLabel, { anchor: 'start', cls: 'k-label', style: L.phone ? 'font-size:10px' : undefined }),
        text(B.x0, y - 12, outLabel, { anchor: 'start', cls: 'k-label', style: L.phone ? 'font-size:10px' : undefined }),
        shift(A), shift(B));
    });
  };

  const speakerphone = (L) => {
    const ys = [-1.8, 1.8], n8 = ns(0, 7), a = tone(1000, 0.8), b = tone(500, 0.8), sum = n => a(n) + b(n);
    const [A, B, S] = L.phone
      ? [plot({ x: 40, y: 40, w: 290, h: 100, xs: [-0.5, 7.5], ys }), plot({ x: 40, y: 200, w: 290, h: 100, xs: [-0.5, 7.5], ys }), plot({ x: 40, y: 400, w: 290, h: 120, xs: [-0.5, 7.5], ys })]
      : [plot({ x: 60, y: 44, w: 240, h: 110, xs: [-0.5, 7.5], ys }), plot({ x: 60, y: 214, w: 240, h: 110, xs: [-0.5, 7.5], ys }), plot({ x: 440, y: 129, w: 250, h: 110, xs: [-0.5, 7.5], ys })];
    const join = L.phone
      ? g({}, arrow(L.slug, [[185, 326], [185, S.y0 - 40]]), text(200, 348, '+', { anchor: 'start', cls: 'k-name', style: 'font-size:22px' }))
      : g({}, path(`M${A.x1 + 6} ${A.Y(0)}H360V${S.Y(0)}`, { cls: 'k-arrow' }), path(`M${B.x1 + 6} ${B.Y(0)}H360V${S.Y(0)}`, { cls: 'k-arrow' }),
        arrow(L.slug, [[360, S.Y(0)], [S.x0 - 6, S.Y(0)]]), text(372, S.Y(0) - 10, '+', { anchor: 'start', cls: 'k-name', style: 'font-size:22px' }));
    return [
      [A, B, S].map(P => g({}, band(P, -1, 1), axes(P, { yTicks: pm, xTicks: [[0, 'n = 0'], [7, '7']] }))),
      step(1, 'each quiet voice, 0.2, boosted by 4, stays inside the range',
        stems(A, pts(a, n8)), stems(B, pts(b, n8)),
        text(A.x0, A.y0 - 12, '1,000 Hz voice, 0.2 × 4', { anchor: 'start', cls: 'k-label' }), check(A.x1 - 6, A.y0 - 16),
        text(B.x0, B.y0 - 12, '500 Hz voice, 0.2 × 4', { anchor: 'start', cls: 'k-label' }), check(B.x1 - 6, B.y0 - 16)),
      step(2, 'the two are added', g({ anim: { k: 'in', d: 1, len: 0.8 } }, join)),
      step(3, 'linearity predicts 1.60 and 1.31 at n = 0 and 1',
        g({ anim: { k: 'in', d: 2 } }, stems(S, pts(sum, n8).filter(([, v]) => Math.abs(v) > 1), { cls: 'k-stem-soft' }),
          text(S.X(0) - 8, S.Y(1.6) + 4, '1.60', { anchor: 'end', cls: 'k-label' }), text(S.X(1) + 10, S.Y(1.305) - 4, '1.31', { anchor: 'start', cls: 'k-label' }))),
      step(4, 'the booster on the sum cuts it flat to 1.00 at n = 0 and 1',
        g({ anim: { k: 'in', d: 3 } }, clipStems(S, sum, n8),
          text(S.x0, S.y0 - (L.phone ? 22 : 30), 'the two voices added, then × 4', { anchor: 'start', cls: 'k-label' }), cross(S.x1 - 6, S.y0 - (L.phone ? 26 : 34)),
          text(S.X(3.4), S.Y(1.5), 'cut to 1.00', { anchor: 'start', cls: 'k-note-accent' }))),
    ];
  };

  const smoother = (L) => {
    const P = plot({ x: L.phone ? 34 : 60, y: 56, w: L.W - (L.phone ? 46 : 100), h: L.phone ? 180 : 200, xs: [-0.7, 9.1], ys: [-1.15, 1.2] });
    const x = t => cosd(45 * t), y = t => 0.9239 * cosd(45 * t - 22.5);
    const items = [['stem-soft', 'the 1,000 Hz tone in'], ['stem', 'average with the one before'], ['ring', 'n = 0 needs input[−1]']];
    return [
      axes(P, { yTicks: pm, xTicks: ns(0, 8).map(n => [n, String(n)]) }),
      curve(P, x, { cls: 'k-curve-soft' }), stems(P, pts(x, ns(0, 8)), { cls: 'k-stem-soft', dot: 4 }),
      curve(P, y), stems(P, pts(y, ns(1, 8)), { dot: 5 }),
      circle(P.X(0), P.Y(0.854), 6, { cls: 'k-ring-missing' }),
      line(P.X(8), P.y0 - 16, P.X(8), P.Y(0), { cls: 'k-guide' }), line(P.X(8.5), P.y0 - 16, P.X(8.5), P.Y(0), { cls: 'k-guide' }),
      L.phone ? '' : text(P.X(8) - 6, P.Y(1) - 8, 'in 1.00', { anchor: 'end', cls: 'k-num' }),
      circle(P.X(8.5), P.Y(0.924), 5, { cls: 'k-stem-accent-dot' }),
      L.phone ? text(L.W / 2, 280, 'peaks: in 1.00, out 0.92', { cls: 'k-num' }) : text(P.X(8.5) + 8, P.Y(0.924) - 10, 'out 0.92', { anchor: 'start', cls: 'k-num-accent' }),
      arrow(L.slug, [[P.X(8), P.y0 - 12], [P.X(8.5) - 2, P.y0 - 12]], { tone: 'accent' }),
      text(P.X(8) - 8, P.y0 - 8, 'half a sample later', { anchor: 'end', cls: 'k-note-accent' }),
      L.phone ? legend(L.slug, 30, 306, items, { cols: 1, dy: 22 }) : legend(L.slug, 30, 310, items, { dx: 250 }),
    ];
  };

  const fader = (L) => {
    const ramp = n => Math.min(n / 8, 1), x = tone(1000), n16 = ns(0, 15), t16 = [[0, '0'], [8, '8'], [15, '15']];
    const mini = (x0, y0, ys) => plot({ x: x0, y: y0, w: L.phone ? 290 : 180, h: L.phone ? 60 : 80, xs: [-0.5, 15.5], ys });
    const [R, T, O] = L.phone ? [mini(50, 40, [0, 1.15]), mini(50, 158, [-1.15, 1.15]), mini(50, 276, [-1.15, 1.15])]
      : [mini(50, 50, [0, 1.15]), mini(280, 50, [-1.15, 1.15]), mini(510, 50, [-1.15, 1.15])];
    const blipRow = (y, at, out, label, outLabel) => {
      const [A, B] = L.phone ? [plot({ x: 20, y, w: 140, h: 56, xs: [-0.5, 15.5], ys: [0, 1.45] }), plot({ x: 210, y, w: 140, h: 56, xs: [-0.5, 15.5], ys: [0, 1.45] })]
        : [plot({ x: 40, y, w: 240, h: 60, xs: [-0.5, 15.5], ys: [0, 1.45] }), plot({ x: 460, y, w: 240, h: 60, xs: [-0.5, 15.5], ys: [0, 1.45] })];
      const cy = y + 34;
      return g({},
        L.phone ? g({}, arrow(L.slug, [[164, cy], [204, cy]]), text(184, cy - 10, 'fader', { cls: 'k-tick' }))
          : g({}, arrow(L.slug, [[284, cy], [318, cy]]), arrow(L.slug, [[402, cy], [456, cy]]), box(322, cy - 22, 76, 44, { name: 'fader' })),
        axes(A, { xTicks: t16 }), axes(B, { xTicks: t16 }),
        stems(A, [[at, 1]], { labels: v => fmt(v) }), stems(B, [[at, out]], { labels: v => fmt(v), cls: out < 1 ? 'k-stem' : 'k-stem-accent' }),
        text(A.x0, y - 12, label, { anchor: 'start', cls: 'k-label' }), text(B.x0, y - 12, outLabel, { anchor: 'start', cls: 'k-label' }));
    };
    const top = L.phone ? 410 : 226, gap = L.phone ? 110 : 120;
    return [
      text(R.x0, R.y0 - 12, 'the ramp: n ÷ 8, up to 1', { anchor: 'start', cls: 'k-label' }),
      text(T.x0, T.y0 - 12, 'times the 1,000 Hz tone', { anchor: 'start', cls: 'k-label' }),
      text(O.x0, O.y0 - 12, 'equals the fader’s output', { anchor: 'start', cls: 'k-label' }),
      axes(R, { xTicks: t16, yTicks: [[1, '1']] }), stems(R, pts(ramp, n16), { dot: 3, cls: 'k-stem-input' }),
      axes(T, { xTicks: t16, yTicks: pm }), stems(T, pts(x, n16), { dot: 3 }),
      axes(O, { xTicks: t16, yTicks: pm }), stems(O, pts(n => ramp(n) * x(n), n16), { dot: 3 }),
      L.phone ? '' : g({}, text(255, 100, '×', { cls: 'k-name', style: 'font-size:24px' }), text(485, 100, '=', { cls: 'k-name', style: 'font-size:24px' })),
      line(20, top - 44, L.W - 20, top - 44, { cls: 'k-grid' }),
      blipRow(top, 2, 0.25, 'a blip at n = 2', L.phone ? 'out 0.25' : 'comes out 0.25'),
      blipRow(top + gap, 10, 1, L.phone ? 'same blip at n = 10' : 'the same blip at n = 10', L.phone ? 'out 1.00, bigger' : 'comes out 1.00, bigger'),
      text(L.W / 2, L.H - 12, L.phone ? 'later in, different out: not time-invariant' : 'same input, later, different output: not time-invariant', { cls: 'k-note-accent' }),
    ];
  };

  const constant = (L) => {
    const ys = [-1.15, 1.25];
    const [A, B] = L.phone
      ? [plot({ x: 40, y: 44, w: 300, h: 200, xs: [-0.5, 8.5], ys }), plot({ x: 40, y: 310, w: 300, h: 200, xs: [-0.5, 8.5], ys })]
      : [plot({ x: 50, y: 50, w: 270, h: 240, xs: [-0.5, 8.5], ys }), plot({ x: 400, y: 50, w: 270, h: 240, xs: [-0.5, 8.5], ys })];
    const x = tone(1000), lifted = n => x(n) + 0.1, lab = (v, n) => (n <= 3 ? fmt(v) : '');
    const bracket = n => g({}, line(B.X(n) + 9, B.Y(0), B.X(n) + 9, B.Y(0.1), { cls: 'k-stem-accent' }),
      line(B.X(n) + 6, B.Y(0), B.X(n) + 12, B.Y(0), { cls: 'k-stem-accent' }), line(B.X(n) + 6, B.Y(0.1), B.X(n) + 12, B.Y(0.1), { cls: 'k-stem-accent' }));
    return [
      text(A.x0, A.y0 - 16, 'the 1,000 Hz tone', { anchor: 'start', cls: 'k-name' }), text(B.x0, B.y0 - 16, 'add 0.1 to every sample', { anchor: 'start', cls: 'k-name' }),
      axes(A, { yTicks: pm, xTicks: ns(0, 8).map(n => [n, String(n)]) }),
      axes(B, { yTicks: pm, xTicks: ns(0, 8).map(n => [n, String(n)]) }),
      stems(A, pts(x, ns(0, 8)), { labels: lab }),
      line(B.x0, B.Y(0.1), B.x1, B.Y(0.1), { cls: 'k-edge', style: 'stroke:var(--accent)' }),
      stems(B, pts(lifted, ns(0, 8)), { labels: lab }),
      bracket(6),
      text(B.X(6) + 6, B.Y(0) + 20, '+0.10', { anchor: 'start', cls: 'k-num-accent' }),
      text(B.X(4), B.y1 + 44, 'dashed: the new centre line, 0.10 up', { cls: 'k-note-accent' }),
      text(B.X(4), B.y1 + 66, 'that lift is a 0 Hz tone nobody said', { cls: 'k-note-accent' }),
    ];
  };

  const proof = (L) => {
    const y = n => 0.9239 * cosd(45 * n - 22.5), x = tone(1000);
    const rowsX = [['x[n+1], one sample earlier', n => x(n + 1)], ['x[n−1], one sample later', n => x(n - 1)], ['−1.414 × x[n]', n => -1.414 * x(n)]];
    const rowsY = [['y[n+1]', n => y(n + 1)], ['y[n−1]', n => y(n - 1)], ['−1.414 × y[n]', n => -1.414 * y(n)]];
    const ph = L.phone;
    const lx = ph ? 30 : 60, rx = ph ? 220 : 470, pw = ph ? 116 : 190, tx = ph ? 156 : 330, tw = ph ? 50 : 60;
    const mini = (x0, y0) => plot({ x: x0, y: y0, w: pw, h: 48, xs: [-0.5, 7.5], ys: [-1.5, 1.5] });
    const tops = [64, 144, 224];
    const plus = (x0, t) => text(x0 - 14, t + 30, '+', { cls: 'k-name', style: 'font-size:18px' });
    return [
      text(lx + pw / 2, 26, ph ? 'tone copies' : 'three copies of the tone', { cls: 'k-name' }), text(rx + pw / 2, 26, ph ? 'what T gives' : 'what T gives back', { cls: 'k-name' }),
      tops.map((t, i) => {
        const Lp = mini(lx, t), R = mini(rx, t), cy = t + 24;
        return g({},
          arrow(L.slug, [[lx + pw + 4, cy], [tx - 4, cy]]), arrow(L.slug, [[tx + tw + 2, cy], [rx - 4, cy]]),
          axes(Lp, { xTicks: [] }), stems(Lp, pts(rowsX[i][1], ns(0, 7)), { dot: 3 }),
          axes(R, { xTicks: [] }), stems(R, pts(rowsY[i][1], ns(0, 7)), { dot: 3 }),
          text(Lp.x0, t - 4, rowsX[i][0], { anchor: 'start', cls: 'k-tick', style: ph ? 'font-size:9px' : undefined }),
          text(R.x0, t - 4, rowsY[i][0], { anchor: 'start', cls: 'k-tick', style: ph ? 'font-size:9px' : undefined }),
          i ? plus(lx, t) : '', i ? text(rx + pw + 12, t + 30, '+', { cls: 'k-name', style: 'font-size:18px' }) : '',
          box(tx, cy - 20, tw, 40, { name: 'T' }));
      }),
      line(lx, 286, lx + pw, 286, { cls: 'k-line' }), line(rx, 286, rx + pw, 286, { cls: 'k-line' }),
      (() => {
        const Lp = mini(lx, 300), R = mini(rx, 300), cy = 324;
        return g({},
          arrow(L.slug, [[lx + pw + 4, cy], [tx - 4, cy]], { tone: 'accent' }), arrow(L.slug, [[tx + tw + 2, cy], [rx - 4, cy]], { tone: 'accent' }),
          axes(Lp, { xTicks: [] }), stems(Lp, pts(() => 0, ns(0, 7)), { dot: 3 }),
          axes(R, { xTicks: [] }), stems(R, pts(() => 0, ns(0, 7)), { dot: 3 }),
          text(Lp.x0, 370, 'sum: 0 at every n', { anchor: 'start', cls: 'k-tick' }), text(R.x0, 370, 'sum: 0 at every n', { anchor: 'start', cls: 'k-tick' }),
          box(tx, cy - 20, tw, 40, { name: 'T', cls: 'k-box-accent' }));
      })(),
      ph ? g({},
        text(20, 404, 'rows: time-invariance (the fader breaks it)', { anchor: 'start', cls: 'k-tick' }),
        text(20, 422, 'sum: linearity (the booster breaks it)', { anchor: 'start', cls: 'k-tick' }),
        text(180, 456, 'so y[n+1] + y[n−1] = 1.414 y[n]', { cls: 'k-name' }),
        text(180, 478, 'the same neighbor rule: the same tone', { cls: 'k-note' }))
        : g({},
          text(330, 404, 'each row through T: time-invariance. The fader breaks this step.', { cls: 'k-note' }),
          text(330, 428, 'the sum through T, silence to silence: linearity. The booster breaks this step.', { cls: 'k-note' }),
          text(360, 466, 'so y[n+1] + y[n−1] = 1.414 y[n]: the same neighbor rule, so the same 1,000 Hz tone', { cls: 'k-name' })),
    ];
  };

  const chain = (L) => {
    const P = plot({ x: L.phone ? 20 : 60, y: 70, w: L.W - (L.phone ? 32 : 80), h: 190, xs: [0.5, 8.5], ys: [-1.15, 1.15] });
    const y = n => 0.9239 * cosd(45 * n - 22.5);
    const lab = n => text(P.X(n), y(n) >= 0 ? P.Y(y(n)) - 12 : P.Y(y(n)) + 22, fmt(y(n), 3), { cls: n <= 2 ? 'k-num-input' : (L.phone ? 'k-tick' : 'k-num'), style: L.phone ? 'font-size:9.5px' : undefined, ...(L.phone && (n === 4 || n === 5) ? { x: P.X(n) + (n === 4 ? -6 : 6), anchor: n === 4 ? 'end' : 'start', y: P.Y(y(n)) + 4 } : {}) });
    const link = (n, cls) => g({ cls }, [n - 1, n - 2].map(p => line(P.X(p), P.Y(y(p)), P.X(n), P.Y(y(n)), { cls: 'k-arrow k-accent' })));
    const groups = [[3, 4], [5, 6], [7, 8]];
    return [
      axes(P, { xTicks: ns(1, 8).map(n => [n, n === 1 ? 'n = 1' : String(n)]) }),
      text(L.W / 2, 30, L.phone ? 'new dot = 1.414 × latest − one before' : 'each new dot = 1.414 × the latest − the one before', { cls: 'k-note' }),
      step(1, 'two seed dots, 0.854 and 0.354',
        stems(P, [[1, y(1)], [2, y(2)]], { cls: 'k-stem-input', dot: 6 }), lab(1), lab(2),
        text(P.X(1.5), P.Y(1.08) - 12, 'the two seeds', { cls: 'k-label' })),
      groups.map((grp, i) => step(i + 2, `built from the two before: ${grp.map(n => fmt(y(n), 3)).join(', ')}`,
        grp.map((n, j) => {
          const d = 1 + (2 * i + j) * 0.8;
          return g({},
            g({ cls: n === 3 ? '' : 'k-ghost', 'aria-hidden': 'true', anim: { k: n === 3 ? 'in' : 'flash', d, len: n === 3 ? 0.6 : 0.9 } }, link(n)),
            g({ anim: { k: 'in', d: d + 0.3, len: 0.5 } }, stems(P, [[n, y(n)]], { dot: 5 }), lab(n)));
        }))),
      line(P.X(3), P.Y(y(3)) + 28, P.X(3), P.y1 + 4, { cls: 'k-guide' }), line(P.X(3), P.y1 + 24, P.X(3), P.y1 + 34, { cls: 'k-guide' }),
      text(L.phone ? L.W / 2 : P.X(3) - 6, P.y1 + 46, '1.414 × 0.354 − 0.854 = −0.354', { anchor: L.phone ? 'middle' : 'start', cls: 'k-tick' }),
    ];
  };

  const sizeStart = (L) => {
    const P = plot({ x: L.phone ? 36 : 60, y: 50, w: L.phone ? 310 : 440, h: 210, xs: [-0.3, 8.3], ys: [-1.1, 1.1] });
    const wave = (A, phi) => t => A * cosd(45 * t + phi);
    const frames = [[0.4, 0], [0.6, -6], [0.75, -12], [0.86, -18]];
    const rx = L.phone ? 40 : 560, ry = L.phone ? 320 : 100, gapY = L.phone ? 0 : 90, gapX = L.phone ? 160 : 0;
    const readout = (A, phi) => g({},
      text(rx, ry, 'size', { anchor: 'start', cls: 'k-label' }), text(rx, ry + 26, A.toFixed(3), { anchor: 'start', cls: 'k-name' }),
      text(rx + gapX, ry + gapY, 'start angle', { anchor: 'start', cls: 'k-label' }), text(rx + gapX, ry + gapY + 26, `${fmt(phi, phi % 1 ? 1 : 0)}°`, { anchor: 'start', cls: 'k-name' }));
    return [
      axes(P, { yTicks: pm, xTicks: ns(0, 8).map(n => [n, n ? String(n) : 'n = 0']) }),
      step(1, 'two given dots: 0.854 at n = 1 and 0.354 at n = 2',
        circle(P.X(1), P.Y(0.854), 6, { cls: 'k-stem-dot' }), circle(P.X(2), P.Y(0.354), 6, { cls: 'k-stem-dot' }),
        text(P.X(1) + 10, P.Y(0.854) - 12, '0.854 at n = 1', { anchor: 'start', cls: 'k-num' }),
        text(P.X(2) + 10, P.Y(0.354) - 12, '0.354 at n = 2', { anchor: 'start', cls: 'k-num' })),
      step(2, 'size and start change together until the wave passes through both dots: 0.924 and −22.5 degrees',
        frames.map(([A, phi], i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.6 + i * 0.8, len: 0.9 } }, curve(P, wave(A, phi), { cls: 'k-curve-input' }), readout(A, phi))),
        g({ anim: { k: 'in', d: 3.8, len: 0.6 } }, curve(P, wave(0.924, -22.5), { cls: 'k-curve-input' }), readout(0.924, -22.5))),
      text(L.phone ? L.W / 2 : P.X(4), L.phone ? 410 : 300, '0.924 × cos(45° × n − 22.5°)', { cls: 'k-num-input' }),
    ];
  };

  const buzzBars = (L) => {
    const chart = (y0, title, data) => {
      const P = plot({ x: L.phone ? 26 : 80, y: y0, w: L.phone ? 296 : 600, h: 90, xs: [0, 4000], ys: [0, 1.5] });
      return g({},
        text(P.x0, y0 - 26, title, { anchor: 'start', cls: L.phone ? 'k-label' : 'k-name' }),
        axes(P, { xTicks: L.phone ? [[0, '0'], [2000, '2,000 Hz'], [4000, '4,000']] : [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000 Hz']], zero: false }),
        bars(P, data.map(([f, v, label, fresh]) => ({ x: f, v, label, cls: fresh ? 'k-bar-hatch' : 'k-bar', fill: fresh ? `url(#${L.slug}-hatch)` : undefined })), { width: L.phone ? 14 : 18, labelCls: L.phone ? 'k-tick' : 'k-num' }));
    };
    const s = L.phone ? 172 : 156;
    return [
      chart(56, L.phone ? 'before the booster: 500 Hz at 0.5' : 'before the booster: the 500 Hz voice, size 0.5, one tone', [[500, 0.5, '0.50']]),
      chart(56 + s, L.phone ? '500 Hz at 0.5, × 4, clipped' : 'the 500 Hz voice, size 0.5, × 4 and clipped', [[500, 1.212, '1.212'], [1500, 0.266, '0.266', 1], [2500, 0.059, '0.059', 1], [3500, 0.005, '', 1]]),
      chart(56 + 2 * s, L.phone ? '1,000 + 1,500 Hz, × 4, clipped' : '1,000 Hz and 1,500 Hz, 0.25 each, × 4 and clipped', [[500, 0.085, '0.085', 1], [1000, 0.748, '0.748'], [1500, 0.721, '0.721'], [2000, 0.125, '0.125', 1], [2500, 0.029, '', 1], [3500, 0.165, '0.165', 1], [4000, 0.130, '0.130', 1]]),
      L.phone ? legend(L.slug, 30, 556, [['bar', 'a tone the caller said'], ['hatch', 'made by clipping']], { cols: 1, dy: 22 })
        : legend(L.slug, 140, 512, [['bar', 'a tone the caller said'], ['hatch', 'a new tone, made by clipping']], { dx: 260 }),
      text(L.W / 2, L.H - 8, 'bars smaller than 0.05 are left without a number', { cls: 'k-tick' }),
    ];
  };

  const tangled = (L) => {
    const pw = L.phone ? 130 : 240;
    const panel = (x0, label) => {
      const P = plot({ x: x0, y: 40, w: pw, h: 130, xs: [0, 4000], ys: [0, 0.32] });
      return g({},
        axes(P, { xTicks: [[0, '0'], [1500, '1,500 Hz'], [4000, L.phone ? '' : '4,000']], zero: false }),
        rect(P.X(1500) - 12, P.Y(0.266), 24, P.Y(0) - P.Y(0.266), { cls: 'k-bar' }),
        text(P.X(2000), 214, label, { cls: L.phone ? 'k-label' : 'k-name' }));
    };
    const mid = L.W / 2;
    return [
      panel(L.phone ? 20 : 60, 'said by the caller'),
      text(mid, 122, '=', { cls: 'k-name', style: 'font-size:40px;font-weight:500' }),
      panel(L.phone ? 210 : 420, 'made by clipping'),
      text(mid, 254, L.phone ? 'in the samples there is no hatching' : 'in the samples there is no hatching: nothing tells them apart', { cls: 'k-note' }),
    ];
  };

  const fix = (L) => {
    const cols = [[L.phone ? 'loud 0.5' : 'loud caller, 0.5', tone(1000, 0.5)], [L.phone ? 'quiet 0.2' : 'quiet caller, 0.2', tone(1000, 0.2)], [L.phone ? 'pair 0.4' : 'speakerphone pair, 0.4', n => tone(1000, 0.2)(n) + tone(500, 0.2)(n)]];
    const rows = [[4, '× 4'], [2, '× 2'], [1.6, '× 1.6']];
    const peaks = { 4: [['2.00', 'clipped'], ['0.80', ''], ['1.60', 'clipped']], 2: [['1.00', 'no margin'], ['0.40', ''], ['0.80', '']], 1.6: [['0.80', ''], ['0.32', ''], ['0.64', '']] };
    const ph = L.phone, cw = ph ? 96 : 180, gx = ph ? 106 : 205, x0 = ph ? 34 : 110, rh = 160;
    const out = [];
    rows.forEach(([gain, name], r) => {
      const y0 = 58 + r * rh, good = gain === 1.6;
      if (good) out.push(rect(6, y0 - 14, L.W - 12, rh - 6, { cls: 'k-row-tint', rx: 6 }));
      out.push(ph ? text(L.W - 8, y0 - 2, name, { anchor: 'end', cls: 'k-name' }) : text(20, y0 + 64, name, { anchor: 'start', cls: 'k-name' }));
      cols.forEach(([, fn], c) => {
        const P = plot({ x: x0 + c * gx, y: y0, w: cw, h: 100, xs: [-0.5, 7.5], ys: [-2.1, 2.1] });
        const peak = Math.max(...ns(0, 7).map(n => gain * fn(n)));
        const bad = peak > 1 + 1e-9 || Math.abs(peak - 1) < 1e-9;
        const [value, why] = peaks[gain][c];
        out.push(g({ cls: good ? '' : 'k-muted' },
          band(P, -1, 1),
          good && c === 0 ? g({}, line(P.x0, P.Y(0.8), P.x1, P.Y(0.8), { cls: 'k-guide' }),
            line(P.x1 + 4, P.Y(1), P.x1 + 4, P.Y(0.8), { cls: 'k-stem-accent' }), line(P.x1 + 1, P.Y(1), P.x1 + 7, P.Y(1), { cls: 'k-stem-accent' }), line(P.x1 + 1, P.Y(0.8), P.x1 + 7, P.Y(0.8), { cls: 'k-stem-accent' }),
            text(P.x0, P.y0 - 4, 'headroom: 0.8 to 1', { anchor: 'start', cls: 'k-num-accent', style: ph ? 'font-size:9px' : undefined })) : '',
          axes(P, { yTicks: c === 0 ? pm : [], xTicks: [] }),
          clipStems(P, n => gain * fn(n), ns(0, 7), { dot: ph ? 2.5 : 3.5 }),
          bad ? cross(P.x0 + 8, y0 + 122) : check(P.x0 + 8, y0 + 122),
          text(P.x0 + 22, y0 + 126, ph ? value : `peak ${value}${why ? `, ${why}` : ''}`, { anchor: 'start', cls: bad ? 'k-num-accent' : 'k-num' }),
          ph && why ? text(P.x0 + 22, y0 + 142, why, { anchor: 'start', cls: 'k-tick' }) : ''));
      });
    });
    return [cols.map(([name], c) => text(x0 + c * gx + cw / 2, 32, name, { cls: ph ? 'k-label' : 'k-name' })), out];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, eyebrow: 'Lesson 1 · signals and systems', body: (kk, L) => body(L) });

  return [
    fig('samples', [300, 300], 'A call is a list of samples',
      'A smooth voltage is measured every 1/8,000 of a second; the curve fades and only the dots remain, each a sample x[n] with its value, and the wave they came from is shown dashed between them.',
      'The line measures the voltage 8,000 times a second and keeps only those dots. The dashed curve is the wave they came from, which carries on between them.', samples, 4),
    fig('tone-steps', [320, 520], 'A tone, one 45° step at a time',
      `The angle steps 45 degrees per sample, and the cosine at each angle drops onto a stem: 1.00, 0.71, 0.00, ${M}0.71, ${M}1.00, ${M}0.71, 0.00, 0.71, 1.00.`,
      'A 1,000 Hz tone: the angle steps 360° × 1,000 ÷ 8,000 = 45° per sample, and the cosine of each angle is one sample.', toneSteps, 4),
    fig('system', [244, 460], 'A system: a signal in, a signal out',
      'A signal x[n] goes into a box T and a signal y[n] comes out, y[n] = T{x[n]}; T could be times 4, average with the one before, or wait 2,000 samples.',
      'A system is any rule that takes in one signal and gives back another.', system),
    fig('clip', [340, 560], 'The booster clips the loud caller',
      `Both 1,000 Hz callers grow by 4 inside the range from ${M}1 to +1; the quiet one stays inside at 0.80, the loud one reaches 2.00 and every sample past the edge is cut back to it.`,
      'Both callers boosted by 4. The shaded band is all the chip can store; the loud caller’s stems cross its edge and are pushed back onto it.', clipFig, 3),
    fig('neighbor-rule', [316, 610], 'The neighbor rule at n = 1',
      'For the clean tone the two neighbors add to 1.00, equal to 1.414 times the middle sample; for the clipped list they add to 1.00, against 1.414: no match.',
      'Add the two neighbors and compare with 1.414 times the middle. The clean tone matches; the clipped list does not.', neighbor),
    fig('two-tones', [330, 380], 'The clipped list is two tones',
      `A 1,000 Hz wave of size 1.207 minus a 3,000 Hz wave of size 0.207 lands exactly on the clipped samples 1, 1, 0, ${M}1, ${M}1, ${M}1, 0, 1; the 3,000 Hz wave is the buzz.`,
      'Big 1,000 Hz wave minus small 3,000 Hz wave: the result passes through every flat clipped stem. The small wave is the buzz.', twoTones, 4),
    fig('superposition', [310, 590], 'Superposition, run as two paths',
      'With two samples of 0.1, adding then the booster and the booster then adding both give 0.80; with two samples of 0.2, adding first gives 1.00 while the booster first gives 1.60.',
      'Add first and then the system, against the system first and then add. A linear system gives the same answer both ways.', superposition),
    fig('time-invariance', [350, 400], 'Time-invariance: later in, later out',
      'A blip into the booster comes out four times bigger; the same blip three samples later comes out three samples later with the same shape.',
      'The booster does the same thing at every moment: shift the blip three samples and its output shifts three samples, nothing else. The input (0.2 at its top) and the output (0.8) are drawn the same height, so their shapes can be compared.', timeInvariance),
    fig('speakerphone', [360, 540], 'Two clean voices, one clipped sum',
      'Two quiet voices of 0.2 at 1,000 Hz and 500 Hz each stay inside the range after the booster, but added together they reach 1.60 and are cut flat to 1.00 at n = 0 and 1.',
      'Each boosted voice fits in the band on its own. Added together, they poke out and are cut flat. Testing one caller at a time never shows it.', speakerphone, 4),
    fig('smoother', [330, 380], 'The smoother keeps the tone a tone',
      `The average of each sample with the one before is the same 1,000 Hz wave, smaller (0.92 against 1.00) and half a sample later; the n = 0 output needs input[${M}1].`,
      'Draw the smooth wave through the smoother’s dots: the same tone, a bit smaller and half a sample late.', smoother),
    fig('fader', [470, 660], 'The fader is not time-invariant',
      'The fader multiplies the tone by a ramp from 0 to 1 over 8 samples; a blip at n = 2 comes out 0.25 and the same blip at n = 10 comes out 1.00.',
      'The fader multiplies each sample by a ramp, so when an input arrives changes what comes out.', fader),
    fig('constant', [370, 600], 'Adding 0.1 adds a 0 Hz tone',
      'Adding 0.1 to every sample of the 1,000 Hz tone lifts the whole wave 0.10 off the zero line; that lift is a constant, a 0 Hz tone nobody said.',
      'Add 0.1 to every sample and the centre line moves up. That constant is a 0 Hz tone that was never in the call.', constant),
    fig('proof', [480, 490], 'Why an LTI system keeps the tone',
      'Three copies of the tone, shifted and scaled, add to silence; through T each becomes the same copy of y (time-invariance) and their silent sum becomes the same sum of y, which is silence too (linearity), so y obeys the tone’s neighbor rule.',
      'Read down each column: three copies that add to zero. Time-invariance carries each row through T, linearity carries the sum, so y obeys the same neighbor rule and is the same tone.', proof),
    fig('chain', [320, 320], 'Two numbers fix the whole list',
      `Starting from 0.854 and 0.354, each new dot is 1.414 times the latest minus the one before, giving ${M}0.354, ${M}0.854, ${M}0.854, ${M}0.354, 0.354, 0.854.`,
      'Like falling dominoes: each new dot is built from the two before it, so the two seeds decide the rest. The arrows show the first one built.', chain, 4),
    fig('size-and-start', [320, 430], 'Two knobs hit two dots',
      'A 1,000 Hz wave passes through 0.854 at n = 1 and 0.354 at n = 2 when its size is 0.924 and its start angle is −22.5 degrees.',
      'Change the size and the start until the wave passes through both dots: size 0.924, start −22.5°.', sizeStart, 2),
    fig('buzz-bars', [540, 610], 'Clipping makes new tones',
      'The clean 500 Hz voice is one bar; clipped, it gains bars at 1,500, 2,500 and 3,500 Hz; two tones clipped together gain new bars between and above them, at 500, 2,000, 3,500 and 4,000 Hz.',
      'Tone sizes from 0 to 4,000 Hz. Solid bars were in the call; hatched bars were made by clipping.', buzzBars),
    fig('tangled', [270, 270], 'A made tone looks like a said one',
      'A 1,500 Hz tone said by the caller and a 1,500 Hz tone made by clipping are the same bar; nothing in the samples tells them apart.',
      'Once the buzz is in the samples, it is just another tone. The hatching in the chart above is ours; the samples carry none.', tangled),
    fig('fix', [520, 540], 'Sizing the booster',
      'At times 4 the loud caller and the speakerphone pair cross the edge; at times 2 the loud caller sits exactly on it with no margin; at times 1.6 the loud caller peaks at 0.80, the pair at 0.64 and the quiet caller at 0.32, leaving headroom from 0.8 to 1.',
      'Three settings for the booster, three callers each. Only × 1.6, the shaded row, keeps every caller in the band with room to spare.', fix),
  ];
};
