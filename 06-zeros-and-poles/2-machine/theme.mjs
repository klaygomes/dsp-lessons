const LIGHT = {
  "--anatomy-page": "#ECE4D6",
  "--anatomy-card": "#F6F1E7",
  "--anatomy-text": "#26272B",
  "--anatomy-strong": "#26272B",
  "--anatomy-muted": "#5E5F66",
  "--anatomy-paper": "#F6F1E7",
  "--anatomy-face": "#FBF8F2",
  "--anatomy-top": "#FCFAF5",
  "--anatomy-shade-0": "#E2D9CA",
  "--anatomy-shade-1": "#E8E1D4",
  "--anatomy-shade-2": "#EEE8DD",
  "--anatomy-shade-3": "#F3EEE5",
  "--anatomy-lit-top": "#FFFDF8",
  "--anatomy-lit-shade": "#F1EBE0",
  "--anatomy-hi": "#26272B",
  "--anatomy-mid": "#7D7B76",
  "--anatomy-lo": "#ADA597",
  "--anatomy-faint": "#D9D0C1",
  "--anatomy-lit": "#D9573B",
  "--anatomy-halo": "#7A6E58",
  "--anatomy-halo-opacity": ".3",
  "--anatomy-dot": "#26272B",
  "--tb-rule": "#D9D0C1",
  "--tb-input": "#2F7F7A",
};

const DARK = {
  "--anatomy-page": "#27292D",
  "--anatomy-card": "#1D1E21",
  "--anatomy-text": "#EEE8DC",
  "--anatomy-strong": "#EEE8DC",
  "--anatomy-muted": "#A6A39C",
  "--anatomy-paper": "#1D1E21",
  "--anatomy-face": "#34373C",
  "--anatomy-top": "#383B41",
  "--anatomy-shade-0": "#26282D",
  "--anatomy-shade-1": "#2B2E33",
  "--anatomy-shade-2": "#303338",
  "--anatomy-shade-3": "#35383D",
  "--anatomy-lit-top": "#41444A",
  "--anatomy-lit-shade": "#34373C",
  "--anatomy-hi": "#EEE8DC",
  "--anatomy-mid": "#9A978F",
  "--anatomy-lo": "#6E6F74",
  "--anatomy-faint": "#4C4E54",
  "--anatomy-lit": "#F07A5C",
  "--anatomy-halo": "#000000",
  "--anatomy-halo-opacity": ".75",
  "--anatomy-dot": "#EEE8DC",
  "--tb-rule": "#3A3C41",
  "--tb-input": "#5FB3AC",
};

const SHARED = {
  "--anatomy-weight": ".6px",
  "--anatomy-ease": "cubic-bezier(.32,.72,0,1)",
  "--anatomy-mono": '"Geist Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace',
  "--tb-sans": 'Geist,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  "--tb-input-top": "color-mix(in srgb,var(--tb-input) 26%,var(--anatomy-top))",
  "--tb-input-side": "color-mix(in srgb,var(--tb-input) 34%,var(--anatomy-shade-1))",
};

const declarations = (tokens) => Object.entries(tokens).map(([name, value]) => `${name}:${value}`).join(";");

function parts(scope) {
  return [
    `${scope} .tb-input>.iso-edge{stroke:var(--tb-input)}`,
    `${scope} .tb-input>.iso-top{fill:var(--tb-input-top)}`,
    `${scope} .tb-input>.iso-shade{fill:var(--tb-input-side)}`,
    `${scope} .iso-line.tb-input-line{stroke:var(--tb-input)}`,
    `${scope} .tb-hit{fill:transparent;stroke:none;pointer-events:all;touch-action:none;cursor:grab}`,
    `${scope} .iso-line.tb-cord-line{stroke-width:1.5px}`,
    `${scope} .iso-line.tb-cord-line[data-cord="zero"]{stroke:var(--anatomy-hi)}`,
    `${scope} .iso-line.tb-cord-line[data-cord="pole"]{stroke:var(--anatomy-muted);stroke-dasharray:6 2.2 1.4 2.2}`,
    `${scope} .tb-cord-end{stroke-width:1px}`,
    `${scope} .tb-cord[data-cord="zero"] .tb-cord-end{stroke:var(--anatomy-hi)}`,
    `${scope} .tb-cord[data-cord="pole"] .tb-cord-end{stroke:var(--anatomy-muted)}`,
    `${scope} .iso-svg{overflow:hidden}`,
    `${scope} .iso-stage .iso-svg{-webkit-mask-image:linear-gradient(to bottom,transparent,#000 7%,#000 93%,transparent),linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to bottom,transparent,#000 7%,#000 93%,transparent),linear-gradient(to right,transparent,#000 5%,#000 95%,transparent);mask-composite:intersect}`,
  ].join("");
}

export function themeCss(scope, mode) {
  if (mode === "svg") {
    return `${scope}{${declarations({ ...SHARED, ...LIGHT })}}@media (prefers-color-scheme:dark){${scope}{${declarations(DARK)}}}${parts(scope)}${scope} .tb-hit{cursor:default}`;
  }
  return [
    `${scope}{${declarations({ ...SHARED, ...LIGHT })};color-scheme:light;color:var(--anatomy-text);font-family:var(--tb-sans)}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${scope}{${declarations(DARK)};color-scheme:dark}}`,
    `:root[data-theme="dark"] ${scope}{${declarations(DARK)};color-scheme:dark}`,
    `${scope} *{box-sizing:border-box}`,
    parts(scope),
    `${scope} .iso-stage{outline:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent;border-radius:2px}`,
    `${scope} .iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}`,
    `${scope} .iso-stage[data-dragging] .tb-hit{cursor:grabbing}`,
    `${scope} .iso-swatch[data-mark="input"] path{stroke:var(--tb-input)}`,
    `${scope} .iso-swatch[data-mark="edge"] path{stroke:var(--anatomy-hi);stroke-width:1.5}`,
    `${scope} .iso-swatch[data-mark="dashdot"] path{stroke:var(--anatomy-muted);stroke-width:1.5;stroke-dasharray:3 1.3 0.9 1.3}`,
    `@media (max-width:560px){${scope} .iso-plate{padding-bottom:92px}${scope} .iso-plate-corner[data-corner="hint"]{bottom:40px}${scope} .iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.5}}`,
    `${scope} .iso-caption{display:block;font-family:var(--tb-sans)}`,
    `${scope} .tb-sweep{justify-self:start;font:500 14px var(--tb-sans);padding:7px 14px;border:1.5px solid var(--tb-input);border-radius:6px;background:transparent;color:var(--anatomy-text);cursor:pointer}`,
    `${scope} .tb-sweep:focus-visible{outline:2px solid var(--tb-input);outline-offset:2px}`,
    `${scope} .tb-sweep[hidden]{display:none}`,
  ].join("");
}

function blocks(css) {
  const out = [];
  let at = 0;
  while (at < css.length) {
    const open = css.indexOf("{", at);
    if (open < 0) break;
    let depth = 1;
    let end = open + 1;
    while (depth && end < css.length) {
      if (css[end] === "{") depth++;
      else if (css[end] === "}") depth--;
      end++;
    }
    out.push({ prelude: css.slice(at, open).trim(), body: css.slice(open + 1, end - 1) });
    at = end;
  }
  return out;
}

export function scopedCss(css, scope, { self = false } = {}) {
  const renamed = css.replace(/iso-(flow|pulse)(?=[\s{])/g, "tb-iso-$1");
  const prefix = (selector) => {
    const plain = selector.trim();
    if (self && plain.startsWith(".iso-svg")) return `${scope}${plain}`;
    return `${scope} ${plain}`;
  };
  const scopeBlocks = (text) =>
    blocks(text)
      .map(({ prelude, body }) => {
        if (prelude.startsWith("@keyframes")) return `${prelude}{${body}}`;
        if (prelude.startsWith("@media")) return `${prelude}{${scopeBlocks(body)}}`;
        if (prelude === ".iso" || prelude.startsWith(".iso[data-theme")) return "";
        return `${prelude.split(",").map(prefix).join(",")}{${body}}`;
      })
      .join("");
  const plateRule = self ? "" : `${scope} .iso-plate{box-shadow:0 0 0 1px var(--tb-rule)}${scope} .iso-figure{margin:0;padding:0;border:0;max-width:none}${scope} .iso-svg{max-width:100%;max-height:none}`;
  return `${scopeBlocks(renamed)}${plateRule}`;
}
