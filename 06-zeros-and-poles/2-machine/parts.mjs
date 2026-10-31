import { angleOfTone } from "./model.mjs";

export const WIDTH = 600;
export const HEIGHT = 400;
export const R = 120;
export const RIM_W = 8;
export const RIM_H = 0.6;
export const CORD_Z = 14;

export const PLATE = { x: -146, y: -146, w: 292, d: 200, r: 9 };
export const PLATE_H = 12;
export const FOOT_H = 5;

export const RAIL = { x: -3, y: -115.5, w: 6, d: 131.5, r: 1 };
export const RAIL_H = 2.6;
export const CARRIAGE = { x: -6, y: -1.25, w: 12, d: 16, r: 1.2 };
export const CARRIAGE_Z = RAIL_H;
export const CARRIAGE_TOP = CARRIAGE_Z + 3;
export const PIN_R = 0.85;
export const HEAD_R = 1.15;
export const HEAD_H = 1.3;

export const ARM = {
  elbow: [R - 15, 18],
  tail: 22,
  tip: [R + 1.5, 0],
  barHalf: 2.5,
  legHalf: 2.2,
  shell: { x: R - 3.6, y: -2.7, w: 7.2, d: 5.4, r: 1.2 },
  barZ: 17,
  barH: 2.5,
  shellH: 1.6,
  stylusU: R,
  shellScrews: [R - 1.6, R + 1.6],
};

export const HUB = { r: 5.5, z: ARM.barZ + ARM.barH, h: 5.5 };
export const BEAM_Z = 48;
export const BEAM = { x: -5, y: -7, w: 10, d: 54, r: 4 };
export const COLUMN = [0, 40];

export const GAUGE = { x: 0, y: 6, r: 24, z: 58, h: 7, from: (-150 * Math.PI) / 180, span: (240 * Math.PI) / 180 };
GAUGE.top = GAUGE.z + GAUGE.h;

export function armSolids(phi, P, arm, kit) {
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const along = (u, v) => [u * c + v * s, -u * s + v * c];
  const stick = ([au, av], [bu, bv], half) => {
    const length = Math.hypot(bu - au, bv - av);
    const eu = (bu - au) / length;
    const ev = (bv - av) / length;
    return kit
      .roundedPlan({ x: 0, y: -half, w: length, d: half * 2, r: half * 0.8 }, 4)
      .map(([a, b]) => along(au + a * eu - b * ev, av + a * ev + b * eu));
  };
  const [eu, ev] = arm.elbow;
  const reach = Math.hypot(eu, ev);
  const back = [(-arm.tail * eu) / reach, (-arm.tail * ev) / reach];
  const shellTop = arm.barZ + arm.barH + arm.shellH;
  return {
    bar: kit.extrude(stick(back, arm.elbow, arm.barHalf), arm.barZ, arm.barH, P, { bevel: 0.4 }),
    leg: kit.extrude(stick(arm.elbow, arm.tip, arm.legHalf), arm.barZ, arm.barH, P, { bevel: 0.3 }),
    shell: kit.extrude(kit.roundedPlan(arm.shell, 3).map(([u, v]) => along(u, v)), arm.barZ + arm.barH, arm.shellH, P, { bevel: 0.3 }),
    screws: arm.shellScrews.map((u) => kit.iso([...along(u, 0), shellTop], P)),
    stylus: along(arm.stylusU, 0),
    knob: along(eu, ev),
    weight: along(back[0], back[1]),
  };
}

const SLOT_ROLES = ["fill", "shade0", "shade1", "shade2", "shade3", "top", "crease", "bevel", "edge"];

export function bench(k) {
  const frame = [
    ...Array.from({ length: 13 }, (_, i) => [(R + 9) * Math.cos((Math.PI * i) / 12), -(R + 9) * Math.sin((Math.PI * i) / 12), 0]),
    ...k.boxCorners({ x: GAUGE.x - GAUGE.r, y: GAUGE.y - GAUGE.r, w: GAUGE.r * 2, d: GAUGE.r * 2 }, GAUGE.z, GAUGE.z + GAUGE.h),
    [-R - 9, 0, 0],
    [R + 9, 0, 0],
    [0, 12, 0],
  ];
  const P = k.fitProjection(frame, WIDTH, HEIGHT, { pad: 16, azimuth: 58, elevation: 46 });
  const at = (point) => k.iso(point, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const rimPoint = (angle, radius) => [radius * Math.cos(angle), -radius * Math.sin(angle)];

  function slot(name, paths, { tone = "mid", crease = "faint", className } = {}) {
    const d = {
      fill: paths.fill,
      shade0: paths.shades[0],
      shade1: paths.shades[1],
      shade2: paths.shades[2],
      shade3: paths.shades[3],
      top: paths.top,
      crease: paths.crease,
      bevel: paths.bevel ?? "",
      edge: paths.outline,
    };
    const element = (role) => {
      if (role === "fill") return `<path class="iso-fill" data-role="fill" d="${d.fill}"/>`;
      if (role.startsWith("shade")) return `<path class="iso-shade" data-shade="${role.slice(5)}" data-role="${role}" d="${d[role] || ""}"/>`;
      if (role === "top") return `<path class="iso-top" data-role="top" d="${d.top}"/>`;
      if (role === "crease") return `<path class="iso-line iso-crease" data-tone="${crease}" data-role="crease" d="${d.crease || ""}"/>`;
      if (role === "bevel") return `<path class="iso-line iso-bevel" data-tone="${crease}" data-role="bevel" d="${d.bevel}"/>`;
      return `<path class="iso-line iso-edge" data-tone="${tone}" data-role="edge" d="${d.edge}"/>`;
    };
    return `<g class="iso-solid${className ? ` ${className}` : ""}" data-part="${name}">${SLOT_ROLES.map(element).join("")}</g>`;
  }

  function plate() {
    const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
      out.push(S(k.cylinder(x, y, 7.5, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 5.6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 9, 1.6), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P, 9), { tone: "lo" }));
    const screws = k.corners(PLATE, 11);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.3, 0, P, 18)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    return out.join("");
  }

  function dial() {
    const out = [];
    const steps = 96;
    const outer = Array.from({ length: steps + 1 }, (_, i) => rimPoint((Math.PI * i) / steps, R + RIM_W));
    const inner = Array.from({ length: steps + 1 }, (_, i) => rimPoint(Math.PI - (Math.PI * i) / steps, R));
    out.push(S(k.extrude([...outer, ...inner], 0, RIM_H, P, { convex: false }), { tone: "lo", crease: "none" }));
    out.push(L(k.lineOnTop([-R, 0], [R, 0], 0, P), { tone: "lo" }));
    const minor = [];
    const half = [];
    const major = [];
    for (let i = 0; i <= 40; i++) {
      const angle = (Math.PI * i) / 40;
      const length = i % 10 === 0 ? 5.6 : i % 5 === 0 ? 3.8 : 2.2;
      const d = k.lineOnTop(rimPoint(angle, R), rimPoint(angle, R + length), RIM_H, P);
      (i % 10 === 0 ? major : i % 5 === 0 ? half : minor).push(d);
    }
    out.push(L(minor.join(""), { tone: "lo" }), L(half.join(""), { tone: "mid" }), L(major.slice(1).join(""), { tone: "mid" }), L(major[0], { tone: "hi" }));
    out.push(L(k.ring(0, 0, 2.4, 0, P, 24), { tone: "lo" }));
    out.push(D([at([0, 0, 0])], { size: 0.55, tone: "hi" }));
    return out.join("");
  }

  function labelPlate() {
    const plan = { x: -132, y: 16, w: 44, d: 22, r: 1.6 };
    const out = [S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo", crease: "none" })];
    out.push(L(k.planOutline(k.insetPlan(plan, 1.8), 0.8, P, 4), { tone: "faint" }));
    const rules = [
      [plan.y + 7, 30],
      [plan.y + 12, 22],
      [plan.y + 17, 26],
    ];
    for (const [y, length] of rules) out.push(L(k.lineOnTop([plan.x + 6, y], [plan.x + 6 + length, y], 0.8, P), { tone: "lo", free: true }));
    out.push(D([at([plan.x + plan.w - 4.5, plan.y + 4.5, 0.8]), at([plan.x + plan.w - 4.5, plan.y + plan.d - 4.5, 0.8])], { size: 0.45 }));
    return out.join("");
  }

  function rail() {
    const out = [];
    out.push(S(k.slabOf(RAIL, 0, RAIL_H, P, 3, 0.4), { tone: "mid" }));
    out.push(D([-108, -84, -60, -36, -12, 8].map((y) => at([0, y, RAIL_H])), { size: 0.42, tone: "lo" }));
    const stop = { x: -6.5, y: RAIL.y + RAIL.d, w: 13, d: 5, r: 1.2 };
    out.push(S(k.slabOf(stop, 0, 6.5, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([stop.x + 3, stop.y + 2.5, 6.5]), at([stop.x + stop.w - 3, stop.y + 2.5, 6.5])], { size: 0.45 }));
    return out.join("");
  }

  function radiusScale() {
    const strip = { x: -12.5, y: -116, w: 4.6, d: 118, r: 0.8 };
    const edge = strip.x + strip.w;
    const out = [S(k.slabOf(strip, 0, 0.5, P, 3), { tone: "lo", crease: "none" })];
    const minor = [];
    const major = [];
    for (let i = 0; i <= 19; i++) {
      const y = -(i / 20) * R;
      const length = i % 10 === 0 ? 3.6 : i % 2 === 0 ? 2.4 : 1.4;
      (i % 10 === 0 ? major : minor).push(k.lineOnTop([edge, y], [edge - length, y], 0.5, P));
    }
    out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
    return out.join("");
  }

  function zeroPin() {
    const [x, y] = rimPoint(angleOfTone(2000), R);
    const out = [];
    out.push(S(k.cylinder(x, y, 3, 0, 1.6, P, 28, 0.3), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, PIN_R, 1.6, CORD_Z - HEAD_H - 1.6, P, 16), { tone: "hi", crease: "none" }));
    out.push(S(k.cylinder(x, y, HEAD_R, CORD_Z - HEAD_H, HEAD_H, P, 18), { tone: "hi", crease: "lo" }));
    return out.join("");
  }

  function carriage() {
    const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CARRIAGE, 2), CARRIAGE_Z, 0.1, P)}" style="filter:blur(3px)"/>`];
    const tongue = { x: -10.6, y: -0.45, w: 4.8, d: 0.9, r: 0.3 };
    out.push(S(k.slabOf(tongue, 0.9, 0.6, P, 2), { tone: "mid", crease: "none" }));
    for (const side of [-1, 1]) {
      const gib = { x: side < 0 ? CARRIAGE.x : CARRIAGE.x + CARRIAGE.w - 2.2, y: CARRIAGE.y + 2, w: 2.2, d: CARRIAGE.d - 4, r: 0.6 };
      out.push(S(k.slabOf(gib, 0.8, CARRIAGE_Z - 0.8, P, 2), { tone: "mid", crease: "none" }));
    }
    out.push(S(k.slabOf(CARRIAGE, CARRIAGE_Z, CARRIAGE_TOP - CARRIAGE_Z, P, 4, 0.5), { tone: "mid" }));
    out.push(D([-3.4, 0, 3.4].map((x) => at([x, CARRIAGE.y + CARRIAGE.d - 2.4, CARRIAGE_TOP])), { size: 0.4, tone: "lo" }));
    const neck = { x: CARRIAGE.x + CARRIAGE.w - 0.5, y: 6.2, w: 3.2, d: 3, r: 0.8 };
    out.push(S(k.slabOf(neck, CARRIAGE_Z + 0.8, 2.2, P, 2), { tone: "mid", crease: "none" }));
    const knob = [CARRIAGE.x + CARRIAGE.w + 5.4, 7.7];
    out.push(S(k.cylinder(knob[0], knob[1], 2.8, CARRIAGE_Z, 4.4, P, 24), { tone: "mid", className: "tb-input" }));
    out.push(L(k.knurl(knob[0], knob[1], 2.8, CARRIAGE_Z, CARRIAGE_Z + 4.4, 20, P), { tone: "lo", className: "tb-input-line" }));
    out.push(S(k.cylinder(0, 0, 1.2, CARRIAGE_TOP, 0.8, P, 18), { tone: "mid" }));
    out.push(S(k.cylinder(0, 0, PIN_R, CARRIAGE_TOP + 0.8, CORD_Z - HEAD_H - CARRIAGE_TOP - 0.8, P, 16), { tone: "hi", crease: "none" }));
    out.push(S(k.cylinder(0, 0, HEAD_R, CORD_Z - HEAD_H, HEAD_H, P, 18), { tone: "hi", crease: "lo" }));
    return out.join("");
  }

  function cord(name, from, to, style) {
    const a = at([...from, CORD_Z]);
    const b = at([...to, CORD_Z]);
    return `<g class="iso-wire tb-cord" data-cord="${style}" data-part="${name}"><path class="iso-line tb-cord-line" data-cord="${style}" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/><circle class="iso-wire-end tb-cord-end" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="1.5"/></g>`;
  }

  function stylusAtOrigin() {
    const out = [];
    out.push(S(k.cylinder(0, 0, 0.45, CORD_Z, 1.4, P, 12), { tone: "hi", crease: "none" }));
    out.push(S(k.cylinder(0, 0, 0.85, CORD_Z + 1.4, ARM.barZ - CORD_Z - 1.4, P, 14), { tone: "hi", crease: "none" }));
    return out.join("");
  }

  function knobAtOrigin() {
    const z = ARM.barZ + ARM.barH;
    return [
      S(k.cylinder(0, 0, 3.6, z, 1.2, P, 24), { tone: "mid" }),
      S(k.cylinder(0, 0, 3.2, z + 1.2, 4.2, P, 24), { tone: "mid", className: "tb-input" }),
      L(k.knurl(0, 0, 3.2, z + 1.2, z + 5.4, 22, P), { tone: "lo", className: "tb-input-line" }),
    ].join("");
  }

  function weightAtOrigin() {
    const z0 = ARM.barZ - 3;
    const h = 8.5;
    return [
      S(k.cylinder(0, 0, 6.6, z0, h, P, 40, 0.5), { tone: "mid" }),
      L(k.knurl(0, 0, 6.6, z0 + h - 2.6, z0 + h, 48, P, 0.3), { tone: "lo" }),
      L(k.sideArc(0, 0, 6.6, z0 + h - 2.6, P, 28), { tone: "faint" }),
      L(k.ring(0, 0, 4.2, z0 + h, P, 32), { tone: "faint" }),
      D([at([0, 0, z0 + h])], { size: 0.5 }),
    ].join("");
  }

  function arm(phi) {
    const A = armSolids(phi, P, ARM, k);
    const move = ([x, y]) => k.translateAlong(P, [x, y, 0]);
    return [
      `<g data-part="stylus" transform="${move(A.stylus)}">${stylusAtOrigin()}</g>`,
      slot("arm-bar", A.bar, { tone: "mid" }),
      slot("arm-leg", A.leg, { tone: "mid" }),
      slot("arm-shell", A.shell, { tone: "mid" }),
      `<g class="iso-dots" data-tone="mid" data-part="arm-screws">${A.screws.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.42"/>`).join("")}</g>`,
      `<g data-part="arm-knob" transform="${move(A.knob)}">${knobAtOrigin()}</g>`,
      `<g data-part="arm-weight" transform="${move(A.weight)}">${weightAtOrigin()}</g>`,
    ].join("");
  }

  function spindle() {
    const out = [];
    out.push(S(k.cylinder(0, 0, HUB.r, HUB.z, HUB.h, P, 36, 0.5), { tone: "mid" }));
    out.push(L(k.sideArc(0, 0, HUB.r, HUB.z + 1.4, P, 24), { tone: "faint" }));
    out.push(S(k.cylinder(0, 0, 2.5, HUB.z + HUB.h, BEAM_Z - 4 - HUB.z - HUB.h, P, 20), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(0, 0, 2.5, 33, P, 14), { tone: "faint" }));
    out.push(S(k.cylinder(0, 0, 3.8, BEAM_Z - 4, 4, P, 24), { tone: "mid" }));
    return out.join("");
  }

  function column() {
    const [x, y] = COLUMN;
    const out = [];
    out.push(S(k.cylinder(x, y, 10, 0, 2.2, P, 40, 0.4), { tone: "lo" }));
    out.push(D([0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      return [x + 7.6 * Math.cos(angle), y + 7.6 * Math.sin(angle)];
    }).filter(([px, py]) => (px - x) * Math.cos((58 * Math.PI) / 180) + (py - y) * Math.sin((58 * Math.PI) / 180) > -3).map(([px, py]) => at([px, py, 2.2])), { size: 0.45 }));
    out.push(S(k.cylinder(x, y, 6.2, 2.2, 4, P, 32), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 4.2, 6.2, BEAM_Z - 10 - 6.2, P, 28), { tone: "mid", crease: "none" }));
    out.push(L([16, 26].map((z) => k.sideArc(x, y, 4.2, z, P, 16)).join(""), { tone: "faint" }));
    const clamp = { x: x - 6.5, y: y - 6.5, w: 13, d: 13, r: 2.2 };
    out.push(S(k.slabOf(clamp, BEAM_Z - 10, 10, P, 4, 0.6), { tone: "mid" }));
    const thumb = [clamp.x + clamp.w + 3, y];
    out.push(S(k.slabOf({ x: clamp.x + clamp.w, y: y - 1.4, w: 3, d: 2.8, r: 0.8 }, BEAM_Z - 7, 4, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(thumb[0] + 1.4, thumb[1], 2.6, BEAM_Z - 8, 6, P, 20), { tone: "mid" }));
    out.push(L(k.knurl(thumb[0] + 1.4, thumb[1], 2.6, BEAM_Z - 8, BEAM_Z - 2, 18, P), { tone: "lo" }));
    return out.join("");
  }

  function beam() {
    const out = [];
    out.push(S(k.slabOf(BEAM, BEAM_Z, 5, P, 6, 0.6), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(BEAM, 2.2), BEAM_Z + 5, P, 6), { tone: "faint" }));
    out.push(D([at([0, -2.2, BEAM_Z + 5]), at([0, COLUMN[1] - 4, BEAM_Z + 5]), at([0, COLUMN[1] + 3.5, BEAM_Z + 5])], { size: 0.45 }));
    return out.join("");
  }

  function gauge() {
    const { x, y, r, z, h, top } = GAUGE;
    const out = [];
    const seat = BEAM_Z + 5;
    out.push(S(k.cylinder(x, y, 5.4, seat, 1.6, P, 28, 0.3), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 3.4, seat + 1.6, z - seat - 1.6, P, 20), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: x + r - 1, y: y - 2.4, w: 5, d: 4.8, r: 1.2 }, z + 1.5, 5, P, 3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x + r + 3.6, y: y - 3.2, w: 2.6, d: 6.4, r: 1.2 }, z + 0.8, 6.4, P, 3), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, r, z, h, P, 64, 0.8), { tone: "hi", crease: "lo" }));
    out.push(L(k.knurl(x, y, r, top - 3.2, top, 84, P, 0.3), { tone: "lo" }));
    out.push(L(k.sideArc(x, y, r, top - 3.2, P, 40), { tone: "faint" }));
    out.push(L(k.ring(x, y, r - 2.2, top, P, 64), { tone: "lo" }));
    const ticks = k.radialTicks(x, y, r - 3, 20, 5, top, [1.8, 4.2], P, GAUGE.from, GAUGE.span);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(L(k.ring(x, y, 2.2, top, P, 18), { tone: "mid" }));
    return out.join("");
  }

  const needleOf = (passes) => {
    const angle = GAUGE.from + GAUGE.span * Math.max(0, Math.min(1, passes));
    const sx = Math.sin(angle);
    const sy = -Math.cos(angle);
    return k.lineOnTop([GAUGE.x - sx * 4.5, GAUGE.y - sy * 4.5], [GAUGE.x + sx * (GAUGE.r - 5), GAUGE.y + sy * (GAUGE.r - 5)], GAUGE.top + 0.2, P);
  };

  const hitArea = () => {
    const rim = Array.from({ length: 49 }, (_, i) => at([...rimPoint((Math.PI * i) / 48, R + 20), CORD_Z]));
    return `<path class="tb-hit" data-part="hit" d="${k.pathOf([...rim, at([-R - 20, 20, CORD_Z]), at([R + 20, 20, CORD_Z])], true)}"/>`;
  };

  function body({ tone, radius, passes }) {
    const phi = angleOfTone(tone);
    const stylus = rimPoint(phi, R);
    const zero = rimPoint(angleOfTone(2000), R);
    const pole = [0, -radius * R];
    return [
      plate(),
      dial(),
      labelPlate(),
      radiusScale(),
      rail(),
      zeroPin(),
      cord("cord-zero", stylus, zero, "zero"),
      `<g data-part="carriage" transform="${k.translateAlong(P, [0, pole[1], 0])}">${carriage()}</g>`,
      cord("cord-pole", stylus, pole, "pole"),
      arm(phi),
      spindle(),
      column(),
      beam(),
      gauge(),
      `<path data-part="needle" class="iso-line" data-tone="lit" data-free="" d="${needleOf(passes)}" style="stroke-width:1.6"/>`,
      hitArea(),
    ];
  }

  return { WIDTH, HEIGHT, P, R, CORD_Z, GAUGE, ARM, body, armSolidsSource: armSolids.toString() };
}
