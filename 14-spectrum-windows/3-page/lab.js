(() => {
  const K = window.Kit, FS = 8000, TAU = 2 * Math.PI;
  const { hz } = K;
  const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477, 1633];
  const LABELS = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
  const MAX_N = 320;
  const p1 = v => `${(v * 100).toFixed(1)}%`;
  const p0 = v => `${Math.round(v * 100)}%`;
  const num = (v, d = 2) => v.toLocaleString('en-US', { maximumFractionDigits: d });
  const hzx = f => `${num(f)} Hz`;
  const ms = n => `${num(n / 8, 1)} ms`;
  const hannW = (n, N) => 0.5 - 0.5 * Math.cos(TAU * n / N);
  const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

  function hatchFor(ctx, c) {
    const t = document.createElement('canvas'); t.width = 6; t.height = 6;
    const x = t.getContext('2d');
    x.fillStyle = c.accentSoft; x.fillRect(0, 0, 6, 6);
    x.strokeStyle = c.accent; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-1, 7); x.lineTo(7, -1); x.stroke();
    return ctx.createPattern(t, 'repeat');
  }

  function blockMatches(f, phi, N) {
    const out = [];
    for (let k = 0; k <= N / 2; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const x = Math.cos(TAU * f * n / FS + phi), t = TAU * k * n / N; re += x * Math.cos(t); im -= x * Math.sin(t); }
      out.push(Math.hypot(re, im) / (N / 2));
    }
    return out;
  }
  function chains(f, phi, N, k) {
    const w = TAU * f / FS, wk = TAU * k / N, a = [[0, 0]], b = [];
    let x = 0, y = 0;
    for (let n = 0; n < N; n++) { const t = phi + (w - wk) * n; x += Math.cos(t) / N; y += Math.sin(t) / N; a.push([x, y]); }
    b.push([x, y]);
    for (let n = 0; n < N; n++) { const t = -phi + (-w - wk) * n; x += Math.cos(t) / N; y += Math.sin(t) / N; b.push([x, y]); }
    const len = pts => Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]);
    return { a, b, la: len(a), lb: len(b), total: Math.hypot(x, y) };
  }

  const engines = new Map();
  function engine(N, win) {
    const key = `${N}-${win}`;
    if (engines.has(key)) return engines.get(key);
    const w = Array.from({ length: N }, (_, n) => (win === 'hann' ? hannW(n, N) : 1));
    const sw = w.reduce((s, v) => s + v, 0);
    const tones = [...ROWS, ...COLS], bins = tones.map(f => Math.round(f * N / FS));
    const C = tones.map(f => bins.map(b => {
      let ar = 0, ai = 0, cr = 0, ci = 0;
      for (let n = 0; n < N; n++) {
        const t1 = (TAU * f / FS - TAU * b / N) * n, t2 = (-TAU * f / FS - TAU * b / N) * n;
        ar += w[n] * Math.cos(t1); ai += w[n] * Math.sin(t1); cr += w[n] * Math.cos(t2); ci += w[n] * Math.sin(t2);
      }
      return [ar / sw, ai / sw, cr / sw, ci / sw];
    }));
    const e = { N, win, bins, C };
    engines.set(key, e);
    return e;
  }
  function keyMatches(e, r, c, pr, pc) {
    const t = [r, 4 + c], ph = [pr, pc];
    return e.bins.map((_, b) => {
      let re = 0, im = 0;
      t.forEach((ti, i) => {
        const [ar, ai, cr, ci] = e.C[ti][b], cs = Math.cos(ph[i]), sn = Math.sin(ph[i]);
        re += ar * cs - ai * sn + cr * cs + ci * sn; im += ar * sn + ai * cs - cr * sn + ci * cs;
      });
      return Math.hypot(re, im);
    });
  }
  function survey(e, cs, bar) {
    const G = 8, starts = Array.from({ length: G }, (_, i) => TAU * (i + cs.off) / G);
    const presses = [];
    let leak = { v: -1 }, faint = { v: 9 };
    for (const who of ['loud', 'faint']) {
      const S = who === 'loud' ? cs.loud : cs.faint;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const p = { who, r, c, S, decoded: 0, thrown: 0, unheard: 0, wrong: 0, worst: null, worstScore: -1 };
        for (const pr of starts) for (const pc of starts) {
          const m = keyMatches(e, r, c, pr, pc).map(v => v * S);
          const own = [r, 4 + c];
          const above = m.map(v => v > bar);
          const nr = above.slice(0, 4).filter(Boolean).length, nc = above.slice(4).filter(Boolean).length;
          if (nr > 1 || nc > 1) p.thrown++;
          else if (nr === 0 || nc === 0) p.unheard++;
          else if (above[r] && above[4 + c]) p.decoded++;
          else p.wrong++;
          const ownMin = Math.min(m[r], m[4 + c]), other = m.map((v, i) => (own.includes(i) ? -1 : v)), lk = Math.max(...other);
          const score = who === 'loud' ? lk : -ownMin;
          if (score > p.worstScore) { p.worstScore = score; p.worst = m; }
          if (who === 'loud' && lk > leak.v) leak = { v: lk, r, c, bin: other.indexOf(lk) };
          if (who === 'faint' && ownMin < faint.v) faint = { v: ownMin, r, c };
        }
        p.total = G * G;
        presses.push(p);
      }
    }
    const ok = presses.filter(p => p.decoded === p.total).length;
    return { presses, leak, faint, ok };
  }

  const CASES = [
    { loud: 2, faint: 0.1, off: 0.31, text: 'A call centre has joined the line. Its headsets run hot, so its keys arrive louder than any you have tested. The rural customer is calling too. Each presses all 16 keys. Find a window, a block length and a bar that decode all 32 presses, with the block inside one 40 ms press.',
      end: 'The call centre stops reporting phantom keys, and the rural customer gets through on the first try.' },
    { loud: 1, faint: 0.04, off: 0.6, text: 'A second rural exchange comes online, fainter still, and the loud customer is back at the usual strength. Measure the two marks and set the detector again.',
      end: 'The far exchange decodes too.' },
    { loud: 1.6, faint: 0.05, off: 0.13, text: 'Both at once: a hot headset and a very faint line. The gap between the marks is thin. Find a setting that opens it.',
      end: 'Both customers decode, through a gap that was barely there.' },
  ];
  const keyName = (r, c) => LABELS[r][c];
  const rowOf = i => (i < 4 ? `the ${keyName(i, 0)}'s row (${hz(ROWS[i])} Hz)` : `the ${keyName(0, i - 4)}'s column (${hz(COLS[i - 4])} Hz)`);

  function mountLab(host, mode) {
    host.replaceChildren(document.getElementById('spectrum-lab').content.cloneNode(true));
    const uid = `${host.id}-`, $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = explore
      ? { N: 16, f: 1250, phi: 0, bin: 3, revealed: false, dial: false, pinned: null, steady: false }
      : { caseIx: 0, win: 'none', N: 256, bar: 0.12, unlocked: false, sel: { who: 'loud', r: 1, c: 0 }, solved: false };
    let pattern = null, patternKey = '';
    const stepOf = N => FS / N / 8;

    const stage = K.stage($('stage'), s => {
      const { pen, c, w, h, ctx } = s;
      if (patternKey !== c.accent + c.accentSoft) { pattern = hatchFor(ctx, c); patternKey = c.accent + c.accentSoft; }
      if (explore) drawExplore(s, pen, c, w, h, ctx); else drawFix(s, pen, c, w, h, ctx);
    }, { height: w => (explore ? (w < 560 ? 500 : 300) : (w < 560 ? 470 : 300)) });

    function drawExplore(s, pen, c, w, h, ctx) {
      const stacked = w < 560, N = st.N, nb = N / 2;
      const A = stacked ? { x: 44, y: 22, w: w - 60, h: 170 } : { x: 44, y: 24, w: Math.round(w * 0.58) - 60, h: h - 70 };
      const X = k => A.x + (k / nb) * A.w, Y = v => A.y + A.h - Math.min(v, 1.05) / 1.05 * A.h;
      pen.line([[A.x, A.y + A.h], [A.x + A.w, A.y + A.h]], c.soft, 1);
      [[0, '0%'], [0.5, '50%'], [1, '100%']].forEach(([v, t]) => { pen.text(t, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }); pen.line([[A.x, Y(v)], [A.x + A.w, Y(v)]], c.rule, 1); });
      pen.text('0 Hz', A.x, A.y + A.h + 16, { color: c.soft, size: 10, align: 'left' }); pen.text('2,000', X(nb / 2), A.y + A.h + 16, { color: c.soft, size: 10 }); pen.text('4,000 Hz', A.x + A.w, A.y + A.h + 16, { color: c.soft, size: 10, align: 'right' });
      pen.text(`match at each bin, ${N} samples`, A.x, A.y - 8, { align: 'left', color: c.soft, size: 11 });
      if (!st.revealed) {
        pen.text('Answer the question above to see the matches.', A.x + A.w / 2, A.y + A.h / 2, { color: c.soft, size: 12 });
        return;
      }
      const m = blockMatches(st.f, st.phi, N), fb = st.f * N / FS, lo = Math.floor(fb + 1e-9), hi = Math.ceil(fb - 1e-9);
      const bw = Math.max(1.5, Math.min(26, A.w / (nb + 1) * 0.62));
      m.forEach((v, k) => {
        const x = X(k) - bw / 2, top = Y(v), own = k === lo || k === hi;
        if (v < 1e-6) { pen.line([[x, A.y + A.h - 0.5], [x + bw, A.y + A.h - 0.5]], c.ink, 1.5); return; }
        if (own) pen.rect(x, top, bw, A.y + A.h - top, c.ink);
        else { ctx.fillStyle = pattern; ctx.fillRect(x, top, bw, A.y + A.h - top); if (bw > 3) { ctx.strokeStyle = c.accent; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, top + 0.5, bw - 1, A.y + A.h - top - 1); } }
        if (v > 1.05) pen.text(p0(v), X(k), A.y + 10, { color: c.ink, size: 10 });
        if (nb <= 16) pen.text(p0(v), X(k), Math.max(A.y + 10, top - 5), { color: c.ink, size: 10 });
      });
      if (st.pinned && st.pinned.N === N) st.pinned.m.forEach((v, k) => { const top = Y(v); pen.line([[X(k) - bw / 2 - 2, top], [X(k) + bw / 2 + 2, top]], c.input, 2, [3, 2]); });
      const tx = X(fb);
      pen.line([[tx, A.y + 2], [tx, A.y + A.h]], c.input, 1.5);
      pen.text(`tone ${hzx(st.f)}`, Math.min(Math.max(tx, A.x + 40), A.x + A.w - 40), A.y + A.h + 32, { color: c.input, size: 11, weight: 500 });
      const bx = X(st.bin);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(bx - bw / 2 - 3, A.y, bw + 6, A.h + 4); ctx.setLineDash([]);
      const B = stacked ? { x: 20, y: 270, w: w - 40, h: h - 290 } : { x: Math.round(w * 0.58) + 10, y: 24, w: w - Math.round(w * 0.58) - 30, h: h - 50 };
      const ch = chains(st.f, st.phi, N, st.bin);
      const pts = [...ch.a, ...ch.b];
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(0, ...xs), maxX = Math.max(0, ...xs), minY = Math.min(0, ...ys), maxY = Math.max(0, ...ys);
      const span = Math.max(maxX - minX, maxY - minY, 1e-3), sc = Math.min(B.w - 20, B.h - 46) / span;
      const ox = B.x + 10 + (B.w - 20 - (maxX - minX) * sc) / 2 - minX * sc, oy = B.y + 24 + (B.h - 46 - (maxY - minY) * sc) / 2 + maxY * sc;
      const P = ([x, y]) => [ox + x * sc, oy - y * sc];
      pen.text(`bin ${st.bin} (${hzx(st.bin * FS / N)}): the two chains`, B.x, B.y + 6, { align: 'left', color: c.soft, size: 11 });
      pen.line(ch.a.map(P), c.ink, 1.6);
      pen.line(ch.b.map(P), c.soft, 1.8, [1, 3]);
      pen.line([P([0, 0]), P(ch.b[ch.b.length - 1])], c.accent, 2.2);
      pen.dot(...P([0, 0]), 3, c.ink); pen.dot(...P(ch.b[ch.b.length - 1]), 3.5, c.accent);
      const barPx = Math.min(B.w * 0.4, 0.1 * sc) > 8 ? 0.1 * sc : 0.01 * sc;
      const barVal = Math.min(B.w * 0.4, 0.1 * sc) > 8 ? '10%' : '1%';
      if (barPx < B.w * 0.6) { pen.line([[B.x + B.w - barPx, B.y + B.h - 4], [B.x + B.w, B.y + B.h - 4]], c.soft, 2); pen.text(`${barVal} of a full pile`, B.x + B.w, B.y + B.h - 10, { align: 'right', color: c.soft, size: 10 }); }
    }

    function drawFix(s, pen, c, w, h, ctx) {
      const stacked = w < 560;
      const e = engine(st.N, st.win), sv = survey(e, CASES[st.caseIx], st.bar);
      st.sv = sv;
      const A = stacked ? { x: 40, y: 44, w: w - 56, h: 172 } : { x: 44, y: 44, w: Math.round(w * 0.56) - 60, h: h - 98 };
      const top = 0.25, Y = v => A.y + A.h - Math.min(v, top) / top * A.h;
      pen.line([[A.x, A.y + A.h], [A.x + A.w, A.y + A.h]], c.soft, 1);
      [[0, '0%'], [0.1, '10%'], [0.2, '20%']].forEach(([v, t]) => { pen.text(t, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }); pen.line([[A.x, Y(v)], [A.x + A.w, Y(v)]], c.rule, 1); });
      const sel = sv.presses.find(p => p.who === st.sel.who && p.r === st.sel.r && p.c === st.sel.c);
      const label = `${sel.who === 'loud' ? 'loud' : 'rural'} ${keyName(sel.r, sel.c)}, its worst start`;
      pen.text(st.unlocked ? label : 'the eight keypad bins', A.x, A.y - 26, { align: 'left', color: c.soft, size: 11 });
      const slot = A.w / 8, bw = Math.min(26, slot * 0.55);
      [...ROWS, ...COLS].forEach((f, i) => {
        const x = A.x + slot * (i + 0.5);
        pen.text(i < 4 ? hz(f) : hz(f), x, A.y + A.h + 15, { color: c.soft, size: stacked ? 9 : 10 });
        if (!st.unlocked) return;
        const v = sel.worst[i], own = i === sel.r || i === 4 + sel.c, y = Y(v);
        if (own) pen.rect(x - bw / 2, y, bw, A.y + A.h - y, c.ink);
        else { ctx.fillStyle = pattern; ctx.fillRect(x - bw / 2, y, bw, A.y + A.h - y); }
        if (v > top) pen.line([[x - bw / 2 - 2, A.y + 6], [x + bw / 2 + 2, A.y + 2]], c.paper, 3);
        pen.text(v > top ? p0(v) : p1(v), x, y - 5, { color: own ? c.ink : c.accentInk, size: stacked ? 9 : 10 });
      });
      pen.text('rows', A.x + slot * 2, A.y + A.h + 30, { color: c.soft, size: 10 }); pen.text('columns', A.x + slot * 6, A.y + A.h + 30, { color: c.soft, size: 10 });
      pen.line([[A.x, Y(st.bar)], [A.x + A.w, Y(st.bar)]], c.input, 2);
      const M = stacked ? { x: 24, y: 290, w: w - 48, h: h - 300 } : { x: Math.round(w * 0.56) + 16, y: 26, w: w - Math.round(w * 0.56) - 40, h: h - 60 };
      const sx = v => M.x + Math.min(v, 0.2) / 0.2 * M.w, axisY = M.y + Math.min(M.h / 2 + 8, 110);
      pen.text('one scale, 0% to 20%', M.x, M.y, { align: 'left', color: c.soft, size: 11 });
      if (!st.unlocked) { pen.text('Answer the question to see the marks.', M.x + M.w / 2, axisY, { color: c.soft, size: 11 }); return; }
      const L = sv.leak.v, F = sv.faint.v;
      if (L < F) pen.rect(sx(L), axisY - 12, sx(F) - sx(L), 24, c.inputSoft);
      pen.line([[M.x, axisY], [M.x + M.w, axisY]], c.soft, 1);
      [0, 0.05, 0.1, 0.15, 0.2].forEach(v => { pen.line([[sx(v), axisY - 3], [sx(v), axisY + 3]], c.soft, 1); pen.text(`${Math.round(v * 100)}%`, sx(v), axisY + 54, { color: c.soft, size: 10 }); });
      const lx = sx(L), fx = sx(F);
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(lx - 6, axisY - 16); ctx.lineTo(lx + 6, axisY - 16); ctx.lineTo(lx, axisY - 4); ctx.fill();
      pen.rect(fx - 5, axisY + 4, 10, 10, c.ink);
      const lt = `${L > 0.2 ? '› ' : ''}leak ${p1(L)}`, ft = `${F > 0.2 ? '› ' : ''}rural ${p1(F)}`;
      const clampX = (x, t) => Math.min(Math.max(x, M.x + t.length * 3.3), M.x + M.w - t.length * 3.3);
      pen.text(lt, clampX(lx, lt), axisY - 22, { color: c.accentInk, size: 11 });
      pen.text(ft, clampX(fx, ft), axisY + 30, { color: c.ink, size: 11 });
      const bx = sx(st.bar);
      pen.line([[bx, axisY - 42], [bx, axisY + 16]], c.input, 2.5);
      pen.text(`bar ${num(st.bar * 100, 1)}%`, clampX(bx, 'bar 00.0%'), axisY - 48, { color: c.input, size: 11, weight: 500 });
    }

    function exploreWhy(m) {
      const N = st.N, fb = st.f * N / FS, d = fb - Math.round(fb), spacing = hzx(FS / N);
      const kk = Math.round(fb);
      if (near(d, 0, 1e-6)) {
        if (kk === 0 || kk === N / 2) return `${hzx(st.f)} sits on bin ${kk}, a bin that is its own mirror: both arrows freeze there and pile up together, so it reads ${p0(m[kk])} on our scale, up to 200% depending on the start. Every other bin reads 0%.`;
        return `${hzx(st.f)} sits exactly on bin ${kk}. Against every other bin the leftover arrow makes whole turns, and so does the mirror arrow, so every chain but one closes: 100% in bin ${kk}, 0% everywhere else. The start dial changes nothing here.`;
      }
      const lo = Math.floor(fb), hi = lo + 1, far = m.map((v, k) => (k === lo || k === hi ? 1 : v)).reduce((a, b) => Math.min(a, b), 1);
      const half = near(Math.abs(fb - lo), 0.5, 1e-6);
      const edge = fb < 1 || fb > N / 2 - 1 ? ` The tone is within one bin of ${fb < 1 ? '0 Hz' : '4,000 Hz'}, where its mirror arrow sits close by, so the mirror chain is long too and the start moves the matches a lot.` : '';
      const head = half ? `${hzx(st.f)} sits halfway between bins ${lo} and ${hi}, ${spacing} apart. Neither sees the whole tone: ${p0(m[lo])} and ${p0(m[hi])}.`
        : `${hzx(st.f)} sits ${num(Math.abs(d), 2)} of a bin from bin ${kk}. The nearest bins read ${p0(m[lo] ?? 0)} and ${p0(m[hi] ?? 0)}.`;
      return `${head} No leftover arrow makes a whole number of turns, so every bin leaks: even the quietest reads ${p1(far)}.${edge}`;
    }
    function chainText() {
      const ch = chains(st.f, st.phi, st.N, st.bin);
      return `Bin ${st.bin} (${hzx(st.bin * FS / st.N)}): counter-clockwise chain ${p1(ch.la)}, mirror chain ${p1(ch.lb)}, joined end to end ${p1(ch.total)}.`;
    }

    function fixFeedback(sv) {
      const L = sv.leak, F = sv.faint, N = st.N, bar = st.bar;
      const lname = `a loud ${keyName(L.r, L.c)} reads ${p1(L.v)} in ${rowOf(L.bin)}`, fname = `the rural ${keyName(F.r, F.c)}'s weakest own bin reads ${p1(F.v)}`;
      const tooLong = N > MAX_N ? `A block of ${N} samples lasts ${ms(N)}, longer than the shortest press, 40 ms: it would run into the next key. Keep it at ${MAX_N} or less. ` : '';
      if (L.v >= F.v) {
        if (st.win === 'none') return `${tooLong}With no window, ${lname}, while ${fname}. The leak mark sits above the rural mark, so no bar fits between them, and the side lobes stay this tall at any length that fits a press.`;
        if (FS * 2 / N > 73) return `${tooLong}With Hann at ${N} samples the main lobe reaches ${hzx(FS * 2 / N)} to each side, past the 73 Hz from 697 to 770 Hz: ${lname}, above the rural mark (${p1(F.v)}). Make the block longer.`;
        return `${tooLong}With Hann at ${N} samples the main lobe ends inside the gap, but at this length the bins land unluckily: ${lname}, above the rural mark (${p1(F.v)}). Try a block a little longer or shorter.`;
      }
      if (tooLong) return `${tooLong}The marks are in the right order, ${p1(L.v)} under ${p1(F.v)}, but the block has to fit inside one press.`;
      if (bar <= L.v) return `The marks are in order: the worst leak is ${p1(L.v)} and the faintest rural key ${p1(F.v)}. But your bar, ${num(bar * 100, 1)}%, sits at or under the leak, so ${lname} and that press is thrown out. Raise the bar into the gap.`;
      if (bar >= F.v) return `The marks are in order: the worst leak is ${p1(L.v)} and the faintest rural key ${p1(F.v)}. But your bar, ${num(bar * 100, 1)}%, sits at or above the rural mark, so ${fname} and it is never heard. Lower the bar into the gap.`;
      return null;
    }

    function pressStatus(p) {
      if (p.decoded === p.total) return ['ok', 'decoded at every start'];
      if (p.thrown >= p.unheard && p.thrown >= p.wrong) return ['thrown', `thrown out at ${p.thrown} of ${p.total} starts`];
      if (p.unheard >= p.wrong) return ['unheard', `never heard at ${p.unheard} of ${p.total} starts`];
      return ['wrong', `read as the wrong key at ${p.wrong} of ${p.total} starts`];
    }

    function buildPads() {
      const pads = $('pads');
      pads.replaceChildren();
      ['loud', 'faint'].forEach(who => {
        const box = document.createElement('div'); box.className = 'pad';
        const h = document.createElement('p'); h.className = 'pad-title'; h.textContent = who === 'loud' ? 'Loud customer' : 'Rural customer';
        const grid = document.createElement('div'); grid.className = 'pad-grid'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', `${h.textContent}'s 16 presses`);
        LABELS.forEach((row, r) => row.forEach((lab, c) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'pad-key'; b.dataset.who = who; b.dataset.r = r; b.dataset.c = c;
          b.tabIndex = -1;
          b.addEventListener('click', () => { st.sel = { who, r, c }; render(); });
          b.addEventListener('keydown', ev => {
            const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
            if (!moves[ev.key]) return;
            ev.preventDefault();
            const [dr, dc] = moves[ev.key], nr = (r + dr + 4) % 4, nc = (c + dc + 4) % 4;
            st.sel = { who, r: nr, c: nc }; render();
            pads.querySelector(`[data-who="${who}"][data-r="${nr}"][data-c="${nc}"]`).focus();
          });
          grid.append(b);
        }));
        box.append(h, grid); pads.append(box);
      });
    }
    function renderPads(sv) {
      host.querySelectorAll('.pad-key').forEach(b => {
        const p = sv.presses.find(q => q.who === b.dataset.who && q.r === Number(b.dataset.r) && q.c === Number(b.dataset.c));
        const [cls, text] = pressStatus(p), lab = keyName(p.r, p.c);
        const isSel = st.sel.who === p.who && st.sel.r === p.r && st.sel.c === p.c;
        b.className = `pad-key k-${cls}${isSel ? ' sel' : ''}`;
        b.textContent = `${lab} ${cls === 'ok' ? '✓' : cls === 'thrown' ? '✗' : cls === 'unheard' ? '○' : '?'}`;
        b.setAttribute('aria-label', `${p.who === 'loud' ? 'Loud' : 'Rural'} ${lab}: ${text}`);
        b.setAttribute('aria-pressed', String(isSel));
        b.tabIndex = (st.sel.who === p.who ? (isSel ? 0 : -1) : (p.r === 0 && p.c === 0 ? 0 : -1));
        b.disabled = !st.unlocked;
      });
    }

    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Play loops the block over and over, the way the DFT sees it.' : 'Not playing. Play sounds the selected key as it arrives on the line.';
      if (!explore) { const p = st.sel; return `Playing the ${p.who === 'loud' ? 'loud' : 'rural'} ${keyName(p.r, p.c)}: ${hz(ROWS[p.r])} Hz and ${hz(COLS[p.c])} Hz together.`; }
      const fb = st.f * st.N / FS;
      if (st.steady) return `Playing the steady ${hzx(st.f)} tone: one pure pitch.`;
      return near(fb, Math.round(fb), 1e-6) ? `Playing the ${st.N}-sample block on repeat. The tone makes whole turns in the block, so the repeats join smoothly: a pure ${hzx(st.f)} tone.`
        : `Playing the ${st.N}-sample block on repeat. The block ends partway through a turn, so every repeat jumps: the jumps are the leakage you can hear, extra tones at the bins.`;
    }
    function render8k() {
      if (!explore) {
        const p = st.sel, S = (p.who === 'loud' ? CASES[st.caseIx].loud : CASES[st.caseIx].faint) * 0.22;
        return Float32Array.from({ length: FS }, (_, n) => S * (Math.cos(TAU * ROWS[p.r] * n / FS) + Math.cos(TAU * COLS[p.c] * n / FS)));
      }
      if (st.steady) return Float32Array.from({ length: FS * 32 }, (_, n) => 0.5 * Math.cos(TAU * st.f * n / FS + st.phi));
      const reps = Math.ceil(FS / st.N);
      return Float32Array.from({ length: st.N * reps }, (_, i) => 0.5 * Math.cos(TAU * st.f * (i % st.N) / FS + st.phi));
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : explore ? 'Play the block on repeat' : 'Play this key'; $('now').textContent = nowText(); } });

    function render() {
      if (explore) {
        const N = st.N, step = stepOf(N), m = blockMatches(st.f, st.phi, N);
        host.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.n) === N)));
        Object.assign($('tone'), { step, value: st.f, disabled: !st.revealed });
        $('tone-out').textContent = `${hzx(st.f)} (bin ${num(st.f * N / FS, 3)})`;
        Object.assign($('start'), { value: Math.round(st.phi * 180 / Math.PI), disabled: !st.dial });
        $('start-out').textContent = `${Math.round(st.phi * 180 / Math.PI)}°`;
        Object.assign($('bin'), { max: N / 2, value: st.bin, disabled: !st.revealed });
        $('bin-out').textContent = `${st.bin} (${hzx(st.bin * FS / N)})`;
        host.querySelectorAll('[data-n]').forEach(b => { b.disabled = !st.revealed; });
        $('t770').disabled = !st.revealed;
        $('pin').disabled = !st.revealed; $('play').disabled = !st.revealed; $('steady').disabled = !st.revealed;
        $('steady').setAttribute('aria-pressed', String(st.steady));
        if (st.revealed) {
          $('result').textContent = `${N} samples · bins ${hzx(FS / N)} apart · tone ${hzx(st.f)} · start ${Math.round(st.phi * 180 / Math.PI)}°`;
          $('why').textContent = `${exploreWhy(m)} ${chainText()}`;
        } else {
          $('result').textContent = `${N} samples · bins ${hzx(FS / N)} apart · tone ${hzx(st.f)}`;
          $('why').textContent = 'Answer the question above to see what the bins catch.';
        }
        $('key-pin').hidden = !st.pinned;
        $('compare').hidden = !st.pinned;
        if (st.pinned) {
          if (st.pinned.N !== N) $('compare').textContent = `Pinned: ${st.pinned.N} samples, ${hzx(st.pinned.f)}. Switch back to ${st.pinned.N} samples to compare bin by bin.`;
          else {
            let big = 0, kb = 0;
            m.forEach((v, k) => { if (Math.abs(v - st.pinned.m[k]) > big) { big = Math.abs(v - st.pinned.m[k]); kb = k; } });
            $('compare').textContent = big < 0.0005 ? `Pinned: ${hzx(st.pinned.f)}, start ${st.pinned.deg}°. Nothing has changed yet: move a control to compare.`
              : `Pinned: ${hzx(st.pinned.f)}, start ${st.pinned.deg}°. The biggest change is bin ${kb}: ${p1(st.pinned.m[kb])} pinned, ${p1(m[kb])} now.`;
          }
        }
        $('stage').setAttribute('aria-label', st.revealed ? `Matches of a ${hzx(st.f)} tone over a ${N}-sample block at every bin from 0 to 4,000 Hz, and the two chains of bin ${st.bin}.` : 'The bins of the block, before your prediction.');
      } else {
        const e = engine(st.N, st.win), sv = survey(e, CASES[st.caseIx], st.bar);
        st.sv = sv;
        host.querySelectorAll('[data-win]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.win === st.win)); b.disabled = !st.unlocked; });
        Object.assign($('len'), { value: st.N, disabled: !st.unlocked });
        $('len-out').textContent = `${st.N} samples, ${ms(st.N)}${st.N > MAX_N ? ', longer than a press' : ''}`;
        Object.assign($('bar'), { value: Math.round(st.bar * 1000) / 10, disabled: !st.unlocked });
        $('bar-out').textContent = `${num(st.bar * 100, 1)}%`;
        $('task-text').textContent = CASES[st.caseIx].text;
        $('play').disabled = !st.unlocked;
        renderPads(sv);
        const loudOk = sv.presses.filter(p => p.who === 'loud' && p.decoded === p.total).length, faintOk = sv.presses.filter(p => p.who === 'faint' && p.decoded === p.total).length;
        if (!st.unlocked) {
          $('result').textContent = `${st.win === 'hann' ? 'Hann' : 'No window'} · ${st.N} samples · bar ${num(st.bar * 100, 1)}%`;
          $('why').textContent = 'Answer the question above to unlock the controls.';
        } else {
          $('result').textContent = `${st.win === 'hann' ? 'Hann' : 'No window'} · ${st.N} samples · bar ${num(st.bar * 100, 1)}% · decoded: loud ${loudOk} of 16, rural ${faintOk} of 16`;
          const fb = fixFeedback(sv);
          const wasSolved = st.solved;
          st.solved = !fb;
          $('why').textContent = fb || `Fixed. All 32 presses decode at every start. The worst loud leak is ${p1(sv.leak.v)}, the faintest rural key ${p1(sv.faint.v)}, and your bar at ${num(st.bar * 100, 1)}% sits between them, in a ${ms(st.N)} block. ${CASES[st.caseIx].end}`;
          if (st.solved && !wasSolved) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
          const p = sv.presses.find(q => q.who === st.sel.who && q.r === st.sel.r && q.c === st.sel.c);
          $('compare').hidden = false;
          $('compare').textContent = `Selected: ${p.who === 'loud' ? 'loud' : 'rural'} ${keyName(p.r, p.c)}, ${pressStatus(p)[1]}. The bars show its worst start.`;
        }
        $('another').hidden = !st.solved;
        $('stage').setAttribute('aria-label', st.unlocked ? `The eight keypad bins for the selected press, with the bar at ${num(st.bar * 100, 1)}%, and one scale with the worst loud leak at ${p1(sv.leak.v)} and the weakest rural key at ${p1(sv.faint.v)}.` : 'The eight keypad bins, before your prediction.');
      }
      stage.redraw();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    function buildAsks() {
      if (explore) {
        K.ask($('ask'), {
          question: 'A block of 16 samples, so the bins are 500 Hz apart. The tone is 1,250 Hz, halfway between the 1,000 and 1,500 Hz bins. Which bins will read exactly 0%?',
          options: [['far', 'Every bin except the two nearest'], ['even', 'Every other bin'], ['none', 'None of them']], right: 'none',
          hints: { far: 'Try the 2,500 Hz bin. Against it the leftover arrow turns 56.25° per sample, 900° over 16 samples. Is that a whole number of turns?',
            even: 'Try the 2,000 Hz bin. Against it the leftover arrow turns 33.75° per sample, 540° over 16 samples: one and a half turns. Does that chain close?' },
          explain: 'None. Halfway between bins, every leftover arrow ends half a turn short of whole, so no chain closes and every bin leaks. The slider, the block length and the chains are yours now.',
          reveal: 'Skip: show me', solved: st.revealed ? 'right' : null,
          onSolved: () => { st.revealed = true; render(); askDial(); }, focusAfter: () => $('tone'),
        });
        if (st.revealed) askDial();
        return;
      }
      $('ask2').replaceChildren();
      if (st.caseIx !== 0) { st.unlocked = true; return; }
      const q = document.createElement('div');
      $('ask2').append(q);
      K.ask(q, {
        question: 'Before you touch anything: suppose you switch on the Hann window at 256 samples and keep the live 12% bar. What happens on these two lines?',
        options: [['all', 'Every press decodes'], ['rural', 'The loud presses decode; the rural keys are never heard'], ['loud', 'The rural keys decode; the loud presses are thrown out']], right: 'rural',
        hints: { all: 'The window lowers the leak, but does it make a rural key any louder? Its own bins sit near a tenth of a full match.',
          loud: 'Even from a key twice as loud, Hann at 256 leaks only a few percent. Is that anywhere near 12%?' },
        explain: 'The window cures the loud keys, but 12% is still above every rural key. The controls are yours: watch the two marks and find a setting that decodes all 32.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => host.querySelector('[data-win="hann"]'),
      });
    }
    function askDial() {
      K.ask($('ask2'), {
        question: 'Next, the start dial. Put the tone exactly on a bin (the lab moves it to 1,000 Hz) and turn the dial. What happens to the matches?',
        options: [['nothing', 'Nothing moves'], ['others', 'The other bins wobble a little'], ['own', 'Its own bin wobbles; the rest stay at 0%']], right: 'nothing',
        hints: { others: 'On a bin, both arrows make whole turns against every other bin. Does a closed chain open up because it starts somewhere else?',
          own: 'On its own bin the counter-clockwise arrow piles up straight to 100%, and the mirror arrow\'s chain closes. Does turning the start change the length of a straight pile?' },
        explain: 'Nothing moves: every chain except the full pile closes, and a new start only turns the whole picture. Now slide the tone off the bin and turn the dial again: every bin breathes.',
        reveal: 'Skip: show me', solved: st.dial ? 'right' : null,
        onSolved: () => { st.dial = true; st.f = 1000; st.phi = 0; render(); }, focusAfter: () => $('start'),
      });
    }

    if (!explore) {
      ['explore-controls', 'key1', 'pin', 'steady', 'jump'].forEach(k => { $(k).hidden = true; });
      ['fix-controls', 'task', 'key2'].forEach(k => { $(k).hidden = false; });
      $('title').textContent = 'Lab, act 2: fix the detector';
      $('play').textContent = 'Play this key';
      buildPads();
    }
    buildAsks();

    if (explore) {
      host.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
        const N = Number(b.dataset.n), s = stepOf(N);
        st.N = N; st.f = Math.min(4000, Math.round(st.f / s) * s); st.bin = Math.min(st.bin, N / 2);
        if (N === 256 && st.bin < 8) st.bin = Math.round(st.f * N / FS);
        render();
      }));
      $('t770').addEventListener('click', () => { st.f = 770; st.N = 256; st.bin = 27; render(); });
      $('tone').addEventListener('input', () => { const s = stepOf(st.N); st.f = Math.round(Number($('tone').value) / s) * s; render(); });
      $('start').addEventListener('input', () => { st.phi = Number($('start').value) * Math.PI / 180; render(); });
      $('bin').addEventListener('input', () => { st.bin = Number($('bin').value); render(); });
      $('stage').addEventListener('click', ev => {
        if (!st.revealed) return;
        const r = $('stage').getBoundingClientRect(), w = r.width, x = ev.clientX - r.left, y = ev.clientY - r.top;
        const stacked = w < 560, Aw = stacked ? w - 60 : Math.round(w * 0.58) - 60, Ah = stacked ? 170 : r.height - 70;
        if (x < 44 || x > 44 + Aw || y > 24 + Ah + 20) return;
        st.bin = Math.max(0, Math.min(st.N / 2, Math.round((x - 44) / Aw * st.N / 2))); render();
      });
      $('pin').addEventListener('click', () => { st.pinned = { N: st.N, f: st.f, deg: Math.round(st.phi * 180 / Math.PI), m: blockMatches(st.f, st.phi, st.N) }; render(); });
      $('steady').addEventListener('click', () => { st.steady = !st.steady; render(); });
    } else {
      host.querySelectorAll('[data-win]').forEach(b => b.addEventListener('click', () => { st.win = b.dataset.win; render(); }));
      $('len').addEventListener('input', () => { const v = Math.round(Number($('len').value) / 8) * 8; st.N = Math.max(64, Math.min(512, v)); render(); });
      $('bar').addEventListener('input', () => { const v = Math.round(Number($('bar').value) * 10) / 1000; st.bar = Math.max(0, Math.min(0.2, v)); render(); });
      $('another').addEventListener('click', () => {
        audio.stop();
        st.caseIx = (st.caseIx + 1) % CASES.length;
        Object.assign(st, { win: 'none', N: 256, bar: 0.12, solved: false, sel: { who: 'loud', r: 1, c: 0 } });
        buildAsks(); render(); host.querySelector('[data-win="none"]').focus();
      });
    }
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(st, { N: 16, f: 1250, phi: 0, bin: 3, pinned: null, steady: false });
      else Object.assign(st, { win: 'none', N: 256, bar: 0.12, solved: false, sel: { who: 'loud', r: 1, c: 0 } });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  K.ask(document.getElementById('predict-split'), {
    question: 'Will the 1,000 and 2,000 Hz bins split the 1,500 Hz tone, half each, with every other bin at zero?',
    options: [['split', 'Yes: half each, the rest at 0%'], ['near', 'The two nearest get most of it, but the rest are not zero'], ['one', 'One of the two bins takes it all']], right: 'near',
    hints: { split: 'Remember lesson 12: when 770 Hz fell between two bins, did the bins next door stay empty?', one: 'The tone sits exactly halfway between them. Why would one side win?' },
    explain: 'Neither nearest bin sees the whole tone, and every other bin catches some of it. Here are the numbers.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-split' })),
  });

  const act1 = mountLab(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const mount = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    mount.replaceChildren(host);
    mountLab(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
