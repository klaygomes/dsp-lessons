(() => {
  const K = window.Kit, FS = 8000, MINUS = K.MINUS, hz = K.hz;
  const $ = id => document.getElementById(id);
  const signed = (v, s) => `${v > 0 ? '+' : v < 0 ? MINUS : ''}${s}`;
  const sgnHz = f => signed(f, `${hz(Math.abs(f))} Hz`);
  const turnOf = f => 360 * f / FS;
  const degText = d => signed(d, `${Number((Math.abs(d)).toFixed(1)).toLocaleString('en-US')}°`);
  const pctText = v => (!isFinite(v) || v >= 10 ? 'over 1,000%' : v >= 0.1 ? `${Math.round(v * 100).toLocaleString('en-US')}%` : `${(v * 100).toFixed(2)}%`);

  const hann = (n, D) => 0.5 + 0.5 * Math.cos(Math.PI * n / (D + 1));
  function taps(N, win) {
    const D = (N - 1) / 2, out = [];
    for (let k = 0; k < N; k++) { const n = k - D; if (n % 2) out.push([k, 2 / (Math.PI * n) * (win ? hann(n, D) : 1)]); }
    return out;
  }
  function gain(N, win, f) {
    const D = (N - 1) / 2, w = 2 * Math.PI * f / FS;
    let s = 0;
    for (let n = 1; n <= D; n += 2) s += 4 / (Math.PI * n) * (win ? hann(n, D) : 1) * Math.sin(w * n);
    return s;
  }
  function ghostAt(N, win, d, f) {
    const G = gain(N, win, f), th = 2 * Math.PI * f / FS * ((N - 1) / 2 - d);
    const den = Math.hypot(1 + G * Math.cos(th), G * Math.sin(th));
    return den < 1e-9 ? Infinity : Math.hypot(1 - G * Math.cos(th), G * Math.sin(th)) / den;
  }
  function worst(N, win, d, lo, hi) {
    let best = { v: -1, f: lo };
    for (let f = lo; f <= hi; f += 5) { const v = ghostAt(N, win, d, f); if (v > best.v) best = { v, f }; }
    return best;
  }

  const RAW = K.wav(window.LESSON_CALL);
  const RAW_PEAK = RAW.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6);
  const VOICE = Float32Array.from({ length: RAW.length + FS / 4 }, (_, i) => (i < RAW.length ? RAW[i] / RAW_PEAK : 0));
  function fir(x, list) {
    const y = new Float32Array(x.length);
    for (let n = 0; n < x.length; n++) { let s = 0; for (const [k, h] of list) { const i = n - k; if (i >= 0) s += h * x[i]; } y[n] = s; }
    return y;
  }
  function ssb(x, N, win, d, shift) {
    const xh = fir(x, taps(N, win)), w = 2 * Math.PI * shift / FS;
    return x.map((_, n) => (n - d >= 0 ? x[n - d] : 0) * Math.cos(w * n) - xh[n] * Math.sin(w * n));
  }
  const plainMul = (x, shift) => { const w = 2 * Math.PI * shift / FS; return x.map((v, n) => v * Math.cos(w * n)); };
  const level = x => { const p = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0); return p > 0.9 ? x.map(v => v * 0.9 / p) : x; };

  function arrowTo(ctx, x0, y0, x1, y1, color, { dotted = false, open = false, width = 2.2, alpha = 1 } = {}) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 2) return;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, hl = Math.min(10, len * 0.45), hw = hl * 0.5;
    const bx = x1 - ux * hl, by = y1 - uy * hl;
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.setLineDash(dotted ? [0.5, 5] : []);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(bx - uy * hw, by + ux * hw); ctx.lineTo(bx + uy * hw, by - ux * hw); ctx.closePath();
    if (open) { ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paper'); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
    ctx.restore();
  }
  function hatchRect(ctx, x, y, w, h, c) {
    ctx.save(); ctx.fillStyle = c.accentSoft; ctx.fillRect(x, y, w, h);
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 1.5;
    for (let i = -h; i < w + h; i += 6) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = c.accent; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
  }
  function outlineRect(ctx, x, y, w, h, color, dash = [5, 3]) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash(dash); ctx.strokeRect(x, y, w, h); ctx.restore();
  }

  K.ask($('predict-split'), {
    question: 'It isn’t a 1,300 Hz tone. So what is the product?',
    options: [['small1300', 'A smaller 1,300 Hz tone'], ['half', 'Half a 1,300 Hz tone plus half a 700 Hz tone'], ['700', 'A 700 Hz tone'], ['small1000', 'A smaller 1,000 Hz tone, not moved at all']],
    right: 'half',
    hints: {
      small1300: 'A 1,300 Hz tone turns 58.5° per sample. At sample 2 it sits at cos 117°, not 0, but the product is 0.000 there.',
      '700': 'A 700 Hz tone turns 31.5° per sample. At sample 2 it sits at cos 63° = 0.454, but the product is 0.000 there.',
      small1000: 'A smaller 1,000 Hz tone keeps its shape: its sample 4 would be minus its sample 0. The product has 1.000 at 0 and −0.588 at 4.',
    },
    explain: 'Half of a 1,300 Hz tone plus half of a 700 Hz tone matches the product at every sample. Here it is, tested.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-split' })),
  });

  K.ask($('predict-one-arrow'), {
    question: 'A perfect multiplier, one arrow turning +300 Hz with no mirror. Is the ghost gone?',
    options: [['gone', 'Yes: no mirror in the multiplier, no ghost'], ['stays', 'No: the ghost is still there'], ['moves', 'It moves up, to 1,300 Hz']],
    right: 'stays',
    hints: {
      gone: 'The multiplier has no mirror, but the call does. What does +13.5° per sample do to the call’s own mirror arrow, which turns −45° per sample?',
      moves: 'Add +13.5° to the mirror arrow’s −45° per sample. Which way does it turn then, and how fast?',
    },
    explain: 'The call’s own mirror arrow turns −45° per sample. The shift adds +13.5°, so it slows to −31.5°, −700 Hz, and its shadow sounds at 700 Hz. Read on.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-one-arrow' })),
  });

  const a1 = { revealed: false, tone: 1000, shift: 300, mode: 'tone', src: 'tone', raw: false, paused: false, pinned: null, t: 1 };
  const MODE_NAME = { tone: 'a 300 Hz tone', arrow: 'one arrow', analytic: 'no mirror arrows' };

  function outputs() {
    const f = a1.tone, s = a1.shift;
    if (a1.mode === 'analytic') return { arrows: [{ F: f + s, size: 1, mirror: false, ghost: false }], bars: [{ f: Math.abs(f + s), size: 1, kind: 'wanted' }] };
    const arrows = a1.mode === 'tone'
      ? [{ F: f + s, size: 0.25, mirror: false, ghost: false }, { F: f - s, size: 0.25, mirror: false, ghost: true }, { F: -f + s, size: 0.25, mirror: true, ghost: true }, { F: -f - s, size: 0.25, mirror: true, ghost: false }]
      : [{ F: f + s, size: 0.5, mirror: false, ghost: false }, { F: -f + s, size: 0.5, mirror: true, ghost: true }];
    if (s === 0) return { arrows, bars: [{ f, size: 1, kind: 'both' }] };
    return { arrows, bars: [{ f: Math.abs(f + s), size: 0.5, kind: 'wanted' }, { f: Math.abs(f - s), size: 0.5, kind: 'ghost' }] };
  }

  const reducedNow = () => K.reduced.matches;
  const stage1 = K.stage($('a1-stage'), s => {
    const { ctx, c, w, h } = s, phone = w < 560, o = outputs();
    const still = reducedNow() || a1.paused;
    const t = still ? 1 : a1.t;
    const R = phone ? Math.min(100, w / 2 - 34) : Math.min(116, h / 2 - 34);
    const cx = phone ? w / 2 : R + 36, cy = phone ? R + 34 : h / 2;
    s.pen.line([[cx - R - 14, cy], [cx + R + 14, cy]], c.soft, 1);
    s.pen.ring(cx, cy, R, c.soft, 1);
    const at = (F, len) => { const a = turnOf(F) * t * Math.PI / 180; return [cx + len * R * Math.cos(a), cy - len * R * Math.sin(a)]; };
    const callA = turnOf(a1.tone) * t * Math.PI / 180;
    arrowTo(ctx, cx, cy, cx + 0.5 * R * Math.cos(callA), cy - 0.5 * R * Math.sin(callA), c.soft, { width: 1.4, alpha: 0.9 });
    arrowTo(ctx, cx, cy, cx + 0.5 * R * Math.cos(callA), cy + 0.5 * R * Math.sin(callA), c.soft, { width: 1.4, dotted: true, open: true, alpha: 0.9 });
    s.pen.text('thin: the call’s own arrows', cx, cy + R + 26, { color: c.soft, size: 11 });
    if (a1.revealed) {
      o.arrows.forEach(a => {
        const [x, y] = at(a.F, a.size);
        if (still) {
          const r0 = 16 + (a.mirror ? 6 : 0), end = turnOf(a.F) * Math.PI / 180;
          if (Math.abs(end) > 0.02) { ctx.save(); ctx.strokeStyle = a.ghost ? c.accent : c.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r0, 0, -end, end > 0); ctx.stroke(); ctx.restore(); }
        }
        arrowTo(ctx, cx, cy, x, y, a.ghost ? c.accent : c.ink, { dotted: a.mirror, open: a.mirror, width: 2.4 });
      });
    }
    const S = phone ? { x: 34, y: 2 * R + 92, w: w - 52, h: h - 2 * R - 140 } : { x: 2 * R + 96, y: 34, w: w - 2 * R - 116, h: h - 82 };
    const X = f => S.x + f / 4000 * S.w, Y = v => S.y + S.h - v / 1.15 * S.h, bw = 12;
    s.pen.line([[S.x, S.y + S.h], [S.x + S.w, S.y + S.h]], c.soft, 1);
    [0, 1000, 2000, 3000, 4000].forEach(f => s.pen.text(hz(f), X(f), S.y + S.h + 16, { color: c.soft, size: 10 }));
    s.pen.text('Hz', S.x + S.w, S.y + S.h + 30, { align: 'right', color: c.soft, size: 10 });
    s.pen.text('what the line carries, 0 to 4,000 Hz', S.x, S.y - 14, { align: 'left', color: c.ink, size: 13, font: 'body', weight: 600 });
    outlineRect(ctx, X(a1.tone) - bw / 2, Y(1), bw, Y(0) - Y(1), c.soft);
    if (a1.pinned) a1.pinned.bars.forEach(b => outlineRect(ctx, X(b.f) - bw / 2 - 3, Y(b.size) - 3, bw + 6, Y(0) - Y(b.size) + 3, c.input, [3, 3]));
    if (!a1.revealed) { s.pen.text('call tone', X(a1.tone), Y(1) - 8, { color: c.soft, size: 11 }); return; }
    const labels = [];
    o.bars.forEach(b => {
      const x = X(b.f) - bw / 2;
      if (b.kind === 'ghost') hatchRect(ctx, x, Y(b.size), bw, Y(0) - Y(b.size), c);
      else s.pen.rect(x, Y(b.size), bw, Y(0) - Y(b.size), c.ink);
      labels.push({ x: X(b.f), y: Y(b.size) - 8, s: b.kind === 'ghost' ? `ghost ${hz(b.f)}` : b.kind === 'both' ? `${hz(b.f)}, no shift` : `wanted ${hz(b.f)}`, color: b.kind === 'ghost' ? c.accentInk : c.ink });
    });
    labels.push({ x: X(a1.tone), y: Y(1) - 8, s: 'call tone', color: c.soft });
    labels.sort((p, q) => p.x - q.x);
    labels.forEach((l, i) => {
      const width = l.s.length * 6.6, prev = labels[i - 1];
      if (prev && Math.abs(prev.x - l.x) < (width + prev.s.length * 6.6) / 2 + 6 && Math.abs(prev.y - l.y) < 16) l.y = prev.y - 16;
      const x = Math.max(S.x + width / 2, Math.min(S.x + S.w - width / 2, l.x));
      s.pen.text(l.s, x, l.y, { color: l.color, size: 11 });
    });
  }, { height: w => (w < 560 ? 470 : 300) });

  const loop1 = K.loop($('lab'), dt => { a1.t += dt * 1.2; stage1.redraw(); });

  function a1Why() {
    const f = a1.tone, s = a1.shift, top = turnOf(f + s), mir = turnOf(-f + s), end = Math.abs(s) === 500 ? ' That is the slider’s end.' : '';
    if (a1.mode === 'analytic') return `No mirror arrows: only the call’s top arrow is left, now turning ${degText(top)} per sample, ${sgnHz(f + s)}. One copy, ${s === 0 ? 'unshifted' : `${hz(Math.abs(s))} Hz ${s > 0 ? 'up' : 'down'}`}, and no ghost. This is the analytic signal; the next section builds it.${end}`;
    const inside = a1.mode === 'tone' ? 'Inside the chip there are four quarter-size arrows here; with one arrow there would be two half-size ones. Their shadows are the same.' : 'Inside the chip there are two half-size arrows; a tone multiplier would make four quarter-size ones. Their shadows are the same.';
    if (s === 0) return `No shift: multiplying by a 0 Hz tone, the number 1, changes nothing. Both copies land on the call tone and add back up. ${inside}`;
    if (s > 0 && s < f) return `The top arrow speeds up to ${degText(top)} per sample, ${sgnHz(f + s)}: the wanted copy. The mirror arrow slows from ${degText(turnOf(-f))} to ${degText(mir)}, ${sgnHz(s - f)}, and its shadow, the ghost, sounds at ${hz(f - s)} Hz, ${hz(s)} Hz below the call. ${inside}${end}`;
    if (s === f) return `The mirror arrow stops dead: ${sgnHz(-f)} plus ${hz(s)} Hz is 0 Hz. Its shadow never moves, so the ghost is a 0 Hz tone, a steady offset. ${inside}${end}`;
    if (s > f) return `The mirror arrow slowed right through zero and now turns counter-clockwise, ${degText(mir)} per sample, ${sgnHz(s - f)}. Its shadow still sounds: the ghost is at ${hz(s - f)} Hz. ${inside}${end}`;
    return `A negative shift turns every arrow clockwise. The top arrow now turns ${degText(top)} per sample, ${sgnHz(f + s)}: the wanted copy, ${hz(-s)} Hz down. The mirror speeds up to ${degText(mir)}, ${sgnHz(s - f)}, so the ghost now sits above the call, at ${hz(f - s)} Hz. ${inside}${end}`;
  }
  function a1Compare() {
    const p = a1.pinned, o = outputs(), name = q => `${MODE_NAME[q.mode]}, shift ${sgnHz(q.shift)} on ${hz(q.tone)} Hz`;
    const ghostOf = bars => bars.find(b => b.kind === 'ghost');
    const pg = ghostOf(p.bars), ng = ghostOf(o.bars);
    let tail;
    if (p.tone === a1.tone && p.shift === a1.shift && p.mode !== a1.mode && p.mode !== 'analytic' && a1.mode !== 'analytic') tail = 'Same two shadows either way: on the line, one arrow and a tone multiplier are the same.';
    else if (!ng && pg) tail = 'Now no ghost at all: with the mirror arrows gone, nothing slows down.';
    else if (ng && !pg) tail = p.mode === 'analytic' ? 'The ghost is back: the mirror arrows are back.' : 'The ghost appeared because the shift moved off zero.';
    else if (ng && pg && p.tone === a1.tone) tail = `The ghost moved from ${hz(pg.f)} to ${hz(ng.f)} Hz as the wanted copy moved the other way: they always sit either side of the call tone, ${hz(Math.abs(2 * a1.shift))} Hz apart now.`;
    else tail = 'A different call tone: the wanted copy and the ghost always sit the shift above and below it.';
    if (p.tone === a1.tone && p.shift === a1.shift && p.mode === a1.mode) return `Pinned: ${name(p)}. Move a control to compare.`;
    return `Pinned: ${name(p)}. Now: ${name(a1)}. ${tail}`;
  }
  function a1Render() {
    const o = outputs();
    $('a1-tone').value = a1.tone; $('a1-tone-out').textContent = `${hz(a1.tone)} Hz`;
    $('a1-shift').value = a1.shift; $('a1-shift-out').textContent = sgnHz(a1.shift);
    ['a1-tone', 'a1-shift', 'a1-play', 'a1-raw', 'a1-pin'].forEach(id => { $(id).disabled = !a1.revealed; });
    document.querySelectorAll('[data-mode]').forEach(b => { b.disabled = !a1.revealed; b.setAttribute('aria-pressed', String(b.dataset.mode === a1.mode)); });
    document.querySelectorAll('[data-src]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.src === a1.src)));
    $('a1-raw').setAttribute('aria-pressed', String(a1.raw));
    $('a1-pause').setAttribute('aria-pressed', String(a1.paused));
    $('a1-pause').hidden = reducedNow();
    const res = $('a1-result');
    if (!a1.revealed) {
      res.textContent = `${hz(a1.tone)} Hz call tone · shift ${sgnHz(a1.shift)}`;
      $('a1-why').textContent = 'Answer the question above to switch the multiplier on.';
    } else {
      const wanted = o.bars.find(b => b.kind !== 'ghost'), ghost = o.bars.find(b => b.kind === 'ghost');
      res.textContent = `${hz(a1.tone)} Hz × ${MODE_NAME[a1.mode]} · wanted ${hz(wanted.f)} Hz · `;
      const sp = document.createElement('span'); sp.className = ghost ? 'changed' : ''; sp.textContent = ghost ? `ghost ${hz(ghost.f)} Hz` : 'no ghost';
      res.append(sp);
      $('a1-why').textContent = a1Why();
    }
    $('a1-compare').hidden = !a1.pinned; $('a1-key-pin').hidden = !a1.pinned;
    if (a1.pinned) $('a1-compare').textContent = a1Compare();
    $('a1-stage').setAttribute('aria-label', a1.revealed
      ? `The ${hz(a1.tone)} Hz call times ${MODE_NAME[a1.mode]}, shift ${sgnHz(a1.shift)}. ${o.bars.map(b => `${b.kind === 'ghost' ? 'ghost' : 'wanted copy'} at ${hz(b.f)} Hz`).join(', ')}.`
      : `The ${hz(a1.tone)} Hz call tone and its two arrows.`);
    if (a1.revealed && !reducedNow() && !a1.paused) loop1.start(); else loop1.stop();
    stage1.redraw();
    if (audio1.playing) audio1.refresh();
    $('a1-now').textContent = now1();
  }
  function render1() {
    let x;
    if (a1.src === 'voice') {
      if (a1.raw) x = VOICE;
      else if (a1.mode === 'analytic') x = ssb(VOICE, 63, true, 31, a1.shift);
      else x = plainMul(VOICE, a1.shift);
    } else {
      const wf = 2 * Math.PI * a1.tone / FS, ws = 2 * Math.PI * a1.shift / FS;
      x = Float32Array.from({ length: FS }, (_, n) => (a1.raw ? Math.cos(wf * n) : a1.mode === 'analytic' ? Math.cos((wf + ws) * n) : Math.cos(wf * n) * Math.cos(ws * n)));
    }
    return level(x);
  }
  function now1() {
    if (!audio1.playing) return 'Not playing.';
    const what = a1.src === 'voice' ? 'the recorded voice' : `the ${hz(a1.tone)} Hz tone`;
    if (a1.raw) return `Playing ${what}, unshifted.`;
    if (a1.mode === 'analytic') return `Playing ${what} shifted ${sgnHz(a1.shift)} with the mirror arrows removed: one copy, no ghost.`;
    return `Playing ${what} times ${MODE_NAME[a1.mode]} (${sgnHz(a1.shift)}): ${a1.shift === 0 ? 'unchanged' : 'listen for two copies, the wanted one and the ghost'}.`;
  }
  const audio1 = K.player({ rate: FS, gain: 0.3, onChange: on => { $('a1-play').textContent = on ? 'Stop' : 'Play'; $('a1-now').textContent = now1(); } });

  K.ask($('a1-ask'), {
    question: 'Shift the 1,000 Hz tone down instead, by −300 Hz. Where does the ghost land?',
    options: [['700', 'At 700 Hz'], ['1300', 'At 1,300 Hz'], ['none', 'Nowhere: shifting down makes no ghost'], ['400', 'At 400 Hz']],
    right: '1300',
    hints: {
      '700': '700 Hz is where the top arrow goes: 45° minus 13.5° per sample. Follow the mirror arrow instead, at −45° per sample.',
      none: 'The call still carries its mirror arrows, whichever way you shift. What does −13.5° per sample do to −45°?',
      '400': 'Each copy moves by the shift once, not twice. Follow the mirror arrow: −45° per sample, then 13.5° more clockwise.',
    },
    explain: 'A shift of −300 Hz turns every arrow 13.5° per sample further clockwise. The top arrow slows to +31.5°, the wanted copy at 700 Hz. The mirror arrow speeds up to −58.5°, −1,300 Hz, and its shadow sounds at 1,300 Hz: the ghost is now above. The controls are yours.',
    onSolved: () => { a1.revealed = true; a1.shift = -300; a1Render(); },
    focusAfter: () => $('a1-shift'),
  });

  $('a1-tone').addEventListener('input', () => { a1.tone = Number($('a1-tone').value); a1Render(); });
  $('a1-shift').addEventListener('input', () => { a1.shift = Number($('a1-shift').value); a1Render(); });
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { a1.mode = b.dataset.mode; a1Render(); }));
  document.querySelectorAll('[data-src]').forEach(b => b.addEventListener('click', () => { a1.src = b.dataset.src; a1Render(); }));
  $('a1-raw').addEventListener('click', () => { a1.raw = !a1.raw; a1Render(); });
  $('a1-pause').addEventListener('click', () => { a1.paused = !a1.paused; a1Render(); });
  $('a1-pin').addEventListener('click', () => { a1.pinned = { tone: a1.tone, shift: a1.shift, mode: a1.mode, bars: outputs().bars }; a1Render(); });
  $('a1-play').addEventListener('click', () => (audio1.playing ? audio1.stop() : audio1.play(render1)));
  $('a1-reset').addEventListener('click', () => {
    audio1.stop();
    Object.assign(a1, { tone: 1000, shift: a1.revealed ? -300 : 300, mode: 'tone', raw: false, pinned: null, paused: false, t: 1 });
    a1Render(); $('a1-reset').focus();
  });
  K.reduced.addEventListener('change', a1Render);
  a1Render();

  const CASES = [
    { text: 'The tip line: shift every caller up 300 Hz, and keep the ghost under 5% of the wanted copy for every tone from 300 to 3,400 Hz. Use the shortest Hilbert transformer that does it: every coefficient adds delay.', shift: 300, lo: 300, hi: 3400, target: 0.05, start: { N: 31, win: true, d: 0, s: 300 } },
    { text: 'The newsroom wants a cleaner disguise for its star source: still 300 Hz up, but the ghost must stay under 2% from 300 to 3,400 Hz. Shortest Hilbert transformer that does it.', shift: 300, lo: 300, hi: 3400, target: 0.02, start: { N: 31, win: true, d: 15, s: 0 } },
    { text: 'A community radio phone-in: good handsets reach down to 250 Hz. Shift the callers down 200 Hz, with the ghost under 3% from 250 to 3,400 Hz.', shift: -200, lo: 250, hi: 3400, target: 0.03, start: { N: 31, win: true, d: 15, s: 0 } },
    { text: 'An old exchange whose lines carry nothing below 400 Hz: shift up 450 Hz, with the ghost under 5% from 400 to 3,400 Hz.', shift: 450, lo: 400, hi: 3400, target: 0.05, start: { N: 31, win: true, d: 15, s: 0 } },
    { text: 'A radio studio line that reaches down to 200 Hz: shift up 250 Hz, with the ghost under 5% from 200 to 3,400 Hz.', shift: 250, lo: 200, hi: 3400, target: 0.05, start: { N: 31, win: true, d: 15, s: 0 } },
  ];
  const shortestFor = c => { for (let N = 7; N <= 63; N += 4) if (worst(N, true, (N - 1) / 2, c.lo, c.hi).v < c.target) return N; return 63; };
  const a2 = { caseIx: 0, N: 31, win: true, d: 0, s: 300, unlocked: false, solved: false, out: 'shifter' };
  const pctT = c => `${Math.round(c.target * 100)}%`;

  const stage2 = K.stage($('a2-stage'), s => {
    const { c, w, h, pen } = s, cs = CASES[a2.caseIx], top = 0.2;
    const P = { x: 46, y: 18, w: w - 64, h: h - 58 };
    const X = f => P.x + f / 4000 * P.w, Y = v => P.y + P.h - Math.min(v, top) / top * P.h;
    pen.rect(X(cs.lo), P.y, X(cs.hi) - X(cs.lo), P.h, c.paper2);
    [0, 0.05, 0.1, 0.2].forEach(v => pen.text(`${Math.round(v * 100)}%`, P.x - 6, Y(v) + 4, { align: 'right', color: c.soft, size: 10 }));
    pen.line([[P.x, Y(0)], [P.x + P.w, Y(0)]], c.soft, 1);
    [0, 1000, 2000, 3000, 4000].forEach(f => pen.text(hz(f), X(f), P.y + P.h + 16, { color: c.soft, size: 10 }));
    pen.text('Hz', P.x + P.w, P.y + P.h + 30, { align: 'right', color: c.soft, size: 10 });
    pen.line([[P.x, Y(cs.target)], [P.x + P.w, Y(cs.target)]], c.soft, 1.5, [6, 4]);
    if (!a2.unlocked) { pen.text('the ghost curve appears after your prediction', P.x + P.w / 2, P.y + P.h / 2, { color: c.soft, size: 12 }); return; }
    let seg = [], over = false;
    for (let f = 0; f <= 4000; f += 10) {
      const v = ghostAt(a2.N, a2.win, a2.d, f);
      if (v > top) { over = true; if (seg.length) { seg.push([X(f), Y(top)]); pen.line(seg, c.ink, 2); seg = []; } continue; }
      if (!seg.length && f > 0) seg.push([X(f - 10), Y(top)]);
      seg.push([X(f), Y(v)]);
    }
    if (seg.length) pen.line(seg, c.ink, 2);
    if (over) pen.text('gaps at the top: the ghost runs off the scale', P.x + P.w, P.y - 4, { align: 'right', color: c.soft, size: 10 });
    const wv = worst(a2.N, a2.win, a2.d, cs.lo, cs.hi);
    pen.dot(X(wv.f), Y(wv.v), 5, c.accent);
    const label = `worst: ${pctText(wv.v)} at ${hz(wv.f)} Hz`, lw = label.length * 6.6;
    const lx = Math.max(P.x + lw / 2, Math.min(P.x + P.w - lw / 2, X(wv.f)));
    const ly = wv.v > top * 0.75 ? Y(wv.v) + 20 : Y(wv.v) - 10;
    pen.rect(lx - lw / 2 - 3, ly - 11, lw + 6, 15, c.paper);
    pen.text(label, lx, ly, { color: c.accentInk, size: 11 });
  }, { height: w => (w < 560 ? 250 : 230) });

  function a2Eval() {
    const cs = CASES[a2.caseIx], D = (a2.N - 1) / 2, m = a2.d - D, wv = worst(a2.N, a2.win, a2.d, cs.lo, cs.hi);
    const pass = wv.v < cs.target, shortest = shortestFor(cs), shiftOK = a2.s === cs.shift;
    return { cs, D, m, wv, pass, shortest, shiftOK, solved: m === 0 && a2.win && a2.N === shortest && shiftOK && pass };
  }
  function shiftMsg(cs) {
    const dir = v => (v > 0 ? 'up' : 'down');
    if (a2.s === 0) return `The shift is 0 Hz, so the call comes out undisguised. This line asks for ${hz(Math.abs(cs.shift))} Hz ${dir(cs.shift)}.`;
    if (a2.s === -cs.shift) return `Sign flipped: the voice moves ${hz(Math.abs(cs.shift))} Hz ${dir(a2.s)} instead of ${dir(cs.shift)}.`;
    return `The shift is ${sgnHz(a2.s)}; this line asks for ${sgnHz(cs.shift)}, so it is off by ${hz(Math.abs(a2.s - cs.shift))} Hz.`;
  }
  function a2Message(e) {
    const { cs, m, wv } = e, where = `${pctText(wv.v)} at ${hz(wv.f)} Hz`;
    if (e.solved) {
      const ms = (e.D / 8).toFixed(3).replace(/0+$/, '');
      if (a2.caseIx === 0) return `Fixed. Every caller comes out 300 Hz up, and the ghost is ${where} at its worst, and far less through the rest of the voice. ${a2.N} coefficients cost ${e.D} samples of delay, ${ms} ms, which nobody hears. The reporters hear one thin, unfamiliar voice, and the tip line goes live.`;
      return `Fixed: ${a2.N} coefficients with the delay box at ${e.D} samples (${ms} ms), shifting ${sgnHz(a2.s)}. The worst ghost is ${where}, under the ${pctT(cs)} target.`;
    }
    const parts = [];
    if (m !== 0) {
      const big = !isFinite(wv.v) || wv.v >= 10 ? ` The ghost runs off the scale near ${hz(wv.f)} Hz, where the wanted copy itself cancels.` : ` The ghost reaches ${where}.`;
      if (a2.d === 0) parts.push(`No delay box: the plain path arrives before the Hilbert transformer’s output, the missing delay box from the lesson.${big}`);
      else if (a2.d === a2.N - 1 || a2.d === a2.N) parts.push(`Wrong place: ${a2.d} samples is the Hilbert transformer’s whole length. Its output is late only by the distance to its middle coefficient, the one at n = 0.${big}`);
      else if (Math.abs(m) === 1) parts.push(`Off by one: the plain path is one sample too ${m < 0 ? 'early' : 'late'}. Even one sample turns the mirror arrows out of line.${big}`);
      else if (m < 0) parts.push(`The plain path is still early: the Hilbert transformer’s output arrives later than your delay box. A longer Hilbert transformer is a later one. Make the delay longer.${big}`);
      else parts.push(`The plain path is now late: your delay box holds it back more than the Hilbert transformer delays its output. Make the delay shorter.${big}`);
    } else if (!a2.win) {
      parts.push(e.pass
        ? `Paths in step, and under the target at ${where}, but with no window it takes ${a2.N} coefficients. The Hann window gets there with fewer: switch it on and find the shortest.`
        : `Paths in step, but no window: the plain cut’s ripple, lesson 10’s Gibbs phenomenon, leaves a ghost of ${where}.`);
    } else if (!e.pass) {
      parts.push(`Paths in step. The ghost is ${where}${wv.f === cs.lo ? ', right at the bottom of the band' : ''}, over the ${pctT(cs)} target: this Hilbert transformer is too short, so its transition band still reaches into the voice. Make it longer, and keep the delay box in step.`);
    } else if (a2.N > e.shortest) {
      parts.push(`Under the target: ${where} at worst. But a shorter Hilbert transformer would pass too, and every coefficient you drop also shortens the delay the caller hears. Find the shortest that still passes.`);
    }
    if (!e.shiftOK) parts.push(parts.length ? `Also: ${shiftMsg(cs)}` : `The ghost is under the target, ${where}. ${shiftMsg(cs)}`);
    return parts.join(' ');
  }
  function a2Render() {
    const e = a2Eval(), { cs, D } = e;
    $('a2-task').textContent = cs.text;
    $('a2-len').value = a2.N; $('a2-len-out').textContent = `${a2.N} coefficients`;
    $('a2-delay').value = a2.d; $('a2-delay-out').textContent = `${a2.d} sample${a2.d === 1 ? '' : 's'}`;
    $('a2-shift').value = a2.s; $('a2-shift-out').textContent = sgnHz(a2.s);
    ['a2-len', 'a2-delay', 'a2-shift', 'a2-play'].forEach(id => { $(id).disabled = !a2.unlocked; });
    document.querySelectorAll('[data-win]').forEach(b => { b.disabled = !a2.unlocked; b.setAttribute('aria-pressed', String((b.dataset.win === 'hann') === a2.win)); });
    document.querySelectorAll('[data-out]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.out === a2.out)));
    $('a2-c-delay').textContent = `${a2.d} sample${a2.d === 1 ? '' : 's'}`;
    $('a2-c-hilbert').textContent = `${a2.N}, ${a2.win ? 'Hann' : 'plain cut'}`;
    $('a2-c-cos').textContent = `cos ${sgnHz(a2.s)}`; $('a2-c-sin').textContent = `sin ${sgnHz(a2.s)}`;
    $('a2-c-delay').classList.toggle('bad', a2.unlocked && e.m !== 0);
    $('a2-meter-label').textContent = `Ghost meter, ${hz(cs.lo)} to ${hz(cs.hi)} Hz (target ${pctT(cs)})`;
    if (a2.unlocked) {
      K.meter($('a2-meter'), Math.min(e.wv.v, 1), { max: 0.1, text: `${pctText(e.wv.v)}${e.wv.v > 0.1 ? ', past the bar' : ''}` });
      $('a2-result').textContent = `${a2.N} coefficients, ${a2.win ? 'Hann' : 'plain cut'} · delay box ${a2.d} · shift ${sgnHz(a2.s)} · worst ghost `;
      const sp = document.createElement('span'); sp.className = e.pass ? '' : 'changed'; sp.textContent = pctText(e.wv.v);
      $('a2-result').append(sp);
      $('a2-why').textContent = a2Message(e);
    } else {
      K.meter($('a2-meter'), 0, { known: false });
      $('a2-result').textContent = `${a2.N} coefficients · delay box ${a2.d} · shift ${sgnHz(a2.s)}`;
      $('a2-why').textContent = 'Answer the question above to unlock the knobs.';
    }
    a2.solved = a2.unlocked && e.solved;
    $('a2-another').hidden = !a2.solved;
    if (a2.solved && a2.caseIx === 0) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' }));
    $('a2-stage').setAttribute('aria-label', a2.unlocked ? `Ghost against tone for ${a2.N} coefficients, delay box ${a2.d}: worst ${pctText(e.wv.v)} at ${hz(e.wv.f)} Hz, target ${pctT(cs)}.` : 'The band to protect and the target line.');
    stage2.redraw();
    if (audio2.playing) audio2.refresh();
    $('a2-now').textContent = now2();
  }
  function render2() {
    if (a2.out === 'raw') return level(VOICE);
    if (a2.out === 'plain') return level(plainMul(VOICE, a2.s));
    return level(ssb(VOICE, a2.N, a2.win, a2.d, a2.s));
  }
  function now2() {
    if (!audio2.playing) return 'Not playing.';
    if (a2.out === 'raw') return 'Playing the call, unshifted.';
    if (a2.out === 'plain') return `Playing the plain multiplication by ${sgnHz(a2.s)}: the bug, wanted copy and ghost together.`;
    return `Playing your shifter: ${a2.N} coefficients, delay box ${a2.d}, shift ${sgnHz(a2.s)}.`;
  }
  const audio2 = K.player({ rate: FS, gain: 0.3, onChange: on => { $('a2-play').textContent = on ? 'Stop' : 'Play'; $('a2-now').textContent = now2(); } });

  function a2Ask() {
    $('a2-ask').replaceChildren();
    if (a2.caseIx !== 0) { a2.unlocked = true; return; }
    const q = document.createElement('div');
    $('a2-ask').append(q);
    K.ask(q, {
      question: 'Before you touch the knobs: say the delay box matches a Hilbert transformer, and you make the transformer 4 coefficients longer without touching the delay box. What happens to the ghost?',
      options: [['less', 'It shrinks: a longer filter is a better one'], ['same', 'It stays about the same'], ['worse', 'It gets much worse: the two paths fall out of step']],
      right: 'worse',
      hints: {
        less: 'A longer Hilbert transformer also reaches further back, so its output comes out later. What happened in the lesson when the plain path was not held back to match?',
        same: 'The delay box was set for the shorter filter. Is the longer one’s output still in step with it?',
      },
      explain: 'A longer Hilbert transformer is a later one. Leave the delay box behind and the two paths fall out of step, the mirror arrows stop cancelling, and the ghost comes back as it did with no delay box. The knobs are yours: wire the shifter.',
      onSolved: () => { a2.unlocked = true; a2Render(); },
      focusAfter: () => $('a2-delay'),
    });
  }

  $('a2-len').addEventListener('input', () => { a2.N = Number($('a2-len').value); a2Render(); });
  $('a2-delay').addEventListener('input', () => { a2.d = Number($('a2-delay').value); a2Render(); });
  $('a2-shift').addEventListener('input', () => { a2.s = Number($('a2-shift').value); a2Render(); });
  document.querySelectorAll('[data-win]').forEach(b => b.addEventListener('click', () => { a2.win = b.dataset.win === 'hann'; a2Render(); }));
  document.querySelectorAll('[data-out]').forEach(b => b.addEventListener('click', () => { a2.out = b.dataset.out; a2Render(); }));
  $('a2-play').addEventListener('click', () => (audio2.playing ? audio2.stop() : audio2.play(render2)));
  $('a2-another').addEventListener('click', () => {
    audio2.stop();
    a2.caseIx = a2.caseIx % (CASES.length - 1) + 1;
    Object.assign(a2, CASES[a2.caseIx].start, { solved: false });
    a2Ask(); a2Render(); $('a2-len').focus();
  });
  $('a2-reset').addEventListener('click', () => {
    audio2.stop();
    Object.assign(a2, CASES[a2.caseIx].start, { out: 'shifter', solved: false });
    a2Render(); $('a2-reset').focus();
  });
  $('start-act2').addEventListener('click', () => {
    audio1.stop();
    $('start-act2').hidden = true; $('lab2').hidden = false;
    a2Render(); stage2.resize();
    ($('lab2').querySelector('.k-ask button') || $('a2-len')).focus();
  });
  a2Ask(); a2Render();
})();
