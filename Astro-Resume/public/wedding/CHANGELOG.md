# WeddingCamBox — Change Log

All requests and changes made to this project, in chronological order.

---

## [2026-04-03 07:57] — Initial project setup

**Request:** Build a simple homepage for a camera rental website. The concept: 10 thumb-sized cameras purchased for a friend's wedding, rented out to other couples who can't afford a photographer. Guests pass cameras around during the reception.

**Files created:**
- `index.html` — Full homepage with nav, hero, how-it-works, cameras, pricing, testimonial, and booking form sections
- `styles.css` — Full styling with wedding-themed design (blush/rose palette, Playfair Display serif headings)
- `script.js` — Sticky nav, mobile hamburger menu, booking form validation, scroll reveal animations

**Details:**
- Hero section with animated 10-camera grid
- 3-step "How it works" process
- 6 camera feature cards
- Pricing card at €149 (later revised)
- Fake testimonial for social proof
- Booking form with client-side validation (name, email, future-date check)
- Google Fonts: Playfair Display + Inter

---

## [2026-04-03 08:16] — Camera specs, pricing calculator, gallery portal section

**Request:**
1. Update camera specs based on the Alibaba product listing (Mini Thumb Portable Camera 1080P HD Screen)
2. Add delivery pricing: base €79.99 + €0.20/km for delivery, with address input and live price calculation
3. Add a section about a future online gallery portal (sort, delete, download, share link)

**Files modified:**
- `index.html`
  - Updated nav: added "Your gallery" anchor link
  - Updated camera features section with 1080P HD specs, built-in HD screen, one-click shooting
  - Replaced pricing section: new base price €79.99, pickup vs. delivery radio toggle, address input, live price breakdown, dynamic "Book for €X,XX" button
  - Added new **Gallery Portal** section with 4 steps (browse, delete, download, share) and a "Coming soon" badge
- `styles.css`
  - Added `.pricing__cents` style
  - Added full delivery calculator component styles (radio cards, address input, result states)
  - Added price breakdown table styles
  - Added gallery portal section styles (portal-grid, portal-step, portal-coming-soon, portal-badge)
- `script.js`
  - Added `BUSINESS_COORDS` config constant (placeholder, must be updated)
  - Added `geocodeAddress()` using Nominatim (OpenStreetMap) API — free, no API key needed
  - Added `getRoadDistanceKm()` using OSRM public routing API — free, no API key needed
  - Added `updatePriceDisplay()` live price calculator
  - Pickup/delivery toggle shows/hides address input with CSS transition
  - Enter key in address field triggers calculation

---

## [2026-04-03 09:47] — Deployed to GitHub repository

**Request:** Push the WeddingCamBox project to the `DanTheLion-git/DanTheLion-Resume` repository so it deploys via GitHub Actions to `thelionsalliance.com/wedding/`.

**Method:** GitHub Git Tree API (single clean commit, no intermediate test commits in history).

**Commit:** `62a3a25` — _"Add WeddingCamBox project under /wedding"_

**Files pushed to repo:**
```
Astro-Resume/public/wedding/index.html
Astro-Resume/public/wedding/styles.css
Astro-Resume/public/wedding/script.js
Astro-Resume/public/wedding/photoportal/index.html
Astro-Resume/public/wedding/photoportal/portal.css
Astro-Resume/public/wedding/photoportal/portal.js
```

**Also fixed:** Share link URL in `photoportal/portal.js` updated from `thelionsalliance.com/weddings/share/` → `thelionsalliance.com/wedding/photoportal/share/`

**Live URLs (once GitHub Actions build completes ~1 min after push):**
- Homepage: `https://thelionsalliance.com/wedding/`
- Portal: `https://thelionsalliance.com/wedding/photoportal/`



**Request:** Move the whole project to `thelionsalliance.com/weddings` and the portal to `thelionsalliance.com/weddings/photoportal`. Clarify how to deploy via the existing GitHub repo.

**Discovery:** The `DanTheLion-Resume` GitHub repo uses Astro + GitHub Actions + GitHub Pages. Files placed in `Astro-Resume/public/` are served as-is — no Astro knowledge needed for plain HTML projects.

**Files modified:**
- `index.html` — updated "My gallery login" nav link from `weddings/` → `photoportal/` (both desktop and mobile menus)
- `INSTRUCTIONS.md` — completely rewrote the deployment section with correct Astro `public/` folder approach, exact PowerShell copy commands, and step-by-step Git workflow

**Structural change:**
- Renamed local subfolder `weddings/` → `photoportal/`
- Final local structure mirrors what should be copied into `Astro-Resume/public/weddings/` in the repo:
  ```
  WeddingCamBox/           → Astro-Resume/public/weddings/
  ├── index.html           →   index.html
  ├── styles.css           →   styles.css
  ├── script.js            →   script.js
  └── photoportal/         →   photoportal/
      ├── index.html       →     index.html
      ├── portal.css       →     portal.css
      └── portal.js        →     portal.js
  ```

**Regarding direct repo access:** GitHub Copilot CLI can read public repositories via the API but does not have write/push access. Deployments must be done by the repo owner using `git push`.


**Request:**
1. Create a login system (no registration — credentials sent by email)
2. Build a full online portal at `thelionsalliance.com/weddings`
3. Add placeholder free-to-use wedding photos (Unsplash)
4. Allow users to delete, sort, and organize photos (including drag & drop)
5. Download button placeholder
6. Send a download/share link to a list of email addresses
7. Address book tab for managing email contacts

**Files created:**
- `weddings/index.html` — Single-page app: login view + portal view (tabs: Gallery, Address Book), lightbox overlay, share link modal, toast notifications
- `weddings/portal.css` — Full portal styling matching main site design tokens
- `weddings/portal.js` — All portal logic (see details below)

**Files modified:**
- `index.html` — Added "My gallery login" link in nav (desktop + mobile) pointing to `weddings/`

**Portal features implemented (`portal.js`):**
- Auth: username/password login against `USERS` config object, session stored in `sessionStorage`
- Demo credentials: username `demo`, password `wedding2025`
- 15 placeholder wedding photos sourced from Unsplash (free license)
- Gallery: sort by newest/oldest/A–Z/Z–A/custom drag order; all state persisted in `localStorage`
- Lightbox: full-screen photo view with prev/next navigation and keyboard arrow support
- Per-photo actions: view in lightbox, download (placeholder toast), delete (with confirmation)
- Bulk actions: select all/deselect all, delete selected
- Drag & drop reordering (HTML5 API) when sort mode is set to "Custom order"
- Address Book: add contacts (name + email), select/deselect, remove
- Share modal: generates a fake shareable URL, copy-to-clipboard, "send" to selected contacts with success toast
- Toast notification system (success / error / info variants)

## [2026-04-03 09:55] — Icons, PostNL shipping, and homepage tweaks

**Request:**
1. Replace emoji icons with single-colour flat design (Lucide) icons throughout the site
2. Replace per-km delivery calculator with a flat PostNL shipping fee (€15 send + return included)
3. Leave the testimonial section in place but empty — to be filled with the first real review

**Changes:**
- `index.html` — replaced all emoji icons with `<i data-lucide="...">` tags; updated PostNL shipping note in pricing section; cleared testimonial text to a placeholder
- `styles.css` — removed delivery calculator styles; minor icon sizing rules added
- `script.js` — removed `geocodeAddress()`, `getRoadDistanceKm()`, `updatePriceDisplay()`, address/radio event listeners; added `lucide.createIcons()` call

**GitHub commit:** _(part of `62a3a25` batch push)_

---

## [2026-04-03 10:20] — Camera PNG placeholder + storage capacity

**Request:**
1. Replace the 10 camera emoji icons on the homepage with `camera.png` product images (placeholder provided; user will swap in real product photo)
2. Calculate approximate photo count for 32 GB SD cards and add to the homepage with a 10 % safety margin

**Changes:**
- `camera.png` — 400 × 400 placeholder image generated and added to project root
- `index.html` — replaced emoji camera grid with `<img src="../camera.png">` product images; added photo-capacity stat (≈ 16 000 photos total / 1 600 per camera) to the features section

---

## [2026-04-03 10:45] — Moved storage stats to features section

**Request:** Remove the SD card size / photos-per-camera / total capacity block from the top hero area and place it where the "Loss & Damage covered" feature card was instead.

**Changes:**
- `index.html` — moved storage capacity block into features grid; removed it from hero/intro area

---

## [2026-04-03 13:32] — 3-tier pricing redesign

**Request:** Replace single pricing card with 3 packages:
- Basic — €89 (10 cameras + raw files)
- Standard — €119 featured (online gallery + guest sharing + photo curation)
- Premium — €149 coming soon / greyed out (all above + custom branding + digital photobook)

**Changes:**
- `index.html` — replaced single pricing card with 3-column grid; added PostNL shipping note below grid; Premium card has "coming soon" badge and is visually muted
- `styles.css` — new 3-column pricing grid, featured card highlight, coming-soon overlay, responsive collapse at 900 px
- `script.js` — removed leftover delivery calculator variables and handlers

**GitHub commit:** `04d5997`

---

## [2026-04-03 14:00] — 3-step photo portal workflow

**Request:** Rebuild the portal into a guided 3-step process:
1. **Curate** — browse all photos, delete unwanted ones to a recycle bin
2. **Guests** — manage the guest email list
3. **Send** — compose a custom email and send a download link to all guests

**Also:** Admin login (`admin` / `Hondje01`) routes to a separate admin dashboard instead of a client portal.

**Changes:**
- `photoportal/index.html` — replaced tab UI with stepper header + step panels; added recycle bin drawer, lightbox overlay, toast container; EmailJS SDK `<script>` tag added
- `photoportal/portal.css` — full stepper styles, recycle bin drawer, guest list, email composer, admin banner
- `photoportal/portal.js`
  - `USERS` object: `demo`/`wedding2025` client + `admin`/`Hondje01` admin
  - `EMAILJS_CONFIG` placeholder object at top of file
  - Soft-delete: `moveToBin()` moves photos to `state.recycleBin`; `restoreFromBin()` / `emptyBin()` manage it
  - Guest list: add/remove email addresses, persisted to `localStorage`
  - Email composer: `contenteditable` body with live preview; sends via `emailjs.send()` (one per guest) with `mailto:` fallback when keys not configured
  - `routeAfterLogin()` checks `user.isAdmin` to branch between dashboard and client portal

**GitHub commit:** `813ed67`

---

## [2026-04-03 14:30] — Admin dashboard with mock clients

**Request:** Admin login should show a dashboard with:
- Overview of all customers (status: photos uploaded, guests added, link sent, days since/until wedding)
- "Manage portal" button to enter any client's 3-step portal with an admin banner
- "Upload photos" button (file picker → object URLs, session-only for now)
- 3 mock clients pre-loaded:
  - **Bob & Linda** — photos ✓, guests ✓, link sent ✓
  - **James & Kim** — photos ✓, no guests, no link
  - **Suzie & Nathasja** — future wedding (20 Sep 2026), no photos yet

**Also discussed:** Sending emails from the website (not user's mail client) requires EmailJS or a backend SMTP relay. EmailJS (free tier: 200 emails/month) is the recommended approach — setup documented in INSTRUCTIONS.md.

**Changes:**
- `photoportal/portal.js` — `CUSTOMERS` config object; `initMockData()` seeds localStorage once on first admin login; `renderAdminDashboard()` builds client cards with status pills; `enterCustomerPortal(username)` / back button wired up; photo upload via `<input type="file">` creates object URLs
- `photoportal/portal.css` — `.client-card`, `.status-pill`, upload modal, admin banner styles appended
- `photoportal/index.html` — admin dashboard container added; EmailJS CDN script tag present

**GitHub commit:** `813ed67` _(bundled with portal redesign)_

---

## [2026-04-03 15:10] — Dutch / English language switch (i18n)

**Request:** Add a language toggle (EN / NL) to the homepage. Auto-detect the user's browser language and default to Dutch for Dutch visitors. Provide full Dutch translations of all user-facing text.

**Changes:**
- `index.html` — added `data-i18n="key"`, `data-i18n-html="key"`, `data-i18n-placeholder="key"` attributes to every translatable element; `EN / NL` toggle button added to desktop nav and next to hamburger on mobile; `.nav__right` wrapper groups them
- `script.js`
  - `TRANSLATIONS` object with `en` and `nl` keys covering all homepage text
  - `detectLanguage()` — checks `localStorage['wcb_lang']` → `navigator.language` → defaults `en`
  - `setLanguage(lang)` — saves preference, calls `applyTranslations()` + `updateLangButtons()`
  - `applyTranslations()` — iterates `[data-i18n]`, `[data-i18n-html]`, `[data-i18n-placeholder]`
  - Form validation error strings sourced from `TRANSLATIONS[currentLang]`
- `styles.css` — `.lang-switch`, `.lang-switch__btn`, `.lang-switch--mobile` CSS appended

**GitHub commit:** `6ab5a7b`

---

## [2026-04-03 15:45] — Dutch copy rewrite (natural wedding tone)

**Request:** Don't use a literal translation — rewrite the Dutch copy to feel natural, using familiar wording found in Dutch wedding industry products.

**Changes:**
- `script.js` — rewrote the entire `nl:` block in `TRANSLATIONS`:
  - Uses "jullie" (intimate plural) throughout
  - "cameradoos", "onvergetelijke momenten", "Zo werkt het", "Reserveer jullie datum"
  - "Kies het pakket dat bij jullie past", "Meest gekozen"
  - "Elke bruiloft verdient de mooiste herinneringen" for pricing note
  - Booking form labels and validation messages rewritten in Dutch wedding tone

**GitHub commit:** `158a4c9`
