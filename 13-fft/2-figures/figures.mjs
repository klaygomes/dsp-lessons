export default k => {
  const { g, line, path, rect, circle, text, masked, plot, axes, box, arrow, step, fmt, range } = k;
  const M = '−';
  const n0 = v => Math.round(v).toLocaleString('en-US');
  const rad = d => d * Math.PI / 180;
  const at = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
  const r2 = v => Math.round(v * 100) / 100;

  const head = (x, y, ang, tone = '', s = 9) => {
    const a = rad(ang), w = s * 0.42;
    const bx = x - s * Math.cos(a), by = y - s * Math.sin(a);
    const pts = [[x, y], [bx + w * Math.sin(a), by - w * Math.cos(a)], [bx - w * Math.sin(a), by + w * Math.cos(a)]];
    return path(`M${pts.map(([px, py]) => `${r2(px)} ${r2(py)}`).join('L')}Z`, { cls: `l13-head${tone ? '-' + tone : ''}` });
  };
  const vec = (x1, y1, x2, y2, o = {}) => {
    const { tone = '', s = 9, ...rest } = o;
    const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    if (len < 1) return '';
    const cut = Math.min(s * 0.8, len * 0.5);
    const ex = x2 - cut * Math.cos(rad(ang)), ey = y2 - cut * Math.sin(rad(ang));
    return g(rest, line(x1, y1, ex, ey, { cls: `spoke l13-vec${tone ? '-' + tone : ''}` }), head(x2, y2, ang, tone, s));
  };
  const arcArrow = (cx, cy, r, a0, a1, o = {}) => {
    const { tone = 'soft', s = 8, cls = 'l13-arc' } = o;
    const [x0, y0] = at(cx, cy, r, a0), [x1, y1] = at(cx, cy, r, a1);
    const cw = a1 > a0, large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const tangent = a1 + (cw ? 90 : -90);
    return g({}, path(`M${r2(x0)} ${r2(y0)}A${r} ${r} 0 ${large} ${cw ? 1 : 0} ${r2(x1)} ${r2(y1)}`, { cls }), head(x1, y1, tangent, tone, s));
  };
  const marker = (kind, x, y, tone = '') => {
    const c = `l13-mk${tone ? '-' + tone : ''}`;
    if (kind === 'circle') return circle(x, y, 4.5, { cls: c });
    if (kind === 'square') return rect(x - 4, y - 4, 8, 8, { cls: c });
    if (kind === 'tri') return path(`M${r2(x)} ${r2(y - 5.5)}L${r2(x + 5)} ${r2(y + 4)}L${r2(x - 5)} ${r2(y + 4)}Z`, { cls: c });
    return '';
  };
  const key = (x, y, items, { dx = 260, dy = 24, cols = items.length } = {}) => g({}, items.map(([draw, label], i) => {
    const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
    return g({}, draw(lx, ly - 4), text(lx + 34, ly, label, { anchor: 'start', cls: 'k-label' }));
  }));
  const keyLine = (cls, mk = '', tone = '') => (x, y) => g({}, line(x, y, x + 26, y, { cls }), marker(mk, x + 13, y, tone));
  const keySwatch = cls => (x, y) => rect(x + 4, y - 7, 18, 14, { cls });
  const sub = (s, n) => s + String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join('');
  const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('');
  const W8 = j => `W₈${sup(j)}`;

  const multiplyCost = L => {
    const ph = L.phone;
    const left = (x0, y0) => g({},
      text(x0, y0, 'a sample turned into an arrow', { anchor: 'start', cls: 'k-name' }),
      text(x0, y0 + 22, 'sample x, wheel’s arrow c right, d up', { anchor: 'start', cls: 'k-label' }),
      box(x0, y0 + 50, 120, 52, { name: 'x × c', sub: 'left-right part' }),
      box(x0 + 140, y0 + 50, 120, 52, { name: 'x × d', sub: 'up-down part' }),
      text(x0, y0 + 136, '2 multiplications', { anchor: 'start', cls: 'k-name-accent' }));
    const right = (x0, y0) => g({},
      text(x0, y0, 'an arrow turned by an arrow', { anchor: 'start', cls: 'k-name' }),
      text(x0, y0 + 22, 'arrow a right, b up,', { anchor: 'start', cls: 'k-label' }), text(x0, y0 + 38, 'turned by the wheel’s arrow c right, d up', { anchor: 'start', cls: 'k-label', style: ph ? 'font-size:11px' : undefined }),
      text(x0, y0 + 62, 'new left-right part', { anchor: 'start', cls: 'k-tick' }),
      box(x0, y0 + 70, 104, 44, { name: 'a × c' }), text(x0 + 122, y0 + 98, M, { cls: 'k-name' }), box(x0 + 140, y0 + 70, 104, 44, { name: 'b × d' }),
      text(x0, y0 + 136, 'new up-down part', { anchor: 'start', cls: 'k-tick' }),
      box(x0, y0 + 144, 104, 44, { name: 'a × d' }), text(x0 + 122, y0 + 172, '+', { cls: 'k-name' }), box(x0 + 140, y0 + 144, 104, 44, { name: 'b × c' }),
      text(x0, y0 + 222, '4 multiplications', { anchor: 'start', cls: 'k-name-accent' }));
    if (ph) return [left(20, 36), line(20, 210, 340, 210, { cls: 'k-grid' }), right(20, 244)];
    return [left(28, 44), line(352, 30, 352, 280, { cls: 'k-grid' }), right(384, 44)];
  };

  const workGrid = L => {
    const ph = L.phone;
    const cw = ph ? 1.2 : 2.8, ch = ph ? 2.2 : 2.6;
    const x0 = ph ? 40 : 70, y0 = ph ? 64 : 64, W = 205 * cw, H = 103 * ch, share = 25625 / 410;
    const tx = x0 + W + 8, msAt = ms => y0 + ms / 42.23 * H;
    const lines = [];
    for (let c = 10; c < 205; c += 10) lines.push(line(x0 + c * cw, y0, x0 + c * cw, y0 + H, { cls: 'l13-gridline' }));
    for (let r = 10; r < 103; r += 10) lines.push(line(x0, y0 + r * ch, x0 + W, y0 + r * ch, { cls: 'l13-gridline' }));
    return [
      text(x0, 22, ph ? 'one row per bin, one column per sample' : 'one row per bin, one column per sample: each cell is one sample turned, 2 multiplications', { anchor: 'start', cls: 'k-label', style: ph ? 'font-size:11px' : undefined }),
      text(x0, y0 - 10, 'sample 0', { anchor: 'start', cls: 'k-tick' }), text(x0 + W, y0 - 10, '204', { anchor: 'end', cls: 'k-tick' }),
      text(x0 - 6, y0 + 9, ph ? 'bin 0' : 'bin 0', { anchor: 'end', cls: 'k-tick' }), text(x0 - 6, y0 + H, ph ? '102' : 'bin 102', { anchor: 'end', cls: 'k-tick' }),
      rect(x0, y0, W, H, { cls: 'l13-empty' }),
      step(1, 'the grid fills row by row while the chip’s clock runs',
        g({}, g({ anim: { k: 'scale', sy: 0, d: 0, len: 4 }, style: `transform-origin:0px ${y0}px` }, rect(x0, y0, W, H, { cls: 'l13-cell' })),
          g({ anim: { k: 'move', dy: -H, d: 0, len: 4 } }, line(x0 + W + 1, y0 + H, tx + 4, y0 + H, { cls: 'l13-clock' })))),
      lines,
      line(x0 + W + 2, y0, x0 + W + 2, y0 + H, { cls: 'k-axis' }),
      text(tx + 6, y0 + 4, ph ? '0' : '0 ms', { anchor: 'start', cls: 'k-tick' }),
      text(tx + 6, y0 + H + 4, ph ? '42.2' : '42.2 ms', { anchor: 'start', cls: 'k-tick' }),
      text(tx + 6, msAt(25.6) + 4, ph ? '25.6' : '25.6 ms', { anchor: 'start', cls: 'k-num' }),
      text(ph ? tx + 6 : tx + 6, y0 - 10, ph ? 'ms' : 'chip time', { anchor: 'start', cls: 'k-tick' }),
      step(2, 'at 25.6 ms the next block arrives: the chip’s share of this block is 25,625 multiplications',
        g({ anim: { k: 'in', d: 4.2 } }, rect(x0, y0, W, share * ch, { cls: 'l13-budget' }),
          masked(x0 + W / 2, y0 + share * ch / 2 + 5, ph ? 'the chip’s share: 25,625' : 'the chip’s share of one block: 25,625 multiplications', { cls: 'k-num', size: ph ? 11 : 12 }))),
      step(3, 'the bill: 42,230 needed, 25,625 available',
        g({ anim: { k: 'in', d: 5.4 } }, text(ph ? 180 : 360, y0 + H + 34, ph ? '42,230 needed, 25,625 available' : '42,230 needed, 25,625 available: about 61% of the grid', { cls: 'k-note' }))),
      ph ? text(180, y0 + H + 58, 'dashed: what the chip can do per block', { cls: 'k-tick' }) : text(360, y0 + H + 58, 'dashed outline: what the chip can do before the next block arrives', { cls: 'k-tick' }),
    ];
  };

  const backWheel = L => {
    const ph = L.phone;
    const cx = ph ? 180 : 210, cy = ph ? 170 : 175, R = ph ? 92 : 110;
    const pts = [[0, '0°', 'start: right'], [90, '90° back', 'π/2'], [180, '180° back', 'π'], [270, '270° back', '3π/2']];
    const out = [line(cx - R - 16, cy, cx + R + 16, cy, { cls: 'k-axis' }), line(cx, cy - R - 16, cx, cy + R + 16, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' })];
    const [sx, sy] = at(cx, cy, R, 45), [lx45, ly45] = at(cx, cy, R + 12, 45);
    out.push(line(cx, cy, sx, sy, { cls: 'k-guide' }), circle(sx, sy, 4, { cls: 'l13-mk-soft' }), text(lx45 + 2, ly45 + 8, ph ? '45°: one step' : '45° back: one step', { anchor: 'start', cls: 'k-tick' }));
    out.push(arcArrow(cx, cy, R * 0.32, 0, 88, { tone: '' , cls: 'l13-arc-ink' }), arcArrow(cx, cy, R * 0.5, 0, 178, { tone: '', cls: 'l13-arc-ink' }), arcArrow(cx, cy, R * 0.68, 0, 268, { tone: '', cls: 'l13-arc-ink' }));
    pts.forEach(([d, a, b]) => {
      const [x, y] = at(cx, cy, R, d);
      out.push(circle(x, y, 5, { cls: 'k-stem-dot' }));
      const lx = d === 0 ? x + 8 : d === 180 ? x - 8 : x + 10, ly = d === 90 ? y + 22 : d === 270 ? y - 24 : y - 30;
      const anchor = d === 0 ? 'start' : d === 180 ? 'end' : 'start';
      out.push(text(lx, ly, a, { anchor, cls: 'k-num' }), text(lx, ly + 15, d === 0 ? '0 radians' : `= ${b}`, { anchor, cls: 'k-tick' }));
    });
    const notes = ph ? [180, cy + R + 66] : [410, 120];
    const [nx, ny] = notes, anchor = ph ? 'middle' : 'start';
    out.push(text(nx, ny, 'back = clockwise', { anchor, cls: 'k-name' }),
      text(nx, ny + 28, '360° = 2π, one full turn', { anchor, cls: 'k-num' }),
      text(nx, ny + 52, '45° = 2π ÷ 8', { anchor, cls: 'k-num' }),
      text(nx, ny + 74, 'one step of bin 1’s wheel at N = 8', { anchor, cls: 'k-tick' }));
    return out;
  };

  const sharedArrows = L => {
    const ph = L.phone;
    const col = (i, x, yA, yB, yS, r) => {
      const a1 = 45 * i, a5 = 225 * i, odd = i % 2 === 1;
      const [ax, ay] = at(x, yA, r - 3, a1), [bx, by] = at(x, yB, r - 3, a5);
      return g({},
        circle(x, yA, r, { cls: 'l13-ring' }), vec(x, yA, ax, ay, { s: 8 }),
        text(x, yA + r + 15, `${(a1 % 360)}°`, { cls: 'k-tick' }),
        circle(x, yB, r, { cls: 'l13-ring' }), vec(x, yB, bx, by, { tone: odd ? 'accent' : '', s: 8 }),
        text(x, yB + r + 15, `${(a5 % 360)}°`, { cls: 'k-tick' }),
        text(x, yS, odd ? 'flipped' : 'same', { cls: odd ? 'k-num-accent' : 'k-num' }));
    };
    const header = (x, y, i) => text(x, y, i === 0 ? 'n = 0' : String(i), { cls: 'k-tick' });
    const out = [];
    if (ph) {
      [0, 1].forEach(b => {
        const y0 = 30 + b * 250;
        out.push(text(12, y0 + 70, 'bin 1', { anchor: 'start', cls: 'k-name' }), text(12, y0 + 150, 'bin 5', { anchor: 'start', cls: 'k-name' }));
        range(0, 3).forEach(c => {
          const i = b * 4 + c, x = 110 + c * 70;
          out.push(header(x, y0 + 20, i), step(i + 1, `sample ${i}: bin 1 ${45 * i % 360} degrees back, bin 5 ${225 * i % 360}, ${i % 2 ? 'opposite' : 'the same'}`,
            g({ anim: { k: 'in', d: i * 0.7, len: 0.6 } }, col(i, x, y0 + 64, y0 + 144, y0 + 214, 22))));
        });
      });
      out.push(text(180, 548, 'bin 1 turns 45° back per sample, bin 5 225°', { cls: 'k-tick' }));
      return out;
    }
    out.push(text(18, 104, 'bin 1', { anchor: 'start', cls: 'k-name' }), text(18, 122, '45° back', { anchor: 'start', cls: 'k-tick' }), text(18, 136, 'per sample', { anchor: 'start', cls: 'k-tick' }),
      text(18, 194, 'bin 5', { anchor: 'start', cls: 'k-name' }), text(18, 212, '225° back', { anchor: 'start', cls: 'k-tick' }), text(18, 226, 'per sample', { anchor: 'start', cls: 'k-tick' }));
    range(0, 7).forEach(i => {
      const x = 134 + i * 76;
      out.push(header(x, 50, i), step(i + 1, `sample ${i}: bin 1 ${45 * i % 360} degrees back, bin 5 ${225 * i % 360}, ${i % 2 ? 'opposite' : 'the same'}`,
        g({ anim: { k: 'in', d: i * 0.7, len: 0.6 } }, col(i, x, 100, 190, 266, 26))));
    });
    out.push(text(360, 296, 'angles turned back from the right, wrapped at 360°', { cls: 'k-tick' }));
    return out;
  };

  const oddWalk = L => {
    const ph = L.phone, u = ph ? 46 : 46;
    const pA = ph ? [60, 200] : [56, 270], pB = ph ? [60, 420] : [276, 230], pC = ph ? [20, 520] : [496, 0];
    const [ax, ay] = pA, [bx, by] = pB;
    const walk = [[1, 0, 'x[1]: 1 right'], [0, 1, 'x[3]: 1 up'], [1, 0, 'x[5]: 1 right'], [0, 1, 'x[7]: 1 up']];
    let px = ax, py = ay;
    const steps = walk.map(([dx, dy, s], i) => {
      const nx = px + dx * u, ny = py - dy * u;
      const lab = dx ? text((px + nx) / 2, py + 16, s.split(':')[0], { cls: 'k-tick' }) : text(nx + 8, py - 6, s.split(':')[0], { anchor: 'start', cls: 'k-tick' });
      const o = g({ anim: { k: 'in', d: i * 0.5, len: 0.5 } }, vec(px, py, nx, ny, { s: 8 }), lab);
      [px, py] = [nx, ny];
      return o;
    });
    const L2 = 2.828 * u;
    const titleA = text(ph ? 20 : 24, ph ? 30 : 34, '1. the odd part, tip to tail', { anchor: 'start', cls: 'k-name' });
    const titleB = text(ph ? 20 : 262, ph ? 270 : 34, '2. turned back the extra 45°', { anchor: 'start', cls: 'k-name' });
    const A = [titleA,
      text(ph ? 20 : 24, ph ? 50 : 54, 'each odd sample turned by the 4-sample wheel', { anchor: 'start', cls: 'k-tick' }),
      line(ax - 10, ay, ax + 2 * u + 30, ay, { cls: 'k-axis' }),
      step(1, 'the four odd arrows, right, up, right, up, laid tip to tail', g({}, steps)),
      step(2, 'they add up to 2 right and 2 up: length 2.83, pointing 45 degrees up',
        g({ anim: { k: 'in', d: 2.2 } }, vec(ax, ay, ax + 2 * u, ay - 2 * u, { tone: '', s: 10, cls: 'l13-thick' }),
          text(ax + 2 * u, ay - 2 * u - 14, '2.83, 45° up', { cls: 'k-num' })))];
    const B = [titleB,
      line(bx - 10, by, bx + L2 + 24, by, { cls: 'k-axis' }),
      vec(bx, by, bx + 2 * u, by - 2 * u, { tone: 'faint', s: 9 }),
      text(bx + 2 * u + 6, by - 2 * u - 4, 'before', { anchor: 'start', cls: 'k-tick' }),
      arcArrow(bx, by, 2.2 * u, -43, -3, { tone: 'soft' }),
      text(...at(bx, by, 2.2 * u + 12, -26), '45° back', { anchor: 'start', cls: 'k-tick' }),
      step(3, 'the odd part turns back 45 degrees and points straight right, still 2.83 long',
        g({ anim: { k: 'turn', r0: '-45deg', steps: 8, d: 3.2, len: 1.2 }, style: `transform-origin:${bx}px ${by}px` }, vec(bx, by, bx + L2, by, { s: 10 }))),
      text(bx + L2, by + 20, '2.83 right', { anchor: 'end', cls: 'k-num' })];
    const cx0 = pC[0], cy0 = pC[1];
    const scale = ph ? 46 : 28, X = v => cx0 + (ph ? 60 : 40) + v * scale;
    const row = (y, label, sign, n, tone) => g({},
      text(X(-1) - 0, y - 18, label, { anchor: 'start', cls: tone ? 'k-num-accent' : 'k-num' }),
      vec(X(0), y, X(2), y, { s: 8, tone: 'soft-solid' }),
      vec(X(2), y + 6, X(2 + sign * 2.828), y + 6, { s: 9, tone }),
      circle(X(n), y + 6, 4, { cls: tone ? 'l13-mk-accent' : 'l13-mk' }));
    const yC1 = ph ? cy0 + 100 : 120, yC2 = ph ? cy0 + 170 : 200, yAx = ph ? cy0 + 216 : 250;
    const C = [text(cx0 + 2, ph ? cy0 + 26 : 34, '3. add to the even part,', { anchor: 'start', cls: 'k-name' }), text(cx0 + 2, ph ? cy0 + 46 : 54, 'and subtract from it', { anchor: 'start', cls: 'k-name' }),
      line(X(-1), yAx, X(5), yAx, { cls: 'k-axis' }),
      [-1, 0, 2, 4, 5].map(v => g({}, line(X(v), yAx - 4, X(v), yAx + 4, { cls: 'k-axis' }), text(X(v), yAx + 18, v < 0 ? `${M}1` : String(v), { cls: 'k-tick' }))),
      step(4, 'bin 1 = 2 + 2.83 = 4.83', g({ anim: { k: 'in', d: 4.6 } }, row(yC1, 'bin 1 = 2 + 2.83 = 4.83', 1, 4.828, ''))),
      step(5, 'bin 5 = 2 − 2.83 = −0.83', g({ anim: { k: 'in', d: 5.6 } }, row(yC2, `bin 5 = 2 ${M} 2.83 = ${M}0.83`, -1, -0.828, 'accent'))),
      text(X(1), yC1 + 24, 'even part: 2', { cls: 'k-tick' })];
    return [A, B, C];
  };

  const butterfly = L => {
    if (L.phone) {
      const xa = 90, xb = 270, yIn = 90, yT = 170, yX = 230, yOut = 330;
      return [
        text(xa, 40, 'E[1] = 2', { cls: 'k-num' }), text(xa, 58, 'even part', { cls: 'k-tick' }),
        text(xb, 40, 'O[1] = 2.83', { cls: 'k-num' }), text(xb, 58, '45° up, odd part', { cls: 'k-tick' }),
        line(xa, 70, xa, yX, { cls: 'k-line' }), line(xb, 70, xb, yT - 24, { cls: 'k-line' }),
        line(xb, yT + 24, xb, yX, { cls: 'k-line' }),
        box(xb - 50, yT - 24, 100, 48, { name: `× ${W8(1)}`, sub: 'turn back 45°' }),
        text(xb + 8, yX - 14, '2.83 right', { anchor: 'start', cls: 'k-tick' }),
        line(xa, yX, xa, yOut - 50, { cls: 'k-line' }), line(xb, yX, xb, yOut - 50, { cls: 'k-line' }),
        line(xa, yX, xb, yOut - 50, { cls: 'k-line' }), line(xb, yX, xa, yOut - 50, { cls: 'k-line' }),
        circle(xa, yOut - 36, 14, { cls: 'l13-node' }), text(xa, yOut - 31, '+', { cls: 'k-name' }),
        circle(xb, yOut - 36, 14, { cls: 'l13-node' }), text(xb, yOut - 31, M, { cls: 'k-name' }),
        arrow(L.slug, [[xa, yOut - 22], [xa, yOut + 6]]), arrow(L.slug, [[xb, yOut - 22], [xb, yOut + 6]], { tone: 'accent' }),
        text(xa, yOut + 26, 'X[1] = 4.83', { cls: 'k-num' }), text(xb, yOut + 26, `X[5] = ${M}0.83`, { cls: 'k-num-accent' }),
        text(xa, yOut + 44, 'bin 1', { cls: 'k-tick' }), text(xb, yOut + 44, 'bin 5', { cls: 'k-tick' }),
        text(180, yOut + 84, '4 multiplications: the one turn', { cls: 'k-note' }),
      ];
    }
    const yT = 96, yB = 216, x0 = 230, xt = 300, xc = 440, xd = 570, xo = 600;
    return [
      text(30, yT - 4, 'E[1] = 2', { anchor: 'start', cls: 'k-num' }), text(30, yT + 14, 'even part', { anchor: 'start', cls: 'k-tick' }),
      text(30, yB - 4, 'O[1] = 2.83, 45° up', { anchor: 'start', cls: 'k-num' }), text(30, yB + 14, 'odd part', { anchor: 'start', cls: 'k-tick' }),
      line(x0 - 30, yT, xc, yT, { cls: 'k-line' }), line(x0 - 30, yB, xt - 60, yB, { cls: 'k-line' }), line(xt + 60, yB, xc, yB, { cls: 'k-line' }),
      box(xt - 60, yB - 24, 120, 48, { name: `× ${W8(1)}`, sub: 'turn back 45°' }),
      text((xt + 60 + xc) / 2, yB - 10, '2.83 right', { cls: 'k-tick' }),
      line(xc, yT, xd - 14, yT, { cls: 'k-line' }), line(xc, yB, xd - 14, yB, { cls: 'k-line' }),
      line(xc, yT, xd - 14, yB, { cls: 'k-line' }), line(xc, yB, xd - 14, yT, { cls: 'k-line' }),
      circle(xd, yT, 14, { cls: 'l13-node' }), text(xd, yT + 5, '+', { cls: 'k-name' }),
      circle(xd, yB, 14, { cls: 'l13-node' }), text(xd, yB + 5, M, { cls: 'k-name' }),
      arrow(L.slug, [[xd + 14, yT], [xo + 8, yT]]), arrow(L.slug, [[xd + 14, yB], [xo + 8, yB]], { tone: 'accent' }),
      text(xo + 14, yT + 4, 'X[1] = 4.83', { anchor: 'start', cls: 'k-num' }), text(xo + 14, yT + 22, 'bin 1', { anchor: 'start', cls: 'k-tick' }),
      text(xo + 14, yB + 4, `X[5] = ${M}0.83`, { anchor: 'start', cls: 'k-num-accent' }), text(xo + 14, yB + 22, 'bin 5', { anchor: 'start', cls: 'k-tick' }),
      text(360, 290, 'one turn, four multiplications, shared by two bins', { cls: 'k-note' }),
    ];
  };

  const splitTree = L => {
    const ph = L.phone, cell = ph ? 22 : 30, gaps = ph ? [0, 40, 24, 12] : [0, 60, 40, 24];
    const center = ph ? 150 : 290, ys = ph ? [70, 170, 270, 370] : [74, 154, 234, 314];
    const groupsAt = lev => {
      const n = 2 ** lev, size = 8 / n, total = 8 * cell + (n - 1) * gaps[lev];
      let x = center - total / 2;
      const order = [[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 6, 1, 3, 5, 7], [0, 4, 2, 6, 1, 5, 3, 7], [0, 4, 2, 6, 1, 5, 3, 7]][lev];
      return range(0, n - 1).map(gi => { const o = { x, w: size * cell, items: order.slice(gi * size, gi * size + size) }; x += size * cell + gaps[lev]; return o; });
    };
    const levels = range(0, 3).map(groupsAt);
    const drawLevel = lev => g({}, levels[lev].map(G => g({},
      rect(G.x, ys[lev], G.w, 28, { cls: 'l13-cellbox', rx: 3 }),
      G.items.map((s, i) => g({}, i ? line(G.x + i * cell, ys[lev], G.x + i * cell, ys[lev] + 28, { cls: 'k-grid' }) : '', text(G.x + i * cell + cell / 2, ys[lev] + 19, String(s), { cls: 'k-num' }))))));
    const links = lev => g({}, levels[lev].map((P, pi) => [0, 1].map(c => {
      const C = levels[lev + 1][pi * 2 + c], px = P.x + P.w / 2, cx = C.x + C.w / 2, y1 = ys[lev] + 28, y2 = ys[lev + 1], mid = (y1 + y2) / 2;
      return path(`M${px} ${y1}L${px} ${mid}L${cx} ${mid}L${cx} ${y2}`, { cls: 'l13-link' });
    })));
    const counts = ph
      ? [['128'], ['80'], ['64'], ['48']]
      : [['128', '1 DFT of 8 samples'], ['80', '2 DFTs of 4: 64', '+ 4 butterflies: 16'], ['64', '4 DFTs of 2: 32', '+ 8 butterflies: 32'], ['48', '8 single samples: 0', '+ 12 butterflies: 48']];
    const cxCount = ph ? 336 : 520;
    const countAt = lev => g({}, text(cxCount, ys[lev] + 18, counts[lev][0], { anchor: ph ? 'end' : 'start', cls: lev === 3 ? 'k-name-accent' : 'k-name' }),
      ...(counts[lev].slice(1).map((s, i) => text(cxCount + 40, ys[lev] + 10 + i * 16, s, { anchor: 'start', cls: 'k-tick' }))));
    const labelsL1 = g({}, masked(levels[1][0].x + levels[1][0].w / 2, ys[1] - 12, 'even', { cls: 'k-tick', size: 11 }), masked(levels[1][1].x + levels[1][1].w / 2, ys[1] - 12, 'odd', { cls: 'k-tick', size: 11 }));
    const ax = ph ? 14 : 22;
    return [
      text(ph ? 10 : 30, 30, ph ? 'split down, then build up' : 'split into even and odd samples, down to single samples, then build back up', { anchor: 'start', cls: 'k-label' }),
      text(cxCount, ph ? 52 : 52, 'multiplications', { anchor: ph ? 'end' : 'start', cls: 'k-tick' }),
      step(1, 'eight samples, the direct DFT: 128 multiplications', g({ anim: { k: 'in', d: 0 } }, drawLevel(0), countAt(0))),
      step(2, 'split once into even and odd samples: 80', g({ anim: { k: 'in', d: 1 } }, links(0), labelsL1, drawLevel(1), countAt(1))),
      step(3, 'split again: 64', g({ anim: { k: 'in', d: 2 } }, links(1), drawLevel(2), countAt(2))),
      step(4, 'all the way to single samples: 48, all of it butterflies', g({ anim: { k: 'in', d: 3 } }, links(2), drawLevel(3), countAt(3))),
      step(5, 'rebuilding upward, three layers of butterflies',
        g({ anim: { k: 'in', d: 4.2 } }, arrow(L.slug, [[ax, ys[3] + 24], [ax, ys[0] + 4]]),
          ph ? '' : [1, 2, 3].map(l => text(ax + 10, (ys[4 - l] + ys[3 - l] + 28) / 2 + 4, `layer ${l}`, { anchor: 'start', cls: 'k-tick' })))),
      ph ? text(180, 430, 'arrow: the butterflies build back up', { cls: 'k-tick' }) : text(290, 372, 'arrow: three layers of butterflies build the bins back up', { cls: 'k-tick' }),
    ];
  };

  const network = L => {
    const ph = L.phone, BR = [0, 4, 2, 6, 1, 5, 3, 7];
    const pos = p => (ph ? 44 + p * 38 : 70 + p * 40);
    const lay = c => (ph ? [86, 236, 386, 536][c] : [130, 300, 470, 640][c]);
    const P = (c, p) => (ph ? [pos(p), lay(c)] : [lay(c), pos(p)]);
    const out = [];
    for (let l = 1; l <= 3; l++) {
      const span = 2 ** (l - 1), size = 2 ** l;
      for (let b = 0; b < 8; b += size) for (let j = 0; j < span; j++) {
        const top = b + j, bot = top + span, tw = j * (8 / size), hi = l === 3 && top === 1;
        const cls = hi ? 'l13-net-hi' : 'l13-net';
        const [a0x, a0y] = P(l - 1, top), [b0x, b0y] = P(l - 1, bot), [a1x, a1y] = P(l, top), [b1x, b1y] = P(l, bot);
        const lead = 34, tail = 10;
        const off = (x, y, d) => (ph ? [x, y + d] : [x + d, y]);
        const [aSx, aSy] = off(a0x, a0y, lead), [bSx, bSy] = off(b0x, b0y, lead), [aEx, aEy] = off(a1x, a1y, -tail), [bEx, bEy] = off(b1x, b1y, -tail);
        out.push(g({},
          line(a0x, a0y, a1x, a1y, { cls }), line(b0x, b0y, b1x, b1y, { cls }),
          line(aSx, aSy, bEx, bEy, { cls }), line(bSx, bSy, aEx, aEy, { cls }),
          ph ? text(b0x + 5, b0y + 18, W8(tw), { anchor: 'start', cls: hi ? 'k-num-accent' : 'k-num', style: 'font-size:14px' }) : text(b0x + 4, b0y - 8, W8(tw), { anchor: 'start', cls: hi ? 'k-num-accent' : 'k-num', style: 'font-size:15px' }),
          ph ? text(b1x + 4, b1y - 6, M, { anchor: 'start', cls: 'k-tick' }) : text(b1x - 12, b1y + 14, M, { cls: 'k-tick' })));
      }
    }
    range(0, 3).forEach(c => range(0, 7).forEach(p => { const [x, y] = P(c, p); out.push(circle(x, y, 3, { cls: c === 3 && (p === 1 || p === 5) ? 'l13-mk-accent' : 'l13-mk' })); }));
    range(0, 7).forEach(p => {
      const [xi, yi] = P(0, p), [xo, yo] = P(3, p), hi = p === 1 || p === 5;
      if (ph) {
        out.push(text(xi, yi - 30, String(p), { cls: 'k-tick' }), text(xi, yi - 12, `x[${BR[p]}]`, { cls: 'k-num', style: 'font-size:11px' }),
          text(xo, yo + 20, `X[${p}]`, { cls: hi ? 'k-num-accent' : 'k-num', style: 'font-size:11px' }));
      } else {
        out.push(text(26, yi + 4, String(p), { cls: 'k-tick' }), text(xi - 12, yi + 4, `x[${BR[p]}]`, { anchor: 'end', cls: 'k-num' }),
          text(xo + 12, yo + 4, `X[${p}]`, { anchor: 'start', cls: hi ? 'k-num-accent' : 'k-num' }));
      }
    });
    if (ph) {
      out.push(text(14, 30, 'position', { anchor: 'start', cls: 'k-tick' }));
      [1, 2, 3].forEach(l => { const y = (lay(l - 1) + lay(l)) / 2; out.push(text(6, y - 4, 'layer', { anchor: 'start', cls: 'k-tick' }), text(6, y + 10, String(l), { anchor: 'start', cls: 'k-tick' })); });
      out.push(text(180, 600, 'inputs in a shuffled order, explained below', { cls: 'k-tick' }), text(180, 618, 'W₈ᵏ: the wheel’s arrow, k × 45° back; −: subtract', { cls: 'k-tick' }), text(180, 636, 'thickest lines: the bin 1 / bin 5 butterfly', { cls: 'k-tick' }));
    } else {
      out.push(text(26, 40, 'position', { cls: 'k-tick' }));
      [1, 2, 3].forEach(l => out.push(text((lay(l - 1) + lay(l)) / 2, 40, `layer ${l}`, { cls: 'k-name' })));
      out.push(text(lay(0) - 12, 40, 'input', { anchor: 'end', cls: 'k-tick' }), text(lay(3) + 12, 40, 'bin', { anchor: 'start', cls: 'k-tick' }));
      out.push(text(360, 384, 'W₈ᵏ: the 8-sample wheel’s arrow, k × 45° back · −: subtract this leg', { cls: 'k-tick' }),
        text(360, 404, 'inputs in a shuffled order, explained below · thick: the bin 1 / bin 5 butterfly', { cls: 'k-tick' }));
    }
    return out;
  };

  const growth = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 66, y: 46, w: 270, h: 230, xs: [3, 10], ys: [1, 7] }) : plot({ x: 110, y: 46, w: 500, h: 250, xs: [3, 10], ys: [1, 7] });
    const Ns = range(3, 10), dir = n => Math.log10(2 * 2 ** n * 2 ** n), fft = n => Math.log10(2 * 2 ** n * n);
    const poly = fn => path(Ns.map((n, i) => `${i ? 'L' : 'M'}${r2(P.X(n))} ${r2(P.Y(fn(n)))}`).join(''), { cls: 'k-curve' });
    const polyF = path(Ns.map((n, i) => `${i ? 'L' : 'M'}${r2(P.X(n))} ${r2(P.Y(fft(n)))}`).join(''), { cls: 'k-curve-accent' });
    const yT = ph ? [[1, '10'], [3, '1,000'], [5, '100,000']] : [[1, '10'], [2, '100'], [3, '1,000'], [4, '10,000'], [5, '100,000'], [6, '1,000,000'], [7, '10,000,000']];
    const xT = (ph ? [3, 5, 8, 10] : Ns).map(n => [n, n0(2 ** n)]);
    const ratio = (n, s, side) => {
      const x = P.X(n) + (side === 'left' ? -10 : 10);
      return g({}, line(x, P.Y(dir(n)) + 4, x, P.Y(fft(n)) - 4, { cls: 'l13-bracket' }),
        text(x + (side === 'left' ? -6 : 6), (P.Y(dir(n)) + P.Y(fft(n))) / 2 + 4, s, { anchor: side === 'left' ? 'end' : 'start', cls: 'k-num' }));
    };
    return [
      axes(P, { yTicks: yT, xTicks: xT, zero: false, grid: true }),
      text(P.x0, 26, ph ? 'multiplications per block (log, from 10)' : 'multiplications per block (log scale, from 10)', { anchor: 'start', cls: 'k-tick' }),
      text(P.x1, P.y1 + 36, ph ? 'N, samples (log, from 8)' : 'N, samples per block (log scale, from 8)', { anchor: 'end', cls: 'k-tick' }),
      poly(dir), Ns.map(n => marker('circle', P.X(n), P.Y(dir(n)))),
      polyF, Ns.map(n => marker('square', P.X(n), P.Y(fft(n)), 'accent')),
      ratio(3, '', 'right'), text(P.X(3) + 16, P.y1 - 8, ph ? '2.7×' : '2.7 times fewer', { anchor: 'start', cls: 'k-num' }), ratio(8, ph ? '32×' : '32 times fewer', 'right'), ratio(10, '', ph ? 'left' : 'right'),
      text(P.X(10) + (ph ? -16 : 16), (P.Y(dir(10)) + P.Y(fft(10))) / 2 + (ph ? 16 : -4), ph ? '102×' : '102 times', { anchor: ph ? 'end' : 'start', cls: 'k-num' }), ph ? '' : text(P.X(10) + 16, (P.Y(dir(10)) + P.Y(fft(10))) / 2 + 12, 'fewer', { anchor: 'start', cls: 'k-num' }),
      ph ? key(20, 340, [[keyLine('k-curve', 'circle'), 'direct DFT, 2 × N × N'], [keyLine('k-curve-accent', 'square', 'accent'), 'FFT, 2 × N × log₂ N']], { cols: 1, dy: 24 })
        : key(110, 356, [[keyLine('k-curve', 'circle'), 'direct DFT, 2 × N × N'], [keyLine('k-curve-accent', 'square', 'accent'), 'FFT, 2 × N × log₂ N']], { dx: 280 }),
    ];
  };

  const bitReverse = L => {
    const ph = L.phone, bits = n => n.toString(2).padStart(3, '0'), rev = n => parseInt(bits(n).split('').reverse().join(''), 2);
    const y = i => (ph ? 76 : 70) + i * (ph ? 38 : 32);
    const lx = ph ? 120 : 250, rx = ph ? 240 : 470;
    const out = [
      text(lx, ph ? 44 : 40, 'sample', { anchor: 'end', cls: 'k-name' }), text(rx, ph ? 44 : 40, 'position', { anchor: 'start', cls: 'k-name' }),
    ];
    range(0, 7).forEach(s => {
      const p = rev(s), hi = s === 4;
      out.push(text(lx - 46, y(s) + 4, String(s), { anchor: 'end', cls: hi ? 'k-num-accent' : 'k-num' }), text(lx, y(s) + 4, bits(s), { anchor: 'end', cls: hi ? 'k-num-accent' : 'k-num' }),
        text(rx, y(s) + 4, bits(s), { anchor: 'start', cls: s === 1 ? 'k-num-accent' : 'k-num' }), text(rx + 46, y(s) + 4, String(s), { anchor: 'start', cls: s === 1 ? 'k-num-accent' : 'k-num' }),
        vec(lx + 10, y(s), rx - 12, y(p), { tone: hi ? 'accent' : 'soft-solid', s: 8 }));
    });
    if (ph) out.push(text(180, 400, 'position 1 is 001; backwards, 100 is 4', { cls: 'k-tick' }), text(180, 418, 'so sample 4 enters at position 1', { cls: 'k-tick' }));
    else out.push(text(lx - 46, y(8) + 6, 'n', { anchor: 'end', cls: 'k-tick' }), text(lx, y(8) + 6, 'binary', { anchor: 'end', cls: 'k-tick' }),
      text(rx, y(8) + 6, 'binary', { anchor: 'start', cls: 'k-tick' }), text(rx + 46, y(8) + 6, 'p', { anchor: 'start', cls: 'k-tick' }),
      text(360, y(8) + 34, 'each sample goes to the position whose bits are its own, read backwards: 100 (sample 4) to 001 (position 1)', { cls: 'k-tick' }));
    return out;
  };

  const bins256 = L => {
    const ph = L.phone;
    const tones = [[697, 22], [770, 25], [852, 27], [941, 30], [1209, 39], [1336, 43], [1477, 47], [1633, 52]];
    const panel = (x0, w, f0, f1, y0, list, nameY) => {
      const X = f => x0 + (f - f0) / (f1 - f0) * w, axisY = y0 + 150, tonesIn = list;
      const out = [];
      const bins = range(Math.ceil(f0 / 31.25), Math.floor(f1 / 31.25));
      const toneBins = tonesIn.map(t => t[1]);
      bins.forEach(b => { if (b > Math.min(...toneBins) && b < Math.max(...toneBins) && !toneBins.includes(b)) out.push(rect(X(b * 31.25 - 15.625), y0 + 70, X(31.25) - X(0), axisY - y0 - 70, { cls: 'l13-shade' })); });
      range(Math.ceil(f0 / 39.0244), Math.floor(f1 / 39.0244)).forEach(b => out.push(line(X(b * 39.0244), y0 + 6, X(b * 39.0244), y0 + 26, { cls: 'k-curve-soft' })));
      out.push(line(x0, y0 + 16, x0 + w, y0 + 16, { cls: 'k-grid' }));
      out.push(line(x0, axisY, x0 + w, axisY, { cls: 'k-axis' }));
      bins.forEach(b => out.push(line(X(b * 31.25), axisY - 8, X(b * 31.25), axisY + (toneBins.includes(b) ? 8 : 4), { cls: 'k-axis' })));
      tonesIn.forEach(([f, b], i) => {
        const hi = f === 770, ty = y0 + 70 - (ph && i % 2 ? 0 : 0);
        out.push(line(X(f), ty + 6, X(b * 31.25), axisY - 10, { cls: 'l13-leader' }), circle(X(f), ty, 5, { cls: hi ? 'l13-mk-accent' : 'l13-mk' }),
          text(X(f), ty - 12, n0(f), { cls: hi ? 'k-num-accent' : 'k-num', style: ph ? 'font-size:11px' : undefined }),
          text(X(b * 31.25), axisY + 22, String(b), { cls: 'k-tick' }));
      });
      out.push(text(x0 + w, axisY + 40, nameY, { anchor: 'end', cls: 'k-tick' }));
      return [out, X];
    };
    if (ph) {
      const [a, Xa] = panel(40, 290, 670, 970, 40, tones.slice(0, 4), 'row tones, Hz (from 670)');
      const [b] = panel(40, 290, 1180, 1660, 280, tones.slice(4), 'column tones, Hz (from 1,180)');
      return [a, b,
        text(40, 30, 'dashed: N = 205 bins, for comparison', { anchor: 'start', cls: 'k-tick' }),
        text(40, 500, '770 Hz: 0.36 bin from bin 25', { anchor: 'start', cls: 'k-num-accent', style: 'font-size:11px' }),
        text(40, 524, 'numbers under the axis: bins at N = 256', { anchor: 'start', cls: 'k-tick' }),
        key(30, 554, [[keySwatch('l13-shade'), 'an empty bin between two tones']], { cols: 1 })];
    }
    const [p, X] = panel(50, 630, 650, 1650, 50, tones, 'Hz (axis from 650); ticks: bins at N = 256, every 31.25 Hz');
    return [p,
      text(50, 46, 'bins at N = 205, every 39.02 Hz (dashed, for comparison)', { anchor: 'start', cls: 'k-tick' }),
      text(50, 290, '770 Hz sits 0.36 bin (11.25 Hz) from bin 25, the farthest any tone sits from its bin', { anchor: 'start', cls: 'k-num-accent' }),
      key(50, 326, [[(x, y) => g({}, line(x + 13, y - 8, x + 13, y + 8, { cls: 'k-axis' })), 'bin at N = 256'], [keySwatch('l13-shade'), 'empty bin'], [(x, y) => circle(x + 13, y, 5, { cls: 'l13-mk' }), 'keypad tone'], [(x, y) => line(x + 13, y - 8, x + 13, y + 8, { cls: 'k-curve-soft' }), 'bin at N = 205']], { dx: 160 })];
  };

  const budget = L => {
    const ph = L.phone;
    const rows = range(0, 8).map(s => { const m = 256 >> s, small = m > 1 ? (2 ** s) * 2 * m * m : 0, bf = s * 512; return { s, small, bf, total: small + bf, fits: small + bf <= 32000 }; });
    const seg = fits => (fits ? 'l13-solid' : 'l13-hollow');
    const dots = (x, y, w, h) => g({}, rect(x, y, w, h, { fill: `url(#${L.slug}-dots)` }), rect(x, y, w, h, { cls: 'l13-dots-edge' }));
    const keyItems = [[keySwatch('l13-solid'), 'small DFTs, fits'], [keySwatch('l13-hollow'), 'small DFTs, over'], [(x, y) => dots(x + 4, y - 7, 18, 14), 'butterfly multiplications']];
    const out = [];
    if (ph) {
      const P = plot({ x: 44, y: 60, w: 250, h: 360, xs: [0, 140000], ys: [-0.6, 8.6] });
      const bh = 24;
      rows.forEach(r => {
        const yc = P.y0 + (r.s + 0.5) / 9.2 * P.h, y = yc - bh / 2, xs = P.X(0), xm = P.X(r.small), xe = P.X(r.total);
        if (r.small) out.push(rect(xs, y, xm - xs, bh, { cls: seg(r.fits) }));
        if (r.bf) out.push(dots(xm, y, Math.max(xe - xm, 2), bh));
        out.push(masked(Math.max(xe, xs + 2) + 6, yc + 4, n0(r.total), { anchor: 'start', cls: r.fits ? 'k-num' : 'k-tick', size: 12 }), text(xs - 8, yc + 4, String(r.s), { anchor: 'end', cls: 'k-tick' }));
      });
      out.push(line(P.X(0), P.y0 - 6, P.X(0), P.y1 + 6, { cls: 'k-axis' }), line(P.X(0), P.y1 + 6, P.X(140000), P.y1 + 6, { cls: 'k-axis' }));
      [[0, '0'], [50000, '50,000'], [100000, '100,000']].forEach(([v, t]) => out.push(line(P.X(v), P.y1 + 6, P.X(v), P.y1 + 12, { cls: 'k-axis' }), text(P.X(v), P.y1 + 26, t, { cls: 'k-tick' })));
      out.unshift(line(P.X(32000), P.y0 - 14, P.X(32000), P.y1 + 6, { cls: 'k-curve-soft' }), text(P.X(32000) + 4, P.y0 - 18, '32,000: the budget', { anchor: 'start', cls: 'k-num' }));
      out.push(text(14, 24, 'splits at N = 256, multiplications per block', { anchor: 'start', cls: 'k-tick' }), text(P.x1, P.y1 + 44, 'axis from 0', { anchor: 'end', cls: 'k-tick' }),
        text(20, P.y1 + 72, '205 = 5 × 41: no split at all', { anchor: 'start', cls: 'k-label' }),
        key(20, P.y1 + 102, [...keyItems, [keyLine('k-curve-soft'), 'the chip’s budget']], { cols: 1, dy: 22 }));
      return [dotsDef(L.slug), out];
    }
    const P = plot({ x: 110, y: 50, w: 470, h: 250, xs: [-0.6, 8.6], ys: [0, 140000] });
    const bw = 30;
    rows.forEach(r => {
      const x = P.X(r.s) - bw / 2, yb = P.Y(0), ym = P.Y(r.small), ye = P.Y(r.total);
      if (r.small) out.push(rect(x, ym, bw, yb - ym, { cls: seg(r.fits) }));
      if (r.bf) out.push(dots(x, ye, bw, Math.max(ym - ye, 2)));
      out.push(text(P.X(r.s), Math.min(ye, yb - 2) - 8, n0(r.total), { cls: r.fits ? 'k-num' : 'k-tick', style: 'font-size:11px' }));
    });
    out.push(axes(P, { yTicks: [[0, '0'], [50000, '50,000'], [100000, '100,000']], xTicks: range(0, 8).map(s => [s, String(s)]), zero: false }));
    out.push(line(P.x0, P.Y(32000), P.x1 + 10, P.Y(32000), { cls: 'k-curve-soft' }), text(P.x1 + 14, P.Y(32000) + 4, '32,000:', { anchor: 'start', cls: 'k-num' }), text(P.x1 + 14, P.Y(32000) + 20, 'the chip’s budget', { anchor: 'start', cls: 'k-tick' }), text(P.x1 + 14, P.Y(32000) + 34, 'per block', { anchor: 'start', cls: 'k-tick' }));
    out.push(text(P.x0, 30, 'multiplications per block (from 0)', { anchor: 'start', cls: 'k-tick' }), text(P.x1, P.y1 + 36, 'splits, at N = 256', { anchor: 'end', cls: 'k-tick' }),
      text(P.x1 + 14, 60, '205 = 5 × 41:', { anchor: 'start', cls: 'k-label' }), text(P.x1 + 14, 76, 'no split at all', { anchor: 'start', cls: 'k-label' }));
    out.push(key(40, 372, keyItems, { dx: 200 }));
    return [dotsDef(L.slug), out];
  };
  const dotsDef = slug => `<defs><pattern id="${slug}-dots" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" class="l13-dots-bg"/><circle cx="2.5" cy="2.5" r="1.1" class="l13-dots-dot"/></pattern></defs>`;

  const wrapWheel = L => {
    const ph = L.phone;
    const wheel = (k, cx, cy, r) => {
      const dirs = {};
      range(0, 3).forEach(n => { const a = (90 * k * n) % 360; (dirs[a] = dirs[a] || []).push(n); });
      return g({}, line(cx - r - 8, cy, cx + r + 8, cy, { cls: 'k-grid' }), line(cx, cy - r - 8, cx, cy + r + 8, { cls: 'k-grid' }), circle(cx, cy, r, { cls: 'l13-ring' }),
        Object.entries(dirs).map(([a, ns]) => {
          const [x, y] = at(cx, cy, r, Number(a)), [lx, ly] = at(cx, cy, r + 16, Number(a));
          const anchor = Number(a) === 0 ? 'start' : Number(a) === 180 ? 'end' : 'middle';
          const lab = ns.length === 4 ? 'all 4' : ns.join(', ');
          return g({}, vec(cx, cy, x, y, { s: 8, tone: k >= 4 ? 'accent' : '' }), text(Number(a) === 0 ? lx - 10 : Number(a) === 180 ? lx + 10 : lx, ly + (Number(a) === 90 ? 10 : Number(a) === 270 ? 0 : 4), lab, { anchor, cls: 'k-tick' }));
        }));
    };
    const sub = k => (k < 4 ? `${k * 90}° back per sample` : `${k * 90}° = 360° + ${(k - 4) * 90}°`);
    const out = [];
    if (ph) {
      range(0, 3).forEach(k => {
        const y = 100 + k * 170;
        out.push(step(k * 2 + 1, `bin ${k}: ${k * 90} degrees back per sample`, g({ anim: { k: 'in', d: k * 0.8, len: 0.6 } }, text(90, y - 64, `bin ${k}`, { cls: 'k-name' }), text(90, y + 70, sub(k), { cls: 'k-tick' }), wheel(k, 90, y, 32))),
          step(k * 2 + 2, `bin ${k + 4}: ${(k + 4) * 90} degrees, lands on bin ${k}`, g({ anim: { k: 'in', d: 3.4 + k * 0.8, len: 0.6 } }, text(270, y - 64, `bin ${k + 4}`, { cls: 'k-name' }), text(270, y + 70, sub(k + 4), { cls: 'k-tick' }), wheel(k + 4, 270, y, 32), text(180, y + 5, '=', { cls: 'k-name' }))));
      });
      out.push(text(180, 716, 'a 4-sample wheel; numbers: which samples point there', { cls: 'k-tick' }));
      return out;
    }
    range(0, 7).forEach(k => {
      const c = k % 4, row = Math.floor(k / 4), cx = 120 + c * 160, cy = row ? 344 : 130;
      out.push(step(k + 1, `bin ${k}: ${k * 90} degrees back per sample${k >= 4 ? `, same arrows as bin ${k - 4}` : ''}`,
        g({ anim: { k: 'in', d: k * 0.8, len: 0.6 } }, text(cx, cy - 74, `bin ${k}`, { cls: 'k-name' }), text(cx, cy + 80, sub(k), { cls: 'k-tick' }), wheel(k, cx, cy, 38))));
    });
    range(0, 3).forEach(c => out.push(text(120 + c * 160, 240, '= same arrows', { cls: 'k-name' })));
    out.push(text(360, 456, 'a 4-sample wheel; numbers at each arrow: which samples point there', { cls: 'k-tick' }));
    return out;
  };

  const goertzelS = (f, N = 205, k = 20) => {
    const c = 2 * Math.cos(2 * Math.PI * k / N); let s1 = 0, s2 = 0; const out = [];
    for (let n = 0; n < N; n++) { const x = f.reduce((a, t) => a + Math.cos(2 * Math.PI * t * n / 8000), 0); const s = x + c * s1 - s2; s2 = s1; s1 = s; out.push(s); }
    return out;
  };
  const S5 = goertzelS([770, 1336]), SW = goertzelS([1336]);

  const goertzelSwing = L => {
    const ph = L.phone, th = 360 * 20 / 205;
    const cx = ph ? 120 : 120, cy = ph ? 150 : 170, R = ph ? 70 : 72;
    const [px, py] = at(cx, cy, R, -th), [qx, qy] = at(cx, cy, R, th);
    const cross = (x, y) => g({}, line(x - 6, y - 6, x + 6, y + 6, { cls: 'l13-pole' }), line(x + 6, y - 6, x - 6, y + 6, { cls: 'l13-pole' }));
    const circ = [
      text(ph ? 20 : 24, ph ? 34 : 40, 'the pole pair on the unit circle', { anchor: 'start', cls: 'k-name' }),
      line(cx - R - 14, cy, cx + 2 * R * Math.cos(rad(th)) + 4, cy, { cls: 'k-axis' }), line(cx, cy - R - 14, cx, cy + R + 14, { cls: 'k-axis' }),
      circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' }),
      step(1, 'poles at bin 20’s point, 35.1 degrees up, and at its mirror',
        g({ anim: { k: 'in', d: 0 } }, cross(px, py), cross(qx, qy),
          text(px + 4, py - 12, 'p: 35.1° up', { anchor: 'start', cls: 'k-num' }), text(qx + 4, qy + 22, 'p̄: its mirror', { anchor: 'start', cls: 'k-num' }))),
      step(2, 'p plus its mirror: the up-down parts cancel, leaving 1.636 on the horizontal axis',
        g({ anim: { k: 'in', d: 1 } }, vec(cx, cy, px, py, { tone: 'soft-solid', s: 8 }), vec(px, py, px + (qx - cx), py + (qy - cy), { tone: 'soft-solid', s: 8 }),
          vec(cx, cy + 3, cx + 2 * R * Math.cos(rad(th)), cy + 3, { s: 9 }),
          text(cx + 2 * R * Math.cos(rad(th)) + 8, cy + 4, ph ? '1.636' : 'p + p̄ = 1.636', { anchor: 'start', cls: 'k-num' }))),
      text(ph ? 20 : 24, cy + R + (ph ? 48 : 52), 'up-down parts cancel: 2 × cos 35.1°', { anchor: 'start', cls: 'k-tick' }),
    ];
    const P = ph ? plot({ x: 54, y: 340, w: 270, h: 220, xs: [0, 204], ys: [-190, 190] }) : plot({ x: 370, y: 60, w: 310, h: 240, xs: [0, 204], ys: [-190, 190] });
    const poly = (s, cls, anim) => path(s.map((v, n) => `${n ? 'L' : 'M'}${r2(P.X(n))} ${r2(P.Y(v))}`).join(''), { cls, ...(anim ? { pathLength: 1, anim } : {}) });
    const note = (n, v, s, dx = 0, dy = -10, anchor = 'middle') => g({}, circle(P.X(n), P.Y(v), 3, { cls: 'l13-mk' }), text(P.X(n) + dx, P.Y(v) + dy, s, { anchor, cls: 'k-num', style: 'font-size:11px' }));
    const i10 = S5.slice(0, 10).reduce((b, v, i) => (Math.abs(v) > Math.abs(S5[b]) ? i : b), 0);
    const i100 = range(95, 105).reduce((b, i) => (Math.abs(S5[i]) > Math.abs(S5[b]) ? i : b), 95);
    const plotPart = [
      text(P.x0, P.y0 - 20, 's[n], the filter’s output', { anchor: 'start', cls: 'k-name' }),
      axes(P, { yTicks: [[150, '150'], [0, '0'], [-150, `${M}150`]], xTicks: [[0, 'n = 0'], [100, '100'], [204, '204']] }),
      step(3, 'key 5 pushes the ring up steadily: a swing of about 8.5 in the first ten samples, 90 around sample 100, 158 near the end',
        g({}, poly(S5, 'k-curve', { k: 'draw', d: 2, len: 3 }),
          g({ anim: { k: 'in', d: 4.6 } }, circle(P.X(i10), P.Y(S5[i10]), 3, { cls: 'l13-mk' }), line(P.X(i10), P.Y(S5[i10]) - 5, P.X(i10), P.Y(48), { cls: 'l13-leader' }), text(P.X(i10), P.Y(48) - 6, `${M}8.5`, { cls: 'k-num', style: 'font-size:11px' }),
            note(i100, S5[i100], '90', 0, S5[i100] > 0 ? -10 : 20), circle(P.X(203), P.Y(S5[203]), 3, { cls: 'l13-mk' }), text(P.X(203) - 8, P.Y(S5[203]) + 4, `${M}158`, { anchor: 'end', cls: 'k-num', style: 'font-size:11px' }), marker('circle', P.X(204), P.Y(S5[204]))))),
      step(4, 'a tone at the wrong speed, 1,336 Hz alone, stays small',
        g({ anim: { k: 'in', d: 5.4 } }, poly(SW, 'k-curve-soft'), marker('square', P.X(204), P.Y(SW[204]), 'soft'))),
      ph ? key(20, 610, [[keyLine('k-curve', 'circle'), 'key 5, 770 + 1,336 Hz'], [keyLine('k-curve-soft', 'square', 'soft'), '1,336 Hz alone: wrong speed']], { cols: 1, dy: 22 })
        : key(370, 352, [[keyLine('k-curve', 'circle'), 'key 5 (770 + 1,336 Hz), bin 20 filter'], [keyLine('k-curve-soft', 'square', 'soft'), '1,336 Hz alone: the wrong speed']], { cols: 1, dy: 22 }),
    ];
    return [circ, plotPart];
  };

  const goertzelFinal = L => {
    const ph = L.phone, sc = ph ? 1.15 : 1.45;
    const ox = ph ? 30 + 175 * sc : 40 + 175 * sc, oy = ph ? 60 + 105 * sc : 60 + 105 * sc;
    const X = v => ox + v * sc, Y = v => oy - v * sc;
    const a = -117.189, wr = -129.345, wi = 90.979, yr = 12.157, yi = -90.979, th = 360 * 20 / 205, rB = 158.14 * sc;
    const out = [
      line(X(-175), oy, X(40), oy, { cls: 'k-axis' }), line(ox, Y(105), ox, Y(-105), { cls: 'k-axis' }),
      text(ox + 6, Y(105) + 10, 'up', { anchor: 'start', cls: 'k-tick' }),
      arcArrow(ox, oy, rB, 180, 180 + th, { tone: 'soft', cls: 'l13-arc' }),
      text(...at(ox, oy, rB - 16, 180 + th / 2), '35.1° back', { anchor: 'start', cls: 'k-tick' }),
      circle(X(-158.14), oy, 4, { cls: 'l13-mk-soft' }),
      text(X(-158.14) + 6, oy - 12, ph ? `${M}158.1` : `s[N${M}2] = ${M}158.1`, { anchor: 'start', cls: 'k-tick' }),
      vec(ox, oy, X(wr), Y(wi), { tone: 'soft', s: 9 }),
      vec(ox, oy, X(a), oy, { s: 10, cls: 'l13-thick' }),
      text((ox + X(a)) / 2, oy - 10, `s[N${M}1]`, { cls: 'k-num' }),
      vec(X(a), oy, X(a - wr), Y(-wi), { s: 10 }),
      vec(ox, oy, X(yr), Y(yi), { tone: 'accent', s: 11 }),
      text(X(yr) + 8, Y(yi) + 4, '91.8', { anchor: 'start', cls: 'k-num-accent' }),
    ];
    const notes = [
      ['1', `s[N${M}1] = ${M}117.2, the last output`, 'k-num'],
      ['2', `s[N${M}2] = ${M}158.1, turned back 35.1°:`, 'k-num'],
      ['', `${M}129.3 right, 91.0 up (dashed)`, 'k-num'],
      ['3', 'subtract it, tip to tail:', 'k-num'],
      ['', `12.2 right, 91.0 down`, 'k-num'],
      ['4', 'length 91.8: the match of bin 20', 'k-num-accent'],
    ];
    const [nx, ny, dy] = ph ? [20, 330, 19] : [400, 110, 24];
    notes.forEach(([n, s, c], i) => out.push(text(nx, ny + i * dy, n, { anchor: 'start', cls: 'k-tick' }), text(nx + 18, ny + i * dy, s, { anchor: 'start', cls: c })));
    out.push(text(ph ? 20 : 40, ph ? 30 : 34, ph ? `bin 20 at N = 205` : `the last step of Goertzel for bin 20 at N = 205`, { anchor: 'start', cls: 'k-label' }));
    out.push(text(nx, ny + notes.length * dy + (ph ? 10 : 16), 'dashed: the turned arrow, drawn from', { anchor: 'start', cls: 'k-tick' }), text(nx, ny + notes.length * dy + (ph ? 26 : 32), 'the centre for comparison', { anchor: 'start', cls: 'k-tick' }));
    return out;
  };

  const crossover = L => {
    const ph = L.phone;
    const P = ph ? plot({ x: 60, y: 46, w: 280, h: 220, xs: [0, 20], ys: [0, 6000] }) : plot({ x: 100, y: 46, w: 520, h: 230, xs: [0, 20], ys: [0, 6000] });
    const bs = range(0, 20, 2);
    return [
      axes(P, { yTicks: [[0, '0'], [2000, '2,000'], [4096, '4,096'], [6000, '6,000']], xTicks: (ph ? [0, 8, 16, 20] : [0, 4, 8, 12, 16, 20]).map(b => [b, String(b)]), zero: false, grid: true }),
      text(P.x0, 26, ph ? 'multiplications, N = 256 (from 0)' : 'multiplications per block, N = 256 (from 0)', { anchor: 'start', cls: 'k-tick' }),
      text(P.x1, P.y1 + 36, 'bins computed (from 0)', { anchor: 'end', cls: 'k-tick' }),
      line(P.X(8), P.y0, P.X(8), P.y1, { cls: 'k-guide' }),
      text(P.X(8) + 6, P.y0 + 12, ph ? '8 keypad bins' : 'the 8 keypad bins', { anchor: 'start', cls: 'k-tick' }),
      path(`M${P.X(0)} ${P.Y(0)}L${P.X(20)} ${P.Y(5160)}`, { cls: 'k-curve' }), bs.map(b => marker('tri', P.X(b), P.Y(258 * b))),
      path(`M${P.X(0)} ${P.Y(4096)}L${P.X(20)} ${P.Y(4096)}`, { cls: 'k-curve-accent' }), bs.map(b => marker('square', P.X(b), P.Y(4096), 'accent')),
      text(P.X(8) + 8, P.Y(2064) + 18, '2,064', { anchor: 'start', cls: 'k-num' }),
      text(P.X(16) + 8, P.Y(4128) + 18, '4,128', { anchor: 'start', cls: 'k-num' }),
      line(P.X(15.88), P.Y(4096) + 8, P.X(15.88), P.y1, { cls: 'k-guide' }),
      text(P.X(15.88) - 6, P.y1 - 10, ph ? '15.9' : 'crossing: 15.9 bins', { anchor: 'end', cls: 'k-num-accent' }),
      ph ? key(20, 330, [[keyLine('k-curve', 'tri'), 'Goertzel, 258 per bin'], [keyLine('k-curve-accent', 'square', 'accent'), 'FFT, 4,096 for every bin']], { cols: 1, dy: 22 })
        : key(100, 340, [[keyLine('k-curve', 'tri'), 'Goertzel, 258 per bin'], [keyLine('k-curve-accent', 'square', 'accent'), 'FFT, 4,096 for all bins']], { dx: 260 }),
    ];
  };

  const CSS = `.k-fig .l13-vec { stroke: var(--ink); stroke-width: 2; }
.k-fig .l13-vec-accent { stroke: var(--accent); stroke-width: 2.5; }
.k-fig .l13-vec-soft { stroke: var(--ink-soft); stroke-width: 1.6; stroke-dasharray: 6 5; }
.k-fig .l13-vec-soft-solid { stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .l13-vec-faint { stroke: var(--ink-soft); stroke-width: 1.5; opacity: 0.45; }
.k-fig .l13-thick .l13-vec { stroke-width: 2.8; }
.k-fig .l13-head { fill: var(--ink); stroke: none; }
.k-fig .l13-head-accent { fill: var(--accent); stroke: none; }
.k-fig .l13-head-soft, .k-fig .l13-head-soft-solid { fill: var(--ink-soft); stroke: none; }
.k-fig .l13-head-faint { fill: var(--ink-soft); opacity: 0.45; stroke: none; }
.k-fig .l13-arc { stroke: var(--ink-soft); stroke-width: 1.5; fill: none; }
.k-fig .l13-arc-ink { stroke: var(--ink); stroke-width: 1.5; fill: none; }
.k-fig .l13-ring { fill: none; stroke: var(--rule); stroke-width: 1.2; }
.k-fig .l13-mk { fill: var(--ink); stroke: none; }
.k-fig .l13-mk-accent { fill: var(--accent); stroke: none; }
.k-fig .l13-mk-soft { fill: var(--paper); stroke: var(--ink-soft); stroke-width: 1.5; }
.k-fig .l13-empty { fill: var(--paper-2); }
.k-fig .l13-cell { fill: var(--ink-soft); opacity: 0.6; }
.k-fig .l13-gridline { stroke: var(--paper); stroke-width: 0.7; }
.k-fig .l13-clock { stroke: var(--ink); stroke-width: 3; }
.k-fig .l13-budget { fill: none; stroke: var(--ink); stroke-width: 2; stroke-dasharray: 6 5; }
.k-fig .l13-node { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .l13-cellbox { fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l13-link { fill: none; stroke: var(--ink-soft); stroke-width: 1.2; }
.k-fig .l13-net { stroke: var(--ink-soft); stroke-width: 1.2; }
.k-fig .l13-net-hi { stroke: var(--accent); stroke-width: 4.5; }
.k-fig .l13-bracket { stroke: var(--ink-soft); stroke-width: 1.2; }
.k-fig .l13-shade { fill: var(--paper-2); }
.k-fig .l13-leader { stroke: var(--ink-soft); stroke-width: 1; }
.k-fig .l13-solid { fill: var(--ink); }
.k-fig .l13-hollow { fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }
.k-fig .l13-dots-bg { fill: var(--paper); }
.k-fig .l13-dots-dot { fill: var(--ink); }
.k-fig .l13-dots-edge { fill: none; stroke: var(--ink); stroke-width: 1.2; }
.k-fig .l13-pole { stroke: var(--ink); stroke-width: 2.2; }`;

  const fig = (name, size, title, desc, caption, body, steps = 0) => ({ name, w: 720, h: size[0], phone: { w: 360, h: size[1] }, title, desc, caption, steps, css: CSS, eyebrow: 'Lesson 13 · the FFT', body: (kk, L) => body(L) });

  return [
    fig('multiply-cost', [300, 500], 'What a multiplication buys',
      'Turning a sample into an arrow takes two multiplications, x times c and x times d; turning an arrow by an arrow takes four, a times c minus b times d for the left-right part and a times d plus b times c for the up-down part.',
      'Each tile is one multiplication. A sample into an arrow costs two; an arrow turned by an arrow costs four.', multiplyCost),
    fig('work-grid', [440, 400], 'The bill for one block',
      'A grid of 103 bins by 205 samples, each cell two multiplications, 42,230 in all; by the time the next block arrives after 25.6 ms the chip has done 25,625 of them, about 61%, outlined.',
      'One row per bin, one column per sample. The dashed outline is what the chip finishes before the next block arrives: 25,625 of the 42,230 multiplications.', workGrid, 3),
    fig('back-wheel', [330, 470], 'Turning back, in degrees and radians',
      'Turned back, clockwise, from the right: 90 degrees points down, 180 left, 270 up; in radians π/2, π and 3π/2, with 360 degrees equal to 2π and 45 degrees equal to 2π ÷ 8.',
      'Back means clockwise. Each turn is written in degrees and in radians, where a full turn is 2π.', backWheel),
    fig('shared-arrows', [310, 560], 'Bins 1 and 5 share their arrows',
      'At each of samples 0 to 7, bin 1’s test wheel and bin 5’s: on the even samples the two arrows are identical, on the odd samples they point opposite ways.',
      'Bin 1 against bin 5, sample by sample. Even samples: the same arrow. Odd samples: flipped, half a turn apart.', sharedArrows, 8),
    fig('odd-walk', [300, 780], 'The odd part, by hand',
      'The four odd arrows, right, up, right, up, add to 2.83 at 45 degrees up; turned back 45 degrees it points right; added to the even part 2 it gives bin 1 = 4.83, subtracted it gives bin 5 = −0.83.',
      'In order: 1, the odd part laid tip to tail; 2, turned back the extra 45°; 3, added to the even part for bin 1 and subtracted for bin 5.', oddWalk, 5),
    fig('butterfly', [310, 470], 'One butterfly',
      'E[1] = 2 and O[1] = 2.83 at 45 degrees enter on the left; the odd leg is turned back 45 degrees by W₈¹ to 2.83 right; the crossing lines add it for X[1] = 4.83 and subtract it for X[5] = −0.83.',
      'The even and odd results come in, the odd one is turned, and the crossing lines add it for bin 1 and subtract it for bin 5. X[k] means bin k.', butterfly),
    fig('split-tree', [390, 450], 'Splitting all the way down',
      'An 8-sample block splits into even and odd samples, then again, down to single samples; the multiplications fall from 128 for the direct DFT to 80 after one split, 64 after two and 48 all the way, where only butterflies are left.',
      'Each level splits every block into its even and odd samples. The numbers count the multiplications if you stop splitting at that level.', splitTree, 5),
    fig('butterfly-network', [420, 650], 'The 8-sample FFT',
      'Three layers of four butterflies; the inputs enter at positions 0 to 7 in bit-reversed order, x[0], x[4], x[2], x[6], x[1], x[5], x[3], x[7]; each turn is labelled W₈ᵏ, and the bins X[0] to X[7] come out in order; the butterfly making bins 1 and 5 is highlighted.',
      'Read from the inputs to the bins: three layers of four butterflies, each turn labelled with the arrow it turns by. The thick butterfly is the one you computed by hand.', network),
    fig('growth', [390, 400], 'The FFT’s gain grows with N',
      'On log scales, the direct DFT’s 2N² multiplications climb from 128 at N = 8 to 2,097,152 at 1,024, while the FFT’s 2N log₂ N climbs from 48 to 20,480: 2.7 times fewer at 8, 32 at 256, 102 at 1,024.',
      'Both axes are on log scales: going up, each grid line is ten times the one below; going right, N doubles at each tick. The gap between the lines is how many times fewer multiplications the FFT needs.', growth),
    fig('bit-reverse', [380, 430], 'Bit-reversed order',
      'Samples 0 to 7 go to positions whose binary digits are their own read backwards: sample 4, 100, goes to position 1, 001.',
      'Write each sample number in binary and read it backwards: that is the position it enters the network at.', bitReverse),
    fig('bins-256', [350, 600], 'The keypad tones at N = 256',
      'On a frequency axis from 650 to 1,650 Hz with a bin every 31.25 Hz, the eight keypad tones fall on bins 22, 25, 27, 30, 39, 43, 47 and 52, with an empty bin between neighbors; 770 Hz is 0.36 bin from bin 25; the 205-sample bins, 39.02 Hz apart, are drawn dashed above for comparison.',
      'Each tone lands on its own bin with at least one empty bin between neighbors. The dashed ticks are the old 205-sample bins.', bins256),
    fig('budget', [400, 640], 'What each split costs',
      'On an axis from 0, multiplications per block at N = 256 after 0 to 8 splits: 131,072, 66,048, 33,792, 17,920, 10,240, 6,656, 5,120, 4,608 and 4,096, each split into small DFTs and butterfly multiplications, against a 32,000 budget line; three or more splits fit.',
      'Each bar is one choice of splits, on an ordinary axis from 0. Solid bars fit under the chip’s budget, hollow ones do not; the dotted part of each bar is the butterflies, which stay small.', budget),
    fig('wrap-wheel', [472, 736], 'A 4-sample DFT repeats after 4 bins',
      'For a 4-sample wheel, bins 0 to 3 turn back 0, 90, 180 and 270 degrees per sample; bins 4 to 7 turn back a full turn more, so their four sample arrows land exactly on those of bins 0 to 3.',
      'Bin k turns back k × 90° per sample. Bins 4 to 7 add a full turn, which does not count, so each lands on the bin four below it.', wrapWheel, 8),
    fig('goertzel-swing', [400, 680], 'Goertzel’s filter, pushed in time',
      'A pole pair on the unit circle at 35.1 degrees and its mirror, whose sum is 1.636 on the horizontal axis; fed key 5, the filter’s output swings to about −8.5 in the first ten samples, 90 around sample 100 and −158 near the end, while 1,336 Hz alone stays small.',
      'The pole pair and their sum, 2 × cos 35.1°, then the filter’s output, growing like a swing pushed in time, against a tone at the wrong speed.', goertzelSwing, 4),
    fig('goertzel-final', [380, 480], 'The last step of Goertzel',
      'The last output, −117.2, lies on the horizontal axis; the one before, −158.1, turned back 35.1 degrees, becomes the arrow −129.3 right, 91.0 up; subtracting it tip to tail lands at 12.2 right, 91.0 down, an arrow of length 91.8: the match of bin 20.',
      'Take the last output, subtract the one before it turned back one step of the test wheel, and the length of the result is the bin’s match.', goertzelFinal),
    fig('crossover', [360, 390], 'Goertzel against the FFT',
      'At N = 256, Goertzel costs 258 multiplications per bin, 2,064 for 8 bins and 4,128 for 16, against the FFT’s flat 4,096 for all bins; the lines cross at 15.9 bins.',
      'Goertzel pays per bin; the FFT pays once for all of them. Below about 16 bins Goertzel is cheaper.', crossover),
  ];
};
