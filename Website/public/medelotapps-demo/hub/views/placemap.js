/* ============================================================
   Kaart van Meijel — signature view: places pinned on the map.

   This app absorbed the four buildings of the retired Gebouwen
   tile (the home grid is 3x3 with a double-width Tijdlijn, so
   nine apps needed ten cells). A building is just a place that
   happens to have walls, so it keeps everything it had — its
   period, its cross-links, and its 3D model or photo turntable
   in the detail view.

   THE MAP IS REAL NOW. It used to be a surveyor's grid, because
   an unrelated archive photograph behind real pins would read as
   the village from above — a lie the pins would then appear to
   confirm. Underneath is Content/Kaart/kaartlagen: forty-seven
   editions of Kadaster's own maps of this square kilometre-and-a-
   bit of the Peel, 1815 to 2025, on a slider. See kaartlagen.js.

   Two honest caveats the design still has to carry:
   - A pin sits at a Rijksdriehoek coordinate, and `place.precision`
     says how well that is known. "street" means the street is
     certain and the spot on it is not; it is drawn as an open ring
     and says so in the list, rather than passing a street centroid
     off as the building.
   - A place with no coordinate at all is listed but not pinned,
     rather than dropped or guessed onto the map.

   The old placeholder canvas is still here, as the fallback for a
   copy of the app whose kaartlagen folder was never harvested.
   ============================================================ */
(function () {
    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "placemap." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('placemap.' + String(name)) });

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  /** A place that had an end date and has passed it — the church that isn't there. */
  function isGone(entity) {
    return !!(entity.period && entity.period.to != null);
  }

  /** The coordinate to pin at, or null. RD is preferred; a fraction still works. */
  function coordOf(entity, set) {
    const place = entity.place;
    if (!place) return null;
    if (Array.isArray(place.rd) && place.rd.length === 2) {
      return { rd: place.rd, precision: place.precision || 'exact' };
    }
    if (typeof place.x === 'number' && typeof place.y === 'number') {
      // Authored against the frame rather than the world. Convert if there is
      // a frame to convert against, so nothing authored earlier is orphaned.
      if (!set || !set.extent) return { fraction: place, precision: 'street' };
      const e = set.extent;
      return {
        rd: [e.xmin + place.x * (e.xmax - e.xmin), e.ymax - place.y * (e.ymax - e.ymin)],
        precision: place.precision || 'street',
      };
    }
    return null;
  }

  window.buildPlaceMap = function buildPlaceMap(entities, api) {
    const set = window.mapLayersFor ? window.mapLayersFor(api.componentId) : null;
    const placed = [];
    const unplaced = [];
    entities.forEach(entity => {
      const coord = coordOf(entity, set);
      (coord ? placed : unplaced).push({ entity, coord });
    });
    const ordered = placed.concat(unplaced);

    const view = el(`<div class="pm-view ${set ? 'has-map' : ''}">
      <div class="pm-stage"></div>
      <div class="pm-list"></div>
    </div>`);
    const stage = view.querySelector('.pm-stage');
    const list = view.querySelector('.pm-list');

    // ---------- The map, or the honest placeholder ----------
    let map = null;
    let pinHost;
    if (set) {
      map = window.createMapCanvas(set, { t: api.t, onChange: placePins });
      stage.appendChild(map.el);
      pinHost = map.pinsEl;
    } else {
      const canvas = el(`<div class="pm-canvas"><div class="pm-note">${api.t(TEXT.provisional)}</div></div>`);
      stage.appendChild(canvas);
      pinHost = canvas;
    }

    // ---------- Pins and rows ----------
    // Numbering follows the list, so the pin labelled 3 is the third row —
    // the only reason the numbers exist is to tie the two together.
    const pins = new Map();   // n -> { el, coord, entity }

    ordered.forEach((item, i) => {
      const n = i + 1;
      const { entity, coord } = item;
      const gone = isGone(entity);
      const badges = `
        ${gone ? `<span class="pm-badge gone">${api.t(TEXT.gone)}</span>` : ''}
        ${entity.model || (entity.turntable && entity.turntable.length) ? `<span class="pm-badge model">${iconSvg('cube')}${api.t(TEXT.model3d)}</span>` : ''}`;

      if (coord) {
        const approx = coord.precision !== 'exact';
        const pin = el(`<button class="${map ? 'km-pin' : 'pm-pin'} ${gone ? 'gone' : ''} ${approx ? 'approx' : ''}" data-n="${n}">
          <span class="pm-pin-num">${n}</span>
        </button>`);
        if (!map && coord.fraction) {
          pin.style.left = (coord.fraction.x * 100).toFixed(2) + '%';
          pin.style.top = (coord.fraction.y * 100).toFixed(2) + '%';
        }
        pin.addEventListener('click', () => api.openDetail(entity));
        pin.addEventListener('pointerenter', () => highlight(n, true));
        pin.addEventListener('pointerleave', () => highlight(n, false));
        pinHost.appendChild(pin);
        pins.set(n, { el: pin, coord, entity });
      }

      const sub = api.t(entity.subtitle)
        || (coord ? '' : api.t(TEXT.unplaced));
      const note = coord && coord.precision !== 'exact'
        ? `<div class="pm-row-approx">${api.t(TEXT.approx)}</div>` : '';

      const row = el(`<button class="pm-row" data-n="${n}">
        <div class="pm-row-num ${coord ? '' : 'unplaced'}">${coord ? n : '·'}</div>
        <div class="pm-row-text">
          <div class="pm-row-head">
            <h3>${window.escapeHtml(api.t(entity.name))}</h3>
            <div class="pm-badges">${badges}</div>
          </div>
          <div class="pm-row-period">${api.formatPeriod(entity.period)}</div>
          <div class="pm-row-sub">${sub}</div>
          ${note}
        </div>
      </button>`);
      // Tapping a name walks the map to it first; the detail opens from the
      // pin, or from a second tap on the row.
      row.addEventListener('click', () => {
        if (map && coord && coord.rd) map.focus(coord.rd[0], coord.rd[1]);
        else api.openDetail(entity);
      });
      row.addEventListener('dblclick', () => api.openDetail(entity));
      row.addEventListener('pointerenter', () => highlight(n, true));
      row.addEventListener('pointerleave', () => highlight(n, false));
      list.appendChild(row);
    });

    /**
     * Re-place every pin against the current view, and grey the ones that are
     * out of their time. A pin for the 1995 Truijenhof on the 1850 sheet is
     * not wrong about *where* — it is wrong about *when*, and saying so is
     * the whole reason the slider is there.
     */
    // Three of the street-level places are "somewhere on Dorpsstraat", so they
    // share one anchor and would stack into a single untappable pin. The fan
    // below moves them apart ON SCREEN ONLY — the stored coordinate is still
    // the street, and each of them is already drawn as an open ring that says
    // the spot is approximate. Nothing here invents a position; it makes three
    // honest "on this street" pins reachable by a finger.
    const fan = new Map();
    pins.forEach(({ coord }, n) => {
      if (!coord.rd) return;
      const key = coord.rd.join(',');
      if (!fan.has(key)) fan.set(key, []);
      fan.get(key).push(n);
    });
    const spread = new Map();
    fan.forEach(members => {
      if (members.length < 2) return;
      members.forEach((n, i) => {
        const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
        spread.set(n, { dx: Math.cos(angle) * 34, dy: Math.sin(angle) * 34 });
      });
    });

    function placePins() {
      if (!map) return;
      const year = map.year();
      const w = map.el.clientWidth, h = map.el.clientHeight;
      pins.forEach(({ el: pin, coord, entity }, n) => {
        if (!coord.rd) return;
        const p = map.project(coord.rd[0], coord.rd[1]);
        const nudge = spread.get(n);
        if (nudge) { p.x += nudge.dx; p.y += nudge.dy; }
        const outside = p.x < -80 || p.y < -80 || p.x > w + 80 || p.y > h + 80;
        pin.style.visibility = outside ? 'hidden' : 'visible';
        pin.style.left = p.x + 'px';
        pin.style.top = p.y + 'px';
        const period = entity.period || {};
        const future = period.from != null && period.from > year;
        const past = period.to != null && period.to < year;
        pin.classList.toggle('is-future', future);
        pin.classList.toggle('is-past', past);
        pin.title = future ? api.t(TEXT.notYet) : past ? api.t(TEXT.noLonger) : '';
      });
    }

    function highlight(n, on) {
      const pin = pins.get(n);
      const row = list.querySelector(`.pm-row[data-n="${n}"]`);
      if (pin) pin.el.classList.toggle('is-active', on);
      if (row) row.classList.toggle('is-active', on);
    }

    return view;
  };
})();
