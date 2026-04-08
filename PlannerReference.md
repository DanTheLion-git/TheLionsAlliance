# Lions Planner — Reference Guide

A human-readable reference for everything you might want to tweak, extend, or debug in the **Lions Planner** at `thelionsalliance.com/planner/`.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Supabase setup & credentials](#2-supabase-setup--credentials)
3. [Running required SQL migrations](#3-running-required-sql-migrations)
4. [Authentication — adding / changing your user](#4-authentication--adding--changing-your-user)
5. [Adding a new project](#5-adding-a-new-project)
6. [Adding / editing tasks](#6-adding--editing-tasks)
7. [Drag-and-drop sorting](#7-drag-and-drop-sorting)
8. [Markdown project notes](#8-markdown-project-notes)
9. [Columns — changing statuses or colours](#9-columns--changing-statuses-or-colours)
10. [Project card colours](#10-project-card-colours)
11. [Priority levels](#11-priority-levels)
12. [Theme / design tokens](#12-theme--design-tokens)
13. [Deployment pipeline](#13-deployment-pipeline)
14. [File map](#14-file-map)

---

## 1. Architecture overview

The Lions Planner is a **static Astro site** (no server-side rendering) backed by **Supabase** (PostgreSQL + Auth) for persistent, cross-device data storage.

```
Browser ──► GitHub Pages (Astro static build)
               │
               └──► Supabase REST API
                       ├── projects table
                       └── tasks table
```

- **No server required.** All database calls are made from the browser via the `@supabase/supabase-js` v2 client.
- **Auth** uses Supabase Email+Password auth. Only one user (the owner) can log in — new signups are disabled.
- **Row Level Security (RLS)** is enabled on both tables. Only authenticated sessions can read/write data.
- All three planner pages use `<style is:global>` — this is intentional and required. Astro's default scoped styles don't apply to elements created with `document.createElement()`. Any dynamically built DOM (task cards, columns, project cards) must be styled globally.

---

## 2. Supabase setup & credentials

| Setting | Value |
|---|---|
| Project URL | `https://lqdwcofsznjehbblrlcs.supabase.co` |
| Publishable key | `sb_publishable_pyqcp5NRMGs8Cvo56Yd8MQ_vE3Wtyxq` |
| Client file | `Astro-Resume/src/lib/supabase.ts` |

The `sb_publishable_` prefix is Supabase's 2025 replacement for the JWT `anon` key. It is safe to commit publicly — all security comes from Row Level Security policies, not hiding this key.

To change credentials, edit `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  'https://YOUR-PROJECT.supabase.co',
  'sb_publishable_YOUR_KEY'
);
```

---

## 3. Running required SQL migrations

All SQL must be run in the **Supabase Dashboard → SQL Editor** for your project.

### Full initial schema

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  color       TEXT DEFAULT '#2271b1',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
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

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies (authenticated users only)
CREATE POLICY "auth_projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Migration: project drag-sort (sort_order on projects)

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Back-fill existing projects with ordered values
WITH ranked AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at) - 1) AS rn FROM projects
)
UPDATE projects SET sort_order = ranked.rn FROM ranked WHERE projects.id = ranked.id;
```

### Migration: per-project markdown notes

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
```

---

## 4. Authentication — adding / changing your user

### Add a user

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Set your email and password
3. Confirm the user

### Prevent public signups

1. Authentication → **Providers → Email**
2. Disable **"Allow new users to sign up"**

### Change your password

1. Supabase Dashboard → Authentication → Users
2. Click your user → **Send password reset** (or set directly in the dashboard)

### Session flow in the app

Every planner page checks `supabase.auth.getSession()` on load. If no active session is found, the user is redirected to `/planner/login`. After login, Supabase stores the session token in `localStorage` — subsequent visits skip the login automatically until the session expires or the user logs out.

---

## 5. Adding a new project

In the planner UI:

1. Navigate to `thelionsalliance.com/planner/`
2. Click **+ New Project**
3. Fill in name, description, and pick a colour
4. Click **Create**

The new project card appears at the end of the grid and gets `sort_order = max + 1` automatically.

To **edit** a project, click the ✏ (edit) icon on the project card. To **delete**, click the 🗑 (delete) icon — this also deletes all tasks in that project (cascades via the foreign key).

---

## 6. Adding / editing tasks

On any project's board page:

1. Click **+ Add Task** in the column header where you want the task to start (Backlog / Todo / In Progress / Done)
2. Fill in title, optional description, priority, and optional due date
3. Click **Add Task**

To **edit** a task, click the ✏ icon on the task card.
To **delete** a task, click the 🗑 icon on the task card.
To **move** a task between columns, drag and drop it. The `status` field in Supabase updates automatically on drop.

---

## 7. Drag-and-drop sorting

### Task reordering (within and between columns)

Powered by **SortableJS** with `group: 'tasks'` so cards can move freely between all four columns. On drag end:

- The task's `status` is updated to the destination column's status key
- The task's `sort_order` is updated to reflect its new position within that column
- Updates are written to Supabase immediately

### Project reordering (on the projects list)

Powered by **SortableJS** with `handle: '.drag-handle'`. The ⠿ grip icon in the top-left of each project card is the only drag trigger — clicking anywhere else on the card still navigates to the board.

On drag end, all `sort_order` values for all projects are batch-updated in Supabase via `Promise.all()`.

Projects are always fetched `.order('sort_order', { ascending: true })` so the saved order is always respected on load.

---

## 8. Markdown project notes

Each project has a collapsible **Notes** section above the Kanban board.

### Behaviour

- The section is **always visible** above the board — never collapsed
- **Default (view mode)**: shows rendered markdown. Empty state shows *"No notes yet — click Edit to start writing."* in muted italic
- Click **✏ Edit** to enter edit mode: the preview hides and the textarea appears
- **Auto-saves** 1.5 seconds after you stop typing — no manual save needed
- Click **✓ Save & Close** to explicitly save and return to the rendered preview
- Saves to the `notes` TEXT column on the `projects` table in Supabase

### Markdown supported

| Syntax | Renders as |
|---|---|
| `# Heading` | `<h1>` through `<h6>` |
| `**bold**` / `*italic*` | Bold / italic |
| `` `inline code` `` | Inline code |
| ` ```code block``` ` | Fenced code block |
| `> blockquote` | Blockquote |
| `- item` / `1. item` | Unordered / ordered list |
| `---` | Horizontal rule |
| `[text](url)` | Hyperlink |
| `\| col \|` table syntax | Table |

### Status indicator

| State | Colour | Meaning |
|---|---|---|
| Unsaved | muted grey | No changes since last save |
| Saving… | gold `#d4a32f` | Debounce timer fired, request in flight |
| ✓ Saved | green `#1db954` | Write succeeded (fades after 2.5s) |
| ✗ Failed | red | Supabase write failed |

### Implementation details

- Uses the `marked` npm package (imported in the bundled `<script>` — no CDN)
- `marked.parse(raw)` returns a string synchronously in v14+
- The rendered HTML is injected as `previewEl.innerHTML = marked.parse(editor.value) as string`

---

## 9. Columns — changing statuses or colours

The four columns are defined in the `STATUS_CONFIG` object at the top of the `<script>` in `board.astro`:

```js
const STATUS_CONFIG = {
  backlog:     { label: 'Backlog',     dot: '○', color: '#a7aaad' },
  todo:        { label: 'Todo',        dot: '◎', color: '#5fa8d3' },
  in_progress: { label: 'In Progress', dot: '◑', color: '#d4a32f' },
  done:        { label: 'Done',        dot: '●', color: '#1db954' },
};
```

To add a column, add a new key here and add it to the `STATUSES` array just below:

```js
const STATUSES = ['backlog', 'todo', 'in_progress', 'done'];
```

**Note:** The `status` values must match what is stored in the `tasks.status` column in Supabase. If you rename a status key, also update any existing task rows.

---

## 10. Project card colours

When creating a project, you pick a colour using the colour picker in the "New Project" modal. This colour is stored as a hex string in `projects.color`.

The project card uses this colour for:
- The large letter **avatar** in the top-left (letter coloured, background at 18% opacity)
- The left-border accent on the card
- The coloured dot next to the project title on the board header

To change a project's colour after creation, use the edit modal (✏ icon).

---

## 11. Priority levels

Tasks have three priority levels, stored as a string in `tasks.priority`:

| Value | Left border colour | Label |
|---|---|---|
| `high` | `#dc3545` red | High |
| `medium` | `#d4a32f` gold | Medium |
| `low` | `#1db954` green | Low |

The coloured left border on each task card is applied via CSS class `.priority-high`, `.priority-medium`, `.priority-low` in the `<style is:global>` block of `board.astro`.

---

## 12. Theme / design tokens

The planner uses its own inline styles (not `global.css`) but intentionally matches the Lions Alliance site palette:

| Token | Value | Usage |
|---|---|---|
| Background | `#1d2327` | Page background, body |
| Surface | `#2c3338` | Cards, modals, header |
| Border | `#3c434a` | Dividers, card edges |
| Text primary | `#f0f0f1` | Headings, labels |
| Text muted | `#a7aaad` | Secondary text, hints |
| Accent blue | `#2271b1` | Buttons (primary) |
| Accent blue light | `#5fa8d3` | Hover states, focus rings |
| Gold | `#d4a32f` | In-progress, warnings |
| Green | `#1db954` | Done, success states |
| Red | `#dc3545` | High priority, errors |
| Header blur | `rgba(9,11,8,0.88)` | Sticky header background |

All values are hardcoded directly in `<style is:global>` blocks in each planner `.astro` file — they are not sourced from CSS variables, unlike the main site.

---

## 13. Deployment pipeline

The planner is a set of Astro pages inside the same repo as the main site — no separate deployment needed.

```
Commit → push to DanTheLion-git/DanTheLion-Resume (main branch)
  → GitHub Actions: cd Astro-Resume && npm ci && npm run build
  → Deploys Astro-Resume/dist/ to thelionsalliance.com
```

- `/planner/` → `Astro-Resume/src/pages/planner/index.astro`
- `/planner/login` → `Astro-Resume/src/pages/planner/login.astro`
- `/planner/board` → `Astro-Resume/src/pages/planner/board.astro`

The planner pages are excluded from the sitemap and blocked in `robots.txt`:

```
# robots.txt
Disallow: /planner/
Disallow: /planner/login
Disallow: /planner/board
```

**Note:** The blog route (`blog/[slug].astro`) fetches from `public-api.wordpress.com` at build time. On your local machine this fails with `ENOTFOUND` (no internet during build). This is pre-existing and does not affect the deployed site — GitHub Actions has internet access. Run `npm run build` locally only to check for TypeScript/Astro errors; expect the blog error and ignore it.

---

## 14. File map

```
Astro-Resume/
├── src/
│   ├── lib/
│   │   └── supabase.ts              ← Supabase client (URL + publishable key)
│   └── pages/
│       └── planner/
│           ├── login.astro          ← Login page (email + password)
│           ├── index.astro          ← Projects list (drag-sort, new/edit/delete)
│           └── board.astro          ← Kanban board (4 columns, tasks, notes)
├── package.json                     ← includes @supabase/supabase-js, sortablejs, marked
└── public/
    └── robots.txt                   ← /planner/ disallowed
```

### Key constants / entry points per file

| File | Key items |
|---|---|
| `supabase.ts` | `createClient(url, key)` — import this in every planner page |
| `login.astro` | `supabase.auth.signInWithPassword()` on form submit |
| `index.astro` | `PROJECTS` array, `setupProjectSort()`, `renderProjects()`, `createProjectCard()` |
| `board.astro` | `STATUS_CONFIG`, `STATUSES`, `loadBoard()`, `renderBoard()`, `createColumn()`, `createTaskCard()`, `setupSortable()`, `setupNotes()`, `saveNotes()` |
