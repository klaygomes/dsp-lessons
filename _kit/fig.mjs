const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = v => Math.round(v * 100) / 100;

export const fmt = (v, digits = 2) => {
  const s = Math.abs(v) < 0.5 * 10 ** -digits ? (0).toFixed(digits) : Math.abs(v).toFixed(digits);
  return (v < 0 && Number(s) !== 0 ? '−' : '') + s;
};
export const hz = f => Math.round(f).toLocaleString('en-US');
export const deg = d => `${fmt(d, Number.isInteger(d) ? 0 : 1)}°`;
export const cosd = d => Math.cos(d * Math.PI / 180);
export const sind = d => Math.sin(d * Math.PI / 180);
export const range = (a, b, step = 1) => { const out = []; for (let v = a; v <= b + 1e-9; v += step) out.push(v); return out; };

const DASHED = /\bk-(curve-soft|curve-accent|stem-soft|ring-missing|guide|edge|spoke-line)\b/;

export function attrs(o = {}) {
  let { anim, cls, style, ...rest } = o;
  if (anim?.k === 'draw' && DASHED.test(cls || '')) {
    anim = { ...anim, k: 'in' };
    delete rest.pathLength;
  }
  const classes = [cls, anim && `k-a-${anim.k}`].filter(Boolean).join(' ');
  const vars = anim ? Object.entries(anim).filter(([k]) => k !== 'k').map(([k, v]) => `--${k}:${typeof v === 'number' && /^(dx|dy)$/.test(k) ? `${r2(v)}px` : v}`) : [];
  const css = [...vars, style].filter(Boolean).join(';');
  return [
    classes && `class="${classes}"`,
    css && `style="${css}"`,
    ...Object.entries(rest).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => `${k}="${esc(v)}"`),
  ].filter(Boolean).join(' ');
}

const el = (tag, o, inner) => inner === undefined ? `<${tag} ${attrs(o)}/>` : `<${tag} ${attrs(o)}>${inner}</${tag}>`;

export const g = (o, ...kids) => el('g', o, kids.flat().join(''));
export const line = (x1, y1, x2, y2, o = {}) => el('line', { x1: r2(x1), y1: r2(y1), x2: r2(x2), y2: r2(y2), cls: 'k-line', ...o });
export const path = (d, o = {}) => el('path', { d, cls: 'k-line', fill: 'none', ...o });
export const rect = (x, y, w, h, o = {}) => el('rect', { x: r2(x), y: r2(y), width: r2(w), height: r2(h), ...o });
export const circle = (cx, cy, r, o = {}) => el('circle', { cx: r2(cx), cy: r2(cy), r, ...o });
export const text = (x, y, s, o = {}) => {
  const { anchor = 'middle', ...rest } = o;
  return el('text', { x: r2(x), y: r2(y), 'text-anchor': anchor, cls: 'k-label', ...rest }, esc(s));
};

export function masked(x, y, s, o = {}) {
  const { anchor = 'middle', size = 12, pad = 4, cls = 'k-label', anim, ...rest } = o;
  const w = String(s).length * size * 0.62 + pad * 2, h = size + 2;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + pad : x - pad;
  return g({ anim }, rect(left, y - size + 1, w, h, { cls: 'k-mask' }), text(x, y, s, { anchor, cls, ...rest }));
}

export function plot({ x, y, w, h, xs, ys }) {
  const X = v => x + (v - xs[0]) / (xs[1] - xs[0]) * w;
  const Y = v => y + h - (v - ys[0]) / (ys[1] - ys[0]) * h;
  return { X, Y, x0: x, x1: x + w, y0: y, y1: y + h, w, h, xs, ys };
}

export function axes(P, o = {}) {
  const { xTicks = [], yTicks = [], zero = true, xTitle, yTitle, frame = false, grid = false } = o;
  const out = [];
  if (frame) out.push(rect(P.x0, P.y0, P.w, P.h, { cls: 'k-frame', fill: 'none' }));
  if (grid) yTicks.forEach(([v]) => out.push(line(P.x0, P.Y(v), P.x1, P.Y(v), { cls: 'k-grid' })));
  if (zero && P.ys[0] <= 0 && P.ys[1] >= 0) out.push(line(P.x0, P.Y(0), P.x1, P.Y(0), { cls: 'k-axis' }));
  else out.push(line(P.x0, P.y1, P.x1, P.y1, { cls: 'k-axis' }));
  yTicks.forEach(([v, s]) => out.push(text(P.x0 - 8, P.Y(v) + 4, s ?? fmt(v), { anchor: 'end', cls: 'k-tick' })));
  const base = zero && P.ys[0] <= 0 && P.ys[1] >= 0 ? P.y1 : P.y1;
  xTicks.forEach(([v, s]) => out.push(text(P.X(v), base + 18, s ?? String(v), { cls: 'k-tick' })));
  if (xTitle) out.push(text(P.x1, base + 36, xTitle, { anchor: 'end', cls: 'k-tick' }));
  if (yTitle) out.push(text(P.x0, P.y0 - 10, yTitle, { anchor: 'start', cls: 'k-tick' }));
  return g({}, out);
}

export function band(P, lo, hi, o = {}) {
  const { label, edges = true, cls = 'k-band', labelAt = 'start' } = o;
  const out = [rect(P.x0, P.Y(hi), P.w, P.Y(lo) - P.Y(hi), { cls })];
  if (edges) out.push(line(P.x0, P.Y(hi), P.x1, P.Y(hi), { cls: 'k-edge' }), line(P.x0, P.Y(lo), P.x1, P.Y(lo), { cls: 'k-edge' }));
  if (label) out.push(text(labelAt === 'start' ? P.x0 + 6 : P.x1 - 6, P.Y(hi) + 15, label, { anchor: labelAt === 'start' ? 'start' : 'end', cls: 'k-note' }));
  return g({}, out);
}

export function sampled(fn, from, to, n = 200) {
  return range(0, n).map(i => { const t = from + (to - from) * i / n; return [t, fn(t)]; });
}

export function curve(P, fn, o = {}) {
  const { from = P.xs[0], to = P.xs[1], n = 240, cls = 'k-curve', ...rest } = o;
  const pts = sampled(fn, from, to, n);
  const d = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${r2(P.X(t))} ${r2(P.Y(v))}`).join('');
  return path(d, { cls, pathLength: rest.anim?.k === 'draw' ? 1 : undefined, ...rest });
}

export function stems(P, pts, o = {}) {
  const { cls = 'k-stem', dot = 4.5, hollow = false, labels = false, labelCls = 'k-num', each, base = 0 } = o;
  return g({}, pts.map(([n, v], i) => {
    const x = P.X(n), y = P.Y(v), b = P.Y(base);
    const kid = [line(x, b, x, y, { cls }), dot ? circle(x, y, dot, { cls: `${cls}-dot${hollow ? ' k-hollow' : ''}` }) : ''];
    if (labels) {
      const s = typeof labels === 'function' ? labels(v, n, i) : fmt(v);
      if (s) kid.push(text(x, v >= base - 1e-9 ? y - 10 : y + 20, s, { cls: labelCls }));
    }
    return g(each ? each(n, v, i) : {}, kid);
  }));
}

export function bars(P, data, o = {}) {
  const { width = 14, labels = true, labelCls = 'k-num' } = o;
  return g({}, data.map(({ x, v, label, cls = 'k-bar', fill, anim }) => {
    const left = P.X(x) - width / 2, top = P.Y(v);
    const kid = [rect(left, top, width, P.Y(0) - top, { cls, fill })];
    if (labels && label !== '') kid.push(text(P.X(x), top - 8, label ?? fmt(v, 3), { cls: labelCls }));
    return g({ anim }, kid);
  }));
}

export function gainCurve(P, fn, o = {}) {
  const { fill = false, ...rest } = o;
  const out = [];
  if (fill) {
    const pts = sampled(fn, P.xs[0], P.xs[1], 240);
    const d = `M${r2(P.X(P.xs[0]))} ${r2(P.Y(0))}` + pts.map(([t, v]) => `L${r2(P.X(t))} ${r2(P.Y(v))}`).join('') + `L${r2(P.X(P.xs[1]))} ${r2(P.Y(0))}Z`;
    out.push(path(d, { cls: 'k-fill' }));
  }
  out.push(curve(P, fn, rest));
  return g({}, out);
}

export function defs(slug) {
  const head = (id, cls) => `<marker id="${slug}-${id}" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="${cls}" points="0 0, 8 3, 0 6"/></marker>`;
  return `<defs>${head('arrow', 'k-head')}${head('arrow-accent', 'k-head-accent')}${head('arrow-input', 'k-head-input')}`
    + `<pattern id="${slug}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="k-hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="k-hatch"/></pattern></defs>`;
}

export function arrow(slug, pts, o = {}) {
  const { tone = '', cls = 'k-arrow', ...rest } = o;
  const marker = `url(#${slug}-arrow${tone ? '-' + tone : ''})`;
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join('');
  return path(d, { cls: `${cls}${tone ? ' k-' + tone : ''}`, 'marker-end': marker, ...rest });
}

export function vectors(slug, origin, vecs, o = {}) {
  const { scale = 1, cls = 'k-vec' } = o;
  let [x, y] = origin;
  return g({ cls: 'k-vectors' }, vecs.map(([dx, dy, extra = {}]) => {
    const x2 = x + dx * scale, y2 = y - dy * scale;
    const s = line(x, y, x2, y2, { cls: `spoke ${cls}`, 'marker-end': `url(#${slug}-arrow${extra.tone ? '-' + extra.tone : ''})`, ...extra.attrs });
    [x, y] = [x2, y2];
    return s;
  }));
}

export function wheel(o) {
  const { cx, cy, R, stepDeg, count, start = 0, labels = true, anim = null, trail = true, dotR = 6 } = o;
  const out = [line(cx - R - 12, cy, cx + R + 12, cy, { cls: 'k-axis' }), circle(cx, cy, R, { cls: 'k-wheel', fill: 'none' })];
  const at = d => [cx + R * cosd(d), cy - R * sind(d)];
  if (trail) range(0, count - 1).forEach(i => {
    const [x, y] = at(start + i * stepDeg);
    out.push(circle(x, y, 3, { cls: 'k-stop' }));
    if (labels) { const [lx, ly] = [cx + (R + 16) * cosd(start + i * stepDeg), cy - (R + 16) * sind(start + i * stepDeg)]; out.push(text(lx, ly + 4, String(i), { cls: 'k-tick' })); }
  });
  const [x0, y0] = at(start + (count - 1) * stepDeg);
  const turn = anim ? { k: 'turn', r0: `${(count - 1) * stepDeg}deg`, steps: count, ...anim } : undefined;
  out.push(g({ anim: turn, style: anim ? `transform-origin:${cx}px ${cy}px` : undefined }, line(cx, cy, x0, y0, { cls: 'k-spoke-line spoke' }), circle(x0, y0, dotR, { cls: 'k-dot' })));
  return g({}, out);
}

export const check = (x, y, o = {}) => g({ cls: 'k-check', ...o }, path(`M${x - 7} ${y}L${x - 2} ${y + 5}L${x + 8} ${y - 6}`, { cls: 'k-mark-ok' }));
export const cross = (x, y, o = {}) => g({ cls: 'k-cross', ...o }, path(`M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x + 6} ${y - 6}L${x - 6} ${y + 6}`, { cls: 'k-mark-bad' }));

export function box(x, y, w, h, o = {}) {
  const { name, sub, cls = 'k-box', anim } = o;
  const out = [rect(x, y, w, h, { cls: 'k-mask-box', rx: 6 }), rect(x, y, w, h, { cls, rx: 6 })];
  if (name) out.push(text(x + w / 2, y + h / 2 + (sub ? -4 : 5), name, { cls: 'k-name' }));
  if (sub) out.push(text(x + w / 2, y + h / 2 + 16, sub, { cls: 'k-tick' }));
  return g({ anim }, out);
}

export function step(n, label, ...kids) {
  return g({ 'data-motion-item': '', 'data-step': n, 'aria-label': label }, ...kids);
}

export function legend(slug, x, y, items, o = {}) {
  const { dx = 200, dy = 22, cols = items.length } = o;
  return g({}, items.map(([kind, label], i) => {
    const lx = x + (i % cols) * dx, ly = y + Math.floor(i / cols) * dy;
    const stem = c => [line(lx + 10, ly + 6, lx + 10, ly - 8, { cls: c }), circle(lx + 10, ly - 8, 4, { cls: `${c}-dot` })];
    const mark = kind === 'stem' || kind === 'stem-accent' || kind === 'stem-soft' || kind === 'stem-input' ? stem(`k-${kind}`)
      : kind === 'hatch' ? [rect(lx + 2, ly - 9, 16, 14, { fill: `url(#${slug}-hatch)`, cls: 'k-bar-hatch' })]
      : kind === 'bar' ? [rect(lx + 2, ly - 9, 16, 14, { cls: 'k-bar' })]
      : kind === 'ring' ? [circle(lx + 10, ly - 2, 6, { cls: 'k-ring-missing' })]
      : [line(lx, ly - 1, lx + 24, ly - 1, { cls: `${kind} k-legend-line` })];
    return g({}, mark, text(lx + 32, ly + 3, label, { anchor: 'start', cls: 'k-label' }));
  }));
}

export function svg({ slug, title, desc, w, h, steps = 0, variant = '' }, ...body) {
  const root = steps ? ` data-motion-root data-motion-mode="reveal" data-step-count="${steps}"` : '';
  return `<svg class="k-fig${variant ? ` k-${variant}` : ''}" id="fig-${slug}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${slug}-title ${slug}-desc"${root}>`
    + `<title id="${slug}-title">${esc(title)}</title><desc id="${slug}-desc">${esc(desc)}</desc>${defs(slug)}`
    + `<rect class="k-bg" width="${w}" height="${h}"/>${body.flat().join('')}</svg>`;
}
