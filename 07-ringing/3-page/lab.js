(() => {
  const K = window.Kit, FS = 8000;
  const { MINUS } = K;
  const num = (v, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const hz = f => num(Math.round(f));
  const fmtR = r => { const s = r.toFixed(3); return s.endsWith('0') ? s.slice(0, -1) : s; };
  const pct = g => `${Math.round(g * 100)}%`;
  const pctVs = g => (g < 0.9 && g >= 0.895 ? `${num(Math.floor(g * 1000) / 10, 1)}%` : pct(g));
  const msVs = (ms, limit) => (ms > limit && ms < limit + 0.05 ? num(ms, 2) : msText(ms));
  const decayN = r => Math.log(0.01) / Math.log(r);
  const decayMs = r => decayN(r) / 8;
  const samplesText = n => (n < 100 ? num(n, 1) : num(Math.round(n)));
  const msText = ms => num(ms, 1);
  const gainAt = (r, f) => {
    const w = 2 * Math.PI * f / FS, r2 = r * r;
    return ((1 + r2) / 2) * Math.abs(2 * Math.cos(w)) / Math.hypot(1 + r2 * Math.cos(2 * w), r2 * Math.sin(2 * w));
  };
  const edge = (r, level, side) => {
    let lo = side < 0 ? 0 : 2000, hi = side < 0 ? 2000 : 4000;
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if ((side < 0) === (gainAt(r, m) > level)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const bandwidth = r => edge(r, Math.SQRT1_2, 1) - edge(r, Math.SQRT1_2, -1);
  const radiusFor = f => { let lo = 0.3, hi = 0.999; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (gainAt(m, f) >= 0.9) hi = m; else lo = m; } return hi; };
  function notch(x, r) {
    const b = (1 + r * r) / 2, a = r * r, y = new Float32Array(x.length);
    for (let n = 0; n < x.length; n++) y[n] = b * (x[n] + (n >= 2 ? x[n - 2] : 0)) - (n >= 2 ? a * y[n - 2] : 0);
    return y;
  }

  const VOICE = K.wav(window.LESSON_CALL);
  const VOICE_PEAK = VOICE.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
  const CALL_AT = Math.round(0.3 * FS), CALL_LEN = CALL_AT + VOICE.length + Math.round(0.4 * FS);
  function callInput() {
    const x = new Float32Array(CALL_LEN);
    x[0] = 0.8;
    for (let n = 0; n < CALL_LEN; n++) x[n] += 0.06 * Math.cos(Math.PI / 2 * n);
    VOICE.forEach((s, i) => { x[CALL_AT + i] += 0.5 * s / VOICE_PEAK; });
    return x;
  }

  let oneShot = null;
  function playOnce(data) {
    oneShot = oneShot || new AudioContext();
    const b = oneShot.createBuffer(1, data.length, FS); b.copyToChannel(data, 0);
    const src = oneShot.createBufferSource(), g = oneShot.createGain();
    g.gain.value = 0.3; src.buffer = b; src.connect(g); g.connect(oneShot.destination); src.start();
  }

  const CASES = [
    { limitMs: 4, tone: 1500, start: 0.9, text: 'The support lead agrees: “Fine. Keep 1,500 Hz at 90%, and the ring under 4 ms.” Now meet that, with the whine still at 0%: move the pole radius until all three meters pass.' },
    { limitMs: 6, tone: 1600, start: 0.97, text: 'A second exchange carries noisier lines that hide more of the ring, so its panel accepts a ring under 1% within 6 ms. Its callers want 1,600 Hz at 90% or more. Find a radius that meets both.' },
    { limitMs: 3, tone: 1400, start: 0.9, text: 'A third exchange has very quiet lines, so the ring must be under 1% within 3 ms. Keep 1,400 Hz at 90% or more. Find a radius that meets both.' },
    { limitMs: 8, tone: 1700, start: 0.97, text: 'A fourth exchange allows a ring under 1% within 8 ms and wants 1,700 Hz at 90% or more. Find a radius that meets both.' },
    { limitMs: 10, tone: 1750, start: 0.98, text: 'A fifth exchange allows a ring under 1% within 10 ms and wants 1,750 Hz at 90% or more. Find a radius that meets both.' },
  ];
  CASES.forEach(c => { c.lo = radiusFor(c.tone); c.hi = 0.01 ** (1 / (c.limitMs * 8)); });
  const PHASE_A = { limitMs: 4, tone: 1800, lo: radiusFor(1800), hi: 0.01 ** (1 / 32) };

  function meterRow(label, max, scaleRight) {
    const el = document.createElement('div'); el.className = 'k-meter';
    el.innerHTML = '<span></span><div class="bar" aria-hidden="true"><div class="fill"></div><i class="r7-limit"></i></div><output aria-live="off">?</output><div class="scale" aria-hidden="true"><span>0</span><span></span></div>';
    el.querySelector('span').textContent = label;
    el.querySelector('.scale span:last-child').textContent = scaleRight;
    el.dataset.max = max;
    return el;
  }
  function setMeter(el, value, { limit, ok, text }) {
    const max = Number(el.dataset.max);
    K.meter(el, value, { max, text });
    el.querySelector('.fill').classList.toggle('r7-ok', Boolean(ok));
    const lim = el.querySelector('.r7-limit');
    lim.hidden = limit === undefined;
    if (limit !== undefined) lim.style.left = `${Math.min(limit / max, 1) * 100}%`;
  }

  function mountLab(host, mode) {
    host.replaceChildren(document.getElementById('ring-lab').content.cloneNode(true));
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const state = { r: 0.9, progress: Infinity, filter: true, pinned: null, q1: false, q2: false, phase: 'a', caseIx: 0, seenRing: false, seenTone: false, solved: false, unlocked: false };

    const radius = $('radius');
    if (!explore) { radius.step = '0.005'; $('fine').hidden = false; }
    const spec = () => (state.phase === 'a' ? PHASE_A : CASES[state.caseIx]);

    const meters = {};
    if (explore) {
      meters.decay = meterRow('Decay time', 60, '60 ms');
      $('meters').append(meters.decay);
    } else {
      meters.decay = meterRow('Decay time', 10, '10 ms');
      meters.tone = meterRow('Gain at 1,800 Hz', 1, '100%');
      meters.w = meterRow('Gain at 2,000 Hz, the whine', 1, '100%');
      $('meters').append(meters.decay, meters.tone, meters.w);
    }

    const drawExplore = s => {
      const { pen, c, w, h } = s, stacked = w < 560;
      if (w < 120) return;
      const side = stacked ? Math.min(w - 20, 220) : Math.min(h - 30, 230);
      const cx = stacked ? w / 2 : 14 + side / 2, cy = stacked ? 12 + side / 2 : h / 2, R = Math.max(4, side / 2 - 18);
      pen.line([[cx - R - 10, cy], [cx + R + 10, cy]], c.soft, 1);
      pen.ring(cx, cy, R, c.soft, 1);
      const r = state.r, shown = Math.min(state.progress, decayN(r) * 1.5 + 4);
      const X = n => cx + R * r ** n * Math.cos(Math.PI / 2 * n), Y = n => cy - R * r ** n * Math.sin(Math.PI / 2 * n);
      const zero = (y) => { pen.ring(cx, y, 4.5, c.ink, 1.6); };
      zero(cy - R); zero(cy + R);
      [[cx, cy - R * r], [cx, cy + R * r]].forEach(([x, y]) => { pen.line([[x - 5, y - 5], [x + 5, y + 5]], c.ink, 2); pen.line([[x - 5, y + 5], [x + 5, y - 5]], c.ink, 2); });
      if (isFinite(state.progress)) {
        const last = Math.floor(shown), pts = [];
        for (let n = 0; n <= last; n++) pts.push([X(n), Y(n)]);
        pen.line(pts, c.ink, 1.2, [], 0.6);
        pen.dot(X(last), Y(last), 4.5, c.ink);
      } else {
        const pts = []; for (let n = 0; n <= Math.min(decayN(r), 120); n++) pts.push([X(n), Y(n)]);
        pen.line(pts, c.ink, 1.2, [], 0.6);
      }
      pen.text(`pole radius ${fmtR(r)}`, cx, stacked ? cy + R + 30 : h - 6, { color: c.soft, size: 11 });
      const A = stacked ? { x: 40, y: side + 62, w: w - 56, h: h - side - 98 } : { x: side + 60, y: 22, w: w - side - 76, h: h - 62 };
      const longest = Math.max(decayMs(r), state.pinned ? decayMs(state.pinned.r) : 0);
      const T = [5, 10, 20, 40, 60, 80, 120].find(t => t >= longest * 1.25) || 120, Xt = ms => A.x + ms / T * A.w, Yv = v => A.y + A.h / 2 - v * A.h / 2 * 0.95;
      pen.line([[A.x, Yv(0)], [A.x + A.w, Yv(0)]], c.soft, 1);
      pen.text('1', A.x - 6, Yv(1) + 4, { align: 'right', color: c.soft });
      pen.text(`${MINUS}1`, A.x - 6, Yv(-1) + 4, { align: 'right', color: c.soft });
      [0, T / 2, T].forEach(ms => pen.text(ms === T ? `${ms} ms` : String(ms), Xt(ms), A.y + A.h + 16, { color: c.soft, size: 10, align: ms === T ? 'right' : 'center' }));
      if (state.pinned) {
        const p = state.pinned, env = [];
        for (let ms = 0; ms <= T; ms += 0.25) env.push([Xt(ms), Yv(p.r ** (ms * 8))]);
        pen.line(env, c.input, 1.5, [5, 4]);
        pen.line(env.map(([x, y]) => [x, 2 * Yv(0) - y]), c.input, 1.5, [5, 4]);
      }
      const env = [];
      for (let ms = 0; ms <= T; ms += 0.25) env.push([Xt(ms), Yv(r ** (ms * 8))]);
      pen.line(env, c.soft, 1.2, [6, 5]); pen.line(env.map(([x, y]) => [x, 2 * Yv(0) - y]), c.soft, 1.2, [6, 5]);
      const nMax = Math.min(T * 8, Math.floor(shown));
      for (let n = 0; n <= nMax; n += 2) {
        const v = r ** n * Math.cos(Math.PI / 2 * n);
        pen.line([[Xt(n / 8), Yv(0)], [Xt(n / 8), Yv(v)]], c.ink, 1.2);
      }
      const d = decayMs(r);
      if (d <= T && shown >= decayN(r)) {
        pen.line([[Xt(d), A.y], [Xt(d), A.y + A.h]], c.accent, 2);
        pen.text(`1% at ${msText(d)} ms`, Xt(d) + (d > 40 ? -6 : 6), A.y + 10, { align: d > 40 ? 'right' : 'left', color: c.accentInk, size: 12 });
      } else if (d > T) pen.text(`1% at ${msText(d)} ms, past the plot`, A.x + A.w, A.y + 10, { align: 'right', color: c.accentInk, size: 12 });
      pen.text('the ring, as a share of its start', A.x, A.y - 8, { align: 'left', color: c.soft, size: 11 });
    };

    const drawFix = s => {
      const { pen, c, w, h } = s, stacked = w < 560, S = spec(), r = state.r;
      if (w < 120) return;
      const A = stacked ? { x: 44, y: 24, w: w - 60, h: 140 } : { x: 44, y: 24, w: (w - 100) / 2, h: h - 66 };
      const B = stacked ? { x: 44, y: 224, w: w - 60, h: 160 } : { x: A.x + A.w + 50, y: 24, w: (w - 100) / 2, h: h - 66 };
      const Fx = f => A.x + (f - 1000) / 2000 * A.w, Gy = g => A.y + A.h - g * A.h;
      pen.text('gain, 1,000 to 3,000 Hz', A.x, A.y - 10, { align: 'left', color: c.soft, size: 11 });
      pen.line([[A.x, Gy(0)], [A.x + A.w, Gy(0)]], c.soft, 1);
      pen.line([[A.x, Gy(0.9)], [A.x + A.w, Gy(0.9)]], c.soft, 1, [2, 3]);
      pen.text('90%', A.x - 6, Gy(0.9) + 4, { align: 'right', color: c.soft, size: 10 });
      pen.text('0%', A.x - 6, Gy(0) + 4, { align: 'right', color: c.soft, size: 10 });
      [1000, 2000, 3000].forEach(f => pen.text(f === 3000 ? '3,000 Hz' : hz(f), Fx(f), Gy(0) + 16, { color: c.soft, size: 10, align: f === 3000 ? 'right' : f === 1000 ? 'left' : 'center' }));
      const tf = S.tone;
      pen.line([[Fx(tf), A.y], [Fx(tf), Gy(0)]], c.soft, 1, [2, 3]);
      pen.text(`${hz(tf)} Hz`, Fx(tf) - 4, Gy(0) - 6, { align: 'right', color: c.soft, size: 10 });
      const pts = []; for (let f = 1000; f <= 3000; f += 4) pts.push([Fx(f), Gy(gainAt(r, f))]);
      pen.line(pts, c.ink, 2);
      const g = gainAt(r, tf);
      pen.dot(Fx(tf), Gy(g), 5, g >= 0.9 ? c.input : c.accent);
      const Tx = ms => B.x + ms / 30 * B.w, By = bw => B.y + B.h - bw / 600 * B.h;
      pen.text('bandwidth, Hz, against decay time', B.x, B.y - 10, { align: 'left', color: c.soft, size: 11 });
      pen.line([[B.x, By(0)], [B.x + B.w, By(0)]], c.soft, 1);
      pen.line([[B.x, B.y], [B.x, By(0)]], c.soft, 1);
      [0, 10, 20, 30].forEach(ms => pen.text(ms === 30 ? '30 ms' : String(ms), Tx(ms), By(0) + 16, { color: c.soft, size: 10, align: ms === 30 ? 'right' : 'center' }));
      [0, 300, 600].forEach(bw => pen.text(String(bw), B.x - 6, By(bw) + 4, { align: 'right', color: c.soft, size: 10 }));
      const cur = []; for (let rr = 0.79; rr <= 0.9805; rr += 0.0025) cur.push([Tx(decayMs(rr)), By(bandwidth(rr))]);
      pen.line(cur, c.ink, 1.5);
      const xl = Tx(S.limitMs), yl = By(bandwidth(S.lo));
      pen.line([[xl, B.y], [xl, By(0)]], c.soft, 1.5, [2, 3]);
      pen.line([[B.x, yl], [B.x + B.w, yl]], c.soft, 1.5, [2, 3]);
      pen.text(`${S.limitMs} ms`, xl + 4, B.y + 10, { align: 'left', color: c.soft, size: 10 });
      pen.text(`${hz(S.tone)} Hz at 90%`, B.x + B.w, yl - 6, { align: 'right', color: c.soft, size: 10 });
      const dx = Math.min(Tx(decayMs(r)), B.x + B.w - 6), dy = By(Math.min(bandwidth(r), 640));
      pen.dot(dx, dy, 6, c.input);
      if (decayMs(r) > 30) pen.text(`your notch: ${msText(decayMs(r))} ms, off the plot →`, B.x + B.w, B.y + 26, { align: 'right', color: c.soft, size: 10 });
    };

    const stage = K.stage($('stage'), s => (explore ? drawExplore(s) : drawFix(s)), { height: w => (explore ? (w < 560 ? 470 : 270) : (w < 560 ? 420 : 250)) });
    const loop = K.loop(host, dt => {
      const per = Math.max(1, decayN(state.r) / 75);
      state.progress += per * Math.max(1, Math.round(dt * 30));
      if (state.progress >= decayN(state.r) * 1.5 + 4) { state.progress = Infinity; loop.stop(); }
      stage.redraw();
    });

    function exploreWhy() {
      const r = state.r, d = decayMs(r), swings = Math.round(d * 2);
      if (r < 0.8 - 1e-9) return `Poles far from the circle: the ring is gone in ${msText(d)} ms, about ${swings} swings. Too short to hear as a pitch, just a click, but the notch is very wide.`;
      if (r < 0.9 - 1e-9) return `The ring falls to 1% in ${msText(d)} ms, about ${swings} swings of 2,000 Hz. Shorter than the shipped notch, and a wider notch to pay for it.`;
      if (Math.abs(r - 0.9) < 1e-9) return 'The notch on your line: 43.7 samples, 5.5 ms, about 11 swings of 2,000 Hz. Long enough to hear a pitch, which is the tink.';
      if (r < 0.98 - 1e-9) return `Closer to the circle: ${samplesText(decayN(r))} samples, ${msText(d)} ms, about ${swings} swings. The bell rings longer.`;
      if (Math.abs(r - 0.98) < 1e-9) return 'Lesson 6’s upgrade: 228 samples, 28.5 ms, about 57 swings. A clear little bell after every click.';
      if (r < 0.995 - 1e-9) return `Almost on the circle: ${samplesText(decayN(r))} samples, ${msText(d)} ms. A real bell.`;
      return `The slider’s end, 0.995: ${samplesText(decayN(r))} samples, ${msText(d)} ms, past this plot. On the circle itself, at 1, the ring would never stop.`;
    }
    function pinText() {
      const p = state.pinned, r = state.r;
      if (Math.abs(p.r - r) < 1e-9) return `Pinned ${fmtR(p.r)}: ${msText(decayMs(p.r))} ms. Move the slider to compare.`;
      const ratio = decayMs(r) / decayMs(p.r), gapGrow = (1 - r) / (1 - p.r);
      const gapWords = gapGrow > 1 ? `${num(gapGrow, 1)} times larger` : `${num(1 / gapGrow, 1)} times smaller`;
      const ringWords = ratio >= 1 ? `lasts ${num(ratio, 1)} times as long` : `is ${num(1 / ratio, 1)} times shorter`;
      return `Pinned ${fmtR(p.r)}: ${msText(decayMs(p.r))} ms, gap to the circle ${num(1 - p.r, 3)}. Now ${fmtR(r)}: ${msText(decayMs(r))} ms, gap ${num(1 - r, 3)}. The gap is ${gapWords} than the pinned one, and the ring ${ringWords}.`;
    }

    function fixMessage() {
      const S = spec(), r = state.r, d = decayMs(r), ringOk = d <= S.limitMs + 1e-9, g = gainAt(r, S.tone), toneOk = g >= 0.9;
      const tone = `${hz(S.tone)} Hz`;
      state.solved = false;
      if (state.phase === 'a') {
        if (ringOk) state.seenRing = true;
        if (toneOk) state.seenTone = true;
        const both = state.seenRing && state.seenTone;
        if (both && !state.compromise) { state.compromise = true; askCompromise(); requestAnimationFrame(() => { $('ask').querySelector('.k-q')?.scrollIntoView({ block: 'nearest' }); $('ask').querySelector('button:not(:disabled)')?.focus(); }); }
        let msg;
        if (ringOk && !toneOk) msg = `The ring is under 1% in ${msVs(d, S.limitMs)} ms, inside the panel’s 4 ms, but ${tone} keeps only ${pctVs(g)}. The notch is too wide for the voice. Move the poles toward the circle and watch the decay time.`;
        else if (toneOk && !ringOk) msg = `${tone} keeps ${pctVs(g)}, but the ring lasts ${msVs(d, S.limitMs)} ms, past the panel’s 4 ms. Move the poles away from the circle and watch ${tone}.`;
        else msg = `Neither request is met here: the ring lasts ${msVs(d, S.limitMs)} ms, over 4 ms, and ${tone} keeps only ${pctVs(g)}.`;
        if (both) msg += ' You have now tried both ends of the slider. Decide what to take to the support lead.';
        return msg;
      }
      if (!ringOk && !toneOk) return `The ring lasts ${msVs(d, S.limitMs)} ms and ${tone} keeps only ${pctVs(g)}.`;
      if (!ringOk) return `${tone} keeps ${pctVs(g)} and the whine is at 0%, but the ring lasts ${msVs(d, S.limitMs)} ms, past the ${S.limitMs} ms limit. The poles are too close to the circle: move them inward.`;
      if (!toneOk) return `The ring is under 1% in ${msVs(d, S.limitMs)} ms, inside ${S.limitMs} ms, but ${tone} keeps only ${pctVs(g)}: the notch is too wide and bites into the voice. Move the poles toward the circle.`;
      state.solved = true;
      if (state.caseIx === 0) return `Fixed at radius ${fmtR(r)}. The ring falls under 1% in ${msVs(d, S.limitMs)} ms, 1,500 Hz keeps ${pctVs(g)}, and the whine stays at 0%. The tink is still there, but it now dies too fast for a listener to hear it as a pitch. The tickets stop.`;
      return `Fixed at radius ${fmtR(r)}: the ring is under 1% in ${msVs(d, S.limitMs)} ms, inside ${S.limitMs} ms, and ${tone} keeps ${pctVs(g)}. The whine stays at 0%.`;
    }

    function nowText() {
      if (!audio.playing && !state.filter) return 'The notch is off, so a click is only a click: Click is off. Turn the notch on to hear the tink, or play the call to hear the whine.';
      if (!audio.playing) return explore ? 'Not playing. Press Click to hear one tink, or play a call connecting.' : 'Not playing. Play a call connecting to hear the tink at your radius.';
      const tink = decayMs(state.r) < 3 ? 'a ring too short to hear as a pitch' : 'a tink at 2,000 Hz';
      return state.filter ? `Playing a call connecting through the notch at radius ${fmtR(state.r)}: the relay click, ${tink}, then the voice with no whine.` : 'Playing the call with the notch off: the relay click and a steady 2,000 Hz whine under the voice, but no tink.';
    }

    function render() {
      const r = state.r;
      radius.value = r; $('radius-out').textContent = fmtR(r);
      $('filter').setAttribute('aria-pressed', String(state.filter)); $('filter').textContent = state.filter ? 'Notch on' : 'Notch off';
      $('click').disabled = !state.filter || (explore && !state.q1) || (!explore && !state.unlocked);
      if (explore) {
        radius.disabled = !state.q1; $('pin').disabled = !state.q1;
        const d = decayMs(r);
        setMeter(meters.decay, d, { text: `${msText(d)} ms${d > 60 ? ', past the bar' : ''}` });
        $('result').textContent = `radius ${fmtR(r)} · keeps ${fmtR(r)} per sample · decay time ${samplesText(decayN(r))} samples, ${msText(d)} ms`;
        $('why').textContent = state.q1 ? exploreWhy() : 'Answer the question above to unlock the slider.';
        $('compare').hidden = !state.pinned; if (state.pinned) $('compare').textContent = pinText();
        $('key-pin').hidden = !state.pinned;
        $('stage').setAttribute('aria-label', `Pole pair at radius ${fmtR(r)} and its ring after a click: it falls to 1% in ${msText(d)} ms.`);
      } else {
        const S = spec(), d = decayMs(r), gT = gainAt(r, S.tone);
        radius.disabled = !state.unlocked;
        host.querySelectorAll('[data-nudge]').forEach(b => { b.disabled = !state.unlocked; });
        $('task-text').textContent = state.phase === 'a'
          ? 'The support lead asks for two things: the ring under 1% within 4 ms, and 1,800 Hz kept at 90% or more. Try to meet both.'
          : CASES[state.caseIx].text;
        setMeter(meters.decay, d, { limit: S.limitMs, ok: d <= S.limitMs + 1e-9, text: `${msText(d)} ms${d > 10 ? ', past the bar' : ''}` });
                meters.tone.querySelector('span').textContent = `Gain at ${hz(S.tone)} Hz`;
        setMeter(meters.tone, gT, { limit: 0.9, ok: gT >= 0.9, text: pctVs(gT) });
        setMeter(meters.w, 0, { text: '0%, removed', ok: true });
        $('result').textContent = `radius ${fmtR(r)} · decay ${msText(d)} ms · bandwidth ${hz(bandwidth(r))} Hz · ${hz(S.tone)} Hz at ${pctVs(gT)}`;
        $('why').textContent = state.unlocked ? fixMessage() : 'Answer the question above to unlock the slider.';
        $('another').hidden = !state.solved;
        if (state.solved && state.caseIx === 0) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        $('stage').setAttribute('aria-label', `Notch at radius ${fmtR(r)}: ${hz(S.tone)} Hz passes ${pct(gT)}, and on the bandwidth against decay time curve your notch sits at ${msText(d)} ms, with the request's limits drawn as dotted lines.`);
      }
      if (!loop.running) stage.redraw();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    const renderCall = () => { const x = callInput(); return state.filter ? notch(x, state.r) : x; };
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play a call connecting'; $('now').textContent = nowText(); } });

    function buildAsks() {
      if (explore) {
        K.ask($('ask'), {
          question: 'At radius 0.9 the tink lasts 5.5 ms. Lesson 6’s poles at 0.98 looked like an upgrade. How long will 0.98 ring?',
          options: [['2', 'About twice as long, 11 ms'], ['5', 'About five times as long, 28 ms'], ['20', 'About twenty times as long, 110 ms']], right: '5',
          hints: {
            2: 'Each sample, 0.9 loses 10% of the ring and 0.98 loses 2%. How many times slower is a 2% loss?',
            20: 'Each sample, 0.9 loses 10% and 0.98 loses 2%. That is slower, but not twenty times slower.',
          },
          explain: '0.98 rings for 28.5 ms, 5.2 times as long as 0.9. Set the slider to 0.98 and press Click to hear it.',
          solved: state.q1 ? 'right' : null,
          onSolved: () => { state.q1 = true; render(); askSecond(); }, focusAfter: () => $('ask2').querySelector('button'),
        });
        if (state.q1) askSecond(true);
        return;
      }
      $('ask').replaceChildren();
      K.ask($('ask'), {
        question: 'Before you touch the slider: 1,800 Hz is 200 Hz from the whine, so the bandwidth can be at most about 200 Hz. What decay time does the curve force?',
        options: [['2', 'About 2 ms, well under 4 ms'], ['4', 'About 4 ms, right at the limit'], ['7', 'About 7 ms, nearly twice the limit']], right: '7',
        hints: {
          2: 'A narrow notch means a long ring. Bandwidth × decay time stays near 1.46: divide 1.46 by 200 Hz.',
          4: 'A 4 ms ring needs a bandwidth of 1.46 ÷ 0.004 s = 365 Hz. 200 Hz is narrower, so the ring is longer.',
        },
        explain: '1.46 ÷ 200 Hz is 0.0073 s, 7.3 ms, nearly twice the panel\u2019s limit. Try to meet both anyway: the slider is yours.',
        onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => radius,
      });
    }
    function askCompromise() {
      $('ask2').replaceChildren();
      K.ask($('ask'), {
        question: 'No radius you tried meets both requests. What do you take to the support lead?',
        options: [['tone', 'Keep the ring under 4 ms, and ask for a lower voice tone at 90%'], ['ring', 'Keep 1,800 Hz at 90%, and let the ring last about 7.5 ms'], ['split', 'Ask for a little of each: a 6 ms ring and 1,700 Hz at 90%']], right: 'tone',
        hints: {
          ring: 'The tickets are about the tink. A 7.5 ms ring is nearly twice the panel\u2019s limit, so callers would still hear it.',
          split: 'A ring over 4 ms is still heard as a pitch, the panel says, so a 6 ms ring keeps the tink. The ring limit is the customers\u2019 complaint.',
        },
        explain: 'The ring limit is what the customers complained about, so the voice tone has to give. Now decide how far.',
        onSolved: () => askTone(), focusAfter: () => $('ask2').querySelector('button'),
      });
    }
    function askTone() {
      const need = f => msText(decayMs(radiusFor(f)));
      K.ask($('ask2'), {
        question: 'With the ring under 4 ms, the notch is at least about 365 Hz wide. Which voice tone can you promise at 90% or more?',
        options: [['1750', '1,750 Hz'], ['1700', '1,700 Hz'], ['1500', '1,500 Hz']], right: '1500',
        hints: {
          1750: `1,750 Hz is only 250 Hz from the whine. Keeping it at 90% needs a ring of at least ${need(1750)} ms, past the 4 ms limit.`,
          1700: `1,700 Hz is 300 Hz from the whine, less than one 365 Hz bandwidth. It needs a ring of at least ${need(1700)} ms, still past 4 ms.`,
        },
        explain: '1,500 Hz is 500 Hz from the whine, more than one 365 Hz bandwidth, so it fits with room to spare. You take it to the lead.',
        onSolved: () => {
          state.phase = 'b'; state.caseIx = 0; state.r = CASES[0].start;
          $('ask').replaceChildren(); $('ask2').replaceChildren();
          document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2a' }));
          render(); radius.focus();
        },
      });
    }
    function askSecond(silent = false) {
      K.ask($('ask2'), {
        question: 'Now halve the pole’s gap to the circle, 1 − r: from 0.90 (gap 0.10) to 0.95 (gap 0.05). What happens to the decay time?',
        options: [['half', 'It halves'], ['same', 'It stays the same'], ['double', 'It doubles'], ['four', 'It grows four times']], right: 'double',
        hints: {
          half: 'Closer to the circle, the dot keeps more of the ring each sample. Does that make the ring shorter or longer?',
          same: 'The radius is what the ring keeps per sample. If it keeps more, does it take the same time to fall to 1%?',
          four: 'Each sample now loses about 5% instead of 10%. How many times slower is that?',
        },
        explain: '0.95 rings 11.2 ms against 0.9’s 5.5 ms: twice as long. It loses half as much per sample, so it takes twice as many samples to fall to 1%. Try it on the slider, and pin one radius to compare.',
        solved: state.q2 ? 'right' : null,
        onSolved: () => { state.q2 = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' })); render(); }, focusAfter: () => radius,
      });
      if (!silent && state.q2) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' }));
    }

    function startClick() {
      state.progress = 0;
      const n = Math.min(Math.round(decayN(state.r) * 2) + 800, FS);
      const x = new Float32Array(n); x[0] = 1;
      playOnce(state.filter ? notch(x, state.r) : x);
      if (K.reduced.matches || !explore) state.progress = Infinity; else loop.start();
      render();
    }

    if (!explore) {
      ['pin', 'jump', 'key-explore'].forEach(k => { $(k).hidden = true; });
      ['task', 'key-fix'].forEach(k => { $(k).hidden = false; });
    }
    buildAsks();

    radius.addEventListener('input', () => {
      state.r = Math.round(Number(radius.value) * 1000) / 1000;
      if (explore) { state.progress = Infinity; loop.stop(); }
      render();
    });
    $('click').addEventListener('click', startClick);
    host.querySelectorAll('[data-nudge]').forEach(b => b.addEventListener('click', () => {
      if (radius.disabled) return;
      state.r = Math.min(0.995, Math.max(0.7, Math.round((state.r + Number(b.dataset.nudge)) * 1000) / 1000)); render();
    }));
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(renderCall)));
    $('filter').addEventListener('click', () => { state.filter = !state.filter; render(); });
    $('pin').addEventListener('click', () => { state.pinned = { r: state.r }; render(); });
    $('another').addEventListener('click', () => {
      audio.stop();
      state.caseIx = (state.caseIx % (CASES.length - 1)) + 1;
      $('ask').replaceChildren(); $('ask2').replaceChildren();
      state.r = CASES[state.caseIx].start; state.solved = false;
      render(); radius.focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop(); loop.stop();
      if (explore) Object.assign(state, { r: 0.9, progress: Infinity, pinned: null, filter: true });
      else Object.assign(state, { r: spec() === PHASE_A ? 0.9 : CASES[state.caseIx].start, filter: true });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => { audio.stop(); loop.stop(); } };
  }

  K.ask(document.getElementById('predict-ring'), {
    question: 'The click is one sample. The rule’s input part, x[n] + x[n − 2], has nothing left after n = 2. When does the output stop?',
    options: [['0', 'Right after n = 0'], ['2', 'After n = 2, when the input part runs out'], ['never', 'It keeps going, shrinking']], right: 'never',
    hints: {
      0: 'At n = 2 the input part still sees the click two samples back. And the rule also looks at y[n − 2].',
      2: 'Look at the last term: − 0.81 y[n − 2]. Is y[2] zero?',
    },
    explain: 'It keeps going: every output feeds the one two samples later through − 0.81 y[n − 2], so the output never quite stops. Here it is, sample by sample.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-ring' })),
  });

  document.querySelectorAll('.table').forEach(t => { t.tabIndex = 0; t.setAttribute('role', 'region'); t.setAttribute('aria-label', 'Table, scrolls sideways on narrow screens'); });
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
