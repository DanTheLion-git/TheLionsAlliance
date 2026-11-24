---
name: The Lions Alliance: exhibition hall
scope: business pages (home, touchscreens, jan-truijen, puzzlequests, immersive, contact, + /nl/)
source: src/styles/hall.css
---

# Design: the exhibition hall

The site is laid out like a small museum gallery. Each product is hung as an exhibit, photographed where it stands, with a plain wall label beside it. The lion logo's own ink-blue field supplies the dark panels.

## Colour

Restrained palette with one committed accent. Colour owns whole regions, never scattered accents.

| Token | Value | Use |
|---|---|---|
| `--wall` | `#e6e6e1` | Page ground (plaster) |
| `--wall-deep` | `#d9d9d2` | Alternate band (event products, Touch Station alt sections) |
| `--paper` | `#f3f3ef` | Inputs, tier drawings |
| `--ink` | `#15191c` | Headings, rules, outline buttons |
| `--ink-body` | `#353c41` | Body text |
| `--ink-muted` | `#565e63` | Labels, secondary text (≥4.5:1 on wall) |
| `--hall` | `#16222b` | Ink panels and footer; matches the logo field `#16222A` |
| `--on-hall` / `--on-hall-muted` | `#e8ecec` / `#a7b5bc` | Text on ink panels |
| `--signal` | `#f3c623` | Actions only, plus the one yellow contact block per page |
| `--live` | `#2e7d4f` | "Live" status dot only |

Never add a second accent, gradients, glows or coloured shadows.

## Type

One family: **Schibsted Grotesk** (Google Fonts, variable 400–900). Hierarchy comes from size and weight only.

- h1: `clamp(2.5rem, 4.6vw, 4.25rem)`, 800, tracking -0.035em, line-height 1.0
- h2: `clamp(2rem, 3.6vw, 3.25rem)`, 750, tracking -0.03em
- h3: 1.375rem, 750
- Body: 1.0625rem / 1.6, measure ≤ 65ch
- Labels: 0.875–0.9375rem, 500–600, sentence case

Bans: kickers/overlines above headings, small tracked uppercase labels, italic or serif accents, section numbers (sequence numbers in "how it works" steps are allowed because the order is the information).

## Space, shape, lines

- 4px scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 (`--s1`…`--s10`). Sections are 128px apart (96px on subpages, 64px on mobile).
- One radius: 2px. No pills, no rounded cards.
- Grouping is done with rules, not boxes: 2px ink rule above a group, 1px `--line` between rows.
- No shadows. The only filled boxes are ink panels (`.on-hall`, `.ts-stack`, `.ts-care`) and the yellow call block.

## Components

- **Wall label** (`.hall-label`): 2px ink rule, title, one-line description, `dl.hall-facts` of label/value pairs (On view, Status, Price…), then a text link with arrow. Facts must be real; no inventory numbers or archive codes.
- **Exhibit** (`.hall-exhibit`): photo spans 8 of 12 columns, label 4; alternates sides; portrait photos use the narrow variant.
- **Buttons**: primary = signal yellow with ink border; secondary = transparent with ink border. Hover fills ink from the left (280ms). One primary per view.
- **Status** (`.tla-badge`): coloured dot + text. Live = green dot, in development = yellow dot, planned = dashed ring.
- **Nav**: sticky on the wall colour, product links, language link, yellow Contact. Below 900px a "Menu" button opens a full-width sheet.
- **Catalogue entry** (`CataloguePage.astro`, the product pages): Plate 1 hangs on the left and stays in view (sticky) while the entry is read on the right: crumb, title, a ruled fact table (`.cat-table`), lede, one primary action, then sections. Numbered detail plates (`.cat-plate`, captions start "Photo n." (NL "Foto n."; section heading "Photos" / "Foto's")) and an ink enquiry block close the page. Touch Station puts its tiers, demo, comparison and FAQ in the `after` slot.
- **Footer**: ink panel, logo, Work / Events / Contact columns, © and KvK 42062105.

## Motion

One authored moment per page, layered on content that is visible by default (`html.js-motion` opt-in, failsafe after 2.5s).

- **Unveil**: exhibit photos are revealed top-to-bottom with `clip-path` (900ms, `cubic-bezier(0.16, 1, 0.3, 1)`) the first time they enter the viewport. The observer watches the photo's parent, because Chrome counts the clip.
- **Label mount**: the hero wall label's lines rise 10px and fade in, 70ms apart, after the photo.
- **Exhibit viewer** (homepage hero): previous/next wipes the new photo across the old one (720ms) with a slight scale settle; the label re-mounts. Visitor-driven only, no autoplay; arrow keys work.
- **View transitions**: cross-document, the homepage exhibit photo morphs into the hero photo of its page (`view-transition-name: exhibit-touch|jan|key|vr`); the nav stays put.
- **Feedback**: button fill, nav underline grow, arrow nudge (150–300ms).
- **Reduced motion**: no unveil, no wipe (200ms crossfade instead), no view transitions, slideshow shows its first image.
