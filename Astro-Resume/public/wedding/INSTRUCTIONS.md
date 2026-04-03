# WeddingCamBox — Deployment & Setup Instructions

Practical instructions and notes collected throughout development.

---

## How your website is deployed

Your site at `thelionsalliance.com` uses the following stack:

- **Astro** — static site generator, project lives in `Astro-Resume/` in your repo
- **GitHub Actions** — automatically builds the Astro site and deploys it on every push to `main`
- **GitHub Pages** — hosts the built output

The workflow is: _edit files → `git push` → Actions builds → live on thelionsalliance.com_

---

## Deploying WeddingCamBox to thelionsalliance.com/wedding

Because the WeddingCamBox site is plain HTML/CSS/JS (no build step), the easiest place to put it is **Astro's `public/` folder**. Files there are copied directly into the build output without any processing.

### Target structure inside your repo

```
Astro-Resume/
└── public/
    └── wedding/                 ← copy the WeddingCamBox folder here
        ├── index.html           ← homepage  →  thelionsalliance.com/wedding/
        ├── styles.css
        ├── script.js
        ├── camera.png
        ├── CHANGELOG.md
        ├── INSTRUCTIONS.md
        └── photoportal/
            ├── index.html       ← portal    →  thelionsalliance.com/wedding/photoportal/
            ├── portal.css
            └── portal.js
```

### Step-by-step

Open a terminal, navigate to your local clone of the `DanTheLion-Resume` repo, then run:

```powershell
# 1. Make sure you're on the latest version of main
git pull origin main

# 2. Copy all WeddingCamBox files into it
Copy-Item -Recurse -Force -Path "C:\Users\DanielvanLeeuwen\Documents\WeddingCamBox\*" `
  -Destination "Astro-Resume\public\wedding\"

# 3. Stage, commit, and push
git add Astro-Resume/public/wedding
git commit -m "Update WeddingCamBox"
git push origin main
```

GitHub Actions will pick up the push, rebuild the Astro site, and deploy within ~1 minute.

> **Note:** GitHub Copilot CLI pushes changes directly via the GitHub Git Tree API on your behalf during development sessions, so you usually don't need to do this manually unless you're making changes outside of Copilot.

---

## Adding customers to the gallery portal

Customer credentials are stored in `photoportal/portal.js`. Open the file and find the `USERS` object at the top:

```js
const USERS = {
  admin: { password: 'Hondje01', name: 'Admin', isAdmin: true },
  demo:  { password: 'wedding2025', name: 'Sophie & Liam', wedding: '12 April 2025' },
};
```

To add a new customer after their photos are uploaded:

```js
'emma.james': {
  password: 'yourChosenPassword',
  name: 'Emma & James',
  wedding: '5 July 2026',
},
```

Also add an entry to the `CUSTOMERS` object (used by the admin dashboard):

```js
'emma.james': {
  name: 'Emma & James',
  weddingDate: '2026-07-05',
  package: 'Standard',
},
```

Then email the customer their username and password so they can log in at `thelionsalliance.com/wedding/photoportal/`.

> ⚠️ **Security note:** Storing credentials in a JS file is fine for a low-traffic personal project but is not suitable for a large-scale production service. When you're ready to scale, consider replacing this with a proper backend.

---

## Uploading photos for a customer (admin dashboard)

1. Log in with `admin` / `Hondje01` at `thelionsalliance.com/wedding/photoportal/`
2. Find the customer's card and click **Upload photos**
3. Select the photo files from your computer

> ⚠️ **Current limitation:** Photo uploads via the admin dashboard use browser object URLs and are **session-only** — they disappear on page reload. For permanent storage, photos need to be hosted on a cloud service (see _Future: online portal backend_ below) and their URLs added to `DEFAULT_PHOTOS` in `portal.js`.

---

## Setting up email delivery (EmailJS)

To send gallery-link emails directly from the portal (instead of opening the user's mail client), set up a free EmailJS account:

1. Sign up at [emailjs.com](https://www.emailjs.com) (free tier: 200 emails/month)
2. Connect your Gmail (or other email provider) as a service — note the **Service ID**
3. Create an email template with these variables:
   - `{{to_email}}` — recipient address
   - `{{to_name}}` — recipient name
   - `{{couple_name}}` — couple's names
   - `{{subject}}` — email subject
   - `{{message_html}}` — HTML body composed in the portal
   - `{{gallery_link}}` — the shareable gallery URL
   - Note the **Template ID**
4. Go to your account settings and copy your **Public Key**
5. Open `photoportal/portal.js` and fill in the `EMAILJS_CONFIG` object at the top:

```js
const EMAILJS_CONFIG = {
  serviceId:  'service_xxxxxxx',   // ← your Service ID
  templateId: 'template_xxxxxxx',  // ← your Template ID
  publicKey:  'xxxxxxxxxxxxxxxxxxxx', // ← your Public Key
};
```

6. Redeploy (commit + push). The yellow warning banner in the admin dashboard will disappear once real keys are detected.

---

## Booking form — receiving enquiries

The booking form on the homepage currently **simulates** a submission (no emails are actually sent). To receive real booking requests, integrate a free form backend:

**Option A — Formspree (easiest):**
1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form and get your endpoint URL (e.g. `https://formspree.io/f/abcdefgh`)
3. In `index.html`, change the form tag:
   ```html
   <form class="form" id="bookingForm" action="https://formspree.io/f/abcdefgh" method="POST">
   ```
4. Remove or simplify the `form.addEventListener('submit', ...)` block in `script.js` to let the native POST through

**Option B — Netlify Forms** (if you ever migrate hosting to Netlify):
Add `netlify` attribute to the form tag — Netlify handles the rest automatically.

---

## Replacing camera.png with the real product photo

The homepage uses `camera.png` as a placeholder image for all 10 camera cards. To use the real product photo:

1. Save your photo as `camera.png` (recommended: 400 × 400 px, transparent or white background)
2. Replace `C:\Users\DanielvanLeeuwen\Documents\WeddingCamBox\camera.png` with your file
3. Redeploy (commit + push)

---

## Replacing placeholder photos with real customer photos

Photos are defined in `photoportal/portal.js` in the `DEFAULT_PHOTOS` array. Each entry looks like this:

```js
{ id: 'p01', title: 'The first dance', datetime: '2025-04-12T20:15:00', camera: 'Camera 1',
  url:   'https://your-storage.com/photos/full/p01.jpg',
  thumb: 'https://your-storage.com/photos/thumb/p01.jpg' },
```

For each customer:
1. Upload their photos to a hosting service (e.g. Cloudflare R2, AWS S3, or a folder on your server)
2. Replace the `DEFAULT_PHOTOS` array entries with their actual photo URLs
3. Redeploy (commit + push)

---

## Fonts

The site uses Google Fonts:
- **Playfair Display** — headings
- **Inter** — body text

These load from `fonts.googleapis.com` and require an internet connection. For fully offline use, download and self-host the fonts via [google-webfonts-helper](https://gwfh.mranftl.com/fonts).

---

## Future: Online portal backend

The gallery portal is currently fully client-side (no server, all data in `localStorage`). Planned features for when a backend is added:

- Real user authentication (hashed passwords, secure sessions)
- Per-user photo storage (uploaded files, not placeholder URLs) — **Cloudinary** or **Supabase Storage** are good starting points
- Persistent guest lists (currently stored in browser `localStorage` — clears if user switches device/browser)
- Actual photo downloads (full-resolution ZIP)
- QR code on camera instruction labels → guests pre-register their email before the wedding
- Premium tier features: custom-branded portal, digital photobook creator
