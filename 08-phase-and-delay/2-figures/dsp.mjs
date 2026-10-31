export const FS = 8000;
export const W = f => 2 * Math.PI * f / FS;
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const poly = (c, w) => c.reduce((s, ck, k) => [s[0] + ck * Math.cos(w * k), s[1] - ck * Math.sin(w * k)], [0, 0]);
export const resp = (b, a, f) => cdiv(poly(b, W(f)), poly(a, W(f)));
export const NOTCH_R = 0.85;
export const notch = { b: [0.86125, 0, 0.86125], a: [1, 0, 0.7225] };
export const allpass = (r, fHz) => { const c = 2 * r * Math.cos(W(fHz)); return { b: [r * r, -c, 1], a: [1, -c, r * r] }; };
export const gain = (F, f) => Math.hypot(...resp(F.b, F.a, f));
const rawPhase = (F, f) => -Math.atan2(...resp(F.b, F.a, f).slice().reverse());
export const phaseDeg = (F, f) => {
  let p = 0, prev = rawPhase(F, 0);
  const n = Math.max(1, Math.ceil(f / 5));
  for (let i = 1; i <= n; i++) { const q = rawPhase(F, f * i / n); let d = q - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; p += d; prev = q; }
  return p * 180 / Math.PI;
};
export const gd = (F, f, h = 0.01) => {
  const d = rawPhase(F, f + h) - rawPhase(F, f - h);
  const dd = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return dd / (W(f + h) - W(f - h));
};
export const gdTotal = (r, fHz, f) => gd(notch, f) + gd(allpass(r, fHz), f);
export const spread = (r, fHz, lo = 1000, hi = 1800, step = 5) => {
  let mn = Infinity, mx = -Infinity, at = [0, 0];
  for (let f = lo; f <= hi + 1e-9; f += step) { const v = gdTotal(r, fHz, f); if (v < mn) { mn = v; at[0] = f; } if (v > mx) { mx = v; at[1] = f; } }
  return { spread: mx - mn, min: mn, max: mx, at };
};
export const notchSpread = (lo = 1000, hi = 1800, step = 5) => { let mn = Infinity, mx = -Infinity; for (let f = lo; f <= hi; f += step) { const v = gd(notch, f); mn = Math.min(mn, v); mx = Math.max(mx, v); } return mx - mn; };
