# Party Games — Technical Reference

A developer reference for the party games section of **The Lions Alliance** (`thelionsalliance.com/games`).

---

## Project Structure

```
DanTheLion-Resume/
├── Astro-Resume/                        ← Astro project (deployed to GitHub Pages)
│   ├── astro.config.mjs                 ← site: 'https://thelionsalliance.com'
│   ├── package.json                     ← dependencies: astro, html5-qrcode, qrcode
│   ├── public/
│   │   ├── hitster/
│   │   │   └── songs.json               ← optional song metadata cache
│   │   ├── charades/
│   │   │   └── prompts.json             ← charades prompts (EN + NL, edit to customise)
│   │   └── 30-seconds/
│   │       └── prompts.json             ← 30 Seconds prompts (338, edit to customise)
│   └── src/
│       ├── lib/
│       │   ├── spotify.ts               ← Spotify PKCE OAuth + playback helpers
│       │   └── hitster.ts               ← QR parsing + Spotify track-info fetcher
│       ├── styles/
│       │   └── games.css                ← shared theme: Inter font, site charcoal palette
│       └── pages/
│           └── games/
│               ├── index.astro          ← /games/ hub
│               ├── hitster/
│               │   ├── index.astro      ← /games/hitster/ main game
│               │   ├── callback.astro   ← /games/hitster/callback Spotify OAuth handler
│               │   └── admin.astro      ← /games/hitster/admin/ card generator
│               ├── charades/
│               │   └── index.astro      ← /games/charades/ game
│               └── 30-seconds/
│                   └── index.astro      ← /games/30-seconds/ game
├── .github/
│   └── workflows/
│       └── main.yml                     ← GitHub Actions: build Astro → deploy to Pages
├── GAMES-CHANGELOG.md                   ← this project's changelog
└── GAMES-REFERENCE.md                   ← this file
```

---

## Deployment

The site is deployed via **GitHub Actions → GitHub Pages** with a custom domain.

| Trigger | Branch | Action |
|---------|--------|--------|
| `push` to `main` | `main` | Build Astro (`npm run build` in `Astro-Resume/`) and deploy `dist/` to GitHub Pages |
| Manual | any | `workflow_dispatch` in GitHub UI |

**Custom domain:** `thelionsalliance.com` (configured in GitHub Pages settings).  
**Base URL:** no `/` sub-path — the Astro `site` is the root domain.

---

## Shared Styles (`src/styles/games.css`)

All game pages import `games.css`. CSS custom properties now match the main site (`global.css`):

| Variable | Value | Use |
|---|---|---|
| `--g-bg` | `#1d2327` | Page background (site charcoal) |
| `--g-surface` | `#2c3338` | Cards / panels |
| `--g-accent` | `#2271b1` | Primary action colour (blue) |
| `--g-accent2` | `#5fa8d3` | Highlight colour (light blue) |
| `--g-green` | `#1db954` | Spotify green / success |
| `--g-text` | `#f0f0f1` | Body text |
| `--g-muted` | `#a7aaad` | Secondary text |
| `--g-border` | `#3c434a` | Borders |
| `--g-radius` | `14px` | Card border radius |

Font: **Inter** via Google Fonts (same as rest of site). Header: glassmorphism `backdrop-filter: blur(10px)`.

Utility classes: `.hidden`, `.g-btn`, `.g-card`, `.g-alert`, `.g-label`, `.game-header`, `.game-content`.

---

## Spotify Integration (Hitster)

### Overview

Hitster uses **Spotify PKCE OAuth** (no backend / no client secret) plus the **Spotify Web Playback SDK**.

| Item | Value |
|---|---|
| Client ID | `a7bbba876c354c84b9d5932024a1e951` |
| Redirect URI | `https://thelionsalliance.com/games/hitster/callback` |
| OAuth scopes | `streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state` |
| Token storage | `localStorage` (`spotify_access_token`, `spotify_refresh_token`, `spotify_token_expiry`) |

### PKCE Flow

```
1. generateRandomString(128)         → code_verifier   (stored in sessionStorage)
2. sha256(code_verifier) → base64url → code_challenge
3. GET accounts.spotify.com/authorize?... code_challenge
4. Spotify redirects → /games/hitster/callback?code=XXX
5. POST accounts.spotify.com/api/token  { code, code_verifier }
6. Store access_token + refresh_token in localStorage
7. Token auto-refreshes 60 s before expiry
```

### Playback

```
1. Load SDK:  <script src="https://sdk.scdn.co/spotify-player.js">
2. window.onSpotifyWebPlaybackSDKReady() fires → create new Spotify.Player(...)
3. player.connect() → receives device_id via 'ready' event
4. PUT /v1/me/player/play?device_id={id}  body: { uris: ['spotify:track:XXX'] }
```

**Requirements:** Spotify Premium account. Works on Chrome, Firefox, Edge. **Not** iOS Safari.

### Spotify Developer Setup

1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → create app
2. Add redirect URI: `https://thelionsalliance.com/games/hitster/callback`
3. Note the **Client ID** (the Client Secret is NOT needed for PKCE)

---

## QR Code Format (Hitster)

Each Hitster card's QR code encodes a **Spotify track URI**:

```
spotify:track:4uLU6hMCjMI75M1A2tKUQC
```

The scanner (`html5-qrcode`) also accepts full Spotify track URLs:

```
https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
```

Both formats are parsed by `parseQRToTrackUri()` in `src/lib/hitster.ts`.

---

## Hitster Admin Card Generator

### Flow

```
/games/hitster/admin/
  └─ paste playlist URL or URI
  └─ fetch all tracks  (GET /v1/playlists/{id}/tracks, paginated, 100/page)
  └─ generate QR PNGs  (qrcode.toDataURL per track)
  └─ build print layout
  └─ window.print() → browser print dialog → "Save as PDF"
```

### Print Layout

- **A4 portrait**, 8 mm margins, 3 × 3 cards per page
- **Page 1 (fronts):** QR code + "HITSTER" label + card number
- **Page 2 (backs):** Year (large) + Song title + Artist, columns **mirrored left↔right**
  - Mirror formula: for each 3-card row, reverse column order
  - Correct alignment when printing **double-sided, flip on long edge**

---

## Charades Prompt Database

### Schema (`public/charades/prompts.json`)

```typescript
interface Prompt {
  id:         number;
  text:       string;                          // the word/phrase to act out
  category:   'movies'|'books'|'artists'|'songs'|'places'|'sayings';
  difficulty: 'easy'|'medium'|'hard';
  lang:       'en'|'nl'|'any';                 // 'any' = works in either language
}
```

### Adding Prompts

Open `Astro-Resume/public/charades/prompts.json` in VS Code and edit the JSON array directly.

Each prompt object:
```json
{ "id": 42, "text": "The Lion King", "category": "movies", "difficulty": "easy", "lang": "en" }
```

| Field | Valid values |
|---|---|
| `category` | `movies` `books` `artists` `songs` `places` `sayings` `custom` |
| `difficulty` | `easy` `medium` `hard` |
| `lang` | `en` `nl` `any` (both languages) |

After editing: **git commit + push** → GitHub Actions redeploys in ~1–2 min.

---

## 30 Seconds Prompt Database

### Schema (`public/30-seconds/prompts.json`)

```typescript
interface Prompt {
  id:       number;
  text:     string;     // the word/phrase to describe
  category: 'people'|'places'|'movie'|'tv'|'music'|'object'|'nature'|'concept'|'food'|'sport';
}
```

No `difficulty` or `lang` field — prompts are curated to be medium/hard by default. The database contains 338 prompts including internationally-famous AND Dutch/Belgian-famous entries.

### Adding / Editing Prompts

Open `Astro-Resume/public/30-seconds/prompts.json` in VS Code.

```json
{ "id": 339, "text": "Windmill", "category": "object" }
```

Keep `id` values unique and sequential. After editing: **git commit + push**.

### Category Icons (in-game display)

| Category | Icon |
|---|---|
| `people` | 👤 |
| `places` | 📍 |
| `movie` | 🎬 |
| `tv` | 📺 |
| `music` | 🎵 |
| `object` | 🔧 |
| `nature` | 🌿 |
| `concept` | 💡 |
| `food` | 🍽️ |
| `sport` | ⚽ |

### Game Flow

```
Setup  →  Handover (pass to explainer)  →  Play (card + optional timer)
       →  Result (score ± adjust)       →  next team's Handover
       →  Scores (mid-game)             →  End Game → Winner screen
```

### Category Icons

| Category | Icon | NL label |
|---|---|---|
| `movies` | 🎬 | Films |
| `books` | 📚 | Boeken |
| `artists` | 🎤 | Artiesten |
| `songs` | 🎵 | Nummers |
| `places` | 🌍 | Plaatsen |
| `sayings` | 💬 | Gezegden |
| `custom` | ⭐ | Eigen |

---

## Adding a New Game

1. Create `src/pages/games/{gamename}/index.astro`
2. Import `'../../../styles/games.css'`
3. Use `GamesLayout`-style header (`<header class="game-header">`)
4. Add a tile in `src/pages/games/index.astro`
5. If the game has static data, put JSON in `public/{gamename}/`
6. Update `GAMES-CHANGELOG.md` with the new version entry

---

## Dependencies

| Package | Version | Used for |
|---|---|---|
| `astro` | `^5.15.9` | Framework / build |
| `html5-qrcode` | latest | Camera QR scanning (Hitster game) |
| `qrcode` | latest | QR code PNG generation (Hitster admin) |

---

## Known Limitations

| Issue | Detail |
|---|---|
| Spotify SDK — iOS Safari | Web Playback SDK is not supported by Safari on iOS. Users must use Chrome on iOS. |
| Static site — no user accounts | Auth tokens and game state are stored in `localStorage` (device-local). |
| Blog build fails locally | `src/pages/blog/[slug].astro` fetches from `public-api.wordpress.com` at build time. This fails without internet access but works correctly in GitHub Actions CI. |
