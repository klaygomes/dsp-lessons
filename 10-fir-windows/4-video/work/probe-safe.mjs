import { launchChrome } from '/Users/cleiton.loiola/.local/share/klay-learning-ladder/motionmaxxing/scripts/_cdp.mjs';
const url = 'file://' + process.argv[2];
const br = await launchChrome({});
try {
  const page = await br.newPage({ width: 1920, height: 1080, scale: 1 });
  await page.goto(url);
  await page.eval('window.__ready');
  const dur = await page.eval('window.__duration');
  const misses = await page.eval('JSON.stringify(window.__misses)');
  console.log('misses', misses);
  const seen = new Set(); const mins = { l: 1e9, r: 1e9, t: 1e9, b: 0 };
  for (let f = 0; f < dur * 30; f += 3) {
    const t = f / 30;
    await page.eval(`window.__seek(${t})`);
    const res = JSON.parse(await page.eval(`JSON.stringify((() => {
      const vis = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false; } return true; };
      const ls = [...document.querySelectorAll('.lbl, .note')].filter(vis).map(e => { const r = e.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); return { t: e.textContent, x0: q.left, x1: q.right, y0: r.top + 6, y1: r.bottom - 6 }; });
      const out = []; ls.forEach(a => out.push('M ' + [a.x0, 1920 - a.x1, a.y0, a.y1].map(Math.round).join(' ')));
      ls.forEach((a, i) => { if (a.x0 < 96 || a.x1 > 1824 || a.y0 < 54 || a.y1 > 840) out.push('safe/band: ' + a.t + ' ' + [a.x0, a.x1, a.y0, a.y1].map(Math.round));
        ls.slice(i + 1).forEach(b => { if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push('overlap: ' + a.t + ' | ' + b.t); }); });
      return out; })())`));
    for (const r of res) if (r.startsWith('M ')) { const [l, rr, tp, bt] = r.slice(2).split(' ').map(Number); mins.l = Math.min(mins.l, l); mins.r = Math.min(mins.r, rr); mins.t = Math.min(mins.t, tp); mins.b = Math.max(mins.b, bt); } else if (!seen.has(r)) { seen.add(r); console.log(t.toFixed(2), r); }
  }
  console.log('done', seen.size, JSON.stringify(mins));
} finally { await br.close(); }
