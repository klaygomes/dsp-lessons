export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, curve, stems, bars, arrow, box, step, legend, fmt, cosd, sind, range } = k;
  const M = '−';
  const t16 = f => m => cosd(360 * f * m / 16000);
  const pts = (fn, ns) => ns.map(n => [n, fn(n)]);
  const at = (cx, cy, R, d) => [cx + R * cosd(d), cy - R * sind(d)];
  const H = (N, f) => {
    const p = 360 * f / 16000;
    if (N === 3) return 0.5 * (1 + cosd(p));
    let s = 0.5;
    for (let j = 1; j <= (N - 1) / 2; j++) s += 2 * Math.sin(Math.PI * j / 2) / (Math.PI * j) * cosd(j * p);
    return s;
  };
  const share = N => f => Math.abs(H(N, f));

  const CSS = [
    '.k-fig .l5-hum { fill: var(--ink); }',
    '.k-fig .l5-ghost { fill: var(--paper); stroke: var(--accent); stroke-width: 2.2; }',
    '.k-fig .l5-spoke-hum { stroke: var(--ink); stroke-width: 1.5; }',
    '.k-fig .l5-spoke-ghost { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; }',
    '.k-fig .l5-drop { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 2 3; }',
    '.k-fig .l5-trail-ghost { fill: var(--paper); stroke: var(--accent); stroke-width: 1.5; }',
    '.k-fig .l5-stem-ghost { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 2 3; }',
    '.k-fig .l5-stem-ghost-dot { fill: var(--paper); stroke: var(--accent); stroke-width: 1.8; }',
    '.k-fig .l5-ideal { stroke: var(--rule); stroke-width: 7; fill: none; stroke-linejoin: round; }',
    '.k-fig .l5-c3 { stroke: var(--ink-soft); stroke-width: 1.8; stroke-dasharray: 1.5 3.5; stroke-linecap: round; fill: none; }',
    '.k-fig .l5-c7 { stroke: var(--ink-soft); stroke-width: 1.6; stroke-dasharray: 8 4; fill: none; }',
    '.k-fig .l5-c15 { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 10 3 2 3; fill: none; }',
    '.k-fig .l5-c31 { stroke: var(--ink); stroke-width: 2.4; fill: none; }',
    '.k-fig .l5-zone { fill: var(--paper-2); }',
    '.k-fig .l5-box { fill: var(--input-soft); }',
    '.k-fig .l5-zero { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }',
    '.k-fig .l5-mark-tri { fill: var(--ink-soft); }',
    '.k-fig .l5-mark-sq { fill: var(--paper); stroke: var(--accent); stroke-width: 1.8; }',
    '.k-fig .l5-mark-dia { fill: var(--accent); }',
    '.k-fig .l5-mark-tri-stem { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 4 3; }',
    '.k-fig .l5-mark-sq-stem { stroke: var(--accent); stroke-width: 1.8; stroke-dasharray: 1.5 3; stroke-linecap: round; }',
    '.k-fig .l5-dim { opacity: 0.4; }',
    '.k-fig .l5-rowmark { fill: none; stroke: var(--input); stroke-width: 1.5; }',
    '.k-fig .l5-colband { fill: var(--paper-2); opacity: 0.6; }',
    '.k-fig .l5-colband-even { fill: none; }',
    '.k-fig .l5-conn { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 1.5 3; }',
    '.k-fig .l5-gap { stroke: var(--ink-soft); stroke-width: 1.5; }',
    '.k-fig .l5-box-accent { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 3; }',
    '.k-fig .l5-ring-ghost { fill: var(--paper); stroke: var(--accent); stroke-width: 1.8; }',
    '.k-fig .l5-mark-dia-stem { stroke: var(--accent); stroke-width: 1.2; }',
    '.k-fig .l5-before { opacity: 0.55; }',
    '.k-fig .l5-ideal-thin { stroke: var(--ink-soft); stroke-width: 1; fill: none; }',
  ].join(' ');

  const pow = (x, y, parts, o = {}) => {
    const { anchor = 'middle', cls = 'k-tick', style } = o;
    const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const inner = parts.map(p => (Array.isArray(p) ? `<tspan baseline-shift="super" font-size="75%">${esc(p[0])}</tspan>` : esc(p))).join('');
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}"${style ? ` style="${style}"` : ''}>${inner}</text>`;
  };
  const rim = (cx, cy, R) => g({}, line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }), line(cx, cy - R - 8, cx, cy + R + 8, { cls: 'k-grid' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }));
  const humDot = (cx, cy, R, d, o = {}) => {
    const [x, y] = at(cx, cy, R, d);
    return g({}, line(cx, cy, x, y, { cls: 'l5-spoke-hum' }), o.drop === false ? '' : line(x, y, x, cy, { cls: 'l5-drop' }), circle(x, y, o.r || 5.5, { cls: 'l5-hum' }));
  };
  const ghostDot = (cx, cy, R, d, o = {}) => {
    const [x, y] = at(cx, cy, R, d);
    return g({}, line(cx, cy, x, y, { cls: 'l5-spoke-ghost' }), o.drop === false ? '' : line(x, y, x, cy, { cls: 'l5-drop' }), circle(x, y, o.r || 8, { cls: 'l5-ghost' }));
  };
  const trail = (cx, cy, R, d, i, ghost, o = {}) => {
    const [x, y] = at(cx, cy, R, d);
    const lr = ghost ? R - (o.inset || 17) : R + (o.outset || 15);
    const [lx0, ly0] = at(cx, cy, lr, ghost ? d + 11 : d);
    const near = Math.abs(sind(d)) < 0.12;
    const lx = near ? x + (ghost ? -cosd(d) * 10 : cosd(d) * 16) : lx0;
    const ly = near ? (ghost ? cy + 24 : cy - 11) : ly0;
    return g({}, ghost ? circle(x, y, 4, { cls: 'l5-trail-ghost' }) : circle(x, y, 3.2, { cls: 'l5-hum' }),
      o.label === false || i === '' ? '' : text(lx, ly + 4, String(i), { cls: ghost ? 'k-num-accent' : 'k-tick', style: ghost ? 'font-size:11px' : undefined }));
  };
  const stepping = (frames, d0, dt, draw) => frames.map((f, i) => i < frames.length - 1
    ? g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: d0 + i * dt, len: dt } }, draw(f, i))
    : g({ anim: { k: 'in', d: d0 + i * dt, len: 0.3 } }, draw(f, i)));
  const legendMark = (kind, lx, ly) => kind === 'hum' ? circle(lx + 10, ly - 3, 5, { cls: 'l5-hum' })
    : kind === 'ghost' ? circle(lx + 10, ly - 3, 6, { cls: 'l5-ghost' })
    : kind === 'drop' ? line(lx + 10, ly - 11, lx + 10, ly + 5, { cls: 'l5-drop' })
    : kind === 'stem-ghost' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 8, { cls: 'l5-stem-ghost' }), circle(lx + 10, ly - 8, 4, { cls: 'l5-stem-ghost-dot' }))
    : kind === 'stem-soft' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 8, { cls: 'k-stem-soft' }), circle(lx + 10, ly - 8, 4, { cls: 'k-stem-soft-dot' }))
    : kind === 'zero' ? circle(lx + 10, ly - 3, 4, { cls: 'l5-zero' })
    : kind === 'soft-pt' ? circle(lx + 10, ly - 3, 3, { cls: 'k-stop' })
    : kind === 'zero-x' ? g({}, circle(lx + 10, ly - 3, 4.5, { cls: 'l5-zero' }), line(lx + 7.5, ly - 3, lx + 12.5, ly - 3, { cls: 'k-line', style: 'stroke-width:1.2' }))
    : kind === 'tri-stem' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 6, { cls: 'l5-mark-tri-stem' }), path(`M${lx + 10} ${ly - 11}L${lx + 14.5} ${ly - 2.5}L${lx + 5.5} ${ly - 2.5}Z`, { cls: 'l5-mark-tri' }))
    : kind === 'ring-stem' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 4, { cls: 'l5-mark-sq-stem' }), circle(lx + 10, ly - 8, 4.5, { cls: 'l5-ring-ghost' }))
    : kind === 'ring' ? circle(lx + 10, ly - 3, 4.5, { cls: 'l5-ring-ghost' })
    : kind === 'gap' ? g({}, line(lx + 4, ly - 11, lx + 4, ly + 5, { cls: 'l5-gap' }), line(lx + 18, ly - 11, lx + 18, ly + 5, { cls: 'l5-gap' }))
    : kind === 'sq-stem' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 6, { cls: 'l5-mark-sq-stem' }), rect(lx + 6, ly - 10, 8, 8, { cls: 'l5-mark-sq' }))
    : kind === 'dia-stem' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 6, { cls: 'l5-mark-dia-stem' }), path(`M${lx + 10} ${ly - 11}L${lx + 14.5} ${ly - 6}L${lx + 10} ${ly - 1}L${lx + 5.5} ${ly - 6}Z`, { cls: 'l5-mark-dia' }))
    : kind === 'stem' ? g({}, line(lx + 10, ly + 6, lx + 10, ly - 8, { cls: 'k-stem' }), circle(lx + 10, ly - 8, 4, { cls: 'k-stem-dot' }))
    : kind === 'soft-dot' ? circle(lx + 10, ly - 3, 4, { cls: 'k-stem-soft-dot' })
    : kind === 'tri' ? path(`M${lx + 10} ${ly - 9}L${lx + 15} ${ly}L${lx + 5} ${ly}Z`, { cls: 'l5-mark-tri' })
    : kind === 'sq' ? rect(lx + 5, ly - 8, 9, 9, { cls: 'l5-mark-sq' })
    : kind === 'dia' ? path(`M${lx + 10} ${ly - 10}L${lx + 15} ${ly - 4}L${lx + 10} ${ly + 2}L${lx + 5} ${ly - 4}Z`, { cls: 'l5-mark-dia' })
    : kind === 'box' ? rect(lx + 2, ly - 9, 16, 12, { cls: 'l5-box' })
    : kind === 'zone-fill' ? rect(lx + 2, ly - 9, 16, 12, { cls: 'l5-zone' })
    : kind === 'zone' ? g({}, line(lx + 4, ly - 11, lx + 4, ly + 5, { cls: 'k-guide' }), line(lx + 18, ly - 11, lx + 18, ly + 5, { cls: 'k-guide' }))
    : line(lx, ly - 3, lx + 24, ly - 3, { cls: `${kind} k-legend-line` });
  const legendDots = (x, y, items, o = {}) => {
    const { maxW = 640, dy = 22, cols = 0, dx = 0 } = o;
    let lx = x, ly = y;
    return g({}, items.map(([kind, label], i) => {
      const w = cols ? dx : 32 + label.length * 7.3 + 22;
      if (cols ? i && i % cols === 0 : lx > x && lx + w - 22 > x + maxW) { lx = x; ly += dy; }
      const out = g({}, legendMark(kind, lx, ly), text(lx + 32, ly + 1, label, { anchor: 'start', cls: 'k-label' }));
      lx += w;
      return out;
    }));
  };
  const mirrorLine = (P, label, o = {}) => g({}, line(P.X(4000), P.y0 - (o.over ?? 8), P.X(4000), P.y1, { cls: 'k-guide' }),
    label ? text(P.X(4000), P.y0 - (o.over ?? 8) - 8, label, { cls: 'k-tick' }) : '');

  const meter = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 44, y: 80, w: 296, h: 170, xs: [0, 8000], ys: [0, 1.2] }) : plot({ x: 80, y: 74, w: 600, h: 180, xs: [0, 8000], ys: [0, 1.2] });
    const bw = ph ? 14 : 18;
    const ticks = ph ? [[0, '0'], [1000, '1,000'], [4000, '4,000'], [7000, '7,000']] : range(0, 8000, 1000).map(f => [f, f ? k.hz(f) : '0']);
    const bar = (f, hatch) => rect(P.X(f) - bw / 2, P.Y(0.5), bw, P.Y(0) - P.Y(0.5), hatch ? { cls: 'k-bar-hatch', fill: `url(#${L.slug}-hatch)` } : { cls: 'k-bar' });
    const should = f => g({}, rect(P.X(f) - bw / 2 - 3, P.Y(1), bw + 6, P.Y(0) - P.Y(1), { cls: 'k-guide' }),
      text(P.X(f) + bw / 2 + 8, P.Y(1) + 10, 'should be', { anchor: 'start', cls: 'k-tick' }));
    const slide = P.X(1000) - P.X(500);
    const ay = P.Y(0.5) - 14;
    return [
      axes(P, { xTicks: ticks, yTicks: [[0.5, 'half'], [1, 'full']], zero: false, grid: true, xTitle: ph ? undefined : 'tone, Hz' }),
      mirrorLine(P, ph ? '4,000 Hz' : '4,000 Hz, your line’s limit', { over: 14 }),
      g({ cls: 'l5-before' }, bar(1000, false), bar(7000, true)),
      step(1, 'the hum at 1,000 Hz and a ghost at 7,000 Hz, both at half the height the hum should have; the hum slides down to 500 Hz',
        g({ anim: { k: 'move', dx: slide, d: 1.4, len: 1.6 } }, should(500), bar(500, false), text(P.X(500), P.Y(1) - 10, 'hum', { cls: 'k-name' }))),
      step(2, 'as the hum slides down, the ghost slides up to 7,500 Hz',
        g({ anim: { k: 'move', dx: -slide, d: 1.4, len: 1.6 } }, bar(7500, true), text(P.X(7500), P.Y(0.5) - 30, 'ghost', { cls: 'k-name-accent' })),
        g({ anim: { k: 'in', d: 3.2, len: 0.6 } },
          arrow(L.slug, [[P.X(1000) + bw / 2, ay], [P.X(500) - bw / 2 - 2, ay]]),
          arrow(L.slug, [[P.X(7000) - bw / 2, ay], [P.X(7500) + bw / 2 + 2, ay]], { tone: 'accent' }),
          text(P.x0, P.y1 + (ph ? 40 : 56), ph ? 'faded bars: before, at 1,000 and 7,000 Hz' : 'faded bars: the hum at 1,000 Hz and its ghost at 7,000 Hz, before the slide', { anchor: 'start', cls: 'k-tick' }))),
    ];
  };

  const upsample = L => {
    const ph = L.phone, N = ph ? 6 : 8, s = ph ? 26 : 38, x0 = ph ? 34 : 74;
    const A = plot({ x: x0, y: 66, w: s * (2 * N - 1), h: ph ? 90 : 100, xs: [0, 2 * N - 1], ys: [-1.25, 1.25] });
    const B = plot({ x: x0, y: ph ? 252 : 250, w: A.w, h: A.h, xs: A.xs, ys: A.ys });
    const hum = n => cosd(45 * n), ns = range(0, N - 1);
    return [
      text(x0 - 6, A.y0 - 24, ph ? 'your line: 8,000 samples/s, n' : 'your line: 8,000 samples/s, sample n', { anchor: 'start', cls: 'k-name' }),
      text(x0 - 6, B.y0 - 24, ph ? 'zeros in: 16,000 samples/s, m' : 'zeros in: 16,000 samples/s, sample m', { anchor: 'start', cls: 'k-name' }),
      step(1, `${N} samples of the 1,000 Hz hum on your line, each drawn above the moment it plays`,
        line(A.x0 - 8, A.Y(0), A.x1 + 8, A.Y(0), { cls: 'k-axis' }), stems(A, ns.map(n => [2 * n, hum(n)]), { dot: 4 }),
        ns.map(n => text(A.X(2 * n), A.y1 + 16, String(n), { cls: 'k-tick' }))),
      step(2, 'each sample n is copied straight down to slot m = 2n',
        line(B.x0 - 8, B.Y(0), B.x1 + 8, B.Y(0), { cls: 'k-axis' }),
        ns.map(n => g({ anim: { k: 'in', d: 0.8 + n * 0.12, len: 0.5 } }, g({ anim: { k: 'move', dy: -24, d: 0.8 + n * 0.12, len: 1 } }, stems(B, [[2 * n, hum(n)]], { dot: 4 })))),
        range(0, 2 * N - 1).map(m => text(B.X(m), B.y1 + 16, String(m), { cls: 'k-tick' })),
        ns.map(n => line(A.X(2 * n), A.y1 + 24, A.X(2 * n), B.y0 - 44, { cls: 'l5-conn' }))),
      step(3, 'a zero goes into every gap between them',
        ns.map((n, i) => g({ anim: { k: 'in', d: 2.6 + i * 0.1, len: 0.4 } }, circle(B.X(2 * n + 1), B.Y(0), 4, { cls: 'l5-zero' })))),
      text(ph ? L.W / 2 : B.x0, L.H - 14, ph ? 'n lands at m = 2n; odd m get 0' : 'every sample n lands at m = 2n, and every odd m gets a 0 (hollow)', { anchor: ph ? 'middle' : 'start', cls: 'k-note' }),
    ];
  };

  const wheelTwo = L => {
    const ph = L.phone, R = ph ? 96 : 104;
    const C = ph ? [[180, 190], [180, 530]] : [[190, 200], [530, 200]];
    const spec = [
      { title: 'your line, 8,000 samples/s', sub: '1,000 Hz: 45° · 7,000 Hz: 315°', hum: 45, ghost: 315, flip: 'the flip, 180°, is 4,000 Hz', note: '315° lands where 45° backwards would' },
      { title: 'wideband, 16,000 samples/s', sub: '1,000 Hz: 22.5° · 7,000 Hz: 157.5°', hum: 22.5, ghost: 157.5, flip: 'the flip, 180°, is 8,000 Hz', note: '157.5°: under half a turn, a real tone' },
    ];
    const K = 5, dt = 0.75;
    return [
      step(1, 'two wheels, one per sampling rate, each with its flip at 180 degrees',
        spec.map((sp, w) => {
          const [cx, cy] = C[w];
          return g({}, rim(cx, cy, R),
            text(cx, cy - R - (ph ? 58 : 64), sp.title, { cls: 'k-name' }),
            text(cx, cy - R - (ph ? 40 : 44), sp.sub, { cls: 'k-tick' }),
            text(cx, cy - R - (ph ? 24 : 28), sp.flip, { cls: 'k-tick' }),
            text(cx, cy + R + (ph ? 34 : 36), sp.note, { cls: 'k-note' }));
        })),
      spec.map((sp, w) => {
        const [cx, cy] = C[w], d0 = 0.6 + w * ((K + 1) * dt + 0.6);
        const frames = range(0, K - 1).map(i => [sp.hum * i, sp.ghost * i]);
        return step(2 + w, `${sp.title}: the 1,000 Hz dot steps ${sp.hum} degrees and the 7,000 Hz dot ${sp.ghost} degrees per sample`,
          frames.map(([h, gh], i) => g({ anim: { k: 'in', d: d0 + i * dt, len: 0.3 } }, trail(cx, cy, R, h, i, false), trail(cx, cy, R, gh, i, true, { inset: 22 }))),
          stepping([...frames, frames[1]], d0, dt, ([h, gh]) => g({}, ghostDot(cx, cy, R, gh), humDot(cx, cy, R, h))));
      }),
      ph ? legendDots(40, L.H - 44, [['hum', '1,000 Hz, outside'], ['ghost', '7,000 Hz, inside'], ['drop', 'left-right position']], { cols: 2, dx: 160 })
        : legendDots(40, L.H - 18, [['hum', '1,000 Hz, numbered outside'], ['ghost', '7,000 Hz, numbered inside'], ['drop', 'left-right position']], { maxW: 680 }),
    ];
  };

  const stemsFig = L => {
    const ph = L.phone, last = 8;
    const A = plot({ x: ph ? 40 : 70, y: 56, w: ph ? 300 : 600, h: 150, xs: [-0.6, last + 0.6], ys: [-1.2, 1.2] });
    const B = plot({ x: A.x0, y: 308, w: A.w, h: A.h, xs: A.xs, ys: A.ys });
    const ms = range(0, last), tr = t16(1000), out = m => (m % 2 ? 0 : tr(m));
    const half1 = m => 0.5 * tr(m), half7 = m => 0.5 * t16(7000)(m);
    const xt = ms.map(m => [m, m ? String(m) : 'm = 0']);
    const tri = (x, y) => path(`M${x} ${y - 5}L${x + 4.5} ${y + 3.5}L${x - 4.5} ${y + 3.5}Z`, { cls: 'l5-mark-tri' });
    const zero = (P, m) => circle(P.X(m), P.Y(0), 4.5, { cls: 'l5-zero' });
    return [
      text(A.x0, A.y0 - 22, ph ? 'true 1,000 Hz and the zeros-in output' : 'the true 1,000 Hz tone and the output with zeros in', { anchor: 'start', cls: 'k-name' }),
      axes(A, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: xt }),
      curve(A, tr, { cls: 'k-curve-soft' }),
      ms.filter(m => m % 2).map(m => {
        const x = A.X(m) + 8;
        return g({}, line(x, A.Y(0), x, A.Y(tr(m)), { cls: 'k-stem-accent', style: 'stroke-width:1.5' }), line(x - 3, A.Y(tr(m)), x + 3, A.Y(tr(m)), { cls: 'k-stem-accent', style: 'stroke-width:1.5' }),
          line(x - 3, A.Y(0), x + 3, A.Y(0), { cls: 'k-stem-accent', style: 'stroke-width:1.5' }));
      }),
      ms.filter(m => m % 2).map(m => circle(A.X(m), A.Y(tr(m)), 3, { cls: 'k-stop' })),
      stems(A, pts(out, ms.filter(m => !(m % 2))), { dot: 4.5 }),
      ms.filter(m => m % 2).map(m => zero(A, m)),
      text(A.x0, A.y1 + 44, ph ? 'brackets: what each 0 misses' : 'even m match the true tone; brackets show how far each odd 0 misses it', { anchor: 'start', cls: 'k-note-accent' }),
      text(B.x0, B.y0 - 22, ph ? 'half of 1,000 Hz + half of 7,000 Hz' : 'half of 1,000 Hz plus half of 7,000 Hz, both at 16,000 samples/s', { anchor: 'start', cls: 'k-name' }),
      ms.map(m => rect(B.X(m - 0.42), B.y0, B.X(0.84) - B.X(0), B.y1 - B.y0, { cls: m % 2 ? 'l5-colband' : 'l5-colband-even' })),
      axes(B, { yTicks: [[1, '1'], [0.5, '½'], [-1, `${M}1`]], xTicks: xt }),
      ms.map(m => g({},
        line(B.X(m) - 3, B.Y(0), B.X(m) - 3, B.Y(half1(m)), { cls: 'l5-mark-tri-stem' }),
        line(B.X(m) + 3, B.Y(0), B.X(m) + 3, B.Y(half7(m)), { cls: 'l5-mark-sq-stem' }))),
      stems(B, pts(out, ms.filter(m => !(m % 2))), { dot: 4.5 }),
      ms.filter(m => m % 2).map(m => zero(B, m)),
      ms.map(m => g({}, tri(B.X(m) - 3, B.Y(half1(m))), circle(B.X(m) + 3, B.Y(half7(m)), 4.5, { cls: 'l5-ring-ghost' }))),
      text(B.x0, B.y1 + 44, ph ? 'even m: same; odd m: opposite' : 'even m: the halves agree and add up; odd m: they are opposite and cancel to 0', { anchor: 'start', cls: 'k-note' }),
      ph ? legendDots(40, B.y1 + 72, [['soft-pt', 'true tone (top)'], ['zero', 'a 0 put in'], ['tri-stem', 'half of 1,000 Hz'], ['ring-stem', 'half of 7,000 Hz'], ['stem', 'their sum: the zeros-in output']], { cols: 1, dy: 22 })
        : legendDots(50, B.y1 + 76, [['soft-pt', 'true tone'], ['zero', 'a 0 put in'], ['stem', 'the zeros-in output: the sum'], ['tri-stem', 'half of 1,000 Hz'], ['ring-stem', 'half of 7,000 Hz']], { cols: 3, dx: 200, dy: 24 }),
    ];
  };

  const twoDots = L => {
    const ph = L.phone, R = ph ? 104 : 118;
    const [cx, cy] = ph ? [180, 180] : [180, 220];
    const K = 5, dt = 0.9, d0 = 0.6;
    const rows = range(0, K - 1).map(m => {
      const h = cosd(22.5 * m), gh = cosd(157.5 * m), same = m % 2 === 0;
      return { m, h, gh, same, sum: same ? fmt((h + gh) / 2) : '0' };
    });
    const tx = ph ? [30, 96, 172, 250, 322] : [360, 428, 510, 590, 664];
    const ty = ph ? 350 : 110, rh = ph ? 30 : 32;
    const head = g({},
      text(tx[0], ty, 'm', { cls: 'k-tick' }),
      text(tx[1], ty, '1,000 Hz', { cls: 'k-tick' }), text(tx[2], ty, '7,000 Hz', { cls: 'k-tick', style: 'fill:var(--accent-ink)' }),
      text(tx[3], ty, 'shadows', { cls: 'k-tick' }), text(tx[4], ty, ph ? '½ + ½' : 'half + half', { cls: 'k-tick' }),
      line(tx[0] - 16, ty + 10, ph ? 350 : 706, ty + 10, { cls: 'k-grid' }));
    const row = r => {
      const y = ty + 10 + rh * (r.m + 1) - 8;
      return g({},
        text(tx[0], y, String(r.m), { cls: 'k-num' }), text(tx[1], y, fmt(r.h), { cls: 'k-num' }), text(tx[2], y, fmt(r.gh), { cls: 'k-num-accent' }),
        text(tx[3], y, r.same ? 'same' : 'opposite', { cls: r.same ? 'k-label' : 'k-note-accent', style: r.same ? undefined : 'font-size:15px' }),
        text(tx[4], y, r.sum, { cls: 'k-num', style: 'font-weight:600' }),
        trail(cx, cy, R, 22.5 * r.m, r.m, false), trail(cx, cy, R, 157.5 * r.m, r.m, true, { inset: 22 }));
    };
    const pair = m => g({}, ghostDot(cx, cy, R, 157.5 * m), humDot(cx, cy, R, 22.5 * m));
    return [
      step(1, 'one wheel at 16,000 samples per second and a table of shadows',
        rim(cx, cy, R), head,
        text(cx, cy - R - 34, 'one wheel, 16,000 samples/s', { cls: 'k-name' }),
        text(cx, cy + R + (ph ? 30 : 36), ph ? '7,000 Hz at m: m flips, then −22.5° × m' : '7,000 Hz dot at sample m: m flips plus −22.5° × m', { cls: 'k-note' })),
      rows.slice(0, K - 1).map(r => step(2 + r.m, `sample ${r.m}: shadows ${fmt(r.h)} and ${fmt(r.gh)}, ${r.same ? 'the same' : 'opposite'}, half plus half is ${r.sum}`,
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: d0 + r.m * dt, len: dt } }, pair(r.m)),
        g({ anim: { k: 'in', d: d0 + r.m * dt, len: 0.4 } }, row(r)))),
      step(K + 1, 'sample 4 fills the table, and the wheel comes to rest on sample 1, where the shadows are 0.92 and −0.92: equal and opposite',
        g({ anim: { k: 'in', d: d0 + (K - 1) * dt, len: 0.4 } }, row(rows[K - 1])),
        g({ anim: { k: 'in', d: d0 + K * dt, len: 0.5 } }, pair(1),
          rect(tx[0] - 16, ty + 10 + rh * 2 - 8 - 17, (ph ? 350 : 706) - tx[0] + 16, 24, { cls: 'l5-rowmark', rx: 4 }))),
      ph ? legendDots(30, L.H - 18, [['hum', '1,000 Hz'], ['ghost', '7,000 Hz'], ['drop', 'shadow']], { maxW: 320 })
        : legendDots(340, ty + 10 + rh * 6 + 4, [['hum', '1,000 Hz, numbered outside'], ['ghost', '7,000 Hz, numbered inside'], ['drop', 'shadow: the left-right position']], { cols: 1, dy: 22 }),
    ];
  };

  const mirror = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 30, y: 70, w: 310, h: 170, xs: [0, 8000], ys: [0, 0.62] }) : plot({ x: 60, y: 70, w: 620, h: 170, xs: [0, 8000], ys: [0, 0.62] });
    const shape = f => 0.5 - 0.3 * (f - 300) / 3100;
    const voice = `M${P.X(300)} ${P.Y(0)}` + range(300, 3400, 100).map(f => `L${P.X(f).toFixed(1)} ${P.Y(shape(f)).toFixed(1)}`).join('') + `L${P.X(3400)} ${P.Y(0)}Z`;
    const image = `M${P.X(4600)} ${P.Y(0)}` + range(300, 3400, 100).reverse().map(f => `L${P.X(8000 - f).toFixed(1)} ${P.Y(shape(f)).toFixed(1)}`).join('') + `L${P.X(7700)} ${P.Y(0)}Z`;
    const ticks = ph ? [[0, '0'], [4000, '4,000'], [8000, '8,000']] : range(0, 8000, 1000).map(f => [f, f ? k.hz(f) : '0']);
    const pair = (f, cls) => g({ cls }, circle(P.X(f), P.Y(0), 7, { cls: 'l5-hum' }), circle(P.X(8000 - f), P.Y(0), 8, { cls: 'l5-ghost' }));
    const by = P.y1 + (ph ? 52 : 50);
    return [
      axes(P, { xTicks: ticks, zero: false, xTitle: 'Hz' }),
      mirrorLine(P, ph ? 'mirror, 4,000 Hz' : 'the mirror line, 4,000 Hz', { over: 18 }),
      step(1, 'a tone sweeping up from 300 Hz to 3,400 Hz while its image sweeps down from 7,700 Hz to 4,600 Hz',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.6, len: 3.4 } },
          g({ anim: { k: 'move', dx: P.X(300) - P.X(3400), d: 0.6, len: 3.4 } }, circle(P.X(3400), P.Y(0), 7, { cls: 'l5-hum' })),
          g({ anim: { k: 'move', dx: P.X(7700) - P.X(4600), d: 0.6, len: 3.4 } }, circle(P.X(4600), P.Y(0), 8, { cls: 'l5-ghost' })))),
      step(2, 'the voice band from 300 to 3,400 Hz, taller at low tones, and its image from 4,600 to 7,700 Hz, the same shape flipped',
        g({ anim: { k: 'in', d: 4.2, len: 0.8 } },
          path(voice, { cls: 'k-line', style: 'fill:var(--paper-2)' }),
          path(image, { cls: 'k-bar-hatch', fill: `url(#${L.slug}-hatch)`, style: 'stroke-dasharray:5 3' }),
          text(P.X(1850), P.Y(0.56), ph ? 'voice' : 'the voice, 300 to 3,400 Hz', { cls: 'k-name' }),
          ph ? text(P.X(1850), P.Y(0.56) + 16, '300 to 3,400', { cls: 'k-tick' }) : '', ph ? text(P.X(6150), P.Y(0.56) + 16, '4,600 to 7,700', { cls: 'k-tick' }) : '',
          text(P.X(6150), P.Y(0.56), ph ? 'image' : 'its image, 4,600 to 7,700 Hz', { cls: 'k-name-accent' }))),
      step(3, 'one pair: 1,000 Hz and its image at 7,000 Hz, each 3,000 Hz from the mirror',
        g({ anim: { k: 'in', d: 5.4, len: 0.8 } },
          pair(1000, ''),
          line(P.X(1000), by, P.X(4000), by, { cls: 'k-axis' }), line(P.X(4000), by, P.X(7000), by, { cls: 'k-axis' }),
          [1000, 4000, 7000].map(f => line(P.X(f), by - 5, P.X(f), by + 5, { cls: 'k-axis' })),
          text(P.X(2500), by - 8, '3,000 Hz', { cls: 'k-tick' }), text(P.X(5500), by - 8, '3,000 Hz', { cls: 'k-tick' }),
          text(L.W / 2, by + 28, 'image: 8,000 − tone', { cls: 'k-note-accent' }))),
    ];
  };

  const fill = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 50, y: 50, w: 280, h: 210, xs: [-0.5, 2.5], ys: [-0.05, 1.25] }) : plot({ x: 80, y: 40, w: 360, h: 240, xs: [-0.5, 2.5], ys: [-0.05, 1.25] });
    const tr = t16(1000), avg = (1 + tr(2)) / 2;
    const nx = ph ? L.W / 2 : 480;
    return [
      axes(P, { yTicks: [[0, '0'], [0.5, '0.50'], [1, '1.00']], xTicks: [[0, 'm = 0'], [1, '1'], [2, '2']] }),
      curve(P, tr, { cls: 'k-curve-soft' }),
      line(P.X(0), P.Y(1), P.X(2), P.Y(tr(2)), { cls: 'k-guide' }),
      stems(P, [[0, 1], [2, tr(2)]], { dot: 5 }),
      circle(P.X(1), P.Y(0), 4, { cls: 'l5-zero' }),
      stems(P, [[1, avg]], { cls: 'k-stem-accent', dot: 5 }),
      circle(P.X(1), P.Y(tr(1)), 5, { cls: 'k-stem-soft-dot' }),
      line(P.X(1), P.Y(tr(1)) - 7, P.X(1), P.Y(1.12) + 4, { cls: 'k-guide' }),
      text(P.X(1), P.Y(1.12), '0.92, the true value', { cls: 'k-num' }),
      
      text(P.X(2) - 10, P.Y(tr(2)) + 24, '0.71', { anchor: 'end', cls: 'k-num' }),
      text(P.X(1) + 10, P.Y(0) - 8, ph ? 'the 0 it replaces' : 'the 0 it replaces', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(1) - 10, P.Y(0.66), 'average', { anchor: 'end', cls: 'k-num-accent' }),
      text(P.X(1) - 10, P.Y(0.66) + 16, '0.85', { anchor: 'end', cls: 'k-num-accent' }),
      ph ? g({}, text(nx, 302, 'dashed: the true tone · dotted: straight line', { cls: 'k-tick' }), text(nx, 322, '(1.00 + 0.71) ÷ 2 = 0.85', { cls: 'k-num' }), text(nx, 344, 'the even samples keep their values:', { cls: 'k-tick' }), text(nx, 362, 'only the gaps get filled', { cls: 'k-tick' }))
        : g({},
          text(nx, 120, 'fill the gap with the average', { anchor: 'start', cls: 'k-note' }), text(nx, 144, 'of its two neighbors:', { anchor: 'start', cls: 'k-note' }),
          text(nx, 172, '(1.00 + 0.71) ÷ 2 = 0.85', { anchor: 'start', cls: 'k-num' }),
          text(nx, 196, 'dotted: the straight line', { anchor: 'start', cls: 'k-tick' }),
          text(nx, 196 + 18, 'dashed: the true tone', { anchor: 'start', cls: 'k-tick' }),
          text(nx, 244, 'the even samples keep their values:', { anchor: 'start', cls: 'k-tick' }), text(nx, 262, 'only the gaps get filled', { anchor: 'start', cls: 'k-tick' })),
    ];
  };

  const avgGain = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 48, y: 56, w: 292, h: 200, xs: [0, 8000], ys: [0, 1.1] }) : plot({ x: 80, y: 52, w: 600, h: 220, xs: [0, 8000], ys: [0, 1.1] });
    const keep = f => (1 + cosd(360 * f / 16000)) / 2;
    const ticks = ph ? [[0, '0'], [2000, '2,000'], [4000, '4,000'], [6000, '6,000'], [8000, '8,000']] : range(0, 8000, 1000).map(f => [f, f ? k.hz(f) : '0']);
    const marks = [[1000, '96%', -10, 22, 'end'], [3000, '69%', -10, 22, 'end'], [5000, '31%', 10, -10, 'start'], [7000, '4%', 2, -16, 'start']];
    return [
      axes(P, { yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%']], xTicks: ticks, zero: false, xTitle: 'tone, Hz' }),
      text(P.x0 - 8, P.y0 - 14, 'share of the tone', { anchor: 'start', cls: 'k-tick', style: 'text-anchor:start' }),
      path(`M${P.X(0)} ${P.Y(1)}H${P.X(4000)}V${P.Y(0)}H${P.X(8000)}`, { cls: 'k-curve-soft' }),
      curve(P, keep),
      marks.map(([f, s, dx, dy, a]) => g({}, f > 4000 ? circle(P.X(f), P.Y(keep(f)), 5, { cls: 'l5-ring-ghost' }) : circle(P.X(f), P.Y(keep(f)), 4.5, { cls: 'k-stem-dot' }),
        text(P.X(f) + dx, P.Y(keep(f)) + dy, s, { anchor: a, cls: f > 4000 ? 'k-num-accent' : 'k-num' }))),
      text(P.X(4000) + 8, P.Y(1) + 4, ph ? 'ideal: 100%' : 'ideal: 100% below 4,000 Hz', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(4000) + 8, P.Y(0) - 8, ph ? 'ideal: 0%' : 'ideal: 0% above', { anchor: 'start', cls: 'k-tick' }),
      text(P.X(4400), P.Y(0.72), ph ? 'the average' : 'the average keeps ½(1 + cos φ)', { anchor: 'start', cls: 'k-note' }),
      legendDots(ph ? 30 : 80, P.y1 + 62, [['hum', 'a voice tone'], ['ring', 'its image']], { maxW: 400 }),
    ];
  };

  const curvesAxes = (P, ph, lo = 3400, gapNote = '') => g({},
    line(P.X(lo), P.y0 - 6, P.X(lo), P.y1, { cls: 'l5-gap' }), line(P.X(8000 - lo), P.y0 - 6, P.X(8000 - lo), P.y1, { cls: 'l5-gap' }),
    text(P.X(4000), P.y0 - 14, ph ? `the gap${gapNote ? ', not counted' : ''}` : `the gap: voice ends, image starts${gapNote}`, { cls: 'k-tick' }),
    axes(P, { grid: true, yTicks: [[0, '0%'], [0.5, '50%'], [1, '100%'], [1.1, '110%']], xTicks: ph ? [[0, '0'], [4000, '4,000'], [8000, '8,000']] : range(0, 8000, 1000).map(f => [f, f ? k.hz(f) : '0']), zero: false, xTitle: 'tone, Hz' }),
    text(P.x0 - 8, P.y0 - 14, ph ? 'share' : 'share of the tone', { anchor: ph ? 'end' : 'start', cls: 'k-tick', style: ph ? undefined : 'text-anchor:start' }));
  const specBoxes = (P, lo = 300, hi = 3400) => g({},
    rect(P.X(lo), P.Y(1.1), P.X(hi) - P.X(lo), P.Y(0.9) - P.Y(1.1), { cls: 'l5-box' }),
    line(P.X(lo), P.Y(1.1), P.X(hi), P.Y(1.1), { cls: 'k-edge' }), line(P.X(lo), P.Y(0.9), P.X(hi), P.Y(0.9), { cls: 'k-edge' }),
    rect(P.X(8000 - hi), P.Y(0.08), P.X(8000 - lo) - P.X(8000 - hi), P.Y(0) - P.Y(0.08), { cls: 'l5-box' }),
    line(P.X(8000 - hi), P.Y(0.08), P.X(8000 - lo), P.Y(0.08), { cls: 'k-edge' }));
  const ideal = P => path(`M${P.X(0)} ${P.Y(1)}H${P.X(4000)}V${P.Y(0)}H${P.X(8000)}`, { cls: 'l5-ideal-thin' });
  const curvesPlot = ph => (ph ? plot({ x: 44, y: 50, w: 296, h: 220, xs: [0, 8000], ys: [0, 1.15] }) : plot({ x: 70, y: 50, w: 610, h: 250, xs: [0, 8000], ys: [0, 1.15] }));
  const pointer = (P, f, v, ly, label, cls = 'k-num') => g({},
    line(P.X(f) + 4, P.Y(ly) + 4, P.X(f) + 1, P.Y(v) - 5, { cls: 'k-guide' }),
    text(P.X(f) + 8, P.Y(ly), label, { anchor: 'start', cls }));

  const gainCurves = L => {
    const ph = L.phone, P = curvesPlot(ph);
    const c = (N, cls) => curve(P, share(N), { cls, n: 480 });
    const items = [['l5-c3', ph ? 'average (3)' : 'neighbor average (3)'], ['l5-c7 l5-dim', '7 samples'], ['l5-c15 l5-dim', '15 samples'], ['l5-c31', '31 samples'], ['l5-ideal-thin', 'the ideal step'], ['gap', ph ? 'the gap' : 'the gap, 3,400 to 4,600 Hz']];
    return [
      curvesAxes(P, ph), ideal(P),
      c(7, 'l5-c7 l5-dim'), c(15, 'l5-c15 l5-dim'), c(3, 'l5-c3'), c(31, 'l5-c31'),
      legendDots(ph ? 30 : 70, P.y1 + (ph ? 56 : 62), items, ph ? { cols: 2, dx: 170, dy: 22 } : { maxW: 620, dy: 24 }),
    ];
  };

  const downsample = L => {
    const ph = L.phone, s = ph ? 28 : 34, x0 = ph ? 34 : 60;
    const A = plot({ x: x0, y: 64, w: s * 10, h: 100, xs: [0, 10], ys: [-1.25, 1.25] });
    const B = plot({ x: x0, y: 236, w: s * 10, h: 100, xs: [0, 10], ys: [-1.25, 1.25] });
    const six = t16(6000), ms = range(0, 10), kept = range(0, 5);
    const [cx, cy, R] = ph ? [180, 500, 74] : [588, 180, 76];
    const p0 = at(cx, cy, R, 0), p270 = at(cx, cy, R, 270);
    const rf = R * 0.6, rb = R + 14;
    return [
      text(x0 - 6, A.y0 - 24, ph ? 'a 6,000 Hz “s”, 16,000 samples/s, m' : 'a 6,000 Hz “s” at 16,000 samples/s, sample m', { anchor: 'start', cls: 'k-name' }),
      text(x0 - 6, B.y0 - 24, ph ? 'kept, your line: 8,000/s, n' : 'kept, on your line: 8,000 samples/s, sample n', { anchor: 'start', cls: 'k-name' }),
      line(A.x0 - 8, A.Y(0), A.x1 + 8, A.Y(0), { cls: 'k-axis' }),
      ms.map(m => text(A.X(m), A.y1 + 16, String(m), { cls: 'k-tick' })),
      text(A.x0 - 14, A.y1 + 16, 'm', { anchor: 'end', cls: 'k-tick' }),
      step(1, 'eleven samples of the 6,000 Hz tone, 135 degrees per sample; the odd ones fade',
        stems(A, pts(six, ms.filter(m => !(m % 2))), { dot: 4 }),
        g({ cls: 'k-faint', anim: { k: 'fade', o0: 1, d: 1.2, len: 1 } }, stems(A, pts(six, ms.filter(m => m % 2)), { dot: 4 }), text(A.X(3) + 8, A.Y(0.71) - 6, 'gray: dropped', { anchor: 'start', cls: 'k-tick' }))),
      step(2, 'every odd sample is dropped; each kept sample m = 2n becomes sample n on your line: 1, 0, −1, 0, 1, 0',
        line(B.x0 - 8, B.Y(0), B.x1 + 8, B.Y(0), { cls: 'k-axis' }),
        kept.map(n => line(A.X(2 * n), A.y1 + 24, A.X(2 * n), B.y0 - 44, { cls: 'l5-conn' })),
        kept.map(n => g({ anim: { k: 'in', d: 2.4 + n * 0.12, len: 0.5 } }, g({ anim: { k: 'move', dy: -24, d: 2.4 + n * 0.12, len: 1 } }, stems(B, [[2 * n, six(2 * n)]], { dot: 4 })))),
        kept.map(n => text(B.X(2 * n), B.y1 + 16, String(n), { cls: 'k-tick' })), text(B.x0 - 14, B.y1 + 16, 'n', { anchor: 'end', cls: 'k-tick' })),
      step(3, 'a 2,000 Hz tone, 90 degrees per sample on your line, passes through every kept sample',
        g({ anim: { k: 'in', d: 4.4, len: 1 } }, curve(B, m => cosd(45 * m), { from: -0.3, to: 10.3, cls: 'k-curve-accent' }),
          text(B.x0 + 2, B.y1 + 36, ph ? 'dotted: 2,000 Hz' : 'dotted: a 2,000 Hz tone on your line', { anchor: 'start', cls: 'k-num-accent' }))),
      step(4, 'on the wheel, 270 degrees forwards lands where 90 degrees backwards does',
        g({ anim: { k: 'in', d: 5.8, len: 0.8 } },
          rim(cx, cy, R),
          text(cx, cy - R - (ph ? 26 : 30), ph ? 'one kept sample to the next' : 'from one kept sample to the next', { cls: 'k-name' }),
          path(`M${cx + rf} ${cy}A${rf} ${rf} 0 1 0 ${cx} ${cy + rf}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
          path(`M${cx + rb} ${cy}A${rb} ${rb} 0 0 1 ${cx + 2} ${cy + rb}`, { cls: 'k-arrow k-accent', 'marker-end': `url(#${L.slug}-arrow-accent)`, style: 'stroke-dasharray:5 3' }),
          line(cx, cy, p0[0], p0[1], { cls: 'l5-spoke-hum' }), line(cx, cy, p270[0], p270[1], { cls: 'l5-spoke-hum' }),
          circle(p0[0], p0[1], 4, { cls: 'k-stop' }), circle(p270[0], p270[1], 6, { cls: 'l5-hum' }),
          text(cx, cy + R + 40, 'solid, inside: 270° forwards', { cls: 'k-num' }),
          text(cx, cy + R + 60, 'dashed: 90° backwards = 2,000 Hz', { cls: 'k-num-accent' }),
          text(cx, cy + R + 86, ph ? '135° per wideband sample, twice' : '135° per wideband sample, twice', { cls: 'k-note' }))),
    ];
  };

  const flip = L => {
    const ph = L.phone, R = ph ? 50 : 62, K = 4, dt = 0.9, d0 = 0.6;
    const W = [
      { name: 'a flip every sample', sub: ['(−1)', ['m'], ': 1, −1, 1, −1'], stepDeg: 180, val: m => (m % 2 ? -1 : 1), f: v => (v > 0 ? '1' : `${M}1`), stack: true },
      { name: 'the hum, 1,000 Hz', sub: ph ? '22.5° per sample, 16,000/s' : '22.5° per sample at 16,000/s', stepDeg: 22.5, val: m => cosd(22.5 * m), f: v => fmt(v) },
      { name: 'the image, 7,000 Hz', sub: ph ? '157.5° = 180° − 22.5°' : '157.5° per sample = 180° − 22.5°', stepDeg: 157.5, val: m => cosd(157.5 * m), f: v => fmt(v), ghost: true },
    ];
    const C = ph ? W.map((_, i) => [80, 110 + i * 170]) : W.map((_, i) => [140 + i * 232, 140]);
    const col = (i, m) => (ph ? 196 + 40 * m : C[i][0] - 66 + 44 * m);
    const vy = i => (ph ? C[i][1] + 30 : 296);
    const ops = ph ? [['×', 80, 195], ['=', 80, 365]] : [['×', 256, 140], ['=', 488, 140]];
    return [
      step(1, 'three wheels: a flip every sample, the hum at 22.5 degrees, and the image at 157.5 degrees',
        W.map((w, i) => {
          const [cx, cy] = C[i];
          return g({}, rim(cx, cy, R),
            text(ph ? 162 : cx, ph ? cy - 26 : cy - R - 40, w.name, { anchor: ph ? 'start' : 'middle', cls: w.ghost ? 'k-name-accent' : 'k-name' }),
            Array.isArray(w.sub) ? pow(ph ? 162 : cx, ph ? cy - 8 : cy - R - 22, w.sub, { anchor: ph ? 'start' : 'middle' }) : text(ph ? 162 : cx, ph ? cy - 8 : cy - R - 22, w.sub, { anchor: ph ? 'start' : 'middle', cls: 'k-tick' }),
            range(0, K - 1).map(m => text(col(i, m), ph ? C[i][1] + 12 : 272, ph ? `m=${m}` : String(m), { cls: 'k-tick', style: ph ? 'font-size:10px' : undefined })));
        }),
        ops.map(([s, x, y]) => text(x, y + 8, s, { cls: 'k-name', style: 'font-size:24px' })),
        ph ? ''
          : g({}, text(C[0][0] - 86, 272, 'm', { anchor: 'end', cls: 'k-tick' }), text(C[0][0] - 86, 296, 'shadow', { anchor: 'end', cls: 'k-tick' }))),
      range(0, K - 1).map(m => step(2 + m, `sample ${m}: ${W[0].f(W[0].val(m))} times ${W[1].f(W[1].val(m))} equals ${W[2].f(W[2].val(m))}`,
        g(m < K - 1 ? { cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: d0 + m * dt, len: dt } } : { anim: { k: 'in', d: d0 + m * dt, len: 0.3 } },
          W.map((w, i) => (w.ghost ? ghostDot : humDot)(C[i][0], C[i][1], R, w.stepDeg * m, { r: w.ghost ? 7 : 5 }))),
        g({ anim: { k: 'in', d: d0 + m * dt, len: 0.4 } }, W.map((w, i) => g({},
          text(col(i, m), vy(i), w.f(w.val(m)), { cls: w.ghost ? 'k-num-accent' : 'k-num' }),
          trail(C[i][0], C[i][1], R, w.stepDeg * m, w.stack ? (m === 0 ? '0, 2' : m === 1 ? '1, 3' : '') : m, w.ghost, { inset: 16, outset: w.stack ? (ph ? 14 : 22) : 13 })))))),
      ph ? text(L.W / 2, L.H - 34, 'shadow × shadow = shadow (shadow: left-right position)', { cls: 'k-tick' }) : pow(L.W / 2, L.H - 18, ['shadow times shadow equals shadow: (−1)', ['m'], ' cos(22.5° m) = cos(157.5° m)'], { cls: 'k-note' }),
      ph ? pow(L.W / 2, L.H - 12, ['(−1)', ['m'], ' cos(22.5° m) = cos(157.5° m)']) : text(L.W / 2, L.H - 50, 'shadow: the left-right position of a dot', { cls: 'k-tick' }),
    ];
  };

  const triple = L => {
    const ph = L.phone;
    const A = ph ? plot({ x: 40, y: 60, w: 300, h: 170, xs: [-0.5, 3.7], ys: [-0.5, 1.1] }) : plot({ x: 70, y: 56, w: 610, h: 170, xs: [-0.5, 6.7], ys: [-0.5, 1.1] });
    const t24 = f => m => cosd(360 * f * m / 24000);
    const out = m => (m % 3 ? 0 : cosd(45 * m / 3));
    const ms = range(0, ph ? 3 : 6);
    const tri = (x, y) => path(`M${x} ${y - 5}L${x + 4.5} ${y + 3.5}L${x - 4.5} ${y + 3.5}Z`, { cls: 'l5-mark-tri' });
    const sq = (x, y) => rect(x - 4, y - 4, 8, 8, { cls: 'l5-mark-sq' });
    const dia = (x, y) => path(`M${x} ${y - 5}L${x + 4.5} ${y}L${x} ${y + 5}L${x - 4.5} ${y}Z`, { cls: 'l5-mark-dia' });
    const ring = (x, y) => circle(x, y, 4.5, { cls: 'l5-ring-ghost' });
    const series = [[-0.27, 1000, 'l5-mark-tri-stem', tri], [0.2, 7000, 'l5-mark-sq-stem', ring], [0.38, 9000, 'l5-mark-dia-stem', dia]];
    const F = ph ? plot({ x: 40, y: 380, w: 290, h: 110, xs: [0, 12000], ys: [0, 0.45] }) : plot({ x: 70, y: 370, w: 300, h: 120, xs: [0, 12000], ys: [0, 0.45] });
    return [
      text(A.x0, A.y0 - 22, ph ? 'upsampled by 3: 24,000 samples/s' : 'upsampled by 3, 24,000 samples/s: the output is three tones at a third', { anchor: 'start', cls: 'k-name' }),
      axes(A, { yTicks: [[1, '1'], [1 / 3, '⅓'], [-1 / 3, `${M}⅓`]], xTicks: ms.map(m => [m, m ? String(m) : 'm = 0']) }),
      ms.map(m => series.map(([o, f, cls, mk]) => { const v = t24(f)(m) / 3; return g({}, line(A.X(m + o), A.Y(0), A.X(m + o), A.Y(v), { cls }), mk(A.X(m + o), A.Y(v))); })),
      stems(A, pts(out, ms), { dot: 4.5 }),
      legendDots(ph ? 40 : 70, A.y1 + 50, [['tri-stem', '⅓ of 1,000 Hz'], ['ring-stem', '⅓ of 7,000 Hz'], ['dia-stem', '⅓ of 9,000 Hz'], ['stem', ph ? 'output = sum' : 'the output, their sum']], ph ? { cols: 2, dx: 150, dy: 22 } : { maxW: 660 }),
      text(F.x0, F.y0 - 34, ph ? 'tones after the zeros' : 'the tones after the zeros', { anchor: 'start', cls: 'k-name' }),
      axes(F, { xTicks: ph ? [[0, '0'], [8000, '8,000'], [12000, '12,000']] : [[0, '0'], [4000, '4,000'], [8000, '8,000'], [12000, '12,000 Hz']], yTicks: [[1 / 3, '⅓']], zero: false }),
      line(F.X(8000), F.y0 - 6, F.X(8000), F.y1, { cls: 'k-guide' }),
      line(F.X(12000), F.y0 - 6, F.X(12000), F.y1, { cls: 'k-guide' }),
      text(F.X(12000), F.y0 - 12, 'limit', { anchor: 'middle', cls: 'k-tick' }),
      text(F.X(8000), F.y0 - 12, 'mirror', { cls: 'k-tick' }),
      bars(F, [{ x: 1000, v: 1 / 3, label: '' }, { x: 7000, v: 1 / 3, label: '', cls: 'k-bar-hatch', fill: `url(#${L.slug}-hatch)` }, { x: 9000, v: 1 / 3, label: '', cls: 'k-bar-hatch', fill: `url(#${L.slug}-hatch)` }], { width: ph ? 12 : 14 }),
      text(F.X(1000), F.Y(1 / 3) - 8, '1,000', { cls: 'k-num' }),
      text(F.X(7000) - 4, F.Y(1 / 3) - 8, '7,000', { anchor: 'end', cls: 'k-num-accent' }),
      text(F.X(9000) + 4, F.Y(1 / 3) - 8, '9,000', { anchor: 'start', cls: 'k-num-accent' }),
      text(F.X(8000), F.y1 + 40, ph ? 'images at 8,000 ± 1,000' : 'images at 8,000 − 1,000 and 8,000 + 1,000', { cls: 'k-note-accent', style: 'font-size:15px' }),
    ];
  };

  const byTwo = L => {
    const ph = L.phone, R = ph ? 74 : 96;
    const [cx, cy] = ph ? [236, 150] : [440, 160];
    const p157 = at(cx, cy, R, 157.5), p202 = at(cx, cy, R, 202.5);
    const dia = (x, y) => path(`M${x} ${y - 6}L${x + 5.5} ${y}L${x} ${y + 6}L${x - 5.5} ${y}Z`, { cls: 'l5-mark-dia' });
    return [
      rim(cx, cy, R),
      text(ph ? L.W / 2 : cx, cy - R - 24, ph ? 'one wheel, 16,000 samples/s' : 'upsampling by 2: one wheel, 16,000 samples/s', { cls: 'k-name' }),
      path(`M${cx + R * 0.5} ${cy}A${R * 0.5} ${R * 0.5} 0 0 0 ${(cx + R * 0.5 * cosd(202.5)).toFixed(1)} ${(cy - R * 0.5 * sind(202.5)).toFixed(1)}`, { cls: 'k-arrow', 'marker-end': `url(#${L.slug}-arrow)` }),
      line(cx, cy, p202[0], p202[1], { cls: 'l5-spoke-ghost' }), line(cx, cy, p157[0], p157[1], { cls: 'l5-spoke-ghost' }),
      line(p157[0], cy, p202[0], p202[1], { cls: 'l5-drop' }), line(p157[0], p157[1], p157[0], cy, { cls: 'l5-drop' }),
      dia(p202[0], p202[1]), circle(p157[0], p157[1], 7, { cls: 'l5-ghost' }),
      text(p157[0] - 14, p157[1] - 6, '7,000 Hz: 157.5°', { anchor: 'end', cls: 'k-num-accent' }),
      text(p202[0] - 14, p202[1] + 16, '9,000 Hz: 202.5°', { anchor: 'end', cls: 'k-num-accent' }),
      text(cx + R * 0.5 + 6, cy - 22, '202.5° turn', { anchor: 'start', cls: 'k-tick' }),
      text(ph ? L.W / 2 : cx, cy + R + 32, ph ? 'same left-right position, same samples:' : 'the same left-right position, so the same samples:', { cls: 'k-note', style: 'font-size:15px' }),
      text(ph ? L.W / 2 : cx, cy + R + 54, 'one image, not two', { cls: 'k-note', style: 'font-size:15px' }),
    ];
  };

  const target = L => {
    const ph = L.phone, P = curvesPlot(ph);
    const s31 = share(31);
    return [
      curvesAxes(P, ph, 3400, '; not counted'), specBoxes(P), ideal(P),
      curve(P, s31, { cls: 'l5-c31', n: 480 }),
      k.check(P.X(300) + 8, P.Y(1.1) - 14),
      text(P.X(300) + 22, P.Y(1.1) - 8, 'voice measured 95% to 107%', { anchor: 'start', cls: 'k-num', style: ph ? 'font-size:11px' : undefined }),
      circle(P.X(4600), P.Y(s31(4600)), 4, { cls: 'k-stem-accent-dot' }),
      pointer(P, 4600, s31(4600), 0.3, ph ? 'images: 7.3%' : 'images measured: peak 7.3%', 'k-num-accent'),
      text(P.X(4600) + 8, P.Y(0.3) + 18, ph ? '4,600 Hz, under 8%' : 'at 4,600 Hz, just under the 8% ceiling', { anchor: 'start', cls: 'k-tick' }),
      k.check(P.X(7700) - 8, P.Y(0.08) - 14),
      legendDots(ph ? 30 : 70, P.y1 + (ph ? 56 : 62), [['l5-c31', ph ? '31 samples' : 'the 31-sample rule'], ['l5-ideal-thin', 'the ideal step'], ['box', ph ? 'target' : 'target: 90% to 110%, under 8%'], ['gap', 'the gap']], ph ? { cols: 2, dx: 160 } : { maxW: 620 }),
    ];
  };

  const bridge = L => {
    const ph = L.phone;
    if (ph) {
      const bw = 150, bh = 52, gap = 30, cols = [[18, 'up', ['your line', '8,000/s'], ['zeros in', 'one 0 per gap'], ['low-pass', 'gain 2, cutoff 4,000 Hz'], ['wideband', '16,000/s']], [192, 'down', ['wideband', '16,000/s'], ['low-pass', 'gain 1, cutoff 4,000 Hz'], ['keep every other', 'drop the odd ones'], ['your line', '8,000/s']]];
      return cols.map(([x, name, ...bs]) => g({},
        text(x + bw / 2, 30, name, { cls: 'k-name' }),
        bs.slice(0, -1).map((_, i) => arrow(L.slug, [[x + bw / 2, 48 + i * (bh + gap) + bh + 2], [x + bw / 2, 48 + (i + 1) * (bh + gap) - 4]])),
        bs.map(([n, s], i) => box(x, 48 + i * (bh + gap), bw, bh, { name: n, sub: s, cls: n === 'low-pass' ? 'l5-box-accent' : 'k-box' })),
      )).concat([text(L.W / 2, L.H - 32, 'arrows: samples flow', { cls: 'k-tick' }), text(L.W / 2, L.H - 12, 'same cutoff; the place and gain change', { cls: 'k-tick' })]);
    }
    const bw = 144, bh = 56, gap = 26, x0 = 58;
    const rows = [[44, 'up', ['your line', '8,000 samples/s'], ['zeros in', 'one 0 in each gap'], ['low-pass', 'gain 2, cutoff 4,000 Hz'], ['wideband', '16,000 samples/s']], [160, 'down', ['wideband', '16,000 samples/s'], ['low-pass', 'gain 1, cutoff 4,000 Hz'], ['keep every other', 'drop the odd ones'], ['your line', '8,000 samples/s']]];
    return rows.map(([y, name, ...bs]) => g({},
      text(x0 - 12, y + bh / 2 + 5, name, { anchor: 'end', cls: 'k-name' }),
      bs.slice(0, -1).map((_, i) => arrow(L.slug, [[x0 + i * (bw + gap) + bw + 2, y + bh / 2], [x0 + (i + 1) * (bw + gap) - 4, y + bh / 2]])),
      bs.map(([n, s], i) => box(x0 + i * (bw + gap), y, bw, bh, { name: n, sub: s, cls: n === 'low-pass' ? 'l5-box-accent' : 'k-box' })),
    )).concat([text(L.W / 2, L.H - 14, 'arrows: samples flow. The cutoff is the same both ways; the place and the gain change.', { cls: 'k-tick' })]);
  };

  const fig = (name, size, phoneH, title, desc, caption, body, steps = 0) => ({
    name, w: 720, h: size, phone: { w: 360, h: phoneH }, title, desc, caption, steps, css: CSS,
    eyebrow: 'Lesson 5 · changing the sampling rate', body: (kk, L) => body(L),
  });

  return [
    fig('meter', 340, 340, 'The meter: a hum and a ghost',
      'On a frequency meter from 0 to 8,000 Hz, a 1,000 Hz hum and a ghost at 7,000 Hz both stand at half the height the hum should have; as the hum slides down to 500 Hz, the ghost slides up to 7,500 Hz.',
      'The wideband side on a frequency meter. The hum comes through at half height, with a ghost just as strong above 4,000 Hz, and when the hum slides down the ghost slides up.', meter, 2),
    fig('upsample', 412, 412, 'Upsampling: a zero in every gap',
      'Eight samples of the 1,000 Hz hum at 8,000 samples per second move apart to every other slot of a 16,000 samples per second line, and a zero drops into each gap.',
      'The obvious bridge. Each sample n goes to slot m = 2n, and every odd slot gets a 0.', upsample, 3),
    fig('wheel-two-speeds', 430, 800, 'One tone, two wheel speeds',
      'On a wheel at 8,000 samples per second, 1,000 Hz steps 45 degrees and 7,000 Hz steps 315 degrees, landing on the 1,000 Hz mirror spots; at 16,000 samples per second they step 22.5 and 157.5 degrees, and the flip moves from 4,000 Hz to 8,000 Hz.',
      'The same two tones on both lines, coming to rest on sample 1. At 8,000 samples/s, 7,000 Hz lands on 1,000 Hz’s mirror spots, so the samples cannot tell them apart. At 16,000 samples/s it turns 157.5°, a real tone of its own.', wheelTwo, 3),
    fig('stems', 590, 650, 'The zeros are two half tones',
      'The output with zeros in matches the true 1,000 Hz tone on even samples and is zero on odd ones; half of 1,000 Hz plus half of 7,000 Hz gives exactly that output, agreeing on even samples and cancelling on odd ones.',
      'Top: the output with zeros in, against the true tone it should have been. Bottom: half of 1,000 Hz (triangles) and half of 7,000 Hz (rings) at each m; their sum, the solid stems and hollow zeros, is that output exactly.', stemsFig),
    fig('two-dots', 400, 560, 'Same shadow, opposite shadow',
      'On one wheel at 16,000 samples per second, the 1,000 Hz dot steps 22.5 degrees and the 7,000 Hz dot 157.5 degrees; on even samples their left-right shadows are the same, on odd samples opposite, so half plus half gives 1.00, 0, 0.71, 0, 0.00.',
      'Both dots on one wheel at 16,000 samples/s, sample by sample. Even samples: the 7,000 Hz dot sits at the 1,000 Hz dot’s mirror spot, the same shadow. Odd samples: one flip is left over, the opposite shadow. The wheel rests on sample 1, the outlined row: 0.92 and −0.92.', twoDots, 6),
    fig('mirror', 360, 380, 'Every tone has an image across 4,000 Hz',
      'As a tone sweeps from 300 Hz to 3,400 Hz its image sweeps from 7,700 Hz down to 4,600 Hz; the voice band and its image are the same shape flipped across a mirror line at 4,000 Hz, and 1,000 Hz pairs with 7,000 Hz, each 3,000 Hz from the mirror.',
      'The mirror rule. A tone and its image sit equally far either side of 4,000 Hz, so the whole voice comes back upside down from 4,600 Hz to 7,700 Hz.', mirror, 3),
    fig('fill', 320, 380, 'Fill the gap with the average',
      'Between the samples 1.00 and 0.71 the gap gets their average, 0.85, while the true 1,000 Hz tone is 0.92 there.',
      'The neighbor average fills the gap with 0.85. The true tone passes through 0.92: close, not right.', fill),
    fig('average-gain', 370, 370, 'The neighbor average is a gentle slope',
      'What the neighbor average leaves of each tone after the zeros, half of 1 + cos φ, falls smoothly from 100% at 0 Hz to 0% at 8,000 Hz, while the ideal holds 100% up to 4,000 Hz and 0% above; 1,000 Hz keeps 96% and its image 4%, 3,000 Hz keeps 69% and its image 31%.',
      'What the neighbor average leaves of each tone, as a share of its height on your line, against the ideal. It slopes gently where the ideal steps, so 3,000 Hz and its image at 5,000 Hz come out almost alike.', avgGain),
    fig('gain-curves', 430, 440, 'Longer rules step more steeply',
      'Output share from 0 to 8,000 Hz for the neighbor average and rules of 7, 15 and 31 samples against the ideal step; longer rules step more steeply at 4,000 Hz, and the long ones overshoot just below the step and ripple just above it.',
      'Each curve is one rule’s output height as a share of the tone’s height on your line. The two upright lines mark the gap between the top of the voice, 3,400 Hz, and its image, 4,600 Hz. Longer is steeper, but the ripple shrinks slowly.', gainCurves),
    fig('downsample', 380, 680, 'Downsampling folds 6,000 Hz onto 2,000 Hz',
      'Eleven samples of a 6,000 Hz tone at 16,000 samples per second lose every odd sample; the kept samples 1, 0, −1, 0, 1, 0 are a 2,000 Hz tone on your line, because 270 degrees forwards lands where 90 degrees backwards does.',
      'Keep every other sample of the “s” and the dot turns 270° between two kept samples, the same spot as 90° backwards: a 2,000 Hz tone, at full height.', downsample, 4),
    fig('flip', 370, 600, 'A flip every sample makes the image',
      'Three wheels step together: a dot flipping 180 degrees every sample, the hum at 22.5 degrees, and the image at 157.5 degrees; at every sample the first two shadows multiply to the third: 1.00, −0.92, 0.71, −0.38.',
      'Multiply the flip’s shadow by the hum’s shadow, sample by sample, and you get the shadow of a dot turning 180° − 22.5° = 157.5°: the image.', flip, 5),
    fig('triple', 560, 570, 'Upsampling by 3 makes two images',
      'Upsampled by 3, the hum becomes 1, 0, 0, 0.71, 0, 0, 0.00, which is a third of 1,000 Hz plus a third of 7,000 Hz plus a third of 9,000 Hz: two images at 8,000 Hz minus and plus 1,000 Hz.',
      'Upsampling by 3: the hum keeps a third and two images take a third each, the hum’s distance either side of 8,000 Hz.', triple),
    fig('by-two', 330, 330, 'Upsampling by 2 has one image',
      'At 16,000 samples per second, 9,000 Hz turns 202.5 degrees per sample, the same spot as 157.5 degrees backwards, so its left-right position matches 7,000 Hz at every sample and it gives the same samples.',
      'Why upsampling by 2 has only one image: 9,000 Hz turns 202.5°, which is 157.5° backwards. Its left-right position matches 7,000 Hz, so its samples are the same.', byTwo),
    fig('target', 410, 400, 'The target for your bridge',
      'The 31-sample rule passes the voice band between 95% and 107%, inside the 90% to 110% box, and its image ripple peaks at 7.3% at 4,600 Hz, just under the 8% ceiling.',
      'The spec, and the rule that meets it. The 31-sample curve stays inside the voice box and under the ceiling, with only 0.7% to spare at 4,600 Hz.', target),
    fig('bridge', 270, 410, 'Where the cutoff goes, each way',
      'Going up: your line at 8,000 samples per second, zeros in, a low-pass with its cutoff at 4,000 Hz and gain 2, the wideband line. Going down: the wideband line, the same low-pass with gain 1, keep every other sample, your line.',
      'Up: zeros first, then the step, because the images only exist once the zeros make them. Down: the step first, then the drop, because after the drop an alias and a true tone look the same.', bridge),
  ];
};
