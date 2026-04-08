# Lions Planner — Changelog

All changes are listed newest-first.

---

## [2026-04-08] — Notes redesign: always-visible preview with Edit / Save & Close

**Request:** Always show rendered markdown notes (no collapse). Add an Edit button that turns the view into the editor. Add Save & Close that saves and returns to the preview.

**Changes:**

- `Astro-Resume/src/pages/planner/board.astro`:
  - Removed collapsible toggle (header click, chevron, `.notes-section.open`, `.notes-body { display: none }`)
  - Removed Edit/Preview tab bar (`.notes-tabs`, `.notes-tab`)
  - Notes section now always visible; default state is **rendered markdown preview**
  - Empty state: `.notes-preview.empty::before` CSS pseudo-element shows *"No notes yet — click Edit to start writing."* in muted italic when there are no notes
  - New toolbar: "📝 PROJECT NOTES" label on left; **✏ Edit** and **✓ Save & Close** buttons on right (only one visible at a time)
  - `setupNotes()` rewritten with `enterEditMode()` / `exitEditMode()` helpers:
    - `enterEditMode()` — hides preview, shows textarea, swaps buttons
    - `exitEditMode()` — calls `renderPreview()`, hides textarea, shows preview, swaps buttons back, clears status
    - `renderPreview()` — runs `marked.parse()`, toggles `.empty` class for placeholder
  - **✓ Save & Close** clears the autosave timer, explicitly `await saveNotes()`, then calls `exitEditMode()` — guarantees the latest content is saved before leaving edit mode
  - Autosave (1.5s debounce) still runs while in edit mode
  - `h1:first-child` / `h2:first-child` margin-top reset added so headings don't add space at the very top of the preview

---



**Request:** Add a markdown notes editor above the Kanban board on each project page, saving across devices.

**Changes:**

- `Astro-Resume/src/pages/planner/board.astro`:
  - Added collapsible "📝 Project Notes" section between the page header and the board columns
  - Edit tab: monospace textarea with 1.5s debounced auto-save
  - Preview tab: full markdown rendering via `marked.parse()` — headings, bold/italic, code blocks, blockquotes, lists, tables, `---` dividers, links
  - Notes auto-expand on page load if the project already has saved notes; collapse if empty
  - Status bar shows: *Unsaved → Saving… (gold) → ✓ Saved (green, fades after 2.5s) → ✗ Failed (red)*
  - Added `setupNotes(initialNotes)` and `saveNotes(notes)` functions to the inline script
  - Updated `Project` TypeScript type to include `notes: string`
  - Notes are saved to `projects.notes` TEXT column in Supabase — syncs across all devices instantly
- `Astro-Resume/package.json`:
  - Added `marked` npm package for markdown-to-HTML rendering (bundled, not CDN)

**SQL migration required:**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
```

---

## [2026-04-08] — Planner in site nav, header polish

**Request:** Add a Planner button to the header of thelionsalliance.com on all pages. Remove the lion emoji from the planner header. Make clicking the "Lions Planner" title navigate back to thelionsalliance.com.

**Changes:**

- `Astro-Resume/src/pages/index.astro` — added `<a href="/planner/">Planner</a>` nav link
- `Astro-Resume/src/pages/games/index.astro` — added Planner nav link
- `Astro-Resume/src/pages/games/30-seconds/index.astro` — added Planner nav link
- `Astro-Resume/src/pages/games/charades/index.astro` — added Planner nav link
- `Astro-Resume/src/pages/games/songs-with-friends/index.astro` — added Planner nav link
- `Astro-Resume/src/pages/games/songs-with-friends/callback.astro` — added Planner nav link
- `Astro-Resume/src/pages/games/songs-with-friends/admin.astro` — added Planner nav link
- `Astro-Resume/src/pages/planner/index.astro`:
  - Removed 🦁 emoji from header
  - Changed "Lions Planner" heading to `<a href="/" class="header-logo">Lions Planner</a>` — links to thelionsalliance.com, turns blue on hover
- `Astro-Resume/src/pages/planner/login.astro`:
  - Removed emoji from heading
  - Added `← thelionsalliance.com` back-link at the top of the login card

---

## [2026-04-07] — Project drag-to-sort

**Request:** Allow reordering projects by drag and drop instead of always being sorted by creation date.

**Changes:**

- `Astro-Resume/src/pages/planner/index.astro`:
  - Added `⠿` drag-handle icon to each project card header (`.drag-handle` class); only the handle triggers drag — card body click still navigates to the board
  - Added `setupProjectSort()` using SortableJS with `handle: '.drag-handle'`
  - On drag end: all `sort_order` values batch-updated in Supabase via `Promise.all()` of parallel `.update()` calls
  - Projects now fetched `.order('sort_order', { ascending: true })` instead of `created_at`
  - New projects created with `sort_order: nextOrder` (max existing `sort_order` + 1) so they always land at the end
  - Projects grid changed from CSS `grid` (auto-fill) to `flex-wrap` with fixed `width: 310px` cards for reliable SortableJS reordering
  - Ghost class `proj-ghost` (dashed blue border) and chosen class `proj-chosen` (lifted, slightly rotated) for drag feedback

**SQL migration required:**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

WITH ranked AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at) - 1) AS rn FROM projects
)
UPDATE projects SET sort_order = ranked.rn FROM ranked WHERE projects.id = ranked.id;
```

---

## [2026-04-07] — Rich card UI + global style fix

**Request:** Add nice UI elements for project cards, task cards, and columns — they were still showing as unstyled text with plain buttons.

**Root cause identified and fixed:** Astro's `<style>` is scoped by default — it adds a hash attribute to HTML template elements and CSS selectors. Any elements built via `document.createElement()` or `innerHTML` in `<script>` blocks never receive the hash and so CSS never applied to them. Fix: changed all three planner files from `<style>` to `<style is:global>`.

**Changes:**

- `Astro-Resume/src/pages/planner/board.astro`:
  - Changed `<style>` → `<style is:global>`
  - Task cards: coloured left border per priority (red = high, gold = medium, green = low); ⠿ drag-dot handle in footer; footer row with formatted due date
  - Column headers: status dot (○◎◑●), uppercase label, task count badge, per-column empty state message
  - Columns have a minimum height and a dashed empty-state indicator when no tasks exist
- `Astro-Resume/src/pages/planner/index.astro`:
  - Changed `<style>` → `<style is:global>`
  - Project cards: coloured letter avatar (first letter of project name, tinted background), progress bar (% tasks done), task count meta line, status badge with dot symbol
- `Astro-Resume/src/pages/planner/login.astro`:
  - Changed `<style>` → `<style is:global>`

---

## [2026-04-07] — Dark theme matching thelionsalliance.com

**Request:** Give the planner the same dark theme as the main site (homepage, resume, games pages).

**Changes:**

- `Astro-Resume/src/pages/planner/board.astro`:
  - Full CSS rewrite to Lions Alliance palette: `#1d2327` bg, `#2c3338` cards, `#2271b1` blue, `#d4a32f` gold, `#1db954` green, `#f0f0f1` text, `#a7aaad` muted, `#3c434a` border
  - `STATUS_CONFIG` colours updated: backlog `#a7aaad`, todo `#5fa8d3`, in_progress `#d4a32f`, done `#1db954`
  - Column header dots added via `createColumn()` JS
- `Astro-Resume/src/pages/planner/index.astro` — same palette applied
- `Astro-Resume/src/pages/planner/login.astro` — same palette applied (`#2c3338` card, dark body)

---

## [2026-04-06] — Initial Lions Planner build

**Request:** Build a new Kanban-style project tracker at `/planner/`, similar to Jira/Trello, that syncs data across all devices. Use Supabase (PostgreSQL + Auth) as the backend since GitHub Pages is static-only (ASP.NET/Entity Framework cannot run on GitHub Pages).

**Decisions made:**
- Backend: **Supabase** (Postgres + Auth via `@supabase/supabase-js`)
- Auth: email + password, single owner account, public signups disabled
- Columns: **Backlog / Todo / In Progress / Done**
- Task fields: title, description, priority (high/medium/low), optional due date
- Drag-and-drop between columns: **SortableJS** (`group: 'tasks'`)
- No build-time server needed — all DB calls from the browser

**Files created:**

- `Astro-Resume/src/lib/supabase.ts` — Supabase client initialisation with project URL and publishable key
- `Astro-Resume/src/pages/planner/login.astro` — Login page; `supabase.auth.signInWithPassword()` on submit; redirects to `/planner/` on success; shows error on failure
- `Astro-Resume/src/pages/planner/index.astro` — Projects list page; session guard (redirect to login if not authenticated); create / edit / delete projects with name, description, colour picker; project cards link to the board
- `Astro-Resume/src/pages/planner/board.astro` — Kanban board; loads project by `?id=` query param; 4-column layout built dynamically via `createColumn()` + `createTaskCard()`; SortableJS drag-and-drop between columns with Supabase `status` update on drop; full task CRUD (add / edit / delete) via modal

**Files modified:**

- `Astro-Resume/package.json` — added `@supabase/supabase-js`, `sortablejs`, `@types/sortablejs`
- `Astro-Resume/public/robots.txt` — added `Disallow: /planner/`, `/planner/login`, `/planner/board`
- `Astro-Resume/astro.config.mjs` — added `/planner/` path filter to sitemap exclusion

**SQL to run in Supabase SQL Editor (initial schema):**
```sql
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  color       TEXT DEFAULT '#2271b1',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  status      TEXT DEFAULT 'backlog',
  priority    TEXT DEFAULT 'medium',
  due_date    DATE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_tasks"    ON tasks    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
