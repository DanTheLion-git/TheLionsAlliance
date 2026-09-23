/* ============================================================
   Personen — signature view: de generatiewand.

   This replaced the levenslijnen. That view drew one bar per
   person on a shared century axis, which reads beautifully for a
   dozen people and collapses for a hundred: 34 of Meijel's 89
   dated villagers were born between 1900 and 1919, so their bars
   all overlapped and the packer pushed them onto 70 separate
   rows — eight screens of scrolling, and the one thing a lifeline
   is for, seeing who overlapped whom, lost in it.

   A generation is the honest unit here. Each decade of birth gets
   a shelf; the people born in it stand on that shelf as cards and
   wrap onto as many lines as they need. A crowded decade becomes
   a taller shelf instead of eighteen colliding bars, nobody is
   pushed off the axis, and every portrait stays the same size.

   Each card carries a life bar drawn at a FIXED pixels-per-year,
   so a life is directly comparable to the one beside it without
   an axis to read against. Where the death date is unknown the
   bar is drawn at the assumed span and fades out — see
   window.endIsUnknown in collection.js.
   ============================================================ */
(function () {
  const SHELF_GAP = 72;         // between one decade and the next
  const PX_PER_YEAR = 1.7;      // the life bar's fixed scale
  const ASSUMED_LIFESPAN = 75;  // drawn length when the end is unknown
  const MAX_BAR = 170;

    // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "generations." prefix. Looked up lazily rather than resolved once, because the
  // visitor can switch language between renders. TEXT.<name> still yields a
  // string, so every call site — including the ones that wrap it in api.t() —
  // is unchanged.
  const TEXT = new Proxy({}, { get: (_, name) => window.ui('generations.' + String(name)) });

  // Grouping by what the Beroep field says. It is not decoration: 73 of the
  // 101 villagers in this register entered religious life, which is the single
  // most striking thing the collection says about Meijel.
  const GROUPS = [
    { id: 'all', label: TEXT.all, test: () => true },
    { id: 'zusters', label: window.ui('generations.group.zusters'),
      test: s => /^zuster/.test(s) },
    { id: 'geestelijken', label: window.ui('generations.group.geestelijken'),
      test: s => /^(pater|priester|kapelaan|pastoor|missionaris|broeder|deken)/.test(s) },
    { id: 'bestuur', label: window.ui('generations.group.bestuur'),
      test: s => /(burgemeester|schout|maire|wethouder|secretaris)/.test(s) },
    { id: 'werk', label: window.ui('generations.group.werk'),
      test: s => /(landbouw|boer|veenarbeider|werkman|turf|molenaar|herbergier)/.test(s) },
  ];

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  const startOf = p => (p && p.from != null ? p.from : null);

  /** How long the life bar should be drawn, in years. */
  function spanYears(period) {
    if (!period || period.from == null) return 0;
    if (period.to != null) return Math.max(period.to - period.from, 1);
    // No end date: either still living, or — for anyone born long enough ago
    // that this is impossible — simply not recorded. Both get the assumed span
    // rather than a bar stretching to today, which for someone born in 1718
    // would claim three centuries of life.
    if (window.endIsUnknown && window.endIsUnknown(period)) return ASSUMED_LIFESPAN;
    return Math.max(new Date().getFullYear() - period.from, 1);
  }

  /**
   * Group people into shelves by decade of birth — but merge the thin decades.
   *
   * A shelf per decade sounds tidy and is not: this register runs from 1610 to
   * 1944 with most of its weight in four decades, so a fixed decade gives 24
   * shelves of which a dozen hold one or two people, each still paying for a
   * heading. Growing a band until it has enough people (or has covered enough
   * years to stop being one generation) keeps 1900 and 1910 to themselves,
   * where the crowd actually is, and folds the sparse seventeenth century into
   * one honest "1670–1749".
   */
  function bandsOf(dated) {
    const MIN_PER_BAND = 5, MAX_SPAN = 60, MIN_TAIL = 3;
    const byDecade = new Map();
    dated.forEach(e => {
      const decade = Math.floor(startOf(e.period) / 10) * 10;
      if (!byDecade.has(decade)) byDecade.set(decade, []);
      byDecade.get(decade).push(e);
    });

    const bands = [];
    let current = null;
    [...byDecade.keys()].sort((a, b) => a - b).forEach(decade => {
      if (!current) current = { from: decade, to: decade + 9, people: [] };
      current.people = current.people.concat(byDecade.get(decade));
      current.to = decade + 9;
      if (current.people.length >= MIN_PER_BAND || (current.to - current.from) >= MAX_SPAN) {
        bands.push(current);
        current = null;
      }
    });
    if (current) bands.push(current);

    // A trailing handful is a stub, not a generation — fold it back.
    if (bands.length > 1 && bands[bands.length - 1].people.length < MIN_TAIL) {
      const tail = bands.pop();
      const prev = bands[bands.length - 1];
      prev.people = prev.people.concat(tail.people);
      prev.to = tail.to;
    }

    bands.forEach(b => {
      b.people.sort((x, y) => startOf(x.period) - startOf(y.period));
      const sameDecade = Math.floor(b.from / 10) === Math.floor(b.to / 10);
      // window.formatPeriod knows how to say a negative year; see collection.js.
      b.label = sameDecade
        ? window.formatPeriod({ from: b.from, to: b.from })
        : window.formatPeriod({ from: b.from, to: b.to });
    });
    return bands;
  }

  function initials(name) {
    return name.split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ]/.test(w) && w.length > 2)
      .slice(0, 2).map(w => w[0].toUpperCase()).join('') || name.slice(0, 1).toUpperCase();
  }

  window.buildGenerations = function buildGenerations(entities, api) {
    const view = el(`<div class="gw-view">
      <div class="gw-filters"></div>
      <div class="gw-scroll"><div class="gw-shelves"></div></div>
      <div class="gw-hint">${api.t(TEXT.hint)}</div>
    </div>`);

    const filtersEl = view.querySelector('.gw-filters');
    const shelvesEl = view.querySelector('.gw-shelves');

    // Classify on the DUTCH subtitle, never on the visitor's language. The
    // GROUPS tests below are Dutch words ("zuster", "pastoor", "landbouw"), and
    // they have to be: they read the Beroep field as the register wrote it. Ask
    // api.t() for it instead and the moment personen.json gained en/de/fr
    // subtitles every test would miss, `groups` would collapse to just `all`,
    // and the `groups.length > 2` guard below would delete the whole filter bar
    // in three of the four languages. The chip LABELS stay localized.
    const beroepOf = e => (window.t(e.subtitle, 'nl') || '').split('·')[0].trim().toLowerCase();
    const groups = GROUPS.filter(g => g.id === 'all' || entities.some(e => g.test(beroepOf(e))));
    let active = 'all';

    if (groups.length > 2) {
      groups.forEach(g => {
        const count = entities.filter(e => g.test(beroepOf(e))).length;
        const chip = el(`<button class="gw-filter${g.id === active ? ' active' : ''}">${api.t(g.label)}<span>${count}</span></button>`);
        chip.addEventListener('click', () => {
          if (active === g.id) return;
          active = g.id;
          filtersEl.querySelectorAll('.gw-filter').forEach((b, i) => b.classList.toggle('active', groups[i].id === active));
          draw();
        });
        filtersEl.appendChild(chip);
      });
    } else {
      filtersEl.remove();
    }

    function card(entity) {
      const period = entity.period;
      const portrait = api.heroUrl(entity, '');
      const years = api.formatPeriod(period);
      const bar = Math.min(MAX_BAR, Math.round(spanYears(period) * PX_PER_YEAR));
      const openEnded = period && period.to == null;

      const node = el(`<button class="gw-card">
        <div class="gw-portrait${portrait ? '' : ' is-empty'}"
             ${portrait ? `style="${window.bgStyle(portrait)}"` : ''}>
          ${portrait ? '' : `<span>${initials(api.t(entity.name))}</span>`}
        </div>
        <div class="gw-name">${window.escapeHtml(api.t(entity.name))}</div>
        ${years ? `<div class="gw-years">${years}</div>` : ''}
        ${bar ? `<div class="gw-bar${openEnded ? ' open-ended' : ''}" style="width:${bar}px"></div>` : ''}
        <div class="gw-role">${window.escapeHtml(api.t(entity.subtitle))}</div>
      </button>`);
      node.addEventListener('click', () => api.openDetail(entity));
      return node;
    }

    function draw() {
      const group = groups.find(g => g.id === active);
      const shown = entities.filter(e => group.test(beroepOf(e)));
      shelvesEl.innerHTML = '';

      const dated = shown.filter(e => startOf(e.period) != null);
      const undated = shown.filter(e => startOf(e.period) == null);

      bandsOf(dated).forEach(band => {
        const shelf = el(`<div class="gw-shelf">
          <div class="gw-shelf-head">
            <div class="gw-decade">${band.label}</div>
            <div class="gw-rule"></div>
            <div class="gw-count">${band.people.length}</div>
          </div>
          <div class="gw-cards"></div>
        </div>`);
        const cards = shelf.querySelector('.gw-cards');
        band.people.forEach(e => cards.appendChild(card(e)));
        shelvesEl.appendChild(shelf);
      });

      // People with no dates at all would otherwise vanish from a view built
      // out of decades, so they get a shelf of their own at the end.
      if (undated.length) {
        const shelf = el(`<div class="gw-shelf">
          <div class="gw-shelf-head">
            <div class="gw-decade gw-decade-undated">${api.t(TEXT.undated)}</div>
            <div class="gw-rule"></div>
            <div class="gw-count">${undated.length}</div>
          </div>
          <div class="gw-cards"></div>
        </div>`);
        const cards = shelf.querySelector('.gw-cards');
        undated.forEach(e => cards.appendChild(card(e)));
        shelvesEl.appendChild(shelf);
      }
    }

    draw();
    return view;
  };

  window.GENERATIONS_SHELF_GAP = SHELF_GAP;
})();
