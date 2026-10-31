export const SAMPLE_RATE = 8000;
export const NYQUIST = SAMPLE_RATE / 2;
export const TONE_STEP = 50;
export const RADIUS_MAX = 0.98;
export const DEFAULTS = { notchTone: 2000, radius: 0.9 };

export const clampTone = (tone) => Math.min(NYQUIST, Math.max(0, tone));
export const clampRadius = (radius) => Math.min(RADIUS_MAX, Math.max(0, radius));

export const angleOfTone = (tone) => (Math.PI * tone) / NYQUIST;
export const toneOfAngle = (angle) => (angle * NYQUIST) / Math.PI;

export const pointOfTone = (tone) => {
  const angle = angleOfTone(tone);
  return [Math.cos(angle), Math.sin(angle)];
};

export const distance = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);

export function filterOf({ notchTone = DEFAULTS.notchTone, radius = DEFAULTS.radius } = {}) {
  const theta = angleOfTone(notchTone);
  const r = clampRadius(radius);
  const zeros = [
    [Math.cos(theta), Math.sin(theta)],
    [Math.cos(theta), -Math.sin(theta)],
  ];
  const poles = zeros.map(([x, y]) => [r * x, r * y]);
  return { theta, radius: r, zeros, poles };
}

export function gainAt(point, filter) {
  const above = filter.zeros.reduce((product, zero) => product * distance(point, zero), 1);
  const below = filter.poles.reduce((product, pole) => product * distance(point, pole), 1);
  return above / below;
}

export function passes(tone, options) {
  const filter = filterOf(options);
  return gainAt(pointOfTone(clampTone(tone)), filter) / gainAt([1, 0], filter);
}

export function measure(tone, options) {
  const filter = filterOf(options);
  const point = pointOfTone(clampTone(tone));
  return {
    tone: clampTone(tone),
    point,
    toZero: distance(point, filter.zeros[0]),
    toPole: distance(point, filter.poles[0]),
    passes: gainAt(point, filter) / gainAt([1, 0], filter),
  };
}
