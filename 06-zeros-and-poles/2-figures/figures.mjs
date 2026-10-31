export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, curve, stems, step, check, cross, fmt, cosd, sind, range, hz } = k;
  const M = '−', FS = 8000;
  const r2 = v => Math.round(v * 100) / 100;
  const r1 = v => Math.round(v * 10) / 10;
  const poly = (pts, o = {}) => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), o);
  const polar = (cx, cy, R) => (r, d) => [cx + r * R * cosd(d), cy - r * R * sind(d)];
  const arcD = (cx, cy, R, d0, d1) => {
    const [x0, y0] = polar(cx, cy, R)(1, d0), [x1, y1] = polar(cx, cy, R)(1, d1);
    return `M${r2(x0)} ${r2(y0)}A${R} ${R} 0 ${Math.abs(d1 - d0) > 180 ? 1 : 0} ${d1 > d0 ? 0 : 1} ${r2(x1)} ${r2(y1)}`;
  };
  const inkHead = slug => `<defs><marker id="${slug}-ink" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="z6-head" points="0 0, 8 3, 0 6"/></marker></defs>`;
  const vec = (slug, x1, y1, x2, y2, o = {}) => {
    const { cls = 'z6-vec', head = 'ink', ...rest } = o;
    const id = head === 'ink' ? `${slug}-ink` : head === 'accent' ? `${slug}-arrow-accent` : `${slug}-arrow`;
    return line(x1, y1, x2, y2, { cls: `spoke ${cls}`, 'marker-end': `url(#${id})`, ...rest });
  };
  const arcArrow = (slug, cx, cy, R, d0, d1, o = {}) => {
    const { cls = 'z6-turn', head = 'ink', ...rest } = o;
    const id = head === 'ink' ? `${slug}-ink` : head === 'accent' ? `${slug}-arrow-accent` : `${slug}-arrow`;
    return path(arcD(cx, cy, R, d0, d1), { cls: `spoke ${cls}`, 'marker-end': `url(#${id})`, ...rest });
  };
  const rich = (x, y, html, o = {}) => { const { anchor = 'middle', ...rest } = o; return `<text ${k.attrs({ x: r2(x), y: r2(y), 'text-anchor': anchor, cls: 'k-label', ...rest })}>${html}</text>`; };
  const sup = s => `<tspan class="z6-sup" dy="-6">${s}</tspan><tspan dy="6">\u200b</tspan>`;
  const zeroO = (x, y, s = 6) => circle(x, y, s, { cls: 'z6-zero' });
  const poleX = (x, y, s = 6) => g({}, line(x - s, y - s, x + s, y + s, { cls: 'z6-pole' }), line(x - s, y + s, x + s, y - s, { cls: 'z6-pole' }));
  const rim = (cx, cy, R, o = {}) => {
    const { bottom = true, axis = true } = o;
    return g({},
      axis ? line(cx - R, cy, cx + R, cy, { cls: 'k-axis' }) : '',
      path(arcD(cx, cy, R, 0, 180), { cls: 'z6-rim' }),
      bottom ? path(arcD(cx, cy, R, 180, 360), { cls: 'z6-mirror-rim' }) : '');
  };
  const hzLabel = (P, d, s, o = {}) => {
    const { off = 18, cls = 'k-tick', dy = 4 } = o;
    const [x, y] = P(1, d), anchor = Math.abs(cosd(d)) < 0.2 ? 'middle' : cosd(d) > 0 ? 'start' : 'end';
    return text(x + off * cosd(d), y - off * sind(d) + dy, s, { anchor, cls });
  };
  const avgGain = f => Math.abs(cosd(180 * f / FS));
  const notchGain = (f, r = 0.9, th = 90) => {
    const w = 360 * f / FS, z = [cosd(w), sind(w)];
    const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const at = p => d(p, [cosd(th), sind(th)]) * d(p, [cosd(th), -sind(th)]) / (d(p, [r * cosd(th), r * sind(th)]) * d(p, [r * cosd(th), -r * sind(th)]));
    return at(z) / at([1, 0]);
  };
  const css = `
.k-fig .z6-rim { stroke: var(--ink); stroke-width: 1.5; fill: none; }
.k-fig .z6-mirror-rim { stroke: var(--ink-soft); stroke-width: 1.4; stroke-dasharray: 1 4; stroke-linecap: round; fill: none; }
.k-fig .z6-zero { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .z6-pole { stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; }
.k-fig .z6-tone { fill: var(--ink); }
.k-fig .z6-tone-old { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .z6-result { fill: var(--accent); }
.k-fig .z6-dist { stroke: var(--ink); stroke-width: 1.6; }
.k-fig .z6-dist-pole { stroke: var(--ink); stroke-width: 1.6; stroke-dasharray: 8 3 2 3; }
.k-fig .z6-ref { stroke: var(--ink-soft); stroke-width: 1.4; stroke-dasharray: 6 5; fill: none; }
.k-fig .z6-vec { stroke: var(--ink); stroke-width: 2.2; }
.k-fig .z6-vec-in { stroke: var(--ink-soft); stroke-width: 1.8; stroke-dasharray: 6 5; }
.k-fig .z6-vec-mirror { stroke: var(--ink); stroke-width: 2.2; stroke-dasharray: 1 4; stroke-linecap: round; }
.k-fig .z6-vec-accent { stroke: var(--accent); stroke-width: 2.6; }
.k-fig .z6-turn { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
.k-fig .z6-turn-accent { stroke: var(--accent); stroke-width: 2; fill: none; }
.k-fig .z6-head { fill: var(--ink); }
.k-fig .z6-chord { stroke: var(--ink); stroke-width: 1.6; }
.k-fig .z6-thread { stroke: var(--accent); stroke-width: 3; fill: none; stroke-linecap: round; }
.k-fig .z6-ruler { stroke: var(--ink-soft); stroke-width: 1.2; }
.k-fig .z6-bracket { stroke: var(--ink); stroke-width: 1.4; fill: none; }
.k-fig .z6-slice { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 0.8; stroke-linejoin: round; }
.k-fig .z6-rimline { stroke: var(--ink); stroke-width: 2.6; fill: none; stroke-linecap: round; }
.k-fig .z6-walker { fill: var(--accent); stroke: var(--paper); stroke-width: 1.5; }
.k-fig .z6-spiral { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .z6-loop { stroke: var(--accent); stroke-width: 2; fill: none; }
.k-fig .z6-sum { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .z6-pulse { fill: var(--accent); }
.k-fig .z6-avg { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .z6-two { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 1 4; stroke-linecap: round; fill: none; }
.k-fig .z6-notch { stroke: var(--accent); stroke-width: 2.6; fill: none; }
.k-fig .z6-m { fill: var(--ink); stroke: var(--paper); stroke-width: 1; }
.k-fig .z6-m-hollow { fill: var(--paper); stroke: var(--ink); stroke-width: 1.6; }
.k-fig .z6-m-accent { fill: var(--accent); stroke: var(--paper); stroke-width: 1; }
.k-fig .z6-small { font-size: 10px; }
.k-fig .z6-faint-rim { stroke: var(--ink-soft); stroke-width: 1; fill: none; opacity: 0.6; }
.k-fig .z6-tile { fill: var(--paper-2); }
.k-fig .z6-sup { font-size: 0.75em; }
`;

  const average = L => {
    const ph = L.phone;
    const whine = n => (n % 2 ? -1 : 1), slow = n => cosd(22.5 * n);
    const panel = (x0, y0, w, fn, title, accent, base) => {
      const I = plot({ x: x0 + 34, y: y0 + 38, w, h: 80, xs: [-0.5, 7.5], ys: [-1.25, 1.25] });
      const O = plot({ x: x0 + 34, y: y0 + 176, w, h: 80, xs: [-0.5, 7.5], ys: [-1.25, 1.25] });
      const out = n => (fn(n) + fn(n - 1)) / 2;
      const by = I.y1 + 10;
      const pair = n => g({}, path(`M${r2(I.X(n - 1))} ${by - 5}V${by}H${r2(I.X(n))}V${by - 5}`, { cls: 'z6-bracket' }),
        line(I.X(n), by, I.X(n), O.y0 - 6, { cls: 'k-guide' }));
      const outStem = n => accent ? circle(O.X(n), O.Y(0), 4.5, { cls: 'k-stem-accent-dot' }) : stems(O, [[n, out(n)]], { dot: 4 });
      return g({},
        text(x0, y0 + 10, title, { anchor: 'start', cls: 'k-name' }),
        text(I.x0, I.y0 - 8, 'in', { anchor: 'start', cls: 'k-tick' }),
        text(O.x0, O.y0 - 8, 'out: average of this and the one before', { anchor: 'start', cls: 'k-tick' }),
        axes(I, { xTicks: [], yTicks: [[1, '1'], [-1, `${M}1`]] }),
        axes(O, { xTicks: range(0, 7).map(n => [n, n ? String(n) : 'n = 0']), yTicks: [[1, '1'], [-1, `${M}1`]] }),
        circle(O.X(0), O.Y(0), 6, { cls: 'k-ring-missing' }),
        step(base, `${title}: the samples in`, g({ anim: { k: 'in', d: base === 1 ? 0 : 5.2, len: 0.8 } }, stems(I, range(0, 7).map(n => [n, fn(n)]), { cls: 'k-stem-soft', dot: 4 }))),
        step(base + 1, accent ? 'each pair of neighbors averages to 0' : 'each pair averages to a stem a touch shorter',
          range(1, 7).map(n => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: (base === 1 ? 1 : 6.2) + (n - 1) * 0.6, len: 0.7 } }, pair(n))),
          range(1, 7).map(n => g({ anim: { k: 'in', d: (base === 1 ? 1.3 : 6.5) + (n - 1) * 0.6, len: 0.4 } }, g({ anim: { k: 'move', dy: -40, d: (base === 1 ? 1.3 : 6.5) + (n - 1) * 0.6, len: 0.5 } }, outStem(n))))),
        g({ cls: 'k-faint' }, pair(7)),
        accent ? text(O.x1, O.y0 + 12, 'every average: 0', { anchor: 'end', cls: 'k-note-accent' }) : text(O.x1, O.y1 + 36, ph ? 'a touch smaller, half a sample late' : 'same tone, a touch smaller, half a sample late', { anchor: 'end', cls: 'k-note' }));
    };
    const foot = text(ph ? 20 : 20, L.H - 10, 'dashed ring: n = 0 has no sample before it', { anchor: 'start', cls: 'k-tick' });
    if (ph) return [panel(16, 14, 300, whine, 'the 4,000 Hz whine', true, 1), line(16, 316, 344, 316, { cls: 'k-grid' }), panel(16, 334, 300, slow, 'a 500 Hz voice tone', false, 3), foot];
    return [panel(14, 14, 290, whine, 'the 4,000 Hz whine', true, 1), line(360, 20, 360, 300, { cls: 'k-grid' }), panel(376, 14, 290, slow, 'a 500 Hz voice tone', false, 3), foot];
  };

  const wheelFig = L => {
    const ph = L.phone;
    const cases = [
      [1000, 45, 8, ['1.00, 0.71, 0.00, −0.71', '−1.00, −0.71, 0.00, 0.71']],
      [2000, 90, 4, ['1, 0, −1, 0']],
      [4000, 180, 2, ['+1, −1']],
    ];
    return cases.map(([f, st, count, reads], i) => {
      const [cx, cy, R] = ph ? [86, 92 + i * 168, 54] : [124 + i * 236, 150, 70];
      const tx = ph ? 170 : cx - 100, ty = ph ? cy - 40 : cy + R + 46;
      return g({},
        text(tx, ty, `${hz(f)} Hz: ${st}° per sample`, { anchor: 'start', cls: 'k-name' }),
        text(tx, ty + 22, ph ? 'left-right positions:' : 'left-right position at each stop:', { anchor: 'start', cls: 'k-tick' }),
        reads.map((s, j) => text(tx, ty + 42 + j * 18, s, { anchor: 'start', cls: 'k-num' })),
        step(i + 1, `${hz(f)} Hz: the dot turns ${st} degrees counter-clockwise per sample`,
          k.wheel({ cx, cy, R, stepDeg: st, count, anim: { d: i * 2.4, len: count === 2 ? 1.2 : count * 0.3 }, dotR: 5.5 })));
    });
  };

  const midpoint = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [12, 400, 296] : [64, 356, 580];
    const P = polar(cx, cy, R), m = cosd(11.25);
    const [ox, oy] = P(1, 0), [fx, fy] = P(1, 22.5), [mx, my] = P(m, 11.25), [rx, ry] = P(1, 11.25);
    const at = x => cy - (x - cx) * Math.tan(11.25 * Math.PI / 180);
    const lx = ph ? 230 : 440;
    return [
      path(arcD(cx, cy, R, -2, 30), { cls: 'z6-rim' }),
      ph ? '' : line(cx, cy, fx, fy, { cls: 'k-guide' }),
      line(fx, fy, ox, oy, { cls: 'z6-chord' }),
      line(cx, cy, mx, my, { cls: 'z6-dist' }),
      ph ? '' : path(arcD(cx, cy, 70, 0, 22.5), { cls: 'z6-turn' }),
      ph ? '' : text(cx + 78, cy - 10, '22.5°', { anchor: 'start', cls: 'k-tick' }),
      text(lx, at(lx) - 12, '0.98 from the center', { anchor: 'end', cls: 'k-num-accent' }),
      circle(fx, fy, 6, { cls: 'z6-tone' }), circle(ox, oy, 6, { cls: 'z6-tone-old' }), circle(mx, my, 5.5, { cls: 'z6-result' }),
      text(fx - 12, fy + 4, 'fresh dot, n = 1', { anchor: 'end', cls: 'k-label' }),
      text(ox - 10, oy + 22, 'one sample old, n = 0', { anchor: 'end', cls: 'k-label' }),
      text(mx - 14, my - 16, 'midpoint: the average', { anchor: 'end', cls: 'k-label' }),
      line(rx + 3, ry, rx + (ph ? 8 : 14), ry, { cls: 'k-guide' }),
      text(rx + (ph ? 10 : 18), ry + 5, '2% lost', { anchor: 'start', cls: 'k-note-accent', style: ph ? 'font-size:14px' : undefined }),
      text(ph ? 16 : 100, ph ? 456 : 406, '500 Hz: the two dots sit 22.5° apart', { anchor: 'start', cls: 'k-tick' }),
      text(ph ? 16 : 100, ph ? 474 : 424, ph ? 'midpoint: 11.25° behind the fresh dot' : 'the midpoint sits 11.25° behind the fresh dot: half a sample late', { anchor: 'start', cls: 'k-tick' }),
      ph ? text(16, 492, 'half a sample late', { anchor: 'start', cls: 'k-tick' }) : '',
    ];
  };

  const radians = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [180, 150, 50] : [210, 170, 90];
    const P = polar(cx, cy, R), y0 = ph ? 300 : 330, x0 = ph ? 23 : 60, len = 2 * Math.PI * R;
    const marks = [[45, 'π/4', '45°', '1,000 Hz'], [90, 'π/2', '90°', '2,000 Hz'], [180, 'π', '180°', '4,000 Hz']];
    const turn = { k: 'turn', r0: '360deg', steps: 60, d: 0, len: 6 };
    return [
      line(cx - R, cy, cx + R + 12, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'z6-rim' }),
      line(cx, cy, ...P(1, 0), { cls: 'k-guide' }), text(cx + R / 2 - (ph ? 8 : 0), cy + 18, 'radius 1', { cls: 'k-tick' }),
      marks.map(([d, rad, dg, f]) => {
        const [x, y] = P(1, d), off = ph ? 14 : 16;
        const [lx, ly] = [x + off * cosd(d), y - off * sind(d)], anchor = d === 90 ? 'middle' : d < 90 ? 'start' : 'end';
        return g({}, circle(x, y, 3.5, { cls: 'k-stem-dot' }),
          text(lx + (d === 90 ? 0 : 0), ly - (d === 90 ? 26 : d === 180 ? 12 : 8), `${rad} = ${dg}`, { anchor, cls: 'k-num' }),
          text(lx, ly + (d === 90 ? -10 : d === 180 ? 6 : 10), f, { anchor, cls: 'k-tick' }));
      }),
      line(x0, y0, x0 + len + 10, y0, { cls: 'z6-ruler' }),
      [[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [2 * Math.PI, '2π']].map(([v, s]) => g({},
        line(x0 + v * R, y0 - 6, x0 + v * R, y0 + 6, { cls: 'z6-ruler' }),
        text(x0 + v * R, y0 + 22, s, { cls: 'k-num' }))),
      text(x0 + 2 * Math.PI * R, y0 + 40, '≈ 6.28', { anchor: ph ? 'end' : 'middle', cls: 'k-tick' }),
      text(x0, y0 - 16, ph ? 'the walk, laid flat' : 'the walk along the rim, laid flat on a ruler', { anchor: 'start', cls: 'k-label' }),
      step(1, 'the dot walks once around the rim',
        g({ anim: turn, style: `transform-origin:${cx}px ${cy}px` }, circle(...P(1, 0), 6.5, { cls: 'k-dot' }))),
      step(2, 'the thread unrolls along the ruler to 2π',
        path(arcD(cx, cy, R, 0, 359.9), { cls: 'z6-thread', pathLength: 1, anim: { k: 'draw', d: 0, len: 6 } }),
        line(x0, y0, x0 + len, y0, { cls: 'z6-thread', pathLength: 1, anim: { k: 'draw', d: 0, len: 6 } })),
    ];
  };

  const unitCircle = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [180, 214, 110] : [360, 230, 130];
    const P = polar(cx, cy, R);
    const ticks = [[0, '0 Hz', '0'], [1000, '1,000 Hz', 'π/4'], [2000, '2,000 Hz', 'π/2'], [3000, '3,000 Hz', '3π/4'], [4000, '4,000 Hz', 'π']];
    const sweep = 5.4;
    return [
      rim(cx, cy, R),
      text(cx, cy + R + 28, ph ? 'bottom half: mirror arrows, later' : 'dotted bottom half: mirror arrows, later', { cls: 'k-tick' }),
      ph ? [text(16, 22, 'each tone at the spot its dot', { anchor: 'start', cls: 'k-label' }), text(16, 40, 'reaches after one sample', { anchor: 'start', cls: 'k-label' })] : text(24, 28, 'each tone at the spot its dot reaches after one sample', { anchor: 'start', cls: 'k-label' }),
      step(1, 'one dot sweeps the top half from 0 Hz to 4,000 Hz',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0, len: sweep + 0.4 } },
          g({ anim: { k: 'turn', r0: '180deg', steps: 72, d: 0, len: sweep }, style: `transform-origin:${cx}px ${cy}px` }, circle(...P(1, 180), 7, { cls: 'k-dot' })))),
      step(2, 'it leaves a fixed spot every 1,000 Hz, labeled in Hz and radians',
        ticks.map(([f, s, rad]) => {
          const d = 180 * f / 4000, [x, y] = P(1, d);
          const [ox, oy] = [x + 14 * cosd(d), y - 14 * sind(d)];
          const anchor = f === 2000 ? 'middle' : f < 2000 ? 'start' : 'end';
          const lift = f === 2000 ? -30 : f === 0 || f === 4000 ? -10 : -6;
          return g({ anim: { k: 'in', d: sweep * f / 4000, len: 0.4 } },
            line(cx + (R - 7) * cosd(d), cy - (R - 7) * sind(d), cx + (R + 7) * cosd(d), cy - (R + 7) * sind(d), { cls: 'z6-chord' }),
            circle(x, y, 4, { cls: 'z6-tone' }),
            text(ox, oy + lift, s, { anchor, cls: 'k-num' }),
            text(ox, oy + lift + 16, rad, { anchor, cls: 'k-tick' }));
        })),
    ];
  };

  const zeroFig = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [200, 160, 110] : [230, 170, 135];
    const P = polar(cx, cy, R), [zx, zy] = P(1, 180), [ax, ay] = P(1, 0), [bx, by] = P(1, 90);
    const tx = ph ? 24 : 430, ty = ph ? 340 : 86;
    return [
      path(arcD(cx, cy, R, 0, 180), { cls: 'z6-rim' }), path(arcD(cx, cy, R, 180, 360), { cls: 'z6-mirror-rim' }),
      line(ax, ay, zx, zy, { cls: 'z6-ref' }),
      line(bx, by, zx, zy, { cls: 'z6-dist' }),
      text((bx + zx) / 2 + 12, (by + zy) / 2 + 18, '1.41', { anchor: 'start', cls: 'k-num' }),
      text(cx, cy + 20, '2.00', { cls: 'k-num' }),
      zeroO(zx, zy, 7), circle(ax, ay, 5.5, { cls: 'z6-tone' }), circle(bx, by, 5.5, { cls: 'z6-tone' }),
      text(zx - 14, zy - 4, 'zero', { anchor: 'end', cls: 'k-name' }), text(zx - 14, zy + 14, '4,000 Hz', { anchor: 'end', cls: 'k-tick' }),
      text(ax + 10, ay - 12, '0 Hz', { anchor: 'start', cls: 'k-tick' }), text(bx + 12, by - 8, '2,000 Hz', { anchor: 'start', cls: 'k-tick' }),
      text(tx, ty, 'passes = distance to the zero ÷ 2', { anchor: 'start', cls: 'k-name' }),
      text(tx, ty + 30, '0 Hz:      2.00 ÷ 2 = 100%', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 52, '2,000 Hz:  1.41 ÷ 2 = 71%', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 74, '4,000 Hz:  on the zero, 0%', { anchor: 'start', cls: 'k-num-accent' }),
      text(tx, ty + 104, 'dashed: 0 Hz, for comparison', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const jTurn = L => {
    const ph = L.phone, s = L.slug;
    const [ax, ay, R] = ph ? [180, 150, 100] : [190, 160, 100];
    const [bx, by] = ph ? [130, 430] : [500, 160];
    const P = polar(ax, ay, R), Q = polar(bx, by, R);
    const c = 0.7071;
    return [
      circle(ax, ay, R, { cls: 'z6-faint-rim' }), line(ax - R - 12, ay, ax + R + 12, ay, { cls: 'k-axis' }),
      step(1, 'the plain number 1: an arrow to the right', vec(s, ax, ay, ...P(1, 0)), text(...P(1.12, 0).map((v, i) => v + [6, 4][i]), '1', { anchor: 'start', cls: 'k-name' })),
      step(2, 'times j: a quarter turn counter-clockwise, to j at the top',
        g({ anim: { k: 'in', d: 1, len: 0.6 } }, arcArrow(s, ax, ay, R * 0.55, 6, 84), text(...P(0.68, 45), '× j', { anchor: 'start', cls: 'k-label' })),
        g({ anim: { k: 'in', d: 1.6, len: 0.6 } }, vec(s, ax, ay, ...P(1, 90)), text(ax + 8, ay - R - 10, 'j', { anchor: 'start', cls: 'k-name' }))),
      step(3, 'times j again: another quarter turn, to −1',
        g({ anim: { k: 'in', d: 2.6, len: 0.6 } }, arcArrow(s, ax, ay, R * 0.55, 96, 174), text(...P(0.68, 135).map((v, i) => v + [-4, 0][i]), '× j again', { anchor: 'end', cls: 'k-label' })),
        g({ anim: { k: 'in', d: 3.2, len: 0.6 } }, vec(s, ax, ay, ...P(1, 180), { cls: 'z6-vec-accent', head: 'accent' }), text(ax - R - 10, ay + 30, `${M}1`, { anchor: 'start', cls: 'k-name-accent' }))),
      text(ax, ay + R + 34, 'j × j = −1: two quarter turns make a flip', { cls: 'k-note' }),
      step(4, 'the point 45 degrees up the rim is 0.71 right, plus j times 0.71 up',
        g({ anim: { k: 'in', d: 4.2, len: 0.8 } },
          circle(bx, by, R, { cls: 'z6-faint-rim' }), line(bx - R - 12, by, bx + R + 12, by, { cls: 'k-axis' }),
          line(bx, by + 8, bx + c * R, by + 8, { cls: 'z6-chord' }), text(bx + c * R / 2, by + 24, '0.71 right', { cls: 'k-tick' }),
          line(bx + c * R + 8, by, bx + c * R + 8, by - c * R, { cls: 'z6-chord' }), text(bx + R + 10, by - c * R / 2 + 4, 'plus j × 0.71 up', { anchor: 'start', cls: 'k-tick' }),
          vec(s, bx, by, ...Q(1, 45)), text(...Q(1, 45).map((v, i) => v + [10, -10][i]), '0.71 + 0.71j', { anchor: 'start', cls: 'k-num' }))),
    ];
  };

  const multiply = L => {
    const ph = L.phone, s = L.slug;
    const one = (cx, cy, R, inR, inD, outR, outD, base, lines) => {
      const P = polar(cx, cy, R);
      const scale = inR / outR;
      return g({},
        circle(cx, cy, R, { cls: 'z6-faint-rim' }), line(cx - R - 12, cy, cx + R + 12, cy, { cls: 'k-axis' }),
        vec(s, cx, cy, ...P(inR, inD), { cls: 'z6-vec-in', head: 'soft' }),
        path(arcD(cx, cy, R * 0.3, 0, inD), { cls: 'z6-turn' }),
        text(...P(0.42, inD / 2), `${inD}°`, { anchor: 'start', cls: 'k-tick' }),
        step(base, 'the angles stack end to end', g({ anim: { k: 'in', d: base === 1 ? 0.6 : 4, len: 0.8 } },
          path(arcD(cx, cy, R * 0.48, inD, outD), { cls: 'z6-turn-accent' }),
          text(...P(0.62, (inD + outD) / 2).map((v, i) => v + [inD + outD > 200 ? -2 : 4, -2][i]), `+${outD - inD}°`, { anchor: inD + outD > 200 ? 'end' : 'start', cls: 'k-num-accent' }))),
        step(base + 1, 'and the lengths multiply', g({ anim: { k: 'in', d: base === 1 ? 0.6 : 4, len: 0.3 } },
          g({ anim: { k: 'turn', r0: `${outD - inD}deg`, steps: 12, d: base === 1 ? 0.6 : 4, len: 1.6 }, style: `transform-origin:${cx}px ${cy}px` },
            g({ anim: { k: 'scale', sx: scale, sy: scale, d: base === 1 ? 0.6 : 4, len: 1.6 }, style: `transform-origin:${cx}px ${cy}px` },
              vec(s, cx, cy, ...P(outR, outD), { cls: 'z6-vec-accent', head: 'accent' }))))),
        lines.map(([t, c], i) => text(ph ? 20 : cx - R - 10, cy + R + 32 + i * 20, t, { anchor: 'start', cls: c })));
    };
    const A = ph ? [180, 130, 90] : [190, 140, 100], B = ph ? [180, 440, 90] : [530, 140, 100];
    return [
      one(...A, 1, 45, 1, 90, 1, [['dashed in: 0.71 + 0.71j, size 1, at 45°', 'k-tick'], ['times itself: size 1 × 1 = 1', 'k-tick'], ['angle 45° + 45° = 90°: the point j', 'k-num-accent']]),
      one(...B, 0.9, 90, 0.81, 180, 3, [['dashed in: 0.9j, size 0.9, at 90°', 'k-tick'], ['times itself: size 0.9 × 0.9 = 0.81', 'k-tick'], ['angle 90° + 90° = 180°: −0.81', 'k-num-accent']]),
      ph ? '' : line(360, 30, 360, 300, { cls: 'k-grid' }),
    ];
  };

  const spinning = L => {
    const ph = L.phone, s = L.slug;
    const [cx, cy, R] = ph ? [130, 150, 84] : [140, 176, 96];
    const P = polar(cx, cy, R);
    const S = ph ? plot({ x: 40, y: 300, w: 300, h: 130, xs: [-0.5, 7.5], ys: [-1.45, 1.3] }) : plot({ x: 330, y: 70, w: 360, h: 170, xs: [-0.5, 7.5], ys: [-1.45, 1.3] });
    const at = n => 0.4 + n * 0.55;
    const [ix, iy, iR] = ph ? [100, 560, 62] : [420, 350, 62];
    const I = polar(ix, iy, iR);
    const [ex, ey] = P(1, 315);
    return [
      line(cx - R, cy, cx + R, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'z6-rim' }),
      range(0, 7).map(n => { const [x, y] = P(1, 45 * n); return g({}, circle(x, y, 3, { cls: 'k-stop' }), text(...P(1.17, 45 * n).map((v, i) => v + [0, 4][i]), String(n), { cls: 'k-tick' })); }),
      rich(cx - R, 26, ph ? `e${sup('jωn')}: 45° per sample` : `the arrow e${sup('jωn')}, 1,000 Hz: 45° per sample`, { anchor: 'start', cls: 'k-label' }),
      axes(S, { xTicks: range(0, 7).map(n => [n, n ? String(n) : 'n = 0']), yTicks: [[1, '1'], [-1, `${M}1`]] }),
      text(S.x0, S.y0 - 16, 'its left-right shadow, cos ωn: the samples', { anchor: 'start', cls: 'k-label' }),
      step(1, 'the arrow steps 45 degrees counter-clockwise per sample',
        g({ anim: { k: 'turn', r0: '315deg', steps: 8, d: 0.4, len: 4.4 }, style: `transform-origin:${cx}px ${cy}px` },
          vec(s, cx, cy, ...P(1, 315)), circle(...P(1, 315), 5.5, { cls: 'k-dot' }))),
      step(2, 'its left-right shadow drops onto the axis and writes each sample below',
        range(0, 6).map(n => { const [x, y] = P(1, 45 * n); return g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: at(n), len: 0.55 } },
          line(x, y, x, cy, { cls: 'k-guide' }), circle(x, cy, 4, { cls: 'z6-tone' }), line(x, y, cx, y, { cls: 'k-guide', style: 'opacity:.5' })); }),
        range(0, 7).map(n => g({ anim: { k: 'in', d: at(n) + 0.15, len: 0.3 } }, stems(S, [[n, cosd(45 * n)]], { dot: 4, labels: v => fmt(v), labelCls: ph ? 'k-tick' : 'k-num' })))),
      line(ex, ey, ex, cy, { cls: 'k-guide' }), circle(ex, cy, 4, { cls: 'z6-tone' }),
      line(ex, ey, cx, ey, { cls: 'k-guide', style: 'opacity:.5' }), text(cx - 6, ey - 8, 'j sin ωn', { anchor: 'end', cls: 'k-tick', style: 'opacity:.75;font-size:10px' }),
      step(3, 'times j turns the arrow at 45 degrees on to 135 degrees: angles add',
        g({ anim: { k: 'in', d: 5, len: 0.8 } },
          circle(ix, iy, iR, { cls: 'z6-faint-rim' }), line(ix - iR - 10, iy, ix + iR + 10, iy, { cls: 'k-axis' }),
          vec(s, ix, iy, ...I(1, 45), { cls: 'z6-vec-in', head: 'soft' }), vec(s, ix, iy, ...I(1, 135), { cls: 'z6-vec-accent', head: 'accent' }),
          path(arcD(ix, iy, iR * 0.45, 45, 135), { cls: 'z6-turn-accent' }),
          rich(ix + iR + 18, iy - 34, ph ? `j × e${sup('jπ/4')}:` : `dashed e${sup('jπ/4')}, times j:`, { anchor: 'start', cls: 'k-label' }),
          text(ix + iR + 18, iy - 14, ph ? '45° + 90° = 135°' : '45° + 90° = 135°, angles add', { anchor: 'start', cls: 'k-num' }),
          text(ix + iR + 18, iy + 6, '= −0.71 + 0.71j', { anchor: 'start', cls: 'k-num-accent' }))),
    ];
  };

  const delay = L => {
    const ph = L.phone, s = L.slug;
    const [cx, cy, R] = ph ? [180, 150, 110] : [190, 160, 116];
    const P = polar(cx, cy, R);
    const tx = ph ? 24 : 400, ty = ph ? 330 : 90;
    return [
      rim(cx, cy, R),
      range(0, 7).map(n => circle(...P(1, 45 * n), 2.5, { cls: 'k-stop' })),
      step(1, 'the fresh dot and its one-sample-old copy turn together, 45 degrees per sample',
        g({ anim: { k: 'turn', r0: '135deg', steps: 4, d: 0, len: 3 }, style: `transform-origin:${cx}px ${cy}px` },
          line(cx, cy, ...P(1, 135), { cls: 'k-guide' }), line(cx, cy, ...P(1, 90), { cls: 'k-guide' }),
          arcArrow(s, cx, cy, R * 1.12, 131, 94, { cls: 'z6-turn-accent', head: 'accent' }),
          circle(...P(1, 90), 6.5, { cls: 'z6-tone-old' }), circle(...P(1, 135), 6.5, { cls: 'z6-tone' }))),
      step(2, 'the arc between them is times z to the minus one: turn omega clockwise',
        g({ anim: { k: 'in', d: 3.1, len: 0.6 } },
          text(...P(1.12, 112.5).map((v, i) => v + [0, -12][i]), '× z⁻¹', { cls: 'k-num-accent' }),
          text(...P(1, 135).map((v, i) => v + [-12, -2][i]), 'fresh: zⁿ', { anchor: 'end', cls: 'k-label' }),
          text(...P(1, 90).map((v, i) => v + [10, -10][i]), 'one sample old', { anchor: 'start', cls: 'k-label' }))),
      text(tx, ty, ph ? '× z⁻¹: turn ω clockwise' : '× z⁻¹: turn ω clockwise', { anchor: 'start', cls: 'k-name' }),
      text(tx, ty + 28, 'x[n − 1] = z⁻¹ · zⁿ', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 50, ph ? '1,000 Hz: ω is 45°, π/4' : '1,000 Hz here: ω is 45°, π/4', { anchor: 'start', cls: 'k-tick' }),
      text(tx, ty + 80, 'older is clockwise', { anchor: 'start', cls: 'k-note' }),
      text(tx, ty + 108, 'filled: fresh dot · ring: one sample old', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const mirror = L => {
    const ph = L.phone, s = L.slug;
    const A = ph ? [180, 140, 100] : [180, 150, 110], B = ph ? [180, 470, 100] : [540, 150, 110];
    const half = 0.5, c = 0.7071;
    const turnUp = () => ({ k: 'turn', r0: '405deg', steps: 10, d: 0, len: 4 });
    const PA = polar(A[0], A[1], A[2]), PB = polar(B[0], B[1], B[2]);
    const [sx, sy] = PA(c, 0);
    return [
      g({}, path(arcD(A[0], A[1], A[2], 0, 180), { cls: 'z6-rim' }), path(arcD(A[0], A[1], A[2], 180, 360), { cls: 'z6-mirror-rim' }), line(A[0] - A[2] - 12, A[1], A[0] + A[2] + 12, A[1], { cls: 'k-axis' })),
      g({}, path(arcD(B[0], B[1], B[2], 0, 180), { cls: 'z6-rim' }), path(arcD(B[0], B[1], B[2], 180, 360), { cls: 'z6-mirror-rim' }), line(B[0] - B[2] - 12, B[1], B[0] + B[2] + 12, B[1], { cls: 'k-axis' })),
      text(A[0] - A[2], 24, ph ? 'a real tone: two half arrows' : 'a real tone: two half-size arrows', { anchor: 'start', cls: 'k-name' }),
      text(B[0] - B[2], ph ? 354 : 24, 'a zero on the top arrow only', { anchor: 'start', cls: 'k-name' }),
      step(1, 'one half-size arrow turns counter-clockwise on the top half, its mirror arrow clockwise on the bottom half',
        g({ anim: turnUp(), style: `transform-origin:${A[0]}px ${A[1]}px` }, vec(s, A[0], A[1], ...PA(half, 45))),
        g({ anim: { ...turnUp(), r0: '-405deg' }, style: `transform-origin:${A[0]}px ${A[1]}px` }, vec(s, A[0], A[1], ...PA(half, -45), { cls: 'z6-vec-mirror' }))),
      step(2, 'added tip to tail they always land on the horizontal axis: at n = 1, 0.71',
        range(0, 9).map(n => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: n * 0.4, len: 0.45 } }, circle(...PA(cosd(45 * n), 0), 5, { cls: 'z6-result' }))),
        g({ anim: { k: 'in', d: 4.1, len: 0.6 } },
          vec(s, ...PA(half, 45), sx, sy, { cls: 'z6-vec-mirror' }), circle(sx, sy, 5.5, { cls: 'z6-result' }),
          text(sx + 8, sy + 22, 'sum 0.71', { anchor: 'start', cls: 'k-num-accent' }))),
      text(ph ? 20 : A[0] - A[2] - 10, A[1] + A[2] + 30, '½(0.71 + 0.71j) + ½(0.71 − 0.71j) = 0.71', { anchor: 'start', cls: 'k-num' }),
      text(ph ? 20 : A[0] - A[2] - 10, A[1] + A[2] + 50, 'solid: arrow · dotted: its mirror arrow', { anchor: 'start', cls: 'k-tick' }),
      zeroO(...PB(1, 45), 7), text(...PB(1, 45).map((v, i) => v + [12, -10][i]), 'zero', { anchor: 'start', cls: 'k-label' }),
      step(3, 'the zero sends the top arrow to 0',
        g({ anim: { k: 'fade', o0: 1, d: 4.8, len: 1.2 }, cls: 'k-ghost' }, vec(s, B[0], B[1], ...PB(half, 45))),
        g({ anim: { k: 'in', d: 5.6, len: 0.6 } }, circle(B[0], B[1], 4, { cls: 'z6-tone' }), text(B[0] - 10, B[1] - 28, 'top arrow: 0', { anchor: 'end', cls: 'k-label' }))),
      step(4, 'the mirror arrow passes untouched: a half-size tone that still turns',
        g({ anim: { k: 'turn', r0: '-90deg', steps: 3, d: 6.4, len: 2 }, style: `transform-origin:${B[0]}px ${B[1]}px` }, vec(s, B[0], B[1], ...PB(half, -45), { cls: 'z6-vec-mirror' }))),
      text(ph ? 20 : B[0] - B[2] - 10, B[1] + B[2] + 30, 'the mirror arrow sails through:', { anchor: 'start', cls: 'k-num' }),
      text(ph ? 20 : B[0] - B[2] - 10, B[1] + B[2] + 50, 'a half-size tone still turns', { anchor: 'start', cls: 'k-note-accent' }),
      ph ? '' : line(360, 30, 360, 330, { cls: 'k-grid' }),
    ];
  };

  const dull = L => {
    const ph = L.phone;
    const [cx, cy, R] = ph ? [180, 160, 116] : [220, 170, 130];
    const P = polar(cx, cy, R), [ux, uy] = P(1, 90), [dx, dy] = P(1, 270), [tx0, ty0] = P(1, 67.5), [ox, oy] = P(1, 0);
    const tx = ph ? 24 : 420, ty = ph ? 340 : 80;
    return [
      rim(cx, cy, R, { axis: false }),
      line(ox, oy, ux, uy, { cls: 'z6-ref' }), line(ox, oy, dx, dy, { cls: 'z6-ref' }),
      line(tx0, ty0, ux, uy, { cls: 'z6-dist' }), line(tx0, ty0, dx, dy, { cls: 'z6-dist' }),
      text((tx0 + ux) / 2, Math.min(ty0, uy) - 12, '0.39', { cls: 'k-num' }),
      text(tx0 + 0.62 * (dx - tx0) - 10, ty0 + 0.62 * (dy - ty0), '1.96', { anchor: 'end', cls: 'k-num' }),
      text(ox - 0.3 * (ox - ux) - 12, oy - 0.3 * (oy - uy) + 8, '1.41', { anchor: 'end', cls: 'k-tick' }),
      text(ox - 0.3 * (ox - dx) - 12, oy - 0.3 * (oy - dy) + 2, '1.41', { anchor: 'end', cls: 'k-tick' }),
      zeroO(ux, uy, 7), zeroO(dx, dy, 7), circle(tx0, ty0, 5.5, { cls: 'z6-tone' }), circle(ox, oy, 5.5, { cls: 'z6-tone' }),
      text(ux - 10, uy - 10, 'zero at j', { anchor: 'end', cls: 'k-label' }), text(dx, dy + 24, 'zero at −j', { cls: 'k-label' }),
      text(tx0 + 10, ty0 - 10, '1,500 Hz', { anchor: 'start', cls: 'k-tick' }), text(ox + 10, oy + 18, '0 Hz', { anchor: 'start', cls: 'k-tick' }),
      text(tx, ty, '1,500 Hz:  0.39 × 1.96 = 0.77', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 24, '0 Hz:      1.41 × 1.41 = 2', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 54, '0.77 ÷ 2: 1,500 Hz keeps 38%', { anchor: 'start', cls: 'k-num-accent' }),
      text(tx, ty + 84, 'dashed: 0 Hz, for comparison', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const zeroPair = L => {
    const ph = L.phone;
    const tiles = [[45, 'π/4', '1,000 Hz', `${M}1.41`, `y[n] = x[n] ${M} 1.41 x[n${M}1] + x[n${M}2]`], [90, 'π/2', '2,000 Hz', '0', `y[n] = x[n] + x[n${M}2]`], [135, '3π/4', '3,000 Hz', '+1.41', `y[n] = x[n] + 1.41 x[n${M}1] + x[n${M}2]`]];
    const head = ph
      ? [rich(16, 26, `(1 − e${sup('jθ')}z⁻¹)(1 − e${sup('−jθ')}z⁻¹)`, { anchor: 'start', cls: 'k-num' }), text(16, 48, '= 1 − 2cos θ z⁻¹ + z⁻²', { anchor: 'start', cls: 'k-num' })]
      : [rich(360, 30, `(1 − e${sup('jθ')}z⁻¹)(1 − e${sup('−jθ')}z⁻¹)  =  1 − 2cos θ z⁻¹ + z⁻²`, { cls: 'k-num' })];
    return [head, tiles.map(([th, rad, f, wgt, prog], i) => {
      const [cx, cy, R] = ph ? [70, 130 + i * 156, 50] : [120 + i * 240, 140, 66];
      const P = polar(cx, cy, R), [ax, ay] = P(1, th), [bx, by] = P(1, -th), [tx0, ty0] = P(1, 22.5);
      const x0 = ph ? 140 : cx - 108, y0 = ph ? cy - 34 : cy + R + 34;
      return g({},
        th === 90 ? rect(ph ? 8 : cx - 116, ph ? cy - 66 : 52, ph ? 344 : 232, ph ? 140 : 292, { cls: 'z6-tile', rx: 6 }) : '',
        rim(cx, cy, R),
        line(tx0, ty0, ax, ay, { cls: 'z6-dist' }), line(tx0, ty0, bx, by, { cls: 'z6-dist' }),
        zeroO(ax, ay, 6), zeroO(bx, by, 6), circle(tx0, ty0, 4.5, { cls: 'z6-tone' }),
        text(x0, y0, `θ = ${rad}, ${f}${th === 90 ? ': the whine' : ''}`, { anchor: 'start', cls: 'k-name', style: 'font-size:14px' }),
        text(x0, y0 + 22, `middle weight −2cos θ = ${wgt}`, { anchor: 'start', cls: th === 90 ? 'k-num-accent' : 'k-num' }),
        ph && th !== 90 ? [text(x0, y0 + 44, prog.split(' + x[n−2]')[0], { anchor: 'start', cls: 'k-tick' }), text(x0 + 30, y0 + 60, '+ x[n−2]', { anchor: 'start', cls: 'k-tick' })]
          : text(x0, y0 + 44, prog, { anchor: 'start', cls: 'k-tick', style: 'font-size:10px' }));
    }), ph ? [text(16, L.H - 30, 'each tile: a zero pair at θ and −θ, and a', { anchor: 'start', cls: 'k-tick' }), text(16, L.H - 12, '500 Hz tone with its distance to each zero', { anchor: 'start', cls: 'k-tick' })] : text(24, L.H - 12, 'each tile: a zero pair at θ and −θ, and a 500 Hz tone with its distance to each zero', { anchor: 'start', cls: 'k-tick' })];
  };

  const zPlane = L => {
    const ph = L.phone;
    const Hs = (x, y) => {
      const d = (a, b) => Math.hypot(x - a, y - b);
      return 0.905 * d(0, 1) * d(0, -1) / (d(0, 0.9) * d(0, -0.9) + 1e-9);
    };
    const hmax = 2.6;
    const h = (x, y) => Math.min(Hs(x, y), hmax);
    const [cx, cy, S, D, K, HS] = ph ? [190, 220, 112, 56, -22, 34] : [250, 250, 160, 84, -36, 48];
    const proj = (x, y, z) => [cx + x * S + y * K, cy + y * D - z * HS];
    const E = 1.15;
    const xsP = [...range(-E, E, 0.025), 0, 0.02, -0.02, 0.05, -0.05].sort((a, b) => a - b);
    const ysS = [...range(-E, 0.8, 0.1).map(v => Math.round(v * 100) / 100), 0.9, 1];
    const items = ysS.map(y => ({ depth: y, el: () => {
      const top = xsP.map(x => proj(x, y, h(x, y)));
      const pts = [proj(-E, y, 0), ...top, proj(E, y, 0)];
      return path(pts.map(([a, b], i) => `${i ? 'L' : 'M'}${r1(a)} ${r1(b)}`).join('') + 'Z', { cls: 'z6-slice' });
    } }));
    const segs = range(0, 179).map(i => {
      const t0 = i * 2, t1 = t0 + 2;
      const pts = range(t0, t1, 0.5).map(t => proj(cosd(t), sind(t), h(cosd(t), sind(t))));
      return { depth: (sind(t0) + sind(t1)) / 2 + 0.0001, el: () => poly(pts, { cls: 'z6-rimline' }) };
    });
    const order = [...items, ...segs].sort((a, b) => a.depth - b.depth).map(o => o.el());
    const tones = range(0, 4000, 500);
    const G = ph ? plot({ x: 44, y: 430, w: 120, h: 70, xs: [-250, 4250], ys: [0, 1.2] }) : plot({ x: 560, y: 70, w: 120, h: 80, xs: [-250, 4250], ys: [0, 1.2] });
    const [ix, iy, iR] = ph ? [276, 460, 46] : [630, 300, 52];
    const I = polar(ix, iy, iR);
    const spiral = range(0, 7).map(n => I(0.9 ** n, 90 * n));
    const spiralPath = poly(range(0, 630, 5).map(t => I(0.9 ** (t / 90), t)), { cls: 'z6-spiral' });
    const [pkx, pky] = proj(0, -0.9, hmax), [pitx, pity] = proj(0, 1, 0), [rmx, rmy] = proj(1, 0, h(1, 0));
    return [
      order,
      ph ? g({}, line(pkx - 4, pky, pkx - 24, pky + 16, { cls: 'k-guide' }), text(pkx - 28, pky + 22, 'spikes: poles at ±0.9j', { anchor: 'end', cls: 'k-label' }))
        : g({}, line(pkx + 4, pky, pkx + 24, pky + 16, { cls: 'k-guide' }), text(pkx + 28, pky + 22, 'spikes: poles at ±0.9j', { anchor: 'start', cls: 'k-label' })),
      line(pitx, pity + 4, pitx, pity + (ph ? 22 : 26), { cls: 'k-guide' }), text(pitx, pity + (ph ? 36 : 40), 'pit: zero at j, 2,000 Hz', { cls: 'k-label' }),
      ph ? text(pitx, pity + 54, 'dark line: the rim, where tones live', { cls: 'k-label' })
        : g({}, line(rmx + 6, rmy, rmx + 78, rmy, { cls: 'k-guide' }), text(rmx + 82, rmy - 4, 'the rim:', { anchor: 'start', cls: 'k-label' }), text(rmx + 82, rmy + 12, 'tones live here', { anchor: 'start', cls: 'k-label' })),
      text(ph ? 14 : 20, 26, ph ? 'height: the size of H over the plane' : 'height: the size of H at every point of the plane', { anchor: 'start', cls: 'k-label' }),
      text(G.x0, G.y0 - 24, ph ? 'height under walker' : 'height under the walker', { anchor: 'start', cls: 'k-tick' }),
      axes(G, { xTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']], yTicks: [[1, '1'], [0, '0']], zero: false }),
      step(1, 'a walker, the tone, moves along the rim from 0 Hz to 4,000 Hz; its height dips to 0 only at 2,000 Hz',
        tones.map((f, i) => { const t = 180 * f / 4000, [x, y] = proj(cosd(t), sind(t), h(cosd(t), sind(t)));
          return g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: i * 0.55, len: 0.6 } }, circle(x, y, 6.5, { cls: 'z6-walker' })); }),
        tones.map((f, i) => g({ anim: { k: 'in', d: i * 0.55 + 0.1, len: 0.3 } }, stems(G, [[f, notchGain(f)]], { dot: 3 })))),
      step(2, 'a point inside the rim: 0.9j raised to the powers 0 to 7 spirals inward, a quarter turn per step',
        circle(ix, iy, iR, { cls: 'z6-faint-rim' }), line(ix - iR - 8, iy, ix + iR + 8, iy, { cls: 'k-axis' }),
        g({ anim: { k: 'in', d: 5.2, len: 1 } }, spiralPath),
        spiral.map(([x, y], n) => g({ anim: { k: 'in', d: 5.2 + n * 0.25, len: 0.3 } }, circle(x, y, 3.5, { cls: 'z6-tone' }),
          n < 4 ? text(x + [10, 8, -10, 8][n], y + [-6, -4, -6, 14][n], String(n), { anchor: n === 2 ? 'end' : 'start', cls: 'k-tick' }) : ''))),
      text(ix, iy + iR + 22, '(0.9j)ⁿ, n = 0 to 7', { cls: 'k-tick' }),
      text(ix, iy + iR + 38, ph ? '× 0.9 each turn' : 'quarter turns, × 0.9', { cls: 'k-tick' }),
    ];
  };

  const feedback = L => {
    const ph = L.phone, s = L.slug;
    const box = (x, y, w, h, name, cls) => k.box(x, y, w, h, { name, cls });
    const sum = (x, y) => g({}, circle(x, y, 16, { cls: 'z6-sum' }), text(x, y + 6, '+', { cls: 'k-name', style: 'font-size:18px' }));
    const A = (pts, tone) => k.arrow(s, pts, tone ? { tone, cls: 'k-arrow' } : {});
    if (ph) {
      const pulse = [[120, 470], [282, 470], [282, 412], [282, 360], [216, 360], [136, 360]];
      return [
        text(120, 26, 'x[n]', { cls: 'k-name' }),
        step(1, 'the input and the input two samples ago are added, then scaled by 0.905',
          g({}, A([[120, 36], [120, 202]]), A([[120, 64], [226, 64], [226, 98]]), A([[226, 142], [226, 220], [138, 220]]),
            A([[120, 238], [120, 258]]), A([[120, 302], [120, 342]]), A([[120, 378], [120, 516]]))),
        box(160, 100, 132, 40, 'two samples ago'), sum(120, 220), box(72, 260, 96, 40, '× 0.905'), sum(120, 360),
        text(120, 538, 'y[n]', { cls: 'k-name' }),
        step(2, 'the loop: the output, two samples ago, times minus 0.81, back into the sum',
          g({ anim: { k: 'in', d: 1, len: 0.8 } }, A([[120, 470], [282, 470], [282, 454]], 'accent'), A([[282, 410], [282, 360], [258, 360]], 'accent'), A([[176, 360], [138, 360]], 'accent'))),
        box(220, 412, 124, 40, 'two samples ago', 'k-box-accent'), box(176, 340, 80, 40, '× −0.81', 'k-box-accent'),
        step(3, 'a pulse goes once around the loop every two samples',
          pulse.map(([x, y], i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 2 + i * 0.35, len: 0.45 } }, circle(x, y, 6, { cls: 'z6-pulse' })))),
        text(200, 500, 'feedback', { anchor: 'start', cls: 'k-note-accent' }),
      ];
    }
    const pulse = [[600, 110], [600, 150], [600, 230], [544, 250], [440, 230], [440, 160]];
    return [
      text(20, 116, 'x[n]', { anchor: 'start', cls: 'k-name' }),
      step(1, 'the input and the input two samples ago are added, then scaled by 0.905',
        g({}, A([[60, 110], [222, 110]]), A([[80, 110], [80, 188], [98, 188]]), A([[232, 188], [240, 188], [240, 128]]),
          A([[258, 110], [282, 110]]), A([[380, 110], [422, 110]]), A([[458, 110], [640, 110]]))),
      box(100, 168, 132, 40, 'two samples ago'), sum(240, 110), box(284, 90, 96, 40, '× 0.905'), sum(440, 110),
      text(648, 116, 'y[n]', { anchor: 'start', cls: 'k-name' }),
      step(2, 'the loop: the output, two samples ago, times minus 0.81, back into the sum',
        g({ anim: { k: 'in', d: 1, len: 0.8 } }, A([[600, 110], [600, 152]], 'accent'), A([[600, 194], [600, 250], [490, 250]], 'accent'), A([[440, 230], [440, 128]], 'accent'))),
      box(534, 154, 132, 40, 'two samples ago', 'k-box-accent'), box(392, 230, 96, 40, '× −0.81', 'k-box-accent'),
      step(3, 'a pulse goes once around the loop every two samples',
        pulse.map(([x, y], i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 2 + i * 0.35, len: 0.45 } }, circle(x, y, 6, { cls: 'z6-pulse' })))),
      text(250, 296, 'feedback: the filter reuses its own output', { anchor: 'start', cls: 'k-note-accent' }),
      text(20, 30, 'y[n] = 0.905 (x[n] + x[n − 2]) − 0.81 y[n − 2]', { anchor: 'start', cls: 'k-num' }),
    ];
  };

  const notchFig = L => {
    const ph = L.phone;
    const [cx, cy, R, d0] = ph ? [180, 350, 290, 54] : [360, 540, 470, 44];
    const P = polar(cx, cy, R);
    const [zx, zy] = P(1, 90), [px, py] = P(0.9, 90), [ax, ay] = P(1, 67.5), [bx, by] = P(1, 85.5);
    const tx = ph ? 20 : 40, ty = ph ? 160 : 238;
    return [
      path(arcD(cx, cy, R, d0, 180 - d0), { cls: 'z6-rim' }),
      line(zx, zy - 12, zx, py + 40, { cls: 'k-guide' }),
      line(ax, ay, zx, zy, { cls: 'z6-dist' }), line(ax, ay, px, py, { cls: 'z6-dist-pole' }),
      text(zx + (ph ? 0.7 : 0.6) * (ax - zx), zy + (ph ? 0.7 : 0.6) * (ay - zy) - 16, '0.39', { cls: 'k-num' }),
      text((ax + px) / 2 + (ph ? -30 : 10), (ay + py) / 2 + 22, '0.38', { cls: 'k-num' }),
      zeroO(zx, zy, 7), poleX(px, py, 6.5), circle(ax, ay, 5.5, { cls: 'z6-tone' }), circle(bx, by, 4.5, { cls: 'z6-tone' }),
      text(zx - 12, zy - 10, ph ? 'zero, 2,000 Hz' : 'zero at 2,000 Hz: removed', { anchor: 'end', cls: 'k-label' }),
      text(px - 12, py + 4, ph ? 'pole at 0.9' : 'pole, radius 0.9', { anchor: 'end', cls: 'k-label' }),
      text(ax + (ph ? 4 : 10), ay + (ph ? 30 : -10), '1,500 Hz', { anchor: ph ? 'end' : 'start', cls: 'k-tick' }),
      text(bx + 2, by - 14, ph ? '1,900' : '1,900 Hz', { anchor: 'start', cls: 'k-tick' }),
      ph ? '' : [[1000, 45], [3000, 135]].map(([f, d]) => text(...P(1, d).map((v, i) => v + [d < 90 ? -12 : 12, 4][i]), `${hz(f)} Hz`, { anchor: d < 90 ? 'end' : 'start', cls: 'k-tick' })),
      text(tx, ty, ph ? 'solid: to the zero · dash-dot: to the pole' : 'solid: distance to the zero · dash-dot: distance to the pole', { anchor: 'start', cls: 'k-tick' }),
      text(tx, ty + 24, ph ? '1,500 Hz: 0.39 against 0.38, they cancel' : '1,500 Hz: 0.39 to the zero, 0.38 to the pole: they nearly cancel', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 46, ph ? 'keeps 97% (zeros alone: 38%)' : 'with the mirror pair below: keeps 97% (zeros alone: 38%)', { anchor: 'start', cls: 'k-num-accent' }),
      text(tx, ty + 68, '1,900 Hz keeps 60% · 2,000 Hz removed', { anchor: 'start', cls: 'k-num' }),
      text(tx, ty + 90, ph ? 'mirror pair below: not drawn' : 'the mirror zero and pole below the axis are not drawn', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const gainCurves = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 46, y: 40, w: 286, h: 200, xs: [0, 4000], ys: [0, 1.08] }) : plot({ x: 70, y: 40, w: 600, h: 210, xs: [0, 4000], ys: [0, 1.08] });
    const two = f => Math.abs(cosd(360 * f / FS));
    const mk = (shape, x, y, cls) => shape === 'square' ? rect(x - 4, y - 4, 8, 8, { cls }) : shape === 'tri' ? path(`M${r2(x)} ${r2(y - 5.5)}L${r2(x + 5)} ${r2(y + 3.5)}L${r2(x - 5)} ${r2(y + 3.5)}Z`, { cls }) : circle(x, y, 4.5, { cls });
    const series = [
      ['z6-avg', 'circle', 'z6-m', avgGain, [0, 1000, 2000, 3000, 4000], 'the average'],
      ['z6-two', 'square', 'z6-m-hollow', two, [0, 1000, 2000, 3000, 4000], ph ? 'two back' : 'the two-back filter'],
      ['z6-notch', 'tri', 'z6-m-accent', f => notchGain(f), [1500, 1800, 1900, 2000, 2100, 2200, 2500], ph ? 'the notch' : 'the notch, poles at 0.9'],
    ];
    const key = (x, y, [cls, shape, mcls, , , name]) => g({}, line(x, y, x + 30, y, { cls }), mk(shape, x + 15, y, mcls), text(x + 38, y + 4, name, { anchor: 'start', cls: 'k-label' }));
    return [
      axes(P, { xTicks: ph ? [[0, '0'], [2000, '2,000'], [4000, '4,000']] : range(0, 4000, 1000).map(f => [f, f ? hz(f) : '0']), yTicks: [[1, '100%'], [0.5, '50%'], [0, '0%']], zero: false, grid: true }),
      text(P.x1, P.y1 + 36, 'tone, Hz', { anchor: 'end', cls: 'k-tick' }), text(P.x0, P.y0 - 14, 'passes', { anchor: 'start', cls: 'k-tick' }),
      series.map(([cls, shape, mcls, fn, at]) => g({}, curve(P, fn, { cls, n: 800 }), at.map(f => mk(shape, P.X(f), P.Y(fn(f)), mcls)))),
      text(P.X(3000) + 8, P.Y(avgGain(3000)) + 4, '38%', { anchor: 'start', cls: 'k-num' }),
      text(P.X(1900) - 8, P.Y(0.6) + 4, '60%', { anchor: 'end', cls: 'k-num-accent' }),
      ph ? series.map((sr, i) => key(20, 290 + i * 22, sr)) : series.map((sr, i) => key(70 + i * 210, 314, sr)),
    ];
  };

  const echo = L => {
    const ph = L.phone;
    const rows = [[0.9, 'radius 0.9: stable', 'down to 0.5% by n = 50, 6.25 ms', true], [1, 'radius 1: rings forever', '±1 forever', false], [1.1, 'radius 1.1: blows up', 'off the scale: 117 at n = 50', false]];
    return [
      text(ph ? 16 : 20, 26, ph ? 'the feedback loop alone, one click in' : 'the feedback loop alone, y[n] = x[n] − r² y[n − 2], one click in', { anchor: 'start', cls: 'k-label' }),
      ph ? text(16, 44, 'y[n] = x[n] − r² y[n − 2]', { anchor: 'start', cls: 'k-num' }) : '',
      rows.map(([r, name, note, ok], i) => {
        const top = ph ? 80 + i * 158 : 56 + i * 120;
        const P = ph ? plot({ x: 30, y: top + 46, w: 316, h: 70, xs: [-1, 51], ys: [-1.3, 1.3] }) : plot({ x: 170, y: top + 16, w: 530, h: 76, xs: [-1, 51], ys: [-1.3, 1.3] });
        const [ccx, ccy, cR] = ph ? [300, top + 2, 26] : [72, top + 54, 42];
        const C = polar(ccx, ccy, cR);
        const vals = range(0, 50, 2).map(n => [n, (-(r * r)) ** (n / 2)]);
        const inside = vals.filter(([, v]) => Math.abs(v) <= 1.3), over = vals.filter(([, v]) => Math.abs(v) > 1.3);
        return g({},
          text(ph ? 16 : P.x0, ph ? top : top + 6, name, { anchor: 'start', cls: 'k-name', style: 'font-size:14px' }),
          ok ? check(ph ? 16 + name.length * 7.6 + 14 : P.x0 + name.length * 7.6 + 14, (ph ? top : top + 6) - 5) : cross(ph ? 16 + name.length * 7.6 + 14 : P.x0 + name.length * 7.6 + 14, (ph ? top : top + 6) - 5),
          text(ph ? 16 : P.x1, ph ? top + 18 : top + 6, note, { anchor: ph ? 'start' : 'end', cls: 'k-tick' }),
          circle(ccx, ccy, cR, { cls: 'z6-rim' }), line(ccx - cR - 6, ccy, ccx + cR + 6, ccy, { cls: 'k-axis' }),
          poleX(...C(r, 90), 4.5), poleX(...C(r, 270), 4.5),
          axes(P, { xTicks: i === 2 ? [[0, 'n = 0'], [10, '10'], [20, '20'], [30, '30'], [40, '40'], [50, '50']] : [], yTicks: ph ? [] : [[1, '1'], [-1, `${M}1`]] }),
          step(i + 1, `radius ${r}: ${note}`,
            inside.map(([n, v], j) => g({ anim: { k: 'in', d: i * 2.4 + j * 0.08, len: 0.2 } }, stems(P, [[n, v]], { dot: ph ? 2.2 : 2.8 }))),
            over.map(([n, v], j) => g({ anim: { k: 'in', d: i * 2.4 + (inside.length + j) * 0.08, len: 0.2 } }, line(P.X(n), P.Y(0), P.X(n), v > 0 ? P.y0 : P.y1, { cls: 'k-stem' }), circle(P.X(n), v > 0 ? P.y0 : P.y1, 2.6, { cls: 'k-hollow k-stem-dot' })))),
          range(1, 49, 2).map(n => circle(P.X(n), P.Y(0), 1.2, { cls: 'k-stop' })));
      }),
      text(ph ? 16 : 170, L.H - 12, ph ? 'poles drawn beside each row' : 'beside each row: its pole pair, inside, on or outside the circle', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const fig = (name, size, phone, title, desc, caption, body, steps = 0) => ({
    name, w: 720, h: size, phone: { w: 360, h: phone }, title, desc, caption, steps, css, eyebrow: 'Lesson 6 · zeros and poles',
    body: (kk, L) => [inkHead(L.slug), body(L)],
  });

  return [
    fig('average', 330, 690, 'Averaging neighbors removes the whine',
      'Eight samples of the 4,000 Hz whine flip +1, −1, and each average of a sample and the one before is 0; for a 500 Hz tone each average is a stem a touch shorter, the same tone half a sample late.',
      'Each output is the average of a sample and the one before it. The whine’s neighbors cancel to 0; the slow 500 Hz tone barely changes.', average, 4),
    fig('wheel', 330, 540, 'Every tone turns a wheel',
      'Dots turning counter-clockwise 45, 90 and 180 degrees per sample for 1,000, 2,000 and 4,000 Hz, with their stops numbered and the left-right position read at each stop.',
      'A tone is a dot turning 360° × tone ÷ 8,000 per sample. Its left-right position at each stop is the sample.', wheelFig, 3),
    fig('midpoint', 440, 510, 'The average is a midpoint',
      'The fresh 500 Hz dot and the one-sample-old dot sit 22.5 degrees apart on the rim; their midpoint is 0.98 from the center and 11.25 degrees behind the fresh dot, 2% inside the rim.',
      'Zoomed in on the rim: the average of two dots is the midpoint of the chord between them, 0.98 from the center. The short gap to the rim is the 2% the average loses at 500 Hz.', midpoint),
    fig('radians', 390, 370, 'Radians: a turn measured by the walk',
      'A dot walks once around a wheel of radius 1 while a thread unrolls along a ruler; 45 degrees is π/4 and 1,000 Hz, 90 degrees is π/2 and 2,000 Hz, 180 degrees is π and 4,000 Hz, and the full walk is 2π, about 6.28.',
      'Lay the walk along the rim flat on a ruler: a full turn of a radius-1 wheel is 2π, about 6.28.', radians, 2),
    fig('unit-circle', 400, 370, 'The unit circle: one spot per tone',
      'One dot sweeps the top half of a radius-1 circle from 0 Hz at the right to 4,000 Hz at the left, leaving a spot every 1,000 Hz labeled 0, π/4, π/2, 3π/4 and π; the dotted bottom half is for mirror arrows, later.',
      'Every tone gets a fixed spot: where its dot lands after one sample. The angle in radians is ω.', unitCircle, 2),
    fig('zero', 330, 470, 'The average has one zero',
      'The averaging filter has a zero at 4,000 Hz on the left of the circle; 0 Hz is 2.00 from it and 2,000 Hz is 1.41 from it, so 2,000 Hz passes 1.41 ÷ 2, 71%.',
      'How much of a tone passes is its distance to the zero, compared with 2, the distance of 0 Hz.', zeroFig),
    fig('j-turn', 330, 600, 'j is a quarter turn',
      'The arrow 1 turns a quarter turn counter-clockwise to j at the top, then another to −1 at the left, so j × j = −1; the point 45 degrees up the rim is 0.71 right plus j times 0.71 up.',
      'Times j turns an arrow a quarter turn counter-clockwise. Two quarter turns make a flip: j × j = −1.', jTurn, 4),
    fig('multiply', 330, 640, 'Multiplying points: sizes multiply, angles add',
      '0.71 + 0.71j times itself has size 1 and angle 45 + 45 = 90 degrees, the point j; 0.9j times itself has size 0.81 and angle 180 degrees, −0.81.',
      'Dashed arrows go in; the solid arrow is the product. The angles stack end to end while the lengths multiply.', multiply, 4),
    fig('spinning-arrow', 430, 660, 'The tone is a turning arrow',
      'The 1,000 Hz arrow steps 45 degrees per sample; its left-right shadow writes the samples 1.00, 0.71, 0.00, −0.71, −1.00, −0.71, 0.00, 0.71, and times j turns the arrow at 45 degrees on to 135 degrees.',
      'The arrow’s left-right shadow is the sample you have read off the wheel since lesson 3. Times j adds 90° to its angle.', spinning, 3),
    fig('delay', 330, 470, 'A delay turns the dot back',
      'The fresh 1,000 Hz dot and its one-sample-old copy turn together, the old copy always 45 degrees clockwise behind; the arc between them is times z to the minus one.',
      'The copy one sample old sits ω clockwise behind the fresh dot: multiplying by z⁻¹ turns a point ω clockwise.', delay, 2),
    fig('mirror-arrow', 360, 660, 'A real tone is two arrows',
      'Two half-size arrows turn opposite ways, one on the top half and its mirror arrow on the bottom half; added they always lie on the horizontal axis, 0.71 at n = 1. A zero on the top arrow sends it to 0, and the mirror arrow passes as a half-size tone.',
      'Left: an arrow and its mirror arrow add up to a real tone. Right: a zero on one arrow removes only that half.', mirror, 4),
    fig('dull', 350, 490, 'Zeros at ±j dull 1,500 Hz',
      'With zeros at j and −j, 1,500 Hz is 0.39 and 1.96 from them, a product of 0.77, against 1.41 times 1.41, 2, for 0 Hz, so 1,500 Hz keeps 38%.',
      'Multiply the distances to both zeros, then compare with 0 Hz: 1,500 Hz keeps only 38%.', dull),
    fig('zero-pair', 380, 620, 'A zero pair at any angle',
      'Zero pairs at θ = π/4, π/2 and 3π/4 with middle weights −1.41, 0 and +1.41; the program is y[n] = x[n] − 2cos θ x[n−1] + x[n−2], and θ = π/2 gives x[n] + x[n−2].',
      'Put the pair at the whine’s angle θ and its mirror. The middle weight of the program is −2cos θ.', zeroPair),
    fig('z-plane', 400, 570, 'The size of H over the whole plane',
      'A relief of the size of H for the notch: pits at the zeros ±j on the rim and spikes at the poles ±0.9j just inside; a walker on the rim from 0 Hz to 4,000 Hz stays near height 1 and dips to 0 only at 2,000 Hz; (0.9j) to the power n spirals inward.',
      'A relief map of the size of H, its front edge cut through the zero at j. Tones only walk the rim; the height under a tone is how much of it passes.', zPlane, 2),
    fig('feedback', 320, 560, 'Feedback: the filter listens to itself',
      'Block flow of y[n] = 0.905 (x[n] + x[n−2]) − 0.81 y[n−2]: the input and the input two samples ago are added and scaled by 0.905, and the output two samples ago, times −0.81, loops back into the sum.',
      'The loop on the right is the feedback: each output is fed back, two samples later, times −0.81.', feedback, 3),
    fig('notch', 340, 270, 'A pole beside the zero saves the voice',
      'Close-up of the top of the circle: zero at 2,000 Hz and pole at radius 0.9 below it; 1,500 Hz is 0.39 from the zero and 0.38 from the pole, so it keeps 97% (38% with zeros alone); 1,900 Hz keeps 60%, 2,000 Hz is removed.',
      'Up close: far from the notch, a tone’s distances to the zero and the pole nearly cancel. Only close to 2,000 Hz does the zero win.', notchFig),
    fig('gain-curves', 340, 370, 'Three filters, three gain curves',
      'Gain from 0 to 4,000 Hz: the average falls from 100% to 0 at 4,000 Hz (38% at 3,000 Hz), the two-back filter dips to 0 at 2,000 Hz, and the notch stays near 100% except a narrow dip to 0 at 2,000 Hz (60% at 1,900 Hz).',
      'The notch removes 2,000 Hz and keeps almost everything else; the two-back filter takes the middle of the voice with it.', gainCurves),
    fig('echo', 450, 590, 'A pole’s radius: how much an echo keeps',
      'One click through the feedback loop alone: with poles at radius 0.9 the echo fades to 0.5% by sample 50, at radius 1 it rings at ±1 forever, at radius 1.1 it grows to 117 by sample 50.',
      'The feedback loop alone, no zeros. Each echo is the last one times −r²; only poles inside the circle let it die out.', echo, 3),
  ];
};
