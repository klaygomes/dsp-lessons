const root = [...document.querySelectorAll(".tb-machine")].find((element) => !element.hasAttribute("data-tb-live"));
if (root) mountBench(root);

function mountBench(root) {
  root.setAttribute("data-tb-live", "");
  const { P, R, CORD_Z, GAUGE, ARM, START } = BENCH;
  const stage = root.querySelector(".iso-stage");
  const svg = stage.querySelector("svg");
  const readout = root.querySelector("[data-readout]");
  const part = (name) => svg.querySelector(`[data-part="${name}"]`);
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const kit = { extrude, roundedPlan, iso };
  const camera = cameraOf(P);
  const zeroPoint = [R * Math.cos(angleOfTone(2000)), -R * Math.sin(angleOfTone(2000))];

  const slots = (name) => {
    const group = part(name);
    return Object.fromEntries([...group.querySelectorAll("[data-role]")].map((element) => [element.dataset.role, element]));
  };
  const bar = slots("arm-bar");
  const leg = slots("arm-leg");
  const shell = slots("arm-shell");
  const screws = [...part("arm-screws").querySelectorAll("circle")];
  const stylusGroup = part("stylus");
  const knobGroup = part("arm-knob");
  const weightGroup = part("arm-weight");
  const carriageGroup = part("carriage");
  const needle = part("needle");
  const cordZero = part("cord-zero");
  const cordPole = part("cord-pole");
  const hit = part("hit");

  const writeSolid = (slot, paths) => {
    slot.fill.setAttribute("d", paths.fill);
    paths.shades.forEach((d, index) => slot[`shade${index}`].setAttribute("d", d || ""));
    slot.top.setAttribute("d", paths.top);
    slot.crease.setAttribute("d", paths.crease || "");
    slot.bevel.setAttribute("d", paths.bevel || "");
    slot.edge.setAttribute("d", paths.outline);
  };
  const move = ([x, y]) => translateAlong(P, [x, y, 0]);
  const fixed = (value) => value.toFixed(1);
  const writeCord = (group, from, to) => {
    const a = iso([...from, CORD_Z], P);
    const b = iso([...to, CORD_Z], P);
    group.querySelector("path").setAttribute("d", `M${fixed(a[0])} ${fixed(a[1])}L${fixed(b[0])} ${fixed(b[1])}`);
    const end = group.querySelector("circle");
    end.setAttribute("cx", fixed(b[0]));
    end.setAttribute("cy", fixed(b[1]));
  };
  const needleAt = (share) => {
    const angle = GAUGE.from + GAUGE.span * Math.max(0, Math.min(1, share));
    const sx = Math.sin(angle);
    const sy = -Math.cos(angle);
    return lineOnTop([GAUGE.x - sx * 4.5, GAUGE.y - sy * 4.5], [GAUGE.x + sx * (GAUGE.r - 5), GAUGE.y + sy * (GAUGE.r - 5)], GAUGE.top + 0.2, P);
  };
  const toneText = (tone) => Math.round(tone).toLocaleString("en-US");
  const readoutOf = (m, r) => `${toneText(m.tone)} Hz\u00a0· to zero ${m.toZero.toFixed(2)}\u00a0· to pole ${m.toPole.toFixed(2)}\u00a0· r ${r.toFixed(2)}\u00a0· passes ${Math.round(m.passes * 100)}%`;

  const tone = { x: START.tone, v: 0, target: START.tone };
  const radius = { x: START.radius, v: 0, target: START.radius };
  let frame = 0;
  let last = 0;
  let visible = false;
  let touring = false;
  let tourClock = 0;
  let tourPhase = 0;
  let idleTimer = 0;
  let drag = null;
  let drawn = { tone: NaN, radius: NaN };

  const glide = (state, dt, seconds, calm) => {
    if (calm) {
      state.x = state.target;
      state.v = 0;
      return false;
    }
    const w = 1 / seconds;
    for (let step = 0; step < 4; step++) {
      const h = dt / 4;
      state.v += (w * w * (state.target - state.x) - 2 * w * state.v) * h;
      state.x += state.v * h;
    }
    const scale = Math.max(1, Math.abs(state.target));
    if (Math.abs(state.target - state.x) < 1e-4 * scale && Math.abs(state.v) < 1e-3 * scale) {
      state.x = state.target;
      state.v = 0;
      return false;
    }
    return true;
  };

  const TOUR_LOW = 1200;
  const TOUR_HIGH = 2800;
  const TOUR_PERIOD = 16;
  const tourTone = (clock) => {
    const mid = (TOUR_LOW + TOUR_HIGH) / 2;
    const swing = (TOUR_HIGH - TOUR_LOW) / 2;
    return mid - swing * Math.cos(tourPhase + (2 * Math.PI * clock) / TOUR_PERIOD);
  };
  const startTour = () => {
    if (still.matches) return;
    const mid = (TOUR_LOW + TOUR_HIGH) / 2;
    const swing = (TOUR_HIGH - TOUR_LOW) / 2;
    const share = Math.max(-1, Math.min(1, (mid - tone.x) / swing));
    tourPhase = Math.acos(share) * (tone.v < 0 ? -1 : 1);
    tourClock = 0;
    touring = true;
    run();
  };

  function draw() {
    if (tone.x === drawn.tone && radius.x === drawn.radius) return;
    drawn = { tone: tone.x, radius: radius.x };
    const phi = angleOfTone(tone.x);
    const arm = armSolids(phi, P, ARM, kit);
    writeSolid(bar, arm.bar);
    writeSolid(leg, arm.leg);
    writeSolid(shell, arm.shell);
    arm.screws.forEach(([x, y], index) => {
      screws[index].setAttribute("cx", fixed(x));
      screws[index].setAttribute("cy", fixed(y));
    });
    stylusGroup.setAttribute("transform", move(arm.stylus));
    knobGroup.setAttribute("transform", move(arm.knob));
    weightGroup.setAttribute("transform", move(arm.weight));
    const pole = [0, -radius.x * R];
    carriageGroup.setAttribute("transform", translateAlong(P, [0, pole[1], 0]));
    writeCord(cordZero, arm.stylus, zeroPoint);
    writeCord(cordPole, arm.stylus, pole);
    const m = measure(tone.x, { radius: radius.x });
    needle.setAttribute("d", needleAt(m.passes));
    const text = readoutOf(m, radius.x);
    if (readout.textContent !== text) readout.textContent = text;
  }

  function describe() {
    const m = measure(tone.target, { radius: radius.target });
    stage.setAttribute("aria-valuenow", String(Math.round(tone.target)));
    stage.setAttribute("aria-valuetext", `${toneText(m.tone)} hertz, to zero ${m.toZero.toFixed(2)}, to pole ${m.toPole.toFixed(2)}, r ${radius.target.toFixed(2)}, passes ${Math.round(m.passes * 100)} percent`);
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring) {
      tourClock += dt;
      tone.target = tourTone(tourClock);
    }
    const toneMoving = glide(tone, dt, touring ? 0.5 : 0.14, calm);
    const radiusMoving = glide(radius, dt, 0.14, calm);
    draw();
    frame = visible && (touring || toneMoving || radiusMoving) ? requestAnimationFrame(tick) : 0;
  }
  function run() {
    if (!frame && visible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function takeOver() {
    if (touring) {
      touring = false;
      tone.target = tone.x;
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startTour, 3600);
  }
  const snapTone = (value) => clampTone(Math.round(value / TONE_STEP) * TONE_STEP);
  const snapRadius = (value) => clampRadius(Math.round(value * 100) / 100);
  function setTone(value) {
    takeOver();
    tone.target = snapTone(value);
    describe();
    run();
  }
  function setRadius(value) {
    takeOver();
    radius.target = snapRadius(value);
    describe();
    run();
  }

  const planAt = (event, z) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const u = (point.x - P.origin[0]) / camera.k;
    const w = ((point.y - P.origin[1]) / camera.k + z * camera.cosE) / camera.sinE;
    return [u * camera.sinA + w * camera.cosA, -u * camera.cosA + w * camera.sinA];
  };
  const toneAtPlan = ([x, y]) => {
    let angle = Math.atan2(-y, x);
    if (angle < 0) angle = x >= 0 ? 0 : Math.PI;
    return toneOfAngle(angle);
  };
  const onCarriage = ([x, y]) => Math.abs(x) < 14 && y > -radius.x * R - 8 && y < -radius.x * R + 20;

  hit.addEventListener("pointerdown", (event) => {
    const plan = planAt(event, 5);
    if (!plan) return;
    drag = onCarriage(plan) ? "carriage" : "arm";
    stage.setAttribute("data-dragging", drag);
    hit.setPointerCapture(event.pointerId);
    stage.focus({ preventScroll: true });
    event.preventDefault();
    steer(event);
  });
  const steer = (event) => {
    if (drag === "carriage") {
      const plan = planAt(event, 5);
      if (plan) setRadius(-plan[1] / R);
    } else if (drag === "arm") {
      const plan = planAt(event, CORD_Z);
      if (plan) setTone(toneAtPlan(plan));
    }
  };
  hit.addEventListener("pointermove", (event) => {
    if (drag) steer(event);
  });
  const release = (event) => {
    if (!drag) return;
    drag = null;
    stage.removeAttribute("data-dragging");
    if (hit.hasPointerCapture(event.pointerId)) hit.releasePointerCapture(event.pointerId);
  };
  hit.addEventListener("pointerup", release);
  hit.addEventListener("pointercancel", release);

  stage.addEventListener("keydown", (event) => {
    const toneFrom = touring ? snapTone(tone.x) : tone.target;
    const radiusFrom = radius.target;
    const big = event.shiftKey;
    if (event.key === "ArrowRight") setTone(toneFrom + (big ? 250 : TONE_STEP));
    else if (event.key === "ArrowLeft") setTone(toneFrom - (big ? 250 : TONE_STEP));
    else if (event.key === "ArrowUp") setRadius(radiusFrom + (big ? 0.1 : 0.02));
    else if (event.key === "ArrowDown") setRadius(radiusFrom - (big ? 0.1 : 0.02));
    else if (event.key === "Home") setTone(0);
    else if (event.key === "End") setTone(NYQUIST);
    else return;
    event.preventDefault();
  });

  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    },
    { rootMargin: "120px 0px" },
  ).observe(stage);

  still.addEventListener("change", () => {
    if (still.matches) {
      touring = false;
      clearTimeout(idleTimer);
    }
    run();
  });

  draw();
  describe();
  if (!still.matches) idleTimer = setTimeout(startTour, 1400);
}
