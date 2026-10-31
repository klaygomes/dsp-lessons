(() => {
  const K = window.Kit, FS = 8000, N = 16;
  const { fmt, hz, MINUS } = K;
  const clip = v => Math.max(-1, Math.min(1, v));
  const cosd = d => Math.cos(d * Math.PI / 180);
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const f2 = v => fmt(Math.round(v * 100 + 1e-7) / 100);
  const pctText = v => (v > 0 && v < 0.005 ? 'under 1%' : `${Math.round(v * 100)}%`);
  const joinList = items => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const toneFn = (f, size) => n => size * cosd(360 * f * n / FS);
  const list = fn => Array.from({ length: N }, (_, n) => fn(n));

  const VOICE = K.wav(window.LESSON_CALL);
  const VOICE_PEAK = VOICE.reduce((m, s) => Math.max(m, Math.abs(s)), 1e-6);
  const VOICE_AT = VOICE.reduce((best, s, i) => (Math.abs(s) > Math.abs(VOICE[best]) ? i : best), 0);

  const CASES = [
    { text: 'A second exchange has just joined your line, with its own test calls: a loud caller, a quiet caller and a speakerphone pair. Their sizes are on the plots. Find the loudest input and set the booster so it lands at 0.8 with no buzz anywhere.', loud: 0.3, quiet: 0.1, pair: 0.2 },
    { text: 'Back on your own line: the loud caller (0.5), the quiet caller (0.2) and the speakerphone pair (two voices of 0.2). Size the booster again, and play each one to hear the difference.', loud: 0.5, quiet: 0.2, pair: 0.2 },
    { text: 'A conference-room line: a loud caller, a quiet caller, and a speakerphone where two people share one microphone. Size the booster.', loud: 0.6, quiet: 0.25, pair: 0.4 },
    { text: 'A line with weak handsets: everyone is quiet here. Size the booster.', loud: 0.25, quiet: 0.1, pair: 0.1 },
  ];
  const CALLER_NAMES = ['loud caller', 'quiet caller', 'speakerphone pair'];

  function buzzOf(y, inputHz) {
    const tones = K.tones(y, FS);
    const own = tones.filter(t => inputHz.includes(t.f)), fresh = tones.filter(t => !inputHz.includes(t.f) && t.size > 1e-6);
    const voice = Math.hypot(...own.map(t => t.size));
    return { buzz: voice > 1e-9 ? Math.hypot(...fresh.map(t => t.size)) / voice : 0, fresh, voice };
  }

  function voiceBuzz(size) {
    let xy = 0, xx = 0;
    for (const s of VOICE) { const x = size * s / VOICE_PEAK; xy += x * clip(4 * x); xx += x * x; }
    if (xx < 1e-12) return 0;
    const a = xy / xx;
    let rr = 0, aa = 0;
    for (const s of VOICE) { const x = size * s / VOICE_PEAK, r = clip(4 * x) - a * x; rr += r * r; aa += a * a * x * x; }
    return Math.sqrt(rr / aa);
  }

  function neighborMarks(y, f) {
    const c = 2 * cosd(360 * f / FS), at = n => y[(n + N) % N];
    return y.map((v, n) => Math.abs(at(n - 1) + at(n + 1) - c * v) < 0.005);
  }

  function plotArea(x0, y0, w, h, ys) {
    return { X: (n, count) => x0 + (n + 0.5) * w / count, Y: v => y0 + h / 2 - Math.max(-ys, Math.min(ys, v)) / ys * h / 2 };
  }

  function drawStems(s, A, data, { count = data.y.length, ys = 2.2, marks = null, pinned = null, target = null, labelEvery = 4, uncut = false } = {}) {
    const { pen, c } = s, P = plotArea(A.x, A.y, A.w, A.h, ys);
    pen.rect(A.x, P.Y(1), A.w, P.Y(-1) - P.Y(1), c.inputSoft);
    pen.line([[A.x, P.Y(1)], [A.x + A.w, P.Y(1)]], c.input, 1, [5, 4]);
    pen.line([[A.x, P.Y(-1)], [A.x + A.w, P.Y(-1)]], c.input, 1, [5, 4]);
    pen.line([[A.x, P.Y(0)], [A.x + A.w, P.Y(0)]], c.soft, 1);
    pen.text('1', A.x - 6, P.Y(1) + 4, { align: 'right', color: c.soft });
    pen.text(`${MINUS}1`, A.x - 6, P.Y(-1) + 4, { align: 'right', color: c.soft });
    if (target !== null) pen.line([[A.x, P.Y(target)], [A.x + A.w, P.Y(target)]], c.accent, 1.5, [2, 3]);
    const step = A.w / count, r = Math.max(2.2, Math.min(4, step / 4));
    if (pinned) pinned.forEach((v, n) => { const x = P.X(n, count) + step * 0.22; pen.line([[x, P.Y(0)], [x, P.Y(v)]], c.input, 1.5, [3, 3]); pen.ring(x, P.Y(v), r - 0.5, c.input, 1.2); });
    data.y.forEach((v, n) => {
      const x = P.X(n, count), want = data.ideal ? data.ideal[n] : v, cut = !uncut && Math.abs(want) > 1 + 1e-9;
      if (cut) { pen.line([[x, P.Y(0)], [x, P.Y(want)]], c.soft, 1, [3, 3]); pen.ring(x, P.Y(want), r, c.soft, 1.2); }
      pen.line([[x, P.Y(0)], [x, P.Y(v)]], cut ? c.accent : c.ink, cut ? 2.5 : 1.8);
      pen.dot(x, P.Y(v), r, cut ? c.accent : c.ink);
      if (marks) { const my = A.y + A.h + 14; marks[n] ? pen.tick(x, my, c.input) : pen.cross(x, my, c.accent); }
      if (n % labelEvery === 0) pen.text(n === 0 ? 'n = 0' : String(n), x, A.y + A.h + (marks ? 32 : 16), { color: c.soft, size: 10 });
    });
  }

  function mountBooster(host, mode) {
    host.replaceChildren(document.getElementById('booster-lab').content.cloneNode(true));
    host.dataset.mode = mode;
    const uid = `${host.id}-`;
    const $ = k => host.querySelector(`[data-k="${k}"]`);
    host.querySelectorAll('[data-k]').forEach(el => { el.id = uid + el.dataset.k; });
    host.querySelectorAll('[data-for]').forEach(el => { el.htmlFor = uid + el.dataset.for; });
    const explore = mode === 'explore';
    const state = { revealed: !explore, moved: false, size: 0.5, tone: 1000, pinned: null, ideal: false, gain: 4, caseIx: 0, caller: 0, solved: false, unlocked: !explore ? false : true };

    const exploreView = () => {
      if (state.tone === 'voice') {
        const start = Math.max(0, VOICE_AT - 24);
        const x = Array.from({ length: 48 }, (_, i) => state.size * (VOICE[start + i] || 0) / VOICE_PEAK);
        return { x, ideal: x.map(v => 4 * v), y: x.map(v => clip(4 * v)), marks: null, buzz: voiceBuzz(state.size), fresh: [] };
      }
      const x = list(toneFn(state.tone, state.size)), y = x.map(v => clip(4 * v));
      const b = state.size > 0 ? buzzOf(y, [state.tone]) : { buzz: 0, fresh: [], voice: 0 };
      return { x, ideal: x.map(v => 4 * v), y, marks: state.size > 0 ? neighborMarks(y, state.tone) : null, ...b };
    };
    const callerSignal = i => {
      const c = CASES[state.caseIx];
      if (i === 0) return toneFn(1000, c.loud);
      if (i === 1) return toneFn(1000, c.quiet);
      return n => toneFn(1000, c.pair)(n) + toneFn(500, c.pair)(n);
    };
    const fixView = () => [0, 1, 2].map(i => {
      const x = list(callerSignal(i)), ideal = x.map(v => state.gain * v), y = ideal.map(clip);
      return { x, ideal, y, peak: Math.max(...ideal), ...buzzOf(y, i === 2 ? [500, 1000] : [1000]) };
    });

    const stage = K.stage($('stage'), s => {
      const { w, h } = s;
      if (explore) {
        const A = { x: 30, y: 16, w: w - 44, h: h - 56 }, v = exploreView();
        if (!state.revealed) drawStems(s, A, { y: v.x, ideal: null }, { count: v.x.length });
        else drawStems(s, A, state.ideal ? { y: v.ideal, ideal: null } : v, { uncut: state.ideal, count: v.y.length, marks: state.ideal ? null : v.marks, pinned: state.pinned && state.pinned.tone === state.tone ? state.pinned.y : null, labelEvery: v.y.length > 16 ? 8 : 4 });
        return;
      }
      const cols = fixView(), stacked = w < 560;
      cols.forEach((col, i) => {
        const A = stacked ? { x: 30, y: 26 + i * 176, w: w - 44, h: 112 } : { x: 30 + i * (w - 30) / 3, y: 30, w: (w - 30) / 3 - 22, h: 170 };
        const c = CASES[state.caseIx], size = i === 2 ? `${fmt(c.pair)} each` : fmt(i === 0 ? c.loud : c.quiet);
        s.pen.text(`${CALLER_NAMES[i]}, ${size}`, A.x, A.y - 10, { align: 'left', color: s.c.ink, size: 13, font: 'body', weight: 600 });
        drawStems(s, A, state.ideal ? { y: col.ideal, ideal: null } : state.unlocked ? col : { y: col.y, ideal: null }, { uncut: state.ideal, count: N, target: 0.8, labelEvery: 8 });
        if (!state.unlocked) return;
        const cut = col.peak > 1 + 1e-9, edge = near(col.peak, 1);
        s.pen.text(`peak ${f2(Math.min(col.peak, 1))}${cut ? `, asked ${f2(col.peak)}` : ''} · buzz ${pctText(col.buzz)}`, A.x + A.w, A.y + A.h + 30, { align: 'right', color: cut || edge ? s.c.accentInk : s.c.ink, size: 11 });
      });
    }, { height: w => (explore ? (w < 560 ? 270 : 260) : (w < 560 ? 540 : 260)) });

    const freshList = v => v.fresh.filter(t => t.size >= 0.0005).map(t => `${hz(t.f)} Hz (${pctText(t.size / v.voice)})`);
    function exploreWhy(v) {
      const s = state.size, voice = state.tone === 'voice', peak = 4 * s;
      if (near(s, 0)) return 'Silence in, silence out: nothing to clip, and the buzz meter reads 0%.';
      if (s < 0.25 - 1e-9) return `4 × ${fmt(s)} = ${fmt(peak)}, inside the range. Nothing clips, so the booster acts like the linear ×4${voice ? '' : ': every sample passes the neighbor rule'}, and the buzz meter reads 0%.`;
      if (near(s, 0.25)) return '4 × 0.25 = 1.00: the top sample lands exactly on the edge. Nothing is cut yet, and the buzz meter reads 0%, but there is no margin at all.';
      if (voice) return `${near(s, 0.5) ? 'The loudest test call. ' : ''}4 × ${fmt(s)} = ${fmt(peak)}, past the edge. Every peak of the voice above the range is flattened to the edge, and the flattening is heard as buzz: ${pctText(v.buzz)} of the voice.`;
      if (near(s, 0.5) && state.tone === 1000) return `The loudest test call: 4 × 0.50 = 2.00, twice the edge. The stored list is 1, 1, 0, ${MINUS}1, ${MINUS}1, ${MINUS}1, 0, 1: a 1,000 Hz tone of size 1.207 minus a 3,000 Hz tone of size 0.207. That 3,000 Hz tone is the buzz, about a sixth of the voice.`;
      const fails = v.marks.map((m, n) => (m ? null : n)).filter(n => n !== null);
      const failText = fails.length ? `, the neighbor rule fails at n = ${fails.length > 4 ? `${fails.slice(0, 4).join(', ')} and others` : joinList(fails.map(String))}` : '';
      const flat = state.tone === 1000 && s > 0.354 ? ' Above about 0.35 every nonzero sample is already past the edge, so the stored list, and the buzz, stop changing.' : '';
      return `${near(s, 0.5) ? 'The loudest test call: ' : ''}4 × ${fmt(s)} = ${fmt(peak)}, past the edge. The tops are flattened to 1.00${failText}, and new tones appear: ${joinList(freshList(v))}. Buzz ${pctText(v.buzz)}.${flat}`;
    }
    function pinCompare(v) {
      const p = state.pinned, name = q => `${q.tone === 'voice' ? 'the voice' : `${hz(q.tone)} Hz`} at ${fmt(q.size)}`, now = { tone: state.tone, size: state.size };
      if (p.tone === now.tone && near(p.size, now.size)) return `Pinned ${name(p)}. Move the slider to compare.`;
      let tail;
      if (p.buzz < 0.005 && v.buzz < 0.005) tail = 'Both stay inside the range: no buzz either way.';
      else if (p.tone === 'voice' || now.tone === 'voice') tail = 'The meter gives the new tones’ share of the voice. Much of a voice sits in quieter tones that clip less, so its share can come out smaller, but its new tones scatter all over the band, between its own, and the ear hears that as rougher.';
      else if (p.tone !== now.tone) tail = 'Different pitch, different new tones: clipping puts them at three, five, seven times the pitch, folded below 4,000 Hz.';
      else tail = `${p.size > now.size ? 'The pinned caller' : 'The caller now'} is louder, so more of each peak is cut off, and the buzz is bigger.`;
      return `Pinned ${name(p)}: buzz ${pctText(p.buzz)}. Now ${name(now)}: buzz ${pctText(v.buzz)}. ${tail}`;
    }
    function fixMessage(cols) {
      const c = CASES[state.caseIx], g = state.gain, loudest = Math.max(...cols.map(col => col.peak));
      const target = Math.round(0.8 / Math.max(c.loud, 2 * c.pair) * 10) / 10;
      const clipped = cols.map((col, i) => (col.peak > 1 + 1e-9 ? i : null)).filter(i => i !== null);
      state.solved = false;
      if (clipped.length) {
        const names = joinList(clipped.map(i => `the ${CALLER_NAMES[i]} reaches ${f2(cols[i].peak)}`));
        const sumNote = clipped.length === 1 && clipped[0] === 2 ? ' The loud caller alone fits; it is the sum that clips. Size for the loudest input, sums included.' : '';
        return `At ×${g.toFixed(1)}, ${names}, past the edge. Buzz ${joinList(clipped.map(i => pctText(cols[i].buzz)))}. Turn the booster down.${sumNote}`;
      }
      if (near(loudest, 1)) return 'Exactly on the edge: buzz 0%, but no margin at all. The first caller a hair louder clips again. Leave a fifth of the range free.';
      const shownPeak = Math.round(loudest * 100) / 100;
      if (loudest > 0.8 + 1e-9) return `No buzz, but the loudest input peaks at ${fmt(shownPeak)}: only ${fmt(1 - shownPeak)} is left before the edge. Leave a fifth of the range free: land it at 0.8.`;
      if (!near(g, target) && loudest >= 0.7) return `Clean, but a little more headroom than the rule asks: the loudest input is at ${f2(loudest)}, short of 0.8, and the quiet caller is down at ${f2(cols[1].peak)}. Turn the booster up a little.`;
      if (!near(g, target)) return `Clean, with lots of headroom, but quieter than it needs to be: the quiet caller is down at ${f2(cols[1].peak)}. Turn the booster up until the loudest input lands at 0.8.`;
      state.solved = true;
      if (state.caseIx === 1) return 'Fixed. The loud caller peaks at 0.80, the speakerphone pair at 0.64 and the quiet caller at 0.32, and the buzz meter reads 0% for all three. A caller can now reach 0.625 before anything clips, a quarter louder than the loudest you have seen. Loud callers sound like loud people again.';
      const top = cols.reduce((b, col, i) => (col.peak > cols[b].peak ? i : b), 0);
      return `Fixed at ×${g.toFixed(1)}. The ${CALLER_NAMES[top]}, the loudest input, peaks at 0.80, and the buzz meter reads 0% for all three. The quiet caller is at ${f2(cols[1].peak)}. A caller can reach ${f2(1 / g)} before anything clips.`;
    }

    function nowText() {
      if (!audio.playing) return 'Not playing. Press Play to hear the booster’s output.';
      const what = explore ? (state.tone === 'voice' ? 'the recorded voice' : `the ${hz(state.tone)} Hz tone`) + ` at ${fmt(state.size)}` : `the ${CALLER_NAMES[state.caller]} at ×${state.gain.toFixed(1)}`;
      const clips = explore ? (state.tone === 'voice' ? state.size > 0.25 + 1e-9 : 4 * state.size > 1 + 1e-9) : fixView()[state.caller].peak > 1 + 1e-9;
      return state.ideal ? `Playing ${what} through an ideal ×${explore ? 4 : state.gain.toFixed(1)} with no clipping, turned down to fit your speaker.` : `Playing ${what} as the chip stores it: ${clips ? 'clipped at the edge, listen for the buzz' : 'nothing is clipped, so no buzz'}.`;
    }

    function render() {
      if (explore) {
        const v = exploreView();
        $('size').value = state.size; $('size-out').textContent = fmt(state.size);
        $('size').disabled = !state.revealed; $('pin').disabled = !state.revealed; $('play').disabled = !state.revealed;
        host.querySelectorAll('[data-tone]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tone === String(state.tone))));
        const what = state.tone === 'voice' ? 'the recorded voice' : `${hz(state.tone)} Hz`;
        if (state.revealed) {
          const top = Math.max(...v.ideal.map(Math.abs)), cut = top > 1 + 1e-9;
          $('result').textContent = `${what} · size ${fmt(state.size)} × 4 = ${fmt(4 * state.size)} · stored `;
          const sp = document.createElement('span'); sp.className = cut ? 'changed' : ''; sp.textContent = state.ideal ? `ideal: nothing cut, peak ${fmt(top)}` : cut ? 'clipped at 1.00' : `peak ${fmt(top)}`;
          if (state.ideal) sp.className = '';
          $('result').append(sp);
          $('why').textContent = state.ideal ? `Ideal on: the plot shows what an endless chip would store, ${fmt(4 * state.size)} at the top with nothing cut, and no buzz. The real chip clips: turn Ideal off to see it. Press Play to hear the difference.` : exploreWhy(v);
          K.meter($('meter'), state.ideal ? 0 : v.buzz, state.ideal ? { text: '0% (ideal)' } : {});
        } else {
          $('result').textContent = `${what} · size ${fmt(state.size)}, before the booster`;
          $('why').textContent = 'Answer the question above to see what the booster stores.';
          K.meter($('meter'), 0, { known: false });
        }
        $('key-marks').hidden = state.tone === 'voice' || !state.revealed;
        $('compare').hidden = !state.pinned;
        if (state.pinned) $('compare').textContent = pinCompare(v);
        $('key-pin').hidden = !state.pinned;
        $('stage').setAttribute('aria-label', state.revealed
          ? `${what} at size ${fmt(state.size)} through the booster: ${v.buzz > 0.0001 ? 'some samples are clipped at the edge' : 'every sample stays inside the range'}.`
          : `${what} at size ${fmt(state.size)}, before the booster.`);
      } else {
        const cols = fixView(), worst = Math.max(...cols.map(col => col.buzz));
        $('gain').value = state.gain; $('gain-out').textContent = `×${state.gain.toFixed(1)}`;
        $('gain').disabled = !state.unlocked; $('play').disabled = !state.unlocked;
        $('task-text').textContent = CASES[state.caseIx].text;
        host.querySelectorAll('[data-caller]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.caller) === state.caller)));
        $('result').textContent = state.unlocked ? `Booster ×${state.gain.toFixed(1)} · peaks: loud ${f2(cols[0].peak)}, quiet ${f2(cols[1].peak)}, pair ${f2(cols[2].peak)} · buzz ` : `Booster ×${state.gain.toFixed(1)} · peaks and buzz appear after your prediction`;
        const sp = document.createElement('span'); sp.className = worst > 0.0001 ? 'changed' : ''; sp.textContent = cols.map(col => pctText(col.buzz)).join(', ');
        if (state.unlocked) $('result').append(sp);
        const msg = fixMessage(cols);
        $('why').textContent = (state.ideal ? 'Ideal on: this is what an endless chip would store, with nothing cut. The real chip clips. ' : '') + (state.unlocked ? msg : 'Answer the question above to unlock the booster knob.');
        K.meter($('meter'), state.ideal ? 0 : cols[state.caller].buzz, state.ideal ? { text: '0% (ideal)' } : { known: state.unlocked });
        $('meter-label').textContent = `Buzz of the ${CALLER_NAMES[state.caller]}: new tones as % of the voice`;
        $('another').hidden = !state.solved;
        if (state.solved && state.caseIx === 1) document.dispatchEvent(new CustomEvent('k:solved', { detail: 'own-line' }));
        $('another').textContent = state.caseIx === 0 ? 'Next: back to your own line' : 'Try another line';
        $('stage').setAttribute('aria-label', `Booster at times ${state.gain.toFixed(1)}: the loud caller, the quiet caller and the speakerphone pair, with the range and the 0.8 target line.`);
      }
      $('ideal').setAttribute('aria-pressed', String(state.ideal));
      stage.resize();
      if (audio.playing) audio.refresh();
      $('now').textContent = nowText();
    }

    function render8k() {
      let x;
      if (explore) {
        if (state.tone === 'voice') { x = new Float32Array(VOICE.length + FS / 2); VOICE.forEach((s, i) => { x[i] = state.size * s / VOICE_PEAK; }); }
        else { const f = toneFn(state.tone, state.size); x = Float32Array.from({ length: FS }, (_, n) => f(n)); }
        x = x.map(v => (state.ideal ? 4 * v : clip(4 * v)));
      } else {
        const f = callerSignal(state.caller);
        x = Float32Array.from({ length: FS }, (_, n) => (state.ideal ? state.gain * f(n) : clip(state.gain * f(n))));
      }
      const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      return peak > 1 ? x.map(v => v / peak) : x;
    }
    const audio = K.player({ rate: FS, gain: 0.3, onChange: on => { $('play').textContent = on ? 'Stop' : 'Play'; $('now').textContent = nowText(); } });

    function buildAsks() {
      if (explore) {
        $('size-control').hidden = false;
        K.ask($('ask'), {
          question: 'The booster multiplies by 4, then the chip clips to the range. At what caller size does the buzz start?',
          options: [['0.1', 'Above 0.1'], ['0.25', 'Above 0.25'], ['0.5', 'Only at 0.5']], right: '0.25',
          hints: { '0.1': 'At 0.1, ×4 gives 0.40. Is that past the edge at 1?', '0.5': 'The edge is at 1. Which size, times 4, lands exactly on 1?' },
          explain: 'Times 4, 0.25 lands exactly on 1.00, the edge. Any louder and the top samples cross it. The plot and the slider are yours now.',
          reveal: 'Skip: show me', solved: state.revealed ? 'right' : null,
          onSolved: () => { state.revealed = true; render(); }, focusAfter: () => $('size'),
        });
        return;
      }
      $('ask2').replaceChildren();
      if (state.caseIx !== 0) { state.unlocked = true; return; }
      const q = document.createElement('div');
      $('ask2').append(q);
      K.ask(q, {
        question: 'Before you touch the knob: which input will decide the booster setting?',
        options: [['loud', 'The loud caller'], ['quiet', 'The quiet caller'], ['pair', 'The speakerphone pair']], right: 'pair',
        hints: { loud: 'The pair is two voices on one microphone. What does the booster see when both peak at once?', quiet: 'The quietest input is the last one to reach the edge.' },
        explain: 'When both voices peak together the booster sees their sum, which is bigger than the loud caller. Size for that. The knob is yours: find the setting.',
        onSolved: () => { state.unlocked = true; render(); }, focusAfter: () => $('gain'),
      });
    }

    if (!explore) {
      ['size-control', 'tone-choice', 'pin', 'jump', 'key-marks'].forEach(k => { $(k).hidden = true; });
      ['task', 'gain-control', 'callers', 'key-mark'].forEach(k => { $(k).hidden = false; });
      $('callers').setAttribute('aria-label', 'Which caller to play and meter');
      $('ideal').textContent = 'Ideal, no clipping';
    }
    buildAsks();

    $('size').addEventListener('input', () => { state.size = Math.round(Number($('size').value) * 100) / 100; state.moved = true; render(); });
    host.querySelectorAll('[data-tone]').forEach(b => b.addEventListener('click', () => { state.tone = b.dataset.tone === 'voice' ? 'voice' : Number(b.dataset.tone); render(); }));
    $('pin').addEventListener('click', () => { const v = exploreView(); state.pinned = { tone: state.tone, size: state.size, y: v.y.slice(), buzz: v.buzz }; render(); });
    $('play').addEventListener('click', () => (audio.playing ? audio.stop() : audio.play(render8k)));
    $('ideal').addEventListener('click', () => { state.ideal = !state.ideal; render(); });
    $('gain').addEventListener('input', () => { state.gain = Math.round(Number($('gain').value) * 10) / 10; render(); });
    host.querySelectorAll('[data-caller]').forEach(b => b.addEventListener('click', () => { state.caller = Number(b.dataset.caller); render(); }));
    $('another').addEventListener('click', () => {
      audio.stop(); state.caseIx = (state.caseIx % (CASES.length - 1)) + 1;
      Object.assign(state, { gain: 4, solved: false, caller: 0 }); buildAsks(); render(); $('gain').focus();
    });
    $('reset').addEventListener('click', () => {
      audio.stop();
      if (explore) Object.assign(state, { size: 0.5, tone: 1000, pinned: null, ideal: false });
      else Object.assign(state, { gain: 4, caller: 0, ideal: false, solved: false });
      render(); $('reset').focus();
    });
    render();
    return { stop: () => audio.stop() };
  }

  K.ask(document.getElementById('predict-clean'), {
    question: 'Which caller comes out as a clean 1,000 Hz tone?',
    options: [['quiet', 'The quiet caller'], ['loud', 'The loud caller'], ['both', 'Both'], ['neither', 'Neither']], right: 'quiet',
    hints: { loud: '4 \u00d7 0.5 = 2.0. Can the chip store 2.0?', both: 'One of them asks the chip for 2.0, and the biggest number it can hold is 1.', neither: '4 \u00d7 0.2 = 0.8. Is 0.8 inside the range from \u22121 to +1?' },
    explain: '4 \u00d7 0.2 = 0.80 stays inside the range, while the loud caller asks for 2.00. Here are both, sample by sample.',
    onSolved: () => document.dispatchEvent(new CustomEvent('k:solved', { detail: 'predict-clean' })),
  });

  const act1 = mountBooster(document.getElementById('lab'), 'explore');
  document.getElementById('start-act2').addEventListener('click', () => {
    act1.stop();
    const mount = document.getElementById('act2-mount'), host = document.createElement('div');
    host.className = 'lab'; host.id = 'lab2';
    mount.replaceChildren(host);
    mountBooster(host, 'fix');
    host.querySelector('.k-ask button').focus();
  });

  const SYSTEMS = {
    smoother: { rule: 'output[n] = (input[n] + input[n - 1]) / 2', run: x => n => (x(n) + x(n - 1)) / 2, moves: false,
      hint: 'Average two neighboring samples of a steady tone: do you get back the same steady wave, only smaller and shifted?',
      why: 'The smoother is linear and time-invariant. Its output is the same 1,000 Hz tone, size 0.92, half a sample late, and every sample passes the neighbor rule, so the buzz meter reads 0%. (The tone has been playing forever here, so n = 0 has an input[−1].)' },
    fader: { rule: 'output[n] = min(n / 8.0, 1.0) * input[n]', run: x => n => Math.min(n / 8, 1) * x(n), moves: true,
      hint: 'Look at what it multiplies sample 1 by, and sample 8. Does it treat every moment the same?',
      why: 'The fader is linear but not time-invariant: its ramp over the first 8 samples bends the tone. At n = 1 the neighbors sum to 0, but 1.414 × 0.09 is 0.13, so the rule fails and the meter moves. (It reads high because it sees only 16 samples, half of them fade-in; on a real call the fade is a brief click.)' },
    add: { rule: 'output[n] = input[n] + 0.1', run: x => n => x(n) + 0.1, moves: true,
      hint: 'Feed it silence. What comes out?',
      why: 'Adding 0.1 is not linear: silence would come out as 0.1. The lift is a constant, a 0 Hz tone of size 0.1 that nobody said, so the buzz meter reads 10%.' },
  };
  const sys = { name: 'smoother', solved: {} };
  const sysData = () => {
    const x = n => cosd(45 * n), y = SYSTEMS[sys.name].run(x), out = list(y), c = 2 * cosd(45);
    return { x: list(x), y: out, marks: list(n => (n < 1 || n > N - 2 ? null : Math.abs(y(n - 1) + y(n + 1) - c * y(n)) < 0.005)), ...buzzOf(out, [1000]) };
  };
  const stage2 = K.stage(document.getElementById('stage2'), s => {
    const { pen, c, w, h } = s, A = { x: 30, y: 12, w: w - 44, h: h - 48 }, d = sysData(), shown = sys.solved[sys.name];
    const P = plotArea(A.x, A.y, A.w, A.h, 1.3), step = A.w / N;
    pen.line([[A.x, P.Y(0)], [A.x + A.w, P.Y(0)]], c.soft, 1);
    pen.text('1', A.x - 6, P.Y(1) + 4, { align: 'right', color: c.soft }); pen.text(`${MINUS}1`, A.x - 6, P.Y(-1) + 4, { align: 'right', color: c.soft });
    d.x.forEach((v, n) => { const x = P.X(n, N) - (shown ? step * 0.18 : 0); pen.line([[x, P.Y(0)], [x, P.Y(v)]], c.soft, 1, [3, 3]); pen.ring(x, P.Y(v), 3, c.soft, 1.2); });
    if (!shown) return;
    if (sys.name === 'add') pen.line([[A.x, P.Y(0.1)], [A.x + A.w, P.Y(0.1)]], c.accent, 1.2, [5, 4]);
    d.y.forEach((v, n) => {
      const x = P.X(n, N) + step * 0.18;
      pen.line([[x, P.Y(0)], [x, P.Y(v)]], c.ink, 1.8); pen.dot(x, P.Y(v), 3.5, c.ink);
      if (d.marks[n] !== null) d.marks[n] ? pen.tick(P.X(n, N), A.y + A.h + 14, c.input) : pen.cross(P.X(n, N), A.y + A.h + 14, c.accent);
      if (n % 4 === 0) pen.text(n === 0 ? 'n = 0' : String(n), P.X(n, N), A.y + A.h + 32, { color: c.soft, size: 10 });
    });
  }, { height: w => (w < 560 ? 210 : 200) });
  function renderSystems(focusAsk = false) {
    const S = SYSTEMS[sys.name], d = sysData();
    document.querySelectorAll('[data-system]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.system === sys.name)));
    document.getElementById('sys-rule').textContent = S.rule;
    K.meter(document.getElementById('sys-meter'), d.buzz, { known: Boolean(sys.solved[sys.name]) });
    K.ask(document.getElementById('sys-ask'), {
      question: 'Does the buzz meter move for this system?',
      options: [['moves', 'The meter moves'], ['still', 'It stays at 0%']], right: S.moves ? 'moves' : 'still',
      hints: { moves: S.hint, still: S.hint }, explain: S.why, solved: sys.solved[sys.name] || null,
      onSolved: shown => { sys.solved[sys.name] = shown ? 'shown' : 'right'; renderSystems(); document.querySelector('#sys-ask .k-feedback').focus(); },
    });
    stage2.redraw();
    if (focusAsk) document.querySelector('#sys-ask button:not(:disabled)')?.focus();
  }
  document.querySelectorAll('[data-system]').forEach(b => b.addEventListener('click', () => { sys.name = b.dataset.system; renderSystems(); }));
  renderSystems();
})();
