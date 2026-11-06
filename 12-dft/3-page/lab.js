(() => {
  const K = window.Kit, FS = 8000, TAU = 2 * Math.PI, BAR = 0.25;
  const { fmt, hz, MINUS } = K;
  const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477, 1633];
  const KEYS = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
  const pct = v => (v > 0 && v < 0.005 ? 'under 1%' : `${Math.round(v * 100)}%`);
  const num = v => (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1));
  const ms = N => `${num(N / 8)} ms`;
  const apart = N => `${Number.isInteger(FS / N) ? hz(FS / N) : (FS / N).toFixed(1)} Hz`;
  const nearBin = (f, N) => Math.round(f * N / FS);
  const joinList = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const where = d => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (KEYS[i][j] === d) return [i, j]; return null; };

  function dft(x, k) {
    const N = x.length; let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const a = -TAU * k * n / N; re += x[n] * Math.cos(a); im += x[n] * Math.sin(a); }
    return [re, im];
  }
  function walkOf(x, k) {
    const N = x.length, pts = [[0, 0]];
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const a = -TAU * k * n / N; re += x[n] * Math.cos(a); im += x[n] * Math.sin(a); pts.push([re, im]); }
    return pts;
  }
  function head(ctx, x1, y1, x2, y2, color, size = 7) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2, y2); ctx.lineTo(x2 - size * Math.cos(a - 0.42), y2 - size * Math.sin(a - 0.42)); ctx.lineTo(x2 - size * Math.cos(a + 0.42), y2 - size * Math.sin(a + 0.42));
    ctx.closePath(); ctx.fill();
  }
  function tri(ctx, x, y, color, s = 5) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s * 0.8); ctx.lineTo(x - s, y + s * 0.8); ctx.closePath(); ctx.fill(); }

  const phaseText = p => (p === 0 ? 'at the right' : p === 90 ? 'at the bottom, a quarter turn behind' : p === 180 ? 'at the left, half a turn behind'
    : p === 270 ? 'at the top, three quarters of a turn behind' : p < 90 ? `${p}° below the right` : p < 180 ? `${180 - p}° below the left`
    : p < 270 ? `${p - 180}° above the left` : `${360 - p}° above the right`);
  const turnsText = k => `${k} turn${k === 1 ? '' : 's'}`;

  const CASES = [
    { limitMs: 40, lo: 60, hi: 100, text: 'A customer is keying in a four-digit account number. The presses arrive at different loudness, so their bins will not all score what the key 5 did. Set the block length N so the eight keypad tones land on eight different bins with room between them. Then read each press: pick the row bin and the column bin that clear the 25% bar.' },
    { limitMs: 25, lo: 34, hi: 70, text: 'Another exchange joins your line. Its keypads send presses as short as 25 ms, so a block must fit inside 25 ms. Find a block length that still gives every tone its own bin with room around it, then read the number.' },
    { limitMs: 40, lo: 60, hi: 100, text: 'Back on your own line: a new caller with a new account number, and presses at new loudness. Set N and read it.' },
  ];

  function status(N, c) {
    const rb = ROWS.map(f => nearBin(f, N)), cb = COLS.map(f => nearBin(f, N));
    const groups = [[ROWS, rb], [COLS, cb]];
    if (N > c.limitMs * 8) return { kind: 'long', rb, cb, text: `A block of ${N} samples lasts ${ms(N)}, longer than the shortest press this line must catch (${c.limitMs} ms). A quick press would end before the block fills. Shorten the block.` };
    const shared = [];
    groups.forEach(([tones, bins]) => {
      const byBin = {};
      bins.forEach((b, i) => (byBin[b] = byBin[b] || []).push(tones[i]));
      Object.entries(byBin).forEach(([b, fs]) => { if (fs.length > 1) shared.push(`${joinList(fs.map(hz))} Hz ${fs.length > 2 ? 'all ' : ''}share bin ${b}`); });
    });
    if (shared.length) return { kind: 'collide', rb, cb, text: `Too short: ${joinList(shared)}, so the detector cannot tell those keys apart. Lengthen the block.` };
    const tight = [];
    groups.forEach(([tones, bins]) => bins.forEach((b, i) => { if (i < 3 && bins[i + 1] - b === 1) tight.push(`${hz(tones[i])} and ${hz(tones[i + 1])} Hz sit in neighboring bins ${b} and ${b + 1}`); }));
    if (tight.length) return { kind: 'tight', rb, cb, tight, text: `Closer. Every tone has its own bin now, but ${joinList(tight.slice(0, 2))}${tight.length > 2 ? ', among others,' : ''} with no empty bin between. Spill from one tone can lift its neighbor's bin over the bar.` };
    return { kind: 'good', rb, cb, text: `Every keypad tone has its own bin with an empty bin on each side, and a block lasts ${ms(N)}, inside the shortest press (${c.limitMs} ms).` };
  }

  function pressBlock(p, N) {
    const wr = TAU * ROWS[p.i] / FS, wc = TAU * COLS[p.j] / FS;
    return Float64Array.from({ length: N }, (_, n) => (n < p.len ? p.a * (Math.cos(wr * n + p.pr) + Math.cos(wc * n + p.pc)) : 0));
  }
  function shares(x, bins) { const N = x.length; return bins.map(k => Math.hypot(...dft(x, k)) / (N / 2)); }
  function clean(p, N) {
    const x = pressBlock(p, N), rs = shares(x, ROWS.map(f => nearBin(f, N))), cs = shares(x, COLS.map(f => nearBin(f, N)));
    return rs.filter(v => v > BAR).length === 1 && rs[p.i] > BAR && cs.filter(v => v > BAR).length === 1 && cs[p.j] > BAR;
  }
  function makeCase(ix) {
    const c = CASES[ix], good = [];
    for (let N = 8; N <= 400; N++) if (status(N, c).kind === 'good') good.push(N);
    for (let tries = 0; tries < 300; tries++) {
      const digits = Array.from({ length: 4 }, () => '0123456789'[Math.floor(Math.random() * 10)]);
      if (new Set(digits).size === 1) continue;
      const presses = digits.map(d => {
        const [i, j] = where(d);
        return { d, i, j, a: 0.55 + Math.random() * 0.45, pr: Math.random() * TAU, pc: Math.random() * TAU, len: Math.round(FS * (c.lo + Math.random() * (c.hi - c.lo)) / 1000) };
      });
      if (good.every(N => presses.every(p => clean(p, N)))) return { ...c, ix, presses, digits, good };
    }
    return null;
  }

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('dft-lab').content.cloneNode(true));
    const uid = `${host.id}-`, $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = explore
      ? { f: 2000, phase: 180, N: 8, k: 2, revealed: false, barsOn: false, stage: 0, pinned: null }
      : { caseIx: 0, N: 40, block: 0, row: null, col: null, decoded: [null, null, null, null], unlocked: false, solved: false, announced: false, fb: '', c: null };
    if (!explore) st.c = makeCase(0);

    const signal = () => Float64Array.from({ length: st.N }, (_, n) => Math.cos(TAU * st.f * n / FS - st.phase * Math.PI / 180));
    const isPress = () => st.block % 2 === 0;
    const press = () => st.c.presses[st.block / 2];
    const block = () => (isPress() ? pressBlock(press(), st.N) : new Float64Array(st.N));
    const st0 = () => status(st.N, st.c);

    const walkStage = K.stage($('walk'), s => (explore ? drawWalk(s) : drawTrace(s)), { height: w => (explore ? (w < 560 ? 300 : 290) : 150) });
    const barStage = K.stage($('bars'), s => (explore ? drawBars1(s) : drawBars2(s)), { height: w => (explore ? (w < 560 ? 230 : 220) : (w < 560 ? 270 : 250)) });

    function drawWalk(s) {
      const { pen, c, w, h, ctx } = s;
      if (!st.revealed) { pen.text('Answer the question above to see the walk.', w / 2, h / 2, { color: c.soft, size: 14, font: 'body' }); return; }
      const x = signal(), pts = walkOf(x, st.k), pin = st.pinned ? st.pinned.pts : null;
      const all = pin ? pts.concat(pin) : pts;
      const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0])), minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
      const inset = 64, padL = 24, padR = inset + 16, padT = 30, padB = 30;
      const scale = Math.min(70, (w - padL - padR) / Math.max(maxX - minX, 1e-6), (h - padT - padB) / Math.max(maxY - minY, 1e-6));
      const cx = padL + (w - padL - padR) / 2 - (minX + maxX) / 2 * scale, cy = padT + (h - padT - padB) / 2 + (minY + maxY) / 2 * scale;
      const P = ([a, b]) => [cx + a * scale, cy - b * scale];
      if (pin) { pen.line(pin.map(P), c.input, 1.6, [5, 4]); const [ex, ey] = P(pin[pin.length - 1]); pen.ring(ex, ey, 4, c.input, 1.5); }
      const heads = st.N <= 32;
      for (let n = 0; n < x.length; n++) {
        if (Math.abs(x[n]) < 1e-9) continue;
        const [x1, y1] = P(pts[n]), [x2, y2] = P(pts[n + 1]);
        pen.line([[x1, y1], [x2, y2]], c.ink, heads ? 1.8 : 1.2);
        if (heads && Math.hypot(x2 - x1, y2 - y1) > 9) head(ctx, x1, y1, x2, y2, c.ink, 8);
      }
      const [sx, sy] = P(pts[0]), [ex, ey] = P(pts[pts.length - 1]), m = Math.hypot(...pts[pts.length - 1]);
      pen.ring(sx, sy, 5, c.ink, 1.5);
      if (m * scale > 3) { pen.line([[sx, sy], [ex, ey]], c.accent, 3.4, [10, 5]); head(ctx, sx, sy, ex, ey, c.accent, 11); }
      pen.text(`match ${fmt(m)}`, 12, 20, { align: 'left', color: c.accentInk, size: 14, weight: 500 });
      pen.text(`${st.N} samples, drawn to fit`, 12, h - 10, { align: 'left', color: c.soft, size: 10 });
      const wx = w - inset / 2 - 8, wy = 46, R = 22, a = -st.phase * Math.PI / 180;
      pen.ring(wx, wy, R, c.soft, 1.2);
      pen.line([[wx - R - 6, wy], [wx + R + 6, wy]], c.rule, 1);
      pen.dot(wx + R * Math.cos(a), wy - R * Math.sin(a), 5, c.input);
      pen.text('tone starts', wx, wy + R + 18, { color: c.soft, size: 10 });
    }

    function drawBars1(s) {
      const { pen, c, w, h } = s;
      if (!st.barsOn) return;
      const x = signal(), half = Math.floor(st.N / 2), ms_ = Array.from({ length: half + 1 }, (_, k) => Math.hypot(...dft(x, k)));
      const A = { x: 40, y: 24, w: w - 56, h: h - 74 }, top = Math.max(st.N / 2, ...ms_) * 1.12;
      const X = k => A.x + (k + 0.5) * A.w / (half + 1), Y = v => A.y + A.h - v / top * A.h;
      const bw = Math.max(1.5, Math.min(26, A.w / (half + 1) * 0.66));
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      pen.text('match', A.x - 6, A.y - 8, { align: 'left', color: c.soft, size: 11 });
      pen.text(fmt(st.N / 2, 0), A.x - 6, Y(st.N / 2) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.line([[A.x - 3, Y(st.N / 2)], [A.x, Y(st.N / 2)]], c.soft, 1);
      ms_.forEach((v, k) => {
        pen.rect(X(k) - bw / 2, Y(v), bw, Y(0) - Y(v), c.ink);
        if (half <= 16 && v >= 0.005) pen.text(fmt(v), X(k), Y(v) - 6, { color: c.ink, size: 10 });
      });
      const sel = X(st.k);
      pen.line([[sel - bw / 2 - 3, Y(ms_[st.k]) - 3], [sel + bw / 2 + 3, Y(ms_[st.k]) - 3], [sel + bw / 2 + 3, Y(0)], [sel - bw / 2 - 3, Y(0)], [sel - bw / 2 - 3, Y(ms_[st.k]) - 3]], c.input, 2);
      const every = Math.max(1, Math.ceil((half + 1) / Math.max(4, Math.floor(A.w / 64))));
      for (let k = 0; k <= half; k += every) {
        pen.text(String(k), X(k), Y(0) + 16, { color: c.soft, size: 10 });
        pen.text(`${hz(k * FS / st.N)}`, X(k), Y(0) + 30, { color: c.soft, size: 9 });
      }
      pen.text('turns', A.x - 6, Y(0) + 16, { align: 'right', color: c.soft, size: 10 });
      pen.text('Hz', A.x - 6, Y(0) + 30, { align: 'right', color: c.soft, size: 9 });
    }

    function drawTrace(s) {
      const { pen, c, w, h } = s, x = block(), A = { x: 30, y: 22, w: w - 44, h: h - 48 };
      const X = n => A.x + n / Math.max(1, x.length - 1) * A.w, Y = v => A.y + A.h / 2 - v / 2.2 * A.h / 2;
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      pen.line(Array.from(x, (v, n) => [X(n), Y(v)]), c.ink, 1.2);
      const label = isPress() ? `press ${st.block / 2 + 1}: the first ${st.N} samples, ${ms(st.N)}` : `the gap after press ${(st.block + 1) / 2}: silence, ${st.N} samples`;
      pen.text(label, A.x, 14, { align: 'left', color: c.soft, size: 11 });
      pen.text('n = 0', A.x, A.y + A.h + 18, { align: 'left', color: c.soft, size: 10 });
      pen.text(String(st.N - 1), A.x + A.w, A.y + A.h + 18, { align: 'right', color: c.soft, size: 10 });
    }

    function drawBars2(s) {
      const { pen, c, w, h, ctx } = s, x = block(), N = st.N, f0 = 550, f1 = 2050;
      const A = { x: 40, y: 26, w: w - 52, h: h - 112 };
      const X = f => A.x + (f - f0) / (f1 - f0) * A.w, Y = v => A.y + A.h - Math.min(v, 1.1) / 1.1 * A.h;
      const ks = []; for (let k = Math.ceil(f0 * N / FS); k * FS / N <= f1; k++) ks.push(k);
      const ss = st0(), keyBins = new Set([...ss.rb, ...ss.cb]);
      const bw = Math.max(1.5, Math.min(14, A.w / Math.max(ks.length, 1) * 0.6));
      pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
      [[0, '0%'], [0.5, '50%'], [1, '100%']].forEach(([v, t]) => pen.text(t, A.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }));
      const vals = {};
      ks.forEach(k => {
        const v = Math.hypot(...dft(x, k)) / (N / 2); vals[k] = v;
        const key = keyBins.has(k), chosen = (st.row !== null && ss.rb[st.row] === k) || (st.col !== null && ss.cb[st.col] === k);
        pen.rect(X(k * FS / N) - bw / 2, Y(v), bw, Y(0) - Y(v), key ? c.ink : c.soft, key ? 1 : 0.35);
        if (chosen) pen.line([[X(k * FS / N) - bw / 2 - 3, Y(v) - 3], [X(k * FS / N) + bw / 2 + 3, Y(v) - 3], [X(k * FS / N) + bw / 2 + 3, Y(0)], [X(k * FS / N) - bw / 2 - 3, Y(0)], [X(k * FS / N) - bw / 2 - 3, Y(v) - 3]], c.input, 2);
      });
      pen.line([[A.x, Y(BAR)], [A.x + A.w, Y(BAR)]], c.soft, 1.2, [6, 4]);
      pen.text('bar 25%', A.x + A.w, Y(BAR) - 6, { align: 'right', color: c.ink, size: 11 });
      let lastX = -99;
      [...keyBins].sort((a, b) => a - b).forEach(k => {
        const v = vals[k]; if (v === undefined) return;
        const px = X(k * FS / N);
        if (v > BAR || px - lastX > 30) { pen.text(pct(v), px, Y(v) - 8, { color: c.ink, size: 10 }); lastX = px; }
      });
      [[ROWS, ss.rb], [COLS, ss.cb]].forEach(([tones, bins]) => tones.forEach((f, i) => {
        tri(ctx, X(f), Y(0) + 12, c.soft, 4.5);
        pen.text(String(bins[i]), X(f), Y(0) + (i % 2 ? 40 : 28), { color: c.ink, size: 11 });
      }));
      pen.text('bin', A.x - 6, Y(0) + 28, { align: 'right', color: c.soft, size: 10 });
      [600, 1000, 1400, 1800].forEach(f => pen.text(`${hz(f)}`, X(f), Y(0) + 58, { color: c.soft, size: 10 }));
      pen.text('Hz', A.x + A.w, Y(0) + 58, { align: 'right', color: c.soft, size: 10 });
      pen.text('match of each bin, as a share of N ÷ 2', A.x, 14, { align: 'left', color: c.soft, size: 11 });
      pen.text(`bins every ${apart(N)} · under each tone: its bin`, A.x, Y(0) + 76, { align: 'left', color: c.soft, size: 10 });
    }

    function keyHtml() {
      const item = (cls, t) => `<span><i class="${cls}"></i>${t}</span>`;
      if (explore) return [item('l12-k-walk', "each sample's arrow, tip to tail"), item('l12-k-match', 'the match: start to end'), item('l12-k-start', 'where the tone starts'),
        st.pinned ? item('l12-k-pin', 'pinned walk') : '', st.barsOn ? item('l12-k-pick', 'your test wheel') : ''].join('');
      return [item('l12-k-bar', 'keypad bin'), item('l12-k-faint', 'other bin, not checked'), item('l12-k-tone', 'a keypad tone'), item('l12-k-line', 'the 25% bar'), item('l12-k-pick', 'your pick')].join('');
    }

    function exploreWhy(m, re, im) {
      const x0 = () => signal().every(v => Math.abs(v) < 1e-9);
      const N = st.N, turns = st.f * N / FS, whole = Math.abs(turns - Math.round(turns)) < 1e-9, mT = Math.round(turns);
      const dir = st.phase === 0 ? 'to the right' : `where the tone's dot started, ${phaseText(st.phase)}`;
      if (whole && mT === st.k && x0()) return `Every sample is 0: ${st.f === 0 ? 'the dot never turns, and it sits at' : 'the dot flips between'} ${st.phase === 90 ? 'the bottom' : 'the top'}${st.f === 0 ? '' : ` and ${st.phase === 90 ? 'the top' : 'the bottom'}`} of the wheel, where the left-right shadow is zero. There is nothing to pile up, so the match is 0.00.`;
      if (whole && mT === st.k && (mT === 0 || mT === N / 2)) return `${st.f === 0 ? '0 Hz never turns' : `${hz(st.f)} Hz flips every sample`}: it is its own mirror, so both halves pile up, and the match reaches N = ${N} when the tone starts at the right or the left. Here it is ${fmt(m)}.`;
      if (whole && mT === st.k) return `The tone makes exactly ${turnsText(mT)} in ${N} samples, like the test wheel, so the forward half's ${N} half arrows all point the same way and pile up to N ÷ 2 = ${fmt(N / 2, N % 2 ? 1 : 0)}. The mirror half curls away. The match arrow points ${dir}.`;
      if (whole) return `The tone makes ${turnsText(mT)} in the block and the test wheel ${turnsText(st.k)}: a whole number of turns of difference, so the walk closes and the match is 0.00.`;
      return `The tone makes ${turns.toFixed(2)} turns in ${N} samples, not a whole number, so no test wheel matches it exactly. The walk neither piles up fully nor closes: match ${fmt(m)}.`;
    }

    function pinCompare(m) {
      const p = st.pinned, d = `${hz(p.f)} Hz, N = ${p.N}, ${turnsText(p.k)}`;
      if (p.f === st.f && p.N === st.N && p.k === st.k && p.phase === st.phase) return `Pinned ${d}: match ${fmt(p.m)}. Move a control to compare.`;
      let tail = '';
      if (p.f === st.f && p.N === st.N && p.k === st.k) tail = 'Same tone, another start: the walk turns, and its length stays.';
      else if (p.f === st.f && p.N !== st.N) tail = 'A longer block gives the forward half more arrows to pile up, so a matching wheel scores more.';
      else if (p.N === st.N && p.k !== st.k) tail = 'Same block, another test wheel: only a wheel making the tone’s own number of turns piles up.';
      return `Pinned ${d}: match ${fmt(p.m)}. Now ${hz(st.f)} Hz, N = ${st.N}, ${turnsText(st.k)}: match ${fmt(m)}. ${tail}`;
    }

    function renderExplore() {
      const x = signal(), [re, im] = dft(x, st.k), m = Math.hypot(re, im), on = st.revealed;
      ['tone', 'phase', 'n', 'n-down', 'n-up', 'k', 'pin', 'play'].forEach(k => { $(k).disabled = !on; });
      $('tone').value = st.f; $('tone-out').textContent = `${hz(st.f)} Hz`;
      $('phase').value = st.phase; $('phase-out').textContent = phaseText(st.phase);
      $('n').value = st.N; $('n-out').textContent = `N = ${st.N}`;
      $('k').max = Math.floor(st.N / 2); $('k').value = st.k;
      $('k-out').textContent = `${turnsText(st.k)} in the block, ${hz(st.k * FS / st.N)} Hz`;
      $('bars').hidden = !st.barsOn; $('bars-note').hidden = !st.barsOn;
      $('bars-note').textContent = `Bars: one for each test wheel that makes a whole number of turns in the block, from 0 up to N ÷ 2. The next section, "Which test wheels?", says why these wheels.${st.stage >= 3 ? ' When a tone falls between two wheels, its match spreads over its neighbors; lesson 14 is about that spreading.' : ''}`;
      $('key').innerHTML = keyHtml();
      if (on) {
        $('result').textContent = `left-right ${fmt(re)} · up-down ${fmt(im)} · match `;
        const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = fmt(m); $('result').append(sp);
        $('why').textContent = exploreWhy(m, re, im);
      } else { $('result').textContent = `${hz(st.f)} Hz, starting ${phaseText(st.phase)} · N = ${st.N}`; $('why').textContent = 'Answer the question above to see the walk.'; }
      $('compare').hidden = !st.pinned;
      if (st.pinned) $('compare').textContent = pinCompare(m);
      $('walk').setAttribute('aria-label', on ? `The walk of ${st.N} sample arrows against the ${turnsText(st.k)} test wheel. It ends ${fmt(m)} from the start: left-right ${fmt(re)}, up-down ${fmt(im)}.` : 'The walk appears after the question above.');
      if (st.barsOn) {
        const half = Math.floor(st.N / 2), list = Array.from({ length: half + 1 }, (_, k) => Math.hypot(...dft(x, k)));
        const top = list.map((v, k) => [k, v]).filter(([, v]) => v > 0.005).slice(0, 8).map(([k, v]) => `${turnsText(k)}: ${fmt(v)}`);
        $('bars').setAttribute('aria-label', `Match for each test wheel making 0 to ${half} whole turns in the block. ${top.length ? `Nonzero: ${top.join('; ')}${list.filter(v => v > 0.005).length > 8 ? '; and more' : ''}.` : 'All zero.'}`);
      }
      walkStage.resize(); barStage.resize();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
      if (st.stage >= 2 && !st.saw16 && st.N === 16 && st.f === 2000 && st.k === 4) { st.saw16 = true; buildAsks(); }
    }

    function setPicks() {
      const ss = st0(), on = st.unlocked && isPress();
      const fill = (el, tones, bins, sel, kind) => {
        el.replaceChildren(...tones.map((f, i) => {
          const b = document.createElement('button'); b.type = 'button';
          b.textContent = `bin ${bins[i]} · ${hz(f)} Hz`; b.setAttribute('aria-pressed', String(sel === i)); b.disabled = !on;
          b.addEventListener('click', () => { st[kind] = i; st.fb = ''; readPress(); render(); host.querySelector(`[data-k="${kind}s"] button:nth-child(${i + 1})`).focus(); });
          return b;
        }));
      };
      fill($('rows'), ROWS, ss.rb, st.row, 'row'); fill($('cols'), COLS, ss.cb, st.col, 'col');
    }

    function readPress() {
      if (st.row === null || st.col === null) { st.fb = st.row === null && st.col === null ? '' : `Now pick the ${st.row === null ? 'row' : 'column'} bin.`; return; }
      const ss = st0(), p = press(), x = block(), i = st.row, j = st.col;
      const rs = shares(x, ss.rb), cs = shares(x, ss.cb);
      if (ss.kind === 'long') { st.fb = ss.text; return; }
      const mates = (bins, tones, ix) => tones.filter((f, q) => q !== ix && bins[q] === bins[ix]);
      const rm = mates(ss.rb, ROWS, i), cm = mates(ss.cb, COLS, j);
      if (rm.length || cm.length) {
        const [tones, bins, ix, others] = rm.length ? [ROWS, ss.rb, i, rm] : [COLS, ss.cb, j, cm];
        st.fb = `Bin ${bins[ix]} is the nearest bin for ${joinList([tones[ix], ...others].sort((a, b) => a - b).map(hz))} Hz, so this press could be ${joinList([tones[ix], ...others].sort((a, b) => a - b).map(f => `the ${hz(f)} Hz ${rm.length ? 'row' : 'column'}`))}: the detector cannot tell. Lengthen the block until each tone has a bin of its own.`;
        return;
      }
      if (rs[i] < BAR || cs[j] < BAR) {
        const [bin, f, v, what] = rs[i] < BAR ? [ss.rb[i], ROWS[i], rs[i], 'row'] : [ss.cb[j], COLS[j], cs[j], 'column'];
        st.fb = `Bin ${bin} (${hz(f)} Hz) reaches only ${pct(v)}, under the 25% bar. Pick the ${what} bin that clears it.`;
        return;
      }
      const rowsOver = ROWS.map((f, q) => q).filter(q => rs[q] > BAR), colsOver = COLS.map((f, q) => q).filter(q => cs[q] > BAR);
      if (rowsOver.length > 1 || colsOver.length > 1) {
        const [tones, bins, over, vals, what] = rowsOver.length > 1 ? [ROWS, ss.rb, rowsOver, rs, 'row'] : [COLS, ss.cb, colsOver, cs, 'column'];
        st.fb = `${over.length === 2 ? 'Two' : over.length} ${what} bins clear the bar: ${joinList(over.map(q => `bin ${bins[q]} (${hz(tones[q])} Hz) at ${pct(vals[q])}`))}. A key counts only when exactly one ${what} clears it, so the detector throws this press out. Give each tone an empty bin on each side.`;
        return;
      }
      const key = KEYS[i][j];
      if (ss.kind === 'tight') { st.fb = `This press would read ${key}, but only by luck: ${ss.tight[0]}. With no empty bin between them, the next caller's press can push two rows or two columns over the bar. Make room for an empty bin, then read it again.`; return; }
      if (key !== p.d) { st.fb = `That reads ${key}, but the bars say otherwise for this press: check which ${i !== p.i ? 'row' : 'column'} bin is tallest.`; return; }
      st.decoded[st.block / 2] = key;
      st.fb = `Press ${st.block / 2 + 1} reads ${key}: row ${hz(ROWS[i])} Hz (bin ${ss.rb[i]}, ${pct(rs[i])}) and column ${hz(COLS[j])} Hz (bin ${ss.cb[j]}, ${pct(cs[j])}).`;
      if (st.decoded.every(Boolean)) {
        st.solved = true;
        const story = st.c.ix === 1 ? 'The short-press exchange is on the line too.' : 'The call goes straight to billing with the account already found.';
        st.fb += ` Fixed: the line reads ${st.decoded.join(' ')} at N = ${st.N}. ${story}`;
      }
    }

    function renderFix() {
      const ss = st0(), N = st.N;
      $('task-text').textContent = st.c.text;
      ['n', 'n-down', 'n-up', 'play'].forEach(k => { $(k).disabled = !st.unlocked; });
      $('n').value = N; $('n-out').textContent = `N = ${N} · bins ${apart(N)} apart · a block lasts ${ms(N)}`;
      $('n-status').textContent = st.unlocked ? ss.text : 'Answer the question above to unlock N.';
      $('n-status').classList.toggle('k-bad', ss.kind !== 'good');
      $('key').innerHTML = keyHtml();
      const tl = $('timeline');
      tl.replaceChildren(...Array.from({ length: 7 }, (_, b) => {
        const btn = document.createElement('button'); btn.type = 'button';
        btn.textContent = b % 2 === 0 ? `Press ${b / 2 + 1}` : 'gap';
        if (b % 2 === 0 && st.decoded[b / 2]) btn.classList.add('l12-done');
        btn.setAttribute('aria-pressed', String(b === st.block));
        btn.setAttribute('aria-label', b % 2 === 0 ? `Press ${b / 2 + 1}${st.decoded[b / 2] ? `, read as ${st.decoded[b / 2]}` : ''}` : `Gap after press ${(b + 1) / 2}`);
        btn.addEventListener('click', () => { st.block = b; st.row = null; st.col = null; st.fb = isPress() ? '' : 'Silence: no bin clears the bar, so no key. This is the gap between two presses.'; render(); tl.children[b].focus(); });
        return btn;
      }));
      setPicks();
      $('digits').textContent = st.decoded.map(d => d || '_').join(' ');
      $('pick-feedback').textContent = st.unlocked ? (st.fb || (isPress() ? 'Pick one row bin and one column bin.' : 'Silence: no bin clears the bar, so no key.')) : '';
      $('result').textContent = `N = ${N} · ${isPress() ? `press ${st.block / 2 + 1}` : 'gap'} · keypad bins over the bar: `;
      const x = block(), rs = shares(x, ss.rb), cs = shares(x, ss.cb);
      const over = [...new Set([...ss.rb.filter((b, q) => rs[q] > BAR), ...ss.cb.filter((b, q) => cs[q] > BAR)])];
      const sp = document.createElement('span'); sp.className = over.length ? 'changed' : ''; sp.textContent = st.unlocked ? (over.length ? over.length : 'none') : '?';
      $('result').append(sp);
      $('why').textContent = ''; $('why').hidden = true;
      $('another').hidden = !st.solved;
      $('walk').setAttribute('aria-label', isPress() ? `The first ${N} samples of press ${st.block / 2 + 1}: two tones drifting in and out of step.` : `The gap after press ${(st.block + 1) / 2}: silence.`);
      $('bars').setAttribute('aria-label', `Keypad bins at N = ${N}: ${ROWS.map((f, q) => `row ${hz(f)} Hz, bin ${ss.rb[q]}, ${pct(rs[q])}`).join('; ')}; ${COLS.map((f, q) => `column ${hz(f)} Hz, bin ${ss.cb[q]}, ${pct(cs[q])}`).join('; ')}. The bar is 25%.`);
      if (st.solved && !st.announced) { st.announced = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' })); }
      walkStage.resize(); barStage.resize();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    const render = () => (explore ? renderExplore() : renderFix());

    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Press Play to hear the tone.' : 'Not playing. Press Play to hear the four presses.';
      return explore ? `Playing ${hz(st.f)} Hz${st.f === 0 ? ', which is silence: a steady push that never turns' : ''}.` : 'Playing the four presses with the gaps between them, at 8,000 samples a second, on a loop.';
    }
    function render8k() {
      if (explore) return Float32Array.from({ length: FS }, (_, n) => 0.8 * Math.cos(TAU * st.f * n / FS - st.phase * Math.PI / 180));
      const gap = Math.round(FS * 0.12), out = [];
      st.c.presses.forEach(p => { const x = pressBlock(p, p.len); x.forEach(v => out.push(v / 2.1)); for (let n = 0; n < gap; n++) out.push(0); });
      for (let n = 0; n < FS * 0.4; n++) out.push(0);
      return Float32Array.from(out);
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play'; $('now').textContent = nowText(); } });

    function buildAsks() {
      if (explore) {
        if (!$('ask').childElementCount) K.ask($('ask'), {
          question: 'This recording is the 2,000 Hz tone started half a turn behind, at the left: −1, 0, 1, 0, and so on. Against the 2,000 Hz test wheel, with N = 8, what is the match?',
          options: [['0', '0: it hides'], ['-4', `${MINUS}4`], ['4', '4'], ['8', '8']], right: '4',
          hints: { 0: 'It hid at a quarter turn because every product had a zero in it. Here the samples line up with the test tone, only flipped. Do the products cancel?', '-4': `${MINUS}4 is the left-right sum. The match is the length of the walk, and a length is never negative.`, 8: '8 = N is what 0 Hz and 4,000 Hz score, where both halves pile up. A 2,000 Hz tone has a mirror half that curls away.' },
          explain: `The walk is 4 long and points left: the left-right sum is ${MINUS}4, the up-down sum 0, and the match is 4. The arrow points where the dot started. The controls are yours now.`,
          reveal: 'Skip: show me',
          onSolved: () => { st.revealed = true; st.stage = 1; buildAsks(); render(); }, focusAfter: () => $('tone'),
        });
        if (st.stage >= 1 && !$('ask2').childElementCount) K.ask($('ask2'), {
          question: 'Next: keep this 2,000 Hz tone, but take N = 16 samples. Which test wheel piles up, and how long is its walk?',
          options: [['2-4', 'the 2-turn wheel, 4'], ['4-4', 'the 4-turn wheel, 4'], ['4-8', 'the 4-turn wheel, 8'], ['2-8', 'the 2-turn wheel, 8']], right: '4-8',
          hints: { '2-4': 'A 2,000 Hz tone turns 90° a sample. How many whole turns is that in 16 samples?', '4-4': 'Right wheel. Now count the forward half’s arrows: 16 of them, each 0.5 long.', '2-8': 'The length is right. Count the tone’s turns in 16 samples again, at 90° a sample.' },
          explain: 'In 16 samples the tone makes 4 whole turns, so the 4-turn wheel (still 2,000 Hz) piles up the forward half’s 16 half arrows to 8, which is N ÷ 2. Check it: drag the block length to N = 16, with the tone at 2,000 Hz and the test wheel on 4 turns. The bars below show the match against each test wheel that makes a whole number of turns in the block, all at once.',
          reveal: 'Skip: show me',
          onSolved: () => { Object.assign(st, { barsOn: true, stage: 2 }); render(); }, focusAfter: () => $('n'),
        });
        if (st.stage >= 2 && st.saw16 && !$('ask3').childElementCount) K.ask($('ask3'), {
          question: 'Last one: you will set N back to 8 and slide the tone from 2,000 to 2,500 Hz. Before you move them, what happens to the bars?',
          options: [['moves', 'The tall bar moves, the others stay 0'], ['same', 'The tall bar stays, the others stay 0'], ['spread', 'The tall bar shrinks, the others grow'], ['vanish', 'The tall bar vanishes, the others stay 0']], right: 'spread',
          hints: { moves: 'With N = 8 the wheels make whole turns: 0, 1,000, 2,000, 3,000 and 4,000 Hz. Is there a 2,500 Hz wheel?', same: '2,500 Hz makes 2.5 turns in 8 samples. Does the forward half still line up with the 2-turn wheel?', vanish: 'The tone is still there at full height. Can every walk close when no wheel matches its turns?' },
          explain: 'No wheel makes 2.5 turns in 8 samples, so no walk piles up fully and none closes. Now set N = 8 and the tone to 2,500 Hz, and read the bars for the wheels at 0 to 4,000 Hz.',
          reveal: 'Skip: show me',
          onSolved: () => { st.stage = 3; render(); }, focusAfter: () => $('n'),
        });
        return;
      }
      $('ask2').replaceChildren();
      if (st.c.ix !== 0) { st.unlocked = true; return; }
      if (st.unlocked) return;
      K.ask($('ask2'), {
        question: 'Before you touch N: a longer block separates close tones better. So why not take the longest block the slider allows, N = 400?',
        options: [['press', 'A block would outlast the shortest key press'], ['limit', 'Its bins would run past 4,000 Hz'], ['collide', 'The tones would land on shared bins again'], ['nothing', 'No reason: longer is always better']], right: 'press',
        hints: { limit: 'A longer block packs the bins closer together between 0 Hz and the limit. Does it add any above it?', collide: 'A longer block puts the bins closer together. Can two tones end up nearer to the same bin?', nothing: 'How long do 400 samples last at 8,000 samples a second? Compare that with how long a key is held.' },
        explain: '400 samples last 400 ÷ 8,000 = 50 ms, and a quick press can be over in about 40 ms, before the block fills. So the block must be long enough to separate the tones and short enough to fit inside a press. N is yours: find a length that does both.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => $('n'),
      });
    }

    if (!explore) {
      ['tone-control', 'phase-control', 'k-control', 'pin', 'jump', 'ask3'].forEach(k => { $(k).hidden = true; });
      ['task', 'picks', 'timeline'].forEach(k => { $(k).hidden = false; });
      $('picks').before($('timeline'));
      $('title').textContent = 'Fix the bug: read the account number';
      $('n').max = 400; $('bars-note').hidden = true;
      $('reset').textContent = 'Reset';
    }
    buildAsks();

    const setN = v => {
      const N = Math.max(Number($('n').min), Math.min(Number($('n').max), Math.round(v)));
      if (explore) { const f = st.k * FS / st.N; st.N = N; st.k = Math.min(Math.floor(N / 2), Math.round(f * N / FS)); }
      else { st.N = N; st.row = null; st.col = null; st.fb = isPress() ? '' : st.fb; }
      render();
    };
    $('n').addEventListener('input', () => setN(Number($('n').value)));
    $('n-down').addEventListener('click', () => setN(st.N - 1));
    $('n-up').addEventListener('click', () => setN(st.N + 1));
    $('tone').addEventListener('input', () => { st.f = Number($('tone').value); render(); });
    $('phase').addEventListener('input', () => { st.phase = Number($('phase').value); render(); });
    $('k').addEventListener('input', () => { st.k = Number($('k').value); render(); });
    $('pin').addEventListener('click', () => { const x = signal(), pts = walkOf(x, st.k); st.pinned = { f: st.f, phase: st.phase, N: st.N, k: st.k, pts, m: Math.hypot(...pts[pts.length - 1]) }; render(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('another').addEventListener('click', () => {
      audio.stop();
      const ix = (st.c.ix + 1) % CASES.length;
      Object.assign(st, { c: makeCase(ix), N: 40, block: 0, row: null, col: null, decoded: [null, null, null, null], solved: false, fb: '' });
      buildAsks(); render(); $('n').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(st, st.stage >= 3 ? { f: 2000, phase: 180, N: 8, k: 2, pinned: null } : { pinned: null });
      else Object.assign(st, { N: 40, block: 0, row: null, col: null, decoded: [null, null, null, null], solved: false, fb: '' });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  K.ask(document.getElementById('predict-sum'), {
    question: 'Your guess: what does the 1,000 Hz test tone score against this recording?',
    options: [['4', '4'], ['2', '2'], ['0', '0'], ['neg', 'below 0']], right: '0',
    hints: { 4: 'The recording holds one tone, at 2,000 Hz. Does a 1,000 Hz copy agree with it at every sample?', 2: 'The recording is +1 at samples 0 and 4. What is the 1,000 Hz test tone at sample 4?', neg: 'Count the positive and negative products. Does either side win?' },
    explain: 'Exactly 0. The table below shows each product.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-sum' })),
  });

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const m = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    m.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
