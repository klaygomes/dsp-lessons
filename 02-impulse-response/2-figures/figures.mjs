export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, stems, bars, arrow, check, cross, box, step, legend, fmt, cosd, range } = k;
  const M = '−';
  const f1 = v => fmt(v, 1), f2 = v => fmt(v, 2), f3 = v => fmt(v, 3);
  const HI = [0.8, 0.4, -0.6, -0.2], ECHO = [0.32, 0.32, -0.16, -0.2, -0.04, 0];
  const tone = n => (n < 0 ? 0 : cosd(45 * n));
  const echoTone = n => 0.4 * tone(n - 2000) + 0.2 * tone(n - 2001);
  const lateTone = n => 0.4 * tone(n - 2001) + 0.2 * tone(n - 2002);
  const big = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const broken = ({ x, y, w, h, parts, gap = 30, ys, widths }) => {
    const count = parts.reduce((s, [a, b]) => s + b - a + 1, 0);
    let cur = x;
    const segs = parts.map(([a, b], i) => {
      const width = widths ? widths[i] : (b - a + 1) * (w - gap * (parts.length - 1)) / count;
      const s = { a, b, x0: cur, x1: cur + width, unit: width / (b - a + 1) };
      cur = s.x1 + gap;
      return s;
    });
    const seg = n => segs.find(s => n >= s.a - 0.5 && n <= s.b + 0.5) || (n < segs[0].a ? segs[0] : segs[segs.length - 1]);
    const X = n => { const s = seg(n); return s.x0 + (n - s.a + 0.5) * s.unit; };
    const Y = v => y + h - (v - ys[0]) / (ys[1] - ys[0]) * h;
    return { X, Y, x0: x, x1: segs[segs.length - 1].x1, y0: y, y1: y + h, w, h, ys, segs, gap, xs: [parts[0][0] - 0.5, parts[parts.length - 1][1] + 0.5] };
  };
  const rescale = (P, ys) => ({ ...P, ys, Y: v => P.y1 - (v - ys[0]) / (ys[1] - ys[0]) * P.h });
  const zigzag = (x, y) => g({}, line(x - 6, y + 6, x - 2, y - 6, { cls: 'k-axis' }), line(x + 2, y + 6, x + 6, y - 6, { cls: 'k-axis' }));
  const baxis = (P, ticks = [], o = {}) => g({},
    P.segs.map(s => line(s.x0 - 2, P.Y(0), s.x1 + 2, P.Y(0), { cls: 'k-axis' })),
    P.segs.slice(1).map(s => zigzag(s.x0 - P.gap / 2, P.Y(0))),
    ticks.map(([n, s]) => text(P.X(n), o.at ?? P.y1 + 16, s, { cls: 'k-tick', style: o.small ? 'font-size:10px' : undefined })));
  const zeros = (P, ns) => stems(P, ns.map(n => [n, 0]), { cls: 'k-stem-soft', dot: 2.5 });
  const lab = (fmtv, cls = 'k-num', small = false) => ({ labels: v => (Math.abs(v) < 1e-9 ? '' : fmtv(v)), labelCls: cls, ...(small ? {} : {}) });
  const vals = (P, pts, fmtv, cls = 'k-num', size) => g({}, pts.filter(([, v]) => Math.abs(v) > 1e-9).map(([n, v]) =>
    text(P.X(n), v >= 0 ? P.Y(v) - 9 : P.Y(v) + 18, fmtv(v), { cls, style: size ? `font-size:${size}px` : undefined })));

  const guess = (P, pts, r = 3.5) => g({}, pts.map(([n, v]) => (Math.abs(v) < 1e-9 ? zeros(P, [n])
    : g({}, line(P.X(n), P.Y(0), P.X(n), P.Y(v), { cls: 'l2-guess' }), circle(P.X(n), P.Y(v), r, { cls: 'l2-guess-dot' })))));
  const key = (x, y, items, o = {}) => g({}, items.map(([kind, label], i) => {
    const lx = x + (o.cols === 1 ? 0 : i * (o.dx || 240)), ly = y + (o.cols === 1 ? i * 22 : 0);
    if (kind === 'tone') return g({}, line(lx, ly - 4, lx + 16, ly - 4, { cls: 'k-curve-input', style: 'opacity:0.35' }), circle(lx + 8, ly - 4, 3.5, { cls: 'k-stem-input-dot' }), text(lx + 22, ly + 3, label, { anchor: 'start', cls: 'k-label' }));
    const cls = { ink: ['k-stem', 'k-stem-dot'], accent: ['k-stem-accent', 'k-stem-accent-dot'], input: ['k-stem-input', 'k-stem-input-dot'], guess: ['l2-guess', 'l2-guess-dot'] }[kind];
    return g({}, line(lx + 8, ly + 5, lx + 8, ly - 9, { cls: cls[0] }), circle(lx + 8, ly - 9, 3.5, { cls: cls[1] }), text(lx + 22, ly + 3, label, { anchor: 'start', cls: 'k-label' }));
  }));

  const theLine = L => {
    if (L.phone) {
      const lanes = [[104, 'your voice', 'goes out', ''], [212, 'echo, 2,000', 'samples later', 'accent'], [320, 'far voice', 'comes back', '']];
      return [
        arrow(L.slug, [[104, 144], [104, 376]]),
        arrow(L.slug, [[212, 376], [212, 144]], { tone: 'accent' }),
        arrow(L.slug, [[320, 376], [320, 144]]),
        arrow(L.slug, [[104, 436], [104, 476]]),
        arrow(L.slug, [[320, 476], [320, 436]]),
        arrow(L.slug, [[104, 68], [104, 80]]),
        arrow(L.slug, [[320, 80], [320, 68]]),
        lanes.map(([x, a, b, tone]) => g({}, text(x - 10, 252, a, { anchor: 'end', cls: tone ? 'k-num-accent' : 'k-label', style: 'font-size:11px' }),
          text(x - 10, 268, b, { anchor: 'end', cls: tone ? 'k-num-accent' : 'k-label', style: 'font-size:11px' }))),
        text(212, 462, 'copper wire', { cls: 'k-tick' }),
        box(16, 16, 328, 52, { name: 'caller', sub: 'talks and listens' }),
        box(16, 84, 328, 56, { name: 'your equipment', sub: 'every sample in and out' }),
        box(16, 380, 328, 52, { name: 'the box', sub: 'on a street corner, leaks voice back', cls: 'k-box-accent' }),
        box(16, 480, 328, 52, { name: 'far person', sub: 'another city' }),
      ];
    }
    return [
      text(342, 40, 'your digital line, 8,000 samples per second', { cls: 'k-note' }),
      arrow(L.slug, [[100, 100], [116, 100]]),
      arrow(L.slug, [[120, 180], [104, 180]]),
      arrow(L.slug, [[240, 100], [440, 100]]),
      arrow(L.slug, [[444, 140], [244, 140]], { tone: 'accent' }),
      arrow(L.slug, [[444, 180], [244, 180]]),
      arrow(L.slug, [[564, 100], [608, 100]]),
      arrow(L.slug, [[612, 180], [568, 180]]),
      text(342, 92, 'your voice', { cls: 'k-label' }),
      text(342, 132, 'echo, 2,000 samples later', { cls: 'k-num-accent' }),
      text(342, 172, 'far voice', { cls: 'k-label' }),
      text(588, 136, 'copper', { cls: 'k-tick' }), text(588, 150, 'wire', { cls: 'k-tick' }),
      box(16, 64, 84, 152, { name: 'caller', sub: 'talks here' }),
      box(120, 64, 120, 152, { name: 'equipment', sub: 'every sample' }),
      box(444, 64, 120, 152, { name: 'the box', sub: 'leaks voice back', cls: 'k-box-accent' }),
      box(612, 64, 96, 152, { name: 'far person', sub: 'another city' }),
    ];
  };

  const impulse = L => {
    const ph = L.phone, a = ph ? -2 : -3, b = ph ? 5 : 6;
    const rows = [['δ[n]', 0, 1, 'k-stem-input'], [`δ[n ${M} 3]`, 3, 1, 'k-stem-input'], ['0.8 δ[n]', 0, 0.8, 'k-stem-input']];
    return rows.map(([name, at, v, cls], r) => {
      const y0 = (ph ? 40 : 40) + r * (ph ? 110 : 104);
      const P = plot({ x: ph ? 96 : 150, y: y0, w: ph ? 248 : 540, h: 52, xs: [a - 0.5, b + 0.5], ys: [0, 1] });
      const ns = range(a, b);
      return g({},
        axes(P, { xTicks: ns.map(n => [n, n === 0 ? (ph ? '0' : 'n = 0') : n < 0 ? `${M}${-n}` : String(n)]), zero: false }),
        zeros(P, ns.filter(n => n !== at)),
        stems(P, [[at, v]], { cls, labels: () => (v === 1 ? '1' : f1(v)), labelCls: 'k-num-input', dot: 5 }),
        text(ph ? 84 : 130, P.Y(0.45) + 6, name, { anchor: 'end', cls: 'k-math' }),
        r === 1 ? text(P.X(at) + 12, P.Y(1) + 4, ph ? '3 later' : 'the same click, 3 samples later', { anchor: 'start', cls: 'k-note' }) : '',
        r === 2 ? text(P.X(at) + 12, P.Y(0.8) + 4, ph ? 'scaled' : 'the same click, scaled to 0.8', { anchor: 'start', cls: 'k-note' }) : '');
    });
  };

  const impulseResponse = L => {
    const ph = L.phone;
    const C = ph ? plot({ x: 120, y: 66, w: 120, h: 70, xs: [-1.5, 1.5], ys: [0, 1] }) : plot({ x: 24, y: 96, w: 140, h: 80, xs: [-2.5, 2.5], ys: [0, 1] });
    const bx = ph ? { x: 120, y: 180, w: 120, h: 64 } : { x: 196, y: 112, w: 128, h: 64 };
    const P = ph ? broken({ x: 24, y: 320, w: 320, h: 70, parts: [[0, 1], [1999, 2002]], gap: 40, ys: [0, 1] })
      : broken({ x: 356, y: 96, w: 348, h: 80, parts: [[0, 2], [1998, 2003]], gap: 44, ys: [0, 1] });
    const flat = ph ? [0, 1, 1999] : [0, 1, 2, 1998, 1999];
    const tail = ph ? [2002] : [2002, 2003];
    const brY = P.y1 + 48;
    const cy = bx.y + bx.h / 2;
    const fly = ph ? { k: 'move', dy: C.Y(0) - bx.y, d: 0.8, len: 1.2 } : { k: 'move', dx: C.X(0) - bx.x, d: 0.8, len: 1.2 };
    const end = ph ? [180, bx.y + 4] : [bx.x + 6, cy];
    return [
      text(ph ? 180 : C.X(0), ph ? 28 : C.y0 - 30, 'the click in, δ[n]', { cls: 'k-name' }),
      text(ph ? 184 : 530, ph ? P.y0 - 34 : P.y0 - 30, 'what comes back, h[n]', { cls: 'k-name' }),
      axes(C, { xTicks: ph ? [[0, 'n = 0']] : [[-2, `${M}2`], [0, 'n = 0'], [2, '2']], zero: false }),
      ph ? arrow(L.slug, [[180, 160], [180, 176]]) : arrow(L.slug, [[168, cy], [192, cy]]),
      ph ? arrow(L.slug, [[180, 248], [180, 270]]) : arrow(L.slug, [[328, cy], [348, cy]]),
      baxis(P, ph ? [[0, '0'], [1999, '1,999'], [2001, '2,001']] : [[0, '0'], [2, '2'], [1998, '1,998'], [2000, '2,000'], [2002, '2,002']], { small: ph }),
      ph ? text(P.X(2000), P.y1 + 28, '2,000', { cls: 'k-tick', style: 'font-size:10px' }) : text(P.X(2001), P.y1 + 30, '2,001', { cls: 'k-tick' }),
      step(1, 'a click of size 1 at n = 0', g({}, zeros(C, ph ? [-1, 1] : [-2, -1, 1, 2]), stems(C, [[0, 1]], { cls: 'k-stem-input', dot: 5, labels: () => '1', labelCls: 'k-num-input' }))),
      box(bx.x, bx.y, bx.w, bx.h, { name: 'the box', sub: 'echo path, sealed' }),
      step(2, 'the click goes into the sealed box',
        g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0.8, len: 1.3 } }, g({ anim: fly }, circle(end[0], end[1], 6, { cls: 'k-stem-input-dot' })))),
      step(3, 'silence for 2,000 samples, n = 0 to 1,999, a quarter of a second',
        g({ anim: { k: 'in', d: 2.2, len: 1 } }, zeros(P, flat),
          line(P.X(0), brY - 6, P.X(0), brY + 6, { cls: 'k-axis' }), line(P.X(1999), brY - 6, P.X(1999), brY + 6, { cls: 'k-axis' }),
          line(P.X(0), brY, P.X(1999), brY, { cls: 'k-axis' }),
          text((P.X(0) + P.X(1999)) / 2, brY + 18, ph ? '2,000 silent samples, 0.25 s' : 'n = 0 to 1,999: 2,000 silent samples = 0.25 s', { cls: 'k-num' }))),
      step(4, 'then 0.4 and 0.2, then silence for good',
        g({ anim: { k: 'in', d: 3.6, len: 0.8 } }, stems(P, [[2000, 0.4], [2001, 0.2]], { dot: 5, labels: v => f1(v) }), zeros(P, tail))),
    ];
  };

  const wordAsClicks = L => {
    const ph = L.phone;
    const xs = [-0.6, 3.6], X0 = ph ? 150 : 300, W = ph ? 190 : 320, rh = ph ? 54 : 50;
    const W0 = plot({ x: X0, y: ph ? 40 : 40, w: W, h: rh, xs, ys: [-0.9, 0.9] });
    const rowY = i => (ph ? 150 : 140) + i * (ph ? 74 : 64);
    const R = i => plot({ x: X0, y: rowY(i), w: W, h: rh, xs, ys: [-0.9, 0.9] });
    const names = ['0.8 δ[n]', `+ 0.4 δ[n ${M} 1]`, `${M} 0.6 δ[n ${M} 2]`, `${M} 0.2 δ[n ${M} 3]`];
    const lx = ph ? 138 : 280;
    const last = R(3).y1;
    return [
      range(0, 3).map(n => text(W0.X(n), 18, n ? String(n) : 'n = 0', { cls: 'k-tick' })),
      axes(W0, { xTicks: [] }),
      text(lx, W0.Y(0) + 6, '“hi”', { anchor: 'end', cls: 'k-name' }),
      line(ph ? 16 : 40, (W0.y1 + R(0).y0) / 2 + 2, ph ? 344 : 680, (W0.y1 + R(0).y0) / 2 + 2, { cls: 'k-grid' }),
      step(1, `the word: 0.8, 0.4, ${M}0.6, ${M}0.2`, stems(W0, HI.map((v, n) => [n, v]), { cls: 'k-stem-input', dot: 5, labels: f1, labelCls: 'k-num-input' })),
      range(0, 3).map(i => axes(R(i), { xTicks: [] })),
      step(2, 'the word comes apart into four clicks, one per row, each the same size it had in the word',
        range(0, 3).map(i => g({ anim: { k: 'move', dy: W0.Y(0) - R(i).Y(0), d: 1, len: 1.2 } },
          zeros(R(i), range(0, 3).filter(n => n !== i)), stems(R(i), [[i, HI[i]]], { cls: 'k-stem-input', dot: 5, labels: f1, labelCls: 'k-num-input' })))),
      step(3, 'each row is one click, written as a scaled, shifted impulse; plus signs between them',
        g({ anim: { k: 'in', d: 2.4, len: 0.8 } },
          range(0, 3).map(i => text(lx, R(i).Y(0) + 5, names[i], { anchor: 'end', cls: 'k-math', style: ph ? 'font-size:14px' : 'font-size:17px' })))),
      step(4, 'the four clicks slide back together into the word',
        range(0, 3).map(i => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 3.6, len: 1.4 } },
          g({ anim: { k: 'move', dy: R(i).Y(0) - W0.Y(0), d: 3.6, len: 1.2 } }, stems(W0, [[i, HI[i]]], { cls: 'k-stem-input', dot: 5 })))),
        g({ anim: { k: 'in', d: 5, len: 0.6 } }, text(ph ? 180 : 360, last + 36, ph ? 'the four rows added = “hi”' : 'the four rows added = “hi”, the top row', { cls: 'k-note', style: ph ? 'font-size:15px' : undefined }))),
    ];
  };

  const copies = L => {
    const ph = L.phone;
    const parts = [[0, 3], [2000, 2005]];
    const rowY = i => (ph ? 82 : 60) + i * (ph ? 100 : 70);
    const mk = (y, h) => ph ? broken({ x: 24, y, w: 320, h, parts, gap: 26, widths: [96, 198], ys: [-0.9, 0.9] })
      : broken({ x: 180, y, w: 520, h, parts, gap: 40, widths: [160, 320], ys: [-0.9, 0.9] });
    const rows = range(0, 3).map(i => mk(rowY(i), 52));
    const S = mk(ph ? 494 : 352, 52);
    const right = P => rescale(P, [-0.45, 0.45]);
    const copy = i => [[2000 + i, 0.4 * HI[i]], [2001 + i, 0.2 * HI[i]]];
    const small = ph ? 9 : undefined;
    const rn = range(2000, 2005);
    const names = ['from 0.8 at n = 0', 'from 0.4 at n = 1', `from ${M}0.6 at n = 2`, `from ${M}0.2 at n = 3`];
    const colW = ph ? 28 : 46;
    const tickY = S.y1 + (ph ? 18 : 26);
    const ticks = g({}, (ph ? [[0, '0'], [3, '3']] : [[0, 'n = 0'], [1, '1'], [2, '2'], [3, '3']]).map(([n, t]) => text(S.X(n), tickY, t, { cls: 'k-tick', style: ph ? 'font-size:10px' : undefined })),
      rn.map((n, i) => text(S.X(n), tickY + (ph && i % 2 ? 12 : 0), big(String(n)), { cls: 'k-tick', style: ph ? 'font-size:9.5px' : undefined })));
    const note = text(ph ? 180 : 440, S.y1 + (ph ? 50 : 48), ph ? 'tinted: two copies land on one sample,' : 'tinted columns: two copies land on one sample, e.g. 0.16 + 0.16 = 0.32', { cls: 'k-num-accent', style: ph ? 'font-size:10px' : undefined });
    const note2 = ph ? text(180, S.y1 + 64, 'e.g. 0.16 + 0.16 = 0.32', { cls: 'k-num-accent', style: 'font-size:10px' }) : '';
    return [
      [2001, 2002, 2003].map(n => rect(S.X(n) - colW / 2, rows[0].y0 - 18, colW, S.y1 - rows[0].y0 + 24, { cls: 'l2-col' })),
      text(20, 20, ph ? 'h = 0.4, 0.2; each copy is h × one click' : 'h = 0.4 at n = 2,000 and 0.2 at 2,001; each copy is h times one click', { anchor: 'start', cls: 'k-label', style: ph ? 'font-size:9.5px' : undefined }),
      text(ph ? 20 : 700, ph ? 36 : 38, ph ? 'right half drawn 2× taller than the clicks' : 'the copies and the echo are drawn 2× taller than the clicks', { anchor: ph ? 'start' : 'end', cls: 'k-tick', style: ph ? 'font-size:9.5px' : undefined }),
      rows.map((P, i) => g({}, baxis(P), ph ? text(24, P.y0 - 20, `copy ${names[i]}`, { anchor: 'start', cls: 'k-tick', style: 'font-size:10px' }) : text(168, P.Y(0) + 4, names[i], { anchor: 'end', cls: 'k-tick' }))),
      baxis(S), ticks,
      text(ph ? 24 : 168, ph ? S.y0 - 20 : S.Y(0) + 4, 'echo (sum)', { anchor: ph ? 'start' : 'end', cls: 'k-name-accent' }),
      step(1, `the four clicks of the word: 0.8, 0.4, ${M}0.6, ${M}0.2`,
        rows.map((P, i) => g({}, zeros(P, range(0, 3).filter(n => n !== i)), stems(P, [[i, HI[i]]], { cls: 'k-stem-input', dot: 4.5, labels: f1, labelCls: ph ? 'k-tick' : 'k-num-input' })))),
      [[0, 1], [2, 3]].map((pair, j) => step(2 + j, pair.map(i => `copy of h from the click at n = ${i}: ${copy(i).map(([, v]) => f2(v)).join(', ')}`).join('; '),
        pair.map(i => g({ anim: { k: 'in', d: 1 + j * 1.2, len: 0.9 } }, g({ anim: { k: 'move', dx: -24, d: 1 + j * 1.2, len: 0.9 } },
          stems(right(rows[i]), copy(i), { dot: 4 }), zeros(rows[i], rn.filter(n => n !== 2000 + i && n !== 2001 + i)), vals(right(rows[i]), copy(i), f2, ph ? 'k-tick' : 'k-num', small)))))),
      step(4, 'the four copies slide down into one row',
        range(0, 3).map(i => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 3.6, len: 1.3 } },
          g({ anim: { k: 'move', dy: rows[i].Y(0) - S.Y(0), d: 3.6, len: 1.1 } }, stems(right(S), copy(i), { dot: 3 }))))),
      step(5, `the sum: 0.32, 0.32, ${M}0.16, ${M}0.20, ${M}0.04; two copies land on each of n = 2,001, 2,002 and 2,003`,
        g({ anim: { k: 'in', d: 5, len: 0.8 } }, stems(right(S), ECHO.slice(0, 5).map((v, i) => [2000 + i, v]), { cls: 'k-stem-accent', dot: 5 }),
          ECHO.slice(0, 5).map((v, i) => text(S.X(2000 + i), v >= 0 ? right(S).Y(v) - 9 - (ph && i % 2 ? 9 : 0) : right(S).Y(v) + 18 + (ph && i % 2 ? 9 : 0), f2(v), { cls: 'k-num-accent', style: small ? `font-size:${small}px` : undefined })),
          zeros(S, [2005]), zeros(S, [0, 1, 2, 3]), note, note2)),
    ];
  };

  const rule = L => {
    const ph = L.phone;
    const badge = (x, y, n) => g({}, circle(x, y, 8, { cls: 'l2-badge' }), text(x, y + 4, String(n), { cls: 'k-tick', style: 'font-size:10px' }));
    const fs = ph ? 24 : 28, fy = ph ? 56 : 62;
    const pos = ph ? { y: 64, S: 134, x: 186, h: 268 } : { y: 120, S: 200, x: 266, h: 356 };
    const formula = g({},
      text(pos.y, fy, 'y[n] =', { cls: 'k-math', style: `font-size:${fs}px` }),
      text(pos.S, fy + 8, 'Σ', { cls: 'k-math', style: `font-size:${fs + 12}px;font-style:normal` }),
      text(pos.S, fy + 28, 'k', { cls: 'k-math', style: 'font-size:14px' }),
      text(pos.x, fy, 'x[k]', { cls: 'k-math', style: `font-size:${fs}px` }),
      text((pos.x + pos.h) / 2 - (ph ? 6 : 8), fy - 2, '·', { cls: 'k-math', style: `font-size:${fs}px;font-style:normal` }),
      text(pos.h, fy, `h[n ${M} k]`, { cls: 'k-math', style: `font-size:${fs}px` }),
      badge(pos.y - 10, fy + 26, 4), badge(pos.S, fy + 46, 1), badge(pos.x, fy + 26, 2), badge(pos.h, fy + 26, 3));
    const code = ['y = [0.0 for _ in range(len(x) + len(h) - 1)]', 'for k in range(len(x)):', '    for m in range(len(h)):', '        y[k + m] += x[k] * h[m]'];
    const cs = ph ? 10 : 11.5, cw = cs * 0.6, cx = ph ? 24 : 40, cy = ph ? 140 : 150, lh = 26;
    const at = (line, col) => cx + (col + 0.5) * cw;
    const keyX = ph ? 24 : 400, keyY = ph ? 300 : 150, kl = ph ? 26 : 30;
    const keys = [
      [1, 'Σ: the two loops add up the copies of h'],
      [2, 'x[k]: one input sample'],
      [3, `h[n ${M} k] is h[m]: m = n ${M} k`],
      [4, 'y[n] is y[k + m]: n = k + m'],
    ];
    return [
      formula,
      rect(cx - 12, cy - 22, (ph ? 312 : 330), 4 * lh + 30, { cls: 'k-fill', rx: 6 }),
      code.map((s, i) => text(cx, cy + i * lh, s.replace(/ /g, ' '), { anchor: 'start', cls: 'k-num', style: `font-size:${cs}px` })),
      badge(at(1, 25), cy + lh - 4, 1), badge(at(2, 29), cy + 2 * lh - 4, 1),
      badge(at(3, 11.5), cy + 3 * lh + 14, 4), badge(at(3, 21.5), cy + 3 * lh + 14, 2), badge(at(3, 28.5), cy + 3 * lh + 14, 3),
      keys.map(([n, s], i) => g({}, badge(keyX + 8, keyY + i * kl - 4, n), text(keyX + 24, keyY + i * kl, s, { anchor: 'start', cls: 'k-label', style: ph ? 'font-size:11px' : undefined }))),
      text(keyX, keyY + 4 * kl + 10, ph ? 'the book writes this whole sum' : 'the book writes this whole sum as x * h;', { anchor: 'start', cls: 'k-note', style: ph ? 'font-size:15px' : 'font-size:16px' }),
      text(keyX, keyY + 4 * kl + (ph ? 32 : 32), ph ? 'as x * h; in code, * is plain times' : 'in the code, * is plain times', { anchor: 'start', cls: 'k-note', style: ph ? 'font-size:15px' : 'font-size:16px' }),
    ];
  };

  const flipSlide = L => {
    const ph = L.phone;
    const ks = range(-1, 4), cw = ph ? 36 : 58, x0 = ph ? 96 : 120;
    const cx = k => x0 + (k + 1) * cw + cw / 2;
    const xk = k => (k >= 0 && k <= 3 ? HI[k] : 0);
    const hAt = (n, k) => ({ 2000: 0.4, 2001: 0.2 })[n - k] || 0;
    const fs = ph ? 'font-size:10.5px' : undefined;
    const label = (y, s) => text(x0 - 10, y + 4, s, { anchor: 'end', cls: 'k-label', style: ph ? 'font-size:10.5px' : undefined });
    const top = ph ? 96 : 92, hdr = ph ? 128 : 124, xr = ph ? 156 : 150, row0 = ph ? 196 : 192, pitch = ph ? 76 : 58;
    const chip = (x, y, v) => g({}, rect(x - cw / 2 + 4, y - 15, cw - 8, 24, { cls: 'k-box', rx: 4 }), text(x, y + 2, f1(v), { cls: 'k-num', style: fs }));
    const flipRow = g({},
      text(ph ? 16 : 40, 40, 'h, as measured', { anchor: 'start', cls: 'k-label' }),
      chip(ph ? 40 : 64, 66, 0.4), chip(ph ? 40 + cw : 64 + cw, 66, 0.2),
      text(ph ? 40 : 64, 96 - (ph ? 4 : 6), '2,000', { cls: 'k-tick', style: 'font-size:9.5px' }), text(ph ? 40 + cw : 64 + cw, 96 - (ph ? 4 : 6), '2,001', { cls: 'k-tick', style: 'font-size:9.5px' }),
      arrow(L.slug, [[ph ? 128 : 184, 62], [ph ? 196 : 262, 62]]),
      text(ph ? 162 : 223, 52, 'flip', { cls: 'k-label' }),
      text(ph ? 216 : 290, 40, 'h written backwards', { anchor: 'start', cls: 'k-label' }),
      chip(ph ? 238 : 310, 66, 0.2), chip(ph ? 238 + cw : 310 + cw, 66, 0.4),
      text(ph ? 238 : 310, 96 - (ph ? 4 : 6), '2,001', { cls: 'k-tick', style: 'font-size:9.5px' }), text(ph ? 238 + cw : 310 + cw, 96 - (ph ? 4 : 6), '2,000', { cls: 'k-tick', style: 'font-size:9.5px' }));
    const posRow = (n, i) => {
      const y = row0 + i * pitch;
      const prods = ks.filter(k => hAt(n, k)).map(k => [k, xk(k) * hAt(n, k)]);
      const sum = prods.reduce((q, [, p]) => q + p, 0);
      const sumText = `${prods.map(([, p]) => (Math.abs(p) < 1e-9 ? '0' : p < 0 ? `(${f2(p)})` : f2(p))).join(' + ')} = ${f2(sum)}`;
      const slide = i ? { k: 'move', dx: -cw, d: 0.8 + i * 1.3, len: 0.8 } : undefined;
      return g({ anim: { k: 'in', d: 0.8 + i * 1.3, len: 0.4 } },
        label(y, `n = ${big(String(n))}`),
        g({ anim: slide }, ks.filter(k => hAt(n, k)).map(k => g({}, chip(cx(k), y, hAt(n, k)),
          ph ? '' : text(cx(k), y - 19, `h[${big(String(n - k))}]`, { cls: 'k-tick', style: 'font-size:9.5px' })))),
        ks.filter(k => hAt(n, k)).map(k => text(cx(k), y + 22, xk(k) * hAt(n, k) ? f2(xk(k) * hAt(n, k)) : '0', { cls: xk(k) ? 'k-num-accent' : 'k-tick', style: ph ? 'font-size:9.5px' : 'font-size:11px' })),
        ph ? text(x0 + 3 * cw, y + 42, `y[${big(String(n))}] = ${sumText}`, { cls: 'k-num-accent', style: 'font-size:10.5px' })
          : text(x0 + 6 * cw + 12, y + 4, `y[${big(String(n))}] = ${sumText}`, { anchor: 'start', cls: 'k-num-accent', style: 'font-size:11px' }),
        i ? text(x0 - 10, y + 18, 'one step right', { anchor: 'end', cls: 'k-tick', style: ph ? 'font-size:9px' : undefined }) : '');
    };
    return [
      step(1, 'h, 0.4 then 0.2, is flipped to 0.2 then 0.4, under the word written along k', flipRow,
        g({}, label(hdr, 'k'), label(xr, 'x[k]'),
          ks.map(k => g({}, text(cx(k), hdr + 4, k < 0 ? `${M}1` : String(k), { cls: 'k-tick' }),
            text(cx(k), xr + 4, xk(k) ? f1(xk(k)) : '0', { cls: xk(k) ? 'k-num-input' : 'k-tick', style: fs }))),
          line(x0, hdr + 12, x0 + 6 * cw, hdr + 12, { cls: 'k-grid' }), line(ph ? 14 : 40, top, ph ? 346 : 700, top, { cls: 'k-grid' }))),
      step(2, 'at n = 2,000 the flipped pair sits under k = −1 and 0: 0 + 0.32 = 0.32', posRow(2000, 0)),
      step(3, 'one step right, n = 2,001: 0.16 + 0.16 = 0.32', posRow(2001, 1)),
      step(4, 'one more step, n = 2,002: 0.08 + (−0.24) = −0.16', posRow(2002, 2),
        text(ph ? 16 : 40, row0 + 3 * pitch - (ph ? 14 : 4), ph ? 'under each k sits h[n − k]: at n = 2,000,' : 'under each k sits h[n − k]: at n = 2,000, k = 0 gets h[2,000] and k = −1 gets h[2,001]', { anchor: 'start', cls: 'k-note', style: ph ? 'font-size:14px' : 'font-size:15px' }),
        ph ? text(16, row0 + 3 * pitch + 4, 'k = 0 gets h[2,000], k = −1 gets h[2,001]', { anchor: 'start', cls: 'k-note', style: 'font-size:14px' }) : ''),
    ];
  };

  const smootherResponse = L => {
    const ph = L.phone;
    const C = plot({ x: ph ? 16 : 40, y: ph ? 66 : 76, w: ph ? 96 : 120, h: 56, xs: [-1.5, 2.5], ys: [0, 1] });
    const bx = ph ? { x: 128, y: 74, w: 104, h: 48 } : { x: 44, y: 168, w: 112, h: 48 };
    const Hh = plot({ x: ph ? 248 : 40, y: ph ? 66 : 262, w: ph ? 96 : 120, h: 56, xs: [-1.5, 2.5], ys: [0, 1] });
    const P = plot({ x: ph ? 40 : 300, y: ph ? 264 : 70, w: ph ? 304 : 400, h: ph ? 220 : 230, xs: [-0.6, 8.6], ys: [-1.15, 1.15] });
    const y = n => 0.5 * tone(n) + 0.5 * tone(n - 1);
    const items = [['tone', 'the 1,000 Hz tone in, silent before n = 0'], ['ink', 'convolution with 0.5, 0.5']];
    const lead = P.X(0) + 14;
    return [
      text(ph ? 16 : 24, 28, ph ? 'a click in' : 'a click into the smoother', { anchor: 'start', cls: 'k-name' }),
      axes(C, { xTicks: [[0, '0']], zero: false }), zeros(C, [-1, 1, 2]), stems(C, [[0, 1]], { cls: 'k-stem-input', dot: 4.5, labels: () => '1', labelCls: 'k-num-input' }),
      ph ? arrow(L.slug, [[114, 98], [124, 98]]) : arrow(L.slug, [[100, 146], [100, 164]]),
      ph ? arrow(L.slug, [[236, 98], [246, 98]]) : arrow(L.slug, [[100, 220], [100, 238]]),
      box(bx.x, bx.y, bx.w, bx.h, { name: 'smoother' }),
      axes(Hh, { xTicks: [[0, '0'], [1, '1']], zero: false }), zeros(Hh, [-1, 2]), stems(Hh, [[0, 0.5], [1, 0.5]], { dot: 4.5, labels: () => '0.5', labelCls: ph ? 'k-tick' : 'k-num' }),
      text(ph ? 296 : 100, ph ? 166 : Hh.y1 + 40, 'h = 0.5, 0.5', { cls: 'k-num' }),
      ph ? line(16, 188, 344, 188, { cls: 'k-grid' }) : line(250, 40, 250, 340, { cls: 'k-grid' }),
      text(P.x0, P.y0 - 40, ph ? 'the tone through it' : 'the 1,000 Hz tone through it', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: range(0, 8).map(n => [n, n ? String(n) : 'n = 0']) }),
      k.curve(P, t => cosd(45 * t), { cls: 'k-curve-input l2-tone', from: 0 }),
      stems(P, range(0, 8).map(n => [n, y(n)]), { dot: 4.5 }),
      g({}, range(0, 8).map(n => circle(P.X(n), P.Y(tone(n)), 3.5, { cls: 'k-stem-input-dot' }))),
      circle(P.X(0), P.Y(0.5), 9, { cls: 'k-ring-missing' }),
      path(`M${P.X(0) + 9} ${P.Y(0.5)}H${lead}V${P.y0 - 12}`, { cls: 'k-guide' }),
      text(lead + 4, P.y0 - 14, '(1.000 + 0) / 2 = 0.500', { anchor: 'start', cls: 'k-num-accent', style: ph ? 'font-size:10.5px' : 'font-size:12px' }),
      ph ? key(40, 528, items, { cols: 1 }) : key(300, 352, items, { cols: 1 }),
      text(ph ? 40 : 300, ph ? 584 : 404, 'out: the same tone, half a sample late and a little quieter,', { anchor: 'start', cls: 'k-note', style: ph ? 'font-size:14px' : 'font-size:15px' }),
      text(ph ? 40 : 300, ph ? 602 : 422, ph ? 'since two samples 45° apart average to' : 'since two samples 45° apart average to cos 22.5° = 0.92 of the size', { anchor: 'start', cls: 'k-note', style: ph ? 'font-size:14px' : 'font-size:15px' }),
      ph ? text(40, 620, 'cos 22.5° = 0.92 of the size', { anchor: 'start', cls: 'k-note', style: 'font-size:14px' }) : '',
    ];
  };

  const boosterFails = L => {
    const ph = L.phone;
    const row = (y0, size, ys, out, label) => {
      const A = ph ? plot({ x: 16, y: y0, w: 64, h: 80, xs: [-1.5, 1.5], ys }) : plot({ x: 60, y: y0, w: 120, h: 90, xs: [-2.5, 2.5], ys });
      const bx = ph ? [100, y0 + 18, 108, 48] : [228, y0 + 22, 160, 52];
      const cy = bx[1] + bx[3] / 2, Bx = ph ? 228 : 440;
      return g({},
        text(ph ? 16 : 60, y0 - 18, label, { anchor: 'start', cls: 'k-name' }),
        axes(A, { xTicks: [[0, 'n = 0']], zero: false }),
        arrow(L.slug, [[A.x1 + 4, cy], [bx[0] - 4, cy]]), arrow(L.slug, [[bx[0] + bx[2] + 4, cy], [Bx - 4, cy]]),
        box(...bx, { name: 'old booster', sub: '× 4, clip at 1' }),
        stems(A, [[0, size]], { cls: 'k-stem-input', dot: 5, labels: () => f1(size), labelCls: 'k-num-input' }),
        out);
    };
    const r1 = 80, r2 = ph ? 292 : 256;
    const mk = (y, ys) => ph ? plot({ x: 228, y, w: 116, h: 80, xs: [-1.5, 1.5], ys }) : plot({ x: 440, y, w: 160, h: 90, xs: [-2.5, 2.5], ys });
    const B1 = mk(r1, [0, 1.25]), B2 = mk(r2, [0, 1.25]);
    const gapX = B2.X(0) + (ph ? 20 : 28);
    return [
      text(ph ? 16 : 60, 20, ph ? 'lesson 1’s booster before the fix' : 'the booster from lesson 1, before the fix', { anchor: 'start', cls: 'k-note' }),
      row(r1, 1, [0, 1.25], g({}, axes(B1, { xTicks: [[0, 'n = 0']], zero: false }), stems(B1, [[0, 1]], { dot: 5, labels: () => '1.0' }),
        text(ph ? 180 : B1.X(0), B1.y1 + (ph ? 40 : 38), '4 × 1 = 4, clipped to 1.0', { anchor: 'middle', cls: 'k-tick' })), 'a click of 1'),
      row(r2, 0.1, [0, 1.25], g({}, axes(B2, { xTicks: [[0, 'n = 0']], zero: false }),
        guess({ ...B2, X: n => B2.X(n) - 8 }, [[0, 0.1]], 4),
        stems({ ...B2, X: n => B2.X(n) + 8 }, [[0, 0.4]], { dot: 5 }),
        text(B2.X(0) - 16, B2.Y(0.1) - 4, ph ? '0.1' : 'predicted 0.1', { anchor: 'end', cls: 'k-tick' }),
        text(B2.X(0) + 14, B2.Y(0.4) - 8, 'real 0.4', { anchor: 'middle', cls: 'k-num' }),
        line(gapX, B2.Y(0.1), gapX, B2.Y(0.4), { cls: 'k-stem-accent' }),
        line(gapX - 4, B2.Y(0.1), gapX + 4, B2.Y(0.1), { cls: 'k-stem-accent' }), line(gapX - 4, B2.Y(0.4), gapX + 4, B2.Y(0.4), { cls: 'k-stem-accent' }),
        text(ph ? 344 : gapX + 12, ph ? B2.y0 + 6 : B2.Y(0.25) + 6, '4 times off', { anchor: ph ? 'end' : 'start', cls: 'k-note-accent' }),
        text(ph ? 180 : B2.X(0), B2.y1 + (ph ? 40 : 38), 'predicted from the top row: 0.1 × 1.0 = 0.1', { anchor: 'middle', cls: 'k-tick' })), 'a click of 0.1'),
      ph ? key(16, 470, [['guess', 'convolution predicts 0.1'], ['ink', 'the booster gives 0.4']], { cols: 1 })
        : key(60, 410, [['guess', 'what convolution predicts: 0.1'], ['ink', 'what the booster gives: 0.4']], { dx: 300 }),
    ];
  };

  const pileOfClicks = L => {
    const ph = L.phone;
    const bx = ph ? 16 : 160, bw = ph ? 328 : 360, bh = 60, gapY = ph ? 54 : 52, y0 = ph ? 20 : 24;
    const ys = range(0, 3).map(i => y0 + i * (bh + gapY));
    const cx = bx + bw / 2;
    const B = [
      ['a pile of clicks', `x[n] = Σ x[k] δ[n ${M} k]`],
      ['T takes one click at a time', `y[n] = Σ x[k] T{δ[n ${M} k]}`],
      ['each click gives a copy of h', `T{δ[n ${M} k]} = h[n ${M} k]`],
      ['convolution', `y[n] = Σ x[k] h[n ${M} k] = x * h`],
    ];
    const labels = ph ? ['T is linear', 'T is time-invariant', 'add the copies'] : ['because T is linear', 'because T is time-invariant', 'add the copies'];
    const mid = i => ys[i] + bh + gapY / 2;
    return [
      range(0, 2).map(i => arrow(L.slug, [[cx, ys[i] + bh + 4], [cx, ys[i + 1] - 4]])),
      labels.map((s, i) => text(cx + 12, mid(i) + 4, s, { anchor: 'start', cls: 'k-label', style: ph ? 'font-size:11px' : undefined })),
      B.map(([n, s], i) => box(bx, ys[i], bw, bh, { name: n, sub: s, cls: i === 3 ? 'k-box-accent' : 'k-box' })),
      cross(ph ? cx - 116 : cx + 170, mid(0)),
      text(ph ? cx - 102 : cx + 184, mid(0) - 2, ph ? 'the old clipping' : 'the old clipping booster', { anchor: 'start', cls: 'k-num-accent', style: ph ? 'font-size:11px' : undefined }),
      text(ph ? cx - 102 : cx + 184, mid(0) + 14, ph ? 'booster is not' : 'is not', { anchor: 'start', cls: 'k-num-accent', style: ph ? 'font-size:11px' : undefined }),
      ph ? '' : text(bx - 16, ys[0] + bh / 2 + 6, 'x in', { anchor: 'end', cls: 'k-note' }),
      ph ? '' : text(bx - 16, ys[3] + bh / 2 + 6, 'y out', { anchor: 'end', cls: 'k-note' }),
    ];
  };

  const twoReadings = L => {
    const ph = L.phone;
    const parts = [[2000, 2005]], rh = 52, ys = [-0.42, 0.42];
    const panel = (x, w, top, title, rowsIn, pitch, sumY) => {
      const out = [text(x, top - 38, title, { anchor: 'start', cls: 'k-name', style: ph ? 'font-size:14px' : undefined })];
      rowsIn.forEach(([name, pts], i) => {
        const P = broken({ x, y: top + i * pitch, w, h: rh, parts, ys });
        const all = range(2000, 2005).map(n => [n, (pts.find(([m]) => m === n) || [n, 0])[1]]);
        out.push(baxis(P), text(x, P.y0 - 18, name, { anchor: 'start', cls: 'k-tick' }),
          stems(P, all.filter(([, v]) => Math.abs(v) > 1e-9), { dot: 3.5 }), zeros(P, all.filter(([, v]) => Math.abs(v) <= 1e-9).map(([n]) => n)),
          vals(P, all, f2, 'k-tick', 10));
      });
      const S = broken({ x, y: sumY, w, h: rh, parts, ys });
      const sum = ECHO.slice(0, 5).map((v, i) => [2000 + i, v]);
      out.push(baxis(S, [[2000, '2,000'], [2002, '2,002'], [2004, '2,004']]), text(x, S.y0 - 18, 'sum', { anchor: 'start', cls: 'k-name-accent' }),
        stems(S, sum, { cls: 'k-stem-accent', dot: 4.5 }), zeros(S, [2005]), vals(S, sum, f2, 'k-num-accent', ph ? 11 : undefined));
      return g({}, out);
    };
    const leftRows = range(0, 3).map(i => [`h × ${f1(HI[i])}, from ${big(String(2000 + i))}`, [[2000 + i, 0.4 * HI[i]], [2001 + i, 0.2 * HI[i]]]]);
    const rightRows = [[`“hi” × 0.4, from 2,000`, HI.map((v, i) => [2000 + i, 0.4 * v])], [`“hi” × 0.2, from 2,001`, HI.map((v, i) => [2001 + i, 0.2 * v])]];
    if (ph) return [
      panel(24, 320, 60, 'four copies of h, one per word sample', leftRows, 104, 60 + 4 * 104 + 10),
      line(20, 574, 340, 574, { cls: 'k-grid' }),
      panel(24, 320, 634, 'two copies of the word, one per h sample', rightRows, 104, 634 + 2 * 104 + 10),
      text(180, 948, 'x * h = h * x', { cls: 'k-math', style: 'font-size:22px' }),
    ];
    const sumY = 60 + 4 * 104 + 10;
    return [
      panel(24, 310, 60, 'four copies of h, one per word sample', leftRows, 104, sumY),
      line(360, 30, 360, sumY + rh + 30, { cls: 'k-grid' }),
      panel(390, 310, 60, 'two copies of the word, one per h sample', rightRows, 104, sumY),
      text(360, sumY + rh + 60, 'x * h = h * x', { cls: 'k-math', style: 'font-size:22px' }),
    ];
  };

  const canceller = L => {
    const ph = L.phone;
    const dot = (x, y, cls = 'k-stem-input-dot') => circle(x, y, 6, { cls });
    const travel = (from, to, d, len, cls) => g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d, len: len + 0.2 } },
      g({ anim: { k: 'move', dx: from[0] - to[0], dy: from[1] - to[1], d, len } }, dot(to[0], to[1], cls)));
    if (ph) {
      return [
        arrow(L.slug, [[78, 64], [78, 192]]),
        arrow(L.slug, [[78, 100], [257, 100], [257, 120]]),
        arrow(L.slug, [[180, 270], [148, 270]]),
        arrow(L.slug, [[148, 238], [180, 238]]),
        arrow(L.slug, [[78, 300], [78, 386]], { tone: 'accent' }),
        arrow(L.slug, [[336, 184], [336, 400], [94, 400]]),
        arrow(L.slug, [[78, 414], [78, 456]]),
        text(88, 160, 'x', { anchor: 'start', cls: 'k-label', style: 'font-size:11px' }),
        text(88, 336, 'far voice', { anchor: 'start', cls: 'k-label', style: 'font-size:11px' }), text(88, 350, '+ echo x * h', { anchor: 'start', cls: 'k-num-accent', style: 'font-size:11px' }),
        text(326, 336, 'guess x * h', { anchor: 'end', cls: 'k-label', style: 'font-size:11px' }),
        text(164, 228, 'copper', { cls: 'k-tick', style: 'font-size:9.5px' }),
        box(16, 16, 124, 48, { name: 'caller', sub: 'x' }),
        box(170, 120, 174, 64, { name: 'canceller', sub: ' ' }), text(257, 164, '0.4·x[n−2000]', { cls: 'k-tick' }), text(257, 178, '+ 0.2·x[n−2001]', { cls: 'k-tick' }),
        box(16, 196, 128, 104, { name: 'the box', sub: 'echo path h', cls: 'k-box-accent' }),
        box(184, 230, 132, 48, { name: 'far person' }),
        circle(78, 400, 13, { cls: 'k-box' }), text(78, 407, '−', { cls: 'k-name', style: 'font-size:22px' }),
        text(98, 428, 'far voice + echo − guess', { anchor: 'start', cls: 'k-num-accent', style: 'font-size:11px' }), text(98, 442, '= far voice', { anchor: 'start', cls: 'k-num-accent', style: 'font-size:11px' }),
        box(16, 460, 140, 52, { name: 'earpiece', sub: 'far voice only' }),
        step(1, 'the word leaves the caller for the box', travel([78, 68], [78, 188], 0.4, 1.4)),
        step(2, 'a copy runs along the wire to the canceller', travel([90, 100], [250, 100], 0.6, 1.2)),
        step(3, 'the echo comes back down the line while the guess comes down to the minus sign',
          travel([78, 304], [78, 382], 3.0, 1.4, 'k-stem-accent-dot'), travel([336, 188], [336, 392], 2.0, 1.4)),
        step(4, 'the guess turns along the wire into the minus sign', travel([328, 400], [96, 400], 3.4, 1.0)),
        step(5, 'echo and guess cancel; only the far voice reaches the earpiece', travel([78, 418], [78, 452], 4.6, 1.0, 'k-stem-dot')),
      ];
    }
    const top = 80, ret = 280;
    return [
      arrow(L.slug, [[124, top], [452, top]]),
      arrow(L.slug, [[164, top], [164, 182], [196, 182]]),
      arrow(L.slug, [[612, 70], [576, 70]]),
      arrow(L.slug, [[576, 94], [612, 94]]),
      arrow(L.slug, [[284, 210], [284, ret - 16]]),
      arrow(L.slug, [[514, 108], [514, ret], [300, ret]], { tone: 'accent' }),
      arrow(L.slug, [[268, ret], [148, ret]]),
      text(300, top - 10, 'your voice x goes out', { cls: 'k-label' }),
      text(526, 200, 'far voice', { anchor: 'start', cls: 'k-label' }), text(526, 216, '+ echo x * h', { anchor: 'start', cls: 'k-num-accent' }),
      text(296, 244, 'guess x * h', { anchor: 'start', cls: 'k-label' }),
      text(594, 86, 'copper', { cls: 'k-tick', style: 'font-size:9px' }),
      text(214, ret + 40, 'far voice + echo − guess', { cls: 'k-num-accent' }), text(214, ret + 56, '= far voice', { cls: 'k-num-accent' }),
      box(20, 56, 104, 48, { name: 'caller', sub: 'x' }),
      box(196, 158, 232, 52, { name: 'canceller', sub: '0.4·x[n−2000] + 0.2·x[n−2001]' }),
      box(456, 52, 120, 56, { name: 'the box', sub: 'echo path h', cls: 'k-box-accent' }),
      box(612, 56, 96, 48, { name: 'far person' }),
      box(20, 254, 128, 52, { name: 'earpiece', sub: 'far voice only' }),
      circle(284, ret, 14, { cls: 'k-box' }), text(284, ret + 7, '−', { cls: 'k-name', style: 'font-size:22px' }),
      step(1, 'the word leaves the caller and goes out to the box', travel([130, top], [448, top], 0.4, 1.4)),
      step(2, 'a copy of the word runs down the wire to the canceller', travel([164, 86], [164, 178], 0.6, 1.0)),
      step(3, 'the echo returns from the box while the guess heads for the minus sign',
        travel([514, 112], [514, ret - 6], 2.0, 1.2, 'k-stem-accent-dot'), travel([284, 214], [284, ret - 20], 3.0, 1.2)),
      step(4, 'the echo turns along the wire into the minus sign', travel([508, ret], [304, ret], 3.2, 1.0, 'k-stem-accent-dot')),
      step(5, 'echo and guess cancel; only the far voice passes on to the earpiece', travel([264, ret], [152, ret], 4.4, 1.0, 'k-stem-dot')),
    ];
  };

  const offByOne = L => {
    const ph = L.phone;
    const ns = range(2000, 2005), w = ph ? 300 : 560, x = ph ? 40 : 80;
    const rows = [['the echo', n => ECHO[n - 2000] ?? 0, 'ink'], ['the guess, one sample late', n => ECHO[n - 2001] ?? 0, 'guess'], ['what is left = echo − guess', n => (ECHO[n - 2000] ?? 0) - (ECHO[n - 2001] ?? 0), 'accent']];
    const pitch = ph ? 150 : 146, top = ph ? 48 : 44;
    return [
      rows.map(([name, fn, kind], r) => {
        const P = broken({ x, y: top + r * pitch, w, h: 112, parts: [[2000, 2005]], ys: [-0.55, 0.55] });
        const pts = ns.map(n => [n, fn(n)]);
        const nz = pts.filter(([, v]) => Math.abs(v) > 1e-9), z = pts.filter(([, v]) => Math.abs(v) <= 1e-9).map(([n]) => n);
        const mark = kind === 'guess' ? guess(P, nz) : stems(P, nz, { cls: kind === 'accent' ? 'k-stem-accent' : 'k-stem', dot: 4 });
        return g({},
          baxis(P, r === 2 ? ns.map(n => [n, big(String(n))]) : [], { at: P.y1 + 30, small: ph }),
          text(x, P.y0 - 12, name, { anchor: 'start', cls: kind === 'accent' ? 'k-num-accent' : 'k-label', style: ph ? 'font-size:11px' : undefined }),
          mark, zeros(P, z), vals(P, pts, f2, kind === 'accent' ? 'k-num-accent' : 'k-tick', ph ? 10 : 11));
      }),
      text(ph ? 180 : 360, top + 3 * pitch + 30, 'echo meter: 133%', { cls: 'k-name-accent' }),
      text(ph ? 180 : 360, top + 3 * pitch + 54, ph ? 'sum of squares of what is left,' : 'echo meter = sum of squares of what is left ÷ sum of squares of the echo', { cls: 'k-tick' }),
      ph ? text(180, top + 3 * pitch + 70, 'divided by the same for the echo', { cls: 'k-tick' }) : '',
      text(ph ? 180 : 360, top + 3 * pitch + (ph ? 90 : 76), 'over 100% means worse than no canceller at all', { cls: 'k-tick' }),
    ];
  };

  const slipTones = L => {
    const ph = L.phone;
    const C = plot({ x: ph ? 64 : 140, y: 50, w: ph ? 272 : 440, h: 180, xs: [0, 4], ys: [0, 4] });
    const data = [[300, 0.0553, '5.5%'], [1000, 0.5858, '59%'], [2000, 2, '200%'], [3400, 3.782, '378%']];
    return [
      axes(C, { zero: false, yTicks: [[0, '0%'], [1, '100%'], [2, '200%'], [4, '400%']], xTicks: data.map(([f], i) => [i + 0.5, `${big(String(f))} Hz`]) }),
      line(C.x0, C.Y(1), C.x1, C.Y(1), { cls: 'k-guide' }),
      ph ? text(C.x0 + 4, C.Y(1) - 8, 'no canceller', { anchor: 'start', cls: 'k-tick' }) : text(C.x1 + 8, C.Y(1) + 4, 'no canceller', { anchor: 'start', cls: 'k-tick' }),
      ph ? text(C.x0 + 4, C.Y(3.7), 'above the dashed line:', { anchor: 'start', cls: 'k-tick' }) : text(C.x1 + 8, C.Y(1) - 28, 'above the line:', { anchor: 'start', cls: 'k-tick' }),
      ph ? text(C.x0 + 4, C.Y(3.7) + 14, 'worse than none', { anchor: 'start', cls: 'k-tick' }) : text(C.x1 + 8, C.Y(1) - 14, 'worse than none', { anchor: 'start', cls: 'k-tick' }),
      bars(C, data.map(([, v, label], i) => ({ x: i + 0.5, v, label, cls: 'k-bar' })), { width: ph ? 30 : 48, labelCls: 'k-num' }),
      text(ph ? 180 : 360, 290, ph ? 'echo meter after a one-sample slip' : 'echo meter after a one-sample slip, for steady tones', { cls: 'k-label' }),
    ];
  };

  const pointwise = L => {
    const ph = L.phone;
    const parts = [[0, 3], [2000, 2001]];
    const mk = y => ph ? broken({ x: 104, y, w: 240, h: 56, parts, gap: 30, widths: [140, 70], ys: [-0.9, 0.9] })
      : broken({ x: 120, y, w: 330, h: 60, parts, gap: 40, widths: [190, 100], ys: [-0.9, 0.9] });
    const X = mk(ph ? 40 : 40), Hh = mk(ph ? 138 : 140);
    const ns = [0, 1, 2, 3, 2000, 2001];
    const prodY = ph ? 236 : 246;
    const fs = ph ? 'font-size:11px' : undefined;
    const S = ph ? broken({ x: 40, y: 410, w: 300, h: 60, parts: [[2000, 2005]], ys: [-0.9, 0.9] }) : broken({ x: 490, y: 110, w: 220, h: 60, parts: [[2000, 2005]], ys: [-0.9, 0.9] });
    const sum = ECHO.slice(0, 5).map((v, i) => [2000 + i, v]);
    const hpts = [[2000, 0.4], [2001, 0.2]], xpts = HI.map((v, n) => [n, v]);
    return [
      baxis(X), baxis(Hh, ph ? [0, 1, 2, 3].map(n => [n, String(n)]) : ns.map(n => [n, big(String(n))]), { small: true }),
      ph ? g({}, text(Hh.X(2000), Hh.y1 + 16, '2,000', { cls: 'k-tick', style: 'font-size:10px' }), text(Hh.X(2001), Hh.y1 + 28, '2,001', { cls: 'k-tick', style: 'font-size:10px' })) : '',
      text(X.x0 - 12, X.Y(0) + 5, 'x[n]', { anchor: 'end', cls: 'k-math' }), text(Hh.x0 - 12, Hh.Y(0) + 5, 'h[n]', { anchor: 'end', cls: 'k-math' }),
      stems(X, xpts, { cls: 'k-stem-input', dot: 4 }), vals(X, xpts, f1, 'k-num-input', 10), zeros(X, [2000, 2001]),
      stems(Hh, hpts, { dot: 4 }), vals(Hh, hpts, f1, 'k-tick', 10), zeros(Hh, [0, 1, 2, 3]),
      text(X.x0 - 12, prodY + 4, 'x[n] × h[n]', { anchor: 'end', cls: 'k-label', style: ph ? 'font-size:10.5px' : undefined }),
      ns.map(n => g({}, rect(X.X(n) - (ph ? 12 : 16), prodY - 14, ph ? 24 : 32, 24, { cls: 'l2-chip', rx: 4 }), text(X.X(n), prodY + 3, '0', { cls: 'k-num', style: fs }))),
      cross(X.x0 + 4, prodY + 46), text(X.x0 + 18, prodY + 50, ph ? 'predicts no echo' : 'x[n] × h[n] predicts no echo', { anchor: 'start', cls: 'k-note' }),
      ph ? line(20, 350, 340, 350, { cls: 'k-grid' }) : line(470, 30, 470, 310, { cls: 'k-grid' }),
      text(S.x0, S.y0 - 26, ph ? 'x * h, the copies: the real echo' : 'x * h: the real echo', { anchor: 'start', cls: 'k-name' }),
      text(S.x0, S.y0 - 10, 'same vertical scale as x and h', { anchor: 'start', cls: 'k-tick', style: 'font-size:10px' }),
      baxis(S, [[2000, '2,000'], [2004, '2,004']]), stems(S, sum, { cls: 'k-stem-accent', dot: 4 }), zeros(S, [2005]), sum.map(([n, v], i) => text(S.X(n), v >= 0 ? S.Y(v) - 9 : S.Y(v) + 18 + (i % 2 ? 0 : 10), f2(v), { cls: 'k-num-accent', style: 'font-size:10px' })),
      check(S.x0 + 6, S.y1 + 50), text(S.x0 + 20, S.y1 + 54, ph ? 'five samples of echo' : 'five samples of echo', { anchor: 'start', cls: 'k-label' }),
    ];
  };

  const css = '.k-fig .l2-col { fill: var(--accent-soft); opacity: 0.55; } .k-fig .l2-tone { opacity: 0.4; } .k-fig .k-mark-ok { stroke: var(--ink); } @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .k-fig .l2-col { fill: var(--accent); opacity: 0.22; } :root:not([data-theme="light"]) .k-fig .l2-tone { opacity: 0.7; } } :root[data-theme="dark"] .k-fig .l2-col { fill: var(--accent); opacity: 0.22; } :root[data-theme="dark"] .k-fig .l2-tone { opacity: 0.7; } .k-fig .l2-guess { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 3 3; } .k-fig .l2-guess-dot { fill: var(--ink-soft); } .k-fig .l2-chip { fill: var(--paper-2); } .k-fig .l2-badge { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.2; }';
  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, eyebrow: 'Lesson 2 · impulse response and convolution', css, body: (kk, L) => body(L) });

  return [
    fig('the-line', [250, 552], 'Where the echo is made',
      'The caller and your equipment on the left, the digital line running right to a box on a street corner, then copper wire to the far person; the caller’s voice goes out, the far voice comes back, and the box leaks some of the caller’s voice back toward them, 2,000 samples later.',
      'Who talks, who hears, and where the echo is made: the box on the street corner leaks part of the caller’s voice back down the line.', theLine),
    fig('impulse', [332, 356], 'The impulse, moved and scaled',
      `Three rows of samples: δ[n] is 1 at n = 0 and 0 elsewhere; δ[n ${M} 3] is the same click at n = 3; 0.8 δ[n] is the click scaled to 0.8.`,
      `Top: the impulse δ[n]. Middle: δ[n ${M} 3], the same click 3 samples later. Bottom: 0.8 δ[n], the same click scaled. Small hollow circles are samples that are 0.`, impulse),
    fig('impulse-response', [290, 470], 'One click in, h out',
      'A click of size 1 enters the sealed box, the echo path; what comes out is 2,000 silent samples, n = 0 to 1,999, a quarter of a second, then 0.4 and 0.2, then silence.',
      'The click goes into the box you cannot open. What comes back is the impulse response: 2,000 zeros, then 0.4 and 0.2.', impulseResponse, 4),
    fig('word-as-clicks', [450, 500], 'A word is four clicks',
      `The word “hi”, 0.8, 0.4, ${M}0.6, ${M}0.2, comes apart into four clicks, each on its own row at its own size and place, drawn to the same scale as the word, and the four added together give the word back.`,
      'Each sample of the word is a click of its own size at its own place. Add the four rows and you get the word back.', wordAsClicks, 4),
    fig('copies', [470, 660], 'Each click launches a copy of h',
      `Under each click of the word, a copy of h scaled by the click and starting 2,000 samples after it; the four copies add into the echo 0.32, 0.32, ${M}0.16, ${M}0.20, ${M}0.04, with two copies landing on each of n = 2,001, 2,002 and 2,003.`,
      'Each click launches a two-bar copy of h, scaled by the click and shifted to start 2,000 samples after it. Add the copies column by column and you get the echo.', copies, 5),
    fig('convolution-rule', [340, 470], 'The convolution sum, piece by piece',
      `y[n] = Σ over k of x[k] h[n ${M} k], with numbered badges tying each piece to the loop code: Σ is the two loops, x[k] is x[k], h[n ${M} k] is h[m] because m = n ${M} k, and y[n] is y[k + m] because n = k + m.`,
      'The same badge number marks the same piece in the formula and in the code. In the formula, x * h names the whole loop, not a product.', rule),
    fig('flip-slide', [400, 490], 'Flip h, slide it, multiply, add',
      `h, 0.4 then 0.2, is written backwards as 0.2, 0.4 and slid along the word one step at a time: at n = 2,000 the products add to 0.32, at 2,001 to 0.32, and at 2,002 to 0.08 + (${M}0.24) = ${M}0.16.`,
      'One output sample at a time: flip h, slide it under the word, multiply each pair, add. Each row is one more step to the right.', flipSlide, 4),
    fig('smoother-response', [440, 640], 'The smoother, unmasked',
      `A click into the smoother returns 0.5, 0.5. Convolved with the 1,000 Hz tone, it gives 0.500, 0.854, 0.354, ${M}0.354 and so on, with the first output at n = 0 equal to (1.000 + 0) / 2.`,
      'First, the smoother’s impulse response: 0.5 and 0.5. Then the tone (dots on a faint curve) and its convolution with 0.5, 0.5 (solid stems). The circled first output is the one lesson 1 left blank.', smootherResponse),
    fig('booster-fails', [430, 520], 'The clipping booster breaks the rule',
      'Lesson 1’s booster before the fix, times 4 then clip: a click of 1 gives 1.0 (4, clipped). For a click of 0.1, convolution predicts 0.1 but the booster gives 0.4: four times off.',
      'The old booster’s answer to one click does not predict its answer to another. It is not linear, so convolution does not apply.', boosterFails),
    fig('pile-of-clicks', [430, 470], 'Why one click is enough',
      'A chain of four boxes: the signal as a pile of clicks; because T is linear it takes one click at a time, which the booster fails; because T is time-invariant each click gives a copy of h; adding the copies gives x * h.',
      'The derivation as a chain. Each arrow names the property it uses.', pileOfClicks),
    fig('two-readings', [630, 970], 'Two ways to build the same echo',
      `Left: four copies of h, one per sample of the word. Right: two copies of the word, scaled by 0.4 from 2,000 and by 0.2 from 2,001. Both sums read 0.32, 0.32, ${M}0.16, ${M}0.20, ${M}0.04.`,
      'Four copies of h, or two copies of the word: the same echo either way, because x * h = h * x.', twoReadings),
    fig('canceller', [350, 530], 'The echo canceller',
      'The caller’s voice x splits at your equipment: one branch goes to the box and comes back as the echo, on top of the far voice; the other runs through the canceller, 0.4 times the voice 2,000 samples back plus 0.2 times it 2,001 back, and meets the incoming line at a minus sign, where echo minus guess is 0, so the earpiece gets the far voice only.',
      'Follow a word along both paths. The echo and the canceller’s guess reach the minus sign together and cancel, and the far voice passes on.', canceller, 5),
    fig('off-by-one', [580, 620], 'A one-sample slip on “hi”',
      `With the guess one sample late, “hi” leaves 0.32, 0, ${M}0.48, ${M}0.04, 0.16, 0.04: the echo meter, the sum of squares of what is left divided by that of the echo, reads 133%.`,
      'The echo, the guess one sample late (dashed), and what is left. On “hi” the leftover is bigger than the echo itself.', offByOne),
    fig('slip-tones', [310, 310], 'A one-sample slip, tone by tone',
      'For steady tones, a one-sample slip leaves 5.5% of the echo at 300 Hz, 59% at 1,000 Hz, 200% at 2,000 Hz and 378% at 3,400 Hz; above 100% is worse than no canceller.',
      'The higher the pitch, the more a one-sample slip costs. Above the dashed line, the canceller makes the echo worse.', slipTones),
    fig('pointwise', [340, 580], 'Multiplying sample by sample predicts nothing',
      'The word lives at n = 0 to 3 and h at 2,000 and 2,001; multiplied sample by sample, every product is 0, so x[n] × h[n] predicts no echo, while the copies give the real echo of five samples.',
      'x[n] × h[n] has a zero in every product. Convolution launches a copy of h from every sample instead, and that is the echo.', pointwise),
  ];
};
