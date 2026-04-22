# Resume Update — Manual To-Do List

These are the things Copilot **cannot do for you** — actions that require your manual input to complete the resume improvements.

---

## 🔴 Must-Do Before Applying

### 1. Create & Upload a PDF CV
- Export your CV to PDF (use your resume page as a base, or create a clean A4 version)
- Save it as `cv-daniel-van-leeuwen.pdf`
- Place it in `Website/public/` so it's served at `/cv-daniel-van-leeuwen.pdf`
- The "Download CV" button on the resume page already links to this path

### 2. Verify Your LinkedIn URL
- The resume now links to `https://www.linkedin.com/in/danielvanleeuwen/`
- **Check this is your actual LinkedIn URL** — if different, update it in `resume.astro` line with `btn-li`
- Make sure your LinkedIn profile is up-to-date with the same work history

### 3. Meijel Museum — Add a Screenshot or Photo
- Take a photo of the touch-screen table at the museum, or create a mockup screenshot
- Save it in `Website/public/images/meijel-museum/` (create the folder)
- Replace the placeholder `<div>` in `resume/projects/meijel-museum.astro` with an actual `<img>` tag
- This is your **most relevant project for Bruns** — a real photo matters

### 4. Garbage Gary — Add a Video or Screenshot
- The YouTube video embed is already working on the carousel card
- But the detail page still has a placeholder — uncomment the iframe block in `garbage-gary.astro` and set the embed URL to `https://www.youtube.com/embed/Nn0hLqFrPOk`

---

## 🟡 High Priority

### 5. Add Puzzle Quest / Magic Crystal to Projects
- Consider adding a new project card to the carousel for your ESP32 interactive props
- You have video/photos of prototypes? Add them as a new project page
- For ETF Ride Systems especially, this demonstrates embedded systems + storytelling
- Create a new file: `resume/projects/puzzle-quest.astro` with the same structure as other project pages

### 6. Blog Post Ordering
- The latest blog posts shown are "Pebble Ticketing System", "Raspberry Game Streaming", "Amsterdam 2.0"
- Consider writing a blog post about the Puzzle Lantern or Meijel Museum work
- These would appear at the top and make a much stronger impression on Bruns/ETF

### 7. Update Meijel Museum Project Image
- The carousel currently uses a generic Google Images thumbnail
- Replace with your own screenshot: update the `image:` field in the PROJECTS array in `resume.astro`

---

## 🟢 Nice to Have

### 8. Add a Professional Headshot
- Neither the resume page nor the layout has a profile photo
- Consider adding one to the hero section — it humanises the CV

### 9. Add a "Personal Projects" Section
- Below Work Experience, consider adding a section for personal/Lions Alliance projects:
  - Puzzle Lantern (interactive quest prop with ESP32-C3, ESP-NOW, UV LEDs)
  - Magic Crystal (proximity-sensing wearable with ESP-NOW mesh)
  - WeddingCamBox (event camera rental platform with QR photo upload)
  - Raspberry Pi Home Server (Docker, Grafana, sport tracker, documentation wiki)
- These demonstrate the full breadth of your skills beyond client work

### 10. Record a Short Demo Video
- A 60-second reel of your best work (Amsterdam Rederij clips, Lucardi renders, Oosterschelde underwater, Garbage Gary gameplay, Puzzle Lantern prototype) would be extremely compelling
- Host on YouTube, embed at the top of the resume

---

## ✅ Already Done (by Copilot)

- [x] Fixed Pebble dates: "Feb 2026 – present" → "Feb 2026 – Apr 2026"
- [x] Updated bio with interactive installations & embedded prototyping pitch
- [x] Updated "Currently exploring" sidebar with relevant projects
- [x] Expanded Skills section: added Prototyping & Fabrication category, ESP32, Docker, Next.js, Astro, etc.
- [x] Added "Download CV" button (PDF) — you need to create the actual PDF
- [x] Added LinkedIn social link — verify your URL
- [x] Updated meta description for SEO
- [x] Meijel Museum: updated tags, subtitle, placeholder image, modernised status text
- [x] Garbage Gary: reframed as museum exhibit, updated tags and carousel description
- [x] Added CSS styles for new PDF and LinkedIn buttons
