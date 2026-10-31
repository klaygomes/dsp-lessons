#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import * as kit from './fig.mjs';

const KIT = dirname(fileURLToPath(import.meta.url));
const LADDER = process.env.LADDER_SKILL || join(homedir(), '.claude/skills/klay-learning-ladder');
const [source, only] = process.argv.slice(2);
if (!source) { console.error('usage: build-figures.mjs <lesson>/2-figures/figures.mjs [name]'); process.exit(1); }

const file = resolve(source), out = dirname(file);
const lessonCss = readFileSync(join(LADDER, 'assets/lesson.css'), 'utf8');
const figCss = readFileSync(join(KIT, 'fig.css'), 'utf8');
const mod = await import(pathToFileURL(file));
const figures = typeof mod.default === 'function' ? mod.default(kit) : mod.default;
const fonts = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';

function motionBudget(f, svg) {
  if (!f.steps) return;
  const items = [...svg.matchAll(/data-motion-item="" data-step="(\d+)"/g)].map(m => Number(m[1]));
  const per = items.reduce((m, s) => (m[s] = (m[s] || 0) + 1, m), {});
  const want = Array.from({ length: f.steps }, (_, i) => i + 1);
  if (f.steps > 8) throw new Error(`${f.name}: at most 8 steps`);
  if (items.length > 12) throw new Error(`${f.name}: at most 12 motion items, found ${items.length}`);
  if (want.some(s => !per[s]) || Object.keys(per).some(s => !want.includes(Number(s)))) throw new Error(`${f.name}: steps must be 1..${f.steps}, found ${Object.keys(per)}`);
  if (Object.values(per).some(n => n > 2)) throw new Error(`${f.name}: at most two items per step`);
}

const indexFile = join(out, 'index.json');
const index = only && existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : {};
for (const f of figures) {
  if (only && f.name !== only) continue;
  const variants = [['', f.name, { W: f.w, H: f.h, phone: false }]];
  if (f.phone) variants.push(['.phone', `${f.name}-phone`, { W: f.phone.w, H: f.phone.h, phone: true }]);
  for (const [suffix, slug, L] of variants) {
  const body = typeof f.body === 'function' ? f.body(kit, { ...L, slug }) : f.body;
  const svg = kit.svg({ slug, title: f.title, desc: f.desc, w: L.W, h: L.H, steps: f.steps, variant: f.phone ? (L.phone ? 'narrow' : 'wide') : '' }, body);
  motionBudget(f, svg);
  if ((svg + f.caption).includes(String.fromCharCode(0x2014))) throw new Error(`${f.name}: em dash`);
  const style = `<style id="fig-${f.name}-style">${f.css || ''}</style>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${f.title}</title>
<link href="${fonts}" rel="stylesheet">
<style>${lessonCss}
${figCss}
body { padding: 40px 16px; }
.frame { max-width: ${L.W + 40}px; margin: 0 auto; display: grid; gap: 16px; }
.frame .k-fig { display: block; max-width: none; }
.frame h1 { font-size: 30px; }</style>
${style}
</head>
<body>
<div class="frame">
<p class="topic">${f.eyebrow || 'figure'}</p>
<h1>${f.title}</h1>
<div class="diagram">${svg}</div>
</div>
</body>
</html>
`;
  writeFileSync(join(out, `${f.name}${suffix}.html`), html);
  console.log(`${f.name}${suffix}.html ${f.steps ? `animated, ${f.steps} steps` : 'still'}`);
  }
  index[f.name] = { title: f.title, caption: f.caption, animated: Boolean(f.steps), phone: Boolean(f.phone) };
}
writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
