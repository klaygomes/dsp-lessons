import { launchChrome } from '/Users/cleiton.loiola/.local/share/klay-learning-ladder/motionmaxxing/scripts/_cdp.mjs';
const url = 'file:///Users/cleiton.loiola/personal/dsp-lessons/10-fir-windows/4-video/film/index.html';
const ch = await launchChrome({});
const page = await ch.newPage({ width: 1920, height: 1080 });
await page.goto(url);
await page.eval('window.__ready');
const dur = await page.eval('window.__duration');
const found = new Map();
for (let f = 0; f < Math.round(dur * 30); f += 3) {
  const r = await page.eval(`(async () => { await window.__seek(${f / 30});
    const els = [...document.querySelectorAll('.lbl,.note')].filter(e => { let n = e; while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; n = n.parentElement; } return true; });
    const bx = els.map(e => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { t: e.textContent, x0: b.left, x1: b.right, y0: b.top + 6, y1: b.bottom - 6 }; });
    const out = [];
    bx.forEach((a, i) => { if (a.x0 < 0 || a.x1 > 1920 || a.y0 < 0) out.push('edge: ' + a.t); if (a.y1 > 900) out.push('band: ' + a.t);
      bx.slice(i + 1).forEach(b => { if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push(a.t + ' / ' + b.t); }); });
    return out; })()`);
  r.forEach(k => { if (!found.has(k)) found.set(k, f); });
}
console.log('misses', JSON.stringify(await page.eval('window.__misses')));
for (const [k, f] of found) console.log((f / 30).toFixed(1), k);
await ch.close();
