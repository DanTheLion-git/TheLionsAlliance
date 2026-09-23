/* ============================================================
   Verhalen — signature view: one story read large, the rest
   listed beside it.

   The whole design rests on one decision. Some of these films are
   genuine archive footage; others are narratives illustrated with
   AI. In a heemkundekring museum, presenting the second kind as
   though it were the first would be indefensible — so:

     1. Every story is labelled, permanently and visibly, as
        archive footage, AI-illustrated, or an archive article.
        Not in a credits screen nobody reaches.
     2. While an AI-illustrated film plays, a strip beside it shows
        the *real* archive material each scene was built from,
        swapped on `timeupdate` from the authored chapter list.

   That turns the obvious objection into the strongest feature: you
   are always one glance from the document the scene came from.

   A third kind arrived later: the 25 written accounts from
   Medelo's "Verhalen in Journaal". Those are read, not watched,
   and are labelled "Archiefstuk" — neither of the two film labels
   would be true of them. Their pages are pre-rendered images
   (see buildPages), because PdfRenderer only rasterises page one.

   LAYOUT (Aug 2026, by request). The index of all 30 stories sits
   in a column on the right and scrolls; the selected story fills
   the left. Before this the list was a horizontal strip along the
   bottom, which cost ~340px of height and left a document page
   rendering about 900px wide — legible in theory, not in a museum.
   The reading pane now runs the full height, and a document opens
   at page width rather than whole-page, so the text arrives at the
   size the pages were rendered for. See `.sp-page[data-fit]`.
   ============================================================ */
(function () {
    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "storyplayer." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('storyplayer.' + String(name)) });

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  /**
   * el() builds its nodes inside a <template>, and a template's contents belong
   * to an inert document whose timeline never advances. An animation started on
   * a node while it still lives there is stranded on its first keyframe for
   * good — it does not even show up in getAnimations() once the node has been
   * adopted into the page. That is what left every article page sitting
   * invisible on a dark screen: opacity 0, permanently. So only fade what is
   * already on the page; a node appearing for the first time has nothing to
   * fade in from anyway.
   */
  function fadeIn(node, ms) {
    if (!node || !node.isConnected) return;
    node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-out' });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Resolve a chapter's source to something displayable: either a direct media
   * file authored on the chapter, or a cross-reference into the entity graph
   * (so a scene can point at the actual person or building it depicts).
   */
  function resolveSource(chapter, api) {
    if (chapter.url) return { image: chapter.url, label: api.t(chapter.caption), ref: null };
    if (!chapter.sourceRef) return null;
    const target = api.lookupRef(chapter.sourceRef);
    if (!target) return null;
    const entity = target.entity;
    const image = (entity.hero && entity.hero.url)
      || (entity.media && entity.media[0] && entity.media[0].url)
      || entity.thumbnail
      || (entity.items && entity.items[0] && entity.items[0].imagePath)
      || api.placeholderFor(target.id);
    return {
      image,
      label: api.t(chapter.caption) || api.t(target.label),
      ref: chapter.sourceRef,
      appLabel: window.appLabelFor(target),
    };
  }

  /**
   * Which of the three kinds of story is this? The distinction is the whole
   * point of the view, so it is decided in one place and nowhere else.
   *
   * `document` is the third kind, added when the 25 "Verhalen in Journaal"
   * accounts from Medelo came in: a real archive article, written by the
   * heemkundekring, that is read rather than watched. It is neither archive
   * footage nor an AI-illustrated film and must not be labelled as either.
   */
  function kindOf(entity) {
    // `entity.youtube` counts as having a film. See views/youtube.js — the web
    // demo's three films are embedded rather than hosted, because they are not ours.
    if (entity.kind === 'document' || (!entity.video && !entity.youtube && (entity.media || []).length)) return 'document';
    return entity.archival ? 'archival' : 'ai';
  }

  window.storyKindOf = kindOf;

  /** The permanent provenance label, resolved in one place for every caller. */
  function provenanceOf(entity, api) {
    const kind = kindOf(entity);
    const pair = {
      archival: [TEXT.archival, TEXT.archivalNote],
      ai: [TEXT.ai, TEXT.aiNote],
      document: [TEXT.document, TEXT.documentNote],
    }[kind];
    return { kind, tag: api.t(pair[0]), note: api.t(pair[1]) };
  }

  window.storyProvenance = provenanceOf;

  /**
   * The player itself.
   *
   * `opts.inline` is the cinema's variant: the provenance label is hoisted into
   * the title row the cinema owns (it must stay visible, it just does not need
   * a band of its own), and the source cards lie along the bottom as a thin
   * strip instead of taking a whole column — the column is the story index now.
   */
  function buildPlayer(entity, api, opts) {
    const inline = !!(opts && opts.inline);
    const chapters = (entity.chapters || []).slice().sort((a, b) => a.t - b.t);
    const prov = provenanceOf(entity, api);
    const kind = prov.kind;

    const wrap = el(`<div class="sp-player${inline ? ' sp-player-inline' : ''}">
      <div class="sp-main">
        <div class="sp-screen"></div>
        ${inline ? '' : `<div class="sp-provenance ${kind}">
          <span class="sp-provenance-tag">${prov.tag}</span>
          <span class="sp-provenance-note">${prov.note}</span>
        </div>`}
        <div class="sp-transport"></div>
      </div>
      <div class="sp-rail">
        <div class="coll-section-label">${api.t(chapters.length ? TEXT.sources : TEXT.allSources)}</div>
        <div class="sp-rail-body"></div>
      </div>
    </div>`);

    const screen = wrap.querySelector('.sp-screen');
    const transport = wrap.querySelector('.sp-transport');
    const rail = wrap.querySelector('.sp-rail');
    const railBody = wrap.querySelector('.sp-rail-body');

    /**
     * An empty rail is worse than no rail: inline it would eat a band of the
     * reading pane to show nothing. Most stories carry no chapters and no
     * cross-links yet, so this is the common case, not the edge case.
     */
    function trimRail() {
      if (!railBody.children.length) rail.remove();
    }

    function renderAllSources() {
      railBody.innerHTML = '';
      const refs = chapters.length
        ? chapters.map(ch => resolveSource(ch, api)).filter(Boolean)
        : (entity.links || []).map(ref => {
            const target = api.lookupRef(ref);
            if (!target) return null;
            const e2 = target.entity;
            return {
              ref,
              appLabel: window.appLabelFor(target),
              label: api.t(target.label),
              image: (e2.hero && e2.hero.url) || e2.thumbnail
                || (e2.items && e2.items[0] && e2.items[0].imagePath) || api.placeholderFor(target.id),
            };
          }).filter(Boolean);

      refs.forEach(source => {
        const card = el(`<div class="sp-source sp-source-compact">
          <div class="sp-source-image" style="${window.bgStyle(source.image)}"></div>
          <div class="sp-source-meta">
            ${source.appLabel ? `<div class="sp-source-app">${window.escapeHtml(source.appLabel)}</div>` : ''}
            <div class="sp-source-label">${source.label || ''}</div>
          </div>
        </div>`);
        if (source.ref) card.addEventListener('click', () => api.openRef(source.ref));
        railBody.appendChild(card);
      });
    }

    function renderChapterSource(idx) {
      railBody.innerHTML = '';
      const chapter = idx >= 0 ? chapters[idx] : chapters[0];
      if (!chapter) { renderAllSources(); return; }
      const source = resolveSource(chapter, api);
      if (!source) return;
      const card = el(`<div class="sp-source">
        <div class="sp-source-image" style="${window.bgStyle(source.image)}"></div>
        <div class="sp-source-meta">
          ${source.appLabel ? `<div class="sp-source-app">${window.escapeHtml(source.appLabel)}</div>` : ''}
          <div class="sp-source-label">${source.label || ''}</div>
        </div>
      </div>`);
      if (source.ref) card.addEventListener('click', () => api.openRef(source.ref));
      railBody.appendChild(card);
      fadeIn(card, 220);
    }

    // ---- A document: the pages themselves, turned like a book. ----
    if (kind === 'document') {
      buildPages(entity, api, screen, transport);
      renderAllSources();
      trimRail();
      return wrap;
    }

    // ---- No film yet: say so plainly, and show the sources anyway. ----
    if (!entity.video && !entity.youtube) {
      screen.classList.add('is-film');
      const blank = el(`<div class="sp-frame"></div>`);
      blank.appendChild(el(`<div class="sp-pending">
        <div class="sp-pending-title">${api.t(TEXT.noVideo)}</div>
        <div class="sp-pending-sub">${api.t(TEXT.noVideoSub)}</div>
      </div>`));
      screen.appendChild(blank);
      transport.remove();
      renderAllSources();
      trimRail();
      return wrap;
    }

    const poster = entity.hero && entity.hero.url ? ` poster="${entity.hero.url}"` : '';
    // A YouTube film returns an element with the same surface a <video> has,
    // so everything below this line is the same code for both. views/youtube.js.
    const video = entity.youtube
      ? window.makeYouTubeVideo(entity.youtube, { poster: entity.hero && entity.hero.url })
      : el(`<video class="sp-video" src="${entity.video}" playsinline preload="metadata"${poster}></video>`);
    // The film sits in a 16:9 window of its own rather than in the whole pane.
    // The pane is far wider than 16:9 on a table this size, and a percentage
    // height on a grid item whose row is auto-sized cannot resolve — the video
    // fell back to its intrinsic height, overflowed, and had its top and bottom
    // clipped away. The frame gives it a definite box; object-fit: contain then
    // letterboxes the 4:3 archive films inside it instead of cropping them.
    screen.classList.add('is-film');
    const frame = el(`<div class="sp-frame"></div>`);
    frame.appendChild(video);
    screen.appendChild(frame);

    transport.appendChild(el(`<button class="sp-play">${iconSvg('play')}</button>`));
    const scrubWrap = el(`<div class="sp-scrub">
      <div class="sp-scrub-track"><div class="sp-scrub-fill"></div><div class="sp-scrub-ticks"></div></div>
    </div>`);
    transport.appendChild(scrubWrap);
    transport.appendChild(el(`<div class="sp-time">0:00</div>`));

    const playBtn = transport.querySelector('.sp-play');
    const track = scrubWrap.querySelector('.sp-scrub-track');
    const fill = scrubWrap.querySelector('.sp-scrub-fill');
    const ticks = scrubWrap.querySelector('.sp-scrub-ticks');
    const timeLabel = transport.querySelector('.sp-time');

    playBtn.addEventListener('click', () => {
      if (video.paused) video.play(); else video.pause();
    });
    video.addEventListener('play', () => { playBtn.innerHTML = iconSvg('pause'); });
    video.addEventListener('pause', () => { playBtn.innerHTML = iconSvg('play'); });

    // A museum table stands in a room with other people in it, so sound is a
    // deliberate act: the film starts muted and the visitor turns it on.
    // Films known to have no soundtrack get no button rather than a dead one.
    video.muted = true;
    if (entity.silent !== true) {
      const soundBtn = el(`<button class="sp-sound" aria-label="${api.t(TEXT.unmute)}">${iconSvg('soundOff')}</button>`);
      transport.appendChild(soundBtn);
      soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        soundBtn.innerHTML = iconSvg(video.muted ? 'soundOff' : 'sound');
        soundBtn.setAttribute('aria-label', api.t(video.muted ? TEXT.unmute : TEXT.mute));
        soundBtn.classList.toggle('on', !video.muted);
      });
    }

    video.addEventListener('loadedmetadata', () => {
      // Chapter ticks can only be placed once the duration is known.
      chapters.forEach(ch => {
        if (!video.duration) return;
        const tick = el(`<button class="sp-tick" style="left:${(ch.t / video.duration) * 100}%"></button>`);
        tick.addEventListener('click', e => { e.stopPropagation(); video.currentTime = ch.t; });
        ticks.appendChild(tick);
      });
    });

    let currentChapter = -1;
    video.addEventListener('timeupdate', () => {
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      fill.style.width = pct + '%';
      timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;

      // Swap the rail to the source behind whatever is on screen right now.
      let idx = -1;
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].t <= video.currentTime + 0.05) idx = i; else break;
      }
      if (idx !== currentChapter) {
        currentChapter = idx;
        renderChapterSource(idx);
      }
    });

    // Scrubbing: a big touch target, dragged rather than clicked.
    let scrubbing = false;
    const seekTo = clientX => {
      const r = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      if (video.duration) video.currentTime = ratio * video.duration;
    };
    track.addEventListener('pointerdown', e => {
      scrubbing = true; track.setPointerCapture(e.pointerId); seekTo(e.clientX);
    });
    track.addEventListener('pointermove', e => { if (scrubbing) seekTo(e.clientX); });
    track.addEventListener('pointerup', e => { scrubbing = false; track.releasePointerCapture(e.pointerId); });
    track.addEventListener('pointercancel', () => { scrubbing = false; });

    if (chapters.length) renderChapterSource(-1); else renderAllSources();
    trimRail();

    return wrap;
  }

  // ---------- Signature view: the cinema ----------
  window.buildCinema = function buildCinema(entities, api) {
    if (!entities.length) return el('<div class="sp-cinema"></div>');

    const view = el(`<div class="sp-cinema">
      <div class="sp-cinema-stage"></div>
      <aside class="sp-index"><div class="sp-index-list"></div></aside>
    </div>`);

    const stage = view.querySelector('.sp-cinema-stage');
    const list = view.querySelector('.sp-index-list');

    function show(entity) {
      // Stop whatever was playing before swapping — otherwise audio from the
      // previous film keeps running under the new one.
      stage.querySelectorAll('video').forEach(v => v.pause());
      stage.innerHTML = '';

      const prov = provenanceOf(entity, api);
      stage.appendChild(el(`<div class="sp-cinema-title">
        <div class="sp-cinema-heading">
          <h2>${window.escapeHtml(api.t(entity.name))}</h2>
          <div class="sp-cinema-sub">${window.escapeHtml(api.t(entity.subtitle) || '')}</div>
        </div>
        <div class="sp-provenance ${prov.kind}">
          <span class="sp-provenance-tag">${prov.tag}</span>
          <span class="sp-provenance-note">${prov.note}</span>
        </div>
      </div>`));
      stage.appendChild(buildPlayer(entity, api, { inline: true }));

      list.querySelectorAll('.sp-item').forEach(item => {
        const on = item.dataset.id === entity.id;
        item.classList.toggle('active', on);
        if (on) item.setAttribute('aria-current', 'true'); else item.removeAttribute('aria-current');
      });
    }

    // Two groups, because "a film" and "an article you read" are different
    // commitments, and the visitor is choosing between them rather than
    // browsing one undifferentiated pile of thirty.
    function addGroup(label, group) {
      if (!group.length) return;
      list.appendChild(el(`<div class="coll-section-label sp-index-group">${api.t(label)}<span>${group.length}</span></div>`));
      group.forEach(entity => {
        const kind = kindOf(entity);
        const pages = (entity.media || []).length;
        const meta = kind === 'document' && pages
          ? `${pages} ${api.t(TEXT.pages)}`
          : (api.t(entity.subtitle) || '');
        const item = el(`<button class="sp-item" data-id="${entity.id}">
          <div class="sp-item-thumb" style="${window.bgStyle(api.heroUrl(entity, api.placeholderFor(entity.id)))}"></div>
          <div class="sp-item-text">
            <div class="sp-item-name">${window.escapeHtml(api.t(entity.name))}</div>
            <div class="sp-item-meta">${meta}</div>
            <span class="story-kind ${kind}">${api.t(TEXT[kind] || TEXT.ai)}</span>
          </div>
        </button>`);
        item.addEventListener('click', () => show(entity));
        list.appendChild(item);
      });
    }

    addGroup(TEXT.films, entities.filter(e => kindOf(e) !== 'document'));
    addGroup(TEXT.articles, entities.filter(e => kindOf(e) === 'document'));

    show(entities[0]);
    return view;
  };

  /**
   * A document story, page by page. The pages arrive as ordinary images
   * (media/<id>/pagina-NN.jpg) rather than as the PDF, because PdfRenderer
   * rasterises only page one and these articles run to a dozen — and Chromium
   * will not composite its own PDF viewer inside the transformed #stage, so an
   * embedded viewer is not an option either. Pre-rendered pages sidestep both.
   *
   * It opens at page *width*, not whole-page. A whole A4 inside the reading
   * pane lands around 900px wide, which is smaller than the paper it was
   * printed on; at width it fills the pane and you scroll, which is how a long
   * article wants to be read anyway. The toggle gives back the overview.
   */
  function buildPages(entity, api, screen, transport) {
    const pages = (entity.media || []).map(m => m.url).filter(Boolean);
    if (!pages.length) {
      screen.appendChild(el(`<div class="sp-pending">
        <div class="sp-pending-title">${api.t(TEXT.noPages)}</div>
      </div>`));
      transport.remove();
      return;
    }

    let index = 0;
    const page = el(`<div class="sp-page" data-fit="width"><img class="sp-page-img" alt=""></div>`);
    const img = page.querySelector('.sp-page-img');
    screen.appendChild(page);

    transport.appendChild(el(`<button class="sp-page-prev">${iconSvg('chevronL')}</button>`));
    const counter = el(`<div class="sp-page-count"></div>`);
    transport.appendChild(counter);
    transport.appendChild(el(`<button class="sp-page-next">${iconSvg('chevronR')}</button>`));
    const fitBtn = el(`<button class="sp-page-fit">${api.t(TEXT.fitWidth)}</button>`);
    transport.appendChild(fitBtn);

    const prev = transport.querySelector('.sp-page-prev');
    const next = transport.querySelector('.sp-page-next');

    fitBtn.addEventListener('click', () => {
      const whole = page.getAttribute('data-fit') === 'page';
      page.setAttribute('data-fit', whole ? 'width' : 'page');
      fitBtn.textContent = api.t(whole ? TEXT.fitWidth : TEXT.fitPage);
      page.scrollTop = 0;
    });

    function draw() {
      img.src = pages[index];
      counter.textContent = `${index + 1} / ${pages.length}`;
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      // A new page starts at the top; carrying the previous scroll offset over
      // drops the reader into the middle of a paragraph they have not read.
      page.scrollTop = 0;
      fadeIn(img, 160);
    }

    const step = delta => {
      const target = Math.min(pages.length - 1, Math.max(0, index + delta));
      if (target === index) return;
      index = target;
      draw();
    };
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));

    // Swiping the page is the gesture a visitor reaches for on a table before
    // they look for a button, so honour it as well as the arrows — but only
    // when the swipe is clearly sideways. The pointer is deliberately not
    // captured: at page width the same finger has to be able to scroll down.
    let startX = null, startY = null;
    page.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
    page.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = startY = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
    page.addEventListener('pointercancel', () => { startX = startY = null; });

    draw();
  }

  /** Compact player for the shared detail overlay. */
  window.buildStoryDetail = function buildStoryDetail(entity, api) {
    return buildPlayer(entity, api);
  };
})();
