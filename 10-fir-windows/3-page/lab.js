(() => {
  const K = window.Kit, FS = 16000, RATE = 8000, PI = Math.PI;
  const { fmt, hz, MINUS } = K;
  const hI = m => (m === 0 ? 0.5 : Math.sin(PI * m / 2) / (PI * m));
  const WEIGHT = {
    rect: () => 1,
    hann: (m, N) => 0.5 + 0.5 * Math.cos(2 * PI * m / (N - 1)),
    hamming: (m, N) => 0.54 + 0.46 * Math.cos(2 * PI * m / (N - 1)),
  };
  const NAME = { rect: 'plain cut', hann: 'Hann', hamming: 'Hamming' };
  const f3 = v => fmt(v, 3);
  const pct = v => `${(v * 100).toFixed(2)}%`;
  const dB = v => `${MINUS}${Math.round(-20 * Math.log10(Math.max(v, 1e-6)))} dB`;
  const odd = v => Math.round((v - 1) / 2) * 2 + 1;

  const coeffs = (kind, N) => Float64Array.from({ length: (N - 1) / 2 + 1 }, (_, m) => hI(m) * WEIGHT[kind](m, N));
  const gainAt = (c, f) => { const t = 2 * PI * f / FS; let s = c[0]; for (let m = 1; m < c.length; m++) s += 2 * c[m] * Math.cos(t * m); return s; };

  const cache = new Map();
  function analyse(kind, N, P) {
    const key = `${kind}:${N}:${P}`;
    if (cache.has(key)) return cache.get(key);
    const c = coeffs(kind, N), S = FS / 2 - P;
    const curve = Float64Array.from({ length: 1001 }, (_, i) => gainAt(c, i * 8));
    let vb = 0, fb = 0, gh = 0, fg = 0;
    for (let f = 0; f <= P; f++) { const e = Math.abs(gainAt(c, f) - 1); if (e > vb) { vb = e; fb = f; } }
    for (let f = S; f <= FS / 2; f++) { const e = Math.abs(gainAt(c, f)); if (e > gh) { gh = e; fg = f; } }
    let peak = -1, peakF = 0;
    for (let f = 0; f <= 4000; f += 2) { const v = gainAt(c, f); if (v > peak) { peak = v; peakF = f; } }
    for (let f = Math.max(0, peakF - 2); f <= Math.min(4000, peakF + 2); f += 0.25) { const v = gainAt(c, f); if (v > peak) { peak = v; peakF = f; } }
    let edgeLo = null, edgeHi = null;
    for (let f = 0; f <= 4000; f++) if (Math.abs(gainAt(c, f) - 1) > 0.01) { edgeLo = f - 1; break; }
    for (let f = 4000; f <= FS / 2; f++) if (Math.abs(gainAt(c, f)) < 0.01) { edgeHi = f; break; }
    const a = { c, N, kind, P, curve, vb, fb, gh, fg, peak, peakF, edgeLo, edgeHi, at: f => gainAt(c, f) };
    if (cache.size > 400) cache.clear();
    cache.set(key, a);
    return a;
  }

  let sweep = null;
  const sweepAt16k = () => sweep || (sweep = Float32Array.from({ length: 10 * FS }, (_, n) => { const t = n / FS; return 0.9 * Math.sin(2 * PI * (4000 * t + 200 * t * t)); }));
  function render8k(a, on) {
    const x = sweepAt16k(), out = new Float32Array(x.length / 2);
    if (!on) { for (let j = 0; j < out.length; j++) out[j] = x[2 * j]; return out; }
    const M = a.c.length - 1, h = Float64Array.from({ length: 2 * M + 1 }, (_, k) => a.c[Math.abs(k - M)]);
    for (let j = 0; j < out.length; j++) {
      const n = 2 * j; let s = 0;
      for (let k = 0, top = Math.min(h.length - 1, n); k <= top; k++) s += h[k] * x[n - k];
      out[j] = s;
    }
    return out;
  }

  const CASES = [
    { P: 3500, budget: 63, band: 'Carried band', text: 'A second wideband bridge joins your line today. Its phones carry tones up to 3,500 Hz, so its job is: pass 0 to 3,500 Hz within 1%, and remove every tone above 4,500 Hz, which would land below 3,500 Hz, to below 1%. Its chip affords 63 coefficients. The sweep starts out through lesson 5’s plain cut of 31.' },
    { P: 3400, budget: 63, band: 'Voice band', text: 'Back on your own line: pass the voice band, 0 to 3,400 Hz, within 1%, and remove every tone above 4,600 Hz to below 1%, with at most 63 coefficients.' },
    { P: 3000, budget: 27, band: 'Carried band', text: 'An old radio link joins. Its handsets carry only up to 3,000 Hz, so everything above 5,000 Hz must go, to below 1%. Its chip is tiny: 27 coefficients at most.' },
    { P: 3200, budget: 39, band: 'Carried band', text: 'A hotel exchange joins. Its band reaches 3,200 Hz, so everything above 4,800 Hz must go, to below 1%. Its chip affords 39 coefficients.' },
  ];

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('fir-lab').content.cloneNode(true));
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const st = { kind: 'rect', N: 31, unlocked: false, pinned: null, db: !explore, on: true, caseIx: 0, solved: false, t: null };
    const job = () => (explore ? { P: 3400, budget: 255, band: 'Voice band' } : CASES[st.caseIx]);
    const now = () => analyse(st.kind, st.N, job().P);

    const slider = $('len');
    slider.min = 7; slider.max = explore ? 255 : 99; slider.step = 2;

    const stage = K.stage($('stage'), s => draw(s), { height: w => (w < 560 ? 430 : 400) });

    function draw(s) {
      const { pen, c, w, h } = s, a = now(), J = job(), phone = w < 560;
      const R = { x: phone ? 40 : 50, y: 26, w: w - (phone ? 52 : 66), h: phone ? 210 : 200 };
      const G = { x: R.x, y: R.y + R.h + (phone ? 70 : 64), w: R.w, h: h - (R.y + R.h + (phone ? 70 : 64)) - 30 };
      const X = f => R.x + f / 8000 * R.w;
      const lo = st.db ? -80 : -0.2, hi = st.db ? 5 : 1.2;
      const toY = v => R.y + R.h - (v - lo) / (hi - lo) * R.h;
      const Y = v => toY(Math.max(lo, Math.min(hi, st.db ? 20 * Math.log10(Math.max(Math.abs(v), 1e-5)) : v)));
      if (!explore) {
        pen.rect(X(0), R.y, X(J.P) - X(0), R.h, c.inputSoft);
        const S = 8000 - J.P;
        pen.rect(X(S), R.y, X(8000) - X(S), R.h, c.paper2);
        for (let x = X(S) - R.h; x < X(8000); x += 9) {
          const x0 = Math.max(x, X(S)), x1 = Math.min(x + R.h, X(8000));
          if (x1 > x0) pen.line([[x0, R.y + R.h - (x0 - x)], [x1, R.y + R.h - (x1 - x)]], c.rule, 1);
        }
        pen.text('pass', (X(0) + X(J.P)) / 2, R.y + 14, { color: c.input, size: 12, font: 'body', weight: 600 });
        pen.text('remove', (X(S) + X(8000)) / 2, R.y + 14, { color: c.soft, size: 12, font: 'body', weight: 600 });
      }
      const ticks = st.db ? [[0, '0'], [-20, `${MINUS}20`], [-40, `${MINUS}40`], [-60, `${MINUS}60`], [-80, `${MINUS}80 dB`]] : [[0, '0'], [0.5, '0.5'], [1, '1']];
      ticks.forEach(([v, t]) => { pen.line([[R.x, toY(v)], [R.x + R.w, toY(v)]], c.rule, 1); pen.text(t, R.x - 6, toY(v) + 4, { align: 'right', color: c.soft, size: 10 }); });
      pen.text(st.db ? 'gain in dB' : 'gain', R.x - 6, R.y - 10, { align: 'left', color: c.soft, size: 10 });
      (phone ? [0, 4000, 8000] : [0, 2000, 4000, 6000, 8000]).forEach(f => pen.text(f === 8000 ? '8,000 Hz' : hz(f), Math.min(X(f), R.x + R.w - 18), R.y + R.h + 16, { color: c.soft, size: 10 }));
      pen.text('input tone, 16,000 samples per second', R.x, R.y + R.h + 32, { align: 'left', color: c.soft, size: 10 });
      if (st.db) {
        pen.line([[X(4000), toY(-40)], [X(8000), toY(-40)]], c.soft, 1, [4, 4]);
        pen.text(`${MINUS}40 dB = 1%`, X(8000) - 4, toY(-40) - 5, { align: 'right', color: c.soft, size: 10 });
      } else {
        pen.line([[X(0), Y(1)], [X(4000), Y(1)], [X(4000), Y(0)], [X(8000), Y(0)]], c.soft, 1.5, [6, 5]);
      }
      if (explore && !st.db) pen.line([[X(4600), R.y], [X(4600), R.y + R.h]], c.rule, 1);
      if (st.pinned) {
        const p = analyse(st.pinned.kind, st.pinned.N, J.P);
        pen.line(Array.from(p.curve, (v, i) => [X(i * 8), Y(v)]), c.input, 1.8, [5, 4]);
      }
      pen.line(Array.from(a.curve, (v, i) => [X(i * 8), Y(v)]), c.ink, 2);
      const locked = explore ? !st.unlocked : false;
      if (explore && !locked) {
        pen.dot(X(a.peakF), Y(a.peak), 4, c.accent);
        const lab = `${f3(a.peak)} at ${hz(a.peakF)} Hz`, right = X(a.peakF) > R.x + R.w * 0.55;
        pen.text(lab, X(a.peakF) + (right ? -8 : 8), Y(a.peak) - 8, { align: right ? 'right' : 'left', color: c.accentInk, size: 11 });
      }
      if (!explore && st.unlocked) {
        if (a.vb > 0.01) pen.dot(X(a.fb), Y(a.at(a.fb)), 4, c.accent);
        if (a.gh > 0.01) pen.dot(X(a.fg), Y(a.at(a.fg)), 4, c.accent);
      }

      const GX = t => G.x + t / 10 * G.w, GY = f => G.y + G.h - f / 4000 * G.h;
      pen.text('the ghost on your side, 8,000 samples per second: thicker is louder', G.x, G.y - 10, { align: 'left', color: c.ink, size: phone ? 10 : 11 });
      pen.rect(G.x, GY(J.P), G.w, GY(0) - GY(J.P), c.paper2);
      pen.line([[G.x, G.y + G.h], [G.x + G.w, G.y + G.h]], c.soft, 1);
      pen.text('4,000', G.x - 6, GY(4000) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.text(hz(J.P), G.x - 6, GY(J.P) + 10, { align: 'right', color: c.soft, size: 10 });
      pen.text('0 Hz', G.x - 6, GY(0) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.text(J.band.toLowerCase(), G.x + 6, GY(0) - 6, { align: 'left', color: c.soft, size: 10 });
      [0, 5, 10].forEach(t => pen.text(t === 10 ? '10 s' : String(t), Math.min(GX(t), G.x + G.w - 10), G.y + G.h + 14, { color: c.soft, size: 10 }));
      if (locked) return;
      for (let i = 0; i < 500; i++) {
        const t0 = i / 50, t1 = (i + 1) / 50, fin = 4000 + 400 * (t0 + t1) / 2, g = st.on ? Math.abs(a.curve[Math.round(fin / 8)]) : 1;
        const fo = 8000 - fin, wdt = Math.min(14, 18 * Math.pow(g, 0.6));
        if (wdt < 0.4) continue;
        const loud = g > 0.01 && fo < J.P;
        pen.line([[GX(t0), GY(8000 - 4000 - 400 * t0)], [GX(t1), GY(8000 - 4000 - 400 * t1)]], loud ? c.accent : c.soft, Math.max(1, wdt), [], loud ? 1 : 0.6);
      }
      if (st.t !== null) pen.line([[GX(st.t), G.y], [GX(st.t), G.y + G.h]], c.input, 2);
    }

    const audio = K.player({ rate: RATE, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play the sweep'; nowText(); if (on) ticker.start(); else { ticker.stop(); st.t = null; stage.redraw(); } } });
    const ticker = K.loop(host, () => { if (!audio.playing) return; st.t = ((audio.ctx.currentTime - audio.startedAt) % audio.duration + audio.duration) % audio.duration; stage.redraw(); });
    let refreshTimer = 0;
    const refreshSoon = () => { if (!audio.playing) return; clearTimeout(refreshTimer); refreshTimer = setTimeout(() => audio.refresh(), 150); };
    function nowText() {
      $('now').textContent = !audio.playing ? 'Not playing. Play the sweep to hear what reaches your side.'
        : st.on ? `Playing the 4,000 to 8,000 Hz sweep through the ${NAME[st.kind]}, ${st.N} coefficients, then the downsampler: what you hear is the ghost.`
          : 'Playing the sweep with the filter off: every tone folds straight into your line at full strength.';
    }

    function exploreWhy(a) {
      const pk = `${f3(a.peak)} at ${hz(a.peakF)} Hz`, leak = `The worst leak above 4,600 Hz is ${pct(a.gh)}.`;
      if (st.N === 7) return `The shortest the slider goes, three pairs and the middle. The cliff is a long gentle slope, and the bump sits far from the cutoff: ${pk}. ${leak}`;
      if (st.N < 31) return `Shorter than lesson 5’s filter: a gentler cliff, and the bump further from the cutoff, ${pk}. ${leak}`;
      if (st.N === 31) return `Lesson 5’s filter, the bug. The bump is ${pk}: the swell the engineer heard in the voice band. ${leak}`;
      if (st.N === 255) return `The longest the slider goes, more than eight times lesson 5’s filter. The bump sits at ${hz(a.peakF)} Hz, only ${hz(4000 - a.peakF)} Hz below the cutoff, and it is still ${f3(a.peak)}. ${leak}`;
      return `Longer than lesson 5’s filter: the bump has moved to ${hz(a.peakF)} Hz, ${hz(4000 - a.peakF)} Hz below the cutoff, and got narrower. Its height: ${f3(a.peak)}. ${leak}`;
    }
    function pinCompare(a) {
      const p = analyse(st.pinned.kind, st.pinned.N, 3400);
      if (p.N === a.N) return `Pinned ${p.N} coefficients. Move the slider to compare.`;
      const same = Math.abs(p.peak - a.peak) < 0.005;
      return `Pinned ${p.N}: bump ${f3(p.peak)} at ${hz(p.peakF)} Hz. Now ${a.N}: bump ${f3(a.peak)} at ${hz(a.peakF)} Hz. ${same ? `Same height; the ${a.N > p.N ? 'longer' : 'shorter'} cut only moves the bump ${a.N > p.N ? 'closer to' : 'away from'} the cutoff.` : `The heights differ by ${f3(Math.abs(p.peak - a.peak))}, nowhere near the 9% you would need to lose.`}`;
    }
    function fixMessage(a) {
      const J = job(), S = 8000 - J.P, slope = `${hz(S - J.P)} Hz`;
      const pass = a.vb <= 0.01 && a.gh <= 0.01;
      st.solved = false;
      if (st.N > J.budget) {
        return pass ? `${st.N} coefficients would do the job (band ${pct(a.vb)}, ghost ${pct(a.gh)}), but this chip affords only ${J.budget}. Find a shorter one that still passes.`
          : `${st.N} coefficients is more than this chip’s ${J.budget}, and it still fails. Shorten it, and look at the window’s shape.`;
      }
      if (st.kind === 'rect' && !pass) return `A plain cut keeps its ripple at any length: at ${st.N} the band strays ${pct(a.vb)} at ${hz(a.fb)} Hz and the ghost leaks ${pct(a.gh)} at ${hz(a.fg)} Hz. More coefficients only squeeze the ripple toward the cliff. Change the window’s shape.`;
      if (!pass) {
        const parts = [];
        if (a.gh > 0.01) parts.push(`the ghost leaks ${pct(a.gh)} at ${hz(a.fg)} Hz, heard at ${hz(8000 - a.fg)} Hz`);
        if (a.vb > 0.01) parts.push(`the band strays ${pct(a.vb)} at ${hz(a.fb)} Hz`);
        return `Too short for this job: ${NAME[st.kind]} ${st.N} has a slope wider than the ${slope} it may use. ${parts.join(', and ').replace(/^./, ch => ch.toUpperCase())}. Make it longer.`;
      }
      st.solved = true;
      const tail = `${NAME[st.kind]} ${st.N}: band within ${pct(a.vb)}, ghost below ${pct(a.gh)}, ${st.N} of ${J.budget} coefficients.`;
      if (st.caseIx === 1) {
        return `Fixed. ${tail} The engineer runs her sweep again. The first moment still leaks, fading below 1% by ${hz(a.edgeHi)} Hz, but it all lands in the empty margin. After that: nothing. No ghost in the voice band, and a wideband voice at 3,500 Hz now comes out at ${f3(a.at(3500))} instead of 1.090.`;
      }
      if (st.caseIx === 0) return `Fixed for the second bridge. ${tail} Its slope had only ${slope} to live in, so the band and the ghost both settle within 1% only with enough coefficients.`;
      return `Fixed. ${tail} The ghost no longer reaches this line’s band.`;
    }

    function setMeter(el, v, label) {
      el.querySelector('[data-label]').textContent = label;
      const ok = v <= 0.01;
      K.meter(el, v, { max: 0.1, text: ok ? `${pct(v)} ✓ within 1%` : `${pct(v)}, over 1%${v > 0.1 ? ', past the bar' : ''}` });
      el.classList.toggle('k-ok', ok);
    }

    function render() {
      const a = now(), J = job();
      slider.value = st.N; $('len-out').textContent = explore ? `${st.N} coefficients` : `${st.N} coefficients${st.N > J.budget ? `, over the budget of ${J.budget}` : ` of ${J.budget} allowed`}`;
      const locked = !st.unlocked;
      slider.disabled = locked; $('play').disabled = locked; $('pin').disabled = locked; $('db').disabled = locked;
      host.querySelectorAll('[data-window]').forEach(b => { b.disabled = locked; b.setAttribute('aria-pressed', String(b.dataset.window === st.kind)); });
      $('db').setAttribute('aria-pressed', String(st.db)); $('on').setAttribute('aria-pressed', String(st.on));
      $('on').textContent = st.on ? 'Filter on' : 'Filter off';
      if (explore) {
        $('result').textContent = locked ? `${st.N} coefficients, lesson 5’s filter · bump ${f3(a.peak)} at ${hz(a.peakF)} Hz`
          : `${st.N} coefficients · bump ${f3(a.peak)} at ${hz(a.peakF)} Hz · worst leak above 4,600 Hz ${pct(a.gh)}, ${dB(a.gh)}`;
        $('why').textContent = locked ? 'Answer the question above to unlock the slider.' : exploreWhy(a);
        $('compare').hidden = !st.pinned;
        if (st.pinned) $('compare').textContent = pinCompare(a);
        $('key-pin').hidden = !st.pinned;
        $('stage').setAttribute('aria-label', `Gain of the plain cut with ${st.N} coefficients at every input tone: the bump reaches ${f3(a.peak)} at ${hz(a.peakF)} Hz. Below it, the ghost of the sweep on your side.`);
      } else {
        $('task-text').textContent = J.text;
        $('result').textContent = `${NAME[st.kind]}, ${st.N} coefficients`;
        $('why').textContent = locked ? 'Answer the question above to unlock the window and the length.' : fixMessage(a);
        setMeter($('m-band'), locked ? 0 : a.vb, `${J.band}, 0 to ${hz(J.P)} Hz: largest stray from whole (line at 1%)`);
        setMeter($('m-ghost'), locked ? 0 : a.gh, `Ghost: loudest leak above ${hz(8000 - J.P)} Hz (line at 1%)`);
        if (locked) { $('m-band').querySelector('output').textContent = '?'; $('m-ghost').querySelector('output').textContent = '?'; $('m-band').classList.remove('k-ok'); $('m-ghost').classList.remove('k-ok'); }
        $('another').hidden = !st.solved;
        $('another').textContent = st.caseIx === 0 ? 'Next: your own line' : 'Try another line';
        if (st.solved && st.caseIx === 1) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        $('stage').setAttribute('aria-label', `Gain of the ${NAME[st.kind]} with ${st.N} coefficients against the job: pass up to ${hz(J.P)} Hz, remove above ${hz(8000 - J.P)} Hz. Below it, the ghost of the sweep on your side.`);
      }
      stage.redraw();
      nowText();
      refreshSoon();
    }

    function buildAsk() {
      if (explore) {
        K.ask($('ask'), {
          question: 'Lesson 5’s filter has 31 coefficients and a bump of 1.090. Push it to 255 coefficients, eight times as many. What happens to the bump above 1?',
          options: [['much', 'It shrinks to almost nothing'], ['little', 'It shrinks a little'], ['same', 'It stays about the same height']], right: 'same',
          hints: {
            much: 'The 0 Hz staircase settled toward 1 as pairs were added. But every new pair is a faster wiggle. Does a faster wiggle flatten the cliff’s edge, or just crowd closer to it?',
            little: 'Think about where each new, faster wiggle does its work: near 0 Hz, or right at the cliff?',
          },
          explain: 'It stays about the same: 1.090 at 255 as at 31. The bump only slides toward the cutoff and gets narrower. The slider is yours now: try every length.',
          reveal: 'Skip: show me', solved: st.unlocked ? 'right' : null,
          onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => slider,
        });
        return;
      }
      $('ask').replaceChildren();
      if (st.caseIx !== 0) { st.unlocked = true; return; }
      const q = document.createElement('div');
      $('ask').append(q);
      K.ask(q, {
        question: 'This bridge carries tones up to 3,500 Hz, so its slope must fit between 3,500 and 4,500 Hz: 1,000 Hz wide, where your own line allows 1,200. Compared with what your own line needs, will this filter need fewer coefficients, the same, or more?',
        options: [['fewer', 'Fewer'], ['same', 'About the same'], ['more', 'More']], right: 'more',
        hints: {
          fewer: 'A narrower slope means a narrower transition band. What did doubling the length do to the transition band?',
          same: 'Shape sets the ripple, length sets the transition band’s width. Which of the two does this job change?',
        },
        explain: 'More. Only length narrows the transition band, and here it must fit in 1,000 Hz instead of 1,200. The window and the length are yours: watch both bars.',
        onSolved: () => { st.unlocked = true; render(); }, focusAfter: () => host.querySelector('[data-window="rect"]'),
      });
    }

    if (explore) {
      ['task', 'windows', 'meters', 'another'].forEach(k => { $(k).hidden = true; });
    } else {
      ['pin', 'jump', 'key-step', 'key-pin', 'compare'].forEach(k => { $(k).hidden = true; });
      $('task').hidden = false; $('windows').hidden = false; $('meters').hidden = false;
    }
    buildAsk();

    slider.addEventListener('input', () => { st.N = Math.max(7, Math.min(Number(slider.max), odd(Number(slider.value)))); render(); });
    host.querySelectorAll('[data-window]').forEach(b => b.addEventListener('click', () => { st.kind = b.dataset.window; render(); }));
    $('db').addEventListener('click', () => { st.db = !st.db; render(); });
    $('on').addEventListener('click', () => { st.on = !st.on; render(); if (audio.playing) audio.refresh(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(() => render8k(now(), st.on))));
    $('pin').addEventListener('click', () => { st.pinned = { kind: st.kind, N: st.N }; render(); });
    $('another').addEventListener('click', () => {
      audio.stop();
      st.caseIx = (st.caseIx % (CASES.length - 1)) + 1;
      Object.assign(st, { kind: 'rect', N: 31, solved: false });
      buildAsk(); render(); host.querySelector('[data-window="rect"]').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      Object.assign(st, explore ? { N: 31, pinned: null, db: false, on: true } : { kind: 'rect', N: 31, db: true, on: true, solved: false });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const box = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    box.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });
})();
