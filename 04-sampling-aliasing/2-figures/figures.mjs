export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, curve, stems, arrow, check, cross, box, step, legend, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const r2 = v => Math.round(v * 100) / 100;
  const num = v => (Math.abs(v - Math.round(v)) < 1e-9 ? fmt(Math.round(v), 0) : Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? fmt(v, 1) : fmt(v, 2));
  const tone = (f, phi = 0) => t => cosd(360 * f * t / 8000 + phi);
  const pm = [[1, '1'], [-1, `${M}1`]];
  const at = (cx, cy, r, a) => [cx + r * cosd(a), cy - r * sind(a)];

  function arcD(cx, cy, r, a0, a1) {
    const dir = a1 >= a0 ? 1 : -1, sweep = dir > 0 ? 0 : 1;
    let a = a0, d = `M${at(cx, cy, r, a0).map(r2).join(' ')}`;
    while (Math.abs(a1 - a) > 1e-9) {
      const b = dir > 0 ? Math.min(a + 170, a1) : Math.max(a - 170, a1);
      d += `A${r} ${r} 0 0 ${sweep} ${at(cx, cy, r, b).map(r2).join(' ')}`;
      a = b;
    }
    return d;
  }
  function head(cx, cy, r, a, dir, cls = 'k-head', s = 5) {
    const [x, y] = at(cx, cy, r, a);
    const tx = -sind(a) * dir, ty = -cosd(a) * dir, nx = -ty, ny = tx;
    const p = [[x + tx * s, y + ty * s], [x - tx * s + nx * s * 0.75, y - ty * s + ny * s * 0.75], [x - tx * s - nx * s * 0.75, y - ty * s - ny * s * 0.75]];
    return path(`M${p.map(q => q.map(r2).join(' ')).join('L')}Z`, { cls, style: 'stroke:none' });
  }
  const arc = (cx, cy, r, a0, a1, o = {}) => {
    const { cls = 'k-line', headCls = 'k-head', draw, style } = o;
    return g({}, path(arcD(cx, cy, r, a0, a1), { cls, style, pathLength: draw ? 1 : undefined, anim: draw }), headCls ? g({ anim: draw ? { k: 'in', d: draw.d + draw.len, len: 0.3 } : undefined }, head(cx, cy, r, a1, a1 >= a0 ? 1 : -1, headCls)) : '');
  };

  const sampler = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 30 : 80, y: 64, w: ph ? 312 : 600, h: ph ? 140 : 150, xs: [-0.4, 8.4], ys: [-1.2, 1.2] });
    const v = tone(1000), ns = range(0, 8);
    const listY = P.y1 + (ph ? 62 : 46);
    return [
      text(L.W / 2, 24, ph ? 'a 1,000 Hz true tone; shaded: the phone looks away' : 'a 1,000 Hz true tone; shaded: between samples, the phone looks away', { cls: 'k-note', style: ph ? 'font-size:14px' : undefined }),
      step(2, 'a sample every 125 microseconds; in between, the phone looks away',
        g({ anim: { k: 'in', d: 2, len: 0.8 } },
          range(0, 7).map(n => rect(P.X(n) + 5, P.y0, P.X(n + 1) - P.X(n) - 10, P.h, { style: 'fill:var(--rule);opacity:0.5' })),
          line(P.X(0), P.y0 - 12, P.X(1), P.y0 - 12, { cls: 'k-axis' }), line(P.X(0), P.y0 - 17, P.X(0), P.y0 - 7, { cls: 'k-axis' }), line(P.X(1), P.y0 - 17, P.X(1), P.y0 - 7, { cls: 'k-axis' }),
          text(P.X(1) + 8, P.y0 - 8, '125 µs', { anchor: 'start', cls: 'k-tick' }))),
      axes(P, { yTicks: pm, xTicks: ns.map(n => [n, n ? String(n) : 'n = 0']) }),
      step(1, 'the true tone, a smooth 1,000 Hz wave', g({}, curve(P, v, { cls: 'k-curve-soft', n: 320, anim: { k: 'in', d: 0, len: 1.6 } }))),
      step(3, 'a playhead sweeps along and drops one dot per sample',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 3, len: 4.4 } },
          g({ anim: { k: 'move', dx: P.X(0) - P.X(8), d: 3, len: 4 }, style: 'animation-timing-function:linear' }, line(P.X(8), P.y0 - 4, P.X(8), P.y1 + 4, { cls: 'k-line', style: 'stroke-width:1' }))),
        ns.map(n => g({ anim: { k: 'in', d: 3 + n / 2, len: 0.4 } }, stems(P, [[n, v(n)]], { dot: 5 })))),
      step(4, `the list the phone stores: 1, 0.71, 0, ${M}0.71, ${M}1, ${M}0.71, 0, 0.71, 1`,
        ph ? text(P.x0, listY - 20, 'what the phone stores:', { anchor: 'start', cls: 'k-label' }) : text(P.x0 - 10, listY, 'stores', { anchor: 'end', cls: 'k-label' }),
        ns.map(n => g({ anim: { k: 'in', d: 3.2 + n / 2, len: 0.4 } }, text(P.X(n), listY, num(v(n)), { cls: ph ? 'k-tick' : 'k-num' })))),
    ];
  };

  const sameDots = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 34 : 70, y: 40, w: ph ? 312 : 610, h: ph ? 160 : 190, xs: [-0.3, 8.3], ys: [-1.25, 1.25] });
    const w3 = tone(3000), w5 = tone(5000), ns = range(0, 8);
    const listY = P.y1 + 44, ly = listY + 34;
    const key = (x, y, cls, style, label) => g({}, line(x, y - 1, x + 24, y - 1, { cls: `${cls} k-legend-line`, style }), text(x + 32, y + 3, label, { anchor: 'start', cls: 'k-label' }));
    return [
      axes(P, { yTicks: pm, xTicks: ns.map(n => [n, n || ph ? String(n) : 'n = 0']) }),
      step(1, 'the 3,000 Hz wave', g({ anim: { k: 'in', d: 0.5, len: 2 } }, curve(P, w3, { cls: 'k-curve-accent', n: 480, style: 'stroke-dasharray:none' }))),
      step(2, 'the 5,000 Hz wave', g({}, curve(P, w5, { cls: 'k-curve-soft', n: 640, anim: { k: 'in', d: 3.2, len: 2 } }))),
      step(3, 'both waves pass through the same nine samples',
        ns.map(n => circle(P.X(n), P.Y(w5(n)), 5.5, { cls: 'k-stem-dot' })),
        g({ 'aria-hidden': 'true' }, ns.map(n => g({ cls: 'k-ghost', anim: { k: 'flash', d: 3.2 + 3.2 * n / 8, len: 0.7 } }, circle(P.X(n), P.Y(w5(n)), 11, { cls: 'k-ring-missing' }))))),
      ph ? '' : text(P.x0 - 10, listY, 'both', { anchor: 'end', cls: 'k-label' }),
      ns.map(n => text(P.X(n), listY, num(w5(n)), { cls: ph ? 'k-tick' : 'k-num' })),
      key(ph ? 24 : 70, ly, 'k-curve-soft', undefined, 'dashed grey: the whistle, 5,000 Hz'),
      key(ph ? 24 : 360, ph ? ly + 22 : ly, 'k-curve-accent', 'stroke-dasharray:none', 'solid coral: 3,000 Hz, what patients heard'),
    ];
  };

  const wheelFig = L => {
    const ph = L.phone, R = ph ? 76 : 84;
    const spots = ph ? [[180, 140], [180, 494]] : [[190, 140], [530, 140]];
    const specs = [
      { name: 'the whistle, 5,000 Hz', sub: 'turns 225° counter-clockwise per sample', a: 225, label: '225°' },
      { name: '3,000 Hz', sub: 'turns 135° counter-clockwise per sample', a: 135, label: '135°' },
    ];
    const one = (i) => {
      const [cx, cy] = spots[i], s = specs[i], [dx, dy] = at(cx, cy, R, s.a), sy = cy + R + 30;
      const [lx, ly] = at(cx, cy, 44, s.a / 2);
      const [rx, ry] = at(cx, cy, R, 135);
      return {
        frame: g({},
          text(cx, cy - R - 34, s.name, { cls: 'k-name' }), text(cx, cy - R - 16, s.sub, { cls: 'k-tick' }),
          line(cx - R - 22, cy, cx + R + 22, cy, { cls: 'k-guide' }),
          circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
          circle(cx + R, cy, 3.5, { cls: 'k-stop' }), text(cx + R + 8, cy - 8, 'start', { anchor: 'start', cls: 'k-tick' }),
          line(cx - R, sy, cx + R, sy, { cls: 'k-axis' }),
          [[-1, `${M}1`], [0, '0'], [1, '+1']].map(([v, t]) => g({}, line(cx + v * R, sy - 4, cx + v * R, sy + 4, { cls: 'k-axis' }), text(cx + v * R, sy + 18, t, { cls: 'k-tick' })))),
        turn: g({},
          arc(cx, cy, 26, 0, s.a, { draw: { k: 'draw', d: 0.5, len: 2.5 } }),
          g({ anim: { k: 'in', d: 3, len: 0.4 } }, text(lx, ly + 4, s.label, { cls: 'k-num' })),
          g({ anim: { k: 'turn', r0: `${s.a}deg`, steps: 60, d: 0.5, len: 2.5 }, style: `transform-origin:${cx}px ${cy}px` },
            line(cx, cy, dx, dy, { cls: 'k-spoke-line spoke' }), circle(dx, dy, 6.5, { cls: i ? 'k-stem-dot k-hollow' : 'k-stem-dot' }))),
        read: g({ anim: { k: 'in', d: 3.2, len: 0.8 } },
          i ? '' : g({}, circle(rx, ry, 7, { cls: 'k-stem-dot k-hollow' }), line(dx, ry + 9, dx, dy - 9, { cls: 'k-guide' })),
          line(dx, dy + 8, dx, sy - 6, { cls: 'k-guide' }),
          circle(dx, sy, 5, { cls: 'k-stem-dot' }),
          text(dx, sy + 40, `reads ${M}0.71`, { cls: 'k-num' })),
        cx, cy, sy,
      };
    };
    const A = one(0), B = one(1);
    const back = g({ anim: { k: 'in', d: 4.2, len: 0.8 } },
      arc(A.cx, A.cy, 40, 0, -135, { cls: 'k-curve-accent', headCls: 'k-head-accent' }),
      (ph ? ['coral dotted arc: 135° clockwise,', `as 360° ${M} 225° = 135°`, 'hollow circle: where 3,000 Hz lands']
        : [`coral dotted arc: 135° clockwise, as 360° ${M} 225° = 135°`, 'hollow circle: where 3,000 Hz lands, straight above']).map((t, i) =>
        text(ph ? L.W / 2 : 20, A.sy + 62 + i * 18, t, { anchor: ph ? 'middle' : 'start', cls: 'k-label' })));
    return [
      step(1, 'two wheels, each dot starting at the right; the horizontal line through the centre is dashed', A.frame, B.frame),
      step(2, 'the whistle’s dot turns 225 degrees, past half a turn, to the lower left', A.turn),
      step(2, 'the 3,000 Hz dot turns 135 degrees to the upper left, the mirror spot', B.turn),
      step(3, `both drop to the same left-right reading, ${M}0.71`, A.read, B.read),
      step(4, 'the whistle’s spot is also 135 degrees clockwise from the start', back),
    ];
  };

  const cinema = L => {
    const ph = L.phone, count = ph ? 3 : 5;
    const fw = ph ? 100 : 116, fh = 124, r = ph ? 28 : 32;
    const pos = i => (ph ? [18 + i * 112, 70] : [40 + i * 132, 62]);
    const strip = ph ? [10, 56, 340, 152] : [20, 48, 680, 152];
    const angle = i => 90 - 15 * i;
    const holes = ([x, y, w, h]) => range(0, Math.floor((w - 12) / 22)).flatMap(j => [rect(x + 8 + j * 22, y + 4, 10, 7, { cls: 'k-bg', rx: 1.5 }), rect(x + 8 + j * 22, y + h - 11, 10, 7, { cls: 'k-bg', rx: 1.5 })]);
    const frame = i => {
      const [x, y] = pos(i), cx = x + fw / 2, cy = y + 54, [sx, sy] = at(cx, cy, r, angle(i));
      return { cx, cy, x, y, el: g({},
        rect(x, y, fw, fh, { cls: 'k-bg', rx: 3 }), rect(x, y, fw, fh, { cls: 'k-frame', fill: 'none', rx: 3 }),
        circle(cx, cy, r, { cls: 'k-wheel', fill: 'none' }),
        i ? line(cx, cy, ...at(cx, cy, r, angle(i - 1)), { cls: 'k-curve-faint' }) : '',
        i ? arc(cx, cy, r + 7, angle(i - 1), angle(i), { cls: 'k-arrow k-accent', headCls: 'k-head-accent' }) : arc(cx, cy, r + 7, 120, 200, { cls: 'k-arrow' }),
        line(cx, cy, sx, sy, { cls: 'k-line', style: 'stroke-width:2.5' }), circle(sx, sy, 4.5, { cls: 'k-stem-dot' }), circle(cx, cy, 3, { cls: 'k-stem-dot' }),
        text(cx, y + 14, `picture ${i + 1}`, { cls: 'k-tick' }),
        i ? text(cx, y + fh - 10, '15° clockwise', { cls: 'k-num-accent', style: 'font-size:10px' })
          : g({}, text(cx, y + fh - 22, 'true turn: 345°', { cls: 'k-tick', style: 'font-size:10px' }), text(cx, y + fh - 9, 'counter-clockwise', { cls: 'k-tick', style: 'font-size:10px' }))) };
    };
    const frames = range(0, count - 1).map(frame);
    const end = 2.6 + 1.3 * (count - 2) + 0.6;
    return [
      ph ? g({}, text(L.W / 2, 22, '23 turns a second, 24 pictures a second:', { cls: 'k-label' }), text(L.W / 2, 42, '345° counter-clockwise between pictures', { cls: 'k-label' }))
        : text(L.W / 2, 30, '23 turns a second, filmed 24 times a second: 345° counter-clockwise between pictures', { cls: 'k-label' }),
      step(1, 'a strip of film pictures of a one-spoke wheel', g({}, rect(...strip, { cls: 'k-fill', rx: 4 }), holes(strip))),
      step(2, 'between two pictures the wheel really turns 345 degrees counter-clockwise',
        g({ 'aria-hidden': 'true' }, frames.slice(1).map((f, j) => g({ cls: 'k-ghost', anim: { k: 'flash', d: 1.6 + 1.3 * j, len: 1.1 } },
          circle(f.cx, f.cy, r, { cls: 'k-wheel', fill: 'none', style: 'opacity:0.5' }),
          g({ anim: { k: 'turn', r0: '345deg', steps: 40, d: 1.6 + 1.3 * j, len: 1 }, style: `transform-origin:${f.cx}px ${f.cy}px` },
            line(f.cx, f.cy, ...at(f.cx, f.cy, r, angle(j + 1)), { cls: 'k-line', style: 'stroke-width:2.5;opacity:0.5' })))))),
      step(3, 'on screen, each picture shows the spoke 15 degrees further clockwise, backwards',
        frames.map((f, i) => g({ anim: { k: 'in', d: i ? 2.6 + 1.3 * (i - 1) : 1, len: 0.4 } }, f.el)),
        g({ anim: { k: 'in', d: end, len: 0.6 } }, text(L.W / 2, L.H - 14, ph ? 'on screen: 15° backwards per picture' : 'on screen: the spoke creeps 15° backwards, clockwise, per picture, one turn backwards a second', { cls: 'k-note-accent' }))),
    ];
  };

  const mirror = L => {
    const ph = L.phone, cx = ph ? 180 : 190, cy = ph ? 150 : 170, R = ph ? 96 : 110;
    const a3 = n => (135 * n) % 360, a5 = n => (225 * n) % 360, ns = range(0, 7);
    const tab = ph ? { n: 50, a: 160, b: 280, y: 400, dy: 28 } : { n: 420, a: 530, b: 650, y: 98, dy: 30 };
    const val = n => num(cosd(135 * n));
    const pair = n => {
      const [x, y3] = at(cx, cy, R, a3(n)), [, y5] = at(cx, cy, R, a5(n));
      return g({}, line(x, y3 + 9, x, y5 - 9, { cls: 'k-line', style: 'stroke-width:1.2' }),
        circle(x, y3, 7, { cls: 'k-stem-dot k-hollow' }), circle(x, y5, 6, { cls: 'k-stem-dot' }),
        text(x + (x < cx ? -14 : 14), y3 - 4, `n = ${n}`, { anchor: x < cx ? 'end' : 'start', cls: 'k-num' }),
        text(x + (x < cx ? -14 : 14), y5 + 12, `n = ${n}`, { anchor: x < cx ? 'end' : 'start', cls: 'k-num' }));
    };
    const ly = cy + R + 34;
    return [
      step(1, 'a wheel with its eight stops and the dashed horizontal line through the centre',
        line(cx - R, cy, cx + R, cy, { cls: 'k-guide' }),
        circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
        range(0, 7).map(j => circle(...at(cx, cy, R, j * 45), 3, { cls: 'k-stop' })),
        g({}, circle(ph ? 28 : cx - R, ly - 4, 7, { cls: 'k-stem-dot k-hollow' }), text((ph ? 28 : cx - R) + 14, ly, '3,000 Hz: n × 135° counter-clockwise', { anchor: 'start', cls: 'k-tick' }),
          circle(ph ? 28 : cx - R, ly + 16, 6, { cls: 'k-stem-dot' }), text((ph ? 28 : cx - R) + 14, ly + 20, '5,000 Hz: n × 135° clockwise', { anchor: 'start', cls: 'k-tick' }),
          line((ph ? 28 : cx - R) - 1, ly + 30, (ph ? 28 : cx - R) - 1, ly + 44, { cls: 'k-line', style: 'stroke-width:1.2' }), text((ph ? 28 : cx - R) + 14, ly + 40, 'tie: a mirror pair; two of the eight are drawn', { anchor: 'start', cls: 'k-tick' })),
        text(tab.n, tab.y - 38, 'n', { cls: 'k-name' }), text(tab.a, tab.y - 38, '3,000 Hz', { cls: 'k-name' }), text(tab.b, tab.y - 38, '5,000 Hz', { cls: 'k-name' }),
        text((tab.a + tab.b) / 2, tab.y - 18, 'the readings, all eight samples', { cls: 'k-tick' }),
        line(tab.n - 20, tab.y - 10, tab.b + 40, tab.y - 10, { cls: 'k-grid' })),
      step(2, 'both dots step together: 3,000 Hz 135 degrees counter-clockwise each sample, 5,000 Hz 225 degrees, which lands 135 degrees clockwise; two samples, n = 1 and n = 3, are tied as mirror pairs',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.6, len: 7 } },
          g({ anim: { k: 'turn', r0: `${135 * 7}deg`, steps: 8, d: 1, len: 6.4 }, style: `transform-origin:${cx}px ${cy}px` }, circle(...at(cx, cy, R, a3(7)), 7, { cls: 'k-stem-dot k-hollow' })),
          g({ anim: { k: 'turn', r0: `${225 * 7}deg`, steps: 8, d: 1, len: 6.4 }, style: `transform-origin:${cx}px ${cy}px` }, circle(...at(cx, cy, R, a5(7)), 6, { cls: 'k-stem-dot' })))),
      step(3, `the two readings match at every sample: 1, ${M}0.71, 0, 0.71, ${M}1, 0.71, 0, ${M}0.71`,
        g({ anim: { k: 'in', d: 7.6, len: 0.6 } }, pair(1), pair(3)),
        ns.map(n => g({ anim: { k: 'in', d: 1 + 0.8 * n, len: 0.3 } },
          text(tab.n, tab.y + 14 + n * tab.dy, String(n), { cls: 'k-tick' }),
          text(tab.a, tab.y + 14 + n * tab.dy, val(n), { cls: 'k-num' }),
          text(tab.b, tab.y + 14 + n * tab.dy, val(n), { cls: 'k-num' })))),
    ];
  };

  const tentPts = (f) => { const m = f % 8000; return m <= 4000 ? m : 8000 - m; };

  const turnRound = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 56 : 80, y: 44, w: ph ? 280 : 560, h: ph ? 190 : 220, xs: [0, 8000], ys: [0, 4400] });
    const marks = [[4600, 3400, 'k-stem-dot'], [5000, 3000, 'k-stem-accent-dot'], [7000, 1000, 'k-stem-dot'], [8000, 0, 'k-stem-dot']];
    const lbl = { 4600: [10, -8, 'start'], 5000: [12, -10, 'start'], 7000: [-14, 14, 'end'], 8000: [0, 36, 'end'] };
    const tc = f => (f === 5000 ? 'k-num-accent' : 'k-num');
    return [
      axes(P, { grid: true, yTicks: [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000']],
        xTicks: ph ? [[0, '0'], [4000, '4,000'], [8000, '8,000']] : [[0, '0'], [2000, '2,000'], [4000, '4,000'], [6000, '6,000'], [8000, '8,000']], yTitle: 'stored tone, Hz' }),
      text(P.x1, P.y1 + (ph ? 36 : 54), 'true tone, Hz', { anchor: 'end', cls: 'k-tick' }),
      line(P.X(4000), P.Y(4000) - 6, P.X(4000), P.Y(0), { cls: 'k-guide' }),
      text(P.X(4000) + (ph ? 8 : 0), P.Y(4000) - 12, ph ? 'turns at 4,000' : 'turns round at 4,000 Hz', { anchor: ph ? 'start' : 'middle', cls: 'k-label' }),
      path(`M${P.X(0)} ${P.Y(0)}L${P.X(4000)} ${P.Y(4000)}L${P.X(8000)} ${P.Y(0)}`, { cls: 'k-curve' }),
      marks.map(([f, s, cls]) => circle(P.X(f), P.Y(s), 5.5, { cls })),
      ph ? g({}, marks.map(([f, s, cls], i) => g({},
        text(P.X(f) + (f === 8000 ? 6 : 0), P.Y(s) - (f === 8000 ? 14 : 12), String(i + 1), { anchor: f === 8000 ? 'start' : 'middle', cls: tc(f) }),
        circle(30, 296 + i * 22, 5, { cls }), text(44, 300 + i * 22, `${i + 1}: ${hz(f)} Hz is stored as ${hz(s)} Hz`, { anchor: 'start', cls: tc(f) }))))
        : marks.map(([f, s]) => { const [dx, dy, anchor] = lbl[f]; return text(P.X(f) + dx, P.Y(s) + dy, `${hz(f)} → ${hz(s)}`, { anchor, cls: tc(f) }); }),
    ];
  };

  const fold = L => {
    const ph = L.phone;
    const X = f => (ph ? 30 : 40) + f / 8000 * (ph ? 300 : 640);
    const top = ph ? 96 : 84, low = top + 68, hgt = 30, piv = X(4000), len = piv - X(0);
    const lowX = f => X(8000 - f);
    const maps = [[5000, 3000, true], [4600, 3400], [7000, 1000], [8000, 0]];
    const upTicks = [0, 1000, 2000, 3000, 3400, 4000];
    const upLabel = f => !ph || f !== 2000;
    const lowTicks = [4600, 5000, 6000, 7000, 8000];
    const lowLabel = f => !ph || f !== 6000;
    const row2 = f => f === 3400 || (ph && f === 1000);
    const row2low = f => f === 4600 || (ph && f === 7000);
    return [
      ph ? g({}, text(L.W / 2, 22, 'top: true tones 0 to 4,000 Hz', { cls: 'k-label' }), text(L.W / 2, 40, 'folded under: 4,000 to 8,000 Hz', { cls: 'k-label' }))
        : text(L.W / 2, 28, 'top strip: true tones 0 to 4,000 Hz · folded under: 4,000 to 8,000 Hz', { cls: 'k-label' }),
      step(1, 'a strip of true tones, 0 to 4,000 Hz on top',
        rect(X(0), top, len, hgt, { cls: 'k-bg' }), rect(X(0), top, len, hgt, { cls: 'k-frame', fill: 'none', style: 'stroke:var(--ink);stroke-width:1.5' }),
        upTicks.map(f => g({}, line(X(f), top, X(f), top + 8, { cls: 'k-line', style: 'stroke-width:1' }),
          upLabel(f) ? text(X(f), top - (row2(f) ? 24 : 8), hz(f), { cls: f === 3000 ? 'k-num-accent' : 'k-tick' }) : ''))),
      step(2, 'the part above 4,000 Hz folds back under, so each tone lands under another',
        g({ anim: { k: 'move', dy: top - low, d: 0.8, len: 2.4 } },
          g({ anim: { k: 'scale', sx: -1, d: 0.8, len: 2.4 }, style: `transform-origin:${r2(piv)}px ${low}px` },
            rect(X(0), low, len, hgt, { cls: 'k-fill' }), rect(X(0), low, len, hgt, { cls: 'k-frame', fill: 'none', style: 'stroke:var(--ink-soft);stroke-width:1.5;stroke-dasharray:5 3' }),
            lowTicks.map(f => line(lowX(f), low + hgt - 8, lowX(f), low + hgt, { cls: 'k-line', style: 'stroke-width:1' })))),
        g({ anim: { k: 'in', d: 3, len: 0.6 } },
          path(`M${r2(piv)} ${top + hgt / 2}A${(low - top) / 2} ${(low - top) / 2} 0 0 1 ${r2(piv)} ${low + hgt / 2}`, { cls: 'k-line', style: 'stroke-width:1.2' }),
          lowTicks.filter(lowLabel).map(f => text(lowX(f), low + hgt + (row2low(f) ? 34 : 18), hz(f), { cls: f === 5000 ? 'k-num-accent' : 'k-tick' })),
          text(X(4000) - 8, low + hgt / 2 + 4, ph ? '← to 8,000' : '← runs back to 8,000 Hz', { anchor: 'end', cls: 'k-tick' }))),
      step(3, 'arrows from each tone above 4,000 Hz up to the tone it lands on',
        g({ anim: { k: 'in', d: 3.6, len: 0.8 } }, maps.map(([f, s, hot]) => arrow(L.slug, [[lowX(f) + (s === 0 ? 4 : 0), low - 2], [X(s) + (s === 0 ? 4 : 0), top + hgt + 6]], { tone: hot ? 'accent' : '' }))),
        ph ? g({ anim: { k: 'in', d: 3.6, len: 0.8 } },
          text(90, 264, 'true tone', { anchor: 'start', cls: 'k-label' }), text(230, 264, 'stored', { anchor: 'start', cls: 'k-label' }),
          maps.map(([f, s, hot], i) => g({}, text(90, 288 + i * 22, `${hz(f)} Hz${hot ? ' *' : ''}`, { anchor: 'start', cls: hot ? 'k-num-accent' : 'k-num' }),
            text(230, 288 + i * 22, `${hz(s)} Hz`, { anchor: 'start', cls: hot ? 'k-num-accent' : 'k-num' }))))
          : g({ anim: { k: 'in', d: 3.6, len: 0.8 } },
            text(460, top + 4, 'true tone', { anchor: 'start', cls: 'k-label' }), text(600, top + 4, 'stored', { anchor: 'start', cls: 'k-label' }),
            line(460, top + 14, 680, top + 14, { cls: 'k-grid' }),
            maps.map(([f, s, hot], i) => g({}, text(460, top + 36 + i * 22, `${hz(f)} Hz${hot ? ' *' : ''}`, { anchor: 'start', cls: hot ? 'k-num-accent' : 'k-num' }),
              text(600, top + 36 + i * 22, `${hz(s)} Hz`, { anchor: 'start', cls: hot ? 'k-num-accent' : 'k-num' }))))),
      text(ph ? 90 : 460, ph ? 384 : top + 136, '* the clinic’s whistle', { anchor: 'start', cls: 'k-tick' }),
    ];
  };

  const zigzag = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 56 : 80, y: 50, w: ph ? 280 : 580, h: ph ? 180 : 200, xs: [0, 16000], ys: [0, 4800] });
    const marks = [[5000, 3000], [9000, 1000], [13000, 3000]];
    const cls = f => (f === 5000 ? 'k-stem-accent-dot' : 'k-stem-dot'), tcls = f => (f === 5000 ? 'k-num-accent' : 'k-num');
    return [
      axes(P, { yTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000']], xTicks: ph ? [[0, '0'], [8000, '8,000'], [16000, '16,000']] : [[0, '0'], [4000, '4,000'], [8000, '8,000'], [12000, '12,000'], [16000, '16,000']],
        xTitle: 'true tone, Hz', yTitle: 'stored tone, Hz' }),
      line(P.x0, P.Y(4000), P.x1, P.Y(4000), { cls: 'k-guide' }),
      text(P.X(8000), P.Y(4000) - 10, 'the limit, 4,000 Hz', { cls: 'k-label' }),
      path(range(0, 4).map(i => `${i ? 'L' : 'M'}${r2(P.X(4000 * i))} ${r2(P.Y(i % 2 ? 4000 : 0))}`).join(''), { cls: 'k-curve' }),
      marks.map(([f, s]) => circle(P.X(f), P.Y(s), 5.5, { cls: cls(f) })),
      ph ? marks.map(([f, s], i) => g({}, text(P.X(f) + 10, P.Y(s) + 4, String(i + 1), { anchor: 'start', cls: tcls(f) }),
        circle(30, 290 + i * 22, 5, { cls: cls(f) }), text(44, 294 + i * 22, `${i + 1}: ${hz(f)} Hz is stored as ${hz(s)} Hz`, { anchor: 'start', cls: tcls(f) })))
        : marks.map(([f, s]) => text(P.X(f) + 10, P.Y(s) + (f === 9000 ? 16 : -8), `${hz(f)} → ${hz(s)}`, { anchor: 'start', cls: tcls(f) })),
    ];
  };

  const knife = L => {
    const ph = L.phone;
    const cases = [[0, 'at its peaks', 'starts on a peak'], [60, 'in between', 'starts 60° later'], [90, 'at its middle crossings', 'starts 90° later']];
    const panel = ([phi, title, sub], i) => {
      const P = ph ? plot({ x: 40, y: 84 + i * 210, w: 300, h: 100, xs: [-0.4, 3.4], ys: [-1.3, 1.3] })
        : plot({ x: 40 + i * 240, y: 74, w: 190, h: 130, xs: [-0.4, 3.4], ys: [-1.3, 1.3] });
      const wave = t => cosd(180 * t - phi), ns = range(0, 3), size = Math.abs(cosd(phi));
      const vals = ns.map(n => num(wave(n)));
      const shift = (P.X(1) - P.X(0)) * phi / 180;
      const stemsEl = size > 1e-9 ? stems(P, ns.map(n => [n, wave(n)]), { dot: 5 }) : g({}, ns.map(n => circle(P.X(n), P.Y(0), 5, { cls: 'k-stem-dot' })));
      return { P, frame: g({},
        text(P.x0, P.y0 - 30, title, { anchor: 'start', cls: 'k-name' }), text(P.x0, P.y0 - 12, sub, { anchor: 'start', cls: 'k-tick' }),
        axes(P, { xTicks: ns.map(n => [n, n ? String(n) : 'n = 0']) }),
        ns.map(n => line(P.X(n), P.y0, P.X(n), P.y1, { cls: 'k-grid' }))),
        wave: g({ anim: i ? { k: 'move', dx: -shift, d: 1 + 1.4 * (i - 1), len: 1.2 } : undefined }, curve(P, wave, { cls: 'k-curve-soft', n: 200 })),
        dots: g({ anim: i ? { k: 'in', d: 2.2 + 1.4 * (i - 1), len: 0.4 } : undefined }, stemsEl,
          text(P.x0 + P.w / 2, P.y1 + 40, `stores ${vals.join(', ')}, ...`, { cls: size < 1e-9 ? 'k-num-accent' : 'k-num' })) };
    };
    const ps = cases.map(panel);
    return [
      text(L.W / 2, 22, ph ? 'one 4,000 Hz tone: 180° per sample' : 'one 4,000 Hz tone, 180° per sample, started at three moments', { cls: 'k-note' }),
      step(1, 'one 4,000 Hz wave sampled at its peaks stores a full flip: 1, −1, 1, −1', ps[0].frame, g({}, ps[0].wave, ps[0].dots)),
      step(2, 'the same wave started 60 degrees later stores a flip of size 0.5', ps[1].frame, g({}, ps[1].wave, ps[1].dots)),
      step(3, 'started a quarter cycle later, every sample lands on a middle crossing and reads 0', ps[2].frame, g({}, ps[2].wave, ps[2].dots)),
    ];
  };

  const fullLap = L => {
    const ph = L.phone, cx = ph ? 180 : 200, cy = ph ? 170 : 170, R = ph ? 88 : 104;
    const rs = a => R + 10 + 22 * a / 405;
    const spiral = range(0, 399, 3).map(a => at(cx, cy, rs(a), a));
    const sd = spiral.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join('');
    const [ex, ey] = at(cx, cy, R, 45);
    const tx = ph ? 24 : 400, ty = ph ? 330 : 64, dy = 24, lgx = ph ? 24 : tx, lgy = ph ? 430 : ty + 2 * dy + 64;
    const lines = [['9,000 Hz: 405° per sample', 'k-num'], ['1,000 Hz: 45° per sample', 'k-num']];
    const [sx, sy] = at(cx, cy, R + 56, 60);
    return [
      step(1, 'a wheel; both dots start at the right',
        line(cx - R - 36, cy, cx + R + 36, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
        circle(cx + R, cy, 3.5, { cls: 'k-stop' }), text(cx + R - 8, cy + 18, 'start', { anchor: 'end', cls: 'k-tick' }),
        lines.map(([s, cls], i) => text(tx, ty + i * dy, s, { anchor: 'start', cls })),
        text(tx, ty + 2 * dy + 22, `405° ${M} 360° = 45°`, { anchor: 'start', cls: 'k-math' })),
      step(2, 'the 1,000 Hz dot turns 45 degrees counter-clockwise',
        arc(cx, cy, R - 16, 0, 40, { draw: { k: 'draw', d: 0.4, len: 1 } }),
        text(...at(cx, cy, R - 34, 22).map((v, i) => v + (i ? 4 : 0)), '45°', { cls: 'k-num' }),
        g({ anim: { k: 'turn', r0: '45deg', steps: 30, d: 0.4, len: 1 }, style: `transform-origin:${cx}px ${cy}px` }, circle(ex, ey, 10, { cls: 'k-stem-dot k-hollow' }))),
      step(3, 'the 9,000 Hz dot runs one extra ghost lap between two looks, 405 degrees in all',
        g({ anim: { k: 'in', d: 1.8, len: 3.2 } }, path(sd, { cls: 'k-curve-soft' }), head(cx, cy, rs(400), 400, 1, 'k-head'),
          text(...at(cx, cy, R + 46, 18), '405°', { anchor: 'start', cls: 'k-num' })),
        g({ anim: { k: 'turn', r0: '405deg', steps: 90, d: 1.8, len: 3.2 }, style: `transform-origin:${cx}px ${cy}px` }, circle(ex, ey, 5.5, { cls: 'k-stem-dot' }))),
      step(4, 'both end on the same spot, 45 degrees counter-clockwise from the start',
        g({ anim: { k: 'in', d: 5.2, len: 0.6 } }, line(ex + 8, ey - 8, sx - 4, sy + 4, { cls: 'k-line', style: 'stroke-width:1' }), text(sx, sy, 'same spot', { anchor: 'start', cls: 'k-note-accent' }))),
      g({}, circle(lgx + 10, lgy - 3, 7, { cls: 'k-stem-dot k-hollow' }), text(lgx + 32, lgy + 1, 'hollow circle: 1,000 Hz', { anchor: 'start', cls: 'k-label' }),
        circle(lgx + 10, lgy + 19, 4.5, { cls: 'k-stem-dot' }), text(lgx + 32, lgy + 23, 'filled dot inside it: 9,000 Hz', { anchor: 'start', cls: 'k-label' }),
        line(lgx, lgy + 43, lgx + 24, lgy + 43, { cls: 'k-curve-soft' }), text(lgx + 32, lgy + 47, 'dashed: the extra lap 9,000 Hz turns', { anchor: 'start', cls: 'k-label' })),
    ];
  };

  const voiceAliases = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 24 : 60, y: ph ? 124 : 110, w: ph ? 316 : 620, h: 120, xs: [0, 5300], ys: [0, 1.1] });
    const legY = [P.y0 - 66, P.y0 - 34], hw = 0.9, hs = 0.6;
    const bar = (f, v) => rect(P.X(f) - 5, P.Y(v), 10, P.Y(0) - P.Y(v), { fill: `url(#${L.slug}-hatch)`, cls: 'k-bar-hatch' });
    return [
      rect(P.x0, P.Y(0.4), P.X(3400) - P.x0, P.Y(0) - P.Y(0.4), { cls: 'k-fill' }),
      line(P.x0, P.Y(0.4), P.X(3400), P.Y(0.4), { cls: 'k-line' }), line(P.X(3400), P.Y(0.4), P.X(3400), P.Y(0), { cls: 'k-line' }),
      text(ph ? P.X(1300) : P.X(1500), P.Y(0.4) + 22, ph ? 'the voice' : 'the voice, up to 3,400 Hz', { cls: 'k-label' }),
      line(P.X(4000), P.y0, P.X(4000), P.Y(0), { cls: 'k-guide' }),
      ph ? text(P.X(4000), P.y1 + 34, 'the limit', { cls: 'k-tick' }) : text(P.X(4000) + 6, P.y0 + 12, 'the limit', { anchor: 'start', cls: 'k-tick' }),
      axes(P, { zero: false, xTitle: 'Hz', xTicks: (ph ? [0, 2000, 3000, 4000, 5000] : [0, 1000, 2000, 3000, 3400, 4000, 4600, 5000]).map(f => [f, hz(f)]) }),
      stems(P, [[4600, hs], [5000, hw]], { cls: 'k-stem-soft', dot: 4 }),
      arrow(L.slug, [[P.X(5000), P.Y(hw) - 6], [P.X(5000), legY[0]], [P.X(3000), legY[0]], [P.X(3000), P.Y(hw) - 8]]),
      arrow(L.slug, [[P.X(4600), P.Y(hs) - 6], [P.X(4600), legY[1]], [P.X(3400), legY[1]], [P.X(3400), P.Y(hs) - 8]]),
      masked(P.X(4000), legY[0] - 10, ph ? 'whistle 5,000 → 3,000' : 'whistle 5,000 → 3,000', { cls: 'k-label' }),
      ph ? text(L.W / 2, 24, 'squeal 4,600 → 3,400', { cls: 'k-label' }) : masked(P.X(4000), legY[1] - 10, 'squeal 4,600 → 3,400', { cls: 'k-label' }),
      ph ? text(P.X(4000), legY[1] - 6, 'squeal', { cls: 'k-tick' }) : '',
      bar(3000, hw), bar(3400, hs),
      ph ? legend(L.slug, 24, L.H - 34, [['k-stem-soft', 'a true tone, never stored'], ['hatch', 'its alias, made by sampling']], { cols: 1, dy: 22 })
        : legend(L.slug, 60, L.H - 12, [['k-stem-soft', 'a true tone, never stored'], ['hatch', 'its alias, made by sampling']], { dx: 280 }),
    ];
  };

  const filterFirst = L => {
    const ph = L.phone;
    const P = plot({ x: ph ? 40 : 70, y: 56, w: ph ? 300 : 610, h: ph ? 120 : 130, xs: [0, 5200], ys: [0, 1.25] });
    const gain = f => Math.max(0, Math.min(1, (4600 - f) / 1200));
    const top = ph ? 314 : 262, chainY = top, ghostY = top + (ph ? 88 : 90), bh = ph ? 40 : 44;
    const xs = ph ? [12, 102, 192, 282] : [70, 230, 390, 550], bw = ph ? 68 : 120;
    const chain = (y, names, goodAt) => g({},
      names.slice(1).map((_, i) => arrow(L.slug, [[xs[i] + bw + 3, y + bh / 2], [xs[i + 1] - 5, y + bh / 2]])),
      names.map((n, i) => box(xs[i], y, i === 3 && !ph ? 130 : bw, bh, { name: n, cls: i === goodAt ? 'k-box-good' : 'k-box' })));
    const nm = ph ? ['mic', 'filter', 'sampler', 'stores'] : ['microphone', 'filter', 'sampler', 'stores'];
    const xt = ph ? [0, 2000, 3400, 4600] : [0, 1000, 2000, 3400, 4000, 4600, 5000];
    const mark = f => g({}, circle(P.X(f), P.Y(0), 4.5, { cls: 'k-stem-soft-dot' }), cross(P.X(f), P.Y(0) - 16));
    return [
      rect(P.X(0), P.Y(1), P.X(3400) - P.X(0), P.Y(0) - P.Y(1), { cls: 'k-fill' }),
      text(P.X(1700), P.Y(0.5), ph ? 'voice' : 'the voice', { cls: 'k-label' }),
      axes(P, { zero: false, yTicks: [[0, '0%'], [1, '100%']], xTitle: ph ? '' : 'Hz', xTicks: xt.map(f => [f, hz(f)]), yTitle: ph ? 'gain' : 'the filter’s gain' }),
      line(P.X(3400), P.Y(1) - 18, P.X(4600), P.Y(1) - 18, { cls: 'k-axis' }),
      line(P.X(3400), P.Y(1) - 23, P.X(3400), P.Y(1) - 13, { cls: 'k-axis' }), line(P.X(4600), P.Y(1) - 23, P.X(4600), P.Y(1) - 13, { cls: 'k-axis' }),
      text(P.X(4000), P.Y(1) - 28, 'room to fall', { cls: 'k-note' }),
      path(`M${P.X(0)} ${r2(P.Y(1))}L${r2(P.X(3400))} ${r2(P.Y(1))}L${r2(P.X(4600))} ${r2(P.Y(0))}L${P.x1} ${r2(P.Y(0))}`, { cls: 'k-curve' }),
      line(P.X(4000), P.Y(0.5) + 7, P.X(4000), P.Y(0), { cls: 'k-edge' }),
      circle(P.X(4000), P.Y(0.5), 5, { cls: 'k-stem-input-dot' }),
      text(P.X(4000), P.y1 + 34, ph ? 'cutoff' : 'cutoff: half gain', { cls: 'k-num-input' }),
      mark(4600), mark(5000),
      ph ? g({}, text(P.X(4600), P.y1 + 54, 'squeal 4,600', { cls: 'k-tick' }), text(P.X(5000) + 14, P.y1 + 72, 'whistle 5,000', { anchor: 'end', cls: 'k-tick' }))
        : g({}, text(P.X(4600), P.Y(0) - 32, 'squeal', { cls: 'k-label' }), text(P.X(5000) + 4, P.Y(0) - 32, 'whistle', { cls: 'k-label' })),
      text(xs[0] + (ph ? 18 : 22), chainY - 14, ph ? 'filter first: works' : 'filter first: whistle and squeal removed before sampling', { anchor: 'start', cls: 'k-name' }),
      check(xs[0] + 6, chainY - 19),
      chain(chainY, nm, 1),
      g({ cls: 'k-muted' },
        text(xs[0] + (ph ? 18 : 22), ghostY - 14, ph ? 'filter after: fails' : 'filter after the sampler: too late', { anchor: 'start', cls: 'k-name' }),
        cross(xs[0] + 6, ghostY - 19),
        chain(ghostY, [nm[0], nm[2], nm[1], nm[3]], -1)),
      ph ? g({}, text(L.W / 2, ghostY + bh + 26, 'by then they are stored at 3,000', { cls: 'k-label' }), text(L.W / 2, ghostY + bh + 46, 'and 3,400 Hz, inside the voice', { cls: 'k-label' }))
        : text(L.W / 2, ghostY + bh + 30, 'by then the whistle is stored at 3,000 Hz and the squeal at 3,400 Hz, inside the voice', { cls: 'k-label' }),
    ];
  };

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, eyebrow: 'Lesson 4 · sampling and aliasing', body: (kk, L) => body(L) });

  return [
    fig('sampler', [300, 290], 'What the phone stores',
      `A smooth 1,000 Hz true tone is sampled every 125 microseconds; between samples the phone looks away, and the list it stores is 1, 0.71, 0, ${M}0.71, ${M}1, ${M}0.71, 0, 0.71, 1.`,
      'The dashed wave is the true tone. Every 125 µs the phone takes one sample, a dot; in the shaded gaps it sees nothing. The numbers underneath are all it keeps.', sampler, 4),
    fig('same-dots', [330, 330], 'Two waves, the same nine dots',
      `The 5,000 Hz whistle and a 3,000 Hz tone look nothing alike, yet both pass through the same nine samples: 1, ${M}0.71, 0, 0.71, ${M}1, 0.71, 0, ${M}0.71, 1.`,
      'The solid coral wave is 3,000 Hz, the dashed grey wave the 5,000 Hz whistle. Both go through exactly the same dots (each rings briefly as the whistle passes it), and the phone stores only the dots.', sameDots, 3),
    fig('wheel', [350, 674], 'Mirror spots on the wheel',
      `The whistle turns 225 degrees counter-clockwise per sample and lands at the lower left; 3,000 Hz turns 135 degrees and lands at the upper left; the two spots mirror each other across the horizontal line and give the same reading, ${M}0.71.`,
      'Two wheels after one sample. On the whistle’s wheel, the ring marks where 3,000 Hz lands: the mirror spot across the dashed line, straight above, so the left-right readings, the samples, are equal.', wheelFig, 4),
    fig('cinema', [262, 262], 'The cinema wheel',
      'A car wheel turning 23 times a second is filmed 24 times a second: it really turns 345 degrees counter-clockwise, forwards, between pictures, but each picture shows the spoke 15 degrees further clockwise, backwards.',
      'Film pictures in a row. Between pictures the wheel spins 345° forwards, counter-clockwise; on screen the spoke creeps 15° backwards, clockwise, each time.', cinema, 3),
    fig('mirror', [380, 650], 'Every sample stays mirrored',
      `Stepping both dots together for eight samples, 3,000 Hz goes n times 135 degrees counter-clockwise and 5,000 Hz n times 135 degrees clockwise; at every sample they sit on mirror spots and their readings match: 1, ${M}0.71, 0, 0.71, ${M}1, 0.71, 0, ${M}0.71.`,
      'Two samples are tied: at n = 1 and n = 3, the 3,000 Hz dot (hollow) and the 5,000 Hz dot (filled) sit on mirror spots across the dashed line. The table checks all eight readings.', mirror, 3),
    fig('turn-round', [340, 390], 'The stored tone turns round',
      'Stored tone against true tone from 0 to 8,000 Hz is a tent: it climbs to 4,000 Hz, then falls back to 0; 4,600 Hz is stored as 3,400, 5,000 as 3,000, 7,000 as 1,000 and 8,000 as 0.',
      'What the lab shows, in one picture: the stored tone climbs with the true tone up to 4,000 Hz, then turns round and falls.', turnRound),
    fig('fold', [270, 400], 'Fold the strip at the limit',
      'A strip of true tones from 0 to 8,000 Hz folds at 4,000 Hz, so each tone above the limit lands on top of its alias: 5,000 on 3,000, 4,600 on 3,400, 7,000 on 1,000 and 8,000 on 0.',
      'The part of the strip above the limit folds back under, running back to 8,000 Hz. Each tone above 4,000 Hz ends up directly beneath the tone it is stored as.', fold, 3),
    fig('zigzag', [310, 370], 'Past the fold: a zigzag',
      'Stored tone against true tone from 0 to 16,000 Hz zigzags between 0 and the limit, 4,000 Hz; 5,000 Hz and 13,000 Hz are stored as 3,000 Hz, and 9,000 Hz as 1,000 Hz.',
      'The tent repeats forever. However high the true tone, the stored tone lands between 0 and 4,000 Hz.', zigzag),
    fig('knife-edge', [290, 700], 'A tone right at the limit',
      `One 4,000 Hz wave sampled at its peaks stores a full flip, 1, ${M}1, 1, ${M}1; started 60 degrees later it stores a flip of size 0.5; started a quarter cycle later every sample reads 0.`,
      'The same 4,000 Hz tone three times, started at different moments. How much of it the phone stores depends only on timing.', knife, 3),
    fig('full-lap', [330, 510], 'A full turn is invisible',
      'A 9,000 Hz dot turns 405 degrees per sample, one ghost lap plus 45 degrees, and stops on the same spot as a 1,000 Hz dot that turns 45 degrees, so the two give the same samples.',
      'Between two looks the faster dot runs one extra lap, drawn dashed. It ends exactly where the slower dot ends.', fullLap, 4),
    fig('voice-aliases', [310, 356], 'The aliases land inside the voice',
      'The voice fills 0 to 3,400 Hz; the whistle at 5,000 Hz folds to 3,000 Hz and the squeal at 4,600 Hz folds to 3,400 Hz, both among the voice’s own tones.',
      'What the phone stores for the incoming call: the voice up to 3,400 Hz, with the two aliases, hatched, inside it.', voiceAliases),
    { ...fig('filter-first', [444, 510], 'Filter first',
      'A filter between the microphone and the sampler keeps the voice at 100% up to 3,400 Hz, falls in a straight line across 3,400 to 4,600 Hz with the cutoff, the half-gain point, at 4,000 Hz, and removes the squeal and the whistle; a filter placed after the sampler is too late, because the aliases are already inside the voice.',
      'Top: the filter’s gain, flat to 3,400 Hz, then falling to about 0 by 4,600 Hz. The squeal and the whistle, crossed out, never reach the sampler. Below: the same filter after the sampler, too late.', filterFirst), css: '.k-fig .k-box-good { fill: var(--input-soft); stroke: var(--input); stroke-width: 2.5; }' },
  ];
};
