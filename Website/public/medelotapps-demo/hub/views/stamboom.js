/* ============================================================
   Stamboom — the whole village as one map you move around in.

   It used to open on an empty search field: a visitor had to
   already know a name before the app showed them anything, and a
   table that shows nothing until you type is a table people walk
   past. It opens on the tree itself now — every person, every
   marriage, every line of descent, laid out at once and panned and
   pinched like a map. The search is still there, docked over the
   map, because finding your own surname is the point of the app;
   it now flies you to a place on something already on screen
   rather than being the price of admission.

   Reading the drawing:
     - a box is a person, tinted by sex
     - a short horizontal bar joins two people: a marriage
     - lines drop from the middle of that bar to their children
     - tapping anyone lights their whole line, ancestors and
       descendants both, and dims the rest of the village

   People presumed living were already stripped in C# (see
   GenealogyBuilder); they arrive as anonymous nodes so a lineage
   still reads continuously. Nothing here can un-hide them, which
   is the point.

   The dataset is fetched on first open rather than injected at
   startup — a real parish tree runs to tens of thousands of people
   and would stall every launch.
   ============================================================ */
(function () {
  // Interface copy for this view lives in hub/strings/<lang>.json under the
  // "stamboom." prefix, including the nested match reasons as "stamboom.match.*".
  // Looked up lazily rather than resolved once, because the visitor can switch
  // language between renders. TEXT.<name> still yields a string, so the call
  // sites — including the ones wrapping it in api.t() — are unchanged.
  const TEXT = new Proxy({}, {
    get: (_, name) => (name === 'match'
      ? new Proxy({}, { get: (__, kind) => window.ui('stamboom.match.' + String(kind)) })
      : window.ui('stamboom.' + String(name))),
  });

  // Layout metrics, in design pixels. NODE_W/NODE_H must match .sm-node in
  // hub.css — the layout never measures the DOM, because it runs before the
  // view is in the document (HANDOFF gotcha 2).
  const NODE_W = 190, NODE_H = 56;
  const SLOT_X = 212;        // pitch between two people side by side
  const GEN_Y = 188;         // pitch between one generation and the next
  const CLUSTER_GAP = 300;   // air between two unrelated families
  // A few thousand people over six generations is a genuinely wide drawing —
  // the demo file is ~9:1 — so "the whole tree" is a constellation, not
  // something readable. MIN_SCALE has to be low enough that it actually all
  // fits, or the fit button lies; reading happens by pinching in or searching.
  const MIN_SCALE = 0.02, MAX_SCALE = 1.9;

  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }
  const SVGNS = 'http://www.w3.org/2000/svg';

  // The dataset is shared across app re-renders (language switch, resize) so
  // it's fetched once per session, not once per visit to the app. The layout
  // is cached with it: it takes a beat for a few thousand people and does not
  // depend on language.
  let cache = null;

  async function loadDataset(info) {
    if (cache && cache.url === info.dataUrl) return cache;
    const response = await fetch(info.dataUrl);
    if (!response.ok) throw new Error('http ' + response.status);
    const raw = await response.json();

    const people = raw.people.map((r, i) => ({
      idx: i,
      given: r[0] || '', surname: r[1] || '',
      sex: r[2], born: r[3], died: r[4],
      birthPlace: r[5], deathPlace: r[6],
      father: r[7], mother: r[8],
      children: r[9] || [], spouses: r[10] || [],
      hidden: r[11] === 1,
    }));

    // Only people we're allowed to name are searchable.
    const index = window.buildNameIndex(people.filter(p => !p.hidden && p.surname));
    cache = { url: info.dataUrl, people, index, layout: layoutPopulation(people) };
    return cache;
  }

  // ---------- Person helpers ----------
  function displayName(person, api) {
    if (person.hidden) return `<em>${api.t(TEXT.privatePerson)}</em>`;
    return `${person.given} ${person.surname}`.trim() || '—';
  }
  function plainName(person, api) {
    if (person.hidden) return api.t(TEXT.privatePerson);
    return `${person.given} ${person.surname}`.trim() || '—';
  }
  function lifeLine(person, api) {
    if (person.hidden) return '';
    if (person.born && person.died) return `${person.born}–${person.died}`;
    if (person.born) return `${api.t(TEXT.born)} ${person.born}`;
    if (person.died) return `${api.t(TEXT.died)} ${person.died}`;
    return '';
  }

  // ============================================================ Layout
  //
  // One pass over the whole population rather than a tree per visitor. Three
  // steps: put everyone in a generation, hang each family off its children,
  // then guarantee nothing in a generation overlaps anything else.

  /**
   * Generation number per person: 0 for anyone whose parents aren't in the
   * file, otherwise one below the lower of their parents. Spouses are pulled
   * onto a shared generation so a marriage bar stays horizontal. Iterated to a
   * fixed point rather than sorted topologically, because these files are
   * decades old and hand-edited and a cycle must not hang the table — the pass
   * cap is the safety net.
   */
  function computeGenerations(people) {
    const n = people.length;
    const gen = new Int32Array(n);
    for (let pass = 0; pass < 40; pass++) {
      let changed = false;
      for (let i = 0; i < n; i++) {
        const p = people[i];
        let g = 0;
        if (p.father >= 0) g = Math.max(g, gen[p.father] + 1);
        if (p.mother >= 0) g = Math.max(g, gen[p.mother] + 1);
        if (g !== gen[i]) { gen[i] = g; changed = true; }
      }
      for (let i = 0; i < n; i++) {
        for (const s of people[i].spouses) {
          if (s < 0 || s >= n) continue;
          const g = Math.max(gen[i], gen[s]);
          if (gen[i] !== g) { gen[i] = g; changed = true; }
          if (gen[s] !== g) { gen[s] = g; changed = true; }
        }
      }
      if (!changed) break;
    }
    return gen;
  }

  /**
   * Marriages, as {a, b, children}. A child with both parents known belongs to
   * the union of the two; a child with one known parent gets a solo union, so
   * single-parent lines still draw rather than floating unattached.
   */
  function buildUnions(people) {
    const byKey = new Map();
    const byPerson = new Map();

    function union(a, b) {
      const lo = b < 0 ? a : Math.min(a, b);
      const hi = b < 0 ? -1 : Math.max(a, b);
      const key = lo + '|' + hi;
      let u = byKey.get(key);
      if (!u) {
        u = { a: lo, b: hi, children: [] };
        byKey.set(key, u);
        [lo, hi].forEach(p => {
          if (p < 0) return;
          if (!byPerson.has(p)) byPerson.set(p, []);
          byPerson.get(p).push(u);
        });
      }
      return u;
    }

    people.forEach(p => p.spouses.forEach(s => { if (s >= 0) union(p.idx, s); }));
    people.forEach(p => {
      if (p.father < 0 && p.mother < 0) return;
      union(p.father >= 0 ? p.father : p.mother, p.father >= 0 ? p.mother : -1).children.push(p.idx);
    });

    return { byKey, byPerson };
  }

  function layoutPopulation(people) {
    const n = people.length;
    const gen = computeGenerations(people);
    const unions = buildUnions(people);
    const x = new Float64Array(n).fill(NaN);
    const y = new Float64Array(n).fill(NaN);
    const seen = new Uint8Array(n);
    let cursor = 0;

    /**
     * Place one person, their partners beside them and their descendants
     * beneath. Children go down first so the couple can be centred over them;
     * a leaf couple simply takes the next free slots. Depth is bounded by the
     * number of generations (a dozen or so), so recursion is safe here.
     */
    let currentBlock = null;
    function placeBlock(idx) {
      seen[idx] = 1;
      if (currentBlock) currentBlock.push(idx);
      const mine = unions.byPerson.get(idx) || [];

      // Claim partners up front, so a descendant's own recursion can't place
      // one of them somewhere else on the map first.
      const partners = [];
      mine.forEach(u => {
        const other = u.a === idx ? u.b : u.a;
        if (other >= 0 && !seen[other]) {
          seen[other] = 1;
          if (currentBlock) currentBlock.push(other);
          partners.push(other);
        }
      });
      const members = [idx, ...partners];
      const blockWidth = (members.length - 1) * SLOT_X;

      const kids = [];
      mine.forEach(u => u.children.forEach(c => { if (!seen[c]) { seen[c] = 1; kids.push(c); } }));

      if (!kids.length) {
        members.forEach((m, i) => { x[m] = cursor + i * SLOT_X; });
        cursor += blockWidth + SLOT_X;
        return;
      }

      const kidXs = [];
      kids.forEach(c => { placeBlock(c); if (Number.isFinite(x[c])) kidXs.push(x[c]); });

      const centre = kidXs.length ? (Math.min(...kidXs) + Math.max(...kidXs)) / 2 : cursor;
      const startX = centre - blockWidth / 2;
      members.forEach((m, i) => { x[m] = startX + i * SLOT_X; });
      cursor = Math.max(cursor, startX + blockWidth + SLOT_X);
    }

    // One block per founding family: a person with no parents in the file, plus
    // everyone who hangs off them. Blocks are the unit the grid packs, so they
    // have to be small enough to balance across rows — a whole connected
    // component is not (this file is only eight of those, one of them a
    // hundred thousand pixels wide, which no packing can distribute).
    const blocks = [];
    function layOutBlock(seedIdx) {
      cursor = 0;
      currentBlock = [];
      placeBlock(seedIdx);
      const list = currentBlock;
      currentBlock = null;

      // Centring a couple over its children can slide it into a neighbour that
      // was already placed. Rather than a full contour algorithm, sweep each
      // generation left to right and push anything that overlaps out of the
      // way: a few nodes end up slightly off-centre over their children, which
      // reads fine, whereas two boxes on top of each other does not.
      const byGen = new Map();
      list.forEach(i => {
        if (!Number.isFinite(x[i])) return;
        if (!byGen.has(gen[i])) byGen.set(gen[i], []);
        byGen.get(gen[i]).push(i);
      });
      byGen.forEach(rowList => {
        rowList.sort((a, b) => x[a] - x[b]);
        for (let i = 1; i < rowList.length; i++) {
          const floor = x[rowList[i - 1]] + SLOT_X;
          if (x[rowList[i]] < floor) x[rowList[i]] = floor;
        }
      });

      let minX = Infinity, maxX = -Infinity, minGen = Infinity, maxGen = -Infinity;
      list.forEach(i => {
        if (!Number.isFinite(x[i])) return;
        minX = Math.min(minX, x[i]); maxX = Math.max(maxX, x[i]);
        minGen = Math.min(minGen, gen[i]); maxGen = Math.max(maxGen, gen[i]);
      });
      if (!Number.isFinite(minX)) return;
      list.forEach(i => { if (Number.isFinite(x[i])) x[i] -= minX; });

      blocks.push({
        list, minGen,
        width: (maxX - minX) + NODE_W,
        depth: (maxGen - minGen),          // in generations
      });
    }

    // Oldest founders first, so a family reads downward from its head;
    // anything left over (a cycle, or parents pointing outside the file) is
    // seeded afterwards so nobody is dropped.
    Array.from({ length: n }, (_, i) => i)
      .filter(i => people[i].father < 0 && people[i].mother < 0)
      .sort((a, b) => gen[a] - gen[b])
      .forEach(i => { if (!seen[i]) layOutBlock(i); });
    for (let i = 0; i < n; i++) if (!seen[i]) layOutBlock(i);

    // ---- Pack the families into a grid ----
    // Laid end to end in one row, 1,254 families come to nearly half a million
    // pixels of a 1,200px-tall ribbon: at any zoom that fits the width, the
    // whole village is a hairline. So wrap them into rows and aim the result at
    // roughly the proportions of the table, which is what makes "zoom out to
    // see everything" a view worth having rather than a smear.
    const ASPECT = 2.0;
    blocks.sort((a, b) => (b.depth - a.depth) || (b.width - a.width));

    const totalWidth = blocks.reduce((sum, b) => sum + b.width + CLUSTER_GAP, 0);
    const tallestPx = Math.max(...blocks.map(b => b.depth)) * GEN_Y + NODE_H + GEN_Y;
    const rowCount = Math.max(1, Math.round(Math.sqrt(totalWidth / (ASPECT * tallestPx))));
    // Deliberately NOT raised to the widest block. A family wider than the
    // target simply gets a row to itself, which is what happens with a file
    // like the demo one — eight families of six generations each, the largest a
    // hundred thousand pixels across — and it reads far better that way: one
    // horizontal band is one family. Give the target a floor of the widest
    // block instead and those eight would be crammed side by side into five
    // rows for no gain. With many small families the same line packs them
    // several to a row, which is what that case wants.
    const targetRowWidth = Math.max(NODE_W, totalWidth / rowCount);

    let rowX = 0, rowTop = 0, rowDepth = 0, canvasWidth = 0;
    blocks.forEach(block => {
      if (rowX > 0 && rowX + block.width > targetRowWidth) {
        rowTop += rowDepth * GEN_Y + NODE_H + GEN_Y;
        rowX = 0; rowDepth = 0;
      }
      block.list.forEach(i => {
        if (!Number.isFinite(x[i])) return;
        x[i] += rowX;
        y[i] = rowTop + (gen[i] - block.minGen) * GEN_Y;
      });
      rowX += block.width + CLUSTER_GAP;
      rowDepth = Math.max(rowDepth, block.depth);
      canvasWidth = Math.max(canvasWidth, rowX);
    });

    return {
      x, y, gen, unions,
      width: canvasWidth,
      height: rowTop + rowDepth * GEN_Y + NODE_H,
    };
  }

  /** One path string for the marriage bars, one for the lines of descent. */
  function buildEdgePaths(people, layout) {
    const { x, y } = layout;
    const marriages = [];
    const descent = [];

    layout.unions.byKey.forEach(u => {
      const { a, b, children } = u;
      const hasA = a >= 0 && Number.isFinite(x[a]);
      const hasB = b >= 0 && Number.isFinite(x[b]);
      if (!hasA && !hasB) return;

      let anchorX, anchorY;
      if (hasA && hasB) {
        const left = x[a] <= x[b] ? a : b;
        const right = left === a ? b : a;
        const barY = y[left] + NODE_H / 2;
        marriages.push(`M${(x[left] + NODE_W).toFixed(1)} ${barY.toFixed(1)}H${x[right].toFixed(1)}`);
        anchorX = (x[left] + NODE_W + x[right]) / 2;
        anchorY = y[left] + NODE_H;
      } else {
        const only = hasA ? a : b;
        anchorX = x[only] + NODE_W / 2;
        anchorY = y[only] + NODE_H;
      }

      children.forEach(c => {
        if (!Number.isFinite(x[c])) return;
        const childTop = y[c];
        const bus = anchorY + (childTop - anchorY) / 2;
        descent.push(
          `M${anchorX.toFixed(1)} ${anchorY.toFixed(1)}V${bus.toFixed(1)}H${(x[c] + NODE_W / 2).toFixed(1)}V${childTop.toFixed(1)}`,
        );
      });
    });

    return { marriages: marriages.join(''), descent: descent.join('') };
  }

  /** Everyone on this person's line: every ancestor, every descendant, partners. */
  function lineageOf(people, startIdx) {
    const lit = new Set([startIdx]);
    const up = [startIdx];
    while (up.length) {
      const p = people[up.pop()];
      [p.father, p.mother].forEach(q => { if (q >= 0 && !lit.has(q)) { lit.add(q); up.push(q); } });
    }
    const down = [startIdx];
    while (down.length) {
      const p = people[down.pop()];
      p.children.forEach(c => { if (c >= 0 && !lit.has(c)) { lit.add(c); down.push(c); } });
    }
    // Partners of anyone lit, so a marriage bar is never half-lit.
    [...lit].forEach(i => people[i].spouses.forEach(s => { if (s >= 0) lit.add(s); }));
    return lit;
  }

  // ============================================================ View
  window.buildStamboom = function buildStamboom(api, info) {
    const view = el(`<div class="st-view"></div>`);

    if (info && info.demo) {
      // Fabricated data must never be able to pass as the museum's records.
      view.appendChild(el(`<div class="st-demo-banner">${api.t(TEXT.demo)}</div>`));
    }

    const body = el(`<div class="st-body"></div>`);
    view.appendChild(body);

    if (!info || !info.dataUrl) {
      body.appendChild(el(`<div class="st-empty">
        <div class="st-empty-title">${api.t(TEXT.noData)}</div>
        <div class="st-empty-sub">${api.t(TEXT.noDataSub)}</div>
      </div>`));
      return view;
    }

    body.appendChild(el(`<div class="st-empty"><div class="st-empty-sub">${api.t(TEXT.loading)}</div></div>`));

    loadDataset(info).then(dataset => {
      body.innerHTML = '';
      body.appendChild(buildMap(dataset, api, info));
    }).catch(() => {
      body.innerHTML = '';
      body.appendChild(el(`<div class="st-empty"><div class="st-empty-title">${api.t(TEXT.noData)}</div></div>`));
    });

    return view;
  };

  function buildMap(dataset, api, info) {
    const people = dataset.people;
    const layout = dataset.layout;
    const { x, y, gen } = layout;

    const wrap = el(`<div class="sm-wrap js-dispose">
      <div class="sm-stage">
        <div class="sm-canvas"></div>
      </div>

      <div class="sm-search">
        <div class="sm-search-field">
          ${iconSvg('search')}
          <input type="text" placeholder="${api.t(TEXT.placeholder)}" />
        </div>
        <div class="sm-results"></div>
      </div>

      <div class="sm-tools">
        <button class="sm-tool sm-fit">${iconSvg('tree')}<span>${api.t(TEXT.whole)}</span></button>
        <div class="sm-count">${window.ui('stamboom.stats', { n: (info.visibleCount || 0).toLocaleString(api.lang) })}${
          info.suppressedCount ? ` · ${api.t(TEXT.privateNote)}` : ''}</div>
      </div>

      <div class="sm-hint">${api.t(TEXT.hint)}</div>
      <div class="sm-panel"></div>
    </div>`);

    const stage = wrap.querySelector('.sm-stage');
    const canvas = wrap.querySelector('.sm-canvas');
    const panel = wrap.querySelector('.sm-panel');
    const results = wrap.querySelector('.sm-results');
    const input = wrap.querySelector('.sm-search input');

    canvas.style.width = layout.width + 'px';
    canvas.style.height = layout.height + 'px';

    // ---- Edges: two paths for the whole village, not two per family ----
    const edges = buildEdgePaths(people, layout);
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'sm-edges');
    svg.setAttribute('width', layout.width);
    svg.setAttribute('height', layout.height);
    svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
    ['descent', 'marriage'].forEach(kind => {
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('class', 'sm-edge sm-edge-' + kind);
      path.setAttribute('d', kind === 'descent' ? edges.descent : edges.marriages);
      svg.appendChild(path);
    });
    canvas.appendChild(svg);

    // ---- Nodes ----
    // One element per person, no children: the years ride along in a data
    // attribute and are drawn by CSS, which both halves the element count on a
    // few thousand people and makes hiding them when zoomed out a class swap.
    const nodeEls = new Array(people.length).fill(null);
    const frag = document.createDocumentFragment();
    people.forEach(person => {
      if (!Number.isFinite(x[person.idx])) return;
      const node = document.createElement('button');
      node.className = 'sm-node'
        + (person.hidden ? ' is-private' : '')
        + (person.sex === 'F' ? ' is-f' : person.sex === 'M' ? ' is-m' : '');
      node.style.left = x[person.idx] + 'px';
      node.style.top = y[person.idx] + 'px';
      node.dataset.i = person.idx;
      node.dataset.years = lifeLine(person, api);
      node.textContent = plainName(person, api);
      nodeEls[person.idx] = node;
      frag.appendChild(node);
    });
    canvas.appendChild(frag);

    // One listener for the whole population.
    canvas.addEventListener('click', e => {
      if (dragged) return;
      const node = e.target.closest('.sm-node');
      if (node) select(Number(node.dataset.i), false);
    });

    // ---- Selection ----
    let litEls = [];
    let selectedEl = null;

    function clearSelection() {
      litEls.forEach(n => n.classList.remove('is-lit'));
      litEls = [];
      if (selectedEl) selectedEl.classList.remove('is-selected');
      selectedEl = null;
      canvas.classList.remove('has-selection');
      panel.innerHTML = '';
    }

    function select(idx, recentre) {
      clearSelection();
      const lineage = lineageOf(people, idx);
      lineage.forEach(i => {
        const node = nodeEls[i];
        if (node) { node.classList.add('is-lit'); litEls.push(node); }
      });
      selectedEl = nodeEls[idx];
      if (selectedEl) selectedEl.classList.add('is-selected');
      canvas.classList.add('has-selection');
      showPanel(people[idx], lineage.size);
      if (recentre) centreOn(idx);
    }

    function showPanel(person, lineageSize) {
      const relation = (label, list) => {
        if (!list.length) return '';
        return `<div class="st-rel"><div class="st-rel-label">${label}</div>${
          list.map(p => `<button class="st-rel-name" data-i="${p.idx}">${displayName(p, api)} <span>${lifeLine(p, api)}</span></button>`).join('')
        }</div>`;
      };

      const parents = [person.father, person.mother].filter(i => i >= 0).map(i => people[i]);
      const spouses = person.spouses.filter(i => i >= 0).map(i => people[i]);
      const children = person.children.filter(i => i >= 0).map(i => people[i]);

      const card = el(`<div class="st-panel-card">
        <button class="sm-panel-close" aria-label="${api.t(TEXT.clear)}">${iconSvg('close')}</button>
        <div class="st-panel-name">${displayName(person, api)}</div>
        <div class="st-panel-years">${lifeLine(person, api)}</div>
        <div class="sm-panel-gen">${api.t(TEXT.generation)} ${gen[person.idx] + 1} · ${lineageSize} ${api.t(TEXT.people)}</div>
        ${person.hidden ? `<div class="st-panel-private">${api.t(TEXT.privateNote)}</div>` : `
          ${person.birthPlace ? `<div class="st-panel-place">${api.t(TEXT.born)} ${person.birthPlace}</div>` : ''}
          ${person.deathPlace ? `<div class="st-panel-place">${api.t(TEXT.died)} ${person.deathPlace}</div>` : ''}
        `}
        ${relation(api.t(TEXT.parents), parents)}
        ${relation(api.t(TEXT.spouses), spouses)}
        ${relation(api.t(TEXT.childrenOf), children)}
      </div>`);

      card.querySelector('.sm-panel-close').addEventListener('click', clearSelection);
      card.querySelectorAll('.st-rel-name').forEach(btn => {
        btn.addEventListener('click', () => select(Number(btn.dataset.i), true));
      });
      panel.innerHTML = '';
      panel.appendChild(card);
    }

    // ---- Search, docked over the map ----
    window.attachKeyboard(input);

    function drawResults() {
      const query = input.value.trim();
      results.innerHTML = '';
      wrap.classList.toggle('is-searching', query.length >= 2);
      if (query.length < 2) return;

      const hits = window.searchNames(dataset.index, query, { limit: 12 });
      if (!hits.length) {
        results.appendChild(el(`<div class="sm-noresult">
          <div class="sm-noresult-title">${api.t(TEXT.noResults)}</div>
          <div class="sm-noresult-sub">${api.t(TEXT.noResultsSub)}</div>
        </div>`));
        return;
      }

      hits.forEach(hit => {
        // The match quality is always shown. A visitor must be able to tell
        // "this is your family" from "this might be related".
        const label = window.ui('stamboom.match.' + (hit.match || 'fuzzy'));
        const group = el(`<div class="sm-result">
          <button class="sm-result-head">
            <span class="sm-result-name">${hit.display}</span>
            <span class="st-match st-match-${hit.match}">${label}</span>
            <span class="sm-result-count">${hit.people.length} ${api.t(TEXT.people)}</span>
          </button>
          <div class="sm-result-people"></div>
        </div>`);

        const list = group.querySelector('.sm-result-people');
        const members = hit.people.slice()
          // Most recent first: the app is for tracing *back*, so a visitor
          // starts at the end of the line nearest them.
          .sort((a, b) => (b.born || 0) - (a.born || 0))
          .slice(0, 8);
        members.forEach(person => {
          const row = el(`<button class="sm-result-person">
            <span>${displayName(person, api)}</span>
            <span class="sm-result-years">${lifeLine(person, api)}</span>
          </button>`);
          row.addEventListener('click', () => {
            select(person.idx, true);
            input.value = '';
            drawResults();
          });
          list.appendChild(row);
        });

        group.querySelector('.sm-result-head').addEventListener('click', () => {
          if (members[0]) { select(members[0].idx, true); input.value = ''; drawResults(); }
        });
        results.appendChild(group);
      });
    }

    input.addEventListener('input', drawResults);

    // ---- Pan, pinch and framing ----
    let panX = 0, panY = 0, scale = 1;
    const pointers = new Map();
    let startPan = null, startDist = 0, startScale = 1, dragged = false;

    function applyView() {
      canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      // Level of detail. Below a certain zoom the text is a grey smear that
      // costs layout for nothing, so drop the years first and then the names,
      // leaving the shape of the village — which is what you are reading at
      // that distance anyway.
      canvas.classList.toggle('lod-mid', scale < 0.5);
      canvas.classList.toggle('lod-far', scale < 0.22);
    }

    /** Design-pixel size of the stage; it is inside the scaled #stage, so its
     *  layout size (not its rendered rect) is the space this view thinks in.
     *  The fallbacks are .st-view's padding subtracted from the design canvas,
     *  for the window between building this view and it being in the document. */
    function stageBox() {
      const design = window.stageSize();
      return {
        w: stage.offsetWidth || (design.width - 240),
        h: stage.offsetHeight || (design.height - 280),
      };
    }

    function fitAll() {
      const box = stageBox();
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
        Math.min(box.w / (layout.width + 200), box.h / (layout.height + 200))));
      panX = (box.w - layout.width * scale) / 2;
      panY = (box.h - layout.height * scale) / 2;
      applyView();
    }

    function centreOn(idx) {
      if (!Number.isFinite(x[idx])) return;
      const box = stageBox();
      scale = Math.max(scale, 0.75);
      panX = box.w / 2 - (x[idx] + NODE_W / 2) * scale;
      panY = box.h / 2 - (y[idx] + NODE_H / 2) * scale;
      canvas.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
      applyView();
      window.setTimeout(() => { canvas.style.transition = ''; }, 460);
    }

    wrap.querySelector('.sm-fit').addEventListener('click', () => { clearSelection(); fitAll(); });

    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('.sm-node')) {
        // Let a tap on a person still pan the map if the finger travels; the
        // click listener above bails when `dragged` is set.
        dragged = false;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stage.setPointerCapture(e.pointerId);
      dragged = false;
      canvas.style.transition = '';
      if (pointers.size === 1) {
        startPan = { x: e.clientX, y: e.clientY, panX, panY };
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        startDist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        startScale = scale;
        startPan = null;
      }
    });

    stage.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * (dist / startDist)));
        // Zoom about the midpoint between the fingers, so the map grows out of
        // what is being held rather than out of its top-left corner.
        const rect = stage.getBoundingClientRect();
        const ancestor = stage.offsetWidth ? rect.width / stage.offsetWidth : 1;
        const mx = ((a.x + b.x) / 2 - rect.left) / ancestor;
        const my = ((a.y + b.y) / 2 - rect.top) / ancestor;
        panX = mx - (mx - panX) * (next / scale);
        panY = my - (my - panY) * (next / scale);
        scale = next;
        dragged = true;
        applyView();
        return;
      }

      if (startPan) {
        // Pointer deltas are real screen pixels; #stage is scaled, so divide by
        // that ancestor scale or the map lags the finger.
        const rect = stage.getBoundingClientRect();
        const ancestor = stage.offsetWidth ? rect.width / stage.offsetWidth : 1;
        const dx = (e.clientX - startPan.x) / ancestor;
        const dy = (e.clientY - startPan.y) / ancestor;
        if (Math.abs(dx) + Math.abs(dy) > 6) dragged = true;
        panX = startPan.panX + dx;
        panY = startPan.panY + dy;
        applyView();
      }
    });

    const release = e => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) startPan = null;
      if (pointers.size === 1) {
        const [only] = [...pointers.entries()];
        startPan = { x: only[1].x, y: only[1].y, panX, panY };
      }
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);

    // Frame the whole village on open. Deferred a frame because this view is
    // still detached when buildMap returns, and fitting needs the stage's real
    // box — measuring it now would frame against a fallback guess.
    requestAnimationFrame(fitAll);

    // Then honour a deep link from Personen ("zoek deze naam in de stamboom")
    // by running its search for the visitor.
    const pending = window.consumePendingStamboomQuery();
    if (pending) {
      input.value = pending;
      drawResults();
    }

    return wrap;
  }
})();
