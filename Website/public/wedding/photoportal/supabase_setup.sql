-- WeddingCamBox — Supabase Database Setup
-- Paste this entire script into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zxiwsjjvigrxrgkxalet/sql/new
-- Then click "Run" to execute.

-- ============================================================
-- 1. CLIENTS TABLE — replaces hardcoded USERS + CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS wcb_clients (
  id          TEXT PRIMARY KEY,              -- e.g. 'bob-linda'
  password    TEXT NOT NULL,                 -- plain text (simple auth for now)
  name        TEXT NOT NULL,                 -- e.g. 'Bob & Linda'
  wedding     TEXT,                          -- display date, e.g. '15 March 2025'
  wedding_date DATE,                        -- sortable date, e.g. '2025-03-15'
  package     TEXT DEFAULT 'Standard',       -- Basic / Standard / Premium
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PHOTOS TABLE — replaces localStorage photo arrays
-- ============================================================
CREATE TABLE IF NOT EXISTS wcb_photos (
  id          TEXT PRIMARY KEY,              -- e.g. 'up_1714500000_0'
  client_id   TEXT NOT NULL REFERENCES wcb_clients(id) ON DELETE CASCADE,
  title       TEXT,
  datetime    TIMESTAMPTZ DEFAULT NOW(),
  camera      TEXT DEFAULT 'Uploaded',
  url         TEXT NOT NULL,                 -- Cloudinary full-res URL
  thumb       TEXT NOT NULL,                 -- Cloudinary thumbnail URL
  deleted     BOOLEAN DEFAULT FALSE,         -- TRUE = in recycle bin
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_client ON wcb_photos(client_id);

-- ============================================================
-- 3. GUESTS TABLE — replaces localStorage guest lists
-- ============================================================
CREATE TABLE IF NOT EXISTS wcb_guests (
  id          TEXT PRIMARY KEY,              -- e.g. 'g_1714500000'
  client_id   TEXT NOT NULL REFERENCES wcb_clients(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_client ON wcb_guests(client_id);

-- ============================================================
-- 4. BOOKING REQUESTS TABLE — replaces localStorage requests
-- ============================================================
CREATE TABLE IF NOT EXISTS wcb_booking_requests (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  wedding_date DATE,
  guests       TEXT,
  package      TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'pending',       -- pending / approved / declined
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. CLIENT STATE TABLE — tracks link-sent status etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS wcb_client_state (
  client_id   TEXT PRIMARY KEY REFERENCES wcb_clients(id) ON DELETE CASCADE,
  link_sent   BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ
);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE wcb_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wcb_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wcb_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wcb_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wcb_client_state ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read/write all tables (simple auth via app-level password check)
-- In production you'd use Supabase Auth, but for a small operation this is fine.
CREATE POLICY "anon_all_clients" ON wcb_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_photos"  ON wcb_photos  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_guests"  ON wcb_guests  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_requests" ON wcb_booking_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_state"   ON wcb_client_state FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 7. SEED DATA — admin account + demo customers
-- ============================================================
INSERT INTO wcb_clients (id, password, name, is_admin) VALUES
  ('admin', 'Hondje01', 'Admin', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wcb_clients (id, password, name, wedding, wedding_date, package) VALUES
  ('demo', 'wedding2025', 'Sophie & Liam', '12 April 2025', '2025-04-12', 'Standard')
ON CONFLICT (id) DO NOTHING;
