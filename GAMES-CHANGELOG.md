# Party Games — Changelog

All notable changes to the games section of **The Lions Alliance** are documented here.
Format: [Semantic Versioning](https://semver.org/).

---

## [1.5.0] — 2026-04-07

### Changed — Site-wide header & footer unification
- All game pages (`/games/`, `/games/hitster/`, `/games/charades/`, `/games/30-seconds/`) now use the **exact same header and footer** as the main resume/homepage
  - Header: "The Lions Alliance" logo + Games / Resume nav links + light/dark theme toggle
  - Footer: © The Lions Alliance
  - Anti-flash theme restoration script in every `<head>`
- Both `global.css` and `games.css` are now imported on game pages so `.site-header` / `.site-footer` styles apply correctly
- Removed `.game-header` CSS class (replaced by `.site-header` from `global.css`)
- Updated `.game-page` flex layout: removed `align-items: center`; `.game-content` now self-centers via `margin: 0 auto`

### Changed — Homepage
- Removed the three nav card buttons (Wedding / Resume / Games) from the homepage body
- Added **Games** link to the homepage header nav (next to Resume)

### Changed — Resume/Blog pages
- Added **Games** link to `ResumeLayout.astro` nav (Blog / Resume / **Games** / theme toggle)

---

## [1.4.1] — 2026-04-07

### Fixed
- 30 Seconds: CSS import path corrected (`../../../styles/games.css`) — build was failing with "could not resolve" error

---

## [1.4.0] — 2026-04-07

### Added — 30 Seconds
- New **30 Seconds** game at `/games/30-seconds/` (renamed from "Party&Co")
- Card shows **5 random prompts** from a 338-prompt database — describe without saying the word
- **App timer mode**: 60-second countdown with progress bar, turns red/urgent in last 10 s, vibrates on end
- **Manual / Hourglass mode**: no in-app timer, just the card — use your own hourglass
- **Team management**: 2–8 teams, custom names, add/remove during setup
- **Per-turn score adjustment**: +/− buttons on result screen for dispute resolution
- **Running scoreboard** accessible mid-game via header button
- **End Game** option from scoreboard shows winner podium with medal emojis
- **Play Again** resets scores but keeps teams; **New Setup** returns to full setup
- Prompt database: 338 prompts across 10 categories (people, places, movie, tv, music, object, nature, concept, food, sport)
- Celebrities: international-famous AND Dutch/Belgian-famous (Johan Cruyff, Marco Borsato, André Hazes, Max Verstappen, Virgil van Dijk, etc.)
- Prompt queue shuffles automatically; reshuffles when exhausted — no repeats until all used
- Static JSON at `public/30-seconds/prompts.json` — edit and push to deploy

---

## [1.3.0] — 2026-04-07

### Changed — Design alignment
- **games.css** completely rewritten to match the main site design language:
  - Color palette: site charcoal (`#1d2327` bg, `#2c3338` cards) replacing navy; blue accent (`#2271b1`) replacing red
  - Font: **Inter** (Google Fonts, same as homepage and resume)
  - Header: glassmorphism matching `site-header` (`backdrop-filter: blur(10px)`)
  - Buttons: **pill-shaped** (999px radius) with gradient primary, matching `button-primary`
  - Card hover: `translateY(-2px)` + shadow, matching site card interactions
- All game page headers updated: consistent **🦁 The Lions Alliance** logo + nav links
- Charades: removed built-in prompt editor (moved to direct JSON editing)
- Charades admin page (`/games/charades/admin/`) removed
- `initPrompts()` simplified: always loads from `public/charades/prompts.json`

---



### Added — Charades
- New **Charades** game at `/games/charades/`
- Language selection: 🇬🇧 English, 🇳🇱 Dutch, or both simultaneously
- Six prompt categories: Movies 🎬, Books 📚, Artists 🎤, Songs 🎵, Places 🌍, Sayings 💬
- ~200 hand-curated prompts per language with `easy` / `medium` / `hard` difficulty tiers
- Configurable difficulty filter (Easy only → All included)
- Configurable round timer: 30 / 60 / 90 / 120 seconds
- Configurable rounds per team
- Team management: 2–6 teams with custom names
- Custom words/phrases field (comma-separated, added to the prompt pool)
- "Pass the phone" team-ready transition screen (hides next prompt until tapped)
- Accurate timer using `Date.now()` delta (doesn't drift on tab switch)
- Timer turns red and pulses during final 10 seconds
- Per-round score display + cumulative team scores
- Final rankings screen with winner announcement
- "Play Again" resets scores but keeps settings

---

## [1.1.0] — 2026-04-07

### Added — Hitster Admin Card Generator
- New admin dashboard at `/games/hitster/admin/`
- Paste any Spotify playlist URL or URI to load all tracks (handles pagination for playlists with 100+ songs)
- Track list with per-track checkboxes, **Select All / Deselect All**
- Generates QR codes client-side via `qrcode` npm package (no server, no external request)
- Printable card sheet:
  - **Page 1** — QR code fronts (3 × 3 grid, A4 portrait, `HITSTER` label + card number)
  - **Page 2** — Song info backs (year · song title · artist), columns mirrored for double-sided printing
  - Correct alignment when printing **double-sided, flip on long edge**
- Screen preview before printing
- "🃏 Cards" button added to Hitster header (visible when authenticated)

---

## [1.0.0] — 2026-04-07

### Added — Hitster (initial release)
- Games hub at `/games/` with tile grid for all games
- **Hitster** game at `/games/hitster/`
  - Spotify PKCE OAuth (no backend / no client secret, tokens in `localStorage`)
  - Spotify Web Playback SDK — plays music directly in the browser, no app switching
  - Requires Spotify Premium; supported on Chrome, Firefox, Edge (not iOS Safari)
  - Camera-based QR code scanning via `html5-qrcode`
  - QR codes encode `spotify:track:XXXX` URIs
  - Track metadata (name / artist / year / album art) fetched live from Spotify API on "Reveal"
  - Full game flow: **Scan → Play → Guess the year → Reveal → Next card**
  - Pause / Resume / Restart controls
  - Automatic token refresh (60 s before expiry)
- Spotify OAuth callback handler at `/games/hitster/callback`
- `src/lib/spotify.ts` — reusable PKCE auth + playback helpers
- `src/lib/hitster.ts` — QR parsing + Spotify track-info fetch
- `src/styles/games.css` — mobile-first dark theme shared across all games
- `astro.config.mjs` updated: `site` set to `https://thelionsalliance.com`

---

## Roadmap

- `[1.5.0]` Hitster PDF card generator improvements (bleed marks, duplex guide)
- `[future]` Hitster PDF card generator improvements (bleed marks, duplex guide)
- `[future]` Charades: animated timer, haptic feedback on phones that support it
- `[future]` Shared leaderboard (would require a small backend or Supabase)
