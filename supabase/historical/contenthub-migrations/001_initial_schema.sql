-- Content Hub Database Schema
-- Version: 1.0.0
-- Date: January 9, 2026

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content table (all content types)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'playbook')),
  thumbnail_url TEXT NOT NULL,

  -- Video-specific fields
  video_url TEXT, -- YouTube URL
  video_orientation TEXT CHECK (video_orientation IN ('vertical', 'horizontal')),
  video_duration INTEGER, -- seconds

  -- Article-specific fields
  article_content TEXT, -- MDX content for original articles
  article_embed_url TEXT, -- URL for curated external articles
  article_source_name TEXT, -- Display name for fallback UI

  -- Playbook-specific fields
  playbook_content TEXT, -- MDX content

  -- Common fields
  reading_time_minutes INTEGER, -- For articles and playbooks
  related_playbook_id UUID REFERENCES content(id),
  published_at TIMESTAMPTZ NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT video_fields_required CHECK (
    content_type != 'video' OR (video_url IS NOT NULL AND video_orientation IS NOT NULL)
  ),
  CONSTRAINT article_exclusive CHECK (
    content_type != 'article' OR (
      (article_content IS NOT NULL AND article_embed_url IS NULL) OR
      (article_content IS NULL AND article_embed_url IS NOT NULL)
    )
  ),
  CONSTRAINT playbook_content_required CHECK (
    content_type != 'playbook' OR playbook_content IS NOT NULL
  )
);

-- Content-Categories junction table (many-to-many)
CREATE TABLE content_categories (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

-- Provinces table (hardcoded data)
CREATE TABLE provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'ON', 'BC'
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- School boards table (hardcoded data)
CREATE TABLE school_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  content_id UUID REFERENCES content(id),
  province_code TEXT,
  school_board_id UUID REFERENCES school_boards(id),
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_content_published ON content(is_published, published_at DESC);
CREATE INDEX idx_content_type ON content(content_type) WHERE is_published = true;
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_school_boards_province ON school_boards(province_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);

-- Seed categories
INSERT INTO categories (slug, name, icon, display_order) VALUES
  ('emerging-careers', 'Emerging Careers/Industries', 'Rocket', 1),
  ('day-in-the-life', 'Day in the Life/On the Job', 'Briefcase', 2),
  ('life-skills', 'Life Skills', 'Lightbulb', 3),
  ('mindsets', 'Mindsets/Mental Models', 'Brain', 4),
  ('how-i-got-here', 'How I Got Here', 'Route', 5),
  ('problems-to-solve', 'Problems to be Solved', 'Puzzle', 6),
  ('post-secondary', 'Post-Secondary Perspectives', 'GraduationCap', 7);

-- Seed Canadian provinces
INSERT INTO provinces (code, name, display_order) VALUES
  ('AB', 'Alberta', 1),
  ('BC', 'British Columbia', 2),
  ('MB', 'Manitoba', 3),
  ('NB', 'New Brunswick', 4),
  ('NL', 'Newfoundland and Labrador', 5),
  ('NS', 'Nova Scotia', 6),
  ('NT', 'Northwest Territories', 7),
  ('NU', 'Nunavut', 8),
  ('ON', 'Ontario', 9),
  ('PE', 'Prince Edward Island', 10),
  ('QC', 'Quebec', 11),
  ('SK', 'Saskatchewan', 12),
  ('YT', 'Yukon', 13);

-- Sample school boards for Ontario (largest province)
INSERT INTO school_boards (province_id, name, display_order)
SELECT
  p.id,
  board.name,
  board.display_order
FROM provinces p
CROSS JOIN (
  VALUES
    ('Toronto District School Board', 1),
    ('Peel District School Board', 2),
    ('York Region District School Board', 3),
    ('Ottawa-Carleton District School Board', 4),
    ('Durham District School Board', 5),
    ('Halton District School Board', 6),
    ('Hamilton-Wentworth District School Board', 7),
    ('Waterloo Region District School Board', 8),
    ('Thames Valley District School Board', 9),
    ('Simcoe County District School Board', 10)
) AS board(name, display_order)
WHERE p.code = 'ON';

-- Sample school boards for British Columbia
INSERT INTO school_boards (province_id, name, display_order)
SELECT
  p.id,
  board.name,
  board.display_order
FROM provinces p
CROSS JOIN (
  VALUES
    ('Vancouver School Board', 1),
    ('Surrey School District', 2),
    ('Burnaby School District', 3),
    ('Richmond School District', 4),
    ('Coquitlam School District', 5)
) AS board(name, display_order)
WHERE p.code = 'BC';

-- Sample school boards for Alberta
INSERT INTO school_boards (province_id, name, display_order)
SELECT
  p.id,
  board.name,
  board.display_order
FROM provinces p
CROSS JOIN (
  VALUES
    ('Calgary Board of Education', 1),
    ('Edmonton Public Schools', 2),
    ('Calgary Catholic School District', 3),
    ('Edmonton Catholic Schools', 4)
) AS board(name, display_order)
WHERE p.code = 'AB';

-- Enable Row Level Security (RLS) for public read access
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to published content"
  ON content FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Allow public read access to content_categories"
  ON content_categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to provinces"
  ON provinces FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to school_boards"
  ON school_boards FOR SELECT
  TO anon
  USING (true);

-- Analytics: public insert, no read
CREATE POLICY "Allow public insert to analytics_events"
  ON analytics_events FOR INSERT
  TO anon
  WITH CHECK (true);
