import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULTS, NYQUIST, RADIUS_MAX, TONE_STEP, angleOfTone, measure } from "./model.mjs";
import { bench } from "./parts.mjs";
import { scopedCss, themeCss } from "./theme.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ANATOMY = process.env.ANATOMY_HOME ?? join(process.env.HOME, ".local/share/klay-learning-ladder/anatomy");
const k = await import(pathToFileURL(join(ANATOMY, "kit/iso-kit.mjs")).href);
const { kitScript } = await import(pathToFileURL(join(ANATOMY, "scripts/inline-kit.mjs")).href);
const LICENSE = readFileSync(join(ANATOMY, "LICENSE"), "utf8").trim();

const SCOPE = ".tb-machine";
const START = { tone: 1500, radius: DEFAULTS.radius };
const FONTS = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap";

const B = bench(k);
const reading = measure(START.tone, { radius: START.radius });

const valueTextOf = (m, r) =>
  `${Math.round(m.tone).toLocaleString("en-US")} hertz, to zero ${m.toZero.toFixed(2)}, to pole ${m.toPole.toFixed(2)}, r ${r.toFixed(2)}, passes ${Math.round(m.passes * 100)} percent`;

const readoutOf = (m, r) =>
  `${Math.round(m.tone).toLocaleString("en-US")} Hz\u00a0· to zero ${m.toZero.toFixed(2)}\u00a0· to pole ${m.toPole.toFixed(2)}\u00a0· r ${r.toFixed(2)}\u00a0· passes ${Math.round(m.passes * 100)}%`;

const svgBody = (pose) => B.body({ ...pose, passes: measure(pose.tone, { radius: pose.radius }).passes });

const LABEL =
  "A filter test bench. A heavy plate carries an engraved half circle, the top half of the unit circle, with tone marks from 0 Hz at the right to 4,000 Hz at the left. A tone arm pivots under an overhead spindle at the centre, and its stylus rides the rim at the tone being tested. A zero pin stands on the rim at 2,000 Hz and a pole pin rides a carriage on a radial rail on the same line, just inside the rim. Two taut cords run from the stylus to the two pins, and a dial gauge reads how much of the tone passes.";

const CAPTION =
  "The stylus rides the top half of the unit circle: 0 Hz at the right, 4,000 Hz at the left, a long mark every 1,000 Hz. One cord runs to the zero pin on the rim at 2,000 Hz, the other to the pole pin at radius r on the same line. The gauge reads the zero distances multiplied together, divided by the pole distances multiplied together, as a share of the same number at 0 Hz. Only the upper zero and pole are drawn; their mirror pair below the axis is implied, and the gauge counts it.";

const KEYS = [
  { mark: "lit", label: "Needle: how much of the tone passes, 0 to 100%" },
  { mark: "input", label: "Arm handle and carriage knob: what you move" },
  { mark: "raised", label: "Zero pin on the rim, pole pin on its carriage" },
  { mark: "edge", label: "Solid cord: distance to the zero" },
  { mark: "dashdot", label: "Dash-dot cord: distance to the pole" },
];

function swatch(mark) {
  if (mark === "raised" || mark === "lit") {
    return `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z"/><path class="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5"/></svg>`;
  }
  return `<svg class="iso-swatch" data-mark="${mark}" viewBox="0 0 16 10" aria-hidden="true"><path d="M1.5 5h13"/></svg>`;
}

function card(svg) {
  const corner = (name, text, extra = "") => `<span class="iso-plate-corner" data-corner="${name}"${extra}>${text}</span>`;
  const keys = KEYS.map((key) => `<span class="iso-key">${swatch(key.mark)}${key.label}</span>`).join("");
  const stage = `<div class="iso-stage" tabindex="0" role="slider" aria-label="Filter test bench. Drag the tone arm, or use Right and Left arrows to raise and lower the tone; Up and Down arrows move the pole carriage outward and inward." aria-valuemin="0" aria-valuemax="${NYQUIST}" aria-valuenow="${START.tone}" aria-valuetext="${valueTextOf(reading, START.radius)}">${svg}</div>`;
  return `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true">${corner("fig", "Interactive")}${corner("title", "The filter test bench")}${corner("hint", "Drag · ← → tone · ↑ ↓ r")}${corner("readout", readoutOf(reading, START.radius), " data-readout")}</div>${stage}</div><figcaption class="iso-legend"><button type="button" class="tb-sweep" data-sweep hidden>Restart the sweep</button><span class="iso-keys">${keys}</span><span class="iso-caption">${CAPTION}</span></figcaption></figure>`;
}

const figure = (pose, standalone) =>
  k.figureSvg({ width: B.WIDTH, height: B.HEIGHT, label: LABEL, body: svgBody(pose), className: standalone ? "tb-machine" : undefined });

const modelSource = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const liveSource = readFileSync(join(HERE, "live.js"), "utf8");
const config = { P: B.P, R: B.R, CORD_Z: B.CORD_Z, GAUGE: B.GAUGE, ARM: B.ARM, START, TONE_STEP, RADIUS_MAX };
const licenseNote = `/*! Includes the Anatomy kit.\n${LICENSE}\n*/`;
const script = `${licenseNote}\n${kitScript()}\n${modelSource}\nconst BENCH = ${JSON.stringify(config)};\nconst armSolids = ${B.armSolidsSource};\n${liveSource}`;

const style = `${scopedCss(k.ISO_CSS, SCOPE)}${themeCss(SCOPE, "html")}`;
const fragment = `<div class="tb-machine">\n<style>${style}</style>\n${card(figure(START, false))}\n<script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>\n</div>\n`;
writeFileSync(join(HERE, "fragment.html"), fragment);

const page = (theme) =>
  `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The filter test bench</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONTS}"><style>*{box-sizing:border-box}html{color-scheme:${theme}}body{margin:0;background:var(--tb-page-bg);font:15px/1.6 Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}:root{--tb-page-bg:${theme === "light" ? "#ECE4D6" : "#27292D"}}main{width:min(680px,100% - 32px);margin:56px auto 88px}</style></head><body><main>${fragment}</main></body></html>`;
writeFileSync(join(HERE, "machine.html"), page("dark"));
writeFileSync(join(HERE, "machine-light.html"), page("light"));

const standalone = figure(START, true).replace(
  /^<svg([^>]*)>/,
  (open, attrs) => `<svg${attrs} width="${B.WIDTH * 2}" height="${B.HEIGHT * 2}"><!-- Includes styles from the Anatomy kit.\n${LICENSE}\n--><style>${scopedCss(k.ISO_CSS, SCOPE, { self: true })}${themeCss(SCOPE, "svg")}${SCOPE}.iso-svg{overflow:hidden}</style><rect width="${B.WIDTH}" height="${B.HEIGHT}" style="fill:var(--anatomy-card)"/>`,
);
writeFileSync(join(HERE, "figure.svg"), `<?xml version="1.0" encoding="UTF-8"?>\n${standalone}\n`);

const solids = (fragment.match(/class="iso-solid/g) || []).length;
console.log(`solids ${solids} · wrote fragment.html machine.html machine-light.html figure.svg · start ${readoutOf(reading, START.radius)}`);
