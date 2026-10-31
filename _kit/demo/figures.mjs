export default k => {
  const { g, text, plot, axes, wheel, vectors, gainCurve, step, cosd } = k;
  return [
    {
      name: 'demo-wheel', w: 720, h: 300, steps: 2, title: 'Wheel, arrows, gain curve',
      desc: 'A dot turning 45 degrees per sample, two arrows added tip to tail, and a gain curve from 0 to 4,000 Hz.',
      caption: 'Kit demo: every primitive the lesson figures do not already use.',
      body: () => {
        const P = plot({ x: 440, y: 50, w: 250, h: 180, xs: [0, 4000], ys: [0, 1.1] });
        return [
          step(1, 'a dot turning counter-clockwise 45 degrees per sample', wheel({ cx: 130, cy: 150, R: 90, stepDeg: 45, count: 8, anim: { d: 0, len: 4 } })),
          g({}, vectors('demo-wheel', [270, 230], [[60, 40], [50, -20, { tone: 'accent' }]], { scale: 1 }), text(330, 250, 'tip to tail', { cls: 'k-tick' })),
          step(2, 'gain falls from 100% at 0 Hz to 0% at 4,000 Hz',
            axes(P, { xTicks: [[0, '0'], [2000, '2,000'], [4000, '4,000 Hz']], yTicks: [[1, '100%'], [0, '0%']], zero: false }),
            gainCurve(P, f => Math.abs(cosd(f / 8000 * 180)), { fill: true, anim: { k: 'draw', d: 1, len: 2 } })),
        ];
      },
    },
  ];
};
