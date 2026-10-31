(() => {
  const K = window.Kit, FS = 8000, LIMIT = 4000, VOICE_TOP = 3400, PERIOD = 0.9, STOPS = 8;
  const { hz, MINUS } = K;
  const cosd = d => Math.cos(d * Math.PI / 180), sind = d => Math.sin(d * Math.PI / 180);
  const stored = f => { const m = ((f % FS) + FS) % FS; return m <= LIMIT ? m : FS - m; };
  const turnOf = f => 360 * f / FS;
  const degText = d => `${Number.isInteger(d) ? d : d.toFixed(1)}°`;
  const pctText = v => (v > 0 && v < 0.005 ? 'under 1%' : `${Math.round(v * 100)}%`);
  const joinList = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const num = v => (Math.abs(v) < 0.005 ? '0' : Math.abs(v - Math.round(v)) < 0.005 ? `${v < 0 ? MINUS : ''}${Math.abs(Math.round(v))}` : K.fmt(v));

  function fft(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inverse ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let j = 0; j < half; j++) {
          const a = i + j, b = a + half, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  const SLOPE = 600;
  const gainAt = (cut, f) => Math.max(0, Math.min(1, (cut + SLOPE - f) / (2 * SLOPE)));
  function shape(x, gainOf) {
    let n = 1; while (n < x.length) n <<= 1;
    const re = new Float64Array(n), im = new Float64Array(n);
    re.set(x); fft(re, im, false);
    for (let k = 0; k < n; k++) { const a = gainOf(Math.min(k, n - k) * FS / n); re[k] *= a; im[k] *= a; }
    fft(re, im, true);
    return Float32Array.from(re.subarray(0, x.length));
  }

  const RAW = K.wav(window.LESSON_CALL);
  const VOICE = (() => { const v = shape(RAW, f => (f > VOICE_TOP ? 0 : 1)), peak = v.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6); return v.map(s => 0.5 * s / peak); })();
  const voiceCache = new Map();
  const voiceAt = c => { if (!voiceCache.has(c)) voiceCache.set(c, shape(VOICE, f => gainAt(c, f))); return voiceCache.get(c); };

  const CASES = [
    { text: 'The call carries a caller’s voice up to 3,400 Hz, the clinic’s 5,000 Hz whistle and the fan’s 4,600 Hz squeal. Place the filter, then slide its cutoff. Real filters slope, and this one does too: it keeps every tone up to 600 Hz below the cutoff, lets half through at the cutoff itself, and removes everything from 600 Hz above it. You are done when every alias is out of the voice band and the voice keeps at least 90% of every tone up to 3,400 Hz.',
      extra: [{ name: 'whistle', f: 5000, size: 0.25 }, { name: 'squeal', f: 4600, size: 0.12 }] },
    { text: 'A new call: the voice, a 6,500 Hz beep from a pager on the caller’s desk, and a 4,700 Hz squeal from a worn fan. Same filter, same test: every alias out of the voice band, and every voice tone up to 3,400 Hz kept at 90% or more.',
      extra: [{ name: 'pager beep', f: 6500, size: 0.2 }, { name: 'fan squeal', f: 4700, size: 0.12 }] },
    { text: 'Another line: the voice, a 7,000 Hz whine from an old television in the room, and a 5,400 Hz chirp from a smoke alarm. Same filter, same test: every alias out of the voice band, and every voice tone up to 3,400 Hz kept at 90% or more.',
      extra: [{ name: 'television whine', f: 7000, size: 0.2 }, { name: 'alarm chirp', f: 5400, size: 0.15 }] },
  ];

  function arcPts(cx, cy, r0, r1, a0, a1) {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 4)), pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, r = r0 + (r1 - r0) * i / n; pts.push([cx + r * cosd(a), cy - r * sind(a)]); }
    return pts;
  }

  function drawExplore(s, st) {
    const { pen, c, w, h } = s, wide = w >= 560;
    const R = wide ? Math.min(84, h / 2 - 60) : 78, cx = wide ? 116 : w / 2, cy = wide ? h / 2 - 2 : 104;
    const A = wide ? { x: 262, y: 26, w: w - 262 - 14, h: h - 70 } : { x: 34, y: 228, w: w - 46, h: h - 228 - 40 };
    const f = st.tone, turn = turnOf(f), sf = stored(f), back = f > LIMIT && f < FS;
    const anim = st.animating, phase = anim ? (st.t / PERIOD) % STOPS : STOPS - 1, upto = Math.floor(phase);
    pen.line([[cx - R, cy], [cx + R, cy]], c.soft, 1, [3, 4]);
    pen.line(arcPts(cx, cy, R, R, 0, 360), c.ink, 1.5);
    const labelled = new Set();
    for (let n = 0; n <= upto; n++) {
      const a = turn * n, x = cx + R * cosd(a), y = cy - R * sind(a), key = Math.round(((a % 360) + 360) % 360);
      pen.dot(x, y, 4, c.ink);
      if (!labelled.has(key)) { labelled.add(key); pen.text(String(n), cx + (R + 15) * cosd(a), cy - (R + 15) * sind(a) + 4, { color: c.soft, size: 11 }); }
    }
    const from = anim ? turn * upto : 0, to = anim ? turn * phase : turn;
    if (f > 0) {
      const laps = (to - from) / 360;
      pen.line(arcPts(cx, cy, R - 10, R - 10 - Math.min(laps, 2) * 8, from, to), c.soft, 1.2, [3, 3], 0.8);
      const shortTo = from + (back ? -(360 - (turn % 360)) : (turn % 360 === 0 ? 0 : turn % 360));
      if (!anim && f !== FS && f % FS !== 0) pen.line(arcPts(cx, cy, R - 26, R - 26, turn * 0, shortTo - from), c.accent, 2.2);
    }
    const ma = anim ? turn * phase : turn;
    pen.line([[cx, cy], [cx + R * cosd(ma), cy - R * sind(ma)]], c.soft, 1, [3, 3]);
    pen.ring(cx + R * cosd(ma), cy - R * sind(ma), 7, c.ink, 2);
    pen.text(anim ? `sample ${upto}` : `${degText(turn)} per sample`, cx, cy + R + 34, { color: c.ink, size: 12 });
    if (!anim && f > 0 && f % FS !== 0) pen.text(back ? `looks like ${degText(360 - (turn % 360))} clockwise` : (turn % 360 === 180 ? 'a flip' : `short way: ${degText(turn % 360)}`), cx, cy + R + 50, { color: c.accentInk, size: 11 });

    const X = n => A.x + (n + 0.3) / 8.6 * A.w, Y = v => A.y + A.h / 2 - v / 1.25 * A.h / 2;
    pen.line([[A.x, Y(0)], [A.x + A.w, Y(0)]], c.soft, 1);
    pen.text('1', A.x - 6, Y(1) + 4, { align: 'right', color: c.soft });
    pen.text(`${MINUS}1`, A.x - 6, Y(-1) + 4, { align: 'right', color: c.soft });
    const wave = (fq, from, to) => { const pts = [], m = Math.ceil(A.w / 1.5); for (let i = 0; i <= m; i++) { const t = from + (to - from) * i / m; pts.push([X(t), Y(cosd(turnOf(fq) * t))]); } return pts; };
    pen.line(wave(f, -0.3, 8.3), c.soft, 1.3, [5, 4]);
    if (st.pinned) {
      pen.line(wave(st.pinned.stored, -0.3, 8.3), c.input, 1.6, [6, 4]);
      for (let n = 0; n <= 8; n++) pen.ring(X(n), Y(cosd(turnOf(st.pinned.f) * n)), 7, c.input, 1.5);
    }
    pen.line(wave(sf, -0.3, 8.3), c.accent, 2.2);
    for (let n = 0; n <= 8; n++) {
      const v = cosd(turn * n), x = X(n);
      pen.line([[x, Y(0)], [x, Y(v)]], c.ink, 1.8); pen.dot(x, Y(v), 4.5, c.ink);
      pen.text(n === 0 ? 'n = 0' : String(n), x, A.y + A.h + 18, { color: c.soft, size: 10 });
    }
  }

  function drawFix(s, st, view) {
    const { pen, c, w, h } = s, narrow = w < 560;
    const top = 8, bh = 34, names = narrow ? ['mic', 'sampler', 'stores'] : ['microphone', 'sampler', 'stores'];
    const bw = narrow ? (w - 24) / 5.2 : Math.min(130, w / 6);
    const boxes = [];
    const x0 = 8, gap = (w - 16 - 5 * bw) / 4;
    const order = ['mic', 'f1', 'sampler', 'f2', 'stores'];
    order.forEach((k, i) => boxes.push({ k, x: x0 + i * (bw + gap) }));
    boxes.forEach((b, i) => {
      const filled = (b.k === 'f1' && st.place === 'before') || (b.k === 'f2' && st.place === 'after');
      const label = b.k === 'mic' ? names[0] : b.k === 'sampler' ? names[1] : b.k === 'stores' ? names[2] : filled ? 'filter' : '';
      if (b.k.startsWith('f') && !filled) pen.line([[b.x, top + bh / 2], [b.x + bw, top + bh / 2]], c.soft, 1.2);
      else {
        s.ctx.fillStyle = filled ? c.inputSoft : c.paper2; s.ctx.fillRect(b.x, top, bw, bh);
        s.ctx.strokeStyle = filled ? c.input : c.ink; s.ctx.lineWidth = 1.5; s.ctx.strokeRect(b.x + 0.5, top + 0.5, bw - 1, bh - 1);
        pen.text(label, b.x + bw / 2, top + bh / 2 + 4, { color: c.ink, size: narrow ? 11 : 13, font: 'body', weight: 600 });
      }
      if (i < boxes.length - 1) { const x1 = b.x + bw, x2 = boxes[i + 1].x; pen.line([[x1 + 2, top + bh / 2], [x2 - 4, top + bh / 2]], c.soft, 1.2); pen.line([[x2 - 8, top + bh / 2 - 4], [x2 - 3, top + bh / 2], [x2 - 8, top + bh / 2 + 4]], c.soft, 1.2); }
    });

    const FMAX = 7500;
    const P = { x: 14, w: w - 28 };
    const X = f => P.x + f / FMAX * P.w;
    const strip = (y, hh, title) => {
      pen.text(title, P.x, y - 8, { align: 'left', color: c.ink, size: 13, font: 'body', weight: 600 });
      pen.line([[P.x, y + hh], [P.x + P.w, y + hh]], c.soft, 1);
      pen.line([[X(LIMIT), y - 2], [X(LIMIT), y + hh]], c.soft, 1, [4, 4]);
      const ticks = narrow ? [0, 2000, 3000, 4000, 6000] : [0, 1000, 2000, 3000, 3400, 4000, 5000, 6000, 7000];
      ticks.forEach(f => pen.text(f === 0 ? '0' : hz(f), X(f), y + hh + 14, { color: c.soft, size: 10 }));
      return { y, hh, Y: v => y + hh - v * (hh - 8) };
    };
    const hh = narrow ? 78 : 72;
    const S1 = strip(top + bh + 34, hh, 'reaches the sampler');
    const S2 = strip(S1.y + hh + (narrow ? 64 : 50), hh, 'what the phone stores');
    s.ctx.globalAlpha = 0.5; s.ctx.fillStyle = c.paper2; s.ctx.fillRect(X(LIMIT) + 1, S2.y, X(FMAX) - X(LIMIT) - 1, hh); s.ctx.globalAlpha = 1;
    pen.text(narrow ? 'never stored' : 'nothing is ever stored above 4,000 Hz', (X(LIMIT) + X(FMAX)) / 2, S2.Y(0.55), { color: c.soft, size: 10 });

    const voiceBand = (S, gf, lvl = 0.45) => {
      const pts = []; for (let f = 0; f <= VOICE_TOP; f += 25) pts.push([X(f), S.Y(lvl * gf(f))]);
      pts.push([X(VOICE_TOP), S.Y(0)]);
      s.ctx.fillStyle = c.paper2; s.ctx.beginPath(); s.ctx.moveTo(X(0), S.Y(0)); pts.forEach(([x, y]) => s.ctx.lineTo(x, y)); s.ctx.closePath(); s.ctx.fill();
      pen.line(pts, c.ink, 1.5);
    };
    const gBefore = f => (st.place === 'before' ? gainAt(st.cut, f) : 1), gAfter = f => (st.place === 'after' ? gainAt(st.cut, f) : 1);
    voiceBand(S1, gBefore);
    voiceBand(S2, f => gBefore(f) * gAfter(f));
    const spike = (S, f, v, color, label, ly, align = 'center') => {
      if (v > 0.005) { pen.line([[X(f), S.Y(0)], [X(f), S.Y(v)]], color, 3); pen.dot(X(f), S.Y(v), 3.5, color); }
      else pen.ring(X(f), S.Y(0) - 6, 5.5, c.soft, 1.2);
      if (label) {
        const lx = X(f) + (align === 'right' ? -4 : align === 'left' ? 4 : 0), ly2 = S.Y(Math.max(v, 0.12)) - ly;
        s.ctx.font = '400 10px "Geist Mono", ui-monospace, monospace'; const tw = s.ctx.measureText(label).width, x0 = align === 'right' ? lx - tw : align === 'left' ? lx : lx - tw / 2;
        pen.rect(x0 - 2, ly2 - 9, tw + 4, 12, c.paper);
      }
      if (label) pen.text(label, X(f) + (align === 'right' ? -4 : align === 'left' ? 4 : 0), S.Y(Math.max(v, 0.12)) - ly, { align, color: v > 0.005 ? (color === c.accent ? c.accentInk : c.ink) : c.soft, size: 10 });
    };
    view.extra.forEach((e, i) => {
      const lowF = view.extra.every(o => o.f >= e.f), lowA = view.extra.every(o => o.alias >= e.alias), short = e.name.split(' ').pop();
      spike(S1, e.f, e.reach * (0.75 - 0.2 * i), c.ink, narrow ? '' : `${e.name} ${hz(e.f)}`, 8, lowF ? 'right' : 'left');
      spike(S2, e.alias, e.kept * (0.95 - 0.2 * i), c.accent, narrow ? '' : `${e.name}’s alias`, 8, lowA ? 'right' : 'left');
    });
    if (narrow) {
      const by = arr => arr.slice().sort((a, b) => a[1] - b[1]).map(([n, f]) => `${n.split(' ').pop()} ${hz(f)}`).join(', ');
      pen.text(`true tones: ${by(view.extra.map(e => [e.name, e.f]))} Hz`, P.x, S1.y + hh + 30, { align: 'left', color: c.soft, size: 10 });
      pen.text(`stored as: ${by(view.extra.map(e => [e.name, e.alias]))} Hz`, P.x, S2.y + hh + 30, { align: 'left', color: c.soft, size: 10 });
    }
    const gain = (S, cut) => { pen.line([[X(0), S.Y(1)], [X(cut - SLOPE), S.Y(1)], [X(cut + SLOPE), S.Y(0)], [X(FMAX), S.Y(0)]], c.input, 2); pen.dot(X(cut), S.Y(0.5), 4, c.input); };
    if (st.place === 'before') gain(S1, st.cut);
    if (st.place === 'after') gain(S2, st.cut);
  }

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('tone-lab').content.cloneNode(true));
    const spare = document.createElement('div'), uid = `${host.id}-`, $ = k => host.querySelector(`[data-k="${k}"]`) || spare;
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    (explore ? ['task', 'place', 'cut-control', 'meter2', 'key-fix', 'another'] : ['tone-control', 'play-true', 'freeze', 'pin', 'key-explore']).forEach(k => host.querySelector(`[data-k="${k}"]`).remove());
    const st = { tone: 5000, unlocked: false, pinned: null, t: 0, frozen: false, animating: false, place: 'none', cut: 4800, caseIx: 0, solved: false };

    function fixView() {
      const g = f => gainAt(st.cut, f);
      const extra = CASES[st.caseIx].extra.map(e => {
        const alias = stored(e.f), reach = st.place === 'before' ? g(e.f) : 1, kept = reach * (st.place === 'after' ? g(alias) : 1);
        return { ...e, alias, reach, kept };
      });
      const voiceKept = st.place === 'none' ? 1 : g(VOICE_TOP);
      const passesTo = st.place === 'before' ? st.cut + SLOPE : null, leakTop = st.cut + SLOPE - 0.01 * 2 * SLOPE;
      return { extra, voiceKept, passesTo, leaksIntoVoice: st.place === 'before' && leakTop > FS - VOICE_TOP, worst: Math.max(...extra.map(e => e.kept)) };
    }

    const stage = K.stage($('stage'), s => (explore ? drawExplore(s, st) : drawFix(s, st, fixView())), {
      height: w => (explore ? (w < 560 ? 400 : 290) : (w < 560 ? 350 : 300)),
    });
    const loop = K.loop(host, dt => { st.t += dt; stage.redraw(); });
    const syncLoop = () => {
      st.animating = explore && !st.frozen && !K.reduced.matches;
      if (st.animating) loop.start(); else loop.stop();
      $('freeze').setAttribute('aria-pressed', String(st.frozen)); $('freeze').textContent = st.frozen ? 'Run the wheel' : 'Freeze the wheel';
      stage.redraw();
    };

    const trueAudio = K.player({ rate: 48000, gain: 0.3, onChange: () => updateAudioText() });
    const storeAudio = K.player({ rate: FS, gain: 0.3, onChange: () => updateAudioText() });
    const renderTrue = () => { const f = st.tone; return Float32Array.from({ length: 48000 }, (_, i) => (f === 0 ? 0 : 0.5 * Math.cos(2 * Math.PI * f * i / 48000))); };
    const renderStored = () => {
      if (explore) { const sf = stored(st.tone); return Float32Array.from({ length: FS }, (_, n) => (sf === 0 ? 0 : 0.5 * Math.cos(2 * Math.PI * st.tone * n / FS))); }
      const v = fixView(), voice = st.place === 'none' ? VOICE : voiceAt(st.cut), out = Float32Array.from(voice);
      v.extra.forEach(e => { if (e.kept > 0) for (let n = 0; n < out.length; n++) out[n] += e.kept * e.size * Math.cos(2 * Math.PI * e.f * n / FS); });
      const peak = out.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      return peak > 1 ? out.map(x => x / peak) : out;
    };
    function updateAudioText() {
      $('play-true').textContent = trueAudio.playing ? 'Stop the true tone' : 'Play the true tone';
      $('play').textContent = storeAudio.playing ? 'Stop' : 'Play what the phone stores';
      let t = 'Not playing.';
      if (trueAudio.playing) t = st.tone === 0 ? 'Playing the true tone: 0 Hz is a constant, so there is nothing to hear.' : `Playing the true tone, ${hz(st.tone)} Hz, as the sound in the room.`;
      if (storeAudio.playing) {
        if (explore) t = stored(st.tone) === 0 ? 'Playing what the phone stores: a constant, 0 Hz, so there is nothing to hear.' : `Playing what the phone stores, ${hz(stored(st.tone))} Hz, played back by the far end.`;
        else t = `Playing the stored call: ${st.place === 'none' ? 'no filter' : `filter ${st.place} the sampler, cutoff ${hz(st.cut)} Hz`}.`;
      }
      $('now').textContent = t;
    }

    function exploreWhy() {
      const f = st.tone, turn = turnOf(f), sf = stored(f);
      if (f === 0) return '0 Hz: the dot never moves, so every sample reads 1. The phone stores a constant, 0 Hz.';
      if (f < LIMIT) return `${hz(f)} Hz turns ${degText(turn)} per sample, less than half a turn. The short way round is the real way round, so the phone stores ${hz(f)} Hz, the true tone itself.`;
      if (f === LIMIT) return `4,000 Hz turns exactly 180° per sample: a flip, 1, ${MINUS}1, 1, ${MINUS}1. Half a turn forwards and half a turn backwards land on the same spot. This is where the stored tone stops climbing. It is also a knife edge: started at another moment, the same tone would store a smaller flip, or nothing at all (worked example 2).`;
      if (f < FS) return `${hz(f)} Hz turns ${degText(turn)} per sample, more than half a turn. Seen once per sample, that looks like ${degText(360 - turn)} backwards, which is just what ${hz(sf)} Hz turns. The phone stores ${hz(sf)} Hz, a tone that never went in.`;
      return '8,000 Hz turns 360°, a full turn: the dot lands back on the right every time, so every sample reads 1. The phone stores a constant, 0 Hz. A piercing true tone becomes no tone at all.';
    }
    function pinCompare() {
      const p = st.pinned, sf = stored(st.tone);
      if (p.f === st.tone) return `Pinned ${hz(p.f)} Hz, stored as ${hz(p.stored)} Hz. Move the slider to compare.`;
      const head = `Pinned ${hz(p.f)} Hz, stored as ${hz(p.stored)} Hz. Now ${hz(st.tone)} Hz, stored as ${hz(sf)} Hz.`;
      if (p.stored === sf) return `${head} Same stored tone, so the very same samples: every dot sits inside a teal ring, and nothing in the list can tell the two true tones apart.`;
      return `${head} Different stored tones, so different samples: the dots leave the teal rings.`;
    }

    function fixMessage(v) {
      const ex = v.extra, names = joinList(ex.map(e => `the ${e.name}`)), voicePct = pctText(v.voiceKept);
      const aliasList = joinList(ex.map(e => `${hz(e.alias)} Hz`));
      const keptOnes = ex.filter(e => e.kept > 0.01);
      st.solved = false;
      if (st.place === 'none') return `No filter. The phone stores ${joinList(ex.map(e => `the ${e.name} at ${hz(e.alias)} Hz`))}, both at 100%, among the voice’s own tones. Put a filter in the chain.`;
      if (st.place === 'after') {
        const keptTxt = joinList(keptOnes.map(e => `the ${e.name}’s alias at ${hz(e.alias)} Hz (${pctText(e.kept)})`));
        if (v.voiceKept >= 0.9) return `The voice keeps ${voicePct} of its top tone, but ${keptTxt} ${keptOnes.length > 1 ? 'are' : 'is'} still stored. After the sampler the aliases sit at ${aliasList}, among the voice’s own tones, where the filter has to keep everything.`;
        if (!keptOnes.length) return `After the sampler, this cutoff removes both aliases, but the voice’s 3,400 Hz tone keeps only ${voicePct}. By now the aliases sit at ${aliasList}, inside the voice, so a cutoff low enough to reach them cuts the voice too.`;
        return `After the sampler, this cutoff still keeps ${keptTxt}, and the voice’s 3,400 Hz tone keeps only ${voicePct}. The aliases are inside the voice: anywhere you cut, you lose voice, alias, or both.`;
      }
      if (v.voiceKept < 0.9) return `Before the sampler, nothing from this call folds into the voice, but your filter is already falling inside the voice: its 3,400 Hz tone keeps only ${voicePct}. Slide the cutoff up.`;
      if (keptOnes.length) return `${keptOnes.map(e => `The ${e.name} at ${hz(e.f)} Hz still gets through at ${pctText(e.kept)} and is stored at ${hz(e.alias)} Hz, inside the voice.`).join(' ')} Slide the cutoff down.`;
      if (v.leaksIntoVoice) return `Nothing in this call gets through, but the slope of your filter still lets true tones through up to ${hz(v.passesTo)} Hz, and anything between 4,600 and ${hz(v.passesTo)} Hz would fold into the voice band, below 3,400 Hz. Slide the cutoff down a little.`;
      st.solved = true;
      const tail = `the voice keeps ${voicePct} of its top tone, and whatever the slope lets through above 4,000 Hz folds above 3,400 Hz, out of the voice band.`;
      if (st.caseIx === 0) return `Fixed. The whistle and the squeal are removed before the sampler, while they are still 5,000 and 4,600 Hz, so neither alias is stored; ${tail} The clinic gets honest silence at 5,000 Hz instead of a lie.`;
      return `Fixed. ${names[0].toUpperCase()}${names.slice(1)} are removed before they can fold; ${tail}`;
    }

    function render() {
      if (explore) {
        const f = st.tone, sf = stored(f);
        $('tone').value = f; $('tone-out').textContent = `${hz(f)} Hz`;
        $('tone').disabled = !st.unlocked; $('pin').disabled = !st.unlocked;
        $('result').textContent = `True tone ${hz(f)} Hz · ${degText(turnOf(f))} per sample · stored as `;
        const sp = document.createElement('span'); sp.className = sf !== f ? 'changed' : ''; sp.textContent = `${hz(sf)} Hz`;
        $('result').append(sp);
        $('why').textContent = st.unlocked ? exploreWhy() : `${exploreWhy()} Answer the three questions above to unlock the slider.`;
        K.meter($('meter'), sf, { max: LIMIT, text: `${hz(sf)} Hz` });
        $('compare').hidden = !st.pinned; $('key-pin').hidden = !st.pinned;
        if (st.pinned) $('compare').textContent = pinCompare();
        const list = Array.from({ length: 9 }, (_, n) => num(cosd(turnOf(f) * n))).join(', ');
        $('stage').setAttribute('aria-label', `Left, the wheel: ${hz(f)} Hz turns ${degText(turnOf(f))} per sample. Right, the true tone with its nine samples, ${list}, and the ${hz(sf)} Hz tone the phone stores passing through them.`);
      } else {
        const v = fixView();
        $('task-text').textContent = CASES[st.caseIx].text;
        host.querySelectorAll('[data-place]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.place === st.place)); b.disabled = !st.unlocked; });
        $('cut').value = st.cut; $('cut-out').textContent = `${hz(st.cut)} Hz`;
        $('cut').disabled = !st.unlocked || st.place === 'none';
        const place = st.place === 'none' ? 'No filter' : `Filter ${st.place} the sampler, cutoff ${hz(st.cut)} Hz`;
        $('result').textContent = `${place} · `;
        const sp = document.createElement('span'); sp.className = v.worst > 0.01 || v.voiceKept < 0.9 || v.leaksIntoVoice ? 'changed' : '';
        sp.textContent = `voice’s 3,400 Hz tone ${pctText(v.voiceKept)} · ${v.extra.map(e => `${e.name}’s alias ${pctText(e.kept)}`).join(' · ')}${v.passesTo ? ` · the slope lets a little through up to ${hz(v.passesTo)} Hz` : ''}`;
        $('result').append(sp);
        $('why').textContent = st.unlocked ? fixMessage(v) : 'Answer the question above to unlock the filter.';
        K.meter($('meter'), v.worst, { max: 1 });
        K.meter($('meter2'), v.voiceKept, { max: 1 });
        $('another').hidden = !st.solved;
        if (st.solved && st.caseIx === 0) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
        $('stage').setAttribute('aria-label', `The chain: microphone, ${st.place === 'before' ? 'filter, ' : ''}sampler, ${st.place === 'after' ? 'filter, ' : ''}stores. Stored: ${v.extra.map(e => `${e.name}'s alias at ${hz(e.alias)} Hz, ${pctText(e.kept)}`).join(', ')}; the voice's 3,400 Hz tone at ${pctText(v.voiceKept)}.`);
      }
      stage.redraw();
      if (trueAudio.playing) trueAudio.refresh();
      if (storeAudio.playing) storeAudio.refresh();
      updateAudioText();
    }

    function buildAsks() {
      const root = $('ask');
      root.replaceChildren();
      if (explore) {
        const qs = [document.createElement('div'), document.createElement('div'), document.createElement('div')];
        root.append(qs[0]);
        const show = f => { st.tone = f; st.t = 0; render(); };
        const third = () => K.ask(qs[2], {
          question: 'Last one: a 7,800 Hz true tone, just short of a full turn per sample. What does the phone store?',
          options: [['7800', '7,800 Hz'], ['3800', '3,800 Hz'], ['200', '200 Hz, a low hum']], right: '200',
          hints: { 7800: '7,800 Hz turns 351° per sample, far more than half a turn. The phone cannot store it as itself. How far short of a full turn is 351°?', 3800: '3,800 Hz turns 171°. 7,800 Hz turns 351°, only 9° short of a full turn: which tone turns 9° per sample?' },
          explain: '7,800 Hz turns 351°, which is 9° short of a full turn, so it looks like 9° backwards: the turn of 200 Hz (9 ÷ 45 × 1,000), a slow, low hum. The slider is yours now. Drag it from 0 to 8,000 Hz; the meter shows the stored tone.',
          onSolved: () => { st.unlocked = true; show(7800); document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act1' })); }, focusAfter: () => $('tone'),
        });
        const second = () => K.ask(qs[1], {
          question: 'Next: what does a 7,000 Hz true tone get stored as?',
          options: [['7000', '7,000 Hz'], ['3000', '3,000 Hz'], ['1000', '1,000 Hz']], right: '1000',
          hints: { 7000: '7,000 Hz turns 315° per sample, more than half a turn. How far short of a full turn is that?', 3000: '3,000 Hz turns 135°. 7,000 Hz turns 315°, only 45° short of a full turn: which tone turns 45°?' },
          explain: '7,000 Hz turns 315°, which is 45° short of a full turn, so it looks like 45° backwards: the turn of 1,000 Hz.',
          onSolved: () => { show(7000); root.append(qs[2]); third(); }, focusAfter: () => qs[2].querySelector('button'),
        });
        K.ask(qs[0], {
          question: 'Before you drag anything: what does a 4,500 Hz true tone get stored as?',
          options: [['4500', '4,500 Hz'], ['3500', '3,500 Hz'], ['500', '500 Hz']], right: '3500',
          hints: { 4500: '4,500 Hz turns 202.5° per sample, more than half a turn. Does a sample see it go the long way round?', 500: '500 Hz turns only 22.5°. 4,500 Hz turns 202.5°, which is 157.5° short of a full turn: which tone turns 157.5°?' },
          explain: '4,500 Hz turns 202.5°, which looks like 157.5° backwards. 157.5° is the turn of 3,500 Hz (157.5 ÷ 45 × 1,000).',
          onSolved: () => { show(4500); root.append(qs[1]); second(); }, focusAfter: () => qs[1].querySelector('button'),
        });
        return;
      }
      if (st.caseIx !== 0) { st.unlocked = true; return; }
      K.ask(root, {
        question: 'Before you touch the filter: suppose the fan wears further and its squeal rises to 4,900 Hz. Where would the phone store it?',
        options: [['4900', '4,900 Hz, unchanged'], ['3100', '3,100 Hz'], ['900', '900 Hz']], right: '3100',
        hints: { 4900: '4,900 Hz is above the limit, so the phone cannot store it as itself. How far above 4,000 Hz is it?', 900: '900 Hz is how far above the limit the squeal would sit. Fold: it lands that far below 4,000 Hz.' },
        explain: '4,900 Hz sits 900 above the limit, so it folds to 900 below: 3,100 Hz, inside the voice. Today’s squeal at 4,600 Hz folds the same way, to 3,400 Hz, and the whistle to 3,000 Hz. Now place the filter.',
        onSolved: () => { st.unlocked = true; render(); },
        focusAfter: () => host.querySelector('[data-place="after"]'),
      });
    }

    if (!explore) {
      ['task', 'cut-control', 'place', 'meter2', 'key-fix'].forEach(k => { $(k).hidden = false; });
      $('meter-name').textContent = 'Loudest alias stored'; $('meter-lo').textContent = '0%'; $('meter-hi').textContent = '100%';
    }
    if (K.reduced.matches) $('freeze').hidden = true;
    buildAsks();

    $('tone').addEventListener('input', () => { st.tone = Number($('tone').value); st.t = 0; render(); });
    $('pin').addEventListener('click', () => { st.pinned = { f: st.tone, stored: stored(st.tone) }; render(); });
    $('freeze').addEventListener('click', () => { st.frozen = !st.frozen; syncLoop(); });
    $('play-true').addEventListener('click', () => { if (trueAudio.playing) trueAudio.stop(); else { storeAudio.stop(); trueAudio.play(renderTrue); } });
    $('play').addEventListener('click', () => { if (storeAudio.playing) storeAudio.stop(); else { trueAudio.stop(); storeAudio.play(renderStored); } });
    host.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { st.place = b.dataset.place; render(); }));
    $('cut').addEventListener('input', () => { st.cut = Number($('cut').value); render(); });
    $('another').addEventListener('click', () => {
      storeAudio.stop(); st.caseIx = (st.caseIx % (CASES.length - 1)) + 1;
      Object.assign(st, { place: 'none', cut: 4800, solved: false }); buildAsks(); render(); host.querySelector('[data-place="after"]').focus();
    });
    $('reset').addEventListener('click', () => {
      trueAudio.stop(); storeAudio.stop();
      if (explore) Object.assign(st, { tone: st.unlocked ? 5000 : st.tone, pinned: null, t: 0, frozen: false });
      else Object.assign(st, { place: 'none', cut: 4800, solved: false });
      syncLoop(); render(); $('reset').focus();
    });
    K.reduced.addEventListener('change', () => { $('freeze').hidden = K.reduced.matches; syncLoop(); });
    syncLoop();
    render();
    return { stop: () => { trueAudio.stop(); storeAudio.stop(); } };
  }

  const act1 = mount(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const holder = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    holder.replaceChildren(host);
    mount(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });

  K.ask(document.getElementById('ask-list'), {
    question: 'Your guess: could two different true tones ever hand the phone the same list?',
    options: [['never', 'No, a list pins down one tone'], ['loud', 'Only if one is much louder'], ['yes', 'Yes, they can']], right: 'yes',
    hints: { never: 'The phone sees nothing between samples. Could two waves disagree only in the gaps?', loud: 'A louder tone gives bigger samples, so its list differs. Think about pitch instead: could two pitches meet at every sample?' },
    explain: 'Two tones that agree at every sample and differ only in the gaps give the same list, and the phone never sees the gaps. The next table shows a pair.',
  });
  K.ask(document.getElementById('ask-fold'), {
    question: 'The strip stops at 8,000 Hz. Where would a 10,000 Hz true tone be stored?',
    options: [['10000', '10,000 Hz'], ['6000', '6,000 Hz'], ['2000', '2,000 Hz']], right: '2000',
    hints: { 10000: 'Nothing above 4,000 Hz is stored as itself. 10,000 Hz turns 450° per sample: what does a full turn of that change?', 6000: '6,000 Hz is still above the limit, so it cannot be stored either. 10,000 Hz turns 450°: take off the full turn, 360°, and see which tone is left.' },
    explain: '10,000 Hz turns 450° per sample. A full turn changes nothing, so take 360° off: 90° per sample, the turn of 2,000 Hz.',
  });

  const hints = [...document.querySelectorAll('.table, .display-math')].map(box => {
    const p = document.createElement('p'); p.className = 'scroll-hint'; p.textContent = 'Swipe or scroll sideways to see all of it.'; p.hidden = true;
    box.after(p);
    return () => { p.hidden = box.scrollWidth <= box.clientWidth + 1; };
  });
  const syncHints = () => hints.forEach(f => f());
  addEventListener('resize', syncHints);
  syncHints();
})();
