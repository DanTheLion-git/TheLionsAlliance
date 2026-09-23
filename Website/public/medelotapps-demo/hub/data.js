/* ============================================================
   Static UI chrome for the home screen.

   This file used to hold APPS (eight tiles, each with a
   four-language label and sub) and UI (per-language chrome
   strings), and before that a pile of invented stub content.

   Both are gone. The tiles are declared in hub/product.json and
   every word on screen lives in hub/strings/<lang>.json, both
   injected by the host at startup alongside the manifest — so a
   museum that wants different wording, a different language, or
   only two of them, edits JSON instead of needing a developer in
   seven view files.

   window.APPS is rebuilt here from product.json purely so the
   rest of the hub keeps the shape it already expects.
   ============================================================ */
(function () {
  const product = window.__PRODUCT__ || {};
  window.PRODUCT = product;

  /* ---------- Optional apps ----------
     An app may carry a `feature`, in which case it exists only where
     product.json's `features` block switches it on. That is the one difference
     between the touch table's configuration and the schoolbord's: one build,
     one content tree, one flag. The host applies the same rule to
     components.json, so a switched-off app's content folder is never scanned
     and never warns about being missing. */
  /* product.json holds the machine's normal answer; MEDELO_FEATURES (set by
     the schoolbord's .bat) switches extra ones on for this launch only. The
     host applies the identical merge to components.json before scanning, so
     the tiles and the content can never disagree about what is on. */
  const FEATURES = Object.assign({}, product.features || {});
  (window.__FEATURES__ || []).forEach(name => { FEATURES[name] = true; });
  const enabled = app => !app.feature || FEATURES[app.feature] === true;
  const APP_LIST = (product.apps || []).filter(enabled);

  /* The home grid is three by three \u2014 nine cells \u2014 and Tijdlijn is drawn
     double-width, so the eight standard apps already fill it exactly. A ninth
     tile would need a tenth cell and fall off the bottom of the screen (see the
     "//apps" note in product.json, where this cost a tile once before).
     Switching an optional app on therefore gives up the featured tile: nine
     equal tiles, still exactly nine cells, nothing clipped. */
  const overflowing = APP_LIST.length > 8;

  // Tiles, in the order product.json declares them. Labels are looked up by
  // key at render time rather than baked in here, so switching language does
  // not mean rebuilding this list.
  window.APPS = APP_LIST.map(app => ({
    id: app.id,
    component: app.component || app.id,
    icon: app.icon,
    featured: !!app.featured && !overflowing,
    entry: app.entry,
  }));

  /* ---------- Interface copy ----------
     Two different jobs, deliberately two different functions:

       window.ui(key)   interface copy, from hub/strings/<lang>.json
       window.t(value)  authored CONTENT, from the manifest (see collection.js)

     Everything used to go through the second, and every piece of interface
     copy was written inline in the view that showed it as a four-language
     object literal — about 137 of them. */

  const STRINGS = window.__STRINGS__ || {};
  const LANGUAGES = product.languages || ['nl'];
  const FALLBACK = product.defaultLanguage || LANGUAGES[0];

  window.LANGUAGES = LANGUAGES;
  window.FALLBACK_LANG = FALLBACK;

  /**
   * Interface copy by key, e.g. ui('home.lede').
   *
   * A missing key returns the key itself rather than an empty string: a screen
   * reading "home.lede" is an obvious, findable authoring bug, whereas a blank
   * button looks like a rendering failure and gets misdiagnosed for an hour.
   *
   * `replacements` fills {name} placeholders — the photo archive's lede counts
   * real albums and photographs rather than freezing a number into a sentence.
   */
  window.ui = function ui(key, replacements) {
    const lang = window.getLang ? window.getLang() : FALLBACK;
    const table = STRINGS[lang] || {};
    const base = STRINGS[FALLBACK] || {};
    let text = table[key] != null ? table[key] : (base[key] != null ? base[key] : key);

    if (replacements) {
      Object.keys(replacements).forEach(name => {
        text = text.split('{' + name + '}').join(String(replacements[name]));
      });
    }
    return text;
  };

  if (!Object.keys(STRINGS).length) {
    console.error('[strings] no language tables were injected — every label will show its key');
  }
})();
