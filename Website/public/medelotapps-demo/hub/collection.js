/* ============================================================
   Shared engine for the four "things in the village" apps —
   Verhalen, Personen, Gebouwen, Tradities.

   All four describe the same shape of thing (a named entity with
   a period, a hero image, a body text and related media), so they
   share one grid, one detail overlay and one cross-link system.
   What makes each app distinct is a single *signature view* it
   supplies itself: generatiewand, jaarwiel, story player, 3D.

   window.buildCollectionApp(cfg) -> DOM node for #components
   ============================================================ */
(function () {
  // ---------- Localized-value helper ----------
  // Authored fields may be a plain string ("Jan Truijen" — proper names don't
  // translate) or a per-language object. Callers shouldn't have to care.
  function t(value, lang) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return String(value);
    return value[lang] || value.nl || value.en || Object.values(value)[0] || '';
  }
  window.t = t;

  // Interface copy lives in hub/strings/<lang>.json — see window.ui in data.js.

  // Nobody reaches this age, so a person with no death date who was born
  // longer ago than this did not live to the present — the date is simply not
  // in the record. A building with no end date, on the other hand, is still
  // standing, which is why this only applies where the caller says the period
  // is a lifespan (see `periodIsLifespan` on the Personen config).
  const MAX_LIFESPAN = 110;
  window.MAX_LIFESPAN = MAX_LIFESPAN;

  /** Is this an open period that cannot possibly still be running? */
  function endIsUnknown(period) {
    return !!period && period.from != null && period.to == null
      && (new Date().getFullYear() - period.from) > MAX_LIFESPAN;
  }
  window.endIsUnknown = endIsUnknown;

  /** "1843–1928", "1958 – heden", "1718–???", "tot 1975", "1910", or "". */
  /**
   * A negative year is BC, and "-1479" is not how anybody writes it. Meijel's
   * own content never goes back past 1300, so the product has never had to
   * say so — but an archaeology collection would, and the web demo's monarchs
   * do. Worth porting back to the table build.
   */
  function year(y) {
    if (y == null) return '';
    return y < 0 ? `${-y} ${window.ui('period.bc')}` : String(y);
  }

  function formatPeriod(period, lang, opts) {
    if (!period) return '';
    // A known end with no known beginning — a tradition that lapsed, a chapel
    // that was cleared away — still says something worth putting on screen.
    if (period.from == null) {
      return period.to == null ? '' : `${window.ui('period.until')} ${year(period.to)}`;
    }
    if (period.to == null) {
      if (opts && opts.lifespan && endIsUnknown(period)) {
        return `${year(period.from)}–${window.ui('period.unknownEnd')}`;
      }
      return `${year(period.from)} – ${window.ui('period.present')}`;
    }
    if (period.to === period.from) return year(period.from);
    // Only the later year carries the era when both sit in the same one:
    // "1479–1458 v.Chr.", not "1479 v.Chr.–1458 v.Chr."
    if (period.from < 0 && period.to < 0) return `${-period.from}–${year(period.to)}`;
    return `${year(period.from)}–${year(period.to)}`;
  }
  window.formatPeriod = formatPeriod;

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function heroUrl(entity, fallback) {
    return (entity.hero && entity.hero.url) || (entity.media && entity.media[0] && entity.media[0].url) || fallback || '';
  }

  /**
   * Text, safe inside HTML.
   *
   * Use this on EVERY authored value interpolated into a template string. This
   * is not about script injection — the table is offline and the content is the
   * museum's own. It is about an ampersand in "Smit & Zonen", a "<" somebody
   * typed meaning "before", or an apostrophe in "d'Aussy" silently destroying a
   * layout on a screen nobody is watching. Volunteers type all three.
   *
   * The apostrophe is escaped as well as the double quote, so a value is safe
   * in a single-quoted attribute too rather than only in the contexts that
   * happen to use double quotes today.
   */
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  // Shared: hub.js writes museum-authored captions into leaf cards the same way.
  window.escapeHtml = escapeHtml;

  /**
   * A URL, safe inside a CSS url() value.
   *
   * Writing background-image:url('...') with a raw interpolation breaks
   * outright on a file called "Jan's huis.jpg" — the apostrophe closes the
   * value early and the rest of the declaration becomes garbage. These
   * filenames come off the heemkundekring's own hard disk, so this is a matter
   * of when, not if: apostrophes in Dutch place names and photo captions are
   * not rare.
   */
  function cssUrl(url) {
    if (!url) return '';
    // Single quotes, not double. Every HTML call site writes this into
    // style="${bgStyle(url)}", and a double quote there closes the attribute
    // at the url( — the browser then reads the rest of the path as a run of
    // bogus attributes and the element keeps only its bare background colour.
    // That is the beige rectangle: not a missing file, a truncated
    // declaration. The timeline's leaves were the only imagery to survive it,
    // because they assign style.backgroundImage as a DOM property, where no
    // HTML parsing happens (see scatterLeaves in hub.js).
    //
    // A double quote cannot legally appear unencoded in a URL, and the
    // scanner percent-encodes every path segment anyway, so folding it to
    // %22 costs nothing and closes the hole for good.
    const safe = String(url).replace(/"/g, '%22').replace(/['\\]/g, '\\$&');
    return `url('${safe}')`;
  }
  window.cssUrl = cssUrl;

  /** A whole background-image declaration, or '' when there is no image. */
  window.bgStyle = url => (url ? `background-image:${cssUrl(url)}` : '');

  /**
   * Turns every first occurrence of a `mentions` name into a link to that
   * entity — the way an encyclopedia article points at its neighbours,
   * instead of a separate box of related people beside the text. Operates on
   * already-built DOM via a TreeWalker over text nodes only, so it is safe to
   * run against arbitrary rendered markup (headings, tables, lists — whatever
   * a Markdown file produced), not just flat paragraphs: a text node can never
   * straddle a tag boundary, so a match can never land half-inside one.
   */
  function linkifyMentions(container, entity) {
    const mentions = (entity.mentions || []).filter(m => m && m.text && window.lookupRef(m.ref));
    if (!mentions.length) return;
    const used = new Set();

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);

    textNodes.forEach(startNode => {
      let node = startNode;
      while (node) {
        const text = node.nodeValue;

        // A text node can contain more than one mention (a sentence naming two
        // people). Always take the leftmost unused match first — iterating
        // `mentions` in authoring order instead would let an early match in
        // the text get stranded in a later mention's discarded "before" half
        // whenever the two aren't authored in the order they appear on screen.
        let best = null;
        for (const m of mentions) {
          if (used.has(m.ref)) continue;
          const at = text.indexOf(m.text);
          if (at !== -1 && (!best || at < best.at)) best = { m, at };
        }
        if (!best) break;
        used.add(best.m.ref);

        const after = text.slice(best.at + best.m.text.length);
        const btn = document.createElement('button');
        btn.className = 'coll-link';
        btn.dataset.ref = best.m.ref;
        btn.textContent = best.m.text;

        const parent = node.parentNode;
        const afterNode = document.createTextNode(after);
        node.nodeValue = text.slice(0, best.at);
        parent.insertBefore(btn, node.nextSibling);
        parent.insertBefore(afterNode, btn.nextSibling);
        node = afterNode; // keep scanning the tail for further mentions
      }
    });
  }

  /**
   * An entity's body, as HTML. Folder-authored entities (see ContentScanner's
   * ScanEntityFolders) carry pre-rendered Markdown in `bodyHtml`, one key per
   * language; everything else keeps the older plain-text convention, split on
   * blank lines into paragraphs and escaped, since that authored text was
   * never meant to carry markup.
   */
  function renderBody(entity, lang) {
    if (entity.bodyHtml) {
      const html = entity.bodyHtml[lang] || entity.bodyHtml.nl || Object.values(entity.bodyHtml)[0] || '';
      if (!html) return '';
      const container = document.createElement('div');
      container.innerHTML = html;
      linkifyMentions(container, entity);
      return container.innerHTML;
    }

    const raw = t(entity.body, lang);
    if (!raw) return '';
    const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const container = document.createElement('div');
    container.innerHTML = paragraphs.map(para => `<p>${escapeHtml(para)}</p>`).join('');
    linkifyMentions(container, entity);
    return container.innerHTML;
  }

  /**
   * The fielded block a chapel article opens with — Locatie, Kunstenaar, Jaar,
   * Eigendom. Left as the source wrote it: these are addresses, names and
   * ownership, not prose, so the keys stay Dutch in every language rather than
   * being half-translated into something a visitor could not match against the
   * archive.
   */
  function renderFacts(entity) {
    const facts = (entity.facts || []).filter(f => f && f.key && f.value);
    if (!facts.length) return '';
    return `<dl class="coll-detail-facts">${facts.map(f =>
      `<dt>${escapeHtml(f.key)}</dt><dd>${escapeHtml(f.value)}</dd>`).join('')}</dl>`;
  }

  /**
   * The full source article under the summary.
   *
   * It is the heritage society's own writing, lifted verbatim out of their PDF,
   * and it is Dutch only — so it is introduced by a line naming the source and,
   * for a visitor reading in another language, saying plainly that this part is
   * not translated. The four-language `body` above it is what they came for;
   * this is the archive underneath, not a broken promise.
   */
  function renderArticle(entity, lang) {
    const text = t(entity.article, lang);
    if (!text) return '';
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const doc = entity.document || {};
    const note = window.ui('article.dutchOnly');
    return `<div class="coll-detail-article">
      <div class="coll-section-label">${escapeHtml(window.ui('article.head'))}</div>
      ${doc.title ? `<div class="coll-article-source">${escapeHtml(doc.title)} — Medelo</div>` : ''}
      ${note ? `<div class="coll-article-note">${escapeHtml(note)}</div>` : ''}
      ${paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}
    </div>`;
  }

  /**
   * An optional block of Mééls beside the text.
   *
   * It is NOT a translation of the body and must never be treated as one — the
   * header language buttons do not reach it. It is dialect quoted verbatim from
   * the source, and it exists because some things in this village only exist in
   * Mééls: the Kieveloeët's carnival paper has come out in it every year since
   * 1951. The `gloss` under each line is a reading in the visitor's language,
   * and is labelled as such by the authored `note` rather than passing itself
   * off as verified.
   */
  function renderMeels(meels, lang) {
    if (!meels || !(meels.lines || []).length) return null;
    const wrap = el(`<div class="coll-meels">
      <div class="coll-meels-head">
        <span class="coll-meels-tag">Mééls</span>
        <span class="coll-meels-lede">${t(meels.lede, lang)}</span>
      </div>
      <div class="coll-meels-lines"></div>
      ${meels.note ? `<div class="coll-meels-note">${t(meels.note, lang)}</div>` : ''}
    </div>`);
    const lines = wrap.querySelector('.coll-meels-lines');
    meels.lines.forEach(l => {
      if (!l || !l.text) return;
      lines.appendChild(el(`<div class="coll-meels-line">
        <div class="coll-meels-text">${escapeHtml(l.text)}</div>
        ${l.gloss ? `<div class="coll-meels-gloss">${escapeHtml(t(l.gloss, lang))}</div>` : ''}
      </div>`));
    });
    return wrap;
  }

  /**
   * cfg = {
   *   id,                       // component id, e.g. "personen"
   *   eyebrow, title, lede,     // localized values; title may contain <em>
   *   signature: {              // optional — omit and the app is grid-only
   *     label,                  // localized
   *     build(entities, api)    // -> DOM node
   *   },
   *   cardClass,                // extra class on each grid card
   *   cardMeta(entity, api),    // optional -> HTML string under the name
   *   detailExtra(entity, api), // optional -> DOM node inside the detail
   *   search: true|false,       // name filter — grid fallback only, see below
   * }
   */
  window.buildCollectionApp = function buildCollectionApp(cfg) {
    const lang = window.getLang();
    const entities = window.entitiesFor(cfg.id);

    const api = {
      lang,
      componentId: cfg.id,
      t: (v) => t(v, lang),
      formatPeriod: (p) => formatPeriod(p, lang, { lifespan: !!cfg.periodIsLifespan }),
      placeholderFor: window.placeholderFor,
      openDetail,
      openRef: window.openRef,
      lookupRef: window.lookupRef,
      el,
      heroUrl,
    };

    const view = el(`<div class="coll-view">
      <div class="stub-head">
        <div>
          <div class="home-eyebrow">${t(cfg.eyebrow, lang)}</div>
          <h1>${t(cfg.title, lang)}</h1>
        </div>
        <div class="stub-lede">${t(cfg.lede, lang)}</div>
      </div>
      <div class="coll-body"></div>
    </div>`);

    const body = view.querySelector('.coll-body');

    // Every app is its signature view, full stop. There used to be an
    // "Overzicht" tab beside it holding the shared card grid, and a switcher
    // above the two — both are gone (Aug 2026, by request). Each signature
    // view already reaches every entity it owns: the jaarwiel turns to all six
    // festivities, the placemap lists every place beside the pins, the
    // generatiewand carries every person, the cinema every film. The tab was a
    // second door onto the same small room, and the switcher cost a row of
    // screen on every app to offer it.
    //
    // buildGrid below is deliberately KEPT, as the fallback for an app that
    // supplies no signature view. Nothing uses that path today; it is what
    // stops a future app from having to re-invent the grid, and it is where
    // `cfg.search` and `cfg.cardMeta` still apply.
    const hasSignature = !!(cfg.signature && typeof cfg.signature.build === 'function');

    function drawBody() {
      window.disposeSubtree(body);
      body.innerHTML = '';
      body.appendChild(hasSignature ? cfg.signature.build(entities, api) : buildGrid());
    }

    // ---------- Grid ----------
    function buildGrid() {
      const wrap = el(`<div class="coll-grid-wrap"></div>`);

      let filter = '';
      if (cfg.search) {
        const search = el(`<div class="coll-search">
          ${iconSvg('search')}
          <input type="text" placeholder="${window.ui('action.search')}" />
        </div>`);
        const input = search.querySelector('input');
        input.addEventListener('input', () => { filter = input.value.trim().toLowerCase(); drawCards(); });
        // No physical keyboard on the table.
        window.attachKeyboard(input);
        wrap.appendChild(search);
      }

      const grid = el(`<div class="coll-grid"></div>`);
      wrap.appendChild(grid);

      function drawCards() {
        grid.innerHTML = '';
        const shown = entities.filter(e => !filter || t(e.name, lang).toLowerCase().includes(filter));
        if (!shown.length) {
          grid.appendChild(el(`<div class="coll-empty">${window.ui('action.noResults')}</div>`));
          return;
        }
        shown.forEach((entity, i) => {
          const period = formatPeriod(entity.period, lang);
          const card = el(`<div class="coll-card ${cfg.cardClass || ''}">
            <div class="coll-card-image" style="${window.bgStyle(heroUrl(entity, window.placeholderFor(cfg.id + i)))}"></div>
            <div class="coll-card-meta">
              ${period ? `<div class="coll-card-period">${period}</div>` : ''}
              <h3 class="coll-card-name">${escapeHtml(t(entity.name, lang))}</h3>
              ${cfg.cardMeta ? cfg.cardMeta(entity, api) : `<div class="coll-card-sub">${escapeHtml(t(entity.subtitle, lang))}</div>`}
            </div>
          </div>`);
          card.addEventListener('click', () => openDetail(entity));
          grid.appendChild(card);
        });
      }

      drawCards();
      return wrap;
    }

    // ---------- Detail overlay ----------
    function closeDetail(detail) {
      window.disposeSubtree(detail);
      detail.remove();
    }

    function openDetail(entity) {
      view.querySelectorAll('.coll-detail').forEach(closeDetail);

      // An entity with folder-sourced material (see ScanEntityFolders) gets
      // that material as a free-manipulation canvas — the same draggable/
      // pinch-scalable/rotatable "leaves" the timeline uses — confined to the
      // left of the screen, with its (Markdown-rendered) text beside it. An
      // entity with no such folder keeps the older single hero + media-strip
      // layout untouched.
      //
      // Two sources can fill that canvas. A scanned folder supplies `items`
      // (Personen). An entity whose material is authored in JSON has `media`
      // instead, and gets the same handling when its app opts in with
      // `mediaCanvas` — Tradities does, because a tradition's photographs are
      // there to be picked up and compared, not filed in a strip under the
      // text. Folder items win where an entity somehow has both.
      const folderItems = Array.isArray(entity.items) ? entity.items : [];
      const mediaItems = cfg.mediaCanvas
        ? (entity.media || []).filter(m => m.url).map(m => ({
          caption: t(m.caption, lang),
          credit: m.credit || '',
          imagePath: m.url,
          width: m.width,
          height: m.height,
        }))
        : [];
      const canvasItems = folderItems.length ? folderItems : mediaItems;
      const fromMedia = !folderItems.length && mediaItems.length > 0;
      const hasCanvas = canvasItems.length > 0;

      const period = formatPeriod(entity.period, lang);
      // Split in two so the rebuilt-page view can put the article BETWEEN
      // them: heading and summary above it, the 3D viewer and the cross-links
      // after it. Everywhere else the two are simply concatenated and nothing
      // changes.
      const textHead = `
        ${period ? `<div class="coll-detail-period">${period}</div>` : ''}
        <h2 class="coll-detail-name">${escapeHtml(t(entity.name, lang))}</h2>
        <div class="coll-detail-sub">${escapeHtml(t(entity.subtitle, lang))}</div>
        ${renderFacts(entity)}
        <div class="coll-detail-body">${renderBody(entity, lang)}</div>
        ${renderArticle(entity, lang)}`;
      const textFoot = `
        <div class="coll-detail-extra"></div>
        <div class="coll-detail-links"></div>`;
      const textInner = textHead + textFoot;

      // A media canvas gets an even split. Tradities puts five to eighteen
      // photographs on it where a scanned person folder puts one to four, and
      // at the narrower column those either shrink past handling or pile up.
      // A place carrying a whole source article gets a slightly wider measure
      // than a two-paragraph biography does — see .has-article in hub.css.
      const hasArticle = !!entity.bodyHtml;

      const detail = hasCanvas
        ? el(`<div class="coll-detail coll-detail-split${fromMedia ? ' coll-detail-split-even' : ''}${hasArticle ? ' has-article' : ''}">
            <button class="coll-detail-close" aria-label="${window.ui('action.close')}">${iconSvg('close')}</button>
            <div class="coll-detail-split-inner">
              <div class="coll-detail-canvas"></div>
              <div class="coll-detail-textpane"><div class="coll-detail-text">${textInner}</div></div>
            </div>
          </div>`)
        : el(`<div class="coll-detail">
            <button class="coll-detail-close" aria-label="${window.ui('action.close')}">${iconSvg('close')}</button>
            <div class="coll-detail-inner">
              <div class="coll-detail-hero" style="${window.bgStyle(heroUrl(entity, window.placeholderFor(entity.id)))}"></div>
              <div class="coll-detail-text">${textInner}
                <div class="coll-detail-media"></div>
              </div>
            </div>
          </div>`);

      detail.querySelector('.coll-detail-close').addEventListener('click', () => closeDetail(detail));

      // A name inside the text goes where the chips below used to: to that
      // person. Delegated, because renderBody writes the links as markup and
      // there can be a dozen of them in a long article.
      detail.querySelector('.coll-detail-body').addEventListener('click', ev => {
        const link = ev.target.closest('.coll-link');
        if (!link) return;
        const target = window.lookupRef(link.dataset.ref);
        if (!target) return;
        // Staying inside this app means the overlay simply swaps, which keeps a
        // visitor's place; anything else is a jump to another app.
        if (target.componentId === cfg.id) openDetail(target.entity);
        else window.openRef(link.dataset.ref);
      });

      // App-specific module (relationship web, decade stack, 3D viewer, player).
      // Dialect sits directly under the text it belongs to, before whatever the
      // app adds of its own.
      const meels = renderMeels(entity.meels, lang);
      if (meels) detail.querySelector('.coll-detail-extra').appendChild(meels);

      if (cfg.detailExtra) {
        const extra = cfg.detailExtra(entity, api);
        if (extra) detail.querySelector('.coll-detail-extra').appendChild(extra);
      }

      // Media strip — tapping one opens it as a single draggable/pinchable/
      // rotatable card, the same gesture vocabulary as the timeline's leaves.
      // Not present in split mode: the canvas already shows this material.
      const mediaWrap = detail.querySelector('.coll-detail-media');
      const media = mediaWrap ? (entity.media || []).filter(m => m.url) : [];
      if (media.length) {
        mediaWrap.appendChild(el(`<div class="coll-section-label">${window.ui('detail.material')}</div>`));
        const strip = el(`<div class="coll-media-strip"></div>`);
        media.forEach(m => {
          const thumb = el(`<div class="coll-media-thumb" style="${window.bgStyle(m.url)}"></div>`);
          thumb.addEventListener('click', () => openMediaCard(m));
          strip.appendChild(thumb);
        });
        mediaWrap.appendChild(strip);
      }

      // Cross-links into the other apps — the thing that makes eight apps
      // read as one museum.
      const linksWrap = detail.querySelector('.coll-detail-links');
      const links = (entity.links || []).map(ref => ({ ref, target: window.lookupRef(ref) })).filter(x => x.target);
      if (links.length) {
        linksWrap.appendChild(el(`<div class="coll-section-label">${window.ui('detail.related')}</div>`));
        const chips = el(`<div class="coll-chips"></div>`);
        links.forEach(({ ref, target }) => {
          const chip = el(`<button class="coll-chip">
            <span class="coll-chip-app">${escapeHtml(window.appLabelFor(target))}</span>
            <span class="coll-chip-name">${t(target.label, lang)}</span>
            ${iconSvg('arrow')}
          </button>`);
          chip.addEventListener('click', () => window.openRef(ref));
          chips.appendChild(chip);
        });
        linksWrap.appendChild(chips);
      }

      view.appendChild(detail);
      detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

      if (hasCanvas) {
        const canvasEl = detail.querySelector('.coll-detail-canvas');
        // fitToArea is for the media canvas only. A scanned folder holds one to
        // four files and has been laid out at the full leaf size since it was
        // built; leaving Personen on that path keeps it pixel-for-pixel as it
        // was, which is not what this change is about.
        // Captions come with the authored media, never with scanned folder
        // items — a folder item's "title" is its filename.
        window.scatterLeaves(canvasEl, canvasItems, canvasEl.offsetWidth, canvasEl.offsetHeight,
          { fitToArea: fromMedia || canvasItems.length > 4, captions: fromMedia });
      }

      return detail;
    }

    function openMediaCard(m) {
      const overlay = el(`<div class="coll-media-overlay">
        <button class="coll-media-close">${iconSvg('close')}</button>
        <div class="coll-media-canvas"></div>
      </div>`);
      const canvas = overlay.querySelector('.coll-media-canvas');

      // Size off the real image proportions, same approach as the timeline
      // leaves, but relative to the canvas so it fills the same share of a
      // narrow laptop screen and a wide table.
      const stage = window.stageSize();
      const target = Math.round(stage.height * 0.56);
      const w = m.width || 1200, h = m.height || 900;
      const scale = target / Math.max(w, h);
      const cardW = Math.round(w * scale), cardH = Math.round(h * scale);

      const card = el(`<div class="leaf-card">
        <div class="leaf-card-media" style="${window.bgStyle(m.url)}"></div>
        <div class="corner-handle tl"></div><div class="corner-handle tr"></div>
        <div class="corner-handle bl"></div><div class="corner-handle br"></div>
      </div>`);
      card.style.width = cardW + 'px';
      card.style.height = cardH + 'px';
      canvas.appendChild(card);

      const handle = window.makeInteractiveCard(card, {
        x: (stage.width - cardW) / 2,
        y: (stage.height - stage.headerHeight - cardH) / 2,
        rotation: 0,
        scale: 1,
      });
      handle.apply();

      overlay.querySelector('.coll-media-close').addEventListener('click', () => overlay.remove());

      // Tapping the dark surround closes it too. The only other way out is a
      // button at the far left edge, and this overlay covers the whole app at
      // z-index 30 — a visitor who does not spot that button is left tapping a
      // screen that answers nothing. Only the backdrop dismisses: a tap that
      // lands on the card itself is someone handling the document.
      overlay.addEventListener('click', ev => {
        if (ev.target.closest('.leaf-card') || ev.target.closest('.coll-media-close')) return;
        overlay.remove();
      });

      view.appendChild(overlay);
    }

    drawBody();

    // Deep-link from a cross-link chip in another app.
    //
    // Deferred a frame, for two reasons. The view is still detached at this
    // point, so anything in the detail that measures itself — the 3D viewer, a
    // media card — would read zeros. And opening it inline made the detail part
    // of the navigation itself: if it threw, the whole app failed to build and
    // the visitor was left on the screen they had tried to leave. This way the
    // app lands first, exactly as it does when you tap its tile, and the linked
    // entity opens on top of it a frame later.
    const pending = window.consumePendingEntity(cfg.id);
    if (pending) {
      const entity = entities.find(e => e.id === pending);
      if (entity) {
        requestAnimationFrame(() => {
          // The visitor may have moved on in that frame; don't open a detail
          // into a view that is no longer on screen.
          if (!view.isConnected) return;
          try { openDetail(entity); } catch (err) { console.error('[collection] deep link failed', err); }
        });
      }
    }

    return view;
  };
})();
