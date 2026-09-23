(function () {
  const manifest = window.__MANIFEST__ || { components: [] };
  const timelineManifest = manifest.components.find(c => c.type === 'timeline') || { id: 'tijdlijn', entries: [] };
  const collections = manifest.components.filter(c => c.type === 'collection');
  const genealogyManifest = manifest.components.find(c => c.type === 'genealogy') || null;

  // The Lions Alliance credit mark on the home screen. It lives in
  // Content/homescreen rather than in hub/, so the museum can swap it without
  // touching the application folder. That folder is reachable only because
  // components.json carries a "homescreen" entry — MapVirtualHosts serves one
  // folder per entry, and ContentHosting.ComponentHost decides the hostname.
  // The entry's "assets" type matches no scanner branch on purpose: it is
  // there to be served, not to be rendered as an app.
  const MAKER = (window.PRODUCT && window.PRODUCT.maker) || {};
  const MAKER_NAME = MAKER.name || '';
  const MAKER_LOGO = (MAKER.logo && manifest.components.some(c => c.id === 'homescreen'))
    ? MAKER.logo
    : '';

  // Authoring problems are non-fatal by design (ContentScanner warns and skips),
  // but they should still be visible to whoever is working on content.
  manifest.components.forEach(c => {
    (c.warnings || []).forEach(w => console.warn(`[content:${c.id}] ${w}`));
  });

  // Placeholder image pool: real DeMediaTijdlijn thumbnails, cycled deterministically
  // for any app that doesn't have its own real photography yet.
  const placeholderPool = timelineManifest.entries.map(e => e.thumbnail).filter(Boolean);
  function placeholderFor(seed) {
    if (!placeholderPool.length) return '';
    let hash = 0;
    for (let i = 0; i < String(seed).length; i++) hash = (hash * 31 + String(seed).charCodeAt(i)) >>> 0;
    return placeholderPool[hash % placeholderPool.length];
  }
  function bg(url) { return window.bgStyle(url); }

  // ---------- Entity graph ----------
  // Every collection entity and every timeline entry is addressable as
  // "<componentId>:<entityId>", so any app can link into any other. This is
  // what makes the four village apps read as one museum rather than as four
  // separate card grids.
  // Which app tile owns which content component, taken from product.json
  // rather than hardcoded, so renaming or re-pointing a tile is config.
  const COMPONENT_TO_APP = {};
  APPS.forEach(a => { COMPONENT_TO_APP[a.component || a.id] = a.id; });

  /**
   * The name of the app an entity lives in, for a cross-link chip.
   *
   * Resolved at RENDER time, not when the index is built: the index is built
   * once at startup and a visitor can switch language at any point, so a
   * resolved string here would freeze the chips in whatever language the table
   * happened to boot in.
   *
   * Falls back to the component's own name when a component has no tile of its
   * own — ui() returns the key itself for a missing key, which is the signal.
   */
  window.appLabelFor = entry => {
    if (!entry) return '';
    const key = `app.${entry.appId}.label`;
    const text = ui(key);
    return text === key ? (entry.appName || entry.componentId) : text;
  };

  const ENTITY_INDEX = new Map();
  timelineManifest.entries.forEach(e => {
    ENTITY_INDEX.set(`${timelineManifest.id}:${e.id}`, {
      componentId: timelineManifest.id, appId: 'timeline', id: e.id,
      label: e.title, appName: timelineManifest.name, entity: e,
    });
  });
  collections.forEach(c => {
    const appId = COMPONENT_TO_APP[c.id] || c.id;
    (c.collection || []).forEach(e => {
      ENTITY_INDEX.set(`${c.id}:${e.id}`, {
        componentId: c.id, appId, id: e.id,
        label: e.name, appName: c.name, entity: e,
      });
    });
  });

  window.lookupRef = ref => ENTITY_INDEX.get(ref) || null;
  window.entitiesFor = componentId => {
    const c = collections.find(x => x.id === componentId);
    return (c && c.collection) || [];
  };
  // The harvested historical map under a collection, or null if that folder was
  // never filled (see tools/harvest_kaartlagen.py). Only the Kaart has one, but
  // nothing in the plumbing assumes that.
  window.mapLayersFor = componentId => {
    const c = collections.find(x => x.id === componentId);
    return (c && c.mapLayers) || null;
  };
  window.placeholderFor = placeholderFor;
  window.getLang = () => state.lang;

  // Views that hold resources the garbage collector won't reclaim on its own —
  // a WebGL context, a render loop, a ResizeObserver — tag their root with
  // `.js-dispose` and listen for `view-dispose`. Anything that tears down a
  // subtree must call this first: a kiosk runs for a day, and a leaked context
  // per building visit eventually gets refused by the driver.
  window.disposeSubtree = function (root) {
    if (!root) return;
    root.querySelectorAll('video, audio').forEach(m => { try { m.pause(); } catch (e) { /* detached */ } });
    root.querySelectorAll('.js-dispose').forEach(n => n.dispatchEvent(new Event('view-dispose')));
    if (root.classList && root.classList.contains('js-dispose')) root.dispatchEvent(new Event('view-dispose'));
  };

  // Timeline entries that carry a real year ("1869", "1944 …"), for apps that
  // want to plot village events against their own axis. "Prehistorie" and any
  // other undated entry simply drops out.
  window.timelineEvents = () => (timelineManifest.entries || [])
    .map(e => ({ ref: `${timelineManifest.id}:${e.id}`, title: e.title, year: parseInt(e.title, 10) }))
    .filter(e => Number.isFinite(e.year) && e.year > 1000 && e.year < 2200);

  // A chip in one app opens a detail in another; the target app reads and
  // clears this on build rather than every builder taking an extra argument.
  let pendingEntity = null;
  window.consumePendingEntity = componentId => {
    if (!pendingEntity || pendingEntity.componentId !== componentId) return null;
    const id = pendingEntity.id;
    pendingEntity = null;
    return id;
  };
  window.openRef = ref => {
    const target = ENTITY_INDEX.get(ref);
    if (!target) return;
    pendingEntity = { componentId: target.componentId, id: target.id };
    openApp(target.appId);
  };

  // Personen -> Stamboom is a name lookup rather than an id link: the curated
  // biographies and the heemkundekring's tree are separate datasets and the
  // GEDCOM ids would be meaningless across an export. Handing over the surname
  // works today and survives the real file replacing the demo one.
  let pendingStamboomQuery = null;
  window.consumePendingStamboomQuery = () => {
    const query = pendingStamboomQuery;
    pendingStamboomQuery = null;
    return query;
  };
  window.openStamboomSearch = query => {
    pendingStamboomQuery = query || '';
    openApp('stamboom');
  };

  // ---------- Design canvas ----------
  // The canvas is a fixed *height* of 2160 design pixels, scaled to whatever
  // the real display is. Its **width follows the viewport's aspect ratio**
  // rather than being pinned to 3840: a fixed 16:9 canvas letterboxes on
  // everything that isn't exactly 16:9, which is precisely where a laptop and
  // the touch table drift apart. Holding the height constant keeps every
  // design pixel — every font size and padding in hub.css — the same relative
  // size everywhere; only how much horizontal room there is changes. So write
  // layout that flexes horizontally and never assume 3840.
  const STAGE_HEIGHT = 2160, HEADER_HEIGHT = 160;
  const MIN_STAGE_WIDTH = 2880;  // 4:3 — narrower than this and we letterbox instead
  const MAX_STAGE_WIDTH = 7680;  // 32:9 — the widest ultra-wide worth supporting
  let STAGE_WIDTH = 3840;

  // The timeline's cream/purple/cream vertical split, measured from the real
  // TRU-tijdlijn-digi reference image (29.6% / 40.8% / 29.6%). Keep
  // RAIL_HEIGHT_RATIO in sync with .tl-rail's flex-grow (408 of 1000).
  const RAIL_HEIGHT_RATIO = 0.408;

  const state = { lang: 'nl', view: 'home' };

  // Region-pinned so Intl picks the conventions of the country, not just the
  // language: en-GB gives "28 August", en-US would give "August 28". Declared
  // in product.json, because which regions a site serves is a product decision.
  const LOCALE = (window.PRODUCT && window.PRODUCT.locales) || {};
  const localeFor = lang => LOCALE[lang] || lang;

  // Only the first letter. CSS text-transform:capitalize used to do this and
  // capitalized every word, which is wrong in three of the four languages:
  // "Vrijdag 28 Augustus", "Vendredi 28 Août". German already capitalizes its
  // month and weekday itself, so this leaves it alone.
  const sentenceCase = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  window.stageSize = () => ({ width: STAGE_WIDTH, height: STAGE_HEIGHT, headerHeight: HEADER_HEIGHT });

  function fitStage() {
    const stage = document.getElementById('stage');
    const shrink = document.getElementById('stage-shrink');
    const w = window.innerWidth, h = window.innerHeight;

    const previous = STAGE_WIDTH;
    STAGE_WIDTH = Math.round(Math.min(MAX_STAGE_WIDTH, Math.max(MIN_STAGE_WIDTH, STAGE_HEIGHT * (w / h))));

    const scale = Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT);
    stage.style.width = STAGE_WIDTH + 'px';
    stage.style.height = STAGE_HEIGHT + 'px';
    stage.style.transform = `scale(${scale})`;
    shrink.style.width = (STAGE_WIDTH * scale) + 'px';
    shrink.style.height = (STAGE_HEIGHT * scale) + 'px';

    return STAGE_WIDTH !== previous;
  }

  // Views that compute positions from the canvas width (the timeline's leaves,
  // an opened media card) have to be rebuilt when it changes. Everything is in
  // memory, so a re-render is cheap; debounced because dragging a desktop
  // window fires resize continuously.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    const widthChanged = fitStage();
    if (!widthChanged) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ---------- Header ----------
  function renderHeader() {
    const header = document.getElementById('tt-header');
    const brand = (window.PRODUCT && window.PRODUCT.brand) || {};
    header.innerHTML = `
      <div class="tt-header-left">
        <div class="tt-brand" id="tt-brand">
          <div class="tt-brand-mark">${window.escapeHtml(brand.mark || '')}</div>
          <div class="tt-brand-text">
            <div class="tt-brand-name">${window.escapeHtml(brand.name || '')}</div>
            <div class="tt-brand-sub">${window.escapeHtml(ui('brand.venue'))}</div>
          </div>
        </div>
      </div>
      <div class="tt-header-right">
        <div class="tt-lang">
          ${window.LANGUAGES.map(l => `<button data-lang="${l}" class="${state.lang === l ? 'active' : ''}">${l.toUpperCase()}</button>`).join('')}
        </div>
        <div class="tt-clock" id="tt-clock"></div>
      </div>
    `;
    header.querySelector('#tt-brand').addEventListener('click', goHome);
    header.querySelectorAll('.tt-lang button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.dataset.lang;
        // Or :lang() CSS, hyphenation and a screen reader's voice all stay Dutch.
        document.documentElement.lang = state.lang;
        render();
      });
    });
    updateClock();
  }
  function updateClock() {
    const el = document.getElementById('tt-clock');
    if (el) el.textContent = new Date().toLocaleTimeString(localeFor(state.lang), { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(updateClock, 30000);

  // ---------- Home ----------
  function buildHome() {
    const today = sentenceCase(new Date().toLocaleDateString(localeFor(state.lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    const home = el(`<div class="home">
      <div class="home-hero">
        <div>
          <div class="home-eyebrow">${window.escapeHtml(ui('home.welcome'))}</div>
          <h1 class="home-title">${ui('home.title')}</h1>
          <p class="home-lede">${window.escapeHtml(ui('home.lede'))}</p>
        </div>
        <div class="home-meta">
          <div class="home-meta-row"><span class="home-meta-dot"></span><span>${window.escapeHtml(ui('home.openingHours'))}</span></div>
          <div>${window.escapeHtml(today)}</div>
        </div>
      </div>
      <div class="home-grid"></div>
      <div class="home-footer">
        <div>${window.escapeHtml(ui('home.footer'))}</div>
        <div class="home-credit">
          <img class="home-credit-logo" src="${MAKER_LOGO}" alt="" />
          <span>${window.escapeHtml(MAKER_NAME)}</span>
        </div>
      </div>
    </div>`);

    // No logo file yet, or the homescreen entry missing from components.json:
    // drop the image and keep the credit line rather than showing a broken icon.
    const logo = home.querySelector('.home-credit-logo');
    logo.addEventListener('error', () => logo.remove());

    const grid = home.querySelector('.home-grid');
    APPS.forEach((app, i) => {
      const tile = el(`<div class="tile ${app.featured ? 'tile-featured' : ''}">
        <div class="tile-head">
          <div class="tile-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="tile-icon">${iconSvg(app.icon)}</div>
        </div>
        <div>
          <h2 class="tile-title">${window.escapeHtml(ui(`app.${app.id}.label`))}</h2>
          <p class="tile-sub">${window.escapeHtml(ui(`app.${app.id}.sub`))}</p>
          <div class="tile-cta">${window.escapeHtml(ui('action.explore'))}${iconSvg('arrow')}</div>
        </div>
      </div>`);
      tile.addEventListener('click', () => openApp(app.id));
      grid.appendChild(tile);
    });

    return home;
  }

  // ---------- Timeline (real DeMediaTijdlijn content) ----------
  function buildTimeline() {
    const view = el(`<div class="timeline-view">
      <div class="tl-list">
        <div class="tl-top">
          <div class="tl-intro">
            <div class="tl-eyebrow">${window.escapeHtml(ui('app.timeline.eyebrow'))}</div>
            <h1>${ui('app.timeline.title')}</h1>
          </div>
        </div>
        <div class="tl-rail">
          <div class="tl-rail-bg"></div>
          <div class="tl-rail-line"></div>
          <div class="timeline-strip"></div>
        </div>
        <div class="tl-bottom"></div>
      </div>
    </div>`);

    const listWrap = view.querySelector('.tl-list');
    const strip = view.querySelector('.timeline-strip');

    const railHeight = (STAGE_HEIGHT - HEADER_HEIGHT) * RAIL_HEIGHT_RATIO;
    const thumbHeight = railHeight * 1.5; // 150% of the purple band's own height
    // The strip's box must be at least this tall itself, or overflow-x:auto
    // (needed for horizontal scrolling) clips it back down vertically too.
    strip.style.height = thumbHeight + 'px';

    (timelineManifest.entries || []).forEach(entry => {
      const node = el(`<div class="timeline-node">
        <img class="timeline-node-thumb" src="${entry.thumbnail}"/>
      </div>`);
      node.addEventListener('click', () => diveIn(entry));
      strip.appendChild(node);
    });

    let openLeaves = null;

    // Zoom-in transition: the timeline fades/scales out, revealing the cream
    // field underneath, before the leaves throw themselves onto it.
    function diveIn(entry) {
      listWrap.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }],
        { duration: 350, easing: 'ease-in', fill: 'forwards' },
      ).onfinish = () => {
        listWrap.style.display = 'none';
        openLeaves = buildLeavesView(entry, goBack);
        view.appendChild(openLeaves);
        openLeaves.animate(
          [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 300, easing: 'ease-out', fill: 'forwards' },
        );
      };
    }

    function goBack() {
      openLeaves.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 250, easing: 'ease-in', fill: 'forwards' },
      ).onfinish = () => {
        // A detached <video> keeps playing in Chromium, and now that a film
        // can be unmuted that means audio from an era nobody is looking at
        // any more. Tear the subtree down properly before dropping it.
        window.disposeSubtree(openLeaves);
        openLeaves.remove();
        openLeaves = null;
        listWrap.style.display = '';
        listWrap.animate(
          [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 300, easing: 'ease-out', fill: 'forwards' },
        );
      };
    }

    // A "Tijdlijn 1910" chip in another app promises that era, not just the
    // rail — so dive straight in. Deferred a frame so the view is attached and
    // the entrance animation has something laid out to animate.
    const pending = window.consumePendingEntity(timelineManifest.id);
    if (pending) {
      const entry = (timelineManifest.entries || []).find(e => e.id === pending);
      if (entry) requestAnimationFrame(() => diveIn(entry));
    }

    return view;
  }

  // An item's on-screen size at rest: derived from its real image (or
  // rendered-PDF-page) pixel dimensions, scaled to a generous target long
  // edge — "larger at the start" — rather than a fixed box.
  const LEAF_TARGET_LONG_EDGE = 840; // 150% of the previous 560px
  function leafSize(item, targetLongEdge) {
    const w = item.width || 800, h = item.height || 600;
    const scale = (targetLongEdge || LEAF_TARGET_LONG_EDGE) / Math.max(w, h);
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
  }

  /**
   * Re-shape a leaf card once something can say what shape it really is.
   *
   * Only films need this. `leafSize` works from `item.width`/`item.height`,
   * which the scanner reads out of an image's header but cannot get from a
   * video without decoding one — so every film used to land on the 800x600
   * fallback and be cropped to it, whatever its real proportions.
   * `videocontrols.js` reports the true ratio the moment the file's metadata
   * arrives, and this puts the card right.
   *
   * The card changes size about its own centre. Its box is width/height but
   * its position is a transform, so resizing alone would slide the picture's
   * middle across the table; shifting x/y by half the delta cancels that, and
   * a card arriving at a corrected shape reads as settling, not as jumping.
   */
  function resizeLeaf(card, handle, state, ratio, longEdge) {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const edge = longEdge || LEAF_TARGET_LONG_EDGE;
    const w = ratio >= 1 ? edge : Math.round(edge * ratio);
    const h = ratio >= 1 ? Math.round(edge / ratio) : edge;
    const prevW = card.offsetWidth, prevH = card.offsetHeight;
    if (!prevW || !prevH || (w === prevW && h === prevH)) return;
    state.x += (prevW - w) / 2;
    state.y += (prevH - h) / 2;
    card.style.width = w + 'px';
    card.style.height = h + 'px';
    if (handle) handle.apply();
  }

  /**
   * Scatters `items` into `canvas` as draggable/pinch-scalable/corner-
   * rotatable "leaf" cards, laid out with random offsets/rotation (grid +
   * jitter so they don't all pile up — some overlap is fine and matches real
   * scattered photos) across an areaW x areaH region anchored at the canvas's
   * own (0,0), then animates them flying out from a shared origin point.
   *
   * Shared by the timeline's full-stage "leaves" detail view and a collection
   * entity's (e.g. a person's) narrower material canvas — same gesture
   * vocabulary and entrance animation wherever a folder's source files land.
   *
   * opts: { targetLongEdge, fitToArea, originCx, originCy } — all optional.
   */
  function scatterLeaves(canvas, items, areaW, areaH, opts) {
    opts = opts || {};
    const targetLongEdge = opts.targetLongEdge || LEAF_TARGET_LONG_EDGE;

    // Scatter density follows the canvas: a wider area gets more columns
    // rather than the same grid stretched out.
    const aspect = areaW / areaH;
    const cols = Math.max(2, Math.ceil(Math.sqrt(items.length * aspect * 0.8)));
    const rows = Math.ceil(items.length / cols);
    const cellW = areaW / cols, cellH = areaH / rows;

    // A boxed canvas holding many cards needs smaller cards than the
    // full-stage leaves view. Personen arrive with one to four folder files,
    // so the fixed 840px long edge was never a problem there; a tradition
    // brings five to eighteen photographs, and at that size they land as one
    // pile instead of a scatter. `fitToArea` sizes them off the grid cell this
    // function has just worked out — a little larger than their cell, so cards
    // still overlap the way scattered photos do, never larger than the
    // full-stage default, and never so small they stop being handleable.
    // The width of the box is the real constraint, not the cell: this canvas
    // is a tall column beside the text, so an 840px card is over half its
    // width however few cards there are.
    const longEdge = opts.fitToArea
      ? Math.max(240, Math.min(targetLongEdge, Math.round(Math.min(cellW, cellH) * 1.6), Math.round(areaW * 0.42)))
      : targetLongEdge;

    // Shared entrance origin for every card — center-left of the area, unless overridden.
    const originCx = opts.originCx != null ? opts.originCx : areaW * 0.18;
    const originCy = opts.originCy != null ? opts.originCy : areaH / 2;

    const cards = [];
    items.forEach((item, i) => {
      const { w: cardW, h: cardH } = leafSize(item, longEdge);
      const col = i % cols, row = Math.floor(i / cols);
      const jitterX = (Math.random() - 0.5) * cellW * 0.7;
      const jitterY = (Math.random() - 0.5) * cellH * 0.7;
      let x = col * cellW + cellW / 2 + jitterX - cardW / 2;
      let y = row * cellH + cellH / 2 + jitterY - cardH / 2;
      // In a box the size of the area is a hard edge (`.coll-detail-canvas`
      // clips), so a card that jitters past it opens half cut off and reads as
      // broken rather than as scattered. Start every card fully inside; the
      // drag itself stays unclamped, so a visitor can still push one aside.
      // The full-stage leaves view keeps its overflow — there the stage edge
      // is the screen edge and a photo running off it is the effect.
      if (opts.fitToArea) {
        x = Math.max(0, Math.min(x, areaW - cardW));
        y = Math.max(0, Math.min(y, areaH - cardH));
      }
      const rotation = (Math.random() - 0.5) * 24;

      // Caption and credit sit ON the picture, along its bottom edge, not under
      // the card. Under the card they collided: seventeen photographs on one
      // canvas put four captions through each other and none of them could be
      // read. On the picture, a caption can only ever overlap its own image.
      //
      // Both are opt-in (`opts.captions`). The timeline's items all carry a
      // `title` too, but theirs is a filename; printing those under every leaf
      // would caption a photograph with "IMG_04.jpg".
      const caption = opts.captions ? (item.caption || '') : '';
      const credit = opts.captions ? (item.credit || '') : '';

      const card = el(`<div class="leaf-card">
        <div class="leaf-card-media">
          ${caption ? `<div class="leaf-card-caption">${window.escapeHtml(caption)}</div>` : ''}
          ${credit ? `<div class="leaf-card-credit">${window.escapeHtml(credit)}</div>` : ''}
        </div>
        <div class="corner-handle tl"></div>
        <div class="corner-handle tr"></div>
        <div class="corner-handle bl"></div>
        <div class="corner-handle br"></div>
      </div>`);
      card.style.width = cardW + 'px';
      card.style.height = cardH + 'px';

      const finalState = { x, y, rotation, scale: 1 };
      const media = card.querySelector('.leaf-card-media');
      let player = null;
      let handle = null;
      if (item.videoPath) {
        player = window.attachVideoControls(media, item.videoPath, {
          // Metadata lands a moment after the card has been laid out and set
          // flying, so this fires mid-entrance. resizeLeaf holds the centre
          // still, and re-applying the transform simply re-targets the
          // transition already running — the card finishes its throw at the
          // right shape instead of snapping.
          onAspect: ratio => resizeLeaf(card, handle, finalState, ratio, longEdge),
        });
      } else if (item.imagePath) {
        media.style.backgroundImage = window.cssUrl(item.imagePath);
      }

      // Tapping the picture wakes the controls if they have cleared off, and
      // otherwise plays or pauses — see `tap` in videocontrols.js. An image
      // card has no tap behaviour: leaf tap-to-fullscreen was removed on
      // purpose.
      handle = window.makeInteractiveCard(card, finalState, player ? player.tap : null);
      canvas.appendChild(card);

      // Start every card at the shared throw origin, no transition yet.
      card.style.transform = `translate(${originCx - cardW / 2}px, ${originCy - cardH / 2}px) rotate(0deg) scale(1)`;
      cards.push({ card, handle });
    });

    // Next frame: give each card a transition and let it settle into its
    // real position — a wave of cards flying out from the origin point,
    // decelerating like something thrown ("gravity" in the OmniTapps sense).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cards.forEach(({ card, handle }, i) => {
          const delay = i * 30;
          card.style.transition = `transform 1300ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
          handle.apply();
          card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
        });
      });
    });

    return cards;
  }
  window.scatterLeaves = scatterLeaves;

  // Scattered "leaves" detail view: every content item for one timeline entry.
  function buildLeavesView(entry, onBack) {
    const leaves = el(`<div class="leaves-view">
      <button class="leaves-back">${iconSvg('close')}</button>
      <div class="leaves-canvas"></div>
    </div>`);
    leaves.querySelector('.leaves-back').addEventListener('click', onBack);
    const canvas = leaves.querySelector('.leaves-canvas');
    scatterLeaves(canvas, entry.items, STAGE_WIDTH, STAGE_HEIGHT - HEADER_HEIGHT);
    return leaves;
  }

  // ---------- Shared stub header ----------
  function stubHead(eyebrow, titleHtml, lede) {
    return `<div class="stub-head"><div><div class="home-eyebrow">${eyebrow}</div><h1>${titleHtml}</h1></div><div class="stub-lede">${lede}</div></div>`;
  }

  // ---------- Photos / Foto-archief ----------
  // Was the last data.js stub: eighteen invented year/title pairs painted with
  // recycled timeline thumbnails, under a lede claiming "ruim 4.200 historische
  // opnames" and a "tik op een foto" instruction that did nothing. It is a real
  // collection component now, six albums out of Medelo's own fotogalerij, and
  // the count below is the number actually on disk.
  //
  // It supplies no signature view, so buildCollectionApp falls through to the
  // shared card grid — the fallback path kept in collection.js for exactly this.
  function buildPhotos() {
    // Web demo: albums that are thrown onto the table like a timeline era,
    // instead of the card grid below. See views/photoalbums.js.
    if (window.buildPhotoAlbums) return window.buildPhotoAlbums();
    const albums = window.entitiesFor('fotoarchief');
    const photoCount = albums.reduce((sum, a) => sum + ((a.media || []).length), 0);
    return window.buildCollectionApp({
      id: 'fotoarchief',
      eyebrow: ui('app.photos.eyebrow'),
      title: ui('app.photos.title'),
      lede: ui('app.photos.lede', { albums: albums.length, photos: photoCount }),
      cardClass: 'coll-card-wide',
      search: true,
    });
  }

  // ---------- Stories / Verhalen ----------
  function buildStories() {
    return window.buildCollectionApp({
      id: 'verhalen',
      eyebrow: ui('app.stories.eyebrow'),
      title: ui('app.stories.title'),
      lede: ui('app.stories.lede'),
      cardClass: 'coll-card-wide',
      cardMeta: (entity, api) => {
        // Three kinds, never blurred: genuine archive footage, a film
        // illustrated with AI, and a written article from the Medelo archive.
        const kind = window.storyKindOf(entity);
        const label = ui(`story.kind.${kind}`);
        return `
        <div class="coll-card-sub">${window.escapeHtml(api.t(entity.subtitle))}</div>
        <div class="story-kind ${kind}">${window.escapeHtml(label)}</div>`;
      },
      signature: {
        label: ui('app.stories.signature'),
        build: (entities, api) => window.buildCinema(entities, api),
      },
      detailExtra: (entity, api) => window.buildStoryDetail(entity, api),
    });
  }

  // ---------- Map / Kaart van Meijel ----------
  // A real component now, not a data.js stub: it holds the four buildings the
  // retired Gebouwen tile used to own, so `kaart:<id>` is addressable and the
  // Verhalen story on the Kathedraal still has somewhere to link to. A building
  // is a place with walls, so it keeps its 3D model / photo turntable in the
  // detail view exactly as before.
  function buildMap() {
    return window.buildCollectionApp({
      id: 'kaart',
      eyebrow: ui('app.map.eyebrow'),
      title: ui('app.map.title'),
      lede: ui('app.map.lede'),
      cardClass: 'coll-card-wide',
      // A place's pictures are its Medelo article's photographs, pulled out of
      // the PDF by tools/extract_kaart_documents.py. They belong on the free
      // canvas beside the text for the same reason a tradition's do: they are
      // there to be picked up and compared, not filed in a strip underneath.
      // Each carries its caption and the article it came from.
      mediaCanvas: true,
      signature: {
        label: ui('app.map.signature'),
        build: (entities, api) => window.buildPlaceMap(entities, api),
      },
      detailExtra: (entity, api) => window.buildBuildingViewer(entity, api),
    });
  }

  // ---------- People / Personen ----------
  function buildPeople() {
    return window.buildCollectionApp({
      id: 'personen',
      eyebrow: ui('app.people.eyebrow'),
      title: ui('app.people.title'),
      lede: ui('app.people.lede'),
      cardClass: 'coll-card-portrait',
      // A person's period is a LIFESPAN, so an open one that cannot still be
      // running reads "1718–???" rather than "1718 – heden". A building's open
      // period means it is still standing, which is why this is opt-in.
      periodIsLifespan: true,
      signature: {
        label: ui('app.people.signature'),
        build: (entities, api) => window.buildGenerations(entities, api),
      },
      // The relationship "star" that used to sit here is gone. It showed
      // people whose lifetimes merely overlapped, which is a coincidence
      // dressed up as a connection; the names inside the text link to each
      // other now instead (see `mentions` in personen.json and renderBody in
      // collection.js), which is a real relation because the source says so.
      detailExtra: (entity, api) => {
        const wrap = document.createElement('div');
        // Curated biography -> the full tree, by surname. Only offered when a
        // genealogy dataset is actually loaded.
        if (genealogyManifest && genealogyManifest.genealogy && genealogyManifest.genealogy.dataUrl) {
          const button = el(`<button class="coll-chip st-jump">
            ${iconSvg('tree')}<span class="coll-chip-name">${window.escapeHtml(ui('people.findInTree'))}</span>
          </button>`);
          button.addEventListener('click', () => window.openStamboomSearch(api.t(entity.name)));
          wrap.appendChild(button);
        }
        return wrap.childElementCount ? wrap : null;
      },
    });
  }

  // ---------- Traditions / Tradities ----------
  function buildTraditions() {
    return window.buildCollectionApp({
      id: 'tradities',
      eyebrow: ui('app.traditions.eyebrow'),
      title: ui('app.traditions.title'),
      lede: ui('app.traditions.lede'),
      cardMeta: (entity, api) => `<div class="coll-card-sub">${window.escapeHtml(api.t(entity.body))}</div>`,
      // The photographs of a feast are the feast: give them the same
      // free-manipulation canvas Personen and the timeline use, instead of one
      // hero at the top and a strip of thumbnails under the text.
      mediaCanvas: true,
      signature: {
        label: ui('app.traditions.signature'),
        build: (entities, api) => window.buildYearWheel(entities, api),
      },
      detailExtra: (entity, api) => window.buildTraditionExtra(entity, api),
    });
  }

  // ---------- Stamboom ----------
  function buildStamboom() {
    const lang = state.lang;
    const api = {
      lang,
      t: v => window.t(v, lang),
      formatPeriod: p => window.formatPeriod(p, lang),
    };
    return window.buildStamboom(api, genealogyManifest ? genealogyManifest.genealogy : null);
  }

  // ---------- Vendored sub-applications ----------
  // Two of the hub's apps are whole applications of their own rather than views
  // over Content/: Pròt mèr Mééls (the dialect trainer, originally an Electron
  // build — see apps/pmm/README.md) and the schoolbord (the classroom board's
  // video library, previously a separate fork of this entire product).
  //
  // Both are plain web apps, so both are served from the hub's own origin and
  // shown in a frame rather than spawned as processes — a second Chromium cold-
  // starting on every tap is exactly the cost this hub exists to avoid.
  //
  // Same origin is the point, not an accident: it lets the hub observe activity
  // inside the frame, and lets the frame call back out (window.parent.goHome,
  // hubSetImmersive) without a message protocol, so a newer build of either one
  // drops in with no glue to re-learn.
  const PMM_ENTRY = 'apps/pmm/index.html';
  const SB_ENTRY = 'apps/sb/index.html';

  /**
   * Mount a vendored app in a same-origin iframe.
   *
   * `fullStage` decides whether the hub's own header stays visible above it.
   * Pròt mèr Mééls has no chrome of its own and sits below the header; the
   * schoolbord brings its own brand, clock, language switcher and a labelled
   * way back, so it covers the stage entirely — two stacked headers, each with
   * its own idea of "home", is precisely the thing to avoid.
   */
  function buildEmbeddedApp(entry, title, opts) {
    opts = opts || {};
    const cls = opts.fullStage ? 'embed-view embed-full js-dispose' : 'pmm-view js-dispose';
    const style = opts.fullStage ? '' : ` style="top:${HEADER_HEIGHT}px"`;
    const view = el(`<div class="${cls}"${style}></div>`);
    const frame = el(`<iframe class="pmm-frame" src="${entry}" title="${window.escapeHtml(title)}"></iframe>`);
    view.appendChild(frame);

    // The hub's idle timer listens on *this* window, and events inside a frame
    // never reach it — without this, the table would walk a visitor back to the
    // home screen mid-lesson. Each app has its own, shorter, idle reset to its
    // own start screen; those are left alone.
    let inner = null;
    const bump = () => resetIdle();
    const ACTIVITY = ['pointerdown', 'pointermove', 'wheel', 'keydown'];

    frame.addEventListener('load', () => {
      try {
        inner = frame.contentWindow;
        ACTIVITY.forEach(evt => inner.addEventListener(evt, bump, { passive: true }));
      } catch (err) {
        // Only reachable if the app is ever moved to its own origin. Failing
        // closed (idle still returns home) is the safe museum default, but it
        // would cut a lesson or a film short, so make the cause findable.
        inner = null;
        console.warn(`[${entry}] cannot observe frame activity; hub idle reset may interrupt it`, err);
      }
    });

    view.addEventListener('view-dispose', () => {
      try {
        if (inner) ACTIVITY.forEach(evt => inner.removeEventListener(evt, bump));
        frame.contentWindow.document.querySelectorAll('video, audio')
          .forEach(m => { try { m.pause(); } catch (e) { /* detached */ } });
      } catch (e) { /* frame already torn down */ }
      inner = null;
    });

    return view;
  }

  function buildProtMerMeels() {
    return buildEmbeddedApp(PMM_ENTRY, 'Pròt mèr Mééls', { fullStage: false });
  }

  function buildSchoolbord() {
    return buildEmbeddedApp(SB_ENTRY, 'Medelo Schoolbord', { fullStage: true });
  }

  /**
   * Take the two corner "⌂" windows away while a film is on, and put them back
   * afterwards. They are separate always-on-top native windows — no amount of
   * CSS reaches them — so a full-screen film would otherwise play with a house
   * icon burned into two of its corners.
   *
   * `chrome.webview` is exposed on the top document only, so the schoolbord
   * frame cannot post this itself and asks the hub to do it (setImmersive in
   * apps/sb/sb-app.js). Silent outside WebView2: no shell, no corner buttons.
   */
  window.hubSetImmersive = function hubSetImmersive(on) {
    try {
      window.chrome.webview.postMessage({ type: 'immersive', on: !!on });
    } catch (err) { /* not running inside the kiosk shell */ }
  };

  // ---------- Routing ----------
  const builders = {
    timeline: buildTimeline, photos: buildPhotos, stories: buildStories, map: buildMap,
    people: buildPeople, traditions: buildTraditions,
    stamboom: buildStamboom, protmermeels: buildProtMerMeels,
    schoolbord: buildSchoolbord,
  };

  function openApp(id) { state.view = id; render(); }
  window.goHome = function () { state.view = 'home'; render(); };

  // ---------- Idle reset ----------
  // The table is unattended between visitors. A paused video, a spun jaarwiel
  // or a rotated 3D model is state the next person shouldn't inherit, so an
  // idle table returns to the home screen by itself.
  //
  // "Idle" cannot simply mean nobody has touched the glass. A film is the one
  // thing here worth watching without touching anything, and the schoolbord's
  // are twelve minutes long — four times around this timer. Sitting through one
  // used to mean being sent back to the home screen three times on the way.
  //
  // So a running film holds the table: the timer re-arms and asks again later.
  // When the film ends, the next round finds nothing playing and the table goes
  // home by itself, at most one IDLE_MS late. Re-arming rather than cancelling
  // is deliberate — there is no hold to release, so a card disposed halfway
  // through a film cannot strand the table awake forever.
  //
  // `idleMs` in product.json had been declared but never read since Sep 2026;
  // it is the real setting now, which is what lets the schoolbord run a longer
  // one than the table without a code change.
  const IDLE_MS = (window.PRODUCT && window.PRODUCT.idleMs) || 3 * 60 * 1000;
  let idleTimer = null;

  // Sub-apps live in same-origin iframes — Pròt mèr Mééls, the schoolbord, and
  // the schoolbord's own nested quiz frame — and their media is invisible to a
  // querySelectorAll on this document. Walk into every frame we are allowed to
  // read. One that throws is cross-origin, and failing closed there (the table
  // still goes home) is the right museum default.
  function anyMediaPlaying(doc) {
    for (const m of doc.querySelectorAll('video, audio')) {
      if (!m.paused && !m.ended) return true;
    }
    for (const f of doc.querySelectorAll('iframe')) {
      try {
        if (f.contentDocument && anyMediaPlaying(f.contentDocument)) return true;
      } catch (e) { /* cross-origin frame, nothing we can or should read */ }
    }
    return false;
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (anyMediaPlaying(document)) { resetIdle(); return; }
      document.querySelectorAll('video, audio').forEach(m => { try { m.pause(); } catch (e) { /* detached */ } });
      if (state.view !== 'home') window.goHome();
    }, IDLE_MS);
  }
  ['pointerdown', 'pointermove', 'wheel', 'keydown'].forEach(evt => {
    window.addEventListener(evt, resetIdle, { passive: true });
  });

  // ---------- Rendering ----------
  //
  // Going from one app to another has to be all-or-nothing. It used to be a
  // straight sequence — dispose, clear, build, append — and every step of that
  // was a place where a half-finished navigation could strand a visitor:
  //
  //   * a view that threw on the way out (a dispose handler for a canvas or a
  //     render loop) aborted render() BEFORE the clear, so the old screen
  //     stayed up, still live, still answering taps;
  //   * a view that threw while building left the container empty;
  //   * and render() re-entering itself — a handler that navigates while a
  //     build is in flight — appended a second screen on top of the first,
  //     which is what "the new page renders over the old one, and the old one's
  //     images still pop up" looks like from the glass.
  //
  // So: one render at a time, the outgoing screen leaves the document before
  // anything is allowed to fail, and a failure anywhere is reported rather than
  // silently leaving the table in a state nobody can get out of.
  let rendering = false;
  let renderAgain = false;

  function render() {
    if (rendering) { renderAgain = true; return; }
    rendering = true;
    try {
      renderOnce();
    } finally {
      rendering = false;
      if (renderAgain) { renderAgain = false; render(); }
    }
  }

  function renderOnce() {
    const homeContainer = document.getElementById('home');
    const componentsContainer = document.getElementById('components');

    // The on-screen keyboard hangs off #stage rather than off the view that
    // opened it, so clearing #components does not reach it. Left up, it covers
    // the next screen at z-index 90 and eats every tap.
    if (window.closeKeyboard) window.closeKeyboard();

    // Same argument for the corner "⌂" buttons: a film in the schoolbord asks
    // for them to be hidden, and nothing in a dispose handler puts them back.
    // Restoring them on every navigation means the only way to be left without
    // a way home is to still be inside the film that asked.
    window.hubSetImmersive(false);

    // Detach first, tear down second. A view is out of the document before any
    // of its own cleanup runs, so nothing it does on the way out can leave it
    // on screen.
    const outgoing = Array.prototype.slice.call(componentsContainer.children);
    componentsContainer.innerHTML = '';
    homeContainer.innerHTML = '';
    outgoing.forEach(node => {
      try { window.disposeSubtree(node); } catch (err) { console.error('[render] teardown failed', err); }
    });

    try { renderHeader(); } catch (err) { console.error('[render] header failed', err); }

    if (state.view === 'home') {
      homeContainer.classList.remove('hidden');
      homeContainer.appendChild(buildHome());
      return;
    }

    homeContainer.classList.add('hidden');
    const builder = builders[state.view];
    if (!builder) return;
    try {
      componentsContainer.appendChild(builder());
    } catch (err) {
      // Better an honest empty screen with the reason in the console than the
      // previous app left behind pretending to be this one.
      console.error(`[render] building "${state.view}" failed`, err);
      componentsContainer.appendChild(
        el(`<div class="app-failed">${window.escapeHtml(ui('error.appFailed'))}</div>`));
    }
  }

  fitStage();
  render();
  resetIdle();
})();
