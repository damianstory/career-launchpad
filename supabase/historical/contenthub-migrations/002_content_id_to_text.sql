-- Migration: Change content.id from UUID to TEXT
-- This allows human-readable slugs as primary keys

-- Drop foreign key constraints first
ALTER TABLE content_categories DROP CONSTRAINT IF EXISTS content_categories_content_id_fkey;
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_content_id_fkey;
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_related_playbook_id_fkey;

-- Change content.id from UUID to TEXT
ALTER TABLE content ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE content ALTER COLUMN id DROP DEFAULT;

-- Change related_playbook_id to TEXT
ALTER TABLE content ALTER COLUMN related_playbook_id TYPE TEXT USING related_playbook_id::TEXT;

-- Change content_categories.content_id to TEXT
ALTER TABLE content_categories ALTER COLUMN content_id TYPE TEXT USING content_id::TEXT;

-- Change analytics_events.content_id to TEXT
ALTER TABLE analytics_events ALTER COLUMN content_id TYPE TEXT USING content_id::TEXT;

-- Recreate foreign key constraints
ALTER TABLE content_categories
  ADD CONSTRAINT content_categories_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES content(id);

ALTER TABLE content
  ADD CONSTRAINT content_related_playbook_id_fkey
  FOREIGN KEY (related_playbook_id) REFERENCES content(id);
