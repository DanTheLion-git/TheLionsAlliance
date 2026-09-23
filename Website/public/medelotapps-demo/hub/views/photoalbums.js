/* ============================================================
   Foto-archief as albums that land on the table.

   The product's Foto-archief is a card grid (buildCollectionApp's shared
   fallback): tap an album, get a grid of thumbnails, tap one, get it large.
   That is a filing cabinet. The timeline already does something better with
   the same material — tap an era and its photographs are thrown onto the
   table, where they can be picked up, turned, enlarged and laid side by side.

   This gives Foto-archief that behaviour. It reuses the timeline's own
   window.scatterLeaves and its .leaves-view chrome, so a photograph on the
   table here is the same object, with the same gestures, as one in Tijdlijn.
   The only hub.js change is a one-line hook in buildPhotos.

   Written for the public web demo. If it earns its keep there, it is a clean
   port back to the table build: nothing in it knows it is on the web.
   ============================================================ */
(function () {
  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  const esc = s => window.escapeHtml(s == null ? '' : String(s));

  window.buildPhotoAlbums = function buildPhotoAlbums() {
    const lang = window.getLang();
    const albums = window.entitiesFor('fotoarchief');
    const photoCount = albums.reduce((sum, a) => sum + (a.items || []).length, 0);

    const view = el(`<div class="coll-view pa-view">
      <div class="pa-list">
        <div class="stub-head">
          <div>
            <div class="home-eyebrow">${esc(window.ui('app.photos.eyebrow'))}</div>
            <h1>${window.ui('app.photos.title')}</h1>
          </div>
          <div class="stub-lede">${esc(window.ui('app.photos.lede', { albums: albums.length, photos: photoCount }))}</div>
        </div>
        <div class="pa-shelf"></div>
      </div>
    </div>`);

    const list = view.querySelector('.pa-list');
    const shelf = view.querySelector('.pa-shelf');

    albums.forEach((album, i) => {
      const items = album.items || [];
      // Three prints fanned on top of each other: the album reads as a pile of
      // photographs, which is what it turns into when opened.
      const prints = items.slice(0, 3).map((it, k) =>
        `<div class="pa-print pa-print--${k}" style="${window.bgStyle(it.imagePath)}"></div>`).join('');
      const card = el(`<button class="pa-album" type="button">
        <div class="pa-stack">${prints}</div>
        <div class="pa-name">${esc(window.t(album.name, lang))}</div>
        <div class="pa-sub">${esc(window.t(album.subtitle, lang))}</div>
      </button>`);
      card.style.animationDelay = (i * 70) + 'ms';
      card.addEventListener('click', () => diveIn(album));
      shelf.appendChild(card);
    });

    let open = null;

    // The same zoom-through the timeline uses: the shelf falls away, the
    // table is underneath, the photographs are thrown onto it.
    function diveIn(album) {
      list.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }],
        { duration: 350, easing: 'ease-in', fill: 'forwards' },
      ).onfinish = () => {
        list.style.display = 'none';
        open = buildTable(album);
        view.appendChild(open);
        open.animate(
          [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 300, easing: 'ease-out', fill: 'forwards' },
        );
      };
    }

    function goBack() {
      if (!open) return;
      open.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in', fill: 'forwards' })
        .onfinish = () => {
          window.disposeSubtree(open);
          open.remove();
          open = null;
          list.style.display = '';
          list.animate(
            [{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'scale(1)' }],
            { duration: 300, easing: 'ease-out', fill: 'forwards' },
          );
        };
    }

    function buildTable(album) {
      const stage = window.stageSize();
      const table = el(`<div class="leaves-view pa-table">
        <button class="leaves-back" type="button">${window.iconSvg('close')}</button>
        <div class="pa-table-label">
          <div class="pa-table-name">${esc(window.t(album.name, lang))}</div>
          <div class="pa-table-sub">${esc(window.t(album.subtitle, lang))}</div>
        </div>
        <div class="leaves-canvas"></div>
      </div>`);
      table.querySelector('.leaves-back').addEventListener('click', goBack);

      // Unlike a timeline item, an archive photograph's caption is the point
      // of it — who, where, when — so captions and credits go on the prints.
      // They are the source's own words and are not translated.
      const items = (album.items || []).map(it => ({
        imagePath: it.imagePath,
        width: it.width,
        height: it.height,
        caption: window.t(it.caption, lang),
        credit: it.credit || '',
      }));
      window.scatterLeaves(table.querySelector('.leaves-canvas'), items,
        stage.width, stage.height - stage.headerHeight, { captions: true });
      return table;
    }

    // A "Foto-archief: Landbouw" chip elsewhere promises the album, not the shelf.
    const pending = window.consumePendingEntity && window.consumePendingEntity('fotoarchief');
    if (pending) {
      const album = albums.find(a => a.id === pending);
      if (album) requestAnimationFrame(() => diveIn(album));
    }

    return view;
  };
})();
