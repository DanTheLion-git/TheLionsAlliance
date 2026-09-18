# TheLionsAlliance.com — bilingual editing rules

Loaded when working under `Website/`. The root `CLAUDE.md` carries the summary rule; this file carries the detail.

## Bilingual (EN / NL) — business pages must always be edited in BOTH languages

The four TLA business pages have Dutch mirrors at sibling `/nl/` paths:

| English page | Dutch mirror |
|---|---|
| `src/pages/index.astro` (`/`) | `src/pages/nl/index.astro` (`/nl/`) |
| `src/pages/puzzlequests/index.astro` | `src/pages/puzzlequests/nl/index.astro` |
| `src/pages/immersive/index.astro` | `src/pages/immersive/nl/index.astro` |
| `src/pages/contact/index.astro` | `src/pages/contact/nl/index.astro` |
| `src/pages/murder-mystery/index.astro` | `src/pages/murder-mystery/nl/index.astro` |
| `src/pages/touchscreens/index.astro` | `src/pages/touchscreens/nl/index.astro` |

**Rule: any edit to one of these ten pages must update the matching pair.** When adding a new section, paragraph, badge, FAQ item, nav link, footer link, or content tweak to an English page, write the equivalent in the Dutch mirror in the same commit. Same for the other direction.

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
