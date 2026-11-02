(() => {
  const K = window.Kit, FS = 8000;
  const { fmt, hz, MINUS } = K;
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const r2 = v => Math.round(v * 100) / 100;
  const cosd = d => Math.cos(d * Math.PI / 180);
  const pctText = v => (v < 1e-12 ? '0%' : v < 0.005 ? 'under 1%' : v < 0.095 ? `${(Math.round(v * 1000) / 10).toString()}%` : `${Math.round(v * 100)}%`);
  const sf = v => fmt(v, 2).replace(/(\.\d)0$/, '$1');
  const s3 = v => fmt(v, 3).replace(/0+$/, '').replace(/\.$/, '.0');
  const list = xs => xs.map(v => fmt(v)).join(', ');
  const joinList = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

  const RAW = K.wav(window.LESSON_CALL);
  const PEAK = RAW.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
  const VOICE = RAW.map(s => 0.8 * s / PEAK);
  const CALL = VOICE.subarray(0, Math.round(4.16 * FS));
  const slow = (x, speed) => Float32Array.from({ length: Math.floor(x.length / speed) }, (_, i) => {
    const t = i * speed, a = Math.floor(t), f = t - a;
    return (x[a] || 0) * (1 - f) + (x[a + 1] || 0) * f;
  });
  const FAR = slow(CALL, 0.8).map(v => 0.7 * v);
  const LOOP = 14 * FS, FAR_AT = Math.round(6.5 * FS);
  const LOUD = (() => { let best = 0, at = 0; for (let i = 0; i + 48 < CALL.length; i += 8) { let e = 0; for (let j = 0; j < 48; j++) e += CALL[i + j] ** 2; if (e > best) { best = e; at = i; } } return at; })();

  const SO = [0, 0.7, 0.5, -0.3];
  const HI = [0.8, 0.4, -0.6, -0.2];

  const CASES = [
    { D: 2012, a: 0.34, b: 0.17, text: 'Today’s live call from the ticket. It runs on a rerouted line, and the box has drifted with the temperature, so the numbers measured earlier no longer fit. Wait for a quiet moment, send a click, work out this line’s h, then type its delay and two sizes into the canceller.' },
    { D: 2400, a: 0.3, b: 0.15, text: 'A line to a city farther away: its street-corner box sits at the end of a longer run. Measure it the same way.' },
    { D: 1760, a: 0.5, b: -0.1, text: 'A crackly old exchange with a louder leak. Its spill is not like the others: look at the sign.' },
    { D: 2960, a: 0.25, b: 0.25, text: 'A long-distance line whose box spills as much as it returns. Click, read, cancel.' },
  ];

  const taps = (D, a, b) => [[D, a], [D + 1, b]];
  const convAt = (x, tp, n, xAt = 0) => tp.reduce((s, [m, c]) => { const i = n - m - xAt; return s + (i >= 0 && i < x.length ? c * x[i] : 0); }, 0);

  function callSignal(c) {
    const ear = new Float32Array(LOOP), own = new Float32Array(LOOP);
    CALL.forEach((v, i) => { own[i] = v; });
    FAR.forEach((v, i) => { if (FAR_AT + i < LOOP) ear[FAR_AT + i] += v; });
    for (let n = 0; n < LOOP; n++) ear[n] += convAt(CALL, taps(c.D, c.a, c.b), n);
    return { ear, own };
  }

  const FAR_E = FAR.reduce((q, v) => q + v * v, 0);
  function farClean(c, g) {
    const tE = taps(c.D, c.a, c.b), tG = taps(g.d, g.s1, g.s2);
    let rr = 0;
    const lo = Math.min(c.D, g.d), hiN = Math.max(c.D, g.d) + CALL.length + 2;
    for (let n = lo; n <= hiN; n++) { const r = convAt(CALL, tE, n) - (g.on ? convAt(CALL, tG, n) : 0); rr += r * r; }
    return FAR_E / (FAR_E + rr);
  }

  function meterOf(sig, c, g) {
    const tE = taps(c.D, c.a, c.b), tG = taps(g.d, g.s1, g.s2);
    let ee = 0, rr = 0;
    if (sig === 'tone') {
      const x = n => cosd(45 * n), f = (tp, n) => tp.reduce((s, [m, k]) => s + k * x(n - m), 0);
      for (let n = 0; n < 800; n++) { const e = f(tE, n), r = e - (g.on ? f(tG, n) : 0); ee += e * e; rr += r * r; }
    } else {
      const x = sig === 'hi' ? HI : CALL;
      const lo = Math.min(c.D, g.d), hiN = Math.max(c.D, g.d) + x.length + 2;
      for (let n = lo; n <= hiN; n++) { const e = convAt(x, tE, n), r = e - (g.on ? convAt(x, tG, n) : 0); ee += e * e; rr += r * r; }
    }
    return ee > 0 ? rr / ee : 0;
  }

  function brokenAxis(A, parts, gap) {
    const count = parts.reduce((s, [a, b]) => s + b - a + 1, 0), unit = (A.w - gap * (parts.length - 1)) / count;
    let cur = A.x;
    const segs = parts.map(([a, b]) => { const s = { a, b, x0: cur, x1: cur + (b - a + 1) * unit }; cur = s.x1 + gap; return s; });
    const X = n => { const s = segs.find(q => n >= q.a && n <= q.b) || segs[segs.length - 1]; return s.x0 + (n - s.a + 0.5) * unit; };
    return { X, segs, unit };
  }
  function drawAxis(s, B, y) {
    const { pen, c } = s;
    B.segs.forEach((g, i) => {
      pen.line([[g.x0 - 2, y], [g.x1 + 2, y]], c.soft, 1);
      if (i) { const m = (B.segs[i - 1].x1 + g.x0) / 2; pen.line([[m - 6, y + 6], [m - 2, y - 6]], c.soft, 1); pen.line([[m + 2, y + 6], [m + 6, y - 6]], c.soft, 1); }
    });
  }
  function stem(s, x, y0, v, scale, { color, dash = [], r = 3.5, square = false, label = null, labelColor, size = 10, lift = 0 }) {
    const { pen } = s, y = y0 - v * scale;
    if (Math.abs(v) < 1e-9) { pen.ring(x, y0, 2.4, s.c.soft, 1.2); return; }
    pen.line([[x, y0], [x, y]], color, 2, dash);
    if (square) pen.rect(x - r, y - r, 2 * r, 2 * r, color); else pen.dot(x, y, r, color);
    if (label) pen.text(label, x, v >= 0 ? y - 9 - lift : y + 17 + lift, { color: labelColor || color, size });
  }

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('echo-lab').content.cloneNode(true));
    const uid = `${host.id}-`, $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = explore
      ? { word: SO.slice(), h: [0.4, 0.2], clicked: false, clickSize: 0.1, revealed: false, anim: 5, view: 'rows', col: 2002, pinned: null }
      : { predicted: false, clean: false, caseIx: 0, measured: null, noisy: false, d: 0, s1: 0, s2: 0, sig: 'call', on: true, own: true, solved: false, t0: performance.now() };
    const kase = () => CASES[st.caseIx];
    const guess = () => ({ d: st.d, s1: st.s1, s2: st.s2, on: st.on });

    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play'; $('now').textContent = nowText(); } });
    const loop = K.loop(host, dt => { st.anim = Math.min(5, st.anim + dt * 1.6); stage.redraw(); if (st.anim >= 5) loop.stop(); });

    const clock = () => ((performance.now() - st.t0) / 1000) % 14;
    const lineState = t => (t < 4.6 ? 'caller' : t >= 6.2 && t < 11.9 ? 'far' : 'quiet');
    const STATE_TEXT = { caller: 'The caller is talking: their echo is on the line.', far: 'The far person is talking.', quiet: 'Quiet moment: nobody is talking.' };

    function measuredH() {
      if (explore) return { taps: [[2000, st.h[0]], [2001, st.h[1]]], D: 2000, noise: null };
      const c = kase();
      if (st.noisy) return { taps: [], D: 1500 + (st.measured.at % 1000), noise: st.measured.noise };
      return { taps: taps(c.D, c.a, c.b), D: c.D, noise: null };
    }

    const hstage = K.stage($('hstage'), s => {
      const { pen, c, w, h } = s;
      const m = measuredH(), D = m.D, A = { x: 44, w: w - 56 };
      const parts = w < 480 ? [[0, 1], [D - 1, D + 3]] : [[0, 2], [D - 2, D + 3]];
      const B = brokenAxis(A, parts, 30);
      const have = explore ? st.clicked : Boolean(st.measured);
      const title = explore ? (w < 480 ? 'h[n]: what comes back ÷ click size' : 'h[n]: what comes back, divided by the click size')
        : (w < 480 ? 'what comes back from a click of 0.1' : 'what comes back from your click of 0.1 (not yet divided)');
      pen.text(title, 12, 16, { align: 'left', color: c.ink, size: 13, font: 'body', weight: 600 });
      const vals = [];
      parts.forEach(([a, b]) => { for (let n = a; n <= b; n++) {
        const hv = m.taps.reduce((q, [k, v]) => q + (k === n ? v : 0), 0);
        vals.push([n, explore ? hv : 0.1 * hv + (m.noise ? m.noise(n) : 0)]);
      } });
      const neg = have && vals.some(([, v]) => v < -1e-9);
      const top = 32, bottom = h - 58, maxV = Math.max(explore ? 0.5 : 0.05, ...vals.map(([, v]) => Math.abs(v)));
      const y0 = neg ? (top + h - 40) / 2 : bottom, scale = (neg ? (h - 40 - top) / 2 - 12 : bottom - top - 16) / maxV;
      drawAxis(s, B, y0);
      const tickY = neg ? h - 22 : y0 + 16;
      const ticks = w < 480 ? [0, D] : [0, 2, D - 2, D, D + 1, D + 3];
      if (have || explore) ticks.forEach(n => pen.text(hz(n), B.X(n), tickY, { color: c.soft, size: 10 }));
      pen.text(explore ? sf(maxV) : s3(maxV), A.x - 8, y0 - maxV * scale + 4, { align: 'right', color: c.soft, size: 10 });
      pen.line([[A.x - 4, y0 - maxV * scale], [A.x, y0 - maxV * scale]], c.soft, 1);
      if (!have) { pen.text('no click sent yet', w / 2, y0 - 30, { color: c.soft, size: 12 }); return; }
      vals.forEach(([n, v], i) => stem(s, B.X(n), y0, v, scale, { color: m.noise ? c.accent : c.ink, label: Math.abs(v) > 1e-9 ? (explore ? sf(v) : s3(v)) : null, labelColor: m.noise ? c.accentInk : c.ink, lift: w < 480 && i % 2 ? 11 : 0 }));
      if (!m.noise) {
        const xs = B.X(parts[0][0]), xe = B.X(D - 1), by = y0 + 28;
        pen.line([[xs, by], [xe, by]], c.soft, 1); pen.line([[xs, by - 4], [xs, by + 4]], c.soft, 1); pen.line([[xe, by - 4], [xe, by + 4]], c.soft, 1);
        pen.text(!explore ? 'silent samples' : w < 480 ? `${hz(D)} silent samples` : `n = 0 to ${hz(D - 1)}: ${hz(D)} silent samples`, (xs + xe) / 2, by + 14, { color: c.soft, size: 10 });
      }
    }, { height: () => 190 });

    function hWhy() {
      if (!explore) {
        if (!st.measured) return 'The click button sends a click of 0.1 from your equipment and plots what comes back. h is what comes back divided by the click size.';
        if (st.noisy) return `The ${st.measured.who === 'far' ? 'far person was talking' : 'caller’s own echo was on the line'}, at the moment you clicked, so that sound landed on top of the click’s echo: every number above is wrong. Wait for a quiet moment and click again.`;
        return 'A clean measurement: silence, then two small numbers, then silence for good. They are what a click of 0.1 brought back, not yet divided by 0.1. The canceller is unlocked.';
      }
      if (!st.clicked) return 'Optional: the questions already give h. Send a click to see it measured, and try other click sizes.';
      const cs = st.clickSize, [a, b] = st.h;
      const moved = !near(a, 0.4) || !near(b, 0.2) ? ` You changed the line with the h sliders below, so this is the new line’s h.` : '';
      if (near(cs, 0)) return 'A click of size 0 is silence: nothing comes back, and you learn nothing about the line.';
      const back = `A click of ${sf(cs)} brings back ${s3(a * cs)} and ${s3(b * cs)} at n = 2,000 and 2,001.`;
      if (near(cs, 1)) return `${back} A full-size click: what comes back is h itself, but it is a loud pop in someone’s ear.${moved}`;
      return `${back} The line is linear, so divide by ${sf(cs)}: the plot shows h = ${sf(a)}, ${sf(b)}, whatever the click size.${moved}`;
    }

    function rowsData() {
      const x = st.word, tp = [[2000, st.h[0]], [2001, st.h[1]]];
      const copies = x.map((v, k) => tp.map(([m, c]) => [m + k, v * c]));
      const sum = []; for (let n = 2000; n <= 2005; n++) sum.push(convAt(x, tp, n));
      return { copies, sum, tp };
    }

    const stage = K.stage($('stage'), s => {
      const { pen, c, w } = s;
      if (explore) return st.view === 'column' ? drawColumn(s) : drawRows(s);
      drawEarpiece(s);
    }, { height: w => (explore ? (w < 560 ? 552 : 472) : (w < 560 ? 330 : 250)) });

    function drawRows(s) {
      const { pen, c, w } = s, phone = w < 560;
      const left = phone ? 12 : 128, A = { x: left, w: w - left - 12 };
      const B = brokenAxis(A, [[0, 3], [2000, 2005]], phone ? 22 : 34);
      const d = rowsData(), shown = st.revealed;
      const maxR = Math.max(0.5, ...d.sum.map(Math.abs), ...d.copies.flat().map(([, v]) => Math.abs(v)));
      const pitch = phone ? 82 : 64, half = 21, half0 = phone ? 32 : 34, top = phone ? 54 : 30;
      const rowY = i => (i === 0 ? top + half0 : top + 2 * half0 + 26 + half + (i - 1) * pitch);
      const names = ['the word', ...st.word.map((v, k) => `copy from x[${k}]`), 'echo, the sum'];
      const zoom = (half / maxR) / half0;
      pen.text(`echo side drawn at ${zoom.toFixed(1)}× the word’s scale`, w - 12, 14, { align: 'right', color: c.soft, size: 10 });
      names.forEach((name, i) => {
        const y = rowY(i);
        drawAxis(s, B, y);
        const col = i === 0 ? c.input : i === 5 ? c.accentInk : c.soft;
        if (phone) pen.text(name, 12, y - (i ? half : half0) - 18, { align: 'left', color: col, size: 10 });
        else pen.text(name, left - 12, y + 4, { align: 'right', color: col, size: 11 });
      });
      st.word.forEach((v, k) => stem(s, B.X(k), rowY(0), v, half0, { color: c.input, r: 5, label: fmt(v, 1), labelColor: c.input, size: 11 }));
      if (!shown) {
        for (let n = 2000; n <= 2005; n++) pen.text('?', B.X(n), rowY(5) - 8, { color: c.soft, size: 12 });
        return;
      }
      const sc = half / maxR;
      d.copies.forEach((cp, k) => {
        const a = Math.max(0, Math.min(1, st.anim - k));
        if (a <= 0) return;
        s.ctx.globalAlpha = a;
        stem(s, B.X(k), rowY(k + 1), st.word[k], half, { color: c.ink, r: 3.5, label: fmt(st.word[k], 1), labelColor: c.soft, size: phone ? 9 : 10 });
        cp.forEach(([n, v]) => stem(s, B.X(n), rowY(k + 1), v, sc, { color: c.ink, label: fmt(v), labelColor: c.ink, size: phone ? 9 : 10, lift: phone && n % 2 ? 9 : 0 }));
        s.ctx.globalAlpha = 1;
      });
      if (st.pinned) st.pinned.sum.forEach((v, i) => { const x = B.X(2000 + i) - B.unit / 2 + 4; if (Math.abs(v) > 1e-9) { pen.line([[x, rowY(5)], [x, rowY(5) - v * sc]], c.input, 1.5, [3, 3]); pen.rect(x - 3, rowY(5) - v * sc - 3, 6, 6, c.input); } });
      const a = Math.max(0, Math.min(1, st.anim - 4));
      if (a > 0) {
        s.ctx.globalAlpha = a;
        d.sum.forEach((v, i) => stem(s, B.X(2000 + i), rowY(5), r2(v), sc, { color: c.accent, r: 4.5, label: fmt(v), labelColor: c.accentInk, size: phone ? 9 : 11, lift: phone && i % 2 ? 9 : 0 }));
        s.ctx.globalAlpha = 1;
      }
      const ticks = phone ? [0, 3, 2000, 2005] : [0, 1, 2, 3, 2000, 2001, 2002, 2003, 2004, 2005];
      ticks.forEach(n => pen.text(hz(n), B.X(n), rowY(5) + half + 32, { color: c.soft, size: 10 }));
      st.layout = { B, row0: rowY(0), half: half0 };
    }

    function drawColumn(s) {
      const { pen, c, w } = s, phone = w < 560;
      const ks = [-1, 0, 1, 2, 3, 4], lx = phone ? 96 : 150, cw = (w - lx - 12) / 6, cx = k => lx + (k + 1) * cw + cw / 2;
      const n = st.col, tp = [[2000, st.h[0]], [2001, st.h[1]]];
      const hAt = k => tp.reduce((q, [m, v]) => q + (n - k === m ? v : 0), 0), xk = k => (k >= 0 && k <= 3 ? st.word[k] : 0);
      const rows = phone ? [36, 96, 166, 226] : [34, 90, 150, 206];
      const size = phone ? 11 : 13;
      ks.forEach(k => { if (xk(k) && hAt(k)) pen.rect(cx(k) - cw / 2 + 2, rows[1] - 24, cw - 4, rows[3] - rows[1] + 36, c.paper2); });
      const label = (y, t) => pen.text(t, lx - 10, y + 4, { align: 'right', color: c.soft, size: phone ? 10 : 12 });
      label(rows[0], 'k'); label(rows[1], 'x[k]'); label(rows[2], `h[${hz(n)} ${MINUS} k]`); label(rows[3], 'product');
      pen.line([[lx, rows[0] + 14], [w - 12, rows[0] + 14]], c.rule, 1);
      let sum = 0;
      ks.forEach(k => {
        pen.text(k < 0 ? `${MINUS}1` : String(k), cx(k), rows[0] + 4, { color: c.soft, size: 11 });
        pen.text(xk(k) ? fmt(xk(k), 1) : '0', cx(k), rows[1] + 4, { color: xk(k) ? c.input : c.soft, size });
        const hv = hAt(k);
        if (hv) { s.ctx.strokeStyle = c.ink; s.ctx.lineWidth = 1.5; s.ctx.strokeRect(cx(k) - cw / 2 + 5, rows[2] - 15, cw - 10, 26); }
        pen.text(hv ? fmt(hv) : '0', cx(k), rows[2] + 4, { color: hv ? c.ink : c.soft, size });
        const p = xk(k) * hv; sum += p;
        pen.text(Math.abs(p) > 1e-9 ? fmt(p) : '0', cx(k), rows[3] + 4, { color: Math.abs(p) > 1e-9 ? c.accentInk : c.soft, size });
      });
      pen.text(`y[${hz(n)}] = ${fmt(sum)}`, lx + 3 * cw, rows[3] + 52, { color: c.accentInk, size: phone ? 15 : 17, font: 'body', weight: 600 });
      pen.text('h is written backwards: each step right in x is a step left in h', lx + 3 * cw, rows[3] + (phone ? 84 : 80), { color: c.soft, size: phone ? 9.5 : 11 });
    }

    function earRows() {
      const c = kase(), g = guess(), sig = st.sig;
      const tE = taps(c.D, c.a, c.b), tG = taps(g.d, g.s1, g.s2);
      let ns, fe, fg;
      if (sig === 'tone') { const x = n => cosd(45 * n); ns = Array.from({ length: 8 }, (_, i) => c.D + 100 + i); fe = n => tE.reduce((q, [m, k]) => q + k * x(n - m), 0); fg = n => tG.reduce((q, [m, k]) => q + k * x(n - m), 0); }
      else { const x = sig === 'hi' ? HI : CALL, at = sig === 'hi' ? 0 : LOUD; ns = Array.from({ length: sig === 'hi' ? 6 : 24 }, (_, i) => c.D + at + i); fe = n => convAt(x, tE, n); fg = n => convAt(x, tG, n); }
      return ns.map(n => { const e = fe(n), q = st.on ? fg(n) : 0; return { n, e, q, r: e - q }; });
    }

    function drawEarpiece(s) {
      const { pen, c, w } = s, phone = w < 560;
      const data = earRows(), cols = data.length, left = phone ? 12 : 120, A = { x: left, w: w - left - 12 };
      const step = A.w / cols, X = i => A.x + (i + 0.5) * step;
      const pitch = phone ? 92 : 70, top = phone ? 62 : 40, half = phone ? 24 : 22;
      const maxV = Math.max(0.3, ...data.map(d => Math.max(Math.abs(d.e), Math.abs(d.q), Math.abs(d.r))));
      const sc = half / maxV, labels = cols <= 8;
      const rows = [['echo', 'e', c.ink, []], [st.on ? 'your guess' : 'guess (canceller off)', 'q', c.soft, [3, 3]], ['left over', 'r', c.accent, []]];
      rows.forEach(([name, key, col, dash], i) => {
        const y = top + i * pitch;
        pen.line([[A.x, y], [A.x + A.w, y]], c.soft, 1);
        if (phone) pen.text(name, 12, y - half - 22, { align: 'left', color: i === 2 ? c.accentInk : c.soft, size: 10 });
        else pen.text(name, left - 12, y + 4, { align: 'right', color: i === 2 ? c.accentInk : c.soft, size: 11 });
        data.forEach((d, j) => stem(s, X(j), y, d[key], sc, { color: col, dash, r: labels ? 3.5 : 2.2, label: labels && Math.abs(d[key]) > 0.0005 ? fmt(d[key], 2) : null, labelColor: i === 2 ? c.accentInk : col === c.soft ? c.soft : c.ink, size: phone ? 9 : 10 }));
      });
      const y = top + 2 * pitch + half + 22;
      pen.text(st.sig === 'call' ? 'the loudest stretch of the call, at the echo' : st.sig === 'hi' ? '“hi”, where its echo lands' : 'the steady 1,000 Hz tone, after its echo has begun', A.x + A.w / 2, y + 16, { color: c.soft, size: 10 });
    }


    function exploreWhy() {
      const d = rowsData(), [a, b] = st.h;
      if (st.view === 'column') {
        const n = st.col, tp = d.tp, terms = [];
        for (let k = 0; k <= 3; k++) tp.forEach(([m, v]) => { if (n - k === m && st.word[k] && v) terms.push([st.word[k], v]); });
        const sum = d.sum[n - 2000];
        if (!terms.length) return `Nothing lands on n = ${hz(n)}: no word sample sits under a nonzero number of the flipped h. y[${hz(n)}] = 0.`;
        return `At n = ${hz(n)}, ${joinList(terms.map(([x, v]) => `${fmt(x, 1)} × ${fmt(v)}`))}${terms.length > 1 ? ` add to ${fmt(sum)}` : ` = ${fmt(sum)}`}: the same number as the column in the rows view.`;
      }
      let spill;
      if (near(b, 0)) spill = `No spill: the echo is the word times ${sf(a)}, a quieter copy with the same shape.`;
      else if (near(a, 0)) spill = `h[2,000] is 0, so only the spill is left: the echo is the word times ${sf(b)}, one sample later, at 2,001.`;
      else if (near(a, b)) spill = `Equal sizes: each echo sample is ${sf(a)} × (x[n] + x[n ${MINUS} 1]), the smoother’s average of neighbors, scaled.`;
      else if (b < 0) spill = `A negative spill subtracts part of the sample before: where the word zigzags, the copies add up and the echo gets sharper.`;
      else spill = `The spill blends each sample into the next one, so the echo is the word smoothed, not just made quieter.`;
      let both = null;
      for (let n = 2001; n <= 2004; n++) { const k1 = n - 2000, k2 = n - 2001; if (st.word[k1] && st.word[k2] && a && b && Math.abs(d.sum[n - 2000]) > 1e-9) { both = n; break; } }
      const land = both ? ` At n = ${hz(both)} two copies land: ${fmt(st.word[both - 2000], 1)} × ${sf(a)} + ${fmt(st.word[both - 2001], 1)} × ${sf(b)} = ${fmt(d.sum[both - 2000])}.` : '';
      return spill + land;
    }

    function echoText() {
      const d = rowsData(), first = d.sum.findIndex(v => Math.abs(v) > 1e-9);
      if (first < 0) return 'echo: silence';
      let last = d.sum.length - 1; while (Math.abs(d.sum[last]) < 1e-9) last--;
      return `echo from n = ${hz(2000 + first)}: ${list(d.sum.slice(first, last + 1))}`;
    }

    function invalid() {
      const g = guess();
      if ([g.d, g.s1, g.s2].some(v => !Number.isFinite(v))) return 'Type a number into each of the three boxes.';
      if (!Number.isInteger(g.d)) return `The delay counts whole samples, so it is a whole number: “${$('delay').value.trim()}” is not one. Use the n of the first nonzero sample.`;
      if (g.d < 0 || g.d > 4000) return `The delay must be between 0 and 4,000 samples; ${g.d < 0 ? MINUS : ''}${hz(Math.abs(g.d))} is outside that.`;
      if (Math.abs(g.s1) > 1 || Math.abs(g.s2) > 1) return 'Each size is between −1 and 1: a box cannot send back more than it got.';
      return null;
    }

    function fixMessage() {
      const c = kase(), g = guess();
      const sigName = { call: 'the call', hi: '“hi”', tone: 'the 1,000 Hz tone' }[st.sig];
      st.solved = false;
      const bad = invalid();
      if (bad) return bad;
      const m = meterOf(st.sig, c, g), meter = `Echo meter ${pctText(m)} on ${sigName}.`;
      if (!st.on) return `Canceller off: the whole echo reaches the earpiece. ${meter}`;
      const eq = (u, v) => Math.abs(u - v) < 1e-9;
      if (g.d === c.D && eq(g.s1, c.a) && eq(g.s2, c.b)) {
        st.solved = true;
        const end = st.caseIx === 0 ? 'The caller hears only the far person now. No canyon, no stammering: the echo is gone.' : 'This line is clean too.';
        return `Fixed. The guess lands on the echo sample for sample, the echo meter reads 0% on every signal, and the far voice comes through clean, at 100%. ${end}`;
      }
      if (st.caseIx === 0 && g.d === 2000 && eq(g.s1, 0.4) && eq(g.s2, 0.2)) return `Those are the numbers measured earlier in the lesson, but this line was rerouted and the box has drifted. ${meter} Read this line’s own click.`;
      if (eq(g.d, 0) && eq(g.s1, 0) && eq(g.s2, 0)) return `The canceller is set to all zeros, so it subtracts nothing. ${meter} Read the delay and the sizes off your click.`;
      const off = g.d - c.D, way = off > 0 ? 'late' : 'early';
      const delayPart = off === 0 ? 'Delay right' : `The delay is ${hz(Math.abs(off))} sample${Math.abs(off) === 1 ? '' : 's'} ${way}`;
      if (g.d > 0 && g.d < 10) return `A delay of ${g.d} sample${g.d === 1 ? '' : 's'} is far too short. The delay counts samples, not seconds: use the n where the first nonzero sample sits. ${meter}`;
      if (eq(g.s1, 0.1 * c.a) && eq(g.s2, 0.1 * c.b)) return `${delayPart}, but those sizes are the raw numbers the click of 0.1 brought back. h is what comes back divided by the click size: divide both by 0.1. ${meter}`;
      const flip1 = eq(g.s1, -c.a), flip2 = eq(g.s2, -c.b), keep1 = eq(g.s1, c.a), keep2 = eq(g.s2, c.b);
      if (flip1 && flip2 && c.a && c.b) return `${delayPart}, but both sizes have the wrong sign, so the canceller adds a second copy of the echo instead of removing it. ${meter}`;
      if ((flip1 && keep2 && c.a) || (keep1 && flip2 && c.b)) return `${delayPart}, but the ${flip1 ? 'first' : 'second'} size has the wrong sign: that part of the echo is added instead of removed. ${meter}`;
      if (off !== 0 && keep1 && keep2) {
        if (Math.abs(off) === 1) {
          const why = st.sig === 'hi' ? 'A zigzag one sample off is nearly upside down, so subtracting it adds: worse than no canceller.'
            : st.sig === 'tone' ? 'A slow wave barely moves in one sample, so the guess still partly lines up: better than “hi”, but more than half the echo is left.'
              : 'The crisp, fast parts of the voice suffer most from the slip.';
          return `Sizes right, but the guess is one sample ${way}. ${meter} ${why}`;
        }
        return `Sizes right, but the delay is ${hz(Math.abs(off))} samples ${way}: the guess misses the echo. ${meter} Use the n of the first nonzero sample.`;
      }
      if (off !== 0) return `Your delay, ${hz(g.d)}, is ${hz(Math.abs(off))} sample${Math.abs(off) === 1 ? '' : 's'} ${way}, and the sizes are off too. ${meter} Start with the delay: where does the click’s echo stop being silent?`;
      if (eq(g.s1, c.b) && eq(g.s2, c.a) && !eq(c.a, c.b)) return `Delay right, but the sizes are swapped: the bigger number comes first, right after the silence. ${meter}`;
      const k1 = c.a ? g.s1 / c.a : NaN, k2 = c.b ? g.s2 / c.b : NaN;
      if (Number.isFinite(k1) && Number.isFinite(k2) && Math.abs(k1 - k2) < 0.005 && k1 > 0 && !eq(k1, 1)) {
        const p = Math.round(Math.abs(1 - k1) * 100);
        return `Delay right, and both sizes are ${p}% too ${k1 < 1 ? 'small' : 'big'}, so every leftover sample is ${sf(Math.abs(1 - k1))} of the echo’s, for any word. ${meter}${m < 0.05 ? ' Close: now match the click exactly.' : ''}`;
      }
      return `Delay right. Your sizes are ${s3(g.s1)} and ${s3(g.s2)}: divide the two numbers right after the silence by the click size, 0.1. ${meter}`;
    }

    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Play runs the recorded voice through your h, on a loop: the voice, then 0.25 s later its echo.' : 'Not playing. Play runs the live call through the earpiece, on a 14-second loop.';
      if (explore) return `Playing on a loop: the recorded voice, then its echo through h = ${sf(st.h[0])}, ${sf(st.h[1])}. Press Stop to end it.`;
      return `Playing the earpiece on a 14-second loop${st.own ? ', with your own voice as you hear it in the room' : ''}, canceller ${st.on ? 'on' : 'off'}. Press Stop to end it.`;
    }

    function render8k() {
      if (explore) {
        const out = new Float32Array(VOICE.length + 2400);
        for (let n = 0; n < out.length; n++) out[n] = 0.6 * (VOICE[n] || 0) + convAt(VOICE, [[2000, st.h[0]], [2001, st.h[1]]], n);
        const p = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
        return p > 1 ? out.map(v => v / p) : out;
      }
      const c = kase(), { ear, own } = callSignal(c), tG = taps(st.d, st.s1, st.s2);
      const out = new Float32Array(LOOP);
      for (let n = 0; n < LOOP; n++) out[n] = ear[n] - (st.on ? convAt(CALL, tG, n) : 0) + (st.own ? 0.5 * own[n] : 0);
      const p = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      return p > 1 ? out.map(v => v / p) : out;
    }

    function render() {
      $('now').textContent = nowText();
      $('hwhy').textContent = hWhy();
      if (explore) {
        $('clicksize').value = st.clickSize; $('clicksize-out').textContent = sf(st.clickSize);
        st.word.forEach((v, k) => { $(`x${k}`).value = v; $(`x${k}-out`).textContent = fmt(v, 1); $(`x${k}`).disabled = !st.revealed; });
        st.h.forEach((v, k) => { $(`h${k}`).value = v; $(`h${k}-out`).textContent = sf(v); $(`h${k}`).disabled = !st.revealed; });
        $('view-rows').setAttribute('aria-pressed', String(st.view === 'rows')); $('view-column').setAttribute('aria-pressed', String(st.view === 'column'));
        $('view-rows').disabled = $('view-column').disabled = !st.revealed;
        $('col-control').hidden = st.view !== 'column'; $('col').value = st.col; $('col-out').textContent = hz(st.col);
        $('pin').disabled = !st.revealed;
        $('key-pin').hidden = !st.pinned;
        const q1 = $('ask').querySelector('.k-q');
        if (q1 && st.revealed) q1.textContent = near(st.h[0], 0.4) && near(st.h[1], 0.2) ? q1.dataset.base || q1.textContent : `${(q1.dataset.base = q1.dataset.base || q1.textContent)} (Answered. You have since changed the line with the h sliders: it is now ${sf(st.h[0])} at 2,000 and ${sf(st.h[1])} at 2,001.)`;
        if (st.revealed) {
          $('result').textContent = '';
          const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = echoText(); $('result').append(sp);
          $('why').textContent = exploreWhy();
        } else {
          $('result').textContent = `“so”: ${list(st.word)} · h: ${sf(st.h[0])} at 2,000, ${sf(st.h[1])} at 2,001 · echo: ?`;
          $('why').textContent = 'Answer the questions above and the lab draws each copy, then their sum.';
        }
        $('compare').hidden = !st.pinned || st.view === 'column';
        if (st.pinned) {
          const now = rowsData().sum, same = now.every((v, i) => near(r2(v), r2(st.pinned.sum[i])));
          $('compare').textContent = same ? `Pinned: ${st.pinned.label}. Change the word or h to compare.`
            : `Pinned: ${st.pinned.label}, echo ${list(st.pinned.sum.slice(0, 5))}. Now: echo ${list(now.slice(0, 5))}. ${near(st.pinned.h[0], st.h[0]) && near(st.pinned.h[1], st.h[1]) ? 'Same h, different word: the copies are the same shape, only their sizes moved.' : 'Different h: every copy changed shape, so the whole echo did.'}`;
        }
        $('stage').setAttribute('aria-label', st.revealed ? `The word ${list(st.word)} and its four copies of h; ${echoText()}.` : `The word ${list(st.word)}; the echo is not drawn yet.`);
        $('hstage').setAttribute('aria-label', st.clicked ? `h: 2,000 zeros, then ${sf(st.h[0])} and ${sf(st.h[1])}, shown for a click of ${sf(st.clickSize)}.` : 'No click sent yet.');
      } else {
        const c = kase(), blank = Boolean(invalid()), m = blank ? 0 : meterOf(st.sig, c, guess()), msg = fixMessage();
        $('task-text').textContent = c.text;
        $('why').textContent = !st.predicted ? 'Answer the question above to unlock the click button.'
          : !st.clean ? 'Send a click in a quiet moment first: the canceller unlocks once you have a clean measurement of this line.' : msg;
        $('result').textContent = blank ? 'canceller: check the boxes · echo meter ' : `canceller: delay ${hz(st.d)}, sizes ${s3(st.s1)}, ${s3(st.s2)} · echo meter `;
        const sp = document.createElement('span'); sp.className = !blank && m > 0.0001 ? 'changed' : ''; sp.textContent = blank ? '?' : pctText(m); $('result').append(sp);
        K.meter($('meter'), m, { max: 2, known: !blank, text: `${pctText(m)}${m > 2 ? ', past the bar' : ''}` });
        const fc = blank ? 0 : farClean(c, guess());
        K.meter($('far-meter'), fc, { max: 1, known: !blank, text: fc > 0.9995 ? '100%' : `${Math.min(99, Math.round(fc * 100))}%` });
        host.querySelectorAll('[data-sig]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sig === st.sig)));
        $('cancel').setAttribute('aria-pressed', String(st.on)); $('cancel').textContent = st.on ? 'Canceller on' : 'Canceller off';
        $('own').setAttribute('aria-pressed', String(st.own));
        $('another').hidden = !st.solved;
        $('click').disabled = !st.predicted;
        ['delay', 's1', 's2'].forEach(k => { $(k).disabled = !st.clean; });
        if (!st.clean) st.solved = false;
        if (st.solved && st.caseIx === 0) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        $('stage').setAttribute('aria-label', `Echo, your guess and what is left, on ${st.sig === 'hi' ? '“hi”' : st.sig === 'tone' ? 'the 1,000 Hz tone' : 'the call'}: echo meter ${pctText(m)}.`);
        $('hstage').setAttribute('aria-label', !st.measured ? 'No click sent yet.' : st.noisy ? 'A noisy measurement: the far sound landed on the click.' : `What came back from the click of 0.1: silence until n = ${hz(c.D)}, then ${s3(0.1 * c.a)} and ${s3(0.1 * c.b)}.`);
      }
      hstage.redraw(); stage.redraw();
      if (audio.playing) audio.refresh();
    }

    function buildAsks() {
      const q1 = document.createElement('div'), q2 = document.createElement('div'), q3 = document.createElement('div');
      $('ask').replaceChildren(q1, q2, q3);
      $('ask').className = 'k-predict';
      const lead = 'A new word, “so”: 0, 0.7, 0.5, −0.3. The line is the same: h is 0.4 at n = 2,000 and 0.2 at 2,001. ';
      K.ask(q1, {
        question: `${lead}Predict first: where does the echo of “so” start?`,
        options: [['2000', 'n = 2,000'], ['2001', 'n = 2,001'], ['2002', 'n = 2,002']], right: '2001',
        hints: { 2000: 'A click of size 0 at n = 0 launches a copy of size 0. Which is the first sample that is not silent?', 2002: 'The first nonzero sample is at n = 1. Its copy of h starts 2,000 samples after it.' },
        explain: 'The first sound in the word is at n = 1, and its copy of h starts 2,000 samples later, at 2,001.',
        onSolved: () => K.ask(q2, {
          question: 'How many samples of its echo make a sound?',
          options: [['3', '3'], ['4', '4'], ['5', '5']], right: '4',
          hints: { 3: 'Three samples of the word sound, but each copy of h is two samples long, so the last copy reaches one sample further.', 5: 'Five is right for a word whose four samples all sound. Here only three sound, at n = 1, 2 and 3.' },
          explain: 'Three samples of the word sound, n = 1 to 3, and h’s spill adds one: 2,001 to 2,004.',
          onSolved: () => K.ask(q3, {
            question: 'What are the echo’s first two samples, at 2,001 and 2,002?',
            options: [['a', '0.70, 0.50'], ['b', '0.28, 0.20'], ['c', '0.28, 0.34'], ['d', '0.28, 0.14']], right: 'c',
            hints: { a: 'Those are the word’s own samples. The box returns a scaled copy, not the word itself.', b: 'That is the word made 0.4 times quieter. At 2,002 a second copy lands as well: the spill from the sample before.', d: 'That is the first copy alone. At 2,002 the copy from x[2] = 0.5 starts too: add 0.5 × 0.4.' },
            explain: 'At 2,001 only one copy has started: 0.7 × 0.4 = 0.28. At 2,002 two land: 0.7 × 0.2 + 0.5 × 0.4 = 0.14 + 0.20 = 0.34.',
            onSolved: () => { st.revealed = true; st.anim = K.reduced.matches ? 5 : 0; render(); if (st.anim < 5) loop.start(); },
            focusAfter: () => $('x0'),
          }),
          focusAfter: () => q3.querySelector('button'),
        }),
        focusAfter: () => q2.querySelector('button'),
      });
    }

    function sendClick() {
      if (explore) { st.clicked = true; render(); return; }
      const c = kase(), t = clock(), at = Math.round(t * FS), who = lineState(t);
      if (who === 'quiet') { st.measured = { at }; st.noisy = false; st.clean = true; }
      else {
        const { ear } = callSignal(c), base = (at % LOOP);
        st.measured = { at, who, noise: n => 0.04 * CALL[LOUD + ((n * 7 + base) % 48)] / 0.8 + ear[(base + n) % LOOP] / 0.1 };
        st.noisy = true;
      }
      render();
    }

    if (explore) {
      ['task', 'meter', 'far-meter', 'fix-controls', 'cancel', 'own', 'another', 'line-state'].forEach(k => { $(k).hidden = true; });
      buildAsks();
      const drag = e => {
        if (!st.revealed || st.view !== 'rows' || !st.layout) return;
        const r = $('stage').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, L = st.layout;
        const k = [0, 1, 2, 3].reduce((b, i) => (Math.abs(L.B.X(i) - x) < Math.abs(L.B.X(b) - x) ? i : b), 0);
        if (Math.abs(L.B.X(k) - x) > L.B.unit || Math.abs(y - L.row0) > L.half + 24) return false;
        st.word[k] = Math.max(-1, Math.min(1, Math.round((L.row0 - y) / L.half * 10) / 10)); st.anim = 5; render();
        return true;
      };
      let dragging = false;
      $('stage').addEventListener('pointerdown', e => { if (drag(e)) { dragging = true; $('stage').setPointerCapture(e.pointerId); } });
      $('stage').addEventListener('pointermove', e => { if (dragging) drag(e); });
      $('stage').addEventListener('pointerup', () => { dragging = false; });
      [0, 1, 2, 3].forEach(k => $(`x${k}`).addEventListener('input', () => { st.word[k] = Math.round(Number($(`x${k}`).value) * 10) / 10; st.anim = 5; render(); }));
      [0, 1].forEach(k => $(`h${k}`).addEventListener('input', () => { st.h[k] = Math.round(Number($(`h${k}`).value) * 100) / 100; st.anim = 5; render(); }));
      $('clicksize').addEventListener('input', () => { st.clickSize = Math.round(Number($('clicksize').value) * 100) / 100; st.clicked = true; render(); });
      $('view-rows').addEventListener('click', () => { st.view = 'rows'; st.anim = 5; render(); });
      $('view-column').addEventListener('click', () => { st.view = 'column'; render(); });
      $('col').addEventListener('input', () => { st.col = Number($('col').value); render(); });
      $('pin').addEventListener('click', () => { st.pinned = { sum: rowsData().sum.map(r2), h: st.h.slice(), label: `“${near(st.word[0], 0) && near(st.word[1], 0.7) && near(st.word[2], 0.5) && near(st.word[3], -0.3) ? 'so' : 'your word'}” ${list(st.word.map(v => Math.round(v * 10) / 10))} through h = ${sf(st.h[0])}, ${sf(st.h[1])}` }; render(); });
    } else {
      ['clicksize-control', 'explore-controls', 'pin', 'jump', 'key-in'].forEach(k => { $(k).hidden = true; });
      ['task', 'meter', 'far-meter', 'fix-controls', 'cancel', 'own', 'line-state', 'key-soft'].forEach(k => { $(k).hidden = false; });
      const q = document.createElement('div');
      $('ask').replaceChildren(q); $('ask').className = 'k-predict';
      K.ask(q, {
        question: 'One prediction before you start. “hi” zigzags from sample to sample, and a one-sample slip leaves 133% of its echo. On the recorded call, a real voice, where will a one-sample slip land?',
        options: [['above', 'Above 133%'], ['between', 'Between 100% and 133%'], ['below', 'Below 100%']], right: 'below',
        hints: { above: 'Only the sharpest zigzags do worse than “hi”, and a voice is mostly slow waves. Does a slow wave one sample late line up with itself well or badly?', between: 'That would still be worse than no canceller. A slow wave barely moves in one sample, so a guess one sample late still largely lines up with it.' },
        explain: 'It lands far below 100%, at about a quarter of the echo. Phone engineers know that most of a voice’s sound sits in low, slow tones, and a slow wave one sample late still largely lines up, so most of the echo still cancels. Check it later: once the line is fixed, set the delay one sample late with the meter on the call.',
        onSolved: () => { st.predicted = true; render(); }, focusAfter: () => $('click'),
      });
      $('key-sum-text').textContent = 'what is left after subtracting'; $('key-copy').lastChild.textContent = 'the echo';
      $('click').textContent = 'Send a click (size 0.1)';
      const num = k => { const v = $(k).value.trim().replace(/\s/g, '').replace(/,(?=\d{3}(?!\d))/g, '').replace(',', '.').replace(/^[−–]/, '-'); return v === '' ? NaN : Number(v); };
      const field = k => $(k).addEventListener('input', () => { st[k] = num(k); render(); });
      ['s1', 's2'].forEach(k => field(k));
      $('delay').addEventListener('input', () => { st.d = num('delay'); render(); });
      host.querySelectorAll('[data-sig]').forEach(b => b.addEventListener('click', () => { st.sig = b.dataset.sig; render(); }));
      $('cancel').addEventListener('click', () => { st.on = !st.on; render(); });
      $('own').addEventListener('click', () => { st.own = !st.own; render(); });
      $('another').addEventListener('click', () => {
        audio.stop(); st.caseIx = (st.caseIx % (CASES.length - 1)) + 1;
        Object.assign(st, { measured: null, noisy: false, clean: false, d: 0, s1: 0, s2: 0, solved: false, on: true });
        ['delay', 's1', 's2'].forEach(k => { $(k).value = 0; });
        render(); $('click').focus();
      });
      let last = '';
      setInterval(() => { const t = lineState(clock()); if (t !== last) { last = t; $('line-state').textContent = STATE_TEXT[t]; $('line-state').classList.toggle('k-busy', t !== 'quiet'); } }, 200);
    }
    $('click').addEventListener('click', sendClick);
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k, explore ? 0 : (clock() % 14))));
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(st, { word: SO.slice(), h: [0.4, 0.2], clickSize: 0.1, view: 'rows', col: 2002, pinned: null, anim: 5 });
      else { Object.assign(st, { measured: null, noisy: false, clean: false, d: 0, s1: 0, s2: 0, sig: 'call', on: true, own: true, solved: false }); ['delay', 's1', 's2'].forEach(k => { $(k).value = 0; }); }
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const m = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    m.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });

  const slip = document.getElementById('slip-ask');
  if (slip) K.ask(slip, {
    question: 'The same one-sample slip on the steady 1,000 Hz tone: more or less than the 133% of “hi”?',
    options: [['more', 'More than 133%'], ['same', 'The same, 133%'], ['less', 'Less than 133%']], right: 'less',
    hints: { more: 'The tone is a slow wave: from one sample to the next it barely moves. Does a slow wave one sample late line up with itself well or badly?', same: 'The 133% came from “hi” zigzagging between samples. A steady 1,000 Hz tone does not zigzag. Would its leftover be the same?' },
    explain: 'A slow wave one sample late still partly lines up with itself, so the tone leaves 59%: less than “hi”, though more than half the echo is still there. The table and figure below are open now.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'tone' })),
  });
})();
