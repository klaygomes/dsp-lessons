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
  const seen = new Set();
  const mn = { top: 1e9, left: 1e9, right: 1e9, bottom: 1e9 };
  for (let f = 0; f < dur * 30; f += 3) {
    const t = f / 30;
    await page.eval(`window.__seek(${t})`);
    const res = JSON.parse(await page.eval(`JSON.stringify((() => {
      const vis = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false; } return true; };
      const ls = [...document.querySelectorAll('.lbl, .note')].filter(vis).map(e => { const r = e.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); return { t: e.textContent, x0: q.left, x1: q.right, y0: r.top + 6, y1: r.bottom - 6 }; });
      const out = []; const m = { top: 1e9, left: 1e9, right: 1e9, bottom: 1e9 };
      ls.forEach(a => { m.top = Math.min(m.top, a.y0); m.left = Math.min(m.left, a.x0); m.right = Math.min(m.right, 1920 - a.x1); m.bottom = Math.min(m.bottom, 1080 - a.y1); });
      ls.forEach((a, i) => { if (a.x0 < 96 || a.x1 > 1824 || a.y0 < 54 || a.y1 > 900) out.push('safe/band: ' + a.t + ' ' + [a.x0, a.x1, a.y0, a.y1].map(Math.round));
        ls.slice(i + 1).forEach(b => { if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push('overlap: ' + a.t + ' | ' + b.t); }); });
      return { out, m }; })())`));
    for (const k in mn) mn[k] = Math.min(mn[k], res.m[k]);
    for (const r of res.out) if (!seen.has(r)) { seen.add(r); console.log(t.toFixed(2), r); }
  }
  console.log('done', seen.size, 'min margins px: top', Math.round(mn.top), 'left', Math.round(mn.left), 'right', Math.round(mn.right), 'bottom (to frame)', Math.round(mn.bottom));
} finally { await br.close(); }
