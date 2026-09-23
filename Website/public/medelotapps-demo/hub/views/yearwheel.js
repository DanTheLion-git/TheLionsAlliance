/* ============================================================
   Tradities — signature view: het jaarwiel.

   Everything else in this museum is linear: a timeline, a life,
   a film. Traditions are the one subject that is *cyclical*, so
   they get a wheel you spin with one finger.

   The wheel is a DOME: its centre sits just below the bottom of
   the screen, so only the top half is on show. That buys three
   things over a full circle floating in the middle — the ring is
   nearly twice the diameter for the same screen height, the
   labels sit up in open space instead of fighting the wheel, and
   the thing you spin is directly under the visitor's hands at the
   near edge of a table they are standing at.

   Two markers live on the ring: each dated tradition, and
   "vandaag". Both turn with the wheel. Above the apex is a fixed
   pointer, and the readout in the hub names whatever the apex is
   currently over — so spinning has a running answer, while today
   keeps its own place in the year.

   SVG in a centre-origin viewBox (0,0 = the wheel's centre), so
   every radius below reads as a real distance and the view scales
   with the stage without pixel maths of its own.
   ============================================================ */
(function () {
  // ---- Geometry (viewBox units; 0,0 is the wheel centre) ----
  const R_INNER = 268;    // inner edge of the month band / edge of the hub
  const R_OUTER = 430;    // outer edge of the month band
  const R_TICK = 448;     // ten-day ticks sit just outside the band
  const R_DOT = 480;      // marker dots
  const R_PLATE = 588;    // marker name plates
  const PLATE_PAD = 34;   // plate padding either side of the text
  const RING_STEP = 96;   // how far out a colliding plate is pushed
  const MAX_RING = 1;     // rings beyond this would cost more room than they save
  const TOP = 732;        // how far above the centre is visible
  const BOTTOM = 44;      // ...and how far below (a sliver, so it reads as a disc)
  const HALF_W = 825;     // half the visible width

  const FRICTION = 0.94;  // spin decay per frame
  const MIN_SPIN = 0.02;  // deg/frame below which we stop
  // A hard flick should feel weighty, not launch the year into orbit. Without
  // this a fast swipe (or any pointer stream with a near-zero time delta)
  // produces an enormous velocity and the wheel spins dozens of times.
  const MAX_SPIN = 9;     // deg/frame ≈ 1.5 turns/second
  const TAP_SLOP = 12;    // screen px of movement still counted as a tap

  // Cumulative days before each month (non-leap; the wheel shows a season,
  // not a calendar day, so a leap day would be false precision).
  const CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const DAYS_IN_YEAR = 365;

  const MONTHS = {
    nl: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
    en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    de: ['jan', 'feb', 'mär', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'],
    fr: ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'],
  };

  // Winter, lente, zomer, herfst by month index — named in the hub so the
  // colour under the apex is labelled rather than left to be guessed.
  const SEASON_OF_MONTH = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];
  const SEASONS = {
    nl: ['winter', 'lente', 'zomer', 'herfst'],
    en: ['winter', 'spring', 'summer', 'autumn'],
    de: ['Winter', 'Frühling', 'Sommer', 'Herbst'],
    fr: ['hiver', 'printemps', 'été', 'automne'],
  };

    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "yearwheel." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('yearwheel.' + String(name)) });

  // The year's colour, sampled continuously rather than as four flat blocks.
  // Anchors sit at the middle of each season and the ring interpolates between
  // them, so late October really does look like late October. Hue runs
  // 250 → 145 → 95 → 55 → -110 (= 250 again the long way round), which takes
  // the winter transition through a muted rose rather than back through green.
  // Chroma stays low throughout: this is a background, not a paint chart.
  const YEAR_COLOURS = [
    { day: 15, l: 92.5, c: 0.030, h: 250 },   // winter
    { day: 105, l: 93.5, c: 0.045, h: 145 },  // lente
    { day: 196, l: 94.0, c: 0.055, h: 95 },   // zomer
    { day: 288, l: 92.0, c: 0.055, h: 55 },   // herfst
    { day: 380, l: 92.5, c: 0.030, h: -110 }, // winter again (15 + 365)
  ];

  function colourAtDay(day) {
    let d = day;
    while (d < YEAR_COLOURS[0].day) d += DAYS_IN_YEAR;
    while (d > YEAR_COLOURS[YEAR_COLOURS.length - 1].day) d -= DAYS_IN_YEAR;
    for (let i = 0; i < YEAR_COLOURS.length - 1; i++) {
      const a = YEAR_COLOURS[i], b = YEAR_COLOURS[i + 1];
      if (d >= a.day && d <= b.day) {
        const u = (d - a.day) / (b.day - a.day);
        const e = u * u * (3 - 2 * u); // smoothstep: seasons hold, edges blend
        const mix = (p, q) => p + (q - p) * e;
        return `oklch(${mix(a.l, b.l).toFixed(2)}% ${mix(a.c, b.c).toFixed(4)} ${mix(a.h, b.h).toFixed(2)})`;
      }
    }
    return 'oklch(92.5% 0.03 250)';
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }
  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  const dayOfYear = (month, day) => CUM_DAYS[Math.min(11, Math.max(0, month - 1))] + (day || 1);
  /** 0° = 1 January at the apex, running clockwise. */
  const angleFor = (month, day) => (dayOfYear(month, day) / DAYS_IN_YEAR) * 360;

  /** Point on the wheel at a given angle-from-apex and radius. */
  function pointAt(angleDeg, radius) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  }

  /** Shortest distance between two angles, 0°–180°. */
  function angularDistance(a, b) {
    return Math.abs(((a - b + 540) % 360) - 180);
  }

  /** Closed annulus (two circles, even-odd) — the whole band as one shape. */
  function annulusPath(rIn, rOut) {
    return `M${rOut} 0 A${rOut} ${rOut} 0 1 1 ${-rOut} 0 A${rOut} ${rOut} 0 1 1 ${rOut} 0 Z`
         + `M${rIn} 0 A${rIn} ${rIn} 0 1 1 ${-rIn} 0 A${rIn} ${rIn} 0 1 1 ${rIn} 0 Z`;
  }

  /** Annulus sector path between two angles. */
  function ringSector(a1, a2, rIn, rOut) {
    const p1 = pointAt(a1, rOut), p2 = pointAt(a2, rOut);
    const p3 = pointAt(a2, rIn), p4 = pointAt(a1, rIn);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${rOut} ${rOut} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
         + `L${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A${rIn} ${rIn} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`;
  }

  let uid = 0;

  window.buildYearWheel = function buildYearWheel(entities, api) {
    const dated = entities.filter(e => e.date && e.date.month);
    const undated = entities.filter(e => !(e.date && e.date.month));
    const ns = `yw${++uid}`; // filter/gradient ids must not collide between builds

    const view = el(`<div class="yw-view">
      <div class="yw-top">
        <div class="yw-undated"></div>
        <div class="yw-hint">${api.t(TEXT.hint)}</div>
      </div>
      <div class="yw-dome"></div>
    </div>`);

    const dome = view.querySelector('.yw-dome');
    const root = svg('svg', {
      viewBox: `${-HALF_W} ${-TOP} ${HALF_W * 2} ${TOP + BOTTOM}`,
      preserveAspectRatio: 'xMidYMax meet',
      class: 'yw-svg',
    });
    dome.appendChild(root);

    // ---- Defs: one soft shadow for the dome, one for the markers ----
    const defs = svg('defs', {});

    function dropShadow(id, dy, blur, opacity) {
      const f = svg('filter', { id, x: '-60%', y: '-60%', width: '220%', height: '220%' });
      f.appendChild(svg('feDropShadow', {
        dx: 0, dy, stdDeviation: blur,
        'flood-color': 'oklch(42% 0.07 300)', 'flood-opacity': opacity,
      }));
      defs.appendChild(f);
    }
    dropShadow(`${ns}-domeshadow`, 14, 20, 0.20);
    dropShadow(`${ns}-pin`, 5, 7, 0.32);

    // Letterpress: the band should read as pressed *into* the surface rather
    // than laid on top of it. Deliberately a radial-gradient overlay and not an
    // SVG inner-shadow filter — a filter inside the rotor would re-rasterize on
    // every frame of a spin, and sustained frame rate on the table matters more
    // than filter purity. One extra path, no per-frame cost.
    const press = svg('radialGradient', {
      id: `${ns}-press`, gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: R_OUTER,
    });
    const INK = 'oklch(35% 0.05 300)';
    [
      [R_INNER / R_OUTER, 0.22], [0.665, 0.05], [0.70, 0],
      [0.93, 0], [0.972, 0.06], [1, 0.20],
    ].forEach(([offset, opacity]) => {
      press.appendChild(svg('stop', {
        offset: `${(offset * 100).toFixed(2)}%`, 'stop-color': INK, 'stop-opacity': opacity,
      }));
    });
    defs.appendChild(press);

    // The hub reads as a slightly domed disc rather than a flat fill.
    const hubGrad = svg('radialGradient', { id: `${ns}-hub`, cx: '50%', cy: '32%', r: '72%' });
    hubGrad.appendChild(svg('stop', { offset: '0%', 'stop-color': 'oklch(100% 0 0)' }));
    hubGrad.appendChild(svg('stop', { offset: '100%', 'stop-color': 'oklch(96.5% 0.008 300)' }));
    defs.appendChild(hubGrad);

    root.appendChild(defs);

    // The apex arrowhead goes in BEFORE the rotor, so markers paint over it.
    // Today opens sitting exactly on the apex, and a marker half-hidden behind
    // a pointer looks like a mistake — this way the pin reads as resting on it.
    const apexBack = svg('g', { class: 'yw-apex' });
    apexBack.appendChild(svg('line', { x1: 0, y1: -(R_OUTER + 52), x2: 0, y2: -(R_OUTER + 86), class: 'yw-apex-stem' }));
    apexBack.appendChild(svg('path', {
      d: `M0 ${-(R_OUTER + 4)} L-27 ${-(R_OUTER + 56)} L27 ${-(R_OUTER + 56)} Z`,
      class: 'yw-apex-point',
    }));
    root.appendChild(apexBack);

    // Everything that turns lives in one rotor group; the apex pointer and the
    // hub stay put.
    const rotor = svg('g', { class: 'yw-rotor' });
    root.appendChild(rotor);

    // ---- The seasonal ring ----------------------------------------------
    // 73 five-day segments rather than 12 month blocks, so the year fades from
    // season to season instead of stepping. Segments overlap by a whisker
    // because abutting antialiased edges leave hairline seams.
    const ring = svg('g', { class: 'yw-ring', filter: `url(#${ns}-domeshadow)` });
    const SEG_DAYS = 5;
    for (let d = 0; d < DAYS_IN_YEAR; d += SEG_DAYS) {
      const d2 = Math.min(d + SEG_DAYS, DAYS_IN_YEAR);
      ring.appendChild(svg('path', {
        d: ringSector((d / DAYS_IN_YEAR) * 360, (d2 / DAYS_IN_YEAR) * 360 + 0.35, R_INNER, R_OUTER),
        fill: colourAtDay((d + d2) / 2),
      }));
    }
    rotor.appendChild(ring);

    // The pressed edge, over the colour but under everything else.
    rotor.appendChild(svg('path', {
      d: annulusPath(R_INNER, R_OUTER),
      'fill-rule': 'evenodd',
      fill: `url(#${ns}-press)`,
      'pointer-events': 'none',
    }));

    // Hairlines top and bottom of the band, so the soft colour still reads as
    // a made object with edges.
    rotor.appendChild(svg('circle', { cx: 0, cy: 0, r: R_OUTER, class: 'yw-band-edge' }));
    rotor.appendChild(svg('circle', { cx: 0, cy: 0, r: R_INNER, class: 'yw-band-edge' }));

    // ---- Ticks: ten-day marks outside the band, month divisions across it --
    const ticks = svg('g', { class: 'yw-ticks' });
    for (let d = 0; d < DAYS_IN_YEAR; d += 10) {
      const a = (d / DAYS_IN_YEAR) * 360;
      const p1 = pointAt(a, R_OUTER), p2 = pointAt(a, R_TICK);
      ticks.appendChild(svg('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: 'yw-tick' }));
    }
    for (let m = 0; m < 12; m++) {
      const a = angleFor(m + 1, 1);
      const p1 = pointAt(a, R_INNER), p2 = pointAt(a, R_OUTER);
      ticks.appendChild(svg('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: 'yw-month-div' }));
    }
    rotor.appendChild(ticks);

    // ---- Month labels ----------------------------------------------------
    // Set on the curve of the band rather than upright, which is what makes it
    // read as an engraved dial instead of a chart. This only works *because*
    // the wheel is a dome: text following a circle goes upside down along the
    // bottom, and there is no bottom here — the worst case is the two months
    // approaching the horizon, which are rotated towards vertical and are faded
    // out by applyRotation before they get hard to read.
    //
    // The arc is drawn clockwise (sweep flag 1), so the glyphs run left-to-right
    // across the top of the wheel. Reverse it and every month reads mirrored.
    const monthNames = MONTHS[api.lang] || MONTHS.nl;
    const monthLabels = [];
    const R_MID = (R_INNER + R_OUTER) / 2;
    for (let m = 0; m < 12; m++) {
      const a1 = angleFor(m + 1, 1);
      const a2 = m === 11 ? 360 : angleFor(m + 2, 1);
      const p1 = pointAt(a1, R_MID), p2 = pointAt(a2, R_MID);
      const pathId = `${ns}-month${m}`;
      defs.appendChild(svg('path', {
        id: pathId, fill: 'none',
        d: `M${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${R_MID} ${R_MID} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      }));

      const text = svg('text', { class: 'yw-month-label' });
      const onPath = svg('textPath', { href: `#${pathId}`, startOffset: '50%', 'text-anchor': 'middle' });
      onPath.textContent = monthNames[m];
      text.appendChild(onPath);
      rotor.appendChild(text);
      monthLabels.push({ node: text, angle: (a1 + a2) / 2 });
    }

    // ---- Markers ---------------------------------------------------------
    // A tradition and "vandaag" are the same kind of object — a stem off the
    // band, a pin, and an upright name plate — because they answer the same
    // question, "what sits here in the year". Only the styling separates them.
    const markers = [];

    function addMarker({ angle, label, cls, entity, isToday }) {
      const dot = pointAt(angle, R_DOT);
      const base = pointAt(angle, R_OUTER);
      const lab = pointAt(angle, R_PLATE);

      const group = svg('g', { class: `yw-marker ${cls}`, tabindex: '0' });
      // The stem runs from the band all the way to the plate, with the dot
      // threaded onto it — so a plate pushed out to an outer ring stays visibly
      // tied to its point on the year.
      const stem = svg('line', { x1: base.x, y1: base.y, x2: dot.x, y2: dot.y, class: 'yw-stem' });
      group.appendChild(stem);

      const pin = svg('g', { filter: `url(#${ns}-pin)` });
      if (isToday) {
        // A ring around the dot, so today reads as a "you are here" and not as
        // just one more festivity in a different colour.
        pin.appendChild(svg('circle', { cx: dot.x, cy: dot.y, r: 30, class: 'yw-today-halo' }));
      }
      pin.appendChild(svg('circle', { cx: dot.x, cy: dot.y, r: isToday ? 17 : 19, class: 'yw-dot' }));
      group.appendChild(pin);

      // Generous invisible target: a 19-unit dot is a bullseye no finger can hit.
      group.appendChild(svg('circle', { cx: dot.x, cy: dot.y, r: 70, fill: 'none', 'pointer-events': 'all' }));

      const outer = svg('g', { transform: `translate(${lab.x.toFixed(2)} ${lab.y.toFixed(2)})` });
      const spin = svg('g', {});
      const plate = svg('rect', { class: 'yw-plate', rx: 26, ry: 26, x: -120, y: -34, width: 240, height: 68 });
      const text = svg('text', { class: 'yw-plate-label', 'text-anchor': 'middle', 'dominant-baseline': 'central', y: 1 });
      text.textContent = label;
      spin.appendChild(plate);
      spin.appendChild(text);
      outer.appendChild(spin);
      group.appendChild(outer);

      rotor.appendChild(group);
      markers.push({ spin, angle, entity, isToday, group, stem, outer, plate, text, half: 120 });
      return group;
    }

    dated.forEach(entity => {
      addMarker({
        angle: angleFor(entity.date.month, entity.date.day),
        label: api.t(entity.name),
        cls: 'yw-marker-trad',
        entity,
      });
    });

    const now = new Date();
    const todayAngle = angleFor(now.getMonth() + 1, now.getDate());
    addMarker({
      angle: todayAngle,
      label: api.t(TEXT.today),
      cls: 'yw-marker-today',
      entity: null,
      isToday: true,
    });

    // Plates are sized to their text, which means measuring it — and getBBox()
    // returns zeros on a tree that is not in the document yet. So lay them out
    // on the frame after insertion, with a character-count estimate standing in
    // until then (getBBox reports viewBox units, so unlike getBoundingClientRect
    // it is unaffected by the stage's CSS scale — see gotcha 2 in HANDOFF.md).
    //
    // Then push any plate that would collide with an already-placed one out to
    // the next ring. Festivities are placed first, in date order, and "vandaag"
    // last: it is the marker that moves every day, so it is the one that should
    // give way rather than shove the content around.
    function fitPlates() {
      markers.forEach(m => {
        let w = 0;
        try { w = m.text.getBBox().width; } catch (e) { w = 0; }
        if (!w) w = (m.text.textContent || '').length * 18;
        m.half = Math.round(w / 2) + PLATE_PAD;
        m.plate.setAttribute('x', -m.half);
        m.plate.setAttribute('width', m.half * 2);
      });

      const rings = [];
      const order = markers
        .filter(m => !m.isToday).sort((a, b) => a.angle - b.angle)
        .concat(markers.filter(m => m.isToday));

      order.forEach(m => {
        let ring = 0;
        while (ring < MAX_RING) {
          const radius = R_PLATE + ring * RING_STEP;
          const placed = rings[ring] || [];
          const clear = placed.every(o =>
            angularDistance(m.angle, o.angle) >= ((o.half + m.half + 26) / radius) * 180 / Math.PI);
          if (clear) break;
          ring++;
        }
        (rings[ring] = rings[ring] || []).push({ angle: m.angle, half: m.half });

        const radius = R_PLATE + ring * RING_STEP;
        const p = pointAt(m.angle, radius);
        m.outer.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
        const tip = pointAt(m.angle, radius - 38);
        m.stem.setAttribute('x2', tip.x.toFixed(2));
        m.stem.setAttribute('y2', tip.y.toFixed(2));
      });
    }
    fitPlates();
    requestAnimationFrame(fitPlates);

    // ---- Hub: the readout, sitting in the half-disc at the bottom ---------
    // Three lines, coarse to fine: the season, the date at the apex, and the
    // festivity nearest it. Only the top half of this disc is on screen, so
    // everything sits above the centre.
    const hub = svg('g', { class: 'yw-hub' });
    hub.appendChild(svg('circle', { cx: 0, cy: 0, r: R_INNER - 8, fill: `url(#${ns}-hub)`, class: 'yw-hub-disc' }));
    const hubSeason = svg('text', { x: 0, y: -196, class: 'yw-hub-season', 'text-anchor': 'middle' });
    const hubDate = svg('text', { x: 0, y: -128, class: 'yw-hub-date', 'text-anchor': 'middle' });
    const hubName = svg('text', { x: 0, y: -58, class: 'yw-hub-name', 'text-anchor': 'middle' });
    hub.appendChild(hubSeason);
    hub.appendChild(hubDate);
    hub.appendChild(hubName);
    root.appendChild(hub);

    // ---- Apex pointer: fixed, marks the date the wheel has been turned to --
    // The dashed line runs down through the band to the readout, so pointer and
    // hub read as one instrument.
    const apexFront = svg('g', { class: 'yw-apex' });
    apexFront.appendChild(svg('line', { x1: 0, y1: -R_OUTER, x2: 0, y2: -R_INNER, class: 'yw-apex-line' }));
    root.appendChild(apexFront);

    // ---- Rotation --------------------------------------------------------
    let rotation = -todayAngle; // today starts at the apex
    let velocity = 0, spinning = null, gliding = null;

    /** How far a point authored at `angle` currently sits from the apex, 0–180. */
    function fromApex(angle) {
      return Math.abs(((angle + rotation + 540) % 360) - 180);
    }

    function applyRotation() {
      rotor.setAttribute('transform', `rotate(${rotation.toFixed(3)})`);
      // Marker plates stay upright; month names ride the curve, so they are
      // deliberately NOT counter-rotated.
      const counter = `rotate(${(-rotation).toFixed(3)})`;
      markers.forEach(m => m.spin.setAttribute('transform', counter));

      // Fade a month out as it turns towards the horizon, where curved text
      // stands on end.
      monthLabels.forEach(l => {
        const t = Math.max(0, Math.min(1, (86 - fromApex(l.angle)) / 16));
        l.node.style.opacity = t.toFixed(3);
      });

      // The apex is at angle 0, so the date there is whatever the rotation has
      // brought round to it.
      const atTop = ((-rotation) % 360 + 360) % 360;
      const day = Math.round(atTop / 360 * DAYS_IN_YEAR) || 1;
      let month = 11;
      while (month > 0 && CUM_DAYS[month] >= day) month--;
      hubDate.textContent = `${day - CUM_DAYS[month]} ${monthNames[month]}`;
      hubSeason.textContent = (SEASONS[api.lang] || SEASONS.nl)[SEASON_OF_MONTH[month]];

      // Name the nearest tradition, but only when it is genuinely near — an
      // arbitrary "nearest" label four months away would just be noise.
      let best = null, bestDist = Infinity;
      markers.forEach(m => {
        if (!m.entity) return;
        const dist = angularDistance(m.angle, atTop);
        if (dist < bestDist) { bestDist = dist; best = m; }
      });
      const near = best && bestDist < 22 ? best : null;
      hubName.textContent = near ? api.t(near.entity.name) : '';

      markers.forEach(m => {
        m.group.classList.toggle('is-near', m === near);

        // Markers rise and set over the horizon. Without this a marker sitting
        // near 90° is chopped through the middle of its name plate by the
        // bottom edge, which reads as a bug rather than as the edge of the
        // visible year; fading it out over the last few degrees turns the clip
        // into the point of the dome. Hidden ones stop taking taps, so nobody
        // opens a festivity they cannot see.
        const opacity = Math.max(0, Math.min(1, (90 - fromApex(m.angle)) / 12));
        m.group.style.opacity = opacity.toFixed(3);
        m.group.style.pointerEvents = opacity < 0.05 ? 'none' : '';
      });
    }

    /** Ease the wheel to a target rotation — used by "back to today". */
    function glideTo(target) {
      cancelAnimationFrame(spinning);
      cancelAnimationFrame(gliding);
      const from = rotation;
      // Travel the short way round rather than unwinding a whole year.
      let delta = (target - from) % 360;
      if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
      const t0 = performance.now(), dur = 620;
      const step = () => {
        const u = Math.min(1, (performance.now() - t0) / dur);
        const e = 1 - Math.pow(1 - u, 3); // ease-out cubic
        rotation = from + delta * e;
        applyRotation();
        if (u < 1) gliding = requestAnimationFrame(step);
      };
      step();
    }

    // ---- Pointer handling ------------------------------------------------
    // The wheel's centre is at the bottom edge of the SVG, not the middle of
    // its box, so the shared window.pointerAngle (which pivots on an element's
    // bounding-box centre) would measure from the wrong place. Take the pivot
    // from the SVG's own coordinate system instead: getScreenCTM maps viewBox
    // units to screen pixels, including the stage's CSS scale.
    function centreOnScreen() {
      const m = root.getScreenCTM();
      return m ? { x: m.e, y: m.f } : null; // 0,0 in viewBox units *is* the centre
    }
    function angleAt(clientX, clientY) {
      const c = centreOnScreen();
      if (!c) return 0;
      return Math.atan2(clientY - c.y, clientX - c.x);
    }

    let activePointer = null, startAngle = 0, startRotation = 0;
    let lastAngle = 0, lastTime = 0;
    let downX = 0, downY = 0, downMarker = null, moved = 0;

    root.addEventListener('pointerdown', e => {
      if (activePointer !== null) return;
      activePointer = e.pointerId;
      // Capture keeps a spin alive when the finger leaves the SVG, but it is
      // not worth losing the whole gesture over: it throws for a pointer id the
      // browser no longer considers active.
      try { root.setPointerCapture(e.pointerId); } catch (err) { /* spin still works */ }
      cancelAnimationFrame(spinning);
      cancelAnimationFrame(gliding);
      velocity = 0;
      moved = 0;
      downX = e.clientX; downY = e.clientY;
      // Capturing the pointer means the browser will fire the eventual `click`
      // at the capture target rather than at the marker, so the marker's own
      // click listener would never run. Remember what went down under the
      // finger and resolve the tap ourselves on release.
      downMarker = e.target.closest ? e.target.closest('.yw-marker') : null;
      startAngle = lastAngle = angleAt(e.clientX, e.clientY);
      startRotation = rotation;
      lastTime = performance.now();
    });

    root.addEventListener('pointermove', e => {
      if (activePointer !== e.pointerId) return;
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));

      const angle = angleAt(e.clientX, e.clientY);
      let deltaDeg = (angle - startAngle) * 180 / Math.PI;
      if (deltaDeg > 180) deltaDeg -= 360; else if (deltaDeg < -180) deltaDeg += 360;
      rotation = startRotation + deltaDeg;

      const nowMs = performance.now();
      const dt = Math.max(nowMs - lastTime, 1);
      // Wrap the step so crossing the atan2 discontinuity doesn't fling it.
      let step = (angle - lastAngle) * 180 / Math.PI;
      if (step > 180) step -= 360; else if (step < -180) step += 360;
      velocity = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, step * (16 / dt)));
      lastAngle = angle;
      lastTime = nowMs;

      applyRotation();
    });

    function release(e) {
      if (activePointer !== e.pointerId) return;
      activePointer = null;

      if (moved <= TAP_SLOP && downMarker) {
        const hit = markers.find(m => m.group === downMarker);
        downMarker = null;
        if (hit && hit.entity) { api.openDetail(hit.entity); return; }
        if (hit && hit.isToday) { glideTo(-todayAngle); return; }
      }
      downMarker = null;

      // A flick keeps turning and eases out — the wheel should feel like it
      // has weight, which is most of why spinning it is satisfying.
      const decay = () => {
        if (Math.abs(velocity) < MIN_SPIN) {
          // Keep the accumulated angle bounded over a long day of spinning;
          // visually identical, since a full turn is 360°.
          rotation = ((rotation % 360) + 360) % 360 - 360;
          applyRotation();
          return;
        }
        rotation += velocity;
        velocity *= FRICTION;
        applyRotation();
        spinning = requestAnimationFrame(decay);
      };
      decay();
    }
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);

    // Keyboard parity for the markers, since they carry tabindex.
    root.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const group = e.target.closest ? e.target.closest('.yw-marker') : null;
      const hit = group && markers.find(m => m.group === group);
      if (!hit) return;
      e.preventDefault();
      if (hit.entity) api.openDetail(hit.entity);
      else glideTo(-todayAngle);
    });

    // Traditions with no fixed date can't sit on a wheel; list them above it
    // rather than dropping them.
    if (undated.length) {
      const box = view.querySelector('.yw-undated');
      box.appendChild(el(`<div class="coll-section-label">${api.t(TEXT.undated)}</div>`));
      undated.forEach(entity => {
        const chip = el(`<button class="ll-undated-chip">${window.escapeHtml(api.t(entity.name))}</button>`);
        chip.addEventListener('click', () => api.openDetail(entity));
        box.appendChild(chip);
      });
    }

    // The wheel keeps a rAF alive while it coasts; a view torn down mid-spin
    // must not leave one running.
    view.classList.add('js-dispose');
    view.addEventListener('view-dispose', () => {
      cancelAnimationFrame(spinning);
      cancelAnimationFrame(gliding);
    });

    applyRotation();
    return view;
  };

  // ---------- Detail module: decade stack + audio ----------
  //
  // Traditions are the one subject with continuous photo coverage across
  // decades — the same procession, the same corner of the Markt, sixty years
  // apart. That comparison is the point, so media tagged with a year gets
  // stacked chronologically rather than dumped in the generic media strip.
  window.buildTraditionExtra = function buildTraditionExtra(entity, api) {
    const dated = (entity.media || []).filter(m => m.url && m.year).sort((a, b) => a.year - b.year);
    if (!dated.length && !entity.audio) return null;

    const wrap = el(`<div class="td-extra"></div>`);

    if (entity.audio) {
      const audio = el(`<div class="td-audio">
        <button class="td-audio-play">${iconSvg('sound')}<span>${api.t(TEXT.listen)}</span></button>
        <audio src="${entity.audio}" preload="none"></audio>
      </div>`);
      const player = audio.querySelector('audio');
      const button = audio.querySelector('.td-audio-play');
      button.addEventListener('click', () => {
        if (player.paused) { player.play(); button.classList.add('playing'); }
        else { player.pause(); button.classList.remove('playing'); }
      });
      player.addEventListener('ended', () => button.classList.remove('playing'));
      wrap.appendChild(audio);
    }

    if (dated.length) {
      wrap.appendChild(el(`<div class="coll-section-label">${api.t(TEXT.through)}</div>`));
      const stack = el(`<div class="td-stack"></div>`);
      dated.forEach(m => {
        const item = el(`<button class="td-stack-item">
          <div class="td-stack-image" style="${window.bgStyle(m.url)}"></div>
          <div class="td-stack-year">${m.year}</div>
        </button>`);
        stack.appendChild(item);
      });
      wrap.appendChild(stack);
    }

    return wrap;
  };
})();
