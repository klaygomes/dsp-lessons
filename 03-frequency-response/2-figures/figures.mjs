export default k => {
  const { g, line, path, rect, circle, text, plot, axes, stems, legend, step, fmt, hz, cosd, sind, range } = k;
  const M = '−';
  const H = [0.15, 0.7, 0.15];
  const gain = f => 0.7 + 0.3 * cosd(360 * f / 8000);
  const turnOf = f => 360 * f / 8000;
  const pt = (cx, cy, R, a) => [cx + R * cosd(a), cy - R * sind(a)];
  const r2 = v => Math.round(v * 100) / 100;
  const arcD = (cx, cy, r, a0, a1) => {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `M${r2(x0)} ${r2(y0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${r2(x1)} ${r2(y1)}`;
  };
  const wedge = (cx, cy, r, a0, a1, o = {}) => {
    const [x0, y0] = pt(cx, cy, r, a0);
    return path(`M${cx} ${cy}L${r2(x0)} ${r2(y0)}${arcD(cx, cy, r, a0, a1).replace(/^M[^A]+/, '')}Z`, { cls: 'k-wedge', ...o });
  };
  const head = (x1, y1, x2, y2, len, half) => {
    const d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const bx = x2 - ux * len, by = y2 - uy * len;
    return { bx, by, pts: `${r2(x2)},${r2(y2)} ${r2(bx - uy * half)},${r2(by + ux * half)} ${r2(bx + uy * half)},${r2(by - ux * half)}` };
  };
  const vec = (slug, x1, y1, x2, y2, accent = false, o = {}) => {
    const h = head(x1, y1, x2, y2, accent ? 8 : 7, accent ? 3.5 : 3);
    return g({}, line(x1, y1, h.bx, h.by, { cls: accent ? 'k-vec-sum' : 'k-vec-thin', ...o }), `<polygon class="${accent ? 'k-tip-accent' : 'k-tip'}" points="${h.pts}"/>`);
  };
  const vecLocal = (len) => vec('', 0, 0, len, 0);
  const chainPts = (ox, oy, s, w) => {
    let x = ox, y = oy; const out = [[x, y]];
    H.forEach((hk, kk) => { x += s * hk * cosd(-w * kk); y -= s * hk * sind(-w * kk); out.push([x, y]); });
    return out;
  };
  const turnAnim = (count, stepDeg, cx, cy, o = {}) => ({ anim: { k: 'turn', r0: `${(count - 1) * stepDeg}deg`, steps: count, d: 0, len: count, ...o }, style: `transform-origin:${r2(cx)}px ${r2(cy)}px` });

  const click = (L) => {
    const ph = L.phone, xs = [-0.5, 4.5], ys = [0, 1.15];
    const A = ph ? plot({ x: 60, y: 60, w: 260, h: 100, xs, ys }) : plot({ x: 50, y: 70, w: 210, h: 130, xs, ys });
    const B = ph ? plot({ x: 60, y: 340, w: 260, h: 100, xs, ys }) : plot({ x: 470, y: 70, w: 210, h: 130, xs, ys });
    const ticks = range(0, 4).map(n => [n, n ? String(n) : 'n = 0']);
    return [
      ph ? g({}, arrow(L.slug, [[180, 196], [180, 214]]), arrow(L.slug, [[180, 262], [180, 280]]), k.box(120, 218, 120, 40, { name: 'the east route' }))
        : g({}, arrow(L.slug, [[270, A.Y(0) - 40], [306, A.Y(0) - 40]]), arrow(L.slug, [[424, A.Y(0) - 40], [460, A.Y(0) - 40]]), k.box(310, A.Y(0) - 64, 110, 48, { name: 'the east route' })),
      axes(A, { xTicks: ticks }), axes(B, { xTicks: ticks }),
      text(A.x0, A.y0 - 22, 'the click going in', { anchor: 'start', cls: 'k-name' }),
      text(B.x0, B.y0 - 22, 'what comes back', { anchor: 'start', cls: 'k-name' }),
      stems(A, [[0, 1]], { cls: 'k-stem-soft', labels: v => fmt(v) }), zeros(A, [1, 2, 3, 4]),
      stems(B, [[0, 0.15], [1, 0.7], [2, 0.15]], { labels: v => fmt(v) }), zeros(B, [3, 4]),
      text(ph ? 180 : 360, L.H - 14, ph ? 'smeared over three samples' : 'one sample of 1 goes in; it comes back smeared over three samples', { cls: 'k-note' }),
    ];
  };
  const zeros = (P, ns) => g({}, ns.map(n => circle(P.X(n), P.Y(0), 2, { cls: 'k-stop' })));

  const arrow = (slug, pts, o) => k.arrow(slug, pts, o);

  const convolution = (L) => {
    const ph = L.phone;
    const x = [0.2, 0.8, 1, 0.4, -0.6, -1, -0.4, 0.4];
    const xa = n => (n < 0 ? 0 : x[n]);
    const y = n => H[0] * xa(n) + H[1] * xa(n - 1) + H[2] * xa(n - 2);
    const xs = [-2.6, 7.6], last = 7, first = 0, moves = last - first;
    const A = plot({ x: ph ? 30 : 60, y: 84, w: ph ? 316 : 620, h: 90, xs, ys: [-1.15, 1.15] });
    const B = plot({ x: A.x0, y: ph ? 254 : 236, w: A.w, h: 90, xs, ys: [-1.15, 1.15] });
    const colW = A.X(1) - A.X(0);
    const win = g({},
      rect(A.X(last - 2) - colW * 0.48, A.y0 - 30, colW * 2.96, A.h + 30, { cls: 'k-window', rx: 4 }),
      ['0.15', '0.70', '0.15'].map((s, i) => text(A.X(last - 2 + i), A.y0 - 12, s, { cls: 'k-num', style: ph ? 'font-size:10px' : undefined })),
      line(A.X(last), A.y1 + 4, A.X(last), B.Y(0), { cls: 'k-guide' }));
    const terms = `0.15 × ${fmt(x[7])} + 0.70 × (${fmt(x[6])}) + 0.15 × (${fmt(x[5])})`;
    return [
      text(A.x0, 30, 'the three weights slide along the input', { anchor: 'start', cls: 'k-name' }),
      step(1, 'the window of weights 0.15, 0.70, 0.15 lands on each sample in turn, from n = 0 to n = 7',
        g({ anim: { k: 'move', dx: -moves * colW, d: 1, len: moves + 1 }, style: `animation-timing-function:steps(${moves + 1},jump-none)` }, win)),
      axes(A, { xTicks: [] }), stems(A, x.map((v, n) => [n, v]), { cls: 'k-stem-soft', dot: 4 }), zeros(A, [-2, -1]),
      text(A.X(-1.5), A.Y(0) - 10, 'silence', { cls: 'k-tick' }),
      text(A.x0 - 4, A.Y(0) + 4, 'in', { anchor: 'end', cls: 'k-label' }),
      axes(B, { xTicks: range(0, 7).map(n => [n, n ? String(n) : 'n = 0']) }),
      text(B.x0 - 4, B.Y(0) + 4, 'out', { anchor: 'end', cls: 'k-label' }),
      step(2, `each output sample appears the moment the window lands on it: ${range(first, last).map(n => fmt(y(n))).join(', ')}`,
        range(first, last).map((n, i) => g({ anim: { k: 'in', d: 1 + i, len: 0.15 } }, stems(B, [[n, y(n)]], { dot: 4.5, cls: n === last ? 'k-stem-accent' : 'k-stem' })))),
      step(3, `the sum for n = 7: ${terms} = ${fmt(y(7))}`,
        g({ anim: { k: 'in', d: moves + 2, len: 0.6 } },
          ph ? g({}, text(180, B.y1 + 42, 'out[7] = 0.15 × 0.40', { cls: 'k-num' }), text(180, B.y1 + 62, `+ 0.70 × (${M}0.40) + 0.15 × (${M}1.00)`, { cls: 'k-num' }), text(180, B.y1 + 84, `= ${fmt(y(7))}`, { cls: 'k-num-accent' }))
            : g({}, text(A.x0 + A.w / 2 - 30, B.y1 + 44, `out[7] = ${terms} =`, { cls: 'k-num' }), text(A.x0 + A.w / 2 + 184, B.y1 + 44, fmt(y(7)), { anchor: 'start', cls: 'k-num-accent' })))),
    ];
  };

  const toneInOut = (L) => {
    const ph = L.phone, slug = L.slug;
    const P = plot({ x: ph ? 44 : 70, y: 70, w: ph ? 296 : 580, h: 170, xs: [-0.5, 7.5], ys: [-1.15, 1.15] });
    const xin = n => [1, 0, -1, 0][n % 4], yout = n => 0.7 * xin(n + 3);
    const ns = range(0, 7), dx = 0.14;
    const items = [['stem-soft', '2,000 Hz in'], ['stem', 'route out']];
    const bx = P.X(5) + (P.X(1) - P.X(0)) * 0.42;
    return [
      axes(P, { yTicks: [[1, '1'], [-1, `${M}1`]], xTicks: ns.map(n => [n, n ? String(n) : 'n = 0']) }),
      line(P.x0, P.Y(0.7), P.x1, P.Y(0.7), { cls: 'k-guide' }),
      stems(P, ns.filter(n => xin(n)).map(n => [n - dx, xin(n)]), { cls: 'k-stem-soft', dot: 4.5 }),
      stems(P, ns.filter(n => yout(n)).map(n => [n + dx, yout(n)]), { dot: 5 }),
      zeros(P, ns.filter(n => !yout(n)).map(n => n + dx)), zeros(P, ns.filter(n => !xin(n)).map(n => n - dx)),
      vec(slug, P.X(-dx) + 7, P.Y(1) - 2, P.X(1 + dx) - 7, P.Y(0.7) - 6, true),
      text(P.X(1 + dx) + 10, P.Y(1) - 14, 'one sample later', { anchor: 'start', cls: 'k-note-accent' }),
      line(bx, P.Y(0), bx, P.Y(0.7), { cls: 'k-bracket' }),
      line(bx - 5, P.Y(0.7), bx + 5, P.Y(0.7), { cls: 'k-bracket' }), line(bx - 5, P.Y(0), bx + 5, P.Y(0), { cls: 'k-bracket' }),
      text(bx + 9, P.Y(0.35) + 4, '0.70', { anchor: 'start', cls: 'k-num-accent' }),
      ph ? legend(slug, 40, 300, items, { dx: 150 }) : legend(slug, 200, 286, items, { dx: 200 }),
    ];
  };

  const wheelFig = (L) => {
    const ph = L.phone;
    const tones = [0, 1000, 2000, 3000, 4000];
    const R = ph ? 34 : 44, rowH = ph ? 12 : 13;
    const cell = (f, cx, top) => {
      const t = turnOf(f), cy = top + R + 50, sTop = cy + R + 36;
      const uniq = f === 0 ? 1 : Math.round(360 / gcd(Math.round(t), 360));
      const out = [
        text(cx, top + 8, `${hz(f)} Hz`, { cls: 'k-name' }),
        line(cx - R - 8, cy, cx + R + 8, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
        range(0, Math.min(uniq, 8) - 1).map(n => {
          const [sx, sy] = pt(cx, cy, R, t * n), [lx, ly] = pt(cx, cy, R + 15, t * n);
          return g({}, circle(sx, sy, 2.6, { cls: 'k-stop' }), text(lx, ly + 4, String(n), { cls: 'k-tick', style: 'font-size:10px' }));
        }),
        line(cx, sTop - 6, cx, sTop + rowH * 7.5, { cls: 'k-axis' }),
        line(cx - R, sTop - 6, cx - R, sTop + rowH * 7.5, { cls: 'k-guide' }), line(cx + R, sTop - 6, cx + R, sTop + rowH * 7.5, { cls: 'k-guide' }),
        text(cx - R, sTop + rowH * 7.5 + 14, `${M}1`, { cls: 'k-tick', style: 'font-size:10px' }), text(cx + R, sTop + rowH * 7.5 + 14, '+1', { cls: 'k-tick', style: 'font-size:10px' }),
        text(cx - R - 6, sTop + 4, '0', { anchor: 'end', cls: 'k-tick', style: 'font-size:9px' }), text(cx - R - 6, sTop + 7 * rowH + 4, '7', { anchor: 'end', cls: 'k-tick', style: 'font-size:9px' }),
        text(cx, top + 26, `${t}° per sample`, { cls: 'k-tick' }),
      ];
      const dot = g(f ? turnAnim(8, t, cx, cy) : {}, line(cx, cy, ...pt(cx, cy, R, t * 7), { cls: 'k-spoke-line' }), circle(...pt(cx, cy, R, t * 7), 5, { cls: 'k-dot' }));
      const strip = range(0, 7).map(n => {
        const v = cosd(t * n), yy = sTop + n * rowH, xx = cx + R * v;
        return g({ anim: { k: 'in', d: n, len: 0.3 } }, line(cx, yy, xx, yy, { cls: 'k-hstem' }), circle(xx, yy, 2.8, { cls: 'k-stem-dot' }));
      });
      return { still: out, dot, strip };
    };
    const cells = tones.map((f, i) => {
      if (!ph) return cell(f, 72 + i * 144, 26);
      const row = i < 3 ? 0 : 1, col = row ? i - 3 : i;
      return cell(f, row ? 120 + col * 120 : 60 + col * 120, 24 + row * 330);
    });
    return [
      cells.map(c => c.still),
      step(1, 'each dot turns counter-clockwise by its tone’s turn, one step per sample', cells.map(c => c.dot)),
      step(2, 'its left-right position drops onto the strip below, one row per sample, n = 0 at the top', cells.map(c => c.strip)),
      ph ? text(180, L.H - 10, 'strips: time runs down, n = 0 to 7', { cls: 'k-tick' })
        : text(360, L.H - 10, 'under each wheel, time runs down: its left-right position at n = 0 to 7 is the tone’s samples', { cls: 'k-tick' }),
    ];
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  const phaseFig = (L) => {
    const ph = L.phone;
    const cx = ph ? 180 : 200, cy = ph ? 150 : 160, R = ph ? 100 : 112, r = R * 0.7;
    const count = 8, t = 90, inAt = 90, outAt = 0;
    const keyX = ph ? 24 : 380, keyY = ph ? 300 : 96;
    return [
      line(cx - R - 14, cy, cx + R + 14, cy, { cls: 'k-axis' }), line(cx, cy - R - 14, cx, cy + R + 14, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel-soft', fill: 'none' }), circle(cx, cy, r, { cls: 'k-wheel', fill: 'none' }),
      step(1, 'the input dot and the output dot turn together, 90 degrees per sample, with the 90 degree gap between them shaded',
        g(turnAnim(count, t, cx, cy),
          wedge(cx, cy, r - 6, outAt, inAt),
          line(cx, cy, ...pt(cx, cy, R, inAt), { cls: 'k-spoke-line' }), circle(...pt(cx, cy, R, inAt), 6.5, { cls: 'k-dot-in' }),
          line(cx, cy, ...pt(cx, cy, r, outAt), { cls: 'k-spoke-ink' }), circle(...pt(cx, cy, r, outAt), 6, { cls: 'k-dot-out' }),
          g({ anim: { k: 'turn', r0: `${-(count - 1) * t}deg`, steps: count, d: 0, len: count }, style: `transform-origin:${r2(pt(cx, cy, R + 22, inAt + 8)[0])}px ${r2(pt(cx, cy, R + 22, inAt + 8)[1])}px` }, text(...pt(cx, cy, R + 22, inAt + 8).map((v, i) => v + (i ? 4 : 0)), 'in', { cls: 'k-label' })),
          g({ anim: { k: 'turn', r0: `${-(count - 1) * t}deg`, steps: count, d: 0, len: count }, style: `transform-origin:${r2(pt(cx, cy, r - 22, outAt - 12)[0])}px ${r2(pt(cx, cy, r - 22, outAt - 12)[1])}px` }, text(...pt(cx, cy, r - 22, outAt - 12).map((v, i) => v + (i ? 4 : 0)), 'out', { cls: 'k-label' })))),
      step(2, 'the gap is the phase: 90 degrees, one sample behind',
        g({ anim: { k: 'in', d: count, len: 0.6 } },
          text(cx + 10, cy - 28, 'phase', { anchor: 'start', cls: 'k-note-accent' }),
          text(cx + 10, cy - 10, '90°', { anchor: 'start', cls: 'k-num-accent' }))),
      text(keyX, keyY, 'the 2,000 Hz tone, through the route', { anchor: 'start', cls: 'k-name' }),
      g({}, circle(keyX + 8, keyY + 30, 6.5, { cls: 'k-dot-in' }), text(keyX + 24, keyY + 34, 'in: size 1, on the dashed circle', { anchor: 'start', cls: 'k-label' })),
      g({}, circle(keyX + 8, keyY + 56, 6, { cls: 'k-dot-out' }), text(keyX + 24, keyY + 60, 'out: size 0.700', { anchor: 'start', cls: 'k-label' })),
      g({}, path(`M${keyX + 2} ${keyY + 90}L${keyX + 16} ${keyY + 90}A14 14 0 0 0 ${keyX + 2} ${keyY + 76}Z`, { cls: 'k-wedge' }), text(keyX + 24, keyY + 88, 'phase: how far out trails in', { anchor: 'start', cls: 'k-label' })),
      text(keyX, keyY + 122, ph ? 'both turn 90° per sample,' : 'both turn 90° per sample, so the gap', { anchor: 'start', cls: 'k-note' }),
      text(keyX, keyY + 144, ph ? 'so the gap never changes' : 'never changes', { anchor: 'start', cls: 'k-note' }),
    ];
  };

  const arrowsTurning = (L) => {
    const ph = L.phone, slug = L.slug;
    const cx = ph ? 180 : 170, cy = ph ? 150 : 190, R = ph ? 92 : 108;
    const ox = ph ? 160 : 520, oy = ph ? 462 : 190, s = ph ? 110 : 132;
    const count = 16, w = 45, len = count / 2;
    const spin = (x0, y0) => ({ anim: { k: 'turn', r0: `${(count - 1) * w}deg`, steps: count, d: 0, len }, style: `transform-origin:${r2(x0)}px ${r2(y0)}px` });
    const upright = (x0, y0) => ({ anim: { k: 'turn', r0: `${-(count - 1) * w}deg`, steps: count, d: 0, len }, style: `transform-origin:${r2(x0)}px ${r2(y0)}px` });
    const label = (x0, y0, s2, cls, anchor = 'middle') => g(upright(x0, y0), text(x0, y0 + 4, s2, { cls, anchor }));
    const frame = (rot, ghost) => {
      const dots = [0, -w, -2 * w].map(a => pt(cx, cy, R, a + rot));
      const pts = chainPts(ox, oy, s, w).map(([x, y]) => { const dx = x - ox, dy = y - oy, c = cosd(rot), sn = sind(rot); return [ox + dx * c + dy * sn, oy - dx * sn + dy * c]; });
      return { dots, pts };
    };
    const now = frame(0), next = frame(w);
    const wheelBody = g({},
      line(cx, cy, ...now.dots[0], { cls: 'k-spoke-line' }), line(cx, cy, ...now.dots[1], { cls: 'k-spoke-line' }),
      path(arcD(cx, cy, 34, -w, 0), { cls: 'k-arc-soft' }),
      circle(...now.dots[0], 6.5, { cls: 'k-dot-out' }), circle(...now.dots[1], 6, { cls: 'k-dot-old1' }), circle(...now.dots[2], 6, { cls: 'k-dot-old2' }),
      label(...pt(cx, cy, R + 36, 9), 'fresh', 'k-label'), label(...pt(cx, cy, R + 34, -w), '1 old', 'k-label'), label(...pt(cx, cy, R + 32, -2 * w), '2 old', 'k-label'),
      label(...pt(cx, cy, 50, -w / 2), '45°', 'k-tick'));
    const P = now.pts, mid = (a, b, off) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [mx + (b[1] - a[1]) / d * off, my - (b[0] - a[0]) / d * off]; };
    const chainBody = g({},
      [0, 1, 2].map(i => vec(slug, ...P[i], ...P[i + 1])), vec(slug, ...P[0], ...P[3], true),
      label(...mid(P[0], P[1], 16), '0.15', 'k-num'), label(...mid(P[1], P[2], 24), '0.70', 'k-num'), label(...mid(P[2], P[3], 26), '0.15', 'k-num'),
      label(...mid(P[0], P[3], -40), 'sum 0.912', 'k-num-accent'));
    const ghost = g({ cls: 'k-faint', anim: { k: 'in', d: len, len: 0.6 } },
      next.dots.map(d => circle(...d, 10, { cls: 'k-halo' })),
      vec(slug, ...next.pts[0], ...next.pts[3], true));
    const turnArc = (x0, y0, rr, a0) => g({ anim: { k: 'in', d: len, len: 0.6 } }, path(arcD(x0, y0, rr, a0 + 6, a0 + 40), { cls: 'k-arc-accent' }),
      `<polygon class="k-tip-accent" points="${head(...pt(x0, y0, rr, a0 + 32), ...pt(x0, y0, rr, a0 + 42), 7, 3).pts}"/>`);
    return [
      text(ph ? 20 : 40, 24, 'three copies of the 1,000 Hz dot', { anchor: 'start', cls: 'k-name' }),
      text(ph ? 20 : 400, ph ? 302 : 24, ph ? 'the same copies as arrows, tip to tail' : 'the same three as arrows, tip to tail', { anchor: 'start', cls: 'k-name' }),
      line(cx - R - 12, cy, cx + R + 12, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      ghost,
      step(1, 'the fresh, one-old and two-old dots turn together, 45 degrees apart, counter-clockwise 45 degrees per sample', g(spin(cx, cy), wheelBody)),
      step(2, 'the arrows 0.15, 0.70 and 0.15 and their sum turn with them at the same speed', g(spin(ox, oy), chainBody)),
      turnArc(cx, cy, R + 4, 0), turnArc(ox, oy, s * 0.912 + 30, -45),
      text(ph ? 180 : 360, L.H - 30, ph ? 'when it stops, the faint halos and sum' : 'When the turning stops, the faint halos and the faint sum show one sample later:', { cls: 'k-note' }),
      text(ph ? 180 : 360, L.H - 8, ph ? 'show one sample later: all 45° further' : 'every copy and the sum have turned the same 45°, so the sum is the same tone', { cls: 'k-note' }),
    ];
  };

  const response = (L) => {
    const ph = L.phone;
    const P = plot({ x: ph ? 50 : 70, y: ph ? 96 : 92, w: ph ? 276 : 600, h: ph ? 190 : 200, xs: [0, 4000], ys: [0, 1.1] });
    const Q = plot({ x: P.x0, y: P.y1 + (ph ? 84 : 76), w: P.w, h: ph ? 70 : 64, xs: [0, 4000], ys: [0, 180] });
    const xt = ph ? [[0, '0'], [2000, '2,000 Hz'], [4000, '4,000']] : [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000 Hz']];
    const yb = P.y0 - 30;
    const mark = (f, label, anchor = 'start', dy = -12, cls = 'k-num') => g({}, circle(P.X(f), P.Y(gain(f)), 4, { cls: cls === 'k-num-accent' ? 'k-stem-accent-dot' : 'k-stem-dot' }), text(P.X(f) + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0), P.Y(gain(f)) + dy, label, { anchor, cls }));
    return [
      rect(P.X(300), P.Y(1), P.X(1000) - P.X(300), P.Y(0) - P.Y(1), { cls: 'k-region' }),
      rect(P.X(2000), P.Y(1), P.X(3400) - P.X(2000), P.Y(0) - P.Y(1), { cls: 'k-accent-band' }),
      text(P.X(650), P.y1 - 12, ph ? 'vowels' : 'vowel swell', { cls: 'k-label' }),
      text(P.X(2700), P.y1 - 12, ph ? 'consonants' : 'consonant edges', { cls: 'k-label', style: 'fill:var(--accent-ink)' }),
      line(P.X(300), yb, P.X(3400), yb, { cls: 'k-line' }), line(P.X(300), yb - 5, P.X(300), yb + 5, { cls: 'k-line' }), line(P.X(3400), yb - 5, P.X(3400), yb + 5, { cls: 'k-line' }),
      text(P.X(1850), yb - 8, ph ? 'phone band, 300 to 3,400 Hz' : 'the phone band: 300 to 3,400 Hz', { cls: 'k-tick' }),
      axes(P, { xTicks: xt, yTicks: [[1, '100%'], [0.5, '50%'], [0, '0%']], zero: false }),
      text(P.x0, P.y0 - 54, ph ? 'gain: how much the route keeps' : 'gain: how much of each tone the route keeps', { anchor: 'start', cls: 'k-name' }),
      k.gainCurve(P, gain),
      mark(2000, '70%', 'start', -10), mark(3000, '“s”: 49%', 'start', -12, 'k-num-accent'), mark(4000, '40%', 'end', 22),
      axes(Q, { xTicks: xt, yTicks: [[180, '180°'], [90, '90°'], [0, '0°']], zero: false }),
      text(Q.x0, Q.y0 - 12, 'phase: how far behind, 45° per 1,000 Hz', { anchor: 'start', cls: 'k-name' }),
      k.curve(Q, f => turnOf(f), { cls: 'k-curve' }),
    ];
  };

  const sameDelay = (L) => {
    const ph = L.phone;
    const R = ph ? 92 : 104;
    const panel = (f, cx, cy) => {
      const t = turnOf(f), fresh = t, old = 0;
      return {
        still: g({},
          text(cx, cy - R - 26, `${hz(f)} Hz: one sample is ${t}°`, { cls: 'k-name' }),
          line(cx - R - 12, cy, cx + R + 12, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' })),
        spin: g(turnAnim(8, t, cx, cy),
          wedge(cx, cy, R - 14, old, fresh),
          line(cx, cy, ...pt(cx, cy, R, fresh), { cls: 'k-spoke-ink' }), circle(...pt(cx, cy, R, fresh), 6.5, { cls: 'k-dot-out' }),
          line(cx, cy, ...pt(cx, cy, R, old), { cls: 'k-spoke-line' }), circle(...pt(cx, cy, R, old), 6, { cls: 'k-dot-old1' })),
        label: text(...pt(cx, cy, R * 0.45, fresh / 2), `${t}°`, { cls: 'k-num-accent' }),
      };
    };
    const ps = ph ? [panel(1000, 180, 150), panel(2000, 180, 420)] : [panel(1000, 190, 160), panel(2000, 530, 160)];
    const key = ph ? 560 : 300;
    return [
      ps.map(p => p.still),
      step(1, 'both wheels turn, each fresh dot followed by its one-sample-old copy', ps.map(p => p.spin)),
      step(2, 'the shaded angles: 45 degrees at 1,000 Hz, 90 degrees at 2,000 Hz, both one sample', g({ anim: { k: 'in', d: 8, len: 0.6 } }, ps.map(p => p.label))),
      g({}, circle(ph ? 40 : 160, key - 4, 6, { cls: 'k-dot-out' }), text(ph ? 54 : 174, key, 'the fresh dot', { anchor: 'start', cls: 'k-label' }),
        circle(ph ? 190 : 330, key - 4, 6, { cls: 'k-dot-old1' }), text(ph ? 204 : 344, key, 'one sample old', { anchor: 'start', cls: 'k-label' })),
      text(ph ? 180 : 360, key + 30, ph ? 'same delay in time,' : 'the same one-sample delay in time: more degrees for the faster dot', { cls: 'k-note' }),
      ph ? text(180, key + 52, 'more degrees for the faster dot', { cls: 'k-note' }) : '',
    ];
  };

  const ex2 = {
    out: [0.279, 0.345, 0.359, -0.244, -0.014, -0.345, -0.624, -0.245],
    out2: [0.558, 0.691, 0.719, -0.488, -0.029, -0.691, -1.248, -0.489],
    p500: n => 0.5 * gain(500) * cosd(22.5 * (n - 1)), p3k: n => 0.5 * gain(3000) * cosd(135 * (n - 1)),
    xin: [1.0, 0.11, 0.35, 0.54, -0.5, 0.16, -0.35, -0.82, 0.0, -0.82],
  };
  const keyRow = (x, y, kind, label) => {
    const mk = {
      p500: g({}, line(x, y, x + 26, y, { cls: 'k-part-a' }), circle(x + 13, y, 3.5, { cls: 'k-stem-soft-dot' })),
      p3k: g({}, line(x, y, x + 26, y, { cls: 'k-part-b' }), rect(x + 10, y - 3.5, 7, 7, { cls: 'k-stem-soft-dot' })),
      sum: g({}, line(x, y, x + 26, y, { cls: 'k-curve' }), circle(x + 13, y, 4.5, { cls: 'k-stem-dot' })),
      ring: circle(x + 13, y, 8, { cls: 'k-ring-missing k-ring-solid' }),
    }[kind];
    return g({}, mk, text(x + 36, y + 4, label, { anchor: 'start', cls: 'k-label' }));
  };

  const partsSum = (L) => {
    const ph = L.phone;
    const P = plot({ x: ph ? 44 : 70, y: 70, w: ph ? 300 : 600, h: ph ? 200 : 210, xs: [1.5, 9.5], ys: [-0.72, 0.55] });
    const ns = range(2, 9);
    const poly = (fn, cls) => path(ns.map((n, i) => `${i ? 'L' : 'M'}${r2(P.X(n))} ${r2(P.Y(fn(n)))}`).join(''), { cls });
    const sum = n => ex2.p500(n) + ex2.p3k(n);
    const keys = [['p500', '500 Hz part, × 0.977, one late'], ['p3k', '3,000 Hz part, × 0.488, one late'], ['sum', 'the two parts added'], ['ring', 'the click rule’s output']];
    return [
      axes(P, { yTicks: [[0.5, '0.5'], [0, '0'], [-0.5, `${M}0.5`]], xTicks: ns.map(n => [n, n === 2 ? 'n = 2' : String(n)]), zero: true }),
      text(P.x1, P.y1 + 36, ph ? 'starts at n = 2: needs the two before' : 'starts at n = 2: each output needs the two samples before it', { anchor: 'end', cls: 'k-tick' }),
      step(1, `the click rule output at n = 2 to 9: ${ex2.out.map(v => fmt(v)).join(', ')}`,
        ns.map((n, i) => circle(P.X(n), P.Y(ex2.out[i]), 8, { cls: 'k-ring-missing k-ring-solid' }))),
      step(2, 'the two predicted parts, each one sample late',
        g({ cls: 'k-parts', anim: { k: 'in', d: 1, len: 0.8 } }, poly(ex2.p500, 'k-part-a'), ns.map(n => circle(P.X(n), P.Y(ex2.p500(n)), 3.5, { cls: 'k-stem-soft-dot' })),
          poly(ex2.p3k, 'k-part-b'), ns.map(n => rect(P.X(n) - 3.5, P.Y(ex2.p3k(n)) - 3.5, 7, 7, { cls: 'k-stem-soft-dot' })))),
      step(3, 'added column by column, the parts land on every click rule point',
        ns.map((n, i) => g({ anim: { k: 'in', d: 2.2 + i * 0.45, len: 0.4 } }, circle(P.X(n), P.Y(sum(n)), 4.5, { cls: 'k-stem-dot' }))),
        g({ anim: { k: 'in', d: 2.2 + 8 * 0.45, len: 0.6 } }, poly(sum, 'k-curve'))),
      text(P.X(2) - 10, P.y0 - 26, 'n = 2: 0.451 − 0.172 = 0.279', { anchor: 'start', cls: 'k-num' }),
      line(P.X(2), P.y0 - 20, P.X(2), P.Y(sum(2)) - 10, { cls: 'k-guide' }),
      ph ? keys.map(([kk, l], i) => keyRow(24, 336 + i * 24, kk, l)) : keys.map(([kk, l], i) => keyRow(70 + (i % 2) * 320, 340 + Math.floor(i / 2) * 26, kk, l)),
    ];
  };

  const twoTones = (L) => {
    const ph = L.phone;
    const rows = [
      ['500 Hz part: the route keeps 0.977', n => 0.5 * cosd(22.5 * n), n => 0.5 * gain(500) * cosd(22.5 * n), 0.6, [[0.5, '0.5'], [-0.5, `${M}0.5`]]],
      ['3,000 Hz part: the route keeps 0.488', n => 0.5 * cosd(135 * n), n => 0.5 * gain(3000) * cosd(135 * n), 0.6, [[0.5, '0.5'], [-0.5, `${M}0.5`]]],
      ['the sum: the two-tone voice', n => ex2.xin[n], n => ex2.out[n - 1], 1.05, [[1, '1'], [0.5, '0.5'], [-0.5, `${M}0.5`], [-1, `${M}1`]]],
    ];
    const x0 = ph ? 50 : 80, w = ph ? 290 : 590, ns = range(1, 8);
    const tops = ph ? [56, 196, 336] : [52, 172, 292];
    const hs = [70, 70, 150];
    const out = [];
    rows.forEach(([title, fin, fout, ymax, yt], r) => {
      const P = plot({ x: x0, y: tops[r], w, h: hs[r], xs: [0.5, 8.5], ys: [-ymax, ymax] });
      const last = r === 2, focus = n => last || n === 4 || n === 6;
      const draw = (sel, o) => g(o, stems(P, ns.filter(sel).map(n => [n - 0.14, fin(n)]).filter(([, v]) => Math.abs(v) > 0.004), { cls: 'k-stem-soft', dot: 3.5 }),
        stems(P, ns.filter(sel).map(n => [n + 0.14, fout(n)]).filter(([, v]) => Math.abs(v) > 0.004), { dot: 4 }),
        zeros(P, ns.filter(sel).filter(n => Math.abs(fin(n)) <= 0.004).map(n => n - 0.14)), zeros(P, ns.filter(sel).filter(n => Math.abs(fout(n)) <= 0.004).map(n => n + 0.14)));
      out.push(text(x0, tops[r] - 12, title, { anchor: 'start', cls: last ? 'k-name' : 'k-label' }),
        rect(P.X(3.62), P.y0, P.X(4.38) - P.X(3.62), P.h, { cls: 'k-accent-band' }), rect(P.X(5.62), P.y0, P.X(6.38) - P.X(5.62), P.h, { cls: 'k-region' }),
        axes(P, { yTicks: [...yt, [0, '0']], xTicks: last ? ns.map(n => [n, n === 1 ? 'n = 1' : String(n)]) : [] }),
        draw(n => !focus(n), { cls: 'k-dim' }), draw(focus, {}));
      if (r === 0) out.push(text(P.X(4), P.y0 + 12, ph ? '0' : '0 here', { cls: 'k-tick' }));
      if (r === 1) out.push(text(P.X(6), P.y0 + 12, ph ? '0' : '0 here', { cls: 'k-tick' }));
      if (last) out.push(
        text(x0, P.y1 + 44, ph ? `n = 4, consonant: ${M}0.50 to ${M}0.244` : `n = 4, pure consonant (no 500 Hz): in ${M}0.50, out ${M}0.244: halved`, { anchor: 'start', cls: 'k-num-accent' }),
        text(x0, P.y1 + 64, ph ? `n = 6, vowel: ${M}0.35 to ${M}0.345` : `n = 6, pure vowel (no 3,000 Hz): in ${M}0.35, out ${M}0.345: kept`, { anchor: 'start', cls: 'k-num' }));
    });
    const items = [['stem-soft', 'in at n'], ['stem', ph ? 'out, one sample back' : 'out, shifted back one sample to undo the delay']];
    return [out, ph ? legend(L.slug, 20, L.H - 14, items, { dx: 120 }) : legend(L.slug, 150, L.H - 14, items, { dx: 170 })];
  };

  const barPair = (P, x, v, cls, labelCls = 'k-num', anim, digits = 3, wB = 40) => g({},
    g({ anim, style: anim ? `transform-origin:0px ${P.Y(0)}px` : undefined }, rect(P.X(x) - wB / 2, P.Y(v), wB, P.Y(0) - P.Y(v), { cls })),
    text(P.X(x), P.Y(v) - 8, fmt(v, digits), { cls: labelCls, anim: anim ? { k: 'in', d: anim.d + anim.len, len: 0.4 } : undefined }));

  const recipe = (L) => {
    const ph = L.phone, wB = 40;
    const A = ph ? plot({ x: 60, y: 70, w: 260, h: 140, xs: [0, 3], ys: [0, 1.15] }) : plot({ x: 80, y: 70, w: 220, h: 160, xs: [0, 3], ys: [0, 1.15] });
    const B = ph ? plot({ x: 60, y: 340, w: 260, h: 140, xs: [0, 3], ys: [0, 1.15] }) : plot({ x: 420, y: 70, w: 220, h: 160, xs: [0, 3], ys: [0, 1.15] });
    const ticks = [[1, '500 Hz'], [2, '3,000 Hz']];
    return [
      text(A.X(1.5), A.y0 - 36, 'into the route', { cls: 'k-name' }), text(B.X(1.5), B.y0 - 36, 'out of the route', { cls: 'k-name' }),
      axes(A, { xTicks: ticks, zero: false }), axes(B, { xTicks: ticks, zero: false }),
      ph ? g({}, line(A.x0, A.Y(1), A.x1, A.Y(1), { cls: 'k-guide' }), line(B.x0, B.Y(1), B.x1, B.Y(1), { cls: 'k-guide' })) : line(A.x0, A.Y(1), B.x1, A.Y(1), { cls: 'k-guide' }),
      step(1, 'the recipe going in: 1.000 part of 500 Hz, 1.000 part of 3,000 Hz', barPair(A, 1, 1, 'k-bar', 'k-num', undefined, 3, wB), barPair(A, 2, 1, 'k-bar', 'k-num', undefined, 3, wB)),
      step(2, 'out of the route: 500 Hz keeps 0.977, the 3,000 Hz bar shrinks to 0.488',
        barPair(B, 1, 0.977, 'k-bar', 'k-num', { k: 'scale', sy: 1 / 0.977, d: 1, len: 1.5 }, 3, wB),
        barPair(B, 2, 0.488, 'k-bar-accent', 'k-num-accent', { k: 'scale', sy: 1 / 0.488, d: 1, len: 1.5 }, 3, wB)),
      text(A.X(1.5), A.y1 + 46, 'parts 1 : 1', { cls: 'k-num' }),
      g({ anim: { k: 'in', d: 2.5, len: 0.4 } }, text(B.X(1.5), B.y1 + 46, '3,000 Hz now half the 500 Hz', { cls: 'k-num-accent' })),
    ];
  };

  const volume = (L) => {
    const ph = L.phone;
    const A = plot({ x: 70, y: 70, w: ph ? 230 : 220, h: 180, xs: [0, 3], ys: [0, 2.2] });
    const B = plot({ x: ph ? 50 : 400, y: ph ? 384 : 70, w: 290, h: 180, xs: [1.5, 9.5], ys: [-1.4, 1.1] });
    const vals = ex2.out2, ns = range(2, 9), over = v => Math.abs(v) > 1;
    const pairs = ns.map((n, i) => [n, vals[i]]);
    return [
      text(A.x0, 34, 'the recipe at × 2', { anchor: 'start', cls: 'k-name' }),
      axes(A, { xTicks: [[1, '500 Hz'], [2, '3,000 Hz']], yTicks: [[2, '2'], [1, '1'], [0, '0']], zero: false }),
      barPair(A, 1, 1.954, 'k-bar', 'k-num', undefined, 2), barPair(A, 2, 0.976, 'k-bar', 'k-num', undefined, 2),
      text(A.X(1.5), A.y1 + 46, 'ratio 0.98 ÷ 1.95 = 0.50', { cls: 'k-num' }),
      text(B.x0, ph ? B.y0 - 30 : 34, ph ? 'the two-tone caller, × 2' : 'the two-tone caller through the route, × 2', { anchor: 'start', cls: 'k-name' }),
      rect(B.x0, B.Y(1), B.w, B.Y(-1) - B.Y(1), { cls: 'k-fill' }),
      axes(B, { xTicks: ns.map(n => [n, n === 2 ? 'n = 2' : String(n)]), yTicks: [[1, '1'], [0, '0'], [-1, `${M}1`]] }),
      stems(B, pairs.filter(([, v]) => !over(v)), { dot: 4 }),
      stems(B, pairs.filter(([, v]) => over(v)), { cls: 'k-stem-soft', dot: 4 }),
      stems(B, pairs.filter(([, v]) => over(v)).map(([n, v]) => [n, Math.sign(v)]), { cls: 'k-stem-accent', dot: 0 }),
      pairs.filter(([, v]) => over(v)).map(([n, v]) => g({}, line(B.X(n) - 7, B.Y(Math.sign(v)), B.X(n) + 7, B.Y(Math.sign(v)), { cls: 'k-cut' }),
        text(B.X(n) - 12, B.Y(v) + 4, `asks ${fmt(v)}, cut to ${M}1`, { anchor: 'end', cls: 'k-num-accent' }))),
      text(B.x1, B.Y(1) - 6, 'the line’s range, −1 to 1', { anchor: 'end', cls: 'k-tick' }),
      text(B.x1, B.y1 + 40, 'past the range: clipped, lesson 1’s buzz', { anchor: 'end', cls: 'k-note-accent' }),
    ];
  };

  const point = (L) => {
    const ph = L.phone, slug = L.slug, s = 200;
    const panel = (f, ox, oy) => {
      const pts = chainPts(ox, oy, s, turnOf(f)), [ex, ey] = pts[3];
      const A = H.reduce((a, hk, kk) => a + hk * cosd(turnOf(f) * kk), 0), B = H.reduce((a, hk, kk) => a + hk * sind(turnOf(f) * kk), 0);
      const G = Math.hypot(A, B), phi = turnOf(f), one = f === 1000;
            return g({},
        text(one ? ox - 30 : ox - 110, oy - 44, `${hz(f)} Hz`, { anchor: 'start', cls: 'k-name' }),
        line(ox - (one ? 30 : 110), oy, ox + (one ? 170 : 70), oy, { cls: 'k-axis' }),
        line(ox, oy - 24, ox, oy + (one ? 160 : 130), { cls: 'k-axis' }),
        path(arcD(ox, oy, 22, 0, -phi), { cls: 'k-arc-accent' }),
        text(ox + 6, oy - 10, `φ ${phi}° clockwise`, { cls: 'k-num-accent', anchor: 'start' }),
        pts.slice(0, 3).map(([x1, y1], i) => vec(slug, x1, y1, pts[i + 1][0], pts[i + 1][1])),
        vec(slug, ox, oy, ex, ey, true),
        one ? text(ex + 12, ey + 4, `(${fmt(A, 3)}, ${fmt(-B, 3)})`, { anchor: 'start', cls: 'k-num' })
          : text(ex - 12, ey + 4, `(${fmt(A, 3)}, ${fmt(-B, 3)})`, { anchor: 'end', cls: 'k-num' }),
        text(ex + (one ? 12 : -12), ey + 24, `sum: G ${fmt(G, 3)}`, { anchor: one ? 'start' : 'end', cls: 'k-num-accent' }));
    };
    if (ph) return [panel(1000, 70, 70), panel(3000, 220, 330),
      text(20, 500, 'older copies point clockwise.', { anchor: 'start', cls: 'k-tick' }),
      text(20, 530, '3,000 Hz: x and y are equal and both negative,', { anchor: 'start', cls: 'k-tick' }),
      text(20, 548, 'so the point is lower left: 135°, not 45°.', { anchor: 'start', cls: 'k-tick' })];
    return [panel(1000, 90, 80), panel(3000, 560, 80),
      text(60, 300, 'older copies point clockwise', { anchor: 'start', cls: 'k-tick' }),
      text(400, 296, '3,000 Hz: x and y are equal and both negative,', { anchor: 'start', cls: 'k-tick' }),
      text(400, 314, 'so the point is lower left: 135°, not 45°.', { anchor: 'start', cls: 'k-tick' })];
  };

  const arrowsStrip = (L) => {
    const ph = L.phone, slug = L.slug, s = ph ? 104 : 92;
    const tones = [0, 1000, 2000, 3000, 4000];
    const slots = ph ? tones.map((f, i) => [140, 74 + i * 104]) : tones.map((f, i) => [62 + i * 142, 104]);
    const still = tones.map((f, i) => {
      const [ox, oy] = slots[i], w = turnOf(f), tilt = f === 0 ? [7, -7, 7] : f === 4000 ? [0, 12, 24] : [0, 0, 0];
      let px = ox, py = oy; const pts = [[px, py]];
      H.forEach((hk, kk) => { px += s * hk * cosd(-w * kk + tilt[kk]); py -= s * hk * sind(-w * kk + tilt[kk]); pts.push([px, py]); });
      const [ex, ey] = pts[3], sumOff = f === 0 ? -12 : 0;
      const segs = [0, 1, 2].map(j => vec(slug, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]));
      const xsAll = pts.map(p => p[0]), a0 = Math.min(...xsAll) - 10, a1 = Math.max(...xsAll) + 10;
      const lx = ph ? 260 : ox + 24, ly = ph ? oy - 14 : 200;
      return g({ anim: { k: 'in', d: i * 1.5, len: 0.5 } },
        line(a0, oy, a1, oy, { cls: 'k-axis' }), circle(ox, oy, 2.5, { cls: 'k-stop' }),
        segs, vec(slug, ox, oy + sumOff, ex, ey + sumOff, true),
        f === 0 ? [0, 1, 2].map(j => text((pts[j][0] + pts[j + 1][0]) / 2, oy + 16, ['0.15', '0.70', '0.15'][j], { cls: 'k-tick', style: 'font-size:10px' })) : '',
        text(lx, ly, `${hz(f)} Hz`, { cls: 'k-name', anchor: ph ? 'start' : 'middle' }),
        text(lx, ly + 20, `G ${fmt(gain(f), 3)}`, { cls: 'k-num-accent', anchor: ph ? 'start' : 'middle' }),
        text(lx, ly + 38, `φ ${turnOf(f)}°`, { cls: 'k-num', anchor: ph ? 'start' : 'middle' }));
    });
    const [sx, sy] = slots[0], [lx4, ly4] = slots[4];
    const curlLen = 6;
    const curl = { anim: { k: 'curl', d: 0, len: curlLen }, style: 'transform-origin:0px 0px' };
    const L1 = s * H[0], L2 = s * H[1], L3 = s * H[2];
    const sweeper = g({ cls: 'k-ghost', 'aria-hidden': 'true', anim: { k: 'flash', d: 0, len: curlLen + 0.4 } },
      g({ anim: { k: 'move', dx: sx - lx4, dy: sy - ly4, d: 0, len: curlLen }, style: 'animation-timing-function:linear' },
        g({ transform: `translate(${lx4} ${ly4})` },
          vecLocal(L1),
          g({ transform: `translate(${L1} 0)` }, g(curl,
            vecLocal(L2),
            g({ transform: `translate(${L2} 0)` }, g(curl,
              vecLocal(L3),
              circle(L3, 0, 4, { cls: 'k-stem-accent-dot' }))))))));
    const keyY = ph ? L.H - 40 : L.H - 34;
    return [
      ph ? '' : text(360, 30, 'the click’s arrows, older copies clockwise, as the tone rises', { cls: 'k-name' }),
      step(1, 'a chain sweeps from 0 Hz to 4,000 Hz, curling clockwise as the tone rises', sweeper),
      step(2, 'the five chains at 0, 1,000, 2,000, 3,000 and 4,000 Hz; the end point shrinks from 1.000 to 0.400 and swings to 180 degrees', still),
      g({}, vec(slug, ph ? 24 : 120, keyY, ph ? 52 : 148, keyY, true), text(ph ? 60 : 156, keyY + 4, ph ? 'the sum; φ: how far clockwise' : 'the sum: its length is G, its clockwise angle is φ', { anchor: 'start', cls: 'k-label' })),
      ph ? text(180, L.H - 12, '0, 4,000 Hz: tilted to show; really one line', { cls: 'k-tick' })
        : text(360, L.H - 10, 'at 0 and 4,000 Hz the arrows really lie on one line; they are drawn slightly tilted to show them', { cls: 'k-tick' }),
    ];
  };

  const toneBars = (L) => {
    const ph = L.phone;
    const fs = range(250, 3500, 250), sizes = [0.55, 0.9, 1.0, 0.8, 0.62, 0.5, 0.42, 0.38, 0.36, 0.4, 0.46, 0.5, 0.42, 0.3];
    const panel = (x0, y0, title, after) => {
      const P = plot({ x: x0, y: y0, w: ph ? 270 : 280, h: 150, xs: [0, 4000], ys: [0, 1.1] });
      const out = [
        text(P.x0, y0 - 14, title, { anchor: 'start', cls: 'k-name' }),
        axes(P, { xTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']], zero: false }),
        fs.map((f, i) => {
          const v = after ? sizes[i] * gain(f) : sizes[i];
          return g(after ? { anim: { k: 'scale', sy: 1 / gain(f), d: 0.6, len: 2 }, style: `transform-origin:0px ${P.Y(0)}px` } : {}, rect(P.X(f) - 5, P.Y(v), 10, P.Y(0) - P.Y(v), { cls: 'k-bar' }));
        })];
      if (after) {
        const Q = plot({ x: P.x0, y: P.y1 + 50, w: P.w, h: 40, xs: [0, 4000], ys: [0, 1] });
        out.push(axes(Q, { yTicks: [[1, '100%'], [0, '0']], xTicks: [], zero: false }), k.curve(Q, gain, { cls: 'k-curve' }),
          text(Q.x0, Q.y0 - 8, 'each bar shrinks by the route’s gain', { anchor: 'start', cls: 'k-tick' }));
      }
      return g({}, out);
    };
    return [
      panel(ph ? 50 : 60, 50, 'a voice, one bar per tone', false),
      step(1, 'after the route: the same bars in the same places, each shrunk to its gain; the high ones shrink most', panel(ph ? 50 : 400, ph ? 290 : 50, 'after the route', true)),
      text(ph ? 180 : 360, L.H - 12, ph ? 'no new bars: same tones, scaled' : 'no new bars, none moved: every tone out went in, only scaled', { cls: 'k-note' }),
    ];
  };

  const cascade = (L) => {
    const ph = L.phone;
    const hh = ph ? 64 : 76, ys = [0, 3];
    const mk = (x, y, w) => plot({ x, y, w, h: hh, xs: [0, 4000], ys });
    const yt = ph ? [[3, '300%'], [1, '100%'], [0, '0']] : [[3, '300%'], [2, '200%'], [1, '100%'], [0, '0']];
    const xt = [[0, '0'], [4000, ph ? '4,000' : '4,000 Hz']];
    const panel = (P, name, fn, cls) => g({}, axes(P, { xTicks: xt, yTicks: yt, zero: false }), line(P.x0, P.Y(1), P.x1, P.Y(1), { cls: 'k-grid' }),
      text(P.x0, P.y0 - 10, name, { anchor: 'start', cls: 'k-tick' }), k.curve(P, fn, { cls }));
    const W2 = ph ? 116 : 260, xl = ph ? 52 : 70, xr = ph ? 222 : 400, row = hh + (ph ? 70 : 64);
    const R0 = mk(ph ? 52 : 235, 50, ph ? 286 : 260), B1 = mk(xl, 50 + row, W2), V1 = mk(xr, 50 + row, W2), B2 = mk(xl, 50 + 2 * row, W2), V2 = mk(xr, 50 + 2 * row, W2);
    return [
      text(ph ? 20 : 40, 22, ph ? 'the route, then one of two fixes' : 'the route, followed by one of two fixes', { anchor: 'start', cls: 'k-name' }),
      panel(R0, 'the route: 100% down to 40%', gain, 'k-curve'),
      panel(B1, ph ? '× boost, 1 ÷ gain' : '× the boost: 1 ÷ the route’s gain', f => 1 / gain(f), 'k-curve-input'),
      panel(V1, ph ? '× volume, 2' : '× the volume knob: 2 for every tone', () => 2, 'k-curve-input'),
      panel(B2, '', () => 1, 'k-curve'), k.check(B2.x0 + 10, B2.y0 - 12),
      text(B2.x0 + 24, B2.y0 - 8, ph ? '= flat, 100%' : '= flat at 100%: the wall is gone', { anchor: 'start', cls: 'k-num' }),
      panel(V2, '', f => 2 * gain(f), 'k-curve'), k.cross(V2.x0 + 10, V2.y0 - 12),
      [500, 3000].map(f => g({}, circle(V2.X(f), V2.Y(2 * gain(f)), 3.5, { cls: 'k-stem-dot' }), text(V2.X(f) + 4, V2.Y(2 * gain(f)) + 16, `${Math.round(200 * gain(f))}%`, { anchor: 'start', cls: 'k-tick' }))),
      text(V2.x0 + 24, V2.y0 - 8, ph ? '= still slopes' : '= 195% at 500 Hz, 98% at 3,000 Hz', { anchor: 'start', cls: 'k-num' }),
      text(ph ? 180 : 360, L.H - 10, ph ? 'only the boost flattens it' : 'gains multiply: only the boost flattens the slope', { cls: 'k-note' }),
    ];
  };

  const bandsFig = (L) => {
    const ph = L.phone;
    const centers = [500, 1000, 1500, 2000, 2500, 3000, 3400];
    const edges = [[250, 750], [750, 1250], [1250, 1750], [1750, 2250], [2250, 2750], [2750, 3250], [3250, 3550]];
    if (ph) {
      const y0 = 70, rh = 52;
      return [
        text(20, 24, 'seven bands, 0 Hz at the top', { anchor: 'start', cls: 'k-name' }),
        text(20, 46, 'they cover the phone band, 300 to 3,400 Hz', { anchor: 'start', cls: 'k-tick' }),
        centers.map((c, i) => {
          const y = y0 + 20 + i * rh, G = gain(c);
          return g({},
            rect(16, y - 16, 328, rh - 6, { cls: 'k-band-a', rx: 4 }),
            text(28, y + 2, `${hz(c)} Hz`, { anchor: 'start', cls: 'k-name' }),
            text(28, y + 20, `${hz(edges[i][0])} to ${hz(edges[i][1])} Hz`, { anchor: 'start', cls: 'k-tick' }),
            text(240, y + 2, `keeps ${fmt(G, 3)}`, { anchor: 'end', cls: 'k-num' }),
            text(332, y + 2, `× ${fmt(1 / G)}`, { anchor: 'end', cls: 'k-num-input' }));
        }),
        text(180, L.H - 48, 'below 250 and above 3,550 Hz: no knob.', { cls: 'k-tick' }),
        text(180, L.H - 30, 'the phone band ends at 3,400, inside the top band', { cls: 'k-tick' }),
        text(180, L.H - 12, '× : the boost, 1 ÷ what it keeps', { cls: 'k-tick' }),
      ];
    }
    const P = plot({ x: 40, y: 84, w: 640, h: 70, xs: [0, 4000], ys: [0, 1] });
    const yb = P.y0 - 18;
    return [
      text(40, 30, 'seven bands across the line, each named by its middle tone', { anchor: 'start', cls: 'k-name' }),
      line(P.X(300), yb, P.X(3400), yb, { cls: 'k-line' }), line(P.X(300), yb - 5, P.X(300), yb + 5, { cls: 'k-line' }), line(P.X(3400), yb - 5, P.X(3400), yb + 5, { cls: 'k-line' }),
      text(P.X(1850), yb - 8, 'the phone band: 300 to 3,400 Hz', { cls: 'k-tick' }),
      rect(P.X(0), P.y0, P.X(250) - P.X(0), P.h, { cls: 'k-band-off', }), rect(P.X(3550), P.y0, P.X(4000) - P.X(3550), P.h, { cls: 'k-band-off' }),
      edges.map(([a, b]) => rect(P.X(a), P.y0, P.X(b) - P.X(a), P.h, { cls: 'k-band-a' })),
      edges.map(([a]) => line(P.X(a), P.y0, P.X(a), P.y1, { cls: 'k-band-edge' })), line(P.X(3550), P.y0, P.X(3550), P.y1, { cls: 'k-band-edge' }),
      text(P.X(3775), P.y0 + 40, 'no knob', { cls: 'k-tick' }),
      centers.map((c, i) => g({},
        line(P.X(c), P.y1 - 8, P.X(c), P.y1, { cls: 'k-line' }),
        text(P.X(c), P.y0 + 26, hz(c), { cls: 'k-name', style: 'font-size:13px' }),
        text(P.X(c), P.y0 + 48, `× ${fmt(1 / gain(c))}`, { cls: 'k-num-input', style: 'font-size:11px' }),
        text(P.X(c), P.y1 + 22, fmt(gain(c), 3), { cls: 'k-tick' }))),
      text(P.x0, P.y1 + 22, 'keeps', { anchor: 'start', cls: 'k-tick' }),
      axes(plot({ x: 40, y: 204, w: 640, h: 1, xs: [0, 4000], ys: [0, 1] }), { xTicks: [[0, '0'], [1000, '1,000'], [2000, '2,000'], [3000, '3,000'], [4000, '4,000 Hz']], zero: false }),
      text(360, L.H - 28, 'shaded ends: no knob. The top band runs 3,250 to 3,550 Hz around 3,400; the phone band ends inside it.', { cls: 'k-tick' }),
      text(360, L.H - 10, '× : the boost each band needs, 1 ÷ what it keeps', { cls: 'k-tick' }),
    ];
  };

  const css = `
.k-fig .k-wedge { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1; }
.k-fig .k-dot-in { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 2.5; }
.k-fig .k-dim { opacity: 0.3; }
.k-fig .k-halo { fill: none; stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .k-dot-out { fill: var(--ink); }
.k-fig .k-dot-old1 { fill: var(--paper); stroke: var(--ink); stroke-width: 2; }
.k-fig .k-dot-old2 { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .k-spoke-ink { stroke: var(--ink); stroke-width: 1.5; }
.k-fig .k-wheel-soft { stroke: var(--ink-soft); stroke-width: 1.2; stroke-dasharray: 5 4; }
.k-fig .k-hstem { stroke: var(--ink); stroke-width: 1.6; }
.k-fig .k-window { fill: var(--paper-2); stroke: var(--ink-soft); stroke-width: 1.2; }
.k-fig .k-bracket { stroke: var(--accent); stroke-width: 2; }
.k-fig .k-vec-thin { stroke: var(--ink); stroke-width: 2; }
.k-fig .k-vec-sum { stroke: var(--accent); stroke-width: 3; }
.k-fig .k-tip { fill: var(--ink); }
.k-fig .k-tip-accent { fill: var(--accent); }
.k-fig .k-arc-accent { stroke: var(--accent); stroke-width: 1.5; fill: none; }
.k-fig .k-arc-soft { stroke: var(--ink-soft); stroke-width: 1.2; fill: none; }
.k-fig .k-accent-band { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1; }
.k-fig .k-region { fill: var(--paper-2); stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .k-part-a { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 6 4; fill: none; }
.k-fig .k-part-b { stroke: var(--ink-soft); stroke-width: 1.5; stroke-dasharray: 1.5 3.5; stroke-linecap: round; fill: none; }
.k-fig .k-parts { opacity: 0.75; }
.k-fig .k-ring-solid { stroke-dasharray: none; stroke-width: 2; }
.k-fig .k-cut { stroke: var(--accent); stroke-width: 2.5; }
.k-fig .k-guide { stroke-dasharray: 1 3; stroke-linecap: round; }
.k-fig .k-band-a { fill: var(--paper-2); stroke: var(--rule); stroke-width: 1; }
.k-fig .k-band-b { fill: var(--paper); stroke: var(--rule); stroke-width: 1; }
.k-fig .k-band-off { fill: var(--rule); stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .k-band-edge { stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .k-a-curl { animation-name: k-curl; animation-timing-function: linear; transform-box: view-box; }
@keyframes k-curl { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }`;


  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css, eyebrow: 'Lesson 3 · frequency response', body: (kk, L) => body(L) });

  return [
    fig('click', [270, 510], 'The click test on the east route',
      'One sample of 1 goes into the east route; what comes back is 0.15 at n = 0, 0.70 at n = 1 and 0.15 at n = 2, then silence.',
      'The route’s impulse response: the click comes back smeared over three samples, most of it one sample late.', click),
    fig('convolution', [380, 450], 'Each output is a weighted sum of three inputs',
      'A window of the weights 0.15, 0.70 and 0.15 lands on each input sample in turn, from n = 0 (with silence before it) to n = 7; each output sample appears as the window lands on it, and at n = 7 the sum, newest sample first, is 0.15 × 0.40 + 0.70 × (−0.40) + 0.15 × (−1.00) = −0.37.',
      'The click rule as a sliding window: under each output, add 0.15 of the newest input, 0.70 of the one before and 0.15 of the one before that. Before n = 0 the line is silent.', convolution, 3),
    fig('tone-in-out', [320, 330], 'The 2,000 Hz tone comes out as itself',
      'The 2,000 Hz input 1, 0, −1, 0 and the route output 0, 0.70, 0, −0.70 on one axis: the same pattern at 70% of the height, one sample later.',
      'Dashed: the 2,000 Hz tone going in. Solid: what the route gives back. Same pattern, 0.70 as tall, one sample late. Small dots: samples that are 0.', toneInOut),
    fig('wheel', [380, 700], 'Every tone turns a wheel',
      'Five wheels for 0, 1,000, 2,000, 3,000 and 4,000 Hz; each dot turns 0, 45, 90, 135 or 180 degrees per sample, and its left-right position at each sample drops onto a strip below: the tone’s samples.',
      'Each dot turns counter-clockwise by 360° × tone ÷ 8,000 per sample. The numbers on each wheel say where the dot sits at each sample; the strip under it is the dot’s left-right position, sample by sample.', wheelFig, 2),
    fig('phase', [330, 470], 'Phase: how far the output dot trails',
      'One wheel at 2,000 Hz with the input dot of size 1 and the route’s output dot of size 0.700; both turn 90 degrees per sample and the output trails the input by a constant 90 degrees, shaded as the phase.',
      'The route’s 2,000 Hz output is the same dot, smaller and one sample behind. One sample at 2,000 Hz is 90°: that gap is the phase.', phaseFig, 2),
    fig('arrows-turning', [400, 660], 'Copies of a turning wheel turn together',
      'At 1,000 Hz the fresh dot, the one-sample-old dot 45 degrees clockwise behind and the two-sample-old dot 90 degrees behind turn together; drawn as arrows 0.15, 0.70 and 0.15 tip to tail, their sum of 0.912 turns with them at the same speed.',
      'Left: the three copies the route blends. Right: the same copies as arrows scaled by their weights and added tip to tail. When the turning stops, the faint halos and the faint sum show one sample later: everything has turned the same 45°, so the sum turns at the tone’s own speed.', arrowsTurning, 2),
    fig('response', [460, 520], 'The east route’s frequency response',
      'The route keeps 100% at 0 Hz, 70% at 2,000 Hz, 49% at 3,000 Hz and 40% at 4,000 Hz, falling smoothly; the phone band runs 300 to 3,400 Hz, with vowels low and consonant edges from 2,000 to 3,400 Hz where the gain is lowest; the phase climbs in a straight line from 0 to 180 degrees.',
      'Top: how much of each tone the route keeps. Bottom: how far behind it comes out. The consonant edges sit where the gain is lowest.', response),
    fig('same-delay', [370, 640], 'One sample of delay, in degrees',
      'Two wheels, 1,000 Hz and 2,000 Hz, each with a fresh dot and its one-sample-old copy; the shaded gap is 45 degrees on the first and 90 degrees on the second.',
      'The route delays every tone by one sample. A faster dot covers more degrees in that one sample, so the phase grows with the tone.', sameDelay, 2),
    fig('parts-sum', [390, 440], 'Two parts add up to the click rule',
      'For n = 2 to 9, the 500 Hz part (0.977, one sample late) and the 3,000 Hz part (0.488, one sample late) add column by column and land on every point of the click rule output, starting with 0.451 − 0.172 = 0.279 at n = 2.',
      'Circles and squares: the two predicted parts. Solid: the parts added. Rings: the click rule’s output. The solid line runs through every ring.', partsSum, 3),
    fig('two-tones', [560, 610], 'The swell survives, the edge is halved',
      'Three rows compare input and output lined up one sample later: the 500 Hz part keeps 0.977, the 3,000 Hz part keeps 0.488, and in the sum the pure consonant at n = 4 goes from −0.50 to −0.244 while the pure vowel at n = 6 goes from −0.35 to −0.345.',
      'Each row puts the input next to the output, shifted back one sample to undo the route’s delay. The vowel row barely changes; the consonant row is cut in half; the sum shows both.', twoTones),
    fig('volume', [320, 620], 'The volume knob keeps the wall',
      'At times 2 the recipe is 1.95 and 0.98, still a ratio of 0.50; the two-tone caller through the route at times 2 asks for −1.25 at n = 8, past the line’s range, and is cut to −1.',
      'Turning everything up keeps the recipe muffled, and the loudest sample of the call goes past the line’s range and clips.', volume),
    fig('point', [340, 590], 'Read the angle off the end point',
      'At 1,000 Hz the clockwise arrow chain ends at (0.645, −0.645): distance 0.912, 45 degrees clockwise. At 3,000 Hz it ends at (−0.345, −0.345) in the lower left: distance 0.488, 135 degrees clockwise, though the ratio alone matches the upper right at 45 degrees.',
      'The chain of arrows for two tones. The end point’s distance from the center is the gain G; how far clockwise it sits is the phase φ.', point),
    fig('arrows', [290, 580], 'The arrows curl as the tone rises',
      'Arrow chains for 0, 1,000, 2,000, 3,000 and 4,000 Hz; as the tone rises the chain curls clockwise and the end point shrinks from 1.000 to 0.912, 0.700, 0.488 and 0.400 while its angle swings from 0 to 180 degrees; at 2,000 Hz the 0.70 arrow points straight down.',
      'Each chain is the click’s three arrows for one tone. The coral arrow to the end point is the gain and phase you would measure.', arrowsStrip, 2),
    fig('tone-bars', [330, 580], 'Every tone out went in',
      'A voice drawn as one bar per tone from 250 to 3,500 Hz, before and after the route; after, the same bars stand in the same places, each shrunk by the route’s gain, the high ones most.',
      'An example voice before and after the route. Nothing new appears, nothing moves: each tone is only scaled.', toneBars, 1),
    fig('cascade', [470, 440], 'A boost undoes the wall, a volume knob does not',
      'The route’s falling gain times a rising boost of 1 ÷ gain is flat at 100%; the same route times a flat volume of 2 is still falling, 195% at 500 Hz and 98% at 3,000 Hz.',
      'Gains multiply. A boost that rises exactly where the route falls flattens it; turning everything up keeps the slope.', cascade),
    fig('bands', [270, 500], 'The seven bands of the boost',
      'Seven bands from 250 to 3,550 Hz, covering the phone band of 300 to 3,400 Hz and centred on 500, 1,000, 1,500, 2,000, 2,500, 3,000 and 3,400 Hz, each with what the east route keeps there and the boost it needs: 1.02, 1.10, 1.23, 1.43, 1.71, 2.05 and 2.31.',
      'One knob per band. For the east route, each band’s boost is 1 ÷ what the route keeps at its middle tone.', bandsFig),
  ];
};
