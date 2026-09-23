# TheLionsAlliance.com — bilingual editing rules

Loaded when working under `Website/`. The root `CLAUDE.md` carries the summary rule; this file carries the detail.

## Bilingual (EN / NL) — business pages must always be edited in BOTH languages

The TLA business pages below have Dutch mirrors at sibling `/nl/` paths:

| English page | Dutch mirror |
|---|---|
| `src/pages/index.astro` (`/`) | `src/pages/nl/index.astro` (`/nl/`) |
| `src/pages/puzzlequests/index.astro` | `src/pages/puzzlequests/nl/index.astro` |
| `src/pages/immersive/index.astro` | `src/pages/immersive/nl/index.astro` |
| `src/pages/jan-truijen/index.astro` | `src/pages/jan-truijen/nl/index.astro` |
| `src/pages/contact/index.astro` | `src/pages/contact/nl/index.astro` |
| `src/pages/touchscreens/index.astro` | `src/pages/touchscreens/nl/index.astro` |

**Rule: any edit to one of these pages must update the matching pair.** When adding a new section, paragraph, badge, FAQ item, nav link, footer link, or content tweak to an English page, write the equivalent in the Dutch mirror in the same commit. Same for the other direction.

`src/pages/murder-mystery/` (+ `nl/`) is retired: moved to `src/pages/_archive/murder-mystery/` (Astro excludes any `_`-prefixed path segment under `src/pages/` from routing), kept as a backup, not linked from the live site.

Dutch translation register:
- Formal **`u`** for B2B / heritage partner-facing copy. Never use `je` or `jij` on these business pages.
- Studio voice stays first-person plural: `wij` / `we` / `ons`.
- **Don't translate word-for-word.** Write idiomatic Dutch with proper grammar and natural phrasing. *"Get in touch"* → *"Neem contact op"* (not *"Krijg in aanraking"*). *"How it works"* in a heading → *"Hoe het werkt"* or rephrased section heading; etc.
- **Keep brand names in English** as proper nouns: `The Lions Alliance`, `Puzzle Quests`, `Skeleton Key`, `Living Chronicle`, `Puzzle Lantern`, `WeddingCamBox`, `ShutterShare`, `Immersive Worlds`, `Magic Crystal`, `Moments` / `Experiences` (when used as pillar names).
- **Dutch story titles stay in Dutch** in both versions (`De Vlucht door de Peel`, `Het Pad van Dikke Mie`, `De Schat van het Dolle Moer`).
- **Contact form values are English** even on the Dutch page (`option value="..."` strings match across languages so backend email subjects stay consistent — only the user-visible option labels are translated).

Language toggle:
- `.tla-nav__lang` pill styled globally in `homepage.css`. Sits inside `.tla-nav__actions` between the language code and the Contact / Studio CTAs.
- Mobile menu uses full-text equivalents: *"Bekijk in het Nederlands"* on EN pages, *"View in English"* on NL pages.
- Every page pair has reciprocal `<link rel="alternate" hreflang="en|nl|x-default" href="…" />` tags in `<head>`.

Pages **not** mirrored to Dutch (keep these English-only): `resume/`, `games/`, `planner/`, `blog/`. These are personal/portfolio surfaces with a different audience.

## The Medelotapps demo — `public/medelotapps-demo/`

`/touchscreens/` embeds a playable demo of Medelotapps, click-to-load. It is **generated output, not source** — do not hand-edit anything under `public/medelotapps-demo/`.

- **`hub/`** is a copy of the real product code from `Medelo/Medelotapps/Medelo-expansion/TouchTableHub/hub`, minus `apps/` and `vendor/`. Deliberate divergences, each commented in place:
  - a YouTube path in `views/storyplayer.js` + the new `views/youtube.js`;
  - BC-year formatting in `collection.js` / `views/generations.js` — a genuine product fix worth porting back;
  - Foto-archief as albums thrown onto the free-move table (new `views/photoalbums.js`, one-line hook at the top of `buildPhotos` in `hub.js`) instead of the product's card grid — also a candidate to port back.
- **Demo-only sizing in `demo.css`**, not in hub: timeline plates at half the product's height, corner home buttons at 75%. The home grid is *not* overridden — tiles are the product's size in its 3×3 grid.
- **Mouse drag-to-scroll on the Tijdlijn rail** lives in the `index.html` shell (the table is swiped by touch; a mouse can't). A drag never also opens the era it started on.
- **`index.html`** is the browser bootstrap. On the table a WPF host injects `__MANIFEST__`, `__PRODUCT__`, `__STRINGS__` and `__FEATURES__` before any page script; there is no host on the web, so this fetches the same four things and injects them the same way.
- **`shell/`** plus the two corner buttons in `index.html` stand in for the host's `HomeButtonWindow`s (top-right and bottom-left, same 70×71 assets). `index.html` also provides a minimal `window.chrome.webview` so hub.js's existing `immersive` message hides them exactly as the host would — hub.js itself is untouched.
- **`content/` and `demo/`** are written by `tools/demo/build_demo.py` (people, timeline, map places, stories) and `tools/demo/harvest_amsterdam.py` (map tiles). Re-run those rather than editing the output.

**Nothing of Museum Medelo's is in it** — that is the point of the demo having its own content, and it should stay true. The three films are National Geographic's and are embedded through YouTube's player; never download them and never serve them from our own origin.

`astro.config.mjs` excludes the folder from the dev watcher — 385 generated files exhausted the file-handle limit (`EMFILE`).
