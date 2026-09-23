/* ============================================================
   Fuzzy search for Dutch surnames — offline, no dependencies.

   The requirement this exists to satisfy: typing "van de pol"
   must surface "Poll" and "van Pol" when there is no exact hit.
   Three things have to line up for that:

     1. Tussenvoegsels ("van", "de", "van der", and glued forms
        like "Vandepol") are split off the root, because in Dutch
        they are not part of the name for sorting or matching.
     2. The root is reduced to a phonetic key with Dutch spelling
        rules — doubled letters collapse, so pol == poll; ij == y;
        c == k or s by position; z == s; v == f.
     3. What survives neither is caught by edit distance, for
        plain typos and for 19th-century clerks who spelled the
        same family four ways in one register.

   Scoring is ordered so an exact match always wins and fuzzy hits
   are clearly ranked below it — a visitor searching their own
   name should never have it buried under approximations.
   ============================================================ */
(function () {
  // Dutch name particles. Order matters: longest first, so "van der"
  // is consumed before "van".
  const PARTICLES = [
    'van der', 'van den', 'van de', "van 't", 'van het',
    'op der', 'op den', 'op de', 'in der', 'in den', 'in de', "in 't",
    'aan de', 'aan den', 'onder de', 'over de', 'uit de', 'uit den', 'bij de',
    'van', 'de', 'den', 'der', 'des', 'het', "'t", 'ten', 'ter', 'te',
    'op', 'in', 'aan', 'tot', 'uit', 'over', 'voor', 'bij',
    'le', 'la', 'les', 'du', 'da', 'di', 'del', 'della', "d'", "l'",
  ];

  // Glued spellings that appear when a registrar ran the particle into the
  // name ("Vandepol"). Each maps to its canonical spaced form, so "Vandepol"
  // and "van de Pol" land in the *same* family rather than in two — which is
  // the whole point of searching by name in a parish register.
  // Longest first: "vander" must be consumed before "van".
  const GLUED = [
    ['vander', 'van der'], ['vanden', 'van den'], ['vande', 'van de'], ['vant', "van 't"],
    ['opden', 'op den'], ['opde', 'op de'], ['inden', 'in den'], ['inde', 'in de'],
    ['van', 'van'], ['den', 'den'], ['ter', 'ter'], ['ten', 'ten'], ['de', 'de'],
  ];

  function stripDiacritics(value) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /** Lowercase, de-accented, punctuation reduced to single spaces. */
  function normalize(value) {
    return stripDiacritics(String(value || '').toLowerCase())
      .replace(/[.,_/\\()\[\]]/g, ' ')
      .replace(/[’`´]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Split a surname into its particle and its root.
   * "van de Pol" -> { particle: "van de", root: "pol" }
   * "Vandepol"   -> { particle: "van de", root: "pol" }
   * "Poll"       -> { particle: "",       root: "poll" }
   *
   * Also handles the inverted register form "Pol, van de".
   */
  function splitSurname(surname) {
    // The inverted archive/card-index form "Pol, van de" has to be un-inverted
    // *before* normalize(), which strips punctuation including the comma.
    let raw = String(surname || '');
    const comma = raw.indexOf(',');
    if (comma > -1) {
      const head = raw.slice(0, comma).trim();
      const tail = raw.slice(comma + 1).trim();
      if (head) raw = tail ? `${tail} ${head}` : head;
    }

    let value = normalize(raw);
    if (!value) return { particle: '', root: '' };

    let particle = '';
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of PARTICLES) {
        if (value === p) break; // the particle *is* the whole name; leave it
        if (value.startsWith(p + ' ')) {
          particle = particle ? `${particle} ${p}` : p;
          value = value.slice(p.length + 1).trim();
          changed = true;
          break;
        }
      }
    }

    // Glued particle, e.g. "vandepol". Only strip if >=3 characters remain,
    // so "Vandenberg" splits but "Vande" doesn't vanish into nothing.
    if (!particle) {
      const single = value.replace(/\s/g, '');
      for (const [glued, canonical] of GLUED) {
        if (single.length - glued.length >= 3 && single.startsWith(glued)) {
          particle = canonical;
          value = single.slice(glued.length);
          break;
        }
      }
    }

    return { particle, root: value.replace(/\s+/g, ' ').trim() };
  }

  /**
   * Reduce a name root to a Dutch-tuned phonetic key. Deliberately lossy:
   * everything that Dutch spelling treats as interchangeable collapses
   * together, so historical spelling variants of one family meet.
   */
  function phoneticKey(root) {
    let s = normalize(root).replace(/[^a-z']/g, '');
    if (!s) return '';

    s = s
      .replace(/ij/g, 'y')          // Meijel / Meyel
      .replace(/ei/g, 'y')          // Heijnen / Heynen / Heinen
      .replace(/ui/g, 'u')
      .replace(/ou/g, 'au')         // Bouten / Bauten
      .replace(/sch/g, 'sg')        // Schmitz / Sgmitz — keeps sch distinct from s
      .replace(/ch/g, 'g')          // Aachen / Aagen
      .replace(/ck/g, 'k')          // Beckers / Bekers
      .replace(/qu/g, 'kw')
      .replace(/ph/g, 'f')
      .replace(/th/g, 't')
      .replace(/x/g, 'ks')
      .replace(/c(?=[eiy])/g, 's')  // Cecile
      .replace(/c/g, 'k')           // Corstjens / Korstjens
      .replace(/z/g, 's')           // final devoicing: Zeegers / Seegers
      .replace(/v/g, 'f')           // Verheijen / Ferheyen
      .replace(/dt$/g, 't')         // Smedt / Smet
      .replace(/d$/g, 't')          // Smid / Smit
      .replace(/[hj]/g, '');        // silent-ish in most positions

    s = s.replace(/(.)\1+/g, '$1'); // pol == poll == poll
    return s;
  }

  /** Damerau-Levenshtein, capped: beyond `max` the exact number is irrelevant. */
  function editDistance(a, b, max) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;

    let prev2 = null;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      const row = new Array(b.length + 1);
      row[0] = i;
      let best = row[0];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        // transposition — "Jansen"/"Jasnen"
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          v = Math.min(v, prev2[j - 2] + 1);
        }
        row[j] = v;
        if (v < best) best = v;
      }
      if (best > max) return max + 1; // whole row already too far
      prev2 = prev;
      prev = row;
    }
    return prev[b.length];
  }

  /** Tolerance grows with name length — one slip in "Pol" means more than in "Verstappen". */
  function toleranceFor(length) {
    if (length <= 4) return 1;
    if (length <= 7) return 2;
    return 3;
  }

  const SCORE = { exact: 1000, particleVariant: 900, prefix: 700, phonetic: 500, fuzzy: 300, contains: 200 };

  /**
   * Build a reusable index. `people` is an array of objects with at least
   * { id, surname }; anything else on them is passed through untouched.
   */
  window.buildNameIndex = function buildNameIndex(people) {
    const entries = [];
    const bySurname = new Map();

    people.forEach(person => {
      const { particle, root } = splitSurname(person.surname || '');
      if (!root) return;
      const key = phoneticKey(root);
      const display = (particle ? particle + ' ' : '') + root;

      let group = bySurname.get(display);
      if (!group) {
        group = { display, particle, root, key, people: [], variants: new Set() };
        bySurname.set(display, group);
        entries.push(group);
      }
      // Keep the spellings as actually written, so the UI can show
      // "ook gespeld als …" instead of silently rewriting someone's name.
      if (person.surname) group.variants.add(person.surname);
      group.people.push(person);
    });

    // Group people under the *phonetic* key too, so "related spellings"
    // can be offered as a family cluster rather than as scattered hits.
    const byKey = new Map();
    entries.forEach(group => {
      if (!byKey.has(group.key)) byKey.set(group.key, []);
      byKey.get(group.key).push(group);
    });

    return { entries, byKey, size: entries.length };
  };

  /**
   * Search the index. Returns ranked surname groups:
   *   { display, root, particle, people[], score, match: 'exact'|'prefix'|'phonetic'|'fuzzy'|'contains' }
   *
   * `match` is surfaced in the UI so a visitor can tell an exact hit from a
   * suggestion — never silently present an approximation as the answer.
   */
  window.searchNames = function searchNames(index, query, options) {
    const opts = options || {};
    const limit = opts.limit || 40;
    const parsed = splitSurname(query);
    if (!parsed.root) return [];

    let results = match(index, parsed.root, parsed.particle);

    // People type whole names into a search box — "Jan van de Pol", or a name
    // handed over from another app. If the full string matches nothing, walk
    // in from the left dropping given names until only the surname is left.
    if (!results.length && parsed.root.includes(' ')) {
      const tokens = parsed.root.split(' ');
      for (let i = 1; i < tokens.length && !results.length; i++) {
        const tail = splitSurname(tokens.slice(i).join(' '));
        if (tail.root) results = match(index, tail.root, tail.particle);
      }
    }

    results.sort((a, b) => b.score - a.score || a.display.localeCompare(b.display));
    return results.slice(0, limit);
  };

  function match(index, qRoot, qParticle) {
    const qKey = phoneticKey(qRoot);
    const tolerance = toleranceFor(qRoot.length);
    const results = [];

    index.entries.forEach(group => {
      let score = 0, kind = null;

      if (group.root === qRoot) {
        // Typing a bare root ("pol") is a wildcard over particles; typing a
        // full name ("van de pol") should rank that exact family above
        // "van Pol", which is a different family with the same root.
        if (!qParticle || group.particle === qParticle) {
          score = SCORE.exact; kind = 'exact';
        } else {
          score = SCORE.particleVariant; kind = 'variant';
        }
      } else if (group.key && group.key === qKey) {
        // Same sound, different spelling: "van de Pol" -> "Poll", "van Pol".
        score = SCORE.phonetic; kind = 'phonetic';
      } else if (group.root.startsWith(qRoot)) {
        score = SCORE.prefix - (group.root.length - qRoot.length); kind = 'prefix';
      } else {
        const distance = editDistance(qRoot, group.root, tolerance);
        if (distance <= tolerance) {
          score = SCORE.fuzzy - distance * 60; kind = 'fuzzy';
        } else if (qRoot.length >= 4 && group.root.includes(qRoot)) {
          score = SCORE.contains; kind = 'contains';
        }
      }

      if (!kind) return;
      // A bigger family is a more useful hit at equal relevance, but this
      // must never outrank a stronger match class.
      score += Math.min(Math.log2(1 + group.people.length) * 8, 60);
      results.push({ ...group, variants: [...group.variants], score, match: kind });
    });

    return results;
  }

  // Exposed for the test harness and for reuse elsewhere.
  window.nameSearchInternals = { splitSurname, phoneticKey, editDistance, normalize };
})();
