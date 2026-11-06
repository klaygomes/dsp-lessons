export default k => {
  const { g, line, path, rect, circle, text, plot, axes, band, arrow, check, cross, box, step, attrs, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const FS = 8000;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const r2 = v => Math.round(v * 100) / 100;
  const angle = f => 360 * f / FS;

  const rich = (x, y, s, o = {}) => {
    const { anchor = 'start', cls = 'k-num', size, ...rest } = o;
    const parts = String(s).split(/\^\{([^}]*)\}/);
    const body = parts.map((p, i) => (i % 2 ? `<tspan dy="-5" font-size="0.72em">${esc(p)}</tspan><tspan dy="5">​</tspan>` : esc(p))).join('');
    return `<text ${attrs({ x: r2(x), y: r2(y), 'text-anchor': anchor, cls, style: size ? `font-size:${size}px` : undefined, ...rest })}>${body}</text>`;
  };
  const richWidth = (s, size = 12) => String(s).split(/\^\{([^}]*)\}/).reduce((w, p, i) => w + p.length * size * (i % 2 ? 0.43 : 0.6), 0);

  const xMark = (x, y, o = {}) => {
    const { s = 5, cls = 'k-stem' } = o;
    return path(`M${r2(x - s)} ${r2(y - s)}L${r2(x + s)} ${r2(y + s)}M${r2(x + s)} ${r2(y - s)}L${r2(x - s)} ${r2(y + s)}`, { cls });
  };
  const chipPole = (x, y, accent = false, s = 5.5) => xMark(x, y, { s, cls: accent ? 'k-stem-accent' : 'k-stem' });
  const laptopPole = (x, y, s = 4) => g({}, circle(x, y, s + 4.5, { cls: 'k-guide' }), xMark(x, y, { s, cls: 'k-axis' }));
  const zeroMark = (x, y, r = 5) => g({}, circle(x, y, r, { cls: 'k-mask' }), circle(x, y, r, { cls: 'k-line' }));
  const keyRow = (x, y, items, o = {}) => {
    const { dx = 230, dy = 22, cols = items.length } = o;
    return g({}, items.map(([mark, label], i) => {
      const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
      return g({}, mark(lx + 10, ly - 4), text(lx + 26, ly, label, { anchor: 'start', cls: 'k-label' }));
    }));
  };
  const keyLaptop = (x, y) => laptopPole(x, y, 3.5);
  const keyChip = (x, y) => chipPole(x, y, false, 5);
  const keyZero = (x, y) => zeroMark(x, y, 5);

  const polymul = (a, b) => { const out = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; })); return out; };
  const notch = (f, r) => { const c = cosd(angle(f)), a = [1, -2 * r * c, r * r], b = [1, -2 * c, 1], kk = (a[0] + a[1] + a[2]) / (b[0] + b[1] + b[2]); return [b.map(v => kk * v), a]; };
  const multiplied = (fs, r) => fs.reduce(([B, A], f) => { const [b, a] = notch(f, r); return [polymul(B, b), polymul(A, a)]; }, [[1], [1]]);
  const gain = (B, A, f) => {
    const w = 2 * Math.PI * f / FS;
    const ev = c => c.reduce(([re, im], v, n) => [re + v * Math.cos(w * n), im - v * Math.sin(w * n)], [0, 0]);
    const [br, bi] = ev(B), [ar, ai] = ev(A);
    return Math.hypot(br, bi) / Math.hypot(ar, ai);
  };
  const run = (B, A, x, clip = false) => {
    const y = [];
    x.forEach((_, n) => {
      let v = 0;
      B.forEach((b, i) => { if (n - i >= 0) v += b * x[n - i]; });
      A.forEach((a, i) => { if (i && n - i >= 0) v -= a * y[n - i]; });
      y.push(clip ? Math.max(-1, Math.min(1, v)) : v);
    });
    return y;
  };
  const WHINES = [1900, 2000, 2100];
  const [LB, LA] = multiplied(WHINES, 0.98);
  const CB = [30, 0, 90, 0, 90, 0, 30].map(v => v / 32), CA = [32, 0, 91, 0, 88, 0, 28].map(v => v / 32);
  const CHIP_POLES = [[1.05668, 1817.4], [0.83776, 2000], [1.05668, 2182.6]];

  const unit = (P, re, im) => [P.X(re), P.Y(im)];
  const polar = (P, r, f) => unit(P, r * cosd(angle(f)), r * sind(angle(f)));
  const arcPath = (P, r, f0, f1, n = 80) => range(0, n).map(i => { const [x, y] = polar(P, r, f0 + (f1 - f0) * i / n); return `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`; }).join('');
  const fullCircle = (cx, cy, R, o = {}) => circle(cx, cy, R, { cls: 'k-wheel', fill: 'none', ...o });
  const trace = (P, ys, o = {}) => path(ys.map((v, n) => `${n ? 'L' : 'M'}${r2(P.X(n))} ${r2(P.Y(v))}`).join(''), { pathLength: 1, ...o });

  const threeNotches = L => {
    const ph = L.phone, xs = ph ? [1700, 2300] : [1500, 2500];
    const P = plot({ x: ph ? 46 : 80, y: 74, w: ph ? 290 : 590, h: 170, xs, ys: [0, 1.1] });
    const ticks = ph ? [[1700, '1,700'], [1900, '1,900'], [2000, '2,000'], [2100, '2,100'], [2300, '2,300']]
      : [[1500, '1,500'], [1700, '1,700'], [1900, '1,900'], [2000, '2,000'], [2100, '2,100'], [2300, '2,300'], [2500, '2,500']];
    const tri = f => path(`M${r2(P.X(f) - 6)} ${P.y0 - 18}L${r2(P.X(f) + 6)} ${P.y0 - 18}L${r2(P.X(f))} ${P.y0 - 8}Z`, { cls: 'k-bar-soft', fill: undefined });
    return [
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: ticks, zero: false, xTitle: 'tone (Hz)', yTitle: ph ? 'passes' : 'how much of each tone passes' }),
      line(P.x0, P.Y(1), P.x1, P.Y(1), { cls: 'k-grid' }),
      k.curve(P, f => gain(LB, LA, f), { n: 600 }),
      WHINES.map(tri),
      text(P.X(2000), P.y0 - 28, ph ? 'the three whine pitches' : 'the whine hops between three pitches', { cls: 'k-label' }),
      ph ? '' : text(P.X(1600), P.Y(1) + 22, 'the voice passes: 99.6% at 1,500 Hz', { cls: 'k-tick' }),
    ];
  };

  const hum = L => {
    const ph = L.phone, N = 241, x = [0.1, ...Array(N - 1).fill(0)];
    const yl = run(LB, LA, x), yc = run(CB, CA, x, true);
    const mk = (y0, ys) => plot({ x: ph ? 40 : 70, y: y0, w: ph ? 300 : 620, h: ph ? 96 : 104, xs: [0, N - 1], ys });
    const [A, B] = [mk(66, [-0.13, 0.13]), mk(250, [-1.3, 1.3])];
    const ticks = ph ? [[0, 'n = 0'], [120, '120'], [240, '240']] : [[0, 'n = 0'], [80, '80'], [160, '160'], [240, '240']];
    const strip = (P, title, lim) => g({},
      lim === 1 ? band(P, -1, 1, { edges: false }) : '',
      axes(P, { yTicks: [[lim, `+${lim}`], [-lim, `${M}${lim}`]], xTicks: ticks, xTitle: ph ? 'samples (8 per ms)' : 'samples after the click (8 per ms)', zero: true }),
      text(P.x0, P.y0 - 14, title, { anchor: 'start', cls: 'k-name' }));
    const clipAt = yc.findIndex(v => Math.abs(v) >= 1);
    return [
      strip(A, ph ? 'on the laptop, 10× taller' : 'on the laptop: the click dies away (drawn 10× taller)', 0.1),
      strip(B, ph ? 'on the chip' : 'on the chip: the click grows, then clips', 1),
      text(L.W - 8, B.y0 - 14, ph ? 'shaded: −1 to +1' : 'shaded: what the chip can store, −1 to +1', { anchor: 'end', cls: 'k-tick' }),
      step(1, 'on the laptop the click passes and its ring dies away', trace(A, yl, { cls: 'k-line', style: 'stroke-width:1.4', anim: { k: 'draw', d: 0, len: 2 } }),
        text(A.X(5), A.Y(0.085), 'the click', { anchor: 'start', cls: 'k-tick' }),
        text(A.X(ph ? 34 : 30), A.Y(0.045), ph ? 'a faint ring fades' : 'then a faint ring that fades away', { anchor: 'start', cls: 'k-tick' })),
      step(2, 'on the chip the ring grows every sample until it hits both limits', trace(B, yc, { cls: 'k-stem-accent', style: 'stroke-width:1.2', anim: { k: 'draw', d: 2, len: 3 } })),
      step(3, 'it grows 15.8 times every 50 samples, then clips on both sides',
        g({ anim: { k: 'in', d: 5, len: 0.8 } },
          line(B.X(clipAt), B.y0 - 4, B.X(clipAt), B.Y(1) - 2, { cls: 'k-axis' }),
          text(B.X(clipAt) + 6, B.y0 + 2, ph ? 'first clip: n = 76' : 'first clip: n = 76, 9.5 ms', { anchor: 'start', cls: 'k-tick' }),
          text(ph ? L.W / 2 : B.x0, B.y1 + (ph ? 56 : 62), ph ? 'grows ×15.8 every 50 samples,' : 'grows ×15.8 every 50 samples, then clips on both sides', { anchor: ph ? 'middle' : 'start', cls: 'k-note-accent' }),
          ph ? text(L.W / 2, B.y1 + 78, 'then clips on both sides', { cls: 'k-note-accent' }) : '')),
    ];
  };

  const coefficients = L => {
    const ph = L.phone, rows = ph ? [80, 150, 220] : [84, 156, 228];
    const lx = ph ? 12 : 40, cx = ph ? 176 : 330, sx = ph ? 268 : 500, sy = rows[1], R = ph ? 22 : 26;
    const names = [['x[n]', 'the input now'], ['x[n − 2]', 'the input 2 samples ago'], ['y[n − 2]', 'the output 2 samples ago']];
    const vals = ['0.905', '0.905', `${M}0.81`];
    return [
      rows.map((y, i) => g({},
        text(lx, y - 2, names[i][0], { anchor: 'start', cls: 'k-name' }),
        text(lx, y + 15, ph ? names[i][1].replace('the ', '').replace(' samples', '') : names[i][1], { anchor: 'start', cls: 'k-tick' }),
        arrow(L.slug, [[ph ? 116 : 236, y], [cx - R - 4, y]]),
        circle(cx, y, R, { cls: 'k-mask' }), circle(cx, y, R, { cls: 'k-curve-input' }),
        text(cx, y + 4, vals[i], { cls: 'k-num-input' }),
        text(cx - R - 12, y - 6, '×', { cls: 'k-label', anchor: 'end' }),
        arrow(L.slug, i === 1 ? [[cx + R + 2, y], [sx - 22, y]] : [[cx + R + 2, y], [sx, y], [sx, y < sy ? sy - 22 : sy + 22]]))),
      circle(sx, sy, 18, { cls: 'k-mask' }), circle(sx, sy, 18, { cls: 'k-line' }), text(sx, sy + 6, '+', { cls: 'k-name', style: 'font-size:20px' }),
      arrow(L.slug, [[sx + 20, sy], [ph ? 304 : 590, sy]]),
      text(ph ? 310 : 598, sy + 5, 'y[n]', { anchor: 'start', cls: 'k-name' }),
      text(ph ? 300 : 598, sy + (ph ? 40 : 22), 'the output', { anchor: ph ? 'middle' : 'start', cls: 'k-tick' }),
      text(cx, rows[0] - R - 12, 'the coefficients', { cls: 'k-num-input' }),
      text(L.W / 2, L.H - 14, 'change a number, change the filter', { cls: 'k-note' }),
    ];
  };

  const chipSteps = L => {
    const ph = L.phone;
    const row = (y0, title, lo, hi, s, kk, val, gapText, d) => {
      const P = plot({ x: ph ? 28 : 40, y: y0, w: ph ? 304 : 420, h: 40, xs: [lo, hi], ys: [0, 1] });
      const base = P.Y(0), stored = kk * s, tx = P.X(val), sx = P.X(stored);
      const ticks = range(Math.ceil(lo / s - 1e-9), Math.floor(hi / s + 1e-9)).map(n => g({},
        line(P.X(n * s), base - 8, P.X(n * s), base + 8, { cls: 'k-axis' }),
        text(P.X(n * s), base + 24, String(n), { cls: n === kk ? 'k-num' : 'k-tick' })));
      return [
        g({},
          text(P.x0, base - 84, title, { anchor: 'start', cls: 'k-name' }),
          line(P.x0 - 6, base, P.x1 + 6, base, { cls: 'k-line' }), ticks,
          text(P.x1 + 2, base + 42, ph ? 'whole numbers' : 'stored whole numbers', { anchor: 'end', cls: 'k-tick' }),
          step(d, `the laptop's ${val} sits between two ticks`,
            g({}, line(tx, base - 34, tx, base, { cls: 'k-guide' }), circle(tx, base - 34, 4, { cls: 'k-stem-soft-dot' }),
              text(tx + (val > stored ? 8 : -8), base - 40, `laptop ${val}`, { anchor: val > stored ? 'start' : 'end', cls: 'k-num' })))),
        step(d + 1, `it snaps to ${kk}, which stands for ${stored}`,
          g({ anim: { k: 'move', dx: tx - sx, d: d + 0.3, len: 1 } }, circle(sx, base, 6, { cls: 'k-stem-dot' })),
          g({ anim: { k: 'in', d: d + 1.2, len: 0.6 } },
            line(Math.min(tx, sx), base - 14, Math.max(tx, sx), base - 14, { cls: 'k-stem-accent' }),
            text(sx + (val > stored ? -10 : 10), base - 58, `stored ${kk} = ${stored}`, { anchor: val > stored ? 'end' : 'start', cls: 'k-num' }),
            text(P.x0, base + 62, gapText, { anchor: 'start', cls: 'k-num-accent' }))),
      ];
    };
    const A = row(ph ? 96 : 100, 'step 1/128, lesson 6’s 0.81', 0.775, 0.8395, 1 / 128, 104, 0.81, ph ? '+0.0025: under half a step' : 'error +0.0025: under half a step (half a step is 0.0039)', 1);
    const B = row(ph ? 280 : 284, 'step 1/32, the rule’s 2.8576', 2.735, 2.9525, 1 / 32, 91, 2.8576, ph ? `${M}0.0138: under half a step` : `error ${M}0.0138: under half a step (half a step is 0.0156)`, 3);
    const R = plot({ x: ph ? 28 : 40, y: ph ? 462 : 466, w: ph ? 240 : 420, h: 96, xs: [0, 4.2], ys: [0, 3] });
    const reach = [[1 / 128, '1/128', 127 / 128], [1 / 64, '1/64', 127 / 64], [1 / 32, '1/32', 127 / 32]];
    const bh = 18, gap = 30;
    const panel = g({},
      text(R.x0, R.y0 - 26, 'how far one step reaches', { anchor: 'start', cls: 'k-name' }),
      text(R.x0, R.y0 - 8, '127 steps, the biggest whole number', { anchor: 'start', cls: 'k-tick' }),
      reach.map(([, name, top], i) => {
        const y = R.y0 + 12 + i * gap;
        return g({}, rect(R.x0, y, R.X(top) - R.x0, bh, { cls: 'k-bar' }), text(R.X(top) + 6, y + bh / 2 + 4, `${name}: ${fmt(top, 2)}`, { anchor: 'start', cls: 'k-num' }));
      }),
      line(R.x0, R.y0 + 2, R.x0, R.y0 + 18 + 2 * gap + bh, { cls: 'k-axis' }),
      [[0.81, '0.81'], [2.8576, '2.8576']].map(([v, s]) => g({}, line(R.X(v), R.y0 + 4, R.X(v), R.y0 + 18 + 2 * gap + bh, { cls: 'k-guide' }),
        text(R.X(v), R.y0 + 36 + 2 * gap + bh, s, { cls: 'k-tick' }))));
    return [A, B, panel];
  };

  const poleDrift = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 20, y: 70, w: 320, h: 320 * 0.33 / 0.54, xs: [-0.27, 0.27], ys: [0.79, 1.12] })
      : plot({ x: 150, y: 60, w: 420, h: 420 * 0.33 / 0.54, xs: [-0.27, 0.27], ys: [0.79, 1.12] });
    const lap = WHINES.map(f => polar(P, 0.98, f)), chip = CHIP_POLES.map(([r, f]) => polar(P, r, f));
    const toneLab = WHINES.map((f, i) => { const [x, y] = polar(P, 0.935, f); return text(x, y + 4, f === 1900 ? `${hz(f)} Hz` : hz(f), { cls: 'k-tick', style: ph ? 'font-size:10px' : undefined }); });
    const insetX = ph ? 20 : 14, insetY = ph ? 300 : 300, iw = ph ? 130 : 130, ih = 120;
    const IP = plot({ x: insetX + iw / 2 - 0.05 * (P.w / 0.54), y: insetY + 14, w: 0.1 * (P.w / 0.54), h: 0.13 * (P.w / 0.54), xs: [-0.05, 0.05], ys: [0.875, 1.005] });
    const labs = ph ? [[chip[0], ['1.0567', '1,817 Hz'], 'start'], [chip[2], ['1.0567', '2,183 Hz'], 'end']] : [[chip[0], ['1.0567 at 1,817 Hz'], 'start'], [chip[2], ['1.0567 at 2,183 Hz'], 'end']];
    return [
      text(P.X(0), P.Y(1.075), 'outside the circle: the echo grows', { cls: 'k-note' }),
      text(ph ? P.X(-0.25) : P.x0 - 10, ph ? P.Y(0.83) : P.Y(0.93), ph ? '' : 'inside: it dies', { anchor: 'end', cls: 'k-note' }),
      path(arcPath(P, 1, 1680, 2320), { cls: 'k-wheel' }),
      text(P.X(0.255), P.Y(0.955), 'unit circle', { anchor: 'end', cls: 'k-tick' }),
      step(1, 'the laptop poles at radius 0.98, at 1,900, 2,000 and 2,100 Hz',
        g({}, lap.map(([x, y]) => laptopPole(x, y)), toneLab, ph ? text(P.X(-0.25), P.Y(0.885), 'laptop poles: 0.98', { anchor: 'start', cls: 'k-num' }) : text(lap[2][0] - 14, lap[2][1] + 4, 'radius 0.98', { anchor: 'end', cls: 'k-num' }))),
      step(2, 'on the chip the outer pairs slide out past the circle and the middle pair slides in',
        chip.map(([x, y], i) => g({ anim: { k: 'move', dx: lap[i][0] - x, dy: lap[i][1] - y, d: 1, len: 2 } }, chipPole(x, y, i !== 1)))),
      step(3, 'where they land: 1.0567 at 1,817 and 2,183 Hz, 0.8378 at 2,000 Hz',
        g({ anim: { k: 'in', d: 3, len: 0.8 } },
          chip.map(([x, y], i) => arrow(L.slug, [[lap[i][0] + (x - lap[i][0]) * (i === 1 ? 0.45 : 0.18), lap[i][1] + (y - lap[i][1]) * (i === 1 ? 0.45 : 0.18)], [lap[i][0] + (x - lap[i][0]) * 0.82, lap[i][1] + (y - lap[i][1]) * 0.82]])),
          labs.map(([[x, y], lines, anchor]) => lines.map((s, j) => text(x + (anchor === 'start' ? 12 : -12), y + 4 + j * 15 - (lines.length - 1) * 7, s, { anchor, cls: 'k-num-accent' }))),
          text(chip[1][0] + 12, chip[1][1] + 4, ph ? '0.8378' : '0.8378 at 2,000 Hz', { anchor: 'start', cls: 'k-num' }))),
      step(4, 'lesson 6’s notch at the same zoom moves from 0.9 to 0.9014, too little to see',
        g({ anim: { k: 'in', d: 4, len: 0.8 } },
          rect(insetX, insetY, iw, ih, { cls: 'k-frame', fill: 'none' }),
          path(`M${r2(IP.X(-0.045))} ${r2(IP.Y(Math.sqrt(1 - 0.045 ** 2)))}Q${r2(IP.X(0))} ${r2(IP.Y(1.001))} ${r2(IP.X(0.045))} ${r2(IP.Y(Math.sqrt(1 - 0.045 ** 2)))}`, { cls: 'k-wheel' }),
          laptopPole(IP.X(0), IP.Y(0.9)), chipPole(IP.X(0), IP.Y(0.9014)),
          text(insetX + iw + 12, insetY + 30, 'lesson 6’s notch', { anchor: 'start', cls: 'k-label' }),
          text(insetX + iw + 12, insetY + 48, 'at the same zoom:', { anchor: 'start', cls: 'k-tick' }),
          text(insetX + iw + 12, insetY + 70, '0.9 to 0.9014,', { anchor: 'start', cls: 'k-num' }),
          text(insetX + iw + 12, insetY + 88, 'a move too small to see', { anchor: 'start', cls: 'k-tick' }))),
      ph ? keyRow(28, L.H - 34, [[keyLaptop, 'pole on the laptop'], [keyChip, 'pole on the chip']], { cols: 1, dy: 22 })
        : keyRow(400, L.H - 50, [[keyLaptop, 'pole on the laptop'], [keyChip, 'pole on the chip']], { cols: 1, dy: 24 }),
    ];
  };

  const pileUp = L => {
    const ph = L.phone;
    const cards = [['1,900 Hz', `1 ${M} 0.1538 z^{${M}1} + 0.9604 z^{${M}2}`, 1900], ['2,000 Hz', `1 + 0.9604 z^{${M}2}`, 2000], ['2,100 Hz', `1 + 0.1538 z^{${M}1} + 0.9604 z^{${M}2}`, 2100]];
    const nx = ph ? 12 : 24, cx0 = ph ? 12 : 96, cw = ph ? 214 : 232, ch = 32, cy0 = ph ? 74 : 58, cgap = ph ? 52 : 44;
    const Z = ph ? plot({ x: 244, y: 214, w: 104, h: 60, xs: [-0.12, 0.12], ys: [0.93, 1.07] }) : plot({ x: 380, y: 150, w: 180, h: 60, xs: [-0.12, 0.12], ys: [0.95, 1.01] });
    const card = (x, y, w, s, o = {}) => g(o, rect(x, y, w, ch, { cls: 'k-box', rx: 5 }), rich(x + w / 2, y + 21, s, { anchor: 'middle' }));
    const poles = cards.map(([, , f]) => polar(Z, 0.98, f));
    const row1 = g({},
      text(nx, cy0 - (ph ? 30 : 16), ph ? 'one notch each' : 'the three feedback sides, one notch each', { anchor: 'start', cls: 'k-name' }),
      cards.map(([name, s], i) => g({}, card(cx0, cy0 + i * cgap, cw, s), text(ph ? cx0 : nx, ph ? cy0 + i * cgap - 5 : cy0 + i * cgap + 21, name, { anchor: 'start', cls: 'k-tick' }))));
    const zoom = g({},
      path(arcPath(Z, 1, ph ? 1872 : 1760, ph ? 2128 : 2240), { cls: 'k-wheel' }),
      poles.map(([x, y]) => laptopPole(x, y, 3)),
      cards.map((_, i) => line(cx0 + cw + 2, cy0 + i * cgap + ch / 2, poles[i][0], poles[i][1] - 9, { cls: 'k-axis' })),
      text(Z.X(0), Z.y1 + 6, ph ? 'their poles' : 'each card: its own pole pair', { cls: 'k-tick' }));
    const rowY = ph ? [316, 384] : [240, 306], rw = ph ? 336 : 470;
    const merged = [[ph ? '1,900 × 2,100 Hz:' : 'the 1,900 Hz side times the 2,100 Hz side', `1 + 1.8972 z^{${M}2} + 0.9224 z^{${M}4}`], [ph ? 'then × the 2,000 Hz side:' : 'times the 2,000 Hz side: the rule’s feedback side', `1 + 2.8576 z^{${M}2} + 2.7444 z^{${M}4} + 0.8858 z^{${M}6}`]];
    const mrow = i => g({}, text(cx0, rowY[i] - 8, merged[i][0], { anchor: 'start', cls: 'k-tick' }), card(cx0, rowY[i], rw, merged[i][1]));
    const notes = ph
      ? g({}, text(L.W / 2, 446, 'no link: every number mixes', { cls: 'k-note' }), text(L.W / 2, 466, 'all six poles', { cls: 'k-note' }))
      : g({}, text(cx0, 370, 'no link any more: every number mixes all six poles', { anchor: 'start', cls: 'k-note' }));
    const by = ph ? 520 : 426;
    const B = plot({ x: ph ? 70 : 150, y: by, w: ph ? 220 : 380, h: 100, xs: [0, 3], ys: [0, 1] });
    const vals = [[0.9604, 'one'], [1.8972, 'two'], [2.8576, 'three']];
    const bar = i => { const [v, name] = vals[i], y = B.y0 + i * 28; return g({}, rect(B.x0, y, B.X(v) - B.x0, 18, { cls: 'k-bar' }), text(B.x0 - 8, y + 13, name, { anchor: 'end', cls: 'k-tick' }), v > 1.5 ? text(B.X(v) - 6, y + 13, fmt(v, 4), { anchor: 'end', cls: 'k-num', style: 'fill:var(--paper)' }) : text(B.X(v) + 6, y + 13, fmt(v, 4), { anchor: 'start', cls: 'k-num' })); };
    const barFrame = g({},
      rich(nx, by - 16, `the z^{${M}2} number, notches multiplied together:`, { cls: 'k-name', anchor: 'start', size: ph ? 13 : undefined }),
      line(B.x0, B.y0 - 4, B.x0, B.y0 + 78, { cls: 'k-axis' }),
      line(B.X(127 / 64), B.y0 - 4, B.X(127 / 64), B.y0 + 82, { cls: 'k-axis' }),
      text(B.X(127 / 64), B.y0 + 98, 'step 1/64 reaches 1.98', { cls: 'k-tick' }),
      text(nx, by + 136, 'like (1 + x)³ = 1 + 3x + 3x² + x³: numbers near 1 pile up', { anchor: 'start', cls: 'k-tick', style: ph ? 'font-size:9.5px' : undefined }));
    return [
      step(1, 'three tidy factor cards, each linked to its own pole pair', row1, zoom),
      step(2, 'multiply the first and last: 1.8972 for the z to the minus 2 number', g({ anim: { k: 'move', dy: -30, d: 1, len: 1 } }, g({ anim: { k: 'in', d: 1, len: 0.6 } }, mrow(0))), g({ anim: { k: 'in', d: 1.4, len: 0.6 } }, bar(1))),
      step(3, 'multiply in the middle: 2.8576, past what step 1/64 can reach', g({ anim: { k: 'move', dy: -30, d: 2.4, len: 1 } }, g({ anim: { k: 'in', d: 2.4, len: 0.6 } }, mrow(1))), g({ anim: { k: 'in', d: 2.8, len: 0.6 } }, bar(2))),
      step(4, 'no link to any one pole any more', g({ anim: { k: 'in', d: 3.8, len: 0.8 } }, notes)),
      barFrame, bar(0),
    ];
  };

  const push = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 30, y: 46, w: 300, h: 330, xs: [-0.5, 0.5], ys: [0.28, 1.38] }) : plot({ x: 190, y: 34, w: 340, h: 374, xs: [-0.5, 0.5], ys: [0.28, 1.38] });
    const up = [[0.143, 81], [0.061, 90], [0.122, 99]], down = [[0.286, -90], [0.121, -90], [0.244, -90]];
    const chainOf = (start, segs) => { let [re, im] = start; return segs.map(([len, a]) => { const s = [re, im]; re += len * cosd(a); im += len * sind(a); return [s, [re, im], len]; }); };
    const p19 = [0.98 * cosd(85.5), 0.98 * sind(85.5)], p20 = [0, 0.98], p21 = [-p19[0], p19[1]];
    const c19 = chainOf(p19, up), c21 = chainOf(p21, up.map(([l, a]) => [l, 180 - a])), c20 = chainOf(p20, down);
    const draw = (segs, labels, side) => segs.map(([a, b, len]) => g({},
      arrow(L.slug, [unit(P, ...a), unit(P, ...b)], { cls: 'k-vec' }),
      labels ? text(P.X((a[0] + b[0]) / 2) + side * 10, P.Y((a[1] + b[1]) / 2) + 4, fmt(len, 3), { anchor: side > 0 ? 'start' : 'end', cls: 'k-num' }) : ''));
    const end19 = c19[2][1], end20 = c20[2][1];
    return [
      path(arcPath(P, 1, 1340, 2660), { cls: 'k-wheel' }),
      text(P.X(0.47), P.Y(0.83), 'unit circle', { anchor: 'end', cls: 'k-tick' }),
      [p19, p20, p21].map(p => laptopPole(...unit(P, ...p))),
      draw(c19, true, 1), draw(c21, false, -1), draw(c20, true, 1),
      text(P.X(end19[0]) + 8, P.Y(end19[1]) - 26, ph ? '1,900 Hz pole:' : 'the 1,900 Hz pole:', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(end19[0]) + 8, P.Y(end19[1]) - 10, 'total 0.32, out', { anchor: 'start', cls: 'k-num-accent' }),
      text(P.X(c21[2][1][0]) - 8, P.Y(c21[2][1][1]) - 26, ph ? '2,100 Hz:' : 'the 2,100 Hz pole:', { anchor: 'end', cls: 'k-tick' }),
      text(P.X(c21[2][1][0]) - 8, P.Y(c21[2][1][1]) - 10, 'total 0.32, out', { anchor: 'end', cls: 'k-num-accent' }),
      text(P.X(end20[0]) + 12, P.Y(end20[1]) - 12, ph ? '2,000 Hz pole:' : 'the 2,000 Hz pole:', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(end20[0]) + 12, P.Y(end20[1]) + 4, 'total 0.65, in', { anchor: 'start', cls: 'k-num-accent' }),
      ph ? g({}, keyRow(28, L.H - 54, [[keyLaptop, 'pole on the laptop']]), text(18, L.H - 22, 'each arrow: one rounded coefficient’s push', { anchor: 'start', cls: 'k-label' }))
        : g({}, keyRow(14, L.H - 40, [[keyLaptop, 'pole on the laptop']]), text(14, L.H - 14, 'each arrow: the push from one rounded coefficient, in the order 2.8576, 2.7444, 0.8858', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const tangent = L => {
    const ph = L.phone, eps = 0.35;
    const panel = (x0, y0, title, a, c) => {
      const P = plot({ x: x0, y: y0, w: ph ? 300 : 290, h: ph ? 170 : 180, xs: [-1.2, 1.2], ys: [-1.2, 1.2] });
      const f = x => a * x + c * x * x, root = (-a + Math.sqrt(a * a - 4 * c * eps)) / (2 * c);
      const inside = fn => { const xs = range(0, 480).map(i => -1.2 + 2.4 * i / 480).filter(x => Math.abs(fn(x)) <= 1.2); return { from: xs[0], to: xs[xs.length - 1] }; };
      const t1 = Math.min(1.2, 1.2 / a);
      return g({},
        text(P.x0, y0 - 12, title, { anchor: 'start', cls: 'k-name' }),
        line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
        text(P.x1, P.Y(0) + 50, 'z, near the pole', { anchor: 'end', cls: 'k-tick' }),
        line(P.X(-t1), P.Y(-t1 * a), P.X(t1), P.Y(t1 * a), { cls: 'k-axis' }),
        k.curve(P, f, { cls: 'k-curve-soft', ...inside(f) }),
        k.curve(P, x => f(x) + eps, inside(x => f(x) + eps)),
        circle(P.X(0), P.Y(0), 3.5, { cls: 'k-stem-soft-dot' }),
        line(P.X(0) + 16, P.Y(0), P.X(0) + 16, P.Y(eps), { cls: 'k-line' }),
        text(P.X(0) + 22, P.Y(eps / 2) + 5, 'ε', { anchor: 'start', cls: 'k-math' }),
        arrow(L.slug, [[P.X(0), P.Y(0) + 10], [P.X(root) + 3, P.Y(0) + 10]], { tone: 'accent' }),
        circle(P.X(root), P.Y(0), 4, { cls: 'k-stem-dot' }),
        text(P.X(0) + 12, P.Y(0) + 30, `slides ${fmt(-root, 2)}`, { anchor: 'start', cls: 'k-num-accent' }),
        a > 1 ? text(P.X(t1) + 8, P.y0 + 10, 'tangent', { anchor: 'start', cls: 'k-tick' }) : text(P.X(-t1), P.Y(-t1 * a) + 20, 'tangent', { anchor: 'start', cls: 'k-tick' }));
    };
    return [
      ph ? panel(36, 62, 'steep: a short slide', 2.2, 0.5) : panel(44, 62, 'steep: a short slide', 2.2, 0.5),
      ph ? panel(36, 310, 'flat: a long slide', 0.5, 0.1) : panel(396, 62, 'flat: a long slide', 0.5, 0.1),
      ph ? g({}, legendLines(L, 24, 530, true)) : g({}, legendLines(L, 44, 316, false)),
    ];
  };
  const legendLines = (L, x, y, stacked) => {
    const items = [['k-curve-soft', 'P before rounding'], ['k-curve', 'P lifted by the error ε'], ['k-axis', 'the tangent at the pole']];
    return g({}, items.map(([cls, s], i) => {
      const lx = stacked ? x : x + i * 220, ly = stacked ? y + i * 22 : y;
      return g({}, line(lx, ly - 4, lx + 26, ly - 4, { cls: `${cls} k-legend-line` }), text(lx + 34, ly, s, { anchor: 'start', cls: 'k-label' }));
    }), text(stacked ? x : x, y + (stacked ? 70 : 26), 'the slide is ε ÷ the steepness of the tangent', { anchor: 'start', cls: 'k-label' }));
  };

  const crowd = L => {
    const ph = L.phone, R = 106;
    const panel = (cx, cy, title, fs, lines) => {
      const at = f => [cx + R * 0.98 * cosd(angle(f)), cy - R * 0.98 * sind(angle(f))];
      const top = at(2000), others = fs.filter(f => f !== 2000);
      return g({},
        text(cx, cy - R - 26, title, { cls: 'k-name' }),
        fullCircle(cx, cy, R), line(cx - R - 10, cy, cx + R + 10, cy, { cls: 'k-axis' }),
        others.map(f => { const [x, y] = at(f), d = Math.hypot(x - top[0], y - top[1]); return d > 30 ? arrow(L.slug, [[x + (top[0] - x) * 6 / d, y + (top[1] - y) * 6 / d], [top[0] + (x - top[0]) * 8 / d, top[1] + (y - top[1]) * 8 / d]], { cls: 'k-vec' }) : line(top[0], top[1], x, y, { cls: 'k-stem-accent' }); }),
        fs.map(f => laptopPole(...at(f), 3)),
        lines.map(([s, cls], i) => text(cx, cy + R + 32 + i * 20, s, { cls })));
    };
    const crowdFs = [1900, 2000, 2100, -1900, -2000, -2100], loneFs = [2000, -2000];
    const cx1 = ph ? 180 : 190, cx2 = ph ? 180 : 540, cy1 = ph ? 160 : 166, cy2 = ph ? 520 : 166;
    const l1 = [['five arrows: 0.077, 0.077, 1.96, 1.96, 1.96', 'k-tick'], ['product 0.045, multiplier 1 ÷ 0.045 = 22', 'k-num-accent']];
    const l2 = [['one arrow: 1.96', 'k-tick'], ['multiplier 1 ÷ 1.96 = 0.5', 'k-num']];
    return [
      panel(cx1, cy1, ph ? 'crowded: the 2,000 Hz pole' : 'three crowded pairs: the 2,000 Hz pole', crowdFs, l1),
      panel(cx2, cy2, 'a lone pair', loneFs, l2),
      text(cx1 + 46, cy1 - R - 4, ph ? 'two short: 0.077' : 'two short ones, 0.077', { anchor: 'start', cls: 'k-tick' }),
      line(cx1 + 44, cy1 - R - 8, cx1 + 8, cy1 - R * 0.98 + 2, { cls: 'k-axis' }),
      ph ? '' : text(L.W / 2, L.H - 12, 'a pole moves by about the error × 1 / the product of its arrows', { cls: 'k-note' }),
      ph ? text(L.W / 2, L.H - 12, 'move ≈ error × 1 / product of arrows', { cls: 'k-note' }) : '',
    ];
  };

  const section = L => {
    const ph = L.phone;
    const prog = ph ? ['output[n] = 0.9802 × (input[n]', `    ${M} 0.1569 × input[n ${M} 1] + input[n ${M} 2])`, '    + 0.1538 × output[n − 1]', `    ${M} 0.9604 × output[n ${M} 2]`]
      : [`output[n] = 0.9802 × (input[n] ${M} 0.1569 × input[n ${M} 1] + input[n ${M} 2])`, `          + 0.1538 × output[n ${M} 1] ${M} 0.9604 × output[n ${M} 2]`];
    const rows = [['0.9802', ph ? 'the volume: 0 Hz at 100%' : 'the volume: 0 Hz comes out at 100%'], [`${M}0.1569`, 'the zeros’ angle: 85.5°, 1,900 Hz'], ['1 and 1', 'keep the zeros on the circle'], ['+0.1538', 'the poles’ angle: 85.5° again'], [`${M}0.9604`, 'the poles’ radius squared: 0.98²']];
    const ry = ph ? 128 : 112, gap = ph ? 30 : 36, nx = ph ? 14 : 24, ax = ph ? 82 : 110, mx = ph ? 114 : 150;
    const cx = ph ? 180 : 590, cy = ph ? 410 : 232, R = ph ? 100 : 104;
    const zAt = s => [cx + R * cosd(s * 85.5), cy - R * sind(s * 85.5)], pAt = s => [cx + R * 0.98 * cosd(s * 85.5), cy - R * 0.98 * sind(s * 85.5)];
    const arc = `M${cx + 34} ${cy}A34 34 0 0 0 ${r2(cx + 34 * cosd(85.5))} ${r2(cy - 34 * sind(85.5))}`;
    return [
      prog.map((s, i) => text(nx, 30 + i * 20, s, { anchor: 'start', cls: 'k-num', style: ph ? 'font-size:11.5px' : 'font-size:13px', 'xml:space': 'preserve' })),
      rows.map(([n, s], i) => g({},
        text(nx, ry + i * gap, n, { anchor: 'start', cls: 'k-num', style: 'font-weight:600' }),
        arrow(L.slug, [[ax, ry + i * gap - 4], [mx - 6, ry + i * gap - 4]]),
        text(mx, ry + i * gap, s, { anchor: 'start', cls: 'k-label' }))),
      fullCircle(cx, cy, R), line(cx - R - 10, cy, cx + R + 10, cy, { cls: 'k-axis' }),
      path(arc, { cls: 'k-axis' }), line(cx, cy, ...zAt(1), { cls: 'k-guide' }),
      text(cx + 30, cy - 40, '85.5°', { anchor: 'start', cls: 'k-tick' }),
      [1, -1].map(s => g({}, zeroMark(...zAt(s), 6), chipPole(...pAt(s), false, 4))),
      text(zAt(1)[0] - 14, zAt(1)[1] - (ph ? 24 : 6), 'zero on the circle,', { anchor: 'end', cls: 'k-tick' }),
      text(zAt(1)[0] - 14, zAt(1)[1] + (ph ? -10 : 8), 'pole just inside', { anchor: 'end', cls: 'k-tick' }),
      text(cx + R - 8, cy - 8, '0 Hz', { anchor: 'end', cls: 'k-tick' }),
      ph ? keyRow(30, L.H - 14, [[keyZero, 'zero'], [(x, y) => chipPole(x, y, false, 4), 'pole']], { dx: 120 })
        : keyRow(470, L.H - 14, [[keyZero, 'zero'], [(x, y) => chipPole(x, y, false, 4), 'pole']], { dx: 110 }),
    ];
  };

  const cascade = L => {
    const ph = L.phone, chipR = Math.sqrt(61 / 64);
    const mini = (cx, cy, R, fs, zeros, cls) => g({},
      fullCircle(cx, cy, R, { style: 'stroke-width:1' }),
      zeros.flatMap(f => [1, -1].map(s => zeroMark(cx + R * cosd(s * angle(f)), cy - R * sind(s * angle(f)), 3))),
      fs.flatMap(([r, f]) => [1, -1].map(s => xMark(cx + R * r * cosd(s * angle(f)), cy - R * r * sind(s * angle(f)), { s: 3.2, cls }))));
    const secs = [[1898.0, 1900.4, '1,900 Hz'], [2000, 2000, '2,000 Hz'], [2102.0, 2099.6, '2,100 Hz']];
    const bw = ph ? 200 : 136, bh = ph ? 86 : 118;
    const boxes = ph ? secs.map((_, i) => [80, 300 + i * 112]) : secs.map((_, i) => [84 + i * 160, 230]);
    const secBox = ([x, y], [pf, zf, name]) => g({},
      box(x, y, bw, bh, {}),
      text(ph ? x + 12 : x + bw / 2, ph ? y + 26 : y + 20, `${name} section`, { anchor: ph ? 'start' : 'middle', cls: 'k-label' }),
      text(ph ? x + 12 : x + bw / 2, ph ? y + 46 : y + bh - 10, 'poles 0.9763', { anchor: ph ? 'start' : 'middle', cls: 'k-tick' }),
      mini(ph ? x + bw - 34 : x + bw / 2, ph ? y + bh / 2 : y + 60, ph ? 27 : 30, [[chipR, pf]], [zf], 'k-stem'));
    const wire = ph ? [[180, 262], [180, 300], [180, 386], [180, 412], [180, 498], [180, 524], [180, 610], [180, 640]]
      : [[20, 290], [84, 290], [220, 290], [244, 290], [380, 290], [404, 290], [540, 290], [566, 290]];
    const wires = [0, 2, 4, 6].map(i => arrow(L.slug, [wire[i], [wire[i + 1][0] - (ph ? 0 : 4), wire[i + 1][1] - (ph ? 4 : 0)]]));
    const yOut = run([119 / 128], [1], [0.1, ...Array(28).fill(0)]);
    const secsC = secs.map(([pf, zf]) => { const c = 2 * cosd(angle(zf)) / 2, cp = cosd(angle(pf)); return [[1, -Math.round(64 * 2 * cosd(angle(zf === 2000 ? 2000 : zf))) / 64, 1], [1, -Math.round(64 * 2 * chipR * cp) / 64, 61 / 64]]; });
    const ring = secsC.reduce((y, [b, a]) => run(b, a, y, true), yOut);
    const O = ph ? plot({ x: 60, y: 690, w: 240, h: 60, xs: [-0.5, 28.5], ys: [-0.2, 0.2] }) : plot({ x: 576, y: 250, w: 136, h: 80, xs: [-0.5, 28.5], ys: [-0.2, 0.2] });
    const shown = ring.map((v, n) => [n, n ? v * 20 : v]);
    const out = g({},
      line(O.x0, O.Y(0), O.x1, O.Y(0), { cls: 'k-axis' }),
      k.stems(O, shown, { dot: 1.8, cls: 'k-stem' }),
      text(O.x0, O.y0 - 26, ph ? 'out: the click, then a ring that dies' : 'out: the click,', { anchor: 'start', cls: 'k-tick' }),
      ph ? '' : text(O.x0, O.y0 - 10, 'then a ring that dies', { anchor: 'start', cls: 'k-tick' }),
      text(O.x0, O.y1 + 18, ph ? 'ring drawn 20 times taller; 1% by 24 ms' : 'ring drawn ×20', { anchor: 'start', cls: 'k-tick' }));
    const top = ph ? [40, 40, 280, 120] : [180, 40, 300, 120];
    const mixed = g({},
      box(top[0], top[1], top[2], top[3], { cls: 'k-box' }),
      text(top[0] + 14, top[1] + 26, 'the multiplied-out rule', { anchor: 'start', cls: 'k-name' }),
      text(top[0] + 14, top[1] + 46, 'six crowded poles,', { anchor: 'start', cls: 'k-tick' }),
      text(top[0] + 14, top[1] + 62, 'rounded together', { anchor: 'start', cls: 'k-tick' }),
      text(top[0] + 14, top[1] + 86, 'on the chip: two pairs', { anchor: 'start', cls: 'k-tick' }),
      text(top[0] + 14, top[1] + 102, 'outside, the hum', { anchor: 'start', cls: 'k-tick' }),
      mini(top[0] + top[2] - 56, top[1] + top[3] / 2, 40, CHIP_POLES, [2000], 'k-stem-accent'),
      cross(top[0] + top[2] - 8, top[1] + 10));
    const pulse = g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 2, len: 2.2 } },
      g({ anim: ph ? { k: 'move', dy: -(wire[7][1] - wire[0][1]), d: 2, len: 2.2 } : { k: 'move', dx: -(wire[7][0] - wire[0][0]), d: 2, len: 2.2 } }, circle(...wire[7], 6, { cls: 'k-dot' })));
    return [
      step(1, 'the multiplied-out rule: six crowded poles, two pairs outside on the chip', mixed),
      step(2, 'the cascade: three sections in a row, each with one pole pair at 0.9763 and one zero pair on the circle',
        g({ anim: { k: 'in', d: 1, len: 0.8 } }, boxes.map((b, i) => secBox(b, secs[i])), wires,
          text(...(ph ? [180, 254] : [20, 278]), 'a click', { anchor: ph ? 'middle' : 'start', cls: 'k-tick' }),
          ph ? text(L.W / 2, 290, '', {}) : '')),
      step(3, 'a click travels through the three sections', pulse),
      step(4, 'it leaves as the click and a faint ring that dies', g({ anim: { k: 'in', d: 4.2, len: 0.8 } }, out)),
    ];
  };

  const bits = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 54 : 90, y: 46, w: ph ? 284 : 540, h: ph ? 240 : 220, xs: [7.5, 16.5], ys: [0.955, 1.07] });
    const pts = [[8, 1.0567], [9, 1], [10, 1], [11, 1], [12, 1], [13, 0.9805], [14, 0.985], [15, 0.9803], [16, 0.9805]];
    const d = pts.map(([b, r], i) => `${i ? 'L' : 'M'}${r2(P.X(b))} ${r2(P.Y(r))}`).join('');
    return [
      axes(P, { xTicks: range(8, 16).map(b => [b, String(b)]), yTicks: [[0.96, '0.96'], [0.98, '0.98'], [1, '1.00'], [1.02, '1.02'], [1.04, '1.04'], [1.06, '1.06']], zero: false,
        xTitle: 'bits per coefficient', yTitle: ph ? 'largest pole radius (from 0.96)' : 'largest pole radius of the multiplied-out rule (axis starts at 0.96)' }),
      line(P.x0, P.Y(1), P.x1, P.Y(1), { cls: 'k-line' }),
      text(P.x1, P.Y(1) - 8, ph ? 'unit circle' : 'unit circle: radius 1', { anchor: 'end', cls: 'k-label' }),
      line(P.x0, P.Y(0.98), P.x1, P.Y(0.98), { cls: 'k-guide' }),
      ph ? text(P.X(9.1), P.Y(0.98) - 6, 'laptop 0.98', { anchor: 'start', cls: 'k-tick' }) : text(P.X(12.6), P.Y(0.9763) + 18, 'dashed: the laptop design, 0.98', { anchor: 'start', cls: 'k-tick' }),
      line(P.X(8), P.Y(0.9763), P.x1, P.Y(0.9763), { cls: 'k-axis' }),
      rect(P.X(8) - 4.5, P.Y(0.9763) - 4.5, 9, 9, { cls: 'k-bar' }),
      text(P.X(8) + 10, P.Y(0.9763) + 18, ph ? 'cascade, 8 bits: 0.9763' : 'the cascade at 8 bits: 0.9763', { anchor: 'start', cls: 'k-num' }),
      path(d, { cls: 'k-line' }),
      pts.map(([b, r]) => (r === 1 ? g({}, zeroMark(P.X(b), P.Y(r), 6), xMark(P.X(b), P.Y(r), { s: 3.5, cls: 'k-stem' }))
        : b === 8 ? circle(P.X(b), P.Y(r), 5, { cls: 'k-stem-accent-dot' }) : circle(P.X(b), P.Y(r), 4, { cls: 'k-stem-dot' }))),
      text(P.X(8) + 10, P.Y(1.0567) + 4, ph ? '1.0567: the hum' : '8 bits: 1.0567, the hum', { anchor: 'start', cls: 'k-num-accent' }),
      text(P.X(9.1), P.Y(1) - (ph ? 52 : 30), ph ? '9 to 12: pole on a zero,' : '9 to 12 bits: a pole exactly on the circle, on a zero:', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(9.1), P.Y(1) - (ph ? 36 : 14), 'silent only in exact arithmetic', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(14.5), P.Y(0.985) - 12, ph ? '13 up: near 0.98' : '13 bits and up: near 0.98', { cls: 'k-tick' }),
      ph ? keyRow(30, L.H - 14, [[(x, y) => g({}, zeroMark(x, y, 6), xMark(x, y, { s: 3.5 })), 'pole on a zero']], { dx: 150 })
        : keyRow(90, L.H - 14, [[(x, y) => g({}, zeroMark(x, y, 6), xMark(x, y, { s: 3.5 })), 'pole sitting on a zero']], { dx: 200 }),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, eyebrow: 'Lesson 9 · finite precision', body: (kk, L) => body(L) });

  return [
    fig('three-notches', [300, 300], 'Three notches, one per whine',
      'Gain against tone from 1,500 to 2,500 Hz: flat at 100% except three narrow dips to 0% at 1,900, 2,000 and 2,100 Hz, one under each of the whine’s three pitches.',
      'The laptop design: one narrow dip on each whine pitch, and everything else passes untouched.', threeNotches),
    fig('hum', [400, 450], 'One click, laptop against chip',
      'After one click of size 0.1, the laptop’s output, drawn ten times taller, rings faintly and dies; the chip’s output grows 15.8 times every 50 samples, first hits the limit at sample 76 (9.5 ms), then swings between +1 and −1.',
      'The same rule after one click. On the laptop the ring dies; on the chip it grows ×15.8 every 50 samples, then clips on both sides.', hum, 3),
    fig('coefficients', [300, 290], 'A filter is its coefficients',
      'Lesson 6’s notch as a flow: x[n] and x[n − 2] each multiplied by 0.905, y[n − 2] multiplied by −0.81, all added into y[n]. The three multipliers are the coefficients.',
      'Lesson 6’s notch, one wire per sample. The three numbers in the circles are its coefficients: change a number, change the filter.', coefficients),
    fig('chip-steps', [620, 640], 'The chip snaps every coefficient to a tick',
      '0.81 between ticks 103 and 104 of step 1/128 snaps to 104, which is 0.8125, an error of +0.0025; 2.8576 between ticks of step 1/32 snaps to 91, which is 2.84375, an error of −0.0138. Steps of 1/128, 1/64 and 1/32 reach 0.99, 1.98 and 3.97.',
      'Each coefficient is stored as the nearest whole number of steps. One step serves the whole rule, so the biggest coefficient decides how coarse every tick is.', chipSteps, 4),
    fig('pole-drift', [450, 500], 'Rounding moves the crowded poles',
      'The top of the unit circle, 1,700 to 2,300 Hz. The laptop poles at radius 0.98 at 1,900, 2,000 and 2,100 Hz move on the chip to 1.0567 at 1,817 and 2,183 Hz, outside the circle, and to 0.8378 at 2,000 Hz, inside. Lesson 6’s notch at the same zoom moves from 0.9 to 0.9014.',
      'Zoomed on the top of the unit circle. The outer pole pairs cross the rim; lesson 6’s notch, at the same zoom, barely moves.', poleDrift, 4),
    fig('pile-up', [580, 680], 'Multiplying piles the numbers up',
      'Three tidy feedback sides, each tied to its own pole pair, multiply into one rule: the z to the minus 2 number grows from 0.9604 to 1.8972 to 2.8576, past the 1.98 that step 1/64 reaches, and no number belongs to one pole any more.',
      'Multiply the notches one at a time: the numbers grow like the 1, 3, 3, 1 of (1 + x)³, and none of them is tied to one pole any more.', pileUp, 4),
    fig('push', [450, 470], 'Each rounding error pushes each pole',
      'The top of the unit circle with the laptop poles at 0.98. The 1,900 Hz pole gets pushes of 0.143, 0.061 and 0.122 end to end, outward, total 0.32; the 2,000 Hz pole gets 0.286, 0.121 and 0.244, inward, total 0.65; the 2,100 Hz pole gets the same pushes as the 1,900 Hz one, flipped left for right, total 0.32, outward.',
      'Each rounding error pushes each pole, and the pushes add like arrows: the middle pole is pushed in, its neighbors out.', push),
    fig('tangent', [370, 640], 'A flat curve slides its crossing far',
      'Two curves crossing zero, each lifted by the same small error ε: the steep one’s crossing slides 0.17, the flat one’s slides 0.84. The slide is ε divided by the steepness of the tangent.',
      'Lift a curve by ε and its crossing slides by ε ÷ steepness. Steep: a short slide. Flat: a long one.', tangent),
    fig('crowd', [400, 760], 'Crowded poles have a big multiplier',
      'Six laptop poles at 0.98. From the 2,000 Hz pole, two short arrows of 0.077 come in from its neighbors and three of about 1.96 from the mirrors: product 0.045, multiplier 22. A lone pair has one arrow of 1.96: multiplier 0.5.',
      'The steepness at a pole is the product of the arrows from the other poles to it. Two short arrows make it tiny, and the multiplier huge.', crowd),
    fig('section', [400, 570], 'In a section, every number means something',
      'The 1,900 Hz section’s program, output[n] = 0.9802 × (input[n] − 0.1569 × input[n − 1] + input[n − 2]) + 0.1538 × output[n − 1] − 0.9604 × output[n − 2], with each number tied to what it sets: the volume, the zero angle, the zeros on the circle, the pole angle, the pole radius squared.',
      'The 1,900 Hz section. Every number is something you can see: the volume, the zeros’ angle and place on the circle, the poles’ angle and radius.', section),
    fig('cascade', [380, 790], 'A cascade keeps each pair alone',
      'The multiplied-out rule with its six crowded poles, crossed out, above a cascade of three sections at 1,900, 2,000 and 2,100 Hz, each with one pole pair at 0.9763 and one zero pair on the circle; a click passes through all three and leaves with a faint ring that dies.',
      'The same filter, built as three second-order sections in a row. Each pole pair is rounded on its own and lands at 0.9763.', cascade, 4),
    fig('bits', [340, 380], 'More bits: the multiplied-out rule',
      'Largest pole radius of the multiplied-out rule against bits per coefficient: 1.0567 at 8 bits, exactly 1 from 9 to 12 bits with the pole sitting on a zero, about 0.98 from 13 bits up (0.985 at 14). The cascade at 8 bits sits at 0.9763.',
      'The multiplied-out rule needs 13 bits to stay safely inside the circle. The cascade is already at 0.9763 with 8.', bits),
  ];
};
