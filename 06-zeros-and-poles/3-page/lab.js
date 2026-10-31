(() => {
  const K = window.Kit, FS = 8000, TAU = 2 * Math.PI;
  const { fmt, hz } = K;
  const VOICE_LO = 300, VOICE_HI = 3400, START_ZERO = 1000;
  const pctText = v => (v > 0 && v < 0.005 ? 'under 1%' : `${Math.round(v * 100)}%`);
  const voiceText = v => `${Math.floor(v * 100 + 1e-9)}%`;
  const degText = d => `${Number(d.toFixed(2))}°`;
  const omega = f => TAU * f / FS;
  const at = (P, r, th) => [P.cx + r * P.R * Math.cos(th), P.cy - r * P.R * Math.sin(th)];

  const VOICE = K.wav(window.LESSON_CALL);
  const VOICE_PEAK = VOICE.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);

  const avgGain = f => { const g = Math.abs(Math.cos(omega(f) / 2)); return g < 1e-9 ? 0 : g; };

  function notch(zeroHz, r) {
    const th = omega(zeroHz), c = Math.cos(th);
    const raw = f => {
      const w = omega(f), x = Math.cos(w), y = Math.sin(w);
      const d = (px, py) => Math.hypot(x - px, y - py);
      const top = d(c, Math.sin(th)) * d(c, -Math.sin(th));
      const bottom = r > 0 ? d(r * c, r * Math.sin(th)) * d(r * c, -r * Math.sin(th)) : 1;
      return top / Math.max(bottom, 1e-12);
    };
    let peak = 0;
    for (let f = 0; f <= 4000; f += 5) peak = Math.max(peak, raw(f));
    const gain = f => Math.min(raw(f) / peak, 1);
    let sum = 0, n = 0;
    for (let f = VOICE_LO; f <= VOICE_HI; f += 10) { sum += gain(f); n++; }
    return { gain, voice: sum / n, b: [1 / peak, -2 * c / peak, 1 / peak], a: [1, -2 * r * c, r * r], stable: r < 1 };
  }

  function runFilter(x, b, a) {
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      let acc = 0;
      for (let k = 0; k < b.length; k++) if (i >= k) acc += b[k] * x[i - k];
      for (let k = 1; k < a.length; k++) if (i >= k) acc -= a[k] * y[i - k];
      y[i] = acc;
    }
    return y;
  }

  function call(whineHz) {
    const n = VOICE.length + FS / 2, x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = (i < VOICE.length ? 0.55 * VOICE[i] / VOICE_PEAK : 0) + 0.16 * Math.cos(omega(whineHz) * i);
    return x;
  }

  function newWhine(avoid) {
    let f;
    do { f = 650 + 10 * Math.floor(Math.random() * 271); } while (f % 100 === 0 || Math.abs(f - avoid) < 400 || Math.abs(f - 2000) < 60);
    return f;
  }

  function mount(host, mode) {
    host.replaceChildren(document.getElementById('filter-lab').content.cloneNode(true));
    host.dataset.mode = mode;
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const state = explore
      ? { revealed: false, tone: 2000, pinned: null, filter: true }
      : { unlocked: false, zero: START_ZERO, r: 0, whine: newWhine(START_ZERO), solved: false, everSolved: false, filter: true };

    const layout = (w, h) => {
      if (w < 560) {
        const R = Math.min(w * 0.3, 104);
        return { circle: { cx: w / 2, cy: 30 + R, R }, chart: { x0: 46, x1: w - 22, y0: 2 * R + 96, y1: h - 40 } };
      }
      const R = Math.min(h * 0.36, 104);
      return { circle: { cx: 52 + R, cy: h / 2 + 4, R }, chart: { x0: 2 * R + 150, x1: w - 24, y0: 30, y1: h - 40 } };
    };

    function drawChart(s, C, gain, { unstable = false, mark = null, pin = null, whine = null, zero = null, hidden = false } = {}) {
      const { pen, c } = s, X = f => C.x0 + f / 4000 * (C.x1 - C.x0), Y = g => C.y1 - g * (C.y1 - C.y0);
      if (!explore) {
        pen.rect(X(VOICE_LO), C.y0, X(VOICE_HI) - X(VOICE_LO), C.y1 - C.y0, c.paper2);
        pen.text('voice tones', X(VOICE_LO) + 6, C.y1 - 8, { align: 'left', color: c.soft, size: 10 });
      }
      [0, 0.5, 1].forEach(g => { pen.line([[C.x0, Y(g)], [C.x1, Y(g)]], c.rule, 1); pen.text(`${g * 100}%`, C.x0 - 8, Y(g) + 4, { align: 'right', color: c.soft }); });
      pen.line([[C.x0, C.y1], [C.x1, C.y1]], c.soft, 1);
      [0, 1000, 2000, 3000, 4000].forEach(f => pen.text(f ? hz(f) : '0', X(f), C.y1 + 16, { color: c.soft, size: 10 }));
      pen.text('tone, Hz', C.x1, C.y1 + 32, { align: 'right', color: c.soft, size: 10 });
      if (whine !== null) {
        pen.line([[X(whine), C.y1], [X(whine), C.y0 + 22]], c.soft, 3);
        pen.text('whine', X(whine), C.y0 + 16, { color: c.soft, size: 10 });
      }
      if (hidden) { pen.text('the curve appears after your guess', (C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, { color: c.soft }); return; }
      const pts = [];
      for (let i = 0; i <= 800; i++) { const f = 4000 * i / 800; pts.push([X(f), Y(gain(f))]); }
      pen.line(pts, unstable ? c.soft : c.ink, 2, unstable ? [5, 5] : []);
      if (unstable) pen.text('unstable: no gain to draw', (C.x0 + C.x1) / 2, C.y0 + 40, { color: c.accentInk, size: 12 });
      if (zero !== null) pen.line([[X(zero), C.y1 + 1], [X(zero), C.y1 - 9]], c.input, 3);
      if (pin !== null) { pen.line([[X(pin), C.y1], [X(pin), Y(gain(pin))]], c.input, 1.5, [4, 4]); pen.ring(X(pin), Y(gain(pin)), 5, c.input, 2); }
      if (mark !== null) pen.dot(X(mark), Y(gain(mark)), 5.5, c.accent);
    }

    function drawRim(s, P, mirror) {
      const { ctx, pen, c } = s;
      pen.line([[P.cx - P.R, P.cy], [P.cx + P.R, P.cy]], c.soft, 1);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(P.cx, P.cy, P.R, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = mirror ? c.soft : c.ink; ctx.setLineDash(mirror ? [1, 4] : []);
      ctx.beginPath(); ctx.arc(P.cx, P.cy, P.R, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
      pen.text('0 Hz', P.cx + P.R + 5, P.cy + 15, { align: 'left', color: c.soft, size: 10 });
      pen.text('4,000 Hz', P.cx - P.R - 5, P.cy + 15, { align: 'right', color: c.soft, size: 10 });
      pen.text('2,000 Hz', P.cx, P.cy - P.R - 10, { color: c.soft, size: 10 });
    }

    function drawExplore(s) {
      const { pen, c, w, h } = s, L = layout(w, h), P = L.circle;
      drawRim(s, P, false);
      const w0 = omega(state.tone), [ox, oy] = at(P, 1, 0), [fx, fy] = at(P, 1, w0);
      const m = Math.cos(w0 / 2), [mx, my] = at(P, Math.abs(m), m >= 0 ? w0 / 2 : w0 / 2 + Math.PI);
      if (state.revealed) {
        pen.line([[fx, fy], [ox, oy]], c.ink, 1.4);
        pen.line([[P.cx, P.cy], [mx, my]], c.accent, 2);
        pen.dot(mx, my, 5.5, c.accent);
        pen.text(`${fmt(Math.abs(m))} from the center`, P.cx, P.cy + P.R + 22, { color: c.accentInk, size: 12 });
      }
      pen.ring(ox, oy, 6, c.ink, 2);
      pen.dot(fx, fy, 6.5, c.input);
      drawChart(s, L.chart, avgGain, { hidden: !state.revealed, mark: state.tone, pin: state.pinned });
    }

    function drawFix(s) {
      const { pen, c, w, h } = s, L = layout(w, h), P = L.circle, F = notch(state.zero, state.r), th = omega(state.zero);
      drawRim(s, P, true);
      if (state.r > 0) {
        pen.line([[P.cx, P.cy], at(P, Math.max(state.r, 1), th)], c.rule, 1, [3, 4]);
        [th, -th].forEach((t, i) => { const [x, y] = at(P, state.r, t); const k = 6; pen.line([[x - k, y - k], [x + k, y + k]], c.input, 2.5, [], i ? 0.55 : 1); pen.line([[x - k, y + k], [x + k, y - k]], c.input, 2.5, [], i ? 0.55 : 1); });
        const [px, py] = at(P, state.r, th);
        pen.text(`r ${state.r.toFixed(2)}`, px + (px >= P.cx ? 12 : -12), py + 18, { align: px >= P.cx ? 'left' : 'right', color: c.ink, size: 11 });
      }
      [th, -th].forEach((t, i) => { const [x, y] = at(P, 1, t); s.ctx.globalAlpha = i ? 0.55 : 1; pen.ring(x, y, 7, c.input, 2.5); s.ctx.globalAlpha = 1; });
      if (state.solved) { const [x, y] = at(P, 1, omega(state.whine)); pen.text(`whine ${hz(state.whine)} Hz`, x + (x >= P.cx ? 12 : -12), y - 10, { align: x >= P.cx ? 'left' : 'right', color: c.ink, size: 11 }); }
      drawChart(s, L.chart, F.gain, { unstable: !F.stable, whine: state.whine, zero: state.zero });
    }

    const stage = K.stage($('stage'), s => (explore ? drawExplore(s) : drawFix(s)), { height: w => (w < 560 ? 500 : 280) });

    function exploreWhy() {
      const f = state.tone, d = 360 * f / FS, m = avgGain(f);
      if (f === 0) return 'A 0 Hz tone is a constant: 1, 1, 1. The fresh dot and the one before sit on the same spot, every average is 1, and 100% passes.';
      if (f === 4000) return 'The whine: the dots sit 180° apart, exactly opposite. Every average is 0, the midpoint is the center, and the tone is removed.';
      const base = `The two dots sit ${degText(d)} apart. Their midpoint is ${fmt(m)} from the center and ${degText(d / 2)} behind the fresh dot: ${pctText(m)} passes.`;
      if (f <= 1000) return `${base} A slow tone barely moves between samples, so the average barely touches it.`;
      if (f >= 3500) return `${base} The dots are nearly opposite, so their midpoint falls toward the center.`;
      return base;
    }

    function fixMessage(F) {
      const whine = F.gain(state.whine), gap = state.whine - state.zero;
      if (!state.unlocked) return 'Answer the question above to unlock the zero pair and the poles.';
      if (!F.stable) return state.r > 1
        ? `Poles at ${state.r.toFixed(2)}, outside the circle: every echo comes back ${state.r.toFixed(2)} × ${state.r.toFixed(2)} times bigger two samples later, so the filter blows up. Pull them back inside.`
        : 'Poles exactly on the circle: one click and the loop rings forever. Pull them a little inside.';
      if (whine >= 0.005) {
        const dir = gap > 0 ? 'below' : 'above', move = gap > 0 ? 'up' : 'down';
        const near = Math.abs(gap) <= 100 ? `Close, but your zeros sit just ${dir} the whine` : `Your zeros sit ${dir} the whine`;
        return `${near}: it still passes ${pctText(whine)}. Move them ${move}${Math.abs(gap) <= 100 ? ' a little' : ''}, and listen.`;
      }
      if (F.voice < 0.9) {
        if (state.r === 0) return `The whine is removed. But the voice keeps only ${voiceText(F.voice)}: the zeros dull the tones around the whine. Bring the poles in beside them.`;
        if (state.r < 0.7) return `The whine is removed, and the voice is up to ${voiceText(F.voice)}. The poles are still far from the zeros, so nearby tones cannot tell them apart from the center. Move the poles out toward the rim.`;
        return `Nearly there: the voice keeps ${voiceText(F.voice)}. Move the poles a little closer to the rim, so only tones right beside the whine feel the zeros.`;
      }
      return `Fixed. The whine sat at ${hz(state.whine)} Hz and now passes 0%; the voice keeps ${voiceText(F.voice)}. The poles sit at ${state.r.toFixed(2)}, inside the circle, so every echo dies out. Line two is quiet.`;
    }

    function nowText() {
      if (!audio.playing) return explore ? 'Not playing. Play runs the call, with a tone at the slider’s pitch, through the average.' : 'Not playing. Play runs the call, whine and all, through your filter.';
      const via = state.filter ? (explore ? 'through the average' : 'through your filter') : 'with the filter off';
      return explore ? `Playing the call with a ${hz(state.tone)} Hz tone, ${via}.` : `Playing the call with the whine, ${via}.`;
    }

    function render8k() {
      const x = call(explore ? state.tone : state.whine);
      if (!state.filter) return x;
      if (explore) return runFilter(x, [0.5, 0.5], [1]);
      const F = notch(state.zero, state.r);
      return runFilter(x, F.b, F.a);
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play the call'; $('now').textContent = nowText(); } });

    function render() {
      if (explore) {
        $('tone').value = state.tone; $('tone-out').textContent = `${hz(state.tone)} Hz`;
        $('tone').disabled = !state.revealed; $('pin').disabled = !state.revealed;
        const g = avgGain(state.tone);
        $('result').replaceChildren(`Tone ${hz(state.tone)} Hz · `);
        if (state.revealed) {
          const sp = document.createElement('span'); sp.className = g < 0.995 ? 'changed' : ''; sp.textContent = state.tone === 4000 ? 'passes 0%, removed' : `passes ${pctText(g)}`;
          $('result').append(sp);
          $('why').textContent = exploreWhy();
          K.meter($('meter-a'), g, { max: 1 });
        } else {
          $('result').append('passes ?');
          $('why').textContent = 'Make your guess above. Then the midpoint, the meter and the curve appear.';
          K.meter($('meter-a'), 0, { max: 1, known: false });
        }
        $('key-mid').hidden = !state.revealed;
        $('compare').hidden = state.pinned === null;
        if (state.pinned !== null) {
          const p = state.pinned, f = state.tone;
          $('compare').textContent = p === f ? `Pinned ${hz(p)} Hz. Move the slider to compare.`
            : `Pinned ${hz(p)} Hz passes ${pctText(avgGain(p))}; now ${hz(f)} Hz passes ${pctText(avgGain(f))}. ${hz(Math.max(p, f))} Hz turns further per sample, so its two dots sit further apart and their midpoint lands closer to the center.`;
        }
        $('key-pin').hidden = state.pinned === null;
        $('stage').setAttribute('aria-label', state.revealed
          ? `The wheel at ${hz(state.tone)} Hz: the fresh dot, the dot one sample before, and their midpoint ${fmt(avgGain(state.tone))} from the center. Beside it, the share each tone passes, from 100% at 0 Hz down to 0% at 4,000 Hz.`
          : `The wheel at ${hz(state.tone)} Hz: the fresh dot and the dot one sample before.`);
      } else {
        const F = notch(state.zero, state.r);
        $('zero').value = state.zero; $('zero-out').textContent = `${hz(state.zero)} Hz`;
        if (document.activeElement !== $('zero-typed')) $('zero-typed').value = String(state.zero);
        $('pole').value = state.r;
        $('pole-out').textContent = state.r === 0 ? '0 (no poles)' : `${state.r.toFixed(2)}${state.r > 1 ? ' (outside the circle)' : state.r === 1 ? ' (on the circle)' : ''}`;
        ['zero', 'zero-typed', 'pole', 'play'].forEach(k => { $(k).disabled = !state.unlocked; });
        $('key-pole').hidden = state.r === 0;
        const msg = fixMessage(F);
        const solvedNow = state.unlocked && F.stable && F.gain(state.whine) < 0.005 && F.voice >= 0.9;
        state.solved = solvedNow;
        if (!state.unlocked) {
          $('result').textContent = 'Whine passes ? · voice keeps ?';
          K.meter($('meter-a'), 0, { max: 1, known: false }); K.meter($('meter-b'), 0, { max: 1, known: false });
        } else if (!F.stable) {
          $('result').replaceChildren('Filter: ');
          const sp = document.createElement('span'); sp.className = 'changed'; sp.textContent = state.r > 1 ? 'unstable, it blows up' : 'unstable, it rings forever';
          $('result').append(sp);
          K.meter($('meter-a'), 0, { max: 1, text: 'unstable' }); K.meter($('meter-b'), 0, { max: 1, text: 'unstable' });
        } else {
          const wv = F.gain(state.whine);
          $('result').replaceChildren(`Zeros ${hz(state.zero)} Hz · poles ${state.r ? state.r.toFixed(2) : 'none'} · whine passes `);
          const a = document.createElement('span'); a.className = wv >= 0.005 ? 'changed' : ''; a.textContent = pctText(wv);
          const b = document.createElement('span'); b.className = F.voice < 0.9 ? 'changed' : ''; b.textContent = voiceText(F.voice);
          $('result').append(a, ' · voice keeps ', b);
          K.meter($('meter-a'), wv, { max: 1, text: wv < 0.005 ? '0%' : undefined }); K.meter($('meter-b'), F.voice, { max: 1, text: voiceText(F.voice) });
        }
        $('why').textContent = msg;
        $('another').hidden = !solvedNow;
        if (solvedNow && !state.everSolved) { state.everSolved = true; document.dispatchEvent(new CustomEvent('k:solved', { detail: 'act2' })); }
        $('stage').setAttribute('aria-label', `The unit circle with your zero pair at ${hz(state.zero)} Hz${state.r ? ` and poles at radius ${state.r.toFixed(2)}` : ''}. Beside it, how much each tone passes, with the voice tones shaded and the whine marked on the frequency meter.`);
      }
      $('filter').setAttribute('aria-pressed', String(state.filter));
      $('filter').textContent = state.filter ? 'Filter on' : 'Filter off';
      stage.redraw();
      if (audio.playing) {
        if (!explore && state.filter && state.r >= 1) { audio.stop(); $('now').textContent = 'Stopped: an unstable filter would only blast noise. Pull the poles back inside the circle.'; }
        else audio.refresh();
      } else $('now').textContent = nowText();
    }

    function setZero(v) { state.zero = Math.max(0, Math.min(4000, v)); render(); }

    if (explore) {
      K.ask($('ask'), {
        question: 'A 2,000 Hz tone goes through the average. How much of it passes?',
        options: [['50', 'About 50%: halfway up, halfway down'], ['71', 'About 71%'], ['95', 'About 95%: the average only bites near 4,000 Hz']], right: '71',
        hints: { 50: '2,000 Hz turns 90° per sample: the fresh dot and the one before are a quarter turn apart. Is the midpoint of that chord halfway to the center?', 95: '2,000 Hz turns 90° per sample, so the two dots are far apart. Can the midpoint of a quarter-turn chord stay near the rim?' },
        explain: 'The two dots are a quarter turn apart, so their midpoint is 0.71 from the center: 71% passes. The slider is yours now: sweep from 0 Hz to 4,000 Hz.',
        reveal: 'Skip: show me',
        onSolved: () => { state.revealed = true; render(); }, focusAfter: () => $('tone'),
      });
    } else {
      $('task').hidden = false;
      $('task-text').textContent = 'Line two again: a new chip, a new whine, at a pitch you do not know yet. Play the call and listen, and find the whine’s spike on the frequency meter. Move the zero pair onto it until the whine passes 0%, then bring the poles in until the voice keeps more than 90%, without letting them reach the circle. Every share is compared with the loudest tone your filter passes.';
      ['tone-control', 'pin', 'jump', 'key-explore'].forEach(k => { $(k).hidden = true; });
      ['zero-control', 'pole-control', 'key-fix', 'meter-b'].forEach(k => { $(k).hidden = false; });
      $('meter-a-label').textContent = 'Whine: share that passes (done at 0%)';
      $('play').disabled = true;
      K.ask($('ask'), {
        question: 'Before you touch anything: once your zero pair sits right on this whine, with no poles yet, what will the voice meter read?',
        options: [['most', 'Above 90%: the zeros only touch the whine'], ['less', 'Well under 90%: the voice turns dull'], ['none', 'About 0%: the voice goes too']], right: 'less',
        hints: { most: 'A zero weakens every tone near it, not only the one it sits on. How far around the circle does that reach?', none: 'Tones far from the zeros sit far from them on the circle. Do they lose everything?' },
        explain: 'A zero pair pulls down every tone near it, so the voice turns dull, like the sock ticket. The controls are yours now: find the whine, then see how dull.',
        onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => $('play'),
      });
    }

    $('tone').addEventListener('input', () => { state.tone = Number($('tone').value); render(); });
    $('pin').addEventListener('click', () => { state.pinned = state.tone; render(); });
    $('zero').addEventListener('input', () => { $('zero-msg').textContent = ''; $('zero-msg').className = ''; setZero(Number($('zero').value)); });
    $('zero-typed').addEventListener('change', () => {
      const raw = $('zero-typed').value.replace(/[,\s]/g, ''), v = Number(raw);
      if (!/^\d+$/.test(raw) || v > 4000) {
        $('zero-msg').textContent = 'Type a whole number of hertz, from 0 to 4,000.'; $('zero-msg').className = 'bad';
        $('zero-typed').value = String(state.zero); return;
      }
      $('zero-msg').textContent = `Zero pair moved to ${hz(v)} Hz.`; $('zero-msg').className = '';
      setZero(v);
    });
    $('zero-typed').addEventListener('keydown', e => { if (e.key === 'Enter') $('zero-typed').dispatchEvent(new Event('change')); });
    $('pole').addEventListener('input', () => { state.r = Math.round(Number($('pole').value) * 100) / 100; render(); });
    $('play').addEventListener('click', () => {
      if (audio.playing) { audio.stop(); return; }
      if (!explore && state.filter && state.r >= 1) { $('now').textContent = 'Not playing: an unstable filter would only blast noise. Pull the poles back inside the circle first.'; return; }
      audio.play(render8k);
    });
    $('filter').addEventListener('click', () => { state.filter = !state.filter; render(); });
    $('another').addEventListener('click', () => {
      audio.stop();
      Object.assign(state, { whine: newWhine(state.whine), zero: START_ZERO, r: 0, solved: false });
      $('zero-msg').textContent = '';
      render(); $('zero').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(state, { tone: state.revealed ? 2000 : state.tone, pinned: null, filter: true });
      else Object.assign(state, { zero: START_ZERO, r: 0, filter: true });
      $('zero-msg').textContent = '';
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
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
})();
