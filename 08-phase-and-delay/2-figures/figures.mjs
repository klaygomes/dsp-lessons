import * as D from './dsp.mjs';

const CSS = `
.k-fig .l-pole { stroke: var(--ink); stroke-width: 1.3; fill: none; }
.k-fig .l-zero { stroke: var(--ink-soft); stroke-width: 2.6; stroke-dasharray: 8 3 2 3; fill: none; }
.k-fig .l-win { fill: var(--ink-soft); opacity: 0.16; }
.k-fig .l-win-edge { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .l-sum { stroke: var(--accent); stroke-width: 4; fill: none; }
.k-fig .l-half { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
.k-fig .l-ref { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 5; fill: none; }
.k-fig .l-ink { stroke: var(--ink); stroke-width: 2; fill: none; }
.k-fig .l-thin { stroke: var(--ink); stroke-width: 1.2; fill: none; }
.k-fig .l-soft { stroke: var(--ink-soft); stroke-width: 1; fill: none; }
.k-fig .l-env { stroke: var(--ink-soft); stroke-width: 2.2; fill: none; }
.k-fig .l-dot { stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 0.5 5; stroke-linecap: round; fill: none; }
.k-fig .l-ap { stroke: var(--input); stroke-width: 2; fill: none; }
.k-fig .l-total { stroke: var(--accent); stroke-width: 2.5; fill: none; }
.k-fig .l-arc { stroke: var(--accent); stroke-width: 2.5; fill: none; }
.k-fig .l-m-ink { fill: var(--ink); }
.k-fig .l-m-hollow { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .l-m-soft { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .l-m-ap { fill: var(--input); }
.k-fig .l-m-total { fill: var(--accent); }
.k-fig .l-x { stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; }
.k-fig .l-x-accent { stroke: var(--accent); stroke-width: 2.5; stroke-linecap: round; }
.k-fig .l-o { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .l-tri1 { fill: var(--paper-2); }
.k-fig .l-tri2 { fill: none; stroke: var(--ink); stroke-width: 2.4; stroke-linejoin: round; }
.k-fig .l-halo { fill: var(--paper); }
.k-fig .l-wedge { fill: var(--accent-soft); stroke: none; opacity: 0.8; }
.k-fig .l-bracket { stroke: var(--accent); stroke-width: 2; fill: none; }
.k-fig .l-bracket-input { stroke: var(--input); stroke-width: 2; fill: none; }
`;

export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, band, stems, step, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const poly = (pts, cls, o = {}) => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), { cls, ...o });
  const fn = (P, f, a, b, cls, n = 300, o = {}) => poly(range(0, n).map(i => { const t = a + (b - a) * i / n; return [P.X(t), P.Y(f(t))]; }), cls, o);
  const mark = (shape, x, y, cls, s = 4.5) => shape === 'circle' ? circle(x, y, s, { cls })
    : shape === 'square' ? rect(x - s, y - s, 2 * s, 2 * s, { cls })
    : shape === 'triangle' ? path(`M${r2(x)} ${r2(y - s - 1)}L${r2(x + s + 1)} ${r2(y + s)}L${r2(x - s - 1)} ${r2(y + s)}Z`, { cls, fill: undefined })
    : path(`M${r2(x)} ${r2(y - s - 1)}L${r2(x + s + 1)} ${r2(y)}L${r2(x)} ${r2(y + s + 1)}L${r2(x - s - 1)} ${r2(y)}Z`, { cls, fill: undefined });
  const marks = (P, f, xs, shape, cls) => g({}, xs.map(t => mark(shape, P.X(t), P.Y(f(t)), cls)));
  const key = (x, y, items, { dx = 230, dy = 22, cols = items.length } = {}) => g({}, items.map(([lineCls, shape, mcls, label], i) => {
    const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
    return g({}, lineCls ? line(lx, ly - 4, lx + 28, ly - 4, { cls: lineCls }) : '', shape ? mark(shape, lx + 14, ly - 4, mcls, 4) : '', text(lx + 36, ly, label, { anchor: 'start', cls: 'k-label' }));
  }));
  const xmark = (x, y, cls = 'l-x', s = 6) => g({}, line(x - s, y - s, x + s, y + s, { cls }), line(x - s, y + s, x + s, y - s, { cls }));
  const omark = (x, y, cls = 'l-o', s = 6) => circle(x, y, s, { cls });
  const arc = (cx, cy, r, a0, a1, cls = 'l-arc') => {
    const p = a => [cx + r * cosd(a), cy - r * sind(a)], [x0, y0] = p(a0), [x1, y1] = p(a1);
    return path(`M${r2(x0)} ${r2(y0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${r2(x1)} ${r2(y1)}`, { cls });
  };
  const turnHz = f => 360 * f / 8000;
  const N = D.notch, AP = D.allpass(0.65, 1200);
  const ph = f => D.phaseDeg(N, f);
  const gdN = f => D.gd(N, f), gdA = f => D.gd(AP, f);

  const smear = L => {
    const ph1 = L.phone;
    const bursts = ph1 ? [[1000, 4], [1800, 24], [1000, 44]] : [[1000, 4], [1800, 24], [1000, 44], [1800, 64]];
    const last = ph1 ? 76 : 94;
    const x0 = ph1 ? 20 : 40, w = L.W - x0 - (ph1 ? 20 : 30);
    const top = ph1 ? 78 : 86, bot = ph1 ? 232 : 220, amp = ph1 ? 30 : 34;
    const S = plot({ x: x0, y: top - amp, w, h: 2 * amp, xs: [0, last], ys: [-1, 1] });
    const R = plot({ x: x0, y: bot - amp, w, h: 2 * amp, xs: [0, last], ys: [-1, 1] });
    const px = w / last;
    const info = f => ({ shape: f === 1000 ? 0.31 : 3.24, wave: f === 1000 ? 0.20 : 0.56, gain: f === 1000 ? 0.987 : 0.701 });
    const env = (t, s) => { const u = t - s; if (u < 0 || u > 20) return 0; return Math.min(1, u / 2, (20 - u) / 2); };
    const envOut = (t, s, d) => { const u = t - s - d; if (u < 0) return 0; if (u <= 20) return Math.min(1, u / 2.5, (20 - u) / 2 + 0.25 * (d > 1)); return d > 1 ? 0.25 * Math.exp(-(u - 20) / 2.5) : 0; };
    const sent = ([f, s]) => fn(S, t => env(t, s) * cosd(turnHz(f) * (t - s)), s - 0.5, s + 20.5, 'k-line', 260);
    const recv = ([f, s]) => { const I = info(f); return fn(R, t => I.gain * envOut(t, s, I.shape) * cosd(turnHz(f) * (t - s - I.wave)), s, s + (f === 1000 ? 20.5 : 30), 'k-line', 340); };
    const ghost = ([, s]) => fn(R, t => env(t, s), s - 0.5, s + 20.5, 'l-ref', 80);
    const lows = bursts.filter(b => b[0] === 1000), highs = bursts.filter(b => b[0] === 1800);
    const h0 = highs[0][1], next = bursts.find(b => b[1] === h0 + 20)[1];
    const overlap = rect(R.X(next), R.y0 - 4, px * 3.6, R.h + 8, { fill: `url(#${L.slug}-hatch)`, cls: 'k-bar-hatch' });
    const bx = R.X(h0), by = R.y1 + 40, late = bx + 3.24 * px;
    const arrive = (d, dx = 0) => ({ k: 'move', dy: -24, dx, d, len: 1.4 });
    const big = ph1 ? 24 : 32, bigX = x0;
    return [
      text(x0, top - amp - 16, 'as sent: crisp bursts, back to back', { anchor: 'start', cls: 'k-name' }),
      text(x0, bot - amp - 18, 'as received', { anchor: 'start', cls: 'k-name' }),
      line(S.x0, top, S.x1, top, { cls: 'k-axis' }), line(R.x0, bot, R.x1, bot, { cls: 'k-axis' }),
      step(4, 'the smear where a late burst overlaps the next one', g({ anim: { k: 'in', d: 4.6 } }, overlap)),
      step(1, 'the bursts as sent, alternating 1,000 Hz and 1,800 Hz', g({}, bursts.map(sent),
        bursts.map(([f, s]) => text(S.X(s + 10), top + amp + 16, `${hz(f)} Hz`, { cls: 'k-tick' })))),
      step(2, 'the 1,000 Hz bursts arrive 0.31 samples late, almost on time',
        g({ anim: { k: 'in', d: 1, len: 0.5 } }, g({ anim: arrive(1) }, lows.map(recv)))),
      step(3, 'the 1,800 Hz bursts arrive 3.24 samples late and run into the next burst',
        g({}, highs.map(ghost)),
        g({ anim: { k: 'in', d: 2.5, len: 0.5 } }, g({ anim: arrive(2.5, -3.24 * px) }, highs.map(recv)))),
      step(4, 'the 3.24-sample offset on the trace beside the fax window of 1.5 samples',
        g({ anim: { k: 'in', d: 4.6 } },
          bursts.map(([f, s]) => text(R.X(s + 10), R.y1 + 16, `${hz(f)} Hz`, { cls: 'k-tick' })),
          line(bx, R.y0 - 2, bx, by, { cls: 'l-soft' }), line(late, R.y0 + 6, late, by, { cls: 'l-soft' }),
          path(`M${r2(bx)} ${by - 5}V${by}H${r2(late)}V${by - 5}`, { cls: 'l-bracket' }),
          rect(bigX, by + 26, 3.24 * big, 12, { cls: 'l-m-total' }),
          text(bigX + 3.24 * big + 8, by + 36, '3.24 samples late (1,800 Hz)', { anchor: 'start', cls: 'k-num-accent' }),
          rect(bigX, by + 46, 1.5 * big, 12, { cls: 'l-win' }), rect(bigX, by + 46, 1.5 * big, 12, { cls: 'l-win-edge' }),
          text(bigX + 3.24 * big + 8, by + 56, 'the fax’s window: 1.5 samples', { anchor: 'start', cls: 'k-label' }),
          text(bigX, by + 16, `drawn larger, ${big} px per sample:`, { anchor: 'start', cls: 'k-tick' }),
          text(R.X(next) + px * 1.8, R.y0 - 10, 'smear', { cls: 'k-note-accent' }),
          text(x0, by + 80, '1,000 Hz: 0.31 samples late, inside the window', { anchor: 'start', cls: 'k-label' }),
          text(x0, by + 98, ph1 ? 'dashed: 1,800 Hz on time' : 'dashed: where the 1,800 Hz bursts would be on time', { anchor: 'start', cls: 'k-tick' }))),
      ph1 ? g({}, text(x0, L.H - 30, 'gain: 1,000 Hz 98.7%, 1,800 Hz 70.1%', { anchor: 'start', cls: 'k-label' }), text(x0, L.H - 12, 'every tone loud enough', { anchor: 'start', cls: 'k-label' }))
        : text(L.W - 30, top - amp - 16, 'gain: 1,000 Hz 98.7%, 1,800 Hz 70.1%', { anchor: 'end', cls: 'k-label' }),
    ];
  };

  const wheelPhase = L => {
    const ph1 = L.phone;
    const cx = ph1 ? 180 : 170, cy = ph1 ? 170 : 175, R = ph1 ? 100 : 112, aIn = 0, aOut = aIn - 45.5, gOut = 0.701;
    const at = (a, r) => [cx + r * cosd(a), cy - r * sind(a)];
    const [ix, iy] = at(aIn, R), [ox, oy] = at(aOut, R * gOut);
    const P = ph1 ? plot({ x: 40, y: 380, w: 290, h: 120, xs: [-0.6, 3.4], ys: [-1.15, 1.15] }) : plot({ x: 390, y: 90, w: 300, h: 160, xs: [-0.6, 3.4], ys: [-1.15, 1.15] });
    const w81 = t => cosd(81 * t), wOut = t => gOut * cosd(81 * t - 45.5);
    const by = P.y0 - 8;
    const [lx, ly] = at(-22.75, R * 0.56);
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      circle(cx, cy, R * gOut, { cls: 'l-soft' }),
      text(cx, cy + R + 26, ph1 ? '1,800 Hz: 81° per sample, shown at n = 0' : '1,800 Hz turns 81° per sample; shown at n = 0', { cls: 'k-tick' }),
      text(cx, cy + R + 44, 'inner ring: the output’s size, 70.1%', { cls: 'k-tick' }),
      step(1, 'the input and output dots turn counter-clockwise 81 degrees per sample, the output 45.5 degrees behind',
        g({ anim: { k: 'turn', r0: `${4 * 81}deg`, steps: 5, d: 0, len: 4 }, style: `transform-origin:${cx}px ${cy}px` },
          line(cx, cy, ix, iy, { cls: 'l-ref' }), circle(ix, iy, 6, { cls: 'l-m-soft' }),
          line(cx, cy, ox, oy, { cls: 'k-line' }), circle(ox, oy, 6, { cls: 'l-m-ink' }),
          arc(cx, cy, R * 0.36, aOut, aIn))),
      step(2, 'the gap is 45.5 degrees: 45.5 divided by 81 is 0.56 samples',
        g({ anim: { k: 'in', d: 4.2 } },
          text(lx + 4, ly + 4, '45.5°', { anchor: 'start', cls: 'k-num-accent' }),
          text(ix - 4, iy - 14, 'input', { anchor: 'start', cls: 'k-label' }),
          text(ox + 10, oy + 16, 'output', { anchor: 'start', cls: 'k-label' }),
          axes(P, { xTicks: [[0, 'n = 0'], [1, '1'], [2, '2'], [3, '3 samples']], yTicks: [[1, '1'], [-1, `${M}1`]] }),
          fn(P, w81, -0.6, 3.4, 'l-ref'), fn(P, wOut, -0.6, 3.4, 'k-line'),
          range(0, 3).map(n => g({}, circle(P.X(n), P.Y(w81(n)), 4, { cls: 'l-m-soft' }), circle(P.X(n), P.Y(wOut(n)), 4, { cls: 'l-m-ink' }))),
          path(`M${r2(P.X(0))} ${by + 5}V${by}H${r2(P.X(0.562))}V${by + 5}`, { cls: 'l-bracket' }),
          text(P.X(0.562) + 8, by + 2, 'crest 0.56 samples later', { anchor: 'start', cls: 'k-num-accent' }),
          key(P.x0 - 30, P.y1 + 52, [['l-ref', 'circle', 'l-m-soft', 'input'], ['k-line', 'circle', 'l-m-ink', 'output']], { dx: 130 }))),
      text(ph1 ? 180 : 540, L.H - 14, '45.5° ÷ 81° per sample = 0.56 samples late', { cls: 'k-note' }),
    ];
  };

  const phaseLines = L => {
    const ph1 = L.phone;
    const cx = ph1 ? 140 : 230, cy = ph1 ? 190 : 205, R = ph1 ? 118 : 150;
    const T = [cx + R * cosd(45), cy - R * sind(45)];
    const items = [
      { p: [cx, cy - 0.85 * R], pole: true, name: 'pole, up', dir: -11.4 },
      { p: [cx, cy + 0.85 * R], pole: true, name: 'pole, down', dir: 65.6 },
      { p: [cx, cy - R], pole: false, name: 'zero, top', dir: -22.5 },
      { p: [cx, cy + R], pole: false, name: 'zero, bottom', dir: 67.5 },
    ];
    const lab = (it, i) => it.pole ? text(it.p[0] - 12, it.p[1] + 4, 'pole', { anchor: 'end', cls: 'k-tick' }) : text(it.p[0], it.p[1] + (i === 2 ? -12 : 22), 'zero', { cls: 'k-tick' });
    const sx = ph1 ? 24 : 440, sy = ph1 ? 470 : 200;
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      items.map(it => line(it.p[0], it.p[1], it.p[0] + 30, it.p[1], { cls: 'l-soft' })),
      items.filter(it => !it.pole).map(it => line(it.p[0], it.p[1], T[0], T[1], { cls: 'l-zero' })),
      items.filter(it => it.pole).map(it => line(it.p[0], it.p[1], T[0], T[1], { cls: 'l-pole' })),
      items.map((it, i) => arc(it.p[0], it.p[1], [70, 40, 50, 26][i], Math.min(0, it.dir), Math.max(0, it.dir), 'l-arc')),
      text(cx + (ph1 ? 20 : 36), items[0].p[1] + (ph1 ? 30 : 38), '−11.4°', { anchor: 'start', cls: 'k-num-accent' }),
      text(cx - 14, items[1].p[1] - 22, '+65.6°', { anchor: 'end', cls: 'k-num-accent' }),
      text(cx + 46, items[2].p[1] - 6, '−22.5°', { anchor: 'start', cls: 'k-num-accent' }),
      text(cx + 30, items[3].p[1] + 16, '+67.5°', { anchor: 'start', cls: 'k-num-accent' }),
      items.map(it => it.pole ? xmark(it.p[0], it.p[1]) : omark(it.p[0], it.p[1])),
      items.map(lab),
      circle(T[0], T[1], 6, { cls: 'l-m-total' }),
      text(T[0] + 12, T[1] - 8, '1,000 Hz', { anchor: 'start', cls: 'k-label' }),
      g({}, items.map((it, i) => text(sx, sy - 100 + i * 20, `${it.name}: ${it.dir > 0 ? '+' : M}${Math.abs(it.dir).toFixed(1)}°, counts ${it.pole ? '+' : M}`, { anchor: 'start', cls: 'k-label' }))),
      text(sx, sy, `pole lines:  ${M}11.4° + 65.6° = 54.2°`, { anchor: 'start', cls: 'k-num' }),
      text(sx, sy + 24, `zero lines:  ${M}22.5° + 67.5° = 45.0°`, { anchor: 'start', cls: 'k-num' }),
      text(sx, sy + 56, 'phase = 54.2° − 45.0° = 9.2°', { anchor: 'start', cls: 'k-num-accent' }),
      text(sx, sy + 80, 'the short rays point right: 0°', { anchor: 'start', cls: 'k-tick' }),
      text(sx, sy + 96, 'angles turn counter-clockwise from them', { anchor: 'start', cls: 'k-tick' }),
      text(sx, sy + 112, 'coral arcs: each line’s direction', { anchor: 'start', cls: 'k-tick' }),
      key(sx, sy + 144, [['l-pole', null, null, '× pole: its line counts plus'], ['l-zero', null, null, '○ zero: its line counts minus']], { cols: 1 }),
    ];
  };

  const linearPhase = L => {
    const ph1 = L.phone;
    const P = ph1 ? plot({ x: 50, y: 40, w: 290, h: 300, xs: [0, 2000], ys: [0, 290] }) : plot({ x: 70, y: 40, w: 500, h: 260, xs: [0, 2000], ys: [0, 290] });
    const dl = f => 3 * turnHz(f), av = f => 0.5 * turnHz(f);
    return [
      axes(P, { xTicks: [[0, '0'], [500, '500'], [1000, '1,000'], [1500, '1,500'], [2000, '2,000']], yTicks: [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°']], xTitle: 'tone, Hz', yTitle: 'phase, degrees', zero: false }),
      fn(P, dl, 0, 2000, 'l-ink'), marks(P, dl, [500, 1000, 2000], 'square', 'l-m-ink'),
      fn(P, av, 0, 2000, 'l-dot'), marks(P, av, [500, 1000, 1500, 2000], 'circle', 'l-m-soft'),
      fn(P, ph, 0, 1995, 'l-total', 400), marks(P, ph, [1000, 1250, 1500, 1650, 1750, 1800], 'triangle', 'l-m-total'),
      masked(P.X(ph1 ? 760 : 900), P.Y(dl(ph1 ? 760 : 900)) - 16, ph1 ? '3-sample delay' : 'pure 3-sample delay', { anchor: 'end', cls: 'k-label' }),
      ph1 ? '' : masked(P.X(1300), P.Y(av(1300)) - 14, 'two-point average', { anchor: 'end', cls: 'k-label' }),
      ph1 ? '' : text(P.x1 + 10, P.Y(270) + 4, 'straight: same', { anchor: 'start', cls: 'k-note' }),
      ph1 ? '' : text(P.x1 + 10, P.Y(270) + 24, 'delay for every tone', { anchor: 'start', cls: 'k-note' }),
      ph1 ? '' : text(P.x1 + 10, P.Y(45) + 4, 'straight: 0.5 samples', { anchor: 'start', cls: 'k-tick' }),
      ph1 ? '' : text(P.x1 + 10, P.Y(88) + 4, 'the notch bends up', { anchor: 'start', cls: 'k-note-accent' }),
      ph1 ? text(P.x0, L.H - 64, 'straight lines: same delay for every tone', { anchor: 'start', cls: 'k-note' }) : '',
      key(ph1 ? 20 : 70, L.H - (ph1 ? 30 : 18), [['l-ink', 'square', 'l-m-ink', ph1 ? 'delay, 3' : 'delay: 3 samples'], ['l-dot', 'circle', 'l-m-soft', ph1 ? 'average' : 'average: 0.5 samples'], ['l-total', 'triangle', 'l-m-total', 'the notch']], ph1 ? { dx: 112 } : { dx: 190 }),
    ];
  };

  const burstTones = L => {
    const ph1 = L.phone;
    const hann = (n, Ln) => (n < 0 || n > Ln ? 0 : 0.5 - 0.5 * Math.cos(2 * Math.PI * n / Ln));
    const spec = Ln => { const S = f => { let re = 0, im = 0; for (let n = 0; n < Ln; n++) { const a = 2 * Math.PI * (f - 1800) * n / 8000, w = hann(n + 0.5, Ln); re += w * Math.cos(a); im += w * Math.sin(a); } return Math.hypot(re, im); }; const s0 = S(1800); return range(1300, 2300, 50).map(f => [f, S(f) / s0]); };
    const row = (y, Ln, widthText, i) => {
      const B = ph1 ? plot({ x: 40, y, w: 290, h: 90, xs: [0, 64], ys: [-1.1, 1.1] }) : plot({ x: 50, y, w: 290, h: 110, xs: [0, 64], ys: [-1.1, 1.1] });
      const C = ph1 ? plot({ x: 40, y: y + 150, w: 290, h: 80, xs: [1250, 2350], ys: [0, 1.1] }) : plot({ x: 420, y, w: 270, h: 110, xs: [1250, 2350], ys: [0, 1.1] });
      const s0 = 32 - Ln / 2, burst = t => hann(t - s0, Ln) * cosd(81 * (t - s0));
      const bars = spec(Ln).filter(([, v]) => v > 0.01);
      const bw = ph1 ? 4 : 5;
      const ttl = text(B.x0, B.y0 - 12, `a burst ${Ln} samples long`, { anchor: 'start', cls: 'k-name' });
      const burstG = fn(B, burst, 0, 64, 'k-line', 400);
      const clusterG = g({}, bars.map(([f, v]) => rect(C.X(f) - bw / 2, C.Y(v), bw, C.Y(0) - C.Y(v), { cls: f === 1800 ? 'k-bar-accent' : 'k-bar' })));
      const clusterTitle = g({}, text(C.x0, C.y0 - 12, 'its tones', { anchor: 'start', cls: 'k-name' }),
        line(B.x0, B.Y(0), B.x1, B.Y(0), { cls: 'k-axis' }), line(C.x0, C.Y(0), C.x1, C.Y(0), { cls: 'k-axis' }),
        text(B.x1, B.y1 + 18, '64 samples', { anchor: 'end', cls: 'k-tick' }), text(B.x0, B.y1 + 18, '0', { anchor: 'start', cls: 'k-tick' }),
        [1300, 1800, 2300].map(f => text(C.X(f), C.y1 + 18, f === 2300 ? '2,300 Hz' : hz(f), { cls: 'k-tick' })),
        text(C.x1, C.y0 - 12, widthText, { anchor: 'end', cls: 'k-label' }));
      return { B, C, ttl, burstG, clusterG, clusterTitle };
    };
    const A = row(60, 60, ph1 ? 'half height: 270 Hz' : 'at half height: 270 Hz wide', 0);
    const Bq = row(ph1 ? 400 : 250, 30, ph1 ? 'half height: 530 Hz' : 'at half height: 530 Hz wide', 1);
    const origin = P => `transform-origin:${r2((P.x0 + P.x1) / 2)}px ${r2(P.Y(0))}px`;
    const originC = C => `transform-origin:${r2(C.X(1800))}px ${r2(C.Y(0))}px`;
    return [
      step(1, 'a 60-sample burst at 1,800 Hz is made of tones in a narrow cluster around 1,800 Hz', g({}, A.ttl, A.burstG, A.clusterTitle, A.clusterG)),
      step(2, 'the burst shortens to 30 samples and its cluster widens',
        g({}, Bq.ttl, Bq.clusterTitle),
        g({}, g({ anim: { k: 'scale', sx: 2, d: 1.2, len: 2 }, style: origin(Bq.B) }, Bq.burstG), g({ anim: { k: 'scale', sx: 0.5, d: 1.2, len: 2 }, style: originC(Bq.C) }, Bq.clusterG))),
      text(ph1 ? 20 : 360, L.H - 12, ph1 ? 'shorter burst: wider cluster' : 'a shorter burst spreads over more neighboring tones', { anchor: ph1 ? 'start' : 'middle', cls: 'k-note' }),
      text(ph1 ? 20 : 360, L.H - 36, 'coral bar: 1,800 Hz, the burst’s own tone', { anchor: ph1 ? 'start' : 'middle', cls: 'k-tick' }),
    ];
  };

  const catchUp = L => {
    const ph1 = L.phone;
    const R = ph1 ? 50 : 62;
    const w1 = ph1 ? [90, 96] : [104, 116], w2 = ph1 ? [270, 96] : [104, 330];
    const lo = 1560, hi = 1645;
    const Pin = ph1 ? plot({ x: 30, y: 250, w: 310, h: 150, xs: [lo, hi], ys: [-2.1, 2.1] }) : plot({ x: 230, y: 50, w: 460, h: 150, xs: [lo, hi], ys: [-2.1, 2.1] });
    const Pout = ph1 ? plot({ x: 30, y: 500, w: 310, h: 150, xs: [lo, hi], ys: [-2.1, 2.1] }) : plot({ x: 230, y: 262, w: 460, h: 150, xs: [lo, hi], ys: [-2.1, 2.1] });
    const sIn = n => cosd(76.5 * n) + cosd(81 * n), eIn = n => 2 * Math.abs(cosd(2.25 * n));
    const g1 = 0.8304, g2 = 0.7011, p1 = 33.863, p2 = 45.488;
    const sOut = n => g1 * cosd(76.5 * n - p1) + g2 * cosd(81 * n - p2);
    const eOut = n => Math.hypot(g1 * cosd(-p1) + g2 * cosd(4.5 * n - p2), g1 * sind(-p1) + g2 * sind(4.5 * n - p2));
    const wheelAt = ([cx, cy], a1, a2, anim, title, r1 = 1, r2 = 1, ring = 8.5) => {
      const at = (a, f) => [cx + f * R * cosd(a), cy - f * R * sind(a)], [x1, y1] = at(a1, r1), [x2, y2] = at(a2, r2);
      const dots = (kid, step) => anim ? g({ anim: { k: 'turn', r0: `${7 * step}deg`, steps: 8, d: 0, len: 3 }, style: `transform-origin:${cx}px ${cy}px` }, kid) : kid;
      return g({}, line(cx - R - 8, cy, cx + R + 8, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
        dots(g({}, line(cx, cy, x1, y1, { cls: 'l-soft' }), circle(x1, y1, ring, { cls: 'l-m-hollow' })), 76.5),
        dots(g({}, line(cx, cy, x2, y2, { cls: 'k-line' }), circle(x2, y2, 5, { cls: 'l-m-ink' })), 81),
        title.map((t, i) => text(cx, cy + R + 22 + i * 16, t, { cls: 'k-tick' })));
    };
    const row = (P, s, e, waveCls, label) => g({},
      line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
      fn(P, s, lo, hi, waveCls, 900),
      fn(P, e, lo, hi, 'l-env', 300),
      text(P.x0, P.y0 - 10, label, { anchor: 'start', cls: 'k-name' }),
      [1560, 1580, 1600, 1620, 1640].map(n => text(P.X(n), P.y1 + 18, hz(n), { cls: 'k-tick' })));
    const px = Pin.w / (hi - lo), outPeak = 1602.583, outTop = eOut(outPeak);
    const before = (P, ring = true) => g({}, line(P.X(1600), P.y0 - 2, P.X(1600), P.y1 - 4, { cls: 'l-ref' }), ring ? circle(P.X(1600), P.Y(2), 5, { cls: 'l-m-hollow' }) : '');
    return [
      step(1, 'on one wheel the 1,800 Hz dot gains 4.5 degrees per sample on the 1,700 Hz dot and lines up with it at sample 1,600',
        wheelAt(w1, 90, 90, true, ['in, at sample 1,600:', 'the dots line up'])),
      step(2, 'the sum swells; the top of the swell is at sample 1,600',
        g({ anim: { k: 'in', d: 3.2 } }, row(Pin, sIn, eIn, 'l-ref', 'in: 1,700 Hz + 1,800 Hz'), before(Pin),
          text(Pin.X(1600) + 8, Pin.y0 + 2, 'swell top, 1,600', { anchor: 'start', cls: 'k-label' }))),
      step(3, 'after the notch the 1,800 Hz dot sits 11.6 degrees further back',
        g({ anim: { k: 'in', d: 4.4 } }, wheelAt(w2, 90 - p1, 90 - p2, false, ['out: the 1,800 Hz dot', 'sits 11.6° further back'], g1, g2, 5),
          arc(w2[0], w2[1], R * 0.4, 90 - p2, 90 - p1),
          text(w2[0] + R * 0.5 * cosd(72), w2[1] - R * 0.5 * sind(72), '11.6°', { anchor: 'end', cls: 'k-num-accent' }))),
      step(4, 'the swell top slides 2.58 samples late while the wiggles move only about half a sample',
        g({ anim: { k: 'in', d: 5.4 } }, row(Pout, sOut, eOut, 'k-line', 'out, after the notch'), before(Pout, false),
          text(Pout.x0, Pout.y1 + 36, ph1 ? 'wiggles move about 0.5 samples' : 'the wiggles inside move only about 0.5 samples', { anchor: 'start', cls: 'k-label' })),
        g({ anim: { k: 'in', d: 5.4 } }, g({ anim: { k: 'move', dx: -2.583 * px, d: 6, len: 2 } },
          line(Pout.X(outPeak), Pout.y0 - 2, Pout.X(outPeak), Pout.y1 - 4, { cls: 'l-total' }), mark('diamond', Pout.X(outPeak), Pout.Y(outTop), 'l-m-total', 5),
          text(Pout.X(outPeak) + 8, Pout.y0 + 2, ph1 ? '2.58 samples late' : 'swell top: 2.58 samples late', { anchor: 'start', cls: 'k-num-accent' })))),
      text(ph1 ? 20 : 230, L.H - 30, '11.6° ÷ 4.5° per sample = 2.58 samples', { anchor: 'start', cls: 'k-note' }),
      text(ph1 ? 20 : 230, L.H - 10, ph1 ? 'dashed: swell top before, 1,600' : 'dashed line: the swell top before the notch, at 1,600', { anchor: 'start', cls: 'k-tick' }),
      key(ph1 ? 20 : 30, ph1 ? 214 : 456, [[null, 'circle', 'l-m-hollow', '1,700 Hz'], [null, 'circle', 'l-m-ink', '1,800 Hz']], { dx: ph1 ? 110 : 96, cols: 2 }),
    ];
  };

  const groupDelay = L => {
    const ph1 = L.phone;
    const P = ph1 ? plot({ x: 46, y: 40, w: 280, h: 280, xs: [1000, 1900], ys: [0, 70] }) : plot({ x: 70, y: 40, w: 600, h: 280, xs: [1000, 1900], ys: [0, 70] });
    const lineThrough = (f0, p0, s, a, b, cls, o) => fn(P, f => p0 + s * (turnHz(f) - turnHz(f0)), a, b, cls, 2, o);
    const sec = (a, b) => { const s = (ph(b) - ph(a)) / (turnHz(b) - turnHz(a)); return lineThrough(a, ph(a), s, Math.max(1000, a - 140), Math.min(1900, b + 120), 'l-soft'); };
    const t1750 = gdN(1750);
    return [
      axes(P, { xTicks: [[1000, '1,000'], [1300, '1,300'], [1600, '1,600'], [1900, '1,900 Hz']], yTicks: [[0, '0°'], [20, '20°'], [40, '40°'], [60, '60°']], yTitle: 'phase through the notch', zero: false }),
      step(1, 'the notch phase curve from 1,000 to 1,900 Hz', fn(P, ph, 1000, 1900, 'l-ink', 300)),
      step(2, 'a straight line through the points at 1,700 and 1,800 Hz: 11.6 degrees over 4.5 degrees is 2.58 samples',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 1, len: 1 } }, sec(1700, 1800)),
        g({ anim: { k: 'in', d: 1 } },
          mark('circle', P.X(1700), P.Y(ph(1700)), 'l-m-hollow'), mark('circle', P.X(1800), P.Y(ph(1800)), 'l-m-hollow'),
          masked(P.X(ph1 ? 1680 : 1690), P.Y(ph1 ? 44 : 38), '11.6° ÷ 4.5° = 2.58 samples', { anchor: 'end', cls: 'k-label' }))),
      step(3, 'the two tones slide together and the line tilts',
        [[1720, 1780], [1735, 1765], [1745, 1755]].map(([a, b], i) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 2 + i * 0.7, len: 0.8 } }, sec(a, b)))),
      step(4, 'it settles onto the curve at 1,750 Hz: steepness 2.56 samples, the group delay',
        g({ anim: { k: 'in', d: 4.2 } }, lineThrough(1750, ph(1750), t1750, 1590, 1900, 'l-total'), mark('diamond', P.X(1750), P.Y(ph(1750)), 'l-m-total'),
          masked(P.X(ph1 ? 1890 : 1640), P.Y(ph1 ? 12 : 16), ph1 ? '2.56 samples at 1,750' : '2.56 samples at 1,750 Hz', { anchor: ph1 ? 'end' : 'start', cls: 'k-num-accent' }))),
      step(5, 'near 1,000 Hz the line through 1,000 and 1,100 Hz is almost flat: 1.5 over 4.5 is 0.34 samples',
        g({ anim: { k: 'in', d: 5.2 } }, lineThrough(1000, ph(1000), (ph(1100) - ph(1000)) / 4.5, 1000, 1140, 'l-thin'),
          mark('square', P.X(1000), P.Y(ph(1000)), 'l-m-ink', 3.5), mark('square', P.X(1100), P.Y(ph(1100)), 'l-m-ink', 3.5),
          masked(P.X(1015), P.Y(3), '1.53° ÷ 4.5° = 0.34 samples', { anchor: 'start', cls: 'k-label' }))),
      text(ph1 ? 20 : P.X(1030), ph1 ? L.H - 46 : P.Y(62), 'steeper phase: later burst', { anchor: 'start', cls: 'k-note' }),
      text(ph1 ? 20 : P.X(1030), ph1 ? L.H - 26 : P.Y(62) + 22, ph1 ? '4.5°: the extra turn per sample' : '4.5°: how much more a tone 100 Hz higher turns per sample', { anchor: 'start', cls: 'k-tick' }),
      ph1 ? text(20, L.H - 10, 'of a tone 100 Hz higher', { anchor: 'start', cls: 'k-tick' }) : '',
    ];
  };

  const symmetry = L => {
    const ph1 = L.phone;
    const P = ph1 ? plot({ x: 30, y: 80, w: 300, h: 110, xs: [-0.6, 2.6], ys: [0, 0.65] }) : plot({ x: 30, y: 80, w: 300, h: 150, xs: [-0.6, 2.6], ys: [0, 0.65] });
    const cx = ph1 ? 180 : 540, cy = ph1 ? 400 : 175, R = ph1 ? 88 : 100;
    const at = a => [cx + R * cosd(a), cy - R * sind(a)];
    const top = P.y0 - 22;
    const pairArrow = (from, to) => { const x = P.X(to) + (from < to ? -6 : 6); return k.arrow(L.slug, [[P.X(from), P.Y(0.5) - 24], [P.X(from), top], [x, top], [x, P.Y(0) - 26]]); };
    const [mx, my] = at(90), [fx, fy] = at(135), [ox, oy] = at(45);
    const two = (x, y, a, b, anchor) => g({}, text(x, y, a, { anchor, cls: 'k-label' }), text(x, y + 16, b, { anchor, cls: 'k-tick' }));
    return [
      text(P.x0, P.y0 - 60, 'coefficients 1/2, 0, 1/2', { anchor: 'start', cls: 'k-name' }),
      line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
      stems(P, [[0, 0.5], [1, 0], [2, 0.5]], { labels: v => (v ? '1/2' : '0') }),
      pairArrow(0, 1), pairArrow(2, 1),
      text(P.X(1), top - 14, 'partners, paired around the middle', { cls: 'k-tick' }),
      [[0, 'input[n]'], [1, 'input[n − 1]'], [2, 'input[n − 2]']].map(([n, s]) => text(P.X(n), P.y1 + 20, s, { cls: 'k-tick' })),
      text(P.X(1), P.y1 + 38, 'the middle', { cls: 'k-label' }),
      line(cx - R - 12, cy, cx + R + 12, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      line(cx, cy, fx, fy, { cls: 'l-soft' }), line(cx, cy, ox, oy, { cls: 'l-soft' }),
      circle(fx, fy, 5, { cls: 'l-m-hollow' }), circle(ox, oy, 5, { cls: 'l-m-hollow' }), circle(mx, my, 6, { cls: 'l-m-ink' }),
      k.vectors(L.slug, [cx, cy], [[R * 0.5 * cosd(135), R * 0.5 * sind(135)], [R * 0.5 * cosd(45), R * 0.5 * sind(45)]], { cls: 'l-half' }),
      k.arrow(L.slug, [[cx, cy], [cx, cy - 0.707 * R + 6]], { tone: 'accent', cls: 'l-sum' }),
      two(fx - 10, fy - 10, 'input[n]', '45° ahead', 'end'),
      two(ox + 10, oy - 10, 'input[n − 2]', '45° behind', 'start'),
      text(mx, my - 14, 'the middle dot', { cls: 'k-label' }),
      text(cx, cy + R + 24, 'halves added tip to tail: 0.71,', { cls: 'k-num-accent' }),
      text(cx, cy + R + 42, 'pointing at the middle dot (1,000 Hz)', { cls: 'k-tick' }),
      text(ph1 ? 180 : 360, L.H - 12, ph1 ? 'pairs balance on the middle sample' : 'pairs balance on the middle sample: one sample late for every tone', { cls: 'k-note' }),
    ];
  };

  const apGeom = (cx, cy, R) => {
    const pole = [cx + 0.65 * R * cosd(54), cy - 0.65 * R * sind(54)], zero = [cx + R / 0.65 * cosd(54), cy - R / 0.65 * sind(54)];
    const mpole = [pole[0], 2 * cy - pole[1]], mzero = [zero[0], 2 * cy - zero[1]];
    const tone = a => [cx + R * cosd(a), cy - R * sind(a)];
    return { pole, zero, mpole, mzero, tone };
  };

  const allPass = L => {
    const ph1 = L.phone;
    const cx = ph1 ? 150 : 180, cy = ph1 ? 210 : 222, R = ph1 ? 92 : 120;
    const G = apGeom(cx, cy, R);
    const pos = [[45, '1,000 Hz'], [90, '2,000 Hz'], [135, '3,000 Hz']];
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) / R;
    const T2 = G.tone(90);
    const tx = ph1 ? 24 : 400, ty = ph1 ? 420 : 110;
    const halo = ([x, y]) => circle(x, y, 8, { cls: 'l-halo' });
    return [
      step(4, 'two triangles with the same shape: center, pole, tone and center, tone, zero; sides 0.65 to 1 and 1 to 1.54',
        g({ anim: { k: 'in', d: 4 } },
          path(`M${cx} ${cy}L${r2(G.pole[0])} ${r2(G.pole[1])}L${r2(T2[0])} ${r2(T2[1])}Z`, { cls: 'l-tri1' }),
          path(`M${cx} ${cy}L${r2(T2[0])} ${r2(T2[1])}L${r2(G.zero[0])} ${r2(G.zero[1])}Z`, { cls: 'l-tri2' }),
          text(tx, ty + 112, 'at 2,000 Hz, two triangles of one shape:', { anchor: 'start', cls: 'k-label' }),
          text(tx, ty + 132, ph1 ? 'filled: center, pole, tone, 0.65 : 1' : 'filled: center, pole, tone; sides 0.65 : 1', { anchor: 'start', cls: 'k-label' }),
          text(tx, ty + 152, ph1 ? 'outlined: center, tone, zero, 1 : 1.54' : 'outlined: center, tone, zero; sides 1 : 1.54', { anchor: 'start', cls: 'k-label' }))),
      line(cx - R - 14, cy, cx + R + 70, cy, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      line(cx, cy, G.zero[0], G.zero[1], { cls: 'l-soft' }), line(cx, cy, G.mzero[0], G.mzero[1], { cls: 'l-soft' }),
      pos.map(([a, name], i) => {
        const T = G.tone(a), dz = dist(T, G.zero), dp = dist(T, G.pole);
        return step(i + 1, `at ${name}: the distance to the zero is ${fmt(dz)}, to the pole ${fmt(dp)}, ratio 1.54`,
          g({ anim: { k: 'in', d: i * 1.3, len: 0.8 } },
            line(G.zero[0], G.zero[1], T[0], T[1], { cls: 'l-zero' }), line(G.pole[0], G.pole[1], T[0], T[1], { cls: 'l-pole' }),
            circle(T[0], T[1], 5.5, { cls: 'l-m-total' }),
            text(T[0] + (a > 100 ? -10 : a > 60 ? -8 : 14), T[1] + (a > 60 ? -12 : 6), name, { anchor: a > 60 ? 'end' : 'start', cls: 'k-tick' }),
            text(tx, ty + 30 + i * 24, `${name}`, { anchor: 'start', cls: 'k-num' }),
            text(tx + (ph1 ? 90 : 100), ty + 30 + i * 24, `${fmt(dz)} ÷ ${fmt(dp)} = 1.54`, { anchor: 'start', cls: 'k-num-accent' })));
      }),
      [G.pole, G.mpole].map(halo), xmark(...G.pole), omark(...G.zero), xmark(...G.mpole), omark(...G.mzero),
      masked(G.pole[0] + 12, G.pole[1] + 18, 'pole 0.65', { anchor: 'start', cls: 'k-label', size: 11 }),
      text(G.mpole[0] + 12, G.mpole[1] + 4, 'pole', { anchor: 'start', cls: 'k-tick' }),
      text(G.zero[0] + 12, G.zero[1] + 4, ph1 ? 'zero 1.54' : 'zero 1.54, at 54°', { anchor: 'start', cls: 'k-label' }),
      text(G.mzero[0] + 12, G.mzero[1] + 4, ph1 ? 'mirror pair' : 'mirror pair, −54°', { anchor: 'start', cls: 'k-label' }),
      text(tx, ty, 'zero distance ÷ pole distance', { anchor: 'start', cls: 'k-name' }),
      key(tx, ty + (ph1 ? 186 : 196), [['l-pole', null, null, 'line from the pole'], ['l-zero', null, null, 'line from the zero']], { cols: 1 }),
    ];
  };

  const swing = L => {
    const ph1 = L.phone;
    const scale = ph1 ? 250 : 262;
    const panel = (x0, y0, a, b, title, sp, sz, i) => {
      const X = u => x0 + (u + 0.12) * scale, Y = v => y0 + (1.32 - v) * scale;
      const p = [0.65 * cosd(54), 0.65 * sind(54)], z = [cosd(54) / 0.65, sind(54) / 0.65];
      const P = [X(p[0]), Y(p[1])], Z = [X(z[0]), Y(z[1])];
      const T = d => [X(cosd(d)), Y(sind(d))];
      const ang = (o, t) => Math.atan2(-(t[1] - o[1]), t[0] - o[0]) * 180 / Math.PI;
      const ta = T(a), tb = T(b);
      const rimPts = range(30, 100, 1).map(d => T(d)).filter(([x, y]) => x >= x0 - 2 && y >= y0 - 2);
      const flashes = range(1, 4).map(j => { const d = a + (b - a) * j / 5, t = T(d); return g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.8 + i * 3 + j * 0.35, len: 0.5 } }, line(P[0], P[1], t[0], t[1], { cls: 'l-pole' }), line(Z[0], Z[1], t[0], t[1], { cls: 'l-zero' })); });
      const apA = ang(P, ta), apB = ang(P, tb), azA = ang(Z, ta), azB = ang(Z, tb);
      return {
        base: g({}, text(x0, y0 - 14, title, { anchor: 'start', cls: 'k-name' }), poly(rimPts, 'k-wheel'), xmark(...P), omark(...Z),
          text(P[0] + 12, P[1] + 4, 'pole', { anchor: 'start', cls: 'k-tick' }), text(Z[0] + 12, Z[1] + 4, 'zero', { anchor: 'start', cls: 'k-tick' }),
          (() => { const d = i ? 50 : 40, rx = X(1.06 * cosd(d)), ry = Y(1.06 * sind(d)); return text(rx + 4, ry + 4, 'unit circle', { anchor: 'start', cls: 'k-tick' }); })()),
        moving: g({}, path(`M${r2(P[0])} ${r2(P[1])}L${r2(ta[0])} ${r2(ta[1])}L${r2(tb[0])} ${r2(tb[1])}Z`, { cls: 'l-wedge' }),
          path(`M${r2(Z[0])} ${r2(Z[1])}L${r2(ta[0])} ${r2(ta[1])}L${r2(tb[0])} ${r2(tb[1])}Z`, { cls: 'l-wedge' }), flashes,
          line(P[0], P[1], ta[0], ta[1], { cls: 'l-pole' }), line(P[0], P[1], tb[0], tb[1], { cls: 'l-pole' }),
          line(Z[0], Z[1], ta[0], ta[1], { cls: 'l-zero' }), line(Z[0], Z[1], tb[0], tb[1], { cls: 'l-zero' }),
          circle(ta[0], ta[1], 4.5, { cls: 'l-m-hollow' }), circle(tb[0], tb[1], 4.5, { cls: 'l-m-total' }),
          arc(P[0], P[1], 70, Math.min(apA, apB), Math.max(apA, apB)), arc(Z[0], Z[1], 90, Math.min(azA, azB), Math.max(azA, azB)),
          text(P[0] - 8, P[1] + 24, `the pole’s line swings ${sp}`, { anchor: 'start', cls: 'k-num-accent' }),
          (() => { const mx = (Z[0] + (ta[0] + tb[0]) / 2) / 2, my = (Z[1] + (ta[1] + tb[1]) / 2) / 2; return i ? text(x0, y0 + 8, `zero line: ${sz}, the other way`, { anchor: 'start', cls: 'k-num-accent' }) : text(mx + 14, my, `zero line: ${sz},`, { anchor: 'start', cls: 'k-num-accent' }); })(),
          i ? '' : text((Z[0] + (ta[0] + tb[0]) / 2) / 2 + 14, (Z[1] + (ta[1] + tb[1]) / 2) / 2 + 16, 'the other way', { anchor: 'start', cls: 'k-num-accent' })),
      };
    };
    const A = panel(ph1 ? 14 : 20, 50, 51.75, 56.25, 'near the pole: 1,150 to 1,250 Hz', '12.8°', '8.3°', 0);
    const B = panel(ph1 ? 14 : 380, ph1 ? 380 : 50, 78.75, 83.25, 'far: 1,750 to 1,850 Hz', '7.2°', '2.7°', 1);
    return [
      A.base, B.base,
      step(1, 'near 1,200 Hz, as the tone moves 100 Hz, the pole line swings 12.8 degrees and the zero line 8.3 degrees the other way', A.moving),
      step(2, 'near 1,800 Hz the same 100 Hz swings the pole line only 7.2 degrees and the zero line 2.7 degrees', B.moving),
      text(ph1 ? 14 : 20, L.H - 12, ph1 ? 'close to the pole, the lines whip round' : 'per 100 Hz of tone: close to the pole the lines whip round; far away they barely turn', { anchor: 'start', cls: 'k-note' }),
      key(ph1 ? 14 : 20, L.H - 40, [[null, 'circle', 'l-m-hollow', 'the tone'], [null, 'circle', 'l-m-total', '100 Hz higher']], { dx: 150 }),
    ];
  };

  const delayFix = L => {
    const ph1 = L.phone;
    const P = ph1 ? plot({ x: 46, y: 40, w: 280, h: 300, xs: [1000, 1800], ys: [0, 6.6] }) : plot({ x: 60, y: 40, w: 430, h: 280, xs: [1000, 1800], ys: [0, 6.6] });
    const tot = f => gdN(f) + gdA(f), pts = [1000, 1200, 1500, 1600, 1650, 1800];
    const lo = 4.72;
    return [
      rect(P.x0, P.Y(lo + 1.5), P.w, P.Y(lo - 0.04) - P.Y(lo + 1.5), { cls: 'l-win' }),
      line(P.x0, P.Y(lo + 1.5), P.x1, P.Y(lo + 1.5), { cls: 'l-win-edge' }), line(P.x0, P.Y(lo - 0.04), P.x1, P.Y(lo - 0.04), { cls: 'l-win-edge' }),
      axes(P, { xTicks: [[1000, '1,000'], [1200, '1,200'], [1400, '1,400'], [1600, '1,600'], [1800, '1,800 Hz']], yTicks: [[0, '0'], [2, '2'], [4, '4'], [6, '6']], yTitle: 'group delay, samples', zero: false }),
      fn(P, gdN, 1000, 1800, 'l-ref'), marks(P, gdN, pts, 'circle', 'l-m-soft'),
      fn(P, gdA, 1000, 1800, 'l-ap'), marks(P, gdA, pts, 'square', 'l-m-ap'),
      fn(P, tot, 1000, 1800, 'l-total'), marks(P, tot, pts, 'diamond', 'l-m-total'),
      masked(P.X(1300), P.Y(6.22) - 6, ph1 ? 'shaded: window, 1.5 samples' : 'shaded: the fax’s window, 1.5 samples (4.72 to 6.22)', { anchor: 'middle', cls: 'k-label', size: 11 }),
      ph1 ? '' : text(P.x1 + 12, P.Y(5.67) + 4, 'both: 4.72 to 5.67 samples', { anchor: 'start', cls: 'k-num-accent' }),
      ph1 ? '' : text(P.x1 + 12, P.Y(3.24) + 4, 'notch: 0.31 to 3.24 samples', { anchor: 'start', cls: 'k-label' }),
      ph1 ? '' : text(P.x1 + 12, P.Y(2.43) + 4, 'all-pass: 2.43 samples', { anchor: 'start', cls: 'k-label' }),
      masked(P.X(1200), P.Y(5.03) + (ph1 ? 90 : 48), 'all-pass peak: 5.03 samples', { cls: 'k-label', size: 11 }),
      key(ph1 ? 20 : 60, L.H - (ph1 ? 40 : 14), [['l-ref', 'circle', 'l-m-soft', 'the notch alone'], ['l-ap', 'square', 'l-m-ap', 'the all-pass'], ['l-total', 'diamond', 'l-m-total', 'both together']], ph1 ? { cols: 2, dx: 160 } : { dx: 170 }),
    ];
  };

  const minPhase = L => {
    const ph1 = L.phone;
    const A = ph1 ? plot({ x: 40, y: 70, w: 130, h: 110, xs: [-0.6, 1.6], ys: [-0.8, 1.4] }) : plot({ x: 60, y: 76, w: 180, h: 110, xs: [-0.6, 1.6], ys: [-0.8, 1.4] });
    const B = ph1 ? plot({ x: 210, y: 70, w: 130, h: 110, xs: [-0.6, 1.6], ys: [-0.8, 1.4] }) : plot({ x: 60, y: 286, w: 180, h: 110, xs: [-0.6, 1.6], ys: [-0.8, 1.4] });
    const Gp = ph1 ? plot({ x: 50, y: 290, w: 270, h: 160, xs: [0, 4000], ys: [0, 1.7] }) : plot({ x: 360, y: 76, w: 310, h: 220, xs: [0, 4000], ys: [0, 1.7] });
    const gain = f => Math.sqrt(1.25 - Math.cos(D.W(f)));
    const pair = (P, vals, title, sub) => g({}, text(P.x0 - 20, P.y0 - 38, title, { anchor: 'start', cls: 'k-name' }), text(P.x0 - 20, P.y0 - 22, sub, { anchor: 'start', cls: 'k-tick' }),
      line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
      vals.map((v, n) => stems(P, [[n, v]], { cls: v === 1 ? 'k-stem-accent' : 'k-stem', labels: x => fmt(x, 1) })),
      [0, 1].map(n => text(P.X(n), P.y1 + 30, `n = ${n}`, { cls: 'k-tick' })));
    return [
      pair(A, [1, -0.5], 'A: big part first', 'zero at 0.5, inside'),
      pair(B, [-0.5, 1], 'B: big part late', 'zero at 2, outside'),
      axes(Gp, { xTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']], yTicks: [[0, '0'], [0.5, '0.5'], [1, '1'], [1.5, '1.5']], yTitle: 'gain', zero: false }),
      fn(Gp, gain, 0, 4000, 'l-ink'), marks(Gp, gain, range(0, 4000, 500), 'circle', 'l-m-hollow'),
      [[0, '0.5'], [2000, '1.12'], [4000, '1.5']].map(([f, s]) => text(Gp.X(f) + (f === 4000 ? -8 : 8), Gp.Y(gain(f)) + (f === 2000 ? 20 : -10), s, { anchor: f === 4000 ? 'end' : 'start', cls: 'k-num' })),
      key(Gp.x0, Gp.y1 + 44, [['l-ink', null, null, 'A'], [null, 'circle', 'l-m-hollow', 'B, on the same curve']], { dx: 80 }),
      text(ph1 ? 180 : 150, L.H - 12, 'same gains; A’s sound comes first', { cls: 'k-note' }),
    ];
  };

  const inverse = L => {
    const ph1 = L.phone;
    const cx = ph1 ? 120 : 130, cy = ph1 ? 150 : 150, R = 70;
    const p = [cx + 1.54 * R * cosd(54), cy - 1.54 * R * sind(54)], z = [cx + 0.65 * R * cosd(54), cy - 0.65 * R * sind(54)];
    const P = ph1 ? plot({ x: 40, y: 300, w: 290, h: 150, xs: [-0.5, 9.5], ys: [-55, 55] }) : plot({ x: 330, y: 50, w: 360, h: 190, xs: [-0.5, 9.5], ys: [-55, 55] });
    const h = n => 1.54 ** n * cosd(54 * n);
    return [
      line(cx - R - 12, cy, cx + R + 60, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      line(cx, cy, p[0], p[1], { cls: 'l-soft' }),
      xmark(...p, 'l-x-accent', 7), omark(...z),
      text(p[0] + 12, p[1] + 4, 'pole at 1.54, outside', { anchor: 'start', cls: 'k-num-accent' }),
      text(z[0] - 10, z[1] + 4, 'zero 0.65', { anchor: 'end', cls: 'k-tick' }),
      text(cx, cy + R + 28, 'the all-pass run backwards', { cls: 'k-tick' }),
      line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }),
      fn(P, n => 1.54 ** n, 0, 9.3, 'l-soft', 100), fn(P, n => -(1.54 ** n), 0, 9.3, 'l-soft', 100),
      stems(P, range(0, 9).map(n => [n, h(n)]), { cls: 'k-stem-accent', dot: 3.5 }),
      text(P.x0, P.y1 + 36, 'thin curves: 1.54 times bigger each sample', { anchor: 'start', cls: 'k-tick' }),
      [0, 4, 8].map(n => text(P.X(n), P.y1 + 18, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
      text(P.x0, P.y0 - 12, 'its echo grows: unstable', { anchor: 'start', cls: 'k-name' }),
    ];
  };

  const fig = (name, h, ph, title, desc, caption, body, steps = 0) => ({ name, w: 720, h, phone: { w: 360, h: ph }, title, desc, caption, steps, css: CSS, eyebrow: 'Lesson 8 · phase and delay', body: (kk, L) => body(L) });

  return [
    fig('smear', 410, 470, 'The bursts arrive shuffled in time',
      'Fax bursts alternating 1,000 Hz and 1,800 Hz, as sent and as received. The 1,000 Hz bursts arrive 0.31 samples late; the 1,800 Hz bursts 3.24 samples late, past the fax window of 1.5 samples, and run into the next burst. Gains 98.7% and 70.1%.',
      'Every burst is loud enough. The 1,800 Hz bursts arrive 3.24 samples late, more than twice the fax’s 1.5-sample window, and slide into the next burst.', smear, 4),
    fig('wheel-phase', 370, 610, 'Phase: the output’s dot trails the input’s',
      'A 1,800 Hz tone on the wheel, turning 81 degrees per sample. The output dot, on a wheel shrunk to 70.1%, sits 45.5 degrees clockwise behind the input dot. Below, the output wave crests 0.56 samples after the input wave.',
      'At 1,800 Hz the notch shrinks the wheel to 70.1% (the gain) and sets the dot back 45.5° (the phase): 45.5° ÷ 81° = 0.56 samples late.', wheelPhase, 2),
    fig('phase-lines', 410, 680, 'Phase from the lines',
      'The unit circle with the notch poles at 0.85 straight up and down and zeros at the top and bottom of the circle. Lines run from each to the 1,000 Hz point at 45 degrees. Pole lines point at minus 11.4 and plus 65.6 degrees and count plus; zero lines at minus 22.5 and plus 67.5 and count minus. The phase is 9.2 degrees.',
      'Phase = the pole lines’ directions added up, minus the zero lines’ directions added up: 54.2° − 45.0° = 9.2° at 1,000 Hz.', phaseLines),
    fig('linear-phase', 400, 500, 'Straight phase lines mean equal delay',
      'Phase against tone from 0 to 2,000 Hz. The 3-sample delay is a steep straight line reaching 270 degrees, the two-point average a shallow straight line reaching 45 degrees, and the notch creeps along and bends sharply up near 2,000 Hz.',
      'A straight phase line through zero is linear phase: every tone delayed the same. The notch is not straight.', linearPhase),
    fig('burst-tones', 450, 720, 'A burst is many neighboring tones',
      'Left: a fax burst at 1,800 Hz, 60 samples long and then 30 samples long, rising and dying away. Right: the tones each is made of, as bars tallest at 1,800 Hz; the 60-sample burst is 270 Hz wide at half height, the 30-sample burst 530 Hz.',
      'Switching a tone on and off adds its neighbors. The shorter the burst, the wider its cluster of tones.', burstTones, 2),
    fig('catch-up', 530, 760, 'Two tones, one swell, and the notch',
      'Two dots on one wheel, 1,700 and 1,800 Hz, line up at sample 1,600, where their sum swells to its top. After the notch the 1,800 Hz dot sits 11.6 degrees further back; it gains 4.5 degrees per sample, so the swell top arrives 2.58 samples late while the wiggles inside move only about half a sample.',
      'Before and after the notch: the wiggles move about half a sample, but the swell moves 11.6° ÷ 4.5° = 2.58 samples.', catchUp, 4),
    fig('group-delay', 360, 450, 'Group delay is the steepness of the phase',
      'The notch phase from 1,000 to 1,900 Hz. A straight line through 1,700 and 1,800 Hz has steepness 11.6 over 4.5, 2.58 samples. As the tones close in it settles onto the curve at 1,750 Hz, 2.56 samples. A line through 1,000 and 1,100 Hz is nearly flat, 0.34 samples.',
      'The steeper the phase climbs, the later a burst arrives there. That steepness is the group delay.', groupDelay, 5),
    fig('symmetry', 360, 590, 'Symmetric coefficients balance on the middle',
      'The coefficients 1/2, 0, 1/2 as three stems with arrows pairing each outside one with the middle. On a 1,000 Hz wheel, the newest sample sits 45 degrees ahead of the middle dot and the oldest 45 degrees behind; their halves added tip to tail point exactly at the middle dot, size 0.71.',
      'Pairs balance on the middle sample: one sample late for every tone.', symmetry),
    fig('all-pass', 440, 640, 'An all-pass keeps one ratio everywhere',
      'Unit circle with a pole at radius 0.65 and a zero at 1.54 on the 54 degree line, and the mirror pair at minus 54 degrees. At 1,000, 2,000 and 3,000 Hz, the distance to the zero divided by the distance to the pole is 1.54. Two shaded triangles, center pole tone and center tone zero, have the same shape.',
      'Wherever the tone sits, its zero distance is 1.54 times its pole distance, so the all-pass passes every tone at 100%.', allPass, 4),
    fig('swing', 420, 760, 'Lines swing fastest near the pole',
      'Two close-ups of the upper all-pass pole and zero. As the tone moves 100 Hz near 1,200 Hz, the pole line swings 12.8 degrees and the zero line 8.3 degrees the other way. Near 1,800 Hz the same move swings them 7.2 and 2.7 degrees.',
      'Like your head as a car drives past: the lines whip round when the tone passes near the pole, and barely turn when it is far away.', swing, 2),
    fig('delay-fix', 400, 500, 'The all-pass fills in where the notch is early',
      'Group delay from 1,000 to 1,800 Hz. The notch rises from 0.31 to 3.24 samples. The all-pass is a bump peaking at 5.03 near 1,200 Hz and falling to 2.43. Together they run from 4.72 to 5.67 samples, inside a 1.5-sample window.',
      'The all-pass holds back the bottom of the band, so the whole line fits the fax’s 1.5-sample window: 4.72 to 5.67 samples.', delayFix),
    fig('minimum-phase', 470, 580, 'Same gains, different timing',
      'Filter A answers a click with 1 then minus 0.5; filter B with minus 0.5 then 1. Their gain curves are identical: 0.5 at 0 Hz, 1.12 at 2,000 Hz, 1.5 at 4,000 Hz.',
      'Same gains; A’s sound comes first. A, with its zero inside, is minimum phase.', minPhase),
    fig('inverse', 290, 510, 'Running the all-pass backwards is unstable',
      'The flipped all-pass has a pole at 1.54, outside the unit circle. Its echo grows with every sample.',
      'Swap the all-pass’s poles and zeros and the zero at 1.54 becomes a pole outside the circle: every echo grows.', inverse),
  ];
};
