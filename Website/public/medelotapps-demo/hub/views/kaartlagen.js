/* ============================================================
   The historical map under Kaart van Meijel.

   Two hundred years of Meijel stacked in one frame, with a
   slider to walk through them — Kraijenhoff 1815, the TMK of
   1850, the Bonnebladen, the TOP25 sheets, up to 2025.

   WHERE THE MAPS COME FROM
   Kadaster's, harvested once by tools/harvest_kaartlagen.py from
   the map services Esri Nederland publishes as free to reuse
   "onder vermelding van bron: Kadaster". That credit is not
   decoration — it is the condition, so `set.attribution` is
   painted on the map and must stay there. Topotijdreis itself is
   NOT the source and must not become one.

   WHY THE LAYERS LINE UP
   Every layer was cut from the same EPSG:28992 tile grid over the
   same 8.128 km square, so they are aligned by construction: no
   warping, no per-layer offset, no drift. That is what lets ONE
   coordinate in kaart.json put a pin in the right place on all
   forty-seven of them at once.

   WHY IT IS NOT A SLIPPY MAP LIBRARY
   The frame is fixed and small, there are four zoom levels, and
   nothing is ever fetched from a network. What Leaflet would add
   here is a projection engine we don't need and a layer model
   that fights the crossfade. What it would cost is a vendored
   dependency on a kiosk that has to run for a day unattended.

   MEMORY IS THE REASON FOR TILES
   A layer is 5120x5120 native. As one image that is ~100 MB of
   decoded bitmap, and the slider wants the neighbours resident
   too. Tiled, only what is on screen is decoded.
   ============================================================ */
(function () {
    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "kaartlagen." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('kaartlagen.' + String(name)) });

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /**
   * setPointerCapture throws NotFoundError when the pointer is already gone — a
   * lift that lands between the browser dispatching pointerdown and this line,
   * which real touch hardware does produce. Unguarded it takes the rest of the
   * handler down with it and the gesture dies silently. Capture is an
   * optimisation here, not a requirement: pan and pinch work off the pointer
   * map either way.
   */
  function capture(element, pointerId) {
    try { element.setPointerCapture(pointerId); } catch (e) { /* pointer already released */ }
  }

  /**
   * @param {object} set   manifest.mapLayers, as written by the harvester
   * @param {object} opts  { t, onChange } — t() localises, onChange() fires
   *                       after every transform or year change so an overlay
   *                       (the pins) can re-place itself.
   * @returns the map element plus the handful of methods the view needs.
   */
  window.createMapCanvas = function createMapCanvas(set, opts) {
    const t = opts.t || (v => (v && v.nl) || '');
    const ext = set.tileExt || 'webp';
    const levels = set.levels.slice().sort((a, b) => a.z - b.z);
    const maxZ = levels[levels.length - 1].z;

    // "Frame pixels": the native pixel grid of the deepest level. Every
    // geometry below is in these, and the plane's CSS transform is the only
    // place they become screen pixels.
    const FRAME = levels[maxZ].tiles * set.tileSize;
    const { xmin, ymin, xmax, ymax } = set.extent;
    const METRES_PER_PX = (xmax - xmin) / FRAME;

    // Years with a map, in order, and which layer covers each. The gaps are
    // real — nobody surveyed Meijel between 1823 and 1849 — so the slider
    // steps over them rather than offering a year with nothing behind it.
    const years = [];
    const layerForYear = new Map();
    set.layers.forEach(layer => {
      for (let y = layer.from; y <= layer.to; y++) {
        if (!layerForYear.has(y)) { layerForYear.set(y, layer); years.push(y); }
      }
    });
    years.sort((a, b) => a - b);

    // ---------- DOM ----------
    const root = el(`<div class="km-map js-dispose">
      <div class="km-plane">
        <div class="km-layer"></div>
        <div class="km-layer"></div>
      </div>
      <div class="km-surface"></div>
      <div class="km-pins"></div>
      <div class="km-scalebar"><div class="km-scalebar-bar"></div><span></span></div>
      <div class="km-credit"></div>
      <div class="km-controls">
        <button class="km-btn km-zoom-in" aria-label="${t(TEXT.zoomIn)}">+</button>
        <button class="km-btn km-zoom-out" aria-label="${t(TEXT.zoomOut)}">&minus;</button>
        <button class="km-btn km-whole" aria-label="${t(TEXT.whole)}">${iconSvg('map')}</button>
      </div>
      <div class="km-time">
        <button class="km-play">${iconSvg('play')}<span>${t(TEXT.play)}</span></button>
        <div class="km-time-body">
          <div class="km-readout"><strong></strong><span></span></div>
          <div class="km-track"><div class="km-track-fill"></div><div class="km-track-ticks"></div><div class="km-knob"></div></div>
          <div class="km-track-labels"></div>
        </div>
      </div>
    </div>`);

    const plane = root.querySelector('.km-plane');
    const layerEls = [...root.querySelectorAll('.km-layer')];
    const surface = root.querySelector('.km-surface');
    const pinsEl = root.querySelector('.km-pins');
    const track = root.querySelector('.km-track');
    const trackFill = root.querySelector('.km-track-fill');
    const knob = root.querySelector('.km-knob');
    const readoutYear = root.querySelector('.km-readout strong');
    const readoutSheet = root.querySelector('.km-readout span');
    const playBtn = root.querySelector('.km-play');
    const scaleBar = root.querySelector('.km-scalebar-bar');
    const scaleText = root.querySelector('.km-scalebar span');

    plane.style.width = plane.style.height = FRAME + 'px';
    layerEls.forEach(l => { l.style.width = l.style.height = FRAME + 'px'; });
    root.querySelector('.km-credit').textContent = set.attribution || '';

    // ---------- View state ----------
    // cx/cy: the frame-pixel coordinate sitting at the middle of the viewport.
    let scale = 1;              // frame px -> design px
    // Open on the village, not on the middle of the frame. The frame is aligned
    // to the source tile grid, so its centre can sit a few hundred metres out in
    // a field; `focus` is Meijel itself.
    let cx = FRAME / 2, cy = FRAME / 2;
    if (Array.isArray(set.focus) && set.focus.length === 2) {
      cx = (set.focus[0] - xmin) / METRES_PER_PX;
      cy = (ymax - set.focus[1]) / METRES_PER_PX;
    }
    let yearIndex = years.length - 1;
    let front = 0;              // which .km-layer is showing
    let scrubbing = false;
    let dirty = true;
    let raf = 0;

    const viewW = () => root.clientWidth || 1;
    const viewH = () => root.clientHeight || 1;

    // Never show emptiness: the smallest scale is the one where the frame
    // still covers the longer side of the viewport, so there is always map
    // under every pixel and panning is the only way to reach the edges.
    const minScale = () => Math.max(viewW(), viewH()) / FRAME;
    const maxScale = () => 2.2;   // past 1.0 is upsampling; the scans hold no more

    function clampView() {
      scale = clamp(scale, minScale(), maxScale());
      const halfW = viewW() / (2 * scale);
      const halfH = viewH() / (2 * scale);
      cx = clamp(cx, halfW, FRAME - halfW);
      cy = clamp(cy, halfH, FRAME - halfH);
    }

    /** Rijksdriehoek metres -> frame pixels. The whole point of the exercise. */
    function rdToFrame(x, y) {
      return { fx: (x - xmin) / METRES_PER_PX, fy: (ymax - y) / METRES_PER_PX };
    }

    /** Frame pixels -> design pixels within the map element. */
    function frameToView(fx, fy) {
      return { x: (fx - cx) * scale + viewW() / 2, y: (fy - cy) * scale + viewH() / 2 };
    }

    // ---------- Tiles ----------
    // Which level to draw: the one whose native pixels are closest to the
    // pixels it will occupy. The +0.15 bias prefers the sharper level when
    // it's a close call, because a slightly downscaled map reads better than
    // a slightly upscaled one.
    function levelFor(s) {
      const wanted = Math.log2((FRAME * s) / set.tileSize);
      return clamp(Math.round(wanted + 0.15), 0, maxZ);
    }

    function tileUrl(layerId, z, row, col) {
      return `${set.baseUrl}/${layerId}/${z}/${row}_${col}.${ext}`;
    }

    /**
     * Bring one .km-layer up to date. Tiles are keyed by "z/row/col" so a
     * re-render reuses everything already there; the previous level's tiles
     * are kept until the new ones have actually decoded, which is what stops
     * a zoom from flashing white.
     */
    function paintLayer(host, layer, z) {
      if (!host.__tiles) host.__tiles = new Map();
      const tiles = host.__tiles;

      // The z0 tile is one 640px image of the whole frame. It stays under
      // everything forever as the backdrop, so a tile that hasn't arrived
      // shows a blurry version of the right place instead of a white hole.
      if (!host.__base) {
        const base = new Image();
        base.className = 'km-base';
        base.src = tileUrl(layer.id, 0, 0, 0);
        host.appendChild(base);
        host.__base = base;
      } else if (host.__baseLayer !== layer.id) {
        host.__base.src = tileUrl(layer.id, 0, 0, 0);
      }
      host.__baseLayer = layer.id;

      const n = levels[z].tiles;
      const span = FRAME / n;
      const margin = span * 0.5;
      const x0 = cx - viewW() / (2 * scale) - margin;
      const x1 = cx + viewW() / (2 * scale) + margin;
      const y0 = cy - viewH() / (2 * scale) - margin;
      const y1 = cy + viewH() / (2 * scale) + margin;

      const needed = new Set();
      let allReady = true;
      for (let row = Math.max(0, Math.floor(y0 / span)); row <= Math.min(n - 1, Math.floor(y1 / span)); row++) {
        for (let col = Math.max(0, Math.floor(x0 / span)); col <= Math.min(n - 1, Math.floor(x1 / span)); col++) {
          const key = `${z}/${row}/${col}`;
          needed.add(key);
          let img = tiles.get(key);
          if (!img) {
            img = new Image();
            img.className = 'km-tile';
            img.style.left = col * span + 'px';
            img.style.top = row * span + 'px';
            // One frame pixel of overlap. Without it, a fractional plane scale
            // rounds neighbouring tiles apart and rules a grid of hairline
            // white seams across the map.
            img.style.width = img.style.height = (span + 1) + 'px';
            img.dataset.z = z;
            img.src = tileUrl(layer.id, z, row, col);
            img.addEventListener('load', () => { dirty = true; schedule(); });
            host.appendChild(img);
            tiles.set(key, img);
          }
          if (!img.complete) allReady = false;
        }
      }

      tiles.forEach((img, key) => {
        const sameLevel = Number(img.dataset.z) === z;
        // Off-screen tiles of the current level, and every tile of an old
        // level once the new level has finished loading.
        if ((sameLevel && !needed.has(key)) || (!sameLevel && allReady)) {
          img.remove();
          tiles.delete(key);
        }
      });
    }

    function clearLayer(host) {
      if (host.__tiles) host.__tiles.forEach(img => img.remove());
      host.__tiles = new Map();
    }

    // ---------- Render ----------
    function render() {
      raf = 0;
      if (!dirty) return;
      dirty = false;
      clampView();

      plane.style.transform =
        `translate(${viewW() / 2 - cx * scale}px, ${viewH() / 2 - cy * scale}px) scale(${scale})`;

      // While a finger is on the slider the map is being flicked through
      // dozens of years a second, so it draws from the pre-loaded coarse
      // levels; full detail comes back the moment the finger lifts.
      const z = Math.min(levelFor(scale), scrubbing ? 1 : maxZ);
      paintLayer(layerEls[front], currentLayer(), z);

      paintScale();
      if (opts.onChange) opts.onChange();
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(render);
    }

    function invalidate() { dirty = true; schedule(); }

    function paintScale() {
      // A round number of metres that lands near 300 design px wide.
      const target = 300 * METRES_PER_PX / scale;
      const pow = Math.pow(10, Math.floor(Math.log10(target)));
      const metres = [1, 2, 5, 10].map(m => m * pow).find(m => m >= target) || pow * 10;
      scaleBar.style.width = (metres / METRES_PER_PX) * scale + 'px';
      scaleText.textContent = metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;
    }

    // ---------- Year ----------
    function currentLayer() { return layerForYear.get(years[yearIndex]); }

    function setYearIndex(index, immediate) {
      index = clamp(Math.round(index), 0, years.length - 1);
      const wasLayer = currentLayer();
      yearIndex = index;
      const nowLayer = currentLayer();
      paintReadout();

      if (nowLayer === wasLayer) { invalidate(); return; }

      if (immediate) {
        // Scrubbing: no crossfade, the year label is the feedback.
        clearLayer(layerEls[front]);
        invalidate();
        return;
      }

      // Settled: bring the new edition up underneath, then dissolve to it, so
      // the village visibly grows rather than blinking.
      const back = 1 - front;
      clearLayer(layerEls[back]);
      paintLayer(layerEls[back], nowLayer, Math.min(levelFor(scale), maxZ));
      layerEls[back].style.opacity = '0';
      layerEls[back].style.zIndex = '2';
      layerEls[front].style.zIndex = '1';
      requestAnimationFrame(() => {
        layerEls[back].style.opacity = '1';
        front = back;
        invalidate();
      });
      window.setTimeout(() => { clearLayer(layerEls[1 - front]); }, 400);
    }

    function paintReadout() {
      const layer = currentLayer();
      const span = layer.from === layer.to ? `${layer.from}` : `${layer.from}–${layer.to}`;
      readoutYear.textContent = years[yearIndex];
      readoutSheet.textContent = [layer.series, `${t(TEXT.sheet)} ${span}`].filter(Boolean).join(' · ');
      const fraction = yearIndex / (years.length - 1);
      trackFill.style.width = knob.style.left = (fraction * 100) + '%';
    }

    // ---------- Slider ----------
    const ticksEl = root.querySelector('.km-track-ticks');
    const indexOfYear = new Map(years.map((y, i) => [y, i]));
    set.layers.forEach(layer => {
      // One tick per edition: the marks are literally the moments the map of
      // Meijel was redrawn, which is worth seeing even before you drag.
      const i = indexOfYear.get(layer.from);
      if (i === undefined || i === 0) return;
      const tick = el('<i class="km-tick"></i>');
      tick.style.left = (i / (years.length - 1) * 100) + '%';
      ticksEl.appendChild(tick);
    });

    const labelsEl = root.querySelector('.km-track-labels');
    [1815, 1850, 1875, 1900, 1925, 1950, 1975, 2000, years[years.length - 1]].forEach(year => {
      const i = indexOfYear.get(year);
      if (i === undefined) return;
      const label = el(`<i>${year}</i>`);
      label.style.left = (i / (years.length - 1) * 100) + '%';
      labelsEl.appendChild(label);
    });

    function yearFromPointer(clientX) {
      const rect = track.getBoundingClientRect();
      const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
      return fraction * (years.length - 1);
    }

    let trackPointer = null;
    track.addEventListener('pointerdown', e => {
      stopPlaying();
      trackPointer = e.pointerId;
      capture(track, e.pointerId);
      scrubbing = true;
      root.classList.add('is-scrubbing');
      setYearIndex(yearFromPointer(e.clientX), true);
    });
    track.addEventListener('pointermove', e => {
      if (trackPointer !== e.pointerId) return;
      setYearIndex(yearFromPointer(e.clientX), true);
    });
    function endScrub(e) {
      if (trackPointer !== e.pointerId) return;
      trackPointer = null;
      scrubbing = false;
      root.classList.remove('is-scrubbing');
      clearLayer(layerEls[front]);   // coarse tiles out, full detail in
      invalidate();
    }
    track.addEventListener('pointerup', endScrub);
    track.addEventListener('pointercancel', endScrub);

    // ---------- Play through time ----------
    let playTimer = 0;
    function stopPlaying() {
      if (!playTimer) return;
      window.clearInterval(playTimer);
      playTimer = 0;
      playBtn.classList.remove('is-playing');
      playBtn.querySelector('span').textContent = t(TEXT.play);
    }
    playBtn.addEventListener('click', () => {
      if (playTimer) { stopPlaying(); return; }
      playBtn.classList.add('is-playing');
      playBtn.querySelector('span').textContent = t(TEXT.stop);
      // Step edition to edition, not year to year: 211 steps of which most
      // change nothing is a progress bar, not a time journey.
      playTimer = window.setInterval(() => {
        const next = set.layers.find(l => l.from > years[yearIndex]);
        if (!next) { setYearIndex(0); return; }
        setYearIndex(indexOfYear.get(next.from));
      }, 1400);
      if (yearIndex === years.length - 1) setYearIndex(0);
    });

    // ---------- Pan / pinch / zoom ----------
    // Deltas arrive in real screen pixels but this element lives on the 3840px
    // design canvas, which is itself scaled to the display (see fitStage in
    // hub.js). Divide by that factor or the map lags behind the finger on any
    // screen that isn't exactly 4K — the same trap interactive.js documents.
    function stageScale() {
      const rect = root.getBoundingClientRect();
      return root.offsetWidth ? rect.width / root.offsetWidth : 1;
    }

    function pointerToFrame(clientX, clientY) {
      const rect = root.getBoundingClientRect();
      const s = stageScale();
      const px = (clientX - rect.left) / s;
      const py = (clientY - rect.top) / s;
      return {
        fx: cx + (px - viewW() / 2) / scale,
        fy: cy + (py - viewH() / 2) / scale,
        px, py,
      };
    }

    /** Move the view so a frame point sits under a given design-pixel point. */
    function anchor(fx, fy, px, py) {
      cx = fx - (px - viewW() / 2) / scale;
      cy = fy - (py - viewH() / 2) / scale;
    }

    const pointers = new Map();
    let pinch = null;
    let lastTap = 0;

    function prune() {
      // A fast lift-and-regrab on real touch hardware can deliver pointerdown
      // before the previous pointerup, which turns one finger into a phantom
      // pinch. The browser's own capture state is the ground truth.
      [...pointers.keys()].forEach(id => {
        if (!surface.hasPointerCapture(id)) pointers.delete(id);
      });
    }

    surface.addEventListener('pointerdown', e => {
      prune();
      capture(surface, e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, moved: 0, at: Date.now() });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const mid = pointerToFrame((a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale, fx: mid.fx, fy: mid.fy };
      }
    });

    surface.addEventListener('pointermove', e => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.moved += Math.hypot(dx, dy);
      p.x = e.clientX; p.y = e.clientY;

      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.dist > 0) scale = clamp(pinch.scale * (dist / pinch.dist), minScale(), maxScale());
        const rect = root.getBoundingClientRect();
        const s = stageScale();
        anchor(pinch.fx, pinch.fy, ((a.x + b.x) / 2 - rect.left) / s, ((a.y + b.y) / 2 - rect.top) / s);
      } else {
        const s = stageScale();
        cx -= (dx / s) / scale;
        cy -= (dy / s) / scale;
      }
      invalidate();
    });

    function endPointer(e) {
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!p) return;
      // Double tap zooms in on the spot, the gesture every visitor tries first.
      if (p.moved < 8 && Date.now() - p.at < 300) {
        const now = Date.now();
        if (now - lastTap < 320) {
          const hit = pointerToFrame(e.clientX, e.clientY);
          scale = clamp(scale * 1.9, minScale(), maxScale());
          anchor(hit.fx, hit.fy, hit.px, hit.py);
          invalidate();
          lastTap = 0;
        } else {
          lastTap = now;
        }
      }
    }
    surface.addEventListener('pointerup', endPointer);
    surface.addEventListener('pointercancel', endPointer);

    // Mouse wheel is for whoever is authoring this on a desktop; the table
    // has no wheel, and nothing below depends on it.
    surface.addEventListener('wheel', e => {
      e.preventDefault();
      const hit = pointerToFrame(e.clientX, e.clientY);
      scale = clamp(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), minScale(), maxScale());
      anchor(hit.fx, hit.fy, hit.px, hit.py);
      invalidate();
    }, { passive: false });

    function zoomBy(factor) {
      scale = clamp(scale * factor, minScale(), maxScale());
      invalidate();
    }
    root.querySelector('.km-zoom-in').addEventListener('click', () => zoomBy(1.6));
    root.querySelector('.km-zoom-out').addEventListener('click', () => zoomBy(1 / 1.6));
    root.querySelector('.km-whole').addEventListener('click', () => {
      scale = minScale();
      cx = cy = FRAME / 2;
      invalidate();
    });

    // ---------- Warm the coarse levels ----------
    // 47 editions x five small images. Loading them up front is what makes
    // dragging the slider feel like a dissolve instead of a slideshow.
    function preload() {
      const queue = [];
      set.layers.forEach(layer => {
        queue.push(tileUrl(layer.id, 0, 0, 0));
        for (let row = 0; row < levels[1].tiles; row++) {
          for (let col = 0; col < levels[1].tiles; col++) queue.push(tileUrl(layer.id, 1, row, col));
        }
      });
      let i = 0;
      (function next() {
        if (i >= queue.length) return;
        const img = new Image();
        img.onload = img.onerror = next;
        img.src = queue[i++];
      })();
    }

    // ---------- Lifecycle ----------
    const observer = new ResizeObserver(() => invalidate());
    observer.observe(root);
    root.addEventListener('view-dispose', () => {
      observer.disconnect();
      stopPlaying();
      if (raf) cancelAnimationFrame(raf);
      layerEls.forEach(clearLayer);
    });

    paintReadout();
    invalidate();
    preload();

    return {
      el: root,
      pinsEl,

      /** Screen position (design px) of an RD coordinate, for the pin overlay. */
      project(x, y) {
        const f = rdToFrame(x, y);
        return frameToView(f.fx, f.fy);
      },

      /** True while the RD point is inside the harvested frame at all. */
      contains(x, y) { return x >= xmin && x <= xmax && y >= ymin && y <= ymax; },

      year() { return years[yearIndex]; },

      setYear(year) {
        const i = indexOfYear.get(year);
        if (i !== undefined) { stopPlaying(); setYearIndex(i); }
      },

      /** Ease the view onto a place — what tapping a name in the list does. */
      focus(x, y, targetScale) {
        stopPlaying();
        const to = rdToFrame(x, y);
        const from = { cx, cy, scale };
        const goal = { cx: to.fx, cy: to.fy, scale: clamp(targetScale || 1.4, minScale(), maxScale()) };
        const started = performance.now();
        (function step(now) {
          const p = Math.min(1, (now - started) / 480);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // ease in/out
          cx = from.cx + (goal.cx - from.cx) * e;
          cy = from.cy + (goal.cy - from.cy) * e;
          scale = from.scale + (goal.scale - from.scale) * e;
          invalidate();
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      },
    };
  };
})();
