-- Add nullable reflection column on public.content.
-- PR 1 of two-PR rollout. Nullable + no default so a partial
-- migration cannot block reads; the frontend tolerates absence
-- and conditionally renders. PR 2 will backfill and tighten with
-- NOT NULL + CHECK (length(trim(reflection)) > 0).

alter table public.content
  add column reflection text;
