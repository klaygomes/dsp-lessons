(() => {
  const K = window.Kit, FS = 8000;
  const { fmt, MINUS } = K;
  const n0 = v => Math.round(v).toLocaleString('en-US');
  const ROWS = [697, 770, 852, 941], COLS = [1209, 1336, 1477, 1633], KEYS = ['123A', '456B', '789C', '*0#D'];
  const TONE = [1, 1, 0, -1, -1, -1, 0, 1];

  function fftSplit(x, splits) {
    let mults = 0;
    const rec = (idx, s) => {
      const m = idx.length, re = new Float64Array(m), im = new Float64Array(m);
      if (m === 1) { re[0] = x[idx[0]]; return [re, im]; }
      if (s === 0) {
        for (let k = 0; k < m; k++) for (let n = 0; n < m; n++) { const a = -2 * Math.PI * k * n / m; re[k] += x[idx[n]] * Math.cos(a); im[k] += x[idx[n]] * Math.sin(a); mults += 2; }
        return [re, im];
      }
      const [er, ei] = rec(idx.filter((_, i) => i % 2 === 0), s - 1), [or, oi] = rec(idx.filter((_, i) => i % 2 === 1), s - 1), h = m / 2;
      for (let k = 0; k < h; k++) {
        const a = -2 * Math.PI * k / m, c = Math.cos(a), d = Math.sin(a), tr = or[k] * c - oi[k] * d, ti = or[k] * d + oi[k] * c;
        mults += 4;
        re[k] = er[k] + tr; im[k] = ei[k] + ti; re[k + h] = er[k] - tr; im[k + h] = ei[k] - ti;
      }
      return [re, im];
    };
    const [re, im] = rec([...Array(x.length).keys()], splits);
    return { re, im, mults };
  }
  function directBins(x, kmax) {
    const N = x.length, re = new Float64Array(kmax + 1), im = new Float64Array(kmax + 1);
    for (let k = 0; k <= kmax; k++) for (let n = 0; n < N; n++) { const a = -2 * Math.PI * k * n / N; re[k] += x[n] * Math.cos(a); im[k] += x[n] * Math.sin(a); }
    return { re, im, mults: 2 * (kmax + 1) * N };
  }
  function goertzel(x, k) {
    const N = x.length, c = 2 * Math.cos(2 * Math.PI * k / N); let s1 = 0, s2 = 0;
    for (let n = 0; n < N; n++) { const s = x[n] + c * s1 - s2; s2 = s1; s1 = s; }
    const a = -2 * Math.PI * k / N;
    return { re: s1 - Math.cos(a) * s2, im: -Math.sin(a) * s2, mults: N + 2 };
  }

  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = a => Math.hypot(a[0], a[1]);
  const W8 = k => [Math.cos(-2 * Math.PI * k / 8), Math.sin(-2 * Math.PI * k / 8)];
  const snap = v => (Math.abs(v) < 0.005 ? 0 : v);
  function words(a) {
    const re = snap(a[0]), im = snap(a[1]);
    if (!re && !im) return '0';
    const h = re ? `${fmt(Math.abs(re))} ${re > 0 ? 'right' : 'left'}` : '', v = im ? `${fmt(Math.abs(im))} ${im > 0 ? 'up' : 'down'}` : '';
    return [h, v].filter(Boolean).join(', ');
  }
  const same = (a, b) => Math.abs(a[0] - b[0]) < 0.005 && Math.abs(a[1] - b[1]) < 0.005;

  function arrowOn(s, x1, y1, x2, y2, color, width = 2, dash = [], alpha = 1) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1.5) { s.pen.dot(x2, y2, 2.5, color, alpha); return; }
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hd = Math.min(9, L * 0.45);
    s.pen.line([[x1, y1], [x2 - ux * hd * 0.7, y2 - uy * hd * 0.7]], color, width, dash, alpha);
    const ctx = s.ctx; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * hd - uy * hd * 0.42, y2 - uy * hd + ux * hd * 0.42); ctx.lineTo(x2 - ux * hd + uy * hd * 0.42, y2 - uy * hd - ux * hd * 0.42);
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  }

  function act1() {
    const root = document.getElementById('lab'), $ = id => document.getElementById(`lab-${id}`);
    const st = { x: TONE.slice(), k: 3, method: 0, pinned: null, solved: new Map(), matched: new Set() };
    const cells = [];
    for (let n = 0; n < 8; n++) {
      const lab = document.createElement('label'), inp = document.createElement('input');
      inp.type = 'text'; inp.inputMode = 'numeric'; inp.id = `lab-x${n}`; inp.setAttribute('aria-describedby', 'lab-err'); inp.autocomplete = 'off';
      lab.htmlFor = inp.id; lab.textContent = `x[${n}]`; lab.append(inp);
      inp.addEventListener('change', () => edit(n, inp));
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') edit(n, inp); });
      $('rec').append(lab); cells.push(inp);
    }
    function edit(n, inp) {
      const raw = inp.value.trim().replace(MINUS, '-').replace('−', '-');
      const v = Number(raw);
      if (raw === '' || !Number.isFinite(v) || !Number.isInteger(v) || v < -5 || v > 5) {
        inp.setAttribute('aria-invalid', 'true');
        $('err').textContent = `x[${n}] = “${inp.value}” is not allowed: use a whole number from ${MINUS}5 to 5. It stays at ${fmtInt(st.x[n])}.`;
        inp.value = fmtInt(st.x[n]);
        return;
      }
      inp.removeAttribute('aria-invalid'); $('err').textContent = '';
      if (st.x[n] !== v) { st.x[n] = v; render(); }
    }
    const fmtInt = v => (v < 0 ? MINUS + Math.abs(v) : String(v));
    const caseKey = () => `${st.x.join(',')}|${st.k}`;

    function parts() {
      const ev = [0, 2, 4, 6].map(n => st.x[n]), od = [1, 3, 5, 7].map(n => st.x[n]);
      const dft4 = (v, k) => v.reduce((a, s, r) => add(a, [s * Math.cos(-2 * Math.PI * k * r / 4), s * Math.sin(-2 * Math.PI * k * r / 4)]), [0, 0]);
      const E = dft4(ev, st.k), O = dft4(od, st.k), WO = cmul(W8(st.k), O);
      return { E, O, WO, Xk: add(E, WO), Xk4: sub(E, WO) };
    }
    function options(p) {
      const cands = [['right', p.Xk4], ['same', p.Xk], ['swap', sub(p.WO, p.E)], ['noturn', sub(p.E, p.O)]];
      const keep = [];
      cands.forEach(([id, v]) => { if (!keep.some(([, w]) => same(v, w))) keep.push([id, v]); });
      const h = [...caseKey()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
      return keep.map(([id, v], i) => [id, v, (i * 7 + h) % 11]).sort((a, b) => a[2] - b[2]).map(([id, v]) => [id, words(v)]);
    }

    const stage = K.stage($('stage'), s => {
      const { w, h, c, pen } = s, p = parts(), k = st.k, shown = st.solved.has(caseKey()) || len(p.WO) < 0.005;
      const narrow = w < 560, cw = (w - 64) / 8, R = Math.max(10, Math.min(18, cw / 2 - 6));
      const rowY = [30 + R, 30 + 3 * R + 26];
      pen.text(`bin ${k}`, 4, rowY[0] + 4, { align: 'left', color: c.ink, size: 13, font: 'body', weight: 600 });
      pen.text(`bin ${k + 4}`, 4, rowY[1] + 4, { align: 'left', color: c.accentInk, size: 13, font: 'body', weight: 600 });
      for (let n = 0; n < 8; n++) {
        const cx = 64 + cw * (n + 0.5);
        pen.text(n === 0 ? 'n = 0' : String(n), cx, 14, { color: c.soft, size: 10 });
        [k, k + 4].forEach((b, r) => {
          const ang = 45 * b * n * Math.PI / 180, cy = rowY[r];
          pen.ring(cx, cy, R, c.rule, 1);
          const flip = r === 1 && n % 2 === 1;
          arrowOn(s, cx, cy, cx + (R - 2) * Math.cos(ang), cy + (R - 2) * Math.sin(ang), flip ? c.accent : c.ink, 1.8);
        });
        pen.text(n % 2 ? (narrow ? 'flip' : 'flipped') : 'same', cx, rowY[1] + R + 14, { color: n % 2 ? c.accentInk : c.soft, size: narrow ? 9 : 10 });
      }
      const top = rowY[1] + R + 30, panels = narrow ? [[0, top, w, 150], [0, top + 168, w / 2, 170], [w / 2, top + 168, w / 2, 170]] : [[0, top, w / 3, h - top - 4], [w / 3, top, w / 3, h - top - 4], [2 * w / 3, top, w / 3, h - top - 4]];
      const all = [p.E, p.O, p.WO, p.Xk, p.Xk4, ...(st.pinned ? [st.pinned.Xk, st.pinned.Xk4] : [])];
      const big = Math.max(1, ...all.map(len), len(p.E) + len(p.WO));
      const titles = ['even part E', 'odd part, before and after turn', `bins: E + turned, E ${MINUS} turned`];
      panels.forEach(([x0, y0, pw, ph], i) => {
        const cx = x0 + pw / 2, cy = y0 + 18 + (ph - 18) / 2, sc = Math.min(pw / 2 - 14, (ph - 30) / 2) / big;
        pen.line([[x0 + 10, cy], [x0 + pw - 10, cy]], c.rule, 1); pen.line([[cx, y0 + 22], [cx, y0 + ph - 4]], c.rule, 1);
        pen.text(narrow && i === 2 ? `bins ${k} and ${k + 4}` : narrow && i === 1 ? 'odd part, turned' : titles[i], x0 + pw / 2, y0 + 12, { color: c.soft, size: 11 });
        const P = v => [cx + v[0] * sc, cy - v[1] * sc];
        if (i === 0) arrowOn(s, cx, cy, ...P(p.E), c.ink, 2.2);
        if (i === 1) { arrowOn(s, cx, cy, ...P(p.O), c.soft, 1.8, [], 0.5); arrowOn(s, cx, cy, ...P(p.WO), c.ink, 2.2); }
        if (i === 2) {
          const e = P(p.E);
          arrowOn(s, cx, cy, ...e, c.soft, 1.6);
          arrowOn(s, ...e, ...P(p.Xk), c.ink, 2.2);
          pen.dot(...P(p.Xk), 3.5, c.ink);
          if (shown) { arrowOn(s, ...e, ...P(p.Xk4), c.accent, 2.4); pen.dot(...P(p.Xk4), 3.5, c.accent); }
          else pen.text('?', e[0] - 12, e[1] - 10, { color: c.accentInk, size: 16, weight: 600 });
          if (st.pinned) [st.pinned.Xk, st.pinned.Xk4].forEach(v => pen.ring(...P(v), 6, c.input, 1.6));
        }
      });
    }, { height: w => (w < 560 ? 520 : 360) });

    function render(keepAsk = false) {
      const p = parts(), key = caseKey(), deg = len(p.WO) < 0.005, shown = st.solved.has(key) || deg, k = st.k;
      cells.forEach((inp, n) => { inp.value = fmtInt(st.x[n]); });
      root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === k)));
      root.querySelectorAll('[data-splits]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.splits) === st.method)));
      const ask = $('ask');
      if (deg) { ask.replaceChildren(); }
      else if (!keepAsk) {
        K.ask(ask, {
          question: `Bin ${k} = E + turned odd part = ${words(p.Xk)}. Bin ${k + 4} uses the same two parts. What is bin ${k + 4}?`,
          options: options(p), right: 'right',
          hints: {
            same: `That is bin ${k} itself. For bin ${k + 4} the odd samples’ arrows are flipped, so the turned odd part is subtracted, not added.`,
            swap: 'That flips the even part as well. The even samples’ arrows are the same for both bins; only the odd part changes sign.',
            noturn: `Close, but that subtracts the odd part before its extra turn. Bin ${k + 4} needs the same turned odd part as bin ${k}.`,
          },
          explain: `Bin ${k + 4} = E ${MINUS} turned odd part = ${words(p.Xk4)}, and the slow DFT agrees.`,
          solved: st.solved.get(key) || null,
          onSolved: how => { st.solved.set(key, how ? 'shown' : 'right'); if (!how) st.matched.add(key); render(true); },
        });
      }
      $('result').textContent = `E = ${words(p.E)} · turned odd = ${words(p.WO)} · bin ${k} = ${words(p.Xk)} · bin ${k + 4} = ${shown ? words(p.Xk4) : '?'}`;
      const speed = [`Bin 0’s wheel never turns; bin 4’s turns half a turn every sample`, 'Bin 1’s wheel turns 45° back per sample, bin 5’s 225°', 'Bin 2’s wheel turns 90° back per sample, bin 6’s 270°', 'Bin 3’s wheel turns 135° back per sample, bin 7’s 315°'][k];
      const extra = `${speed}: 180° more, so the even samples agree and the odd ones flip.`;
      const turnNote = k === 0 ? ' For bin 0 the extra turn is 0°, so the odd part goes in unturned.' : ` The odd part gets its extra ${45 * k}° back in one go.`;
      $('why').textContent = deg
        ? `${extra} Here the turned odd part is 0, so bins ${k} and ${k + 4} are both just the even part, ${words(p.E)}. Nothing to predict: pick another bin or change the recording.`
        : shown ? `${extra}${turnNote} Bin ${k} adds the turned odd part to E, bin ${k + 4} subtracts it: one turn shared by two bins.` : `${extra}${turnNote} Predict bin ${k + 4} above.`;
      const all = fftSplit(st.x, st.method), slow = fftSplit(st.x, 0);
      const diff = Math.max(...all.re.map((v, i) => Math.hypot(v - slow.re[i], all.im[i] - slow.im[i])));
      const list = [...all.re].map((v, i) => (i === k + 4 && !shown ? '?' : words([v, all.im[i]]))).map((s, i) => `${i}: ${s}`).join(' · ');
      $('bins').textContent = `${['Slow DFT', 'One split', 'Full FFT'][[0, 1, 3].indexOf(st.method)]}, ${all.mults} multiplications. Bins ${list}. Largest difference from the slow DFT: ${diff < 0.005 ? '0.00, rounding only' : fmt(diff)}.`;
      const n = st.matched.size;
      $('count').textContent = n >= 3 ? 'Three predictions matched the slow DFT. You have the butterfly: the lab is yours to keep exploring.' : `Predictions that matched the slow DFT: ${n} of 3. Each needs a new bin or a new recording.`;
      $('key-pin').hidden = !st.pinned;
      $('compare').hidden = !st.pinned;
      if (st.pinned) {
        const pk = st.pinned;
        const same2 = same(pk.Xk, p.Xk) && same(pk.Xk4, p.Xk4);
        $('compare').textContent = `Pinned: bin ${pk.k} = ${words(pk.Xk)}, bin ${pk.k + 4} = ${words(pk.Xk4)} (rings). Now: bin ${k} = ${words(p.Xk)}, bin ${k + 4} = ${shown ? words(p.Xk4) : '?'}. ${same2 ? 'The same two bins.' : pk.k === k ? 'Same bins, a different recording: both parts changed, but the rule did not.' : 'A different pair of bins: different arrows, the same add-and-subtract.'}`;
      }
      $('stage').setAttribute('aria-label', `Bin ${k} and bin ${k + 4}: test-wheel arrows for samples 0 to 7, the odd ones flipped for bin ${k + 4}; the even part ${words(p.E)}, the turned odd part ${words(p.WO)}, bin ${k} ${words(p.Xk)}${shown ? `, bin ${k + 4} ${words(p.Xk4)}` : ''}.`);
      stage.redraw();
    }

    root.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { st.k = Number(b.dataset.k); render(); }));
    root.querySelectorAll('[data-splits]').forEach(b => b.addEventListener('click', () => { st.method = Number(b.dataset.splits); render(); }));
    root.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
      const pr = b.dataset.preset;
      st.x = pr === 'tone' ? TONE.slice() : pr === 'click' ? [0, 1, 0, 0, 0, 0, 0, 0] : Array.from({ length: 8 }, () => Math.floor(Math.random() * 7) - 3);
      cells.forEach(c => c.removeAttribute('aria-invalid')); $('err').textContent = '';
      render();
    }));
    $('pin').addEventListener('click', () => { const p = parts(); st.pinned = { k: st.k, Xk: p.Xk, Xk4: p.Xk4 }; render(); });
    $('reset').addEventListener('click', () => {
      Object.assign(st, { x: TONE.slice(), k: 3, method: 0, pinned: null });
      cells.forEach(c => c.removeAttribute('aria-invalid')); $('err').textContent = '';
      render(); $('reset').focus();
    });
    render();
  }

  K.ask(document.getElementById('predict-bin5'), {
    question: 'Bin 1 is the even part plus the turned odd part: 2 + 2.83 = 4.83. Bin 5 uses the same two parts. What is bin 5?',
    options: [['4.83', '4.83'], ['0.83', '0.83'], ['-0.83', `${MINUS}0.83`], ['2', '2.00']], right: '-0.83',
    hints: {
      '4.83': 'That is bin 1. For bin 5 the odd samples’ arrows are flipped, so the turned odd part changes sign.',
      '0.83': 'The right size, the wrong way round: the turned odd part (2.83) is subtracted from the even part (2), and 2 is the smaller.',
      2: 'The odd part does not vanish for bin 5. Its arrows flip, so it is subtracted.',
    },
    explain: `Bin 5 = 2 ${MINUS} 2.83 = ${MINUS}0.83, an arrow of length 0.83 pointing left. Here is the whole step drawn out.`,
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-bin5' })),
  });

  act1();

  const CASES = [
    { rate: 1000000, text: 'Your own line, live. A caller is typing a four-digit code. The chip does about 1,000,000 multiplications a second: 25,625 per 205-sample block, 32,000 per 256-sample block. Make the detector keep up.' },
    { rate: 400000, text: 'An older exchange joins the network. Its chip manages 400,000 multiplications a second. Same detector, same caller: make it keep up here.' },
    { rate: 250000, text: 'A rural exchange whose chip is shared with an echo canceller: the detector gets 250,000 multiplications a second. Make it keep up.' },
    { rate: 1600000, text: 'A newer exchange with a faster chip, 1,600,000 multiplications a second. How little splitting does it need?' },
    { rate: 180000, text: 'A tiny backup chip: 180,000 multiplications a second for the detector. Make it keep up.' },
  ];
  const PRESS = 0.15, GAP = 0.3, LEAD = 0.2, CALL = 1.5;
  const binOf = (f, N) => Math.round(f * N / FS);

  function makeCall() {
    const digits = Array.from({ length: 4 }, () => '0123456789'[Math.floor(Math.random() * 10)]);
    const x = new Float32Array(Math.round(CALL * FS));
    digits.forEach((d, i) => {
      const r = KEYS.findIndex(s => s.includes(d)), c = KEYS[r].indexOf(d), p1 = Math.random() * 2 * Math.PI, p2 = Math.random() * 2 * Math.PI;
      const t0 = Math.round((LEAD + i * GAP) * FS), t1 = t0 + Math.round(PRESS * FS);
      for (let n = t0; n < t1; n++) x[n] = Math.cos(2 * Math.PI * ROWS[r] * (n - t0) / FS + p1) + Math.cos(2 * Math.PI * COLS[c] * (n - t0) / FS + p2);
    });
    return { digits, x };
  }

  function cost(N, splits, method) {
    if (method === 'goertzel') return 8 * (N + 2);
    if (N === 205) return 2 * 103 * 205;
    const m = 256 >> splits;
    return (m > 1 ? (2 ** splits) * 2 * m * m : 0) + splits * 512;
  }
  const minSplits = budget => [0, 1, 2, 3, 4, 5, 6, 7, 8].find(s => cost(256, s, 'dft') <= budget);

  function detect(call, N, splits, method, rate) {
    const p = cost(N, splits, method) / rate, T = N / FS, events = [];
    let finish = 0, prev = null, last = null;
    for (let b = 0; (b + 1) * N <= call.x.length; b++) {
      const blk = Array.from(call.x.subarray(b * N, (b + 1) * N));
      let mag;
      if (method === 'goertzel') {
        const res = [...ROWS, ...COLS].map(f => goertzel(blk, binOf(f, N)));
        mag = i => Math.hypot(res[i].re, res[i].im);
      } else {
        const r = N === 205 ? directBins(blk, 102) : fftSplit(blk, splits);
        mag = i => { const k = binOf([...ROWS, ...COLS][i], N); return Math.hypot(r.re[k], r.im[k]); };
      }
      const pct = [0, 1, 2, 3, 4, 5, 6, 7].map(i => mag(i) / (N / 2));
      const rr = [0, 1, 2, 3].filter(i => pct[i] >= 0.25), cc = [0, 1, 2, 3].filter(i => pct[4 + i] >= 0.25);
      const key = rr.length === 1 && cc.length === 1 ? KEYS[rr[0]][cc[0]] : null;
      const end = (b + 1) * T;
      finish = Math.max(finish, end) + p;
      if (key && key !== prev) { events.push({ key, at: finish, block: end, delay: finish - end }); last = { key, pct, r: rr[0], c: cc[0] }; }
      else if (key && last && pct[last.r] + pct[4 + last.c] > last.pct[last.r] + last.pct[4 + last.c]) last.pct = pct;
      prev = key;
    }
    return { events, p, T, last, behindPerMin: Math.max(0, p / T - 1) * 60 };
  }

  function act2(host) {
    host.replaceChildren(document.getElementById('act2-lab').content.cloneNode(true));
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = `lab2-${el.dataset.k}`; });
    const st = { caseIx: 0, N: 205, splits: 0, method: 'dft', unlocked: false, solved: false, everSolved: false, call: makeCall(), played: false };
    let result = null;

    const budgetOf = N => CASES[st.caseIx].rate * N / FS;
    const LOGMIN = Math.log10(1000), LOGMAX = Math.log10(140000);
    const pos = v => Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1000)) - LOGMIN) / (LOGMAX - LOGMIN)));

    const stage = K.stage($('stage'), s => {
      const { w, h, c, pen } = s;
      if (!result) return;
      const x0 = 70, x1 = w - 16, rows = [40, 104];
      const ev = result.events, lastT = Math.max(CALL + 0.3, ...ev.map(e => e.at + 0.2));
      const tmax = Math.min(Math.max(2, Math.ceil(lastT * 2) / 2), 8), X = t => x0 + Math.min(t, tmax) / tmax * (x1 - x0);
      pen.text('caller', 4, rows[0] + 4, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      pen.text('detector', 4, rows[1] + 4, { align: 'left', color: c.ink, size: 12, font: 'body', weight: 600 });
      pen.line([[x0, h - 34], [x1, h - 34]], c.soft, 1);
      for (let t = 0; t <= tmax + 1e-9; t += tmax > 4 ? 1 : 0.5) { pen.line([[X(t), h - 38], [X(t), h - 30]], c.soft, 1); pen.text(t === 0 ? '0 s' : `${t}`, X(t), h - 16, { color: c.soft, size: 10 }); }
      pen.text('seconds into the call', x1, h - 2, { align: 'right', color: c.soft, size: 10 });
      const bw = Math.max(14, X(PRESS) - X(0));
      st.call.digits.forEach((d, i) => {
        const t0 = LEAD + i * GAP;
        pen.rect(X(t0), rows[0] - 12, X(t0 + PRESS) - X(t0), 24, c.paper2);
        s.ctx.strokeStyle = c.ink; s.ctx.lineWidth = 1.5; s.ctx.strokeRect(X(t0) + 0.5, rows[0] - 11.5, X(t0 + PRESS) - X(t0) - 1, 23);
        pen.text(d, (X(t0) + X(t0 + PRESS)) / 2, rows[0] + 5, { color: c.ink, size: 13, weight: 500 });
      });
      ev.forEach((e, i) => {
        const press = LEAD + i * GAP, late = e.delay > result.T + 1e-6, beyond = e.at > tmax;
        const xd = X(e.at);
        pen.line([[X(press + PRESS / 2), rows[0] + 13], [xd, rows[1] - 13]], late ? c.accent : c.ink, 1.2, [], 0.8);
        pen.rect(xd - bw / 2, rows[1] - 12, bw, 24, late ? c.accentSoft : c.paper2);
        s.ctx.strokeStyle = late ? c.accent : c.ink; s.ctx.lineWidth = 1.5; s.ctx.strokeRect(xd - bw / 2 + 0.5, rows[1] - 11.5, bw - 1, 23);
        pen.text(e.key, xd, rows[1] + 5, { color: late ? c.accentInk : c.ink, size: 13, weight: 500 });
        if (late) pen.text(beyond ? `${fmt(e.at, 1)} s →` : `+${fmt(e.at - press - PRESS, 1)} s`, xd, rows[1] + 26, { color: c.accentInk, size: 10 });
      });
      if (s.playhead !== undefined) pen.line([[X(s.playhead), 18], [X(s.playhead), h - 34]], c.input, 2);
    }, { height: w => (w < 560 ? 190 : 170) });

    function render() {
      const budget = budgetOf(st.N), m = cost(st.N, st.splits, st.method), fits = m <= budget + 1e-9;
      result = detect(st.call, st.N, st.splits, st.method, CASES[st.caseIx].rate);
      $('task-text').textContent = CASES[st.caseIx].text;
      host.querySelectorAll('[data-n]').forEach(b => { b.setAttribute('aria-pressed', String(Number(b.dataset.n) === st.N)); b.disabled = !st.unlocked; });
      host.querySelectorAll('[data-method]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.method === st.method)));
      $('methods').hidden = !st.everSolved;
      const canSplit = st.unlocked && st.N === 256 && st.method === 'dft';
      $('split').disabled = !canSplit || st.splits >= 8; $('join').disabled = !canSplit || st.splits <= 0;
      $('splits-out').textContent = st.N === 256 && st.method === 'dft' ? `${st.splits} (${2 ** st.splits} DFT${st.splits ? 's' : ''} of ${256 >> st.splits})` : '0';
      $('split-note').textContent = st.method === 'goertzel' ? 'Goertzel runs one filter per bin: nothing to split.' : st.N === 205 ? '205 = 5 × 41 cannot be halved.' : st.splits === 8 ? 'All the way: only butterflies are left.' : '';
      $('play').disabled = !st.unlocked;
      const meter = $('meter');
      meter.querySelector('.fill').style.width = st.unlocked ? `${pos(m) * 100}%` : '0%';
      meter.querySelector('.budget').style.left = `${pos(budget) * 100}%`;
      meter.querySelector('output').textContent = st.unlocked ? `${n0(m)} of ${n0(budget)}${fits ? '' : ', past the budget'}` : '?';
      $('meter-label').textContent = `Multiplications per ${st.N}-sample block, log scale; dashed mark: the chip’s budget, ${n0(budget)}`;
      const what = st.method === 'goertzel' ? `eight Goertzel filters on ${st.N} samples` : st.N === 205 ? 'direct DFT, bins 0 to 102 of 205 samples' : st.splits === 0 ? 'direct DFT, all 256 bins' : st.splits === 8 ? 'full FFT, 256 samples' : `${st.splits} split${st.splits > 1 ? 's' : ''}: ${2 ** st.splits} DFTs of ${256 >> st.splits}, then butterflies`;
      $('result').textContent = st.unlocked ? `${what} · ${n0(m)} multiplications per block · budget ${n0(budget)}` : 'Answer the question above to unlock the controls.';
      $('why').textContent = st.unlocked ? feedback(m, budget, fits) : '';
      const lastPress = result.last;
      $('matches').textContent = lastPress ? `Last digit, ${lastPress.key}, in its strongest block: ${n0(ROWS[lastPress.r])} Hz ${Math.round(lastPress.pct[lastPress.r] * 100)}%, ${n0(COLS[lastPress.c])} Hz ${Math.round(lastPress.pct[4 + lastPress.c] * 100)}%; the other six keypad bins at most ${Math.round(Math.max(...lastPress.pct.filter((_, i) => i !== lastPress.r && i !== 4 + lastPress.c)) * 100)}%, against the lab’s 25% bar.` : '';
      $('stage').setAttribute('aria-label', `Timeline: the caller presses ${st.call.digits.join(' ')}; the detector reports ${result.events.map(e => `${e.key} at ${fmt(e.at, 2)} s`).join(', ')}.`);
      $('another').hidden = !st.solved;
      $('another').textContent = st.caseIx === CASES.length - 1 ? 'Back to your own line' : 'Try another exchange';
      $('now').textContent = nowText();
      stage.redraw();
      if (audio.playing) audio.refresh();
    }

    function feedback(m, budget, fits) {
      const over = m - budget, perMin = fmt(Math.max(0, m / budget - 1) * 60, 0), story = st.caseIx === 0;
      const need = minSplits(budget);
      st.solved = false;
      if (st.method === 'goertzel') {
        if (!fits) return `${n0(m)} per block is over the budget of ${n0(budget)}.`;
        return `${n0(m)} per block, well under ${n0(budget)}, and the digits come out live. But eight filters read only eight bins: they can’t see a voice’s energy everywhere else, so they can’t reject a voice that fakes a key. Your line keeps the FFT.`;
      }
      if (st.N === 205) return `${n0(m)} per block against ${n0(budget)}: ${Math.round((m / budget - 1) * 100)}% over. Each second of sound takes ${fmt(m / budget, 2)} s to process, so the detector falls ${perMin} s further behind every minute and the digits come out late. 205 = 5 × 41 can’t even be halved: switch the block to 256 samples first.`;
      if (!fits) {
        const head = st.splits === 0 ? `${n0(m)} per block: worse than at 205, because this direct DFT computes all 256 bins.` : st.splits === 1 ? `One split: two DFTs of 128 plus 128 butterflies, ${n0(m)} per block.` : `${st.splits} splits: ${n0(m)} per block.`;
        return `${head} That is ${n0(over)} over the budget of ${n0(budget)}, so the detector falls ${perMin} s further behind every minute. Split again.`;
      }
      st.solved = true;
      const spare = `under the budget of ${n0(budget)}, with ${n0(budget - m)} to spare`;
      const extra = st.splits > need ? ` It already fit at ${need} split${need > 1 ? 's' : ''}; every split past that only makes it cheaper still.` : st.splits < 8 ? ' Splitting further only makes it cheaper still.' : '';
      if (story && !st.everSolved) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
      st.everSolved = true;
      if (story) return `Fixed. ${n0(m)} multiplications per block, ${spare}. Every block is done before the next arrives, and the caller’s code, ${st.call.digits.join(' ')}, comes out as it is typed.${extra} Press Play to hear each digit’s click land right after its key.`;
      return `Fixed for this exchange: ${n0(m)} per block, ${spare}. The digits ${st.call.digits.join(' ')} come out live.${extra}`;
    }

    function nowText() {
      if (!st.unlocked) return '';
      if (!audio.playing) return 'Not playing. Play the call to hear the keys, and a click each time the detector reports a digit.';
      const late = result.events.some(e => e.delay > result.T + 1e-6);
      return `Playing the keys and the detector’s clicks: ${late ? 'the clicks lag further and further behind the keys' : 'each click lands right after its key'}.`;
    }

    function render8k() {
      const lastT = Math.max(CALL, ...result.events.map(e => e.at + 0.2)), total = Math.min(Math.ceil(lastT * FS), 12 * FS);
      const y = new Float32Array(total);
      for (let n = 0; n < Math.min(total, st.call.x.length); n++) y[n] = 0.4 * st.call.x[n];
      result.events.forEach(e => {
        const t0 = Math.round(e.at * FS);
        for (let n = 0; n < 320 && t0 + n < total; n++) y[t0 + n] += 0.5 * Math.sin(2 * Math.PI * 3000 * n / FS) * Math.exp(-n / 90);
      });
      return y;
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play the call'; $('now').textContent = nowText(); if (on) loop.start(); else { loop.stop(); delete stage.playhead; stage.redraw(); } } });
    const loop = K.loop(host, () => {
      if (!audio.playing) return;
      stage.playhead = (audio.ctx.currentTime - audio.startedAt) % audio.duration;
      stage.redraw();
    });

    function buildAsk() {
      $('ask').replaceChildren();
      if (st.caseIx !== 0 || st.unlocked) { st.unlocked = true; return; }
      const q = document.createElement('div'); $('ask').append(q);
      K.ask(q, {
        question: 'Before you change anything: at 205 samples the detector needs 42,230 multiplications per block and the chip gives it 25,625. After one minute of live call, how far behind the sound is it?',
        options: [['0.65', 'About 0.65 s'], ['39', 'About 39 s'], ['0', 'Not at all: it only works hard during key presses']], right: '39',
        hints: { '0.65': '0.65 s is how far it falls behind in each second of sound. A minute has 60 of them.', 0: 'The detector runs the DFT on every block, key or no key: the cost is per block, not per press.' },
        explain: 'Each second of sound takes 42,230 ÷ 25,625 = 1.65 s of chip time, so the detector loses 0.65 s every second: about 39 s behind after a minute. The controls are yours: make it keep up.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => host.querySelector('[data-n="256"]'),
      });
    }

    host.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => { st.N = Number(b.dataset.n); if (st.N === 205) st.splits = 0; render(); }));
    host.querySelectorAll('[data-method]').forEach(b => b.addEventListener('click', () => { st.method = b.dataset.method; render(); }));
    $('split').addEventListener('click', () => { st.splits = Math.min(8, st.splits + 1); render(); if ($('split').disabled) $('join').focus(); });
    $('join').addEventListener('click', () => { st.splits = Math.max(0, st.splits - 1); render(); if ($('join').disabled) $('split').focus(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('another').addEventListener('click', () => {
      audio.stop();
      Object.assign(st, { caseIx: (st.caseIx + 1) % CASES.length, N: 205, splits: 0, method: 'dft', solved: false, call: makeCall() });
      buildAsk(); render(); host.querySelector('[data-n="256"]').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      Object.assign(st, { N: 205, splits: 0, method: 'dft', solved: false });
      render(); $('reset').focus();
    });
    buildAsk();
    render();
    return { stop: () => audio.stop() };
  }

  document.getElementById('start-act2').addEventListener('click', () => {
    const mount = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    const h = document.createElement('h3'); h.textContent = 'Lab: make the detector keep up';
    mount.replaceChildren(host);
    act2(host);
    host.prepend(h);
    host.querySelector('.k-ask button').focus();
  });
})();
